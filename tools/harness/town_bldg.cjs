// 🏢 빈 건물에 할 일 시험(BLDG-1 · v2/games/town_bldg.js): node tools/harness/town_bldg.cjs [마을=ourtown] [포트=8002]
//   ① 문 이름표·J 검색에 할 일(112 · 응급 · 밥) ② 경찰서: 도운 아이 가족 인사(대화 → 게시판) · 112 연습(틀린 번호 → 되물음 · 상황 셋 · 위치) · 솜씨 · 하루 한 번
//   ③ 병원·보건소: 나은 이웃 몸 + 인사 · 응급 처치 문제 셋(틀림 → 다시) · 20:00 = 문 닫음(안 들어감) ④ 보호센터: 밥 주기(초콜릿·틀린 사료 → 까닭) → 밥그릇 참 · 다시 E = 오늘 벌써 · 다시 들어가도 참 · 다음 날 빔
//   ⑤ 방 E 자리 모두 닿음(indoor.check) · 문 E로 나가기 · 페이지 오류 0
//   ⑥ 은행(BANK-1): 문 이름표·J「저금」· 넣기(지갑 −·통장 +·한 줄)·반 넣기·꺼내기 · 살림 솜씨 하루 한 번 · 통장 판 · 7일 뒤 이자 한 줄 · 17:00 문 닫음
//   ⑦ 우체국: 창구 E = 물건 → 이웃 → 지도 보고 주소 칸(틀림 = 힌트) → 소포 값 → 저울 위 상자 · 같은 날 다시 = 한 줄 · 다음 날 아침 한 줄 → 받는 이웃 곁 = 말풍선 + 하트 · 20:00 창구 닫음(방은 들어감)
//   ⑧ BLDG-3: 영화관(시간표 · 쪽지 시각 견주기 · 표 −500 · 자리 E · 기다리기 = 시작 시각 · 다 보면 = 끝나는 시각 · 21:30 닫음) · 공장(차례 다섯 · 힌트 · 분업 물음 · 깔판 상자 · 젤리 공장 줄 · 다음 날 상자 → 가게·장터 '우리가 만든 것' 사기 · 아침 소식·일기) · 노인정(땅이름 넷 · 힌트 · 판 · 고누 창) · 박물관(옛 물건 쓰임 → 오늘날 · 금빛 표 · 솜씨 하루 한 번) · 곤충 박물관 X
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 800) } : null; });
    const dlg = () => ev(() => { const d = document.querySelector('.twn-dlg'); return d ? d.innerText.slice(0, 400) : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(300); } } };
    const BI = () => ev(() => SM_TOWN.bldg().info()), xp = k => ev(k => (SM_TOWN.skills().xp || {})[k] || 0, k);
    const said = re => ev(re => { const t9 = document.getElementById('toast'); return !!(t9 && t9.style.display !== 'none' && new RegExp(re).test(t9.textContent)); }, re);
    const waitSaid = async re => { for (let i = 0; i < 10; i++) { if (await said(re)) return true; await W8(250); } return false; };
    const tpA = a => ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, a);
    const E = async (k, want) => { const I = await BI(), h = I.cur && I.cur.extra.find(q => q.k === k); if (!h) return false; for (let t = 0; t < 3; t++) { await closeAll(); await tpA(h.at); await W8(500); await p.keyboard.press('KeyE'); await W8(600); if (!want || await want()) return true; } return false; };
    const enter = async q => { await closeAll(); await ev(id => SM_TOWN.indoor.enter(id), q.id); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { return false; } await W8(300); return true; };
    const leave = async () => { if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(300); };
    const checkRoom = async nm => { const c = await ev(() => SM_TOWN.indoor.check()), bad = (c && c.hots || []).filter(h => h.ok === false).map(h => h.label); ok(c && c.spawnFree && !bad.length, nm + ' 방: 들어간 자리 비어 있음 · E 자리 ' + ((c && c.hots) || []).length + '곳 모두 닿음' + (bad.length ? ' — 못 닿음 ' + bad.join(' / ') : '')); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.bldg, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 11 * 60; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
    const L = await ev(() => SM_TOWN.indoor.list().filter(q => ['police', 'clinic', 'shelter'].includes(q.kind)));
    const by = k => L.filter(q => q.kind === k); console.log('    들어갈 곳: ' + L.map(q => q.name + '(' + q.kind + ')').join(' · '));
    ok(by('police').length >= 1 && by('clinic').length >= 1 && by('shelter').length >= 1, '경찰서 ' + by('police').length + ' · 병원·보건소 ' + by('clinic').length + ' · 보호센터 ' + by('shelter').length + ' 곳이 들어감');
    ok(!L.some(q => /동물병원/.test(q.name)), '동물병원은 들어가지 않음(보호센터 동물만 쓰는 곳)');
    // ① 문 이름표 · J 검색
    const labs = await ev(() => SD2.map.interact.list().map(h => h.label).filter(t => /들어가기 — /.test(t || '')));
    ok(labs.some(t => /경찰서 · 112 신고 연습/.test(t)) && labs.some(t => /(병원|보건소) · 응급 처치 배우기/.test(t)) && labs.some(t => /동물보호센터 · 동물 밥 주기/.test(t)), '문 E 이름표에 할 일 (' + labs.filter(t => / · /.test(t)).slice(0, 3).join(' / ') + ')');
    for (const [q, re] of [['112', '경찰서'], ['응급', '병원|보건'], ['밥 주기', '동물보호센터']]) { await closeAll(); await p.keyboard.press('KeyJ'); await W8(700); const r = await ev(q => { const i = document.querySelector('.twn-p .jq'); if (!i) return null; i.value = q; i.dispatchEvent(new Event('input')); const jr = document.querySelector('.twn-p .jr'); return jr ? jr.innerText : ''; }, q); ok(r && new RegExp(re).test(r), 'J 검색 「' + q + '」 → ' + (r || '-').split('\n').slice(0, 2).join(' ')); }
    await closeAll();
    // ② 경찰서
    const D0 = await ev(() => SM_TOWN.game().S.day);
    await ev(d => { const G = SM_TOWN.game().S; G.emerg = G.emerg || { v: 1, d: -1, plan: [], log: [], n: {} }; G.emerg.log = G.emerg.log || []; G.emerg.log.unshift({ k: 'lost', d: d - 1, x: 10, z: 10, cell: '마4', ok: 1, w: [0, 0, 'saltpan'], v: 'saltpan' }, { k: 'hurt', d: d - 1, x: 20, z: 20, cell: '사5', ok: 1, v: 'ankle' }); }, D0);
    const pol = by('police')[0]; ok(await enter(pol), pol.name + ' 들어감'); let I = await BI(); ok(I.cur && I.cur.k === 'police' && I.cur.extra.some(q => q.k === 'bd:112'), '경찰서 방 · E = 112 연습 · 칭찬 게시판'); await checkRoom('경찰서');
    const ex0 = await xp('explore');
    await E('bd:112', async () => !!(await dlg())); await W8(2500); const dt = await dlg(); ok(dt && /길 잃은 아이/.test(dt), '도운 아이가 있으면 경찰관 대화 먼저 「' + (dt || '-').replace(/\s+/g, ' ').slice(0, 50) + '…」');
    await p.keyboard.press('Escape'); await W8(500); await closeAll(); I = await BI(); ok((I.s.police.thx || []).length === 1, '고맙다는 쪽지 = 게시판에 붙음'); { const sd = await waitSaid('칭찬 게시판'); ok(sd, '「칭찬 게시판에 … 붙었어요」 한 줄'); if (!sd) console.log('    toast ' + JSON.stringify(await ev(() => { const t9 = document.getElementById('toast'); return [t9.textContent, t9.style.display]; }))); }
    await E('bd:112', async () => ((await panel()) || {}).k === 'bd112'); let P = await panel(); ok(P && P.k === 'bd112' && /몇 번/.test(P.t), 'E = 112 연습 창(번호판)'); let wrongSeen = false;
    for (let i = 0; i < 3; i++) { P = await panel(); const sit = await ev(() => (document.querySelector('.twn-p .bd-sit') || {}).textContent || ''), want = /엄마를 잃어|자전거|신호등/.test(sit) ? '112' : '119', bad = want === '112' ? '119' : '112';
      if (!i) { for (const k of bad) await ev(k => document.querySelector('.twn-p button[data-k="' + k + '"]').click(), k); await ev(() => document.querySelector('.twn-p button[data-k="📞"]').click()); await W8(200); const m = await ev(() => (document.querySelector('.twn-p [data-m]') || {}).textContent || ''); wrongSeen = m.length > 5; }
      for (const k of want) await ev(k => document.querySelector('.twn-p button[data-k="' + k + '"]').click(), k); await ev(() => document.querySelector('.twn-p button[data-k="📞"]').click()); await W8(250); }
    ok(wrongSeen, '틀린 번호 = 경찰관이 되물음(힌트)'); P = await panel(); ok(P && /또렷하게/.test(P.t), '상황 셋 다음 = 무엇을 꼭 말하나');
    const wb = await ev(() => [...document.querySelectorAll('.twn-p button[data-w]')].map(b9 => b9.textContent)); await ev(i => document.querySelector('.twn-p button[data-w="' + i + '"]').click(), wb.findIndex(t => !/어디/.test(t))); await W8(200); ok(/어디로/.test(((await panel()) || {}).t || ''), '틀린 답 = 되물음');
    await ev(i => document.querySelector('.twn-p button[data-w="' + i + '"]').click(), wb.findIndex(t => /어디/.test(t))); await W8(300); P = await panel(); ok(P && /장난 전화/.test(P.t) && /신고/.test(P.t), '끝 = 112·119 정리 + 낱말 상자');
    I = await BI(); const ex1 = await xp('explore'); ok(I.s.police.d112 === D0 && I.s.police.n112 === 1, '연습 기록(오늘 · 1번)'); ok(ex1 > ex0, '탐험 솜씨 + (' + ex0 + ' → ' + ex1 + ')'); await closeAll();
    // 하루 한 번(다시 해도 솜씨 그대로)
    await E('bd:112', async () => ((await panel()) || {}).k === 'bd112'); for (let i = 0; i < 3; i++) { const sit = await ev(() => (document.querySelector('.twn-p .bd-sit') || {}).textContent || ''), want = /엄마를 잃어|자전거|신호등/.test(sit) ? '112' : '119'; for (const k of want) await ev(k => document.querySelector('.twn-p button[data-k="' + k + '"]').click(), k); await ev(() => document.querySelector('.twn-p button[data-k="📞"]').click()); await W8(200); }
    { const wb2 = await ev(() => [...document.querySelectorAll('.twn-p button[data-w]')].map(b9 => b9.textContent)); await ev(i => document.querySelector('.twn-p button[data-w="' + i + '"]').click(), wb2.findIndex(t => /어디/.test(t))); await W8(300); }
    ok((await xp('explore')) === ex1 && (await BI()).s.police.n112 === 2, '같은 날 다시 = 기록만(솜씨 그대로 · 하루 한 번)'); await closeAll();
    await E('bd:board', async () => ((await panel()) || {}).k === 'bdboard'); P = await panel(); ok(P && /112 어린이 도우미/.test(P.t) && /길 잃은 아이/.test(P.t), '칭찬 게시판 = 연습 · 도운 아이'); await closeAll();
    // 문 E로 나가기
    { const R9 = await ev(() => SM_TOWN.indoor.room); await tpA([R9.at[0], R9.at[1], R9.at[2] + R9.D / 2 - 0.9]); await W8(500); await p.keyboard.press('KeyE'); let out = false; for (let i = 0; i < 20 && !out; i++) { await W8(250); out = !(await ev(() => SM_TOWN.indoor.on)); } ok(out, '문 E = 밖으로'); ok(!(await BI()).cur, '나오면 방 판(캔버스) 치움'); }
    // ③ 병원·보건소
    const cl = by('clinic')[0]; ok(await enter(cl), cl.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'clinic' && I.cur.nb && I.cur.extra.some(q => q.k === 'bd:hi'), '넘어진 이웃을 도운 뒤 = 나은 이웃 몸 + 인사 E'); await checkRoom(cl.name);
    const wk0 = await xp('work'); await E('bd:hi', async () => !!(await dlg())); await W8(2500); const d2 = await dlg(); ok(d2 && /119에 알려|더위를 먹었을/.test(d2), '나은 이웃 「' + (d2 || '-').replace(/\s+/g, ' ').slice(0, 40) + '…」'); await p.keyboard.press('Escape'); await W8(500); await closeAll();
    I = await BI(); const wk1 = await xp('work'); ok((I.s.clinic.hi || []).length === 1 && wk1 > wk0, '인사 기록 · 일솜씨 +');
    await E('bd:aid', async () => ((await panel()) || {}).k === 'bdaid'); P = await panel(); ok(P && /1\/3/.test(P.t), 'E = 응급 처치 창(문제 셋)');
    await ev(() => document.querySelector('.twn-p button[data-o="1"]').click()); await W8(200); ok(/다시 생각/.test(((await panel()) || {}).t || ''), '틀린 답 = 까닭 + 다시');
    for (let i = 0; i < 3; i++) { await ev(() => document.querySelector('.twn-p button[data-o="0"]').click()); await W8(250); } P = await panel(); ok(P && /응급 처치 카드/.test(P.t) && /응급 처치/.test(P.t), '셋 다 = 끝 + 낱말 상자');
    I = await BI(); ok(I.s.clinic.dfa === D0 && (await xp('work')) > wk1, '배운 기록 · 일솜씨 +'); await closeAll(); await leave();
    await ev(() => { SM_TOWN.game().S.min = 20 * 60; }); await ev(id => SM_TOWN.indoor.enter(id), cl.id); await W8(1500); ok(!(await ev(() => SM_TOWN.indoor.on)) && await waitSaid('문을 닫았어요'), '20:00 ' + cl.name + ' = 「문을 닫았어요 · 09:00에 열어요」 (안 들어감)');
    ok(await enter(pol), '20:00 경찰서는 늘 열림'); await leave(); await ev(() => { SM_TOWN.game().S.min = 11 * 60; });
    // ④ 보호센터
    const sh = by('shelter')[0]; ok(await enter(sh), sh.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'shelter' && I.cur.food === false, '보호센터 방 · 밥그릇 빔'); await checkRoom('보호센터');
    const lk0 = await xp('look'); await E('bd:feed', async () => ((await panel()) || {}).k === 'bdfeed'); P = await panel(); ok(P && /강아지 밥그릇/.test(P.t), 'E = 밥 주기 창(강아지 그릇)');
    await ev(() => document.querySelector('.twn-p button[data-f="2"]').click()); await W8(200); ok(/초콜릿은 개와 고양이/.test(((await panel()) || {}).t || ''), '초콜릿 = 해로운 까닭');
    await ev(() => document.querySelector('.twn-p button[data-f="0"]').click()); await W8(200); P = await panel(); ok(/고양이 밥그릇/.test(P.t), '강아지 사료 = 다음(고양이 그릇)');
    await ev(() => document.querySelector('.twn-p button[data-f="0"]').click()); await W8(200); ok(/고기에서 얻는 영양/.test(((await panel()) || {}).t || ''), '고양이에게 강아지 사료 = 까닭');
    await ev(() => document.querySelector('.twn-p button[data-f="1"]').click()); await W8(300); P = await panel(); ok(P && /새 가족/.test(P.t) && /입양/.test(P.t), '끝 = 동물보호사 말 + 낱말 상자');
    I = await BI(); ok(I.cur.food === true && I.s.shelter.fed === D0, '밥그릇에 밥이 보임'); ok((await xp('look')) > lk0, '관찰 솜씨 +'); await closeAll();
    await E('bd:feed', () => said('벌써 밥을')); ok(await waitSaid('벌써 밥을') && !(await panel()), '다시 E = 「오늘은 벌써 밥을 먹었어요」 (창 X)');
    await leave(); ok(await enter(sh), '다시 들어감'); ok((await BI()).cur.food === true, '다시 들어가도 밥그릇 참'); await leave();
    await ev(() => { SM_TOWN.game().S.day += 1; }); ok(await enter(sh), '다음 날 들어감'); ok((await BI()).cur.food === false, '다음 날 = 밥그릇 빔(또 줄 수 있음)'); await leave();
    // ⑥ 은행
    { const LB = await ev(() => SM_TOWN.indoor.list().filter(q => q.kind === 'bank')); ok(LB.length >= 1, '은행 ' + LB.length + '곳이 들어감(' + LB.map(q => q.name).join(' · ') + ')');
      const labs2 = await ev(() => SD2.map.interact.list().map(h => h.label).filter(t => /들어가기 — /.test(t || '')));
      ok(labs2.some(t => /은행 · 저금하기/.test(t)) && labs2.some(t => /우체국 · 소포 보내기/.test(t)), '문 E 이름표 「은행 · 저금하기」 · 「우체국 · 소포 보내기」');
      for (const [q, re] of [['저금', '은행'], ['소포', '우체국']]) { await closeAll(); await p.keyboard.press('KeyJ'); await W8(700); const r = await ev(q => { const i = document.querySelector('.twn-p .jq'); if (!i) return null; i.value = q; i.dispatchEvent(new Event('input')); const jr = document.querySelector('.twn-p .jr'); return jr ? jr.innerText : ''; }, q); ok(r && new RegExp(re).test(r), 'J 검색 「' + q + '」 → ' + (r || '-').split('\n').slice(0, 2).join(' ')); }
      await closeAll(); await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; G.money = 5000; }); const bk = LB[0];
      ok(await enter(bk), bk.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'bank' && I.cur.extra.some(q => q.k === 'bd:bank') && I.cur.extra.some(q => q.k === 'bd:board'), '은행 방 · E = 저금하기 · 내 통장 판'); await checkRoom('은행');
      const tr0 = await xp('trade'); await E('bd:bank', async () => ((await panel()) || {}).k === 'bdbank'); P = await panel(); ok(P && /저금하기/.test(P.t) && /아직 적힌 줄/.test(P.t) && /이자/.test(P.t), 'E = 저금 창(지갑·통장 막대 · 빈 통장 · 낱말 상자)');
      const mb = () => ev(() => [SM_TOWN.game().S.money, (SM_TOWN.game().S.bldg.bank || {}).bal | 0, ((SM_TOWN.game().S.bldg.bank || {}).hist || []).length]);
      await ev(() => document.querySelector('.twn-p button[data-d="1000"]').click()); await W8(250); let M = await mb(); ok(M[0] === 4000 && M[1] === 1000 && M[2] === 1, '1,000원 넣기 = 지갑 5,000 → 4,000 · 통장 1,000 · 한 줄 (' + M.join(',') + ')');
      P = await panel(); ok(/넣음/.test(P.t) && /1,000원을 넣고/.test(P.t), '창 안 통장 표에 「넣음」 줄 · 은행원 한 줄'); const tr1 = await xp('trade'); ok(tr1 > tr0, '살림 솜씨 + (' + tr0 + ' → ' + tr1 + ')');
      await ev(() => document.querySelector('.twn-p button[data-d="half"]').click()); await W8(250); M = await mb(); ok(M[0] === 2000 && M[1] === 3000, '반 넣기 = 지갑 2,000 · 통장 3,000 (' + M.join(',') + ')'); ok((await xp('trade')) === tr1, '같은 날 또 넣어도 솜씨 그대로(하루 한 번)');
      const ea0 = await ev(() => SM_TOWN.game().S.earned); await ev(() => document.querySelector('.twn-p button[data-w="1000"]').click()); await W8(250); M = await mb(); ok(M[0] === 3000 && M[1] === 2000 && M[2] === 3, '1,000원 꺼내기 = 지갑 3,000 · 통장 2,000 (' + M.join(',') + ')');
      ok((await ev(() => SM_TOWN.game().S.earned)) === ea0, '꺼내기는 번 돈으로 셈하지 않음(옮김)'); await closeAll();
      ok((await ev(() => SM_TOWN.bldg().dbg.board())) > 1000, '벽 「내 통장」 판(캔버스) 그림');
      await E('bd:board', async () => ((await panel()) || {}).k === 'bdboard'); P = await panel(); ok(P && /통장에 있는 돈/.test(P.t) && /꺼냄/.test(P.t), '통장 판 보기 = 남은 돈 · 줄'); await closeAll(); await leave();
      await ev(() => { const G = SM_TOWN.game().S; G.bldg.bank.wk = G.day - 7; }); ok(await enter(bk), '7일 뒤 다시 들어감'); M = await mb(); const H9 = await ev(() => SM_TOWN.game().S.bldg.bank.hist.slice(-1)[0]);
      ok(M[1] === 2040 && H9 && H9[1] === 'int' && H9[2] === 40, '이자 한 줄(통장 2,000 → 2,040 · 100원에 2원꼴) ' + JSON.stringify(H9)); ok(await waitSaid('이자'), '「이자 … 통장에 붙었어요」 한 줄'); await leave();
      await ev(() => { SM_TOWN.game().S.min = 17 * 60; }); await ev(id => SM_TOWN.indoor.enter(id), bk.id); await W8(1500); ok(!(await ev(() => SM_TOWN.indoor.on)) && await waitSaid('문을 닫았어요'), '17:00 은행 = 「문을 닫았어요 · 09:00에 열어요」 (안 들어감)'); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); }
    // ⑦ 우체국
    { const LP = await ev(() => SM_TOWN.indoor.list().filter(q => q.kind === 'post')); ok(LP.length >= 1, '우체국 ' + LP.length + '곳이 들어감'); const po = LP[0];
      await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; G.money = 3000; G.bag['🍓'] = 3; }); const D1 = await ev(() => SM_TOWN.game().S.day);
      ok(await enter(po), po.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'post' && I.cur.extra.some(q => q.k === 'bd:post') && I.cur.box === false, '우체국 방 · 1번 창구 E = 소포 보내기 · 저울 위 빔'); await checkRoom('우체국');
      const ex2 = await xp('explore'); await E('bd:post', async () => ((await panel()) || {}).k === 'bdpost'); P = await panel(); ok(P && /무엇을 보낼까요/.test(P.t) && /딸기/.test(P.t), 'E = 소포 창(1/4 물건 · 가방 딸기)');
      await ev(() => document.querySelector('.twn-p button[data-e="🍓"]').click()); await W8(200); P = await panel(); const nbN = await ev(() => document.querySelectorAll('.twn-p button[data-n]').length); ok(/누구에게/.test(P.t) && nbN >= 2, '2/4 받을 이웃 ' + nbN + '명(일꾼 역할 · ' + P.t.split('\n').filter(t => /일꾼/.test(t)).slice(0, 3).join(' / ') + ')');
      await ev(() => document.querySelector('.twn-p button[data-n="0"]').click()); await W8(300); P = await panel(); const cvH = await ev(() => { const c = document.querySelector('.twn-p canvas.bd-map'); return c ? c.height : 0; }); ok(/주소를 써요/.test(P.t) && cvH > 100, '3/4 주소 = 창 안 지도(칸 글자 · 빨간 점) + 칸 고르기');
      const want = ((await BI()).dbg.filter(t => /^addr /.test(t)).pop() || '').slice(5), cs = await ev(() => [...document.querySelectorAll('.twn-p button[data-c]')].map(b9 => b9.dataset.c)); ok(want && cs.includes(want) && cs.length >= 2, '칸 보기 ' + cs.join('·') + ' (맞는 칸 ' + want + ')');
      const bad = cs.find(c => c !== want); if (bad) { await ev(c => document.querySelector('.twn-p button[data-c="' + c + '"]').click(), bad); await W8(200); ok(/빨간 점에서/.test(((await panel()) || {}).t || ''), '틀린 칸 = 지도 읽는 힌트'); }
      await ev(c => document.querySelector('.twn-p button[data-c="' + c + '"]').click(), want); await W8(250); P = await panel(); ok(P && /소포 값/.test(P.t) && new RegExp(want + ' 칸').test(P.t), '4/4 = 보내는 물건 · 받는 사람 · 주소 칸 · 소포 값');
      await ev(() => document.querySelector('.twn-p button[data-p]').click()); await W8(300); P = await panel(); const G1 = await ev(() => { const G = SM_TOWN.game().S; return { m: G.money, b: G.bag['🍓'] | 0, box: (G.bldg.post.box || []).slice() }; });
      ok(G1.m === 2500 && G1.b === 2 && G1.box.length === 1 && G1.box[0].cell === want && G1.box[0].d === D1, '보냄 = 돈 −500 · 딸기 −1 · 소포 한 개(' + want + ' 칸)'); ok(P && /내일/.test(P.t) && /주소/.test(P.t) && /우편/.test(P.t), '끝 = 내일 닿는다는 말 + 낱말 상자(주소·우편)');
      I = await BI(); ok(I.cur.box === true, '저울 위에 소포 상자가 보임'); ok((await xp('explore')) > ex2, '탐험 솜씨 +'); await closeAll();
      await E('bd:post', () => said('벌써 받았어요')); ok(await waitSaid('벌써 받았어요') && !(await panel()), '같은 날 다시 E = 「오늘 소포는 벌써 받았어요」 (창 X)');
      await leave(); ok(await enter(po), '다시 들어감'); ok((await BI()).cur.box === true, '다시 들어가도 상자 그대로'); await leave();
      const q0 = G1.box[0], h0 = await ev(k => (SM_TOWN.game().S.hearts || {})[k] || 0, q0.to);
      await ev(() => { SM_TOWN.game().S.day += 1; }); ok(await waitSaid('닿았어요'), '다음 날 = 「보낸 소포가 ' + want + ' 칸 … 닿았어요」 한 줄');
      await tpA([q0.x + 2.5, q0.g, q0.z + 2.5]); let okd = false; for (let i = 0; i < 12 && !okd; i++) { await W8(300); okd = !!(await ev(() => (SM_TOWN.game().S.bldg.post.box || [])[0].ok)); }
      const h1 = await ev(k => (SM_TOWN.game().S.hearts || {})[k] || 0, q0.to); ok(okd && h1 > h0, '받는 이웃 곁(10m) = 인사 · 하트 ' + h0 + ' → ' + h1); ok(await waitSaid('고맙대요'), '「… 소포를 받고 고맙대요 ❤」 한 줄');
      ok(await enter(po), '다음 날 우체국'); ok((await BI()).cur.box === false, '닿은 뒤 = 저울 위 빔');
      await ev(() => { SM_TOWN.game().S.min = 20 * 60; }); await E('bd:post', () => said('창구는 지금 문을')); ok(await waitSaid('창구는 지금 문을') && !(await panel()), '20:00 = 방은 들어가고 창구 E만 「문을 닫았어요」'); await leave(); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); }
    // ⑧ BLDG-3 영화관 · 공장 · 노인정·경로당 · 박물관
    { const L3 = await ev(() => SM_TOWN.indoor.list().filter(q => ['cinema', 'factory', 'elder', 'museum'].includes(q.kind))), b3 = k => L3.filter(q => q.kind === k); console.log('    BLDG-3 들어갈 곳: ' + L3.map(q => q.name + '(' + q.kind + ')').join(' · '));
      ok(b3('cinema').length >= 1 && b3('factory').length >= 1 && b3('elder').length >= 1 && b3('museum').length >= 1, '영화관 ' + b3('cinema').length + ' · 공장 ' + b3('factory').length + ' · 노인정·경로당 ' + b3('elder').length + ' · 박물관 ' + b3('museum').length + ' 곳이 들어감');
      ok(!L3.some(q => /곤충/.test(q.name)) && (await ev(() => SM_TOWN.indoor.list().filter(q => /곤충/.test(q.name)).every(q => q.kind === 'insect'))), '곤충 박물관은 옛 물건 방이 아님(DEPTH-3 쇼 본 것 찾기 방 · town_depth3.cjs)');
      const labs3 = await ev(() => SD2.map.interact.list().map(h => h.label).filter(t => /들어가기 — /.test(t || '')));
      ok(labs3.some(t => /영화관 · 상영 시간표/.test(t)) && labs3.some(t => /공장 · 만드는 차례 견학/.test(t)) && labs3.some(t => /(노인정|경로당) · 옛 땅이름 듣기/.test(t)) && labs3.some(t => /박물관 · 옛 물건 알아보기/.test(t)), '문 E 이름표에 할 일 넷');
      for (const [q, re] of [['시간표', '영화관'], ['견학', '공장'], ['땅이름', '노인정|경로당'], ['옛 물건', '박물관']]) { await closeAll(); await p.keyboard.press('KeyJ'); await W8(700); const r = await ev(q => { const i = document.querySelector('.twn-p .jq'); if (!i) return null; i.value = q; i.dispatchEvent(new Event('input')); const jr = document.querySelector('.twn-p .jr'); return jr ? jr.innerText : ''; }, q); ok(r && new RegExp(re).test(r), 'J 검색 「' + q + '」 → ' + (r || '-').split('\n').slice(0, 2).join(' ')); }
      await closeAll();
      // 🎬 영화관
      const cn = b3('cinema')[0]; await ev(() => { const G = SM_TOWN.game().S; G.min = 13 * 60 + 20; G.money = 3000; }); const D3 = await ev(() => SM_TOWN.game().S.day);
      ok(await enter(cn), cn.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'cinema' && I.cur.extra.some(q => q.k === 'bd:ticket') && !I.cur.extra.some(q => q.k === 'bd:seat'), '영화관 방 · E = 매표소 · 표 없으면 자리 E 없음'); await checkRoom('영화관');
      ok((await ev(() => SM_TOWN.bldg().dbg.board())) > 1000, '큰 화면(캔버스) = 오늘 상영 시간표');
      const ex3 = await xp('explore'); await E('bd:ticket', async () => ((await panel()) || {}).k === 'bdcine'); P = await panel(); ok(P && /집에서 온 쪽지/.test(P.t) && /지금 시각: 1[34]:\d\d/.test(P.t) && /할 일/.test(P.t), 'E = 상영 시간표 창(쪽지 · 지금 시각 · 할 일)');
      const T3 = await ev(() => { const t = document.querySelector('.twn-p .bd-sit').textContent, m = t.match(/(\d\d):(\d\d)까지/), lim = m ? +m[1] * 60 + +m[2] : 9999, rows = [...document.querySelectorAll('.twn-p table.bd-pb tr')].slice(1).map(tr => [...tr.children].map(td => td.textContent)), mm = s => +s.slice(0, 2) * 60 + +s.slice(3); return { lim, ends: rows.map(r => mm(r[2])), starts: rows.map(r => mm(r[1])) }; });
      const wr = T3.ends.findIndex(v => v > T3.lim), rt = T3.ends.findIndex(v => v <= T3.lim); ok(wr >= 0 && rt >= 0 && T3.starts.every(v => v > 13 * 60 + 20), '시간표 ' + T3.starts.length + '줄(모두 13:20 뒤) · 쪽지 ' + T3.lim + '분 · 맞는 줄 ' + rt + ' · 늦는 줄 ' + wr);
      await ev(j => document.querySelector('.twn-p button[data-s="' + j + '"]').click(), wr); await W8(200); ok(/늦어요/.test(((await panel()) || {}).t || '') && (await ev(() => SM_TOWN.game().S.money)) === 3000, '늦게 끝나는 영화 = 끝나는 시각 견주기 힌트(돈 그대로)');
      await ev(j => document.querySelector('.twn-p button[data-s="' + j + '"]').click(), rt); await W8(300); P = await panel(); const tk = await ev(() => SM_TOWN.game().S.bldg.cinema.tk);
      ok(tk && tk.d === D3 && /^[가나다라마][1-6]$/.test(tk.seat) && (await ev(() => SM_TOWN.game().S.money)) === 2500, '표 = 돈 −500 · 자리 ' + (tk && tk.seat)); ok(P && /줄 글자/.test(P.t) && /상영/.test(P.t) && /시간표/.test(P.t), '표 창 = 자리 찾는 법(지도 칸 주소) + 낱말 상자'); await closeAll();
      I = await BI(); ok(I.cur.extra.some(q => q.k === 'bd:seat'), '표를 사면 그 자리에 E가 생김'); await checkRoom('영화관(자리 E)');
      await E('bd:seat', async () => ((await panel()) || {}).k === 'bdseat'); P = await panel(); ok(P && /기다릴까요/.test(P.t), '자리 E(시작 전) = 시작 시각까지 기다리기');
      await ev(() => document.querySelector('.twn-p button[data-w]').click()); await W8(400); P = await panel(); const sh = T3.starts[rt]; ok(P && P.k === 'bdfilm' && (await ev(() => SM_TOWN.game().S.min)) === sh, '기다리면 시계 = 시작 시각 · 영화 장면 창'); ok((await BI()).cur.play != null, '화면 = 영화 장면');
      for (let i = 0; i < 3; i++) { await ev(() => document.querySelector('.twn-p button[data-n]').click()); await W8(250); }
      const mn = await ev(() => SM_TOWN.game().S.min); ok(!(await panel()) && mn === T3.ends[rt] && (await ev(() => SM_TOWN.game().S.bldg.cinema.seen)) === D3, '다 보면 시계 = 끝나는 시각(' + mn + ') · 본 날 기록'); ok(await waitSaid('영화가 끝났어요'), '「영화가 끝났어요 · 지금 …」 한 줄'); ok((await xp('explore')) > ex3, '탐험 솜씨 +');
      await E('bd:ticket', () => said('벌써 영화를')); ok(await waitSaid('벌써 영화를') && !(await panel()), '같은 날 다시 매표소 = 「오늘은 벌써 영화를 봤어요」'); await leave();
      await ev(() => { SM_TOWN.game().S.min = 21 * 60 + 30; }); await ev(id => SM_TOWN.indoor.enter(id), cn.id); await W8(1500); ok(!(await ev(() => SM_TOWN.indoor.on)) && await waitSaid('문을 닫았어요'), '21:30 영화관 = 문 닫음(안 들어감)'); await ev(() => { SM_TOWN.game().S.min = 11 * 60; });
      // 🏭 공장
      for (const fc of b3('factory')) { ok(await enter(fc), fc.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'factory' && I.cur.line === (/젤리|케이크/.test(fc.name) ? 'jelly' : 'farm'), fc.name + ' 줄 = ' + I.cur.line); await leave(); }
      const fa = b3('factory')[0]; ok(await enter(fa), fa.name + ' 들어감'); I = await BI(); ok(I.cur.prod === false && I.cur.extra.some(q => q.k === 'bd:line'), '공장 방 · 깔판 빔 · E = 만드는 차례 견학'); await checkRoom('공장');
      const wk3 = await xp('work'); await E('bd:line', async () => ((await panel()) || {}).k === 'bdline'); P = await panel(); ok(P && /할 일/.test(P.t) && /0\/5/.test(P.t), 'E = 차례 창(0/5)');
      await ev(() => document.querySelector('.twn-p button[data-j="3"]').click()); await W8(200); ok(/맨 처음/.test(((await panel()) || {}).t || ''), '처음에 뒤 일 = 「1번 자리가 맨 처음」 힌트');
      for (const j of [0, 1]) { await ev(j => document.querySelector('.twn-p button[data-j="' + j + '"]').click(), j); await W8(150); } await ev(() => document.querySelector('.twn-p button[data-j="4"]').click()); await W8(200); ok(/아직 일러요/.test(((await panel()) || {}).t || ''), '건너뛰면 = 앞 일을 짚는 힌트');
      for (const j of [2, 3, 4]) { await ev(j => document.querySelector('.twn-p button[data-j="' + j + '"]').click(), j); await W8(150); } P = await panel(); ok(/무엇이 좋을까요/.test(P.t), '다섯 다 = 분업 물음');
      await ev(() => document.querySelector('.twn-p button[data-v="0"]').click()); await W8(200); ok(/다시 생각/.test(((await panel()) || {}).t || ''), '틀린 답 = 다시');
      await ev(() => document.querySelector('.twn-p button[data-v="1"]').click()); await W8(300); P = await panel(); I = await BI(); ok(P && /깔판/.test(P.t) && /분업/.test(P.t), '끝 = 상자 · 트럭 · 낱말 상자(분업·원료)'); ok(I.cur.prod === true && I.s.factory.made === I.s.factory.made && (await xp('work')) > wk3, '깔판에 오늘 만든 상자 · 일솜씨 +'); await closeAll();
      await E('bd:line', () => said('벌써 돌았어요')); ok(await waitSaid('벌써 돌았어요') && !(await panel()), '다시 E = 「오늘 줄은 벌써 돌았어요」'); await leave(); ok(await enter(fa), '다시 들어감'); ok((await BI()).cur.prod === true, '다시 들어가도 상자 그대로'); await leave();
      // 🚚 BLDG-3b 공장 → 다음 날 가게·장터에 우리 물건(생산 → 유통 → 소비)
      { const f0 = (await BI()).s.factory, kd0 = f0.ln, D5 = await ev(() => SM_TOWN.game().S.day); ok(f0.made === D5 && ['jelly', 'farm'].includes(kd0) && Array.isArray(f0.door) && !f0.dl, '만든 날 기록 = 줄 ' + kd0 + ' · 공장 문 자리 · 아직 안 감');
        ok(!(await ev(() => SM_TOWN.bldg().facNews(SM_TOWN.game().S.day).length)), '만든 날 = 아직 가게에 없음');
        const dest = async () => { const q = (await BI()).s.factory.dl; return q; };
        const openTo = async q => { await closeAll(); if (q.kind === 'mk') { const i = await ev(k => SM_TOWN.mk.stalls().findIndex(w => (w.mk || '') + '@' + Math.round(w.x) + ',' + Math.round(w.z) === k), q.key); if (i < 0) return null; await ev(i => SM_TOWN.mk.open(i), i); } else await ev(nm => SM_TOWN.rules.shop(nm), q.to); await W8(300); return panel(); };
        const flow = async (kd, nm9) => { await closeAll(); await ev(() => { const G = SM_TOWN.game().S; G.day += 1; G.min = 11 * 60; G.money = 5000; }); let said9 = await waitSaid('들어왔어요'); if (!said9) { console.log('    (창: ' + JSON.stringify(await panel()).slice(0, 120) + ')'); await closeAll(); said9 = await waitSaid('들어왔어요'); await W8(1500); const t9 = await ev(() => { const q = SM_TOWN.game().S.bldg.factory.dl, t = document.getElementById('toast'); return { told: q && q.told === SM_TOWN.game().S.day, t: t ? t.textContent.slice(0, 80) : '' }; }); console.log('    (한 줄 늦음: ' + JSON.stringify(t9) + ')'); said9 = t9.told; }
          const q = await dest(), G9 = { jelly: ['🍰', 1200, 'shop', '젤리 케이크'], farm: ['🥔', 300, 'mk', '감자'] }[kd]; ok(said9, nm9 + ' 다음 날 = 「… 상자가 트럭에 실려 … 들어왔어요」 한 줄');
          ok(q && q.ln === kd && q.e === G9[0] && q.left === 3 && q.to && (q.kind === G9[2] || (kd === 'farm' && q.kind === 'shop')), nm9 + ' 상자 → ' + (q && q.to) + '(' + (q && q.kind) + ') · 셋');
          const nw = await ev(() => SM_TOWN.bldg().facNews(SM_TOWN.game().S.day)); ok(nw.length === 1 && /어제 .*에서 만든 .* 상자가 트럭에 실려 .*에 들어왔어요/.test(nw[0].t[0]), '아침 소식 줄 「' + (nw[0] ? nw[0].t[0] : '-') + '」');
          ok(await ev(() => (SM_TOWN.game().S.diary || []).some(d => d.e === '🏭' && /들어왔어요/.test(d.t || ''))), '일기장 한 줄(🏭)');
          let P = await openTo(q); ok(P && /우리가 만든 것/.test(P.t) && new RegExp(G9[3]).test(P.t) && /\(3\)/.test(P.t), q.to + ' 창 = 「우리가 만든 것」 ' + G9[3] + ' 한 칸(3)');
          const b0 = await ev(e => SM_TOWN.game().S.bag[e] | 0, G9[0]), xp0 = await ev(() => JSON.stringify(SM_TOWN.skills().xp || {}));
          await ev(() => document.querySelector('.twn-p button[data-fac]').click()); await W8(300); P = await panel();
          const G1 = await ev(e => { const G = SM_TOWN.game().S; return { m: G.money, b: G.bag[e] | 0, left: G.bldg.factory.dl.left }; }, G9[0]);
          ok(G1.m === 5000 - G9[1] && G1.b === b0 + 1 && G1.left === 2 && P && /\(2\)/.test(P.t), '사기 = 돈 −' + G9[1] + ' · 가방 +1 · 남은 것 2');
          ok((await ev(() => JSON.stringify(SM_TOWN.skills().xp || {}))) === xp0, '산 것 = 솜씨·보상 그대로');
          await closeAll(); return q; };
        const q1 = await flow(kd0, (await BI()).s.factory.nm || '공장');
        const other = kd0 === 'jelly' ? 'farm' : 'jelly', fo = b3('factory').find(q => (/젤리|케이크/.test(q.name) ? 'jelly' : 'farm') === other);
        if (fo) { ok(await enter(fo), fo.name + ' 들어감(다른 줄)'); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); await E('bd:line', async () => ((await panel()) || {}).k === 'bdline');
          for (const j of [0, 1, 2, 3, 4]) { await ev(j => document.querySelector('.twn-p button[data-j="' + j + '"]').click(), j); await W8(120); } await ev(() => document.querySelector('.twn-p button[data-v="1"]').click()); await W8(300); await closeAll(); await leave();
          const q2 = await flow(other, fo.name); ok(q2 && q1 && q2.key !== q1.key, '젤리 케이크 = 가게 · 감자 = 장터(다른 곳 · ' + q1.to + ' / ' + (q2 && q2.to) + ')'); }
        await ev(() => { SM_TOWN.game().S.day += 2; }); ok(!(await ev(() => SM_TOWN.bldg().facNews(SM_TOWN.game().S.day).length)) && !(await ev(() => { const q = SM_TOWN.game().S.bldg.factory.dl; return SM_TOWN.bldg().facAt(q.kind, q.key); })), '이틀 뒤 = 진열 끝(소식·칸 없음)');
        await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; }); }
      // 👵 노인정·경로당
      const el = b3('elder')[0]; ok(await enter(el), el.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'elder' && ['bd:elder', 'bd:gonu', 'bd:board'].every(k => I.cur.extra.some(q => q.k === k)), '노인정 방 · E = 땅이름 · 고누 · 판'); await checkRoom(el.name);
      const ex4 = await xp('explore'); await E('bd:elder', async () => ((await panel()) || {}).k === 'bdelder'); P = await panel(); ok(P && /1\/4/.test(P.t) && /「/.test(P.t), 'E = 땅이름 창(1/4)');
      await ev(() => document.querySelector('.twn-p button[data-o="0"]').click()); await W8(200); ok(/떼어 보렴|뜻이란다|마을이라는/.test(((await panel()) || {}).t || ''), '틀린 뜻 = 낱말을 떼어 보는 힌트');
      for (let i = 0; i < 4; i++) { await ev(() => document.querySelector('.twn-p button[data-o="1"]').click()); await W8(220); } P = await panel(); I = await BI(); ok(P && /팻말/.test(P.t) && /지명/.test(P.t) && /유래/.test(P.t), '끝 = 어르신 말 + 낱말 상자(지명·유래)');
      ok((I.s.elder.got || []).length >= 4 && (I.s.elder.got || []).includes('돌다리') && (await xp('explore')) > ex4, '들은 이름 ' + (I.s.elder.got || []).join('·') + ' · 탐험 솜씨 +'); await closeAll();
      await E('bd:board', async () => ((await panel()) || {}).k === 'bdboard'); P = await panel(); ok(P && /돌다리/.test(P.t) && / = /.test(P.t), '땅이름 이야기 판 = 들은 이름과 뜻'); await closeAll();
      await E('bd:elder', () => said('다 했단다')); ok(await waitSaid('다 했단다'), '같은 날 다시 = 「오늘 이야기는 다 했단다」');
      await E('bd:gonu', async () => ((await panel()) || {}).k === 'table'); P = await panel(); ok(P && P.k === 'table' && /고누/.test(P.t), '고누 탁자 E = 판 놀이 창(우물고누) 「' + ((P && P.t) || '-').split('\n')[0] + '」'); await closeAll(); await leave();
      // 🏺 박물관
      const mu = b3('museum')[0]; ok(await enter(mu), mu.name + ' 들어감'); I = await BI(); ok(I.cur && I.cur.k === 'museum' && I.cur.stars && I.cur.stars.every(v => !v) && [0, 1, 2, 3].every(i => I.cur.extra.some(q => q.k === 'bd:mu' + i)), '박물관 방 · 받침대 넷 E · 금빛 표 없음'); await checkRoom('박물관');
      const lk3 = await xp('look'); await E('bd:mu0', async () => ((await panel()) || {}).k === 'bdmu'); P = await panel(); ok(P && /맷돌/.test(P.t) && /1\/2/.test(P.t), 'E = 맷돌 창(1/2 쓰임)');
      await ev(() => document.querySelector('.twn-p button[data-o="0"]').click()); await W8(200); ok(/생김새/.test(((await panel()) || {}).t || ''), '틀린 답 = 생김새 힌트');
      await ev(() => document.querySelector('.twn-p button[data-o="1"]').click()); await W8(200); ok(/2\/2/.test(((await panel()) || {}).t || ''), '맞으면 = 오늘날 물음(2/2)');
      await ev(() => document.querySelector('.twn-p button[data-o="1"]').click()); await W8(300); P = await panel(); I = await BI(); ok(P && /믹서기/.test(P.t) && I.cur.stars[0] === true && (await xp('look')) > lk3, '끝 = 한 줄 · 받침대에 금빛 표 · 관찰 솜씨 +'); await closeAll();
      const lk4 = await xp('look'); await E('bd:mu3', async () => ((await panel()) || {}).k === 'bdmu'); for (let i = 0; i < 2; i++) { await ev(() => document.querySelector('.twn-p button[data-o="1"]').click()); await W8(220); } I = await BI(); ok(I.cur.stars[3] === true && (await xp('look')) === lk4, '둘째 물건 = 금빛 표 · 솜씨는 하루 한 번'); await closeAll();
      await E('bd:board', async () => ((await panel()) || {}).k === 'bdboard'); P = await panel(); ok(P && /2\/4/.test(P.t) && /전등/.test(P.t), '옛 물건 판 = 2/4 · 오늘날'); await closeAll(); await leave(); ok(await enter(mu), '다시 들어감'); I = await BI(); ok(I.cur.stars[0] && I.cur.stars[3] && !I.cur.stars[1], '다시 들어가도 금빛 표 그대로'); await leave();
      // 새 곳 모두: 들어감 · E 닿음
      { const bad = []; for (const q of L3) { if (!(await enter(q))) { bad.push(q.name + ' 못 들어감'); continue; } const c = await ev(() => SM_TOWN.indoor.check()), nh = (c.hots || []).filter(h => h.ok === false).map(h => h.label); if (!c.spawnFree || nh.length) bad.push(q.name + ' ' + (c.spawnFree ? '' : '들어간 자리 막힘 ') + nh.join('/')); await leave(); }
        ok(!bad.length, 'BLDG-3 ' + L3.length + '곳 모두 들어감 · E 닿음' + (bad.length ? ' — ' + bad.join(' | ') : '')); } }
    if (SHOTS) { const seen = {}; for (const q of L) { if (seen[q.kind]) continue; seen[q.kind] = 1; await enter(q); const R9 = await ev(() => SM_TOWN.indoor.room); if (q.kind === 'shelter') await ev(() => { const G = SM_TOWN.game().S; G.bldg.shelter.fed = G.day; }); if (q.kind === 'shelter') { await leave(); await enter(q); }
      await tpA([R9.at[0], R9.at[1], R9.at[2] + R9.D / 2 - 1.6]); await ev(a => SD2.map.player.lookAt([a[0], a[2] - 60]), R9.at); await W8(1800); await p.screenshot({ path: SHOTS + '/bldg_' + q.kind + '.png' });
      await tpA([R9.at[0] - R9.W / 2 + 1.6, R9.at[1], R9.at[2] + 0.5]); await ev(a => SD2.map.player.lookAt([a[0] + 60, a[2] - 10]), R9.at); await W8(1500); await p.screenshot({ path: SHOTS + '/bldg_' + q.kind + '_r.png' }); await leave(); } }
    // ⑨ DEPTH-1 창구 손님: 판마다 다른 사람(열 판 · 어제와 다른 갈래 · 최근 둘과 다른 손님) · 본 것으로 판단 · 틀리면 되물음 + 10분 · 도운 뒤 같은 날은 돌아감
    { console.log('⑨ 창구 손님(판마다 다른 사람)'); const LA = await ev(() => SM_TOWN.indoor.list().filter(q => ['police', 'clinic', 'bank', 'post', 'museum'].includes(q.kind))), byK = k => LA.find(q => q.kind === k);
      const DV = (await ev(() => SM_TOWN.game().S.day)) + 20, seq = (k, ids) => { const T9 = ids.map(q => String(q).split(':')[0]); const sameT = T9.filter((t, i) => i && t === T9[i - 1]).length, rep = ids.filter((q, i) => (i && q === ids[i - 1]) || (i > 1 && q === ids[i - 2])).length;
        ok(ids.length === 10 && ids.every(Boolean) && !sameT && !rep && new Set(T9).size >= 3, k + ' 열 판 손님 ' + ids.join(' ') + ' · 어제와 같은 갈래 ' + sameT + ' · 최근 둘과 같은 손님 ' + rep); };
      await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; for (const k of ['police', 'clinic', 'bank', 'post', 'museum']) if (G.bldg[k]) { delete G.bldg[k].vt; delete G.bldg[k].vh; delete G.bldg[k].vok; } });
      const pol = byK('police'); if (pol) { const ids = []; for (let i = 0; i < 10; i++) { await ev(d => { const G = SM_TOWN.game().S; G.day = d; G.min = 11 * 60; }, DV + i); if (!(await enter(pol))) { ids.push(null); continue; } const I9 = await BI(); ids.push(I9.cur && I9.cur.vis && I9.cur.vis.id); if (!i) ok(I9.cur.extra.some(q => q.k === 'bd:vis' && /찾아온 손님/.test(q.label)), '경찰서 손님 몸 + E 「' + ((I9.cur.extra.find(q => q.k === 'bd:vis') || {}).label || '-') + '」'); await leave(); } seq('경찰서(들어가서)', ids); }
      for (const k of ['clinic', 'bank', 'post', 'museum']) { if (!byK(k)) { console.log('    (이 마을엔 ' + k + ' 없음)'); continue; } const ids = await ev(([k9, d0]) => { const out = []; for (let i = 0; i < 10; i++) { const v9 = SM_TOWN.bldg().dbg.vpick(k9, d0 + i); out.push(v9 && v9.id); } return out; }, [k, DV]); seq(k, ids); }
      // 손님 하나씩 돕기(새 날 · 틀린 답 하나 → 되물음 + 10분 → 맞는 답 → 고맙다는 말 · 솜씨 + · 다시 들어가면 돌아감)
      const SK = { police: 'explore', clinic: 'work', bank: 'trade', post: 'explore', museum: 'look' }; let dd = DV + 40;
      for (const k of ['police', 'clinic', 'bank', 'post', 'museum']) { const q = byK(k); if (!q) continue; await ev(d => { const G = SM_TOWN.game().S; G.day = d; G.min = 11 * 60; }, dd++); if (!(await enter(q))) { ok(false, q.name + ' 못 들어감'); continue; }
        let I9 = await BI(); const vid = I9.cur.vis && I9.cur.vis.id; const x0 = await xp(SK[k]); ok(!!vid && I9.cur.extra.some(h => h.k === 'bd:vis'), q.name + ' 오늘 손님 ' + vid);
        if (!(await E('bd:vis', async () => ((await panel()) || {}).k === 'bdvis'))) { ok(false, q.name + ' 손님 창 안 열림'); await leave(); continue; }
        const C9 = await ev(() => SM_TOWN.bldg().dbg.vcase()), m0 = await ev(() => SM_TOWN.game().S.min); if (SHOTS) await p.screenshot({ path: SHOTS + '/vis_' + k + '.png' });
        const wrong = [...Array(C9.n).keys()].find(j => j !== C9.ans); await ev(j => document.querySelector('.twn-p button[data-v="' + j + '"]').click(), wrong); await W8(250);
        const mt = await ev(() => (document.querySelector('.twn-p [data-m]') || {}).textContent || ''), m1 = await ev(() => SM_TOWN.game().S.min);
        ok(mt.length > 10 && /10분/.test(mt) && m1 - m0 >= 10, q.name + ' 틀린 답 = 손님이 되물음 + 10분(' + m0 + ' → ' + m1 + ') 「' + mt.slice(0, 46) + '」');
        await ev(j => document.querySelector('.twn-p button[data-v="' + j + '"]').click(), C9.ans); await W8(300); const P9 = await panel(); I9 = await BI();
        ok(P9 && /✓/.test(P9.t) && I9.s[k].vok === (await ev(() => SM_TOWN.game().S.day)) && (await xp(SK[k])) > x0, q.name + ' 맞는 답 = 고맙다는 말 · 솜씨 +(' + x0 + ' → ' + (await xp(SK[k])) + ') 「' + (P9 ? P9.t.replace(/\s+/g, ' ').slice(0, 50) : '-') + '」');
        await closeAll(); await leave(); ok(await enter(q), q.name + ' 다시 들어감'); I9 = await BI(); ok(I9.cur.vis && I9.cur.vis.gone && !I9.cur.extra.some(h => h.k === 'bd:vis'), q.name + ' 같은 날 다시 = 도운 손님은 돌아감(E 없음)'); await leave(); }
      await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; }); }
    // ⑤ 들어가는 곳 모두: 들어감 · E 자리 닿음 · 할 일 E 있음
    { const bad = []; for (const q of L) { if (!(await enter(q))) { bad.push(q.name + ' 못 들어감'); continue; } const c = await ev(() => SM_TOWN.indoor.check()), I9 = await BI(), nh = (c.hots || []).filter(h => h.ok === false).map(h => h.label); if (!c.spawnFree || nh.length) bad.push(q.name + ' ' + (c.spawnFree ? '' : '들어간 자리 막힘 ') + nh.join('/')); if (!I9.cur || !I9.cur.extra.some(h => /^bd:(112|aid|feed)$/.test(h.k))) bad.push(q.name + ' 할 일 E 없음'); await leave(); }
      ok(!bad.length, '들어가는 곳 ' + L.length + '곳 모두 들어감 · E 닿음 · 할 일 E' + (bad.length ? ' — ' + bad.join(' | ') : '')); }
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); try { console.log('    info ' + JSON.stringify(await p.evaluate(() => SM_TOWN.bldg().info()))); } catch (e2) { /* 페이지 없음 */ } } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
