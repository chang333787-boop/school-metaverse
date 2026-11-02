// 드래곤 2D판 크롬북 흉내 성능: node tools/harness/drg2d_perf.cjs [repo=.] [--sec=15] [--cpu=4] [--spots=1-2,1-3,…]
//   CrOS UA · 1366×768 · dpr 1 · CPU ×N(CDP) · ⚡ 모드(?mode=smooth) · 고정 해상도(?adapt=0) · 자리마다 보통 봇이 실제 시간으로 노는 동안 프레임 간격 p95 · 일(그리기+걸음) p95 · 50ms 넘는 프레임 · 힙
//   판정: p95 ≤ 33ms(goal §7) — 흉내 값(실제 크롬북 ?bench=1 전)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const SEC = +arg('sec', 15), CPU = +arg('cpu', 4);
const SPOTS = arg('spots', '0-1,1-2,1-3,2-2,3-1,4-2,6-1,6-2,8-3,10-1,10-3,11-3').split(',');
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  let errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  const rows = [];
  for (const sp of SPOTS) {
    const [ch, k] = sp.split('-').map(Number);
    const steps = await (async () => { try { await p.goto(`${base}/dragon2d/?ch=${ch}&step=0&chain=0&diff=normal&mode=smooth&adapt=0&seed=1&card=0`); await p.waitForFunction(() => window.DRG2 && DRG2.sense().id, null, { timeout: 30000 }); return await p.evaluate(async (ch) => (await import('/dragon2d/js/story/ch' + ch + '.js?v=1')).chapter.steps.map((s) => s.id), ch); } catch (e) { return []; } })();
    const idx = steps.indexOf(sp); if (idx < 0) { rows.push([sp, '없음']); console.log(sp + ' 없음'); continue; }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.goto(`${base}/dragon2d/?ch=${ch}&step=${idx}&chain=0&diff=normal&mode=smooth&adapt=0&seed=1&card=0`);
    await p.waitForFunction(() => window.DRG2 && DRG2.sense().id && !DRG2.sense().busy, null, { timeout: 30000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const r = await p.evaluate(async (SEC) => {
      const m = await import('/dragon2d/js/bots/bots.js?v=1'); DRG2.bot.run(m.storyBot('normal'));
      await new Promise((s) => setTimeout(s, 1500)); DRG2.perfReset();
      const long = []; let last = performance.now(), n50 = 0, run = true;
      const f = (t) => { if (!run) return; if (t - last > 50) n50++; last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
      await new Promise((s) => setTimeout(s, SEC * 1000)); run = false;
      DRG2.bot.stop(); const pf = DRG2.perf(); return { p95: pf.p95, max: pf.max, work: pf.workP95, fps: pf.fps, n50, heap: pf.heap, fx: pf.fx, items: pf.items, chunks: pf.chunks, id: DRG2.sense().id };
    }, SEC);
    rows.push([sp, `p95 ${r.p95}ms`, `일 p95 ${r.work}ms`, `fps ${r.fps}`, `50ms↑ ${r.n50}`, `최대 ${r.max}`, `힙 ${r.heap}MB`, `알갱이 ${r.fx}`, `조각 ${r.chunks}`, r.p95 <= 33 ? '✓' : '✗', '(끝 차례 ' + r.id + ')']);
    console.log(rows[rows.length - 1].join(' | '));
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await b.close(); srv.close();
  const bad = rows.filter((r) => r[9] === '✗');
  console.log('\n오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' / ') : '') + ' · ' + (bad.length ? '넘음 ' + bad.map((r) => r[0]).join(',') : '모두 p95 ≤ 33ms'));
  process.exit(bad.length || errs.length ? 1 : 0);
});
