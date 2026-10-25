// 📷 층층골·까망봉 눈 확인 캡처(그림 켬): node tools/harness/town_xpshot.cjs [마을] [포트] --shots=폴더 — 낮·밤 · 멀리서·가까이 · 그리기 수
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002', SH = (process.argv.find(a => a.startsWith('--shots=')) || '--shots=.').slice(8);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await W8(3000);
  for (let i = 0; i < 5 && await ev(() => !!document.querySelector('.twn-p,.twn-dlg')); i++) { await p.keyboard.press('Escape'); await W8(300); }
  const calls = () => ev(async () => { let s = 0; for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); s += SD2.renderer.info.render.calls; } return Math.round(s / 6); });
  const go = async (x, z, lx, lz) => { await ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); M.player.lookAt([lx, lz]); }, [x, z, lx, lz]); await W8(2500); };
  const V = [['isle_shore', 790, -372, 970, -476], ['isle_cairn', 960, -468, 975, -478], ['isle_back', 940, -470, 800, -378]];
  await ev(async () => { const T = await import('/v2/games/town_shore.js'); const d = SM_TOWN.game().S.day; let m = T.lowAt(d); while (m < 7 * 60) m += 745; while (m > 17 * 60) m -= 745; window.__LOWMIN = Math.round(m); }); console.log('low', await ev(() => window.__LOWMIN));
  if (process.env.SEASON) { await ev(s9 => SM_TOWN.rules.season(s9), process.env.SEASON); await W8(20000); }
  for (const ph of ['day', 'night']) { await ev(ph => { SM_TOWN.game().S.min = ph === 'day' ? (window.__LOWMIN || 10 * 60) : 21 * 60; if (SD2.map.time) SD2.map.time(ph === 'day' ? 'day' : 'night'); }, ph); await W8(800);
    for (const [n, x, z, lx, lz] of V) { await go(x, z, lx, lz); const c = await calls(); await p.screenshot({ path: SH + '/' + ph + '_' + n + '.png' }); console.log(ph, n, 'calls', c); } }
  console.log('errs', errs.length, errs.join(' | ')); await b.close(); })();
