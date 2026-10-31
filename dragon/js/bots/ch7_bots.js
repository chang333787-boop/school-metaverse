// 7장 봇 — BOTS['7-1'] = (s, K, M, B, level, now) · s = 반응 늦은 감각 · K = 몸(walk·go·face·tap·set·stop) · K.cur = 지금 화면(손·눈 움직임만) · story_bots.js가 합침
// DRG.sense()만 읽고 키만 누름(상태 쓰기 X) · 초당 6타 · 동시 키 셋
import { planPath } from './story_bots.js?v=17';
export const BOTS = {};
const cd = (M, k, sec) => { M[k] = (M[k] || 0) - 1 / 60; if (M[k] <= 0) { M[k] = sec; return true; } return false; };
/* 촘촘한 길 찾기(대장간 뒷방 문 1.2m처럼 좁은 틈) — 보이는 벽·바위(sense.obst)로 · 막히면 다시 찾음 */
function goFine(s, K, M, tx, tz, slow, arrive = 1) {
  const me = K.cur.me, ob = K.cur.obst || { walls: [], rocks: [] };
  if (Math.hypot(tx - me.x, tz - me.z) < arrive) { K.stop(); M.fp = null; return true; }
  const key = tx.toFixed(1) + ',' + tz.toFixed(1);
  if (!M.fp || M.fpKey !== key || M.fk >= M.fp.length || (M.fpT = (M.fpT || 0) + 1 / 60) > 3) {
    M.fpT = 0; M.fpKey = key; M.fk = 0;
    M.fp = planPath(me.x, me.z, tx, tz, ob.walls, 0.4, 0.3, 6, ob.rocks.map((r) => [r[0], r[1], Math.max(0, r[2] - 0.1)])) || [[tx, tz]];
  }
  const p = M.fp[M.fk]; if (K.walk(s, p[0], p[1], slow, M.fk === M.fp.length - 1 ? arrive : 0.5)) M.fk++;
  K.path = M.fp; K.pk = M.fk;
  return false;
}
const angd = (a, b) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));

/* ① 숫돌 — 작업대 → 발판이 바닥에 닿을 때(on) Space 한 번 */
BOTS['7-1'] = (s, K, M) => {
  const b = (K.cur && K.cur.bench) || s.bench || {};
  if (b.kind !== 'grind') { if (s.at && K.go(s, s.at.x, s.at.z, false, 1.8)) { K.stop(); if (cd(M, 'f', 1)) K.tap('KeyF'); } return; }
  if (b.on && !b.slip && !M.hit) { M.hit = true; K.tap('Space'); }
  if (!b.on) M.hit = false;
};
/* ② 투구 — 아빠가 내밀면 가서 F */
BOTS['7-2'] = (s, K, M) => { if (s.stage !== 'take' || !s.target) { K.stop(); return; } if (K.go(s, s.target.x, s.target.z, false, 2.0)) { K.stop(); if (cd(M, 'f', 1)) K.tap('KeyF'); } };
/* ③ 최종 선발 — 아스트리드보다 가까이(4.4m) 서서 눈길을 끎 · 볼이 부풀면 방패(F 한 번) · 쏜 뒤 틈에 들어가 풀(F) · 지쳤으면 손 내밀기(F 꾹) */
BOTS['7-3'] = (s, K, M, B) => {
  const g = s.gr, me = K.cur.me;
  if (!g) { K.stop(); K.set('KeyF', false); B.drag(5, 0); return; }
  const d = Math.hypot(g.x - me.x, g.z - me.z);
  if (g.tired) { if (K.walk(s, g.x, g.z, false, 2.3)) { K.stop(); K.face(s, g.x, g.z); K.set('KeyF', true); } return; }
  K.set('KeyF', false);
  if (g.gap || (s.diff === 'easy' && !g.puff)) { if (K.walk(s, g.x, g.z, false, 2.6)) { K.stop(); if (cd(M, 'f', 0.5)) K.tap('KeyF'); } return; }
  if (g.puff) { K.stop(); K.face(s, g.x, g.z); if (d >= 3.4 && !M.banged) { M.banged = true; K.tap('KeyF'); } return; }
  M.banged = false;
  if (d > 4.9) K.walk(s, g.x, g.z, false, 4.4); else if (d < 3.6) K.walk(s, me.x + (me.x - g.x), me.z + (me.z - g.z), false, 0.3); else { K.stop(); K.face(s, g.x, g.z); }
};
/* ④ 원로 앞 → 순위판 */
BOTS['7-4'] = (s, K) => { if (s.target) K.go(s, s.target.x, s.target.z, false, s.stage === 'board' ? 2.0 : 1.1); else K.stop(); };
/* ⑤ 짐 넷 — 빈손이면 그냥 걸어 줍고 · 들면 살금살금 · 다음 걸음이 눈길(부채꼴) 안이면 기다리거나 물러남 */
function seen(eyes, x, z, low, pad = 0.9) {
  for (const e of eyes) { if (!e.r) continue; const r = e.r * (low ? 0.55 : 1) + pad, dx = x - e.x, dz = z - e.z, d = Math.hypot(dx, dz); if (d < r && angd(e.yaw, Math.atan2(dx, dz)) < e.half + 0.25) return true; }
  return false;
}
BOTS['7-5'] = (s, K, M, B) => {
  const me = K.cur.me, eyes = (K.cur.eyes || s.eyes || []);
  if (s.carry == null) return;
  if (s.carry < 0) {
    M.back = null;
    const it = (s.items || []).slice().sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
    if (!it) { K.stop(); B.drag(5, 0); return; }
    if (goFine(s, K, M, it.x, it.z, false, 1.3)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); }
    return;
  }
  /* 들고 감 — 가까이 눈이 있으면 살금살금 */
  const near = eyes.some((e) => Math.hypot(e.x - me.x, e.z - me.z) < 12);
  const sk = s.sack; if (!sk) return;
  if (Math.hypot(sk.x - me.x, sk.z - me.z) < 1.9) { K.stop(); if (cd(M, 'f', 0.7)) K.tap('KeyF'); return; }
  /* 앞으로 1.2m 갈 자리가 눈길 안이면 멈춤 · 지금 자리가 눈길 안이면 뒤로 */
  const p = K.path && K.path[K.pk], hx = p ? p[0] : sk.x, hz = p ? p[1] : sk.z, hd = Math.hypot(hx - me.x, hz - me.z) || 1;
  const ax = me.x + (hx - me.x) / hd * 1.2, az = me.z + (hz - me.z) / hd * 1.2;
  if (seen(eyes, me.x, me.z, me.low, 0.2)) { M.back = M.back || { x: me.x - (hx - me.x) / hd * 3, z: me.z - (hz - me.z) / hd * 3 }; K.walk(s, M.back.x, M.back.z, null, 0.4); return; }
  M.back = null;
  if (seen(eyes, ax, az, near, 0.9)) { K.stop(); return; }
  goFine(s, K, M, sk.x, sk.z, near, 1.6);
};
/* ⑥ 코브 — 쉬는 바위 곁에 짐 */
BOTS['7-6'] = (s, K, M) => { if (!s.target) return; if (K.go(s, s.target.x, s.target.z, false, 1.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } };
