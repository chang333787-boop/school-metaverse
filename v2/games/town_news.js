// 📋 아침 소식판(MORNING-1 · 설계 docs/systems/town_phase1.md 「아침 소식판」 · 조각 3): 놀이 코드와 떼어 둔 글 만들기(town_pollen.js와 같은 결)
//   newsMake(c) = 저장 상태(마을 쪽이 c로 넘김)만 읽어 현관 칠판 두 줄 + 길 위 이웃 소문 + 문 앞 선물을 정함 · 그리기·말풍선·E는 마을(town.js)이 함
//   ①번 줄 = 어제 내가 한 일의 결과(화분·텃밭 → 비 온 날 물 줌 → 문 앞 선물 → 꿀벌 → 심은 나무 → 판 것·나눈 것)
//   ②번 줄 = 오늘만(장날 · 계절 바뀜 하루 전 · 게시판 · 숲 바닥 · 오늘 날씨 사실 · 버섯) — 할 일을 시키지 않고 사실만
//   처음 사흘 = 칠판 한 줄 + 소문 하나 · 같은 갈래가 이틀 이어서 X(S.news.last) — 다만 내가 한 일의 줄은 글이 달라지면 이어서 나옴
//   소문 = 실제로 가 보면 있는 것만(장터 손님 · 어제 썰물 시각 · 꿀벌 · 어제 내가 한 일 · 다 익은 텃밭 · 야생동물 자리) · 이웃은 하는 일로만 부름(실명 X)
//   매 프레임 일 0(하루 한 번 · 몇 줄 견주기)
export const NEWS_V = 1;
const WXT = { '맑음': ['맑아요', 'clear'], '구름 조금': ['구름이 조금 있어요', 'a little cloudy'], '흐림': ['흐려요', 'cloudy'], '비': ['비가 와요', 'rainy'], '눈': ['눈이 와요', 'snowy'] };
const josa = (w, a, b) => { const c = (w || '').charCodeAt((w || '').length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; };   /* 받침 있으면 a(을·이·은) 없으면 b(를·가·는) */
// 문 앞 선물 = 그 일꾼이 하는 일에서 나는 것 하나(뽑기 X · 정해짐)
export const GIFT_OF = { shiitake: '🍄', cabbage: '🥬', potato: '🥔', lumber: '🌰', beehive: '🍯', pasture: '🥛', saltpan: '🧂', paddy: '🍚', strawberry: '🍓', pear: '🍐', fisher: '🐟', clam: '🐚', seaweed: '🌿', oyster: '🐚' };
// 어제 이웃과 한 일 무게(하나만 남김): 하트 단계가 오름 > 요리를 받음 > 선물을 받음
export const NB_RANK = { like: 4, up: 3, dish: 2, gift: 1 };   /* COZY-1: 좋아하는 것을 받은 이웃 = 다음 아침 답례가 먼저 */

/* c = { en, day, S(GAME.S), pots, farm, plotState, CROPS, crop(e), item(e), rainY, yday, gift:{e,who}|null, pol, fruitAt, sapY, jang:{on,left,at}, wx:{ic,nm}, seaNext:string|null, board:[이름…], twig, mush, tide:{t,at}|null, wild:[{t,place,at}], farmAt, nbAt, nWk, card:{ko,en,at}|null, surp:{ko,en,at}|null, fx:[{k,t,at,two}] } */
export function newsMake(c) {
  const en = !!c.en, d = c.day | 0, N = c.S.news && typeof c.S.news === 'object' ? c.S.news : {}, last = N.last && typeof N.last === 'object' ? N.last : {}, prevT = {};
  for (const L of Array.isArray(N.lines) ? N.lines : []) if (L && L.k) prevT[L.k] = L.t;
  const Y = c.yday && c.yday.day === d - 1 ? c.yday : null, one = [], two = [], rum = [];
  const add = (A, k, ko, e9, o) => A.push(Object.assign({ k, t: en ? e9 : ko }, o || {}));
  // ① 어제 내가 한 일의 결과
  for (const q of c.fx || []) if (!q.two) add(one, 'fx:' + q.k, q.t[0], q.t[1], { mine: 1, at: q.at || null });   /* FIX-1 어제 알린 고장을 고침(맨 앞 = 내가 한 일의 결과가 바로 보이게) */
  const nm = P => c.crop(P.c), st = P => c.plotState(P, d), gw = (A, G9) => (A || []).map((P, i) => ({ P, up: !!(G9 && G9[i]) })).filter(o => o.P && o.P.c && c.CROPS[o.P.c]);
  const pots = gw(c.pots, c.potGrew), potW = pots.filter(o => o.P.w === d - 1 && o.up), potR = pots.filter(o => o.up);   /* up = 밤사이 실제로 한 날 자람(마을이 자라기 전·뒤를 견줘 넘김) */
  if (potW.length && Y && Y.rainW > 0 && c.rainY) add(one, 'rainw', '🌧 빗물로 넉넉했어요. 물을 안 줘도 똑같이 자랐을 거예요', '🌧 The rain was enough. The pot would have grown without watering', { mine: 1, at: 'home', ck: { pot: 'up' } });
  else if (potW.length) { const r = potW.find(o => st(o.P) === 'ripe'), P = (r || potW[0]).P, n = nm(P), y1 = P.d === d - 1; add(one, 'pot', r ? '🧺 어제 물 준 화분의 ' + n + josa(n, '이', '가') + ' 다 자랐어요' : (P.g <= 1 ? '🌱 어제 ' + (y1 ? '심은' : '물 준') + ' 화분의 ' + n + '에 싹이 났어요' : '🌱 어제 물 준 화분의 ' + n + josa(n, '이', '가') + ' 쑥 자랐어요'),
      r ? '🧺 The ' + n + ' you watered yesterday is fully grown' : (P.g <= 1 ? '🌱 The ' + n + ' you ' + (y1 ? 'planted' : 'watered') + ' yesterday has sprouted' : '🌱 The ' + n + ' you watered grew taller'), { mine: 1, at: 'home', ck: r ? { pot: 'ripe', c: P.c } : { pot: 'grow', c: P.c, g: P.g } }); }   /* 10-24 고리: 'n/3일' 숫자 대신 싹·쑥·다 자람 */
  else if (potR.length) { const P = potR[0].P; add(one, 'potrain', '🌧 어젯밤 비 덕분에 화분의 ' + nm(P) + josa(nm(P), '이', '가') + ' 저절로 자랐어요', '🌧 Last night’s rain made the ' + nm(P) + ' in the pot grow by itself', { at: 'home', ck: { pot: 'up', c: P.c } }); }
  else if (pots.some(o => st(o.P) === 'water' && o.P.d < d)) add(one, 'potdry', '🌱 화분이 그대로예요. 어제는 물을 못 받았어요', '🌱 The pot stayed the same — it got no water yesterday', { at: 'home', ck: { pot: 'water' } });
  { const F = gw(c.farm, c.farmGrew).filter(o => o.up && o.P.w === d - 1); if (F.length) { const r = F.find(o => st(o.P) === 'ripe'), P = (r || F[0]).P; add(one, 'farm', r ? '🧺 학교 텃밭 ' + nm(P) + josa(nm(P), '이', '가') + ' 다 자랐어요' : P.g <= 1 ? '🌱 어제 ' + (P.d === d - 1 ? '심은' : '돌본') + ' 학교 텃밭 ' + nm(P) + '에 싹이 났어요' : '🌱 어제 돌본 학교 텃밭 ' + nm(P) + josa(nm(P), '이', '가') + ' 쑥 자랐어요', r ? '🧺 The ' + nm(P) + ' in the school garden is fully grown' : P.g <= 1 ? '🌱 The school-garden ' + nm(P) + ' has sprouted' : '🌱 The school-garden ' + nm(P) + ' you tended grew taller', { mine: 1, at: c.farmAt || null, ck: { farm: r ? 'ripe' : 'grow', c: P.c } }); } }
  if (c.S.spend && c.S.spend.can === 2) add(one, 'can', '🔧 고친 물뿌리개가 문 앞에 와 있어요. 넓은 꼭지를 달았대요', '🔧 The fixed watering can is at our door — with a wide rose', { mine: 1, at: 'home' });   /* SPEND-1 맡긴 다음 아침 */
  if (c.gift && c.gift.why === 'like' && c.gift.g) add(one, 'gift', '🎁 어제 ' + c.item(c.gift.g) + josa(c.item(c.gift.g), '을', '를') + ' 받은 ' + c.gift.who + ' 일꾼이 답례로 ' + c.item(c.gift.e) + josa(c.item(c.gift.e), '을', '를') + ' 두고 갔어요', '🎁 The ' + c.gift.who + ' worker you gave ' + c.item(c.gift.g) + ' left ' + c.item(c.gift.e) + ' at our door to say thanks', { mine: 1, at: 'gift' });   /* COZY-1 답례 */
  else if (c.gift) add(one, 'gift', '🎁 ' + c.gift.who + ' 일꾼이 문 앞에 ' + c.item(c.gift.e) + josa(c.item(c.gift.e), '을', '를') + ' 두고 갔어요', '🎁 The ' + c.gift.who + ' worker left ' + c.item(c.gift.e) + ' at our door', { mine: 1, at: 'gift' });
  if (c.pol) add(one, 'pol', '🐝 어제 돌본 꿀벌 덕분에 오늘 배·딸기가 잘 맺혀요', '🐝 Thanks to the bees you helped, pears and strawberries set well today', { mine: 1, at: c.fruitAt || null, ck: { pol: 1 } });
  for (const q of c.em || []) add(one, 'em:' + q.k, q.t[0], q.t[1], { mine: 1, at: q.at || null });   /* EMERG-1 어제 긴급 출동 결과(내가 한 일 · 세상에 남은 흔적 자리) */
  if (c.sapY > 0) add(one, 'sap', '🌲 어제 심은 어린나무가 그 자리에 잘 서 있어요', '🌲 The sapling you planted yesterday is standing well', { mine: 1, ck: { sap: c.sapY } });
  if (Y && Y.sold > 0) add(one, 'sold', '🛒 어제 장터에서 물건을 ' + Y.sold + '개 팔았어요', '🛒 You sold ' + Y.sold + ' thing(s) at the market yesterday', { mine: 1 });
  if (Y && Y.shared > 0 && !c.gift) add(one, 'shared', '🍽 어제 이웃에게 요리를 ' + Y.shared + '번 나눠 줬어요', '🍽 You shared food with neighbours ' + Y.shared + ' time(s) yesterday', { mine: 1 });
  // ② 오늘만
  if (c.chain && c.chain.t) add(two, 'chain:' + c.chain.k, c.chain.t[0], c.chain.t[1], { at: c.chain.at || null, ck: { chain: c.chain.k } });   /* ROUTINE-1 먹이·물 연쇄(비 사흘 → 개구리·왜가리 · 비 없는 닷새 → 물새 줄어듦 · town_routine.js) — 오늘만 줄 맨 앞 */
  if (c.jang && c.jang.on) add(two, 'jang', '🎪 오늘은 장날이에요. 장터 값이 더 좋아요', '🎪 Market day today — the market pays more', { at: c.jang.at || null, ck: { jang: 1 } });
  if (c.seaNext) add(two, 'sea', '📅 내일부터 ' + c.seaNext + josa(c.seaNext, '이에요', '예요'), '📅 ' + c.seaNext + ' starts tomorrow', { ck: { sea: 1 } });
  if (c.board && c.board.length) add(two, 'board', '📌 본부 게시판에 새 의뢰가 붙었어요', '📌 New requests on the HQ board', { ck: { board: 1 } });
  if (c.jang && !c.jang.on && c.jang.left === 1) add(two, 'jang1', '🎪 내일은 장날이에요', '🎪 Tomorrow is market day', { ck: { jang1: 1 } });
  if (c.twig) add(two, 'twig', '🍂 비 온 다음 날이라 숲에 마른 가지가 많아요', '🍂 After the rain there are lots of dry twigs in the woods', { ck: { twig: 1 } });
  if (c.wx && WXT[c.wx.nm]) add(two, 'wx', c.wx.ic + ' 오늘은 ' + WXT[c.wx.nm][0], c.wx.ic + ' Today is ' + WXT[c.wx.nm][1], { ck: { wx: c.wx.nm } });
  if (c.mush) add(two, 'mush', '🍄 숲의 버섯이 다시 자랐어요', '🍄 The mushrooms in the woods grew back', { ck: { mush: 1 } });
  for (const q of c.fx || []) if (q.two) add(two, 'fx:' + q.k, q.t[0], q.t[1], { at: q.at || null });   /* FIX-1 오늘 새로 생긴 고장(칸만) */
  // 같은 갈래 이틀 연속 X — 내가 한 일 줄은 글이 다르면 됨 · 모두 걸리면 첫 것
  const fresh = L => last[L.k] !== d - 1 || (L.mine && prevT[L.k] !== L.t);
  const pick = A => A.find(fresh) || A[0] || null;
  const L1 = pick(one), L2 = pick(two.filter(L => !L1 || L.k !== L1.k)), lines = [];
  if (d <= 3) { const L = L1 || L2; if (L) lines.push(L); } else { if (L1) lines.push(L1); if (L2) lines.push(L2); if (!L1) { const L3 = pick(two.filter(L => L !== L2)); if (L3 && L3 !== L2) lines.push(L3); } }
  // 소문(이웃 말풍선 · 그 자리에 실제로 있는 것만)
  if (c.surp && c.surp.at) add(rum, 'surp', c.surp.ko, c.surp.en, { at: c.surp.at });   /* SURP-1 첫 놀람을 이끄는 소문 한 줄(아무것도 못 찾은 동안만 · 맨 앞) */
  if (c.card && c.card.at) add(rum, 'card', c.card.ko, c.card.en, { at: c.card.at });   /* HEAL-1 어제 넣은 엽서(받은 이웃이 일터에 붙임 · 글 = 엽서에 실제로 담긴 조각만) */
  if (c.jang && c.jang.on && c.jang.at) add(rum, 'jang', '오늘 장날이라 장터에 손님이 많대', 'It’s market day — lots of shoppers at the market', { at: c.jang.at });
  if (c.tide && c.tide.t) add(rum, 'tide', '어제는 갯벌 물이 ' + c.tide.t + '쯤 빠졌대. 오늘은 언제쯤일까?', 'Yesterday the tide went out around ' + c.tide.t + '. When today?', { at: c.tide.at });
  if (c.pol && c.fruitAt) add(rum, 'pol', '과수원 꿀벌들이 바쁘대. 열매가 잘 맺힌대', 'The orchard bees are busy — the fruit is setting well', { at: c.fruitAt });
  if (Y && Y.nb && c.nbAt) add(rum, 'nb', '어제 누가 ' + Y.nb.who + ' 일꾼한테 ' + (Y.nb.why === 'dish' ? '요리를 나눠 줬대' : Y.nb.why === 'gift' || Y.nb.why === 'like' ? '선물을 줬대' : '일을 도와줬대'), 'Someone ' + (Y.nb.why === 'dish' ? 'shared food with' : Y.nb.why === 'gift' || Y.nb.why === 'like' ? 'gave a present to' : 'helped') + ' the ' + Y.nb.who + ' worker yesterday', { at: c.nbAt });
  if (c.farmAt && (c.farm || []).some(P => P && P.c && c.CROPS[P.c] && st(P) === 'ripe')) add(rum, 'ripe', '학교 텃밭에 다 익은 게 있대', 'Something is ripe in the school garden', { at: c.farmAt });
  for (const w of c.wild || []) add(rum, 'wild:' + w.id, w.place + ' 근처에 ' + w.t + josa(w.t, '이', '가') + ' 자주 온대', 'A ' + w.t + ' often comes near ' + w.place, { at: w.at });
  if (c.twig && c.twigAt) add(rum, 'twig', '비 온 다음 날이라 숲 바닥에 마른 가지가 많대', 'After rain the forest floor has lots of dry twigs', { at: c.twigAt });
  const nR = Math.min(c.nWk | 0, d <= 3 ? 1 : 2), R = [], usedK = new Set(lines.map(L => L.k));
  const okR = r => last['r:' + r.k] !== d - 1, wildN = rum.filter(r => r.k.startsWith('wild:'));
  const wildPick = wildN.length ? wildN[(d * 7) % wildN.length] : null;   /* 야생동물은 날마다 돌아가며 하나(같은 줄 되풀이 X) */
  const pool = rum.filter(r => !r.k.startsWith('wild:') || r === wildPick);
  for (const pass of [r => okR(r) && !usedK.has(r.k), okR, () => true]) for (const r of pool) { if (R.length >= nR) break; if (!R.includes(r) && pass(r)) R.push(r); }
  const L9 = {}; for (const [k, v] of Object.entries(last)) if (v >= d - 1) L9[k] = v; for (const L of lines) L9[L.k] = d; for (const r of R) L9['r:' + r.k] = d;
  return { d, lines, rum: R, last: L9, cand: { one: one.map(L => L.k), two: two.map(L => L.k), rum: rum.map(r => r.k) } };
}
