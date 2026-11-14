// 📖 읽을 틈 시험(READ-1 · 교사 11-02 "가격비교 퀘스트 초반에 한 번은 직접 더해 볼까 · 너무 순식간에 지나가서 '1050원이구나 다음 거 가야지'가 눈에 잘 안 읽혀 · 이 퀘스트 말고도"): node tools/harness/town_read.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ⓪ 함수(노드): 글 길이 → 머무는 시간(readSec) · 정보 글 가리기(infoOf) · 줄 차례(같은 글 하나 · 보호 시간)
//   ① 마을 띠: 긴 정보 띠가 2초 만에 안 사라짐 · 바로 온 다음 띠는 앞 띠가 다 읽힌 뒤 · 창이 떠 있으면 창이 닫힌 뒤에 뜸 · 알림: 새 알림은 바로(내 동작의 결과) · 덮인 수 든 알림은 그 뒤 남은 시간만큼 다시 · 수 없는 알림은 다시 안 뜸
//   ② 2-1 팬케이크 값 알아보기: 처음 들어간 가게 = 합 대신 직접 더하기 창(큰 단추 넷 · 세로셈 · 합 '?') · 할 일 줄·메모 줄 '= ?' · 틀리면 단추 지움 + 자리값 힌트 · 힌트 단추 · 맞히면 닫히고 메모 줄 '(내가 더함)'
//   ③ 둘째 가게: 값 띠(합 보임)가 1.8초 만에 안 덮임 · 다 읽힌 뒤 다음 단계 · '어느 가게가 더 쌀까' 창은 끝 띠가 읽힌 뒤 + 창 안 '내가 본 값'(두 합 · 내가 더함) · 사기 단계까지 메모 줄 · 사고 나면 메모 줄 사라짐 ④ 페이지 오류 0
//   ⑤ 휴대폰 세로·가로(COVER-4 11-07): 직접 더하기 창 — 단추 넷 44px 넘게 · 가로 넘침 0 · 창이 화면 안 · 조이스틱(이동 자리 #tJoyHint · 누른 막대 #tJoy)과 겹침 0 · 사진 = --shots 폴더 read1_phone_세로·가로
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const path = require('path'), { chromium, devices } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const R = await import(path.resolve(__dirname, '../../v2/games/town_read.js')), M = await import(path.resolve(__dirname, '../../v2/games/town_story.js')), ix = (c, id) => M.CHAPTERS.find(q => q.id === c).steps.findIndex(q => q.id === id);
  console.log('⓪ 함수 — 글 길이 → 머무는 시간');
  { const a = R.readSec('냠냠! 맛있어요'), b = R.readSec('🏪 마트 — 밀가루 500원, 달걀 200원, 우유 350원. 셋 다 사면 1,050원'), c = R.readSec('가'.repeat(300));
    ok(a >= 1.8 && a <= 3, '짧은 글 ' + a.toFixed(1) + '초'); ok(b >= 7 && b <= 11, '가게 값 띠(숫자 있음) ' + b.toFixed(1) + '초(예전 5.5초)'); ok(c === R.READ_MAX, '가장 길어도 ' + R.READ_MAX + '초');
    ok(R.infoOf('셋 다 사면 1,050원') && R.infoOf('소방서는 북쪽이에요') && !R.infoOf('냠냠! 맛있어요'), '정보 글 가리기(수 · 방위)'); }
  { const seen = []; let vis = false; const Q = R.createLineQ({ show: t => { seen.push([t, Date.now()]); vis = true; }, vis: () => vis, protect: () => 0.4 });
    Q.put('가', 1); Q.put('나', 1); Q.put('나', 1); Q.put('다', 1); ok(seen.length === 1 && seen[0][0] === '가', '앞 글이 다 읽히기 전 새 글은 줄 섬(바로 덮지 않음)'); ok(Q.busy() && Q.left() > 900, '남은 시간 = 지금 글 + 줄 선 글(' + Q.left() + 'ms)');
    await sleep(1500); ok(seen.map(q => q[0]).join('') === '가나다', '차례대로 · 같은 글은 하나만(' + seen.map(q => q[0]).join('') + ')'); ok(seen.length === 3 && seen[1][1] - seen[0][1] >= 370 && seen[2][1] - seen[1][1] >= 370, '보호 시간 지킴'); }

  { const seen = []; let vis = false; const Q = R.createLineQ({ cut: true, show: t => { seen.push(t); vis = true; }, vis: () => vis, protect: () => 1 });
    Q.put('값 1,050원', 3); await sleep(100); Q.put('결과', 1); ok(seen.join('|') === '값 1,050원|결과', '알림 칸(cut): 새 글은 바로'); await sleep(1300); ok(seen[2] === '값 1,050원', '알림 칸(cut): 덜 읽힌 정보 글이 그 뒤에 다시(' + seen.join(' → ') + ')'); }
  const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.read, null, { timeout: 240000 }); await p.waitForTimeout(1500); await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await p.waitForTimeout(800);
    const { ev, W8, shut } = walker(p, {});
    const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/read1_' + n + '.png' }); console.log('    📷 ' + SHOTS + '/read1_' + n + '.png'); };
    const ban = () => ev(() => { const e = document.getElementById('hudBan'); return e && e.style.display !== 'none' ? e.textContent : ''; });
    const tst = () => ev(() => { const e = document.getElementById('toast'); return e && e.style.display !== 'none' ? e.textContent : ''; });
    const S = () => ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id, v: s.step ? s.step.v : {} }; });
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: { d: 1 }, a1_1: { d: 1 } }); G.story.autoNext = null; SM_TOWN.storyOff(); });
    await shut(); await W8(1500); const idle = async () => { for (let i = 0; i < 120; i++) { if ((await ev(() => SM_TOWN.read.left())) <= 0) return true; await W8(250); } return false; };
    { const st0 = await ev(() => SM_TOWN.read.stat()); console.log('    처음 줄 ' + JSON.stringify(st0)); ok(await idle(), '처음 띠·알림 줄이 30초 안에 다 읽힘'); }

    console.log('① 마을 띠·알림 — 읽을 틈과 차례');
    { const A = '🧭 시험 띠 하나: 소방서는 북쪽 280m, 우체국은 동쪽 210m에 있어요', B = '🧪 시험 띠 둘';
      await idle(); const rA = await ev(t => SM_TOWN.read.sec(t), A); await ev(([a, b9]) => { SM_TOWN.read.ban(a, 2); SM_TOWN.read.ban(b9, 2); }, [A, B]);
      await W8(2600); const t1 = await ban(); ok(t1 === A, '2초짜리로 띄운 긴 정보 띠가 2.6초에도 그대로(머무는 시간 ' + rA.toFixed(1) + '초)');
      await W8(Math.max(200, Math.round(rA * 1000) - 2600 + 700)); const t2 = await ban(); ok(t2 === B, '다음 띠는 앞 띠가 다 읽힌 뒤에(' + t2 + ')');
      await W8(4000);
      const T1 = '💰 시험 알림: 300원 모자라요', T2 = '🙂 시험 알림 둘'; await ev(t => SM_TOWN.read.toast(t, 1), T1); await W8(600); await ev(t => SM_TOWN.read.toast(t, 2), T2);
      await W8(300); const u1 = await tst(); ok(u1 === T2, '새 알림은 바로 뜸(내가 한 일의 결과가 늦지 않게): ' + u1);
      const r2 = await ev(t => SM_TOWN.read.sec(t), T2); let back9 = 0; for (let k = 0; k < 40; k++) { await W8(250); if ((await tst()) === T1) { back9 = 1; break; } } ok(back9, '덮였던 수 든 알림이 그 뒤에 다시 뜸(' + r2.toFixed(1) + '초 뒤)');
      await W8(1200); ok((await tst()) === T1, '다시 뜬 수 든 알림이 남은 시간 동안 그대로');
      await W8(6000); const P1 = '🙂 시험 셋', P2 = '🙂 시험 넷'; await ev(([a, b9]) => { SM_TOWN.read.toast(a, 2); SM_TOWN.read.toast(b9, 2); }, [P1, P2]); await W8(400); const u3 = await tst(); let u4 = ''; for (let k = 0; k < 16; k++) { await W8(250); const x9 = await tst(); if (x9 === P1) u4 = x9; } ok(u3 === P2 && u4 !== P1, '수 없는 알림은 다음 알림이 바로 대신함(다시 뜨지 않음 · ' + u3 + ' → ' + u4 + ')');
      await W8(3500); await ev(() => SM_TOWN.storyList()); await W8(500); const C = '🧪 창 뒤 시험 띠'; await ev(t => SM_TOWN.read.ban(t, 2), C); await W8(1200); const h1 = await ban(), pOn = await ev(() => !!document.querySelector('.twn-p'));
      ok(pOn && h1 !== C, '창이 떠 있는 동안 띠는 기다림(창 뒤에 떴다 사라지지 않게)'); await shut(); await W8(900); const h2 = await ban(); ok(h2 === C, '창을 닫으면 그때 뜸(' + h2 + ')');
      const st = await ev(() => SM_TOWN.read.stat()); console.log('    줄 기록 ' + JSON.stringify(st)); await W8(4000); }

    console.log('② 2-1 팬케이크 값 알아보기 — 처음 가게 = 직접 더하기');
    await ev(() => { const G = SM_TOWN.game(); if (G.count('🥛') < 1) G.add('🥛', 1, 'test'); });
    await ev(i9 => SM_TOWN.storyAt('c1', i9), ix('c1', 'look')); await W8(900); await shut(); await W8(600);
    let s = await S(); ok(s.cur === 'c1' && s.id === 'look', '값 알아보기 단계(' + s.cur + ' ' + s.id + ')');
    const SH = await ev(() => { const L = SM_TOWN.indoor.census().filter(q => q.in === 'shop' && q.name); const g = L.filter(q => /마트|슈퍼|모두의 상점|식품/.test(q.name) && !/편의점|산지|도시 상점/.test(q.name)), c = L.filter(q => /편의점/.test(q.name)); return { g: g[0] || null, c: c[0] || null }; });
    ok(SH.g && SH.c, '마트·편의점 찾음(' + (SH.g && SH.g.name) + ' · ' + (SH.c && SH.c.name) + ')');
    if (SH.g && SH.c) {
      await ev(i => SM_TOWN.indoor.enterI(i), SH.g.i);
      let addOn = false; for (let i = 0; i < 40 && !addOn; i++) { await W8(250); addOn = await ev(() => !!document.querySelector('.twn-p .twn-addb')); }
      ok(addOn, '처음 들어간 가게 = 직접 더하기 창');
      const A = await ev(() => { const P = document.querySelector('.twn-p'); return { t: P ? P.innerText.replace(/\s+/g, ' ') : '', btn: [...document.querySelectorAll('.twn-p .twn-addb button')].map(b9 => +b9.dataset.n), big: [...document.querySelectorAll('.twn-p .twn-addb button')].every(b9 => b9.getBoundingClientRect().height >= 44) }; });
      s = await S(); const PX = (s.v.px || {}).grocery || { p: [] }, SUM = PX.p.reduce((a, q) => a + q[1], 0);
      const tN = A.t.replace(/(\d) (?=\d)/g, '$1'); ok(/셋 다 사면 얼마/.test(A.t) && PX.p.every(q => tN.includes(String(q[1]))), '창 = 세 값 + 물음(' + A.t.slice(0, 80) + '…)');
      ok(A.btn.length === 4 && A.btn.includes(SUM) && A.btn[0] !== SUM && A.big, '큰 단추 넷(정답 하나 · 맨 앞 X · 44px 이상) ' + A.btn.join(', ') + ' · 정답 ' + SUM);
      const b0 = await ban(); ok(!/셋 다 사면 [\d,]+원/.test(b0), '띠가 합을 먼저 말하지 않음(' + (b0 || '띠 없음') + ')');
      const m0 = await ev(() => SM_TOWN.read.memo()), td0 = await ev(() => SM_TOWN.storyTodo()); ok(/= \?/.test(m0) && /더해 보기/.test(td0), '할 일 줄 = 더해 보기 · 메모 줄 = 세 값 = ? (' + m0.replace(/\n/g, ' / ') + ')');
      await shot('add');
      const wrong = A.btn.find(n => n !== SUM); await ev(n => document.querySelector('.twn-p .twn-addb button[data-n="' + n + '"]').click(), wrong); await W8(400);
      const W = await ev(n => ({ hint: (document.querySelector('.twn-p .twn-chr') || {}).textContent || '', dis: !!(document.querySelector('.twn-p .twn-addb button[data-n="' + n + '"]') || {}).disabled, hl: [...document.querySelectorAll('.twn-p td')].some(td => /ffe08a|255, 224, 138/.test(td.getAttribute('style') || '')) }), wrong);
      ok(W.dis && /백의 자리/.test(W.hint) && /(적어요|많아요)/.test(W.hint), '틀리면 그 단추가 지워지고 자리값 힌트(' + W.hint.slice(0, 70) + ')'); ok(W.hl, '세로셈에서 볼 자리(백)가 밝아짐');
      await shot('wrong');
      await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(300); const H2 = await ev(() => (document.querySelector('.twn-p .twn-chr') || {}).textContent || ''); ok(/받아올림|백이/.test(H2), '힌트 단추 = 다음 칸(' + H2.slice(0, 70) + ')');
      await ev(n => document.querySelector('.twn-p .twn-addb button[data-n="' + n + '"]').click(), SUM); await W8(700);
      const pGone = await ev(() => !document.querySelector('.twn-p .twn-addb')), m1 = await ev(() => SM_TOWN.read.memo()), b1 = await ban(); s = await S();
      ok(pGone && s.id === 'look', '맞히면 창이 닫히고 단계는 그대로(편의점 남음)'); ok(/내가 더함/.test(m1) && m1.includes(SUM.toLocaleString('en-US')), '메모 줄에 내가 더한 합(' + m1.replace(/\n/g, ' / ') + ')'); ok(/맞아요/.test(b1), '띠 = 무엇이 맞았는지(' + b1 + ')');
      await shot('memo');
      await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 30; i++) { await W8(250); if (await ev(() => !SM_TOWN.indoor.on && !SM_TOWN.indoor.busy)) break; } await W8(800);
      console.log('③ 둘째 가게 — 값 띠가 덮이지 않고 다 읽힌 뒤 다음');
      await ev(i => SM_TOWN.indoor.enterI(i), SH.c.i); let t0 = 0, cb = ''; for (let i = 0; i < 60; i++) { await W8(200); cb = await ban(); if (/편의점/.test(cb) && /셋 다 사면/.test(cb)) { t0 = Date.now(); break; } }
      ok(t0 > 0, '둘째 가게 = 값 띠에 합(' + cb + ')'); const rC = await ev(t => SM_TOWN.read.sec(t), cb);
      await W8(2600); const s2 = await S(), b2 = await ban(); ok(s2.id === 'look' && b2 === cb, '2.6초에도 값 띠 그대로 · 단계 안 넘어감(예전 1.8초에 덮임)');
      let tC = 0; for (let i = 0; i < 80; i++) { const q = await S(); if (q.id === 'cmp') { tC = Date.now(); break; } await W8(250); }
      ok(tC && tC - t0 >= rC * 1000 - 600, '값 띠가 다 읽힌 뒤 다음 단계(' + ((tC - t0) / 1000).toFixed(1) + '초 · 띠 ' + rC.toFixed(1) + '초)');
      let tP = 0; for (let i = 0; i < 80; i++) { if (await ev(() => !!document.querySelector('.twn-p .twn-seen'))) { tP = Date.now(); break; } await W8(250); }
      const okMsg = await ev(() => SM_TOWN.read.sec('📝 두 가게 값을 다 알아봤어요'));
      ok(tP && tP - tC >= okMsg * 1000 - 700, '\'어느 가게가 더 쌀까\' 창 = 끝 띠가 읽힌 뒤(' + ((tP - tC) / 1000).toFixed(1) + '초)');
      const SE = await ev(() => (document.querySelector('.twn-p .twn-seen') || {}).innerText || ''); ok(/내가 본 값/.test(SE) && /마트/.test(SE) && /편의점/.test(SE) && /내가 더함/.test(SE), '창 안 \'내가 본 값\' = 두 가게 합(' + SE.replace(/\s+/g, ' ') + ')');
      await shot('cmp');
      const m2 = await ev(() => SM_TOWN.read.memo()); ok(/마트/.test(m2) && /편의점/.test(m2), '고르는 동안에도 메모 줄(' + m2.replace(/\n/g, ' / ') + ')');
      await ev(() => { const A9 = SM_TOWN.storyAns(); for (const k of A9) { const b9 = document.querySelector('.twn-p button[data-k="' + k + '"]'); if (b9) b9.click(); } const o9 = document.querySelector('.twn-p [data-a="ok"]'); if (o9) o9.click(); }); await W8(800);
      s = await S(); ok(s.id === 'buy' && /마트/.test(await ev(() => SM_TOWN.read.memo())), '사기 단계에도 메모 줄 남음');
      await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 30; i++) { await W8(250); if (await ev(() => !SM_TOWN.indoor.on && !SM_TOWN.indoor.busy)) break; }
      await ev(() => { SM_TOWN.storyEv('buy', { e: '🌾', v: 500, kind: 'grocery' }); SM_TOWN.storyEv('buy', { e: '🥚', v: 200, kind: 'grocery' }); });
      for (let i = 0; i < 80; i++) { s = await S(); if (s.id !== 'buy') break; await W8(250); } ok(s.id === 'cook', '다 사면 다음 단계(' + s.id + ')'); await W8(800);
      const m3 = await ev(() => SM_TOWN.read.memo()), hm = await ev(() => !!document.querySelector('.twn-task .twn-memo')); ok(!m3 && !hm, '사기가 끝나면 메모 줄 사라짐');
      await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });
    }
    console.log('④ 페이지 오류'); ok(!errs.length, '페이지 오류 ' + errs.length + (errs.length ? ' · ' + errs.slice(0, 3).join(' | ') : ''));
    // ⑤ 휴대폰 세로·가로 — 같은 창을 아이폰 크기·터치로
    for (const [nm, dev] of [['세로', devices['iPhone 13']], ['가로', devices['iPhone 13 landscape']]]) {
      console.log('⑤ 휴대폰 ' + nm + ' — 직접 더하기 창');
      const ctx = await b.newContext({ ...dev }), q = await ctx.newPage(), e2 = []; q.on('pageerror', e => e2.push(e.message.slice(0, 200)));
      await q.goto(URL); await q.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.read, null, { timeout: 240000 }); await q.waitForTimeout(1500);
      const ev2 = (f, a) => q.evaluate(f, a), W2 = ms => q.waitForTimeout(ms), shut2 = () => ev2(() => { for (let i = 0; i < 5; i++) { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .twn-x'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } } });
      await shut2(); await W2(600);
      await ev2(() => { const G = SM_TOWN.game(), S9 = G.S; S9.story = S9.story || {}; S9.story.done = Object.assign(S9.story.done || {}, { p0: { d: 1 }, a1_1: { d: 1 } }); S9.story.autoNext = null; if (G.count('🥛') < 1) G.add('🥛', 1, 'test'); });
      await ev2(i9 => SM_TOWN.storyAt('c1', i9), ix('c1', 'look')); await W2(1200); await shut2(); await W2(600);
      const G9 = await ev2(() => { const L = SM_TOWN.indoor.census().filter(q9 => q9.in === 'shop' && q9.name); const g = L.filter(q9 => /마트|슈퍼|모두의 상점|식품/.test(q9.name) && !/편의점|산지|도시 상점/.test(q9.name)); return g[0] || null; });
      if (!G9) { ok(false, nm + ' 마트 없음'); await ctx.close(); continue; }
      await ev2(i => SM_TOWN.indoor.enterI(i), G9.i); let on = false; for (let i = 0; i < 40 && !on; i++) { await W2(250); on = await ev2(() => !!document.querySelector('.twn-p .twn-addb')); }
      ok(on, nm + ' 처음 가게 = 직접 더하기 창'); if (!on) { await ctx.close(); continue; }
      await W2(500);
      const R = await ev2(() => { const P = document.querySelector('.twn-p'), bx = P.querySelector('.bx') || P, pr = bx.getBoundingClientRect(), vis = el => !!el && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
        const top9 = (x, y) => document.elementFromPoint(x, y), mine = (el, b9) => !!el && (el === b9 || b9.contains(el)), J = [document.getElementById('tJoyHint'), document.getElementById('tJoy')].filter(vis);
        const B = [...P.querySelectorAll('.twn-addb button')].map(b9 => { const r = b9.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, h = top9(cx, cy); return { w: Math.round(r.width), h: Math.round(r.height), seen: r.top >= 0 && r.bottom <= innerHeight && mine(h, b9) && mine(top9(cx, r.top + 5), b9) && mine(top9(cx, r.bottom - 5), b9), joy: J.some(j9 => mine(h, j9)) }; });   /* 위·가운데·아래가 다 그 단추 = 반쯤 가려진 단추 X */
        const T9 = [...P.querySelectorAll('table tr')].pop(), tr9 = T9 ? T9.getBoundingClientRect() : null, tot = !!tr9 && mine(top9(tr9.left + 20, tr9.top + tr9.height / 2), T9) && mine(top9(tr9.left + 20, tr9.bottom - 3), T9);   /* 줄 아래 끝까지 보임 */
        const A = [...P.querySelectorAll('button')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (e.textContent || '').trim().slice(0, 8)]; }).filter(r => r[0] < 44 || r[1] < 44);
        const jOn = J.filter(j9 => { const r = j9.getBoundingClientRect(), h = top9(r.left + r.width / 2, r.top + r.height / 2); return mine(h, j9); }).map(j9 => j9.id);   /* 조이스틱이 창 위에 보이는가(창이 덮으면 X) */
        return { B, small: A, docOver: document.documentElement.scrollWidth - innerWidth, boxOver: bx.scrollWidth - bx.clientWidth, inView: pr.left >= -1 && pr.right <= innerWidth + 1 && pr.top >= -1 && pr.bottom <= innerHeight + 1, vw: innerWidth, vh: innerHeight, pr: [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)], joy: J.map(j9 => j9.id), jOn, lab: [...P.querySelectorAll('table td:first-child')].map(td => Math.round(td.getBoundingClientRect().height)), tot, touch: document.body.classList.contains('touch') }; });
      console.log('    ' + JSON.stringify(R));
      ok(R.touch, nm + ' 터치 화면(body.touch)');
      ok(R.B.length === 4 && R.B.every(q9 => q9.w >= 44 && q9.h >= 44), nm + ' 단추 넷 44px 넘게(' + R.B.map(q9 => q9.w + '×' + q9.h).join(' · ') + ')');
      ok(R.B.every(q9 => q9.seen), nm + ' 단추 넷이 내리지 않아도 다 보이고 눌림(가려짐 0 · ' + R.B.map(q9 => q9.seen ? '○' : '×').join('') + ')');
      ok(R.lab.every(h => h <= 60), nm + ' 값표 이름이 한 줄(칸 높이 ' + R.lab.join(',') + 'px)'); ok(R.tot, nm + ' 「셋 다 ? 원」 줄이 내리지 않아도 보임');
      ok(!R.small.length, nm + ' 창 안 작은 단추 0' + (R.small.length ? ' ' + JSON.stringify(R.small.slice(0, 3)) : ''));
      ok(R.docOver <= 1 && R.boxOver <= 1 && R.inView, nm + ' 가로 넘침 0 · 창이 화면 안(쪽 ' + R.docOver + ' · 창 ' + R.boxOver + ' · ' + R.pr.join(',') + ' / ' + R.vw + '×' + R.vh + ')');
      ok(!R.jOn.length && R.B.every(q9 => !q9.joy), nm + ' 조이스틱과 겹침 0(창 위에 보이는 조이스틱 ' + (R.jOn.join(',') || '없음') + ' · 단추를 덮은 조이스틱 ' + R.B.filter(q9 => q9.joy).length + ')');
      if (SHOTS) { await W2(300); await q.screenshot({ path: SHOTS + '/read1_phone_' + (nm === '세로' ? 'port' : 'land') + '.png' }); console.log('    📷 ' + SHOTS + '/read1_phone_' + (nm === '세로' ? 'port' : 'land') + '.png'); }
      ok(!e2.length, nm + ' 페이지 오류 0' + (e2.length ? ' · ' + e2.slice(0, 2).join(' | ') : '')); await ctx.close(); }
  } catch (e) { console.error(e); fails++; } finally { await b.close(); }
  console.log(fails ? '✗ ' + fails + '개 실패' : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})();
