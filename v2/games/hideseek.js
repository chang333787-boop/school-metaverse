// 숨바꼭질 2(GAME-HS2 · 09-27 사용자 "아이디어는 좋은데 게임성이 있나 싶어 — 술래가 다가오면 그냥 끝나는데 그게 의도한 건가?")
//   예전(GAME-HS): 1초 보이면 끝 → 이제 '들키면 달리기'가 시작이다(숨바꼭질 + 얼음땡). 정본 = docs/map_api.md §15
//   A. 🙈 숨고 달리기(3라운드): 술래 로봇이 🏠집(기둥·큰 나무·로비)에서 10을 세는 동안 친구 로봇 셋과 함께 숨는다.
//      들키면(❗) 쫓기기 — ① 🏠집에 먼저 닿으면 '찜!'(안전 · 점수) ② 모퉁이를 돌아 눈을 피한 뒤 다시 숨기(술래가 들어가는 걸 못 봤으면 못 찾음).
//      잡히면 ❄얼음 — 친구 로봇이 달려와 '땡!' 해 준다 · 얼어붙은 친구 로봇은 내가 닿아서 구한다(얼음땡).
//      ⚡힘(달리기 = Shift · 조이스틱 끝)은 닳고, 쉬거나 🏠집에서 찬다 · 술래는 판이 갈수록(그리고 한 판 안에서도) 빨라진다 · 3라운드엔 술래 둘.
//      점수 = 버틴 초 ×2 + 찜 50 + 구하기 40 + 라운드 버팀 100 + 끝까지 안 얼은 친구 20.
//   B. 🔍 술래 되기(3라운드): 로봇 4~5개가 숨는다 → '🔍 살펴보기'로 찾으면 로봇이 🏠집으로 도망 → 닿기 전에 터치해서 잡기(잡기 100 · 집에 닿으면 찜 30).
//      👀 엿보기(H · 칩) = 3초 동안 20m 안 로봇이 벽 너머로 보임(라운드마다 3·2·2번) · 삐빅 소리 · 2라운드부터 멀리 있는 로봇이 몰래 자리를 옮김.
//   라운드마다 세상이 바뀐다(map.world): 불 꺼진 방(어두운 곳에선 술래 눈이 짧다) · 닫힌 문(길이 바뀜) · 운동장 상자·컨테이너(웅크려 숨는 엄폐물) · 노을.
//   구역(판마다 하나): 서관 1층 · 운동장+큰 나무 · 급식실+동쪽 복도 — zones 계약 + 빨간 경계 띠 · 밖으로 나가면 되돌림.
// 규칙(_template.js · §16.1): import 금지(three = map.three) · 새 조명 없음 · 사람(NPC)은 술래·목표·배우가 아니다(술래·친구·숨는 것 = 이름 없는 장난감 로봇) ·
//   화면 글 = 놀이 설명·UI 문구·장소 이름(Claude 작성 — 실제 인물 대사 없음) · 매 프레임 새 객체 없음(감지·두뇌 10Hz · 길 찾기 한 프레임에 하나)
export const meta = { id: 'hideseek', title: '숨바꼭질', api: 1 };

const COUNT = 10, R2D = Math.PI / 180, N_SLOT = 5, HEAR = [0, 2.2, 6.5, 13];
// A 라운드: time 초 · patrol 걷기 · chase [처음, 끝] 쫓는 속도(한 판 안에서 오름) · range 눈 거리 배수 · hear 귀 배수 · checkP 숨는 자리 확인 확률 · seekers 술래 수 · run 친구 로봇 달리기
const RA = [
  { time: 60, patrol: 1.7, chase: [4.3, 5.1], range: 1.0, hear: 1.0, checkP: 0.55, seekers: 1, run: 4.1 },
  { time: 75, patrol: 1.9, chase: [4.7, 5.7], range: 1.12, hear: 1.2, checkP: 0.65, seekers: 1, run: 4.4 },
  { time: 90, patrol: 2.1, chase: [5.0, 6.2], range: 1.25, hear: 1.35, checkP: 0.72, seekers: 2, run: 4.7 },
];
// B 라운드: bots 숨는 로봇 수 · run 도망 속도 · peeks 엿보기 횟수 · sneak 몰래 옮기기
const RB = [
  { time: 100, bots: 4, run: 4.0, peeks: 3, sneak: false },
  { time: 110, bots: 5, run: 4.6, peeks: 2, sneak: true },
  { time: 120, bots: 5, run: 5.1, peeks: 2, sneak: true },
];
const SC = { sec: 2, home: 50, rescue: 40, round: 100, friend: 20, tag: 100, safe: 30 };
// 숨는 자리: 실제 가구·장소 자리(월드 좌표) — k = 엔진 숨는 자리 종류 · f = 앞면 방위° · eye = 틈새 눈 높이 · st = 서는 칸
//   home = 🏠집(술래가 세는 곳 — 닿으면 찜) · 집 3.2m 안 숨는 자리는 쓰지 않는다 · fx = 라운드마다 세상 바꾸기
const AREAS = {
  west: {
    title: '서관 1층', icon: '🏫', homeLabel: '로비 기둥',
    zones: ['nurse', 'narae', 'library', 'west-lobby', 'west-door', 'stair-store', 'stair-west', 'stair-landing', 'corridor-main'],
    clip: [-40.2, -44.7, -11, -31.4], ymax: 2,
    home: { x: -29.6, z: -34.6, r: 1.6 }, seeker: { at: [-29.6, -36.6], h: 180 }, start: [-27.2, -36.2], startH: 90, range: 9,
    fx: { 2: { dark: ['library', 'narae'] }, 3: { dark: ['library', 'nurse'], doors: [31] } },   // 31 = 로비↔도서실 문(도서실은 계단 쪽 문으로 돌아감)
    spots: [
      { x: -37.2, z: -42.9, k: 'curtain', l: '보건실 침대 커튼 뒤', f: 180 },
      { x: -36.2, z: -42.9, k: 'desk', l: '보건실 침대 밑', f: 180, eye: 0.35, st: [-36.2, -41.3] },
      { x: -38.05, z: -39.05, k: 'cabinet', l: '보건실 장 옆', f: 90 },
      { x: -34, z: -41.3, k: 'locker', l: '나래반 사물함', f: 90, w: 2.5 },
      { x: -31.5, z: -44.1, k: 'locker', l: '나래반 뒤 사물함', f: 180, w: 5, st: [-30.75, -43.35] },
      { x: -18.3, z: -41.75, k: 'cabinet', l: '책장 사이 끝 칸', f: 90 },
      { x: -22.2, z: -39.75, k: 'cabinet', l: '책장 사이 안쪽 칸', f: 270 },
      { x: -20.2, z: -35.6, k: 'desk', l: '도서실 책상 밑' },
      { x: -24.35, z: -38.65, k: 'desk', l: '사서 책상 밑' },
      { x: -20.9, z: -33.6, k: 'locker', l: '복도 사물함', f: 180, w: 9.6 },
      { x: -29.6, z: -34.6, k: 'bush', l: '로비 기둥 뒤', eye: 0.8, f: 0, st: [-29.6, -36.3] },
    ],
  },
  field: {
    title: '운동장 + 큰 나무', icon: '🌳', homeLabel: '큰 나무',
    zones: ['field', 'bball-sand', 'forest-play', 'podium', 'front-slope', 'front-bed-south', 'south-plaza'],
    clip: [0, -17.5, 39.7, 49.4], ymax: 1,
    home: { x: 36.8, z: 28.4, r: 1.9 }, seeker: { at: [36.5, 26.9], h: 180 }, start: [31.5, 22.5], startH: 200, range: 12,
    fx: { 2: { time: 'sunset', props: [['crate', 14, 8], ['crate', 20, 20], ['crate', 10, 26], ['crate', 24, 32], ['crate', 17, 14.5]] },
      3: { time: 'sunset', props: [['container', 14, 12, 0, 0x4f8fd8], ['container', 20, 28, 90, 0xe07a4a], ['crate', 9, 20], ['crate', 25, 18], ['crate', 12, 33], ['crate', 26, 6]] } },
    spots: [
      { x: 36.8, z: 28.4, k: 'tree', l: '큰 나무 구멍', w: 1.4 },
      { x: 33.2, z: 30.9, k: 'desk', l: '평상 밑', eye: 0.35, w: 3 },
      { x: 35.75, z: 32.2, k: 'bush', l: '벤치 뒤', f: 90, eye: 0.75 },
      { x: 35.3, z: 33.8, k: 'bush', l: '나무 조각 뒤', eye: 0.8, f: 180, st: [35.4, 34.4] },
      { x: 31.4, z: 47.4, k: 'desk', l: '숲놀이터 데크 밑', eye: 0.5, w: 1.6, f: 270, st: [29.7, 47.3] },
      { x: 35.1, z: 47.4, k: 'desk', l: '숲놀이터 데크 밑 동쪽', eye: 0.5, w: 1.6, f: 180, st: [35.1, 49.1] },
      { x: 27.7, z: 14.55, k: 'bush', l: '골대 그물 안', f: 270, eye: 0.8, w: 2 },
      { x: 27, z: -16.3, k: 'bush', l: '둔덕 덤불 속' },
      { x: 32.6, z: -16.4, k: 'bush', l: '둔덕 덤불 속' },
      { x: 36.6, z: -16.1, k: 'bush', l: '둔덕 덤불 속' },
      { x: 3.8, z: -16.6, k: 'bush', l: '구령대 옆 덤불' },
      { x: 10.8, z: -14.6, k: 'desk', l: '구령대 탁자 밑' },
    ],
  },
  cafe: {
    title: '급식실 + 동쪽 복도', icon: '🍚', homeLabel: '가운데 로비',
    zones: ['cafeteria', 'center-lobby', 'link-corridor', 'corridor-east', 'music-passage'],
    clip: null, ymax: 2,
    home: { x: 12.4, z: -35.1, r: 1.5 }, seeker: { at: [12.6, -35.4], h: 180 }, start: [5.5, -42.2], startH: 180, range: 9,
    fx: { 2: { dark: ['cafeteria'] }, 3: { dark: ['cafeteria', 'music-passage'], doors: [42] } },   // 42 = 음악 통로↔세로복도 문
    spots: [
      { x: 8.8, z: -48.2, k: 'curtain', l: '급식실 커튼 뒤', f: 180, w: 2.2 },
      { x: 3.8, z: -48.2, k: 'curtain', l: '급식실 커튼 뒤', f: 180, w: 4.5, st: [3.0, -47.8] },
      { x: -0.35, z: -43.6, k: 'desk', l: '배식대 뒤', f: 90, eye: 0.75, w: 2 },
      { x: 1.9, z: -45.9, k: 'desk', l: '식탁 밑', f: 90, st: [3.0, -45.9] },
      { x: 4.3, z: -41.5, k: 'desk', l: '식탁 밑', f: 90, st: [5.4, -41.5] },
      { x: 6.7, z: -37.1, k: 'desk', l: '식탁 밑', f: 90, st: [7.8, -37.0] },
      { x: 9.45, z: -46.6, k: 'cabinet', l: '큰 냉장고 옆', f: 180 },
      { x: 9.45, z: -49.5, k: 'cabinet', l: '악기장 사이', f: 270, st: [8.4, -49.5] },
      { x: 12.15, z: -36.25, k: 'cabinet', l: '로비 장 옆' },
      { x: 12.0, z: -40.5, k: 'corner', l: '세로복도 모퉁이', eye: 1.0 },
      { x: 21.1, z: -49.2, k: 'corner', l: '복도 기둥 뒤', eye: 1.0 },
      { x: 31.6, z: -49.8, k: 'corner', l: '동관 복도 끝', eye: 1.0 },
    ],
  },
};
const AREA_KEYS = ['west', 'field', 'cafe'];
const SHOW_KIND = { desk: 0.5, bush: 0.6, corner: 0.62, slide: 0.55 };   // 몸이 조금 보이는 자리 → 웅크린 장난감 크기 · 나머지 = 속에 숨어 안 보임
const BOT_C = [0xffd9a0, 0xbfe8ff, 0xd8c8ff, 0xc8f0c0, 0xffc8d8], ICE_C = 0x9fdcff, PEEK_C = 0xffe36a, SEEK_C = 0xff8f80;   // 술래 = 빨간 로봇
const FX_MSG = { dark: '💡 불 꺼진 방이 생겼어요 — 어두운 곳에선 술래 눈이 짧아요', doors: '🚪 문 하나가 닫혔어요 — 길이 바뀌었어요', props: '📦 상자·컨테이너가 생겼어요 — 뒤에 웅크리면 안 보여요', time: '🌇 노을이 졌어요' };
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const STAM_TXT = ['⚡□□□□□', '⚡■□□□□', '⚡■■□□□', '⚡■■■□□', '⚡■■■■□', '⚡■■■■■'], TIRED_TXT = '😮‍💨 헉헉… 쉬어요';
const NEAR_TXT = Array.from({ length: 16 }, (_, i) => (i <= 4 ? '💓💓 ' : '💓 ') + i + 'm');
const OPA = Array.from({ length: 11 }, (_, i) => String(i / 10));

export default async function start(map, params = {}) {
  const THREE = map.three;
  let dead = false, st = 'prep', mode = null, areaKey = null, A = null, R = null, rn = 0, RD = null, T = 0, cd = 0, cdShown = -1, secShown = -1, t10 = 0, last = null;
  const seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now();
  const rng = map.rng(seed);
  const startRound = Math.max(1, Math.min(3, +params.round || 1)), timeOver = +params.time ? Math.max(10, Math.min(600, +params.time)) : 0;
  const RR = [];                                  // 이번 라운드에 만든 것(숨는 자리·술래·살펴보기·경계·세상 바꾸기) — 라운드가 바뀌면 뗀다
  const own = h => { if (h) RR.push(h); return h; };
  const time0 = map.time ? map.time() : null;

  map.player.freeze(true);
  map.hud.banner('숨바꼭질 준비 중…', 30);
  map.sfx('warm');
  const nav = await map.nav();
  if (dead || map.gone) return {};                // 길격자를 짓는 사이 ⏹ 그만하기 → 범위가 이미 정리됨(map.gone)
  map.hud.banner('', 0.01);

  // ---------- 구역 판정 · 숨는 자리 풀기(구역마다 처음 한 번) ----------
  const ids = new Map();
  const inAreaK = (k, x, y, z) => { const a = AREAS[k], c = a.clip; if (c && (x < c[0] || x > c[2] || z < c[1] || z > c[3])) return false; if (y > a.ymax) return false;
    const zn = map.zoneAt(x, y, z); return !!zn && ids.get(k).has(zn.id); };
  const inArea = (x, y, z) => inAreaK(areaKey, x, y, z);
  const RES = new Map();
  function resolveArea(k) {
    if (RES.has(k)) return RES.get(k);
    const a = AREAS[k]; ids.set(k, new Set(a.zones.map(z => (map.zone(z) || {}).id).filter(Boolean)));
    const spots = [];
    for (const d of a.spots) {
      const st0 = d.st ? [d.st[0], map.q.floorY(d.st[0], d.st[1]), d.st[1]] : undefined;
      if (st0 && map.q.blocked(st0[0], st0[2], st0[1])) console.warn('[hideseek] 정한 서는 칸이 막힘', k, d.l, st0);
      const h = map.hide.add({ x: d.x, z: d.z, y: d.y, face: d.f, w: d.w, kind: d.k, label: d.l, eye: d.eye, near: a.start, stand: st0 });
      const s = h.spot; h.remove();
      if (!s) { console.warn('[hideseek] 숨는 자리를 못 놓음', k, d.l, d.x, d.z); continue; }
      if (!inAreaK(k, s.stand.x, s.stand.y, s.stand.z)) { console.warn('[hideseek] 서는 칸이 구역 밖', k, d.l, s.stand); continue; }
      if (Math.hypot(s.stand.x - a.home.x, s.stand.z - a.home.z) < 3.2 || Math.hypot(s.x - a.home.x, s.z - a.home.z) < 2.2) continue;   // 🏠집 바로 옆은 숨는 자리가 아니다
      spots.push({ x: s.x, y: s.y, z: s.z, face: s.face, w: s.w, kind: d.k, label: d.l, eye: s.eye, stand: [s.stand.x, s.stand.y, s.stand.z], lastT: -99, hs: null, ok: true });
    }
    const hy = map.q.floorY(a.seeker.at[0], a.seeker.at[1]);   // 집 바닥 = 술래가 세는 칸(기둥 받침 윗면이 아니라)
    const r = { spots, edges: tapeEdges(k), home: [a.home.x, hy, a.home.z] };
    RES.set(k, r); return r;
  }
  function tapeEdges(k) {
    const a = AREAS[k], out = [], S = nav.S || 0.3, nb = [[S, 0], [-S, 0], [0, S], [0, -S]];
    let bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9;
    for (const id of ids.get(k)) { const z = map.zone(id); bx0 = Math.min(bx0, z.x0); bz0 = Math.min(bz0, z.z0); bx1 = Math.max(bx1, z.x1); bz1 = Math.max(bz1, z.z1); }
    if (a.clip) { bx0 = Math.max(bx0, a.clip[0]); bz0 = Math.max(bz0, a.clip[1]); bx1 = Math.min(bx1, a.clip[2]); bz1 = Math.min(bz1, a.clip[3]); }
    const N = nav.raw;
    for (let i = 0; i < nav.count; i++) {
      const x = N.X(i), z = N.Z(i); if (x < bx0 - 0.5 || x > bx1 + 0.5 || z < bz0 - 0.5 || z > bz1 + 0.5) continue;
      const y = N.y[i]; if (!inAreaK(k, x, y, z)) continue;
      for (const [dx, dz] of nb) { const j = nav.snap(x + dx, y, z + dz, S * 0.45); if (j < 0) continue; const yj = N.y[j]; if (Math.abs(yj - y) > 0.6) continue;
        if (inAreaK(k, N.X(j), yj, N.Z(j))) continue;
        const mx = x + dx / 2, mz = z + dz / 2, my = Math.max(y, yj);
        out.push(dx ? [mx, my, mz - S / 2, mx, my, mz + S / 2] : [mx - S / 2, my, mz, mx + S / 2, my, mz]); }
    }
    return out;
  }
  function tapeMesh(edges) {                        // 한 메시(드로우콜 1) · 빨강 띠 — 조명 무시 · 바닥에서 7cm
    const pos = [], W = 0.07;
    for (const [x0, y0, z0, x1, , z1] of edges) { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * W, nz = dx / l * W, y = y0 + 0.07;
      pos.push(x0 + nx, y, z0 + nz, x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x0 + nx, y, z0 + nz, x1 - nx, y, z1 - nz, x0 - nx, y, z0 - nz); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff4d5e, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }));
    m.renderOrder = 3; m.frustumCulled = false;
    const h = map.add(m); return { remove() { h.remove(); g.dispose(); m.material.dispose(); } };
  }
  // 🏠집 표시: 바닥 고리(한 메시 · 숨 쉬듯 밝아짐) + 빛기둥 표식(표식 풀) + 미니맵 초록 고리
  let homeRing = null;
  function homeMesh(p, r) {
    const g = new THREE.RingGeometry(r - 0.16, r, 40), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x35c46a, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(p[0], p[1] + 0.08, p[2]); m.renderOrder = 3; m.frustumCulled = false; m.updateMatrix();
    homeRing = m; const h = map.add(m); return { remove() { h.remove(); g.dispose(); m.material.dispose(); homeRing = null; } };
  }

  // ---------- 장난감 로봇(친구·숨는 로봇 — InstancedMesh 5칸 · 드로우콜 1) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  let botMesh = null, botGeo = null, botMat = null;
  function ensureBots() {
    if (botMesh) return;
    // 낮은 면 장난감 로봇(하나 = 208삼각형 — 술래·친구·숨는 로봇이 같이 씀): 머리 20면체 1단 · 몸·얼굴판·배 20면체 · 눈·더듬이 공·손·발 8면체 · 더듬이 대 6각(뚜껑 없음)
    const SPH = new THREE.IcosahedronGeometry(1, 1), SPHS = new THREE.IcosahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0), CYL = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const parts = [[SPHS, [0, 0.4, 0], [0.3, 0.28, 0.27], 0xffffff], [SPHS, [0, 0.38, 0.17], [0.18, 0.14, 0.11], 0xe8eef4],
      [SPH, [0, 0.84, 0], [0.3, 0.27, 0.28], 0xffffff], [SPHS, [0, 0.84, 0.13], [0.22, 0.15, 0.16], 0x2a3550],
      [OCT, [-0.08, 0.86, 0.28], [0.045, 0.055, 0.02], 0x9ff4ff], [OCT, [0.08, 0.86, 0.28], [0.045, 0.055, 0.02], 0x9ff4ff],
      [CYL, [0, 1.17, 0], [0.014, 0.14, 0.014], 0x9aa3ad], [OCT, [0, 1.26, 0], [0.055, 0.055, 0.055], 0xffcf3c],
      [OCT, [-0.31, 0.42, 0.04], [0.08, 0.1, 0.08], 0xf2f5f8], [OCT, [0.31, 0.42, 0.04], [0.08, 0.1, 0.08], 0xf2f5f8],
      [OCT, [-0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270], [OCT, [0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270]];
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex] of parts) { const g = geo.index ? geo.toNonIndexed() : geo.clone(), Pa = g.attributes.position, Na = g.attributes.normal;
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.identity(), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m4); _c.set(hex);
      for (let i = 0; i < Pa.count; i++) { _v.fromBufferAttribute(Pa, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(Na, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); }
      g.dispose(); }
    SPH.dispose(); SPHS.dispose(); OCT.dispose(); CYL.dispose();
    botGeo = new THREE.BufferGeometry(); botGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); botGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); botGeo.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    botMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x1a1a1a });
    botMesh = new THREE.InstancedMesh(botGeo, botMat, N_SLOT); botMesh.frustumCulled = false; botMesh.castShadow = botMesh.receiveShadow = false;
    for (let i = 0; i < N_SLOT; i++) { botMesh.setMatrixAt(i, ZERO); botMesh.setColorAt(i, _c.set(BOT_C[i])); }
    botMesh.count = 0; botMesh.visible = false; map.add(botMesh);
  }
  const slotHex = new Int32Array(N_SLOT).fill(-1);

  // ---------- 화면 조각(DOM — 처음 쓸 때 만든다 · pointer-events 없음 · HUD 밑 z 16) ----------
  let heartEl = null, iceEl = null; const bubs = [];
  function fxEls() {
    if (heartEl) return;
    heartEl = document.createElement('div'); heartEl.className = 'hs-heart';
    heartEl.style.cssText = 'position:fixed;inset:0;z-index:16;pointer-events:none;opacity:0;background:radial-gradient(ellipse 62% 58% at 50% 50%,rgba(255,60,80,0) 55%,rgba(255,60,80,.38) 85%,rgba(200,20,50,.62) 100%)';
    iceEl = document.createElement('div'); iceEl.className = 'hs-ice';
    iceEl.style.cssText = 'position:fixed;inset:0;z-index:16;pointer-events:none;display:none;background:radial-gradient(ellipse 60% 56% at 50% 50%,rgba(160,220,255,.08) 40%,rgba(150,215,255,.55) 85%,rgba(220,245,255,.85) 100%)';
    document.body.appendChild(heartEl); document.body.appendChild(iceEl);
  }
  function bub(i) {
    if (!bubs[i]) { const d = document.createElement('div'); d.className = 'hs-bub'; d.style.cssText = 'position:fixed;left:0;top:0;z-index:19;pointer-events:none;font:800 22px sans-serif;display:none;text-shadow:0 2px 0 rgba(255,255,255,.9),0 0 4px rgba(0,0,0,.4)';
      d.shown = ''; document.body.appendChild(d); bubs[i] = d; }
    return bubs[i];
  }

  // ---------- 상태 ----------
  let R0 = null;              // 지금 구역 풀린 것
  const seekers = [];         // A: 술래 { h, c, id, st, t, pts, pi, need, goal, tgt, last, lost, seeP, seeB, spot, think, sawP }
  const bots = [];            // A 친구 · B 숨는 로봇
  const marks = [];
  let score = 0, rs = null;   // rs = 이번 라운드 점수 내역
  let stam = 1, tired = false, stamShown = -1, lastPX = 0, lastPZ = 0, lastOK = false;
  let frozenP = false, frozenT = 0, rescuer = null, rescueWait = 0, immuneT = 0, pTrip = false, homeT = 0, atHome = false, homeWarn = 0;
  let pHid = null;            // { spot, by:Set(술래 id) } 들어가는 걸 본 술래
  let nearShown = -1, beatT = 0, beatOn = false, peekT = 0, peeks = 0, beepT = 0, moveToastT = 0, sk2T = -1, fastSaid = false, hearToastT = 0;
  const darkIds = new Set();
  const coarse = matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch');
  const goal = t => map.hud.goal(t);
  const chip = (k, t, o) => map.hud.chip(k, t, o);

  function clearRound() {
    if (map.hide.current()) map.hide.exit();
    for (const h of RR.splice(0)) { try { h.remove(); } catch (e) { console.error(e); } }
    seekers.length = 0; bots.length = 0; darkIds.clear(); pHid = null; rescuer = null;
    if (R0) for (const s of R0.spots) { s.hs = null; s.lastT = -99; s.inv = null; s.ok = true; }
    if (botMesh) { botMesh.count = 0; botMesh.visible = false; }
    for (const b of bubs) if (b) { b.style.display = 'none'; b.shown = ''; }
    for (const k of ['time', 'score', 'stam', 'near', 'friends', 'bots', 'peek', 'area']) chip(k, null);
    map.minimap.setMarks([]); map.player.speed(1); stam = 1; tired = false; stamShown = -1; lastOK = false;
    if (frozenP) { frozenP = false; map.player.freeze(false); }
    if (heartEl) heartEl.style.opacity = '0'; if (iceEl) iceEl.style.display = 'none';
    peekT = 0; if (botMat) botMat.depthTest = true; nearShown = -1;
  }

  // ---------- 메뉴 ----------
  const HOW_A = '🙈 숨고 달리기 · 3라운드\n• 술래 로봇이 🏠집에서 10을 세는 동안 숨어요 (친구 로봇 셋도 숨어요)\n• 들키면 ❗ — 🏠집에 먼저 닿으면 "찜!", 아니면 눈을 피해 다시 숨어요\n• 잡히면 ❄얼음 — 친구 로봇이 "땡!" 해 줘요. 얼어붙은 친구는 내가 닿아서 구해요\n• 달리면 ⚡힘이 닳아요 — 쉬거나 🏠집에서 채워요';
  const HOW_B = '🔍 술래 되기 · 3라운드\n• 🏠집에서 10을 센 뒤, 숨은 로봇을 🔍살펴보기로 찾아요\n• 찾은 로봇은 🏠집으로 도망가요 — 닿기 전에 터치하면 잡기!\n• 👀 엿보기 = 잠깐 벽 너머 로봇이 보여요(횟수 제한)\n• 달리면 ⚡힘이 닳아요';
  async function menu(first) {
    st = 'menu'; map.player.freeze(true); clearRound(); goal(null);
    let m = first && /^[ab]$/.test(params.mode || '') ? params.mode : null;
    if (!m) { const i = await map.hud.ask('🙈 숨바꼭질\n어떻게 놀까요?', ['🙈 숨고 달리기 (술래 로봇 피하기)', '🔍 술래 되기 (숨은 로봇 잡기)', '그만하기']);
      if (dead || map.gone || i < 0) return; if (i === 2) { map.quit(); return; } m = i === 0 ? 'a' : 'b'; }
    let k = first && AREAS[params.area] ? params.area : null;
    if (!k) { const bestTxt = kk => { const b = map.store.get((m === 'a' ? 'scoreA.' : 'scoreB.') + kk, null); return b == null ? '' : '  (최고 ⭐' + b + ')'; };
      const i = await map.hud.ask('어디에서 할까요?', [...AREA_KEYS.map(kk => AREAS[kk].icon + ' ' + AREAS[kk].title + bestTxt(kk)), '🎲 아무 데나']);
      if (dead || map.gone || i < 0) return; k = i < 3 ? AREA_KEYS[i] : AREA_KEYS[Math.floor(rng() * 3)]; }
    if (!(first && params.mode)) { const i = await map.hud.ask(m === 'a' ? HOW_A : HOW_B, ['▶ 시작!', '그만하기']); if (dead || map.gone || i < 0) return; if (i === 1) { map.quit(); return; } }
    mode = m; areaKey = k; score = 0; beginRound(first ? startRound : 1);
  }

  // ---------- 라운드 ----------
  function beginRound(n) {
    clearRound(); rn = n; A = AREAS[areaKey]; R0 = resolveArea(areaKey); RD = mode === 'a' ? RA[n - 1] : RB[n - 1];
    T = timeOver || RD.time; st = 'count'; cd = COUNT; cdShown = -1; secShown = -1; t10 = 0; fastSaid = false; sk2T = -1;
    rs = { sec: 0, home: 0, rescue: 0, round: 0, friend: 0, tag: 0, safe: 0, left: 0, homes: 0, rescues: 0, tags: 0, safes: 0, frozen: 0 };
    frozenP = false; frozenT = 0; immuneT = 0; pTrip = false; homeT = 0; atHome = false; homeWarn = 0;
    map.player.teleport([A.start[0], map.q.floorY(A.start[0], A.start[1]), A.start[1]], { h: A.startH });
    const msgs = applyFx(n);
    own(tapeMesh(R0.edges)); own(homeMesh(R0.home, A.home.r));
    own(map.mk.marker(R0.home[0], R0.home[1] + 2.4, R0.home[2], { color: 0x35c46a, beam: true }));
    map.minimap.show();
    ensureBots(); fxEls();
    chip('time', (mode === 'a' ? '🙈 ' : '🤖 ') + COUNT + ' · ' + rn + '/3'); chip('score', '⭐ ' + score);
    if (mode === 'a') beginA(); else beginB();
    map.hud.banner(rn + '라운드' + (rn === 3 ? ' (마지막!)' : ''), 1.6);
    msgs.forEach((t, i) => setTimeout(() => { if (!dead && !map.gone && st === 'count') map.hud.toast(t, 3); }, 1800 + i * 3200));
  }
  // 라운드마다 세상 바꾸기(map.world — 게임이 멈추면 FX.reset이 전부 처음대로 · 라운드가 바뀌면 여기서 되돌림)
  function applyFx(n) {
    const f = (A.fx || {})[n], msgs = [];
    if (f && f.time) { map.time(f.time); msgs.push(FX_MSG.time); } else if (time0 && map.time() !== time0) map.time(time0);
    if (!f) { for (const s of R0.spots) s.ok = true; return msgs; }
    if (f.dark) { for (const r of f.dark) if (map.world.light(r, false)) { const z = map.zone(r); if (z) darkIds.add(z.id); own({ remove: () => map.world.light(r, true) }); } msgs.push(FX_MSG.dark); }
    if (f.doors) { for (const d of f.doors) { const h = map.world.door(d); if (h) { h.close(); own({ remove: () => h.free() }); } } msgs.push(FX_MSG.doors); }
    if (f.props) { for (const p of f.props) { const h = map.world.spawn(p[0], { x: p[1], z: p[2] }, { h: p[3] || 0, color: p[4] }); if (h) own(h); } msgs.push(FX_MSG.props); }
    // 문을 닫았으면 🏠집에서 못 가는 숨는 자리는 이번 라운드에 뺀다(술래·로봇이 길을 못 찾음)
    for (const s of R0.spots) { s.ok = true; if (f.doors) { const r = nav.path(R0.home, s.stand, { maxExp: 40000 }); s.ok = !!r.ok; if (!s.ok) console.warn('[hideseek] 닫힌 문 때문에 못 가는 자리', s.label); } }
    return msgs;
  }
  const okSpots = () => R0.spots.filter(s => s.ok);

  // ========== 공통: 길 따라가기 · 길 찾기(한 프레임에 하나) ==========
  const AG = [];              // 길이 필요한 것들(술래·로봇) — 매 라운드 다시 채움
  let agI = 0;
  function want(a, x, y, z) { a.goal[0] = x; a.goal[1] = y; a.goal[2] = z; a.need = true; }
  function planOne() {
    const n = AG.length; if (!n) return;
    for (let k = 0; k < n; k++) { const a = AG[(agI + k) % n]; if (!a.need || a.dead) continue; agI = (agI + k + 1) % n; a.need = false;
      const p = a.pos, r = nav.path([p.x, p.y, p.z], a.goal, { maxExp: 9000 });   // 운동장 끝↔끝 ≈4.5천 칸
      if (r.ok && r.pts.length > 1) { a.pts = r.pts; a.pi = 1; a.fail = 0; }
      else if (Math.hypot(a.goal[0] - p.x, a.goal[2] - p.z) < 3) { a.pts = [[p.x, p.y, p.z], [a.goal[0], a.goal[1], a.goal[2]]]; a.pi = 1; }
      else { a.pts = null; a.fail = (a.fail || 0) + 1; }
      return; }
  }
  function follow(a, dt, sp) {   // 매 프레임 — 도착하면 true
    const p = a.pos; if (!a.pts || a.pi >= a.pts.length) return true;
    const q = a.pts[a.pi], ex = q[0] - p.x, ez = q[2] - p.z, d = Math.hypot(ex, ez), s = sp * dt;
    if (d <= s) { p.x = q[0]; p.z = q[2]; p.y = q[1]; a.pi++; return a.pi >= a.pts.length; }
    p.x += ex / d * s; p.z += ez / d * s; p.y += (q[1] - p.y) * Math.min(1, dt * 6); turn(p, Math.atan2(ex, ez), dt * 8); return false;
  }
  function straight(a, dt, sp, x, z) { const p = a.pos, ex = x - p.x, ez = z - p.z, d = Math.hypot(ex, ez); if (d < 1e-3) return; const s = Math.min(d, sp * dt);
    if (!map.q.blocked(p.x + ex / d * s, p.z + ez / d * s, p.y)) { p.x += ex / d * s; p.z += ez / d * s; } turn(p, Math.atan2(ex, ez), dt * 10); }
  function turn(p, want, k) { let dy = want - p.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; p.yaw += dy * Math.min(1, k); }
  const dist = (a, x, z) => Math.hypot(a.x - x, a.z - z);
  const hdgOf = yaw => ((180 - yaw / R2D) % 360 + 360) % 360;     // 엔진 yaw ↔ 방위 = 180 − yaw°
  const EYE = { x: 0, y: 0, z: 0, h: 0 }, TGT = [0, 0, 0];
  const isDark = (x, y, z) => { if (!darkIds.size) return false; const zn = map.zoneAt(x, y + 0.1, z); return !!zn && darkIds.has(zn.id); };
  const atHomeXZ = (x, z, extra = 0) => Math.hypot(x - A.home.x, z - A.home.z) < A.home.r + extra;

  // ========== A: 숨고 달리기 ==========
  function beginA() {
    map.player.crouch(true);
    for (const s of okSpots()) { const h = own(map.hide.add({ x: s.x, y: s.y, z: s.z, face: s.face, w: s.w, kind: s.kind, label: s.label, eye: s.eye, stand: s.stand })); s.hs = h.spot; }
    AG.length = 0; agI = 0;
    spawnSeeker(0);
    // 친구 로봇 셋: 집 앞에서 출발해 서로 다른 자리로 걸어가 숨는다(세는 동안 보임)
    const free = okSpots().slice().sort(() => rng() - 0.5), pick = [];
    for (const s of free) { if (pick.length >= 3) break; if (pick.some(p => Math.hypot(p.x - s.x, p.z - s.z) < 4)) continue; pick.push(s); }
    for (const s of free) { if (pick.length >= 3) break; if (!pick.includes(s)) pick.push(s); }
    pick.forEach((s, i) => { const hx = A.home.x + Math.cos(i * 2.1) * (A.home.r + 0.6), hz = A.home.z + Math.sin(i * 2.1) * (A.home.r + 0.6), j = nav.snap(hx, R0.home[1], hz, 2);
      const p0 = j >= 0 ? nav.pos(j) : R0.home.slice();
      const b = { i, st: 'go', spot: s, pos: { x: p0[0], y: p0[1], z: p0[2], yaw: 0 }, pts: null, pi: 0, need: false, goal: [0, 0, 0], t: 0, seen: 0, seenBy: 0, sp: 3.2, dead: false };
      want(b, s.stand[0], s.stand[1], s.stand[2]); bots.push(b); AG.push(b); });
    map.player.freeze(false);
    goal(coarse ? '🙈 10 세는 동안 숨어요! ⬇ 웅크리기 · ✋ 숨기' : '🙈 로봇이 10 셀 동안 숨어요! C 웅크리기 · E 숨기');
    map.hud.toast('🏠 초록 고리 = 집 · 빨간 띠 밖으로는 못 나가요', 4);
    chip('friends', '🤖 3/3'); chip('stam', STAM_TXT[5]); stamShown = 5;
    map.sfx('go');
  }
  function spawnSeeker(k) {
    const at = A.seeker.at, sy = map.q.floorY(at[0], at[1]), ox = k ? 1.2 : 0;
    // 술래 = 이 게임의 빨간 장난감 로봇(로봇 풀 한 칸 · 208삼각형 — 엔진 술래(1344삼각형)를 쓰면 급식실 커튼 화면이 15만을 넘었다) + 바닥 시야 부채꼴(메시 1)
    const c = { x: at[0] + ox, y: sy, z: at[1], yaw: (180 - A.seeker.h) * R2D }, rg = A.range * RD.range;
    const seg = 14, a0 = -50 * R2D, pos = [0, 0, 0], idx = [];
    for (let q = 0; q <= seg; q++) { const a = a0 + 100 * R2D * q / seg; pos.push(Math.sin(a) * rg, 0, Math.cos(a) * rg); if (q) idx.push(0, q, q + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const fan = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
    fan.renderOrder = 2; fan.frustumCulled = false; const fh = map.add(fan); own({ remove() { fh.remove(); g.dispose(); fan.material.dispose(); } });
    const sk = { c, fan, id: k, st: k ? 'patrol' : 'count', t: 0, pos: c, pts: null, pi: 0, need: false, goal: [0, 0, 0], tgt: null, last: [0, 0, 0], lost: 0, seeP: 0, seeB: new Float32Array(N_SLOT), spot: null, think: 0, sawP: -99, dead: false, look: 0 };
    seekers.push(sk); AG.push(sk); skVis(sk); return sk;
  }
  const SK_BUB = { chase: '❗', found: '❗', inspect: '❓', search: '❓', sus: '❓', count: '💤', giveup: '💤', tagged: '💤', wait: '' };
  function skVis(sk) {   // 부채꼴 색(노랑 순찰 · 주황 수상함·뒤지기 · 빨강 쫓기) · 머리 위 ❗❓💤는 drawBots
    const m = sk.st, col = m === 'chase' || m === 'found' ? 0xff5a4a : m === 'patrol' ? 0xffe066 : 0xffa53c;
    if (sk.col !== col) { sk.col = col; sk.fan.material.color.setHex(col); }
  }
  function setSk(sk, m, t = 0) { if (sk.st === m) return; sk.st = m; if (m === 'patrol' || m === 'giveup' || m === 'tagged') sk.tgt = null; sk.t = t; sk.pts = null; sk.need = false; sk.think = 0; sk.look = 0; skVis(sk); }
  const chaseSp = () => RD.chase[0] + (RD.chase[1] - RD.chase[0]) * Math.min(1, Math.max(0, 1 - T / (timeOver || RD.time)));
  const tgtPos = sk => sk.tgt === 'p' ? map.player.pos() : sk.tgt ? sk.tgt.pos : null;
  function startChase(sk, tgt, shout) {
    sk.tgt = tgt; const p = tgtPos(sk); sk.last[0] = p.x; sk.last[1] = p.y; sk.last[2] = p.z; sk.lost = 0;
    sk.shout = shout === true ? 1.4 : shout || 0; setSk(sk, sk.shout ? 'found' : 'chase', 0);
    if (tgt === 'p') { pTrip = true; map.hud.banner('❗ 들켰다! 🏠집으로 달리거나 숨어요!', 1.8); map.tone(880, 0, 0.1, 'square', 0.07); map.tone(1175, 0.09, 0.18, 'square', 0.07);
      goal(coarse ? '❗ 쫓겨요! 🏠집에 닿거나 눈을 피해 숨어요 · 조이스틱 끝 = 달리기' : '❗ 쫓겨요! 🏠집에 닿거나 눈을 피해 숨어요 · Shift 달리기'); }
    else { tgt.st = 'run'; tgt.sp = RD.run; tgt.pts = null; want(tgt, R0.home[0], R0.home[1], R0.home[2]); map.tone(700, 0, 0.08, 'triangle', 0.05); map.tone(930, 0.08, 0.12, 'triangle', 0.05); }
  }
  function pickSpot(sk, now) {
    const avail = okSpots().filter(s => s.hs && now - s.lastT > 30 && !seekers.some(o => o !== sk && o.spot === s));
    if (!avail.length) return null;
    let sum = 0; const w = avail.map(s => { const d = Math.hypot(s.stand[0] - sk.c.x, s.stand[2] - sk.c.z); const v = 1 / (1 + d / 10); sum += v; return v; });
    let r = rng() * sum; for (let i = 0; i < avail.length; i++) { r -= w[i]; if (r <= 0) return avail[i]; } return avail[avail.length - 1];
  }
  // 술래 두뇌(10Hz) — 보기 · 듣기 · 할 일 고르기
  function brainSk(sk, now) {
    const c = sk.c; sk.t += 0.1;
    if (sk.st === 'count' || sk.st === 'wait') return;
    // 1) 보기: 나(숨지 않음 · 얼지 않음 · 집에서 안전하지 않음)와 보이는 로봇
    EYE.x = c.x; EYE.y = c.y + 0.9; EYE.z = c.z; EYE.h = hdgOf(c.yaw);
    const rg = A.range * RD.range, me = map.player.pos();
    const pSafe = frozenP || immuneT > 0 || (atHome && homeT < 12) || !inArea(me.x, me.y, me.z);
    const seeP = !pSafe && map.see(EYE, 'player', 100, isDark(me.x, me.y, me.z) ? rg * 0.55 : rg);
    if (seeP) { sk.sawP = now; sk.last[0] = me.x; sk.last[1] = me.y; sk.last[2] = me.z; }
    const dP = dist(c, me.x, me.z);
    sk.seeP = seeP ? sk.seeP + 0.1 : pSafe ? 0 : Math.max(0, sk.seeP - 0.05);
    let spotB = null;
    for (const b of bots) { const vis = b.st === 'go' || b.st === 'run' || b.st === 'rescue'; if (!vis) sk.seeB[b.i] = 0;
      let s = false; if (vis) { TGT[0] = b.pos.x; TGT[1] = b.pos.y + 0.6; TGT[2] = b.pos.z; s = map.see(EYE, TGT, 100, isDark(b.pos.x, b.pos.y, b.pos.z) ? rg * 0.55 : rg); }
      if (s) { b.seenBy = now; if (sk.tgt === b) { sk.last[0] = b.pos.x; sk.last[1] = b.pos.y; sk.last[2] = b.pos.z; } }
      sk.seeB[b.i] = s ? sk.seeB[b.i] + 0.1 : Math.max(0, sk.seeB[b.i] - 0.05);
      if (sk.seeB[b.i] >= (dist(c, b.pos.x, b.pos.z) < 4 ? 0.2 : 0.4) && !spotB) spotB = b; }
    const spottedP = sk.seeP >= (dP < 4 ? 0.2 : 0.45);
    const idle = sk.st === 'patrol' || sk.st === 'inspect' || sk.st === 'search' || sk.st === 'sus' || sk.st === 'giveup';
    if (idle && (spottedP || spotB)) { const tg = spottedP ? 'p' : spotB, p = tgtPos({ tgt: tg }); startChase(sk, tg, dist(c, p.x, p.z) < 3.5 ? 0.8 : 0); return; }   // 코앞에서 마주치면 0.8초 '찾았다!'(달아날 틈)
    switch (sk.st) {
      case 'found': if (sk.t >= sk.shout) setSk(sk, 'chase'); return;
      case 'tagged': if (sk.t >= 1.6) setSk(sk, 'patrol'); return;
      case 'giveup': if (sk.t >= 1.2) setSk(sk, 'patrol'); return;
      case 'chase': {
        const tg = sk.tgt;
        if (tg === 'p') {
          if (pSafe) { if (atHome) homeScore(); setSk(sk, 'giveup'); return; }
          if (seeP) { sk.lost = 0; return; }
          const hc = map.hide.current();
          if (hc && pHid && pHid.by.has(sk.id)) { const s = findSpot(hc); if (s) { setSk(sk, 'inspect'); sk.spot = s; want(sk, s.stand[0], s.stand[1], s.stand[2]); return; } }   // 들어가는 걸 봤다 → 곧장 그 자리
        } else if (tg) {
          if (tg.st !== 'run') { setSk(sk, 'giveup'); return; }   // 집에 닿음(찜) 또는 숨음
          if (sk.seeB[tg.i] > 0) { sk.lost = 0; return; }
        }
        if ((sk.lost += 0.1) > 1.6) { setSk(sk, 'search'); want(sk, sk.last[0], sk.last[1], sk.last[2]); }
        return; }
      case 'search': {   // 마지막 본 곳 → 둘러보기 → (들어가는 걸 봤으면) 그 자리 뒤지기 → 포기
        if (!sk.pts && !sk.need && dist(c, sk.last[0], sk.last[2]) > 1.2 && sk.t < 6) want(sk, sk.last[0], sk.last[1], sk.last[2]);
        if (sk.pts && sk.pi < sk.pts.length) return;
        sk.look += 0.1; c.yaw += 0.35;
        const hc = map.hide.current();
        if (hc && pHid && pHid.by.has(sk.id) && Math.hypot(hc.x - sk.last[0], hc.z - sk.last[2]) < 7) { const s = findSpot(hc); if (s) { setSk(sk, 'inspect'); sk.spot = s; want(sk, s.stand[0], s.stand[1], s.stand[2]); return; } }
        const hb = bots.find(b => b.st === 'hid' && b.seenIn === sk.id && Math.hypot(b.spot.x - sk.last[0], b.spot.z - sk.last[2]) < 7);
        if (hb) { setSk(sk, 'inspect'); sk.spot = hb.spot; want(sk, hb.spot.stand[0], hb.spot.stand[1], hb.spot.stand[2]); return; }
        if (sk.look > 1.8) setSk(sk, 'giveup'); return; }
      case 'inspect': {
        const s = sk.spot; if (!s) { setSk(sk, 'patrol'); return; }
        if (sk.look <= 0) { if (dist(c, s.stand[0], s.stand[2]) < 0.8) { sk.look = 0.01; skVis(sk); } else if (!sk.pts && !sk.need) { if (sk.fail > 2 || sk.t > 25) { sk.fail = 0; setSk(sk, 'giveup'); } else want(sk, s.stand[0], s.stand[1], s.stand[2]); } return; }
        sk.look += 0.1; turn(c, Math.atan2(s.x - c.x, s.z - c.z), 1);
        if (sk.look < 2) return;
        s.lastT = now;
        const hc = map.hide.current();
        if (hc && findSpot(hc) === s && !frozenP) { map.hide.exit(); foundP(sk); return; }
        const hb = bots.find(b => b.st === 'hid' && b.spot === s);
        if (hb) { hb.pos.x = s.stand[0]; hb.pos.y = s.stand[1]; hb.pos.z = s.stand[2]; startChase(sk, hb, true); hb.delay = 0.5; map.hud.toast('🤖 친구 로봇이 들켰어요!', 1.6); return; }
        setSk(sk, 'giveup'); return; }
      case 'sus': if (!sk.pts && !sk.need && dist(c, sk.last[0], sk.last[2]) > 1.2 && sk.t < 5) want(sk, sk.last[0], sk.last[1], sk.last[2]); else if (!sk.pts) c.yaw += 0.25; if (sk.t > 5) setSk(sk, 'patrol'); return;
      case 'patrol': {
        // 소리 듣기(웅크려 걸으면 2.2m · 걷기 6.5m · 달리기 13m × 귀)
        const n = pSafe || map.hide.current() ? 0 : map.player.noise();
        if (n > 0 && dP < HEAR[n] * RD.hear) { sk.last[0] = me.x; sk.last[1] = me.y; sk.last[2] = me.z; setSk(sk, 'sus');
          if (now - hearToastT > 8) { hearToastT = now; map.hud.toast('👂 술래가 발소리를 들었어요!', 1.6); } return; }
        if (sk.pts && sk.pi < sk.pts.length) { if (sk.t > 20) sk.pts = null; return; }
        if (sk.need) return;
        if ((sk.think -= 0.1) > 0) return; sk.think = 0.4 + rng() * 0.8; sk.t = 0;
        // 얼어붙은 것이 있으면 가끔 지키러 · 아니면 숨는 자리 확인 · 아니면 먼 자리로
        const fz = frozenP ? me : (bots.find(b => b.st === 'frozen') || {}).pos;
        if (fz && rng() < 0.35) { const a = rng() * 6.28, j = nav.snap(fz.x + Math.cos(a) * 4, fz.y, fz.z + Math.sin(a) * 4, 2); if (j >= 0) { const p = nav.pos(j); want(sk, p[0], p[1], p[2]); return; } }
        if (rng() < RD.checkP) { const s = pickSpot(sk, now); if (s) { s.lastT = now; setSk(sk, 'inspect'); sk.spot = s; want(sk, s.stand[0], s.stand[1], s.stand[2]); return; } }
        const wps = okSpots().filter(s => Math.hypot(s.stand[0] - c.x, s.stand[2] - c.z) > 6), all = wps.length ? wps : okSpots();
        const s = all[Math.floor(rng() * all.length)]; if (s) want(sk, s.stand[0], s.stand[1], s.stand[2]);
        return; }
    }
  }
  function findSpot(hs) { return R0.spots.find(s => s.hs === hs) || null; }
  function foundP(sk) {   // 숨은 자리에서 찾힘 → 튀어나와 쫓기기(술래는 1.4초 '찾았다!' — 그 사이 달려요)
    map.tone(784, 0, 0.14, 'sine', 0.15); map.tone(988, 0.12, 0.2, 'sine', 0.15);
    startChase(sk, 'p', true); map.hud.banner('❗ 찾았다! 지금 달려요!', 1.6);
  }
  function homeScore() {
    if (!pTrip) return; pTrip = false; rs.home += SC.home; rs.homes++; addScore(SC.home);
    map.sfx('ding'); map.hud.banner('🏠 찜! +' + SC.home, 1.4);
    goal(coarse ? '🙈 버티기 · ⬇ 조용히 · ✋ 숨기' : '🙈 버티기 · C 웅크리면 조용 · E 숨기/나오기');
  }
  function addScore(n) { score += n; chip('score', '⭐ ' + score); }
  function tagP(sk) {
    frozenP = true; frozenT = 0; rescueWait = 1.5; rs.frozen++; pTrip = false;
    if (map.hide.current()) map.hide.exit();
    map.player.freeze(true); if (iceEl) iceEl.style.display = 'block';
    map.tone(784, 0, 0.25, 'sine', 0.2); map.tone(622, 0.22, 0.4, 'sine', 0.2);
    const any = bots.some(b => b.st !== 'frozen');
    map.hud.banner(any ? '❄ 얼음! 친구 로봇이 구하러 와요' : '❄ 얼음!', 2);
    goal(any ? '❄ 얼음 — 친구 로봇이 "땡!" 해 줄 때까지 기다려요' : '❄ 얼음');
    setSk(sk, 'tagged'); sk.tgt = null;
  }
  function unfreezeP() {
    frozenP = false; immuneT = 2.5; map.player.freeze(false); if (iceEl) iceEl.style.display = 'none';
    map.sfx('pick'); map.hud.banner('땡! 🤖 친구가 얼음을 풀어 줬어요', 1.6);
    goal(coarse ? '🙈 버티기 · ⬇ 조용히 · ✋ 숨기' : '🙈 버티기 · C 웅크리면 조용 · E 숨기/나오기');
  }
  function tagBot(sk, b) {
    b.st = 'frozen'; b.pts = null; b.need = false; map.tone(620, 0, 0.18, 'sine', 0.1); map.tone(500, 0.15, 0.25, 'sine', 0.1);
    map.hud.toast('❄ 친구 로봇이 얼었어요 — 가서 닿으면 구해요!', 2.4);
    setSk(sk, 'tagged'); sk.tgt = null; if (rescuer === b) rescuer = null; friendsChip();
  }
  function hidBot(b, now) {   // 숨음 — 들어가는 걸 본 술래(0.6초 안)는 기억한다(놓친 곳을 뒤질 때 그 자리를 본다)
    b.st = 'hid'; b.t = 0; b.pts = null; b.seenIn = -1; for (const k of seekers) if (now - b.seenBy < 0.6 && k.seeB[b.i] > 0) b.seenIn = k.id; }
  function friendsChip() { chip('friends', '🤖 ' + bots.filter(b => b.st !== 'frozen').length + '/' + bots.length); }
  function newSpot(b, far) {   // 비어 있는 자리 중 술래에게서 먼 곳
    const me = map.hide.current(), used = new Set(bots.filter(o => o !== b && o.spot).map(o => o.spot));
    const cand = okSpots().filter(s => !used.has(s) && (!me || s.hs !== me) && seekers.every(k => Math.hypot(s.x - k.c.x, s.z - k.c.z) > far));
    const pool = cand.length ? cand : okSpots().filter(s => !used.has(s));
    return pool[Math.floor(rng() * pool.length)] || b.spot;
  }
  function goHide(b, sp) { b.spot = newSpot(b, 8); b.st = 'go'; b.sp = sp; b.t = 0; b.fail = 0; want(b, b.spot.stand[0], b.spot.stand[1], b.spot.stand[2]); }
  // 친구 로봇 두뇌(10Hz)
  function brainBot(b, now, me) {
    b.t += 0.1;
    switch (b.st) {
      case 'go': if (!b.pts && !b.need) { const s = b.spot.stand;
        if (dist(b.pos, s[0], s[2]) < 0.6) hidBot(b, now);
        else if (b.fail > 3) { b.fail = 0; b.pos.x = s[0]; b.pos.y = s[1]; b.pos.z = s[2]; hidBot(b, now); }   // 길이 없으면(드묾) 그 자리로
        else want(b, s[0], s[1], s[2]); } break;
      case 'rescue': if (b.fail > 3) { b.fail = 0; want(b, me.x, me.y, me.z); } break;
      case 'run': if (b.delay > 0) { b.delay -= 0.1; break; } if (atHomeXZ(b.pos.x, b.pos.z)) { b.st = 'safe'; b.t = 0; b.pts = null; map.hud.toast('🏠 친구 로봇이 찜!', 1.4); map.tone(988, 0, 0.1, 'sine', 0.06); } else if (!b.pts && !b.need) want(b, R0.home[0], R0.home[1], R0.home[2]); break;
      case 'safe': if (b.t > 5) goHide(b, 2.8); break;
      case 'frozen': if (!frozenP && !map.hide.current() && dist(b.pos, me.x, me.z) < 1.2) {   // 땡! — 내가 닿아서 구함
        rs.rescue += SC.rescue; rs.rescues++; addScore(SC.rescue); map.sfx('pick'); map.hud.banner('땡! 🤖 친구를 구했어요 +' + SC.rescue, 1.4); goHide(b, 3.0); friendsChip(); } break;
    }
    if (b.st === 'rescue' && (!frozenP || (dist(b.pos, me.x, me.z) > 5 && seekers.some(k => k.st !== 'chase' && dist(k.c, me.x, me.z) < 4.5)))) { if (rescuer === b) rescuer = null; goHide(b, 2.8); }   // 풀렸거나 술래가 지키고 있으면 다시 숨기
    if (b.st === 'rescue' && dist(b.pos, me.x, me.z) < 1.1) { rescuer = null; unfreezeP(); goHide(b, 2.8); }
    else if (b.st === 'rescue' && !b.pts && !b.need) want(b, me.x, me.y, me.z);
  }
  function tickA(dt, now) {
    // 매 프레임: 술래 움직임 · 잡기 · 친구 로봇 움직임
    for (const sk of seekers) {
      if (sk.st === 'count' || sk.st === 'wait') continue;
      const sp = sk.st === 'chase' ? chaseSp() : sk.st === 'inspect' ? RD.patrol * 1.35 : sk.st === 'search' ? RD.patrol * 1.5 : sk.st === 'sus' ? RD.patrol * 1.25 : RD.patrol;
      if (sk.st === 'chase') {
        const p = tgtPos(sk), seen = sk.tgt === 'p' ? sk.seeP > 0 : sk.tgt && sk.seeB[sk.tgt.i] > 0, d = dist(sk.c, p.x, p.z);
        if (seen && d < 2.5) straight(sk, dt, sp, p.x, p.z);
        else { if ((sk.think -= dt) <= 0 && !sk.need) { sk.think = 0.35; if (seen) want(sk, p.x, p.y, p.z); else want(sk, sk.last[0], sk.last[1], sk.last[2]); } if (sk.pts) follow(sk, dt, sp); }
        if (d < 0.85 && Math.abs(p.y - sk.c.y) < 1.2) { if (sk.tgt === 'p') { if (!frozenP && immuneT <= 0 && !(atHome && homeT < 12) && !map.hide.current()) tagP(sk); } else if (sk.tgt && sk.tgt.st === 'run' && !(sk.tgt.delay > 0)) tagBot(sk, sk.tgt); }
      } else if (sk.st !== 'found' && sk.st !== 'tagged' && sk.st !== 'giveup' && !(sk.st === 'inspect' && sk.look > 0) && sk.pts) { if (follow(sk, dt, sp)) sk.pts = null; }
      skVis(sk);
    }
    for (const b of bots) {
      if (b.st === 'go' || b.st === 'rescue' || (b.st === 'run' && !(b.delay > 0))) {
        if (b.pts && follow(b, dt, b.st === 'go' ? b.sp : RD.run)) { b.pts = null; if (b.st === 'go' && dist(b.pos, b.spot.stand[0], b.spot.stand[2]) < 0.6) hidBot(b, now); }
        else if (!b.pts && b.st === 'run' && b.fail > 2) straight(b, dt, RD.run, A.home.x, A.home.z);   // 길이 없으면 집 쪽으로 곧장
      }
    }
  }
  function tick10A(now, me) {
    for (const sk of seekers) brainSk(sk, now);
    for (const b of bots) brainBot(b, now, me);
    // 내가 얼었을 때: 구하러 올 친구 고르기 · 20초가 지나거나 모두 얼면 라운드 끝
    if (frozenP) {
      frozenT += 0.1;
      if (!rescuer || rescuer.st !== 'rescue') { rescuer = null; if ((rescueWait -= 0.1) <= 0) { rescueWait = 2; let best = null, bd = 1e9;
        const guard = seekers.some(k => dist(k.c, me.x, me.z) < 4.5);   // 술래가 바로 옆에 있으면 친구는 기다린다(멀어지면 달려옴)
        if (!guard) for (const b of bots) if (b.st === 'hid' || b.st === 'safe' || b.st === 'go') { const d = dist(b.pos, me.x, me.z); if (d < bd) { bd = d; best = b; } }
        if (best) { rescuer = best; best.st = 'rescue'; best.sp = RD.run; best.fail = 0; best.pts = null; want(best, me.x, me.y, me.z); map.hud.toast('🤖 친구 로봇이 구하러 달려와요!', 1.8); } } }
      if (frozenT > 25 || !bots.some(b => b.st !== 'frozen')) { endRound(false); return; }
    }
    // 🏠집: 들어가면 ⚡힘이 차고, 쫓기다 닿으면 찜 · 오래 있으면(6초) 점수가 안 오르고 12초가 넘으면 안전하지 않음
    const inH = !frozenP && !map.hide.current() && atHomeXZ(me.x, me.z, 0.1);
    if (inH) { if (!atHome) { atHome = true; homeT = 0; homeScore(); } homeT += 0.1; stam = Math.min(1, stam + 0.06);
      if (homeT > 6 && homeWarn < 1) { homeWarn = 1; map.hud.toast('🏠 집에 오래 있으면 점수가 안 올라요', 2); }
      if (homeT > 12 && homeWarn < 2) { homeWarn = 2; map.hud.toast('🏠 이제 집에서도 잡힐 수 있어요!', 2); } }
    else if (atHome) { atHome = false; homeT = 0; homeWarn = 0; }
    if (immuneT > 0) immuneT -= 0.1;
    // 2라운드 이상: 반쯤 지나면 술래가 빨라졌다고 알림 · 3라운드: 12초 뒤 술래 하나 더
    if (!fastSaid && T < (timeOver || RD.time) / 2) { fastSaid = true; map.hud.toast('⚡ 술래 로봇이 빨라졌어요!', 2); }
    if (RD.seekers > 1 && seekers.length < 2 && (timeOver || RD.time) - T > 12) { const s2 = spawnSeeker(1); if (s2) { s2.st = 'patrol'; skVis(s2); map.hud.banner('🤖 술래 로봇이 하나 더 왔어요!', 1.8); map.sfx('go'); } }
    // 심장 소리 · 거리 칩
    let nd = 1e9; for (const sk of seekers) if (sk.st !== 'count') nd = Math.min(nd, dist(sk.c, me.x, me.z));
    const m = nd < 15.5 && !frozenP ? Math.round(nd) : -1;
    if (m !== nearShown) { nearShown = m; chip('near', m >= 0 ? NEAR_TXT[Math.min(15, m)] : null); }
    beatOn = m >= 0 && m < 14;
    if (heartEl && heartEl.style.opacity !== '0' && beatT > 0.12) { heartEl.style.transition = 'opacity .35s'; heartEl.style.opacity = '0'; }
    marksA();
  }
  function heartTick(dt) {
    if (!beatOn) { beatT = 0; return; }
    const d = Math.max(2, nearShown), iv = 0.35 + (d - 2) / 12 * 0.75;
    if ((beatT += dt) < iv) return; beatT = 0;
    const v = Math.max(0.3, 1 - (d - 2) / 12);
    map.tone(110, 0, 0.1, 'triangle', 0.05 + v * 0.1); map.tone(92, 0.13, 0.12, 'triangle', 0.04 + v * 0.08);   // 쿵·쿵(휴대폰 스피커에도 들리게 세모파)
    if (heartEl) { heartEl.style.transition = 'none'; heartEl.style.opacity = OPA[Math.round(v * 10)]; }
  }
  function marksA() {
    let n = 0; const mk = i => { if (!marks[i]) marks[i] = { x: 0, z: 0, color: '', shape: 'dot' }; return marks[i]; };
    let m = mk(n++); m.x = A.home.x; m.z = A.home.z; m.color = '#35c46a'; m.shape = 'ring'; m.r = 8; m.blink = pTrip;
    for (const sk of seekers) { m = mk(n++); m.x = sk.c.x; m.z = sk.c.z; m.color = '#ff4d5e'; m.shape = 'dot'; m.r = undefined; m.blink = sk.st === 'chase'; }
    for (const b of bots) { if (b.st === 'hid') continue; m = mk(n++); m.x = b.pos.x; m.z = b.pos.z; m.color = b.st === 'frozen' ? '#6fc8ff' : '#4d7cff'; m.shape = b.st === 'frozen' ? 'star' : 'dot'; m.r = undefined; m.blink = b.st === 'frozen'; }
    marks.length = n; map.minimap.setMarks(marks);
  }

  // ========== B: 술래 되기 ==========
  function beginB() {
    peeks = RD.peeks; beepT = 4; moveToastT = 0; peekT = 0;
    map.player.crouch(false);
    AG.length = 0; agI = 0;
    const order = okSpots().slice().sort(() => rng() - 0.5), pick = [];
    for (const s of order) { if (pick.length >= RD.bots) break; if (pick.some(p => Math.hypot(p.x - s.x, p.z - s.z) < 3)) continue; pick.push(s); }
    for (const s of order) { if (pick.length >= RD.bots) break; if (!pick.includes(s)) pick.push(s); }
    pick.forEach((s, i) => { const b = { i, spot: s, st: 'hid', pos: { x: s.x, y: s.y, z: s.z, yaw: 0 }, pts: null, pi: 0, need: false, goal: [0, 0, 0], t: 0, anim: 0, moved: false, dead: false }; placeBot(b); bots.push(b); AG.push(b); });
    for (const s of okSpots()) s.inv = own(map.investigate.add({ x: s.stand[0], y: s.stand[1], z: s.stand[2], r: 1.2, label: '🔍 살펴보기 · ' + s.label, onUse: () => check(s) }));
    map.player.freeze(true);
    goal(coarse ? '🔍 로봇이 숨는 중… 10 세요' : '🔍 로봇 ' + RD.bots + '개가 숨는 중… 눈 감고 10 세요');
    chip('bots', '🤖 0/' + RD.bots); chip('stam', STAM_TXT[5]); stamShown = 5;
  }
  function placeBot(b) {
    const s = b.spot, k = SHOW_KIND[s.kind];
    b.pos.x = s.x; b.pos.y = s.y; b.pos.z = s.z; b.pos.yaw = -s.face * R2D + Math.PI; b.show = !!k; b.s = k || 0;
    if (s.kind === 'corner' || s.kind === 'bush') { const f = s.face * R2D; b.pos.x = s.x - Math.sin(f) * 0.1; b.pos.z = s.z + Math.cos(f) * 0.1; }
  }
  function pop(b) {   // 찾음 → 나와 먼 쪽 3m로 폴짝(0.6초 · 못 잡음) → 🏠집으로 도망(처음 1.2초는 깜짝 달리기)
    const me = map.player.pos(), s = b.spot.stand; let best = null, bv = -1e9;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, j = nav.snap(s[0] + Math.cos(a) * 3, s[1], s[2] + Math.sin(a) * 3, 0.9); if (j < 0) continue;
      const q = nav.pos(j); if (!inArea(q[0], q[1], q[2]) || Math.abs(q[1] - s[1]) > 0.6) continue; const r = nav.path(s, j, { maxExp: 600 }); if (!r.ok || r.len > 4.5) continue;
      const v = Math.hypot(q[0] - me.x, q[2] - me.z) - 0.4 * Math.hypot(q[0] - A.home.x, q[2] - A.home.z) / 10; if (v > bv) { bv = v; best = q; } }
    b.hx0 = b.pos.x; b.hz0 = b.pos.z; b.hy0 = b.pos.y; const t = best || s; b.hx1 = t[0]; b.hy1 = t[1]; b.hz1 = t[2];
    b.st = 'pop'; b.t = 0;
    map.sfx('pick'); map.tone(1046, 0.05, 0.1, 'square', 0.05); map.tone(1318, 0.15, 0.14, 'square', 0.05);
    map.hud.banner('🤖 앗! 들켰다 — 🏠집에 닿기 전에 잡아요!', 1.6);
    marksB();
  }
  function check(s) {
    if (st !== 'play') return;
    const b = bots.find(q => q.st === 'hid' && q.spot === s);
    if (!b) { map.hud.toast('🙅 ' + s.label + ' — 아무도 없어요', 1.4); map.tone(330, 0, 0.12, 'triangle', 0.08); return; }
    pop(b);
  }
  function resolved() { return bots.filter(b => b.st === 'tagged' || b.st === 'safe').length; }
  function botsChip() { chip('bots', '🤖 ' + bots.filter(b => b.st === 'tagged').length + '잡음 · ' + resolved() + '/' + bots.length); }
  function tagB(b) {
    b.st = 'tagged'; b.anim = 1.6; b.ax = b.pos.x; b.az = b.pos.z; b.ay = b.pos.y; b.pts = null;
    rs.tag += SC.tag; rs.tags++; addScore(SC.tag);
    map.sfx('ding'); map.tone(1046, 0.08, 0.12, 'square', 0.06); map.tone(1318, 0.2, 0.18, 'square', 0.06);
    map.hud.banner('🤖 잡았다! +' + SC.tag, 1.2); botsChip(); marksB();
    if (resolved() >= bots.length) endRound(true);
  }
  function safeB(b) {
    b.st = 'safe'; b.pts = null; rs.safe += SC.safe; rs.safes++; addScore(SC.safe);
    map.tone(660, 0, 0.1, 'triangle', 0.06); map.tone(523, 0.1, 0.16, 'triangle', 0.06);
    map.hud.toast('🏠 로봇이 집에 찜! (+' + SC.safe + ')', 1.6); botsChip(); marksB();
    if (resolved() >= bots.length) endRound(true);
  }
  function marksB() {
    const mk = bots.filter(b => b.st !== 'hid').map(b => ({ x: b.st === 'tagged' ? b.spot.x : b.pos.x, z: b.st === 'tagged' ? b.spot.z : b.pos.z, color: b.st === 'tagged' ? '#35c46a' : b.st === 'safe' ? '#9aa3ad' : '#ffb020', shape: b.st === 'tagged' ? 'star' : 'dot', blink: b.st === 'run' || b.st === 'pop' }));
    mk.push({ x: A.home.x, z: A.home.z, color: '#35c46a', shape: 'ring', r: 8 });
    map.minimap.setMarks(mk);
  }
  function peek() {
    if (st !== 'play' || mode !== 'b') return;
    if (peekT > 0) return;
    if (peeks <= 0) { map.hud.toast('👀 이번 라운드 엿보기를 다 썼어요', 1.6); return; }
    peeks--; peekT = 3; chip('peek', '👀 엿보기 ×' + peeks + (coarse ? '' : ' (H)'), { onClick: peek });
    map.tone(523, 0, 0.1, 'sine', 0.08); map.tone(784, 0.08, 0.1, 'sine', 0.08); map.tone(1046, 0.16, 0.16, 'sine', 0.08);
    map.hud.toast('👀 벽 너머 로봇이 잠깐 보여요!', 2);
  }
  function beepBot(b, me) {
    const d = dist(b.pos, me.x, me.z); if (d > 24) return;
    const v = 0.025 + 0.11 * Math.max(0, 1 - d / 24);
    map.tone(1480, 0, 0.06, 'square', v); map.tone(1975, 0.09, 0.07, 'square', v);
  }
  function relocate(me, now) {   // 10Hz — 멀리 있는 로봇이 한 번 몰래 자리를 옮김(40초 뒤 · 나와 12m 넘게)
    if (!RD.sneak || (timeOver || RD.time) - T < 40) return;
    for (const b of bots) {
      if (b.st !== 'hid' || b.moved || rng() > 0.004) continue;
      if (dist(b.pos, me.x, me.z) < 12) continue;
      const free = okSpots().filter(s => !bots.some(q => q.spot === s) && Math.hypot(s.x - me.x, s.z - me.z) > 12);
      if (!free.length) continue;
      b.spot = free[Math.floor(rng() * free.length)]; b.moved = true; placeBot(b);
      if (now - moveToastT > 10) { moveToastT = now; map.hud.toast('🤖 어디선가 로봇이 몰래 자리를 옮겼어요!', 2.4); map.tone(660, 0, 0.08, 'triangle', 0.05); map.tone(880, 0.1, 0.08, 'triangle', 0.05); }
      return;
    }
  }
  function tickB(dt) {
    for (const b of bots) {
      if (b.st === 'pop') { b.t += dt; const k = Math.min(1, b.t / 0.6); b.pos.x = b.hx0 + (b.hx1 - b.hx0) * k; b.pos.z = b.hz0 + (b.hz1 - b.hz0) * k; b.pos.y = b.hy0 + (b.hy1 - b.hy0) * k;
        turn(b.pos, Math.atan2(b.hx1 - b.hx0, b.hz1 - b.hz0), dt * 10); if (b.t >= 0.6) { b.st = 'run'; b.t = 0; b.pts = null; want(b, R0.home[0], R0.home[1], R0.home[2]); } continue; }
      if (b.st === 'run') { b.t += dt; const sp = RD.run * (b.t < 1.2 ? 1.35 : 1); if (b.pts) { if (follow(b, dt, sp)) b.pts = null; } else if (b.fail > 2) straight(b, dt, sp, A.home.x, A.home.z); else if (!b.need) want(b, R0.home[0], R0.home[1], R0.home[2]); }
    }
  }
  function tick10B(now, me) {
    for (const b of bots) {
      if (b.st === 'hid' && b.show && !map.hide.current() && dist(b.pos, me.x, me.z) < 1.1) { pop(b); continue; }   // 보이는 자리 로봇에 부딪힘
      if (b.st === 'run') { if (dist(b.pos, me.x, me.z) < 1.2 && Math.abs(b.pos.y - me.y) < 1.2) { tagB(b); if (st !== 'play') return; continue; }
        if (atHomeXZ(b.pos.x, b.pos.z)) { safeB(b); if (st !== 'play') return; continue; } }
    }
    if (peekT > 0 && (peekT -= 0.1) <= 0) { peekT = 0; }
    if ((beepT -= 0.1) <= 0) { beepT = 6 + rng() * 3; const un = bots.filter(b => b.st === 'hid'); if (un.length) beepBot(un[Math.floor(rng() * un.length)], me); }
    relocate(me, now);
    if (bots.some(b => b.st === 'run' || b.st === 'pop')) marksB();
  }

  // ---------- 로봇 그리기(매 프레임 · 행렬 ≤5 · 새 객체 없음) ----------
  function bubAt(d, t, x, y, z) {   // 머리 위 글자(DOM) — 글자가 바뀔 때만 textContent
    if (!t) { if (d.shown) { d.shown = ''; d.style.display = 'none'; } return; }
    if (d.shown !== t) { d.shown = t; d.textContent = t; }
    _v.set(x, y, z).project(cam);
    if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) d.style.display = 'none';
    else { d.style.display = 'block'; d.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * innerWidth - 11).toFixed(0) + 'px,' + ((-_v.y * 0.5 + 0.5) * innerHeight - 18).toFixed(0) + 'px)'; }
  }
  const cam = map.camera;
  function drawBots(tt) {
    const e = cam.matrixWorld.elements, cx = e[12], cz = e[14], fx = -e[8], fz = -e[10];
    let n = 0; const peekOn = peekT > 0;
    if (botMat.depthTest === peekOn) { botMat.depthTest = !peekOn; botMesh.renderOrder = peekOn ? 12 : 0; }
    for (const sk of seekers) {   // 술래(빨간 로봇 · 크기 1) — 앞 칸부터
      const c = sk.c, mv = sk.pts && sk.pi < sk.pts.length || sk.st === 'chase', y = c.y + 0.01 + Math.abs(Math.sin(tt * (sk.st === 'chase' ? 12 : 7) + sk.id)) * (mv ? 0.05 : 0.01);
      const yaw = c.yaw + (sk.st === 'inspect' && sk.look > 0 || sk.st === 'found' ? Math.sin(tt * 18) * 0.06 : 0);
      sk.fan.position.set(c.x, c.y + 0.05, c.z); sk.fan.rotation.set(0, c.yaw, 0);
      const d = bub(5 + sk.id), t = SK_BUB[sk.st] || '';
      const dx = c.x - cx, dz = c.z - cz; if (dx * dx + dz * dz > 1600 || (dx * fx + dz * fz < -1.5)) { if (d.shown) { d.shown = ''; d.style.display = 'none'; } continue; }
      botMesh.setMatrixAt(n, _m4.compose(_v.set(c.x, y, c.z), _q.setFromEuler(_e.set(0, yaw, 0)), _s.set(1.05, 1.05, 1.05)));
      if (slotHex[n] !== SEEK_C) { slotHex[n] = SEEK_C; botMesh.setColorAt(n, _c.set(SEEK_C)); botMesh.instanceColor.needsUpdate = true; }
      n++; bubAt(d, t, c.x, y + 1.5, c.z);
    }
    for (const b of bots) {
      let vis, sc = 0.72, y = b.pos.y + 0.02, x = b.pos.x, z = b.pos.z, yaw = b.pos.yaw, hex = BOT_C[b.i], bubT = '';
      if (mode === 'a') {
        vis = b.st !== 'hid' || !!SHOW_KIND[b.spot.kind];
        if (b.st === 'hid') { sc = SHOW_KIND[b.spot.kind] || 0; x = b.spot.x; z = b.spot.z; y = b.spot.y + 0.02; yaw = -b.spot.face * R2D + Math.PI + Math.sin(tt * 1.3 + b.i) * 0.25; }
        else if (b.st === 'frozen') { hex = ICE_C; bubT = '❄'; }
        else { y += Math.abs(Math.sin(tt * (b.st === 'run' || b.st === 'rescue' ? 14 : 9) + b.i)) * 0.06; bubT = b.st === 'run' ? '❗' : b.st === 'safe' ? '🏠' : b.st === 'rescue' ? '🏃' : ''; }
      } else {
        if (st === 'count') continue;
        const hidV = b.st === 'hid' && (b.show || (peekOn && dist(b.pos, cx, cz) < 20));
        vis = hidV || b.st === 'pop' || b.st === 'run' || b.st === 'safe' || b.anim > 0 || (b.st !== 'tagged' && st === 'roundEnd');
        if (b.st === 'hid' || (st === 'roundEnd' && b.st === 'hid')) { sc = b.s || 0.6; yaw += Math.sin(tt * 1.3 + b.i) * 0.25; if (peekOn) hex = PEEK_C; }
        if (b.st === 'pop') { const a = Math.min(1, b.t / 0.6); y += Math.sin(a * Math.PI) * 0.7; sc = 0.72; yaw += a * Math.PI * 2; bubT = '❗'; }
        else if (b.st === 'run') { y += Math.abs(Math.sin(tt * 14 + b.i)) * 0.07; bubT = '❗'; }
        else if (b.st === 'safe') { bubT = '🏠'; }
        if (b.anim > 0) { const a = 1 - b.anim / 1.6; x = b.ax; z = b.az; y = b.ay + Math.abs(Math.sin(a * Math.PI * 3)) * 0.45; sc = 0.72 * (b.anim < 0.3 ? b.anim / 0.3 : 1); yaw += a * Math.PI * 4; bubT = '⭐'; }
      }
      const bb = bubs[b.i];
      if (!vis) { if (bb && bb.shown) { bb.shown = ''; bb.style.display = 'none'; } continue; }
      const dx = x - cx, dz = z - cz; if (dx * dx + dz * dz > 1600 || (dx * fx + dz * fz < -1.5)) { if (bb && bb.shown) { bb.shown = ''; bb.style.display = 'none'; } continue; }
      botMesh.setMatrixAt(n, _m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, yaw, 0)), _s.set(sc, sc, sc)));
      if (slotHex[n] !== hex) { slotHex[n] = hex; botMesh.setColorAt(n, _c.set(hex)); botMesh.instanceColor.needsUpdate = true; }
      n++;
      if (bubT) bubAt(bub(b.i), bubT, x, y + sc * 1.55 + 0.1, z);
      else if (bb && bb.shown) { bb.shown = ''; bb.style.display = 'none'; }
    }
    botMesh.count = n; botMesh.visible = n > 0; if (n) botMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- ⚡힘(10Hz) — 달리면 4.5초에 바닥 · 걸으면 6초 · 가만히/웅크림/숨음 3.5초에 참 · 바닥나면 헉헉(느리게) ----------
  function stamTick(me) {
    const dx = me.x - lastPX, dz = me.z - lastPZ, v = lastOK ? Math.hypot(dx, dz) / 0.1 : 0; lastPX = me.x; lastPZ = me.z; lastOK = true;
    const run = v > 5.0 * (tired ? 0.62 : 1) && v < 14;
    if (run) stam -= 0.1 / 4.5; else stam += 0.1 / (v > 1 && !map.player.crouched() ? 6 : 3.5);
    stam = Math.max(0, Math.min(1, stam));
    if (!tired && stam <= 0) { tired = true; map.player.speed(0.62); map.tone(220, 0, 0.12, 'triangle', 0.05); }
    else if (tired && stam >= 0.35) { tired = false; map.player.speed(1); }
    const k = tired ? -1 : Math.round(stam * 5);
    if (k !== stamShown) { stamShown = k; chip('stam', k < 0 ? TIRED_TXT : STAM_TXT[k]); }
  }

  // ---------- 라운드 끝 · 게임 끝 ----------
  async function endRound(ok) {
    if (st !== 'play' && st !== 'count') return;
    st = 'roundEnd'; map.player.freeze(true); goal(null); if (map.hide.current()) map.hide.exit(); map.player.setCrouch(null);
    for (const sk of seekers) { sk.st = 'wait'; sk.pts = null; skVis(sk); }
    if (heartEl) heartEl.style.opacity = '0'; beatOn = false; chip('near', null); nearShown = -1;
    let lines;
    if (mode === 'a') {
      const secPts = Math.round(rs.sec) * SC.sec; rs.round = ok ? SC.round : 0; rs.friend = bots.filter(b => b.st !== 'frozen').length * SC.friend;
      addScore(secPts + rs.round + rs.friend);
      map.sfx(ok ? 'done' : 'buzz');
      lines = (ok ? '🎉 ' + rn + '라운드 버텼어요!' : '❄ ' + rn + '라운드 — 얼음이 안 풀렸어요') + '\n버틴 ' + Math.round(rs.sec) + '초 +' + secPts + ' · 찜 ' + rs.homes + '번 +' + rs.home + ' · 구하기 ' + rs.rescues + '번 +' + rs.rescue +
        (ok ? ' · 버팀 +' + SC.round : '') + ' · 친구 +' + rs.friend + '\n⭐ 지금까지 ' + score;
    } else {
      rs.left = ok ? Math.round(Math.max(0, T)) : 0; addScore(rs.left);
      map.sfx(ok ? 'done' : 'buzz'); marksB();
      lines = (ok ? '🎉 ' + rn + '라운드 로봇을 다 찾았어요!' : '⏰ ' + rn + '라운드 시간 끝!') + '\n잡기 ' + rs.tags + ' +' + rs.tag + ' · 찜 ' + rs.safes + ' +' + rs.safe + (ok ? ' · 남은 시간 +' + rs.left : ' · 못 찾음 ' + bots.filter(b => b.st === 'hid').length) + '\n⭐ 지금까지 ' + score;
      if (!ok) map.minimap.setMarks(bots.map(b => ({ x: b.spot.x, z: b.spot.z, color: b.st === 'tagged' ? '#35c46a' : b.st === 'hid' ? '#ff4d5e' : '#9aa3ad', shape: b.st === 'tagged' ? 'star' : 'dot' })));
    }
    last = { mode, area: areaKey, round: rn, ok, score, rs: { ...rs } };
    if (rn < 3) {
      const i = await map.hud.ask(lines, ['▶ ' + (rn + 1) + '라운드', '그만하기']);
      if (dead || map.gone || i < 0) return;
      if (i === 0) beginRound(rn + 1); else map.quit();
      return;
    }
    const key = (mode === 'a' ? 'scoreA.' : 'scoreB.') + areaKey, prev = map.store.get(key, null), rec = prev == null || score > prev; if (rec) map.store.set(key, score);
    last.final = true; last.rec = rec; last.best = rec ? score : prev;
    const i = await map.hud.ask(lines + '\n\n🏁 모두 끝! 합계 ⭐' + score + (rec ? '  🏆 새 기록!' : '  (최고 ⭐' + prev + ')'), ['다시 하기', '다른 구역·놀이', '그만하기']);
    if (dead || map.gone || i < 0) return;
    if (i === 0) { score = 0; beginRound(1); } else if (i === 1) menu(false); else map.quit();
  }

  map.on('hide', ev => {   // 들어가는 모습을 본 술래(0.6초 안) — 그 술래는 그 자리를 뒤지러 온다
    if (!ev.on) { pHid = null; return; }
    const by = new Set(); for (const sk of seekers) if (now - sk.sawP < 0.6) by.add(sk.id); pHid = { spot: ev.spot, by };
  });
  const onKD = e => { if (e.code === 'KeyH' && !e.repeat && !e.ctrlKey) peek(); };
  addEventListener('keydown', onKD);

  // ---------- 경계 되돌림(10Hz) ----------
  let outT = 0, safe = null;
  function fence(me) {
    if (inArea(me.x, me.y, me.z)) { outT = 0; if (me.ground) safe = [me.x, me.y, me.z]; return; }
    if ((outT += 0.1) < 0.3) return; outT = 0;
    map.player.teleport(safe || [A.start[0], map.q.floorY(A.start[0], A.start[1]), A.start[1]]);
    map.hud.toast('🚧 이번 판 놀이 구역(빨간 띠) 밖이에요', 1.8); map.tone(300, 0, 0.12, 'triangle', 0.06);
  }

  let now = 0, tt = 0;
  menu(true);

  return {
    tick(dt) {
      if (dead) return;
      tt += dt;
      if (homeRing) homeRing.material.opacity = 0.45 + Math.abs(Math.sin(tt * (pTrip ? 6 : 2))) * 0.45;
      if (botMesh && bots.length) drawBots(tt);
      if (st === 'count') {
        cd -= dt; const n = Math.ceil(cd);
        if (n !== cdShown) { cdShown = n; if (n > 0) { chip('time', (mode === 'a' ? '🙈 ' : '🤖 ') + n + ' · ' + rn + '/3'); map.sfx('tick'); } }
        if (mode === 'a') { planOne(); for (const b of bots) if (b.st === 'go' && b.pts && follow(b, dt, b.sp)) hidBot(b, -99); }
        if (cd <= 0) {
          st = 'play'; now = 0; secShown = -1; lastOK = false;
          if (mode === 'a') { for (const sk of seekers) setSk(sk, 'patrol'); map.hud.banner('찾는다!', 1.2); map.tone(660, 0, 0.12, 'square', 0.06); map.tone(990, 0.12, 0.2, 'square', 0.06);
            goal(coarse ? '🙈 버티기 · ⬇ 조용히 · ✋ 숨기' : '🙈 버티기 · C 웅크리면 조용 · E 숨기/나오기'); }
          else { map.player.freeze(false); map.hud.banner('찾아라!', 1.2); map.sfx('go');
            goal(coarse ? '🔍 ✋ 살펴보기 → 도망가는 로봇을 터치!' : '🔍 숨을 만한 곳 앞에서 E → 도망가는 로봇을 터치! · H 엿보기');
            chip('peek', '👀 엿보기 ×' + peeks + (coarse ? '' : ' (H)'), { onClick: peek }); botsChip(); }
        }
        if ((t10 += dt) >= 0.1) { t10 = Math.min(0.1, t10 - 0.1); const me = map.player.get(); if (mode === 'a') fence(me); }
        return;
      }
      if (st !== 'play') return;
      T -= dt; now += dt;
      const sec = Math.ceil(T); if (sec !== secShown) { secShown = sec; chip('time', '⏱ ' + fmt(T) + ' · ' + rn + '/3'); if (sec <= 5 && sec > 0) map.sfx('tick'); }
      if (T <= 0) { endRound(mode === 'a' ? !frozenP : false); return; }
      planOne();
      if (mode === 'a') { tickA(dt, now); heartTick(dt); } else tickB(dt);
      for (const b of bots) if (b.anim > 0 && (b.anim -= dt) <= 0) b.anim = 0;
      if (mode === 'a' && !frozenP && !(atHome && homeT > 6)) rs.sec += dt;   // 버틴 시간(얼지 않고 · 집에서 6초 넘게 쉬지 않은 동안)
      if ((t10 += dt) < 0.1) return; t10 = Math.min(0.1, t10 - 0.1);   // 10Hz(남는 시간은 다음으로)
      const me = map.player.get();
      if (!frozenP) fence(me);
      stamTick(me);
      if (mode === 'a') tick10A(now, me); else tick10B(now, me);
    },
    stop() {
      dead = true; removeEventListener('keydown', onKD);
      if (heartEl) heartEl.remove(); if (iceEl) iceEl.remove(); for (const b of bubs) if (b) b.remove();
      if (botGeo) botGeo.dispose(); if (botMat) botMat.dispose(); if (botMesh && botMesh.dispose) botMesh.dispose();   // 메시·경계 띠·술래·숨는 자리·세상 바꾸기는 범위 파사드·엔진·FX reset이 뗀다
    },
    // 시험·교사 시연용(읽기 · 판 조작)
    get state() { return st; }, get mode() { return mode; }, get area() { return areaKey; }, get round() { return rn; }, get timeLeft() { return T; }, get last() { return last; }, get score() { return score; }, get rs() { return rs; },
    get stam() { return stam; }, get tired() { return tired; }, get frozen() { return frozenP; }, get atHome() { return atHome; }, get peeks() { return peeks; }, get peekT() { return peekT; },
    get seekers() { return seekers.map(s => ({ id: s.id, st: s.st, x: s.c.x, y: s.c.y, z: s.c.z, tgt: s.tgt === 'p' ? 'p' : s.tgt ? s.tgt.i : null, spot: s.spot && s.spot.label, seeP: s.seeP })); },
    get bots() { return bots.map(b => ({ i: b.i, st: b.st, label: b.spot && b.spot.label, kind: b.spot && b.spot.kind, x: b.pos.x, y: b.pos.y, z: b.pos.z, spot: b.spot && { x: b.spot.x, z: b.spot.z, stand: b.spot.stand }, moved: b.moved, show: b.show })); },
    get spots() { return R0 ? R0.spots.map(s => ({ label: s.label, kind: s.kind, x: s.x, y: s.y, z: s.z, face: s.face, stand: s.stand, hs: s.hs, ok: s.ok })) : []; }, get edges() { return R0 ? R0.edges.length : 0; },
    get home() { return A && { ...A.home, y: R0 && R0.home[1] }; },
    begin(k, m, n = 1) { if (m) mode = m; areaKey = k; score = 0; beginRound(n); }, skipCount() { if (st === 'count') cd = 0.001; }, endNow() { if (st === 'play') T = 0.001; }, check: i => R0 && check(R0.spots[i]), peek,
    inArea: (x, y, z) => inArea(x, y, z), setStam(v) { stam = v; }, inspect(k, i) { const sk = seekers[k], s = R0.spots[i]; if (!sk || !s) return false; setSk(sk, 'inspect'); sk.spot = s; want(sk, s.stand[0], s.stand[1], s.stand[2]); return true; },
    reveal() { for (const b of bots) { b.show = true; b.s = b.s || 0.62; } },
  };
}
