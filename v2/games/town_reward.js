// 🎁 레벨 보상(REWARD-1 · 사용자 10-26 저녁 "보상이 뭔 자전거밖에 없네") — 표·쓰임 정본 docs/systems/town_rewards.md
//   예전: 짝수 레벨 = 자전거 색 · 홀수 = 자전거 깃발뿐(LVCHIP-1) · PERKS는 눈에 안 보이는 수치 → 솜씨 여섯 × 레벨 2~10 = 쉰넷, 받으면 바로 써 볼 수 있고 눈에 보이는 것
//   갈래: 🧰 도구·장비(실제 효과 코드) · 🔓 자리(내 좌판) · 📜 요리법·씨앗·마당 물건 · 👕 모자·목수건·가방 색 · 🚲 자전거 색·깃발(여럿 가운데 하나) · 🏷 이웃이 부르는 이름(이웃 말이 달라짐) · 🏅 10레벨 배지
//   5레벨 = 고르기(둘 가운데 하나 · 고르지 않은 것은 10레벨에 같이 옴) · 칩(🎁)을 눌렀을 때만 창(LVCHIP-1 그대로) · 이미 지난 레벨도 빠진 보상이 칩 하나에 쌓여 하나씩
//   저장 = GAME.S.rwd { got:{'갈래:레벨':날}, pick:{'갈래:5':0|1}, hat, scarf, bag, nick, st(좌판), nk(이웃 말 하루 셈) } · 받을 거리는 저장하지 않고 솜씨 레벨에서 셈(옛 저장도 저절로)
//   한도: 물건·능력이라 rwCheck 밖('mv:rwd' · 평생 한 번) · 좌판 판 돈 = 장터 팔기와 같은 'mv:sell'
//   지키는 선: 판타지·전투 X · 실명 X(이웃 = 일 이름) · 숫자·% 칸 X · 빈 칭찬 X · 새 Light X(이마 전등 = MeshBasic 빛 원뿔) · 매 프레임 일 0(0.25초·1초 칸) · 홍보판(SM_PROMO) X
export const REWARD_V = 1;
const T2 = (ko, en) => [ko, en];
const I = (id, ic, kind, t, use, o) => Object.assign({ id, ic, kind, t, use }, o || {});
// 보상 표 — kind: gear(실제 효과) · place · recipe(e = 요리) · seed · deco(e = 마당 물건) · hat · scarf · bag · bike · flag · nick · badge
//   go = 써 보러 가기: 'hold:도구' · 'spot:곳' · 'ride' · 'bag' · 'wear' · 'night'
export const RWT = {
  work: {
    2: I('gloves', '🧤', 'gear', T2('목장갑', 'Work gloves'), T2('밧줄·쇠사슬 바위를 더 빨리 오르고 손이 덜 지쳐요', 'Climb rope and chain rocks faster, and your hands tire less'), { go: 'spot:climb' }),
    3: I('h:straw', '👒', 'hat', T2('밀짚모자', 'Straw hat'), T2('햇볕을 가려 주는 일꾼 모자예요', 'A worker’s hat that keeps the sun off'), { go: 'wear' }),
    4: I('n:work', '🏷', 'nick', T2('이웃이 부르는 이름 「든든한 일손」', 'Neighbours call you “Reliable Hands”'), T2('일꾼 이웃 곁에 가면 알아보고 말을 걸어요', 'Worker neighbours recognise you and say something when you come close'), { go: 'spot:worker' }),
    5: { pick: [I('b:work', '🚲', 'bike', T2('자전거 밀짚색', 'Straw bike'), T2('자전거 뼈대를 밀짚색으로 칠해요', 'Paint your bike frame straw yellow'), { go: 'ride' }), I('g:work', '🎒', 'bag', T2('가방 밀짚색', 'Straw backpack'), T2('메고 다니는 가방이 밀짚색이 돼요', 'Your backpack turns straw yellow'), { go: 'wear' })] },
    6: I('broom2', '🧹', 'gear', T2('넓은 빗자루', 'Wide broom'), T2('한 번 쓸 때 곁(3m)에 있는 낙엽·눈·쓰레기까지 같이 쓸려요', 'One sweep also clears leaves, snow or litter within 3 m'), { go: 'hold:broom' }),
    7: I('f:work', '🚩', 'flag', T2('자전거 깃발 🌾', 'Bike flag 🌾'), T2('자전거 뒤에 일솜씨 깃발을 달아요', 'A helping-hands flag on the back of your bike'), { go: 'ride' }),
    8: I('d:🌻', '🌻', 'deco', T2('해바라기 화분', 'Sunflower pot'), T2('가방에 넣었어요. 우리 집 마당 자리에 놓아 보세요', 'It is in your bag. Put it in your yard'), { e: '🌻', go: 'spot:home' }),
    9: I('s:work', '🧣', 'scarf', T2('목수건 밀짚색', 'Straw neckerchief'), T2('땀을 닦는 일꾼 목수건이에요', 'A worker’s neckerchief for wiping sweat'), { go: 'wear' }),
    10: I('badge:work', '🏅', 'badge', T2('🌾 마을 일손 배지', '🌾 Town helper badge'), T2('일솜씨 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in helping. You also get what you did not pick at level 5'), { go: 'wear' }),
  },
  cook: {
    2: I('r:🍛', '🍛', 'recipe', T2('카레라이스 요리법', 'Curry rice recipe'), T2('쌀·감자·당근으로 만들어요. 부엌 있는 집에서 해 봐요', 'Made with rice, potato and carrot. Try it in a house with a kitchen'), { e: '🍛', go: 'spot:cook' }),
    3: I('lunch', '🍱', 'gear', T2('도시락통', 'Lunch box'), T2('먹은 음식의 힘(숨 한 칸·빨리 돌아옴)이 1.5배 오래가요', 'The energy from food (extra breath, faster recovery) lasts 1.5 times longer'), { go: 'bag' }),
    4: I('h:chef', '🍳', 'hat', T2('요리사 모자', 'Chef’s hat'), T2('머리카락이 음식에 안 들어가게 써요', 'Keeps hair out of the food'), { go: 'wear' }),
    5: { pick: [I('b:cook', '🚲', 'bike', T2('자전거 토마토색', 'Tomato bike'), T2('자전거 뼈대를 토마토색으로 칠해요', 'Paint your bike frame tomato red'), { go: 'ride' }), I('g:cook', '🎒', 'bag', T2('가방 토마토색', 'Tomato backpack'), T2('메고 다니는 가방이 토마토색이 돼요', 'Your backpack turns tomato red'), { go: 'wear' })] },
    6: I('r:🥟', '🥟', 'recipe', T2('만두 요리법', 'Dumpling recipe'), T2('밀가루 반죽에 배추·버섯 소를 넣어 빚어요', 'Wrap cabbage and mushroom filling in flour dough'), { e: '🥟', go: 'spot:cook' }),
    7: I('n:cook', '🏷', 'nick', T2('이웃이 부르는 이름 「동네 요리사」', 'Neighbours call you “Neighbourhood Cook”'), T2('부엌·바다 이웃이 알아보고 말을 걸어요', 'Kitchen and seaside neighbours recognise you and say something'), { go: 'spot:worker' }),
    8: I('d:🏺', '🏺', 'deco', T2('장독', 'Sauce jar'), T2('가방에 넣었어요. 우리 집 마당 자리에 놓아 보세요', 'It is in your bag. Put it in your yard'), { e: '🏺', go: 'spot:home' }),
    9: I('r:🥧', '🥧', 'recipe', T2('고구마 파이 요리법', 'Sweet potato pie recipe'), T2('고구마·밀가루·버터로 구워요', 'Bake it with sweet potato, flour and butter'), { e: '🥧', go: 'spot:cook' }),
    10: I('badge:cook', '🏅', 'badge', T2('🍳 꼬마 요리사 배지', '🍳 Little chef badge'), T2('요리 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in cooking. You also get what you did not pick at level 5'), { go: 'wear' }),
  },
  farm: {
    2: I('boots', '🥾', 'gear', T2('장화', 'Rain boots'), T2('갯벌·논에서 발이 빠지지 않아 걸음이 느려지지 않아요', 'Your feet don’t sink in mudflats and paddies, so you don’t slow down'), { go: 'spot:mud' }),
    3: I('tank', '💧', 'gear', T2('큰 물통', 'Big water tank'), T2('물뿌리개에 물이 두 배 들어가요', 'Your watering can holds twice as much water'), { go: 'hold:can' }),
    4: I('h:flower', '🌼', 'hat', T2('꽃 모자', 'Flower hat'), T2('텃밭 꽃을 단 챙 모자예요', 'A brimmed hat with garden flowers'), { go: 'wear' }),
    5: { pick: [I('berry', '🍓', 'seed', T2('딸기 모종', 'Strawberry plants'), T2('학교 텃밭·화분에 딸기를 심을 수 있어요(어느 계절이든)', 'Plant strawberries in the school garden or pots, any season'), { go: 'spot:farm' }), I('allseed', '📦', 'seed', T2('사철 씨앗 상자', 'All-season seed box'), T2('비닐 덮개와 함께라 다른 계절 씨앗도 심어요(겨울에도)', 'Comes with a plastic cover, so you can plant other seasons’ seeds, even in winter'), { go: 'spot:farm' })] },
    6: I('n:farm', '🏷', 'nick', T2('이웃이 부르는 이름 「텃밭 지기」', 'Neighbours call you “Garden Keeper”'), T2('밭·과수원 이웃이 알아보고 말을 걸어요', 'Field and orchard neighbours recognise you and say something'), { go: 'spot:worker' }),
    7: I('b:farm', '🚲', 'bike', T2('자전거 새싹색', 'Sprout bike'), T2('자전거 뼈대를 새싹색으로 칠해요', 'Paint your bike frame sprout green'), { go: 'ride' }),
    8: I('g:farm', '🎒', 'bag', T2('가방 새싹색', 'Sprout backpack'), T2('메고 다니는 가방이 새싹색이 돼요', 'Your backpack turns sprout green'), { go: 'wear' }),
    9: I('f:farm', '🚩', 'flag', T2('자전거 깃발 🌱', 'Bike flag 🌱'), T2('자전거 뒤에 농사 깃발을 달아요', 'A gardening flag on the back of your bike'), { go: 'ride' }),
    10: I('badge:farm', '🏅', 'badge', T2('🌱 텃밭 지기 배지', '🌱 Garden keeper badge'), T2('농사 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in gardening. You also get what you did not pick at level 5'), { go: 'spot:farm' }),
  },
  look: {
    2: I('scope', '🔭', 'gear', T2('망원경', 'Spyglass'), T2('도구 띠 6번. 들고 F(또는 🧰 쓰기)를 누르면 멀리 당겨 보고, 가운데 보이는 곳 이름과 거리를 알려 줘요', 'Tool 6. Hold it and press F (or 🧰 Use) to zoom far — it tells you the name and distance of the place in the middle'), { go: 'hold:scope' }),
    3: I('d:🎐', '🎐', 'deco', T2('풍경', 'Wind chime'), T2('가방에 넣었어요. 마당에 달면 바람이 부는 걸 소리로 알 수 있어요', 'It is in your bag. Hang it in your yard and you can hear the wind'), { e: '🎐', go: 'spot:home' }),
    4: I('h:safari', '🧢', 'hat', T2('탐사 모자', 'Field hat'), T2('풀숲·물가를 살필 때 쓰는 챙 모자예요', 'A brimmed hat for watching grass and water'), { go: 'wear' }),
    5: { pick: [I('rod2', '🎣', 'gear', T2('튼튼한 낚싯대', 'Strong fishing rod'), T2('더 멀리(14m) 던지고, 찌가 들어간 뒤 기다려 주는 때가 길어요', 'Cast farther (14 m), and you get longer to react after the float dips'), { go: 'hold:rod' }), I('b:look', '🚲', 'bike', T2('자전거 보라색', 'Violet bike'), T2('자전거 뼈대를 보라색으로 칠해요', 'Paint your bike frame violet'), { go: 'ride' })] },
    6: I('n:look', '🏷', 'nick', T2('이웃이 부르는 이름 「자연 탐정」', 'Neighbours call you “Nature Detective”'), T2('숲·바다 이웃이 알아보고 말을 걸어요', 'Forest and seaside neighbours recognise you and say something'), { go: 'spot:worker' }),
    7: I('g:look', '🎒', 'bag', T2('가방 보라색', 'Violet backpack'), T2('메고 다니는 가방이 보라색이 돼요', 'Your backpack turns violet'), { go: 'wear' }),
    8: I('f:look', '🚩', 'flag', T2('자전거 깃발 🔍', 'Bike flag 🔍'), T2('자전거 뒤에 관찰 깃발을 달아요', 'A nature-watching flag on the back of your bike'), { go: 'ride' }),
    9: I('s:look', '🧣', 'scarf', T2('목수건 보라색', 'Violet neckerchief'), T2('목에 두르는 수건이에요. 땀도 닦고 햇볕도 가려요', 'A neckerchief that wipes sweat and keeps the sun off'), { go: 'wear' }),
    10: I('badge:look', '🏅', 'badge', T2('🔍 꼬마 박사 배지', '🔍 Little scientist badge'), T2('관찰 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in nature watching. You also get what you did not pick at level 5'), { go: 'wear' }),
  },
  trade: {
    2: I('book', '📒', 'gear', T2('장터 수첩', 'Market notebook'), T2('장터 창에서 물건마다 어느 장터가 더 쳐주는지(방위) 보여요', 'In the market window, each item shows which market pays more, and which way it is'), { go: 'spot:market' }),
    3: I('stall', '🧺', 'place', T2('내 좌판 자리', 'My market mat'), T2('장터에 물건 셋을 두고 가면 밤사이 팔려 다음 아침에 돈이 들어와요', 'Leave three things on your mat at a market; they sell overnight and the money comes in the next morning'), { go: 'spot:market' }),
    4: I('h:flat', '🧢', 'hat', T2('장사꾼 납작 모자', 'Trader’s flat cap'), T2('장터 상인들이 즐겨 쓰는 모자예요', 'A cap market traders like'), { go: 'wear' }),
    5: { pick: [I('b:trade', '🚲', 'bike', T2('자전거 귤색', 'Tangerine bike'), T2('자전거 뼈대를 귤색으로 칠해요', 'Paint your bike frame tangerine'), { go: 'ride' }), I('g:trade', '🎒', 'bag', T2('가방 귤색', 'Tangerine backpack'), T2('메고 다니는 가방이 귤색이 돼요', 'Your backpack turns tangerine'), { go: 'wear' })] },
    6: I('n:trade', '🏷', 'nick', T2('이웃이 부르는 이름 「장터 단골」', 'Neighbours call you “Market Regular”'), T2('장터 상인이 알아보고 말을 걸어요', 'Market traders recognise you and say something'), { go: 'spot:market' }),
    7: I('stall2', '🧺', 'place', T2('좌판 두 칸 더', 'Two more mat spaces'), T2('좌판에 다섯까지 둘 수 있어요', 'You can leave up to five things on your mat'), { go: 'spot:market' }),
    8: I('f:trade', '🚩', 'flag', T2('자전거 깃발 🛒', 'Bike flag 🛒'), T2('자전거 뒤에 살림 깃발을 달아요', 'A market flag on the back of your bike'), { go: 'ride' }),
    9: I('s:trade', '🧣', 'scarf', T2('목수건 귤색', 'Tangerine neckerchief'), T2('목에 두르는 수건이에요. 땀도 닦고 햇볕도 가려요', 'A neckerchief that wipes sweat and keeps the sun off'), { go: 'wear' }),
    10: I('badge:trade', '🏅', 'badge', T2('🛒 살림 고수 배지', '🛒 Market master badge'), T2('살림 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in market sense. You also get what you did not pick at level 5'), { go: 'wear' }),
  },
  explore: {
    2: I('hike', '🥾', 'gear', T2('등산화', 'Hiking boots'), T2('오르막을 달릴 때 숨이 반만 닳아요', 'Running uphill uses only half as much breath'), { go: 'spot:summit' }),
    3: I('lamp', '🔦', 'gear', T2('이마 전등', 'Head lamp'), T2('밤(19시 뒤)에 밖에 나가면 저절로 켜져 앞길을 비춰요', 'At night (after 19:00) outdoors it turns on by itself and lights the way ahead'), { go: 'night' }),
    4: I('h:beanie', '🧶', 'hat', T2('등산 털모자', 'Hiking beanie'), T2('산바람에 귀가 시리지 않아요', 'Keeps your ears warm in the mountain wind'), { go: 'wear' }),
    5: { pick: [I('b:explore', '🚲', 'bike', T2('자전거 청록색', 'Teal bike'), T2('자전거 뼈대를 청록색으로 칠해요', 'Paint your bike frame teal'), { go: 'ride' }), I('g:explore', '🎒', 'bag', T2('가방 청록색', 'Teal backpack'), T2('메고 다니는 가방이 청록색이 돼요', 'Your backpack turns teal'), { go: 'wear' })] },
    6: I('n:explore', '🏷', 'nick', T2('이웃이 부르는 이름 「동네 길잡이」', 'Neighbours call you “Local Guide”'), T2('징검다리·바다·산 이웃이 알아보고 말을 걸어요', 'Neighbours by the stones, sea and hills recognise you and say something'), { go: 'spot:worker' }),
    7: I('flask', '🥤', 'gear', T2('수통', 'Water flask'), T2('숨이 찼다가 돌아오는 빠르기가 1.5배예요', 'Your breath comes back 1.5 times faster'), { go: 'spot:summit' }),
    8: I('f:explore', '🚩', 'flag', T2('자전거 깃발 🧭', 'Bike flag 🧭'), T2('자전거 뒤에 탐험 깃발을 달아요', 'An exploring flag on the back of your bike'), { go: 'ride' }),
    9: I('s:explore', '🧣', 'scarf', T2('목수건 청록색', 'Teal neckerchief'), T2('목에 두르는 수건이에요. 땀도 닦고 햇볕도 가려요', 'A neckerchief that wipes sweat and keeps the sun off'), { go: 'wear' }),
    10: I('badge:explore', '🏅', 'badge', T2('🧭 마을 길잡이 배지', '🧭 Town guide badge'), T2('탐험 끝까지 왔어요. 5레벨에 고르지 않은 것도 같이 받아요', 'You reached the top in exploring. You also get what you did not pick at level 5'), { go: 'wear' }),
  },
};
export const RW_PICK = 5, RW_MAX = 10;
// 이웃 말(🏷 부르는 이름 · 일 이름 이웃만 · 하루에 이웃마다 한 번 · 모두 셋까지) — 일 갈래 → 솜씨
const NKK = { stall: 'trade', cook: 'cook', fisher: 'cook', clam: 'look', seaweed: 'look', oyster: 'look', shiitake: 'look', lumber: 'work', beehive: 'work', pasture: 'work', saltpan: 'work', cabbage: 'farm', potato: 'farm', strawberry: 'farm', pear: 'farm', paddy: 'farm', stones: 'explore' };
const NKS = { work: ['work'], cook: ['cook'], farm: ['farm'], look: ['look'], trade: ['trade'], explore: ['explore', 'look'] };
const NKL = {
  work: [T2('든든한 일손이 왔네요! 마침 손이 모자랐어요.', 'Reliable Hands is here! We were short of help.'), T2('오늘도 거들러 왔구나. 장갑은 챙겼어요?', 'Here to help again? Got your gloves?')],
  cook: [T2('동네 요리사 왔네요. 오늘은 무슨 냄새가 나려나?', 'The neighbourhood cook! What will smell good today?'), T2('요리하는 친구구나. 갓 잡은 것으로 하면 더 맛있어요.', 'You’re the one who cooks. Fresh catch tastes even better.')],
  farm: [T2('텃밭 지기 왔구나. 요즘 학교 텃밭은 잘 자라요?', 'The garden keeper! Is the school garden growing well?'), T2('흙 만지는 손이네요. 물은 아침에 주면 좋아요.', 'Those are gardening hands. Watering in the morning is best.')],
  look: [T2('자연 탐정이네요. 저쪽 풀숲에 뭔가 움직였어요.', 'The nature detective! Something moved in the grass over there.'), T2('오늘은 무엇을 찾았어요? 저도 궁금해요.', 'What did you find today? I’m curious too.')],
  trade: [T2('장터 단골 왔네요! 오늘 물건 보고 가요.', 'Our market regular! Have a look at today’s goods.'), T2('값을 잘 견주는 친구구나. 오늘은 우리 장터가 괜찮아요.', 'You compare prices well. Our market is good today.')],
  explore: [T2('동네 길잡이 왔네요. 저 산 너머 길도 가 봤어요?', 'The local guide! Been over that hill yet?'), T2('길 잘 아는 친구구나. 바다 쪽 길은 물때를 봐야 해요.', 'You know the roads. For the sea path, check the tide.')],
};
// 모자·목수건 모양(머리 축 기준 m · 얼굴 = +z) — 기본 모자 돔(높이 0.30~0.55 · 반지름 0.28)을 덮는 크기 · 기본 모자 칸은 모자 색으로 칠함(챙 밑이 비치지 않게)
const STRAW = 0xe8c872, KHAKI = 0xb9a46a, WHITE = 0xf6f4ee;
const HATS = {
  straw: { cap: STRAW, p: [['cyl', [0, 0.455, 0], [0.29, 0.21, 0.29], STRAW], ['cyl', [0, 0.385, 0], [0.297, 0.05, 0.297], 0xb5523a], ['cyl', [0, 0.362, 0], [0.52, 0.022, 0.52], STRAW]] },
  chef: { cap: WHITE, p: [['cyl', [0, 0.43, 0], [0.29, 0.17, 0.29], WHITE], ['sph', [0, 0.58, 0], [0.34, 0.17, 0.34], 0xffffff], ['cyl', [0, 0.36, 0], [0.296, 0.03, 0.296], 0xe2ded2]] },
  flower: { cap: 0xf0d890, p: [['dome', [0, 0.34, 0], [0.3, 0.25, 0.3], 0xf0d890], ['cyl', [0, 0.362, 0], [0.46, 0.02, 0.46], 0xf0d890], ['cyl', [0, 0.385, 0], [0.303, 0.04, 0.303], 0x6fb34f],
    ...[[-0.5, 0xef84aa], [0, 0xf2c84b], [0.5, 0xf4f1e8]].map(([a, c]) => ['sph', [Math.sin(a) * 0.305, 0.4, Math.cos(a) * 0.305], [0.055, 0.055, 0.04], c])] },
  safari: { cap: KHAKI, p: [['cyl', [0, 0.44, 0], [0.29, 0.19, 0.29], KHAKI], ['dome', [0, 0.535, 0], [0.29, 0.06, 0.29], KHAKI], ['cyl', [0, 0.38, 0], [0.296, 0.045, 0.296], 0x5a4a2e], ['cyl', [0, 0.362, 0], [0.44, 0.02, 0.44], 0xa8955c]] },
  flat: { cap: 0x8a6a4a, p: [['sph', [0, 0.44, -0.01], [0.31, 0.15, 0.32], 0x8a6a4a], ['cyl', [0, 0.37, 0.25], [0.19, 0.022, 0.13], 0x6e523a, [0.15, 0, 0]], ['sph', [0, 0.585, -0.01], [0.035, 0.02, 0.035], 0x6e523a]] },
  beanie: { cap: 0x23a39a, p: [['dome', [0, 0.30, -0.005], [0.295, 0.272, 0.29], 0x23a39a, [-0.12, 0, 0]], ['cyl', [0, 0.33, 0], [0.302, 0.07, 0.302], 0x1e8a82], ['sph', [0, 0.6, -0.04], [0.075, 0.075, 0.075], 0xf4f1e8]] },
};
const HAT_OF = { work: 'straw', cook: 'chef', farm: 'flower', look: 'safari', trade: 'flat', explore: 'beanie' };

export function createReward(A) {
  const { map, T3, GAME } = A, en = () => A.lang() === 'en', L = a => (Array.isArray(a) ? a[en() ? 1 : 0] : a || ''), esc = t => A.esc(t);
  const S = () => { const s = GAME.S; let r = s.rwd; if (!r || typeof r !== 'object' || r.v !== 1) r = s.rwd = { v: 1, got: {}, pick: {}, hat: '', scarf: '', bag: '', nick: '', st: null, nk: null }; if (!r.got || typeof r.got !== 'object') r.got = {}; if (!r.pick || typeof r.pick !== 'object') r.pick = {}; return r; };
  const mark = () => GAME.mark(), day = () => GAME.S.day | 0, SK = () => A.skills();
  let dead = false, OWN = null, q4 = 0, q1 = 0, MUDN = '', MUDT = -1, RIG = null, HAT = null, SCF = null, LAMP = null, BAGI = null, MAT = null, SC = { on: false, q: 0, el: null, first: false };
  const GEOS = [], MATS = [];
  // ── 받은 것 · 가진 것 ──
  const itemOf = (k, L9) => { const r = RWT[k] && RWT[k][L9]; if (!r) return null; if (r.pick) { const p = S().pick[k + ':' + L9]; return p == null ? null : r.pick[p | 0]; } return r; };
  const otherOf = k => { const r = RWT[k] && RWT[k][RW_PICK], p = S().pick[k + ':' + RW_PICK]; return r && r.pick && p != null ? r.pick[1 - (p | 0)] : null; };
  function own() { if (OWN) return OWN; OWN = new Set(); const G = S().got; for (const q in G) { const [k, l9] = q.split(':'), it = itemOf(k, +l9); if (it) OWN.add(it.id); if (+l9 === RW_MAX) { const o = otherOf(k); if (o) OWN.add(o.id); } } return OWN; }
  const has = id => !A.promo() && own().has(id);
  function pending() { const out = [], sk = SK(); for (let l9 = 2; l9 <= RW_MAX; l9++) for (const k of sk.order) if (sk.lv(k) >= l9 && RWT[k] && RWT[k][l9] && !S().got[k + ':' + l9]) out.push([k, l9]); return out; }
  // ── 칩(LVCHIP-1 그대로: 저절로 창 X · 누를 때만) ──
  function chip() { if (dead || !GAME || !GAME.S) return; const n9 = A.promo() ? 0 : pending().length; map.hud.chip('twn-lvr', n9 ? '🎁 ' + (en() ? 'Get reward' : '보상 받기') + (n9 > 1 ? ' ' + n9 : '') : null, { onClick: () => open() }); }
  // ── 받기 = 그 자리에서 바로 씀 ──
  function apply(it, k) { const r = S(), e = en();
    switch (it.kind) {
      case 'hat': case 'scarf': case 'bag': case 'bike': case 'flag': break;   /* WEAR-1: 받기만(가방 👕 칸) · 쓰기는 창의 「지금 쓰기」나 가방에서 */
      case 'nick': if (!r.nick) r.nick = it.id.slice(2); break;
      case 'recipe': { const U = GAME.S.unlock || (GAME.S.unlock = {}); U['r:' + it.e] = 1; break; }
      case 'deco': A.add(it.e, 1, 'mv:rwd'); break;   /* 평생 한 번 받는 물건 = 한도 밖(rwCheck 'mv') */
      case 'gear': if (it.id === 'scope') A.toolOwn('scope'); if (it.id === 'rod2') A.toolOwn('rod'); if (it.id === 'broom2') A.toolOwn('broom'); if (it.id === 'tank') A.toolTank(); if (it.id === 'lamp') lampSync(); if (it.id === 'boots' && MUDN) A.walkRe(); break;
      default: break; }
    void k; void e; }
  function take(k, l9, pick) { const r = S(), key = k + ':' + l9; if (r.got[key]) return null; const R9 = RWT[k][l9]; if (R9.pick) r.pick[key] = pick ? 1 : 0; r.got[key] = day() || 1; OWN = null; const it = itemOf(k, l9); if (it) apply(it, k); if (l9 === RW_MAX) { const o = otherOf(k); if (o) apply(o, k); } mark(); if (A.sfx) A.sfx('done'); chip(); return it; }
  // ── 👕 옷·장비(WEAR-1 · 사용자 10-28 '보상들은 인벤토리에 없는 거야? 모자 받으면 무조건 쓰고?') — 쓰기/벗기 = 가방 👕 칸 한 곳 ──
  const WEARK = ['hat', 'scarf', 'bag', 'bike', 'flag'], WPF = { hat: 'h:', scarf: 's:', bag: 'g:', bike: 'b:', flag: 'f:' };
  const curOf = kd => { const r = S(); return kd === 'bike' ? A.bikeGet('c') : kd === 'flag' ? A.bikeGet('f') : r[kd] || ''; };
  function putOn(kd, v) { const r = S(); if (v && !own().has(WPF[kd] + v)) return;
    if (kd === 'bike') A.bikeSet('c', v); else if (kd === 'flag') A.bikeSet('f', v); else { r[kd] = v; if (kd === 'bag') bagPaint(); else wear(); } mark(); }
  const WN = { hat: [T2('쓰기', 'Wear'), T2('벗기', 'Take off'), T2('모자', 'Hats')], scarf: [T2('두르기', 'Wear'), T2('풀기', 'Take off'), T2('목수건', 'Neckerchiefs')], bag: [T2('메기', 'Use'), T2('원래 색', 'Original'), T2('가방 색', 'Backpack colours')], bike: [T2('칠하기', 'Paint'), T2('원래 색', 'Original'), T2('자전거 색', 'Bike colours')], flag: [T2('달기', 'Put on'), T2('떼기', 'Take off'), T2('자전거 깃발', 'Bike flags')] };
  function ownList() { const O = own(), list = []; for (const k of SK().order) for (let l9 = 2; l9 <= RW_MAX; l9++) { const R9 = RWT[k][l9], its = R9 && (R9.pick ? R9.pick : [R9]); for (const it of its || []) if (O.has(it.id) && !list.includes(it)) list.push(it); } return list; }
  /* 가방 창(town.js openBag) 아래 칸 — 옷 카드(누르면 쓰기/벗기 · 하나만) · 장비 카드(쓰임 한 줄 · 켜짐 · 이마 전등만 켜기/끄기) · 내 칭호 줄 */
  function bagHtml() { if (A.promo()) return ''; const list = ownList(); if (!list.length) return ''; const e = en(), r = S(), of = kd => list.filter(q => q.kind === kd), bs = 'min-height:30px;padding:3px 9px;margin-top:3px';
    let h = '<div class="grp" data-rwbag="1">👕 ' + (e ? 'Clothes and gear' : '옷·장비') + '</div>';
    for (const kd of WEARK) { const L9 = of(kd); if (!L9.length) continue; const cur = curOf(kd), W9 = WN[kd];
      h += '<div class="sm">' + esc(L(W9[2])) + '</div><div class="bagg">' + L9.map(q => { const v = q.id.slice(2), on = cur === v; return '<div data-rwcard="' + q.id + '"' + (on ? ' style="outline:3px solid #e0a92e"' : '') + '><b>' + q.ic + '</b>' + esc(L(q.t).replace(/^(가방|목수건|자전거 깃발|자전거) ?/, '')) + '<br>' + (on ? '<i>✔ ' + (e ? 'On now' : '지금 씀') + '</i><br><button class="sub" data-rww="' + kd + ':-" style="' + bs + '">' + esc(L(W9[1])) + '</button>' : '<button data-rww="' + kd + ':' + v + '" style="' + bs + '">' + esc(L(W9[0])) + '</button>') + '</div>'; }).join('') + '</div>'; }
    const gear = of('gear'); if (gear.length) h += '<div class="sm">' + (e ? 'Gear (works by itself once you have it)' : '장비(가지고 있으면 저절로 써요)') + '</div>' + gear.map(q => { const lp = q.id === 'lamp', off = lp && r.lampOff; return '<div class="st" data-rwgear="' + q.id + '"><b class="n">' + q.ic + '</b><span style="flex:1"><b>' + esc(L(q.t)) + '</b> <small style="font-weight:800;color:' + (off ? '#8a7f74' : '#2f7a3a') + '">' + (off ? (e ? 'Off' : '꺼 둠') : (e ? 'On' : '켜짐')) + '</small><br><small>' + esc(L(q.use)) + '</small></span>' + (lp ? '<button class="sub" data-rwl="1" style="' + bs + '">' + (off ? (e ? 'Turn on' : '켜기') : (e ? 'Turn off' : '끄기')) + '</button>' : '') + '</div>'; }).join('');
    const nk = of('nick'), bd = of('badge'); if (nk.length || bd.length) { h += '<div class="sm">' + (e ? 'My title (what neighbours call you)' : '내 칭호(이웃이 부르는 이름)') + '</div>';
      if (nk.length) h += '<div class="row" style="flex-wrap:wrap;justify-content:flex-start">' + [['-', e ? 'Just my name' : '그냥 부르기']].concat(nk.map(q => [q.id.slice(2), (L(q.t).match(/[「“](.+)[」”]/) || [0, L(q.t)])[1]])).map(([v, t]) => { const on = v === '-' ? !r.nick : r.nick === v; return '<button class="' + (on ? '' : 'sub') + '" data-rwn="' + v + '">' + (on ? '✔ ' : '') + esc(t) + '</button>'; }).join('') + '</div>';
      if (bd.length) h += '<div class="sm">' + bd.map(q => q.ic + ' ' + esc(L(q.t))).join(', ') + '</div>'; }
    const etc = list.filter(q => ['place', 'seed', 'recipe'].includes(q.kind)); if (etc.length) h += '<div class="sm">' + (e ? 'Also got: ' : '받은 자리·요리법·씨앗: ') + etc.map(q => q.ic + ' ' + esc(L(q.t))).join(', ') + '</div>';
    return h; }
  function bagClick(b) { if (A.promo()) return false; const d = b.dataset, r = S();
    if (d.rww) { const [kd, v] = d.rww.split(':'); if (!WEARK.includes(kd)) return false; putOn(kd, v === '-' ? '' : v); if (A.sfx) A.sfx('tick'); return true; }
    if (d.rwn != null) { const v = d.rwn === '-' ? '' : d.rwn; if (v && !own().has('n:' + v)) return true; r.nick = v; mark(); return true; }
    if (d.rwl) { r.lampOff = r.lampOff ? 0 : 1; mark(); lampSync(); return true; }
    return false; }
  function toBag() { A.openBag(); const s9 = document.querySelector('.twn-p [data-rwbag]'); const bx = s9 && s9.closest('.bx'); if (bx) bx.scrollTop = Math.max(0, s9.getBoundingClientRect().top - bx.getBoundingClientRect().top + bx.scrollTop - 72); }   /* 머리 줄(가방 · 돈)에 가리지 않게 조금 위 */
  const inBag = () => (en() ? ' — it is in the 👕 part of your bag' : ' — 가방 👕 칸에 있어요');
  // ── 써 보러 가기 ──
  function go(it) { if (!it || !it.go) return; const e = en(), [g, a] = it.go.split(':');
    if (g === 'hold') { if (A.bike()) A.unbike(); setTimeout(() => { if (!dead) A.toolHold(a); }, 60); return; }
    if (g === 'ride') { A.ride(); return; }
    if (g === 'bag') { A.openBag(); return; }
    if (g === 'night') { A.say(GAME.phase === 'night' ? (e ? '🔦 It is night — your head lamp is on. Look ahead!' : '🔦 지금은 밤이라 이마 전등이 켜졌어요. 앞을 비춰 봐요') : (e ? '🔦 After 19:00 outdoors it turns on by itself' : '🔦 밤(19시 뒤)에 밖에 나가면 저절로 켜져요'), 3); lampSync(); return; }
    if (g === 'wear') { toBag(); return; }
    if (g === 'spot') { const p = A.spot(a); if (!p) { A.say(e ? '🧭 There is no such place in this town yet' : '🧭 이 마을에는 아직 그런 곳이 없어요', 2.6); return; } A.route({ door: [p[0], p[1]], icon: it.ic, name: p[e ? 3 : 2] || '' }); } }
  // ── 창(🎁 칩을 눌렀을 때만) ──
  const card = (it, extra) => '<div class="st"><b class="n" style="font-size:44px;line-height:1">' + it.ic + '</b><span style="flex:1"><b style="font-size:17px">' + esc(L(it.t)) + '</b><br><small>' + esc(L(it.use)) + '</small>' + (extra || '') + '</span></div>';
  /* 솜씨 능력(PERKS 수치 · 그대로) = 창 안 '이제 …' 한 줄(줄 머리 이모지는 뺌 — 한 줄에 이모지 둘까지) */
  function perkLine(k, l9) { const P9 = (SK().perks[k] || []).find(q => q[0] === l9); if (!P9 || P9[1] === 'badge') return ''; const t = L(P9[3]).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, ''); return '<div class="sm">✅ ' + esc(en() ? 'Also: ' + t : (/^이제/.test(t) ? t : '이제 ' + t)) + '</div>'; }
  function open() { if (dead || A.promo()) return; const e = en(), Q9 = pending(); if (!Q9.length) { chip(); return; } const b9 = A.busyWhy(); if (b9) { A.say(b9 === 'sit' ? (e ? '🎁 Stand up first (E), then tap 🎁' : '🎁 일어난 뒤에 받아요(E로 일어나요)') : (e ? '🎁 Finish what you are doing, then tap 🎁' : '🎁 하던 일을 마치면 받을 수 있어요'), 2.6); return; }
    const [k, l9] = Q9[0], R9 = RWT[k][l9], sk = SK().skills[k], left = Q9.length - 1;
    let h = '<h3>🎁 ' + (e ? 'Level reward' : '레벨 보상') + '</h3><div class="sm">' + sk.icon + ' ' + esc(L(sk.t)) + ' ' + l9 + (e ? '' : '레벨') + '</div>';
    if (R9.pick) h += '<div class="sm" style="font-weight:700">' + (e ? 'Pick one. The other one comes at level 10.' : '하나를 골라요. 고르지 않은 것은 10레벨에 받아요.') + '</div>' + card(R9.pick[0]) + card(R9.pick[1]);
    else { const o = l9 === RW_MAX ? otherOf(k) : null; h += card(R9, o ? '<br><small>➕ ' + esc(L(o.t)) + '</small>' : ''); }
    const o9 = l9 === RW_MAX ? otherOf(k) : null, W = !R9.pick ? (o9 && WEARK.includes(o9.kind) ? o9 : WEARK.includes(R9.kind) ? R9 : null) : null, emp = W && !curOf(W.kind);
    if (R9.pick || W || ['gear', 'nick', 'badge'].includes(R9.kind)) h += '<div class="sm">🎒 ' + (e ? 'You will find it in the 👕 part of your bag (I)' : '받으면 가방(I) 👕 칸에 있어요') + '</div>';
    h += perkLine(k, l9) + (left ? '<div class="sm">' + (e ? left + ' more after this' : '이것 다음에 ' + left + '개 더 있어요') + '</div>' : '');
    h += R9.pick ? '<div class="row"><button data-a="y">' + R9.pick[0].ic + ' ' + esc(L(R9.pick[0].t)) + '</button><button data-a="x">' + R9.pick[1].ic + ' ' + esc(L(R9.pick[1].t)) + '</button></div>'
      : W ? '<div class="row"><button' + (emp ? '' : ' class="sub"') + ' data-a="y">👀 ' + (e ? 'Put it on now' : '지금 쓰기') + '</button><button class="sub" data-a="x">🎒 ' + (e ? 'Put it in my bag' : '가방에 넣기') + '</button></div>'
      : '<div class="row"><button data-a="y">' + goName(l9 === RW_MAX && otherOf(k) ? otherOf(k) : R9) + '</button><button class="sub" data-a="x">' + (e ? 'Just take it' : '받기만 하기') + '</button></div>';
    const P9 = A.openP(h, false, 'lvr');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b || !b.dataset.a) return; const a = b.dataset.a, it = take(k, l9, R9.pick ? a === 'x' : false); A.closeP(); chip();
      if (!it) return; const o = l9 === RW_MAX ? otherOf(k) : null; if (R9.pick) { A.say(it.ic + ' ' + (e ? L(it.t) + ' — got it' : L(it.t) + ' — 받았어요') + (WEARK.includes(it.kind) || it.kind === 'gear' ? inBag() : ''), 2.8); return; }
      if (W) { if (a === 'y') { putOn(W.kind, W.id.slice(2)); A.say(W.ic + ' ' + (e ? L(W.t) + ' — on now. Change it in the 👕 part of your bag' : L(W.t) + ' — 지금 써요. 가방 👕 칸에서 바꿀 수 있어요'), 2.8); } else A.say(W.ic + ' ' + (e ? L(W.t) + ' — in the 👕 part of your bag' : L(W.t) + ' — 가방 👕 칸에 넣었어요'), 2.6); return; }
      if (a === 'y') go(o || it); else A.say(it.ic + ' ' + (e ? L(it.t) + ' — got it' : L(it.t) + ' — 받았어요') + (['gear', 'nick', 'badge'].includes(it.kind) ? inBag() : ''), 2.6); }; }   /* Esc로 닫으면 칩에 그대로 남음 */
  function goName(it) { const e = en(), g = (it.go || '').split(':')[0]; return g === 'hold' ? '🧰 ' + (e ? 'Hold it now' : '바로 들기') : g === 'ride' ? '🚲 ' + (e ? 'Ride and see (B)' : '타 보기(B)') : g === 'bag' ? '🎒 ' + (e ? 'Open the bag' : '가방 열어 보기') : g === 'spot' ? '🧭 ' + (e ? 'Go try it' : '써 보러 가기') : g === 'night' ? '🔦 ' + (e ? 'Got it' : '알겠어요') : '👀 ' + (e ? 'Put it on' : '해 보기'); }
  // ── 솜씨 창 한 줄(다음 보상) · 꾸미기 창 ──
  function next(k) { const lv9 = SK().lv(k); for (let l9 = Math.max(2, lv9 + 1); l9 <= RW_MAX; l9++) { const R9 = RWT[k][l9]; if (!R9) continue; const t = R9.pick ? R9.pick.map(q => q.ic + ' ' + L(q.t)).join(en() ? ' or ' : ' 또는 ') : R9.ic + ' ' + L(R9.t); return '<br><small>🎁 ' + l9 + (en() ? ': ' : '레벨 — ') + esc(t) + '</small>'; } return ''; }
  /* WEAR-1: 솜씨 창 단추 = 가방 👕 칸으로 가는 길(같은 기능 두 곳 X) */
  function wardrobeBtn() { return !A.promo() && own().size ? '<div class="row" style="justify-content:flex-start"><button class="sub" data-a="rwd">👕 ' + (en() ? 'Clothes and gear are in the bag' : '옷·장비는 가방에서 바꿔요') + '</button></div>' : ''; }
  function wardrobe() { toBag(); }
  // ── 캐릭터에 붙이기(모자·목수건·가방 색·이마 전등) — 고를 때 한 번 · 메시 하나씩(정점색 굽기 = kid.js bake 결) ──
  const _m = new T3.Matrix4(), _nm = new T3.Matrix3(), _q = new T3.Quaternion(), _e = new T3.Euler(), _v = new T3.Vector3(), _n = new T3.Vector3(), _s = new T3.Vector3(), _c = new T3.Color();
  let G9 = null; const geo = () => G9 || (G9 = { cyl: new T3.CylinderGeometry(1, 1, 1, 18, 1), sph: new T3.SphereGeometry(1, 16, 10), dome: new T3.SphereGeometry(1, 18, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), tor: new T3.TorusGeometry(1, 0.28, 8, 22) });
  let KMAT = null; const kmat = () => KMAT || (KMAT = (MATS.push(new T3.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a2018 })), MATS[MATS.length - 1]));
  function bake(parts) { const pos = [], nor = [], cl = [], G = geo();
    for (const [gk, p, sc, hex, r] of parts) { const g0 = G[gk], g = g0.index ? g0.toNonIndexed() : g0, P = g.attributes.position, N = g.attributes.normal; _m.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(...(r || [0, 0, 0]))), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m); _c.set(hex);
      for (let i = 0; i < P.count; i++) { _v.fromBufferAttribute(P, i).applyMatrix4(_m); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); } if (g !== g0) g.dispose(); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(cl, 3)); GEOS.push(g); const m = new T3.Mesh(g, kmat()); m.castShadow = false; m.userData.rwd = 1; return m; }
  /* RWFIX-1(코덱스 C E6): 바꿔 단 옷·좌판 그림은 모양까지 버림(예전 = 부모에서만 떼고 GEOS에 쌓여 마을을 나갈 때까지 남음) */
  function drop(o) { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse(q => { if (q.geometry) { const i = GEOS.indexOf(q.geometry); if (i >= 0) GEOS.splice(i, 1); q.geometry.dispose(); } if (q.material && q.material !== KMAT) { const j = MATS.indexOf(q.material); if (j >= 0) { MATS.splice(j, 1); q.material.dispose(); } } }); }
  const rig = () => { if (A.promo()) return null; const K = map.player.rig; return K && K.head && K.body ? K : null; };
  /* 기본 모자 칸(정점) = 처음 붙일 때 '지금 칠해진 모자 색'으로 찾아 둠 · 모자를 쓰면 그 칸을 모자 색으로 · 벗으면 내 모습(look.js) 색으로 다시 */
  let CAPI = null, CAPP = false;
  function capPaint(hex) { const K = rig(); if (!K) return; const m = K.head.children.find(o => o.isMesh && o.geometry.attributes.color); if (!m) return; const C = m.geometry.attributes.color;
    if (!CAPI) { const lc = A.lookCap(), want = [lc.cap, lc.cap2].map(h => _c.set(h).toArray()); CAPI = []; for (let i = 0; i < C.count; i++) if (want.some(w => Math.abs(C.getX(i) - w[0]) < 3e-4 && Math.abs(C.getY(i) - w[1]) < 3e-4 && Math.abs(C.getZ(i) - w[2]) < 3e-4)) CAPI.push(i); }
    if (hex == null) { if (CAPP) { CAPP = false; A.lookRepaint(); } return; } CAPP = true; _c.set(hex); for (const i of CAPI) C.setXYZ(i, _c.r, _c.g, _c.b); C.needsUpdate = true; }
  function wear() { const K = rig(), r = S(); if (!K) return; if (RIG !== K) { RIG = K; CAPI = null; }
    const hk = r.hat && HATS[r.hat] && own().has('h:' + r.hat) ? r.hat : '';
    if (HAT && HAT.userData.k !== hk) { drop(HAT); HAT = null; }
    if (hk && !HAT) { HAT = bake(HATS[hk].p); HAT.userData.k = hk; K.head.add(HAT); }
    capPaint(hk ? HATS[hk].cap : null);
    const sk = r.scarf && A.rcol(r.scarf) != null && own().has('s:' + r.scarf) ? r.scarf : '';
    if (SCF && SCF.userData.k !== sk) { drop(SCF); SCF = null; }
    if (sk && !SCF) { const c = A.rcol(sk), d = dark(c); SCF = bake([['tor', [0, 0.745, 0.005], [0.158, 0.158, 0.14], c, [Math.PI / 2, 0, 0]], ['cyl', [0.06, 0.655, 0.128], [0.04, 0.12, 0.016], d, [0.12, 0, 0.18]]]); SCF.userData.k = sk; K.rig.add(SCF); }
    lampSync(); }
  const dark = h => (((h >> 16 & 255) * 0.8) << 16) | (((h >> 8 & 255) * 0.8) << 8) | ((h & 255) * 0.8);
  /* 가방 색: 몸 메시(kid.js body)에서 원래 가방 두 색(0xe45c46 · 0xc44a37) 정점을 한 번 찾아 둠 */
  function bagPaint() { const K = rig(), r = S(); if (!K) return; const m = K.body, C = m && m.geometry && m.geometry.attributes.color; if (!C) return;
    if (!BAGI || BAGI.m !== m) { const a = _c.set(0xe45c46).toArray(), b = _c.set(0xc44a37).toArray(), I9 = [[], []]; for (let i = 0; i < C.count; i++) { const x = C.getX(i), y = C.getY(i), z = C.getZ(i); if (Math.abs(x - a[0]) < 3e-4 && Math.abs(y - a[1]) < 3e-4 && Math.abs(z - a[2]) < 3e-4) I9[0].push(i); else if (Math.abs(x - b[0]) < 3e-4 && Math.abs(y - b[1]) < 3e-4 && Math.abs(z - b[2]) < 3e-4) I9[1].push(i); } BAGI = { m, I: I9 }; }
    const k = r.bag && own().has('g:' + r.bag) ? r.bag : '', c0 = k ? A.rcol(k) : 0xe45c46, c1 = k ? dark(c0) : 0xc44a37;
    _c.set(c0); for (const i of BAGI.I[0]) C.setXYZ(i, _c.r, _c.g, _c.b); _c.set(c1); for (const i of BAGI.I[1]) C.setXYZ(i, _c.r, _c.g, _c.b); C.needsUpdate = true; }
  /* 이마 전등: 머리 띠 + 전등(정점색 하나) · 빛 원뿔 + 땅 위 빛 자리(MeshBasic 더하기 · 새 Light X) — 밤 · 밖 · 걸을 때만(1초 칸) */
  function lampBuild(K) { const g = new T3.Group(); g.add(bake([['cyl', [0, 0.405, 0], [0.312, 0.03, 0.312], 0x3a3f4a], ['cyl', [0, 0.43, 0.275], [0.055, 0.05, 0.055], 0x2f3338, [Math.PI / 2, 0, 0]], ['cyl', [0, 0.43, 0.3], [0.042, 0.012, 0.042], 0xfff6c8, [Math.PI / 2, 0, 0]]]));
    const cg = new T3.ConeGeometry(1.9, 8, 20, 1, true); cg.translate(0, -4, 0); cg.rotateX(-Math.PI / 2); cg.rotateX(0.2); GEOS.push(cg);
    const cm = new T3.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.085, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }); MATS.push(cm);
    const cone = new T3.Mesh(cg, cm); cone.position.set(0, 0.43, 0.31); cone.renderOrder = 4; cone.frustumCulled = false; cone.userData.beam = 1;
    const sg = new T3.CircleGeometry(1.7, 28); sg.rotateX(-Math.PI / 2); GEOS.push(sg); const sm = new T3.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.32, blending: T3.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); MATS.push(sm);
    const spot = new T3.Mesh(sg, sm); spot.position.set(0, -0.72, 4.4); spot.scale.set(1, 1, 1.35); spot.renderOrder = 4; spot.userData.beam = 1; g.add(cone, spot); g.userData.k = 'lamp'; K.head.add(g); return g; }
  let LAMPON = null;
  function lampSync() { const K = rig(); if (!K || !has('lamp')) { if (LAMP) LAMP.visible = false; LAMPON = false; return; } if (!LAMP || LAMP.parent !== K.head) { drop(LAMP); LAMP = lampBuild(K); }
    const on = GAME.phase === 'night' && !A.indoor() && !S().lampOff; LAMP.visible = true; for (const o of LAMP.children) if (o.userData.beam) o.visible = on; if (on !== LAMPON) { LAMPON = on; if (on && !S().tipLamp) { S().tipLamp = 1; mark(); A.say(en() ? '🔦 It got dark, so your head lamp turned on' : '🔦 어두워져서 이마 전등이 켜졌어요', 3, 1); } } }
  // ── 장화: 갯벌·논에선 발이 빠져 느림(0.62) · 장화면 그대로 — 0.25초 칸에서 바뀔 때만 걸음 빠르기 다시 ──
  function walkK() { return MUDN && !has('boots') ? 0.62 : 1; }
  function mudTick() { const me = map.player.pos(), k = A.bike() || A.swim() ? '' : A.soft(me.x, me.z) || ''; if (k === MUDN) return; MUDN = k; A.walkRe();
    if (k && !has('boots') && MUDT !== day()) { MUDT = day(); A.say(k === 'mud' ? (en() ? '🦶 Your feet sink in the mud and you walk slowly. Rain boots would help (farming level 2)' : '🦶 갯벌 진흙에 발이 푹푹 빠져 느려요. 장화가 있으면 그대로 걸어요(농사 2레벨)') : (en() ? '🦶 Walking in the wet paddy is slow. Rain boots would help (farming level 2)' : '🦶 물 댄 논에 들어가니 걸음이 느려요. 장화가 있으면 그대로 걸어요(농사 2레벨)'), 3.2, 1); } }
  // ── 🏷 이웃 말: 일꾼 곁(4.5m)에 가면 하루에 이웃마다 한 번(모두 셋까지) ──
  function nickTick() { const r = S(), k = r.nick; if (!k || !own().has('n:' + k) || A.busy() || A.bubbleBusy()) return; if (!r.nk || r.nk.d !== day()) r.nk = { d: day(), n: 0, w: {} }; if (r.nk.n >= 3) return; const me = map.player.pos();
    let w = null, bd = 4.5; for (const q of A.workers()) { if (!q.k || q.rep === false || q.party || !(NKS[k] || []).includes(NKK[q.k])) continue; const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < bd && Math.abs(q.g - me.y) < 2.5) { bd = d; w = q; } } if (!w) return;
    const id = w.hk || (w.k + ':' + Math.round(w.x) + ':' + Math.round(w.z)); if (r.nk.w[id]) return; r.nk.w[id] = 1; r.nk.n++; mark(); const L9 = NKL[k]; A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(L9[(day() + r.nk.n) % L9.length])); A.rec('nick'); }
  // ── 🧺 내 좌판(장터 창 안) + 📒 장터 수첩 ──
  const stMax = () => (has('stall2') ? 5 : 3);
  function stOf(w) { const st = S().st; return st && st.it && st.it.length && st.w === A.mkKey(w) ? st : null; }
  function marketHtml(w, L9) { const e = en(); let h = ''; if (has('stall')) { const st = S().st, mine = stOf(w), n = st && st.it ? st.it.length : 0, elsewhere = st && st.it && st.it.length && !mine;
      h += '<div class="st"><b class="n">🧺</b><span style="flex:1"><b>' + (e ? 'My market mat' : '내 좌판') + '</b> <small>' + (elsewhere ? esc(e ? 'Your things are on the mat at ' + st.nm + '. They sell tonight.' : st.nm + '에 둔 물건이 오늘 밤 팔려요.') : (e ? 'Things left here sell overnight. Money comes in the morning.' : '두고 가면 밤사이 팔려 다음 아침에 돈이 들어와요.')) + '</small>'
        + (mine ? '<br>' + mine.it.map(q => q[0]).join(' ') + ' <small>(' + n + '/' + stMax() + ')</small>' : '') + '</span></div>';
      if (!elsewhere && n < stMax() && L9.length) h += '<div class="row" style="flex-wrap:wrap;justify-content:flex-start">' + L9.slice(0, 10).map(e9 => '<button class="sub" data-rwst="' + e9 + '" style="min-height:36px;padding:3px 9px">🧺 ' + e9 + '</button>').join('') + '</div>'; }
    return h; }
  function bestLine(w, e9) { if (!has('book')) return ''; const b = A.mkBest(w, e9); return b ? '<br><small style="color:#2f6a9a">📒 ' + esc(en() ? b.nm + ' (' + b.dir + ') pays more' : b.nm + '(' + b.dir + '쪽)에서 더 쳐줘요') + '</small>' : ''; }
  function marketClick(w, b) { const e9 = b.dataset.rwst; if (!e9 || !has('stall')) return false; const r = S(), key = A.mkKey(w); if (r.st && r.st.it && r.st.it.length && r.st.w !== key) return true; if (!r.st || r.st.w !== key || !r.st.it) r.st = { w: key, nm: A.mkName(w), x: w.x, z: w.z, ry: w.ry || 0, g: w.g, it: [], d: day() };
    if (r.st.it.length >= stMax()) return true; const v = A.mkPut(w, e9); if (!(v > 0)) return true; r.st.it.push([e9, v]); r.st.d = day(); mark(); matDraw(); A.rec('stall'); if (A.sfx) A.sfx('tick'); return true; }
  function stPay() { const r = S(), st = r.st; if (!st || !st.it || !st.it.length || st.d >= day()) return; let v = 0; for (const q of st.it) v += q[1] | 0; const n = st.it.length; r.st = null; mark(); matDraw(); const got = v > 0 ? GAME.earn(v, 'mv:sell') : 0; if (got > 0) A.moneyPop(got);   /* 장터 팔기와 같은 옮김(mv:sell) */
    A.say(en() ? '🧺 The ' + n + ' thing(s) on your mat at ' + st.nm + ' sold overnight: ' + A.won(got) : '🧺 ' + st.nm + ' 좌판에 둔 ' + n + '개가 밤사이 팔렸어요. ' + A.won(got) + '이 들어왔어요', 4, 1); }
  /* 좌판 그림 = 깔개 하나 + 둔 만큼 작은 바구니(정점색 한 메시 · 둘 때만 다시 짓기) */
  function matDraw() { if (MAT) { map.remove(MAT); drop(MAT); MAT = null; } const st = S().st; if (!st || !st.it || !st.it.length || A.promo()) return; const c = Math.cos(st.ry || 0), s = Math.sin(st.ry || 0), ox = st.x + c * 1.9, oz = st.z - s * 1.9, gy = A.gy(ox, oz);
    const P = [['cyl', [0, 0.012, 0], [0.7, 0.024, 0.5], 0x6a8ac8]]; st.it.forEach((q, i) => { const a = (i - (st.it.length - 1) / 2) * 0.27; P.push(['cyl', [a, 0.07, 0.05 * (i % 2)], [0.11, 0.1, 0.11], 0xc49a6a], ['sph', [a, 0.13, 0.05 * (i % 2)], [0.085, 0.05, 0.085], [0xe2412f, 0xf2c531, 0x5aa043, 0xa8456a, 0xf4f1e8][i % 5]]); });
    MAT = bake(P); MAT.position.set(ox, gy, oz); MAT.rotation.y = st.ry || 0; MAT.updateMatrix(); MAT.matrixAutoUpdate = false; map.add(MAT); }
  // ── 🔭 망원경(도구 띠 6) — 누르면 1인칭 + 화각 ÷3 · 0.3초마다 가운데 보이는 곳 이름·거리 · 다시 누르거나 내려놓으면 끝 ──
  function scope(on) { const e = en(); if (on == null) on = !SC.on; if (on === SC.on) return; SC.on = on;
    if (on) { SC.first = map.player.first; map.player.view('first'); map.player.zoom(3); if (!SC.el) { SC.el = document.createElement('div'); SC.el.className = 'twn-scope ttl-keep'; SC.el.style.cssText = 'position:fixed;left:50%;top:58%;transform:translateX(-50%);z-index:21;pointer-events:none;padding:6px 14px;border:2px solid #2b2420;border-radius:10px;background:#fff8ea;color:#2b2420;font:800 16px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;box-shadow:0 3px 0 #2b2420;white-space:nowrap'; document.body.appendChild(SC.el); }
      SC.el.textContent = '🔭 ' + (e ? 'Aim the middle at a building' : '가운데를 건물·장소에 맞춰 봐요'); SC.el.style.display = 'block'; SC.q = 0; A.rec('scope'); }
    else { map.player.zoom(1); map.player.view(SC.first ? 'first' : 'third'); if (SC.el) SC.el.style.display = 'none'; } }
  const DIR8 = [T2('북', 'N'), T2('북동', 'NE'), T2('동', 'E'), T2('남동', 'SE'), T2('남', 'S'), T2('남서', 'SW'), T2('서', 'W'), T2('북서', 'NW')];
  const _f = new T3.Vector3();
  function scopeTick() { if (!SC.on) return; if (A.toolCur() !== 'scope' || A.busy() || A.bike()) { scope(false); return; } const me = map.player.pos(); _f.set(0, 0, -1).applyQuaternion(map.camera.quaternion); const h0 = Math.atan2(_f.x, -_f.z);
    let b = null, bs = 1e9; for (const p of A.places()) { const dx = p.x - me.x, dz = p.z - me.z, d = Math.hypot(dx, dz); if (d < 35 || d > 1400) continue; let da = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, -dz) - h0), Math.cos(Math.atan2(dx, -dz) - h0))); const tol = Math.max(0.035, Math.atan2(9, d)); if (da > tol) continue; const sc9 = da / tol + d / 4000; if (sc9 < bs) { bs = sc9; b = [p, d, Math.atan2(dx, -dz)]; } }
    const e = en(); if (!b) { SC.el.textContent = '🔭 ' + (e ? 'Aim the middle at a building' : '가운데를 건물·장소에 맞춰 봐요'); return; } const [p, d, a] = b, k8 = Math.round(((a * 180 / Math.PI + 360) % 360) / 45) % 8, nm = e ? p.en || p.name : p.name, seen = A.seen(p.x, p.z);
    SC.el.textContent = '🔭 ' + (p.icon ? p.icon + ' ' : '') + nm + ' · ' + L(DIR8[k8]) + (e ? ' · about ' : '쪽 · 약 ') + (d >= 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d / 10) * 10 + ' m') + (seen ? '' : (e ? ' · not visited yet' : ' · 아직 안 가 봤어요')); }
  // ── 씨앗: 텃밭·화분 고르기 칸에 더함 ──
  function seeds(sd) { const out = sd.slice(); if (has('allseed')) for (const e9 of A.allSeeds()) if (!out.includes(e9)) out.push(e9); if (has('berry') && !out.includes('🍓')) out.push('🍓'); return out; }
  // ── 돌기(매 프레임 = 셈 둘 · 0.25초 = 진흙 · 망원경 0.3초 · 1초 = 전등·이웃 말·좌판 아침) ──
  function tick(dt) { if (dead || A.promo() || !A.on()) return; if ((q4 += dt) >= 0.25) { q4 = 0; mudTick(); } if (SC.on && (SC.q -= dt) <= 0) { SC.q = 0.3; scopeTick(); }
    if ((q1 += dt) >= 1) { q1 = 0; if (RIG !== rig()) wear(); lampSync(); nickTick(); stPay(); } }
  function init() { if (A.promo()) return; OWN = null; wear(); bagPaint(); matDraw(); chip(); }
  function dispose() { dead = true; if (SC.on) scope(false); if (SC.el) SC.el.remove(); SC.el = null; if (HAT && HAT.parent) HAT.parent.remove(HAT); if (SCF && SCF.parent) SCF.parent.remove(SCF); if (LAMP && LAMP.parent) LAMP.parent.remove(LAMP); HAT = SCF = LAMP = null;
    if (CAPI && CAPP) capPaint(null); if (BAGI) { const C = BAGI.m.geometry.attributes.color; _c.set(0xe45c46); for (const i of BAGI.I[0]) C.setXYZ(i, _c.r, _c.g, _c.b); _c.set(0xc44a37); for (const i of BAGI.I[1]) C.setXYZ(i, _c.r, _c.g, _c.b); C.needsUpdate = true; } if (MAT) { map.remove(MAT); MAT = null; }
    for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); if (G9) for (const k in G9) G9[k].dispose(); GEOS.length = 0; MATS.length = 0; G9 = null; KMAT = null; }
  const API = { pending: () => pending().map(q => q.slice()), own: () => [...own()], has, take: (k, l9, p) => take(k, l9, p), go: it => go(it), item: (k, l9) => itemOf(k, l9), state: () => JSON.parse(JSON.stringify(S())), walkK, mud: () => MUDN, scope: () => ({ on: SC.on, text: SC.el ? SC.el.textContent : '' }), lamp: () => !!(LAMP && LAMP.visible && LAMP.children.some(o => o.userData.beam && o.visible)), hat: () => (HAT ? HAT.userData.k : ''), stall: () => S().st, stPay: () => { const st = S().st; if (st) st.d = -1; stPay(); }, wardrobe: () => wardrobe(), bagHtml: () => bagHtml(), scarf: () => (SCF ? SCF.userData.k : ''), bag: () => S().bag || '', spot: k => A.spot(k), soft: (x, z) => A.soft(x, z), open: () => open() };
  return { init, tick, dispose, chip, open, has, walkK, next, wardrobeBtn, wardrobe, bagHtml, bagClick, marketHtml, marketClick, bestLine, seeds, scope, pending, api: API };
}
