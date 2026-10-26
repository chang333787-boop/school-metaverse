// 👀 높은 곳 보기 + 숨은 작은 놀람 1차(SURP-1 · 설계 docs/systems/town_explore.md '30 높은 곳 보기 + 숨은 작은 놀람' · town_minis.md §5.1 틀 · 짓는 조각 차례 5)
//   높은 곳 보기: E도, 저절로 도는 카메라도 없음 — 높은 곳 끝(UMB.high가 켜지는 자리)에 2초 가만히 서면 나침반 띠가 저절로 켜짐
//     아이가 카메라를 돌려 본 쪽에 큰 덩어리(봉·골 물보라·섬·바다·비탈·산꼭대기·호수·학교)가 들어오면 방위만 한 줄(「남서쪽에 검은 봉우리」 · 이름·거리 X — 거리는 큰 지도 축척 막대로 아이가 잼)
//     4m 넘게 걸어가면 꺼짐(나침반 띠 설정을 켠 아이는 띠가 그대로)
//   놀람 = 한 줄 자료 SURP(자리 · 때 · 몸짓 · 효과 · 사실) · 아이 판에 그 자리가 있을 때만 켜짐(장소 이름 정규식 · 판 밖 탐험 땅 · 굴 — 없는 것을 지어내지 않음)
//     조건(시각·날씨·계절·물때·바람)이 맞을 때 이미 있는 몸짓(자전거 따르릉 R · 앉기 · 가만히 · 걷기 · 우산 활공 · 바라보기)에만 반응 · E 자리 X · 뽑기 X(달력·시계로 정해짐)
//     효과는 이미 있는 것만(map.tone 소리 · 무지개 · 새 떼 · 안개 · FEEL 알갱이 · 나침반 띠) · 그리기 +0 · 새 Light X
//   판정: 짓기 때 한 번 16m 칸 표(자리마다 반지름이 닿는 칸 모두에 넣음) · 1초 칸에서 내 둘레 3×3 칸만 봄 · 매 프레임 일 = 0.25초 방위 줄(보기 켠 동안만 · 큰 덩어리 여덟 안팎) · 새 객체 X
//   수첩 👀 놀람 = 찾은 날짜순 일지만(분모·%·빈칸 귀띔·숫자 X — 계절과 때 낱말로 적음) · 처음 하나는 아침 소식 이웃 소문 한 줄이 이끔(아무것도 못 찾은 동안만)
//   보상 = 솜씨만(rwCheck 꼬리표 'xp:surp' · 하루 한도는 문이 셈) · 처음 찾으면 +3 · 다른 날 다시 보면 +1(같은 놀람은 하루 한 번)
//   저장 GAME.S.xp.surp = { id: [날, 분, 계절, 날씨] }(처음 본 때) · surpD = { id: 마지막 본 날 } · 일이 생길 때만 GAME.mark
import { isLow } from './town_shore.js?v=5';
export const SURP_V = 1;
const T2 = (a, b) => [a, b];
const DIR8 = [['북', 'north'], ['북동', 'north-east'], ['동', 'east'], ['남동', 'south-east'], ['남', 'south'], ['남서', 'south-west'], ['서', 'west'], ['북서', 'north-west']];
const SEAW = { spring: T2('봄', 'Spring'), summer: T2('여름', 'Summer'), autumn: T2('가을', 'Autumn'), fall: T2('가을', 'Autumn'), winter: T2('겨울', 'Winter') };
const timeW = m => m < 360 ? T2('새벽', 'before dawn') : m < 540 ? T2('아침', 'morning') : m < 720 ? T2('오전', 'late morning') : m < 900 ? T2('한낮', 'midday') : m < 1020 ? T2('오후', 'afternoon') : m < 1170 ? T2('해 질 녘', 'sunset') : T2('밤', 'night');
const night = m => m < 360 || m >= 1140;

// 큰 덩어리(높은 곳 보기 방위 줄) — 자리는 짓기 때 아이 판·탐험 땅에서 찾음(없으면 안 넣음)
const MASS = [
  { k: 'crater', t: T2('검은 봉우리', 'a dark cone') }, { k: 'gorge', t: T2('골짜기 물보라', 'spray in a gorge') }, { k: 'isle', t: T2('작은 섬', 'a small island') },
  { k: 'sea', t: T2('넓은 바다', 'the open sea') }, { k: 'ski', t: T2('길게 깎인 비탈', 'a long cleared slope') }, { k: 'peak', t: T2('높은 산꼭대기', 'a high peak') },
  { k: 'lake', t: T2('넓은 호수', 'a wide lake') }, { k: 'school', t: T2('우리 학교', 'our school') }];

// 놀람 표(1차 13) — at: re = 장소 이름 · k = 엔진 자리(tun 굴 · crater · gorge 폭포 소 · ipool 섬 웅덩이) · r = 반지름 m
//   when: m = [분, 분] · wx = 'clear' | '!rain' · sea = [계절] · tide = 'low' · wind = 1(바람 센 날) · rainY = 1(어제 비) · night = 1
//   how: bell(따르릉) · sit(앉기 n초 · 앉을 자리가 없으면 still) · still(가만히 n초) · walk(걸어 지남) · umb(우산 활공이 바람 쪽으로 n m) · look(가만히 서서 덩어리 쪽 바라보기) · back(해를 등지고 자리 쪽 바라보기)
const SURP = [
  { id: 'echo', ic: '👂', land: '산', at: { k: 'tun' }, how: 'bell', fx: 'echo', sk: 'explore',
    t: T2('메아리', 'Echo'), fact: T2('소리는 벽에 부딪히면 되돌아와요. 굴 벽이 따르릉 소리를 되돌려 보냈어요', 'Sound bounces back when it hits a wall. The tunnel walls sent the bell back to you'),
    log: T2('굴 안에서 따르릉을 울리니 소리가 벽에 부딪혀 몇 번 되돌아왔어요', 'Rang the bell in the tunnel — the sound bounced off the walls and came back a few times'),
    rum: T2('{p} 안에서 자전거 벨을 울리면 소리가 되돌아온대', 'They say if you ring a bike bell inside the {p}, the sound comes back') },
  { id: 'sunset', ic: '🌇', land: '산', at: { re: /정상|전망대/, r: 22 }, when: { m: [1020, 1170], wx: '!rain' }, how: 'sit', n: 2, fx: 'west', sk: 'look',
    t: T2('해넘이', 'Sunset'), fact: T2('해는 동쪽에서 떠서 서쪽으로 져요. 나침반 띠에서 해가 진 쪽을 찾아봐요', 'The sun rises in the east and sets in the west. Find that side on the compass strip'),
    log: T2('높은 곳에 앉아 해가 서쪽 하늘로 지는 것을 봤어요', 'Sat up high and watched the sun go down in the west') },
  { id: 'sunrise', ic: '🌅', land: '산', at: { re: /정상|전망대/, r: 22 }, when: { m: [360, 450], wx: '!rain' }, how: 'still', n: 3, fx: 'east', sk: 'look',
    t: T2('해돋이', 'Sunrise'), fact: T2('아침 해는 동쪽 하늘에서 떠올라요. 나침반 띠에서 동쪽을 찾아봐요', 'The morning sun comes up in the east. Find east on the compass strip'),
    log: T2('이른 아침 높은 곳에서 해가 동쪽 하늘로 떠오르는 것을 봤어요', 'Early in the morning, up high, watched the sun rise in the east') },
  { id: 'pecker', ic: '🌳', land: '산', at: { re: /휴식년제|생태 통로/, r: 32 }, when: { m: [480, 1020], wx: '!rain' }, how: 'still', n: 5, fx: 'knock', sk: 'look',
    t: T2('똑똑똑 나무 소리', 'Knock knock in the trees'), fact: T2('딱따구리는 부리로 나무를 쪼아 속에 사는 벌레를 찾고 집 구멍도 파요', 'A woodpecker pecks wood to find insects inside and to dig a nest hole'),
    log: T2('숲에서 가만히 있으니 딱따구리가 나무를 쪼는 소리가 들렸어요', 'Stood still in the woods and heard a woodpecker pecking') },
  { id: 'isleview', ic: '🏝', land: '산', at: { re: /정상/, r: 26 }, when: { m: [420, 1080], wx: 'clear' }, how: 'look', mass: 'isle', n: 2, fx: 'view', sk: 'explore',
    t: T2('저 멀리 작은 섬', 'A small island far away'), fact: T2('높은 곳에 오르면 멀리까지 보여요. 바닷가 앞바다에 작은 섬이 있어요', 'From high up you can see far. There is a small island off the beach'),
    log: T2('산꼭대기에서 바라보니 바다 앞에 작은 섬이 보였어요', 'From the peak, spotted a small island out at sea') },
  { id: 'windglide', ic: '💨', land: '화산', at: [{ k: 'crater', r: 100 }, { re: /전망대|정상/, r: 60 }], when: { wind: 1 }, how: 'umb', n: 8, fx: 'none', sk: 'explore',
    t: T2('바람을 타고 멀리', 'Carried by the wind'), fact: T2('바람 센 날 펼친 우산은 바람 부는 쪽으로 밀려요. 놀이에서만! 진짜로 하면 다쳐요', 'On a windy day an open umbrella is pushed the way the wind blows. Only in the game! It is dangerous for real'),
    log: T2('바람 센 날 높은 곳에서 우산을 펴고 뛰니 바람 쪽으로 멀리 밀려갔어요', 'On a windy day, jumped with the umbrella and drifted far with the wind') },
  { id: 'mist', ic: '🌫', land: '들', at: { re: /^호수$|연못/, r: 48 }, when: { m: [360, 540], rainY: 1, wx: '!rain' }, how: 'walk', fx: 'mist', sk: 'look',
    t: T2('물안개', 'Morning mist'), fact: T2('비 온 다음 날 아침엔 밤새 식은 공기 위로 물이 김을 올려 안개가 껴요', 'The morning after rain, the water sends up vapour into the cool night air and mist forms'),
    log: T2('비 온 다음 날 아침 물가를 걷는데 물 위로 안개가 피어올랐어요', 'Walking by the water the morning after rain, mist rose off the water') },
  { id: 'frogs', ic: '🐸', land: '들', at: { re: /농수로|논/, r: 40 }, when: { night: 1, sea: ['spring', 'summer'] }, how: 'still', n: 4, fx: 'frogs', sk: 'look',
    t: T2('개구리 합창', 'Frog chorus'), fact: T2('밤에 우는 것은 수컷 개구리예요. 짝을 부르는 소리예요', 'The ones singing at night are male frogs, calling for a mate'),
    log: T2('밤에 물가에서 가만히 있으니 개구리들이 한꺼번에 울었어요', 'Stood still by the water at night and the frogs all started singing') },
  { id: 'birds', ic: '🐦', land: '강', at: { re: /생태 하천|갈대|^강$/, r: 45 }, when: { m: [420, 1020], wx: 'clear' }, how: 'walk', fx: 'birds', sk: 'look',
    t: T2('새 떼', 'A flock of birds'), fact: T2('물가 풀숲은 새들이 쉬고 먹이를 찾는 곳이에요', 'Grassy riverbanks are where birds rest and look for food'),
    log: T2('물가를 걷는데 새 떼가 하늘을 지나갔어요', 'Walking by the river, a flock of birds flew across the sky') },
  { id: 'fallbow', ic: '🌈', land: '골', at: { k: 'gorge', r: 34 }, when: { m: [450, 690], wx: 'clear' }, how: 'back', n: 3, fx: 'rainbow', sk: 'look',
    t: T2('물보라 무지개', 'Waterfall rainbow'), fact: T2('해를 등지고 물방울을 보면 햇빛이 물방울에서 꺾여 무지개가 보여요', 'With the sun behind you, sunlight bends in the water drops and you see a rainbow'),
    log: T2('오전에 해를 등지고 폭포를 보니 물보라에 무지개가 떴어요', 'In the morning, back to the sun, saw a rainbow in the waterfall spray') },
  { id: 'crab', ic: '🦀', land: '바다', at: { k: 'ipool', r: 7 }, when: { m: [360, 1140], tide: 'low' }, how: 'still', n: 3, fx: 'splash', sk: 'look',
    t: T2('웅덩이 속 작은 게', 'A little crab in the pool'), fact: T2('썰물 때 바위 틈에 남은 바닷물에서 게가 지내요. 보기만 하고 그대로 둬요', 'At low tide, crabs live in the seawater left between rocks. Just watch and leave them be'),
    log: T2('썰물 때 섬 웅덩이 곁에 가만히 있으니 작은 게가 집게발을 흔들었어요', 'At low tide, stood still by the island pool and a little crab waved its claws') },
  { id: 'salt', ic: '🧂', land: '바다', at: { re: /염전/, r: 36 }, when: { m: [660, 900], wx: 'clear', sea: ['spring', 'summer', 'autumn', 'fall'] }, how: 'still', n: 3, fx: 'sparkle', sk: 'look',
    t: T2('소금꽃', 'Salt flowers'), fact: T2('바닷물이 햇볕에 마르면 소금 알갱이가 꽃처럼 피어나요', 'When seawater dries in the sun, salt crystals bloom like flowers'),
    log: T2('맑은 한낮 염전에서 하얀 소금 알갱이가 반짝이는 것을 봤어요', 'On a clear midday at the salt pan, saw white salt crystals sparkle') },
  { id: 'owl', ic: '🦉', land: '관광', at: { re: /캠핑장/, r: 45 }, when: { night: 1, wx: '!rain' }, how: 'still', n: 4, fx: 'owl', sk: 'look',
    t: T2('밤의 부엉이', 'An owl at night'), fact: T2('부엉이는 밤에 먹이를 찾는 새예요. 소리만 듣고 그대로 둬요', 'Owls hunt at night. Just listen and leave them be'),
    log: T2('밤 캠핑장에서 가만히 있으니 숲에서 부엉 소리가 들렸어요', 'Stood still at the campsite at night and heard an owl hoot in the woods') }];
export const SURP_IDS = SURP.map(s => s.id);

export function createSurp(A) {
  const { map } = A, en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], esc = t => A.esc(t), tone = (...a) => { if (map.tone) map.tone(...a); };
  const CS = 16, CELLS = new Map(), ROWS = [], MS = [], FIRE = [];   /* CELLS = 칸 열쇠 → [자리] · ROWS = 켜진 놀람(자리 있는 것만) · MS = 큰 덩어리 · FIRE = 이번 초 후보(다시 씀) */
  const ME = { x: 0, z: 0, ok: false }, VP = { x: 0, z: 0 }, ST = { still: 0, sit: 0, walk: 0, gl: 0, gx: 0, gz: 0, gy: 0 }, VIEW = { on: false, x: 0, z: 0, m: -1, el: null, txt: '', since: 0 }, SEEN = { m: -1 };
  let dead = false, sq = 0, vq = 0, MIST = null, compT = 0;
  const key = (i, j) => (i + 4096) * 8192 + (j + 4096);
  const S = () => { const s = A.GAME.S; let x = s.xp; if (!x || typeof x !== 'object' || Array.isArray(x)) x = s.xp = {}; if (!x.surp || typeof x.surp !== 'object' || Array.isArray(x.surp)) x.surp = {}; if (!x.surpD || typeof x.surpD !== 'object') x.surpD = {}; return x; };
  const day = () => A.GAME.S.day | 0, min = () => A.GAME.S.min | 0, mark = () => A.GAME.mark();
  const stripNum = t => String(t || '').replace(/\s*[0-9]+\s*/g, ' ').replace(/\s+/g, ' ').trim();   /* 일지에 숫자 X(뒷산 1터널 → 뒷산 터널) */

  // ───────── 짓기 때 한 번: 자리 찾기 → 16m 칸 표 · 큰 덩어리 ─────────
  function anchorsOf(at) { const out = [], push = (x, z, r, nm, ext) => { if (!Number.isFinite(x) || !Number.isFinite(z)) return; if (out.some(q => Math.hypot(q.x - x, q.z - z) < 30)) return; out.push({ x, z, r, nm: stripNum(nm), ...(ext || {}) }); };
    for (const a of Array.isArray(at) ? at : [at]) {
      if (a.re) { for (const p of A.places() || []) if (p && p.name && a.re.test(p.name)) push(p.x, p.z, a.r || 20, en() && p.en ? p.en : p.name); }
      else if (a.k === 'tun') { for (const T of A.tunnels() || []) { const n = Math.max(1, Math.ceil(T.L / 24)); for (let k = 0; k <= n; k++) { const t = k / n; out.push({ x: T.A[0] + (T.B[0] - T.A[0]) * t, z: T.A[1] + (T.B[1] - T.A[1]) * t, r: 14, nm: stripNum(en() ? T.en || T.name : T.name), tun: 1 }); } } }
      else { const X = A.xp(), E = X ? X.api.edges() : []; const e = E.find(q => q.k === (a.k === 'ipool' ? 'isle' : a.k)); if (!e) continue;
        if (a.k === 'crater') push(e.cx, e.cz, a.r || e.R, en() ? 'Kkamang Cone' : '까망봉'); else if (a.k === 'gorge') push(e.pool[0], e.pool[1], a.r || 30, en() ? 'Layer Gorge' : '층층골', { pool: 1 }); else if (a.k === 'ipool' && e.pool) push(e.pool[0], e.pool[1], a.r || 7, en() ? 'Ebb-Tide Isle' : '썰물섬'); } }
    return out; }
  function build() { CELLS.clear(); ROWS.length = 0; MS.length = 0;
    const seats = A.sits() || [];
    for (const R of SURP) { const an = anchorsOf(R.at); if (!an.length) continue;   /* 아이 판에 그 자리가 없으면 그 놀람은 없음 */
      for (const q of an) { q.row = R; if (R.how === 'sit') q.seat = seats.some(s => s && s.stand && Math.hypot(s.stand[0] - q.x, s.stand[1] - q.z) < q.r);   /* 앉을 자리가 없는 곳 = 가만히 서기로 */
        const i0 = Math.floor((q.x - q.r) / CS), i1 = Math.floor((q.x + q.r) / CS), j0 = Math.floor((q.z - q.r) / CS), j1 = Math.floor((q.z + q.r) / CS);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = key(i, j); let c = CELLS.get(k); if (!c) CELLS.set(k, c = []); if (!c.includes(q)) c.push(q); } }
      ROWS.push({ R, an }); }
    const P = A.places() || [], X = A.xp(), E = X ? X.api.edges() : [], put = (k, x, z) => { if (Number.isFinite(x) && Number.isFinite(z)) MS.push({ k, x, z, t: MASS.find(m => m.k === k).t }); };
    { const e = E.find(q => q.k === 'crater'); if (e) put('crater', e.cx, e.cz); } { const e = E.find(q => q.k === 'gorge'); if (e) put('gorge', e.pool[0], e.pool[1]); } { const e = E.find(q => q.k === 'isle'); if (e && e.C) put('isle', e.C[0], e.C[1]); }
    { const p = P.find(q => q.kind === 'sea'); if (p) put('sea', p.x, p.z); } { const K = A.ski(); if (K && K.top && K.bot) put('ski', (K.top[0] + K.bot[0]) / 2, (K.top[1] + K.bot[1]) / 2); }
    { const p = P.find(q => /정상/.test(q.name || '')); if (p) put('peak', p.x, p.z); } { const p = P.find(q => q.name === '호수'); if (p) put('lake', p.x, p.z); } { const p = P.find(q => q.id === 'school'); if (p) put('school', p.x, p.z); } }

  // ───────── 조건 · 몸짓 ─────────
  function whenOk(w) { if (!w) return true; const m = min(), wx = A.wx(), sea = A.sea();
    if (w.m && !(m >= w.m[0] && m < w.m[1])) return false; if (w.night && !night(m)) return false;
    if (w.wx === 'clear' && wx !== 'clear') return false; if (w.wx === '!rain' && (wx === 'rain' || wx === 'snow')) return false;
    if (w.sea && !w.sea.includes(sea)) return false; if (w.tide === 'low' && !isLow(day(), m)) return false; if (w.wind && !A.windy()) return false; if (w.rainY && !A.rainY()) return false; return true; }
  const camH = () => { const e9 = map.camera.matrixWorld.elements, fx = -e9[8], fz = -e9[10]; if (fx * fx + fz * fz < 1e-6) return -1; return (Math.atan2(fx, -fz) * 57.29578 + 360) % 360; };
  const bear = (x, z, o) => (Math.atan2(x - (o || ME).x, -(z - (o || ME).z)) * 57.29578 + 360) % 360;
  const dAng = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  function howOk(q) { const R = q.row, n = R.n || 3;
    if (R.how === 'still') return ST.still >= n; if (R.how === 'sit') return q.seat ? ST.sit >= n : ST.still >= n + 1; if (R.how === 'walk') return ST.walk >= 2;
    if (R.how === 'look') { if (ST.still < n) return false; const M = MS.find(m => m.k === R.mass), h = camH(); return !!M && h >= 0 && dAng(h, bear(M.x, M.z)) < 18; }
    if (R.how === 'back') { if (ST.still < n) return false; const sw = A.sun(), h = camH(); if (!sw || !(sw.y > 0.03 && sw.y < 0.669) || h < 0) return false; const hl = Math.hypot(sw.x, sw.z) || 1, away = (Math.atan2(-sw.x / hl, sw.z / hl) * 57.29578 + 360) % 360;   /* 해 반대쪽(무지개가 서는 쪽 · town.js rainbow와 같은 셈) */
      return dAng(h, away) < 55 && dAng(h, bear(q.x, q.z)) < 60; }
    return false; }   /* bell = ev('bell') · umb = 활공이 끝날 때 */

  // ───────── 효과(이미 있는 것만) ─────────
  function fxRun(q) { const R = q.row, me = map.player.pos();
    if (R.fx === 'echo') { const sn = A.wx() === 'snow' ? 0.4 : 1; for (let k = 1; k <= 3; k++) { const v = 0.05 * sn / k;   /* 눈 오는 날 = 눈이 소리를 빨아들여 작게(REGEN-1) */ tone(2093, 0.32 * k, 0.12, 'sine', v); tone(2637, 0.32 * k + 0.05, 0.14, 'sine', v * 0.8); } }   /* 세 번 점점 작게 */
    else if (R.fx === 'west' || R.fx === 'east') { compT = 20; A.comp(true); tone(523, 0, 0.3, 'sine', 0.04); tone(659, 0.25, 0.4, 'sine', 0.035); }
    else if (R.fx === 'knock') { for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) tone(1150 - k * 20, r * 1.1 + k * 0.075, 0.03, 'square', 0.022); }
    else if (R.fx === 'view') { tone(784, 0, 0.12, 'triangle', 0.04); tone(1047, 0.12, 0.2, 'triangle', 0.035); }
    else if (R.fx === 'mist') mistOn();
    else if (R.fx === 'frogs') { for (let k = 0; k < 9; k++) { const f = 190 + (k % 3) * 35; tone(f, k * 0.28, 0.09, 'square', 0.018, f * 0.7); tone(f * 1.5, k * 0.28 + 0.1, 0.07, 'square', 0.012); } }
    else if (R.fx === 'birds') A.birds();
    else if (R.fx === 'rainbow') A.rainbow();
    else if (R.fx === 'splash') { A.puff(q.x, A.gy(q.x, q.z) + 0.1, q.z, [0x8fd8ff, 0xcfeeff, 0xd9603b], 0.7); tone(880, 0, 0.06, 'sine', 0.03); tone(1175, 0.12, 0.06, 'sine', 0.025); }
    else if (R.fx === 'sparkle') { for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, x = me.x + Math.sin(a) * 2.2, z = me.z + Math.cos(a) * 2.2; setTimeout(() => { if (!dead) A.puff(x, A.gy(x, z) + 0.05, z, [0xffffff, 0xf4f2ec, 0xdfe8ef], 0.9); }, k * 260); } tone(1568, 0, 0.08, 'sine', 0.025); tone(2093, 0.15, 0.1, 'sine', 0.02); }
    else if (R.fx === 'owl') { for (let r = 0; r < 2; r++) { tone(392, r * 1.4, 0.32, 'sine', 0.05, 330); tone(330, r * 1.4 + 0.45, 0.5, 'sine', 0.045, 294); } } }
  function mistOn() { const fg = A.fog(); if (!fg || MIST) return; MIST = { fg, n0: fg.near, f0: fg.far, t: 0, T: 42, n1: 4, f1: Math.min(fg.far, 85), nS: fg.near, fS: fg.far }; }
  function mistTick(dt) { const M = MIST, fg = M.fg; if (fg.near !== M.nS || fg.far !== M.fS) { MIST = null; return; }   /* 시간대·높은 곳이 안개를 다시 정했으면 그쪽을 따름(되돌리지 않음) */
    M.t += dt; const u = M.t < 5 ? M.t / 5 : M.t > M.T - 7 ? Math.max(0, (M.T - M.t) / 7) : 1, s = u * u * (3 - 2 * u); fg.near = M.n0 + (M.n1 - M.n0) * s; fg.far = M.f0 + (M.f1 - M.f0) * s; M.nS = fg.near; M.fS = fg.far;
    if (M.t >= M.T) { fg.near = M.n0; fg.far = M.f0; MIST = null; } }

  function fire(q) { const R = q.row, X = S(), d = day(); if (X.surpD[R.id] === d) return false; const first = !X.surp[R.id]; X.surpD[R.id] = d; if (first) X.surp[R.id] = [d, min(), A.sea(), A.wx(), q.nm]; mark(); fxRun(q);
    const V = !first && A.rg && A.rg() ? A.rg().surpAgain(R.id) : null;   /* REGEN-1 같은 곳 다른 때 = 변주 한 줄(하루 한 번 · town_regen.js SVAR) */
    map.hud.banner(R.ic + ' ' + (V ? V.ban : L(R.t)), 2.6); A.say(V ? V.fact : L(R.fact), 5); A.skUp(R.sk || 'look', first ? 3 : V ? 2 : 1, 'xp:surp'); FIRE.length = 0; return true; }

  // ───────── 높은 곳 보기 ─────────
  function lineEl() { if (VIEW.el) return VIEW.el; const el = document.createElement('div'); el.className = 'twn-view ttl-keep'; el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--compB, 84px) + 6px);z-index:21;pointer-events:none;background:#fff8ea;color:#2b2420;border:2px solid #2b2420;border-radius:10px;box-shadow:0 2px 0 rgba(0,0,0,.25);padding:3px 10px;font:800 13px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;white-space:nowrap;display:none'; document.body.appendChild(el); return (VIEW.el = el); }
  function viewOn(me) { VP.x = me.x; VP.z = me.z; VIEW.on = true; VIEW.x = me.x; VIEW.z = me.z; VIEW.m = -1; VIEW.txt = ''; VIEW.since = 0; A.comp(true); viewLine(); }
  function viewOff() { if (!VIEW.on) return; VIEW.on = false; VIEW.m = -1; VIEW.txt = ''; if (VIEW.el) VIEW.el.style.display = 'none'; if (compT <= 0) A.comp(false); }
  function viewLine() { const h = camH(); let best = -1, bd = 22; if (h >= 0) for (let i = 0; i < MS.length; i++) { const M = MS[i], d = Math.hypot(M.x - VP.x, M.z - VP.z); if (d < 60 || d > 3200) continue; const a = dAng(h, bear(M.x, M.z, VP)); if (a < bd) { bd = a; best = i; } }
    if (best === VIEW.m) return; VIEW.m = best; const el = lineEl(); if (best < 0) { el.style.display = 'none'; VIEW.txt = ''; return; } const M = MS[best], k = Math.round(bear(M.x, M.z, VP) / 45) % 8, ex = en();
    VIEW.txt = ex ? 'To the ' + DIR8[k][1] + ': ' + M.t[1] : DIR8[k][0] + '쪽에 ' + M.t[0]; el.textContent = VIEW.txt; el.style.display = ''; SEEN.m = best; }

  // ───────── 1초 칸 ─────────
  function sec() { if (!A.on() || window.__SURP_OFF) { viewOff(); return; }   /* 시험 손잡이: 보상 한도 시험(town_cap)이 E 자리를 되풀이하는 동안 하루 한 번 놀람이 섞여 '9번째 뒤로 또 생김'으로 잡히지 않게 */ const me = map.player.pos(), busy = A.busy(); const mv = ME.ok ? Math.hypot(me.x - ME.x, me.z - ME.z) : 0; ME.x = me.x; ME.z = me.z; ME.ok = true;
    const sat = !!A.sitting(); ST.sit = sat ? ST.sit + 1 : 0; ST.still = !busy && mv < 0.25 && !map.player.input ? ST.still + 1 : 0; ST.walk = !busy && mv > 0.8 && !sat ? ST.walk + 1 : 0;
    if (compT > 0 && (compT -= 1) <= 0 && !VIEW.on) A.comp(false);
    if (!VIEW.on && !busy && A.high() && ST.still >= 2) viewOn(me); else if (VIEW.on && (busy || Math.hypot(me.x - VIEW.x, me.z - VIEW.z) > 4)) viewOff();
    const U = A.umb(); if (U.gl && !ST.gl) { ST.gl = 1; ST.gx = me.x; ST.gz = me.z; ST.gy = me.y; } else if (!U.gl && ST.gl) { ST.gl = 0; glideEnd(me); }
    if (busy) return; const ci = Math.floor(me.x / CS), cj = Math.floor(me.z / CS); FIRE.length = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const c = CELLS.get(key(i, j)); if (!c) continue; for (const q of c) if (!FIRE.includes(q) && Math.hypot(q.x - me.x, q.z - me.z) < q.r) FIRE.push(q); }
    for (const q of FIRE) { const R = q.row; if (R.how === 'bell' || R.how === 'umb') continue; if (S().surpD[R.id] === day() || !whenOk(R.when) || !howOk(q)) continue; if (fire(q)) break; } }
  function glideEnd(me) { const W = A.wind(); if (!W) return; const along = (me.x - ST.gx) * W.x + (me.z - ST.gz) * W.z;
    for (const { R, an } of ROWS) { if (R.how !== 'umb' || S().surpD[R.id] === day() || !whenOk(R.when) || along < (R.n || 8)) continue; const q = an.find(a => Math.hypot(a.x - ST.gx, a.z - ST.gz) < a.r); if (q) { fire(q); return; } } }
  function ev(k) { if (dead || !A.on() || A.busy()) return; if (k !== 'bell') return; const me = map.player.pos();
    for (const { R, an } of ROWS) { if (R.how !== 'bell' || S().surpD[R.id] === day() || !whenOk(R.when)) continue; const q = an.find(a => Math.hypot(a.x - me.x, a.z - me.z) < a.r && (!a.tun || A.tunIn(me.x, me.z, me.y))); if (q) { setTimeout(() => { if (!dead) fire(q); }, 60); return; } } }

  // ───────── 수첩 👀 놀람(날짜순 일지) ─────────
  const has = () => Object.keys(S().surp).length > 0;
  function open() { const X = S(), ex = en(), L9 = Object.entries(X.surp).filter(([id]) => SURP.some(R => R.id === id)).sort((a, b) => (a[1][0] - b[1][0]) || (a[1][1] - b[1][1]));
    const rows = L9.map(([id, v]) => { const R = SURP.find(q => q.id === id), sw = SEAW[v[2]] || SEAW.summer, tw = timeW(v[1] | 0), wx9 = v[3] === 'rain' ? (ex ? ', rain' : ' · 비') : v[3] === 'snow' ? (ex ? ', snow' : ' · 눈') : '';
      return '<div class="st"><b class="n">' + R.ic + '</b><span><b>' + esc(ex ? sw[1] + ' ' + tw[1] + wx9 + (v[4] ? ', ' + stripNum(v[4]) : '') : sw[0] + ' ' + tw[0] + wx9 + (v[4] ? ' · ' + stripNum(v[4]) : '')) + '</b><br>' + esc(L(R.log)) + '</span></div>'; }).join('');
    const P = A.openP('<h3>👀 ' + (ex ? 'Wonder diary' : '놀람 일지') + '</h3><div class="sm">' + (ex ? 'Little things you happened to see around town, in the order you saw them.' : '마을에서 우연히 본 것을 본 차례대로 적었어요.') + '</div>' + (rows || '<div class="sm">' + (ex ? 'Nothing written yet.' : '아직 적은 것이 없어요.') + '</div>')
      + (A.rg && A.rg() && A.rg().surpRows().length ? '<div class="grp">' + (ex ? 'Seen again' : '다시 본 것') + '</div>' + A.rg().surpRows().map(([V9, v9]) => '<div class="st"><b class="n">🔁</b><span><b>' + esc(ex ? V9.n[1] + ', ' + v9.t[1] : V9.n[0] + ' · ' + v9.t[0]) + '</b><br>' + esc(L(v9.fact)) + '</span></div>').join('') : '')   /* REGEN-1 변주 */
      + '<div class="row"><button class="sub" data-a="x">' + (ex ? 'Close' : '닫기') + '</button></div>', false, 'surp');
    P.onclick = ev9 => { const b = ev9.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; return P; }

  // ───────── 아침 소식 소문(아무것도 못 찾은 동안만 · 처음 하나를 이끔) ─────────
  function rumor() { if (has()) return null; for (const { R, an } of ROWS) { if (!R.rum) continue; const q = an[(an.length / 2) | 0]; return { ko: R.rum[0].replace('{p}', q.nm || '터널'), en: R.rum[1].replace('{p}', q.nm || 'tunnel'), at: [+q.x.toFixed(1), +q.z.toFixed(1)] }; } return null; }

  function tick(dt) { if (dead) return; if (MIST) mistTick(dt); if (VIEW.on && (vq += dt) > 0.25) { vq = 0; const me = map.player.pos(); VP.x = me.x; VP.z = me.z; viewLine(); } if ((sq += dt) < 1) return; sq = 0; sec(); }
  function dispose() { dead = true; viewOff(); if (VIEW.el) { VIEW.el.remove(); VIEW.el = null; } if (MIST) { MIST.fg.near = MIST.n0; MIST.fg.far = MIST.f0; MIST = null; } A.comp(false); }
  const api = { rows: () => ROWS.map(({ R, an }) => ({ id: R.id, land: R.land, how: R.how, when: R.when ? JSON.parse(JSON.stringify(R.when)) : null, mass: R.mass || null, n: R.n || 0, an: an.map(q => ({ x: +q.x.toFixed(1), z: +q.z.toFixed(1), r: q.r, nm: q.nm, tun: !!q.tun, seat: q.seat == null ? null : !!q.seat })) })),
    all: () => SURP_IDS.slice(), cells: () => ({ n: CELLS.size, cs: CS }), mass: () => MS.map(m => ({ k: m.k, x: Math.round(m.x), z: Math.round(m.z) })), state: () => JSON.parse(JSON.stringify({ surp: S().surp, surpD: S().surpD })), st: () => ({ ...ST }),
    view: () => ({ on: VIEW.on, txt: VIEW.txt, m: VIEW.m >= 0 ? MS[VIEW.m].k : '' }), mist: () => (MIST ? { t: +MIST.t.toFixed(1), near: +MIST.fg.near.toFixed(1), far: +MIST.fg.far.toFixed(1) } : null), whenOk: id => { const R = SURP.find(q => q.id === id); return !!R && whenOk(R.when); },
    cond: () => ({ rainY: !!A.rainY(), windy: !!A.windy(), low: isLow(day(), min()), wx: A.wx(), sea: A.sea(), high: !!A.high(), wind: A.wind() }),
    rumor: () => rumor(), open: () => open(), reset: () => { const X = S(); X.surp = {}; X.surpD = {}; mark(); } };
  return { build, tick, ev, open, has, rumor, dispose, api, get viewOn() { return VIEW.on; } };
}
