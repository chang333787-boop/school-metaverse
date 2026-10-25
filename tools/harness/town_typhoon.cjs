// 🌀 태풍이 온다 시험(TYPH-1 · v2/games/town_typhoon.js · 설계 docs/systems/town_typhoon.md): node tools/harness/town_typhoon.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 예보(라디오 창 · 날씨 창 한 줄 · 예보 = 태풍 날 비) → 소문(지나가는 이웃 말 · 사실/생각 나누기)
//   ② 부탁 넷 이상 · 하루에 다 못 함(끈 모자람 · 시간 셈) · 무거운 일 = 체력 칸이 모자라 숨 고르기(분) · 자리 판단이 틀리면 30분
//   ③ 대피 길: 강가 낮은 곳 = 멈춤 · 가파른 비탈 = 체력 3칸이면 미끄러져 내려옴(시간) / 6칸이면 오르지만 어르신 길로는 X · 길로 걸어 학교 = 확인 → 어르신께 알림(본 것만 근거)
//   ④ 태풍 날: 비 · 센 바람 · 물 높이 +1 · 밖으로 나가면 집·학교로 + 한 줄 · 기다리기 = 다음 날
//   ⑤ 결과 두 판(다 함 / 반만 함): 흔적·함께 고치기·이웃 기억 갈래가 다름 · 고치면 기억 = 둘 다 · 하루 마무리 '내일 기다리는 것' · 오늘 할 일 ⑤ · 위 가운데 줄 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
  const panelK = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? P.dataset.k || '' : ''; });
  const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
  const I = () => ev(() => SM_TOWN.typhoon.info()), D = (f, a) => ev(([f, a]) => SM_TOWN.typhoon.dbg[f](...(a || [])), [f, a]);
  const min = () => ev(() => SM_TOWN.game().S.min), setMin = m => ev(m => { SM_TOWN.game().S.min = m; }, m), day = () => ev(() => SM_TOWN.game().S.day);
  const sleep = async () => { const d0 = await day(); await closeAll(); await ev(() => SM_TOWN.sleep({ ask: false })); for (let i = 0; i < 30 && (await day()) === d0; i++) await W8(300); await W8(2500); await closeAll(); await W8(800); };
  const toastT = () => ev(() => (document.getElementById('toast') || {}).textContent || '');
  try {
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.typhoon, null, { timeout: 240000 }); await W8(2500); await closeAll(); await W8(1200);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 7 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(500);
    // ① 예보
    await ev(() => SM_TOWN.typhoon.start()); await W8(1800); let i0 = await I(); console.log('  판: 바람 ' + i0.wind + ' · 대피소 ' + JSON.stringify(i0.shelter) + ' · 부탁 ' + i0.reqs.map(q => q.k + '@' + q.d).join(' '));
    ok(i0.k === 1 && /태풍/.test(i0.line), '시작 = 1일째 · 할 일 줄 「' + i0.line + '」');
    ok((await panelK()) === 'typfc', '아침 라디오 예보 창이 뜸'); await shot('01_forecast'); await closeAll();
    const fc = await ev(d => SM_TOWN.typhoon.api.fcAt(d), i0.d0 + 6); ok(fc === 'rain' && /태풍/.test(await ev(() => SM_TOWN.typhoon.api.wxLine())), '예보: 태풍 날 = 비 · 날씨 창 한 줄');
    i0 = await I(); ok(i0.rum.some(r => r.id === 'fc'), "들은 말에 '라디오 예보'(사실)");
    // 소문: 이웃 곁에 서 있으면 말풍선 · 수첩에 적힘
    const wk = await D('worker');
    if (wk) { await tp(wk[0] + 2, wk[1] + 2); await W8(2600); } i0 = await I(); if (!i0.rum.some(r => !RUMF(r.id))) { await D('heard', ['fast']); i0 = await I(); }
    function RUMF(id) { return ['fc', 'hall'].includes(id); }
    ok(i0.rum.some(r => !RUMF(r.id)), '소문(생각) 하나 이상 들음 — ' + i0.rum.map(r => r.id).join(','));
    // 사실/생각 나누기(수첩 단추)
    await ev(() => SM_TOWN.typhoon.open()); await W8(300); await shot('02_notebook');
    const srt = await ev(() => { const P = document.querySelector('.twn-p'); const bf = P.querySelector('button[data-rt="fc"]'); if (bf) bf.click(); const r1 = SM_TOWN.typhoon.info().rum.find(r => r.id === 'fc').s; const b2 = document.querySelector('.twn-p button[data-rf="fc"]'); if (b2) b2.click(); const P2 = document.querySelector('.twn-p'); const id = SM_TOWN.typhoon.info().rum.find(r => !['fc', 'hall'].includes(r.id)).id, b3 = P2 && P2.querySelector('button[data-rt="' + id + '"]'); if (b3) b3.click(); const R = SM_TOWN.typhoon.info().rum; return { wrong: r1, fc: R.find(r => r.id === 'fc').s, th: R.find(r => r.id === id).s }; });
    ok(srt.wrong === null && srt.fc === 'f' && srt.th === 't', '예보를 생각으로 고르면 안 붙음 · 사실/생각으로 바로 고르면 붙음 ' + JSON.stringify(srt)); await closeAll();
    // ② 2일째 — 부탁이 몰림
    await sleep(); i0 = await I(); ok(i0.k === 2, '2일째(' + i0.k + ')');
    const R2 = i0.reqs.filter(q => q.d <= 2); console.log('  2일째 부탁: ' + R2.map(q => q.id).join(', ') + ' · 셈 ' + JSON.stringify(i0.budget));
    ok(R2.length >= 3, '2일째 부탁 셋 이상(' + R2.length + ')'); ok(i0.budget && !i0.budget.fits && i0.budget.ropeNeed > i0.budget.ropeGet, '하루에 다 못 함: 끈 ' + i0.budget.ropeNeed + '묶음 필요 · 오늘 받을 수 있는 것 ' + i0.budget.ropeGet);
    const tasks = await ev(() => (SM_TOWN.game().S.tasks || { list: [] }).list.map(t => t.ev)); ok(tasks.includes('typh'), '오늘 할 일 ⑤ = 태풍 부탁 줄(' + tasks.join(',') + ')');
    await setMin(9 * 60); const desk = i0.desk; await tp(desk[0], desk[1] + 1.5); await D('desk'); await W8(300); ok((await panelK()) === 'typdesk', '행정복지센터 물품 창');
    await ev(() => document.querySelector('.twn-p [data-a="b"]').click()); await W8(300); i0 = await I(); ok(i0.mat.rope === 2 && i0.mat.sand === 4 && (await min()) === 9 * 60 + 10, '끈 2 · 모래주머니 4 받음(10분)');
    // 배 묶기: 틀린 쪽 = 30분 · 맞는 쪽 = 40분 + 숨 고르기(체력 3칸 → 무거움 4 = 15분)
    await ev(() => SM_TOWN.stamSet(3));
    const boat = i0.reqs.find(q => q.k === 'boat'); let t0 = await min();
    if (boat) { await tp(boat.at[0], boat.at[1]); await D('talk', ['boat']); await W8(200); ok((await panelK()) === 'typreq', '부탁 듣기 창'); await shot('03_request'); await closeAll();
      await D('tieBoat', [1]); await W8(200); let t1 = await min(); i0 = await I(); ok(t1 - t0 === 30 && i0.reqs.find(q => q.k === 'boat').mis === 1 && i0.reqs.find(q => q.k === 'boat').st !== 'done', '바람 반대쪽 말뚝 = 30분 더 · 아직 안 묶임(' + (t1 - t0) + '분)');
      await D('tieBoat', [0]); await W8(200); const t2 = await min(); i0 = await I(); ok(i0.reqs.find(q => q.k === 'boat').st === 'done' && t2 - t1 === 55, '바람 오는 쪽 = 묶임 · 40분 + 숨 고르기 15분(' + (t2 - t1) + ')'); t0 = t2; }
    else ok(false, '판에 배가 없음');
    const sand = i0.reqs.find(q => q.k === 'sand'); if (sand) { await tp(sand.at[0], sand.at[1]); await D('talk', ['sand']); await closeAll(); const bad = (sand.ok + 1) % sand.spots.length; await D('sand', [bad]); const t1 = await min(); await D('sand', [sand.ok]); const t2 = await min(); i0 = await I();
      ok(t1 - t0 === 30 && i0.reqs.find(q => q.k === 'sand').st === 'done' && t2 - t1 === 85, '모래주머니: 강에서 먼 쪽 = 30분 · 강 쪽 = 40분 + 체력 모자라 45분(' + (t1 - t0) + '·' + (t2 - t1) + ')'); }
    const sg = i0.reqs.find(q => q.k === 'sign' && q.d <= 2); if (sg) { await tp(sg.at[0], sg.at[1]); await D('talk', [sg.id]); await closeAll(); await D('sign', [sg.id]); i0 = await I(); ok(i0.reqs.find(q => q.id === sg.id).st !== 'done' && /끈/.test(await toastT()), '끈이 다 떨어져 간판은 오늘 못 묶음 — ' + (await toastT()).slice(0, 50)); }
    console.log('  2일째 지금 ' + Math.floor((await min()) / 60) + ':' + String((await min()) % 60).padStart(2, '0') + ' · 셈 ' + JSON.stringify((await I()).budget));
    // ③ 3일째 — 대피 길
    await sleep(); i0 = await I(); ok(i0.k === 3 && i0.reqs.filter(q => q.d <= 3).length >= 4, '3일째 부탁 넷 이상(' + i0.reqs.filter(q => q.d <= 3).length + ')');
    const el = i0.reqs.find(q => q.k === 'elder'); ok(!!el, '노인정 어르신 부탁(대피 길)');
    if (el) { await setMin(9 * 60);
      // 가파른 비탈 찾기(학교·물 밖 · 4m에 2m 넘게 오름)
      const st = await ev(() => { const g = (x, z) => SD2.map.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2), A = SM_TOWN.typhoon.api; for (let x = -600; x <= 600; x += 12) for (let z = -400; z <= 900; z += 12) { for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const y0 = g(x, z), y1 = g(x + dx * 2, z + dz * 2), y2 = g(x + dx * 4, z + dz * 4), y3 = g(x + dx * 6, z + dz * 6); if (y1 - y0 > 1.05 && y2 - y1 > 1.05 && y3 - y2 > 1.05 && y3 - y0 < 8) return [x, z, dx, dz, +(y3 - y0).toFixed(1)]; } } return null; });
      console.log('  가파른 비탈 ' + JSON.stringify(st));
      const steepRun = async n => { await ev(n => SM_TOWN.stamSet(n), n); await tp(el.site[0], el.site[1]); await D('path'); const t1 = await min(); for (let k = 0; k <= 3; k++) { await tp(st[0] + st[2] * k * 2, st[1] + st[3] * k * 2); await D('pathSec'); await W8(60); const pp = (await I()).path; if (pp.st !== 'walk') break; } const P9 = (await I()).path, me = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }); return { P9, dt: (await min()) - t1, me }; };
      if (st) { const a = await steepRun(3); ok(a.P9.st === '' && a.P9.slip >= 1 && a.dt >= 20 && Math.hypot(a.me[0] - st[0], a.me[1] - st[1]) < 7, '체력 3칸 = 가파른 지름길에서 미끄러져 내려옴(+' + a.dt + '분)');
        const b9 = await steepRun(6); ok(b9.P9.st === '' && (b9.P9.slip | 0) === (a.P9.slip | 0) && !b9.P9.ok, '체력 6칸 = 오르지만 어르신 길로는 X(확인 안 됨)'); }
      else ok(false, '가파른 비탈을 못 찾음');
      // 강가 낮은 곳: 강가 둔치로 걸으면 멈춤
      const rv = await ev(() => { const W = SM_TOWN.typhoon.dbg.water; for (let x = -500; x <= 500; x += 5) for (let z = -200; z <= 900; z += 5) { const s = W(x, z); if (s > 4 && s < 9 && !SM_TOWN.typhoon.api.storm()) return [x, z]; } return null; });
      if (rv) { await tp(el.site[0], el.site[1]); await D('path'); await tp(rv[0], rv[1]); await D('pathSec'); const P9 = (await I()).path; ok(P9.st === '' && !P9.ok && /강가/.test(await toastT()), '강가 낮은 곳 = 길 확인 멈춤 — ' + (await toastT()).slice(0, 40)); }
      else ok(false, '강가 자리를 못 찾음');
      // 길로 걸어 학교까지(빨간 선 길 점 · 3m 걸음)
      await ev(() => SM_TOWN.stamSet(3)); await tp(el.site[0], el.site[1]); await D('path');
      const rt = await ev(([x, z]) => { const r = SM_TOWN.route('우리 학교', [x, z]); return r && r.ok ? r.pts.map(q => [q[0], q[1]]) : null; }, el.site);
      let steps = 0; if (rt) { for (let i = 1; i < rt.length; i++) { const [ax, az] = rt[i - 1], [bx, bz] = rt[i], L9 = Math.hypot(bx - ax, bz - az); for (let s = 0; s < L9; s += 3) { await tp(ax + (bx - ax) * s / L9, az + (bz - az) * s / L9); await D('pathSec'); steps++; if ((await ev(() => SM_TOWN.typhoon.info().path.st)) !== 'walk') break; } if ((await ev(() => SM_TOWN.typhoon.info().path.st)) !== 'walk') break; } await tp(16.5, 50); await D('pathSec'); }
      let P9 = (await I()).path; console.log('  길로 걸음 ' + steps + '번 · ' + JSON.stringify({ ok: P9.ok, cells: P9.cells, st: P9.st }) + ' · ' + (await toastT()).slice(0, 80));
      ok(!!P9.ok && P9.cells.length >= 2, '길을 따라 학교(대피소)까지 = 안전한 길 확인(' + (P9.cells || []).join('→') + ')');
      if (P9.ok) { await tp(el.at[0], el.at[1]); await D('talk', ['elder']); await W8(200); const tk = await panelK(); const t1 = await min();
        await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-i]')]; const b = B.find(x => /걸어 본 길/.test(x.textContent)); b.click(); }); await W8(150);
        await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-i]')]; const b = B.find(x => !/본 것/.test(x.textContent)); if (b) b.click(); }); await W8(150); const t2 = await min();
        await ev(() => { const B = [...document.querySelectorAll('.twn-p button[data-i]')]; const b = B.find(x => /본 것/.test(x.textContent)); b.click(); }); await W8(300); i0 = await I();
        ok(tk === 'typtell' && t2 - t1 === 10 && i0.reqs.find(q => q.k === 'elder').st === 'done', '어르신께: 내가 걸은 길 + 근거 = 본 것만(소문 근거 = 10분 더) · 알림 끝'); }
    }
    // 3일째 나머지 · 4·5·6일째 = 「반만 함」 판: 간판 하나·비닐하우스·집은 하지 않음
    await sleep(); await sleep(); await sleep(); i0 = await I(); ok(i0.k === 6, '6일째(마지막 날)');
    const g6 = await ev(() => SM_TOWN.typhoon.api.goal()); ok(/태풍까지 하루/.test(g6), "위 가운데 줄 「" + g6 + "」");
    const wt = await ev(() => { const D9 = SM_TOWN.dayx(); return D9.waits({ day: SM_TOWN.game().S.day }, true).map(w => w.k + ':' + w.t[0]); }); ok(wt.some(w => /^typh:/.test(w) && /내일 태풍/.test(w)), "하루 마무리 '내일 기다리는 것' = 내일 태풍 — " + wt.join(' / '));
    // ④ 태풍 날
    await sleep(); i0 = await I(); ok(i0.k === 7, '7일째 = 태풍 날'); await W8(1500);
    const wx = await ev(() => ({ w: SM_TOWN.wx().WX9, strong: SM_TOWN.typhoon.api.storm(), water: SM_TOWN.water ? SM_TOWN.water() : null })); console.log('  태풍 날 ' + JSON.stringify(wx));
    ok(wx.w === 'rain' && wx.strong, '태풍 날 = 비 · 센 바람'); ok(wx.water && /^1:/.test(String(wx.water.k)), '물 높이 +1(' + (wx.water && wx.water.k) + ')');
    ok((await panelK()) === 'typstorm', '태풍 날 창(지켜보기 · 기다리기)'); await shot('04_storm'); await closeAll();
    const out0 = (await I()).out | 0; await tp(260, 300); await W8(2400); const back = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }), tt = await toastT();
    ok(Math.hypot(back[0] - 260, back[1] - 300) > 30 && (/안에 있어요/.test(tt) || (await I()).dbg.includes('storm back')), '밖으로 나가면 집·학교로 + 「지금은 안에 있어요」 한 줄(지금 알림: ' + tt.slice(0, 24) + ')');
    ok(((await I()).out | 0) > out0, '밖에 나간 셈 +1');
    const d7 = await day();
    await ev(() => { const s = SM_TOWN.game().S.typh; s.said.k7 = 0; }); await W8(1500); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="ff"]'); if (b9) b9.click(); }); for (let i = 0; i < 30 && (await day()) === d7; i++) await W8(300); await W8(3000);
    // ⑤ 결과(반만 함)
    i0 = await I(); ok(i0.k === 8 && !!i0.res, '기다리기 = 다음 날 아침 결과');
    { let seen = ''; for (let k = 0; k < 6; k++) { const pk = await panelK(); if (pk === 'typres') { seen = pk; break; } if (pk) await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(1500); } ok(seen === 'typres', '태풍이 지나간 아침 창(다른 창이 닫힌 뒤)'); }
    await shot('05_after'); await closeAll(); i0 = await I();
    const okN = i0.res.L.filter(o => o.ok).length, noN = i0.res.L.length - okN; console.log('  반만 함: ' + i0.res.L.map(o => (o.ok ? '○' : '×') + o.k).join(' ') + ' · 고칠 곳 ' + i0.fix.length + ' · 기억 ' + JSON.stringify(Object.values(i0.mem).map(m => m.k)));
    ok(okN >= 2 && noN >= 2 && i0.fix.length >= 2, '반만 함 = 멀쩡한 곳과 흔적이 함께 · 함께 고치기 ' + i0.fix.length);
    ok(Object.values(i0.mem).some(m => m.k === 'thx') && Object.values(i0.mem).some(m => m.k === 'sorry'), '이웃 기억 = 고마움 · 아쉬움');
    ok(i0.vis > 0 && i0.hot.some(h => /🔧/.test(h)), '세상에 흔적(기운 간판·찢긴 비닐 등) + 🔧 고치기 자리');
    // 고치기 하나 = 기억 '둘 다'
    { const f = i0.fix.find(x => x.k !== 'boat' && x.k !== 'vinyl' && x.k !== 'sign') || i0.fix[0]; await setMin(10 * 60); await tp(f.at[0], f.at[1]); if (f.k === 'sign' || f.k === 'vinyl') { await ev(() => { SM_TOWN.game().S.typh.mat.rope = 1; }); } await D('fix', [f.id]); const i9 = await I(), m9 = Object.entries(i9.mem).find(([k]) => k.startsWith(f.k + ':'));
      ok(i9.fix.find(x => x.id === f.id).st === 'done' && m9 && m9[1].k === 'both', '같이 고침 = 흔적 사라짐 · 기억 = 아쉬움+고마움(' + f.k + ')'); }
    // 이웃 말(기억) — 고마움 자리 곁
    { const m = Object.values((await I()).mem).find(o => o.k === 'thx'); if (m) { await tp(m.at[0] + 1, m.at[1] + 1); await W8(2400); ok(/고마워|고맙/.test(await toastT()), '고마움 기억 = 그 이웃 곁에서 한 줄 — ' + (await toastT()).slice(0, 50)); } }
    // 「다 함」 판: 새 판에서 모든 부탁을 해 둠 → 결과 = 흔적 0
    await D('finish'); await ev(() => SM_TOWN.typhoon.start()); await closeAll(); const i1 = await I();
    await ev(() => { const s = SM_TOWN.game().S.typh; for (const q of s.reqs) { q.st = 'done'; q.dd = SM_TOWN.game().S.day; } s.path.ok = s.path.told = SM_TOWN.game().S.day; s.d0 = SM_TOWN.game().S.day - 7; s.said.k7 = 1; SM_TOWN.game().mark(); }); await D('result'); await W8(1500); await closeAll(); const i2 = await I();
    console.log('  다 함: ' + i2.res.L.map(o => (o.ok ? '○' : '×') + o.k).join(' ') + ' · 고칠 곳 ' + i2.fix.length);
    ok(i1.reqs.length === i2.res.L.length && i2.res.L.every(o => o.ok) && i2.fix.length === 0 && Object.values(i2.mem).filter(m => m.n === i2.n).every(m => m.k === 'thx'), '다 함 = 모두 멀쩡 · 고칠 곳 0 · 이웃 기억 = 고마움만');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { ok(false, '시험 중 오류: ' + (e && e.message ? e.message.slice(0, 300) : e)); }
  await b.close(); console.log(fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
