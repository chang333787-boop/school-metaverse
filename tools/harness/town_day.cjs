// ⏰ 하루 한 바퀴 시험(DAY-2 · v2/games/town_day.js): node tools/harness/town_day.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 아침 시간표 줄: '⏰'으로 시작 · 오늘 때가 시간 차례 · 지금보다 늦은 때만(지난 때 빠짐) · 15:00로 옮기면 그 앞 때는 줄에서 빠짐
//   ② 줄을 누르면 오늘 시간표 창: 시간 차례 · 지난 줄 흐림(.past) · 🧭 = 빨간 선(위 가운데 줄 🧭)
//   ③ 하루 동안 한 일(화분 심고 물 · 소포 · 공장 상자 · 고칠 곳 신고 — 소포·공장·신고는 그 엔진이 쓰는 저장 칸을 그대로 채움)이 잠들기 전 하루 마무리 '내일 기다리는 것'에 나옴(셋 · 내가 한 일 먼저)
//      '오늘 바뀐 것' 줄(새 도감 · 고칠 곳 신고) · 하나 눌러 고름(내일 아침 빨간 선)
//   ④ 다음 날 아침: 줄 = '어제 기다린 것' 그 셋 · 고른 것까지 빨간 선 · 누르면 창(셋) → 그 뒤 줄 = 시간표
//   ⑤ 휴대폰 폭(390×844 · 터치): 줄 = 때 하나 · 화면 안 · 왼쪽 가방·할 일 줄과 겹치지 않음 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const tmOf = t => [...String(t).matchAll(/(\d\d):(\d\d)/g)].map(q => +q[1] * 60 + +q[2]);
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const page = async (vw, touch) => { const c = await b.newContext({ viewport: { width: vw[0], height: vw[1] }, hasTouch: !!touch, isMobile: !!touch }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); }); return p; };
  try { const p = await page([1280, 720]), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async (pp, n) => { if (!SHOTS) return; await pp.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async (pp = p) => { for (let i = 0; i < 5; i++) { if (!await pp.evaluate(() => !!document.querySelector('.twn-p'))) break; await pp.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await pp.waitForTimeout(250); if (await pp.evaluate(() => !!document.querySelector('.twn-p'))) { await pp.keyboard.press('Escape'); await pp.waitForTimeout(250); } } };
    const line = () => ev(() => { const D = SM_TOWN.dayx(); D.sec(); const el = D.el; return el ? { t: el.textContent, vis: el.style.display !== 'none', mode: D.mode, r: (r => [r.left, r.top, r.right, r.bottom].map(Math.round))(el.getBoundingClientRect()) } : null; });
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.dayx && SM_TOWN.dayx(), null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 7 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(1200);
    // ① 아침 줄
    const L7 = await line(), all = await ev(() => SM_TOWN.dayx().list().map(q => ({ m: q.m, g: q.g, s: q.s[0] })));
    console.log('  오늘 때 ' + all.length + ': ' + all.map(q => String((q.m / 60) | 0).padStart(2, '0') + ':' + String(q.m % 60).padStart(2, '0') + ' ' + q.s).join(' | '));
    console.log('  07:00 줄: ' + (L7 && L7.t)); const t7 = tmOf(L7 && L7.t);
    ok(L7 && L7.vis && /^⏰/.test(L7.t) && t7.length >= 2, "아침 줄이 보임 · '⏰' + 때 둘 이상(" + t7.length + ')');
    ok(t7.every((m, i) => i === 0 || m >= t7[i - 1]), '줄의 때 = 시간 차례'); ok(t7.every(m => m > 7 * 60), '줄의 때 = 모두 07:00 뒤');
    ok(all.every((q, i) => i === 0 || q.m >= all[i - 1].m), '오늘 때 목록 = 시간 차례(' + all.length + ')'); ok(all.some(q => q.g === 'work') && all.some(q => q.g === 'lunch'), '일꾼 점심 · 일 마침이 목록에');
    { const exp = []; const seen = new Set(); for (const q of all) { if (q.m <= 420 || seen.has(q.g)) continue; seen.add(q.g); exp.push(q.m); if (exp.length >= 3) break; } ok(JSON.stringify(exp) === JSON.stringify(t7), '줄 = 지금 뒤 첫 때 셋(갈래마다 하나) ' + JSON.stringify(exp)); }
    await shot(p, '01_line_0700');
    await ev(() => { SM_TOWN.game().S.min = 15 * 60; }); await W8(300); const L15 = await line(), t15 = tmOf(L15.t); console.log('  15:00 줄: ' + L15.t);
    ok(t15.length >= 1 && t15.every(m => m > 15 * 60) && !t7.filter(m => m <= 15 * 60).some(m => t15.includes(m)), '15:00 = 지난 때는 줄에서 빠짐');
    // ② 시간표 창
    await ev(() => SM_TOWN.dayx().el.click()); await W8(400);
    const P2 = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; const T = [...P.querySelectorAll('.dy-t .tm')]; return { k: P.dataset.k, tm: T.map(e => e.textContent), past: T.map(e => e.classList.contains('past')), go: P.querySelectorAll('button[data-go]').length }; });
    const pm = P2 ? P2.tm.map(t => tmOf(t)[0]) : [];
    ok(P2 && P2.k === 'dayt' && pm.length >= 3, "줄을 누르면 '오늘 시간표' 창(" + (P2 && P2.tm.length) + '줄)'); ok(pm.every((m, i) => i === 0 || m >= pm[i - 1]), '창 = 시간 차례');
    ok(P2 && pm.every((m, i) => P2.past[i] === (m <= 15 * 60) || (P2.past[i] && m > 15 * 60)), '지난 줄 = 흐림(.past) · 남은 줄 = 진하게'); ok(P2 && P2.go >= 1, '남은 때에 🧭 단추 ' + (P2 && P2.go));
    await shot(p, '02_today_panel');
    await ev(() => { const b9 = document.querySelector('.twn-p button[data-go]'); if (b9) b9.click(); }); await W8(500); const g2 = await ev(() => ({ g: (document.getElementById('hudGoal') || {}).textContent || '', r: SM_TOWN.routeNow() }));
    ok(!(await ev(() => !!document.querySelector('.twn-p'))) && (!!g2.r || /물때/.test(g2.g)), '🧭 = 창 닫힘 + 빨간 선(' + g2.g.slice(0, 40) + ' · ' + JSON.stringify(g2.r) + ')');
    await ev(() => SM_TOWN.guideOff && SM_TOWN.guideOff());
    // ③ 하루 동안 한 일
    await ev(() => { const G9 = SM_TOWN.game().S; G9.min = 10 * 60; if (G9.home) G9.home.pots = [null, null]; SM_TOWN.weather('clear'); }); await W8(500);
    const hasHome = await ev(() => !!(SM_TOWN.home && SM_TOWN.home() && SM_TOWN.home().id));
    if (hasHome) { await ev(() => SM_TOWN.potUse(0)); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p button[data-c]'); if (b9) b9.click(); }); await W8(300); await ev(() => SM_TOWN.potUse(0)); await W8(300); await closeAll(); }
    const pot = hasHome ? await ev(() => SM_TOWN.home().pots[0]) : null; ok(!hasHome || (pot && pot.st === 'grow'), '화분 심고 물 줌 ' + JSON.stringify(pot));
    const D0 = await ev(() => SM_TOWN.game().S.day);
    const fac = await ev(() => { SM_TOWN.bldg().info(); const G = SM_TOWN.game().S, d = G.day, IL = SM_TOWN.indoor.list();
      const L9 = IL.filter(q => q.kind === 'factory'), f = G.bldg.factory; f.made = d; f.ln = 'farm'; f.nm = L9[0] ? L9[0].name : ''; f.door = L9[0] && L9[0].at ? L9[0].at : null; f.n = (f.n | 0) + 1; delete f.dl;
      const po = IL.find(q => q.kind === 'post' && q.at) || IL.find(q => q.at), w0 = po ? { x: po.at[0] + 3, z: po.at[1] + 3 } : { x: 40, z: 40 };   /* 받는 이웃 자리(소포 엔진이 저장하는 꼴 그대로) */
      G.bldg.post.box = [{ id: 'pT', e: '🍓', to: 'w:t', k: 'stall', who: '장터 상인', icon: '🛒', cell: '나5', x: +(+w0.x).toFixed(1), z: +(+w0.z).toFixed(1), g: 0, d, ok: 0 }]; G.dayT = [w0.x, w0.z];
      G.dex['🦀'] = { d, c: '', s: '', t: '' }; SM_TOWN.game().mark(); return { made: f.made, nm: f.nm, door: f.door }; });
    console.log('  공장 ' + JSON.stringify(fac));
    await tp(15.4, 74); await W8(400); await ev(() => { SM_TOWN.sleep({ ask: true }); }); await W8(900);
    const R = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; return { pre: P.dataset.pre === '1', k: P.dataset.k, keys: [...P.querySelectorAll('button[data-dwi]')].map(e => e.dataset.tm), txt: [...P.querySelectorAll('button[data-dwi]')].map(e => e.textContent), ch: [...P.querySelectorAll('[data-dc]')].map(e => e.dataset.dc + ':' + e.textContent.slice(0, 40)), hd: !!P.querySelector('[data-dw]') }; });
    console.log('  내일 기다리는 것: ' + (R && R.txt.join(' / '))); console.log('  오늘 바뀐 것: ' + (R && R.ch.join(' / ')));
    ok(R && R.pre && R.hd, "잠들기 전 하루 마무리 창에 '내일 기다리는 것'"); ok(R && R.keys.length === 3, '셋까지(' + (R && R.keys.length) + ')');
    const wantK = hasHome ? ['grow', 'post', 'fac'] : ['post', 'fac']; ok(R && wantK.every(k => R.keys.includes(k)), '한 일이 나옴: ' + wantK.join('·') + ' → ' + (R && R.keys.join(',')));
    ok(R && R.keys.slice(0, wantK.length).every(k => wantK.includes(k)), '내가 한 일이 먼저'); ok(R && R.ch.some(c => /^dex:/.test(c)), "'오늘 바뀐 것'에 새 도감 줄");
    await shot(p, '03_recap');
    const pi = R ? R.keys.indexOf('post') : -1; await ev(i => { const b9 = document.querySelectorAll('.twn-p button[data-dwi]')[i]; if (b9) b9.click(); }, pi); await W8(300);
    const pin = await ev(() => ({ pin: SM_TOWN.game().S.dayw && SM_TOWN.game().S.dayw.pin, open: !!document.querySelector('.twn-p'), m: (document.querySelector('.twn-p [data-dwm]') || {}).textContent || '' }));
    ok(pin.open && pin.pin === pi && /내일 아침/.test(pin.m), '하나 누르면 고름(창은 그대로 · 내일 아침 빨간 선) — ' + pin.m);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(3200); await closeAll(); await W8(3500);
    // ④ 다음 날 아침
    const D1 = await ev(() => SM_TOWN.game().S.day); ok(D1 === D0 + 1, '다음 날(' + D1 + '일째)');
    const LY = await line(); console.log('  아침 줄: ' + (LY && LY.t)); const g4 = await ev(() => { const r = SM_TOWN.routeNow(), t = SM_TOWN.game().S.dayT; return { r, d: r && t ? Math.hypot(r.to[0] - t[0], r.to[1] - t[1]) : null }; });
    ok(LY && LY.vis && LY.mode === 'y' && /어제 기다린 것/.test(LY.t), "아침 줄 = '어제 기다린 것'"); ok(LY && /소포/.test(LY.t) && /공장/.test(LY.t), '그 셋이 줄에(소포 · 공장 상자' + (hasHome ? ' · 화분' : '') + ')');
    ok(g4.r && g4.d != null && g4.d < 1, '고른 것(소포 받는 이웃)까지 빨간 선 — ' + JSON.stringify(g4));
    await shot(p, '04_morning');
    await ev(() => SM_TOWN.dayx().el.click()); await W8(400); const PY = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k, n: P.querySelectorAll('button[data-yi]').length } : null; });
    ok(PY && PY.k === 'dayy' && PY.n === 3, "누르면 '어제 기다린 것' 창(셋)"); await closeAll(); const LT = await line(); ok(LT && LT.mode === 't' && /^⏰/.test(LT.t), '본 뒤 줄 = 오늘 시간표(' + LT.t + ')');
    ok(!errs.length, '페이지 오류 0 (데스크톱)' + (errs.length ? ' — ' + errs.join(' | ') : ''));
    await p.context().close();
    // ⑤ 휴대폰 폭
    const q = await page([390, 844], true), eq = (f, a) => q.evaluate(f, a);
    await q.goto(URL); await q.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.dayx && SM_TOWN.dayx(), null, { timeout: 240000 }); await q.waitForTimeout(1500); await closeAll(q); await q.waitForTimeout(1200);
    await eq(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.story = G.story || {}; G.story.p0auto = 1; G.dayw = null; }); await q.waitForTimeout(1500);
    const M = await eq(() => { const D = SM_TOWN.dayx(); D.sec(); const el = D.el, r = el.getBoundingClientRect(), box = e => { const b9 = e.getBoundingClientRect(); return [b9.left, b9.top, b9.right, b9.bottom]; }, hit = (a, c) => a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3];
      const me = [r.left, r.top, r.right, r.bottom], oth = [...document.querySelectorAll('.twn-task,.twn-bag,.twn-waitb,.gchip,.chip,.twn-mini,.twn-comp,#hudGoal')].filter(e => e !== el && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && e.style.display !== 'none');
      return { t: el.textContent, vis: el.style.display !== 'none', touch: document.body.classList.contains('touch'), small: document.body.classList.contains('small'), r: me.map(Math.round), over: oth.filter(e => hit(me, box(e))).map(e => e.className + ':' + (e.textContent || '').slice(0, 12)), area: Math.round((r.width * r.height) / (innerWidth * innerHeight) * 1000) / 10 }; });
    console.log('  휴대폰 줄: ' + JSON.stringify(M));
    ok(M.touch && M.vis && tmOf(M.t).length === 1, '휴대폰 = 때 하나(' + M.t + ')'); ok(M.r[0] >= 0 && M.r[2] <= 390 && M.r[1] >= 0 && M.r[3] <= 844, '화면 안'); ok(!M.over.length, '다른 칩·줄과 겹침 0' + (M.over.length ? ' — ' + M.over.join(' | ') : '')); ok(M.area < 3, '가림 ' + M.area + '% (< 3%)');
    await shot(q, '05_phone');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
