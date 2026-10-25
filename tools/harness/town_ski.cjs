// 스키 기문 코스 시험(SLALOM-1 · town_ski.js · 설계 docs/systems/town_explore.md 34 · 차례 7): node tools/harness/town_ski.cjs [마을=ourtown] [포트=8002]
//   ① 겨울 · 본 슬로프 꼭대기 E = 출발 창(초급 열림 · 중급·상급 잠김) · 기문 인스턴스가 보임
//   ② 곧게만 내려가기 = 기문을 놓침(한 줄 · 결과 창 '연습 판' · 내 기록 X)
//   ③ 초급 봇 3판 안에 완주 · 처음 완주 = 솜씨(탐험) + 그림자 저장 · 다음 판 그림자가 같이 내려감 · 최고 기록을 깨면 갱신 · 못 깨면 그대로(보상 X)
//   ④ 잠(날 넘김) 다섯 번 뒤 다시 타도 '처음 완주' 보상이 다시 생기지 않음 · 보상 꼬리표 = xp:chal
//   ⑤ 중급(S 눈쟁기 키) · 상급(둘째 슬로프 E · W 웅크리기) 봇 완주 · 리프트 단추로 꼭대기까지
//   ⑥ 휴대폰 폭(390 세로 · 844×390 가로) — 눈쟁기·웅크리기 단추가 점프·행동·시점 단추·작은 지도를 가리지 않음 · 화면 안 · 가림 비율 · 누르면 눈쟁기
//   ⑦ 여름 = 기문 안 보임 · E = '겨울에만' 한 줄(창 X) · 수첩 🎿 스키 기록 탭(초 숫자는 여기에만) · 페이지 오류 0
//   ⑧ 출발 준비(JUDGE-2): 때·날씨 → 눈(아침 단단 · 한낮 알맞음 · 맑은 오후 무름) · 기온 → 맞는 왁스 · 고를 때까지 출발 X(Esc = 다시 엶) · 안 맞는 왁스 = 같은 봇이 더 늦음(시간 비용) · 가로 바람 = 손 놓아도 옆으로 밀림 · 결과 창 왁스 한 줄
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) */
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  const page = async (vw, touch) => { const p = await (await b.newContext({ viewport: { width: vw[0], height: vw[1] }, hasTouch: !!touch, isMobile: !!touch })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); }); return p; };
  const kit = p => { const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent : ''; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { const dg = await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn())); if (dg) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await panel())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panel()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const boot = async () => { await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.skiC && SM_TOWN.skiC() && window.SD2 && SM_TOWN.game, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·스키 코스가 안 뜸 — ' + errs.slice(0, 4).join(' | ')); throw e; }
      await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(500);
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; SM_TOWN.rules.season('winter'); });
      await W8(1200); await closeAll(); };
    const K = () => ev(() => { const s = SM_TOWN.ski(), ux = (s.bot[0] - s.top[0]) / s.Ls, uz = (s.bot[1] - s.top[1]) / s.Ls; return { ...s, ux, uz, px: -uz, pz: ux }; });
    const at = (S, a, o) => [S.top[0] + S.ux * a + S.px * o, S.top[1] + S.uz * a + S.pz * o];
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, 600); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    const run = () => ev(() => SM_TOWN.skiC().dbg.run()), skr = () => ev(() => SM_TOWN.skr());
    // 봇: 다음 기문 가운데로 몸을 옮김 · 못 닿겠으면 눈쟁기 · 곧은 구간은 웅크리기(코스가 허락할 때만) · mode = 'bot' | 'straight' | null(손 뗌 = 키·단추가 그대로 먹음)
    const bot = mode => ev(m => { const C = SM_TOWN.skiC(); if (window.__skB) { clearInterval(window.__skB); window.__skB = 0; } if (!m) { C.inp = null; return; } C.inp = { turn: 0, pl: false, tu: false };
      window.__skB = setInterval(() => { const R = C.dbg.run(); if (!R) return; const c = C.dbg.courses().find(q => q.id === R.c), s = SM_TOWN.skr(), I = C.inp; if (!I) return; if (m === 'straight') { I.turn = 0; return; }
        const g = c.g[R.k]; if (!g) { I.turn = 0; I.pl = false; I.tu = false; return; } const v = Math.max(1, s.v), d = g.o - s.lat, need = Math.abs(d) - (c.w / 2 - 0.7), tt = Math.max(0.05, (g.a - s.a) / v), vl = 4.2 * 8 / (v + 4);
        I.turn = Math.abs(d) > 0.25 ? Math.sign(d) : 0; I.pl = !!c.pl && need > vl * tt * 0.8; const g2 = c.g[R.k + 1]; I.tu = !!c.tu && !I.pl && need <= 0 && (!g2 || Math.abs(g2.o - s.lat) < c.w / 2 - 0.5); }, 16); }, mode);
    const wax = (bad) => ev(b9 => { const P9 = SM_TOWN.skiC().dbg.prep(); if (!P9 || P9.ph !== 'prep') return null; const k = b9 ? (P9.ok === 'cold' ? 'warm' : 'cold') : P9.ok, el = document.querySelector('.twn-p button[data-wax="' + k + '"]'); if (el) el.click(); return el ? k : null; }, !!bad);   /* JUDGE-2 출발 준비 창 = 맞는(또는 일부러 틀린) 왁스 */
    const POP = new Set(), popOff = async () => { const t = await panel(); const r = t && (await run()); if (r && r.ph === 'prep') { await wax(false); return; } if (r) { POP.add(t.replace(/\s+/g, ' ').slice(0, 40)); await closeAll(); } };   /* 판 도중 다른 창(레벨업 등) = 판이 멈춤 → 닫으면 이어 탐 */
    const waitRun = async (ms = 40000) => { const t0 = Date.now(); let last = null; while (Date.now() - t0 < ms) { await popOff(); const r = await run(); if (r) last = r; else if (last) return last; await W8(100); } return last; };
    const start = async (ci, bad) => { await closeAll(); await ev(ci => SM_TOWN.skiC().dbg.go(ci), ci); await W8(250); await wax(bad); await W8(100); return run(); };
    return { ev, W8, panel, closeAll, boot, K, at, tp, run, skr, bot, waitRun, start, popOff, POP, wax }; };
  try { const p = await page([1280, 720]), X = kit(p), { ev, W8, panel, closeAll } = X; await X.boot();
    const S = await X.K(); console.log('  스키장 Ls ' + S.Ls + ' · 둘째 슬로프 ' + S.oB + ' · 리프트 ' + S.oL);
    // ① 출발 창
    console.log('① 출발 창 · 기문');
    { const [x, z] = X.at(S, 2.5, 0); await X.tp(x, z); await W8(900); const vis0 = await ev(() => SM_TOWN.skiC().dbg.vis()); await p.keyboard.press('KeyE'); await W8(700); const t = await panel();
      ok(/기문 코스/.test(t) && /초급/.test(t) && /🔒\s*중급/.test(t), '꼭대기 E = 출발 창(초급 열림 · 중급 잠김): ' + t.slice(0, 90)); ok(/빨강·파랑 깃발/.test(t), '처음 한 번 = 하는 법 세 줄');
      ok(vis0.gates && /c1/.test(vis0.shown), '겨울 · 가까이 = 기문 인스턴스 보임(' + vis0.shown + ')');
      await ev(() => document.querySelector('.twn-p button[data-lock]').click()); await W8(300); ok(!!(await panel()), '잠긴 코스 = 창 그대로 + 한 줄');
      await ev(() => document.querySelector('.twn-p button[data-c="0"]').click()); await W8(300); const r0 = await X.run(), tp9 = await panel(); ok(r0 && r0.c === 'c1' && r0.ph === 'prep' && /기온/.test(tp9) && /왁스/.test(tp9), '초급 누름 = 출발 준비 창(눈·기온·바람 → 왁스): ' + tp9.replace(/\s+/g, ' ').slice(0, 90));
      await p.keyboard.press('Escape'); await W8(900); const r1 = await X.run(); ok(r1 && r1.ph === 'prep' && /왁스/.test(await panel()), 'Esc로 닫아도 = 고를 때까지 출발 X(창 다시 엶)');
      await X.wax(false); await W8(200); const r = await X.run(); ok(r && r.c === 'c1' && r.ph === 'count', '왁스 고름 = 3·2·1 뒤 출발(' + JSON.stringify(r) + ')'); }
    // ② 곧게만 = 놓침
    console.log('② 곧게만 내려가기');
    { await X.bot('straight'); const r = await X.waitRun(); await W8(500); const t = await panel(), st = await ev(() => SM_TOWN.skiC().dbg.st());
      ok(r && r.miss > 0, '곧게만 = 기문 ' + (r && r.miss) + '개 놓침(통과 ' + (r && r.pass) + ')'); ok(/연습 판/.test(t) && /놓쳤어요/.test(t), '결과 창 = 연습 판 + 놓친 수 한 줄'); ok(!st.c1 || st.c1.best == null, '놓친 판은 내 기록에 안 오름');
      ok(!/[0-9]+\.[0-9]초/.test(t), '결과 창에 초 숫자 X(차이만)'); await closeAll(); }
    // ③ 초급 봇 3판
    console.log('③ 초급 봇 · 그림자 · 최고 기록');
    const xp = () => ev(() => (SM_TOWN.game().S.skill || {}).explore || 0);
    { let done = 0, n = 0; const x0 = await xp(); for (; n < 3 && !done; n++) { await X.start(0); await X.bot('bot'); const r = await X.waitRun(); await W8(500); if (r && r.pass === 5) done = n + 1; console.log('    판 ' + (n + 1) + ': ' + JSON.stringify(r)); await closeAll(); }
      const st = await ev(() => SM_TOWN.skiC().dbg.st()), x1 = await xp(), C = await ev(() => SM_TOWN.skiC().dbg.courses());
      ok(done > 0, '초급 봇이 ' + n + '판 안에 완주(' + done + '판째)'); ok(st.c1 && st.c1.best > 0 && st.ghost && st.ghost.c1 && st.ghost.c1.length > 20, '내 최고 ' + (st.c1 && st.c1.best) + '초 · 그림자 ' + (st.ghost && st.ghost.c1 && st.ghost.c1.length / 2) + '칸');
      ok(x1 - x0 >= 3, '처음 완주 = 탐험 솜씨 +' + (x1 - x0)); ok(C[1].open && !C[2].open, '초급 완주 → 중급 열림 · 상급은 아직');
      // 같은 실력 다시(그림자 · 못 깨면 그대로)
      const b0 = st.c1.best; await X.start(0); await X.bot('bot'); let gv = false; for (let i = 0; i < 40; i++) { const r = await X.run(); if (r && r.ph === 'go' && r.ghV) { gv = true; break; } await W8(100); } const r2 = await X.waitRun(); await W8(500); const t2 = await panel(), st2 = await ev(() => SM_TOWN.skiC().dbg.st()), x2 = await xp();
      ok(gv, '다음 판 = 그림자 스키어가 같이 내려감'); ok(/내 최고보다/.test(t2) || /새 내 기록/.test(t2), '결과 창 = 내 최고와의 차이: ' + t2.replace(/\s+/g, ' ').slice(0, 80));
      ok(st2.c1.best <= b0, '최고 기록은 더 나쁘게 안 바뀜(' + b0 + ' → ' + st2.c1.best + ')'); await closeAll();
      // 옛 기록이 느렸다면 = 갱신
      await ev(() => { const S9 = SM_TOWN.game().S.xp.ski; S9.c1.best += 4; S9.ghost.c1 = S9.ghost.c1.slice(0, 20); }); const b1 = (await ev(() => SM_TOWN.game().S.xp.ski.c1.best)), x3 = await xp();
      await X.start(0); await X.bot('bot'); await X.waitRun(); await W8(500); const t3 = await panel(), st3 = await ev(() => SM_TOWN.skiC().dbg.st()), x4 = await xp();
      ok(st3.c1.best < b1 && /새 내 기록/.test(t3), '느린 옛 기록 → 새 최고로 갱신(' + b1 + ' → ' + st3.c1.best + ')'); ok(st3.ghost.c1.length > 20, '그림자도 새 판으로 바뀜(' + st3.ghost.c1.length / 2 + '칸)'); ok(x4 - x3 === 1 && x2 === x1, '최고를 깨면 +1 · 못 깨면 0(' + (x2 - x1) + '·' + (x4 - x3) + ')'); await closeAll(); }
    // ⑧ 출발 준비 판단
    console.log('⑧ 출발 준비 — 눈·기온·바람 → 왁스');
    { const day = (m, w) => ev(([m, w]) => { SM_TOWN.game().S.min = m; SM_TOWN.rules.wx(w); return SM_TOWN.skiC().dbg.today(); }, [m, w]);
      const a = await day(9 * 60, 'clear'), b9 = await day(12 * 60, 'clear'), c = await day(15 * 60, 'clear'), d = await day(15 * 60, 'snow');
      ok(a.snow === 'hard' && a.tC <= -6 && a.wax === 'cold', '아침 = 밤새 얼어 단단 · 영하 ' + (-a.tC) + '도 → 파란 왁스'); ok(b9.snow === 'mid' && b9.wax === 'cold', '한낮 = 알맞음 · ' + b9.tC + '도 → 파란 왁스'); ok(c.snow === 'soft' && c.tC >= 1 && c.wax === 'warm', '맑은 오후 = 녹아 무름 · 영상 ' + c.tC + '도 → 빨간 왁스'); ok(d.snow === 'mid', '눈 오는 오후 = 녹지 않음(알맞음)');
      await day(15 * 60, 'clear'); await ev(() => SM_TOWN.skiC().dbg.windSet(0, 0, 0)); const T = []; for (const bad of [false, true, false]) { const r0 = await X.start(0, bad); await ev(() => SM_TOWN.skiC().dbg.windSet(0, 0, 0)); await X.bot('bot'); const r = await X.waitRun(); await W8(500); const t9 = await panel(); T.push({ bad, t: r && r.t, pass: r && r.pass, line: /왁스가 오늘 눈과 (잘 맞았|맞지 않아)/.test(t9) ? RegExp.$1 : '' }); void r0; await closeAll(); }
      console.log('    ' + JSON.stringify(T)); ok(T[1].t > T[0].t + 0.4 && T[1].t > T[2].t + 0.4, '안 맞는 왁스 = 같은 봇이 더 늦음(' + T[0].t + '·' + T[2].t + ' → ' + T[1].t + '초)'); ok(T[0].line === '잘 맞았' && T[1].line === '맞지 않아', '결과 창 = 왁스 한 줄(맞음 · 안 맞음)');
      await X.start(0); await ev(() => SM_TOWN.skiC().dbg.windSet(0.6, 0, 0.6)); await X.bot('straight'); for (let i = 0; i < 40; i++) { const r = await X.run(); if (r && r.ph === 'go' && r.t > 0.4) break; await W8(100); } const l0 = (await X.skr()).lat; await W8(1500); const l1 = (await X.skr()).lat; const vis = await ev(() => SM_TOWN.skiC().dbg.wind());
      ok(l1 - l0 > 0.5, '가로 바람 = 손 놓아도 옆으로 밀림(' + l0.toFixed(2) + ' → ' + l1.toFixed(2) + ' · 바람 ' + vis.lat + ')'); await X.waitRun(); await W8(500); await closeAll(); await ev(() => SM_TOWN.game().S.min = 10 * 60); }
    // ④ 잠 다섯 번
    console.log('④ 잠 연타');
    { const x0 = await xp(); for (let i = 0; i < 5; i++) await ev(() => { const G = SM_TOWN.game(); G.S.day++; }); await X.start(0); await X.bot('bot'); await X.waitRun(); await W8(500); await closeAll(); const x1 = await xp(), rw = await ev(() => JSON.stringify(SM_TOWN.game().S.rw || {}));
      ok(x1 - x0 <= 1, '잠 다섯 번 뒤 다시 완주 = 처음 완주 보상 다시 X(+' + (x1 - x0) + ' · 최고를 깼을 때만 +1)'); ok(/xp:chal/.test(rw), '보상 문 꼬리표 xp:chal'); }
    // ⑤ 중급 · 상급 · 리프트
    console.log('⑤ 중급 · 상급 · 리프트');
    { let done = 0, n = 0, plS = false; for (; n < 3 && !done; n++) { await X.start(1); await X.bot('bot'); const r = await X.waitRun(); await W8(500); plS = plS || (r && r.plT); if (r && r.pass === 7) done = n + 1; console.log('    중급 판 ' + (n + 1) + ': ' + JSON.stringify(r)); await closeAll(); }
      ok(done > 0, '중급 봇이 ' + n + '판 안에 완주(' + done + '판째)'); ok(plS, '중급 = 눈쟁기를 써야 함(봇이 씀 · ' + plS + '초)');
      // 키보드: S 꾹 = 눈쟁기 · D = 오른쪽
      await X.start(1); await X.bot(null); for (let i = 0; i < 12; i++) { await X.popOff(); await W8(200); } const a = await X.skr(); await p.keyboard.down('KeyS'); await p.keyboard.down('KeyD'); await W8(700); const r1 = await X.run(), b9 = await X.skr(); await p.keyboard.up('KeyS'); await p.keyboard.up('KeyD');
      ok(r1 && r1.pl && b9.lat > a.lat + 0.5, 'S 꾹 = 눈쟁기 켜짐 · D = 옆으로(' + a.lat + ' → ' + b9.lat + ')'); await X.waitRun(); await W8(500);
      // 리프트 단추
      const t = await panel(); ok(/리프트/.test(t), '결과 창에 리프트 단추'); await ev(() => document.querySelector('.twn-p button[data-a="again"]').click()); await W8(500); const m0 = (await X.skr()).mode; let m1 = m0; for (let i = 0; i < 40 && m1; i++) { await W8(500); m1 = (await X.skr()).mode; }
      const me = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }), dTop = Math.hypot(me[0] - S.top[0], me[1] - S.top[1]); ok(m0 === 'lift' && !m1 && dTop < 45, '리프트 타고 꼭대기 도착(' + dTop.toFixed(1) + 'm)'); await closeAll();
      // 상급 = 둘째 슬로프 E
      const C = await ev(() => SM_TOWN.skiC().dbg.courses()); ok(C[2].open && C[2].b === (S.oB ? 1 : 0), '중급 완주 → 상급 열림(둘째 슬로프)');
      if (S.oB) { const [x, z] = X.at(S, 2.5, S.oB); await X.tp(x, z); await W8(1500); await closeAll(); await p.keyboard.press('KeyE'); await W8(700); const t5 = await panel(); ok(/상급/.test(t5) && !/중급 ·/.test(t5), '둘째 슬로프 E = 상급 출발 창: ' + t5.replace(/\s+/g, ' ').slice(0, 70)); await closeAll(); }
      let d3 = 0, n3 = 0, tuS = false; for (; n3 < 3 && !d3; n3++) { await X.start(2); await X.bot('bot'); const r = await X.waitRun(); await W8(500); tuS = tuS || (r && r.tuT); if (r && r.pass === 8) d3 = n3 + 1; console.log('    상급 판 ' + (n3 + 1) + ': ' + JSON.stringify(r)); await closeAll(); }
      ok(d3 > 0, '상급 봇이 ' + n3 + '판 안에 완주'); ok(tuS > 0, '상급 = 곧은 구간에서 웅크리기(' + tuS + '초)');
      const lat3 = await ev(() => SM_TOWN.skiC().dbg.courses()[2]); ok(lat3.g.every(g => Math.abs(g.o - lat3.o0) + lat3.w / 2 <= 6.05), '상급 기문이 둘째 슬로프(폭 12m) 안'); }
    // ⑦ 수첩 · 여름
    console.log('⑦ 수첩 · 여름');
    { await ev(() => { const b9 = [...document.querySelectorAll('button')].find(q => /수첩|📒/.test(q.textContent)); void b9; }); await ev(() => SM_TOWN.skiC().openRec()); await W8(400); const t = await panel(); ok(/스키 기록/.test(t) && /[0-9]+\.[0-9]초/.test(t), '수첩 🎿 스키 기록 = 코스마다 내 최고 초(여기에만)'); ok(!/순위|등수|1등/.test(t), '순위 낱말 X');
      const tab = await ev(() => !!document.querySelector('.twn-p [data-nb]') && [...document.querySelectorAll('.twn-p [data-nb]')].some(q => /스키 기록/.test(q.textContent))); ok(tab, '수첩 탭 줄에 🎿 스키 기록'); await closeAll();
      await ev(() => SM_TOWN.rules.season('summer')); await W8(1200); await closeAll(); const [x, z] = X.at(S, 2.5, 0); await X.tp(x, z); await W8(900); const v = await ev(() => SM_TOWN.skiC().dbg.vis()); await p.keyboard.press('KeyE'); await W8(700); const t2 = await panel();
      ok(!v.gates, '여름 = 기문 안 보임'); ok(!t2 && !(await X.run()), '여름 E = 창 X · 판 X(겨울에만 한 줄)'); }
    if (X.POP.size) console.log('  (판 도중 뜬 다른 창: ' + [...X.POP].join(' / ') + ')');
    await p.close();
    // ⑥ 휴대폰
    for (const vw of [[390, 844], [844, 390]]) { console.log('⑥ 휴대폰 ' + vw.join('×')); const q = await page(vw, true), Y = kit(q); await Y.boot(); await Y.ev(() => { const S9 = SM_TOWN.game().S, X9 = S9.xp || (S9.xp = {}); X9.ski = { how: 1, c1: { best: 9, last: 9, n: 1 }, c2: { best: 12, last: 12, n: 1 } }; }); await Y.W8(300);
      await Y.ev(() => document.body.classList.add('touch')); await Y.W8(1300); await Y.start(2); await Y.W8(600);
      const R9 = await Y.ev(() => { const vis = e => { if (!e) return null; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return null; const r = e.getBoundingClientRect(); return r.width > 0 ? [r.left, r.top, r.right, r.bottom] : null; };
        const mine = [...document.querySelectorAll('.twn-ski-b')].map(vis).filter(Boolean), oth = ['#tJump', '#tAct', '#tView', '#tCrouch', '.twn-mini', '#mini', 'canvas.twn-mm'].flatMap(s => [...document.querySelectorAll(s)]).map(e => [e, vis(e)]).filter(q => q[1]), others = oth.map(q => q[1]);
        const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3], area = mine.reduce((s, r) => s + (r[2] - r[0]) * (r[3] - r[1]), 0);
        const who = oth.filter(q => mine.some(m => hit(m, q[1]))).map(q => (q[0].id || q[0].className) + ':' + q[1].map(Math.round).join(',')); return { who, mine: mine.map(r => r.map(Math.round).join(',')), n: mine.length, over: mine.some(m => others.some(o => hit(m, o))) || (mine.length > 1 && hit(mine[0], mine[1])), inV: mine.every(r => r[0] >= 0 && r[1] >= 0 && r[2] <= innerWidth && r[3] <= innerHeight), frac: area / (innerWidth * innerHeight), others: others.length }; });
      ok(R9.n === 2, '상급 판 = 터치 단추 둘(눈쟁기·웅크리기)'); ok(!R9.over && R9.inV, '단추가 점프·행동·시점·작은 지도를 안 가림 · 화면 안(견준 것 ' + R9.others + (R9.who.length ? ' · 겹침 ' + R9.who.join(' ') + ' · 내 것 ' + R9.mine.join(' ') : '') + ')'); ok(R9.frac <= 0.2, '단추 가림 ' + (R9.frac * 100).toFixed(1) + '% ≤ 20%');
      await Y.W8(1600); await Y.ev(() => { const b9 = document.querySelector('.twn-ski-b[data-k="pl"]'); b9.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await Y.W8(400); const r = await Y.run(); await Y.ev(() => { const b9 = document.querySelector('.twn-ski-b[data-k="pl"]'); b9.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); });
      ok(r && r.pl, '눈쟁기 단추 꾹 = 눈쟁기'); await Y.waitRun(); await Y.W8(400); ok(!(await Y.ev(() => document.querySelectorAll('.twn-ski-b').length)), '판이 끝나면 단추 치움'); await q.close(); }
  } catch (e) { console.log('  ✗ 예외 ' + (e && e.stack || e).toString().slice(0, 400)); fails.push('예외'); }
  ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  await b.close(); console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
