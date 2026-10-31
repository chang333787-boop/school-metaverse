// 1장 봇 — BOTS['1-1'] = (s, K, M, B, level, now) · s = 반응 늦은 감각 · K = 몸(walk·go·face·tap·set·stop · K.cur = 지금 화면) · story_bots.js가 합침
// 화면에 보이는 것만(sense) · 키·끌기만 · 동시 키 셋 · 초당 6타
import { planPath } from './story_bots.js?v=16';

const DT = 1 / 60, LAG = { easy: 0.6, normal: 0.35, hard: 0.3 }, WARN = { easy: 3, normal: 2.5, hard: 2 };
const cd = (M, k, sec) => { M[k] = (M[k] || 0) - DT; if (M[k] <= 0) { M[k] = sec; return true; } return false; };
const hyp = Math.hypot;

/* 길 찾아 걷기 — 보이는 벽·바위 + 피할 동그라미(앉은 드래곤) · 3초마다·막히면 다시 찾음 */
function goC(K, M, tx, tz, arrive = 1, circles = [], slow = false) {
  const me = K.cur.me, ob = K.cur.obst || { walls: [], rocks: [] };
  if (hyp(tx - me.x, tz - me.z) < arrive) { K.stop(); M.path = null; return true; }
  const key = tx.toFixed(1) + ',' + tz.toFixed(1);
  M.rp = (M.rp || 0) + DT;
  if (!M.path || M.pkey !== key || M.pk >= M.path.length || M.rp > 3 || (K.stuckT || 0) > 1) {
    M.rp = 0; M.pkey = key; M.pk = 0;
    M.path = planPath(me.x, me.z, tx, tz, ob.walls, 0.55, 0.5, 16, (ob.rocks || []).concat(circles)) || [[tx, tz]];
  }
  const p = M.path[Math.min(M.pk, M.path.length - 1)];
  if (K.walk(K.cur, p[0], p[1], slow, M.pk >= M.path.length - 1 ? arrive : 0.8)) M.pk++;
  return false;
}
/* 던지기 조준(물통·볼라) — 쉬움 = 방향키 · 보통 = 끌기 · 맞으면 F를 놓음(던짐) */
function steerAim(K, s, th, tx, tz, tol = 0.5) {
  const c = K.cur, a = (c.throw && c.throw.aim) || th.aim;
  const ex = tx - a.x, ez = tz - a.z;
  if (hyp(ex, ez) < tol) { K.set('KeyA', false); K.set('KeyD', false); K.set('KeyW', false); K.set('KeyS', false); K.set('KeyF', false); return true; }
  const my = c.camYaw, fx = Math.sin(my), fz = Math.cos(my), rx = -Math.cos(my), rz = Math.sin(my), er = ex * rx + ez * rz, ef = ex * fx + ez * fz;
  if (s.diff === 'easy') { K.set('KeyD', er > 0.25); K.set('KeyA', er < -0.25); K.set('KeyW', ef > 0.25); K.set('KeyS', ef < -0.25); return false; }
  window.DRG.bot.drag(Math.max(-20, Math.min(20, er / 0.03 * 0.35)), Math.max(-20, Math.min(20, -ef / 0.03 * 0.35)));
  return false;
}

export const BOTS = {};

/* ① 무기 나르기 — 도끼 꾸러미 → 보이는 바이킹(기억) 가까운 차례 · 앉은 드래곤은 둘레 8m를 피해 감 · 안 보이면 둘러봄 */
BOTS['1-1'] = (s, K, M) => {
  const me = K.cur.me, c = K.cur;
  M.vk = M.vk || {}; M.sit = M.sit || {};
  for (const v of c.vikings || []) if (v.seen) M.vk[v.i] = v;
  const live = new Set((c.vikings || []).map((v) => v.i)); for (const k in M.vk) if (!live.has(+k)) delete M.vk[k];   // 건넨 바이킹은 지움
  for (const d of c.sitters || []) M.sit[d.kind] = d;
  if (s.down) { K.stop(); return; }
  if (c.stage === 'rack') { if (c.rack && goC(K, M, c.rack.x, c.rack.z, 1.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  const known = Object.values(M.vk).sort((a, b) => hyp(a.x - me.x, a.z - me.z) - hyp(b.x - me.x, b.z - me.z));
  const v = known[0];
  if (!v) { K.stop(); window.DRG.bot.drag(6, (M.T = (M.T || 0) + DT) % 4 < 2 ? -4 : 3); return; }   // 둘러보기(오르막 쪽도 보게 위아래로)
  const circles = Object.values(M.sit).map((d) => [d.x, d.z, 7.5]);
  if (goC(K, M, v.x, v.z, 2.0, circles)) { K.stop(); K.face(c, v.x, v.z); if (cd(M, 'f', 0.7)) K.tap('KeyF'); }
};

/* ② 지붕 불 — 줄 끝에서 물통 → 타는 칸(바람 아래 · 센 불 먼저) 가까이 → 겨눠 던짐 */
BOTS['1-2'] = (s, K, M) => {
  const c = K.cur, me = c.me, th = c.throw || {};
  if (!c.hand) return;                                       // 차례 감각이 아직 안 섬(첫 걸음)
  if (s.down) { K.stop(); K.set('KeyF', false); return; }
  const fires = (c.fires || []).filter((f) => f.on);
  if (!th.held) {
    K.set('KeyF', false);
    if (goC(K, M, c.hand.x, c.hand.z, 1.3)) { K.stop(); if (c.ready && cd(M, 'f', 0.5)) K.tap('KeyF'); else if (fires[0]) K.face(c, fires[0].x, fires[0].z); }
    return;
  }
  /* 과녁 고르기 — 불 세기 + 동쪽(바람 아래) 덤 − 거리 · 정한 과녁은 꺼질 때까지 */
  let tg = M.tg && fires.find((f) => hyp(f.x - M.tg.x, f.z - M.tg.z) < 0.3);
  if (!tg || th.aim == null) { tg = fires.slice().sort((a, b) => (b.fire + b.x * 0.025 - hyp(b.x - me.x, b.z - me.z) * 0.02) - (a.fire + a.x * 0.025 - hyp(a.x - me.x, a.z - me.z) * 0.02))[0]; M.tg = tg; }
  if (!tg) { const hot = (c.fires || []).sort((a, b) => b.heat - a.heat)[0]; if (!hot) { K.stop(); K.set('KeyF', false); window.DRG.bot.drag(6, 0); return; } tg = hot; M.tg = hot; }   // 안 보이면 둘러봄(지붕 불은 등 뒤에 있을 수 있음)
  const d = hyp(tg.x - me.x, tg.z - me.z);
  if (!th.aim && (d > 12.3 || d < 3)) { K.set('KeyF', false); const h = c.hand, ax = h.x - tg.x, az = h.z - tg.z, L = Math.hypot(ax, az) || 1, k = Math.min(7.5, L); goC(K, M, tg.x + ax / L * k, tg.z + az / L * k, 1.5); return; }   // 과녁에서 줄 끝(트인 길) 쪽으로 7.5m
  K.stop();
  if (!th.aim) { if (K.face(c, tg.x, tg.z)) K.set('KeyF', true); return; }
  steerAim(K, s, th, tg.x, tg.z, 0.55);
};

/* ③ 피하기 — 길잡이(피시레그)를 따라감 · 내더 = 쏘는 순간에 구르기 · 그롱클 = 쏘면 멈춰 섬 · 나이트메어 = 달아오르면 물러섬 · 초록 김 = 빠져나옴 */
BOTS['1-3'] = (s, K, M, B, lv) => {
  const c = K.cur, me = c.me; if (!me || !c.gate) return;
  if (s.down) { K.stop(); K.set('KeyA', false); K.set('KeyD', false); return; }
  const lag = LAG[lv] || 0.35, W = WARN[s.diff] || 2.5;
  M.w = M.w || {};
  for (const d of s.dragons || []) { const w = M.w[d.kind] || (M.w[d.kind] = { on: false, t0: 0, rolled: false, stopT: 0 }); if (d.warn && !w.on) { w.on = true; w.t0 = M.T || 0; w.rolled = false; } if (!d.warn && w.on) { w.on = false; if (d.kind === 'gronckle') w.stopT = 0.7; if (d.kind === 'nightmare') w.waitT = 1.6; } }
  M.T = (M.T || 0) + DT;
  /* 굴러가는 중 */
  if (M.rollT > 0) { M.rollT -= DT; return; }
  /* 초록 김 안 — 바깥(길 앞쪽)으로 */
  if (c.gas && hyp(c.gas.x - me.x, c.gas.z - me.z) < c.gas.r + 1.2) { const ax = me.x - c.gas.x, az = me.z - c.gas.z, L = hyp(ax, az) || 1; K.walk(c, c.gas.x + ax / L * (c.gas.r + 3), c.gas.z + az / L * (c.gas.r + 3), false, 0.3); return; }
  for (const d of c.dragons || []) {
    const w = M.w[d.kind]; if (!w) continue; const dd = hyp(d.x - me.x, d.z - me.z);
    /* 나이트메어 — 달아오르는 동안·터지는 동안 7.5m 밖에서 기다림 */
    if (d.kind === 'nightmare' && (w.on || w.waitT > 0) && dd < 8.5) { if (w.waitT > 0) w.waitT -= DT; const ax = me.x - d.x, az = me.z - d.z, L = hyp(ax, az) || 1; K.walk(c, d.x + ax / L * 9, d.z + az / L * 9, false, 0.4); return; }
    if (d.kind === 'nightmare' && w.waitT > 0) w.waitT -= DT;
    /* 내더 — 예고가 끝나는 순간(쏨 + 가시가 닿기 전)에 구르기 */
    if (d.kind === 'nadder' && w.on && !w.rolled && dd < 15 && (M.T - w.t0) > W - lag + 0.08) { w.rolled = true; K.set('KeyW', true); K.tap('Space'); M.rollT = 0.5; return; }
    /* 그롱클 — 쏜 걸 보면 멈춰 섬(앞날을 노리고 쏘니까) */
    if (d.kind === 'gronckle' && w.stopT > 0) { w.stopT -= DT; K.stop(); return; }
  }
  /* 길 — 피시레그가 보이면 그쪽, 문이 가까우면 문 */
  const gt = c.gate, gd = hyp(gt.x - me.x, gt.z - me.z);
  if (gd < 18) { goC(K, M, gt.x, gt.z, 2.5); return; }
  if (c.guide) { goC(K, M, c.guide.x, c.guide.z, 2.2); return; }
  K.stop(); window.DRG.bot.drag(5, 0);
};

/* ④ 양 지키기 — 볼라 더미 → 양을 문 테러의 앞날(속도 × 날아가는 시간)을 겨눠 던짐 */
BOTS['1-4'] = (s, K, M, B, lv) => {
  const c = K.cur, me = c.me, th = c.throw || {};
  if (!c.pile) return;
  if (!th.held) { K.set('KeyF', false); K.set('KeyA', false); K.set('KeyD', false); K.set('KeyS', false); if (!th.flying && goC(K, M, c.pile.x, c.pile.z, 1.5)) { K.stop(); if (cd(M, 'f', 0.6)) K.tap('KeyF'); } return; }
  const tg = (c.terrors || []).filter((t) => t.carry).sort((a, b) => hyp(a.x - me.x, a.z - me.z) - hyp(b.x - me.x, b.z - me.z))[0];
  if (!tg) { K.set('KeyF', false); K.stop(); K.face(c, c.pen.x, c.pen.z); return; }
  const d = hyp(tg.x - me.x, tg.z - me.z);
  const fl = 0.55 * (0.6 + d / 20) + (th.aim ? 0.05 : 0.3), px = tg.x + tg.vx * fl, pz = tg.z + tg.vz * fl;
  if (!th.aim && d > 11) { K.set('KeyF', false); goC(K, M, px, pz, 9); return; }
  K.stop();
  if (!th.aim) { if (K.face(c, px, pz)) K.set('KeyF', true); return; }
  steerAim(K, s, th, px, pz, 0.6);
};

/* ⑤ 볼라 발사기 — 빛 꼬리 머리의 움직임으로 앞날(날아가는 시간 + 반응)을 그려 조준 · F 누른 채 따라가다 맞으면 놓음 */
BOTS['1-5'] = (s, K, M, B, lv) => {
  const c = K.cur; if (!c.aim || !c.cam) return;
  const L = { x: c.cam.x, y: c.cam.y, z: c.cam.z };
  const cp = Math.cos(c.aim.pitch), dx = Math.sin(c.aim.yaw) * cp, dy = Math.sin(c.aim.pitch), dz = Math.cos(c.aim.yaw) * cp;
  L.x += dx * 2.4; L.y += dy * 2.4 - 0.6; L.z += dz * 2.4;                  // 카메라 앞 = 발사기
  M.T = (M.T || 0) + DT;
  if (c.head) { M.h = M.h || []; M.h.push([M.T, c.head.x, c.head.y, c.head.z]); while (M.h.length > 20) M.h.shift(); M.seenT = M.T; }
  let tx, ty, tz;
  if (M.h && M.h.length > 6 && M.T - M.seenT < 0.5) {
    const a = M.h[0], b = M.h[M.h.length - 1], dtm = b[0] - a[0] || 1e-3, vx = (b[1] - a[1]) / dtm, vy = (b[2] - a[2]) / dtm, vz = (b[3] - a[3]) / dtm;
    const dist = hyp(b[1] - L.x, b[2] - L.y, b[3] - L.z), tof = dist / 190 + 0.05;
    tx = b[1] + vx * tof; ty = b[2] + vy * tof; tz = b[3] + vz * tof;
  } else if (M.h && M.h.length) { const b = M.h[M.h.length - 1]; tx = b[1]; ty = b[2]; tz = b[3]; }
  else { K.set('KeyF', false); K.set('KeyW', true); K.set('KeyA', false); K.set('KeyD', false); if (c.aim.pitch > 0.5) K.set('KeyW', false); return; }
  const wy = Math.atan2(tx - L.x, tz - L.z), wp = Math.atan2(ty - L.y, hyp(tx - L.x, tz - L.z));
  const ey = Math.atan2(Math.sin(wy - c.aim.yaw), Math.cos(wy - c.aim.yaw)), ep = wp - c.aim.pitch;
  K.set('KeyA', ey > 0.012); K.set('KeyD', ey < -0.012);
  const fresh = M.T - (M.seenT || -9) < 0.25;
  if (!fresh) { K.set('KeyF', false); K.set('KeyW', ep > 0.012); K.set('KeyS', ep < -0.012); return; }
  if (Math.abs(ep) > 0.012) { K.set(ep > 0 ? 'KeyW' : 'KeyS', true); K.set(ep > 0 ? 'KeyS' : 'KeyW', false); } else { K.set('KeyW', false); K.set('KeyS', false); }
  if (!c.loaded) { K.set('KeyF', false); M.holdT = 0; return; }
  K.set('KeyF', true); M.holdT = (M.holdT || 0) + DT;
  if (M.holdT > 0.3 && Math.abs(ey) < 0.03 && Math.abs(ep) < 0.03) { K.set('KeyF', false); M.holdT = -0.6; }   // 놓음 = 쏨
};
