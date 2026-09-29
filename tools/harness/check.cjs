// usage: [PAGE=/] node check.cjs [repoDir] [--full]   (PAGE 기본 /v2/ · PAGE=/ = 홍보판)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2] || '/home/user/school-metaverse';
const full = process.argv.includes('--full');
const types = {'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); const u = q.url.split('?')[0]; fs.readFile(u.endsWith('/') ? path.join(p, 'index.html') : p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': types[path.extname(u.endsWith('/') ? 'x.html' : p)] || 'application/octet-stream'}); r.end(d); }); });
srv.listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ args: process.env.SWGL ? ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] : [] });
  const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const lines = [];
  pg.on('console', m => { const t = m.text(); lines.push(t); if (!/THREE\.|GPU stall|WebGL/.test(t)) console.log('[c]', t.slice(0, 400)); });
  pg.on('pageerror', e => console.log('[ERR]', e.message));
  await pg.goto('http://localhost:' + port + (process.env.PAGE || '/v2/') + '?check=1');   // PAGE=/ = 홍보판(루트 index.html)
  const t0 = Date.now();
  while (Date.now() - t0 < 240000) { if (lines.some(l => /🩺/.test(l) && /빠른|quick|\/10|통과/.test(l))) break; await new Promise(r => setTimeout(r, 1000)); }
  await new Promise(r => setTimeout(r, 1500));
  if (full) { const h = await pg.evaluate(() => window.SD2.health().then(r => JSON.stringify(r.counts || r).slice(0, 800))); console.log('FULL', h); }
  const tm = await pg.evaluate(() => JSON.stringify(window.SD2 && window.SD2.timing)); console.log('TIMING', tm);
  await b.close(); srv.close();
});
