// 📖 우리 마을 이야기(STORY-1 · 교사 10-17 '메인 스토리를 도입해 보고 싶어 · 내년 거 연습 · 생활적인 것 · 교육적인 뭔가'): 장(章) 자료 + 작은 실행기
//   꼴 = 또래 '퀘스트 틀 명세(초안)'와 같은 결 — 장 = { id, steps[{ id, todo, do:{type,…}, hint:[1, 2, 3(show:)], judge }], gets } · 판정은 규칙으로만 · 생각 칸(한 줄)은 판정 X(일기에 모음)
//   힌트 세 단계 = 40·80·120초(또는 틀린 수 1·2·3) · 셋째 = 보여 주기(show:path 길 · show:ans 답) · 길 안내는 처음부터가 아니라 막힐 때(교사 '퀘스트 왜 이렇게 쉬워')
//   이웃 = 이름 없는 일꾼 역할만(실명 아이 X · 아이 집은 부엌으로만 씀) · 사실은 생활 상식 수준만(지어낸 행사·역사 X) · 벌 X(틀리면 이웃 반응 → 다시 생각) · 언제든 쉬고 자유 놀이로
//   slot = 답 칸 갈래(명세 3장: choose 고르기 · word 낱말(수 포함) · line 한 줄 — 2027 학급 기록이 이 갈래로 모음) · judge: 'none' = 판정 없음(힌트는 1·2단계만 · 보여 주기 X)
//   진행 = 이 기기에만(GAME.S.story · 단계가 끝날 때만 저장) · 매 프레임 일 X(1초 tick · 이벤트로 판정)
export const STORY_V = 1;
const WHO = { shiitake: ['표고 농장 일꾼', 'the shiitake farmer'], cabbage: ['배추밭 일꾼', 'the cabbage farmer'], potato: ['감자밭 일꾼', 'the potato farmer'], lumber: ['숲 가꾸는 일꾼', 'the forester'], beehive: ['양봉 일꾼', 'the beekeeper'], pasture: ['목장 일꾼', 'the rancher'], saltpan: ['염전 일꾼', 'the salt worker'], paddy: ['논 일꾼', 'the rice farmer'], strawberry: ['딸기 농장 일꾼', 'the strawberry farmer'], pear: ['배 과수원 일꾼', 'the pear grower'], fisher: ['부두 어부', 'the fisher'], clam: ['갯벌 일꾼', 'the clam digger'] };
const T2 = (ko, en) => [ko, en];
// ── 장 자료 ── sea = 어울리는 계절(그때 '추천' 표시 · 다른 계절에도 할 수 있음) · giver = 쪽지를 보내는 일꾼 갈래(이 마을에 있는 것 가운데 가장 가까운) · need = 이 마을에 있어야 하는 것
export const CHAPTERS = [
  { id: 'c1', icon: '🛒', sea: 'spring', t: T2('첫 심부름 — 팬케이크 재료', 'First errand — pancake ingredients'), learn: T2('꼭 필요한 것 고르기 · 두 가게 값 견주기 · 정해진 돈 안에서 사기 · 남은 돈 돌려드리기', 'Pick what you really need · compare two shops · stay within budget · give back the change'),
    need: { shops: ['grocery'], kitchen: true }, giver: ['strawberry', 'pear', 'potato', 'cabbage', 'beehive', 'pasture', 'shiitake', 'saltpan', 'lumber', 'paddy', 'fisher', 'clam'],
    steps: [
      { id: 'n', hint: [T2('📜 쪽지는 Q(이야기)에서 다시 볼 수 있어요', '📜 Open the note again with Q (Stories)'), T2('쪽지를 읽고 ‘알겠어요’를 눌러요', 'Read the note and press “Okay!”')] , do: { type: 'note', text: T2('팬케이크를 구워서 나눠 먹고 싶은데 재료가 없어요. 심부름 돈 1,200원으로 재료를 사다 줄래요? 꼭 필요한 것만요!', 'I want to bake pancakes to share, but I have no ingredients. Could you buy them with 1,200 won? Only what we really need!') } },
      { id: 'pick', slot: 'choose', todo: T2('🧾 팬케이크에 꼭 필요한 재료 셋 고르기', '🧾 Pick the three ingredients pancakes need'), do: { type: 'choose', q: T2('팬케이크에 꼭 필요한 재료 셋을 골라요', 'Pick the three ingredients pancakes really need'), opts: ['🌾', '🥚', '🥛', '🍁', '🧈'], ans: ['🌾', '🥚', '🥛'],
        react: { '🍁': T2('시럽은 있으면 맛있지만, 없어도 팬케이크는 구워져요', 'Syrup is tasty but pancakes bake without it'), '🧈': T2('버터는 이번 요리법에는 없어요', 'Butter isn’t in this recipe') } },
        hint: [T2('요리법에 적힌 것이 꼭 필요한 것이에요 — 아이 집 부엌 📖 레시피북에도 있어요', 'The recipe lists what you really need — see the 📖 recipe book in a kitchen'), T2('가루 하나 · 알 하나 · 마시는 것 하나', 'One powder · one egg · one drink'), 'show:ans'] },
      { id: 'look', todo: T2('🏪 가게 두 곳에 들어가 세 재료 값 알아보기', '🏪 Visit two shops and check the prices'), do: { type: 'visit', kinds: ['grocery', 'conv'], need: ['🌾', '🥚', '🥛'] },
        hint: [T2('이름에 ‘마트’나 ‘편의점’이 들어간 가게예요 — F(찾기)로 이름을 찾아봐요', 'Look for a shop named “mart” or “convenience” — use F (Find)'), 'dir', 'show:path'] },
      { id: 'cmp', slot: 'choose', todo: T2('🤔 어느 가게가 더 쌀까?', '🤔 Which shop is cheaper?'), do: { type: 'choose', q: T2('세 재료를 모두 사면 어느 가게가 더 쌀까요?', 'If you buy all three, which shop costs less?'), opts: 'shops', ans: 'cheap', react: { conv: T2('편의점은 늦게까지 열어 편하지만, 이 마을에선 같은 물건이 조금 더 비싸요 — 값을 다시 더해 봐요', 'The convenience store is open late, but here the same things cost a bit more — add again') } },
        hint: [T2('가게마다 세 값을 더해 봐요', 'Add the three prices for each shop'), 'sums', 'show:ans'] },
      { id: 'buy', todo: T2('🛒 1,200원 안에서 세 재료 사기', '🛒 Buy the three within 1,200 won'), do: { type: 'buy', need: { '🌾': 1, '🥚': 1, '🥛': 1 }, budget: 1200 },
        hint: [T2('더 싼 가게에서 사면 돈이 남아요', 'Buy at the cheaper shop and money is left over'), 'dir', 'show:path'] },
      { id: 'cook', todo: T2('🍳 아이 집 부엌에서 팬케이크 굽기', '🍳 Bake pancakes in a home kitchen'), do: { type: 'cook', dish: '🥞' },
        hint: [T2('부엌은 집 안에 있어요 — 집 문 앞 빛나는 동그라미에서 E', 'Kitchens are inside homes — press E on the glowing circle by a door'), T2('🍳 요리하기 → 팬케이크 → 초록 칸에서 멈춰요', '🍳 Cook → Pancake → stop on green'), 'show:path'] },
      { id: 'give', todo: T2('🍽 {who}에게 팬케이크 나눠 주기', '🍽 Share a pancake with {who}'), do: { type: 'give', e: '🥞', to: 'giver', change: true },
        hint: [T2('{who} 곁(4m 안)에서 I(가방) → 팬케이크 → 🍽 나눠 주기', 'Next to {who} (4 m): I (bag) → pancake → 🍽 Share'), 'dir', 'show:path'] },
      { id: 'why', slot: 'line', judge: 'none', hint: [T2('무엇을 보고 그렇게 했는지 떠올려 봐요', 'Think about what made you choose that'), T2('값·가까움·맛·날씨 가운데 하나를 써 봐요', 'Write about price, distance, taste or weather')], todo: T2('✏ 한 줄 돌아보기', '✏ One line to look back'), do: { type: 'line', q: T2('어느 가게에서 샀나요? 왜 그 가게를 골랐는지 한 줄로 적어요', 'Where did you buy? Write one line about why you chose that shop') } },
    ], gets: T2('❤ 이웃 마음 · 💰 수고비 300원 · 📜 이야기 도장', '❤ Neighbour heart · 💰 300 won thanks · 📜 Story stamp'), pay: 300 },

  { id: 'c2', icon: '☀️', sea: 'summer', t: T2('더운 날, 밭일 돕기', 'Helping out on a hot day'), learn: T2('더위를 피하는 때 고르기 · 물 챙기기 · 더위 안전 약속', 'Pick a cooler time · bring water · heat safety'),
    need: { shops: ['conv', 'cafe'] }, giver: ['potato', 'cabbage', 'strawberry', 'pear', 'beehive', 'pasture', 'saltpan', 'shiitake', 'lumber', 'paddy'],
    steps: [
      { id: 'n', hint: [T2('📜 쪽지는 Q(이야기)에서 다시 볼 수 있어요', '📜 Open the note again with Q (Stories)'), T2('쪽지를 읽고 ‘알겠어요’를 눌러요', 'Read the note and press “Okay!”')] , do: { type: 'note', text: T2('요즘 낮에는 너무 더워요. 일을 같이 해 줄래요? 언제 하면 좋을지 먼저 생각해 봐요.', 'It’s so hot in the day lately. Will you help me work? First, think about when is best.') } },
      { id: 'when', slot: 'choose', todo: T2('🕘 더운 날 바깥일은 언제?', '🕘 When to work on a hot day?'), do: { type: 'choose', q: T2('더운 여름날 바깥일은 언제 하면 좋을까요? (둘)', 'On a hot summer day, when is outdoor work best? (two)'), opts: [['am', T2('🌅 아침 7~10시', '🌅 Morning 7–10')], ['noon', T2('☀️ 한낮 12~15시', '☀️ Midday 12–15')], ['pm', T2('🌇 저녁 17~19시', '🌇 Evening 17–19')], ['any', T2('🎲 아무 때나', '🎲 Any time')]], ans: ['am', 'pm'],
        react: { noon: T2('한낮은 햇볕이 가장 뜨거워서 더위를 먹기 쉬워요', 'Midday sun is the strongest — easy to get heatstroke'), any: T2('더운 날엔 때를 골라야 해요', 'On hot days, the time matters') } },
        hint: [T2('하루 가운데 해가 가장 높이 뜨는 때를 떠올려 봐요', 'Think about when the sun is highest'), T2('해가 낮게 있는 때가 둘 있어요', 'There are two times when the sun is low'), 'show:ans'] },
      { id: 'water', todo: T2('🥤 1,300원 안에서 마실 것 하나 사기', '🥤 Buy one drink within 1,300 won'), do: { type: 'buy', need: { '🥤': 1 }, budget: 1300 },
        hint: [T2('마실 것을 파는 가게가 둘 있어요 — 값이 달라요', 'Two kinds of shops sell drinks — prices differ'), T2('편의점 1,200원 · 카페 1,500원', 'Convenience 1,200 · café 1,500'), 'show:path'] },
      { id: 'bring', todo: T2('🎁 {who}에게 마실 것 주기', '🎁 Give the drink to {who}'), do: { type: 'give', e: '🥤', to: 'giver', how: 'gift' }, hint: [T2('{who} 곁에서 I(가방) → 🥤 → 🎁 선물', 'Next to {who}: I → 🥤 → 🎁 Give'), 'dir', 'show:path'] },
      { id: 'work', todo: T2('🧑 시원한 때에 {who} 일 거들기', '🧑 Work with {who} at a cooler time'), do: { type: 'work', hours: [[7, 10], [17, 19]] },
        hint: [T2('오른쪽 위 시계를 봐요 — 아침이나 저녁에 와요', 'Check the clock (top right) — come in the morning or evening'), T2('집 침대에서 자면 아침이 와요', 'Sleep in a home bed to reach morning'), 'show:path'] },
      { id: 'rule', slot: 'choose', todo: T2('🧢 더운 날 약속 고르기', '🧢 Pick the hot-day rules'), do: { type: 'choose', q: T2('더운 날 꼭 지킬 것 둘을 골라요', 'Pick two things to do on hot days'), opts: [['shade', T2('🧢 모자 쓰고 그늘에서 쉬기', '🧢 Wear a hat, rest in the shade')], ['drink', T2('💧 목마르기 전에 물 자주 마시기', '💧 Drink water often, before you’re thirsty')], ['run', T2('🏃 한낮에 오래 뛰어놀기', '🏃 Run around a long time at midday')], ['wait', T2('😣 목마를 때까지 참기', '😣 Wait until you’re really thirsty')]], ans: ['shade', 'drink'],
        react: { run: T2('한낮에 오래 뛰면 몸이 금방 뜨거워져요', 'Running long at midday overheats your body'), wait: T2('목이 마르면 이미 물이 모자란 거예요', 'Feeling thirsty means you already need water') } },
        hint: [T2('몸을 시원하게 하는 것과 물에 대한 것', 'One keeps you cool, one is about water'), T2('참거나 오래 뛰는 것은 아니에요', 'Not waiting, not running'), 'show:ans'] },
      { id: 'why', slot: 'line', judge: 'none', hint: [T2('무엇을 보고 그렇게 했는지 떠올려 봐요', 'Think about what made you choose that'), T2('값·가까움·맛·날씨 가운데 하나를 써 봐요', 'Write about price, distance, taste or weather')], todo: T2('✏ 우리 반 더위 약속 한 줄', '✏ One class rule for hot days'), do: { type: 'line', q: T2('더운 날 우리 반이 지킬 약속을 한 줄로 적어요', 'Write one hot-day rule for our class') } },
    ], gets: T2('❤ 이웃 마음 · 💰 수고비 400원 · 📜 이야기 도장', '❤ Neighbour heart · 💰 400 won thanks · 📜 Story stamp'), pay: 400 },

  { id: 'c3', icon: '🍁', sea: 'autumn', t: T2('거둔 것, 팔까 나눌까', 'Sell or share the harvest?'), learn: T2('씨 뿌리고 기다리기 · 쓰임 정하기 · 장날 값', 'Plant and wait · decide how to use it · market-day prices'),
    need: { farm: true }, giver: ['stall', 'potato', 'cabbage', 'pear', 'paddy', 'strawberry', 'beehive', 'pasture'],
    steps: [
      { id: 'n', hint: [T2('📜 쪽지는 Q(이야기)에서 다시 볼 수 있어요', '📜 Open the note again with Q (Stories)'), T2('쪽지를 읽고 ‘알겠어요’를 눌러요', 'Read the note and press “Okay!”')] , do: { type: 'note', text: T2('학교 텃밭에서 채소를 길러 보면 어때요? 다 자라면 어떻게 쓸지 같이 정해요.', 'Why not grow vegetables in the school garden? When they’re ready, let’s decide how to use them.') } },
      { id: 'grow', todo: T2('🌱 학교 텃밭에서 채소 3개 거두기', '🌱 Harvest 3 vegetables from the school garden'), do: { type: 'harvest', n: 3 },
        hint: [T2('학교 텃밭에 씨를 심고 날마다 물을 줘요 — 자라는 데 며칠 걸려요', 'Plant in the school garden and water every day — it takes a few days'), T2('비 오는 날은 저절로 물을 줘요', 'Rainy days water it for you'), 'show:path'] },
      { id: 'plan', slot: 'choose', judge: 'none', hint: [T2('누가 가장 기뻐할까 생각해 봐요', 'Who would be happiest?'), T2('팔면 돈이 남고, 나누면 이웃 마음이 남아요', 'Selling leaves money; sharing leaves happy neighbours')], todo: T2('🤔 거둔 채소를 어떻게 쓸까?', '🤔 How will you use the harvest?'), do: { type: 'choose', q: T2('거둔 채소를 어떻게 할까요? (정답은 없어요 — 까닭이 중요해요)', 'What will you do with it? (no right answer — your reason matters)'), opts: [['sell', T2('🎪 장날에 팔기', '🎪 Sell on market day')], ['share', T2('🍽 이웃에게 나누기', '🍽 Share with neighbours')], ['half', T2('⚖ 반은 팔고 반은 나누기', '⚖ Sell half, share half')]], judge: 'none',
        react: { sell: T2('장날엔 값을 더 쳐줘요 — 대신 장날까지 기다려야 해요', 'Market day pays more — but you have to wait for it'), share: T2('이웃이 반가워해요 — 돈은 못 벌어요', 'Neighbours will be glad — but no money'), half: T2('둘 다 조금씩! 고르기 어려울 때 좋은 방법이에요', 'A bit of both — handy when it’s hard to choose') } } },
      { id: 'sell', if: ['sell', 'half'], todo: T2('🎪 장날에 장터에서 채소 팔기', '🎪 Sell vegetables at the market on market day'), do: { type: 'sell', jang: true },
        hint: [T2('장날은 닷새마다(5·10·15일째…) — 장터 창에 ‘다음 장날’이 있어요', 'Market day comes every 5 days — the stall shows the next one'), T2('장날이 아니면 집에서 자고 기다려요', 'If it isn’t market day, sleep and wait'), 'show:path'] },
      { id: 'share', if: ['share', 'half'], todo: T2('🍽 이웃 일꾼에게 채소 나눠 주기', '🍽 Give vegetables to a neighbour'), do: { type: 'give', e: 'veg', to: 'any', how: 'gift' }, hint: [T2('일꾼 곁에서 I(가방) → 채소 → 🎁 선물', 'Next to a worker: I → vegetable → 🎁 Give'), 'dir', 'show:path'] },
      { id: 'why', slot: 'line', judge: 'none', hint: [T2('무엇을 보고 그렇게 했는지 떠올려 봐요', 'Think about what made you choose that'), T2('값·가까움·맛·날씨 가운데 하나를 써 봐요', 'Write about price, distance, taste or weather')], todo: T2('✏ 한 줄 돌아보기', '✏ One line to look back'), do: { type: 'line', q: T2('왜 그렇게 썼나요? 다시 한다면 어떻게 할지도 적어 봐요', 'Why did you choose that? What would you do next time?') } },
    ], gets: T2('❤ 이웃 마음 · 📜 이야기 도장', '❤ Neighbour heart · 📜 Story stamp'), pay: 0 },

  { id: 'c4', icon: '❄️', sea: 'winter', t: T2('눈 오는 날, 따뜻한 국', 'Warm soup on a snowy day'), learn: T2('눈길 안전 · 재료 모으기 계획 · 따뜻한 마음 나누기', 'Snowy-road safety · plan your ingredients · share warmth'),
    need: { kitchen: true }, giver: ['potato', 'cabbage', 'saltpan', 'strawberry', 'pear', 'beehive', 'pasture', 'shiitake', 'lumber', 'paddy', 'fisher'],
    steps: [
      { id: 'n', hint: [T2('📜 쪽지는 Q(이야기)에서 다시 볼 수 있어요', '📜 Open the note again with Q (Stories)'), T2('쪽지를 읽고 ‘알겠어요’를 눌러요', 'Read the note and press “Okay!”')] , do: { type: 'note', text: T2('길이 미끄러워서 장 보러 가기가 무서워요. 감자 배추국을 끓여 줄래요? 요리법을 알려 줄게요.', 'The roads are slippery and I’m scared to go shopping. Could you make potato-cabbage soup? I’ll teach you the recipe.'), unlock: 'r:🍲' } },
      { id: 'safe', slot: 'choose', todo: T2('🧤 눈길 안전하게 걷는 법', '🧤 Walking safely on snow'), do: { type: 'choose', q: T2('눈길·빙판길에서 안전하게 걷는 법 둘을 골라요', 'Pick two safe ways to walk on snow and ice'), opts: [['hands', T2('🧤 장갑 끼고 주머니에서 손 빼기', '🧤 Gloves on, hands out of pockets')], ['small', T2('👣 보폭을 좁게, 천천히', '👣 Small steps, slowly')], ['run', T2('🏃 빨리 뛰어서 지나가기', '🏃 Run across quickly')], ['phone', T2('📱 휴대폰 보며 걷기', '📱 Look at your phone while walking')]], ans: ['hands', 'small'],
        react: { run: T2('뛰면 미끄러져 넘어지기 쉬워요', 'Running makes you slip and fall'), phone: T2('발밑을 못 봐서 위험해요', 'You can’t see where you step') } },
        hint: [T2('넘어질 때 몸을 지키는 것과 발걸음에 대한 것', 'One protects you if you fall, one is about your steps'), T2('빠른 것과 딴 데 보는 것은 아니에요', 'Not fast, not looking away'), 'show:ans'] },
      { id: 'get', todo: T2('🥔 국 재료 모으기(감자 2·배추 1·소금 1)', '🥔 Soup: potato 2 · cabbage 1 · salt 1'), do: { type: 'have', need: { '🥔': 2, '🥬': 1, '🧂': 1 } },
        hint: [T2('감자·배추는 밭 일꾼, 소금은 염전 일꾼을 도우면 생겨요 — 가방에 있는지 먼저 봐요', 'Help the farm or salt workers — check your bag first'), T2('장터에서 다른 것과 바꿀 수도 있어요', 'You can also trade at the stall'), 'show:path'] },
      { id: 'cook', todo: T2('🍲 감자 배추국 끓이기', '🍲 Cook potato-cabbage soup'), do: { type: 'cook', dish: '🍲' }, hint: [T2('아이 집 부엌 E → 📖 레시피북', 'Home kitchen E → 📖 recipe book'), T2('초록 칸에서 멈춰야 타지 않아요', 'Stop on green so it doesn’t burn'), 'show:path'] },
      { id: 'give', todo: T2('🍽 {who}에게 국 나눠 주기', '🍽 Share the soup with {who}'), do: { type: 'give', e: '🍲', to: 'giver' }, hint: [T2('{who} 곁에서 I(가방) → 국 → 🍽 나눠 주기', 'Next to {who}: I → soup → 🍽 Share'), 'dir', 'show:path'] },
      { id: 'why', slot: 'line', judge: 'none', hint: [T2('무엇을 보고 그렇게 했는지 떠올려 봐요', 'Think about what made you choose that'), T2('값·가까움·맛·날씨 가운데 하나를 써 봐요', 'Write about price, distance, taste or weather')], todo: T2('✏ 한 줄 돌아보기', '✏ One line to look back'), do: { type: 'line', q: T2('눈 오는 날 이웃을 도울 수 있는 다른 방법을 한 줄로 적어요', 'Write one more way to help a neighbour on a snowy day') } },
    ], gets: T2('❤ 이웃 마음 · 💰 수고비 400원 · 📜 이야기 도장', '❤ Neighbour heart · 💰 400 won thanks · 📜 Story stamp'), pay: 400 },

  { id: 'c5', icon: '📜', sea: null, t: T2('한 해 고마움 쪽지', 'A year of thanks'), learn: T2('한 해 돌아보기 · 고마운 마음을 말로 전하기', 'Look back on the year · put thanks into words'),
    need: { after: 2 }, giver: null,
    steps: [
      { id: 'n', hint: [T2('📜 쪽지는 Q(이야기)에서 다시 볼 수 있어요', '📜 Open the note again with Q (Stories)'), T2('쪽지를 읽고 ‘알겠어요’를 눌러요', 'Read the note and press “Okay!”')] , do: { type: 'note', text: T2('한 해 동안 마을에서 만난 이웃들을 떠올려 봐요. 가장 고마웠던 이웃에게 쪽지를 전해요.', 'Think of the neighbours you met this year. Take a thank-you note to the one you’re most grateful to.') } },
      { id: 'who', slot: 'choose', judge: 'none', hint: [T2('❤가 많이 쌓인 이웃을 떠올려 봐요', 'Think of a neighbour with many ❤'), T2('같이 일했거나 선물을 주고받은 이웃', 'Someone you worked with or gave a present to')], todo: T2('💌 고마운 이웃 고르기', '💌 Choose a neighbour to thank'), do: { type: 'choose', q: T2('가장 고마웠던 이웃은 누구인가요? (정답은 없어요)', 'Who are you most grateful to? (no right answer)'), opts: 'hearts', judge: 'none', set: 'giver' } },
      { id: 'note', slot: 'line', judge: 'none', hint: [T2('함께 한 일 하나를 떠올려 봐요', 'Think of one thing you did together'), T2('“~해 줘서 고마워요” 꼴로 써 봐요', 'Try “Thank you for …”')], todo: T2('✏ 고마움 쪽지 한 줄 쓰기', '✏ Write a one-line thank-you note'), do: { type: 'line', q: T2('{who}에게 고마운 까닭을 한 줄로 적어요', 'Write one line telling {who} why you’re thankful') } },
      { id: 'go', todo: T2('💌 {who}에게 쪽지 전하기', '💌 Take the note to {who}'), do: { type: 'go', to: 'giver', r: 4, say: T2('고마워요! 이 쪽지 오래 간직할게요', 'Thank you! I’ll keep this note forever') }, hint: [T2('{who}{은} 일하는 곳에 있어요', '{who} is at their workplace'), 'dir', 'show:path'] },
    ], gets: T2('❤ 이웃 마음 · 📜 한 해 이야기 도장', '❤ Neighbour heart · 📜 Year story stamp'), pay: 0 },
];
export const VEG = ['🥕', '🍅', '🌽', '🍠', '🥔', '🥒', '🥬'];
export const whoName = (k, en) => (WHO[k] || ['이웃', 'a neighbour'])[en ? 1 : 0];

// ── 실행기 ── api: 마을(town.js)이 넘겨주는 부품(창·길·가게·일꾼·이벤트) — 매 프레임 X(tick = 1초)
export function createStory(api) {
  const { GAME, esc } = api, en = () => api.en(), L = (a) => (Array.isArray(a) ? a[en() ? 1 : 0] : a || '');
  const S = () => GAME.S.story || (GAME.S.story = { cur: null, i: 0, v: {}, done: {}, h: 0, t: 0, tries: 0 });
  const ch = () => CHAPTERS.find(c => c.id === S().cur) || null, step = () => { const c = ch(); return c ? c.steps[S().i] : null; };
  const fill = s => { const w = S().v.who ? whoName(S().v.who, en()) : (en() ? 'the neighbour' : '이웃'), c = w.charCodeAt(w.length - 1), bat = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0; return String(s).replace(/\{who\}/g, w).replace(/\{은\}/g, en() ? '' : bat ? '은' : '는'); };   /* 받침 있으면 '은' */
  const save = () => GAME.mark();
  // 이 마을에서 할 수 있는 장인지(없는 가게·텃밭·부엌이면 잠금 — 없는 곳을 지어내지 않음)
  function can(c) { const n = c.need || {}; if (n.shops && !n.shops.some(k => api.shops().some(s => s.kind === k))) return false; if (n.kitchen && !api.kitchens().length) return false; if (n.farm && !api.farm()) return false; if (n.after && Object.keys(S().done).length < n.after) return false; if (c.giver && !api.workers().some(w => c.giver.includes(w.k))) return false; return true; }
  const near = (L9, me) => { let b = null, bd = 1e18; for (const q of L9) { const d = (q.x - me.x) ** 2 + (q.z - me.z) ** 2; if (d < bd) { bd = d; b = q; } } return b; };
  const giverW = () => { const v = S().v; if (!v.who) return null; return api.workers().find(w => w.k === v.who && w.cell === v.wcell) || near(api.workers().filter(w => w.k === v.who), api.me()); };
  // 지금 단계의 목적지(셋째 힌트 길 · 'dir' 힌트 방향)
  function target() { const st = step(); if (!st) return null; const d = st.do, me = api.me(), v = S().v;
    if (d.type === 'visit') { const left = d.kinds.filter(k => !(v.seen || {})[k]); return near(api.shops().filter(s => left.includes(s.kind)), me); }
    if (d.type === 'buy') { const k = v.cheap || null, L9 = api.shops().filter(s => Object.keys(d.need).every(e => (api.goods(s.kind) || []).some(g => g[0] === e))); return near(k ? L9.filter(s => s.kind === k).concat(L9.length ? [] : []) : L9, me) || near(L9, me); }
    if (d.type === 'cook') return near(api.kitchens(), me); if (d.type === 'harvest') return api.farm(); if (d.type === 'sell') return near(api.stalls(), me);
    if (d.type === 'have') { const e = Object.keys(d.need).find(e9 => GAME.count(e9) < d.need[e9]), k = { '🥔': 'potato', '🥬': 'cabbage', '🧂': 'saltpan' }[e]; const w = k && near(api.workers().filter(w9 => w9.k === k), me); return w ? { ...w, name: whoName(w.k, en()), icon: '🧑', door: [w.x, w.z] } : near(api.stalls(), me); }
    if ((d.type === 'give' && d.to === 'giver') || d.type === 'work' || (d.type === 'go' && d.to === 'giver')) { const w = giverW(); return w ? { x: w.x, z: w.z, door: [w.x, w.z], icon: '🧑', name: whoName(w.k, en()) } : null; }
    if (d.type === 'give') { const w = near(api.workers(), me); return w ? { x: w.x, z: w.z, door: [w.x, w.z], icon: '🧑', name: whoName(w.k, en()) } : null; }
    return null; }
  const DIR = [['북', 'north'], ['북동', 'north-east'], ['동', 'east'], ['남동', 'south-east'], ['남', 'south'], ['남서', 'south-west'], ['서', 'west'], ['북서', 'north-west']];
  function dirLine() { const p = target(); if (!p) return ''; const me = api.me(), dx = p.x - me.x, dz = p.z - me.z, d = Math.hypot(dx, dz), a = ((Math.atan2(dx, -dz) * 180 / Math.PI) + 360 + 22.5) % 360, k = Math.floor(a / 45);   /* 지도 위 = 북(−z) */
    return (en() ? '🧭 ' + (p.name || '') + ' is ' + DIR[k][1] + ', about ' + Math.round(d / 10) * 10 + ' m · cell ' : '🧭 ' + (p.name || '') + '은(는) ' + DIR[k][0] + '쪽 약 ' + Math.round(d / 10) * 10 + 'm · ') + api.cellOf(p.x, p.z) + (en() ? '' : ' 칸'); }
  const sumOf = (kind, need) => need.reduce((a, e) => { const g = (api.goods(kind) || []).find(q => q[0] === e); return a + (g ? g[1] : 1e9); }, 0);
  function hintText(lv) { const st = step(); if (!st || !st.hint) return ''; const h = st.hint[lv - 1], v = S().v; if (!h) return '';
    if (h === 'dir') return dirLine(); if (h === 'sums') { const c = ch(), need = (c.steps.find(s => s.do.type === 'visit') || { do: { need: [] } }).do.need; return [...new Set(api.shops().map(s => s.kind))].filter(k => ['grocery', 'conv'].includes(k)).map(k => api.kindName(k) + ' ' + need.map(e => { const g = (api.goods(k) || []).find(q => q[0] === e); return g ? g[1] : '?'; }).join('+') + ' = ' + api.won(sumOf(k, need))).join(' · '); }
    if (h === 'spent') return (en() ? 'You spent ' : '쓴 돈 = ') + api.won(v.spent || 0); if (h === 'show:path') { const p = target(); if (p) api.route({ icon: p.icon || '📍', name: p.name || '', en: p.name || '', door: p.door || [p.x, p.z], arrive: '🎉 ' + (p.name || '') }); return en() ? '🧭 Follow the red line' : '🧭 빨간 선을 따라가요'; }
    if (h === 'show:ans') return en() ? '✨ The answer is glowing' : '✨ 답이 반짝여요'; return fill(L(h)); }
  // 힌트 단계 올리기(시간 40·80·120초 · 틀린 수 · 단추)
  function hintUp(why) { const s = S(), st = step(); if (!st || !st.hint || s.h >= st.hint.length) return; s.h++; const t = hintText(s.h); if (t) api.toast('💡 ' + t, 4); api.task(); if (panelOn && st.do.type === 'choose' && st.hint[s.h - 1] === 'show:ans') drawChoose(); }
  // 단계 시작 · 끝
  function begin() { const s = S(), st = step(); s.h = 0; s.t = 0; s.tries = 0; api.routeOff(); if (!st) return finish(); const d = st.do;
    if (st.if && !st.if.includes(s.v.pick)) { s.i++; return begin(); }
    if (d.type === 'buy') { s.v.spent = 0; s.v.got = {}; api.earn(d.budget); api.toast((en() ? '💰 Errand money ' : '💰 심부름 돈 ') + api.won(d.budget) + (en() ? ' received' : '을 받았어요'), 2.6); }
    if (d.type === 'visit') s.v.seen = {}; if (d.type === 'harvest') s.v.hv = 0;
    if (d.type === 'choose' && d.opts === 'shops' && [...new Set(api.shops().map(q => q.kind))].filter(k => ['grocery', 'conv'].includes(k)).length < 2) { s.i++; return begin(); }   /* 견줄 가게가 하나뿐이면 건너뜀 */
    save(); api.task(); if (['note', 'choose', 'ask', 'line'].includes(d.type)) setTimeout(() => open(), 350); }
  function next(msg) { const s = S(); if (msg) api.banner(msg, 2.8); api.sfx('ding'); s.i++; begin(); }
  function finish() { const s = S(), c = ch(); if (!c) return; s.done[c.id] = { d: GAME.S.day, star: !!s.v.star }; if (c.pay) api.earn(c.pay); api.add('📜', 1); const w = giverW(); if (w) api.heart(w, 2); s.cur = null; s.i = 0; s.v = {}; api.routeOff(); save(); api.task();
    api.banner('📜 ' + L(c.t) + (en() ? ' — chapter done! ' : ' — 이야기 끝! ') + L(c.gets), 4); }
  // 장 시작(쪽지를 보내는 일꾼 = 이 마을에서 가장 가까운 그 갈래)
  function start(id) { const c = CHAPTERS.find(q => q.id === id); if (!c || !can(c)) return false; const s = S(); s.cur = id; s.i = 0; s.v = {}; if (c.giver) { const w = near(api.workers().filter(q => c.giver.includes(q.k)), api.me()); if (w) { s.v.who = w.k; s.v.wcell = w.cell; } } begin(); return true; }
  function pause() { const s = S(); s.paused = s.cur; s.pi = s.i; s.pv = s.v; s.cur = null; api.routeOff(); save(); api.task(); }
  function resume() { const s = S(); if (!s.paused) return; s.cur = s.paused; s.i = s.pi || 0; s.v = s.pv || {}; s.paused = null; begin(); }
  // ── 창(쪽지·고르기·셈·한 줄) ──
  let panelOn = false, pick = new Set();
  function open() { const st = step(); if (!st) return list(); const d = st.do, c = ch(); pick = new Set(); panelOn = true;
    const head = '<h3>' + c.icon + ' ' + esc(L(c.t)) + ' <span class="sm">' + (S().i + 1) + '/' + c.steps.length + '</span></h3>';
    if (d.type === 'note') { const P = api.openP(head + '<div class="sm" style="margin:2px 0 8px">' + esc(L(c.learn)) + '</div><div style="background:#fff8e6;border:2px dashed #e0b45a;border-radius:12px;padding:12px 14px;font-size:17px;line-height:1.55">📜 <b>' + esc(fill(en() ? 'Note from {who}' : '{who}의 쪽지')) + '</b><br>' + esc(fill(L(d.text))) + '</div><div class="row"><button class="pri" data-a="ok">' + (en() ? 'Okay!' : '알겠어요!') + '</button><button class="sub" data-a="later">' + (en() ? 'Later' : '나중에') + '</button></div>', false, 'story');
      P.onclick = e => { const b = e.target.closest('button'); if (!b) return; panelOn = false; api.closeP(); if (b.dataset.a === 'ok') { if (d.unlock) api.unlock(d.unlock); next(''); } }; return; }
    if (d.type === 'choose') return drawChoose();
    if (d.type === 'ask') { const v = S().v, over = (v.spent || 0) > (v.budget || 0), q = over ? (en() ? 'You spent more than the errand money. How much more?' : '심부름 돈보다 얼마를 더 썼을까요?') : (en() ? 'How much change is left from the errand money?' : '심부름 돈에서 거스름돈은 얼마일까요?');
      const P = api.openP(head + '<div style="font-size:17px;margin:6px 0">🧮 ' + esc(q) + '</div><div class="sm">' + (en() ? 'Errand money ' : '심부름 돈 ') + api.won(v.budget || 0) + (S().h >= 2 ? ' · ' + (en() ? 'spent ' : '쓴 돈 ') + api.won(v.spent || 0) : '') + '</div><div class="row"><input class="twn-ask" inputmode="numeric" maxlength="6" style="font-size:20px;width:8em;padding:6px 10px;border-radius:10px;border:2px solid #9ab" placeholder="' + (en() ? 'won' : '원') + '"><button class="pri" data-a="ok">' + (en() ? 'Check' : '확인') + '</button><button class="sub" data-a="x">' + (en() ? 'Close' : '닫기') + '</button></div><div class="twn-askr sm" style="min-height:1.4em"></div>', false, 'story');
      const inp = P.querySelector('.twn-ask'); setTimeout(() => inp && inp.focus(), 50); const ans = Math.abs((v.budget || 0) - (v.spent || 0));
      if (S().h >= 3) P.querySelector('.twn-askr').textContent = (en() ? '✨ Answer: ' : '✨ 답: ') + api.won(ans);
      const go = () => { const n = parseInt(String(inp.value).replace(/[^0-9]/g, ''), 10); if (n === ans) { panelOn = false; api.closeP(); next((en() ? '🧮 Right! ' : '🧮 맞아요! ') + api.won(ans)); return; } S().tries++; P.querySelector('.twn-askr').textContent = (en() ? 'Not quite — try again' : '다시 셈해 봐요') + (n > ans ? (en() ? ' (too much)' : ' (너무 커요)') : (en() ? ' (too little)' : ' (너무 작아요)')); hintUp('wrong'); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); P.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { panelOn = false; api.closeP(); } else go(); }; return; }
    if (d.type === 'line') { const P = api.openP(head + '<div style="font-size:17px;margin:6px 0">✏ ' + esc(fill(L(d.q))) + '</div><div class="row"><input class="twn-line" maxlength="30" style="font-size:17px;width:min(420px,80vw);padding:6px 10px;border-radius:10px;border:2px solid #9ab"></div><div class="sm">' + (en() ? 'No right answer — saved in your diary on this device' : '정답은 없어요 — 이 기기의 일기에 남아요') + '</div><div class="row"><button class="pri" data-a="ok">' + (en() ? 'Done' : '다 썼어요') + '</button><button class="sub" data-a="x">' + (en() ? 'Close' : '닫기') + '</button></div>', false, 'story');
      const inp = P.querySelector('.twn-line'); setTimeout(() => inp && inp.focus(), 50); const go = () => { const t = String(inp.value || '').trim().slice(0, 30); if (!t) { inp.style.borderColor = '#e0453a'; return; } api.diary(ch().icon + ' ' + t); S().v.line = t; panelOn = false; api.closeP(); next(en() ? '✏ Saved in your diary' : '✏ 일기에 남겼어요'); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); P.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { panelOn = false; api.closeP(); } else go(); }; return; }
    panelOn = false; list(); }
  function optsOf(d) { if (d.opts === 'shops') return [...new Set(api.shops().map(s => s.kind))].filter(k => ['grocery', 'conv'].includes(k)).map(k => [k, [api.kindName(k, false), api.kindName(k, true)]]);
    if (d.opts === 'hearts') { const W = api.workers(), seen = new Set(), out = []; for (const w of W) { const key = w.k; if (seen.has(key)) continue; seen.add(key); out.push([key, [whoName(key, false) + ' ' + '❤'.repeat(Math.max(1, api.hearts(w))), whoName(key, true)]]); if (out.length >= 6) break; } return out; }
    return d.opts.map(o => Array.isArray(o) ? o : [o, [o + ' ' + api.itemName(o, false), o + ' ' + api.itemName(o, true)]]); }
  function ansOf(d) { if (d.ans === 'cheap') { const need = ['🌾', '🥚', '🥛']; const ks = optsOf(d).map(o => o[0]); return [ks.reduce((a, k) => sumOf(k, need) < sumOf(a, need) ? k : a, ks[0])]; } return d.ans || []; }
  function drawChoose() { const st = step(), d = st.do, c = ch(), O = optsOf(d), A = ansOf(d), need = d.judge === 'none' ? 1 : A.length, showA = S().h >= 3 && d.judge !== 'none';
    const P = api.openP('<h3>' + c.icon + ' ' + esc(L(c.t)) + ' <span class="sm">' + (S().i + 1) + '/' + c.steps.length + '</span></h3><div style="font-size:17px;margin:6px 0">🤔 ' + esc(fill(L(d.q))) + (need > 1 ? ' <span class="sm">(' + need + (en() ? ' picks' : '개 고르기') + ')</span>' : '') + '</div><div class="row" style="flex-wrap:wrap;gap:8px">'
      + O.map(([k, t]) => '<button class="' + (pick.has(k) ? 'pri' : 'sub') + '" data-k="' + esc(k) + '" style="font-size:16px;min-height:44px' + (showA && A.includes(k) ? ';box-shadow:0 0 0 3px #f2c230' : '') + '">' + (showA && A.includes(k) ? '✨ ' : '') + esc(L(t)) + '</button>').join('') + '</div><div class="twn-chr sm" style="min-height:1.4em;margin:6px 0"></div>'
      + '<div class="row"><button class="pri" data-a="ok">' + (en() ? 'Decide' : '정했어요') + '</button><button class="sub" data-a="h">💡 ' + (en() ? 'Hint' : '힌트') + '</button><button class="sub" data-a="x">' + (en() ? 'Close' : '닫기') + '</button></div>', false, 'story');
    P.onclick = e => { const b = e.target.closest('button'); if (!b) return; const r9 = P.querySelector('.twn-chr');
      if (b.dataset.k) { const k = b.dataset.k; if (pick.has(k)) pick.delete(k); else { if (need === 1) pick.clear(); if (pick.size < need) pick.add(k); } P.querySelectorAll('button[data-k]').forEach(q => { q.className = pick.has(q.dataset.k) ? 'pri' : 'sub'; }); return; }
      if (b.dataset.a === 'x') { panelOn = false; api.closeP(); return; } if (b.dataset.a === 'h') { hintUp('ask'); if (S().h < 3) r9.textContent = '💡 ' + hintText(S().h); return; }
      if (pick.size < need) { r9.textContent = en() ? 'Pick ' + need : need + '개를 골라요'; return; } const P9 = [...pick];
      if (d.judge === 'none') { const k = P9[0], rx = d.react && d.react[k]; S().v.pick = k; if (d.set === 'giver') { S().v.who = k; const w = api.workers().find(q => q.k === k); if (w) S().v.wcell = w.cell; } panelOn = false; api.closeP(); next(rx ? '💬 ' + L(rx) : (en() ? '👍 Good choice' : '👍 좋아요')); return; }
      const bad = P9.filter(k => !A.includes(k)); if (!bad.length && P9.length === A.length) { if (d.ans === 'cheap') S().v.cheap = P9[0]; panelOn = false; api.closeP(); next(en() ? '✅ Well thought out!' : '✅ 잘 생각했어요!'); return; }
      S().tries++; const rx = d.react && bad.map(k => d.react[k]).find(Boolean); api.sfx('pop'); hintUp('wrong'); const r8 = document.querySelector('.twn-chr'); if (r8) r8.textContent = '💬 ' + (rx ? L(rx) : (en() ? 'Hmm, not quite — think again' : '음, 조금 달라요 — 다시 생각해 봐요')); }; }
  // 장 목록(메뉴 · 이야기 줄을 누르면)
  function list() { const s = S(), C = CHAPTERS, sea = api.season(), cur = ch();
    const P = api.openP('<h3>📖 ' + (en() ? 'Our town stories' : '우리 마을 이야기') + '</h3><div class="sm" style="margin-bottom:8px">' + (en() ? 'Neighbours send notes. Think, choose, and help — take a break any time and play freely.' : '이웃들이 쪽지를 보내요. 생각하고 고르고 도와요 — 언제든 쉬고 자유롭게 놀아도 돼요.') + '</div>'
      + (cur ? '<div style="background:#eef7ff;border-radius:12px;padding:10px 12px;margin-bottom:8px"><b>' + cur.icon + ' ' + esc(L(cur.t)) + '</b> · ' + (s.i + 1) + '/' + cur.steps.length + '<br>' + esc(todo()) + (s.h ? '<br><span class="sm">💡 ' + esc(hintText(s.h)) + '</span>' : '') + '<div class="row"><button class="pri" data-a="go">' + (en() ? 'Continue' : '계속하기') + '</button><button class="sub" data-a="h">💡 ' + (en() ? 'Hint' : '힌트') + '</button><button class="sub" data-a="p">⏸ ' + (en() ? 'Take a break' : '잠깐 쉬기') + '</button></div></div>' : '')
      + C.map(c => { const ok = can(c), dn = s.done[c.id], rec = c.sea && c.sea === sea; return '<div style="display:flex;gap:10px;align-items:center;border:2px solid ' + (rec ? '#f2c230' : '#e3e7ea') + ';border-radius:12px;padding:8px 10px;margin:6px 0;opacity:' + (ok ? 1 : 0.55) + '"><div style="font-size:28px">' + c.icon + '</div><div style="flex:1"><b>' + esc(L(c.t)) + '</b>' + (rec ? ' <span class="sm">' + (en() ? '· this season' : '· 지금 계절') + '</span>' : '') + (dn ? ' ✅' + (dn.star ? '★' : '') : '') + '<div class="sm">' + esc(L(c.learn)) + '</div></div>'
        + (ok && !cur ? '<button class="' + (dn ? 'sub' : 'pri') + '" data-c="' + c.id + '">' + (s.paused === c.id ? (en() ? 'Resume' : '이어 하기') : dn ? (en() ? 'Again' : '다시') : (en() ? 'Start' : '시작')) + '</button>' : ok ? '' : '<span class="sm">' + (c.need && c.need.after ? (en() ? 'after 2 stories' : '이야기 둘 뒤에') : (en() ? 'not in this town' : '이 마을엔 없음')) + '</span>') + '</div>'; }).join('')
      + '<div class="row"><button class="sub" data-a="x">' + (en() ? 'Close (Esc)' : '닫기(Esc)') + '</button></div>', true, 'story');
    P.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') return api.closeP(); if (b.dataset.a === 'p') { api.closeP(); pause(); return; } if (b.dataset.a === 'h') { hintUp('ask'); api.closeP(); return; }
      if (b.dataset.a === 'go') { api.closeP(); if (['note', 'choose', 'ask', 'line'].includes(step().do.type)) open(); return; }
      if (b.dataset.c) { api.closeP(); if (S().paused === b.dataset.c) resume(); else start(b.dataset.c); } }; }
  // 이야기 줄(할 일 줄 자리 · 단계가 바뀔 때만 글자를 바꿈)
  function todo() { const st = step(); if (!st) return ''; const v = S().v, d = st.do; let t = fill(L(st.todo || (en() ? '📜 Read the note' : '📜 쪽지 읽기')));
    if (d.type === 'buy') t += (en() ? ' · left ' : ' · 남은 돈 ') + api.won(Math.max(0, d.budget - (v.spent || 0))); if (d.type === 'visit') t += ' (' + Object.keys(v.seen || {}).length + '/' + d.kinds.filter(k => api.shops().some(s => s.kind === k)).length + ')'; if (d.type === 'harvest') t += ' (' + (v.hv || 0) + '/' + d.n + ')'; return t; }
  // ── 이벤트(마을이 부름) ──
  function ev(type, o = {}) { const st = step(); if (!st) return; const d = st.do, s = S(), v = s.v;
    if (type === 'enter' && d.type === 'visit' && d.kinds.includes(o.kind)) { if (!(v.seen || (v.seen = {}))[o.kind]) { v.seen[o.kind] = 1; const G = api.goods(o.kind) || []; api.banner('🏪 ' + o.name + ' — ' + d.need.map(e => { const g = G.find(q => q[0] === e); return e + ' ' + (g ? api.won(g[1]) : '—'); }).join(' · '), 4.5); s.t = 0;
      const all = d.kinds.filter(k => api.shops().some(q => q.kind === k)).every(k => v.seen[k]); if (all) setTimeout(() => next(en() ? '📝 You checked both shops' : '📝 두 가게 값을 다 알아봤어요'), 1800); else { save(); api.task(); } } return; }
    if (type === 'buy' && d.type === 'buy' && d.need[o.e]) { v.spent = (v.spent || 0) + o.v; (v.got || (v.got = {}))[o.e] = (v.got[o.e] || 0) + 1; s.t = 0; api.task(); if (Object.entries(d.need).every(([e, n]) => (v.got[e] || 0) >= n)) { v.budget = d.budget; const ok9 = v.spent <= d.budget; if (ok9) v.star = true; setTimeout(() => next(ok9 ? (en() ? '★ Bought within the errand money!' : '★ 심부름 돈 안에서 샀어요!') : (en() ? 'Spent ' + api.won(v.spent - d.budget) + ' too much — next time compare first' : '심부름 돈보다 ' + api.won(v.spent - d.budget) + ' 더 썼어요 — 다음엔 먼저 견줘 봐요')), 900); } return; }
    if (type === 'cook' && d.type === 'cook') { if (o.e === d.dish) next(en() ? '🍳 Done!' : '🍳 다 만들었어요!'); else if (o.e === '🌑') { s.tries++; api.toast(en() ? '🌑 Burnt — stop on green next time' : '🌑 탔어요 — 다음엔 초록 칸에서!', 3); hintUp('wrong'); } return; }
    if ((type === 'share' || type === 'gift') && d.type === 'give') { const okE = d.e === 'veg' ? VEG.includes(o.e) : o.e === d.e, w = o.w, okW = d.to !== 'giver' || (w && w.k === v.who); if (!okE) return;
      if (!okW) { api.toast(fill(en() ? 'This is for {who}!' : '이건 {who}에게 줄 거예요!'), 2.6); return; } if (d.change && v.budget != null && v.spent != null && v.budget > v.spent) { api.spend(v.budget - v.spent); setTimeout(() => api.toast((en() ? '🪙 Gave back the change ' : '🪙 거스름돈 ') + api.won(v.budget - v.spent) + (en() ? '' : '도 돌려드렸어요'), 2.8), 1200); } next(en() ? '😊 They’re so happy!' : '😊 이웃이 정말 기뻐해요!'); return; }
    if (type === 'work' && d.type === 'work' && o.k === v.who) { const h = api.hour(); if (d.hours.some(([a, b]) => h >= a && h < b)) next(en() ? '🌿 Done in the cool of the day!' : '🌿 시원할 때 잘 해냈어요!'); else { s.tries++; api.toast(en() ? '🥵 It’s too hot now! Rest in the shade and come back in the morning or evening' : '🥵 지금은 너무 더워요! 그늘에서 쉬었다가 아침이나 저녁에 와요', 3.4); hintUp('wrong'); } return; }
    if (type === 'harvest' && d.type === 'harvest') { v.hv = (v.hv || 0) + (o.n || 1); s.t = 0; api.task(); if (v.hv >= d.n) next(en() ? '🌱 Harvest done!' : '🌱 다 거뒀어요!'); else save(); return; }
    if (type === 'sell' && d.type === 'sell' && VEG.includes(o.e)) { if (d.jang && !api.jang()) { api.toast(en() ? '🎪 Not market day — prices are better on market day!' : '🎪 오늘은 장날이 아니에요 — 장날엔 값을 더 쳐줘요!', 3); return; } next(en() ? '🎪 Sold on market day!' : '🎪 장날에 잘 팔았어요!'); return; } }
  // 1초 tick: 힌트 시간 · 가졌는지·도착 판정(그 단계만)
  function tick() { const st = step(); if (!st) return; const s = S(), d = st.do; s.t++; if (s.t === 40 || s.t === 80 || s.t === 120) hintUp('time');
    if (d.type === 'have' && Object.entries(d.need).every(([e, n]) => GAME.count(e) >= n)) next(en() ? '🧺 Got everything!' : '🧺 재료를 다 모았어요!');
    else if (d.type === 'go') { const w = giverW(), me = api.me(); if (w && Math.hypot(w.x - me.x, w.z - me.z) < (d.r || 4)) { api.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(d.say)); api.heart(w, 3); next(en() ? '💌 Note delivered!' : '💌 쪽지를 전했어요!'); } } }
  return { start, pause, resume, open, list, ev, tick, todo, get on() { return !!ch(); }, get cur() { return S().cur; }, get step() { const st = step(); return st ? { id: st.id, type: st.do.type, i: S().i, h: S().h, v: { ...S().v } } : null; }, can: id => { const c = CHAPTERS.find(q => q.id === id); return !!(c && can(c)); }, hint: () => hintUp('ask'), target };
}
