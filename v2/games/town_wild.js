// 🦌 마을 야생동물(WILD-1 · 사용자 10-19 '야생동물이 너무 없긴 하네' · docs/systems/town_wild.md): 놀이 코드와 떼어 둔 자료·모양·행동(곤충 town_bugs.js · 갯벌 town_shore.js와 같은 결)
//   종 = 우리나라 산·강·논·연못·큰 나무에 사는 동물 아홉 — 사실만(지어낸 이야기 X) · 마을에 그 서식지가 없으면 안 나옴 · 놀이 계절(seaPlay)·때가 맞을 때만
//   모양 = 상자·공·뿔을 JS로 합쳐 town_anim.js 인스턴스 셰이더(풀 뜯기·걷기·두리번 + 날기·뜀·달리기)에 def · 종마다 인스턴스 메시 하나(그리기 +1 · 없으면 0) · 새 Light X
//   행동(야숨 결) = 뛰면 12m에서 달아남 · 걸으면 5m에서 알아채 고개를 들고 3m 안이면 달아남 · 쪼그리면(C) 1.5m까지 · 새는 날아올라 다른 물가로 · 개구리는 물로 · 수달은 물속으로 · 다람쥐는 나무 위로
//   우리반RPG '손님 도감' 결(10-19): 못 만난 칸 = 실루엣 + 때·곳 귀띔 · 첫 만남 ★ 스티커 · 가만히(쪼그려 3초) 있으면 겁 많은 동물이 먼저 다가옴 · 같은 동물 10번 ⭐ · 30번 ⭐⭐ · 모두 ⭐⭐ = 칭호 '들판 관찰가'(순위·견주기 X)
//   일 = 1초 칸(내 둘레 80m 안 12마리 고르기 · E 자리 옮기기) + 20m 안에 있을 때만 0.1초 판정 + 움직이는 몇 초만 매 프레임(보통 0~2마리) · 매 프레임 새 객체 X
export const WILD_V = 1;
const ALL = ['spring', 'summer', 'autumn', 'winter'], WARM = ['spring', 'summer', 'autumn'];
// 종: hab 사는 곳(자리 고르는 규칙) · sea 나오는 계절 · time day(낮·노을) | night(밤·노을·새벽) | any · flee 달아나는 꼴 · sc 그림 크기(작은 동물은 3인칭 화면에서 보이게 키움) · ga 이름 뒤 '이/가'
//   카드 = look 생김새 · live 사는 곳 · food 먹이 · win 겨울나기 · care 지키는 법(사회 — 먹이 주지 않기 · 멀리서 보기 · 멸종 위기 · 로드킬) — 일반 도감에 널리 실린 사실을 4학년 말로
export const WILD = [
  { id: 'chipmunk', emo: '🐿', t: ['다람쥐', 'Chipmunk'], ga: ['가', ''], hab: 'tree', sea: WARM, time: 'day', flee: 'climb', sc: 2.3, cap: 6, come: 1,
    look: ['등에 검은 줄무늬가 다섯 개 있어요. 볼주머니에 먹이를 가득 넣어 날라요.', 'Five dark stripes run down its back. It carries food in its cheek pouches.'],
    live: ['산과 숲에 살아요. 땅속에 굴을 파서 집을 만들고, 나무도 잘 타요.', 'Lives in hills and woods. It digs a burrow in the ground and climbs trees well.'],
    food: ['도토리·밤 같은 나무 열매와 씨앗, 작은 곤충을 먹어요.', 'Acorns, chestnuts, seeds and small insects.'],
    win: ['가을에 굴에 먹이를 모아 두고 겨울잠을 자요. 가끔 깨어 모아 둔 먹이를 먹어요.', 'It stores food in its burrow in autumn and hibernates, waking now and then to eat.'],
    care: ['도토리는 다람쥐의 겨울 먹이예요. 산에서 도토리를 주워 가지 않아요.', 'Acorns are its winter food, so we leave them in the forest.'] },
  { id: 'waterdeer', emo: '🦌', t: ['고라니', 'Water deer'], ga: ['가', ''], hab: 'edge', sea: ALL, time: 'any', flee: 'bound', sc: 1, cap: 4, come: 1,
    look: ['사슴 무리인데 뿔이 없어요. 수컷은 입 밖으로 긴 송곳니가 나와 있어요.', 'A kind of deer with no antlers. Males have long tusks that stick out of the mouth.'],
    live: ['산기슭, 강가 풀숲, 논밭 가까이 살아요. 우리나라와 중국에 주로 살아요.', 'Lives at the foot of hills, in riverside grass and near fields — mostly in Korea and China.'],
    food: ['풀, 나뭇잎, 어린 싹을 먹어요.', 'Grass, leaves and young shoots.'],
    win: ['겨울잠을 자지 않아요. 겨울에도 마른 풀을 찾아 먹으며 지내요.', 'It does not hibernate. In winter it looks for dry grass to eat.'],
    care: ['길을 건너다 차에 치이는 일(로드킬)이 아주 많아요. 산 가까운 길에서는 차가 천천히 달리고, 동물이 다니는 생태 통로를 만들어요.', 'Many are hit by cars while crossing roads. Cars should slow down near hills, and eco-bridges help them cross.'] },
  { id: 'heron', emo: '', t: ['왜가리', 'Grey heron'], ga: ['가', ''], hab: 'river', sea: ALL, time: 'day', flee: 'fly', sc: 1, cap: 5, come: 1, bird: 1,
    look: ['회색 몸에 목과 다리가 길고, 머리에 검은 깃이 있어요. 날 때는 목을 S자로 접어요.', 'Grey body, long neck and legs, a black plume on the head. It folds its neck into an S when flying.'],
    live: ['강과 냇가, 논, 저수지 같은 물가에 살아요. 높은 나무 위에 여럿이 모여 둥지를 지어요.', 'Lives by rivers, streams, rice fields and reservoirs. Many nest together high in tall trees.'],
    food: ['물고기, 개구리, 가재를 먹어요. 물가에 가만히 서 있다가 부리로 재빨리 잡아요.', 'Fish, frogs and crayfish. It stands still at the water and strikes fast with its beak.'],
    win: ['겨울에 남쪽으로 가는 왜가리도 있지만, 우리나라에 남아 겨울을 나는 왜가리도 많아요.', 'Some fly south for winter, but many stay in Korea.'],
    care: ['강에 낚싯줄이나 쓰레기를 버리지 않아요. 새 다리에 감기면 크게 다쳐요.', 'Never leave fishing line or litter by the river — it can wrap around a bird’s legs.'] },
  { id: 'otter', emo: '', t: ['수달', 'Otter'], ga: ['이', ''], hab: 'river', sea: ALL, time: 'night', flee: 'dive', sc: 1, cap: 3, come: 1, clean: 1,
    look: ['몸이 길고 다리가 짧아요. 발가락 사이에 물갈퀴가 있어 헤엄을 잘 쳐요.', 'A long body and short legs. Webbed toes make it a great swimmer.'],
    live: ['맑은 강과 냇가에 살아요. 주로 밤과 새벽에 움직이고, 낮에는 물가 굴에서 쉬어요.', 'Lives by clean rivers and streams. It moves mostly at night and dawn and rests in a den by day.'],
    food: ['물고기, 개구리, 가재를 먹어요.', 'Fish, frogs and crayfish.'],
    win: ['겨울잠을 자지 않아요. 털이 촘촘해서 차가운 물에서도 헤엄쳐요.', 'It does not hibernate. Thick fur keeps it warm in cold water.'],
    care: ['멸종 위기 야생생물 Ⅰ급이고 천연기념물이에요. 깨끗한 강이 있어야 살 수 있어요.', 'It is an endangered species (class I) and a natural monument in Korea. It needs clean rivers.'] },
  { id: 'mallard', emo: '🦆', t: ['청둥오리', 'Mallard'], ga: ['가', ''], hab: 'water', sea: ['winter'], time: 'day', flee: 'fly', sc: 1.1, cap: 5, come: 1, bird: 1, float: 1,
    look: ['수컷은 머리가 반짝이는 초록색이고 목에 흰 띠가 있어요. 암컷은 갈색 얼룩무늬예요.', 'Males have a shiny green head and a white neck ring. Females are mottled brown.'],
    live: ['강, 호수, 저수지, 논에서 지내요.', 'Lives on rivers, lakes, reservoirs and rice fields.'],
    food: ['물풀, 풀씨, 낟알, 작은 벌레를 먹어요. 물속에 머리를 넣어 먹이를 찾아요.', 'Water plants, seeds, grain and small bugs. It dips its head underwater to find food.'],
    win: ['겨울 철새예요. 가을에 북쪽 추운 나라에서 날아와 우리나라에서 겨울을 나고, 봄에 돌아가요.', 'A winter visitor: it flies in from the cold north in autumn and leaves in spring.'],
    care: ['빵이나 과자를 던져 주지 않아요. 새 몸에 좋지 않고 물도 더러워져요.', 'Don’t throw bread or snacks — they are bad for birds and dirty the water.'] },
  { id: 'spotbill', emo: '🦆', t: ['흰뺨검둥오리', 'Spot-billed duck'], ga: ['가', ''], hab: 'pond', sea: ALL, time: 'day', flee: 'fly', sc: 1.1, cap: 4, come: 1, bird: 1, float: 1,
    look: ['몸은 갈색이고 얼굴은 희어요. 검은 부리 끝이 노래요.', 'Brown body and a pale face. Its black bill has a yellow tip.'],
    live: ['연못, 냇가, 강, 논에 살아요.', 'Lives on ponds, streams, rivers and rice fields.'],
    food: ['물풀, 풀씨, 낟알, 작은 벌레를 먹어요.', 'Water plants, seeds, grain and small bugs.'],
    win: ['우리나라에서 일 년 내내 사는 텃새예요. 겨울에는 북쪽에서 온 무리도 함께 지내요.', 'It lives in Korea all year round. In winter, flocks from the north join them.'],
    care: ['새끼를 데리고 다닐 때는 쫓아가지 않고 길을 비켜 줘요. 먹이는 주지 않아요.', 'When it leads its ducklings, give them room and don’t chase. No feeding.'] },
  { id: 'frog', emo: '🐸', t: ['참개구리', 'Black-spotted pond frog'], ga: ['가', ''], hab: 'paddyEdge', reed: 1, sea: WARM, time: 'any', flee: 'hop', sc: 2.8, cap: 6, bird: 2,
    look: ['초록·갈색 몸에 검은 무늬가 있고, 등 가운데에 연한 줄이 있어요.', 'Green-brown with black spots and a pale stripe down the middle of the back.'],
    live: ['논, 연못, 물가 풀숲에 살아요. 알 → 올챙이 → 개구리로 자라요. 늦봄과 여름밤에 우는 것은 수컷이에요. 짝을 부르는 소리예요.', 'Lives in rice fields, ponds and grassy banks. Egg → tadpole → frog. On late-spring and summer nights the males call to find a mate.'],
    food: ['곤충, 거미, 지렁이 같은 작은 동물을 혀로 잡아먹어요.', 'Insects, spiders and worms, caught with its tongue.'],
    win: ['겨울에는 땅속이나 물 밑 진흙 속에서 겨울잠을 자요.', 'It hibernates underground or in mud under water.'],
    care: ['개구리 피부는 얇고 약해요. 만지지 않고 눈으로만 봐요.', 'Frog skin is thin and delicate — look with your eyes only.'] },
  { id: 'egret', emo: '', t: ['백로', 'Egret'], ga: ['가', ''], hab: 'paddyIn', sea: WARM, time: 'day', flee: 'fly', sc: 0.95, cap: 4, come: 1, bird: 1,
    look: ['온몸이 하얗고 목과 다리가 길어요.', 'White all over with a long neck and long legs.'],
    live: ['논, 냇가, 강가에 살아요. 높은 나무 위에 여럿이 모여 둥지를 지어요.', 'Lives in rice fields and by streams and rivers. Many nest together high in trees.'],
    food: ['물고기, 개구리, 미꾸라지를 먹어요.', 'Fish, frogs and loaches.'],
    win: ['대부분 여름 철새예요. 봄에 남쪽 따뜻한 곳에서 와서 새끼를 기르고, 가을에 다시 남쪽으로 가요.', 'Mostly a summer visitor: it comes from the warm south in spring, raises chicks and leaves in autumn.'],
    care: ['멀리서 가만히 봐요. 자꾸 놀라 날아오르면 먹이 먹을 시간을 잃어요.', 'Watch quietly from afar — every scare costs it feeding time.'] },
  { id: 'owl', emo: '', t: ['솔부엉이', 'Brown hawk-owl'], ga: ['가', ''], hab: 'bigTree', sea: WARM, time: 'night', flee: 'fly', sc: 1.6, cap: 4, bird: 1, perch: 1,
    look: ['눈이 크고 노래요. 등은 짙은 갈색이고, 흰 배에 갈색 줄무늬가 있어요. 머리에 귀처럼 솟은 깃은 없어요.', 'Big yellow eyes, a dark brown back and a white belly with brown streaks. No ear tufts.'],
    live: ['마을 숲이나 절 둘레의 오래된 큰 나무에 살아요. 나무 구멍에 둥지를 지어요.', 'Lives in old, big trees in village woods and around temples. It nests in tree holes.'],
    food: ['밤에 나방, 딱정벌레 같은 큰 곤충을 잡아먹어요.', 'At night it catches big insects such as moths and beetles.'],
    win: ['여름 철새예요. 봄에 남쪽에서 와서 새끼를 기르고, 가을에 다시 남쪽으로 가요.', 'A summer visitor: it comes from the south in spring, raises chicks and leaves in autumn.'],
    care: ['천연기념물이에요. 둥지가 있는 오래된 큰 나무를 베지 않고 지켜요.', 'It is a natural monument in Korea. We protect the old trees it nests in.'] },
  { id: 'sparrow', emo: '', t: ['참새', 'Tree sparrow'], ga: ['가', ''], hab: 'street', sea: ALL, time: 'day', flee: 'fly', sc: 2.2, cap: 999, come: 1, bird: 1, kit: 1,   /* CELLKIT-1 '새 떼' — 자리 = 칸 키트가 고른 마을 길가(그날 키트가 켠 칸만 나옴) */
    look: ['작고 통통한 갈색 새예요. 머리는 밤색이고, 흰 뺨에 검은 점이 있어요.', 'A small, plump brown bird with a chestnut cap and a black spot on each white cheek.'],
    live: ['사람이 사는 마을 둘레에 살아요. 처마 밑이나 담 틈에 둥지를 지어요.', 'Lives around towns and villages and nests under eaves or in gaps in walls.'],
    food: ['풀씨와 낟알을 먹고, 새끼를 기를 때는 곤충을 잡아 먹여요.', 'Eats seeds and grain, and feeds insects to its chicks.'],
    win: ['우리나라에서 일 년 내내 사는 텃새예요. 겨울에는 여럿이 무리 지어 다녀요.', 'It lives in Korea all year round. In winter sparrows move about in flocks.'],
    care: ['뛰어가면 놀라 한꺼번에 날아올라요. 멀리서 가만히 지켜봐요.', 'Run at them and the whole flock takes off — watch quietly from a distance.'] },
];
const HABN = { tree: ['산 숲 나무 곁', 'by trees in the hill woods'], edge: ['산 숲 가장자리 풀밭', 'grass at the edge of the hill woods'], river: ['강가', 'the riverbank'], water: ['강·연못 물 위', 'on rivers and ponds'], pond: ['연못 물 위', 'on a pond'], paddyEdge: ['논 가장자리', 'the edge of a rice field'], paddyIn: ['논 한가운데', 'out in a rice field'], bigTree: ['마을의 오래된 큰 나무', 'an old, big tree in the village'], street: ['마을 길가·처마 밑', 'town streets and eaves'] };
const SEAN = { spring: ['봄', 'spring'], summer: ['여름', 'summer'], autumn: ['가을', 'autumn'], winter: ['겨울', 'winter'] }, TIMEN = { day: ['낮', 'daytime'], night: ['밤·새벽', 'night and dawn'], any: ['', ''] };
for (const w of WILD) { const s = w.sea.length === 4 ? ['일 년 내내', 'all year'] : w.sea.length === 3 ? ['봄~가을', 'spring to autumn'] : [SEAN[w.sea[0]][0], SEAN[w.sea[0]][1]], tm = TIMEN[w.time];
  const pl = w.reed ? [HABN[w.hab][0] + ', 갈대 있는 물가', HABN[w.hab][1] + ' or reedy water'] : HABN[w.hab];   /* 못 만난 칸 귀띔 = 때 · 곳(예: 봄~가을 밤 · 강가) */
  w.hint = [s[0] + (tm[0] ? ' ' + tm[0] : '') + ' · ' + pl[0], s[1] + (tm[1] ? ', ' + tm[1] : '') + ' · ' + pl[1]]; }
export const wildById = id => WILD.find(w => w.id === id) || null;

// ── 모양: [갈래, 부위, 색, x, y, z, a, b, c, rx, ry, rz] · 'b' 상자(a·b·c = 폭·키·길이) · 'e' 공(반지름) · 'c' 뿔(+Z로 뾰족 · a·b = 밑 반지름 · c = 길이)
//   좌표 = 미터 · 앞 = +Z · 동물의 왼쪽 = +X · 원점 = 발바닥(물에 뜨는 오리 = 물낯) · 부위 0 몸 · 1 머리(목 포함) · 2 꼬리 · 3·4 앞다리(새 = 날개 · 펼친 모양으로 짓고 셰이더가 접음) · 5·6 뒷다리
const B = (p, h, x, y, z, a, b, c, rx = 0, ry = 0, rz = 0) => ['b', p, h, x, y, z, a, b, c, rx, ry, rz], E = (p, h, x, y, z, a, b, c, rx = 0, ry = 0, rz = 0) => ['e', p, h, x, y, z, a, b, c, rx, ry, rz], CN = (p, h, x, y, z, a, b, c, rx = 0, ry = 0, rz = 0) => ['c', p, h, x, y, z, a, b, c, rx, ry, rz];
const LR = f => [...f(1, 0), ...f(-1, 1)];   // 왼쪽(+X · 부위 3·5) · 오른쪽(−X · 부위 4·6)
function heronLike(c) { return { bird: 1, piv: { 1: [0, 0.8, 0.16], 2: [0, 0.66, -0.2], 3: [0.11, 0.8, 0], 4: [-0.11, 0.8, 0], 5: [0.05, 0.6, -0.02], 6: [-0.05, 0.6, -0.02] }, P: [
  E(0, c.body, 0, 0.72, -0.02, 0.11, 0.12, 0.24, -0.35), E(0, c.neck, 0, 0.75, 0.14, 0.08, 0.085, 0.085),
  B(1, c.neck, 0, 0.9, 0.2, 0.055, 0.24, 0.06, 0.3), B(1, c.neck, 0, 1.06, 0.215, 0.05, 0.12, 0.055, -0.35), E(1, c.head, 0, 1.135, 0.24, 0.042, 0.042, 0.065),
  ...(c.plume ? [B(1, c.plume, 0, 1.15, 0.17, 0.016, 0.016, 0.12, -0.3)] : []), CN(1, c.bill, 0, 1.125, 0.37, 0.016, 0.02, 0.14, 0.12), ...LR(s => [B(1, 0x1a1a1a, s * 0.03, 1.15, 0.27, 0.012, 0.012, 0.012)]),
  B(2, c.wing, 0, 0.63, -0.26, 0.11, 0.035, 0.12, 0.45),
  ...LR((s, k) => [B(3 + k, c.wing, s * 0.44, 0.79, -0.04, 0.68, 0.03, 0.3), B(3 + k, c.tip, s * 0.7, 0.79, -0.06, 0.2, 0.045, 0.26),
    B(5 + k, c.leg, s * 0.05, 0.5, -0.02, 0.028, 0.2, 0.03), B(5 + k, c.leg, s * 0.05, 0.2, 0, 0.022, 0.4, 0.022), B(5 + k, c.leg, s * 0.05, 0.008, 0.04, 0.03, 0.016, 0.13)]) ] }; }
function duckLike(c) { return { bird: 1, piv: { 1: [0, 0.15, 0.14], 2: [0, 0.12, -0.18], 3: [0.11, 0.14, 0], 4: [-0.11, 0.14, 0], 5: [0.05, 0.02, -0.02], 6: [-0.05, 0.02, -0.02] }, P: [
  E(0, c.body, 0, 0.08, -0.02, 0.12, 0.09, 0.21), E(0, c.breast, 0, 0.1, 0.12, 0.095, 0.08, 0.09),
  B(2, c.tail, 0, 0.12, -0.22, 0.08, 0.03, 0.08, 0.4), ...(c.curl ? [B(2, c.curl, 0, 0.16, -0.2, 0.015, 0.045, 0.015)] : []),
  B(1, c.head, 0, 0.2, 0.16, 0.05, 0.1, 0.05, 0.2), ...(c.ring ? [B(1, c.ring, 0, 0.175, 0.155, 0.058, 0.02, 0.058, 0.2)] : []), E(1, c.head, 0, 0.27, 0.19, 0.05, 0.05, 0.065), ...(c.crown ? [E(1, c.crown, 0, 0.292, 0.18, 0.042, 0.028, 0.05)] : []),
  B(1, c.bill, 0, 0.255, 0.275, 0.045, 0.018, 0.08, 0.15), ...(c.tip ? [B(1, c.tip, 0, 0.247, 0.312, 0.047, 0.021, 0.022, 0.15)] : []), ...LR(s => [B(1, 0x111111, s * 0.045, 0.28, 0.215, 0.012, 0.012, 0.012)]),
  ...LR((s, k) => [B(3 + k, c.wing, s * 0.31, 0.15, -0.03, 0.4, 0.025, 0.2), B(3 + k, c.spec, s * 0.24, 0.15, -0.09, 0.14, 0.035, 0.06), B(5 + k, 0xe08a30, s * 0.05, -0.03, -0.02, 0.02, 0.08, 0.02), B(5 + k, 0xe08a30, s * 0.05, -0.068, 0.01, 0.05, 0.012, 0.06)]) ] }; }
const MODELS = {
  waterdeer: { piv: { 1: [0, 0.6, 0.3], 2: [0, 0.6, -0.38], 3: [0.085, 0.44, 0.24], 4: [-0.085, 0.44, 0.24], 5: [0.09, 0.46, -0.24], 6: [-0.09, 0.46, -0.24] }, P: [
    E(0, 0xa8865a, 0, 0.53, 0.02, 0.16, 0.16, 0.36), E(0, 0xa8865a, 0, 0.565, -0.2, 0.15, 0.16, 0.2), E(0, 0xd6c09a, 0, 0.47, 0.03, 0.12, 0.1, 0.28), B(2, 0xa8865a, 0, 0.6, -0.4, 0.05, 0.06, 0.05),
    B(1, 0xa8865a, 0, 0.72, 0.33, 0.1, 0.3, 0.11, 0.5), E(1, 0xa8865a, 0, 0.87, 0.47, 0.07, 0.07, 0.1, 0.3), B(1, 0x9a7a52, 0, 0.84, 0.57, 0.08, 0.075, 0.1, 0.3), B(1, 0x241d18, 0, 0.83, 0.625, 0.055, 0.045, 0.03, 0.3),
    ...LR((s, k) => [B(1, 0x15110e, s * 0.058, 0.885, 0.5, 0.02, 0.028, 0.03), E(1, 0xa8865a, s * 0.07, 0.95, 0.43, 0.035, 0.065, 0.018, 0, 0, -s * 0.5), B(1, 0xf0ece0, s * 0.022, 0.775, 0.6, 0.014, 0.07, 0.014, 0.25),
      E(3 + k, 0xa8865a, s * 0.085, 0.43, 0.24, 0.05, 0.09, 0.06), B(3 + k, 0x8f6e48, s * 0.085, 0.24, 0.24, 0.045, 0.42, 0.05), B(3 + k, 0x3a2e24, s * 0.085, 0.03, 0.25, 0.055, 0.06, 0.07),
      E(5 + k, 0xa8865a, s * 0.09, 0.44, -0.24, 0.06, 0.11, 0.08), B(5 + k, 0x8f6e48, s * 0.09, 0.23, -0.27, 0.045, 0.4, 0.05), B(5 + k, 0x3a2e24, s * 0.09, 0.03, -0.26, 0.055, 0.06, 0.07)]) ] },
  chipmunk: { piv: { 1: [0, 0.15, 0.09], 2: [0, 0.15, -0.1], 3: [0.032, 0.08, 0.07], 4: [-0.032, 0.08, 0.07], 5: [0.042, 0.09, -0.06], 6: [-0.042, 0.09, -0.06] }, P: [
    E(0, 0xc4803e, 0, 0.13, 0, 0.065, 0.065, 0.11, -0.2), E(0, 0xf1dfc2, 0, 0.105, 0.02, 0.05, 0.045, 0.085),
    ...[[0, 0x3a2a1e], [0.024, 0x3a2a1e], [-0.024, 0x3a2a1e], [0.037, 0xf1dfc2], [-0.037, 0xf1dfc2], [0.05, 0x3a2a1e], [-0.05, 0x3a2a1e]].map(([x, h]) => B(0, h, x, 0.13 + 0.065 * Math.sqrt(1 - (x / 0.066) ** 2) - 0.004, 0, 0.012, 0.012, 0.16, -0.2, 0, -Math.asin(x / 0.066) * 0.9)),   /* 등 줄무늬 다섯(검은 줄) + 사이 밝은 줄 */
    E(1, 0xc4803e, 0, 0.17, 0.125, 0.048, 0.045, 0.055), E(1, 0xf1dfc2, 0, 0.155, 0.14, 0.042, 0.03, 0.04), B(1, 0x3a2a1e, 0, 0.165, 0.18, 0.016, 0.012, 0.01),
    E(2, 0xa86a36, 0, 0.24, -0.15, 0.03, 0.1, 0.035, -0.35),
    ...LR((s, k) => [B(1, 0x1a120c, s * 0.033, 0.18, 0.15, 0.012, 0.016, 0.016), B(1, 0xc4803e, s * 0.025, 0.215, 0.11, 0.018, 0.03, 0.01, 0, 0, -s * 0.3),
      B(3 + k, 0xb87438, s * 0.032, 0.04, 0.07, 0.02, 0.08, 0.025), E(5 + k, 0xc4803e, s * 0.042, 0.06, -0.06, 0.025, 0.05, 0.045), B(5 + k, 0xb87438, s * 0.045, 0.008, -0.04, 0.025, 0.016, 0.05)]) ] },
  otter: { piv: { 1: [0, 0.2, 0.26], 3: [0.075, 0.12, 0.2], 4: [-0.075, 0.12, 0.2], 5: [0.08, 0.12, -0.2], 6: [-0.08, 0.12, -0.2] }, P: [
    E(0, 0x5e4532, 0, 0.17, 0, 0.11, 0.1, 0.32), CN(0, 0x5e4532, 0, 0.14, -0.5, 0.07, 0.06, 0.4, 0, Math.PI, 0),
    E(1, 0x5e4532, 0, 0.22, 0.38, 0.075, 0.065, 0.09), E(1, 0xbfae92, 0, 0.17, 0.32, 0.07, 0.05, 0.075), E(1, 0xbfae92, 0, 0.2, 0.455, 0.045, 0.035, 0.035), B(1, 0x1e1612, 0, 0.225, 0.485, 0.035, 0.022, 0.015),
    ...LR((s, k) => [B(1, 0x1e1612, s * 0.042, 0.245, 0.43, 0.014, 0.014, 0.014), B(1, 0x5e4532, s * 0.055, 0.27, 0.355, 0.022, 0.02, 0.014),
      B(3 + k, 0x4a3626, s * 0.075, 0.06, 0.2, 0.05, 0.12, 0.06), B(3 + k, 0x4a3626, s * 0.078, 0.01, 0.23, 0.06, 0.02, 0.07), B(5 + k, 0x4a3626, s * 0.08, 0.06, -0.2, 0.06, 0.12, 0.08), B(5 + k, 0x4a3626, s * 0.082, 0.01, -0.17, 0.065, 0.02, 0.09)]) ] },
  heron: heronLike({ body: 0x8f979f, neck: 0xe9e9e4, head: 0xf0f0ec, plume: 0x24282c, bill: 0xd9a23a, leg: 0xb39a5a, wing: 0x7d858e, tip: 0x3e444b }),
  egret: heronLike({ body: 0xf4f4ef, neck: 0xf4f4ef, head: 0xf7f7f3, plume: null, bill: 0xe4c038, leg: 0x2a2a2a, wing: 0xefefe9, tip: 0xe2e2dc }),
  mallard: duckLike({ body: 0xb9b5ad, breast: 0x7a4a34, tail: 0xeeeeea, curl: 0x1e1e1e, head: 0x1f6b3c, ring: 0xf2f2ee, bill: 0xe2c23e, wing: 0x8a8479, spec: 0x3c4fb5 }),
  spotbill: duckLike({ body: 0x6f5b45, breast: 0x7d6850, tail: 0x3e3226, head: 0xd9cfba, crown: 0x3a2e22, bill: 0x26221e, tip: 0xe8c43a, wing: 0x5e4c3a, spec: 0x2e8a7a }),
  sparrow: { bird: 1, piv: { 1: [0, 0.09, 0.04], 2: [0, 0.07, -0.05], 3: [0.032, 0.085, 0], 4: [-0.032, 0.085, 0], 5: [0.015, 0.03, 0], 6: [-0.015, 0.03, 0] }, P: [   /* 참새(CELLKIT-1 · 밤색 머리 · 흰 뺨 검은 점 · 검은 턱) */
    E(0, 0x8a6440, 0, 0.065, -0.005, 0.035, 0.032, 0.055, -0.15), E(0, 0xd8ccb8, 0, 0.056, 0.012, 0.03, 0.026, 0.042),
    E(1, 0x7a4a2a, 0, 0.1, 0.04, 0.027, 0.026, 0.03), E(1, 0xf0ece0, 0, 0.092, 0.047, 0.026, 0.017, 0.024), CN(1, 0x2a2a2a, 0, 0.094, 0.072, 0.008, 0.008, 0.022), B(1, 0x1a1a1a, 0, 0.081, 0.054, 0.014, 0.01, 0.008),
    B(2, 0x5a4030, 0, 0.07, -0.075, 0.03, 0.008, 0.05, 0.25),
    ...LR((s, k) => [B(1, 0x111111, s * 0.021, 0.103, 0.055, 0.005, 0.005, 0.005), B(1, 0x1a1a1a, s * 0.026, 0.09, 0.042, 0.004, 0.008, 0.008),
      B(3 + k, 0x7a5636, s * 0.1, 0.085, -0.01, 0.14, 0.008, 0.06), B(3 + k, 0x3e2a1c, s * 0.15, 0.085, -0.02, 0.05, 0.01, 0.05), B(5 + k, 0xb08a6a, s * 0.015, 0.016, 0, 0.005, 0.03, 0.005), B(5 + k, 0xb08a6a, s * 0.015, 0.002, 0.008, 0.012, 0.004, 0.018)]) ] },
  owl: { bird: 1, piv: { 1: [0, 0.17, 0], 2: [0, 0.07, -0.04], 3: [0.055, 0.15, 0], 4: [-0.055, 0.15, 0], 5: [0.025, 0.03, 0], 6: [-0.025, 0.03, 0] }, P: [   /* 솔부엉이(앉은 모습 · 부위 7 = 앉은 가지 — 날 때 숨김) */
    E(0, 0x5a4330, 0, 0.11, -0.005, 0.062, 0.095, 0.058, 0.12), E(0, 0xe8dfcf, 0, 0.1, 0.022, 0.048, 0.075, 0.042, 0.12),
    ...[[0.016, 0.125], [-0.016, 0.125], [0, 0.095], [0.02, 0.07], [-0.02, 0.07]].map(([x, y]) => B(0, 0x7a5a3c, x, y, 0.06, 0.008, 0.024, 0.006, 0.12)),
    E(1, 0x5a4330, 0, 0.215, 0.002, 0.056, 0.052, 0.052), B(1, 0x3a3a30, 0, 0.207, 0.054, 0.012, 0.016, 0.012, 0.5),
    B(2, 0x4e3a2a, 0, 0.035, -0.055, 0.05, 0.11, 0.018, -0.3), B(7, 0x6b4a30, 0, -0.03, -0.14, 0.05, 0.05, 0.46),
    ...LR((s, k) => [E(1, 0xf2c230, s * 0.022, 0.225, 0.043, 0.015, 0.015, 0.009), B(1, 0x111111, s * 0.022, 0.225, 0.051, 0.008, 0.008, 0.004),
      B(3 + k, 0x5a4330, s * 0.16, 0.15, -0.015, 0.21, 0.016, 0.1), B(3 + k, 0x3e2e20, s * 0.24, 0.15, -0.03, 0.06, 0.022, 0.08), B(5 + k, 0x9a8a60, s * 0.025, 0.006, 0.012, 0.02, 0.012, 0.03)]) ] },
  frog: { bird: 2, piv: { 3: [0.028, 0.03, 0.035], 4: [-0.028, 0.03, 0.035], 5: [0.03, 0.028, -0.035], 6: [-0.03, 0.028, -0.035] }, P: [
    E(0, 0x6aa04a, 0, 0.034, -0.005, 0.034, 0.026, 0.05, -0.3), E(0, 0x6aa04a, 0, 0.045, 0.04, 0.032, 0.02, 0.03, -0.1), E(0, 0xe8e4c8, 0, 0.025, 0.01, 0.03, 0.016, 0.045), B(0, 0xc8d890, 0, 0.058, -0.008, 0.007, 0.006, 0.07, -0.3),
    ...LR((s, k) => [E(0, 0xd8b040, s * 0.02, 0.064, 0.045, 0.011, 0.011, 0.011), B(0, 0x111111, s * 0.027, 0.066, 0.05, 0.004, 0.006, 0.006), B(0, 0x2e3e22, s * 0.018, 0.052, -0.02, 0.01, 0.006, 0.014, -0.3), B(0, 0x2e3e22, s * 0.022, 0.042, -0.042, 0.01, 0.006, 0.012, -0.3),
      B(3 + k, 0x5e9242, s * 0.028, 0.014, 0.04, 0.01, 0.028, 0.01), B(3 + k, 0x5e9242, s * 0.03, 0.002, 0.046, 0.016, 0.004, 0.012),
      E(5 + k, 0x6aa04a, s * 0.036, 0.022, -0.03, 0.014, 0.012, 0.03, 0, s * 0.4, 0), B(5 + k, 0x5e9242, s * 0.046, 0.012, -0.012, 0.01, 0.01, 0.035, 0, -s * 0.3, 0), B(5 + k, 0x5e9242, s * 0.05, 0.003, 0.002, 0.024, 0.005, 0.03)]) ] },
};
// 모양 자료(town_animals.js와 같은 꼴: pos · col(sRGB 0~255) · part · piv · size) — 처음 쓸 때 한 번(T3 도형을 붙여 비인덱스로)
function buildGeo(T3, id) { const M = MODELS[id], pos = [], col = [], part = [], m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), e4 = new T3.Euler(), v3 = new T3.Vector3(), s3 = new T3.Vector3();
  const UB = new T3.BoxGeometry(1, 1, 1).toNonIndexed(), UE = new T3.SphereGeometry(1, 7, 5).toNonIndexed(), UC = new T3.ConeGeometry(1, 1, 5).rotateX(Math.PI / 2).toNonIndexed();
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const [t, p, h, x, y, z, a, b, c, rx, ry, rz] of M.P) { const g = t === 'b' ? UB : t === 'e' ? UE : UC, P = g.attributes.position; m4.compose(v3.set(x, y, z), q4.setFromEuler(e4.set(rx, ry, rz)), s3.set(a, b, c));
    const r = (h >> 16) & 255, gg = (h >> 8) & 255, bb = h & 255;
    for (let i = 0; i < P.count; i++) { v3.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v3.x, v3.y, v3.z); col.push(r, gg, bb); part.push(p); for (let j = 0; j < 3; j++) { const w = j ? (j === 1 ? v3.y : v3.z) : v3.x; if (w < lo[j]) lo[j] = w; if (w > hi[j]) hi[j] = w; } } }
  UB.dispose(); UE.dispose(); UC.dispose(); return { pos, col, part, piv: M.piv, bird: M.bird || 0, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], tri: pos.length / 9 }; }

// ── 그림(카드·도감): 같은 모양 자료를 옆(+X 쪽)에서 본 모습 — 부위 덩어리마다 꼭짓점을 2D에 비춰 볼록 껍질로 칠함(먼 쪽 = 조금 어둡게) · 새 날개 = 접은 모습
const UNIT = { b: [], e: [], c: [] };
for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) UNIT.b.push([sx, sy, sz]);
for (let i = 0; i <= 6; i++) { const la = -Math.PI / 2 + i * Math.PI / 6; for (let j = 0; j < 8; j++) { const lo = j * Math.PI / 4; UNIT.e.push([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]); } }
for (let j = 0; j < 5; j++) UNIT.c.push([Math.cos(j * 1.2566), -Math.sin(j * 1.2566), -0.5]); UNIT.c.push([0, 0, 0.5]);
function hull(P) { P.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), L = [], U = [];
  for (const p of P) { while (L.length >= 2 && cr(L[L.length - 2], L[L.length - 1], p) <= 0) L.pop(); L.push(p); } for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (U.length >= 2 && cr(U[U.length - 2], U[U.length - 1], p) <= 0) U.pop(); U.push(p); } L.pop(); U.pop(); return L.concat(U); }
function rot(v, rx, ry, rz) { let [x, y, z] = v, c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]; c = Math.cos(ry); s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]; return [x, y, z]; }
const shade = (h, k) => '#' + [16, 8, 0].map(sh => Math.max(0, Math.min(255, Math.round(((h >> sh) & 255) * k))).toString(16).padStart(2, '0')).join('');
// o = { w, h, bg } — bg = 사는 곳 바탕(평평한 색 둘 · 그라데이션 X)
export function drawWild(cv, w, o = {}) { const M = MODELS[w.id], g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const polys = [];
  for (const [t, p, h, x, y, z, a, b, c, rx, ry, rz] of M.P) { let pts = UNIT[t].map(u => { const r = rot([u[0] * a, u[1] * b, u[2] * c], rx, ry, rz); return [r[0] + x, r[1] + y, r[2] + z]; });
    if (M.bird === 1 && (p === 3 || p === 4)) { const pv = M.piv[p], sg = p === 3 ? 1 : -1, an = sg * 1.45, cs = Math.cos(an), sn = Math.sin(an); pts = pts.map(([px, py, pz]) => { const qx = sg * (pz - pv[2]) * 0.55, qy = py - pv[1], qz = -sg * (px - pv[0]) * 0.6, x2 = qx * cs - qy * sn, y2 = qx * sn + qy * cs; return [pv[0] + x2, pv[1] + y2 * 0.955 + qz * 0.2955, pv[2] - y2 * 0.2955 + qz * 0.955]; }); }   /* 셰이더와 같은 접기 */
    let mx = -1e9; for (const q of pts) mx = Math.max(mx, q[0]); polys.push({ d: (pts.reduce((s9, q) => s9 + q[0], 0) / pts.length) + mx * 0.3, h, far: mx < 0, P: hull(pts.map(q => [q[2], q[1]])) }); }
  let z0 = 1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9; for (const P of polys) for (const [u, v] of P.P) { z0 = Math.min(z0, u); z1 = Math.max(z1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
  const pad = W * 0.1, k = Math.min((W - pad * 2) / (z1 - z0), (H - pad * 2) / (y1 - y0)), ox = W / 2 - (z0 + z1) / 2 * k, gy = H - pad * 0.8 - (y0 < -0.01 ? -y0 * k : 0), oy = gy;
  if (o.bg) { g.fillStyle = o.bg[0]; g.fillRect(0, 0, W, H); g.fillStyle = o.bg[1]; g.fillRect(0, gy, W, H - gy); }
  polys.sort((a, b) => a.d - b.d); g.lineJoin = 'round';
  for (const P of polys) { g.beginPath(); P.P.forEach(([u, v], i) => { const X = ox + u * k, Y = oy - v * k; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); g.fillStyle = o.sil ? o.sil : shade(P.h, P.far ? 0.78 : 1); g.fill(); if (!o.sil) { g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = Math.max(1, W / 220); g.stroke(); } }   /* sil = 못 만난 칸 실루엣(한 색) */
  if (w.float && o.bg) { g.fillStyle = 'rgba(120,170,200,.55)'; g.fillRect(0, gy, W, H - gy); } }
const BG = { bigTree: ['#e7efd8', '#9cbf7a'], tree: ['#e7efd8', '#9cbf7a'], edge: ['#e7efd8', '#b7cf8a'], river: ['#e2eef2', '#9cc4d4'], water: ['#e2eef2', '#7fb0c8'], pond: ['#e2eef2', '#7fb0c8'], paddyEdge: ['#eef2da', '#a9c46e'], paddyIn: ['#eef2da', '#a9c46e'], street: ['#eef0ea', '#c9c4b8'] };

// ── 마을 쪽이 넘기는 것(A): map · T3 · GAME · id · ANM(town_anim) · root() · on() 마을 모습인가 · inb() 실내 · lang() · sea() 놀이 계절 · night() 0·0.5·1 · hour() · busy() 창·놀이·잠 · ride() 탈것·배·헤엄 · bike()
//   bounds() → [x0, z0, x1, z1] · bushes() 떨기나무 · wAt(x, z) 물 갈래(1 강 · 2 연못 · 3 바다) · sdAt 물가까지 거리(물 안 −) · waterY(갈래) · region(x, z) · treeNear(x, z, r) · trees() → [{ x, z, s }] · forests() 숲·산 모양 · rice() 논 모양
//   inShape · sdOf · bboxOf · okLand(x, z) 걸을 수 있는 마른 땅 · gy(x, z) 땅 높이 · rng(씨앗) · enth · openP · closeP · esc · skUp · bagShow · touch() · alive()
// PHOTO-2 사진 기자(docs/systems/town_jobs2.md 「다음 다섯」): 그림 크기(종마다 · 처음 지을 때) · 행동 이름(셔터 때 한 번 읽음)
const WSZ = {};
export const HAB_NAME = (w, reed, L) => reed ? (L ? 'reedy water' : '갈대 있는 물가') : HABN[w.hab][L];
export function createWild(A) {
  const T3 = A.T3, SP = [], ACT = [], MOV = [], MESH = {}, LAND = {}, HH = [], MAXA = 12, M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), E4 = new T3.Euler(0, 0, 0, 'YXZ'), V4 = new T3.Vector3(), S4 = new T3.Vector3();
  const VP = new T3.Vector3(), SHOT = [];   /* PHOTO-2 셔터 스크래치(찍을 때만 씀) */
  let RI = [], stillT = 0, comeDay = -1, on = false, near = false, q = 0, crouchOn = false, toldDay = -1, fleeDay = -1, buildMs = 0, secMs = 0, secMax = 0, lastAct = '', picN = {};
  const S = () => A.GAME.S, en = () => A.lang() === 'en', now = () => performance.now() / 1000;
  const timeOk = w => { const n9 = A.night(), h = A.hour(); return w.time === 'any' ? true : w.time === 'day' ? n9 < 1 : (n9 > 0 || h < 7 || h >= 19); };
  const avail = w => w.sea.includes(A.sea()) && timeOk(w), lvOf = c => c >= 30 ? 2 : c >= 10 ? 1 : 0, ST = () => { const W9 = S().wild; return W9 && typeof W9 === 'object' && W9.n && W9.k ? W9 : (S().wild = { n: {}, k: {} }); };   /* 관찰 별: 10번 ⭐ · 30번 ⭐⭐(같은 자리 한 마리는 하루 한 번만 셈) */
  // 그림 메시(종마다 하나 · 처음 나올 때) — 원점에 두고 인스턴스 행렬로만 옮김 · 움직이니 화면 밖 자르기 끔(12마리 안 · 작은 메시)
  function meshOf(w) { const n = SP.filter(s => s.w === w).length; let h = MESH[w.id]; if (h && h.n >= n) return h; if (h) { if (h.m.parent) h.m.parent.remove(h.m); h.dispose(); }   /* 자리 수가 늘면(다른 판) 새로 */
    if (!A.ANM.has(w.id)) { const G9 = buildGeo(T3, w.id); WSZ[w.id] = G9.size; A.ANM.def(w.id, G9); }   /* PHOTO-2: 그림 키(셔터 때 투영 상자) */ h = A.ANM.mesh(w.id, Math.max(1, n)); h.m.frustumCulled = false; h.m.matrixAutoUpdate = false; h.m.userData.fx = 1; h.m.count = 0; h.m.visible = false; MESH[w.id] = h; return h; }
  function put(s) { const h = MESH[s.w.id]; if (!h || s.i < 0) return; E4.set(s.rx, s.ry, 0); M4.compose(V4.set(s.x, s.y, s.z), Q4.setFromEuler(E4), S4.setScalar(s.w.sc * (s.vis ?? 1))); h.m.setMatrixAt(s.i, M4); h.m.instanceMatrix.needsUpdate = true; h.mode(s.i, s.md); }
  // 짓기 때(마을 모습일 때마다 · setEntries): 서식지마다 자리 고르기(같은 씨앗 = 같은 자리) — 서식지가 없으면 그 종은 자리 0(안 나옴)
  function init() { const t0 = performance.now(); clear(); if (!A.on()) return; on = true; RI = A.rice(); const R = A.rng('wild:' + A.id), mix = a => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; const t9 = a[i]; a[i] = a[j]; a[j] = t9; } return a; };
    const [bx0, bz0, bx1, bz1] = A.bounds(), FO = A.forests(), inFo = (x, z) => FO.some(sh => A.inShape(sh, x, z));
    const woods = mix(A.trees().filter(t => A.region(t.x, t.z) === '산' || inFo(t.x, t.z))), BU = A.bushes(), bushy = (x, z) => BU.some(b => Math.abs(b.x - x) < 2.4 && Math.abs(b.z - z) < 2.4);   /* 덤불 속에 숨지 않게 */
    const C = { tree: [], edge: [], river: [], water: [], pond: [], paddyEdge: [], paddyIn: [], reed: [], bigTree: [], street: A.kitBirds ? A.kitBirds() : [] };   /* street = 칸 키트 참새 자리(무리 = 칸마다 둘~셋 · 키트가 이미 간격을 둠) */
    for (const t of mix(A.bigTrees().slice())) { if (C.bigTree.length >= 40) break; const s9 = t.s || 1, ph = (s9 >= 1.45 ? 1.6 : 1.2) * s9, a = R() * 6.283, x = t.x + Math.cos(a) * 0.5, z = t.z + Math.sin(a) * 0.5, gx = t.x + Math.cos(a) * 2.6, gz = t.z + Math.sin(a) * 2.6;   /* 솔부엉이 = 큰 나무 아래 가지(잎 덩어리 밑 · 줄기를 등지고) */
      if (A.region(t.x, t.z) === '시내' || !A.okLand(gx, gz)) continue; const g = A.gy(t.x, t.z); C.bigTree.push({ x, z, y: g + ph, gy: g, ry: Math.atan2(Math.cos(a), Math.sin(a)) }); }
    for (const [rx, rz] of mix(A.reeds().slice())) { if (C.reed.length >= 40) break; let dw = null; for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]]) if (A.wAt(rx + dx * 1.8, rz + dz * 1.8)) { dw = [dx, dz]; break; }   /* 개구리 = 갈대 무리 곁 물가(뭍 쪽으로 한 걸음) */
      if (!dw) continue; const x = rx - dw[0] * 0.9, z = rz - dw[1] * 0.9; if (A.wAt(x, z) || !A.okLand(x, z)) continue; C.reed.push({ x, z, dw, reed: 1 }); }
    for (const t of woods) { if (C.tree.length < 80) { const a = R() * 6.283, d = (1.1 + R() * 0.5) * Math.max(0.8, t.s || 1), x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; if (A.okLand(x, z) && !A.wAt(x, z) && !bushy(x, z)) C.tree.push({ x, z, tr: [t.x, t.z, t.s || 1] }); }
      if (C.edge.length < 60) { const a = R() * 6.283, d = 6 + R() * 3, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; if (A.okLand(x, z) && !A.wAt(x, z) && !A.treeNear(x, z, 2.6) && !bushy(x, z) && A.okLand(x + 1.2, z) && A.okLand(x - 1.2, z)) C.edge.push({ x, z }); } }
    const DIR = [[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]];
    for (let x = bx0 + 6; x < bx1 - 6; x += 5) for (let z = bz0 + 6; z < bz1 - 6; z += 5) { const px = x + (R() - 0.5) * 3, pz = z + (R() - 0.5) * 3, k = A.wAt(px, pz), sd = A.sdAt(px, pz);
      if ((k === 1 || k === 2) && sd < -1.8 && sd > -3.2) { C.water.push({ x: px, z: pz, wk: k }); if (k === 2) C.pond.push({ x: px, z: pz, wk: k }); continue; }
      if (k || sd < 0.6 || sd > 2.2 || !A.okLand(px, pz) || bushy(px, pz)) continue;
      for (const [dx, dz] of DIR) { const k2 = A.wAt(px + dx * 3.2, pz + dz * 3.2); if (k2 === 1) { C.river.push({ x: px, z: pz, dw: [dx, dz], rg: A.region(px, pz) }); break; } } }
    for (const sh of RI) { const [x0, z0, x1, z1] = A.bboxOf(sh); for (let z = z0 + 1; z < z1; z += 3.5) for (let x = x0 + 1; x < x1; x += 3.5) { const px = x + (R() - 0.5) * 2, pz = z + (R() - 0.5) * 2; if (!A.inShape(sh, px, pz) || A.wAt(px, pz)) continue; const sd = A.sdOf(sh, px, pz);
      if (sd > -1.4 && sd < -0.4) { let dw = null, bd = sd; for (const [dx, dz] of DIR) { const s2 = A.sdOf(sh, px + dx * 2, pz + dz * 2); if (s2 < bd) { bd = s2; dw = [dx, dz]; } } if (dw) C.paddyEdge.push({ x: px, z: pz, dw }); }
      else if (sd < -4) C.paddyIn.push({ x: px, z: pz }); } }
    for (const k in C) mix(C[k]);
    const GAP = { chipmunk: 30, waterdeer: 45, heron: 35, otter: 45, mallard: 28, spotbill: 22, frog: 22, egret: 30, owl: 40, sparrow: 1 };
    const zip = (a, b) => { const o = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (i < b.length) o.push(b[i]); if (i < a.length) o.push(a[i]); } return o; };   /* 개구리 = 갈대 물가와 논 가장자리를 번갈아 */
    for (const w of WILD) { const pool = w.id === 'otter' ? C.river.filter(c => !['읍내', '시내'].includes(c.rg)) : w.hab === 'water' ? C.water : w.reed ? zip(C[w.hab], C.reed) : C[w.hab]; LAND[w.id] = pool.slice(0, 60);   /* 수달 = 맑은 강(마을 한가운데·시내 강가 X) · 날아가 앉을 곳 = 같은 서식지 후보 */
      if (w.kit) { for (const c of pool) SP.push(spot(w, c)); continue; }   /* CELLKIT-1: 키트 자리는 그대로(무리라 8m 간격 규칙 X) */
      let n = 0; for (const c of pool) { if (n >= w.cap) break; if (SP.some(s => (s.w === w && Math.hypot(s.hx - c.x, s.hz - c.z) < GAP[w.id]) || Math.hypot(s.hx - c.x, s.hz - c.z) < 8)) continue; SP.push(spot(w, c)); n++; } }
    for (let i = 0; i < MAXA; i++) { const h = A.map.interact.add({ kind: 'game', x: 0, z: 0, y: -999, r: 4, label: '', use: () => { const s = HH[i] && HH[i].s; if (s) look(s); } }); h.hot.off = true; A.enth.push(h); HH.push({ h, s: null }); }
    const root = A.root(); for (const w of WILD) if (SP.some(s => s.w === w)) { const h = meshOf(w); if (root && h.m.parent !== root) root.add(h.m); }
    buildMs = Math.round(performance.now() - t0); lastAct = ''; }
  function spot(w, c) { const y = c.y ?? (w.float ? A.waterY(c.wk || 1) : A.gy(c.x, c.z)); return { j: SP.length, w, kc: c.kc || '', hx: c.x, hz: c.z, hy: y, gy: c.gy ?? y, ry0: c.ry, reed: !!c.reed, wk: c.wk || 0, dw: c.dw || null, tr: c.tr || null, x: c.x, z: c.z, y, ry: c.ry ?? Math.atan2(c.dw ? c.dw[0] : Math.cos(c.x), c.dw ? c.dw[1] : Math.sin(c.z)), rx: 0, md: 0, st: 0, until: 0, act: false, i: -1, hh: -1, d: 1e9, calm: 0, vis: 1, mv: { k: '', t: 0, T: 1, x0: 0, z0: 0, y0: 0, x1: 0, z1: 0, y1: 0, ys: new Float32Array(7), nx: '' } }; }
  function clear() { for (const s of SP) s.act = false; SP.length = 0; ACT.length = 0; MOV.length = 0; for (const k in MESH) { const h = MESH[k]; h.m.count = 0; h.m.visible = false; if (h.m.parent) h.m.parent.remove(h.m); } for (const o of HH) o.h.remove(); HH.length = 0; on = false; near = false; if (crouchOn) { crouchOn = false; try { A.map.player.crouch(false); } catch (e) { /* 이미 나감 */ } } }
  // 종마다 인스턴스 자리 다시 매김(나온 동물이 바뀔 때만)
  function pack(w) { const h = MESH[w.id]; if (!h) return; let n = 0; for (const s of ACT) if (s.w === w) { s.i = n++; put(s); } h.m.count = n; h.m.visible = n > 0; }
  function home(s) { s.x = s.hx; s.z = s.hz; s.y = s.hy; s.rx = 0; s.md = 0; s.st = 0; s.vis = 1; s.calm = 0; if (s.ry0 != null) s.ry = s.ry0; }
  function gone(s, sec9) { s.st = 3; s.until = now() + sec9; const i = MOV.indexOf(s); if (i >= 0) MOV.splice(i, 1); if (s.act) { s.act = false; const j = ACT.indexOf(s); if (j >= 0) ACT.splice(j, 1); pack(s.w); } hand(); }
  // E 자리(12개 풀): 서 있거나 알아챈 동물에만 · 움직이는 동안 끔
  function hand() { const e9 = en(); let j = 0; for (const s of ACT) { if (j >= HH.length) break; if (s.st > 1) continue; const o = HH[j++], h = o.h.hot, w = s.w; o.s = s; h.x = s.x; h.z = s.z; h.y = w.float ? s.y + 0.6 : w.perch ? s.gy + 0.1 : s.y + 0.1; const lb = e9 ? 'Look at the ' + w.t[1].toLowerCase() : (w.emo ? w.emo + ' ' : '') + w.t[0] + ' 살펴보기'; if (h.label !== lb) h.label = lb; h.off = !!A.inb(); }
    for (; j < HH.length; j++) { HH[j].s = null; HH[j].h.hot.off = true; } }
  // 1초 칸: 계절·때·거리로 나올 동물 고르기(가까운 12마리) · E 자리 · 쪼그리기 켜고 끄기 · 처음 본 종 알림
  function sec() { if (!on || !SP.length) return; const t0 = performance.now(), me = A.map.player.pos(), t = now(), inb = !!A.inb();
    for (const s of SP) { if (s.st === 3 && t >= s.until) { home(s); } s.d = Math.hypot(s.x - me.x, s.z - me.z); s.ok = !inb && s.st !== 3 && avail(s.w) && s.d < (s.act ? 90 : 80) && (!s.kc || !A.kitOn || A.kitOn(s.kc, 'birds')); }   /* CELLKIT-1: 참새 = 그날 키트가 그 칸에 '새 떼'를 켰을 때만 */
    for (let i = ACT.length - 1; i >= 0; i--) { const s = ACT[i]; if (!s.ok) { s.act = false; ACT.splice(i, 1); const m9 = MOV.indexOf(s); if (m9 >= 0) MOV.splice(m9, 1); if (s.st !== 3) home(s); } }
    if (ACT.length < MAXA) { const C9 = SP.filter(s => s.ok && !s.act).sort((a, b) => a.d - b.d); for (const s of C9) { if (ACT.length >= MAXA) break; s.act = true; if (s.st !== 3) home(s); ACT.push(s); } }
    let key = ''; for (const s of ACT) key += s.j + ','; if (key !== lastAct) { lastAct = key; const seen = new Set(); for (const s of ACT) seen.add(s.w); for (const w of WILD) if (MESH[w.id] && (seen.has(w) || MESH[w.id].m.count)) pack(w); }
    // 가만히 있는 동물: 이따금 고개 들기·두리번 · 몇 걸음 걷기(한 마리씩 · 짧게)
    let nd = 1e9, ns = null; for (const s of ACT) { if (s.d < nd) { nd = s.d; ns = s; } if (s.st === 0 && !s.mv.k) { const r = Math.random(); if (r < 0.18) { s.md = s.md === 0 ? 2 : 0; put(s); } else if (r < 0.26 && MOV.length < 3 && s.d > 9) wander(s); } }
    hand(); near = nd < 22;
    const want = nd < (crouchOn ? 36 : 30) && !inb && !A.bike() && !A.ride();   /* 30m 안에서 켜고 36m 밖에서 끔(경계에서 단추가 깜빡이지 않게) */ if (want !== crouchOn) { crouchOn = want; try { A.map.player.crouch(want, { noCtrl: true }); } catch (e) { /* 지도 API 없음 */ } }
    if (ns && nd < 18 && ns.st < 2 && !S().dex['wild:' + ns.w.id] && toldDay !== S().day && !A.busy()) { toldDay = S().day; const w = ns.w, e9 = en(); (A.say || ((t9, s9) => A.map.hud.toast(t9, s9)))(e9 ? (w.emo ? w.emo + ' ' : '') + 'A ' + w.t[1].toLowerCase() + ' is nearby — ' + (A.touch() ? 'tap ⬇ to crouch' : 'hold C to crouch') + ', creep up and press E' : (w.emo ? w.emo + ' ' : '') + w.t[0] + w.ga[0] + ' 있어요 — ' + (A.touch() ? '⬇ 단추로 쪼그려 앉아' : 'C를 누른 채') + ' 살금살금 다가가 E로 살펴봐요', 4, 1); }
    const ms = performance.now() - t0; secMs = ms; if (ms > secMax) secMax = ms; }
  // 0.1초 판정(20m 안에 동물이 있을 때만): 내 소리(가만히 0 · 쪼그려 걷기 1 · 걷기 2 · 달리기·뜀·자전거 3)와 거리
  function sense() { if (A.busy()) { stillT = 0; return; } const me = A.map.player.pos(), n = A.map.player.noise ? A.map.player.noise() : 2, cr = !!(A.map.player.crouched && A.map.player.crouched()), rf = n >= 3 ? 12 : n === 2 ? 3 : n === 1 ? 1.5 : 1, ra = n >= 3 ? 12 : n === 2 ? 5 : n === 1 ? 3 : 0;
    for (let i = ACT.length - 1; i >= 0; i--) { const s = ACT[i]; if (!s || s.st > 1) continue;
      const d = Math.hypot(s.x - me.x, s.z - me.z); if (Math.abs(me.y - s.y) > 6) continue;
      if ((s.mv.k === 'walk' && d < ra + 2) || (s.mv.k === 'come' && (n >= 1 || !cr))) { const m9 = MOV.indexOf(s); if (m9 >= 0) MOV.splice(m9, 1); const c9 = s.mv.k === 'come'; s.mv.k = ''; s.md = c9 ? 2 : 0; if (c9) { s.st = 1; s.calm = 2.5; } put(s); }   /* 걷던 동물도 내가 다가오면 멈춰 봄 · 다가오던 동물은 내가 움직이면 멈칫 */
      if (d < rf) { flee(s, me, n); continue; }
      if (d < ra) { if (s.st === 0) { s.st = 1; s.md = s.w.bird === 2 ? 0 : 2; s.ry = Math.atan2(me.x - s.x, me.z - s.z); put(s); } s.calm = 2.5; }
      else if (s.st === 1 && (s.calm -= 0.1) <= 0) { s.st = 0; s.md = 0; put(s); } }
    stillT = n === 0 && cr ? stillT + 0.1 : 0; if (stillT >= 3) { stillT = -6; come(me); } }   /* 가만히 있기: 쪼그려 3초 넘게 움직이지 않으면 겁 많은 동물이 먼저 다가옴(한 번에 한 마리 · 다음은 6초 뒤) */
  function come(me) { if (MOV.some(o => o.mv.k === 'come')) return; let best = null, bd = 16; for (const s of ACT) { if (!s.w.come || s.st > 1 || s.mv.k) continue; const d = Math.hypot(s.x - me.x, s.z - me.z); if (d > 3.4 && d < bd && Math.abs(me.y - s.y) < 3) { bd = d; best = s; } } if (!best) return;
    const s = best, w = s.w, dx = (me.x - s.x) / bd, dz = (me.z - s.z) / bd, ok9 = (x, z) => w.float ? A.wAt(x, z) === s.wk && A.sdAt(x, z) < -0.9 : w.hab.startsWith('paddy') ? RI.some(sh => A.inShape(sh, x, z)) && !A.wAt(x, z) : A.okLand(x, z) && !A.wAt(x, z);
    for (let k = 0; k <= 10; k++) { const t = (bd - 2.4) * (1 - k / 10), x = s.x + dx * t, z = s.z + dz * t; if (t < 1 || !ok9(x, z) || !ok9(s.x + dx * t * 0.5, s.z + dz * t * 0.5)) continue;
      s.md = w.float ? 2 : 1; s.st = 0; go(s, 'come', x, z, t / (w.id === 'chipmunk' ? 1.1 : w.id === 'otter' ? 0.7 : w.float ? 0.5 : 0.85)); put(s);
      if (comeDay !== S().day) { comeDay = S().day; const e9 = en(); A.map.hud.toast(e9 ? 'You kept still — the ' + w.t[1].toLowerCase() + ' is coming closer' : '가만히 있으니 ' + w.t[0] + w.ga[0] + ' 먼저 다가와요', 3.4); } return; } }
  // 움직임 하나 시작(경로 = 곧은 줄 · 땅 높이는 시작할 때 일곱 점만 재 둠)
  function go(s, k, x1, z1, T, y1) { const m = s.mv; m.k = k; m.t = 0; m.T = Math.max(0.15, T); m.x0 = s.x; m.z0 = s.z; m.y0 = s.y; m.x1 = x1; m.z1 = z1; m.y1 = y1 ?? s.y;
    if (k === 'run' || k === 'walk' || k === 'come') for (let i = 0; i < 7; i++) { const u = i / 6, x = s.x + (x1 - s.x) * u, z = s.z + (z1 - s.z) * u; m.ys[i] = s.w.float ? s.y : A.gy(x, z); }
    if (Math.hypot(x1 - s.x, z1 - s.z) > 0.05) s.ry = Math.atan2(x1 - s.x, z1 - s.z); if (MOV.indexOf(s) < 0) MOV.push(s); }
  function wander(s) { const w = s.w; if (w.flee === 'hop' || w.flee === 'dive' || w.perch) return; for (let k = 0; k < 4; k++) { const a = Math.random() * 6.283, d = 1.2 + Math.random() * 2, x = s.hx + Math.cos(a) * d, z = s.hz + Math.sin(a) * d;
      const ok = w.float ? A.wAt(x, z) === s.wk && A.sdAt(x, z) < -1.6 : w.hab.startsWith('paddy') ? RI.some(sh => A.inShape(sh, x, z)) && !A.wAt(x, z) : A.okLand(x, z) && !A.wAt(x, z);
      if (!ok) continue; s.md = w.float ? 2 : 1; s.st = 0; go(s, 'walk', x, z, Math.hypot(x - s.x, z - s.z) / (w.id === 'waterdeer' ? 0.9 : w.id === 'chipmunk' ? 0.8 : w.float ? 0.35 : 0.45)); put(s); return; } }
  // 달아나기: 꼴마다(고라니 = 뛰어 멀리 · 다람쥐 = 나무 위로 · 새 = 날아 다른 물가로 · 수달 = 물속으로 · 개구리 = 폴짝 물로)
  function flee(s, me, n) { const w = s.w, e9 = en(); s.st = 2; s.calm = 0; let ax = s.x - me.x, az = s.z - me.z; const L = Math.hypot(ax, az) || 1; ax /= L; az /= L;
    if (n >= 2 && fleeDay !== S().day && !A.busy()) { fleeDay = S().day; A.map.hud.toast(e9 ? 'The ' + w.t[1].toLowerCase() + ' got scared and ran off — next time don’t run, crouch (' + (A.touch() ? '⬇' : 'C') + ') and creep up' : (w.emo ? w.emo + ' ' : '') + w.t[0] + w.ga[0] + ' 놀라 달아났어요 — 다음엔 뛰지 말고 쪼그려(' + (A.touch() ? '⬇' : 'C') + ') 살금살금 다가가요', 3.6); }
    if (w.flee === 'fly') { let best = null; for (const c of LAND[w.id] || []) { const d1 = Math.hypot(c.x - s.x, c.z - s.z), d2 = Math.hypot(c.x - me.x, c.z - me.z); if (d1 < 22 || d1 > 75 || d2 < 25) continue; if (ACT.some(o => o !== s && Math.hypot(o.x - c.x, o.z - c.z) < 7)) continue; if (!best || (c.x - s.x) * ax + (c.z - s.z) * az > (best.x - s.x) * ax + (best.z - s.z) * az) best = c; }
      s.md = 3; s.rx = w.id === 'heron' || w.id === 'egret' ? 0.3 : 0; if (best) { const y1 = best.y ?? (w.float ? A.waterY(best.wk || 1) : A.gy(best.x, best.z)); go(s, 'fly', best.x, best.z, 1.2 + Math.hypot(best.x - s.x, best.z - s.z) / 9, y1); s.mv.land = best; }
      else { go(s, 'fly', s.x + ax * 60, s.z + az * 60, 8, s.y + 14); s.mv.land = null; } put(s); hand(); return; }
    if (w.flee === 'bound') { for (const da of [0, 0.6, -0.6, 1.2, -1.2, 2.0, -2.0]) { const c = Math.cos(da), sn = Math.sin(da), dx = ax * c - az * sn, dz = ax * sn + az * c, x1 = s.x + dx * 24, z1 = s.z + dz * 24; if (A.okLand(x1, z1) && !A.wAt(x1, z1) && A.okLand(s.x + dx * 12, s.z + dz * 12) && !A.wAt(s.x + dx * 12, s.z + dz * 12)) { s.md = 5; go(s, 'run', x1, z1, 3); put(s); hand(); return; } }
      gone(s, 30); return; }
    if (w.flee === 'climb' && s.tr) { const [tx, tz, ts] = s.tr, d = Math.hypot(tx - s.x, tz - s.z), r = 0.32 * ts; if (d < 10) { s.md = 5; go(s, 'run', tx + (s.x - tx) / d * r, tz + (s.z - tz) / d * r, Math.max(0.3, (d - r) / 4.5)); s.mv.nx = 'up'; put(s); hand(); return; } }
    if (w.flee === 'dive' && s.dw) { s.md = 5; go(s, 'jump', s.x + s.dw[0] * 3, s.z + s.dw[1] * 3, 0.7, A.waterY(1) - 0.1); put(s); hand(); return; }
    if (w.flee === 'hop') { const dx = s.dw ? s.dw[0] : ax, dz = s.dw ? s.dw[1] : az; s.md = 4; go(s, 'hop', s.x + dx * 0.9, s.z + dz * 0.9, 0.42); s.mv.n = 2; put(s); hand(); return; }
    s.md = 5; go(s, 'run', s.x + ax * 7, s.z + az * 7, 1.4); s.mv.nx = 'hide'; put(s); hand(); }
  // 매 프레임: 움직이는 동물만(보통 0~2) + 가까울 때 0.1초 판정
  function tick(dt) { if (!on) return; if (MOV.length) for (let i = MOV.length - 1; i >= 0; i--) step(MOV[i], dt);
    if (near && (q += dt) >= 0.1) { q = 0; sense(); } }
  function step(s, dt) { const m = s.mv; m.t += dt; const u = Math.min(1, m.t / m.T), x = m.x0 + (m.x1 - m.x0) * u, z = m.z0 + (m.z1 - m.z0) * u; s.x = x; s.z = z;
    if (m.k === 'run' || m.k === 'walk' || m.k === 'come') { const f = u * 6, i = Math.min(5, f | 0); s.y = m.ys[i] + (m.ys[i + 1] - m.ys[i]) * (f - i) + (m.k === 'run' && s.w.id === 'waterdeer' ? Math.abs(Math.sin(m.t * 7)) * 0.3 : 0); }
    else if (m.k === 'fly') { const up = Math.min(1, u * 4), H = m.land ? 5 + Math.hypot(m.x1 - m.x0, m.z1 - m.z0) * 0.06 : 0; s.y = m.land ? m.y0 + (m.y1 - m.y0) * u + Math.sin(Math.PI * u) * H : m.y0 + (m.y1 - m.y0) * up * up; }
    else if (m.k === 'up') { s.y = m.y0 + 2.6 * u; s.rx = -1.35; }
    else if (m.k === 'jump') { s.y = m.y0 + (m.y1 - m.y0) * u + Math.sin(Math.PI * u) * 0.5; s.rx = 0.6 * u; }
    else if (m.k === 'hop') { s.y = m.y0 + Math.sin(Math.PI * u) * 0.28; }
    else if (m.k === 'sink') { s.y = m.y0 - 0.4 * u; s.vis = 1 - u * 0.7; }
    put(s); if (u < 1) return;
    const k = m.k, nx = m.nx; m.k = ''; m.nx = '';
    if (k === 'walk') { s.md = 0; s.st = Math.min(s.st, 1); MOV.splice(MOV.indexOf(s), 1); put(s); hand(); return; }
    if (k === 'come') { const me = A.map.player.pos(); s.md = 0; s.st = 1; s.calm = 6; s.ry = Math.atan2(me.x - s.x, me.z - s.z); MOV.splice(MOV.indexOf(s), 1); put(s); hand(); return; }   /* 다 와서 나를 보고 섬 */
    if (k === 'run' && nx === 'up') { s.md = 1; go(s, 'up', s.x, s.z, 0.9, s.y + 2.6); return; }
    if (k === 'up' || nx === 'hide') { gone(s, 30); return; }
    if (k === 'run') { s.md = 0; s.st = 0; s.calm = 0; MOV.splice(MOV.indexOf(s), 1); s.hx = s.x; s.hz = s.z; s.hy = s.y; put(s); hand(); return; }   /* 고라니 = 멀리 가서 다시 풀 뜯기(그 자리가 새 집) */
    if (k === 'fly') { if (!m.land) { gone(s, 40); return; } s.md = 0; s.st = 0; s.rx = 0; s.y = m.y1; s.hx = s.x; s.hz = s.z; s.hy = s.y; s.wk = m.land.wk || s.wk; s.dw = m.land.dw || s.dw; if (m.land.gy != null) s.gy = m.land.gy; if (m.land.ry != null) s.ry = s.ry0 = m.land.ry; MOV.splice(MOV.indexOf(s), 1); put(s); hand(); return; }
    if (k === 'jump') { s.md = 0; s.rx = 0.4; go(s, 'sink', s.x, s.z, 0.5); return; }
    if (k === 'hop') { if ((m.n = (m.n || 1) - 1) > 0) { const dx = m.x1 - m.x0, dz = m.z1 - m.z0; go(s, 'hop', s.x + dx, s.z + dz, 0.42); m.n = 1; s.md = 4; return; } s.md = 0; go(s, 'sink', s.x, s.z, 0.35); return; }
    if (k === 'sink') { gone(s, s.w.flee === 'dive' ? 40 : 25); return; } }
  // E 살펴보기 → 카드(그림 + 생김새 + 사는 곳·먹이·겨울나기·지키는 법) · 처음 = 도감 칸 + 관찰 솜씨
  function look(s) { if (!s || s.st > 1 || A.busy()) return; const w = s.w, e9 = en(), L = e9 ? 1 : 0, neu = A.GAME.found('wild:' + w.id); { const k9 = 'wl:' + w.id; if (neu) { A.GAME.pick(k9); A.skUp('look', 3, 'wild:' + w.id); if (A.deed) A.deed('wild', s.x, s.z, 'w:' + w.id); }   /* NB-2 첫 만남 = 행적 한 줄(이웃 소식) */ else if (!A.GAME.picked(k9)) { A.GAME.pick(k9); A.skUp('look', 1, 'wild:' + w.id); } }   /* FIX-LK1 결: 같은 동물 다시 보기 = 솜씨 하루 한 번 */ s.st = 1; s.calm = 4;
    const W9 = ST(), key = w.id + ':' + s.j, add = W9.k[key] !== S().day; let cnt = W9.n[w.id] || 0; const lv0 = lvOf(cnt); if (add) { W9.k[key] = S().day; cnt = W9.n[w.id] = cnt + 1; A.GAME.mark(); }
    const lv = lvOf(cnt); let neuT = false; if (lv === 2 && lv0 < 2 && !W9.title && WILD.filter(q => SP.some(z => z.w === q)).every(q => lvOf(W9.n[q.id] || 0) >= 2)) { W9.title = S().day; neuT = true; A.GAME.mark(); }
    const row = (k, t) => '<div style="margin-top:6px"><b>' + k + '</b> ' + A.esc(t[L]) + '</div>', stars = lv ? '⭐'.repeat(lv) + ' ' : '';
    const prog = e9 ? stars + 'Looked ' + cnt + (cnt === 1 ? ' time' : ' times') + (lv < 2 ? ' — ' + ((lv ? 30 : 10) - cnt) + ' more for ' + (lv ? '⭐⭐' : '⭐') : '') : stars + '살펴본 횟수 ' + cnt + '번' + (lv < 2 ? ' — ' + (lv ? '⭐⭐' : '⭐') + '까지 ' + ((lv ? 30 : 10) - cnt) + '번' : '');
    const P9 = A.openP('<h3>' + (w.emo ? w.emo + ' ' : '') + A.esc(w.t[L]) + '</h3><div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap"><canvas class="twn-wild" width="260" height="190" style="border:4px solid #8a6a40;border-radius:12px;flex:none;max-width:100%"></canvas><div style="flex:1;min-width:220px;font-size:16px;line-height:1.5">' + A.esc(w.look[L])
      + row(e9 ? 'Home' : '사는 곳', w.live) + row(e9 ? 'Food' : '먹이', w.food) + row(e9 ? 'Winter' : '겨울나기', w.win) + row(e9 ? 'How we help' : '지키는 법', w.care)
      + (neu ? '<div style="margin-top:8px;font-weight:800;color:#2f8a3a">★ ' + (e9 ? 'First-meeting sticker — new in your codex' : '첫 만남 스티커 — 도감에 새로 적었어요') + '</div>' : '')
      + '<div class="sm" style="margin-top:6px">' + A.esc(prog) + (add ? '' : e9 ? ' (already counted this one today)' : ' (이 친구는 오늘 벌써 셌어요)') + '</div>'
      + (lv > lv0 ? '<div style="margin-top:4px;font-weight:800;color:#2f8a3a">' + '⭐'.repeat(lv) + ' ' + (e9 ? 'Observation star!' : '관찰 별을 받았어요') + '</div>' : '')
      + (neuT ? '<div style="margin-top:4px;font-weight:900">🏅 ' + (e9 ? 'New title: Field watcher' : '새 칭호: 들판 관찰가') + '</div>' : '')
      + '</div></div><div class="row"><button class="sub" data-a="x">' + (e9 ? 'Close' : '닫기') + '</button></div>', false, 'wild');
    const cv = P9.querySelector('.twn-wild'); if (cv) drawWild(cv, w, { bg: BG[s.reed ? 'river' : w.hab] }); P9.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; A.map.sfx && A.map.sfx(neu || lv > lv0 ? 'ding' : 'tick'); if (neu) A.bagShow(); }
  // 도감 칸(이 마을에 사는 곳이 있는 종만) · 칸 그림 = 같은 모양 옆모습(이모지가 없는 종도 같은 꼴)
  function pic(w, sil) { const k9 = w.id + (sil ? ':s' : ''); if (picN[k9]) return picN[k9]; const c = document.createElement('canvas'); c.width = 84; c.height = 60; drawWild(c, w, sil ? { sil: '#4b4f55' } : {}); return (picN[k9] = '<img src="' + c.toDataURL() + '" alt="" style="height:36px;width:auto;display:inline-block">'); }
  const dexList = () => { const N9 = ST().n, e9 = en(), L9 = WILD.filter(w => SP.some(s => s.w === w)).map(w => { const c = N9[w.id] || 0, lv = lvOf(c); return { id: w.id, icon: pic(w), sil: pic(w, true), t: w.t, hint: w.hint, extra: '★ ' + (lv ? '⭐'.repeat(lv) + ' ' : '') + (e9 ? c + ' looks' : c + '번') }; });   /* 못 만난 칸 = 실루엣 + 때·곳 · 만난 칸 = ★ 스티커 + 관찰 별 */
    L9.title = ST().title ? ['들판 관찰가', 'Field watcher'] : null; return L9; };
  // PHOTO-2 셔터(찍는 그 한 번만 · 매 프레임 X): 나온 동물(12마리 안)마다 투영 상자 → 화면 안 · 눈에서 가리는 상자 없음 → { 종 · 행동 · 화면 키 비율 · 거리 · 갈대 }
  //   행동 = 지금 하는 움직임 그대로(엔진이 저절로 만든 것): 날아오름 · 물에 뛰어듦 · 나무 타기 · 달아남 · 다가옴 · 걷기·헤엄 · 두리번(고개 듦) · 쉬기(풀 뜯기·기다리기)
  function actOf(s) { const k = s.mv.k, w = s.w; if (k === 'fly') return 'fly'; if (k === 'jump' || k === 'sink' || (k === 'hop' && w.flee === 'hop')) return 'dive'; if (k === 'up' || (k === 'run' && s.mv.nx === 'up')) return 'climb';
    if (k === 'come') return 'come'; if (k === 'run') return 'run'; if (k === 'walk') return w.float ? 'swim' : 'walk'; if (s.st === 1 || s.md === 2) return 'alert'; return 'rest'; }
  function shot(cam, eye) { SHOT.length = 0; if (!on || !cam) return SHOT;
    for (const s of ACT) { if (s.st === 3 || (s.vis ?? 1) < 0.45) continue; const w = s.w, sz = WSZ[w.id], h = (sz ? sz[1] : 0.5) * w.sc;
      VP.set(s.x, s.y + h * 0.5, s.z).project(cam); if (VP.z > 1 || VP.z < -1 || Math.abs(VP.x) > 0.92 || Math.abs(VP.y) > 0.92) continue; const cx = VP.x, cy = VP.y;
      VP.set(s.x, s.y + h, s.z).project(cam); const ty = VP.y; VP.set(s.x, s.y, s.z).project(cam); const fr = Math.abs(ty - VP.y) / 2, d = eye ? Math.hypot(s.x - eye[0], s.z - eye[2]) : s.d;
      if (eye && A.los && !A.los(eye, [s.x, s.y + h * 0.6, s.z])) continue;   /* 벽·집에 가려진 동물은 안 셈(눈 = 내 머리) */
      SHOT.push({ id: w.id, act: actOf(s), fr: +fr.toFixed(3), d: +d.toFixed(1), cx: +cx.toFixed(2), cy: +cy.toFixed(2), reed: s.reed, j: s.j }); }
    SHOT.sort((a, b) => b.fr - a.fr); return SHOT; }
  function dispose() { clear(); for (const k in MESH) MESH[k].dispose(); for (const k in MESH) delete MESH[k]; }
  return { init, sec, tick, dispose, dexList, look, shot, spots: () => SP.map(s => [s.w.id, Math.round(s.hx), Math.round(s.hz), s.kc]), actOf: j => SP[j] ? actOf(SP[j]) : null, get on() { return on; }, get near() { return crouchOn; }, can: id => { const w = wildById(id); return !!w && w.sea.includes(A.sea()) && SP.some(s => s.w === w); },
    info: () => ({ on, n: SP.length, act: ACT.length, mov: MOV.length, near, crouch: crouchOn, still: +stillT.toFixed(1), stars: { ...ST().n }, title: ST().title || null, buildMs, secMs: +secMs.toFixed(3), secMax: +secMax.toFixed(3), mesh: Object.fromEntries(Object.entries(MESH).map(([k, h]) => [k, { count: h.m.count, vis: h.m.visible, tri: buildTri(k) }])),
      spots: SP.map((s, j) => ({ j, id: s.w.id, hab: s.w.hab, x: +s.x.toFixed(1), z: +s.z.toFixed(1), y: +s.y.toFixed(2), ry: +s.ry.toFixed(2), hx: +s.hx.toFixed(1), hz: +s.hz.toFixed(1), st: s.st, act: s.act, md: s.md, mv: s.mv.k, reed: s.reed, i: s.i, d: +s.d.toFixed(1), ok: avail(s.w) })) }),
    hot: () => HH.map(o => ({ off: o.h.hot.off, x: +o.h.hot.x.toFixed(1), z: +o.h.hot.z.toFixed(1), label: o.h.hot.label, id: o.s ? o.s.w.id : null })),
    spots: id => SP.filter(s => s.w.id === id).map(s => [s.hx, s.hz]),   /* HEAL-1 소리 자리(읽기만 · 짓기 뒤 한 번) */
    vis: v => { for (const k in MESH) MESH[k].m.visible = !!v && MESH[k].m.count > 0; },   /* 시험: 그리기 수 견주기 */
    lookAt: j => look(SP[j]), reset: () => { for (const s of SP) { const m9 = MOV.indexOf(s); if (m9 >= 0) MOV.splice(m9, 1); s.mv.k = ''; home(s); } lastAct = '-'; sec(); } };
  function buildTri(k) { const A9 = MESH[k] && MESH[k].m.geometry.attributes.position; return A9 ? A9.count / 3 : 0; }
}
