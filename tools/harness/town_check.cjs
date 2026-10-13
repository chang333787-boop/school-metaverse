// 마을 검사(CHECK-1 · 10-13): node tools/harness/town_check.cjs [마을 id=ourtown] [포트=8002]
//   같은 평면 겹침(반짝임) · 뚫림 · 떠 있음/파묻힘 · 겹침 · 차선·인도 · 걸어서 닿기(새는 곳·떨어짐·못 가는 곳·갇힘) · 장소 길 안내 · 나갔다 다시 들어오기 · 긴 프레임
//   서버: 저장소 뿌리에서 python3 -m http.server(포트) — 이 스크립트는 열기만 한다
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002', BASE = 'http://127.0.0.1:' + PORT + '/v2/';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(BASE + '?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN, null, { timeout: 90000 }); await p.waitForTimeout(800);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); });
  const R = await p.evaluate(() => SM_TOWN.check());
  // 나갔다 다시 들어오기: 학교가 원래대로 · 두 번째 마을도 같은 수
  const re = await p.evaluate(async () => { const c0 = SM_TOWN.counts; const T = () => SD2.map.world.colliders ? SD2.world.colliders.length : 0; const stop = [...document.querySelectorAll('.chip, button')].find(e => /그만하기/.test(e.textContent)); if (stop) stop.click(); await new Promise(r => setTimeout(r, 2500));
    const after = { town: !!window.SM_TOWN, t: +SD2.map.world.terrainAt?.(-200, 300)?.toFixed?.(2) }; return { c0: { bld: c0.bld, cols: c0.cols }, after }; });
  // 긴 프레임: 정문 → 마을 한 바퀴(순간이동 20곳 · 곳마다 1.5초 걷기)
  await p.goto(BASE + '?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN, null, { timeout: 90000 }); await p.waitForTimeout(800); await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); });
  const lf = await p.evaluate(async () => { const P = SM_TOWN.places().filter(q => !/school/.test(q.kind)).slice(0, 20), out = []; let worst = 0; for (const q of P) { SD2.map.player.teleport([q.door[0], SM_TOWN.ground(q.door[0], q.door[1]) + 0.2, q.door[1]]); const T = []; let last = performance.now(); await new Promise(res => { const f = () => { const n = performance.now(); T.push(n - last); last = n; if (T.length < 90) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); T.shift(); const m = Math.max(...T); worst = Math.max(worst, m); if (m > 60) out.push([q.name, Math.round(m)]); } return { worst: Math.round(worst), long: out }; });
  console.log(JSON.stringify({ ...R, reenter: re, frames: lf, errs }, null, 1)); await b.close(); })();
