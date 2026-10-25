// 🛤 나의 길 시험(PATH-1 · v2/games/town_path.js): node tools/harness/town_path.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬)]
//   ① 새 저장 = 여섯 길 0걸음 · 지난 표지판 0 · 마을에 바뀐 것 0
//   ② 길마다 그 길의 일(엔진이 쓰는 저장 칸을 그대로 채움 · 탐험은 GAME.visit로 칸 걷기) → 걸음이 늘고 · 표지판에서 마을이 바뀜(그 물건이 실제로 장면에 생김)
//      탐험가 = 전망대 깃발 · 지도판 / 이웃 = 정자 방석 · 잔치 상(초대장 E) / 도우미 = 감사장(글 = 내가 한 일) · 조끼(입으면 윗옷 주황) / 기록가 = 소식지 · 땅이름 팻말 / 도전가 = 장터·스키 기록판
//      관찰가 = 박물관 방 안 진열장(기증 E · 가방 돌이 줄고 진열장에 놓임) · 관찰 기록 판 + 학예사 E
//   ③ 하루 마무리: '오늘 바뀐 것'에 나의 길 줄('걸음') · '내일 기다리는 것'에 다음 표지판까지 한 걸음 남은 길
//   ④ 수첩 🛤 나의 길: 여섯 길 그림 · 글에 숫자·% 0 · 지난 표지판 🧭 = 빨간 선
//   ⑤ 이미 해 둔 저장(나의 길 칸 없음)으로 들어오면: 표지판이 한꺼번에 X · 하루 하나('어제까지 걸은 길') · 다음 날 하나 더
//   ⑥ 휴대폰 390 · 나의 길 쪽이 화면 안(옆으로 넘침 0) · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const page = async (vw, touch, init) => { const c = await b.newContext({ viewport: { width: vw[0], height: vw[1] }, hasTouch: !!touch, isMobile: !!touch }); if (init) await c.addInitScript(init.f, init.a); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); }); return p; };
  const boot = async p => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.mypath && SM_TOWN.mypath(), null, { timeout: 240000 }); await p.waitForTimeout(1500); };
  const closeAll = async p => { for (let i = 0; i < 6; i++) { if (!await p.evaluate(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(250); if (await p.evaluate(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); } } };
  const shot = async (p, n) => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  try { const p = await page([1280, 720]), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await boot(p); await closeAll(p); await W8(1200);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(600);
    const P = () => ev(() => SM_TOWN.mypath().info()), ST = () => ev(() => SM_TOWN.mypath().steps());
    // ① 새 저장
    const s0 = await ST(), i0 = await P(); console.log('  새 저장 걸음: ' + JSON.stringify(s0));
    ok(Object.values(s0).length === 6 && Object.values(s0).every(v => v === 0), '새 저장 = 여섯 길 0걸음'); ok(!Object.keys(i0.got).length && !i0.vis.length, '지난 표지판 0 · 마을에 바뀐 것 0');
    // 표지판 넘기기: 기록 채움 → sec 몇 번(한 번에 하나) → 그 표지판 id가 장면에
    const run = async (n = 3) => { for (let i = 0; i < n; i++) { await closeAll(p); await ev(() => SM_TOWN.mypath().sec(true)); await W8(120); } };
    const sign = async (id, fill, msg) => { await ev(fill); await run(2); const I = await P(), st = await ST(), v = I.vat[id], ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || '');
      ok(!!v && v[3], msg + ' — 장면에 생김 ' + JSON.stringify(v) + ' · 걸음 ' + JSON.stringify(st)); return { I, st, ban }; };
    // 탐험가
    let r = await sign('explore:0', () => { const G = SM_TOWN.game(); for (let i = 0; i < 10; i++) G.visit('zzp' + i); G.S.bag['⛰'] = 1; G.mark(); }, '🧭 탐험가 첫 표지판(칸 열 + 정상 도장) = 전망대 깃발');
    ok(r.st.explore === 3 && /탐험가/.test(r.ban) && /깃발/.test(r.ban), '걸음 3 · 배너 한 줄: ' + r.ban);
    ok(await ev(() => !!document.querySelector('.gchip, .chip') && [...document.querySelectorAll('div')].some(e => /깃발 보러 가기/.test(e.textContent || '') && e.children.length < 3)), '칩 「깃발 보러 가기」(누르면 빨간 선)');
    await ev(() => { const c = [...document.querySelectorAll('div')].find(e => /깃발 보러 가기/.test(e.textContent || '') && e.children.length < 3); if (c) c.click(); }); await W8(500);
    ok(!!(await ev(() => SM_TOWN.routeNow())), '칩을 누르면 빨간 선'); await ev(() => SM_TOWN.guideOff && SM_TOWN.guideOff());
    r = await sign('explore:1', () => { const G = SM_TOWN.game(); for (let i = 10; i < 30; i++) G.visit('zzp' + i); G.S.bag['🗼'] = 1; G.S.bag['👣'] = 1; G.mark(); }, '🧭 둘째 표지판 = 전망대 지도판');
    // 이웃
    await sign('nb:0', () => { const G = SM_TOWN.game().S; G.hearts = Object.assign(G.hearts || {}, { 'zz:a': 6, 'zz:b': 3 }); SM_TOWN.game().mark(); }, '🤝 이웃 첫 표지판(하트 단계 셋) = 정자 방석');
    r = await sign('nb:1', () => { const G = SM_TOWN.game().S; G.shared = 5; SM_TOWN.game().mark(); }, '🤝 둘째 = 정자 잔치 상'); ok(r.I.hot.includes('nb:1'), '잔치 상 곁 초대장 E');
    // 도우미
    r = await sign('help:0', () => { const G = SM_TOWN.game().S; G.emerg = G.emerg || { v: 1, d: -1, plan: [], log: [], n: {} }; G.emerg.log = (G.emerg.log || []).concat([{ k: 'lost', d: G.day, ok: 1, cell: '가1' }]); G.fix = G.fix || { v: 1, d: -1, cur: null, log: [], n: 0 }; G.fix.log = [{ d: G.day, cell: '가1', x: 0, z: 0, rep: G.day, ok: 1 }]; SM_TOWN.game().mark(); }, '🚨 도우미 첫 표지판 = 행정복지센터 감사장');
    { const C = await ev(() => SM_TOWN.mypath().cert()); ok(C.some(t => /길 잃은 아이/.test(t)) && C.some(t => /고칠 곳/.test(t)), '감사장 글 = 내가 한 일(' + C.join(' / ') + ')'); }
    r = await sign('help:1', () => { const G = SM_TOWN.game().S; G.case = G.case || { v: 1, d: -1, cur: null, done: {}, log: [], helper: 0, seeds: {} }; G.case.done = { zza: 1, zzb: 1 }; G.bldg = G.bldg || {}; G.bldg.police = Object.assign(G.bldg.police || {}, { d112: G.day }); SM_TOWN.game().mark(); }, '🚨 둘째 = 도우미 조끼 걸이');
    { const t0 = await ev(() => SM_TOWN.mypath().info().vest); await ev(() => SM_TOWN.mypath().vest(true)); const L1 = await ev(async () => (await import('/v2/js/look.js?v=1')).getLook().top); await ev(() => SM_TOWN.mypath().vest(false)); const L2 = await ev(async () => (await import('/v2/js/look.js?v=1')).getLook().top);
      ok(!t0 && L1 === 2 && L2 !== 2, '조끼 입기 = 윗옷 주황(' + L1 + ') · 벗기 = 원래 옷(' + L2 + ')'); }
    // 기록가
    await sign('rec:0', () => { const G = SM_TOWN.game().S; G.press = { v: 1, list: [{ id: 'heron', act: 'rest', sent: 1 }], news: [{ d: G.day, h: ['물가에서 쉬는 왜가리', 'A heron resting by the water'] }], got: {}, th: null }; G.album = [{ e: '🥞', t: [], d: G.day }]; SM_TOWN.game().mark(); }, '📷 기록가 첫 표지판 = 우체국 소식지');
    { const N = await ev(() => SM_TOWN.mypath().news()); ok(N.some(t => /왜가리/.test(t)), '소식지 글 = 내 기사 제목(' + N.join(' / ') + ')'); }
    await sign('rec:1', () => { const G = SM_TOWN.game().S; G.bldg.elder = Object.assign(G.bldg.elder || {}, { got: ['배다리', '역말', '숯골'] }); G.press.list.push({ id: 'heron', act: 'walk' }, { id: 'heron', act: 'eat' }); SM_TOWN.game().mark(); }, '📷 둘째 = 노인정 앞 땅이름 팻말');
    // 도전가
    await sign('chal:0', () => { const G = SM_TOWN.game().S; G.lad = G.lad || {}; G.lad.mg = Object.assign(G.lad.mg || {}, { strawberry: { lv: 3, z: 0, n: 4, best: { lv: 3, g: 2, n: 9 }, last: { lv: 3, g: 1, n: 7 } } }); SM_TOWN.game().mark(); }, '🏅 도전가 첫 표지판 = 장터 기록판');
    { const B9 = await ev(() => SM_TOWN.mypath().best('lad')); ok(B9.some(t => /딸기/.test(t)), '장터 기록판 = 내 최고만(' + B9.join(' / ') + ')'); }
    await sign('chal:1', () => { const G = SM_TOWN.game().S; G.tbl = G.tbl || { v: 1 }; G.tbl.g = Object.assign(G.tbl.g || {}, { gonu: { lv: 2, good: 0, fail: 0, w: 1, n: 3, best: {} } }); G.xp = G.xp || {}; G.xp.ski = Object.assign(G.xp.ski || {}, { c1: { best: 31.4, last: 33, n: 2 }, c2: { best: 40.2, last: 41, n: 1 } }); SM_TOWN.game().mark(); }, '🏅 둘째 = 스키장 기록판');
    // 관찰가(박물관 방 안)
    await ev(() => { const G = SM_TOWN.game().S; G.dex['bug:zz1'] = G.day; G.dex['bug:zz2'] = G.day; G.dex['wild:heron'] = G.day; G.xp = G.xp || {}; G.xp.fos = Object.assign(G.xp.fos || {}, { f1: [4, G.day] }); SM_TOWN.game().mark(); }); await run(2);
    { const I = await P(); ok((I.got.look | 0) === 1, '🔍 관찰가 첫 표지판(도감 곤충 둘 · 동물 하나 · 화석 하나) 지남'); }
    const mu = await ev(() => SM_TOWN.indoor.list().find(q => q.kind === 'museum') || null);
    const enter = async q => { await closeAll(p); await ev(id => SM_TOWN.indoor.enter(id), q.id); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { return false; } await W8(400); return true; };
    const leave = async () => { await ev(() => { if (SM_TOWN.indoor.exit) SM_TOWN.indoor.exit(); }); await W8(500); };
    if (mu) { ok(await enter(mu), mu.name + ' 들어감'); let E = await ev(() => (SM_TOWN.bldg().info().cur.extra || []).map(q => q.k)); ok(E.includes('pth:don') && E.includes('pth:case') && !E.includes('pth:cur'), '박물관 방 = 진열장 E(기증 · 보기) · 아직 학예사 E X — ' + E.filter(k => /^pth/.test(k)).join(','));
      await ev(() => { SM_TOWN.game().S.bag['⚪'] = 2; SM_TOWN.game().mark(); }); await ev(() => SM_TOWN.mypath().use('pth:don')); await W8(300);
      const d1 = await ev(() => ({ don: SM_TOWN.mypath().info().don, bag: SM_TOWN.game().S.bag['⚪'] | 0 })); ok(d1.don['⚪'] === 1 && d1.bag === 1, '기증 E = 가방 조약돌 하나가 진열장으로 ' + JSON.stringify(d1));
      if (SHOTS) { await ev(() => { const c = SM_TOWN.bldg().info().cur, at = c.at; SD2.map.player.teleport([at[0] - 0.4, at[1] + 0.05, at[2] + 3.2]); SD2.map.player.face(270); }); await W8(1200); await shot(p, '02_museum_case'); }
      await leave(); }
    else ok(false, '이 마을에 박물관이 없음');
    // ③ 하루 마무리(관찰가가 다음 표지판까지 한 걸음)
    await ev(() => { const G = SM_TOWN.game().S; G.chem = G.chem || {}; G.chem.found = Object.assign(G.chem.found || {}, { dry: 1, puddle: 1, freeze: 1 }); G.dex['fish:zz'] = G.day; SM_TOWN.game().mark(); }); await run(1);
    { const st = await ST(); ok(st.look === 9, '관찰가 9걸음(다음 표지판 10) ' + st.look); }
    const W9 = await ev(() => SM_TOWN.mypath().dayWait()); ok(W9 && /한 걸음이면/.test(W9.t[0]), "내일 기다리는 것 = '" + (W9 && W9.t[0]) + "'");
    await ev(() => { const G = SM_TOWN.game().S; G.min = 21 * 60; }); await ev(() => { SM_TOWN.sleep({ ask: true }); }); await W8(900);
    const RC = await ev(() => { const P9 = document.querySelector('.twn-p'); if (!P9) return null; const row = P9.querySelector('[data-dc="path"]'), w = [...P9.querySelectorAll('button[data-dwi]')].map(e => e.dataset.tm + ':' + e.textContent); return { row: row ? row.textContent : null, w }; });
    console.log('  하루 마무리: ' + JSON.stringify(RC)); ok(RC && RC.row && /나의 길/.test(RC.row) && /걸음/.test(RC.row), "'오늘 바뀐 것'에 나의 길 줄 — " + (RC && RC.row));
    ok(RC && RC.w.some(t => /^path:/.test(t) && /한 걸음이면/.test(t)), "'내일 기다리는 것'에 '한 걸음이면 …'");
    await shot(p, '03_recap'); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(3500); await closeAll(p); await W8(2500);
    await ev(() => { const G = SM_TOWN.game().S; G.dex['star:zz'] = G.day; SM_TOWN.game().mark(); }); await run(2);
    { const I = await P(); ok((I.got.look | 0) === 2, '🔍 둘째 표지판(학예사 관찰 판) 지남 — 다음 날 바로'); }
    await ev(() => { SM_TOWN.game().S.min = 10 * 60; });
    if (mu) { ok(await enter(mu), '다시 들어감(10:00)'); const E = await ev(() => (SM_TOWN.bldg().info().cur.extra || []).map(q => q.k)); ok(E.includes('pth:cur'), '박물관 방 = 학예사 E(내 발견 듣기)'); const O = await ev(() => SM_TOWN.mypath().obs()); ok(O.some(t => /고사리/.test(t)), '관찰 기록 판 글 = 내가 찾은 것(' + O.slice(0, 4).join(' / ') + ')'); await leave(); }
    // ④ 수첩
    await ev(() => SM_TOWN.mypath().open()); await W8(400);
    const NB = await ev(() => { const P9 = document.querySelector('.twn-p'); if (!P9) return null; const t = P9.innerText; return { k: P9.dataset.k, rows: P9.querySelectorAll('.pth-row').length, svg: P9.querySelectorAll('.pth-row svg').length, dig: (t.match(/[0-9%]/g) || []).length, past: P9.querySelectorAll('button[data-pk]').length, foot: P9.querySelectorAll('.pth-row svg ellipse').length, tab: !!P9.querySelector('[data-nb]') && [...P9.querySelectorAll('[data-nb]')].some(e => /나의 길/.test(e.textContent)) }; });
    console.log('  수첩: ' + JSON.stringify(NB)); ok(NB && NB.k === 'path' && NB.rows === 6 && NB.svg === 6, '수첩 🛤 나의 길 = 여섯 길 그림'); ok(NB && NB.dig === 0, '수첩 글에 숫자·% 0(' + (NB && NB.dig) + ')'); ok(NB && NB.past >= 11, '지난 표지판 단추(🧭) ' + (NB && NB.past)); ok(NB && NB.tab, '수첩 탭 줄에 🛤 나의 길');
    await shot(p, '01_notebook');
    await ev(() => { const b9 = document.querySelector('.twn-p button[data-pk="help"]'); if (b9) b9.click(); }); await W8(500); ok(!!(await ev(() => SM_TOWN.routeNow())) && !(await ev(() => !!document.querySelector('.twn-p'))), '지난 표지판 🧭 = 창 닫힘 + 빨간 선'); await ev(() => SM_TOWN.guideOff && SM_TOWN.guideOff());
    if (SHOTS) { const v = (await P()).vat['help:0']; if (v) { await ev(v => { const x = v[0] + Math.sin(v[2]) * 3.2, z = v[1] + Math.cos(v[2]) * 3.2; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.face(Math.atan2(v[0] - x, -(v[1] - z)) * 180 / Math.PI); }, v); await W8(1500); await shot(p, '04_certificate'); }
      for (const id of ['explore:0', 'nb:1', 'rec:0', 'chal:0']) { const v9 = (await P()).vat[id]; if (!v9) continue; await ev(v => { const a = v[2], x = v[0] + Math.sin(a) * 4, z = v[1] + Math.cos(a) * 4; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.face(Math.atan2(v[0] - x, -(v[1] - z)) * 180 / Math.PI); }, v9); await W8(1500); await shot(p, '05_' + id.replace(':', '_')); } }
    const SAVE = await ev(() => { const S9 = JSON.parse(JSON.stringify(SM_TOWN.game().S)); delete S9.path; return S9; });
    ok(!errs.length, '페이지 오류 0 (데스크톱)' + (errs.length ? ' — ' + errs.join(' | ') : '')); await p.context().close();
    // ⑤ 이미 해 둔 저장
    const q = await page([1280, 720], false, { f: s9 => { try { if (!sessionStorage.getItem('pth-set')) { localStorage.setItem('sm-town-game:' + s9.id, JSON.stringify(s9.S)); sessionStorage.setItem('pth-set', '1'); } } catch (e) { /* */ } }, a: { id: ID, S: SAVE } }), eq = (f, a) => q.evaluate(f, a);
    await boot(q); await closeAll(q); await q.waitForTimeout(800);
    await eq(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.story = G.story || {}; G.story.p0auto = 1; });
    for (let i = 0; i < 4; i++) { await closeAll(q); await eq(() => SM_TOWN.mypath().sec(true)); await q.waitForTimeout(150); }
    const B1 = await eq(() => SM_TOWN.mypath().info()), n1 = Object.values(B1.got).reduce((a, v) => a + v, 0), ban = await eq(() => (document.getElementById('hudBan') || {}).textContent || '');
    console.log('  들어올 때 넘은 표지판: ' + JSON.stringify(B1.boot) + ' · 연 것 ' + JSON.stringify(B1.got));
    ok(Object.values(B1.boot).reduce((a, v) => a + v, 0) >= 10, '이미 해 둔 저장 = 표지판 열 넘게 닿아 있음'); ok(n1 === 1, '들어오자마자 하나만 열림(한꺼번에 X) ' + n1); ok(/어제까지 걸은 길/.test(ban), "배너 = '어제까지 걸은 길' — " + ban);
    await eq(() => { SM_TOWN.game().S.min = 21 * 60; SM_TOWN.sleep({ ask: true }); }); await q.waitForTimeout(900); await eq(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await q.waitForTimeout(3500); await closeAll(q); await q.waitForTimeout(1500);
    for (let i = 0; i < 4; i++) { await closeAll(q); await eq(() => SM_TOWN.mypath().sec(true)); await q.waitForTimeout(150); }
    const n2 = Object.values((await eq(() => SM_TOWN.mypath().info())).got).reduce((a, v) => a + v, 0); ok(n2 === 2, '다음 날 하나 더(' + n2 + ')');
    await q.context().close();
    // ⑥ 휴대폰
    const m = await page([390, 844], true), em = (f, a) => m.evaluate(f, a); await boot(m); await closeAll(m); await m.waitForTimeout(800);
    await em(() => { const G = SM_TOWN.game(); for (let i = 0; i < 12; i++) G.visit('zzm' + i); G.S.bag['⛰'] = 1; G.mark(); SM_TOWN.mypath().sec(true); }); await closeAll(m); await em(() => SM_TOWN.mypath().open()); await m.waitForTimeout(500);
    const PH = await em(() => { const P9 = document.querySelector('.twn-p .bx'); if (!P9) return null; const r = P9.getBoundingClientRect(), sv = [...P9.querySelectorAll('.pth-row svg')].map(e => e.getBoundingClientRect()); return { l: Math.round(r.left), r: Math.round(r.right), sw: P9.scrollWidth, cw: P9.clientWidth, doc: document.documentElement.scrollWidth, svR: Math.round(Math.max(...sv.map(q => q.right))), rows: P9.querySelectorAll('.pth-row').length }; });
    console.log('  휴대폰: ' + JSON.stringify(PH)); ok(PH && PH.rows === 6 && PH.l >= 0 && PH.r <= 390 && PH.sw <= PH.cw + 1 && PH.svR <= 390 && PH.doc <= 391, '휴대폰 390 = 나의 길 쪽이 화면 안 · 옆 넘침 0');
    await shot(m, '06_phone');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
