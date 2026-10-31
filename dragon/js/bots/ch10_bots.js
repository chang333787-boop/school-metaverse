// 10장 봇 — story_bots.js와 같은 꼴: BOTS[id] = (s, K, M, B, level, now) · s = 반응 늦은 감각(무엇을 할지) · now = 지금 화면(손·눈) · DRG.sense()만 읽고 키·끌기만
// ① 불빛 띠 따라 손짓 ② 몸 한 곳 겨눠 던지기(쉬움 = 눈 · 보통 = 입 → 날개 조합) ③ 숨 고를 때 고리 붙잡기 ④ 대장전(피하기·날개 막 쏘기) ⑤ 내리꽂기 → 입이 밝을 때 F → 솟구치기 ⑥ 걷기
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const DT = 1 / 60;

export const BOTS = {};

/* ① 안개 바다 — 아직 지나지 않은 가장 가까운 불빛 쪽으로 손짓 · 안 보이면 왼쪽으로 둘러봄 */
BOTS['10-1'] = (s, K, M) => {
  if (s.mode !== 'ride') return;
  M.seen = M.seen || [];
  for (const l of s.lights) if (Math.hypot(l.x - s.x, l.z - s.z) < 15 && !M.seen.some((q) => Math.abs(q[0] - l.x) < 0.01 && Math.abs(q[1] - l.z) < 0.01)) M.seen.push([l.x, l.z]);
  let tgt = null, bd = 1e9;
  for (const l of s.lights) { if (M.seen.some((q) => Math.abs(q[0] - l.x) < 0.01 && Math.abs(q[1] - l.z) < 0.01)) continue; const d = Math.hypot(l.x - s.x, l.z - s.z); if (d < bd) { bd = d; tgt = l; } }
  let steer = 0;
  if (tgt) { const da = wrap(Math.atan2(tgt.x - s.x, tgt.z - s.z) - s.yaw); steer = Math.abs(da) > 0.1 ? Math.sign(da) : 0; }
  else if (s.lost > 1.5 || s.waitHand) steer = 1;
  K.set('ArrowLeft', steer > 0); K.set('ArrowRight', steer < 0);
};

/* ② 해변 — 대장 쪽을 보고 · F 꾹(겨누기) → 겨눈 점을 몸 한 곳으로 → 놓기 · 불이 나를 노리면 옆으로 구르기 */
BOTS['10-2'] = (s, K, M, B, lv, now) => {
  if (s.stage !== 'fight' || !now.spots) { K.releaseAll(); return; }
  const c = now, me = c.me, bs = c.boss;
  if (s.down) { K.releaseAll(); return; }
  M.cd = (M.cd || 0) - DT;
  /* 피하기: 불이 나를 겨눔(예고가 보임) → 겨누던 것 놓고 옆으로 구르기 */
  if (s.boss.warn && s.boss.warn.me && s.boss.warn.left < 1.4 && !s.aim) {
    if (!M.dodge) { M.dodge = 0.9; M.side = -(M.side || 1); }
  }
  if (M.dodge > 0) { M.dodge -= DT; K.set('KeyF', false); K.set(M.side > 0 ? 'KeyD' : 'KeyA', true); K.set('KeyW', true); if (!M.rolled && M.dodge < 0.6) { M.rolled = true; K.tap('Space'); } if (M.dodge <= 0) { K.set('KeyA', false); K.set('KeyD', false); K.set('KeyW', false); M.rolled = false; M.dodge = 0; } return; }
  if (s.held === 'bucket' && !c.aim) { K.set('KeyF', false); if ((M.cd2 = (M.cd2 || 0) - DT) <= 0) { K.tap('KeyF'); M.cd2 = 1; } return; }   // 물통이면 다시 볼라로(이 봇은 볼라만 씀)
  /* 고를 곳: 쉬움 = 눈 · 보통 = 입 → 날개(가스 + 불 = 펑) */
  const plan = s.diff === 'easy' ? ['eye'] : ['mouth', 'wing'];
  M.k = M.k || 0;
  const want = plan[M.k % plan.length];
  const sp = c.spots[want]; if (!sp) return;
  if (!c.aim) {
    K.set('KeyA', false); K.set('KeyD', false); K.set('KeyW', false); K.set('KeyS', false);
    if (!K.face(s, bs.x, bs.z)) { K.set('KeyF', false); return; }
    if (M.cd > 0) { K.set('KeyF', false); return; }
    K.set('KeyF', true); M.aimT = 0; return;
  }
  if (c.aim.kind !== 'mark') { K.set('KeyF', false); return; }
  M.aimT = (M.aimT || 0) + DT;
  const du = sp.u - c.aim.u, dv = sp.v - c.aim.v;
  if (Math.abs(du) < 2.2 && Math.abs(dv) < 2.2) {            // 맞음 → 놓기
    K.set('KeyA', false); K.set('KeyD', false); K.set('KeyW', false); K.set('KeyS', false); K.set('KeyF', false);
    M.k++; M.cd = want === 'mouth' ? 0.4 : (s.diff === 'easy' ? 3.5 : 2.5); return;
  }
  if (s.diff === 'easy') { K.set('KeyD', du > 1.2); K.set('KeyA', du < -1.2); K.set('KeyW', dv > 1.2); K.set('KeyS', dv < -1.2); }
  else B.drag(Math.max(-24, Math.min(24, du / 0.1 * 0.5)), Math.max(-24, Math.min(24, -dv / 0.08 * 0.5)));
};

/* ③ 물속 — 투슬리스 쪽으로 가는 사슬의 고리 → 숨 고를 때만 F 꾹 */
BOTS['10-3'] = (s, K) => {
  const r = (s.chains || []).find((c) => c.to === 'dragon'); if (!r) { K.stop(); return; }
  if (!K.walk(s, r.x, r.z, false, 1.9)) { K.set('KeyF', false); return; }
  K.stop(); K.set('KeyF', !!s.calm);
};

/* ④ 대장전 — 날개 막 표본 점을 겨눠 쏘고(F) · 불이 나를 겨누면 옆·아래로 피하고 · 꼬리·날갯바람이면 멀어짐 · 땅·경계 피함 */
BOTS['10-4'] = (s, K, M, B, lv, now) => {
  const c = now; if (c.mode !== 'fly' || !c.boss) { K.releaseAll && K.releaseAll(); return; }
  const easy = s.diff === 'easy', bs = c.boss, sb = s.boss || bs;
  const dB = Math.hypot(bs.x - c.x, bs.y - c.y, bs.z - c.z);
  M.shotCd = (M.shotCd || 0) - DT; M.flapCd = (M.flapCd || 0) + DT; M.tailCd = (M.tailCd || 0) - DT;
  if (c.fallen) { K.set('ArrowLeft', false); K.set('ArrowRight', false); K.set('ArrowUp', false); K.set('ArrowDown', false); if (!easy && c.grab && (M.grabCd = (M.grabCd || 0) - DT) <= 0) { K.tap('Space'); M.grabCd = 0.7; } return; }
  /* 무엇을 할지(늦은 감각) */
  if (sb.warn && sb.warn.kind === 'fire' && sb.warn.me && sb.warn.left < 1.6 && !(M.dodge > 0)) { M.dodge = 2.2; const ax = c.x - bs.x, az = c.z - bs.z, l = Math.hypot(ax, az) || 1; M.dx = -az / l * (M.alt ? 1 : -1); M.dz = ax / l * (M.alt ? 1 : -1); M.alt = !M.alt; M.dy = c.y - c.ground > 60 ? -1 : 1; }
  if ((sb.act === 'tail' || sb.act === 'gust') && dB < 120) M.flee = 1.2;
  let tx, ty, tz, aim = null;
  if (M.dodge > 0) { M.dodge -= DT; tx = c.x + M.dx * 80; tz = c.z + M.dz * 80; ty = c.y + M.dy * 30; }
  else if (M.flee > 0) { M.flee -= DT; const ax = c.x - bs.x, az = c.z - bs.z, l = Math.hypot(ax, az) || 1; tx = c.x + ax / l * 80; tz = c.z + az / l * 80; ty = c.y + 10; }
  else {
    let best = null, bd = 1e9; for (const t of c.targets || []) { const d = Math.hypot(t.x - c.x, t.y - c.y, t.z - c.z); if (d < bd) { bd = d; best = t; } }
    if (best && bd > 62) { aim = best; tx = best.x; ty = best.y; tz = best.z; }
    else if (best) { const ax = c.x - bs.x, az = c.z - bs.z, l = Math.hypot(ax, az) || 1; tx = c.x + ax / l * 60 + az / l * 30; tz = c.z + az / l * 60 - ax / l * 30; ty = c.y + 6; }   // 너무 가까움 → 비켜서 거리 벌림
    else { tx = bs.x + 120; ty = bs.y; tz = bs.z; }
  }
  /* 땅·경계 */
  if (c.y - c.ground < 34) ty = Math.max(ty, c.ground + 60);
  const bo = c.bounds; if (bo && Math.hypot(c.x - bo.x, c.z - bo.z) > bo.r * 0.82) { tx = bo.x; tz = bo.z; }
  /* 손: 방향(톡톡 · 꾹) · 오르내리기 */
  const want = Math.atan2(tx - c.x, tz - c.z), err = wrap(want - c.yaw);
  const pwm = (e, dead, big) => { const a = Math.abs(e); if (a < dead) return 0; if (a > big) return Math.sign(e); return ((window.DRG.loop.n % 20) / 20) < (a - dead) / (big - dead) ? Math.sign(e) : 0; };
  const st = pwm(err, 0.04, 0.35);
  K.set('ArrowLeft', st > 0); K.set('ArrowRight', st < 0);
  const hz = Math.hypot(tx - c.x, tz - c.z) || 1, wantP = Math.atan2(ty - c.y, hz), pe = wantP - c.pitch;
  K.set('ArrowUp', pe > 0.08); K.set('ArrowDown', pe < -0.1);
  /* 쏘기: 겨눈 점이 도움 원뿔 안 · 가까움 */
  if (aim && M.shotCd <= 0 && c.shots >= 1) {
    const cp = Math.cos(c.pitch), fx = Math.sin(c.yaw) * cp, fy = Math.sin(c.pitch), fz = Math.cos(c.yaw) * cp, dx = aim.x - c.x, dy = aim.y - c.y, dz = aim.z - c.z, d = Math.hypot(dx, dy, dz) || 1;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * fx + dy * fy + dz * fz) / d)));
    if (ang < c.cone * 0.85 && d < 210) { K.tap('KeyF'); M.shotCd = 0.55; }
  }
  if (easy) { const sp = Math.abs(err) > 0.55; K.set('Space', sp); return; }
  /* 꼬리 자리: 크게 돌 땐 도는 쪽 · 아니면 곧게 */
  const tl = Math.abs(err) > 0.5 ? (err > 0 ? 2 : 3) : 1;
  if (c.tail !== tl && M.tailCd <= 0) { if (K.tap('Digit' + tl)) M.tailCd = 0.4; }
  /* 날갯짓: 날개가 다 올라간 박자 · 느리면 */
  if (c.speed < 27 && M.flapCd > 0.3 && (c.wingsUp || M.flapCd > 1.5)) { if (K.tap('Space')) M.flapCd = 0; }
};

/* ⑤ 마지막 — 내리꽂기(↓) → 입이 가장 밝을 때(틈) F → 솟구치기(↑) */
BOTS['10-5'] = (s, K, M, B, lv, now) => {
  const ph = now.phase;
  K.set('ArrowDown', ph === 'dive' || ph === 'window');
  K.set('ArrowUp', ph === 'pull');
  if (ph === 'window' && s.window && !M.shot) { M.shot = true; K.tap('KeyF'); }
  if (ph !== 'window') M.shot = false;
};

/* ⑥ 연기 속 스토이크로 걷기 */
BOTS['10-6'] = (s, K) => { if (s.found || (K.cur && K.cur.found)) { K.stop(); return; } if (s.target) K.go(s, s.target.x, s.target.z, false, 5.5); };
