// 드래곤 떼(8장 · design §12 '떼 = 정해진 길 + 자리 번호 · 인스턴스') — 같은 모양 InstancedMesh 하나 + 정점 셰이더 날갯짓(정점 값 = 날개 무게) + 눈(떼 눈길)
// 자리 번호: 떼 가운데(길 위 한 점) 둘레에 자리 n개(옆·위·앞) — 가운데 빈 자리(주머니)가 내 자리 · 들킴 = 주머니에서 벗어난 거리(장이 셈)
// 둥지 위를 맴도는 차림(circle)도 같은 메시로 · 매 걸음 new X(스크래치) · 그리기 1번 · 삼각형 ≈ 인스턴스 × 130
import * as THREE from 'three';
import { chainToon } from '../look/clouds.js?v=15';

/* 종 색·크기(먼 실루엣용 — 모델 팀의 종 색을 흐리게) */
const KINDS = [
  { c: 0x4a6a78, s: 1.0 },   // 내더
  { c: 0x6a5e40, s: 0.9 },   // 그롱클
  { c: 0x7e3e2c, s: 1.3 },   // 나이트메어
  { c: 0x4e6a44, s: 1.15 },  // 지플백
  { c: 0x5e6a3a, s: 0.5 },   // 테러
  { c: 0x3c4652, s: 1.1 },   // 이름 없는 먼 드래곤(짙은 청회색)
];

/* 드래곤 실루엣 한 마리(앞 = +z · 왼쪽 = +x) — 몸(굵기 고리) · 목·머리 · 꼬리 · 날개 둘(부채) · 꼬리날개 · 눈 둘 */
function dragonGeo() {
  const P = [], N = [], C = [], W = [], E = [], I = [];
  const body = new THREE.Color(0xffffff), belly = new THREE.Color(0xd2c8b6), memb = new THREE.Color(0xb8aea2), eyeC = new THREE.Color(0x16161a);
  const v = (x, y, z, c, w = 0, e = 0) => { P.push(x, y, z); N.push(0, 0, 0); C.push(c.r, c.g, c.b); W.push(w); E.push(e); return P.length / 3 - 1; };
  /* 몸통: 꼬리 끝 → 머리 끝, 고리 여섯 모 — 굵은 가슴 · 굵은 목 · 큰 머리(먼 실루엣에서 '드래곤'으로 읽힘) */
  const ring = [[-4.6, 0.0, 0.04], [-3.5, 0.06, 0.18], [-2.3, 0.12, 0.34], [-1.2, 0.14, 0.56], [0.0, 0.16, 0.74], [1.0, 0.3, 0.6], [1.7, 0.6, 0.4], [2.3, 0.86, 0.4], [2.75, 0.92, 0.46], [3.3, 0.84, 0.3], [3.75, 0.74, 0.06]];
  const SEG = 6, rings = [];
  for (const [z, y, r] of ring) { const ids = []; for (let k = 0; k < SEG; k++) { const a = k / SEG * Math.PI * 2, cy = Math.cos(a), sx = Math.sin(a); ids.push(v(sx * r * 1.05, y + cy * r * 0.85, z, cy < -0.3 ? belly : body)); } rings.push(ids); }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < SEG; k++) { const a = rings[i][k], b = rings[i][(k + 1) % SEG], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % SEG]; I.push(a, c, b, b, c, d); }
  /* 뿔 둘(머리 뒤로) · 등 가시 셋 */
  for (const s of [1, -1]) { const a = v(0.18 * s, 1.18, 2.7, body), b = v(0.3 * s, 1.5, 2.1, body), c = v(0.08 * s, 1.15, 2.4, body); if (s > 0) I.push(a, b, c); else I.push(a, c, b); }
  for (const z of [-0.6, 0.4, 1.3]) { const a = v(0, 0.86 + (z > 1 ? 0.2 : 0), z + 0.35, body), b = v(0, 1.22 + (z > 1 ? 0.2 : 0), z - 0.1, body), c = v(0, 0.86 + (z > 1 ? 0.2 : 0), z - 0.35, body); I.push(a, b, c, a, c, b); }
  /* 날개(양쪽) — 박쥐 날개: 어깨 · 팔꿈치 · 손목 · 손가락 끝 셋 · 뒷전은 손가락 사이로 오목 / w = 어깨에서 먼 정도(부호 = 쪽) */
  for (const s of [1, -1]) {
    const pts = [[0.45, 0.42, 0.9, 0.05], [1.9, 0.78, 1.25, 0.42], [3.1, 0.62, 0.8, 0.72], [4.9, 0.4, -0.25, 1.0], [3.9, 0.3, -1.0, 0.82], [4.0, 0.3, -1.9, 0.86], [3.0, 0.26, -1.25, 0.66], [2.5, 0.24, -2.2, 0.62], [1.7, 0.26, -1.25, 0.4], [0.5, 0.3, -1.0, 0.05]];
    const id = pts.map(([x, y, z, w]) => v(x * s, y, z, memb, w * s));
    const tri = [[0, 1, 9], [1, 8, 9], [1, 2, 8], [2, 6, 8], [6, 7, 8], [2, 4, 6], [4, 5, 6], [2, 3, 4]];
    for (const [a, b, c] of tri) { if (s > 0) I.push(id[a], id[b], id[c]); else I.push(id[a], id[c], id[b]); }
    /* 날개 뼈(앞전) 굵기 — 가는 띠 */
    const e0 = v(0.45 * s, 0.52, 0.9, body, 0.05 * s), e1 = v(1.9 * s, 0.9, 1.25, body, 0.42 * s), e2 = v(3.1 * s, 0.72, 0.8, body, 0.72 * s), e3 = v(4.9 * s, 0.46, -0.25, body, s);
    for (const [a, b, c, d] of [[e0, e1, id[0], id[1]], [e1, e2, id[1], id[2]], [e2, e3, id[2], id[3]]]) { if (s > 0) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c); }
  }
  /* 꼬리날개 */
  for (const s of [1, -1]) { const a = v(0, 0.05, -4.0, memb), b = v(0.85 * s, 0.05, -4.7, memb), c = v(0.2 * s, 0.05, -4.95, memb); if (s > 0) I.push(a, b, c); else I.push(a, c, b); }
  /* 눈(머리 양옆 작은 판 · e = 1) */
  for (const s of [1, -1]) { const a = v(0.43 * s, 1.0, 2.88, eyeC, 0, 1), b = v(0.4 * s, 1.0, 3.2, eyeC, 0, 1), c = v(0.42 * s, 1.14, 3.04, eyeC, 0, 1); if (s > 0) I.push(a, b, c); else I.push(a, c, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1)); g.setAttribute('aEye', new THREE.Float32BufferAttribute(E, 1)); g.setIndex(I);
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/*
  createFlock({ group, n, rng, path?: [{x,y,z}], pocket: { r: 반지름, len: 앞뒤 길이 } }) → Fl
  Fl.frame(s) → Fl.F = { x,y,z, tx,ty,tz(앞) , rx,rz(오른쪽), yaw, pitch } 길 위 s(m)의 자리
  Fl.update(dt, s, player|null, look 0~1) 떼 자리 · 눈길 · Fl.nearest(x,y,z) → 가장 가까운 드래곤까지(m) · Fl.bump(i) 부딪힌 드래곤 비켜남
  Fl.circle({ x, y, z, r }) 둥지 위 맴돌기 차림 · Fl.mesh · Fl.L 길 길이 · Fl.dispose()
*/
export function createFlock({ group, n = 60, rng = Math.random, path = null, pocket = { r: 8.5, len: 13 } }) {
  const geo = dragonGeo();
  const uFlap = { value: 1 };
  const mat = chainToon({ vc: true, side: THREE.DoubleSide }, 'flock1', (sh) => {
    sh.uniforms.uFlap = uFlap; sh.uniforms.uEyeCol = { value: new THREE.Color(0xe8c25a) };
    sh.uniforms.uRim = { value: 0.06 };   /* 얇은 날개가 옆으로 보이면 가장자리 빛이 온통 씌워 하얗게 뜸 → 떼는 실루엣이 되게 약하게(이 재질만) */
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uFlap; attribute float aWing; attribute float aEye; attribute float aPh; attribute float aLook; varying float vEye;')
      .replace('#include <beginnormal_vertex>', `
  float fph = uTime * (5.2 + 2.4 * fract(aPh * 7.13)) * uFlap + aPh * 6.2831;
  float fs = sign(aWing), fw = abs(aWing);
  float fang = (0.62 * sin(fph) + 0.1) * (0.55 + 0.45 * fw) * fs;   /* 어깨에서 돎 · 끝일수록 더 */
  float fca = cos(fang), fsa = sin(fang);
  vec3 objectNormal = vec3(normal);
  if (fw > 0.0) objectNormal.xy = vec2(objectNormal.x * fca - objectNormal.y * fsa, objectNormal.x * fsa + objectNormal.y * fca);`)
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
  if (fw > 0.0) { vec2 fo = vec2(fs * 0.45, 0.42), fd = transformed.xy - fo; transformed.xy = fo + vec2(fd.x * fca - fd.y * fsa, fd.x * fsa + fd.y * fca); }
  vEye = aEye * aLook;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uEyeCol; varying float vEye;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, uEyeCol, vEye);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uEyeCol * vEye * 0.85;');
  });
  /* uTime은 kit U.uTime(patch가 넣음) */
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const aPh = new Float32Array(n), aLook = new Float32Array(n);
  for (let i = 0; i < n; i++) aPh[i] = rng();
  geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(aPh, 1));
  const lookAttr = new THREE.InstancedBufferAttribute(aLook, 1); lookAttr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aLook', lookAttr);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false; group.add(mesh);

  /* 자리 번호 — 떼 둘레(옆 26 · 위아래 12 · 앞뒤 -34~+46)에 고르게(서로 5.5m 넘게) · 가운데 주머니(내 자리)는 비움 */
  const slot = new Float32Array(n * 3), kind = new Uint8Array(n), scl = new Float32Array(n), push = new Float32Array(n * 2);
  let k = 0, tries = 0;
  while (k < n && tries++ < 20000) {
    const r = (rng() - 0.5) * 52, u = (rng() - 0.5) * 24, f = -34 + rng() * 80;
    const e = (r / 26) ** 2 + (u / 12) ** 2 + ((f - 6) / 40) ** 2; if (e > 1) continue;
    const rad = Math.hypot(r, u * 1.2); if ((Math.abs(f) < pocket.len + 3 && rad < pocket.r + 2.5) || (f > -26 && f < 0 && rad < pocket.r + 5)) continue;   // 주머니 + 여유 · 뒤따르는 카메라 자리
    let ok = true; for (let j = 0; j < k; j++) { if (Math.hypot(slot[j * 3] - r, slot[j * 3 + 1] - u, slot[j * 3 + 2] - f) < 5.6) { ok = false; break; } }
    if (!ok) continue;
    slot[k * 3] = r; slot[k * 3 + 1] = u; slot[k * 3 + 2] = f;
    kind[k] = Math.min(KINDS.length - 1, Math.floor(rng() * KINDS.length)); scl[k] = KINDS[kind[k]].s * (0.85 + rng() * 0.3);
    k++;
  }
  const count = k;
  for (let i = 0; i < count; i++) { const K = KINDS[kind[i]]; _c.setHex(K.c).multiplyScalar(0.62 + rng() * 0.16); mesh.setColorAt(i, _c); }
  mesh.count = count; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  /* 길 — 점들을 캐트멀롬으로 2m마다 표본 · 길이표 */
  let PX = null, PY = null, PZ = null, NS = 0, L = 0;
  const Fl = { mesh, count, slot, scl, L: 0, mode: 'path', F: { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 1, rx: -1, rz: 0, yaw: 0, pitch: 0, bank: 0 }, look: aLook, pos: new Float32Array(n * 3) };
  Fl.setPath = (pts) => {
    const v = pts.map((p) => new THREE.Vector3(p.x, p.y, p.z)), cur = new THREE.CatmullRomCurve3(v, false, 'centripetal');
    const len = cur.getLength(); NS = Math.max(2, Math.ceil(len / 2) + 1); PX = new Float32Array(NS); PY = new Float32Array(NS); PZ = new Float32Array(NS);
    const pt = cur.getSpacedPoints(NS - 1);
    for (let i = 0; i < NS; i++) { PX[i] = pt[i].x; PY[i] = pt[i].y; PZ[i] = pt[i].z; }
    L = len; Fl.L = len;
  };
  if (path) Fl.setPath(path);
  /* 길 위 s(m) 자리 · 앞 · 오른쪽 · 기울기(굽은 정도) */
  Fl.frame = (s) => {
    const F = Fl.F; if (!PX) return F;
    const u = Math.max(0, Math.min(NS - 1.001, s / L * (NS - 1))), i = Math.floor(u), t = u - i, j = Math.min(NS - 1, i + 1);
    F.x = PX[i] + (PX[j] - PX[i]) * t; F.y = PY[i] + (PY[j] - PY[i]) * t; F.z = PZ[i] + (PZ[j] - PZ[i]) * t;
    const a = Math.max(0, i - 2), b = Math.min(NS - 1, i + 3);
    let tx = PX[b] - PX[a], ty = PY[b] - PY[a], tz = PZ[b] - PZ[a]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    F.tx = tx; F.ty = ty; F.tz = tz; F.yaw = Math.atan2(tx, tz); F.pitch = Math.asin(Math.max(-1, Math.min(1, ty)));
    const h = Math.hypot(tx, tz) || 1; F.rx = -tz / h; F.rz = tx / h;
    const c = Math.max(0, i - 6), d = Math.min(NS - 1, i + 7);   // 굽은 정도 → 몸 기울기
    const y0 = Math.atan2(PX[i] - PX[c], PZ[i] - PZ[c]), y1 = Math.atan2(PX[d] - PX[i], PZ[d] - PZ[i]);
    F.bank = Math.max(-0.6, Math.min(0.6, -wrap(y1 - y0) * 2.2));
    return F;
  };
  /* 둥지 위 맴돌기 차림 */
  let CI = null;
  Fl.circle = (o) => { CI = o; Fl.mode = 'circle'; };
  /* 걸음마다 — 자리(+ 출렁임 · 비켜남) · 눈길(look 0~1: 플레이어 쪽으로 몸을 돌리고 눈을 뜸) */
  let t = 0, dirty = true;
  Fl.update = (dt, s, pl, look = 0) => {
    t += dt;
    const F = Fl.mode === 'path' ? Fl.frame(s) : null;
    for (let i = 0; i < count; i++) {
      let x, y, z, yaw, pitch = 0, roll = 0;
      if (F) {
        const r = slot[i * 3] + push[i * 2] + Math.sin(t * 0.7 + i * 1.7) * 0.9, u = slot[i * 3 + 1] + push[i * 2 + 1] + Math.sin(t * 1.1 + i * 2.3) * 0.8, f = slot[i * 3 + 2] + Math.sin(t * 0.5 + i) * 1.2;
        x = F.x + F.rx * r + F.tx * f; y = F.y + u + F.ty * f; z = F.z + F.rz * r + F.tz * f;
        yaw = F.yaw + Math.sin(t * 0.6 + i) * 0.06; pitch = F.pitch; roll = F.bank + Math.sin(t * 0.9 + i * 0.7) * 0.08;
        push[i * 2] *= Math.exp(-dt * 0.6); push[i * 2 + 1] *= Math.exp(-dt * 0.6);
      } else {
        const rr = CI.r * (0.55 + (i % 5) * 0.12), sp = (0.16 + (i % 3) * 0.04) * (i % 2 ? 1 : -1), a = t * sp + i * 2.39;
        x = CI.x + Math.cos(a) * rr; z = CI.z + Math.sin(a) * rr; y = CI.y + (i % 4) * 6 + Math.sin(t * 0.8 + i) * 2;
        yaw = Math.atan2(-Math.sin(a) * Math.sign(sp), Math.cos(a) * Math.sign(sp)); roll = 0.35 * Math.sign(sp);
      }
      Fl.pos[i * 3] = x; Fl.pos[i * 3 + 1] = y; Fl.pos[i * 3 + 2] = z;
      let lk = 0;
      if (pl && look > 0) {
        const dx = pl.x - x, dy = pl.y - y, dz = pl.z - z, d = Math.hypot(dx, dy, dz);
        lk = Math.max(0, Math.min(1, look * 1.5 - d / 60));
        if (lk > 0) { const want = Math.atan2(dx, dz); yaw += wrap(want - yaw) * Math.min(0.85, lk); pitch += Math.atan2(dy, Math.hypot(dx, dz)) * 0.4 * lk; }
      }
      aLook[i] += (lk - aLook[i]) * Math.min(1, dt * 4);
      _e.set(-pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.setScalar(scl[i]);
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    mesh.instanceMatrix.needsUpdate = true; lookAttr.needsUpdate = true; dirty = false;
  };
  /* 가장 가까운 드래곤(몸 반지름을 뺀 거리) */
  Fl.nearest = (x, y, z) => {
    let best = 1e9, bi = -1;
    for (let i = 0; i < count; i++) { const d = Math.hypot(Fl.pos[i * 3] - x, Fl.pos[i * 3 + 1] - y, Fl.pos[i * 3 + 2] - z) - scl[i] * 1.6; if (d < best) { best = d; bi = i; } }
    Fl.near = bi; return best;
  };
  /* 부딪힌 드래곤이 놀라 비켜남(자리에서 옆으로 밀림 → 천천히 돌아옴) */
  Fl.bump = (i, px, py) => { if (i < 0) return; const r = slot[i * 3], u = slot[i * 3 + 1]; const d = Math.hypot(r - px, u - py) || 1; push[i * 2] += (r - px) / d * 4; push[i * 2 + 1] += (u - py) / d * 3; };
  Fl.setFlap = (k) => { uFlap.value = k; };
  Fl.show = (v) => { mesh.visible = v; };
  Fl.dispose = () => { mesh.removeFromParent(); geo.dispose(); mat.dispose(); mesh.dispose(); };
  return Fl;
}
