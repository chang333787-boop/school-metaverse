// 숨바꼭질(GAME-HS · 09-27) — 혼자 하는 숨바꼭질 두 가지. 설계 = docs/tasks/story_engine.md '게임 후보 4' · 정본 = docs/map_api.md §12
//   A. 🙈 내가 숨기: 장난감 술래 로봇이 출발 자리에서 10초 세는 동안 이번 판 구역 안에 숨는다(웅크리기 C·Ctrl/⬇ · 숨는 자리 E/✋).
//      술래는 시야(바닥 부채꼴)·소리(뛰면 멀리 들림 · 웅크려 걸으면 거의 안 들림)로 찾고, 숨는 자리를 하나씩 '확인'한다(그 앞에 2초 — 거기 있으면 찾음).
//      1초 넘게 보이면 '찾았다!'(숨바꼭질 규칙) · 2분 버티면 이김 · 찾히면 버틴 시간.
//   B. 🔍 내가 술래: 장난감 로봇 5개가 구역의 숨는 자리에 숨는다 → 3분 안에 다 찾기(숨는 자리 앞 '🔍 살펴보기' E/✋).
//      가끔 삐빅(가까울수록 크게) · 💡 힌트(H/칩 — 미니맵에 대강 자리) · 멀리 있을 때 로봇마다 한 번 몰래 자리를 옮길 수 있다.
//   구역(판마다 하나): 서관 1층 · 운동장+큰 나무 · 급식실+동쪽 복도 — zones 계약(구역 id) + 바닥 경계 띠(빨강) · 밖으로 나가면 되돌림.
//   기록: 구역마다 A 가장 오래 버틴 시간 · B 가장 빨리 다 찾은 시간(map.store — 판이 끝날 때만 씀).
// 규칙(_template.js): import 금지(three = map.three) · 새 조명 없음 · 사람(NPC)은 술래·목표가 아니다(술래·숨는 것 = 장난감 로봇) · 대사·쪽지 없음 — 화면 글자는 UI 문구와 지도에 있는 장소·가구 이름뿐
//   드로우콜 = 술래 로봇 1 + 시야 부채꼴 1(A) · 숨은 로봇 1(B) · 경계 띠 1 · 미니맵(DOM) — 매 프레임 새 객체 없음(감지·두뇌는 10Hz)
export const meta = { id: 'hideseek', title: '숨바꼭질', api: 1 };

const COUNT = 10, TIME_A = 120, TIME_B = 180, N_BOTS = 5, SEEN_FOUND = 1.0, CHECK_P = 0.6, RECHECK = 35, BEEP_R = 24;
// 숨는 자리: 실제 가구·장소 자리(월드 좌표) — k = 엔진 숨는 자리 종류(눈 높이 · locker·cabinet·curtain = 서서 · desk·bush = 웅크려) · f = 앞면(들어가는 쪽) 방위° · eye = 틈새 눈 높이
//   B 모드: 로봇이 보이는 자리(show) = 책상·평상·덤불·모퉁이(몸이 조금 보임) · 사물함·장·커튼 속은 안 보임(삐빅 소리·살펴보기로 찾기)
const AREAS = {
  west: {
    title: '서관 1층', icon: '🏫',
    zones: ['nurse', 'narae', 'library', 'west-lobby', 'west-door', 'stair-store', 'stair-west', 'stair-landing', 'corridor-main'],
    clip: [-40.2, -44.7, -11, -31.4], ymax: 2,
    seeker: { at: [-29.6, -36.6], h: 180 }, start: [-27.2, -36.2], startH: 90, range: 9, speed: 1.5,
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
    title: '운동장 + 큰 나무', icon: '🌳',
    zones: ['field', 'bball-sand', 'forest-play', 'podium', 'front-slope', 'front-bed-south', 'south-plaza'],
    clip: [0, -17.5, 39.7, 49.4], ymax: 1,
    seeker: { at: [36.5, 26.9], h: 180 }, start: [31.5, 22.5], startH: 200, range: 12, speed: 2.0,
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
    title: '급식실 + 동쪽 복도', icon: '🍚',
    zones: ['cafeteria', 'center-lobby', 'link-corridor', 'corridor-east', 'music-passage'],
    clip: null, ymax: 2,
    seeker: { at: [12.6, -35.4], h: 180 }, start: [5.5, -42.2], startH: 180, range: 9, speed: 1.5,
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
const SHOW_KIND = { desk: 0.5, bush: 0.6, corner: 0.62, slide: 0.55 };   // B: 로봇이 보이는 자리 → 크기(웅크린 장난감) · 나머지 = 속에 숨어 안 보임
const BOT_C = [0xffd9a0, 0xbfe8ff, 0xd8c8ff, 0xc8f0c0, 0xffc8d8];
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default async function start(map, params = {}) {
  const THREE = map.three;
  let dead = false, st = 'prep', mode = null, areaKey = null, A = null, round = 0, T = 0, cd = 0, cdShown = -1, secShown = -1, t10 = 0, last = null;
  const seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now();
  const rng = map.rng(seed);
  const ROUND_A = Math.max(10, Math.min(600, +params.time || TIME_A)), ROUND_B = Math.max(10, Math.min(600, +params.time || TIME_B));
  const RR = [];                                  // 이번 판에 만든 것(숨는 자리·술래·살펴보기·경계) — 판이 바뀌면 뗀다
  const own = h => { if (h) RR.push(h); return h; };

  map.player.freeze(true);
  map.hud.banner('숨바꼭질 준비 중…', 30);
  map.sfx('warm');
  const nav = await map.nav();
  if (dead || map.gone) return {};                // 길격자를 짓는 사이 ⏹ 그만하기 → 범위가 이미 정리됨(map.gone)
  map.hud.banner('', 0.01);

  // ---------- 구역 판정 · 숨는 자리 풀기(구역마다 처음 한 번) ----------
  const ids = new Map();                          // areaKey → Set(zone id)
  const inAreaK = (k, x, y, z) => { const a = AREAS[k], c = a.clip; if (c && (x < c[0] || x > c[2] || z < c[1] || z > c[3])) return false; if (y > a.ymax) return false;
    const zn = map.zoneAt(x, y, z); return !!zn && ids.get(k).has(zn.id); };
  const inArea = (x, y, z) => inAreaK(areaKey, x, y, z);
  const RES = new Map();                           // areaKey → { spots:[…], tape, wps }
  function resolveArea(k) {
    if (RES.has(k)) return RES.get(k);
    const a = AREAS[k]; ids.set(k, new Set(a.zones.map(z => (map.zone(z) || {}).id).filter(Boolean)));
    const spots = [];
    for (const d of a.spots) {                     // 엔진 hide.add로 앞면·서는 칸을 한 번 구하고 뗀다(좌표만 남김)
      const st = d.st ? [d.st[0], map.q.floorY(d.st[0], d.st[1]), d.st[1]] : undefined;   // 서는 칸을 정해 준 자리(침대·벤치 위를 잡지 않게)
      if (st && map.q.blocked(st[0], st[2], st[1])) console.warn('[hideseek] 정한 서는 칸이 막힘', k, d.l, st);
      const h = map.hide.add({ x: d.x, z: d.z, y: d.y, face: d.f, w: d.w, kind: d.k, label: d.l, eye: d.eye, near: a.start, stand: st });
      const s = h.spot; h.remove();
      if (!s) { console.warn('[hideseek] 숨는 자리를 못 놓음', k, d.l, d.x, d.z); continue; }
      if (!inAreaK(k, s.stand.x, s.stand.y, s.stand.z)) { console.warn('[hideseek] 서는 칸이 구역 밖', k, d.l, s.stand); continue; }
      spots.push({ x: s.x, y: s.y, z: s.z, face: s.face, w: s.w, kind: d.k, label: d.l, eye: s.eye, stand: [s.stand.x, s.stand.y, s.stand.z], lastT: -99, hs: null });
    }
    const r = { spots, edges: tapeEdges(k), wps: spots.map(s => s.stand) };
    RES.set(k, r); return r;
  }
  // 경계 띠: 구역 안 걷는 칸 중 이웃(0.3m)이 구역 밖 걷는 칸인 곳 — 그 사이 선분(바닥 +7cm) · 문·트인 복도·계단·바깥 둘레를 모두 잡는다
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
  function tapeMesh(edges) {                        // 한 메시(드로우콜 1) · 빨강 띠(폭 0.12) — 조명 무시 · 바닥에서 7cm 띄움
    const pos = [], W = 0.07;
    for (const [x0, y0, z0, x1, y1, z1] of edges) { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * W, nz = dx / l * W, y = y0 + 0.07;
      pos.push(x0 + nx, y, z0 + nz, x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x0 + nx, y, z0 + nz, x1 - nx, y, z1 - nz, x0 - nx, y, z0 - nz); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff4d5e, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }));
    m.renderOrder = 3; m.frustumCulled = false;
    const h = map.add(m); return { remove() { h.remove(); g.dispose(); m.material.dispose(); } };
  }

  // ---------- B: 숨은 장난감 로봇(InstancedMesh 5 · 드로우콜 1) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), R2D = Math.PI / 180;
  let botMesh = null, botGeo = null, botMat = null;
  function ensureBots() {
    if (botMesh) return;
    // 낮은 면 장난감 로봇(하나 = 280삼각형 — 급식실처럼 꽉 찬 화면(게임 없이 14.8만)에 5개가 다 보여도 15만 안): 몸·머리 20면체 1단 · 얼굴판·배 20면체 · 눈·더듬이 공·손·발 8면체 · 더듬이 대 6각
    const SPH = new THREE.IcosahedronGeometry(1, 1), SPHS = new THREE.IcosahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0), CYL = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
    const parts = [[SPH, [0, 0.4, 0], [0.3, 0.28, 0.27], 0xffffff], [SPHS, [0, 0.38, 0.17], [0.18, 0.14, 0.11], 0xe8eef4],
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
    botMesh = new THREE.InstancedMesh(botGeo, botMat, N_BOTS); botMesh.frustumCulled = false; botMesh.castShadow = botMesh.receiveShadow = false;
    for (let i = 0; i < N_BOTS; i++) { botMesh.setMatrixAt(i, ZERO); botMesh.setColorAt(i, _c.set(BOT_C[i])); }
    botMesh.count = 0; botMesh.visible = false; map.add(botMesh);
  }

  // ---------- 상태 ----------
  let R = null;          // 지금 구역 풀린 것
  let seeker = null, sBrain = null, seenT = 0, warnOn = false, hotPos = null, foundWhy = null;
  const bots = [];       // B: { i, spot, found, moved, anim, x,y,z }
  let beepT = 0, hintCool = 0, hintT = 0, hintN = 0, moveToastT = 0, foundN = 0;
  const coarse = matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch');
  const goal = t => map.hud.goal(t);

  function clearRound() {
    if (map.hide.current()) map.hide.exit();
    for (const h of RR.splice(0)) { try { h.remove(); } catch (e) { console.error(e); } }
    seeker = null; sBrain = null; seenT = 0; warnOn = false; hotPos = null; foundWhy = null;
    if (R) for (const s of R.spots) { s.hs = null; s.lastT = -99; s.inv = null; }
    bots.length = 0; if (botMesh) { botMesh.count = 0; botMesh.visible = false; }
    map.hud.chip('time', null); map.hud.chip('bots', null); map.hud.chip('hint', null); map.hud.chip('area', null);
    map.minimap.setMarks([]); map.player.speed(1);
  }

  // ---------- 메뉴 ----------
  async function menu(first) {
    st = 'menu'; map.player.freeze(true); clearRound(); goal(null);
    let m = first && /^[ab]$/.test(params.mode || '') ? params.mode : null;
    if (!m) { const i = await map.hud.ask('🙈 숨바꼭질\n어떻게 놀까요?', ['🙈 내가 숨기 (술래 로봇 피해 2분)', '🔍 내가 술래 (로봇 5개 찾기 · 3분)', '그만하기']);
      if (dead || map.gone || i < 0) return; if (i === 2) { map.quit(); return; } m = i === 0 ? 'a' : 'b'; }
    let k = first && AREAS[params.area] ? params.area : null;
    if (!k) { const bestTxt = kk => { const b = map.store.get((m === 'a' ? 'bestA.' : 'bestB.') + kk, null); return b == null ? '' : m === 'a' ? '  (가장 오래 ' + fmt(b) + ')' : '  (가장 빨리 ' + fmt(b) + ')'; };
      const i = await map.hud.ask('어디에서 할까요?', [...AREA_KEYS.map(kk => AREAS[kk].icon + ' ' + AREAS[kk].title + bestTxt(kk)), '🎲 아무 데나']);
      if (dead || map.gone || i < 0) return; k = i < 3 ? AREA_KEYS[i] : AREA_KEYS[Math.floor(rng() * 3)]; }
    mode = m; begin(k);
  }

  function begin(k) {
    clearRound(); round++; areaKey = k; A = AREAS[k]; R = resolveArea(k); st = 'count'; cd = COUNT; cdShown = -1; secShown = -1; t10 = 0;
    own(tapeMesh(R.edges));
    map.minimap.show();
    map.hud.chip('area', A.icon + ' ' + A.title);
    if (mode === 'a') beginA(); else beginB();
  }

  // ---------- A: 내가 숨기 ----------
  function beginA() {
    T = ROUND_A;
    map.player.crouch(true);
    for (const s of R.spots) { const h = own(map.hide.add({ x: s.x, y: s.y, z: s.z, face: s.face, w: s.w, kind: s.kind, label: s.label, eye: s.eye, stand: s.stand })); s.hs = h.spot; }
    const sy = map.q.floorY(A.seeker.at[0], A.seeker.at[1]);
    seeker = own(map.chaser.spawn({ kind: 'robot', at: [A.seeker.at[0], sy, A.seeker.at[1]], path: [[A.seeker.at[0], sy, A.seeker.at[1]]], zone: [...ids.get(areaKey)],
      speed: A.speed, chase: 3.1, fov: 100, range: A.range, hear: 1, onCatch: () => found(performance.now() - hideOffT < 100 ? 'spot' : 'catch') }));   // 숨은 자리를 뒤져 찾음 = 엔진이 먼저 나오게 함('hide' on:false)
    if (!seeker) { map.hud.toast('술래 로봇을 못 만들었어요'); menu(false); return; }
    seeker.pause(true); seeker.raw.yaw = (180 - A.seeker.h) * R2D;   // 벽·기둥·나무를 보고 센다(방위 h를 봄 — 엔진 yaw ↔ 방위 = 180 − yaw°)
    sBrain = { target: null, t: 0, lastSt: 'patrol' };
    map.player.teleport([A.start[0], map.q.floorY(A.start[0], A.start[1]), A.start[1]], { h: A.startH });
    map.player.freeze(false);
    goal(coarse ? '🙈 10 세는 동안 숨어요! ⬇ · ✋' : '🙈 로봇이 10 셀 동안 숨어요! C·Ctrl 웅크리기 · E 숨기');
    map.hud.toast('빨간 띠 밖으로는 못 나가요 · 뛰면 발소리가 커요', 4);
    map.sfx('go');
  }
  function pickSpotA(now) {
    const avail = R.spots.filter(s => s.hs && now - s.lastT > RECHECK);
    if (!avail.length) return null;
    let sum = 0; const w = avail.map(s => { const d = Math.hypot(s.stand[0] - seeker.raw.x, s.stand[2] - seeker.raw.z);
      let v = 1 / (1 + d / 10); if (hotPos && Math.hypot(s.x - hotPos[0], s.z - hotPos[1]) < 7) v *= 4; sum += v; return v; });
    let r = rng() * sum; for (let i = 0; i < avail.length; i++) { r -= w[i]; if (r <= 0) return avail[i]; } return avail[avail.length - 1];
  }
  function brainA(now) {             // 10Hz — 술래가 순찰(patrol) 중일 때만 다음 할 일을 정한다(수상함·쫓기·뒤지기는 엔진이)
    const c = seeker.raw, stN = c.st, B = sBrain;
    if (stN !== B.lastSt) { if (stN === 'patrol') B.target = null; B.lastSt = stN; }
    if (stN !== 'patrol') return;
    B.t += 0.1;
    if (B.target && B.target.type === 'wp') { if (Math.hypot(B.target.p[0] - c.x, B.target.p[2] - c.z) < 1.0 || B.t > 20) B.target = null; }
    else if (B.target && B.t > 25) B.target = null;
    if (B.target) return;
    B.t = 0;
    const s = (rng() < CHECK_P || hotPos) ? pickSpotA(now) : null;
    if (s) { s.lastT = now; hotPos = null; if (seeker.inspect(s.hs)) { B.target = { type: 'spot', s }; B.lastSt = 'searchSpot'; return; } }
    const far = R.wps.filter(p => Math.hypot(p[0] - c.x, p[2] - c.z) > 6);
    const p = (far.length ? far : R.wps)[Math.floor(rng() * (far.length || R.wps.length))];
    if (p) { seeker.setPath([p]); B.target = { type: 'wp', p }; }
  }
  function found(why) {
    if (st !== 'play' && st !== 'count') return;
    foundWhy = why; st = 'end';
    if (why !== 'catch') { map.tone(784, 0, 0.25, 'sine', 0.2); map.tone(622, 0.22, 0.4, 'sine', 0.2); }
    if (map.hide.current()) map.hide.exit();
    endA(false);
  }
  async function endA(win) {
    st = 'end'; if (seeker) seeker.pause(true); map.player.freeze(true); goal(null); map.player.setCrouch(null);
    const survived = Math.round(ROUND_A - Math.max(0, T)), key = 'bestA.' + areaKey, prev = map.store.get(key, null);
    const rec = prev == null || survived > prev; if (rec) map.store.set(key, survived);
    const wins = map.store.get('winsA', 0) + (win ? 1 : 0); if (win) map.store.set('winsA', wins);
    last = { mode: 'a', area: areaKey, win, why: foundWhy, survived, best: rec ? survived : prev, rec, round };
    map.sfx(win ? 'done' : 'buzz');
    const head = win ? '🎉 ' + fmt(ROUND_A) + ' 동안 안 들켰어요!' : '🙈 찾았다! ' + (foundWhy === 'spot' ? '(숨은 자리를 확인했어요)' : foundWhy === 'seen' ? '(술래 눈에 보였어요)' : '(술래 로봇에게 잡혔어요)');
    const i = await map.hud.ask(head + '\n' + A.title + ' · 버틴 시간 ' + fmt(survived) + (rec ? '  🏆 새 기록!' : '\n가장 오래 버틴 시간 ' + fmt(prev)), ['다시 하기', '다른 구역·놀이', '그만하기']);
    if (dead || map.gone || i < 0) return;
    if (i === 0) begin(areaKey); else if (i === 1) menu(false); else map.quit();
  }

  // ---------- B: 내가 술래 ----------
  function beginB() {
    T = ROUND_B; foundN = 0; hintCool = 45; hintT = 0; hintN = 0; beepT = 4; moveToastT = 0;
    map.player.crouch(false);
    ensureBots();
    // 숨을 자리 5곳: 서로 3m 넘게 · 보이는 자리와 안 보이는 자리를 섞는다(자리 목록을 섞어 앞에서부터)
    const order = R.spots.slice().sort(() => rng() - 0.5), pick = [];
    for (const s of order) { if (pick.length >= N_BOTS) break; if (pick.some(p => Math.hypot(p.x - s.x, p.z - s.z) < 3)) continue; pick.push(s); }
    for (const s of order) { if (pick.length >= N_BOTS) break; if (!pick.includes(s)) pick.push(s); }
    pick.forEach((s, i) => bots.push({ i, spot: s, found: false, moved: false, anim: 0, x: 0, y: 0, z: 0, h: 0 }));
    for (const b of bots) placeBot(b);
    for (const s of R.spots) s.inv = own(map.investigate.add({ x: s.stand[0], y: s.stand[1], z: s.stand[2], r: 1.2, label: '🔍 살펴보기 · ' + s.label, onUse: () => check(s) }));
    map.player.teleport([A.start[0], map.q.floorY(A.start[0], A.start[1]), A.start[1]], { h: A.startH });
    map.player.freeze(true);
    goal(coarse ? '🔍 로봇이 숨는 중… 10 세요' : '🔍 로봇 5개가 숨는 중… 눈 감고 10 세요');
    map.hud.chip('bots', '🤖 0/' + N_BOTS);
  }
  function placeBot(b) {
    const s = b.spot, k = SHOW_KIND[s.kind];
    b.x = s.x; b.y = s.y; b.z = s.z; b.h = s.face; b.show = !!k; b.s = k || 0;
    if (s.kind === 'corner' || s.kind === 'bush') { const f = s.face * R2D; b.x = s.x - Math.sin(f) * 0.1; b.z = s.z + Math.cos(f) * 0.1; }
  }
  // 그리기: 보여야 할 로봇만 앞 칸부터 채우고 count = 그 수(InstancedMesh는 count만큼 삼각형을 센다) · 카메라 뒤·30m 밖은 뺀다 — 매 프레임 행렬 ≤5개 · 새 객체 없음
  const cam = map.camera, slotC = new Int8Array(N_BOTS).map((_, i) => i);
  function drawBots(tt) {
    const e = cam.matrixWorld.elements, cx = e[12], cz = e[14], fx = -e[8], fz = -e[10];
    let n = 0;
    for (const b of bots) {
      if ((!b.show && !(b.anim > 0)) || st === 'count') continue;   // 10 세는 동안은 안 보임
      let y = b.y + 0.02, sc = b.s || 0.6, yaw = -b.h * R2D + Math.PI, x = b.x, z = b.z;
      if (b.anim > 0) { const a = 1 - b.anim / 1.6; x = b.ax; z = b.az; y = b.ay + Math.abs(Math.sin(a * Math.PI * 3)) * 0.45; sc = 0.7 * (b.anim < 0.3 ? b.anim / 0.3 : 1); yaw += a * Math.PI * 4; }
      else yaw += Math.sin(tt * 1.3 + b.i) * 0.25;
      const dx = x - cx, dz = z - cz; if (dx * dx + dz * dz > 900 || (dx * fx + dz * fz < -1.5)) continue;
      botMesh.setMatrixAt(n, _m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, yaw, 0)), _s.set(sc, sc, sc)));
      if (slotC[n] !== b.i) { slotC[n] = b.i; botMesh.setColorAt(n, _c.set(BOT_C[b.i])); botMesh.instanceColor.needsUpdate = true; }   // 칸마다 로봇 색(바뀔 때만)
      n++;
    }
    botMesh.count = n; botMesh.visible = n > 0; if (n) botMesh.instanceMatrix.needsUpdate = true;
  }
  function check(s) {
    if (st !== 'play') return;
    const b = bots.find(q => !q.found && q.spot === s);
    if (!b) { map.hud.toast('🙅 ' + s.label + ' — 아무도 없어요', 1.4); map.tone(330, 0, 0.12, 'triangle', 0.08); return; }
    b.found = true; foundN++; b.anim = 1.6; b.ax = (s.x + s.stand[0]) / 2; b.az = (s.z + s.stand[2]) / 2; b.ay = s.stand[1];
    map.sfx('ding'); map.tone(1046, 0.08, 0.12, 'square', 0.06); map.tone(1318, 0.2, 0.18, 'square', 0.06);
    map.hud.banner('🤖 찾았다! ' + foundN + '/' + N_BOTS, 1.2); map.hud.chip('bots', '🤖 ' + foundN + '/' + N_BOTS);
    marksB();
    if (foundN >= N_BOTS) endB(true);
  }
  function marksB() {
    const mk = bots.filter(b => b.found).map(b => ({ x: b.spot.x, z: b.spot.z, color: '#35c46a', shape: 'star' }));
    if (hintT > 0 && hintN >= 0 && bots[hintN] && !bots[hintN].found) mk.push({ x: hintX, z: hintZ, color: '#ffb020', shape: 'ring', blink: true, r: 9 });
    map.minimap.setMarks(mk);
  }
  let hintX = 0, hintZ = 0;
  function hint() {
    if (st !== 'play' || mode !== 'b') return;
    if (hintCool > 0) { map.hud.toast('💡 힌트는 ' + Math.ceil(hintCool) + '초 뒤에 쓸 수 있어요', 1.6); return; }
    const me = map.player.get(); let best = -1, bd = 1e9;
    bots.forEach((b, i) => { if (b.found) return; const d = Math.hypot(b.spot.x - me.x, b.spot.z - me.z); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    hintN = best; hintT = 6; hintCool = 30; const a = rng() * Math.PI * 2, r = 1 + rng() * 2.5; hintX = bots[best].spot.x + Math.cos(a) * r; hintZ = bots[best].spot.z + Math.sin(a) * r;
    beepBot(bots[best], me, 1); map.hud.toast('💡 미니맵 주황 동그라미 근처에서 삐빅!', 2.4); marksB();
  }
  function beepBot(b, me, force) {
    const d = Math.hypot(b.spot.x - me.x, b.spot.z - me.z); if (d > BEEP_R && !force) return;
    const v = 0.025 + 0.11 * Math.max(0, 1 - d / BEEP_R);
    map.tone(1480, 0, 0.06, 'square', v); map.tone(1975, 0.09, 0.07, 'square', v);
  }
  function relocate(me, now) {          // 10Hz — 멀리 있는 로봇이 한 번 몰래 자리를 옮김(40초 뒤 · 나와 12m 넘게 · 옮길 자리도 12m 넘게)
    if (ROUND_B - T < 40) return;
    for (const b of bots) {
      if (b.found || b.moved || rng() > 0.004) continue;
      if (Math.hypot(b.spot.x - me.x, b.spot.z - me.z) < 12) continue;
      const free = R.spots.filter(s => !bots.some(q => q.spot === s) && Math.hypot(s.x - me.x, s.z - me.z) > 12);
      if (!free.length) continue;
      b.spot = free[Math.floor(rng() * free.length)]; b.moved = true; placeBot(b);
      if (now - moveToastT > 10) { moveToastT = now; map.hud.toast('🤖 어디선가 로봇이 몰래 자리를 옮겼어요!', 2.4); map.tone(660, 0, 0.08, 'triangle', 0.05); map.tone(880, 0.1, 0.08, 'triangle', 0.05); }
      return;
    }
  }
  async function endB(win) {
    st = 'end'; map.player.freeze(true); goal(null);
    const used = Math.round(ROUND_B - Math.max(0, T)), key = 'bestB.' + areaKey, prev = map.store.get(key, null);
    const rec = win && (prev == null || used < prev); if (rec) map.store.set(key, used);
    last = { mode: 'b', area: areaKey, win, found: foundN, time: used, best: rec ? used : prev, rec, round };
    map.sfx(win ? 'done' : 'buzz');
    for (const b of bots) if (!b.found) { b.show = true; b.s = b.s || 0.62; }   // 못 찾은 로봇은 끝에 보여 준다(미니맵 빨강)
    map.minimap.setMarks(bots.map(b => ({ x: b.spot.x, z: b.spot.z, color: b.found ? '#35c46a' : '#ff4d5e', shape: b.found ? 'star' : 'dot', label: b.found ? '' : b.spot.label })));
    const head = win ? '🎉 로봇 ' + N_BOTS + '개를 다 찾았어요! ' + fmt(used) : '⏰ 시간 끝! 찾은 로봇 ' + foundN + '/' + N_BOTS;
    const i = await map.hud.ask(head + '\n' + A.title + (rec ? '  🏆 새 기록!' : prev != null ? '\n가장 빨리 다 찾은 시간 ' + fmt(prev) : ''), ['다시 하기', '다른 구역·놀이', '그만하기']);
    if (dead || map.gone || i < 0) return;
    if (i === 0) begin(areaKey); else if (i === 1) menu(false); else map.quit();
  }

  let hideOffT = -1e9; map.on('hide', ev => { if (!ev.on) hideOffT = performance.now(); });
  // ---------- 입력: H = 힌트(B) ----------
  const onKD = e => { if (e.code === 'KeyH' && !e.repeat && !e.ctrlKey) hint(); };
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
      if (mode === 'b' && botMesh && bots.length) {   // 로봇 그리기(≤5 — 행렬만)
        for (const b of bots) if (b.anim > 0 && (b.anim -= dt) <= 0) { b.anim = 0; b.show = false; }
        drawBots(tt); }
      if (st === 'count') {
        cd -= dt; const n = Math.ceil(cd);
        if (n !== cdShown) { cdShown = n; if (n > 0) { map.hud.chip('time', (mode === 'a' ? '🙈 ' : '🤖 ') + n); map.sfx('tick'); } }
        if (cd <= 0) {
          st = 'play'; now = 0; secShown = -1;
          if (mode === 'a') { seeker.pause(false); map.hud.banner('찾는다!', 1.2); map.tone(660, 0, 0.12, 'square', 0.06); map.tone(990, 0.12, 0.2, 'square', 0.06);
            goal(coarse ? '🙈 ' + fmt(ROUND_A) + ' 버티기 · ⬇ 조용히 · ✋ 숨기' : '🙈 ' + fmt(ROUND_A) + ' 버티기 · C 웅크리면 조용 · E 숨기/나오기'); }
          else { map.player.freeze(false); map.hud.banner('찾아라!', 1.2); map.sfx('go');
            goal(coarse ? '🔍 로봇 5개 찾기 · 앞에서 ✋' : '🔍 숨은 로봇 5개 찾기 · 숨을 만한 곳 앞에서 E · H 힌트');
            map.hud.chip('hint', '💡 힌트' + (coarse ? '' : ' (H)'), { onClick: hint }); }
        }
        if (mode === 'a' && (t10 += dt) >= 0.1) { t10 = 0; const me = map.player.get(); fence(me); }
        return;
      }
      if (st !== 'play') return;
      T -= dt; now += dt;
      const sec = Math.ceil(T); if (sec !== secShown) { secShown = sec; map.hud.chip('time', '⏱ ' + fmt(T)); if (mode === 'a' && sec <= 5 && sec > 0) map.sfx('tick'); }
      if (T <= 0) { if (mode === 'a') endA(true); else endB(false); return; }
      if ((t10 += dt) < 0.1) return; t10 = 0;
      const me = map.player.get();
      fence(me);
      if (mode === 'a') {
        const c = seeker.raw;
        // 1초 넘게 보이면 '찾았다'(숨바꼭질 규칙) — 엔진 see(숨으면 안 보임 · 웅크려 가구 뒤면 가림)
        const seen = c.st !== 'giveup' && map.see({ x: c.x, y: c.y + 0.9, z: c.z, h: ((-c.yaw / R2D + 180) % 360 + 360) % 360 }, 'player', 100, A.range) && inArea(me.x, me.y, me.z);
        if (seen) seenT += 0.1; else seenT = Math.max(0, seenT - 0.05);
        if (seenT >= SEEN_FOUND) { found('seen'); return; }
        const w = seenT > 0.15; if (w !== warnOn) { warnOn = w; goal(w ? '👀 들킬 것 같아요! 숨어요!' : (coarse ? '🙈 버티기 · ⬇ 조용히 · ✋ 숨기' : '🙈 버티기 · C 웅크리면 조용 · E 숨기/나오기')); }
        if (c.st === 'suspicious' && !hotPos) hotPos = [me.x, me.z];
        brainA(now);
        map.minimap.setMarks([{ x: c.x, z: c.z, color: '#ff4d5e', shape: 'dot' }]);
      } else {
        if (hintCool > 0) hintCool -= 0.1; if (hintT > 0 && (hintT -= 0.1) <= 0) marksB();
        if ((beepT -= 0.1) <= 0) { beepT = 6 + rng() * 3; const un = bots.filter(b => !b.found); if (un.length) beepBot(un[Math.floor(rng() * un.length)], me, 0); }
        relocate(me, now);
      }
    },
    stop() {
      dead = true; removeEventListener('keydown', onKD);
      if (botGeo) botGeo.dispose(); if (botMat) botMat.dispose(); if (botMesh && botMesh.dispose) botMesh.dispose();   // 메시·경계 띠·술래·숨는 자리는 범위 파사드·엔진 reset이 뗀다
    },
    // 시험·교사 시연용(읽기 · 판 조작)
    get state() { return st; }, get mode() { return mode; }, get area() { return areaKey; }, get timeLeft() { return T; }, get last() { return last; }, get round() { return round; }, get seenT() { return seenT; },
    get seeker() { return seeker; }, get brain() { return sBrain; }, get bots() { return bots.map(b => ({ label: b.spot.label, kind: b.spot.kind, x: b.spot.x, z: b.spot.z, stand: b.spot.stand, found: b.found, moved: b.moved, show: b.show })); },
    get spots() { return R ? R.spots.map(s => ({ label: s.label, kind: s.kind, x: s.x, y: s.y, z: s.z, face: s.face, stand: s.stand, hs: s.hs })) : []; }, get edges() { return R ? R.edges.length : 0; }, get edgeList() { return R ? R.edges : []; },
    begin(k, m) { if (m) mode = m; begin(k); }, skipCount() { if (st === 'count') cd = 0.001; }, endNow() { if (st === 'play') T = 0.001; }, check: i => R && check(R.spots[i]), hint,
    inArea: (x, y, z) => inArea(x, y, z), found, reveal() { for (const b of bots) { b.show = true; b.s = b.s || 0.62; } },   // 시험: 로봇 5개를 다 보이게(예산 최악)
  };
}
