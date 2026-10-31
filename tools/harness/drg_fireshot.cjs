// 불 그림 전후 사진(팀 K · 1-2 지붕 불 · 9-2·9-1 나이트메어 몸 불): node tools/harness/drg_fireshot.cjs <root> <out폴더> [이름표]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || '/tmp/drg_fire'), TAG = process.argv[4] || 'x';
fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const SHOTS = [
  { q: 'ch=1&step=2&diff=normal', id: '1-2', at: [6, 18, 32, 50], name: 'roof' },
  { q: 'ch=9&step=1&diff=normal', id: '9-2', at: [2, 5, 9, 14], name: 'nm' },
  { q: 'ch=9&step=0&diff=normal', id: '9-1', at: [3, 8], name: 'nm1' },
];
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  for (const S of SHOTS) {
    await p.goto(`${base}/dragon/?${S.q}&chain=0&seed=1&mode=smooth`);
    await p.waitForFunction((id) => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id === id && !DRG.sense().busy, S.id, { timeout: 120000 });
    let t0 = Date.now();
    for (const a of S.at) {
      const w = a * 1000 - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w);
      const f = await p.evaluate(() => { const f = DRG.perf(); return { calls: f.calls, tris: f.tris, fps: f.fps }; });
      const file = `${S.name}_${a}s_${TAG}.jpg`; await p.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 70 });
      console.log(file, JSON.stringify(f));
    }
  }
  console.log('오류', errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); srv.close();
});
