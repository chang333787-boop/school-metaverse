// 9장 봇 — BOTS['9-1'] = (s, K, M, B, level, now) · s = 반응 늦은 감각 · K = 몸(walk·go·face·tap·set·stop) · K.cur = 지금 화면(손·눈 움직임만) · story_bots.js가 합침
// DRG.sense()만 읽고 키만 누름(상태 쓰기 X) · 초당 6타 · 동시 키 셋
export const BOTS = {};
const cd = (M, k, sec) => { M[k] = (M[k] || 0) - 1 / 60; if (M[k] <= 0) { M[k] = sec; return true; } return false; };
const LAG = { easy: 0.6, normal: 0.35, hard: 0.3 }, WARN = { easy: 3, normal: 2.5, hard: 2 };

/* ① 나이트메어 — 날 볼 때 F(칼 → 투구) · 살금살금 다가가 F 꾹 */
BOTS['9-1'] = (s, K, M, B) => {
  const n = s.nm;
  if (!n) { K.stop(); K.set('KeyF', false); B.drag(5, 0); return; }
  if (s.stage === 'knife' || s.stage === 'helmet') { K.stop(); K.set('KeyF', false); K.face(s, n.x, n.z); if (n.facingMe && cd(M, 'f', 1.3)) K.tap('KeyF'); return; }
  if (s.stage !== 'approach') return;
  const c = (K.cur && K.cur.nm) || n;
  if (c.d > 3.1) { K.set('KeyF', false); K.walk(s, c.x, c.z, true, 3.0); return; }
  K.stop(); K.face(s, c.x, c.z); K.set('KeyF', true);
};
/* ② 버티기 — 가만히 서서 예고를 봄 · 쏘는 순간(예고 시작 + 예고 길이) 옆으로(가운데 쪽) 구름 · 멀어지면 다가감 */
BOTS['9-2'] = (s, K, M, B, lv) => {
  const n = s.nm, me = K.cur.me;
  if (!n) { K.stop(); B.drag(5, 0); return; }
  M.t = (M.t || 0) + 1 / 60;
  if (n.warn && !M.wOn) { M.wOn = true; M.fireAt = M.t + WARN[s.diff] - LAG[lv] + 0.05; }
  if (!n.warn && !n.shot) M.wOn = false;
  if (M.rollT > 0) { M.rollT -= 1 / 60; K.set(M.side, true); if (!M.rolled) { M.rolled = true; K.tap('Space'); } return; }
  K.set('KeyA', false); K.set('KeyD', false); M.rolled = false;
  if (s.diff !== 'easy' && M.fireAt && M.t >= M.fireAt) {   // 옆으로 구르기 — 가운데(0,0)에 가까운 쪽
    M.fireAt = 0; M.rollT = 0.5; K.stop();
    const fx = n.x - me.x, fz = n.z - me.z, L = Math.hypot(fx, fz) || 1, rx = -fz / L, rz = fx / L;   // 오른쪽(나이트메어를 볼 때 · walker 기준 오른쪽 = (−cos, sin))
    const toC = -me.x * rx - me.z * rz; M.side = toC >= 0 ? 'KeyD' : 'KeyA';
    return;
  }
  K.face(s, n.x, n.z);
  if (n.warn || n.shot) { K.stop(); return; }
  if (Math.hypot(me.x, me.z) > 15) K.walk(s, 0, 0, false, 12); else K.stop();
};
/* ③ 사이 — 아빠와 투슬리스 가운데에 서서 F 꾹 · 둘이 움직이면 손을 떼고 다시 가운데로 */
BOTS['9-3'] = (s, K, M, B) => {
  const t = s.tl, st = s.st, me = K.cur.me;
  if (!t || !st) { K.set('KeyF', false); K.stop(); B.drag(5, 0); return; }
  const ct = (K.cur.tl) || t, cs = (K.cur.st) || st, mx = (ct.x + cs.x) / 2, mz = (ct.z + cs.z) / 2, d = Math.hypot(mx - me.x, mz - me.z);
  if (K.cur.btw && (d < 1.0 || K.held.has('KeyF'))) { K.stop(); K.face(s, ct.x, ct.z); K.set('KeyF', true); return; }   // 사이에 있으면(보이는 것) 손 내밀기
  K.set('KeyF', false); if (d > 0.3) K.walk(s, mx, mz, false, 0.25); else K.stop();
};
/* ④ 회관 — 아빠 곁에 붙어 걷고 · 보여 줄 때 F */
BOTS['9-4'] = (s, K, M) => {
  const t = s.target; if (!t) { K.stop(); return; }
  const me = K.cur.me, d = Math.hypot(t.x - me.x, t.z - me.z);
  if (s.stage === 'show') { if (K.go(s, t.x, t.z, false, 2.3)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (d > 3.5) K.go(s, t.x, t.z, false, 3); else K.stop();
};
BOTS['9-5'] = (s, K) => { K.stop(); };
/* ⑥ 아스트리드 — 그림 보여 주기(F) → 따라 걷기 */
BOTS['9-6'] = (s, K, M) => {
  const t = s.target; if (!t) return;
  if (s.stage === 'show') { if (K.go(s, t.x, t.z, false, 2.4)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (s.stage === 'follow') { K.go(s, t.x, t.z, false, 2.5); return; }
  K.stop();
};
/* ⑦ 친구 넷 — 문 열기 · 풀 건네고 물러서기 · 사이에서 손 · 두 머리가 함께 숙일 때 F · 턱 밑 보여 주고 물러서기 · 내더 타기 */
BOTS['9-7'] = (s, K, M, B) => {
  const me = K.cur.me, dr = s.dr, cur = K.cur;
  const away = (o, r) => { const dx = me.x - o.x, dz = me.z - o.z, L = Math.hypot(dx, dz) || 1; if (L > r) { K.stop(); return true; } K.go(s, o.x + dx / L * (r + 1.5), o.z + dz / L * (r + 1.5), false, 0.6); return false; };
  K.set('KeyF', s.stage === 'between' || s.stage === 'demo' ? K.held.has('KeyF') : false);
  if (s.stage === 'door') { if (s.door && K.go(s, s.door.x, s.door.z, false, 1.0)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (s.stage === 'give') { if (!s.fr) { K.stop(); B.drag(5, 0); return; } const slow = !!dr && Math.hypot(dr.x - me.x, dr.z - me.z) < 7.5; if (K.go(s, s.fr.x, s.fr.z, slow, 2.0)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (dr) M.lastDr = dr;                                   // 뒤로 물러서다 안 보이게 돼도 본 자리를 기억
  if (s.stage === 'back') { const o = dr || M.lastDr; if (o) away(o, 6.4); else K.stop(); return; }
  if (s.stage === 'between') {
    if (!dr || !s.fr) { K.set('KeyF', false); K.stop(); return; }
    const c2 = cur.head || s.head || dr, f2 = cur.fr || s.fr, mx = (c2.x + f2.x) / 2, mz = (c2.z + f2.z) / 2, d = Math.hypot(mx - me.x, mz - me.z);
    if (d > 0.7) { K.set('KeyF', false); K.walk(s, mx, mz, true, 0.4); return; }
    K.stop(); K.face(s, c2.x, c2.z); K.set('KeyF', true); return;
  }
  if (s.stage === 'twins') {
    if (!s.fr) { K.stop(); return; }
    if (Math.hypot(s.fr.x - me.x, s.fr.z - me.z) > 4.5) { K.go(s, s.fr.x, s.fr.z, false, 4); return; }
    K.stop(); if (cur.dnA && cur.dnB && !M.hit) { M.hit = true; K.tap('KeyF'); } if (!(cur.dnA && cur.dnB)) M.hit = false; return;
  }
  if (s.stage === 'demo') {
    const ch = cur.chin || s.chin; if (!ch || !dr) { K.set('KeyF', false); K.stop(); return; }
    const d = Math.hypot(ch.x - me.x, ch.z - me.z);
    if (d > 1.0) { K.set('KeyF', false); K.walk(s, ch.x, ch.z, true, 0.8); return; }
    K.stop(); K.face(s, dr.x, dr.z); K.set('KeyF', dr.pupil > 0.5); return;
  }
  if (s.stage === 'ride') { const m = s.mount; if (m && K.go(s, m.x, m.z, false, 2.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  K.stop();
};
