// 8장 봇 — story_bots.js와 같은 꼴: (s = 반응 늦은 감각, K = 몸(walk·go·face·tap·set·stop), M = 차례 기억, B = 봇 손, level, now = 지금 감각)
// DRG.sense()만 읽고 키만 누름 · 반응 늦음 쉬움 0.6초 · 보통 0.35초(그만큼 지난 감각 + 움직임을 내다봄) · 동시 키 셋 · 초당 6타
const DT = 1 / 60, LAG = { easy: 0.6, normal: 0.35, hard: 0.3 };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const BOTS = {};

/* ① 이음 — 짐 보따리로 걸어감 → (말 끝) 투슬리스 옆에서 F */
BOTS['8-1'] = (s, K, M) => {
  if (s.stage === 'walk' && s.target) { K.go(s, s.target.x, s.target.z, false, 4); return; }
  if (s.stage === 'mount' && s.target) { if (K.go(s, s.target.x, s.target.z, false, 2.6)) { K.stop(); if ((M.cd = (M.cd || 0) - DT) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } return; }
  K.stop();
};

/* ② 화난 비행 — 기울기를 내다보고(늦은 만큼 + 기울기 빠르기) 반대쪽 · 예고 끝에 미리 반대쪽 · 곤두박질엔 ↑ */
BOTS['8-2'] = (s, K, M, B, lv) => {
  if (s.mode !== 'cling') { K.set('ArrowLeft', false); K.set('ArrowRight', false); K.set('ArrowUp', false); return; }
  const lag = LAG[lv] || 0.35, tp = s.tilt + s.tiltV * lag * 0.9;
  let u = tp > 0.16 ? 1 : tp < -0.16 ? -1 : 0;                           // 오른쪽으로 기움(+) → 왼쪽 키
  if (s.warn === 'roll' && s.warnK > 1 - lag / 2.5 - 0.08) u = s.dir > 0 ? 1 : -1;   // 고개가 다 돌아감 = 곧 기울어짐
  K.set('ArrowLeft', u > 0); K.set('ArrowRight', u < 0);
  K.set('ArrowUp', s.act === 'dive' || (s.warn === 'dive' && s.warnK > 0.75));
};

/* ③⑥ 구름 위 비행 — 팀 F 비행 봇(관문 = 목표 지점) */
const fly = (s, K, M, B, lv) => { if (s.mode === 'fly' && window.DRG_FLYBOT) { if (!M.fb) { K.releaseAll(); M.fb = window.DRG_FLYBOT(lv); } M.fb(window.DRG.loop.n, B); } };
BOTS['8-3'] = fly;
BOTS['8-6'] = fly;

/* ④ 떼 속 — 떼 가운데(주머니)에서 떼가 가는 쪽(30m 앞)을 봄 · 늦은 만큼 내다봄 · 작은 오차는 톡톡 */
BOTS['8-4'] = (s, K, M, B, lv) => {
  if (s.mode !== 'flock' || !s.aim) return;
  const lag = LAG[lv] || 0.35, n = window.DRG.loop.n;
  const px = s.x + s.vx * lag, py = s.y + s.vy * lag, pz = s.z + s.vz * lag;
  if (M.ly != null) M.yr = wrap(s.yaw - M.ly) / DT * 0.2 + (M.yr || 0) * 0.8; M.ly = s.yaw;
  /* 주머니 가운데로 끌어오는 점 = 떼가 가는 쪽 앞 + 벗어난 만큼 되돌림 */
  const ax = s.aim.x + (s.pocket.x - px) * 1.2, az = s.aim.z + (s.pocket.z - pz) * 1.2;
  const want = Math.atan2(ax - px, az - pz), err = wrap(want - (s.yaw + (M.yr || 0) * lag * 0.8));
  const pwm = (e, dead, big) => { const a = Math.abs(e); if (a < dead) return 0; if (a > big) return Math.sign(e); return (n % 20) / 20 < (a - dead) / (big - dead) ? Math.sign(e) : 0; };
  const st = pwm(err, 0.03, 0.3);
  K.set('ArrowLeft', st > 0); K.set('ArrowRight', st < 0);
  const dy = s.pocket.y - py - s.vy * 0.7;
  K.set('ArrowUp', dy > 1.2); K.set('ArrowDown', dy < -1.2);
};

/* ⑤ 둥지 — 살금살금 · 킁킁이 끝나면 다음 바위 턱으로 · 콧구멍이 벌름하는데 다음 턱이 멀면 가까운 턱으로 돌아가 멈춤 */
BOTS['8-5'] = (s, K, M, B, lv) => {
  if (s.stage !== 'sneak' || !s.chain) { K.stop(); return; }
  const me = K.cur.me;
  if (!me.low) { K.stop(); if ((K.shiftCd = (K.shiftCd || 0) - DT) <= 0) { K.tap('ShiftLeft'); K.shiftCd = 0.5; } return; }
  const ch = s.chain, last = ch.length - 1;
  M.goal = Math.max(M.goal || 0, s.prog + 1);
  const nx = ch[Math.min(last, M.goal)];
  const near = ch.slice(0, last).map((q, i) => ({ i, d: Math.hypot(q.x - me.x, q.z - me.z) })).sort((a, b) => a.d - b.d)[0];
  if (s.state === 'sniff') { K.stop(); return; }                          // 킁킁 = 그 자리 멈춤(턱이면 안전)
  if (s.state === 'warn') {
    const left = (1 - s.sign) * ({ easy: 3, normal: 2.5, hard: 2 }[s.diff] || 2.5) - (LAG[lv] || 0.35) - 0.4;   // 남은 예고(콧구멍 벌어진 정도로 짐작)
    const dn = Math.hypot(nx.x - me.x, nx.z - me.z);
    if (s.at >= 0 && dn > 1.6 * left) { K.stop(); return; }              // 턱에 있으면 기다림
    const tgt = dn <= 1.6 * left || !near ? nx : ch[near.i];
    if (K.walk(s, tgt.x, tgt.z, true, 0.9)) K.stop();
    return;
  }
  if (K.walk(s, nx.x, nx.z, true, M.goal === last ? 1.5 : 0.9)) K.stop();
};
