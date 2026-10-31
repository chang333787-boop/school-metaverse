// 7·9장이 같이 쓰는 것 — 숫돌 박자(작업대 판 같은 꼴) · 투구 바꿔 쓰기 · 짐 보따리(8장도 씀) · 벗은 투구 · 눈길 부채꼴(땅을 따라) · 머리 위 ?/! · 관중 · 탄 사람 자리 · 공책 그림(코브 스케치 · 둥지 쪽)
// 기하·재질은 처음 한 번만 짓고 SHARED(장소를 비워도 남김) · 매 걸음 new X · 이펙트는 원인 자리에서만
import * as THREE from 'three';
import { toon, SHARED } from '../look/kit.js?v=16';
import { loadModel } from '../look/models.js?v=16';
import { createHumanRig } from '../look/human_rig.js?v=16';
import { holdItem } from './fx.js?v=16';

const INK = '#2b2118';
const GEO = {};
function geo(k, f) { if (!GEO[k]) { GEO[k] = f(); SHARED.add(GEO[k]); } return GEO[k]; }
function shared(o) { SHARED.add(o); return o; }

/* ── 숫돌 박자(7장 ①) — 발판이 바닥에 닿을 때 Space → 숫돌이 빨리 돎 · 엇박 = 칼이 미끄러짐(느려짐) · 숫돌이 서면 말도 멈춤 ── */
export function createGrind(G, easy) {
  const B = G.bench, cv = B.el.querySelector('canvas'), X = cv.getContext('2d');
  const rate = easy ? 0.45 : 0.55, T = 1 / rate, Wn = easy ? 0.46 : 0.3, decay = easy ? 0.035 : 0.08;
  const S = { kind: 'grind', on: false, spd: 0, slip: false, k: 0, stop: true, p: 0 };
  let ph = 0.05, spd = 0, slip = 0, ang = 0, sharp = 0, spark = 0, sparkA = 0;
  /* 숫돌 판은 작게·위로(말풍선을 가리지 않게 — 걸으며 듣기) · 닫으면 원래대로 */
  const st = B.el.style;
  const g = { S, show() { st.top = '40%'; st.width = 'min(540px,78vw)'; st.height = 'min(335px,50vh)'; B.show(); B.S = S; }, hide() { B.hide(); B.S = {}; st.top = st.width = st.height = ''; } };
  g.step = (dt, I) => {
    ph = (ph + dt * rate) % 1;
    const on = Math.abs(ph - 0.5) * T < Wn / 2;
    if (slip > 0) slip -= dt;
    if (I.tap('jump')) { if (on && slip <= 0) { spd = Math.min(1, spd + 0.34); S.k++; spark = 0.45; } else { slip = 0.7; spd = Math.max(0, spd - 0.22); G.sfx.play('clang'); } }
    spd = Math.max(0, spd - dt * decay);
    ang += spd * dt * 9; sharp = Math.min(1, sharp + spd * dt * 0.025); if (spark > 0) spark -= dt; sparkA += dt * 23;
    S.on = on; S.spd = +spd.toFixed(2); S.slip = slip > 0; S.stop = spd < 0.05; S.p = +ph.toFixed(2);
    draw(on);
  };
  g.speed = () => spd;
  function draw(on) {
    X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 1000, 620); X.fillStyle = INK; X.font = 'bold 30px sans-serif'; X.fillText('숫돌 — 발판이 바닥에 닿을 때 Space', 30, 48);
    /* 숫돌 바퀴 */
    const cx = 380, cy = 300, r = 160;
    X.fillStyle = '#8d8a82'; X.beginPath(); X.arc(cx, cy, r, 0, 6.3); X.fill(); X.strokeStyle = INK; X.lineWidth = 5; X.stroke();
    X.strokeStyle = '#6e6b64'; X.lineWidth = 3; for (const rr of [120, 80]) { X.beginPath(); X.arc(cx, cy, rr, 0, 6.3); X.stroke(); }
    X.strokeStyle = INK; X.lineWidth = 6; for (let k = 0; k < 6; k++) { const a = ang + k * Math.PI / 3; X.beginPath(); X.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); X.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14)); X.stroke(); }
    X.fillStyle = '#a83e1e'; X.beginPath(); X.arc(cx + Math.cos(ang) * (r - 22), cy + Math.sin(ang) * (r - 22), 11, 0, 6.3); X.fill();
    X.fillStyle = '#5a4130'; X.beginPath(); X.arc(cx, cy, 28, 0, 6.3); X.fill(); X.stroke();
    /* 칼(갈수록 밝아짐) — 바퀴 오른쪽 위에 댐 */
    const bx = cx + r * 0.72, by = cy - r * 0.7, c0 = [138, 142, 144], c1 = [236, 240, 242], cc = c0.map((v, i) => Math.round(v + (c1[i] - v) * sharp));
    X.fillStyle = 'rgb(' + cc.join(',') + ')'; X.beginPath(); X.moveTo(bx - 6, by + 4); X.lineTo(bx + 210, by - 70); X.lineTo(bx + 214, by - 52); X.lineTo(bx + 4, by + 16); X.closePath(); X.fill(); X.lineWidth = 3; X.stroke();
    X.fillStyle = '#6a4a2e'; X.fillRect(bx + 212, by - 84, 70, 26);
    /* 불티 — 칼이 돌에 닿고 돌이 빠를 때만(원인) */
    if (spd > 0.45 || spark > 0) { X.strokeStyle = '#f08a2a'; X.lineWidth = 3; for (let k = 0; k < 7; k++) { const a = -0.9 + Math.sin(sparkA + k * 1.7) * 0.6, L = 26 + (k * 13) % 40; X.beginPath(); X.moveTo(bx, by + 8); X.lineTo(bx + Math.cos(a) * L - 30, by + 8 - Math.sin(a) * L * 0.6 + 30); X.stroke(); } }
    /* 발판(오르내림) — 바닥 = 누를 때 */
    const dep = Math.sin(ph * Math.PI), fy = 470 + dep * 70;
    X.strokeStyle = INK; X.lineWidth = 8; X.beginPath(); X.moveTo(cx, cy); X.lineTo(cx + 40, fy - 20); X.stroke();
    X.fillStyle = '#7a5a3a'; X.fillRect(cx - 110, fy - 20, 260, 26); X.lineWidth = 3; X.strokeRect(cx - 110, fy - 20, 260, 26);
    X.strokeStyle = '#8a7a62'; X.setLineDash([10, 8]); X.beginPath(); X.moveTo(cx - 140, 560); X.lineTo(cx + 180, 560); X.stroke(); X.setLineDash([]);
    if (on) { X.strokeStyle = INK; X.lineWidth = 4; X.beginPath(); X.arc(cx + 20, 548, 24, 0, 6.3); X.stroke(); }
    X.fillStyle = '#5a4a3a'; X.beginPath(); X.ellipse(cx + 20, fy - 34, 40, 16, 0, 0, 6.3); X.fill();   // 발
    if (slip > 0) { X.fillStyle = '#a83e1e'; X.font = 'bold 30px sans-serif'; X.fillText('칼이 미끄러졌다!', 600, 380); }
    if (spd < 0.05) { X.fillStyle = '#8a7a62'; X.font = '24px sans-serif'; X.fillText('숫돌이 섰다…', 640, 440); }
  }
  return g;
}

/* ── 투구 — 플레이어 몸을 hiccup_hel ↔ hiccup으로 바꿔 끼움(손에 든 것 다시 붙임) · 저장 = G.inv.helmet ── */
export function setHelmet(G, on) {
  const P = G.player; on = !!on; G.inv.helmet = on ? 1 : 0; G.flags.helmet = on;
  if (!!P.helmOn === on && P.root) return Promise.resolve();
  P.helmOn = on;
  return loadModel('assets/models/' + (on ? 'hiccup_hel' : 'hiccup') + '.glb?v=16').then(({ root, bones }) => {
    if (P.helmOn !== on) return;
    const old = P.root, parent = old ? old.parent : null, item = P.item;
    if (old) { root.position.copy(old.position); root.rotation.copy(old.rotation); old.removeFromParent(); }
    P.root = root; P.bones = bones; P.rig = createHumanRig(bones, root); P.itemObj = null;
    root.visible = !P.hidden;
    (parent || (G.place && G.place.group)).add(root);
    if (item) holdItem(P, item);
  });
}
/* 벗어 둔 투구(땅 위) — 작은 쇠 반구 + 작은 뿔 둘 */
export function helmetObj(group, x, y, z, yaw = 0) {
  const g = new THREE.Group();
  const m = toon({ color: 0x8d8a82 }), h = toon({ color: 0xe6dcc0 });
  g.add(new THREE.Mesh(geo('helm', () => new THREE.SphereGeometry(0.17, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), m));
  for (const s of [-1, 1]) { const c = new THREE.Mesh(geo('horn', () => new THREE.ConeGeometry(0.035, 0.14, 6).translate(0, 0.07, 0)), h); c.position.set(s * 0.15, 0.08, 0); c.rotation.z = -s * 0.9; g.add(c); }
  g.position.set(x, y + 0.02, z); g.rotation.set(0.25, yaw, 0.1); group.add(g); return g;
}

/* ── 짐 보따리(7장 ⑤⑥ → 8장 아스트리드가 봄) — 자루 + 말아 묶은 담요 + 끈 · makePack(group, x, y, z, yaw) ── */
export function makePack(group, x, y, z, yaw = 0) {
  const g = new THREE.Group();
  const sack = new THREE.Mesh(geo('sack', () => { const s = new THREE.SphereGeometry(0.42, 12, 9); const p = s.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i); p.setY(i, yy < 0 ? yy * 0.55 : yy * 1.05); p.setX(i, p.getX(i) * (1 + Math.sin(i * 1.7) * 0.04)); } s.computeVertexNormals(); return s.translate(0, 0.24, 0); }), toon({ color: 0x9a7a52 }));
  const tie = new THREE.Mesh(geo('tie', () => new THREE.TorusGeometry(0.16, 0.035, 5, 12).rotateX(Math.PI / 2).translate(0, 0.62, 0)), toon({ color: 0x5a4130 }));
  const neck = new THREE.Mesh(geo('neck', () => new THREE.ConeGeometry(0.2, 0.26, 9).rotateX(Math.PI).translate(0, 0.74, 0)), toon({ color: 0x9a7a52 }));
  const roll = new THREE.Mesh(geo('roll', () => new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10).rotateZ(Math.PI / 2).translate(0, 0.16, 0.45)), toon({ color: 0xa8543a }));
  const band = new THREE.Mesh(geo('band', () => new THREE.TorusGeometry(0.165, 0.03, 4, 10).rotateY(Math.PI / 2).translate(0.2, 0.16, 0.45)), toon({ color: 0x3a2a1e }));
  g.add(sack, tie, neck, roll, band);
  g.position.set(x, y, z); g.rotation.y = yaw; group.add(g); return g;
}

/* ── 눈길 부채꼴 — 땅 높이를 따라 깔리는 엷은 부채(4줄 × 12칸) · set(x, z, yaw, r, half, alert 0~1) — 10Hz로만 다시 깖 ── */
const FAN_MAT = [0, 1].map((k) => shared(new THREE.MeshBasicMaterial({ color: k ? 0xd8503a : 0xffe08a, transparent: true, opacity: k ? 0.34 : 0.24, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, fog: true })));
export function gazeFan(group, place) {
  const NA = 12, NR = 4, n = 1 + NR * (NA + 1), pos = new Float32Array(n * 3), idx = [];
  for (let r = 0; r < NR; r++) for (let a = 0; a < NA; a++) {
    const i0 = r === 0 ? 0 : 1 + (r - 1) * (NA + 1) + a, i1 = r === 0 ? 0 : i0 + 1, j0 = 1 + r * (NA + 1) + a, j1 = j0 + 1;
    if (r === 0) idx.push(0, j1, j0); else idx.push(i0, j1, j0, i0, i1, j1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, FAN_MAT[0]); m.frustumCulled = false; m.renderOrder = 960; group.add(m);
  const F = { mesh: m, acc: 9 };
  F.set = (x, z, yaw, r, half, alert = 0, dt = 0.1) => {
    m.material = FAN_MAT[alert > 0.5 ? 1 : 0];
    F.acc += dt; if (F.acc < 0.1) return; F.acc = 0;
    const y0 = place.height(x, z, 30) + 0.14; pos[0] = x; pos[1] = y0; pos[2] = z;
    for (let k = 1; k <= NR; k++) for (let a = 0; a <= NA; a++) {
      const ang = yaw - half + (a / NA) * half * 2, rr = r * k / NR, px = x + Math.sin(ang) * rr, pz = z + Math.cos(ang) * rr, i = 1 + (k - 1) * (NA + 1) + a;
      pos[i * 3] = px; pos[i * 3 + 1] = place.height(px, pz, y0) + 0.14; pos[i * 3 + 2] = pz;
    }
    g.attributes.position.needsUpdate = true;
  };
  F.show = (v) => { m.visible = v; };
  F.dispose = () => { m.removeFromParent(); g.dispose(); };
  return F;
}

/* ── 머리 위 ?/! (눈치챔 · 들킴) — 캔버스 글 한 장씩(공유) ── */
let MARKS = null;
function markMats() {
  if (MARKS) return MARKS;
  MARKS = ['?', '!'].map((ch) => { const c = document.createElement('canvas'); c.width = c.height = 64; const X = c.getContext('2d'); X.fillStyle = '#f4ead2'; X.strokeStyle = INK; X.lineWidth = 4; X.beginPath(); X.arc(32, 30, 24, 0, 6.3); X.fill(); X.stroke(); X.fillStyle = ch === '!' ? '#a83e1e' : INK; X.font = 'bold 36px sans-serif'; X.textAlign = 'center'; X.fillText(ch, 32, 43); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; SHARED.add(t); return shared(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); });
  return MARKS;
}
export function headMark(group) {
  const M = markMats(), s = new THREE.Sprite(M[0]); s.scale.setScalar(0.7); s.renderOrder = 990; s.visible = false; group.add(s);
  return { s, set(x, y, z, k) { s.visible = k > 0; if (k > 0) { s.material = M[k > 1 ? 1 : 0]; s.position.set(x, y, z); } }, dispose() { s.removeFromParent(); } };
}

/* ── 관중(훈련장 가장자리) — villager1~3을 lists.crowd 자리에 n명(keep = 장소가 바뀔 때까지) · 사람 수 ≤ 16 ── */
const CROWD_AT = [1, 18, 3, 16, 5, 14, 7, 12, 9, 11, 2, 17];
export function crowd(G, n = 10, skip = []) {
  const L = G.place.lists.crowd || [], out = [], who = ['villager1', 'villager2', 'villager3'];
  let k = 0;
  for (const ix of CROWD_AT) {
    if (out.length >= n) break; if (skip.includes(ix) || !L[ix]) continue;
    const key = 'crowd' + ix, a = L[ix];
    out.push(G.castBy[key] || G.person(who[k++ % 3], { x: a.x, y: a.y, z: a.z, yaw: a.yaw }, { keep: key, noCollide: true }));
  }
  return out;
}
/* 관중 몸짓 — kind 'cheer'(두 팔 · 들썩) · 'murmur'(손짓) · 'still' · t = 놀이 시간 */
export function crowdPose(list, kind, t) {
  for (let i = 0; i < list.length; i++) {
    const H = list[i], p = H._cp || (H._cp = { cheer: 0, talk: 0, point: 0 });   // 사람마다 자세 그릇 하나(매 걸음 new X)
    p.cheer = kind === 'cheer' ? (Math.sin(t * 5 + i * 1.3) > -0.2 ? 1 : 0.4) : 0;
    p.talk = kind === 'murmur' ? (Math.sin(t * 2 + i) > 0 ? 1 : 0) : 0;
    p.point = kind === 'point' ? 1 : kind === 'murmur' && i % 4 === 0 ? 0.6 : 0;
    H.pose = p;
  }
}
/* 자세 그릇 — 값만 바꿔 넣음(매 걸음 new X) · pz(H, 'throw', 1) */
export function pz(H, k, v) { const p = H._pz || (H._pz = {}); for (const n in p) p[n] = 0; if (k) p[k] = v; H.pose = p; return p; }

/* ── 탄 사람 자리 — 드래곤 등 위(뿌리 기준 높이·앞뒤) · drawHook에서 부름(사람은 manual) ── */
const _v = new THREE.Vector3();
export const SEAT = { gronckle: [1.25, 0.1], nadder: [1.75, 0.3], nightmare: [2.25, 0.9], zippleback: [1.75, 0.6], nightfury: [1.55, 0.4], terror: [0.6, 0] };
export function seatOn(H, D, back = 0, side = 0, dt = 0.016) {
  if (!H.root || !D.root) return;
  const s = SEAT[D.kind] || [1.5, 0], r = D.root, sc = r.scale.x;
  _v.set(side, s[0] * sc, (s[1] - back) * sc).applyAxisAngle(THREE.Object3D.DEFAULT_UP, r.rotation.y);
  H.root.position.set(r.position.x + _v.x, r.position.y + _v.y, r.position.z + _v.z); H.root.rotation.y = r.rotation.y;
  if (H.rig) { H.rig.ride += (1 - H.rig.ride) * Math.min(1, dt * 8); H.rig.speed = 0; H.rig.update(dt); }
}

/* ── 공책 그림(화면 구석 · 말풍선을 가리지 않음) — 3장 코브 스케치 · 둥지 쪽(대장만 나쁘다) ── */
export function drawCoveSketch(cv) {
  const X = cv.getContext('2d'); X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 400, 300);
  X.strokeStyle = INK; X.lineWidth = 4; X.lineCap = 'round';
  const L = [[40, 200, 120, 170], [120, 170, 200, 160], [200, 160, 280, 170], [280, 170, 340, 150], [340, 150, 370, 160], [120, 170, 150, 100], [150, 100, 220, 70], [220, 70, 200, 160], [40, 200, 20, 230], [20, 230, 50, 240], [50, 240, 40, 200], [30, 210, 10, 190], [345, 145, 360, 130], [360, 130, 372, 150]];
  for (const s of L) { X.beginPath(); X.moveTo(s[0], s[1]); X.lineTo(s[2], s[3]); X.stroke(); }
  X.fillStyle = '#4a8a3a'; X.beginPath(); X.arc(352, 150, 5, 0, 6.3); X.fill();
  X.fillStyle = INK; X.font = 'bold 20px sans-serif'; X.fillText('숨은 호수 — 겁먹은 눈', 18, 286);
}
export function drawNestPage(cv) {
  const X = cv.getContext('2d'); X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 400, 300);
  X.strokeStyle = INK; X.lineWidth = 3; X.lineCap = 'round';
  X.fillStyle = '#6a5a58'; X.beginPath(); X.moveTo(40, 230); X.lineTo(150, 70); X.lineTo(190, 90); X.lineTo(250, 60); X.lineTo(360, 230); X.closePath(); X.fill(); X.stroke();   // 화산 섬
  X.fillStyle = '#2b2118'; X.beginPath(); X.ellipse(200, 170, 70, 34, 0, 0, 6.3); X.fill();                                                                                 // 큰 그림자
  X.fillStyle = '#e8c860'; for (let k = 0; k < 6; k++) { X.beginPath(); X.arc(160 + k * 16, 160 + (k % 2) * 6, 4, 0, 6.3); X.fill(); }                                   // 눈 여섯
  X.strokeStyle = INK; for (const [x, y] of [[70, 120], [320, 110], [100, 60], [300, 50]]) { X.beginPath(); X.moveTo(x - 14, y); X.quadraticCurveTo(x, y - 12, x + 14, y); X.moveTo(x, y); X.lineTo(x, y + 8); X.stroke(); }   // 작은 드래곤(생선 물고)
  X.strokeStyle = '#a83e1e'; X.lineWidth = 4; X.beginPath(); X.arc(200, 170, 82, 0, 6.3); X.stroke();
  X.fillStyle = '#a83e1e'; X.font = 'bold 26px sans-serif'; X.fillText('대장만 나쁘다!', 120, 282);
  X.fillStyle = INK; X.font = 'bold 22px sans-serif'; X.fillText('둥지', 18, 32);
}

/* ── 깨진 그물 고리(9장 ③) — 작은 쇠고리 여럿이 떨어짐(풀 하나 · 원인 = 투슬리스가 지붕을 뚫음) ── */
export function chainBits(group, n = 14) {
  const mesh = new THREE.InstancedMesh(geo('link', () => new THREE.TorusGeometry(0.16, 0.045, 4, 8)), toon({ color: 0x48484c }), n);
  mesh.frustumCulled = false; group.add(mesh);
  const P = new Float32Array(n * 6), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let t = 0, floor = 0, live = false;
  const C = { mesh };
  C.burst = (x, y, z, fy) => { floor = fy; live = true; t = 0; for (let i = 0; i < n; i++) { const a = i * 2.4; P[i * 6] = x + Math.cos(a) * 0.8; P[i * 6 + 1] = y; P[i * 6 + 2] = z + Math.sin(a) * 0.8; P[i * 6 + 3] = Math.cos(a) * (1 + (i % 3)); P[i * 6 + 4] = 2 + (i % 4); P[i * 6 + 5] = Math.sin(a) * (1 + (i % 3)); } };
  C.step = (dt) => {
    if (!live) { mesh.visible = false; return; } mesh.visible = true; t += dt;
    for (let i = 0; i < n; i++) { const o = i * 6; if (P[o + 1] > floor + 0.05) { P[o + 4] -= 9.8 * dt; P[o] += P[o + 3] * dt; P[o + 1] += P[o + 4] * dt; P[o + 2] += P[o + 5] * dt; if (P[o + 1] < floor + 0.05) P[o + 1] = floor + 0.05; }
      e.set(t * 3 + i, t * 2 + i * 0.7, 0); q.setFromEuler(e); p.set(P[o], P[o + 1], P[o + 2]); m4.compose(p, q, s); mesh.setMatrixAt(i, m4); }
    mesh.instanceMatrix.needsUpdate = true;
  };
  C.dispose = () => { mesh.removeFromParent(); mesh.dispose(); };
  return C;
}
