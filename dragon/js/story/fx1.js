// 0·1·11장이 같이 쓰는 작은 것 — 습격 하늘(나는 드래곤 실루엣) · 불 뿜기 원뿔 · 던지기(물통·볼라 · 쉬움 방향키 조준) · 날아가는 물건 · 별 하늘 · 둥근 벽(불·드래곤 자리)
// 모두 원인 → 결과(불 뿜기가 닿은 칸에만 원소 엔진 불씨 · 물통이 떨어진 자리에만 물) · 매 걸음 new X(처음에 한 번 짓고 다시 씀) · Light 추가 X
import * as THREE from 'three';
import { toon, flameMesh, glowSprite, SHARED } from '../look/kit.js?v=16';
import { makeItem } from './fx.js?v=16';

const TAU = Math.PI * 2;
export const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/* 생성기 안에서 약속 기다리기 */
export function* awaitP(p) { let v, done = false; p.then((x) => { v = x; done = true; }, () => { done = true; }); while (!done) yield; return v; }

/* 마을 배치 고정 — 마을 장소(places/village.js)는 공용 씨앗 난수 G.rng로 집을 세움 → 앞에서 난수를 얼마나 썼는지에 따라 집 자리가 바뀜
   0·1·11장은 설계한 골목·지붕·길이 늘 같도록 같은 씨앗 상태로 지음(배치 지문 = 덧댄 판자 첫 자리) · 메인이 장소마다 따로 씨앗을 주면 이 함수는 할 일이 없음
   쓰는 법: 차례 run 맨 앞(배우·원소 엔진을 만들기 전)에 yield* ensureVillage(G, C) · 다음 장소를 마을로 지을 차례 앞에서 seedVillage(G) */
export const VILLAGE_SEED = 1656844137, VILLAGE_FP = [-6.3, -36.4];   // 씨앗 1로 마을을 한 번 지은 뒤의 상태(이 배치로 골목·지붕·길을 설계함 · 10-31 잼)
const villageOk = (pl) => pl && pl.name === 'village' && pl.lists && pl.lists.patched && pl.lists.patched[0] && Math.abs(pl.lists.patched[0].x - VILLAGE_FP[0]) < 0.06 && Math.abs(pl.lists.patched[0].z - VILLAGE_FP[1]) < 0.06;
export function seedVillage(G) { if (VILLAGE_SEED) G.rng.seed(VILLAGE_SEED); }
export function* ensureVillage(G, C) {
  if (!VILLAGE_SEED || villageOk(G.place)) return false;
  const st = C.st || {};
  G.rng.seed(VILLAGE_SEED);
  yield* awaitP(G.loadPlace('village', st.time, st.variant));
  G.placeKey = 'village|' + (st.time || '') + '|' + (st.variant || '');
  G.hud.veil.hide();
  if (st.at) G.putPlayer(st.at);
  return true;
}

/* 둥근 벽(여덟 모 선분) — 불난 수레·앉은 드래곤 자리를 걷기·카메라가 못 지나가게 */
export function ringWalls(x, z, r, n = 8) { const s = []; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; s.push([x + Math.cos(a0) * r, z + Math.sin(a0) * r, x + Math.cos(a1) * r, z + Math.sin(a1) * r]); } return s; }

/* 습격 하늘 — 드래곤 다섯 실루엣이 마을 위를 돎(실제 모델 · 날갯짓 자세) · keep 배우라 장소가 바뀔 때까지 남음 · 그리기는 장이 drawHook에서 sky.draw(dt) */
export function raidSky(G, list) {
  if (G._sky && G._sky.place === G.place) return G._sky;
  const S = { place: G.place, ds: [], t: 0 };
  list.forEach((o, i) => {
    const D = G.dragon(o.kind, { x: o.cx, z: o.cz, yaw: 0 }, { keep: 'sky' + i, noCollide: true, mind: { fear: 0.4 } });
    D.manual = true; D.sky = Object.assign({ r: 40, h: 34, w: 0.12, ph: i * 1.3, dir: i % 2 ? 1 : -1, bob: 2 }, o); S.ds.push(D);
  });
  S.pos = (D, out, dt = 0) => { const k = D.sky, a = k.ph + (S.t + dt) * k.w * k.dir; out.a = a; out.x = k.cx + Math.cos(a) * k.r; out.z = k.cz + Math.sin(a) * k.r; out.y = (G.place.ground ? G.place.ground(k.cx, k.cz) : 0) + k.h + Math.sin((S.t + dt) * 0.7 + k.ph) * k.bob; return out; };
  const q = { x: 0, y: 0, z: 0, a: 0 };
  S.draw = (dt) => {
    S.t += dt;
    for (const D of S.ds) {
      if (!D.root || D.hold) continue;
      const k = D.sky; S.pos(D, q); const a = q.a, x = q.x, y = q.y, z = q.z;
      D.x = x; D.z = z; D.y = y; D.root.position.set(x, y, z);
      D.root.rotation.set(0, Math.atan2(-Math.sin(a) * k.dir, Math.cos(a) * k.dir), -0.35 * k.dir, 'YXZ');
      const R = D.rig; if (R) { R.fold = 0; R.flapRate = 0.8; R.glide = 0.2; R.tailCurl = k.scared ? 0.8 : 0; R.update(dt); }
    }
  };
  G._sky = S; return S;
}

/* 불 뿜기 원뿔 — from(입) → to(지붕) · 1.1초 동안만 보임(원인이 보이게) · 끝나면 onHit(to) */
export function makeBreath(group) {
  const f = flameMesh(1), g = glowSprite(0xff8a3a, 5, 0.5); f.visible = g.visible = false; group.add(f); group.add(g);
  const B = { f, g, t: 0, on: false, from: new THREE.Vector3(), to: new THREE.Vector3(), hit: null };
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), q = new THREE.Quaternion();
  B.fire = (fx, fy, fz, tx, ty, tz, onHit) => { B.from.set(fx, fy, fz); B.to.set(tx, ty, tz); B.t = 0; B.on = true; B.hit = onHit; };
  B.step = (dt) => {
    if (!B.on) return;
    B.t += dt; const k = Math.min(1, B.t / 0.5), L = B.from.distanceTo(B.to) * k;
    dir.subVectors(B.to, B.from).normalize(); q.setFromUnitVectors(up, dir);
    f.visible = g.visible = true; f.position.copy(B.from); f.quaternion.copy(q); f.scale.set(5, Math.max(0.5, L), 5);
    g.position.copy(B.from).addScaledVector(dir, L); g.scale.setScalar(4);
    if (B.t > 0.5 && B.hit) { const h = B.hit; B.hit = null; h(B.to); }
    if (B.t > 1.1) { B.on = false; f.visible = g.visible = false; }
  };
  return B;
}

/* 날아가는 물건(물통 물 · 볼라) — 포물선 · 닿으면 onLand · 한 번에 하나 */
export function makeFlyer(group, item, opt = {}) {
  const m = item === 'water' ? new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), toon({ color: 0x7fb0c8 })) : makeItem(item);
  if (opt.scale) m.scale.setScalar(opt.scale);
  m.visible = false; group.add(m);
  const F = { m, on: false, t: 0, T: 0.8, sx: 0, sy: 0, sz: 0, tx: 0, ty: 0, tz: 0, arc: 2.5, land: null };
  F.go = (sx, sy, sz, tx, ty, tz, T, arc, land) => { Object.assign(F, { sx, sy, sz, tx, ty, tz, T, arc, land, t: 0, on: true }); m.visible = true; };
  F.pos = (k, out) => { out.x = F.sx + (F.tx - F.sx) * k; out.y = F.sy + (F.ty - F.sy) * k + Math.sin(k * Math.PI) * F.arc; out.z = F.sz + (F.tz - F.sz) * k; return out; };
  const p = { x: 0, y: 0, z: 0 };
  F.step = (dt) => {
    if (!F.on) return;
    F.t += dt; const k = Math.min(1, F.t / F.T); F.pos(k, p); m.position.set(p.x, p.y, p.z); m.rotation.y += dt * 12; m.rotation.x += dt * 5;
    if (k >= 1) { F.on = false; m.visible = false; const l = F.land; F.land = null; if (l) l(F.tx, F.ty, F.tz); }
  };
  F.dispose = () => { m.removeFromParent(); if (item === 'water') m.geometry.dispose(); };
  return F;
}

/* 던지기(design §1 · 쉬움 = F 누르는 동안 방향키 조준 · 보통 = 끌어서 조준) — 손에 든 것이 있을 때 F 짧게 X · F 꾹 = 겨누기(땅에 고리) · 놓으면 던짐
   o = { item, flyItem, min, max, T(초), arc, landY(x,z) → 닿는 높이, snap(x,z) → 쉬움 조준 도움 자리 | null, onLand(x,y,z) } */
export function makeThrow(G, o) {
  const P = G.player, pl = G.place;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf4ead2, transparent: true, opacity: 0.75, depthWrite: false }));
  ring.visible = false; ring.renderOrder = 960; pl.group.add(ring);
  const fly = makeFlyer(pl.group, o.flyItem || o.item, { scale: o.scale });
  const T = { held: false, aim: null, fly, ring, thrown: 0 };
  T.give = () => { T.held = true; G.hold(o.item); };
  T.drop = () => { T.held = false; T.aim = null; ring.visible = false; P.aiming = false; P.noReach = false; if (P.item === o.item) G.hold(null); };
  T.step = (dt) => {
    fly.step(dt);
    if (!T.held) return;
    P.noReach = true;
    if (G.input.on('use') && P.fT > 0.25) {
      const my = P.C.moveYaw(), fx = Math.sin(my), fz = Math.cos(my), rx = -Math.cos(my), rz = Math.sin(my);
      if (!T.aim) T.aim = { x: P.W.x + fx * (o.start || 6), z: P.W.z + fz * (o.start || 6) };
      P.lock = true; P.aiming = true;
      let ar, af;
      if (G.diff === 'easy') { ar = G.input.axis('left', 'right') * 6 * dt; af = G.input.axis('back', 'fwd') * 6 * dt; }
      else { const lk = G.input.look(); ar = lk.x * 0.03; af = -lk.y * 0.03; }
      T.aim.x += rx * ar + fx * af; T.aim.z += rz * ar + fz * af;
      const dx = T.aim.x - P.W.x, dz = T.aim.z - P.W.z, d = Math.hypot(dx, dz) || 1, mx = o.max || 12;
      if (d > mx) { T.aim.x = P.W.x + dx / d * mx; T.aim.z = P.W.z + dz / d * mx; }
      if (G.diff === 'easy' && o.snap) { const s = o.snap(T.aim.x, T.aim.z); if (s) { T.aim.x += (s.x - T.aim.x) * Math.min(1, dt * 3); T.aim.z += (s.z - T.aim.z) * Math.min(1, dt * 3); } }   // 쉬움 조준 도움(가까운 과녁 쪽으로 살짝)
      P.W.yaw = Math.atan2(dx, dz);
      ring.visible = true; ring.position.set(T.aim.x, (o.ringY ? o.ringY(T.aim.x, T.aim.z) : pl.height(T.aim.x, T.aim.z, P.W.y)) + 0.06, T.aim.z);
    } else if (T.aim) {                                          // 놓음 = 던짐
      P.lock = false; P.aiming = false; ring.visible = false; P.pose = { throw: 1 }; T.poseT = 0.5;
      const a = T.aim, hy = P.W.y + 1.5, ty = o.landY ? o.landY(a.x, a.z) : pl.height(a.x, a.z, P.W.y);
      const d = Math.hypot(a.x - P.W.x, a.z - P.W.z);
      fly.go(P.W.x, hy, P.W.z, a.x, ty, a.z, (o.T || 0.7) * (0.6 + d / 20), Math.max(1.2, (ty - hy) * 0.5 + d * 0.22), (x, y, z) => o.onLand && o.onLand(x, y, z));
      T.aim = null; T.thrown++; T.held = false; G.hold(null); P.noReach = false;
      if (o.onThrow) o.onThrow();
    }
    if (T.poseT > 0) { T.poseT -= dt; if (T.poseT <= 0 && !P.lock) P.pose = null; }
  };
  T.sense = () => ({ held: T.held, aim: T.aim ? { x: +T.aim.x.toFixed(2), z: +T.aim.z.toFixed(2) } : null, flying: fly.on });
  T.dispose = () => { ring.removeFromParent(); ring.geometry.dispose(); ring.material.dispose(); fly.dispose(); };
  return T;
}

/* 별 하늘(볼라 발사기 장면) — 카메라 둘레 큰 구 위 점 · 드래곤이 지나가면 깊이로 가려짐(별이 가려지는 것 = 보이는 짝) */
export function makeStars(group, n = 700, seed = 7) {
  const pos = new Float32Array(n * 3); let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, e = 0.08 + Math.pow(rnd(), 0.7) * 1.35, R = 600; pos[i * 3] = Math.cos(a) * Math.cos(e) * R; pos[i * 3 + 1] = Math.sin(e) * R; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6dc, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.95, depthWrite: false }));
  m.renderOrder = 905; m.frustumCulled = false; group.add(m);
  return { mesh: m, follow(cam) { m.position.copy(cam.position); }, dispose() { m.removeFromParent(); g.dispose(); m.material.dispose(); } };
}

/* 빛 꼬리(나이트 퓨리가 지나간 자리 · 보랏빛 얇은 띠) — 최근 자리 n개 · 매 걸음 new X */
export function makeTrail(group, n = 40, color = 0x9a8cff) {
  const pos = new Float32Array(n * 3).fill(-999), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; m.renderOrder = 958; group.add(m);
  const T = { mesh: m, k: 0 };
  T.push = (x, y, z) => { pos.copyWithin(3, 0, (n - 1) * 3); pos[0] = x; pos[1] = y; pos[2] = z; g.attributes.position.needsUpdate = true; T.k++; };
  T.clear = () => { pos.fill(-999); g.attributes.position.needsUpdate = true; T.k = 0; };
  T.head = () => (T.k ? { x: pos[0], y: pos[1], z: pos[2] } : null);
  T.dispose = () => { m.removeFromParent(); g.dispose(); m.material.dispose(); };
  return T;
}

/* 작은 소품(장이 그 자리에 둠 · 장소 group에 넣음) — 건초 더미 · 물통(나무 통) · 볼라 더미 · 수레 */
const GEO = {};
function geo(k, f) { if (!GEO[k]) { GEO[k] = f(); SHARED.add(GEO[k]); } return GEO[k]; }   // 장소가 바뀌어도 다시 씀(공유)
export function prop(group, kind, x, y, z, yaw = 0, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(s);
  if (kind === 'hay') { const m = new THREE.Mesh(geo('hay', () => new THREE.SphereGeometry(0.9, 9, 6).scale(1.2, 0.75, 1)), toon({ color: 0xc9a65a })); m.position.y = 0.55; g.add(m); }
  else if (kind === 'cart') {
    const b = new THREE.Mesh(geo('cartb', () => new THREE.BoxGeometry(1.6, 0.5, 2.4)), toon({ color: 0x6a4a30 })); b.position.y = 0.8; g.add(b);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(geo('wheel', () => new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12).rotateZ(Math.PI / 2)), toon({ color: 0x4a3626 })); w.position.set(sx * 0.9, 0.5, 0.2); g.add(w); }
    const h = new THREE.Mesh(geo('carth', () => new THREE.SphereGeometry(0.75, 8, 5).scale(1, 0.6, 1.4)), toon({ color: 0xc9a65a })); h.position.y = 1.2; g.add(h);
  }
  else if (kind === 'trough') { const m = new THREE.Mesh(geo('trough', () => new THREE.BoxGeometry(2.2, 0.6, 0.9)), toon({ color: 0x5f4632 })); m.position.y = 0.3; g.add(m); const w = new THREE.Mesh(geo('troughw', () => new THREE.BoxGeometry(2.0, 0.05, 0.72)), toon({ color: 0x3f6470 })); w.position.y = 0.58; g.add(w); }
  else if (kind === 'pile') { for (let i = 0; i < 3; i++) { const it = makeItem('bola'); it.position.set((i - 1) * 0.3, 0.15 + (i % 2) * 0.1, (i % 2) * 0.2); it.rotation.set(Math.PI / 2, i, 0); g.add(it); } const crate = new THREE.Mesh(geo('crate', () => new THREE.BoxGeometry(1, 0.5, 0.8)), toon({ color: 0x6a4a30 })); crate.position.y = -0.05; g.add(crate); }
  else if (kind === 'rack') { const m = new THREE.Mesh(geo('rack', () => new THREE.BoxGeometry(1.4, 0.9, 0.5)), toon({ color: 0x5f4632 })); m.position.y = 0.45; g.add(m); for (let i = 0; i < 3; i++) { const it = makeItem('axe'); it.position.set(-0.4 + i * 0.4, 1.05, 0); it.rotation.set(0, 0, 0.3); g.add(it); } }
  else if (kind === 'basket') { const m = new THREE.Mesh(geo('basket', () => new THREE.CylinderGeometry(0.5, 0.38, 0.5, 10)), toon({ color: 0x9a7a4a })); m.position.y = 0.25; g.add(m); for (let i = 0; i < 3; i++) { const it = makeItem(i % 2 ? 'salmon' : 'cod'); it.position.set((i - 1) * 0.22, 0.55, 0); it.rotation.set(0, i * 0.8, 0.4); g.add(it); } }
  group.add(g); return g;
}
