// 📈 일 놀이 도전 사다리 + 내 최고(LADDER-2 · 사용자 10-24 차례 '도전 사다리·내 최고 기록' · 코덱스 표 15줄 '기존 놀이 하나의 조건 변화와 내 최고 기록만' → 일 놀이 전체 · 설계 docs/systems/town_minis.md §5.7)
//   같은 일 놀이를 잘 해내면(점수 2 이상) 다음 판은 한 칸 위(도전 1칸 → 4칸) · 아쉬움(점수 0)이 두 판 이어지면 한 칸 아래(벌 X · 조용히 쉬워짐) · 이야기 '같이 일하기' 단계 = 1칸 고정 · 셈 X
//   칸마다 바뀌는 것 = 놀이마다 하나(그 일의 진짜 사정 · 눈에 보임): 딸기가 빨리 무름 · 벌이 예민해 연기 칸이 좁음 · 벌레가 빨리 옴 · 크기가 비슷한 배추 · 흙이 단단해 삽질이 줄어듦 · 해가 일찍 져 시간이 짧음 …
//   내 최고 = 나 자신과만(순위·남과 비교 X) · 더 높은 칸에서 해낸 것이 더 높은 기록 → 같은 칸이면 잘한 정도 → 모은 수 · 끝 창 한 줄 + 수첩 🌟 솜씨 칸에 놀이별 최고·지난
//   보상은 그대로(점수 0~3 = 옛 보상 표 · 하루 한도 rwCheck 그대로) — 칸이 높아도 받는 것이 늘지 않음(어려워져 점수가 덜 나올 뿐)
//   저장 GAME.S.lad.mg[갈래] = { lv, z(이어진 아쉬움), n(판 수), best: { lv, g, n }, last: { lv, g, n } } · 판 끝에 한 번(GAME.mark · 매 프레임 X)
//   낚시(fishL)·소금(saltL)·부엌(lad.kitchen)은 자기 사다리가 이미 있어 칸은 그쪽 것 · 여기는 기록만(own)
const A4 = [['', ''], ['조금 ', 'a little '], ['더 ', 'even '], ['아주 ', 'very ']];
/* 놀이 갈래(mgKind)마다: v = 칸 1~4 값(놀이 틀이 읽음) · t(k, lv) = 그 칸의 조건 한 줄 [ko, en] */
export const LADP = {
  ripe: { v: [0, 3.4, 2.5, 1.8], t: (k, a) => (k === 'shiitake' ? ['활짝 핀 표고가 ' + a[0] + '빨리 시들어요', 'Open shiitake wilt ' + a[1] + 'fast'] : ['익은 딸기가 ' + a[0] + '빨리 물러요', 'Ripe strawberries go soft ' + a[1] + 'fast']) },   /* 익은 뒤 무르기까지 초 */
  plant: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['해가 ' + a[0] + '일찍 져요. 시간이 짧아요', 'The sun sets ' + a[1] + 'early — less time'] },   /* 시간 배수 */
  cut: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['비구름이 ' + a[0] + '빨리 와요. 시간이 짧아요', 'Rain clouds come ' + a[1] + 'soon — less time'] },
  comb: { v: [1, 0.8, 0.65, 0.52], t: (k, a) => ['벌이 ' + a[0] + '예민한 날이에요. 연기 칸이 좁아요', 'The bees are ' + a[1] + 'jumpy — the smoke zone is narrow'] },   /* 초록 칸 폭 배수 */
  dig: { v: [0, 1, 2, 3], t: (k, a) => (k === 'clam' ? ['갯벌이 ' + a[0] + '질척해요. 삽질 수가 줄어요', 'The mud is ' + a[1] + 'sticky — fewer digs'] : ['흙이 ' + a[0] + '단단해요. 삽질 수가 줄어요', 'The soil is ' + a[1] + 'hard — fewer digs']) },   /* 줄어드는 삽질 수 */
  sort: { v: [0, 0.3, 0.5, 0.65], t: (k, a) => ['크기가 ' + a[0] + '비슷한 배추가 섞여요', 'Cabbages of ' + a[1] + 'similar size are mixed in'] },   /* 크기를 가운데로 당기는 정도 */
  cover: { v: [1, 1.2, 1.4, 1.6], t: (k, a) => ['벌레가 ' + a[0] + '빨리 기어 와요', 'Caterpillars crawl ' + a[1] + 'fast'] },   /* 벌레 빠르기 배수 */
  order: { v: [1, 0.8, 0.65, 0.52], t: (k, a) => ['흙이 ' + a[0] + '말랐어요. 물을 알맞게 주기 어려워요', 'The soil is ' + a[1] + 'dry — watering just right is harder'] },   /* 물 초록 칸 폭 배수 */
  feed: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['동물들이 ' + a[0] + '배고파요. 시간이 짧아요', 'The animals are ' + a[1] + 'hungry — less time'] },
  spread: { v: [1, 0.93, 0.87, 0.82], t: (k, a) => ['김 반죽이 ' + a[0] + '모자라요. 아껴서 고르게 펴요', 'There is ' + a[1] + 'less laver mix — spread it carefully'] },   /* 그릇 양 배수 */
  gauge: { v: [1, 0.85, 0.72, 0.62], t: (k, a) => ['배가 ' + a[0] + '일찍 돌아가요. 시간이 짧아요', 'The boat heads back ' + a[1] + 'early — less time'] },
};
const FISHT = { 2: ['큰 고기가 와요. 미끼를 골라요', 'Big fish come — pick a bait'], 3: ['물때를 보고 자리도 골라요', 'Check the tide and pick a spot too'], 4: ['바람이 줄을 한쪽으로 밀어요', 'The wind pushes the line to one side'] };
export const ladVal = (kind, lv) => { const P = LADP[kind]; return P ? P.v[Math.max(1, Math.min(4, lv | 0 || 1)) - 1] : null; };
// 창 위 한 줄: '도전 2칸: 익은 딸기가 조금 빨리 물러요' · 1칸 = '도전 1칸'
export function ladText(kind, k, lv, en) { lv = Math.max(1, Math.min(4, lv | 0 || 1)); const head = en ? 'Challenge step ' + lv : '도전 ' + lv + '칸';
  if (lv === 1) return head; let t = null; if (kind === 'tug') t = FISHT[lv]; else if (LADP[kind]) t = LADP[kind].t(k, A4[lv - 1]); return t ? head + ': ' + t[en ? 1 : 0] : head; }
// 기록 이름: [놀이 이름, 모은 것, 단위]
const RECN = { strawberry: ['딸기 따기', 'Strawberries', '딸기', '개'], shiitake: ['표고 따기', 'Shiitake', '표고', '송이'], cabbage: ['배추 거두기', 'Cabbages sorted right', '맞게 담은 배추', '포기'], potato: ['감자 캐기', 'Potatoes', '감자', '개'], clam: ['조개 캐기', 'Clams', '조개', '개'],
  beehive: ['꿀 뜨기', 'Honey cells', '꿀 칸', '칸'], pear: ['배 봉지 씌우기', 'Pears bagged', '봉지 씌운 배', '개'], lumber: ['어린 나무 심기', 'Trees planted well', '잘 심은 나무', '그루'], plant: ['모내기', 'Seedlings on the mark', '눈금에 심은 모', '포기'], cut: ['벼 베기', 'Squares cut', '벤 칸', '칸'],
  seaweed: ['김 펴기', 'Even laver sheets', '고르게 편 김', '장'], oyster: ['굴 크기 재기', 'Oysters sorted right', '바르게 나눈 굴', '개'], pasture: ['먹이 나눠 주기', 'Right feeds', '알맞게 준 먹이', '번'], fisher: ['부두 낚시', 'Fish', '물고기', '마리'], saltpan: ['소금 모으기', 'Salt piles', '모은 소금', '무더기'], cook: ['바쁜 부엌', 'Dishes just right', '알맞게 만든 요리', '그릇'] };
export const ladName = (key, en) => { const R = RECN[key]; return R ? R[en ? 1 : 0] : key; };
const GW = [['아쉬움', 'close'], ['잘함', 'well done'], ['아주 잘함', 'excellent']];
const g3 = s => (s >= 3 ? 2 : s >= 1 ? 1 : 0);
/* 한 기록 → 사람 말: '도전 3칸, 딸기 7개' · 수를 못 세는 판 = '도전 3칸, 아주 잘함' */
export function recSay(key, r, en) { if (!r) return ''; const R = RECN[key], head = en ? 'step ' + r.lv : '도전 ' + r.lv + '칸';
  if (r.n > 0 && R) return en ? head + ', ' + r.n + ' ' + R[1].toLowerCase() : head + ', ' + R[2] + ' ' + r.n + R[3]; return head + ', ' + GW[g3(r.g)][en ? 1 : 0]; }
const rkey = r => (r ? (r.lv | 0) * 1000 + Math.min(3, r.g | 0) * 100 + Math.min(99, r.n | 0) : -1);
export function ladRoot(S) { let L0 = S.lad; if (!L0 || typeof L0 !== 'object' || Array.isArray(L0)) L0 = S.lad = {}; let M = L0.mg; if (!M || typeof M !== 'object' || Array.isArray(M)) M = L0.mg = {}; return M; }
export function ladOf(S, key) { const M = ladRoot(S); let L = M[key]; if (!L || typeof L !== 'object') L = M[key] = { lv: 1, z: 0, n: 0, best: null, last: null }; if (!(L.lv >= 1 && L.lv <= 4)) L.lv = 1; return L; }
export const ladLv = (S, key) => ladOf(S, key).lv;
/* 판 끝: o = { lv(이번 판 칸), g(점수 0~3), n(모은 수 · 모르면 -1), own(칸은 다른 사다리 것 · 기록만) } → { neu(새 최고 · 앞 기록을 넘음), first(첫 기록), best, last, next(다음 칸 · 바뀔 때만), down } */
export function ladAfter(S, key, o) { const L = ladOf(S, key), lv = Math.max(1, Math.min(4, o.lv | 0 || 1)), g = Math.max(0, Math.min(3, o.g | 0)), n = Math.max(0, o.n | 0), cur = { lv, g, n };
  L.n = (L.n | 0) + 1; L.last = cur; let neu = false, first = false; if (g >= 1 && rkey(cur) > rkey(L.best)) { if (L.best) neu = true; else first = true; L.best = { ...cur }; }
  let next = 0, down = false;
  if (o.own) L.lv = lv; else if (lv === L.lv) { if (g >= 2) { L.z = 0; if (L.lv < 4) { L.lv++; next = L.lv; } } else if (g === 0) { L.z = (L.z | 0) + 1; if (L.z >= 2 && L.lv > 1) { L.lv--; L.z = 0; next = L.lv; down = true; } } else L.z = 0; }
  return { neu, first, best: L.best, last: cur, next, down, lv: L.lv }; }
/* 끝 창 두 줄: 내 최고 · (칸이 바뀌면) 다음 판 */
export function recLines(key, kind, k, R, en) { const b = recSay(key, R.best, en), a = [];
  if (R.best) a.push(R.neu ? (en ? '🏅 New personal best! ' : '🏅 새 내 최고! ') + b : R.first ? (en ? '🏅 First record: ' : '🏅 첫 기록: ') + b : (en ? '🏅 My best: ' : '🏅 내 최고: ') + b + (en ? '. This time: ' : '. 이번: ') + recSay(key, R.last, en));
  if (R.next && R.down) a.push(en ? 'Next time one step easier (step ' + R.next + ')' : '다음 판은 한 칸 쉽게 해요(도전 ' + R.next + '칸)');
  else if (R.next) a.push((en ? 'Next time: ' : '다음 판은 ') + ladText(kind, k, R.next, en)); return a; }
/* 수첩(🌟 솜씨 칸) 줄: 해 본 놀이만 */
export function ladRows(S, en) { const M = ladRoot(S), out = []; for (const key of Object.keys(RECN)) { const L = M[key]; if (!L || !(L.n > 0)) continue; out.push({ key, name: ladName(key, en), lv: L.lv, best: L.best ? recSay(key, L.best, en) : '', last: L.last ? recSay(key, L.last, en) : '', n: L.n }); } return out; }
