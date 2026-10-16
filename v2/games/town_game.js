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

// 물건 표 하나(이름·갈래) — 가방 창·도감·가게가 모두 여기를 봄 · 값은 경제 단계(GAME-3)에서 같은 표에
//   갈래: food 먹거리 · farm 일한 보람 · stamp 도장
export const ITEMS = {
  '🍓': ['딸기', 'Strawberry', 'food'], '🍐': ['배', 'Pear', 'food'], '🍄': ['버섯', 'Mushroom', 'food'], '🥬': ['배추', 'Cabbage', 'food'], '🥔': ['감자', 'Potato', 'food'],
  '🍯': ['꿀', 'Honey', 'food'], '🍚': ['쌀', 'Rice', 'food'], '🧂': ['소금', 'Salt', 'food'], '🐟': ['물고기', 'Fish', 'food'], '🐚': ['조개', 'Clam', 'food'], '🌿': ['김', 'Laver', 'food'],
  '🥒': ['오이', 'Cucumber', 'food'], '🍞': ['빵', 'Bread', 'food'], '🍦': ['아이스크림', 'Ice cream', 'food'],
  '🌾': ['모·건초(일한 보람)', 'Rice seedlings · hay', 'farm'], '🌲': ['심은 나무', 'Saplings planted', 'farm'],
  '⛰': ['정상 도장', 'Summit stamp', 'stamp'], '🗼': ['등대 도장', 'Lighthouse stamp', 'stamp'], '👣': ['징검다리 도장', 'Stepping-stone stamp', 'stamp'], '📖': ['책 읽기 도장', 'Reading stamp', 'stamp'],
};
export const itemName = (e, en) => { const I = ITEMS[e]; return I ? (en ? I[1] : I[0]) : e; };

export function createGame(id) {
  const KEY = 'sm-town-game:' + id;
  const fresh = () => ({ v: SAVE_V, day: 1, min: 7 * 60, bag: {}, money: 0, dex: {}, picked: {}, tasks: null, clock: true });
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
    sleep() { S.day++; S.min = DAY_START; acc = 0; ph = phaseOf(S.min); S.picked = {}; S.tasks = null; dirty = true; G.flush(); emit('clock'); emit('phase'); emit('day'); },
    // 가방
    add(e, n = 1) { S.bag[e] = (S.bag[e] || 0) + n; const neu = !S.dex[e]; if (neu) S.dex[e] = S.day; dirty = true; return neu; },
    take(e, n = 1) { if ((S.bag[e] || 0) < n) return false; S.bag[e] -= n; if (S.bag[e] <= 0) delete S.bag[e]; dirty = true; return true; },
    count: e => S.bag[e] || 0,
    // 오늘 딴 자리(버섯 등 — 다음 날 다시 자람)
    picked: k => S.picked[k] === S.day,
    pick(k) { S.picked[k] = S.day; dirty = true; },
    // 처음부터(가방·돈·도감·날짜 모두) — 가방 객체는 그대로 두고 비움(마을이 같은 객체를 들고 있음)
    reset() { const b = S.bag; for (const k of Object.keys(b)) delete b[k]; const f = fresh(); f.bag = b; for (const k of Object.keys(S)) delete S[k]; Object.assign(S, f); acc = 0; ph = phaseOf(S.min); dirty = true; G.flush(); emit('clock'); emit('phase'); },
  };
  return G;
}
