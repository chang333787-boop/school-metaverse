// 고기잡이배(4장 ② · 동사 '박자·버티기') — 정해진 뱃길(place.lists.boatPath)을 따라가고 플레이어는 노 박자만
// Space = 노가 물에 들어가는 박자에 누르면 힘(다 실림) · 노가 공중에 있을 때(엇박) = 거의 안 감 · 노가 물을 당기는 중에 또 누름·연타 = 노가 엉킴(잠깐 멈춤)
// ←→ = 배를 옆으로 조금(물결 피하기) · 끝에 닿으면 'arrive'(낚시는 메인이 만듦) · 배 모양은 three 코드로(곡면 선체 · 노 둘 · 히컵 자리) · 매 걸음 new X
import * as THREE from 'three';
import { toon } from '../look/kit.js?v=16';

/* 노 박자 — 누른 뒤 0~0.5초 물 당기기 · ~1.1초 노를 들어 앞으로 · 1.1~1.5초 = 노가 물에 들어가는 박자(힘 다 실림) · 그 뒤 = 물 위에서 기다림 */
export const BK = { drive: 0.5, catchA: 1.1, catchB: 1.5, power: 1.5, drag: 0.2, vmax: 7, side: 2.6, latMax: 5, tangle: 1.6 };
const WAVES = [[0.16, 62, 1.0, 0.3], [0.13, 31, 0.6, 1.0], [0.1, 17, -0.4, 0.9], [0.08, 9, 0.9, -0.5]];   // kit 바다와 같은 물결(세로 높이만)
const WV = WAVES.map(([st, len, dx, dz]) => { const k = 6.28318 / len, d = Math.hypot(dx, dz); return { k, c: Math.sqrt(9.8 / k), a: st / k, dx: dx / d, dz: dz / d }; });
export function seaHeight(x, z, t) { let y = 0; for (let i = 0; i < 4; i++) { const w = WV[i]; y += w.a * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * t)); } return y; }

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* 배 모양 — 단면을 길이 따라 이어 만든 곡면 선체(널빤지 결 정점색) + 가로 앉을 판 둘 + 뱃머리 기둥 · 노는 따로(움직임) */
function hullGeo() {
  const NU = 22, NV = 12, L = 4.8, pos = [], col = [], idx = [], c = new THREE.Color();
  const PL = [new THREE.Color(0x7a5534), new THREE.Color(0x8d6440), new THREE.Color(0x6a472b)], TAR = new THREE.Color(0x3a2e26);
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, s = Math.sin(Math.PI * u), z = (u - 0.5) * L;
    const w = 0.82 * Math.pow(s, 0.55) + 0.02, keel = -0.42 * Math.pow(s, 0.35), top = 0.38 + 0.42 * Math.pow(Math.abs(2 * u - 1), 3.2);
    for (let j = 0; j <= NV; j++) {
      const th = (j / NV - 0.5) * Math.PI, x = w * Math.sin(th), y = keel + (top - keel) * (1 - Math.cos(th)) * (Math.abs(th) > 0.01 ? 1 : 0);
      pos.push(x, y, z);
      const band = Math.floor((1 - Math.cos(th)) * 3.5);         // 널빤지 줄
      c.copy(PL[band % 3]); if (y < 0.05) c.lerp(TAR, 0.55); if (j === 0 || j === NV) c.multiplyScalar(0.75);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, cc = a + NV + 1, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const parts = [g];
  const paint = (geo, hex) => { geo.deleteAttribute('uv'); const n = geo.attributes.position.count, a = new Float32Array(n * 3); c.set(hex); for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  parts.push(paint(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6).rotateZ(Math.PI / 2).scale(1, 1, 3.2).translate(0, 0.2, 0.15), 0x9a7048));    // 노 젓는 자리(가로 판)
  parts.push(paint(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6).rotateZ(Math.PI / 2).scale(1, 1, 3.2).translate(0, 0.22, -1.35), 0x9a7048));
  const stem = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.3, 2.35), new THREE.Vector3(0, 0.55, 2.48), new THREE.Vector3(0, 1.05, 2.3), new THREE.Vector3(0, 1.12, 2.08)]), 8, 0.07, 6);
  parts.push(paint(stem, 0x6a472b));
  for (const s of [1, -1]) parts.push(paint(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 6).translate(s * 0.8, 0.5, 0.15), 0x4a3a2c));      // 노걸이
  const m = mergeLite(parts); parts.forEach((p) => p.dispose()); return m;
}
function oarGeo() {
  const c = new THREE.Color(0x9b7650), parts = [new THREE.CylinderGeometry(0.035, 0.04, 3.0, 6).rotateZ(Math.PI / 2).translate(0.6, 0, 0)];
  const blade = new THREE.SphereGeometry(1, 8, 6).scale(0.42, 0.03, 0.13).translate(1.95, 0, 0); parts.push(blade);
  for (const p of parts) { p.deleteAttribute('uv'); const n = p.attributes.position.count, a = new Float32Array(n * 3); for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } p.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  const m = mergeLite(parts); parts.forEach((p) => p.dispose()); return m;
}
/* 작은 합치기(위치·법선·색 · 모두 인덱스 있음) */
function mergeLite(gs) {
  let nv = 0, ni = 0; for (const g of gs) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), I = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of gs) {
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count; P.set(g.attributes.position.array, ov * 3); Nn.set(g.attributes.normal.array, ov * 3); Cc.set(g.attributes.color.array, ov * 3);
    if (g.index) for (let k = 0; k < g.index.count; k++) I[oi + k] = g.index.array[k] + ov; else for (let k = 0; k < n; k++) I[oi + k] = k + ov;
    oi += g.index ? g.index.count : n; ov += n;
  }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); m.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); m.setIndex(new THREE.BufferAttribute(I, 1));
  m.computeBoundingSphere(); return m;
}

export function createBoat({ path, mode = 'normal', rider = null, waves = null }) {
  const pts = path.map((p) => ({ x: p.x, z: p.z })), segL = [];
  let total = 0; for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z); segL.push(d); total += d; }
  const easy = mode === 'easy';
  const win = easy ? [0.95, 1.7] : [BK.catchA, BK.catchB];
  /* 물결(부서지는 너울) — 뱃길 위 자리(s)와 옆 자리(lat) · 옆으로 천천히 움직임 · 쉬움은 둘 */
  const HZ = (waves || (easy ? [[70, 2.5], [150, -2.5]] : [[55, 2.2], [100, -2.6], [145, 2.8], [190, -1.8]])).map(([s, lat], i) => ({ s, lat0: lat, lat, ph: i * 1.7, hit: false }));

  /* 모양 */
  const root = new THREE.Group(); root.name = 'boat';
  const hull = new THREE.Mesh(hullGeo(), toon({ vc: true, side: THREE.DoubleSide })); root.add(hull);
  const oarG = oarGeo(), oarM = toon({ vc: true });
  const oars = [1, -1].map((s) => { const piv = new THREE.Group(); piv.position.set(s * 0.8, 0.58, 0.15); const o = new THREE.Mesh(oarG, oarM); o.scale.x = s; piv.add(o); root.add(piv); return { piv, o, s }; });
  /* 물결 표시(흰 물마루 띠 · 한 묶음) */
  const foamG = new THREE.SphereGeometry(1, 10, 5); foamG.deleteAttribute('uv'); { const n = foamG.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(0xeef3f1); for (let k = 0; k < n; k++) { const y = foamG.attributes.position.getY(k); c.set(y > 0 ? 0xf2f6f4 : 0x9fb8bc); a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } foamG.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  const foam = new THREE.InstancedMesh(foamG, toon({ vc: true }), HZ.length); foam.frustumCulled = false;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _up = new THREE.Vector3(0, 1, 0);

  const S = { s: 0, total, lat: 0, speed: 0, yaw: 0, x: pts[0].x, z: pts[0].z, y: 0, pitch: 0, roll: 0, phase: 'ready', oarT: 9, strokes: 0, perfect: 0, offbeat: 0, tangles: 0, wavesHit: 0, arrived: false, arriveT: 0, t: 0, tangleT: 0, lastPress: -9, push: 0 };
  const PV = { x: S.x, z: S.z, y: 0, yaw: 0, s: 0 };
  const L = {}, EV = { stroke: { power: 0, kind: '' }, tangle: {}, wave: { i: 0 }, arrive: { t: 0 } };
  const emit = (n) => { const a = L[n]; if (a) for (let i = 0; i < a.length; i++) a[i](EV[n]); };
  const B = { root, foam, state: S, hazards: HZ, total };
  B.on = (ev, fn) => { (L[ev] = L[ev] || []).push(fn); return B; };

  function at(s, o) {                                       // 뱃길 위 자리·방향(s m)
    s = clamp(s, 0, total - 1e-3); let i = 0; while (i < segL.length - 1 && s > segL[i]) { s -= segL[i]; i++; }
    const a = pts[i], b = pts[i + 1], k = s / segL[i]; o.x = a.x + (b.x - a.x) * k; o.z = a.z + (b.z - a.z) * k; o.yaw = Math.atan2(b.x - a.x, b.z - a.z); return o;
  }
  const _o = { x: 0, z: 0, yaw: 0 };
  at(0, _o); S.yaw = PV.yaw = _o.yaw;

  B.step = (dt, I, t) => {
    S.t += dt; PV.x = S.x; PV.z = S.z; PV.y = S.y; PV.yaw = S.yaw; PV.s = S.s;
    S.oarT += dt;
    if (S.tangleT > 0) { S.tangleT -= dt; S.phase = 'tangle'; if (S.tangleT <= 0) { S.phase = 'ready'; S.oarT = 9; } }
    if (I.tap('jump') && !S.arrived) {
      if (S.tangleT > 0) S.tangleT = Math.min(3, S.tangleT + 0.4);   // 엉킨 채 또 누름 = 더 오래
      else if (S.oarT < BK.drive || S.t - S.lastPress < 0.45) {      // 물을 당기는 중에 또 누름·연타 = 엉킴
        S.tangleT = BK.tangle; S.tangles++; S.speed *= 0.5; S.phase = 'tangle'; emit('tangle');
      } else {
        let pw, kind;
        if (S.oarT >= win[0] && S.oarT <= win[1]) { pw = 1; kind = 'beat'; S.perfect++; }
        else if (S.oarT > win[1]) { pw = 0.55; kind = 'start'; }  // 기다리다 다시 시작
        else { pw = 0.08; kind = 'off'; S.offbeat++; }            // 노가 공중(엇박) — 거의 안 감 · 박자는 그대로
        if (kind !== 'off') { S.oarT = 0; S.phase = 'drive'; S.push = pw; S.strokes++; }
        EV.stroke.power = pw; EV.stroke.kind = kind; emit('stroke');
        if (kind === 'off') S.speed += 0.08;
      }
      S.lastPress = S.t;
    }
    if (S.tangleT <= 0) S.phase = S.oarT < BK.drive ? 'drive' : S.oarT < win[0] ? 'recover' : S.oarT <= win[1] ? 'catch' : 'ready';
    /* 힘은 물을 당기는 0.5초 동안 나눠 붙음 */
    if (S.phase === 'drive') S.speed += BK.power * S.push / BK.drive * dt;
    S.speed -= S.speed * BK.drag * dt * (S.arrived ? 6 : 1);
    S.speed = clamp(S.speed, 0, BK.vmax);
    /* 옆으로(물결 피하기) */
    const side = I.axis('right', 'left');               // 왼쪽 = +
    S.lat = clamp(S.lat + side * BK.side * dt * (S.speed > 0.4 ? 1 : 0.4), -BK.latMax, BK.latMax);
    S.s = Math.min(total, S.s + S.speed * dt);
    at(S.s, _o);
    const lx = -Math.cos(_o.yaw), lz = Math.sin(_o.yaw);       // 오른쪽 방향(−cos, sin) → 왼쪽 = 반대
    S.x = _o.x - lx * S.lat; S.z = _o.z - lz * S.lat;
    S.yaw += wrap(_o.yaw + side * 0.12 - S.yaw) * Math.min(1, dt * 2.5);
    /* 물결: 옆으로 천천히 · 지날 때 옆 자리가 겹치면 크게 느려지고 흔들림 */
    for (let i = 0; i < HZ.length; i++) {
      const h = HZ[i]; h.lat = h.lat0 + Math.sin(S.t * 0.35 + h.ph) * 1.2;   // 판정은 배 시간만(같은 판) · t = 바다 물결(보이는 것)
      if (!h.hit && PV.s < h.s && S.s >= h.s) { h.hit = true; if (Math.abs(S.lat - h.lat) < (easy ? 1.8 : 2.3)) { S.speed *= 0.4; S.wavesHit++; S.roll = 0.35; EV.wave.i = i; emit('wave'); } }
    }
    if (!S.arrived && S.s >= total - 0.6) { S.arrived = true; S.arriveT = S.t; EV.arrive.t = S.t; emit('arrive'); }
    /* 물결 따라 오르내림·기울기(보이는 것만 — 판정은 위 값만) */
    S.y = seaHeight(S.x, S.z, t) + 0.05;
    const fb = seaHeight(S.x + Math.sin(S.yaw) * 2, S.z + Math.cos(S.yaw) * 2, t) - seaHeight(S.x - Math.sin(S.yaw) * 2, S.z - Math.cos(S.yaw) * 2, t);
    const lr = seaHeight(S.x - Math.cos(S.yaw) * 0.8, S.z + Math.sin(S.yaw) * 0.8, t) - seaHeight(S.x + Math.cos(S.yaw) * 0.8, S.z - Math.sin(S.yaw) * 0.8, t);
    S.pitch += (-Math.atan2(fb, 4) * 0.8 - S.pitch) * Math.min(1, dt * 3);
    S.roll += (Math.atan2(lr, 1.6) * 0.6 - S.roll) * Math.min(1, dt * 2);
    /* 물결 표시 자리 */
    for (let i = 0; i < HZ.length; i++) {
      const h = HZ[i]; at(h.s, _o); const x = _o.x + Math.cos(_o.yaw) * h.lat, z = _o.z - Math.sin(_o.yaw) * h.lat;
      _p.set(x, seaHeight(x, z, t) + 0.1 + Math.sin(t * 2.2 + h.ph) * 0.12, z); _q.setFromAxisAngle(_up, _o.yaw);   // 긴 쪽 = 뱃길을 가로지름(부서지는 물마루 띠)
      const k = h.hit && S.s > h.s + 8 ? 0.6 : 1; _s.set(4.2 * k, 0.42 + Math.sin(t * 3 + h.ph) * 0.12, 0.9 * k); foam.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    foam.instanceMatrix.needsUpdate = true;
  };

  /* 노 자세: 물 당기기(노 끝이 물속 · 뒤로 쓸기) → 들어서 앞으로 → 물에 닿는 박자(살짝 내려옴) → 기다림(물 바로 위) · 엉킴 = 엇갈려 떪 */
  B.draw = (a, dt = 1 / 60) => {
    const x = PV.x + (S.x - PV.x) * a, z = PV.z + (S.z - PV.z) * a, yaw = PV.yaw + wrap(S.yaw - PV.yaw) * a;
    root.position.set(x, S.y, z); _e.set(S.pitch, yaw, S.roll, 'YXZ'); root.quaternion.setFromEuler(_e);
    const T = S.oarT;
    let sw, lift;
    if (S.phase === 'tangle') { sw = 0.1 + Math.sin(S.t * 23) * 0.25; lift = 0.25 + Math.sin(S.t * 17) * 0.15; }
    else if (T < BK.drive) { const k = T / BK.drive; sw = 0.75 - k * 1.4; lift = -0.2; }
    else if (T < win[0]) { const k = (T - BK.drive) / (win[0] - BK.drive); sw = -0.65 + k * 1.4; lift = 0.28 * Math.sin(Math.PI * Math.min(1, k * 1.1)) + 0.04; }
    else if (T <= win[1]) { sw = 0.75; lift = 0.04 - (T - win[0]) / (win[1] - win[0]) * 0.1; }
    else { sw = 0.75; lift = 0.06 + Math.sin(S.t * 2) * 0.02; }
    for (const o of oars) { o.piv.rotation.set(0, o.s * sw, 0); o.o.rotation.set(0, 0, o.s * lift); }
    if (rider && rider.root) {
      rider.root.position.set(0, 0, 0); rider.root.rotation.set(0, Math.PI, 0);
      if (rider.root.parent !== root) { root.add(rider.root); rider.root.position.set(0, -0.12, 0.45); }
      const R = rider.rig;
      if (R) {
        if ('sit' in R) R.sit = 1; else R.low = 1;
        /* 당길 때 몸을 뒤로 젖히고 팔을 당김 — 있는 값만(reach = 팔 앞으로) */
        R.reach = S.phase === 'drive' ? 0.2 : S.phase === 'tangle' ? 0.6 : 0.85; R.speed = 0;
        if ('stumble' in R) R.stumble = S.phase === 'tangle' ? 0.6 : 0;
        if (R.update) R.update(dt);
      }
      rider.root.position.set(0, -0.12, 0.45);
    }
  };
  B.ready = () => S.phase === 'catch' || S.phase === 'ready';   // 노가 물 바로 위(보임)
  B.dispose = () => { hull.geometry.dispose(); oarG.dispose(); foamG.dispose(); foam.dispose(); };
  return B;
}
