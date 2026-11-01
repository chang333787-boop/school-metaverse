// 배우(탑뷰) — 사람·드래곤(이름 없는 역할은 그림만) · 걷기(to = [x, y]) · 바라보기(dir 앞·뒤·옆 + flip) · 높이 z(날기)
// 마음 엔진(design §3-1 줄임): 빠르게 다가감·달리기·코앞 점프·F 마구 = 두려움↑ · 살금살금·멈춤 = 두려움↓ · 손 내밀고 고개 돌림 = 믿음↑
import { drawPerson, drawDragon, SIZE } from '../art/actors.js?v=1';

export function createCast() {
  const C = { list: [] };
  const base = (o) => Object.assign({ to: null, spd: 3, walk: 0, z: 0, flip: -1, dir: 'side', talkT: 0 }, o);
  C.person = (who, x, y, o = {}) => { const a = base(Object.assign({ type: 'person', who, x, y, spd: 3.2, pose: {} }, o)); a.pose = Object.assign({}, o.pose || {}); a.dir = o.dir || 'down'; C.list.push(a); return a; };
  C.dragon = (kind, x, y, o = {}) => {
    const a = base(Object.assign({ type: 'dragon', kind, x, y, fear: 0.5, trust: 0, look: 1 }, o));
    a.pose = Object.assign({ pupil: 0.5, ears: 0, wing: 0, flap: 0 }, o.pose || {});
    C.list.push(a); return a;
  };
  C.remove = (a) => { const i = C.list.indexOf(a); if (i >= 0) C.list.splice(i, 1); };
  C.clear = (keep) => { C.list = keep ? C.list.filter((a) => a.keep) : []; };
  C.find = (who) => C.list.find((a) => a.who === who || a.kind === who);
  C.step = (dt) => {
    for (const a of C.list) {
      if (a.to) {
        const dx = a.to[0] - a.x, dy = a.to[1] - a.y, d = Math.hypot(dx, dy), s = a.spd * dt;
        if (d <= s) { a.x = a.to[0]; a.y = a.to[1]; a.to = null; a.moving = false; } else { a.x += dx / d * s; a.y += dy / d * s; a.moving = true; faceDir(a, dx, dy); }
      } else a.moving = false;
      if (a.type === 'person') { a.pose.speed = a.moving ? Math.min(1, a.spd / 7.5 * 1.25) : 0; if (a.moving) a.walk = (a.walk + a.spd * dt / 1.6) % 1; a.pose.walk = a.walk; }
      else {
        if (a.moving) a.walk = (a.walk + a.spd * dt / 2.4) % 1; a.pose.walk = a.moving ? a.walk : 0;
        if (a.z > 0.3 || a.pose.wing > 0.5) a.pose.flap = ((a.pose.flap || 0) + dt * (a.flapHz || 1.3)) % 1;
        const tp = a.pupilTo ?? (1 - a.fear); a.pose.pupil += (tp - a.pose.pupil) * Math.min(1, dt * 4);
      }
      if (a.talkT > 0) { a.talkT -= dt; a.pose.talk = (a.talkT * 6 % 1) < 0.5 ? 1 : 0; } else a.pose.talk = 0;
    }
  };
  return C;
}
/* 바라보기 — 사람은 앞·뒤·옆 · 드래곤은 옆(투슬리스만 앞·뒤도) */
export function faceDir(a, dx, dy) {
  if (Math.abs(dx) > 0.05) a.flip = dx > 0 ? 1 : -1;
  const vert = Math.abs(dy) > Math.abs(dx) * 1.2;
  if (a.type === 'person' || a.kind === 'toothless') a.dir = vert ? (dy < 0 ? 'up' : 'down') : 'side';
  else a.dir = 'side';
}
export const faceTo = (a, x, y) => faceDir(a, x - a.x, y - a.y);
/* 그리기 하나(발 자리) — 그림자는 따로(drawShadow) */
export function drawActor(V, a, t) {
  const ctx = V.ctx;
  V.at(a.x, a.y, a.dir === 'side' ? a.flip : 1, a.scale || 1);
  if (a.alpha != null) ctx.globalAlpha = a.alpha;
  a.pose.dir = a.dir; a.pose.z = a.z;
  if (a.type === 'person') drawPerson(ctx, a.who, a.pose, t); else drawDragon(ctx, a.kind, a.pose, t);
  ctx.globalAlpha = 1;
}
export function shadowR(a) { const s = SIZE[a.who || a.kind] || [1, 1]; return a.type === 'person' ? 0.32 : Math.min(2.4, s[0] * 0.32); }
export const sizeOf = (k) => SIZE[k] || [3, 2];

/* 마음 한 걸음 — P(히컵)와의 관계로 두려움·믿음 · 돌려줌: 놀라 물러날 일인가 */
export function mindStep(D, P, dt, o = {}) {
  const dx = P.x - D.x, dy = P.y - D.y, d = Math.hypot(dx, dy) || 1e-3;
  const towards = -(dx * P.vx + dy * P.vy) / d;              // 나에게 다가오는 빠르기
  const near = d < (o.near ?? 5);
  let scare = 0;
  if (near && towards > (o.fastV ?? 2.6)) scare += 1.4;
  if (P.air && near && !P.hop) scare += 0.6;
  if (P.carry && o.weaponScares && near && D.look > 0.5) scare += o.weaponScares;
  if (P.mashT > 0 && near) scare += 1.2;
  const calmish = (P.crouch > 0.5 || Math.hypot(P.vx, P.vy) < 0.4) && !P.air;
  if (scare > 0) D.fear = Math.min(1, D.fear + scare * dt);
  else if (calmish && d < (o.calmR ?? 8)) D.fear = Math.max(o.minFear ?? 0, D.fear - (o.calmK ?? 0.12) * dt * (P.hand > 0.6 ? 2 : 1));
  if (P.hand > 0.6 && P.look < -0.5 && d < (o.handR ?? 3.2) && D.fear < 0.35) D.trust = Math.min(1, D.trust + (o.trustK ?? 0.25) * dt);
  D.pose.ears = 1 - D.fear * 2;
  return D.fear > (o.bolt ?? 0.92);
}
