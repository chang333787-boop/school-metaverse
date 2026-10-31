// 인트로(예고편) 시험(새 저장소 uri-maeul): node tools/export/test/uri_intro.cjs [포트=8655] [--shots=폴더]
//   ① 빈 기기 = 긴 인트로 — 장면마다 사진·글·시간대(낮 장면 = 낮 · 밤 장면 = 밤 + 야시장) · 끝 장(우리 마을 · 무엇을 할까요? · 시작하기)에서 기다림 → 시작하기
//      → 첫 화면이 그대로(눌리지 않음) · 게임 시각·시간대·저장 내용이 처음 그대로 · 카메라가 다시 몸 뒤로
//   ② 다시 열면 짧은 인트로(끝 장만 · 단추 X) → Space로 건너뜀 → 첫 화면(keyup이 단추를 누르지 않음)
//   ③ 첫 화면 '처음 영상 다시 보기' → 긴 인트로 → 밤 장면에서 클릭으로 건너뜀 → 원래 시각·시간대 → 처음부터 → 우리 집 현관 앞
//   ④ 휴대폰 세로 사진(자전거·밤·끝 장) + 시작하기 터치  ⑤ 밤 장면 동안 저장해도 저장된 시각 = 원래 시각
//   ⑥ 자리 잡은 첫 화면에서 긴 인트로를 다 본 뒤 저장 내용(시각·해 질 녘 표시 포함)이 그대로  ⑦ 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const PORT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '8655';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), URL = 'http://127.0.0.1:' + PORT + '/';
const KEY = 'uri.intro.v2';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const shot = async (p, n) => { if (SHOTS) { await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); } };
const state = p => p.evaluate(K => { const ld = document.querySelector('.twn-ld'), iv = document.getElementById('iv'), G = SM_TOWN.game();
  return { iv: !!iv, ldVis: ld ? getComputedStyle(ld).visibility : null, title: !!(SM_TOWN.title && SM_TOWN.title()), done: window.SM_INTRO ? window.SM_INTRO.done : null,
    cap: iv ? ((iv.querySelector('.cap.in') || {}).textContent || '') : '', end: iv ? !!iv.querySelector('.end.in') : false, endTxt: iv ? (iv.querySelector('.end') || {}).innerText || '' : '',
    skipVis: iv ? getComputedStyle(iv.querySelector('.skip')).display !== 'none' : false, btn: iv ? !!iv.querySelector('.end button') : false,
    seen: localStorage.getItem(K), url: location.search, min: G.S.min, ph: SD2.map.time(), scene: SM_INTRO_API.scene,
    cam: SD2.camera.position.toArray().map(v => Math.round(v)), me: (q => [Math.round(q.x), Math.round(q.y), Math.round(q.z)])(SD2.map.player.get()) }; }, KEY);
const snapS = p => p.evaluate(() => { const o = JSON.parse(JSON.stringify(SM_TOWN.game().S)); delete o.sv; return JSON.stringify(o); });
/* 달라진 칸: 있던 칸이 바뀜(chg) · 없던 칸이 새로 생김(add — 모듈이 처음 쓸 때 만드는 빈 칸) */
const diffKeys = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b), chg = [], add = []; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { if (JSON.stringify(A[k]) === JSON.stringify(B[k])) continue; (k in A ? chg : add).push(k); } return { chg, add }; };
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const NIGHT = 1230;
(async () => {
  const b = await chromium.launch({ args: GPU });
  try {
    console.log('① 빈 기기 = 긴 인트로(예고편)');
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); watch(p, 'A');
    await p.goto(URL); await p.waitForFunction(() => !!document.getElementById('iv') && window.SM_INTRO_API && SM_INTRO_API.plan, null, { timeout: 240000 });
    const t0 = Date.now(); const el = () => (Date.now() - t0) / 1000;
    await p.waitForTimeout(400); let S = await state(p); await shot(p, 'intro_0_title');
    const plan = await p.evaluate(() => SM_INTRO_API.plan), env = await p.evaluate(() => SM_INTRO_API.env());
    console.log('    장면 ' + plan.shots.map(s => s.id + (s.dur ? '(' + s.dur + ')' : '')).join(' → ') + ' · 원래 시각 ' + env.min0 + ' ' + env.ph0);
    ok(S.iv && S.ldVis === 'hidden', '인트로가 뜨고 첫 화면은 숨음(' + S.ldVis + ')'); ok(/town=ourtown/.test(S.url), '루트 주소에 ?town=ourtown이 붙음(' + S.url + ')');
    ok(plan.shots.length >= 7 && plan.shots.length <= 9 && plan.shots[plan.shots.length - 1].end, '장면 ' + (plan.shots.length - 1) + '개 + 끝 장');
    ok(['metro', 'night', 'nmkt'].every(id => plan.shots.some(s => s.id === id)), '지하철·밤 마을·야시장 장면이 들어 있음');
    ok(!/어린이|아이들|종이 판|만든|지은/.test(plan.shots.map(s => s.t).join(' ')), "'어린이들이 지은' 같은 말 X");
    ok(env.min0 != null && env.ph0, '시작 때 원래 시각을 잡아 둠(' + env.min0 + ')');
    const cams = []; let at = plan.lead, n = 1; const perf = [];
    for (const s of plan.shots) {
      if (s.end) break;
      const mid = at + s.dur * 0.55; await p.waitForTimeout(Math.max(0, (mid - el()) * 1000)); S = await state(p); cams.push(S.cam);
      await shot(p, 'intro_' + n + '_' + s.id);
      const night = s.id === 'night' || s.id === 'nmkt';
      ok(S.scene === s.id && S.cap === s.t, n + ' ' + s.id + ' · 글 「' + S.cap + '」');
      ok(night ? (S.ph === 'night' && S.min === NIGHT) : (S.ph === 'day' && S.min === 600), '   시간대 ' + S.ph + ' · 게임 시각 ' + S.min);
      if (s.id === 'nmkt') { const v = await p.evaluate(() => SM_TOWN.night().info().vis); ok(v.mkt === true, '   야시장 노점이 펼쳐짐'); }
      if (s.id === 'night') perf.push(await p.evaluate(() => { try { const q = SD2.perf(); return q && { fps: q.fps, draw: q.drawCalls ?? q.calls, tri: q.tris ?? q.triangles }; } catch (e) { return null; } }));
      console.log('    ' + mid.toFixed(1) + '초 · 카메라 ' + JSON.stringify(S.cam));
      at += s.dur; n++;
    }
    ok(new Set(cams.map(c => c && c.join(','))).size === cams.length, '카메라가 장면마다 다른 곳');
    if (perf[0]) console.log('    밤 장면 성능 ' + JSON.stringify(perf[0]));
    await p.waitForFunction(() => !!document.querySelector('#iv .end.in'), null, { timeout: 30000 }); const TE = el();
    await p.waitForTimeout(700); S = await state(p); await shot(p, 'intro_' + n + '_end');
    ok(TE >= 38 && TE <= 55, '끝 장까지 ' + TE.toFixed(1) + '초(40~55초 안팎)');
    ok(/무엇을 할까요/.test(S.endTxt) && S.btn && !S.skipVis, '끝 장 = 이름 + 「무엇을 할까요?」 + 시작하기(건너뛰기 단추 숨김)');
    ok(S.ph === env.ph0 && S.min === env.min0, '끝 장에서 원래 시각·시간대로(' + S.min + ' ' + S.ph + ')');
    await p.waitForTimeout(2500); S = await state(p); ok(S.iv && S.end, '끝 장은 시작하기를 누를 때까지 기다림');
    await p.click('#iv .end button'); await p.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 });
    await p.waitForTimeout(1200); S = await state(p);
    ok(S.done === 'end' && !S.iv && S.ldVis === 'visible' && S.title, '시작하기 → 첫 화면이 그대로(눌리지 않음)'); ok(S.seen === '1', '본 것을 기억(localStorage ' + KEY + ')');
    ok(S.min === env.min0 && S.ph === env.ph0, '끝난 뒤 게임 시각·시간대 = 처음(' + S.min + ' ' + S.ph + ')');
    ok(Math.hypot(S.cam[0] - S.me[0], S.cam[2] - S.me[2]) < 15, '카메라가 다시 몸 뒤로(' + JSON.stringify(S.cam) + ' · 몸 ' + JSON.stringify(S.me) + ')');
    ok(await p.evaluate(() => !SM_INTRO_API.env().on && Object.prototype.hasOwnProperty.call(SM_TOWN.game(), 'flush')), '저장 손잡이도 원래대로');
    await shot(p, 'intro_after_title');
    ok(await p.evaluate(() => !!document.querySelector('.twn-ld .iv-again')), "첫 화면에 '처음 영상 다시 보기'");
    console.log('② 다시 열기 = 짧은 인트로 · Space 건너뛰기');
    await p.reload(); await p.waitForFunction(() => !!document.getElementById('iv'), null, { timeout: 240000 }); await p.waitForTimeout(2000);
    S = await state(p); ok(S.iv && S.end && !S.btn && /무엇을 할까요/.test(S.endTxt) && !S.cap, '짧은 인트로 = 끝 장 하나(단추 X)'); await shot(p, 'intro_short');
    const k0 = Date.now(); await p.keyboard.press('Space'); await p.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); const kms = Date.now() - k0;
    await p.waitForTimeout(800); S = await state(p);
    ok(S.done === 'end' && kms < 2500, 'Space = 바로 닫힘(' + kms + 'ms)'); ok(S.title && S.ldVis === 'visible', '닫힌 뒤 첫 화면이 그대로(Space가 처음부터 단추를 누르지 않음)');
    { await p.reload(); await p.waitForFunction(() => window.SM_INTRO && SM_INTRO.done, null, { timeout: 240000 }); const T2 = await p.evaluate(() => SM_INTRO.at); void T2; S = await state(p); ok(S.done === 'end' && S.title, '짧은 인트로는 저절로 닫힘'); }
    console.log('③ 다시 보기 → 긴 인트로 → 밤 장면에서 클릭 건너뛰기');
    await p.waitForFunction(() => !!document.querySelector('.twn-ld .iv-again'), null, { timeout: 10000 });
    const env3 = await p.evaluate(() => ({ min: SM_TOWN.game().S.min, ph: SD2.map.time() }));
    await p.evaluate(() => document.querySelector('.twn-ld .iv-again').click());
    await p.waitForFunction(() => window.SM_INTRO_API && SM_INTRO_API.scene === 'night', null, { timeout: 60000 }); await p.waitForTimeout(1200);
    S = await state(p); ok(S.ph === 'night' && S.min === NIGHT, '다시 보기 = 긴 인트로 · 밤 장면(' + S.ph + ')');
    await p.mouse.click(600, 300); await p.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await p.waitForTimeout(900); S = await state(p);
    ok(S.done === 'skip' && S.title && S.ldVis === 'visible', '클릭 = 건너뜀 · 첫 화면 그대로');
    ok(S.min === env3.min && S.ph === env3.ph, '밤 장면에서 건너뛰어도 원래 시각·시간대(' + S.min + ' ' + S.ph + ')');
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-ld [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(2500);
    const W = await p.evaluate(() => { const q = SD2.map.player.get(), H = SM_TOWN.home(); return { title: SM_TOWN.title(), d: H && H.e ? Math.hypot(q.x - H.e[0], q.z - H.e[1]) : null, min: SM_TOWN.game().S.min, ph: SD2.map.time() }; });
    ok(!W.title && W.d != null && W.d < 7, '처음부터 → 우리 집 현관 앞에서 시작(' + (W.d && W.d.toFixed(1)) + 'm · ' + W.min + ' ' + W.ph + ')'); await shot(p, 'intro_first_morning');
    await ctx.close();
    console.log('④ 휴대폰 세로');
    const c2 = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }), q = await c2.newPage(); watch(q, 'M');
    await q.goto(URL); await q.waitForFunction(() => !!document.getElementById('iv') && window.SM_INTRO_API && SM_INTRO_API.plan, null, { timeout: 240000 });
    const tq = Date.now(), pq = await q.evaluate(() => SM_INTRO_API.plan); let aq = pq.lead;
    for (const s of pq.shots) { if (s.end) break; if (['bike', 'night', 'nmkt'].includes(s.id)) { await q.waitForTimeout(Math.max(0, (aq + s.dur * 0.55 - (Date.now() - tq) / 1000) * 1000)); await shot(q, 'intro_phone_' + s.id);
      const r = await q.evaluate(() => { const c = document.querySelector('#iv .cap'); const b9 = c.getBoundingClientRect(); return { w: Math.round(b9.width), h: Math.round(b9.height), r: Math.round(b9.right), vw: innerWidth }; }); ok(r.r <= r.vw && r.h < 170, '   휴대폰 글 띠가 화면 안(' + s.id + ' ' + r.w + '×' + r.h + ')'); } aq += s.dur; }
    await q.waitForFunction(() => !!document.querySelector('#iv .end.in'), null, { timeout: 40000 }); await q.waitForTimeout(700); await shot(q, 'intro_phone_end');
    { const r = await q.evaluate(() => { const b9 = document.querySelector('#iv .end').getBoundingClientRect(), bt = document.querySelector('#iv .end button').getBoundingClientRect(); return { l: b9.left, r: b9.right, vw: innerWidth, bh: bt.height, bx: bt.left + bt.width / 2, by: bt.top + bt.height / 2 }; });
      ok(r.l >= 0 && r.r <= r.vw && r.bh >= 44, '휴대폰 끝 장이 화면 안 · 단추 44px 넘음'); await q.touchscreen.tap(r.bx, r.by); }
    await q.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await q.waitForTimeout(800);
    const S2 = await state(q); ok(S2.title && S2.ldVis === 'visible' && S2.done === 'end', '시작하기 터치 → 첫 화면'); await shot(q, 'intro_phone_after');
    await c2.close();
    console.log('⑤ 밤 장면 동안 저장 = 원래 시각');
    const c3 = await b.newContext({ viewport: { width: 1024, height: 640 } }), r3 = await c3.newPage(); watch(r3, 'S');
    await r3.goto(URL + '?intro=1'); await r3.waitForFunction(() => window.SM_INTRO_API && SM_INTRO_API.scene === 'nmkt', null, { timeout: 300000 }); await r3.waitForTimeout(600);
    const sv = await r3.evaluate(() => { const G = SM_TOWN.game(), e = SM_INTRO_API.env(), okF = G.flush(true), raw = localStorage.getItem(SM_TOWN.save().key); let m = null; try { m = JSON.parse(raw).min; } catch (x) { m = 'x'; } return { okF, saved: m, live: G.S.min, min0: e.min0 }; });
    ok(sv.okF && sv.saved === sv.min0 && sv.live === NIGHT, '밤 장면 중 저장 → 저장된 시각 ' + sv.saved + ' = 원래 ' + sv.min0 + '(지금 ' + sv.live + ')');
    await r3.keyboard.press('Escape'); await r3.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await r3.waitForTimeout(700);
    const s3 = await r3.evaluate(() => ({ min: SM_TOWN.game().S.min, ph: SD2.map.time() })); ok(s3.min === sv.min0, 'Esc로 건너뛴 뒤 시각 ' + s3.min + ' ' + s3.ph);
    await c3.close();
    console.log('⑥ 저장 흔적 — 자리 잡은 첫 화면에서 긴 인트로를 끝까지 본 뒤 저장 내용이 그대로인가');
    const c4 = await b.newContext({ viewport: { width: 1024, height: 640 } }), r4 = await c4.newPage(); watch(r4, 'T');
    await r4.goto(URL + '?intro=0'); await r4.waitForFunction(() => window.SM_TOWN && SM_TOWN.title && SM_TOWN.title(), null, { timeout: 240000 }); await r4.waitForTimeout(12000);
    const a4 = await snapS(r4); ok(await r4.evaluate(() => SM_INTRO_API.play()), 'SM_INTRO_API.play() = 긴 인트로');
    await r4.waitForFunction(() => !!document.querySelector('#iv .end.in'), null, { timeout: 90000 }); await r4.click('#iv .end button');
    await r4.waitForFunction(() => !document.getElementById('iv'), null, { timeout: 5000 }); await r4.waitForTimeout(1500);
    const b4 = await snapS(r4), d4 = diffKeys(a4, b4), H4 = JSON.parse(b4).home || {};
    ok(!d4.chg.length, '있던 저장 칸 = 그대로(시각 · 해 질 녘 표시 포함)' + (d4.chg.length ? ' — 달라진 칸 ' + d4.chg.join(',') : ''));
    if (d4.add.length) console.log('    새로 생긴 빈 칸(모듈 첫 준비): ' + d4.add.map(k => k + ' ' + JSON.stringify(JSON.parse(b4)[k]).slice(0, 80)).join(' | '));
    ok(!('dk' in H4) || JSON.parse(a4).home.dk === H4.dk, '첫날 해 질 녘 알림 표시(home.dk)가 남지 않음');
    await c4.close();
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
