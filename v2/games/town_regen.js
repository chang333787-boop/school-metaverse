// 🔁 다시 살아나는 것(REGEN-1 · 깊이 감사 docs/systems/town_depth.md · 사용자 10-25 '깊이가 한 칸' · '적지 않은 스트레스로 성취')
//   '한 번 하면 끝나는 것' 넷이 세상 일(비·계절·날씨·이웃)로 새 씨앗을 받음 — 사실만 · 판타지 X · 새 놀이 X(있는 틀에 줄만)
//   ① 화석: 네 흙더미를 다 판 아이 · 날씨 자동(wxAuto) · 어제 비 = 오늘 층층골 벽 밑에 새 흙더미 하나(풍화·침식 · 설계 town_explore.md 32 '우와 ①')
//      앞 흙더미를 다 판 뒤에만 · 하루 하나 · 나오는 것 = 그 띠의 화석 갈래 그대로(같은 띠 = 같은 종류) · 새 표본 번호 → 수첩 지층 기둥에 '표본 n'(색 맞춰 붙이기는 그대로)
//   ② 숨은 놀람: 이미 찾은 놀람을 다른 계절·날씨에 다시 보면 '변주' 한 줄(겨울 해넘이는 남서쪽 · 눈 오는 날 메아리는 작음) · 일지 '다시 본 ○○ · 겨울' · 하루 한 번
//      놀람 13을 다 찾은 아이 = 아침에 '오늘 다시 보면 어떨까' 물음 한 줄(그날 맞는 변주가 있을 때만)
//   ③ 보물 지도: 상자 일곱을 다 찾은 뒤 = 이웃이 잃어버린 물건 지도(기호·방위·축척 읽기 · 지도 그리기는 town_treasure.js 그대로) 하루 하나 · 찾으면 그 이웃 마음 · 최근 판 되풀이 X
//   ④ 화학 규칙: 실험 표 두 줄을 이어야 풀리는 '응용 물음'(자리·차례 고르기) 하루 하나 · 그 두 줄을 알아낸 아이만 · 틀리면 벌 X = 게임 시각 20분(다시 생각)
//   보상 = 솜씨만(rwCheck 꼬리표 xp:fos · xp:surp · tmap:lost · chem:app) · 나의 길 걸음 = 위 넷 가운데 그날 처음 하나(S.regen.pd = { 날: 길 })
//   저장 GAME.S.regen = { v, pd, fos: { d, u, f, n } | null, fd, fn, spec: [{ n, f, d }], sv: { 놀람: [변주] }, svd, lost: { h: [판], o: [이웃] }, app: { d, id, ok, pos, tries, wind, h: [id], ph: [자리] } }
//   지킴: 매 프레임 일 0(1초 칸 sec · 하루 넘김 day) · 새 Light X · 그리기 +0(흙더미는 town_xp 인스턴스 · 지도는 town_treasure 캔버스) · 숫자는 표본 번호만 · 실명 X(이웃 = 하는 일)
import { FINDS } from './town_xp.js?v=9';
export const REGEN_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const arr = a => (Array.isArray(a) ? a : []);
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };   /* 받침 있으면 a(을·이에요) · 없으면 b(를·예요) */
const obj = o => (o && typeof o === 'object' && !Array.isArray(o) ? o : null);
const SEA = { spring: 'spring', summer: 'summer', autumn: 'autumn', fall: 'autumn', winter: 'winter' };
const SEAT = { spring: T2('봄', 'spring'), summer: T2('여름', 'summer'), autumn: T2('가을', 'autumn'), winter: T2('겨울', 'winter') };

// ───────── ① 화석 표본(같은 띠 = 같은 갈래 · 표본마다 본 모양 한 줄) ─────────
//   RU = 새 흙더미 자리(골 어귀에서 남쪽 m) — 네 흙더미(30·46·58·70)와 6m 넘게 떨어짐 · 소(83) 앞
const RU = [26, 38, 52, 64, 76];
const SPEC = {
  f1: [T2('잎줄기가 길게 남아 잎이 어떻게 붙어 있었는지 보여요.', 'A long stem is left, showing how the leaves were attached.'), T2('잎 끝만 조금 남았어요. 돌이 깨질 때 나머지가 떨어져 나갔어요.', 'Only the leaf tips are left. The rest broke off with the stone.'), T2('작은 잎 자국이 두 장 겹쳐 있어요.', 'Two small leaf prints lie on top of each other.')],
  f2: [T2('조개 자국 두 개가 겹쳐 굳었어요.', 'Two shell prints are set on top of each other.'), T2('아주 작은 조개 자국이 여럿 모여 있어요.', 'Lots of tiny shell prints are packed together.'), T2('조개 반쪽이 깨진 채 굳었어요. 물결에 굴러다녔나 봐요.', 'Half a shell is set, broken. Waves must have rolled it.')],
  f3: [T2('물결 무늬 사이가 넓어요.', 'The ripple lines are far apart.'), T2('물결 무늬 사이가 좁고 촘촘해요.', 'The ripple lines are close together.'), T2('물결 무늬 위에 빗방울 자국 같은 작은 구멍이 있어요.', 'Small pits like raindrop marks sit on the ripples.')],
  f4: [T2('크고 작은 자갈이 섞여 있어요.', 'Big and small pebbles are mixed together.'), T2('자갈이 한쪽으로 기울어 쌓였어요. 물이 흐른 쪽이에요.', 'The pebbles lean one way — the way the water flowed.'), T2('모래 사이에 둥근 자갈이 박혀 있어요.', 'Round pebbles are stuck in the sand.')],
};
export const specOf = (s, en) => { if (!s) return null; const F = FINDS.find(f => f.id === s.f); if (!F) return null; const L9 = SPEC[F.id] || [F.line], ln = L9[(s.n | 0) % L9.length];
  return { id: 's' + s.n, band: F.band, ic: F.ic, mk: F.id, n: s.n, t: T2('표본 ' + s.n + ' · ' + F.t[0], 'Specimen ' + s.n + ' · ' + F.t[1]), line: T2(F.line[0] + ' ' + ln[0], F.line[1] + ' ' + ln[1]), spec: 1 }; };

// ───────── ② 놀람 변주(같은 곳 다른 때 · 사실만) — n = 놀람 이름(일지) · c(x) = 오늘 조건 { sea, wx, rainY, night } ─────────
export const SVAR = {
  echo: { n: T2('메아리', 'Echo'), v: [
    { k: 'snow', t: T2('눈 오는 날', 'snowy day'), c: x => x.wx === 'snow', fact: T2('갓 내린 눈은 알갱이 사이에 틈이 많아 소리를 빨아들여요. 그래서 메아리가 작게 들렸어요', 'Fresh snow has lots of gaps between flakes and soaks up sound, so the echo was quiet') },
    { k: 'rain', t: T2('비 오는 날', 'rainy day'), c: x => x.wx === 'rain', fact: T2('굴 지붕이 비를 막아 줘요. 바깥 빗소리도 굴 벽에 부딪혀 메아리에 섞였어요', 'The tunnel roof keeps the rain off. The rain sound outside bounced off the walls and mixed with the echo') },
    { k: 'night', t: T2('밤', 'night'), c: x => x.night, fact: T2('밤에는 둘레에 차 소리·사람 소리가 적어서 메아리가 더 또렷이 들려요', 'At night there are fewer car and people sounds, so the echo is clearer') }] },
  sunset: { n: T2('해넘이', 'Sunset'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울에는 해가 일찍 지고, 서쪽보다 조금 남쪽(남서쪽)으로 져요', 'In winter the sun sets early and a little to the south of west (south-west)') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름에는 해가 늦게 지고, 서쪽보다 조금 북쪽(북서쪽)으로 져요', 'In summer the sun sets late and a little to the north of west (north-west)') },
    { k: 'mid', t: T2('봄·가을', 'spring or autumn'), c: x => x.sea === 'spring' || x.sea === 'autumn', fact: T2('봄과 가을, 낮과 밤의 길이가 비슷한 때에는 해가 거의 정서쪽으로 져요', 'In spring and autumn, when day and night are about equal, the sun sets almost due west') }] },
  sunrise: { n: T2('해돋이', 'Sunrise'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울에는 해가 늦게 뜨고, 동쪽보다 조금 남쪽(남동쪽)에서 떠요', 'In winter the sun rises late and a little to the south of east (south-east)') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름에는 해가 일찍 뜨고, 동쪽보다 조금 북쪽(북동쪽)에서 떠요', 'In summer the sun rises early and a little to the north of east (north-east)') },
    { k: 'mid', t: T2('봄·가을', 'spring or autumn'), c: x => x.sea === 'spring' || x.sea === 'autumn', fact: T2('봄과 가을, 낮과 밤의 길이가 비슷한 때에는 해가 거의 정동쪽에서 떠요', 'In spring and autumn, when day and night are about equal, the sun rises almost due east') }] },
  pecker: { n: T2('똑똑똑 나무 소리', 'Knock knock in the trees'), v: [
    { k: 'spring', t: T2('봄', 'spring'), c: x => x.sea === 'spring', fact: T2('봄에는 딱따구리가 짝을 부르고 둥지 구멍을 파느라 나무를 더 자주 두드려요', 'In spring woodpeckers drum more often to call a mate and dig a nest hole') },
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울에는 나무껍질 속에 숨어 겨울을 나는 애벌레를 찾아 쪼아요', 'In winter they peck for grubs hiding under the bark for the winter') }] },
  isleview: { n: T2('저 멀리 작은 섬', 'A small island far away'), v: [
    { k: 'autumn', t: T2('가을', 'autumn'), c: x => x.sea === 'autumn', fact: T2('가을에는 공기가 맑고 말라서 먼 섬이 또렷하게 보여요', 'In autumn the air is clear and dry, so the far island looks sharp') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름에는 공기 속 물기가 많아서 먼 섬이 조금 뿌옇게 보여요', 'In summer there is a lot of water in the air, so the far island looks a little hazy') }] },
  windglide: { n: T2('바람을 타고 멀리', 'Carried by the wind'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('우리나라 겨울에는 북서쪽에서 차고 센 바람이 자주 불어요(북서 계절풍)', 'In Korea’s winter, cold strong winds often blow from the north-west') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('우리나라 여름에는 남동쪽 바다에서 덥고 축축한 바람이 불어와요(남동 계절풍)', 'In Korea’s summer, warm damp winds blow in from the sea to the south-east') }] },
  mist: { n: T2('물안개', 'Morning mist'), v: [
    { k: 'autumn', t: T2('가을', 'autumn'), c: x => x.sea === 'autumn', fact: T2('가을 아침은 낮과 밤의 기온 차이가 커서 물안개가 자주 껴요', 'Autumn mornings follow cold nights after warm days, so mist forms often') },
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울 아침에는 물 위 김이 차가운 공기를 만나 금세 하얀 물방울이 돼요', 'On winter mornings the vapour over the water meets cold air and quickly turns into white droplets') }] },
  frogs: { n: T2('개구리 합창', 'Frog chorus'), v: [
    { k: 'rainY', t: T2('비 온 다음 날', 'day after rain'), c: x => x.rainY, fact: T2('비가 온 뒤 물이 고이면 개구리들이 더 크게, 더 많이 울어요', 'After rain, when water gathers, frogs sing louder and more') },
    { k: 'spring', t: T2('봄', 'spring'), c: x => x.sea === 'spring', fact: T2('봄에 논에 물을 대기 시작하면 개구리가 짝을 찾아 울기 시작해요', 'In spring, when paddies are flooded, frogs start calling for mates') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름 장마철에는 맹꽁이처럼 소리가 다른 개구리 무리도 섞여 울어요', 'In the summer rainy season, other kinds like narrow-mouthed frogs join in with different calls') }] },
  birds: { n: T2('새 떼', 'A flock of birds'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울에는 북쪽에서 날아온 오리·기러기 같은 겨울 철새가 물가에 많아요', 'In winter, ducks and geese that flew down from the north crowd the water') },
    { k: 'spring', t: T2('봄', 'spring'), c: x => x.sea === 'spring', fact: T2('봄에는 겨울 철새가 북쪽으로 떠나고, 여름 철새가 남쪽에서 와요', 'In spring the winter birds leave for the north and summer birds arrive from the south') },
    { k: 'autumn', t: T2('가을', 'autumn'), c: x => x.sea === 'autumn', fact: T2('가을에는 기러기 떼가 줄을 지어 북쪽에서 날아와요', 'In autumn, lines of geese fly in from the north') }] },
  fallbow: { n: T2('물보라 무지개', 'Waterfall rainbow'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('겨울에는 해가 낮게 떠서 무지개가 더 높이 보여요', 'In winter the sun is low, so the rainbow stands higher') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름 한낮에 가까울수록 해가 높아 무지개가 낮게 보여요', 'In summer, nearer midday the sun is high, so the rainbow sits low') },
    { k: 'rainY', t: T2('비 온 다음 날', 'day after rain'), c: x => x.rainY, fact: T2('비 온 다음 날에는 폭포 물이 불어 물보라가 커지고 무지개도 넓어져요', 'The day after rain the falls carry more water, the spray grows and so does the rainbow') }] },
  crab: { n: T2('웅덩이 속 작은 게', 'A little crab in the pool'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('추운 겨울에는 게가 바위 깊은 틈에 숨어 덜 움직여요', 'In cold winter crabs hide deep in rock cracks and move less') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('따뜻한 여름에는 게가 더 바쁘게 먹이를 찾아다녀요', 'In warm summer crabs scurry around more looking for food') }] },
  salt: { n: T2('소금꽃', 'Salt flowers'), v: [
    { k: 'spring', t: T2('봄', 'spring'), c: x => x.sea === 'spring', fact: T2('볕과 바람이 알맞은 봄은 소금이 많이 나는 때예요', 'Spring, with good sun and wind, is a time when lots of salt is made') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름 장마철에는 비가 잦아 소금을 거두지 못하는 날이 많아요', 'In the summer rainy season it rains often, so many days no salt can be gathered') },
    { k: 'autumn', t: T2('가을', 'autumn'), c: x => x.sea === 'autumn', fact: T2('가을에도 맑고 바람 부는 날이면 소금이 잘 맺혀요', 'In autumn too, clear windy days make good salt') }] },
  owl: { n: T2('밤의 부엉이', 'An owl at night'), v: [
    { k: 'winter', t: T2('겨울', 'winter'), c: x => x.sea === 'winter', fact: T2('부엉이는 늦가을부터 겨울 사이에 짝을 찾으며 더 자주 울어요', 'Owls call more often from late autumn into winter, looking for a mate') },
    { k: 'summer', t: T2('여름', 'summer'), c: x => x.sea === 'summer', fact: T2('여름밤에는 풀벌레 소리 사이로 부엉 소리가 섞여 들려요', 'On summer nights the hoots mix with the sound of insects in the grass') }] },
};

// ───────── ③ 잃어버린 물건(이웃이 하는 일과 어울리는 것 · 계절 물건은 그 계절만) ─────────
const LOSTI = [
  { e: '🧤', t: T2('목장갑', 'work gloves') }, { e: '🔑', t: T2('열쇠 꾸러미', 'bunch of keys') }, { e: '🧢', t: T2('모자', 'cap') }, { e: '👓', t: T2('안경', 'glasses') },
  { e: '📒', t: T2('일 수첩', 'work notebook') }, { e: '⌚', t: T2('손목시계', 'wristwatch') }, { e: '👛', t: T2('동전 지갑', 'coin purse') }, { e: '🧣', t: T2('목도리', 'scarf'), sea: 'winter' }];
const LOSTW = [T2('일하다 쉬던 자리에 떨어뜨린 것 같아요', 'I think I dropped it where I took a break'), T2('바람 부는 날 걷다가 흘린 것 같아요', 'I think it slipped out while I was walking on a windy day'), T2('심부름 가는 길에 잠깐 앉았던 데서 잃었어요', 'I lost it where I sat for a moment on an errand')];

// ───────── ④ 응용 물음(실험 표 두 줄을 이어야 풀림) — need = 'lf:법칙'(town_laws.js) · 'r:규칙'(town_chem.js RULES) ─────────
//   ch[0]이 늘 맞는 것(보일 때는 날마다 섞음 — 같은 자리 정답 세 번 연속 X) · res = 고른 자리에서 일어난 일 · lines = 이어지는 두 줄
export const APPS = [
  { id: 'icecool', ic: '🥤', who: T2('소풍 가는 이웃', 'A neighbour going on a picnic'), need: ['lf:melt', 'lf:freeze'], q: T2('얼린 음료를 점심때까지 덜 녹게 두고 싶대요. 어디에 둘까요?', 'They want the frozen drink to melt less by lunch. Where should it go?'),
    ch: [{ t: T2('🌳 나무 그늘 아래', '🌳 Under a shady tree') }, { t: T2('☀️ 햇볕 드는 돌 위', '☀️ On a sunny rock'), res: T2('햇볕을 받아 금방 녹아 미지근해졌어요.', 'The sun warmed it and it melted fast.') }, { t: T2('🔥 모닥불 곁', '🔥 By the campfire'), res: T2('불 곁은 햇볕보다 더 빨리 녹아요. 다 녹아 버렸어요.', 'By a fire it melts even faster than in the sun. It all melted.') }],
    lines: [T2('언 것은 0℃보다 따뜻하면 다시 녹아요.', 'Frozen things melt again when it is warmer than 0℃.'), T2('그늘보다 햇볕, 햇볕보다 불 곁에서 더 빨리 녹아요.', 'Things melt faster in sun than in shade, and faster by a fire than in sun.')] },
  { id: 'saltroad', ic: '🧂', who: T2('학교 앞 가게 주인', 'The shopkeeper by the school'), need: ['lf:deice', 'lf:dissolve'], q: T2('밤새 언 눈길에 쓸 소금이 한 봉지 있어요. 어디에 뿌릴까요?', 'There is one bag of salt for the frozen snowy road. Where should it go?'),
    ch: [{ t: T2('❄️ 사람들이 오가는 비탈길', '❄️ The slope where people walk') }, { t: T2('🌊 길옆 도랑물', '🌊 The ditch water by the road'), res: T2('소금이 물에 녹아 퍼져 버렸어요. 길은 그대로 미끄러워요.', 'The salt dissolved and spread in the water. The road is still slippery.') }, { t: T2('🌱 아무도 안 지나는 풀밭', '🌱 The grass nobody walks on'), res: T2('풀밭 눈은 녹았지만 사람들이 걷는 길은 그대로 미끄러워요.', 'The snow on the grass melted, but the path people use is still slippery.') }],
    lines: [T2('소금이 섞이면 눈과 얼음이 녹아요.', 'Salt mixed in makes snow and ice melt.'), T2('물에 넣은 소금은 녹아서 물속으로 퍼져요.', 'Salt put in water dissolves and spreads through it.')] },
  { id: 'fishdry', ic: '🐟', who: T2('바닷가 어부', 'A fisher by the sea'), need: ['lf:dry', 'r:dry'], q: T2('오늘은 맑고 바람이 불어요. 생선을 어디에 널어 말릴까요?', 'Today is clear and windy. Where should the fish be hung to dry?'),
    ch: [{ t: T2('☀️ 볕 들고 바람 부는 덕장', '☀️ A sunny, breezy drying rack') }, { t: T2('🏠 그늘진 창고 안', '🏠 Inside a shady shed'), res: T2('햇볕도 바람도 없어 물기가 잘 안 빠졌어요.', 'No sun and no wind — the water hardly left.') }, { t: T2('🌊 물보라 치는 바위 위', '🌊 On a rock in the sea spray'), res: T2('물보라에 다시 젖어서 더 오래 걸려요.', 'The spray wet it again, so it will take longer.') }],
    lines: [T2('햇볕과 바람이 물기를 날려 음식을 오래 두고 먹게 해요.', 'Sun and wind take the water out so food keeps long.'), T2('젖은 것의 물은 열을 받으면 수증기가 되어 날아가요.', 'Water in wet things turns to vapour and leaves when warmed.')] },
  { id: 'raft', ic: '🥔', who: T2('윗마을 농부', 'A farmer from upstream'), need: ['lf:sink', 'lf:current'], q: T2('감자 한 자루를 강 아랫마을에 보내고 싶대요. 어떻게 할까요?', 'They want to send a sack of potatoes to the village down the river. How?'),
    ch: [{ t: T2('🌲 나무 뗏목에 실어 강물에 띄운다', '🌲 Load them on a wooden raft and float it') }, { t: T2('🥔 감자를 하나씩 강물에 던진다', '🥔 Throw the potatoes in one by one'), res: T2('감자는 같은 크기의 물보다 무거워 가라앉았어요.', 'Potatoes are heavier than the same amount of water, so they sank.') }, { t: T2('⬆️ 뗏목을 산 쪽 윗마을로 띄운다', '⬆️ Float the raft up towards the hills'), res: T2('강물은 높은 곳에서 낮은 곳으로 흘러요. 뗏목이 아래로 밀려 내려왔어요.', 'River water flows from high to low. The raft was pushed back down.') }],
    lines: [T2('같은 크기의 물보다 무거운 것은 가라앉고, 나무는 떠요.', 'Things heavier than the same amount of water sink; wood floats.'), T2('강물은 높은 곳에서 낮은 곳으로 흘러요.', 'River water flows from high to low.')] },
  { id: 'campend', ic: '🏕', who: T2('캠핑장 관리인', 'The campsite keeper'), need: ['lf:fuel', 'r:fire'], q: T2('캠핑이 끝났어요. 모닥불 곁에 마른 솔방울이 쌓여 있어요. 무엇부터 할까요?', 'Camping is over. Dry pine cones are piled by the fire. What first?'),
    ch: [{ t: T2('💧 솔방울을 치우고 불에 물을 붓는다', '💧 Move the cones away and pour water on the fire') }, { t: T2('🌰 솔방울을 불에 더 넣는다', '🌰 Put more cones on the fire'), res: T2('마른 솔방울은 땔감이라 불이 더 커졌어요.', 'Dry cones are fuel, so the fire grew bigger.') }, { t: T2('🚶 그대로 두고 집에 간다', '🚶 Leave it and go home'), res: T2('남은 불씨가 솔방울로 옮겨붙을 수 있어요. 관리인이 서둘러 불을 껐어요.', 'Embers could spread to the cones. The keeper hurried to put it out.') }],
    lines: [T2('마른 가지·솔방울은 불을 키우는 땔감이에요.', 'Dry twigs and cones are fuel that makes fire bigger.'), T2('물이 불의 열을 빼앗아 불이 꺼져요.', 'Water takes the heat away and the fire goes out.')] },
  { id: 'coldshed', ic: '🥛', who: T2('밭 일하는 할머니', 'A grandmother who farms'), need: ['lf:freeze', 'lf:hardy'], q: T2('오늘 밤 영하로 내려간대요. 바깥 창고에 배추와 우유가 있어요. 하나만 집 안으로 들일 수 있어요.', 'It will drop below zero tonight. The shed has cabbage and milk. Only one can come inside.'),
    ch: [{ t: T2('🥛 우유를 들인다', '🥛 Bring in the milk') }, { t: T2('🥬 배추를 들인다', '🥬 Bring in the cabbage'), res: T2('배추는 추위에 강해 괜찮았지만, 밖에 둔 우유가 꽁꽁 얼었어요.', 'The cabbage would have been fine in the cold, but the milk left outside froze solid.') }, { t: T2('🚪 둘 다 밖에 둔다', '🚪 Leave both outside'), res: T2('밤사이 우유가 꽁꽁 얼었어요.', 'The milk froze solid overnight.') }],
    lines: [T2('물이 든 것은 0℃ 아래에서 얼어요.', 'Things with water in them freeze below 0℃.'), T2('배추는 추위에 강해 서리를 맞아도 잘 버텨요.', 'Cabbage stands the cold and survives frost.')] },
  { id: 'eggpick', ic: '🥚', who: T2('빵집 주인', 'The baker'), need: ['lf:egg', 'lf:float'], q: T2('싱싱한 달걀로 빵을 굽고 싶대요. 물그릇에 달걀 셋을 넣어 봤어요. 어느 것일까요?', 'They want fresh eggs for bread. Three eggs went into a bowl of water. Which one?'),
    ch: [{ t: T2('⬇️ 바닥에 가라앉은 달걀', '⬇️ The egg lying on the bottom') }, { t: T2('⬆️ 물 위로 뜬 달걀', '⬆️ The egg floating on top'), res: T2('속에 공기 주머니가 커진 오래된 달걀이었어요.', 'It was an old egg with a big air pocket inside.') }, { t: T2('↕️ 바닥에서 비스듬히 선 달걀', '↕️ The egg standing up on the bottom'), res: T2('공기 주머니가 커지기 시작한 달걀이에요. 가장 싱싱하진 않아요.', 'Its air pocket is starting to grow. It is not the freshest.') }],
    lines: [T2('싱싱한 달걀은 가라앉고, 오래되면 속에 공기가 생겨 떠요.', 'Fresh eggs sink; older eggs get air inside and float.'), T2('같은 크기의 물보다 가벼운 것은 물에 떠요.', 'Things lighter than the same amount of water float.')] },
  { id: 'seedwind', ic: '🌼', who: T2('공원 관리인', 'The park keeper'), need: ['lf:wind', 'r:seed'], wind: 1, q: T2('빈 꽃밭에 민들레 홀씨가 날아가 앉게 하고 싶대요. 오늘은 {w}이에요({d}쪽에서 불어 와요). 꽃밭 어느 쪽에 서서 불까요?', 'They want dandelion seeds to land in the empty flower bed. Today the wind blows from the {d}. Which side of the bed should you blow from?'),
    ch: [], lines: [T2('가벼운 홀씨는 바람이 부는 쪽으로 날아가요.', 'Light seeds fly the way the wind blows.'), T2('바람은 불어 오는 쪽 이름으로 불러요(북풍 = 북쪽에서 불어 옴).', 'Winds are named for where they come from (a north wind comes from the north).')] },
  { id: 'rainwalk', ic: '☂', who: T2('우체국 집배원', 'The mail carrier'), need: ['lf:umbwind', 'lf:bikeumb'], q: T2('비바람이 센 날 편지를 돌려야 해요. 어떻게 가면 좋을까요?', 'Letters must go out on a windy, rainy day. What is the best way?'),
    ch: [{ t: T2('🔙 바람을 등지고 우산을 든다', '🔙 Keep your back to the wind with the umbrella') }, { t: T2('💨 바람을 마주 보고 우산을 든다', '💨 Face the wind with the umbrella'), res: T2('바람이 우산 안으로 밀고 들어와 뒤집혔어요.', 'The wind rushed under the umbrella and flipped it.') }, { t: T2('🚲 자전거를 타며 한 손에 우산을 든다', '🚲 Ride a bike holding the umbrella in one hand'), res: T2('한 손으로는 멈추고 피하기 어려워요. 비틀거리다 내렸어요.', 'With one hand it is hard to stop and steer. It wobbled and had to stop.') }],
    lines: [T2('센 바람을 마주 보면 우산 안으로 공기가 밀고 들어와 뒤집혀요.', 'Facing a strong wind, air rushes under an umbrella and flips it.'), T2('자전거는 두 손으로 핸들을 잡아야 해요 — 비 오는 날엔 우비.', 'On a bike you need both hands — wear a raincoat in the rain.')] },
  { id: 'dough', ic: '🍞', who: T2('빵집 주인', 'The baker'), need: ['lf:yeast', 'lf:ondol'], q: T2('겨울 아침, 반죽을 빨리 부풀리고 싶대요. 어디에 둘까요?', 'On a winter morning they want the dough to rise fast. Where should it go?'),
    ch: [{ t: T2('🔥 불 땐 온돌 방바닥 곁', '🔥 By the warm ondol floor') }, { t: T2('❄️ 바깥 창틀', '❄️ On the outside window sill'), res: T2('차가운 곳에선 효모가 천천히 부풀려요. 점심까지도 덜 부풀었어요.', 'In the cold the yeast works slowly. It still had not risen by lunch.') }, { t: T2('🏠 불 안 땐 찬 부엌 구석', '🏠 A cold corner of the unheated kitchen'), res: T2('찬 곳이라 반죽이 아주 조금만 부풀었어요.', 'It was cold there, so the dough barely rose.') }],
    lines: [T2('효모는 따뜻한 곳에서 반죽을 빨리 부풀려요.', 'Yeast makes dough rise fast somewhere warm.'), T2('달군 돌(구들장)은 열을 오래 품어요 — 온돌.', 'Heated stones hold heat a long time — ondol.')] },
];
const W4 = [{ d: T2('북', 'north'), w: T2('북풍', 'north wind') }, { d: T2('동', 'east'), w: T2('동풍', 'east wind') }, { d: T2('남', 'south'), w: T2('남풍', 'south wind') }, { d: T2('서', 'west'), w: T2('서풍', 'west wind') }];
const SIDE = [T2('⬆️ 꽃밭 북쪽', '⬆️ North side of the bed'), T2('➡️ 꽃밭 동쪽', '➡️ East side of the bed'), T2('⬇️ 꽃밭 남쪽', '⬇️ South side of the bed'), T2('⬅️ 꽃밭 서쪽', '⬅️ West side of the bed')];
const needOk = (S, n) => { const c = obj(S.chem) || {}, [k, id] = n.split(':'); return k === 'lf' ? !!(obj(c.lf) || {})[id] : !!(obj(c.found) || {})[id]; };
export const appsFor = S => APPS.filter(a => a.need.every(n => needOk(S || {}, n)));

// 마을 쪽이 넘기는 것(A): map · GAME · lang() · esc · on() · busy() · panel() · openP · closeP · chip(k, t, o) · say(t, s) · diary(e, t) · skUp(k, n, src)
//   auto() 날씨 자동인가 · rainY() 어제 비 · sea() 놀이 계절 · wx() 지금 날씨 · night() · wait(분) 같은 날 앞으로 · owners() [{ hk, who, k }] · heart(hk, n, src)
//   xp() 탐험 땅(층층골이 있나 · 흙더미 다시 놓기) · surpIds() 이 마을에 켜진 놀람 id
export function createRegen(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, mark = () => A.GAME.mark();
  let dead = false, chipOn = '', mq = 0;
  const S = () => { const g = G(); let s = obj(g.regen); if (!s || s.v !== REGEN_V) s = g.regen = { v: REGEN_V };
    if (!obj(s.pd)) s.pd = {}; if (!Array.isArray(s.spec)) s.spec = []; if (!obj(s.sv)) s.sv = {}; if (!obj(s.lost)) s.lost = {}; if (!Array.isArray(s.lost.h)) s.lost.h = []; if (!Array.isArray(s.lost.o)) s.lost.o = [];
    if (!obj(s.app)) s.app = {}; if (!Array.isArray(s.app.h)) s.app.h = []; if (!Array.isArray(s.app.ph)) s.app.ph = []; if (s.fos !== null && !obj(s.fos)) s.fos = null; s.fn = s.fn | 0; return s; };
  const XS = () => { const g = G(); let x = obj(g.xp); if (!x) x = g.xp = {}; if (!obj(x.fos)) x.fos = {}; if (!obj(x.st)) x.st = {}; if (!Array.isArray(x.col)) x.col = []; return x; };
  /* 나의 길 걸음 = 그날 처음 다시 살아난 것 하나 */
  function step(k) { const s = S(), d = day(); if (s.pd[d]) return false; s.pd[d] = k; const ks = Object.keys(s.pd).map(Number).sort((a, b) => a - b); while (ks.length > 120) delete s.pd[ks.shift()]; mark(); return true; }
  const ctx = () => { const m = G().min | 0; return { sea: SEA[A.sea()] || null, wx: A.wx(), rainY: !!A.rainY(), night: m < 360 || m >= 1140 }; };

  // ── ① 화석 ──
  const fosAll = () => FINDS.every(f => XS().fos[f.id]);
  function fosRoll(o) { o = o || {}; const s = S(), d = day(), X = XS(); if (s.fd === d) return false; if (!fosAll()) return false; if (!(o.auto ?? A.auto()) || !(o.rainY ?? A.rainY())) return false;
    if (s.fos && (X.st.rg | 0) < 3) return false;   /* 앞 흙더미를 아직 안 팠으면 그대로(쌓이지 않음) */
    if (A.xp && !(A.xp() && A.xp().on)) return false;
    const R = rng('regen-fos:' + d), last = s.spec.slice(-2).map(q => q.f), pool = FINDS.filter(f => !last.includes(f.id)), F = pool[(R() * pool.length) | 0] || FINDS[0];
    const lu = s.fos ? s.fos.u : -1, us = RU.filter(u => u !== lu), u = us[(R() * us.length) | 0];
    s.fn += 1; s.fos = { d, u, f: F.id, n: s.fn }; s.fd = d; X.st.rg = 0; mark(); if (A.xp && A.xp()) A.xp().regen(); return true; }
  function fosSite() { const s = S(); if (!s.fos) return null; const F = FINDS.find(f => f.id === s.fos.f); if (!F) return null; const sp = specOf(s.fos, false); return { id: 'rg', u: s.fos.u, band: F.band, ic: F.ic, mk: F.id, t: sp.t, line: sp.line, n: s.fos.n }; }
  function fosDone() { const s = S(); if (!s.fos) return null; const n = s.fos.n; if (!s.spec.some(q => q.n === n)) { s.spec.push({ n, f: s.fos.f, d: day() }); while (s.spec.length > 40) s.spec.shift(); const sp = specOf(s.fos, false); step('look'); A.diary('🦴', '층층골 벽 밑 새 흙더미에서 ' + sp.t[0] + jo(sp.t[0], '을', '를') + ' 찾았어요'); mark(); } return specOf(s.fos, en()); }
  const specs = () => S().spec.map(q => specOf(q, en())).filter(Boolean);
  const specF = id => { const n = +String(id).slice(1); const q = S().spec.find(r => r.n === n) || (S().fos && S().fos.n === n ? S().fos : null); return q ? specOf(q, en()) : null; };

  // ── ② 놀람 변주 ──
  function surpAgain(id, o) { const s = S(), d = day(); if (s.svd === d) return null; const V = SVAR[id]; if (!V) return null; const c = { ...ctx(), ...(o || {}) }, seen = arr(s.sv[id]), v = V.v.find(q => !seen.includes(q.k) && q.c(c)); if (!v) return null;
    s.sv[id] = seen.concat(v.k); s.svd = d; step('explore'); A.diary('👀', '다시 본 ' + V.n[0] + ' · ' + v.t[0] + ' — ' + v.fact[0]); mark();
    return { ban: en() ? 'Again: ' + V.n[1] + ' · ' + v.t[1] : '다시 본 ' + V.n[0] + ' · ' + v.t[0], fact: L(v.fact), k: v.k }; }
  function surpAsk(o) { const s = S(), X = obj(G().xp) || {}, got = obj(X.surp) || {}, ids = A.surpIds ? A.surpIds() : []; if (!ids.length || !ids.every(id => got[id])) return null;
    const c = { ...ctx(), ...(o || {}) }, R = rng('regen-ask:' + day()), C = []; for (const id of ids) { const V = SVAR[id]; if (!V) continue; const v = V.v.find(q => !arr(s.sv[id]).includes(q.k) && q.c(c)); if (v) C.push([V, v]); } if (!C.length) return null;
    const [V, v] = C[(R() * C.length) | 0]; return en() ? '👀 It is ' + v.t[1] + ' today. If you saw the ' + V.n[1].toLowerCase() + ' again now, how would it be different?' : '👀 오늘은 ' + v.t[0] + jo(v.t[0], '이에요', '예요') + '. 전에 본 「' + V.n[0] + '」' + jo(V.n[0], '을', '를') + ' 오늘 다시 보면 무엇이 다를까요?'; }
  function surpRows() { const s = S(), o = []; for (const id of Object.keys(s.sv)) { const V = SVAR[id]; if (!V) continue; for (const k of arr(s.sv[id])) { const v = V.v.find(q => q.k === k); if (v) o.push([V, v]); } } return o; }

  // ── ③ 잃어버린 물건 지도 ──
  function lostPick(cands) { const s = S(), d = day(), R = rng('regen-lost:' + d), L9 = s.lost, H = L9.h.slice(-4), O = A.owners ? A.owners() : []; if (!O.length || !cands.length) return null;
    const pool = cands.filter(c => !H.includes(c.k)), P = pool.length ? pool : cands.filter(c => c.k !== H[H.length - 1]), C = P.length ? P : cands;
    const sh = C.slice(); for (let i = sh.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [sh[i], sh[j]] = [sh[j], sh[i]]; }
    const oo = O.filter(w => !L9.o.slice(-3).includes(w.hk)), ow = (oo.length ? oo : O)[(R() * (oo.length || O.length)) | 0], sea = SEA[A.sea()] || '', IT = LOSTI.filter(q => !q.sea || q.sea === sea), it = IT[(R() * IT.length) | 0];
    return { order: sh, owner: ow, it: { e: it.e, t: it.t }, why: LOSTW[(R() * LOSTW.length) | 0], r: R }; }
  function lostFound(c) { const s = S(), L9 = s.lost, lo = c.lost; L9.h.push(c.k); while (L9.h.length > 8) L9.h.shift(); L9.o.push(lo.hk); while (L9.o.length > 6) L9.o.shift(); L9.n = (L9.n | 0) + 1; L9.d = day();
    const up = A.heart ? A.heart(lo.hk, 2, 'tmap:lost') : 0; A.skUp('explore', 2, 'tmap:lost'); step('nb'); A.diary('🗺', lo.who[0] + '의 ' + lo.it.t[0] + jo(lo.it.t[0], '을', '를') + ' 지도를 읽고 찾아 돌려줬어요'); mark(); return up; }

  // ── ④ 응용 물음 ──
  function appToday() { const s = S(), a = s.app, d = day(); if (a.d === d) return APPS.find(q => q.id === a.id) || null; const E = appsFor(G()); if (!E.length) return null;
    const R = rng('regen-app:' + d), fresh = E.filter(q => !a.h.includes(q.id)), back = E.filter(q => !a.h.slice(-3).includes(q.id)), P = fresh.length ? fresh : back.length ? back : E, Q = P[(R() * P.length) | 0];
    const n = Q.wind ? 3 : Q.ch.length, ph = a.ph.slice(-2); let pos = (R() * n) | 0; if (ph.length === 2 && ph[0] === ph[1] && pos === ph[0]) pos = (pos + 1 + ((R() * (n - 1)) | 0)) % n;   /* 같은 자리 정답 세 번 연속 X */
    a.d = d; a.id = Q.id; a.ok = 0; a.pos = pos; a.tries = []; a.wind = (R() * 4) | 0; a.ord = null; mark(); return Q; }
  function appChoices(Q) { const a = S().app; if (Q.wind) { const w = a.wind, up = w, R = rng('regen-side:' + a.d), others = [0, 1, 2, 3].filter(k => k !== up), pick = []; while (pick.length < 2) { const k = others.splice((R() * others.length) | 0, 1)[0]; pick.push(k); }
      const fly = (w + 2) % 4, mk = k => ({ t: SIDE[k], res: k === fly ? T2('홀씨가 바람을 따라 꽃밭 반대쪽 바깥으로 날아갔어요.', 'The seeds blew away from the bed, out the far side.') : T2('홀씨가 꽃밭 옆을 스쳐 지나갔어요.', 'The seeds blew past the side of the bed.') }), C = pick.map(mk); C.splice(a.pos, 0, { t: SIDE[up], ok: 1 }); return C; }
    const rest = Q.ch.slice(1), C = rest.slice(); C.splice(a.pos, 0, { ...Q.ch[0], ok: 1 }); return C.map(c => (c.res ? c : { ...c, ok: 1 })); }
  const appLeft = () => { const a = S().app; return !!appToday() && !(a.d === day() && a.ok); };
  function appOpen() { const Q = appToday(); if (!Q) { A.map.hud.toast(en() ? '🧪 No question today — find more experiment rules first' : '🧪 오늘은 물음이 없어요. 실험 규칙을 더 알아내면 생겨요', 3); return null; } const a = S().app, e = en(), C = appChoices(Q), W = W4[a.wind];
    const q = L(Q.q).replace('{w}', L(W.w)).replace('{d}', L(W.d)), tried = arr(a.tries);
    const body = a.ok ? '<div class="sm"><b>' + (e ? 'You worked it out.' : '알아냈어요.') + '</b> ' + esc(e ? 'Two rules joined:' : '이어진 두 줄:') + '</div>' + Q.lines.map(l => '<div class="st"><b class="n">🔬</b><span>' + esc(L(l)) + '</span></div>').join('') + '<div class="sm">' + (e ? 'A new question comes tomorrow.' : '내일 새 물음이 와요.') + '</div>'
      : '<div class="sm">' + (e ? 'Pick a spot. Think about two rules you found.' : '자리를 골라요. 알아낸 규칙 두 가지를 이어 생각해요.') + '</div><div class="row" style="flex-direction:column;align-items:stretch">' + C.map((c, i) => '<button class="' + (tried.includes(i) ? 'sub' : '') + '" data-c="' + i + '"' + (tried.includes(i) ? ' disabled style="opacity:.55"' : '') + '>' + esc(L(c.t)) + '</button>').join('') + '</div>'
        + (tried.length ? '<div class="sm">' + esc(L(C[tried[tried.length - 1]].res || T2('', ''))) + ' ' + (e ? 'Getting ready again took 20 minutes.' : '다시 준비하느라 20분이 지났어요.') + '</div>' : '');
    const P = A.openP('<h3>🧪 ' + (e ? 'Question of the day' : '오늘의 물음') + '</h3><div class="st"><b class="n">' + Q.ic + '</b><span><b>' + esc(L(Q.who)) + '</b><br>' + esc(q) + '</span></div>' + body + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'regen');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.c != null) { appAnswer(+b.dataset.c); appOpen(); } }; return P; }
  function appAnswer(i) { const Q = appToday(), a = S().app; if (!Q || a.ok) return null; const C = appChoices(Q), c = C[i]; if (!c) return null;
    if (c.ok) { a.ok = 1; a.h.push(Q.id); while (a.h.length > 20) a.h.shift(); a.ph.push(a.pos); while (a.ph.length > 4) a.ph.shift(); A.skUp('look', 2, 'chem:app'); step('look'); A.diary('🧪', L(Q.who) + '의 물음을 실험 규칙 두 줄로 풀었어요'); A.map.sfx && A.map.sfx('ding'); mark(); chip(); return true; }
    if (!a.tries.includes(i)) { a.tries.push(i); if (A.wait) A.wait((G().min | 0) + 20); } mark(); return false; }
  function chip() { const want = !dead && A.on() && appLeft() ? 'app' : ''; if (want === chipOn) return; chipOn = want; if (want) A.chip('twn-regen', '🧪 ' + (en() ? 'Question of the day' : '오늘의 물음'), { onClick: () => { if (A.busy() || A.panel()) return; appOpen(); } }); else A.chip('twn-regen', null); }

  // ── 하루 넘김 · 1초 칸 ──
  function dayRun(o) { if (dead || !A.on()) return []; const out = [];
    if (fosRoll(o)) out.push(en() ? '🦴 Heavy rain yesterday wore away part of the Layer Gorge wall. A new soil heap lies at its foot.' : '🦴 어제 비에 층층골 벽이 조금 깎여 무너졌대요. 벽 밑에 새 흙더미가 생겼어요.');
    const ak = surpAsk(); if (ak) out.push(ak);
    if (appToday() && appLeft()) out.push(en() ? '🧪 A neighbour has a question for you — tap 「Question of the day」' : '🧪 이웃이 물어볼 것이 있대요. 「오늘의 물음」을 눌러요');
    chip(); return out; }
  function dayEv() { const L9 = dayRun(); L9.forEach((t, i) => setTimeout(() => { if (!dead && A.on() && !A.busy()) A.say(t, 4.5); }, 4200 + i * 5200)); }
  function sec() { if (dead) return; if ((mq += 1) < 3) return; mq = 0; chip(); }
  function dispose() { dead = true; A.chip('twn-regen', null); chipOn = ''; }
  const api = { state: () => JSON.parse(JSON.stringify(S())), roll: o => fosRoll(o), dayRun: o => dayRun(o), again: (id, o) => surpAgain(id, o), ask: o => surpAsk(o), app: () => { const Q = appToday(); return Q ? { id: Q.id, pos: S().app.pos, ok: !!S().app.ok, n: appChoices(Q).length, ch: appChoices(Q).map(c => L(c.t)) } : null; }, answer: i => appAnswer(i), appOpen: () => appOpen(), apps: () => appsFor(G()).map(q => q.id), chip: () => chipOn };
  return { day: dayEv, sec, dispose, api, fosSite, fosDone, specs, specF, surpAgain, surpRows, lostPick, lostFound, appOpen, has: () => !!(S().spec.length || Object.keys(S().sv).length || S().lost.n || S().app.h.length) };
}
