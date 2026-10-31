// 사람 자세 함수(viking.py 뼈 17 · +X = 사람의 왼쪽 L) — 값은 모두 0이 기본 · 0~1이 서로 더해져 부드럽게 섞임 · 매 프레임 new 없음
// 회전은 모델 축(X 옆 · Y 위 · Z 앞) — dragon_rig와 같은 방식 · 손에 드는 것은 handR 뼈에 그대로 붙임(뼈 머리 = 주먹 가운데 · 뼈 Z = 앞)
// 양(sheep · 뼈 legFL…)도 같은 함수로: speed 걷기 · low 풀 뜯기 · cower 움츠림
import * as THREE from 'three';

const _q = new THREE.Quaternion(), _a = new THREE.Quaternion(), _w = new THREE.Quaternion(), _ri = new THREE.Quaternion(), _v = new THREE.Vector3();
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const PI2 = Math.PI * 2;
const smooth = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

export function bindAxes(bones, root) {
  root.updateMatrixWorld(true); root.getWorldQuaternion(_ri).invert();
  const rp = new THREE.Vector3(), rs = new THREE.Vector3(); root.getWorldPosition(rp); root.getWorldScale(rs);
  for (const k in bones) {
    const b = bones[k]; b.getWorldQuaternion(_w); _w.premultiply(_ri).invert(); b.userData.ax = AX.map((v) => v.clone().applyQuaternion(_w));
    const wp = new THREE.Vector3(); b.getWorldPosition(wp); wp.sub(rp).applyQuaternion(_ri).divide(rs); b.userData.mp = wp;
  }
}
/* rx 앞뒤(+ = 매달린 팔다리가 뒤로 · 선 몸통이 앞으로 숙임) · ry 좌우로 돎(+ = 왼쪽) · rz 옆으로(+ = 왼쪽으로 기욺) */
export function pose(b, rx, ry, rz) {
  if (!b) return; const A = b.userData.ax;
  _q.copy(b.userData.rest);
  if (ry) _q.multiply(_a.setFromAxisAngle(A[1], ry));
  if (rx) _q.multiply(_a.setFromAxisAngle(A[0], rx));
  if (rz) _q.multiply(_a.setFromAxisAngle(A[2], rz));
  b.quaternion.copy(_q);
}

const KEYS = ['speed', 'low', 'reach', 'away', 'throw', 'hammer', 'carry', 'pet', 'ride', 'talk', 'stumble', 'rollDodge', 'sit', 'point', 'cheer', 'cower', 'lie'];

export function createHumanRig(bones, root) {
  bindAxes(bones, root);
  if (bones.legFL) return sheepRig(bones);
  const hips = bones.hips, hips0 = hips ? hips.position.clone() : null;
  const hipY = hips ? Math.max(0.3, hips.userData.mp.y) : 0.8;                       // 골반 높이(m)
  const crotch = bones.legUL ? bones.legUL.userData.mp.y : hipY * 0.95;
  const R = { ph: 0, hph: 0, t: 0 }; for (const k of KEYS) R[k] = 0;
  /* speed 0~1(걷기 0.5 · 달리기 1) · low 살금살금 · reach 손 내밀기 · away 고개 돌림 -1~1 · throw 던지기(올라갔다 내려옴)
     hammer 망치질 박자 · carry 두 손으로 들기 · pet 쓰다듬기 · ride 드래곤 타기(가랑이가 뿌리 높이로 내려옴 — 뿌리를 안장 위에)
     talk 손짓하며 말하기 · stumble 비틀 · rollDodge 구르기 진행 0→1 · sit 앉기(엉덩이 ≈ 무릎 높이) · point 가리키기 · cheer 두 팔 번쩍 · cower 움찔 · lie 옆으로 누움(왼쪽이 땅 · 무릎 조금 굽힘) */
  const L = { U: [0, 0, 0], L: [0, 0, 0], H: [0, 0, 0] };
  R.update = (dt) => {
    R.t += dt; const t = R.t;
    const rd = Math.max(0, Math.min(1, R.ride)), sit = Math.max(0, Math.min(1, R.sit)), still = Math.max(0, 1 - rd - sit);
    R.ph += dt * (4 + R.speed * 6) * (R.speed > 0.02 ? 1 : 0) * still;
    if (R.hammer > 0.01) R.hph += dt * PI2 * 1.25;
    const k = R.low, cw = R.cower, st = R.stumble, hm = R.hammer, ca = R.carry, pe = R.pet, tk = R.talk, pt = R.point, ch = R.cheer;
    const sw = Math.sin(R.ph) * R.speed * (1 - k * 0.4) * still, br = Math.sin(t * 1.8) * 0.02;
    const rp = Math.max(0, Math.min(1, R.rollDodge)), curl = Math.sin(Math.PI * rp), lie = Math.max(0, Math.min(1, R.lie));
    const bend = Math.max(k, cw * 0.6);                                                  // 무릎 굽힘(살금·움찔)
    /* 망치: 천천히 들고(0~0.7) 빠르게 내려침(0.7~1) */
    const hu = (R.hph / PI2) % 1, hA = 0.6 + 1.7 * (hu < 0.7 ? smooth(hu / 0.7) : 1 - smooth((hu - 0.7) / 0.3)), strike = hu >= 0.7 ? 1 : 0;
    const tA = Math.sin(t * 3.1), tB = Math.sin(t * 2.3 + 1.1), sA = Math.sin(t * 5.3), sB = Math.sin(t * 6.1 + 0.7);
    for (const s of [1, -1]) {
      const n = s > 0 ? 'L' : 'R', right = s < 0, ss = s * sw;
      /* 다리 */
      let uX = -ss * 0.65 - bend * 0.7 - rd * 1.15 - sit * 1.45 - curl * 1.5 + st * 0.25 * (right ? sA : sB), uZ = s * (rd * 0.55 + sit * 0.08 + st * 0.06);
      let lX = Math.max(0, ss) * 0.9 + bend * 1.1 + R.speed * 0.15 * still + rd * 1.5 + sit * 1.45 + curl * 2.0 + lie * (right ? 0.7 : 0.45);
      uX -= lie * (right ? 0.55 : 0.3);
      pose(bones['legU' + n], uX, 0, uZ);
      pose(bones['legL' + n], lX, 0, 0);
      pose(bones['foot' + n], -bend * 0.4 + rd * 0.5 - sit * 0.1, 0, 0);
      /* 팔: 걸음 흔들기 + 자세마다 더함 */
      let aX = ss * 0.55 * (1 - ca) * (1 - pt * (right ? 1 : 0)) + bend * 0.3, aY = 0, aZ = s * (0.1 + k * 0.1);
      let fX = -0.2 - Math.abs(sw) * 0.3, hX = 0;
      if (right) {
        aX += -R.reach * 1.35 - R.throw * 2.4 - hm * hA - pe * (0.95 + 0.12 * Math.sin(t * 4)) - pt * 1.5 - tk * (0.45 + 0.25 * tA);
        fX += R.reach * 0.2 - R.throw * 0.6 - hm * 0.5 * (1 - strike * 0.6) - pe * 0.35 + pt * 0.18 - tk * (0.7 + 0.3 * tB);
        aZ += -pt * 0.05 - tk * 0.15 * tB;
        hX += pe * 0.45 + hm * 0.3 * strike;
      } else {
        aX += -hm * 0.55 - tk * 0.25 * (1 + tB) - pt * 0.4; fX += -hm * 0.9 - tk * 0.5 - pt * 1.3; aZ += s * pt * 0.35;
      }
      aX += -ca * 0.95 - rd * 0.75 - sit * 0.3 - cw * 1.25 - curl * 1.0 - ch * 0.3 - lie * (right ? 0.5 : 1.2);
      fX += -ca * 0.85 - rd * 0.55 - sit * 0.55 - cw * 1.55 - curl * 1.3 - ch * 0.2 * (1 + Math.sin(t * 8 + s));
      aZ += -s * ca * 0.12 + s * rd * 0.1 - s * cw * 0.3 + s * st * 0.9 + s * ch * 2.55;
      pose(bones['armU' + n], aX, aY, aZ);
      pose(bones['armL' + n], fX, 0, 0);
      pose(bones['hand' + n], hX, 0, 0);
    }
    /* 몸통·머리 */
    const lean = k * 0.35 + hm * 0.12 * strike + pe * 0.2 + rd * 0.38 + sit * 0.08 + cw * 0.3 - ca * 0.08 + curl * 1.1 - st * 0.15 + R.throw * 0.1 - ch * 0.1;
    pose(bones.spine, lean + br, sw * 0.12 + tk * 0.06 * tB, st * 0.22 * sA);
    pose(bones.chest, -k * 0.1 + cw * 0.1 + curl * 0.3, -sw * 0.18 + hm * 0.1, st * 0.1 * sB);
    pose(bones.neck, cw * 0.15, 0, -lie * 0.25);
    pose(bones.head, -k * 0.15 + R.reach * 0.25 + pe * 0.2 + cw * 0.35 + curl * 0.5 - rd * 0.3 - ch * 0.25 - pt * 0.05 + tk * 0.08 * Math.sin(t * 2.3),
      R.away * 1.0 + st * 0.2 * sB, st * 0.15 * sA);
    if (hips0) {
      /* 굴러가기: 골반을 축으로 한 바퀴(앞으로) · 웅크린 공이 땅에 닿게 내림 */
      _v.set(0, -Math.abs(Math.cos(R.ph)) * 0.025 * R.speed * still - k * hipY * 0.17 - cw * hipY * 0.1 - sit * hipY * 0.45 - rd * crotch - curl * hipY * 0.5
        + ch * Math.abs(Math.sin(t * 6)) * 0.04 - lie * (hipY - 0.17), 0);
      hips.position.copy(hips0).add(_v);
      const lz = lie * 1.45;                                                            // 누움 = 골반째 왼쪽으로 눕힘
      if (rp > 0.001 && rp < 0.999) pose(hips, rp * PI2, 0, lz); else pose(hips, 0, 0, lz);
    }
  };
  return R;
}

/* 양 — speed 총총 · low 풀 뜯기(고개 숙임 + 오물오물) · cower 움츠림 */
function sheepRig(bones) {
  const R = { ph: 0, t: 0 }; for (const k of KEYS) R[k] = 0;
  const hips0 = bones.hips ? bones.hips.position.clone() : null;
  R.update = (dt) => {
    R.t += dt; const t = R.t;
    if (R.speed > 0.02) R.ph += dt * (6 + R.speed * 8);
    const sw = Math.sin(R.ph) * R.speed;
    for (const [n, off] of [['FL', 0], ['BR', 0], ['FR', Math.PI], ['BL', Math.PI]]) {
      const a = Math.sin(R.ph + off) * R.speed;
      pose(bones['leg' + n], -a * 0.5 + R.cower * 0.3 * (n[0] === 'F' ? 1 : -1), 0, 0);
      pose(bones['leg' + n + '2'], Math.max(0, Math.cos(R.ph + off)) * 0.5 * R.speed - R.cower * 0.4 * (n[0] === 'F' ? 1 : -1), 0, 0);
    }
    const graze = R.low;
    pose(bones.chest, Math.sin(t * 1.7) * 0.02, sw * 0.05, 0);
    pose(bones.neck, graze * 0.75 + R.cower * 0.2, Math.sin(t * 0.3) * 0.3 * (1 - graze), 0);
    pose(bones.head, graze * 0.35 + Math.sin(t * 7) * 0.05 * graze - R.cower * 0.1, Math.sin(t * 0.45) * 0.15, 0);
    if (hips0) bones.hips.position.set(hips0.x, hips0.y - Math.abs(Math.cos(R.ph)) * 0.03 * R.speed - R.cower * 0.06, hips0.z);
  };
  return R;
}
