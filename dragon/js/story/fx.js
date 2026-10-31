// 장이 같이 쓰는 작은 물건·이펙트 — 손에 든 것 · 바닥에 놓인 것 · 모래 선 · 물보라 · 날아가는 것(원인 → 결과만 · 버튼 이펙트 X)
// 모두 toon 재질(공유) · 기하는 처음 한 번만 짓고 공유(SHARED) · 매 걸음 new X
import * as THREE from 'three';
import { toon, SHARED } from '../look/kit.js?v=14';
import { loadModel } from '../look/models.js?v=14';

const G = {};
function geo(k, f) { if (!G[k]) { G[k] = f(); SHARED.add(G[k]); } return G[k]; }
/* 손에 드는 것(팀 M의 props_hand.glb가 오면 그 메시 · 없으면 코드로 지은 자리표시) */
let HAND = null; loadModel('assets/models/props_hand.glb?v=14').then((m) => { HAND = m.root; HAND.traverse((o) => { if (o.geometry) SHARED.add(o.geometry); }); }).catch(() => {});
function fallback(name) {
  const g = new THREE.Group();
  if (name === 'knife') { g.add(new THREE.Mesh(geo('blade', () => new THREE.BoxGeometry(0.04, 0.02, 0.32).translate(0, 0, 0.2)), toon({ color: 0xcfd4d6 }))); g.add(new THREE.Mesh(geo('grip', () => new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6).rotateX(Math.PI / 2)), toon({ color: 0x6a4a2e }))); }
  else if (name === 'cod' || name === 'salmon' || name === 'fish' || name === 'half') { const m = new THREE.Mesh(geo('fish', () => new THREE.SphereGeometry(0.12, 8, 6).scale(0.6, 0.7, 2.0)), toon({ color: name === 'salmon' ? 0xe8a08a : 0xb7c2bf })); if (name === 'half') m.scale.set(1, 1, 0.55); g.add(m); }
  else if (name === 'eel') g.add(new THREE.Mesh(geo('eel', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(0.08, 0, -0.1), new THREE.Vector3(-0.08, 0, 0.12), new THREE.Vector3(0, 0, 0.35)]), 12, 0.035, 6)), toon({ color: 0x5a6a3a })));
  else if (name === 'torch' || name === 'oil') g.add(new THREE.Mesh(geo('jug', () => new THREE.SphereGeometry(0.12, 8, 6).scale(1, 1.3, 1)), toon({ color: 0x9a6a3a })));
  else if (name === 'shield') g.add(new THREE.Mesh(geo('shield', () => new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14).rotateX(Math.PI / 2)), toon({ color: 0xa2763e })));
  else if (name === 'bucket') g.add(new THREE.Mesh(geo('bucket', () => new THREE.CylinderGeometry(0.16, 0.12, 0.26, 10)), toon({ color: 0x9a6a3a })));
  else if (name === 'nip') g.add(new THREE.Mesh(geo('nipc', () => new THREE.ConeGeometry(0.1, 0.3, 5)), toon({ color: 0x3f9a86 })));
  else if (name === 'cloth') g.add(new THREE.Mesh(geo('cloth', () => new THREE.BoxGeometry(0.22, 0.05, 0.22)), toon({ color: 0xd8c8a0 })));
  else g.add(new THREE.Mesh(geo('lump', () => new THREE.SphereGeometry(0.08, 6, 5)), toon({ color: 0x8a7a62 })));
  return g;
}
export function makeItem(name) {
  if (HAND) { let f = null; HAND.traverse((o) => { if (!f && o.isMesh && o.name === name) f = o; }); if (f) { const m = f.clone(); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); const g = new THREE.Group(); g.add(m); return g; } }
  return fallback(name);
}
/* 손에 붙이기 — handR 뼈(팀 M) 또는 아래팔 끝 */
export function holdItem(P, name) {
  if (P.itemObj) { P.itemObj.removeFromParent(); P.itemObj = null; }
  P.item = name; if (!name || !P.bones) return;
  const b = P.bones.handR || P.bones.armLR; if (!b) return;
  const o = makeItem(name); if (!P.bones.handR) o.position.set(0, -0.25, 0.05);
  b.add(o); P.itemObj = o;
}
/* 바닥에 놓인 물건(내려놓은 칼 · 생선 바구니 · 꼬리날개 조각) */
export function dropItem(group, name, x, y, z, yaw = 0) { const o = makeItem(name); o.position.set(x, y + 0.05, z); o.rotation.set(Math.PI / 2 * (name === 'knife' ? 1 : 0), yaw, 0); group.add(o); return o; }

/* 모래 선 — 투슬리스가 나뭇가지로 그린 선(낮은 홈 띠 · 그리는 동안 길어짐) · segs = [[ax,az,bx,bz], …] */
export function sandLines(group, place, segs) {
  const n = segs.length, pos = new Float32Array(n * 4 * 3), idx = [];
  for (let i = 0; i < n; i++) { idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, toon({ color: 0x6a5a3e, side: THREE.DoubleSide })); m.frustumCulled = false; group.add(m);
  const L = { mesh: m, shown: 0, segs };
  L.show = (k) => {                                          // 앞 k개만(그리는 중)
    L.shown = k; const p = g.attributes.position;
    for (let i = 0; i < n; i++) {
      const [ax, az, bx, bz] = segs[i], dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz) || 1, nx = -dz / d * 0.09, nz = dx / d * 0.09, vis = i < k;
      const ya = place.height(ax, az, 0) + 0.025, yb = place.height(bx, bz, 0) + 0.025;
      p.setXYZ(i * 4, ax + nx, vis ? ya : -50, az + nz); p.setXYZ(i * 4 + 1, ax - nx, vis ? ya : -50, az - nz); p.setXYZ(i * 4 + 2, bx + nx, vis ? yb : -50, bz + nz); p.setXYZ(i * 4 + 3, bx - nx, vis ? yb : -50, bz - nz);
    }
    p.needsUpdate = true; g.computeVertexNormals();
  };
  L.hit = (x, z, r = 0.32) => { for (let i = 0; i < L.shown; i++) { const [ax, az, bx, bz] = segs[i], ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1e-9; let t = ((x - ax) * ex + (z - az) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(x - ax - ex * t, z - az - ez * t) < r) return true; } return false; };
  L.show(0);
  return L;
}

/* 물보라·흙먼지 — 작은 점 파티클 한 풀(합 ≤ 3000 중 한 몫) · 원인 자리에서만 */
export function makePuffs(group, max = 120, color = 0xe9f0ee) {
  const pos = new Float32Array(max * 3), vel = new Float32Array(max * 3), life = new Float32Array(max);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.18, transparent: true, opacity: 0.85, depthWrite: false }));
  m.frustumCulled = false; group.add(m);
  let k = 0;
  const P = { mesh: m };
  P.burst = (x, y, z, n = 20, sp = 2.5, up = 3) => { for (let i = 0; i < n; i++) { const j = k++ % max, a = (i / n) * 6.283 + k; pos[j * 3] = x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = z; vel[j * 3] = Math.cos(a) * sp * (0.4 + (i % 5) * 0.15); vel[j * 3 + 1] = up * (0.6 + (i % 3) * 0.2); vel[j * 3 + 2] = Math.sin(a) * sp * (0.4 + (i % 4) * 0.15); life[j] = 1; } };
  P.step = (dt) => { for (let j = 0; j < max; j++) { if (life[j] <= 0) { pos[j * 3 + 1] = -99; continue; } life[j] -= dt * 1.2; vel[j * 3 + 1] -= 9 * dt; pos[j * 3] += vel[j * 3] * dt; pos[j * 3 + 1] += vel[j * 3 + 1] * dt; pos[j * 3 + 2] += vel[j * 3 + 2] * dt; } g.attributes.position.needsUpdate = true; };
  return P;
}
