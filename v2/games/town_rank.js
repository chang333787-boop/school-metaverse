// 🏅 솜씨 승급 미션(RANK-1 · 발전 방향 #42 · 사용자 10-17 '애들이 열심히 하게 되는 동기 — 막지 않는 방식으로'): 자료 + 작은 실행기(town_skill.js·town_quiz.js와 같은 결)
//   솜씨가 3·6·9레벨에 닿으면 솜씨 창에 그 레벨 미션이 열림 · 레벨은 그대로 오름(미션은 덤 · 안 해도 막히는 것 X) · 한 번에 하나
//   미션 = 그 솜씨에서 배운 것을 '써서' 하는 일(해 보기) — 고르기 문제는 배움 별(QUIZ-1)이 맡으므로 여기엔 없음 · 판정은 이벤트·상태로만 · 셈 X
//   끝 = 🏅 배지 + 칭호 + 작은 꾸미기(그 솜씨 첫 미션 = 자전거 색 · 6레벨 = 자전거 깃발 · 9레벨 = 깃발에 금별) + 사실 한 줄 · 쓴 개념(use)은 배움 별(GAME.S.learn · 같은 id)에 남겨 보너스 문제로 다시 만남
//   이 기기에서 나만 보기(반 순위·견주기 X) · 매 프레임 일 0(마을 1초 칸 tick + 이벤트) · 상태 GAME.S.rank = { cur: { k, lv, v, off }, done: { 'k:lv': 날 }, title: 'k:lv' | '', bike: { c: k | '', f: k | '' } }
export const RANK_V = 1;
export const RANK_LV = [3, 6, 9];
const T2 = (ko, en) => [ko, en];
// 솜씨 색(자전거 뼈대) — 밝고 순한 색(스타일 가이드)
export const RCOL = { work: [0xe0a92e, T2('밀짚색', 'Straw')], cook: [0xd9534a, T2('토마토색', 'Tomato')], farm: [0x4fa85a, T2('새싹색', 'Sprout green')], look: [0x8a6ad0, T2('보라색', 'Violet')], trade: [0xf0863a, T2('귤색', 'Tangerine')], explore: [0x23a39a, T2('청록색', 'Teal')] };
const SKI = { work: '🌾', cook: '🍳', farm: '🌱', look: '🔍', trade: '🛒', explore: '🧭' };
const DIR8 = [T2('북', 'north'), T2('북동', 'north-east'), T2('동', 'east'), T2('남동', 'south-east'), T2('남', 'south'), T2('남서', 'south-west'), T2('서', 'west'), T2('북서', 'north-west')];
const REGN = { 바다: 'the seaside', 산: 'the mountains', 강: 'the river', 들: 'the fields', 읍내: 'the town centre', 시내: 'downtown', 관광: 'the sightseeing area' };
const NATURE = /^(bug|fish|star|shore):/;
// 요리 무리(식품구성자전거 · 감자·옥수수 = 곡류 · 버섯 = 채소 무리)
const FGRP = { '🌾': 'grain', '🍚': 'grain', '🥔': 'grain', '🌽': 'grain', '🍞': 'grain', '🍠': 'grain', '🥚': 'pro', '🐟': 'pro', '🐚': 'pro', '🥬': 'veg', '🍄': 'veg', '🍃': 'veg', '🥕': 'veg', '🥒': 'veg', '🍅': 'veg' };
const FGN = { grain: T2('곡류', 'grains'), veg: T2('채소', 'vegetables'), pro: T2('고기·생선·달걀', 'meat, fish, eggs') };
const KINDN = { conv: T2('편의점', 'the convenience store'), grocery: T2('마트', 'the mart') };
// 미션(갈래 × 레벨) — t 미션 이름 · todo 할 일(할 일 줄) · n 목표 수 · how 쓰는 배움 한 줄 · hint 셋(💡 누를 때마다 하나) · did 끝 문장 · card 사실 · name 칭호 · use 배움 별 개념 id · kind 실행 방식
export const MISSIONS = {
  explore: {
    3: { kind: 'stn', n: 2, t: T2('처음 가는 역', 'New stations'), todo: T2('지하철로 가 보지 않은 역 두 곳에서 내리기', 'Get off at two subway stations you haven’t visited'), how: T2('노선도에서 역의 차례를 보고 내릴 역을 정해요', 'Use the line map to pick where to get off'),
      hint: [T2('지하철역 입구(🚇)에서 E를 누르면 노선도가 나와요', 'Press E at a subway entrance (🚇) to see the line map'), T2('노선도에서 지금 역과 내릴 역 사이에 역이 몇 개인지 세어 봐요', 'Count the stops between here and where you want to go'), T2('내린 역에서 다시 타면 또 다른 역으로 갈 수 있어요', 'Ride again from there to reach another station')],
      did: T2('지하철로 처음 가는 역 두 곳에 내렸어요.', 'You got off at two new stations.'), card: T2('노선도는 역의 차례와 갈아타는 곳을 보여 줘요. 실제 거리나 방향과는 달라요.', 'A line map shows the order of stations and transfers — not real distances or directions.'), name: T2('🚇 지하철 탐험가', '🚇 Subway explorer'), use: [] },
    6: { kind: 'dir', n: 1, t: T2('방위 따라 가기', 'Follow the compass'), todo: T2('{d}쪽 {r} 지역까지 가 보기', 'Go {d} to {r}'), how: T2('나침반 띠의 방위 글자를 화면 가운데에 두고 걸어요', 'Keep the direction letter in the middle of the compass strip'),
      hint: [T2('나침반 띠에서 「{d}」 글자를 찾아 화면 가운데로 돌려요', 'Find “{d}” on the compass strip and turn until it is in the middle'), { live: 1 }, { route: 1 }],
      did: T2('방위를 보고 {r} 지역까지 찾아갔어요.', 'You found your way to {r} by the compass.'), card: T2('방위와 거리를 함께 말하면 길을 더 정확하게 알려 줄 수 있어요. 예를 들면 「북동쪽으로 600m」처럼요.', 'Direction plus distance gives clear directions — like “600 m north-east”.'), name: T2('🧭 방위 탐험가', '🧭 Compass explorer'), use: ['map:dir8', 'map:north'] },
    9: { kind: 'ride', n: 3, t: T2('탈것 골라 타기', 'Pick a ride'), todo: T2('{list} 한 번씩 타 보기', 'Ride each once: {list}'), how: T2('가까운 곳은 걷고, 먼 곳은 알맞은 탈것을 골라요', 'Walk to nearby places; pick a ride for far ones'),
      hint: [T2('버스는 정류장에서 기다리면 와요', 'Wait at a bus stop for the bus'), T2('지하철은 🚇 입구에서 E를 눌러요', 'Press E at a 🚇 entrance for the subway'), T2('배는 항구나 나루터에서 E를 눌러요', 'Press E at the harbour or ferry dock for the boat')],
      did: T2('탈것을 골라 타고 고장을 다녔어요.', 'You got around town by different rides.'), card: T2('곳에 따라 알맞은 교통수단이 달라요. 바다 건너는 배, 먼 곳은 버스나 지하철을 타요.', 'The right transport depends on where you go — boats across the sea, buses or subways for far places.'), name: T2('🚌 고장 탐험가', '🚌 Town traveller'), use: [] } },
  look: {
    3: { kind: 'dex', n: 3, t: T2('도감 세 칸', 'Three codex entries'), todo: T2('도감에 새 생물 세 칸 채우기', 'Fill three new creature entries in the codex'), how: T2('곤충, 물고기, 별, 갯벌 친구를 찾으면 도감에 적혀요', 'Insects, fish, stars and shore creatures go in the codex'),
      hint: [T2('꽃밭·큰 나무·물가에서 🔍가 뜨면 가까이 가서 E를 눌러요', 'When 🔍 shows near flowers, big trees or water, go close and press E'), T2('도감 빈 칸의 귀띔에 나오는 때와 곳을 봐요', 'The codex hints tell you when and where to look'), T2('낚시로 잡은 물고기와 밤하늘 별자리도 도감에 들어가요', 'Fish you catch and night constellations count too')],
      did: T2('도감에 새 생물 세 칸을 채웠어요.', 'You filled three new codex entries.'), card: T2('생물은 만지기보다 눈으로 보고, 본 곳과 때를 적어 두면 다음에 다시 찾을 수 있어요.', 'Watch creatures instead of touching them, and note where and when — you can find them again.'), name: T2('🔍 꼬마 관찰자', '🔍 Young observer'), use: [] },
    6: { kind: 'dexreg', n: 3, t: T2('사는 곳이 달라요', 'Different homes'), todo: T2('서로 다른 지역 세 곳에서 도감 한 칸씩 채우기', 'Fill one codex entry in each of three different areas'), how: T2('생물은 숲과 물가, 들과 바다에서 서로 다르게 살아요', 'Creatures live differently in forests, waterside, fields and sea'),
      hint: [T2('산에선 숲 곤충, 강가에선 물가 곤충, 바다에선 갯벌 친구를 찾아요', 'Forest insects in the mountains, water insects by the river, shore creatures by the sea'), T2('이미 채운 지역 말고 다른 지역으로 가 봐요', 'Go to an area you haven’t filled yet'), T2('도감 빈 칸 귀띔에 사는 곳이 적혀 있어요', 'The codex hints say where each one lives')],
      did: T2('세 지역에서 서로 다른 생물을 찾았어요.', 'You found creatures in three different areas.'), card: T2('생물마다 살기 알맞은 곳이 달라요. 그곳의 물과 먹이와 온도가 맞아야 살 수 있어요.', 'Each creature needs the right home — the water, food and temperature must suit it.'), name: T2('🌿 생태 관찰자', '🌿 Habitat observer'), use: ['region:env'] },
    9: { kind: 'dexnight', n: 2, t: T2('밤에만 보이는 것', 'Night finds'), todo: T2('밤에 도감 두 칸 채우기', 'Fill two codex entries at night'), how: T2('밤에는 낮과 다른 생물과 별이 나와요', 'Different creatures and stars come out at night'),
      hint: [T2('밤이 되면 트인 곳에서 별을 봐요', 'At night, look at the stars from an open place'), T2('여름밤 물가 풀숲에서 반딧불이를 찾아요', 'Look for fireflies in the waterside grass on summer nights'), T2('저녁까지 기다리면 밤이 와요. 침대에서 자면 아침이 돼요', 'Wait until evening for night — sleeping in a bed skips to morning')],
      did: T2('밤에만 볼 수 있는 것을 도감에 두 칸 채웠어요.', 'You filled two codex entries at night.'), card: T2('반딧불이는 배 끝에서 스스로 빛을 내요. 맑은 물이 흐르는 곳 둘레에 많이 살아요.', 'Fireflies make their own light at the tip of their body. Many live near clean flowing water.'), name: T2('🌙 밤 관찰자', '🌙 Night observer'), use: ['nature:firefly'] } },
  farm: {
    3: { kind: 'harv', n: 2, t: T2('심고 거두기', 'Plant and harvest'), todo: T2('학교 텃밭에서 작물 두 번 거두기', 'Harvest the school garden twice'), how: T2('씨앗을 심고 물을 주며 다 자라면 거둬요', 'Plant, water, and harvest when fully grown'),
      hint: [T2('학교 텃밭의 검은 비닐 두둑에서 E를 눌러요. 씨앗은 공짜예요', 'Press E at the black-mulch beds in the school garden — seeds are free'), T2('날마다 물을 줘요. 비 오는 날은 물을 안 줘도 돼요', 'Water every day — rain does it for you'), T2('겨울엔 텃밭이 쉬어요. 봄·여름·가을에 심어요', 'The garden rests in winter — plant in spring, summer or autumn')],
      did: T2('텃밭에서 두 번 거뒀어요.', 'You harvested the garden twice.'), card: T2('작물마다 다 자라는 데 걸리는 날이 달라요. 심은 날을 기억해 두면 거둘 때를 알 수 있어요.', 'Each crop takes a different number of days — remember when you planted to know when to harvest.'), name: T2('🌱 새싹 농부', '🌱 Sprout farmer'), use: ['nature:seed', 'nature:sun'] },
    6: { kind: 'crops', n: 3, t: T2('여러 가지 기르기', 'Grow a variety'), todo: T2('서로 다른 작물 세 가지 거두기', 'Harvest three different crops'), how: T2('계절마다 심을 수 있는 씨앗이 달라요', 'Each season has different seeds'),
      hint: [T2('텃밭에서 E를 누르면 지금 계절의 씨앗이 나와요', 'Press E at the garden to see this season’s seeds'), T2('계절이 바뀌면 새 씨앗이 생겨요', 'New seeds come with a new season'), T2('한 칸에 하나씩 서로 다른 씨앗을 심어 봐요', 'Plant a different seed in each bed')],
      did: T2('서로 다른 작물 세 가지를 거뒀어요.', 'You harvested three different crops.'), card: T2('계절마다 심기 좋은 작물이 달라요. 봄엔 감자, 가을엔 배추를 많이 심어요.', 'Different crops suit different seasons — potatoes in spring, cabbages in autumn.'), name: T2('🥕 텃밭 농부', '🥕 Garden farmer'), use: [] },
    9: { kind: 'rot', n: 2, t: T2('돌려 심기', 'Crop rotation'), todo: T2('거둔 칸에 다른 작물 이어 심기 두 번', 'Twice, plant a different crop where you just harvested'), how: T2('같은 칸에 같은 작물만 심지 않고 바꿔 심어요', 'Don’t plant the same crop in the same bed — switch'),
      hint: [T2('거둔 칸을 기억해 두었다가 다른 씨앗을 심어요', 'Remember the bed you harvested and plant a different seed'), T2('같은 계절에도 씨앗이 둘 넘게 있으면 바꿔 심을 수 있어요', 'If the season has two or more seeds, you can switch'), T2('계절이 바뀌면 다른 씨앗을 고르기 쉬워요', 'A new season makes switching easy')],
      did: T2('거둔 칸에 다른 작물을 두 번 이어 심었어요.', 'You rotated crops twice.'), card: T2('콩 같은 작물은 뿌리에서 땅을 기름지게 해요. 그래서 돌려 심을 때 자주 써요.', 'Crops like beans enrich the soil through their roots, so they are often used in rotation.'), name: T2('🌾 돌려짓기 농부', '🌾 Rotation farmer'), use: ['nature:rotation'] } },
  cook: {
    3: { kind: 'grp', n: 3, t: T2('골고루 한 상', 'A balanced meal'), todo: T2('곡류, 채소, 고기·생선·달걀이 모두 들어가게 요리하기', 'Cook so grains, vegetables and meat/fish/eggs are all in'), how: T2('음식 무리마다 몸에 하는 일이 달라요', 'Each food group does a different job'),
      hint: [T2('레시피북에서 재료를 봐요. 감자와 밀가루는 곡류예요', 'Check the recipe book — potatoes and flour are grains'), T2('버섯과 배추는 채소, 달걀과 생선은 고기·생선·달걀 무리예요', 'Mushrooms and cabbage are vegetables; eggs and fish are in the meat/fish/egg group'), T2('요리 하나로 모자라면 둘을 만들어도 돼요', 'Two dishes together are fine')],
      did: T2('세 무리가 모두 들어가게 요리했어요.', 'Your cooking covered all three groups.'), card: T2('곡류는 힘을 내고, 고기·생선·달걀은 몸을 만들고, 채소는 몸이 잘 돌아가게 도와요.', 'Grains give energy, meat/fish/eggs build the body, and vegetables keep it running well.'), name: T2('🍳 골고루 요리사', '🍳 Balanced cook'), use: ['life:balance'] },
    6: { kind: 'sharedish', n: 2, t: T2('나눠 먹기', 'Share a dish'), todo: T2('만든 음식을 이웃 두 사람에게 나눠 주기', 'Share dishes you cooked with two neighbours'), how: T2('음식을 나눌 땐 사람 곁에 다가가 건네요', 'Walk up close to share food'),
      hint: [T2('가방(I)에서 음식을 고르고 이웃 곁(4m 안)에서 나눠요', 'Pick the dish in your bag (I) and share within 4 m of someone'), T2('요리는 아이 집 부엌에서 해요', 'Cook in a home kitchen'), T2('서로 다른 두 사람에게 나눠요', 'Share with two different people')],
      did: T2('만든 음식을 두 사람과 나눴어요.', 'You shared your cooking with two people.'), card: T2('음식을 나눌 땐 덜어 먹을 그릇과 숟가락을 따로 쓰면 깨끗해요.', 'When sharing food, use a separate bowl and spoon to serve — it keeps things clean.'), name: T2('🍲 나눔 요리사', '🍲 Sharing cook'), use: ['life:share'] },
    9: { kind: 'newdish', n: 2, t: T2('새 요리 두 가지', 'Two new dishes'), todo: T2('처음 만드는 요리 두 가지 만들기', 'Cook two dishes you have never made'), how: T2('요리법은 재료와 양을 알려 줘요', 'A recipe tells you the ingredients and amounts'),
      hint: [T2('레시피북에서 아직 안 만든 요리를 찾아요', 'Find a recipe you haven’t made yet'), T2('꾸러미를 채우면 새 요리법이 생겨요', 'Filling bundles unlocks new recipes'), T2('재료가 모자라면 마트·일터·텃밭에서 구해요', 'Get missing ingredients at a mart, a workplace or the garden')],
      did: T2('처음 만드는 요리 두 가지를 해냈어요.', 'You cooked two new dishes.'), card: T2('요리법을 차례대로 따라 하면 처음 하는 요리도 맛을 고르게 낼 수 있어요.', 'Following a recipe step by step helps even a new dish turn out well.'), name: T2('📖 요리법 요리사', '📖 Recipe cook'), use: [] } },
  trade: {
    3: { kind: 'cheap', n: 1, t: T2('값 견주고 사기', 'Compare, then buy'), todo: T2('편의점과 마트 값을 보고 더 싼 곳에서 사기', 'Check prices at the convenience store and the mart, then buy where it’s cheaper'), how: T2('같은 물건도 가게마다 값이 달라요', 'The same thing can cost different amounts in different shops'),
      hint: [T2('편의점과 마트에 한 번씩 들어가 같은 물건 값을 봐요', 'Go into both shops and look at the same item'), T2('달걀·우유·밀가루는 두 가게에 다 있어요', 'Eggs, milk and flour are sold in both'), T2('두 값을 견주고 더 싼 가게로 돌아가서 사요', 'Compare the two prices and buy at the cheaper shop')],
      did: T2('두 가게 값을 견주고 더 싼 곳에서 샀어요.', 'You compared prices and bought at the cheaper shop.'), card: T2('편의점은 가깝고 늦게까지 열지만 값이 조금 비쌀 때가 많아요. 쓰임에 맞게 골라요.', 'Convenience stores are close and open late, but often cost a little more — choose what fits.'), name: T2('🛒 알뜰 장보기', '🛒 Smart shopper'), use: ['life:compare', 'life:needs'] },
    6: { kind: 'away', n: 2, t: T2('멀리서 온 물건', 'Goods from afar'), todo: T2('다른 지역에서 얻은 물건을 장터에서 두 번 팔기', 'Twice, sell something from another area at a market'), how: T2('우리 고장에 없는 물건은 다른 고장과 주고받아요', 'What one area lacks, it trades for with another'),
      hint: [T2('산·바다·들 같은 다른 지역에서 얻은 것을 가져와요', 'Bring things from another area — mountains, sea or fields'), T2('장터에서 팔 때 멀리서 온 물건 표시를 봐요', 'Look for the “from afar” mark when selling'), T2('물건이 난 곳과 다른 지역의 장터로 가요', 'Sell at a market in a different area from where it came')],
      did: T2('다른 지역에서 난 물건을 장터에서 두 번 팔았어요.', 'You sold goods from another area twice.'), card: T2('고장끼리 남는 것과 모자란 것을 주고받는 것을 교류라고 해요.', 'Areas trading what they have extra and what they lack is called exchange.'), name: T2('🚚 교류 상인', '🚚 Trader'), use: ['region:trade'] },
    9: { kind: 'likegift', n: 2, t: T2('좋아하는 선물', 'A welcome gift'), todo: T2('이웃 두 사람에게 좋아하는 것을 선물하기', 'Give two neighbours something they like'), how: T2('받는 사람의 일과 생활을 떠올려 골라요', 'Think about the person’s work and life'),
      hint: [T2('일꾼은 사는 곳에 따라 반가워하는 것이 달라요', 'Workers in the fields, mountains and sea like different things'), T2('바다 일꾼은 과일·꿀처럼 바다에서 안 나는 것을 반가워해요', 'Sea workers like things the sea doesn’t give, like fruit or honey'), T2('들 일꾼은 생선·소금처럼 들에서 안 나는 것을 반가워해요', 'Field workers like things the fields don’t give, like fish or salt')],
      did: T2('두 이웃에게 반가운 선물을 했어요.', 'You gave two neighbours gifts they liked.'), card: T2('선물은 값보다 받는 사람에게 쓸모 있는지가 더 중요해요.', 'A gift matters more for being useful to the person than for its price.'), name: T2('🎁 마음 선물꾼', '🎁 Thoughtful giver'), use: [] } },
  work: {
    3: { kind: 'season', n: 2, t: T2('제철 일 돕기', 'Seasonal work'), todo: T2('지금 제철인 일터 두 곳에서 거들기', 'Help at two workplaces that are in season now'), how: T2('계절마다 바쁜 일이 달라요', 'Different jobs get busy in different seasons'),
      hint: [T2('일꾼 이름표 옆 🌟 제철 표시를 찾아요', 'Look for the 🌟 in-season mark next to a worker'), T2('날씨 칩을 누르면 달력에서 지금 계절을 봐요', 'Tap the weather chip to see the season on the calendar'), T2('F(찾기)로 일터를 찾을 수 있어요', 'Use F (find) to look up workplaces')],
      did: T2('제철 일터 두 곳에서 거들었어요.', 'You helped at two in-season workplaces.'), card: T2('봄에는 모내기, 가을에는 벼 베기처럼 계절마다 바쁜 일이 달라요.', 'Like planting rice in spring and harvesting in autumn, busy jobs change with the season.'), name: T2('🌾 제철 일꾼', '🌾 Seasonal helper'), use: ['region:rice'] },
    6: { kind: 'wreg', n: 3, t: T2('지역마다 다른 일', 'Work across areas'), todo: T2('서로 다른 지역 세 곳의 일터에서 거들기', 'Help at workplaces in three different areas'), how: T2('자연환경에 따라 하는 일이 달라요', 'The work people do depends on nature around them'),
      hint: [T2('바다·들·산에는 서로 다른 일터가 있어요', 'The sea, fields and mountains each have their own workplaces'), T2('이미 거든 지역 말고 다른 지역으로 가요', 'Go to an area you haven’t helped in yet'), T2('버스나 지하철을 타면 먼 지역도 금방 가요', 'Buses and the subway get you to far areas quickly')],
      did: T2('세 지역의 일터에서 거들었어요.', 'You helped in three different areas.'), card: T2('바다에선 고기잡이와 소금, 들에선 농사, 산에선 버섯과 나무 기르기처럼 자연에 따라 하는 일이 달라요.', 'Fishing and salt by the sea, farming in the fields, mushrooms and trees in the mountains — work follows nature.'), name: T2('⛰ 고장 일꾼', '⛰ Area helper'), use: ['region:env'] },
    9: { kind: 'made', n: 2, t: T2('만든 것을 장터로', 'From work to market'), todo: T2('거든 일터에서 얻은 것을 장터에서 두 번 팔기', 'Twice, sell at a market what you got from helping at work'), how: T2('만드는 사람과 쓰는 사람이 장터에서 만나요', 'Makers and users meet at the market'),
      hint: [T2('일터에서 거들면 그 일터에서 나는 것을 받아요', 'Helping at a workplace gives you what it makes'), T2('받은 것을 들고 장터(🛒)로 가서 팔아요', 'Take it to a market (🛒) and sell it'), T2('미션을 시작한 뒤에 거든 일터의 물건만 세요', 'Only goods from work you helped after starting count')],
      did: T2('거들어서 얻은 것을 장터에서 두 번 팔았어요.', 'You sold what you made at the market twice.'), card: T2('만드는 일(생산)과 쓰는 일(소비)이 이어져서 물건이 돌아요.', 'Making (production) and using (consumption) link up so goods keep moving.'), name: T2('🤝 장터 일꾼', '🤝 Market helper'), use: ['region:jang'] } },
};
const MI = (k, lv) => (MISSIONS[k] || {})[lv];
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (m, q) => (o[q] != null ? o[q] : m));

// 자전거 꾸미기 상태 → { c: 색 | null, f: 깃발 갈래 | null, gold, icon }
export function bikeLook(S) { const R = S && S.rank; if (!R || !R.bike) return { c: null, f: null, gold: false, icon: '' }; const c = R.bike.c && RCOL[R.bike.c] ? RCOL[R.bike.c][0] : null, f = R.bike.f || null;
  return { c, f, gold: !!(f && R.done && R.done[f + ':9']), icon: f ? SKI[f] : '', fc: f && RCOL[f] ? RCOL[f][0] : 0 }; }
// 자전거 뼈대 색·깃발(마을 자전거 makeBike가 부름 · 바꿀 때 한 번만 칠함 · 깃발 = 기둥 + 천 두 메시(자전거 탈 때만 보임))
export function bikeDeco(T3, M, grp, base, keep) {
  let idx = null, F = null, cv = null, tex = null, cur = '';
  const c9 = new T3.Color();
  function color(hex) { const C = M.geometry.attributes.color; if (!idx) { idx = []; c9.setHex(base); for (let i = 0; i < C.count; i++) if (Math.abs(C.getX(i) - c9.r) + Math.abs(C.getY(i) - c9.g) + Math.abs(C.getZ(i) - c9.b) < 0.004) idx.push(i); }
    c9.setHex(hex == null ? base : hex); for (const i of idx) C.setXYZ(i, c9.r, c9.g, c9.b); C.needsUpdate = true; }
  function flag(o) { if (!o.f) { if (F) F.visible = false; return; }
    if (!F) { cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; tex = new T3.CanvasTexture(cv); tex.colorSpace = T3.SRGBColorSpace;
      const pm = new T3.MeshLambertMaterial({ color: 0xd8d8d2 }), fm = new T3.MeshLambertMaterial({ map: tex, side: T3.DoubleSide }), pg = new T3.CylinderGeometry(0.012, 0.012, 1.5, 6).translate(0, 0.75, 0), fg = new T3.PlaneGeometry(0.36, 0.27).translate(0.18, 0, 0).rotateY(Math.PI / 2 + 0.7).translate(0, 1.36, 0);
      keep(pm); keep(fm); keep(pg); keep(fg); F = new T3.Group(); F.add(new T3.Mesh(pg, pm), new T3.Mesh(fg, fm)); F.position.set(0.06, 0.25, -0.47); grp.add(F); }   /* 기둥 밑동 = 뒷바퀴 축 옆(뜬 부재 X) · 천 = 머리 위 높이에서 뒤로 비스듬히(뒤 카메라에서 보이고 아이를 덜 가림) */
    const g = cv.getContext('2d'); g.clearRect(0, 0, 128, 96); g.fillStyle = '#' + (o.fc || 0x888888).toString(16).padStart(6, '0'); g.fillRect(0, 0, 128, 96); g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.arc(64, 48, 32, 0, Math.PI * 2); g.fill();
    g.font = '40px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.icon || '', 64, 51);
    if (o.gold) { g.fillStyle = '#f2c230'; g.strokeStyle = '#7a5a10'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; g.lineTo(108 + Math.cos(a) * r, 20 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
    tex.needsUpdate = true; F.visible = true; }
  return { set(o) { o = o || {}; const key = [o.c, o.f, o.gold].join(':'); if (key === cur) return; cur = key; color(o.c); flag(o); }, dispose() { if (tex) tex.dispose(); } };
}

// 마을 쪽이 넘기는 것(api): GAME · esc · en() · level(k) · skillName(k, en) · openP · closeP · toast · banner · sfx · task() · me() · region(x, z) · places() · route(p) · routeOff()
//   hasSub() · hasBus() · hasBoat() · hasFarm() · shopKinds() · price(kind, e) · likes(k) · product(k) · inSeason(k) · recipes() · night() · skUp(k, n) · skills() · bike(o) · learn(ids)
export function createRank(api) {
  const { GAME, esc } = api, en = () => api.en(), L = a => (Array.isArray(a) ? a[en() ? 1 : 0] : a || '');
  const S = () => GAME.S.rank || (GAME.S.rank = { cur: null, done: {}, title: '', bike: { c: '', f: '' } }), C = () => S().cur, save = () => GAME.mark();
  const tierOf = k => RANK_LV.find(t => api.level(k) >= t && !S().done[k + ':' + t]) || null;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const dirK = (from, to) => Math.round(((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180 / Math.PI + 360) % 360) / 45) % 8;   /* 지도 위 = 북(−z) */
  const regN = r => (en() ? REGN[r] || r : r);
  let DX = null, FP = null, hintT = 0;   // 메모리만: 도감 열쇠 모음(새로 생긴 칸 찾기) · 텃밭 앞 상태(돌려 심기)
  const natKeys = () => Object.keys(GAME.S.dex || {}).filter(q => NATURE.test(q));
  function rides() { return [['bus', api.hasBus(), T2('버스', 'bus')], ['sub', api.hasSub(), T2('지하철', 'subway')], ['boat', api.hasBoat(), T2('배', 'boat')]].filter(q => q[1]); }
  // 이 마을에서 할 수 있나(못 하면 카드에 까닭 한 줄 · 막지 않음)
  function can(k, lv) { const m = MI(k, lv); if (!m) return false;
    if (m.kind === 'stn') return api.hasSub() || api.hasBus(); if (m.kind === 'ride') return rides().length >= 2; if (['harv', 'crops', 'rot'].includes(m.kind)) return api.hasFarm();
    if (m.kind === 'cheap') { const K = api.shopKinds(); return K.has('conv') && K.has('grocery'); } if (m.kind === 'dir') return !!pickDir(); return true; }
  function pickDir() { const me = api.me(), r0 = api.region(me.x, me.z), P = api.places().map(p => ({ ...p, r: api.region(p.x, p.z), d: dist(p, me) })).filter(p => p.r && p.r !== '?' && p.r !== r0 && p.d > 250);
    if (!P.length) return null; P.sort((a, b) => Math.abs(a.d - 650) - Math.abs(b.d - 650)); const p = P[(GAME.S.day * 7) % Math.min(3, P.length)]; return { r: p.r, name: p.name, x: +p.x.toFixed(1), z: +p.z.toFixed(1), k: dirK(me, p), d: Math.max(100, Math.round(p.d / 100) * 100) }; }
  function init(k, lv) { const m = MI(k, lv), v = { s: [], c: 0, h: 0 };
    if (m.kind === 'stn' && !api.hasSub()) v.alt = 'bus';
    if (m.kind === 'dir') v.T = pickDir();
    if (m.kind === 'ride') v.need = rides().map(q => q[0]);
    if (m.kind === 'newdish') v.c0 = Object.keys(GAME.S.cooked || {});
    if (m.kind === 'cheap') v.seen = {};
    if (m.kind === 'rot') v.last = {};
    if (m.kind === 'made') v.m = [];
    return v; }
  // ── 진행 ──
  const mis = () => { const c = C(); return c ? MI(c.k, c.lv) : null; };
  function count() { const c = C(), m = mis(); if (!c || !m) return [0, 1]; const v = c.v;
    if (m.kind === 'stn') return [v.alt ? v.c : v.s.length, m.n]; if (m.kind === 'ride') return [v.s.length, v.need.length]; if (m.kind === 'dir') return [v.c, 1];
    if (['harv', 'away', 'rot', 'made', 'cheap'].includes(m.kind)) return [v.c, m.n]; return [v.s.length, m.n]; }
  function todo() { const c = C(), m = mis(); if (!m) return ''; const v = c.v; let t = L(m.todo);
    if (m.kind === 'stn' && v.alt) t = en() ? 'Ride the bus and get off at two stops' : '버스를 타고 정류장 두 곳에서 내리기';
    if (m.kind === 'dir' && v.T) t = fill(t, { d: L(DIR8[v.T.k]), r: regN(v.T.r) });
    if (m.kind === 'ride') t = fill(t, { list: rides().filter(q => v.need.includes(q[0])).map(q => L(q[2])).join(en() ? ', ' : '·') });
    return t; }
  function detail() { const c = C(), m = mis(); if (!m) return ''; const v = c.v, e = en(), [a, n] = count();
    if (m.kind === 'grp') return ['grain', 'veg', 'pro'].map(g => (v.s.includes(g) ? '✔ ' : '') + L(FGN[g])).join(e ? ', ' : ' · ');
    if (m.kind === 'ride') return rides().filter(q => v.need.includes(q[0])).map(q => (v.s.includes(q[0]) ? '✔ ' : '') + L(q[2])).join(e ? ', ' : ' · ');
    if (m.kind === 'cheap') return ['conv', 'grocery'].map(q => (v.seen[q] ? '✔ ' : '') + L(KINDN[q])).join(e ? ', ' : ' · ') + (e ? ' — then buy' : ' → 사기');
    if (m.kind === 'dir') return v.T ? (e ? 'About ' + v.T.d + ' m from where you started' : '시작한 곳에서 ' + v.T.d + 'm쯤') : '';
    return a + '/' + n; }
  function step() { const c = C(); if (!c) return; api.sfx('tick'); save(); const [a, n] = count(); if (a >= n) { finish(); return; } api.toast('🏅 ' + todo() + ' (' + a + '/' + n + ')', 2.4); api.task(); }
  // 이벤트: 마을 TEV('T:'+이름) · 이야기 이벤트(work·sell·buy·cook·gift·share·harvest·enter·bus) · 지하철 내림('stn')
  function ev(t, d) { const c = C(), m = mis(); if (!m) return; const v = c.v; d = d || {}; const add = q => { if (v.s.includes(q)) return false; v.s.push(q); return true; };
    switch (m.kind) {
      case 'stn': if (!v.alt && t === 'stn' && add(d.k)) step(); if (v.alt && t === 'T:bus') { v.c++; step(); } break;
      case 'ride': { const q = t === 'T:bus' || t === 'bus' ? 'bus' : t === 'stn' ? 'sub' : t === 'T:boat' ? 'boat' : null; if (q && v.need.includes(q) && add(q)) step(); break; }
      case 'harv': if (t === 'harvest') { v.c++; step(); } break;
      case 'crops': if (t === 'harvest' && d.e && add(d.e)) step(); break;
      case 'grp': if (t === 'cook' && d.e && d.e !== '🌑') { const R = api.recipes().find(r => r[0] === d.e); let up = false; if (R) for (const q of Object.keys(R[3])) if (FGRP[q] && add(FGRP[q])) up = true; if (up) step(); } break;
      case 'newdish': if (t === 'cook' && d.e && d.e !== '🌑' && !v.c0.includes(d.e) && add(d.e)) step(); break;
      case 'sharedish': if (t === 'share' && d.e && api.recipes().some(r => r[0] === d.e)) { if (add(d.w && d.w.k ? d.w.k + ':' + (d.w.cell || '') : 'x' + v.s.length)) step(); } break;
      case 'cheap': if (t === 'enter' && KINDN[d.kind]) { if (!v.seen[d.kind]) { v.seen[d.kind] = 1; save(); api.task(); } }
        if (t === 'buy' && KINDN[d.kind]) { const o = d.kind === 'conv' ? 'grocery' : 'conv', p1 = api.price(d.kind, d.e), p2 = api.price(o, d.e);
          if (p2 == null || p1 == null) { api.toast('🤔 ' + (en() ? 'That isn’t sold in both shops — compare something both sell' : '그 물건은 두 가게에 다 있지 않아요. 둘 다 파는 것으로 견줘 봐요'), 3.4); break; }
          if (!v.seen[o]) { api.toast('🤔 ' + (en() ? 'Check the price at ' + L(KINDN[o]) + ' first' : L(KINDN[o]) + ' 값을 아직 안 봤어요. 먼저 들어가 봐요'), 3.4); break; }
          if (p1 <= p2) { v.c = 1; step(); } else api.toast('🤔 ' + d.e + ' ' + (en() ? L(KINDN[d.kind]) + ' ' + p1 + ' won, ' + L(KINDN[o]) + ' ' + p2 + ' won. Next time buy at the cheaper one' : L(KINDN[d.kind]) + ' ' + p1 + '원, ' + L(KINDN[o]) + ' ' + p2 + '원이에요. 다음엔 더 싼 곳에서 사 봐요'), 4); }
        break;
      case 'away': if (t === 'sell' && d.away) { v.c++; step(); } break;
      case 'likegift': if (t === 'gift' && d.w && d.w.k) { const k9 = d.w.k + ':' + (d.w.cell || ''); if ((api.likes(d.w.k) || []).includes(d.e)) { if (add(k9)) step(); } else api.toast('🤔 ' + (en() ? 'Kindly received — but this worker would be gladder with something else. Think about their work' : '고맙게 받았지만 더 반가워할 것이 있어요. 그 사람이 하는 일을 떠올려 봐요'), 3.4); } break;
      case 'season': if (t === 'work' && d.k && api.inSeason(d.k)) { if (add(d.k)) step(); } else if (t === 'work' && d.k && !hintT) { hintT = 1; api.toast('🤔 ' + (en() ? 'That work isn’t in season now — look for the 🌟 mark' : '그 일은 지금 제철이 아니에요. 🌟 표시를 찾아봐요'), 3); } break;
      case 'wreg': if (t === 'work' && d.x != null) { const r = api.region(d.x, d.z); if (r && r !== '?' && add(r)) step(); } break;
      case 'made': if (t === 'work' && d.k) { const p = api.product(d.k); if (p && !v.m.includes(p)) { v.m.push(p); save(); } } if (t === 'sell' && d.e && v.m.includes(d.e)) { v.c++; step(); } break;
    } }
  // 1초마다(창·대화·놀이·잠이 아닐 때): 도감 새 칸 · 도착 · 텃밭 이어 심기
  function tick() { const c = C(), m = mis(); if (!m) return; const v = c.v;
    if (m.kind === 'dex' || m.kind === 'dexreg' || m.kind === 'dexnight') { const K = natKeys(); if (!DX) { DX = new Set(K); return; } if (K.length === DX.size) return; const me = api.me(), n0 = v.s.length;
      for (const q of K) if (!DX.has(q)) { DX.add(q); if (m.kind === 'dex') { if (!v.s.includes(q)) v.s.push(q); } else if (m.kind === 'dexreg') { const r = api.region(me.x, me.z); if (r && r !== '?' && !v.s.includes(r)) v.s.push(r); } else if (api.night() && !v.s.includes(q)) v.s.push(q); }
      if (v.s.length > n0) step(); else if (m.kind === 'dexnight' && !api.night()) api.toast('🤔 ' + (en() ? 'That was in the daytime — this one counts only at night' : '낮에 찾은 것이에요. 이 미션은 밤에 찾은 것만 세요'), 3); return; }
    if (m.kind === 'dir' && v.T) { const me = api.me(); if (api.region(me.x, me.z) === v.T.r) { v.c = 1; api.routeOff(); step(); return; } c.t9 = (c.t9 || 0) + 1; if ((c.t9 === 60 || c.t9 === 120) && v.h < 3) { v.h++; api.toast('💡 ' + hintText(v.h), 4); api.task(); } return; }
    if (m.kind === 'rot') { const F = (GAME.S.farm || []).map(p => (p && p.c) || ''); if (!FP) { FP = F; return; } let up = false;
      for (let i = 0; i < F.length; i++) { const a = FP[i] || '', b = F[i]; if (a && !b) v.last[i] = a; else if (b && b !== a && v.last[i]) { if (v.last[i] !== b) { v.c++; up = true; } else api.toast('🤔 ' + (en() ? 'Same crop again in that bed — try a different one' : '같은 칸에 또 ' + b + '을(를) 심었어요. 다른 작물로 바꿔 봐요'), 3); delete v.last[i]; } }
      FP = F; if (up) step(); } }
  function hintText(i) { const c = C(), m = mis(); if (!m) return ''; const h = m.hint[i - 1], v = c.v; if (!h) return '';
    if (h.live && v.T) { const me = api.me(), p = v.T, k = dirK(me, p), d = Math.max(50, Math.round(dist(me, p) / 50) * 50); return en() ? 'From here it’s ' + L(DIR8[k]) + ', about ' + d + ' m' : '지금 자리에서는 ' + L(DIR8[k]) + '쪽으로 ' + d + 'm쯤이에요'; }
    if (h.route && v.T) { api.route({ icon: '🏅', name: v.T.name, door: [v.T.x, v.T.z], arrive: '🏅 ' + v.T.name }); return en() ? 'Red line on to ' + v.T.name : v.T.name + '까지 빨간 선을 켰어요'; }
    return fill(L(h), { d: v.T ? L(DIR8[v.T.k]) : '' }); }
  // ── 시작·끝 ──
  function start(k) { const lv = tierOf(k); if (!lv) return false; const c0 = C(); if (c0 && c0.k === k && c0.lv === lv) { c0.off = false; save(); api.task(); open(); return true; }
    if (!can(k, lv)) { api.toast(en() ? 'This mission can’t be done in this town yet' : '이 마을에서는 아직 할 수 없는 미션이에요', 3); return false; }
    S().cur = { k, lv, v: init(k, lv), off: false }; DX = null; FP = null; hintT = 0; save(); if (api.rec) api.rec('rank', { k, L: lv, s: 'start' }); api.task(); open(); return true; }   /* REC-0 학급 기록 */
  function finish() { const c = C(); if (!c) return; const m = mis(), R = S(), k = c.k, lv = c.lv, v = c.v, first = !RANK_LV.some(t => R.done[k + ':' + t]);
    R.done[k + ':' + lv] = GAME.S.day; R.cur = null; if (!R.title) R.title = k + ':' + lv; save(); if (api.rec) api.rec('rank', { k, L: lv, s: 'done', h: v.h, done: 1 }); api.routeOff(); api.skUp(k, 4); api.learn(m.use || []); api.sfx('done'); api.task();
    const e = en(), did = fill(L(m.did), { r: v.T ? regN(v.T.r) : '' }), gain = [];
    gain.push(['🏷', e ? 'New title “' + L(m.name) + '”. Pick it in Skills.' : '칭호 「' + L(m.name) + '」가 생겼어요. 솜씨 창에서 고를 수 있어요.']);
    if (first) gain.push(['🚲', e ? 'A ' + L(RCOL[k][1]).toLowerCase() + ' bike colour is unlocked.' : '자전거 ' + L(RCOL[k][1]) + '이 생겼어요.']);
    if (lv === 6) gain.push(['🚩', e ? 'A bike flag with ' + SKI[k] + ' is unlocked.' : SKI[k] + ' 자전거 깃발이 생겼어요.']); if (lv === 9) gain.push(['⭐', e ? 'Your ' + SKI[k] + ' flag gets a gold star.' : SKI[k] + ' 깃발에 금별이 붙었어요.']);
    const h = '<h3>🏅 ' + esc(api.skillName(k, e)) + ' ' + lv + (e ? ' — badge' : '레벨 배지') + '</h3><div class="sm">' + esc(did) + '</div>' + gain.map(g => '<div class="st"><b class="n">' + g[0] + '</b><span>' + esc(g[1]) + '</span></div>').join('')
      + '<div class="st"><b class="n">📚</b><span>' + esc(L(m.card)) + '</span></div><div class="row"><button data-a="deco">' + (e ? 'Put it on my bike' : '자전거에 달기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = api.openP(h, false, 'rank');   /* 배너 X — 창 제목을 가림(캡처 10-17) */
    P9.onclick = ev9 => { const b = ev9.target.closest('button'); if (!b) return; if (b.dataset.a === 'deco') { R.bike.c = k; if (lv >= 6) R.bike.f = k; R.title = k + ':' + lv; save(); api.bike(bikeLook(GAME.S)); api.toast('🚲 ' + (e ? 'Done — press B to ride and see' : '달았어요. B로 자전거를 타 보세요'), 2.6); } api.closeP(); }; }
  function open() { const c = C(), m = mis(); if (!m) return; const e = en(), v = c.v;
    let h = '<h3>🏅 ' + esc(api.skillName(c.k, e)) + ' ' + c.lv + (e ? ' mission — ' : '레벨 미션 — ') + esc(L(m.t)) + '</h3><div class="sm">' + esc(L(m.how)) + '</div>'
      + '<div class="st"><b class="n">' + SKI[c.k] + '</b><span><b>' + esc(todo()) + '</b><div class="sm">' + esc(detail()) + '</div></span></div>';
    for (let i = 1; i <= v.h; i++) { const t = hintText(i); if (t) h += '<div class="st"><b class="n">💡</b><span>' + esc(t) + '</span></div>'; }
    h += '<div class="sm">' + esc(e ? 'Finish it for a badge, the title “' + L(m.name) + '” and a bike decoration.' : '끝내면 배지와 칭호 「' + L(m.name) + '」를 받아요. 자전거 꾸미기도 생겨요.') + '</div>';
    h += '<div class="row">' + (v.h < 3 ? '<button class="sub" data-a="hint">💡 ' + (e ? 'Hint' : '힌트') + '</button>' : '') + '<button class="sub" data-a="off">' + (c.off ? (e ? 'Show on task line' : '할 일 줄에 다시') : (e ? 'Hide from task line' : '할 일 줄에서 내리기')) + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = api.openP(h, false, 'rank'); P9.onclick = ev9 => { const b = ev9.target.closest('button'); if (!b) return; const a9 = b.dataset.a;
      if (a9 === 'hint') { v.h++; save(); const t = hintText(v.h); if (t) api.toast('💡 ' + t, 4); open(); api.task(); return; }
      if (a9 === 'off') { c.off = !c.off; save(); api.task(); open(); return; } api.closeP(); }; }
  // ── 솜씨 창 조각 ──
  function badge(k) { const R = S(), got = RANK_LV.filter(t => R.done[k + ':' + t]); return got.length ? '<br><small>🏅 ' + esc(en() ? 'Badges: level ' + got.join(', ') : '받은 배지: ' + got.map(t => t + '레벨').join(', ')) + '</small>' : ''; }
  function box(k) { const e = en(), lv = tierOf(k), c = C();
    if (!lv) { const nx = RANK_LV.find(t => !S().done[k + ':' + t]); return nx ? '<div class="sm">🏅 ' + esc(e ? 'A mission opens at level ' + nx + '.' : nx + '레벨이 되면 승급 미션이 열려요.') + '</div>' : ''; }
    const m = MI(k, lv), run = c && c.k === k && c.lv === lv, busy = c && !run, ok = run || can(k, lv);
    return '<div class="st"><b class="n">🏅</b><span style="flex:1"><b>' + esc(e ? 'Level ' + lv + ' mission — ' + L(m.t) : lv + '레벨 미션 — ' + L(m.t)) + '</b><div class="sm">' + esc(run ? todo() + ' (' + count().join('/') + ')' : busy ? (e ? 'Finish your current mission first.' : '하던 미션을 먼저 끝내요.') : ok ? L(m.todo).replace(/\{\w+\}/g, '…') : (e ? 'Can’t be done in this town yet.' : '이 마을에서는 아직 할 수 없어요.')) + '</div></span>'
      + (busy || !ok ? '' : '<button data-rk="' + k + '">' + (run ? (e ? 'Open' : '열기') : (e ? 'Start' : '시작')) + '</button>') + '</div>'; }
  function decoHTML(baseTitle) { const R = S(), e = en(), D = Object.keys(R.done).filter(q => MISSIONS[q.split(':')[0]]); if (!D.length) return '<div class="sm">🎨 ' + esc(e ? 'Finish a mission to get titles and bike decorations.' : '승급 미션을 끝내면 칭호와 자전거 꾸미기가 생겨요.') + '</div>';
    const sk = [...new Set(D.map(q => q.split(':')[0]))], fl = sk.filter(k => R.done[k + ':6']), btn = (a, val, on, t) => '<button class="' + (on ? '' : 'sub') + '" data-' + a + '="' + val + '">' + (on ? '✔ ' : '') + esc(t) + '</button>';
    return '<div class="grp">🎨 ' + (e ? 'My look' : '꾸미기') + '</div>'
      + '<div class="sm">' + (e ? 'Title' : '칭호') + '</div><div class="row" style="flex-wrap:wrap;justify-content:flex-start">' + btn('rt', '-', !R.title || R.title === '-', baseTitle) + D.map(q => { const [k, lv] = q.split(':'); return btn('rt', q, R.title === q, L(MI(k, +lv).name)); }).join('') + '</div>'
      + '<div class="sm">' + (e ? 'Bike colour' : '자전거 색') + '</div><div class="row" style="flex-wrap:wrap;justify-content:flex-start">' + btn('rc', '-', !R.bike.c, e ? 'Blue' : '파랑') + sk.map(k => btn('rc', k, R.bike.c === k, L(RCOL[k][1]))).join('') + '</div>'
      + (fl.length ? '<div class="sm">' + (e ? 'Bike flag' : '자전거 깃발') + '</div><div class="row" style="flex-wrap:wrap;justify-content:flex-start">' + btn('rf', '-', !R.bike.f, e ? 'None' : '없음') + fl.map(k => btn('rf', k, R.bike.f === k, SKI[k] + (R.done[k + ':9'] ? ' ⭐' : ''))).join('') + '</div>' : ''); }
  function setDeco(a, val) { const R = S(); if (a === 'rt') R.title = val === '-' ? '-' : val; if (a === 'rc') R.bike.c = val === '-' ? '' : val; if (a === 'rf') R.bike.f = val === '-' ? '' : val; save(); if (a !== 'rt') api.bike(bikeLook(GAME.S)); }
  function title() { const R = S(); if (!R.title || R.title === '-') return null; const [k, lv] = R.title.split(':'), m = MI(k, +lv); return m && R.done[R.title] ? m.name : null; }
  return { start: k => { const c = C(); if (c && c.k === k && c.lv === tierOf(k)) { c.off = false; save(); api.task(); open(); return true; } return start(k); }, open, tick, ev, todo: () => { const [a, n] = count(); return todo() + ' (' + a + '/' + n + ')' + (C() && C().v.h ? ' 💡' : ''); }, badge, box, decoHTML, setDeco, title, tier: tierOf,
    get on() { const c = C(); return !!(c && !c.off); }, get cur() { const c = C(); return c ? { k: c.k, lv: c.lv, v: c.v, n: count() } : null; }, done: () => ({ ...S().done }), can };
}
