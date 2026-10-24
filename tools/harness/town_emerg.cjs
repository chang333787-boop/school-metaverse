// 🚨 긴급 출동 엔진 시험(EMERG-1 · 설계 docs/systems/town_emergency.md): node tools/harness/town_emerg.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 생김: 그날 씨앗 = 칸 둘(오전·오후) · 같은 갈래 하루 한 번 · 그때가 되면(80m 넘게 다니는 중) 내 둘레에 저절로(1초 칸) · 서 있기만 하면 안 생김 · 불도 엔진이 때를 정함
//   ② 알림: 배너 · 칩 · 빛기둥 · 위 가운데 줄(칸·방향·거리) · 장소 찾기 '지금 생긴 일'
//   ③ 👮 112 길 잃은 어린이: 경찰관 E → 아이 E → 묻기(단서 둘) → 지도에서 고르기(틀리면 아이가 단서를 다시) → 손잡고 걷기(아이가 뒤따라옴 · 자전거면 멈춤) → 보호자 = 만남 · 하트·선물·솜씨(emerg:lost)
//   ④ 결과: 다음 날 아침 소식 한 줄 · 보호자 곁에서 노는 아이(가까울 때) · 그다음다음 날 사라짐
//   ⑤ 🚑 119 넘어진 이웃(비): 둘레 보기(카메라 왼쪽·오른쪽) → 말 걸기 → 신고 창(112 = 안내 · 119 → 자리(틀리면 늦어짐) → 무슨 일) → 찬 물병 E → 발목 곁 E 꾹 → 가방 E → 구급차가 와서 섬 → 끝 창 → '미끄럼 주의' 판 이틀
//   ⑥ 더위(여름 한낮): 그늘로 부축(이웃이 뒤따라옴) → 물 → 부채 꾹 → '무더위 쉼터' 판 · ⑦ 아무도 안 오면 5분 뒤 기관이 해결(흔적 X) · ⑧ 잠 = 사건 멈춤 · 그리기 +4 이하 · 오류 0
//   ⑨ 🌲 산불 조심 감시(SMOKE-1): 비·눈 X · 바람 센 날 ↑ · 위 가운데 줄 = 바람 방위 + 연기 쪽(거리 X) · 바람을 거슬러 가면 가까워짐 · 60m 빛기둥 · 이웃 고르기 · 물 붓기 꾹 · 119 칸 · 판·아침 소식 · 아무도 안 가면 감시원
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const dlgClick = async (re) => { for (let i = 0; i < 24; i++) { await W8(260); const r = await ev(re => { const B = [...document.querySelectorAll('.twn-dlg .ch button')]; if (B.length) { const o = re ? B.find(b9 => new RegExp(re).test(b9.textContent)) : null; (o || B[0]).click(); return 'ch'; } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 'dlg'; } return ''; }, re || null); if (!r && i > 2) return; } };
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (await ev(() => !!document.querySelector('.twn-dlg'))) { await dlgClick(); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const goalTx = () => ev(() => { const g = document.getElementById('hudGoal'); return g && g.style.display !== 'none' ? g.innerText : ''; });
    const I = () => ev(() => SM_TOWN.emerg().info()), E = (k, a) => ev(([k, a]) => SM_TOWN.emerg().dbg[k](a), [k, a]);
    const noPlan = () => ev(() => { const G = SM_TOWN.game().S; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });   /* 시험 차례 밖에서 저절로 생기지 않게 */
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
    const calls = () => ev(async () => { let s = 0; for (let i = 0; i < 6; i++) { await new Promise(r => requestAnimationFrame(r)); s += SD2.renderer.info.render.calls; } return Math.round(s / 6); });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.emerg && SM_TOWN.emerg() && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 9 * 60; SM_TOWN.rules.wx('clear'); });
    // ① 생김(학교 밖에서 — 학교 안에선 안 생김)
    { const R = await ev(() => SM_TOWN.schRect()); const x = (R[0] + R[2]) / 2, z = R[3] + 28; await tp(x, z); await W8(900); ok(!(await ev((xz) => SM_TOWN.inSchool(xz[0], xz[1]), [x, z])), '정문 밖 길로 나옴'); }
    const plan = await E('plan'); ok(Array.isArray(plan) && plan.length >= 1 && plan.length <= 2 && new Set(plan.map(q => q.k)).size === plan.length && plan.every(q => q.at >= 560 && q.at < 1080), '그날 씨앗 = 칸 ' + plan.length + ' (' + plan.map(q => q.k + '@' + Math.floor(q.at / 60) + ':' + String(q.at % 60).padStart(2, '0')).join(' · ') + ')');
    const c0 = await calls();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60 + 30; G.emerg.plan = [{ k: 'lost', at: G.min, until: G.min + 300, st: 0 }]; SM_TOWN.emerg().dbg.walk(0); }); await W8(2600); ok(!(await I()).ev, '서 있기만 하면 안 생김(다니는 길에 생기는 일)');
    await ev(() => SM_TOWN.emerg().dbg.walk(100)); let i0 = null; for (let i = 0; i < 10 && !(i0 && i0.ev); i++) { await W8(500); i0 = await I(); }
    ok(i0 && i0.ev && i0.ev.k === 'lost', '그때가 되면 저절로 생김(👮 길 잃은 어린이 · ' + (i0 && i0.ev ? i0.ev.cell : '-') + ')'); if (!i0 || !i0.ev) throw new Error('사건이 안 생김: ' + JSON.stringify(i0 && i0.dbg));
    // ② 알림
    const me0 = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }); const dEv = Math.round(Math.hypot(i0.ev.x - me0[0], i0.ev.z - me0[1])); ok(dEv > 30 && dEv < 260, '내 둘레 ' + dEv + 'm');
    let g = await goalTx(); ok(/칸/.test(g) && /\d+m/.test(g), '위 가운데 줄 = 칸·방향·거리 「' + g + '」'); ok(await ev(() => [...document.querySelectorAll('.gchip')].some(c => /👮/.test(c.textContent) && getComputedStyle(c).display !== 'none')), '칩 👮 (누르면 길)');
    await p.keyboard.press('KeyF'); await W8(600); ok(/지금 생긴 일/.test((await panel() || {}).t || '') && /길 잃은 어린이/.test((await panel() || {}).t || ''), '장소 찾기 맨 위 = 지금 생긴 일'); await closeAll();
    // ③ 현장: 경찰관 → 아이 → 묻기 → 고르기
    await E('near'); for (let i = 0; i < 8; i++) { await W8(400); if ((await I()).ev.st !== 'call') break; } let I1 = await I(); ok(I1.ev.st === 'cop', '도착 = 경찰관·아이 몸 · 경찰관 E'); await shot('em_lost_scene');
    const c1 = await calls(); await E('vis', false); const c1b = await calls(); await E('vis', true); ok(c1 - c1b <= 4, '사건 몸 그리기 +' + (c1 - c1b) + ' (그 자리 ' + c1b + ' → ' + c1 + ')'); void c0;
    const tpH = async re => { await closeAll(); const h = await ev(re => SD2.map.interact.list().find(h9 => !h9.off && new RegExp(re).test(h9.label)) || null, re); if (!h) return false; await tp(h.x + 0.3, h.z + 0.3); await W8(450); await p.keyboard.press('KeyE'); await W8(600); return true; };
    ok(await tpH('경찰관과'), '경찰관 E'); await dlgClick(); I1 = await I(); ok(I1.ev.st === 'ask', '경찰관 부탁 → 아이에게 묻기');
    ok(await tpH('아이에게 물어보기'), '아이 E'); let P = await panel(); ok(P && P.k === 'emlost' && /단서 수첩/.test(P.t), '묻기 창(질문 넷 · 단서 수첩)');
    await ev(() => document.querySelector('.twn-p button[data-q="tel"]').click()); await W8(300); ok(!(await ev(() => !!document.querySelector('.twn-p button[data-o]'))), '전화번호(못 씀)만으로는 고르기 안 열림');
    await ev(() => document.querySelector('.twn-p button[data-q="work"]').click()); await W8(250); await ev(() => document.querySelector('.twn-p button[data-q="dir"]').click()); await W8(400);
    P = await panel(); ok(await ev(() => document.querySelectorAll('.twn-p button[data-o]').length >= 2) && /지도/.test(P.t), '단서 둘 = 같은 창 지도에서 보호자 일터 고르기'); await shot('em_lost_ask');
    const opts = (await I()).ev.opts, par = (await I()).ev.par, wrong = opts.findIndex(k => k !== par.k), right = opts.findIndex(k => k === par.k);
    await ev(i => document.querySelector('.twn-p button[data-o="' + i + '"]').click(), wrong); await W8(300); ok(/고개를 저어요/.test((await panel() || {}).t || ''), '틀린 곳 = 아이가 단서를 다시 말함');
    const hk0 = await ev(() => JSON.stringify(SM_TOWN.game().S.hearts || {})), bag0 = await ev(() => JSON.stringify(SM_TOWN.game().S.bag || {}));
    await ev(i => document.querySelector('.twn-p button[data-o="' + i + '"]').click(), right); await W8(700); I1 = await I(); ok(I1.ev.st === 'walk', '맞는 곳 = 손잡고 걸어가기 (보호자 = ' + par.k + ')');
    // 걷기: 빨간 선을 0.8m씩 0.25초(초속 3.2m)
    const pts = await ev(() => SM_TOWN.routePts()); let maxGap = 0, bikeT = false;
    if (pts) for (let k = 1; k < pts.length && (await I()).ev && (await I()).ev.st === 'walk'; k++) { const a = pts[k - 1], c = pts[k], l = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let t = 0.8; t < l + 0.8; t += 0.8) { const u = Math.min(1, t / l); await tp(a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u); await W8(250); const q = await I(); if (!q.ev || q.ev.st !== 'walk') break; const m = await ev(() => { const m9 = SD2.map.player.pos(); return [m9.x, m9.z]; }); maxGap = Math.max(maxGap, Math.hypot(m[0] - q.ev.kid[0], m[1] - q.ev.kid[1]));
        if (!bikeT && k >= 2) { bikeT = true; await p.keyboard.press('KeyB'); await W8(1600); const qb = await I(); const gb = await goalTx(); ok(qb.ev.stop && /자전거/.test(gb), '자전거 = 아이가 멈춤 「' + gb + '」'); await p.keyboard.press('KeyB'); await W8(600); } } }
    await W8(2000); I1 = await I(); ok(maxGap < 9, '걷는 동안 아이가 뒤따라옴(가장 벌어짐 ' + maxGap.toFixed(1) + 'm)'); ok(!I1.ev || I1.ev.st === 'meet', '보호자 곁 = 만남'); await shot('em_lost_meet'); await W8(1800); await closeAll();
    I1 = await I(); const L0 = I1.S.log[0]; ok(!I1.ev && L0 && L0.k === 'lost' && L0.ok === 1 && L0.w, '끝 = 기록(보호자 자리) · 사건 치움');
    const hk1 = await ev(() => JSON.stringify(SM_TOWN.game().S.hearts || {})), bag1 = await ev(() => JSON.stringify(SM_TOWN.game().S.bag || {})); ok(hk1 !== hk0 && bag1 !== bag0, '보호자 하트 · 고마움 선물(꼬리표 emerg:lost)');
    ok(!(await ev(() => SD2.map.interact.list().some(h => !h.off && /경찰관|아이에게/.test(h.label)))), 'E 자리가 남지 않음');
    // ④ 결과: 다음 날
    const d0 = await ev(() => SM_TOWN.game().S.day); await ev(d => { SM_TOWN.game().S.day = d + 1; }, d0); await noPlan(); const nw = await ev(d => SM_TOWN.emerg().news(d), d0 + 1); ok(nw.some(q => q.k === 'lost' && /보호자/.test(q.t[0])), '다음 날 아침 소식 「' + (nw[0] ? nw[0].t[0] : '-') + '」');
    await tp(L0.w[0] + 12, L0.w[1] + 6); await W8(2600); I1 = await I(); ok(I1.kidB, '다음 날 보호자 곁에서 노는 아이'); await shot('em_lost_nextday');
    await ev(d => { SM_TOWN.game().S.day = d + 3; }, d0); await noPlan(); await W8(1500); ok(!(await I()).kidB, '사흘째엔 사라짐');
    // ⑤ 119 넘어진 이웃(비)
    await E('end', false); await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; SM_TOWN.rules.wx('rain'); }); await noPlan(); await tp(me0[0], me0[1]); await W8(800); ok(await E('spawn', 'hurt'), '🚑 넘어진 이웃 생김'); let H = await I(); ok(H.ev.v === 'slip', '비 = 미끄러짐(' + H.ev.v + ')');
    await E('near'); for (let i = 0; i < 8; i++) { await W8(400); if ((await I()).ev.st !== 'call') break; } H = await I(); ok(H.ev.st === 'look', '도착 = 둘레 보기 먼저'); await shot('em_hurt_scene');
    for (let i = 0; i < 6; i++) { await ev(() => SD2.map.player.look(-60, 0)); await W8(160); } await W8(500); for (let i = 0; i < 12; i++) { await ev(() => SD2.map.player.look(60, 0)); await W8(160); } await W8(700); H = await I(); ok(H.ev.st === 'talk', '카메라를 왼쪽·오른쪽으로 = 둘레 보기 끝 (' + JSON.stringify(H.ev.look) + ')'); if (H.ev.st === 'look') await E('lookDone');
    ok(await tpH('괜찮으세요'), '“괜찮으세요?” E'); await dlgClick(); for (let i = 0; i < 10 && !(await panel()); i++) await W8(300); P = await panel(); ok(P && P.k === 'emcall', '119 신고 창 (' + JSON.stringify((await I()).ev && (await I()).ev.st) + ')'); if (!P) throw new Error('신고 창 X · 오류 ' + errs.join(' | '));
    { const t0 = (await I()).ev.t; await W8(2300); ok((await I()).ev.t === t0, '신고 창이 열린 동안 = 사건 시간 멈춤'); await closeAll(); await W8(1600); H = await I(); ok(H.ev.st === 'phone' && H.ev.hots.some(l => /다시 신고/.test(l)), '신고 창을 닫아도 = 「119에 다시 신고하기」 E (' + JSON.stringify(H.ev.hots) + ')'); ok(await tpH('다시 신고'), '다시 신고 E'); for (let i = 0; i < 8 && !(await panel()); i++) await W8(300); P = await panel(); ok(P && P.k === 'emcall', '119 신고 창 다시 열림'); if (!P) throw new Error('다시 신고 창 X'); }   /* SAVE-2(코덱스 10-24 town_emerg.js 228·143) */
    const dial = async s => { for (const k of s) { await ev(k => { const b9 = [...document.querySelectorAll('.twn-p button[data-k]')].find(x => x.dataset.k === k); if (b9) b9.click(); }, k); await W8(120); } };
    await dial(['1', '1', '2', '📞']); ok(/112는 경찰/.test((await panel() || {}).t || ''), '112 = 경찰이라고 안내'); await dial(['1', '1', '9', '📞']); await W8(300); P = await panel(); ok(/어디세요/.test(P.t), '119 = 자리 묻기(지도 창)'); await shot('em_hurt_call');
    const cellNow = H.ev.cell; const pick = await ev(c => { const B = [...document.querySelectorAll('.twn-p button[data-at]')]; return B.map(b9 => b9.textContent); }, cellNow); const ri = pick.findIndex(t => t.startsWith(cellNow)), wi = pick.findIndex(t => !t.startsWith(cellNow));
    await ev(i => document.querySelector('.twn-p button[data-at="' + i + '"]').click(), wi); await W8(250); H = await I(); ok(H.ev.pen > 0, '틀린 자리 = 되물음 · 구급차가 늦어짐(+' + H.ev.pen + '초)');
    await ev(i => document.querySelector('.twn-p button[data-at="' + i + '"]').click(), ri); await W8(300); await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-w]')], o = B.find(b9 => /넘어져|더위/.test(b9.textContent)); if (o) o.click(); }); await W8(600); H = await I(); ok(H.ev.st === 'care', '무슨 일 = 처치 안내 · 구급차 출발');
    ok(await tpH('찬 물병'), '부른 이웃에게 찬 물병 E'); H = await I(); ok(H.ev.st === 'hold', '발목 곁 E 꾹 단계');
    await tp(H.ev.x + 0.8, H.ev.z + 0.8); await W8(300); await p.keyboard.down('KeyE'); await W8(2600); await p.keyboard.up('KeyE'); await W8(300); H = await I(); ok(H.ev.st === 'bag', 'E 꾹 2초 = 차갑게 대기 끝');
    ok(await tpH('가방으로'), '가방으로 발 받치기 E'); H = await I(); ok(H.ev.st === 'wait' && H.ev.care >= 2, '처치 끝 = 구급차 기다리기');
    await E('eta', 10); for (let i = 0; i < 40; i++) { await W8(500); H = await I(); if (!H.ev || H.ev.ambIn) break; } ok(H.ev && H.ev.ambIn, '구급차가 길로 와서 섬'); await shot('em_hurt_amb');
    for (let i = 0; i < 20; i++) { await W8(500); if (await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 && P9.dataset.k === 'emend'; })) break; } P = await panel(); ok(P && P.k === 'emend' && /배운 것/.test(P.t), '끝 창(배운 것 셋)'); await closeAll();
    for (let i = 0; i < 12; i++) { await W8(500); if (!(await I()).ev) break; } H = await I(); ok(!H.ev && H.S.log[0].k === 'hurt' && H.S.log[0].sign === 'slip' && H.marks >= 1, '「미끄럼 주의」 판이 그 자리에(흔적 ' + H.marks + ')'); await tp(H.S.log[0].x + 5, H.S.log[0].z + 3); await W8(1200); await shot('em_hurt_sign');
    // ⑥ 더위
    await ev(() => { SM_TOWN.rules.season('summer'); SM_TOWN.rules.wx('clear'); SM_TOWN.game().S.min = 13 * 60; }); await tp(me0[0], me0[1]); await W8(1200); const sp6 = await E('spawn', 'hurt'); H = await I();
    if (sp6 && H.ev && H.ev.v === 'heat') { ok(!!H.ev.shade, '여름 한낮 = 더위 먹은 이웃 · 그늘 자리'); await E('near'); for (let i = 0; i < 8; i++) { await W8(400); if ((await I()).ev.st !== 'call') break; } await E('lookDone'); await W8(300); await E('callDone'); await W8(500); H = await I(); ok(H.ev.st === 'care', '그늘로 부축하기');
      const sh = H.ev.shade, st0 = [H.ev.x, H.ev.z], n9 = Math.ceil(Math.hypot(sh[0] - st0[0], sh[1] - st0[1]) / 0.7); for (let k = 1; k <= n9 + 4; k++) { const u = Math.min(1, k / n9); await tp(st0[0] + (sh[0] - st0[0]) * u + 0.6, st0[1] + (sh[1] - st0[1]) * u + 0.6); await W8(260); if ((await I()).ev.st !== 'care') break; }
      await W8(1300); H = await I(); ok(H.ev && H.ev.st === 'drink', '이웃이 뒤따라와 그늘에 앉음'); if (H.ev && H.ev.st === 'drink') { await tpH('물 마시게'); await tp(H.ev.x + 0.8, H.ev.z + 0.8); await W8(200); await p.keyboard.down('KeyE'); await W8(2500); await p.keyboard.up('KeyE'); await W8(300); H = await I(); ok(H.ev.st === 'wait', '물 → 부채 꾹 = 처치 끝'); }
      await E('eta', 1); for (let i = 0; i < 50; i++) { await W8(500); if (!(await I()).ev) break; } await closeAll(); H = await I(); ok(H.S.log[0].sign === 'shade', '「무더위 쉼터」 판'); }
    else console.log('    (이 마을·자리에서 더위 사건 = ' + (H.ev ? H.ev.v : '안 생김') + ' — 건너뜀)'), sp6 && await E('end', false);
    // ⑦ 아무도 안 옴 · ⑧ 잠
    await ev(() => { SM_TOWN.rules.wx('clear'); SM_TOWN.game().S.min = 11 * 60; }); await tp(me0[0], me0[1]); await W8(800); await E('spawn', 'lost'); const nlog = (await I()).S.log.length; await E('late'); await W8(1500); H = await I(); ok(!H.ev && H.S.log[0].ok === 0 && H.S.log.length === nlog + 1, '아무도 안 오면 경찰관이 해결(흔적 X)');
    await E('spawn', 'lost'); await ev(() => SM_TOWN.sleep()); await W8(2500); await closeAll(); ok(!(await I()).ev, '잠 = 사건 멈춤');
    // ⑨ 🌲 산불 조심 감시(SMOKE-1): 생김 조건(비·눈 X · 바람 센 날 ↑) · 바람 방위 줄(거리 X) · 거슬러 가면 가까워짐 · 60m 빛기둥 · 고르기 · 꾹 · 119 칸 · 판·소식 · 아무도 안 가면 감시원
    { const Wt = await ev(() => { const R = SM_TOWN.emerg().dbg; return [R.w('smoke', { wx: 'rain', sea: 'spring', windy: true }), R.w('smoke', { wx: 'snow', sea: 'winter', windy: true }), R.w('smoke', { wx: 'clear', sea: 'spring', windy: true }), R.w('smoke', { wx: 'clear', sea: 'spring', windy: false }), R.w('smoke', { wx: 'clear', sea: 'summer', windy: false })]; });
      ok(Wt[0] === 0 && Wt[1] === 0 && Wt[2] > Wt[3] && Wt[3] > Wt[4], '산불 감시 무게: 비·눈 0 · 바람 센 날 ↑ · 봄 > 여름 (' + Wt.map(v => +v.toFixed(2)).join(' · ') + ')');
      const dS = await ev(() => SM_TOWN.game().S.day); await ev(() => SM_TOWN.rules.wx('rain')); let rainSm = 0; for (let k = 0; k < 12; k++) { await ev(d => { SM_TOWN.game().S.day = d; }, dS + k); const pl = await E('plan'); if (pl.some(q => q.k === 'smoke')) rainSm++; }
      await ev(d => { SM_TOWN.game().S.day = d; }, dS); ok(rainSm === 0, '비 오는 날 열이틀 = 산불 감시 칸 0'); ok(!(await E('spawn', 'smoke')), '비 오는 날 = 산불 감시 안 생김');
      await ev(() => { SM_TOWN.rules.wx('clear'); SM_TOWN.game().S.min = 11 * 60; }); await noPlan();
      const nS = await E('sites'); ok(nS > 0, '산·숲 가장자리 밭가 자리 ' + nS + '곳'); const Wd = await E('wind'); let got = false;
      for (let t = 0; t < 14 && !got && nS; t++) { const s = await E('site', Math.floor(t * nS / 14)); const px = s[0] + Wd.x * 200, pz = s[1] + Wd.z * 200; await tp(px, pz); await W8(500); if (await E('spawn', 'smoke')) got = true; }
      ok(got, '🌲 산불 감시 생김(바람 아래쪽 200m에서)'); if (!got) throw new Error('산불 감시 안 생김 ' + JSON.stringify((await I()).dbg.slice(-4)));
      await W8(900); let Sm = await I(); g = await goalTx(); ok(/바람은 .+쪽에서 불어와요/.test(g) && /연기는 .+쪽/.test(g) && !/\d+m/.test(g), '위 가운데 줄 = 바람 방위 + 연기 쪽 방위(거리 X) 「' + g + '」');
      ok(!Sm.ev.mk && Sm.ev.smk, '처음엔 빛기둥 X · 하늘에 연기'); ok(Sm.ev.al > 0, '연기 시작 자리 = 바람이 불어오는 쪽(al ' + Sm.ev.al + ')'); await shot('em_smoke_far');
      const cS = await calls(); await E('vis', false); const cS0 = await calls(); await E('vis', true); ok(cS - cS0 <= 4, '산불 감시 그리기 +' + (cS - cS0));
      const meS = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }), d0s = Math.hypot(Sm.ev.x - meS[0], Sm.ev.z - meS[1]); await tp(meS[0] - Sm.ev.W.x * 30, meS[1] - Sm.ev.W.z * 30); await W8(700);
      const meS2 = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }), d1s = Math.hypot(Sm.ev.x - meS2[0], Sm.ev.z - meS2[1]); ok(d1s < d0s - 10, '바람을 거슬러 30m = 연기 자리가 가까워짐(' + Math.round(d0s) + ' → ' + Math.round(d1s) + 'm)');
      for (let k = 0; k < 30; k++) { const m = await ev(() => { const m9 = SD2.map.player.pos(); return [m9.x, m9.z]; }), dx = Sm.ev.x - m[0], dz = Sm.ev.z - m[1], l = Math.hypot(dx, dz); if (l < 45) break; await tp(m[0] + dx / l * 20, m[1] + dz / l * 20); await W8(450); }
      await W8(1300); Sm = await I(); g = await goalTx(); ok(Sm.ev.mk && /\d+m/.test(g), '60m 안 = 주황 빛기둥 · 거리 「' + g + '」');
      await E('near'); for (let i = 0; i < 8; i++) { await W8(400); if ((await I()).ev.st !== 'call') break; } Sm = await I(); ok(Sm.ev.st === 'talk', '도착 = 이웃 곁 불씨 · 말 걸기'); await shot('em_smoke_scene');
      ok(await tpH('이웃에게 말 걸기'), '이웃 E'); await dlgClick('다 타면'); Sm = await I(); ok(Sm.ev.tries === 1 && Sm.ev.hots.some(l => /다시 말 걸기/.test(l)), '틀린 말 = 이웃이 그대로 · 힌트 · 다시 말 걸기 E');
      ok(await tpH('다시 말 걸기'), '다시 말 걸기 E'); await dlgClick('바람이 세요'); await dlgClick(); Sm = await I(); ok(Sm.ev.st === 'hold', '바람 센 날 불씨 = 이웃이 "몰랐어요, 바로 끌게요" → 물 붓기 꾹');
      await tp(Sm.ev.x + 0.8, Sm.ev.z + 0.8); await W8(300); await p.keyboard.down('KeyE'); await W8(2600); await p.keyboard.up('KeyE'); await W8(500); Sm = await I(); P = await panel(); ok(Sm.ev.st === 'phone' && Sm.ev.out && P && P.k === 'emcall', '물 붓기 꾹 2초 = 불씨 꺼짐 → 119 신고 창');
      await dial(['1', '1', '9', '📞']); await W8(300); P = await panel(); ok(/어디세요/.test(P.t), '119 = 칸 묻기(지도)');
      { const B = await ev(() => [...document.querySelectorAll('.twn-p button[data-at]')].map(b9 => b9.textContent)), ri2 = B.findIndex(t => t.startsWith(Sm.ev.cell)); await ev(i => document.querySelector('.twn-p button[data-at="' + i + '"]').click(), ri2); await W8(300); }
      const xp0 = await ev(() => SM_TOWN.skills().xp.explore || 0); await ev(() => { const o = [...document.querySelectorAll('.twn-p button[data-w]')].find(b9 => /불씨/.test(b9.textContent)); if (o) o.click(); }); await W8(400);
      for (let i = 0; i < 12; i++) { await W8(400); if (await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 && P9.dataset.k === 'emend'; })) break; } P = await panel(); ok(P && P.k === 'emend' && /배운 것/.test(P.t) && /바람/.test(P.t) && /119/.test(P.t), '끝 창(오늘 배운 것 둘)'); await shot('em_smoke_end'); await closeAll();
      for (let i = 0; i < 8; i++) { await W8(400); if (!(await I()).ev) break; } Sm = await I(); const xp1 = await ev(() => SM_TOWN.skills().xp.explore || 0);
      ok(!Sm.ev && Sm.S.log[0].k === 'smoke' && Sm.S.log[0].sign === 'fire' && Sm.marks >= 1, '「산불 조심」 판이 그 자리에(흔적 ' + Sm.marks + ')'); ok(xp1 > xp0, '솜씨 +' + (xp1 - xp0) + '(꼬리표 emerg:smoke)');
      const dN = await ev(() => SM_TOWN.game().S.day); await ev(d => { SM_TOWN.game().S.day = d + 1; }, dN); await noPlan(); const nwS = await ev(d => SM_TOWN.emerg().news(d), dN + 1); ok(nwS.some(q => q.k === 'smoke' && /산불/.test(q.t[0])), '다음 날 아침 소식 「' + ((nwS.find(q => q.k === 'smoke') || { t: ['-'] }).t[0]) + '」');
      await W8(1500); ok((await I()).marks >= 1, '다음 날에도 판'); await tp(Sm.S.log[0].x + 5, Sm.S.log[0].z + 3); await W8(1200); await shot('em_smoke_sign');
      await tp(meS[0], meS[1]); await W8(600); if (await E('spawn', 'smoke')) { const nl = (await I()).S.log.length; await E('late'); await W8(1500); Sm = await I(); ok(!Sm.ev && Sm.S.log[0].k === 'smoke' && Sm.S.log[0].ok === 0 && Sm.S.log.length === Math.min(10, nl + 1), '아무도 안 가면 산불 감시원이 끔(흔적 X)'); } else console.log('    (두 번째 산불 감시 자리 없음 — 늦음 시험 건너뜀)');
      await ev(d => { SM_TOWN.game().S.day = d; }, dN); await noPlan(); }
    // 불도 엔진이 때를 정함
    await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; G.jobs = G.jobs || {}; delete G.jobs.fireNo; delete G.jobs.fireDay; G.emerg.d = G.day; G.emerg.plan = [{ k: 'fire', at: G.min, until: G.min + 200, st: 0 }]; SM_TOWN.emerg().dbg.walk(100); }); await tp(me0[0], me0[1]); let fz = null; for (let i = 0; i < 10 && !fz; i++) { await W8(500); fz = await ev(() => SM_TOWN.jobs().fire); } await closeAll();
    ok(!!fz, '그날 칸이 불이면 엔진이 불 사건을 띄움'); await ev(() => SM_TOWN.jobs().abort());
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); try { console.log('    info ' + JSON.stringify(await p.evaluate(() => SM_TOWN.emerg().info().ev))); } catch (e2) { /* 페이지 없음 */ } } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
