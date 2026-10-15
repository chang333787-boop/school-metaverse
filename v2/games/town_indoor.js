// 🏠 마을 실내(INDOOR-1 · 10-15 3차 · 또래 명세 §4-11) — 들어갈 때만 짓고 나오면 치움(평소 그리기 수 0)
//   방 = 그 건물 위 공중에 닫힌 상자 하나(벽·바닥·천장 · 창은 빛나는 판) → 문 E로 순간이동 · 나올 때 원래 문 앞으로(town.js)
//   아이 집(유은·하람·예지·지원) = 그 집 겉모습과 어울리는 방(교사 10-15 'RPG 안 따라가도 된다') — 카드·패들렛에 적힌 것(자료 room = 🙋)을 먼저 · 나머지 ✨(ROOM_ITEMS = 기록 화면 목록) · 모르는 모습 = 기본 방
//   아쿠아리움(🙋 33 유은) · 키즈 카페(🙋 28.1 지원) · 보드게임 카페(카드 1층 음식점 · 2층 상점가 · 3층 보드게임) = 사진·카드대로 + 이름 없는 손님 몇(새 실제 인물 X)
//   새 조명 없음(빛 = 빛나는 판) · 재질 둘(조명 받는 것 · 빛나는 것) · 매 프레임 일 = 물고기 떼 돌기뿐 · 앉기(E) = 좌석(seat) 앉기 · 미끄럼(E) = 미끄럼 타기(main.js 기본 행동)
export const INDOOR_CS = 0.8;
const WALL_IDS = { d_i4: 1, in_w_curtain: 1, in_w_window2: 1, in_w_clock: 1, in_w_board: 1, in_w_shelf: 1, in_w_bookshelf: 1 };   // RPG 벽걸이(뒷벽)
const SIZE = { d_i5: [2, 1], d_i6: [1, 2], d_i7: [2, 1], d_i8: [3, 1], d_i9: [2, 2], d_i10: [2, 2], d_i11: [3, 1], d_i12: [2, 2], d_i13: [1, 2], d_i14: [1, 2], d_i15: [2, 2], d_i16: [3, 2], in_w_window2: [2, 1], in_w_board: [2, 1], in_table_long: [4, 2], deco_bookshelf: [2, 2] };
const FLAT = { d_i15: 1, d_i16: 1, d_i1: 1, d_i2: 1 };   // 몸이 지나가도 되는 것(러그 · 작은 화분·램프)
// 기본 방(✨ — RPG 집 안이 비었을 때 · 지원 카드 '침대·책상·방'): 침대 · 책장 · 책상 + 의자 · 벽 소파 + 램프 · 러그 · 창 둘 · 액자 · 화분 둘
const DEFAULT_ROOM = [['in_w_curtain', 3, 0], ['d_i4', 6, 0], ['in_w_window2', 9, 0], ['d_i6', 0, 1], ['d_i10', 2, 1], ['d_i5', 5, 1], ['in_chair_back', 5, 2], ['d_i8', 8, 1], ['d_i2', 11, 1], ['d_i15', 8, 3], ['d_i1', 0, 5], ['d_i1', 11, 5]].map(([id, col, row]) => ({ id, col, row }));

// 기록 화면 목록(들어가지 않아도 보임): 그 곳 안에 지은 것 — 자료 room(카드·패들렛)과 같은 이름 = 🙋 · 나머지 = ✨
export const ROOM_ITEMS = {
  treehouse: ['나무 판벽', '작은 창', '사다리', '다락', '다락 이불', '둥근 탁자', '매단 등불', '책장', '나무 상자'],
  'blue-cottage': ['벽난로', '나무 난로(굴뚝 둘)', '흰 창틀', '지붕창 밑 다락방', '비스듬한 천장', '안락의자', '찻주전자 탁자', '책장', '그릇장', '매단 등'],
  'purple-townhouse': ['1층 거실·부엌', '2층 침실', '계단', '발코니 문', '소파·TV', '식탁', '침대', '책상', '옷장'],
  'cream-suburban-fountain': ['침대', '책상', '방(따로 방)', '주방', '넓은 거실', '소파·TV', '식탁', '냉장고', '옷장', '장난감 카트(카드의 「카트?」 · 이름 없이)', '책장'],
  aqua: ['수조 위 보트', '아치 수중 터널', '클리오네', '작은 동물 방', '벽 수조', '물고기 떼', '손님(이름 없음)'],
  kids: ['철골 정글짐', '미끄럼', '그물 다리', '네온', '계단', '공 풀', '쉼 탁자', '손님(이름 없음)'],
  board: ['1층 음식점', '2층 상점가', '3층 보드게임', '계단', '손님(이름 없음)'],
  home: ['침대', '책상', '소파', '창', '책장', '러그'],
};
export const kidItem = (label, kid) => (kid || []).some(w => label === w || label.startsWith(w + '('));   // 🙋 = 자료 room 낱말과 같거나 '낱말(…)'
export function createIndoor({ T3, map, onCollider, removeCollider, en }) {
  const MAT = new T3.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 }), GLOW = new T3.MeshBasicMaterial({ vertexColors: true });
  const G = { b: new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), c: new T3.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0), c16: new T3.CylinderGeometry(1, 1, 1, 18).translate(0, 0.5, 0), s: new T3.SphereGeometry(1, 10, 7), k: new T3.ConeGeometry(1, 1, 10).translate(0, 0.5, 0) };
  const C = new T3.Color(), M = new T3.Matrix4(), NM = new T3.Matrix3(), pv = new T3.Vector3(), nv = new T3.Vector3(), QY = new T3.Quaternion(), EU = new T3.Euler(), SC = new T3.Vector3(), PO = new T3.Vector3();
  let cur = null, night = false;
  const rgb = h => { C.setHex(h); return [C.r, C.g, C.b]; };
  // 부품 하나: k = 'b' 상자(밑 = y · sx·sy·sz) · 'c'/'c16' 원기둥(반지름 sx · 높이 sy) · 's' 공(반지름 sx · 세로 sy배) · 'k' 고깔 · ry = 돌림(먼저 rx 기울이고 ry)
  function part(A, k, x, y, z, sx, sy, sz, hex, ry = 0, rx = 0) { const g = G[k], P = g.attributes.position, N = g.attributes.normal, col = rgb(hex);
    if (k === 'b') SC.set(sx, sy, sz); else if (k === 's') SC.set(sx, sx * sy, sx); else SC.set(sx, sy, sx); EU.set(rx, ry, 0, 'YXZ'); QY.setFromEuler(EU); PO.set(x, y, z); M.compose(PO, QY, SC); NM.getNormalMatrix(M);
    const idx = g.index ? g.index.array : null, n9 = idx ? idx.length : P.count; for (let i = 0; i < n9; i++) { const j = idx ? idx[i] : i; pv.fromBufferAttribute(P, j).applyMatrix4(M); nv.fromBufferAttribute(N, j).applyMatrix3(NM).normalize(); A.p.push(pv.x, pv.y, pv.z); A.n.push(nv.x, nv.y, nv.z); A.c.push(col[0], col[1], col[2]); } }
  const newA = () => ({ p: [], n: [], c: [] }), meshOf = (A, mat) => { if (!A.p.length) return null; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(A.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(A.c, 3)); g.computeBoundingSphere(); const m = new T3.Mesh(g, mat); m.matrixAutoUpdate = false; m.updateMatrix(); return m; };

  // 가구 한 개(로컬: 가운데 원점 · +z = 앞(방 쪽) · y = 바닥): put(k, x, y, z, sx, sy, sz, hex, glow?)
  function furniture(id, put) {
    const wood = 0x9b6a3c, dk = 0x5a3c26, gold = 0xd8b04a, wh = 0xf7f6f2;
    switch (id) {
      case 'd_i1': put('c', 0, 0, 0, 0.2, 0.38, 0, 0xb5653a); put('s', 0, 0.66, 0, 0.32, 0.9, 0, 0x4e9a43); put('s', 0.12, 0.86, 0.05, 0.2, 1, 0, 0x5aa84c); break;   // 화분
      case 'd_i2': put('c', 0, 0, 0, 0.18, 0.05, 0, 0x5a5e64); put('c', 0, 0.05, 0, 0.03, 1.25, 0, 0x5a5e64); put('k', 0, 1.3, 0, 0.28, 0.34, 0, 0xffe7a8, 1); break;   // 세움 램프(갓 = 빛)
      case 'd_i3': put('b', 0, 0, 0, 0.55, 1.9, 0.38, dk); put('b', 0, 1.3, 0.19, 0.4, 0.4, 0.02, wh); put('b', 0, 1.49, 0.205, 0.03, 0.15, 0.01, 0x2b2d31); put('b', 0, 0.4, 0.19, 0.3, 0.7, 0.02, gold); break;   // 큰 괘종시계
      case 'd_i5': put('b', 0, 0.72, 0, 1.5, 0.06, 0.7, wood); for (const [a, b] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) put('b', a, 0, b, 0.06, 0.72, 0.06, wood); put('b', 0, 0.78, -0.22, 0.62, 0.42, 0.05, 0x2b2d31); put('b', 0, 0.82, -0.19, 0.56, 0.34, 0.01, 0x7fb8e0, 1); put('b', 0.3, 0.78, 0.12, 0.3, 0.02, 0.12, 0x9aa0a6); break;   // 책상 + 화면
      case 'd_i6': put('b', 0, 0, 0, 0.78, 1.95, 0.42, wood); for (let r9 = 0; r9 < 4; r9++) for (let k = 0; k < 6; k++) put('b', -0.3 + k * 0.12, 0.12 + r9 * 0.46, 0.2, 0.09, 0.32 + (k % 3) * 0.04, 0.04, [0xe0453a, 0x2f6fd0, 0xf2c230, 0x3cc76a, 0x8a5bd1, 0xef8b33][(k + r9) % 6]); break;   // 책장
      case 'd_i7': put('b', 0, 0, 0, 1.5, 0.5, 0.45, wood); put('b', 0, 0.5, -0.08, 1.3, 0.78, 0.07, 0x2b2d31); put('b', 0, 0.55, -0.04, 1.2, 0.66, 0.01, 0x335a7a, 1); break;   // TV
      case 'd_i8': put('b', 0, 0, 0, 2.2, 0.42, 0.8, 0x4f7fb0); put('b', 0, 0.42, -0.3, 2.2, 0.45, 0.2, 0x46719e); for (const s9 of [-1, 1]) put('b', s9 * 1.03, 0.42, 0, 0.16, 0.24, 0.8, 0x46719e); for (const s9 of [-1, 1]) put('b', s9 * 0.48, 0.42, 0.06, 0.9, 0.1, 0.56, 0x6a96c4); break;   // 소파
      case 'd_i9': put('b', 0, 0, -0.3, 1.5, 1.25, 0.55, 0x1d1d20); put('b', 0, 0.72, 0.1, 1.4, 0.08, 0.26, 0x1d1d20); put('b', 0, 0.8, 0.12, 1.36, 0.03, 0.2, wh); for (let k = 0; k < 9; k++) put('b', -0.6 + k * 0.15, 0.83, 0.08, 0.05, 0.02, 0.1, 0x1d1d20); put('b', 0, 0, 0.62, 0.9, 0.45, 0.32, 0x1d1d20); break;   // 피아노 + 의자
      case 'd_i10': put('b', 0, 0, 0, 1.5, 0.35, 1.6, wood); put('b', 0, 0.35, 0.02, 1.4, 0.2, 1.5, wh); put('b', 0, 0.55, 0.25, 1.42, 0.07, 1.0, 0xf08fb2); for (const s9 of [-1, 1]) put('b', s9 * 0.35, 0.55, -0.52, 0.5, 0.12, 0.3, wh); put('b', 0, 0, -0.82, 1.5, 0.95, 0.08, wood); break;   // 침대
      case 'd_i11': put('b', 0, 0, 0, 2.2, 0.6, 0.6, dk); put('b', 0, 0.6, 0, 2.1, 0.75, 0.55, 0x5fc0e6, 1); for (let k = 0; k < 5; k++) put('b', -0.8 + k * 0.4, 0.8 + (k % 2) * 0.22, 0.28, 0.16, 0.07, 0.02, [0xef8b33, 0xf2c230, 0xe0453a][k % 3]); put('b', 0, 1.35, 0, 2.15, 0.06, 0.58, 0x2b2d31); break;   // 수족관(물 = 빛)
      case 'd_i12': case 'deco_bookshelf': put('b', 0, 0, -0.3, 1.5, 2.0, 0.5, 0x3a2414); put('b', 0, 2.0, -0.3, 1.58, 0.1, 0.56, gold); for (let r9 = 0; r9 < 4; r9++) for (let k = 0; k < 10; k++) put('b', -0.63 + k * 0.14, 0.14 + r9 * 0.47, -0.05, 0.1, 0.32 + (k % 2) * 0.05, 0.04, [gold, 0xb03a2e, 0x2f4a8a, 0x2f6b3a][(k + r9) % 4]); break;   // 금빛 책장
      case 'd_i13': put('b', 0, 0, 0, 0.72, 1.95, 0.1, gold); put('b', 0, 0.16, 0.05, 0.56, 1.62, 0.01, 0xcfe8ff, 1); break;   // 마법 거울(빛)
      case 'd_i14': put('b', 0, 0, 0.1, 0.75, 0.5, 0.7, gold); put('b', 0, 0.5, 0.14, 0.65, 0.1, 0.6, 0xb8242e); put('b', 0, 0.5, -0.3, 0.75, 1.45, 0.12, 0xb8242e); put('b', 0, 1.95, -0.3, 0.86, 0.14, 0.16, gold); break;   // 왕의 의자
      case 'd_i15': put('c16', 0, 0, 0, 0.78, 0.02, 0, 0xe08a3a); put('c16', 0, 0, 0, 0.55, 0.026, 0, 0xf2c230); break;   // 둥근 러그
      case 'd_i16': put('b', 0, 0, 0, 2.3, 0.02, 1.5, 0x3d74c9); put('b', 0, 0, 0, 2.0, 0.026, 1.2, 0x7fb8e0); break;   // 네모 러그
      case 'in_table_long': put('b', 0, 0.72, 0, 3.0, 0.08, 1.4, wood); for (const [a, b] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) put('b', a, 0, b, 0.08, 0.72, 0.08, wood); break;   // 긴 탁자
      case 'in_chair_front': case 'in_chair_back': { const s9 = id === 'in_chair_front' ? -1 : 1; put('b', 0, 0.42, 0, 0.45, 0.05, 0.45, wood); for (const [a, b] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) put('b', a, 0, b, 0.04, 0.42, 0.04, wood); put('b', 0, 0.47, s9 * 0.2, 0.45, 0.5, 0.04, wood); break; }   // 의자(앞 의자 = 등받이 뒤쪽 · 뒤 의자 = 등받이 앞쪽)
      case 'armchair': put('b', 0, 0, 0.04, 0.86, 0.42, 0.74, 0x3d6fb8); put('b', 0, 0.42, -0.26, 0.86, 0.5, 0.2, 0x355fa0); for (const s9 of [-1, 1]) put('b', s9 * 0.37, 0.42, 0.04, 0.12, 0.2, 0.74, 0x355fa0); put('b', 0, 0.42, 0.1, 0.6, 0.08, 0.55, 0x6a96c4); break;   // 안락의자(파랑)
      case 'deco_trophy': put('b', 0, 0, 0, 0.5, 0.8, 0.5, dk); put('c', 0, 0.8, 0, 0.08, 0.15, 0, gold); put('c', 0, 0.95, 0, 0.17, 0.28, 0, gold); for (const s9 of [-1, 1]) put('b', s9 * 0.2, 1.02, 0, 0.06, 0.16, 0.03, gold); break;   // 트로피
      default: put('c', 0, 0, 0, 0.16, 0.32, 0, 0xb5653a); put('s', 0, 0.55, 0, 0.26, 0.9, 0, 0x4e9a43);   // 모르는 것 = 작은 화분
    } }
  function wallItem(id, put) {   // 뒷벽 걸이(로컬: +z = 방 쪽 · z 0 = 벽판 앞면 · 아래 벽판은 0.9m까지라 걸이는 그 위)
    switch (id) {
      case 'd_i4': put('b', 0, 1.25, 0, 0.9, 0.72, 0.05, 0xd8b04a); put('b', 0, 1.6, 0.05, 0.78, 0.31, 0.01, 0x8fc4e8); put('b', 0, 1.31, 0.05, 0.78, 0.29, 0.01, 0x6aa84c); put('s', 0.2, 1.7, 0.06, 0.07, 1, 0, 0xffe066); break;   // 그림 액자(하늘·언덕·해)
      case 'in_w_curtain': put('b', 0, 1.0, 0, 0.72, 1.0, 0.04, 0xf7f6f2); put('b', 0, 1.05, 0.04, 0.6, 0.9, 0.01, 0xbfe3f5, 1); for (const s9 of [-1, 1]) put('b', s9 * 0.33, 0.95, 0.05, 0.16, 1.15, 0.04, 0xd8424a); put('b', 0, 2.1, 0.035, 0.86, 0.05, 0.05, 0x8a5a34); break;   // 커튼 창(빛)
      case 'in_w_window2': put('b', 0, 1.0, 0, 1.52, 1.0, 0.04, 0xf7f6f2); put('b', 0, 1.05, 0.04, 1.4, 0.9, 0.01, 0xbfe3f5, 1); put('b', 0, 1.05, 0.05, 0.04, 0.9, 0.01, 0xf7f6f2); break;   // 긴 창(빛)
      case 'in_w_clock': put('c16', 0, 1.7, 0, 0.24, 0.05, 0, 0x2b2d31, 0, Math.PI / 2); put('c16', 0, 1.7, 0.02, 0.21, 0.04, 0, 0xf7f6f2, 0, Math.PI / 2); put('b', 0, 1.7, 0.065, 0.025, 0.15, 0.01, 0x2b2d31); put('b', 0.05, 1.69, 0.065, 0.1, 0.02, 0.01, 0x2b2d31); break;   // 벽시계
      case 'in_w_board': put('b', 0, 1.0, 0, 1.4, 0.82, 0.04, 0xb08a5e); for (let k = 0; k < 5; k++) put('b', -0.5 + k * 0.25, 1.15 + (k % 2) * 0.28, 0.04, 0.2, 0.24, 0.01, [0xffffff, 0xfff2a8, 0xcfe8ff, 0xffd0dc, 0xffffff][k]); break;   // 게시판
      case 'in_w_shelf': put('b', 0, 1.4, 0, 0.72, 0.05, 0.24, 0x8a5a34); put('c', -0.2, 1.45, 0.12, 0.07, 0.18, 0, 0xe0453a); put('b', 0.15, 1.45, 0.06, 0.2, 0.14, 0.12, 0x2f6fd0); break;   // 벽 선반
      case 'in_w_bookshelf': for (const y of [1.2, 1.6]) put('b', 0, y, 0, 0.72, 0.05, 0.24, 0x8a5a34); for (let k = 0; k < 5; k++) put('b', -0.26 + k * 0.13, 1.25, 0.04, 0.1, 0.3, 0.16, [0xe0453a, 0x2f6fd0, 0xf2c230, 0x3cc76a, 0x8a5bd1][k]); break;   // 걸이 책장
    } }
  // 사람(이름 없는 손님 · 단순형): 서 있음 / 앉음(좌석 0.45) · ry = 보는 쪽(0 = +z) · k = 옷·머리 차례(3의 배수 = 아이 · 작게)
  function guest(put, x, y, z, ry, k, sit) { const SH = [0xe0453a, 0x3d74c9, 0xf2c230, 0x3cc76a, 0xf08fb2, 0x8a5bd1, 0xef8b33, 0x7fb8d0][k % 8], PA = [0x3b4a5c, 0x24324a, 0x5a4a3a, 0x2e2e33][k % 4], SK = [0xf2cfa8, 0xe8c09a, 0xd9ab84][k % 3], HR = [0x2b1d14, 0x3a2a1c, 0x1c1c1e, 0x5a3d26][k % 4], s9 = k % 3 === 0 ? 0.75 : 1, yo = sit ? 0.45 - 0.42 * s9 : 0;
    const P = (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
    if (sit) for (const sg of [-1, 1]) { const [a, b] = P(sg * 0.09 * s9, 0.2 * s9); put('b', a, y + yo + 0.42 * s9, b, 0.12 * s9, 0.12 * s9, 0.4 * s9, PA, ry); const [c9, d9] = P(sg * 0.09 * s9, 0.36 * s9); put('b', c9, y + yo, d9, 0.11 * s9, 0.44 * s9, 0.11 * s9, PA, ry); }
    else for (const sg of [-1, 1]) { const [a, b] = P(sg * 0.09 * s9, 0); put('b', a, y, b, 0.12 * s9, 0.82 * s9, 0.12 * s9, PA, ry); }
    const yb = y + yo + (sit ? 0.54 : 0.82) * s9; put('c', x, yb, z, 0.17 * s9, 0.52 * s9, 0, SH); for (const sg of [-1, 1]) { const [a, b] = P(sg * 0.22 * s9, 0.03); put('b', a, yb + 0.05 * s9, b, 0.08 * s9, 0.45 * s9, 0.08 * s9, SH, ry); }
    put('s', x, yb + 0.68 * s9, z, 0.15 * s9, 1, 0, SK); put('s', x, yb + 0.72 * s9, z, 0.158 * s9, 0.75, 0, HR); }

  // ── 방 껍데기(공통): W × D × H · 문 = 앞벽(+z) 가운데 · 걸레받이 · 아래 벽판 · 천장 등 · 옆 창(빛 · 층마다 winY) ──
  function shell(at, W, D, H, o = {}) { const A = newA(), Ag = newA(), [ox, oy, oz] = at, put = (k, x, y, z, sx, sy, sz, hex, gl, rx) => part(gl ? Ag : A, k, ox + x, oy + y, oz + z, sx, sy, sz, hex, 0, rx || 0), cols = [], wallC = o.wall ?? 0xf3ead8, floorC = o.floor ?? 0xb98a55;
    const col = (x0, x1, z0, z1, y0, y1) => cols.push({ x0: ox + x0, x1: ox + x1, z0: oz + z0, z1: oz + z1, y0: oy + y0, y1: oy + y1 });
    put('b', 0, -0.3, 0, W + 0.4, 0.3, D + 0.4, 0xb9b2a4); const nP = Math.max(1, Math.round(W / 0.6)); for (let i = 0; i < nP; i++) put('b', -W / 2 + (i + 0.5) * W / nP, 0, 0, W / nP - 0.012, 0.012, D, i % 2 ? floorC : (o.floor2 ?? 0xc49a66));   // 바닥(마루 판 줄)
    for (const [x, z, sx, sz] of [[0, -D / 2 - 0.1, W + 0.4, 0.2], [0, D / 2 + 0.1, W + 0.4, 0.2], [-W / 2 - 0.1, 0, 0.2, D], [W / 2 + 0.1, 0, 0.2, D]]) { put('b', x, 0, z, sx, H, sz, wallC); col(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, -1, H); }   // 벽 넷
    for (const [x, z, sx, sz] of [[0, -D / 2, W, 0], [0, D / 2, W, 0], [-W / 2, 0, 0, D], [W / 2, 0, 0, D]]) { const s9 = sx ? Math.sign(-z) : Math.sign(-x), bx = sx ? 0 : x + s9 * 0.03, bz = sx ? z + s9 * 0.03 : 0, wx = sx ? 0 : x + s9 * 0.02, wz = sx ? z + s9 * 0.02 : 0, ins = sx ? 0 : 0.12;
      put('b', bx, 0, bz, sx || 0.06, 0.12, sz ? sz - ins : 0.06, 0x8a6a4a); if (!o.noWains) put('b', wx, 0.12, wz, sx || 0.04, 0.78, sz ? sz - ins : 0.04, o.wains ?? 0xe2d4b8); }   // 걸레받이 6cm · 아래 벽판 4cm(옆벽 것은 모서리에서 6cm 들임)
    put('b', 0, H, 0, W + 0.4, 0.2, D + 0.4, o.ceil ?? 0xfbf8f0); col(-W / 2 - 1, W / 2 + 1, -D / 2 - 1, D / 2 + 1, -1.5, 0); col(-W / 2 - 1, W / 2 + 1, -D / 2 - 1, D / 2 + 1, H, H + 1);   // 천장 · 바닥 판(충돌) · 천장 판(충돌 — 카메라 실내 판정)
    const nx = Math.max(1, Math.round(W / 5)), nz = Math.max(1, Math.round(D / 5)); if (!o.noLights) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) put('c', -W / 2 + (i + 0.5) * W / nx, H - 0.03, -D / 2 + (j + 0.5) * D / nz, 0.35, 0.03, 0, 0xfff6dc, 1);   // 천장 등(빛)
    put('b', 0, 0, D / 2 - 0.06, 1.5, 2.3, 0.06, 0xe9e5dc); put('b', 0, 0, D / 2 - 0.1, 1.2, 2.15, 0.04, 0x7a4e2e); put('b', 0.42, 1.0, D / 2 - 0.14, 0.08, 0.08, 0.04, 0xd8b04a); put('b', 0, 0, D / 2 - 0.75, 1.4, 0.016, 0.9, 0x8a3a2e);   // 문틀 · 문 · 손잡이 · 문 앞 깔개
    for (const wy of o.winY || [1.0]) for (const s9 of [-1, 1]) { const n = Math.max(1, Math.floor(D / 4)); for (let k = 0; k < n; k++) { const z = -D / 2 + (k + 0.5) * D / n; put('b', s9 * (W / 2 - 0.04), wy, z, 0.04, 1.2, 1.3, 0xf7f6f2); put('b', s9 * (W / 2 - 0.065), wy + 0.05, z, 0.01, 1.1, 1.2, o.winC ?? 0xbfe3f5, 1); } }   // 옆 창(밖 = 하늘빛 판)
    const quadL = (a, b, c, d, hex, gl) => { const T = gl ? Ag : A, q = [a, b, c, d].map(v => [ox + v[0], oy + v[1], oz + v[2]]), n = nrm3(q[0], q[1], q[2]), m = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2], toC = [ox - m[0], oy + H / 2 - m[1], oz - m[2]], flip = n[0] * toC[0] + n[1] * toC[1] + n[2] * toC[2] < 0, cl = rgb(hex);   // 방 안쪽을 보는 네모(비스듬한 천장)
      const L9 = flip ? [q[0], q[3], q[2], q[0], q[2], q[1]] : [q[0], q[1], q[2], q[0], q[2], q[3]], nn = flip ? n.map(v => -v) : n; for (const v of L9) { T.p.push(v[0], v[1], v[2]); T.n.push(nn[0], nn[1], nn[2]); T.c.push(cl[0], cl[1], cl[2]); } };
    return { A, Ag, put, cols, col, quadL, W, D, H, at }; }
  const nrm3 = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

  function finish(S) { const grp = new T3.Group(); grp.userData.fx = 1; for (const [A, mat] of [[S.A, MAT], [S.Ag, GLOW]]) { const m = meshOf(A, mat); if (m) grp.add(m); } for (const m of S.extra || []) grp.add(m); map.add(grp); return grp; }
  const seatAt = (seats, sx, sz, y, yaw, back) => seats.push({ seat: [sx, y, sz], yaw, stand: [sx - Math.sin(yaw) * back, y, sz - Math.cos(yaw) * back] });   // 좌석 + 그 뒤 서는 자리(yaw = 보는 쪽)
  function sitGuest(S, seats, i, k) { const s = seats[i]; if (!s) return; s.taken = true; guest((k9, a, y, b, sx, sy, sz, hex, r9) => part(S.A, k9, a, y, b, sx, sy, sz, hex, r9 || 0), s.seat[0], s.seat[1], s.seat[2], s.yaw, k, true); }
  const standGuest = (S, x, y, z, ry, k) => guest((k9, a, y9, b, sx, sy, sz, hex, r9) => part(S.A, k9, a, y9, b, sx, sy, sz, hex, r9 || 0), x, y, z, ry, k, false);

  // ── 집 안 도우미(로컬 = 방 가운데 · 문 = +z) ──
  const putF = (S, id, x, z, ry = 0, y = 0) => { const c = Math.cos(ry), s9 = Math.sin(ry); furniture(id, (k, lx, ly, lz, sx, sy, sz, hex, gl) => part(gl ? S.Ag : S.A, k, S.at[0] + x + lx * c + lz * s9, S.at[1] + y + ly, S.at[2] + z - lx * s9 + lz * c, sx, sy, sz, hex, ry)); };   // 가구(앞 = ry 쪽)
  const colL = (S, x, z, hx, hz, y0, y1) => S.col(x - hx, x + hx, z - hz, z + hz, y0, y1);
  const seatL = (S, seats, x, z, y, yaw, back = 0.55) => seatAt(seats, S.at[0] + x, S.at[2] + z, S.at[1] + y, yaw, back);
  const PR = (S, k, x, y, z, sx, sy, sz, hex, ry = 0, rx = 0) => part(S.A, k, S.at[0] + x, S.at[1] + y, S.at[2] + z, sx, sy, sz, hex, ry, rx);
  function wwin(S, side, u, y, w, h, o = {}) { const P = S.put, fr = o.fr ?? 0xf7f6f2, gl = o.gl ?? 0xbfe3f5, X = side === 'L' ? -S.W / 2 : side === 'R' ? S.W / 2 : null, Z = side === 'B' ? -S.D / 2 : side === 'F' ? S.D / 2 : null;   // 벽 창(틀 · 빛 판 · 창살 · 창턱)
    if (X != null) { const s9 = -Math.sign(X); P('b', X + s9 * 0.03, y - 0.08, u, 0.06, h + 0.16, w + 0.16, fr); P('b', X + s9 * 0.065, y, u, 0.01, h, w, gl, 1); if (o.mull !== false) P('b', X + s9 * 0.075, y, u, 0.01, h, 0.05, fr); if (o.sill !== false) P('b', X + s9 * 0.12, y - 0.13, u, 0.16, 0.05, w + 0.3, fr); }
    else { const s9 = -Math.sign(Z); P('b', u, y - 0.08, Z + s9 * 0.03, w + 0.16, h + 0.16, 0.06, fr); P('b', u, y, Z + s9 * 0.065, w, h, 0.01, gl, 1); if (o.mull !== false) P('b', u, y, Z + s9 * 0.075, 0.05, h, 0.01, fr); if (o.sill !== false) P('b', u, y - 0.13, Z + s9 * 0.12, w + 0.3, 0.05, 0.16, fr); } }
  function planks(S, hex, y0 = 0.14, gap = 0.3) { const P = S.put, W = S.W, D = S.D; for (let y = y0; y < S.H - 0.3; y += gap) { P('b', 0, y, -D / 2 + 0.006, W - 0.03, 0.025, 0.012, hex); P('b', 0, y, D / 2 - 0.006, W - 0.03, 0.025, 0.012, hex); P('b', -W / 2 + 0.006, y, 0, 0.012, 0.025, D - 0.03, hex); P('b', W / 2 - 0.006, y, 0, 0.012, 0.025, D - 0.03, hex); } }   // 나무 판벽 줄
  function stairsL(S, x0, x1, zL, zH, y0, y1, n, hx = 0xa8794a, hx2 = 0x9b6d40) { const dz = (zH - zL) / n, dy = (y1 - y0) / n; for (let k = 0; k < n; k++) { const za = zL + k * dz, zb = za + dz, t = y0 + (k + 1) * dy; S.put('b', (x0 + x1) / 2, y0, (za + zb) / 2, x1 - x0, t - y0, Math.abs(dz), k % 2 ? hx : hx2); S.col(x0, x1, Math.min(za, zb), Math.max(za, zb), y0 - 0.5, t); } }   // 계단(zL 낮은 끝 → zH 높은 끝)
  function railL(S, x0, z0, x1, z1, y, hex = 0x5a3c26) { const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; if (Math.max(lx, lz) < 0.2) return; S.put('b', cx, y + 0.95, cz, lx || 0.06, 0.06, lz || 0.06, hex);
    for (let s9 = 0; s9 <= Math.max(lx, lz) + 0.01; s9 += 0.5) S.put('b', lx ? Math.min(x0, x1) + s9 : cx, y, lz ? Math.min(z0, z1) + s9 : cz, 0.04, 0.95, 0.04, hex); S.col(cx - (lx || 0.1) / 2, cx + (lx || 0.1) / 2, cz - (lz || 0.1) / 2, cz + (lz || 0.1) / 2, y, y + 1.05); }   // 난간(막힘)
  function ladderL(S, x, zB, zT, yT, hex = 0x8a5a34, w = 0.6) { const run = zB - zT, R9 = yT + 0.8, runT = run * R9 / yT, Lr = Math.hypot(runT, R9), ang = Math.atan2(R9, runT);   // 사다리(보이는 옆대·가로대 + 밟는 턱 0.3m — 걸어 오름)
    for (const s9 of [-1, 1]) S.put('b', x + s9 * w / 2, R9 / 2 - 0.04, zB - runT / 2, 0.06, 0.08, Lr, hex, 0, ang); for (let y = 0.3; y < yT; y += 0.3) S.put('b', x, y, zB - run * y / yT, w, 0.05, 0.05, hex);
    const n = Math.ceil(yT / 0.3); for (let k = 0; k < n; k++) S.col(x - w / 2, x + w / 2, zB - run * (k + 1) / n, zB - run * k / n, -0.5, Math.min(yT - 0.05, (k + 1) * 0.3)); }

  // 유은(나무 오두막 한 칸): 나무 판벽 · 작은 창 · 사다리 → 다락(이불) · 둥근 탁자 · 매단 등불
  function roomCabin(at) { const W = 7.2, D = 6.4, H = 3.8, S = shell(at, W, D, H, { wall: 0xc08a55, floor: 0x9b6a3c, floor2: 0xa8794a, noWains: true, ceil: 0xb07d4a, winY: [], noLights: true }), P = S.put, seats = [];
    planks(S, 0x94633a); for (let z = -D / 2 + 0.5; z < D / 2 - 0.2; z += 1.1) P('b', 0, H - 0.2, z, W - 0.03, 0.2, 0.16, 0x7a5232);   // 판 줄 · 서까래
    const fr = 0x6b4a2f; wwin(S, 'L', 1.4, 1.2, 0.6, 0.6, { fr }); wwin(S, 'R', 2.0, 1.2, 0.6, 0.6, { fr }); wwin(S, 'B', 0.8, 2.6, 0.8, 0.55, { fr, sill: false });   // 작은 창 셋
    const LY = 2.0, LD = 2.6, zE = -D / 2 + LD, T1 = LY + 0.15; P('b', 0, LY, -D / 2 + LD / 2, W, 0.15, LD, 0x8f6a3f); S.col(-W / 2, W / 2, -D / 2, zE, LY - 0.1, T1);   // 다락 마루
    for (const x of [-W / 2 + 0.25, 0.4]) { P('b', x, 0, zE - 0.1, 0.16, LY, 0.16, 0x7a5232); colL(S, x, zE - 0.1, 0.1, 0.1, -0.5, LY); }   // 받침 기둥
    ladderL(S, W / 2 - 1.0, zE + 1.75, zE, T1); railL(S, -W / 2 + 0.03, zE - 0.04, W / 2 - 1.4, zE - 0.04, T1, 0x7a5232); railL(S, W / 2 - 0.6, zE - 0.04, W / 2 - 0.03, zE - 0.04, T1, 0x7a5232);   // 사다리 · 다락 난간(사다리 자리 트임)
    P('b', -1.6, T1, -D / 2 + 1.25, 1.1, 0.12, 1.9, 0xf6f4ee); for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) P('b', -1.875 + i * 0.55, T1 + 0.12, -D / 2 + 0.875 + j * 0.45, 0.55, 0.03, 0.45, [0xe0453a, 0xf2c230, 0x3d74c9, 0x3cc76a, 0xf08fb2, 0xef8b33][(i + j * 2) % 6]); P('b', -1.6, T1 + 0.12, -D / 2 + 0.45, 0.6, 0.1, 0.25, 0xffffff);   // 다락 이불(조각 이불) · 베개
    P('b', 0.8, T1, -D / 2 + 0.5, 0.7, 0.12, 0.5, 0xe0453a); P('b', 0.8, T1 + 0.12, -D / 2 + 0.5, 0.66, 0.12, 0.46, 0xf2c230); P('b', 1.9, T1, -D / 2 + 0.4, 0.18, 0.04, 0.18, 0x3a2a1a); P('b', 1.9, T1 + 0.04, -D / 2 + 0.4, 0.14, 0.22, 0.14, 0xffd27a, 1);   // 갠 이불 · 다락 등불
    P('c', -1.2, 0, 1.5, 0.06, 0.7, 0, 0x7a5232); P('c16', -1.2, 0.7, 1.5, 0.55, 0.06, 0, 0xa8794a); colL(S, -1.2, 1.5, 0.45, 0.45, -0.5, 0.76); P('c16', -1.2, 0, 1.5, 1.4, 0.02, 0, 0xc2553a); P('c16', -1.2, 0, 1.5, 1.1, 0.026, 0, 0xe8a33a);   // 둥근 탁자 · 둥근 깔개
    for (const s9 of [-1, 1]) { P('c', -1.2 + s9 * 0.85, 0, 1.5, 0.2, 0.45, 0, 0x8a5a34); seatL(S, seats, -1.2 + s9 * 0.85, 1.5, 0, s9 > 0 ? -Math.PI / 2 : Math.PI / 2, 0.55); }   // 둥근 걸상 둘(앉기)
    P('b', -1.2, 2.75, 1.5, 0.02, H - 2.75, 0.02, 0x3a2a1a); P('b', -1.2, 2.75, 1.5, 0.28, 0.04, 0.28, 0x3a2a1a); P('b', -1.2, 2.45, 1.5, 0.22, 0.3, 0.22, 0xffd27a, 1);   // 매단 등불(빛)
    putF(S, 'd_i6', -2.0, -D / 2 + 0.25); colL(S, -2.0, -D / 2 + 0.25, 0.4, 0.22, -0.5, 1.2);   // 다락 밑 책장
    P('b', W / 2 - 0.45, 0, 2.3, 0.55, 0.5, 0.9, 0x8a5a34); P('b', W / 2 - 0.45, 0.5, 2.3, 0.58, 0.08, 0.93, 0x6b4a2f); colL(S, W / 2 - 0.45, 2.3, 0.3, 0.47, -0.5, 1.2); putF(S, 'd_i1', -W / 2 + 0.45, 2.7);   // 나무 상자 · 화분
    return { S, W, D, H, seats, items: ROOM_ITEMS.treehouse }; }

  // 하람(파란 시골집): 비스듬한 박공 천장 · 벽난로(돌) + 나무 난로(굴뚝 둘) · 흰 창틀 · 계단 → 지붕창 밑 다락방
  function roomCottage(at) { const W = 8.8, D = 7.6, HE = 3.0, HR = 5.0, S = shell(at, W, D, HR, { wall: 0xf4f1ea, wains: 0x2f5fb3, winY: [], noLights: true }), P = S.put, seats = [];
    for (const s9 of [-1, 1]) S.quadL([s9 * W / 2, HE, -D / 2], [0, HR, -D / 2], [0, HR, D / 2], [s9 * W / 2, HE, D / 2], 0xf7f4ec); P('b', 0, HR - 0.24, 0, 0.22, 0.24, D, 0x7a5232); for (const s9 of [-1, 1]) P('b', s9 * W / 4, (HE + HR) / 2 - 0.2, 0, 0.16, 0.18, D, 0x7a5232);   // 박공 천장 · 용마루 보 · 도리
    { const fz = 0.6, X0 = -W / 2; P('b', X0 + 0.3, 0, fz, 0.6, HE + 0.5, 1.8, 0xb8b2a6); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const z = fz - 0.6 + c * 0.6 + (r % 2) * 0.3; if (z + 0.2 > fz + 0.86 || z - 0.2 < fz - 0.86) continue; P('b', X0 + 0.605, 1.45 + r * 0.42, z, 0.01, 0.28, 0.4, (r + c) % 2 ? 0xa39d91 : 0xc9c3b6); }   // 돌 굴뚝 가슴 + 돌 무늬
      P('b', X0 + 0.615, 0.08, fz, 0.03, 0.85, 1.0, 0x2b2622); P('b', X0 + 0.95, 0, fz, 0.7, 0.08, 2.0, 0x9a948a); P('b', X0 + 0.85, 0.08, fz, 0.16, 0.12, 0.8, 0x6b4a2f); P('k', X0 + 0.8, 0.12, fz - 0.15, 0.18, 0.5, 0, 0xff8a2a, 1); P('k', X0 + 0.8, 0.12, fz + 0.18, 0.15, 0.4, 0, 0xffb347, 1); P('k', X0 + 0.82, 0.12, fz, 0.1, 0.62, 0, 0xffe066, 1);   // 불 아궁이 · 바닥 돌 · 장작 · 불꽃(빛)
      P('b', X0 + 0.75, 1.25, fz, 0.32, 0.1, 2.1, 0x7a5232); for (const s9 of [-1, 1]) { P('c', X0 + 0.75, 1.35, fz + s9 * 0.7, 0.04, 0.22, 0, 0xf6f4ee); P('s', X0 + 0.75, 1.6, fz + s9 * 0.7, 0.035, 1.6, 0, 0xffd27a, 1); } P('b', X0 + 0.75, 1.35, fz, 0.12, 0.3, 0.3, 0x5a3c26); S.col(X0, X0 + 0.6, fz - 0.9, fz + 0.9, -0.5, HE + 0.5); }   // 선반 · 초 · 시계
    { const sx = W / 2 - 0.6, sz = 2.2; P('b', sx, 0, sz, 0.7, 0.75, 0.6, 0x2b2d31); P('b', sx, 0.75, sz, 0.78, 0.05, 0.68, 0x3a3d42); P('b', sx - 0.36, 0.2, sz, 0.02, 0.3, 0.36, 0xff8a2a, 1); P('c', sx, 0.8, sz, 0.09, HE + 0.6 - 0.8, 0, 0x2b2d31); P('s', sx + 0.12, 0.88, sz - 0.12, 0.12, 0.8, 0, 0xe0453a); colL(S, sx, sz, 0.35, 0.3, -0.5, 1.2); }   // 나무 난로 + 연통(두 번째 굴뚝) · 주전자
    const ZA = -1.2, LY = 2.4, T1 = LY + 0.15; P('b', 0, LY, (-D / 2 + ZA) / 2, W, 0.15, ZA + D / 2, 0x8f6a3f); S.col(-W / 2, W / 2, -D / 2, ZA, LY - 0.1, T1);   // 다락방 마루
    for (const x of [-2.8, 2.8]) { P('b', x, 0, ZA - 0.1, 0.16, LY, 0.16, 0x7a5232); colL(S, x, ZA - 0.1, 0.1, 0.1, -0.5, LY); } stairsL(S, 0.6, 1.6, ZA + 2.4, ZA, 0, T1, 8); railL(S, -3.2, ZA - 0.04, 0.55, ZA - 0.04, T1, 0xf7f6f2); railL(S, 1.65, ZA - 0.04, 3.2, ZA - 0.04, T1, 0xf7f6f2);   // 받침 · 계단 · 흰 난간
    P('b', -1.6, T1, -D / 2 + 1.25, 1.0, 0.2, 1.9, 0x8a5a34); P('b', -1.6, T1 + 0.2, -D / 2 + 1.25, 0.94, 0.12, 1.84, 0xf6f4ee); P('b', -1.6, T1 + 0.32, -D / 2 + 1.5, 0.96, 0.04, 1.3, 0x3d74c9); P('b', -1.6, T1 + 0.32, -D / 2 + 0.55, 0.6, 0.1, 0.3, 0xffffff); colL(S, -1.6, -D / 2 + 1.25, 0.5, 0.95, T1, T1 + 1.0);   // 다락방 침대(파란 이불)
    wwin(S, 'B', -1.6, 3.15, 0.8, 0.7, { fr: 0xffffff, sill: false }); P('b', 1.9, T1, -D / 2 + 0.25, 1.0, 0.8, 0.3, 0xf6f4ee); for (let k = 0; k < 4; k++) P(k % 2 ? 's' : 'b', 1.55 + k * 0.23, T1 + 0.8, -D / 2 + 0.25, k % 2 ? 0.09 : 0.16, k % 2 ? 1 : 0.16, 0.16, [0xe0453a, 0xf2c230, 0x3cc76a, 0x3d74c9][k]); P('b', 0.2, T1, -2.6, 1.6, 0.02, 1.0, 0xe0453a);   // 지붕창(뒤 박공) · 장난감 선반 · 깔개
    putF(S, 'd_i6', -2.6, -D / 2 + 0.25); colL(S, -2.6, -D / 2 + 0.25, 0.4, 0.22, -0.5, 1.2);   // 다락 밑 책장
    P('b', 2.6, 0, -D / 2 + 0.3, 1.6, 0.85, 0.5, 0xf6f4ee); P('b', 2.6, 0.85, -D / 2 + 0.12, 1.6, 1.0, 0.24, 0xf6f4ee); for (let i = 0; i < 4; i++) P('c16', 2.6 - 0.55 + i * 0.37, 1.2, -D / 2 + 0.24, 0.14, 0.02, 0, i % 2 ? 0x2f5fb3 : 0xffffff, 0, Math.PI / 2); colL(S, 2.6, -D / 2 + 0.3, 0.8, 0.25, -0.5, 1.2);   // 그릇장(파랑·하양 접시)
    for (const z of [-0.1, 1.6]) { putF(S, 'armchair', -1.6, z, -Math.PI / 2); seatL(S, seats, -1.6, z, 0, -Math.PI / 2, 0.8); colL(S, -1.6, z, 0.38, 0.43, -0.5, 0.5); }   // 안락의자 둘(불을 봄 · 앉기)
    P('c', -1.7, 0, 0.75, 0.05, 0.55, 0, 0x7a5232); P('c16', -1.7, 0.55, 0.75, 0.32, 0.04, 0, 0xa8794a); P('s', -1.7, 0.67, 0.75, 0.1, 0.9, 0, 0xffffff); P('c16', -2.4, 0, 0.75, 1.3, 0.02, 0, 0xc2553a); P('c16', -2.4, 0, 0.75, 1.0, 0.026, 0, 0xf2c230);   // 찻주전자 탁자 · 둥근 깔개
    wwin(S, 'F', -2.4, 1.0, 1.0, 1.1); wwin(S, 'F', 2.4, 1.0, 1.0, 1.1); wwin(S, 'R', -0.2, 1.0, 1.1, 1.1);   // 흰 창틀 셋
    P('b', 0, 3.4, 1.8, 0.02, HR - 0.24 - 3.4, 0.02, 0x3a2a1a); P('s', 0, 3.3, 1.8, 0.2, 1, 0, 0xffe7a8, 1);   // 매단 등
    return { S, W, D, H: HR, seats, items: ROOM_ITEMS['blue-cottage'] }; }

  // 예지(보라 타운하우스): 1층 거실·부엌 · 오른쪽 계단 → 2층 침실 · 발코니 문
  function roomTownhouse(at) { const W = 7.2, D = 8.0, FH = 3.2, H = 6.4, S = shell(at, W, D, H, { wall: 0xebe2f4, wains: 0x7a4fb8, winY: [] }), P = S.put, seats = [];
    const XE = W / 2 - 1.25, SX0 = W / 2 - 1.15, SX1 = W / 2 - 0.08, ZL = D / 2 - 1.4, ZH = -D / 2 + 1.6;
    P('b', (XE - W / 2) / 2, FH - 0.15, 0, XE + W / 2, 0.15, D, 0xc49a66); S.col(-W / 2, XE, -D / 2, D / 2, FH - 0.15, FH); P('b', (XE + W / 2) / 2, FH - 0.15, (-D / 2 + ZH) / 2, W / 2 - XE, 0.15, ZH + D / 2, 0xc49a66); S.col(XE, W / 2, -D / 2, ZH, FH - 0.15, FH);   // 2층 마루 · 계단참
    stairsL(S, SX0, SX1, ZL, ZH, 0, FH, 12); railL(S, XE - 0.05, ZH, XE - 0.05, D / 2, FH, 0x7a4fb8); for (const [x, z] of [[-1.6, -2], [-1.6, 1.6], [0.8, 0]]) P('c', x, FH - 0.18, z, 0.3, 0.03, 0, 0xfff6dc, 1);   // 계단 · 2층 난간 · 1층 천장 등
    putF(S, 'd_i8', -W / 2 + 0.6, 1.6, Math.PI / 2); seatL(S, seats, -W / 2 + 0.66, 1.6, 0, Math.PI / 2, 0.85); colL(S, -W / 2 + 0.6, 1.6, 0.4, 1.1, -0.5, 1.2); putF(S, 'd_i7', 1.7, 1.6, -Math.PI / 2); colL(S, 1.7, 1.6, 0.25, 0.75, -0.5, 1.2);   // 소파 · TV
    putF(S, 'd_i16', -0.8, 1.6, Math.PI / 2); P('b', -1.2, 0, 1.6, 0.6, 0.4, 1.0, 0x7a5232); colL(S, -1.2, 1.6, 0.3, 0.5, -0.5, 0.42); putF(S, 'd_i2', -W / 2 + 0.4, 3.0);   // 깔개 · 낮은 탁자 · 램프
    P('b', -W / 2 + 0.45, 0, -D / 2 + 0.4, 0.8, 1.9, 0.7, 0xf6f6f2); P('b', -W / 2 + 0.75, 0.9, -D / 2 + 0.76, 0.04, 0.6, 0.03, 0x9aa0a6); colL(S, -W / 2 + 0.45, -D / 2 + 0.4, 0.4, 0.35, -0.5, 1.9);   // 냉장고
    P('b', -0.5, 0, -D / 2 + 0.35, 4.2, 0.88, 0.62, 0xf2efe8); P('b', -0.5, 0.88, -D / 2 + 0.35, 4.24, 0.05, 0.66, 0x8a8f95); P('b', -1.2, 0.93, -D / 2 + 0.36, 0.6, 0.01, 0.4, 0x5f6670); P('c', -1.2, 0.93, -D / 2 + 0.12, 0.025, 0.3, 0, 0xc0c4c8); for (const [a, b] of [[-0.15, -0.13], [0.15, -0.13], [-0.15, 0.13], [0.15, 0.13]]) P('c16', 0.8 + a, 0.93, -D / 2 + 0.35 + b, 0.09, 0.01, 0, 0xe0453a, 1);   // 부엌 조리대 · 개수대 · 화구(빛)
    P('b', -0.5, 1.55, -D / 2 + 0.18, 4.2, 0.65, 0.34, 0xf6f6f2); colL(S, -0.5, -D / 2 + 0.35, 2.12, 0.33, -0.5, 1.2);   // 위 찬장
    P('b', -1.2, 0.72, -1.6, 1.2, 0.05, 0.8, 0x8a5a34); for (const [a, b] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) P('b', -1.2 + a, 0, -1.6 + b, 0.05, 0.72, 0.05, 0x8a5a34); colL(S, -1.2, -1.6, 0.6, 0.4, -0.5, 0.77); putF(S, 'in_chair_front', -1.2, -2.35); putF(S, 'in_chair_back', -1.2, -0.85); seatL(S, seats, -1.2, -2.35, 0, 0, 0.6); seatL(S, seats, -1.2, -0.85, 0, Math.PI, 0.6);   // 식탁 · 의자 둘
    wwin(S, 'L', -1.4, 1.0, 1.0, 1.2, { fr: 0xffffff }); wwin(S, 'F', -2.0, 1.0, 1.0, 1.2, { fr: 0xffffff });   // 1층 창
    putF(S, 'd_i10', -2.2, -D / 2 + 0.95, 0, FH); colL(S, -2.2, -D / 2 + 0.95, 0.72, 0.8, FH - 0.2, FH + 1.2); putF(S, 'd_i5', 0.4, -D / 2 + 0.4, 0, FH); colL(S, 0.4, -D / 2 + 0.4, 0.72, 0.33, FH - 0.2, FH + 1.2); putF(S, 'in_chair_back', 0.4, -D / 2 + 1.15, 0, FH); seatL(S, seats, 0.4, -D / 2 + 1.15, FH, Math.PI, 0.6);   // 2층 침대 · 책상 · 의자
    P('b', -W / 2 + 0.35, FH, 0.8, 0.6, 2.0, 1.2, 0xd9c8ec); P('b', -W / 2 + 0.655, FH + 0.1, 0.8, 0.01, 1.8, 0.02, 0x7a4fb8); for (const s9 of [-1, 1]) P('b', -W / 2 + 0.66, FH + 1.0, 0.8 + s9 * 0.08, 0.02, 0.12, 0.03, 0xd8b04a); colL(S, -W / 2 + 0.35, 0.8, 0.3, 0.6, FH - 0.2, FH + 2.0);   // 옷장
    putF(S, 'd_i15', -0.9, 0.4, 0, FH); wwin(S, 'F', -1.0, FH + 0.04, 1.4, 2.2, { fr: 0x7a4fb8, gl: 0xcfe8ff, sill: false }); P('b', -1.0, FH, D / 2 - 0.5, 1.2, 0.016, 0.6, 0x7a4fb8); putF(S, 'd_i1', 0.3, D / 2 - 0.4, 0, FH);   // 발코니 문(유리 두 짝) · 깔개 · 화분
    wwin(S, 'L', 1.2, FH + 1.0, 1.0, 1.2, { fr: 0xffffff }); wwin(S, 'B', -2.2, FH + 1.4, 0.9, 0.8, { fr: 0xffffff });   // 2층 창
    return { S, W, D, H, seats, items: ROOM_ITEMS['purple-townhouse'] }; }

  // 지원(크림 교외 집 · 카드 '침대·책상·방·주방'): 넓은 거실(소파·TV) · 열린 주방(조리대·냉장고·식탁) · 따로 방(침대·책상·옷장 · 장난감 카트)
  function roomSuburb(at) { const W = 12, D = 9.6, H = 3.2, S = shell(at, W, D, H, { wall: 0xf7f0e2, wains: 0xd9c4a0, winY: [] }), P = S.put, seats = [], wc = 0xf7f0e2;
    P('b', 1.9375, 0, -0.6, 0.925, H, 0.15, wc); P('b', 4.7, 0, -0.6, 2.6, H, 0.15, wc); P('b', 1.4, 0, (-D / 2 - 0.525) / 2, 0.15, H, D / 2 - 0.525, wc); S.col(1.475, 2.4, -0.675, -0.525, -0.5, H); S.col(3.4, 6, -0.675, -0.525, -0.5, H); S.col(1.325, 1.475, -D / 2, -0.525, -0.5, H);   // 방 칸막이(문 자리 1m)
    putF(S, 'd_i10', 4.4, -D / 2 + 0.95); colL(S, 4.4, -D / 2 + 0.95, 0.72, 0.8, -0.5, 1.2); putF(S, 'd_i5', 2.4, -D / 2 + 0.4); colL(S, 2.4, -D / 2 + 0.4, 0.72, 0.33, -0.5, 1.2); putF(S, 'in_chair_back', 2.4, -D / 2 + 1.15); seatL(S, seats, 2.4, -D / 2 + 1.15, 0, Math.PI, 0.6);   // 침대 · 책상 · 의자
    P('b', W / 2 - 0.35, 0, -1.6, 0.6, 2.1, 1.3, 0xf2efe8); P('b', W / 2 - 0.655, 0.1, -1.6, 0.01, 1.9, 0.02, 0xc9b48e); colL(S, W / 2 - 0.35, -1.6, 0.3, 0.65, -0.5, 2.1); putF(S, 'd_i15', 3.9, -2.0);   // 옷장 · 깔개
    P('b', 2.6, 0.12, -1.5, 0.6, 0.18, 1.0, 0xe0453a); P('b', 2.6, 0.3, -1.35, 0.4, 0.22, 0.35, 0x2b2d31); for (const [a, b] of [[-1, -0.35], [1, -0.35], [-1, 0.35], [1, 0.35]]) PR(S, 'c', 2.6 + a * 0.3 + (a > 0 ? 0 : -0.1), 0.13, -1.5 + b, 0.13, 0.1, 0, 0x2b2d31, Math.PI / 2, Math.PI / 2); PR(S, 'c16', 2.6, 0.42, -1.72, 0.12, 0.02, 0, 0x2b2d31, 0, 1.2);   // 장난감 카트(빨강 · 바퀴 넷 · 운전대)
    wwin(S, 'B', 4.4, 1.3, 1.2, 0.9); wwin(S, 'R', -3.4, 1.0, 1.0, 1.1);   // 방 창
    P('b', -W / 2 + 0.45, 0, -D / 2 + 0.4, 0.8, 1.95, 0.7, 0xf6f6f2); P('b', -W / 2 + 0.75, 0.9, -D / 2 + 0.76, 0.04, 0.6, 0.03, 0x9aa0a6); P('b', -W / 2 + 0.45, 1.2, -D / 2 + 0.755, 0.78, 0.01, 0.01, 0xc9cdd2); colL(S, -W / 2 + 0.45, -D / 2 + 0.4, 0.4, 0.35, -0.5, 1.95);   // 냉장고
    P('b', -2.05, 0, -D / 2 + 0.35, 5.9, 0.88, 0.62, 0xf2efe8); P('b', -2.05, 0.88, -D / 2 + 0.35, 5.94, 0.05, 0.66, 0x8a8f95); P('b', -2.4, 0.93, -D / 2 + 0.38, 0.6, 0.012, 0.4, 0x5f6670); P('c', -2.4, 0.93, -D / 2 + 0.12, 0.025, 0.3, 0, 0xc0c4c8); colL(S, -2.05, -D / 2 + 0.35, 2.97, 0.33, -0.5, 1.2);   // 조리대 · 개수대
    P('b', -0.4, 0.93, -D / 2 + 0.35, 0.62, 0.01, 0.55, 0x2b2d31); for (const [a, b] of [[-0.15, -0.13], [0.15, -0.13], [-0.15, 0.13], [0.15, 0.13]]) P('c16', -0.4 + a, 0.94, -D / 2 + 0.35 + b, 0.09, 0.01, 0, 0xe0453a, 1); P('b', -0.4, 0.15, -D / 2 + 0.665, 0.56, 0.55, 0.02, 0x2b2d31); P('b', -0.4, 1.45, -D / 2 + 0.3, 0.7, 0.1, 0.5, 0x9aa0a6);   // 화구(빛) · 오븐 문 · 후드
    for (const [a, b] of [[-5.0, -3.0], [-1.8, 0.9]]) P('b', (a + b) / 2, 1.55, -D / 2 + 0.18, b - a, 0.65, 0.34, 0xf6f6f2); wwin(S, 'B', -2.4, 1.3, 1.0, 0.8);   // 위 찬장 · 개수대 위 창
    P('b', -2.6, 0.72, -2.4, 1.6, 0.05, 0.9, 0x8a5a34); for (const [a, b] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) P('b', -2.6 + a, 0, -2.4 + b, 0.05, 0.72, 0.05, 0x8a5a34); colL(S, -2.6, -2.4, 0.8, 0.45, -0.5, 0.77);   // 식탁
    for (const x of [-3.0, -2.2]) { putF(S, 'in_chair_front', x, -3.15); seatL(S, seats, x, -3.15, 0, 0, 0.6); putF(S, 'in_chair_back', x, -1.65); seatL(S, seats, x, -1.65, 0, Math.PI, 0.6); }   // 의자 넷(앉기)
    putF(S, 'd_i7', -W / 2 + 0.3, 2.0, Math.PI / 2); colL(S, -W / 2 + 0.3, 2.0, 0.25, 0.75, -0.5, 1.2); putF(S, 'd_i8', -1.9, 2.0, -Math.PI / 2); seatL(S, seats, -1.96, 2.0, 0, -Math.PI / 2, 0.85); colL(S, -1.9, 2.0, 0.4, 1.1, -0.5, 1.2);   // TV · 큰 소파
    putF(S, 'armchair', -2.4, 3.9, -Math.PI / 2); seatL(S, seats, -2.4, 3.9, 0, -Math.PI / 2, 0.8); colL(S, -2.4, 3.9, 0.38, 0.43, -0.5, 0.5); P('b', -3.7, 0, 2.0, 0.7, 0.42, 1.2, 0x7a5232); colL(S, -3.7, 2.0, 0.35, 0.6, -0.5, 0.42); putF(S, 'd_i16', -3.7, 2.0, Math.PI / 2);   // 안락의자 · 낮은 탁자 · 깔개
    putF(S, 'd_i12', 4.0, 0.03); colL(S, 4.0, -0.25, 0.75, 0.28, -0.5, 1.2); putF(S, 'd_i2', -1.2, 3.9); for (const [x, z] of [[5.5, 4.3], [-5.5, 4.3], [0.9, -0.2]]) putF(S, 'd_i1', x, z);   // 책장 · 램프 · 화분
    wwin(S, 'F', -3.5, 1.0, 1.4, 1.2); wwin(S, 'F', 3.5, 1.0, 1.4, 1.2); wwin(S, 'R', 2.4, 1.0, 1.6, 1.2); wwin(S, 'L', -2.4, 1.2, 1.0, 1.0);   // 거실·부엌 창
    return { S, W, D, H, seats, items: ROOM_ITEMS['cream-suburban-fountain'] }; }

  // ── 기본 방(모르는 집 모습 · ✨) ──
  function roomHome(at, decos) { const L = (decos && decos.length ? decos : DEFAULT_ROOM).filter(d => d && typeof d.id === 'string' && Number.isFinite(d.col) && Number.isFinite(d.row)), sz = d => SIZE[d.id] || [1, 1];
    let c0 = 1e9, c1 = -1e9, r1 = -1e9; for (const d of L) { const [w, h] = sz(d); c0 = Math.min(c0, d.col); c1 = Math.max(c1, d.col + w); r1 = Math.max(r1, d.row + h); } if (!L.length) { c0 = 0; c1 = 12; r1 = 6; }
    c0 -= 1; c1 += 1; r1 += 3; if (c1 - c0 < 12) { const e = (12 - (c1 - c0)) / 2; c0 -= Math.floor(e); c1 += Math.ceil(e); } if (r1 < 9) r1 = 9;   // 방 크기 = 꾸민 범위 + 둘레 한 칸 + 문 앞 세 줄(가장 작게 12 × 9칸)
    const CS = INDOOR_CS, W = (c1 - c0) * CS, D = r1 * CS, H = 3.4, S = shell(at, W, D, H, {}), [ox, oy, oz] = at, X = c => ox - W / 2 + (c - c0) * CS, Z = r => oz - D / 2 + r * CS, seats = [];
    for (const d of L) { const [w, h] = sz(d), cx = X(d.col + w / 2), cz = Z(d.row + h / 2);
      if (WALL_IDS[d.id]) { wallItem(d.id, (k, x, y, z, sx, sy, sz2, hex, gl, rx) => part(gl ? S.Ag : S.A, k, cx + x, oy + y, oz - D / 2 + 0.045 + z, sx, sy, sz2, hex, 0, rx || 0)); continue; }   // 뒷벽(아래 벽판 4cm + 0.5cm 앞)
      const zc = d.row === 0 ? Z(0) + Math.max(0.36, h * CS / 2) : cz; furniture(d.id, (k, x, y, z, sx, sy, sz2, hex, gl) => part(gl ? S.Ag : S.A, k, cx + x, oy + y, zc + z, sx, sy, sz2, hex));
      if (!FLAT[d.id]) S.cols.push({ x0: cx - w * CS * 0.45, x1: cx + w * CS * 0.45, z0: zc - h * CS * 0.45, z1: zc + h * CS * 0.45, y0: oy - 0.5, y1: oy + 1.2 });   // 가구 = 몸 막힘(위로 올라서지 않게 1.2m)
      if (d.id === 'd_i8') seatAt(seats, cx, zc + 0.08, oy, 0, 0.85);   // 소파 = 앞을 봄
      if (d.id === 'd_i14') seatAt(seats, cx, zc + 0.12, oy, 0, 0.85);
      if (d.id === 'in_chair_front') seatAt(seats, cx, zc, oy, 0, 0.6); if (d.id === 'in_chair_back') seatAt(seats, cx, zc, oy, Math.PI, 0.6); }
    return { S, W, D, H, seats, n: L.length, def: !(decos && decos.length), items: ROOM_ITEMS.home }; }

  // ── 아쿠아리움(🙋 33 유은: 수조 위 보트 · 머리 위 아치 수중 터널 · 클리오네 · 작은 동물 방) ──
  function roomAqua(at) { const W = 26, D = 18, H = 5.4, S = shell(at, W, D, H, { wall: 0x23405e, wains: 0x1c3550, floor: 0x3a4a5c, floor2: 0x34444f, ceil: 0x1d3048, winY: [] }), [ox, oy, oz] = at, P = (k, x, y, z, sx, sy, sz, hex, gl, rx) => part(gl ? S.Ag : S.A, k, ox + x, oy + y, oz + z, sx, sy, sz, hex, 0, rx || 0), anim = [];
    for (const s9 of [-1, 1]) for (let k = 0; k < 3; k++) { const z = -D / 2 + 3 + k * 5.5, tx = s9 * (W / 2 - 0.75); P('b', tx, 0, z, 1.2, 0.6, 4.2, 0x2b3a4a); P('b', tx, 0.6, z, 1.1, 3.4, 4.0, 0x2f8fc8, 1); S.col(tx - 0.6, tx + 0.6, z - 2.1, z + 2.1, -0.5, 4.0);
      for (let f = 0; f < 6; f++) P('b', s9 * (W / 2 - 1.315), 1.0 + (f % 3) * 0.9, z - 1.5 + f * 0.6, 0.02, 0.18, 0.4, [0xef8b33, 0xf2c230, 0xe0453a, 0xffffff][f % 4]); }   // 벽 수조(빛) + 물고기
    const TZ0 = -D / 2 + 1.5, NT = 10; for (let i = 0; i < NT; i++) { const z = TZ0 + (i + 0.5) * 1.0; for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI; P('b', Math.cos(t) * 2.6, Math.sin(t) * 3.0, z, 0.24, 0.24, 0.94, (a + i) % 2 ? 0x3fa8dc : 0x56b8e6, 1); } }   // 머리 위 아치 수중 터널(빛 띠 · 1m마다)
    for (const s9 of [-1, 1]) S.col(s9 * 2.75 - 0.15, s9 * 2.75 + 0.15, TZ0, TZ0 + NT, -0.5, 2.0);   // 터널 옆은 막힘(끝으로 드나듦)
    { const A = newA(); for (let f = 0; f < 12; f++) { const a = f / 12 * 6.2832; part(A, 'b', Math.cos(a) * 2.0, 1.9 + Math.sin(a * 3) * 0.3, Math.sin(a) * 3.6, 0.36, 0.16, 0.06, [0xef8b33, 0xf2c230, 0xe0453a, 0xffffff, 0x7fd0f0][f % 5], -a); }
      const m = meshOf(A, GLOW); if (m) { m.matrixAutoUpdate = true; m.position.set(ox, oy, oz + TZ0 + NT / 2); S.extra = [m]; anim.push({ m, spin: 0.3 }); } }   // 터널 안을 도는 물고기 떼
    { const bx = -7, bz = D / 2 - 4.6; P('b', bx, 0, bz, 7, 1.1, 3.6, 0x2b3a4a); P('b', bx, 1.1, bz, 6.8, 0.04, 3.4, 0x3fb8d8, 1); S.col(bx - 3.5, bx + 3.5, bz - 1.8, bz + 1.8, -0.5, 1.15);   // 큰 수조(위가 물낯)
      P('b', bx - 1.0, 1.14, bz, 2.2, 0.35, 1.0, 0xf6f4ee); P('b', bx - 0.8, 1.49, bz, 1.2, 0.1, 0.8, 0xe0453a); P('c', bx - 1.6, 1.49, bz, 0.03, 0.8, 0, 0x8a5a34); P('b', bx + 1.6, 1.14, bz + 0.7, 0.7, 0.2, 0.5, 0xf2c230); }   // 수조 위 보트 · 노란 작은 배
    { const cx = W / 2 - 3.2, cz = -D / 2 + 1.2; P('b', cx, 0, cz, 2.6, 0.7, 1.4, 0x2b3a4a); P('b', cx, 0.7, cz, 2.5, 1.6, 1.3, 0x9fd8f0, 1); S.col(cx - 1.3, cx + 1.3, cz - 0.7, cz + 0.7, -0.5, 2.3);
      for (let k = 0; k < 5; k++) { P('s', cx - 0.9 + k * 0.45, 1.3 + (k % 2) * 0.35, cz + 0.68, 0.09, 1.6, 0, 0xf6f4ff, 1); P('s', cx - 0.9 + k * 0.45, 1.42 + (k % 2) * 0.35, cz + 0.7, 0.04, 1, 0, 0xff8a6a, 1); } }   // 클리오네 작은 수조(하얀 몸 · 주황 속)
    { const fx = -W / 2 + 4.8, fz = -D / 2 + 3.2; P('b', fx, 0, fz, 5, 0.03, 4, 0x9ad07a); for (const [a, b, sx, sz] of [[0, 2, 5.08, 0.08], [2.5, 0, 0.08, 4], [-2.5, 0, 0.08, 4]]) P('b', fx + a, 0, fz + b, sx, 0.6, sz, 0xd8cfb8); S.col(fx - 2.6, fx + 2.6, fz + 1.95, fz + 2.05, -0.5, 0.6); S.col(fx - 2.6, fx - 2.4, fz - 2, fz + 2, -0.5, 0.6); S.col(fx + 2.4, fx + 2.6, fz - 2, fz + 2, -0.5, 0.6);
      for (let k = 0; k < 4; k++) { const ax = fx - 1.5 + k * 1.0, az = fz - 0.6 + (k % 2) * 1.0, c9 = k % 2 ? 0xf6f4ee : 0xc9a27a; P('s', ax, 0.24, az, 0.22, 0.75, 0, c9); P('s', ax + 0.18, 0.4, az, 0.12, 1, 0, c9); P('b', ax + 0.16, 0.46, az - 0.06, 0.04, 0.18, 0.04, c9); P('b', ax + 0.16, 0.46, az + 0.06, 0.04, 0.18, 0.04, c9); } }   // 작은 동물 방(풀밭 · 낮은 울 · 토끼·기니피그)
    [[-3.6, 0.5, 2, 2.4], [4.4, 1.5, 1, -1.2], [-W / 2 + 2.4, -1.0, 4, -Math.PI / 2], [W / 2 - 2.4, 3.6, 2, Math.PI / 2], [3.5, -6.5, 6, Math.PI], [-7, 1.7, 5, 0]].forEach(([x, z, k, ry]) => standGuest(S, ox + x, oy, oz + z, ry, k));   // 손님 여섯(이름 없음)
    return { S, W, D, H, anim, seats: [], items: ROOM_ITEMS.aqua }; }

  // ── 키즈 카페(🙋 28.1 지원: 여러 층 철골 정글짐 · 계단 둘 · 그물 다리 · 탑 미끄럼 · 공 풀 · 네온) ──
  function roomKids(at) { const W = 30, D = 22, H = 9, S = shell(at, W, D, H, { wall: 0xfdf4e4, wains: 0xf2c230, floor: 0x7fc8a0, floor2: 0x72bc94 }), [ox, oy, oz] = at, P = (k, x, y, z, sx, sy, sz, hex, gl, rx) => part(gl ? S.Ag : S.A, k, ox + x, oy + y, oz + z, sx, sy, sz, hex, 0, rx || 0), CL = [0xe0453a, 0x2f6fd0, 0xf2c230, 0x3cc76a, 0xf08fb2, 0x8a5bd1], hot = [], seats = [], col = S.col;
    const gx0 = -13, gx1 = 3, gz0 = -9.5, gz1 = -2.5, Y1 = 2.4, Y2 = 4.8, FT = 0.12, l2 = gx1 - 3, T1 = Y1 + FT, T2 = Y2 + FT;
    for (let x = gx0; x <= gx1 + 0.01; x += 4) for (const z of [gz0, gz1]) { P('b', x, 0, z, 0.16, 7.2, 0.16, CL[((x - gx0) / 4) % 6 | 0]); col(x - 0.1, x + 0.1, z - 0.1, z + 0.1, -0.5, 7.2); }   // 철골 기둥(4m마다)
    P('b', (gx0 + gx1) / 2, Y1, (gz0 + gz1) / 2, gx1 - gx0 + 0.3, FT, gz1 - gz0 + 0.3, 0xef8b33); col(gx0 - 0.15, gx1 + 0.15, gz0 - 0.15, gz1 + 0.15, Y1 - 0.1, T1);   // 1층 마루
    P('b', (gx0 + l2) / 2, Y2, (gz0 + gz1) / 2, l2 - gx0 + 0.3, FT, gz1 - gz0 + 0.3, 0x5f8fd0); col(gx0 - 0.15, l2 + 0.15, gz0 - 0.15, gz1 + 0.15, Y2 - 0.1, T2);   // 2층 마루(오른쪽 3m = 계단 자리 비움)
    P('b', (l2 + gx1) / 2 + 0.15, Y2, gz0 + 0.425, gx1 - l2, FT, 1.15, 0x5f8fd0); col(l2 + 0.15, gx1 + 0.15, gz0 - 0.15, gz0 + 1.0, Y2 - 0.1, T2);   // 2층 계단참
    for (let k = 0; k < 14; k++) { const z0 = gz1 + (13 - k) * 0.45, t = (k + 1) * 0.17; P('b', gx0 + 1.5, 0, z0 + 0.225, 1.2, t, 0.45, k % 2 ? 0xd8cfb8 : 0xcfc5ac); col(gx0 + 0.9, gx0 + 2.1, z0, z0 + 0.45, -0.5, t); }   // 계단 A(바닥 → 1층 · 앞에서 안쪽으로 오름)
    { const dz = (gz1 - (gz0 + 1.0)) / 14, dy = (T2 - T1) / 14; for (let k = 0; k < 14; k++) { const z1 = gz1 - k * dz, t = T1 + (k + 1) * dy; P('b', gx1 - 1.5, T1, z1 - dz / 2, 1.2, t - T1, dz, k % 2 ? 0xd8cfb8 : 0xcfc5ac); col(gx1 - 2.1, gx1 - 0.9, z1 - dz, z1, T1 - 0.1, t); } }   // 계단 B(1층 → 2층 계단참)
    const rail = (x0, z0, x1, z1, y) => { const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0); if (Math.max(lx, lz) < 0.2) return; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; for (const [yy, hh] of [[0.95, 0.06], [0.48, 0.05]]) P('b', cx, y + yy, cz, lx || 0.06, hh, lz || 0.06, 0x3cc76a);
      for (let s = 0; s <= Math.max(lx, lz) + 0.01; s += 1.0) P('b', lx ? Math.min(x0, x1) + s : cx, y, lz ? Math.min(z0, z1) + s : cz, 0.05, 0.95, 0.05, 0x2f8a5a); col(cx - (lx || 0.1) / 2, cx + (lx || 0.1) / 2, cz - (lz || 0.1) / 2, cz + (lz || 0.1) / 2, y, y + 1.05); };   // 그물 난간(막힘)
    const E = 0.12; rail(gx0 - E, gz1 + E, gx0 + 0.9, gz1 + E, T1); rail(gx0 + 2.1, gz1 + E, gx1 + E, gz1 + E, T1); rail(gx0 - E, gz0 - E, gx1 + E, gz0 - E, T1); rail(gx0 - E, gz0 - E, gx0 - E, gz1 + E, T1); rail(gx1 + E, gz0 - E, gx1 + E, -6.8, T1); rail(gx1 + E, -5.2, gx1 + E, gz1 + E, T1);   // 1층 둘레(계단 A · 그물 다리 자리는 트임)
    rail(gx0 - E, gz1 + E, l2 + E, gz1 + E, T2); rail(gx0 - E, gz0 - E, gx1 + E, gz0 - E, T2); rail(gx0 - E, gz0 - E, gx0 - E, gz1 + E, T2); rail(l2 + E, gz0 + 1.0, l2 + E, gz1 + E, T2); rail(gx1 + E, gz0 - E, gx1 + E, gz0 + 1.0, T2); rail(l2 + 0.15, gz0 + 1.0, gx1 - 2.1, gz0 + 1.0, T2); rail(gx1 - 0.9, gz0 + 1.0, gx1 + E, gz0 + 1.0, T2);   // 2층 둘레(계단 B 자리는 트임)
    for (let k = 0; k < 4; k++) { const x = gx0 + 2.4 + k * 3.6, z = gz0 + 1.2; P('b', x, T1, z, 0.9, 0.5, 0.9, CL[k % 6]); col(x - 0.45, x + 0.45, z - 0.45, z + 0.45, T1 - 0.1, T1 + 0.5); if (k < 3) { P('s', x, T2 + 0.35, z + 2.2, 0.35, 1, 0, CL[(k + 3) % 6]); col(x - 0.3, x + 0.3, z + 1.9, z + 2.5, T2 - 0.1, T2 + 0.6); } }   // 놀이 상자 · 2층 큰 공
    const bx0 = gx1 + 0.15, bx1 = 9.7, NB = 14; for (let k = 0; k < NB; k++) { const t = (k + 0.5) / NB, x = bx0 + t * (bx1 - bx0), w9 = (bx1 - bx0) / NB, top = T1 - 0.05 - 0.22 * Math.sin(Math.PI * t); P('b', x, top - 0.05, -6, w9 - 0.05, 0.05, 1.5, k % 2 ? 0x3cc76a : 0x2f8a5a); col(x - w9 / 2, x + w9 / 2, -6.75, -5.25, top - 0.4, top);   // 그물 다리(가운데 22cm 처짐)
      for (const s9 of [-1, 1]) { P('b', x, top + 0.9, -6 + s9 * 0.78, w9, 0.05, 0.05, 0x3cc76a); P('b', x - w9 / 2 + 0.03, top, -6 + s9 * 0.78, 0.04, 0.9, 0.04, 0x2f8a5a); } }
    for (const s9 of [-1, 1]) col(bx0, bx1, -6 + s9 * 0.78 - 0.05, -6 + s9 * 0.78 + 0.05, Y1 - 0.6, T1 + 1.0);   // 다리 옆 그물(막힘)
    { const tx = 10.5, tz = -6; P('b', tx, 0, tz, 1.6, 2.4, 1.6, 0x2f6fd0); P('b', tx, 2.4, tz, 1.7, 0.08, 1.7, 0xf2c230); col(tx - 0.8, tx + 0.8, tz - 0.8, tz + 0.8, -0.5, 2.48);   // 다리 끝 탑
      for (const [px, pz] of [[tx + 0.8, tz - 0.8], [tx + 0.8, tz + 0.8], [tx - 0.8, tz - 0.8]]) P('b', px, 2.48, pz, 0.05, 0.95, 0.05, 0xe0453a); P('b', tx + 0.8, 3.43, tz, 0.05, 0.05, 1.65, 0xe0453a); P('b', tx, 3.43, tz - 0.8, 1.65, 0.05, 0.05, 0xe0453a); col(tx - 0.85, tx + 0.85, tz - 0.85, tz - 0.75, 2.48, 3.5); col(tx + 0.75, tx + 0.85, tz - 0.85, tz + 0.85, 2.48, 3.5);   // 탑 위 난간(뒤·오른쪽 — 왼쪽 = 다리 · 앞 = 미끄럼)
      const zs = tz + 0.8, ze = 0.6, ys = 2.42, ye = 0.08, L9 = Math.hypot(ze - zs, ys - ye), ang = Math.atan2(ys - ye, ze - zs); P('b', tx, (ys + ye) / 2, (zs + ze) / 2, 1.1, 0.08, L9, 0xf2c230, 0, ang);   // 미끄럼판(비스듬)
      for (const s9 of [-1, 1]) P('b', tx + s9 * 0.58, (ys + ye) / 2, (zs + ze) / 2, 0.06, 0.3, L9, 0xe0453a, 0, ang); for (const z of [zs + 1.2, (zs + ze) / 2 + 0.6]) P('b', tx + 0.6, 0, z, 0.08, ys - (z - zs) / (ze - zs) * (ys - ye) - 0.1, 0.08, 0x9aa0a6);   // 미끄럼 옆판 · 받침
      col(tx - 0.62, tx + 0.62, zs, ze, -0.5, 0.35);   // 미끄럼 밑(걸어서 지나가지 않게 · 낮게)
      hot.push({ kind: 'slide', label: en ? '🎢 Slide down' : '🎢 미끄럼 타기', at: [tx, 2.48, tz + 0.2], from: [tx, 2.5, tz + 0.75], to: [tx, 0.05, ze + 0.7], yaw: 0, dur: 1.4 }); }
    { const px = 10, pz = 5.5; P('b', px, 0, pz, 6, 0.6, 5, 0x2f6fd0); for (let k = 0; k < 108; k++) P('s', px - 2.7 + (k % 12) * 0.49, 0.55 + ((k * 7) % 3) * 0.06, pz - 2.2 + Math.floor(k / 12) * 0.55, 0.2, 1, 0, CL[k % 6]); col(px - 3, px + 3, pz - 2.5, pz + 2.5, -0.5, 0.25); }   // 공 풀(발이 공 속에 잠김)
    for (const [x, z, sx, sz, c9] of [[0, -D / 2 + 0.06, W - 1, 0.06, 0xff5fb4], [-W / 2 + 0.06, 0, 0.06, D - 1, 0x5fe0ff], [W / 2 - 0.06, 0, 0.06, D - 1, 0xffe066]]) P('b', x, H - 0.8, z, sx, 0.12, sz, c9, 1);   // 네온 띠(빛)
    [[-6, 6], [-2, 6], [2, 6]].forEach(([x, z], i) => { P('c', x, 0, z, 0.06, 0.72, 0, 0x5f6670); P('c', x, 0.72, z, 0.6, 0.05, 0, 0xf6f4ee); col(x - 0.6, x + 0.6, z - 0.6, z + 0.6, -0.5, 0.77);
      for (const s9 of [-1, 1]) { P('b', x + s9 * 0.95, 0, z, 0.42, 0.45, 0.42, CL[(i + 1) % 6]); seatAt(seats, ox + x + s9 * 0.95, oz + z, oy, s9 > 0 ? -Math.PI / 2 : Math.PI / 2, 0.5); } });   // 어른 쉼 탁자(앉기)
    standGuest(S, ox + gx0 + 3.6, oy + T1, oz + gz0 + 3, 0.5, 0); standGuest(S, ox + gx0 + 6, oy + T2, oz + gz0 + 4.2, 2.4, 3); standGuest(S, ox + 9.4, oy + 0.25, oz + 5, 1, 6); standGuest(S, ox + 8.8, oy, oz + 1.8, 3.1, 9); sitGuest(S, seats, 1, 4); sitGuest(S, seats, 4, 7);   // 손님(아이 넷 · 어른 둘 앉음)
    return { S, W, D, H, hot, seats, items: ROOM_ITEMS.kids }; }

  // ── 보드게임 카페(카드: 1층 음식점 · 2층 상점가 · 3층 보드게임) — 세 층 + 오른쪽 계단 두 줄(A 1→2층 · B 2→3층) ──
  function roomBoard(at) { const W = 16, D = 13, FH = 3.6, H = FH * 3, S = shell(at, W, D, H, { wall: 0xf2eadc, wains: 0x8a5bd1, floor: 0xb98a55, winY: [1.0, FH + 1.0, FH * 2 + 1.0] }), [ox, oy, oz] = at, P = (k, x, y, z, sx, sy, sz, hex, gl, rx) => part(gl ? S.Ag : S.A, k, ox + x, oy + y, oz + z, sx, sy, sz, hex, 0, rx || 0), seats = [], col = S.col;
    const XE = 4.8, AX0 = 4.85, AX1 = 6.35, BX0 = 6.45, BX1 = 7.95, ZF = D / 2 - 1.0, ZB = -D / 2 + 3.3, n = 16, dz = (ZF - ZB) / n, dy = FH / n;
    for (let f = 1; f < 3; f++) { const y = f * FH; P('b', (XE - W / 2) / 2, y - 0.15, 0, XE + W / 2, 0.15, D, 0xc49a66); col(-W / 2, XE, -D / 2, D / 2, y - 0.15, y);   // 2·3층 마루(오른쪽 계단 자리 비움)
      for (let i = 0; i < 4; i++) P('c', -W / 2 + 2 + i * 3.4, y - 0.18, 0, 0.32, 0.03, 0, 0xfff6dc, 1); }   // 아래층 천장 등(빛)
    P('b', (XE + W / 2) / 2, FH - 0.15, (-D / 2 + ZB) / 2, W / 2 - XE, 0.15, ZB + D / 2, 0xc49a66); col(XE, W / 2, -D / 2, ZB, FH - 0.15, FH);   // 2층 계단참(뒤)
    P('b', (XE + W / 2) / 2, FH * 2 - 0.15, (ZF + D / 2) / 2, W / 2 - XE, 0.15, D / 2 - ZF, 0xc49a66); col(XE, W / 2, ZF, D / 2, FH * 2 - 0.15, FH * 2);   // 3층 계단참(앞 · 계단 A 위 · 계단 B 끝)
    for (let k = 0; k < n; k++) { const z1 = ZF - k * dz, t = (k + 1) * dy; P('b', (AX0 + AX1) / 2, 0, z1 - dz / 2, AX1 - AX0, t, dz, k % 2 ? 0xa8794a : 0x9b6d40); col(AX0, AX1, z1 - dz, z1, -0.5, t); }   // 계단 A(1층 앞 → 2층 계단참)
    for (let k = 0; k < n; k++) { const z0 = ZB + k * dz, t = FH + (k + 1) * dy; P('b', (BX0 + BX1) / 2, FH, z0 + dz / 2, BX1 - BX0, t - FH, dz, k % 2 ? 0xa8794a : 0x9b6d40); col(BX0, BX1, z0, z0 + dz, FH - 0.1, t); }   // 계단 B(2층 계단참 → 3층 앞)
    const rail = (x0, z0, x1, z1, y, slope) => { const lx = Math.abs(x1 - x0), lz = Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (slope) { const L9 = Math.hypot(lz, FH), ang = Math.atan2(FH, lz) * slope; P('b', cx, y + FH / 2 + 0.9, cz, 0.06, 0.06, L9, 0x5a3c26, 0, ang); col(cx - 0.05, cx + 0.05, Math.min(z0, z1), Math.max(z0, z1), y, y + FH + 1.05); return; }   // 기울어진 손잡이(계단 따라)
      P('b', cx, y + 0.95, cz, lx || 0.06, 0.06, lz || 0.06, 0x5a3c26); for (let s = 0; s <= Math.max(lx, lz) + 0.01; s += 0.6) P('b', lx ? Math.min(x0, x1) + s : cx, y, lz ? Math.min(z0, z1) + s : cz, 0.04, 0.95, 0.04, 0x5a3c26); col(cx - (lx || 0.1) / 2, cx + (lx || 0.1) / 2, cz - (lz || 0.1) / 2, cz + (lz || 0.1) / 2, y, y + 1.05); };   // 난간(막힘)
    rail(XE - 0.05, ZB, XE - 0.05, D / 2, FH); rail(XE - 0.05, -D / 2, XE - 0.05, ZF, FH * 2); rail(XE, ZF - 0.03, BX0 - 0.03, ZF - 0.03, FH * 2); rail(BX0 - 0.05, ZB, BX0 - 0.05, ZF, FH, -1);   // 2층 가장자리 · 3층 가장자리 · 3층 계단참 뒤 · 계단 B 옆
    for (const [x, z] of [[-5, -3], [-1, -3], [-5, 1.5], [-1, 1.5]]) { P('b', x, 0.72, z, 1.6, 0.06, 1.0, 0x8a5a34); P('b', x, 0, z, 0.12, 0.72, 0.12, 0x5a3c26); col(x - 0.8, x + 0.8, z - 0.5, z + 0.5, -0.5, 0.78);
      for (const s9 of [-1, 1]) { P('b', x, 0, z + s9 * 0.85, 0.42, 0.45, 0.42, 0xe0453a); seatAt(seats, ox + x, oz + z + s9 * 0.85, oy, s9 > 0 ? Math.PI : 0, 0.5); } P('c', x - 0.35, 0.78, z, 0.15, 0.02, 0, 0xf6f4ee); P('c', x + 0.35, 0.78, z, 0.15, 0.02, 0, 0xf6f4ee); }   // 1층 음식점 탁자(접시)
    P('b', -W / 2 + 3, 0, D / 2 - 2.2, 4, 1.05, 0.7, 0x8a5a34); P('b', -W / 2 + 3, 1.05, D / 2 - 2.2, 4.1, 0.06, 0.8, 0xe9e2d0); col(-W / 2 + 0.95, -W / 2 + 5.05, D / 2 - 2.6, D / 2 - 1.8, -0.5, 1.11);   // 계산대
    for (const [x, z, c9] of [[-5.5, -4.6, 0xe0453a], [-2.5, -4.6, 0x3d74c9], [0.5, -4.6, 0xf2c230], [-5.5, 3.2, 0x3cc76a], [-2.5, 3.2, 0xf08fb2], [0.5, 3.2, 0xef8b33]]) { const y = FH, bk = z < 0 ? -1 : 1; P('b', x, y, z, 2.2, 1.0, 0.9, 0xd8d4ca); for (let k = 0; k < 6; k++) P('b', x - 0.8 + k * 0.32, y + 1.0, z, 0.24, 0.2 + (k % 3) * 0.08, 0.24, c9); P('b', x, y + 1.0, z + bk * 0.42, 2.2, 1.1, 0.06, c9); col(x - 1.1, x + 1.1, z - 0.5, z + 0.5, y - 0.2, y + 1.0); }   // 2층 상점가 가판(물건 · 뒤 색 판)
    for (const [x, z] of [[-5, -2.4], [-1.5, -2.4], [-5, 1.6], [-1.5, 1.6]]) { const y = FH * 2; P('b', x, y + 0.72, z, 1.3, 0.06, 1.3, 0x5a3c26); P('b', x, y, z, 0.12, 0.72, 0.12, 0x3a2414); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) P('b', x - 0.36 + a * 0.24, y + 0.78, z - 0.36 + b * 0.24, 0.23, 0.01, 0.23, (a + b) % 2 ? 0xf6f4ee : 0x2b2d31); P('b', x + 0.45, y + 0.79, z + 0.45, 0.14, 0.14, 0.14, 0xffffff); P('b', x - 0.45, y + 0.79, z + 0.48, 0.3, 0.03, 0.2, 0xe0453a);   // 3층 보드게임(판 · 주사위 · 카드)
      for (const s9 of [-1, 1]) { P('b', x + s9 * 0.95, y, z, 0.42, 0.45, 0.42, 0x8a5bd1); seatAt(seats, ox + x + s9 * 0.95, oz + z, oy + y, s9 > 0 ? -Math.PI / 2 : Math.PI / 2, 0.5); } col(x - 0.65, x + 0.65, z - 0.65, z + 0.65, y - 0.2, y + 0.78); }
    for (let k = 0; k < 3; k++) { P('b', -W / 2 + 0.04, k * FH + 2.3, -2.5, 0.04, 0.55, 3.2, [0xef8b33, 0x3cc76a, 0x8a5bd1][k], 1); for (let j = 0; j <= k; j++) P('s', -W / 2 + 0.07, k * FH + 2.575, -3.6 + j * 0.5, 0.12, 1, 0, 0xffffff, 1); }   // 층 표시 띠(빛 · 흰 점 = 층 수)
    sitGuest(S, seats, 0, 1); sitGuest(S, seats, 5, 5); standGuest(S, ox - 4, oy + FH, oz - 3.3, Math.PI, 2); standGuest(S, ox + 1.8, oy + FH, oz + 0.5, -1.2, 6); sitGuest(S, seats, 8, 3); sitGuest(S, seats, 11, 7);   // 손님(1층 둘 · 2층 둘 · 3층 둘)
    return { S, W, D, H, seats, items: ROOM_ITEMS.board }; }

  // ── 들어가기·나가기 ──
  const HOMES = { treehouse: roomCabin, 'blue-cottage': roomCottage, 'purple-townhouse': roomTownhouse, 'cream-suburban-fountain': roomSuburb };
  function enter(o) { exit(); const at = o.at, made = o.kind === 'aqua' ? roomAqua(at) : o.kind === 'kids' ? roomKids(at) : o.kind === 'board' ? roomBoard(at) : HOMES[o.look] ? HOMES[o.look](at) : roomHome(at, null), S = made.S;
    const grp = finish(S), cols = S.cols.map(c => onCollider(c)), hots = [], [ox, oy, oz] = at, D = made.D;
    hots.push(map.interact.add({ kind: 'game', x: ox, y: oy, z: oz + D / 2 - 0.9, r: 1.5, label: en ? '🚪 Go outside' : '🚪 밖으로 나가기', use: () => o.onExit && o.onExit() }));
    for (const s of made.seats || []) if (!s.taken) hots.push(map.interact.add({ kind: 'sit', x: s.stand[0], y: s.stand[1], z: s.stand[2], yaw: s.yaw, seat: { x: s.seat[0], y: s.seat[1], z: s.seat[2], yaw: s.yaw }, r: 0.9, label: en ? '💺 Sit' : '💺 앉기' }));
    for (const h of made.hot || []) hots.push(map.interact.add({ kind: h.kind, x: ox + h.at[0], y: oy + h.at[1], z: oz + h.at[2], r: 1.2, label: h.label, from: [ox + h.from[0], oy + h.from[1], oz + h.from[2]], to: [ox + h.to[0], oy + h.to[1], oz + h.to[2]], yaw: h.yaw, dur: h.dur }));
    cur = { o, grp, cols, hots, anim: made.anim || [], made, spawn: [ox, oy + 0.05, oz + D / 2 - 2.6] }; setNight(night); return cur; }
  function exit() { if (!cur) return null; const c = cur; cur = null; map.remove(c.grp); c.grp.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); for (const h of c.cols) removeCollider(h); for (const h of c.hots) h.remove(); return c.o; }
  function setNight(v) { night = !!v; MAT.emissive.setHex(night ? 0x2a2622 : 0x000000); }   // 밤 = 방 안 등이 켜진 것처럼 조금 밝게(새 빛 없음)
  return {
    enter, exit, setNight, get active() { return cur ? cur.o : null }, get spawn() { return cur ? cur.spawn : null },
    get info() { return cur ? { kind: cur.o.kind, look: cur.o.look || null, items: (cur.made.items || []).map(t => (kidItem(t, cur.o.kid) ? '🙋 ' : '✨ ') + t), W: cur.made.W, D: cur.made.D, H: cur.made.H, cols: cur.cols.length, hots: cur.hots.length, seats: (cur.made.seats || []).filter(s => !s.taken).length, tris: cur.grp.children.reduce((s, m) => s + (m.geometry ? m.geometry.attributes.position.count / 3 : 0), 0), meshes: cur.grp.children.length, at: cur.o.at } : null },
    tick(dt) { if (!cur) return; for (const a of cur.anim) if (a.spin) a.m.rotation.y += dt * a.spin; },
    dispose() { exit(); for (const k in G) G[k].dispose(); MAT.dispose(); GLOW.dispose(); },
  };
}
