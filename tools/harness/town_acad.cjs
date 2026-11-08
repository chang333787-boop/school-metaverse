// 🎓 학원 공부 시험(ACAD-1 · v2/games/town_acad.js · 설계 docs/systems/town_acad.md §8) — 브라우저: zsh tools/ops/b2.sh node tools/harness/town_acad.cjs ourtown <포트> [--shots=폴더]
//   ① 학원 E(진짜 E 누르기) = 수업 창(오늘 배울 것 · 수업 시작 · 단계 칸)  ② 문제 창 크기(물음 18px 넘게 · 보기 단추 44px 넘게 · 할 일 한 줄)
//   ③ 틀림 = 그 보기 ✗ 잠김 + 힌트 1 → 힌트 2 → 까닭 · 정답 단추를 칠하지 않음 · 맞힘 = 오늘 배운 것 + 다음  ④ 잘한 판 = 단계 +1 · 칠판 별 · 가방 수료 도장 · 솜씨 +
//   ⑤ 같은 날 한 판 더 = 단계 그대로 · 솜씨 0(오늘 몫 받음)  ⑥ 학원 수첩(📒 단추 · 수첩 탭)  ⑦ 수업 시간 밖 = '수업은 오전 10시부터' + 자습 셋(단계·도장 X) · DEB-2 ⑥ 수업 = 오전 10시~밤 9시
//   ⑧ 다음 날 = 다시 단계 · 솜씨  ⑨ 닫았다 열면 이어서  ⑩ 과목 일곱 한 판씩(있는 학원만 · 차례·리듬·동작·로봇·긴 글)  ⑪ 휴대폰 세로·가로(가로 넘침 X · 단추 44px) ⑪-2 낮은 가로(844×340 등) 로봇 문제 한 화면  ⑫ 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const SUBJS = ['math', 'english', 'science', 'study', 'art', 'piano', 'taekwondo'], STAMP = { math: '📐', english: '🔤', science: '💡', study: '📝', art: '🎨', piano: '🎹', taekwondo: '🥋' };
(async () => { const b = await chromium.launch({ args: (RENDER ? ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] : []).concat(['--disable-renderer-backgrounding', '--disable-background-timer-throttling']) });
  try { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|꼬리표 없는 보상|\[실내\]/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; require('fs').mkdirSync(SHOTS, { recursive: true }); await W8(250); await p.screenshot({ path: SHOTS + '/acad_' + n + '.png' }); console.log('    📷 ' + SHOTS + '/acad_' + n + '.png'); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 900) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const x = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .twn-x'); if (x) x.click(); }); await W8(200); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(200); } } };
    const RUN = () => ev(() => SM_TOWN.acad().run()), ST = k => ev(k9 => JSON.parse(JSON.stringify(SM_TOWN.acad().state().s[k9] || null)), k), XP = k => ev(k9 => (SM_TOWN.game().S.skill || {})[k9] || 0, k);
    const click = sel => ev(s9 => { const e = document.querySelector('.twn-p ' + s9); if (e && !e.disabled) { e.click(); return true; } return false; }, sel);
    const next = async () => { await W8(100); await click('[data-a="next"]'); await W8(150); };
    // 한 문제 바르게(차례·리듬은 보여 주기가 끝난 뒤)
    const solveOne = async () => { const R = await RUN(); if (!R || R.phase !== 'q' || !R.cur) return false; const c = R.cur;
      if (c.kind === 'pick') await click('[data-c="' + c.ans + '"]');
      else if (c.kind === 'order') { for (let j = 0; j < c.n; j++) await click('[data-o="' + j + '"]'); }
      else { await p.waitForFunction(() => SM_TOWN.acad().run().demoDone && !SM_TOWN.acad().run().demo, null, { timeout: 20000 }); for (const k9 of c.seq) await click('[data-k="' + k9 + '"]'); }
      await W8(120); return (await RUN()).solved; };
    const solveAll = async () => { const kinds = []; for (let n = 0; n < 8; n++) { const R = await RUN(); if (!R || R.phase !== 'q') break; kinds.push(R.cur.kind + ':' + R.cur.t.split(':')[1]); if (!await solveOne()) { kinds.push('✗'); break; } await next(); } return kinds; };
    const setT = (min, dd) => ev(([m, d]) => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = m; if (d) G.S.day += d; }, [min, dd || 0]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.ent && SM_TOWN.acad, null, { timeout: 420000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } if (SM_TOWN.storyOff) SM_TOWN.storyOff(); delete G.acad; });
    await setT(15 * 60);
    const C = await ev(() => SM_TOWN.indoor.census().map((q, i) => ({ i: q.i != null ? q.i : i, cat: q.cat, school: q.school, nm: q.name || q.sign }))), byCat = {};
    for (const q of C) if (q.cat && SUBJS.includes(q.cat) && !q.school && !byCat[q.cat]) byCat[q.cat] = q;
    const have = SUBJS.filter(k => byCat[k]); console.log('    마을 학원: ' + have.map(k => k + '(' + byCat[k].nm + ')').join(' · ')); ok(have.length >= 3, '학원 갈래 셋 넘게 있음 (' + have.length + ')');
    const enter = async q => { await closeAll(); await ev(i => SM_TOWN.indoor.enterI(i), q.i); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { return false; } await W8(400); return true; };
    const leave = async () => { await closeAll(); if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } };
    const pressE = async () => { const I = await ev(() => SM_TOWN.ent().info()), h = I && I.extra.find(q => q.k === 'ent:acad'); if (!h) return false; for (let t = 0; t < 3; t++) { await closeAll(); await ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, h.at); await W8(450); await p.keyboard.press('KeyE'); await W8(500); if (((await panel()) || {}).k === 'acadq') return true; } return false; };
    const K0 = have.includes('math') ? 'math' : have[0], Q0 = byCat[K0], SK0 = await ev(k => (SM_TOWN.acad && { math: 'explore', english: 'explore', science: 'look', study: 'explore', art: 'look', piano: 'explore', taekwondo: 'explore' })[k], K0);
    // ① 학원 E = 수업 창
    console.log('① 학원 E (' + K0 + ')'); ok(await enter(Q0), K0 + ' 학원에 들어감');
    const lab = await ev(() => SD2.map.interact.list().map(h => h.label).find(t => /📝/.test(t || '')) || ''); ok(/수업/.test(lab), '선생님 E 이름표 = 「' + lab + '」');
    ok(await pressE(), '진짜 E 누르기 → 수업 창(acadq)'); let P0 = await panel();
    ok(P0 && /오늘 배울 것/.test(P0.t) && /수업 시작/.test(P0.t) && /1단계 수업/.test(P0.t), '수업 창: 1단계 수업 · 오늘 배울 것 · 수업 시작'); await shot('1_intro');
    const I0 = await ev(() => SM_TOWN.ent().info()); ok(I0.shown.length === 5 && !I0.shown.some(Boolean), '칠판 별 자리 다섯 · 처음엔 0');
    // ② 문제 창 크기
    await p.keyboard.press('Enter'); await W8(350); let R = await RUN(); ok(R && R.phase === 'q' && R.n === 5 && R.mode === 'class', 'Enter = 수업 시작(다섯 문제 · 수업)');
    const sz = await ev(() => { const q = document.querySelector('.twn-p .ac-q'), bs = [...document.querySelectorAll('.twn-p .ac-ch button, .twn-p .ac-keys button, .twn-p .ac-items button')], bx = document.querySelector('.twn-p .bx').getBoundingClientRect(); return { fq: q ? parseFloat(getComputedStyle(q).fontSize) : 0, bh: bs.length ? Math.min(...bs.map(e => e.getBoundingClientRect().height)) : 0, task: (document.querySelector('.twn-p .ac-task') || {}).textContent || '', w: bx.width, cx: (bx.left + bx.right) / 2, vw: innerWidth }; });
    ok(sz.fq >= 18 && sz.bh >= 44, '물음 글 ' + sz.fq + 'px(18 넘게) · 단추 높이 ' + Math.round(sz.bh) + 'px(44 넘게)'); ok(/^할 일: /.test(sz.task), '할 일 한 줄 「' + sz.task + '」'); ok(Math.abs(sz.cx - sz.vw / 2) < 4 && sz.w >= 700, '창 = 화면 가운데 · 폭 ' + Math.round(sz.w) + 'px');
    // ③ 틀림 → 힌트 1 → 힌트 2 → 까닭 → 맞힘 → 오늘 배운 것 (고르기 문제가 나올 때까지 바르게 풂)
    console.log('③ 힌트 사다리'); let done3 = false;
    for (let n = 0; n < 5 && !done3; n++) { R = await RUN(); if (R.cur.kind === 'pick' && R.cur.nch === 4) { const wr = [0, 1, 2, 3].filter(i => i !== R.cur.ans), msgs = [];
        for (const w of wr) { await click('[data-c="' + w + '"]'); await W8(120); msgs.push(await ev(w9 => ({ m: (document.querySelector('.twn-p .ac-msg') || {}).textContent || '', no: document.querySelector('.twn-p [data-c="' + w9 + '"]').classList.contains('no'), dis: document.querySelector('.twn-p [data-c="' + w9 + '"]').disabled, okc: document.querySelectorAll('.twn-p .ac-ch button.ok').length }), w)); if (msgs.length === 2) await shot('3_hint2'); }
        ok(msgs[0].no && msgs[0].dis && /^힌트 1/.test(msgs[0].m), '첫 틀림 = 그 보기 잠김(X 표시) + 「힌트 1」'); ok(/^힌트 2/.test(msgs[1].m), '둘째 틀림 = 「힌트 2」'); ok(/^까닭/.test(msgs[2].m), '셋째 틀림 = 「까닭」 — ' + msgs[2].m.slice(0, 50)); ok(msgs.every(x => x.okc === 0), '틀리는 동안 정답 단추를 칠하지 않음');
        await shot('3_why'); await click('[data-c="' + R.cur.ans + '"]'); await W8(150); const m4 = await ev(() => (document.querySelector('.twn-p .ac-msg') || {}).textContent || ''); ok(/까닭을 보고 맞혔어요/.test(m4) && /오늘 배운 것/.test(m4), '맞힘 = 「오늘 배운 것」 한 줄 — ' + m4.slice(0, 60));
        ok(await ev(() => !!document.querySelector('.twn-p [data-a="next"][data-def]')), '「다음 문제」 = 기본 단추(Enter)'); await p.keyboard.press('Enter'); await W8(200); done3 = true; }
      else { await solveOne(); await shot('2_q' + n); await next(); } }
    ok(done3, '4지선다 문제에서 힌트 사다리를 봄');
    const kinds0 = await solveAll(); R = await RUN(); ok(R.phase === 'end', '다섯 문제 끝 (' + kinds0.join(' ') + ')');
    // ④ 잘한 판 → 단계 · 별 · 도장 · 솜씨
    P0 = await panel(); const s1 = await ST(K0), I1 = await ev(() => SM_TOWN.ent().info()), bag1 = await ev(e => SM_TOWN.game().S.bag[e] || 0, STAMP[K0]); await shot('4_end');
    ok(/1단계를 마쳤어요/.test(P0.t) && /수료 도장/.test(P0.t), '끝 창 = 「1단계를 마쳤어요」 · 수료 도장'); ok(/오늘 배운 것/.test(P0.t) && /● /.test(P0.t + ' '), '끝 창 = 문제마다 ●◐○ · 오늘 배운 것');
    ok(s1 && s1.st === 2 && s1.clr === 1 && s1.n === 1, '수첩 상태: 2단계 · 마친 단계 1 · 수업 1'); ok(I1.shown[0] && !I1.shown[1], '칠판 별 하나 붙음'); ok(bag1 === 1, '가방 ' + STAMP[K0] + ' 수료 도장 1');
    ok(/솜씨가 2 늘었어요/.test(P0.t), '보상 줄 = 실제로 오른 솜씨 「솜씨가 2 늘었어요」');
    const rk = await ev(() => { const L = (SM_TOWN.game().S.rec || {}).l || SM_TOWN.game().S.rec || []; return JSON.stringify(L).includes('"acad"'); }); ok(rk, '학급 기록에 acad 한 줄');
    // ⑤ 같은 날 한 판 더
    console.log('⑤ 같은 날 한 판 더'); const xpA = await XP(SK0); await click('[data-a="again"]'); await W8(200); P0 = await panel(); ok(/벌써 올렸어요/.test(P0.t) && /2단계 수업/.test(P0.t), '한 판 더 = 2단계 · 「오늘은 단계를 벌써 올렸어요」');
    await click('[data-a="start"]'); await W8(250); await solveAll(); P0 = await panel(); const s2 = await ST(K0), xpB = await XP(SK0);
    ok(s2.st === 2 && s2.clr === 1 && (await ev(e => SM_TOWN.game().S.bag[e] || 0, STAMP[K0])) === 1, '같은 날 잘한 판 = 단계·도장 그대로'); ok(xpB === xpA && /이미 받았어요/.test(P0.t), '같은 날 솜씨 0 · 「오늘 몫은 이미 받았어요」');
    // ⑥ 학원 수첩
    console.log('⑥ 학원 수첩'); await click('[data-a="note"]'); await W8(300); P0 = await panel(); await shot('6_note');
    ok(P0 && P0.k === 'acad' && /학원 수첩/.test(P0.t) && /2단계/.test(P0.t) && /도장 1/.test(P0.t), '수첩 창: ' + K0 + ' 2단계 · 도장 1'); ok(/수업 시간: 오전 10시~밤 9시/.test(P0.t), '수첩에 수업 시간 줄');
    ok(await ev(() => [...document.querySelectorAll('.twn-p [data-nb]')].some(b9 => /학원/.test(b9.textContent))), '수첩 탭 줄에 📒 학원 탭');
    ok(!/[0-9]+위|순위|1등/.test(P0.t), '수첩에 순위·견주기 없음');
    // ⑦ 수업 시간 밖 = 자습
    console.log('⑦ 자습'); await closeAll(); await setT(9 * 60 + 30); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); P0 = await panel();
    ok(/수업은 오전 10시부터예요/.test(P0.t) && /자습 시작/.test(P0.t) && /자습/.test(P0.t), '오전 9시 반 = 「수업은 오전 10시부터예요」 · 자습 시작'); await shot('7_self');
    await click('[data-a="start"]'); await W8(250); R = await RUN(); ok(R.mode === 'self' && R.n === 3, '자습 = 세 문제'); await solveAll(); P0 = await panel(); const s3 = await ST(K0);
    ok(s3.st === 2 && s3.clr === 1 && s3.self === 1 && /자습은 연습/.test(P0.t), '자습 = 단계·도장 그대로 · 자습 1');
    await closeAll(); await setT(21 * 60 + 30); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); P0 = await panel(); ok(/오늘 수업은 끝났어요/.test(P0.t), '밤 9시 반 = 「오늘 수업은 끝났어요」');
    // ⑧ 다음 날
    console.log('⑧ 다음 날'); await closeAll(); await setT(15 * 60, 1); const xpC = await XP(SK0); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); await click('[data-a="start"]'); await W8(250); await solveAll(); const s4 = await ST(K0), xpD = await XP(SK0);
    ok(s4.st === 3 && s4.clr === 2 && (await ev(e => SM_TOWN.game().S.bag[e] || 0, STAMP[K0])) === 2, '다음 날 잘한 판 = 3단계 · 도장 2'); ok(xpD > xpC, '다음 날 솜씨 다시 + (' + xpC + ' → ' + xpD + ')');
    const I4 = await ev(() => SM_TOWN.ent().info()); ok(I4.shown[1] && !I4.shown[2], '칠판 별 둘');
    // ⑨ 닫았다 열면 이어서
    console.log('⑨ 이어서'); await click('[data-a="again"]'); await W8(150); await click('[data-a="start"]'); await W8(200); await solveOne(); await next(); await p.keyboard.press('Escape'); await W8(250); ok(!(await panel()), 'Esc = 창 닫힘');
    await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); R = await RUN(); P0 = await panel(); ok(R.phase === 'q' && R.i === 1 && /2\/5/.test(P0.t), '다시 E = 하던 문제(2/5)부터'); await closeAll();
    // 방을 나갔다 들어오면 별이 그대로
    await leave(); await enter(Q0); const I5 = await ev(() => SM_TOWN.ent().info()); ok(I5.shown.filter(Boolean).length === 2, '다시 들어와도 칠판 별 둘'); await leave();
    // ⑩ 과목 일곱 한 판씩
    console.log('⑩ 과목마다 한 판'); await setT(15 * 60, 1);
    for (const k of have.filter(x => x !== K0)) { if (!await enter(byCat[k])) { ok(false, k + ' 들어가지 못함'); continue; } await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); await click('[data-a="start"]'); await W8(300);
      const R1 = await RUN(); if (SHOTS && R1 && R1.cur) await shot('10_' + k + '_q1'); const kinds = await solveAll(), s9 = await ST(k), P9 = await panel(), I9 = await ev(() => SM_TOWN.ent().info());
      ok(s9 && s9.st === 2 && s9.clr === 1 && I9.shown[0] && /1단계를 마쳤어요/.test(P9.t) && !kinds.includes('✗'), k + ' 한 판 = 단계 · 별 (' + kinds.join(' ') + ')');
      if (k === 'study') { await click('[data-a="again"]'); await W8(200); const sw = await ev(() => [...document.querySelectorAll('.twn-p [data-sub]')].map(b9 => b9.dataset.sub + ':' + b9.className)); ok(sw.length === 2 && sw.includes('study:on'), '공부방 = 과목 고르기 둘(독서·논술 · 과학·코딩) — ' + sw.join(' '));
        await click('[data-sub="science"]'); await W8(200); let P8 = await panel(); ok(/과학·코딩 학원 · 1단계 수업/.test(P8.t), '과학·코딩을 고르면 제목·단계가 바뀜'); await shot('10_science_pick'); await click('[data-a="start"]'); await W8(300);
        const kd = await solveAll(), sc = await ST('science'), I8 = await ev(() => SM_TOWN.ent().info()); ok(sc && sc.st === 2 && I8.shown[5] && !I8.shown[6] && I8.shown[0], '공부방 과학·코딩 한 판 = 과학 2단계 · 파란 별 줄 하나 (' + kd.join(' ') + ')');
        await closeAll(); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(250); P8 = await panel(); ok(/과학·코딩/.test(P8.t), '다시 E = 마지막에 고른 과목(과학·코딩)'); await shot('10_science_end'); }
      await leave(); }
    // 리듬·동작·로봇: 틀린 차례 = 힌트 1(앞에서 n칸) · 둘째 = 다시 보여 줌
    if (have.includes('piano') || have.includes('taekwondo')) { const k = have.includes('taekwondo') ? 'taekwondo' : 'piano'; await enter(byCat[k]); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(250); await click('[data-a="start"]'); await W8(250);
      for (let n = 0; n < 5; n++) { R = await RUN(); if (R.cur.kind === 'seq') break; await solveOne(); await next(); }
      R = await RUN(); if (R.cur.kind === 'seq') { await p.waitForFunction(() => SM_TOWN.acad().run().demoDone && !SM_TOWN.acad().run().demo, null, { timeout: 20000 }); const sq = R.cur.seq, wrongK = await ev(() => [...document.querySelectorAll('.twn-p .ac-keys button')].map(b9 => b9.dataset.k)); const bad = sq.map((x, i) => (i === 1 ? wrongK.find(y => y !== x) : x));
        for (const k9 of bad) await click('[data-k="' + k9 + '"]'); await W8(150); let m = await ev(() => (document.querySelector('.twn-p .ac-msg') || {}).textContent || ''); ok(/힌트 1/.test(m) && /앞에서 1칸까지 맞아요/.test(m), k + ' 틀린 차례 = 「힌트 1 앞에서 1칸까지 맞아요」'); await shot('10_' + k + '_seqhint');
        for (const k9 of bad) await click('[data-k="' + k9 + '"]'); await W8(400); R = await RUN(); ok(R.demo || /힌트 2/.test(R.msg), k + ' 둘째 틀림 = 힌트 2 + 다시 보여 줌'); }
      await leave(); }
    // ⑩-2 모든 틀 그려 보기(과목 7 × 단계 5 × 12판 · 풀기 전 · 틀린 뒤 · 맞힌 뒤)
    { let tot = 0; const E9 = []; for (const k of SUBJS) for (let st = 1; st <= 5; st++) { const r9 = await ev(([k9, s9]) => SM_TOWN.acad().probe(k9, s9, 12), [k, st]); tot += r9.cnt; E9.push(...r9.errs.map(e => k + st + ' ' + e)); }
      ok(!E9.length && tot >= 7 * 5 * 12 * 4, '모든 틀 창에 그려 보기 ' + tot + '문제 × 세 상태 — 오류 ' + E9.length + (E9.length ? ' (' + E9.slice(0, 3).join(' | ') + ')' : '')); }
    // ⑪ 휴대폰 세로·가로
    console.log('⑪ 휴대폰'); for (const [w, h, nm] of [[390, 844, '세로'], [844, 390, '가로']]) { await p.setViewportSize({ width: w, height: h }); await W8(400); await enter(Q0); await ev(() => SM_TOWN.ent().use('ent:acad')); await W8(300); await click('[data-a="start"]'); await W8(300);
      const m = await ev(() => { const bx = document.querySelector('.twn-p .bx'), bs = [...document.querySelectorAll('.twn-p .ac-ch button, .twn-p .ac-keys button, .twn-p .ac-items button, .twn-p .row button')].filter(e => e.offsetParent), r = bx.getBoundingClientRect(); return { over: bx.scrollWidth - bx.clientWidth, docOver: document.documentElement.scrollWidth - innerWidth, inV: r.left >= -1 && r.right <= innerWidth + 1, bh: Math.min(...bs.map(e => e.getBoundingClientRect().height)), fq: parseFloat(getComputedStyle(document.querySelector('.twn-p .ac-q')).fontSize) }; });
      ok(m.over <= 1 && m.docOver <= 1 && m.inV, '휴대폰 ' + nm + ' ' + w + '×' + h + ' = 가로 넘침 X (창 ' + m.over + ' · 문서 ' + m.docOver + ')'); ok(m.bh >= 44 && m.fq >= 18, '휴대폰 ' + nm + ' 단추 ' + Math.round(m.bh) + 'px · 물음 ' + m.fq + 'px'); await shot('11_phone_' + (nm === '세로' ? 'p' : 'l'));
      /* 틀린 뒤 힌트 칸 · 맞힌 뒤 '다음' 단추가 내리지 않고 보임(창 안 굴림 0에서) */
      const R6 = await RUN(); if (R6 && R6.cur && R6.cur.kind === 'pick') { const w6 = [0, 1, 2, 3].find(i => i !== R6.cur.ans && i < R6.cur.nch); await ev(() => { const bx = document.querySelector('.twn-p .bx'); bx.scrollTop = 0; }); await click('[data-c="' + w6 + '"]'); await W8(150);
        const vis = sel => ev(s9 => { const e = document.querySelector('.twn-p ' + s9), bx = document.querySelector('.twn-p .bx'); if (!e || !bx) return false; const r = e.getBoundingClientRect(), b = bx.getBoundingClientRect(); return r.height > 0 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && r.bottom <= innerHeight + 1; }, sel);
        ok(await vis('.ac-msg'), '휴대폰 ' + nm + ' 틀린 뒤 힌트 칸이 내리지 않고 보임'); await shot('11_phone_' + (nm === '세로' ? 'p' : 'l') + '_hint'); await click('[data-c="' + R6.cur.ans + '"]'); await W8(150); await ev(() => { const bx = document.querySelector('.twn-p .bx'); bx.scrollTop = 0; });
        ok(await vis('[data-a="next"]') && await vis('.ac-msg'), '휴대폰 ' + nm + ' 맞힌 뒤 「다음 문제」 단추와 배운 것 칸이 보임'); await shot('11_phone_' + (nm === '세로' ? 'p' : 'l') + '_next'); }
      const pr = []; for (const st of [4, 5]) pr.push(...(await ev(s9 => SM_TOWN.acad().probe('science', s9, 8), st)).errs); ok(!pr.length, '휴대폰 ' + nm + ' 로봇 블록 한 줄 · 보기 칸 안 (' + (pr.slice(0, 2).join(' | ') || '오류 0') + ')');
      await leave(); }
    /* ⑪-2 POLISH-1(11-07 '로봇 문제 휴대폰 가로 = 보기 둘 남짓만 보이고 나머지는 내려야 해요'): 낮은 가로 화면(844×390 · 사파리 주소창 빼면 844×340 · 740×320)에서 로봇 문제 = 물음·그림·보기 넷·힌트·다음 단추가 창 안 굴림 없이 한 화면 */
    for (const [w, h, st7] of [[844, 390, 5], [844, 340, 3], [740, 320, 5]]) { await p.setViewportSize({ width: w, height: h }); await ev(() => { document.body.classList.add('touch', 'small'); }); await W8(300); await closeAll();
      await ev(s7 => { const S9 = SM_TOWN.acad().state(); S9.s.science = { st: s7, clr: s7 - 1, up: -1, rd: -1, n: 1, self: 0, learn: [], rec: [] }; }, st7); await ev(() => SM_TOWN.acad().open('science', {})); await W8(250); await click('[data-a="start"]'); await W8(250);
      let R7 = null; for (let n = 0; n < 5; n++) { R7 = await RUN(); if (R7 && R7.cur && /robot/.test(R7.cur.t)) break; await solveOne(); await next(); }
      if (!(R7 && R7.cur && /robot/.test(R7.cur.t))) { ok(false, '로봇 문제 못 찾음 ' + w + '×' + h); continue; }
      const fit = () => ev(() => { const bx = document.querySelector('.twn-p .bx'), b = bx.getBoundingClientRect(), inV = s9 => [...document.querySelectorAll('.twn-p ' + s9)].every(e => { const r = e.getBoundingClientRect(); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1; }); bx.scrollTop = 0; return { sc: bx.scrollHeight - bx.clientHeight, ch: document.querySelectorAll('.twn-p .ac-ch button').length, chIn: inV('.ac-ch button'), pic: inV('.ac-pic svg'), q: inV('.ac-q'), msg: inV('.ac-msg'), nx: inV('[data-a="next"]'), side: document.querySelector('.twn-p .ac-body').classList.contains('side') }; });
      const strict = h >= 340, lim = strict ? 1 : 40, tag7 = strict ? '' : ' · 작은 휴대폰은 40px까지(예전 224px)';   /* 844×390·844×340 = 굴림 0 · 740×320(작은 휴대폰) = 거의 한 화면 */
      const f0 = await fit(); ok(f0.side && f0.sc <= lim && (f0.chIn || !strict) && f0.pic && f0.q, '휴대폰 가로 ' + w + '×' + h + ' 로봇 문제 = 물음·그림·보기 ' + f0.ch + '개가 한 화면(굴림 ' + f0.sc + 'px' + tag7 + ')'); await shot('11b_robot_' + w + 'x' + h);
      const wr7 = [0, 1, 2, 3].find(i => i !== R7.cur.ans && i < R7.cur.nch); await click('[data-c="' + wr7 + '"]'); await W8(150); const f1 = await fit(); ok(f1.sc <= lim && (f1.chIn || !strict) && f1.msg, '휴대폰 가로 ' + w + '×' + h + ' 틀린 뒤 = 보기·힌트 칸 한 화면(굴림 ' + f1.sc + 'px' + tag7 + ')'); await shot('11b_robot_' + w + 'x' + h + '_hint');
      await click('[data-c="' + R7.cur.ans + '"]'); await W8(150); const f2 = await fit(); ok(f2.sc <= lim && f2.nx && f2.msg && f2.pic, '휴대폰 가로 ' + w + '×' + h + ' 맞힌 뒤 = 배운 것·「다음 문제」·그림 한 화면(굴림 ' + f2.sc + 'px' + tag7 + ')'); await shot('11b_robot_' + w + 'x' + h + '_next');
      await closeAll(); }
    await p.setViewportSize({ width: 1366, height: 768 });
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log(e); }
  await b.close(); console.log(fails.length ? '\n✗ ' + fails.length + '개 실패' : '\n✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
