// 📖 마을 도감(GAME-5b · 또래 10-17 '2027 교과서 사진·도감 부품과 같은 틀 — 찍으면/찾으면 칸이 차는 것'): 놀이 코드와 떼어 둔 도감 자료·틀
//   칸 = { 갈래, 처음 찾은 곳(칸), 때(계절·낮밤), 날 } · 비어 있으면 '어디쯤일까' 귀띔 한 줄 · 그림·사진 = 게임 화면만(실제 사진 X)
//   쓰는 법: dexStamp(곳·때) → 처음 찾을 때 S.dex[열쇠]에 넣음 · dexBook(S, ITEMS, DISHES) → 갈래마다 칸 목록(그리기는 부르는 쪽)
export const DEX_V = 1;

// 비었을 때 귀띔(어디쯤일까 — 장소 이름은 쓰지 않음 · 아이가 놓은 것만 있는 마을이라 '○○ 곁에서'로)
export const DEX_HINT = {
  '🍓': ['딸기 하우스 일꾼 곁에서', 'Help at a strawberry greenhouse'], '🥔': ['감자밭 일꾼 곁에서', 'Help at a potato field'], '🍚': ['가을 논에서 벼 베기', 'Cut rice in autumn'], '🍐': ['배 과수원 일꾼 곁에서', 'Help at a pear orchard'], '🥬': ['배추밭 일꾼 곁에서', 'Help at a cabbage field'], '🥛': ['소 돌보기 돕기', 'Help feed the cows'],
  '🍄': ['숲 버섯 따기 · 표고 일꾼', 'Pick mushrooms in the woods'], '🍯': ['꿀벌 통 일꾼 곁에서', 'Help a beekeeper'], '🧂': ['소금밭 일꾼 곁에서', 'Help at a salt pan'], '🐚': ['갯벌 조개 캐기', 'Dig clams on the mudflat'], '🌿': ['배 타고 김 양식장 곁에서', 'From the boat, at a laver farm'], '🐟': ['부두 낚시 일꾼 곁에서', 'Fish at the pier'],
  '🥒': ['장터에서 주고받기', 'Trade at a market'], '🍞': ['빵집·카페에서 사기 · 장터 주고받기', 'Buy at a bakery or café'], '🍦': ['아이스크림 가게', 'Ice cream shop'], '🥤': ['카페·편의점', 'Café or convenience store'],
  '🌾': ['마트에서 사기', 'Buy at a mart'], '🥚': ['마트에서 사기', 'Buy at a mart'], '🧈': ['마트에서 사기', 'Buy at a mart'], '🍁': ['마트에서 사기', 'Buy at a mart'], '🌱': ['봄 논에서 모내기', 'Plant rice in spring'], '🌲': ['나무 심는 일꾼 곁에서', 'Help plant saplings'],
  '🥞': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🥘': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🍮': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🍓🥞': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🌑': ['불 조절을 놓치면…', 'Miss the heat…'], '🍲': ['☀️ 여름 꾸러미를 채우면 요리법', 'Fill the summer bundle'], '🍙': ['🍁 가을 꾸러미를 채우면 요리법', 'Fill the autumn bundle'],
  '⛰': ['산꼭대기까지', 'Climb to the summit'], '🗼': ['배로 등대 한 바퀴', 'Sail around the lighthouse'], '👣': ['징검다리 건너기', 'Cross the stepping stones'], '📖': ['도서관에서 책 읽기', 'Read at the library'], '⛷': ['겨울 스키장', 'Ski in winter'], '🏅': ['🍳 요리 꾸러미 채우기', 'Fill the cooking bundle'], '🧺': ['계절 꾸러미 다 채우기', 'Fill every bundle'], '🔭': ['밤에 산꼭대기에서 별 보기', 'Stargaze on the summit at night'],
  '🐙': ['바닷가 바위 곁', 'By a rock on the shore'], 'ate': ['마을 식당에서', 'A restaurant in town'],
};
const SEA_N = { spring: ['🌸 봄', '🌸 spring'], summer: ['☀️ 여름', '☀️ summer'], autumn: ['🍂 가을', '🍂 autumn'], winter: ['❄️ 겨울', '❄️ winter'] }, PH_N = { day: ['낮', 'day'], sunset: ['노을', 'dusk'], night: ['밤', 'night'] };
// 처음 찾은 기록 한 칸(놀이 쪽이 지금 자리·때를 넘겨 줌)
export const dexStamp = (day, cell, season, phase) => ({ d: day, c: cell || '', s: season || '', t: phase || '' });
// 기록 한 칸을 한 줄로('📍가5 · 🍂 가을 낮 · 3일째') — 옛 저장(날 숫자만)도 읽음
export function dexLine(r, en) { if (r == null) return ''; if (typeof r === 'number') return en ? 'Day ' + r : r + '일째'; const S = SEA_N[r.s], P = PH_N[r.t]; return [r.c ? '📍' + r.c : '', (S ? S[en ? 1 : 0] : '') + (P ? ' ' + P[en ? 1 : 0] : ''), en ? 'Day ' + r.d : r.d + '일째'].filter(Boolean).join(' · '); }
// 도감 책: 갈래마다 칸 목록 — 열쇠 = 물건 그림 · 먹어 본 음식 = 'ate:' + 그림 · 바다 친구 = '🐙'
export function dexBook(S, ITEMS, DISHES, SKY) {   /* SKY = 별자리(town_sky.js · 산꼭대기가 있는 마을만) */ const IT = Object.keys(ITEMS), D = S.dex || {}, cat = c => IT.filter(e => c.includes(ITEMS[e][2]) && e !== '🌑'), slot = (k, icon, kind) => ({ k, icon, kind, got: D[k] != null, rec: D[k] ?? null, hint: DEX_HINT[kind === 'ate' ? 'ate' : icon] || ['', ''] });
  const sec = [
    { id: 'food', t: ['🍽 먹거리·군것질', '🍽 Food & treats'], L: cat(['food', 'treat']).map(e => slot(e, e, 'item')) },
    { id: 'cook', t: ['🥚 재료·일한 보람', '🥚 Ingredients & work'], L: cat(['cook', 'farm']).map(e => slot(e, e, 'item')) },
    { id: 'dish', t: ['🍳 만든 요리', '🍳 Dishes cooked'], L: cat(['dish']).map(e => slot(e, e, 'item')) },
    { id: 'ate', t: ['🍜 식당에서 먹어 본 음식', '🍜 Tasted at restaurants'], L: Object.keys(DISHES).map(e => slot('ate:' + e, e, 'ate')) },
    { id: 'stamp', t: ['🏅 도장', '🏅 Stamps'], L: cat(['stamp']).map(e => slot(e, e, 'item')) },
    { id: 'sea', t: ['🐙 만난 바다 친구', '🐙 Sea friends'], L: [slot('🐙', '🐙', 'item')] },
  ];
  if (SKY) sec.push({ id: 'star', t: ['🌌 본 별자리', '🌌 Constellations'], L: SKY.map(st => ({ k: 'star:' + st.id, icon: st.icon, kind: 'star', got: D['star:' + st.id] != null, rec: D['star:' + st.id] ?? null, hint: st.hint || ['', ''], name: st.t })) });   // GAME-8
  let got = 0, tot = 0; for (const s of sec) for (const q of s.L) { tot++; if (q.got) got++; } return { sec, got, tot, pct: tot ? Math.round(got / tot * 100) : 0 }; }
