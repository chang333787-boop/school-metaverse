// PATH-1D(나) 처음 15분 길 — 3차 화면만 평가(R3A·R3B) 뒤 고침(순간이동으로 그 자리만)
//   node tools/harness/town_path1d2.cjs ourtown 8901 [--only=a,b,r,h,n,w,k,s] [--shots=폴더]
//   a 사람 먼저 E — 112 경찰관 곁 3 ~ 4 m에서도 E = 경찰관(지도 조각·문 X) · 새 친구 쪽지를 닫은 뒤 친구 곁 E = 쪽지 다시 · 대화를 E로 빨리 넘긴 뒤의 E는 문으로 안 감(1)
//   b 둘째 날 칠판 — 소식 한 줄일 때도 칠판 둘레 어디서나 E = 「📋 칠판 읽기」(집 문 X) · 읽은 뒤에는 제자리(2)
//   r 거리 숫자 — 0 m = 끝에서 6 m 안(빨간 선 도착과 같음) · 끝 토막 곁을 걸어도 숫자가 처음 쪽으로 안 뜀 · 💡 = 위 칩 · 이야기 목표 곁 일꾼은 길 위 부탁으로 손을 안 듦(3)
//   h 밤 할 일 줄 「우리 집, ○쪽」이 걸으면 바뀜(3)
//   n 알림 차례 — 띠가 읽히는 동안 레벨 카드 X · 이야기 쪽지가 뜰 참이면 잔치 첫 안내 X · 대화 동안 도구 띠 숨김 · 시간 힌트는 띠 뒤(4)
//   w 방음벽 — 판 뒤 좁은 틈 X(건물 앞에 판을 안 세움) · 새 친구가 판·처마 위에 안 섬(5)
//   k 갇힘 남은 곳 — 3차 평가 두 자리에서 6초 밀면 한 줄(라의 고침이 그 자리에서도 먹나)(6)
//   s 삽 — 보물 지도를 따라가는 중 먼 곳을 파면 지도의 ✕ 얘기(7)
const { chromium, RENDER } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8901';
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || null;
const OUT = arg('shots'), ONLY = arg('only') ? arg('only').split(',') : null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fs = require('fs'), path = require('path'), W = path.resolve(__dirname, '../..'); if (OUT) fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const want = k => !ONLY || ONLY.includes(k);
const J = o => JSON.stringify(o);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  const fresh = async q9 => { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 240)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!OUT || !RENDER) return; await p.screenshot({ path: OUT + '/' + n + '.jpg', type: 'jpeg', quality: 72 }); console.log('    📷 ' + OUT + '/' + n + '.jpg'); };
    await p.goto(URL + (q9 || '')); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.emerg && SM_TOWN.emerg(), null, { timeout: 240000 }); await W8(1500);
    const tp = (x, z, lx, lz, h) => ev(([x, z, lx, lz, h]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + (h || 2)) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz, h]);
    const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); } };
    const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { if (document.querySelector('.twn-dlg')) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
    const start = async () => { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(2200); };
    const goal = () => ev(() => { const g = document.getElementById('hudGoal'); return g && g.style.display !== 'none' ? (g.textContent || '') : ''; });
    const hot = () => ev(() => { const h = SD2.hotNow && SD2.hotNow(); return h ? (h.lock ? '[잠김] ' : '') + (h.label || '') : ''; });
    const st = () => ev(() => { const P = document.querySelector('.twn-p'), D = document.querySelector('.twn-dlg'); return { pn: P ? (P.getAttribute('data-k') || '') + ':' + (P.innerText || '').replace(/\s+/g, ' ').slice(0, 30) : '', dlg: D ? (D.innerText || '').replace(/\s+/g, ' ').slice(0, 30) : '', ind: !!(SM_TOWN.indoor && SM_TOWN.indoor.on) }; });
    const done = ids => ev(ids => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = G.story.done || {}; for (const k of ids) G.story.done[k] = { d: 1 }; }, ids);
    return { ctx, p, ev, W8, shot, tp, closeDlg, shut, start, goal, hot, st, done }; };
  const num = g => { const m = /까지 (\d+(?:\.\d+)?) ?(k?m)/.exec(g || ''); return m ? (m[2] === 'km' ? +m[1] * 1000 : +m[1]) : null; };

  if (want('a')) { console.log('--- a 사람 먼저 E(1)');
    { const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await T.done(['p0']);
      await ev(() => SM_TOWN.storyAt('a1_1', 2)); await W8(1500); await T.shut(); let E = null; for (let i = 0; i < 40 && !E; i++) { E = await ev(() => SM_TOWN.emerg().info().ev); if (!E) await W8(500); } await T.shut(); await W8(600);
      await T.tp(E.x + 6, E.z + 6, E.x, E.z); await W8(1500); await T.shut(); await W8(500);
      const L = await ev(() => { const L9 = SM_TOWN.emerg().hotList ? SM_TOWN.emerg().hotList() : null; return L9 ? L9.filter(h => h && h.hot && !h.hot.off).map(h => [h.hot.label, h.hot.x, h.hot.z, h.hot.r]) : []; });
      const cop = L.find(q => /경찰관/.test(q[0])); ok(!!cop, '112 사건 사람 지점 ' + J(L.map(q => q[0] + '@r' + q[3])));
      if (cop) { let n = 0, bad = []; for (const [dx, dz] of [[0, 1.5], [0, 3.2], [0, 4.2], [3.2, 0], [-3.2, 0], [2.5, 2.5], [0, -3.2]]) { const fr = await ev(([x, z]) => { const M = SD2.map, y = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); return !M.q.blocked(x, z, y + 0.05); }, [cop[1] + dx, cop[2] + dz]); if (!fr) continue; await T.tp(cop[1] + dx, cop[2] + dz, cop[1], cop[2]); await W8(700); const h = await T.hot(); n++; if (!/경찰관/.test(h)) bad.push(Math.hypot(dx, dz).toFixed(1) + ' m 「' + h + '」'); }
        ok(n >= 4 && !bad.length, '경찰관 곁 ' + n + '곳(1.5 ~ 4.2 m) E = 경찰관' + (bad.length ? ' — 어긋남 ' + bad.join(' / ') : ''));
        await T.tp(cop[1], cop[2] + 3.4, cop[1], cop[2]); await W8(800); await T.shot('a1_cop'); await p.keyboard.press('KeyE'); await W8(1000); const s1 = await T.st(); ok(!!(s1.dlg || s1.pn) && !s1.ind, '3.4 m에서 E → 경찰관 대화(' + (s1.dlg || s1.pn).slice(0, 24) + ') · 실내 X'); }
      await T.ctx.close(); }
    { const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut();
      const D = await ev(() => { const H = SD2.map.interact.list().find(q => /들어가기 — 작은 도서관/.test(q.label || '')); return H ? [H.x, H.z, H.r] : null; });
      let at = null; if (D) for (const [dx, dz] of [[-1.5, 0.3], [0, 1.5], [1.5, 0.3], [0, -1.5], [-1, 1], [1, 1], [2.5, 0], [0, 2.5]]) { await T.tp(D[0] + dx, D[1] + dz, D[0], D[1]); await W8(700); if (/들어가기 — 작은 도서관/.test(await T.hot()) && !(await T.st()).ind) { at = [dx, dz]; break; } }
      ok(!!at, '도서관 문 E가 가장 가까운 자리 ' + J(at));
      if (at) { await ev(() => { SM_TOWN.dialog({ who: '이웃', icon: '🙂', text: ['첫째 쪽이에요.', '둘째 쪽이에요.', '셋째 쪽이에요.'] }); }); await W8(900);
        const hid = await ev(() => { const H = document.getElementById('hint'); return !H || getComputedStyle(H).display === 'none'; }); ok(hid, '대화 창이 떠 있는 동안 뒤의 「E 들어가기」 줄은 안 보임');
        let ind = false, k = 0, ex = 0; for (; k < 10 && !ind && ex < 2; k++) { const d0 = !!(await T.st()).dlg; await p.keyboard.press('KeyE'); await W8(500); const s9 = await T.st(); ind = s9.ind; if (!d0 && !s9.dlg) ex++; }
        ok(!ind && ex === 2, '대화를 0.5초 박자 E로 넘기고 닫힌 뒤 같은 박자로 E를 두 번 더 눌러도 도서관 안으로 안 들어감(E ' + k + '번)');
        await W8(1700); await p.keyboard.press('KeyE'); await W8(1500); ok((await T.st()).ind, '멈췄다가 누른 E는 그대로 들어감'); }
      await T.ctx.close(); }
    { const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await T.done(['p0']);
      await ev(() => SM_TOWN.storyAt('a1_1', 0)); await W8(2500); let s0 = await T.st(); for (let i = 0; i < 10 && !(s0.dlg || s0.pn); i++) { await W8(600); s0 = await T.st(); }
      await p.keyboard.press('Escape'); await W8(700); await T.shut(); await W8(600);
      const F = await ev(() => { const f = SM_TOWN.friendSt ? SM_TOWN.friendSt() : null; return f && f.on ? [f.x, f.z] : null; });
      if (F) { await T.tp(F[0] + 2.2, F[1] + 0.5, F[0], F[1]); await W8(900); }
      const h = await T.hot(); console.log('    친구 ' + J(F) + ' · 곁 E 「' + h + '」');
      ok(!F || /새 친구와 이야기하기/.test(h), '새 친구 쪽지를 닫은 뒤 친구 곁 E = 「새 친구와 이야기하기」');
      if (F && /새 친구와 이야기하기/.test(h)) { await p.keyboard.press('KeyE'); await W8(1200); const s1 = await T.st(); ok(!!(s1.dlg || /story/.test(s1.pn)) && !s1.ind, 'E → 새 친구 쪽지가 다시 열림(' + (s1.dlg || s1.pn).slice(0, 24) + ')'); }
      await T.ctx.close(); } }

  if (want('b')) { console.log('--- b 둘째 날 칠판(2)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await W8(600);
    const Dh = await ev(() => SM_TOWN.homeDbg()); if (Dh && Dh.board) { await T.tp(Dh.board[0] + 1.2, Dh.board[1], Dh.board[0], Dh.board[1]); await W8(700); await p.keyboard.press('KeyE'); await W8(1200); await T.closeDlg(); await T.shut(); await W8(900); }   /* 첫 쪽지부터 읽음(그 뒤가 둘째 날과 같은 판) */ await ev(() => { const G = SM_TOWN.game().S; G.day = (G.day | 0) + 1; G.news = { d: G.day, lines: ['🍄 숲의 버섯이 다시 자랐어요'] }; });   /* 둘째 날(첫 쪽지를 읽은 날 = 그날 소식은 읽은 것으로 셈) */
    if (Dh && Dh.board) { const [bx, bz] = Dh.board; const pts = []; for (let a = 0; a < 8; a++) pts.push([bx + Math.cos(a * 0.7854) * 1.6, bz + Math.sin(a * 0.7854) * 1.6, a * 45 + '°']);
      const doorH = await ev(([bx, bz]) => { const h = SD2.map.interact.list().find(q => /들어가기 — 우리 집/.test(q.label || '') && Math.hypot(q.x - bx, q.z - bz) < 8); return h ? [h.x, h.z] : null; }, [bx, bz]); if (doorH) { const d = Math.hypot(doorH[0] - bx, doorH[1] - bz), f = Math.min(1, 2.4 / d); pts.push([bx + (doorH[0] - bx) * f, bz + (doorH[1] - bz) * f, '집 문 쪽']); }
      let n = 0, bad = []; for (const q of pts) { const free = await ev(([x, z]) => { const M = SD2.map, y = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); return !M.q.blocked(x, z, y + 0.05); }, q); if (!free) continue; await T.tp(q[0], q[1], bx, bz); await W8(750); const h = await T.hot(); n++; if (!/📋 칠판 읽기/.test(h)) bad.push(q[2] + ' 「' + h + '」'); }
      ok(n >= 5 && !bad.length, '소식 한 줄인 날 칠판 둘레 ' + n + '곳에서 E = 「📋 칠판 읽기」' + (bad.length ? ' — 어긋남 ' + bad.join(' / ') : ''));
      await T.shot('b1_board'); await p.keyboard.press('KeyE'); await W8(1200); const s1 = await T.st(); ok(!s1.ind, 'E → 집 안으로 안 들어감(칠판 소식)');
      await T.shut(); await W8(600); await T.tp(bx + 2.6, bz + 2.6, bx, bz); await W8(800); const H1 = await ev(([x, z]) => { const h = SD2.map.interact.list().find(q => /📋 칠판 읽기/.test(q.label || '')); return h ? [+Math.hypot(h.x - x, h.z - z).toFixed(2), h.r] : null; }, [bx, bz]); ok(!!H1 && Math.abs(H1[0] - 0.7) < 0.1 && H1[1] <= 1.6, '읽은 뒤 칠판 지점은 제자리(칠판 앞 ' + J(H1) + ' — 집 문 E는 그대로)'); }
    else ok(false, '칠판 자리 없음');
    await T.ctx.close(); }

  if (want('r')) { console.log('--- r 거리 숫자(3)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut();
    const F = await ev(() => { const q = SM_TOWN.places().find(q => q.name === '소방서'); return q && { x: q.x, z: q.z, door: q.door }; }); const D = F.door || [F.x, F.z];
    let n0 = 0, bad0 = [], nArr = 0; for (let a = 0; a < 8; a++) for (const R of [14, 10, 8]) { const ux = Math.cos(a * 0.7854), uz = Math.sin(a * 0.7854), x = D[0] + ux * R, z = D[1] + uz * R; const fr = await ev(([x, z]) => { const M = SD2.map, y = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); return !M.q.blocked(x, z, y + 0.05) && y - SM_TOWN.ground(x, z) < 1; }, [x, z]); if (!fr) continue;
      await T.tp(D[0] + ux * 70, D[1] + uz * 70, D[0], D[1]); await W8(300); await ev(d => SM_TOWN.showRoute({ icon: '🚒', name: '소방서', door: d }), D); await W8(600); await T.tp(x, z, D[0], D[1]); await W8(900);
      const g = await T.goal(), m = num(g), dd = await ev(d => { const q = SD2.map.player.pos(); return Math.hypot(q.x - d[0], q.z - d[1]); }, D); n0++; if (/왔어요/.test(g)) nArr++; else if (m === 0 && dd >= 6) bad0.push(dd.toFixed(1) + ' m 「' + g.slice(0, 26) + '」'); }
    ok(n0 >= 10 && !bad0.length, '소방서 문 둘레 ' + n0 + '곳(8 ~ 14 m · 도착 ' + nArr + ') — 0 m는 6 m 안에서만' + (bad0.length ? ' — 어긋남 ' + bad0.join(' / ') : ''));
    await T.done(['p0', 'a1_1', 'a1_2']); await ev(() => SM_TOWN.storyAt('a1_3', 2)); await W8(1500); await T.closeDlg(); await T.shut(); await W8(600);
    const Tg = await ev(() => { const t = SM_TOWN.storyTarget(); return t && [t.x, t.z]; }); console.log('    목장 일꾼 ' + J(Tg));
    await T.tp(Tg[0] + 70, Tg[1], Tg[0], Tg[1]); await W8(500); await ev(t => SM_TOWN.showRoute({ icon: '🧑', name: '목장 일꾼', door: t }), Tg); await W8(800);
    const R = await ev(() => SM_TOWN.routeDraw()); console.log('    선 ' + (R ? R.length : 0) + '점 · 위 줄 「' + (await T.goal()).slice(0, 30) + '」');
    if (R && R.length > 4) { const pick = R.filter((q, i) => i % Math.max(1, Math.floor(R.length / 10)) === 0).concat([R[R.length - 3]]); let up = 0, prev = null, seq = []; for (const q of pick) { await T.tp(q[0], q[1], Tg[0], Tg[1]); await W8(500); const m = num(await T.goal()); if (m == null) break; seq.push(m); if (prev != null && m > prev + 10) up++; prev = m; }
      console.log('    선 따라 ' + seq.join(' → ')); ok(up === 0, '선을 따라 끝 가까이 가는 동안 숫자가 커진 적 ' + up + '번');
      await T.tp(R[R.length - 3][0], R[R.length - 3][1], Tg[0], Tg[1]); await W8(500);
      let jump = 0, zero = [], seq2 = []; prev = null; for (let x = -16; x <= 40; x += 4) { const px = Tg[0] + x, pz = Tg[1] + 14; await T.tp(px, pz, Tg[0], Tg[1]); await W8(450); const g = await T.goal(), m = num(g); if (m == null) { seq2.push(/왔어요/.test(g) ? '도착' : '-'); prev = null; continue; } const dd = await ev(t => { const q = SD2.map.player.pos(); return Math.hypot(q.x - t[0], q.z - t[1]); }, Tg); seq2.push(m); if (prev != null && Math.abs(m - prev) > 30) jump++; if (m === 0 && dd >= 6) zero.push(dd.toFixed(1)); prev = m; }
      console.log('    끝 곁(목표 + 14 m 줄) ' + seq2.join(' → ')); ok(jump === 0 && !zero.length, '끝 토막 곁을 4 m씩 걸어도 30 m 넘게 뛴 적 ' + jump + '번 · 6 m 밖 0 m ' + zero.length + '번');
      const wq = await ev(t => [SM_TOWN.wayM(t[0], t[1]), SM_TOWN.trkDist()], Tg); ok(Math.abs(wq[0] - wq[1]) < 5, '💡 도움 글의 셈(wayM ' + Math.round(wq[0]) + ') = 위 칩 셈(' + Math.round(wq[1]) + ')'); }
    else ok(false, '목장 길 안내 선이 안 그려짐');
    { await T.tp(Tg[0] + 40, Tg[1] + 10, Tg[0], Tg[1]); await W8(600); const W9 = await ev(() => SM_TOWN.workers()); const near = W9.filter(w => Math.hypot(w[1] - Tg[0], w[2] - Tg[1]) < 25).length; let picked = [], k = 0; for (; k < 6; k++) { const r = await ev(() => { const R9 = SM_TOWN.road(); if (!R9 || !R9.dbg) return null; const okq = R9.dbg.help('hat'); const I = R9.info(); const q = I.req; if (R9.abort) R9.abort(); return okq && q ? [q.x, q.z] : 0; }); if (r === null) break; if (r) picked.push(Math.hypot(r[0] - Tg[0], r[1] - Tg[1])); await ev(([x, z]) => SD2.map.player.lookAt([x, z]), [Tg[0] + (k - 3) * 20, Tg[1] - 30]); await W8(200); }
      ok(picked.every(d => d >= 25), '이야기 목표 25 m 안 일꾼(' + near + '명)은 길 위 부탁으로 손을 안 듦 — 고른 일꾼 거리 ' + J(picked.map(d => Math.round(d)))); }
    await T.ctx.close(); }

  if (want('h')) { console.log('--- h 밤 할 일 줄 집 방위(3)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await T.done(['p0', 'a1_1']);
    const H = await ev(() => { const h = SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : null; return h ? [h[0] ?? h.x, h[1] ?? h.z] : null; });
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 22 * 60; }); await ev(() => SM_TOWN.storyAt('a1_3', 1, true)); await W8(800); await ev(() => { const G = SM_TOWN.game().S; G.min = 22 * 60; const s9 = G.story; if (s9 && s9.v) { s9.v.amOk = 0; s9.v.amW = 0; } SM_TOWN.storyAt('a1_3', 1, true); }); await W8(1500); await T.closeDlg(); await T.shut(); await W8(800); console.log('    단계 ' + J(await ev(() => { const s = SM_TOWN.story().step; return s && { id: s.id, amW: s.v.amW, amOk: s.v.amOk, min: SM_TOWN.game().S.min }; })));
    const seen = new Set(); for (const [dx, dz] of [[0, -60], [60, 0], [0, 60], [-60, 0]]) { await T.tp(H[0] + dx, H[1] + dz, H[0], H[1]); await W8(2600); const t = await ev(() => (SM_TOWN.storyTodo() || '')); const m = /우리 집[^,·]*,\s*(\S+쪽)/.exec(t) || /(\S+쪽)/.exec(t); seen.add(m ? m[1] : t.slice(-12)); console.log('    (' + dx + ', ' + dz + ') 「' + t.slice(0, 44) + '」'); }
    ok(seen.size >= 3, '집 둘레 네 곳에서 할 일 줄 방위가 ' + seen.size + '가지(' + [...seen].join(' · ') + ')');
    await T.ctx.close(); }

  if (want('n')) { console.log('--- n 알림 차례(4)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await W8(1500);
    await ev(() => SM_TOWN.read.ban('📍 놀이터 — 왔어요! 빨간 선 없이 찾았어요.', 2.8)); await W8(150); const L0 = await ev(() => SM_TOWN.read.left());
    await ev(() => SM_TOWN.skUp('explore', 600)); let seenAt = -1, during = false; const t0 = Date.now(); for (let i = 0; i < 40; i++) { await W8(200); const r = await ev(() => { const B = document.getElementById('hudBan'); return [!!document.querySelector('.twn-lvup'), SM_TOWN.read.left() + (B && B.style.display !== 'none' && B.textContent ? 1000 : 0)]; }); if (r[0] && r[1] > 200) during = true; if (r[0]) { seenAt = Date.now() - t0; break; } }
    await T.shot('n1_lv'); ok(L0 > 500 && !during && seenAt > 0, '「왔어요」 띠가 떠 있는 동안(읽기 ' + Math.round(L0) + ' ms) 레벨 카드 X → 띠 뒤 ' + seenAt + ' ms에 카드');
    await W8(4000); await T.shut();
    await ev(() => { SM_TOWN.dialog({ who: '이웃', icon: '🙂', text: ['쪽지 첫째 쪽이에요.', '둘째 쪽이에요.'] }); }); await W8(300); const vis = await ev(() => { const e = document.querySelector('.twn-tools'); return e ? getComputedStyle(e).visibility : 'none'; }); await T.closeDlg(); await W8(400); const vis2 = await ev(() => { const e = document.querySelector('.twn-tools'); return e ? getComputedStyle(e).visibility : 'none'; });
    ok(vis === 'hidden' && vis2 === 'visible', '대화가 떠오르는 동안 도구 띠 숨김(' + vis + ') · 닫히면 다시(' + vis2 + ')');
    await ev(() => SM_TOWN.friendOn(true)); await W8(1500); const fp = await ev(() => SM_TOWN.friend()); const mp = await ev(() => { const q = SD2.map.player.pos(); return [q.x, q.z]; });
    await ev(([x, z, fx, fz]) => { SD2.map.player.lookAt([fx + (fx - x) * 3, fz + (fz - z) * 3]); }, [mp[0], mp[1], fp.x, fp.z]); await W8(400);
    await ev(() => { SM_TOWN.read.ban('자전거를 탔어요 — 다시 B를 누르면 내려요.', 3); SM_TOWN.frSay('메뉴에 장소 찾기가 생겼어. 눌러서 이름을 써 봐!'); }); await W8(900);
    const ov = await ev(() => { const a = document.getElementById('hudBan'), b9 = document.querySelector('.twn-fb'); if (!a || !b9 || a.style.display === 'none' || b9.style.opacity === '0') return null; const r1 = a.getBoundingClientRect(), r2 = b9.getBoundingClientRect(); return { hit: !(r2.right < r1.left || r2.left > r1.right || r2.bottom < r1.top || r2.top > r1.bottom), ban: [Math.round(r1.top), Math.round(r1.bottom)], fb: [Math.round(r2.top), Math.round(r2.bottom)] }; });
    await T.shot('n2_bubble'); ok(!ov || !ov.hit, '새 친구 말풍선이 가운데 띠와 안 겹침 ' + J(ov));
    await T.ctx.close(); }

  if (want('w')) { console.log('--- w 방음벽(5)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await W8(800);
    const NW = await ev(() => SM_TOWN.noiseWall ? SM_TOWN.noiseWall() : []); console.log('    판 ' + NW.length + '장' + (NW[0] ? ' · 첫 판 ' + J(NW[0].slice(0, 2)) + ' · 바깥쪽 ' + J(NW[0].slice(2).map(v => +v.toFixed(2))) : ''));
    { let bad = []; for (const q of NW.slice(3, 9)) { const r = await ev(([x, z, nx, nz]) => { const M = SD2.map, g = SM_TOWN.ground(x, z), ax = -nz, az = nx; const f = (x9, z9) => M.q.blocked(x9, z9, M.q.groundAt(x9, z9, SM_TOWN.ground(x9, z9) + 0.6) + 0.05); return [f(x + ax * 1.5, z + az * 1.5), f(x + nx * 1.2, z + nz * 1.2), f(x - nx * 1.2, z - nz * 1.2)]; }, q); if (!(r[0] && !r[2])) bad.push(J(r)); }
      ok(NW.length > 0 && !bad.length, '판 충돌 = 길 따라 판 줄(가운데 판 여섯: 판 줄 위 1.5 m 막힘 · 길 쪽 1.2 m 트임 — 그림도 이 방향인지는 사진 w1 · w2)' + (bad.length ? ' — 어긋남 ' + bad.join(' / ') : '')); }
    let fl = [], nF = 0; await ev(() => SM_TOWN.friendOn(true)); for (let i = 0; i < NW.length; i += Math.max(1, Math.floor(NW.length / 6))) { const q = NW[i]; await T.tp(q[0] - q[2] * 1.2, q[1] - q[3] * 1.2, q[0], q[1]); await W8(1800); const f = await ev(() => { const F = SM_TOWN.friend(); return F.on ? [F.x, F.y, F.z, SM_TOWN.ground(F.x, F.z)] : null; }); if (!f) continue; nF++; if (f[1] - f[3] > 1.0) fl.push(J(f.map(v => +v.toFixed(1)))); }
    ok(nF >= 3 && !fl.length, '판 곁 ' + nF + '곳에서 새 친구가 땅에 섬(판·처마 위 X)' + (fl.length ? ' — 뜸 ' + fl.join(' / ') : ''));
    if (NW.length) { const q = NW[Math.floor(NW.length / 2)], [x, z, nx, nz] = q, ax = -nz, az = nx; await T.tp(x + nx * 0.6, z + nz * 0.6, x + nx * 0.6 + ax * 10, z + nz * 0.6 + az * 10, 0.8); await W8(1500); await T.shot('w1_back_along'); await T.tp(x - nx * 3, z - nz * 3, x + ax * 10, z + az * 10, 0.8); await W8(1500); await T.shot('w2_front'); }
    await T.ctx.close(); }

  if (want('s')) { console.log('--- s 삽(7)');
    const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut(); await T.done(['p0']);
    await ev(() => SM_TOWN.storyAt('a1_1', 1)); await W8(1800); await T.shut(); await W8(1200); await T.shut();
    const C = await ev(() => { const c = SM_TOWN.treasure().cur(); return c && { x: c.x, z: c.z, st: !!c.st }; }); console.log('    보물 ' + J(C)); await ev(() => SM_TOWN.storyOff()); await T.shut();   /* 지도 조각 창이 2초마다 다시 뜨는 단계(창 단계) — 이야기를 쉬게 해 F를 막지 않게(보물은 그대로) */
    if (C) { const D = await ev(() => { const H = SD2.map.interact.list().find(q => /들어가기 — 작은 도서관/.test(q.label || '')); return H ? [H.x, H.z] : null; });
      await T.tp(D[0] + 0.6, D[1] + 0.6); await W8(700); await p.keyboard.press('Digit2'); await W8(500); await p.keyboard.down('KeyF'); await W8(250); await p.keyboard.up('KeyF');
      let tt = ''; for (let i = 0; i < 8 && !/⛏/.test(tt); i++) { await W8(250); tt = await ev(() => { const e = document.getElementById('toast'); return e && e.style.display !== 'none' ? e.textContent || '' : ''; }); }
      ok(/지도의 ✕/.test(tt), '보물 지도를 따라가는 중 먼 포장 길에서 삽 → 「' + tt.slice(0, 40) + '」');
      for (let i = 0; i < 6; i++) { await T.shut(); await W8(700); if (!(await ev(() => !!document.querySelector('.twn-p, .twn-dlg')))) break; }
      await T.tp(C.x + 1.3, C.z + 0.8, C.x, C.z); await W8(900); await T.shut(); const h0 = await T.hot(); await p.keyboard.down('KeyF'); await W8(250); await p.keyboard.up('KeyF'); await W8(2300); const h1 = await T.hot(); await W8(2200);
      const r = await ev(() => ({ cur: !!SM_TOWN.treasure().cur(), pn: (document.querySelector('.twn-p') || {}).innerText || '', toast: (document.getElementById('toast') || {}).textContent || '' }));
      console.log('    흙더미 곁 E 「' + h0 + '」 · F 뒤 2.3초 E 「' + h1 + '」 · 창 「' + r.pn.replace(/\s+/g, ' ').slice(0, 30) + '」');
      ok(!r.cur && !/땅 파기/.test(h1), '흙더미 곁 F 한 번 → E 꾹 없이 상자·보상(지도 조각 끝 · F 뒤 E 줄에 「땅 파기」 X)'); }
    else ok(false, '보물 지도가 안 생김');
    await T.ctx.close(); }

  console.log(errs.length ? '  ✗ 콘솔 오류 ' + errs.length + ' — ' + errs.slice(0, 3).join(' | ') : '  ✓ 콘솔 오류 0'); if (errs.length) fails++;
  console.log(fails ? 'PATH-1D2 ✗ ' + fails : 'PATH-1D2 ✓ 통과'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
