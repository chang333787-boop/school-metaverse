// 드래곤 2D판(탑뷰) 장 봇 시험: node tools/harness/drg2d_story.cjs [repo=.] [--ch=0,1,2] [--only=1-2,1-3] [--levels=easy,normal] [--dumb=1] [--kinds=idle,fmash] [--turbo=4]
//   차례마다 ① 쉬움 봇·보통 봇이 입력만으로 깸(놀이 시간 = 걸음 ÷ 60) ② 가만히·F 연타·F 누른 채·Space 연타·→ 누른 채 F 연타 봇은 제한 ×2 동안 못 깸(동사 없는 이음 차례 · free = 실패 없는 맛보기 비행은 건너뜀)
//   페이지 오류 0 · 그리기는 켬(CPU 흉내 X) — tools/ops/b2.sh로 돌린다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const KINDS = arg('kinds', '').split(',').filter(Boolean);
const CHS = arg('ch', '0,1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number), ONLY = arg('only', ''), LEVELS = arg('levels', 'easy,normal').split(',').filter((x) => x && x !== 'none'), DUMB = arg('dumb', '1') === '1', TURBO = +arg('turbo', 4);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const rows = [], fails = [];
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  let errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  async function open(ch, step, diff) {
    await p.goto(`${base}/dragon2d/?ch=${ch}&step=${step}&diff=${diff}&chain=0&turbo=${TURBO}&seed=1&mode=smooth`);
    await p.waitForFunction(() => window.DRG2 && DRG2.sense && DRG2.sense().id && !DRG2.sense().busy, null, { timeout: 60000 });
  }
  async function runBot(kind, level, limitSec) {
    return p.evaluate(async ({ kind, level, limitSec }) => {
      const m = await import('/dragon2d/js/bots/bots.js?v=1');
      const s0 = DRG2.sense(), n0 = DRG2.loop.n;
      DRG2.bot.run(kind === 'story' ? m.storyBot(level) : m.dumbBot(kind));
      const trail = []; let lastT = -99;
      return await new Promise((res) => { const iv = setInterval(() => { const s = DRG2.sense(), sec = (DRG2.loop.n - n0) / 60; if (sec - lastT > 10 && s.me) { lastT = sec; trail.push([Math.round(sec), s.me.x, s.me.y]); }
        if (s.idx !== s0.idx || s.done || s.ch !== s0.ch) { clearInterval(iv); DRG2.bot.stop(); res({ ok: true, sec: +sec.toFixed(1) }); }
        else if (sec > limitSec) { clearInterval(iv); DRG2.bot.stop(); res({ ok: false, sec: +sec.toFixed(1), last: JSON.stringify(s, (k, v) => (Array.isArray(v) && v.length > 6 ? '[' + v.length + ']' : v)).slice(0, 700) + ' errs ' + JSON.stringify(DRG2.diag().errs.slice(-3)) + ' trail ' + JSON.stringify(trail) }); } }, 100); });
    }, { kind, level, limitSec });
  }
  try {
    for (const ch of CHS) {
      await open(ch, 0, 'normal');
      const steps = await p.evaluate(async (ch) => (await import('/dragon2d/js/story/ch' + ch + '.js?v=1')).chapter.steps.map((s) => ({ id: s.id || '', verb: s.free ? '' : s.verb || '', limit: s.limit || 90 })), ch);
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i]; if (ONLY && !ONLY.split(',').includes(st.id)) continue;
        for (const lv of LEVELS) {
          errs = [];
          await open(ch, i, lv);
          const r = await runBot('story', lv, st.limit * 1.5);
          rows.push([st.id, st.verb || '(이음)', lv + ' 봇', r.ok ? '깸 ' + r.sec + '초' : '못 깸']);
          if (!r.ok) fails.push(st.id + ' ' + lv + ' 봇 못 깸 ' + (r.last || ''));
          if (errs.length) fails.push(st.id + ' ' + lv + ' 오류 ' + errs.slice(0, 2).join(' / '));
          console.log(rows[rows.length - 1].join(' | '));
        }
        if (DUMB && st.verb) {
          for (const [kind, lab] of [['idle', '가만히'], ['fmash', 'F 연타'], ['fhold', 'F 누른 채'], ['smash', 'Space 연타'], ['wfmash', '→+F 연타']]) {
            if (KINDS.length && !KINDS.includes(kind)) continue;
            await open(ch, i, 'normal');
            const r = await runBot(kind, 'normal', st.limit * 2);
            rows.push([st.id, st.verb, lab, r.ok ? '깸(✗) ' + r.sec + '초' : '못 깸 ✓']);
            if (r.ok) fails.push(st.id + ' ' + lab + ' 봇이 깸');
            console.log(rows[rows.length - 1].join(' | '));
          }
        }
      }
    }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 300)); console.log('예외', e.message); }
  await b.close(); srv.close();
  console.log('\n' + (fails.length ? '실패 ' + fails.length + ':\n  ' + fails.join('\n  ') : '모두 통과'));
  process.exit(fails.length ? 1 : 0);
});
