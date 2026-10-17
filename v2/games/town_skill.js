// 🌟 솜씨(숙련 · LEVEL-1 · 사용자 10-17 '레벨 숙련도가 없으면 결국 성장하는 그런 게 없는 거 같기도 해 · 게임 레벨링 시스템 고민'): 놀이 코드와 떼어 둔 자료·규칙
//   한 줄 '레벨(힘)' 대신 하는 일마다 솜씨가 늘어요(스타듀 결 · 연습하면 는다 = 성장 마인드셋) — 보상 = 새 능력·편해짐·지식 카드(힘·순위 X)
//   같은 일을 하루에 많이 하면 경험치가 줄어요(여러 놀이를 고르게 · 강박 X) · 실패(탄 요리·놓친 타이밍)도 1(연습은 연습)
//   상태 = 놀이 상태 S.skill = { 갈래: 경험치 } · S.skillDay = { 날, 갈래: 오늘 받은 횟수 } · 지식 카드 = 레벨에 닿으면 열림(사실만 — 지어낸 것 X)
export const SKILL_V = 1;
const T2 = (ko, en) => [ko, en];
export const SKILLS = {
  work: { icon: '🌾', t: T2('일솜씨', 'Helping hands'), how: T2('일꾼 곁에서 거들기(E)', 'Help workers (E)') },
  cook: { icon: '🍳', t: T2('요리', 'Cooking'), how: T2('아이 집 부엌에서 요리', 'Cook in a home kitchen') },
  farm: { icon: '🌱', t: T2('농사', 'Gardening'), how: T2('학교 텃밭 심기·물 주기·거두기', 'Plant, water and harvest the school garden') },
  look: { icon: '🔍', t: T2('관찰', 'Nature watching'), how: T2('곤충·별·물고기·버섯을 찾아 도감에', 'Find insects, stars, fish and mushrooms') },
  trade: { icon: '🛒', t: T2('살림', 'Market sense'), how: T2('장터 팔기·가게 사기·꾸러미', 'Sell, shop and fill bundles') },
  explore: { icon: '🧭', t: T2('탐험', 'Exploring'), how: T2('새 칸 가 보기·산꼭대기·배·버스·징검다리', 'New cells, summit, boat, bus, stepping stones') },
};
export const SK_ORDER = ['work', 'cook', 'farm', 'look', 'trade', 'explore'];
// 레벨 1~10 · 다음 레벨까지 경험치(처음은 빨리 — 첫 놀이 5분 안에 2레벨 하나)
export const NEED = [0, 6, 10, 14, 20, 26, 34, 42, 52, 64];   // NEED[L] = L → L+1
export const MAXL = 10;
export function levelOf(xp) { let L = 1, x = xp || 0; while (L < MAXL && x >= NEED[L]) { x -= NEED[L]; L++; } return { L, cur: x, need: L < MAXL ? NEED[L] : 0 }; }
// 하루에 같은 갈래 n번째 받을 때 몫(1~8번 = 그대로 · 9~16 = 반 · 그 뒤 = 0 — 다른 놀이로)
const DAYCUT = n => (n <= 8 ? 1 : n <= 16 ? 0.5 : 0);
// 경험치 주기 → { k, L0, L1, xp } (레벨이 올랐으면 L1 > L0)
export function gain(S, k, n, day) { if (!SKILLS[k] || !(n > 0)) return null; const SK = S.skill || (S.skill = {}), SD = S.skillDay && S.skillDay.d === day ? S.skillDay : (S.skillDay = { d: day });
  SD[k] = (SD[k] || 0) + 1; const m = DAYCUT(SD[k]); if (!m) return { k, L0: levelOf(SK[k]).L, L1: levelOf(SK[k]).L, xp: 0, cut: true };
  const L0 = levelOf(SK[k]).L; SK[k] = (SK[k] || 0) + Math.max(1, Math.round(n * m)); return { k, L0, L1: levelOf(SK[k]).L, xp: Math.max(1, Math.round(n * m)) }; }
export const lv = (S, k) => levelOf((S.skill || {})[k]).L;
export const total = S => SK_ORDER.reduce((a, k) => a + lv(S, k), 0);
// 칭호(솜씨 레벨 합 6~60)
export const TITLES = [[6, T2('🌱 새싹 주민', '🌱 Sprout')], [12, T2('🙂 꼬마 일꾼', '🙂 Little helper')], [20, T2('🤝 마을 도우미', '🤝 Town helper')], [30, T2('🌟 마을 솜씨꾼', '🌟 Town all-rounder')], [42, T2('🏡 마을 지킴이', '🏡 Town keeper')], [56, T2('👑 우리 마을 박사', '👑 Town expert')]];
export const titleOf = S => { const t = total(S); let r = TITLES[0][1]; for (const [n, tt] of TITLES) if (t >= n) r = tt; return r; };
// 능력(레벨에 닿으면 · 놀이가 읽음) — 값 = 그 레벨 이상이면 적용
export const PERKS = {
  work: [[2, 'zone', 1.12, T2('타이밍 초록 칸이 조금 넓어져요', 'The green timing zone gets a bit wider')], [4, 'zone', 1.25, T2('초록 칸이 더 넓어져요', 'Even wider green zone')], [6, 'plays', 4, T2('일터마다 하루 4판까지', 'Up to 4 rounds per workplace a day')], [8, 'heart', 2, T2('거들면 이웃 마음이 더 쌓여요', 'Helping grows hearts faster')], [10, 'badge', 1, T2('🌾 마을 일손 배지', '🌾 Town helper badge')]],
  cook: [[2, 'zone', 1.15, T2('불 조절 초록 칸이 넓어져요', 'Wider green zone when cooking')], [4, 'zone', 1.3, T2('초록 칸이 더 넓어져요', 'Even wider green zone')], [7, 'extra', 0.3, T2('가끔 한 그릇 더(30%)', 'Sometimes one extra serving (30%)')], [10, 'badge', 1, T2('🍳 꼬마 요리사 배지', '🍳 Little chef badge')]],
  farm: [[3, 'crop', 1, T2('거둘 때 하나 더', 'One more when you harvest')], [6, 'crop', 2, T2('거둘 때 둘 더', 'Two more when you harvest')], [10, 'badge', 1, T2('🌱 텃밭 지기 배지', '🌱 Garden keeper badge')]],
  look: [[2, 'near', 20, T2('작은 곤충을 더 멀리서(20m) 알아채요', 'Notice small insects from farther away (20 m)')], [4, 'parts', 1, T2('돋보기 창에 몸 부분 이름(머리·가슴·배)', 'Body part labels in the magnifier (head, thorax, abdomen)')], [6, 'ff', 200, T2('여름밤 반딧불이를 더 많이 봐요', 'See more fireflies on summer nights')], [10, 'badge', 1, T2('🔍 꼬마 박사 배지', '🔍 Little scientist badge')]],
  trade: [[3, 'price', 1.05, T2('장터에서 5% 더 받아요', 'Get 5% more at the market')], [6, 'price', 1.1, T2('장터에서 10% 더 받아요', 'Get 10% more at the market')], [10, 'badge', 1, T2('🛒 살림 고수 배지', '🛒 Market master badge')]],
  explore: [[2, 'compass', 1, T2('작은 지도에도 🧭 방위표(동서남북)', '🧭 Compass rose on the mini-map too')], [4, 'scale', 1, T2('작은 지도에도 📏 축척 막대(실제 거리)', '📏 Scale bar on the mini-map too')], [6, 'fast', 1.08, T2('걸음이 조금 빨라져요', 'You walk a little faster')], [10, 'badge', 1, T2('🧭 마을 길잡이 배지', '🧭 Town guide badge')]],
};
export function perk(S, k, kind, def) { let v = def; for (const [L, kd, val] of PERKS[k] || []) if (kd === kind && lv(S, k) >= L) v = val; return v; }
// 지식 카드(레벨 3·5·8 · 생활·자연 상식 — 사실만)
export const CARDS = {
  work: [[3, T2('벼는 봄에 모를 심고 가을에 거둬요 — 논에 물을 대어 키워요', 'Rice is planted in spring and harvested in autumn, grown in flooded paddies')], [5, T2('꿀벌은 꽃가루를 옮겨 열매가 맺히게 도와요', 'Bees carry pollen and help fruit form')], [8, T2('소금은 바닷물을 햇볕과 바람에 말려서 얻기도 해요', 'Salt can be made by drying seawater in sun and wind')]],
  cook: [[3, T2('요리하기 전에는 손을 비누로 30초 넘게 씻어요', 'Wash hands with soap for over 30 seconds before cooking')], [5, T2('밥·채소·고기·과일을 골고루 먹으면 몸이 튼튼해져요', 'Eating a balance of grains, vegetables, protein and fruit keeps you strong')], [8, T2('불을 쓸 때는 꼭 어른과 함께해요', 'Always use fire with a grown-up')]],
  farm: [[3, T2('씨앗이 싹 트려면 물·공기·알맞은 온도가 필요해요', 'Seeds need water, air and the right temperature to sprout')], [5, T2('식물은 햇빛을 받아 스스로 양분을 만들어요', 'Plants make their own food using sunlight')], [8, T2('같은 땅에 같은 작물만 계속 심으면 땅이 지쳐요 — 돌려 심기를 해요', 'Growing the same crop again and again tires the soil — rotate crops')]],
  look: [[3, T2('곤충은 몸이 머리·가슴·배 세 부분이고 다리가 여섯 개예요', 'Insects have three body parts and six legs')], [5, T2('거미는 다리가 여덟 개라 곤충이 아니에요', 'Spiders have eight legs, so they are not insects')], [8, T2('북극성은 거의 움직이지 않아 북쪽을 찾을 때 길잡이가 돼요', 'The North Star barely moves, so it helps you find north')]],
  trade: [[3, T2('사기 전에 ‘꼭 필요한 것’과 ‘갖고 싶은 것’을 나눠 봐요', 'Before buying, sort “needs” from “wants”')], [5, T2('같은 물건도 가게마다 값이 다를 수 있어요 — 견줘 보고 사요', 'The same thing can cost different amounts in different shops')], [8, T2('남는 것을 나누면 버리는 것이 줄어요', 'Sharing what’s left means less waste')]],
  explore: [[3, T2('지도의 방위표에서 위쪽이 보통 북쪽이에요', 'On most maps, up is north')], [5, T2('축척은 실제 거리를 지도에 줄여 나타낸 비율이에요', 'A scale shows how much real distance is shrunk on a map')], [8, T2('등고선이 촘촘한 곳은 비탈이 가파른 곳이에요', 'Where contour lines are close together, the slope is steep')]],
};
export function cardsOf(S, k) { return (CARDS[k] || []).filter(([L]) => lv(S, k) >= L).map(([, t]) => t); }
