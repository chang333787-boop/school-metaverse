// 🎉 마을 잔치 시험(FEAST-1 · v2/games/town_feast.js): node tools/harness/town_feast.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬 · 잔치 날 낮·밤 캡처 + 사진 찍기)]
//   ① 새 저장 = 잔치 날 14일째 · '잔치까지 열세 밤'(낱말 · 숫자 X) · 잔치 마당 게시판이 장면에 · 달력(날씨 창)·아침 소식·하루 마무리 손잡이에 잔치 줄 · 수첩 🎉 잔치 탭
//   ② 이미 있는 기록이 갈래로: GAME.tally·REC.add(요리·꾸러미·장구·우체국·사건 수첩) → 보탬 · 하루 두 번까지(셋째는 안 셈) · 두 번 = 한 단계 = 그 갈래 물건이 잔치 마당에 생김(배너 한 줄)
//   ③ 여러 날 준비 → 음식 셋 · 꾸미기 셋 · 공연 둘 · 손님맞이 하나 · 안전 0 · 게시판 가방 드리기(솔방울) = 꾸미기 보탬 · 창 글에 숫자·% 0
//   ④ 잔치 날 10:30 = 일꾼이 잔치 마당에 모임 · 무대·상 E · 게시판 E = 📷 · 안전 = 빈 자리(물건 0) · 가까이 가면 이웃 말(잘한 것 · '다음 잔치엔…') · 무대 장단 = 손뼉 · 음식 나누기
//   ⑤ 밤 = 줄 등 켜짐(주황) · 야시장이 있으면 등불 길 · ⑥ 다음 날 = 지난 잔치 판 · 물건 치움 · 다음 잔치 날 +14 · 주제가 계절대로 · 아침 소식 '어제 잔치'
//   ⑦ 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const page = async vw => { const c = await b.newContext({ viewport: { width: vw[0], height: vw[1] } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|feast tap/.test(t)) errs.push(t.slice(0, 200)); }); return p; };
  const boot = async p => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.feast && SM_TOWN.feast(), null, { timeout: 240000 }); await p.waitForTimeout(1500); };
  const closeAll = async p => { for (let i = 0; i < 8; i++) { if (!await p.evaluate(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(200); if (await p.evaluate(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); } } };
  const shot = async (p, n) => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('  📷 ' + SHOTS + '/' + n + '.png'); };
  try { const p = await page([1280, 720]), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await boot(p); await closeAll(p); await W8(800);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(400);
    const F = () => ev(() => SM_TOWN.feast().info()), sec = async (n = 2) => { for (let i = 0; i < n; i++) { await closeAll(p); await ev(() => SM_TOWN.feast().sec(true)); await W8(80); } };
    const ban = () => ev(() => (document.getElementById('hudBan') || {}).textContent || '');
    const setDay = async d => { await ev(d => { const G = SM_TOWN.game(); G.S.day = d; G.mark(); }, d); await sec(2); };
    // ① 새 저장
    await sec(3); let I = await F(); console.log('  새 저장: ' + JSON.stringify({ fd: I.fd, day: I.day, left: I.left, th: I.th, site: I.site, vis: I.vis }));
    ok(I.fd === Math.max(14, I.day + 7) && I.n === 0 && I.prep, '잔치 날 = 14일째(첫 판) · 준비 중 · 주제 ' + I.th);
    ok(!!I.site && I.vis.includes('board') && I.vat.board[0][3], '잔치 마당 자리 ' + JSON.stringify(I.site) + ' · 게시판이 장면에');
    const cal = await ev(() => SM_TOWN.feast().calLine()), nw = await ev(d => SM_TOWN.feast().news(d), I.day), wt = await ev(d => SM_TOWN.feast().wait(d), I.fd - 3);
    ok(/까지 열세 밤/.test(cal) && !/\d/.test(cal), '달력 줄 = 「' + cal + '」(숫자 0)'); ok(nw.length === 1 && /까지 열세 밤/.test(nw[0].t[0]) && !!nw[0].at, '아침 소식 줄 = 「' + (nw[0] && nw[0].t[0]) + '」 + 자리');
    ok(wt && /세 밤/.test(wt.t[0]) && wt.p && wt.p.door, '하루 마무리 「내일 기다리는 것」(잔치 사흘 전) = 「' + (wt && wt.t[0]) + '」 + 빨간 선 자리');
    // ② 이미 있는 기록 → 갈래 · 하루 두 번까지
    await ev(() => { SM_TOWN.game().tally('cooked'); }); I = await F(); ok(I.lv.food === 1 && !I.vis.includes('food:0'), '요리하기(GAME.tally cooked) = 잔치 음식 보탬 하나(아직 물건 X)');
    await ev(() => { SM_TOWN.game().tally('shared'); }); await W8(150); I = await F(); const b1 = await ban();
    ok(I.lv.food === 2 && I.st.food === 1 && I.vis.includes('food:0') && I.vat['food:0'][0][3], '나눠 주기 = 둘째 보탬 → 한 단계 → 긴 잔칫상이 장면에 ' + JSON.stringify(I.vat['food:0']));
    ok(/잔칫상/.test(b1), '배너 한 줄 = 「' + b1 + '」');
    await ev(() => { SM_TOWN.game().tally('cooked'); }); I = await F(); ok(I.lv.food === 2 && I.dc.b.food === 2, '같은 날 셋째 = 안 셈(하루 두 번까지 · 조급함)');
    const REC = (k, o) => ev(([k, o]) => SM_TOWN.rec ? SM_TOWN.rec().add(k, o) : null, [k, o]);
    const recOk = await ev(() => !!(SM_TOWN.rec && SM_TOWN.rec().add)); ok(recOk, 'SM_TOWN.rec().add 있음');
    const g0 = (await F()).lv.guest | 0;   /* OPEN-1: 첫 아침 = 우리 집 칸(새 칸)에서 시작 → 그날 '새 칸 가 보기' 손님맞이 하나가 먼저 있을 수 있음 */
    await REC('bun2', { ev: 'fill', id: 'spring' }); await REC('bun2', { ev: 'fill', id: 'summer' }); await REC('janggu', { lv: 0, s: 2 }); await REC('busk', { why: '', n: 2 }); await REC('bldg', { k: 'post', ev: 'send', e: '🍓' }); await REC('case', { id: 'zz', ev: 'clue', k: 'a' });
    I = await F(); ok(I.st.deco === 1 && I.st.show === 1 && I.lv.guest === g0 + 1 && I.lv.safe === 0, '꾸러미 채우기 → 꾸미기 · 장구 한 판·들려주기 → 공연 · 소포 → 손님맞이 · 사건 단서(끝 아님) → 안 셈 ' + JSON.stringify(I.lv));
    ok(I.vis.includes('deco:0') && I.vis.includes('show:0'), '현수막 · 낮은 무대가 장면에');
    // ③ 여러 날 준비
    for (const d of [1, 2]) { await setDay(I.day + d);
      await ev(() => { const G = SM_TOWN.game(); G.tally('cooked'); G.tally('farmW'); }); await REC('bun2', { ev: 'fill', id: 'forest' }); await REC('bldg', { k: 'post', ev: 'send', e: '🍓' });
      if (d === 1) { await REC('table', { g: 'gonu', ph: 'end', lv: 1, win: true }); await REC('job', { k: 'rhy:mo', lv: 1, stars: 2 }); await REC('bun2', { ev: 'fill', id: 'winter' }); } }
    await ev(() => { const G = SM_TOWN.game(); G.S.bag['🌰'] = 2; G.mark(); }); await ev(() => { const P = SM_TOWN.feast().dbg.at(-6.5, 10.4); SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); });
    await ev(() => SM_TOWN.feast().open(true)); await W8(300);
    const PT = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? { rows: P9.querySelectorAll('.fst-row').length, txt: [...P9.querySelectorAll('.fst-row,.sm')].map(e => e.textContent).join(' | '), give: !!P9.querySelector('[data-gb="deco"]'), tab: [...P9.querySelectorAll('.nb-tabs button')].map(b => b.textContent).join(',') } : null; });
    ok(PT && PT.rows === 5 && !/\d|%/.test(PT.txt.replace(/112/g, '')), '게시판 창 = 다섯 갈래 · 글에 숫자·% 0(112 신고 말고)'); ok(PT && /잔치/.test(PT.tab), '수첩 탭 줄에 🎉 잔치 (' + (PT && PT.tab) + ')');
    const SL = await ev(() => { const q = document.querySelector('.twn-p .fst-story'); return q ? q.textContent : ''; }); ok(/프롤로그 쪽지가 도우미를 찾던 그 첫 잔치/.test(SL) && /밤 남았어요/.test(SL), '창 맨 위 이야기 관계 줄(STORYF-1) = 「' + SL + '」');
    const dl0 = (await F()).lv.deco; await ev(() => { const b9 = document.querySelector('.twn-p [data-gb="deco"]'); if (b9) b9.click(); }); await W8(300); I = await F();
    ok(PT && PT.give && I.lv.deco === dl0 + 1 && (await ev(() => SM_TOWN.game().S.bag['🌰'] | 0)) === 1, '게시판에 솔방울 드리기 = 꾸미기 보탬 · 가방에서 하나 빠짐');
    await shot(p, '01_board_panel'); await closeAll(p);
    I = await F(); console.log('  준비 뒤: ' + JSON.stringify(I.st) + ' · ' + JSON.stringify(I.lv));
    ok(I.st.food === 3 && I.st.deco === 3 && I.st.show === 2 && I.st.guest >= 1 && I.st.safe === 0, '음식 셋 · 꾸미기 셋 · 공연 둘 · 손님맞이 하나 넘게 · 안전 0');
    ok(['food:2', 'deco:2', 'show:1', 'guest:0'].every(id => I.vis.includes(id)) && !I.vis.some(id => /^safe:/.test(id)), '갈래마다 단계만큼 물건(천막 · 꽃 화분 · 차양 · 안내판) · 안전 물건 0');
    { const NW = []; for (let k = 0; k < 5; k++) { const q = await ev(d => SM_TOWN.feast().news(d), I.day + k); if (q[0] && I.day + k < I.fd) NW.push(q[0].t[0]); } ok(NW.length && NW.every(t => !/식당 요리사|정원사/.test(t)), '다 선 갈래(음식·꾸미기)는 아침 소식이 권하지 않음(닷새 돌아가며) ' + JSON.stringify(NW.slice(0, 2))); }
    const dr = await ev(d => SM_TOWN.feast().dayRow(d), I.day); ok(dr && /잔치 준비/.test(dr[2]), '하루 마무리 「오늘」 줄 = ' + (dr && dr[3]));
    // ④ 잔치 날
    await setDay(I.fd); await ev(() => { SM_TOWN.game().S.min = 10 * 60 + 30; }); await sec(3); await W8(1200);
    I = await F(); const FP = await ev(() => SM_TOWN.feastP());
    ok(I.on && !I.prep && FP.length >= 5, '잔치 날 10:30 = 잔치 중 · 준비 닫힘 · 일꾼 ' + FP.length + '명 모임');
    ok(!!I.hot.food && !!I.hot.show && /사진/.test(I.hot.board), 'E: ' + JSON.stringify(I.hot));
    ok(FP.every(([, x, z]) => Math.hypot(x - I.site[0], z - I.site[1]) < 16), '모인 자리 = 잔치 마당 안');
    await ev(() => { const P = SM_TOWN.feast().dbg.at(0, 4); SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); }); await sec(2); I = await F(); ok(I.fx.met === 1, '가까이 가면 이웃 말(잘한 것 · 다음 잔치엔…)');
    await W8(4600); const lg = await ev(() => SM_TOWN.feast().dbg.log()); ok(lg.some(t => /^gather/.test(t)), '모이기 기록 ' + lg.filter(t => /gather|met/.test(t)).join(' '));
    await ev(() => { const G = SM_TOWN.game().S; G.feast.fx.want = G.day; }); await REC('janggu', { lv: 0, s: 3 }); I = await F(); const b2 = await ban(); ok(I.fx.show === 1 && /손뼉/.test(b2), '무대 장단 = 손뼉 배너 「' + b2 + '」');
    { const p9 = ev(() => SM_TOWN.feast().info().hot.food && null); await p9; await ev(() => { const G = SM_TOWN.game(); G.S.bag['🍙'] = 1; G.mark(); });
      await ev(() => { SM_TOWN.feast().dbg.share(); }); await W8(500);
      for (let i = 0; i < 10; i++) { const st = await ev(() => { const d = document.querySelector('.twn-dlg'); if (!d) return 'none'; const c = d.querySelector('.ch button'); if (c) { c.click(); return 'ch'; } const bx = d.querySelector('.dbox'); if (bx) bx.click(); return 'pg'; }); if (st === 'none') break; await W8(350); }
      await W8(400); I = await F(); ok(I.fx.ate === 1 && (await ev(() => SM_TOWN.game().S.bag['🍙'] | 0)) === 0, '잔치 음식 나누기 E = 대화 → 가방 주먹밥 한 접시 상에 · 나눔 표시'); }
    const shotAt = async (n, lx, lz, tx, tz) => { if (!SHOTS) return; await closeAll(p); await ev(([lx, lz, tx, tz]) => { const F9 = SM_TOWN.feast().dbg, P = F9.at(lx, lz), T = F9.at(tx, tz); SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); SD2.map.player.face(Math.atan2(T[0] - P[0], -(T[1] - P[1])) * 180 / Math.PI); }, [lx, lz, tx, tz]); await W8(2200); await shot(p, n); };
    await ev(() => { SM_TOWN.game().S.min = 12 * 60; }); await sec(1);
    await shotAt('02_feast_day_front', 0, 16, 0, -4); await shotAt('03_feast_day_side', 15, 12, -2, -3);
    // ⑤ 밤
    await ev(() => { SM_TOWN.game().S.min = 20 * 60 + 30; }); await sec(3); await W8(800); I = await F();
    ok(I.lit === true && I.on, '밤 = 줄 등 켜짐 · 잔치 그대로'); console.log('  야시장 등불 길: ' + I.nln + '개' + (I.nln ? '' : '(이 마을 야시장 자리 없음 · 멀면 안 켬)'));
    await W8(SHOTS ? 4000 : 0); await shotAt('04_feast_night', 14, 11, -2, -3); await shotAt('05_feast_night_front', 0, 16, 0, -4);
    if (SHOTS && RENDER) { await closeAll(p); const r9 = await ev(() => new Promise(res => { const q = SM_TOWN.feast().dbg.photo(); if (!q) return res('없음 ' + SM_TOWN.feast().dbg.log().slice(-3).join(' / ')); q.then(v => res(v ? 'ok ' + v.w : 'null')); setTimeout(() => res('시간 넘음'), 9000); })); await W8(400); I = await F(); ok(I.fx.ph === 1, '📷 올해 잔치 사진 = 이 기기 앨범에 저장(' + r9 + ')'); }
    // ⑥ 다음 날
    const fd0 = I.fd; await setDay(fd0 + 1); await ev(() => { SM_TOWN.game().S.min = 8 * 60; }); await sec(2); I = await F();
    const P0 = I.past[I.past.length - 1] || {}; console.log('  지난 잔치: ' + JSON.stringify(P0) + ' · 다음 ' + I.fd + ' ' + I.th);
    ok(I.n === 1 && I.past.length === 1 && P0.st && P0.st.food === 3 && P0.st.safe === 0 && P0.met === 1 && P0.show === 1 && P0.ate === 1, '지난 잔치 기록(준비한 것 · 만남 · 공연 · 나눔)');
    ok(I.fd === fd0 + 14 && I.prep && I.lv.food === 2 && I.lv.deco === 2 && I.lv.show === 2 && I.lv.safe === 0 && I.lv.guest === ((P0.st || {}).guest >= 2 ? 2 : 0) && !!I.gu, '다음 잔치 = +14일 · 두 단계 넘게 세운 갈래만 한 단계에서 시작(AFTER-1) · 손님 ' + I.gu + ' ' + JSON.stringify(I.lv));
    const seaN = await ev(d => SM_TOWN.game().seasonAt(d), I.fd), thW = { spring: 'flower', summer: 'homi', now: 'homi', autumn: 'harvest', winter: 'dongji' }[seaN];
    ok(I.th === thW, '다음 잔치 주제 = 그 날 계절(' + seaN + ') → ' + I.th);
    ok(I.vis.includes('plaque') && I.vis.includes('mem') && ['food:0', 'deco:0', 'show:0'].every(id => I.vis.includes(id)) && !I.vis.some(id => /^(food|deco|show|guest|safe):[12]/.test(id)) && !I.vis.includes('safe:0'), '잔치 물건 = 첫 물건만 남고 치움(AFTER-1) · 지난 잔치 판 · 기념 나무 ' + JSON.stringify(I.vis));
    // ⑦ 실내 부탁(ent) → 갈래 · 다섯 갈래가 다 서면 '준비 끝'(코덱스 10-27)
    { const l0 = (await F()).lv; await REC('ent', { k: 'pharmacy', mis: 0 }); await REC('ent', { k: 'bibim', mis: 1 }); await REC('ent', { k: 'shoes', mis: 0 }); const l1 = (await F()).lv;
      ok(l1.safe === l0.safe + 1 && l1.food === l0.food + 1 && l1.guest === l0.guest && l1.deco === l0.deco, '실내 부탁: 약국 → 안전 · 식당 → 음식 · 신발 가게 → 안 셈 ' + JSON.stringify(l1)); }
    await ev(() => { const G = SM_TOWN.game(); for (const b of ['food', 'deco', 'show', 'guest', 'safe']) G.S.feast.lv[b] = 6; G.S.feast.ann = -1; G.S.min = 7 * 60; G.mark(); }); let TX = ''; for (let i = 0; i < 20; i++) { TX += ' ' + await ev(() => (document.getElementById('toast') || {}).textContent || ''); await W8(400); }
    { const nw3 = await ev(d => SM_TOWN.feast().news(d), I.day + 1), wt3 = await ev(d => SM_TOWN.feast().wait(d), I.fd - 3), tx = TX, lg3 = (await ev(() => SM_TOWN.feast().dbg.log())).filter(t => /^notice/.test(t)).slice(-1)[0] || '';
      ok(nw3[0] && /준비는 다 끝났어요/.test(nw3[0].t[0]) && wt3 && /준비는 다 끝났어요/.test(wt3.t[0]), '다 끝남: 아침 소식·내일 기다리는 것 = 「' + (nw3[0] && nw3[0].t[0]) + '」');
      ok(/준비 끝! 이제 잔칫날을 기다려요/.test(tx) && !/맡긴 .*(해 볼까요)/.test(tx), '다 끝남: 아침 알림 = 준비 끝 · 다시 준비를 권하지 않음(' + lg3 + ')');
      await closeAll(p); await ev(() => SM_TOWN.feast().open(false)); await W8(300); const h9 = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? (P9.querySelector('.fst-story') || {}).textContent + ' | ' + (P9.querySelector('.sm') || {}).textContent : ''; });
      ok(/두 이레마다/.test(h9) && /준비 끝! 다섯 갈래가 다/.test(h9), '다 끝남: 창 머리 = 「' + h9 + '」'); await closeAll(p); }
    const nw2 = await ev(d => SM_TOWN.feast().news(d), I.day); ok(nw2.length && /어제 잔치/.test(nw2[0].t[0]), '아침 소식 = 「' + (nw2[0] && nw2[0].t[0]) + '」');
    const cal2 = await ev(() => SM_TOWN.feast().calLine()); ok(!/첫 마을/.test(cal2) && /잔치까지/.test(cal2), '달력 = 다음 잔치 「' + cal2 + '」');
    // 그 밖: 태풍 날 = 하루 미룸 · 순수 표
    const sm = await ev(async () => { const M = await import('/v2/games/town_feast.js?v=1'); return [M.srcOf('job', { k: 'bake', ph: 'order-end' }), M.srcOf('job', { k: 'passreq', ph: 'done' }), M.srcOf('emerg', { ev: 'done' }), M.srcOf('emerg', { ev: 'call' }), M.srcOf('night', { k: 'patrol' }), M.srcOf('bldg', { k: 'police', ev: '112' }), M.nightsW(13), M.nightsW(1), M.nightsW(0), M.srcOf('ent', { k: 'flower' }), M.srcOf('ent', { k: 'piano' }), M.srcOf('ent', { k: 'realty' }), M.srcOf('ent', { k: 'noodle' }), M.srcOf('ent', { k: 'via:clinic' }), M.srcOf('ent', { k: 'optician' })]; });
    ok(JSON.stringify(sm) === JSON.stringify(['food', 'guest', 'safe', null, 'safe', 'safe', '열세 밤', '한 밤', '오늘', 'deco', 'show', 'guest', 'food', 'safe', null]), '기록 → 갈래 표 · 남은 밤 낱말 ' + JSON.stringify(sm));
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
    await p.context().close();
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
