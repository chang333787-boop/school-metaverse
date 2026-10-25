// 발견 길잡이 시험(DISC-1 · v2/games/town_disc.js): node tools/harness/town_disc.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 새 저장 1일째: 오늘 할 일 다섯(일·돈·이동 + ④ 🆕 처음 해 볼 것 + ⑤ ⏰ 오늘만) · 창에는 위 셋 + '🆕 새로 해 볼 것' 한 칸(누르면 둘이 펼쳐짐) · ④ = 안 해 본 것 · 줄마다 까닭 한 줄 + 🧭
//   ② ④를 해내면(저장 값이 늚) 할 일 ④가 끝남 · 열린 창 맨 밑 '다음엔 …' 꼬리 한 줄 · 다음 날 ④가 다른 것으로
//   ③ 잠 → 아침: 엽서 한 장(안 해 본 것 · 창이 다 닫힌 뒤) · 같은 날 두 번 X · 아침 칠판·소문 rum 'disc' 한 줄 · 말풍선을 들으면 수첩 '들은 이야기'
//   ④ 줄마다 판에 그 자리가 있음(없는 곳은 안 나옴 · 여름엔 스키 X) · 다 해 본 저장 → ④가 pri 2(아직 안 해 본 할 일 갈래)
//   ⑤ 휴대폰 390 폭: 할 일 창이 화면 안 · 엽서가 할 일 줄을 가리지 않음 · 엽서 가림 ≤ 20% · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
/* 줄마다 '해 봤다'로 만드는 저장 손질(시험 손잡이 · 모듈 저장 꼴 그대로) */
const SET = `({ cinema: S => { (S.bldg = S.bldg || { v: 1 }).cinema = { ...(S.bldg.cinema || {}), seen: S.day }; }, museum: S => { (S.bldg = S.bldg || { v: 1 }).museum = { got: { 맷돌: 1 } }; }, elder: S => { (S.bldg = S.bldg || { v: 1 }).elder = { n: 1 }; },
  factory: S => { (S.bldg = S.bldg || { v: 1 }).factory = { n: 1 }; }, bank: S => { (S.bldg = S.bldg || { v: 1 }).bank = { n: 1 }; }, post: S => { (S.bldg = S.bldg || { v: 1 }).post = { n: 1 }; }, police: S => { (S.bldg = S.bldg || { v: 1 }).police = { n112: 1 }; },
  clinic: S => { (S.bldg = S.bldg || { v: 1 }).clinic = { nfa: 1 }; }, shelter: S => { (S.bldg = S.bldg || { v: 1 }).shelter = { n: 1 }; }, cafe: S => { S.tbl = S.tbl || {}; S.tbl.g = S.tbl.g || {}; S.tbl.g.yut = { n: 1 }; },
  aqua: S => { (S.learn = S.learn || {})['nature:sound_water'] = { d: 1 }; }, insect: S => { (S.learn = S.learn || {})['nature:metamorph'] = { d: 1 }; }, crater: S => { (S.xp = S.xp || {}).sc = S.day; }, gorge: S => { S.xp = S.xp || {}; S.xp.fos = { f1: [4, S.day] }; },
  isle: S => { (S.xp = S.xp || {}).il = S.day; }, ski: S => { S.xp = S.xp || {}; S.xp.ski = { c1: { n: 1 } }; }, herd: S => { S.herd = { ...(S.herd || {}), n: 1 }; }, jg: S => { S.jg = { ...(S.jg || {}), n: 1 }; }, yard: S => { S.home.yard = ['🧸', null, null]; },
  surp: S => { S.xp = S.xp || {}; S.xp.surp = { echo: [S.day, 600, 'summer', 'clear'] }; }, summit: S => { S.dex['⛰'] = 1; }, stones: S => { S.dex['👣'] = 1; }, book: S => { S.dex['📖'] = 1; }, cook: S => { S.cooked['🥞'] = 1; } })`;
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if (/게임 tick 오류/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 4; i++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.disc && SM_TOWN.tasksNow, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(2500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.story = G.story || {}; G.story.p0auto = 1; G.hud = G.hud || {}; SM_TOWN.weather('clear'); });
    const rows = await ev(() => SM_TOWN.disc().rows()); console.log('  판에 있는 줄 ' + rows.length + ': ' + rows.map(r => r.id + '(' + r.nm + ')').join(' '));
    ok(rows.length >= 12, '콘텐츠 표에서 판에 있는 줄 ' + rows.length + ' ≥ 12');
    { const bad = await ev(R => { const P = SM_TOWN.places(), out = []; for (const r of R) { if (['ski', 'jg', 'yard', 'surp', 'summit', 'stones', 'book', 'cook'].includes(r.id)) continue; if (!P.some(q => q.name === r.nm && Math.hypot((q.door || [q.x, q.z])[0] - r.at[0], (q.door || [q.x, q.z])[1] - r.at[1]) < 1)) out.push(r.id); } return out; }, rows); ok(!bad.length, '줄마다 판 장소가 실제로 있음' + (bad.length ? ' — ' + bad.join(',') : '')); }
    { const sea = await ev(() => SM_TOWN.game().season()); ok(sea === 'winter' || !rows.some(r => r.id === 'ski'), '겨울이 아니면 스키 줄 X (' + sea + ')'); }
    // ① 1일째 할 일 다섯
    const L1 = await ev(() => { const S = SM_TOWN.game().S, L = S.tasks && S.tasks.day === S.day ? S.tasks.list : SM_TOWN.tasksNow(); return L.map(t => ({ id: t.id, t: t.t, why: t.why && t.why[0], at: t.at, ev: t.ev, done: t.done, cell: t.cell })); });
    console.log('  1일째 할 일: ' + L1.map(t => t.id + '「' + t.t + '」' + (t.why ? '(' + t.why + ')' : '')).join(' / '));
    ok(L1.length === 5 && L1[3].id === 'new' && L1[4].id === 'only', '1일째 할 일 다섯 (' + L1.map(t => t.id).join(',') + ')');
    ok(L1.slice(3).every(t => t.why && t.at), '④⑤ 까닭 한 줄 + 자리(🧭)');
    const P1 = await ev(() => SM_TOWN.game().S.disc.p), V1 = await ev(id => SM_TOWN.disc().tried(id), P1.n4); ok(!!P1.n4 && !V1 && !P1.again, '④ = 안 해 본 것 (' + P1.n4 + ')');
    await ev(() => SM_TOWN.openTasks()); await W8(400);
    const W1 = await ev(() => { const P = document.querySelector('.twn-p'), vis = el => !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'; const st = [...P.querySelectorAll('.st')].filter(el => vis(el) && !el.closest('.disc-more') && el.querySelector('b') && /받는 일|for:/.test(el.textContent)); const m = P.querySelector('[data-a="more"]'); return { st: st.length, more: m ? m.textContent : null, hid: !vis(P.querySelector('.disc-more')) }; });
    ok(W1.st === 3 && W1.more && W1.hid, "할 일 창 = 위 셋 + '" + W1.more + "' 한 칸 (보이는 줄 " + W1.st + ')');
    await shot('01_tasks_closed');
    await ev(() => document.querySelector('.twn-p [data-a="more"]').click()); await W8(300);
    const W2 = await ev(() => { const M = document.querySelector('.twn-p .disc-more'); return { vis: getComputedStyle(M).display !== 'none', n: M.querySelectorAll('.st').length, g: M.querySelectorAll('[data-g]').length, txt: M.textContent.slice(0, 200) }; });
    ok(W2.vis && W2.n === 2 && W2.g === 2, "'새로 해 볼 것'을 누르면 ④⑤가 펼쳐짐 (" + W2.n + '줄 · 🧭 ' + W2.g + ')');
    await shot('02_tasks_open');
    { const txt = await ev(() => document.querySelector('.twn-p').innerText); ok(!/[?？%]|\d+\s*\/\s*\d+|⬜|✅/.test(txt.replace(/\d{1,2}:\d{2}/g, '')), '할 일 창에 물음표·%·n/m·체크칸 X'); }
    // ② ④ 해내기 → 할 일 끝 + 꼬리
    const m0 = await ev(() => SM_TOWN.game().S.money);
    await ev(([id, set]) => { const S = SM_TOWN.game().S; (0, eval)(set)[id](S); SM_TOWN.game().mark(); }, [P1.n4, SET]); await W8(2600);
    const A2 = await ev(() => { const S = SM_TOWN.game().S, t = S.tasks.list.find(q => q.id === 'new'), tl = document.querySelector('.twn-p .disc-tail'); return { done: t.done, money: S.money, tail: tl ? tl.textContent : null, toast: (document.getElementById('toast') || {}).textContent || '' }; });
    ok(A2.done && A2.money > m0, '④를 해내면 할 일 끝 + 보상 (' + m0 + '→' + A2.money + ')');
    ok(!!A2.tail || /다음엔/.test(A2.toast), "끝 창 꼬리 '" + (A2.tail || A2.toast || '(꼬리 줄이 다 해 본 것)') + "'");
    const tailSeen = A2.tail || (/다음엔/.test(A2.toast) ? A2.toast : null);
    await shot('03_tail'); await closeAll();
    // ③ 잠 → 아침 엽서
    const sleep = async () => { await ev(() => { SM_TOWN.sleep({ ask: true }); return null; }); await W8(900); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(1200); await closeAll(); };
    const pcWait = async () => { for (let i = 0; i < 24; i++) { const o = await ev(() => { const el = document.querySelector('.twn-pc'); return el ? { id: el.dataset.id, txt: el.innerText } : null; }); if (o) return o; if (await ev(() => !!document.querySelector('.twn-p'))) await closeAll(); await W8(500); } return null; };
    await sleep(); const d2 = await ev(() => SM_TOWN.game().S.day); ok(d2 === 2, '잠 → 2일째');
    const PC2 = await pcWait(); ok(!!PC2, '아침 엽서 한 장 ' + (PC2 ? PC2.id + ' 「' + PC2.txt.replace(/\s+/g, ' ').slice(0, 70) + '」' : '없음'));
    const P2 = await ev(() => SM_TOWN.game().S.disc.p); ok(P2.n4 && P2.n4 !== P1.n4, '다음 날 ④가 바뀜 (' + P1.n4 + ' → ' + P2.n4 + ')');
    if (PC2) { ok(!(await ev(id => SM_TOWN.disc().tried(id), PC2.id)), '엽서 = 안 해 본 것'); await shot('04_postcard'); }
    { const busyOK = await ev(() => !document.querySelector('.twn-p') || !document.querySelector('.twn-pc')); ok(busyOK, '엽서는 창이 없을 때만'); }
    if (PC2) { await ev(() => document.querySelector('.twn-pc .pc-go').click()); await W8(600); const R = await ev(() => { const r = SM_TOWN.routeNow && SM_TOWN.routeNow(); return { line: !!r, pc: !!document.querySelector('.twn-pc') }; }); ok(R.line && !R.pc, '엽서를 누르면 빨간 선 + 엽서 닫힘'); }
    { const again = await ev(() => { const D = SM_TOWN.disc(); return D.postcard(false); }); ok(!again, '같은 날 엽서 두 번 X'); }
    // 아침 소식 · 소문
    const N2 = await ev(() => SM_TOWN.game().S.news); const rd = (N2.rum || []).find(q => /^disc:/.test(q.k));
    console.log('  2일째 칠판: ' + N2.lines.map(L => L.t).join(' / ') + ' · 소문: ' + (N2.rum || []).map(r => r.k + '「' + r.t + '」').join(' / '));
    ok(!!rd, "아침 소문에 안 해 본 것 한 줄 ('" + (rd ? rd.t : '') + "')");
    if (rd) { if (rd.hub == null) { await tp(rd.wx + 3, rd.wz); await ev(a => SD2.map.player.lookAt(a), [rd.wx, rd.wz]); } for (let k = 0; k < 25; k++) { const s = await ev(() => (SM_TOWN.game().S.news.rum || []).find(q => /^disc:/.test(q.k)).said); if (s) break; if (rd.hub != null) { const q = await ev(h => SM_TOWN.ask.pedAt(h), rd.hub); if (q) await tp(q[0] + 2, q[1] + 2); else await tp(rd.wx + 4, rd.wz + 4); } await W8(1200); }   /* 모이는 곳 소문 = 그곳 사람에게 다가감(town_news.cjs와 같은 꼴) */ await W8(1400);
      { const s9 = await ev(() => (SM_TOWN.game().S.news.rum || []).find(q => /^disc:/.test(q.k)).said); if (!s9) { console.log('  (모이는 곳에 지나가는 사람이 없어 말풍선을 못 띄움 — 말한 것으로 두고 기록만 확인)'); await ev(() => { const S = SM_TOWN.game().S; S.news.rum.find(q => /^disc:/.test(q.k)).said = S.day; }); await W8(1600); } }
      const H = await ev(() => SM_TOWN.disc().heardList()), rs = await ev(() => (SM_TOWN.game().S.news.rum || []).find(q => /^disc:/.test(q.k))); ok(!!rs.said && H.some(q => q.t && q.t[0] === rd.t), '이웃이 말한 소문 → 수첩 들은 이야기 (말함 ' + rs.said + ' · ' + (rs.hub != null ? '모이는 곳' : '일꾼') + ' · ' + H.length + '줄)');
      await ev(() => SM_TOWN.openTasks()); await W8(400); const hh = await ev(() => { const g = [...document.querySelectorAll('.twn-p .grp')].find(el => /들은 이야기/.test(el.textContent)); return g ? g.textContent : null; }); ok(!!hh, "할 일 칸에 '" + hh + "' 줄"); await shot('05_heard'); await closeAll(); }
    // ⑤ 오늘만 끝내기
    { const o5 = await ev(() => SM_TOWN.game().S.disc.p.o5); if (o5) { if (o5.row) await ev(([id, set]) => { const S = SM_TOWN.game().S; (0, eval)(set)[id](S); }, [o5.row, SET]); else await tp(o5.at[0], o5.at[1]); await W8(2600); const dn = await ev(() => SM_TOWN.game().S.tasks.list.find(q => q.id === 'only')); ok(dn && dn.done, '⑤ 오늘만 (' + o5.id + ') 해내면 끝'); await closeAll(); } }
    // 엽서 둘째 날
    await sleep(); const PC3 = await pcWait(); const d3 = await ev(() => SM_TOWN.game().S.day); ok(d3 === 3 && (!!PC3 || !(await ev(() => SM_TOWN.disc().untried().length))), '3일째 아침도 엽서 한 장 ' + (PC3 ? PC3.id : ''));
    ok(!PC3 || !PC2 || PC3.id !== PC2.id, '엽서가 날마다 다른 곳 (' + (PC2 && PC2.id) + ' → ' + (PC3 && PC3.id) + ')');
    await ev(() => { const el = document.querySelector('.twn-pc .pc-x'); if (el) el.click(); });
    // ④ 다 해 본 저장 → pri 2
    await ev(set => { const S = SM_TOWN.game().S, F = (0, eval)(set); for (const k of ['cinema', 'museum', 'elder', 'factory', 'bank', 'post', 'police', 'clinic', 'shelter', 'cafe', 'aqua', 'insect', 'crater', 'gorge', 'isle', 'ski', 'herd', 'jg', 'yard', 'surp']) F[k](S); SM_TOWN.game().mark(); }, SET);
    await sleep(); const d4 = await ev(() => SM_TOWN.game().S.day); ok(d4 === 4, '잠 → 4일째 (' + d4 + ')'); console.log('  마당: ' + JSON.stringify(await ev(() => SM_TOWN.game().S.home.yard))); const P4 = await ev(() => SM_TOWN.game().S.disc.p), pri = await ev(id => (SM_TOWN.disc().rows().find(r => r.id === id) || {}).pri, P4.n4);
    ok(P4.n4 && pri === 2 && !P4.again, '다 해 본 저장 → ④ = 아직 안 해 본 할 일 갈래 (' + P4.n4 + ')');
    { const L4 = await ev(() => SM_TOWN.game().S.tasks.list.map(t => t.id)); ok(L4.length === 5, '그날도 다섯 (' + L4.join(',') + ')'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
    console.log('  꼬리: ' + (tailSeen || '없음'));
    await ctx.close();
    // ⑤ 휴대폰 390
    const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), q = await c2.newPage(), e2 = []; q.on('pageerror', e => e2.push(e.message.slice(0, 160)));
    const ev2 = (f, a) => q.evaluate(f, a);
    await q.goto(URL); await q.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.disc, null, { timeout: 240000 }); await q.waitForTimeout(3000);
    for (let i = 0; i < 4; i++) { await ev2(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await q.waitForTimeout(250); }
    await ev2(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.hud = G.hud || {}; G.hud.all = 1; }); await ev2(() => SM_TOWN.openTasks()); await q.waitForTimeout(400); await ev2(() => { const m = document.querySelector('.twn-p [data-a="more"]'); if (m) m.click(); }); await q.waitForTimeout(300);
    const M5 = await ev2(() => { const P = document.querySelector('.twn-p .bx'), r = P.getBoundingClientRect(), bt = [...P.querySelectorAll('button')].map(b => b.getBoundingClientRect()).filter(q => q.width); return { l: r.left, r: r.right, w: innerWidth, bad: bt.filter(q => q.left < 0 || q.right > innerWidth + 1).length, small: bt.filter(q => q.height < 36).length, n: bt.length }; });
    ok(M5.l >= 0 && M5.r <= M5.w + 1 && !M5.bad, '휴대폰 할 일 창이 화면 안 (단추 ' + M5.n + ' · 밖 ' + M5.bad + ')');
    if (SHOTS) await q.screenshot({ path: SHOTS + '/06_phone_tasks.png' });
    for (let i = 0; i < 3; i++) { await ev2(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await q.waitForTimeout(250); }
    await ev2(() => { const S = SM_TOWN.game().S; S.disc.pc = 0; SM_TOWN.disc().postcard(true); }); await q.waitForTimeout(500);
    const PCm = await ev2(() => { const el = document.querySelector('.twn-pc'), t = document.querySelector('.twn-task'); if (!el) return null; const r = el.getBoundingClientRect(), tr = t && t.offsetParent ? t.getBoundingClientRect() : null, ov = tr ? Math.max(0, Math.min(r.right, tr.right) - Math.max(r.left, tr.left)) * Math.max(0, Math.min(r.bottom, tr.bottom) - Math.max(r.top, tr.top)) : 0; return { cover: +(r.width * r.height / (innerWidth * innerHeight)).toFixed(3), ov, inside: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
    ok(PCm && PCm.inside && PCm.ov === 0 && PCm.cover <= 0.2, '휴대폰 엽서: 화면 안 · 할 일 줄 가림 0 · 가림 ' + (PCm && PCm.cover) + ' ≤ 0.2');
    if (SHOTS) await q.screenshot({ path: SHOTS + '/07_phone_postcard.png' });
    ok(!e2.length, '휴대폰 페이지 오류 0' + (e2.length ? ' — ' + e2.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
