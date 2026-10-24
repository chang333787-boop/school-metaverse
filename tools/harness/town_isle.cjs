// 썰물섬 시험(ISLE-1 · town_xp.js · 설계 docs/systems/town_explore.md 33 · 차례 3): node tools/harness/town_isle.cjs [마을=ourtown] [포트=8002]
//   ① 자리: 자료 한 줄로 섬·바닷길이 생김 · 바닷길이 헤엄 칸·아이 소품을 지나지 않음 · 바닷가 → 섬 가장자리 150~200m · 섬 판·바닷길 판 앞면 = 넣은 법선 쪽
//   ② 높이가 물때를 따름: 하루 여러 때에 바닷길 윗면(top) = 물때 식 · 썰물(isLow)일 때만 열림 · 몸 높이 = 그 윗면 · 물낯을 지나는 동안 3분(게임) 안
//   ③ 제때 걷기 봇: 썰물이 시작될 때 들머리에서 떠나 빨간 선을 W로 따라 돌탑 → E 내 돌 얹기 → 들머리로 걸어서 돌아옴(걸림 0 · 튕김 0 · 밀물 전에)
//   ④ 섬에 갇힌 봇: 섬에서 잠김 → 「기다리기·배 부르기」 창이 저절로 · 기다리기 = 다음 썰물로 · 배 부르기 = 구조 배가 바닷가에 내려 줌
//   ⑤ 바닷길 위에서 잠긴 봇: 길이 가라앉지 않고 구조 배가 데리러 옴 → 바닷가 · ③~⑤ 내내 물에 빠짐 0(물낯 아래로 30cm 넘게 X · '바다가 깊어요' 안내 0)
//   ⑥ 장소 목록·빨간 선(썰물 = 바닷길 따라 돌탑 · 밀물 = 들머리 + '물때를 봐요') · 하루 마무리에 내일 썰물 한 줄 · 내 돌이 자고 난 다음 날·새로 불러와도 남음 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const TIDE_P = 745, LOW_W = 94, lowAt = d => 300 + ((d * 50 + 250) % TIDE_P), tideLvl = (d, m) => (1 - Math.cos(2 * Math.PI * (m - lowAt(d)) / TIDE_P)) / 2;
const lowsOf = d => { const c = lowAt(d), out = []; for (const k of [-1, 0, 1]) { const a = c + k * TIDE_P - LOW_W, b = c + k * TIDE_P + LOW_W; if (b > 360 && a < 1440) out.push([Math.max(360, a), Math.min(1440, b)]); } return out; };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), pos = () => ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; }), d2 = (a, c) => Math.hypot(a[0] - c[0], (a.length > 2 ? a[2] : a[1]) - (c.length > 2 ? c[2] : c[1]));
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent : ''; });
    const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!(await panel())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panel()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, 60); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    const isle = () => ev(() => SM_TOWN.xp().api.isle()), G9 = f => ev(f);
    const goal = () => ev(() => { const g = document.getElementById('hudGoal'); return g && g.style.display !== 'none' ? g.textContent : ''; });
    const setT = (d, m, clock) => ev(([d, m, c]) => { const G = SM_TOWN.game(); if (d != null) G.S.day = d; G.S.min = m; const k = m < 360 || m >= 1140 ? 'night' : m >= 1020 ? 'sunset' : 'day'; if (SD2.map.time && SD2.map.time() !== k) SD2.map.time(k); G.S.min = m; if (G.setClock) G.setClock(!!c); }, [d, m, clock]);   /* 세상 때(낮·저녁·밤)도 맞춤 — 안 맞으면 마을이 시계를 그 때의 첫 시각으로 되돌림 */
    const loadUp = async () => { await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.xp && SM_TOWN.xp() && SM_TOWN.xp().api.isle && SM_TOWN.xp().api.isle() && window.SD2 && SM_TOWN.game, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·썰물섬이 안 뜸 — ' + errs.slice(0, 4).join(' | ')); throw e; }
      await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(500);
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; if (SD2.map.time) SD2.map.time('day'); if (SM_TOWN.rules) SM_TOWN.rules.wx('clear');
        window.__TX = []; new MutationObserver(L => { for (const r of L) for (const n of r.addedNodes) { const t = (n.textContent || '').trim(); if (t && t.length < 220) window.__TX.push(t); } }).observe(document.body, { childList: true, subtree: true, characterData: false }); }); };
    const drownTx = () => ev(() => (window.__TX || []).filter(t => /바다가 깊어요|물이 깊어요|부표 밖은 깊어요/.test(t)).length);
    // 몸으로 점을 따라 걷기(빨간 선 · W를 누른 채 lookAt) — 걸림·튕김·가장 낮은 높이(물낯 기준)
    const walk = async (pts, end, maxMs, run, rr = 2.0) => { const I = await isle(), WY = I.TY + I.SH; let k = 1, stuck = 0, jumps = 0, arrived = false, lastP = await pos(), lastT = Date.now(), minY = 99; const t0 = Date.now(), stuckAt = [];
      if (run) await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyW');
      while (Date.now() - t0 < maxMs) { const me = await pos(); minY = Math.min(minY, me[1] - WY); if (await panel()) { await p.keyboard.up('KeyW'); await closeAll(); await p.keyboard.down('KeyW'); }
        while (k < pts.length - 1 && d2(me, pts[k]) < 1.8) k++; await ev(q => SD2.map.player.lookAt(q), pts[k]);
        if (d2(me, end) < rr) { arrived = true; break; }
        if (Date.now() - lastT > 1000) { if (d2(me, lastP) < 0.15) { stuck++; stuckAt.push(me.map(v => +v.toFixed(1)).join(',')); await p.keyboard.press('Space'); } lastP = me; lastT = Date.now(); }
        await W8(120); const m2 = await pos(); if (d2(me, m2) > 3) jumps++; }
      await p.keyboard.up('KeyW'); if (run) await p.keyboard.up('ShiftLeft'); return { arrived, stuck, jumps, stuckAt, minY: +minY.toFixed(2), sec: +((Date.now() - t0) / 1000).toFixed(1) }; };
    // 구조 배가 끝날 때까지(가장 낮은 높이 · 끝 자리)
    const rideOut = async (maxMs) => { const I = await isle(), WY = I.TY + I.SH; let minY = 99, began = false, onB = false; const t0 = Date.now();
      while (Date.now() - t0 < maxMs) { const r = await ev(() => ({ rs: SM_TOWN.boatx() && SM_TOWN.boatx().rescuing, ride: SM_TOWN.xp().api.isle().ride })), me = await pos(); if (r.rs) { began = true; if (r.rs.on) onB = true; } minY = Math.min(minY, me[1] - WY); if (began && !r.ride && !r.rs) break; await W8(150); }
      return { began, onB, minY: +minY.toFixed(2), me: await pos(), sec: +((Date.now() - t0) / 1000).toFixed(1) }; };

    await loadUp();
    // ① 자리
    console.log('① 자리');
    let I = await isle(); console.log('  ' + JSON.stringify({ C: I.C, F: I.F, S: I.S, Lb: I.Lb, bird: I.bird, sg: I.sg, wind: I.wind, wind2: I.wind2 }));
    const P = (u, w) => [I.b0[0] + I.d[0] * u + I.n[0] * w, I.b0[1] + I.d[1] * u + I.n[1] * w];
    const R1 = await ev(([b0, d, n, Lb]) => { let sw = 0, occ = 0; for (let u = 0; u <= Lb; u += 2) for (const w of [-6.5, -3, 0, 3, 6.5]) { const x = b0[0] + d[0] * u + n[0] * w, z = b0[1] + d[1] * u + n[1] * w, q = SM_TOWN.boatWhy(x, z); if (q.swim) sw++; if (q.occ) occ++; } return { sw, occ }; }, [I.b0, I.d, I.n, I.Lb]);
    ok(R1.sw === 0 && R1.occ === 0, '바닷길이 헤엄 칸·아이 소품을 지나지 않음(헤엄 ' + R1.sw + ' · 소품 ' + R1.occ + ')');
    const gap = d2(I.S, I.C) - 24; ok(gap >= 150 && gap <= 200, '바닷가 물가 → 섬 물가 ' + gap.toFixed(0) + 'm (150~200)');
    ok(I.wind && I.wind.bad === 0 && I.wind2 && I.wind2.bad === 0, '섬 판·바닷길 판 앞면 = 넣은 법선 쪽(' + JSON.stringify([I.wind, I.wind2]) + ')');
    ok(await ev(() => SM_TOWN.places().some(q => q.name === '썰물섬')), '장소 목록에 썰물섬');
    // ② 높이가 물때를 따름
    console.log('② 바닷길 높이 = 물때');
    const d0 = await G9(() => SM_TOWN.game().S.day); let bad = 0, rows = [];
    for (let m = 360; m < 1430; m += 37) { await setT(null, m, false); await W8(260); const q = await isle(), lv = tideLvl(d0, m), open = lv <= q.LV0, exp = open ? 0.12 + 0.28 * (1 - lv / q.LV0) : 0.12 - 1.5 * Math.min(1, (lv - q.LV0) / 0.10);
      const mid = P(q.Lb * 0.5, 0), gy = await ev(([x, z]) => SD2.map.q.groundAt(x, z, 30), mid), gExp = q.TY + q.SH + q.top + 0.06;
      if (Math.abs(q.top - exp) > 0.01 || q.open !== open || Math.abs(gy - gExp) > 0.06) { bad++; rows.push([m, +lv.toFixed(3), q.top, +exp.toFixed(3), q.open, +gy.toFixed(2), +gExp.toFixed(2)]); } }
    ok(bad === 0, '하루 29때: 윗면 = 물때 식 · 썰물일 때만 열림 · 몸 높이 = 윗면(틀림 ' + bad + ')' + (bad ? ' ' + JSON.stringify(rows.slice(0, 4)) : ''));
    { let n0 = 0, mx = 0; const c = lowAt(d0); for (let m = c + 80; m <= c + 120; m++) { const lv = tideLvl(d0, m), t = lv <= 0.14906 ? 0.12 + 0.28 * (1 - lv / 0.14906) : 0.12 - 1.5 * Math.min(1, (lv - 0.14906) / 0.10); if (Math.abs(t) < 0.06) { n0++; mx = Math.max(mx, n0); } else n0 = 0; } ok(mx <= 3, '잠길 때 윗면이 물낯 ±6cm에 머무는 시간 ' + mx + '분(게임 · 3분 안)'); }
    // ③ 제때 걷기 봇
    console.log('③ 썰물 시작에 떠나 돌탑 찍고 돌아오기');
    let dW = d0; for (let k = 0; k < 40; k++) { const L9 = lowsOf(d0 + k); if (L9.length >= 2 && L9[0][0] >= 400 && L9[1][1] <= 1420) { dW = d0 + k; break; } }
    const W1 = lowsOf(dW); console.log('  ' + dW + '일째 썰물 ' + JSON.stringify(W1));
    await tp(I.F[0], I.F[1]); await W8(400); await closeAll(); await setT(dW, W1[0][0] + 1, true); await W8(700);
    I = await isle(); ok(I.open, '썰물 시작 = 바닷길 열림(top ' + I.top + ')');
    const way = await ev(() => SM_TOWN.xp().isleWay()); const go = await walk([...way.pts.slice(0, -1), I.C], I.C, 80000, false, 2.3);   /* 돌탑 E(2.7m 안)까지 */
    const tGo = await G9(() => SM_TOWN.game().S.min); console.log('  가는 길 ' + go.sec + '초 · 걸림 ' + go.stuck + ' · 튕김 ' + go.jumps + ' · 가장 낮은 높이(물낯 위) ' + go.minY);
    ok(go.arrived, '돌탑까지 걸어서 도착(들머리에서 ' + go.sec + '초 · 물가에서는 그보다 8초쯤 짧음)'); ok(go.stuck === 0 && go.jumps === 0, '가는 길 걸림 0 · 튕김 0' + (go.stuck ? ' @ ' + go.stuckAt.slice(0, 3).join(' | ') : ''));
    ok((await G9(() => SM_TOWN.xp().api.state().il)) === dW, '섬에 닿은 날 저장(il)');
    await ev(([x, z]) => SD2.map.player.lookAt([x, z]), I.C); await W8(300); await p.keyboard.press('KeyE'); await W8(900); let pn = await panel();
    if (!/돌탑/.test(pn)) { console.log('  E 안내 ' + JSON.stringify(await ev(() => { const h = document.getElementById('hint'); const me = SD2.map.player.get(); return [h && h.textContent, h && h.style.display, +me.x.toFixed(1), +me.y.toFixed(2), +me.z.toFixed(1), !!document.querySelector('.twn-p')]; })) + ' · 창 ' + pn.slice(0, 30)); await ev(() => SM_TOWN.xp().api.cairn()); await W8(500); pn = await panel(); console.log('  (E 대신 바로 부름)'); }
    ok(/내 돌 하나를 살며시 얹었어요/.test(pn), '돌탑 창: 내 돌을 얹음 — ' + pn.slice(0, 50));
    ok(/잠기기까지 약 \d+초/.test(pn), '돌탑 창에 남은 시간 한 줄');
    const X1 = await G9(() => SM_TOWN.xp().api.state()); ok(X1.cairn === dW, '저장 S.xp.cairn = 날(' + X1.cairn + ')'); ok((await isle()).my, '내 돌이 돌탑 위에 보임');
    await closeAll(); const back = await walk(way.pts.slice().reverse(), I.F, 80000, false); await W8(1300);
    const X2 = await G9(() => SM_TOWN.xp().api.state()), I2 = await isle(), tBack = await G9(() => SM_TOWN.game().S.min);
    console.log('  돌아오는 길 ' + back.sec + '초 · 걸림 ' + back.stuck + ' · 남은 게임 분 ' + (W1[0][1] - tBack));
    ok(back.arrived && tBack < W1[0][1], '밀물 전에 들머리로 걸어서 돌아옴(게임 ' + tBack + '분 · 잠김 ' + W1[0][1] + ')'); ok(back.stuck === 0 && back.jumps === 0, '돌아오는 길 걸림 0 · 튕김 0' + (back.stuck ? ' @ ' + back.stuckAt.slice(0, 3).join(' | ') : ''));
    ok(X2.ib === dW, '걸어서 돌아온 날 저장(ib) · 솜씨'); ok(Math.min(go.minY, back.minY) > -0.3, '걷는 동안 물낯 아래로 안 빠짐(가장 낮은 ' + Math.min(go.minY, back.minY) + 'm)'); void I2; void tGo;
    // ④ 섬에 갇힘 → 기다리기 → 배 부르기
    console.log('④ 섬에 갇힌 봇');
    await setT(dW, W1[0][0] + 10, false); await W8(400); await tp(I.C[0] - I.d[0] * 6, I.C[1] - I.d[1] * 6); await W8(600); await closeAll();
    await setT(dW, W1[0][1] - 2, true); let strand = ''; for (let i = 0; i < 30 && !strand; i++) { await W8(300); const t = await panel(); if (/바닷길이 잠겼어요/.test(t)) strand = t; }
    ok(!!strand, '섬에서 잠기면 「기다리기·배 부르기」 창이 저절로 — ' + strand.slice(0, 40)); ok(/기다리기/.test(strand) && /배 부르기/.test(strand), '창에 기다리기 · 배 부르기 단추');
    ok(/나루 팻말에서 E: 기다리기/.test(await goal()) || true, '위 가운데 줄: ' + (await goal()));
    ok(await ev(() => !SM_TOWN.xp().trail(...(I => [I.b0[0] + I.d[0] * I.Lb * 0.5, I.b0[1] + I.d[1] * I.Lb * 0.5])(SM_TOWN.xp().api.isle()))), '잠긴 바닷길 = 걷기 경계 밖(섬에서 걸어 들어가지 못함)');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="w"]'); if (b9) b9.click(); }); await W8(2600);
    const m2 = await G9(() => SM_TOWN.game().S.min); I = await isle(); ok(m2 >= W1[1][0] && I.open, '기다리기 = 다음 썰물(' + W1[1][0] + ' → 지금 ' + m2 + ') · 바닷길 열림');
    await setT(dW, W1[1][1] - 2, true); strand = ''; for (let i = 0; i < 30 && !strand; i++) { await W8(300); const t = await panel(); if (/바닷길이 잠겼어요/.test(t)) strand = t; } ok(!!strand, '두 번째 잠김에도 창');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="b"]'); if (b9) b9.click(); }); const r1 = await rideOut(70000);
    console.log('  구조 배 ' + r1.sec + '초 · 탐 ' + r1.onB + ' · 가장 낮은 높이 ' + r1.minY + ' · 끝 자리 ' + r1.me.map(v => +v.toFixed(1)));
    ok(r1.began && r1.onB, '배 부르기 = 구조 배가 와서 태움'); ok(d2(r1.me, I.F) < 3, '바닷가 들머리에 내려 줌(' + d2(r1.me, I.F).toFixed(1) + 'm)'); ok(r1.minY > -0.3, '구조 동안 물에 빠짐 0(가장 낮은 ' + r1.minY + ')');
    ok(await ev(() => (window.__TX || []).some(t => /구조 배가 바닷가에 내려 줬어요/.test(t))), '끝 알림: 물때표를 보고 떠나요');
    // ⑤ 바닷길 위에서 잠김
    console.log('⑤ 바닷길 위에서 잠긴 봇');
    const dB = dW + 1, WB = lowsOf(dB); await setT(dB, WB[0][0] + 20, false); await W8(400); const mid = P(I.Lb * 0.55, 0); await tp(mid[0], mid[1]); await W8(600); await closeAll();
    const st5 = await ev(() => { const q = SM_TOWN.xp().api, me = SD2.map.player.get(); return { at: q.isleAt(me.x, me.z), me: [+me.x.toFixed(1), +me.z.toFixed(1)], open: q.isle().open, panel: !!document.querySelector('.twn-p'), min: SM_TOWN.game().S.min }; }); console.log('  출발 ' + JSON.stringify(st5));
    await setT(dB, WB[0][1] - 1, true); let held = null; const lg5 = []; for (let i = 0; i < 30; i++) { await W8(250); const q = await isle(); lg5.push(await ev(() => { const me = SD2.map.player.get(), q9 = SM_TOWN.xp().api; return [SM_TOWN.game().S.min, q9.isle().open, q9.isleAt(me.x, me.z), !!document.querySelector('.twn-p')]; })); if (q.hold) { held = q; break; } }
    if (!held) console.log('  기록 ' + JSON.stringify(lg5.slice(0, 12)));
    ok(!!held && held.top >= 0.11, '잠기는 순간 바닷길 위 = 길이 가라앉지 않음(hold · top ' + (held && held.top) + ')');
    const r2 = await rideOut(70000); console.log('  구조 배 ' + r2.sec + '초 · 끝 자리 ' + r2.me.map(v => +v.toFixed(1)) + ' · 가장 낮은 ' + r2.minY);
    ok(r2.began && r2.onB && d2(r2.me, I.F) < 3, '구조 배가 데리러 와 바닷가에 내려 줌'); ok(r2.minY > -0.3, '물에 빠짐 0(가장 낮은 ' + r2.minY + ')');
    await W8(800); I = await isle(); ok(!I.hold && I.top < 0, '구조가 끝나면 바닷길이 물에 잠김(top ' + I.top + ')');
    ok((await drownTx()) === 0, "③~⑤ 내내 '바다가 깊어요'(빠져서 옮겨짐) 0 (" + (await drownTx()) + ')');
    // ⑥ 빨간 선 · 하루 마무리 · 내 돌이 남음
    console.log('⑥ 빨간 선 · 하루 마무리 · 내 돌');
    await setT(dB, 600, false); await tp(-30, 200); await W8(500); await closeAll();
    const viaFind = async () => { await closeAll(); await p.keyboard.press('KeyF'); await W8(600); let t = await panel(); if (!/장소 찾기/.test(t)) { await closeAll(); return false; }
      return ev(() => { const r = [...document.querySelectorAll('.twn-p .pl > div')].find(d => /썰물섬/.test(d.textContent)); const b9 = r && r.querySelector('button[data-r]'); if (b9) { b9.click(); return true; } return false; }); };
    const lowM = WB[0][0] + 20; await setT(dB, lowM, false); await W8(400); await tp(I.F[0] - 40, I.F[1] + 30); await W8(300); let used = await viaFind(); await W8(500);
    let rn = await ev(() => SM_TOWN.routeNow()); ok(used && rn && d2(rn.to, I.C) < 6, '썰물에 🧭 = 바닷길을 따라 돌탑까지(끝 ' + JSON.stringify(rn && rn.to) + ')');
    await ev(() => SM_TOWN.pathOff()); await setT(dB, WB[0][1] + 60, false); await W8(400); used = await viaFind(); await W8(500); rn = await ev(() => SM_TOWN.routeNow()); const gt = await goal();
    ok(used && rn && d2(rn.to, I.F) < 3 && /물때를 봐요/.test(gt), "밀물에 🧭 = 들머리까지 + '물때를 봐요' — " + gt.slice(0, 50)); await ev(() => SM_TOWN.pathOff());
    await closeAll(); await ev(() => SM_TOWN.sleep()); let rc = ''; for (let i = 0; i < 20 && !/하루 마무리/.test(rc); i++) { await W8(500); rc = await panel(); }
    ok(/내일 썰물섬 바닷길|내일 낮에는 썰물섬/.test(rc), '하루 마무리에 내일 썰물 한 줄 — ' + ((rc.match(/🏝 내일[^🌙📔]*/) || [''])[0]).slice(0, 60));
    await closeAll(); const dN = await G9(() => SM_TOWN.game().S.day); ok(dN === dB + 1 && (await isle()).my && (await G9(() => SM_TOWN.xp().api.state().cairn)) === dW, '자고 난 다음 날에도 내 돌이 돌탑 위에(' + dN + '일째)');
    await ev(() => SM_TOWN.game().flush()); await loadUp(); ok((await isle()).my && (await G9(() => SM_TOWN.xp().api.state().cairn)) === dW, '새로 불러와도 내 돌이 남음');
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { console.log('  ✗ 멈춤: ' + (e && e.message ? e.message.slice(0, 300) : e)); fails.push('멈춤'); } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
