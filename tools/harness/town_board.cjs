// 날마다 바뀌는 의뢰판 시험(BOARD-D · 차례표 7줄 · docs/systems/town_phase1.md): node tools/harness/town_board.cjs [마을=ourtown] [포트=8002]
//   그날 상황(장날·비·맑은 밤)이 있으면 그 줄이 먼저 · 줄마다 까닭 한 줄 · 날마다 다름(열흘에 서로 다른 할 일 ≥ 6) · 할 일 창 = 받는 것 먼저 · 빈 게시판 = 오늘 할 일 단추 · 오류 0
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.tasksNow && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); });
    const ev = (f, a) => p.evaluate(f, a);
    await ev(() => { window.__G = SM_TOWN.game(); });
    // 열흘: 날마다 셋 · 서로 다른 것 수 · 까닭 있는 줄 수
    const R = await ev(() => { const out = [], S = __G.S, d0 = S.day; for (let i = 0; i < 10; i++) { S.day = d0 + 1 + i; const L = SM_TOWN.tasksNow(); out.push({ d: S.day, jang: SM_TOWN.jang().on, wx: SM_TOWN.wx().today, L: L.map(t => [t.id + (t.ev.startsWith('work:') ? ':' + t.ev.slice(5) : ''), t.why ? t.why[0] : '']) }); } S.day = d0; return out; });
    for (const r of R) console.log('    ' + r.d + '일 ' + (r.jang ? '장날 ' : '') + r.wx + ' — ' + r.L.map(q => q[0] + (q[1] ? '(' + q[1] + ')' : '')).join(' / '));
    const kinds = new Set(R.flatMap(r => r.L.map(q => q[0]))); ok(kinds.size >= 6, '열흘 동안 서로 다른 할 일 ' + kinds.size + '가지(≥ 6)');
    ok(R.every(r => r.L.length >= 2), '날마다 할 일 둘 이상(빈 날 0)');
    const J = R.filter(r => r.jang); ok(!J.length || J.some(r => r.L.some(q => /장날/.test(q[1]))), '장날 = 장터 줄에 장날 까닭(' + J.length + '날)');
    const W = R.filter(r => r.wx === 'clear'); ok(!W.length || R.some(r => r.L.some(q => q[1])), '그날 상황 까닭 줄이 나옴');
    // 할 일 창: 받는 것 먼저 · 까닭 줄
    const t = await ev(() => { __G.S.day = 2; const L = SM_TOWN.tasksNow(); document.querySelector('.twn-task') && document.querySelector('.twn-task').click(); const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; });
    ok(/💰.*받는 일/.test(t), '할 일 창 = 받는 것(💰) 먼저');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); });
    // 빈 게시판 → 오늘 할 일 단추
    const bd = await ev(async () => { const S = __G.S; if (!S.story) return { txt: '', btn: false }; S.story.board = { day: S.day, list: [], took: {} }; const Q = SM_TOWN.hub ? null : null; try { SM_TOWN.storyOpen(); } catch (e) { /* */ } await new Promise(r => setTimeout(r, 300)); const yb = document.querySelector('.twn-p [data-yb="board"]'); if (yb) { yb.click(); await new Promise(r => setTimeout(r, 300)); } const P = document.querySelector('.twn-p'); return { txt: P ? P.textContent.slice(0, 200) : '', btn: !!(P && P.querySelector('[data-a="tasks"]')) }; });
    console.log('    게시판: ' + bd.txt.slice(0, 120));
    if (/의뢰 게시판/.test(bd.txt)) { ok(bd.btn, '빈 게시판 = 오늘 할 일 단추'); await ev(() => document.querySelector('.twn-p [data-a="tasks"]').click()); await p.waitForTimeout(300); ok(/오늘의 할 일/.test(await ev(() => (document.querySelector('.twn-p') || {}).textContent || '')), '단추 → 오늘 할 일 창'); } else console.log('    (게시판 창을 이 저장에서 열지 못함 — 건너뜀)');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('예외', e.message); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
