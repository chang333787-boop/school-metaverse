export const DISC = [
  { k: 'egg', t: '🥚 용알 깨우기', h: '동쪽 바위 언덕 꼭대기 둥지에 큰 알이 있대요. 알은 따뜻한 걸 좋아해요.' },
  { k: 'feed', t: '🍇 아기 용 키우기', h: '아기 용은 밤에 빛나는 반딧불 열매를 좋아해요. 마을 곳곳 덤불에 열려요.' },
  { k: 'fly', t: '🐉 용 타고 하늘 날기', h: '다 큰 용에게 다가가 E — 등에 올라타요!' },
  { k: 'whale', t: '🐋 구름 고래 등에 타기', h: '하늘을 도는 구름 고래는 탑 꼭대기 옆을 지나가요. 등 위로 폴짝!' },
  { k: 'rain', t: '🌧️ 비를 내려 꽃 피우기', h: '광장 서쪽 날씨 수정구에서 비를 불러 봐요.' },
  { k: 'snow', t: '❄️ 마을에 눈 내리기', h: '날씨 수정구는 눈도 부를 수 있어요.' },
  { k: 'rainbow', t: '🌈 무지개 다리 건너기', h: '비가 온 뒤 해가 나면… 무지개가 하늘 섬까지 이어진대요.' },
  { k: 'bells', t: '🔔 하늘 섬의 종 노래', h: '하늘 섬 다섯 종을 노래 순서대로 맞혀요. 악보는 생쥐만 들어가는 방에 있대요.' },
  { k: 'frog', t: '🐸 개구리로 변신', h: '물약: 🐸 개구리 다리 + 🌿 민트 잎 + 🍄 버섯' },
  { k: 'bird', t: '🐦 참새로 변신', h: '물약: 🪶 깃털 + ☁️ 구름 솜 + ⚡ 번개 깃털 — 공중에서 점프를 계속 누르면 날갯짓!' },
  { k: 'mouse', t: '🐭 생쥐 비밀방 찾기', h: '물약: 🧀 치즈 + 🍄 버섯 + 🌙 달맞이꽃 — 지팡이 가게 남쪽 벽 쥐구멍으로!' },
  { k: 'books', t: '📚 도망친 책 모으기', h: '광장 북쪽에서 책들이 새처럼 날아다녀요. 살금살금 다가가 E!' },
  { k: 'steam', t: '♨️ 증기 타고 구름 위로', h: '연못 남쪽 간헐천 — 💧 물을 채우고 🔥 불을 붙이면?' },
  { k: 'bounce', t: '🍄 통통 버섯 뛰기', h: '광장 남동쪽 파란 버섯 위로 뛰어올라 봐요.' },
  { k: 'stars', t: '🌌 밤하늘 별자리 잇기', h: '모래시계로 밤을 부른 뒤, 북쪽 하늘의 큰 별 다섯 개에 ✨ 빛을!' },
  { k: 'boulder', t: '🤝 친구와 함께 바위 들기', h: '서쪽 동굴의 바위는 혼자서는 무거워요. 친구와 동시에 🪶!' },
];

export function build(K) {
  const { THREE, scene, P, MODS, SOL, CIR, burst, emit, toast, dlg, later, tween, target, glow, label, lam, SPELLS, ACTS, discover } = K;
  const TAU = Math.PI * 2;
  const has = (k) => K.found.has(k);

  // ───────── 정적(한 메시) ─────────
  const SP = [], SN = [], SC = [], _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  function bake(geo, hex, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo; _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)); g.applyMatrix4(_m);
    const p = g.attributes.position.array, n = g.attributes.normal.array; _c.setHex(hex);
    for (let i = 0; i < p.length; i++) { SP.push(p[i]); SN.push(n[i]); } for (let i = 0; i < p.length / 3; i++) SC.push(_c.r, _c.g, _c.b); g.dispose(); geo.dispose();
  }
  const box = (w, h, d, hex, x, y0, z, solid = true) => { bake(new THREE.BoxGeometry(w, h, d), hex, x, y0 + h / 2, z); if (solid) { const s = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0, y1: y0 + h }; SOL.push(s); return s; } };
  const cyl = (rt, rb, h, hex, x, y0, z, seg = 10, solid = true) => { bake(new THREE.CylinderGeometry(rt, rb, h, seg), hex, x, y0 + h / 2, z); if (solid) { const c = { x, z, r: Math.max(rt, rb), y0, y1: y0 + h }; CIR.push(c); return c; } };
  const rock = (r, hex, x, y, z, sy = 1) => bake(new THREE.IcosahedronGeometry(r, 0), hex, x, y, z, x * 3 % 6, 1, sy, 1);

  // 용 언덕(동쪽)
  const DH = { x: 43, z: 10, top: 2.7 };
  box(3, 0.9, 4, 0x8a7a6a, 38, 0, 10); box(3, 1.8, 4, 0x7d6e60, 40.5, 0, 10); box(3.4, 2.7, 4.4, 0x6e6156, 43, 0, 10);
  rock(1.6, 0x7a6c5e, 45.5, 1.4, 12.5); rock(1.3, 0x8a7a6a, 45.8, 1.2, 7.6);
  bake(new THREE.TorusGeometry(0.95, 0.32, 6, 12), 0xc9a24a, DH.x, DH.top + 0.25, DH.z, 0, 1, 1, 1, Math.PI / 2);
  // 반딧불 덤불
  const BUSH = [[34, 22], [-4, 28], [-34, 2], [12, -11]];
  for (const [x, z] of BUSH) { rock(1.1, 0x2f6b3a, x, 0.8, z, 0.8); rock(0.8, 0x3f8f56, x + 0.6, 1.1, z - 0.4, 0.8); CIR.push({ x, z, r: 1.0, y0: 0, y1: 1.5 }); }
  // 날씨 수정구 · 모래시계 · 말하는 석상
  cyl(0.6, 0.8, 1.1, 0x9b8fb8, -10, 0, 1, 8);
  cyl(0.6, 0.8, 1.1, 0x9b8fb8, 10, 0, 1, 8);
  box(1.2, 1.4, 0.9, 0x8f86a8, -6, 0, 15.5); rock(0.55, 0x9a92b5, -6, 1.75, 15.5);
  // 간헐천 · 구름 받침
  const GEY = { x: 15.5, z: -6 };
  cyl(1.1, 1.4, 0.35, 0x6e6488, GEY.x, 0, GEY.z, 10, false);
  const CLOUD = { x: 15.5, z: -6, top: 13.4 };
  for (const [dx, dz, r] of [[0, 0, 2.2], [1.6, 0.8, 1.6], [-1.5, -0.6, 1.7], [0.4, -1.6, 1.5], [-0.6, 1.7, 1.4]]) bake(new THREE.IcosahedronGeometry(r, 1), 0xf4f1ff, CLOUD.x + dx, CLOUD.top - 0.6, CLOUD.z + dz, 0, 1, 0.45, 1);
  SOL.push({ x0: CLOUD.x - 2.4, x1: CLOUD.x + 2.4, z0: CLOUD.z - 2.4, z1: CLOUD.z + 2.4, y0: CLOUD.top - 0.6, y1: CLOUD.top });
  box(0.25, 1.1, 0.25, 0x3a3346, CLOUD.x + 1.2, CLOUD.top, CLOUD.z - 1.0, false);
  // 통통 버섯
  const BOUNCY = [[20, 24], [24, 21], [27.5, 25.5]].map(([x, z], i) => {
    const top = 0.9 + i * 0.3; bake(new THREE.CylinderGeometry(0.3, 0.4, top - 0.2, 7), 0xf3e6cf, x, (top - 0.2) / 2, z);
    bake(new THREE.SphereGeometry(1.25, 10, 5, 0, TAU, 0, Math.PI / 2), 0x4aa0ff, x, top - 0.3, z, 0, 1, 0.5, 1);
    for (let k = 0; k < 5; k++) { const a = k * 1.3; bake(new THREE.IcosahedronGeometry(0.14, 0), 0xffffff, x + Math.sin(a) * 0.7, top + 0.05, z + Math.cos(a) * 0.7); }
    const s = { x0: x - 1, x1: x + 1, z0: z - 1, z1: z + 1, y0: 0, y1: top, bounce: 11.5 }; SOL.push(s); return s;
  });
  // 서쪽 동굴 · 바위
  const CAVE = { x: -54, z: -22 };
  box(10, 6, 2, 0x6e6156, CAVE.x, 0, CAVE.z - 4); box(2, 6, 8, 0x6e6156, CAVE.x - 4, 0, CAVE.z); box(10, 1, 10, 0x5d5249, CAVE.x, 5, CAVE.z, false);
  box(2, 6, 3, 0x6e6156, CAVE.x + 4, 0, CAVE.z + 2.5); box(2, 6, 2.6, 0x6e6156, CAVE.x + 4, 0, CAVE.z - 2.4);
  box(8, 6, 1, 0x6e6156, CAVE.x, 0, CAVE.z + 4.5);
  for (const [dx, dz, hex] of [[-2, -2, 0x7fe6ff], [-1, 1.5, 0xd6a8ff], [0.8, -0.5, 0x8de08a], [-2.6, 0.4, 0xff9bd2]]) bake(new THREE.OctahedronGeometry(0.6, 0), hex, CAVE.x + dx, 0.9, CAVE.z + dz, dx, 1, 2, 1);
  // 쥐구멍(지팡이 가게 남쪽 벽)
  box(0.5, 0.45, 0.06, 0x120c22, -21, 0, 1.97, false);
  // 비밀방(생쥐 눈높이 거인 방)
  const ROOM = { x: 50, z: 50 };
  box(10, 5, 0.4, 0x8a5a3c, ROOM.x, 0, ROOM.z - 5); box(10, 5, 0.4, 0x8a5a3c, ROOM.x, 0, ROOM.z + 5); box(0.4, 5, 10, 0x8a5a3c, ROOM.x - 5, 0, ROOM.z); box(0.4, 5, 10, 0x8a5a3c, ROOM.x + 5, 0, ROOM.z);
  box(10, 0.3, 10, 0x5a3a22, ROOM.x, 5, ROOM.z, false);
  bake(new THREE.BoxGeometry(10, 0.04, 10), 0x7a2e5e, ROOM.x, 0.02, ROOM.z);
  box(3, 1.2, 2, 0x2f6fd0, ROOM.x - 2.5, 0, ROOM.z - 3.4); box(3, 1, 2, 0xc0392b, ROOM.x - 2.5, 1.2, ROOM.z - 3.4); box(3, 0.9, 2, 0x3aa08a, ROOM.x - 2.4, 2.2, ROOM.z - 3.4);
  bake(new THREE.CylinderGeometry(1.4, 1.4, 1, 3), 0xffd43b, ROOM.x + 2.5, 0.5, ROOM.z + 2, 0.4);
  CIR.push({ x: ROOM.x + 2.5, z: ROOM.z + 2, r: 1.2, y0: 0, y1: 1 });
  box(0.4, 1.6, 0.4, 0xfff6e0, ROOM.x + 3, 0, ROOM.z - 3);
  box(1.4, 0.9, 1.4, 0x6b4128, ROOM.x, 0, ROOM.z);
  box(0.5, 0.45, 0.06, 0x120c22, ROOM.x, 0, ROOM.z + 4.77, false);
  // 하늘 섬
  const ISL = { x: -46, z: 22, y: 14, r: 7 };
  cyl(ISL.r, ISL.r - 0.6, 1.2, 0x6aa84f, ISL.x, ISL.y - 1.2, ISL.z, 14);
  bake(new THREE.ConeGeometry(ISL.r - 0.4, 7, 9), 0x7d6a5c, ISL.x, ISL.y - 4.7, ISL.z, 0, 1, 1, 1, Math.PI);
  box(0.5, 3.4, 0.5, 0x9b8fb8, ISL.x - 3.2, ISL.y, ISL.z - 3.2); box(0.5, 3.4, 0.5, 0x9b8fb8, ISL.x + 3.2, ISL.y, ISL.z - 3.2); box(6.9, 0.5, 0.5, 0x9b8fb8, ISL.x, ISL.y + 3.4, ISL.z - 3.2, false);
  box(4, 2.2, 0.15, 0xf3e3c3, ISL.x, ISL.y, ISL.z + 5.8, false);
  box(1.4, 0.9, 1, 0x8a5a3c, ISL.x, ISL.y, ISL.z + 2.6);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; rock(0.6, 0x6aa84f, ISL.x + Math.sin(a) * 5.6, ISL.y + 0.3, ISL.z + Math.cos(a) * 5.6, 0.7); }

  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(SN, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(SC, 3));
  const STATIC = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); scene.add(STATIC);
  K.extraStatic.push(STATIC);
  const plate = (t, x, y, z, w) => { const s = label(t, w); s.position.set(x, y, z); scene.add(s); return s; };
  plate('🐉 용의 언덕', 40.5, 4.6, 10, 3.6); plate('🌦️ 날씨 수정구', -10, 2.9, 1, 3.4); plate('⏳ 낮과 밤 모래시계', 10, 2.9, 1, 4); plate('🗿 말하는 석상 뭉치', -6, 3.1, 15.5, 4);
  plate('♨️ 간헐천', GEY.x, 1.8, GEY.z, 2.6); plate('🕳️ 바위 동굴', CAVE.x + 5, 6.6, CAVE.z, 3.4); plate('🏝️ 하늘 섬', ISL.x, ISL.y + 4.6, ISL.z, 3.4);

  // ───────── 용 ─────────
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 9), lam(0xe8d8ff)); egg.scale.set(0.85, 1.15, 0.85); egg.position.set(DH.x, DH.top + 0.9, DH.z); scene.add(egg);
  for (let k = 0; k < 7; k++) { const sp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), lam(0x9b6bff)); const a = k * 1.9, h = (k % 3 - 1) * 0.35; sp.position.set(Math.sin(a) * 0.62, h, Math.cos(a) * 0.62); egg.add(sp); }
  let warmth = 0;
  target(egg, (sp) => {
    if (DR.stage > 0) return null;
    if (sp === 0) { warmth++; burst(DH.x, DH.top + 1, DH.z, 0xff9a3c, 20, 2); egg.rotation.z = 0.2;
      if (warmth < 3) return '🥚 알이 따뜻해졌어요… 톡, 톡! (' + warmth + '/3)';
      hatch(); return '🥚 쩌억— 알이 깨졌어요!'; }
    if (sp === 3) return '🥶 알이 오들오들 떨어요. 따뜻하게 해 줘야 할 것 같아요.';
    if (sp === 2) return '✨ 알 속에서 작은 그림자가 꼼지락거려요.';
  });
  function dragonMesh() {
    const g = new THREE.Group(), body = lam(0x5bb37a), belly = lam(0xf7e3a1), wing = lam(0x8f6bd8, { side: THREE.DoubleSide });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 7), body); b.scale.set(0.9, 0.8, 1.3); b.position.y = 0.6; g.add(b);
    const bb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), belly); bb.scale.set(0.8, 0.7, 1.1); bb.position.set(0, 0.48, 0.12); g.add(bb);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.6, 7), body); n.position.set(0, 1.0, 0.55); n.rotation.x = 0.7; g.add(n);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 9, 7), body); h.scale.set(1, 0.85, 1.25); h.position.set(0, 1.3, 0.85); g.add(h);
    for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0x1d1530 })); e.position.set(sd * 0.15, 1.4, 1.08); g.add(e);
      const hr = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 5), lam(0xffd66b)); hr.position.set(sd * 0.12, 1.6, 0.75); hr.rotation.x = -0.5; g.add(hr); }
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 7), body); t.position.set(0, 0.5, -0.95); t.rotation.x = -Math.PI / 2 - 0.25; g.add(t);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 1.4, 0.1, -0.2, 0, 0, -0.4, 1.4, 0.1, -0.2, 1.1, 0.05, 0.4, 0, 0, 0.3], 3)); wg.computeVertexNormals();
    const wl = new THREE.Mesh(wg, wing), wr = new THREE.Mesh(wg, wing); wl.position.set(0.25, 0.85, 0); wr.position.set(-0.25, 0.85, 0); wr.scale.x = -1; g.add(wl, wr);
    g.userData.w = [wl, wr]; return g;
  }
  const DR = { stage: 0, g: null, fed: 0, x: DH.x, y: DH.top, z: DH.z, h: 0, s: 0.6, flap: 0 };
  function hatch() {
    DR.stage = 1; egg.visible = false; DR.g = dragonMesh(); DR.g.scale.setScalar(0.01); scene.add(DR.g); burst(DH.x, DH.top + 1, DH.z, 0xd6a8ff, 60, 3);
    tween(1.2, (k) => DR.g.scale.setScalar(Math.max(0.01, DR.s * k)));
    discover('egg'); later(1.5, () => dlg([['🐉 아기 용', '뺘아! (아기 용이 당신을 엄마처럼 졸졸 따라와요)'], ['📖', '아기 용은 반딧불 열매를 좋아한대요. 세 개를 먹이면 쑥쑥 자랄지도?']]));
    target(DR.g, (sp) => { if (sp === 0) { burst(DR.x, DR.y + 1.4, DR.z + 0.8, 0xff7a2c, 30, 3); return '🐉 용이 불꽃을 꿀꺽 삼키고 작은 불을 뿜었어요! 화르륵'; }
      if (sp === 1) return '🐉 용이 물을 털며 재채기해요. 에취!'; if (sp === 4) { DR.hop = 1.5; return '🐉 용이 둥실 떠오르며 신나게 빙글빙글 돌아요!'; } if (sp === 2) return '🐉 용 비늘이 무지개빛으로 반짝여요.'; });
  }
  let berries = 0;
  const berryG = BUSH.map(([x, z]) => { const s = glow(0xfff36b, 0.9); s.position.set(x, 1.6, z); scene.add(s); return { x, z, s, t: 0 }; });
  for (const B of berryG) ACTS.push({ x: B.x, z: B.z, y: 0, r: 2.2, get label() { return B.t > 0 ? '덤불 (열매가 다시 열리는 중)' : '🍇 반딧불 열매 따기'; }, fn: () => { if (B.t > 0) return toast('열매가 다시 열리길 기다려요 (' + Math.ceil(B.t) + '초)', 2); B.t = 25; B.s.visible = false; berries++; burst(B.x, 1.4, B.z, 0xfff36b, 16, 1.5); toast('🍇 반딧불 열매를 땄어요! (가진 열매 ' + berries + '개)', 2.5); } });
  ACTS.push({ low: true, dyn: () => DR.stage === 1 && berries > 0 ? [DR.x, DR.z, DR.y] : null, r: 2.4, label: '🍇 아기 용에게 열매 주기', fn: () => {
    berries--; DR.fed++; burst(DR.x, DR.y + 1.2, DR.z, 0xfff36b, 24, 2); toast('🐉 냠냠! (' + DR.fed + '/3)', 2);
    if (DR.fed >= 3) { DR.stage = 2; const s0 = DR.s; tween(2, (k) => { DR.s = s0 + (2.4 - s0) * k; }, () => { discover('feed'); dlg([['🐉 용', '크아앙! (용이 등을 낮추며 타라는 듯 고개를 끄덕여요)'], ['📖', '다 큰 용에게 다가가 E로 올라타요. 날 때: 방향키·마우스로 방향, 점프(Space)로 위로, 가만두면 천천히 내려가요. 내릴 땐 E!']]); }); }
  } });
  ACTS.push({ dyn: () => DR.stage === 2 && !MODS.flying ? [DR.x, DR.z, DR.y] : null, r: 3.2, label: '🐉 용 등에 올라타기', fn: () => { MODS.flying = true; MODS.flyT = 0; P.y = Math.max(P.y, DR.y) + 1.6; P.vy = 0; discover('fly'); toast('🐉 날아올라요! Space = 위로 · E = 내리기', 4); } });

  // ───────── 구름 고래 ─────────
  const WH = { a: 1.2, cx: -12, cz: -2, R: 36, y: 16.4, c: { x: 0, z: 0, r: 2.7, y0: 15, y1: 17 }, g: new THREE.Group() };
  CIR.push(WH.c); K.movers.push(WH.c);
  { const m = lam(0xf4f6ff), m2 = lam(0xc9d6f7), G = WH.g;
    const b = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10), m); b.scale.set(1, 0.72, 2.1); G.add(b);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(3.0, 12, 8), m2); bl.scale.set(0.95, 0.5, 1.9); bl.position.y = -0.6; G.add(bl);
    const tl = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 8), m); tl.position.set(0, 0.2, -7.6); tl.rotation.x = -Math.PI / 2; G.add(tl);
    for (const sd of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), m); f.scale.set(1.6, 0.25, 0.8); f.position.set(sd * 3.2, -0.8, 1.4); f.rotation.z = sd * 0.4; G.add(f);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), m); fl.scale.set(1.5, 0.2, 0.7); fl.position.set(sd * 1.3, 0.4, -8.6); G.add(fl);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1d1530 })); e.position.set(sd * 2.55, 0.5, 4.2); G.add(e); }
    for (let k = 0; k < 9; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + (k % 3) * 0.3, 1), m); p.position.set(Math.sin(k) * 1.4, 2.0, -3 + k * 0.8); p.scale.y = 0.45; G.add(p); }
    scene.add(G); target(G, (sp) => { if (sp === 1) return '🐋 구름 고래가 물을 받아 마시고 부우— 물줄기를 뿜었어요!'; if (sp === 2) return '🐋 고래가 빛을 받아 반짝반짝 웃어요.'; return '🐋 구름 고래가 느긋하게 하품해요. 후아암~'; }); }

  // ───────── 날씨 · 낮밤 ─────────
  const W = { kind: 'sun', t: 0, rained: 0, night: false, bloom: 0, snow: 0 };
  const FL = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color: 0xffffff }), 140);
  const FLP = [], FLC = [0xff6b9a, 0xffd43b, 0xffffff, 0xda77f2, 0xff9f43, 0x4dabf7];
  for (let i = 0; i < 140; i++) { let x, z; do { const a = Math.random() * TAU, r = 6 + Math.random() * 46; x = Math.sin(a) * r; z = 4 + Math.cos(a) * r; } while (Math.hypot(x - 24, z + 20) < 10 || (x > -37 && x < -15 && z > -39 && z < -17) || Math.hypot(x, z + 40) < 6);
    FLP.push([x, z, Math.random()]); FL.setColorAt(i, new THREE.Color(FLC[i % FLC.length])); }
  FL.instanceColor.needsUpdate = true; scene.add(FL);
  const snowCap = new THREE.Mesh(new THREE.CircleGeometry(95, 40), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  snowCap.rotation.x = -Math.PI / 2; snowCap.position.y = 0.015; snowCap.renderOrder = 1; scene.add(snowCap);
  const RAIN = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.6 }), 300);
  const RP = new Float32Array(300 * 3); for (let i = 0; i < 300; i++) { RP[i * 3] = (Math.random() - 0.5) * 40; RP[i * 3 + 1] = Math.random() * 20; RP[i * 3 + 2] = (Math.random() - 0.5) * 40; }
  RAIN.visible = false; RAIN.frustumCulled = false; scene.add(RAIN);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0x9fe6ff })); crystal.position.set(-10, 1.8, 1); scene.add(crystal);
  const hg = new THREE.Group(); hg.position.set(10, 1.1, 1); scene.add(hg);
  { const gl = lam(0xdff6ff, { transparent: true, opacity: 0.55 }); const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 8), gl); c1.position.y = 0.35; c1.rotation.x = Math.PI; hg.add(c1);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 8), gl); c2.position.y = 0.95; hg.add(c2);
    const sand = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 8), lam(0xffd66b)); sand.position.y = 0.2; sand.rotation.x = Math.PI; hg.add(sand);
    for (const y of [0.02, 1.28]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 8), lam(0x6b4128)); d.position.y = y; hg.add(d); } }
  ACTS.push({ x: -10, z: 1, y: 0, r: 2.4, label: '🌦️ 날씨 수정구 만지기', fn: () => K.choose('🌦️ 어떤 날씨를 부를까요?', ['☀️ 맑음', '🌧️ 비', '❄️ 눈'], (i) => setWeather(['sun', 'rain', 'snow'][i])) });
  ACTS.push({ x: 10, z: 1, y: 0, r: 2.4, label: '⏳ 모래시계 뒤집기', fn: () => setNight(!W.night) });
  function setWeather(k) {
    const was = W.kind; W.kind = k; W.t = 0; RAIN.visible = k !== 'sun';
    RAIN.material.color.setHex(k === 'snow' ? 0xffffff : 0xbfe6ff); RAIN.geometry.dispose(); RAIN.geometry = k === 'snow' ? new THREE.IcosahedronGeometry(0.08, 0) : new THREE.BoxGeometry(0.03, 0.6, 0.03);
    burst(-10, 2.2, 1, k === 'rain' ? 0x7fd8ff : k === 'snow' ? 0xffffff : 0xffd66b, 40, 3);
    if (k === 'rain') { W.rained = 1; toast('🌧️ 촉촉한 비가 내려요. 꽃들이 고개를 들어요!', 3.5); }
    if (k === 'snow') { toast('❄️ 하얀 눈이 펑펑! 연못도 얼기 시작해요.', 3.5); later(6, () => { if (W.kind === 'snow') { discover('snow'); K.freezePond(60); } }); }
    if (k === 'sun') { if (was === 'rain' && W.rained) { rainbowOn(); } else toast('☀️ 맑게 개었어요.', 2.5); }
  }
  const SKYC = { day: 0x5a4790, night: 0x0f1236 };
  function setNight(on) {
    W.night = on; const c = on ? SKYC.night : SKYC.day; scene.background.setHex(c); scene.fog.color.setHex(c);
    K.hemi.intensity = on ? 0.55 : 1.35; K.sun.intensity = on ? 0.15 : 1.0; K.stars.material.size = on ? 2.2 : 1.4;
    for (const s of STARS) s.s.visible = on; burst(10, 2.4, 1, on ? 0x7f8bff : 0xffd66b, 40, 3); hg.rotation.z = on ? Math.PI : 0;
    toast(on ? '🌙 밤이 되었어요. 별이 반짝이고 반딧불이가 날아요.' : '☀️ 아침이 밝았어요!', 3);
  }
  // 무지개 다리
  const RB = { on: 0, steps: [], g: new THREE.Group() };
  { const from = [-14, 14], to = [-39.4, 19.6], n = 36, rise = 14 / n, RC = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7, 0x748ffc, 0xda77f2];
    const dx = (to[0] - from[0]) / n, dz = (to[1] - from[1]) / n, yaw = Math.atan2(dx, dz), len = Math.hypot(dx, dz);
    const geo = new THREE.BoxGeometry(0.36, 0.12, len + 0.05);
    for (let i = 0; i < n; i++) { const x = from[0] + dx * (i + 0.5), z = from[1] + dz * (i + 0.5), y = rise * (i + 1);
      for (let c = 0; c < 7; c++) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: RC[c], transparent: true, opacity: 0.85 })); const off = (c - 3) * 0.36; m.position.set(x + Math.cos(yaw) * off, y - 0.06, z - Math.sin(yaw) * off); m.rotation.y = yaw; RB.g.add(m); }
      const s = { x0: x - 1.3, x1: x + 1.3, z0: z - 1.3, z1: z + 1.3, y0: y - 0.3, y1: -1, top: y }; SOL.push(s); RB.steps.push(s); }
    RB.g.visible = false; scene.add(RB.g); }
  function rainbowOn() {
    RB.on = 75; RB.g.visible = true; for (const s of RB.steps) s.y1 = s.top; toast('🌈 비 갠 하늘에 무지개 다리가 생겼어요! 하늘 섬까지 이어져요 (75초)', 4.5);
  }
  // 별자리
  const STARS = [[-8, 46, -60], [2, 52, -62], [12, 48, -60], [20, 40, -58], [6, 40, -60]].map(([x, y, z]) => { const s = glow(0xfff6c0, 3.2); s.position.set(x, y, z); s.visible = false; scene.add(s);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(2.2, 6, 4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.copy(s.position); scene.add(hit); return { s, hit, lit: false }; });
  const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfff3a0, fog: false })); scene.add(lines);
  STARS.forEach((S) => target(S.hit, (sp) => { if (!W.night) return null; if (sp !== 2 || S.lit) return sp === 2 ? null : '별은 ✨ 빛 마법에만 대답해요.'; S.lit = true; S.s.material.color.setHex(0x9fe6ff); S.s.scale.setScalar(4.4);
    const L = STARS.filter((x) => x.lit), pts = []; for (let i = 1; i < L.length; i++) pts.push(...L[i - 1].s.position.toArray(), ...L[i].s.position.toArray()); lines.geometry.dispose(); lines.geometry = new THREE.BufferGeometry(); lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    if (L.length === 5) { discover('stars'); return '🌌 별 다섯 개가 이어져 하늘에 용자리가 떠올랐어요!'; } return '✨ 별 하나가 깨어났어요 (' + L.length + '/5)'; }));
  ACTS.push({ x: CLOUD.x + 1.2, z: CLOUD.z - 1.0, y: CLOUD.top, r: 1.8, label: '🔭 망원경 보기', fn: () => dlg([['🔭 망원경', W.night ? '북쪽 하늘에 유난히 큰 별 다섯 개가 보여요. ✨ 빛 마법으로 하나씩 깨워 볼까요?' : '낮이라 별이 안 보여요. 광장의 모래시계로 밤을 불러 봐요.']]) });

  // ───────── 간헐천 ─────────
  const GZ = { water: false, on: 0 };
  const gHit = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); gHit.position.set(GEY.x, 0.3, GEY.z); scene.add(gHit);
  const gPool = new THREE.Mesh(new THREE.CircleGeometry(0.95, 14), new THREE.MeshBasicMaterial({ color: 0x3a2f55 })); gPool.rotation.x = -Math.PI / 2; gPool.position.set(GEY.x, 0.37, GEY.z); scene.add(gPool);
  target(gHit, (sp) => {
    if (sp === 1) { GZ.water = true; gPool.material.color.setHex(0x4fc3ff); return '💧 간헐천에 물이 가득 찼어요. 보글보글…'; }
    if (sp === 0) { if (!GZ.water) return '쉬익… 물이 없어서 김이 안 나요.'; GZ.on = 14; GZ.water = false; gPool.material.color.setHex(0x3a2f55); return '♨️ 펑! 증기 기둥이 하늘로 솟구쳐요! 올라타 봐요!'; }
    if (sp === 3) { GZ.water = false; gPool.material.color.setHex(0xdff6ff); return '❄️ 간헐천이 꽁꽁 얼었어요.'; }
  });

  // ───────── 도망친 책 ─────────
  const BOOKS = []; let booksBack = 0, booksHeld = 0;
  const BC = [0xc0392b, 0x2f6fd0, 0x3aa08a, 0xffa94d, 0x7a4cff, 0xff6b9a];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(), m = lam(BC[i], { side: THREE.DoubleSide });
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), m), r = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.65), m); l.position.x = -0.25; r.position.x = 0.25; const lp = new THREE.Group(), rp = new THREE.Group(); lp.add(l); rp.add(r); g.add(lp, rp);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.66), lam(0xf3e3c3)); sp.rotation.x = Math.PI / 2; g.add(sp);
    g.rotation.x = -Math.PI / 2 + 0.4; scene.add(g);
    const B = { g, lp, rp, a: i * 1.05, cx: -6 + (i % 3) * 5, cz: -14 + Math.floor(i / 3) * 6, x: 0, y: 3, z: 0, got: false, ph: i };
    BOOKS.push(B);
    ACTS.push({ dyn: () => B.got ? null : [B.x, B.z, Math.max(0, B.y - 1.6)], r: 1.8, label: '📚 날아다니는 책 붙잡기', fn: () => { B.got = true; g.visible = false; booksHeld++; burst(B.x, B.y, B.z, BC[i], 16, 1.5); toast('📚 책을 붙잡았어요! (' + booksHeld + '권 들고 있어요 — 지팡이 가게 앞 책 수레로)', 3); } });
  }
  const cart = new THREE.Group(); cart.position.set(-17.5, 0, 11); scene.add(cart);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.8), lam(0x8a5a3c)); b.position.y = 0.7; cart.add(b); for (const [x, z] of [[-0.55, 0.35], [0.55, 0.35], [-0.55, -0.35], [0.55, -0.35]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), lam(0x3a2416)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.18, z); cart.add(w); } }
  ACTS.push({ x: -17.5, z: 11, y: 0, r: 2.2, get label() { return booksHeld ? '📚 책 수레에 책 꽂기' : '📚 책 수레 (도망친 책 ' + booksBack + '/6)'; }, fn: () => {
    if (!booksHeld) return toast('책 수레가 비었어요. 광장 북쪽에서 날아다니는 책을 붙잡아 와요!', 3);
    booksBack += booksHeld; booksHeld = 0; burst(-17.5, 1.4, 11, 0xffd66b, 24, 2);
    if (booksBack >= 6) { discover('books'); dlg([['📚 책 수레', '책들이 모두 돌아왔어요! 맨 아래 책에서 쪽지가 떨어졌어요.'], ['📝 쪽지', '🐭 생쥐 물약 = 🧀 치즈 + 🍄 버섯 + 🌙 달맞이꽃. 작아지면 보이는 문이 있어요.']]); }
    else toast('📚 ' + booksBack + '/6권 돌아왔어요!', 2.5);
  } });

  // ───────── 쥐구멍 · 비밀방 ─────────
  ACTS.push({ x: -21, z: 1.4, y: 0, r: 1.3, label: '🕳️ 쥐구멍 들여다보기', fn: () => {
    if (MODS.form !== 'mouse') return toast('작은 구멍이에요. 생쥐만큼 작아지면 들어갈 수 있을 것 같아요…', 3);
    K.fade(() => { K.tp(ROOM.x, ROOM.z + 3.6, 0); K.face(0); toast('🐭 쥐구멍 너머 비밀방! 모든 게 거인처럼 커 보여요.', 3.5); });
  } });
  ACTS.push({ x: ROOM.x, z: ROOM.z + 4.2, y: 0, r: 1.3, label: '🕳️ 쥐구멍으로 나가기', fn: () => K.fade(() => { K.tp(-21, 0.6, 0); K.face(180); }) });
  ACTS.push({ x: ROOM.x, z: ROOM.z, y: 0, r: 2.2, label: '🎼 탁자 위 악보 보기', fn: () => { discover('mouse'); dlg([['🎼 오래된 악보', '「하늘 섬의 노래」\n🔴 빨강 → 🟡 노랑 → 🔵 파랑 → 🟡 노랑 → 🔴 빨강'], ['📖', '하늘 섬의 종 다섯 개에 아무 마법이나 쏘면 소리가 나요. 이 순서대로!']]); } });

  // ───────── 하늘 섬 종 ─────────
  const BELLC = [0xff5c5c, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7], BELLN = ['빨강', '주황', '노랑', '초록', '파랑'], SONG = [0, 2, 4, 2, 0], FREQ = [523, 587, 659, 784, 880];
  let played = [], chestOpen = false;
  const BELLS = BELLC.map((c, i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.42, 0.7, 10, 1, true), lam(c, { side: THREE.DoubleSide })); b.position.set(ISL.x - 2.4 + i * 1.2, ISL.y + 2.75, ISL.z - 3.2); scene.add(b);
    target(b, () => { tone(FREQ[i]); b.rotation.z = 0.5; tween(0.8, (k) => { b.rotation.z = 0.5 * Math.cos(k * 12) * (1 - k); });
      played.push(i); if (played.length > 5) played.shift();
      if (!chestOpen && played.length === 5 && played.every((v, j) => v === SONG[j])) { chestOpen = true; later(0.6, openChest); return '🔔 ' + BELLN[i] + ' — 노래가 완성됐어요!'; }
      return '🔔 딩— ' + BELLN[i] + ' 종'; }); return b; });
  let actx = null;
  function tone(f) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.25, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.4); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 1.5); } catch (e) { /* */ } }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.3, 1.05), lam(0xa86b3c)); lid.position.set(ISL.x, ISL.y + 1.05, ISL.z + 2.6); scene.add(lid);
  const mural = label('🎼 종의 노래는 숨은 방에', 3.8, 'rgba(255,248,236,.0)', '#5a3a12'); mural.position.set(ISL.x, ISL.y + 1.2, ISL.z + 5.7); scene.add(mural);
  function openChest() {
    tween(1, (k) => { lid.rotation.x = -k * 1.4; lid.position.z = ISL.z + 2.6 - k * 0.4; lid.position.y = ISL.y + 1.05 + k * 0.3; });
    burst(ISL.x, ISL.y + 1.6, ISL.z + 2.6, 0xffd66b, 80, 4, -2); discover('bells');
    later(1.2, () => { K.rainbowWand(); dlg([['🎁 하늘 섬 보물상자', '별가루 지팡이를 찾았어요! 이제 마법 빛줄기가 무지개색으로 빛나요.'], ['📖', '하늘 섬의 노래는 오래전 구름 고래가 들려준 노래래요.']]); });
  }

  // ───────── 동굴 바위(함께 들기) ─────────
  const ROCK = { x: CAVE.x + 4.6, z: CAVE.z - 0.1, up: 0, tries: 0, lastMine: -9, lastOther: -9 };
  const boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), lam(0x6e6156)); boulder.position.set(ROCK.x, 1.6, ROCK.z); scene.add(boulder);
  const bSol = { x0: ROCK.x - 1.3, x1: ROCK.x + 1.3, z0: ROCK.z - 1.3, z1: ROCK.z + 1.3, y0: 0, y1: 3.2 }; SOL.push(bSol);
  function lift() { ROCK.up = 40; burst(ROCK.x, 2, ROCK.z, 0xd6a8ff, 60, 3); discover('boulder'); toast('🤝 영차! 바위가 둥실 떠올랐어요. 동굴 안 수정이 빛나요! (40초)', 4); }
  target(boulder, (sp) => {
    if (ROCK.up > 0 || sp !== 4) return sp === 0 ? '바위가 조금 뜨거워졌어요.' : null;
    const now = performance.now() / 1000; ROCK.lastMine = now; ROCK.tries++;
    if (now - ROCK.lastOther < 3) { lift(); return null; }
    if (K.alone() && ROCK.tries >= 3) { later(1, () => { toast('🗿 동굴 정령: "혼자서도 끈기 있게 애썼구나. 이번만 도와주마!"', 4); lift(); }); return '혼자서 세 번이나…!'; }
    boulder.position.y = 1.9; later(0.4, () => { if (ROCK.up <= 0) boulder.position.y = 1.6; });
    return '🪶 끄응… 너무 무거워요! 친구와 3초 안에 같이 🪶을 쓰면 들릴 것 같아요.';
  });
  K.onRemoteFx = (f) => { if (f.s === 4 && Array.isArray(f.b) && Math.hypot(f.b[0] - ROCK.x, f.b[2] - ROCK.z) < 3.5) { const now = performance.now() / 1000; ROCK.lastOther = now; if (now - ROCK.lastMine < 3 && ROCK.up <= 0) lift(); } };

  // ───────── 말하는 석상 ─────────
  ACTS.push({ x: -6, z: 15.5, y: 0, r: 2.4, label: '🗿 말하는 석상 뭉치에게 묻기', fn: () => {
    const left = DISC.filter((d) => !has(d.k));
    if (!left.length) return dlg([['🗿 뭉치', '허허, 이 마을의 신기한 것을 모두 찾았구나! 너는 진짜 마법사다!']]);
    const d = left[Math.floor(Math.random() * Math.min(3, left.length))];
    dlg([['🗿 뭉치', '흠… 아직 못 찾은 신기한 것이 ' + left.length + '가지 남았구나.'], ['🗿 뭉치', d.t + ' — ' + d.h]]);
  } });

  // ───────── 매 프레임 ─────────
  let T = 0; const _mm = new THREE.Matrix4(), _p = new THREE.Vector3(), _qq = new THREE.Quaternion(), _sc = new THREE.Vector3();
  function tick(dt) {
    T += dt;
    egg.rotation.z = egg.rotation.z * 0.92 + (DR.stage === 0 && warmth ? Math.sin(T * 20) * 0.06 * warmth : 0);
    for (const B of berryG) { if (B.t > 0 && (B.t -= dt) <= 0) B.s.visible = true; B.s.material.opacity = 0.6 + Math.sin(T * 3 + B.x) * 0.3; }
    // 용
    if (DR.g) {
      if (MODS.flying) { DR.x = P.x; DR.y = P.y - 1.6; DR.z = P.z; DR.h = P.yaw; }
      else if (DR.stage === 1 || DR.stage === 2) {
        const big = DR.stage === 2, tx = big ? P.x + Math.sin(P.yaw + 2.2) * 3.2 : P.x - Math.sin(P.yaw) * 1.4 + Math.cos(P.yaw) * 0.8, tz = big ? P.z + Math.cos(P.yaw + 2.2) * 3.2 : P.z - Math.cos(P.yaw) * 1.4 - Math.sin(P.yaw) * 0.8;
        const d = Math.hypot(tx - DR.x, tz - DR.z); if (d > 30) { DR.x = tx; DR.z = tz; }
        if (d > 0.4) { const k = Math.min(1, dt * 2.5); DR.x += (tx - DR.x) * k; DR.z += (tz - DR.z) * k; DR.h = Math.atan2(tx - DR.x, tz - DR.z) || DR.h; }
        const gy = K.groundAt(DR.x, DR.z, P.y + 2)[0]; DR.y += ((big ? gy : Math.max(gy, P.y) + 0.9 + Math.sin(T * 3) * 0.2) - DR.y) * Math.min(1, dt * 4);
        if (DR.hop > 0) { DR.hop -= dt; DR.y += Math.sin(DR.hop * 6) * 0.5 + 1; }
      }
      DR.g.position.set(DR.x, DR.y, DR.z); DR.g.rotation.y = DR.h; DR.g.scale.setScalar(Math.max(0.01, DR.s));
      const fl = Math.sin(T * (MODS.flying ? 7 : DR.stage === 1 ? 12 : 3)) * (MODS.flying || DR.stage === 1 ? 0.7 : 0.15); DR.g.userData.w[0].rotation.z = fl; DR.g.userData.w[1].rotation.z = -fl;
      if (MODS.flying && Math.random() < 0.3) emit(DR.x, DR.y + 0.5, DR.z, (Math.random() - 0.5), -0.5, (Math.random() - 0.5), 0xd6a8ff, 0.8, 0);
    }
    // 고래
    const ox = WH.c.x, oz = WH.c.z; WH.a += dt * 0.05;
    const wx = WH.cx + Math.sin(WH.a) * WH.R, wz = WH.cz + Math.cos(WH.a) * WH.R, wy = WH.y + Math.sin(T * 0.6) * 0.4;
    WH.g.position.set(wx, wy, wz); WH.g.rotation.y = WH.a + Math.PI / 2; WH.g.rotation.z = Math.sin(T * 0.5) * 0.04;
    WH.c.x = wx; WH.c.z = wz; WH.c.y1 = wy + 2.2; WH.c.y0 = wy - 2; WH.c.dx = wx - ox; WH.c.dz = wz - oz;
    if (P.src === WH.c && P.ground) discover('whale');
    if (Math.random() < dt * 0.4) for (let k = 0; k < 14; k++) emit(wx + Math.sin(WH.a + Math.PI / 2) * 3.5, wy + 2.3, wz + Math.cos(WH.a + Math.PI / 2) * 3.5, (Math.random() - 0.5) * 1.2, 4 + Math.random() * 2, (Math.random() - 0.5) * 1.2, 0xbff0ff, 1.2, -5);
    // 날씨
    W.t += dt; crystal.rotation.y += dt; crystal.position.y = 1.8 + Math.sin(T * 2) * 0.1; crystal.material.color.setHex(W.kind === 'rain' ? 0x4fc3ff : W.kind === 'snow' ? 0xffffff : 0xffd66b);
    if (W.kind === 'rain') { W.bloom = Math.min(1, W.bloom + dt / 8); if (W.bloom >= 1 && !has('rain')) { discover('rain'); toast('🌸 마을 곳곳에 꽃이 활짝 피었어요!', 3.5); } }
    W.snow += ((W.kind === 'snow' ? 0.85 : 0) - W.snow) * Math.min(1, dt / 4); snowCap.material.opacity = W.snow; snowCap.visible = W.snow > 0.01;
    if (W.bloom > 0) { for (let i = 0; i < 140; i++) { const [x, z, r] = FLP[i], s = Math.max(0.001, Math.min(1, W.bloom * 1.6 - r * 0.6)) * (1 - W.snow * 0.9); _mm.compose(_p.set(x, 0.22 * s + 0.02, z), _qq.identity(), _sc.set(s, s * 0.7, s)); FL.setMatrixAt(i, _mm); } FL.instanceMatrix.needsUpdate = true; FL.visible = true; } else FL.visible = false;
    if (RAIN.visible) { const cx = P.x, cz = P.z, sp = W.kind === 'snow' ? 2.2 : 16;
      for (let i = 0; i < 300; i++) { RP[i * 3 + 1] -= sp * dt; if (RP[i * 3 + 1] < 0) { RP[i * 3 + 1] = 18 + Math.random() * 4; RP[i * 3] = (Math.random() - 0.5) * 40; RP[i * 3 + 2] = (Math.random() - 0.5) * 40; }
        _mm.makeTranslation(cx + RP[i * 3] + (W.kind === 'snow' ? Math.sin(T + i) * 0.5 : 0), P.y + RP[i * 3 + 1] - 4, cz + RP[i * 3 + 2]); RAIN.setMatrixAt(i, _mm); } RAIN.instanceMatrix.needsUpdate = true; }
    if (RB.on > 0) { RB.on -= dt; if (P.y > 13 && Math.hypot(P.x - ISL.x, P.z - ISL.z) < ISL.r && P.src && RB.on > 0) discover('rainbow');
      if (RB.on <= 0) { RB.g.visible = false; for (const s of RB.steps) s.y1 = -1; toast('🌈 무지개가 사르르 사라졌어요.', 2.5); } }
    if (W.night) { if (Math.random() < 0.6) { const a = Math.random() * TAU, r = 4 + Math.random() * 25; emit(P.x + Math.sin(a) * r, 0.6 + Math.random() * 2.5, P.z + Math.cos(a) * r, (Math.random() - 0.5) * 0.4, 0.2, (Math.random() - 0.5) * 0.4, 0xd4ff6b, 2.5, 0); } for (const S of STARS) S.s.material.opacity = 0.75 + Math.sin(T * 3 + S.s.position.x) * 0.25; }
    // 간헐천
    if (GZ.on > 0) { GZ.on -= dt; for (let k = 0; k < 4; k++) emit(GEY.x + (Math.random() - 0.5) * 1.6, 0.4 + Math.random() * 1.5, GEY.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.6, 9 + Math.random() * 4, (Math.random() - 0.5) * 0.6, 0xffffff, 1.4, -1.5);
      if (Math.hypot(P.x - GEY.x, P.z - GEY.z) < 1.5 && P.y < CLOUD.top + 0.2) { MODS.lift = 7; if (P.y > 4) discover('steam'); } }
    // 통통 버섯
    for (const s of BOUNCY) if (P.src === s && P.ground) { MODS.bounce = s.bounce; burst(P.x, P.y, P.z, 0x4aa0ff, 10, 2); discover('bounce'); }
    // 책
    for (const B of BOOKS) { if (B.got) continue; B.a += dt * (0.5 + B.ph * 0.05);
      let tx = B.cx + Math.sin(B.a) * 3.5, tz = B.cz + Math.cos(B.a * 1.3) * 3, ty = 2.6 + Math.sin(B.a * 2 + B.ph) * 0.9;
      const dpx = B.x - P.x, dpz = B.z - P.z, dp = Math.hypot(dpx, dpz); if (dp < 4 && dp > 0.01 && !K.sneaking()) { tx += dpx / dp * 3; tz += dpz / dp * 3; ty += 1.2; }
      B.x += (tx - B.x) * Math.min(1, dt * 1.8); B.z += (tz - B.z) * Math.min(1, dt * 1.8); B.y += (ty - B.y) * Math.min(1, dt * 1.8);
      B.g.position.set(B.x, B.y, B.z); B.g.rotation.z = Math.atan2(tx - B.x, tz - B.z); const f = Math.sin(T * 9 + B.ph) * 0.7; B.lp.rotation.y = f; B.rp.rotation.y = -f; }
    // 동굴 바위
    if (ROCK.up > 0) { ROCK.up -= dt; boulder.position.y += ((ROCK.up > 0 ? 5.4 : 1.6) - boulder.position.y) * Math.min(1, dt * 2); bSol.y1 = ROCK.up > 0 ? -1 : 3.2; if (ROCK.up <= 0) toast('바위가 쿵— 다시 내려왔어요.', 2); }
  }
  return { tick, W, DR, ROCK, STARS, setNight, setWeather, berries: () => berries };
}
