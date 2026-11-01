// 장 파일 공용 손(탑뷰) — 말하기 · 목표 ▼ · F 자리 · 던지기(바라보는 쪽 · 떨어질 곳 점선 + 고리) · 맞음 · 예고(!) · 히컵 혼잣말(실패마다 · 유머 규칙)
import { shoot, FX, burst, puff } from '../play/fx.js?v=1';
import { hitBody } from '../play/body.js?v=1';
import { faceTo } from '../play/actors.js?v=1';
export { wait, until } from './runner.js?v=1';

export function say(G, who, text, o = {}) {
  G.hud.say(who, text, o.icons || [], o);
  const a = o.actor || G.cast.find(who); if (a) a.talkT = Math.min(5, 1.5 + text.length * 0.07);
}
export const talking = (G) => G.hud.busy();
export function goal(G, x, y, o = {}) { G.goal = x == null ? null : Object.assign({ x, y }, o); }
export const dist = (G, x, y) => Math.hypot(G.P.x - x, (G.P.y - y) * 1.25);
export const near = (G, x, y, r = 1.4) => dist(G, x, y) < r;
/* F 짧게 — 그 자리 가까이에서 · 쉬움은 F 키 그림 */
export function useAt(G, x, y, r = 1.4, label) { G.fspots.push({ x, y, label }); return near(G, x, y, r) && G.I.pressed.use; }
export const spot = (G, x, y, label) => G.fspots.push({ x, y, label });
export { faceTo };

/* 던지기 — 바라보는 쪽(8방향)으로 R m · 손 높이 1.2m에서 포물선(높이 z) · 떨어질 곳 점선 + 고리(쉬움·보통) */
export const THROW = { R: 5, v: 7 };
export function landing(G, R = THROW.R) { const P = G.P; return [P.x + P.fx * R, P.y + P.fy * R]; }
export function throwFrom(G, kind, o = {}) {
  const P = G.P, R = o.R ?? THROW.R, v = o.v ?? THROW.v, T = R / v, h0 = 1.2, g = 9.8;
  const vz = (0.5 * g * T * T - h0) / T;
  return shoot(Object.assign({ kind, x: P.x + P.fx * 0.3, y: P.y + P.fy * 0.3, z: h0, vx: P.fx * v, vy: P.fy * v, vz, g, mine: true, noWall: true }, o.shot || {}));
}
export function previewArc(G, R = THROW.R) {
  if (G.diff === 'hard') return;
  const P = G.P;
  for (let i = 1; i <= 5; i++) { const k = i / 6; G.marks.push({ k: 'dot', x: P.x + P.fx * R * k, y: P.y + P.fy * R * k, r: 2.5, c: 'rgba(244,234,210,.8)' }); }
  G.marks.push({ k: 'ring', x: P.x + P.fx * R, y: P.y + P.fy * R, r: 0.45, c: '#f4ead2' });
}
/* 날아온 것이 히컵에 맞나 — 평면 거리 + 높이 · 점프(피하기) 중이면 낮은 것은 넘음 */
export function hitsMe(G, s, o = {}) {
  const P = G.P, d = Math.hypot(s.x - P.x, (s.y - P.y) * 1.3);
  if (d > (o.r ?? 0.45) + (s.r || 0.2)) return false;
  if (s.z > P.z + 1.7) return false;
  if (P.dodge && s.z < P.z + 0.3 + (o.low ?? 0.5)) return false;
  return true;
}
export function knock(G, ux, uy, power = 1) {
  if (!hitBody(G.P, ux, uy, G.diff, power)) return false;
  burst('dust', G.P.x, G.P.y, 0.3, 6, 2, 0.5, 0.25, G.rng);
  G.sfx.play('thud', { x: G.P.x });
  oops(G);
  return true;
}
/* 히컵 혼잣말 — 넘어지거나 실패할 때(design §9 · 우리 말로 새로) */
const OOPS = ['마을에서 제일 가벼우니까… 떨어지는 소리는 작지.', '괜찮아. 넘어지는 건 내 특기야.', '다음엔 더 잘할 거야. 아마도.', '방금 건 연습이었어. 진짜야.', '아이고… 바이킹 체면이 말이 아니네.'];
let oopsT = -99;
export function oops(G) { if (G.t - oopsT < 8 || G.hud.busy()) return; oopsT = G.t; G.hud.say('hiccup', OOPS[Math.floor(G.rng() * OOPS.length)], [], { secs: 2.4 }); }
/* 예고 ! — 드래곤 머리 위(소리가 꺼져도 보이는 짝 신호) */
export function bang(G, a, h = 2.6) { G.marks.push({ k: '!', x: a.x, y: a.y - (a.z || 0) - h }); }
export const sfx = (G, n, x) => G.sfx.play(n, x != null ? { x } : undefined);
export { shoot, FX, burst, puff };
