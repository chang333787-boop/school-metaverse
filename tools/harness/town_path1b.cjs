// 📝 처음 15분 길 — 글·창·알림(PATH-1B · 11-14 평가 A '읽는 아이' 1366×768): node tools/harness/town_path1b.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=g6,g7]
//   g6 '집은 어디일까요?' 창 = 스크롤 없이 한 화면(지도 + 고르는 단추 셋이 768 안) · 휴대폰 가로 340에서도 가로 넘침 X
//   g7 '가방에 물건이 들어왔어요' → 가방이 새 물건이 든 탭으로 열림(빈 「물건」 탭 X) · 다 본 뒤엔 기억한 탭
//   play 놀이 끝 창(감자·배추) = 단추는 [닫기] 하나 · 결과 글·기록 줄이 단추에 안 가림 · [닫기] = 끝(보상 그대로) · 칸을 누르면 바로 답 · 큰 단추 글
//   xp 점수 글 옆 까닭 한 낱말(표에 없으면 예전 꼴) · 팁 줄이 뜬 동안 점수 글은 그 위
//   g12 꽃에 물 → 하루 마무리 「오늘 세상에 남긴 것」에 셈   g13 보물 창 「도움 n번으로 / 도움 없이」 = 이야기 길 도움까지 셈
//   g9 「빨간불이에요」 = 아이가 가는 쪽 신호가 빨강일 때만(둘째 길만 읽던 것)   g3 첫 이야기(p0) 동안 칸 힌트·'오늘 밤 열리는 것' 미룸 → 끝나면 뜸
//   sit 앉은 글 = 앉은 곳 이름으로(그네 '의자에 앉았어요' X)
//   g11 환영 창 「단축키 더 보기」를 펼쳐도 768 한 화면(맨 아래 줄 안 잘림) · 단추 '처음부터 시작하기' · 쪽지 ▼ 옆 'E = 다음' · 낮 일 쪽지가 밤에 오면 이름표에 '내일 아침에 해요'
const { chromium, RENDER } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || null;
const OUT = arg('shots'), ONLY = arg('only') ? arg('only').split(',') : null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fs = require('fs'); if (OUT) fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const want = k => !ONLY || ONLY.includes(k);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  // 새 판 하나(저장 없음) — 묶음마다 새 창이라 서로 물들지 않음
  const fresh = async (vp, touch) => { const ctx = await b.newContext({ viewport: vp || { width: 1366, height: 768 }, hasTouch: !!touch, isMobile: !!touch }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 240)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!OUT || !RENDER) return; await p.screenshot({ path: OUT + '/' + n + '.png' }); console.log('    📷 ' + OUT + '/' + n + '.png'); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.emerg && SM_TOWN.emerg(), null, { timeout: 240000 }); await W8(1500);
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); } };
    const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { if (document.querySelector('.twn-dlg')) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
    const hot = async re => { for (let i = 0; i < 24; i++) { const h = await ev(r9 => { const H = SD2.map.interact.list().find(q => new RegExp(r9).test(q.label || '')); return H ? [H.x, H.z] : null; }, re); if (h) return h; await W8(300); } return null; };
    const start = async () => { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2200); };
    return { ctx, p, ev, W8, shot, tp, closeDlg, shut, hot, start }; };
  // 화면 글(창 · 가운데 띠 · 위 알림 · 조작 한 줄 · 새 친구 말)을 한 번에
  const texts = ev => ev(() => { const vis = e => e && e.isConnected && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.05 && e.getBoundingClientRect().width > 4, tx = id => { const e = document.getElementById(id); return vis(e) ? (e.textContent || '').trim() : ''; };
    return { ban: tx('hudBan'), toast: tx('toast'), pan: (document.querySelector('.twn-p') || {}).dataset ? (document.querySelector('.twn-p').dataset.k || 'p') : '', dlg: !!document.querySelector('.twn-dlg') }; });
  try {
    // ───────── g6 집 고르기 창 ─────────
    if (want('g6')) { console.log('g6 「집은 어디일까요?」 창 — 한 화면');
      for (const [nm, vp, touch] of [['크롬북 1366×768', { width: 1366, height: 768 }, 0], ['휴대폰 가로 740×340', { width: 740, height: 340 }, 1], ['휴대폰 세로 340×700', { width: 340, height: 700 }, 1]]) {
        const T = await fresh(vp, touch), { ev, W8, p } = T; await T.start(); await T.shut();
        await ev(() => SM_TOWN.storyAt('a1_1', 2)); await W8(1800); await T.shut();
        let E = null; for (let i = 0; i < 30 && !E; i++) { E = await ev(() => SM_TOWN.emerg().info().ev); if (!E) await W8(400); }
        if (!E) { ok(false, nm + ': 112 사건이 안 열림'); await T.ctx.close(); continue; }
        await T.tp(E.x + 4, E.z + 4, E.x, E.z); await W8(1500);
        const use = async re => { const h = await T.hot(re); if (!h) return false; await T.tp(h[0] + 0.6, h[1] + 0.6, h[0], h[1]); await W8(400); await ev(r9 => { const H = SD2.map.interact.list().find(q => new RegExp(r9).test(q.label || '')); if (H && H.use) H.use(H); }, re); await W8(900); return true; };   /* 휴대폰 틀에서도 같게: 그 지점의 use를 바로 부름(E 키와 같은 길) */
        await use('경찰관과 이야기하기'); for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await ev(() => SM_TOWN.dlgNext ? SM_TOWN.dlgNext() : null); await p.keyboard.press('KeyE'); await W8(350); }
        await use('새 친구에게 물어보기');
        if (!(await ev(() => !!document.querySelector('.twn-p [data-q]')))) console.log('    (묻기 창 X — 사건 ' + JSON.stringify(await ev(() => { const E9 = SM_TOWN.emerg().info().ev; return { st: E9 && E9.st, dlg: !!document.querySelector('.twn-dlg'), pan: ((document.querySelector('.twn-p') || {}).innerText || '').slice(0, 60) }; })) + ')');
        if (nm.startsWith('크롬북')) await T.shot('g6_a_ask0');
        for (const q of ['near', 'dir']) { await ev(q9 => { const b9 = document.querySelector('.twn-p [data-q="' + q9 + '"]'); if (b9) b9.click(); }, q); await W8(350); }
        const R = await ev(() => { const bx = document.querySelector('.twn-p .bx'); if (!bx) return null; const r = e => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; }, cv = bx.querySelector('canvas');
          return { vw: innerWidth, vh: innerHeight, sh: bx.scrollHeight, ch: bx.clientHeight, sw: bx.scrollWidth, cw: bx.clientWidth, bx: r(bx), cv: cv ? r(cv) : null, os: [...bx.querySelectorAll('[data-o]')].map(r), qs: [...bx.querySelectorAll('[data-q]')].map(r), ot: [...bx.querySelectorAll('[data-o]')].map(q => q.textContent.trim()), x: r(bx.querySelector('[data-a="x"]')), sm: Math.min(...[...bx.querySelectorAll('button')].map(q => q.getBoundingClientRect().height)) }; });
        if (!R) { ok(false, nm + ': 묻기 창이 안 열림'); await T.ctx.close(); continue; }
        console.log('    ' + nm + ' 창 ' + JSON.stringify(R.bx) + ' · 안 높이 ' + R.sh + '/' + R.ch + ' · 지도 ' + JSON.stringify(R.cv) + ' · 단추 ' + JSON.stringify(R.os) + ' ' + R.ot.join(' / '));
        ok(R.os.length === 3 && R.qs.length === 4, nm + ': 물음 넷 + 고르는 단추 셋');
        if (nm.startsWith('크롬북')) { ok(R.sh <= R.ch + 1, nm + ': 스크롤 없이 한 화면(안 높이 ' + R.sh + ' ≤ ' + R.ch + ')'); ok(R.cv && R.cv[3] <= R.vh && R.os.every(q => q[3] <= R.vh && q[1] >= 0) && R.x[3] <= R.vh, nm + ': 지도 · 단추 셋 · 닫기가 모두 768 안(지도 아래 ' + (R.cv && R.cv[3]) + ' · 단추 아래 ' + Math.max(...R.os.map(q => q[3])) + ' · 닫기 아래 ' + R.x[3] + ')'); }
        ok(R.sw <= R.cw + 1 && R.bx[0] >= 0 && R.bx[2] <= R.vw + 1, nm + ': 가로 넘침 X(' + R.sw + '/' + R.cw + ' · 창 ' + R.bx[0] + '~' + R.bx[2] + ')'); ok(R.sm >= 40, nm + ': 단추 높이 ' + Math.round(R.sm) + 'px ≥ 40');
        await T.shot('g6_' + (nm.startsWith('크롬북') ? 'b_pick' : nm.includes('가로') ? 'c_phone_l' : 'd_phone_p'));
        if (nm.startsWith('크롬북')) { const wrong = await ev(() => { const E9 = SM_TOWN.emerg().info().ev; return E9.opts.findIndex(o => o !== 'home' && o.k !== (E9.par && E9.par.k)); }); await ev(i9 => { const b9 = document.querySelector('.twn-p [data-o="' + i9 + '"]'); if (b9) b9.click(); }, wrong < 0 ? 0 : wrong); await W8(300);
          const M = await ev(() => { const m = document.querySelector('.twn-p [data-m]'), bx = document.querySelector('.twn-p .bx'); return m ? { t: m.textContent, b: Math.round(m.getBoundingClientRect().bottom), sh: bx.scrollHeight, ch: bx.clientHeight } : null; }); if (M && M.t) ok(M.b <= 768 && M.sh <= M.ch + 1, nm + ': 틀렸을 때 까닭 줄도 화면 안(아래 ' + M.b + ')'); await T.shot('g6_e_wrong'); }
        await T.ctx.close(); } }

    // ───────── g7 가방 = 새 물건이 든 탭 ─────────
    if (want('g7')) { console.log('g7 가방 — 새 물건이 든 탭으로 열림');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      const add = (e, n) => ev(([e, n]) => { const G = SM_TOWN.game(); G.add(e, n, 'path1b'); }, [e, n]);
      const st = () => ev(() => { const bx = document.querySelector('.twn-p'); return { tab: SM_TOWN.bag3().ui().tab, pref: SM_TOWN.bag3().ui().pref.tab, empty: !!(bx && /아직 비어 있어요/.test((bx.querySelector('.b3-pane:not([data-lazy])') || bx).innerText || '')), cells: bx ? bx.querySelectorAll('[data-pane="' + SM_TOWN.bag3().ui().tab + '"] .b3s').length : 0 }; });
      await add('📜', 1); await add('🏮', 1); await W8(300);   /* 프롤로그 끝에 받는 것 둘(둘 다 「모은 것」) */
      await p.keyboard.press('KeyI'); await W8(600); let s = await st(); console.log('    처음 열기 ' + JSON.stringify(s));
      ok(s.tab === 'col' && s.cells >= 1, '이야기 도장·등불만 받았을 때 I = 「모은 것」 탭(칸 ' + s.cells + ')'); ok(s.pref === 'item', '기억한 탭은 그대로(물건)'); await T.shot('g7_a_first');
      await T.shut(); await p.keyboard.press('KeyI'); await W8(600); s = await st(); ok(s.tab === 'item', '다 본 뒤 다시 열면 = 기억한 탭(물건)'); await T.shut();
      await add('🥤', 1); await W8(200); await p.keyboard.press('KeyI'); await W8(600); s = await st(); ok(s.tab === 'item' && !s.empty && s.cells >= 1, '먹을 것을 받으면 「물건」 탭 · 빈 글 X'); await T.shot('g7_b_item'); await T.shut();
      await T.ctx.close(); }

    // ───────── play 놀이 끝 창 ─────────
    if (want('play')) { console.log('play 놀이 끝 창 — [닫기] 하나 · 결과 글이 단추에 안 가림 · 칸을 누르면 바로 답');
      for (const [nm, vp, touch] of [['크롬북 1366×768', { width: 1366, height: 768 }, 0], ['휴대폰 가로 740×340', { width: 740, height: 340 }, 1]]) {
        const T = await fresh(vp, touch), { ev, W8 } = T, cb = nm.startsWith('크롬북'); await T.start(); await T.shut();
        await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyOff(); }); await W8(1200); await T.shut();
        const meas = () => ev(() => { const pb = document.querySelector('.twn-play .pb'); if (!pb) return null; const r = e => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.bottom)]; }, vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 2, x = pb.querySelector('.row .x'), row = x && x.closest('.row');
          return { end: pb.classList.contains('mg-end'), vh: innerHeight, pb: r(pb), msg: r(pb.querySelector('.msg')), rec: vis(pb.querySelector('.mgrec')) ? r(pb.querySelector('.mgrec')) : null, row: r(row), goOn: vis(pb.querySelector('.go')), goT: ((pb.querySelector('.go') || {}).textContent || '').trim(), btn: [...(row || pb).querySelectorAll('button')].filter(vis).map(q => q.textContent.trim()), msgT: ((pb.querySelector('.msg') || {}).textContent || '').trim(), all: pb.innerText || '' }; });
        for (const [k, emo, goT, re] of [['potato', '🥔', '고른 칸 파기', /삽질 \d+번/], ['cabbage', '🥬', '고른 배추 베기', /비교해요/]]) {
          const op = await ev(k9 => { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(0); return !!SM_TOWN.play(k9); }, k); await W8(1500);
          let M = await meas(); if (!op || !M) { ok(false, nm + ' ' + k + ': 놀이 판이 안 열림'); continue; }
          ok(M.goT === goT, nm + ' ' + k + ': 큰 단추 글 = 「' + M.goT + '」(하는 일이 보임)'); ok(re.test(M.all), nm + ' ' + k + ': 시작 글에 ' + re);
          if (k === 'potato') { const i = await ev(() => { const B = [...document.querySelectorAll('.twn-play .mg .gc')], i9 = B.findIndex(e => e.textContent === '🌿'); if (i9 >= 0) B[i9].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return i9; }); await W8(350);
            const c1 = await ev(i9 => { const e = document.querySelectorAll('.twn-play .mg .gc')[i9]; return e ? [e.className, e.textContent] : null; }, i); M = await meas();
            ok(!!c1 && /dug/.test(c1[0]) && (c1[1] === '🥔' ? /찾았다/.test(M.msgT) : c1[1] === '🌿' && /줄기 바로 밑엔 없어요/.test(M.msgT)), nm + ' 감자: 칸을 누르면 바로 답(' + JSON.stringify(c1) + ' · 「' + M.msgT.slice(0, 34) + '」) · 빈 줄기 칸엔 🌿가 남음');
            await ev(() => { const g = document.querySelector('.twn-play .go'); g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); g.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true })); }); await W8(300); M = await meas();
            ok(/이미 판 칸이에요/.test(M.msgT), nm + ' 감자: 이미 판 칸에서 큰 단추 = 한마디(「' + M.msgT.slice(0, 30) + '」)'); }
          await ev(() => SM_TOWN.lad().finish(3, 5)); await W8(700); M = await meas();
          console.log('    ' + nm + ' ' + k + ' 끝 — 판 ' + JSON.stringify(M.pb) + ' · 결과 글 ' + JSON.stringify(M.msg) + ' · 기록 줄 ' + JSON.stringify(M.rec) + ' · 단추 줄 ' + JSON.stringify(M.row) + ' · 단추 ' + JSON.stringify(M.btn));
          ok(M.end && !M.goOn && M.btn.length === 1 && M.btn[0] === '닫기', nm + ' ' + k + ': 끝나면 단추는 [닫기] 하나(' + M.btn.join(' · ') + ')');
          ok(M.msg && M.row && M.msg[1] <= M.row[0] + 1 && (!M.rec || M.rec[1] <= M.row[0] + 1), nm + ' ' + k + ': 결과 글·기록 줄이 단추 줄에 안 가림(글 아래 ' + (M.msg && M.msg[1]) + ' · 기록 아래 ' + (M.rec && M.rec[1]) + ' ≤ 단추 위 ' + (M.row && M.row[0]) + ')');
          ok(M.row && M.row[1] <= M.pb[1] + 1 && M.row[1] <= M.vh + 1, nm + ' ' + k + ': [닫기]가 판·화면 안(아래 ' + (M.row && M.row[1]) + ' ≤ ' + Math.min(M.pb[1], M.vh) + ')');
          await T.shot('play_' + (cb ? 'a' : 'b_phone') + '_' + k + '_end');
          await ev(() => { const x = document.querySelector('.twn-play .row .x'); if (x) x.click(); }); await W8(900);
          const A9 = await ev(e9 => ({ open: !!document.querySelector('.twn-play'), got: ((SM_TOWN.game().S.today || {}).got || {})[e9] | 0 }), emo);
          ok(!A9.open && A9.got >= 1, nm + ' ' + k + ': [닫기] = 끝(판 닫힘 · 오늘 거둔 ' + emo + ' ' + A9.got + ' — 보상 그대로)'); await W8(3500); }
        await T.ctx.close(); } }

    // ───────── xp 점수 글 옆 까닭 낱말 ─────────
    if (want('xp')) { console.log('xp 점수 글 — 까닭 한 낱말 · 팁 줄에 안 가림');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyOff(); }); await W8(1200); await T.shut();
      const xp = () => ev(() => { const e = document.querySelector('.twn-xp'); if (!e) return null; const q = e.getBoundingClientRect(), em = e.querySelector('em'), tip = document.querySelector('.twn-tip'), tq = tip && getComputedStyle(tip).display !== 'none' && tip.getBoundingClientRect().height > 2 ? tip.getBoundingClientRect() : null;
        return { on: +getComputedStyle(e).opacity > 0.05, t: (e.textContent || '').trim(), em: em ? em.textContent.trim() : '', top: Math.round(q.top), bot: Math.round(q.bottom), tipTop: tq ? Math.round(tq.top) : null, tipOn: document.body.classList.contains('tip-on') }; });
      await ev(() => SM_TOWN.skUp('look', 1, 'worm')); await W8(450); let X = await xp(); console.log('    ' + JSON.stringify(X));
      ok(!!X && X.on && X.em === '지렁이', '관찰 +1 옆에 까닭 「' + (X && X.em) + '」(' + (X && X.t.slice(0, 26)) + ')'); await T.shot('xp_a_why');
      await W8(2600); await ev(() => SM_TOWN.skUp('look', 1, 'zzz')); await W8(450); X = await xp(); ok(!!X && X.on && X.em === '', '표에 없는 꼬리표 = 낱말 없이 예전 꼴(' + (X && X.t.slice(0, 20)) + ')');
      await W8(2600); await ev(() => { SM_TOWN.tips.reset(); SM_TOWN.tips.want('bag'); SM_TOWN.tips.age(10000); SM_TOWN.tips.sec(); });
      let cur = null; for (let i = 0; i < 40 && !cur; i++) { await W8(400); cur = await ev(() => { SM_TOWN.tips.sec(); return SM_TOWN.tips.info().cur; }); }
      await ev(() => SM_TOWN.skUp('farm', 1, 'flower')); await W8(450); X = await xp(); console.log('    팁 ' + cur + ' · ' + JSON.stringify(X));
      ok(!!cur && !!X && X.tipOn && X.tipTop != null, '팁 줄이 떠 있음(' + cur + ')'); ok(!!X && X.on && X.em === '꽃에 물 주기' && X.tipTop != null && X.bot <= X.tipTop, '팁 줄이 뜬 동안 점수 글은 그 위(점수 글 아래 ' + (X && X.bot) + ' ≤ 팁 위 ' + (X && X.tipTop) + ') — [I] 글을 안 가림'); await T.shot('xp_b_tip');
      await T.ctx.close(); }

    // ───────── g12 하루 마무리 ─────────
    if (want('g12')) { console.log('g12 하루 마무리 — 꽃에 물 준 것도 「오늘 세상에 남긴 것」에');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await ev(() => SM_TOWN.storyAt('p0', 2)); await W8(1500); await T.closeDlg();
      const T0 = await ev(() => SM_TOWN.storyTarget());
      if (!T0) ok(false, '물 줄 꽃 상자 목표가 없음');
      else { const cp = await ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; }), dx = cp[0] - T0.x, dz = cp[1] - T0.z, l = Math.hypot(dx, dz) || 1; await T.tp(T0.x + dx / l * 2.6, T0.z + dz / l * 2.6, T0.x, T0.z); await W8(1500);
        await p.keyboard.press('Digit1'); await W8(400); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [T0.x, T0.z]); await W8(200); await p.keyboard.down('KeyF'); await W8(2300); await p.keyboard.up('KeyF'); await ev(() => SM_TOWN.tools.aim(null)); await W8(600);
        const fw = await ev(() => (SM_TOWN.game().S.today || {}).flowW | 0); ok(fw >= 1, '꽃에 물을 주면 오늘 셈(flowW) = ' + fw);
        await T.shut(); await ev(() => { const G = SM_TOWN.game(); SM_TOWN.storyOff(); if (G.setClock) G.setClock(false); G.S.min = 21 * 60; }); await W8(900); await T.shut();
        await ev(() => { SM_TOWN.sleep({ ask: true }); }); await W8(1200);   /* 돌려주는 약속을 기다리지 않음(창이 닫혀야 끝나는 약속 — 기다리면 시험이 멈춤) */
        const R = await ev(() => { const P = document.querySelector('.twn-p'), bx = P && (P.querySelector('.bx') || P), st = P && P.querySelector('.st[data-left]'); return P ? { left: st ? +st.dataset.left : -1, t: st ? st.textContent.trim() : '', sh: bx.scrollHeight, ch: bx.clientHeight, top: Math.round(bx.getBoundingClientRect().top), bot: Math.round(bx.getBoundingClientRect().bottom), vh: innerHeight } : null; });
        console.log('    ' + JSON.stringify(R));
        ok(!!R && R.left >= 1 && /곳에 물 줌/.test(R.t) && !/아직 없어요/.test(R.t), '하루 마무리 「오늘 세상에 남긴 것」 = ' + (R && R.t.slice(0, 40)));
        if (R) console.log('    (창 길이 ' + R.sh + '/' + R.ch + ' · 창 ' + R.top + '~' + R.bot + ' / ' + R.vh + ')'); await T.shot('g12_recap'); }
      await T.ctx.close(); }

    // ───────── g13 보물 창 ─────────
    if (want('g13')) { console.log('g13 보물 창 — 길 도움을 받았으면 「도움 n번으로」 · 안 받았으면 「도움 없이」');
      for (const [h, re, nm] of [[3, /지도를 도움 2번으로 읽었어요/, '이야기 길 도움 둘(방향 · 빨간 선)'], [1, /지도를 도움 없이 읽었어요/, '읽는 법 힌트만(길 도움 X)']]) {
        const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
        await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyAt('p0', 1); }); await W8(1500); await T.shut();
        const g = await ev(h9 => { const TR = SM_TOWN.treasure(), G = SM_TOWN.game(), sp = TR && TR.spots()[0]; if (!sp) return null; const r = TR.give(sp.k); G.S.story.h = h9; const c9 = TR.info().cur; return { r, k: sp.k, cur: G.S.story.cur, x: c9 && c9.x, z: c9 && c9.z }; }, h); await W8(400);
        if (g && g.x != null) { await T.tp(g.x + 0.8, g.z + 0.6, g.x, g.z); await W8(1200); }   /* 상자 자리 곁에 서야 파기 지점이 켜짐 */
        let s = false; for (let i = 0; i < 10 && !s; i++) { s = await ev(() => SM_TOWN.treasure().shovel()); if (!s) await W8(400); }
        let t = ''; for (let i = 0; i < 20 && !/지도를/.test(t); i++) { await W8(400); t = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); }
        const line = (t.match(/[^\n.]*지도를[^\n.]*\./) || [''])[0].trim(); console.log('    받기 ' + JSON.stringify(g) + ' · 삽 ' + s + ' · 「' + line + '」');
        ok(!!g && g.r === 'new' && s && re.test(t), nm + ' → 「' + line + '」'); await T.shot('g13_h' + h);
        await T.ctx.close(); } }

    // ───────── g9 건널목 글 ─────────
    if (want('g9')) { console.log('g9 건널목 — 「빨간불이에요」는 아이가 가는 쪽 신호가 빨강일 때만(보이는 등과 같게)');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyOff(); }); await W8(1200); await T.shut();
      // 오늘(없으면 며칠 뒤 조건으로) 건널목 줄이 서는 신호 교차로 하나 + 첫째 길 초록·둘째 길 빨강인 때(tG) · 첫째 길 빨강인 때(tR)
      const C = await ev(() => { const K = SM_TOWN.kit, can = K.can(), base = K.cond(); let o = null;
        for (let d = 0; d < 24 && !o; d++) { K.force({ s: base.s, rain: false, night: false, day: base.day + d }); for (const n of Object.keys(can)) { if (!can[n].includes('cross') || !K.today(n).includes('cross')) continue; const sp = K.spot(n, 'cross'), s9 = sp && sp.s9; if (!s9 || s9.gate || !s9.t || Math.abs(s9.t[0][0]) + Math.abs(s9.t[0][1]) !== 1 || s9.hw[0] < 5) continue; o = { n, d, x: sp.x, z: sp.z, sx: s9.x, sz: s9.z, t0: s9.t[0], hw: s9.hw }; break; } }
        if (!o) { K.force(null); return null; }
        const li = SM_TOWN.sig().list.findIndex(q => Math.abs(q[0] - o.sx) < 0.2 && Math.abs(q[1] - o.sz) < 0.2), at = t => { SM_TOWN.setSigT(t); const q = SM_TOWN.sig().list[li]; return [q[2], q[3]]; }, gs = [], rs = [];
        if (li < 0) return { ...o, li };
        for (let t = 0; t < 26; t += 0.5) { const a = at(t), b9 = at(t + 5); if (a[0] === 0 && a[1] === 2 && b9[0] === 0) gs.push(t); if (a[0] === 2 && b9[0] === 2) rs.push(t); }
        return { ...o, li, tG: gs[0], tR: rs[0], day: SM_TOWN.game().S.day }; });
      if (!C || C.li < 0 || C.tG == null || C.tR == null) ok(false, '신호 건널목 후보가 없음 ' + JSON.stringify(C));
      else { const t0 = C.t0, n0 = [-t0[1], t0[0]], dx = C.x - C.sx, dz = C.z - C.sz, la0 = dx * n0[0] + dz * n0[1], lo0 = dx * t0[0] + dz * t0[1], la = Math.sign(la0 || 1) * Math.min(Math.abs(la0), C.hw[0] - 2.2), sg = Math.sign(lo0 || 1), P = k => { const lo = lo0 + sg * (2 + 0.8 * k); return [C.sx + n0[0] * la + t0[0] * lo, C.sz + n0[1] * la + t0[1] * lo]; };
        const st = () => ev(d9 => { const K = SM_TOWN.kit; K.sec(); const e = document.getElementById('toast'), on = e && +getComputedStyle(e).opacity > 0.05 && getComputedStyle(e).display !== 'none'; return { red: K.st().n.redD === d9, toast: on ? (e.textContent || '').trim() : '' }; }, C.day);
        const step = async (k, t) => { const q = P(k); await ev(t9 => SM_TOWN.setSigT(t9), t); await T.tp(q[0], q[1], q[0] + t0[0] * sg * 5, q[1] + t0[1] * sg * 5); await ev(() => { SM_TOWN.kit.sec(); }); await W8(450); await ev(t9 => SM_TOWN.setSigT(t9), t); await W8(350); return st(); };
        console.log('    건널목 ' + C.n + ' (' + C.x.toFixed(1) + ', ' + C.z.toFixed(1) + ') · 신호 ' + C.li + ' · 첫째 길 초록 t=' + C.tG + ' · 빨강 t=' + C.tR);
        let A = await step(0, C.tG); A = await step(0, C.tG); ok(!A.red && !/빨간불/.test(A.toast), '막 온 첫 자리(가는 쪽을 아직 못 잼) = 「빨간불이에요」 X — 둘째 길은 빨강(' + JSON.stringify(A) + ')');
        A = await step(1, C.tG); A = await step(2, C.tG); ok(!A.red && !/빨간불/.test(A.toast), '첫째 길을 따라 초록불에 가는 동안 = 「빨간불이에요」 X(예전에는 둘째 길 빨강을 읽어 떴음 · ' + JSON.stringify(A) + ')');
        let R = await step(3, C.tR); for (let i = 0; i < 8 && !R.red; i++) { await ev(t9 => SM_TOWN.setSigT(t9), C.tR); await W8(400); R = await st(); }
        ok(R.red, '가는 쪽 신호가 빨강이 되면 「빨간불이에요」(' + JSON.stringify(R) + ')'); await T.shot('g9_red'); }
      await ev(() => { SM_TOWN.kit.force(null); }); await T.ctx.close(); }

    // ───────── g3 첫 이야기 동안 미루는 알림 ─────────
    if (want('g3')) { console.log('g3 첫 이야기 동안 — 다른 곳으로 부르는 알림을 미룸 · 이야기가 끝나면 다시 뜸');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyAt('p0', 1); }); await W8(1500); await T.closeDlg(); await T.shut();
      const HN = ['bud', 'worm', 'snail', 'ant', 'moth', 'seed', 'recycle', 'shadow', 'cat', 'cricket', 'frog', 'smoth', 'drip', 'icep', 'box', 'board'];
      const H = await ev(hn => { const K = SM_TOWN.kit, can = K.can(), o = []; for (const n of Object.keys(can)) for (const id of K.today(n)) if (hn.includes(id) && o.length < 5 && !o.some(q => q.id === id)) { const sp = K.spot(n, id); if (sp && sp.e) o.push({ n, id, x: sp.e[0], z: sp.e[1] }); } return { o, cur: SM_TOWN.game().S.story.cur, day: SM_TOWN.game().S.day }; }, HN);
      const visit = async () => { const r = []; for (const q of H.o) { await T.tp(q.x + 0.9, q.z + 0.6, q.x, q.z); await ev(() => { SM_TOWN.kit.sec(); }); await W8(700); await T.closeDlg(); r.push(await ev(([id, d9]) => { const K = SM_TOWN.kit; K.sec(); return { id, hint: K.st().hint[id] === d9, busy: !!document.querySelector('.twn-p, .twn-dlg, .twn-play') }; }, [q.id, H.day])); await W8(300); } return r; };
      console.log('    이야기 ' + H.cur + ' · 힌트 줄 후보 ' + H.o.map(q => q.n + ' ' + q.id).join(' · '));
      if (H.cur !== 'p0' || H.o.length < 2) ok(false, '첫 이야기(p0) 가운데가 아니거나 힌트 줄 후보가 모자람');
      else { const A = await visit(), cur2 = await ev(() => SM_TOWN.game().S.story.cur); console.log('    조용한 때 ' + JSON.stringify(A));
        ok(cur2 === 'p0' && A.every(q => !q.hint), '첫 이야기 동안 칸 힌트 알림 ' + A.filter(q => q.hint).length + '개(그날 표시도 X)');
        await ev(() => { SM_TOWN.game().S.min = 18 * 60; }); await W8(2600); await T.shut();
        const n1 = await ev(() => { const G = SM_TOWN.game(); return [(G.S.night || {}).said === G.S.day, G.S.story.cur]; }); ok(!n1[0] && n1[1] === 'p0', '첫 이야기 동안 「오늘 밤 열리는 것」 알림 X(표시도 X)');
        await ev(() => { SM_TOWN.storyOff(); }); let n2 = false; for (let i = 0; i < 20 && !n2; i++) { await W8(400); await T.shut(); n2 = await ev(() => { const G = SM_TOWN.game(); return (G.S.night || {}).said === G.S.day; }); }
        ok(n2, '이야기가 끝나면 같은 저녁에 「오늘 밤 열리는 것」이 뜸');
        await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); await W8(1800); await T.shut();
        const B = await visit(); console.log('    끝난 뒤 ' + JSON.stringify(B)); ok(B.some(q => q.hint), '이야기가 끝난 뒤 다시 지나가면 칸 힌트가 뜸(' + B.filter(q => q.hint).map(q => q.id).join(' · ') + ')'); }
      await T.ctx.close(); }

    // ───────── sit 앉은 글 ─────────
    if (want('sit')) { console.log('sit 앉은 글 — 앉은 곳 이름으로(그네 = 「그네에 앉았어요」)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyOff(); }); await W8(1200); await T.shut();
      for (const [re, w9, nm] of [['그네 타기', /그네에 앉았어요/, '그네'], ['벤치에 앉기', /벤치에 앉았어요/, '마을 벤치']]) { const h = await ev(r9 => { const H = SD2.map.interact.list().find(q => q.kind === 'sit' && q.sat && !q.off && new RegExp(r9).test(q.label || '')); return H ? [H.x, H.z] : null; }, re);   /* 마을이 세운 자리만(학교 안 벤치·의자는 학교 엔진 글 그대로) */
        if (!h) { ok(false, nm + ' 지점이 없음'); continue; }
        await T.tp(h[0], h[1]); await W8(1000); await p.keyboard.press('KeyE'); await W8(700); const t = await texts(ev); console.log('    ' + nm + ' → 「' + t.toast + '」');
        ok(w9.test(t.toast) && !/의자에 앉았어요/.test(t.toast), nm + '에 앉으면 「' + t.toast.slice(0, 22) + '」'); await p.keyboard.press('KeyE'); await W8(800); }
      await T.ctx.close(); }

    // ───────── g11 환영 창 · 쪽지 창 ─────────
    if (want('g11')) { console.log('g11 환영 창 펼침 = 한 화면 · 쪽지 ▼ 옆 누를 키 · 밤에 온 낮 일 쪽지 이름표');
      const T = await fresh(), { ev, W8, p } = T;
      const m = await ev(() => { const P = document.querySelector('.twn-p'), D = P && P.querySelector('details.cgd'); if (!D) return null; D.open = true; const r = e => { const q = e.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.bottom)]; }, last = D.lastElementChild, x9 = P.querySelector('[data-a="x"]');
        const sc = [...P.querySelectorAll('*')].concat([P]).filter(e => e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY)).map(e => (e.className || e.tagName) + ' ' + e.scrollHeight + '/' + e.clientHeight);
        return { last: r(last), row: r(x9.parentElement), p: r(P), vh: innerHeight, btn: (x9.textContent || '').trim(), sc }; });
      if (!m) ok(false, '환영 창(단축키 더 보기)이 없음');
      else { console.log('    ' + JSON.stringify(m)); await W8(300); await T.shot('g11_welcome_open');
        ok(!m.sc.length, '단축키를 펼쳐도 창 안 스크롤 없음(' + (m.sc.join(' · ') || '없음') + ')');
        ok(m.last[1] <= m.row[0] + 1 && m.p[1] <= m.vh, '맨 아래 줄(아래 ' + m.last[1] + ')이 단추 줄(위 ' + m.row[0] + ') 위 · 창 아래 ' + m.p[1] + ' ≤ ' + m.vh);
        ok(/처음부터 시작하기/.test(m.btn), '첫 화면 단추 「' + m.btn + '」'); }
      await T.start(); await T.shut();
      const rd = () => ev(() => { const D = document.querySelector('.twn-dlg'); if (!D) return null; const q = s => { const e = D.querySelector(s); return e ? (e.textContent || '').trim() : ''; }, mo = D.querySelector('.more'), tx = D.querySelector('.tx'); return { cap: q('.cap'), more: q('.more'), moreTop: mo ? Math.round(mo.getBoundingClientRect().top) : -1, txBot: tx ? Math.round(tx.getBoundingClientRect().bottom) : -1 }; });
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); SM_TOWN.storyAt('a1_3', 0); }); await W8(3200);   /* storyAt은 시험 바로 가기라 낮 일 장이면 시각을 아침으로 되돌림 → 밤은 아래에서 다시 열어 봄 */
      for (const [nm, min, w9] of [['밤 21시', 21 * 60, true], ['낮 11시', 11 * 60, false]]) { await p.keyboard.press('Escape'); await W8(600); await ev(mm => { SM_TOWN.game().S.min = mm; }, min); await W8(300); await ev(() => { SM_TOWN.storyOpen(); }); await W8(1800);
        const d = await rd(); console.log('    ' + nm + ' ' + JSON.stringify(d)); if (!d) { ok(false, nm + ': 쪽지 창이 안 열림'); continue; }
        if (w9) { await T.shot('g11_note_night'); ok(/E = 다음/.test(d.more) && d.moreTop >= d.txBot, '쪽지 ▼ 옆에 누를 키 「' + d.more + '」 · 글과 안 겹침(▼ 위 ' + d.moreTop + ' ≥ 글 아래 ' + d.txBot + ')'); }
        ok(/내일 아침에 해요/.test(d.cap) === w9, nm + ' 쪽지 이름표 「' + d.cap + '」' + (w9 ? ' — 내일 아침에 한다는 말이 붙음' : ' — 낮에는 안 붙음')); }
      await T.ctx.close(); }

    console.log('페이지 오류 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs.slice(0, 4)) : '')); ok(errs.length === 0, '페이지 오류 0');
  } catch (e) { console.log('  ✗ 하네스 예외: ' + (e && e.stack || e)); fails++; }
  await b.close(); void texts; console.log(fails ? '\n✗ 실패 ' + fails : '\n✓ PATH-1B 통과'); process.exit(fails ? 1 : 0);
})();
