// 드래곤 쉬지 않는 놀이 기록(goal §7 · §9-6): node tools/harness/drg_long.cjs [repo=.] [--min=40] [--level=normal]
//   크롬북 흉내(CrOS UA · 1366×768 · CPU 4×) · 오프닝부터 장을 이어서(chain) 보통 봇이 입력만으로 놂(turbo 없음 = 실제 시간) · 1분마다 fps·p95·힙·장 기록 · 오류 0
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const MIN = +arg('min', 40), LEVEL = arg('level', 'normal');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  await p.goto(`${base}/dragon/?ch=0&step=0&diff=${LEVEL}&seed=1&mode=smooth`);
  await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id, null, { timeout: 120000 });
  await p.evaluate(async ({ LEVEL, V }) => { const m = await import('/dragon/js/bots/story_bots.js?v=' + V); DRG.bot.run(m.storyBot(LEVEL)); }, { LEVEL, V });
  const rows = [];
  for (let k = 1; k <= MIN; k++) {
    await p.waitForTimeout(60000);
    const r = await p.evaluate(() => { const f = DRG.perf(), s = DRG.sense(); return { ch: s.ch, id: s.id, fps: f.fps, p95: f.p95, calls: f.calls, tris: Math.round(f.tris / 1000), heap: f.heapMB, long: f.long50 }; });
    rows.push(r); console.log(k + '분 · ' + r.id + ' · fps ' + r.fps + ' · p95 ' + r.p95 + 'ms · 그리기 ' + r.calls + ' · 삼각형 ' + r.tris + 'k · 힙 ' + r.heap + 'MB · 50ms 넘는 프레임 ' + r.long);
  }
  const hs = rows.map(r => r.heap || 0), ps = rows.map(r => r.p95);
  console.log('\n힙 ' + Math.min(...hs) + '~' + Math.max(...hs) + 'MB · p95 최대 ' + Math.max(...ps) + 'ms · 장 ' + [...new Set(rows.map(r => r.ch))].join('→') + ' · 오류 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));
  await b.close(); srv.close();
});
