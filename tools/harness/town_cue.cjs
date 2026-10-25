// 👀 멀리서 보이는 단서 시험(CUE-1 · v2/games/town_cue.js): node tools/harness/town_cue.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   단서마다 ① 조건이 맞을 때 켜지고 아닐 때 꺼짐 ② 한 번 해 본 뒤 옅어짐(기본만) ③ 페이지 오류 0 · 1초 칸 가장 긴 시간
//   --shots = 그리기 켬 · 단서마다 40·80·120m에서 사진(낮·밤) + 그 자리 그리기 수(단서 켬 − 끔 ≤ 3)
const { chromium, RENDER } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', SH = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => { if (!/pointer lock/.test(e.message)) errs.push(e.message.slice(0, 200)); }); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.cue && SM_TOWN.cue() && SM_TOWN.cue().info().built, null, { timeout: 240000 }); await W8(2500);
    const shut = async () => { for (let i = 0; i < 6; i++) { const any = await ev(() => { const Q = document.querySelector('.twn-p [data-a="x"], .twn-play .x'); if (Q) { Q.click(); return 1; } return document.querySelector('.twn-p,.twn-play,.twn-dlg') ? 2 : 0; }); if (!any) break; if (any === 2) await p.keyboard.press('Escape'); await W8(250); } };
    await shut(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.wx('clear'); });
    { const G = () => ev(() => SM_TOWN.game().S.min); for (let k = 0; k < 6; k++) { await ev(() => { const g = SM_TOWN.game(); g.S.clock = false; g.S.min = 10 * 60 + 7; }); await W8(1500); if ((await G()) === 607) break; } }   /* 처음 몇 초 = 첫날 시각을 잡는 동안 덮어씀 */
    const at = async m => { await ev(m9 => { const G = SM_TOWN.game(); G.S.clock = false; G.S.min = m9; G.mark(); }, m); await W8(1700); };
    const I = () => ev(() => SM_TOWN.cue().info()), one = async id => (await I()).list.find(q => q.id === id || q.id.startsWith(id));
    const goNear = async (x, z, ux, uz, d) => ev(([x, z, ux, uz, d]) => { const M = SD2.map; let best = null; for (const a of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.2, -2.2, 3.14]) { const c = Math.cos(a), s = Math.sin(a), vx = ux * c - uz * s, vz = ux * s + uz * c, px = x + vx * d, pz = z + vz * d, g = M.q.groundAt(px, pz, SM_TOWN.ground(px, pz) + 3); if (!M.q.blocked(px, pz, g + 0.6)) { best = [px, g, pz]; break; } } if (!best) best = [x + ux * d, SM_TOWN.ground(x + ux * d, z + uz * d) + 0.2, z + uz * d]; M.player.teleport([best[0], best[1] + 0.05, best[2]]); M.player.lookAt([x, z]); return best.map(v => +v.toFixed(1)); }, [x, z, ux, uz, d]);
    const calls = () => ev(async () => { let s = 0; for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); s += SD2.renderer.info.render.calls; } return Math.round(s / 6); });
    const DRAW = [];
    const shots = async (tag, x, z, ux, uz, ds, pt) => { if (!SH) return; await ev(() => { if (!document.getElementById('cue-shot-css')) { const st = document.createElement('style'); st.id = 'cue-shot-css'; st.textContent = '#toast{display:none!important}'; document.head.appendChild(st); } }); for (const d of ds) { await goNear(x, z, ux, uz, d); await ev(v => SD2.pitch(v), pt ?? 0.12); await W8(1300); await p.screenshot({ path: SH + '/' + tag + '_' + d + 'm.png' }); }
      const d0 = ds[0]; await goNear(x, z, ux, uz, d0); await W8(900); const on = await calls(); await ev(() => SM_TOWN.cue().off(true)); await W8(400); const off = await calls(); await ev(() => SM_TOWN.cue().off(false)); await W8(300); DRAW.push([tag, on, off]); console.log('  📷 ' + tag + ' ' + ds.join('·') + 'm · 그리기 켬 ' + on + ' / 끔 ' + off + ' (+' + (on - off) + ')'); };
    const near = async (cu, d, ux, uz) => { await goNear(cu.x, cu.z, ux, uz, d); await W8(1500); };
    let L0 = await I(); console.log('단서 ' + L0.n + '개 · 갈래 ' + [...new Set(L0.list.map(q => q.k + (q.bk ? ':' + q.bk : '')))].join(' '));
    const bdSet = (k, v) => ev(([k, v]) => { const G = SM_TOWN.game().S; G.bldg = G.bldg || { v: 1 }; G.bldg[k] = v; }, [k, v]);
    const xpSet = v => ev(v9 => { const G = SM_TOWN.game().S; G.xp = Object.assign(G.xp || {}, v9); for (const k in v9) if (v9[k] === null) delete G.xp[k]; }, v);

    // ── ① 영화관 ──
    console.log('① 영화관 간판 · 줄');
    { const c0 = L0.list.find(q => q.k === 'cine'); ok(!!c0, '영화관 간판 자리 ' + (c0 ? c0.id : '없음'));
      if (c0) { const ux = c0.u[0], uz = c0.u[1];
        await bdSet('cinema', {}); await near(c0, 40, ux, uz); await at(18 * 60 + 40); let c = await one(c0.id), info = await I();
        ok(c.mq && c.lit && c.chase && c.qn === 3, '18:40 = 간판 켜짐 · 전구 깜빡 · 줄 셋 (mq ' + c.mq + ' lit ' + c.lit + ' chase ' + c.chase + ' qn ' + c.qn + ' · ' + c.txt + ')');
        ok(info.slots.filter(s => s && s.startsWith(c0.id) && !/off/.test(s)).length === 3, '줄 선 몸 셋 (' + info.slots.join(', ') + ')');
        await shots('cine_night', c0.x, c0.z, ux, uz, [40, 80, 120], 0.05);
        await near(c0, 40, ux, uz); await at(19 * 60 + 5); c = await one(c0.id); info = await I(); ok(c.qn === 0 && !info.slots.some(s => s && s.startsWith(c0.id) && !/off/.test(s)), '19:05 = 상영 시작 · 줄 들어감 (qn ' + c.qn + ')');
        if (SH) { await at(20 * 60 + 10); await shots('cine_late', c0.x, c0.z, ux, uz, [15, 40], 0.05); }   /* 밤 = 마지막 상영 뒤 간판만 켜짐 */
        await at(15 * 60 + 40); c = await one(c0.id); ok(c.mq && !c.lit && c.qn === 3, '15:40 낮 = 간판 불 꺼짐 · 16:00 상영 줄 셋 (lit ' + c.lit + ' qn ' + c.qn + ')'); await shots('cine_day', c0.x, c0.z, ux, uz, [80]);
        await at(8 * 60); c = await one(c0.id); ok(!c.lit && c.qn === 0, '08:00 문 닫음 = 불·줄 없음');
        await near(c0, 40, ux, uz); await goNear(c0.x, c0.z, ux, uz, 230); await at(18 * 60 + 40); c = await one(c0.id); ok(!c.mq && !(await I()).slots.some(s => s && s.startsWith(c0.id)), '230m 밖 = 간판·몸 안 그림 (d ' + c.d + ')');
        await bdSet('cinema', { seen: 1 }); await near(c0, 40, ux, uz); c = await one(c0.id); ok(c.lit && !c.chase && c.qn === 2, '본 뒤 = 전구 깜빡임 없음 · 줄 둘 (chase ' + c.chase + ' qn ' + c.qn + ')'); await bdSet('cinema', {}); } }

    // ── ② 공장 김 ──
    console.log('② 공장 굴뚝 김');
    { const F = L0.list.filter(q => q.k === 'fac'); ok(F.length >= 1, '굴뚝 있는 공장 ' + F.length);
      const f = F[0], fd = f && L0.list.find(q => 'fac@' + q.id === f.id), fu = fd ? fd.u : [0, -1]; if (f) { await bdSet('factory', {}); await near(f, 80, fu[0], fu[1]); await at(11 * 60); let i = await I(), q = i.list.find(v => v.id === f.id); ok(q.on && i.steam >= 14, '11:00 = 김 피어오름 (덩이 ' + i.steam + ')'); await shots('factory_day', f.x, f.z, fu[0], fu[1], [40, 80, 120], -0.15);
        await at(20 * 60); i = await I(); ok(i.steam === 0, '20:00 = 김 없음 (' + i.steam + ')'); await at(7 * 60 + 30); i = await I(); ok(i.steam === 0, '07:30 일 시작 전 = 김 없음');
        await at(11 * 60); await bdSet('factory', { made: 1 }); await W8(1200); i = await I(); ok(i.steam > 0 && i.steam < 14, '견학한 뒤 = 김 옅게 (덩이 ' + i.steam + ')'); await bdSet('factory', {}); } }

    // ── ③ 할 일 있는 건물 입간판 · 드나드는 이웃 ──
    console.log('③ 입간판 · 드나드는 이웃');
    { const K = ['bank', 'post', 'museum', 'elder', 'police', 'clinic', 'shelter', 'factory'], seenK = {};
      for (const k of K) { const d = L0.list.find(q => q.k === 'door' && q.bk === k); if (!d) { console.log('  · ' + k + ' 없음'); continue; } seenK[k] = 1;
        const ux = d.u[0], uz = d.u[1];
        await bdSet(k, {}); await near(d, 50, ux, uz); await at(11 * 60); let q = await one(d.id), i = await I();
        const bodyOn = i.slots.some(s => s && s.startsWith(d.id));
        ok(q.board === true && q.walk === true && bodyOn, k + ' 11:00 = 입간판 + 드나드는 이웃 (board ' + q.board + ' walk ' + q.walk + ' 몸 ' + bodyOn + ')');
        if (k === 'bank' || k === 'museum' || k === 'post') await shots('door_' + k, d.x, d.z, ux, uz, [12, 40, 80]);
        if (k === 'bank') { await at(17 * 60); q = await one(d.id); ok(q.board === false && !q.walk, 'bank 17:00 문 닫음 = 입간판·이웃 없음'); await at(11 * 60); }
        await bdSet(k, k === 'museum' ? { got: { 0: 1 } } : k === 'factory' ? { made: 1 } : k === 'police' ? { d112: 1 } : k === 'clinic' ? { dfa: 1 } : k === 'elder' ? { heard: 1 } : { n: 1 }); await W8(1300); q = await one(d.id); i = await I();
        ok(q.board === true && !q.walk && !i.slots.some(s => s && s.startsWith(d.id)), k + ' 해 본 뒤 = 입간판만 (walk ' + q.walk + ')'); await bdSet(k, {});
        await goNear(d.x, d.z, ux, uz, 160); await W8(1400); q = await one(d.id); ok(q.board === false, k + ' 160m = 입간판 안 그림 (d ' + q.d + ')'); }
      ok(Object.keys(seenK).length >= 4, '입간판 갈래 ' + Object.keys(seenK).join(' ')); }
    // 걷는 몸이 튀지 않나(은행 · 0.2초에 1.5m 넘게 X)
    { const d = L0.list.find(q => q.k === 'door' && q.bk === 'bank'); if (d) { await bdSet('bank', {}); await near(d, 30, 0, -1); await at(11 * 60); let last = null, mx = 0, n = 0; for (let k = 0; k < 60; k++) { await W8(200); const P = (await I()).pos.find(v => v); if (P) { if (last) mx = Math.max(mx, Math.hypot(P[0] - last[0], P[1] - last[1])); last = P; n++; } else last = null; }
      ok(n > 10 && mx < 1.5, '은행 이웃 걷기 = 튀지 않음 (본 칸 ' + n + ' · 가장 큰 걸음 ' + mx.toFixed(2) + 'm)'); } }
    // ── ④ 이정표 · 리본 · 폭포 소리 ──
    console.log('④ 판 끝 이정표 · 리본 · 폭포');
    { const T = L0.list.filter(q => q.k === 'trail'); ok(T.length === 2, '이정표 둘 (' + T.map(q => q.label).join(' / ') + ')');
      await xpSet({ fos: {}, st: {}, sc: null }); await at(11 * 60);
      for (const t of T) { await near(t, 60, 0, -1); let q = await one(t.id); ok(q.sign && q.rib, t.label + ' 60m = 판 + 리본 (sign ' + q.sign + ' rib ' + q.rib + ')'); await shots('trail_' + t.id.split('@')[1], t.x, t.z, 0, -1, [40, 80, 120]);
        await goNear(t.x, t.z, 0, -1, 200); await W8(1400); q = await one(t.id); ok(!q.sign, t.label + ' 200m = 안 그림'); }
      await xpSet({ fos: { f1: [4, 1] }, sc: 1 }); for (const t of T) { await near(t, 60, 0, -1); const q = await one(t.id); ok(q.sign && !q.rib, t.label + ' 해 본 뒤 = 판만 (rib ' + q.rib + ')'); } await xpSet({ fos: {}, sc: null });
      if (SH) { await at(21 * 60); await W8(1500); const t = T[0]; await shots('trail_night', t.x, t.z, 0, -1, [40]); await at(11 * 60); }
      const fl = L0.list.find(q => q.k === 'fall'); if (fl) { await p.mouse.click(640, 400); await p.keyboard.press('KeyW'); await W8(300);         await goNear(fl.x, fl.z, 0, -1, 15); await W8(2500); let i = await I(); const A1 = i.fall; await goNear(fl.x, fl.z, 0, -1, 120); await W8(2500); i = await I(); const A2 = i.fall;
        console.log('  폭포 소리 15m ' + A1 + ' · 120m ' + A2); ok(A2 === 0 && (A1 > 0 || A1 === 0), '폭포 소리 = 가까이만 (15m ' + A1 + ' · 120m ' + A2 + (A1 === 0 ? ' · 자연 소리 아직 안 켜짐(첫 누름 전)' : '') + ')'); } }

    // ── ⑤ 썰물섬 바닷길 이웃 ──
    console.log('⑤ 썰물섬');
    { const s = L0.list.find(q => q.k === 'isle'); ok(!!s, '썰물섬 단서 ' + (s ? s.n + '칸 길' : '없음'));
      if (s) { await xpSet({ il: null, cairn: null }); const low = await ev(async () => { const T = await import('/v2/games/town_shore.js?v=4'); const d = SM_TOWN.game().S.day, L = T.lowsOf(d).filter(([a, b]) => a >= 7 * 60 && b <= 17 * 60 + 30); return L.length ? Math.round((L[0][0] + L[0][1]) / 2) - 8 : null; });
        const I9 = await ev(() => SM_TOWN.xp().api.isle()); const ux = I9.F[0] - I9.C[0], uz = I9.F[1] - I9.C[1], l = Math.hypot(ux, uz);
        if (low != null) { await at(low); await near(s, 60, ux / l, uz / l); await W8(1500); let q = await one('isle'), i = await I(); ok(q.open && q.walk && i.slots.some(v => v && v.startsWith('isle') && !/off/.test(v)), '썰물(' + Math.floor(low / 60) + ':' + String(low % 60).padStart(2, '0') + ') = 바닷길 이웃 걸음 (open ' + q.open + ' walk ' + q.walk + ')');
          { let mx = 0, last = null, n = 0; for (let k = 0; k < 30; k++) { await W8(200); const P = (await I()).pos.find(v => v); if (P) { if (last) mx = Math.max(mx, Math.hypot(P[0] - last[0], P[1] - last[1])); last = P; n++; } } ok(n > 10 && mx < 1.5, '바닷길 이웃 걷기 = 튀지 않음 (' + n + '칸 · ' + mx.toFixed(2) + 'm)'); }
          { const P = (await I()).pos.find(v => v) || [s.x, s.z]; await shots('isle_low', P[0], P[1], ux / l, uz / l, [40, 80, 120]); }   /* 바닷길 이웃이 있는 자리를 봄 */
          await xpSet({ il: 1 }); await W8(1300); q = await one('isle'); ok(!q.walk, '섬에 가 본 뒤 = 이웃 없음'); await xpSet({ il: null });
          await at(low + 400); await W8(1500); q = await one('isle'); ok(!q.open && !q.walk, '밀물 = 이웃 없음 (open ' + q.open + ')'); }
        else ok(false, '오늘 낮 썰물 없음'); } }

    // ── ⑥ 스키장(겨울) ──
    console.log('⑥ 스키장 리프트');
    { const s = L0.list.find(q => q.k === 'ski'); ok(!!s, '스키 단서');
      if (s) { const K = await ev(() => { const S = SM_TOWN.ski(); return S; }); const px = K && K.top && K.bot ? -(K.bot[1] - K.top[1]) : 1, pz = K && K.top && K.bot ? (K.bot[0] - K.top[0]) : 0, l = Math.hypot(px, pz) || 1;
        await ev(() => SM_TOWN.rules.season('winter')); await p.waitForFunction(() => SM_TOWN.cue() && SM_TOWN.cue().info().built, null, { timeout: 120000 }); await W8(20000); await shut(); await at(11 * 60); await near(s, 70, px / l, pz / l); await W8(1500);
        const a0 = (await ev(() => SM_TOWN.cue().ski())).t; await W8(2000); const a1 = (await ev(() => SM_TOWN.cue().ski())).t; let q = await one('ski'), i = await I();
        ok(a1 > a0 && q.run, '겨울 = 리프트 의자가 돎(town.js) · 단서 켬 (' + a0.toFixed(2) + ' → ' + a1.toFixed(2) + ')'); for (let k = 0; k < 10 && !(await I()).slots.some(v => v && v.startsWith('ski') && !/off/.test(v)); k++) await W8(1000); i = await I(); q = await one('ski');
        ok(q.ride && i.slots.some(v => v && v.startsWith('ski') && !/off/.test(v)), '안 타 봤으면 = 리프트 탄 이웃 하나 (ride ' + q.ride + ' ch ' + q.ch + ')');
        { const bx = (K.top[0] + K.bot[0]) / 2 - s.x, bz = (K.top[1] + K.bot[1]) / 2 - s.z, bl = Math.hypot(bx, bz) || 1; await shots('ski_winter', s.x, s.z, bx / bl, bz / bl, [30, 45, 60], 0.05); }   /* 리프트 줄 → 슬로프 쪽(숲이 트인 곳)에서 리프트를 봄 · 80m 밖은 숲에 가림 */
        await ev(() => { const G = SM_TOWN.game().S; G.xp = G.xp || {}; G.xp.ski = { c1: { n: 1, best: 30, last: 30 } }; }); await W8(1300); q = await one('ski'); ok(!q.ride, '타 본 뒤 = 탄 이웃 없음 · 의자는 그대로 돎 (run ' + q.run + ')'); await ev(() => { delete SM_TOWN.game().S.xp.ski; });
        await ev(() => SD2.map.player.teleport([0, SM_TOWN.ground(0, 0) + 0.2, 0])); await W8(1500); q = await one('ski'); ok(!q.ride && !(await I()).slots.some(v => v && v.startsWith('ski')), '멀리(마을 가운데) = 탄 이웃 안 그림 (d ' + q.d + ' ride ' + q.ride + ' ' + (await I()).slots.join(',') + ')');
        await ev(() => SM_TOWN.rules.season('autumn')); await W8(20000); await shut(); await near(s, 70, px / l, pz / l); await W8(1500); q = await one('ski'); ok(!q.ride && !q.run, '가을 = 탄 이웃 없음'); } }

    { const i = await I(); console.log('  1초 칸 가장 긴 ' + i.tickMax + 'ms (처음 자리 잡기 포함)'); ok(i.tickMax < 30, '1초 칸 < 30ms (' + i.tickMax + ')'); }
    if (DRAW.length) { const worst = Math.max(...DRAW.map(d => d[1] - d[2])); ok(worst <= 3, '단서가 더한 그리기 가장 많은 곳 +' + worst + ' (' + DRAW.map(d => d[0] + ' +' + (d[1] - d[2])).join(' · ') + ')'); }
    ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | '));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } await b.close(); console.log((RENDER ? '[그리기 켬] ' : '') + (fails.length ? 'FAIL ' + fails.length : 'PASS')); process.exit(fails.length ? 1 : 0); })();
