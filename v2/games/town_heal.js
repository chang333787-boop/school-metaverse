// 🌙 힐링 묶음(HEAL-1 · 최종 차례 7번 줄 · 설계 docs/systems/town_heal.md): 놀이 코드와 떼어 둔 규칙·글(town_news.js와 같은 결)
//   ② 불빛 곡선 = 게임 시각 → uniform 셋(창 바탕 어둡기 uNight9 · 켤 창 차례 uLate9 · 가로등 구역 차례 uLamp9) — 계단 없이 이어짐
//   ③ 소리 층 = 철(놀이 계절) × 때 × 자리 × 날씨 → 층마다 크기 0~1 · 소리가 나는 자리 = 그 생물이 실제로 사는 자리(소리를 따라가면 진짜 있음)
//   ④ 엽서 = 사진에 담긴 것(일꾼 · 동물 · 때 · 날씨 · 칸)으로 받는 이를 저절로 정함 · 답장 글은 실제로 읽은 조각만 이어 붙임(없는 것은 말하지 않음)
//   판타지 X · 숫자·별·순위 X · 이웃은 하는 일로만 부름(실명 X · 아이 집 X) · 매 프레임 일 0
export const HEAL_V = 1;
const cl = v => v < 0 ? 0 : v > 1 ? 1 : v, ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// ② 불빛 곡선(게임 분 · 06:00 = 360 · 24:00 = 1440)
//   uNight9 창 바탕: 05:30 → 06:30 1 → 0 · 17:00 → 19:00 0 → 1
//   uLate9 켤 창 차례: 06:00 → 06:30 0.45 → 0(아침에 남은 불이 꺼짐) · 17:20 → 19:10 0 → 1(하나씩 켜짐) · 22:30 → 24:00 1 → 0.45(몇 개씩 꺼짐)
//   uLamp9 가로등 구역: 06:00 → 06:45 1 → 0(20분이면 1초에 0.1씩 튀어 45분으로) · 17:40 → 18:40 0 → 1 · go = 빛 웅덩이 세기(노을 0.4 → 밤 1)
export function healCurves(m) {
  const night = m < 12 * 60 ? 1 - ss(330, 390, m) : ss(17 * 60, 19 * 60, m);
  const late = m < 12 * 60 ? 0.45 * (1 - ss(360, 390, m)) : m < 22.5 * 60 ? ss(17 * 60 + 20, 19 * 60 + 10, m) : 1 - 0.55 * ss(22.5 * 60, 24 * 60, m);
  const lamp = m < 12 * 60 ? 1 - ss(360, 405, m) : ss(17 * 60 + 40, 18 * 60 + 40, m);
  const go = m < 12 * 60 ? 1 : 0.4 + 0.6 * ss(18 * 60 + 20, 19 * 60, m);
  return { night, late, lamp, go };
}
// 창 셰이더와 같은 식으로 셈(시험 · 2000개 표본): 켜짐 = step(0.42, fract(h × 7.31)) × step(fract(h × 3.17), late)
const fr = x => x - Math.floor(x);
const HH = (() => { const A = new Float32Array(2000); for (let i = 0; i < A.length; i++) A[i] = fr(Math.sin((i * 1.37 + 0.5) * 12.9898 + (i % 37) * 78.233) * 43758.5453); return A; })();
export function litFrac(late) { let n = 0; for (let i = 0; i < HH.length; i++) { const h = HH[i]; if (fr(h * 7.31) >= 0.42 && fr(h * 3.17) <= late) n++; } return n / HH.length; }

// ③ 소리 층 표(크기 = gain 최대 · 모두 발소리 0.17보다 한참 작게 · 새 지저귐 0.03과 비슷하거나 작게)
//   철은 놀이 계절(seaPlay — 야생동물·곤충과 같은 값) · 때는 게임 시각 · night = 밤(NIGHT9 ≥ 1)
export const AMB_LAYERS = {
  creek: { g: 0.035, r: 25, why: ['비가 오면 물이 불어 물소리가 커져요', 'After rain the stream rises and gets louder'] },
  frog: { g: 0.02, r: 40, sea: ['spring', 'summer'], why: ['참개구리는 늦봄~여름 짝짓기 철에 수컷이 울음주머니로 울어요. 비 온 뒤에 더 많이 울어요', 'Male pond frogs call in late spring and summer, more after rain'] },
  cricket: { g: 0.012, r: 30, sea: ['autumn'], why: ['왕귀뚜라미 수컷이 가을밤에 날개를 비벼 소리를 내요', 'Male field crickets rub their wings on autumn nights'] },
  cicada: { g: 0.012, r: 35, sea: ['summer'], why: ['참매미 수컷이 여름 낮에 울어요', 'Male cicadas sing on summer days'] },
  owl: { g: 0.02, r: 50, sea: ['spring', 'summer'], why: ['솔부엉이는 여름 철새로 밤에 "후후" 울어요', 'The brown hawk-owl is a summer visitor that hoots at night'] },
  market: { g: 0.02, r: 35, why: ['장날엔 사람이 모여요', 'People gather on market day'] },
};
// c = { sea, min, night, rain, after(비 그친 뒤 남은 초 · 90 → 0), ins, jang, d: { creek, sea, frog, cricket, cicada, owl, stall } } → 층마다 0~1(거리로 줄어듦)
export function ambLayers(c) { const d = c.d || {}, L = {}, h = c.min / 60, fall = (k, dd) => dd == null || !(dd < AMB_LAYERS[k].r) ? 0 : 1 - dd / AMB_LAYERS[k].r, has = (k) => AMB_LAYERS[k].sea.includes(c.sea);
  L.creek = d.sea != null && d.sea < (d.creek ?? 1e9) ? 0 : fall('creek', d.creek) * (1 + 0.8 * cl((c.after || 0) / 90));
  L.frog = !c.ins && has('frog') && (h >= 18 || h < 5 || c.after > 0) ? fall('frog', d.frog) : 0;
  L.cricket = !c.ins && has('cricket') && c.night && !c.rain ? fall('cricket', d.cricket) : 0;
  L.cicada = !c.ins && has('cicada') && h >= 9 && h < 17 && !c.rain ? fall('cicada', d.cicada) : 0;
  L.owl = !c.ins && has('owl') && c.night && !c.rain ? fall('owl', d.owl) : 0;
  L.market = c.jang && h >= 9 && h < 18 ? fall('market', d.stall) : 0;
  return L; }

// ④ 엽서 — 받는 이(하는 일로만) · 동물 → 일 이웃
export const JOB_PLACE = { paddy: ['논', 'paddy'], fisher: ['낚시터', 'fishing pier'], lumber: ['숲', 'forest'], shiitake: ['표고 재배장', 'shiitake farm'], cabbage: ['배추밭', 'cabbage field'], potato: ['감자밭', 'potato field'], beehive: ['양봉장', 'bee yard'], pasture: ['목장', 'pasture'], saltpan: ['염전', 'salt pan'], strawberry: ['딸기밭', 'strawberry field'], pear: ['배 과수원', 'pear orchard'], clam: ['갯벌', 'mudflat'], seaweed: ['김 양식장', 'laver farm'], oyster: ['굴 양식장', 'oyster farm'], cook: ['부엌', 'kitchen'], stones: ['징검다리', 'stepping stones'] };
export const ANIMAL_JOB = { heron: 'paddy', egret: 'paddy', frog: 'paddy', mallard: 'fisher', spotbill: 'fisher', otter: 'fisher', chipmunk: 'lumber', owl: 'lumber', waterdeer: 'lumber' };
export const jobName = (k, en) => { const J = JOB_PLACE[k]; return J ? (en ? 'the ' + J[1] + ' worker' : J[0] + ' 일꾼') : (en ? 'a neighbour' : '이웃'); };
const TMW = { sunset: ['노을 때', 'at sunset'], night: ['밤', 'at night'], dawn: ['이른 아침', 'in the early morning'] }, WXW = { rain: ['비 오는 날', 'on a rainy day'], snow: ['눈 오는 날', 'on a snowy day'] };
// 엽서 이름 조각(실제로 읽은 것만): 때 · 날씨 · 곳 · 담긴 것
export function cardBits(c, en) { const L = en ? 1 : 0, B = []; if (c.tm && TMW[c.tm]) B.push(TMW[c.tm][L]); if (c.wx && WXW[c.wx]) B.push(WXW[c.wx][L]); if (c.pl) B.push(c.pl); if (c.an) B.push(c.an); else if (c.me) B.push(en ? 'you at work' : '일하는 내 모습'); return B; }
export function cardName(c, en) { const B = cardBits(c, en); return en ? 'postcard' + (B.length ? ' (' + B.join(', ') + ')' : '') : (B.length ? B.join(' ') + ' ' : '풍경 ') + '엽서'; }
// 답장(받은 이웃 말풍선 · 1인칭) · 길 위 소문(다른 이웃 · 3인칭)
export function cardThanks(c, en) { return en ? 'Thank you for the ' + cardName(c, true) + ' yesterday. I put it up at work.' : '어제 ' + cardName(c, false) + ' 고마워요. 일터에 붙여 뒀어요.'; }
export function cardRumor(c, en) { return en ? jobName(c.job, true).replace(/^the /, 'The ') + ' put up the ' + cardName(c, true) + ' from yesterday.' : jobName(c.job, false) + '이 어제 받은 ' + cardName(c, false) + '를 일터에 붙여 뒀대'; }
// 엽서 판 색(사진의 때·날씨): 노을 = 주황 · 밤 = 남색 · 비 = 회청 · 낮 = 하늘
export const cardColor = c => c.wx === 'rain' || c.wx === 'snow' ? 0x8fa4b4 : c.tm === 'sunset' ? 0xf2a65a : c.tm === 'night' ? 0x3d4f8a : 0x9fd0ee;
export const CARD_DAY = 3, CARD_KEEP = 12, CARD_STAMP = 200;
