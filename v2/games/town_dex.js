// 📖 마을 도감(GAME-5b · 또래 10-17 '2027 교과서 사진·도감 부품과 같은 틀 — 찍으면/찾으면 칸이 차는 것'): 놀이 코드와 떼어 둔 도감 자료·틀
//   칸 = { 갈래, 처음 찾은 곳(칸), 때(계절·낮밤), 날 } · 비어 있으면 '어디쯤일까' 귀띔 한 줄 · 그림·사진 = 게임 화면만(실제 사진 X)
//   쓰는 법: dexStamp(곳·때) → 처음 찾을 때 S.dex[열쇠]에 넣음 · dexBook(S, ITEMS, DISHES) → 갈래마다 칸 목록(그리기는 부르는 쪽)
export const DEX_V = 1;

// 비었을 때 귀띔(어디쯤일까 — 장소 이름은 쓰지 않음 · 아이가 놓은 것만 있는 마을이라 '○○ 곁에서'로)
export const DEX_HINT = {
  '🏰': ['해수욕장 모래밭에서', 'On the beach sand'], '🏊': ['해수욕장 물속에서 누워 뜨기', 'Float on your back in the swimming area'], '🌬️': ['해변에서 연 날리기', 'Fly a kite on the beach'],   // SEA-1
  '🔬': ['생태 하천 갈대 옆 물가에서', 'By the reeds of the eco stream'], '🌀': ['강이 굽은 곳 둔치에서', 'On the bank where the river bends'], '🐸': ['들의 논두렁에서 가만히', 'Keep still on a paddy bank in the fields'], '💧': ['들의 다랑이 논에서', 'At the terraced paddies in the fields'],   // RIVER-1·FIELD-1
  '🍂': ['숲 바닥에서 줍기', 'Pick up on the forest floor'], '🌰': ['소나무 숲 바닥에서 줍기', 'Pick up under pine trees'], '⚪': ['숲 바닥에서 줍기', 'Pick up on the forest floor'], '🍃': ['🌸 봄 숲 바닥에서', 'On the forest floor in spring'], '🥗': ['🌲 숲 꾸러미를 채우면 요리법', 'Fill the forest bundle'],   // RES-1
  '🍓': ['딸기 하우스 일꾼 곁에서', 'Help at a strawberry greenhouse'], '🥔': ['감자밭 일꾼 곁에서', 'Help at a potato field'], '🍚': ['가을 논에서 벼 베기', 'Cut rice in autumn'], '🍐': ['배 과수원 일꾼 곁에서', 'Help at a pear orchard'], '🥬': ['배추밭 일꾼 곁에서', 'Help at a cabbage field'], '🥛': ['소 돌보기 돕기', 'Help feed the cows'],
  '🍄': ['숲 버섯 따기 · 표고 일꾼', 'Pick mushrooms in the woods'], '🍯': ['꿀벌 통 일꾼 곁에서', 'Help a beekeeper'], '🧂': ['소금밭 일꾼 곁에서', 'Help at a salt pan'], '🐚': ['갯벌 조개 캐기', 'Dig clams on the mudflat'], '🌿': ['배 타고 김 양식장 곁에서', 'From the boat, at a laver farm'], '🐟': ['부두 낚시 일꾼 곁에서', 'Fish at the pier'], '🥕': ['학교 텃밭에서 길러요', 'Grow it in the school garden'], '🍅': ['학교 텃밭에서 길러요', 'Grow it in the school garden'], '🌽': ['학교 텃밭에서 길러요', 'Grow it in the school garden'], '🍠': ['학교 텃밭에서 길러요', 'Grow it in the school garden'],
  '🥒': ['장터에서 주고받기', 'Trade at a market'], '🍞': ['빵집·카페에서 사기 · 장터 주고받기', 'Buy at a bakery or café'], '🍦': ['아이스크림 가게', 'Ice cream shop'], '🥤': ['카페·편의점', 'Café or convenience store'],
  '🌾': ['마트에서 사기', 'Buy at a mart'], '🥚': ['마트에서 사기', 'Buy at a mart'], '🧈': ['마트에서 사기', 'Buy at a mart'], '🍁': ['마트에서 사기', 'Buy at a mart'], '🌱': ['봄 논에서 모내기', 'Plant rice in spring'], '🌲': ['나무 심는 일꾼 곁에서', 'Help plant saplings'],
  '🥞': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🥘': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🍮': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🍓🥞': ['아이 집 부엌에서 요리', 'Cook in a kitchen'], '🌑': ['불 조절을 놓치면…', 'Miss the heat…'], '🍲': ['☀️ 여름 꾸러미를 채우면 요리법', 'Fill the summer bundle'], '🍙': ['🍁 가을 꾸러미를 채우면 요리법', 'Fill the autumn bundle'], '🍿': ['🏫 텃밭 꾸러미를 채우면 요리법', 'Fill the garden bundle'],
  '⛰': ['산꼭대기까지', 'Climb to the summit'], '🗼': ['배로 등대 한 바퀴', 'Sail around the lighthouse'], '👣': ['징검다리 건너기', 'Cross the stepping stones'], '📖': ['도서관에서 책 읽기', 'Read at the library'], '⛷': ['겨울 스키장', 'Ski in winter'], '🏅': ['🍳 요리 꾸러미 채우기', 'Fill the cooking bundle'], '🧺': ['계절 꾸러미 다 채우기', 'Fill every bundle'], '🔭': ['밤에 산꼭대기에서 별 보기', 'Stargaze on the summit at night'], '⛄': ['눈 오는 날·겨울에 ⛄ 눈사람 (N)', 'On a snowy day or in winter: ⛄ Snowman (N)'], '🌈': ['비가 그치면 하늘을 봐요', 'Look at the sky when the rain stops'], '💫': ['여름밤 물가에서', 'By the water on a summer night'], '🥇': ['자전거 고리 코스를 아주 빠르게', 'Ride a ring course very fast'], '🥈': ['자전거 고리 코스를 빠르게', 'Ride a ring course fast'], '🥉': ['자전거로 고리 코스 끝까지', 'Finish a ring course on the bike'], '📜': ['📖 이야기 한 장 끝내기 (Q)', 'Finish a story chapter (Q)'], '🏮': ['📖 첫 잔치 이야기 한 장 끝내기 (Q)', 'Finish a festival story chapter (Q)'],
  '🐙': ['바닷가 바위 곁', 'By a rock on the shore'], 'ate': ['마을 식당에서', 'A restaurant in town'],
};
const SEA_N = { spring: ['🌸 봄', '🌸 spring'], summer: ['☀️ 여름', '☀️ summer'], autumn: ['🍂 가을', '🍂 autumn'], winter: ['❄️ 겨울', '❄️ winter'] }, PH_N = { day: ['낮', 'day'], sunset: ['노을', 'dusk'], night: ['밤', 'night'] };
// 처음 찾은 기록 한 칸(놀이 쪽이 지금 자리·때를 넘겨 줌)
export const dexStamp = (day, cell, season, phase) => ({ d: day, c: cell || '', s: season || '', t: phase || '' });
// 기록 한 칸을 한 줄로('📍가5 · 🍂 가을 낮 · 3일째') — 옛 저장(날 숫자만)도 읽음
export function dexLine(r, en) { if (r == null) return ''; if (typeof r === 'number') return en ? 'Day ' + r : r + '일째'; const S = SEA_N[r.s], P = PH_N[r.t]; return [r.c ? '📍' + r.c : '', (S ? S[en ? 1 : 0] : '') + (P ? ' ' + P[en ? 1 : 0] : ''), en ? 'Day ' + r.d : r.d + '일째'].filter(Boolean).join(' · '); }
// 도감 책: 갈래마다 칸 목록 — 열쇠 = 물건 그림 · 먹어 본 음식 = 'ate:' + 그림 · 바다 친구 = '🐙'
export function dexBook(S, ITEMS, DISHES, SKY, FISHL, BUGL, SHOREL, TMAPL, WILDL) {   /* SKY = 별자리(town_sky.js · 산꼭대기가 있는 마을만) · FISHL = 물고기(town_fish.js · 부두 낚시가 있는 마을만) */ const IT = Object.keys(ITEMS), D = S.dex || {}, cat = c => IT.filter(e => c.includes(ITEMS[e][2]) && e !== '🌑'), slot = (k, icon, kind) => ({ k, icon, kind, got: D[k] != null, rec: D[k] ?? null, hint: DEX_HINT[kind === 'ate' ? 'ate' : icon] || ['', ''] });
  const sec = [
    { id: 'food', t: ['🍽 먹거리·군것질', '🍽 Food & treats'], L: cat(['food', 'treat']).map(e => slot(e, e, 'item')) },
    { id: 'cook', t: ['🥚 재료·일한 보람', '🥚 Ingredients & work'], L: cat(['cook', 'farm']).map(e => slot(e, e, 'item')) },
    { id: 'wild', t: ['🌲 숲에서 주운 것', '🌲 Forest finds'], L: cat(['wild']).map(e => slot(e, e, 'item')) },   // RES-1
    { id: 'dish', t: ['🍳 만든 요리', '🍳 Dishes cooked'], L: cat(['dish']).map(e => slot(e, e, 'item')) },
    { id: 'ate', t: ['🍜 식당에서 먹어 본 음식', '🍜 Tasted at restaurants'], L: Object.keys(DISHES).map(e => slot('ate:' + e, e, 'ate')) },
    { id: 'stamp', t: ['🏅 도장', '🏅 Stamps'], L: cat(['stamp']).map(e => slot(e, e, 'item')) },
    { id: 'sea', t: ['🐙 만난 바다 친구', '🐙 Sea friends'], L: [slot('🐙', '🐙', 'item')] },
  ];
  if (FISHL) sec.push({ id: 'fish', t: ['🎣 낚은 물고기', '🎣 Fish met'], L: FISHL.map(f => ({ k: 'fish:' + f.id, icon: f.icon, kind: 'fish', got: D['fish:' + f.id] != null, rec: D['fish:' + f.id] ?? null, hint: f.hint || ['', ''], name: f.t })) });   // GAME-11
  if (BUGL && BUGL.length) sec.push({ id: 'bug', t: ['🔍 관찰한 곤충', '🔍 Insects observed'], L: BUGL.map(b => ({ k: 'bug:' + b.id, icon: b.icon, kind: 'bug', got: D['bug:' + b.id] != null, rec: D['bug:' + b.id] ?? null, hint: b.hint || ['', ''], name: b.t })) });   /* GAME-19 · 이 마을에 사는 곳이 있는 곤충만 */
  if (WILDL && WILDL.length) sec.push({ id: 'animal', t: WILDL.title ? ['🦌 만난 야생동물 (칭호 ' + WILDL.title[0] + ')', '🦌 Wild animals met (title: ' + WILDL.title[1] + ')'] : ['🦌 만난 야생동물', '🦌 Wild animals met'], L: WILDL.map(b => ({ k: 'wild:' + b.id, icon: b.icon, sil: b.sil, extra: b.extra, kind: 'wild', got: D['wild:' + b.id] != null, rec: D['wild:' + b.id] ?? null, hint: b.hint || ['', ''], name: b.t })) });   /* WILD-1 · 이 마을에 사는 곳이 있는 종만(town_wild.js dexList · 칸 그림 = 같은 모양 옆모습 · 못 만난 칸 = 실루엣 · extra = ★ 스티커 + 관찰 별) */
  if (SHOREL && SHOREL.length) sec.push({ id: 'shore', t: ['🦀 갯벌 친구', '🦀 Mudflat friends'], L: SHOREL.map(b => ({ k: 'shore:' + b.id, icon: b.icon, kind: 'shore', got: D['shore:' + b.id] != null, rec: D['shore:' + b.id] ?? null, hint: b.hint || ['', ''], name: b.t })) });   /* SHORE-1 · 갯벌이 있는 마을만 */
  if (TMAPL && TMAPL.length) sec.push({ id: 'tmap', t: TMAPL.title ? ['🗺 보물 상자 (칭호 ' + TMAPL.title[0] + ')', '🗺 Treasure chests (title: ' + TMAPL.title[1] + ')'] : ['🗺 보물 상자', '🗺 Treasure chests'], L: TMAPL.map(b => ({ k: 'tmap:' + b.id, icon: b.icon, kind: 'tmap', got: D['tmap:' + b.id] != null, rec: D['tmap:' + b.id] ?? null, hint: b.hint || ['', ''], name: b.t })) });   /* TREASURE-1 · 보물 지도 상자가 있는 마을만(town_treasure.js dex()) */
  if (SKY) sec.push({ id: 'star', t: ['🌌 본 별자리', '🌌 Constellations'], L: SKY.map(st => ({ k: 'star:' + st.id, icon: st.icon, kind: 'star', got: D['star:' + st.id] != null, rec: D['star:' + st.id] ?? null, hint: st.hint || ['', ''], name: st.t })) });   // GAME-8
  let got = 0, tot = 0; for (const s of sec) for (const q of s.L) { tot++; if (q.got) got++; } return { sec, got, tot }; }   /* PHASE2 조각 2: % X(도감 머리 = 찾은 것 숫자 하나) */
