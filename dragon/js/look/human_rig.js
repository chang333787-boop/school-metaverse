// 사람 뼈를 코드로 움직임(viking.py 뼈 17) — 걷기·달리기 · 살금살금 · 손 내밀기(고개 돌림) · 던지기 · 숨쉬기
// 회전은 모델 축(X 옆 · Y 위 · Z 앞) — dragon_rig와 같은 방식 · 매 프레임 new 없음
import * as THREE from 'three';

const _q = new THREE.Quaternion(), _a = new THREE.Quaternion(), _w = new THREE.Quaternion(), _ri = new THREE.Quaternion();
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

export function bindAxes(bones, root) {
  root.updateMatrixWorld(true); root.getWorldQuaternion(_ri).invert();
  for (const k in bones) { const b = bones[k]; b.getWorldQuaternion(_w); _w.premultiply(_ri).invert(); b.userData.ax = AX.map((v) => v.clone().applyQuaternion(_w)); }
}
export function pose(b, rx, ry, rz) {
  if (!b) return; const A = b.userData.ax;
  _q.copy(b.userData.rest);
  if (ry) _q.multiply(_a.setFromAxisAngle(A[1], ry));
  if (rx) _q.multiply(_a.setFromAxisAngle(A[0], rx));
  if (rz) _q.multiply(_a.setFromAxisAngle(A[2], rz));
  b.quaternion.copy(_q);
}

export function createHumanRig(bones, root) {
  bindAxes(bones, root);
  const hips0 = bones.hips ? bones.hips.position.clone() : null;
  /* speed 0~1(걷기 0.5 · 달리기 1) · low 살금살금 0~1 · reach 손 내밀기 0~1 · away 고개 돌림 -1~1 · throw 던지기 0~1(올라갔다 내려옴) */
  const R = { ph: 0, speed: 0, low: 0, reach: 0, away: 0, throw: 0, t: 0 };
  R.update = (dt) => {
    R.t += dt;
    R.ph += dt * (4 + R.speed * 6) * (R.speed > 0.02 ? 1 : 0);
    const sw = Math.sin(R.ph) * R.speed * (1 - R.low * 0.4), k = R.low, br = Math.sin(R.t * 1.8) * 0.02;
    for (const s of [1, -1]) {
      const n = s > 0 ? 'R' : 'L', ss = s * sw;
      pose(bones['legU' + n], -ss * 0.65 - k * 0.7, 0, 0);
      pose(bones['legL' + n], Math.max(0, ss) * 0.9 + k * 1.1 + R.speed * 0.15, 0, 0);
      pose(bones['foot' + n], -k * 0.4, 0, 0);
      const reachArm = s > 0 ? R.reach : 0, thr = s > 0 ? R.throw : 0;
      pose(bones['armU' + n], ss * 0.55 - reachArm * 1.35 - thr * 2.4 + k * 0.3, 0, s * (0.12 + k * 0.1));
      pose(bones['armL' + n], -0.25 - Math.abs(sw) * 0.3 + reachArm * 0.2 - thr * 0.6, 0, 0);
    }
    pose(bones.spine, k * 0.35 + br, sw * 0.12, 0);
    pose(bones.chest, -k * 0.1, -sw * 0.18, 0);
    pose(bones.head, -k * 0.15 + R.reach * 0.25, R.away * 1.0, 0);
    if (hips0) bones.hips.position.set(hips0.x, hips0.y - Math.abs(Math.cos(R.ph)) * 0.025 * R.speed - k * 0.12, hips0.z);
  };
  return R;
}
