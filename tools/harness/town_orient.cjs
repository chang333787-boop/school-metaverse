// 🚩 길찾기 시험 · 🏅 도전 모드 시험(ORIENT-1 · CHAL-1 · v2/games/town_orient.js): node tools/harness/town_orient.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬)]
//   ① 도전 모드 켬: 길 안내 = 빨간 선 X · 위 가운데 줄에 거리 수 X(이웃 말 한 줄) · 큰 지도가 펴짐 · 할 일 창 = 이웃 말 한 줄 + 「지도 펴기」 · 닿으면 도전가 걸음 하나(하루 한도) · 끄면 다시 빨간 선
//   ② 길찾기 첫 코스(학교 둘레) 봇 완주 — 봇은 깃발 좌표를 모름: 깃발 설명(칸 이름 · 랜드마크 · 방위)과 지도 칸 줄 · 랜드마크 자리(지도 기호)만 읽고 걸어감 + 눈(가림 없는 28m 안)으로 깃발을 찾음
//   ③ 헤맴 셈(일부러 한 칸을 떠났다 60m 넘게 돌고 다시 들어섬) · 내 최고(빠른 판만 남음) · 끝 창 지도(내 길 · 맴돈 곳) · J로 옮기면 기록 X
//   ④ 둘째 코스가 열림 · 수첩 🚩 칸에만 시간 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }); await c.addInitScript(() => { try { const k = 'sm-set', o = JSON.parse(localStorage.getItem(k) || '{}'); o.chal = false; localStorage.setItem(k, JSON.stringify(o)); } catch (e) { /* */ } });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
  try {
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.orient && SM_TOWN.orient(), null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(800);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(500);
    const goalTxt = () => ev(() => (document.getElementById('hudGoal') || {}).textContent || '');
    const tp = (x, z) => ev(([x, z]) => { const m = SD2.map; m.player.teleport([x, m.q.groundAt(x, z, 80) + 0.05, z]); }, [x, z]);
    const gate = await ev(() => { const r = SM_TOWN.schRect(); return [(r[0] + r[2]) / 2, r[3] + 6]; }).catch(() => null);
    // ───── ① 도전 모드 ─────
    console.log('① 도전 모드');
    ok(await ev(() => SM_TOWN.chal(true)) === true, '설정 도전 모드 켬(저장)');
    if (gate) await tp(gate[0], gate[1] + 4); await W8(600);
    const me0 = await ev(() => { const q = SD2.map.player.pos(); return [q.x, q.z]; });
    const L = await ev(() => SM_TOWN.orient().lmkList());
    const far = L.map(q => [Math.hypot(q.x - me0[0], q.z - me0[1]), q]).filter(q => q[0] > 90 && q[0] < 350).sort((a, b) => a[0] - b[0])[0];
    ok(!!far, '멀리 있는 장소 하나 고름 — ' + (far && far[1].nm));
    if (far) { await ev(t => SM_TOWN.showRoute({ icon: '📍', name: t.nm, door: [t.x, t.z] }), far[1]); await W8(700);
      const R = await ev(() => SM_TOWN.routeChal()), g = await goalTxt(), big = await ev(() => !!document.querySelector('canvas.twn-big'));
      ok(R && R.chal && !R.trail, '빨간 선 0(목적지는 그대로) ' + JSON.stringify(R)); ok(!/\d\s*(m|km)\b/.test(g) && /🗺/.test(g), '위 가운데 줄 = 거리 수 0 · 이웃 말 「' + g + '」'); ok(big, '길 안내 = 큰 지도 펴기');
      await shot('01_chal_bigmap'); await closeAll(); await W8(300);
      const st0 = await ev(() => SM_TOWN.mypath().steps().chal);
      await tp(far[1].x + 2, far[1].z + 2); await W8(1500);
      const sv = await ev(() => SM_TOWN.orient().info().save), st1 = await ev(() => SM_TOWN.mypath().steps().chal), d = await ev(() => SM_TOWN.game().S.day);
      ok(sv.cd[d] === 1 && st1 === st0 + 1, '빨간 선 없이 닿음 = 도전가 걸음 하나(' + st0 + ' → ' + st1 + ')');
      await tp(me0[0], me0[1]); await W8(400); await ev(t => SM_TOWN.showRoute({ icon: '📍', name: t.nm, door: [t.x, t.z] }), far[1]); await W8(500); await closeAll(); await tp(far[1].x + 2, far[1].z + 2); await W8(1500);
      ok(await ev(() => SM_TOWN.mypath().steps().chal) === st1, '같은 날 또 닿아도 걸음은 그대로(하루 한도)'); }
    { await ev(() => SM_TOWN.tasksNow()); await ev(() => SM_TOWN.openTasks()); await W8(400); const b0 = await ev(() => { const b9 = document.querySelector('.twn-p button[data-g]'); return b9 ? b9.textContent : null; });
      if (b0 != null) { ok(/지도 펴기/.test(b0), '할 일 창 단추 = 「' + b0 + '」'); await ev(() => document.querySelector('.twn-p button[data-g]').click()); await W8(300);
        const sm = await ev(() => { const b9 = document.querySelector('.twn-p button[data-g]'), r = b9 && b9.parentElement.querySelector('small'); return r ? r.textContent : ''; }); ok(/🗣/.test(sm) && !/\d\s*m\b/.test(sm.split('🗣')[1] || ''), '할 일 장소 = 이웃 말 한 줄 「' + (sm.split('🗣')[1] || '').trim() + '」'); await shot('02_chal_task'); }
      else console.log('  (오늘 할 일 없음 — 할 일 창 건너뜀)'); await closeAll(); }
    ok(await ev(() => SM_TOWN.chal(false)) === false, '도전 모드 끔');
    if (far) { await tp(me0[0], me0[1]); await W8(300); await ev(t => SM_TOWN.showRoute({ icon: '📍', name: t.nm, door: [t.x, t.z] }), far[1]); await W8(500); const R = await ev(() => SM_TOWN.routeChal()), g = await goalTxt(); ok(R && !R.chal && R.trail && /\d+ m/.test(g), '끄면 예전 그대로(빨간 선 · 거리 줄 「' + g.slice(0, 40) + '」)'); await ev(() => SM_TOWN.pathOff()); await closeAll(); }
    // ───── ② 길찾기 첫 코스 ─────
    console.log('② 길찾기 시험');
    const BD = await ev(() => SM_TOWN.orient().boards()); console.log('  출발 판: ' + JSON.stringify(BD));
    ok(BD.length >= 2 && BD[0].c === 'c1', '출발 판(코스마다) ' + BD.map(q => q.c).join(','));
    ok(BD.filter(q => q.c !== 'c1').every(q => /🔒/.test(q.label)), '둘째·셋째 코스 = 잠김(앞을 마쳐야)');
    const CO = await ev(() => SM_TOWN.orient().course('c1')); ok(CO && CO.flags.length >= 4, '첫 코스 깃발 ' + (CO && CO.flags.length) + ' · ' + (CO && CO.flags.map(f => f.t[0]).join(' / ')));
    for (const cc of ['c2', 'c3']) { const C9 = await ev(c9 => SM_TOWN.orient().course(c9), cc); if (BD.some(q => q.c === cc)) ok(C9 && C9.flags.length >= 4, cc + ' 코스 깃발 ' + (C9 && C9.flags.length) + ' · ' + (C9 && C9.flags.map(f => f.t[0]).join(' / '))); }
    const B1 = BD.find(q => q.c === 'c1');
    if (SHOTS) { await ev(b9 => { const m = SD2.map; m.player.teleport([b9.x + 1.2, m.q.groundAt(b9.x + 1.2, b9.z - 4.5, 80) + 0.05, b9.z - 4.5]); m.player.lookAt && m.player.lookAt([b9.x, b9.z]); }, B1); await W8(1500); await shot('03a_board_3d'); }
    await tp(B1.x, B1.z + 1.5); await W8(500); await ev(() => SM_TOWN.orient().openStart('c1')); await W8(500);
    ok(await ev(() => !!document.querySelector('.twn-p .or-cv canvas') && /빨간 선이 없어요/.test(document.querySelector('.twn-p').textContent)), '출발 판 창 = 그 판 지도 + "빨간 선이 없어요" 한 문장'); await shot('03_start');
    // 봇(지도 읽기 흉내) — 깃발 좌표 X · 설명 · 칸 줄 · 랜드마크 자리 · 눈만
    const BOT = async (cid, o9) => ev(async ([cid, o9]) => { const O = SM_TOWN.orient(), m = SD2.map, sl = ms => new Promise(r => setTimeout(r, ms)), C = O.course(cid), LM = O.lmkList(), log = [];
      const DIRV = { 북: [0, -1], 남: [0, 1], 동: [1, 0], 서: [-1, 0], 북동: [0.71, -0.71], 북서: [-0.71, -0.71], 남동: [0.71, 0.71], 남서: [-0.71, 0.71] };
      const here = () => { const q = m.player.pos(); return [q.x, q.z]; };
      async function stepTo(tx, tz, want) { let [x, z] = here(); const L9 = Math.hypot(tx - x, tz - z), n = Math.ceil(L9 / 1.4); for (let k = 1; k <= n; k++) { const nx = x + (tx - x) * k / n, nz = z + (tz - z) * k / n; m.player.teleport([nx, m.q.groundAt(nx, nz, m.player.pos().y + 4) + 0.05, nz]); O.check(); if (k % 4 === 0) await sl(16); if (want) { if (O.info().run && O.info().run.i >= want) return 'got'; const S9 = O.seen(28).find(f => f.n === want); if (S9) return S9; } if (!O.info().run) return 'end'; } return null; }
      async function walk(tx, tz, want) { const a = here(), R = SM_TOWN.routeXY(a, [tx, tz]), P = R && R.ok && R.pts && R.pts.length > 1 ? R.pts.slice(1) : [[tx, tz]]; for (const q of P) { const r = await stepTo(q[0], q[1], want); if (r) return r; } return null; }
      for (let n = 1; n <= C.flags.length; n++) { const f = C.flags[n - 1], t = f.t[0], box = O.cellBox(f.cell), dm = t.match(/(북동|북서|남동|남서|북|남|동|서)쪽/), dv = dm ? DIRV[dm[1]] : [0, 0];
        let gx = box ? (box[0] + box[2]) / 2 : here()[0], gz = box ? (box[1] + box[3]) / 2 : here()[1];
        if (f.lmk) { const nm = f.lmk.nm[0], cand = LM.filter(q => q.nm === nm).sort((a, b) => Math.hypot(a.x - gx, a.z - gz) - Math.hypot(b.x - gx, b.z - gz))[0]; if (cand) { const k = /바로 앞/.test(t) ? 3 : 18; gx = cand.x + dv[0] * k; gz = cand.z + dv[1] * k; } }
        else if (/학교 담/.test(t)) { const r = SM_TOWN.schRect(); gx = (r[0] + r[2]) / 2 + dv[0] * ((r[2] - r[0]) / 2 + 20); gz = (r[1] + r[3]) / 2 + dv[1] * ((r[3] - r[1]) / 2 + 20); }
        if (box) { gx = Math.max(box[0] + 2, Math.min(box[2] - 2, gx)); gz = Math.max(box[1] + 2, Math.min(box[3] - 2, gz)); }
        let r = await walk(gx, gz, n); let tries = 0;
        for (const rad of [12, 24, 36]) { if (r) break; for (let a = 0; a < 8 && !r; a++) { tries++; r = await stepTo(gx + Math.sin(a * 0.785) * rad, gz - Math.cos(a * 0.785) * rad, n); } }   /* 둘레 훑기 = 곧장 걸어 둘러봄 */
        if (r && r.x != null) { r = await stepTo(r.x, r.z, n) || r; await stepTo(r.x != null ? r.x : here()[0], r.z != null ? r.z : here()[1], 0); }
        O.check(); await sl(30); const I = O.info(); log.push({ n, desc: t, found: !!(I.run ? I.run.i >= n : true), tries });
        if (I.run && I.run.i < n) return { ok: false, log }; if (o9 && o9.loopAt === n && I.run) { const s0 = here(); await stepTo(s0[0] + 60, s0[1], 0); await stepTo(s0[0] + 60, s0[1] + 45, 0); await stepTo(s0[0], s0[1], 0); O.check(); }
        if (!I.run) break; }
      return { ok: !O.info().run, log }; }, [cid, o9 || null]);
    await ev(() => { document.querySelector('.twn-p [data-a="go"]').click(); }); await W8(600);
    let I = await ev(() => SM_TOWN.orient().info()); ok(I.run && I.run.flagsVis && I.run.count === CO.flags.length, '출발 = 깃발 ' + (I.run && I.run.count) + '개 보임(InstancedMesh 한 벌)');
    { const R = await ev(() => SM_TOWN.routeChal()), g = await goalTxt(); ok(!R || !R.trail, '시험 중 빨간 선 0'); ok(/번 깃발/.test(g) && !/\d\s*m\b/.test(g), '위 가운데 줄 = 찾는 깃발 설명 「' + g + '」'); }
    await ev(() => SM_TOWN.openBig()); await W8(400); ok(await ev(() => !!document.querySelector('.twn-p[data-k=ormap] .or-cv canvas') && !document.querySelector('canvas.twn-big')), '시험 중 M = 시험 지도(큰 지도 X)'); await shot('04_course_map'); await closeAll();
    const t0 = Date.now(); const r1 = await BOT('c1'); console.log('  봇 1판: ' + JSON.stringify(r1.log) + ' · ' + Math.round((Date.now() - t0) / 1000) + '초');
    ok(r1.ok, '봇이 깃발 좌표 없이(칸·방위·랜드마크만) 첫 코스 완주'); await W8(700);
    I = await ev(() => SM_TOWN.orient().info()); const E1 = I.end; ok(E1 && E1.first, '끝 창(처음 완주) ' + JSON.stringify(E1));
    ok(await ev(() => { const P = document.querySelector('.twn-p[data-k=ormap]'); return !!(P && P.querySelector('.or-end canvas') && /어디서 헤맸나/.test(P.textContent) && !/\d+초|\d+분/.test(P.textContent)); }), '끝 창 = 내 길 지도 + "어디서 헤맸나" · 시간 숫자 X'); await shot('05_end');
    ok(await ev(() => /새 코스가 열렸어요/.test((document.querySelector('.twn-p') || {}).textContent || '')) || !BD.some(q => q.c === 'c2'), '둘째 코스 열림 알림');
    const sv1 = I.save; ok(sv1.best.c1 && sv1.n.c1 === 1, '내 최고 저장 ' + JSON.stringify(sv1.best.c1)); await closeAll(); await W8(1200);
    ok((await ev(() => SM_TOWN.orient().boards())).filter(q => q.c === 'c2').every(q => !/🔒/.test(q.label)), '둘째 코스 출발 판 잠김 풀림');
    // ③ 헤맴 셈 + 내 최고(일부러 돌아 늦은 판 = 최고 그대로)
    await tp(B1.x, B1.z + 1.5); await W8(300); await ev(() => SM_TOWN.orient().start('c1')); await W8(300); await ev(() => { const r = SM_TOWN.orient(); r.cfg({}); }); await W8(2500);
    const r2 = await BOT('c1', { loopAt: 1 }); await W8(700); I = await ev(() => SM_TOWN.orient().info()); console.log('  봇 2판(1번 뒤 일부러 맴돎): ' + JSON.stringify(I.end) + ' · 최고 ' + JSON.stringify(I.save.best.c1) + ' · 지난 ' + JSON.stringify(I.save.last.c1));
    ok(r2.ok && I.end && E1 && I.end.w > E1.w, '헤맴 셈 ' + (E1 && E1.w) + ' → ' + (I.end && I.end.w) + '(1번 뒤 일부러 한 칸을 떠났다 돌아옴)');
    ok(!!(I.save.best.c1 && sv1.best.c1 && I.save.last.c1) && I.save.best.c1.t === Math.min(sv1.best.c1.t, I.save.last.c1.t) && I.save.n.c1 === 2, '내 최고 = 두 판 가운데 빠른 판만');
    ok(await ev(() => /맴돌았어요/.test((document.querySelector('.twn-p') || {}).textContent || '')), '끝 창에 "○번 깃발 가는 길, ○ 칸에서 맴돌았어요"'); await shot('06_end_loop'); await closeAll();
    // J로 옮기면 기록 X
    await ev(() => SM_TOWN.orient().start('c1')); await W8(300); { const F1 = (await ev(() => SM_TOWN.orient().flagsAt('c1')))[0]; await tp(F1[0] + 4, F1[1] + 4); await ev(f => { const m = SD2.map; if (m.player.lookAt) m.player.lookAt([f[0], f[1]]); }, F1); await ev(() => SM_TOWN.orient().check()); await W8(1500); await shot('06a_flag_3d'); }   /* 사진용으로만 깃발 자리를 씀(봇 X) */
    ok((await ev(() => (SM_TOWN.orient().info().run || {}).jmp)) === true, '한 번에 12m 넘게 옮김 = 기록 X 표시'); await ev(() => SM_TOWN.orient().stop());
    // ④ 수첩
    await ev(() => SM_TOWN.orient().openRec()); await W8(300);
    const rec = await ev(() => { const P = document.querySelector('.twn-p[data-k=orient]'); return P ? { t: P.textContent, tab: !!P.querySelector('[data-nb]') && [...P.querySelectorAll('[data-nb]')].some(b => /길찾기/.test(b.textContent)) } : null; });
    ok(rec && /내 최고/.test(rec.t) && /\d+초/.test(rec.t) && !/순위|등/.test(rec.t), '수첩 🚩 = 내 최고 시간(여기에만) · 순위 X'); ok(rec && rec.tab, '수첩 탭 줄에 🚩 길찾기'); await shot('07_notebook'); await closeAll();
    const st = await ev(() => SM_TOWN.mypath().steps().chal); console.log('  도전가 걸음 = ' + st);
    const D = await ev(() => SM_TOWN.orient().info().dbg); console.log('  dbg ' + JSON.stringify(D)); ok(D.ms < 8, '0.25초 칸 최악 ' + D.ms.toFixed(2) + 'ms');
  } catch (e) { fails.push('예외: ' + e.message); console.log(e); }
  ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  await b.close(); console.log(fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
