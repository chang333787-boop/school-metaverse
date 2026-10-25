// 🧭 발견 길잡이(DISC-1 · 사용자 10-25 '오늘 할 일이 더 다양하게 나와야 애들이 이런 콘텐츠도 있나 알 것 같은데 한 5개는' · '애들이 다 즐기질 못할 것 같아 · 자연스럽게 다가올 수 있게')
//   원칙: 한꺼번에 쏟지 않고 하루 서너 개만 세상이 먼저 말을 검 · 안 해 본 것을 먼저 · 숫자·%·물음표·체크리스트 X
//   콘텐츠 표 DISC = 줄 하나가 콘텐츠 하나(자리 · 했는지 · 때 · 할 일 줄 · 소문 · 엽서 · 꼬리) — 판에 그 자리가 없으면 그 줄은 저절로 빠짐(지어내지 않음)
//   이 표 하나를 네 길이 같이 씀:
//     ① 오늘 할 일 ④ 🆕 처음 해 볼 것(안 해 본 것 · 가깝고 지금 열린 것 먼저 · 날짜 씨앗) + ⑤ ⏰ 오늘만(그날 상황 표 ONLY · 물때·고장·공장 상자·겨울·날씨)
//     ② 아침 엽서(잠에서 깬 뒤 창이 다 닫히고 나서 한 장 · 하루 한 장 · 안 해 본 것만 · 지도 조각 · 누르면 빨간 선)
//     ③ 소문(아침 칠판·이웃 말풍선은 town_news.js가 c.disc로 받음 · 지나가는 이웃 말풍선 하루 둘 · 들은 것은 수첩 📋 할 일 칸 '들은 이야기'에 남음)
//     ④ 끝 창 꼬리(콘텐츠 하나를 처음 해낸 순간 열린 창 맨 밑에 '다음엔 ○○도 있대요' 한 줄 · 꼬리 줄이 안 해 본 것일 때만)
//   했는지 = 이미 있는 저장 값만 읽음(v(S) = 해 본 정도 · 0 = 아직 · 늘면 이번에 함) · 이 모듈의 저장 = GAME.S.disc(오늘 고른 것 · 엽서 날 · 들은 이야기)만
//   렉: 매 프레임 일 0 · 1초 칸 sec(줄 스무여 개의 v 읽기 · 바뀔 때만 GAME.mark) · 그리기 0(엽서 = DOM 한 장 · 지도 조각 캔버스 하나는 뜰 때만)
export const DISC_V = 1;
const T2 = (ko, en) => [ko, en];
const O = (S, k) => (S && S[k] && typeof S[k] === 'object' ? S[k] : {});
const B = (S, k) => O(O(S, 'bldg'), k);
const nK = o => (o && typeof o === 'object' ? Object.keys(o).length : 0);
const nT = (S, L) => { const g = O(O(S, 'tbl'), 'g'); let n = 0; for (const k of L) n += (g[k] && g[k].n) | 0; return n; };
const sk = S => { const s = O(O(S, 'xp'), 'ski'); return ((s.c1 && s.c1.n) | 0) + ((s.c2 && s.c2.n) | 0) + ((s.c3 && s.c3.n) | 0); };

// ───────── 콘텐츠 표(줄 하나 = 콘텐츠 하나) ─────────
//   at: { bk: 건물 갈래(town_bldg bldgKind) } | { re: 장소 이름 정규식, kind?: 장소 갈래 } | { k: 'home'|'ski'|'jg'|'surp' }(마을 쪽이 자리를 줌)
//   v(S) = 해 본 정도 · hrs = 문 연 때(docs/systems/town_hours.md와 같은 수) · sea = 그 계절에만 · pri 2 = 다 해 봤을 때 꺼내는 줄(이미 있는 할 일 갈래)
//   t = 할 일 줄 · tp = 한 뒤 줄 · rum = 이웃 소문(말투 '~대') · card = 엽서·칠판 한 줄(사실) · nx = 꼬리 '다음엔 …' · next = 꼬리로 권할 줄 id(차례대로 · 안 해 본 것만)
//   글은 사실만 — 그 모듈이 실제로 하는 일(town_bldg·town_xp·town_ski·town_table·town_show·town_janggu·town_herd·town_cozy·town_surp 머리 주석)
export const DISC = [
  { id: 'cinema', ic: '🎬', at: { bk: 'cinema' }, hrs: [10, 21], v: S => B(S, 'cinema').seen | 0, rain: 1, next: ['museum', 'cafe'],
    t: T2('영화관에서 시간표 보고 영화 보기', 'See a film at the cinema (read the timetable)'), tp: T2('영화관에서 영화를 봤어요', 'Saw a film at the cinema'),
    rum: T2('영화관 벽에 상영 시간표가 붙어 있대. 표에 적힌 자리를 찾아 앉는대', 'The cinema has a timetable on the wall. You find the seat written on your ticket'),
    card: T2('영화관 — 표에 적힌 자리를 찾아 앉아요', 'Cinema — find the seat on your ticket'), nx: T2('박물관에서 옛 물건 쓰임도 알아볼 수 있대요', 'you can find out what old tools were for at the museum') },
  { id: 'museum', ic: '🏺', at: { bk: 'museum' }, hrs: [9, 18], v: S => nK(B(S, 'museum').got), rain: 1, next: ['elder', 'factory'],
    t: T2('박물관에서 옛 물건 쓰임 알아보기', 'Find out what old tools were for at the museum'), tp: T2('박물관에서 옛 물건을 알아봤어요', 'Learned about old tools at the museum'),
    rum: T2('박물관에 맷돌이랑 지게가 있대. 옛날엔 그걸로 무슨 일을 했을까', 'The museum has a millstone and an A-frame carrier. What were they used for?'),
    card: T2('박물관 — 받침대 위 옛 물건 넷', 'Museum — four old tools on stands'), nx: T2('노인정 어르신께 옛 땅이름 이야기도 들을 수 있대요', 'the elders at the senior centre tell stories about old place names') },
  { id: 'elder', ic: '👵', at: { bk: 'elder' }, hrs: [9, 18], v: S => B(S, 'elder').n | 0, rain: 1, next: ['museum', 'cafe'],
    t: T2('노인정에서 옛 땅이름 이야기 듣기', 'Hear about old place names at the senior centre'), tp: T2('노인정에서 옛 땅이름 이야기를 들었어요', 'Heard about old place names at the senior centre'),
    rum: T2('노인정 어르신이 배다리, 역말 같은 옛 땅이름 뜻을 알려 주신대', 'An elder at the senior centre explains old place names like Baedari and Yeongmal'),
    card: T2('노인정 — 어르신과 우물고누도 둘 수 있어요', 'Senior centre — you can also play well gonu with an elder'), nx: T2('박물관에 옛날 물건이 있대요', 'there are old tools at the museum') },
  { id: 'factory', ic: '🏭', at: { bk: 'factory' }, hrs: [9, 18], v: S => B(S, 'factory').n | 0, next: ['post', 'bank'],
    t: T2('공장에서 만드는 차례 견학하기', 'Tour the factory line'), tp: T2('공장 만드는 차례를 견학했어요', 'Toured the factory line'),
    rum: T2('공장에서는 한 사람이 다 만들지 않고 일을 나눠서 차례로 만든대', 'At the factory no one makes it all — the work is split up and done in order'),
    card: T2('공장 — 1번 자리부터 차례로 따라가요', 'Factory — follow the line from spot 1'), nx: T2('우체국에서 소포도 보낼 수 있대요', 'you can send a parcel at the post office') },
  { id: 'bank', ic: '🏦', at: { bk: 'bank' }, hrs: [9, 16], v: S => B(S, 'bank').n | 0, next: ['post'],
    t: T2('은행에서 저금하기', 'Save money at the bank'), tp: T2('은행에 저금했어요', 'Saved money at the bank'),
    rum: T2('은행에 돈을 넣어 두면 통장에 한 줄씩 적힌대', 'Put money in the bank and a line is written in your bankbook'),
    card: T2('은행 — 창구는 9시부터 4시까지예요', 'Bank — the counter is open 9 to 4'), nx: T2('우체국에서 이웃에게 소포를 보낼 수 있대요', 'you can send a parcel to a neighbour at the post office') },
  { id: 'post', ic: '📦', at: { re: /우체국/ }, hrs: [9, 18], v: S => B(S, 'post').n | 0, next: ['bank', 'factory'],
    t: T2('우체국에서 이웃에게 소포 보내기', 'Send a parcel to a neighbour at the post office'), tp: T2('우체국에서 소포를 보냈어요', 'Sent a parcel at the post office'),
    rum: T2('우체국에서 소포를 보내면 다음 날 받은 이웃이 고맙다고 한대', 'Send a parcel and the neighbour thanks you the next day'),
    card: T2('우체국 — 지도 보고 받는 사람 주소 칸을 골라요', 'Post office — pick the address square on the map'), nx: T2('은행에 저금도 할 수 있대요', 'you can save money at the bank') },
  { id: 'police', ic: '👮', at: { bk: 'police' }, v: S => B(S, 'police').n112 | 0, next: ['clinic'],
    t: T2('경찰서에서 112 신고 연습하기', 'Practise a 112 call at the police station'), tp: T2('경찰서에서 112 신고를 연습했어요', 'Practised a 112 call'),
    rum: T2('경찰서에 가면 112에 전화할 때 무엇을 말하는지 연습할 수 있대', 'At the police station you can practise what to say when you call 112'),
    card: T2('경찰서 — 어디인지 또박또박 말하는 연습', 'Police station — practise saying where you are'), nx: T2('병원에서 응급 처치도 배울 수 있대요', 'you can learn first aid at the hospital') },
  { id: 'clinic', ic: '🩹', at: { bk: 'clinic' }, hrs: [9, 18], v: S => B(S, 'clinic').nfa | 0, next: ['police', 'shelter'],
    t: T2('병원에서 응급 처치 배우기', 'Learn first aid at the hospital'), tp: T2('병원에서 응급 처치를 배웠어요', 'Learned first aid'),
    rum: T2('병원에서 넘어져 다쳤을 때 먼저 할 일을 알려 준대', 'The hospital teaches what to do first when someone falls and gets hurt'),
    card: T2('병원 — 다쳤을 때 먼저 할 일', 'Hospital — what to do first when someone is hurt'), nx: T2('경찰서에서 112 신고 연습도 할 수 있대요', 'you can practise a 112 call at the police station') },
  { id: 'shelter', ic: '🥣', at: { bk: 'shelter' }, hrs: [10, 17], v: S => B(S, 'shelter').n | 0, next: ['herd'],
    t: T2('동물보호센터에서 동물 밥 주기', 'Feed the animals at the animal shelter'), tp: T2('동물보호센터에서 밥을 줬어요', 'Fed the animals at the shelter'),
    rum: T2('동물보호센터 강아지랑 고양이가 밥때를 기다린대', 'The dogs and cats at the animal shelter are waiting for feeding time'),
    card: T2('동물보호센터 — 그릇마다 알맞은 사료를 골라요', 'Animal shelter — choose the right food for each bowl'), nx: T2('목장에서 양몰이도 할 수 있대요', 'you can herd sheep at the farm') },
  { id: 'cafe', ic: '🎲', at: { re: /보드게임 카페/ }, v: S => nT(S, ['omok', 'tang', 'mem', 'yut', 'hop']), rain: 1, next: ['elder'],
    t: T2('보드게임 카페에서 판 놀이 하기', 'Play a board game at the board-game café'), tp: T2('보드게임 카페에서 판 놀이를 했어요', 'Played a board game at the café'),
    rum: T2('보드게임 카페 손님들이 윷놀이랑 오목 상대를 찾는대', 'The board-game café guests are looking for someone to play yut and omok'),
    card: T2('보드게임 카페 — 앉아 있는 손님과 한 판', 'Board-game café — play a guest who is sitting there'), nx: T2('노인정 어르신은 우물고누를 잘 두신대요', 'the elders at the senior centre are good at well gonu') },
  { id: 'aqua', ic: '🐠', at: { re: /아쿠아리움/, kind: 'public' }, v: S => (O(S, 'learn')['nature:sound_water'] ? 1 : 0), rain: 1, next: ['insect'],
    t: T2('대형 아쿠아리움 쇼 보기', 'Watch the show at the big aquarium'), tp: T2('아쿠아리움 쇼를 봤어요', 'Watched the aquarium show'),
    rum: T2('아쿠아리움에서 물속에서는 소리가 어떻게 가는지 보여 준대', 'The aquarium shows how sound travels under water'),
    card: T2('대형 아쿠아리움 — 물속 소리 쇼', 'Big aquarium — the underwater sound show'), nx: T2('곤충 박물관에서 애벌레가 자라는 차례도 볼 수 있대요', 'the insect museum shows how a caterpillar grows') },
  { id: 'insect', ic: '🦋', at: { re: /곤충 박물관/, kind: 'public' }, v: S => (O(S, 'learn')['nature:metamorph'] ? 1 : 0), rain: 1, next: ['aqua'],
    t: T2('곤충 박물관 쇼 보기', 'Watch the show at the insect museum'), tp: T2('곤충 박물관 쇼를 봤어요', 'Watched the insect museum show'),
    rum: T2('곤충 박물관에서 알이 어른벌레가 되기까지를 차례로 보여 준대', 'The insect museum shows how an egg becomes an adult insect, step by step'),
    card: T2('곤충 박물관 — 한살이 쇼', 'Insect museum — the life-cycle show'), nx: T2('대형 아쿠아리움에도 쇼가 있대요', 'the big aquarium has a show too') },
  { id: 'crater', ic: '⛰', at: { re: /까망봉/, kind: 'prop' }, v: S => O(S, 'xp').sc | 0, clear: 1, next: ['gorge', 'isle'],
    t: T2('까망봉 분화구에서 돌 살펴보기', 'Look at the rocks in the Kkamang crater'), tp: T2('까망봉 돌을 살펴봤어요', 'Looked at the Kkamang rocks'),
    rum: T2('까망봉 돌은 구멍이 숭숭 나 있대. 돋보기로 보면 잘 보인대', 'The rocks on Kkamang are full of holes. You can see them with a magnifier'),
    card: T2('까망봉 — 쉬고 있는 작은 화산', 'Kkamang — a small sleeping volcano'), nx: T2('층층골 절벽에는 흙 띠가 층층이 있대요', 'the Layer Gorge cliff has layers of soil') },
  { id: 'gorge', ic: '🦴', at: { re: /층층골/, kind: 'prop' }, v: S => nK(O(S, 'xp').fos), clear: 1, next: ['crater'],
    t: T2('층층골 흙더미에서 화석 찾기', 'Dig for fossils at Layer Gorge'), tp: T2('층층골에서 화석을 찾았어요', 'Found a fossil at Layer Gorge'),
    rum: T2('층층골 절벽은 띠마다 흙 색이 다르대. 밑에 흙더미를 삽으로 파 보래', 'Each band of the Layer Gorge cliff is a different colour. Try digging the heaps below'),
    card: T2('층층골 — 띠마다 다른 흙과 폭포', 'Layer Gorge — bands of soil and a waterfall'), nx: T2('까망봉 돌도 돋보기로 볼 수 있대요', 'you can look at the Kkamang rocks with a magnifier') },
  { id: 'isle', ic: '🏝', at: { re: /썰물섬/, kind: 'prop' }, isle: 1, v: S => O(S, 'xp').il | 0, next: ['crater'],
    t: T2('썰물섬 바닷길 걸어 보기', 'Walk the sea path to Ebb-Tide Isle'), tp: T2('썰물섬까지 걸어갔어요', 'Walked to Ebb-Tide Isle'),
    rum: T2('물이 빠지면 바다 가운데 섬까지 모랫길이 생긴대', 'When the tide goes out, a sand path appears out to an island'),
    card: T2('썰물섬 — 물때를 보고 건너요', 'Ebb-Tide Isle — check the tide before you cross'), nx: T2('섬 돌탑에 내 돌을 얹으면 다음에 와도 남아 있대요', 'a stone you add to the island cairn stays there') },
  { id: 'ski', ic: '⛷', at: { k: 'ski' }, sea: ['winter'], v: sk, next: ['gorge'],
    t: T2('스키장 기문 코스 타기', 'Ski the gate course'), tp: T2('스키장 기문 코스를 탔어요', 'Skied the gate course'),
    rum: T2('겨울엔 스키장 비탈에 빨강 파랑 기문이 번갈아 선대', 'In winter red and blue gates stand on the ski slope'),
    card: T2('스키장 — 빨강 파랑 기문 사이로', 'Ski slope — between the red and blue gates'), nx: T2('스키장 기문은 초급을 다 지나면 중급이 열린대요', 'the medium gate course opens after the easy one') },
  { id: 'herd', ic: '🐑', at: { re: /^목장$/, kind: 'prop' }, v: S => O(S, 'herd').n | 0, next: ['shelter'],
    t: T2('목장에서 양몰이 하기', 'Herd sheep at the farm'), tp: T2('목장에서 양을 몰았어요', 'Herded sheep at the farm'),
    rum: T2('목장 양들은 누가 뒤에서 천천히 몰아 줘야 우리로 들어간대', 'The farm sheep only go into the pen if someone walks slowly behind them'),
    card: T2('목장 — 양들을 우리로 몰아요', 'Farm — guide the sheep into the pen'), nx: T2('동물보호센터 동물들도 밥때를 기다린대요', 'the animals at the shelter are waiting to be fed') },
  { id: 'jg', ic: '🥁', at: { k: 'jg' }, v: S => O(S, 'jg').n | 0, next: ['cafe'],
    t: T2('장구 장단 배우기', 'Learn a janggu rhythm'), tp: T2('장구 장단을 배웠어요', 'Learned a janggu rhythm'),
    rum: T2('광장 곁에서 장구 선생님이 쿵 덕 장단을 가르쳐 준대', 'Near the square the janggu teacher teaches kung-deok rhythms'),
    card: T2('장구 — 쿵 덕 장단 주고받기', 'Janggu — trade kung-deok rhythms'), nx: T2('내 장단을 지으면 사람들 앞에서 들려줄 수도 있대요', 'once you make your own rhythm you can play it for people') },
  { id: 'yard', ic: '🌼', at: { k: 'home' }, v: S => (Array.isArray(O(S, 'home').yard) ? O(S, 'home').yard.filter(Boolean).length : 0), next: ['cafe'],
    t: T2('우리 집 마당에 물건 놓아 꾸미기', 'Decorate our yard with something from the bag'), tp: T2('우리 집 마당을 꾸몄어요', 'Decorated our yard'),
    rum: T2('집 대문 앞 마당에 곰 인형이나 솔방울을 놓아 꾸밀 수 있대', 'You can put a teddy bear or a pine cone in the yard by your door'),
    card: T2('우리 집 마당 — 가방 물건 하나 놓기', 'Our yard — put one thing from the bag'), nx: T2('이웃이 마당을 보고 며칠 뒤 말을 건대요', 'neighbours notice the yard and mention it a few days later') },
  { id: 'surp', ic: '👀', at: { k: 'surp' }, v: S => nK(O(O(S, 'xp'), 'surp')), next: ['crater'],
    t: T2('소문 난 곳에서 숨은 놀람 찾기', 'Find a hidden wonder where people say'), tp: T2('숨은 놀람을 찾았어요', 'Found a hidden wonder'),
    rum: null, card: null, nx: T2('높은 곳에 가만히 서 있으면 멀리 무엇이 있는지 보인대요', 'if you stand still somewhere high you can see what is far away') },
  /* pri 2 = 위 줄을 다 해 본 뒤 — 이미 있는 할 일 갈래 가운데 한 번도 안 한 것(도장·요리·먹어 본 것으로 판정) */
  { id: 'summit', ic: '⛰', pri: 2, at: { k: 'summit' }, v: S => (O(S, 'dex')['⛰'] != null ? 1 : 0),
    t: T2('산꼭대기 도장 찍기', 'Get the summit stamp'), tp: T2('산꼭대기 도장을 찍었어요', 'Got the summit stamp'), rum: T2('뒷산 꼭대기에 올라가면 도장을 찍을 수 있대', 'You can get a stamp at the top of the hill'), card: T2('뒷산 꼭대기 — 도장 찍는 곳', 'Hilltop — the stamp spot'), nx: null },
  { id: 'stones', ic: '👣', pri: 2, at: { k: 'stones' }, v: S => (O(S, 'dex')['👣'] != null ? 1 : 0),
    t: T2('징검다리 건너기', 'Cross the stepping stones'), tp: T2('징검다리를 건넜어요', 'Crossed the stepping stones'), rum: T2('냇물 징검다리를 끝까지 건너면 도장을 준대', 'Cross the stepping stones to the end and you get a stamp'), card: T2('징검다리 — 돌 위로 건너요', 'Stepping stones — walk across'), nx: null },
  { id: 'book', ic: '📖', pri: 2, at: { k: 'book' }, v: S => (O(S, 'dex')['📖'] != null ? 1 : 0),
    t: T2('도서관에서 책 읽기', 'Read at the library'), tp: T2('도서관에서 책을 읽었어요', 'Read at the library'), rum: T2('도서관에 앉아 책을 읽으면 도장을 찍어 준대', 'Read a book at the library and you get a stamp'), card: T2('도서관 — 앉아서 책 읽기', 'Library — sit and read'), nx: null },
  { id: 'cook', ic: '🍳', pri: 2, at: { k: 'cook' }, v: S => nK(S && S.cooked),
    t: T2('아이 집 부엌에서 요리 하나 만들기', 'Cook a dish in a kitchen'), tp: T2('부엌에서 요리를 만들었어요', 'Cooked a dish'), rum: T2('마트에서 재료를 사 가면 부엌에서 팬케이크를 만들 수 있대', 'Buy ingredients and you can make pancakes in a kitchen'), card: T2('부엌 — 재료 셋으로 요리', 'Kitchen — cook with three ingredients'), nx: null },
];
export const DISC_BY = Object.fromEntries(DISC.map(r => [r.id, r]));

// ───────── 오늘만(그날 상황 · 이미 있는 판정만) — 위에서부터 먼저 · 하나도 없으면 날씨 줄 ─────────
//   when(c) → { why: [ko, en], at?: [x, z], row?: 줄 id(그 줄 v가 늘면 끝), v?: S → 수(늘면 끝) } | null · at만 있고 row·v가 없으면 = 그 자리 10m 안에 가면 끝
export const ONLY = [
  { id: 'tide', ic: '🌊', when: c => { const r = c.has('isle'); if (!r) return null; const L = (c.lows(c.day) || []).find(w => w[1] > c.min + 20 && w[0] < 18 * 60); if (!L) return null; const a = Math.max(L[0], c.min), t = c.hm(Math.round(a / 10) * 10);
      return { row: 'isle', why: a <= c.min ? T2('지금 물이 빠져 썰물섬 바닷길이 드러났대요', 'The tide is out now — the sea path to the isle is showing') : T2('오늘 ' + t + '쯤 물이 빠져 썰물섬 바닷길이 드러난대요', 'Today around ' + t + ' the tide goes out and the sea path shows') }; },
    t: T2('썰물 때 썰물섬까지 걸어가기', 'Walk to Ebb-Tide Isle at low tide'), tp: T2('썰물 때 썰물섬에 갔어요', 'Went to the isle at low tide') },
  { id: 'fix', ic: '🚧', when: c => { const q = O(c.S, 'fix').cur; if (!q || q.rep || q.d !== c.day || !Number.isFinite(q.x)) return null; return { at: [q.x, q.z], why: T2(q.cell + ' 칸 길가 인도에 깨진 보도블록이 있대요', 'Someone saw broken paving in ' + q.cell) }; },
    v: S => { const f = O(S, 'fix'); return (f.cur && f.cur.rep ? 1 : 0) + (Array.isArray(f.log) ? f.log.filter(q => q && q.rep).length : 0); },
    t: T2('깨진 보도블록 찾아 행정복지센터에 알리기', 'Find the broken paving and report it at the community centre'), tp: T2('깨진 보도블록을 알렸어요', 'Reported the broken paving') },
  { id: 'fac', ic: '🚚', when: c => { const L = (c.fac(c.day) || []).find(q => q && q.at && q.t); if (!L) return null; return { at: L.at, why: T2(String(L.t[0]).replace(/^🚚\s*/, ''), String(L.t[1]).replace(/^🚚\s*/, '')) }; },
    t: T2('공장에서 온 상자가 들어온 곳 가 보기', 'Visit the shop where the factory boxes arrived'), tp: T2('공장 상자가 들어온 곳에 가 봤어요', 'Visited where the factory boxes arrived') },
  { id: 'snow', ic: '⛷', when: c => (c.season === 'winter' && c.has('ski') ? { row: 'ski', why: T2('겨울이라 스키장에 기문 코스가 섰대요', 'It’s winter, so the gate course is up on the ski slope') } : null),
    t: T2('스키장 기문 코스 타기', 'Ski the gate course'), tp: T2('스키장 기문 코스를 탔어요', 'Skied the gate course') },
  { id: 'rain', ic: '☂', wx: 1, when: c => { if (c.wx !== 'rain' && c.wx !== 'snow') return null; const r = c.pickWx('rain'); return r ? { row: r.id, why: c.wx === 'snow' ? T2('눈이 와서 안에서 보내기 좋은 날이래요', 'It’s snowing — a good day to be indoors') : T2('비가 와서 안에서 보내기 좋은 날이래요', 'It’s raining — a good day to be indoors') } : null; } },
  { id: 'clear', ic: '☀', wx: 1, when: c => { if (c.wx !== 'clear') return null; const r = c.pickWx('clear'); return r ? { row: r.id, why: T2('맑아서 멀리까지 잘 보이는 날이래요', 'It’s clear — you can see a long way today') } : null; } },
];

// 마을 쪽이 넘기는 것(A): GAME · en() · places() · bk(이름) → 건물 갈래 · spot(k) → [x, z, 이름, 영어 이름] | null(home·ski·jg·surp·summit·stones·book·cook)
//   me() · cellOf(x, z) · busy() · say(t, s) · bubble(o, t) · bubbleBusy() · ped(x, z, r) · tev(ev) · route(p) · mapSnip(cv, pts) · season() · wx() · lows(d) · hm(m) · fac(d) · surpLine() · panel() · on()
export function createDisc(A) {
  const en = () => A.en(), L = t => (t ? t[en() ? 1 : 0] : ''), G = () => A.GAME, S = () => G().S, day = () => S().day | 0;
  const D = () => { const s = S(); let d = s.disc; if (!d || typeof d !== 'object' || d.v !== DISC_V) d = s.disc = { v: DISC_V, p: null, pc: 0, h: [], ps: [0, 0], tl: {} }; if (!Array.isArray(d.h)) d.h = []; if (!Array.isArray(d.ps)) d.ps = [0, 0]; if (!d.tl || typeof d.tl !== 'object') d.tl = {}; return d; };
  const mark = () => G().mark();
  let SP = null, SPD = -1, SPT = 0;   /* 자리 표(하루 한 번 · 짓기 뒤 다시) */
  const nearOf = (L9, me) => { let b = null, bd = 1e9; for (const p of L9) { const q = p.door || [p.x, p.z], d = Math.hypot(q[0] - me.x, q[1] - me.z); if (d < bd) { bd = d; b = p; } } return b; };
  function spots() { const d = day(), P = A.places() || []; if (SP && SPD === d && SP.n === P.length && performance.now() - SPT < 15000) return SP; const me = A.me(), M = {};
    for (const r of DISC) { let s = null;
      if (r.at.k) { const q = A.spot(r.at.k); if (q && Number.isFinite(q[0])) s = { at: [q[0], q[1]], nm: q[2] || '', en: q[3] || q[2] || '', isle: false }; }
      else { const L9 = P.filter(p => p && p.name && p.kind !== 'area' && p.kind !== 'house' && (r.at.bk ? A.bk(p.name) === r.at.bk : r.at.re.test(p.name)) && (!r.at.kind || p.kind === r.at.kind)); const p = nearOf(L9, me); if (p) s = { at: (p.door || [p.x, p.z]).slice(0, 2), nm: p.name, en: p.en || p.name, isle: !!p.isle, p }; }
      if (s && (!r.sea || r.sea.includes(A.season()))) M[r.id] = s; }
    M.n = P.length; SP = M; SPD = d; SPT = performance.now(); return M; }
  const has = id => { const M = spots(); return M[id] ? DISC_BY[id] : null; };
  const vOf = (r, s9) => { try { return +r.v(s9 || S()) || 0; } catch (e) { return 0; } };
  const tried = id => vOf(DISC_BY[id]) > 0;
  const openLater = r => { if (!r.hrs) return true; const m = S().min | 0; return m < r.hrs[1] * 60 - 30; };
  const distTo = (id, me) => { const s = spots()[id]; return s ? Math.hypot(s.at[0] - me.x, s.at[1] - me.z) : 1e9; };
  const seedPick = (L9, k) => (L9.length ? L9[(day() * 7 + k) % L9.length] : null);
  // 안 해 본 것(판에 있는 것만 · 가까운 차례 · pri 1을 먼저 · 다 했으면 pri 2)
  function untried(skip, me) { const M = spots(); me = me || A.me(); for (const pri of [1, 2]) { const L9 = DISC.filter(r => (r.pri || 1) === pri && M[r.id] && !(skip && skip.includes(r.id)) && vOf(r) === 0).sort((a, b) => (openLater(a) ? 0 : 1e5) + distTo(a.id, me) - (openLater(b) ? 0 : 1e5) - distTo(b.id, me)); if (L9.length) return L9; } return []; }
  // ⑤ 날씨 줄이 고를 것(비 = 안에서 · 맑음 = 멀리 보이는 곳) — 안 해 본 것 먼저
  function pickWx(k, skip) { const M = spots(), me = A.me(), L9 = DISC.filter(r => M[r.id] && (k === 'rain' ? r.rain : r.clear) && !(skip && skip.includes(r.id)) && openLater(r)).sort((a, b) => distTo(a.id, me) - distTo(b.id, me)); const u = L9.filter(r => vOf(r) === 0), C9 = (u.length ? u : L9).slice(0, day() <= 1 ? 1 : 3); return seedPick(C9, 3); }   /* 가까운 셋 가운데(1일째 = 가장 가까운 것) */
  const ctxC = skip => ({ S: S(), day: day(), min: S().min | 0, season: A.season(), wx: A.wx(), has: id => (skip && skip.includes(id) ? null : has(id)), lows: d => A.lows(d), hm: m => A.hm(m), fac: d => A.fac(d), pickWx: k => pickWx(k, skip) });
  // 하루 한 번 고름(저장) — ④ 처음 해 볼 것 · ⑤ 오늘만
  function pick() { const d9 = D(), d = day(); if (d9.p && d9.p.d === d) return d9.p; const me = A.me();
    const U = untried(null, me); let n4 = null, again = false; if (U.length) { const near = U.slice(0, d <= 1 ? 1 : 3); n4 = near[(d * 7) % near.length].id; } else { const M = spots(), all = DISC.filter(r => M[r.id] && (r.pri || 1) === 1); const r = seedPick(all, 1); if (r) { n4 = r.id; again = true; } }
    let o5 = null; const c = ctxC(n4 ? [n4] : []), sp = d <= 1 ? [] : ONLY.filter(o => !o.wx).map(o => [o, o.when(c)]).filter(q => q[1]);
    const ch = sp.length ? sp[(d * 3) % sp.length] : ONLY.filter(o => o.wx).map(o => [o, o.when(c)]).find(q => q[1]);
    if (ch) { const [o, w] = ch, r = w.row ? DISC_BY[w.row] : null, s = r ? spots()[r.id] : null; o5 = { id: o.id, row: w.row || null, at: w.at || (s ? s.at : null), why: w.why, b: 0 }; o5.b = r ? vOf(r) : o.v ? (+o.v(S()) || 0) : 0; }
    const s4 = n4 ? spots()[n4] : null; d9.p = { d, n4, again, b4: n4 ? vOf(DISC_BY[n4]) : 0, at4: s4 ? s4.at : null, o5 }; mark(); return d9.p; }
  const why4 = (r, s, me) => { const h = r.hrs, dd = Math.hypot(s.at[0] - me.x, s.at[1] - me.z); if (h) return T2('아직 안 해 봤어요. ' + h[0] + '시부터 ' + h[1] + '시까지 열어요', 'You haven’t tried it yet. Open ' + h[0] + ':00–' + h[1] + ':00'); return dd < 350 ? T2('가까운데 아직 안 해 봤어요', 'It’s close by and you haven’t tried it yet') : T2('아직 안 가 본 곳이에요', 'Somewhere you haven’t been yet'); };
  // 할 일 칸(GAME.tasks ctx)에 ④⑤를 얹음 — c = [칸, 갈래, 그림, 글] + at · why · t · tp · ev
  function ctx(C) { if (!A.on()) return; const P9 = pick(), me = A.me(), M = spots();
    if (P9.n4 && M[P9.n4]) { const r = DISC_BY[P9.n4], s = M[P9.n4], a = [A.cellOf(s.at[0], s.at[1]), 'disc', r.ic, '']; a.at = s.at; a.ev = 'disc:' + r.id; a.t = P9.again ? [L2(r.t, 0) + ' — 한 번 더', L2(r.t, 1) + ' — once more'] : r.t; a.t = [r.ic + ' ' + a.t[0], r.ic + ' ' + a.t[1]]; a.tp = [r.ic + ' ' + r.tp[0], r.ic + ' ' + r.tp[1]]; a.why = P9.again ? ['가 본 곳이지만 오늘 또 해 볼 만해요', 'You’ve been — but it’s worth another go'] : why4(r, s, me); a.disc = r.id; a.isle = s.isle; a.nm = s.nm; C.new = a; }
    const o = P9.o5; if (o && o.at) { const O9 = ONLY.find(q => q.id === o.id), r = o.row ? DISC_BY[o.row] : null, a = [A.cellOf(o.at[0], o.at[1]), 'only', (O9 && O9.ic) || '⏰', '']; a.at = o.at; a.ev = 'only:' + o.id; const tt = O9 && O9.t ? O9.t : r ? r.t : T2('오늘만 있는 일', 'Today only'), tp = O9 && O9.tp ? O9.tp : r ? r.tp : tt; a.t = [a[2] + ' ' + tt[0], a[2] + ' ' + tt[1]]; a.tp = [a[2] + ' ' + tp[0], a[2] + ' ' + tp[1]]; a.why = o.why; a.disc = o.row || o.id; a.isle = !!(r && M[r.id] && M[r.id].isle); a.nm = r && M[r.id] ? M[r.id].nm : ''; C.only = a; } }
  const L2 = (t, i) => (t ? t[i] : '');
  // ───────── 소문(아침 칠판·이웃 말풍선) — ④와 다른 안 해 본 것 하나 ─────────
  function rumorRow(k) { const P9 = pick(), d = day(), rl = D().rl || {}, skip = [P9.n4, P9.o5 && P9.o5.row].filter(Boolean), U0 = untried(skip).filter(r => r.rum || r.id === 'surp'), U1 = U0.filter(r => !(rl[r.id] >= d - 2) || rl[r.id] === d), U = U1.length ? U1 : U0; if (!U.length) return null; return U[(d + k) % Math.min(U.length, 4)]; }   /* 사흘 안에 소문 낸 것은 건너뜀(같은 소문 되풀이 X) */
  function rumorOf(r) { if (r.id === 'surp') { const q = A.surpLine && A.surpLine(); return q && q.at ? { ko: q.ko, en: q.en, at: q.at } : null; } const s = spots()[r.id]; return s ? { ko: r.rum[0], en: r.rum[1], at: s.at } : null; }
  function rumor() { if (!A.on()) return null; const r = rumorRow(0); if (!r) return null; const q = rumorOf(r); if (!q) return null; const card = r.card ? [r.ic + ' ' + r.card[0], r.ic + ' ' + r.card[1]] : null; const d9 = D(), rl = d9.rl || (d9.rl = {}); rl[r.id] = day(); for (const k of Object.keys(rl)) if (rl[k] < day() - 3) delete rl[k]; mark(); return { id: r.id, ko: q.ko, en: q.en, at: q.at, card }; }
  function heard(id, t, at) { const d9 = D(), h = d9.h.filter(q => q && q.id !== id); h.push({ d: day(), id, t, at: at ? [+(+at[0]).toFixed(1), +(+at[1]).toFixed(1)] : null }); d9.h = h.slice(-8); mark(); }
  // ───────── 아침 엽서 ─────────
  let PC = null, PCT = 0, woke = 0, t0 = performance.now(), lastPs = 0, V9 = null, css = null;
  const CSS = `.twn-pc{position:fixed;right:12px;top:min(330px,calc(100vh - 300px));z-index:31;width:min(286px,72vw);box-sizing:border-box;background:#fffaf0;color:#2b2420;border:3px solid #2b2420;border-radius:12px;box-shadow:0 4px 0 #2b2420;padding:8px 10px 10px;font:600 14px/1.45 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;cursor:pointer}
.twn-pc .pc-h{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:13px;color:#7a5a2a}.twn-pc .pc-x{border:0;background:none;font:800 18px/1 system-ui;color:#2b2420;cursor:pointer;min-width:36px;min-height:32px}
.twn-pc canvas{display:block;width:100%;height:auto;border-radius:6px;margin:4px 0 6px}.twn-pc b{display:block;font-size:16px}.twn-pc .pc-go{margin-top:6px;min-height:40px;width:100%;border:3px solid #2b2420;border-radius:10px;background:#ffd23f;color:#2b2420;font:800 15px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;box-shadow:0 3px 0 #2b2420;cursor:pointer}.twn-pc .pc-go:active{transform:translateY(2px)}
body.small .twn-pc{top:auto;bottom:150px;width:min(250px,64vw);padding:6px 8px 8px;font-size:13px}body.small .twn-pc canvas{display:none}`;
  function goRow(id, at, nm) { const r = DISC_BY[id], s = spots()[id]; const p = { icon: r ? r.ic : '🧭', name: (s && s.nm) || nm || L(r && r.t) || '', en: (s && s.en) || nm || '', door: (s && s.at) || at, isle: !!(s && s.isle), arrive: '🎉 ' + (en() ? 'You’re here — ' : '다 왔어요 — ') + L(r ? r.t : null) }; if (!p.door) return null; return A.route(p); }
  function pcOff() { if (PC) { PC.remove(); PC = null; } }
  function postcard(force) { const d9 = D(), d = day(); if (!force && d9.pc === d) return false; const P9 = pick(); const id = P9.n4 && !P9.again ? P9.n4 : null; if (!id || tried(id)) { d9.pc = d; mark(); return false; } const r = DISC_BY[id], s = spots()[id]; if (!r || !s || !r.card) { d9.pc = d; mark(); return false; }
    if (!css && !document.getElementById('disc-css')) { css = document.createElement('style'); css.id = 'disc-css'; css.textContent = CSS; document.head.appendChild(css); }
    pcOff(); d9.pc = d; d9.pcId = id; mark(); const e = en(), me = A.me(), el = document.createElement('div'); el.className = 'twn-pc ttl-keep'; el.dataset.id = id;
    el.innerHTML = '<div class="pc-h"><span>📮 ' + (e ? 'A postcard came' : '엽서가 왔어요') + '</span><button class="pc-x" data-a="x" aria-label="' + (e ? 'Close' : '닫기') + '">✕</button></div><canvas width="264" height="120"></canvas><b>' + A.esc(e ? s.en : s.nm) + '</b><div>' + A.esc(L(r.card).replace(/^[^—]*—\s*/, '')) + '</div><button class="pc-go" data-a="go">🧭 ' + (e ? 'Show the way' : '길 안내') + '</button>';
    document.body.appendChild(el); PC = el; PCT = performance.now();
    try { { const gx = Math.max(s.at[0], me.x) + Math.max(70, Math.abs(s.at[0] - me.x) * 0.8), gz = Math.min(s.at[1], me.z) - Math.max(50, Math.abs(s.at[1] - me.z) * 0.9); A.mapSnip(el.querySelector('canvas'), [{ x: s.at[0], z: s.at[1], label: e ? s.en : s.nm }, { x: me.x, z: me.z, label: e ? 'Me' : '나', main: true }, { x: gx, z: gz, ghost: true }]); }   /* ghost = 북동쪽으로 넓혀 방위표 밑에 점이 숨지 않게(QUEST-2 꼴) */ } catch (e9) { /* 지도 조각 없음 */ }
    el.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.target.closest && ev.target.closest('[data-a]'); if (b && b.dataset.a === 'x') { pcOff(); return; } pcOff(); const R9 = goRow(id); if (R9 && R9.ok === false) return; });
    heard(id, r.rum || r.card, s.at); return true; }
  // ───────── 끝 창 꼬리 ─────────
  function tailOf(r) { const M = spots(); for (const id of r.next || []) if (M[id] && !tried(id)) return DISC_BY[id]; return null; }
  function tail(r) { const d9 = D(), d = day(); if (d9.tl[r.id] === d) return; const t = tailOf(r); if (!t || !r.nx) return; d9.tl[r.id] = d; mark(); const s = spots()[t.id], line = (en() ? 'Next time: ' : '다음엔 ') + L(r.nx); heard(t.id, [ '다음엔 ' + r.nx[0], 'Next time: ' + r.nx[1] ], s ? s.at : null);
    const bx = A.panel() && A.panel().querySelector('.bx'); if (bx && !bx.querySelector('.disc-tail')) { const el = document.createElement('div'); el.className = 'sm disc-tail'; el.style.cssText = 'margin-top:8px;padding-top:6px;border-top:2px dashed #c9b27a;color:#7a5a2a;font-weight:700'; el.textContent = '👂 ' + line; bx.appendChild(el); try { el.scrollIntoView({ block: 'nearest' }); } catch (e9) { /* 옛 브라우저 */ } }
    else A.say('👂 ' + line, 4.5); }
  // ───────── 1초 칸 ─────────
  function sec(me) { if (!A.on()) return; const s9 = S(), d = day(), d9 = D();
    if (!V9) { V9 = {}; for (const r of DISC) V9[r.id] = vOf(r, s9); }
    else for (const r of DISC) { const v = vOf(r, s9); if (v > V9[r.id]) { const first = V9[r.id] === 0; V9[r.id] = v; if (first && spots()[r.id]) tail(r); } else if (v < V9[r.id]) V9[r.id] = v; }
    const T = s9.tasks; if (T && T.day === d && Array.isArray(T.list)) { const P9 = d9.p && d9.p.d === d ? d9.p : null; for (const t of T.list) { if (t.done || !P9) continue;
      if (t.id === 'new' && P9.n4 && vOf(DISC_BY[P9.n4], s9) > P9.b4) A.tev(t.ev);
      else if (t.id === 'only' && P9.o5) { const o = P9.o5; let ok = false; if (o.row) ok = vOf(DISC_BY[o.row], s9) > o.b; else { const O9 = ONLY.find(q => q.id === o.id); if (O9 && O9.v) { try { ok = (+O9.v(s9) || 0) > o.b; } catch (e) { ok = false; } } else if (o.at && me) ok = Math.hypot(o.at[0] - me.x, o.at[1] - me.z) < 10; } if (ok) A.tev(t.ev); } } }
    { const N = s9.news; if (N && N.d === d && Array.isArray(N.rum)) for (const q of N.rum) if (q && /^disc:/.test(q.k) && q.said === d && !q.dh) { q.dh = 1; const id = q.k.slice(5), r = DISC_BY[id]; heard(id, r && r.rum ? r.rum : [q.t, q.t], q.at); } }
    if (PC && performance.now() - PCT > 22000) pcOff();
    if (PC && A.busy()) pcOff();
    const now = performance.now();
    if (woke && d9.pc !== d && d >= 2 && !PC && !A.busy() && now - woke > 6000 && !document.querySelector('.twn-dlg')) { woke = 0; postcard(false); }
    if (d9.ps[0] !== d) d9.ps = [d, 0];
    if (d9.ps[1] < 2 && now - t0 > 40000 && now - lastPs > 75000 && !A.busy() && !A.bubbleBusy() && me) { const r = rumorRow(1 + d9.ps[1]); const q = r ? rumorOf(r) : null; if (q) { const g9 = A.ped(me.x, me.z, 9); if (g9) { g9.gest = 3.4; A.bubble({ x: g9.x, y: me.y, z: g9.z, sc: g9.sc || 1 }, en() ? q.en : q.ko); lastPs = now; d9.ps = [d, d9.ps[1] + 1]; heard(r.id, [q.ko, q.en], q.at); } } } }
  // ───────── 수첩 '들은 이야기' ─────────
  function heardList() { const M = spots(); return D().h.slice().reverse().map(q => ({ ...q, ok: !!(q.id && M[q.id]), done: q.id && DISC_BY[q.id] ? tried(q.id) : false })); }
  function dispose() { pcOff(); if (css) css.remove(); css = null; }
  return { ctx, sec, rumor, woke: () => { woke = performance.now(); }, heardList, goRow, dispose, postcard, spots, pick, untried: () => untried().map(r => r.id), tried, get pc() { return PC ? PC.dataset.id : null; }, rows: () => { const M = spots(); return DISC.filter(r => M[r.id]).map(r => ({ id: r.id, v: vOf(r), at: M[r.id].at, nm: M[r.id].nm, pri: r.pri || 1 })); } };
}
