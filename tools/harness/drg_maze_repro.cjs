// 4-1 내더 미로 재현(팀 G · 임시): node tools/harness/drg_maze_repro.cjs [repo=.] [--cpu=4] [--turbo=1] [--sec=240] [--level=normal] [--runs=1]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const CPU = +arg('cpu', 4), TURBO = +arg('turbo', 1), SEC = +arg('sec', 240), LEVEL = arg('level', 'normal'), RUNS = +arg('runs', 1);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  if (CPU > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  for (let run = 0; run < RUNS; run++) {
    await p.goto(`${base}/dragon/?ch=4&step=0&diff=${LEVEL}&chain=0&seed=${run + 1}&mode=smooth${TURBO > 1 ? '&turbo=' + TURBO : ''}`);
    await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id === '4-1' && !DRG.sense().busy, null, { timeout: 120000 });
    const r = await p.evaluate(async ({ LEVEL, V, SEC }) => {
      const m = await import('/dragon/js/bots/story_bots.js?v=' + V);
      const n0 = DRG.loop.n, t0 = performance.now(); DRG.bot.run(m.storyBot(LEVEL));
      const log = []; let lastLog = -9;
      return await new Promise((res) => { const iv = setInterval(() => { const s = DRG.sense(), sim = (DRG.loop.n - n0) / 60, real = (performance.now() - t0) / 1000;
        if (sim - lastLog >= 2 && s.me) { lastLog = sim; log.push([+sim.toFixed(0), +real.toFixed(0), s.me.x, s.me.z, s.me.low ? 'L' : '-', s.nadder ? [s.nadder.x, s.nadder.z, s.nadder.spines] : null, s.seen ? 'SEEN' : '', s.fails, DRG.input.heldList().join('+'), DRG.perf().fps]); }
        if (s.id !== '4-1' || s.done) { clearInterval(iv); DRG.bot.stop(); res({ ok: true, sim: +sim.toFixed(1), real: +real.toFixed(1), log }); }
        else if (real > SEC) { clearInterval(iv); DRG.bot.stop(); res({ ok: false, sim: +sim.toFixed(1), real: +real.toFixed(1), log }); } }, 100); });
    }, { LEVEL, V, SEC });
    console.log('run ' + run + ' ' + (r.ok ? '깸' : '못 깸') + ' 놀이 ' + r.sim + '초 · 실제 ' + r.real + '초');
    for (const l of r.log) console.log('  ' + JSON.stringify(l));
  }
  console.log('오류 ' + errs.length + ' ' + errs.slice(0, 3).join(' / '));
  await b.close(); srv.close();
});
