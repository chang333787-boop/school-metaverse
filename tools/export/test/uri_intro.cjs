// 인트로 시험(새 저장소 uri-maeul): node tools/export/test/uri_intro.cjs [포트=8655] [--shots=폴더]
//   ① 빈 기기 = 긴 인트로(장면 셋) — 그동안 첫 화면·칩은 숨고 카메라만 움직임 · 장면마다 사진 · 끝나면 첫 화면이 그대로(눌리지 않음)
//   ② 다시 열면 짧은 인트로 → Space로 건너뜀 → 첫 화면이 뜨고 게임은 아직 시작 안 함(keyup이 단추를 누르지 않음)
//   ③ 첫 화면 '처음 영상 다시 보기' → 긴 인트로 → 클릭으로 건너뜀  ④ 휴대폰 세로 인트로 사진 + 터치로 건너뜀  ⑤ 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const PORT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '8655';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), URL = 'http://127.0.0.1:' + PORT + '/';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const shot = async (p, n) => { if (SHOTS) { await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); } };
const state = p => p.evaluate(() => { const ld = document.querySelector('.twn-ld'), iv = document.getElementById('iv');
  return { iv: !!iv, ldVis: ld ? getComputedStyle(ld).visibility : null, title: !!(window.SM_TOWN && SM_TOWN.title && SM_TOWN.title()), done: window.SM_INTRO ? window.SM_INTRO.done : null,
    cap: iv ? (iv.querySelector('.cap') || {}).innerText || '' : '', seen: localStorage.getItem('uri.intro.v1'), url: location.search, cam: SD2 && SD2.camera ? SD2.camera.position.toArray().map(v => Math.round(v)) : null }; });
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
(async () => {
  const b = await chromium.launch({ args: GPU });
  try {
    console.log('① 빈 기기 = 긴 인트로');
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); watch(p, 'A');
    await p.goto(URL); await p.waitForFunction(() => !!document.getElementById('iv'), null, { timeout: 240000 });
    const t0 = Date.now(); const el = () => (Date.now() - t0) / 1000;
    await p.waitForTimeout(600); let S = await state(p); await shot(p, 'intro_0_title');
    ok(S.iv && S.ldVis === 'hidden', '인트로가 뜨고 첫 화면은 숨음(' + S.ldVis + ')'); ok(/town=ourtown/.test(S.url), '루트 주소에 ?town=ourtown이 붙음(' + S.url + ')');
    const cams = [];
    for (const [at, n] of [[6.5, 'intro_1_name'], [11, 'intro_1b_name'], [17.5, 'intro_2_home'], [23, 'intro_2b_home'], [31, 'intro_3_play'], [35.5, 'intro_3b_play']]) {
      await p.waitForTimeout(Math.max(0, (at - el()) * 1000)); S = await state(p); cams.push(S.cam); await shot(p, n); console.log('    ' + at + '초 · 카메라 ' + JSON.stringify(S.cam) + ' · 글 ' + S.cap.replace(/\s+/g, ' ').slice(0, 90)); }
    ok(new Set(cams.map(c => c && c.join(','))).size >= 5, '카메라가 장면마다 움직임');
    await p.waitForFunction(() => window.SM_INTRO && window.SM_INTRO.done, null, { timeout: 30000 }); const T1 = el();
    await p.waitForTimeout(1200); S = await state(p);
    ok(S.done === 'end' && T1 >= 30 && T1 <= 46, '긴 인트로가 끝까지(' + T1.toFixed(1) + '초)'); ok(!S.iv && S.ldVis === 'visible' && S.title, '끝나면 첫 화면이 그대로(눌리지 않음)'); ok(S.seen === '1', '본 것을 기억(localStorage)');
    await shot(p, 'intro_4_after_title');
    ok(await p.evaluate(() => !!document.querySelector('.twn-ld .iv-again')), "첫 화면에 '처음 영상 다시 보기'");
    console.log('② 다시 열기 = 짧은 인트로 · Space 건너뛰기');
    await p.reload(); await p.waitForFunction(() => !!document.getElementById('iv'), null, { timeout: 240000 }); await p.waitForTimeout(2000);
    S = await state(p); ok(S.iv && /종이 판/.test(S.cap) && !/\u25A1|첫 아침/.test(S.cap), '짧은 인트로 = 마을 이름 한 장면(' + S.cap.replace(/\s+/g, ' ').slice(0, 40) + ')'); await shot(p, 'intro_short');
    const k0 = Date.now(); await p.keyboard.press('Space'); await p.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); const kms = Date.now() - k0;
    await p.waitForTimeout(800); S = await state(p);
    ok(S.done === 'skip' && kms < 2500, 'Space = 바로 건너뜀(' + kms + 'ms)'); ok(S.title && S.ldVis === 'visible', '건너뛴 뒤 첫 화면이 그대로(Space가 처음부터 단추를 누르지 않음)');
    console.log('③ 다시 보기 단추 → 긴 인트로 → 클릭 건너뛰기');
    await p.evaluate(() => document.querySelector('.twn-ld .iv-again').click()); await p.waitForTimeout(3500);
    S = await state(p); ok(S.iv && /첫 아침|어린이들이/.test(await p.evaluate(() => document.getElementById('iv').innerText)), '다시 보기 = 긴 인트로');
    await p.mouse.click(600, 300); await p.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await p.waitForTimeout(700); S = await state(p);
    ok(S.title && S.ldVis === 'visible', '클릭 = 건너뜀 · 첫 화면 그대로');
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(2500);
    const W = await p.evaluate(() => { const q = SD2.map.player.get(), H = SM_TOWN.home(); return { title: SM_TOWN.title(), d: H && H.e ? Math.hypot(q.x - H.e[0], q.z - H.e[1]) : null }; });
    ok(!W.title && W.d != null && W.d < 7, '처음부터 → 우리 집 현관 앞에서 시작(' + (W.d && W.d.toFixed(1)) + 'm)'); await shot(p, 'intro_5_first_morning');
    await ctx.close();
    console.log('④ 휴대폰 세로');
    const c2 = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }), q = await c2.newPage(); watch(q, 'M');
    await q.goto(URL); await q.waitForFunction(() => !!document.getElementById('iv'), null, { timeout: 240000 }); await q.waitForTimeout(7000); await shot(q, 'intro_phone_name');
    await q.waitForTimeout(31000 - 7000); await shot(q, 'intro_phone_play');
    await q.touchscreen.tap(195, 400); await q.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await q.waitForTimeout(800);
    const S2 = await state(q); ok(S2.title && S2.ldVis === 'visible', '터치 = 건너뜀 · 첫 화면'); await shot(q, 'intro_phone_after');
    await c2.close();
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
