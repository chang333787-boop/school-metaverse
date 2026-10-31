// 드래곤 자세 함수 — 뼈를 코드로 돌림(모든 종 같은 뼈 이름 · stage3_plan §4 · tools/dragon_blender/dragon.py)
// 값은 모두 0이 기본(fold·pupil만 1) · 0~1 사이 값이 서로 더해져 부드럽게 섞임 · 매 프레임 new 없음
// 회전은 '모델 축'(X 왼쪽 · Y 위 · Z 앞)으로 준다 — 뼈마다 모델 축을 뼈 자신의 축으로 바꿔 둠(뼈 roll과 상관없음)
// 날개 접기 = 박쥐처럼: 위팔은 뒤·아래로 · 아래팔은 앞으로 · 손가락은 뒤로 모아 몸 옆에 세로로 붙임(미리 셈한 자세로 slerp)
import * as THREE from 'three';
import * as KIT from './kit.js?v=15';

const _q = new THREE.Quaternion(), _a = new THREE.Quaternion(), _w = new THREE.Quaternion(), _ri = new THREE.Quaternion();
const _m0 = new THREE.Matrix4(), _m1 = new THREE.Matrix4(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Vector3();
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);
const PI2 = Math.PI * 2;

/* 종마다 다른 몸짓 — jaw 입 최대(라디안) · flapHz 날갯짓 빠르기 · stepHz 걸음 빠르기 · biped 뒷다리로 걷는 종(앞다리는 작게) */
const SPEC = {
  toothless:  { jaw: 0.62, flapHz: 1.0, stepHz: 0.95, biped: false },
  gronckle:   { jaw: 0.5,  flapHz: 3.2, stepHz: 1.35, biped: false },
  nadder:     { jaw: 0.5,  flapHz: 1.3, stepHz: 1.1,  biped: true },
  zippleback: { jaw: 0.6,  flapHz: 1.2, stepHz: 0.95, biped: false },
  nightmare:  { jaw: 0.72, flapHz: 0.85, stepHz: 0.8, biped: false },
  terror:     { jaw: 0.65, flapHz: 2.2, stepHz: 2.0,  biped: false },
};
const ALIAS = { nightfury: 'toothless' };

/* 접은 날개 목표(왼쪽 날개 기준 · 오른쪽은 X 거울) — [뼈 방향, 막 법선] 모델 축 */
/* 막이 팔 아래로 드리워 옆구리 위쪽을 덮게: 위팔·손가락은 막 윗면이 몸 쪽(법선 안쪽) · 아래팔은 앞으로 접히며 뒤집힘(법선 바깥) — 모든 막이 옆구리와 나란한 한 판
   손가락은 접을 때 0.6배로 오므림(끝이 엉덩이 근처 · 날개 묶음이 몸통 길이 안에 듦) */
const FOLD = {
  w1: [[0.12, -0.04, -1], [-1, -0.5, 0]],        // 위팔: 뒤로 · 조금 밖
  w2: [[0.05, 0.03, 1], [1, 0.5, 0]],            // 아래팔: 앞으로 접어 위팔 곁에 포갬(손목 = 어깨 옆)
  f:  (i) => [[0.05, -0.03 - 0.045 * i, -1], [-1, -0.5, 0]],   // 손가락: 뒤로 모음 · 아래로 조금씩 부채
  shrink: 0.4,
};

function basis(m, d, n) {                          // 열 = (방향, 법선, 방향×법선)
  _d.copy(d).normalize(); _n.copy(n).addScaledVector(_d, -n.dot(_d)).normalize();
  _c.crossVectors(_d, _n); return m.makeBasis(_d, _n, _c);
}

export function createDragonRig(bones, root, species) {
  let kind = ALIAS[species] || species;
  if (!SPEC[kind]) kind = root.userData.info && root.userData.info.species;               // models.js가 뼈대 노드 extras에서 읽어 둠
  if (!SPEC[kind]) kind = bones.headA ? 'zippleback' : 'toothless';
  const sp = SPEC[kind];
  root.updateMatrixWorld(true);
  root.getWorldQuaternion(_ri).invert();
  const rootPos = new THREE.Vector3(); root.getWorldPosition(rootPos);
  const rootScale = new THREE.Vector3(); root.getWorldScale(rootScale);
  for (const k in bones) {                         // 뼈 축 = (모델 공간 쉬는 회전)⁻¹ · 모델 축
    const b = bones[k]; b.getWorldQuaternion(_w); _w.premultiply(_ri);
    b.userData.mq = _w.clone();
    _w.invert(); b.userData.ax = AX.map((v) => v.clone().applyQuaternion(_w));
    b.userData.p0 = b.position.clone(); b.userData.s0 = b.scale.clone();
    const wp = new THREE.Vector3(); b.getWorldPosition(wp); wp.sub(rootPos).applyQuaternion(_ri).divide(rootScale); b.userData.mp = wp;   // 모델 공간 머리 자리
  }
  /* rx·ry·rz = 모델 X(옆)·Y(위)·Z(앞) 축 둘레 회전(라디안) · 쉬는 자세에서 */
  function pose(b, rx, ry, rz) {
    if (!b) return; const A = b.userData.ax;
    _q.copy(b.userData.rest);
    if (ry) _q.multiply(_a.setFromAxisAngle(A[1], ry));
    if (rz) _q.multiply(_a.setFromAxisAngle(A[2], rz));
    if (rx) _q.multiply(_a.setFromAxisAngle(A[0], rx));
    b.quaternion.copy(_q);
  }
  /* ── 접은 날개 자세를 미리 셈(뼈마다 지역 회전) ── */
  const wings = [];
  for (const [side, sx] of [['L', 1], ['R', -1]]) {
    const w1 = bones['wing1' + side], w2 = bones['wing2' + side]; if (!w1 || !w2) continue;
    const fingers = []; for (let i = 3; i <= 8; i++) if (bones['wing' + i + side]) fingers.push(bones['wing' + i + side]);
    const target = (b, dn) => {                    // 모델 공간 접은 회전 = F(목표) · F(쉼)⁻¹ · 쉼
      const d0 = _v.set(0, 1, 0).applyQuaternion(b.userData.mq).clone(), n0 = UP.clone();
      basis(_m0, d0, n0);
      const d1 = new THREE.Vector3(dn[0][0] * sx, dn[0][1], dn[0][2]), n1 = new THREE.Vector3(dn[1][0] * sx, dn[1][1], dn[1][2]);
      basis(_m1, d1, n1); _m1.multiply(_m0.transpose());
      return new THREE.Quaternion().setFromRotationMatrix(_m1).multiply(b.userData.mq);
    };
    const M1 = target(w1, FOLD.w1), M2 = target(w2, FOLD.w2);
    const par = w1.parent && w1.parent.userData.mq ? w1.parent.userData.mq : new THREE.Quaternion();
    w1.userData.qf = par.clone().invert().multiply(M1);
    w2.userData.qf = M1.clone().invert().multiply(M2);
    fingers.forEach((f, i) => { f.userData.qf = M2.clone().invert().multiply(target(f, FOLD.f(i))); });
    wings.push({ s: sx, w1, w2, fingers });
  }
  /* ── 머리(지플백은 둘) ── */
  const heads = [];
  for (const hs of (bones.headA ? ['A', 'B'] : [''])) {
    heads.push({ n1: bones['neck1' + hs], n2: bones['neck2' + hs], h: bones['head' + hs], j: bones['jaw' + hs],
      ears: [bones['ear' + hs + 'L'], bones['ear' + hs + 'R']].filter(Boolean), pupils: [bones['pupil' + hs + 'L'], bones['pupil' + hs + 'R']].filter(Boolean),
      ph: hs === 'B' ? 2.1 : 0, lk: hs === 'B' ? -1 : 1 });
  }
  const legs = [];
  for (const [fb, side, off] of [['B', 'L', 0], ['F', 'L', 0.25], ['B', 'R', 0.5], ['F', 'R', 0.75]]) {
    const u = bones['leg' + fb + side], l = bones['leg' + fb + side + '2']; if (!u || !l) continue;
    const len = u.userData.mp.distanceTo(l.userData.mp) + l.userData.mp.y;           // 어깨 높이 ≈ 다리 길이
    legs.push({ u, l, front: fb === 'F', s: side === 'L' ? 1 : -1, off: sp.biped ? (fb === 'B' ? (side === 'L' ? 0 : 0.5) : (side === 'L' ? 0.5 : 0)) : off, len, z: u.userData.mp.z });
  }
  const tails = []; for (let i = 1; i <= 6; i++) if (bones['tail' + i]) tails.push(bones['tail' + i]);
  const h0 = bones.hips ? Math.max(0.1, bones.hips.userData.mp.y) : 1;                // 엉덩이 높이(눕기·웅크림 셈)
  const rb = bones.root, rootP0 = rb ? rb.position.clone() : null;
  const rootParQ = new THREE.Quaternion(); if (rb && rb.parent) { rb.parent.getWorldQuaternion(rootParQ); rootParQ.premultiply(_ri).invert(); }
  /* 나이트메어 몸 불: 몸 재질 발광 + (kit에 flameMesh가 있으면) 등 위 불꽃 */
  let blazeMat = null; const flames = []; let flamesMade = false;
  root.traverse((o) => { if (o.isMesh && o.userData.mat === 'nm_body') blazeMat = o.material; });

  const R = { flap: 0, flapRate: 0, glide: 0, fold: 1, ear: 0, look: 0, pupil: 1, t: 0,
    walk: 0, crouch: 0, pounce: 0, jaw: 0, teeth: 0, tilt: 0, headUp: 0, lie: 0, roll: 0, tailCurl: 0, spines: 0, puff: 0, blaze: 0, struggle: 0, sniff: 0,
    wph: 0, rph: 0, species: kind, flapHz: sp.flapHz };
  /* flapRate 날갯짓 세기 · glide 펴고 미끄러지기 · fold 접기(땅) · ear -1 뒤로 눕힘(화) ~ 1 쫑긋(궁금) · look 고개 좌우 · pupil 0 가는 틈(경계) ~ 1 둥긂(편안)
     walk 걸음 빠르기 · crouch 웅크림(경계) · pounce 덮치기 앞 낮춤 · jaw 입 · teeth 이빨 0 들어감 ~ 1 나옴 · tilt 고개 갸웃(-1~1) · headUp -1 숙임 ~ 1 듦
     lie 옆으로 털썩 · roll 등으로 뒹굴기 · tailCurl 꼬리 감춤(겁) · spines 가시 세움(내더) · puff 배·볼 부풂(그롱클) · blaze 몸 불(나이트메어) · struggle 묶여 버둥 · sniff 킁킁 */
  R.update = (dt) => {
    R.t += dt; const t = R.t;
    const W = R.walk, cr = R.crouch, po = R.pounce, li = R.lie, ro = R.roll, st = R.struggle, sn = R.sniff;
    if (R.flapRate > 0.02) R.flap += dt * (1.6 + R.flapRate * 2.2) * Math.PI * 2;   // 예전 식 그대로(비행 엔진이 이 몫을 미리 뺌) · 종마다 빠르기는 R.flapHz로 알려만 줌
    if (W > 0.01) R.wph += dt * PI2 * sp.stepHz * (0.55 + 1.0 * W);
    if (ro > 0.01) R.rph += dt * PI2 * 0.5;
    const s1 = Math.sin(t * 7.3), s2 = Math.sin(t * 5.1 + 1.3), s3 = Math.sin(t * 9.7 + 0.4);
    const br = Math.sin(t * (1.6 - li * 0.6)) * 0.025 * (1 + li);
    /* ── 몸 전체(뿌리 뼈 · 땅 위 원점이 축) ── */
    const lie = li * (1 - ro), rollA = ro * (2.7 + Math.sin(R.rph) * 0.45);
    const rz = lie * 1.32 + rollA + st * 0.07 * s1 + W * Math.sin(R.wph) * 0.025;
    const pitch = po * 0.13 + st * 0.04 * s2;
    const down = h0 * (cr * 0.2 + po * 0.08) + W * h0 * 0.025 * (0.5 - 0.5 * Math.cos(2 * R.wph));
    const flat = Math.min(1, lie + ro);
    const ht = h0 - (h0 - h0 * (ro > lie ? 0.62 : 0.5)) * flat;                  // 누웠을 때 엉덩이 높이
    if (rb) {
      pose(rb, pitch, 0, rz);
      _v.set(h0 * Math.sin(rz) * 0.85 * flat, (ht - h0 * Math.cos(rz)) * flat - down * (1 - flat) + (st ? Math.abs(s2) * 0.04 * h0 * st : 0), 0).applyQuaternion(rootParQ);
      rb.position.copy(rootP0).add(_v);
    }
    pose(bones.hips, -br * 0.3, Math.sin(R.wph) * 0.05 * W - (po ? Math.sin(t * 9) * 0.06 * po : 0), 0);
    pose(bones.chest, br - cr * 0.04, -Math.sin(R.wph) * 0.06 * W + st * 0.08 * s3, -st * 0.05 * s1);
    if (bones.belly) bones.belly.scale.setScalar(1 + 0.24 * R.puff);
    /* ── 다리: 웅크리면 굽혀 발은 땅에 · 걸음새 · 누우면 늘어짐 · 뒹굴면 허우적 ── */
    for (let i = 0; i < legs.length; i++) {
      const L = legs[i], dir = L.front ? 1 : -1;
      const drop = Math.max(0, down + L.z * Math.sin(pitch) * (L.front ? 1 : 1));
      const a = Math.acos(Math.max(0.35, Math.min(1, 1 - drop / L.len))) * (1 - flat);
      const ph = R.wph + L.off * PI2, small = sp.biped && L.front ? 0.25 : 1;
      const swing = -Math.sin(ph) * 0.42 * W * small, lift = Math.max(0, Math.cos(ph)) * 0.75 * W * small;
      const kick = st * (0.35 * Math.sin(t * 8 + i * 1.7)) + ro * 0.5 * Math.sin(R.rph * 2 + i * 1.3);
      const rest = sp.biped && L.front ? 0.35 : 0;                              // 내더 앞다리는 가슴 앞에 모음
      pose(L.u, dir * a + swing + kick + flat * 0.25 * (L.front ? -1 : 1) - rest, 0, L.s * (flat * 0.25 + st * 0.08));
      pose(L.l, -dir * 2 * a + lift + flat * 0.4 + Math.max(0, kick) * 0.6 + rest * 1.6, 0, 0);
    }
    /* ── 목·머리 ── */
    for (const H of heads) {
      const idle = Math.sin(t * 0.5 + H.ph) * 0.05, lk = R.look * (H.lk > 0 ? 1 : 0.8) + (H.ph ? Math.sin(t * 0.37) * 0.12 : 0);
      const nod = sn * (0.12 + Math.sin(t * 14) * 0.05) + W * Math.sin(2 * R.wph) * 0.03;
      pose(H.n1, -R.headUp * 0.22 + cr * 0.18 + po * 0.25 + sn * 0.3 - br * 0.5 + li * 0.15, lk * 0.3 + idle * 0.4 + st * 0.25 * s2, 0);
      pose(H.n2, -R.headUp * 0.28 + cr * 0.06 + po * 0.12 + sn * 0.25, lk * 0.35 + idle * 0.4, 0);
      pose(H.h, -R.headUp * 0.22 - cr * 0.2 - po * 0.32 + nod - R.jaw * 0.14 + st * 0.12 * s1, lk * 0.2 + st * 0.3 * s3, R.tilt * 0.45 - li * 0.35);
      pose(H.j, R.jaw * sp.jaw + st * 0.3 * Math.max(0, s2) + sn * 0.04 * Math.max(0, Math.sin(t * 14)), 0, 0);
      const ear = Math.max(-1, Math.min(1, R.ear - st * 0.7 + sn * 0.3));
      for (let e = 0; e < H.ears.length; e++) {
        const flick = Math.pow(Math.max(0, Math.sin(t * 0.7 + e * 2.3 + H.ph)), 12) * 0.25;
        pose(H.ears[e], ear * 0.6 + flick, 0, 0);
      }
      const pu = 0.22 + 0.78 * Math.max(0, Math.min(1, R.pupil - st * 0.6));
      for (const p of H.pupils) p.scale.set(pu, 1, 1);                           // 동공: 가로 폭만(세로 틈 ↔ 둥긂)
    }
    const tk = 0.04 + 0.96 * Math.max(0, Math.min(1, R.teeth));
    if (bones.teeth) bones.teeth.scale.set(1, tk, 1);                            // 이빨 쏙: 뼈 방향(세로)으로만 줄임
    if (bones.teethJ) bones.teethJ.scale.set(1, tk, 1);
    /* ── 꼬리 ── */
    for (let i = 0; i < tails.length; i++) {
      const k = i + 1, idle = Math.sin(t * 1.3 - k * 0.6) * 0.08 * (0.4 + k * 0.12) * (1 - st) * (1 - R.tailCurl * 0.7);
      const ry = idle + W * Math.sin(R.wph - k * 0.5) * 0.12 + R.tailCurl * (k === 1 ? 0.2 : 0.46) + st * Math.sin(t * 7 - k * 0.8) * 0.3
        + (po ? Math.sin(t * 6 - k) * 0.08 * po * (k > 3 ? 1 : 0) : 0);
      const rx = -cr * 0.04 + po * (k <= 2 ? 0.14 : -0.02) + R.tailCurl * 0.02 - flat * 0.04 + ro * 0.15 * Math.sin(R.rph + k);
      pose(tails[i], rx, ry, 0);
    }
    if (bones.finL) pose(bones.finL, 0, 0, Math.sin(t * 2.1) * 0.05 + R.glide * 0.15);
    if (bones.finR) pose(bones.finR, 0, 0, -Math.sin(t * 2.1 + 1) * 0.05 - R.glide * 0.15);
    if (bones.spines) { pose(bones.spines, -0.4 + 0.65 * R.spines, 0, 0); bones.spines.scale.setScalar(0.85 + 0.25 * R.spines); }
    if (bones.spinesT) bones.spinesT.scale.setScalar(0.72 + 0.4 * R.spines);
    /* ── 날개: 편 자세(날갯짓·활공) → 접은 자세로 slerp ── */
    const fold = Math.max(0, Math.min(1, R.fold * (1 - 0.5 * st)));
    const f = Math.sin(R.flap) * R.flapRate, f2 = Math.sin(R.flap - 0.7) * R.flapRate, f3 = Math.sin(R.flap - 1.2) * R.flapRate;
    for (const G of wings) {
      const s = G.s, fl = st * 0.35 * Math.sin(t * 9 + s);
      pose(G.w1, -f * 0.12, 0, s * (f * 0.75 + 0.06 - R.glide * 0.05 + fl));
      if (fold > 0.001) G.w1.quaternion.slerp(G.w1.userData.qf, fold);
      pose(G.w2, 0, -f2 * 0.08, s * (f2 * 0.4 + R.glide * 0.04));
      if (fold > 0.001) G.w2.quaternion.slerp(G.w2.userData.qf, fold);
      for (let i = 0; i < G.fingers.length; i++) {
        const F = G.fingers[i]; pose(F, 0, s * f3 * 0.05 * i, s * f3 * 0.3);
        if (fold > 0.001) F.quaternion.slerp(F.userData.qf, fold);
        F.scale.setScalar(1 - FOLD.shrink * fold);
      }
    }
    /* ── 몸 불(나이트메어) ── */
    if (blazeMat) blazeMat.emissive.setRGB(0.85 * R.blaze, 0.3 * R.blaze, 0.05 * R.blaze);
    if (R.blaze > 0.01 && !flamesMade && KIT.flameMesh) {
      flamesMade = true;
      for (const n of ['neck1', 'neck2', 'chest', 'hips', 'tail1', 'tail2', 'tail3']) {
        const b = bones[n]; if (!b) continue; const m = KIT.flameMesh(1), up = b.userData.ax[1];   // 모델 '위'를 뼈 축으로 — 등 위에 세움
        m.position.copy(up).multiplyScalar(h0 * 0.5); m.quaternion.setFromUnitVectors(AX[1], up); b.add(m); flames.push(m);
      }
    }
    for (let i = 0; i < flames.length; i++) { const m = flames[i]; m.visible = R.blaze > 0.02; m.scale.setScalar(R.blaze * (0.9 + 0.25 * Math.sin(t * 5 + i))); }
  };
  return R;
}
