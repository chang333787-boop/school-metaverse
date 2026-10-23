// 🚲 길 위 사건 시험(WAKE-1b · docs/systems/town_road.md): node tools/harness/town_road.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 고리 코스 — 코스 셋 넘게 · 고리 8~15 · 고리 사이 길(1m 점)이 자전거 도로·길 위 · 몸 막힘 0 · 물·학교 0 · 고리 둘레 막힘 0
//   ② 자전거로 한 코스 끝까지(자동 걷기 = 게임의 steer · 21m/s) → 고리 차례로 지남 · 기록(최고 · 메달) · 가방 도장
//   ③ 걸어서 첫 고리 → 연습(기록 X) · 다른 곳으로 옮기면 멈춤
//   ④ 도움 요청 둘(모자·줍기) — 손 듦 → E → 창 '할 일:' → 도와드릴게요 → 해내기(걸어서 · E) → ❤ · 100원 · 일 솜씨 +2 / 시간 끝 = 실패(벌 X) / 다음에 = 그냥 끝
//   ④+ 하루 한도 — 같은 이웃 ❤ 하루 한 번 · 100원·솜씨 하루 넷 · 고리 코스 탐험 솜씨 = 코스마다 하루 한 번
//   ⑤ 움직이다 보면 저절로 손 듦(놀이 시계) · ⑥ 바람에 날아온 종이 → E = 보물 지도 조각(take) · 페이지 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await b.newPage({ viewport: { width: 1366, height: 768 } }), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.road().info());
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.road && SM_TOWN.road() && SM_TOWN.game, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { window.__R = {
      tp(x, z, lx, lz, y) { const M = SD2.map, g = M.q.groundAt(x, z, (y ?? SM_TOWN.ground(x, z)) + (y != null ? 0.8 : 2)); M.player.teleport([x, g + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); },
      free(x, z, ox, oz, y) { const M = SD2.map, B = (M.q.blocked || M.q.blockedAt); for (let r = 0.5; r < 8; r += 0.5) for (let a = 0; a < 12; a++) { const u = x + ox * r + Math.cos(a * 0.5236) * r * 0.6, v = z + oz * r + Math.sin(a * 0.5236) * r * 0.6, g = M.q.groundAt(u, v, (y ?? SM_TOWN.ground(u, v)) + (y != null ? 0.8 : 2)); if (!B(u, v, g + 0.6) && SM_TOWN.sd(u, v) > 1 && (y == null || Math.abs(g - y) < 1.2)) return [u, v]; } return [x + ox, z + oz]; },
      money: () => SM_TOWN.game().S.money, hearts: () => JSON.stringify(SM_TOWN.game().S.hearts || {}), near: () => SD2.near && SD2.near() };
      SM_TOWN.game().S.min = 11 * 60; SM_TOWN.weather('clear'); });
    if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
    /* 사건 밖에서 뜬 창(레벨 보상 등 — 사건 중엔 끝난 뒤로 미뤄짐)은 아이처럼 Esc로 닫고 감 */
    const clr = async () => { for (let k = 0; k < 4; k++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) return; await p.keyboard.press('Escape'); await W8(350); } };
    const shot = async n => { if (!SHOTS) return; await W8(400); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    // 자동 걷기: 목표 점까지(걸리면 옆으로 반 걸음 · 끝내 못 가면 1.5m 앞으로 옮김 = tp로 셈)
    let tpN = 0; const goTo = async (fn, v, near, maxIt = 400) => { let chk = null, side = 0, sideN = 0, r = null, stuck = 0;
      for (let it = 0; it < maxIt; it++) { const sd = side > 0 ? (sideN % 2 ? 1 : -1) : 0; side--; r = await ev(([fn, v, sd]) => { const tg = (new Function('return ' + fn))(); if (!tg) return { done: true }; const M = SD2.map, q = M.player.get(), dx = tg[0] - q.x, dz = tg[1] - q.z, dd = Math.hypot(dx, dz) || 1; if (sd) M.player.steer(-dz / dd * sd + dx / dd * 0.2, dx / dd * sd + dz / dd * 0.2, v, true); else M.player.steer(dx, dz, v, true); return { x: q.x, z: q.z, d: dd, tg }; }, [fn, v, sd]);
        if (r.done || r.d < near) break; if (it % 5 === 0) { if (chk && Math.hypot(r.x - chk.x, r.z - chk.z) < 0.5 && side <= 0) { side = 4; sideN++; if (++stuck > 6) { tpN++; await ev(tg => { const q = SD2.map.player.get(), dx = tg[0] - q.x, dz = tg[1] - q.z, d = Math.hypot(dx, dz) || 1, k = Math.max(0, d - 1.2) / d; __R.tp(q.x + dx * k, q.z + dz * k); }, r.tg); stuck = 0; } } chk = { x: r.x, z: r.z }; } await W8(100); }
      await ev(() => SD2.map.player.steer(null)); return r; };

    // ① 고리 코스
    console.log('① 고리 코스'); const B0 = await ev(() => { const R = SM_TOWN.road(); R.dbg.build(); return { n: R.info().courses.length, au: R.audit(), ms: R.info().buildMs, cs: R.info().courses.map(c => ({ id: c.id, n: c.n, L: c.L, gold: c.gold, place: c.place, cell: c.cell })) }; });
    console.log('  코스 ' + B0.n + '개(짓기 ' + B0.ms + 'ms): ' + B0.cs.map(c => c.place + '(' + c.cell + ') 고리 ' + c.n + ' · ' + c.L + 'm · 🥇' + c.gold + '초').join(' / '));
    ok(B0.n >= 3, '코스 셋 넘게(' + B0.n + ')'); for (const c of B0.cs) ok(c.n >= 8 && c.n <= 15, c.id + ' 고리 ' + c.n + '개(8~15)');
    for (const a of B0.au) ok(a.blk === 0 && a.off === 0 && a.wet === 0 && a.sch === 0 && a.ringBlk === 0, a.id + ' 길 위 · 막힘 0(점 ' + a.n + ' · 막힘 ' + a.blk + ' · 길 밖 ' + a.off + ' · 물 ' + a.wet + ' · 학교 ' + a.sch + ' · 고리 둘레 ' + a.ringBlk + ')');

    // ② 자전거로 코스 끝까지
    console.log('② 자전거로 한 코스'); const C0 = (await info()).courses[0], P0 = await ev(() => SM_TOWN.road().dbg.path(0, 3)); const r0 = C0.rings[0];
    await ev(([r0]) => { __R.tp(r0[0] - r0[3] * 22, r0[2] - r0[4] * 22, r0[0], r0[2]); }, [r0]); await W8(1500); await ev(() => SM_TOWN.bike(true)); await W8(800);
    const near0 = await info(); ok(near0.ringVis && near0.drawn >= C0.n, '가까이 오면 고리가 보임(그린 고리 ' + near0.drawn + ')'); ok(/고리 코스/.test(near0.goal || ''), '출발 고리 앞 = 위 가운데 줄 안내(' + (near0.goal || '').slice(0, 40) + ')');
    await shot('road_1_ring');
    const fullP = [[r0[0] - r0[3] * 22, r0[2] - r0[4] * 22]].concat(P0, [[C0.rings[C0.n - 1][0] + C0.rings[C0.n - 1][3] * 6, C0.rings[C0.n - 1][2] + C0.rings[C0.n - 1][4] * 6]]); let seen = [], j = 1, t0r = Date.now(), vmax = 0, lastP = null;
    await p.keyboard.down('KeyW');   /* 아이처럼: 가는 쪽을 보고 W(자전거 = 21m/s · steer는 7.5m/s에서 막힘) */
    for (let it = 0; it < 1500; it++) { while (j < fullP.length - 1 && await ev(([tg]) => { const q = SD2.map.player.get(); return Math.hypot(tg[0] - q.x, tg[1] - q.z) < 9; }, [fullP[j]])) j++;
      const tg = fullP[j], r = await ev(([tg]) => { const M = SD2.map; if (!SM_TOWN.indoor.state().bike && !SD2.CTRL.frozen) SM_TOWN.bike(true); M.player.lookAt([tg[0], tg[1]]); const q = M.player.get(), I = SM_TOWN.road().info(); return { x: q.x, z: q.z, d: Math.hypot(tg[0] - q.x, tg[1] - q.z), race: I.race, t: performance.now() }; }, [tg]);
      if (lastP) vmax = Math.max(vmax, Math.hypot(r.x - lastP.x, r.z - lastP.z) / Math.max(0.001, (r.t - lastP.t) / 1000)); lastP = r;
      if (r.race && seen[seen.length - 1] !== r.race.i) seen.push(r.race.i); if (j >= fullP.length - 1 && r.d < 3) break; if (!r.race && seen.length > 2) break; await W8(30); }
    await p.keyboard.up('KeyW');
    await ev(() => SD2.map.player.steer(null)); await W8(600); const I2 = await info(), rec = I2.S.ring[C0.id];
    console.log('  지난 고리 차례: ' + seen.join(',') + ' · ' + ((Date.now() - t0r) / 1000).toFixed(1) + '초(벽시계) · 빠르기 최대 약 ' + vmax.toFixed(0) + 'm/s(벽시계)');
    ok(seen.length >= C0.n - 2 && seen.every((v, i) => !i || v > seen[i - 1]), '고리를 차례로 지남(' + seen.join(',') + ')'); ok(!I2.race, '마지막 고리 = 끝');
    ok(!!rec && rec.b > 0 && rec.m >= 1, '자전거 기록이 남음(최고 ' + (rec && rec.b) + '초 · 메달 ' + (rec && rec.m) + ')');
    const st = await ev(() => ['🥇', '🥈', '🥉'].filter(e => SM_TOWN.game().S.bag[e] > 0)); ok(st.length >= 1, '가방에 고리 코스 도장(' + st.join('') + ')');
    const xp2 = await ev(() => SM_TOWN.skills().xp.explore || 0); for (let k = 0; k < 2; k++) await ev(() => SM_TOWN.road().dbg.fin(0, 999)); const xp3 = await ev(() => SM_TOWN.skills().xp.explore || 0); ok(xp3 === xp2, '같은 코스 되풀이 완주 = 탐험 솜씨 그대로(' + xp2 + ' → ' + xp3 + ')');
    await ev(() => SM_TOWN.bike(false)); await W8(500);

    // ③ 걸어서 = 연습
    console.log('③ 걸어서 연습'); const C1 = (await info()).courses[1]; const q0 = C1.rings[0];
    await ev(([q0]) => { __R.tp(q0[0] - q0[3] * 6, q0[2] - q0[4] * 6, q0[0], q0[2]); }, [q0]); await W8(1300);
    await clr(); await W8(1300); await clr(); await goTo('[' + (q0[0] + q0[3] * 5) + ',' + (q0[2] + q0[4] * 5) + ']', 4.2, 1.0, 60); await W8(300); const I3 = await info(); if (process.env.RDDBG) console.log('    DBG3', JSON.stringify({ q0, near: I3.near, race: I3.race, goal: I3.goal, me: await ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z].map(v => +v.toFixed(1)); }), pan: await ev(() => (document.querySelector('.twn-p') || {}).textContent || ''), bk: await ev(() => SM_TOWN.indoor.state().bike) }));
    ok(!!I3.race && I3.race.bike === false, '걸어서 첫 고리 = 연습 시작(' + JSON.stringify(I3.race) + ')'); ok(/연습/.test(I3.goal || ''), '위 가운데 줄 (연습) 표시');
    await ev(() => __R.tp(15.4, 74, 15.4, 200)); await W8(800); const I3b = await info(); ok(!I3b.race, '다른 곳으로 옮기면 고리 코스 멈춤'); ok(!I3b.S.ring[C1.id], '걸어서 = 기록 없음');

    // ④ 도움 요청 셋 — 성공 · 시간 끝 · 다음에
    console.log('④ 도움 요청');
    const spawn = async kind => (await clr(), ev(async k => { const R = SM_TOWN.road(), WK = SM_TOWN.workers(); for (let i = 0; i < WK.length; i++) { const w = WK[i]; if (!w[4] || w[4] === 'stall') continue; const f = __R.free(w[1] + 18, w[2], 1, 0); __R.tp(f[0], f[1], w[1], w[2]); await new Promise(r => setTimeout(r, 200)); if (R.dbg.help(k, i)) return R.info().req; } return { fail: R.info().dbg.slice(-6) }; }, kind));
    const toWorker = async () => { const q = (await info()).req || (await info()).act; const wx = q.x ?? q.wx, wz = q.z ?? q.wz, wg = q.g ?? q.wg; await ev(([wx, wz, wg]) => { const me = SD2.map.player.get(), dx = me.x - wx, dz = me.z - wz, d = Math.hypot(dx, dz) || 1, f = __R.free(wx, wz, dx / d * 2, dz / d * 2, wg); __R.tp(f[0], f[1], wx, wz, wg); }, [wx, wz, wg]); await W8(900); await clr(); };
    const accept = async () => { await toWorker(); await clr(); const nr = await ev(() => __R.near()); await p.keyboard.press('KeyE'); await W8(600); const pan = await ev(() => { const q = document.querySelector('.twn-p'); return q ? q.textContent : ''; }); const okB = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="ok"]'); if (b9) b9.click(); return !!b9; }); await W8(500); return { nr, pan, okB }; };
    const xpW = () => ev(() => SM_TOWN.skills().xp.work || 0), fresh = () => ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; G.uses['road:pay'] = 0; for (const k of Object.keys(G.picked)) if (/^rd:h:/.test(k)) delete G.picked[k]; });
    let lastRq = null; for (const kind of ['hat', 'pick']) { const tag = '[' + kind + ']'; await fresh();
      // 성공
      await ev(() => __R.tp(15.4, 74, 15.4, 200)); await W8(500); const rq = await spawn(kind); ok(!!rq && !rq.fail, tag + ' 손 든 일꾼 생김' + (rq && rq.fail ? ' — ' + rq.fail.join(' / ') : '')); if (!rq || rq.fail) continue; lastRq = rq; await W8(400);
      const g0 = (await info()).goal; ok(/손을 들었어요/.test(g0 || ''), tag + ' 위 가운데 줄 = 가서 E(' + (g0 || '').slice(0, 30) + ')');
      const m0 = await ev(() => __R.money()), h0 = await ev(() => __R.hearts()), x0 = await xpW();
      const A1 = await accept(); ok(/도와드리기/.test(A1.nr || ''), tag + ' 일꾼 곁 E = 도와드리기(' + A1.nr + ')'); ok(/할 일:/.test(A1.pan) && A1.okB, tag + ' 창 첫 줄 = 할 일 · 도와드릴게요 단추'); let I = await info(); ok(!!I.act && I.act.kind === kind, tag + ' 부탁 시작');
      if (kind === 'hat') { await W8(1600); await shot('road_2_hat'); for (let k = 0; k < 4; k++) { await goTo('SM_TOWN.road().info().act && SM_TOWN.road().info().act.hat', 6, 1.0); await W8(150); await p.keyboard.press('KeyE'); await W8(400); I = await info(); if (!I.act || I.act.carry) break; } ok(I.act && I.act.carry, tag + ' 굴러가는 모자를 따라가 E = 잡음');
        await goTo('(() => { const a = SM_TOWN.road().info().act; return a ? [a.wx, a.wz] : null; })()', 6, 2.2); }
      else if (kind === 'pick') { await shot('road_3_pick'); for (let k = 0; k < 3; k++) { await goTo('(() => { const a = SM_TOWN.road().info().act; if (!a) return null; const me = SD2.map.player.get(); let b = null, bd = 1e9; a.sp.forEach((p, i) => { if (a.got & (1 << i)) return; const d = Math.hypot(p[0] - me.x, p[1] - me.z); if (d < bd) { bd = d; b = p; } }); return b; })()', 5, 0.9); await W8(250); if (process.env.RDDBG) console.log('    DBG', JSON.stringify(await ev(() => { const me = SD2.map.player.get(), a = SM_TOWN.road().info().act; return { me: [me.x, me.y, me.z].map(v => +v.toFixed(2)), near: SD2.near(), sp: a && a.sp, el: a && a.el, got: a && a.got, pan: !!document.querySelector('.twn-p'), hots: SD2.map.interact.list().filter(h => Math.hypot(h.x - me.x, h.z - me.z) < 5).map(h => [h.label, +h.x.toFixed(1), +(h.y).toFixed(2), +h.z.toFixed(1), h.r, !!h.off]) }; }))); await p.keyboard.press('KeyE'); await W8(400); }
        I = await info(); ok(I.act && I.act.got === 7, tag + ' 셋 다 주움(got ' + (I.act && I.act.got) + ')'); await goTo('(() => { const a = SM_TOWN.road().info().act; return a ? [a.wx, a.wz] : null; })()', 5, 2.2); }
      await W8(800); I = await info(); const m1 = await ev(() => __R.money()), h1 = await ev(() => __R.hearts()), x1 = await xpW();
      ok(!I.act && (I.S.hk[kind] || 0) === 1, tag + ' 해냄(hk ' + JSON.stringify(I.S.hk) + ')'); ok(m1 - m0 === 100, tag + ' 100원(' + (m1 - m0) + ')'); ok(h1 !== h0, tag + ' ❤ 쌓임'); ok(x1 - x0 === 2, tag + ' 일 솜씨 +2(' + x0 + ' → ' + x1 + ')');
      const left9 = await ev(() => SD2.map.interact.list().filter(h => !h.off && /도와드리기|모자 잡기|줍기/.test(h.label)).length); ok(left9 === 0, tag + ' 끝난 뒤 사건 E가 남지 않음(' + left9 + ')');
      // 실패(시간 끝)
      await ev(() => __R.tp(15.4, 74, 15.4, 200)); await W8(400); const rq2 = await spawn(kind); if (rq2 && !rq2.fail) { await accept(); const m2 = await ev(() => __R.money()), h2 = await ev(() => __R.hearts()); await ev(() => SM_TOWN.road().dbg.left(0.4)); await W8(1500); const I4 = await info();
        ok(!I4.act && (I4.S.hk[kind] || 0) === 1, tag + ' 시간 끝 = 실패로 끝남'); ok(await ev(() => __R.money()) === m2 && await ev(() => __R.hearts()) === h2, tag + ' 실패 = 벌 X · 보상 X'); ok(/다음엔 꼭/.test(await ev(() => (document.getElementById('toast') || {}).textContent || '')), tag + ' 실패 알림 「다음엔 꼭」'); }
      else ok(false, tag + ' 실패 시험용 일꾼 없음');
      // 다음에
      await ev(() => __R.tp(15.4, 74, 15.4, 200)); await W8(400); const rq3 = await spawn(kind); if (rq3 && !rq3.fail) { await toWorker(); await p.keyboard.press('KeyE'); await W8(600); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="no"]'); if (b9) b9.click(); }); await W8(500); const I5 = await info(); ok(!I5.req && !I5.act, tag + ' 다음에 할게요 = 부탁 끝(벌 X)'); }
      await W8(300); }
    const hatBack = await ev(() => { const M = SM_TOWN.road(); return M.info().act; }); ok(!hatBack, '부탁이 남지 않음');
    // ④+ 하루 한도: 오늘 몫 넷을 다 받은 뒤 + 같은 이웃 = ❤·돈·솜씨 그대로(되풀이로 무한히 X)
    console.log('④+ 하루 한도'); await ev(() => { __R.tp(15.4, 74, 15.4, 200); SM_TOWN.game().S.uses['road:pay'] = 4; }); await W8(400); const rq4 = await spawn('pick');
    if (rq4 && !rq4.fail) { const same = !!(lastRq && lastRq.x === rq4.x && lastRq.z === rq4.z); await ev(() => SM_TOWN.road().dbg.accept()); await W8(400);
      const m4 = await ev(() => __R.money()), h4 = await ev(() => __R.hearts()), x4 = await xpW(); const sp4 = (await info()).act.sp;
      for (const q of sp4) { await ev(q => __R.tp(q[0] + 0.5, q[1]), q); await W8(500); await p.keyboard.press('KeyE'); await W8(300); }
      await toWorker(); await W8(900); const I7 = await info(), bn = await ev(() => document.body.innerText);
      ok(!I7.act && (await ev(() => __R.money())) === m4 && (await xpW()) === x4, '오늘 몫 넷 뒤 = 100원·솜씨 그대로(돈 ' + m4 + ' · 솜씨 ' + x4 + ')'); if (same) ok((await ev(() => __R.hearts())) === h4, '같은 이웃 ❤ = 하루 한 번'); else console.log('  (다른 이웃이라 ❤ 하루 한 번은 못 봄)'); ok(/오늘 받을 몫은 끝/.test(bn), '알림 「오늘 받을 몫은 끝」'); }
    else ok(false, '한도 시험용 일꾼 없음');

    // ⑤ 움직이다 보면 저절로
    console.log('⑤ 저절로 손 듦'); await clr(); await ev(() => { SM_TOWN.road().abort(); const G = SM_TOWN.game().S; G.min = 11 * 60; G.uses['road:help'] = 0; }); const nat = await ev(async () => { const WK = SM_TOWN.workers(), R = SM_TOWN.road(); for (let i = 0; i < WK.length; i++) { const w = WK[i]; if (!w[4] || w[4] === 'stall') continue; const x = w[1] + 34, z = w[2]; const f = __R.free(x, z, 1, 0); __R.tp(f[0], f[1], w[1], w[2]); await new Promise(r => setTimeout(r, 400)); R.dbg.mov(999, 0); for (let k = 0; k < 30; k++) { const me = SD2.map.player.get(), dx = w[1] - me.x, dz = w[2] - me.z; SD2.map.player.steer(dx, dz, 4.2, true); await new Promise(r => setTimeout(r, 200)); const I = R.info(); if (I.req) { SD2.map.player.steer(null); return { ok: true, kind: I.req.kind, wi: i }; } if (Math.hypot(dx, dz) < 16) break; } SD2.map.player.steer(null); } return { ok: false, dbg: R.info().dbg.slice(-5) }; });
    ok(nat.ok, '걷다 보면 앞쪽 일꾼이 손을 듦(' + JSON.stringify(nat) + ')'); if (nat.ok) { await W8(300); await shot('road_5_wave'); await ev(() => SM_TOWN.road().abort()); }

    // ⑥ 바람에 날아온 종이
    console.log('⑥ 날아온 지도 조각'); await ev(() => { __R.tp(15.4, 74, 15.4, 200); SM_TOWN.game().S.min = 11 * 60; }); await W8(300); const sp9 = await ev(() => { const S = SM_TOWN.game().S; S.tmap = { v: 1, cur: null, got: {}, n: [0, 0, 0], last: 0, title: [] }; for (const q of SM_TOWN.places()) { if (/공원|광장|운동장/.test(q.name)) return q.door; } return null; });
    if (sp9) { await ev(sp => __R.tp(sp[0], sp[1] + 6, sp[0], sp[1] - 30), sp9); await W8(900); }
    await clr(); ok(await ev(() => SM_TOWN.road().dbg.paperOk()), '그날 지도를 아직 안 받음 = 종이가 날아올 수 있음');
    let pp = false; for (let k = 0; k < 8 && !pp; k++) { pp = await ev(() => SM_TOWN.road().dbg.paper()); if (!pp) { await ev(k => { const me = SD2.map.player.get(); __R.tp(me.x + 25, me.z + 10 * (k % 2 ? 1 : -1), me.x + 60, me.z); }, k); await W8(700); } }
    ok(pp, '바람에 종이가 날아옴'); await W8(4200); let I6 = await info(); ok(!!I6.paper && I6.paper.h, '종이가 바닥에 떨어짐 · E 생김'); await shot('road_6_paper');
    if (I6.paper) { await goTo('(() => { const q = SM_TOWN.road().info().paper; return q ? [q.x, q.z] : null; })()', 4.2, 0.9); await W8(300); await clr(); const nr6 = await ev(() => __R.near()); ok(/날아온 종이/.test(nr6 || ''), '종이 곁 E = 종이 줍기(' + nr6 + ')'); await p.keyboard.press('KeyE'); await W8(700);
      const T6 = await ev(() => ({ cur: !!SM_TOWN.treasure().info().cur, pan: (document.querySelector('.twn-p') || {}).textContent || '', use: SM_TOWN.road().info().uses.paper, ok: SM_TOWN.road().dbg.paperOk() }));
      ok(T6.cur && /지도 조각/.test(T6.pan), '주우면 보물 지도 조각을 받음(창: ' + T6.pan.slice(0, 20) + ')'); ok(T6.use === 1 && !T6.ok, '하루 한 번 · 받은 뒤엔 더 안 날아옴'); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); }

    console.log('순간이동으로 메운 걸음: ' + tpN + '번(걷기 봇이 막혔을 때)');
    ok(errs.length === 0, '페이지 오류 0(' + errs.length + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : '') + ')');
  } catch (e) { fails.push('하네스 예외: ' + e.message.split('\n')[0]); console.log('하네스 예외', e); }
  console.log(fails.length ? 'FAIL ' + fails.length + '\n - ' + fails.join('\n - ') : 'PASS'); console.log('걸린 시간 ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
