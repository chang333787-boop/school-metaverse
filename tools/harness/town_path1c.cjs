// 🧭 처음 15분 길 — 2차 평가 뒤 고침(PATH-1C · 11-14 평가 R2A '읽는 아이' · R2B '안 읽는 아이' 1366×768): node tools/harness/town_path1c.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=a,n]
//   a 학교 안에서 켠 길 안내(이야기 112 동안 J → 칸 → 길 안내) = 위 줄 '…까지 N m'가 걸음에 맞춰 바뀜 · 도착하면 지워짐
//   n 첫 쪽지 전 칩 '📋 칠판 쪽지' = '현관 칠판까지 N m'가 걸음에 맞춰 바뀜 · 도착하면 첫 할 일 한 줄로 돌아옴
//   o 첫 쪽지 전 칠판 둘레(앞·뒤·옆 · 화분·문 사이)에 서면 E = '📋 쪽지 읽기'가 먼저 · E → 첫 쪽지 · 읽은 뒤 쪽지 지점은 제자리
//   q 대화를 E로 넘기다 마지막 E 바로 뒤(0.4초 안)의 E는 곁 지점(우리 집 문)으로 가지 않음 · 조금 뒤 E는 그대로 들어감
//   b 여러 쪽 대화의 'E = 다음 ▼'가 쪽이 시작될 때부터 켜져 있음(글이 찍히는 동안에도) · 마지막 쪽 + 고르기에서는 꺼짐
//   r 이야기 창이 곧 뜰 참(다음 장이 곧 시작 · 쪽지 창이 닫혀 있음)에는 한 줄 안내('I = 가방')를 띄우지 않음 · 쪽지를 읽은 뒤 뜨고 그때 I = 가방
//   s 둘째 날 아침 엽서: 이야기 쪽지 창이 곧 뜰 참에는 안 뜸(쪽지가 엽서를 덮어 지웠음) → 쪽지를 읽은 뒤 뜸 · 뜨자마자 다른 대화가 덮으면 닫힌 뒤 다시 뜸 · [길 안내] = 빨간 선(대화 X)
//   c 건널목 「빨간불이에요」가 떠 있는 동안 그 신호가 초록으로 바뀌면 글이 내려감(글과 등이 같게) · 아직 빨강이면 그대로 · 다른 글은 건드리지 않음
//   d 먼 목표 표시(❗): 안개 끝보다 먼 곳에서도 노란 느낌표 그대로(안개가 하늘빛으로 덮어 '옅은 하늘색 풍선'으로 보였음) · --shots면 화면 색도 셈
//   u 이웃 집 안(물 주기 부탁): 문에서 이웃에게 곧장 걸어가 곁에 서면 부탁 E가 뜸(반지름이 이웃 몸까지) · 인사 말 = E 글과 같은 말 · 부탁 E 자리·다른 E는 그대로
//   i 자정에 저절로 잔 뒤의 하루 마무리 창: 첫 줄에 까닭 글(1.8초 배너를 못 본 아이도 왜 하루가 끝났는지 앎) · 스스로 잔 날은 그대로
//   j 「왔어요」: 그 곳에 닿았어도 찻길(횡단보도) 위에 있는 동안은 미룸 · 인도로 올라서면 바로 · 길어도 5초(도착 반지름은 그대로)
//   h 지도 조각 창이 새 친구 말 뒤 저절로 뜬 참에 왼쪽 작은 조각을 누르면 그 누름이 '창 바깥 누르기'가 되어 막 뜬 창을 닫던 것 → 창 그대로 · 다른 바깥·Esc는 그대로 닫힘
//   k 가방 탭을 바꾸면 내용 높이만큼 창이 다시 가운데로 가서 탭 단추가 50px쯤 내려앉던 것 → 가방 창은 위쪽 자리를 못박음(탭 줄 제자리)
//   p 꽃에 물을 준 뒤 새 친구가 말풍선으로 말하는 동안(그 말 뒤에 이야기 창이 뜸) = 내 발밑 회색 한 줄 '💬 새 친구와 이야기하는 중이에요'가 곁의 E(🗺 마을 지도 판 · 도서관 문)를 가림(친구에게 말 걸려던 E가 지도 판을 열고 도서관으로 들어갔음) · 창이 뜨면 풀림 · ✕로 닫은 뒤에는 안 켜짐
//   w 이야기 112: 할 일 줄 = 「위 줄의 방위·거리를 보고」(멀리서 안 보이는 '파란 빛기둥 쪽에서' X) · 112 창 글 = 「지도의 빨간 점이 가야 할 곳」(그 창 지도에 실제로 빨간 점)
//   m 우리 집 안에서 문 쪽 벽에 등을 대도(S로 물러남) 화면이 천장·벽 색으로 꽉 차지 않음(카메라가 위를 보지 않음) · 'E 밖으로 나가기'가 뜸 · 문 쪽을 보면 '🚪 밖으로' 팻말
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
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!OUT || !RENDER) return; await p.screenshot({ path: OUT + '/' + n + '.jpg', type: 'jpeg', quality: 72 }); console.log('    📷 ' + OUT + '/' + n + '.jpg'); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.emerg && SM_TOWN.emerg(), null, { timeout: 240000 }); await W8(1500);
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); } };
    const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { if (document.querySelector('.twn-dlg')) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
    const hot = async re => { for (let i = 0; i < 24; i++) { const h = await ev(r9 => { const H = SD2.map.interact.list().find(q => new RegExp(r9).test(q.label || '')); return H ? [H.x, H.z] : null; }, re); if (h) return h; await W8(300); } return null; };
    const start = async () => { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2200); };
    const goal = () => ev(() => { const g = document.getElementById('hudGoal'); return g && g.style.display !== 'none' ? (g.textContent || '') : ''; });
    const me = () => ev(() => { const q = SD2.map.player.pos(); return [q.x, q.z]; });
    return { ctx, p, ev, W8, shot, tp, closeDlg, shut, hot, start, goal, me }; };
  const num = t => { const m = /까지 ([\d.]+) ?(k?m)/.exec(t || ''); return m ? +m[1] * (m[2] === 'km' ? 1000 : 1) : -1; };
  // 이야기 112(1-1 둘째 단계)를 열고 사건이 생길 때까지
  const open112 = async T => { await T.ev(() => SM_TOWN.storyAt('a1_1', 2)); await T.W8(1500); await T.shut(); let E = null; for (let i = 0; i < 40 && !E; i++) { E = await T.ev(() => SM_TOWN.emerg().info().ev); if (!E) await T.W8(500); } await T.shut(); await T.W8(600); return E; };
  try {
    // ───────── a 학교 안에서 켠 길 안내의 거리 숫자 ─────────
    if (want('a')) { console.log('a 학교 안에서 켠 길 안내 — 위 줄 숫자가 걸음에 맞춰 바뀜');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      const E = await open112(T); if (!E) ok(false, '112 사건이 안 열림');
      else { await T.tp(5, 30); await W8(1500);   /* 운동장 안 — 학교 길 그물(SNAV)을 아직 안 받은 첫 길 안내 */
        await p.keyboard.press('KeyJ'); await W8(900);
        const c9 = await ev(() => { const L = [...document.querySelectorAll('.twn-p [data-cell]')], e = L.find(q => q.dataset.cell === '다6') || L[0]; if (!e) return null; e.click(); return e.dataset.cell; }); await W8(700);
        await p.keyboard.press('Enter'); await W8(3200);   /* 길 안내 = Enter · 그물을 받고 선을 다시 그릴 틈 */
        const g0 = await T.goal(), r0 = await ev(() => SM_TOWN.routeChal()), m0 = await T.me(); console.log('    칸 ' + c9 + ' · 켠 뒤 「' + g0 + '」 · ' + JSON.stringify(r0));
        ok(r0 && r0.trail && r0.live, '학교 안에서 켠 길 안내 = 선이 다시 그려진 뒤에도 남은 거리 고침이 이어짐(live)'); ok(num(g0) > 0, '위 줄에 남은 거리(' + num(g0) + ' m)');
        const seen = [num(g0)]; if (r0 && r0.to) for (let i = 1; i <= 5; i++) { const f = i / 6; await T.tp(m0[0] + (r0.to[0] - m0[0]) * f, m0[1] + (r0.to[1] - m0[1]) * f); await W8(1100); seen.push(num(await T.goal())); }
        console.log('    걸음마다 ' + seen.join(' → ') + ' m'); ok(new Set(seen).size >= 4 && seen[seen.length - 1] < seen[0] && seen.every(v => v >= 0), '걸음에 맞춰 숫자가 바뀜(' + new Set(seen).size + '가지 · 끝 ' + seen[seen.length - 1] + ' < 처음 ' + seen[0] + ')');
        if (r0 && r0.to) { await T.tp(r0.to[0] + 2, r0.to[1] + 2); await W8(1300); const g1 = await T.goal(); ok(/왔어요/.test(g1), '도착 = 「' + g1 + '」'); await W8(3600); const g2 = await T.goal(), r2 = await ev(() => SM_TOWN.routeChal()); ok(num(g2) < 0 && !(r2 && r2.live), '도착 뒤 숫자 글이 지워짐(「' + g2.slice(0, 40) + '」)'); } }
      await T.ctx.close(); }

    // ───────── n 첫 쪽지 전 칩 '칠판 쪽지' ─────────
    if (want('n')) { console.log('n 첫 쪽지 전 칩 「📋 칠판 쪽지」 — 숫자가 걸음에 맞춰 바뀜');
      const T = await fresh(), { ev, W8 } = T; await T.start();
      const bd = await ev(() => { const a = SM_TOWN.news().at; return a && a.board; }), m0 = await T.me(); console.log('    칠판 ' + JSON.stringify(bd && bd.map(v => Math.round(v))) + ' · 나 ' + JSON.stringify(m0.map(v => Math.round(v))));
      /* 칠판에서 멀리(14 m 넘게) = 도움 쪽지 알림 + 칩 */
      let chip = false; for (const d of [[60, 0], [0, 60], [-60, 0], [0, -60]]) { await T.tp(m0[0] + d[0], m0[1] + d[1]); await W8(1600); chip = await ev(() => [...document.querySelectorAll('.gchip')].some(e => /칠판 쪽지/.test(e.textContent))); if (chip) break; }
      ok(chip, '칠판에서 멀어지면 칩 「📋 칠판 쪽지」');
      await ev(() => { const e = [...document.querySelectorAll('.gchip')].find(q => /칠판 쪽지/.test(q.textContent)); if (e) e.click(); }); await W8(900);
      const g0 = await T.goal(), r0 = await ev(() => SM_TOWN.routeChal()), m1 = await T.me(); console.log('    칩 누름 「' + g0 + '」'); ok(/현관 칠판까지/.test(g0) && r0 && r0.live, '칩 = 위 줄 「현관 칠판까지 N m」');
      const seen = [num(g0)]; if (r0 && r0.to) for (let i = 1; i <= 4; i++) { const f = i / 5; await T.tp(m1[0] + (r0.to[0] - m1[0]) * f, m1[1] + (r0.to[1] - m1[1]) * f); await W8(1100); seen.push(num(await T.goal())); }
      console.log('    걸음마다 ' + seen.join(' → ') + ' m'); ok(new Set(seen).size >= 3 && seen[seen.length - 1] < seen[0] && seen.every(v => v >= 0), '첫 쪽지 전에도 걸음에 맞춰 숫자가 바뀜(' + seen.join(' → ') + ')');
      if (r0 && r0.to) { await T.tp(r0.to[0] + 1.5, r0.to[1] + 1.5); await W8(900); const g1 = await T.goal(); ok(/칠판 앞에서/.test(g1), '도착 = 「' + g1 + '」'); await W8(3200); const g2 = await T.goal(), r2 = await ev(() => SM_TOWN.routeChal()); ok(/칠판에 쪽지가 붙어 있어요/.test(g2) && !r2, '도착 뒤 = 첫 할 일 한 줄로 돌아옴(「' + g2.slice(0, 30) + '…」 · 선 꺼짐)'); }
      await T.ctx.close(); }
    // ───────── m 우리 집 안 — 문 쪽 벽에 등을 대도 방이 보임 ─────────
    if (want('m')) { console.log('m 우리 집 안 — 문 쪽으로 물러나도 화면이 벽·천장으로 꽉 차지 않음');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      const mi = await ev(() => SM_TOWN.indoor.census().findIndex(b9 => b9.mine)); ok(mi >= 0, '우리 집이 있음(i=' + mi + ')');
      if (mi >= 0) { await ev(i => SM_TOWN.indoor.enterI(i), mi); await W8(3500); await T.shut();
        const st = () => ev(() => { const e = SD2.camera.matrixWorld.elements, q = SD2.map.player.pos(), c = SD2.camera.position, h = SD2.hotNow && SD2.hotNow(); return { up: +(-e[9]).toFixed(2), d: +Math.hypot(c.x - q.x, c.z - q.z).toFixed(2), hot: h ? (h.label || '') : '', on: !!SM_TOWN.indoor.on }; });
        const s0 = await st(); ok(s0.on, '우리 집 안에 들어옴'); await T.shot('m1_in');
        await p.keyboard.down('KeyS'); await W8(2500); await p.keyboard.up('KeyS'); await W8(1200);
        const s1 = await st(); console.log('    물러난 뒤 ' + JSON.stringify(s1)); await T.shot('m2_back');
        ok(s1.up < 0.2, '문 쪽 벽에 등을 대도 카메라가 위(천장·하늘)를 보지 않음(시선 위쪽 ' + s1.up + ' — 고치기 전 0.9쯤)');
        ok(/밖으로 나가기/.test(s1.hot), '그 자리에서 「E ' + s1.hot + '」');
        const ex = await ev(() => { const H = SD2.map.interact.list().find(q => /밖으로 나가기/.test(q.label || '')); return H ? [H.x, H.y, H.z] : null; });
        if (ex) { await ev(e => { SD2.map.player.teleport([e[0], e[1] + 0.05, e[2] - 3]); SD2.map.player.lookAt([e[0], e[2] + 60]); }, ex); await W8(1300); const s2 = await st(); await T.shot('m3_door'); ok(s2.up < 0.2 && s2.d > 1.5, '방 가운데에서 문 쪽을 보면 카메라가 예전 그대로(거리 ' + s2.d + ' m · 위쪽 ' + s2.up + ')'); } }
      await T.ctx.close(); }
    // ───────── o 첫 쪽지 전 칠판 둘레 E ─────────
    if (want('o')) { console.log('o 첫 쪽지 전 — 칠판 둘레 어디서나 E = 쪽지 읽기');
      const T = await fresh(), { ev, W8, p } = T; await T.start();
      const D = await ev(() => SM_TOWN.homeDbg()), g0 = await T.goal(); ok(D && D.board && /칠판에 쪽지/.test(g0), '첫 쪽지 전 위 줄 「' + g0.slice(0, 34) + '」');
      if (D && D.board) { const [bx, bz] = D.board, H0 = await ev(() => { const h = SD2.map.interact.list().find(q => /쪽지 읽기/.test(q.label || '')); return h ? [h.x, h.z, h.r] : null; });
        const others = await ev(([bx, bz]) => SD2.map.interact.list().filter(q => !q.off && !/쪽지 읽기/.test(q.label || '') && Math.hypot(q.x - bx, q.z - bz) < 6).map(q => [q.x, q.z, q.label, q.r]), [bx, bz]);
        console.log('    칠판 ' + [bx, bz].map(v => v.toFixed(1)) + ' · 쪽지 지점 ' + JSON.stringify(H0 && H0.map(v => +v.toFixed(1))) + ' · 둘레 지점 ' + others.map(o => o[2] + '@' + Math.hypot(o[0] - bx, o[1] - bz).toFixed(1)).join(' · '));
        /* 설 자리: 칠판 둘레 여덟 방향 1.6m + 둘레 지점(화분·문)과 칠판 사이 */
        const pts = []; for (let a = 0; a < 8; a++) pts.push([bx + Math.cos(a * 0.7854) * 1.6, bz + Math.sin(a * 0.7854) * 1.6, '둘레 ' + a * 45 + '°']);
        for (const o of others) { const d = Math.hypot(o[0] - bx, o[1] - bz); if (d < 0.5) continue; const f = Math.min(1, 2.6 / d); pts.push([bx + (o[0] - bx) * f, bz + (o[1] - bz) * f, o[2] + ' 쪽']); }
        let n = 0, bad = []; for (const q of pts) { const free = await ev(([x, z]) => { const M = SD2.map, y = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); return !M.q.blocked(x, z, y + 0.05); }, q); if (!free) continue; await T.tp(q[0], q[1], bx, bz); await W8(750); const h = await ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? (h9.label || '') : ''; }); n++; if (!/쪽지 읽기/.test(h)) bad.push(q[2] + ' → 「' + h + '」'); }
        ok(n >= 5 && !bad.length, '칠판 둘레 ' + n + '곳(앞·뒤·옆 · 화분·문 사이)에서 E = 쪽지 읽기' + (bad.length ? ' — 어긋남 ' + bad.join(' / ') : ''));
        await T.shot('o1_board');
        await p.keyboard.press('KeyE'); await W8(900); const dlg = await ev(() => { const d = document.querySelector('.twn-dlg'); return d ? (d.textContent || '').slice(0, 40) : ''; }); ok(!!dlg, 'E → 첫 쪽지가 열림(「' + dlg.slice(0, 24) + '…」)');
        await T.closeDlg(); await T.shut(); await W8(900);
        const H1 = await ev(([x, z]) => { const h = SD2.map.interact.list().find(q => /^📋/.test(q.label || '') && Math.abs(Math.hypot(q.x - x, q.z - z) - 0.7) < 0.05); return h ? [h.label, h.r] : null; }, [bx, bz]);
        ok(!!H1 && Math.abs(H1[1] - 1.5) < 0.01, '읽은 뒤 쪽지 지점이 제자리(칠판 앞 0.7m)·제 크기로(' + JSON.stringify(H1) + ')'); }
      await T.ctx.close(); }
    // ───────── q 대화를 E로 닫은 바로 뒤의 E ─────────
    if (want('q')) { console.log('q 대화를 E로 넘긴 바로 뒤의 E는 집 문으로 가지 않음');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await ev(() => SM_TOWN.storyAt('p0', 1)); await W8(2600); await T.shut();
      const dr = await T.hot('들어가기 — 우리 집'); ok(!!dr, '우리 집 문 지점이 있음');
      if (dr) { let at = null; for (const d of [[0, -1.8], [0.9, -1.9], [-0.9, -1.9], [0, -2.6], [0, 1.8]]) { const x = dr[0] + d[0], z = dr[1] + d[1]; await T.tp(x, z, dr[0], dr[1]); await W8(700); const h = await ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? (h9.label || '') : ''; }); if (/들어가기/.test(h)) { at = [x, z, h]; break; } }
        ok(!!at, '문 앞에 서면 「E ' + (at ? at[2] : '?') + '」');
        if (at) { await ev(() => { void SM_TOWN.dialog({ who: '이웃', icon: '🙂', text: ['첫째 쪽이에요.', '둘째 쪽이에요.'] }); }); await W8(300);
          let n = 0; for (; n < 14 && await ev(() => !!document.querySelector('.twn-dlg')); n++) { await p.keyboard.press('KeyE'); await W8(110); }
          await p.keyboard.press('KeyE');   /* 대화가 닫힌 바로 뒤(0.4초 안)의 E */ await W8(1500);
          const in1 = await ev(() => !!SM_TOWN.indoor.on); ok(n >= 2 && !in1, '대화를 E ' + n + '번으로 넘긴 바로 뒤의 E = 집 안에 들어가지 않음');
          const h1 = await ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? (h9.label || '') : ''; }); ok(/들어가기/.test(h1), '그 뒤에도 「E ' + h1 + '」는 그대로');
          await p.keyboard.press('KeyE'); await W8(3200); const in2 = await ev(() => !!SM_TOWN.indoor.on); ok(in2, '조금 뒤(1.5초)의 E = 우리 집 안으로 들어감'); } }
      await T.ctx.close(); }
    // ───────── b 'E = 다음 ▼'가 쪽마다 처음부터 ─────────
    if (want('b')) { console.log("b 여러 쪽 대화 — 'E = 다음 ▼'가 쪽이 시작될 때부터");
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await ev(() => SM_TOWN.storyAt('p0', 1)); await W8(2600); await T.shut();
      const P9 = ['첫째 쪽이에요. 여기에는 조금 긴 글을 적어 두었어요. 천천히 찍혀요.', '둘째 쪽이에요. 여기에도 조금 긴 글을 적어 두었어요. 천천히 찍혀요.', '셋째 쪽이에요. 마지막 쪽에는 고를 것이 있어요. 천천히 찍혀요.'];
      await ev(P => { void SM_TOWN.dialog({ who: '이웃', icon: '🙂', text: P, choices: [['ok', '알겠어요!'], ['later', '나중에']] }); }, P9);
      const st = () => ev(() => { const d = document.querySelector('.twn-dlg'); return d ? { n: (d.querySelector('.tx').textContent || '').length, t: (d.querySelector('.tx').textContent || '').slice(0, 4), more: d.querySelector('.more').classList.contains('on'), txt: d.querySelector('.more').textContent, ch: d.querySelectorAll('.ch button').length } : null; });
      await W8(200); const a1 = await st(); ok(a1 && a1.n < P9[0].length && a1.more && /E = 다음/.test(a1.txt), '1쪽 글이 찍히는 동안 「' + (a1 ? a1.txt.trim() : '') + '」가 보임(' + (a1 ? a1.n : '?') + '/' + P9[0].length + '자)');
      await p.keyboard.press('KeyE'); await W8(80); await p.keyboard.press('KeyE'); await W8(200);
      const a2 = await st(); ok(a2 && /^둘째/.test(a2.t) && a2.n < P9[1].length && a2.more, '빨리 넘긴 2쪽 — 글이 찍히는 동안에도 「E = 다음 ▼」(' + (a2 ? a2.n : '?') + '/' + P9[1].length + '자 · 고치기 전 = 다 찍힌 뒤에만)');
      await p.keyboard.press('KeyE'); await W8(80); await p.keyboard.press('KeyE'); await W8(200);
      const a3 = await st(); ok(a3 && /^셋째/.test(a3.t) && !a3.more, '마지막 쪽(고르기) — 찍히는 동안 「E = 다음」 X');
      await p.keyboard.press('KeyE'); await W8(200); const a4 = await st(); ok(a4 && a4.ch === 2 && !a4.more, '다 찍히면 고르기 단추 둘(「E = 다음」 X)');
      await p.keyboard.press('KeyE'); await W8(500); ok(!(await st()), 'E = 첫 고르기로 닫힘');
      await T.ctx.close(); }
    // ───────── r 이야기 창이 곧 뜰 참에는 한 줄 안내 X ─────────
    if (want('r')) { console.log("r 첫 장 끝 → 다음 장 쪽지 — 그 사이 한 줄 안내('I = 가방') X · 쪽지 뒤에 뜨고 I = 가방");
      const T = await fresh(), { ev, W8, p } = T; await T.start();
      await ev(() => SM_TOWN.storyAt('p0', 3)); for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); i++) await W8(300);
      await ev(nm => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')], b9 = L9.find(q => q.textContent.includes(nm)) || L9[0]; if (b9) b9.click(); }, '놀이터'); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p [data-card]'); if (b9) b9.click(); }); await W8(2600);
      const Tg = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z, door: t.door || null }; }), s0 = await ev(() => SM_TOWN.story().step); ok(!!Tg && s0 && s0.id === 'show', '첫 장 끝 단계(데려가기)까지 옴');
      if (Tg) { const D = Tg.door || [Tg.x, Tg.z]; await T.tp(D[0] + 1.5, D[1] + 1.5);
        const info = () => ev(() => { const t = SM_TOWN.tips.info(), s = SM_TOWN.story(); return { cur: s.cur, soon: s.soon, tip: t.on ? t.cur : '', busy: t.why.busy, q: t.q, dlg: !!document.querySelector('.twn-dlg'), cap: ((document.querySelector('.twn-dlg .name') || {}).textContent || '') }; });
        let end = 0, note = 0, tipB = 0, soonN = 0, bagQ = 0; const t0 = Date.now();
        for (let i = 0; i < 400; i++) { const I = await info(); if (!end && !I.cur) end = Date.now(); if (end && !note) { if (I.tip) tipB++; if (I.soon) soonN++; if (I.q.includes('bag')) bagQ++; if (I.dlg && I.cur) { note = Date.now(); break; } } await W8(200); }
        console.log('    장 끝 ' + ((end - t0) / 1000).toFixed(1) + '초 · 다음 장 쪽지 ' + ((note - end) / 1000).toFixed(1) + '초 뒤 · 그 사이 안내 뜸 ' + tipB + ' · 곧 뜸 ' + soonN + ' · 가방 안내 줄 섬 ' + bagQ);
        ok(end > 0 && note > 0, '첫 장이 끝나고 다음 장 쪽지가 열림'); ok(tipB === 0 && soonN > 5, '그 사이(다음 장이 곧 시작) 한 줄 안내가 뜨지 않음(안내 ' + tipB + '번 · 고치기 전 = 가방 안내가 5초쯤 뜨고 쪽지가 덮음)');
        /* 쪽지를 Esc로 닫음(= 다른 창이 덮어 닫힘) → 곧 다시 열릴 동안도 안내 X */
        await p.keyboard.press('Escape'); await W8(600); let tipC = 0, busyN = 0, re = 0; for (let i = 0; i < 150; i++) { const I = await info(); if (I.dlg) { re = 1; break; } if (I.tip) tipC++; if (I.busy && I.soon) busyN++; await W8(200); }
        ok(re === 1 && tipC === 0 && busyN > 5, '쪽지가 닫혀 있는 동안(곧 다시 열림) 안내 X(안내 ' + tipC + '번 · 미룸 ' + busyN + '번) → 쪽지가 다시 열림');
        for (let n = 0; n < 14 && await ev(() => !!document.querySelector('.twn-dlg')); n++) { await p.keyboard.press('KeyE'); await W8(260); }
        const s1 = await ev(() => SM_TOWN.story().step); console.log('    쪽지 읽은 뒤 단계 ' + JSON.stringify(s1 && [s1.id, s1.type]));
        let got = '', seen = []; for (let i = 0; i < 300 && !got; i++) { const I = await info(); if (I.tip && !seen.includes(I.tip)) seen.push(I.tip); if (I.tip === 'bag') got = 'bag'; else await W8(200); }
        console.log('    쪽지 뒤에 뜬 안내 ' + seen.join(' → ')); ok(got === 'bag', '쪽지를 읽은 뒤에 가방 안내가 뜸');
        if (got) { await T.shot('r1_tip'); await p.keyboard.press('KeyI'); await W8(900); const bag = await ev(() => { const P = document.querySelector('.twn-p'); return P ? (P.textContent || '').slice(0, 40) : ''; }), dl = await ev(() => !!document.querySelector('.twn-dlg')); ok(!!bag && !dl, '안내가 떠 있을 때 I = 가방이 열림(「' + bag.slice(0, 16).replace(/\s+/g, ' ') + '…」 · 대화 X)'); await T.shot('r2_bag'); } }
      await T.ctx.close(); }
    // ───────── s 엽서는 이야기 쪽지 뒤에 · 덮이면 다시 ─────────
    if (want('s')) { console.log('s 둘째 날 아침 엽서 — 쪽지 창이 곧 뜰 참에는 X · 쪽지 뒤에 뜸 · 대화가 덮으면 다시 · [길 안내] = 빨간 선');
      const T = await fresh(), { ev, W8, p } = T; await T.start();
      const shutP = async () => { for (let i = 0; i < 6; i++) { const n = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'p') await p.keyboard.press('Escape'); await W8(350); } };
      await ev(() => { const G = SM_TOWN.game().S, s = G.story = G.story || {}; s.done = Object.assign(s.done || {}, { p0: { d: 1 }, a1_1: { d: 1 } }); G.min = 9 * 60; });
      await ev(() => SM_TOWN.storyAt('a1_3', 0)); for (let i = 0; i < 40 && !(await ev(() => !!document.querySelector('.twn-dlg'))); i++) await W8(300);
      const cap0 = await ev(() => ((document.querySelector('.twn-dlg .name') || {}).textContent || '') + ' ' + ((document.querySelector('.twn-dlg .cap') || {}).textContent || '')); ok(await ev(() => !!document.querySelector('.twn-dlg')), '이야기 쪽지 창이 열림(「' + cap0.trim().slice(0, 24) + '」)');
      await p.keyboard.press('Escape'); await W8(500); const t0 = Date.now();
      await ev(() => { SM_TOWN.sleep({ ask: true }); return null; }); await W8(900); await shutP(); await W8(1200); await shutP();
      const d2 = await ev(() => SM_TOWN.game().S.day); ok(d2 === 2, '잠 → 2일째(' + d2 + ')');
      const info = () => ev(() => ({ pc: !!document.querySelector('.twn-pc'), soon: SM_TOWN.story().soon, dlg: !!document.querySelector('.twn-dlg'), pan: !!document.querySelector('.twn-p'), step: (SM_TOWN.story().step || {}).id || '' }));
      let pcB = 0, soonN = 0, note = 0; for (let i = 0; i < 260; i++) { const I = await info(); if (I.pan) { await shutP(); continue; } if (I.dlg) { note = Date.now(); break; } if (I.pc) pcB++; if (I.soon) soonN++; await W8(200); }
      console.log('    쪽지가 다시 열림 ' + ((note - t0) / 1000).toFixed(1) + '초 뒤 · 그 사이 엽서 ' + pcB + '번 · 곧 뜸 ' + soonN + '번');
      ok(note > 0 && pcB === 0 && soonN > 20, '쪽지 창이 곧 뜰 참에는 엽서가 안 뜸(엽서 ' + pcB + '번 · 고치기 전 = 6초 뒤에 떴다가 쪽지가 덮어 지움)');
      for (let n = 0; n < 16 && await ev(() => !!document.querySelector('.twn-dlg')); n++) { await p.keyboard.press('KeyE'); await W8(280); }
      let pc1 = 0; for (let i = 0; i < 150 && !pc1; i++) { const I = await info(); if (I.pan) { await shutP(); continue; } if (I.dlg) { await p.keyboard.press('KeyE'); await W8(280); continue; } if (I.pc) pc1 = Date.now(); else await W8(200); }
      const txt = await ev(() => { const el = document.querySelector('.twn-pc'); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 60) : ''; }); ok(pc1 > 0, '쪽지를 읽은 뒤 엽서가 뜸(「' + txt + '」)'); await T.shot('s1_card');
      if (pc1) { await W8(1500); await ev(() => { SM_TOWN.dialog({ who: '이웃', text: ['안녕! 오늘도 좋은 하루!'] }); return null; }); let gone = 0; for (let i = 0; i < 20 && !gone; i++) { if (!(await ev(() => !!document.querySelector('.twn-pc')))) gone = 1; else await W8(200); }
        for (let n = 0; n < 8 && await ev(() => !!document.querySelector('.twn-dlg')); n++) { await p.keyboard.press('KeyE'); await W8(280); }
        let pc2 = 0; const t2 = Date.now(); for (let i = 0; i < 90 && !pc2; i++) { const I = await info(); if (I.pan) { await shutP(); continue; } if (I.pc) pc2 = Date.now(); else await W8(200); }
        ok(gone === 1 && pc2 > 0, '엽서가 뜨자마자 대화가 덮으면 → 대화가 닫힌 뒤 엽서가 다시 뜸(' + ((pc2 - t2) / 1000).toFixed(1) + '초 뒤)');
        if (pc2) { const box = await ev(() => { const r = document.querySelector('.twn-pc .pc-go').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await p.mouse.click(box[0], box[1]); await W8(800);
          const R = await ev(() => ({ line: !!(SM_TOWN.routeNow && SM_TOWN.routeNow()), pc: !!document.querySelector('.twn-pc'), dlg: !!document.querySelector('.twn-dlg'), goal: (document.getElementById('hudGoal') || {}).textContent || '' }));
          ok(R.line && !R.pc && !R.dlg, '[길 안내]를 누르면 빨간 선 + 위 줄(「' + R.goal.slice(0, 26) + '」) · 대화 X · 엽서 닫힘'); await T.shot('s2_route');
          let back = 0; for (let i = 0; i < 45 && !back; i++) { if (await ev(() => !!document.querySelector('.twn-pc'))) back = 1; else await W8(200); } ok(!back, '누른 엽서는 그날 다시 안 뜸'); } }
      await T.ctx.close(); }
    // ───────── c 「빨간불이에요」 글과 보이는 신호 ─────────
    if (want('c')) { console.log('c 건널목 — 「빨간불이에요」가 떠 있는 동안 그 신호가 초록이 되면 글이 내려감(글과 등이 같게)');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyOff(); }); await W8(1200); await T.shut();
      const C = await ev(() => { const K = SM_TOWN.kit, can = K.can(), base = K.cond(); let o = null;
        for (let d = 0; d < 24 && !o; d++) { K.force({ s: base.s, rain: false, night: false, day: base.day + d }); for (const n of Object.keys(can)) { if (!can[n].includes('cross') || !K.today(n).includes('cross')) continue; const sp = K.spot(n, 'cross'), s9 = sp && sp.s9; if (!s9 || s9.gate || !s9.t || Math.abs(s9.t[0][0]) + Math.abs(s9.t[0][1]) !== 1 || s9.hw[0] < 5) continue; o = { n, d, x: sp.x, z: sp.z, sx: s9.x, sz: s9.z, t0: s9.t[0], hw: s9.hw }; break; } }
        if (!o) { K.force(null); return null; }
        const li = SM_TOWN.sig().list.findIndex(q => Math.abs(q[0] - o.sx) < 0.2 && Math.abs(q[1] - o.sz) < 0.2), at = t => { SM_TOWN.setSigT(t); return SM_TOWN.sig().list[li][3]; }, rs = [], gs = [];
        if (li < 0) return { ...o, li };
        for (let t = 0; t < 26; t += 0.5) { if (at(t) === 2 && at(t + 7) === 2) rs.push(t); if (at(t) === 0 && at(t + 3) === 0) gs.push(t); }   /* 둘째 길 쪽(첫째 길을 건너는 아이가 보는 신호) 빨강이 7초 넘게 남은 때 · 초록인 때 */
        return { ...o, li, tR: rs[0], tG: gs[0] }; });
      if (!C || C.li < 0 || C.tR == null || C.tG == null) ok(false, '신호 건널목 후보가 없음 ' + JSON.stringify(C));
      else { const t0 = C.t0, n0 = [-t0[1], t0[0]], dx = C.x - C.sx, dz = C.z - C.sz, la0 = dx * n0[0] + dz * n0[1], lo0 = dx * t0[0] + dz * t0[1], sa = Math.sign(la0 || 1), lo = lo0 + Math.sign(lo0 || 1) * 3, Q = la => [C.sx + n0[0] * sa * la + t0[0] * lo, C.sz + n0[1] * sa * la + t0[1] * lo];
        const RED = '빨간불이에요', tst = () => ev(() => { const e = document.getElementById('toast'), on = e && +getComputedStyle(e).opacity > 0.05 && getComputedStyle(e).display !== 'none'; return on ? (e.textContent || '').trim() : ''; });
        const sig = t => ev(t9 => { SM_TOWN.setSigT(t9); return null; }, t), lamp = () => ev(li => SM_TOWN.sig().list[li][3], C.li);
        /* 인도 쪽(차도 밖)에 섰다가 첫째 길 차도 안으로 3.4 m 들어섬 = 둘째 길 쪽으로 감(건너는 아이) */
        const enter = async () => { const a = Q(C.hw[0] + 0.8), b9 = Q(C.hw[0] - 2.6); await sig(C.tR); await T.tp(a[0], a[1], b9[0], b9[1]); await ev(() => { SM_TOWN.kit.sec(); return null; }); await W8(450); await sig(C.tR); await T.tp(b9[0], b9[1], C.sx, C.sz); await ev(() => { SM_TOWN.kit.sec(); return null; }); let t = ''; for (let i = 0; i < 12 && !t.includes(RED); i++) { await sig(C.tR); await W8(150); t = await tst(); } return t; };
        console.log('    건널목 ' + C.n + ' (' + C.x.toFixed(1) + ', ' + C.z.toFixed(1) + ') · 신호 ' + C.li + ' · 건너는 쪽 빨강 t=' + C.tR + ' · 초록 t=' + C.tG);
        let t1 = await enter(); ok(t1.includes(RED) && await lamp() === 2, '빨간불에 차도로 들어서면 「' + t1 + '」(그 신호 = 빨강)'); await T.shot('c1_red');
        await sig(C.tR + 1.5); await W8(1200); t1 = await tst(); ok(t1.includes(RED) && await lamp() === 2, '신호가 아직 빨강인 동안은 글이 그대로 떠 있음(1.2초 뒤 「' + t1 + '」)');
        await sig(C.tG); let off = -1; const g0 = Date.now(); for (let i = 0; i < 10 && off < 0; i++) { await W8(100); if (!(await tst()).includes(RED)) off = Date.now() - g0; }
        ok(off >= 0 && off < 700 && await lamp() === 0, '그 신호가 초록이 되면 글이 바로 내려감(' + off + ' ms · 고치기 전 = 읽을 틈 약 4초 동안 남아 「글은 빨간불 · 등은 초록」)'); await T.shot('c2_green');
        /* 다른 글이 그 자리를 차지한 뒤에는 건드리지 않음 */
        await ev(() => { SM_TOWN.kit.st().n.redD = -1; return null; }); const a = Q(C.hw[0] + 6); await T.tp(a[0], a[1]); await W8(2600);   /* 10 m 밖은 아니어도 인도 쪽으로 물러남 → 다시 들어섬 */
        t1 = await enter(); const again = t1.includes(RED); await ev(() => { SM_TOWN.read.toast('시험 글이에요', 3); return null; }); await W8(300); await sig(C.tG); await W8(700); const t2 = await tst();
        ok(again && t2.includes('시험 글'), '빨간불 글 뒤에 다른 글이 뜬 채 초록이 되면 그 글은 그대로(「' + t2 + '」)'); }
      await ev(() => { SM_TOWN.kit.force(null); return null; }); await T.ctx.close(); }
    // ───────── d 먼 목표 표시(❗)가 안개에 묻히지 않음 ─────────
    if (want('d')) { console.log('d 먼 목표 표시 — 안개 끝 너머에서도 노란 ❗ 그대로(옅은 하늘색 풍선 X)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await ev(() => SM_TOWN.storyAt('p0', 1)); await W8(2500); await T.shut(); await W8(800);
      const G = await ev(() => { const t = SM_TOWN.storyTarget(); return t ? [t.x, t.z, t.name] : null; });
      if (!G) ok(false, '이야기 목표가 없음'); else {
        const spI = () => ev(() => { let sp = null; SD2.scene.traverse(o => { if (o.isSprite && o.renderOrder === 998) sp = o; }); if (!sp) return null; const C = SD2.camera, f = SD2.scene.fog, v = sp.position.clone().project(C), hh = sp.scale.y / (2 * Math.tan(C.fov * Math.PI / 360)), H = innerHeight, W = innerWidth, cy = (1 - v.y) / 2 * H, cx = (v.x + 1) / 2 * W, ph = hh * H / 2, pw9 = ph * 0.85;
          return { vis: sp.visible, fog: sp.material.fog, far: f ? f.far : 0, d: Math.hypot(C.position.x - sp.position.x, C.position.z - sp.position.z), box: [cx - pw9, cy - ph, pw9 * 2, ph * 2], on: v.z > -1 && v.z < 1 }; });
        /* 목표에서 안개 끝보다 먼 자리(땅이 있는 쪽) */
        let I = null; for (const [dx, dz] of [[300, 0], [-300, 0], [0, 300], [0, -300], [215, 215], [-215, -215]]) { const x = G[0] + dx, z = G[1] + dz; const g9 = await ev(([x, z]) => SM_TOWN.ground(x, z), [x, z]); if (!Number.isFinite(g9)) continue; await T.tp(x, z, G[0], G[1]); await W8(1600); const q = await T.me(); if (Math.hypot(q[0] - x, q[1] - z) > 6) continue; I = await spI(); if (I && I.vis && I.on && I.d > I.far + 10) break; I = null; }
        ok(!!I, '목표(' + G[2] + ')에서 안개 끝보다 먼 자리에 섬(' + (I ? I.d.toFixed(0) + ' m · 안개 끝 ' + I.far + ' m' : '자리 없음') + ') · 표시가 화면 안에 보임');
        if (I) { ok(I.fog === false, '목표 표시 재질은 안개를 먹지 않음(fog = ' + I.fog + ')');
          if (RENDER) { /* 화면 사진에서 표시 칸의 노란 점 수(❗ 풍선 = #ffd23a) — 안개를 다시 켜면 0(고치기 전 모습) */
            const yel = async () => { const J = await spI(), c = { x: Math.max(0, Math.floor(J.box[0])), y: Math.max(0, Math.floor(J.box[1])), width: Math.ceil(J.box[2]), height: Math.ceil(J.box[3]) }; const b64 = (await p.screenshot({ type: 'png', clip: c })).toString('base64');
              return ev(async s9 => { const im = new Image(); im.src = 'data:image/png;base64,' + s9; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); const D = g.getImageData(0, 0, im.width, im.height).data; let y = 0; for (let i = 0; i < D.length; i += 4) if (D[i] > 190 && D[i + 1] > 150 && D[i + 2] < 130 && D[i] - D[i + 2] > 90) y++; return [y, D.length / 4]; }, b64); };
            const y1 = await yel(); await T.shot('d1_far'); ok(y1[0] > y1[1] * 0.2, '화면에서 표시 칸의 노란 점 ' + y1[0] + ' / ' + y1[1] + '(❗ 풍선이 노랗게 보임)');
            await ev(() => { SD2.scene.traverse(o => { if (o.isSprite && o.renderOrder === 998) { o.material.fog = true; o.material.needsUpdate = true; } }); return null; }); await W8(700); const y0 = await yel(); await T.shot('d0_fogged');
            ok(y0[0] < y1[1] * 0.02, '견줌: 안개를 다시 켜면 노란 점 ' + y0[0] + '(고치기 전 = 하늘빛으로 덮임)');
            await ev(() => { SD2.scene.traverse(o => { if (o.isSprite && o.renderOrder === 998) { o.material.fog = false; o.material.needsUpdate = true; } }); return null; }); } else console.log('    (그리기 끔 — 화면 색은 --shots=폴더로 볼 때만)'); } }
      await T.ctx.close(); }
    // ───────── u 이웃 집 안: 이웃 곁에 서면 부탁 E · 인사 말 = E 글과 같은 말 ─────────
    if (want('u')) { console.log('u 이웃 집 안(물 주기 부탁) — 문에서 이웃에게 곧장 걸어가 곁에 서면 부탁 E · 인사 말이 E 글과 같은 말');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await p.waitForFunction(() => SM_TOWN.indoor && SM_TOWN.ent, null, { timeout: 60000 });
      await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = 11 * 60; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } }); await T.shut();
      const enter = async i => { await ev(i => SM_TOWN.indoor.enterI(i), i); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); } catch (e) { return false; } await W8(350); return true; };
      const leave = async () => { await T.shut(); if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(200); };
      const homes = (await ev(() => SM_TOWN.indoor.census())).filter(q => q.cat === 'home' && q.in === 'ent' && !q.school); let done = 0, near = 0, said = '', lab = '', opened = 0, gapBad = [], stolen = [];
      for (const q of homes.slice(0, 12)) { if (done >= 3) break; if (!await enter(q.i)) continue; const id = (await ev(() => SM_TOWN.ent().info())).id; await leave();
        await ev(([id]) => { const G = SM_TOWN.game().S; G.day += 1; G.min = 10 * 60; const s9 = SM_TOWN.ent().s(), r = s9.b[id] || (s9.b[id] = { n: 0, d: -1, t: 0 }); r.pk = 'water'; r.pd = G.day; r.dd = -1; r.n = 0; r.lk = null; }, [id]);   /* 오늘 부탁 = 화분 물 주기(처음 온 집) */
        if (!await enter(q.i)) continue; const I = await ev(() => SM_TOWN.ent().info()); if (!I.plan || I.plan.kind !== 'water' || I.plan.ev || !I.owner) { await leave(); continue; } done++;
        await W8(1300); const g9 = (await ev(() => SM_TOWN.ent().dbg())).filter(l => /^greet /.test(l)).pop() || ''; said = g9.slice(6); const ask = I.extra.find(x => x.k === 'ent:ask'); lab = ask.label;
        /* 문(들어온 자리)에서 이웃에게 곧장 걸어가 0.7 m 앞에 멈춘 자리 */
        const sp = await ev(() => SM_TOWN.indoor.spawn()), o = I.owner, L = Math.hypot(sp[0] - o[0], sp[2] - o[2]) || 1, P1 = [o[0] + (sp[0] - o[0]) / L * 0.7, o[1], o[2] + (sp[2] - o[2]) / L * 0.7];
        await ev(([a, o]) => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); SD2.map.player.lookAt([o[0], o[2]]); }, [P1, o]); await W8(600);
        const h1 = await ev(() => { const h = SD2.hotNow && SD2.hotNow(); return h ? h.label : ''; }); if (/^🙋 /.test(h1)) near++; else stolen.push((h1 || '(E 없음)') + ' · 부탁 E까지 ' + Math.hypot(P1[0] - ask.at[0], P1[2] - ask.at[2]).toFixed(2) + ' m');
        if (done === 1) { await T.shot('u1_beside'); await p.keyboard.press('KeyE'); await W8(700); if (await ev(() => { const P = document.querySelector('.twn-p'); return !!P && P.dataset.k === 'ent3'; })) opened = 1; await T.shot('u2_panel'); await T.shut(); }
        /* 부탁 E 자리는 그대로(다른 E에서 2.5 m 넘게 — FIX-4E) · 다른 E 자리 한가운데서는 그 E가 그대로 이김 */
        const G9 = await ev(() => { const sp = SM_TOWN.indoor.spawn(), H = SD2.map.interact.list().filter(h => !h.off && Math.abs(h.y - sp[1]) < 2.5 && Math.hypot(h.x - sp[0], h.z - sp[2]) < 16), v = H.find(h => /^🙋 /.test(h.label)); let m = 1e9; for (const h of H) if (h !== v) m = Math.min(m, Math.hypot(h.x - v.x, h.z - v.z)); return { m: +m.toFixed(2), r: v.r, O: H.filter(h => h !== v && !/밖으로/.test(h.label)).map(h => [h.x, h.y, h.z, h.label]) }; });
        if (G9.m < 2.5) gapBad.push('간격 ' + G9.m); for (const h of G9.O.slice(0, 4)) { await ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, h); await W8(380); const l9 = await ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? h9.label : ''; }); if (l9 !== h[3]) gapBad.push(h[3] + ' 자리에서 「' + l9 + '」'); }
        await leave(); }
      ok(done >= 2, '물 주기 부탁 집 ' + done + '곳에 들어감');
      ok(/화분 물 주기/.test(said) && /화분 물 주기/.test(lab), '이웃 인사 말과 곁에서 뜨는 E 글이 같은 말(「' + said + '」 · 「' + lab + '」)');
      ok(done > 0 && near === done, '문에서 이웃에게 곧장 걸어가 곁(0.7 m)에 서면 부탁 E가 뜸 (' + near + ' / ' + done + ')' + (stolen.length ? ' — ' + stolen.join(' / ') : ''));
      ok(opened === 1, '그 자리에서 E = 부탁 판 창이 열림');
      ok(!gapBad.length, '부탁 E 자리는 그대로(다른 E에서 2.5 m 넘게) · 다른 E 한가운데서는 그 E가 이김' + (gapBad.length ? ' — ' + gapBad.slice(0, 4).join(' / ') : ''));
      await T.ctx.close(); }
    // ───────── i 자정에 저절로 잔 뒤의 하루 마무리 창 ─────────
    if (want('i')) { console.log('i 자정에 저절로 잔 뒤의 하루 마무리 창 — 첫 줄에 까닭(「밤이 깊어서 잠들었어요」) · 스스로 잔 날은 그 글 X');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      const sub = () => ev(() => { const P = document.querySelector('.twn-p'), h = P && P.querySelector('h3'); return h && /하루 마무리/.test(h.textContent) ? ((P.querySelector('.sm') || {}).textContent || '(빈 줄)') : ''; });
      const d0 = await ev(() => { const G = SM_TOWN.game().S; G.min = 24 * 60 - 1; return G.day; });   /* 자정 1분 전 → 시계가 넘어가며 저절로 잠 */
      let sm = ''; for (let i = 0; i < 70 && !sm; i++) { await W8(400); if (await ev(() => !!document.querySelector('.twn-dlg'))) await T.closeDlg(); sm = await sub(); }
      ok(/밤이 깊어서 잠들었어요/.test(sm) && /오늘 이만큼 했어요/.test(sm), '자정에 저절로 잔 뒤 — 마무리 창 첫 줄에 까닭 글(「' + sm + '」)'); await T.shot('i1_late');
      ok(await ev(d0 => SM_TOWN.game().S.day === d0 + 1, d0), '날이 하루 넘어감(저절로 잔 것)');
      await T.shut(); await W8(600); await T.shut();
      await ev(() => { SM_TOWN.game().S.min = 21 * 60; SM_TOWN.sleep({ ask: true }); });   /* 스스로 잔 날 = 잠들기 전 마무리(까닭 글 X) */
      let s2 = ''; for (let i = 0; i < 40 && !s2; i++) { await W8(300); s2 = await sub(); }
      ok(!!s2 && !/밤이 깊어서/.test(s2), '스스로 잔 날의 마무리 창에는 그 글이 없음(「' + s2 + '」)');
      await T.shut(); await W8(4500); await T.shut(); await T.ctx.close(); }
    // ───────── j 닿은 채 찻길 위에 있는 동안의 도착 글 ─────────
    if (want('j')) { console.log('j 도서관에 닿았어도 찻길(횡단보도) 위에 있는 동안은 도착 글 X · 인도로 올라서면 바로 · 서 있어도 5초쯤 뒤에는 뜸');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await ev(() => SM_TOWN.storyAt('p0', 1)); await W8(2600); await T.shut(); await W8(600);
      const tg = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z, name: t.name }; }), st = () => ev(() => { const s = SM_TOWN.story(); return s.cur + '/' + ((s.step && s.step.id) || (s.S && s.S.i)); });
      const P = await ev(([x, z]) => { const off = (a, b) => { const r = SM_TOWN.roadOff(a, b); return r ? r.d - (r.hw - (r.big ? 2.2 : 1.4)) : 99; };   /* < 0 = 차 다니는 자리 */
        let L = null, S = null; for (let r = 12.5; r >= 4 && !L; r -= 0.5) for (let k = 0; k < 64 && !L; k++) { const a = x + Math.cos(k / 64 * 6.2832) * r, b = z + Math.sin(k / 64 * 6.2832) * r; if (off(a, b) < -1.2) L = [a, b, r]; }
        if (L) { let bd = 1e9; for (let dx = -9; dx <= 9; dx += 0.5) for (let dz = -9; dz <= 9; dz += 0.5) { const a = L[0] + dx, b = L[1] + dz, o = off(a, b), d = Math.hypot(dx, dz); if (o > 0.4 && Math.hypot(a - x, b - z) < 11 && d < bd) { bd = d; S = [a, b]; } } if (!S) S = [x, z]; }   /* 인도·길 밖(문 쪽) 가운데 그 찻길 자리에서 가장 가까운 곳 */
        return { L, S }; }, [tg.x, tg.z]);
      ok(!!(P.L && P.S), '도서관 문에서 14 m 안 찻길 자리와 그 곁 인도 자리를 찾음' + (P.L ? ' (문에서 ' + P.L[2] + ' m)' : ''));
      if (P.L && P.S) { const s0 = await st(); await T.tp(P.L[0], P.L[1], tg.x, tg.z); await W8(2600); const s1 = await st(); await T.shot('j1_lane');
        ok(s1 === s0, '찻길 위에 선 2.6초 동안 도착 글 X(단계 그대로 ' + s1 + ')');
        await T.tp(P.S[0], P.S[1], tg.x, tg.z); let t1 = -1; for (let i = 0; i < 12; i++) { await W8(250); if (await st() !== s0) { t1 = (i + 1) * 0.25; break; } }
        ok(t1 > 0, '인도로 올라서면 바로 도착(' + t1 + '초 · ' + (await st()) + ')'); await T.shot('j2_side'); await T.shut();
        await T.tp(P.L[0], P.L[1], tg.x, tg.z); await ev(() => SM_TOWN.storyAt('p0', 1)); await W8(600); await T.shut(); const t0 = Date.now(); let t2 = -1; for (let i = 0; i < 48; i++) { await W8(250); if (await ev(() => !!document.querySelector('.twn-dlg, .twn-p'))) await T.shut(); if (await st() !== s0) { t2 = (Date.now() - t0) / 1000; break; } }
        ok(t2 > 3 && t2 < 11, '찻길 위에 계속 서 있어도 5초쯤 뒤에는 도착(' + t2.toFixed(1) + '초)'); }
      await T.shut(); await T.ctx.close(); }
    // ───────── h 저절로 뜬 지도 조각 창 + 작은 조각 누르기 ─────────
    if (want('h')) { console.log('h 지도 조각 창이 저절로 뜬 참에 왼쪽 작은 조각을 눌러도 창이 닫히지 않음 · 다른 바깥은 그대로 닫힘 · 닫힌 뒤 조각을 누르면 열림');
      const T = await fresh(), { p, ev, W8 } = T; await T.start(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1 }); });
      await ev(() => SM_TOWN.storyAt('a1_1', 0)); await W8(2500); for (let i = 0; i < 10 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(900); }
      const open9 = () => ev(() => !!document.querySelector('.twn-p[data-k="tmap"]')), card = () => ev(() => { const C = document.querySelector('.twn-tmap'), r = C && C.getBoundingClientRect(); return r && r.width && C.style.display !== 'none' ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height * 0.42)] : null; });
      const click = async (x, y) => { await p.mouse.move(x, y, { steps: 4 }); await W8(80); await p.mouse.down(); await W8(60); await p.mouse.up(); await W8(900); };
      let up = false; for (let i = 0; i < 50 && !up; i++) { await W8(300); if (await ev(() => !!document.querySelector('.twn-dlg'))) await p.keyboard.press('KeyE'); up = await open9(); }
      const c0 = await card(); ok(up && !!c0, '쪽지를 다 넘기면 새 친구 말 뒤에 지도 조각 창이 저절로 뜸 · 왼쪽에 작은 조각' + (c0 ? ' (' + c0 + ')' : ''));
      if (up && c0) { const at = await ev(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.className : ''; }, c0);
        await click(c0[0], c0[1]); ok(await open9(), '창이 떠 있는 참에 작은 조각 자리를 눌러도 창이 그대로(누른 곳 = ' + String(at).slice(0, 20) + ')'); await T.shot('h1_keep');
        await click(1320, 420); ok(!await open9(), '창 바깥 다른 자리를 누르면 그대로 닫힘'); await W8(400);
        const c1 = await card(); if (c1) await click(c1[0], c1[1]); ok(!!c1 && await open9(), '닫힌 뒤 작은 조각을 누르면 한 번에 열림'); await T.shot('h2_open');
        await ev(() => { const P = document.querySelector('.twn-p[data-k="tmap"] .bx'); if (P) P.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 683, clientY: 384 })); }); await p.keyboard.press('Escape'); await W8(600); ok(!await open9(), 'Esc로 닫힘(닫기는 그대로)'); }
      await T.shut(); await T.ctx.close(); }
    // ───────── k 가방 탭을 바꿔도 창이 내려앉지 않음 ─────────
    if (want('k')) { console.log('k 가방 — 탭을 바꿔도 머리·탭 줄이 제자리(처음 본 탭 자리를 그대로 눌러도 그 탭이 눌림)');
      const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.shut(); await ev(() => SM_TOWN.bagOpen('col')); await W8(700);
      const at = () => ev(() => { const P = document.querySelector('.twn-p[data-k="I"]'); if (!P) return null; const bx = P.querySelector('.bx').getBoundingClientRect(); return { top: Math.round(bx.top), bot: Math.round(bx.bottom), h: Math.round(bx.height), vh: innerHeight, tab: SM_TOWN.bag3().ui().tab, tabs: [...P.querySelectorAll('.b3-t')].map(b => { const r = b.getBoundingClientRect(); return [b.dataset.b3t, Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }) }; });
      const a0 = await at(); ok(!!a0 && a0.tab === 'col' && a0.tabs.length === 4, '가방 창이 「모은 것」 탭으로 열림' + (a0 ? ' (위 ' + a0.top + ' · 높이 ' + a0.h + ')' : '')); await T.shot('k1_col');
      if (a0) { const seen = [a0]; let hit = true; for (const [k, x, y] of [a0.tabs[0], a0.tabs[1], a0.tabs[2], a0.tabs[3], a0.tabs[0]]) { await p.mouse.move(x, y, { steps: 3 }); await W8(60); await p.mouse.down(); await W8(50); await p.mouse.up(); await W8(450); const q = await at(); if (!q || q.tab !== k) hit = false; if (q) seen.push(q); if (k === 'item') await T.shot('k2_item'); }
        ok(hit, '처음 본 탭 단추 자리를 그대로 눌러도 탭 넷이 다 눌림(단추가 손 밑에서 달아나지 않음)');
        ok(seen.every(q => Math.abs(q.top - a0.top) <= 1 && q.tabs.every((t, i) => Math.abs(t[2] - a0.tabs[i][2]) <= 1)), '탭마다 창 위쪽·탭 줄 높이가 같음(위 ' + [...new Set(seen.map(q => q.top))].join('·') + ' · 창 높이 ' + [...new Set(seen.map(q => q.h))].join('·') + ')');
        ok(seen.every(q => q.top >= 8 && q.bot <= q.vh - 8), '어느 탭에서도 창이 화면 안(아래 끝 ' + Math.max(...seen.map(q => q.bot)) + ' / ' + a0.vh + ')'); }
      await T.shut(); await T.ctx.close(); }
    if (want('p')) { console.log('p 꽃에 물을 준 뒤 새 친구가 말하는 동안 — 발밑 회색 한 줄이 곁의 E(지도 판·도서관 문)를 가림 · 이야기 창이 뜨면 풀림');
      const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut();
      const M9 = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js')), iBed = M9.CHAPTERS.find(q => q.id === 'p0').steps.findIndex(q => q.id === 'bed');
      await ev(i => SM_TOWN.storyAt('p0', i), iBed); await W8(1500); await T.closeDlg(); await T.shut();
      const st = () => ev(() => { const s = SM_TOWN.story(), L = SD2.map.interact.list(), hb = L.filter(q => /마을 지도 판|의뢰 게시판/.test(q.label || '')), cd = L.filter(q => /알아보기 —/.test(q.label || '')), bk = L.filter(q => /새 친구와 이야기하는 중/.test(q.label || '')), h = SD2.hotNow && SD2.hotNow(), P = document.querySelector('.twn-p'); return { id: s.step && s.step.id, soon: !!s.soon, hubN: hb.length, hubOff: hb.filter(q => q.off).length, cardN: cd.length, cardOff: cd.filter(q => q.off).length, bkN: bk.length, bkOn: bk.filter(q => !q.off).length, hot: h ? h.label : '', lock: !!(h && h.lock), ind: !!SM_TOWN.indoor.on, pn: P ? (P.innerText || '').replace(/\s+/g, ' ').slice(0, 44) : '' }; });
      const Hm = await T.hot('마을 지도 판'), Dr = await T.hot('들어가기 — 작은 도서관'), Tg = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z }; }), s0 = await st();
      ok(s0.id === 'bed' && !!Hm && !!Tg && s0.bkN === 1 && s0.bkOn === 0 && s0.hubOff === 0 && s0.cardOff === 0, '꽃 단계 · 발밑 줄은 꺼져 있음(꽃에서 지도 판까지 ' + (Hm && Tg ? Math.hypot(Hm[0] - Tg.x, Hm[1] - Tg.z).toFixed(1) : '?') + 'm' + (Dr && Tg ? ' · 도서관 문까지 ' + Math.hypot(Dr[0] - Tg.x, Dr[1] - Tg.z).toFixed(1) + 'm' : '') + ')');
      if (Hm && Tg) { await T.tp(Hm[0] + 0.3, Hm[1] + 0.3, Tg.x, Tg.z); await W8(700); const a = await st(); ok(/마을 지도 판/.test(a.hot) && !a.lock, '물 주기 전 지도 판 곁 = E 「' + a.hot + '」(예전 그대로)');
        await T.tp(Tg.x + 2.6, Tg.z + 0.4, Tg.x, Tg.z); await W8(700); if (await ev(() => SM_TOWN.tools.info().cur) !== 'can') { await p.keyboard.press('Digit1'); await W8(500); }
        await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); let s1 = null; for (let i = 0; i < 40; i++) { s1 = await st(); if (s1.id !== 'bed') break; await W8(200); }
        await T.tp(Hm[0] + 0.3, Hm[1] + 0.3, Tg.x, Tg.z); await W8(600); const c = await st(); await T.shot('p1_talk');
        ok(c.id === 'first' && c.soon && !c.pn, '물을 줌 → 카드 창 단계인데 창은 아직(새 친구가 말하는 중)');
        ok(/새 친구와 이야기하는 중/.test(c.hot) && c.lock && c.bkOn === 1, '지도 판 곁에 서도 아래 줄 = 「' + (c.hot || '없음') + '」(회색 줄 · E 글자 없음)');
        ok(c.hubOff === 0 && c.cardOff === 0, '다른 지점은 안 건드림(본부 판·알아보기 쉼 ' + c.hubOff + ' · ' + c.cardOff + ')');
        await p.keyboard.press('KeyE'); await W8(600); const d = await st(); ok(!d.pn && !d.ind, '거기서 E를 눌러도 「우리 마을 지도 판」이 안 열림(' + (d.pn || '창 없음') + ')');
        if (Dr && !d.pn) { await T.tp(Dr[0] + 0.2, Dr[1] + 0.2, Tg.x, Tg.z); await W8(450); const f = await st(); await p.keyboard.press('KeyE'); await W8(700); const g = await st(); ok((!!f.pn || /새 친구와 이야기하는 중/.test(f.hot)) && !g.ind, '도서관 문 앞에서도 줄 = 「' + (f.pn ? '(이야기 창이 뜸)' : f.hot || '없음') + '」 · E를 눌러도 안으로 안 들어감'); }
        let e = null; for (let i = 0; i < 80; i++) { e = await st(); if (e.pn) break; await W8(300); } await W8(400); e = await st(); await T.shot('p2_card');
        ok(!!e.pn && !/지도 판/.test(e.pn) && e.bkOn === 0 && !e.ind, '친구 말이 끝나면 이야기 창이 저절로 뜸(' + e.pn.slice(0, 22) + '…) · 발밑 줄은 꺼짐');
        await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(500); await T.tp(Hm[0] + 0.3, Hm[1] + 0.3, Tg.x, Tg.z); await W8(900); const h = await st();
        ok(!h.pn && h.id === 'first' && h.soon && h.bkOn === 0 && /마을 지도 판/.test(h.hot) && !h.lock, '창을 ✕로 닫은 뒤(20초 쉼)에는 줄이 안 켜짐 · 지도 판 곁 E = 「' + (h.hot || '없음') + '」(아이가 다른 것을 보러 갈 수 있음)'); }
      await T.ctx.close(); }
    if (want('w')) { console.log("w 이야기 112 — 할 일 줄·112 창 글이 화면에 보이는 것을 가리킴(위 줄 방위·거리 · 지도의 빨간 점)");
      const T = await fresh(), { p, ev, W8 } = T; await T.start(); await T.closeDlg(); await T.shut();
      const M9 = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js')), iLost = M9.CHAPTERS.find(q => q.id === 'a1_1').steps.findIndex(q => q.id === 'lost');
      await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1 }); });
      await ev(i => SM_TOWN.storyAt('a1_1', i), iLost); await W8(1200);
      let I = null; for (let i = 0; i < 80; i++) { I = await ev(() => { const E = SM_TOWN.emerg && SM_TOWN.emerg(); return E ? E.info() : null; }); if (I && I.ev) break; if (await ev(() => !!document.querySelector('.twn-dlg'))) await T.closeDlg(); await W8(400); }
      const e0 = I && I.ev; ok(!!(e0 && e0.k === 'lost'), '이야기 112 사건이 생김(' + (e0 ? e0.k + ' ' + e0.st : '없음') + ')');
      if (e0) { await T.closeDlg(); await W8(600); const todo = await ev(() => { const t = SM_TOWN.storyTodo(); return typeof t === 'string' ? t : JSON.stringify(t); }), g = await T.goal(), m0 = await T.me(), far = Math.hypot(e0.x - m0[0], e0.z - m0[1]);
        ok(/위 줄의 방위·거리를 보고/.test(todo) && !/빛기둥 쪽에서/.test(todo), '할 일 글 = 위 줄을 가리킴(' + String(todo).replace(/\s+/g, ' ').slice(0, 60) + ')');
        ok(/[동서남북]/.test(g) && /\d ?k?m/.test(g), '그 위 줄에 방위·거리가 실제로 떠 있음(「' + g.replace(/\s+/g, ' ').slice(0, 40) + '」 · 사건 자리까지 ' + Math.round(far) + 'm)'); await T.shot('w1_far');
        const ck = await ev(() => { const c9 = [...document.querySelectorAll('.gchip')].find(q => /지도 보기|길 잃은|새 친구/.test(q.textContent || '')); if (!c9) return ''; c9.click(); return (c9.textContent || '').slice(0, 40); }); await W8(900);   /* 칩(위 오른쪽 '… — 눌러서 지도 보기')을 누름 */
        const tx = await ev(() => { const P = document.querySelector('.twn-p'); return P ? (P.innerText || '').replace(/\s+/g, ' ') : ''; });
        ok(/지도의 빨간 점이 가야 할 곳/.test(tx) && /가까이 가면 파란 빛기둥이 보여요/.test(tx) && !/파란 빛기둥 자리를 보고/.test(tx), '칩 「' + ck + '」을 누름 → 112 창 글 = 「지도의 빨간 점이 가야 할 곳 … 가까이 가면 파란 빛기둥」(' + (tx ? tx.slice(0, 30) + '…' : '창 없음') + ')');
        const red = await ev(() => { const cv = document.querySelector('.twn-p canvas'); if (!cv) return -1; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 192) < 16 && Math.abs(d[i + 1] - 57) < 16 && Math.abs(d[i + 2] - 43) < 16) n++; return n; });
        ok(red > 20, '그 창 지도에 갈 곳이 실제로 빨간 점(빨간 픽셀 ' + red + ')'); await T.shot('w2_ask'); await T.shut(); }
      await T.ctx.close(); }
  } catch (e) { console.log('  ✗ 하네스 오류 ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); fails++; }
  if (errs.length) { console.log('  ✗ 콘솔 오류 ' + errs.length + ' — ' + errs.slice(0, 3).join(' | ')); fails++; } else console.log('  ✓ 콘솔 오류 0');
  await b.close();
  console.log(fails ? 'PATH-1C ✗ ' + fails : 'PATH-1C ✓ 통과');
  process.exit(fails ? 1 : 0);
})();
