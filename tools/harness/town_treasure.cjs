// 🗺 보물 지도 시험(TREASURE-1 · docs/systems/town_treasure.md): node tools/harness/town_treasure.cjs [마을=ourtown] [포트=8002] [단계=3]
//   ① 자리 계산 — 상자 자리마다 학교 밖 · 물 위 X · 몸이 서는 칸(map.q.blocked) · 본부에서 SM_TOWN.routeXY로 이어짐 · 길 끝에서 몸 규칙 걷기(walkLen)로 닿음
//   ② 지도 받기(게시판 옆 E) — 창 안 조각 그림 · 쪽지 카드 · 같은 날 다시 E = 같은 지도(새 지도 X)
//   ③ 새로고침 뒤 이어짐 — 같은 지도 · 카드 다시 보임
//   ④ 걸어서 도착(빨간 선 없이 길 점을 따라 W) — 순간이동 없음 · 30m 안 흙더미 · 3m 안 '땅 파기' E
//   ⑤ E 꾹 = 파기 → 상자 · 도감 칸(tmap:갈래) · 찾은 수 · 칭호(단계 처음) · 보상 창
//   ⑥ 같은 날 두 번 X — 게시판 E = '내일' · 새 지도 X / 다음 날 = 새 지도
//   ⑦ ★★ 걸음 재기(기준 장소 문 앞 → 카드 📏) · ★★★ 높이 재기(카드 ⛰)
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002', LVMAX = +(process.argv[4] || 3), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    const boot = async () => { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.treasure, null, { timeout: 240000 }); await p.waitForTimeout(1500);
      await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(800); };
    const info = () => p.evaluate(() => SM_TOWN.treasure().info());
    const closeP = async () => { await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]'); if (b) b.click(); else { const q = document.querySelector('.twn-p'); if (q) q.click(); } }); await p.waitForTimeout(500); };
    const tp = (x, z) => p.evaluate(([x, z]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [x, z]);
    const atBoard = async () => { const s = (await info()).src; await tp(s.x, s.z); await p.waitForTimeout(900); return s; };
    const pressE = async () => { await p.keyboard.press('KeyE'); await p.waitForTimeout(700); };
    await p.goto(URL); await boot();

    // ① 자리 계산
    const SP = await p.evaluate(() => { const T = SM_TOWN.treasure(), s = T.info().src, M = SD2.map; return T.spots().map(c => { const R = SM_TOWN.routeXY([s.x, s.z], [c.x, c.z]), lb = R.ok && R.pts.length > 1 ? R.pts[R.pts.length - 2] : null, y = SM_TOWN.ground(c.x, c.z);
      return { ...c, school: SM_TOWN.inSchool(c.x, c.z), water: SM_TOWN.sd(c.x, c.z), sea: SM_TOWN.boatWhy(c.x, c.z).sd, blk: !!(M.q.blocked || M.q.blockedAt)(c.x, c.z, y + 0.6), route: R.ok, walk: lb ? (Math.hypot(lb[0] - c.x, lb[1] - c.z) < 2.5 ? 0 : SM_TOWN.walkLen(lb, [c.x, c.z], 2.2, 30)) : -9 }; }); });
    console.log('상자 자리 ' + SP.length + '곳: ' + SP.map(c => c.k + '(' + c.walk + 'm)').join(' '));
    ok(SP.length >= 3, '상자 자리 셋 넘게(' + SP.length + ')'); ok(SP.some(c => c.hill), '★★★ 산 자리 있음');
    for (const c of SP) ok(!c.school && c.water > 2 && c.sea > 4 && !c.blk && c.route && c.walk >= 0, '자리 ' + c.id + ' — 학교 밖 · 물 위 X(' + c.water + ') · 막힘 X · 길 이어짐 · 걸어서 닿음(' + c.walk + ')');

    let found = 0, titleSeen = false;
    for (let round = 0; round < 6; round++) {
      // ② 지도 받기
      await atBoard(); const lb0 = (await info()).board; await pressE(); let I = await info(); const cur = I.cur; if (!cur) { const all = /모두 찾았/.test(lb0); ok(round > 0 && all, '지도 받기 — ' + (all ? '상자를 모두 찾아 더 없음' : '지도가 없음') + '(게시판: ' + lb0 + ')'); break; }
      if (cur.lv > LVMAX) { console.log('단계 ' + cur.lv + ' — 여기까지'); break; }
      const tag = '[' + '★'.repeat(cur.lv) + ' ' + cur.k + ']';
      const pan = await p.evaluate(() => { const q = document.querySelector('.twn-p'); return q ? { t: q.textContent.slice(0, 200), cv: !!q.querySelector('.tm-cv canvas'), words: q.querySelectorAll('[data-w]').length } : null; });
      ok(!!pan && pan.cv && /지도 조각/.test(pan.t), tag + ' 지도 받기 — 창 안 조각 그림'); ok(!!pan && pan.words === 2, tag + ' 낱말 상자 둘');
      if (round === 0) ok(!/빨간 선/.test(pan ? pan.t : ''), tag + ' 조각 창에 빨간 선 X');
      await closeP(); await p.waitForTimeout(1300); I = await info(); ok(I.card, tag + ' 쪽지 카드 보임');
      await pressE(); I = await info(); ok(I.cur && I.cur.id === cur.id, tag + ' 같은 날 다시 E = 같은 지도'); await closeP();

      // ③ 새로고침 뒤 이어짐(첫 판만)
      if (round === 0) { await p.waitForTimeout(2600); await p.reload(); await boot(); I = await info(); ok(I.cur && I.cur.id === cur.id && I.cur.lv === cur.lv, tag + ' 새로고침 뒤 같은 지도'); await p.waitForTimeout(1300); ok((await info()).card, tag + ' 새로고침 뒤 카드'); }

      // 도움 셋(첫 판만 — 1·2·3분이 지난 것처럼 · 셋째 = 빨간 선)
      if (round === 0) { await p.evaluate(() => { SM_TOWN.game().S.tmap.cur.el = 185; }); await p.waitForTimeout(1300); const hs = [];
        for (let i = 0; i < 3; i++) { await p.evaluate(() => { const b = document.querySelector('.twn-tmap .tm-h'); if (b && b.style.display !== 'none') b.click(); }); await p.waitForTimeout(600); hs.push((await info()).cur.h); }
        const rn = await p.evaluate(() => SM_TOWN.routeNow()); ok(hs.join() === '1,2,3', tag + ' 도움 셋 차례로(' + hs.join() + ')'); ok(!!rn, tag + ' 셋째 도움 = 빨간 선(' + (rn ? rn.len + 'm' : '없음') + ')'); }
      // ⑦ ★★ 걸음 재기 · ★★★ 높이
      if (cur.lv === 2) { await tp(cur.anc.x, cur.anc.z); await p.waitForTimeout(1600); const m = await p.evaluate(() => (document.querySelector('.twn-tmap .tm-m') || {}).textContent || ''); ok(/📏/.test(m), tag + ' 기준 장소 문 앞 → 걸음 재기(' + m + ')'); const st9 = await p.evaluate(() => (document.querySelector('.twn-comp') || {}).textContent || ''); ok(/북동|NE/.test(st9), tag + ' ★★ 지도를 든 동안 나침반 띠 8방위'); }

      // ④ 걸어서 도착: 길 점 가운데 상자 35m 앞에서 시작해 걷기(steer = 게임의 자동 걷기 · 걷기 봇 walkbot과 같음 · 걸리면 옆으로 반 걸음)
      const R = await p.evaluate(c => { const s = SM_TOWN.treasure().info().src; return SM_TOWN.routeXY([s.x, s.z], [c.x, c.z]).pts; }, cur);
      let k = R.length - 1, acc = 0; while (k > 0 && acc < 35) { acc += Math.hypot(R[k][0] - R[k - 1][0], R[k][1] - R[k - 1][1]); k--; }
      const pts = R.slice(k); await tp(pts[0][0], pts[0][1]); await p.waitForTimeout(800);
      let j = 1, last = null, maxJ = 0, sawMound = false, r = null, side = 0, sideN = 0, chk = null;
      for (let it = 0; it < 240; it++) { const tg = j < pts.length ? pts[j] : [cur.x, cur.z], sd = side > 0 ? (sideN % 2 ? 1 : -1) : 0; side--; r = await p.evaluate(([tg, c, sd]) => { const M = SD2.map, q = M.player.get(), dx = tg[0] - q.x, dz = tg[1] - q.z, dd = Math.hypot(dx, dz) || 1; if (sd) M.player.steer(-dz / dd * sd + dx / dd * 0.2, dx / dd * sd + dz / dd * 0.2, 4.2, true); else M.player.steer(dx, dz, 4.2, true); const T = SM_TOWN.treasure().info(); return { x: q.x, z: q.z, dT: dd, d: Math.hypot(q.x - c.x, q.z - c.z), mound: T.mound, dig: T.dig, m: (document.querySelector('.twn-tmap .tm-m') || {}).textContent || '' }; }, [tg, cur, sd]);
        if (last) maxJ = Math.max(maxJ, Math.hypot(r.x - last.x, r.z - last.z)); last = r; if (r.mound) sawMound = true; if (r.d < 1.8) break; if (r.dT < 1.6 && j < pts.length) j++; if (it % 4 === 0) { if (chk && Math.hypot(r.x - chk.x, r.z - chk.z) < 0.4 && side <= 0) { side = 4; sideN++; } chk = { x: r.x, z: r.z }; } await p.waitForTimeout(120); }
      await p.evaluate(() => SD2.map.player.steer(null)); await p.waitForTimeout(500); I = await info();
      ok(r.d < 2.6, tag + ' 걸어서 도착(남은 ' + r.d.toFixed(1) + 'm)'); ok(maxJ < 1.6, tag + ' 순간이동 없음(한 걸음 최대 ' + maxJ.toFixed(2) + 'm)'); ok(sawMound, tag + ' 30m 안 흙더미 보임'); ok(!!I.dig && /땅 파기/.test(I.dig), tag + ' 3m 안 E = ' + I.dig);
      if (cur.lv === 3) ok(/⛰/.test(r.m), tag + ' 산 둘레 카드 높이(' + r.m + ')');

      // ⑤ E 꾹 = 파기
      await p.evaluate(c => SD2.map.player.lookAt([c.x, c.z]), cur); await p.keyboard.down('KeyE'); await p.waitForTimeout(700); const mid = await info(); await p.waitForTimeout(1600); await p.keyboard.up('KeyE'); await p.waitForTimeout(2600); I = await info();
      ok(/파는 중/.test(mid.dig || '') || !!I.got[cur.id], tag + ' 누르는 동안 파는 중(' + (mid.dig || '') + ')');
      ok(!!I.got[cur.id] && !I.cur, tag + ' 상자 찾음(찾은 날 ' + I.got[cur.id] + ')'); ok(I.chest, tag + ' 상자가 땅에서 올라옴');
      const rw = await p.evaluate(k => { const q = document.querySelector('.twn-p'); return { t: q ? q.textContent.slice(0, 300) : '', dex: SM_TOWN.game().S.dex['tmap:' + k] != null, learn: Object.keys(SM_TOWN.game().S.learn || {}) }; }, cur.k);
      ok(/보물 상자를 찾았어요/.test(rw.t), tag + ' 보상 창'); ok(rw.dex, tag + ' 도감 칸 tmap:' + cur.k); found++;
      if (/새 칭호/.test(rw.t)) titleSeen = true; console.log('     ' + rw.t.replace(/\s+/g, ' ').slice(0, 140));
      if (round === 1) { await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="dex"]'); if (b) b.click(); }); await p.waitForTimeout(700); const dx = await p.evaluate(() => { const q = document.querySelector('.twn-p'); return q ? q.textContent : ''; }); const m9 = dx.match(/🗺 보물 상자[^0-9]*(\d+) \/ (\d+)/); ok(!!m9 && +m9[1] >= 2, '도감 「🗺 보물 상자」 갈래 ' + (m9 ? m9[1] + ' / ' + m9[2] : '없음') + (/기호 탐정/.test(dx) ? ' · 칭호 보임' : '')); }
      await closeP();

      // ⑥ 같은 날 두 번 X → 다음 날
      await atBoard(); I = await info(); ok(/내일/.test(I.board || ''), tag + ' 같은 날 게시판 = 내일(' + I.board + ')'); await pressE(); I = await info(); ok(!I.cur, tag + ' 같은 날 두 번 X(새 지도 없음)'); await closeP();
      await p.evaluate(() => SM_TOWN.game().sleep()); await p.waitForTimeout(2500); await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
      I = await info(); if (I.n[0] >= 2 && I.n[1] >= 2 && I.n[2] >= 1) break;
      if (round === 2 && LVMAX >= 2 && I.n[1] < 2) { await p.evaluate(() => { const s = SM_TOWN.game().S.tmap; s.n[1] = 2; }); console.log('  (★★ 둘째는 건너뜀 — 시간 줄이기)'); }
    }
    const F = await info(); ok(found >= Math.min(LVMAX, 3), '찾은 상자 ' + found + '개 · 단계별 ' + F.n.join('/')); ok(titleSeen && F.title.length >= 1, '칭호 ' + F.title.join(','));
    const dex = await p.evaluate(() => { SM_TOWN.treasure(); const b = document.querySelector('.twn-p'); return !!b; }); void dex;
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
