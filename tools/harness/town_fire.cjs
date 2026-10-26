// 🚒 마을 불 사건 시험(FIRE-4 · FIRE-5 · 사용자 10-24 '불 안 보이는데 버그 아니야?' · 10-25 '10번 깨니까 개노잼 · 깊이가 한 칸'): node tools/harness/town_fire.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 생김: 이야기 전(첫 30분) = 불 없음 · 첫 쪽지 + 1막 첫 장 뒤 = 그날 정한 때에 내 둘레(60~260m) 집에 불(직업 체험이 잠겨 있어도) · 소방서 450m 밖에서도
//   ② 보임: 연기 기둥(옥상 + 12m 넘게) · 빛기둥 · 위 가운데 줄 = 칸 + 방향 + 거리(지나가는 장소 글에 안 덮임) · 120m 앞에서 기둥이 화면 안 · 장소 찾기(F) 맨 위 '지금 생긴 일' → 길 · J 검색 '불'
//   ③ 한 판(FIRE-5): 빨간 선을 걸어서 불난 집 앞 → E → 소방차 → 반장 판단(원인에 맞는 끄는 법) → 차례(사다리차 자리 · 분전함 · 덮개 · 소화기 순서) → 물 뿌리기 → 대상(막아서기 · 고양이 찾기) → 이웃 물음 → 물건 둘러보기 → 원인 고르기 → 끝 창(늦은 것 · 칸 기록)
//   ④ 끝나면 바뀜: 그을음 + 예방 판(E) · 다음 날 새 소화기 + 아침 소식 · 예방 지도 · 그다음 날 흔적 사라짐 ⑤ 열 판: 조합 같은 것 둘 이하 · 상황 넷 · 원인 넷+ · 대상 셋 · 칸 1→5 · 틀린 판 = 번짐 + '무엇이 늦었나' · 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 500) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { const dl = await ev(() => !!document.querySelector('.twn-dlg')); if (dl) { await ev(() => { const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); }); await W8(250); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const goalTx = () => ev(() => { const g = document.getElementById('hudGoal') || [...document.querySelectorAll('body > div')].find(d => d.style && /translateX\(-50%\)/.test(d.style.transform || '') && /top/.test(d.style.cssText) && d.offsetParent); return g && g.style.display !== 'none' ? g.innerText : ''; });
    const F = () => ev(() => SM_TOWN.jobs().fire), FS = () => ev(() => SM_TOWN.jobs().dbg.fireState()), SM = () => ev(() => SM_TOWN.jobs().dbg.smoke());
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.jobs && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500); await closeAll(); await W8(800);
    const setT = (m, o = {}) => ev(([m, o]) => { const G = SM_TOWN.game().S; G.jobs = G.jobs || {}; delete G.jobs.fireDay; delete G.jobs.fireNo; delete G.jobs.fire; if (o.day) G.day = o.day; G.min = m; const E9 = SM_TOWN.emerg && SM_TOWN.emerg(); if (E9) { E9.abort(); E9.dbg.plan(); G.emerg.plan = [{ k: 'fire', at: m, until: m + 200, st: 0 }]; E9.dbg.walk(100); } }, [m, o]);   /* EMERG-1이 있으면 불의 때는 엔진이 정함 → 그날 칸 = 지금 불 · 다니는 중(80m)으로 맞춤 */
    // ① 생김(정문 밖 길에서 — 긴급 출동은 학교 안에선 안 생김)
    { const R9 = await ev(() => SM_TOWN.schRect()); await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [(R9[0] + R9[2]) / 2, R9[3] + 28]); await W8(800); }
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = {}; G.story.cur = null; }); await setT(15 * 60); await W8(2600);
    ok(!(await F()), '이야기 전(첫 30분) = 불 사건 없음(INTUIT-1 그대로)');
    const meA = await ev(() => { const m = SD2.map.player.pos(), st = SM_TOWN.places().find(q => /소방서/.test(q.name || '')); return { x: m.x, z: m.z, st: st ? Math.round(Math.hypot(st.door[0] - m.x, st.door[1] - m.z)) : -1 }; });
    await ev(() => { const G = SM_TOWN.game().S; G.story.done = { p0: 1, a1_1: 1 }; }); await setT(15 * 60); let f0 = null; for (let i = 0; i < 12 && !f0; i++) { await W8(500); f0 = await F(); } await closeAll();
    const lockJ = await ev(() => SM_TOWN.hud.on('jobs'));
    ok(!!f0, '첫 쪽지 + 1막 첫 장 뒤 15시 = 불 사건 생김 (직업 체험 ' + (lockJ ? '열림' : '잠김') + ' · 소방서까지 ' + meA.st + 'm)');
    if (!f0) throw new Error('불이 안 생김');
    let fs = await FS(); const dHouse = Math.round(Math.hypot(fs.hs[0] - meA.x, fs.hs[1] - meA.z)); ok(dHouse >= 55 && dHouse <= 270, '불난 집 = 내 둘레 ' + dHouse + 'm');
    // ② 보임
    const sm = await SM(); ok(sm && sm.top - sm.roof >= 12, '연기 기둥 = 옥상 위 ' + (sm ? (sm.top - sm.roof).toFixed(1) : '?') + 'm'); ok(sm && sm.beacon, '불난 집 빛기둥');
    const chip = await ev(() => [...document.querySelectorAll('.gchip')].some(c => /🚒/.test(c.textContent) && getComputedStyle(c).display !== 'none')); ok(chip, '오른쪽 칩 🚒');
    await W8(700); let g = await goalTx(); ok(/불/.test(g) && /\d+m/.test(g) && /쪽/.test(g), '위 가운데 줄 = 칸·방향·거리 「' + g + '」');
    { const far = await ev(fs => { const M = SD2.map, me = M.player.pos(), dx = me.x - fs.hs[0], dz = me.z - fs.hs[1], l = Math.hypot(dx, dz) || 1, x = fs.hs[0] + dx / l * 120, z = fs.hs[1] + dz / l * 120; M.player.teleport([x, SM_TOWN.ground(x, z) + 0.3, z]); M.player.lookAt([fs.hs[0], fs.hs[1]]); return [x, z]; }, fs); await W8(1600);
      const vis = await ev(() => { const S = SM_TOWN.jobs().dbg.smoke(), cam = SD2.map.camera, V = cam.position.clone(); V.set(S.col[0] + 2, S.col[1] + 9, S.col[2] + 1).project(cam); return { x: +V.x.toFixed(2), y: +V.y.toFixed(2), z: +V.z.toFixed(3) }; });
      ok(Math.abs(vis.x) < 1 && Math.abs(vis.y) < 1 && vis.z < 1, '120m 앞에서 연기 기둥이 화면 안 (' + JSON.stringify(vis) + ')'); await shot('fire_120m');
      await ev(() => { const M = SD2.map, me = M.player.pos(); M.player.teleport([me.x + 9, SM_TOWN.ground(me.x + 9, me.z) + 0.3, me.z]); }); await W8(1300); g = await goalTx(); ok(/불/.test(g), '걸어서 장소가 바뀌어도 할 일 줄 = 불 「' + g + '」'); }
    const fOn = await ev(() => SM_TOWN.hud.on('find')); if (!fOn) { console.log('    (장소 찾기 F가 아직 잠김 — 시험에선 열고 봄)'); await ev(() => SM_TOWN.hud.unlock('find', false)); await W8(400); await closeAll(); }
    await p.keyboard.press('KeyF'); await W8(700); let P = await panel(); const emRow = await ev(() => !!document.querySelector('.twn-p button[data-em]')); ok(P && /지금 생긴 일/.test(P.t) && emRow, '장소 찾기(F) 맨 위 = 지금 생긴 일(불난 집)');
    await ev(() => { const b9 = document.querySelector('.twn-p button[data-em]'); if (b9) b9.click(); }); await W8(600); const rn = await ev(() => SM_TOWN.routeNow()); ok(!!rn, '🧭 길 = 빨간 선 (' + (rn ? rn.len + 'm' : '없음') + ')');
    { const hj = await ev(() => SM_TOWN.hud.on('jump')); if (hj) { await p.keyboard.press('KeyJ'); await W8(700); await p.keyboard.type('불'); await W8(400); const jb = await ev(() => !!document.querySelector('.twn-p .jr button[data-em]')); ok(jb, 'J 검색 「불」 = 지금 불난 집'); await closeAll(); } else console.log('    (J 바로 가기 잠김 — J 검색 건너뜀)'); }
    // ③ 끌 수 있음: 빨간 선을 따라 걸음(8m · 0.25초)
    { const pts = await ev(() => SM_TOWN.routePts()); if (pts) for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], c = pts[k], l = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let t = 8; t < l + 8; t += 8) { const u = Math.min(1, t / l); await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]); await W8(220); } } }
    await W8(500); const near = await ev(() => SD2.near()); ok(/불 끄기/.test(near || ''), '빨간 선 끝 = 「소방관 도와 불 끄기」 E (' + near + ')'); await shot('fire_scene');
    // ── FIRE-5 한 판 몰기(차례마다 그 자리로 가서 E · 대화는 고르기 규칙대로 · bad = 일부러 틀림)
    const TP = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
    const F5 = () => ev(() => SM_TOWN.jobs().dbg.f5()), HOTS = () => ev(() => SM_TOWN.jobs().dbg.hots());
    const RIGHT = { gen: /바로 물을/, elec: /전기부터/, oil: /뚜껑/ }, QOK = /몸을 낮추고|^119$|멈추고, 눕고|손등으로|정한 곳에 모여|소화기와 화재 감지기|들어가면 안 돼요/, TASKL = { power: '차단기 내리기', cover: '냄비에 덮개 덮기', spot: '옆 불티 자리 막기', guide: '이웃 대피 안내', ladder: '사다리 펴기' };
    async function dlgStep(f, bad) { return ev(([f, bad, RS, QS, TL]) => { const B = [...document.querySelectorAll('.twn-dlg .ch button')]; if (B.length) { const tx = B.map(b => b.textContent); let k = -1;
        if (tx.some(t => /전기부터/.test(t))) { const re = new RegExp(RS[f.plan.method]); k = bad ? tx.findIndex(t => !re.test(t)) : tx.findIndex(t => re.test(t)); }
        else if (tx.some(t => Object.values(TL).some(q => t.includes(q)))) { const need = []; if (f.plan.method === 'elec') need.push('power'); if (f.plan.method === 'oil') need.push('cover'); if (f.two) need.push('spot'); need.push('guide'); if (f.plan.target === 'elder' || f.plan.target === 'roofcat') need.push('ladder'); const got = (f.crew || []).map(c => c.job); const want = need.filter(q => !got.includes(q)).map(q => TL[q]); k = bad && !window.__f5bad ? tx.findIndex(t => !want.some(q => t.includes(q))) : tx.findIndex(t => want.some(q => t.includes(q))); if (bad) window.__f5bad = 1; }
        else { const re = new RegExp(QS); k = tx.findIndex(t => re.test(t)); }
        (B[k >= 0 ? k : 0]).click(); return 'ch:' + (tx[k] || tx[0]).slice(0, 14); } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 'dlg'; } return ''; }, [f, bad, Object.fromEntries(Object.entries(RIGHT).map(([k, v]) => [k, v.source])), QOK.source, TASKL]); }
    async function runRound(tag, o = {}) { const log = { phases: [], dl: [] }; let f = await F5(), lastP = '', stuck = 0, ladTried = false, causeTried = false, sprayT = 0;
      for (let it = 0; it < 420; it++) { const P = await panel(); if (P && log.phases[log.phases.length - 1] !== 'P:' + P.k && /^fire/.test(P.k)) log.phases.push('P:' + P.k); if (P && P.k === 'jobend') { log.end = P.t; break; } if (!(await ev(() => SM_TOWN.jobs().active))) { log.end = log.end || '(멈춤)'; break; }
        if (await ev(() => !!document.querySelector('.twn-dlg'))) { const r = await dlgStep(f || {}, !!o.bad); if (r.startsWith('ch')) log.dl.push(r); await W8(260); continue; }
        if (P && P.k === 'firequiz') { const ordr = [0, 1, 2, 3]; for (const i of ordr) { await ev(i => { const b9 = document.querySelector('.twn-p button[data-i="' + i + '"]'); if (b9) b9.click(); }, i); await W8(200); } continue; }
        if (P && P.k === 'firecause') { const r = await ev(([c, bad]) => { const ok9 = document.querySelector('.twn-p button[data-a="ok"]'); if (ok9) { ok9.click(); return 'ok'; } const B = [...document.querySelectorAll('.twn-p button[data-c]')]; const b9 = bad ? B.find(b => b.dataset.c !== c) : B.find(b => b.dataset.c === c); (b9 || B[0]).click(); return b9 ? b9.dataset.c : '?'; }, [f.plan.cause, o.bad && !causeTried]); causeTried = true; log.cause = (log.cause || '') + r + ' '; await W8(300); continue; }
        if (P) { await closeAll(); continue; }
        f = await F5(); if (!f) { await W8(300); continue; } if (f.phase !== lastP) { log.phases.push(f.phase); lastP = f.phase; stuck = 0; if (o.onPhase) await o.onPhase(f); } else if (++stuck > 120) { log.stuck = f.phase; break; }
        const H = await HOTS();
        if (f.phase === 'ride' || f.phase === 'go' || f.phase === 'smoke') { await ev(() => SM_TOWN.jobs().dbg.rideEnd()); await W8(400); continue; }
        if (f.phase === 'hose') { if (!sprayT) { sprayT = 1; if (f.tool === 'ext') { const st = await FS(); await TP(st.door[0] + st.f[0] * 1.5, st.door[1] + st.f[1] * 1.5); } const ai = f.flames.findIndex(q => q[3] > 0 && !q[5]); await ev(i => SM_TOWN.jobs().dbg.aimAt(i), ai); const h0 = f.flames.filter(q => !q[5]).reduce((a, q) => a + q[3], 0); await p.keyboard.down('KeyE'); await W8(2500); await p.keyboard.up('KeyE'); await ev(() => SM_TOWN.jobs().dbg.aimAt(null)); const f2 = await F5(); log.hoseDrop = +(h0 - f2.flames.filter(q => !q[5]).reduce((a, q) => a + q[3], 0)).toFixed(2); if (f.two) { log.twoGrow = +(f2.flames.filter(q => q[4] === 1).reduce((a, q) => a + q[3], 0) - f.flames.filter(q => q[4] === 1).reduce((a, q) => a + q[3], 0)).toFixed(2); } }
          if (f.stp && !f.stp.done) { await TP(f.stp.x + 0.6, f.stp.z); await W8(300); await p.keyboard.press('KeyE'); await W8(500); continue; }
          if (f.plan.target === 'stop' && !f.stp) { await ev(() => { const F = SM_TOWN.jobs().dbg; const s = F.f5(); void s; }); }
          await ev(() => SM_TOWN.jobs().dbg.sprayAll()); await W8(600); continue; }
        if (f.phase === 'ladder') { const L9 = f.lads || []; const bad = L9.find(q => q.k !== 'ok'), good = L9.find(q => q.k === 'ok'); const tg = o.bad && !ladTried && bad ? bad : good; ladTried = true; log.ladSpots = L9.map(q => q.k).join(','); if (tg) { await TP(tg.at[0], tg.at[1]); await W8(350); await p.keyboard.press('KeyE'); await W8(1200); } continue; }
        if (f.phase === 'cat') { log.torch = log.torch || f.torch; await TP(f.catAt[0] + 0.5, f.catAt[1]); await W8(400); await p.keyboard.press('KeyE'); await W8(900); continue; }
        if (f.phase === 'look') { const L9 = H.filter(h => /자세히 보기|Look closely/.test(h.label)); if (!L9.length) { await W8(400); continue; } const h = L9[0]; await TP(h.x, h.z); await W8(300); await p.keyboard.press('KeyE'); await W8(350); continue; }
        if (H.length && !/wait/.test(f.phase)) { const h = H.find(q => !q.off); if (h) { await TP(h.x, h.z); await W8(350); await p.keyboard.press('KeyE'); await W8(500); continue; } }
        await W8(400); }
      log.f = f; console.log('    [' + tag + '] ' + (f ? f.plan.key + ' · ' + f.plan.type + ' · 칸 ' + f.lv : '?') + ' · 차례 ' + log.phases.join('>') + (log.stuck ? ' · 멈춤 ' + log.stuck : '') + ' · 늦음 ' + (f ? f.late.length : '?')); return log; }
    await p.keyboard.press('KeyE'); await W8(900); ok((await ev(() => SM_TOWN.jobs().active)) === 'fire', '불난 집 앞 E = 소방 출동 시작' + (lockJ ? '' : '(직업 체험 잠김이어도)'));
    const L1 = await runRound('첫 판', { onPhase: async f => { if (f.phase === 'hose') await shot('fire_hose'); } });
    ok(L1.f && L1.f.lv === 1 && L1.f.tool === 'ext' && L1.phases.includes('P:firequiz'), '첫 판 = 도전 1칸 소화기(순서 카드 먼저) · 차례 ' + L1.phases.join('>'));
    ok(L1.hoseDrop > 0.3, '소화기 E 꾹 = 불꽃이 줄어듦 (' + L1.hoseDrop + ')');
    ok(L1.phases.includes('look') && L1.phases.includes('P:firecause'), '끝나고 원인 찾기(둘러보기 → 고르기)');
    ok(/오늘 출동/.test(L1.end || '') && /무엇이 늦었나|늦은 것이 없었어요/.test(L1.end || '') && /내 최고|첫 기록/.test(L1.end || ''), '끝 창 = 오늘 판 · 늦은 것 한 줄 · 칸 기록');
    await closeAll();
    // ④ 끝나면 바뀜: 그날 = 그을음 + 예방 판(E로 읽기) · 다음 날 = 새 소화기 + 아침 소식 · 예방 지도
    const mk = await ev(() => SM_TOWN.jobs().dbg.mark()); ok(mk.drawn && mk.log && mk.log.c && mk.log.sg, '불 끈 집 = 그을음 + 예방 판 (' + (mk.log ? mk.log.cell + ' · ' + mk.log.c : '-') + ')');
    { const hasSign = await ev(() => SD2.map.interact.list().some(h => /예방 판/.test(h.label))); ok(hasSign, '예방 판 E(읽기)'); }
    const lad1 = await ev(() => SM_TOWN.jobs().dbg.lad()); ok(lad1.lv === 2 && lad1.best, '잘한 판 = 다음 칸 2 (도전 사다리 꼴 best·last)');
    const d0 = await ev(() => SM_TOWN.game().S.day); await ev(d => { SM_TOWN.game().S.day = d + 1; }, d0); await W8(1500);
    const nw = await ev(d => SM_TOWN.jobs().dbg.news(d), d0 + 1); ok((await ev(() => SM_TOWN.jobs().dbg.mark())).drawn && nw.length === 1 && /이웃이/.test(nw[0].t[0]), '다음 날 = 흔적 + 아침 소식 「' + (nw[0] ? nw[0].t[0].slice(0, 40) : '') + '…」');
    await ev(() => SM_TOWN.jobs().openFmap()); await W8(500); P = await panel(); ok(P && P.k === 'firemap' && /불 1번/.test(P.t), '소방서 예방 지도 = 원인 점 쌓임'); await closeAll();
    await ev(d => { SM_TOWN.game().S.day = d + 2; }, d0); await W8(1500); ok(!(await ev(() => SM_TOWN.jobs().dbg.mark())).drawn, '그다음 날 흔적이 사라짐');
    // ⑤ 열 판(날마다 · 칸이 오름 · 비·밤 섞음 · 한 판은 일부러 틀림)
    const keys = [], sits = new Set(), causes = new Set(), tgs = new Set(), lvs = []; let badLog = null, d9 = d0 + 3;
    for (let r = 0; r < 10; r++) { d9++; const wx = r === 2 || r === 7 ? 'rain' : 'clear', night = r === 5;
      await ev(([d, wx, night]) => { const G = SM_TOWN.game().S; G.day = d; G.min = night ? 20 * 60 + 40 : 11 * 60; G.jobs = G.jobs || {}; delete G.jobs.fireDay; delete G.jobs.fireNo; delete G.jobs.fire; SM_TOWN.rules.wx(wx); const E9 = SM_TOWN.emerg && SM_TOWN.emerg(); if (E9) { E9.abort(); E9.dbg.plan(); G.emerg.plan = []; } }, [d9, wx, night]); await W8(night ? 2500 : 900);
      const st = await ev(() => { const s = SM_TOWN.places().find(q => /소방서/.test(q.name || '')); return s ? s.door : null; }); await TP(st[0] + 6, st[1] + 6); await W8(600);
      const okOffer = await ev(() => SM_TOWN.jobs().dbg.offer()); await closeAll(); if (!okOffer) { ok(false, '판 ' + (r + 1) + ' 불이 안 생김'); continue; }
      await ev(() => SM_TOWN.jobs().startJob('fire', null, { scene: true })); await W8(600);
      const lg = await runRound('판 ' + (r + 1), { bad: r === 4 }); await closeAll(); if (r === 4) badLog = lg; if (!lg.f) continue;
      keys.push(lg.f.plan.key); sits.add(lg.f.plan.sit); causes.add(lg.f.plan.cause); tgs.add(lg.f.plan.target === 'roofcat' ? 'cat' : lg.f.plan.target); lvs.push(lg.f.lv);
      if (lg.stuck) ok(false, '판 ' + (r + 1) + ' 멈춤 = ' + lg.stuck); }
    { const c = {}; for (const k of keys) c[k] = (c[k] || 0) + 1; const mx = Math.max(0, ...Object.values(c)); ok(keys.length === 10 && mx <= 2, '열 판 조합(상황|원인|대상) 같은 것 둘 이하 (최대 ' + mx + ' · ' + Object.keys(c).length + '가지)'); }
    ok(sits.size >= 4, '상황 넷 섞임 (' + [...sits].join(',') + ')'); ok(causes.size >= 4, '원인 넷 넘게 섞임 (' + [...causes].join(',') + ' · 다섯 중)'); ok(tgs.size >= 3, '구할 대상 셋 섞임 (' + [...tgs].join(',') + ')');
    ok(lvs.includes(3) && lvs.includes(5) && Math.max(...lvs) === 5, '도전 칸이 오름 (' + lvs.join('→') + ')');
    ok(badLog && badLog.f && badLog.f.late.length >= 1 && /무엇이 늦었나/.test(badLog.end || ''), '일부러 틀린 판 = 불이 번짐 + 끝 창 「무엇이 늦었나」 (' + (badLog && badLog.f ? badLog.f.late.join(' / ') : '-') + ')');
    ok(badLog && badLog.f && badLog.f.flames.some(q => q[5] === 0 && q[4] === 2), '틀린 동안 바람 아래쪽 잠든 불꽃이 깨어남');
    { const FM = await ev(() => SM_TOWN.jobs().dbg.fmap()); ok(FM.length >= 10, '예방 지도 점 ' + FM.length + '개'); }
    // 그냥 둔 불 = 소방관들이 끄고 흔적은 남음
    await ev(() => { const G = SM_TOWN.game().S; G.day += 1; G.min = 11 * 60; G.jobs = G.jobs || {}; delete G.jobs.fireDay; delete G.jobs.fireNo; delete G.jobs.fire; SM_TOWN.rules.wx('clear'); }); await W8(800);
    ok(await ev(() => SM_TOWN.jobs().dbg.offer()), '다른 날 불(바로 띄움)'); await closeAll(); await ev(() => SM_TOWN.jobs().dbg.autoNow()); await W8(1500); const mk2 = await ev(() => SM_TOWN.jobs().dbg.mark());
    ok(!(await F()) && mk2.drawn && mk2.log.c, '그냥 두면 소방관들이 끔 · 원인은 지도에(소방관 조사)');
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
