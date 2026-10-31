// 🔁 엔딩 뒤 고리 시험(AFTER-1 · v2/games/town_after.js · town_feast.js · town_season.js · town_story.js yearEnd): node tools/harness/town_after.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   엔딩 판(이야기 c5 끝) 저장으로 시작해서
//   ① 잔치 둘째 판 = 지난 잔치 결과를 이어받음(두 단계 넘게 세운 갈래 = 첫 물건이 남고 보탬 한 단계 · 기념물 · 손님 동네 · 손님 물건 드리기 = 손님맞이) · 셋째 판 = 기념물 둘 · 손님이 바뀜
//   ② 두 번째 해 계절 행사 = 해 셈 · 안내판에 지난해 기록·올해 목표·사실 한 줄(숫자 X) · 추석 송편 넷 · 단오를 끝내면 지난해와 견준 배너 · 기록에 해·다시 고른 수
//   ③ 동네 교류 의뢰 하나 끝까지(본부 게시판 카드 → 맡기 → A → 고르기(틀림 한 번) → B → 고르기 → C → B → A) · 세 동네가 서로 다름 · 가방 물건 그대로 · 잔치 손님맞이 보탬
//   ④ 장인 칭호 = 사다리 기록 → 칭호 · 일터 곁 깃발(합친 상자 하나) · 그 일터 이웃 말풍선 · 솜씨 창 머리 칭호
//   ⑤ 한 해 돌아보기 단추 넷(잔치 · 계절 · 교류 · 칭호)이 누르면 창을 엶 · 글에 % 0 · ⑥ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); }, T0 = Date.now();
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  try { const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|after trade|after title|feast tap/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.feast && SM_TOWN.feast() && SM_TOWN.after && SM_TOWN.after() && SM_TOWN.seasonEv && SM_TOWN.seasonEv(), null, { timeout: 240000 }); await W8(1500);
    const closeAll = async () => { for (let i = 0; i < 8; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(200); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(200); } } };
    const shot = async n => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('  📷 ' + SHOTS + '/' + n + '.png'); };
    const ban = () => ev(() => (document.getElementById('hudBan') || {}).textContent || '');
    const tp = async (x, z) => { await ev(([x, z]) => SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]), [x, z]); await W8(150); };
    const look = async (n, P, T) => { if (!SHOTS) return; await closeAll(); await ev(([P, T]) => { SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); SD2.map.player.face(Math.atan2(T[0] - P[0], -(T[1] - P[1])) * 180 / Math.PI); }, [P, T]); await W8(2400); await shot(n); };
    const F = () => ev(() => SM_TOWN.feast().info()), AF = () => ev(() => SM_TOWN.after().info()), SI = () => ev(() => SM_TOWN.seasonEv().info());
    const fsec = async (n = 2) => { for (let i = 0; i < n; i++) { await closeAll(); await ev(() => SM_TOWN.feast().sec(true)); await W8(80); } };
    // ⓪ 엔딩 판 저장(이야기 c5 끝 · 달력 켬 · 낮)
    await closeAll(); await ev(() => { const G = SM_TOWN.game(), S = G.S; S.cal = { d0: 1, on: true, s: 'now' }; S.min = 10 * 60; S.jobs = S.jobs || {}; S.jobs.fireNo = 9999; S.story = S.story || {}; S.story.p0auto = 1; S.story.done = Object.assign(S.story.done || {}, { p0: { d: 1 }, c5: { d: S.day } }); SM_TOWN.weather('clear'); G.mark(); }); await W8(400);
    ok(await ev(() => SM_TOWN.after().info().end), '엔딩 판 = 이야기를 다 마침(c5)');

    // ① 잔치 둘째 판 — 첫 잔치 결과: 음식 셋 · 꾸미기 둘 · 공연 하나 · 손님맞이 0 · 안전 셋
    await fsec(2); let I = await F(); const fd0 = I.fd;
    await ev(fd => { const G = SM_TOWN.game(), s = G.S.feast; G.S.day = fd; s.lv = { food: 6, deco: 4, show: 2, guest: 0, safe: 6 }; G.mark(); }, fd0); await fsec(2);
    await ev(fd => { const G = SM_TOWN.game(); G.S.day = fd + 1; G.S.min = 8 * 60; G.mark(); }, fd0); await fsec(3); I = await F();
    console.log('  둘째 잔치: ' + JSON.stringify({ n: I.n, fd: I.fd, th: I.th, lv: I.lv, keep: I.keep, gu: I.gu, mem: I.mem, vis: I.vis.filter(v => /:|mem/.test(v)) }));
    ok(I.n === 1 && I.fd === fd0 + 14, '둘째 잔치 = 두 이레 뒤(n 1)');
    ok(I.lv.food === 2 && I.lv.deco === 2 && I.lv.safe === 2 && I.lv.show === 0 && I.lv.guest === 0, '두 단계 넘게 세운 갈래(음식·꾸미기·안전) = 보탬 한 단계에서 시작 · 한 단계뿐인 공연·없던 손님맞이 = 처음부터 ' + JSON.stringify(I.lv));
    ok(['food:0', 'deco:0', 'safe:0'].every(v => I.vis.includes(v)) && !I.vis.includes('show:0') && !I.vis.some(v => /^(food|deco|safe):[12]/.test(v)), '첫 물건(긴 잔칫상 · 현수막 · 구급함)만 잔치 마당에 남음');
    ok(I.mem.length === 1 && I.mem[0] === 'tree' && I.vis.includes('mem') && I.vat.mem && I.vat.mem[0][3], '첫 잔치 기념물 = 기념 나무(잔치 마당에 그려짐)');
    ok(!!I.gu && I.past[0].ks === 'tree', '손님 동네 = ' + I.gu + ' · 지난 잔치 기록에 기념물');
    const nw = await ev(d => SM_TOWN.feast().news(d), fd0 + 1); ok(nw[0] && /기념 나무/.test(nw[0].t[0]) && /손님은/.test(nw[0].t[0]), '아침 소식 = 「' + (nw[0] && nw[0].t[0]) + '」');
    const like = await ev(() => { const M = { 바다: '🍄', 산: '🧂', 들: '🌿', 강: '🍯', 시내: '🍐', 관광: '🍓' }; return M[SM_TOWN.feast().info().gu]; });
    await ev(e => { const G = SM_TOWN.game(); G.S.bag[e] = 1; G.mark(); }, like); await ev(() => { const P = SM_TOWN.feast().dbg.at(-6.5, 10.4); SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); });
    await closeAll(); await ev(() => SM_TOWN.feast().open(true)); await W8(300);
    const FP = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? { aft: (P9.querySelector('.fst-after') || {}).textContent || '', gb: !!P9.querySelector('[data-gb="guest"]') } : null; });
    ok(FP && /그대로 남았어요/.test(FP.aft) && /기념 나무/.test(FP.aft) && /이번 손님은/.test(FP.aft) && !/\d|%/.test(FP.aft), '잔치 창 머리 = 「' + (FP && FP.aft) + '」');
    await shot('01_feast2_board');
    const g0 = (await F()).lv.guest; await ev(() => { const b9 = document.querySelector('.twn-p [data-gb="guest"]'); if (b9) b9.click(); }); await W8(300); I = await F();
    const gl = await ev(() => SM_TOWN.feast().dbg.log().filter(t => /^add guest give:guest/.test(t)));
    ok(FP && FP.gb && gl.length === 1 && I.lv.guest >= g0 + 1 && (await ev(e => SM_TOWN.game().S.bag[e] | 0, like)) === 0, '손님이 반가워하는 물건(' + like + ') 드리기 = 손님맞이 보탬 · 가방에서 빠짐 ' + JSON.stringify({ gb: FP && FP.gb, gl }));
    await closeAll();
    // 셋째 판: 둘째 잔치가 끝나면 기념물 둘 · 손님이 바뀜
    const gu1 = I.gu, fd1 = I.fd, th1 = I.th; await ev(fd => { const G = SM_TOWN.game(); G.S.day = fd + 1; G.S.min = 8 * 60; G.mark(); }, fd1); await fsec(3); I = await F();
    ok(I.n === 2 && I.mem.length === 2 && I.mem[1] === th1 && I.gu && I.gu !== gu1, '셋째 잔치 = 기념물 둘(' + I.mem.join(',') + ') · 손님 ' + gu1 + ' → ' + I.gu);
    if (SHOTS) { await ev(() => { SM_TOWN.game().S.min = 12 * 60; }); const at = (lx, lz) => ev(([a, b2]) => SM_TOWN.feast().dbg.at(a, b2), [lx, lz]);
      await look('01b_keep_tree', await at(-4.6, -3.4), await at(-8.6, -8.0)); await look('01c_keep_second', await at(4.4, -3.6), await at(8.2, -8.4)); }

    // ② 두 번째 해 계절 행사
    const D = (k, ...a) => ev(([k, a]) => SM_TOWN.seasonEv().dbg[k](...a), [k, a]);
    const sday = async (d, m) => { await closeAll(); await ev(([d, m]) => { const G = SM_TOWN.game(); G.S.day = d; G.S.min = m; G.S.feast.fd = 900; G.mark(); }, [d, m]); for (let i = 0; i < 2; i++) { await ev(() => SM_TOWN.seasonEv().sec()); await W8(80); } await W8(600); };
    const chu1 = await D('dayOf', 'chu', 1), chu2 = await D('dayOf', 'chu', chu1 + 3), dano1 = await D('dayOf', 'dano', 1), dano2 = await D('dayOf', 'dano', dano1 + 3);
    const y1 = await ev(([a, b2]) => [SM_TOWN.seasonEv().yearOf('chu', a), SM_TOWN.seasonEv().yearOf('chu', b2)], [chu1, chu2]);
    ok(y1[0] === 1 && y1[1] === 2 && chu2 - chu1 === 28, '추석 첫 해 ' + chu1 + '일 · 두 번째 해 ' + chu2 + '일(한 바퀴 = 스무여드레)');
    await ev(([c1, d1]) => { const S = SM_TOWN.game().S; S.season = S.season || { v: 1, d: -1, id: null, st: {}, mv: {}, ann: -1, past: [] }; S.season.past = [{ id: 'chu', d: c1, ok: 1, yr: 1, wr: 2, m: 19 * 60 + 10 }, { id: 'dano', d: d1, ok: 1, yr: 1, wr: 1, m: 20 * 60 }]; SM_TOWN.game().mark(); }, [chu1, dano1]);
    await sday(chu2, 9 * 60); let S9 = await SI(); ok(S9.id === 'chu' && S9.yr === 2, '두 번째 해 추석 날 = 해 2');
    const od = await D('orders'); ok(od.length === 4, '둘째 해 추석 = 송편 이웃 넷');
    await ev(() => SM_TOWN.seasonEv().open()); await W8(300);
    const SB = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? { h: (P9.querySelector('h3') || {}).textContent, y2: (P9.querySelector('.ssn-y2') || {}).textContent || '', all: P9.textContent } : null; });
    ok(SB && /두 번째 해/.test(SB.h) && /지난해엔 저녁에 다 했어요/.test(SB.y2) && /두 번/.test(SB.y2) && /올해 목표/.test(SB.y2) && /한가위/.test(SB.y2) && /이웃 넷/.test(SB.all) && !/\d|%/.test(SB.y2), '안내판 = 「' + (SB && SB.h) + '」 · 「' + (SB && SB.y2) + '」');
    await shot('02_season_y2_board'); await closeAll();
    const cl = await ev(() => SM_TOWN.seasonEv().calLine()); ok(/두 번째 해/.test(cl), '달력 줄 = 「' + cl + '」');
    // 두 번째 해 단오를 한 번에 끝냄 → 지난해와 견준 배너 · 기록
    await sday(dano2, 10 * 60); S9 = await SI(); ok(S9.id === 'dano' && S9.yr === 2, '두 번째 해 단오 날 = 해 2');
    const far = await ev(() => { const P = SM_TOWN.seasonEv().dbg.at(-8, 6); return P; }); await tp(far[0], far[1]);
    const cpk = (await SI()).st.cpk; await D('q', String(cpk)); await D('use', 'cp'); await W8(250); await D('q', 'ok'); await D('use', 'cake'); await W8(250); await D('q', 'b'); await D('use', 'ring'); await W8(900);
    S9 = await SI(); const b2 = await ban(), lastP = S9.past[S9.past.length - 1] || {};
    ok(S9.st.done === 1 && lastP.id === 'dano' && lastP.yr === 2 && lastP.wr === 0, '단오 다 함 → 기록 ' + JSON.stringify(lastP));
    ok(/두 번째 해 단오/.test(b2) && /지난해보다 다시 고른 것이 줄었어요/.test(b2), '견준 배너 = 「' + b2 + '」');

    // ③ 동네 교류 의뢰 하나 끝까지
    await closeAll(); await ev(() => { const G = SM_TOWN.game(); G.S.min = 10 * 60; G.S.feast.fd = G.S.day + 5; G.S.feast.d0 = G.S.day - 1; G.mark(); }); await fsec(1);
    console.log('  동네 일꾼: ' + JSON.stringify(await ev(() => SM_TOWN.after().dbg.chain())));
    await ev(() => SM_TOWN.after().dbg.gen()); let A9 = await AF(); const t0 = A9.tr; console.log('  의뢰: ' + JSON.stringify({ A: t0.A, B: t0.B, C: t0.C, a: t0.a, b: t0.b, c: t0.c, ph: t0.ph }));
    ok(t0.ph === 0 && t0.A && t0.B && t0.C && new Set([t0.A.r, t0.B.r, t0.C.r]).size === 3 && new Set([t0.a, t0.b, t0.c]).size === 3, '의뢰 = 서로 다른 세 동네(' + [t0.A && t0.A.r, t0.B && t0.B.r, t0.C && t0.C.r].join(' · ') + ') · 물건 셋(' + [t0.a, t0.b, t0.c].join('') + ')');
    const bag0 = await ev(es => Object.fromEntries(es.map(e => [e, SM_TOWN.game().S.bag[e] | 0])), [t0.a, t0.b, t0.c]), m0 = await ev(() => SM_TOWN.game().S.money), gl0 = (await F()).lv.guest;
    await ev(() => SM_TOWN.hub('board')); await W8(400);
    const BD = await ev(() => { const P9 = document.querySelector('.twn-p'); const c9 = P9 && P9.querySelector('[data-trd]'); return c9 ? { t: c9.textContent, btn: !!c9.querySelector('[data-rq="100"]') } : null; });
    ok(BD && BD.btn && /동네 교류/.test(BD.t), '본부 게시판 = 동네 교류 카드 「' + (BD && BD.t.slice(0, 60)) + '」');
    await shot('03_trade_board');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-rq="100"]'); if (b9) b9.click(); }); await W8(400); A9 = await AF();
    ok(A9.tr.ph === 1 && /에게 가요/.test(A9.chip), '맡기 = 첫 단계 · 칩 「' + A9.chip + '」');
    const near = async () => { const q = await ev(() => SM_TOWN.after().dbg.tgt()); if (!q) return false; await closeAll(); await tp(q[0] + 0.5, q[1] + 0.3); for (let i = 0; i < 4; i++) { await ev(() => SM_TOWN.after().sec()); await W8(250); } console.log('    곁: ' + JSON.stringify(await ev(() => SM_TOWN.after().dbg.why()))); return true; };
    const wrongR = await ev(() => { const t = SM_TOWN.after().info().tr, R = SM_TOWN.after().dbg.chain().map(s => s.split(':')[0]); return R.find(r => r !== t.B.r && r !== t.A.r) || R.find(r => r !== t.B.r); });
    await ev(([w, r]) => SM_TOWN.after().dbg.q('ok', w, 'x', r), [wrongR, t0.B.r]); await near(); await W8(500); A9 = await AF();
    ok(A9.tr.ph === 3 && A9.tr.wr === 1, 'A 곁 = 부탁 듣고 물건 받기 → 고르기(틀림 한 번 · 그 동네 일 한 줄) → 맞힘 = B로 ' + JSON.stringify({ ph: A9.tr.ph, wr: A9.tr.wr }));
    ok((await ev(e => SM_TOWN.game().S.bag[e] | 0, t0.a)) === bag0[t0.a] + 1, '부탁한 이웃이 자기 동네 물건(' + t0.a + ')을 줌');
    await ev(r => SM_TOWN.after().dbg.q('x', r), t0.C.r); await near(); await W8(500); A9 = await AF(); ok(A9.tr.ph === 5, 'B 곁 = 오늘 필요한 것(' + t0.c + ') 듣기 → 고르기 → C로 (ph ' + A9.tr.ph + ')');
    await ev(() => SM_TOWN.after().dbg.q('give')); await near(); await W8(400); A9 = await AF(); ok(A9.tr.ph === 6 && (await ev(e => SM_TOWN.game().S.bag[e] | 0, t0.c)) === bag0[t0.c] + 1, 'C 곁 = ' + t0.a + ' ↔ ' + t0.c + ' (ph ' + A9.tr.ph + ')');
    await ev(() => SM_TOWN.after().dbg.q('give')); await near(); await W8(400); A9 = await AF(); ok(A9.tr.ph === 7, 'B 곁 = ' + t0.c + ' ↔ ' + t0.b + ' (ph ' + A9.tr.ph + ')');
    await ev(() => SM_TOWN.after().dbg.q('give', 'x')); await near(); await W8(700); A9 = await AF();
    const bag1 = await ev(es => Object.fromEntries(es.map(e => [e, SM_TOWN.game().S.bag[e] | 0])), [t0.a, t0.b, t0.c]), m1 = await ev(() => SM_TOWN.game().S.money), b3 = await ban();
    ok(A9.tr.ph === 9 && A9.tr.done === 1 && A9.tr.log.length === 1 && new Set(A9.tr.log[0].r).size === 3, 'A 곁 = ' + t0.b + ' 드리기 → 끝 · 교류 기록(세 동네)');
    ok(JSON.stringify(bag1) === JSON.stringify(bag0), '가방 물건은 그대로(옮김만) ' + JSON.stringify(bag0) + ' → ' + JSON.stringify(bag1));
    ok(m1 >= m0 && /교류 끝/.test(b3), '끝 배너 「' + b3 + '」 · 돈 ' + m0 + ' → ' + m1);
    I = await F(); const fl = await ev(() => SM_TOWN.feast().dbg.log().filter(t => /^add guest trade/.test(t))); ok(fl.length === 1 && I.lv.guest >= gl0 + 1, '교류 끝 = 잔치 손님맞이 보탬 ' + JSON.stringify(fl));
    { const fw = await ev(() => SM_TOWN.after().dbg.ws().find(w => w.k === 'fisher'));   /* 부두 끝 일터 = 몸이 바로 곁까지 못 감 → 곁 판정 5.5m */
      if (fw) { await ev(w => { const A = SM_TOWN.after(), t = SM_TOWN.game().S.aft.tr; A.dbg.set({ ph: 3, B: { k: w.k, x: w.x, z: w.z, r: w.r }, b: '🐟', c: t.c === '🐟' ? '🍚' : t.c }); A.dbg.q('x', null); }, fw); await near(); const f9 = await AF(); ok(f9.tr.ph === 4, '부두 낚시 일꾼 곁 = 이야기가 열림(ph ' + f9.tr.ph + ')'); ok((await ev(() => SM_TOWN.after().dbg.tq().length)) === 0, '시험 답 줄이 비었음'); await ev(() => SM_TOWN.after().dbg.set({ ph: 9 })); } }
    await closeAll(); await ev(() => SM_TOWN.hub('board')); await W8(300); const BD2 = await ev(() => { const c9 = document.querySelector('.twn-p [data-trd]'); return c9 ? c9.textContent : ''; }); ok(/오늘 교류 의뢰를 마쳤어요/.test(BD2), '게시판 카드 = 오늘 마침'); await closeAll();
    await ev(() => SM_TOWN.after().sec()); await W8(200); ok((await AF()).chip === '' && !(await ev(() => [...document.querySelectorAll('.gchip')].some(e => /에게 가요|에게 드려요|어느 동네에서 날까요|가져가요/.test(e.textContent)))), '끝난 뒤 교류 칩이 사라짐');

    // ④ 장인 칭호
    const pickK = await ev(() => { const P = { strawberry: '🍓', shiitake: '🍄', pear: '🍐', beehive: '🍯', cabbage: '🥬', potato: '🥔', fisher: '🐟', saltpan: '🧂', clam: '🐚', seaweed: '🌿', pasture: '🥛' }, ch = SM_TOWN.after().dbg.chain().join(' '); return Object.keys(P).find(k => ch.includes(P[k])) || 'strawberry'; });
    await ev(k => { const G = SM_TOWN.game(); G.S.lad.mg[k] = { lv: 4, z: 0, n: 6, best: { lv: 4, g: 2, n: 7 }, last: { lv: 4, g: 2, n: 7 } }; G.mark(); }, pickK);
    await ev(() => SM_TOWN.after().sec()); await W8(300); A9 = await AF(); const b4 = await ban(), at = A9.ti.at['lad:' + pickK];
    ok(A9.ti.got['lad:' + pickK] != null && A9.ti.pick === 'lad:' + pickK && /장인|명수/.test(b4), '사다리 4칸 잘함 → 칭호 「' + b4 + '」');
    ok(!!at && A9.marks === 1, '장인 깃발 = 일터 곁 ' + JSON.stringify(at) + ' · 합친 상자 하나');
    const tt = await ev(() => SM_TOWN.after().title()); ok(Array.isArray(tt) && /장인|명수/.test(tt[0]), '솜씨 창 머리 칭호 = ' + JSON.stringify(tt));
    { await tp(at[0] + 1.5, at[1] + 1.5); for (let i = 0; i < 3; i++) { await ev(() => SM_TOWN.after().sec()); await W8(200); } A9 = await AF(); ok(A9.ti.gd['lad:' + pickK] != null, '그 일터 이웃이 알아봄(말풍선 · 하루 한 번)'); }
    if (SHOTS) { await ev(() => { SM_TOWN.game().S.min = 12 * 60; }); await look('04_title_flag', [at[0] + 4.5, at[1] + 2.5], at); await look('04b_title_flag_far', [at[0] - 7, at[1] - 4], at); }
    await closeAll(); await ev(() => SM_TOWN.after().titleOpen()); await W8(300); const TP = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? { rows: P9.querySelectorAll('.ttl-row').length, t: P9.textContent } : null; });
    ok(TP && TP.rows === 1 && !/%/.test(TP.t), '장인 칭호 창 = 칭호 한 줄 · % 0'); await closeAll();

    // ⑤ 한 해 돌아보기 단추 넷
    const yb = async k => { await closeAll(); await ev(() => SM_TOWN.storyList()); await W8(350); const L9 = await ev(() => { const P9 = document.querySelector('.twn-p .ye-box'); return P9 ? { n: P9.querySelectorAll('.ye-row').length, t: P9.textContent } : null; });
      await ev(() => { const t = document.getElementById('toast'); if (t) t.textContent = ''; }); await ev(k => { const b9 = document.querySelector('.twn-p [data-yb="' + k + '"]'); if (b9) b9.click(); }, k); await W8(450);
      const R = await ev(() => { const P9 = document.querySelector('.twn-p'); return { h: P9 ? (P9.querySelector('h3') || {}).textContent || '' : '', fst: !!(P9 && P9.querySelector('.fst-row')), trd: !!(P9 && P9.querySelector('[data-trd]')), ttl: !!(P9 && /장인 칭호/.test((P9.querySelector('h3') || {}).textContent || '')), toast: (document.getElementById('toast') || {}).textContent || '' }; }); return { L9, R }; };
    const Y1 = await yb('feast'); ok(Y1.L9 && Y1.L9.n === 4 && !/%/.test(Y1.L9.t), '한 해 돌아보기 = 이제 해 볼 것 넷 · % 0 「' + (Y1.L9 && Y1.L9.t.slice(0, 140)) + '」');
    await shot('05_year_end');
    ok(Y1.R.fst, '🎉 다음 잔치 단추 → 잔치 창 「' + Y1.R.h + '」');
    const Y2r = await yb('season'); ok(/계절|단오|추석|설날|김장|대보름/.test(Y2r.R.h), '🗓 계절 행사 단추 → 창 「' + Y2r.R.h + '」');
    const Y3 = await yb('board'); ok(Y3.R.trd, '🔄 동네 교류 단추 → 본부 게시판(교류 카드)');
    const Y4 = await yb('title'); ok(Y4.R.ttl, '🏅 장인 칭호 단추 → 칭호 창');
    await closeAll();
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
