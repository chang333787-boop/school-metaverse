// 🧺 계절 꾸러미 + 🌟 제철 일(GAME-7 · 스타듀 '마을 회관 꾸러미' 결): 놀이 코드와 떼어 둔 자료·틀
//   꾸러미 = 계절마다 나는 것 몇 가지를 모아 넣으면 → 💰 덤 + 새 요리법·고명·도장(벌·기한·순위 X — 언제든 넣고 다음에 이어서)
//   제철 = 그 계절 일터에서 거들면 하나 더(✨ 놀이용 어림 — 마을 자료의 계절 상자 수 표와 같은 결) · '지금' 모습 = 여름으로 셈
//   이 마을에서 못 구하는 것은 꾸러미에서 빠짐(아이 판에 없는 일터를 만들지 않음 · 둘 넘게 남는 꾸러미만 보임)
export const BUNDLE_V = 1;

// 제철 일터(일 갈래 = 마을 PLAYK 열쇠)
export const SEAS_W = {
  spring: ['strawberry', 'beehive', 'shiitake', 'clam', 'lumber'],
  summer: ['potato', 'cabbage', 'saltpan', 'beehive', 'fisher'],
  autumn: ['pear', 'paddy', 'cabbage', 'shiitake', 'fisher'],
  winter: ['seaweed', 'oyster', 'strawberry'],
};
export const seaKey = s => (s === 'now' || !SEAS_W[s] ? 'summer' : s);
export const inSeason = (k, s) => SEAS_W[seaKey(s)].includes(k);

// 꾸러미: need = { 물건: 수 } · rew = 다 채우면 생기는 것(top = 꾸미기 고명 · recipe = 요리법 · stamp = 도장)
export const BUNDLES = [
  { id: 'spring', icon: '🌸', t: ['봄 꾸러미', 'Spring bundle'], need: { '🍓': 3, '🍯': 2, '🍄': 2 }, money: 1500, rew: { top: 'petal' }, rt: ['🌸 꽃잎 고명(꾸미기)', '🌸 Petal topping (decorate)'] },
  { id: 'summer', icon: '☀️', t: ['여름 꾸러미', 'Summer bundle'], need: { '🥔': 3, '🥬': 2, '🧂': 2 }, money: 1500, rew: { recipe: '🍲' }, rt: ['🍲 감자 배추국 요리법', '🍲 Potato-cabbage soup recipe'] },
  { id: 'autumn', icon: '🍁', t: ['가을 꾸러미', 'Autumn bundle'], need: { '🍐': 2, '🍚': 2, '🍄': 2 }, money: 1500, rew: { recipe: '🍙' }, rt: ['🍙 주먹밥 요리법', '🍙 Rice ball recipe'] },
  { id: 'winter', icon: '❄️', t: ['겨울 꾸러미', 'Winter bundle'], need: { '🌿': 2, '🐚': 2, '🍓': 2 }, money: 1500, rew: { top: 'snow' }, rt: ['❄️ 눈꽃 설탕 고명(꾸미기)', '❄️ Snow-sugar topping (decorate)'] },
  { id: 'cook', icon: '🍳', t: ['요리 꾸러미', 'Cooking bundle'], need: { '🥞': 1, '🥘': 1, '🍮': 1 }, money: 2000, rew: { stamp: '🏅' }, rt: ['🏅 요리사 도장', '🏅 Cook stamp'] },
];
export const ALL_STAMP = '🧺';   // 보이는 꾸러미를 다 채우면

// 꾸러미 책: can(e) = 이 마을에서 구할 수 있나 · 갈래마다 { B, need(구할 수 있는 것만), put, done }
export function bundleBook(S, can) { const P = S.bundles || {}, out = [];
  for (const B of BUNDLES) { const need = {}; for (const [e, n] of Object.entries(B.need)) if (can(e)) need[e] = n; if (Object.keys(need).length < 2) continue;
    const put = P[B.id] || {}, done = Object.entries(need).every(([e, n]) => (put[e] || 0) >= n); out.push({ B, need, put, done }); }
  return out; }
// 가방에서 꾸러미로 옮기기(모자란 만큼만) → { moved, done(이번에 다 참) }
export function bundlePut(S, row, take) { const P = S.bundles || (S.bundles = {}), put = P[row.B.id] || (P[row.B.id] = {}); let moved = 0;
  for (const [e, n] of Object.entries(row.need)) { const k = Math.max(0, n - (put[e] || 0)); for (let i = 0; i < k; i++) { if (!take(e)) break; put[e] = (put[e] || 0) + 1; moved++; } }
  const done = Object.entries(row.need).every(([e, n]) => (put[e] || 0) >= n); return { moved, done }; }
