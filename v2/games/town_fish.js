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

/* ───── FISH-2 줄 낚시(town_jobs2.md 「🎣 줄 낚시」): 물때·자리·미끼로 걸리는 고기가 달라짐 ─────
   자리 near = 가까운 얕은 물 · deep = 방파제 끝 깊은 물 · 미끼 worm = 갯지렁이(바닥에 사는 고기) · shrimp = 새우(떼 지어 헤엄치는 고기)
   규칙(일반 사실만): 밀물엔 물고기가 먹이를 따라 가까운 얕은 곳까지 들어옴 · 썰물엔 깊은 곳으로 내려감 · 겨울엔 얕은 물이 차가워 깊은 곳에 모임
   at = 즐겨 머무는 자리 · eat = 잘 먹는 미끼 · big = 당기는 힘(0~1 · 큰 고기일수록 셈) */
const HAB = { dodari: ['near', 'worm', 0.3], bollak: ['deep', 'shrimp', 0.4], jeongaengi: ['near', 'shrimp', 0.3], mineo: ['deep', 'worm', 0.8], jeoneo: ['near', 'shrimp', 0.3], godeungeo: ['deep', 'shrimp', 0.55], bangeo: ['deep', 'shrimp', 0.9], daegu: ['deep', 'worm', 0.75] };
for (const f of FISH) { const h = HAB[f.id]; if (h) { f.at = h[0]; f.eat = h[1]; f.big = h[2]; } }
export const GOBY = { id: 'mangdung', sea: 'warm', at: 'near', eat: 'worm', big: 0.15, icon: '🐟', t: ['망둥어', 'Goby'], line: ['갯벌 갯골과 강어귀의 얕은 바닥에 살아요 — 물이 빠져도 갯골 물속에 남아 있어요', 'Lives on shallow bottoms in mudflat channels and river mouths — it stays in the channel water at low tide'], hint: ['🏖 봄~가을 썰물에 가까운 얕은 물', 'Low tide in shallow water, spring to autumn'] };
FISH.push(GOBY);
const SEAS = ['spring', 'summer', 'autumn', 'winter'], seaOf = s => (SEAS.includes(s) ? s : 'autumn');
export const FISH_FACT = {
  high: ['밀물이에요. 물이 들어오면 물고기들이 먹이를 따라 가까운 얕은 곳까지 들어와요', 'High tide. As the water comes in, fish follow their food into the shallows'],
  low: ['썰물이에요. 물이 빠지면 물고기들이 깊은 곳으로 내려가요', 'Low tide. As the water goes out, fish move down to deeper water'],
  cold: ['겨울엔 얕은 물이 차가워서 물고기들이 깊은 곳에 모여 있어요', 'In winter the shallows are cold, so fish gather in deep water'],
  bait: ['바닥에 사는 고기는 바닥을 기는 갯지렁이를, 떼 지어 헤엄치는 고기는 작은 새우를 잘 먹어요', 'Bottom fish like crawling lugworms; fish that swim in schools like small shrimp'],
};
// 그 자리·물때·미끼에 걸리는 고기: { f(없으면 null), fit(미끼가 맞음), why(없을 때 까닭 = FISH_FACT 열쇠) }
export function fishAt(sea, low, spot, bait, dex, seed) { const s = seaOf(sea), L = FISH.filter(f => f.sea === s && f.at);
  let C;
  if (spot === 'near') C = low ? (s === 'winter' ? [] : [GOBY]) : L.filter(f => f.at === 'near');
  else C = low ? L.slice() : L.filter(f => f.at === 'deep');
  if (!C.length) return { f: null, fit: false, why: s === 'winter' ? 'cold' : 'low' };
  const M = C.filter(f => f.eat === bait), P0 = M.length ? M : C, neu = P0.filter(f => !(dex || {})['fish:' + f.id]), P = neu.length ? neu : P0;
  return { f: P[(seed >>> 0) % P.length], fit: M.length > 0, why: '' }; }
// 그 물때에 알맞은 자리·미끼(꼬임 1·2 = 저절로 고름 · 꼬임 3부터 아이가 고름)
export function fishBest(sea, low) { const s = seaOf(sea), spot = low || s === 'winter' ? 'deep' : 'near', r = fishAt(s, low, spot, 'worm', null, 0), r2 = fishAt(s, low, spot, 'shrimp', null, 0);
  return { spot, bait: r.fit ? 'worm' : r2.fit ? 'shrimp' : 'worm' }; }
