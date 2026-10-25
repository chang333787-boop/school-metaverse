// 🎒 가방이 의미 있게 시험(BAG-2 · v2/games/town_bag.js): node tools/harness/town_bag2.cjs [마을=ourtown] [포트=8002]
//   ① 먹으면 힘: 🍙 = 숨 한 칸 더(고리 칸 +1 · 바로 다 참) · 🍓 = 숨이 빨리 돌아옴(같은 2초에 더 많이 참) · 음식마다 효과가 다름 · 시간이 지나면 칸이 돌아옴 · 사다리 칸(n)은 그대로
//   ② 이웃 부탁: 아침에 하나 생김(몸 있는 일꾼 · 자기 일에서 나는 것 X) · 할 일 창 줄 + 🧭 · 오늘 시간표에 마감 줄 · 곁에서 가방 → 📦 드리기 → 물건이 빠짐 · 마음 +1(rwCheck 문) · 다음 아침 문 앞 답례(why = req)
//      일찍 들어주면 둘째 하나 · 셋째 X(하루 둘까지) · 기한(18:00) 넘김 = 'late' · 돈·물건·마음 그대로(벌 X) · 다음 날 곁을 지나면 '다음에 또' 한 번
//   ③ 쓸 곳 한 줄: 모르는 것(장터를 안 가 봄 · 못 들은 좋아함)은 안 보임 → 장터를 보면 장터 줄 · 들은 좋아함 줄 · 오늘 부탁 줄 · 카드를 누르면 칸이 열리고 🧭 = 빨간 선
//   ④ 도시락 계획: 어제 못 닿은 체력 목표가 한 칸 위 = 하루 마무리 '내일 기다리는 것'에 도시락 줄(실패 기록이 없으면 X)
//   ⑤ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); return c; };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  try { const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.bag2 && SM_TOWN.bag2(), null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1200);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 7 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; delete G.bag2; SM_TOWN.weather('clear'); }); await W8(800); await closeAll();

    // ───── ① 먹으면 힘 ─────
    console.log('① 먹으면 힘');
    const hasStam = await ev(() => !!SM_TOWN.stamGraph()); ok(hasStam, '탐험 체력 켜짐(먹은 힘이 걸릴 고리)');
    const land = await ev(() => { const g = SM_TOWN.stamGraph(); return g && g.land ? g.land : null; }); if (land) await tp(land[0], land[1]); await W8(800);
    await ev(() => { const G = SM_TOWN.game().S; G.stam = { v: 1, n: 3, got: {}, para: 0, fail: {}, said: {}, tip: { swim: 1, climb: 1 } }; G.bag['🍙'] = 2; G.bag['🍓'] = 2; G.bag['🌑'] = 1; SM_TOWN.stamFill(); }); await W8(400);
    const s0 = await ev(() => SM_TOWN.stam());
    await ev(() => SM_TOWN.bagEat('🍙')); await W8(300); const s1 = await ev(() => ({ st: SM_TOWN.stam(), x: SM_TOWN.bag2().extra(), ban: (document.getElementById('hudBanner') || document.querySelector('.hud-banner') || { textContent: '' }).textContent, bag: SM_TOWN.game().S.bag['🍙'] }));
    console.log('    먹기 전 ' + JSON.stringify({ n: s0.n, cap: s0.cap }) + ' · 🍙 뒤 ' + JSON.stringify({ n: s1.st.n, cap: s1.st.cap, v: s1.st.v, x: s1.x }));
    ok(s1.st.cap === s0.cap + 1 && s1.st.n === s0.n, '🍙 주먹밥 = 고리 칸 +1(' + s0.cap + ' → ' + s1.st.cap + ') · 사다리 칸 n 그대로(' + s1.st.n + ')');
    ok(Math.abs(s1.st.v - s1.st.cap) < 0.01, '땅에서 먹으면 숨이 바로 다 참(v ' + s1.st.v + ')'); ok(s1.bag === 1, '먹으면 가방에서 하나 빠짐');
    await ev(() => SM_TOWN.bagEat('🍙')); await W8(200); const s2 = await ev(() => SM_TOWN.stam()); ok(s2.cap === s1.st.cap, '두 개 먹어도 한 칸까지(겹쳐 쌓이지 않음 · cap ' + s2.cap + ')');
    // 빠르기: 같은 2초 동안 얼마나 차나(먹지 않음 vs 🍓)
    const refill = async () => { await ev(() => SM_TOWN.stamFill(0)); await W8(2000); return ev(() => SM_TOWN.stam().v); };
    await ev(() => { const f = SM_TOWN.game().S.bag2.fx; f.f = 1; f.fT = 0; }); const v0 = await refill();
    await ev(() => SM_TOWN.bagEat('🍓')); await W8(200); const fk = await ev(() => SM_TOWN.bag2().fast()); const v1 = await refill();
    console.log('    2초 쉰 뒤 숨: 그냥 ' + v0.toFixed(2) + ' · 🍓 먹은 뒤 ' + v1.toFixed(2) + ' (빠르기 ×' + fk + ')');
    ok(fk > 1 && v1 > v0 + 0.8, '🍓 딸기 = 숨이 더 빨리 돌아옴(' + v0.toFixed(2) + ' → ' + v1.toFixed(2) + ')');
    const tbl = await ev(() => { const B = SM_TOWN.bag2(); return ['🍙', '🍓', '🍦', '🍲', '🍐', '🥔'].map(e => [e, B.edible(e)]); }); console.log('    먹을 수 있나 ' + JSON.stringify(tbl));
    ok(tbl.find(q => q[0] === '🥔')[1] === false && tbl.find(q => q[0] === '🍐')[1] === true, '날감자는 못 먹음 · 배는 날로 먹음');
    { const L9 = await ev(() => { const S = SM_TOWN.game().S; S.bag2.kn.eat = { '🍙': 1, '🍓': 1, '🍦': 1 }; const B = SM_TOWN.bag2(); return ['🍙', '🍓', '🍦'].map(e => (B.uses(e).find(u => u.ic === '😋') || {}).t || ''); }); console.log('    먹으면 줄: ' + L9.join(' | '));
      ok(new Set(L9).size === 3 && L9.every(Boolean), '음식마다 먹은 효과 줄이 다름(셋 다 다른 글)'); }
    await ev(() => { const S = SM_TOWN.game().S, f = S.bag2.fx; f.xT = S.day * 1440 + S.min - 1; }); await W8(1500); const s3 = await ev(() => SM_TOWN.stam()); ok(s3.cap === s0.cap, '시간이 지나면 먹은 칸이 돌아옴(cap ' + s3.cap + ')');
    await ev(() => SM_TOWN.bagEat('🌑')); await W8(200); ok((await ev(() => SM_TOWN.stam().cap)) === s0.cap, '탄 요리 = 힘 X');

    // ───── ② 이웃 부탁 ─────
    console.log('② 이웃 부탁');
    await ev(() => { const S = SM_TOWN.game().S; S.min = 7 * 60; SM_TOWN.bag2().make(); }); let R0 = await ev(() => SM_TOWN.bag2().today());
    ok(R0.length === 1, '아침에 부탁 하나 생김(' + R0.length + ')'); const q0 = R0[0];
    if (q0) { console.log('    부탁: ' + q0.k + ' ← ' + q0.e + '×' + q0.n + ' · ' + q0.why[0]);
      const W0 = await ev(q => { const G = { shiitake: '🍄', cabbage: '🥬', potato: '🥔', lumber: '🌰', beehive: '🍯', pasture: '🥛', saltpan: '🧂', paddy: '🍚', strawberry: '🍓', pear: '🍐', fisher: '🐟', clam: '🐚', seaweed: '🌿', oyster: '🐚' }; const B = SM_TOWN.bag2(); const w = SM_TOWN.workers ? null : null; void w; return { own: G[q.k], body: !!SD2 && SM_TOWN.bag2().wk(q.k) }; }, q0);
      ok(W0.own !== q0.e, '자기 일에서 나는 것은 부탁하지 않음(' + W0.own + ' ≠ ' + q0.e + ')'); ok(!!W0.body, '부탁한 이웃은 몸이 있음(일꾼 ' + q0.k + ')');
      await ev(() => SM_TOWN.dayx().reset()); const dl = await ev(() => SM_TOWN.dayx().list().filter(r => r.g === 'req').map(r => r.m)); ok(dl.length === 1 && dl[0] === 18 * 60, '오늘 시간표에 부탁 마감 18:00 줄(' + JSON.stringify(dl) + ')');
      await ev(() => SM_TOWN.openTasks()); await W8(300); const tk = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { t: P.textContent, rq: P.querySelectorAll('[data-rq]').length } : null; }); ok(tk && /이웃 부탁/.test(tk.t) && tk.rq === 1, '할 일 창에 부탁 줄 + 🧭(' + (tk && tk.rq) + ')');
      await ev(() => { const b9 = document.querySelector('.twn-p [data-rq]'); if (b9) b9.click(); }); await W8(500); const rt = await ev(() => SM_TOWN.routeNow()); ok(!!rt && !(await ev(() => !!document.querySelector('.twn-p'))), '부탁 🧭 = 빨간 선(구하는 곳 · ' + (rt && rt.len) + 'm)'); await closeAll();
      const bh = await ev(() => SM_TOWN.bag2().boardHtml()); ok(/data-rq/.test(bh), '의뢰 게시판 글에도 오늘 부탁(data-rq)');
      // 곁에서 드리기
      const H0 = await ev(q => { const S = SM_TOWN.game().S; S.bag[q.e] = (S.bag[q.e] || 0) + q.n; const W = SM_TOWN.bag2(); void W; return { hearts: JSON.parse(JSON.stringify(S.hearts || {})), money: S.money, have: S.bag[q.e] }; }, q0);
      const wp = await ev(k => SM_TOWN.bag2().wk(k), q0.k); await tp(wp.x + 1.4, wp.z + 0.8); await W8(1200);
      await ev(() => SM_TOWN.bagOpen()); await W8(300); const bp = await ev(() => { const P = document.querySelector('.twn-p'), b9 = P && P.querySelector('[data-rqd]'); return { has: !!b9, dis: b9 ? b9.disabled : null, t: P ? (P.querySelector('[data-breq]') || {}).textContent || '' : '' }; });
      console.log('    가방 줄: ' + bp.t); ok(bp.has && bp.dis === false, '곁에서 가방을 열면 📦 드리기 단추(켜짐)');
      await ev(() => { const b9 = document.querySelector('.twn-p [data-rqd]'); if (b9) b9.click(); }); await W8(500);
      const H1 = await ev(q => { const S = SM_TOWN.game().S; return { st: SM_TOWN.bag2().today()[0].st, have: S.bag[q.e] || 0, nb: S.today && S.today.nb, hearts: JSON.parse(JSON.stringify(S.hearts || {})), money: S.money, rw: Object.keys((S.rw && S.rw.c) || {}).filter(k => k.startsWith('h|')) }; }, q0);
      ok(H1.st === 'done' && H1.have === H0.have - q0.n, '드리면 = 끝(done) · 가방에서 ' + q0.n + '개 빠짐(' + H0.have + ' → ' + H1.have + ')');
      const hk = Object.keys(H1.hearts).find(k => (H1.hearts[k] || 0) > (H0.hearts[k] || 0)); ok(!!hk && H1.rw.includes('h|' + hk), '마음 +1 = rwCheck 문을 지남(' + hk + ')'); ok(H1.nb && H1.nb.why === 'req' && H1.nb.e === q0.e, '오늘 행적 = 부탁(내일 답례 · ' + JSON.stringify(H1.nb) + ')');
      ok(H1.money === H0.money, '부탁 = 돈 생김 X(경제 그대로)'); await closeAll();
      // 둘째 · 셋째 X
      await ev(() => { const S = SM_TOWN.game().S; S.min = 10 * 60; SM_TOWN.bag2().make(); }); let R1 = await ev(() => SM_TOWN.bag2().today()); ok(R1.length === 2 && R1[1].k !== q0.k, '일찍 들어주면 다른 이웃의 둘째 부탁(' + R1.length + ' · ' + (R1[1] && R1[1].k) + ')');
      await ev(() => { const S = SM_TOWN.game().S, L9 = S.bag2.rq.L; if (L9[1]) { L9[1].st = 'done'; L9[1].at = 600; } SM_TOWN.bag2().make(); SM_TOWN.bag2().make(); }); R1 = await ev(() => SM_TOWN.bag2().today()); ok(R1.length === 2, '하루 둘까지(셋째 X · ' + R1.length + ')');
      // 다음 날 아침 답례
      const homeOn = await ev(() => { const h = SM_TOWN.home(); return !!(h && h.id); });
      await ev(() => SM_TOWN.sleep()); await W8(4000); await closeAll(); const gf = await ev(() => { const H = SM_TOWN.game().S.home; return H && H.gift ? { ...H.gift } : null; });
      if (homeOn) ok(gf && gf.why === 'req' && gf.g === q0.e, '다음 아침 문 앞 답례 = 부탁 답례(' + JSON.stringify(gf) + ')'); else console.log('    (우리 집이 없는 판 — 답례 줄은 건너뜀)');
      // 기한 넘김 = 벌 X
      await ev(() => { SM_TOWN.game().S.min = 8 * 60; }); await W8(2500); await ev(() => SM_TOWN.bag2().make()); const q2 = (await ev(() => SM_TOWN.bag2().today()))[0]; if (!q2) console.log('    디버그 ' + JSON.stringify(await ev(() => ({ rq: SM_TOWN.bag2().state().rq, d: SM_TOWN.game().S.day, m: SM_TOWN.game().S.min, dbg: SM_TOWN.bag2().dbg() })))); ok(!!q2, '다음 날 새 부탁(' + (q2 && q2.k) + ')');
      const B0 = await ev(() => { const S = SM_TOWN.game().S; return { m: S.money, h: JSON.stringify(S.hearts || {}), b: JSON.stringify(S.bag) }; });
      await ev(() => { const S = SM_TOWN.game().S; S.bag2.rq.L[0].said = 1; S.min = 18 * 60 + 10; SM_TOWN.bag2().sec(); }); const q3 = (await ev(() => SM_TOWN.bag2().today()))[0];
      const B1 = await ev(() => { const S = SM_TOWN.game().S; return { m: S.money, h: JSON.stringify(S.hearts || {}), b: JSON.stringify(S.bag) }; });
      ok(q3.st === 'late' && B0.m === B1.m && B0.h === B1.h && B0.b === B1.b, '18:00 넘김 = late · 돈·마음·가방 그대로(벌 X)');
      await ev(() => SM_TOWN.sleep()); await W8(3500); await closeAll(); await ev(() => { SM_TOWN.game().S.min = 8 * 60; }); await W8(2500); await ev(() => SM_TOWN.bag2().make()); const ms0 = await ev(() => Object.keys(SM_TOWN.bag2().state().miss).length); ok(ms0 === 1, '못 들어준 이웃 = 다음 날 \'다음에 또\' 한 번 기억(' + ms0 + ')');
      const wq = await ev(k => SM_TOWN.bag2().wk(k), q2.k); await tp(wq.x + 1.2, wq.z + 1.0); await W8(400); await ev(() => { const B = SM_TOWN.bag2(); B.sec(); B.sec(); B.sec(); }); const ms1 = await ev(() => ({ n: Object.keys(SM_TOWN.bag2().state().miss).length, d: SM_TOWN.bag2().dbg().slice(-3) }));
      ok(ms1.n === 0 && ms1.d.some(t => /^miss /.test(t)), '그 이웃 곁을 지나면 \'다음에 또 부탁할게요\' 한마디(' + JSON.stringify(ms1.d) + ')'); }

    // ───── ③ 쓸 곳 한 줄 ─────
    console.log('③ 쓸 곳');
    const U0 = await ev(() => { const S = SM_TOWN.game().S; S.bag2.kn = { mk: null, eat: {} }; S.nbk = {}; S.bag['🥔'] = 3; S.bag['🍄'] = 2; const B = SM_TOWN.bag2(); return { p: B.uses('🥔').map(u => u.ic + u.t), m: B.uses('🍄').map(u => u.ic + u.t) }; });
    console.log('    모를 때 🥔: ' + U0.p.join(' | ')); ok(!U0.p.some(t => t.startsWith('🛒')) && !U0.p.some(t => t.startsWith('🎁')), '장터를 안 가 봄 · 못 들은 좋아함 = 그 줄 안 보임');
    const U1 = await ev(() => { const S = SM_TOWN.game().S, B = SM_TOWN.bag2(), w = SM_TOWN.bag2().wk('shiitake') || SM_TOWN.bag2().wk('lumber'); B.sawMarket([w ? w.x + 10 : 0, w ? w.z : 0]); const W = window.SM_TOWN; void W; return { p: B.uses('🥔').map(u => [u.ic + u.t, !!u.p]) }; });
    console.log('    장터 본 뒤 🥔: ' + U1.p.map(q => q[0]).join(' | ')); ok(U1.p.some(q => q[0].startsWith('🛒') && /150원/.test(q[0]) && q[1]), '장터를 본 뒤 = 「장터에서 150원쯤」 줄 + 🧭');
    const U2 = await ev(() => { const S = SM_TOWN.game().S, B = SM_TOWN.bag2(); const hk = Object.keys(S.hearts || {})[0]; if (hk) S.nbk[hk] = { l: ['🍄'] }; return { hk, m: B.uses('🍄').map(u => [u.ic + u.t, !!u.p]) }; });
    console.log('    들은 뒤 🍄: ' + U2.m.map(q => q[0]).join(' | ')); ok(!U2.hk || U2.m.some(q => q[0].startsWith('🎁') && q[1]), '들은 좋아함 = 「○○ 일꾼이 좋아한다고 했어요」 + 🧭');
    await closeAll(); await ev(() => SM_TOWN.bagOpen()); await W8(300);
    const UC = await ev(() => { const P = document.querySelector('.twn-p'), c9 = P && P.querySelector('[data-use="🥔"]'); if (!c9) return null; c9.click(); const box = P.querySelector('.bg-use'); return { vis: box && box.style.display !== 'none', t: box ? box.textContent : '', ug: P.querySelectorAll('.bg-use [data-ug]').length }; });
    console.log('    카드 누름: ' + (UC && UC.t)); ok(UC && UC.vis && UC.ug >= 1, '가방에서 감자 카드를 누르면 쓸 곳 칸이 열림(🧭 ' + (UC && UC.ug) + ')');
    await ev(() => { const P = document.querySelector('.twn-p'), L9 = [...P.querySelectorAll('.bg-use [data-ug]')], b9 = L9.find(x => /장터/.test(x.parentElement.textContent)) || L9[0]; if (b9) b9.click(); }); await W8(500); const rt2 = await ev(() => SM_TOWN.routeNow());
    ok(!!rt2 && !(await ev(() => !!document.querySelector('.twn-p'))), '쓸 곳 🧭 = 창 닫고 빨간 선(' + (rt2 && rt2.len) + 'm)'); await closeAll();

    // ───── ④ 도시락 계획 ─────
    console.log('④ 도시락');
    const LW = await ev(() => { const S = SM_TOWN.game().S, B = SM_TOWN.bag2(), g = SM_TOWN.stamGraph(); if (!g) return null; const q = g.stamps.find(s => s.k === 4) || g.stamps.find(s => s.k === 3); if (!q) return null; S.stam = { v: 1, n: q.k - 1, got: {}, para: 0, fail: {}, said: {}, tip: { swim: 1, climb: 1 } }; delete S.bag['🍙']; delete S.bag['🥔♨']; delete S.bag['🍠♨'];
      const a = B.wait(S.day, true); S.stam.fail[q.id] = [S.day, 1]; const b2 = B.wait(S.day, true); S.bag['🍙'] = 1; const c2 = B.wait(S.day, true); const wt = SM_TOWN.dayx().waits({ day: S.day }, true).map(w => w.k); return { id: q.id, a, b: b2, c: c2, wt }; });
    if (LW) { console.log('    ' + LW.id + ': ' + (LW.b && LW.b.t[0]) + ' / 가방에 있을 때: ' + (LW.c && LW.c.t[0]));
      ok(!LW.a, '실패 기록이 없으면 도시락 줄 X(본 것만)'); ok(!!LW.b && /도시락/.test(LW.b.t[0]), '어제 못 닿은 한 칸 위 목표 = 도시락 줄'); ok(!!LW.c && LW.c.p && LW.b.p !== LW.c.p, '가방에 주먹밥이 있으면 = 그 목표까지 🧭 · 없으면 부엌'); ok(LW.wt.includes('lunch'), '하루 마무리 \'내일 기다리는 것\'에 도시락 줄(' + LW.wt.join(',') + ')'); }
    else ok(false, '체력 목표 자료 없음');

    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  } catch (e) { fails.push('예외: ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log(fails.length ? '\n✗ ' + fails.length + '개 실패\n - ' + fails.join('\n - ') : '\n✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
