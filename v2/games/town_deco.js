// 🏡 우리반RPG 꾸미기 장식 → 마을 아이 집 마당 3D 설계표(10-15 · 또래 세션이 RPG 장식 그림(assets/deco/*.svg)의 모양·색을 보고 만듦 · town_yard.js가 씀)
//   단위 = m(꾸미기 1칸 = 1m) · 원점 = 장식이 차지한 칸 묶음(w×h)의 가운데 땅(y=0) · x = 동(열+) · z = 남(행+) · 아이 키 1.35m
//   부품: { k:'box', s:[w,h,d], p:[x,y,z], c, r? } · { k:'cyl', s:[rTop,rBot,h,seg?], p, c } · { k:'cone', s:[r,h,seg?], p, c } · { k:'sph', s:[rx,ry?,rz?], p, c }
//         p = 부품 '밑면 가운데'(box·cyl·cone) / 공은 가운데 / **rx·rz로 눕힌 cyl·cone은 가운데** · r = y축 돌림(라디안) · rx·rz = 다른 축(돌림 차례: rz → rx → r)
//   anim: 'spin'(풍차 날개 — part.spin=true인 부품: 바퀴통 = 그 p · 날개마다 rz만큼 돌린 축 위로 off m 띄워 붙임 · 바퀴통을 z축으로 천천히 돌림) · 'walk'(동물 — 마당 안 천천히 · walkR m) · 'flame'(불빛 — part.glow) · 'water'(분수 물 — part.water)
//   메타버스 쪽: box→box()/dBox · cyl→dCyl · cone→dCyl(위 반지름 0) · sph→dBlob — 같은 색끼리 합쳐 그리기(정적) · anim 부품만 따로.
const C = {
  soil: '#8a6a4a', soilD: '#6e5038', stone: '#aaa79e', stoneD: '#8f8c84', leaf: '#5e9a4a', leafD: '#477f3a', leafL: '#7cb85a', trunk: '#7a5532', trunkD: '#5e4026',
  wood: '#9a6a3e', woodD: '#6e4a2a', woodL: '#c49a6a', pot: '#c66a3e', potD: '#a2552f', white: '#f4f1e8', cream: '#e8dcc3', red: '#c8453a', redD: '#9c3a32',
  rose: '#d94a5a', pink: '#ef84aa', pinkL: '#f6b8cf', yellow: '#f2c84b', gold: '#e2b03a', orange: '#ef8a45', purple: '#8a5cd6', lav: '#9a7ad6', blue: '#5aa0d8',
  water: '#7fc6ec', glass: '#cfe8ee', dark: '#3d4646', hay: '#e3c25c', wheat: '#e6c770', barley: '#d9b354', gray: '#9c9a92', moss: '#7aa060', black: '#2f2f33',
};
const box = (s, p, c, r) => ({ k: 'box', s, p, c, ...(typeof r === 'number' ? (r ? { r } : {}) : (r || {})) });   // 넷째 = 돌림(수) 또는 옵션({ glow, rx, rz … })
const cyl = (s, p, c, o = {}) => ({ k: 'cyl', s, p, c, ...o });
const cone = (s, p, c, o = {}) => ({ k: 'cone', s, p, c, ...o });
const sph = (s, p, c, o = {}) => ({ k: 'sph', s: Array.isArray(s) ? s : [s], p, c, ...o });
const rnd = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ── 묶음 부품 ──
const mound = (r = 0.42, c = C.soil) => [cyl([r, r * 1.08, 0.12, 10], [0, 0, 0], c)];
const flowerTuft = (n, cols, R = 0.32, h = 0.38, seed = 7, head = 0.075) => { const q = rnd(seed), o = []; for (let i = 0; i < n; i++) { const a = q() * Math.PI * 2, d = Math.sqrt(q()) * R, x = Math.cos(a) * d, z = Math.sin(a) * d, hh = h * (0.75 + q() * 0.5);
  o.push(box([0.025, hh, 0.025], [x, 0.08, z], C.leafD), sph(head, [x, 0.08 + hh, z], cols[i % cols.length])); } return o; };
const leafBall = (r, p, c = C.leaf) => sph(r, p, c);
const fenceRail = (L, axis, p, c = C.wood) => axis === 'x' ? box([L, 0.09, 0.07], p, c) : box([0.07, 0.09, L], p, c);
const post = (x, z, h = 1.0, c = C.woodD) => box([0.12, h, 0.12], [x, 0, z], c);
const penRing = (W, D, opts = {}) => { const o = [], hw = W / 2 - 0.08, hd = D / 2 - 0.08, h = opts.h || 0.9, c = opts.c || C.wood; // 둘레 울타리(앞쪽 가운데 문 트임)
  for (const [x, z] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd], [0, -hd], [-hw, 0], [hw, 0]]) o.push(post(x, z, h + 0.1));
  for (const y of [h * 0.45, h * 0.85]) { o.push(fenceRail(W - 0.16, 'x', [0, y, -hd], c), fenceRail(D - 0.16, 'z', [-hw, y, 0], c), fenceRail(D - 0.16, 'z', [hw, y, 0], c));
    o.push(fenceRail(hw - 0.55, 'x', [-(hw + 0.55) / 2, y, hd], c), fenceRail(hw - 0.55, 'x', [(hw + 0.55) / 2, y, hd], c)); }
  return o; };
const roofGable = (W, D, h, y, c, cx = 0, cz = 0) => { // 박공지붕을 상자 두 장(기울임)으로
  const L = Math.hypot(W / 2, h) + 0.08, a = Math.atan2(h, W / 2);
  return [{ k: 'box', s: [L, 0.12, D + 0.2], p: [cx - W / 4, y + h / 2 - 0.06, cz], c, rz: a }, { k: 'box', s: [L, 0.12, D + 0.2], p: [cx + W / 4, y + h / 2 - 0.06, cz], c, rz: -a }]; };
const potTop = (shape) => [cyl([0.26, 0.2, 0.36, 10], [0, 0, 0], C.pot), cyl([0.29, 0.29, 0.07, 10], [0, 0.34, 0], C.potD), box([0.05, 0.25, 0.05], [0, 0.4, 0], C.trunk), ...shape];
const dogBody = (col, col2, s = 1) => [box([0.32 * s, 0.22 * s, 0.6 * s], [0, 0.18 * s, 0], col), ...[[-0.11, -0.22], [0.11, -0.22], [-0.11, 0.2], [0.11, 0.2]].map(([x, z]) => box([0.07 * s, 0.18 * s, 0.07 * s], [x * s, 0, z * s], col)),
  box([0.26 * s, 0.24 * s, 0.24 * s], [0, 0.34 * s, -0.36 * s], col), box([0.14 * s, 0.1 * s, 0.12 * s], [0, 0.36 * s, -0.53 * s], col2), box([0.07 * s, 0.1 * s, 0.05 * s], [-0.08 * s, 0.58 * s, -0.36 * s], col), box([0.07 * s, 0.1 * s, 0.05 * s], [0.08 * s, 0.58 * s, -0.36 * s], col),
  box([0.06 * s, 0.06 * s, 0.22 * s], [0, 0.36 * s, 0.38 * s], col, 0)];
const bird = (col, beak, comb, s = 1) => [sph([0.17 * s, 0.15 * s, 0.22 * s], [0, 0.26 * s, 0], col), sph(0.1 * s, [0, 0.46 * s, -0.15 * s], col), box([0.06 * s, 0.04 * s, 0.08 * s], [0, 0.43 * s, -0.27 * s], beak),
  ...(comb ? [box([0.03 * s, 0.07 * s, 0.09 * s], [0, 0.54 * s, -0.15 * s], comb)] : []), box([0.03 * s, 0.12 * s, 0.03 * s], [-0.05 * s, 0, 0.02 * s], beak), box([0.03 * s, 0.12 * s, 0.03 * s], [0.05 * s, 0, 0.02 * s], beak)];
const sheep = (s = 1) => [sph([0.32 * s, 0.26 * s, 0.42 * s], [0, 0.48 * s, 0], C.white), ...[[-0.14, -0.2], [0.14, -0.2], [-0.14, 0.2], [0.14, 0.2]].map(([x, z]) => box([0.07 * s, 0.3 * s, 0.07 * s], [x * s, 0, z * s], C.black)),
  box([0.2 * s, 0.22 * s, 0.24 * s], [0, 0.5 * s, -0.42 * s], C.black), box([0.1 * s, 0.05 * s, 0.07 * s], [-0.14 * s, 0.62 * s, -0.4 * s], C.black), box([0.1 * s, 0.05 * s, 0.07 * s], [0.14 * s, 0.62 * s, -0.4 * s], C.black)];
const cropRows = (W, D, col, stalk = C.leafD, h = 0.75, seed = 3) => { const q = rnd(seed), o = [box([W - 0.1, 0.06, D - 0.1], [0, 0, 0], C.soil)];
  for (let z = -D / 2 + 0.25; z < D / 2 - 0.1; z += 0.35) for (let x = -W / 2 + 0.2; x < W / 2 - 0.1; x += 0.28) { const hh = h * (0.85 + q() * 0.3); o.push(box([0.03, hh, 0.03], [x, 0.06, z], stalk), box([0.07, 0.16, 0.07], [x, 0.06 + hh - 0.06, z], col)); }
  return o; };
const smallHouse = (W, D, H, wall, roof, door = C.woodD, o = {}) => [box([W, H, D], [0, 0, 0], wall), ...roofGable(W, D, (o.rh || 0.8), H, roof), box([0.5, 0.9, 0.04], [0, 0, D / 2 + 0.01], door),
  ...(o.win === false ? [] : [box([0.4, 0.35, 0.04], [-W / 2 + 0.45, H * 0.45, D / 2 + 0.01], C.glass), box([0.4, 0.35, 0.04], [W / 2 - 0.45, H * 0.45, D / 2 + 0.01], C.glass)])];

// ── 장식마다 ──
// 규모 점검(10-15 미리보기 6장 · three.js로 그려 봄): 꽃·화분 0.4~1.2m · 나무 2.5~4.8m · 정자 2.4m · 헛간 2.9m(사일로 3.4m) · 풍차 4.4m(날개 끝 5.2m) · 아이 1.35m
export const DECO3D = {
  d_y1: { name: '장미 꽃밭', w: 1, h: 1, parts: [...mound(0.42, C.stone), ...flowerTuft(9, [C.rose, C.rose, '#b8323f'], 0.32, 0.36, 11)] },
  d_y2: { name: '튤립', w: 1, h: 1, parts: [...mound(0.4), ...flowerTuft(7, [C.pink, C.yellow, C.orange, C.rose], 0.28, 0.42, 5, 0.085)] },
  d_y3: { name: '선인장', w: 1, h: 1, parts: [cyl([0.24, 0.18, 0.32, 10], [0, 0, 0], C.pot), box([0.2, 0.8, 0.2], [0, 0.3, 0], '#4f9a5a'), box([0.12, 0.3, 0.12], [-0.18, 0.62, 0], '#4f9a5a'), box([0.12, 0.25, 0.12], [0.18, 0.55, 0], '#4f9a5a'), sph(0.06, [0, 1.12, 0], C.rose)] },
  d_y4: { name: '정원석', w: 1, h: 1, parts: [sph([0.28, 0.16, 0.22], [-0.12, 0.1, 0.05], C.stone), sph([0.2, 0.13, 0.18], [0.2, 0.08, -0.08], C.stoneD), ...flowerTuft(3, [C.leafL], 0.4, 0.15, 2, 0.04)] },
  d_y5: { name: '정원 벤치', w: 2, h: 1, parts: [box([1.6, 0.08, 0.45], [0, 0.42, 0.02], C.wood), box([1.6, 0.36, 0.06], [0, 0.55, -0.2], C.wood), ...[-0.7, 0.7].flatMap(x => [box([0.08, 0.42, 0.4], [x, 0, 0.02], C.woodD), box([0.08, 0.5, 0.06], [x, 0.42, -0.2], C.woodD)])] },
  d_y6: { name: '가로등', w: 1, h: 1, anim: 'flame', parts: [box([0.3, 0.12, 0.3], [0, 0, 0], C.dark), cyl([0.05, 0.06, 2.6, 8], [0, 0.12, 0], C.dark), box([0.28, 0.34, 0.28], [0, 2.72, 0], '#fff3b0', { glow: true }), cone([0.24, 0.2, 4], [0, 3.06, 0], C.dark)] },
  d_y7: { name: '해바라기', w: 1, h: 1, parts: [...mound(0.38), ...[[-0.12, 0.05, 1.0], [0.14, -0.08, 1.2], [0.02, 0.15, 0.85]].flatMap(([x, z, h]) => [box([0.04, h, 0.04], [x, 0.1, z], C.leafD), cyl([0.17, 0.17, 0.04, 12], [x, 0.1 + h, z - 0.04], '#f4c430', { rx: Math.PI / 2.4 }), cyl([0.07, 0.07, 0.05, 10], [x, 0.11 + h, z - 0.06], '#6b4423', { rx: Math.PI / 2.4 }), box([0.18, 0.04, 0.08], [x + 0.1, 0.1 + h * 0.5, z], C.leaf)])] },
  d_y8: { name: '허수아비', w: 1, h: 1, parts: [box([0.07, 1.3, 0.07], [0, 0, 0], C.woodD), box([1.0, 0.07, 0.07], [0, 1.0, 0], C.woodD), box([0.38, 0.45, 0.2], [0, 0.72, 0], '#3d6fb5'), box([0.1, 0.25, 0.1], [-0.42, 0.85, 0], C.hay), box([0.1, 0.25, 0.1], [0.42, 0.85, 0], C.hay), sph(0.15, [0, 1.32, 0], '#e8d8a8'), cyl([0.3, 0.3, 0.04, 10], [0, 1.43, 0], '#b8894a'), cyl([0.13, 0.15, 0.18, 10], [0, 1.45, 0], '#b8894a')] },
  d_y9: { name: '작은 나무', w: 2, h: 2, parts: [cyl([0.12, 0.16, 1.4, 8], [0, 0, 0], C.trunk), leafBall(0.75, [0, 2.0, 0]), leafBall(0.5, [-0.45, 1.75, 0.2], C.leafL), leafBall(0.5, [0.45, 1.8, -0.15], C.leafD)] },
  d_y10: { name: '분수', w: 2, h: 2, anim: 'water', parts: [cyl([0.9, 0.95, 0.4, 16], [0, 0, 0], C.stone), cyl([0.78, 0.78, 0.055, 16], [0, 0.36, 0], C.water, { water: true }), cyl([0.12, 0.16, 0.7, 10], [0, 0.4, 0], C.stone), cyl([0.42, 0.3, 0.12, 14], [0, 1.0, 0], C.stone), cyl([0.34, 0.34, 0.04, 14], [0, 1.1, 0], C.water, { water: true }), cyl([0.06, 0.08, 0.35, 8], [0, 1.12, 0], C.stone), sph([0.12, 0.25, 0.12], [0, 1.6, 0], C.water, { water: true })] },
  d_y11: { name: '풍차', w: 2, h: 2, anim: 'spin', parts: [cyl([0.62, 0.85, 3.4, 10], [0, 0, 0], C.cream), cone([0.75, 1.0, 10], [0, 3.4, 0], C.red), box([0.45, 0.8, 0.06], [0, 0, 0.84], C.woodD), box([0.3, 0.3, 0.05], [0, 1.9, 0.72], C.glass),
    box([0.18, 0.18, 0.4], [0, 3.15, 0.85], C.woodD), ...[0, 1, 2, 3].map(i => ({ k: 'box', s: [0.32, 1.9, 0.04], p: [0, 3.25, 1.06], c: C.woodL, spin: true, rz: i * Math.PI / 2, off: 0.95 }))] },
  d_y12: { name: '벚나무', w: 3, h: 3, parts: [cyl([0.2, 0.28, 2.4, 8], [0, 0, 0], '#6e4a35'), leafBall(1.3, [0, 3.4, 0], C.pinkL), leafBall(0.95, [-0.95, 3.0, 0.3], C.pink), leafBall(0.95, [0.95, 3.1, -0.25], C.pink), leafBall(0.8, [0.2, 4.2, 0.4], '#f7c9da'), ...[[-0.8, 0.6], [0.7, 0.8], [0.3, -0.9]].map(([x, z]) => box([0.12, 0.02, 0.12], [x, 0, z], C.pinkL))] },
  d_y13: { name: '마법석', w: 1, h: 1, anim: 'flame', parts: [sph([0.3, 0.1, 0.3], [0, 0.05, 0], C.stoneD), box([0.16, 0.7, 0.16], [0, 0.08, 0], C.purple, { glow: true, rx: 0.08 }), box([0.11, 0.45, 0.11], [-0.16, 0.08, 0.06], '#a98ae6', { rz: 0.35 }), box([0.1, 0.38, 0.1], [0.15, 0.08, -0.05], '#7a4cc6', { rz: -0.3 })] },
  d_y14: { name: '황금 석등', w: 1, h: 1, anim: 'flame', parts: [box([0.42, 0.14, 0.42], [0, 0, 0], C.stone), box([0.16, 0.6, 0.16], [0, 0.14, 0], C.stone), box([0.36, 0.08, 0.36], [0, 0.74, 0], C.gold), box([0.28, 0.3, 0.28], [0, 0.82, 0], '#fff0a0', { glow: true }), cone([0.3, 0.26, 4], [0, 1.12, 0], C.gold)] },
  d_y15: { name: '낮은 관목', w: 1, h: 1, parts: [sph([0.42, 0.3, 0.38], [0, 0.28, 0], C.leaf), sph([0.26, 0.22, 0.24], [0.2, 0.42, -0.1], C.leafL), ...[[0.1, 0.34], [-0.2, 0.3], [0.28, 0.2]].map(([x, z]) => sph(0.04, [x, 0.5, z - 0.2], '#c84a4a'))] },
  d_y16: { name: '큰 화단', w: 2, h: 2, legacy: true, parts: [box([1.7, 0.45, 1.0], [0, 0, 0], '#b5543c'), box([1.6, 0.06, 0.9], [0, 0.42, 0], C.soilD), ...flowerTuft(12, [C.rose, C.yellow, C.pink, C.white, C.orange], 0.7, 0.4, 9, 0.08).map(p => ({ ...p, p: [p.p[0], p.p[1] + 0.4, p.p[2] * 0.6] }))] },
  d_y17: { name: '정자', w: 2, h: 2, parts: [box([1.9, 0.2, 1.9], [0, 0, 0], C.woodL), ...[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z]) => box([0.14, 2.2, 0.14], [x, 0.2, z], C.woodD)), cone([1.55, 1.0, 4], [0, 2.4, 0], '#5f6f5a', { r: Math.PI / 4 }), box([1.9, 0.1, 0.1], [0, 2.3, -0.85], C.woodD), box([1.9, 0.1, 0.1], [0, 2.3, 0.85], C.woodD), box([1.2, 0.08, 0.4], [0, 0.6, -0.55], C.wood)] },
  d_y18: { name: '돌 벤치', w: 2, h: 1, parts: [box([1.7, 0.14, 0.5], [0, 0.4, 0], '#bdbab3'), box([0.3, 0.4, 0.4], [-0.6, 0, 0], C.stoneD), box([0.3, 0.4, 0.4], [0.6, 0, 0], C.stoneD)] },
  d_y19: { name: '큰 나무 B', w: 2, h: 2, parts: [cyl([0.16, 0.22, 1.8, 8], [0, 0, 0], C.trunkD), leafBall(0.95, [0, 2.6, 0], '#e0763a'), leafBall(0.65, [-0.55, 2.2, 0.25], '#c85a2a'), leafBall(0.6, [0.55, 2.3, -0.2], '#ec9a4a'), box([0.15, 0.02, 0.1], [0.6, 0, 0.5], '#e0763a')] },
  d_y20: { name: '조형 분수', w: 3, h: 3, anim: 'water', parts: [cyl([1.45, 1.45, 0.08, 20], [0, 0, 0], '#c9c6bd'), cyl([1.05, 1.1, 0.42, 18], [0, 0.08, 0], C.stone), cyl([0.92, 0.92, 0.055, 18], [0, 0.465, 0], C.water, { water: true }), cyl([0.2, 0.26, 0.6, 10], [0, 0.5, 0], C.stone),
    sph([0.18, 0.16, 0.26], [0, 1.25, 0], C.white), box([0.06, 0.32, 0.06], [0, 1.3, -0.2], C.white, { rx: -0.4 }), sph(0.08, [0, 1.6, -0.3], C.white), ...[[-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15], [1.15, 1.15]].map(([x, z]) => cyl([0.16, 0.14, 0.3, 8], [x, 0.08, z], C.pot))] },
  d_y21: { name: '장미 아치', w: 1, h: 3, parts: [box([0.12, 2.0, 0.12], [0, 0, -1.3], C.woodD), box([0.12, 2.0, 0.12], [0, 0, 1.3], C.woodD), box([0.12, 0.12, 2.72], [0, 2.0, 0], C.woodD), ...[-1.3, -0.65, 0, 0.65, 1.3].map((z, i) => sph(0.1, [0.02, i % 2 ? 2.08 : 1.6, z], C.rose)), ...[-1.3, 1.3].flatMap(z => [0.5, 1.1, 1.5].map(y => sph(0.08, [0.07, y, z], C.leaf)))] },
  d_y22: { name: '나무상자', w: 1, h: 1, parts: [box([0.55, 0.45, 0.55], [-0.08, 0, 0.05], '#b07a45'), box([0.4, 0.35, 0.4], [0.22, 0, -0.18], '#c08a55'), sph(0.07, [-0.1, 0.52, 0.05], C.red)] },
  d_y23: { name: '장작더미', w: 1, h: 1, parts: [...[[0, 0.1], [0.22, 0.1], [-0.22, 0.1], [0.11, 0.28], [-0.11, 0.28], [0, 0.46]].map(([x, y]) => cyl([0.1, 0.1, 0.62, 8], [x, y, 0], C.wood, { rz: Math.PI / 2 }))] },
  d_y24: { name: '건초더미', w: 1, h: 1, parts: [cyl([0.32, 0.32, 0.7, 12], [0, 0.32, 0], C.hay, { rz: Math.PI / 2 }), box([0.3, 0.12, 0.3], [0.32, 0, 0.12], '#d8b04a')] },
  d_y25: { name: '밀밭', w: 2, h: 2, parts: cropRows(2, 2, C.wheat, '#b8a050', 0.8, 4) },
  d_y26: { name: '큰 바위', w: 2, h: 1, parts: [sph([0.85, 0.42, 0.45], [0, 0.32, 0], C.gray), sph([0.4, 0.15, 0.25], [-0.2, 0.68, -0.05], C.moss)] },
  d_y27: { name: '우물', w: 2, h: 2, parts: [cyl([0.62, 0.66, 0.7, 12], [0, 0, 0], '#9a9890'), cyl([0.48, 0.48, 0.05, 12], [0, 0.68, 0], '#4a6a8a'), box([0.1, 1.5, 0.1], [-0.6, 0.7, 0], C.woodD), box([0.1, 1.5, 0.1], [0.6, 0.7, 0], C.woodD), ...roofGable(1.5, 1.0, 0.5, 2.15, C.red), cyl([0.05, 0.05, 1.2, 6], [0, 1.6, 0], C.woodD, { rz: Math.PI / 2 }), box([0.22, 0.24, 0.22], [0, 1.0, 0], C.woodL)] },
  d_y28: { name: '헛간', w: 3, h: 2, parts: [box([2.4, 2.0, 1.7], [-0.25, 0, 0], '#b8443a'), ...roofGable(2.4, 1.7, 0.9, 2.0, '#6a4a40', -0.25), box([1.0, 1.4, 0.05], [-0.25, 0, 0.86], C.white), box([1.15, 0.08, 0.05], [-0.25, 0.66, 0.9], C.white, { rz: 0.95 }), box([1.15, 0.08, 0.05], [-0.25, 0.66, 0.9], C.white, { rz: -0.95 }), cyl([0.36, 0.36, 3.0, 10], [1.15, 0, -0.2], '#c9c6bd'), cone([0.4, 0.45, 10], [1.15, 3.0, -0.2], '#8a8a90')] },
  d_y29: { name: '갈대 묶음', w: 1, h: 1, parts: [...[[-0.12, 0.05], [0.1, -0.08], [0.02, 0.14], [0.16, 0.1]].flatMap(([x, z], i) => [box([0.025, 1.1 + i * 0.08, 0.025], [x, 0, z], C.leafD), cyl([0.045, 0.045, 0.24, 6], [x, 0.8 + i * 0.08, z], '#7a5530')]), ...[[-0.2, 0], [0.2, 0.05], [0, -0.15]].map(([x, z]) => box([0.03, 0.6, 0.06], [x, 0, z], C.leaf, x * 2))] },
  d_y30: { name: '징검돌', w: 1, h: 1, parts: [cyl([0.2, 0.22, 0.06, 9], [-0.18, 0, -0.15], C.stone), cyl([0.18, 0.2, 0.06, 9], [0.2, 0, 0.0], C.stoneD), cyl([0.16, 0.18, 0.06, 9], [-0.05, 0, 0.25], C.stone)] },
  d_y31: { name: '작은 연못', w: 3, h: 3, legacy: true, parts: [cyl([1.4, 1.45, 0.14, 16], [0, 0, 0], '#9a9488'), cyl([1.18, 1.18, 0.055, 16], [0, 0.11, 0], C.water, { water: true }), ...[[0.4, 0.2], [-0.35, -0.3], [0.1, -0.5]].map(([x, z]) => cyl([0.18, 0.18, 0.02, 8], [x, 0.16, z], C.leafL)), sph(0.06, [0.42, 0.2, 0.2], C.pinkL), ...[[-1.0, 0.7], [-1.1, 0.4]].map(([x, z]) => box([0.03, 0.9, 0.03], [x, 0, z], C.leafD))] },
  d_y32: { name: '오리 가족', w: 2, h: 1, anim: 'walk', walkR: 2.5, parts: [...bird(C.white, C.orange, null, 1.2).map(p => ({ ...p, p: [p.p[0] - 0.45, p.p[1], p.p[2]] })), ...[0.15, 0.45, 0.75].flatMap(x => bird('#f6d24a', C.orange, null, 0.6).map(p => ({ ...p, p: [p.p[0] + x, p.p[1], p.p[2]] })))] },
  d_y33: { name: '오두막', w: 2, h: 2, parts: [box([1.7, 1.5, 1.5], [0, 0, 0], '#8a5a34'), ...[0.25, 0.6, 0.95, 1.3].map(y => box([1.76, 0.06, 1.56], [0, y, 0], '#6e4a2a')), ...roofGable(1.7, 1.5, 0.8, 1.5, '#4f5f50'), box([0.45, 0.85, 0.04], [0, 0, 0.76], C.woodD), box([0.3, 0.3, 0.04], [0.55, 0.8, 0.76], '#f0d070'), box([0.18, 0.6, 0.18], [0.45, 2.0, -0.3], C.stoneD)] },
  d_y34: { name: '작은 창고', w: 2, h: 2, parts: [...smallHouse(1.6, 1.4, 1.4, '#9a958c', '#7a5236', C.woodD, { rh: 0.6 })] },
  d_y36: { name: '보리밭', w: 2, h: 2, parts: cropRows(2, 2, C.barley, '#a89040', 0.7, 8) },
  d_y39: { name: '닭 3마리', w: 2, h: 1, anim: 'walk', walkR: 2.5, parts: [[-0.6, C.white], [0, '#b8743a'], [0.6, C.white]].flatMap(([x, col]) => bird(col, C.gold, C.red, 0.9).map(p => ({ ...p, p: [p.p[0] + x, p.p[1], p.p[2]] }))) },
  d_y40: { name: '양', w: 2, h: 1, anim: 'walk', walkR: 3, parts: [...sheep(1.0).map(p => ({ ...p, p: [p.p[0] + 0.35, p.p[1], p.p[2]] })), ...sheep(0.65).map(p => ({ ...p, p: [p.p[0] - 0.5, p.p[1], p.p[2]] }))] },
  d_y41: { name: '라벤더', w: 1, h: 1, parts: [...mound(0.36, C.soilD), ...flowerTuft(8, [C.lav, '#b39ae6'], 0.28, 0.5, 13, 0.06).map(p => p.k === 'sph' ? { ...p, s: [0.045, 0.12, 0.045] } : p)] },
  d_y42: { name: '데이지', w: 1, h: 1, parts: [...mound(0.38, C.leafD), ...flowerTuft(9, [C.white, C.white, '#fff6c8'], 0.3, 0.3, 17, 0.07)] },
  d_y43: { name: '장미 B형', w: 1, h: 1, parts: [...mound(0.4), ...flowerTuft(8, [C.white, '#f7e9e2'], 0.3, 0.38, 19)] },
  d_y44: { name: '튤립 B형', w: 1, h: 1, parts: [...mound(0.4, C.stone), ...flowerTuft(7, [C.purple, C.yellow, '#b07ae6'], 0.28, 0.42, 23, 0.085)] },
  d_y45: { name: '키 큰 풀숲', w: 1, h: 1, parts: [...[[-0.15, 0, -0.3, 0.22], [0.1, -0.08, 0.2, -0.18], [0.02, 0.14, 0.5, 0.12], [0.18, 0.1, -0.1, -0.28], [-0.08, -0.15, 0.35, 0.3], [0.05, 0.02, 1.2, -0.08]].map(([x, z, r, lz]) => box([0.05, 1.0, 0.1], [x, 0, z], C.leaf, { r, rz: lz }))] },
  d_y46: { name: '침엽수', w: 2, h: 2, parts: [cyl([0.12, 0.16, 0.8, 8], [0, 0, 0], C.trunkD), cone([0.95, 1.6, 9], [0, 0.6, 0], '#3f7a4a'), cone([0.75, 1.4, 9], [0, 1.6, 0], '#468a52'), cone([0.5, 1.2, 9], [0, 2.6, 0], '#4f9a5a')] },
  d_y47: { name: '둥근 나무 2', w: 2, h: 2, legacy: true, parts: [cyl([0.13, 0.17, 1.5, 8], [0, 0, 0], '#8a7a6a'), leafBall(0.85, [0, 2.3, 0], '#8cbf6a'), ...[[0.4, 2.6, 0.5], [-0.5, 2.2, 0.4], [0.2, 2.9, -0.4], [-0.3, 2.7, -0.5]].map(p => sph(0.09, p, '#f4e1ea'))] },
  d_y48: { name: '과수나무', w: 2, h: 2, parts: [cyl([0.14, 0.2, 1.4, 8], [0, 0, 0], C.trunk), leafBall(0.9, [0, 2.1, 0], '#4f8f3a'), leafBall(0.55, [-0.6, 1.8, 0.2], C.leaf), leafBall(0.55, [0.6, 1.85, -0.2], C.leafD), ...[[0.5, 2.3, 0.55], [-0.4, 1.9, 0.62], [0.1, 2.7, 0.5], [0.65, 1.7, 0.2], [-0.7, 2.2, -0.2], [0.3, 1.6, -0.6]].map(p => sph(0.1, p, C.red))] },
  d_y49: { name: '가로 울타리', w: 1, h: 1, parts: [post(-0.42, 0), post(0.42, 0), fenceRail(1.0, 'x', [0, 0.4, 0]), fenceRail(1.0, 'x', [0, 0.75, 0])] },
  d_y50: { name: '세로 울타리', w: 1, h: 1, parts: [post(0, -0.42), post(0, 0.42), fenceRail(1.0, 'z', [0, 0.4, 0]), fenceRail(1.0, 'z', [0, 0.75, 0])] },
  d_y51: { name: '왼쪽 코너', w: 1, h: 1, parts: [post(-0.42, -0.42, 1.05), fenceRail(0.9, 'x', [0.03, 0.4, -0.42]), fenceRail(0.9, 'x', [0.03, 0.75, -0.42]), fenceRail(0.9, 'z', [-0.42, 0.4, 0.03]), fenceRail(0.9, 'z', [-0.42, 0.75, 0.03])] },
  d_y52: { name: '오른쪽 코너', w: 1, h: 1, parts: [post(0.42, -0.42, 1.05), fenceRail(0.9, 'x', [-0.03, 0.4, -0.42]), fenceRail(0.9, 'x', [-0.03, 0.75, -0.42]), fenceRail(0.9, 'z', [0.42, 0.4, 0.03]), fenceRail(0.9, 'z', [0.42, 0.75, 0.03])] },
  d_y53: { name: '강아지', w: 1, h: 1, anim: 'walk', walkR: 4, parts: dogBody('#e09a4a', '#f3e9dc', 1.0) },
  d_y54: { name: '고양이', w: 1, h: 1, anim: 'walk', walkR: 3, parts: dogBody('#8a8a8a', '#b8b8b8', 0.85) },
  d_y55: { name: '닭 1마리', w: 1, h: 1, anim: 'walk', walkR: 2.5, parts: bird(C.white, C.gold, C.red, 1.0) },
  d_y56: { name: '오리 1마리', w: 1, h: 1, anim: 'walk', walkR: 2.5, parts: bird(C.white, C.orange, null, 1.1) },
  d_y57: { name: '양 1마리', w: 1, h: 1, anim: 'walk', walkR: 3, parts: sheep(0.95) },
  d_y58: { name: '닭장', w: 4, h: 3, parts: [...penRing(4, 3), ...smallHouse(1.2, 1.0, 0.9, C.white, C.red, C.woodD, { rh: 0.45, win: false }).map(p => ({ ...p, p: [p.p[0] - 1.1, p.p[1], p.p[2] - 0.7] })), box([0.9, 0.25, 0.3], [0.9, 0, 0.7], C.wood), box([0.3, 0.12, 0.3], [-1.2, 0, 0.8], C.blue)] },
  d_y60: { name: '양 목장', w: 5, h: 4, parts: [...penRing(5, 4), cyl([0.35, 0.35, 0.7, 12], [-1.4, 0.35, -1.1], C.hay, { rz: Math.PI / 2 }), cyl([0.35, 0.35, 0.7, 12], [-0.6, 0.35, -1.2], C.hay, { rz: Math.PI / 2 }), box([1.0, 0.3, 0.45], [-1.5, 0, 1.1], C.blue), cyl([0.18, 0.18, 0.4, 10], [1.6, 0, 1.2], C.woodL)] },
  d_y62: { name: '강아지 마당', w: 4, h: 3, parts: [...penRing(4, 3), ...smallHouse(1.0, 0.9, 0.7, C.woodL, C.red, C.black, { rh: 0.4, win: false }).map(p => ({ ...p, p: [p.p[0] - 0.9, p.p[1], p.p[2] - 0.6] })), cyl([0.15, 0.12, 0.08, 10], [0.6, 0, 0.6], C.blue), cyl([0.15, 0.12, 0.08, 10], [1.0, 0, 0.6], C.red), box([0.3, 0.06, 0.08], [1.2, 0, -0.5], C.white)] },
  d_y63: { name: '놀이터', w: 4, h: 4, parts: [...[-1.7, -0.5].map(x => box([0.1, 2.0, 0.1], [x, 0, -1.4], C.red)), box([1.4, 0.1, 0.1], [-1.1, 2.0, -1.4], C.red), ...[-1.45, -0.75].flatMap(x => [box([0.03, 1.4, 0.03], [x, 0.6, -1.4], C.gray), box([0.4, 0.05, 0.2], [x, 0.55, -1.4], C.woodD)]),
    box([0.8, 0.12, 2.0], [1.2, 0.2, -0.6], C.blue, 0), { k: 'box', s: [0.7, 0.08, 2.2], p: [1.2, 0.6, 0.0], c: '#5ab0e8', rx: -0.55 }, box([0.8, 1.5, 0.8], [1.2, 0, -1.3], '#e8d6a8'), box([0.9, 0.08, 0.9], [1.2, 1.5, -1.3], C.red),
    box([1.6, 0.08, 0.2], [-0.9, 0.35, 1.2], C.yellow, 0), cone([0.18, 0.35, 4], [-0.9, 0, 1.2], C.red), box([1.0, 0.08, 0.35], [0.9, 0.4, 1.4], C.wood), box([0.08, 0.4, 0.3], [0.5, 0, 1.4], C.woodD), box([0.08, 0.4, 0.3], [1.3, 0, 1.4], C.woodD)] },
  d_y67: { name: '온실', w: 4, h: 3, parts: [box([3.6, 0.15, 2.6], [0, 0, 0], C.stoneD), { k: 'box', s: [3.5, 1.9, 2.5], p: [0, 0.15, 0], c: C.glass, glassy: true }, ...roofGable(3.5, 2.5, 0.9, 2.05, '#dfeff2'), ...[-1.7, -0.6, 0.6, 1.7].map(x => box([0.07, 2.0, 2.56], [x, 0.15, 0], C.white)),
    box([0.8, 1.6, 0.05], [0, 0.15, 1.26], C.white), ...[[-1.2, -0.6], [-0.6, -0.6], [0.6, -0.6], [1.2, -0.6]].map(([x, z]) => sph(0.25, [x, 0.55, z], C.leaf))] },
  d_y68: { name: '캠프파이어', w: 3, h: 3, anim: 'flame', parts: [...Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return sph([0.16, 0.1, 0.14], [Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5], C.stoneD); }),
    ...[0, 1, 2].map(i => cyl([0.06, 0.06, 0.6, 6], [0, 0.08, 0], C.woodD, { rz: Math.PI / 2, r: i * Math.PI / 3 })), cone([0.22, 0.6, 6], [0, 0.12, 0], '#ff9a3a', { glow: true }), cone([0.12, 0.4, 6], [0.05, 0.18, 0.02], '#ffd84a', { glow: true }),
    ...[[-1.15, 0, 0], [1.15, 0, Math.PI], [0, -1.15, Math.PI / 2]].map(([x, z, r]) => cyl([0.16, 0.16, 1.2, 8], [x, 0.16, z], C.wood, { rz: Math.PI / 2, r: r + Math.PI / 2 }))] },
  d_y69: { name: '먹이통', w: 1, h: 1, parts: [box([0.7, 0.25, 0.35], [0, 0, 0], C.wood), box([0.62, 0.05, 0.27], [0, 0.22, 0], C.hay)] },
  d_y70: { name: '울타리', w: 1, h: 1, parts: [post(-0.3, 0), post(0.3, 0), fenceRail(0.9, 'x', [0, 0.4, 0]), fenceRail(0.9, 'x', [0, 0.72, 0])] },
  d_y71: { name: '울타리 모퉁이 ┌', w: 1, h: 1, parts: [post(-0.3, -0.3, 1.05), fenceRail(0.75, 'x', [0.08, 0.4, -0.3]), fenceRail(0.75, 'x', [0.08, 0.72, -0.3]), fenceRail(0.75, 'z', [-0.3, 0.4, 0.08]), fenceRail(0.75, 'z', [-0.3, 0.72, 0.08])] },
  d_y72: { name: '울타리 모퉁이 ┐', w: 1, h: 1, parts: [post(0.3, -0.3, 1.05), fenceRail(0.75, 'x', [-0.08, 0.4, -0.3]), fenceRail(0.75, 'x', [-0.08, 0.72, -0.3]), fenceRail(0.75, 'z', [0.3, 0.4, 0.08]), fenceRail(0.75, 'z', [0.3, 0.72, 0.08])] },
  d_y85: { name: '공 나무', w: 1, h: 1, parts: potTop([box([0.06, 0.55, 0.06], [0, 0.4, 0], C.trunk), sph(0.36, [0, 1.2, 0], C.leaf)]) },
  d_y86: { name: '원뿔 나무', w: 1, h: 1, parts: potTop([cone([0.3, 1.2, 8], [0, 0.55, 0], C.leaf)]) },
  d_y87: { name: '원통 나무', w: 1, h: 1, parts: potTop([cyl([0.24, 0.24, 1.0, 10], [0, 0.55, 0], C.leaf), sph([0.24, 0.1, 0.24], [0, 1.55, 0], C.leafL)]) },
  d_y88: { name: '나선 나무', w: 1, h: 1, parts: potTop([box([0.05, 1.1, 0.05], [0, 0.4, 0], C.trunk), ...[0.75, 1.05, 1.3, 1.5].map((y, i) => sph(0.24 - i * 0.04, [0, y, 0], i % 2 ? C.leafL : C.leaf))]) },
  d_y89: { name: '토끼 나무', w: 1, h: 1, parts: potTop([box([0.05, 0.3, 0.05], [0, 0.4, 0], C.trunk), sph(0.3, [0, 0.95, 0], C.leaf), sph(0.2, [0, 1.38, 0], C.leaf), box([0.08, 0.4, 0.06], [-0.08, 1.48, 0], C.leaf), box([0.08, 0.4, 0.06], [0.08, 1.48, 0], C.leaf), sph(0.09, [0.28, 0.95, 0.1], C.leafL)]) },
  d_y90: { name: '곰 나무 (선물)', w: 1, h: 1, parts: potTop([box([0.05, 0.3, 0.05], [0, 0.4, 0], C.trunk), sph(0.3, [0, 0.95, 0], C.leaf), sph(0.22, [0, 1.38, 0], C.leaf), sph(0.08, [-0.16, 1.56, 0], C.leaf), sph(0.08, [0.16, 1.56, 0], C.leaf), sph(0.07, [0, 1.35, 0.2], C.leafL)]) },
  d_y91: { name: '오리 나무 (선물)', w: 1, h: 1, parts: potTop([box([0.05, 0.3, 0.05], [0, 0.4, 0], C.trunk), sph([0.32, 0.26, 0.38], [0, 0.95, 0], C.leaf), sph(0.17, [0, 1.3, -0.25], C.leaf), box([0.1, 0.06, 0.16], [0, 1.28, -0.45], C.gold)]) },
};
// 카탈로그에만 있고 위에 없는 id(새로 생긴 장식) → 작은 화분(✨) — 무엇이든 빠짐없이 보이게
export const FALLBACK = { name: '(새 장식)', w: 1, h: 1, parts: [cyl([0.22, 0.17, 0.3, 10], [0, 0, 0], C.pot), sph(0.26, [0, 0.55, 0], C.leaf), sph(0.06, [0.12, 0.72, 0.15], C.yellow)] };

// ── 바닥(yardFloor) — 기본 14 + 꽃밭 가족('이름#색+테두리') ──
export const FLOOR3D = {
  grass: '#9ccb73', dirt: '#8b6a47', dark_earth: '#6b4e36', stone: '#a7a6a1', stone_floor: '#c4c2bc', sand: '#e6d6a4', gravel: '#b9b3a7', brick: '#b5543c', wood: '#b58a5a',
  water: '#5fa8d6', flower: '#e7a6c8', deck: '#a0744b', dry_earth: '#c9a574', gravel_yard: '#d3cbb9',
};
export const FLOWER_FAMS = { // 바닥 위에 낮은 꽃 무늬(칸마다 꽃 몇 송이 — 합친 메시 · 색은 #뒤 값, 없으면 기본)
  tulipbed: { base: '#7a5a3e', def: 'pink' }, tulipcol: { base: '#7a5a3e', def: 'pink', rows: true }, hydrangea: { base: '#5e8a4a', def: 'blue', big: true }, lavender: { base: '#6e7a4a', def: 'violet', tall: true },
  sunflowerbed: { base: '#7a6a3e', def: 'yellow', tall: true }, daisyfield: { base: '#7aa85a', def: 'white' }, wildflower: { base: '#8cbf6a', def: 'rainbow', sparse: true },
};
export const FLOWER_COL = { pink: '#ef84aa', red: '#d94a5a', yellow: '#f2c84b', white: '#f4f1e8', violet: '#9a6ad6', orange: '#ef8a45', blue: '#6a9ae0', candy: '#f59ac0', sherbet: '#f8b48a', night: '#5a3a8a',
  duo: '#a88ae0', moon: '#e8e4f8', lemon: '#f6e06a', rainbow: '#e85a8a', snow: '#ffffff' };
export const RIM = { brick: '#b5543c', stone: '#a8a59c', picket: '#f4f1e8' }; // 꽃밭 가장자리 마감(+brick/+stone/+picket)
export function floorOf(v) { // 'tulipbed#pink+brick' → { base, flower?, rim? }
  if (!v || typeof v !== 'string') return { base: FLOOR3D.grass };
  const m = /^([a-z_][a-z0-9_]*)(?:#([a-z]+))?(?:\+([a-z]+))?$/.exec(v); if (!m) return { base: FLOOR3D.grass };
  const [, name, col, rim] = m;
  if (FLOOR3D[name]) return { base: FLOOR3D[name] };
  const f = FLOWER_FAMS[name]; if (!f) return { base: FLOOR3D.grass };
  return { base: f.base, flower: FLOWER_COL[col || f.def] || FLOWER_COL.pink, fam: name, rim: rim && RIM[rim] ? RIM[rim] : null, ...f };
}
