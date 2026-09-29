// usage: node shot.cjs <repoDir> <out.png> "x,y,z,heading°,pitch°,fov°" ...   → one grid PNG (each tile 480x270, 2 columns)
//   heading 0 = north(-z), 90 = east(+x). Loads v2/?shot=... per tile (player/HUD hidden).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [root, out, ...specs] = process.argv.slice(2);
const types = {'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const p = path.join(root, decodeURIComponent(u)); fs.readFile(u.endsWith('/') ? path.join(p, 'index.html') : p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': types[path.extname(u.endsWith('/') ? 'x.html' : p)] || 'application/octet-stream'}); r.end(d); }); });
srv.listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ args: process.env.SWGL ? ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] : [] });
  const imgs = [];
  for (const s of specs) {
    const pg = await b.newPage({ viewport: { width: 480, height: 270 } });
    pg.on('pageerror', e => console.log('[ERR]', e.message));
    await pg.goto('http://localhost:' + port + '/v2/?shot=' + s);
    await pg.waitForFunction(() => window.SD2 && window.SD2.world, null, { timeout: 120000 });
    await new Promise(r => setTimeout(r, 2500));
    imgs.push([s, (await pg.screenshot()).toString('base64')]); await pg.close();
  }
  const pg = await b.newPage({ viewport: { width: 964, height: 100 } });
  await pg.setContent('<body style="margin:0;background:#222;display:grid;grid-template-columns:480px 480px;gap:4px">' + imgs.map(([s, d]) => '<div style="position:relative"><img src="data:image/png;base64,' + d + '" width=480 height=270><span style="position:absolute;left:4px;top:2px;color:#fff;font:11px monospace;background:#0008">' + s + '</span></div>').join('') + '</body>');
  await pg.screenshot({ path: out, fullPage: true });
  await b.close(); srv.close(); console.log('wrote', out);
});
