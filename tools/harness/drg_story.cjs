// 드래곤 이야기 장 봇 시험: node tools/harness/drg_story.cjs [repo=.] [--ch=4] [--only=4-3,4-5] [--levels=easy,normal] [--dumb=1] [--turbo=8]
//   차례마다 ① 쉬움 봇·보통 봇이 입력만으로 깸(걸린 놀이 시간) ② 가만히·F 연타·F 누른 채·Space 연타·W 누른 채 F 연타 봇은 제한 ×2 동안 못 깸(이음 차례 · 쉬움에서 빠진 차례는 건너뜀)
//   ?turbo=8로 빨리(놀이 시간 = 걸음 수 ÷ 60) · 페이지 오류 0 · 무거운 시험이 아님(그리기는 켬 · CPU 흉내 X) — tools/ops/b2.sh로 돌린다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const CHS = arg('ch', '2,3,4,5,6').split(',').map(Number), ONLY = arg('only', ''), LEVELS = arg('levels', 'easy,normal').split(',').filter((x) => x && x !== 'none'), DUMB = arg('dumb', '1') === '1', TURBO = +arg('turbo', 8);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const rows = [], fails = [];
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  let errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|404|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  async function open(ch, step, diff) {
    await p.goto(`${base}/dragon/?ch=${ch}&step=${step}&diff=${diff}&chain=0&turbo=${TURBO}&seed=1&mode=smooth`);
    await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id && !DRG.sense().busy, null, { timeout: 90000 });
  }
  async function runBot(kind, level, key, limitSec) {   // → { ok, sec }
    return p.evaluate(async ({ kind, level, key, limitSec, V }) => {
      const m = await import('/dragon/js/bots/story_bots.js?v=' + V);
      const s0 = DRG.sense(), n0 = DRG.loop.n;
      DRG.bot.run(kind === 'story' ? m.storyBot(level) : m.dumbBot(kind, key));
      const trail = []; let lastT = -99;
      return await new Promise((res) => { const iv = setInterval(() => { const s = DRG.sense(), sec = (DRG.loop.n - n0) / 60; if (sec - lastT > 15 && s.me) { lastT = sec; trail.push([Math.round(sec), s.me.x, s.me.z, DRG.input.heldList().join('+')]); }
        if (s.idx !== s0.idx || s.done || s.ch !== s0.ch) { clearInterval(iv); DRG.bot.stop(); res({ ok: true, sec: +sec.toFixed(1), fails: s0.fails }); }
        else if (sec > limitSec) { clearInterval(iv); DRG.bot.stop(); res({ ok: false, sec: +sec.toFixed(1), last: JSON.stringify(s, (k, v) => (Array.isArray(v) && v.length > 6 ? '[' + v.length + ']' : v)).slice(0, 600) + ' errs ' + JSON.stringify(DRG.diag().errs.slice(-3)) + ' trail ' + JSON.stringify(trail) }); } }, 100); });
    }, { kind, level, key, limitSec, V });
  }
  try {
    for (const ch of CHS) {
      await open(ch, 0, 'normal');
      const steps = await p.evaluate(async ({ ch, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.map(s => ({ id: s.id || '', verb: s.verb || '', easy: s.easy, limit: s.limit || 120 })), { ch, V });
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i]; if (ONLY && !ONLY.split(',').includes(st.id)) continue;
        for (const lv of LEVELS) {
          errs = [];
          await open(ch, i, lv);
          const r = await runBot('story', lv, '', st.limit * 1.5);
          const skip = lv === 'easy' && st.easy === false;
          rows.push([st.id, st.verb || '(이음)', lv + ' 봇', r.ok ? '깸 ' + r.sec + '초' : '못 깸', skip ? '(쉬움 책 쪽)' : '']);
          if (!r.ok) fails.push(st.id + ' ' + lv + ' 봇 못 깸 ' + (r.last || ''));
          if (errs.length) fails.push(st.id + ' ' + lv + ' 오류 ' + errs.slice(0, 2).join(' / '));
          console.log(rows[rows.length - 1].join(' | '));
        }
        if (DUMB && st.verb) {
          for (const [kind, key, lab] of [['idle', '', '가만히'], ['mash', 'KeyF', 'F 연타'], ['hold', 'KeyF', 'F 누른 채'], ['mash', 'Space', 'Space 연타'], ['walkmash', 'KeyF', 'W+F 연타']]) {
            await open(ch, i, 'normal');
            const r = await runBot(kind, 'normal', key, st.limit * 2);
            rows.push([st.id, st.verb, lab, r.ok ? '깸(✗) ' + r.sec + '초' : '못 깸 ✓', '']);
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
