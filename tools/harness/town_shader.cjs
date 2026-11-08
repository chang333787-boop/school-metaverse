// 🧪 셰이더 고장 보기(PERF-G · 11-08 최적화 토론 판정 10 '시험 사각지대' — 셰이더가 깨져도 그리기 끈 시험·오류 거르기가 못 봄)
//   zsh tools/ops/b2.sh node tools/harness/town_shader.cjs [마을=ourtown] [포트=8002] [--only=new|old] [--shots=폴더]
//   ?debug=1(셰이더 오류 검사 켬 · main.js checkShaderErrors)로 열어 짓기 → 첫 화면 닫기 → 밤 → 비 → 눈(겨울) → 실내(가게·집) → 계절 넷 → 지금 계절을 돎
//   판 둘: new = 지금 기본 길 · old = 되돌림 넷(?ti=0&q8=0&g3=0&sg8=0 — 예전 나무·예전 사람 묶음·그리기 줄이기 끔·예전 간판) — 되돌림 길이 실제로 지어지고 그려지는지
//   판정(실패 = exit 1): 콘솔 'THREE.WebGLProgram'·'Shader Error'·'INVALID_OPERATION'·'GL_INVALID'·페이지 오류 0 · 나무 셰이더 자기 확인(SM_TOWN.ti().ok)이 false가 아님 · 첫 화면에 그린 삼각형 > 0
//   상태마다 renderer.info.programs가 늘어난 수를 찍음(새로 지은 셰이더 = 그 순간의 멈칫 후보 · 미리 짓기 근거)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const A = process.argv.slice(2), TOWN = A.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'ourtown', PORT = A.find(a => /^\d+$/.test(a)) || '8002';
const opt = k => { const a = A.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ONLY = opt('only'), SHOTS = opt('shots');
const RUNS = [['new', ''], ['old', '&ti=0&q8=0&g3=0&sg8=0']].filter(r => !ONLY || r[0] === ONLY);
const BAD = /THREE\.WebGLProgram|Shader Error|INVALID_OPERATION|GL_INVALID|shader.*(compile|link)|나무 셰이더/i;
const IGN = /favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource|GPU stall due to ReadPixels/;
(async () => {
  const out = { town: TOWN, runs: [] }; let fails = 0;
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  for (const [tag, qx] of RUNS) {
    const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const bad = [], errs = [];
    p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 200)));
    p.on('console', m => { const t = m.text(); if (BAD.test(t) && (m.type() === 'error' || m.type() === 'warning')) bad.push(t.slice(0, 240)); else if (m.type() === 'error' && !IGN.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), R = { tag, q: qx, st: [], bad, errs };
    const t0 = Date.now();
    await p.goto(`http://127.0.0.1:${PORT}/v2/?town=${TOWN}&debug=1&adapt=0&dpr=1${qx}`);
    await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && SM_TOWN.indoor && window.SD2 && SD2.renderer && !window.SM_BUILD, null, { timeout: 400000, polling: 250 });
    R.buildS = Math.round((Date.now() - t0) / 100) / 10;
    await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); const G = SM_TOWN.game(); if (G && G.S) { G.S.clock = false; if (G.setClock) G.setClock(false); G.S.min = 11 * 60; } });
    await p.keyboard.press('Escape'); await W8(1200);
    const closeAll = async () => { for (let i = 0; i < 10; i++) { if (!(await ev(() => !!document.querySelector('.twn-p, .twn-dlg')))) break; await p.keyboard.press('Escape'); await W8(250); } };
    const progs = () => ev(() => (SD2.renderer.info.programs || []).length);
    let P0 = await progs();
    const st = async (k, act, wait = 2600) => { await closeAll(); const e0 = bad.length; try { await act(); } catch (e) { errs.push(k + ': ' + String(e).slice(0, 160)); } await W8(wait);
      const P1 = await progs(), tri = await ev(() => SD2.renderer.info.render.triangles), names = P1 > P0 ? await ev(n => (SD2.renderer.info.programs || []).slice(n).map(q => q.name || '?').slice(0, 6), P0) : [];
      R.st.push({ k, newProg: P1 - P0, prog: P1, tri, bad: bad.length - e0, names }); process.stderr.write(tag + ' ' + k + ' · 새 셰이더 ' + (P1 - P0) + ' · 삼각형 ' + tri + (bad.length > e0 ? ' · ✗ 셰이더 오류 ' + (bad.length - e0) : '') + '\n'); P0 = P1;
      if (SHOTS) await p.screenshot({ path: path.join(SHOTS, tag + '_' + k + '.png') }).catch(() => {}); };
    await st('start', async () => {});
    R.ti = await ev(() => (SM_TOWN.ti ? SM_TOWN.ti() : null)).catch(() => null);
    await st('night', () => ev(() => { SM_TOWN.game().S.min = 20 * 60; }));
    await st('day', () => ev(() => { SM_TOWN.game().S.min = 11 * 60; }));
    await st('rain', () => ev(() => SM_TOWN.weather('rain')));
    await st('clear', () => ev(() => SM_TOWN.weather('clear')));
    await st('winter_snow', async () => { await ev(() => SM_TOWN.season('winter')); await W8(1500); await ev(() => SM_TOWN.weather('snow')); }, 3200);
    await st('snow_off', () => ev(() => SM_TOWN.weather('clear')));
    const shop = await ev(() => { const C = SM_TOWN.indoor.census(); const c = C.find(x => x.in === 'shop' && x.door && !x.school && !x.home); return c ? c.i : -1; });
    const home = await ev(() => { const C = SM_TOWN.indoor.census(); const c = C.find(x => x.home && x.in); return c ? c.i : -1; });
    for (const [k, i] of [['in_shop', shop], ['in_home', home]]) { if (i < 0) { errs.push(k + ': 방을 못 찾음'); continue; }
      await st(k, () => ev(i9 => SM_TOWN.indoor.enterI(i9), i), 3600); await st(k + '_out', () => ev(() => SM_TOWN.indoor.exit()), 2600); }
    for (const s of ['spring', 'summer', 'autumn', 'winter', 'now']) await st('season_' + s, () => ev(s9 => SM_TOWN.season(s9), s), 3000);
    R.tiEnd = await ev(() => (SM_TOWN.ti ? SM_TOWN.ti() : null)).catch(() => null);
    const tiBad = !!(R.tiEnd && R.tiEnd.ok != null && !R.tiEnd.ok && tag === 'new'), triBad = !(R.st[0] && R.st[0].tri > 0);
    R.fail = bad.length + errs.length + (tiBad ? 1 : 0) + (triBad ? 1 : 0); fails += R.fail;
    process.stderr.write((R.fail ? '✗ ' : '✓ ') + tag + ' 짓기 ' + R.buildS + '초 · 셰이더 오류 ' + bad.length + ' · 다른 오류 ' + errs.length + ' · 나무 확인 ' + JSON.stringify(R.tiEnd && { ok: R.tiEnd.ok, safe: R.tiEnd.safe, on: R.tiEnd.on }) + (triBad ? ' · ✗ 첫 화면 삼각형 0' : '') + '\n');
    for (const t of bad.slice(0, 4)) process.stderr.write('  ✗ ' + t + '\n'); for (const t of errs.slice(0, 4)) process.stderr.write('  ✗ ' + t + '\n');
    out.runs.push(R); await b.close();
  }
  console.log(JSON.stringify(out, null, 1));
  console.log(fails ? 'SHADER FAIL ' + fails : 'PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('✗ 하네스 멈춤', e); console.log('SHADER FAIL harness'); process.exit(2); });
