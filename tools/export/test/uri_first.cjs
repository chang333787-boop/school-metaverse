// 첫 장 걷기 시험(새 저장소 uri-maeul · 그리기 끔 = 가벼움): node tools/export/test/uri_first.cjs [포트=8655]
//   처음부터 → 현관 칠판까지 걸어가 E → 프롤로그 쪽지 → 작은 도서관까지 빨간 선 길을 몸으로 걸음(순간이동 X) → 새 친구에게 보여 줄 곳 고르기 → 그곳까지 걸음
//   → 저장 → 새로고침 → 이어하기 = 같은 자리·같은 이야기 단계 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const PORT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '8655';
const URL = 'http://127.0.0.1:' + PORT + '/?adapt=0';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const ready = p => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.title && SM_TOWN.title(), null, { timeout: 240000 }).then(() => p.waitForTimeout(1200));
const me = p => p.evaluate(() => { const q = SD2.map.player.get(); return [q.x, q.z]; });
const step = p => p.evaluate(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id, type: s.step && s.step.do ? s.step.do.type : s.step && s.step.type }; });
// 몸으로 걷기: 길 점(routeXY)을 따라 steer — 닿거나 cond()가 참이 되면 멈춤
async function walk(p, to, ms, cond) {
  const r = await p.evaluate(([a, b]) => { const m = SD2.map.player.get(), R = SM_TOWN.routeXY([m.x, m.z], [a, b]); return R && R.ok ? R.pts : [[a, b]]; }, to);
  const t0 = Date.now(); let k = 0, jumps = 0, last = await me(p), dist = 0;
  while (Date.now() - t0 < ms) {
    if (cond && await cond()) break;
    const [x, z] = await me(p); const d0 = Math.hypot(x - last[0], z - last[1]); dist += d0; if (d0 > 6) jumps++; last = [x, z];
    while (k < r.length - 1 && Math.hypot(r[k][0] - x, r[k][1] - z) < 3) k++;
    const q = r[Math.min(k, r.length - 1)]; if (k >= r.length - 1 && Math.hypot(q[0] - x, q[1] - z) < 1.2) break;
    await p.evaluate(([dx, dz]) => SD2.map.player.steer(dx, dz, 5.5, true), [q[0] - x, q[1] - z]); await p.waitForTimeout(200);
  }
  await p.evaluate(() => SD2.map.player.steer(null));
  return { ms: Date.now() - t0, jumps, dist: Math.round(dist), pts: r.length };
}
// 창 처리: 대화는 넘기고, 고르기는 가까운 보기 하나
async function panels(p) {
  return p.evaluate(() => {
    const dlg = document.querySelector('.twn-dlg');
    if (dlg) { const ch = dlg.querySelector('.ch button'); if (ch) { ch.click(); return 'dlg-choice'; } dlg.querySelector('.dbox') ? dlg.querySelector('.dbox').click() : dlg.click(); return 'dlg'; }
    const pn = [...document.querySelectorAll('.twn-p')].find(e => e.getClientRects().length && !e.classList.contains('twn-ld'));
    if (pn) { const opt = [...pn.querySelectorAll('button[data-k]')].filter(b => b.getClientRects().length);
      if (opt.length) { if (!opt.some(b => b.classList.contains('pri'))) (opt.find(b => /마트/.test(b.textContent)) || opt[0]).click(); const okb = pn.querySelector('button[data-a="ok"]'); if (okb) okb.click(); return 'choose'; }
      const bs = [...pn.querySelectorAll('button')].filter(b => !b.disabled && b.getClientRects().length); const pick = bs.find(b => /마트/.test(b.textContent)) || bs.find(b => /우체국|소방서|놀이터/.test(b.textContent)) || bs.find(b => /확인|다음|골랐|좋아|닫기|계속/.test(b.textContent)); if (pick) { pick.click(); return 'panel:' + pick.textContent.trim().slice(0, 20); } }
    return null;
  });
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); watch(p, 'A');
    await p.goto(URL); await ready(p);
    ok(!(await p.evaluate(() => !!document.getElementById('iv'))), '그리기 끔 시험 = 인트로 X(키를 막지 않음)');
    await p.evaluate(() => document.querySelector('.twn-p [data-a="x"]').click()); await p.waitForTimeout(1800);
    const H = await p.evaluate(() => { const q = SD2.map.player.get(), H = SM_TOWN.home(), h = SD2.map.interact.list().find(x => /^📋 쪽지 읽기/.test(x.label || '')); return { d: Math.hypot(q.x - H.e[0], q.z - H.e[1]), board: h ? [h.x, h.z] : null }; });
    ok(H.d < 7 && H.board, '처음부터 = 우리 집 현관 앞(' + H.d.toFixed(1) + 'm) · 칠판 E 자리 있음');
    console.log('① 칠판까지 걸어가 E');
    await walk(p, H.board, 8000, () => p.evaluate(() => /쪽지 읽기/.test(SD2.near() || '')));
    await p.keyboard.press('KeyE'); await p.waitForTimeout(900);
    let S = await step(p); ok(S.cur === 'p0', '칠판 E → 프롤로그(' + S.cur + ' · ' + S.id + ')');
    console.log('② 프롤로그를 몸으로 따라가기');
    const T0 = Date.now(), seen = [], walks = [];
    while (Date.now() - T0 < 360000) {
      S = await step(p); const tag = S.cur + ':' + S.id + ':' + S.type; if (seen[seen.length - 1] !== tag) { seen.push(tag); console.log('    단계 ' + tag); }
      if (S.cur !== 'p0' || S.id === 'why') break;
      const pn = await panels(p); if (pn) { await p.waitForTimeout(450); continue; }
      if (S.type === 'go') {
        const tg = await p.evaluate(() => { const t = SM_TOWN.storyTarget(); if (!t) return null; const x = (t.door && t.door[0]) ?? t.x ?? (t.at && t.at.x), z = (t.door && t.door[1]) ?? t.z ?? (t.at && t.at.z); return Number.isFinite(x) ? [x, z] : null; });
        if (tg) { const id0 = S.id; const w = await walk(p, tg, 150000, async () => (await step(p)).id !== id0 || !!(await p.evaluate(() => document.querySelector('.twn-dlg')))); walks.push({ id: id0, ...w }); console.log('    걸음 ' + id0 + ' ' + JSON.stringify(w)); continue; }
      }
      await p.waitForTimeout(400);
    }
    S = await step(p);
    const libW = walks.find(w => w.id === 'lib'), showW = walks.find(w => w.id === 'show');
    ok(libW && libW.jumps === 0 && libW.dist > 40, '작은 도서관까지 몸으로 걸음(' + (libW ? libW.dist + 'm · ' + Math.round(libW.ms / 1000) + '초 · 튐 ' + libW.jumps : '없음') + ')');
    ok(showW && showW.jumps === 0, '고른 곳까지 새 친구와 걸음(' + (showW ? showW.dist + 'm · ' + Math.round(showW.ms / 1000) + '초' : '없음') + ')');
    ok(S.id === 'why' || (S.cur !== 'p0'), '프롤로그 걷기 단계를 다 지남(지금 ' + S.cur + ':' + S.id + ')');
    console.log('③ 저장 → 새로고침 → 이어하기');
    for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.querySelectorAll('.twn-dlg,.twn-p').length))) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
    await p.waitForTimeout(2500); const A0 = await me(p), F = await p.evaluate(() => SM_TOWN.save().flush());
    ok(F !== false, '저장(flush)');
    await p.reload(); await ready(p);
    const card = await p.evaluate(() => (document.querySelector('.twn-ld') || {}).innerText || ''); ok(/이어하기/.test(card) && /1일째|2일째/.test(card), '첫 화면 = 이어하기 · 지난번 한 줄(' + card.replace(/\s+/g, ' ').slice(0, 60) + ')');
    await p.evaluate(() => document.querySelector('.twn-p [data-a="x"]').click()); await p.waitForTimeout(2200);
    const A1 = await me(p), S1 = await step(p);
    ok(Math.hypot(A1[0] - A0[0], A1[1] - A0[1]) < 4, '같은 자리에서 이어짐(' + Math.hypot(A1[0] - A0[0], A1[1] - A0[1]).toFixed(1) + 'm)');
    ok(S1.cur === S.cur && S1.id === S.id, '이야기 단계가 그대로(' + S1.cur + ':' + S1.id + ')');
    await ctx.close();
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
