// 🌡 날씨 사건 시험(WXEV-1 · v2/games/town_wxev.js · 설계 docs/systems/town_wxev.md): node tools/harness/town_wxev.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 겹침: 폭염 판 동안 태풍 시작 X · 태풍 판 동안 날씨 사건 시작 X · 잔치 날이 그날이면 시작 X · 대비 중 잔치가 그날로 오면 하루 늦춤
//   ② 🥵 폭염: 예보 창 · 예보 맑음 · 어르신 안부(본 것과 다른 말 = 안 됨 · 맞는 말 둘 = 됨) · 텃밭 한낮 물 = 안 됨 / 아침 = 됨 · 알림(받기 → 붙이기) · 그늘막 북쪽 = 20분 / 남쪽 = 됨 · 물통
//      그날: 한낮 밖 = 땀·숨참(느려짐) · 쉼터 = 숨 고름 · 다음 날 결과: 한 집 = 고마움 / 못 간 집 = '다음엔' · 이웃 한 줄
//   ③ ❄️ 폭설: 모래 받기 · 제설함 둘만 · 버스 알림(틀린 글 = 안 붙음) · 그날 눈(날씨) · 더미 · 삽(제설함 채운 곳 = 한 삽 덜) · 1시 넘으면 다져져 못 치움 · 눈 위 느려짐 · 비탈에서 뛰면 미끄러짐
//      다음 날: 치운 곳 = 녹음 · 못 치운 곳 = 얼음 · 이웃 반응 다름 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|wxev/.test(t)) errs.push(t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
  const panelK = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? P.dataset.k || '' : ''; });
  const waitPanel = async k => { for (let i = 0; i < 12; i++) { const pk = await panelK(); if (pk === k) return true; if (pk) await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(700); } return false; };
  const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
  const I = () => ev(() => SM_TOWN.wxev.info()), D = async (f, a) => { if (!['talk', 'notice', 'want', 'near', 'heatSec', 'snowSec', 'result', 'finish'].includes(f)) await closeAll(); return ev(([f, a]) => SM_TOWN.wxev.dbg[f](...(a || [])), [f, a]); };
  const min = () => ev(() => SM_TOWN.game().S.min), setMin = m => ev(m => { SM_TOWN.game().S.min = m; }, m), day = () => ev(() => SM_TOWN.game().S.day);
  const sleep = async () => { const d0 = await day(); await closeAll(); await ev(() => SM_TOWN.sleep({ ask: false })); for (let i = 0; i < 30 && (await day()) === d0; i++) await W8(300); await W8(2500); await closeAll(); await W8(800); };
  const toastT = () => ev(() => (document.getElementById('toast') || {}).textContent || '');
  const J = (i, k) => i.jobs.filter(q => q.k === k);
  try {
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.wxev && SM_TOWN.typhoon, null, { timeout: 240000 }); await W8(2500); await closeAll(); await W8(1200);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 7 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; G.story.done = G.story.done || {}; G.story.done.a1_6 = 1; SM_TOWN.weather('clear'); if (G.typh) { G.typh.st = ''; G.typh.n = 0; } }); await W8(500);
    // ① 겹침
    { const sea = (await I()).sea; console.log('  계절 ' + sea);
      const fd0 = await ev(() => SM_TOWN.game().S.feast ? SM_TOWN.game().S.feast.fd : 0), d = await day();
      await ev(dd => { SM_TOWN.game().S.feast.fd = dd + 2; }, d); const w1 = await D('want'); await ev(dd => { SM_TOWN.game().S.feast.fd = dd + 12; }, d); const w2 = await D('want');
      ok(w1 === null && w2 === 'heat', '잔치가 그날(모레)이면 폭염 시작 X · 잔치가 멀면 시작 됨(' + w1 + ' · ' + w2 + ')');
      await ev(() => SM_TOWN.typhoon.start()); await closeAll(); const w3 = await D('want'); await ev(() => SM_TOWN.typhoon.dbg.finish()); const w4 = await D('want');
      ok(w3 === null && w4 === 'heat', '태풍 판 동안 날씨 사건 시작 X(' + w3 + ' → 끝난 뒤 ' + w4 + ')');
      await ev(() => { const t = SM_TOWN.game().S.typh; t.n = 0; t.last = 0; SM_TOWN.game().S.min = 7 * 60; });
      const t0 = await ev(() => SM_TOWN.typhoon.dbg.want()); await ev(() => SM_TOWN.wxev.start('heat')); await closeAll(); const t1 = await ev(() => SM_TOWN.typhoon.dbg.want());
      ok(t0 === true && t1 === false, '폭염 판 동안 태풍 시작 X(전 ' + t0 + ' · 판 동안 ' + t1 + ')');
      const a = await I(); await ev(dd => { SM_TOWN.game().S.feast.fd = dd + 2; }, a.d0); await sleep(); const b9 = await I();
      ok(b9.shift === 1 && b9.d0 === a.d0 + 1 && b9.kk === 1 && b9.dbg.some(t => /shift feast/.test(t)), '대비 중 잔치가 폭염 날로 오면 하루 늦춤(d0 ' + a.d0 + ' → ' + b9.d0 + ')');
      await D('finish'); await ev(([f]) => { SM_TOWN.game().S.feast.fd = f; }, [fd0 || (await day()) + 20]); await ev(() => { SM_TOWN.game().S.wxev.last = {}; }); }
    // ② 🥵 폭염
    await setMin(7 * 60); await ev(() => SM_TOWN.wxev.start('heat')); await W8(1800); let i0 = await I();
    console.log('  폭염 할 일: ' + i0.jobs.map(q => q.id).join(' '));
    ok(i0.kk === 1 && /폭염/.test(i0.line), '시작 = 1일째 · 할 일 줄 「' + i0.line + '」');
    ok(await waitPanel('wxfc'), '아침 라디오 폭염 예보 창'); await shot('h1_forecast'); await closeAll();
    ok((await ev(d => SM_TOWN.wxev.api.fcAt(d), i0.d0 + 2)) === 'clear' && /폭염/.test(i0.wxLine), '예보: 그날 = 맑음 · 날씨 창 한 줄 「' + i0.wxLine + '」');
        const news = await ev(() => SM_TOWN.wxev.api.news(SM_TOWN.game().S.day).map(n => n.t[0])); ok(news.length && /폭염/.test(news[0]), '아침 소식 한 줄 「' + (news[0] || '') + '」');
    const E9 = J(i0, 'elder'); ok(E9.length >= 2, '어르신 댁 둘(' + E9.length + ')');
    if (E9.length) { const q = E9[0], ADV = { cup: 'drink', field: 'noon', fan: 'shelter', coat: 'cloth' }, want = q.obs.map(o => ADV[o]), bad = ['drink', 'noon', 'shelter', 'cloth'].find(a => !want.includes(a));
      await setMin(9 * 60); await tp(q.at[0], q.at[1]); await D('talk', [q.id]); await W8(200); ok((await panelK()) === 'wxelder', '어르신 댁 창(보이는 것 ' + q.obs.join('·') + ')'); await shot('h2_elder');
      const t1 = await min(); await ev(v => document.querySelector('.twn-p button[data-v="' + v + '"]').click(), bad); await W8(150); let s9 = (await I()).jobs.find(o => o.id === q.id);
      const m1 = await ev(() => (document.querySelector('.twn-p [data-m]') || {}).textContent || ''); ok(s9.st !== 'done' && s9.mis === 1 && /본 걸/.test(m1), '본 것과 다른 말 = 안 됨 「' + m1.slice(0, 30) + '」');
      for (const v of want) { await ev(v => { const b9 = document.querySelector('.twn-p button[data-v="' + v + '"]'); if (b9) b9.click(); }, v); await W8(150); }
      s9 = (await I()).jobs.find(o => o.id === q.id); ok(s9.st === 'done' && (await min()) - t1 === 15, '본 것에 맞는 말 둘 = 안부 끝(15분)'); }
    const gd = J(i0, 'garden')[0]; ok(!!gd, '텃밭 할 일');
    if (gd) { await tp(gd.at[0], gd.at[1]); await setMin(13 * 60); await D('garden'); let g9 = (await I()).jobs.find(o => o.k === 'garden'); ok(g9.st !== 'done' && g9.mis === 1 && (await I()).dbg.some(t => /water bad/.test(t)), '한낮(13시)에 물 = 안 됨(뿌리까지 못 감)');
      await setMin(7 * 60 + 30); await D('tap', ['can-bed']); g9 = (await I()).jobs.find(o => o.k === 'garden'); ok(g9.st === 'done', '아침에 물뿌리개(도구 띠 can-bed) = 됨'); }
    const ps = J(i0, 'post')[0], pa = J(i0, 'paper')[0]; ok(!!ps && !!pa, '무더위 쉼터 알림(받기 · 붙이기)');
    if (ps && pa) { await setMin(9 * 60); await tp(ps.at[0], ps.at[1]); await D('post'); ok((await I()).jobs.find(o => o.k === 'post').st !== 'done' && (await I()).dbg.some(t => /post nopaper/.test(t)), '알림 받기 전엔 못 붙임'); await tp(pa.at[0], pa.at[1]); await D('desk', ['paper']); await tp(ps.at[0], ps.at[1]); await D('post'); ok((await I()).jobs.find(o => o.k === 'post').st === 'done', '받아서 쉼터 게시판에 붙임'); }
    const sh = J(i0, 'shade')[0]; ok(!!sh, '목장 그늘막');
    if (sh) { await tp(sh.spots[1][0], sh.spots[1][1]); const t1 = await min(); await D('shade', [1]); const t2 = await min(); let s9 = (await I()).jobs.find(o => o.k === 'shade'); ok(s9.st !== 'done' && t2 - t1 === 20 && s9.mis === 1, '북쪽 그늘막 = 20분 더 · 안 됨');
      await tp(sh.spots[0][0], sh.spots[0][1]); await D('shade', [0]); s9 = (await I()).jobs.find(o => o.k === 'shade'); ok(s9.st === 'done', '남쪽(한낮 해 쪽) = 됨'); await D('trough'); ok((await I()).jobs.find(o => o.k === 'trough').st === 'done', '물통 채움'); }
    await sleep(); { const tasks = await ev(() => (SM_TOWN.game().S.tasks || { list: [] }).list.map(t => t.ev)); ok(tasks.includes('wxev'), '2일째 오늘 할 일 ⑤ = 폭염 대비(' + tasks.join(',') + ')'); }
    // 그날(3일째)
    await sleep(); i0 = await I(); ok(i0.kk === 3, '3일째 = 폭염 날(' + i0.kk + ')'); ok(await waitPanel('wxday'), '폭염 날 창'); await closeAll();
    await setMin(13 * 60); const gl = await ev(() => SM_TOWN.wxev.api.goal()); ok(/폭염/.test(gl), '위 가운데 줄 「' + gl + '」');
    { let spot = null; for (const [dx, dz] of [[0, 26], [30, 30], [-30, 30], [60, 10], [-60, 10], [0, 70]]) { await tp(16.5 + dx, 50 + dz); await ev(() => { const s = SM_TOWN.game().S.wxev.cur; s.body.t = 0; s.body.tired = 0; }); for (let k = 0; k < 27; k++) await D('heatSec'); const b9 = (await I()).body; if (b9.tired) { spot = [dx, dz]; break; } }
      const i9 = await I(), tt = await toastT(); ok(!!spot && i9.slow && i9.dbg.includes('tired'), '한낮 밖에 오래 = 땀·숨참 + 느려짐(자리 ' + JSON.stringify(spot) + ')');
      const s0 = i9.jobs.find(o => o.k === 'post'); const shl = await ev(() => SM_TOWN.game().S.wxev.cur.shelter); if (shl) { await tp(shl.at[0] + 1, shl.at[1] + 1); await D('heatSec'); const i8 = await I(); ok(i8.body.rest === 1 && !i8.body.tired && !i8.slow, '무더위 쉼터 = 숨 고름 · 빠르기 돌아옴'); } void s0; }
    await sleep(); i0 = await I(); ok(i0.kk === 4 && !!i0.res, '4일째 = 결과'); ok(await waitPanel('wxres'), '폭염이 지나간 아침 창'); await shot('h3_after'); await closeAll(); i0 = await I();
    console.log('  폭염 결과: ' + i0.res.L.map(o => (o.ok ? '○' : '×') + o.k).join(' '));
    { const el = i0.res.L.filter(o => o.k === 'elder'); ok(el.length >= 2 && el.some(o => o.ok) && el.some(o => !o.ok) && el[0].t[0] !== el[1].t[0], '어르신: 들른 집과 못 간 집 결과가 다름'); }
    { const M = Object.values(i0.mem).filter(m => m.j === 'elder'); ok(M.some(m => m.k === 'thx') && M.some(m => m.k === 'next'), '이웃 기억 = 고마움 · 다음엔');
      const miss = i0.jobs.find(q => q.k === 'elder' && q.st !== 'done'); if (miss) { await tp(miss.at[0] + 1, miss.at[1] + 1); await W8(2600); ok(/다음엔/.test(await toastT()), '못 간 어르신 곁 = 「다음엔…」 한 줄 — ' + (await toastT()).slice(0, 40)); } }
    ok(i0.res.L.find(o => o.k === 'body').ok === 1, '한낮에 쉼터에서 쉼 = 몸 줄 맞음');
    await D('finish');
    // ③ ❄️ 폭설
    await ev(() => { SM_TOWN.game().setCal(false, 'winter'); SM_TOWN.season('winter'); }); for (let i = 0; i < 40 && (await I()).sea !== 'winter'; i++) await W8(500); await W8(2500); await closeAll(); ok((await I()).sea === 'winter', '계절 = 겨울');
    await setMin(7 * 60); await ev(() => SM_TOWN.wxev.start('snow')); await W8(1800); i0 = await I(); console.log('  폭설 할 일: ' + i0.jobs.map(q => q.id + (q.w ? ':' + q.w : '')).join(' ') + ' · 비탈 ' + JSON.stringify(i0.jobs.find(q => q.w === 'slope')));
    ok(await waitPanel('wxfc'), '폭설 예보 창'); await closeAll(); ok((await ev(d => SM_TOWN.wxev.api.fcAt(d), i0.d0 + 1)) === 'snow' && /큰눈/.test(i0.wxLine), '예보: 내일 = 눈 · 「' + i0.wxLine + '」');
    const CL = J(i0, 'clear'); ok(CL.length >= 4 && CL.some(q => q.w === 'slope') && CL.some(q => q.w === 'stop') && CL.some(q => q.w === 'school'), '눈 치울 곳(비탈·정류장·학교 길 + 덜 급한 곳) ' + CL.map(q => q.w).join(','));
    const BX = J(i0, 'box'); ok(BX.length >= 2, '제설함 ' + BX.length);
    if (BX.length) { await tp(BX[0].at[0], BX[0].at[1]); await D('box', [BX[0].id]); ok(!(await I()).jobs.find(o => o.id === BX[0].id).full && /모래/.test(await toastT()), '모래 없이 제설함 X'); }
    await setMin(9 * 60); { const bg = J(i0, 'bags')[0]; if (bg) await tp(bg.at[0], bg.at[1]); } await D('desk', ['bags']); ok((await I()).bags === 2, '제설 모래 두 자루'); await D('desk', ['bags']); ok(/오늘 몫/.test(await toastT()), '하루 몫은 두 자루');
    for (const w of ['slope', 'stop']) { const q = BX.find(o => o.w === w); if (q) { await tp(q.at[0], q.at[1]); await D('box', [q.id]); } } i0 = await I(); ok(J(i0, 'box').filter(o => o.full).length === 2 && i0.bags === 0, '비탈·정류장 제설함만 채움(골목은 비움)');
    const nt = J(i0, 'notice')[0]; if (nt) { await tp(nt.at[0], nt.at[1]); await D('notice'); await W8(200); ok((await panelK()) === 'wxnote', '정류장 알림 창');
      await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-i]')]; const b9 = B.find(x => /늘 오던|가운데/.test(x.textContent)); b9.click(); }); await W8(150); const m1 = await ev(() => (document.querySelector('.twn-p [data-m]') || {}).textContent || '');
      ok((await I()).jobs.find(o => o.k === 'notice').st !== 'done' && m1.length > 5, '예보와 다른 알림 = 안 붙음 「' + m1.slice(0, 26) + '」');
      await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-i]')]; const b9 = B.find(x => /늦거나 쉴/.test(x.textContent)); b9.click(); }); await W8(200); ok((await I()).jobs.find(o => o.k === 'notice').st === 'done', '예보대로 알림 = 붙음'); }
    else ok(false, '정류장이 없음');
    const dw = await ev(() => SM_TOWN.dayx().waits({ day: SM_TOWN.game().S.day }, true).map(w => w.k + ':' + w.t[0])); ok(dw.some(w => /^wxev:/.test(w) && /큰눈/.test(w)), "하루 마무리 '내일 기다리는 것' = 큰눈 — " + dw.slice(0, 3).join(' / '));
    // 그날(2일째)
    await sleep(); i0 = await I(); ok(i0.kk === 2, '2일째 = 폭설 날'); ok(await waitPanel('wxday'), '폭설 날 창'); await closeAll(); await W8(1200);
    { let w9 = ''; for (let i = 0; i < 8 && w9 !== 'snow'; i++) { w9 = await ev(() => SM_TOWN.wx().WX9); if (w9 !== 'snow') await W8(600); } ok(w9 === 'snow', '날씨 = 눈(' + w9 + ')'); } i0 = await I(); ok(i0.vis >= 5 && i0.hot.some(h => /⛏/.test(h)), '눈 더미 · ⛏ 자리(모습 ' + i0.vis + ')');
    const rows = await ev(() => SM_TOWN.wxev.api.dayRows(SM_TOWN.game().S.day).map(r => r.g)); ok(rows.includes('wxsnow'), '하루 계획 줄 = 눈 치우기');
    const slope = i0.jobs.find(q => q.w === 'slope'), stop = i0.jobs.find(q => q.w === 'stop'), sch = i0.jobs.find(q => q.w === 'school'), rest = i0.jobs.filter(q => q.k === 'clear' && !q.imp);
    if (SHOTS && slope) { await tp(slope.at[0] - 5, slope.at[1] + 5); await ev(([x, z]) => SD2.map.player.lookAt([x, z]), slope.at); await W8(2500); await shot('s1_snowday'); }
    await setMin(8 * 60); const t8 = await min();
    { const n9 = await D('near', [slope.at[0] + 0.5, slope.at[1], 'shovel']); ok(!!n9 && n9.id === slope.id && !(await D('near', [slope.at[0], slope.at[1], 'can'])), '도구 띠 손잡이: 삽·빗자루로 겨누면 눈 더미에 붙음(물뿌리개 X)'); }
    await tp(slope.at[0], slope.at[1]); await ev(id => SM_TOWN.wxev.api.tool.use('shovel', id), slope.id); await ev(id => SM_TOWN.wxev.api.tool.use('broom', id), slope.id); i0 = await I();
    { const dt = (await min()) - t8, n9 = i0.dbg.filter(t => t.startsWith('stroke ' + slope.id + ' ')).length; ok(i0.jobs.find(q => q.id === slope.id).st === 'done' && n9 === 2 && dt >= 50 && dt < 58, '비탈(제설함 채움) = 두 번에 끝(삽 ' + n9 + '번 · ' + dt + '분 — 걷는 사이 시계 포함)'); }
    await tp(stop.at[0], stop.at[1]); for (let k = 0; k < 2; k++) await D('stroke', [stop.id]); await tp(sch.at[0], sch.at[1]); for (let k = 0; k < 2; k++) await D('stroke', [sch.id]); i0 = await I();
    ok(i0.jobs.find(q => q.id === stop.id).st === 'done' && i0.jobs.find(q => q.id === sch.id).st !== 'done' && i0.jobs.find(q => q.id === sch.id).left === 1, '제설함 없는 학교 길은 세 번이 들어 아직 남음');
    await D('stroke', [sch.id]); ok((await I()).jobs.find(q => q.id === sch.id).st === 'done', '학교 길 다 치움');
    if (rest[0]) { await tp(rest[0].at[0], rest[0].at[1]); await D('snowSec'); ok((await I()).slow === true, '안 치운 눈 위 = 느려짐'); await tp(slope.at[0], slope.at[1]); await D('snowSec'); ok((await I()).slow === false, '치운 길 = 빠르기 그대로');
      await setMin(13 * 60 + 5); await tp(rest[0].at[0], rest[0].at[1]); const r9 = await D('stroke', [rest[0].id]); ok(r9 === false && /다져/.test(await toastT()), '낮 1시 넘음 = 다져져 못 치움'); }
    { const sp = await ev(([x, z]) => { const g = (a, b) => SD2.map.q.groundAt(a, b, SM_TOWN.ground(a, b) + 2); let best = null; for (let a = 0; a < 16; a++) { const dx = Math.cos(a * 0.3927) * 7, dz = Math.sin(a * 0.3927) * 7; const r = Math.abs(g(x + dx, z + dz) - g(x, z)) / 7; if (!best || r > best[2]) best = [dx, dz, r]; } return best; }, slope.at);
      console.log('  비탈 7m 기울기 ' + sp[2].toFixed(3)); await tp(slope.at[0], slope.at[1]); await D('snowSec'); await D('snowSec'); await tp(slope.at[0] + sp[0], slope.at[1] + sp[1]); const s0 = (await I()).slip; await D('snowSec'); const s1 = (await I()).slip;
      ok(sp[2] < 0.1 || s1 === s0 + 1 && (await I()).dbg.includes('slip'), '눈 쌓인 비탈에서 뛰면 미끄러짐 + 「천천히」(' + s0 + '→' + s1 + ')'); }
    // 결과(3일째)
    await sleep(); i0 = await I(); ok(i0.kk === 3 && !!i0.res, '3일째 = 결과'); ok(await waitPanel('wxres'), '폭설이 지나간 아침 창'); await shot('s2_after'); await closeAll(); i0 = await I();
    console.log('  폭설 결과: ' + i0.res.L.map(o => (o.ok ? '○' : '×') + o.k + (o.imp ? '!' : '')).join(' '));
    { const C9 = i0.res.L.filter(o => o.k === 'clear'), y = C9.find(o => o.ok), n = C9.find(o => !o.ok); ok(!!y && !!n && /녹아/.test(y.t[0]) && /얼었/.test(n.t[0]), '치운 곳 = 녹아 있음 · 못 치운 곳 = 얼음(결과가 다름)'); }
    ok(i0.vis >= C9n(i0), '세상에 녹은 자리·얼음 자리'); function C9n(i) { return i.jobs.filter(q => q.k === 'clear').length; }
    { const bx = i0.res.L.filter(o => o.k === 'box'); ok(bx.length >= 2 && bx.every(o => o.ok), '채운 제설함 = 덜 미끄러웠어요'); ok(i0.res.L.find(o => o.k === 'notice').ok === 1, '버스 알림 = 미리 걸어감'); }
    { const M = Object.values(i0.mem).filter(m => m.j === 'clear'); ok(M.length >= 3 && M.every(m => m.k === 'thx'), '급한 곳을 다 치움 = 이웃 고마움'); }
    // 놓침 판: 새 판에서 아무것도 안 하고 결과
    await D('finish'); await setMin(7 * 60); await ev(() => SM_TOWN.wxev.start('snow')); await closeAll(); await ev(() => { const c9 = SM_TOWN.game().S.wxev.cur; c9.d0 = SM_TOWN.game().S.day - 2; c9.fc = c9.said.ev = SM_TOWN.game().S.day; SM_TOWN.game().mark(); }); await D('result'); await W8(1500); await closeAll(); const i2 = await I();
    const C2 = i2.res.L.filter(o => o.k === 'clear'); ok(C2.length && C2.every(o => !o.ok) && Object.values(i2.mem).filter(m => m.n === i2.n && m.j === 'clear').every(m => m.k === 'next'), '안 치운 판 = 모두 얼음 · 이웃 「다음엔 여기부터」');
    await D('finish');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { ok(false, '시험 중 오류: ' + (e && e.message ? e.message.slice(0, 300) : e)); }
  await b.close(); console.log(fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
