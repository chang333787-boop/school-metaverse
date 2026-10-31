// 🔒 선생님 칸·교사 화면 시험(TEACH-1 · 10-31 '2주 믿게 만들기' 셋째): node tools/harness/town_teach.cjs [마을=ourtown] [포트=8002] [--shots=폴더 | --pics=폴더(그리기 끔 · 창 사진만)]
//   ① 잠긴 채로는 못 누름: 이야기 창에 장 바로 열기·날 넘기기·기록 단추 0 · 날씨 창에 계절·날씨 고정 단추 0 · 가짜 단추(data-t·data-s·data-w)를 끼워 눌러도 그대로 · 교사 화면을 바로 불러도 비밀번호 창
//   ② 비밀번호: 틀린 숫자 = 그대로 잠김 · 맞는 숫자(Firebase memoPin 흉내) = 선생님 칸
//   ③ 비밀번호 뒤 누름: 장 바로 열기 → 그 장 · 날씨 비 → 예보대로 · 반 표(이 기기 판 · 붙여 넣기 25명 · 서버 흉내 /class 25명) · 1366×768 한 화면 · 줄 누르면 자세히
//   ④ 잠그기 = sm.t 꺼짐 · 다시 아이 화면
//   ⑤ 아이 흐름 안 막힘: 계절 문 = '선생님이 바꿔 줄 수도' + 날씨 칩 열기 · 계절이 멈춘 판 = '달력대로 돌아가기'로 풀림 · 날씨 고정 판 = '예보대로 돌아가기'
//   서버는 배포하지 않음 — server/cf-rooms/mock.mjs(흉내)를 빈 포트에 띄우고 ?cf=로 붙임 · 시험 반 = zzteach(메모리 DB · 끝나면 사라짐)
const { chromium } = require('./pw.cjs');
const path = require('path'), fs = require('fs'), net = require('net'), cp = require('child_process'), crypto = require('crypto');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots') || arg('pics'), PIN = '1234', HASH = crypto.createHash('sha256').update('mv-memo:' + PIN).digest('hex');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const ROOT = path.resolve(__dirname, '../..');
(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const ST = await import(path.join(ROOT, 'v2/games/town_story.js')), TS = await import(path.join(ROOT, 'v2/games/town_tsum.js'));
  const CH = ST.CHAPTERS.filter(c => !c.quest && !c.hold && c.steps.length > 2);
  const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), today = dk(new Date()), yd = dk(new Date(Date.now() - 864e5));
  const LINES = ['가게가 가까워서 걸어갈 수 있어요', '버스 정류장이 학교 앞에 있어서 편해요', '논에 물이 많아서 개구리가 살아요', '소방서가 큰길 옆이라 빨리 나가요', '시장 날에는 사람이 많이 와요'];
  /* 반 아이 판 흉내(마을 GAME.S 꼴 · 실제 장 id) — 번호 n */
  function fakeS(n) { const c = CH[(n * 7) % CH.length], i = n % (c.steps.length - 1), d0 = CH.slice(0, n % 6).map(q => q.id), day = n % 5 === 0 ? yd : today, st = [];
    for (let k = 0; k < 2 + (n % 5); k++) { const s9 = c.steps[k % c.steps.length]; st.push({ c: c.id, s: s9.id, h: k === 1 && n % 4 === 0 ? 3 : 0, tr: k === 1 && n % 4 === 0 ? 3 : 0 }); }
    st.push({ c: c.id, s: c.steps[0].id, h: 0, t: LINES[n % LINES.length] });
    return { v: 2, day: 3 + n, money: 500 * n, sv: { at: Date.now() - n * 60000 }, story: { cur: n % 9 === 0 ? null : c.id, i, done: Object.fromEntries(d0.map(x => [x, { d1: 1 }])), v: {}, paused: n % 9 === 0 ? c.id : null }, rec: { v: 1, days: { [day]: { g0: 1, g1: 2, st, cd: d0.length ? [{ c: d0[0], star: 0 }] : [], q: [{ id: 'q' + n, ok: 1 }, { id: 'r' + n, ok: n % 2 }], help: n % 3 ? [{ k: 'paddy', g: 2 }] : [] } } } }; }
  const exp = n => { const S = fakeS(n); return { kind: 'sm-town-rec', v: 1, town: ID, made: today, n, sum: TS.tsum(S), days: S.rec.days }; };

  const MP = await freePort(), mock = cp.spawn(process.execPath, ['--no-warnings', path.join(ROOT, 'server/cf-rooms/mock.mjs'), String(MP)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise(r => { mock.stdout.on('data', d => { if (/흉내 서버/.test(String(d))) r(); }); setTimeout(r, 4000); });
  const post = async (p9, b9) => { const r = await fetch('http://127.0.0.1:' + MP + p9, { method: 'POST', headers: { Origin: 'http://127.0.0.1:' + PORT, 'content-type': 'application/json' }, body: JSON.stringify(b9) }); return { st: r.status, j: await r.json().catch(() => null) }; };
  for (let n = 1; n <= 25; n++) await post('/save/zzteach/' + n, { pin: String(1000 + n), data: fakeS(n) });
  console.log('   흉내 서버 ' + MP + ' · 시험 반 zzteach 25명 저장');

  const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&cf=http://127.0.0.1:' + MP;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await p.route('**/metaverse/memoPin.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HASH) }));
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
    const pan = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.replace(/\s+/g, ' ').slice(0, 400) } : null; });
    const shutAll = async () => { for (let i = 0; i < 6; i++) { const n = await ev(() => { const a = document.querySelector('.lb-ask'); if (a && a._x) { a._x(); return 1; } const d = document.querySelector('.twn-dlg'); if (d) return 2; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 1; } if (document.querySelector('.twn-p')) return 3; return 0; }); if (!n) return; if (n === 2) await p.keyboard.press('KeyE'); if (n === 3) await p.keyboard.press('Escape'); await W8(300); } };
    const forge = (attr, val) => ev(([a, v]) => { const P = document.querySelector('.twn-p .bx'); if (!P) return false; const b9 = document.createElement('button'); b9.setAttribute(a, v); b9.textContent = 'x'; P.appendChild(b9); b9.click(); return true; }, [attr, val]);
    const tch = () => ev(() => { try { return sessionStorage.getItem('sm.t'); } catch (e) { return 'err'; } });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.teach, null, { timeout: 240000 }); await W8(1500);
    await shutAll(); await W8(600);

    console.log('① 잠긴 채로는 못 누름');
    ok(!(await tch()), '처음 = 선생님 모드 아님(sm.t 없음)');
    await p.keyboard.press('KeyQ'); await W8(700);
    { const B = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { t: P.querySelectorAll('[data-t]').length, due: P.querySelectorAll('[data-a="dueskip"]').length, rec: P.querySelectorAll('[data-a="rec"]').length, tch: P.querySelectorAll('[data-a="tch"]').length, det: P.querySelectorAll('details').length } : null; });
      ok(!!B && B.t === 0 && B.due === 0 && B.rec === 0, '이야기 창: 장 바로 열기 ' + (B && B.t) + ' · 날 넘기기 ' + (B && B.due) + ' · 기록 ' + (B && B.rec)); ok(!!B && B.tch === 1, '이야기 창: 🔒 선생님 칸 단추 하나'); await shot('teach_1_story_kid');
      const c0 = (await ev(() => SM_TOWN.story().cur)) || null, tgt = CH.find(c => c.id !== c0 && c.id !== 'p0').id; await forge('data-t', tgt); await W8(500); ok((await ev(() => SM_TOWN.story().cur)) === c0, '가짜 ▶ 단추(data-t=' + tgt + ')를 눌러도 장 그대로(' + c0 + ')'); }
    await shutAll(); await ev(() => SM_TOWN.sim.openWx()); await W8(500);
    { const W = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { s: [...P.querySelectorAll('[data-s]')].map(b9 => b9.dataset.s), w: [...P.querySelectorAll('[data-w]')].map(b9 => b9.dataset.w), t: P.innerText } : null; });
      ok(!!W && !W.s.length && !W.w.length, '날씨 창: 계절·날씨 고정 단추 0(' + (W && W.s.concat(W.w).join(',')) + ')'); ok(!!W && /선생님 칸/.test(W.t) && /예보/.test(W.t), '날씨 창: 예보는 그대로 + 바꾸는 곳 한 줄'); await shot('teach_2_wx_kid');
      const w0 = await ev(() => SM_TOWN.wx()), c0 = await ev(() => ({ ...SM_TOWN.game().S.cal })); await forge('data-w', w0.WX9 === 'rain' ? 'clear' : 'rain'); await W8(400); await forge('data-s', 'winter'); await W8(600);
      const w1 = await ev(() => SM_TOWN.wx()), c1 = await ev(() => ({ ...SM_TOWN.game().S.cal })); ok(w1.WX9 === w0.WX9 && w1.auto === w0.auto, '가짜 날씨 단추를 눌러도 날씨 그대로(' + w1.WX9 + ')'); ok(c1.on === c0.on && c1.s === c0.s, '가짜 계절 단추를 눌러도 계절 그대로'); }
    await shutAll(); { const r = await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(600); const a = await ev(() => !!document.querySelector('.lb-ask')), P = await pan(); ok(r && a && !(P && P.k === 'tch'), '교사 화면을 바로 불러도 = 비밀번호 창(표 X)'); await shutAll(); }

    console.log('② 비밀번호');
    await p.keyboard.press('KeyQ'); await W8(600); await ev(() => document.querySelector('.twn-p [data-a="tch"]').click()); await W8(700);
    ok(await ev(() => !!document.querySelector('.lb-ask')), '🔒 선생님 칸 → 비밀번호 창');
    await p.keyboard.type('9999'); await p.keyboard.press('Enter'); await W8(700);
    { const e9 = await ev(() => { const a = document.querySelector('.lb-ask'); return a ? a.querySelector('.err').textContent : null; }); ok(!!e9 && /달라요/.test(e9) && !(await tch()), '틀린 비밀번호 = 그대로 잠김(' + e9 + ')'); }
    await ev(() => { const i = document.querySelector('.lb-ask input'); if (i) i.value = ''; }); await p.keyboard.type(PIN); await p.keyboard.press('Enter'); await W8(900);
    { const P = await pan(); ok((await tch()) === '1' && P && P.k === 'tch', '맞는 비밀번호 = 선생님 칸(' + (P && P.t.slice(0, 40)) + ')'); await shot('teach_3_home'); }

    console.log('③ 비밀번호 뒤 누름');
    await ev(() => document.querySelector('.twn-p [data-a="ch"]').click()); await W8(600);
    { const n = await ev(() => document.querySelectorAll('.twn-p [data-t]').length); ok(n > 10, '장 = 차시 카드 ▶ 단추 ' + n + '개'); const tgt = await ev(() => { const L = [...document.querySelectorAll('.twn-p [data-t]')].map(b9 => b9.dataset.t), cur = SM_TOWN.story().cur; return L.find(id => id !== cur && id !== 'p0' && id !== 'a1_1') || L[0]; });
      await ev(t => document.querySelector('.twn-p [data-t="' + t + '"]').click(), tgt); await W8(1500); ok((await ev(() => SM_TOWN.story().cur)) === tgt, '▶ 이 장 바로 열기 → ' + tgt); await shutAll(); }
    await ev(() => { SM_TOWN.teach().home(); return 1; }); await W8(400); await ev(() => document.querySelector('.twn-p [data-a="wx"]').click()); await W8(500);
    { const W = await ev(() => ({ s: [...document.querySelectorAll('.twn-p [data-s]')].map(b9 => b9.dataset.s), w: [...document.querySelectorAll('.twn-p [data-w]')].map(b9 => b9.dataset.w) })); ok(W.s.includes('cal') && W.s.length >= 4 && W.w.includes('rain'), '선생님 모드 날씨 창 = 계절 ' + W.s.length + ' · 날씨 ' + W.w.join(','));
      await ev(() => document.querySelector('.twn-p [data-w="rain"]').click()); await W8(800); const w1 = await ev(() => SM_TOWN.wx()); ok(w1.WX9 === 'rain' && !w1.auto, '비 단추 → 비(' + w1.WX9 + ')'); await shutAll(); await ev(() => SM_TOWN.sim.openWx()); await W8(400); await ev(() => document.querySelector('.twn-p [data-w="auto"]').click()); await W8(600); const w2 = await ev(() => SM_TOWN.wx()); ok(w2.auto, '예보대로 → 돌아옴'); await shutAll(); }
    await ev(() => { SM_TOWN.teach().home(); return 1; }); await W8(400); await ev(() => document.querySelector('.twn-p [data-a="board"]').click()); await W8(700);
    { const T = await ev(() => { const t = document.querySelector('.twn-p table.tch-t'); return t ? { th: [...t.querySelectorAll('th')].map(x => x.textContent), n: t.querySelectorAll('tr.r').length } : null; }); ok(!!T && T.th.length === 5 && /번호/.test(T.th[0]) && /마지막 접속/.test(T.th[4]), '반 표 칸 다섯: ' + (T && T.th.join(' | '))); ok(!!T && T.n >= 1, '이 기기 판 ' + (T && T.n) + '줄(이 탭 포함)'); await shot('teach_4_board_dev'); }
    // 붙여 넣기 25명(기록 복사하기 글을 줄줄이 이어 붙인 꼴 + 앞뒤 다른 글)
    await ev(() => document.querySelector('.twn-p [data-s="paste"]').click()); await W8(400);
    { const blob = '패들렛에서 모은 글\n' + Array.from({ length: 25 }, (_, i) => JSON.stringify(exp(i + 1))).join('\n\n') + '\n끝 "따옴표" {깨진';
      await ev(t => { document.querySelector('.twn-p .tch-paste').value = t; document.querySelector('.twn-p [data-a="parse"]').click(); }, blob); await W8(700);
      const R = await ev(() => { const t = document.querySelector('.twn-p table.tch-t'), bx = document.querySelector('.twn-p .bx'), rr = t.getBoundingClientRect(); return { n: t.querySelectorAll('tr.r').length, first: (t.querySelector('tr.r') || {}).innerText, bottom: Math.round(rr.bottom), vh: innerHeight, sh: bx.scrollHeight, ch: bx.clientHeight }; });
      ok(R.n === 25, '붙여 넣기 = 25줄'); ok(/\d/.test(R.first || '') && !/undefined|NaN|\[object/.test(R.first), '첫 줄 글: ' + (R.first || '').replace(/\s+/g, ' ').slice(0, 90));
      ok(!(await ev(() => !!document.querySelector('.twn-p .tch-paste'))), '읽은 뒤 글 상자 접힘(표가 위로)');
      const F = await ev(() => { const bx = document.querySelector('.twn-p .bx'), t = document.querySelector('.twn-p table.tch-t').getBoundingClientRect(); return { bottom: Math.round(t.bottom), vh: innerHeight, sh: bx.scrollHeight, ch: bx.clientHeight }; });
      ok(F.bottom <= F.vh && F.sh <= F.ch + 2, '25줄 표가 1366×768 한 화면(표 아래 ' + F.bottom + ' ≤ ' + F.vh + ' · 창 스크롤 ' + (F.sh - F.ch) + ')'); await shot('teach_5_board_paste25');
      await p.setViewportSize({ width: 1366, height: 680 }); await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(500); const F2 = await ev(() => { const bx = document.querySelector('.twn-p .bx'); return { sh: bx.scrollHeight, ch: bx.clientHeight }; }); ok(F2.sh <= F2.ch + 2, '창 높이 680(크롬북 1366×768에서 주소창 뺀 어림)에서도 한 화면(창 스크롤 ' + (F2.sh - F2.ch) + 'px)'); await shot('teach_5b_board_680'); await p.setViewportSize({ width: 1366, height: 768 }); await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(400); }
    await ev(() => document.querySelectorAll('.twn-p tr.r')[2].click()); await W8(400);
    { const D = await ev(() => { const d = document.querySelector('.twn-p tr.dt'); return d ? d.innerText.replace(/\s+/g, ' ').slice(0, 160) : null; }); ok(!!D && /남긴 결과물|끝낸 장|게임/.test(D), '줄 누름 = 자세히(' + (D || '') + ')'); await shot('teach_6_detail'); }
    // 서버 흉내: 반 코드 + 교사 열쇠 → 열쇠 없음 → 처음 정하기 → 25줄 · 틀린 열쇠
    await ev(() => document.querySelector('.twn-p [data-s="cloud"]').click()); await W8(400);
    { const fill = (code, k1, k2) => ev(([c, a, b9]) => { const q = s => document.querySelector('.twn-p [data-i="' + s + '"]'); if (q('code')) q('code').value = c; if (q('key')) q('key').value = a; if (q('key2')) q('key2').value = b9; }, [code, k1, k2 || '']);
      await fill('zzteach', 'teach123'); await ev(() => document.querySelector('.twn-p [data-a="pull"]').click()); await W8(1200);
      let P = await pan(); ok(/아직 교사 열쇠가 없어요/.test(P.t) && await ev(() => !!document.querySelector('.twn-p [data-a="claim"]')), '열쇠 없는 반 = 처음 정하기 칸');
      await fill('zzteach', 'teach123', 'teach12x'); await ev(() => document.querySelector('.twn-p [data-a="claim"]').click()); await W8(500); P = await pan(); ok(/달라요/.test(P.t), '두 번 넣은 열쇠가 다름 = 안내');
      await fill('zzteach', 'teach123', 'teach123'); await ev(() => document.querySelector('.twn-p [data-a="claim"]').click()); await W8(1500);
      const n = await ev(() => document.querySelectorAll('.twn-p table.tch-t tr.r').length), txt = await ev(() => document.querySelector('.twn-p table.tch-t').innerText); ok(n === 25, '서버 표 = 25줄(정한 뒤 바로 받음)'); ok(!/진짜|undefined|NaN/.test(txt), '서버 표 글에 빈 값 없음'); await shot('teach_7_board_cloud');
      const bad = await ev(async mp => { const r = await fetch('http://127.0.0.1:' + mp + '/class/zzteach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tkey: 'wrongkey1' }) }); return r.status; }, MP); ok(bad === 403, '틀린 교사 열쇠 = 403'); }

    console.log('④ 잠그기');
    await ev(() => { SM_TOWN.teach().home(); return 1; }); await W8(400); await ev(() => document.querySelector('.twn-p [data-a="lock"]').click()); await W8(500);
    ok(!(await tch()), '잠그고 닫기 = sm.t 꺼짐'); await ev(() => SM_TOWN.sim.openWx()); await W8(400); ok((await ev(() => document.querySelectorAll('.twn-p [data-w="rain"]').length)) === 0, '잠근 뒤 날씨 창 = 다시 아이 화면'); await shutAll();
    { await ev(() => { SM_TOWN.teach().board(); return 1; }); await W8(500); ok(await ev(() => !!document.querySelector('.lb-ask')), '잠근 뒤 교사 화면 = 다시 비밀번호'); await shutAll(); }

    console.log('⑤ 아이 흐름 안 막힘');
    /* 계절 문 대화창: 나올 때까지(이야기 창 20초 쉼 포함) 기다리고 → 쪽마다 E로 넘기며 글을 모음 → 고르기 단추가 나오면 멈춤 */
    const seasonDlg = async (id, k) => { await ev(() => SM_TOWN.storyOff()); await W8(300); const r = await ev(([a, b9]) => SM_TOWN.storyAt(a, b9), [id, k]); let on = false; for (let n = 0; n < 60 && !on; n++) { await W8(500); on = await ev(() => !!document.querySelector('.twn-dlg')); }
      let txt = ''; for (let n = 0; n < 10; n++) { await W8(900); const o = await ev(() => { const d = document.querySelector('.twn-dlg'); return d ? { t: (d.querySelector('.tx') || {}).textContent || '', ch: [...d.querySelectorAll('.ch button')].map(b9 => b9.textContent) } : null; }); if (!o) break; if (!txt.endsWith(o.t)) txt += ' ' + o.t; if (o.ch.length) return { r, on, txt, ch: o.ch }; await p.keyboard.press('KeyE'); }
      return { r, on, txt, ch: [] }; };
    { const C = ST.CHAPTERS.find(c => c.steps.some(s => s.do.type === 'season' && !s.do.ok.includes('summer'))), i = C.steps.findIndex(s => s.do.type === 'season' && !s.do.ok.includes('summer'));
      let D = await seasonDlg(C.id, i); ok(D.on && /선생님이 계절을 바꿔 줄 수도/.test(D.txt) && /일 남았어요/.test(D.txt), '계절 문(' + C.id + ') = 며칠 남았는지 + 선생님이 바꿔 줄 수도 —' + D.txt.slice(0, 120)); await shot('teach_8_season_kid');
      const wx = await ev(() => { const b9 = [...document.querySelectorAll('.twn-dlg .ch button')].find(x => /날씨 칩/.test(x.textContent)); if (b9) { b9.click(); return 1; } return 0; }); await W8(800); const P = await pan(); ok(wx && P && P.k === 'wx' && !(await ev(() => document.querySelectorAll('.twn-p [data-w="rain"]').length)), '「날씨 칩 열기」 = 날씨 창(아이 화면 · 고정 단추 없음)'); await shutAll();
      await ev(() => { const S = SM_TOWN.game().S; S.cal.on = false; S.cal.s = 'winter'; S.wx = { auto: false }; });
      D = await seasonDlg(C.id, i); ok(D.on && /달력대로 돌아가기/.test(D.txt), '계절이 멈춘 판 = 「달력대로 돌아가기」 안내 —' + D.txt.slice(-80)); await shutAll();
      await ev(() => SM_TOWN.sim.openWx()); await W8(400); const W = await ev(() => ({ s: [...document.querySelectorAll('.twn-p [data-s]')].map(b9 => b9.dataset.s), w: [...document.querySelectorAll('.twn-p [data-w]')].map(b9 => b9.dataset.w) })); ok(W.s.join() === 'cal' && W.w.join() === 'auto', '멈춘 판 날씨 창 = 돌아가기 단추만(' + W.s.concat(W.w).join(',') + ')'); await shot('teach_9_wx_back');
      await ev(() => document.querySelector('.twn-p [data-s="cal"]').click()); await W8(700); await shutAll(); await ev(() => SM_TOWN.sim.openWx()); await W8(400); await ev(() => { const b9 = document.querySelector('.twn-p [data-w="auto"]'); if (b9) b9.click(); }); await W8(700);
      const G = await ev(() => ({ cal: SM_TOWN.game().S.cal.on, auto: SM_TOWN.wx().auto, tch: sessionStorage.getItem('sm.t') })); ok(G.cal && G.auto && !G.tch, '아이가 비밀번호 없이 달력대로·예보대로로 돌아감'); await shutAll(); await ev(() => SM_TOWN.storyOff()); }
    ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | '));
  } finally { await b.close(); mock.kill(); }
  console.log(fails ? '✗ 실패 ' + fails : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
