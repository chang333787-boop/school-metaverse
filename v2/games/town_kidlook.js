// 아이 동네 이름답게(KIDLOOK-1 · 사용자 10-26 저녁 "아이들이 지은 이름이 진짜 그 마을의 특성을 반영을 안 하는 것 같다 · 자연친화 마을인데 '엥 이게 왜 자연친화 마을?'")
//   이름은 그대로(아이 글 · 바꾸지 않음) — 그 동네 들머리(아이 동네 표지석 곁)에 이름다운 시설 묶음 하나 + 그 이름에 맞는 할 거리 하나
//   묶음 = 실제 생태·친환경·농촌·산촌·학원가·옛 골목에 있는 것만(사실 · 판타지 X · 지어낸 이야기 X · 실명 X) · 자리 = 표지석에서 가까운 평평한 빈 땅(town.js fil2Spot과 같은 찾기)
//   할 거리 = 몸으로 자료 모으기(표 · 온도계 · 나무 · 구멍 · 간판을 찾아 E) → 그 자료와 지금 날씨·때·계절로 판단 고르기 → 결과가 그 자리에 남음(after 메시) · 틀려도 벌 X(무엇이 달라지는지 한 줄)
//   그리기 = 합친 상자(box·dbx·cyl·gpad · 청크 병합) + 동네마다 작은 상태 메시(보였다 숨었다 · 새 Light X) · 매 프레임 일 0 · 보상 = skUp(꼬리표 kl:<갈래>)
//   자료(어느 동네에 어느 갈래) = 판 자료 ourtown.js kidlook · 표 = docs/systems/town_names.md 2-0 '모습' 칸
const T2 = (ko, en) => [ko, en];
const SEAK = { spring: 0, summer: 1, autumn: 2, winter: 3 };
const DIR8K = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], DIR8E = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const hs = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = s => { let a = hs(s) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; };

// ───────── 갈래(kit) 표 ─────────
//   ic 제목 아이콘 · nm 시설 이름(장소 찾기·판) · w·d 묶음 크기(m) · task 할 일 한 문장 · posts 자료 모으는 자리(E) · qs 판단 · end 끝 한 줄
export const KITS = {
  rain: { ic: '💧', nm: T2('빗물 텃밭', 'Rainwater Garden'), w: 17, d: 12, sk: 'farm', task: T2('빗물 저금통 물을 가장 목마른 텃밭에 나눠 줘요.', 'Share the rain-barrel water with the thirstiest beds.') },
  temp: { ic: '🌡', nm: T2('덩굴 벽 온도 재기', 'Green Wall Thermometers'), w: 16, d: 10, sk: 'look', task: T2('온도계 셋을 읽고 어디가 가장 시원한지 견줘요.', 'Read the three thermometers and compare which spot is coolest.') },
  obs: { ic: '🔍', nm: T2('생태 보호 구역', 'Wildlife Protection Area'), w: 16, d: 12, sk: 'look', task: T2('새집·곤충 호텔·연못을 차례로 살펴보고 기록해요.', 'Look at the nest box, the bug hotel and the pond, and note what you see.') },
  perm: { ic: '💧', nm: T2('빗물 스미는 길', 'Rain-Soaking Path'), w: 15, d: 10, sk: 'look', task: T2('두 길에 물을 부어 보고 어느 쪽이 빗물을 땅으로 보내는지 견줘요.', 'Pour water on both paths and compare which one lets the rain into the ground.') },
  jang: { ic: '🏺', nm: T2('장독대', 'Sauce Jar Terrace'), w: 14, d: 10, sk: 'farm', task: T2('오늘 날씨와 때를 보고 장독 뚜껑을 열지 닫을지 정해요.', 'Look at today\'s weather and time, and decide whether to open or close the jar lids.') },
  tree: { ic: '🌲', nm: T2('숲속 오솔길', 'Forest Path'), w: 18, d: 14, sk: 'look', task: T2('큰 소나무 셋의 둘레를 팔로 재어 보고 견줘요.', 'Hug the three big pines to measure them, then compare.') },
  wood: { ic: '🪵', nm: T2('장작 쌓는 곳', 'Firewood Corner'), w: 13, d: 9, sk: 'work', task: T2('장작 두 더미를 두드려 보고 마른 것을 골라 쌓아요.', 'Knock on the two woodpiles, pick the dry one and stack it.') },
  hole: { ic: '🧱', nm: T2('축대 물빠짐 구멍', 'Retaining Wall Drain Holes'), w: 14, d: 8, sk: 'look', task: T2('축대의 물빠짐 구멍 셋을 살펴보고 막힌 곳을 찾아요.', 'Check the three drain holes in the stone wall and find the blocked one.') },
  bus: { ic: '🚌', nm: T2('학원 버스 정류장', 'Academy Bus Stop'), w: 14, d: 7, sk: 'explore', task: T2('시간표를 읽고 수업에 늦지 않는 버스를 골라요.', 'Read the timetable and pick a bus that gets you to class on time.') },
  alley: { ic: '⛲', nm: T2('분수 광장', 'Fountain Square'), w: 15, d: 19, sk: 'explore', task: T2('골목에 걸린 간판 셋을 찾아 분수에서 어느 쪽인지 알아내요.', 'Find the three hanging signs in the lanes and work out which way each is from the fountain.') },
};
// 계절·날씨·때 → 관찰 한 줄(사실만)
const OBS = {
  nest: { spring: T2('나무 위 새집에서 새끼 새 우는 소리가 나요. 어미 새가 벌레를 물고 드나들어요.', 'Chicks are cheeping in the nest box. A parent bird flies in and out with insects.'), summer: T2('새집이 조용해요. 새끼들이 다 자라서 둥지를 떠났어요.', 'The nest box is quiet. The chicks have grown and left.'), autumn: T2('새집이 비어 있어요. 겨울이 오기 전에 묵은 둥지를 치워 줘요.', 'The nest box is empty. The old nest gets cleared out before winter.'), winter: T2('작은 박새가 추운 밤을 보내려고 새집에 들어가요.', 'A small tit slips into the box to get through the cold night.'), night: T2('밤이라 새집이 조용해요. 새들은 둥지나 나뭇가지에서 자요.', 'It is night and the nest box is quiet. Birds sleep in nests or on branches.') },
  hotel: { spring: T2('대롱 몇 개가 흙으로 막혀 있어요. 벌이 알을 낳고 입구를 막은 거예요.', 'Some tubes are sealed with mud. A bee laid eggs inside and closed the door.'), summer: T2('작은 벌이 대롱 구멍으로 꽃가루를 날라요.', 'A small bee is carrying pollen into a tube.'), autumn: T2('무당벌레가 나무 틈으로 기어 들어가요. 겨울을 날 자리를 찾고 있어요.', 'A ladybird crawls into a gap in the wood, looking for a place to spend the winter.'), winter: T2('조용해요. 안에서 벌레들이 겨울잠을 자요. 두드리지 않아요.', 'All quiet. Insects are spending the winter inside. We do not knock.'), night: T2('밤엔 곤충 호텔 안에서 벌레들이 쉬어요.', 'At night the insects rest inside the hotel.') },
  pond: { spring: T2('연못가에 개구리 알 덩어리가 있어요. 투명한 알 속에 까만 점이 보여요.', 'There is a clump of frog spawn by the edge, with black dots inside the clear jelly.'), summer: T2('올챙이가 헤엄치고, 물 위에서 소금쟁이가 미끄러져요.', 'Tadpoles are swimming, and pond skaters glide on the surface.'), autumn: T2('잠자리가 꼬리로 물을 톡톡 쳐요. 물속에 알을 낳는 거예요.', 'A dragonfly taps the water with its tail. It is laying eggs.'), winter: T2('연못 겉이 얼었어요. 얼음 밑에서 물고기가 천천히 움직여요.', 'The pond has a skin of ice. Underneath, fish move slowly.'), night: T2('밤 연못에서 개구리 소리가 나요.', 'Frogs are calling from the pond at night.') },
};
// 분수에서 본 방위(8방위) — 세계 +z = 남(작은 지도 위 = 북)
const dir8 = (dx, dz) => { const a = Math.atan2(dx, -dz); return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; };

export function createKidLook(A) {
  let ECO9 = null; const KL = [], HOT = [], STM = [];   /* KL = 동네마다 { g, t, k, x, z, ry, Q, posts, main, st(상태 메시), d } */
  let MATS = null;
  const en = () => A.en(), tx = p => p[en() ? 1 : 0];
  const S = () => { const G = A.GAME.S; return G.kl && typeof G.kl === 'object' ? G.kl : (G.kl = {}); };
  const KS = k => { const s = S(); return s[k] && typeof s[k] === 'object' ? s[k] : (s[k] = { done: 0 }); };
  const ctx = () => { const sea = A.season(), wx = A.wx(), night = A.night(), m = A.min(); return { sea, s: SEAK[sea] ?? 1, wet: wx === 'rain' || wx === 'snow', rain: wx === 'rain', snow: wx === 'snow', night, min: m, day: A.GAME.S.day, R: rngOf('kl' + A.GAME.S.day) }; };
  // ───────── 상태 메시(보였다 숨었다 — 결과가 그 자리에 남음) ─────────
  function stateMesh(K, parts) { if (!parts.length) return null; const P = [], N = [], C = [], T3 = A.T3;
    for (const [u, v, yo, sx, sy, sz, hex, ro] of parts) { const [x, z] = K.Q(u, v), y = A.ty(x, z) + yo, ry = K.ry + (ro || 0), c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hz = sz / 2, col = A.rgb(hex);
      const p = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c], V = [p(-hx, 0, -hz), p(hx, 0, -hz), p(hx, 0, hz), p(-hx, 0, hz), p(-hx, sy, -hz), p(hx, sy, -hz), p(hx, sy, hz), p(-hx, sy, hz)];
      const face = (a, b, c9, d, n, k) => { for (const q of [a, b, c9, a, c9, d]) { P.push(...V[q]); N.push(...n); C.push(col[0] * k, col[1] * k, col[2] * k); } };
      face(4, 7, 6, 5, [0, 1, 0], 1); face(3, 2, 6, 7, [s, 0, c], 0.9); face(1, 0, 4, 5, [-s, 0, -c], 0.9); face(2, 1, 5, 6, [c, 0, -s], 0.84); face(0, 3, 7, 4, [-c, 0, s], 0.84); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); A.geos(g);
    if (!MATS) MATS = new T3.MeshLambertMaterial({ vertexColors: true });
    const m = new T3.Mesh(g, MATS); m.matrixAutoUpdate = false; m.visible = false; A.group().add(m); STM.push(m); return m; }
  // ───────── 묶음 짓기(갈래마다) — K = { Q(u,v) → [x,z], ry, g(u,v) 땅 높이 } · +v = 길 쪽(앞) ─────────
  const kitK = (sp) => { const K = { x: sp.x, z: sp.z, ry: sp.ry, Q: sp.Q }; K.g = (u, v) => { const [x, z] = K.Q(u, v); return A.ty(x, z); };
    K.B = (u, v, yo, sx, sy, sz, hex, o = {}) => { const [x, z] = K.Q(u, v); A.box(x, A.ty(x, z) + yo, z, sx, sy, sz, K.ry + (o.ro || 0), hex, o); };
    K.D = (u, v, yo, sx, sy, sz, hex, o = {}) => { const [x, z] = K.Q(u, v); A.dbx(x, A.ty(x, z) + yo, z, sx, sy, sz, K.ry + (o.ro || 0), hex, o); };
    K.C = (u, v, yo, r, h, hex, seg = 10, o = {}) => { const [x, z] = K.Q(u, v); A.cyl(x, A.ty(x, z) + yo, z, r, h, hex, seg, o); };
    K.pad = (u, v, sx, sz, dy, hex, ro = 0) => { const [x, z] = K.Q(u, v); A.gpad(x, z, sx, sz, K.ry + ro, dy, hex); };
    K.T = (u, v, s9, sp9 = 'round', hex) => { const [x, z] = K.Q(u, v); A.TREES[sp9].push({ x, y: A.ty(x, z), z, s: s9, hex: hex ?? (sp9 === 'round' ? A.PAL.tree[1] : null), ry: (u * 7 + v * 3) % 6, kid: true }); };
    K.F = (u, v, i) => { const [x, z] = K.Q(u, v); A.TREES.flower.push({ x, y: A.ty(x, z) + 0.05, z, s: 1.1, hex: A.PAL.flower[i % 4], ry: (u + v) % 6, kid: true }); };
    K.bush = (u, v, s9 = 0.8, hex = 0x4e9a43) => { const [x, z] = K.Q(u, v); A.TREES.bush.push({ x, y: A.ty(x, z), z, s: s9, hex, ry: (u * 5 + v) % 6, kid: true }); };
    K.col = (u, v, hx, hz, h, ro = 0) => { const [x, z] = K.Q(u, v), g = A.ty(x, z); A.pcol(A.col9(x, z, hx, hz, K.ry + ro, g - 1, g + h)); };
    K.rod = (a, b, r, hex) => { const [x0, z0] = K.Q(a[0], a[1]), [x1, z1] = K.Q(b[0], b[1]); A.rodQ(A.bucket(x0, z0), [x0, A.ty(x0, z0) + a[2], z0], [x1, A.ty(x1, z1) + b[2], z1], r, A.rgb(hex)); };
    K.sign = (u, v, t, o = {}) => { const [x, z] = K.Q(u, v); A.sign(x, z, K.ry + (o.ro || 0), t, o); };
    return K; };
  const ring = (K, u, v, r, n, hex, y0 = 0, s9 = 0.5) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832, du = Math.cos(a) * r, dv = Math.sin(a) * r * 0.8; K.D(u + du, v + dv, y0 - 0.06, s9 + (i % 3) * 0.08, 0.26 + (i % 2) * 0.06, s9 * 0.8, hex + (i % 3) * 0x050505, { ro: a }); } };
  const pond = (K, u, v, r) => { K.C(u, v, -0.02, r + 0.15, 0.05, 0x6b5a40, 18); K.C(u, v, 0.0, r, 0.07, 0x4f9ec4, 18, { top: 0x5aa9cf }); ring(K, u, v, r + 0.25, 12, 0x8f8a7e, 0.02, 0.45);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.2832 + 0.3; if (i % 3 === 0) continue; K.bush(u + Math.cos(a) * (r + 0.7), v + Math.sin(a) * (r + 0.7) * 0.8, 0.4, [0x9cc46a, 0x86b85a, 0xb5cf7a][i % 3]); }
    for (const [a, b] of [[0.4, 0.3], [-0.6, -0.2], [0.1, -0.7]]) K.D(u + a * r, v + b * r, 0.075, 0.42, 0.02, 0.36, 0x4f8a3c);   /* 수련 잎(물 위 0.5cm — 물 윗면과 다른 높이) */
    K.col(u, v, r * 0.72, r * 0.72, 0.9); };
  const bin = (K, u, v, hex) => { K.B(u, v, 0, 0.62, 0.95, 0.55, hex, { top: hex }); K.D(u, v + 0.0, 0.95, 0.66, 0.06, 0.6, 0x2b2d31); };
  const bike = (K, u, v, hex) => { const g = 0, c9 = hex, W = (dv) => { const P9 = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * 6.2832; P9.push([u + 0.06, v + dv + Math.cos(t) * 0.31, g + 0.33 + Math.sin(t) * 0.31]); } for (let k = 0; k < 8; k++) K.rod(P9[k], P9[k + 1], 0.025, 0x2b2b2e); };
    W(-0.55); W(0.55); K.rod([u, v - 0.55, 0.33], [u, v - 0.15, 0.78], 0.03, c9); K.rod([u, v + 0.55, 0.33], [u, v + 0.42, 0.86], 0.03, c9); K.rod([u, v - 0.15, 0.78], [u, v + 0.42, 0.86], 0.03, c9); K.D(u, v - 0.2, 0.8, 0.14, 0.05, 0.26, 0x2b2b2e); };
  const thermo = (K, u, v) => { K.D(u, v, 0, 0.14, 1.5, 0.1, 0xf4f1ea); K.D(u, v + 0.06, 0.55, 0.06, 0.8, 0.03, 0xe0453a); K.C(u, v + 0.07, 0.42, 0.06, 0.14, 0xe0453a, 8); K.col(u, v, 0.1, 0.1, 1.5); };
  const BUILD = {
    rain(K, H) { const st = [];
      K.pad(0, 0.6, 15.6, 1.6, 0.075, 0xc9b79a); for (let i = -7; i <= 7; i += 1) K.D(i, 0.6, 0.085, 0.04, 0.012, 1.5, 0x9c8c74);   /* 투수 블록 길(틈 있는 블록 줄눈) */
      for (const [i, u] of [[0, -5.2], [1, -1.6], [2, 2.0]]) { K.B(u, -2.6, 0, 3.0, 0.36, 2.2, 0x8a6440, { top: 0x7a5236 }); K.D(u, -2.6, 0.36, 2.7, 0.04, 1.9, 0x5e4330);   /* 나무 틀 두둑 + 흙 */
        for (let a = -1.0; a <= 1.01; a += 0.5) for (const b of [-0.5, 0.5]) K.D(u + a, -2.6 + b, 0.4, 0.3, 0.22 + i * 0.05, 0.3, [0x8cc65a, 0x5f9a3f, 0x9bcf6a][i]);
        st.push([u, -2.6, 0.405, 2.66, 0.015, 1.86, 0x3f2c1f], [u - 0.6, -2.6, 0.42, 0.34, 0.5, 0.34, 0x4e9a43], [u + 0.6, -2.6, 0.42, 0.34, 0.46, 0.34, 0x58a64a]); }
      K.B(6.4, -3.6, 0, 2.6, 2.2, 2.0, 0xd8d2c4); { const [x, z] = K.Q(6.4, -3.6); A.gable(x, K.g(6.4, -3.6) + 2.2, z, 2.6, 2.0, 0.6, K.ry, 0x6b7480, { eave: 0.22 }); } K.D(6.4, -2.58, 0, 0.9, 1.8, 0.05, 0x6b4a32); K.col(6.4, -3.6, 1.3, 1.0, 2.6);   /* 창고 */
      K.C(6.2, -1.6, 0, 0.62, 1.35, 0x3d74c9, 12, { top: 0x2f5fa8 }); K.D(6.2, -1.6, 1.35, 0.5, 0.05, 0.5, 0x2b4f8a); K.rod([7.3, -2.5, 2.35], [6.4, -1.6, 1.55], 0.045, 0x8a8f95); K.rod([6.4, -1.6, 1.55], [6.4, -1.6, 1.38], 0.045, 0x8a8f95); K.D(5.55, -1.6, 0.25, 0.14, 0.1, 0.1, 0x9aa0a6); K.col(6.2, -1.6, 0.62, 0.62, 1.4);   /* 빗물 저금통 + 홈통 + 꼭지 */
      pond(K, -4.4, 3.1, 2.1);
      K.pad(4.6, 3.2, 4.6, 2.2, 0.06, 0xc8c3b8); [0x2f6fd0, 0xc99a10, 0x6f777d, 0x2f9a55].forEach((c9, i) => bin(K, 3.0 + i * 1.05, 3.0, c9)); for (const u of [2.3, 6.9]) K.D(u, 2.3, 0, 0.1, 1.9, 0.1, 0x8a8f95); K.B(4.6, 2.85, 1.9, 5.0, 0.1, 1.5, 0x6b7480, { top: 0x7a838c }); K.col(4.6, 3.0, 2.3, 0.4, 1.0);   /* 분리수거장(종이·플라스틱·캔·유리) */
      K.sign(1.0, 4.6, '분리수거장', { w: 1.5, h: 0.5, y: 0.95, bg: 0x2f8a5a, bgc: '#2f8a5a', fg: '#ffffff' }); bike(K, -0.2, 3.4, 0xd9473b); bike(K, 0.9, 3.4, 0x3d74c9);
      for (let i = 0; i < 12; i++) K.F(-7.6 + (i % 6) * 0.5, -5.3 + ((i / 6) | 0) * 0.5, i); K.T(-7.4, -0.8, 1.15); K.T(8.0, 2.6, 1.0);
      K.sign(-1.6, -4.7, '빗물 텃밭', { w: 1.6, h: 0.56, y: 0.95, bg: 0xf6f1e2, bgc: '#f6f1e2', fg: '#3b3226' });
      H.main = [4.2, 0.8]; H.after = st; },   /* KIDLOOK-2 기록판 E = 앞 투수 블록 길 위(저금통·창고 사이에선 걸어서 못 닿던 것) */
    temp(K, H) { const st = [];
      K.pad(0, 0, 15.4, 9.4, 0.05, 0xd2cbbe);
      for (const [u, v] of [[-6.6, -3.2], [-3.0, -3.2], [-6.6, -0.6], [-3.0, -0.6]]) { K.D(u, v, 0, 0.16, 2.5, 0.16, 0x8a5a32); K.col(u, v, 0.1, 0.1, 2.5); }
      for (let k = 0; k < 7; k++) K.D(-4.8, -3.4 + k * 0.48, 2.5, 4.0, 0.1, 0.1, 0x9b6a3c); for (let k = 0; k < 14; k++) K.D(-6.8 + (k % 7) * 0.62, -3.3 + ((k / 7) | 0) * 1.6 + (k % 2) * 0.4, 2.6 + (k % 3) * 0.03, 0.7, 0.24, 0.62, [0x3f8a3c, 0x4e9a43, 0x5aa54a][k % 3]);   /* 덩굴 시렁(위 잎) */
      K.B(-4.8, -4.2, 0, 4.4, 4.0, 0.3, 0xbdb8ae); for (let k = 0; k < 30; k++) K.D(-6.7 + (k % 6) * 0.75, -4.04 - (k % 2) * 0.02, 0.2 + ((k / 6) | 0) * 0.74, 0.62, 0.62, 0.05, [0x3f8a3c, 0x4e9a43, 0x467f3a][k % 3]);   /* 벽면 녹화 = 덩굴 벽 */
      K.col(-4.8, -4.2, 2.2, 0.18, 4.0);   /* KIDLOOK-2 덩굴 벽·맨 벽 4m(길에서 보이게) */
      K.B(4.2, -4.2, 0, 4.4, 4.0, 0.3, 0xbdb8ae, { top: 0xc8c3b8 }); K.col(4.2, -4.2, 2.2, 0.18, 4.0);   /* 맨 시멘트 벽(햇볕) */
      K.pad(1.0, 2.6, 4.0, 3.0, 0.085, 0x7fbb58); K.T(1.0, 1.8, 1.25);   /* 잔디 · 나무 그늘(GFX-1: 0.085 = 밑 마을 땅 판 윗면 0.07과 다른 높이 — 반짝임 X) */
      thermo(K, -4.8, -3.6); thermo(K, 4.2, -3.6); thermo(K, 1.6, 2.9);
      K.B(5.8, 2.4, 0, 0.1, 0.9, 0.1, 0x6b4a2f); K.B(5.8, 2.4, 0.9, 2.2, 1.3, 0.12, 0xf6f1e2, { top: 0x6b4a2f }); K.col(5.8, 2.4, 1.1, 0.1, 2.2);   /* 온도 기록판 */
      for (const [k, h, c9] of [[0, 0.32, 0x4e9a43], [1, 0.62, 0xe0453a], [2, 0.42, 0x3d74c9]]) st.push([5.2 + k * 0.6, 2.47, 1.15, 0.36, h, 0.02, c9]);
      K.sign(-0.6, 4.3, '덩굴 벽 온도 재기', { w: 2.2, h: 0.56, y: 0.95, bg: 0x2f8a5a, bgc: '#2f8a5a', fg: '#ffffff' }); for (let i = 0; i < 10; i++) K.F(-7.2 + i * 0.5, 4.2, i);
      H.posts = [{ id: 'vine', at: [-4.8, -2.9], lab: T2('🌡 온도계 읽기 — 덩굴 벽 앞', '🌡 Read the thermometer — green wall') }, { id: 'bare', at: [4.2, -2.9], lab: T2('🌡 온도계 읽기 — 맨 벽 앞', '🌡 Read the thermometer — bare wall') }, { id: 'tree', at: [1.6, 3.6], lab: T2('🌡 온도계 읽기 — 나무 그늘', '🌡 Read the thermometer — tree shade') }];
      H.main = [5.8, 3.4]; H.after = st; },
    obs(K, H) { const st = [];
      for (const [a, b] of [[-7.6, -5.6], [7.6, -5.6], [7.6, 5.4], [-7.6, 5.4]]) K.D(a, b, 0, 0.12, 0.8, 0.12, 0x8a5a32);
      for (const [a, b] of [[[-7.6, -5.6], [7.6, -5.6]], [[7.6, -5.6], [7.6, 5.4]], [[-7.6, -5.6], [-7.6, 5.4]], [[-7.6, 5.4], [-1.2, 5.4]], [[1.2, 5.4], [7.6, 5.4]]]) K.rod([a[0], a[1], 0.7], [b[0], b[1], 0.7], 0.025, 0xc9a66b);   /* 밧줄 울(길 쪽 드나드는 틈) */
      K.T(-4.6, -2.8, 1.7); K.D(-3.2, -2.8, 0, 0.12, 2.9, 0.12, 0x8a5a32); K.B(-3.2, -2.8, 2.9, 0.42, 0.5, 0.4, 0x9b6a3c, { top: 0x6b7480 }); K.D(-3.2, -2.58, 3.12, 0.12, 0.12, 0.02, 0x2b2420); K.col(-3.2, -2.8, 0.1, 0.1, 3.4);   /* 새집(기둥 위 — 떠 있지 않게) */
      K.D(2.6, -3.2, 0, 0.12, 0.7, 0.12, 0x6b4a2f); K.D(3.9, -3.2, 0, 0.12, 0.7, 0.12, 0x6b4a2f); K.B(3.25, -3.2, 0.7, 1.8, 1.5, 0.5, 0x9b6a3c); { const [x, z] = K.Q(3.25, -3.2); A.gable(x, K.g(3.25, -3.2) + 2.2, z, 1.8, 0.5, 0.35, K.ry, 0x6b4a2f, { eave: 0.12 }); }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const empty = r === 1 && c >= 2, u = 2.6 + c * 0.32, y = 0.86 + r * 0.34; K.D(u, -2.94, y, 0.26, 0.26, 0.02, empty ? 0x2b2420 : [0xc9a66b, 0x8a6440, 0xd9c79a][(r + c) % 3]); if (empty) st.push([u, -2.92, y + 0.03, 0.22, 0.2, 0.03, 0xd9c79a]); }   /* 곤충 호텔(대롱·솔방울·나무 칸) · 빈 칸 셋 */
      K.col(3.25, -3.2, 0.95, 0.3, 2.4);
      pond(K, -2.6, 2.4, 2.0); for (let i = 0; i < 18; i++) K.F(2.0 + (i % 6) * 0.55, 1.6 + ((i / 6) | 0) * 0.6, i);
      K.sign(4.6, 4.4, '생태 보호 구역', { w: 1.9, h: 0.56, y: 0.95, bg: 0x2f8a5a, bgc: '#2f8a5a', fg: '#ffffff' }); K.T(6.2, -1.0, 1.2); K.bush(-6.4, 0.6, 0.9); K.bush(6.4, 2.6, 0.8);
      H.posts = [{ id: 'nest', at: [-3.2, -1.6], lab: T2('🐦 새집 살펴보기', '🐦 Look at the nest box') }, { id: 'hotel', at: [3.25, -2.1], lab: T2('🐝 곤충 호텔 살펴보기', '🐝 Look at the bug hotel') }, { id: 'pond', at: [-2.6, 4.9], lab: T2('🐸 생태 연못 살펴보기', '🐸 Look at the wildlife pond') }];
      H.main = [4.6, 5.0]; H.after = st; },
    perm(K, H) { const st = [];
      K.pad(-3.6, -0.6, 5.0, 4.0, 0.06, 0x6f9a5a); for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) K.D(-6.0 + c * 0.7 + 0.05, -2.4 + r * 0.66, 0.06, 0.58, 0.07, 0.54, [0xc0b49e, 0xb5a991, 0xcbbfa8][(r + c) % 3]);   /* 투수 블록(틈에 풀) */
      K.pad(3.6, -0.6, 5.0, 4.0, 0.07, 0x4a4d52);   /* 아스팔트 판 */
      st.push([4.0, -0.2, 0.075, 2.6, 0.012, 1.8, 0x6fa8c8]);   /* 물 부은 뒤 아스팔트 웅덩이 */
      K.B(0, -0.6, 0, 1.0, 0.24, 4.4, 0xb9b2a4); K.D(0, 2.1, 0, 0.12, 1.1, 0.12, 0x6b4a2f);
      K.pad(0, 3.8, 8.0, 2.0, 0.04, 0x8a7a5a); for (let i = 0; i < 16; i++) K.D(-3.6 + i * 0.48, 3.8 + (i % 3 - 1) * 0.5, 0.04, 0.3, 0.12, 0.26, 0x9d978b, { ro: i });   /* 빗물 정원(자갈 고랑) */
      for (let i = 0; i < 8; i++) K.bush(-3.4 + i * 1.0, 4.6, 0.45, [0x86b85a, 0x6aa84c][i % 2]); for (let i = 0; i < 8; i++) K.F(-3.2 + i * 1.0, 3.0, i);
      K.C(0.6, 1.2, 0.24, 0.22, 0.34, 0x3d9a5a, 8); K.rod([0.6, 1.2, 0.5], [1.1, 1.2, 0.62], 0.03, 0x3d9a5a);   /* 물뿌리개(턱 위) */
      K.sign(0, -3.6, '빗물 스미는 길', { w: 1.9, h: 0.56, y: 0.95, bg: 0xf6f1e2, bgc: '#f6f1e2', fg: '#3b3226' }); K.T(-7.0, 2.6, 1.1); K.T(7.0, 2.6, 1.1);
      H.posts = [{ id: 'blk', at: [-3.6, 1.8], lab: T2('💧 물 부어 보기 — 투수 블록 길', '🚿 Pour water — permeable blocks') }, { id: 'asp', at: [3.6, 1.8], lab: T2('💧 물 부어 보기 — 아스팔트', '🚿 Pour water — asphalt') }];
      H.main = [0, -2.9]; H.after = st; },
    jang(K, H) { const st = [], st2 = [];
      K.B(0, -1.4, 0, 5.6, 0.45, 3.0, 0xa8a294, { top: 0xb4ae9f }); ring(K, 0, -1.4, 3.3, 16, 0x8f8a7e, 0.02, 0.5); K.col(0, -1.4, 2.8, 1.5, 0.45);
      const J = [[-2.0, -2.2, 0.48, 0.85], [-0.7, -2.2, 0.42, 0.75], [0.6, -2.2, 0.5, 0.9], [1.9, -2.2, 0.4, 0.7], [-1.4, -0.6, 0.34, 0.6], [0, -0.6, 0.36, 0.62], [1.4, -0.6, 0.3, 0.52]];
      for (const [u, v, r, h] of J) { K.C(u, v, 0.45, r * 0.8, h * 0.3, 0x5a3a26, 12); K.C(u, v, 0.45 + h * 0.3, r, h * 0.5, 0x6b4430, 12); K.C(u, v, 0.45 + h * 0.8, r * 0.78, h * 0.2, 0x5a3a26, 12, { top: 0x2b1d14 });
        st.push([u, v, 0.45 + h + 0.005, r * 1.75, 0.07, r * 1.75, 0x4a3020]); st2.push([u + r + 0.18, v + 0.05, 0.45, 0.07, r * 1.5, r * 1.5, 0x4a3020]); }   /* 뚜껑: 덮음(st) · 열어 옆에 세움(st2) */
      for (let i = 0; i < 18; i++) { const u = -6.6 + i * 0.78; K.D(u, -4.4, 0, 0.7, 0.55 + (i % 3) * 0.08, 0.55, [0x8f8a7e, 0x9e978a, 0x7f796f][i % 3], { ro: i * 0.4 }); K.D(u + 0.3, -4.4, 0.55, 0.62, 0.36, 0.5, [0x9e978a, 0x8f8a7e][i % 2], { ro: i }); } K.col(0, -4.4, 7.0, 0.35, 0.95);   /* 돌담 */
      for (const [i, u] of [[0, -5.0], [1, -3.4]]) { K.B(u, 2.4, 0, 1.2, 0.2, 3.4, 0x7a5a3a, { top: 0x6b4a30 }); for (let v = 1.0; v <= 3.81; v += 0.7) K.D(u, v, 0.2, 0.36, 0.26 + i * 0.1, 0.36, [0x8cc65a, 0x5f9a3f][i]); }   /* 텃밭 두 이랑 */
      { const u = 3.8, v = 2.6, red = 0xd9473b; K.B(u, v - 0.9, 0.35, 0.9, 0.6, 1.1, red, { top: 0xc0392b }); K.B(u, v + 0.7, 0.5, 1.4, 0.3, 1.8, 0x3d74c9); K.rod([u - 0.3, v - 1.3, 0.9], [u - 0.4, v - 2.6, 1.0], 0.03, 0x2b2b2e); K.rod([u + 0.3, v - 1.3, 0.9], [u + 0.4, v - 2.6, 1.0], 0.03, 0x2b2b2e);   /* 경운기(엔진 · 짐칸 · 손잡이) */
        for (const s9 of [-1, 1]) { const P9 = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * 6.2832; P9.push([u + s9 * 0.72, v + 0.7 + Math.cos(t) * 0.36, 0.38 + Math.sin(t) * 0.36]); } for (let k = 0; k < 8; k++) K.rod(P9[k], P9[k + 1], 0.06, 0x2b2b2e); } K.col(u, v, 0.8, 1.8, 1.0); }
      K.sign(-3.6, 0.6, '장독대', { w: 1.3, h: 0.5, y: 0.95, bg: 0xf6f1e2, bgc: '#f6f1e2', fg: '#3b3226' }); K.T(5.6, -3.0, 1.3, 'fruit'); for (let i = 0; i < 6; i++) K.F(-1.6 + i * 0.6, 0.6, i);
      H.main = [0, 0.7]; H.after = st; H.after2 = st2; },
    tree(K, H) { const st = [];
      const path = [[-8.4, 6.2], [-6.0, 4.2], [-3.4, 3.0], [-0.6, 1.0], [2.4, 0.2], [5.0, -1.6], [7.6, -3.4]]; path.forEach(([u, v], i) => K.pad(u, v, 2.6, 1.8, 0.05 + (i % 2) * 0.01, 0xc9b48a, i * 0.4 - 0.6));   /* 오솔길(흙) */
      const TR = [[-4.4, -2.6, 1.55], [1.0, -3.8, 2.05], [4.8, 2.6, 2.5]]; for (const [u, v, s9] of TR) { K.T(u, v, s9, 'pine'); K.col(u, v, 0.32 * s9 / 1.5, 0.32 * s9 / 1.5, 3); }
      for (const [u, v] of [[-1.6, 3.6], [-0.6, 4.2], [0.6, 3.8]]) { K.C(u, v, 0, 0.3, 0.45, 0x7a5232, 9, { top: 0xc9a66b }); K.col(u, v, 0.28, 0.28, 0.45); }   /* 통나무 의자 */
      K.C(-6.6, -0.4, 0, 0.42, 0.6, 0x6b4a2f, 10, { top: 0xc9a66b }); K.B(3.0, 4.4, 0.2, 2.2, 0.32, 0.36, 0x8a5a32, { ro: 0.4 }); for (const u of [2.2, 3.8]) K.C(u, 4.4 + (u - 3) * 0.42, 0, 0.16, 0.22, 0x6b4a2f, 7); K.col(3.0, 4.4, 1.1, 0.25, 0.52, 0.4);   /* 그루터기 · 통나무 걸상 */
      for (const [u, v] of [[-7.0, -4.8], [7.4, -5.6], [-7.6, 2.4], [7.6, 5.6], [-2.4, -5.8], [0, 6.0]]) K.T(u, v, 1.3, 'pine'); for (let i = 0; i < 6; i++) K.bush(-6 + i * 2.4, 6.6, 0.55);
      K.sign(-6.0, 5.6, '숲속 오솔길', { w: 1.6, h: 0.5, y: 0.95, bg: 0x6b4a2f, bgc: '#6b4a2f', fg: '#ffffff' });
      for (const [u, v, s9] of TR) { const r = 0.3 * s9 / 1.5 + 0.03; st.push([u, v, 1.3, r * 2, 0.12, r * 2, 0xe0453a]); }   /* 잰 나무에 빨간 띠 */
      H.posts = TR.map(([u, v], i) => ({ id: 't' + i, at: [u + 1.2, v + 0.8], lab: T2('🌲 팔 벌려 나무 둘레 재기 — ' + '가나다'[i] + ' 나무', '🌲 Hug the tree to measure it — tree ' + 'ABC'[i]) }));
      H.main = [-5.4, 5.0]; H.after = st; },
    wood(K, H) { const st = [];
      for (let i = 0; i < 15; i++) { const u = -6.2 + i * 0.86; K.D(u, -3.8, 0, 0.8, 0.6 + (i % 2) * 0.1, 0.62, [0x8f8a7e, 0x9e978a, 0x7f796f][i % 3], { ro: i * 0.5 }); K.D(u + 0.4, -3.8, 0.6, 0.72, 0.5, 0.56, 0x9e978a, { ro: i }); } K.col(0, -3.8, 6.4, 0.4, 1.1);   /* 돌축대(낮은 돌쌓기) */
      for (const [u, v] of [[-5.8, -2.6], [-2.2, -2.6], [-5.8, -0.6], [-2.2, -0.6]]) { K.B(u, v, 0, 0.18, 3.0, 0.18, 0x6b4a2f); K.col(u, v, 0.1, 0.1, 3.0); } K.B(-4.0, -1.6, 3.0, 4.2, 0.12, 2.6, 0x6b4a2f); { const [x, z] = K.Q(-4.0, -1.6); A.gable(x, K.g(-4.0, -1.6) + 3.12, z, 4.4, 2.8, 1.1, K.ry, 0x6b7480, { eave: 0.15, wall: 0x8a5a32 }); }   /* 처마(헛간 지붕 · KIDLOOK-2 3m + 박공 = 길에서 보이게) */
      for (let r = 0; r < 10; r++) for (let k = 0; k < 9; k++) K.D(-5.4 + k * 0.36, -2.45, 0.02 + r * 0.17, 0.16, 0.16, 0.3, [0xc89a62, 0xb8894f, 0xd4a872, 0x9b6a3c][(r * 3 + k) % 4]);   /* 늘 쌓여 있는 장작 벽(뒤 줄 1.7m) */
      for (const v of [-2.2, -1.0]) K.D(-4.0, v, 0, 3.4, 0.12, 0.14, 0x5e4330);   /* 받침목 */
      for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) st.push([-5.4 + k * 0.36, -1.6, 0.12 + r * 0.18, 0.16, 0.16, 1.0, [0xc89a62, 0xb8894f, 0xd4a872][(r + k) % 3]]);   /* 쌓은 장작 */
      const pile = (u, v) => { for (let k = 0; k < 9; k++) K.D(u + (k % 3 - 1) * 0.3 + (k % 2) * 0.05, v + ((k / 3) | 0) * 0.08, 0.02 + ((k / 3) | 0) * 0.15, 0.9, 0.16, 0.16, [0x9b6a3c, 0x8a5a32, 0xa87a48][k % 3], { ro: 0.6 + k * 0.3 }); K.col(u, v, 0.6, 0.6, 0.5); };
      pile(1.4, -0.4); pile(4.0, 0.2); K.C(2.6, 2.0, 0, 0.35, 0.5, 0x7a5232, 9, { top: 0xc9a66b });
      K.sign(0, 3.6, '장작 쌓는 곳', { w: 1.6, h: 0.5, y: 0.95, bg: 0x6b4a2f, bgc: '#6b4a2f', fg: '#ffffff' }); K.T(5.6, -2.8, 1.25, 'pine'); K.T(-6.6, 2.4, 1.1);
      H.posts = [{ id: 'p0', at: [1.4, 0.8], lab: T2('🪵 장작 두드려 보기 — 왼쪽 더미', '🪵 Knock on the woodpile — left') }, { id: 'p1', at: [4.0, 1.4], lab: T2('🪵 장작 두드려 보기 — 오른쪽 더미', '🪵 Knock on the woodpile — right') }];
      H.main = [0, 2.9]; H.after = st; },
    hole(K, H) { const st = [], st2 = [];
      K.B(0, -2.0, 0, 11.0, 3.0, 1.4, 0x9d978b, { top: 0x6f9a5a }); for (let r = 0; r < 6; r++) for (let c = 0; c < 11; c++) K.D(-5.0 + c + (r % 2) * 0.5, -1.29, 0.12 + r * 0.5, 0.9, 0.04, 0.02, 0x7f796f);   /* 축대 + 돌 줄 */
      K.col(0, -2.0, 5.5, 0.7, 3.0); for (const u of [-4.0, -1.2, 1.8, 4.4]) K.bush(u, -3.3, 0.7);   /* KIDLOOK-2 축대 3m */ K.T(-3.0, -3.6, 1.2, 'pine'); K.T(3.4, -3.8, 1.3);
      const HL = [-3.4, 0, 3.4]; HL.forEach((u, i) => { K.D(u, -1.18, 0.5, 0.22, 0.22, 0.26, 0x55595e); K.D(u, -1.04, 0.54, 0.14, 0.14, 0.02, 0x1f1d1b); st.push([u, -1.03, 0.47, 0.3, 0.26, 0.12, [0xa86a2c, 0x8a5a32][i % 2]]); st2.push([u, -1.08, 0.08, 0.1, 0.42, 0.02, 0x6fa8c8]); });   /* 물빠짐 구멍(관) · 낙엽 막힘(구멍마다 하나 — 그날 하나만 보임) · 졸졸 물 */
      K.pad(0, 0.4, 11.0, 1.2, 0.05, 0xb9b2a4); K.D(0, -0.2, 0.05, 11.0, 0.1, 0.24, 0x7f796f);   /* 배수 도랑 */
      K.sign(5.6, 1.8, '축대 물빠짐 구멍', { w: 1.9, h: 0.5, y: 0.95, bg: 0xf6f1e2, bgc: '#f6f1e2', fg: '#3b3226' });
      H.posts = HL.map((u, i) => ({ id: 'h' + i, at: [u, 0.2], lab: T2('🔦 물빠짐 구멍 들여다보기 — ' + (i + 1) + '번', '🔦 Look into drain hole ' + (i + 1)) }));
      H.main = [5.6, 2.5]; H.after = st; H.after2 = st2; H.holes = HL; },
    bus(K, H) { const st = [];
      K.pad(0, 1.0, 13.6, 4.0, 0.06, 0x8f9298); for (let i = 0; i < 5; i++) K.D(-6.0 + i * 3.0, 2.95, 0.06, 1.6, 0.012, 0.14, 0xf2c230);   /* 승하차 자리 + 노란 줄 */
      { const u = -1.6, v = 1.0, Y = 0xf2c230; K.B(u, v, 0.45, 7.0, 2.0, 2.3, Y, { top: 0xe8b820 }); K.D(u, v + 1.16, 1.3, 6.0, 0.7, 0.02, 0x2f3a46); K.D(u, v - 1.16, 1.3, 6.0, 0.7, 0.02, 0x2f3a46); K.D(u + 3.51, v, 1.3, 0.02, 0.7, 1.9, 0x2f3a46); K.D(u + 3.52, v, 0.6, 0.02, 0.3, 1.6, 0xd8d4ca);   /* 어린이 통학버스(노란 몸) */
        for (const a of [-2.3, 2.3]) for (const b of [-1.05, 1.05]) K.D(u + a, v + b, 0, 0.8, 0.8, 0.3, 0x2b2b2e); K.D(u + 3.52, v, 1.95, 0.02, 0.3, 1.0, 0xe0453a); K.col(u, v, 3.5, 1.15, 2.45); }
      K.B(4.8, -1.8, 0, 3.6, 0.1, 1.4, 0x9aa0a6); for (const [a, b] of [[3.2, -2.4], [6.4, -2.4]]) { K.D(a, b, 0.1, 0.1, 2.3, 0.1, 0x6b7480); } K.D(4.8, -2.47, 0.5, 3.2, 1.7, 0.03, 0x9fcbe0); K.B(4.8, -1.8, 2.4, 3.8, 0.1, 1.6, 0x6b7480, { top: 0x7a838c }); K.B(4.8, -2.0, 0.42, 2.6, 0.08, 0.5, 0x9b6a3c); K.col(4.8, -2.4, 1.8, 0.1, 2.4);   /* 정류장 지붕 · 유리 · 의자 */
      K.B(6.9, -1.0, 0, 0.1, 1.0, 0.1, 0x6b4a2f); K.B(6.9, -1.0, 1.0, 0.12, 1.2, 1.2, 0xf6f1e2, { top: 0x6b4a2f }); K.col(6.9, -1.0, 0.1, 0.6, 2.2);   /* 시간표 판 */
      st.push([6.98, -1.0, 1.55, 0.02, 0.16, 1.0, 0x9be36b]);
      K.sign(2.6, -2.9, '학원 버스 정류장', { w: 2.0, h: 0.5, y: 2.2, bg: 0x1f4e9a, bgc: '#1f4e9a', fg: '#ffffff' });
      H.main = [6.9, 0.0]; H.after = st; },
    alley(K, H) { const st = [];
      K.pad(0, 0, 13.6, 11.4, 0.05, 0xb8ab96); for (let r = 0; r < 7; r++) K.D(0, -4.8 + r * 1.6, 0.05, 13.4, 0.012, 0.05, 0x9a8c76); for (let c = 0; c < 9; c++) K.D(-6.0 + c * 1.5, 0, 0.062, 0.05, 0.012, 11.2, 0x9a8c76);   /* 돌길 광장 */
      { const [x, z] = K.Q(0, 0); A.fountain(x, z); }
      for (const [u, v] of [[-4.6, -4.0], [4.6, -4.0], [-4.6, 4.0], [4.6, 4.0]]) { K.B(u, v, 0, 1.4, 0.55, 0.7, 0xc8b89a, { top: 0x8a6440 }); for (let k = 0; k < 4; k++) K.F(u - 0.5 + k * 0.33, v, k); K.col(u, v, 0.7, 0.35, 0.55); st.push([u, v, 0.56, 1.2, 0.3, 0.5, 0xe85a8a]); }   /* 꽃 화분 넷(물 주면 꽃이 가득) */
      for (const [u, v] of [[-6.2, 0], [6.2, 0]]) { K.D(u, v, 0, 0.12, 3.2, 0.12, 0x2b2b2e); K.D(u, v, 3.2, 0.36, 0.36, 0.36, 0xf2e6c0); K.D(u, v, 3.56, 0.42, 0.06, 0.42, 0x2b2b2e); K.col(u, v, 0.1, 0.1, 3.2); }   /* 옛 가로등 */
      for (const u of [-2.0, 2.0]) { const [x, z] = K.Q(u, -5.0); A.bench2(x, z, K.ry); }
      K.sign(0, 5.4, '분수 광장', { w: 1.5, h: 0.5, y: 0.95, bg: 0x6b4a2f, bgc: '#6b4a2f', fg: '#ffffff' });
      /* KIDLOOK-2 광장 뒤 골목에 벽을 맞대고 선 반목조 집 셋(2cm 틈 · 높이 달리 · 앞면 = 짙은 나무 뼈대 + 빗대 + 창 · 문) */
      [[0xf2e6cc, 5.6, 2.3, 0xa0442e], [0xf3e1d6, 6.8, 2.6, 0x8f3b28], [0xf1e9c8, 5.0, 2.1, 0xa8502f]].forEach(([wc, wh, rh, rc], i) => { const u = (i - 1) * 4.42, v0 = -8.0, fv = v0 + 1.8, TB = 0x5a3a24;
        K.B(u, v0, 0, 4.4, wh, 3.6, wc, { top: wc }); { const [x, z] = K.Q(u, v0); A.gable(x, K.g(u, v0) + wh, z, 4.4, 3.6, rh, K.ry, rc, { eave: 0.2, wall: wc }); } K.col(u, v0, 2.2, 1.8, wh);
        for (const pu of [-2.06, -0.75, 0.75, 2.06]) K.D(u + pu, fv + 0.06, 0.05, 0.18, wh - 0.1, 0.1, TB);
        for (const y of [wh * 0.5 - 0.08, wh - 0.2]) K.D(u, fv + 0.04, y, 4.06, 0.16, 0.08, TB);
        for (const sg of [-1, 1]) K.rod([u + sg * 2.0, fv + 0.07, wh * 0.5 + 0.12], [u + sg * 0.82, fv + 0.07, wh - 0.26], 0.05, TB);
        K.D(u, fv + 0.015, wh * 0.5 + 0.45, 0.8, 1.0, 0.03, 0x3a4a5a); K.D(u, fv + 0.015, 0.0, 0.9, 2.0, 0.03, 0x6b4430); K.D(u, fv + 0.17, wh * 0.5 + 0.36, 1.0, 0.09, 0.3, 0xc8b89a); for (let k = 0; k < 2; k++) K.F(u + 1.15 + k * 0.4, fv + 0.35, k + i); });
      H.main = [0, 2.6]; H.after = st; H.alley = true; },
  };
  // 골목 간판(유럽 옛 마을 · 기둥 + 쇠 팔 + 매단 판) — 동네 안 다른 자리 셋
  const SIGNS = [T2('빵', 'Bread'), T2('열쇠', 'Keys'), T2('꽃', 'Flowers')];
  function hangSign(x, z, ry, t) { const g = A.ty(x, z), c = Math.cos(ry), s = Math.sin(ry); A.dbx(x, g, z, 0.14, 2.9, 0.14, ry, 0x2b2b2e); A.dbx(x + s * 0.4, g + 2.7, z + c * 0.4, 0.06, 0.06, 0.9, ry, 0x2b2b2e); A.dbx(x + s * 0.55, g + 2.1, z + c * 0.55, 0.05, 0.6, 0.62, ry, 0x7a5232);
    A.text(t, x + s * 0.55 + c * 0.04, g + 2.4, z + c * 0.55 - s * 0.04, ry + Math.PI / 2, 0.55, 0.4, { bgc: '#7a5232', fg: '#f6efe2' }); A.text(t, x + s * 0.55 - c * 0.04, g + 2.4, z + c * 0.55 + s * 0.04, ry - Math.PI / 2, 0.55, 0.4, { bgc: '#7a5232', fg: '#f6efe2' }); A.pcol(A.col9(x, z, 0.1, 0.1, ry, g - 1, g + 2.9)); }
  // 박공지붕 태양광(자연친화 동네 · 남쪽 비탈) — 지붕 면에서 6cm 띄운 판 + 테 줄(합친 면 · 같은 평면 X)
  function roofSolar(gr) { const { cx, cz, y, w, d, h, ry } = gr, B = A.bucket(cx, cz), c = Math.cos(ry), s = Math.sin(ry), e = 0.45, alongX = w >= d, P = (lx, ly, lz) => [cx + lx * c + lz * s, y + ly, cz - lx * s + lz * c];
    const half = alongX ? d / 2 + e : w / 2 + e, len = alongX ? w / 2 : d / 2, sg0 = alongX ? (c > 0 ? 1 : -1) * (Math.abs(c) > 0.2 ? 1 : (s > 0 ? -1 : 1)) : 0;
    let best = 1, bz = -1e9; for (const sg of [1, -1]) { const p = alongX ? P(0, 0, sg * half) : P(sg * half, 0, 0), wz = p[2] - cz; if (wz > bz) { bz = wz; best = sg; } } void sg0;   /* 남쪽(세계 +z)을 보는 비탈 */
    const n = alongX ? [0, half, best * h] : [best * h, half, 0], L = Math.hypot(...n), off = 0.06 / L;
    const at = (a, t, o9 = 1) => { const lx = alongX ? a : best * half * (1 - t), lz = alongX ? best * half * (1 - t) : a, ly = h * t; const p = P(lx + (alongX ? 0 : n[0] * off * o9), ly + n[1] * off * o9, lz + (alongX ? n[2] * off * o9 : 0)); return p; };
    const quadS = (a0, a1, t0, t1, col, o9) => { const p00 = at(a0, t0, o9), p10 = at(a1, t0, o9), p11 = at(a1, t1, o9), p01 = at(a0, t1, o9); if (alongX ? best > 0 : best < 0) A.quad(B, p00, p10, p11, p01, col); else A.quad(B, p10, p00, p01, p11, col); };
    const a0 = -len * 0.7, a1 = len * 0.7, n9 = Math.max(2, Math.round((a1 - a0) / 1.1)); quadS(a0, a1, 0.18, 0.72, A.rgb(0x2a3f66), 1);
    for (let k = 0; k <= n9; k++) { const a = a0 + (a1 - a0) * k / n9; quadS(a - 0.03, a + 0.03, 0.18, 0.72, A.rgb(0xb8c2cc), 1.6); } quadS(a0, a1, 0.44, 0.465, A.rgb(0xb8c2cc), 1.6); }
  // KIDLOOK-2 들머리 표지(표지석 바로 곁 · 동네 쪽 7~16m · 옆으로 2.5~8.5m) — 돌 앞에서 동네 쪽을 보면 돌 옆에 크게 보이는 것 하나(실제 그런 동네에 있는 것)
  const HERO = {
    rain: { w: 4.6, d: 3.4, f(K, ts) { const pu = -ts[1], pv = ts[0];   /* 날개 판 = 표지석 쪽을 봄(pu·pv = 그 판 안 옆 방향) */
      { const u = 1.8, v = -0.8, hy = 3.7, hv = v + 0.75; K.C(u, v, 0, 0.15, 3.6, 0xe8e8e6, 10); K.C(u, v, 0, 0.4, 0.25, 0xb9b2a4, 10); K.D(u, v, 3.45, 0.5, 0.44, 0.5, 0xeeeeec); void hv;   /* KIDLOOK-2 소형 풍력 발전기(9m · 날개 셋 · 멈춘 모양) */
        { const cu = u + ts[0] * 0.38, cv = v + ts[1] * 0.38; K.D(cu, cv, hy - 0.15, 0.3, 0.3, 0.3, 0xd8d8d6); for (const a9 of [1.5708, 3.665, 5.76]) K.rod([cu, cv, hy], [cu + pu * Math.cos(a9) * 1.4, cv + pv * Math.cos(a9) * 1.4, hy + Math.sin(a9) * 1.4], 0.08, 0xf6f6f4); } K.col(u, v, 0.25, 0.25, 3.6); }
      K.C(-0.2, -0.8, 0, 0.75, 1.8, 0x3d74c9, 12, { top: 0x2f5fa8 }); K.D(-0.2, -0.8, 1.8, 0.62, 0.05, 0.62, 0x2b4f8a); K.col(-0.2, -0.8, 0.75, 0.75, 1.85);
      for (const [u, c9] of [[1.1, 0x5f9a3f], [-0.85, 0x8cc65a]]) { K.B(u, 0.9, 0, 1.6, 0.42, 0.9, 0x8a6440, { top: 0x5e4330 }); for (let k = 0; k < 4; k++) K.D(u - 0.55 + k * 0.37, 0.9 + (k % 2 ? 0.14 : -0.14), 0.42, 0.3, 0.34 + (k % 2) * 0.1, 0.3, c9); K.col(u, 0.9, 0.8, 0.45, 0.45); }   /* 텃밭 상자 둘(빗물로 키움) */
      for (const [u, c9] of [[-1.8, 0x8a5a32]]) { K.B(u, -0.8, 0, 0.72, 0.9, 0.72, c9); for (let k = 0; k < 3; k++) K.D(u, -0.8 + 0.37, 0.15 + k * 0.28, 0.66, 0.05, 0.02, 0x5e4330); } K.col(-1.8, -0.8, 0.36, 0.36, 0.9); } },   /* 소형 풍력 발전기(3.6m · 날개 셋 · 멈춘 모양) + 큰 빗물 저금통 + 텃밭 상자 둘 + 나무 퇴비함 */
    temp: { w: 4.4, d: 2, f(K) { const BR = 0x6b4a2f; for (const u of [-1.5, 1.5]) { K.D(u, 0, 0, 0.18, 3.0, 0.18, BR); K.col(u, 0, 0.12, 0.12, 3.0); } K.D(0, 0, 3.0, 3.4, 0.16, 0.5, BR);   /* 덩굴 아치 문(기둥 둘 + 보 · 잎 덩이가 덮음) */
      const LC = [0x3f8a3c, 0x4e9a43, 0x5aa54a]; for (let i = 0; i < 6; i++) { K.D(-1.5 + (i % 2 ? 0.13 : -0.11), [-0.1, 0.05, 0.12][i % 3], 0.25 + i * 0.47, 0.55, 0.58, 0.6, LC[i % 3]); K.D(1.5 + (i % 2 ? -0.12 : 0.1), [0.09, -0.06, -0.13][i % 3], 0.27 + i * 0.47, 0.54, 0.57, 0.61, LC[(i + 1) % 3]); }
      for (let j = 0; j < 5; j++) K.D(-1.2 + j * 0.62, [0.04, -0.07][j % 2], 3.05 + (j % 2) * 0.07, 0.6, 0.42, 0.66, LC[j % 3]); } },
    obs: { w: 3, d: 4, f(K) {
      { const u = 0, v = -0.5, BR = 0x7a5232; for (const a of [-1.1, 1.1]) for (const b of [-1.1, 1.1]) K.B(u + a, v + b, 0, 0.2, 3.3, 0.2, BR); K.B(u, v, 3.2, 2.6, 0.15, 2.6, 0x9b6a3c, { top: 0x8a5a32 });   /* KIDLOOK-2 탐조대(새 보는 나무 망루 · 발판 3.35m · 난간 · 지붕) */
        for (const a of [-1.08, 1.08]) for (const b of [-1.08, 1.08]) K.D(u + a, v + b, 3.35, 0.14, 1.85, 0.14, BR); for (const [a, b, lu, lv] of [[0, -1.08, 2.02, 0.06], [0, 1.08, 2.02, 0.06], [-1.08, 0, 0.06, 2.02], [1.08, 0, 0.06, 2.02]]) K.D(u + a, v + b, 4.2, lu, 0.08, lv, BR);
        { const [x, z] = K.Q(u, v); A.gable(x, K.g(u, v) + 5.2, z, 2.6, 2.6, 1.0, K.ry, 0x6b4a2f, { eave: 0.2, wall: 0x9b6a3c }); } for (const a of [-0.32, 0.32]) K.rod([u + a, v + 2.3, 0], [u + a, v + 1.32, 3.3], 0.04, BR); for (let k = 1; k < 8; k++) K.rod([u - 0.32, v + 2.3 - k * 0.122, k * 0.41], [u + 0.32, v + 2.3 - k * 0.122, k * 0.41], 0.03, BR); K.col(u, v, 1.3, 1.3, 5.4); }
    } },
    perm: { w: 3.2, d: 2.4, f(K) { const PG = 0x8a8f95; for (const a of [-1.3, 1.3]) { K.B(a, 0.9, 0, 0.15, 2.4, 0.15, PG); K.B(a, -0.9, 0, 0.15, 3.25, 0.15, PG); }   /* 태양광 그늘 쉼터(판이 길 쪽으로 기울어 앞에서 보임 · 걸상) */
      const B9 = A.bucket(...K.Q(0, 0)), P = (u, v, y) => { const [x, z] = K.Q(u, v); return [x, K.g(0, 0) + y, z]; }, up = (a, b, c, d, hex) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; if (uz * vx - ux * vz > 0) A.quad(B9, a, b, c, d, A.rgb(hex)); else A.quad(B9, b, a, d, c, A.rgb(hex)); };
      const pt = (u, t, o) => P(u, 1.05 - t * 2.1, 2.34 + t * 1.0 + o);
      up(pt(-1.5, 0, 0), pt(1.5, 0, 0), pt(1.5, 1, 0), pt(-1.5, 1, 0), 0x2a3f66); for (let k = -2; k <= 2; k++) up(pt(k * 0.6 - 0.03, 0, 0.02), pt(k * 0.6 + 0.03, 0, 0.02), pt(k * 0.6 + 0.03, 1, 0.02), pt(k * 0.6 - 0.03, 1, 0.02), 0xb8c2cc); up(pt(-1.5, 0.48, 0.02), pt(1.5, 0.48, 0.02), pt(1.5, 0.52, 0.02), pt(-1.5, 0.52, 0.02), 0xb8c2cc);
      K.B(0, 0, 0.4, 2.0, 0.08, 0.5, 0x9b6a3c); for (const a of [-0.8, 0.8]) K.D(a, 0, 0, 0.12, 0.4, 0.4, 0x6b4a2f); K.col(0, 0, 1.4, 1.0, 3.3); } },
    wood: { w: 3.6, d: 2.6, f(K) { const BR = 0x6b4a2f; for (const a of [-1.6, 1.6]) for (const b of [-1.1, 1.1]) { K.D(a, b, 0, 0.16, 2.6, 0.16, BR); } K.B(0, 0, 2.6, 3.6, 0.12, 2.6, BR); { const [x, z] = K.Q(0, 0); A.gable(x, K.g(0, 0) + 2.72, z, 3.8, 2.8, 1.0, K.ry, 0x6b7480, { eave: 0.12, wall: 0x8a5a32 }); }   /* 장작 헛간(박공 · 장작 가득) */
      for (let r = 0; r < 11; r++) for (let k = 0; k < 8; k++) K.D(-1.26 + k * 0.36, -0.5, 0.02 + r * 0.17, 0.16, 0.16, 1.6, [0xc89a62, 0xb8894f, 0xd4a872, 0x9b6a3c][(r * 3 + k) % 4]); K.col(0, -0.3, 1.6, 1.0, 2.6); } },
    hole: { w: 2.6, d: 6.4, f(K) { for (let i = 0; i < 8; i++) { const v = 2.6 - i * 0.72; K.B(0, v, -0.3, 1.6 + (i % 2) * 0.03, 0.48 + (i % 2) * 0.01, 0.74, [0xa8a294, 0x9d978b][i % 2], { top: 0xb4ae9f }); }   /* 비탈 돌계단(땅을 따라 한 단씩 · 단 윗면 = 땅 위 18cm) + 나무 난간 + 돌 축대 끝 */
      for (const s9 of [-1, 1]) { K.rod([s9 * 0.98, 2.9, 0.95], [s9 * 0.98, -2.6, 0.95], 0.04, 0x6b4a2f); for (const v of [2.9, 0.15, -2.6]) K.D(s9 * 0.98, v, 0, 0.1, 0.95, 0.1, 0x6b4a2f); }
      for (let r = 0; r < 3; r++) K.D(-1.2 - (r % 2) * 0.03, -2.4 + r * 0.02, r * 0.42, 0.24, 0.4, 1.4 - r * 0.2, [0x8f8a7e, 0x9e978a, 0x7f796f][r]); } },
  };
  function hero(g, k, hill) { const H9 = HERO[k]; if (!H9 || g.sx == null) return null; const lx = g.lx ?? g.cx, lz = g.lz ?? g.cz, L9 = Math.hypot(lx - g.sx, lz - g.sz) || 1, fx = (lx - g.sx) / L9, fz = (lz - g.sz) / L9;
    for (const dd of [7, 10, 13, 16]) for (const lat of [4.5, -4.5, 6.5, -6.5, 2.5, -2.5, 8.5, -8.5]) { const tx9 = g.sx + fx * dd - fz * lat, tz9 = g.sz + fz * dd + fx * lat, q = A.spot(tx9, tz9, H9.w, H9.d, hill ? 2.0 : 0.8, 4, true); if (!q) continue;
      const qx = q.x - g.sx, qz = q.z - g.sz, qd = Math.hypot(qx, qz); if (qd > 19 || (qx * fx + qz * fz) / (qd || 1) < 0.45) continue; const K = kitK(q); A.occ(q.x - H9.w / 2 - 0.5, q.z - H9.w / 2 - 0.5, q.x + H9.w / 2 + 0.5, q.z + H9.w / 2 + 0.5); A.clear(q.x, q.z, Math.max(H9.w, H9.d) / 2 + 0.6); const ts9 = [-(qx) * Math.cos(q.ry) + (qz) * Math.sin(q.ry), -(qx) * Math.sin(q.ry) - (qz) * Math.cos(q.ry)], tl = Math.hypot(ts9[0], ts9[1]) || 1; H9.f(K, [ts9[0] / tl, ts9[1] / tl]); return { x: q.x, z: q.z, d: qd }; }
    return null; }
  // KIDLOOK-3 자연친화 들머리 채우기(사용자 10-27 '들머리가 아직 풀밭이 대부분') — 표지석에서 동네 쪽(= 빗물 텃밭 묶음 쪽)을 볼 때 보이는 빈 잔디(9~34m · 앞 ±40°)에 작은 것 여럿
  //   실제 친환경 동네에 있는 것만: 태양광 그늘 정자 · 공동 텃밭 줄(이웃이 한 두둑씩) · 자전거 거치대 · 꽃길 · 빗물 통 + 퇴비함 · 어린 나무 — 합친 상자(청크 병합) · 새 메시·Light 0 · 매 프레임 일 0
  const bedRow = (K, R9) => { const CR = [[0x8cc65a, 0x6fae48], [0x5f9a3f, 0xd9473b], [0x9bcf6a, 0x7fb850], [0x4e9a43, 0xe2b13c]];
    for (const v of [-0.75, 0.75]) { const c9 = CR[(R9() * 4) | 0]; K.B(0, v, 0, 6.2, 0.36, 1.1, 0x8a6440, { top: 0x7a5236 }); K.D(0, v, 0.36, 5.9, 0.04, 0.85, 0x5e4330);
      for (let i = 0; i < 9; i++) K.D(-2.6 + i * 0.65, v + (i % 2 ? 0.16 : -0.16), 0.4, 0.34, 0.2 + (i % 3) * 0.06, 0.34, c9[i % 2 && R9() < 0.4 ? 1 : 0]); K.col(0, v, 3.1, 0.55, 0.4); }
    for (const u of [-3.25, 3.25]) K.D(u, -0.75, 0, 0.08, 0.9, 0.08, 0x8a5a32); K.D(-3.25, -0.75, 0.9, 0.05, 0.3, 0.42, 0xf6f1e2); };   /* 두둑 둘(나무 틀 + 흙 + 작물) + 이름 말뚝(빈 팻말) */
  const FILLK = [
    ['pav', 3.4, 2.8, K => HERO.perm.f(K)],
    ['bed', 7.0, 3.2, (K, R9) => bedRow(K, R9)],
    ['rack', 4.4, 2.0, K => { K.B(0, -0.35, 0, 4.0, 0.12, 0.12, 0x8a8f95); for (let i = 0; i < 4; i++) { const u = -1.5 + i; K.rod([u - 0.3, -0.35, 0.12], [u - 0.3, -0.35, 0.7], 0.03, 0x8a8f95); K.rod([u + 0.3, -0.35, 0.12], [u + 0.3, -0.35, 0.7], 0.03, 0x8a8f95); K.rod([u - 0.3, -0.35, 0.7], [u + 0.3, -0.35, 0.7], 0.03, 0x8a8f95); }
      [[-1.5, 0x2f9a55], [-0.5, 0xe2b13c], [1.5, 0xd9473b]].forEach(([u, c9]) => bike(K, u, 0.25, c9)); K.col(0, -0.35, 2.0, 0.1, 0.75); }],   /* 자전거 거치대(ㄷ자 넷) + 자전거 셋 */
    ['flw', 8.4, 1.6, (K, R9) => { K.pad(0, 0, 8.2, 0.7, 0.065, 0xc9b79a); for (const v of [-0.62, 0.62]) for (let i = 0; i < 11; i++) K.F(-3.8 + i * 0.76 + (R9() - 0.5) * 0.2, v, (i + (v > 0 ? 2 : 0)) | 0); }],   /* 꽃길(흙길 양옆 꽃) */
    ['bed', 7.0, 3.2, (K, R9) => bedRow(K, R9)],
    ['bin', 3.0, 2.0, K => { K.C(-0.7, 0, 0, 0.5, 1.1, 0x3d74c9, 12, { top: 0x2f5fa8 }); K.D(-0.7, 0, 1.1, 0.42, 0.05, 0.42, 0x2b4f8a); K.col(-0.7, 0, 0.5, 0.5, 1.15);
      K.B(0.75, 0, 0, 1.0, 0.8, 0.9, 0x8a5a32); for (let k = 0; k < 3; k++) K.D(0.75, 0.47, 0.12 + k * 0.25, 0.94, 0.05, 0.02, 0x5e4330); K.col(0.75, 0, 0.5, 0.45, 0.8); K.T(0.2, -1.6, 0.8); }],   /* 빗물 통 + 퇴비함 + 어린 나무 */
    ['flw', 8.4, 1.6, (K, R9) => { K.pad(0, 0, 8.2, 0.7, 0.065, 0xc9b79a); for (const v of [-0.62, 0.62]) for (let i = 0; i < 11; i++) K.F(-3.8 + i * 0.76 + (R9() - 0.5) * 0.2, v, (i * 3 + (v > 0 ? 1 : 0)) | 0); }],
    ['tree', 8.0, 2.4, K => { for (const u of [-2.8, 0, 2.8]) { K.T(u, 0, 0.62); for (const a of [-0.45, 0.45]) K.D(u + a, 0.0, 0, 0.07, 1.3, 0.07, 0x9b6a3c); K.D(u, 0.0, 1.1, 1.0, 0.05, 0.05, 0x9b6a3c); for (let k = 0; k < 6; k++) K.F(u - 0.9 + (k % 3) * 0.9, (k < 3 ? -0.8 : 0.8), k + 3 + Math.round(u)); } }],   /* 어린 나무 셋(받침대) + 둘레 꽃 — 마을이 함께 심은 나무 줄 */
    ['bed', 7.0, 3.2, (K, R9) => bedRow(K, R9)],
    ['pav', 3.4, 2.8, K => HERO.perm.f(K)],
  ];
  function ecoFill(g, sp) { if (g.sx == null) return []; const lx = sp ? sp.x : g.lx ?? g.cx, lz = sp ? sp.z : g.lz ?? g.cz, L9 = Math.hypot(lx - g.sx, lz - g.sz) || 1, fx = (lx - g.sx) / L9, fz = (lz - g.sz) / L9, out = [], R9 = rngOf('eco:' + g.id);
    const vx = g.sx - fx * 7, vz = g.sz - fz * 7;   /* 보는 자리 = 표지석에서 7m 물러난 곳(돌을 읽고 동네 쪽을 보는 눈) — 그 눈의 시야(±34°) 안을 채움 */
    for (const [nm, w, d, f] of FILLK) { let best = null;
      for (const dd of [9, 12, 15, 18, 21, 25, 29, 33, 37]) { for (const an of [0, 0.2, -0.2, 0.4, -0.4, 0.55, -0.55]) { const c9 = Math.cos(an), s9 = Math.sin(an), tx9 = vx + (fx * c9 - fz * s9) * dd, tz9 = vz + (fx * s9 + fz * c9) * dd, q = A.spot(tx9, tz9, w, d, 0.6, 3, false, true); if (!q) continue;
        const qx = q.x - vx, qz = q.z - vz, qv = Math.hypot(qx, qz), qa = Math.acos(Math.max(-1, Math.min(1, (qx * fx + qz * fz) / (qv || 1)))), qd = Math.hypot(q.x - g.sx, q.z - g.sz), r9 = Math.max(w, d) / 2; if (qd > 36 || qv < 7 || qa > 0.6) continue;
        if (out.some(o => Math.hypot(o.x - q.x, o.z - q.z) < o.r + r9 + 0.8) || (A.nearSchool && A.nearSchool(q.x, q.z, r9 + 6))) continue; best = { ...q, r: r9 }; break; } if (best) break; }
      if (!best) continue; const K = kitK(best), r9 = best.r; A.occ(best.x - r9, best.z - r9, best.x + r9, best.z + r9); A.clear(best.x, best.z, r9 + 0.3); f(K, R9); out.push({ k: nm, x: best.x, z: best.z, r: r9, d: +Math.hypot(best.x - g.sx, best.z - g.sz).toFixed(1) }); }
    return out; }
  // ───────── 짓기(town.js가 구역 표지석 뒤에 한 번) ─────────
  function build(list) { KL.length = 0; HOT.length = 0; STM.length = 0; if (!A.on()) return;
    const G = A.groups();
    for (const it of list || []) { const k = it.k, def = KITS[k], b = BUILD[k]; if (!def || !b) continue; const g = G.find(q => q.cells.includes(it.cell)); if (!g || KL.some(q => q.g === g.id)) continue;
      const tg = it.mid && A.cellXZ(it.cell) ? [A.cellXZ(it.cell), [g.sx, g.sz]] : [[g.sx, g.sz], [g.cx, g.cz]], hill = k === 'tree' || k === 'wood' || k === 'hole'; let sp = null;   /* 표지석 곁에서 가장 가까운 자리(크기 셋 · 산 동네는 비탈 허용 · KIDLOOK-2 학교 울 곁 X — 울과 큰길 사이에 갇혀 못 들어가던 것) */
      if (g.sx != null) { const lx = g.lx ?? g.cx, lz = g.lz ?? g.cz, L9 = Math.hypot(lx - g.sx, lz - g.sz) || 1, fx = (lx - g.sx) / L9, fz = (lz - g.sz) / L9;   /* 앞 = 표지석 → 지도 글씨 자리(그 동네 이름 칸들 가운데) */   /* KIDLOOK-2 들머리 앞: 표지석에서 동네 쪽을 볼 때 보이는 자리(36m 안 · 앞 ±40°) 먼저 */
        for (const dd of [14, 20, 26, 32]) for (const an of [0, 0.3, -0.3, 0.55, -0.55, 0.75, -0.75]) { const c9 = Math.cos(an), s9 = Math.sin(an), tx9 = g.sx + (fx * c9 - fz * s9) * dd, tz9 = g.sz + (fx * s9 + fz * c9) * dd;
          for (const tol of hill ? [0.6, 1.2, 2.0] : [0.6]) { let q = null; for (const f of [1, 0.85, 0.72]) { q = A.spot(tx9, tz9, def.w * f, def.d * f, tol, 9, k === 'tree' || k === 'alley'); if (q) break; } if (!q) continue;
            const qx = q.x - g.sx, qz = q.z - g.sz, qd = Math.hypot(qx, qz), qa = Math.acos(Math.max(-1, Math.min(1, (qx * fx + qz * fz) / (qd || 1)))), sc = qd + qa * 30; if (qd <= 36 && qa < 0.8 && !(A.nearSchool && A.nearSchool(q.x, q.z, Math.max(def.w, def.d) / 2 + 8)) && (!sp || sc < sp.sc)) sp = { ...q, sc, dd: qd }; break; } } }
      if (!sp) for (const [tx9, tz9] of tg) { if (tx9 == null) continue; for (const tol of hill ? [0.6, 1.2, 2.0] : [0.6]) { for (const f of [1, 0.85, 0.72]) { const q = A.spot(tx9, tz9, def.w * f, def.d * f, tol); if (q && !(A.nearSchool && A.nearSchool(q.x, q.z, Math.max(def.w, def.d) / 2 + 8)) && (!sp || Math.hypot(q.x - tx9, q.z - tz9) < sp.dd - 6)) sp = { ...q, dd: Math.hypot(q.x - tx9, q.z - tz9) }; } if (sp) break; } if (sp) break; } if (!sp) continue;
      const K = kitK(sp), H = {}, half = Math.max(def.w, def.d) / 2; A.occ(sp.x - half, sp.z - half, sp.x + half, sp.z + half); A.clear(sp.x, sp.z, half); b(K, H);
      const E = { g: g.id, t: g.t, k, cell: it.cell, x: sp.x, z: sp.z, ry: sp.ry, Q: sp.Q, d: g.sx != null ? Math.hypot(sp.x - g.sx, sp.z - g.sz) : 0, n: 0, posts: [], H };
      if (H.holes) { E.hs = H.after.map(p => stateMesh(K, [p])).filter(Boolean); E.ws = H.after2.map(p => stateMesh(K, [p])).filter(Boolean); E.st = E.st2 = null; } else { E.st = H.after ? stateMesh(K, H.after) : null; E.st2 = H.after2 ? stateMesh(K, H.after2) : null; }
      if (H.alley) { const R9 = rngOf('alley:' + g.id), cs = g.cells.slice(), out = []; for (let i = 0; i < 40 && out.length < 3; i++) { const c9 = cs[i % cs.length], ctr = A.cellXZ(c9); if (!ctr) continue; const tx9 = ctr[0] + (R9() - 0.5) * 90, tz9 = ctr[1] + (R9() - 0.5) * 90, q = A.spot(tx9, tz9, 2.4, 2.4); if (!q) continue; const dd = Math.hypot(q.x - sp.x, q.z - sp.z); if (dd < 18 || dd > 120 || out.some(o => Math.hypot(o.x - q.x, o.z - q.z) < 18) || A.hoodAt(q.x, q.z) !== g.id) continue; out.push(q); }
        out.forEach((q, i) => { hangSign(q.x, q.z, q.ry, tx(SIGNS[i])); A.occ(q.x - 1.2, q.z - 1.2, q.x + 1.2, q.z + 1.2); E.posts.push({ id: 's' + i, x: q.x + Math.sin(q.ry) * 1.3, z: q.z + Math.cos(q.ry) * 1.3, sx: q.x, sz: q.z, lab: T2('🔎 간판 살펴보기', '🔎 Look at the hanging sign'), sg: i }); }); }
      for (const p of H.posts || []) { const [x, z] = K.Q(p.at[0], p.at[1]); E.posts.push({ ...p, x, z }); }
      { const [x, z] = K.Q(H.main[0], H.main[1]); E.main = { x, z }; }
      E.hero = hero(g, k, hill); if (k === 'rain') E.fill = ecoFill(g, sp);
      KL.push(E);
      A.place({ id: 'kl_' + g.id, name: def.nm[0], en: def.nm[1], kind: 'prop', x: sp.x, z: sp.z, door: [E.main.x, E.main.z], icon: def.ic, sym: def.ic, ai: '아이 동네 「' + g.t + '」 이름답게(KIDLOOK-1)', prop: true });
      A.rec({ id: 'kl:' + g.id, k: 'land', cell: A.cellOf(sp.x, sp.z), note: '✨ ' + def.nm[0], dens: '', n: { [def.nm[0]]: 1 } }); }
    /* 자연친화 동네(ECO 꾸밈 낱말이 있는 칸)의 박공지붕 집 = 남쪽 비탈 태양광 */
    let ns = 0; for (const gr of A.gabRoofs()) { if (!A.ecoAt(gr.cx, gr.cz)) continue; if (gr.w < 3.6 || gr.d < 3.6) continue; roofSolar(gr); ns++; } A.solarN = ns;   /* KIDLOOK-2: 작은 집(3.6m~)도 */
    { const EB = A.ecoBld ? A.ecoBld() : []; ECO9 = { n: EB.length, garden: EB.filter(b => b.flat).length, roof: EB.filter(b => b.flat || b.gab).length, vine: EB.filter(b => b.vine).length, solar: ns }; }   /* 자연친화 아이 동네 건물 수 · 옥상 정원 · 지붕 꾸밈(정원 또는 태양광) · 덩굴 · 태양광(시험 읽기) */
    const HN = { rain: '소형 풍력 발전기', temp: '덩굴 아치 문', obs: '탐조대', perm: '태양광 그늘 쉼터', wood: '장작 헛간', hole: '비탈 돌계단' }; for (const E of KL) { E.list = listOf(E); if (E.hero) E.list.push(HN[E.k] + '(들머리 ' + Math.round(E.hero.d) + 'm)'); if (E.fill && E.fill.length) E.list.push('들머리 채움 ' + E.fill.map(f => ({ pav: '태양광 정자', bed: '공동 텃밭 줄', rack: '자전거 거치대', flw: '꽃길', bin: '빗물 통·퇴비함', tree: '함께 심은 나무 줄' })[f.k] + ' ' + Math.round(f.d) + 'm').join(' · ')); } refresh(); }
  const listOf = E => { const L = { rain: ['투수 블록 길', '텃밭 셋', '빗물 저금통', '창고', '생태 연못', '분리수거장', '자전거 둘', '꽃'], temp: ['덩굴 시렁', '덩굴 벽', '맨 벽', '온도계 셋', '기록판', '나무'], obs: ['밧줄 울', '새집', '곤충 호텔', '생태 연못', '안내판', '꽃'], perm: ['투수 블록 길', '아스팔트 판', '빗물 정원', '물뿌리개'], jang: ['장독대', '장독 일곱', '돌담', '텃밭', '경운기'], tree: ['오솔길', '큰 소나무 셋', '통나무 의자', '걸상', '그루터기'], wood: ['돌축대', '처마', '받침목', '장작 두 더미', '그루터기'], hole: ['축대', '물빠짐 구멍 셋', '배수 도랑', '안내판'], bus: ['승하차 자리', '어린이 통학버스', '정류장', '시간표 판'], alley: ['돌길 광장', '분수', '꽃 화분 넷', '옛 가로등 둘', '벤치 둘', '맞붙은 반목조 집 셋'] }[E.k] || []; return E.posts.some(p => p.sg != null) ? L.concat(['골목 간판 ' + E.posts.length]) : L; };
  // ───────── 상태 메시를 오늘 상태대로(짓기 뒤 · 할 거리 뒤 · 날이 바뀔 때) ─────────
  function refresh() { const day = A.GAME.S.day;
    for (const E of KL) { const s = KS(E.k), today = s.d === day;
      if (E.k === 'jang') { const open = s.open != null ? !!s.open : false; if (E.st) E.st.visible = !open; if (E.st2) E.st2.visible = open; continue; }
      if (E.k === 'hole') { const c = cloggedOf(E), fixed = today && s.fixed; (E.hs || []).forEach((m, i) => { m.visible = i === c && !fixed; }); (E.ws || []).forEach((m, i) => { m.visible = !!(fixed && i === c && (A.wx() === 'rain')); }); continue; }
      if (E.k === 'perm') { if (E.st) E.st.visible = !!(today && s.seen && s.seen.asp) || A.wx() === 'rain'; continue; }
      if (E.st) E.st.visible = today && s.dd === day; } }
  const cloggedOf = E => (hs(E.g + ':' + A.GAME.S.day) % 3);
  // ───────── 할 거리 ─────────
  const QS = {
    rain(c, E, s) { const full = c.wet || ((c.day + hs(E.g)) % 3 === 0), cans = full ? 2 : 1, R = rngOf('rb' + c.day + E.g), beds = [0, 1, 2].map(i => ({ i, st: 0 })); const dry = (R() * 3) | 0, young = (dry + 1 + ((R() * 2) | 0)) % 3; beds[dry].st = 2; beds[young].st = 1;
      const BN = [T2('왼쪽 두둑', 'left bed'), T2('가운데 두둑', 'middle bed'), T2('오른쪽 두둑', 'right bed')], ST9 = [T2('흙이 촉촉하고 잎이 싱싱해요', 'soil is damp and the leaves are fresh'), T2('어제 옮겨 심은 모종이라 뿌리가 아직 얕아요', 'seedlings moved in yesterday — roots are still shallow'), T2('흙이 바싹 말랐고 잎이 축 처졌어요', 'soil is bone dry and the leaves are drooping')];
      const info = T2('저금통 물: ' + (full ? '가득 — 물뿌리개 두 번' : '반쯤 — 물뿌리개 한 번') + ' · ' + BN.map((b, i) => b[0] + ' = ' + ST9[beds[i].st][0]).join(' · '), 'Barrel: ' + (full ? 'full — two cans' : 'half — one can') + ' · ' + BN.map((b, i) => b[1] + ' = ' + ST9[beds[i].st][1]).join(' · '));
      if (c.rain) return { info: T2('비가 와요. 홈통을 타고 빗물이 저금통에 모이는 중이에요.', 'It is raining. Rain runs down the gutter into the barrel.'), q: [{ q: T2('오늘 텃밭에 물을 줄까요?', 'Should we water the beds today?'), o: [{ t: T2('주지 않아요 — 비가 대신 줘요', 'No — the rain is doing it'), ok: true, why: T2('비가 흙을 적셔 줘요. 모은 빗물은 맑은 날에 써요.', 'The rain soaks the soil. We save the barrel for sunny days.') }, { t: T2('저금통 물을 다 부어요', 'Pour out the whole barrel'), ok: false, why: T2('흙이 이미 젖어 있어서 물이 넘쳐 흘러가 버려요.', 'The soil is already wet, so the water just runs off.') }] }] };
      const q1 = { q: T2('물뿌리개 ' + (cans === 2 ? '두' : '한') + ' 번 — 어느 두둑에 먼저 줄까요?', (cans === 2 ? 'Two cans' : 'One can') + ' — which bed first?'), o: beds.map(b => ({ t: BN[b.i], ok: b.st === 2 || (cans === 2 && b.st === 1), why: b.st === 2 ? T2('맞아요. 잎이 처진 건 뿌리가 물을 못 빨아올려서예요. 물을 주니 잎이 다시 서요.', 'Right. Drooping leaves mean the roots cannot draw up water. After watering, they perk up.') : b.st === 1 ? T2('뿌리가 얕은 모종도 물이 필요해요. 그래도 잎이 처진 두둑이 더 급해요.', 'Shallow-rooted seedlings need water too, but the drooping bed is more urgent.') : T2('흙이 이미 촉촉해서 이 물은 거의 필요 없었어요. 옆 두둑 잎이 계속 처져 있어요.', 'This soil was already damp, so the water was not needed. The drooping bed is still drooping.') })) };
      const late = c.min >= 11 * 60 && c.min < 15 * 60;
      const q2 = { q: T2('물은 언제 주는 게 좋을까요?', 'When is the best time to water?'), o: [{ t: T2('아침이나 저녁', 'Morning or evening'), ok: true, why: T2('덜 더울 때 주면 물이 마르기 전에 흙 속으로 스며들어요.', 'When it is cooler, water sinks into the soil before it dries up.') }, { t: T2('해가 가장 뜨거운 한낮', 'At the hottest time of day'), ok: false, why: T2('한낮엔 물이 금방 말라 버려서 뿌리까지 덜 가요.', 'At midday the water dries off quickly and less reaches the roots.') }] };
      return { info: T2(info[0] + (late ? ' · 지금은 한낮이에요' : ''), info[1] + (late ? ' · it is midday now' : '')), q: [q1, q2] }; },
    temp(c, E, s) { const base = [16, 30, 15, 2][c.s] + (c.night ? -5 : c.min >= 12 * 60 && c.min < 16 * 60 ? 2 : 0), sun = !c.wet && !c.night, V = { vine: base - (sun ? 3 : 1), bare: base + (sun ? (c.s === 1 ? 6 : 3) : c.night ? 2 : 0), tree: base - (sun ? 4 : 0) };
      if (c.s === 3) { V.vine = base - (sun ? 0 : 0); V.tree = base - (sun ? 1 : 0); }
      const NM = { vine: T2('덩굴 벽 앞', 'green wall'), bare: T2('맨 벽 앞', 'bare wall'), tree: T2('나무 그늘', 'tree shade') }, ord = Object.keys(V).sort((a, b) => V[a] - V[b]), spread = V[ord[2]] - V[ord[0]];
      const info = T2('읽은 온도: ' + Object.keys(V).map(k => NM[k][0] + ' ' + V[k] + '도').join(' · '), 'Readings: ' + Object.keys(V).map(k => NM[k][1] + ' ' + V[k] + '°C').join(' · '));
      const q1 = spread <= 1 ? { q: T2('세 곳 온도가 어떤가요?', 'How do the three readings compare?'), o: [{ t: T2('거의 같아요', 'Almost the same'), ok: true, why: T2('해가 없으면(비·밤·흐림) 그늘과 볕의 차이가 거의 안 나요.', 'Without sunshine (rain, night, cloud) shade and sun barely differ.') }, { t: T2('맨 벽이 훨씬 더워요', 'The bare wall is much hotter'), ok: false, why: T2('읽은 수를 다시 봐요. 차이가 1도 안쪽이에요.', 'Look at the numbers again. They are within one degree.') }] }
        : { q: T2('가장 시원한 곳은 어디였나요?', 'Which spot was coolest?'), o: ['vine', 'bare', 'tree'].map(k => ({ t: NM[k], ok: V[k] === V[ord[0]], why: V[k] === V[ord[0]] ? T2('맞아요. 잎이 햇볕을 가리고, 잎에서 물이 날아가며 둘레 열을 가져가요.', 'Right. Leaves block the sun, and water leaving the leaves carries heat away.') : T2('읽은 수를 다시 봐요. ' + NM[ord[0]][0] + '가 ' + V[ord[0]] + '도로 가장 낮아요.', 'Check the numbers. ' + NM[ord[0]][1] + ' was lowest at ' + V[ord[0]] + '°C.') })) };
      const q2 = { q: T2('여름에 집 벽을 덜 뜨겁게 하려면?', 'How can a house wall stay cooler in summer?'), o: [{ t: T2('벽에 덩굴을 올려요', 'Grow climbing plants on it'), ok: true, why: T2('덩굴 잎이 그늘을 만들어 벽이 덜 달궈져요. 겨울엔 잎이 져서 볕이 들어요.', 'The leaves shade the wall. In winter they drop, letting the sun in.') }, { t: T2('벽을 까맣게 칠해요', 'Paint it black'), ok: false, why: T2('검은색은 햇볕을 더 많이 받아서 벽이 더 뜨거워져요.', 'Black takes in more sunlight, so the wall gets hotter.') }] };
      return { info, q: [q1, q2] }; },
    obs(c, E, s) { const sea = c.sea in OBS.nest ? c.sea : 'summer', must = { spring: 'nest', summer: 'pond', autumn: 'hotel', winter: 'hotel' }[sea];
      const NM = { nest: T2('새집', 'nest box'), hotel: T2('곤충 호텔', 'bug hotel'), pond: T2('생태 연못', 'pond') }, why = { nest: T2('새끼가 있는 둥지 가까이 가면 어미가 놀라 먹이를 못 날라요. 멀리서 봐요.', 'If we go near a nest with chicks, the parents get scared and stop feeding. Watch from far away.'), pond: T2('올챙이가 자라는 때라 물을 휘젓거나 떠 가면 안 돼요.', 'Tadpoles are growing now, so we must not stir the water or scoop them out.'), hotel: T2('곤충이 겨울을 나러 들어가는 때라 흔들거나 열지 않아요.', 'Insects are tucking in for winter, so we do not shake or open it.') };
      const q1 = { q: T2('지금 계절에 가장 조심해서 봐야 할 곳은?', 'Which spot needs the most care this season?'), o: ['nest', 'hotel', 'pond'].map(k => ({ t: NM[k], ok: k === must, why: k === must ? why[k] : T2('거기도 소중해요. 그런데 지금은 ' + NM[must][0] + ' 쪽이 더 민감해요. ' + why[must][0], 'That matters too, but right now the ' + NM[must][1] + ' is more sensitive. ' + why[must][1]) })) };
      const q2 = { q: T2('곤충 호텔 빈 칸 셋을 무엇으로 채울까요?', 'What should fill the three empty slots?'), o: [{ t: T2('속이 빈 마른 갈대 줄기', 'Dry hollow reed stems'), ok: true, why: T2('작은 벌이 대롱 속에 알을 낳아요. 마른 자연 재료라 습기가 덜 차요.', 'Small bees lay eggs inside hollow stems. Dry natural material stays less damp.') }, { t: T2('플라스틱 빨대', 'Plastic straws'), ok: false, why: T2('플라스틱은 숨을 못 쉬어 안에 물기가 차고 곰팡이가 생기기 쉬워요.', 'Plastic does not breathe, so moisture builds up and mould grows.') }, { t: T2('젖은 낙엽', 'Wet leaves'), ok: false, why: T2('젖은 잎은 썩어서 알이 상할 수 있어요.', 'Wet leaves rot and can spoil the eggs.') }] };
      return { info: T2('본 것: ' + ['nest', 'hotel', 'pond'].map(k => NM[k][0] + ' — ' + (s.obs && s.obs[k] ? s.obs[k][0] : '')).join(' / '), 'Seen: ' + ['nest', 'hotel', 'pond'].map(k => NM[k][1] + ' — ' + (s.obs && s.obs[k] ? s.obs[k][1] : '')).join(' / ')), q: [q1, q2] }; },
    perm(c) { const q1 = { q: T2('물이 고이지 않고 땅으로 스민 길은?', 'Which path let the water soak into the ground?'), o: [{ t: T2('투수 블록 길', 'Permeable block path'), ok: true, why: T2('맞아요. 블록 사이 틈과 구멍으로 물이 땅속에 스며들어요.', 'Right. Water sinks through the gaps and pores into the ground.') }, { t: T2('아스팔트', 'Asphalt'), ok: false, why: T2('아스팔트엔 물이 들어갈 틈이 없어 웅덩이가 생기고 낮은 쪽으로 흘러가요.', 'Asphalt has no gaps, so a puddle forms and flows downhill.') }] };
      const q2 = { q: T2(c.rain ? '지금처럼 비가 많이 오면 동네 길을 무엇으로 하는 게 좋을까요?' : '큰비가 올 때 길에 물이 넘치지 않게 하려면?', c.rain ? 'In heavy rain like now, what is better for neighbourhood paths?' : 'How can we keep streets from flooding in heavy rain?'), o: [{ t: T2('스미는 길과 빗물 정원을 늘려요', 'More soaking paths and rain gardens'), ok: true, why: T2('빗물이 땅으로 들어가면 하수구로 한꺼번에 몰리지 않고 땅속 물도 채워요.', 'Water that soaks in does not rush into the drains all at once, and it refills the ground water.') }, { t: T2('아스팔트를 더 넓게 깔아요', 'Lay more asphalt'), ok: false, why: T2('물이 스밀 곳이 줄어 길 위로 흐르는 물이 더 많아져요.', 'There is less ground to soak into, so more water runs over the street.') }] };
      return { info: T2('부어 본 결과를 떠올려 봐요.', 'Think about what happened when you poured.'), q: [q1, q2] }; },
    jang(c) { const shut = c.wet || c.night, now = c.rain ? T2('비가 와요', 'it is raining') : c.snow ? T2('눈이 와요', 'it is snowing') : c.night ? T2('밤이에요', 'it is night') : T2('맑은 낮이에요', 'it is a clear day');
      const q1 = { q: T2('지금은 ' + now[0] + '. 장독 뚜껑을 어떻게 할까요?', 'Right now ' + now[1] + '. What do we do with the jar lids?'), o: [{ t: T2('열어서 볕과 바람을 쐬어요', 'Open them to let in sun and air'), ok: !shut, open: 1, why: shut ? T2('빗물이나 밤이슬이 들어가면 장에 곰팡이가 피고 맛이 변해요. 오늘은 닫아 둬야 했어요.', 'Rain or night dew getting in makes the sauce go mouldy. Today they should stay shut.') : T2('맞아요. 맑은 날엔 뚜껑을 열어 햇볕을 쬐면 장이 잘 익고 곰팡이가 덜 생겨요.', 'Right. On a clear day, sunlight helps the sauce ripen and keeps mould away.') }, { t: T2('꼭 닫아 둬요', 'Keep them closed'), ok: shut, open: 0, why: shut ? T2('맞아요. 비·눈이 오거나 밤엔 닫아서 물기가 들어가지 않게 해요.', 'Right. In rain, snow or at night we close them so no moisture gets in.') : T2('맑은 날 계속 닫아 두면 속이 눅눅해져요. 볕 좋은 낮엔 열어요.', 'Shut all day in good weather, it gets damp inside. Open them on sunny days.') }] };
      const q2 = { q: T2('장독대를 볕 잘 드는 곳, 돌 단 위에 두는 까닭은?', 'Why is the jar terrace on a raised stone base in a sunny spot?'), o: [{ t: T2('볕과 바람이 잘 들고 빗물이 고이지 않아서', 'Sun and wind reach it, and rainwater does not pool'), ok: true, why: T2('장은 햇볕과 바람으로 익어요. 돌 단은 바닥 물기를 막아 줘요.', 'Sauces ripen with sun and wind. The stone base keeps ground damp away.') }, { t: T2('멀리서 잘 보이라고', 'So it can be seen from far away'), ok: false, why: T2('보이는 것보다 볕·바람·물 빠짐이 까닭이에요.', 'The reason is sun, wind and drainage, not being seen.') }] };
      return { info: T2('지금: ' + now[0], 'Now: ' + now[1]), q: [q1, q2] }; },
    tree(c, E, s) { const M = s.meas || {}, NM = [T2('가 나무', 'tree A'), T2('나 나무', 'tree B'), T2('다 나무', 'tree C')], big = [0, 1, 2].sort((a, b) => (M[b] || 0) - (M[a] || 0))[0];
      const q1 = { q: T2('셋 다 소나무예요. 가장 오래 산 나무는?', 'All three are pines. Which has lived longest?'), o: [0, 1, 2].map(i => ({ t: NM[i], ok: i === big, why: i === big ? T2('맞아요. 같은 나무라면 줄기가 굵을수록 오래 자란 거예요.', 'Right. For the same kind of tree, a thicker trunk usually means it has grown for longer.') : T2('잰 것을 다시 봐요. ' + NM[big][0] + '가 ' + (M[big] || 0) + '아름으로 가장 굵어요.', 'Check your measurements. ' + NM[big][1] + ' was thickest.') })) };
      const q2 = { q: T2('숲속 마을의 큰 나무를 지키려면?', 'How can we protect the big trees?'), o: [{ t: T2('오솔길로만 다녀요', 'Stay on the path'), ok: true, why: T2('나무 둘레 흙을 자꾸 밟으면 흙이 단단해져 뿌리가 숨을 못 쉬어요.', 'Treading on the soil around a tree packs it hard, and the roots cannot breathe.') }, { t: T2('줄기에 못을 박아 이름판을 달아요', 'Nail a name board to the trunk'), ok: false, why: T2('못 자리로 벌레와 병균이 들어갈 수 있어요. 끈으로 느슨하게 묶어요.', 'Nail holes let in insects and disease. Tie things loosely instead.') }] };
      return { info: T2('잰 둘레: ' + [0, 1, 2].map(i => NM[i][0] + ' ' + (M[i] || 0) + '아름').join(' · '), 'Measured: ' + [0, 1, 2].map(i => NM[i][1] + ' ' + (M[i] || 0) + ' hugs').join(' · ')), q: [q1, q2] }; },
    wood(c, E, s) { const dry = hs(E.g + ':w' + c.day) % 2, NM = [T2('왼쪽 더미', 'left pile'), T2('오른쪽 더미', 'right pile')];
      const q1 = { q: T2('오늘 아궁이에 땔 장작은?', 'Which wood should go in the stove today?'), o: [0, 1].map(i => ({ t: NM[i], ok: i === dry, why: i === dry ? T2('맞아요. 마른 장작은 가볍고 두드리면 맑은 소리가 나요. 연기도 덜 나요.', 'Right. Dry wood is light and rings when knocked. It makes less smoke too.') : T2('이 더미는 무겁고 둔한 소리가 났어요. 덜 마른 나무는 연기가 많이 나고 잘 안 타요.', 'This pile was heavy and thudded. Damp wood smokes a lot and burns badly.') })) };
      const q2 = { q: T2('새로 팬 장작은 어디에 쌓을까요?', 'Where should freshly split wood be stacked?'), o: [{ t: T2('처마 밑 받침목 위, 바람 통하게', 'Under the eaves on bearers, with air gaps'), ok: true, why: T2('비를 피하고, 바닥 물기를 막고, 바람이 지나가야 잘 말라요.', 'Out of the rain, off the damp ground and with air moving, it dries well.') }, { t: T2('땅바닥에 바로', 'Straight on the ground'), ok: false, why: T2('땅의 물기가 올라와 밑에서부터 썩어요.', 'Damp from the ground creeps up and the bottom rots.') }, { t: T2('비닐로 꽁꽁 싸서', 'Wrapped tight in plastic'), ok: false, why: T2('물기가 갇혀서 마르지 않아요.', 'The moisture gets trapped and it never dries.') }] };
      return { info: T2('두드려 본 것: ' + [0, 1].map(i => NM[i][0] + ' — ' + ((s.knock || {})[i] ? (i === dry ? '탁탁 맑은 소리 · 가벼움' : '퍽 둔한 소리 · 무거움') : '안 해 봄')).join(' / '), 'Knocked: ' + [0, 1].map(i => NM[i][1] + ' — ' + ((s.knock || {})[i] ? (i === dry ? 'clear knock, light' : 'dull thud, heavy') : 'not yet')).join(' / ')), q: [q1, q2] }; },
    hole(c, E) { const cl = cloggedOf(E);
      const q1 = { q: T2('치워야 할 구멍은 몇 번인가요?', 'Which hole needs clearing?'), o: [0, 1, 2].map(i => ({ t: T2((i + 1) + '번', 'Hole ' + (i + 1)), ok: i === cl, fix: i === cl, why: i === cl ? T2('맞아요. 낙엽과 흙을 긁어내니 구멍이 뚫렸어요.', 'Right. You scraped out the leaves and soil and the hole is open again.') : T2('이 구멍은 뚫려 있었어요. 들여다본 것을 떠올려 봐요.', 'That hole was already clear. Remember what you saw.') })) };
      const q2 = { q: T2('구멍이 막힌 채 큰비가 오면 어떻게 될까요?', 'What happens if heavy rain comes while a hole is blocked?'), o: [{ t: T2('축대 뒤에 물이 차서 벽을 밀어요', 'Water builds up behind and pushes the wall'), ok: true, why: T2('흙이 물을 먹으면 무거워져요. 물이 빠지지 못하면 축대가 밀려 무너질 수 있어요.', 'Wet soil gets heavy. If water cannot drain, the wall can be pushed over.') }, { t: T2('아무 일도 없어요', 'Nothing happens'), ok: false, why: T2('물빠짐 구멍은 그래서 있어요. 막히면 물이 갈 곳이 없어요.', 'That is exactly why the holes are there. Blocked, the water has nowhere to go.') }] };
      return { info: T2('비탈 집 아래 축대예요. 들여다본 구멍을 떠올려요.', 'This is the wall below the hillside houses. Remember what you saw.'), q: [q1, q2] }; },
    bus(c) { const T = [[T2('영어 학원', 'English'), [15 * 60 + 10, 16 * 60 + 40, 18 * 60 + 10]], [T2('수학 학원', 'Maths'), [15 * 60 + 40, 17 * 60 + 10, 18 * 60 + 40]], [T2('피아노 학원', 'Piano'), [16 * 60, 17 * 60 + 30]]], R = rngOf('bus' + c.day), pick = (R() * 3) | 0, cls = T[pick];
      const now = Math.max(13 * 60, Math.min(17 * 60 + 40, c.min)), start = Math.ceil((now + 25) / 30) * 30 + 30, ride = 12, ok9 = cls[1].filter(t => t >= now + 5 && t + ride <= start - 5), best = ok9.length ? ok9[ok9.length - 1] : null, hm = m => ((m / 60) | 0) + ':' + String(m % 60).padStart(2, '0');
      const info = T2('시간표: ' + T.map(r => r[0][0] + ' ' + r[1].map(hm).join(', ')).join(' / ') + ' · 버스로 12분 · 정류장까지 걸어서 5분', 'Timetable: ' + T.map(r => r[0][1] + ' ' + r[1].map(hm).join(', ')).join(' / ') + ' · 12 min ride · 5 min walk to the stop');
      const opts = cls[1].map(t => ({ t: T2(hm(t) + ' 버스', hm(t) + ' bus'), ok: t === best, why: t < now + 5 ? T2('지금 ' + hm(now) + '이라 걸어가면 이 버스는 이미 떠나요.', 'It is ' + hm(now) + ' now, so this bus will have left by the time you walk there.') : t + ride > start - 5 ? T2('이 버스는 ' + hm(t + ride) + '에 내려서 수업(' + hm(start) + ')에 빠듯하거나 늦어요.', 'This bus arrives at ' + hm(t + ride) + ', cutting it fine or late for ' + hm(start) + '.') : t === best ? T2('맞아요. 걸어갈 시간도 되고 수업 전에 넉넉히 내려요.', 'Right. You have time to walk there and arrive before class.') : T2('늦지는 않지만 정류장에서 오래 기다려요. 다음 버스로도 늦지 않아요.', 'Not late, but a long wait. The next bus still gets you there on time.') }));
      const q1 = { q: T2('지금 ' + hm(now) + '. ' + cls[0][0] + ' 수업은 ' + hm(start) + '에 시작해요. 어느 버스를 탈까요?', 'It is ' + hm(now) + '. ' + cls[0][1] + ' class starts at ' + hm(start) + '. Which bus?'), o: best == null ? [{ t: T2('오늘은 걸어가요', 'Walk today'), ok: true, why: T2('맞는 버스가 없어요. 시간표에 없으면 다른 길을 찾아요.', 'No bus fits. When the timetable does not work, find another way.') }, ...opts.map(o => ({ ...o, ok: false }))] : opts };
      const q2 = { q: T2('버스에서 내리면 가장 먼저?', 'What do you do first when you get off?'), o: [{ t: T2('버스가 떠난 뒤 좌우를 보고 건너요', 'Wait for the bus to leave, look both ways, then cross'), ok: true, why: T2('버스에 가려 운전자가 나를 못 봐요. 버스가 간 뒤 길 전체가 보일 때 건너요.', 'The bus hides you from drivers. Cross when it has gone and you can see the whole road.') }, { t: T2('버스 바로 앞으로 뛰어 건너요', 'Dash across in front of the bus'), ok: false, why: T2('옆 차로 차가 버스에 가려 나를 못 보고 달려올 수 있어요.', 'A car in the next lane cannot see you behind the bus.') }] };
      return { info, q: [q1, q2] }; },
    alley(c, E, s) { const F = E.posts.find(p => p.sg === (hs(E.g + ':a' + c.day) % E.posts.length)) || E.posts[0], dd = dir8(F.sx - E.x, F.sz - E.z), ds = [dd, (dd + 2) % 8, (dd + 6) % 8, (dd + 4) % 8].slice(0, 3), nm = SIGNS[F.sg];
      const q1 = { q: T2('분수에서 「' + nm[0] + '」 간판은 어느 쪽에 있었나요?', 'From the fountain, which way is the "' + nm[1] + '" sign?'), o: ds.map(k => ({ t: T2(DIR8K[k] + '쪽', DIR8E[k]), ok: k === dd, why: k === dd ? T2('맞아요. 작은 지도 위가 북쪽이에요. 골목이 구불구불해도 방위는 같아요.', 'Right. North is up on the mini-map. Lanes bend, but directions stay the same.') : T2('작은 지도를 보면 그 간판은 분수에서 ' + DIR8K[dd] + '쪽이에요.', 'On the mini-map that sign is ' + DIR8E[dd] + ' of the fountain.') })) };
      const q2 = { q: T2('옛 마을 골목이 좁고 집이 다닥다닥 붙은 까닭은?', 'Why are old-town lanes narrow with houses packed together?'), o: [{ t: T2('사람이 걸어 다니던 때 지어서 땅을 아껴 썼어요', 'They were built when people walked, using land sparingly'), ok: true, why: T2('차가 없던 때라 길이 넓을 필요가 없었고, 성벽 안 좁은 땅에 많은 집을 지었어요.', 'With no cars, lanes did not need to be wide, and many houses fitted inside the town walls.') }, { t: T2('일부러 길을 잃게 하려고', 'To make people get lost on purpose'), ok: false, why: T2('길을 잃게 하려던 것이 아니라 걷는 사람 크기에 맞춘 거예요.', 'Not to confuse people — the lanes were sized for walkers.') }] };
      return { info: T2('찾은 간판: ' + E.posts.map(p => SIGNS[p.sg][0] + (s.seen && s.seen[p.id] ? ' ✓' : ' ?')).join(' · '), 'Found: ' + E.posts.map(p => SIGNS[p.sg][1] + (s.seen && s.seen[p.id] ? ' ✓' : ' ?')).join(' · ')), q: [q1, q2] }; },
  };
  // 자료 모으는 자리(E) — 한 줄 + 기록(그날만)
  function postUse(E, p) { const c = ctx(), s = KS(E.k), e = en(); if (s.sd !== c.day) { s.sd = c.day; s.seen = {}; s.obs = {}; s.meas = {}; s.knock = {}; } s.seen[p.id] = 1; let t = null;
    if (E.k === 'temp') { const r = QS.temp(c, E, s), m = r.info[e ? 1 : 0].match(new RegExp((e ? { vine: 'green wall', bare: 'bare wall', tree: 'tree shade' } : { vine: '덩굴 벽 앞', bare: '맨 벽 앞', tree: '나무 그늘' })[p.id] + ' (-?\\d+)')); t = (e ? 'The thermometer reads ' : '온도계가 ') + (m ? m[1] : '?') + (e ? '°C.' : '도를 가리켜요.'); }
    else if (E.k === 'obs') { const k = p.id, o = OBS[k][c.night ? 'night' : (c.sea in OBS[k] ? c.sea : 'summer')]; s.obs[k] = o; t = o[e ? 1 : 0]; }
    else if (E.k === 'perm') { t = p.id === 'blk' ? (e ? 'The water sinks between the blocks and is gone in a moment.' : '물이 블록 사이 틈으로 스며들어 금방 사라져요.') : (e ? 'The water sits on the asphalt in a puddle, then trickles off downhill.' : '물이 아스팔트 위에 고여 웅덩이가 되고, 낮은 쪽으로 흘러가요.'); A.sfx('splash'); }
    else if (E.k === 'tree') { const i = +p.id.slice(1), R = rngOf('tr' + c.day + E.g), sz = [1, 2, 3].sort(() => R() - 0.5); s.meas[i] = sz[i]; t = e ? 'You stretch your arms around it: ' + sz[i] + ' hug' + (sz[i] > 1 ? 's' : '') + ' round.' : '팔을 벌려 안아 보니 ' + sz[i] + '아름이에요.'; }
    else if (E.k === 'wood') { const i = +p.id.slice(1), dry = hs(E.g + ':w' + c.day) % 2; s.knock[i] = 1; t = i === dry ? (e ? 'Tok-tok — a clear knock, and the log feels light.' : '탁탁 — 맑은 소리가 나고 들어 보니 가벼워요.') : (e ? 'Thud — a dull sound, and the log feels heavy.' : '퍽 — 둔한 소리가 나고 들어 보니 무거워요.'); A.sfx('tick'); }
    else if (E.k === 'hole') { const i = +p.id.slice(1), cl = cloggedOf(E), fixed = s.d === c.day && s.fixed; t = i === cl && !fixed ? (e ? 'Dead leaves and mud are packed tight in this hole.' : '낙엽과 흙이 꽉 막혀 있어요.') : c.rain ? (e ? 'Water is trickling out. It is draining well.' : '물이 졸졸 나와요. 잘 빠지고 있어요.') : (e ? 'It is dry, and you can see right inside. It is clear.' : '말라 있고 안이 들여다보여요. 뚫려 있어요.'); }
    else if (E.k === 'alley') { const nm = SIGNS[p.sg], dd = dir8(p.sx - E.x, p.sz - E.z); t = e ? 'A hanging sign: "' + nm[1] + '". The fountain square is to the ' + DIR8E[(dd + 4) % 8] + '.' : '「' + nm[0] + '」 간판이에요. 분수 광장은 ' + DIR8K[(dd + 4) % 8] + '쪽이에요.'; }
    A.GAME.mark(); refresh(); const left = E.posts.filter(q => !s.seen[q.id]).length; A.say(t + (left ? (e ? ' (' + left + ' more to check)' : ' (남은 곳 ' + left + ')') : (e ? ' Now check the board.' : ' 이제 판에서 정리해요.')), 5.5); A.sfx(left ? 'tick' : 'ding'); }
  function mainUse(E) { const c = ctx(), s = KS(E.k), e = en(), def = KITS[E.k]; if (s.sd !== c.day) { s.sd = c.day; s.seen = {}; s.obs = {}; s.meas = {}; s.knock = {}; }
    const miss = E.posts.filter(p => !s.seen[p.id]);
    if (miss.length) { const dirs = miss.map(p => { const dd = dir8(p.x - E.main.x, p.z - E.main.z), m = Math.round(Math.hypot(p.x - E.main.x, p.z - E.main.z)); return '<div class="st"><span>' + A.esc(tx(p.lab)) + ' — ' + (e ? DIR8E[dd] + ', about ' + m + ' m' : DIR8K[dd] + '쪽 ' + m + 'm쯤') + '</span></div>'; }).join('');
      const P = A.openP('<h3>' + def.ic + ' ' + A.esc(tx(def.nm)) + '</h3><div class="sm">' + A.esc((e ? 'Task: ' : '할 일: ') + tx(def.task)) + '</div><div class="sm" style="font-weight:700">' + (e ? 'Still to check:' : '아직 볼 곳:') + '</div>' + dirs + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', 'kl');
      if (P) P.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; A.sfx('tick'); return; }
    const Q = QS[E.k](c, E, s), R = rngOf('ko' + c.day + E.g), log = []; let i = 0, nOk = 0;
    const draw = (fb) => { const P = A.openP('<h3>' + def.ic + ' ' + A.esc(tx(def.nm)) + '</h3><div class="sm">' + A.esc((e ? 'Task: ' : '할 일: ') + tx(def.task)) + '</div><div class="sm" style="background:#f3ecd9;border-radius:8px;padding:6px 8px">' + A.esc(tx(Q.info)) + '</div>'
      + (fb ? '<div class="sm" style="font-weight:700;margin-top:6px">' + A.esc(fb) + '</div><div class="row"><button data-kl="n">' + (i < Q.q.length ? (e ? 'Next' : '다음') : (e ? 'Finish' : '마치기')) + '</button></div>'
        : '<div class="sm" style="font-weight:800;margin-top:6px">' + A.esc(tx(Q.q[i].q)) + '</div><div class="row" style="flex-wrap:wrap">' + order(Q.q[i].o).map(j => '<button data-kl="' + j + '">' + A.esc(tx(Q.q[i].o[j].t)) + '</button>').join('') + '</div>'), 'kl');
      if (!P) return; P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const v = b.dataset.kl; if (v == null) return;
        if (v === 'n') { if (i < Q.q.length) draw(null); else finish(); return; }
        const o = Q.q[i].o[+v]; if (!o) return; if (o.ok) nOk++; log.push(tx(o.t) + (o.ok ? ' ✓' : '')); if (E.k === 'jang' && o.open != null && i === 0) { s.open = o.open; } if (E.k === 'hole' && o.fix) { s.fixed = 1; s.d = c.day; } i++; A.sfx(o.ok ? 'ding' : 'tick'); A.GAME.mark(); refresh(); draw(tx(o.why)); }; };
    const order = os => { const ix = os.map((_, j) => j); for (let k = ix.length - 1; k > 0; k--) { const j = (R() * (k + 1)) | 0; [ix[k], ix[j]] = [ix[j], ix[k]]; } return ix; };
    const finish = () => { s.done = (s.done || 0) + 1; s.d = c.day; s.dd = c.day; s.last = nOk; A.GAME.mark(); refresh(); A.skUp(def.sk, nOk >= Q.q.length ? 3 : 1, 'kl:' + E.k);
      const res = nOk >= Q.q.length ? T2('모두 근거대로 골랐어요.', 'Every choice matched the evidence.') : T2(Q.q.length - nOk + '가지는 다르게 됐어요. 위 까닭을 다시 읽어 봐요.', (Q.q.length - nOk) + ' turned out differently. Read the reasons again.');
      const P = A.openP('<h3>' + def.ic + ' ' + A.esc(tx(def.nm)) + '</h3><div class="sm">' + A.esc(tx(res)) + '</div><div class="sm">' + A.esc(log.join(' · ')) + '</div><div class="sm">' + A.esc(tx(AFTER[E.k] || T2('', ''))) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', 'kl');
      if (P) P.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; };
    draw(null); }
  const AFTER = { rain: T2('물 준 두둑의 흙이 짙게 젖었어요. 내일 다시 와서 잎을 살펴봐요.', 'The watered bed is dark and damp now. Come back tomorrow to check the leaves.'), temp: T2('기록판에 오늘 온도 막대를 그렸어요.', 'You drew today\'s bars on the record board.'), obs: T2('곤충 호텔 빈 칸에 갈대 줄기를 채웠어요.', 'You filled the empty slots with reed stems.'), perm: T2('아스팔트 위 웅덩이는 한동안 남아 있어요.', 'The puddle on the asphalt stays for a while.'), jang: T2('장독 뚜껑은 고른 대로 그대로 있어요. 날씨가 바뀌면 다시 와 봐요.', 'The lids stay as you left them. Come back when the weather changes.'), tree: T2('잰 나무 셋에 빨간 끈을 느슨하게 묶었어요.', 'You tied a loose red band round each tree you measured.'), wood: T2('마른 장작을 처마 밑 받침목 위에 쌓았어요.', 'You stacked the dry wood on the bearers under the eaves.'), hole: T2('막힌 구멍을 뚫었어요. 비 오는 날 와 보면 물이 나와요.', 'You cleared the blocked hole. On a rainy day, water will trickle out.'), bus: T2('시간표에 내가 탈 줄을 표시했어요.', 'You marked your bus on the timetable.'), alley: T2('분수 둘레 화분에 물을 주니 꽃이 가득 피었어요.', 'You watered the planters round the fountain and they are full of flowers.') };
  // ───────── E 자리 ─────────
  function hots() { const out = []; for (const E of KL) { const def = KITS[E.k]; out.push({ x: E.main.x, z: E.main.z, label: def.ic + ' ' + tx(def.nm) + (en() ? ' — ' : ' — ') + tx(T2('기록판', 'board')), use: () => mainUse(E), g: E.g, main: true });
      for (const p of E.posts) out.push({ x: p.x, z: p.z, label: tx(p.lab), use: () => postUse(E, p), g: E.g }); } return out; }
  function dayTick() { refresh(); }
  function info() { return { solar: A.solarN || 0, eco: ECO9, hoods: KL.map(E => ({ g: E.g, t: E.t, k: E.k, cell: E.cell, x: +E.x.toFixed(1), z: +E.z.toFixed(1), ry: +E.ry.toFixed(3), hd: E.hero ? +E.hero.d.toFixed(1) : null, fill: E.fill || null, d: +E.d.toFixed(1), n: E.list.length, list: E.list, use: KITS[E.k].ic + ' ' + tx(KITS[E.k].nm) + ' — ' + tx(T2('기록판', 'board')), posts: E.posts.map(p => tx(p.lab)), done: KS(E.k).done || 0, st: [E.st, E.st2, ...(E.hs || [])].filter(Boolean).map(m => m.visible) })) }; }
  return { build, hots, info, refresh: dayTick, ecoKit: k => !!KITS[k] };
}
