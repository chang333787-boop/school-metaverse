// 새 저장소(uri-maeul) 빠른 확인: node tools/export/test/uri_smoke.cjs [포트=8655] [--shots=폴더] [--q=주소 뒤 글]
//   루트 주소 → ?town=ourtown이 붙는지 · 마을이 다 지어지는지 · 첫 화면 · 페이지 오류 0 · (사진) 첫 화면
const { chromium } = require('./pw.cjs');
const PORT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '8655';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), Q = arg('q') || '';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [], reqs404 = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    p.on('response', r => { if (r.status() >= 400) reqs404.push(r.status() + ' ' + r.url()); });
    const T0 = Date.now();
    await p.goto('http://127.0.0.1:' + PORT + '/' + Q);
    await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.title, null, { timeout: 240000 });
    console.log('주소', await p.evaluate(() => location.search), '· 짓기', Math.round((Date.now() - T0) / 1000) + '초');
    await p.waitForTimeout(2500);
    console.log('첫 화면', await p.evaluate(() => SM_TOWN.title()), '|', (await p.evaluate(() => (document.querySelector('.twn-ld') || {}).innerText || '')).replace(/\s+/g, ' ').slice(0, 200));
    if (SHOTS) await p.screenshot({ path: SHOTS + '/smoke_title.png' });
    console.log('404', reqs404.length, reqs404.slice(0, 10));
    console.log('오류', errs.length, errs.slice(0, 10));
  } finally { await b.close(); }
  process.exit(errs.length || reqs404.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
