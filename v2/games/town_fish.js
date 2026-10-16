// 🎣 낚은 물고기 도감(GAME-11 · 부두 낚시를 거들면 그 계절 물고기를 만남 · 달력 계절마다 다름): 놀이 코드와 떼어 둔 자료(도감·별자리와 같은 결)
//   우리나라 바다의 제철 물고기(실제 사실만 — 지어낸 이야기 X) · 가방엔 예전처럼 🐟 물고기(팔기·요리) · 도감엔 이름이 남음
export const FISH_V = 1;
export const FISH = [
  { id: 'dodari', sea: 'spring', t: ['도다리', 'Marbled flounder'], line: ['봄이 제철인 납작한 물고기 — 두 눈이 몸 한쪽에 있어요', 'A flat fish at its best in spring — both eyes are on one side'] },
  { id: 'bollak', sea: 'spring', t: ['볼락', 'Rockfish'], line: ['바위 틈에 사는 물고기 — 봄에 많이 잡혀요', 'Lives among rocks — caught a lot in spring'] },
  { id: 'jeongaengi', sea: 'summer', t: ['전갱이', 'Horse mackerel'], line: ['여름 바다에서 떼 지어 다녀요', 'Swims in schools in the summer sea'] },
  { id: 'mineo', sea: 'summer', t: ['민어', 'Croaker'], line: ['여름이 제철인 큰 물고기 — 소리를 내서 울어요', 'A big fish at its best in summer — it makes croaking sounds'] },
  { id: 'jeoneo', sea: 'autumn', t: ['전어', 'Gizzard shad'], line: ['가을에 살이 올라 고소해지는 물고기예요', 'Gets plump and tasty in autumn'] },
  { id: 'godeungeo', sea: 'autumn', t: ['고등어', 'Mackerel'], line: ['등에 푸른 물결무늬가 있어요 — 가을에 기름이 올라요', 'Blue wavy stripes on its back — rich in autumn'] },
  { id: 'bangeo', sea: 'winter', t: ['방어', 'Yellowtail'], line: ['추운 겨울 바다를 따라 내려오는 큰 물고기예요', 'A big fish that comes down with the cold winter sea'] },
  { id: 'daegu', sea: 'winter', t: ['대구', 'Pacific cod'], line: ['입이 커서 이름이 대구(큰 입)예요 — 겨울이 제철', 'Named for its big mouth — at its best in winter'] },
];
const SEA_HINT = { spring: ['🌸 봄에 부두 낚시', 'Spring, fishing at the pier'], summer: ['☀️ 여름에 부두 낚시', 'Summer, fishing at the pier'], autumn: ['🍁 가을에 부두 낚시', 'Autumn, fishing at the pier'], winter: ['❄️ 겨울에 부두 낚시', 'Winter, fishing at the pier'] };
for (const f of FISH) { f.icon = '🐟'; f.hint = SEA_HINT[f.sea]; }   // 도감 빈 칸 귀띔
export const FISH_OF = s => FISH.filter(f => f.sea === (SEA_HINT[s] ? s : 'autumn'));
// 이번에 만난 물고기: 아직 못 만난 것 먼저(같은 계절 둘 · 씨앗 = 날·횟수)
export function fishPick(s, dex, seed) { const L = FISH_OF(s), neu = L.filter(f => !(dex || {})['fish:' + f.id]); const P = neu.length ? neu : L; return P[(seed >>> 0) % P.length]; }
