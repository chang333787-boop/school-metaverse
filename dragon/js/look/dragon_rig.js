// 드래곤 뼈를 코드로 움직임 — 숨쉬기 · 날갯짓(속도 따라) · 활공 · 접기 · 꼬리 흔들기 · 귀 판(감정) · 고개 돌리기
// 회전은 '모델 축'(X 옆 · Y 위 · Z 앞)으로 준다 — 처음에 뼈마다 모델 축을 뼈 자신의 축으로 바꿔 둠(뼈 roll과 상관없음)
// 매 프레임 new 없음 · 먼 드래곤은 부르는 쪽에서 15Hz로
import * as THREE from 'three';

const _q = new THREE.Quaternion(), _a = new THREE.Quaternion(), _w = new THREE.Quaternion(), _ri = new THREE.Quaternion();
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

export function createDragonRig(bones, root) {
  root.updateMatrixWorld(true);
  root.getWorldQuaternion(_ri).invert();
  for (const k in bones) {                                  // 뼈 축 = (뼈 월드 회전)⁻¹ · 모델 축
    const b = bones[k]; b.getWorldQuaternion(_w); _w.premultiply(_ri).invert();
    b.userData.ax = AX.map((v) => v.clone().applyQuaternion(_w));
  }
  /* rx·ry·rz = 모델 X(옆)·Y(위)·Z(앞) 축 둘레 회전(라디안) */
  function pose(b, rx, ry, rz) {
    if (!b) return; const A = b.userData.ax;
    _q.copy(b.userData.rest);
    if (ry) _q.multiply(_a.setFromAxisAngle(A[1], ry));
    if (rz) _q.multiply(_a.setFromAxisAngle(A[2], rz));
    if (rx) _q.multiply(_a.setFromAxisAngle(A[0], rx));
    b.quaternion.copy(_q);
  }
  const R = { flap: 0, flapRate: 0, glide: 0, fold: 1, ear: 0, look: 0, pupil: 1, t: 0 };
  /* flapRate 날갯짓 세기 · glide 펴고 미끄러지기 · fold 접기(땅) · ear -1 뒤로 눕힘(화) ~ 1 쫑긋(궁금) · look 고개 좌우 · pupil 동공 0 가늚 ~ 1 둥긂 */
  R.update = (dt) => {
    R.t += dt; const t = R.t;
    if (R.flapRate > 0.02) R.flap += dt * (1.6 + R.flapRate * 2.2) * Math.PI * 2;
    const f = Math.sin(R.flap) * R.flapRate, fold = R.fold, open = 1 - fold;
    for (const s of [1, -1]) {
      const n = s > 0 ? 'R' : 'L';
      /* 날갯짓 = 앞 축(Z) 둘레로 위아래(오른쪽은 +가 아래) · 접기 = 위 축(Y) 둘레로 뒤로 젖힘 + 조금 들어 올림 */
      /* 접기 = 박쥐처럼 지그재그: 위팔 뒤로 · 아래팔 앞으로 접어 위팔에 붙임 · 손 다시 뒤로 */
      pose(bones['wing1' + n], 0, s * 1.15 * fold, s * (open * (f * 0.7 + 0.05 - R.glide * 0.08) - fold * 0.55));
      pose(bones['wing2' + n], 0, -s * 2.55 * fold, s * (open * f * 0.35 + fold * 0.25));
      pose(bones['wing3' + n], 0, s * 2.75 * fold, s * open * (f * 0.3 + Math.sin(R.flap - 0.6) * R.flapRate * 0.15));
      const w3 = bones['wing3' + n]; if (w3) w3.scale.setScalar(1 - 0.6 * fold);         // 손가락을 오므림(접으면 막이 줄어듦)
      pose(bones['ear' + n], -0.5 * R.ear, 0, 0);
      const pu = bones['pupil' + n]; if (pu) pu.scale.set(0.25 + 0.75 * R.pupil, 1, 1);   // 동공: 0 = 가는 세로 틈(경계) ~ 1 = 둥긂(편안)
    }
    const br = Math.sin(t * 1.6) * 0.025;
    pose(bones.chest, br, 0, 0);
    pose(bones.neck1, -br * 0.5, R.look * 0.3, 0);
    pose(bones.neck2, 0, R.look * 0.35, 0);
    pose(bones.head, 0, R.look * 0.2, 0);
    for (let i = 1; i <= 6; i++) pose(bones['tail' + i], 0, Math.sin(t * 1.3 - i * 0.6) * 0.08 * (0.4 + i * 0.12), 0);
  };
  return R;
}
