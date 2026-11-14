// 🔑 아이 번호 비밀번호 풀기 시험(PIN-1 · 11-14): node tools/harness/town_pin1.cjs [마을=ourtown] [포트=8921] [--mock=8923] [--pics=폴더(그리기 끔 · 창 사진만 · 커밋 X)]
//   화면 서버(포트)는 미리 떠 있어야 함(gm.sh · python3 -m http.server) · 흉내 서버(server/cf-rooms/mock.mjs)는 이 하네스가 띄움(8923 · 잡혀 있으면 빈 포트) · 시험 반 = zzpin1(메모리 DB · 끝나면 사라짐)
//   ① 아이 A(빈 저장소): 3번 + 처음 비밀번호 두 번 → 판을 바꿈(5일째) → 창을 떠남(올림) · 아이 화면에 풀기 단추·🔑 0
//   ② 교사 반 표: 이 기기 판 = 칸 다섯(풀기 X) · ☁️ 서버 판 = 여섯째 칸 「🔑 비밀번호」 + 줄마다 「풀기」 · 1366×768·680에서 한 화면 · 줄 넘침 X
//   ③ 풀기 → 한 번 더 묻기 → [그만] = 그대로 · [🔑 풀기] = 알림 + 그 줄 「풀림」 · 판(요약)은 그대로 · 서버 줄 np
//   ④ 안 될 때 알림 넷(잠김 423 · 주소 없음 404 · 끊김 · 틀린 열쇠 403 = 열쇠 다시 넣기) — 서버 답을 가로채 흉내(진짜 잠금·열쇠 셈은 server/cf-rooms/test_teach.mjs)
//   ⑤ 영어 글
//   ⑥ 아이 B(빈 저장소): 3번 + 새 비밀번호 한 번 → 판 그대로(5일째 · 돈) · 다른 빈 기기에서 옛 비밀번호 = 못 들어감
//   ⑦ 아이 A 기기(노란 번호): 「비밀번호를 잊었어요」 → 선생님 비밀번호 → 새 네 자리 = 들어감
//   ⑧ PIN-1B 열려 있는 창: 아이 A가 3번으로 놀고 있을 때 선생님이 풂 → 그 창의 다음 주기 저장(45초)을 서버가 거절(409 relog) → 알림 한 번 · 서버 줄은 풀린 채(판 그대로) · 그 창은 저장을 멈춤 → 새 비밀번호 /load로 잡힘 · /save 됨(기다림 두 번 = 약 1분 반)
//   아래 열쇠·비밀번호는 모두 이 시험만의 가짜 값
const { chromium } = require('./pw.cjs');
const path = require('path'), fs = require('fs'), net = require('net'), cp = require('child_process'), crypto = require('crypto');
const AR = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = AR.find(a => !/^\d+$/.test(a)) || 'ourtown', PORT = AR.find(a => /^\d+$/.test(a)) || '8921';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const PICS = arg('pics'), CLS = 'zzpin1', TPIN = '1234', HASH = crypto.createHash('sha256').update('mv-memo:' + TPIN).digest('hex'), KEY = 'pinkey77', P_OLD = '1234', P_NEW = '5678', P_3RD = '2468', P_4TH = '1357';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const portFree = p9 => new Promise(r => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p9, '127.0.0.1', () => s.close(() => r(true))); });
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p9 = s.address().port; s.close(() => r(p9)); }); });
const ROOT = path.resolve(__dirname, '../..');
(async () => {
  if (PICS) fs.mkdirSync(PICS, { recursive: true });
  const ST = await import(path.join(ROOT, 'v2/games/town_story.js'));
  const CH = ST.CHAPTERS.filter(c => !c.quest && !c.hold && c.steps.length > 2);
  const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), today = dk(new Date());
  /* 반 아이 판 흉내(마을 GAME.S 꼴 · 실제 장 id) — 번호 n · 글 칸이 길어도 줄이 안 넘치는지 보려고 긴 글 한 줄 */
  const LINES = ['가게가 가까워서 걸어갈 수 있어요', '버스 정류장이 학교 앞에 있어서 편해요 그리고 큰길 옆이라 소방차도 빨리 나가고 시장 날에는 사람이 많이 와요', '논에 물이 많아서 개구리가 살아요'];
  function fakeS(n) { const c = CH[(n * 7) % CH.length], i = n % (c.steps.length - 1), d0 = CH.slice(0, n % 6).map(q => q.id), st = [];
    for (let k = 0; k < 2 + (n % 5); k++) st.push({ c: c.id, s: c.steps[k % c.steps.length].id, h: k === 1 && n % 4 === 0 ? 3 : 0, tr: 0 });
    st.push({ c: c.id, s: c.steps[0].id, h: 0, t: LINES[n % LINES.length] });
    return { v: 2, day: 3 + n, money: 500 * n, sv: { at: Date.now() - n * 60000 }, story: { cur: c.id, i, done: Object.fromEntries(d0.map(x => [x, { d1: 1 }])), v: {}, paused: null }, rec: { v: 1, days: { [today]: { g0: 1, g1: 2, st, cd: [], q: [{ id: 'q' + n, ok: 1 }], help: [] } } } }; }

  const want = +(arg('mock') || 8923), MP = (await portFree(want)) ? want : await freePort();
  const mock = cp.spawn(process.execPath, ['--no-warnings', path.join(ROOT, 'server/cf-rooms/mock.mjs'), String(MP)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise(r => { mock.stdout.on('data', d => { if (/흉내 서버/.test(String(d))) r(); }); setTimeout(r, 4000); });
  const post = async (p9, b9) => { try { const r = await fetch('http://127.0.0.1:' + MP + p9, { method: 'POST', headers: { Origin: 'http://127.0.0.1:' + PORT, 'content-type': 'application/json' }, body: JSON.stringify(b9) }); return { st: r.status, j: await r.json().catch(() => null) }; } catch (e) { return { st: 0, j: null }; } };
  for (let n = 1; n <= 25; n++) if (n !== 3) await post('/save/' + CLS + '/' + n, { pin: String(1000 + n), data: fakeS(n) });
  console.log('   흉내 서버 ' + MP + ' · 시험 반 ' + CLS + ' 24명 저장(3번은 아이 A가 직접)');

  const CFQ = '&cf=http://127.0.0.1:' + MP, UT = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0' + CFQ, UK = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&login=1&adapt=0&cls=' + CLS + CFQ;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [], VP = { viewport: { width: 1366, height: 768 } };
  const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|403|423|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource|CORS|Access-Control/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 200)); }); };
  const memo = p => p.route('**/metaverse/memoPin.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HASH) }));
  const keys = async (p, pin, w) => { for (const d of pin) await p.click('button[data-p="' + d + '"]'); await p.waitForTimeout(w == null ? 1500 : w); };
  const inGame = p => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 240000 });
  /* 아이 화면 = 번호·비밀번호 판(화면을 덮는 틀) 안의 단추만 셈 */
  const kidUi = p => p.evaluate(() => { const b0 = document.querySelector('button[data-n],button[data-p]'), el = b0 ? b0.closest('body > div') : null, bs = el ? [...el.querySelectorAll('button')] : []; return { pc: document.querySelectorAll('[data-a="pc"],[data-a="pcy"],[data-a="pcn"],button.pc').length, key: /🔑/.test((el || document.body).innerText), nb: bs.length, as: bs.filter(x => x.dataset.a).map(x => x.dataset.a).join(','), t: (el || document.body).innerText.replace(/\s+/g, ' ').slice(0, 160) }; });
  try {
    console.log('① 아이 A — 3번 처음 비밀번호 · 판을 바꾸고 떠남');
    const ctxA = await b.newContext(VP), A = await ctxA.newPage(); watch(A, 'A');   /* 이 쪽에는 아직 route를 걸지 않음 — 가로채기가 켜져 있으면 창을 떠날 때의 올림(keepalive)이 끊김 */
    await A.goto(UK); await A.waitForSelector('button[data-n="3"]', { timeout: 120000 });
    { const u = await kidUi(A); ok(u.pc === 0 && !u.key && u.nb === 30, '번호 화면: 번호 단추 ' + u.nb + '개뿐 · 풀기 단추·🔑 없음'); }
    await A.click('button[data-n="3"]');
    { const u = await kidUi(A); ok(u.pc === 0 && !u.key && u.nb === 13 && u.as === 'clr,del,back' && /처음이에요/.test(u.t), '비밀번호 화면(기록 없는 번호): 단추 ' + u.nb + '개(숫자 10 · 지우기 · ⬅️ · 번호 다시) · 새 단추 없음'); }
    await keys(A, P_OLD); await keys(A, P_OLD); await inGame(A); await A.waitForTimeout(2000);
    await A.evaluate(() => { const G = SM_TOWN.game(); G.S.money = 4321; G.S.day = 5; G.mark(); G.flush(); });
    { const u = await kidUi(A), tch = await A.evaluate(() => { try { return sessionStorage.getItem('sm.t'); } catch (e) { return 'err'; } }); ok(u.pc === 0 && !tch, '아이 놀이 화면: 풀기 단추 0 · 선생님 모드 아님'); }
    await A.goto('about:blank');   /* pagehide → 올림 */
    let sv = null; for (let i = 0; i < 16 && !sv; i++) { const r = await post('/load/' + CLS + '/3', { pin: P_OLD }); if (r.st === 200 && r.j && r.j.data && r.j.data.day === 5) sv = r.j; else await sleep(500); }
    ok(!!sv && sv.data.money === 4321, '서버에 3번 판이 올라감(5일째 · 돈 4321)');

    console.log('② 교사 반 표 — 서버 판에만 비밀번호 칸');
    const ctxT = await b.newContext(VP), p = await ctxT.newPage(); watch(p, 'T'); await memo(p);
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const pic = async n => { if (!PICS) return; await W8(300); await p.screenshot({ path: PICS + '/' + n + '.png' }); console.log('    📷 ' + PICS + '/' + n + '.png'); };
    const shutAll = async () => { for (let i = 0; i < 6; i++) { const n = await ev(() => { const a = document.querySelector('.lb-ask'); if (a && a._x) { a._x(); return 1; } const d = document.querySelector('.twn-dlg'); if (d) return 2; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 1; } if (document.querySelector('.twn-p')) return 3; return 0; }); if (!n) return; if (n === 2) await p.keyboard.press('KeyE'); if (n === 3) await p.keyboard.press('Escape'); await W8(300); } };
    /* 표 한눈에: 칸 머리 · 줄 수 · 풀기 단추 · 풀림 줄 · 줄 높이(넘침 = 높이가 달라짐) · 단추가 칸 안 · 창 스크롤 · 알림 · 묻는 줄 */
    const tb = () => ev(() => { const t = document.querySelector('.twn-p table.tch-t'), bx = document.querySelector('.twn-p .bx'); if (!t || !bx) return null; const rr = t.getBoundingClientRect(), br = bx.getBoundingClientRect(), rows = [...t.querySelectorAll('tr.r')], hs = rows.map(r => Math.round(r.getBoundingClientRect().height * 2) / 2), th = [...t.querySelectorAll('th')], B = [...t.querySelectorAll('button.pc')], aq = t.querySelector('tr.dt.ask'), ar = aq ? aq.getBoundingClientRect() : null, m = document.querySelector('.twn-p .tch-msg');
      const fit = B.every(b9 => { const x = b9.getBoundingClientRect(), y = b9.closest('td').getBoundingClientRect(); return x.left >= y.left - 0.5 && x.right <= y.right + 0.5 && x.top >= y.top - 0.5 && x.bottom <= y.bottom + 0.5 && b9.scrollWidth <= b9.clientWidth + 1; });
      const cell = n => { const r = rows.find(q => q.querySelector('td.n').textContent.replace('*', '') === String(n)); return r ? [...r.querySelectorAll('td')].slice(1, 4).map(x => x.textContent).join(' | ') : null; };
      return { th: th.map(x => x.textContent), thH: th.map(x => Math.round(x.getBoundingClientRect().height)), thFit: th.every(x => x.scrollWidth <= x.clientWidth + 1), n: rows.length, pc: B.length, pcT: [...new Set(B.map(b9 => b9.textContent))].join('|'), np: [...t.querySelectorAll('td.k .mu')].map(x => x.closest('tr').querySelector('td.n').textContent + ':' + x.textContent), hMin: Math.min(999, ...hs), hMax: Math.max(0, ...hs), fit, bottom: Math.round(rr.bottom), vh: innerHeight, sh: bx.scrollHeight, ch: bx.clientHeight, sw: bx.scrollWidth, cw: bx.clientWidth, key: !!document.querySelector('.twn-p [data-i="key"]'), msg: m ? m.textContent : '', msgOk: !!(m && m.classList.contains('ok')), msgC: m ? getComputedStyle(m).color : '', ask: aq ? aq.innerText.replace(/\s+/g, ' ').trim() : '', askVis: ar ? ar.top >= br.top - 1 && ar.bottom <= br.bottom + 1 : false, askH: ar ? Math.round(ar.height) : 0, askB: aq ? [...aq.querySelectorAll('button')].map(b9 => b9.textContent) : [], dt: t.querySelectorAll('tr.dt:not(.ask)').length, c3: cell(3), c7: cell(7), bar: (document.querySelector('.twn-p .tch-bar') || {}).innerText || '' }; });
    const click = s => ev(q => { const e = document.querySelector('.twn-p ' + q); if (!e) return false; e.click(); return true; }, s);
    const fill = (code, k1, k2) => ev(([c, a, b9]) => { const q = s => document.querySelector('.twn-p [data-i="' + s + '"]'); if (q('code')) q('code').value = c; if (q('key')) q('key').value = a; if (q('key2')) q('key2').value = b9; }, [code, k1, k2 || '']);
    const unlock = async () => { await ev(() => { SM_TOWN.teach().home(); return 1; }); await W8(600); await p.keyboard.type(TPIN); await p.keyboard.press('Enter'); await W8(1200); };
    const toCloud = async () => { await click('[data-a="board"]'); await W8(600); await click('[data-s="cloud"]'); await W8(400); await fill(CLS, KEY); await click('[data-a="pull"]'); await W8(1200); };
    await p.goto(UT); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.teach, null, { timeout: 240000 }); await W8(1500);
    await shutAll(); await W8(600); await unlock();
    ok(await ev(() => { const P = document.querySelector('.twn-p'); return !!P && P.dataset.k === 'tch'; }), '선생님 비밀번호 → 선생님 칸');
    await click('[data-a="board"]'); await W8(700);
    { const S = await tb(); ok(!!S && S.th.length === 5 && S.pc === 0, '이 기기 판 = 칸 다섯 · 풀기 단추 0'); }
    await click('[data-s="cloud"]'); await W8(400);
    { const S = await tb(); ok(!!S && S.th.length === 5 && S.pc === 0 && S.key, '서버 판(열쇠 넣기 전) = 칸 다섯 · 풀기 단추 0'); }
    await fill(CLS, KEY); await click('[data-a="pull"]'); await W8(1200);
    ok(await ev(() => !!document.querySelector('.twn-p [data-a="claim"]')), '열쇠 없는 반 = 처음 정하기 칸'); { const S = await tb(); ok(!!S && S.pc === 0, '처음 정하기 동안 = 풀기 단추 0'); }
    await fill(CLS, KEY, KEY); await click('[data-a="claim"]'); await W8(1500);
    let S = await tb();
    ok(!!S && S.th.length === 6 && /🔑/.test(S.th[5]) && /비밀번호/.test(S.th[5]), '서버 판(받은 뒤) = 여섯째 칸: ' + (S && S.th.join(' | ')));
    ok(S.n === 25 && S.pc === 25 && S.pcT === '풀기' && !S.np.length, '25줄 · 줄마다 「' + S.pcT + '」 ' + S.pc + '개 · 풀림 0');
    ok(S.hMin === S.hMax && S.fit && S.thFit && S.thH[5] === S.thH[0], '줄 넘침 X(줄 높이 ' + S.hMin + '~' + S.hMax + ' · 단추가 칸 안 · 머리 글 안 잘림)');
    ok(S.bottom <= S.vh && S.sh <= S.ch + 2 && S.sw <= S.cw + 1, '1366×768 한 화면(표 아래 ' + S.bottom + ' ≤ ' + S.vh + ' · 창 스크롤 ' + (S.sh - S.ch) + ' · 옆 넘침 ' + (S.sw - S.cw) + ')'); await pic('pin1_1_board_768');
    await p.setViewportSize({ width: 1366, height: 680 }); await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(500); S = await tb();
    ok(S.sh <= S.ch + 2 && S.sw <= S.cw + 1 && S.hMin === S.hMax && S.fit, '창 높이 680(크롬북 주소창 뺀 어림)에서도 한 화면(창 스크롤 ' + (S.sh - S.ch) + ' · 줄 높이 ' + S.hMin + ')'); await pic('pin1_2_board_680');

    console.log('③ 풀기 → 한 번 더 묻기');
    await click('button.pc[data-n="25"]'); await W8(400); S = await tb();
    ok(/^25번 비밀번호를 풀까요\?/.test(S.ask) && /판\(진행\)은 그대로예요/.test(S.ask) && S.askB.join('|') === '🔑 풀기|그만', '묻는 줄: ' + S.ask);
    ok(S.askVis && S.dt === 0, '맨 아랫줄(25번)에서도 묻는 줄이 창 안에 보임(680) · 자세히 줄은 안 열림'); ok(S.askH <= 48, '묻는 줄이 한 줄(높이 ' + S.askH + ')'); await pic('pin1_3_ask_680');
    await click('[data-a="pcn"]'); await W8(300); S = await tb(); ok(!S.ask && S.pc === 25 && !S.msg, '[그만] = 묻는 줄 닫힘 · 그대로');
    ok((await post('/load/' + CLS + '/25', { pin: '1025' })).st === 200, '[그만] 뒤 25번은 옛 비밀번호 그대로(서버)');
    await p.setViewportSize({ width: 1366, height: 768 }); await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(400);
    const c3a = (await tb()).c3;
    await click('button.pc[data-n="3"]'); await W8(300); S = await tb(); ok(/^3번 비밀번호를 풀까요\?/.test(S.ask), '3번 풀기 → 묻는 줄'); await pic('pin1_4_ask_768');
    await click('[data-a="pcy"]'); await W8(1200); S = await tb();
    ok(S.msg === '3번 비밀번호를 풀었어요. 그 아이가 들어와서 새 비밀번호를 정하면 돼요' && S.msgOk, '[🔑 풀기] 알림: ' + S.msg + ' (색 ' + S.msgC + ')');
    ok(S.np.join() === '3:풀림' && S.pc === 24 && S.n === 25 && !S.ask, '3번 줄 = 「풀림」(단추 X) · 다른 줄은 그대로 ' + S.pc + '개');
    ok(S.c3 === c3a && !!c3a, '3번 줄 판 요약 그대로(' + (c3a || '').slice(0, 50) + ')'); await pic('pin1_5_cleared');
    { const r = await post('/class/' + CLS, { tkey: KEY }), q = r.j && r.j.L ? r.j.L.find(x => x.n === 3) : null; ok(!!q && q.np === 1 && q.s && q.s.day === 5 && r.j.L.filter(x => x.np).length === 1, '서버: 3번만 np · 요약 5일째 그대로'); }
    await ev(() => { SM_TOWN.teach().board('cloud'); return 1; }); await W8(400); S = await tb(); ok(S.np.join() === '3:풀림' && !S.msg, '판을 다시 열어도 3번 = 「풀림」');

    console.log('④ 안 될 때 알림');
    let mode = '';
    await p.route('**/pinclear/**', r => { if (r.request().method() !== 'POST' || !mode) return r.continue(); if (mode === 'cut') return r.abort(); const st = +mode, H = { 'access-control-allow-origin': '*' };
      return st === 404 ? r.fulfill({ status: 404, headers: { ...H, 'content-type': 'text/plain; charset=utf-8' }, body: '없는 주소예요' }) : r.fulfill({ status: st, headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ ok: false }) }); });
    const tryN = async (m9, n) => { mode = m9; await click('button.pc[data-n="' + n + '"]'); await W8(250); await click('[data-a="pcy"]'); await W8(900); mode = ''; return tb(); };
    S = await tryN('423', 7); ok(S.msg === '잠깐 잠겼어요. 10분 뒤에 다시 해요' && !S.msgOk && S.pc === 24, '잠김(423): ' + S.msg);
    S = await tryN('404', 7); ok(S.msg === '서버가 아직 준비 중이에요. 조금 뒤에 다시 해요' && !S.msgOk, '주소 없음(404 · 배포 전): ' + S.msg);
    S = await tryN('cut', 7); ok(/^서버에 닿지 못했어요/.test(S.msg) && /준비 중/.test(S.msg) && !S.msgOk && S.pc === 24, '끊김: ' + S.msg);
    S = await tryN('403', 7); ok(S.msg === '교사 열쇠가 달라요. 열쇠를 다시 넣고 받아요' && S.key && S.pc === 0 && S.th.length === 5, '틀린 열쇠(403): ' + S.msg + ' → 열쇠 칸이 다시 나오고 풀기 단추 0'); await pic('pin1_6_badkey');
    await p.unroute('**/pinclear/**');
    ok((await post('/load/' + CLS + '/7', { pin: '1007' })).st === 200, '안 된 네 번 뒤 7번은 옛 비밀번호 그대로(서버)');
    await fill(CLS, KEY); await click('[data-a="pull"]'); await W8(1200); S = await tb(); ok(S.pc === 24 && S.np.join() === '3:풀림' && !S.msg, '열쇠를 다시 넣고 받기 = 표 돌아옴(풀림 3번 그대로)');

    console.log('⑤ 영어 글');
    { const lang = () => ev(() => { const c = [...document.querySelectorAll('.chip.gchip')].find(e => /^☰/.test((e.textContent || '').trim()) && getComputedStyle(e).display !== 'none'); if (!c) return false; c.click(); const b9 = document.querySelector('.twn-p button[data-a="lang"]'); if (!b9) return false; b9.click(); return true; });
      await shutAll(); const sw = await lang(); await W8(1500);
      if (!sw) ok(false, '메뉴 언어 단추를 못 찾음'); else { await unlock(); await toCloud(); S = await tb();
        ok(!!S && S.th.length === 6 && /🔑 PIN/.test(S.th[5]) && S.pcT === 'Clear' && S.np.join() === '3:cleared' && S.fit && S.thFit && S.hMin === S.hMax, '영어 표: ' + (S && S.th[5]) + ' · 「' + (S && S.pcT) + '」 · ' + (S && S.np.join()) + ' · 줄 넘침 X');
        await click('button.pc[data-n="7"]'); await W8(300); S = await tb(); ok(/^Clear the PIN for No\. 7\?/.test(S.ask) && /The game \(progress\) stays as it is/.test(S.ask) && S.askB.join('|') === '🔑 Clear|Cancel' && S.askH <= 48, '영어 묻는 줄: ' + S.ask); await pic('pin1_7_en_ask');
        await click('[data-a="pcn"]'); await W8(300); S = await tb(); ok(!S.ask, '영어 [Cancel] = 닫힘'); await shutAll(); await lang(); await W8(1200); } }

    console.log('⑥ 아이 B — 새 비밀번호 한 번 = 판 그대로');
    const ctxB = await b.newContext(VP), B = await ctxB.newPage(); watch(B, 'B');
    await B.goto(UK); await B.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await B.click('button[data-n="3"]');
    { const u = await kidUi(B); ok(u.pc === 0 && !u.key && u.nb === 13 && u.as === 'clr,del,back' && /처음이에요/.test(u.t), '풀린 번호의 아이 화면 = 예전 그대로(단추 ' + u.nb + '개 · 글 「처음이에요…」 · 새 창·새 단추 없음)'); }
    await keys(B, P_NEW, 300); await inGame(B); await B.waitForTimeout(1500);
    { const g = await B.evaluate(() => { const G = SM_TOWN.game(); return { money: G.S.money, day: G.S.day }; }); ok(g.day === 5 && g.money === 4321, '새 비밀번호 한 번 → 들어감 · 판 그대로(' + g.day + '일째 · 돈 ' + g.money + ')'); }
    { const r = await post('/class/' + CLS, { tkey: KEY }), q = r.j && r.j.L ? r.j.L.find(x => x.n === 3) : null; ok(!!q && !q.np, '서버: 3번 비밀번호가 다시 잡힘(np 없음)'); }
    await B.goto('about:blank'); await sleep(800);
    const ctxC = await b.newContext(VP), C = await ctxC.newPage(); watch(C, 'C');
    await C.goto(UK); await C.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await C.click('button[data-n="3"]'); await keys(C, P_OLD, 1200);
    ok(await C.evaluate(() => document.body.innerText.includes('다른 컴퓨터에서 정한 비밀번호와 달라요')), '다른 빈 기기에서 옛 비밀번호 = 못 들어감'); await C.close();

    console.log('⑦ 아이 A 기기(노란 번호) — 잊었어요 → 새 비밀번호');
    ok((await post('/pinclear/' + CLS + '/3', { tkey: KEY })).j.had === 1, '한 번 더 풂(서버에 바로)');
    await memo(A); await A.goto(UK); await A.waitForSelector('button[data-n="3"]', { timeout: 120000 });
    ok(await A.evaluate(() => /fff2c8|255, 242, 200/.test(document.querySelector('button[data-n="3"]').style.background)), '이 기기에서 해 본 번호 = 노란 번호');
    await A.click('button[data-n="3"]'); await A.click('button[data-a="forgot"]'); await A.waitForTimeout(600); await A.keyboard.type(TPIN); await A.keyboard.press('Enter'); await A.waitForTimeout(1200);
    ok(await A.evaluate(() => document.body.innerText.includes('선생님이 지웠어요. 새 비밀번호를 정해요')), '「비밀번호를 잊었어요」 + 선생님 비밀번호 = 이 기기 기록 지움');
    await keys(A, P_3RD, 300); const gone = await A.waitForFunction(() => !document.querySelector('button[data-p="1"]'), null, { timeout: 15000 }).then(() => true, () => false);
    ok(gone, '새 네 자리 한 번 → 번호 화면이 닫히고 들어감');
    { const r = await post('/class/' + CLS, { tkey: KEY }), q = r.j && r.j.L ? r.j.L.find(x => x.n === 3) : null, bad = (await post('/load/' + CLS + '/3', { pin: P_NEW })).st, good = (await post('/load/' + CLS + '/3', { pin: P_3RD })).st;   /* np부터 봄 — 빈 채였다면 아래 /load가 스스로 잡아 버림 */
      ok(!!q && !q.np && bad === 403 && good === 200, '서버: 3번 = 아이가 누른 새 비밀번호로 잡힘(앞의 것 ' + bad + ' · 새것 ' + good + ')'); }
    console.log('⑧ 열려 있는 창(PIN-1B) — 선생님이 풀어도 그 창이 다시 잡지 못함');
    await inGame(A); await A.waitForTimeout(2000);
    const seen = []; A.on('response', r9 => { const m = r9.url().match(/\/(save|load)\/zzpin1\/3$/); if (m) seen.push(m[1] + ' ' + r9.status()); });
    const pre = await post('/load/' + CLS + '/3', { pin: P_3RD });   /* 풀기 전 서버 판(견줄 것) */
    ok(pre.st === 200 && (await post('/pinclear/' + CLS + '/3', { tkey: KEY })).j.had === 1, '아이 A가 3번으로 놀고 있는 동안 선생님이 풂');
    await A.evaluate(() => { const G = SM_TOWN.game(); G.S.money = 999; G.S.day = 6; G.mark(); G.flush(); });
    const told = await A.waitForFunction(() => (SM_TOWN.game().S.ntf || []).some(o => /비밀번호가 풀렸어요\. 새로고침해서 다시 들어와요/.test(o.t)), null, { timeout: 70000 }).then(() => true, () => false);
    ok(told && seen.some(x => / 409$/.test(x)) && !seen.some(x => / 200$/.test(x)), '그 창의 다음 주기 저장(45초) = 서버가 거절(' + seen.join(' · ') + ') → 알림 「비밀번호가 풀렸어요. 새로고침해서 다시 들어와요」');
    { const r = await post('/class/' + CLS, { tkey: KEY }), q = r.j && r.j.L ? r.j.L.find(x => x.n === 3) : null; ok(!!q && q.np === 1 && q.at === pre.j.at && !!q.s && q.s.day === pre.j.data.day, '서버: 3번은 여전히 풀린 채(np) · 판 그대로(' + (q && q.s && q.s.day) + '일째 — 열린 창의 6일째가 안 올라감)'); }
    const n0 = seen.length; await A.evaluate(() => { const G = SM_TOWN.game(); G.S.money = 1000; G.mark(); G.flush(); }); await A.waitForTimeout(47000);
    { const n9 = await A.evaluate(() => SM_TOWN.game().S.ntf.filter(o => /비밀번호가 풀렸어요/.test(o.t)).length); ok(seen.length === n0 && n9 === 1, '그 창은 저장을 멈춤(다음 주기에 서버로 아무것도 안 보냄 · 알림은 한 번뿐)'); }
    { const q0 = (await post('/class/' + CLS, { tkey: KEY })).j.L.find(x => x.n === 3), r1 = await post('/load/' + CLS + '/3', { pin: P_4TH }), q1 = (await post('/class/' + CLS, { tkey: KEY })).j.L.find(x => x.n === 3);   /* np부터 봄(아래 /load가 잡음) */
      ok(q0.np === 1 && r1.st === 200 && !!r1.j.data && r1.j.at === pre.j.at && r1.j.data.day === pre.j.data.day && r1.j.data.money === pre.j.data.money && !q1.np, '그 뒤 다른 기기에서 새 비밀번호로 들어옴(/load) = 잡힘 · 판 그대로(' + (r1.j && r1.j.data && r1.j.data.day) + '일째 · 돈 ' + (r1.j && r1.j.data && r1.j.data.money) + ')');
      const r2 = await post('/save/' + CLS + '/3', { pin: P_4TH, data: { ...r1.j.data, day: 7 } }), r3 = await post('/load/' + CLS + '/3', { pin: P_3RD }); ok(r2.st === 200 && r3.st === 403, '새 비밀번호 저장 = 됨(' + r2.st + ') · 열려 있던 창의 비밀번호는 이제 ' + r3.st); }
    await A.goto('about:blank');
  } catch (e) { ok(false, '예외: ' + String(e && e.stack || e).slice(0, 400)); }
  ok(!errs.length, '콘솔 에러 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' / ') : ''));
  await b.close(); mock.kill();
  console.log(fails ? '✗ 실패 ' + fails : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})();
