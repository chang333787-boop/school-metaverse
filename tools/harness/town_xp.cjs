// 판 밖 탐험 땅 시험(EXPLORE-1 · town_xp.js · 설계 docs/systems/town_explore.md 차례 1·2·4): node tools/harness/town_xp.cjs [마을=ourtown] [포트=8002]
//   ① 땅: 자료 edges 둘(층층골·까망봉) · 판 땅과 높이가 이어짐(판 끝 → 들머리 0.5m마다 한 걸음 0.55m 넘게 뛰는 곳 0) · inWalk는 그대로(판 밖 = false) · 걷기 경계(arena)는 엶
//   ② 학교에서 가는 길: 장소 목록에 두 이름 · 정문 → 들머리 빨간 선 · 판 끝 길에서 빨간 선을 W로 따라 걸어 문까지(걸림 = 1초에 0.15m도 못 감 · 경계 튕김 = 0.12초에 3m 넘게 옮겨짐)
//   ③ 발굴: 삽(고리 노랑 'fos') → 빗자루 → 돋보기 → 관찰 카드 · 저장 S.xp.fos · 수첩 지층 기둥에 붙이기(틀린 띠 = 안 붙음) · 먼저·나중 물음 · 솜씨 오름
//   ④ 까망봉: 돋보기 관찰 카드 · 송이 한 알(하루 한 번) · 실험 표 water × ⚫ = sink · 분화구 가운데 → 터진 쪽으로 걸어 나오기 걸림 0
//   ⑤ 무작위 0(fos 갈래·town_xp.js에 Math.random 없음) · 지면 높이 묻기 시간(판 안 vs 탐험 땅) · 페이지 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) */
const fs = require('fs'), path = require('path');
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), pos = () => ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; }), d2 = (a, c) => Math.hypot(a[0] - c[0], (a.length > 2 ? a[2] : a[1]) - (c.length > 2 ? c[2] : c[1]));
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent : ''; });
    const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!(await panel())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panel()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, 400); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    const info = () => ev(() => SM_TOWN.tools.info()), aim = (x, z) => ev(([x9, z9]) => SM_TOWN.tools.aim(x9, z9), [x, z]);
    const settle = async () => { for (let i = 0; i < 20; i++) { if (await panel()) await closeAll(); const q = await info(); if (!q.ovl && !q.pend.length && !(await panel())) return; await W8(500); } };
    const holdK = async k => { await settle(); const q = await info(); if (q.shown !== k) { await p.keyboard.press('Digit' + (['can', 'shovel', 'rod', 'lens', 'broom'].indexOf(k) + 1)); await W8(450); } };
    const useF = async () => { await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); };
    await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.tools && SM_TOWN.xp && SM_TOWN.xp() && window.SD2 && SM_TOWN.game, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·탐험 땅이 안 뜸 — ' + errs.slice(0, 4).join(' | ')); throw e; }
    await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; if (SD2.map.time) SD2.map.time('day'); if (SM_TOWN.rules) SM_TOWN.rules.wx('clear'); });
    // ① 땅
    console.log('① 땅');
    const EG = await ev(() => SM_TOWN.xp().api.edges()); console.log('  ' + JSON.stringify(EG));
    const g = EG.find(e => e.k === 'gorge'), c = EG.find(e => e.k === 'crater'); ok(!!g && !!c, '탐험 땅 둘(층층골·까망봉)');
    const R = await ev(() => { const M = SD2.map, X9 = SM_TOWN.xp().api, out = {};
      const line = (a, b9) => { const L9 = Math.hypot(b9[0] - a[0], b9[1] - a[1]), n = Math.ceil(L9 / 0.5); let y = M.q.groundAt(a[0], a[1], 400), mx = 0, at = null; for (let k = 1; k <= n; k++) { const x = a[0] + (b9[0] - a[0]) * k / n, z = a[1] + (b9[1] - a[1]) * k / n, y2 = M.q.groundAt(x, z, y + 2); if (Math.abs(y2 - y) > mx) { mx = Math.abs(y2 - y); at = [+x.toFixed(1), +z.toFixed(1)]; } y = y2; } return { mx: +mx.toFixed(2), at }; };
      const E = X9.edges(), g9 = E.find(e => e.k === 'gorge'), c9 = E.find(e => e.k === 'crater');
      out.gIn = line([g9.gx + 2, g9.gz0 - 30], [g9.gx + 2, g9.gz0 + 70]); out.cIn = line([c9.cx, c9.cz - 130], [c9.cx, c9.cz]);
      // 땅 판 둘레(섞임 끝) — 판 밖 땅과 높이 차
      let ring = 0; for (const e of E) { const [x0, z0, x1, z1] = e.foot; for (let t = 0; t <= 1; t += 0.02) for (const [x, z] of [[x0 + 0.3, z0 + (z1 - z0) * t], [x1 - 0.3, z0 + (z1 - z0) * t], [x0 + (x1 - x0) * t, z0 + 0.3], [x0 + (x1 - x0) * t, z1 - 0.3]]) { const b9 = -1.30 + X9.base(x, z), d = Math.abs(M.q.groundAt(x, z, b9 + 0.6) - b9); if (d > ring) { ring = d; out.ringAt = [+x.toFixed(1), +z.toFixed(1), e.k]; } } } out.ring = +ring.toFixed(3);
      out.walkG = SM_TOWN.boatWhy(g9.gx + 2, g9.gz0 + 30).walk; out.walkC = SM_TOWN.boatWhy(c9.cx, c9.cz).walk; return out; });
    ok(R.gIn.mx < 0.55, '판 끝 → 층층골 바닥 한 걸음 높이 차 < 0.55m (가장 큰 ' + R.gIn.mx + ' @ ' + R.gIn.at + ')');
    ok(R.cIn.mx < 0.55, '판 끝 → 까망봉 분화구 바닥(터진 쪽) 한 걸음 높이 차 < 0.55m (가장 큰 ' + R.cIn.mx + ' @ ' + R.cIn.at + ')');
    ok(R.ring < 0.05, '땅 판 둘레 = 판 밖 땅 높이 그대로(차 ' + R.ring + 'm' + (R.ring >= 0.05 ? ' @ ' + R.ringAt : '') + ')');
    ok(R.walkG === false && R.walkC === false, 'inWalk는 그대로(판 밖 탐험 땅 = false · 일꾼·도착·바다 판정은 판 사각형)');
    // ② 장소·길·걷기
    console.log('② 학교에서 가는 길');
    const PL = await ev(() => SM_TOWN.places().filter(q => /층층골|까망봉/.test(q.name)).map(q => ({ name: q.name, door: q.door })));
    ok(PL.length === 2, '장소 목록에 층층골·까망봉 (' + PL.map(q => q.name).join('·') + ')');
    for (const P9 of PL) { const rr = await ev(([d, n]) => { const ok9 = SM_TOWN.path([16.5, 58], d, n); const pts = SM_TOWN.routePts(), L9 = SM_TOWN.routeNow(); SM_TOWN.pathOff(); return { ok: !!ok9, pts, len: L9 && L9.len }; }, [P9.door, P9.name]);
      ok(rr.ok && rr.pts && rr.pts.length > 1, '정문 → ' + P9.name + ' 빨간 선 ' + (rr.pts ? rr.pts.length : 0) + '점 · ' + rr.len + 'm');
      if (!rr.pts) continue; const ez = await ev(() => SM_TOWN.schRect()), EZ1 = await ev(() => SM_TOWN.xp().api.edges()[0].foot[1]) - 20;
      let k0 = 0; for (let i = 0; i < rr.pts.length; i++) if (rr.pts[i][1] < EZ1) k0 = i; void ez; const pts = rr.pts.slice(k0); await tp(pts[0][0], pts[0][1]); await W8(500); await closeAll();
      let k = 1, stuck = 0, jumps = 0, arrived = false, lastP = await pos(), lastT = Date.now(); const t0 = Date.now(), stuckAt = [];
      await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyW');
      while (Date.now() - t0 < 70000) { const me = await pos(); if (await panel()) { await p.keyboard.up('KeyW'); await closeAll(); await p.keyboard.down('KeyW'); }
        while (k < pts.length - 1 && d2(me, pts[k]) < 1.6) k++; await ev(q => SD2.map.player.lookAt(q), pts[k]);
        if (d2(me, P9.door) < 2.2) { arrived = true; break; }
        if (Date.now() - lastT > 1000) { if (d2(me, lastP) < 0.15) { stuck++; stuckAt.push(me.map(v => +v.toFixed(1)).join(',')); await p.keyboard.press('Space'); } lastP = me; lastT = Date.now(); }
        await W8(120); const m2 = await pos(); if (d2(me, m2) > 3) jumps++; }
      await p.keyboard.up('KeyW'); await p.keyboard.up('ShiftLeft');
      console.log('  ' + P9.name + ': 판 끝 길에서 ' + ((Date.now() - t0) / 1000).toFixed(1) + '초 · 선 ' + pts.length + '점');
      ok(arrived, P9.name + ' 문까지 걸어서 도착'); ok(stuck === 0, P9.name + ' 걸림 0 (' + stuck + ')' + (stuck ? ' @ ' + stuckAt.slice(0, 5).join(' | ') : '')); ok(jumps === 0, P9.name + ' 경계 튕김·순간 옮김 0 (' + jumps + ')'); }
    // ③ 발굴
    console.log('③ 층층골 발굴');
    const ST = await ev(() => SM_TOWN.xp().api.sites()); console.log('  자리 ' + JSON.stringify(ST));
    const f1 = ST.find(s => s.id === 'f1'); const look0 = await ev(() => ((SM_TOWN.game().S.skill || {}).look) || 0);
    await tp(f1.x + 1.7, f1.z); await ev(q => SD2.map.player.lookAt(q), [f1.x, f1.z]); await W8(400); await closeAll();
    await holdK('shovel'); await aim(f1.x, f1.z); let I = await info(); ok(I.aim.lock === 'fos' && I.aim.k === 'f1', '삽 고리가 흙더미에 붙음(fos · ' + I.aim.lock + ')');
    await useF(); await W8(2400); let S9 = await ev(() => SM_TOWN.xp().api.sites().find(s => s.id === 'f1').st); ok(S9 === 1, '삽 → 흙더미를 걷음(돌판 · 상태 ' + S9 + ')');
    await ev(() => SM_TOWN.xp().api.borrow()); await W8(600); await settle(); I = await info(); ok(I.have.includes('broom') && I.have.includes('lens'), '도구 상자에서 빗자루·돋보기 빌림');
    await useF(); await W8(400);   /* 삽을 든 채 = 차례 아님 → 다음 할 일 한 줄(안 바뀜) */ S9 = await ev(() => SM_TOWN.xp().api.sites().find(s => s.id === 'f1').st); ok(S9 === 1, '차례가 아닌 도구 = 안 바뀜(' + S9 + ')');
    await holdK('broom'); await aim(f1.x, f1.z); I = await info(); ok(I.aim.lock === 'fos', '빗자루 고리가 돌판에 붙음'); await useF(); await W8(2600); S9 = await ev(() => SM_TOWN.xp().api.sites().find(s => s.id === 'f1').st); ok(S9 === 2, '빗자루 → 무늬가 드러남(' + S9 + ')');
    await holdK('lens'); await aim(f1.x, f1.z); I = await info(); ok(I.aim.lock === 'fos', '돋보기 고리가 돌판에 붙음'); await useF(); await W8(2400);
    let pn = await panel(); ok(/고사리 화석/.test(pn), '돋보기 → 관찰 카드(고사리 화석) — ' + pn.slice(0, 40)); ok(/가져가지 않아요/.test(pn), '카드: 화석은 가져가지 않음(사진·수첩)');
    let X9 = await ev(() => SM_TOWN.xp().api.state()); ok(X9.fos.f1 && X9.fos.f1[0] === 4, '저장 S.xp.fos.f1 = [띠 4(고사리 화석층), 날] — ' + JSON.stringify(X9.fos.f1));
    const look1 = await ev(() => ((SM_TOWN.game().S.skill || {}).look) || 0); ok(look1 > look0, '관찰 솜씨 오름(' + look0 + ' → ' + look1 + ')');
    ok(/지층/.test(await ev(() => { const t = document.querySelector('.twn-p .nb-tabs'); return t ? t.textContent : ''; })), '수첩 탭에 🦴 지층');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="col"]'); if (b9) b9.click(); }); await W8(400); pn = await panel(); ok(/지층 기둥/.test(pn), '카드 → 지층 기둥 창');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-b="0"]'); if (b9) b9.click(); }); await W8(300); X9 = await ev(() => SM_TOWN.xp().api.state()); ok(!X9.col.includes('f1') && /색이 달라요/.test(await panel()), '틀린 띠(자갈층) = 안 붙음 · 다시 견주라는 한 줄');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-f="f1"]'); if (b9 && b9.classList.contains('sub')) b9.click(); }); await W8(250); await ev(() => { const b9 = document.querySelector('.twn-p [data-b="4"]'); if (b9) b9.click(); }); await W8(300); X9 = await ev(() => SM_TOWN.xp().api.state()); ok(X9.col.includes('f1'), '같은 색 띠(고사리 화석층)에 붙음');
    await closeAll(); await ev(() => { const A9 = SM_TOWN.xp().api; A9.use('shovel', 'f2'); A9.use('broom', 'f2'); A9.use('lens', 'f2'); }); await W8(400); await closeAll();
    await ev(() => SM_TOWN.xp().api.openCol()); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p [data-f="f2"]'); if (b9) b9.click(); }); await W8(250); await ev(() => { const b9 = document.querySelector('.twn-p [data-b="3"]'); if (b9) b9.click(); }); await W8(300);
    pn = await panel(); X9 = await ev(() => SM_TOWN.xp().api.state()); ok(X9.col.length === 2 && /먼저 쌓였을까요, 나중에/.test(pn), '둘 붙이면 먼저·나중 물음 — ' + (pn.match(/[^.]*먼저 쌓였을까요[^?]*\?/) || [''])[0]);
    const q = await ev(() => { const d = [...document.querySelectorAll('.twn-p .sm')].find(x => /먼저 쌓였을까요/.test(x.textContent)); const B = d ? [...d.querySelectorAll('b')].map(x => x.textContent) : []; return B.length === 2 ? B : null; }); const order = ['자갈층', '모래층', '진흙층', '조개 화석층', '고사리 화석층'], ans = q ? (order.indexOf(q[0]) > order.indexOf(q[1]) ? 'before' : 'after') : 'before';
    await ev(a => { const b9 = document.querySelector('.twn-p [data-q="' + (a === 'before' ? 'after' : 'before') + '"]'); if (b9) b9.click(); }, ans); await W8(300); X9 = await ev(() => SM_TOWN.xp().api.state()); ok(!X9.q && /아래에서 위로/.test(await panel()), '틀리면 기둥을 아래에서 위로 읽으라는 귀띔(' + JSON.stringify(q) + ')');
    await ev(a => { const b9 = document.querySelector('.twn-p [data-q="' + a + '"]'); if (b9) b9.click(); }, ans); await W8(300); X9 = await ev(() => SM_TOWN.xp().api.state()); ok(!!X9.q && /아래층이 먼저 쌓이고/.test(await panel()), '맞히면 「아래층이 먼저」 한 줄 · 저장 q');
    await closeAll();
    // ④ 까망봉
    console.log('④ 까망봉');
    const bag0 = await ev(() => SM_TOWN.game().S.bag['⚫'] || 0); await tp(c.cx + 3, c.cz); await W8(500); await closeAll(); await holdK('lens'); await aim(c.cx + 1, c.cz + 1.5); I = await info(); ok(I.aim.lock === 'xrock', '돋보기 고리가 분화구 돌에 붙음(' + I.aim.lock + ')');
    await useF(); await W8(2200); pn = await panel(); ok(/구멍이 숭숭/.test(pn) && /화강암/.test(pn), '관찰 카드: 송이·현무암 구멍 vs 화강암 알갱이');
    const bag1 = await ev(() => SM_TOWN.game().S.bag['⚫'] || 0); ok(bag1 === bag0 + 1, '송이 한 알 가방에(' + bag0 + ' → ' + bag1 + ')'); await closeAll();
    await useF(); await W8(2200); await closeAll(); ok((await ev(() => SM_TOWN.game().S.bag['⚫'] || 0)) === bag1, '같은 날 다시 봐도 송이는 한 번만');
    ok(await ev(() => (SM_TOWN.chem.lawPairs ? SM_TOWN.chem.lawPairs() : (SM_TOWN.chem.api ? SM_TOWN.chem.api.lawPairs() : [])).some(q9 => q9[0] === 'water' && q9[1] === '⚫' && q9[3] === 'sink')).catch(() => false) || fs.readFileSync(path.join(__dirname, '../../v2/games/town_laws.js'), 'utf8').includes("['water', '⚫', 'sink', 'sink']"), '실험 표: 물 × 송이 = 가라앉음(sink)');
    await holdK('lens'); await p.keyboard.press('Digit4'); await W8(300);
    { const tgt = [c.cx, c.cz - c.R - 14]; let stuck = 0, jumps = 0, lastP = await pos(), lastT = Date.now(); const t0 = Date.now(), stuckAt = []; let out = false; await p.keyboard.down('KeyW');
      while (Date.now() - t0 < 50000) { const me = await pos(); if (await panel()) { await p.keyboard.up('KeyW'); await closeAll(); await p.keyboard.down('KeyW'); } await ev(q9 => SD2.map.player.lookAt(q9), tgt);
        if (Math.hypot(me[0] - c.cx, me[2] - c.cz) > c.R + 6) { out = true; break; }
        if (Date.now() - lastT > 1000) { if (d2(me, lastP) < 0.15) { stuck++; stuckAt.push(me.map(v => +v.toFixed(1)).join(',')); await p.keyboard.press('Space'); } lastP = me; lastT = Date.now(); }
        await W8(120); const m2 = await pos(); if (d2(me, m2) > 3) jumps++; }
      await p.keyboard.up('KeyW'); console.log('  분화구 가운데 → 터진 쪽 밖 ' + ((Date.now() - t0) / 1000).toFixed(1) + '초');
      ok(out, '분화구에서 걸어 나옴'); ok(stuck === 0, '나오기 걸림 0 (' + stuck + ')' + (stuck ? ' @ ' + stuckAt.slice(0, 4).join(' | ') : '')); ok(jumps === 0, '나오기 경계 튕김 0'); }
    // ⑤ 무작위 0 · 높이 묻기 시간 · 오류
    console.log('⑤ 그 밖');
    const src = fs.readFileSync(path.join(__dirname, '../../v2/games/town_tools.js'), 'utf8').split('\n').filter(l => /'fos'/.test(l)), xps = fs.readFileSync(path.join(__dirname, '../../v2/games/town_xp.js'), 'utf8');
    ok(src.length >= 3 && src.every(l => !/Math\.random/.test(l.split("'fos'")[1].split('return;')[0])) && !/Math\.random/.test(xps), "무작위 0(fos 갈래 · town_xp.js에 Math.random 없음 · 줄 " + src.length + ')');
    const tm = await ev(([gx, gz]) => { const M = SD2.map, t = (x0, z0) => { const a = performance.now(); let s = 0; for (let i = 0; i < 20000; i++) s += M.q.groundAt(x0 + (i % 40) * 0.5, z0 + ((i / 40) | 0) % 40 * 0.5, 400); return [(performance.now() - a) / 20, s]; };
      const inn = t(40, 90)[0], xp = t(gx - 6, gz + 30)[0]; return { inn: +inn.toFixed(4), xp: +xp.toFixed(4) }; }, [g.gx, g.gz0]);
    console.log('  지면 높이 1000번 묻기: 판 안 ' + tm.inn + 'ms · 층층골 ' + tm.xp + 'ms'); ok(tm.xp < Math.max(1.5, tm.inn * 4), '탐험 땅 지면 묻기가 판 안보다 크게 느리지 않음');
    const WN = await ev(() => SM_TOWN.xp().api.edges().map(e => e.wind)); ok(WN.every(w => w && w.n > 0 && w.bad === 0), '땅 판 삼각형 앞면 = 넣은 법선 쪽(벽·덮개·돌 포함 · ' + JSON.stringify(WN) + ')');
    ok((await ev(() => SM_TOWN.xp().api.inst())).slab >= 2, '돌판 인스턴스가 상태대로(' + JSON.stringify(await ev(() => SM_TOWN.xp().api.inst())) + ')');
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { console.log('  ✗ 멈춤: ' + (e && e.message ? e.message.slice(0, 300) : e)); fails.push('멈춤'); } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
