// 🎮 우리 마을 게임 층(GAME-0 · 교사 10-16 주말 '상호작용만이 아니라 실제 게임처럼 · 인벤토리·경제·시간은 맡김 → 오픈월드 준비 · 전투 X · 최적화!!')
//   게임 상태 한 곳 S = 하루(day)·시각(min)·가방(bag)·돈(money)·도감(dex)·오늘 딴 자리(picked)·할 일(tasks) — 마을(town.js)은 이 상태를 읽고 쓰기만
//   저장 = 이 기기 localStorage(마을마다 한 칸 · 바뀐 뒤 2초에 한 번까지 · 마을을 나가거나 창을 닫을 때 한 번 더) · 서버 X(아이 기록이 밖으로 나가지 않음)
//   시계 = 게임 1분 = 0.7초(스타듀밸리와 같은 빠르기 · 06:00~24:00 = 12분 36초) · 창·놀이가 열린 동안 멈춤 · 24:00 = 졸려서 잠 → 다음 날 06:00(벌 없음)
//   매 프레임 일 = 시계 더하기 몇 줄(새 객체 X · 알림은 문자열 하나)
export const SAVE_V = 1;
export const SPM = 0.7;   // 게임 1분 = 0.7초
export const CAL_LEN = 7, CAL_SEQ = ['autumn', 'winter', 'spring', 'summer'];   // GAME-1d 달력: 한 계절 = 7일 · 첫 주 = 지금 모습 → 가을 → 겨울 → 봄 → 여름 → 가을 …
export const DAY_START = 6 * 60, DAY_END = 24 * 60;
// 하루 때(엔진 시간대 셋에 맞춤): 06~17 낮 · 17~19 노을 · 19~06 밤
export const phaseOf = m => (m < 6 * 60 || m >= 19 * 60) ? 'night' : m >= 17 * 60 ? 'sunset' : 'day';
export const PHASE_AT = { day: 9 * 60, sunset: 17 * 60, night: 19 * 60 };   // 바깥에서 시간대를 바꾸면 그 때의 첫 시각으로

// 물건 표 하나 — 가방 창·도감·장터·가게·요리가 모두 이 표를 봄 · [이름, English, 갈래, 파는 값(원), 나는 곳]
//   갈래: food 먹거리(일꾼 곁에서 거들고·따고·캐서) · cook 요리 재료(가게에서 삼) · treat 군것질(가게) · farm 일한 보람(팔지 않음) · stamp 도장
//   값 근거(GAME-3 · 흉내 scratchpad econ_sim.cjs · 스타듀밸리 1년 차 봄 비율): 보통 아이가 여러 곳을 돌면 하루(12.6분) 11~16천 원 · 첫 요리 재료(≈1천 원)는 4~6분 · 한 곳만 하면 하루 0.5~0.8천 원(일터는 하루 3판 — 여러 지역을 돌게)
//   나는 곳 = 지역 이름(장터 지역과 다르면 '멀리서 와서 반가워요' × 1.3 — 지역 간 교류 · 어느 지역이든 같은 규칙)
export const ITEMS = {
  '🍓': ['딸기', 'Strawberry', 'food', 100, '들'], '🥔': ['감자', 'Potato', 'food', 150, '들'], '🍚': ['쌀', 'Rice', 'food', 250, '들'], '🍐': ['배', 'Pear', 'food', 300, '들'], '🥬': ['배추', 'Cabbage', 'food', 300, '들'], '🥛': ['우유', 'Milk', 'food', 300, '들'],
  '🍄': ['버섯', 'Mushroom', 'food', 200, '산'], '🍯': ['꿀', 'Honey', 'food', 500, '산'], '🍃': ['산나물', 'Wild greens', 'food', 150, '산'],
  '🍂': ['마른 가지', 'Dry twigs', 'wild', 50, '산'], '🌰': ['솔방울', 'Pine cone', 'wild', 50, '산'], '⚪': ['조약돌', 'Pebble', 'wild', 50, '산'],   // RES-1 숲 바닥에서 주운 것(wild · 장터 값은 낮게 — 꾸러미·요리·선물에 쓰는 게 이득) · 솔방울 그림 글자가 없어 🌰(이름은 솔방울)
  '🧂': ['소금', 'Salt', 'food', 150, '바다'], '🐚': ['조개', 'Clam', 'food', 200, '바다'], '🌿': ['김', 'Laver', 'food', 250, '바다'], '🐟': ['물고기', 'Fish', 'food', 400, '바다'],
  '🥒': ['오이', 'Cucumber', 'food', 150, '강'], '🥕': ['당근', 'Carrot', 'food', 150, '들'], '🍅': ['방울토마토', 'Cherry tomato', 'food', 200, '들'], '🌽': ['옥수수', 'Corn', 'food', 200, '들'], '🍠': ['고구마', 'Sweet potato', 'food', 250, '들'], '🍞': ['빵', 'Bread', 'treat', 300, '시내'], '🍦': ['아이스크림', 'Ice cream', 'treat', 300, '관광'], '🥤': ['음료', 'Drink', 'treat', 0],
  '🌾': ['밀가루', 'Flour', 'cook', 0], '🥚': ['달걀', 'Egg', 'cook', 0], '🧈': ['버터', 'Butter', 'cook', 0], '🍁': ['시럽', 'Syrup', 'cook', 0],
  '🥞': ['팬케이크', 'Pancake', 'dish', 0], '🥘': ['버섯 볶음', 'Fried mushrooms', 'dish', 0], '🍮': ['푸딩', 'Pudding', 'dish', 0], '🍓🥞': ['딸기 팬케이크', 'Strawberry pancake', 'dish', 0], '🌑': ['탄 요리', 'Burnt food', 'dish', 0], '🍲': ['감자 배추국', 'Potato-cabbage soup', 'dish', 0], '🍙': ['주먹밥', 'Rice ball', 'dish', 0], '🍿': ['팝콘', 'Popcorn', 'dish', 0], '🥗': ['산나물 무침', 'Seasoned wild greens', 'dish', 0],
  '🍠♨': ['군고구마', 'Roasted sweet potato', 'dish', 0], '🥔♨': ['구운 감자', 'Roasted potato', 'dish', 0], '🌽♨': ['구운 옥수수', 'Roasted corn', 'dish', 0], '🍄♨': ['버섯구이', 'Grilled mushroom', 'dish', 0], '🐟♨': ['생선구이', 'Grilled fish', 'dish', 0], '🍞♨': ['토스트', 'Toast', 'dish', 0],   // LAWS-1 모닥불에 구운 것(town_laws.js)
  '🐟☀': ['말린 생선', 'Dried fish', 'dish', 0], '🍠☀': ['고구마 말랭이', 'Dried sweet potato', 'dish', 0], '🍄☀': ['말린 버섯', 'Dried mushroom', 'dish', 0], '🍃☀': ['묵나물', 'Dried wild greens', 'dish', 0], '🥛❄': ['우유 얼음', 'Milk ice', 'dish', 0], '🍓❄': ['언 딸기', 'Frozen strawberry', 'dish', 0], '🥤❄': ['살얼음 음료', 'Slushy drink', 'dish', 0],   // LAWS-1 햇볕에 말린 것 · 추위에 언 것
  '🌱': ['심은 모', 'Rice seedlings planted', 'farm', 0], '🌲': ['심은 나무', 'Saplings planted', 'farm', 0],
  '⛰': ['정상 도장', 'Summit stamp', 'stamp', 0], '🗼': ['등대 도장', 'Lighthouse stamp', 'stamp', 0], '👣': ['징검다리 도장', 'Stepping-stone stamp', 'stamp', 0], '📖': ['책 읽기 도장', 'Reading stamp', 'stamp', 0], '⛷': ['스키 도장', 'Ski stamp', 'stamp', 0], '🏅': ['요리사 도장', 'Cook stamp', 'stamp', 0], '🧺': ['꾸러미 도장', 'Bundle stamp', 'stamp', 0], '🔭': ['별 보기 도장', 'Stargazing stamp', 'stamp', 0], '⛄': ['눈사람 도장', 'Snowman stamp', 'stamp', 0], '🏰': ['모래성 도장', 'Sandcastle stamp', 'stamp', 0], '🏊': ['생존수영 도장', 'Survival-swimming stamp', 'stamp', 0], '🌬️': ['바닷바람 도장', 'Sea-breeze stamp', 'stamp', 0], '🌈': ['무지개 도장', 'Rainbow stamp', 'stamp', 0], '💫': ['반딧불이 도장', 'Firefly stamp', 'stamp', 0], '📜': ['이야기 도장', 'Story stamp', 'stamp', 0], '🏮': ['잔치 등불', 'Festival lantern', 'stamp', 0], '🔬': ['물 맑기 도장', 'Clean-stream stamp', 'stamp', 0], '🌀': ['물굽이 도장', 'River-bend stamp', 'stamp', 0], '🐸': ['논 생물 도장', 'Paddy-life stamp', 'stamp', 0], '💧': ['물꼬 도장', 'Paddy-gate stamp', 'stamp', 0],
  '🥇': ['고리 코스 금 도장', 'Ring course gold stamp', 'stamp', 0], '🥈': ['고리 코스 은 도장', 'Ring course silver stamp', 'stamp', 0], '🥉': ['고리 코스 동 도장', 'Ring course bronze stamp', 'stamp', 0],   // WAKE-1b 자전거 고리 코스(town_road.js · 메달마다 처음 한 번)
};
// 식당에서 먹는 것(가방에 넣지 않고 그 자리에서 · 도감 '먹어 본 음식')
export const DISHES = { '🍣': ['초밥 한 접시', 'Sushi plate'], '🍜': ['마라탕 한 그릇', 'Malatang bowl'], '🦐': ['해산물 한 접시', 'Seafood plate'], '🍱': ['밥 한 상', 'Set meal'] };
// 가게(아이가 놓은 이름 있는 가게만 — 이름으로 갈래를 앎 · 없는 가게는 만들지 않음): [이름 규칙, 갈래, 여는 시각, 닫는 시각, 파는 것 [물건, 값, 먹기?]]
export const SHOPS = [
  [/편의점/, 'conv', 0, 24, [['🥚', 250], ['🥛', 400], ['🌾', 600], ['🍁', 500], ['🥤', 1200]]],
  [/마트|슈퍼|모두의 상점|식품|도시 상점/, 'grocery', 8, 22, [['🥚', 200], ['🥛', 350], ['🌾', 500], ['🧈', 500], ['🍁', 400]]],
  [/빵/, 'bakery', 7, 20, [['🍞', 1200]]],
  [/아이스크림/, 'icecream', 10, 21, [['🍦', 1000]]],
  [/초밥/, 'sushi', 11, 21, [['🍣', 4000, 1]]],
  [/마라탕/, 'mala', 11, 21, [['🍜', 4000, 1]]],
  [/해산물 식당/, 'seafood', 11, 21, [['🦐', 4500, 1]]],
  [/카페/, 'cafe', 8, 21, [['🥤', 1500], ['🍞', 1300]]],
];
// 요리(C1 · 패들렛 56·63·64·66 🙋 유은·시아 — 재료 모으기 → 레시피북 → 불 조절 → 나눠 주기 · 탄 요리는 '윽!') · 독버섯은 재료가 아님(교사 10-16 (가) 못 땀)
//   재료 값 ≈ 1천 원(흉내: 보통 아이 첫 요리 4~6분) · 버섯 볶음 = 딴 버섯 둘 + 버터(산에서 딴 것을 쓰는 요리)
export const RECIPES = [['🥞', '팬케이크', 'Pancake', { '🌾': 1, '🥚': 1, '🥛': 1 }], ['🥘', '버섯 볶음', 'Fried mushrooms', { '🍄': 2, '🧈': 1 }], ['🍮', '푸딩', 'Pudding', { '🥚': 2, '🥛': 1, '🍁': 1 }], ['🍓🥞', '딸기 팬케이크', 'Strawberry pancake', { '🌾': 1, '🥚': 1, '🥛': 1, '🍓': 3 }],
  ['🍲', '감자 배추국', 'Potato-cabbage soup', { '🥔': 2, '🥬': 1, '🧂': 1 }, 'summer'], ['🍙', '주먹밥', 'Rice ball', { '🍚': 2, '🧂': 1 }, 'autumn'], ['🍿', '팝콘', 'Popcorn', { '🌽': 2, '🧈': 1 }, 'garden'], ['🥗', '산나물 무침', 'Seasoned wild greens', { '🍃': 2, '🧂': 1 }, 'forest']];   // 다섯째 = 그 꾸러미를 채우면 생기는 요리법(GAME-7)
// 오늘의 할 일(GAME-5 · 스타듀 '도움 요청 게시판' 결): 날마다 셋 = 벌기(일터·버섯) 하나 + 나누기(장터·가게·요리) 하나 + 둘러보기(정상·버스·배·징검다리·책) 하나 · 이 마을에 있는 것만(자리 = 그곳 칸)
//   보상 = 돈(하나 300~800원 · 셋 다 하면 +500원 — 흉내 하루 벌이의 5~15%라 '덤') · 벌·기한 없음(다 못 해도 다음 날 새 셋)
export const TASKS = {
  work: ['{e} {n} 같이 하기', 'Help: {n}', 1, 400], mush: ['🍄 버섯 2개 따기', '🍄 Pick 2 mushrooms', 2, 300], farm: ['🌱 학교 텃밭 돌보기 (심기·물 주기·거두기)', '🌱 Tend the school garden (plant · water · harvest)', 1, 300],
  sell: ['🛒 장터에서 물건 3개 팔기', '🛒 Sell 3 things at a market', 3, 300], away: ['✨ 멀리서 온 물건을 장터에 팔기', '✨ Sell something from far away', 1, 400], buy: ['🥚 마트에서 요리 재료 사기', '🥚 Buy a cooking ingredient', 1, 200], cook: ['🍳 아이 집 부엌에서 요리 하나 만들기', '🍳 Cook a dish in a kitchen', 1, 600], share: ['🍽 이웃에게 요리 나눠 주기', '🍽 Share a dish with a neighbour', 1, 500], eat: ['🍜 식당에서 밥 먹어 보기', '🍜 Eat at a restaurant', 1, 300],
  summit: ['⛰ 산꼭대기 도장 찍기', '⛰ Get the summit stamp', 1, 800], bus: ['🚌 버스 타고 다른 정류장 가기', '🚌 Ride a bus to another stop', 1, 300], boat: ['⛵ 배 타고 바다 나가 보기', '⛵ Take the boat out', 1, 500], stones: ['👣 징검다리 건너기', '👣 Cross the stepping stones', 1, 300], book: ['📖 도서관에서 책 읽기', '📖 Read at the library', 1, 300], stars: ['🔭 밤(19시 뒤)에 산꼭대기에서 별 보기', '🔭 Stargaze on the summit at night (after 19:00)', 1, 500],
  bundle: ['🧺 계절 꾸러미에 물건 넣기 (I → 꾸러미)', '🧺 Put something in a bundle (I → Bundles)', 1, 300],
};
export const TASK_POOLS = [['work', 'mush', 'farm'], ['sell', 'away', 'buy', 'cook', 'share', 'eat', 'bundle'], ['summit', 'bus', 'boat', 'stones', 'book', 'stars']];
export const shopOf = name => { if (/동물 카페|키즈 카페|보드게임 카페|꼬리 용품|반려/.test(name || '')) return null;   /* 놀이 카페·반려 용품 = 파는 가게 아님(뒷걸음 정규식은 옛 아이폰 사파리에서 깨져 함수로) */ for (const S of SHOPS) if (S[0].test(name || '')) return S; return null; };
export const won = n => (n | 0).toLocaleString('ko-KR') + '원';
export const itemName = (e, en) => { const I = ITEMS[e]; return I ? (en ? I[1] : I[0]) : e; };

export function createGame(id) {
  const KEY = 'sm-town-game:' + id;
  const fresh = () => ({ v: SAVE_V, day: 1, min: 7 * 60, bag: {}, money: 0, earned: 0, dex: {}, ate: {}, cooked: {}, shared: 0, picked: {}, uses: {}, tasks: null, cells: {}, album: [], fridge: {}, hearts: {}, today: null, clock: true, cal: { d0: 1, on: true, s: 'now' }, bundles: {}, unlock: {}, farm: [], diary: [], wx: { auto: true }, bought: {}, res: {}, home: { v: 1, id: null, h: '', x: 0, z: 0, pots: [null, null], met: 0 }, yday: null });   /* HOME-1 우리 집(고른 집 · 해시 · 화분 둘 · 첫 만남) · yday = 어제 한 일(잠들 때 S.today를 남김) */   // bought = 가게에서 산 수(FIX-EC1 · 되팔기 값)
  let S = fresh();
  let raw9 = null; try { raw9 = localStorage.getItem(KEY); } catch (e) { /* 막힘 */ }
  try { const j = JSON.parse(raw9 || 'null'); if (j && j.v !== SAVE_V) throw 0; if (j && j.v === SAVE_V) { const F9 = fresh(), T9 = Object.assign(fresh(), j); for (const k of Object.keys(F9)) { const f = F9[k], t = T9[k]; if (f && typeof f === 'object' ? (!t || typeof t !== 'object' || Array.isArray(t) !== Array.isArray(f)) : typeof f === 'number' && !Number.isFinite(t)) T9[k] = f; }   /* FIX-CX5(코덱스 점검): 칸 모양이 틀린 저장(bag = null 등)을 먼저 바로잡고 나서 씀 — 예전엔 S에 먼저 넣고 오류가 나 깨진 채 남았음 */ S = T9; if (!(j.cal && j.cal.d0 >= 1)) S.cal = { d0: S.day, on: true, s: 'now' };   /* 달력 없던 저장 = 오늘부터 첫 주 */ for (const k of Object.keys(S.bag)) if (!(S.bag[k] > 0)) delete S.bag[k]; } } catch (e) { /* 저장 깨짐·판 번호 다름 = 새로 시작하되 옛 글은 따로 남김(SAVE-1 · 덮어써서 잃지 않게 · 되살리기 = sm-town-game-bak:<마을>) */ if (raw9) try { localStorage.setItem('sm-town-game-bak:' + id, raw9); } catch (e2) { /* 가득 참 */ } }
  if (!(S.min >= 0 && S.min < DAY_END)) S.min = 7 * 60;
  let dirty = false, since = 0, acc = 0, ph = phaseOf(S.min), on = null; const T0 = () => ({ earned: 0, got: {}, cells: 0, tasks: 0, cooked: 0, shared: 0, dex: 0, gift: 0, farmW: 0, sold: 0, rainW: 0 });   /* PHASE1 조각 2: 선물 · 물 준 칸 · 판 수 · 비 온 날 물 준 칸 */ if (!S.today || typeof S.today !== 'object') S.today = T0(); else for (const [k, v] of Object.entries(T0())) if (typeof S.today[k] !== typeof v) S.today[k] = v;   /* FIX-CX7(코덱스 10-18): today:{}처럼 빠진 칸 */   // 오늘 한 일(하루 마무리 · 잠들면 비움)
  const emit = (t) => { if (on) on(t); };
  const G = {
    S,
    on(fn) { on = fn; },
    mark() { dirty = true; },
    flush() { if (!dirty) return; dirty = false; since = 0; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 가득 참·막힘 — 놀이는 그대로 */ } },
    // 매 프레임: 저장 2초 상한 + 시계(paused = 창·놀이·실내 문 덮개 동안)
    tick(dt, paused) {
      since += dt; if (dirty && since >= 2) G.flush();
      if (!S.clock || paused) return;
      acc += dt; if (acc < SPM) return;
      while (acc >= SPM) { acc -= SPM; S.min++; }
      if (S.min % 10 === 0) { dirty = true; emit('clock'); }
      const p = phaseOf(S.min); if (p !== ph) { ph = p; emit('phase'); }
      if (S.min >= DAY_END) emit('midnight');
    },
    get phase() { return ph; },
    // 바깥(학교 시간 단추 등)에서 시간대를 바꾸면 시계도 그 때로
    syncPhase(k) { if (!PHASE_AT[k] || phaseOf(S.min) === k) return false; S.min = PHASE_AT[k]; ph = k; acc = 0; dirty = true; emit('clock'); return true; },
    // QUEST-3 기다리기(같은 날 앞으로만 · 낮 12시처럼 시간대 안의 한 시각): 지난 시각이면 그대로
    waitMin(m) { if (!(m > S.min && m < DAY_END)) return false; S.min = m; acc = 0; const p = phaseOf(S.min); dirty = true; emit('clock'); if (p !== ph) { ph = p; emit('phase'); } return true; },
    clockText(en) { const h = (S.min / 60) | 0, m = ((S.min % 60) / 10 | 0) * 10;   /* 10분 단위(스타듀처럼 — 칩 글이 1초마다 바뀌지 않게) */ return (en ? 'Day ' + S.day + ' ' : S.day + '일째 ') + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; },
    setClock(onoff) { S.clock = !!onoff; dirty = true; emit('clock'); },
    // 잠 = 다음 날 아침 · 오늘 딴 자리는 다시 자람 · 바로 저장
    sleep() { G.lastDay = { day: S.day, ...S.today }; S.yday = G.lastDay; S.today = T0(); S.day++; S.min = DAY_START; acc = 0; ph = phaseOf(S.min); S.picked = {}; S.uses = {}; S.tasks = null; dirty = true; G.flush(); emit('clock'); emit('phase'); emit('day'); },   // lastDay = 하루 마무리 창이 읽음
    seasonAt(d) { const c = S.cal; if (!c.on) return c.s || 'now'; const n = Math.floor((d - c.d0) / CAL_LEN); return n <= 0 ? 'now' : CAL_SEQ[(n - 1) % CAL_SEQ.length]; },   // GAME-1d 그날의 계절(손으로 고른 동안은 그 계절)
    season() { return G.seasonAt(S.day); }, calDay() { return ((S.day - S.cal.d0) % CAL_LEN + CAL_LEN) % CAL_LEN + 1; },
    setCal(on, s) { if (on) S.cal.on = true; else { S.cal.on = false; S.cal.s = s; } dirty = true; },
    lastDay: null, tally(k, n = 1) { if (!S.today) S.today = T0(); S.today[k] = (S.today[k] || 0) + n; dirty = true; },
    // 가방
    add(e, n = 1) { S.bag[e] = (S.bag[e] || 0) + n; const neu = G.found(e); if (S.today) S.today.got[e] = (S.today.got[e] || 0) + n; dirty = true; return neu; },
    // 도감 첫 기록(곳·때 = 놀이 쪽 stamp9 · town_dex.js 틀)
    stamp9: null, found(k) { if (S.dex[k] != null) return false; S.dex[k] = G.stamp9 ? G.stamp9() : S.day; if (S.today) S.today.dex++; dirty = true; return true; },
    take(e, n = 1) { if ((S.bag[e] || 0) < n) return false; S.bag[e] -= n; if (S.bag[e] <= 0) delete S.bag[e]; const B8 = S.bought; if (B8 && B8[e]) { const r = Math.max(0, Math.min(B8[e] - n, S.bag[e] || 0)); if (r) B8[e] = r; else delete B8[e]; } dirty = true; return true; },   /* FIX-EC1: 쓰면(요리·선물·꾸러미) 가게에서 산 것부터 — 장터는 따로 셈 */
    count: e => S.bag[e] || 0,
    // 오늘 딴 자리(버섯 등 — 다음 날 다시 자람)
    picked: k => S.picked[k] === S.day,
    pick(k) { S.picked[k] = S.day; dirty = true; },
    // 돈(GAME-3 · 빚·벌 없음 — 모자라면 못 살 뿐)
    earn(n) { n = Math.round(n); S.money += n; S.earned += n; if (S.today) S.today.earned += n; dirty = true; },
    spend(n) { if (S.money < n) return false; S.money -= n; dirty = true; return true; },
    // 가 본 칸(도감 · 처음이면 true)
    visit(c) { if (S.cells[c]) return false; S.cells[c] = S.day; if (S.today) S.today.cells++; dirty = true; return true; },
    // 이웃 마음(일꾼마다 점수 · ❤ = 3점마다 · 최대 5) — 올랐으면 새 ❤ 수를 돌려줌
    heart(k, n) { const H = S.hearts || (S.hearts = {}), a = Math.min(5, ((H[k] || 0) / 3) | 0); H[k] = Math.min(15, (H[k] || 0) + n); dirty = true; const b = Math.min(5, (H[k] / 3) | 0); return b > a ? b : 0; },
    hearts: k => Math.min(5, (((S.hearts || {})[k] || 0) / 3) | 0),
    // 하루에 몇 번(일터 3판 등 — 다음 날 다시)
    uses: k => S.uses[k] || 0,
    use(k) { S.uses[k] = (S.uses[k] || 0) + 1; dirty = true; return S.uses[k]; },
    ate(e) { const neu = !S.ate[e]; S.ate[e] = (S.ate[e] || 0) + 1; G.found('ate:' + e); dirty = true; return neu; },
    // 가게가 열렸나(시계 기준 · 시계를 멈춰도 그 시각 그대로)
    open: (h0, h1) => { const h = S.min / 60; return h0 === 0 && h1 === 24 ? true : h >= h0 && h < h1; },
    // 오늘의 할 일: ctx = { 할일id: [자리 칸, 일 갈래?, 이모지, 이름] } (이 마을에 있는 것만) · 하루 첫 부름에 셋을 고름(날짜 씨앗 · 1일째 = 가까운 일터 + 장터 팔기 + 버스)
    tasks(ctx, en) { if (S.tasks && S.tasks.day === S.day) return S.tasks.list; let r = (S.day * 2654435761 + 97) >>> 0; const rnd = () => (r = (r * 1103515245 + 12345) >>> 0) / 4294967296, list = [];
      TASK_POOLS.forEach((P, pi) => { const av = []; for (const id of P) { const c = ctx[id]; if (!c) continue; if (id === 'work') for (const w of c) av.push(['work', w]); else av.push([id, c]); } if (!av.length) return; const hot = av.filter(a => a[1] && a[1].why && !a[1].why.soft); let pick = av[(rnd() * av.length) | 0]; if (hot.length && rnd() < 0.8) pick = hot[(rnd() * hot.length) | 0];   /* BOARD-D: 그날 상황(장날·비·텃밭·맑은 밤·논 철)이 있는 줄을 먼저(다섯에 넷) */
        if (S.day === 1) { const want = ['work', 'sell', 'bus'][pi]; pick = av.find(a => a[0] === want) || av[0]; }
        const [id, c] = pick, T = TASKS[id], txt = (en ? T[1] : T[0]).replace('{e}', c[2] || '').replace('{n}', c[3] || ''); list.push({ id, why: c.why || null, ev: id === 'work' ? 'work:' + c[1] : id, t: txt, cell: c[0] || '', at: c.at || null, need: T[2], n: 0, rew: T[3], done: false });   /* at = 그 자리(🧭 길 안내 · GAME-5d) */ });
      S.tasks = { day: S.day, list, all: false }; dirty = true; return list; },
    // 한 일 알리기 → 이번에 끝난 할 일들(보상은 여기서 줌 · 셋 다 끝나면 덤)
    taskEv(ev, n = 1) { const T = S.tasks; if (!T || T.day !== S.day) return null; let out = null; for (const t of T.list) { if (t.done || t.ev !== ev) continue; t.n = Math.min(t.need, t.n + n); if (t.n >= t.need) { t.done = true; S.money += t.rew; S.earned += t.rew; S.tasksDone = (S.tasksDone || 0) + 1; if (S.today) { S.today.tasks++; S.today.earned += t.rew; } (out = out || []).push(t); } }
      if (out && !T.all && T.list.every(t => t.done)) { T.all = true; S.money += 500; S.earned += 500; out.all = true; } if (out) dirty = true; return out; },
    // 처음부터(가방·돈·도감·날짜 모두) — 가방 객체는 그대로 두고 비움(마을이 같은 객체를 들고 있음)
    reset() { const b = S.bag; for (const k of Object.keys(b)) delete b[k]; const f = fresh(); f.bag = b; for (const k of Object.keys(S)) delete S[k]; Object.assign(S, f); acc = 0; ph = phaseOf(S.min); dirty = true; G.flush(); emit('clock'); emit('phase'); },
  };
  return G;
}
