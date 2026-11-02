// 드래곤 2D판 장면 사진: node tools/harness/drg2d_shot.cjs [repo=.] --out=<폴더> --spots=1-2:3,4-2:6 [--diff=normal]
//   자리마다(장-차례:초) 그 차례를 보통 봇이 그 초만큼 논 뒤 1366×768 사진 · 눈으로 결·배치를 보는 용도
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const OUT = arg('out', '/tmp'), DIFF = arg('diff', 'normal'), SPOTS = arg('spots', '1-2:3').split(',');
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  fs.mkdirSync(OUT, { recursive: true });
  for (const sp of SPOTS) {
    const [id, sec] = sp.split(':'); const [ch] = id.split('-').map(Number);
    await p.goto(`${base}/dragon2d/?ch=${ch}&step=0&chain=0&diff=${DIFF}&seed=1&card=0`);
    await p.waitForFunction(() => window.DRG2 && DRG2.sense().id, null, { timeout: 30000 });
    const idx = await p.evaluate(async (ch) => (await import('/dragon2d/js/story/ch' + ch + '.js?v=1')).chapter.steps.map((s) => s.id), ch).then((l) => l.indexOf(id));
    await p.goto(`${base}/dragon2d/?ch=${ch}&step=${Math.max(0, idx)}&chain=0&diff=${DIFF}&seed=1&card=0`);
    await p.waitForFunction(() => window.DRG2 && DRG2.sense().id && !DRG2.sense().busy, null, { timeout: 30000 });
    await p.evaluate(async () => { const m = await import('/dragon2d/js/bots/bots.js?v=1'); DRG2.bot.run(m.storyBot('normal')); });
    await p.waitForTimeout(+(sec || 3) * 1000);
    const f = path.join(OUT, 'shot_' + id + '.png'); await p.screenshot({ path: f }); console.log(f);
  }
  console.log('오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' / ') : ''));
  await b.close(); srv.close();
});
