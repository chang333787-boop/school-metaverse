// 🚶 걷기 봇 공용(GATE-2 · 10-31 '진짜 시험') — town_first.cjs의 걷기와 첫 장 길을 코드 그대로 옮김 · town_first.cjs · town_gate.cjs가 같이 씀
//   walker(p, { t }) = { p, ev, W8, S, closeDlg, shut, walk, waitStep, st } · st = { maxJ(0.12초 한 걸음 최대 m — 2m 넘으면 순간이동), steps, selfBad, compBad } · t() = 시작부터 초(기록 꼬리표)
//   toFirstTry(Wk, { ok, mark, shot, mmss, t, PICK }) = 현관 칠판 E → 프롤로그(도서관 · 꽃에 물 주기(COVER-1) · 카드 둘 · 데려가기) → 1-1 첫 '해 보기'(tmap) 단계 도착까지 걸어서 · 돌려줌 { s, tT }
function walker(p, o = {}) {
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), t = o.t || (() => 0), st = { maxJ: 0, steps: 0, selfBad: [], compBad: [] };
  const S = () => ev(() => { const s = SM_TOWN.story(), q = SD2.map.player.get(); return { cur: s.cur, id: s.step && s.step.id, type: s.step && s.step.type, h: s.step ? s.step.h : 0, done: Object.keys((s.S && s.S.done) || {}), x: q.x, z: q.z, dlg: !!document.querySelector('.twn-dlg'), pan: !!document.querySelector('.twn-p'), route: !!SM_TOWN.routeNow(), comp: SM_TOWN.compTgt ? SM_TOWN.compTgt() : null }; });
  const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(380); } };
  const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { const d = document.querySelector('.twn-dlg'); if (d) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
  // 걷기: 길 점(빨간 선 = 화면에 있는 것 · 스스로 찾는 단계 = 아이가 지도로 고른 길 = routeXY)을 따라 steer · 걸리면 옆으로 반 걸음 · until()이 참이면 멈춤
  async function walk(tx, tz, o = {}) { const r0 = o.r || 2.2, lim = (o.lim || 400) * 1000, t9 = Date.now(); let pts = await ev(([tx, tz, line]) => { const q = SD2.map.player.get(), L = line && SM_TOWN.routePts ? SM_TOWN.routePts() : null; if (L && L.length > 1) return L; const R = SM_TOWN.routeXY([q.x, q.z], [tx, tz]); return R && R.ok && R.pts && R.pts.length ? R.pts.map(v => [v[0], v[1]]) : [[tx, tz]]; }, [tx, tz, !!o.line]);
    let j = 0, last = null, side = 0, sideN = 0, chk = null, it = 0;
    while (Date.now() - t9 < lim) { const tg = j < pts.length ? pts[j] : [tx, tz], sd = side > 0 ? (sideN % 2 ? 1 : -1) : 0; side--;
      const r = await ev(([tg, tx, tz, sd]) => { const M = SD2.map, q = M.player.get(), dx = tg[0] - q.x, dz = tg[1] - q.z, dd = Math.hypot(dx, dz) || 1; if (sd) M.player.steer(-dz / dd * sd + dx / dd * 0.2, dx / dd * sd + dz / dd * 0.2, 4.2, true); else M.player.steer(dx, dz, 4.2, true); const s = SM_TOWN.story(); return { x: q.x, z: q.z, dT: dd, d: Math.hypot(q.x - tx, q.z - tz), sid: s.step && s.step.id, cur: s.cur, h: s.step ? s.step.h : 0, route: !!SM_TOWN.routeNow(), comp: SM_TOWN.compTgt ? !!SM_TOWN.compTgt() : false, pan: !!document.querySelector('.twn-p,.twn-dlg') }; }, [tg, tx, tz, sd]);
      if (last) { const jm = Math.hypot(r.x - last.x, r.z - last.z); if (jm > st.maxJ) st.maxJ = jm; } last = r; st.steps++;
      if (o.self && r.h < 3 && r.route) st.selfBad.push(o.tag + '@' + t().toFixed(0)); if (o.noComp && r.h < 2 && r.comp) st.compBad.push(o.tag + '@' + t().toFixed(0));
      if (o.until && o.until(r)) break; if (r.d < r0) break;
      if (r.pan) { await ev(() => SD2.map.player.steer(null)); if (o.onPanel) await o.onPanel(); else await shut(); last = null; continue; }
      if (r.dT < 1.6 && j < pts.length) j++; if (++it % 4 === 0) { if (chk && Math.hypot(r.x - chk.x, r.z - chk.z) < 0.4 && side <= 0) { side = 4; sideN++; } chk = { x: r.x, z: r.z }; }
      if (it % 40 === 0 && j >= pts.length && r.d > r0 * 2) { pts = await ev(([tx, tz]) => { const q = SD2.map.player.get(), R = SM_TOWN.routeXY([q.x, q.z], [tx, tz]); return R && R.ok ? R.pts.map(v => [v[0], v[1]]) : [[tx, tz]]; }, [tx, tz]); j = 0; }   /* 다 따라왔는데 멀면 다시 길 */
      await W8(120); }
    await ev(() => SD2.map.player.steer(null)); await W8(250); return last; }
  const waitStep = async (pred, ms = 20000) => { const t9 = Date.now(); let s = await S(); while (!pred(s) && Date.now() - t9 < ms) { await W8(300); s = await S(); } return s; };
  return { p, ev, W8, S, closeDlg, shut, walk, waitStep, st };
}
async function toFirstTry(Wk, o) {
  const { p, ev, W8, S, closeDlg, walk, waitStep } = Wk, { ok, mark, shot, mmss, t, PICK } = o;
  console.log('① 새 아이 — 우리 집 현관에서 칠판 E');
  { const B0 = await ev(() => { const h = SD2.map.interact.list().find(q => /^📋 쪽지 읽기/.test(q.label || '')); return h ? [h.x, h.z] : null; }); ok(!!B0, '현관 칠판 E 자리');
    if (B0) { await walk(B0[0], B0[1], { r: 1.2, lim: 60 }); await p.keyboard.press('KeyE'); await W8(1400); }
    let s = await S(); if (s.cur !== 'p0') { await ev(() => SM_TOWN.storyStart('p0')); await W8(1200); s = await S(); } ok(s.cur === 'p0', '프롤로그 시작(' + s.cur + ')'); mark('프롤로그 쪽지'); }
  await closeDlg(); let s = await waitStep(q => q.id === 'lib'); mark('📚 작은 도서관 가기(빨간 선)');
  { const T = await ev(() => SM_TOWN.storyTarget()); let rt = false; for (let i = 0; i < 12 && !rt; i++) { rt = await ev(() => !!SM_TOWN.routeNow()); if (!rt) await W8(250); }   /* 길은 단계 시작 0.45초 뒤 그려짐 */ ok(rt, '처음 걷기 = 빨간 선 있음(튜토리얼)'); await walk(T.x, T.z, { line: true, r: 6, until: r => r.sid !== 'lib', tag: 'lib' }); }
  s = await waitStep(q => q.id !== 'lib'); if (s.id === 'bed') { mark('💧 도서관 앞 마른 꽃에 물 주기(물뿌리개 · 도구 띠 처음)'); await closeDlg(); const T = await ev(() => SM_TOWN.storyTarget()); const r0 = await S(); ok(!r0.route, '꽃 물 주기 = 빨간 선 없음(❗만)');   /* COVER-1(10-31) */
    if (T) { await walk(T.x, T.z, { self: 1, r: 2.4, lim: 90, tag: 'bed' }); await p.keyboard.press('Digit1'); await W8(400); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [T.x, T.z]); await W8(200); await p.keyboard.down('KeyF'); await W8(2200); await p.keyboard.up('KeyF'); await ev(() => SM_TOWN.tools.aim(null)); await p.keyboard.press('Digit1'); }
    s = await waitStep(q => q.id !== 'bed', 8000); ok(s.id === 'first', '물뿌리개로 꽃에 물 → 넘어감(' + s.id + ')'); await shot('first_0_bed'); }
  s = await waitStep(q => q.id === 'first'); ok(s.id === 'first', '도서관 도착 → 보여 줄 곳과 까닭(카드 한 번)');
  { let n = 0; for (; n < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); n++) await W8(300); const C0 = await ev(() => [...document.querySelectorAll('.twn-p [data-card]')].map(b9 => b9.textContent)); ok(C0.length >= 2 && C0.some(x => /🏪|📮|🚒|🎠/.test(x)), '첫 칸 = 그림 + 장소 이름(' + C0.join(', ') + ')'); await shot('first_1_card');
    const k = await ev(nm => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')], b9 = L9.find(q => q.textContent.includes(nm)) || L9[0]; b9.click(); return b9.textContent; }, PICK); await W8(300);
    const C1 = await ev(() => [...document.querySelectorAll('.twn-p [data-card]')].map(b9 => b9.textContent)); ok(C1.includes('가까운'), '둘째 칸 = 까닭 카드'); await ev(() => document.querySelector('.twn-p [data-card]').click()); await W8(1800);
    s = await S(); ok(s.id === 'show', '카드 둘 → 데려가기(' + s.id + ' · 고른 곳 ' + k + ')'); }
  mark('🚶 노란 ❗ 보고 데려가기(빨간 선 X)');
  { await W8(700); const T = await ev(() => SM_TOWN.storyTarget()); const r0 = await S(); ok(!r0.route, '데려가기 = 빨간 선 없음'); await shot('first_2_mark'); await walk(T.x, T.z, { self: 1, r: 10, until: r => r.sid !== 'show', tag: 'show' }); }
  s = await waitStep(q => q.done.includes('p0'), 8000); ok(s.done.includes('p0'), '프롤로그 끝(' + mmss(t()) + ')'); mark('프롤로그 끝');
  s = await waitStep(q => q.cur === 'a1_1', 20000); ok(s.cur === 'a1_1', '1-1이 저절로 시작(' + s.cur + ')'); mark('1-1 쪽지');
  await W8(600); await closeDlg(); s = await waitStep(q => q.id === 'tmap'); const tT = t(); mark('🗺 해 보기 단계 도착(지도 조각 ✕ 찾아 파기)');
  ok(s.id === 'tmap' && tT <= 300, '첫 5분 안에 해 보기 단계 도착(' + mmss(tT) + ')');
  return { s, tT };
}
module.exports = { walker, toFirstTry };
