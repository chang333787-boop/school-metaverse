// 길 묻기 · 모이는 곳 · 내 흔적 지도 시험(ASK-1 · HUB-1 · TRACE-1): node tools/harness/town_ask.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 이웃 다섯에게 목적지 다섯을 물음 → 말에 랜드마크·칸 주소 · 두 줄 13자 안 · 랜드마크가 정말 길 40m 안(길 위 꼴) · 손가락이 그쪽(30° 안) · 4초 뒤 되돌림
//      + 먼저 말하기: 할 일 목표를 두고 일꾼 곁에 서면 단추 없이 말함 · 같은 목표 다시 X(60초)
//   ② 들은 대로 걸어서 닿나: 일꾼 → (말한 랜드마크) → 목적지 몸 걷기 길이(walkLen) ÷ 걸음 4.2m/s ≤ 3분 · 선 없이 닿으면 반기기·탐험 솜씨·일기 한 줄
//   ③ 모이는 곳(학교 앞·장터·강가)마다: 둘레 40m 안 걷는 사람 · 소문(그 곳 일꾼이나 지나는 사람이 40m 안에서 말함) · 아침 소식의 소문 자리 · 길 위 부탁 자리
//   ④ 흔적 지도: 심기·친해지기·동물 만나기 뒤 그 칸에 그림 · J 칸 지도 '내 흔적' → 그 칸 누르기 = 일지 세 줄 · '가기'로만 순간이동(하루 5번 문) · %·'n 칸 중' 0 · 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(id => { if (!sessionStorage.getItem('zz.seed')) { localStorage.setItem('sm-town-game:' + id, JSON.stringify({ v: 1, day: 4, min: 600, bag: {}, money: 300 })); sessionStorage.setItem('zz.seed', '1'); } }, ID);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.ask && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(2500);
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 3; i++) { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(200); } };
    await closeAll(); await W8(1200);
    await ev(() => { window.__G = SM_TOWN.game(); window.__tp = (x, z) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }; window.__me = () => { const m = SD2.map.player.get(); return [m.x, m.z]; }; window.__leg = (a, b9) => { const l = SM_TOWN.walkLen(a, b9, 2.2, 60); if (l >= 0) return l; const R = SM_TOWN.routeXY(a, b9); if (!R.ok) return -3; let sum = 0, cur = a; const P = R.pts.concat([b9]); for (let i = 1; i < P.length; i++) { const q = P[i]; if (Math.hypot(q[0] - cur[0], q[1] - cur[1]) < 150 && i < P.length - 1) continue; const l2 = SM_TOWN.walkLen(cur, q, 2.2, 40); if (l2 < 0) return l2 - 10; sum += l2; cur = q; } return sum; };   /* 몸 걷기(1m 칸) — 상자가 너무 크면 빨간 선 마디마다 나눠 걸음 */ const S = __G.S; S.story = S.story || {}; S.story.cur = null; S.story.done = { ...(S.story.done || {}), p0: 1 }; S.story.p0auto = 1; S.cells = {}; });
    await W8(1500);
    const I0 = await ev(() => SM_TOWN.ask.info()); ok(I0 && I0.built && I0.lmk.length >= 6, '랜드마크 ' + (I0 && I0.lmk.length) + '곳 (갈래 ' + [...new Set((I0 && I0.lmk || []).map(q => q.k))].join('·') + ')');
    ok(!(I0.lmk || []).some(q => /네$/.test(q.nm)), '랜드마크에 아이 집(○○네) 이름 0');
    ok(await ev(() => SM_TOWN.hud.on('mini')), '작은 지도 열림(칸 주소를 말하는 조건)');

    // ① 이웃 다섯 × 목적지 다섯
    const CASES = await ev(() => { const WK = SM_TOWN.workers(), P = SM_TOWN.places().filter(q => q.door && !/house|school/.test(q.kind) && !q.home), used = new Set(), roles = new Set(), out = [];
      const idx = WK.map((w, i) => [w, i]).filter(([w, i]) => SM_TOWN.ask.wk(i).ok && !SM_TOWN.inSchool(w[1], w[2]));
      for (const [w, i] of idx) { if (out.length >= 5) break; if (roles.has(w[0] + w[4]) || out.some(o => Math.hypot(o.w[1] - w[1], o.w[2] - w[2]) < 120)) continue;
        const L = P.filter(q => { const d = Math.hypot(q.door[0] - w[1], q.door[1] - w[2]); return d > 140 && d < 420 && !used.has(q.name); }); if (!L.length) continue; const q = L[(i * 7) % L.length]; used.add(q.name); roles.add(w[0] + w[4]); out.push({ i, w, to: q.door, name: q.name }); }
      return out; });
    ok(CASES.length === 5, '물어볼 이웃 다섯(서로 다른 일 · 120m 넘게 떨어짐) — ' + CASES.map(c => c.w[0] + '/' + c.w[4]).join(', '));
    const R1 = [];
    for (const [n, c] of CASES.entries()) {
      await ev(c9 => { const w = SM_TOWN.ask.wk(c9.i), a = Math.atan2(c9.to[0] - w.x, c9.to[1] - w.z) + 2.2; __tp(w.x + Math.sin(a) * 2.6, w.z + Math.cos(a) * 2.6); SD2.map.player.lookAt([w.x, w.z]); SM_TOWN.ask.reset(); }, c); await W8(700);
      const r = await ev(c9 => { const o = SM_TOWN.ask.now(c9.i, c9.to, '📋', 'point'); return o && { l: o.l, mode: o.mode, lmk: o.lmk && { nm: o.lmk.nm[0], x: o.lmk.x, z: o.lmk.z }, cell: o.cell, pt: o.pt, len: o.len, dir: o.dir, want: SM_TOWN.cell(c9.to[0], c9.to[1]) }; }, c);
      await W8(450); const rot = await ev(i => SM_TOWN.ask.rot(i), c.i), wk = await ev(i => SM_TOWN.ask.wk(i), c.i), bub = await ev(() => SM_TOWN.ask.bub());
      const want = Math.atan2(r.pt[0] - wk.x, r.pt[1] - wk.z), err = rot == null ? 999 : Math.abs(((rot - want) * 57.2958 + 540) % 360 - 180);
      const onRt = r.lmk && (r.mode === 'on' || r.mode === 'br') ? await ev(([w, to, L]) => { const R = SM_TOWN.routeXY([w.x, w.z], to); if (!R.ok) return -1; let m = 1e9; for (let k = 0; k + 1 < R.pts.length; k++) { const a = R.pts[k], b9 = R.pts[k + 1], vx = b9[0] - a[0], vz = b9[1] - a[1], L2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((L.x - a[0]) * vx + (L.z - a[1]) * vz) / L2)); m = Math.min(m, Math.hypot(L.x - a[0] - vx * t, L.z - a[1] - vz * t)); } return Math.round(m); }, [wk, c.to, r.lmk]) : null;
      const txt = r.l.join(' '), len13 = r.l.every(t => [...t].length <= 13);
      console.log('    ' + (n + 1) + '. ' + c.w[0] + '/' + c.w[4] + ' → ' + c.name + ' ' + r.want + ' : 「' + r.l[0] + ' / ' + r.l[1] + '」 (' + r.mode + (r.lmk ? ' · ' + r.lmk.nm + (onRt != null ? ' 길에서 ' + onRt + 'm' : '') : '') + ' · 손가락 오차 ' + Math.round(err) + '° · ' + r.len + 'm)');
      ok((!r.lmk || txt.includes(r.lmk.nm)) && (r.mode === 'none' || !!r.lmk), (n + 1) + '. 말에 랜드마크(' + (r.lmk ? r.lmk.nm : '없음 — 방위만') + ')');
      ok(txt.includes(r.want) && r.cell === r.want, (n + 1) + '. 말에 칸 주소 ' + r.want);
      ok(len13 && r.l.length === 2, (n + 1) + '. 두 줄 · 줄마다 13자 안');
      if (onRt != null) ok(onRt >= 0 && onRt <= 40, (n + 1) + '. 「지나서」 랜드마크가 정말 길 40m 안(' + onRt + 'm)');
      ok(err <= 30, (n + 1) + '. 손가락이 그쪽(오차 ' + Math.round(err) + '° ≤ 30°) · 몸짓 ' + wk.act);
      ok(bub.vis && bub.k === 'ask' && bub.lines === 2 && bub.t > 4.5, (n + 1) + '. 말풍선 두 줄 · 6초(' + bub.t + '초 남음)');
      if (n >= 2) await shot('ask_bubble_point' + n);
      R1.push({ c, r, wk, me: await ev(() => __me()) });
    }
    await W8(4300); { const a = await ev(i => SM_TOWN.ask.wk(i), R1[R1.length - 1].c.i), rot = await ev(i => SM_TOWN.ask.rot(i), R1[R1.length - 1].c.i); ok(a.act !== 15 && Math.abs(((rot - a.ry) * 57.2958 + 540) % 360 - 180) < 2, '4초 뒤 손가락·몸 방향 되돌림(몸짓 ' + a.act + ')'); }
    { const b9 = await ev(async () => { const m = __me(); __tp(m[0] + 9, m[1] + 9); await new Promise(r => setTimeout(r, 1300)); return SM_TOWN.ask.bub(); }); ok(!b9.vis || b9.t < 0.6, '6m 밖으로 나가면 말풍선 끔'); }

    // 먼저 말하기(단추·창 0): 할 일 목표 + 안 가 본 칸 + 일꾼 4.5m 안
    { const T = await ev(() => { SM_TOWN.tasksNow(); return SM_TOWN.compTgt(); });
      if (!T || T[2] === '📖') ok(false, '할 일 목표가 없음(compTgt ' + JSON.stringify(T) + ')');
      else { const w = await ev(t => { const WK = SM_TOWN.workers(); let b = -1, bd = 1e9; WK.forEach((w9, i) => { const d = Math.hypot(w9[1] - t[0], w9[2] - t[1]); if (SM_TOWN.ask.wk(i).ok && d > 60 && d < bd) { bd = d; b = i; } }); return b; }, T);
        const n0 = await ev(() => SM_TOWN.ask.info().dbg.told); await ev(([i, t]) => { const S = __G.S; S.cells = {}; S.way.said = {}; SM_TOWN.ask.reset(); const w = SM_TOWN.ask.wk(i); __tp(w.x + 2.5, w.z + 1.5); SD2.map.player.lookAt([w.x, w.z]); void t; }, [w, T]); await W8(1800);
        const I1 = await ev(() => SM_TOWN.ask.info()); ok(I1.dbg.told === n0 + 1 && I1.way.ask && Math.hypot(I1.way.ask.to[0] - T[0], I1.way.ask.to[1] - T[1]) < 2, '다가서면 일꾼이 먼저 말함(할 일 ' + T[2] + ' → 「' + (I1.way.ask && I1.way.ask.t) + '」)');
        const task = await ev(() => { const e = document.querySelector('.twn-task'); return e ? e.textContent : ''; }); ok(/들은 길:/.test(task), '할 일 줄 꼬리에 들은 길(' + task.slice(-24) + ')');
        await W8(2500); ok((await ev(() => SM_TOWN.ask.info().dbg.told)) === n0 + 1, '곁에 계속 서 있어도 또 말하지 않음(60초 · 오늘 이 목표)');
        // ② 선 없이 닿기 → 반기기·솜씨·일기
        const xp0 = await ev(() => (SM_TOWN.skills().xp.explore || 0)), dn0 = await ev(() => (__G.S.diary || []).length);
        await ev(() => { SM_TOWN.pathOff(); }); await W8(300); await ev(t => __tp(t[0] + 4, t[1] + 3), T); await W8(1600);
        const I2 = await ev(() => SM_TOWN.ask.info()), xp1 = await ev(() => (SM_TOWN.skills().xp.explore || 0)), dl = await ev(() => (__G.S.diary || []).slice(-1)[0]);
        ok(I2.dbg.arrive >= 1 && !I2.way.ask, '선 없이 닿음 = 들은 길 끝(도착 ' + I2.dbg.arrive + ')'); ok(xp1 > xp0, '탐험 솜씨 오름(' + xp0 + ' → ' + xp1 + ' · 문 rwCheck ask:)'); ok(dl && dl.e === '🧭' && (await ev(() => (__G.S.diary || []).length)) > dn0, '일기 한 줄 「' + (dl && dl.t) + '」');
        await shot('ask_arrive'); } }

    // ② 들은 대로 걸어서 3분 안
    for (const [n, q] of R1.entries()) { const L = await ev(([a, to]) => { const f = __leg(a, to); return f >= 0 ? f : __leg(to, a); }, [q.me, q.c.to]), sec = L / 4.2;   /* 선 자리가 일터 소품 위면 몸 걷기 시작 칸이 막힘 → 목적지에서 거꾸로 */   /* 들은 대로 = 그 길(랜드마크는 그 길 40m 안 · 위에서 확인) · 선 자리 = 물어본 자리 */
      ok(L > 0 && sec <= 180, (n + 1) + '. 들은 대로 걸어서 ' + (L > 0 ? Math.round(sec) + '초' : '못 닿음(' + L + ')') + ' ≤ 3분 (' + Math.round(L) + 'm 몸 걷기)'); }

    // ③ 모이는 곳
    const HB = await ev(() => SM_TOWN.ask.hubs()); ok(HB.length === 3, '모이는 곳 ' + HB.map(h => h.nm + ' ' + h.c).join(' · '));
    for (const [i, h] of HB.entries()) { await closeAll(); await ev(([x, z]) => { __tp(x + 6, z + 6); SM_TOWN.pathOff(); }, [h.x, h.z]); let pmx = 0; for (let k = 0; k < 6; k++) { await W8(2500); pmx = Math.max(pmx, (await ev(() => SM_TOWN.ask.hubPed()))[i]); } await closeAll();
      ok(pmx >= 2, h.nm + ': 둘레 40m 안 걷는 사람 ' + pmx + '명(15초 동안 가장 많을 때)');
      const said = await ev(async ([i9, x, z]) => { const S = __G.S, d = S.day; S.news = S.news || {}; S.news.d = d; S.news.rum = [{ k: 'zz', t: '시험 소문 한 줄이에요', at: [x, z], wx: x, wz: z, wg: SM_TOWN.ground(x, z), said: 0 }]; const WK = SM_TOWN.workers(); let wi = -1; WK.forEach((w, j) => { if (Math.hypot(w[1] - x, w[2] - z) < 40 && wi < 0) wi = j; }); if (wi < 0) S.news.rum[0].hub = i9; else { const w = SM_TOWN.ask.wk(wi); Object.assign(S.news.rum[0], { wx: w.x, wz: w.z, wg: w.g }); }
        for (let k = 0; k < 50; k++) { await new Promise(r => setTimeout(r, 500)); { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); } const r = S.news.rum[0]; if (r.said === d) return { by: r.by || [r.wx, r.wz], hub: r.hub != null }; if (r.hub == null) { const w = [r.wx, r.wz]; __tp(w[0] + 2, w[1] + 2); } else if (k % 4 === 3) { const q = SM_TOWN.ask.pedAt(i9); if (q) __tp(q[0] + 3, q[1] + 3); } }   /* 아이처럼 그곳 사람에게 다가감 */ return null; }, [i, h.x, h.z]);
      ok(!!said && Math.hypot(said.by[0] - h.x, said.by[1] - h.z) <= 40, h.nm + ': 소문을 ' + (said ? (said.hub ? '지나는 사람' : '그곳 일꾼') + '이 ' + Math.round(Math.hypot(said.by[0] - h.x, said.by[1] - h.z)) + 'm 자리에서 말함' : '못 들음'));
      if (said && said.hub) { await ev(b9 => SD2.map.player.lookAt(b9), said.by); await W8(250); await shot('hub_' + h.nm.replace(/\s/g, '')); } }
    { const rum = await ev(() => { const S = __G.S; S.news = null; S.day++; const N = SM_TOWN.newsRun(false); S.day--; return N ? N.rum : null; }); const HB2 = HB; const near = (rum || []).filter(r => HB2.some(h => Math.hypot(r.wx - h.x, r.wz - h.z) <= 40)).length;
      ok(rum && rum.length >= 1 && near === rum.length, '아침 소식의 소문 ' + (rum ? rum.length : 0) + '개 = 모두 모이는 곳 40m 안에서(' + (rum || []).map(r => r.hub != null ? '지나는 사람' : '일꾼').join('·') + ')'); }
    { const R = await ev(() => { const RD = SM_TOWN.road(); if (!RD || !RD.dbg) return null; const H = SM_TOWN.ask.hubs(), WK = SM_TOWN.workers(); const out = []; for (const [hi, h] of H.entries()) { const wi = WK.findIndex(w => Math.hypot(w[1] - h.x, w[2] - h.z) < 40 && !/swim|guest/.test(w[0])); if (wi < 0) { out.push([h.nm, 'no']); continue; } const w = SM_TOWN.ask.wk(wi); __tp(w.x + 25, w.z + 10); SD2.map.player.lookAt([w.x, w.z]); const okk = RD.dbg.help('pick', wi); out.push([h.nm, okk, wi]); void hi; } return out; });
      console.log('    길 위 부탁(모이는 곳 일꾼): ' + JSON.stringify(R)); ok(!!R && R.some(q => q[1] === true), '모이는 곳 40m 안 일꾼에게 길 위 부탁이 생길 수 있음(장터 상인 포함)'); }
    await closeAll(); await ev(() => { const RD = SM_TOWN.road(); try { if (RD && RD.dbg && RD.dbg.end) RD.dbg.end(); } catch (e) { /* 없음 */ } });

    // ④ 흔적 지도
    const M0 = await ev(() => SM_TOWN.ask.trace().length);
    // 심기: 학교 텃밭 첫 두둑
    const plant = await ev(async () => { const F = SM_TOWN.farm(); if (!F.length) return null; const bed = F[0].bed, x = (bed[0] + bed[1]) / 2, z = bed[2] + 1.2; __tp(x, z); await new Promise(r => setTimeout(r, 400)); SM_TOWN.farmUse(0); await new Promise(r => setTimeout(r, 500)); const b9 = document.querySelector('.twn-p [data-c]'); if (b9) b9.click(); await new Promise(r => setTimeout(r, 500)); return { cell: SM_TOWN.cell(x, z), x, z, st: SM_TOWN.farm()[0].st }; });
    await closeAll();
    // 친해지기: 이웃 하나 ❤2(하루 한 단계 문이 있어 저장으로 올림 — 친해지기 셈은 town_cap.cjs가 따로 봄)
    const hkSet = await ev(() => { const S = __G.S, WK = SM_TOWN.workers(), i = WK.findIndex((w, j) => SM_TOWN.ask.wk(j).ok && w[4] !== 'stall' && !SM_TOWN.inSchool(w[1], w[2])); const h = SM_TOWN.ask.hk(i); if (!h) return null; S.hearts = S.hearts || {}; S.hd = S.hd || {}; S.hearts[h.k] = 7; S.hd[h.k] = S.day; return { k: h.k, cell: SM_TOWN.cell(h.x, h.z) }; });   /* 하루 한 단계 문이 있어 저장으로 ❤2 — 친해지기 셈은 town_cap.cjs가 따로 봄 */
    // 동물 만나기
    const met = await ev(async () => { const W = SM_TOWN.wild(); if (!W || !W.on) return null; const sp = W.info().spots.filter(s => s.ok && s.st <= 1); for (const s of sp.slice(0, 6)) { __tp(s.hx + 3, s.hz + 3); await new Promise(r => setTimeout(r, 1500)); const s2 = W.info().spots.find(q => q.j === s.j); if (!s2 || s2.st > 1) continue; W.lookAt(s.j); await new Promise(r => setTimeout(r, 600)); const P = document.querySelector('.twn-p'); if (P) { const b9 = P.querySelector('[data-a="x"]') || P.querySelector('button'); if (b9) b9.click(); } const wm = SM_TOWN.ask.wmet(); const c = Object.keys(wm).find(k => wm[k].id === s.id); if (c) return { cell: c, id: s.id }; } return null; });
    await closeAll();
    const M1 = await ev(() => SM_TOWN.ask.trace()); const kinds = k => M1.filter(m => m.k === k);
    ok(plant && plant.st !== 'empty' && kinds('sprout').some(m => m.c === plant.cell), '심기 뒤 그 칸(' + (plant && plant.cell) + ')에 새싹 그림');
    ok(hkSet && kinds('roof').some(m => m.c === hkSet.cell), '친해진 이웃(❤2) 자리 ' + (hkSet && hkSet.cell) + '에 지붕 그림');
    ok(met && kinds('paw').some(m => m.c === met.cell), '처음 만난 동물(' + (met && met.id) + ') 칸 ' + (met && met.cell) + '에 발자국 그림 · S.wmet 저장');
    console.log('    흔적 그림 ' + M0 + ' → ' + M1.length + ' (' + [...new Set(M1.map(m => m.k))].join('·') + ')');
    // J 칸 지도 → 내 흔적 → 칸 누르기 = 일지 세 줄 → 가기
    await ev(() => __tp(-13, 120)); await W8(800); await p.keyboard.press('KeyJ'); await W8(1000);
    await ev(() => { const b9 = document.querySelector('.twn-p .trb'); if (b9) b9.click(); }); await W8(500);
    const uiT = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.querySelector('.trj').textContent : ''; }); ok(/그림을 누르면/.test(uiT), '내 흔적 켬 = 안내 한 줄(' + uiT + ')');
    const clickAt = async (x, z) => ev(([x9, z9]) => { const cv = document.querySelector('.twn-p canvas.cm1'), R = cv.getBoundingClientRect(), [X0, Z0, X1] = SM_TOWN.ask.ext(), CW = parseFloat(cv.style.width), MG = 22, sc = (CW - 2 * MG) / (X1 - X0), px = (MG + (x9 - X0) * sc) * R.width / CW, py = (MG + (z9 - Z0) * sc) * R.width / CW, o = { clientX: R.left + px, clientY: R.top + py, pointerId: 1, bubbles: true, pointerType: 'mouse' }; cv.dispatchEvent(new PointerEvent('pointermove', o)); cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); const j = document.querySelector('.twn-p .trj'); return j ? { t: j.innerText, go: !!j.querySelector('button[data-cell]') } : null; }, [x, z]);
    const pm = M1.find(m => m.k === 'paw' && met && m.c === met.cell) || M1[0];
    { const sp = M1.find(m => m.k === 'sprout' && plant && m.c === plant.cell); if (sp) { const J2 = await clickAt(sp.x, sp.z), L2 = J2 ? J2.t.split('\n').filter(t => t.trim() && !/칸 일지/.test(t)) : []; console.log('    일지(' + sp.c + '): ' + (J2 ? J2.t.replace(/\n/g, ' / ') : '없음')); ok(L2.length >= 2 && L2.length <= 3, '심은 칸 일지 ' + L2.length + '줄(심음 + 자람)'); } }
    const me0 = await ev(() => __me()), J1 = await clickAt(pm.x, pm.z); const lines = J1 ? J1.t.split('\n').filter(t => t.trim() && !/칸 일지/.test(t) && !/^🚌/.test(t.trim())) : [];
    console.log('    일지(' + pm.c + '): ' + (J1 ? J1.t.replace(/\n/g, ' / ') : '없음'));
    ok(J1 && lines.length >= 1 && lines.length <= 3 && J1.go, '흔적 칸 누르기 = 일지 ' + lines.length + '줄(세 줄까지) + 🚌 가기 단추');
    ok((await ev(() => __me())).every((v, k) => Math.abs(v - me0[k]) < 1), '흔적 겹에서 누르기만으로는 순간이동 X');
    await shot('trace_map');
    { const t = await ev(() => document.querySelector('.twn-p').innerText); ok(!/%|\d+\s*\/\s*\d+ *칸|칸 중|빈 칸/.test(t.replace(/바로 가기 \(\d\/5\)|\(\d\/5\)/g, '')), '흔적 지도 글에 %·「n 칸 중」·빈 칸 표시 0'); }
    { const tpn0 = await ev(() => __G.S.tpn || 0); await ev(() => { const b9 = document.querySelector('.twn-p .trj button[data-cell]'); if (b9) b9.click(); }); await W8(1800); const me1 = await ev(() => __me()), tpn1 = await ev(() => __G.S.tpn || 0);
      const c1 = await ev(([x, z]) => SM_TOWN.cell(x, z), me1); ok(Math.hypot(me1[0] - me0[0], me1[1] - me0[1]) > 10 && c1 === pm.c, '🚌 가기 = 그 칸으로(' + pm.c + ' → ' + c1 + ')');
      ok(tpn1 === tpn0 + 1, '가기 = 하루 5번 문으로 한 번 셈(' + tpn0 + ' → ' + tpn1 + ')'); }
    await closeAll();
    // 영어 말 틀(같은 함수)
    { const e = await ev(() => { const r = SM_TOWN.ask.line({ me: [0, 0], to: [200, -50], pts: null, lmk: [{ k: 'bridge', nm: ['다리', 'bridge'], x: 100, z: -20 }], cell: () => '다7', cellOn: true, en: true, role: 'fisher' }); return r.l; }); ok(e && /bridge|cell/.test(e.join(' ')), '영어 말 틀 「' + e.join(' / ') + '」'); }
    ok(errs.length === 0, '오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외: ' + e.message); console.log('예외', e); } finally { await b.close(); }
  console.log((fails.length ? '실패 ' + fails.length + ' — ' + fails.join(' | ') : '모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
