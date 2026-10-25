// 🏡 이웃 하루 일과 · 먹이·물 연쇄 시험(ROUTINE-1 · docs/systems/town_routine.md): node tools/harness/town_routine.cjs [마을=ourtown] [포트=8002]
//   ① 10:00 = 일꾼이 다 자리에 · E 켜짐 → 20:30·06:30 = 자리 비움 · E 꺼짐 → 아침 시계를 돌리면 집에서 걸어 나와(한 번에 1.5m 넘게 안 튐) 일 시간 안에 도착 · E 다시 켜짐 → 일이 끝나면 걸어서 집에 감
//   ② 여름 비 사흘 → 다음 날 개구리·왜가리 수가 늘고 논에 왜가리 · 소식판 한 줄 · 비 없는 날 닷새 → 줄어듦 · 소식 한 줄 · 도감 '먹이 사슬' 한 줄(본 것만)
//   ③ ROUTINE-2 12:30 점심(앉음 · E 한 줄 · 13:05 다시 일함) · 오후 장 보기(가게·장터 앞에 닿고 바구니 들고 집으로) · 19:20 맑음 = 정자에 둘 이상 · 이야기 말풍선 · 비 = 흩어짐·안 모임
//   ④ 1초 칸·걷기 비용 · 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');   /* --perf = 그리기 켜고 걷는 동안·걷지 않을 때 프레임 견줌 */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.routine && SM_TOWN.routine() && SM_TOWN.wild && SM_TOWN.wild(), null, { timeout: 240000 }); await W8(2500);
    const shut = async () => { for (let i = 0; i < 6; i++) { const any = await ev(() => { const P = document.querySelector('.twn-play .x, .twn-play [data-a="x"]'); if (P) { P.click(); return 1; } const Q = document.querySelector('.twn-p [data-a="x"]'); if (Q) { Q.click(); return 1; } return document.querySelector('.twn-p,.twn-play,.twn-dlg') ? 2 : 0; }); if (!any) break; if (any === 2) await p.keyboard.press('Escape'); await W8(250); } };
    await shut(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.season('summer'); });
    const RT = () => ev(() => SM_TOWN.routine().info()), at = async (m, clock) => { await ev(([m9, c9]) => { const G = SM_TOWN.game(); G.S.clock = c9; G.S.min = m9; G.mark(); }, [m, !!clock]); await W8(1600); };
    // ── ① 일과 ──
    console.log('① 이웃 하루 일과');
    await at(10 * 60, true); await ev(() => SM_TOWN.game().S.clock = false); let I = await RT();
    const kinds = {}; for (const o of I.list) kinds[o.k] = (kinds[o.k] || 0) + 1; console.log('  일과 일꾼 ' + I.n + ' · ' + Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(' · '));
    ok(I.n >= 8, '일과가 있는 일꾼 ' + I.n + '명');
    const inH = (o, m) => m >= o.hrs[0] * 60 && m < o.hrs[1] * 60;
    { const bad = I.list.filter(o => inH(o, 600) && (o.st !== 'in' || o.off)); ok(!bad.length, '10:00 = 일 시간인 일꾼 모두 자리 · E 켜짐 (' + (I.list.length - bad.length) + '/' + I.list.filter(o => inH(o, 600)).length + (bad.length ? ' · 어긋남 ' + bad.slice(0, 3).map(o => o.k + ' ' + o.st).join(', ') : '') + ')'); }
    for (const m0 of [20 * 60 + 30, 6 * 60 + 30]) { await at(m0, true); await ev(() => SM_TOWN.game().S.clock = false); I = await RT(); const m = await ev(() => SM_TOWN.game().S.min);   /* 시계를 돌려 때를 바꾼 뒤 멈춤 · 판정은 지금 분으로 */ const hh = Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
      const out = I.list.filter(o => !inH(o, m)), gone = out.filter(o => o.st === 'out' && o.off && o.out), early = out.filter(o => o.st === 'in' && ((m >= o.cs && m < o.hrs[0] * 60) || o.nd)), bad = out.filter(o => !gone.includes(o) && !early.includes(o));
      ok(!bad.length && gone.length >= out.length * 0.75, hh + ' = 일 시간 밖 일꾼 자리 비움 ' + gone.length + '/' + out.length + (early.length ? ' (일찍 와 기다림·이야기에 필요 ' + early.length + ')' : '') + (bad.length ? ' · 어긋남 ' + bad.slice(0, 3).map(o => o.k + ' ' + o.st + ' off ' + o.off + ' cs ' + o.cs + ' la ' + o.la + ' hm ' + JSON.stringify(o.hm)).join(', ') : ''));
      const eOn = await ev(() => { const L = SM_TOWN.routine().info().list.filter(o => o.out); return SD2.map.interact.list().filter(h => !h.off && L.some(o => Math.abs(o.x - h.x) < 3.2 && Math.abs(o.z - h.z) < 3.2) && /같이 해요|장터 \(|쉬는 중/.test(h.label)).length; });
      ok(eOn === 0, hh + ' 비운 자리의 일꾼 E 0 (' + eOn + ')'); }
    // 아침 출근 걷기(카메라 곁 · 시계 돌림)
    { const nH = await ev(() => SM_TOWN.routine().homes()); I = await RT(); const c = I.list.filter(o => o.hm && o.hrs[0] === 7);
      console.log('  집 자리 ' + nH + '/' + I.n + ' (문 ' + I.list.filter(o => o.hm && o.hm.door).length + ' · 길가 ' + I.list.filter(o => o.hm && !o.hm.door).length + ')');
      ok(c.length > 0, '집 자리가 있는 07~19 일꾼 ' + c.length);
      const o = c.find(q => q.hm.door) || c[0];
      if (o) { await ev(([x, z]) => { SD2.map.player.teleport([x + 6, SM_TOWN.ground(x + 6, z) + 0.1, z]); }, [o.hm.x, o.hm.z]); await at(o.cs - 3, true); await W8(400);
        let seen = { come: 0, inAt: null, maxStep: 0, n: 0 }, last = null; const t0 = Date.now();
        while (Date.now() - t0 < 45000) { await W8(200); const r = await ev(i9 => { const R = SM_TOWN.routine().info(), q = R.list.find(v => v.i === i9); return { q, min: SM_TOWN.game().S.min }; }, o.i); const q = r.q;
          if (q.st === 'come') { seen.come++; if (q.mx != null) { if (last) seen.maxStep = Math.max(seen.maxStep, Math.hypot(q.mx - last[0], q.mz - last[1])); last = [q.mx, q.mz]; seen.n++; } }
          if (q.st === 'in' && seen.come) { seen.inAt = r.min; break; } }
        ok(seen.come > 2, '아침 = 집에서 걸어 나옴 (걷는 칸 ' + seen.come + ' · ' + o.k + ' 문 ' + (o.hm.door ? 'O' : 'X') + ')');
        ok(seen.n > 2 && seen.maxStep < 1.5, '걷기 = 0.2초에 1.5m 넘게 안 튐 (가장 큰 걸음 ' + seen.maxStep.toFixed(2) + 'm)');
        ok(seen.inAt != null && seen.inAt <= 7 * 60 + 8, '일 시간 안에 도착 (' + (seen.inAt != null ? Math.floor(seen.inAt / 60) + ':' + String(seen.inAt % 60).padStart(2, '0') : '못 옴') + ')');
        const off = await ev(i9 => SM_TOWN.routine().info().list.find(v => v.i === i9).off, o.i); ok(!off, '도착하면 E 다시 켜짐');
        // 퇴근(시험 손잡이로 일 끝 = 지금+2분 · 낮이라 보임)
        const m0 = await ev(() => SM_TOWN.game().S.min); await ev(([k, m9]) => SM_TOWN.routine().hrsTest(k, [7, (m9 + 2) / 60]), [o.k, m0]);
        let go = 0, gone = null; const t1 = Date.now(); while (Date.now() - t1 < 45000) { await W8(250); const q = await ev(i9 => SM_TOWN.routine().info().list.find(v => v.i === i9), o.i); if (q.st === 'go') go++; if (q.st === 'out') { gone = q; break; } }
        ok(go > 2 && gone && gone.off, '일이 끝나면 걸어서 집에 감 (걷는 칸 ' + go + ' · E 꺼짐 ' + !!(gone && gone.off) + ')');
        await ev(k => SM_TOWN.routine().hrsTest(k, null), o.k);
        if (RENDER) { const FR = () => ev(() => new Promise(res => { const T = []; let l = performance.now(); const f = () => { const n = performance.now(); T.push(n - l); l = n; if (T.length < 90) requestAnimationFrame(f); else { T.shift(); T.sort((a, b) => a - b); res({ worst: Math.round(T[T.length - 1]), p95: Math.round(T[Math.floor(T.length * 0.95)]), mv: SM_TOWN.routine().info().mv }); } }; requestAnimationFrame(f); }));
          await at(10 * 60, true); await ev(([x, z]) => { SD2.map.player.teleport([x + 4, SM_TOWN.ground(x + 4, z) + 0.1, z]); }, [o.x, o.z]); await W8(1500); const f0 = await FR();
          const m1 = await ev(() => SM_TOWN.game().S.min); await ev(([L9, m9]) => { for (const k of L9) SM_TOWN.routine().hrsTest(k, [7, (m9 + 1) / 60]); }, [Object.keys(kinds), m1]); let f1 = null; for (let k = 0; k < 40 && !f1; k++) { await W8(250); if ((await RT()).mv > 0) f1 = await FR(); }
          await ev(L9 => { for (const k of L9) SM_TOWN.routine().hrsTest(k, null); }, Object.keys(kinds));
          console.log('  프레임(그리기 켬) 걷는 몸 0 = ' + JSON.stringify(f0) + ' · 걷는 동안 = ' + JSON.stringify(f1)); ok(f1 && f1.mv > 0 && f1.worst <= Math.max(50, f0.worst * 1.5), '걷는 동안 가장 긴 프레임이 걷지 않을 때와 같은 범위'); } } }
    I = await RT(); console.log('  걷기 tick 가장 긴 ' + I.tickMax + 'ms · 걸어 나옴 ' + I.nCome + ' · 걸어 들어감 ' + I.nGo + ' · 바로 옮김 ' + I.nSnap); ok(I.tickMax < 1, '걷기 tick < 1ms (' + I.tickMax + ')');
    // ── ③ 갈래 셋(ROUTINE-2): 점심 · 장 보러 가기 · 정자에 모이기 ──
    console.log('③ 점심 · 장 보러 가기 · 정자');
    await ev(() => SM_TOWN.rules.wx('clear')); await at(10 * 60, false);
    { await at(12 * 60 + 30, false); await W8(1200); I = await RT(); const lt = I.list.filter(o => o.ev.lun), sat = lt.filter(o => o.st === 'lun');
      console.log('  점심 먹는 일꾼 ' + lt.length + ' · 앉음 ' + sat.length + ' (벤치 ' + sat.filter(o => o.ev.lun.bench).length + ' · 땅 ' + sat.filter(o => !o.ev.lun.bench).length + ')');
      ok(sat.length >= 3 && sat.length >= lt.length * 0.7, '12:30 = 정해진 일꾼이 앉아 도시락 (' + sat.length + '/' + lt.length + ')');
      ok(sat.every(o => o.ev.act === 17 || o.ev.act === 18) && sat.every(o => o.ev.tool === 9 || o.ev.tool === 10), '앉은 몸짓·도시락 (' + [...new Set(sat.map(o => o.ev.act + '/' + o.ev.tool))].join(' ') + ')');
      ok(sat.every(o => o.off && /점심 먹는 중 · 13:00/.test(o.ev.hot || '')), '일 E 꺼짐 · E = 점심 한 줄 (' + (sat[0] && sat[0].ev.hot) + ')');
      const U = sat[0] ? await ev(i9 => { const L9 = SD2.map.interact.list().filter(h => !h.off && /점심 먹는 중/.test(h.label)), o = SM_TOWN.routine().info().list.find(v => v.i === i9), h = L9.find(q => Math.abs(q.x - o.ev.lun.x) < 0.5 && Math.abs(q.z - o.ev.lun.z) < 0.5); if (!h) return null; h.use(); return SM_TOWN.ask.bub(); }, sat[0].i) : null;
      ok(!!U && U.t > 0, 'E를 누르면 말풍선 한 줄 (' + JSON.stringify(U) + ')');
      const nOther = I.list.filter(o => !o.ev.lun && o.hrs[0] * 60 <= 750 && o.hrs[1] * 60 > 750 && !o.nd && o.st !== 'in').length; ok(nOther === 0, '점심 안 먹는 일꾼은 그대로 일함 (어긋남 ' + nOther + ')');
      await at(13 * 60 + 5, false); await W8(800); I = await RT(); const back = I.list.filter(o => sat.some(q => q.i === o.i) && o.st === 'in' && !o.off).length, hl = await ev(() => SD2.map.interact.list().filter(h => /점심 먹는 중/.test(h.label)).length);
      ok(back === sat.length && hl === 0, '13:05 = 다시 일함 ' + back + '/' + sat.length + ' · 점심 E 남은 것 ' + hl); }
    // 장 보러 가기: 가게·장터까지 가장 가까운 이웃 · 카메라가 따라감(시계 멈춤 · 걷기는 진짜 시간)
    { const E = await ev(() => SM_TOWN.routine().ev()); const cs = E.cand.filter(c => c.hm).slice().sort((a, b) => a.d - b.d); console.log('  장 보러 갈 수 있는 이웃 ' + cs.length + ' · 오늘 ' + E.shoppers.length + '명 · 가까운 셋 ' + cs.slice(0, 3).map(c => c.k + ' ' + c.d + 'm').join(', '));
      ok(E.shoppers.length >= 1 && E.shoppers.length <= 2, '하루 장 보는 이웃 한두 명 (' + E.shoppers.length + ')');
      let pass = null;
      for (const c of cs.slice(0, 4)) { await at(14 * 60 + 20, false); await W8(500); await shut(); const q0 = (await RT()).list.find(v => v.i === c.i); if (!q0 || q0.st !== 'in') continue;
        await ev(([x, z]) => { SD2.map.player.teleport([x + 5, SM_TOWN.ground(x + 5, z) + 0.1, z]); }, [q0.x, q0.z]); await W8(600);
        const m0 = await ev(() => SM_TOWN.game().S.min); await ev(([i9, m9]) => SM_TOWN.routine().evTest.shop(i9, m9), [c.i, m0]); await W8(1500);
        const seen = { go: 0, inn: 0, home: 0, carry: 0, at: null, out: 0, maxStep: 0, blk: 0, n: 0, road: 0 }; let last = null; const t0 = Date.now();
        while (Date.now() - t0 < 600000) { await W8(400); const r = await ev(i9 => { const q = SM_TOWN.routine().info().list.find(v => v.i === i9), y = SM_TOWN.ground(q.cx, q.cz); return { q, blk: SD2.map.q.blocked(q.cx, q.cz, y + 0.5) ? 1 : 0 }; }, c.i); const q = r.q;
          if (q.st === 'shopHome' && q.hold) { if (!seen.door) { seen.door = 1; await ev(([x, z]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.1, z]); }, [q.cx + 60, q.cz]); } continue; }   /* 길가 집 = 서서 기다림 → 카메라가 멀어지면 들어감 */
          if (q.st === 'shopGo' || q.st === 'shopHome') { if (q.st === 'shopGo') seen.go++; else { seen.home++; if (q.ev.tool === 11) seen.carry++; } seen.n++; seen.blk += r.blk; if (last) seen.maxStep = Math.max(seen.maxStep, Math.hypot(q.cx - last[0], q.cz - last[1])); last = [q.cx, q.cz];
            if (seen.n % 6 === 0) await ev(([x, z]) => { SD2.map.player.teleport([x + 4, SM_TOWN.ground(x + 4, z) + 0.1, z]); }, [q.cx, q.cz]); }   /* 카메라가 따라감 */
          if (q.st === 'shopIn' && !seen.at) { seen.inn++; seen.at = [q.cx, q.cz, q.ev.shop && q.ev.shop.tgt]; }
          if (q.st === 'out' && (seen.go || seen.inn)) { seen.out = 1; break; } if (q.st === 'out' && !seen.go) break; }
        console.log('  ' + c.k + ' ' + JSON.stringify(seen)); if (seen.go) { pass = seen; break; } }
      ok(!!pass && pass.go > 2, '오후 = 가게·장터 쪽으로 걸어감 (걷는 칸 ' + (pass && pass.go) + ')');
      ok(!!pass && pass.at && pass.at[2] && Math.hypot(pass.at[0] - pass.at[2][0], pass.at[1] - pass.at[2][1]) < 2.5, '가게·장터 앞에 닿음 (' + JSON.stringify(pass && pass.at) + ')');
      ok(!!pass && pass.home > 2 && pass.carry > 0 && pass.out, '장바구니를 들고 집으로 가서 들어감 (걷는 칸 ' + (pass && pass.home) + ' · 바구니 ' + (pass && pass.carry) + ')');
      ok(!!pass && pass.maxStep < 1.6, '걷기 = 0.4초에 1.6m 넘게 안 튐 (' + (pass && pass.maxStep.toFixed(2)) + 'm)');
      ok(!!pass && pass.blk <= Math.ceil(pass.n * 0.05), '걷는 자리가 막힌 곳 아님 (막힘 ' + (pass && pass.blk) + '/' + (pass && pass.n) + ')'); }
    // 정자: 맑은 저녁 19:20 = 둘 이상 앉음 · 이야기 말풍선 · 밤에도 그 몸만 보임 · 비 오면 흩어지고 비 오는 날은 안 모임
    { await ev(() => SM_TOWN.rules.wx('clear')); await at(19 * 60 + 20, false); let E = null; for (let k = 0; k < 30; k++) { await W8(1000); I = await RT(); if (I.list.filter(o => o.st === 'pav').length >= 2 && !I.list.some(o => o.st === 'pavCome')) break; } E = await ev(() => SM_TOWN.routine().ev());
      const P = E.pv[0]; console.log('  모이는 곳 ' + JSON.stringify(E.pv.map(q => ({ k: q.k, x: q.x, z: q.z, ap: q.ap, who: q.who }))));
      ok(!!P, '정자·쉼터 자리 ' + E.pv.length);
      const sitN = () => I.list.filter(o => o.st === 'pav').length;
      ok(sitN() >= 2 && I.list.filter(o => o.st === 'pav').every(o => o.ev.act === 17 && o.ev.nv), '19:20 맑음 = 정자에 둘 이상 앉음 (' + sitN() + ' · 밤에도 보임 ' + E.nightN + ')');
      if (P) { await ev(([x, z]) => { SD2.map.player.teleport([x + 7, SM_TOWN.ground(x + 7, z) + 0.1, z + 3]); }, [P.x, P.z]); await W8(800); await shut(); const n0 = (await ev(() => SM_TOWN.routine().ev())).nTalk; let pop = ''; for (let k = 0; k < 40; k++) { await W8(1000); E = await ev(() => SM_TOWN.routine().ev()); if (E.nTalk - n0 >= 2) break; if (E.busy) { pop = pop || (await ev(() => [...document.querySelectorAll('.twn-p,.twn-play,.twn-dlg')].map(e => e.className + ':' + e.textContent.slice(0, 30)).join(','))); await shut(); } }   /* 창이 열린 동안 이야기는 쉼(말풍선이 창에 겹치지 않게) → 닫고 다시 */ if (pop) console.log('  (가운데 열린 창 닫음: ' + pop + ')'); 
        console.log('  이야기 ' + (E.nTalk - n0) + '줄 · 고를 말 ' + E.lines.length + ' 예: ' + E.lines.slice(0, 4).join(' / ')); ok(E.nTalk - n0 >= 2, '곁에 가면 이야기 말풍선 (' + (E.nTalk - n0) + '줄)'); }
      await ev(() => SM_TOWN.rules.wx('rain')); await W8(3000); I = await RT(); ok(sitN() === 0, '비가 오면 흩어짐 (앉음 ' + sitN() + ' · ' + I.list.filter(o => /^pav/.test(o.st)).map(o => o.st).join(',') + ')');
      await ev(() => SD2.map.player.teleport([0, SM_TOWN.ground(0, 0) + 0.2, 0])); await at(20 * 60 + 40, false); await W8(1200); I = await RT(); ok(I.list.every(o => !/^pav/.test(o.st)) && (await ev(() => SM_TOWN.routine().nightN())) === 0, '20:40 = 모두 들어감 · 밤에 보이는 몸 0');
      await ev(() => { SM_TOWN.rules.wx('rain'); SM_TOWN.routine().evTest.pvReset(); }); await at(19 * 60 + 25, false); await W8(2500);   /* 날을 넘기지 않음(② 날씨 기록이 밀리지 않게) */ I = await RT(); ok(sitN() === 0, '비 오는 저녁 = 안 모임 (' + sitN() + ')');
      await ev(() => SM_TOWN.rules.wx('clear')); }
    // ── ② 먹이·물 연쇄 ──
    console.log('② 먹이·물 연쇄');
    const day = async w => { await ev(w9 => { SM_TOWN.rules.wx(w9); }, w); await W8(1300); await ev(() => SM_TOWN.game().sleep()); await W8(1800); await shut(); await at(11 * 60, false); };
    const fcN = () => ev(() => SM_TOWN.wild().fcN());
    await at(11 * 60, false); await ev(() => SM_TOWN.rules.wx('clear')); const N0 = await fcN(), C0 = (await RT()).chain; console.log('  보통 날 ' + JSON.stringify(N0) + ' · ' + C0.d + '일째 ' + (C0.k || '없음'));
    for (let i = 0; i < 3; i++) await day('rain');
    const N1 = await fcN(), C1 = (await RT()).chain; console.log('  비 사흘 뒤 ' + JSON.stringify(N1) + ' · ' + C1.d + '일째 ' + C1.k + ' (비 ' + C1.n + '일)');
    ok(C1.k === 'wet', '비 사흘 → 다음 날 = 비 갈래 (' + C1.k + ')');
    ok(N1.frog > N0.frog && N1.heron + N1.heronPaddy > N0.heron + N0.heronPaddy && N1.heronPaddy > 0, '개구리 ' + N0.frog + '→' + N1.frog + ' · 왜가리 ' + (N0.heron + N0.heronPaddy) + '→' + (N1.heron + N1.heronPaddy) + ' (논 ' + N1.heronPaddy + ')');
    { const sp = await ev(() => SM_TOWN.wild().fcSpots()); if (sp[0]) { await ev(s => { SM_TOWN.wild().reset(); SD2.map.player.teleport([s.x + 10, SM_TOWN.ground(s.x + 10, s.z) + 0.2, s.z]); }, sp[0]); await W8(600); await ev(() => SM_TOWN.wild().sec()); const a = await ev(() => SM_TOWN.wild().fcSpots()[0].act); ok(a, '논 한가운데 왜가리가 실제로 나옴 (act ' + a + ')'); } else ok(false, '논 왜가리 자리 없음'); }
    { const N = await ev(() => { const R = SM_TOWN.newsRun(false); return R ? { lines: R.lines.map(L => L.k + ' ' + L.t), cand: R.cand.two } : null; }); console.log('  소식판 ' + JSON.stringify(N && N.lines)); ok(!!N && N.lines.some(t => /^chain:wet/.test(t) && /왜가리/.test(t)), '아침 소식판 한 줄 = 왜 늘었나 (비 사흘 → 개구리 → 왜가리)'); }
    for (let i = 0; i < 5; i++) await day('clear');
    const N2 = await fcN(), C2 = (await RT()).chain; console.log('  비 없는 닷새 뒤 ' + JSON.stringify(N2) + ' · ' + C2.d + '일째 ' + C2.k + ' (맑음 ' + C2.n + '일)');
    ok(C2.k === 'dry' && N2.frog < N0.frog && N2.heron < N0.heron && N2.heronPaddy === 0, '맑음 닷새 → 개구리 ' + N0.frog + '→' + N2.frog + ' · 왜가리 ' + N0.heron + '→' + N2.heron + ' · 논 왜가리 0');
    { const N = await ev(() => { const R = SM_TOWN.newsRun(false); return R ? R.lines.map(L => L.k + ' ' + L.t) : null; }); ok(!!N && N.some(t => /^chain:dry/.test(t)), '아침 소식판 한 줄 = 왜 줄었나 (' + (N || []).join(' / ').slice(0, 90) + ')'); }
    { const L = await ev(() => { const D = SM_TOWN.game().S.dex, R = SM_TOWN.routine(); const a = R.dexLine({}); const b = R.dexLine({ 'wild:frog': 1 }); const c = R.dexLine({ 'wild:frog': 1, 'wild:heron': 1 }); void D; return [a, b, c]; }); ok(L[0] === '' && /…/.test(L[1]) && !/왜가리/.test(L[1]) && !/❔/.test(L[1]) && /왜가리/.test(L[2]) && !/…/.test(L[2]), '도감 먹이 사슬 = 본 것만 (' + L[2] + ')'); }
    { const W = await ev(() => SM_TOWN.wild().info()); ok(W.secMax < 4, '야생동물 1초 칸 가장 긴 ' + W.secMax + 'ms'); }
    ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | '));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
