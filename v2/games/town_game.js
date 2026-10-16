// 🎮 우리 마을 게임 층(GAME-0 · 교사 10-16 주말 '상호작용만이 아니라 실제 게임처럼 · 인벤토리·경제·시간은 맡김 → 오픈월드 준비 · 전투 X · 최적화!!')
//   게임 상태 한 곳 S = 하루(day)·시각(min)·가방(bag)·돈(money)·도감(dex)·오늘 딴 자리(picked)·할 일(tasks) — 마을(town.js)은 이 상태를 읽고 쓰기만
//   저장 = 이 기기 localStorage(마을마다 한 칸 · 바뀐 뒤 2초에 한 번까지 · 마을을 나가거나 창을 닫을 때 한 번 더) · 서버 X(아이 기록이 밖으로 나가지 않음)
//   시계 = 게임 1분 = 0.7초(스타듀밸리와 같은 빠르기 · 06:00~24:00 = 12분 36초) · 창·놀이가 열린 동안 멈춤 · 24:00 = 졸려서 잠 → 다음 날 06:00(벌 없음)
//   매 프레임 일 = 시계 더하기 몇 줄(새 객체 X · 알림은 문자열 하나)
export const SAVE_V = 1;
export const SPM = 0.7;   // 게임 1분 = 0.7초
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
  '🍄': ['버섯', 'Mushroom', 'food', 200, '산'], '🍯': ['꿀', 'Honey', 'food', 500, '산'],
  '🧂': ['소금', 'Salt', 'food', 150, '바다'], '🐚': ['조개', 'Clam', 'food', 200, '바다'], '🌿': ['김', 'Laver', 'food', 250, '바다'], '🐟': ['물고기', 'Fish', 'food', 400, '바다'],
  '🥒': ['오이', 'Cucumber', 'food', 150, '강'], '🍞': ['빵', 'Bread', 'treat', 300, '시내'], '🍦': ['아이스크림', 'Ice cream', 'treat', 300, '관광'], '🥤': ['음료', 'Drink', 'treat', 0],
  '🌾': ['밀가루', 'Flour', 'cook', 0], '🥚': ['달걀', 'Egg', 'cook', 0], '🧈': ['버터', 'Butter', 'cook', 0], '🍁': ['시럽', 'Syrup', 'cook', 0],
  '🥞': ['팬케이크', 'Pancake', 'dish', 0], '🥘': ['버섯 볶음', 'Fried mushrooms', 'dish', 0], '🍮': ['푸딩', 'Pudding', 'dish', 0], '🍓🥞': ['딸기 팬케이크', 'Strawberry pancake', 'dish', 0], '🌑': ['탄 요리', 'Burnt food', 'dish', 0],
  '🌱': ['심은 모', 'Rice seedlings planted', 'farm', 0], '🌲': ['심은 나무', 'Saplings planted', 'farm', 0],
  '⛰': ['정상 도장', 'Summit stamp', 'stamp', 0], '🗼': ['등대 도장', 'Lighthouse stamp', 'stamp', 0], '👣': ['징검다리 도장', 'Stepping-stone stamp', 'stamp', 0], '📖': ['책 읽기 도장', 'Reading stamp', 'stamp', 0],
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
export const RECIPES = [['🥞', '팬케이크', 'Pancake', { '🌾': 1, '🥚': 1, '🥛': 1 }], ['🥘', '버섯 볶음', 'Fried mushrooms', { '🍄': 2, '🧈': 1 }], ['🍮', '푸딩', 'Pudding', { '🥚': 2, '🥛': 1, '🍁': 1 }], ['🍓🥞', '딸기 팬케이크', 'Strawberry pancake', { '🌾': 1, '🥚': 1, '🥛': 1, '🍓': 3 }]];
export const shopOf = name => { if (/동물 카페|키즈 카페|보드게임 카페|꼬리 용품|반려/.test(name || '')) return null;   /* 놀이 카페·반려 용품 = 파는 가게 아님(뒷걸음 정규식은 옛 아이폰 사파리에서 깨져 함수로) */ for (const S of SHOPS) if (S[0].test(name || '')) return S; return null; };
export const won = n => (n | 0).toLocaleString('ko-KR') + '원';
export const itemName = (e, en) => { const I = ITEMS[e]; return I ? (en ? I[1] : I[0]) : e; };

export function createGame(id) {
  const KEY = 'sm-town-game:' + id;
  const fresh = () => ({ v: SAVE_V, day: 1, min: 7 * 60, bag: {}, money: 0, earned: 0, dex: {}, ate: {}, cooked: {}, shared: 0, picked: {}, uses: {}, tasks: null, clock: true });
  let S = fresh();
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.v === SAVE_V) { S = Object.assign(fresh(), j); for (const k of Object.keys(S.bag)) if (!(S.bag[k] > 0)) delete S.bag[k]; } } catch (e) { /* 저장 막힘·깨짐 = 새로 시작 */ }
  if (!(S.min >= 0 && S.min < DAY_END)) S.min = 7 * 60;
  let dirty = false, since = 0, acc = 0, ph = phaseOf(S.min), on = null;
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
    clockText(en) { const h = (S.min / 60) | 0, m = ((S.min % 60) / 10 | 0) * 10;   /* 10분 단위(스타듀처럼 — 칩 글이 1초마다 바뀌지 않게) */ return (en ? 'Day ' + S.day + ' ' : S.day + '일째 ') + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; },
    setClock(onoff) { S.clock = !!onoff; dirty = true; emit('clock'); },
    // 잠 = 다음 날 아침 · 오늘 딴 자리는 다시 자람 · 바로 저장
    sleep() { S.day++; S.min = DAY_START; acc = 0; ph = phaseOf(S.min); S.picked = {}; S.uses = {}; S.tasks = null; dirty = true; G.flush(); emit('clock'); emit('phase'); emit('day'); },
    // 가방
    add(e, n = 1) { S.bag[e] = (S.bag[e] || 0) + n; const neu = !S.dex[e]; if (neu) S.dex[e] = S.day; dirty = true; return neu; },
    take(e, n = 1) { if ((S.bag[e] || 0) < n) return false; S.bag[e] -= n; if (S.bag[e] <= 0) delete S.bag[e]; dirty = true; return true; },
    count: e => S.bag[e] || 0,
    // 오늘 딴 자리(버섯 등 — 다음 날 다시 자람)
    picked: k => S.picked[k] === S.day,
    pick(k) { S.picked[k] = S.day; dirty = true; },
    // 돈(GAME-3 · 빚·벌 없음 — 모자라면 못 살 뿐)
    earn(n) { n = Math.round(n); S.money += n; S.earned += n; dirty = true; },
    spend(n) { if (S.money < n) return false; S.money -= n; dirty = true; return true; },
    // 하루에 몇 번(일터 3판 등 — 다음 날 다시)
    uses: k => S.uses[k] || 0,
    use(k) { S.uses[k] = (S.uses[k] || 0) + 1; dirty = true; return S.uses[k]; },
    ate(e) { const neu = !S.ate[e]; S.ate[e] = (S.ate[e] || 0) + 1; dirty = true; return neu; },
    // 가게가 열렸나(시계 기준 · 시계를 멈춰도 그 시각 그대로)
    open: (h0, h1) => { const h = S.min / 60; return h0 === 0 && h1 === 24 ? true : h >= h0 && h < h1; },
    // 처음부터(가방·돈·도감·날짜 모두) — 가방 객체는 그대로 두고 비움(마을이 같은 객체를 들고 있음)
    reset() { const b = S.bag; for (const k of Object.keys(b)) delete b[k]; const f = fresh(); f.bag = b; for (const k of Object.keys(S)) delete S[k]; Object.assign(S, f); acc = 0; ph = phaseOf(S.min); dirty = true; G.flush(); emit('clock'); emit('phase'); },
  };
  return G;
}
