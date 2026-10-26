// 🌙 밤에만 열리는 것 · 이른 아침(NIGHT-1 · 사용자 10-26 저녁 '밤에 하는 콘텐츠가 너무 없는 것 같아. 다 닫아서. 밤에만 열리는 거 뭐 없나. 그리고 시간에 따른 사람들의 행동 변화가 있으면 좋을 것 같아.')
//   이미 있던 밤 것(겹치지 않게): 산꼭대기 별자리 그림(GAME-8 · town_sky.js) · 여름밤 반딧불이 도장(GAME-18) · 칸 키트 밤 줄(나방·고양이·풀벌레 · town_cellkit.js) · 정자 모임(ROUTINE-2) · 마디탑 22시까지
//   새로 연 것(때 = NHRS · docs/systems/town_hours.md 표):
//     🏮 야시장(18:00~23:00 · 비·눈 = 쉼) — 노점 다섯 · 이웃 부탁 '제철 · 우리 마을에서 난 것' → 노점 판을 돌아보며 재료·온 곳·제철을 견주고 사서 건넴(본 노점만 고를 수 있음)
//     🦑 밤바다(19:30~) — 먼바다 오징어잡이 배 집어등(바람 센 날·비 = 안 나감) · 불빛 세기 일지(밤마다 기록) · 🎣 밤 낚시 자리 셋(오늘 켜진 등이 밤마다 다름 · 깊은 부두 끝/얕은 물가 · 미끼 셋)
//     🌌 별로 북쪽 찾기(맑은 밤 19:30~) — 하늘에 실제 자리대로 북두칠성·카시오페이아·북극성(계절·시각 따라 돎 · 북위 37.5°) · 시내 불빛 곁 = 흐린 별이 묻힘 · 북쪽을 보고 E → 그 북쪽으로 먼 곳 방위 맞히기
//     👮 밤 순찰(20:30~23:30 · 경찰서) — 순찰 길 세 곳(꺼진 가로등 번호 · 길 잃은 어린이 · 점자블록 위 자전거 · 두고 간 가방 중 셋 · 밤마다 다름) → 순찰 일지 · 다음 날 아침 고친 소식
//     🏪 늦게 일하는 곳 — 24시 편의점 간판·점원 · 병원 응급실 간판·구급대원 · 경찰서 불빛·경찰관(밤에도 켜짐 · 다른 곳은 닫음)
//     🔔 이른 아침 수산물 시장 경매(06:00~08:30 · 게임 하루가 6시에 시작해서 '새벽' 대신 첫 두 시간 반) — 손가락 값(수지)을 읽고 낙찰 → 모자 색으로 갈 가게 → 그 가게 문 앞에 '오늘 아침 경매' 판이 그날 남음
//     🍞 빵집 이른 아침(06:00~07:00) — 굽는 불빛·제빵사(7시에 문 엶)
//   사람(②): 야시장·강변 쪽으로 모이는 길 사람(LIFE eveHubs) · 시간마다 거리 사람 수(LIFE pvF · 비 오는 밤 = 텅) · 일꾼 저녁 갈래는 town_routine.js ROUTINE-3
//   지킴: 판타지·귀신·무서움 X · 실명 X(이름 없는 역할) · 사실만(제철·온 곳·집어등·북극성·점자블록·유실물) · 셈 문제 X(손가락 세기·견주기만) · 막대·꾹 X · 알림 say(t, s, 1) · 홍보판(SM_PROMO) X
//   렉: 새 Light X(불빛 = MeshBasic · 합친 부품 buildParts) · 매 프레임 일 0(1초 칸 sec · 별 = 셰이더가 카메라를 따라감) · 무리마다 그리기 2~3(보일 때만)
export const NIGHT_V = 1;
const T2 = (ko, en) => [ko, en];
export const NHRS = { mkt: [1080, 1380], sea: [1170, 1440], fish: [1140, 1440], star: [1170, 1440], patrol: [1230, 1410], late: [1110, 1440], auction: [360, 510], bake: [360, 420] };
const hm = m => String(((m / 60) | 0) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };
const SEAN = { spring: T2('봄', 'spring'), summer: T2('여름', 'summer'), autumn: T2('가을', 'autumn'), winter: T2('겨울', 'winter') };

// ───────── 🏮 야시장 먹거리(사실만 · 제철 = 우리나라에서 많이 나는 때 · 온 곳 = 재료가 온 곳) ─────────
export const ORIGIN = {
  farm: { t: T2('우리 마을 밭', 'our town’s fields'), d: T2('걸어갈 만큼 가까워요', 'close enough to walk'), near: true },
  sea: { t: T2('우리 마을 바다', 'our town’s sea'), d: T2('부두에서 바로 왔어요', 'straight from our pier'), near: true },
  port: { t: T2('다른 도시 어묵 공장', 'a fish-cake factory in another city'), d: T2('트럭으로 몇 시간', 'a few hours by truck'), near: false },
  south: { t: T2('남쪽 큰 섬', 'a big island in the south'), d: T2('배와 트럭으로 하루', 'a day by ship and truck'), near: false },
  abroad: { t: T2('먼 나라', 'a faraway country'), d: T2('배로 여러 날', 'many days by ship'), near: false },
  wheat: { t: T2('먼 나라 밀밭', 'wheat fields far away'), d: T2('배로 여러 날', 'many days by ship'), near: false, why: T2('우리나라에서 쓰는 밀가루는 대부분 다른 나라에서 들여온 밀로 만들어요.', 'Most flour used in Korea is made from imported wheat.') }
};
export const FOODS = {
  corn: { e: '🌽♨', nm: T2('구운 옥수수', 'Roasted corn'), p: 1200, what: T2('옥수수', 'corn'), from: 'farm', sea: ['summer'], when: T2('여름(7~8월)', 'summer (Jul–Aug)') },
  potato: { e: '🥔♨', nm: T2('감자구이', 'Roasted potato'), p: 1000, what: T2('감자', 'potatoes'), from: 'farm', sea: ['summer'], when: T2('초여름(6~7월)', 'early summer (Jun–Jul)') },
  sweet: { e: '🍠♨', nm: T2('군고구마', 'Roasted sweet potato'), p: 1200, what: T2('고구마', 'sweet potatoes'), from: 'farm', sea: ['autumn'], when: T2('가을(9~10월)', 'autumn (Sep–Oct)') },
  berry: { e: '🍓', nm: T2('딸기 꼬치', 'Strawberry skewer'), p: 1500, what: T2('딸기', 'strawberries'), from: 'farm', sea: ['winter', 'spring'], when: T2('겨울~봄(비닐하우스)', 'winter to spring (greenhouse)') },
  mugwort: { e: '🍡', nm: T2('쑥떡', 'Mugwort rice cake'), p: 1200, what: T2('쑥', 'mugwort'), from: 'farm', sea: ['spring'], when: T2('봄(3~4월)', 'spring (Mar–Apr)') },
  squid: { e: '🦑♨', nm: T2('오징어구이', 'Grilled squid'), p: 2000, what: T2('오징어', 'squid'), from: 'sea', sea: ['summer', 'autumn'], when: T2('여름~가을', 'summer to autumn') },
  shad: { e: '🐟♨', nm: T2('전어구이', 'Grilled gizzard shad'), p: 2000, what: T2('전어', 'gizzard shad'), from: 'sea', sea: ['autumn'], when: T2('가을(9~10월)', 'autumn (Sep–Oct)') },
  fishcake: { e: '🍢', nm: T2('어묵 꼬치', 'Fish-cake skewer'), p: 1000, what: T2('생선살', 'fish paste'), from: 'port', sea: [], when: T2('철 없이 늘 만들어요', 'made all year') },
  banana: { e: '🍌', nm: T2('바나나', 'Banana'), p: 1000, what: T2('바나나', 'bananas'), from: 'abroad', sea: [], when: T2('우리나라에서는 거의 나지 않아요', 'hardly grown in Korea') },
  toast: { e: '🍞♨', nm: T2('토스트', 'Toast'), p: 1500, what: T2('밀가루', 'flour'), from: 'wheat', sea: [], when: T2('철 없이 늘 만들어요', 'made all year') },
  tang: { e: '🍊', nm: T2('귤', 'Tangerine'), p: 1000, what: T2('귤', 'tangerines'), from: 'south', sea: ['winter'], when: T2('겨울(11~2월)', 'winter (Nov–Feb)') }
};
const REQ = {
  season: { t: T2('지금이 제철인 먹거리를 하나 사다 줄래요? 제철 것이 제일 맛있대요.', 'Could you buy me something that is in season now? In-season food tastes best.'), ok: (f, s) => f.sea.includes(s) },
  local: { t: T2('우리 마을에서 난 재료로 만든 걸 먹고 싶어요. 하나 골라 줄래요?', 'I’d like something made from food grown or caught in our town. Could you pick one?'), ok: f => ORIGIN[f.from].near },
  both: { t: T2('우리 마을에서 났고, 지금 제철인 걸로 하나 부탁해요.', 'Please get me something from our town that is also in season now.'), ok: (f, s) => ORIGIN[f.from].near && f.sea.includes(s) }
};
const TENTC = [0xe0702a, 0x2f6fd0, 0xd8443a, 0x3c9a5a, 0xe8b42a, 0x8a5bd1];

// ───────── 🌌 별(적경 시 · 적위 ° · 크기) — 실제 자리 ─────────
const STAR = [
  ['polaris', 2.53, 89.26, 2.4, T2('북극성', 'the North Star')],
  ['dubhe', 11.06, 61.75, 2.4, T2('두베(국자 끝 별)', 'Dubhe (a pointer star)')], ['merak', 11.03, 56.38, 2.1, T2('메라크(국자 끝 별)', 'Merak (a pointer star)')], ['phecda', 11.9, 53.69, 2, T2('북두칠성 국자 별', 'a Big Dipper star')], ['megrez', 12.26, 57.03, 1.7, T2('북두칠성 국자 별', 'a Big Dipper star')],
  ['alioth', 12.9, 55.96, 2.3, T2('북두칠성 손잡이 별', 'a Big Dipper handle star')], ['mizar', 13.4, 54.93, 2.1, T2('북두칠성 손잡이 별', 'a Big Dipper handle star')], ['alkaid', 13.79, 49.31, 2.2, T2('북두칠성 손잡이 끝 별', 'the end of the Big Dipper handle')],
  ['caph', 0.15, 59.15, 2.1, T2('카시오페이아(W) 별', 'a Cassiopeia (W) star')], ['schedar', 0.68, 56.54, 2.2, T2('카시오페이아(W) 별', 'a Cassiopeia (W) star')], ['gcas', 0.95, 60.72, 2.2, T2('카시오페이아(W) 가운데 별', 'the middle of Cassiopeia (W)')], ['ruchbah', 1.43, 60.24, 2, T2('카시오페이아(W) 별', 'a Cassiopeia (W) star')], ['segin', 1.91, 63.67, 1.8, T2('카시오페이아(W) 별', 'a Cassiopeia (W) star')]
];
const LAT = 37.5 * Math.PI / 180, SEADOY = { spring: 105, summer: 196, autumn: 288, winter: 15 };
/* 그 때 그 별의 방향(동·위·북) — 북위 37.5° · 경도 127° · 한국 시각 */
export function starDir(ra, dec, doy, hour) { const lst = ((6.697 + 0.0657098 * doy + 1.00274 * (hour - 9) + 8.467) % 24 + 24) % 24, H = (lst - ra) * 15 * Math.PI / 180, d = dec * Math.PI / 180;
  const sa = Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(H), alt = Math.asin(Math.max(-1, Math.min(1, sa))), ca = Math.cos(alt) || 1e-6;
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(d) - sa * Math.sin(LAT)) / (ca * Math.cos(LAT))))); if (Math.sin(H) > 0) az = 2 * Math.PI - az;
  return { e: ca * Math.sin(az), u: sa, n: ca * Math.cos(az), alt: alt * 180 / Math.PI, az: az * 180 / Math.PI }; }
const DIR8 = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];
const d8i = (dx, dz) => Math.round(((Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360) / 45) % 8;

// ───────── 🎣 밤 낚시 · 🔔 경매(사실만) ─────────
const NFISH = { spring: T2('볼락', 'rockfish'), summer: T2('전갱이', 'horse mackerel'), autumn: T2('전갱이', 'horse mackerel'), winter: T2('볼락', 'rockfish') };
const AUCF = { spring: [T2('도다리', 'flounder'), T2('주꾸미', 'webfoot octopus'), T2('고등어', 'mackerel')], summer: [T2('오징어', 'squid'), T2('갈치', 'hairtail'), T2('전갱이', 'horse mackerel')], autumn: [T2('전어', 'gizzard shad'), T2('고등어', 'mackerel'), T2('갈치', 'hairtail')], winter: [T2('대구', 'cod'), T2('방어', 'yellowtail'), T2('굴', 'oysters')] };
const CAPC = [['#d8443a', 0xd8443a, T2('빨간 모자', 'red cap')], ['#2f6fd0', 0x2f6fd0, T2('파란 모자', 'blue cap')], ['#3c9a5a', 0x3c9a5a, T2('초록 모자', 'green cap')]];
const KIDC = [['#e0453a', 0xe0453a, T2('빨간색', 'red')], ['#2f6fd0', 0x2f6fd0, T2('파란색', 'blue')], ['#f2c230', 0xf2c230, T2('노란색', 'yellow')], ['#3cc76a', 0x3cc76a, T2('초록색', 'green')]];
const SCENES = ['lamp', 'kid', 'bike', 'bag'];

const CSS = `.twn-p .ng-card{background:#fffdf2;border:2px solid #c9b27a;border-radius:12px;padding:8px 12px;margin:6px 0;font-size:15px;line-height:1.5}
.twn-p .ng-card b{font-size:16px}.twn-p .ng-ch{display:grid;gap:8px;margin:8px 0}.twn-p .ng-ch button{min-height:48px;font-size:15px;text-align:left;line-height:1.35}
.twn-p .ng-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.twn-p .ng-row button{min-height:52px;font-size:16px}
.twn-p .ng-cmp{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,52px);gap:6px;justify-content:center;margin:8px 0}.twn-p .ng-cmp button{min-height:52px;padding:0;font-size:15px;font-weight:800}
.twn-p .ng-log{font-size:14px;line-height:1.5;opacity:.9}.twn-p .ng-m{color:#a3412a;font-weight:800;min-height:20px;margin:4px 0}
.twn-p .ng-bid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0}.twn-p .ng-bid button{min-height:120px;padding:6px 4px;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:4px}
.twn-p .ng-bid svg{width:64px;height:64px}.twn-p .ng-cap{display:inline-block;width:14px;height:14px;border-radius:7px;border:2px solid #2b2420;vertical-align:-2px;margin-right:4px}
.twn-p .ng-wait{font-size:40px;text-align:center;margin:8px 0;transition:transform .25s}.ng-aim{position:fixed;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;z-index:30;pointer-events:none;border:2px solid rgba(255,250,220,.8);border-radius:50%}
.ng-aim::before,.ng-aim::after{content:'';position:absolute;background:rgba(255,250,220,.85)}.ng-aim::before{left:15px;top:-9px;width:2px;height:50px}.ng-aim::after{top:15px;left:-9px;height:2px;width:50px}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · id · lang() · esc · on() · root() · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s, lv) · banner(t, s) · sfx(k) · bubble(o, t)
//   busy() · away() · night() NIGHT9 · wx() · season() · windy() · min() · places() · cell(x, z) · free(x, z) · okSpot(x, z) · gy(x, z) · ty(x, z) · onRoad(x, z, r) · seaSd(x, z) · inSchool(x, z)
//   route(a, b) · guide(to, info) · guideOff() · buildParts(fn) · bagAdd(e, n, src) · take(e) · pay(v) · money() · skUp(k, n, src) · rec(k, o) · tev(ev) · stamp(e) · fishers() [[x, z]] · tower() 마디탑 자리 | null
//   life() 길 사람(LIFE · pvF(f) · eveHubs(L)) | null · school() [x, z]
export function createNight(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.night; if (!s || typeof s !== 'object' || s.v !== NIGHT_V) s = g.night = { v: NIGHT_V, said: 0, said6: 0, mk: { n: 0, lv: 0 }, boats: [], fish: { n: 0 }, star: { n: 0 }, pat: { n: 0, fixed: [] }, auc: { n: 0 } }; for (const k of ['mk', 'fish', 'star', 'pat', 'auc']) if (!s[k] || typeof s[k] !== 'object') s[k] = { n: 0 }; if (!Array.isArray(s.boats)) s.boats = []; if (!Array.isArray(s.pat.fixed)) s.pat.fixed = []; return s; };
  const mark = () => A.GAME.mark(), day = () => A.GAME.S.day | 0, min = () => (A.GAME.S.min | 0) % 1440, sea = () => (SEAN[A.season()] ? A.season() : 'summer');
  const say = (t, s) => A.say(t, s || 4, 1), sayNow = (t, s) => A.say(t, s || 4), sfx = k => { if (A.sfx) A.sfx(k); }, me = () => map.player.pos();
  const open = (k, m = min()) => m >= NHRS[k][0] && m < NHRS[k][1], wet = () => { const w = A.wx(); return w === 'rain' || w === 'snow'; };
  const rng = seed => { let a = (seed * 2654435761 + 12345) >>> 0; return () => (a = (a * 1103515245 + 12345) >>> 0) / 4294967296; }, hs = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const shuf = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const V1 = new T3.Vector3();   /* 스크래치(매 프레임 새 객체 X) */
  let PH = [], MC = [], dead = false, acc = 0, R9 = null, SITE = null, G = {}, H = [], css = null, DBG = [], pv9 = -9, hub9 = '', vis9 = '', star = null, aim = null, pat = null, fishP = null, mkt = null, auc = null, msBuild = 0;
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  if (!document.getElementById('ng-css')) { css = document.createElement('style'); css.id = 'ng-css'; css.textContent = CSS; document.head.appendChild(css); }
  const gy = (x, z) => A.gy(x, z), dist = (x, z) => { const m = me(); return Math.hypot(x - m.x, z - m.z); };

  // ───────── 몸(이름 없는 역할 · 합친 부품에 같이 넣음 · 앞 = +z를 ry만큼 돌림) ─────────
  //   o = { s 크기 · sh 윗옷 · pa 바지 · sk 살색 · hr 머리 · cap 모자 · ap 앞치마 · vest 조끼 · pose 'stand'|'wave'|'up'|'arms'|'sit' }
  function fig(put, x, y, z, ry, o) { const s = o.s || 1, c = Math.cos(ry), n = Math.sin(ry), sk = o.sk || 0xf2c9a0, hr = o.hr || 0x3a2a1e, sh = o.sh || 0x7fb8d0, pa = o.pa || 0x3b4a5c;
    const P = (k, lx, ly, lz, sx, sy, sz, hex, rx) => put(k, x + (lx * c + lz * n) * s, y + ly * s, z + (-lx * n + lz * c) * s, sx * s, k === 's' ? sy : sy * s, sz * s, hex, 0, ry, rx || 0);   /* 공(s)의 sy = 세로 배율(크기 X) */
    if (o.pose === 'sit') { for (const g of [-1, 1]) { P('b', g * 0.1, 0.42, 0.18, 0.13, 0.13, 0.5, pa); P('b', g * 0.1, 0, 0.42, 0.12, 0.44, 0.12, pa); } P('c', 0, 0.5, -0.04, 0.18, 0.55, 0, sh); P('s', 0, 1.2, -0.02, 0.16, 1, 0, sk); P('s', 0, 1.28, -0.07, 0.165, 0.72, 0, hr); for (const g of [-1, 1]) P('b', g * 0.23, 0.58, 0.04, 0.08, 0.44, 0.08, sh); return; }
    for (const g of [-1, 1]) P('b', g * 0.09, 0, 0, 0.12, 0.8, 0.12, pa); P('c', 0, 0.8, 0, 0.18, 0.55, 0, sh);
    const up = o.pose === 'up' || o.pose === 'wave'; P('b', -0.23, 0.86, 0.02, 0.08, 0.46, 0.08, sh); if (up) P('b', 0.23, 1.3, 0.02, 0.08, 0.46, 0.08, sh); else if (o.pose === 'arms') P('b', 0.23, 1.0, 0.18, 0.08, 0.08, 0.4, sh); else P('b', 0.23, 0.86, 0.02, 0.08, 0.46, 0.08, sh);
    if (o.pose === 'arms') P('b', -0.23, 1.0, 0.18, 0.08, 0.08, 0.4, sh);
    P('s', 0, 1.5, 0, 0.16, 1, 0, sk); P('s', 0, 1.58, -0.05, 0.165, 0.72, 0, hr);   /* 머리카락 = 뒤로 물려 얼굴이 보이게 */ if (o.cap != null) { P('c', 0, 1.6, 0, 0.18, 0.09, 0, o.cap); P('b', 0, 1.6, 0.13, 0.24, 0.03, 0.14, o.cap); }
    if (o.ap != null) P('b', 0, 0.72, 0.185, 0.3, 0.6, 0.03, o.ap); if (o.vest != null) { P('b', 0, 0.98, 0.185, 0.26, 0.26, 0.03, o.vest); P('b', 0, 0.98, -0.185, 0.26, 0.26, 0.03, o.vest); } }
  const BODY = { seller: { sh: 0xf6f4ee, pa: 0x3b4a5c, ap: 0xd8443a, hr: 0x2b1d14 }, seller2: { sh: 0x5a6a7a, pa: 0x2e2e33, ap: 0x2f6fd0, cap: 0xf6f4ee }, nb: { sh: 0xe0b070, pa: 0x33456b, hr: 0x5b3f2e }, officer: { sh: 0x2f4a8a, pa: 0x24324a, cap: 0x1f2f55, vest: 0xd9f25a },
    medic: { sh: 0xf2f2ee, pa: 0x2f6fd0, vest: 0xe0453a }, clerk: { sh: 0x3c9a5a, pa: 0x2e2e33, ap: 0x3c9a5a, hr: 0x1c1c1e }, baker: { sh: 0xf6f4ee, pa: 0x8a8a8a, cap: 0xf6f4ee, ap: 0xf6f4ee }, auct: { sh: 0x24345a, pa: 0x1c2638, cap: 0xf6f4ee, vest: 0xf28a2a }, fisher: { sh: 0x6b7a8a, pa: 0x2e2e33, cap: 0x2b313a } };

  // ───────── 글씨 판(한 장 그림에 모아 · 판 무리마다 그리기 1) ─────────
  function signs(list) { if (!list.length) return null; const W = 1024, rows = []; let x = 0, y = 0, rh = 0; const cv = document.createElement('canvas'); cv.width = W; cv.height = 512; const g = cv.getContext('2d'), F = 'system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    for (const s of list) { const pw = Math.min(W, Math.round(s.w * 96)), ph = Math.round(s.h * 96); if (x + pw > W) { x = 0; y += rh + 4; rh = 0; } if (y + ph > 512) break; rows.push({ s, u0: x / W, v0: 1 - (y + ph) / 512, u1: (x + pw) / W, v1: 1 - y / 512 });
      g.fillStyle = s.bg || '#2b2420'; g.fillRect(x, y, pw, ph); g.strokeStyle = s.fr || 'rgba(255,255,255,.55)'; g.lineWidth = 6; g.strokeRect(x + 5, y + 5, pw - 10, ph - 10); g.fillStyle = s.fg || '#fff8e6'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lines = String(s.t).split('\n'), fs = Math.min(ph * 0.62 / lines.length, pw * 1.6 / Math.max(...lines.map(l => l.length))); g.font = '800 ' + Math.round(fs) + 'px ' + F; lines.forEach((l, i) => g.fillText(l, x + pw / 2, y + ph / 2 + (i - (lines.length - 1) / 2) * fs * 1.12));
      x += pw + 4; rh = Math.max(rh, ph); }
    const P = [], U = []; for (const r of rows) { const s = r.s, c = Math.cos(s.ry || 0), n = Math.sin(s.ry || 0), hw = s.w / 2, q = (lx, ly) => [s.x + lx * c, s.y + ly, s.z - lx * n];
      const a = q(-hw, 0), b = q(hw, 0), d = q(hw, s.h), e = q(-hw, s.h); P.push(...a, ...b, ...d, ...a, ...d, ...e); U.push(r.u0, r.v0, r.u1, r.v0, r.u1, r.v1, r.u0, r.v0, r.u1, r.v1, r.u0, r.v1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); const tex = new T3.CanvasTexture(cv); tex.colorSpace = T3.SRGBColorSpace || tex.colorSpace;
    const m = new T3.Mesh(geo, new T3.MeshBasicMaterial({ map: tex, side: T3.DoubleSide })); m.userData.fx = 1; m.userData.own = [geo, m.material, tex]; return m; }
  function group(k, fn, sg) { drop(k); const grp = A.buildParts(fn); if (sg && sg.length) { const m = signs(sg); if (m) grp.add(m); } grp.userData.fx = 1; grp.visible = false; G[k] = grp; const R = A.root(); if (R) R.add(grp); return grp; }
  function drop(k) { const g = G[k]; if (!g) return; if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.isMesh) { if (o.userData.own) for (const q of o.userData.own) q.dispose(); else o.geometry.dispose(); } }); delete G[k]; }

  // ───────── 자리 고르기(처음 한 번 · 마을 자료에 있는 곳만) ─────────
  const PL = () => A.places() || [], placeBy = re => PL().find(p => re.test(p.name || '') && p.door && !A.inSchool(p.x, p.z));
  const flatOk = (pts) => { let lo = 1e9, hi = -1e9; for (const [x, z] of pts) { if (!A.free(x, z)) return false; const y = A.ty(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); } return hi - lo < 0.7; };
  function roadDir(x, z) { for (const r of [3, 5, 8, 12, 16]) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, ux = Math.sin(a), uz = Math.cos(a); if (A.onRoad(x + ux * r, z + uz * r, 0.3)) return { ux, uz, r }; } return null; }
  function siteMkt() { const T = A.tower(), C = T ? [T.x, T.z] : (() => { const p = placeBy(/시장|상가|마트/); return p ? [p.x, p.z] : null; })(); if (!C) return null;
    for (let r = 34; r <= 190; r += 6) { const n = Math.max(12, Math.round(r / 6)); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, cx = C[0] + Math.cos(a) * r, cz = C[1] + Math.sin(a) * r, rd = roadDir(cx, cz); if (!rd || rd.r > 16) continue;
      const ux = -rd.uz, uz = rd.ux, fx = rd.ux, fz = rd.uz, pts = []; for (let k = -2; k <= 2; k++) { const sx = cx + ux * k * 3.6, sz = cz + uz * k * 3.6; pts.push([sx, sz], [sx - ux * 1.3, sz - uz * 1.3], [sx + ux * 1.3, sz + uz * 1.3], [sx - fx * 1.1, sz - fz * 1.1], [sx + fx * 2.4, sz + fz * 2.4]); }
      pts.push([cx + ux * 10.5, cz + uz * 10.5], [cx + ux * 10.5 + fx * 2, cz + uz * 10.5 + fz * 2]); if (flatOk(pts)) return { x: cx, z: cz, ux, uz, fx, fz, y: A.ty(cx, cz) }; } } return null; }
  function siteFish() { const F = (A.fishers() || []).slice(); if (!F.length) return null; const a0 = F.reduce((s, q) => [s[0] + q[0] / F.length, s[1] + q[1] / F.length], [0, 0]), out = [{ x: a0[0], z: a0[1], deep: true, k: 'pier' }];
    const C = []; for (let r = 10; r <= 40; r += 2) for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832, x = a0[0] + Math.cos(a) * r, z = a0[1] + Math.sin(a) * r, sd = A.seaSd(x, z); if (sd > 0.6 && sd < 2.4 && A.okSpot(x, z)) C.push([x, z]); }
    for (const q of C) { if (out.length >= 3) break; if (out.every(o => Math.hypot(o.x - q[0], o.z - q[1]) > 14)) out.push({ x: q[0], z: q[1], deep: false, k: 'shore' }); } if (out.length < 3) return null;
    for (const o of out) { let b = null, bd = 9; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, x = o.x + Math.cos(a) * 3, z = o.z + Math.sin(a) * 3, sd = A.seaSd(x, z); if (sd < bd) { bd = sd; b = a; } } o.sa = b ?? 0; o.y = gy(o.x, o.z); } return out; }
  function siteAuc() { const p = placeBy(/수산물 시장|수산시장|위판장|어시장|수산물 직판장/); if (!p) return null; const ux = p.door[0] - p.x, uz = p.door[1] - p.z, l = Math.hypot(ux, uz) || 1, fx = ux / l, fz = uz / l;
    for (const d of [5, 7, 9, 12]) for (const s of [0, 4, -4, 8, -8]) { const cx = p.door[0] + fx * d - fz * s, cz = p.door[1] + fz * d + fx * s, px = -fz, pz = fx, pts = [[cx, cz]]; for (const [a, b] of [[-3, 0], [3, 0], [0, 2], [-3, 2], [3, 2], [0, -1.5]]) pts.push([cx + px * a + fx * b, cz + pz * a + fz * b]); if (pts.every(q => A.okSpot(q[0], q[1]))) return { p, x: cx, z: cz, fx, fz, px, pz, y: A.ty(cx, cz) }; } return null; }
  function doorOut(p, d) { const ux = p.door[0] - p.x, uz = p.door[1] - p.z, l = Math.hypot(ux, uz) || 1; for (const dd of [d, d + 1, d + 2, d + 3]) for (const s of [0, 1.5, -1.5, 3, -3]) { const x = p.door[0] + ux / l * dd - uz / l * s, z = p.door[1] + uz / l * dd + ux / l * s; if (A.okSpot(x, z)) return { x, z, fx: ux / l, fz: uz / l, ry: Math.atan2(ux / l, uz / l) }; } return null; }
  function siteStars() { const out = [], add = (x, z, nm, y) => { if (x == null || out.some(o => Math.hypot(o.x - x, o.z - z) < 60)) return; out.push({ x, z, nm, y: y ?? gy(x, z) }); };
    for (const p of PL()) { if (/^전망대$|해수욕장|갯벌 쉼터|정자나무 쉼터/.test(p.name || '') && !A.inSchool(p.x, p.z)) { const q = p.door || [p.x, p.z]; if (A.okSpot(q[0], q[1]) || /전망대/.test(p.name)) add(q[0], q[1], T2(p.name, p.en || p.name)); else { const o = doorOut(p, 2); if (o) add(o.x, o.z, T2(p.name, p.en || p.name)); } } }
    const T = A.tower(); if (T && T.deck) out.push({ x: T.deck[0], z: T.deck[1], y: T.Yd, nm: T2('마디탑 전망층', 'Madi Tower deck'), deck: 1 }); return out; }
  function sitePatrol(p0) { const C = [], [ox, oz] = p0.door; for (let r = 60; r <= 260; r += 20) for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832, x = ox + Math.cos(a) * r, z = oz + Math.sin(a) * r; if (A.inSchool(x, z) || !A.okSpot(x, z)) continue; const rd = roadDir(x, z); if (!rd || rd.r > 5) continue; const tx = -rd.uz, tz = rd.ux; if (![-4.5, 4.5, -2.5, 2.5].every(k => A.okSpot(x + tx * k, z + tz * k))) continue; C.push({ x, z, tx, tz, nx: rd.ux, nz: rd.uz, a, r }); }
    return C; }
  function build() { if (SITE) return; const t0 = performance.now(); SITE = { mkt: siteMkt(), fish: siteFish(), auc: siteAuc(), stars: siteStars() };
    const pol = placeBy(/^경찰서$|파출소|지구대/), hos = placeBy(/^병원$|종합병원|대학병원/), cv = placeBy(/편의점/), bk = placeBy(/빵/); SITE.pol = pol && { p: pol, o: doorOut(pol, 2.2), cand: sitePatrol(pol) }; SITE.hos = hos && { p: hos, o: doorOut(hos, 2.4) }; SITE.cv = cv && { p: cv, o: doorOut(cv, 1.8) }; SITE.bk = bk && { p: bk, o: doorOut(bk, 1.8) };
    msBuild = performance.now() - t0; log('site ' + Math.round(msBuild) + 'ms mkt ' + !!SITE.mkt + ' fish ' + !!SITE.fish + ' auc ' + !!SITE.auc + ' stars ' + SITE.stars.length + ' pol ' + !!(SITE.pol && SITE.pol.o) + ' cand ' + (SITE.pol ? SITE.pol.cand.length : 0));
    buildMkt(); buildLate(); buildFish(); buildAuc(); buildStars(); }

  // ───────── 🏮 야시장 ─────────
  function mktNight() { const d = day(), st = S().mk, R = rng(hs('mk' + d + A.id)), s = sea(), lv = st.ok >= 2 ? 2 : (st.ok | 0) >= 1 ? 1 : 0, kind = lv >= 2 ? (R() < 0.6 ? 'both' : R() < 0.5 ? 'season' : 'local') : lv === 1 ? (R() < 0.5 ? 'season' : 'local') : (R() < 0.5 ? 'local' : 'season'), q = REQ[kind];
    const K = Object.keys(FOODS), good = shuf(K.filter(k => q.ok(FOODS[k], s)), R), bad = shuf(K.filter(k => !q.ok(FOODS[k], s)), R); const half = kind === 'both' ? bad.filter(k => ORIGIN[FOODS[k].from].near || FOODS[k].sea.includes(s)) : [];
    const pick = [...good.slice(0, kind === 'both' ? 1 : 2), ...half.slice(0, 2)]; for (const k of bad) { if (pick.length >= 5) break; if (!pick.includes(k)) pick.push(k); } return { d, kind, stalls: shuf(pick.slice(0, 5), R), seen: {}, got: null, done: false, tries: 0 }; }
  function buildMkt() { const M = SITE.mkt; if (!M) return; const { x, z, ux, uz, fx, fz } = M, ry = Math.atan2(fx, fz), y0 = M.y; mkt = mktNight(); log('mkt ' + mkt.kind + ' ' + mkt.stalls.join(','));
    M.stall = []; for (let k = -2; k <= 2; k++) { const sx = x + ux * k * 3.6, sz = z + uz * k * 3.6; M.stall.push({ x: sx, z: sz, ex: sx + fx * 1.9, ez: sz + fz * 1.9, y: A.ty(sx, sz) }); }
    M.nb = { x: x + ux * 10.5 + fx * 1.4, z: z + uz * 10.5 + fz * 1.4 }; M.board = { x: x + ux * 9.2 - fx * 0.3, z: z + uz * 9.2 - fz * 0.3 };
    paintMkt(); const sg = [{ x: M.board.x, y: y0 + 1.25, z: M.board.z, ry, w: 2.0, h: 0.9, t: en() ? 'Night market\n18:00–23:00' : '🏮 야시장\n저녁 6시~밤 11시', bg: '#7a2a1e' }];
    group('mktDay', put => { const L9 = (lx, ly, lz) => [x + ux * lx + fx * lz, y0 + ly, z + uz * lx + fz * lz]; for (const s of [-0.9, 0.9]) { const q = L9(9.2 + s, 0, -0.35); put('b', q[0], q[1], q[2], 0.08, 2.2, 0.08, 0x6b4a2f); }
      for (let k = -2; k <= 2; k++) { const q = L9(k * 3.6, 0, -0.6); put('b', q[0], q[1], q[2], 1.9, 0.5, 0.9, 0x8a6a4a, 0, ry); const r2 = L9(k * 3.6, 0.5, -0.6); put('b', r2[0], r2[1], r2[2], 1.7, 0.36, 0.7, TENTC[(k + 2) % 6], 0, ry); } }, [{ ...sg[0], t: en() ? 'Night market here\n18:00–23:00 · not on rainy days' : '🏮 여기서 야시장이 열려요\n저녁 6시~밤 11시 · 비 오면 쉬어요' }]);
    if (G.mktDay) G.mktDay.visible = true; }
  function paintMkt() { const M = SITE.mkt; if (!M || !mkt) return; const { x, z, ux, uz, fx, fz } = M, ry = Math.atan2(fx, fz), y0 = M.y, R = rng(hs('mkb' + mkt.d)), sg = [];
    group('mkt', put => { const L9 = (lx, ly, lz) => [x + ux * lx + fx * lz, y0 + ly, z + uz * lx + fz * lz];
      mkt.stalls.forEach((k, i) => { const F = FOODS[k], lx = (i - 2) * 3.6, col = TENTC[(i + (mkt.d % 3)) % TENTC.length];
        for (const [a, b] of [[-1.25, -1.0], [1.25, -1.0], [-1.25, 1.0], [1.25, 1.0]]) { const q = L9(lx + a, 0, b); put('b', q[0], q[1], q[2], 0.07, 2.3, 0.07, 0x5a5a62); }
        { const q = L9(lx, 2.3, 0); put('b', q[0], q[1], q[2], 2.7, 0.12, 2.3, col, 0, ry); const q2 = L9(lx, 2.05, 1.12); put('b', q2[0], q2[1], q2[2], 2.7, 0.25, 0.06, col, 0, ry); }
        { const q = L9(lx, 0, 0.55); put('b', q[0], q[1], q[2], 2.2, 0.85, 0.7, 0xb48a5a, 0, ry); const q2 = L9(lx, 0.85, 0.55); put('b', q2[0], q2[1], q2[2], 2.3, 0.05, 0.8, 0xe8dcc0, 0, ry); }
        for (let j = 0; j < 5; j++) { const q = L9(lx - 0.8 + j * 0.4, 0.9, 0.5 + (j % 2) * 0.12); put('s', q[0], q[1] + 0.06, q[2], 0.09, 0.8, 0, k === 'tang' ? 0xf29a2a : k === 'berry' ? 0xe0453a : k === 'banana' ? 0xf2d23a : k === 'squid' ? 0xe8c8a8 : 0xd89a4a); }
        for (let j = 0; j < 6; j++) { const q = L9(lx - 1.25 + j * 0.5, 2.02, 1.12); put('s', q[0], q[1], q[2], 0.06, 1, 0, j % 2 ? 0xffe2a0 : 0xfff3c8, 1); }
        { const q = L9(lx, 0, -0.35); fig(put, q[0], q[1], q[2], ry, { ...(i % 2 ? BODY.seller2 : BODY.seller), pose: i === 2 ? 'arms' : 'stand' }); }
        const q = L9(lx, 0.32, 0.93); sg.push({ x: q[0], y: q[1], z: q[2], ry, w: 1.5, h: 0.42, t: (F.e.replace('♨', '')) + ' ' + L(F.nm), bg: '#fff8e6', fg: '#2b2420', fr: '#' + col.toString(16).padStart(6, '0') }); });
      for (let k = 0; k < 4; k++) { const q = L9(-7.2 + k * 4.8, 0, 3.6); put('c', q[0], q[1], q[2], 0.42, 0.72, 0, 0xd8d4ca); const sd = L9(-7.2 + k * 4.8 + 0.7, 0, 3.6); put('c', sd[0], sd[1], sd[2], 0.16, 0.42, 0, 0x2f6fd0); }
      { const q = L9(10.5, 0, 1.4); fig(put, q[0], q[1], q[2], ry + Math.PI * 0.5, { ...BODY.nb, pose: 'wave' }); }
      for (let j = 0; j < 30; j++) { const q = L9(-9 + j * 0.62, 2.62 + Math.sin(j * 0.52) * 0.12, 1.3); put('s', q[0], q[1], q[2], 0.05, 1, 0, [0xffd27a, 0xff9a7a, 0xa8e0ff, 0xc8ff9a][j % 4], 1); }
      for (const s of [-9.4, 9.4]) { const q = L9(s, 0, 1.3); put('b', q[0], q[1], q[2], 0.08, 2.7, 0.08, 0x5a5a62); } void R; }, sg);
    M.paint = mkt.d; }
  /* 노점 판매대 = 몸 막힘(열려 있을 때만 · 낮에 접어 둔 자리에 보이지 않는 벽 X) */
  function colsMkt(on) { if (!on) { for (const h of MC) h.remove(); MC = []; return; } if (MC.length || !SITE || !SITE.mkt || !SITE.mkt.stall) return; const M = SITE.mkt; for (const s of M.stall) { const cx = s.x + M.fx * 0.55, cz = s.z + M.fz * 0.55, ax = Math.abs(M.ux) * 1.1 + Math.abs(M.fx) * 0.35, az = Math.abs(M.uz) * 1.1 + Math.abs(M.fz) * 0.35; MC.push(map.collider.add({ x0: cx - ax, x1: cx + ax, y0: s.y - 0.5, y1: s.y + 0.85, z0: cz - az, z1: cz + az, nc: true })); } }
  function mktCard(i) { const M = SITE.mkt, k = mkt.stalls[i], F = FOODS[k], O = ORIGIN[F.from], e = en(); mkt.seen[k] = 1;
    const h = '<h3>🏮 ' + esc(L(F.nm)) + '</h3><div class="ng-card"><b>' + (e ? 'Made from: ' : '재료: ') + esc(L(F.what)) + '</b><br>' + (e ? 'Comes from: ' : '온 곳: ') + esc(L(O.t)) + ' — ' + esc(L(O.d)) + '<br>' + (e ? 'Plenty in: ' : '많이 나는 때: ') + esc(L(F.when)) + (O.why ? '<br><small>' + esc(L(O.why)) + '</small>' : '') + '</div>'
      + '<div class="sm">' + (e ? 'Price ' : '값 ') + F.p + (e ? ' won · you have ' : '원 · 가진 돈 ') + A.money() + (e ? ' won' : '원') + '</div><div class="row"><button data-a="buy">' + (e ? 'Buy one' : '하나 사기') + '</button><button class="sub" data-a="x">' + (e ? 'Just looking' : '구경만') + '</button></div>';
    const P = A.openP(h, false, 'night'); P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.a === 'buy') { if (!A.pay(F.p)) { sayNow(e ? '💰 Not enough money' : '💰 돈이 모자라요', 2.5); return; } A.bagAdd(F.e, 1, 'mv:buy'); mkt.got = k; mkt.tries++; A.closeP(); sfx('ding'); A.bubble({ x: M.stall[i].x, y: M.stall[i].y + 0.2, z: M.stall[i].z, sc: 1 }, e ? 'Here you go, nice and hot!' : '따끈할 때 먹어요!');
        if (mkt.req && !mkt.done) say(e ? '🎁 Take it to the neighbour at the end of the row' : '🎁 줄 끝에 있는 이웃에게 건네요', 3); log('buy ' + k); } }; }
  function mktNb() { const e = en(), q = REQ[mkt.kind], s = sea(), seen = Object.keys(mkt.seen);
    if (mkt.done) { A.bubble({ x: SITE.mkt.nb.x, y: SITE.mkt.y + 0.2, z: SITE.mkt.nb.z, sc: 1 }, e ? 'Thanks again! Enjoy the market.' : '고마워요! 야시장 구경 잘해요.'); return; }
    if (!mkt.req) { mkt.req = 1; const h = '<h3>🙋 ' + (e ? 'A neighbour’s request' : '이웃의 부탁') + '</h3><div class="ng-card">' + esc(L(q.t)) + '</div><div class="sm">' + (e ? 'Walk along the stalls and read each sign (E). Then buy one and bring it here.' : '노점을 하나씩 돌며 판을 읽어 봐요(E). 고른 것을 사서 여기로 가져와요.') + ' ' + esc(L(SEAN[s])) + (e ? ' now.' : '이에요.') + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '알았어요') + '</button></div>';
      const P = A.openP(h, false, 'night'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; log('req ' + mkt.kind); return; }
    const have = Object.keys(FOODS).filter(k => mkt.stalls.includes(k) && (A.bag()[FOODS[k].e] | 0) > 0);
    if (!have.length) { sayNow(seen.length ? (e ? '🙋 “Have you found one? Buy it and bring it to me.”' : '🙋 “찾았어요? 사서 가져다줘요.”') : (e ? '🙋 “Read the stall signs first.”' : '🙋 “노점 판부터 읽어 봐요.”'), 3); return; }
    const h = '<h3>🎁 ' + (e ? 'Which one will you give?' : '무엇을 건넬까요?') + '</h3><div class="ng-ch">' + have.map(k => '<button data-k="' + k + '">' + FOODS[k].e.replace('♨', '') + ' ' + esc(L(FOODS[k].nm)) + '</button>').join('') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Not yet' : '아직이요') + '</button></div>';
    const P = A.openP(h, false, 'night'); P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const k = b.dataset.k, F = FOODS[k]; if (!k || !A.take(F.e)) return; A.closeP(); mktJudge(k); }; }
  function mktJudge(k) { const e = en(), F = FOODS[k], O = ORIGIN[F.from], s = sea(), q = REQ[mkt.kind], ok = q.ok(F, s), st = S().mk, M = SITE.mkt, near = O.near, ins = F.sea.includes(s);
    const W0 = jo(L(F.what), '은', '는'), noS = !F.sea.length;
    const why = [(near ? T2(W0 + ' ' + L(O.t) + '에서 왔대요. 가까워서 신선해요.', 'The ' + L(F.what) + ' came from ' + L(O.t) + ' — close by, so it’s fresh.') : T2(W0 + ' ' + L(O.t) + '에서 ' + L(O.d).replace(/요$/, '') + ' 걸려 왔대요.', 'The ' + L(F.what) + ' came from ' + L(O.t) + ' — ' + L(O.d) + '.')),
      (ins ? T2(W0 + ' 지금 ' + L(SEAN[s]) + '이 제철이에요.', 'The ' + L(F.what) + ' is in season now, in ' + L(SEAN[s]) + '.') : noS ? T2(W0 + ' ' + L(F.when) + '. 따로 제철이 없어요.', 'The ' + L(F.what) + ': ' + L(F.when) + ' — no special season.') : T2(W0 + ' ' + L(F.when) + '에 많이 나요. 지금은 ' + L(SEAN[s]) + '이에요.', 'The ' + L(F.what) + ' is plentiful in ' + L(F.when) + ', but now it is ' + L(SEAN[s]) + '.'))];
    const use = mkt.kind === 'local' ? [why[0]] : mkt.kind === 'season' ? [why[1]] : why;
    if (ok) { mkt.done = true; st.ok = (st.ok | 0) + 1; st.n = (st.n | 0) + 1; mark(); A.skUp('trade', 3, 'night:mkt'); A.tev('night'); A.rec('night', { k: 'mkt', f: k, kind: mkt.kind }); sfx('done');
      A.bubble({ x: M.nb.x, y: M.y + 0.2, z: M.nb.z, sc: 1 }, e ? 'Just what I wanted!' : '딱 이걸 먹고 싶었어요!'); sayNow('🙋 ' + (e ? 'Thank you! ' : '고마워요! ') + use.map(L).join(' '), 6); log('judge ok ' + k); }
    else { A.bubble({ x: M.nb.x, y: M.y + 0.2, z: M.nb.z, sc: 1 }, e ? 'Hmm, not quite…' : '음, 이건 조금 달라요…'); sayNow('🙋 ' + use.map(L).join(' ') + ' ' + (e ? 'Can you look at the signs again?' : '판을 다시 읽어 봐 줄래요?'), 7); log('judge no ' + k); } }

  // ───────── 🏪 늦게 일하는 곳(24시 편의점 · 응급실 · 경찰서) · 🍞 이른 아침 빵집 ─────────
  function buildLate() { const sg = [];
    group('late', put => { const at = (o, k) => { const y = A.ty(o.x, o.z); return [o.x, y, o.z, o.ry]; };
      if (SITE.cv && SITE.cv.o) { const [x, y, z, ry] = at(SITE.cv.o), c = Math.cos(ry), n = Math.sin(ry); fig(put, x + c * 1.2, y, z - n * 1.2, ry, { ...BODY.clerk, pose: 'arms' }); put('b', x + c * 1.2 + n * 0.45, y, z - n * 1.2 + c * 0.45, 0.55, 0.4, 0.4, 0xb48a5a, 0, ry); sg.push({ x: x - c * 1.4, y: y + 0.1, z: z + n * 1.4, ry, w: 1.0, h: 0.5, t: '24', bg: '#3c9a5a' }); put('b', x - c * 1.4, y, z + n * 1.4, 0.06, 0.12, 0.06, 0x5a5a62); }
      if (SITE.hos && SITE.hos.o) { const [x, y, z, ry] = at(SITE.hos.o), c = Math.cos(ry), n = Math.sin(ry); fig(put, x + c * 1.4, y, z - n * 1.4, ry, { ...BODY.medic }); for (const s of [-1, 1]) put('b', x - c * (1.6 + s * 0.6), y, z + n * (1.6 + s * 0.6), 0.07, 1.6, 0.07, 0x5a5a62); sg.push({ x: x - c * 1.6, y: y + 1.6, z: z + n * 1.6, ry, w: 1.6, h: 0.55, t: en() ? 'EMERGENCY' : '응급실', bg: '#c8302a' }); put('b', x - c * 1.6, y + 2.16, z + n * 1.6, 0.36, 0.08, 0.08, 0xff4a3a, 1, ry); }
      if (SITE.pol && SITE.pol.o) { const [x, y, z, ry] = at(SITE.pol.o), c = Math.cos(ry), n = Math.sin(ry); fig(put, x + c * 1.0, y, z - n * 1.0, ry, { ...BODY.officer }); for (const s of [-1, 1]) put('b', x - c * (1.5 + s * 0.6), y, z + n * (1.5 + s * 0.6), 0.07, 1.6, 0.07, 0x5a5a62); sg.push({ x: x - c * 1.5, y: y + 1.6, z: z + n * 1.5, ry, w: 1.6, h: 0.55, t: en() ? 'POLICE' : '경찰서', bg: '#1f3f8a' }); put('b', x - c * 1.5 - c * 0.2, y + 2.16, z + n * 1.5 + n * 0.2, 0.2, 0.08, 0.08, 0xff4a3a, 1, ry); put('b', x - c * 1.5 + c * 0.2, y + 2.16, z + n * 1.5 - n * 0.2, 0.2, 0.08, 0.08, 0x3a7aff, 1, ry); } }, sg);
    if (SITE.bk && SITE.bk.o) { const o = SITE.bk.o, y = A.ty(o.x, o.z), c = Math.cos(o.ry), n = Math.sin(o.ry); group('bake', put => { fig(put, o.x + c * 1.0, y, o.z - n * 1.0, o.ry, { ...BODY.baker, pose: 'arms' }); put('b', o.x + c * 1.0 + n * 0.5, y + 0.95, o.z - n * 1.0 + c * 0.5, 0.6, 0.05, 0.4, 0xc88a4a, 0, o.ry); for (let j = 0; j < 4; j++) put('s', o.x - c * (0.6 + j * 0.35), y + 2.3, o.z + n * (0.6 + j * 0.35), 0.07, 1, 0, 0xffe2a0, 1); }); } }

  // ───────── 🦑 오징어잡이 배 · 🎣 밤 낚시 ─────────
  function boatsN(d) { const R = rng(hs('bt' + d + A.id)); return 3 + ((R() * 6) | 0); }
  function buildFish() { const F = SITE.fish; if (!F) return; const d = day(), R = rng(hs('fl' + d + A.id)), pats = ['101', '110', '011', '100', '001', '010'], pat9 = pats[(R() * pats.length) | 0];
    F.forEach((o, i) => { o.lit = pat9[i] === '1'; o.lx = o.x - Math.cos(o.sa) * 1.1; o.lz = o.z - Math.sin(o.sa) * 1.1; }); fishP = { d, casts: 0, got: 0, tried: {} };
    group('fish', put => { for (const o of F) { const y = gy(o.lx, o.lz); put('c', o.lx, y, o.lz, 0.06, 3.6, 0, 0x4a4f58); put('b', o.lx + Math.cos(o.sa) * 0.35, y + 3.55, o.lz + Math.sin(o.sa) * 0.35, 0.8, 0.06, 0.08, 0x4a4f58, 0, Math.atan2(Math.cos(o.sa), -Math.sin(o.sa))); put('s', o.lx + Math.cos(o.sa) * 0.7, y + 3.44, o.lz + Math.sin(o.sa) * 0.7, 0.13, 0.8, 0, 0x8a8f98); put('c', o.x + Math.cos(o.sa + 1.6) * 0.6, gy(o.x, o.z), o.z + Math.sin(o.sa + 1.6) * 0.6, 0.18, 0.32, 0, 0x2f6fd0); } });
    group('fishLit', put => { for (const o of F) if (o.lit) put('s', o.lx + Math.cos(o.sa) * 0.7, gy(o.lx, o.lz) + 3.43, o.lz + Math.sin(o.sa) * 0.7, 0.16, 0.8, 0, 0xfff1c0, 1); });
    const n = boatsN(d), B = [], base = F[0], dirs = []; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.2832, x = base.x + Math.cos(a) * 200, z = base.z + Math.sin(a) * 200; if (A.seaSd(x, z) < -80) dirs.push(a); }
    const a0 = dirs.length ? dirs[(dirs.length / 2) | 0] : 0; for (let i = 0; i < 16 && B.length < n; i++) { const a = a0 + (R() - 0.5) * 1.2, r = 110 + R() * 90, x = base.x + Math.cos(a) * r, z = base.z + Math.sin(a) * r; if (A.seaSd(x, z) < -60 && B.every(q => Math.hypot(q[0] - x, q[1] - z) > 26)) B.push([x, z, R() * 6.28]); }
    fishP.boats = B.length; const sy = A.seaY ? A.seaY() : base.y - 1.2;   /* 바다 물낯 높이 */
    group('boats', put => { for (const [x, z, ry] of B) { const c = Math.cos(ry), s = Math.sin(ry); put('b', x, sy - 0.3, z, 2.2, 1.0, 7, 0x3a4250, 0, ry); put('b', x - s * 1.8, sy + 0.7, z - c * 1.8, 1.6, 1.2, 1.6, 0xd8d4ca, 0, ry); put('b', x, sy + 2.6, z, 0.08, 0.08, 6.2, 0x2b313a, 0, ry);
      for (let j = 0; j < 7; j++) { const t = -2.7 + j * 0.9; put('s', x + s * t, sy + 2.4, z + c * t, 0.42, 0.9, 0, 0xfff8d8, 1); } } });   /* 집어등 줄(밝은 등 일곱 · 멀리서도 보이게 크게) */
    log('fish ' + pat9 + ' boats ' + B.length); }
  const boatsNow = () => (fishP && !wet() && !A.windy() ? fishP.boats : 0);   /* 지금 바다에 나간 배(비·바람 센 때 = 0) */
  function seaView() { const e = en(), d = day(), st = S(), n = boatsNow(), done = st.boats.some(q => q.d === d), R = rng(hs('bq' + d)), opts = shuf([...new Set([n, n + 2, Math.max(0, n - 2), n + 4])].slice(0, 3), R).sort((a, b) => a - b);
    const rows = st.boats.slice(-5).map(q => (e ? 'Day ' + q.d + ': ' : q.d + '일째: ') + q.n + (e ? ' lights' : '개') + (q.w ? ' (' + L(q.w === 'wind' ? T2('바람 셈', 'windy') : T2('비·눈', 'rain/snow')) + ')' : '')).join('<br>');
    if (done) { const P = A.openP('<h3>🦑 ' + (e ? 'Lights at sea — my log' : '바다 불빛 — 내 일지') + '</h3><div class="ng-log">' + rows + '</div><div class="sm">' + (e ? 'Come back another night and compare.' : '다른 밤에 또 와서 견줘 봐요.') + '</div><div class="row"><button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'night'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; return; }
    const h = '<h3>🦑 ' + (e ? 'Lights out at sea' : '먼바다 불빛') + '</h3><div class="sm">' + (e ? 'Look out to sea. How many bright lights can you count?' : '바다 쪽을 둘러봐요. 밝은 불빛 무리가 몇 개 보여요?') + '</div><div class="ng-row">' + opts.map(v => '<button data-n="' + v + '">' + v + '</button>').join('') + '</div><div class="ng-m"></div>' + (rows ? '<div class="ng-log">' + rows + '</div>' : '') + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Look again' : '다시 보고 올게요') + '</button></div>';
    const P = A.openP(h, false, 'night'); P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const v = +b.dataset.n;
      if (v !== n) { P.querySelector('.ng-m').textContent = e ? 'Not quite. Turn around slowly and count again.' : '조금 달라요. 천천히 둘러보며 다시 세어 봐요.'; return; }
      st.boats.push({ d, n, w: A.windy() ? 'wind' : wet() ? 'wet' : '' }); if (st.boats.length > 12) st.boats.shift(); mark(); A.skUp('look', 1, 'night:boats'); A.tev('night'); A.rec('night', { k: 'boats', n });
      const fact = n ? (e ? 'They are squid-fishing boats. Squid swim toward light, so the boats hang very bright lamps over the water at night.' : '오징어잡이 배예요. 오징어는 빛 쪽으로 모여서, 배가 밤에 아주 밝은 등(집어등)을 켜고 잡아요.') : (e ? 'No boats tonight. When the wind and waves are high, fishing boats stay in port to be safe.' : '오늘은 배가 안 나갔어요. 바람이 세고 물결이 높으면 고기잡이배는 안전하려고 항구에 머물러요.');
      A.closeP(); sayNow('🦑 ' + fact, 7); log('boats ' + n); }; }
  function fishCast(i) { const e = en(), F = SITE.fish, o = F[i], d = day(); if (!fishP || fishP.d !== d) buildFish(); if (!open('fish')) { sayNow(e ? '🎣 Night fishing starts at 19:00' : '🎣 밤 낚시는 저녁 7시부터예요', 3); return; }
    if (fishP.casts >= 3) { sayNow(e ? '🎣 No bait left tonight. Come back tomorrow night.' : '🎣 오늘 밤 미끼를 다 썼어요. 내일 밤에 또 와요.', 3.5); return; }
    fishP.casts++; const left = 3 - fishP.casts, n = o.lit ? (o.deep ? 2 + (rng(hs('fc' + d + i + fishP.casts))() < 0.5 ? 1 : 0) : 1) : 0, sp = sea(), fish = o.deep ? NFISH[sp] : T2('망둥어', 'goby');
    const P = A.openP('<h3>🎣 ' + (e ? 'Night fishing' : '밤 낚시') + '</h3><div class="ng-wait">🎣</div><div class="sm">' + (e ? 'Waiting for a bite… (bait left: ' + left + ')' : '입질을 기다려요… (남은 미끼 ' + left + ')') + '</div>', false, 'night'); let k = 0;
    const iv = setInterval(() => { if (dead) { clearInterval(iv); return; } k++; const gone = !P.isConnected, w = gone ? null : P.querySelector('.ng-wait'); if (w) w.style.transform = 'translateY(' + (k % 2 ? 6 : 0) + 'px)'; if (k < 8 && !gone) return; clearInterval(iv);   /* 창을 먼저 닫아도 결과는 그대로(쓴 미끼가 헛되지 않게 · 한 줄로 알림) */
      if (n) { A.bagAdd('🐟', n, 'night:fish'); fishP.got += n; } const st = S().fish; st.n = (st.n | 0) + 1; if (n && !st.first) { st.first = d; A.tev('night'); A.skUp('look', 2, 'night:fish'); } mark(); A.rec('night', { k: 'fish', spot: o.k, lit: o.lit, n });
      const why = o.lit ? (o.deep ? (e ? 'The lamp lights the deep water. Tiny sea creatures gather in the light, and fish come to eat them.' : '등불이 깊은 물을 비춰요. 불빛에 작은 바다 생물이 모이고, 그걸 먹으러 물고기가 와요.') : (e ? 'Light, but the water here is shallow. Only a small goby came.' : '불빛은 있지만 물이 얕아요. 작은 망둥어만 왔어요.')) : (e ? 'This spot is dark tonight. Without light, little food gathers here.' : '오늘 밤 이 자리는 등이 꺼져 어두워요. 불빛이 없으니 먹이가 덜 모여요.');
      if (gone) { sayNow('🎣 ' + (n ? (e ? 'Caught ' + n + ' ' + L(fish) + '. ' : L(fish) + ' ' + n + '마리! ') : (e ? 'Nothing this time. ' : '이번엔 안 잡혔어요. ')) + why, 5); sfx(n ? 'ding' : 'tick'); log('cast ' + i + ' ' + n + ' (창 닫음)'); return; }
      P.innerHTML = '<h3>🎣 ' + (n ? (e ? 'Caught ' + n + ' ' + L(fish) : L(fish) + ' ' + n + '마리!') : (e ? 'Nothing this time' : '이번엔 안 잡혔어요')) + '</h3><div class="ng-card">' + esc(why) + '</div><div class="sm">' + (e ? 'Bait left: ' + left : '남은 미끼 ' + left) + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '알았어요') + '</button></div>'; P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; sfx(n ? 'ding' : 'tick'); log('cast ' + i + ' ' + n); }, 600); }

  // ───────── 🔔 이른 아침 경매 ─────────
  function aucShops() { const P = PL().filter(p => p.door && /해산물|초밥|횟집|식당|마트|직판장/.test(p.name || '') && !/수산물 시장/.test(p.name || '')), a = SITE.auc; if (!a) return []; P.sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z)); const out = []; for (const p of P) { if (out.some(q => q.name === p.name)) continue; out.push(p); if (out.length >= 3) break; } return out; }
  function buildAuc() { const a = SITE.auc; if (!a) return; const { x, z, fx, fz, px, pz } = a, y = a.y, ry = Math.atan2(-fx, -fz), sg = [];
    a.shops = aucShops(); if (a.shops.length < 3) { SITE.auc = null; return; }
    group('auc', put => { const L9 = (s, f) => [x + px * s + fx * f, z + pz * s + fz * f]; { const [cx, cz] = L9(0, 0.5); put('b', cx, y, cz, 7, 0.03, 4.5, 0x2f6fd0, 0, ry); }
      for (let i = 0; i < 6; i++) { const [cx, cz] = L9(-2.5 + i, 0.6); put('b', cx, y + 0.03, cz, 0.8, 0.3, 0.55, 0xf2f2ee, 0, ry); for (let j = 0; j < 3; j++) put('s', cx - 0.2 + j * 0.2, y + 0.37, cz, 0.08, 0.6, 0, 0x9ab0c0); }
      { const [cx, cz] = L9(0, -1.6); fig(put, cx, y, cz, ry + Math.PI, { ...BODY.auct, pose: 'up' }); }
      for (let i = 0; i < 3; i++) { const [cx, cz] = L9(-2 + i * 2, 2.6); fig(put, cx, y, cz, ry, { ...BODY.nb, cap: CAPC[i][1], pose: 'stand' }); }
      for (const sd of [-1.2, 1.2]) { const [cx, cz] = L9(sd, -2.65); put('b', cx, y, cz, 0.08, 2.75, 0.08, 0x5a5a62); } },   /* 경매 판 기둥 둘 */ [{ x: x - fx * 2.6, y: y + 2.0, z: z - fz * 2.6, ry: Math.atan2(fx, fz), w: 2.6, h: 0.7, t: en() ? 'Morning fish auction' : '🔔 아침 경매 06:00~08:30', bg: '#24345a' }]);
    const sg2 = a.shops.map(p => { const o = doorOut(p, 1.6); return o ? { x: o.x, y: A.ty(o.x, o.z) + 0.9, z: o.z, ry: o.ry, w: 1.5, h: 0.5, t: '', bg: '#24345a' } : null; }); a.sgAt = sg2; void sg; }
  function aucPaint() { const a = SITE.auc; if (!a) return; const g = S().auc; if (g.d !== day() || !Array.isArray(g.got) || !g.got.length) { drop('aucSign'); return; } if (G.aucSign && G.aucSign.userData.d === g.d) return;
    const sg = []; g.got.forEach(q => { const i = a.shops.findIndex(p => p.name === q.shop), o = a.sgAt[i]; if (o) sg.push({ ...o, t: (en() ? 'Fresh from the auction: ' : '오늘 아침 경매: ') + L(q.f) }); });
    group('aucSign', put => { for (const o of sg) put('b', o.x, o.y - 0.9, o.z, 0.06, 0.9, 0.06, 0x6b4a2f); }, sg); G.aucSign.userData.d = g.d; G.aucSign.visible = true; }
  function hand(n) { let s = '<svg viewBox="0 0 64 64"><rect x="14" y="32" width="36" height="26" rx="10" fill="#f2c9a0" stroke="#2b2420" stroke-width="3"/>'; for (let i = 0; i < 5; i++) { const up = i < n, x = 15 + i * 7.4; s += '<rect x="' + x + '" y="' + (up ? 8 : 26) + '" width="6" height="' + (up ? 28 : 10) + '" rx="3" fill="#f2c9a0" stroke="#2b2420" stroke-width="2.5"/>'; } return s + '</svg>'; }
  function aucStart() { const e = en(), a = SITE.auc, g = S().auc, d = day(); if (!open('auction')) { sayNow(e ? '🔔 The fish auction runs 06:00–08:30' : '🔔 수산물 경매는 아침 6시부터 8시 반까지예요', 3.5); return; }
    if (g.d === d && g.fin) { sayNow(e ? '🔔 Today’s auction is over. The fish went to the shops — go and look at their signs!' : '🔔 오늘 경매는 끝났어요. 생선은 가게로 갔어요. 가게 문 앞 판을 보러 가요!', 4); return; }
    const R = rng(hs('au' + d + A.id)), F = AUCF[sea()]; auc = { r: 0, R, F, got: [], miss: 0, lot: null }; aucRound(); }
  function aucRound() { const e = en(), a = SITE.auc; if (auc.r >= 3) return aucEnd(); const R = auc.R, b = shuf([2, 3, 4, 5], R).slice(0, 3), win = b.indexOf(Math.max(...b)), f = auc.F[auc.r]; auc.lot = { b, win, f, st: 0 };
    const draw = msg => '<h3>🔔 ' + (e ? 'Lot ' + (auc.r + 1) + ' of 3 — ' : '상자 ' + (auc.r + 1) + '/3 — ') + esc(L(f)) + '</h3>' + (auc.lot.st === 0 ? '<div class="sm">' + (e ? 'Buyers bid with hand signs. One finger = 10,000 won. Who bid the most?' : '사는 사람들이 손가락으로 값을 불러요. 손가락 하나 = 만 원. 누가 가장 높게 불렀어요?') + '</div><div class="ng-bid">' + b.map((v, i) => '<button data-i="' + i + '"><span><i class="ng-cap" style="background:' + CAPC[i][0] + '"></i>' + esc(L(CAPC[i][2])) + '</span>' + hand(v) + '</button>').join('') + '</div>'
      : '<div class="sm">' + (e ? 'The ' + L(CAPC[win][2]) + ' buyer won. Which shop will this box go to? (look at the board)' : esc(L(CAPC[win][2]))  + ' 사람이 샀어요. 이 상자는 어느 가게로 갈까요? (게시판을 봐요)') + '</div><div class="ng-card">' + a.shops.map((p, i) => '<i class="ng-cap" style="background:' + CAPC[i][0] + '"></i>' + esc(L(CAPC[i][2])) + ' = ' + esc(p.name)).join('<br>') + '</div><div class="ng-ch">' + shuf(a.shops.map((p, i) => i), R).map(i => '<button data-s="' + i + '">' + esc(a.shops[i].name) + '</button>').join('') + '</div>') + '<div class="ng-m">' + (msg || '') + '</div>';
    const P = A.openP(draw(), false, 'night'); P.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; const lot = auc.lot;
      if (lot.st === 0 && bt.dataset.i != null) { if (+bt.dataset.i !== lot.win) { auc.miss++; P.innerHTML = draw(e ? 'Count the raised fingers again.' : '세운 손가락을 다시 세어 봐요.'); return; } lot.st = 1; sfx('tick'); P.innerHTML = draw(); return; }
      if (lot.st === 1 && bt.dataset.s != null) { if (+bt.dataset.s !== lot.win) { auc.miss++; P.innerHTML = draw(e ? 'Match the cap colour on the board.' : '게시판에서 모자 색을 맞춰 봐요.'); return; } auc.got.push({ shop: a.shops[lot.win].name, f: lot.f }); auc.r++; sfx('ding'); aucRound(); } }; }
  function aucEnd() { const e = en(), g = S().auc, d = day(); g.d = d; g.fin = 1; g.got = auc.got; g.n = (g.n | 0) + 1; mark(); A.closeP(); A.skUp('trade', 2, 'night:auc'); A.tev('night'); A.rec('night', { k: 'auc', miss: auc.miss }); if (A.stamp('🔔')) sayNow(e ? '🔔 Morning auction stamp!' : '🔔 아침 경매 도장 쾅!', 2.5);
    sayNow('🔔 ' + (e ? 'Sold! The boxes go to ' : '다 팔렸어요! 상자는 ') + [...new Set(auc.got.map(q => q.shop))].join(', ') + (e ? '. Their door signs will show today’s fish.' : '로 가요. 오늘 그 가게 문 앞 판에 생선 이름이 붙어요.'), 6); aucPaint(); auc = null; log('auc end'); }

  // ───────── 🌌 별 ─────────
  function buildStars() { if (star) return; const N = STAR.length + 260, P = new Float32Array(N * 3), C = new Float32Array(N * 3), Z = new Float32Array(N), R = rng(hs('sky' + A.id));
    STAR.forEach((s, i) => { Z[i] = s[3] * 2.2; C[i * 3] = 1; C[i * 3 + 1] = 0.97; C[i * 3 + 2] = 0.86; });
    const bg = []; for (let i = STAR.length; i < N; i++) { const ra = R() * 24, dec = Math.asin(R() * 2 - 1) * 180 / Math.PI; bg.push([ra, dec]); Z[i] = 1.2 + R() * 1.5; const w = 0.8 + R() * 0.2; C[i * 3] = w; C[i * 3 + 1] = w; C[i * 3 + 2] = 1; }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(P, 3)); geo.setAttribute('aC', new T3.BufferAttribute(C, 3)); geo.setAttribute('aS', new T3.BufferAttribute(Z, 1));
    const U = { uK: { value: 0 }, uDim: { value: 0 }, uPx: { value: Math.min(2, window.devicePixelRatio || 1) } };
    const mat = new T3.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, fog: false, vertexShader: 'attribute float aS; attribute vec3 aC; uniform float uK; uniform float uDim; uniform float uPx; varying vec3 vC; varying float vA;\nvoid main() { vec4 mv = viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uPx; vC = aC; vA = uK * (aS < 3.5 ? (1.0 - uDim) : 1.0) * clamp(position.y / 40.0, 0.0, 1.0); }',
      fragmentShader: 'varying vec3 vC; varying float vA;\nvoid main() { vec2 q = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.12, length(q)) * vA; if (a < 0.02) discard; gl_FragColor = vec4(vC, a); }' });
    const pts = new T3.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -0.5; pts.matrixAutoUpdate = false; pts.visible = false; pts.userData.fx = 1; map.add(pts); star = { pts, geo, mat, U, bg, key: '', on: false, k: 0 }; }
  function starKey(m) { const s = sea(); return s + ':' + ((A.GAME.S.day | 0) % 7) + ':' + Math.floor(m / 10); }
  function starPlace(m) { const s = sea(), doy = SEADOY[s] + ((A.GAME.S.day | 0) % 7) * 13, h = m / 60, P = star.geo.attributes.position.array, R0 = 240;
    const put = (i, D) => { P[i * 3] = D.e * R0; P[i * 3 + 1] = D.u * R0; P[i * 3 + 2] = -D.n * R0; }; STAR.forEach((q, i) => { const D = starDir(q[1], q[2], doy, h); put(i, D); q.D = D; });
    star.bg.forEach((q, j) => put(STAR.length + j, starDir(q[0], q[1], doy, h))); star.geo.attributes.position.needsUpdate = true; }
  function starSec(m) { if (!star) return; const clear = A.wx() === 'clear', want = clear && !A.away() && (m >= 1140 || m < 330) && A.on(); if (want !== star.on) { star.on = want; star.pts.visible = want; }
    if (!want) return; const k = m >= 1140 ? Math.min(1, (m - 1140) / 35) : 1; if (Math.abs(k - star.k) > 0.02) { star.k = k; star.U.uK.value = k; } const key = starKey(m); if (key !== star.key) { star.key = key; starPlace(m); }
    const p = me(), T = A.tower(), city = (T && Math.hypot(p.x - T.x, p.z - T.z) < 240) || (SITE && SITE.mkt && open('mkt') && !wet() && Math.hypot(p.x - SITE.mkt.x, p.z - SITE.mkt.z) < 160) ? 1 : 0; if (star.U.uDim.value !== city) star.U.uDim.value = city; }
  function starUse(sp) { const e = en(), m = min(); if (!(m >= 1170) || A.wx() !== 'clear') { sayNow(A.wx() !== 'clear' ? (e ? '☁️ Stars are hidden tonight. Try on a clear night.' : '☁️ 오늘 밤은 구름에 별이 가려요. 맑은 밤에 와요.') : (e ? '🌌 Stars come out after 19:30' : '🌌 별은 저녁 7시 반부터 보여요'), 3); return; }
    if (aim && aim.sp === sp) return starCheck(); starPlace(m); star.key = starKey(m);
    const s = sea(), dp = STAR.find(q => q[0] === 'dubhe').D, ca = STAR.find(q => q[0] === 'gcas').D, useW = dp.alt < 22 && ca.alt > dp.alt, dim = star.U.uDim.value > 0;
    const hint = useW ? (e ? 'Find the W shape (Cassiopeia). The North Star is about five W-widths out from the middle of the W.' : 'W 모양(카시오페이아)을 찾아요. W 가운데에서 W 폭의 다섯 배쯤 떨어진 곳에 북극성이 있어요.') : (e ? 'Find the Big Dipper (a ladle of seven stars). Join the two stars at the end of the ladle and go about five times that gap — that’s the North Star.' : '북두칠성(국자 모양 일곱 별)을 찾아요. 국자 끝 두 별을 이은 줄을 다섯 배쯤 늘이면 북극성이에요.');
    const P = A.openP('<h3>🌌 ' + (e ? 'Find north by the stars' : '별로 북쪽 찾기') + '</h3><div class="ng-card">' + esc(hint) + '</div>' + (dim ? '<div class="sm">' + (e ? 'City lights here hide faint stars. Only bright ones show.' : '여기는 둘레 불빛이 밝아 흐린 별이 묻혀요. 밝은 별만 보여요.') + '</div>' : '') + '<div class="sm">' + (e ? 'Tilt your view up to the sky, turn until the North Star is just above the middle mark, then press E.' : '고개를 들어 하늘을 보고, 북극성이 가운데 표시 바로 위에 오게 돌린 다음 E를 눌러요.') + '</div><div class="row"><button data-a="go">' + (e ? 'Start looking' : '찾아볼게요') + '</button></div>', false, 'night');
    P.onclick = ev => { if (!ev.target.closest('button')) return; A.closeP(); aim = { sp, t0: m, tries: 0, step: 1 }; aimOn(); }; log('star ' + (useW ? 'W' : 'dipper') + ' dim ' + dim); }
  function aimOn() { if (!aim) return; if (!document.querySelector('.ng-aim')) { const d = document.createElement('div'); d.className = 'ng-aim ttl-keep'; document.body.appendChild(d); } }
  function aimOff() { const d = document.querySelector('.ng-aim'); if (d) d.remove(); aim = null; }
  function camAz() { map.camera.getWorldDirection(V1); return { az: (Math.atan2(V1.x, -V1.z) * 180 / Math.PI + 360) % 360, el: Math.asin(Math.max(-1, Math.min(1, V1.y))) * 180 / Math.PI, x: V1.x, y: V1.y, z: V1.z }; }
  function starCheck() { const e = en(), c = camAz(), pol = STAR[0].D, da = Math.abs(((c.az - pol.az + 540) % 360) - 180); aim.tries++;
    if (da < 16 && c.el > 6) { aim.step = 2; return starQ(); }
    let b = null, bd = -2; for (const q of STAR) { if (!q.D || q.D.alt < 3) continue; const v = (q.D.e * c.x + q.D.u * c.y + -q.D.n * c.z); if (v > bd) { bd = v; b = q; } }
    sayNow('🌌 ' + (c.el < 6 ? (e ? 'Look higher up into the sky first.' : '먼저 하늘 쪽으로 고개를 더 들어요.') : b && bd > 0.93 ? (e ? 'That one is ' + L(b[4]) + '. ' : '그 별은 ' + L(b[4]) + '이에요. ') + (e ? 'Follow the pointer stars further.' : '가리키는 별을 따라 조금 더 가 봐요.') : (e ? 'Not there yet. Find the ladle or the W first.' : '아직 아니에요. 국자나 W 모양부터 찾아요.')), 4); log('star miss ' + Math.round(da)); }
  function starQ() { const e = en(), sp = aim.sp, P0 = PL(), T = A.tower(), sch = A.school(), C = [];
    if (T && Math.hypot(T.x - sp.x, T.z - sp.z) > 150) C.push([T.x, T.z, T2('마디탑', 'Madi Tower')]); if (sch && Math.hypot(sch[0] - sp.x, sch[1] - sp.z) > 150) C.push([sch[0], sch[1], T2('우리 학교', 'our school')]);
    for (const p of P0) if (/^바다$|^호수$|뒷산$/.test(p.name || '') && Math.hypot(p.x - sp.x, p.z - sp.z) > 150) C.push([p.x, p.z, T2(p.name, p.en || p.name)]);
    const st = S().star, tg = C.length ? C[(st.n | 0) % C.length] : null; if (!tg) return starDone(null, true); const ans = d8i(tg[0] - sp.x, tg[1] - sp.z), lay = [7, 0, 1, 6, -1, 2, 5, 4, 3];
    const P = A.openP('<h3>🌌 ' + (e ? 'You found the North Star!' : '북극성을 찾았어요!') + '</h3><div class="sm">' + (e ? 'The North Star is always in the north. So which way is ' + L(tg[2]) + ' from here?' : '북극성이 있는 쪽이 북쪽이에요. 그럼 여기서 ' + jo(L(tg[2]), '은', '는') + ' 어느 쪽이에요?') + '</div><div class="ng-cmp">' + lay.map(i => i < 0 ? '<span></span>' : '<button data-d="' + i + '">' + esc(L(DIR8[i])) + '</button>').join('') + '</div><div class="ng-m"></div>', false, 'night');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const v = +b.dataset.d; if (v === ans) { A.closeP(); starDone(tg, true); } else { P.querySelector('.ng-m').textContent = e ? 'Face the North Star again, then look for ' + L(tg[2]) + '.' : '북극성 쪽을 다시 보고, ' + jo(L(tg[2]), '이', '가') + ' 어느 쪽인지 찾아봐요.'; aim.wrong = (aim.wrong | 0) + 1; } }; }
  function starDone(tg, ok) { const e = en(), st = S().star; st.n = (st.n | 0) + 1; st.d = day(); mark(); aimOff(); A.skUp('explore', 3, 'night:star'); A.tev('night'); A.rec('night', { k: 'star', to: tg ? tg[2][0] : '' });
    if (A.stamp('🌌')) sayNow(e ? '🌌 North Star stamp!' : '🌌 북극성 도장 쾅!', 2.5); sayNow('🌌 ' + (e ? 'The North Star barely moves all night, while other stars turn around it. People used it to find the way.' : '북극성은 밤새 거의 움직이지 않고, 다른 별들이 그 둘레를 돌아요. 옛날 사람들은 북극성으로 길을 찾았어요.'), 6); log('star done'); void ok; }

  // ───────── 👮 밤 순찰 ─────────
  function patStart() { const e = en(), Pp = SITE.pol, m = min(), d = day(); if (!Pp || !Pp.o) return;
    if (pat && pat.d === d) { if (pat.cps.every(c => c.done)) return patEnd(); const c = pat.cps.find(q => !q.done); A.guide([c.x, c.z], { icon: '👮', name: e ? 'patrol point' : '순찰 자리' }); sayNow(e ? '👮 Officer: “Next stop — follow the red line.”' : '👮 경찰관: "다음 순찰 자리로 가요. 빨간 선을 따라가요."', 3); return; }
    if (!open('patrol', m)) { sayNow(m < NHRS.patrol[0] ? (e ? '👮 Officer: “Night patrol starts at 20:30. Come back then.”' : '👮 경찰관: "밤 순찰은 저녁 8시 반에 시작해요. 그때 와요."') : (e ? '👮 Officer: “It’s late. Go home and rest!”' : '👮 경찰관: "밤이 늦었어요. 집에 가서 쉬어요!"'), 3.5); return; }
    if (S().pat.d === d) { sayNow(e ? '👮 Officer: “We already patrolled tonight. Thank you!”' : '👮 경찰관: "오늘 밤 순찰은 이미 했어요. 고마워요!"', 3); return; }
    const R = rng(hs('pt' + d + A.id)), cand = shuf(Pp.cand.slice(), R), cps = [], kinds = shuf(SCENES.slice(), R).slice(0, 3); for (const c of cand) { if (cps.length >= 3) break; if (cps.every(q => Math.hypot(q.x - c.x, q.z - c.z) > 55)) cps.push({ ...c, k: kinds[cps.length], done: false, R: rng(hs('pc' + d + cps.length)) }); }
    if (cps.length < 3) { sayNow(e ? '👮 Officer: “All quiet tonight.”' : '👮 경찰관: "오늘 밤은 조용해요."', 3); return; }
    cps.sort((a, b) => a.a - b.a); pat = { d, cps, notes: [], t0: m }; cps.forEach((c, i) => sceneBuild(c, i)); patHots(true);
    const h = '<h3>👮 ' + (e ? 'Night patrol' : '밤 순찰') + '</h3><div class="ng-card">' + (e ? 'Officer: “At night we walk around the town and look for anything unsafe. Three stops tonight. Look carefully at each place and decide what to do.”' : '경찰관: "밤에는 마을을 돌며 위험한 곳이 없는지 살펴요. 오늘은 세 곳이에요. 가서 잘 보고 무엇을 할지 정해 줘요."') + '</div><div class="sm">' + (e ? 'Finish before 23:30.' : '밤 11시 반 전에 마쳐요.') + '</div><div class="row"><button data-a="go">' + (e ? 'Let’s go' : '같이 가요') + '</button></div>';
    const P = A.openP(h, false, 'night'); P.onclick = ev => { if (!ev.target.closest('button')) return; A.closeP(); const c = pat.cps[0]; A.guide([c.x, c.z], { icon: '👮', name: e ? 'patrol point' : '순찰 자리' }); }; log('patrol ' + kinds.join(',')); }
  const NUM = (d, i) => String(10 + ((d * 7 + i * 13) % 80)) + '-' + String(1 + ((d * 3 + i * 5) % 20)).padStart(2, '0');
  function sceneBuild(c, i) { const R = c.R, y = A.ty(c.x, c.z), ry = Math.atan2(c.nx, c.nz), P = (s, f) => [c.x + c.tx * s + c.nx * f, c.z + c.tz * s + c.nz * f];
    if (c.k === 'lamp') { c.bad = (R() * 3) | 0; c.num = [0, 1, 2].map(j => NUM(pat.d, i * 3 + j)); c.obj = [-4.5, 0, 4.5].map(s => { const [x, z] = P(s, 0.6); return { x, z }; }); }
    else if (c.k === 'kid') { c.col = (R() * 4) | 0; const [x, z] = P(1.2, 0); c.obj = [{ x, z }]; c.st = 0; }
    else if (c.k === 'bike') { c.bad = R() < 0.5 ? 0 : 1; c.obj = [-2.2, 2.2].map(s => { const [x, z] = P(s, 0.8); return { x, z }; }); c.rack = P(0, -2.4); c.moved = false; }
    else if (c.k === 'bag') { const [x, z] = P(0, -0.8); c.obj = [{ x, z }]; c.gone = false; }
    scenePaint(c, i); }
  function scenePaint(c, i) { const y = A.ty(c.x, c.z), ry = Math.atan2(c.nx, c.nz), rt = Math.atan2(c.tx, c.tz), P = (s, f) => [c.x + c.tx * s + c.nx * f, c.z + c.tz * s + c.nz * f];
    group('pc' + i, put => {
      if (c.k === 'lamp') c.obj.forEach((o, j) => { const yy = A.ty(o.x, o.z); put('c', o.x, yy, o.z, 0.07, 3.4, 0, 0x4a4f58); put('b', o.x, yy + 1.5, o.z, 0.26, 0.16, 0.04, 0xf6f4ee, 0, ry); put('s', o.x + c.nx * 0.5, yy + 3.35, o.z + c.nz * 0.5, 0.15, 0.8, 0, j === c.bad && !c.fixed ? 0x5a5f68 : 0xfff1c0, j === c.bad && !c.fixed ? 0 : 1); put('b', o.x + c.nx * 0.25, yy + 3.42, o.z + c.nz * 0.25, 0.06, 0.06, 0.6, 0x4a4f58, 0, ry); });
      if (c.k === 'kid') { const o = c.obj[0], yy = A.ty(o.x, o.z); if (!c.gone) fig(put, o.x, yy, o.z, ry, { s: 0.68, sh: KIDC[c.col][1], pa: 0x3b4a5c, hr: 0x2a2220 }); const [bx, bz] = P(2.6, -0.4); put('b', bx, A.ty(bx, bz), bz, 1.4, 0.45, 0.45, 0x8a6a4a, 0, rt); }
      if (c.k === 'bike') { const [sx, sz] = P(0, 0.8); put('b', sx, y + 0.02, sz, 0.32, 0.03, 9, 0xf2c230, 0, rt); for (let k = -4; k <= 4; k++) { const [qx, qz] = P(k, 0.8); put('b', qx, y + 0.05, qz, 0.24, 0.02, 0.05, 0xd8a820, 0, rt); }
        { const [rx, rz] = c.rack; put('b', rx, y, rz, 3.2, 0.7, 0.08, 0x8a8f98, 0, rt); } c.obj.forEach((o, j) => { const on = j === c.bad && !c.moved, [x, z] = on ? [o.x, o.z] : [c.rack[0] + c.tx * (j ? 0.8 : -0.8) - c.nx * 0.3, c.rack[1] + c.tz * (j ? 0.8 : -0.8) - c.nz * 0.3], yy = A.ty(x, z); bike(put, x, yy, z, rt, j ? 0x3d74c9 : 0xe0453a); }); }
      if (c.k === 'bag') { const o = c.obj[0], yy = A.ty(o.x, o.z); put('b', o.x, yy, o.z, 1.5, 0.45, 0.45, 0x8a6a4a, 0, rt); if (!c.gone) put('b', o.x + c.tx * 0.3, yy + 0.45, o.z + c.tz * 0.3, 0.34, 0.4, 0.2, 0x8a5bd1, 0, rt); }
    }); G['pc' + i].visible = true; }
  function bike(put, x, y, z, ry, col) { const c = Math.cos(ry), n = Math.sin(ry); for (const s of [-0.5, 0.5]) put('c16', x + n * s, y + 0.33, z + c * s, 0.33, 0.05, 0, 0x2b313a, 0, ry, Math.PI / 2); put('b', x, y + 0.5, z, 0.05, 0.05, 1.0, col, 0, ry); put('b', x + n * 0.1, y + 0.7, z + c * 0.1, 0.05, 0.05, 0.7, col, 0, ry); put('b', x - n * 0.3, y + 0.78, z - c * 0.3, 0.14, 0.05, 0.24, 0x2b313a, 0, ry); put('b', x + n * 0.45, y + 0.95, z + c * 0.45, 0.5, 0.04, 0.04, 0x2b313a, 0, ry); }
  function patObj(i, j) { const e = en(), c = pat.cps[i]; if (c.done) { sayNow(e ? '👮 This spot is done. On to the next!' : '👮 여기는 끝났어요. 다음 곳으로!', 2.5); return; }
    const one = (h, btns, cb) => { const P = A.openP(h + '<div class="ng-ch">' + btns.map((t, k) => '<button data-k="' + k + '">' + esc(L(t)) + '</button>').join('') + '</div><div class="ng-m"></div>', false, 'night'); P.onclick = ev => { const b = ev.target.closest('button'); if (b) cb(+b.dataset.k, P); }; };
    if (c.k === 'lamp') { one('<h3>💡 ' + (e ? 'Street lamp ' : '가로등 ') + c.num[j] + '</h3><div class="sm">' + (e ? 'Every street lamp has a number plate. What should we do with this one?' : '가로등마다 번호판이 붙어 있어요. 이 가로등은 어떻게 할까요?') + '</div>', [T2('번호를 적어 고장 신고해요', 'Write down the number and report it'), T2('괜찮아요. 다음으로', 'It’s fine. Move on')], (k, P) => {
        if (k === 0 && j === c.bad) { c.done = true; c.fixed = false; pat.notes.push(T2('꺼진 가로등 ' + c.num[j] + ' 신고', 'Reported dark lamp ' + c.num[j])); A.closeP(); sfx('ding'); sayNow(e ? '👮 “Good eyes! With the number, the repair team knows exactly which lamp.”' : '👮 "잘 봤어요! 번호를 알려 주면 고치는 분들이 어느 가로등인지 바로 알아요."', 4); S().pat.fixed.push({ d: pat.d + 1, num: c.num[j] }); mark(); patNext(); }
        else if (k === 0) P.querySelector('.ng-m').textContent = e ? 'This lamp is shining fine. Look for the dark one.' : '이 가로등은 잘 켜져 있어요. 꺼진 것을 찾아봐요.';
        else if (j === c.bad) P.querySelector('.ng-m').textContent = e ? 'Look at its bulb again. Is it lit?' : '등을 다시 올려다봐요. 불이 켜져 있어요?'; else A.closeP(); }); return; }
    if (c.k === 'kid') { if (c.st === 0) { A.bubble({ x: c.obj[0].x, y: A.ty(c.obj[0].x, c.obj[0].z) - 0.4, z: c.obj[0].z, sc: 0.75 }, e ? 'I can’t find my mum…' : '엄마가 안 보여요…');
        one('<h3>🧒 ' + (e ? 'A child alone at night' : '밤에 혼자 있는 아이') + '</h3><div class="sm">' + (e ? 'Child: “I came out with my mum and now I can’t see her.” What do we do?' : '아이: "엄마랑 나왔는데 엄마가 안 보여요." 어떻게 할까요?') + '</div>', [T2('엄마 찾으러 같이 멀리 가 봐요', 'Go far away together to look for her'), T2('여기서 같이 기다리고 경찰관에게 알려요', 'Wait here together and tell the officer'), T2('혼자 집에 가 보라고 해요', 'Tell the child to walk home alone')], (k, P) => {
          if (k !== 1) { P.querySelector('.ng-m').textContent = e ? 'If you move around, the parent who comes back to look may miss you. Staying put and telling the police is faster.' : '여기저기 움직이면 되돌아와 찾는 엄마와 엇갈려요. 그 자리에서 기다리며 경찰에 알리는 게 더 빨라요.'; return; }
          c.st = 1; A.closeP(); sayNow(e ? '👮 “Thank you. Now tell me what the child looks like — what colour is the shirt?”' : '👮 "고마워요. 이제 아이 모습을 알려 줘요. 윗옷이 무슨 색이었어요?"', 4); setTimeout(() => { if (!dead && pat && !c.done) patObj(i, 0); }, 1600); }); return; }
      one('<h3>📻 ' + (e ? 'Telling the officer' : '경찰관에게 알리기') + '</h3><div class="sm">' + (e ? 'What colour is the child’s shirt? (look if you are not sure)' : '아이 윗옷은 무슨 색이에요? (모르면 다시 보고 와요)') + '</div>', KIDC.map(q => q[2]), (k, P) => {
        if (k !== c.col) { P.querySelector('.ng-m').textContent = e ? 'Hmm, go and look at the child again.' : '음, 아이를 다시 보고 와요.'; return; } c.done = true; pat.notes.push(T2('길 잃은 어린이 — 보호자에게 연락', 'Lost child — parent contacted')); A.closeP(); sfx('done');
        sayNow(e ? '👮 “Got it. Her mum was nearby and is on her way.”' : '👮 "알았어요. 엄마가 근처에 있어서 오고 있대요."', 4); setTimeout(() => { if (!dead && pat) { c.gone = true; scenePaint(c, i); } }, 5000); patNext(); }); return; }
    if (c.k === 'bike') { one('<h3>🚲 ' + (e ? 'A parked bike' : '세워 둔 자전거') + '</h3><div class="sm">' + (e ? 'Look where this bike is standing. What should we do?' : '이 자전거가 어디에 서 있는지 봐요. 어떻게 할까요?') + '</div>', [T2('자전거 보관대로 옮겨 세워요', 'Move it to the bike rack'), T2('그대로 둬요', 'Leave it')], (k, P) => {
        const bad = j === c.bad && !c.moved; if (k === 0 && bad) { c.moved = true; c.done = true; pat.notes.push(T2('점자블록 위 자전거 옮김', 'Moved a bike off the tactile paving')); A.closeP(); scenePaint(c, i); sfx('ding'); sayNow(e ? '👮 “Yes! The yellow bumpy strip guides people who can’t see well. Things left on it can trip them.”' : '👮 "맞아요! 노란 울퉁불퉁한 길(점자블록)은 앞이 잘 안 보이는 사람이 따라 걷는 길이에요. 위에 물건이 있으면 부딪혀요."', 5); patNext(); }
        else if (k === 0) P.querySelector('.ng-m').textContent = e ? 'This one is already in the rack.' : '이건 이미 보관대에 있어요.'; else if (bad) P.querySelector('.ng-m').textContent = e ? 'Look at the ground under the wheels.' : '바퀴 밑 바닥을 봐요.'; else A.closeP(); }); return; }
    if (c.k === 'bag') { one('<h3>🎒 ' + (e ? 'A bag left on a bench' : '벤치에 두고 간 가방') + '</h3><div class="sm">' + (e ? 'Someone left a bag. What do we do?' : '누군가 가방을 두고 갔어요. 어떻게 할까요?') + '</div>', [T2('열어서 쓸 만한 걸 챙겨요', 'Open it and keep what’s useful'), T2('경찰서에 맡겨 주인을 찾아 줘요', 'Take it to the police so the owner can get it back'), T2('못 본 척 그냥 가요', 'Pretend not to see it')], (k, P) => {
        if (k !== 1) { P.querySelector('.ng-m').textContent = k === 0 ? (e ? 'Other people’s things are not ours to open or keep.' : '남의 물건은 함부로 열거나 가지면 안 돼요.') : (e ? 'The owner may be worried. Is there a better way?' : '주인이 걱정하고 있을 거예요. 더 좋은 방법이 있을까요?'); return; }
        c.gone = true; c.done = true; pat.notes.push(T2('두고 간 가방 경찰서에 맡김', 'Bag handed in to the police')); A.closeP(); scenePaint(c, i); sfx('ding'); sayNow(e ? '👮 “Things found and handed in to the police are kept so the owner can find them.”' : '👮 "주운 물건을 경찰서에 맡기면 잘 보관해서 주인을 찾아 줘요."', 4); patNext(); }); }
  }
  function patNext() { const e = en(), c = pat && pat.cps.find(q => !q.done); if (c) { A.guide([c.x, c.z], { icon: '👮', name: e ? 'patrol point' : '순찰 자리' }); say(e ? '👮 Next stop — follow the red line' : '👮 다음 순찰 자리 — 빨간 선을 따라가요', 2.5); return; } const o = SITE.pol.o; A.guide([o.x, o.z], { icon: '👮', name: e ? 'police station' : '경찰서' }); say(e ? '👮 All three done. Back to the station to write the log!' : '👮 세 곳 다 했어요. 경찰서로 돌아가 순찰 일지를 써요!', 3.5); }
  function patEnd(late) { const e = en(), st = S().pat, d = day(); if (!pat) return; const n = pat.cps.filter(c => c.done).length; A.guideOff();
    if (n) { st.d = d; st.n = (st.n | 0) + 1; mark(); A.skUp('explore', n, 'night:patrol'); if (n >= 3) { A.tev('night'); if (A.stamp('🌙')) sayNow(e ? '🌙 Night patrol stamp!' : '🌙 밤 순찰 도장 쾅!', 2.5); } A.rec('night', { k: 'patrol', n }); }
    const h = '<h3>📒 ' + (e ? 'Patrol log' : '순찰 일지') + '</h3><div class="ng-log">' + (pat.notes.length ? pat.notes.map(q => '· ' + esc(L(q))).join('<br>') : (e ? 'Nothing written.' : '적은 것이 없어요.')) + '</div><div class="sm">' + (late ? (e ? 'It got late, so we stopped here.' : '밤이 늦어 여기까지 했어요.') : (e ? 'Officer: “Thanks to you, the town is a little safer tonight.”' : '경찰관: "덕분에 오늘 밤 마을이 조금 더 안전해졌어요."')) + '</div><div class="row"><button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P = A.openP(h, false, 'night'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; for (let i = 0; i < 3; i++) drop('pc' + i); patHots(false); pat = null; log('patrol end ' + n); }
  /* 순찰 자리 E = 이 모듈이 따로 둠(마을 E 목록 ENTH 밖 · 순찰이 끝나면 지움) */
  function patHots(on) { for (const h of PH) h.remove(); PH = []; if (!on || !pat) return; const e = en(); pat.cps.forEach((c, i) => c.obj.forEach((o, j) => PH.push(map.interact.add({ kind: 'game', x: o.x, z: o.z, y: gy(o.x, o.z), r: c.k === 'lamp' ? 1.3 : 1.5, label: c.k === 'lamp' ? '💡 ' + (e ? 'Check this lamp' : '가로등 살펴보기') : c.k === 'kid' ? '🧒 ' + (e ? 'Talk to the child' : '아이에게 말 걸기') : c.k === 'bike' ? '🚲 ' + (e ? 'Check this bike' : '자전거 살펴보기') : '🎒 ' + (e ? 'Check the bag' : '가방 살펴보기'), use: () => patObj(i, j) })))); }

  // ───────── E 자리 ─────────
  function entries(push) { if (dead || !A.on()) return; build(); const R = A.root(); if (R && R9 !== R) { for (const k in G) if (G[k].parent !== R) R.add(G[k]); R9 = R; } H = [];
    const add = (x, z, y, r, label, use, k) => { const h = map.interact.add({ kind: 'game', x, z, y: y ?? gy(x, z), r, label, use }); h.k9 = k; H.push(h); push(h); return h; }, e = en();
    const M = SITE.mkt; if (M && M.stall) { M.stall.forEach((s, i) => add(s.ex, s.ez, null, 1.6, '🏮 ' + (e ? 'Read the stall sign' : '노점 판 읽기'), () => mktCard(i), 'mkt')); add(M.nb.x, M.nb.z, null, 1.8, '🙋 ' + (e ? 'Neighbour at the night market' : '야시장 이웃'), () => mktNb(), 'mkt'); add(M.board.x, M.board.z, null, 1.6, '🏮 ' + (e ? 'Night market notice' : '야시장 안내판'), () => sayNow(e ? '🏮 Night market: 18:00–23:00. Closed on rainy days.' : '🏮 야시장은 저녁 6시부터 밤 11시까지 열려요. 비 오는 날은 쉬어요.', 4), 'mday'); }
    if (SITE.fish) { SITE.fish.forEach((o, i) => add(o.x, o.z, o.y, 1.5, '🎣 ' + (e ? (o.deep ? 'Night fishing — pier end' : 'Night fishing — shore') : (o.deep ? '밤 낚시 — 부두 끝' : '밤 낚시 — 물가')), () => fishCast(i), 'fish')); const o = SITE.fish[0]; add(o.x - Math.cos(o.sa) * 2.2, o.z - Math.sin(o.sa) * 2.2, null, 1.6, '🦑 ' + (e ? 'Count the lights at sea' : '바다 불빛 세기'), () => seaView(), 'sea'); }
    for (const sp of SITE.stars) add(sp.x, sp.z, sp.y, 2.4, '🌌 ' + (e ? 'Find north by the stars' : '별로 북쪽 찾기'), () => starUse(sp), 'star');
    if (SITE.pol && SITE.pol.o && SITE.pol.cand.length >= 3) { const o = SITE.pol.o; add(o.x + Math.cos(o.ry) * 1.0, o.z - Math.sin(o.ry) * 1.0, null, 1.8, '👮 ' + (e ? 'Join the night patrol' : '밤 순찰 같이 하기'), () => patStart(), 'pat'); }
    if (SITE.hos && SITE.hos.o) { const o = SITE.hos.o; add(o.x - Math.cos(o.ry) * 1.6, o.z + Math.sin(o.ry) * 1.6, null, 1.6, '🚑 ' + (e ? 'Emergency room' : '응급실'), () => sayNow(e ? '🚑 The emergency room of a big hospital stays open day and night. Doctors, nurses and paramedics work through the night here.' : '🚑 큰 병원 응급실은 밤낮없이 열려요. 의사·간호사·구급대원이 밤새 일해요. 갑자기 크게 다치거나 아프면 어른과 함께 와요.', 6), 'late'); }
    if (SITE.cv && SITE.cv.o) { const o = SITE.cv.o; add(o.x + Math.cos(o.ry) * 1.2, o.z - Math.sin(o.ry) * 1.2, null, 1.5, '🏪 ' + (e ? 'Night clerk' : '밤 점원'), () => sayNow(e ? '🏪 Clerk: “We’re open 24 hours. At night I stock the shelves for tomorrow.”' : '🏪 점원: "여기는 24시간 열어요. 밤에는 내일 팔 물건을 채워요."', 4), 'late'); }
    if (SITE.bk && SITE.bk.o) { const o = SITE.bk.o; add(o.x + Math.cos(o.ry) * 1.0, o.z - Math.sin(o.ry) * 1.0, null, 1.5, '🍞 ' + (e ? 'Baker' : '제빵사'), () => sayNow(e ? '🍞 Baker: “I started baking before dawn. The shop opens at 7, with bread fresh from the oven.”' : '🍞 제빵사: "해 뜨기 전부터 반죽을 구웠어요. 7시에 문을 열면 갓 구운 빵이 나와요."', 4), 'bake'); }
    if (SITE.auc) add(SITE.auc.x + SITE.auc.fx * 3.4, SITE.auc.z + SITE.auc.fz * 3.4, null, 2.0, '🔔 ' + (e ? 'Watch the morning fish auction' : '아침 경매 구경하기'), () => aucStart(), 'auc');
    hotSec(min()); }
  function hotSec(m) { const k9 = { mkt: open('mkt', m) && !wet(), mday: !(open('mkt', m) && !wet()), fish: open('fish', m), sea: m >= NHRS.sea[0], star: m >= NHRS.star[0] && A.wx() === 'clear', pat: m >= 1200 && m < NHRS.patrol[1], late: m >= NHRS.late[0] || m < 390, bake: open('bake', m), auc: open('auction', m) };
    for (const h of H) { const off = !k9[h.k9]; if (h.hot.off !== off) h.hot.off = off; } }

  // ───────── 1초 칸 ─────────
  function sec() { if (dead) return; if (!A.on()) { for (const k in G) if (G[k].visible) G[k].visible = false; if (star && star.on) { star.on = false; star.pts.visible = false; } aimOff(); return; } if (!SITE) return;
    const m = min(), d = day(), w9 = wet(), st = S();
    if (SITE.mkt && mkt && mkt.d !== d) { mkt = mktNight(); paintMkt(); } if (SITE.fish && (!fishP || fishP.d !== d)) buildFish();
    const V = { mkt: open('mkt', m) && !w9, mktDay: !(open('mkt', m) && !w9) && m >= 360, late: m >= NHRS.late[0] || m < 390, bake: open('bake', m), auc: open('auction', m), fish: true, fishLit: m >= 1140 || m < 360, boats: (m >= NHRS.sea[0] || m < 240) && boatsNow() > 0, aucSign: !!G.aucSign && m >= 510 && m < 1260 };
    let vk = ''; for (const k in G) { const v = k.startsWith('pc') ? !!pat : !!V[k]; if (G[k].visible !== v) G[k].visible = v; vk += v ? 1 : 0; } if (vk !== vis9) { vis9 = vk; log('vis ' + vk + ' @' + hm(m)); }
    hotSec(m); colsMkt(V.mkt); starSec(m); if (aim && (dist(aim.sp.x, aim.sp.z) > 8 || m < 1140 || A.wx() !== 'clear')) aimOff(); aucPaint();
    if (pat && (m >= NHRS.patrol[1] || pat.d !== d)) patEnd(true);
    lifeSec(m, w9);
    if (st.said !== d && m >= 1075 && m < 1200 && !A.busy()) { st.said = d; mark(); const L9 = []; if (SITE.mkt && !w9) L9.push(en() ? 'night market 18–23' : '야시장 18~23시'); if (SITE.fish) L9.push(en() ? 'night fishing' : '밤 낚시'); if (SITE.fish && boatsNow()) L9.push(en() ? 'squid-boat lights' : '오징어배 불빛'); if (A.wx() === 'clear') L9.push(en() ? 'stars' : '별'); if (SITE.pol && SITE.pol.o) L9.push(en() ? 'night patrol from 20:30' : '밤 순찰 20:30~');
      if (L9.length) say((en() ? '🌙 Open tonight: ' : '🌙 오늘 밤 열리는 것: ') + L9.join(' · '), 6); }
    if (st.said6 !== d && m >= 362 && m < 500 && !A.busy()) { st.said6 = d; mark(); const fx = st.pat.fixed.filter(q => q.d === d); if (fx.length) { say(en() ? '💡 The lamp you reported last night (' + fx.map(q => q.num).join(', ') + ') has been fixed.' : '💡 어젯밤 신고한 가로등(' + fx.map(q => q.num).join(', ') + ')을 고쳤어요.', 5); st.pat.fixed = st.pat.fixed.filter(q => q.d > d); }
      else if (SITE.auc) say(en() ? '🔔 Fish auction at the fish market until 08:30' : '🔔 수산물 시장 아침 경매 — 8시 반까지', 4); } }
  /* ② 길 사람: 때·날씨마다 거리에 보이는 사람 몫(LIFE pvF) · 저녁에 모이는 곳(야시장·강변 쉼터 — LIFE eveHubs) — 사람 수는 그대로(보이는 몫만) */
  function pedF(m, w9) { if (m >= 375 && m < 1020) return -1; if (m < 375) return w9 ? 0.15 : 0.35; if (m < 1140) return w9 ? 0.55 : 0.9; if (m < 1260) return w9 ? 0.18 : 0.72; if (m < 1380) return w9 ? 0.08 : 0.45; return w9 ? 0.05 : 0.15; }
  function lifeSec(m, w9) { const Lf = A.life && A.life(); if (!Lf) return; const f = pedF(m, w9); if (Math.abs(f - pv9) > 0.005 && Lf.pvF) { pv9 = f; Lf.pvF(f); }
    const hubs = []; if (!w9 && SITE.mkt && open('mkt', m)) hubs.push({ k: 'nmkt', nm: T2('야시장', 'the night market'), x: SITE.mkt.x, z: SITE.mkt.z }); if (!w9 && m >= 1110 && m < 1290) for (const p of PL()) { if (/산책|쉼터|공원|둔치|강변/.test(p.name || '') && !A.inSchool(p.x, p.z) && hubs.length < 3) hubs.push({ k: 'neve', nm: T2(p.name, p.en || p.name), x: p.x, z: p.z }); }
    const key = hubs.map(q => q.k + Math.round(q.x)).join(','); if (key !== hub9 && Lf.eveHubs) { hub9 = key; Lf.eveHubs(hubs); log('hubs ' + key); } }
  function tick(dt) { if (dead) return; if ((acc += dt) >= 1) { acc = 0; try { sec(); } catch (e) { console.warn('[밤] sec', e); } } }

  // ───────── 하루 계획(town_day.js) · 오늘 할 일(taskCtx) ─────────
  function dayRows(d) { if (!SITE) return []; const out = [], e = en(), w9 = wet(), pp = (icon, name, at) => (at ? { icon, name, door: [at[0], at[1]] } : null);
    if (SITE.auc) out.push({ m: 360, g: 'nauc', ic: '🔔', s: T2('아침 경매', 'Fish auction'), t: T2('수산물 시장 아침 경매(8:30까지)', 'Morning fish auction (until 8:30)'), p: pp('🔔', SITE.auc.p.name, [SITE.auc.x, SITE.auc.z]) });
    if (SITE.mkt && !w9) out.push({ m: 1080, g: 'nmkt', ic: '🏮', s: T2('야시장', 'Night market'), t: T2('야시장이 열려요(23:00까지)', 'The night market opens (until 23:00)'), p: pp('🏮', e ? 'night market' : '야시장', [SITE.mkt.x, SITE.mkt.z]) });
    if (SITE.fish) out.push({ m: 1140, g: 'nfish', ic: '🎣', s: T2('밤 낚시', 'Night fishing'), t: T2('부두에서 밤 낚시 · 7시 반부터 바다 불빛', 'Night fishing at the pier · lights at sea from 19:30'), p: pp('🎣', e ? 'pier' : '부두', [SITE.fish[0].x, SITE.fish[0].z]) });
    if (SITE.pol && SITE.pol.o) out.push({ m: 1230, g: 'npat', ic: '👮', s: T2('밤 순찰', 'Night patrol'), t: T2('경찰서에서 밤 순찰(23:30까지)', 'Night patrol from the police station (until 23:30)'), p: pp('👮', SITE.pol.p.name, [SITE.pol.o.x, SITE.pol.o.z]) });
    void d; return out; }
  function ctx(C) { if (!SITE) build(); const L9 = []; if (SITE.mkt) L9.push(T2('야시장 심부름', 'night-market errand')); if (SITE.pol && SITE.pol.o) L9.push(T2('밤 순찰', 'night patrol')); if (SITE.stars.length) L9.push(T2('별로 북쪽 찾기', 'find north by the stars')); if (SITE.fish) L9.push(T2('밤 낚시', 'night fishing'));
    if (!L9.length) return; const R = rng(hs('nt' + day())), q = L9[(R() * L9.length) | 0], a = q === L9[0] && SITE.mkt ? [SITE.mkt.x, SITE.mkt.z] : null, c = [a ? A.cell(a[0], a[1]) : '', 'night', '', L(q)]; if (a) c.at = [+a[0].toFixed(1), +a[1].toFixed(1)]; c.why = T2('저녁 6시가 넘으면 밤에만 열리는 곳이 열려요', 'After 18:00 the night-only places open'); c.why.soft = 1; C.night = c; }

  function dispose() { dead = true; aimOff(); patHots(false); colsMkt(false); for (const k of Object.keys(G)) drop(k); if (star) { map.remove(star.pts); star.geo.dispose(); star.mat.dispose(); star = null; } if (css) { css.remove(); css = null; } const Lf = A.life && A.life(); if (Lf) { if (Lf.pvF) Lf.pvF(-1); if (Lf.eveHubs) Lf.eveHubs([]); } }
  const r1 = v => Math.round(v * 10) / 10;
  return { entries, tick, dispose, dayRows, ctx, NHRS,
    info: () => ({ site: SITE ? { mkt: SITE.mkt && [r1(SITE.mkt.x), r1(SITE.mkt.z)], fish: SITE.fish && SITE.fish.map(o => [r1(o.x), r1(o.z), o.deep, o.lit]), auc: SITE.auc && [r1(SITE.auc.x), r1(SITE.auc.z), SITE.auc.shops.map(p => p.name)], stars: SITE.stars.map(s => [r1(s.x), r1(s.z), L(s.nm)]), pol: SITE.pol && SITE.pol.o && [r1(SITE.pol.o.x), r1(SITE.pol.o.z), SITE.pol.cand.length], hos: !!(SITE.hos && SITE.hos.o), cv: !!(SITE.cv && SITE.cv.o), bk: !!(SITE.bk && SITE.bk.o) } : null,
      ms: +msBuild.toFixed(1), vis: Object.fromEntries(Object.entries(G).map(([k, g]) => [k, g.visible])), hots: H.map(h => [h.k9, h.hot.label, !h.hot.off]), mkt: mkt && { d: mkt.d, kind: mkt.kind, stalls: mkt.stalls.slice(), seen: Object.keys(mkt.seen), done: mkt.done, req: !!mkt.req, got: mkt.got },
      fishP: fishP && { ...fishP }, star: star && { on: star.on, k: star.U.uK.value, dim: star.U.uDim.value, pol: STAR[0].D && { alt: r1(STAR[0].D.alt), az: r1(STAR[0].D.az) }, dub: STAR[1].D && { alt: r1(STAR[1].D.alt), az: r1(STAR[1].D.az) } }, aim: aim && { step: aim.step, tries: aim.tries }, pat: pat && { cps: pat.cps.map(c => ({ k: c.k, x: r1(c.x), z: r1(c.z), done: c.done, bad: c.bad, col: c.col, obj: c.obj.map(o => [r1(o.x), r1(o.z)]) })), notes: pat.notes.map(L) },
      auc: auc && { r: auc.r, lot: auc.lot && { b: auc.lot.b, win: auc.lot.win, st: auc.lot.st } }, S: JSON.parse(JSON.stringify(S())), pvF: pv9, hubs: hub9, log: DBG.slice() }),
    dbg: { camAz: () => camAz(), starDirs: () => STAR.map(q => [q[0], q.D && r1(q.D.alt), q.D && r1(q.D.az)]), rebuildDay: () => { mkt = mktNight(); paintMkt(); buildFish(); }, sec: () => sec(), patReset: () => { if (pat) { for (let i = 0; i < 3; i++) drop('pc' + i); pat = null; } S().pat.d = -1; }, aucReset: () => { S().auc.d = -1; S().auc.fin = 0; } } };
}
