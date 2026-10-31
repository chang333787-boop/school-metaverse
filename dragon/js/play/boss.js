// 대장 드래곤(design §2 10장 ④ · §3-2 원소 · §8 예고 · §12 '대장 = 뼈에 붙은 캡슐 여섯 · 날개 구멍 = 원 여덟') — 모델 boss.glb(tools/dragon_blender/dragon.py 'boss')
// 몸: 자세 함수(dragon_rig) + 눈 넷 더(머리 뼈에 · 눈 여섯) + 목 아래 빛(숨 들이켬) + 입 안 빛 · 날개 막 구멍 = 재질 하나(구멍 원 여덟 · 묶음 자리 = 뼈 붙기 전 자리)
// 맞음 판정: 뼈에 붙은 캡슐 여섯(머리·목·몸·꼬리·왼 날개·오른 날개 · 30Hz) + 날개 막 표본 점(뼈 따라 · 구멍 자리 = 그 점의 묶음 자리)
// 수: 숨 들이켬 → 불(목 부풂 + 입 안 밝아짐 = 예고) · 큰 그림자 → 꼬리 쓸기 · 날개 들어 올림 → 날갯바람 · 콧구멍 벌름(킁킁) → 구름 속 냄새 찾기
//     쉬움 = 불·킁킁 둘 · 보통 = 넷 · 어려움 = 넷 + 빨라짐 · 날개 구멍이 쌓일수록 낮고 느리게 · 구름에 숨어 쏘면 자리가 드러남
// 매 걸음 new X(모듈 위 스크래치) · Light X(빛은 glowSprite·flameMesh) · 소리는 서서히 + 상한(sfx 압축기)
import * as THREE from 'three';
import { toon, glowSprite, U } from '../look/kit.js?v=16';
import { loadModel } from '../look/models.js?v=16';
import { createDragonRig } from '../look/dragon_rig.js?v=16';

export const WARN = { easy: 3, normal: 2.5, hard: 2 };
const MOVES = { easy: ['fire', 'sniff'], normal: ['fire', 'tail', 'gust', 'sniff'], hard: ['fire', 'tail', 'gust', 'sniff'] };
const COOL = { easy: 6.5, normal: 4.2, hard: 3 };
const SPEED = { easy: 0.85, normal: 1, hard: 1.2 };
const HOLE_R = 4.6;                                       // 날개 구멍 반지름(m · 모델 크기 1 기준)
const CAPS = ['head', 'neck', 'body', 'tail', 'wingL', 'wingR'];

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
/* 점 P → 선분 AB 거리² (t 돌려줌) */
const segT = { t: 0 };
function distSeg2(px, py, pz, ax, ay, az, bx, by, bz) {
  const ex = bx - ax, ey = by - ay, ez = bz - az, L = ex * ex + ey * ey + ez * ez || 1e-9;
  let t = ((px - ax) * ex + (py - ay) * ey + (pz - az) * ez) / L; t = t < 0 ? 0 : t > 1 ? 1 : t; segT.t = t;
  const dx = px - ax - ex * t, dy = py - ay - ey * t, dz = pz - az - ez * t; return dx * dx + dy * dy + dz * dz;
}
/* 두 선분 사이 가까운 거리²(총알 길 vs 캡슐) — 고정 표본 9점으로(짧은 선분이라 충분) */
function segSeg2(a0x, a0y, a0z, a1x, a1y, a1z, C) {
  let best = 1e18, bt = 0;
  for (let k = 0; k <= 8; k++) { const t = k / 8, d = distSeg2(a0x + (a1x - a0x) * t, a0y + (a1y - a0y) * t, a0z + (a1z - a0z) * t, C.ax, C.ay, C.az, C.bx, C.by, C.bz); if (d < best) { best = d; bt = t; } }
  segT.t = bt; return best;
}

/* 구멍 재질 — toon(정점색) 패치 위에 구멍 원 여덟(묶음 자리 거리 · 가장자리는 그을림 + 불씨 빛) */
function holeMaterial(base) {
  const m = base.clone(), H = []; for (let i = 0; i < 8; i++) H.push(new THREE.Vector4(0, 0, 0, -1));
  const uni = { value: H };
  m.onBeforeCompile = (sh, r) => {
    base.onBeforeCompile(sh, r);
    sh.uniforms.uHoles = uni;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBind; uniform vec4 uHoles[8];')
      .replace('#include <color_fragment>', `#include <color_fragment>
  float hk = 0.0;
  for (int i = 0; i < 8; i++) { vec4 h = uHoles[i]; if (h.w <= 0.0) continue; float d = distance(vBind, h.xyz); if (d < h.w) discard; hk = max(hk, 1.0 - smoothstep(h.w, h.w * 1.5, d)); }
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.045, 0.035), hk * 0.9);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.95, 0.4, 0.1) * pow(hk, 4.0) * 0.9;');
  };
  m.customProgramCacheKey = () => 'drgToon3|bossHoles';
  return { m, H, uni };
}

/* 불 줄기 재질(대장 몫 · 장소가 바뀌면 group과 함께 비움) — +Y 끝(뾰족) = 입 · 밑면 = 맞는 곳 · 일렁임은 정점에서 */
function fireGeo() { return new THREE.ConeGeometry(1, 1, 12, 6, true).translate(0, 0.5, 0); }
function fireMat(op) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: U.uTime, op: { value: op } },
    vertexShader: `uniform float uTime; varying float vH; varying float vF;
      void main(){ vec3 p = position; vH = clamp(p.y, 0.0, 1.0);
        float w = 1.0 + 0.18 * sin(uTime * 13.0 + p.y * 9.0) + 0.12 * sin(uTime * 7.0 - p.y * 15.0 + p.x * 3.0); p.xz *= w;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vec3 n = normalize(normalMatrix * normal);
        vF = pow(abs(dot(n, normalize(-mv.xyz))), 0.7);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float op; varying float vH; varying float vF;
      void main(){ vec3 c = mix(vec3(0.95, 0.38, 0.08), vec3(1.0, 0.88, 0.5), vH); float a = op * vF * (0.25 + 0.75 * vH) * smoothstep(0.0, 0.08, 1.0 - vH);
        gl_FragColor = vec4(c * a, a);
        #include <colorspace_fragment>
      }`,
  });
  return m;
}
/* 작은 입자 풀(김·연기·불티 · CPU · 점 판) — 대장 크기에 맞춘 큰 점 */
let PT = null;
function ptTex() { if (PT) return PT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); PT = new THREE.CanvasTexture(c); return PT; }
export function makeParts(group, max, color, size, add = false) {
  const pos = new Float32Array(max * 3), vel = new Float32Array(max * 3), life = new Float32Array(max), dur = new Float32Array(max);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map: ptTex(), transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 962; group.add(m);
  for (let i = 0; i < max; i++) pos[i * 3 + 1] = -999;
  let k = 0, live = 0;
  const P = { mesh: m };
  P.burst = (x, y, z, n, sp, up, d = 1.2) => { for (let i = 0; i < n; i++) { const j = k++ % max, a = (i / n) * 6.283 + k * 0.7, e = ((i * 7) % 5) / 5; pos[j * 3] = x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = z; vel[j * 3] = Math.cos(a) * sp * (0.4 + e * 0.6); vel[j * 3 + 1] = up * (0.5 + e); vel[j * 3 + 2] = Math.sin(a) * sp * (0.4 + e * 0.6); life[j] = d; dur[j] = d; } live = max; };
  P.puff = (x, y, z, vx, vy, vz, d = 1.2) => { const j = k++ % max; pos[j * 3] = x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = z; vel[j * 3] = vx; vel[j * 3 + 1] = vy; vel[j * 3 + 2] = vz; life[j] = d; dur[j] = d; live = max; };
  P.step = (dt, grav = 0) => { if (!live) return; let any = 0; for (let j = 0; j < max; j++) { if (life[j] <= 0) { if (pos[j * 3 + 1] !== -999) { pos[j * 3 + 1] = -999; any = 1; } continue; } any = 1; life[j] -= dt; vel[j * 3 + 1] -= grav * dt; pos[j * 3] += vel[j * 3] * dt; pos[j * 3 + 1] += vel[j * 3 + 1] * dt; pos[j * 3 + 2] += vel[j * 3 + 2] * dt; } if (any) g.attributes.position.needsUpdate = true; else live = 0; };
  return P;
}

/* ══════════ 대장 ══════════ */
export function createBoss({ group, diff = 'normal', scale = 1, sfx = null, place = null }) {
  const B = {
    x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, speed: 0, root: null, rig: null, bones: null, ready: false, diff, scale,
    mode: 'stand',            // stand(땅에 섬 · 해변) · fly(하늘 · 대장전) · script(장이 직접 놓음)
    holes: 0, hits: 0, warn: null, act: '', actT: 0, cool: 3, flinchT: 0, dizzyT: 0, stunT: 0, gasT: 0, turnT: 0, known: null, hiddenT: 0, alt0: 96,
    inhale: 0, jawOpen: 0, fire: null, tailK: 0, wingUp: 0, sniffK: 0, eyesK: 0, circle: { x: 0, z: -90, r: 170, dir: 1 }, center: { x: 0, y: 0, z: 0 },
    caps: CAPS.map((n) => ({ n, ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, r: 1 })), memb: [], mouth: { x: 0, y: 0, z: 0 }, t: 0, capT: 0, L: {},
  };
  const S = scale, moves = MOVES[diff] || MOVES.normal, spd = SPEED[diff] || 1;
  B.on = (ev, fn) => { (B.L[ev] = B.L[ev] || []).push(fn); return B; };
  const emit = (ev, a) => { const L = B.L[ev]; if (L) for (let i = 0; i < L.length; i++) L[i](a); };

  /* ── 불 줄기(원뿔 둘 · 넓은 쪽 = 맞는 곳 · 입 쪽이 가장 밝고 끝은 흐려짐 · 가장자리는 부드럽게) · 맞는 곳 빛 · 연기·불티·김 ── */
  const fireA = new THREE.Mesh(fireGeo(), fireMat(0.75)), fireB = new THREE.Mesh(fireGeo(), fireMat(0.95)); fireA.visible = fireB.visible = false; fireA.renderOrder = 941; fireB.renderOrder = 942; group.add(fireA); group.add(fireB);
  const hitGlow = glowSprite(0xff8a30, 40, 0.6); hitGlow.visible = false; group.add(hitGlow);
  const smoke = makeParts(group, 90, 0x5a524e, 9 * S), embers = makeParts(group, 80, 0xffa040, 1.6 * S, true), steam = makeParts(group, 40, 0xcfc8c0, 4 * S);
  B.fx = { smoke, embers, steam };
  let shadowEl = null;                                    // 큰 그림자(꼬리 쓸기 예고) — 화면을 덮는 그늘
  function shadow(k) {
    if (!shadowEl && k > 0.01) { shadowEl = document.createElement('div'); shadowEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:15;background:radial-gradient(ellipse at 50% 35%, rgba(20,12,10,0.15) 0%, rgba(20,12,10,0.75) 75%);opacity:0;transition:opacity .15s'; document.body.appendChild(shadowEl); }
    if (shadowEl) shadowEl.style.opacity = k.toFixed(2);
  }

  let body = null, holeU = null, qAttr = 1, eyeMat = null, mouthGlow = null, throat = [], extraEyes = null; const eyeGlow = [];
  B.loaded = loadModel('assets/models/boss.glb?v=16').then(({ root, bones, info }) => {
    B.root = root; B.bones = bones; root.scale.setScalar(S); group.add(root);
    eyeMat = toon({ color: 0xe9d27c, emissive: 0x4a3508 });
    root.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.mat === 'drg_eye_bs') o.material = eyeMat;
      if (o.userData.mat === 'drg_body' && o.isSkinnedMesh) { body = o; const h = holeMaterial(o.material); o.material = h.m; holeU = h; }
    });
    root.updateMatrixWorld(true);
    B.rig = createDragonRig(bones, root, 'boss');
    /* 묶음 자리 배율(양자화된 정점 자리 ↔ m) — 날개 너비로 */
    if (body) { body.geometry.computeBoundingBox(); const bb = body.geometry.boundingBox; qAttr = (bb.max.x - bb.min.x) / ((info && info.span) || 122.9); }
    /* 날개 막 표본 점 — 손가락 뼈에 묶인 정점 중 몸에서 먼 것(왼·오른 각 12) · 멀리 퍼지게 */
    if (body) {
      const sk = body.skeleton, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight, ps = body.geometry.attributes.position, n = ps.count;
      const names = sk.bones.map((b) => b.name), cand = { L: [], R: [] };
      for (let i = 0; i < n; i += 3) {
        let bi = -1, bw = 0; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; bi = si.getComponent(i, k); } }
        const nm = names[bi] || ''; if (!/^wing[3-8][LR]$/.test(nm) && !/^wing2[LR]$/.test(nm)) continue;
        _v.fromBufferAttribute(ps, i); body.applyBoneTransform(i, _v); _v.applyMatrix4(body.matrixWorld); root.worldToLocal(_v);
        if (Math.abs(_v.x) < 17 || _v.y < 12) continue;                 // 몸에서 먼 막만(몸통이 뚫리지 않게)
        cand[nm.endsWith('L') ? 'L' : 'R'].push({ i, x: _v.x, y: _v.y, z: _v.z });
      }
      for (const side of ['L', 'R']) {
        const c = cand[side], pick = []; if (!c.length) continue;
        pick.push(c[0]);
        while (pick.length < 12 && pick.length < c.length) { let best = null, bd = -1; for (const p of c) { let d = 1e9; for (const q of pick) d = Math.min(d, (p.x - q.x) ** 2 + (p.z - q.z) ** 2); if (d > bd) { bd = d; best = p; } } pick.push(best); }
        for (const p of pick) B.memb.push({ i: p.i, side, x: 0, y: 0, z: 0, bx: ps.getX(p.i), by: ps.getY(p.i), bz: ps.getZ(p.i), holed: false });
      }
    }
    /* 눈 넷 더(머리 뼈) — 모델 좌표(설계 단위 × 7 · glTF 축) → 머리 뼈 지역 */
    const head = bones.head;
    if (head) {
      const EG = [], PG = [], U7 = 7;
      for (const s of [1, -1]) for (const [dx, dy, dz, r] of [[0.8, -2.98, 2.72, 0.06], [0.62, -2.68, 2.84, 0.05]]) {
        const mx = dx * s * U7, my = dz * U7, mz = -dy * U7;                     // Blender(x,y,z) → glTF(x, z, −y)
        const e = new THREE.SphereGeometry(r * U7, 10, 8); e.translate(mx, my, mz); EG.push(e);
        const p = new THREE.SphereGeometry(r * U7 * 0.55, 8, 6); p.scale(0.55, 1, 0.55); p.translate(mx + s * r * U7 * 0.62, my, mz - r * U7 * 0.35); PG.push(p);
      }
      const group2 = new THREE.Group();
      head.updateMatrixWorld(true); root.updateMatrixWorld(true);
      _m.copy(head.matrixWorld).invert().multiply(root.matrixWorld);           // 모델 → 머리 뼈 지역
      for (const g of EG) { g.applyMatrix4(_m); group2.add(new THREE.Mesh(g, eyeMat)); }
      const pm = toon({ color: 0x1a1210 });
      for (const g of PG) { g.applyMatrix4(_m); group2.add(new THREE.Mesh(g, pm)); }
      head.add(group2); extraEyes = group2;
      /* 눈 여섯 빛(사각 없음 — 돌아볼 때만) */
      for (const g of EG) { g.computeBoundingSphere(); const sp = glowSprite(0xffe08a, 4, 0.9); sp.position.copy(g.boundingSphere.center); sp.visible = false; group2.add(sp); eyeGlow.push(sp); }
      for (const n of ['pupilL', 'pupilR']) if (bones[n]) { const sp = glowSprite(0xffe08a, 4, 0.9); sp.visible = false; bones[n].add(sp); eyeGlow.push(sp); }
      /* 입 안 빛 · 목 아래 빛(숨 들이켬 예고) */
      mouthGlow = glowSprite(0xffb050, 16, 0.85); mouthGlow.visible = false;
      _v.set(0, 1.95 * U7, 3.5 * U7).applyMatrix4(_m); mouthGlow.position.copy(_v); head.add(mouthGlow);
      for (const [n, dz, dy] of [['neck1', 1.85, 1.38], ['neck2', 2.35, 1.6]]) {
        const b = bones[n]; if (!b) continue; b.updateMatrixWorld(true);
        const g = glowSprite(0xff9a40, 13, 0.8); g.visible = false; _m.copy(b.matrixWorld).invert().multiply(root.matrixWorld);
        _v.set(0, dy * U7, dz * U7).applyMatrix4(_m); g.position.copy(_v); b.add(g); throat.push(g);
      }
    }
    B.ready = true; B.update30();
    return B;
  });

  /* ── 캡슐·막 점·입 자리(30Hz) ── */
  const P0 = new THREE.Vector3(), P1 = new THREE.Vector3();
  function cap(C, bA, bB, r, extA = 0, extB = 0) {
    if (!bA) return; bA.getWorldPosition(P0);
    if (bB) bB.getWorldPosition(P1); else { P1.set(0, 1, 0).applyQuaternion(bA.getWorldQuaternion(_q)).multiplyScalar(extB).add(P0); }
    if (extA) { _v.subVectors(P1, P0).normalize(); P0.addScaledVector(_v, -extA); }
    C.ax = P0.x; C.ay = P0.y; C.az = P0.z; C.bx = P1.x; C.by = P1.y; C.bz = P1.z; C.r = r;
  }
  B.update30 = () => {
    const b = B.bones; if (!b || !B.root) return;
    B.root.updateMatrixWorld(true);
    const c = B.caps;
    cap(c[0], b.head, null, 6 * S, 0, 13 * S);
    cap(c[1], b.neck1, b.head, 5.5 * S);
    cap(c[2], b.chest, b.hips, 9.5 * S, 5 * S);
    cap(c[3], b.tail1, b.tail6, 4.2 * S, 0);
    cap(c[4], b.wing1L, b.wing3L, 5 * S); cap(c[5], b.wing1R, b.wing3R, 5 * S);
    for (const p of B.memb) { _v.fromBufferAttribute(body.geometry.attributes.position, p.i); body.applyBoneTransform(p.i, _v); _v.applyMatrix4(body.matrixWorld); p.x = _v.x; p.y = _v.y; p.z = _v.z; }
    /* 입 = 머리 뼈 끝쪽 70% · 조금 아래 */
    if (b.head) { b.head.getWorldPosition(P0); P1.set(0, 1, 0).applyQuaternion(b.head.getWorldQuaternion(_q)); B.mouth.x = P0.x + P1.x * 10 * S; B.mouth.y = P0.y + P1.y * 10 * S - 1.5 * S; B.mouth.z = P0.z + P1.z * 10 * S; }
    const bc = c[2]; B.center.x = (bc.ax + bc.bx) / 2; B.center.y = (bc.ay + bc.by) / 2; B.center.z = (bc.az + bc.bz) / 2;
  };
  /* 선분(총알 길) 맞음 — 막 점(구멍 자리) 먼저 · 그다음 캡슐 · { part, memb, t } 또는 null */
  const HIT = { part: '', memb: null, x: 0, y: 0, z: 0 };
  B.hitTest = (ax, ay, az, bx, by, bz, rad = 1) => {
    if (!B.root) return null;
    let best = null, bd = 1e18;
    const mr = (6.2 * S + rad) ** 2;
    for (const p of B.memb) { const d = distSeg2(p.x, p.y, p.z, ax, ay, az, bx, by, bz); if (d < mr && d < bd) { bd = d; best = p; } }
    if (best) { HIT.part = 'wing'; HIT.memb = best; HIT.x = best.x; HIT.y = best.y; HIT.z = best.z; return HIT; }
    if (B.jawOpen > 0.45) { const d = distSeg2(B.mouth.x, B.mouth.y, B.mouth.z, ax, ay, az, bx, by, bz); if (d < (4.5 * S + rad) ** 2) { HIT.part = 'mouth'; HIT.memb = null; HIT.x = B.mouth.x; HIT.y = B.mouth.y; HIT.z = B.mouth.z; return HIT; } }
    for (const C of B.caps) { if (C.n === 'wingL' || C.n === 'wingR') continue; const d = segSeg2(ax, ay, az, bx, by, bz, C); if (d < (C.r + rad) ** 2 && d < bd) { bd = d; HIT.part = C.n; HIT.memb = null; HIT.x = ax + (bx - ax) * segT.t; HIT.y = ay + (by - ay) * segT.t; HIT.z = az + (bz - az) * segT.t; best = HIT; } }
    return best;
  };
  /* 점이 몸(캡슐)에 닿나 — 비행 중 부딪힘 · 꼬리 쓸기 */
  B.touch = (x, y, z, rad, only) => { for (const C of B.caps) { if (only && C.n !== only) continue; if (C.n === 'wingL' || C.n === 'wingR') continue; if (distSeg2(x, y, z, C.ax, C.ay, C.az, C.bx, C.by, C.bz) < (C.r + rad) ** 2) return C; } return null; };
  /* 가장 가까운 겨냥 점(막 점 · 아직 안 뚫린 것) — 조준 도움·봇 감각 */
  B.nearestMemb = (x, y, z, fx, fy, fz, cone) => {
    let best = null, bs = cone;
    for (const p of B.memb) { if (p.holed) continue; const dx = p.x - x, dy = p.y - y, dz = p.z - z, d = Math.hypot(dx, dy, dz) || 1, c = (dx * fx + dy * fy + dz * fz) / d; const ang = Math.acos(clamp(c, -1, 1)); if (ang < bs && d < 260) { bs = ang; best = p; } }
    return best;
  };
  /* 날개 구멍 — 막 점 자리에 원 하나(여덟까지) · 둘레 막 점은 뚫린 셈 */
  B.addHole = (p) => {
    if (!holeU || !p || B.holes >= 8) return false;
    const r = HOLE_R * qAttr * (0.9 + (B.holes % 3) * 0.12);
    holeU.H[B.holes].set(p.bx, p.by, p.bz, r); B.holes++;
    for (const q of B.memb) if (Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) < 8 * S) q.holed = true;
    p.holed = true; B.flinchT = 0.8; if (B.mode === 'fly' && !B.act) B.cool = Math.min(B.cool, 1.2);   // 아프면 곧 돌아봄 smoke.burst(p.x, p.y, p.z, 14, 6, 3, 1.4); embers.burst(p.x, p.y, p.z, 16, 12, 6, 1.0);
    if (sfx) sfx.play('growl');
    emit('hole', B.holes); return true;
  };
  B.resetHoles = () => { if (holeU) for (const h of holeU.H) h.w = -1; B.holes = 0; for (const p of B.memb) p.holed = false; };

  /* ── 예고(warn) → 수 ── */
  function begin(kind, target) { B.act = kind; B.actT = 0; B.warn = { kind, T: WARN[diff] * (kind === 'sniff' ? 1 : 1), left: WARN[diff], target, aimAtMe: target === 'me' }; emit('warn', B.warn); }
  B.begin = begin;
  B.cancel = () => { B.act = ''; B.warn = null; B.inhale = 0; endFire(); };
  /* 불 — 입에서 aim 점까지 · 0.35초 뻗고 1.1초 머묾 · 맞는 곳 = 원뿔 넓은 쪽 */
  function startFire(x, y, z) {
    B.fire = { t: 0, ax: B.mouth.x, ay: B.mouth.y, az: B.mouth.z, tx: x, ty: y, tz: z, hitDone: false, len: 0 };
    fireA.visible = fireB.visible = true; if (sfx) sfx.play('fire'); emit('fire', B.fire);
  }
  function endFire() { B.fire = null; fireA.visible = fireB.visible = false; hitGlow.visible = false; }
  B.startFire = startFire;
  function fireDraw() {
    const F = B.fire; if (!F) return;
    F.ax = B.mouth.x; F.ay = B.mouth.y; F.az = B.mouth.z;
    const k = clamp(F.t / 0.35, 0, 1), dx = F.tx - F.ax, dy = F.ty - F.ay, dz = F.tz - F.az, L = Math.hypot(dx, dy, dz) * k, fade = F.t > 1.2 ? clamp(1 - (F.t - 1.2) / 0.3, 0, 1) : 1;
    F.len = L;
    _v.set(dx, dy, dz).normalize(); _q.setFromUnitVectors(_up, _v.negate());          // 원뿔 +Y = 입 쪽(뾰족) · 밑면 = 맞는 곳
    const ex = F.ax + (dx / (Math.hypot(dx, dy, dz) || 1)) * L, ey = F.ay + (dy / (Math.hypot(dx, dy, dz) || 1)) * L, ez = F.az + (dz / (Math.hypot(dx, dy, dz) || 1)) * L;
    fireA.position.set(ex, ey, ez); fireA.quaternion.copy(_q); fireA.scale.set(13 * S * fade, Math.max(0.1, L), 9 * S * fade);
    fireB.position.set(ex, ey, ez); fireB.quaternion.copy(_q); fireB.scale.set(6.5 * S * fade, Math.max(0.1, L * 0.96), 4.5 * S * fade);
    hitGlow.visible = k >= 1 && fade > 0.05; hitGlow.position.set(ex, ey, ez); hitGlow.scale.setScalar(22 * S * fade); if (k >= 1 && (B.t * 20 | 0) % 2 === 0) embers.puff(ex + Math.sin(B.t * 31) * 5 * S, ey, ez + Math.cos(B.t * 27) * 5 * S, Math.sin(B.t * 13) * 8, 9, Math.cos(B.t * 11) * 8, 0.9);
  }
  /* 불이 이 점을 덮나(원뿔 · 넓이 = 입 1m → 끝 7m) */
  B.fireHits = (x, y, z, rad) => {
    const F = B.fire; if (!F || F.t < 0.3 || F.t > 1.35) return false;
    const L = F.len || 1, d2 = distSeg2(x, y, z, F.ax, F.ay, F.az, F.ax + (F.tx - F.ax) * (L / (Math.hypot(F.tx - F.ax, F.ty - F.ay, F.tz - F.az) || 1)), F.ay + (F.ty - F.ay) * (L / (Math.hypot(F.tx - F.ax, F.ty - F.ay, F.tz - F.az) || 1)), F.az + (F.tz - F.az) * (L / (Math.hypot(F.tx - F.ax, F.ty - F.ay, F.tz - F.az) || 1)));
    const w = (1.2 + segT.t * 4.8) * S + rad; return d2 < w * w;
  };

  /* ── 하늘 머리(대장전 · 원 그리며 돎 → 상태에 따라 수를 고름) — me = { x,y,z, vx,vy,vz, hidden, cloud, revealed } ── */
  const tgt = { x: 0, y: 0, z: 0 }, KN = { x: 0, y: 0, z: 0 };
  function skyBrain(dt, me) {
    const h = B.holes;
    B.alt0 = Math.max(46, 96 - h * 8.5); const vBase = Math.max(8, (15.5 - h * 1.2) * spd);
    /* 보임 · 숨음 · 드러남 */
    if (me.revealed || !me.hidden) { KN.x = me.x; KN.y = me.y; KN.z = me.z; B.known = KN; B.hiddenT = 0; }   // 보이거나 쏴서 드러남(같은 그릇 다시 씀)
    else B.hiddenT += dt;
    const dxm = me.x - B.x, dym = me.y - B.y, dzm = me.z - B.z, dm = Math.hypot(dxm, dym, dzm) || 1;
    const fwdDot = (Math.sin(B.yaw) * dxm + Math.cos(B.yaw) * dzm) / (Math.hypot(dxm, dzm) || 1);
    /* 수 고르기 */
    if (!B.act && B.stunT <= 0) {
      B.cool -= dt;
      if (B.cool <= 0) {
        if (me.hidden && !me.revealed && B.hiddenT > 1.5 && moves.includes('sniff')) begin('sniff', 'cloud');
        else if (!me.hidden && dm < 60 * S && fwdDot < -0.35 && moves.includes('tail')) begin('tail', 'me');
        else if (!me.hidden && dm < 85 * S && fwdDot > 0.55 && moves.includes('gust')) begin('gust', 'me');
        else if (B.known) begin('fire', me.hidden ? 'cloud' : 'me');
        else B.cool = 1;
      }
    }
    /* 움직임: 원을 돌다가 · 수를 쓰는 동안은 목표 쪽을 보고 느리게 */
    const C = B.circle, ang = Math.atan2(B.z - C.z, B.x - C.x), rad = Math.hypot(B.x - C.x, B.z - C.z);
    let wantYaw = Math.atan2(-Math.sin(ang) * C.dir, Math.cos(ang) * C.dir);              // 원의 접선(반시계 = dir 1)
    wantYaw -= clamp((rad - C.r) / 60, -0.8, 0.8) * C.dir;                               // 원 반지름으로 돌아옴
    let v = vBase, wantY = B.alt0 + Math.sin(B.t * 0.3) * 6;
    if (B.act && B.known) { const k = B.known; wantYaw = Math.atan2(k.x - B.x, k.z - B.z); v = vBase * 0.45; wantY = clamp(k.y + 18 * S, B.alt0 - 30, B.alt0 + 30); }
    if (B.act === 'tail' || B.act === 'gust') v = vBase * 0.3;
    if (B.stunT > 0) v = vBase * 0.6;
    const tr = 0.38 * spd * (B.act ? 1.4 : 1);
    const dy = wrap(wantYaw - B.yaw); B.yaw = wrap(B.yaw + clamp(dy, -tr * dt, tr * dt));
    B.roll += (clamp(-dy * 0.6, -0.4, 0.4) - B.roll) * Math.min(1, dt * 1.5);
    B.speed += (v - B.speed) * Math.min(1, dt * 0.8);
    const vy = clamp((wantY - B.y) * 0.4, -6, 5); B.pitch += (clamp(vy * 0.03, -0.25, 0.25) - B.pitch) * Math.min(1, dt * 1.5);
    B.x += Math.sin(B.yaw) * B.speed * dt; B.z += Math.cos(B.yaw) * B.speed * dt; B.y += vy * dt;
    /* 산·땅 위로 */
    if (place && place.fly) { const g = place.fly.ground(B.x, B.z); if (B.y < g + 30 * S) B.y += (g + 30 * S - B.y) * Math.min(1, dt * 2); }
    /* 수 진행 */
    act(dt, me);
  }
  /* 수 진행(하늘·땅 같이) */
  function act(dt, me) {
    if (!B.act) { B.inhale += (0 - B.inhale) * Math.min(1, dt * 3); B.sniffK += (0 - B.sniffK) * Math.min(1, dt * 3); B.wingUp += (0 - B.wingUp) * Math.min(1, dt * 3); B.tailK += (0 - B.tailK) * Math.min(1, dt * 3); shadow(0); return; }
    B.actT += dt; const W = B.warn, T = WARN[diff];
    if (W) W.left = Math.max(0, T - B.actT);
    if (B.act === 'fire') {
      if (B.actT < T) {                                   // 숨 들이켬(예고) — 목 아래 · 입 안이 차츰 밝아짐 · 목이 부풂
        B.inhale = clamp(B.actT / T, 0, 1);
        if (B.dizzyT > 0) { B.inhale *= 0.5; }
        const k = W.target === 'cloud' && me.cloud ? me.cloud : B.known || me; tgt.x = k.x; tgt.y = k.y; tgt.z = k.z;
        if (W.target === 'me' && me.vx != null) { tgt.x = me.x + me.vx * 0.35; tgt.y = me.y + (me.vy || 0) * 0.35; tgt.z = me.z + (me.vz || 0) * 0.35; }
        if (B.gasT > 0 && B.actT > 0.4) { B.gasT = 0; emit('boom', { x: B.mouth.x, y: B.mouth.y, z: B.mouth.z }); B.stunT = 5; B.cancel(); B.cool = COOL[diff] + 3; return; }   // 가스 + 불꽃 = 펑(입 앞)
      } else if (!B.fire && B.actT < T + 0.1) {
        let tx = tgt.x, ty = tgt.y, tz = tgt.z;
        if (B.dizzyT > 0) { ty += 40 * S; tx += 30 * S; }  // 소리 × 조준 = 빗나감(하늘로)
        B.warn = null; startFire(tx, ty, tz);
      }
      if (B.fire) { B.inhale = Math.max(0, 1 - B.fire.t * 1.5); B.fire.t += dt; if (B.fire.t > 1.5) { endFire(); B.act = ''; B.cool = COOL[diff]; } }
    } else if (B.act === 'sniff') {
      B.sniffK = Math.min(1, B.actT / 0.6);
      if (((B.t * 3) | 0) % 2 === 0 && B.root) { steam.puff(B.mouth.x + Math.sin(B.yaw + 1.57) * 3 * S, B.mouth.y + 3 * S, B.mouth.z + Math.cos(B.yaw + 1.57) * 3 * S, Math.sin(B.yaw) * 4, 1.5, Math.cos(B.yaw) * 4, 1.1); steam.puff(B.mouth.x - Math.sin(B.yaw + 1.57) * 3 * S, B.mouth.y + 3 * S, B.mouth.z - Math.cos(B.yaw + 1.57) * 3 * S, Math.sin(B.yaw) * 4, 1.5, Math.cos(B.yaw) * 4, 1.1); }
      if (B.actT > T) { B.sniffK = 0; B.known = me.cloud ? { x: me.cloud.x, y: me.cloud.y, z: me.cloud.z } : { x: me.x, y: me.y, z: me.z }; emit('found', B.known); begin('fire', 'cloud'); }
    } else if (B.act === 'tail') {
      if (B.actT < T) { B.tailK = B.actT / T; shadow(Math.min(0.85, B.tailK * 1.1) * (me.near ? 1 : 0.5)); }
      else if (B.actT < T + 0.9) { B.warn = null; B.tailK = 1 + (B.actT - T) / 0.9; shadow(0.3); emit('sweep', B.caps[3]); }
      else { B.tailK = 0; B.act = ''; B.cool = COOL[diff]; shadow(0); }
    } else if (B.act === 'gust') {
      if (B.actT < T) B.wingUp = B.actT / T;
      else if (B.actT < T + 0.8) { if (B.wingUp > 0.5) { emit('gust', { yaw: B.yaw, x: B.x, z: B.z }); if (sfx) sfx.play('wind'); } B.warn = null; B.wingUp = -1; }
      else { B.wingUp = 0; B.act = ''; B.cool = COOL[diff]; }
    } else if (B.act === 'turn') {                        // 사각에서 소리 → 눈 여섯으로 돌아봄
      B.eyesK = Math.min(1, B.actT / 0.5);
      if (B.actT > 2.2) { B.act = ''; B.warn = null; B.eyesK = 0; }
    }
  }

  /* ── 땅 머리(해변 ② · 서서 불 · 소리·가스·김에 반응) — targets = [{x,y,z, id, hidden}] · me = 플레이어 ── */
  B.groundTargets = [];
  function standBrain(dt, me) {
    const cool = COOL[diff] + 1.5;
    if (!B.act && B.stunT <= 0 && B.flinchT <= 0) {
      B.cool -= dt;
      if (B.cool <= 0) {
        const L = B.groundTargets.filter((t) => !t.hidden && !t.done);
        const pick = B.pickMe || !L.length ? 'me' : L[(B.t * 7 | 0) % L.length];
        B.pickMe = false;
        if (pick === 'me') { B.known = { x: me.x, y: me.y, z: me.z }; begin('fire', 'me'); }
        else { B.known = { x: pick.x, y: pick.y, z: pick.z }; B.aimT = pick; begin('fire', 'group'); }
      }
    }
    /* 고개: 목표 쪽(불 예고 중) · 아니면 해변을 훑음 */
    const lk = B.act === 'fire' && B.known ? wrap(Math.atan2(B.known.x - B.x, B.known.z - B.z) - B.yaw) : Math.sin(B.t * 0.35) * 0.5;
    B.look = clamp(lk, -0.9, 0.9);
    if (B.act === 'fire' && B.aimT && B.aimT.hidden && B.actT < WARN[diff]) { B.cancel(); B.cool = 2; emit('lost', B.aimT); }   // 김 가림막 = 놓침
    const me2 = B.act === 'fire' && B.warn && B.warn.target === 'group' ? B.known : me;
    act(dt, me2 || me);
  }

  /* ── 걸음 ── */
  B.step = (dt, me) => {
    if (!B.root) return;
    B.t += dt;
    if (B.flinchT > 0) B.flinchT -= dt; if (B.dizzyT > 0) B.dizzyT -= dt; if (B.stunT > 0) { B.stunT -= dt; if (B.act === 'fire' && B.actT < WARN[diff]) B.cancel(); }
    if (B.gasT > 0) B.gasT -= dt;
    if (B.mode === 'fly') skyBrain(dt, me);
    else if (B.mode === 'stand') standBrain(dt, me);
    else if (B.mode === 'script') act(dt, me);
    smoke.step(dt, -1.5); embers.step(dt, 9); steam.step(dt, -0.5);
    B.capT += dt; if (B.capT >= 1 / 30) { B.capT = 0; B.update30(); }
  };
  /* 장이 부르는 반응 */
  B.dizzy = (s = 4) => { B.dizzyT = s; emit('dizzy'); };
  B.stun = (s = 5) => { B.stunT = s; B.cancel(); B.cool = s + 2; };
  B.gas = (s = 5) => { B.gasT = s; };
  B.lookBack = () => { B.cancel(); B.act = 'turn'; B.actT = 0; B.pickMe = true; B.cool = 2.6; emit('turn'); };

  /* ── 그리기: 몸을 놓고 자세 값 ── */
  const flapPh = { v: 0 };
  B.draw = (dt) => {
    const R = B.rig; if (!R || !B.root) return;
    const S2 = B.root;
    if ((B.mode === 'fly' || B.mode === 'script') && !B.grounded) {
      _e.set(-B.pitch + (B.flinchT > 0 ? Math.sin(B.t * 30) * 0.03 : 0) - B.wingUp * 0.12, B.yaw, B.roll + (B.flinchT > 0 ? Math.sin(B.t * 23) * 0.05 : 0), 'YXZ');
      S2.quaternion.setFromEuler(_e);
      _v.set(0, -11 * S, 0).applyQuaternion(S2.quaternion); S2.position.set(B.x + _v.x, B.y + _v.y, B.z + _v.z);
      /* 날갯짓 — 큰 몸은 느리게(1.6초에 한 번) · 구멍이 많으면 더 자주·약하게 · 날개 들어 올림(바람 예고)은 위에서 멈춤 */
      const hz = 0.55 + B.holes * 0.05;
      flapPh.v += dt * hz * Math.PI * 2;
      let rate = 0.55, ph = flapPh.v;
      if (B.wingUp > 0) { rate = 0.9; ph = Math.PI * 0.5 + (1 - B.wingUp) * 0.6; }
      else if (B.wingUp < 0) { rate = 1; ph = Math.PI * 1.5; }
      R.flapRate = rate; R.flap = ph - dt * (1.6 + rate * 2.2) * Math.PI * 2; R.glide = 0.2; R.fold = 0;
      R.headUp = clamp(-B.pitch, -0.4, 0.4) + B.sniffK * 0.3; R.look = B.act && B.known ? clamp(wrap(Math.atan2(B.known.x - B.x, B.known.z - B.z) - B.yaw) * 0.6, -0.6, 0.6) : 0;
    } else {
      S2.position.set(B.x, B.y, B.z); S2.rotation.set(0, B.yaw, 0);
      R.flapRate = 0; R.fold = B.wingUp > 0 ? 1 - B.wingUp : 1; R.glide = 0; R.look = B.look || 0; R.headUp = 0.15 + B.sniffK * 0.3 - (B.stunT > 0 ? 0.4 : 0);
      if (B.wingUp > 0) { R.flapRate = 0.6; R.flap = Math.PI * 0.5 - dt * (1.6 + 0.6 * 2.2) * Math.PI * 2; }
    }
    R.jaw = Math.max(B.inhale * 0.75, B.fire ? 0.9 : 0, B.stunT > 0 ? 0.3 + Math.sin(B.t * 3) * 0.2 : 0);
    B.jawOpen = R.jaw;
    R.sniff = B.sniffK; R.pupil = 0.6; R.ear = B.eyesK > 0 ? 0.8 : -0.3;
    R.tilt = B.dizzyT > 0 ? Math.sin(B.t * 4) * 0.6 : B.stunT > 0 ? Math.sin(B.t * 2) * 0.4 : 0;
    R.tailCurl = 0;
    R.update(dt);
    /* 꼬리 쓸기: 들어 올림(예고) → 옆으로 휙 */
    const b = B.bones;
    if (B.tailK > 0) for (let i = 1; i <= 6; i++) { const t = b['tail' + i]; if (!t) continue; const up = Math.min(1, B.tailK) * 0.22, sw = B.tailK > 1 ? Math.sin((B.tailK - 1) * Math.PI) * 0.45 : 0; _q.setFromAxisAngle(t.userData.ax[0], -up); t.quaternion.multiply(_q); _q.setFromAxisAngle(t.userData.ax[1], sw); t.quaternion.multiply(_q); }
    /* 목 부풂(숨 들이켬) — 목 뼈 굵기 · 머리는 되돌림 */
    const sw = 1 + B.inhale * 0.28;
    if (b.neck2) b.neck2.scale.set(sw, 1, sw); if (b.neck1) b.neck1.scale.set(1 + B.inhale * 0.18, 1, 1 + B.inhale * 0.18);
    if (b.head) b.head.scale.set(1 / (sw * (1 + B.inhale * 0.18)), 1, 1 / (sw * (1 + B.inhale * 0.18)));
    const glow = B.fire ? 1 : B.inhale;
    for (const g of throat) { g.visible = glow > 0.05; g.material.opacity = 0.8; g.scale.setScalar((6 + glow * 10) * S); }
    if (mouthGlow) { mouthGlow.visible = glow > 0.05; mouthGlow.scale.setScalar((6 + glow * 16) * S); }
    if (eyeMat) eyeMat.emissive.setRGB(0.29 + B.eyesK * 0.6, 0.21 + B.eyesK * 0.45, 0.03 + B.eyesK * 0.1);
    for (const g of eyeGlow) { g.visible = B.eyesK > 0.2; if (g.visible) g.scale.setScalar(1.4 + B.eyesK * 2.2); }
    fireDraw();
  };
  /* 바깥(장)이 부르는 감각 — 봇에게 보이는 것만 */
  B.sense = () => ({
    x: +B.center.x.toFixed(1), y: +B.center.y.toFixed(1), z: +B.center.z.toFixed(1), yaw: +B.yaw.toFixed(2), holes: B.holes, act: B.act,
    warn: B.warn ? { kind: B.warn.kind, left: +B.warn.left.toFixed(2), me: B.warn.target === 'me' || B.warn.target === 'cloud' } : null, fire: !!B.fire, jaw: +B.jawOpen.toFixed(2), glow: +(B.fire ? 1 : B.inhale).toFixed(2),
    tail: +Math.min(1, B.tailK).toFixed(2), wingUp: +B.wingUp.toFixed(2), sniff: +B.sniffK.toFixed(2), stun: B.stunT > 0, dizzy: B.dizzyT > 0,
  });
  B.dispose = () => { if (shadowEl) { shadowEl.remove(); shadowEl = null; } if (B.root) B.root.removeFromParent(); for (const o of [fireA, fireB, hitGlow, smoke.mesh, embers.mesh, steam.mesh]) o.removeFromParent(); for (const o of [fireA, fireB]) { o.geometry.dispose(); o.material.dispose(); } };
  return B;
}

/* ══════════ 투슬리스 쏘기(F) — 횟수 넷 · 다시 차기 · 조준 도움(원뿔) · 구름 속에서 쏘면 자리가 드러남 ══════════ */
export function createShots(group, diff = 'normal') {
  const MAX = 4, REFILL = { easy: 2.0, normal: 2.6, hard: 3.0 }[diff] || 2.6, CONE = { easy: 0.3, normal: 0.17, hard: 0.09 }[diff] || 0.17;
  const bolts = [], SP = 150;
  const mat = new THREE.MeshBasicMaterial({ color: 0xc8b8ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const geo = new THREE.SphereGeometry(0.8, 8, 6);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; group.add(m); const g = glowSprite(0x9a8aff, 7, 0.8); g.visible = false; group.add(g); bolts.push({ m, g, on: false, x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, t: 0, aim: null }); }
  const flash = makeParts(group, 40, 0xd8ccff, 1.1, true);
  const Sh = { n: MAX, max: MAX, refill: 0, fired: 0, hits: 0, misses: 0, cone: CONE };
  /* from = 입 자리 · dir = 앞(단위) · boss(조준 도움) — 쏠 수 있었나 */
  Sh.fire = (x, y, z, fx, fy, fz, boss) => {
    if (Sh.n < 1) return false;
    const b = bolts.find((q) => !q.on); if (!b) return false;
    Sh.n--; Sh.fired++;
    b.on = true; b.t = 0; b.x = b.px = x; b.y = b.py = y; b.z = b.pz = z;
    let dx = fx, dy = fy, dz = fz;
    const aim = boss && boss.nearestMemb ? boss.nearestMemb(x, y, z, fx, fy, fz, CONE) : null;
    b.aim = aim;
    if (aim) { dx = aim.x - x; dy = aim.y - y; dz = aim.z - z; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l; }
    b.vx = dx * SP; b.vy = dy * SP; b.vz = dz * SP; b.m.visible = b.g.visible = true;
    flash.burst(x + dx * 3, y + dy * 3, z + dz * 3, 5, 5, 1, 0.3);
    return true;
  };
  /* 걸음 — 맞으면 onHit(part, hit) · 길 = 이전 → 지금 선분 */
  Sh.step = (dt, boss, onHit) => {
    if (Sh.n < MAX) { Sh.refill += dt; if (Sh.refill >= REFILL) { Sh.refill = 0; Sh.n++; } } else Sh.refill = 0;
    for (const b of bolts) {
      if (!b.on) continue;
      b.px = b.x; b.py = b.y; b.pz = b.z; b.t += dt;
      if (b.aim && !b.aim.holed) { const dx = b.aim.x - b.x, dy = b.aim.y - b.y, dz = b.aim.z - b.z, l = Math.hypot(dx, dy, dz) || 1; const k = Math.min(1, dt * 6); b.vx += (dx / l * SP - b.vx) * k; b.vy += (dy / l * SP - b.vy) * k; b.vz += (dz / l * SP - b.vz) * k; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      let hit = boss && boss.root ? boss.hitTest(b.px, b.py, b.pz, b.x, b.y, b.z, 0.8) : null;
      if (hit) { b.on = false; Sh.hits++; flash.burst(hit.x, hit.y, hit.z, 16, 14, 4, 0.6); onHit && onHit(hit.part, hit); }
      else if (b.t > 1.6) { b.on = false; Sh.misses++; }
      b.m.visible = b.g.visible = b.on; if (b.on) { b.m.position.set(b.x, b.y, b.z); b.g.position.set(b.x, b.y, b.z); }
    }
    flash.step(dt, 0);
  };
  Sh.reset = () => { Sh.n = MAX; Sh.refill = 0; for (const b of bolts) { b.on = false; b.m.visible = b.g.visible = false; } };
  Sh.dispose = () => { for (const b of bolts) { b.m.removeFromParent(); b.g.removeFromParent(); } flash.mesh.removeFromParent(); geo.dispose(); mat.dispose(); };
  Sh.live = () => bolts.some((b) => b.on);
  return Sh;
}
