// 상상 세계 '과일 세계' — 세계 판 4번(유은·예지 · 그린 지도 3×3)을 바탕으로 Claude가 세계관을 넓힌 판(WORLD-FX · 10-07)
//   아이들 것: 하늘 위 초록 구름 · 파란 구름의 비 → 과일이 요정 '뇨뇨'(동그랗고 하양 + 과일 색 · 머리 위 새싹 · 점눈 · 팔다리는 선 · 굴러다님) · 사람 모양 요정 키위·체리 ·
//   키위 = 정원 관리자 · 만능 분홍 가위(자르기·순간이동·변신 · 가위 없으면 마법 못 씀) · 놀래키기 취미 / 체리 = 아이돌 · 날개 · 마법 체리(빨리 뛰기·숨기·야간 시야·변신) · 마이크에 뇨뇨의 영혼 ·
//   키위 = 체리의 매니저 · 뇨뇨 왕(왕관 쓴 하얀 뇨뇨 · 성 안) · 공연장(하늘)·상가(서쪽 · 만물상)·키위 집(동쪽 · 파티)·체리 집 · 정원 · 광장 · 마을의 마법으로 아래 정림초에 갈 수 있음
//   지도 = 아이들 그림 그대로(위: 공연장·성·뇨뇨 마을 / 가운데: 과일 들판·광장·키위 집 / 아래: 상가·정원·체리 집)
export const WHO = { '이야기': '📖', '키위': '🥝', '체리': '🍒', '뇨뇨 왕': '👑', '귤 뇨뇨': '🍊', '딸기 뇨뇨': '🍓', '뇨뇨들': '🌱' };
const Y = 30;   // 초록 구름 윗면(운동장 위 하늘)
const A = (x, z, dy = 0) => [x, Y + dy, z];
const NY = [   // 뇨뇨 열 — [id, 색, x, z, 사는 칸]
  ['n1', 0xffa94d, 9, -2, 'v'], ['n2', 0xff6b81, 13, 1, 'v'], ['n3', 0xa66cff, 7, 2, 'v'], ['n4', 0xffe066, 14, -4, 'v'],
  ['n5', 0xe74c3c, -21, 12, 'f'], ['n6', 0x51cf66, -17, 16, 'f'], ['n7', 0x5c7cfa, -23, 17, 'f'],
  ['n8', 0xffc9c9, -7, 12, 'p'], ['n9', 0xfafafa, -1, 16, 'p'], ['n10', 0xfff3bf, -5, 18, 'p'],
];
const RECT = { v: [5, -6, 17, 4], f: [-25, 9, -13, 20], p: [-9, 10, 1, 18] };
const NAMES = '귤·딸기·포도·바나나 · 사과·수박·블루베리 · 복숭아·하양·레몬';

export const STORY = {
  title: '과일 세계',
  chapters: [],   // 10-08 교사 '애들한테 1~5장으로 설계하라고 한 것도 아닌데 임의로 1~5장 — 김샘' → 장 이름·배너 없음(아이들이 장을 나눈 판만 장을 씀)
  start: { at: [-4, -1.35, 13], h: 0 },
  book: {
    title: '과일 세계 안내서', chip: '과일 세계 안내서',
    pages: [
      { icon: '🌍', h: '어떤 세계?', items: [
        ['k', '이 세계의 이름은 과일 세계. 하늘 위 커다란 초록 구름 위에 과일들밖에 없었어요.'],
        ['k', '어느 날 초록 구름보다 위에 있던 파란 구름에서 비가 내리자, 과일들이 요정 종족 "뇨뇨"가 되었어요. 그런데 체리와 키위는 사람 모양의 요정이 되었어요.'],
        ['a', '파란 구름의 비는 "요정 비"예요. 아주 오래에 한 번만 내려서, 언제 다시 내릴지 아무도 몰라요.'],
        ['a', '키위와 체리가 사람 모양이 된 까닭: 비가 내리던 날, 둘만 무지개 끝자락 아래에 있었기 때문이래요.'],
      ] },
      { icon: '🗺', h: '어떤 곳? (우리 지도)', items: [
        ['k', '위 줄: 공연장(하늘에서 가장 큰 아이돌 공연장) · 성(뇨뇨 왕) · 뇨뇨가 사는 곳'],
        ['k', '가운데 줄: 과일들(들판) · 광장 · 키위 집(파티를 열 수 있어요)'],
        ['k', '아래 줄: 상가(키위가 여는 만물상) · 정원 · 체리 집'],
        ['k', '초록 구름 안 마을에는 마법이 담겨 있어서 아래에 있는 정림초에 갈 수 있어요.'],
        ['a', '광장 한가운데에 정림초로 내려가는 무지개 구름 문이 있고, 광장 위아래로 맑은 시냇물이 흘러요.'],
      ] },
      { icon: '🌱', h: '누가 살아?', items: [
        ['k', '뇨뇨: 동그랗고, 기본 색은 하양, 머리 위에 초록 새싹이 있고 과일마다 색이 달라요. 점눈이고 늘 웃어요. 팔다리는 그냥 선이에요. 가끔 들판에서 굴러다녀요. 장난이 많고, 성격은 과일마다 달라요.'],
        ['k', '키위: 초록 옷에 바지, 긴 생머리에 키위 머리핀, 어깨엔 만능 분홍 가위. 반달눈으로 늘 웃어요. 날개는 없지만 변신·순간이동을 해요. 장난기 많고 긍정적, 뇨뇨들을 놀래키는 게 취미. 아주 가끔 뇨뇨들에게 선물을 줘요.'],
        ['k', '체리: 분홍 긴 양갈래 머리, 체리 머리 장식, 날 때는 예쁜 날개. 아이돌이에요! 마이크를 들고, 작은 가방엔 마법 체리가 가득. 키위가 체리의 매니저예요.'],
        ['k', '뇨뇨 왕: 성 안에 살아요. 왕관을 쓴 하얀 뇨뇨예요.'],
        ['a', '과일마다 성격: 딸기 뇨뇨 = 수줍음쟁이 · 바나나 뇨뇨 = 장난꾸러기 · 포도 뇨뇨 = 늘 몰려다님 · 귤 뇨뇨 = 수다쟁이 · 수박 뇨뇨 = 잠꾸러기'],
        ['a', '뇨뇨 왕은 이 세계에서 가장 먼저 깨어난 뇨뇨예요. 그런데 원래 무슨 과일이었는지는 왕도 기억하지 못해요.'],
      ] },
      { icon: '📜', h: '규칙', items: [
        ['k', '뇨뇨들은 평화롭게 지내요. 키위와 체리도 마찬가지예요.'],
        ['k', '이 세계에 들어오면 키위나 체리로 캐릭터를 정해야 해요.'],
        ['k', '키위로 하면 정원 관리자! 가위로 정원을 가꿔요. 능력 = 자르기 · 순간이동 · 변신(마을 뇨뇨 중 하나로 1분 동안).'],
        ['k', '체리로 하면 노래 부르기, 날개를 펴서 날기(쉬는 시간 없음 — 너무 오래 날면 "힘들다"며 내려와요), 마법 체리 먹기(변신·빨리 뛰기·숨기·야간 시야).'],
        ['k', '(체리로 할 때) 키위를 화나게 하면 키위가 관심을 주지 않아요. 매니저 일을 그만두고, 체리를 만나면 바로 순간이동해 버려요.'],
        ['k', '키위는 가위가 없으면 마법을 쓸 수 없어요.'],
      ] },
      { icon: '✨', h: '신기한 것', items: [
        ['k', '체리 마이크에는 요정 뇨뇨의 영혼이 깃들어 있어서 체리가 멋진 아이돌이 될 수 있었어요.'],
        ['k', '초록 구름 안 마을의 마법으로 아래 정림초에 갈 수 있어요.'],
        ['a', '체리가 노래하면 뇨뇨들이 통통 뛰며 춤을 춰요. 노래마다 뇨뇨들의 춤이 달라요.'],
        ['a', '만물상에서는 키위 집에서 가져온 물건으로 새 물건을 만들어요(뇨뇨 인형·체리 머리핀·구름 솜사탕).'],
      ] },
      { icon: '🌱', h: '다음 이야기 씨앗', items: [
        ['s', '파란 구름에서 요정 비가 다시 내린다면? 이번엔 무엇이 요정이 될까? (정림초 텃밭 채소?)'],
        ['s', '뇨뇨 왕은 원래 무슨 과일이었을까? 왜 혼자 하얀색일까?'],
        ['s', '키위가 만능 가위를 잃어버린다면? 마법을 못 쓰는 키위는 어떻게 할까? 누가 가져갔을까?'],
        ['s', '체리 마이크 속 뇨뇨의 영혼이 밖으로 나오고 싶어 한다면?'],
        ['s', '체리가 키위를 화나게 해서 키위가 매니저를 그만둔다면? 둘은 어떻게 다시 친해질까?'],
        ['s', '바람에 초록 구름이 정림초에서 멀리 떠밀려 간다면?'],
        ['s', '3번 모둠의 꿀벌 세계와 이어진다면? 과일은 꿀벌이 꽃가루를 옮겨 줘야 열려요!'],
      ] },
    ],
  },
  // WORLD-LOOK(10-08 교사 '그래픽이 학교 메타버스에 갇힌 느낌'): 하늘 마을 = '파스텔 사탕 나라' — 분홍 하늘 · 꽃잎 알갱이 · 만화 그림자 · 사탕색 화면(아래 정림초는 분홍 안개 너머로 흐리게)
  toon: [140, 200, 245, 255],
  looks: { candy: { top: 0xffb3dd, horizon: 0xffeef7, fogColor: 0xffe3f1, fog: [38, 115], hemi: [0xfff3fb, 0xbdf5cf, 1.45], sun: [0xfff2e6, 2.4], exp: 1.12, clouds: 0xffd6ec, far: 300, ui: 'fruit', minimap: false,
    amb: { color: 0xffffff, n: 170, r: 22, size: 0.24, rise: -0.01, wind: [0.1, 0.04], opacity: 0.85 },
    sunset: { top: 0xff8fb8, horizon: 0xffd0b5, fogColor: 0xffcdbf, hemi: [0xffe0d6, 0xa8d8b0, 1.3], sun: [0xffb07a, 2.0] },
    night: { top: 0x2a1d5c, horizon: 0x5b3f8f, fogColor: 0x4b3a7a, hemi: [0x9f8fd8, 0x3d5a4a, 1.05], sun: [0xc8b8ff, 0.8], stars: true, exp: 1.15 } } },
  steps: [
    { say: [['이야기', '점심시간, 운동장. 하늘을 올려다보니 커다란 초록 구름이 떠 있었어요. 그 위에서 무언가 반짝였어요.']] },
    { fx: 'portal', id: 'up', at: [-4, -1.35, 10], color: 0x7cf0c4 },
    { use: 'up', label: '🌈 초록 빛 속으로 들어가기', goal: '🌈 운동장의 초록 빛으로 가 봐요', r: 1.8 },
    { glow: 'me', color: 0x9ef07a },
    { dark: 1.6 },
    { look: 'candy' },
    // 하늘 위 마을 짓기(아이들 지도 3×3)
    { fx: 'cloud', id: 'cloud', at: A(-4, 14), w: 48, d: 48, static: true, pop: false },
    { solid: [[-28, Y - 1.2, -10, 20, Y, 38], [-8, Y, -6.2, 0, Y + 4.5, 0.2], [8.5, Y, 12, 13.5, Y + 3, 16], [8.5, Y, 27, 13.5, Y + 3, 31], [-24, Y, 27.2, -14, Y + 1.2, 28.8], [-24, Y, -5.5, -14, Y + 1, -0.5]] },
    { solid: [[-28.5, Y, -10.5, 20.5, Y + 12, -9.4], [-28.5, Y, 37.4, 20.5, Y + 12, 38.5], [-28.5, Y, -10.5, -27.4, Y + 12, 38.5], [19.4, Y, -10.5, 20.5, Y + 12, 38.5]] },   // 구름 끝 = 보이지 않는 벽(놀이 경계 arena는 높이 12 m 아래만 받음)
    { fx: 'puff', id: 'blue', at: A(-4, 14, 24), s: 1.6, color: 0x7ab8ff, static: true, pop: false },
    { fx: 'stage', id: 'stage', at: A(-19, -3), h: 180, static: true, pop: false },
    { fx: 'castle', id: 'castle', at: A(-4, -3), h: 180, static: true, pop: false },
    { fx: 'house', id: 'vh1', at: A(8, -4), h: 180, w: 2.4, color: 0xfff1d6, roof: 0xffa94d, static: true, pop: false },
    { fx: 'house', id: 'vh2', at: A(14, -1), h: 180, w: 2.4, color: 0xfff1d6, roof: 0xff6b81, static: true, pop: false },
    { fx: 'house', id: 'vh3', at: A(10, 3), h: 180, w: 2.4, color: 0xfff1d6, roof: 0xa66cff, static: true, pop: false },
    { fx: 'tree', id: 't1', at: A(-23, 10), fruit: 0xe74c3c, static: true, pop: false },
    { fx: 'tree', id: 't2', at: A(-15, 11), fruit: 0xffa94d, static: true, pop: false },
    { fx: 'tree', id: 't3', at: A(-22, 19), fruit: 0xa66cff, static: true, pop: false },
    { fx: 'tree', id: 't4', at: A(-14, 19), fruit: 0x51cf66, static: true, pop: false },
    { fx: 'water', id: 's1', at: A(-4, 7.5), w: 14, d: 1.2, static: true, pop: false },
    { fx: 'water', id: 's2', at: A(-4, 20.5), w: 14, d: 1.2, static: true, pop: false },
    { fx: 'portal', id: 'down', at: A(-4, 14), color: 0xffd23c, pop: false },
    { fx: 'house', id: 'kh', at: A(11, 14), h: 270, w: 5, color: 0xc9e4a6, roof: 0x6d4c2f, sign: 0x8bc34a, static: true, pop: false },
    { fx: 'house', id: 'ch', at: A(11, 29), h: 270, w: 5, color: 0xffd6e7, roof: 0xd81b3c, sign: 0xd81b3c, static: true, pop: false },
    { fx: 'shop', id: 'shop', at: A(-19, 28), static: true, pop: false },
    { fx: 'tidy', id: 'g1', at: A(-8, 33), static: true, pop: false },
    { fx: 'tidy', id: 'g2', at: A(0, 33), static: true, pop: false },
    { fx: 'nyonyo', id: 'king', at: A(-4, 1.6), h: 180, s: 1.4, crown: true, pop: false },
    ...NY.map(([id, c, x, z]) => ({ fx: 'nyonyo', id, at: A(x, z), color: c, pop: false })),
    { wander: NY.filter(n => n[4] === 'v').map(n => n[0]), rect: RECT.v, speed: 0.9 },
    { wander: NY.filter(n => n[4] === 'f').map(n => n[0]), rect: RECT.f, speed: 0.9 },
    { wander: NY.filter(n => n[4] === 'p').map(n => n[0]), rect: RECT.p, speed: 0.8 },
    { arena: null },
    { tp: A(-4, 16.6, 0.05), h: 0 },
    { chapter: 1 },
    { say: [
      ['이야기', '눈을 떠 보니 우리는 초록 구름 위에 서 있었어요. 저 아래로 정림초 운동장이 보였어요!'],
      ['이야기', '동글동글한 요정들이 통통 굴러다녔어요. 과일 세계의 요정, "뇨뇨"들이에요.'],
    ] },
    { book: 0 },
    // 2장 — 키위 또는 체리(아이들 규칙: 처음 온 친구는 둘 중 골라야 해요)
    { chapter: 2 },
    { ask: ['이야기', '이 세계에 들어오면 키위나 체리 중 하나가 되어야 해요. 누가 될까요?'], choices: ['🥝 키위 — 정원 관리자 · 만능 분홍 가위', '🍒 체리 — 아이돌 · 날개 · 마법 체리'], set: 'role' },
    { if: { role: 0 }, then: [
      // ───── 🥝 키위 ─────
      { body: 'fairyK' },
      { fx: 'fairyC', id: 'cher', at: A(8, 29), h: 270, pop: false },
      { chapter: 3 },
      { fxMove: 'n1', to: 'me', fwd: 1.6, sec: 1.4, arc: 0.4 },
      { fxFace: 'n1' },
      { say: [
        ['키위', '(나는 키위! 이 마을의 정원 관리자야. 어깨엔 만능 분홍 가위가 있지.)'],
        ['귤 뇨뇨', '키위 언니! 정원 풀이 너무 많이 자라서 길이 안 보여요! 수박 뇨뇨가 그 속에서 잠들었는지도 몰라요!'],
      ] },
      { wander: ['n1'], rect: RECT.p, speed: 0.8 },
      { fx: 'bush', id: 'b1', at: A(-7, 28.5), pop: false },
      { fx: 'bush', id: 'b2', at: A(-4, 31.5), pop: false },
      { fx: 'bush', id: 'b3', at: A(-1, 28.5), pop: false },
      { use: 'b1', label: '✂️ 가위로 다듬기', goal: '✂️ 정원의 수풀 다듬기 (1/3)', r: 2.2 },
      { morph: 'b1', to: 'tidy', tone: [[1800, 0, 0.05, 'square', 0.04], [1500, 0.08, 0.05, 'square', 0.04]] },
      { use: 'b2', label: '✂️ 가위로 다듬기', goal: '✂️ 정원의 수풀 다듬기 (2/3)', r: 2.2 },
      { morph: 'b2', to: 'tidy' },
      { use: 'b3', label: '✂️ 가위로 다듬기', goal: '✂️ 정원의 수풀 다듬기 (3/3)', r: 2.2 },
      { morph: 'b3', to: 'tidy' },
      { fx: 'nyonyo', id: 'wm', at: A(-1, 29.2), color: 0x51cf66, anim: 'sleep' },
      { emote: 'wm', icon: '💤' },
      { say: [
        ['이야기', '마지막 수풀 속에서 쿨쿨 자고 있던 수박 뇨뇨가 나왔어요.'],
        ['키위', '찾았다! 역시 잠꾸러기 수박 뇨뇨. 가위가 없었으면 마법도, 정원 일도 못 했을 거야.'],
        ['키위', '이제 집으로 가서 파티를 열어야지. 순간이동!'],
      ] },
      { glow: 'me', color: 0xff7eb6 },
      { dark: 0.9 },
      { tp: A(7.2, 14, 0.05), h: 90 },
      { fxDel: 'wm' },
      { say: [['키위', '뇨뇨들아~ 체리야~ 우리 집에서 파티하자!']] },
      { tone: [[523, 0, 0.12, 'triangle', 0.15], [659, 0.12, 0.12, 'triangle', 0.15], [784, 0.24, 0.2, 'triangle', 0.15]] },
      { wander: ['n1', 'n2', 'n3', 'n8', 'n9', 'n10'], rect: [6.5, 11.5, 8.2, 16.5], speed: 2.5 },
      { fxMove: 'cher', to: A(6.6, 16.8), sec: 2.0, arc: 2.5 },
      { wait: 1.6 },
      { fxAnim: 'cher', anim: 'dance' },
      { emote: 'n2', icon: '🎉' },
      { emote: 'n9', icon: '🎉' },
      { say: [['체리', '키위, 파티 최고야! 매니저님이 여는 파티는 늘 재미있다니까!']] },
      { say: [['이야기', '그런데 키위의 취미는… 뇨뇨들을 놀래키는 것!']] },
      { body: 'nyonyo', color: 0xfafafa, bodyS: 1.1 },
      { toast: '🌱 뇨뇨로 변신! (1분 동안) — 뇨뇨들 뒤로 가서 놀래켜 봐요' },
      { wander: ['n2', 'n3'], rect: null },
      { use: 'n2', label: '😲 뒤에서 "왁!"', goal: '😲 뇨뇨 친구를 놀래켜요 (1/2)', r: 1.8 },
      { emote: 'n2', icon: '😲' },
      { fxAnim: 'n2', anim: 'hop' },
      { use: 'n3', label: '😲 뒤에서 "왁!"', goal: '😲 뇨뇨 친구를 놀래켜요 (2/2)', r: 1.8 },
      { emote: 'n3', icon: '😲' },
      { fxAnim: 'n3', anim: 'hop' },
      { body: 'fairyK' },
      { say: [
        ['키위', '헤헤, 나야 나! 놀랐지? 미안한 마음으로 선물을 줄게.'],
        ['이야기', '키위는 아주아주 가끔 뇨뇨들에게 선물을 줘요. 오늘이 바로 그날!'],
      ] },
      { goal: '🧵 상가의 만물상에서 선물을 만들어요', go: A(-19, 25.5), label: '만물상' },
      { ask: ['키위', '집에서 가져온 물건으로 무엇을 만들까?'], choices: ['🧸 뇨뇨 인형', '🍒 체리 머리핀', '🍭 구름 솜사탕'], set: 'gift',
        reply: [[['키위', '뇨뇨 인형 완성! 뇨뇨들이 자기랑 똑같다며 좋아하겠지?']], [['키위', '체리 머리핀 완성! 체리 공연 때 선물해야지.']], [['키위', '초록 구름을 한 줌 떼어 만든 구름 솜사탕! 달콤해.']]] },
      { fxAnim: 'n1', anim: 'dance' },
    ], else: [
      // ───── 🍒 체리 ─────
      { body: 'fairyC' },
      { fx: 'fairyK', id: 'kiwi', at: A(7.2, 14), h: 270, pop: false },
      { chapter: 3 },
      { say: [['체리', '(나는 체리! 초록 구름에서 가장 유명한 아이돌이야.)']] },
      { tone: [[880, 0, 0.18, 'square', 0.05], [880, 0.3, 0.18, 'square', 0.05], [880, 0.9, 0.18, 'square', 0.05], [880, 1.2, 0.18, 'square', 0.05]] },
      { banner: '📞 따르릉 — 매니저 키위의 전화', bannerSec: 2.2 },
      { wait: 1.2 },
      { say: [['키위', '체리! 오늘 공연 있는 거 알지? 하늘에서 가장 큰 공연장으로 늦지 않게 와야 해!']] },
      { note: '🎤 오늘의 공연 일정\n① 공연장 무대에 서기\n② 노래 한 곡\n③ 뇨뇨 팬들에게 인사\n— 매니저 키위' },
      { ask: ['체리', '가방 속 마법 체리를 하나 먹어 볼까?'], choices: ['🏃 빨리 뛰기 체리', '🙈 숨기 체리', '🌙 야간 시야 체리', '🌀 변신 체리'], set: 'cherry' },
      { if: { cherry: 0 }, then: [
        { phys: { speed: 2.0, sec: 15, endMsg: '🍒 빨리 뛰기 체리 효과가 끝났어요' } },
        { glow: 'me', color: 0xff5fa2 },
        { toast: '🏃 15초 동안 빨라져요!' },
      ] },
      { if: { cherry: 1 }, then: [
        { body: 'none' },
        { toast: '🙈 몸이 투명해졌어요! (6초)' },
        { wait: 6 },
        { body: 'fairyC' },
      ] },
      { if: { cherry: 2 }, then: [
        { time: 'night' },
        { toast: '🌙 밤이 되어도 잘 보여요 — 어두운 하늘이 환하게!' },
        { wait: 4 },
        { time: 'day' },
      ] },
      { if: { cherry: 3 }, then: [
        { body: 'nyonyo', color: 0xff6b81, bodyS: 1.1 },
        { toast: '🌀 딸기 뇨뇨로 변신! (5초)' },
        { wait: 5 },
        { body: 'fairyC' },
      ] },
      { phys: { gravity: 0.35, jump: 3.2 } },
      { toast: '🍒 날개를 펴요! Space를 누르면 높이 날아올라요' },
      { goal: '🎤 날개를 펴고 공연장으로! (위쪽 왼편)', go: A(-19, 3.5), label: '공연장', r: 3 },
      { phys: null },
      { wander: NY.map(n => n[0]), rect: null },
      ...NY.map((n, k) => ({ fxMove: n[0], to: A(-23 + (k % 5) * 2, 3 + Math.floor(k / 5) * 2.2), sec: 1.8, arc: 0.6, wait: false })),   // 팬들이 무대 앞 두 줄로
      { fxMove: 'kiwi', to: A(-13.5, 2.5), sec: 0.8 },
      { fxFace: 'kiwi' },
      { say: [['키위', '딱 맞춰 왔네! 무대로 올라가, 체리!']] },
      { tp: A(-19, -3.2, 1.05), h: 180 },
      { wait: 1.2 },
      { stay: true },
      ...NY.map(n => ({ fxFace: n[0] })),
      { ask: ['체리', '어떤 노래를 부를까?'], choices: ['🎵 초록 구름 위에서', '🎵 뇨뇨 댄스', '🎵 파란 비가 내리면'], set: 'song' },
      { tone: [[523, 0, 0.25, 'sine', 0.12], [659, 0.25, 0.25, 'sine', 0.12], [784, 0.5, 0.25, 'sine', 0.12], [1047, 0.75, 0.5, 'sine', 0.12], [784, 1.3, 0.25, 'sine', 0.12], [880, 1.55, 0.6, 'sine', 0.12]] },
      { glow: 'me', color: 0xffd23c },
      ...NY.map(n => ({ fxAnim: n[0], anim: 'dance' })),
      { emote: 'n2', icon: '❤️' }, { emote: 'n5', icon: '❤️' }, { emote: 'n9', icon: '😍' },
      { say: [
        ['뇨뇨들', '뇨뇨뇨~! 체리! 체리! 체리!'],
        ['체리', '고마워 뇨뇨들아! 이 마이크에 깃든 뇨뇨의 영혼 덕분에 오늘도 멋지게 부를 수 있었어.'],
        ['키위', '(매니저로서 아주 뿌듯해!)'],
      ] },
      { free: true },
    ] },
    // 4장 — 뇨뇨 왕(모두)
    { chapter: 4 },
    { goal: '👑 성 앞의 뇨뇨 왕에게 인사해요', go: A(-4, 3.8), label: '뇨뇨 왕', r: 2.6 },
    { fxFace: 'king' },
    { say: [
      ['뇨뇨 왕', '오, 오늘도 마을이 즐겁구나. 정원 관리자 키위와 아이돌 체리는 내가 봐도 놀랄 만큼 유명하지!'],
      ['뇨뇨 왕', '나는 이 세계에서 가장 먼저 깨어난 뇨뇨란다. 그런데… 내가 원래 무슨 과일이었는지는 나도 기억이 안 나는구나.'],
      ['뇨뇨 왕', '그리고 요즘 저 위 파란 구름이 다시 짙어지고 있어. 요정 비가 또 내리면, 이번엔 무엇이 요정이 될까…'],
      ['뇨뇨 왕', '정림초로 내려가는 무지개 구름 문은 광장 한가운데에 있단다. 또 놀러 오렴!'],
    ] },
    // 마지막 장 — 정림초로
    { chapter: 5 },
    { use: 'down', label: '🌈 정림초로 내려가기', goal: '🌈 광장 가운데 무지개 구름 문으로', r: 2.2 },
    { glow: 'me', color: 0xffd23c },
    { dark: 1.6 },
    { look: null },
    { arena: 'school' },
    { phys: null },
    { body: null },
    { tp: [-4, -1.35, 13], h: 0 },
    { fxDel: 'up' },
    { say: [['이야기', '다시 정림초 운동장. 하늘의 초록 구름 위에서 작은 뇨뇨 하나가 손을 흔드는 것 같았어요.']] },
    { end: {
      title: '과일 세계',
      body: '초록 구름 위 과일 세계에서 키위·체리가 되어 하루를 보냈어요. 우리 모둠이 그린 지도 그대로 마을이 생겼어요!',
      listTitle: '✨ 세계를 넓히려고 더한 것 · 📖 자세한 건 세계 안내서에',
      list: [
        '마을 배치 = 우리 모둠이 그린 3×3 지도 그대로(공연장·성·뇨뇨 마을 / 들판·광장·키위 집 / 상가·정원·체리 집)',
        '가는 길 = 운동장의 초록 빛 · 돌아오는 길 = 광장 가운데 무지개 구름 문',
        '요정 비 · 키위와 체리만 사람 모양이 된 까닭(무지개 끝자락)',
        '뇨뇨들의 과일별 성격(' + NAMES + ')',
        '키위의 하루: 정원 수풀 다듬기 → 잠든 수박 뇨뇨 → 순간이동 → 파티 → 뇨뇨로 변신해 놀래키기 → 만물상 선물',
        '체리의 하루: 매니저 키위의 전화 → 공연 일정 쪽지 → 마법 체리 → 날개로 날아 공연장 → 노래(세 곡 이름은 지어낸 것)',
        '뇨뇨 왕의 비밀(원래 무슨 과일이었는지 기억 못 함) · 파란 구름이 다시 짙어짐',
        '🌱 다음 이야기 씨앗 7개 — 📖 세계 안내서 마지막 쪽',
      ],
    } },
  ],
};

// ───────── 자유 탐험(SANDBOX · 10-07 교사 '마법사 마을 깊이가 최소 · E만 누르지 말고 보이는 모습 · 40분 고민했는데 3분이면 허무') ─────────
//   키위 집·체리 집 문 앞에서 옷 갈아입기(아이들 규칙: 키위 또는 체리) · 키위 = F ✂️ 가위 · R 🌀 순간이동 · X 🌱 뇨뇨 변신 / 체리 = F 🎤 노래 · R 🍒 마법 체리 · Space 날개(성 지붕까지)
const PLACES = [A(-19, 3.5), A(-4, 3.8), A(11, 4.5), A(-15.5, 14), A(-4, 16.6), A(7.2, 14), A(-19, 25.5), A(-4, 26), A(7.2, 29)];
const PLN = ['🎤 공연장', '🏰 성', '🏡 뇨뇨 마을', '🍎 과일 들판', '⛲ 광장', '🥝 키위 집', '🧵 상가', '🌼 정원', '🍒 체리 집'];
const PHONE = [
  { tone: [[880, 0, 0.18, 'square', 0.05], [880, 0.3, 0.18, 'square', 0.05], [880, 0.9, 0.18, 'square', 0.05], [880, 1.2, 0.18, 'square', 0.05]] },
  { banner: '📞 따르릉 — 매니저 키위의 전화', bannerSec: 2 }, { wait: 1 },
  { say: [['키위', '체리! 이번 주 공연 일정 알지? 공연장에서 팬 뇨뇨들이 기다려. 날개로 날아가면 금방이야!']] },
  { note: '🎤 이번 주 일정\n① 공연장에서 노래(F 🎤)\n② 팬 사인회\n③ 성 지붕 위에서 사진 찍기(날개로!)\n— 매니저 키위' },
];
STORY.sandbox = {
  title: '과일 세계의 신기한 일',
  skills: [
    { k: 'cut', key: 'KeyF', icon: '✂️', name: '가위', need: { role: 0 }, anim: 'swing', color: 0xff7eb6, tone: [[1800, 0, 0.05, 'square', 0.04], [1500, 0.08, 0.05, 'square', 0.04]] },
    { k: 'tp', key: 'KeyR', icon: '🌀', name: '순간이동', need: { role: 0 }, color: 0xff7eb6, swirl: 6, steps: [
      { ask: ['키위', '어디로 순간이동할까?'], choices: PLN, set: 'tpTo' }, { tpBy: { var: 'tpTo', to: PLACES } }, { found: 'teleport' }] },
    { k: 'trans', key: 'KeyX', icon: '🌱', name: '변신', need: { role: 0 }, color: 0x9ef07a, swirl: 5, steps: [
      { if: { tr: 1 }, then: [{ body: 'fairyK' }, { seti: { tr: 0 } }, { toast: '🥝 다시 키위!' }], else: [{ body: 'nyonyo', color: 0xfafafa, bodyS: 1.1 }, { seti: { tr: 1 } }, { toast: '🌱 하얀 뇨뇨로 변신! (X = 돌아오기)' }] }] },
    { k: 'sing', key: 'KeyF', icon: '🎤', name: '노래', need: { role: 1 }, anim: 'sing', color: 0xffd23c, emote: '🎵', affect: { kind: 'nyonyo', anim: 'dance', r: 7, come: true }, tone: [[523, 0, 0.18, 'sine', 0.1], [659, 0.18, 0.18, 'sine', 0.1], [784, 0.36, 0.3, 'sine', 0.1]] },
    { k: 'cherry', key: 'KeyR', icon: '🍒', name: '마법 체리', need: { role: 1 }, color: 0xd81b3c, steps: [
      { ask: ['체리', '가방 속 마법 체리 — 무엇을 먹을까?'], choices: ['🏃 빨리 뛰기', '🙈 숨기', '🌙 야간 시야', '🌀 변신'], set: 'ch2' },
      { if: { ch2: 0 }, then: [{ phys: { gravity: 0.3, jump: 5.2, speed: 2.0, sec: 12, after: { gravity: 0.3, jump: 5.2 }, endMsg: '🍒 빨리 뛰기 끝!' } }, { toast: '🏃 12초 동안 빨라져요' }] },
      { if: { ch2: 1 }, then: [{ body: 'none' }, { toast: '🙈 6초 동안 투명!' }, { wait: 6 }, { body: 'fairyC' }] },
      { if: { ch2: 2 }, then: [{ time: 'night' }, { toast: '🌙 밤에도 환하게 보여요 (8초)' }, { wait: 8 }, { time: 'day' }] },
      { if: { ch2: 3 }, then: [{ body: 'nyonyo', color: 0xff6b81, bodyS: 1.1 }, { toast: '🌀 딸기 뇨뇨! (8초)' }, { wait: 8 }, { body: 'fairyC' }] },
      { found: 'cherrymagic' }] },
  ],
  exit: { use: 'down', r: 2.2, label: '🌈 정림초로 내려가기' },
  acts: [
    { need: { role: 1 }, start: { at: A(8.4, 16.4), r: 1.6, label: '👗 키위 집에서 키위로 바꾸기' }, steps: [{ body: 'fairyK' }, { seti: { role: 0, tr: 0 } }, { phys: null }, { fxDel: 'kiwi' }, { fx: 'fairyC', id: 'cher', at: A(7.4, 31), h: 270 }, { toast: '🥝 키위가 됐어요! F 가위 · R 순간이동 · X 변신' }] },
    { need: { role: 0 }, start: { at: A(8.4, 31.4), r: 1.6, label: '👗 체리 집에서 체리로 바꾸기' }, steps: [{ body: 'fairyC' }, { seti: { role: 1, tr: 0 } }, { phys: { gravity: 0.3, jump: 5.2 } }, { fxDel: 'cher' }, { fx: 'fairyK', id: 'kiwi', at: A(7.2, 16.5), h: 270 }, { toast: '🍒 체리가 됐어요! F 노래 · R 마법 체리 · Space 날개' }, { ifFound: 'phone', else: [...PHONE, { found: 'phone' }] }] },
    { start: { use: 'king', r: 2.4, label: '💬 뇨뇨 왕과 이야기' }, steps: [{ sayOne: [
      ['뇨뇨 왕', '광장 아래 시냇물의 돌들은 무지개 색이란다. 빨주노초파 순서로 밟으면 좋은 일이 생긴다지.'],
      ['뇨뇨 왕', '정원 흙에 씨앗을 심고 시냇물을 주면, 구름 위에서도 나무가 자란단다.'],
      ['뇨뇨 왕', '성 옆에 둔 파란 빗물 병이 보이니? 요정 비가 조금 담겨 있어. 과일나무에 뿌려 보렴.'],
      ['뇨뇨 왕', '체리의 노래를 광장 무지개 문 앞에서 들으면, 마이크 속 누군가가 나올지도 몰라.'],
    ] }] },
    { start: { use: 'n1', r: 2, label: '💬 귤 뇨뇨' }, steps: [{ sayOne: [['귤 뇨뇨', '있잖아 있잖아, 들판 뇨뇨들이 술래잡기하고 싶대! 근데 걔네 진짜 빨라!'], ['귤 뇨뇨', '키위 언니 가위는 만능이야. 수풀도 자르고 리본도 자르고!']] }] },
    { start: { use: 'n9', r: 2, label: '💬 하얀 뇨뇨' }, steps: [{ sayOne: [['하얀 뇨뇨', '나도 왕님처럼 하얀색이야. 혹시 우리 둘 다 같은 과일이었을까?'], ['하얀 뇨뇨', '구름 끝에서 아래를 보면 정림초가 보여. 운동장이 엄청 작아!']] }] },
  ],
  disc: [
    { k: 'garden', t: '✂️ 정원 수풀 가위로 다듬기', h: '키위가 되어 정원(아래 가운데) 수풀에 가위(F)', mark: 'gb1', need: { role: 0 }, lock: '키위일 때 — 키위 집에서 옷 갈아입기', start: { skill: 'cut', on: 'gb1', r: 1.5 }, steps: [
      { morph: 'gb1', to: 'tidy' }, { waitSkill: { k: 'cut', on: 'gb2', goal: '✂️ 수풀 다듬기 (2/3)', r: 2 } }, { morph: 'gb2', to: 'tidy' },
      { waitSkill: { k: 'cut', on: 'gb3', goal: '✂️ 수풀 다듬기 (3/3)', r: 2 } }, { morph: 'gb3', to: 'tidy' },
      { fx: 'nyonyo', id: 'wm2', at: A(3, 29.6), color: 0x51cf66, anim: 'sleep' }, { emote: 'wm2', icon: '💤' },
      { say: [['키위', '찾았다, 잠꾸러기 수박 뇨뇨! 수풀이 너무 자라서 그 속에서 잠들었구나.']] }, { wander: ['wm2'], rect: [-9, 26, 1, 34], speed: 0.6 }] },
    { k: 'party', t: '🎉 키위 집에서 파티 열기', h: '키위가 되어 키위 집 앞에서', mark: A(8.2, 14), need: { role: 0 }, lock: '키위일 때', start: { at: A(8.2, 13), r: 1.6, label: '🎉 파티 열기' }, steps: [
      { say: [['키위', '뇨뇨들아~ 체리야~ 우리 집에서 파티하자!']] }, { tone: [[523, 0, 0.12, 'triangle', 0.15], [659, 0.12, 0.12, 'triangle', 0.15], [784, 0.24, 0.2, 'triangle', 0.15]] },
      ...NY.map((n, k) => ({ fxMove: n[0], to: A(4.6 + (k % 4) * 1.2, 11.4 + Math.floor(k / 4) * 1.4), sec: 1.6, arc: 0.6, wait: false })), { wait: 1.8 },
      ...NY.map(n => ({ fxAnim: n[0], anim: 'dance' })), { emote: 'n2', icon: '🎉' }, { emote: 'n9', icon: '🎉' },
      { say: [['뇨뇨들', '뇨뇨~! 파티다 파티!'], ['키위', '(아주아주 가끔 주는 선물도 오늘 다 같이 나눠야지!)']] },
      ...NY.filter(n => n[4] === 'p').map(n => ({ wander: [n[0]], rect: RECT.p, speed: 0.8 })), ...NY.filter(n => n[4] === 'v').map(n => ({ wander: [n[0]], rect: RECT.v, speed: 0.9 })), ...NY.filter(n => n[4] === 'f').map(n => ({ wander: [n[0]], rect: RECT.f, speed: 0.9 }))] },
    { k: 'surprise', t: '😲 뇨뇨로 변신해 친구들 놀래키기', h: '키위가 되어 변신(X) — 들판 뇨뇨 셋에게 살금살금', need: { role: 0 }, lock: '키위일 때', start: { skill: 'trans' }, steps: [
      { body: 'nyonyo', color: 0xfafafa, bodyS: 1.1 }, { seti: { tr: 1 } }, { say: [['키위', '(헤헤, 하얀 뇨뇨로 변신! 들판 뇨뇨들한테 몰래 다가가서… 왁!)']] },
      { wander: ['n5', 'n6', 'n7'], rect: null },
      { catch: { ids: ['n5', 'n6', 'n7'], goal: '😲 들판 뇨뇨 놀래키기', r: 1.0, then: 'stay', color: 0xffffff } },
      { emote: 'n5', icon: '😲' }, { emote: 'n6', icon: '😲' }, { emote: 'n7', icon: '😲' },
      { body: 'fairyK' }, { seti: { tr: 0 } }, { say: [['키위', '나야 나! 놀랐지? 키위의 취미는 뇨뇨 놀래키기랍니다~']] }, { wander: ['n5', 'n6', 'n7'], rect: RECT.f, speed: 0.9 }] },
    { k: 'gift', t: '🧵 만물상에서 선물 만들기', h: '키위가 되어 키위 집 앞 재료 상자를 상가(왼쪽 아래)로 날라요', mark: 'mat', need: { role: 0 }, lock: '키위일 때', start: { use: 'mat', r: 1.8, label: '📦 재료 상자 들기' }, steps: [
      { carry: { id: 'mat', to: A(-19, 27.2, 1.25), goal: '📦 재료 상자를 만물상(상가)으로', r: 2.2 } },
      { ask: ['키위', '이 재료로 무엇을 만들까?'], choices: ['🧸 뇨뇨 인형', '🍒 체리 머리핀', '🍭 구름 솜사탕'], set: 'gift' },
      { fxDel: 'mat' },
      { if: { gift: 0 }, then: [{ fx: 'nyonyo', id: 'made', at: A(-19, 27.6, 1.25), s: 0.35, color: 0xffa94d }] },
      { if: { gift: 1 }, then: [{ fx: 'berry', id: 'made', at: A(-19, 27.6, 1.25), s: 1.2 }] },
      { if: { gift: 2 }, then: [{ fx: 'puff', id: 'made', at: A(-19, 27.6, 1.6), s: 0.07, color: 0xffc6e5 }] },
      { say: [['키위', '완성! 만능 가위로 자르고, 이어 붙이고… 만물상은 이런 걸 만드는 곳이야.']] }] },
    { k: 'teleport', t: '🌀 순간이동으로 마을 건너가기', h: '키위가 되어 순간이동(R) — 아홉 곳 중 하나로', need: { role: 0 }, lock: '키위일 때' },
    { k: 'farm', t: '🌱 구름 위 농사 짓기', h: '정원 남쪽 흙밭 — 상가의 씨앗, 시냇물 물동이를 날라요', mark: 'plot', start: { use: 'plot', r: 1.8, label: '🌱 흙밭 살펴보기' }, steps: [
      { say: [['이야기', '폭신한 흙밭이에요. 여기에 씨앗을 심고 물을 주면 뭔가 자랄 것 같아요.']] },
      { carry: { id: 'sd', to: 'plot', goal: '🌰 상가의 씨앗을 흙밭으로', r: 1.4, del: true } },
      { fx: 'sprout', id: 'sp', at: A(-4, 34.2), s: 2 },
      { carry: { id: 'bk', to: 'plot', goal: '💧 시냇물 물동이를 흙밭으로', r: 1.4, del: true } },
      { rain: { at: A(-4, 34.2, 0), r: 1.2, n: 30, color: 0x6ec6ff, size: 0.08, h: 2.5, puffs: 4 } },
      { fxScale: 'sp', s: 4, sec: 1.2 }, { morph: 'sp', to: 'tree', s: 0.9, fruit: 0xff6b81 },
      { say: [['이야기', '쑥쑥! 구름 위에서 복숭아나무가 자랐어요. 과일 세계의 과일들도 이렇게 자랐겠지요?']] }] },
    { k: 'concert', t: '🎤 공연장에서 노래하기', h: '체리가 되어 공연장(왼쪽 위) 앞에서', mark: A(-19, 1.5), need: { role: 1 }, lock: '체리일 때 — 체리 집에서 옷 갈아입기', start: { at: A(-19, 1.6), r: 2, label: '🎤 공연 시작하기' }, steps: [
      ...NY.map((n, k) => ({ fxMove: n[0], to: A(-23 + (k % 5) * 2, 3 + Math.floor(k / 5) * 2.2), sec: 1.8, arc: 0.6, wait: false })), { wait: 1.6 },
      { tp: A(-19, -3.2, 1.05), h: 180 }, ...NY.map(n => ({ fxFace: n[0] })),
      { ask: ['체리', '어떤 노래를 부를까?'], choices: ['🎵 초록 구름 위에서', '🎵 뇨뇨 댄스', '🎵 파란 비가 내리면'], set: 'song' },
      { tone: [[523, 0, 0.25, 'sine', 0.12], [659, 0.25, 0.25, 'sine', 0.12], [784, 0.5, 0.25, 'sine', 0.12], [1047, 0.75, 0.5, 'sine', 0.12]] }, { glow: 'me', color: 0xffd23c },
      ...NY.map(n => ({ fxAnim: n[0], anim: 'dance' })), { emote: 'n2', icon: '❤️' }, { emote: 'n5', icon: '❤️' },
      { say: [['뇨뇨들', '뇨뇨뇨~! 체리! 체리!'], ['체리', '고마워, 팬 뇨뇨들! 오늘도 최고였어!']] },
      ...NY.filter(n => n[4] === 'p').map(n => ({ wander: [n[0]], rect: RECT.p, speed: 0.8 })), ...NY.filter(n => n[4] === 'v').map(n => ({ wander: [n[0]], rect: RECT.v, speed: 0.9 })), ...NY.filter(n => n[4] === 'f').map(n => ({ wander: [n[0]], rect: RECT.f, speed: 0.9 }))] },
    { k: 'phone', t: '📞 매니저 키위의 전화', h: '체리가 되면 전화가 와요', need: { role: 1 }, lock: '체리일 때' },
    { k: 'cherrymagic', t: '🍒 마법 체리 먹어 보기', h: '체리가 되어 마법 체리(R)', need: { role: 1 }, lock: '체리일 때' },
    { k: 'tower', t: '🏰 날개로 성 지붕 올라가기', h: '체리가 되어 성(위 가운데) 옆에서 Space로 높이 날아 지붕 위로', mark: A(-4, -3), need: { role: 1 }, lock: '체리일 때', start: { near: A(-4, -3, 4.5), r: 3.2, dy: 0.8 }, steps: [
      { banner: '🏰 성 지붕 위! 초록 구름 마을과 아래 정림초가 한눈에', bannerSec: 2.8 }, { glow: 'me', color: 0xffd23c },
      { say: [['체리', '와, 여기서 보니까 우리 마을이 키위가 그린 지도랑 똑같아! 저 아래 정림초 운동장도 보여.']] }] },
    { k: 'kiwiangry', t: '😤 매니저 키위를 화나게 하면…', h: '체리가 되어 키위와 이야기 — 장난으로 놀려 볼까?', mark: 'kiwi', need: { role: 1 }, lock: '체리일 때', start: { use: 'kiwi', r: 2.2, label: '💬 매니저 키위와 이야기' }, steps: [
      { fxFace: 'kiwi' }, { ask: ['키위', '체리, 무슨 일이야? 다음 공연 준비는 잘 돼 가?'], choices: ['🙂 늘 고마워, 매니저!', '😝 매니저 일 대충 하잖아~ 메롱!'], set: 'rude' },
      { if: { rude: 0 }, then: [{ emote: 'kiwi', icon: '😊' }, { say: [['키위', '헤헤, 고마워! 그런데… 내가 화나면 어떻게 되는지 알아? 관심 끊고 순간이동해 버린다~']] }, { cancel: true }],
        else: [
          { emote: 'kiwi', icon: '😤', sec: 3 }, { say: [['키위', '흥! 이제 체리한테 관심 안 줄 거야. 매니저 그만둘래!']] },
          { glow: 'kiwi', color: 0xff7eb6 }, { fxMove: 'kiwi', to: A(14, 1.5), sec: 0.2 }, { toast: '🌀 키위가 순간이동해 버렸어요! 쫓아가 봐요' },
          { goal: '😤 순간이동한 키위를 찾아가요', go: 'kiwi', label: '키위', r: 2.2 }, { fxMove: 'kiwi', to: A(-21, 18), sec: 0.2 }, { emote: 'kiwi', icon: '😤' },
          { goal: '😤 또 사라졌어요! 키위를 찾아가요', go: 'kiwi', label: '키위', r: 2.2 }, { fxMove: 'kiwi', to: A(0, 33), sec: 0.2 }, { emote: 'kiwi', icon: '😤' },
          { goal: '😤 키위를 찾아가요 (마지막!)', go: 'kiwi', label: '키위', r: 2.2 },
          { say: [['체리', '(키위가 계속 피하네… 진심으로 사과하려면 선물이 필요할 것 같아. 상가에 키위가 좋아하는 키위 머리핀이 있었지!)']] },
          { carry: { id: 'pin', to: 'kiwi', goal: '🎁 상가의 키위 머리핀 선물을 키위에게', r: 2.2, del: true } },
          { emote: 'kiwi', icon: '😊', sec: 3 }, { say: [['체리', '아까는 미안해, 키위. 네가 최고의 매니저야.'], ['키위', '…알았어. 받아 줄게! 우리 다시 최고의 아이돌 팀이야!']] },
          { fxMove: 'kiwi', to: A(7.2, 16.5), sec: 0.2 }] }] },
    { k: 'ghost', t: '👻 마이크 속 뇨뇨의 영혼', h: '체리가 되어 광장 무지개 문 앞에서 노래(F)', mark: 'down', need: { role: 1 }, lock: '체리일 때', start: { skill: 'sing', on: 'down', r: 2.5 }, steps: [
      { fx: 'nyonyo', id: 'gh', at: 'me', dy: 1.4, s: 0.6, ghost: true }, { fxMove: 'gh', to: A(-4, 14, 2.6), sec: 1.6, arc: 0.6 }, { fxAnim: 'gh', anim: 'dance' }, { emote: 'gh', icon: '✨', sec: 3 },
      { say: [['마이크 속 뇨뇨', '체리야, 안녕! 나는 네 마이크 속에 사는 뇨뇨의 영혼이야. 네가 노래할 때마다 나도 같이 노래한단다.'],
        ['마이크 속 뇨뇨', '내가 원래 무슨 과일이었냐고? 그건… 다음에 알려 줄게. 뇨뇨 왕님도 아직 모르는 비밀이거든!']] },
      { fxMove: 'gh', to: 'me', sec: 1.2, arc: 0.4 }, { fxDel: 'gh' }] },
    { k: 'roll', t: '🟢 굴러다니는 뇨뇨 술래잡기', h: '과일 들판(왼쪽 가운데) 뇨뇨들이 도망가요 — 따라가 붙잡아요', mark: A(-19, 14), start: { near: A(-19, 14), r: 3 }, steps: [
      { say: [['수박 뇨뇨', '술래잡기 하자! 우리 넷을 다 잡으면 네가 이겨!']] },
      { spawn: { kind: 'nyonyo', id: 'rn', n: 4, rect: [-24, 9, -14, 19], y: Y, color: [0xff6b81, 0xffe066, 0xa66cff, 0x51cf66] } },
      { catch: { ids: ['rn1', 'rn2', 'rn3', 'rn4'], goal: '🟢 도망가는 뇨뇨 잡기', flee: 2.2, range: 3.2, wander: [-25, 8, -13, 20], speed: 0.8, r: 1.0, then: 'stay', color: 0x9ef07a } },
      { fxAnim: 'rn1', anim: 'dance' }, { fxAnim: 'rn2', anim: 'dance' }, { fxAnim: 'rn3', anim: 'dance' }, { fxAnim: 'rn4', anim: 'dance' },
      { say: [['수박 뇨뇨', '헤헤, 졌다! 뇨뇨는 굴러다니면 엄청 빠른데 대단한걸!']] }] },
    { k: 'rain', t: '🌧 요정 비로 새 뇨뇨 태어나기', h: '성 옆 파란 빗물 병을 과일 들판 사과나무로', mark: 'btl', after: ['king'], start: { use: 'btl', r: 1.8, label: '💧 파란 빗물 병 들기' }, steps: [
      { say: [['뇨뇨 왕', '그 병엔 그날 내린 요정 비가 조금 담겨 있단다. 과일나무에 뿌려 보렴…']] },
      { carry: { id: 'btl', to: 't1', goal: '💧 빗물 병을 들판 사과나무로', r: 2.4, del: true } },
      { rain: { at: 't1', r: 1.6, n: 40, color: 0x7ab8ff, size: 0.09, h: 4, puffs: 6 } }, { wait: 1 },
      { fx: 'orange', id: 'apl', at: 't1', dy: 2.4, s: 1.4, color: 0xe53935 }, { fxMove: 'apl', to: A(-21.6, 11.4), sec: 0.8, arc: 0.3 },
      { morph: 'apl', to: 'nyonyo', s: 0.55, color: 0xe53935 }, { emote: 'apl', icon: '🌱' }, { follow: ['apl'], d: 1.4, speed: 3 },
      { say: [['이야기', '사과 하나가 데구루루 떨어지더니… 아기 뇨뇨가 되었어요! 그날 과일들도 이렇게 요정이 되었을 거예요.'], ['아기 사과 뇨뇨', '뇨…? 뇨뇨!']] }] },
    { k: 'stones', t: '🌈 무지개 징검돌 밟기', h: '광장 아래 시냇물 돌 다섯 — 빨간 돌부터 무지개 색 순서(빨주노초파)로', mark: 'st1', start: { near: 'st1', r: 0.9 }, steps: [
      { say: [['이야기', '시냇물 위 색깔 돌 다섯 개. 뇨뇨 왕이 말한 순서는… 무지개 색!']] },
      { seq: { ids: ['st1', 'st2', 'st3', 'st4', 'st5'], goal: '🌈 무지개 순서로 돌 밟기 (빨주노초파)', r: 0.7, color: 0xffffff, wrong: '앗, 순서가 달라요! 빨간 돌부터 다시', hop: true } },
      { fx: 'rainbow', id: 'rb', at: A(-4, 22.5), s: 1 }, { sound: 'done' },
      { say: [['이야기', '시냇물 위로 무지개가 떴어요! 요정 비가 내린 날에도 이렇게 무지개가 떴대요.']] }] },
    { k: 'king', t: '👑 뇨뇨 왕의 비밀', h: '성 앞의 뇨뇨 왕(이야기 4장)' },
  ],
};
{
  const S = STORY.steps, at = (pred) => S.findIndex(pred), ins = (i, ...a) => S.splice(i, 0, ...a), js = (st) => JSON.stringify(st);
  const after = (L, pred, step) => { for (let i = 0; i < L.length; i++) { const st = L[i]; if (pred(st)) { L.splice(i + 1, 0, step); return true; } for (const k of ['then', 'else']) if (Array.isArray(st[k]) && after(st[k], pred, step)) return true; } return false; };   // 갈래(then·else) 안까지
  after(S, st => st.say && /가위가 없었으면/.test(js(st)), { found: 'garden' });
  after(S, st => st.say && /파티 최고야/.test(js(st)), { found: 'party' });
  after(S, st => st.say && /나야 나! 놀랐지/.test(js(st)), { found: 'surprise' });
  after(S, st => st.ask && /집에서 가져온 물건/.test(js(st)), { found: 'gift' });
  after(S, st => st.say && /순간이동!/.test(js(st)), { found: 'teleport' });
  after(S, st => st.note && /오늘의 공연 일정/.test(st.note), { found: 'phone' });
  after(S, st => st.ask && /마법 체리를 하나/.test(js(st)), { found: 'cherrymagic' });
  after(S, st => st.say && /뇨뇨의 영혼 덕분에/.test(js(st)), { found: 'concert' });
  const iu = at(st => st.use === 'down'); S.splice(iu, 1);   // 나가기는 자유 탐험의 무지개 문으로
  ins(at(st => st.chapter === 5), { found: 'king' },
    { fx: 'bush', id: 'gb1', at: A(-8, 31.5), pop: false }, { fx: 'bush', id: 'gb2', at: A(-4.5, 33), pop: false }, { fx: 'bush', id: 'gb3', at: A(-1, 31.5), pop: false },
    { fx: 'gift', id: 'mat', at: A(8.2, 11.8), s: 2.2, color: 0x8bc34a, pop: false }, { fx: 'gift', id: 'pin', at: A(-16.8, 27.6, 1.25), s: 1.3, color: 0x6ab04c, pop: false },
    { fx: 'mud', id: 'plot', at: A(-4, 34.2, 0.01), s: 1.4, pop: false }, { fx: 'seed', id: 'sd', at: A(-21.4, 27.6, 1.25), s: 2.5, pop: false }, { fx: 'bucket', id: 'bk', at: A(1.4, 21.4), s: 2.2, pop: false },
    { fx: 'potion', id: 'btl', at: A(-1.6, 1.8), s: 2.2, color: 0x7ab8ff, pop: false },
    // 징검돌 다섯 = 오각형 · 무지개 순서는 별 모양(한 칸 건너) — 곧장 가도 다른 돌을 안 밟음 · 개울을 건너가는 길(x −4)엔 빨간 돌이 없음
    { fx: 'stone', id: 'st1', at: A(-2.0, 22.25), color: 0xe53935, pop: false }, { fx: 'stone', id: 'st2', at: A(-6.0, 22.25), color: 0xff9800, pop: false }, { fx: 'stone', id: 'st3', at: A(-2.77, 19.9), color: 0xffeb3b, pop: false },
    { fx: 'stone', id: 'st4', at: A(-4.0, 23.7), color: 0x4caf50, pop: false }, { fx: 'stone', id: 'st5', at: A(-5.23, 19.9), color: 0x2196f3, pop: false },
    { if: { role: 1 }, then: [{ phys: { gravity: 0.3, jump: 5.2 } }, { fxDel: 'kiwi' }, { fx: 'fairyK', id: 'kiwi', at: A(7.2, 16.5), h: 270, pop: false }] },
    { say: [
      ['뇨뇨 왕', '이제 과일 세계를 마음껏 둘러보렴. 키위 집과 체리 집 문 앞에서는 옷을 갈아입을 수도 있단다.'],
      ['뇨뇨 왕', '그리고… 마을이 즐거울수록 저 위 파란 구름이 짙어진다는 옛날이야기가 있지. 정말일까?'],
    ] },
    { free: true },
    { sandbox: true });
}

// ───────── SANDBOX-2(10-08 교사 기본값 '풍성 4 · 놀이 4 · 효과 3~4 · 이야기 4 · 직관성 높게') ─────────
//   들어갈 때 영상(아이들 지도 아홉 곳 이름표) · 하는 법 창 · ☁️ 파란 구름 게이지 = 체리 노래(F)로 뇨뇨를 신나게 · 키위 가위(F)로 과일나무 가지치기 · 신기한 일 →
//   1단계 파란 구름이 커짐 → 2단계 반짝이 비 · 뇨뇨들이 광장에 모여 하늘을 봄 → 가득 = 🌧 요정 비가 다시 내림(뇨뇨 왕이 말한 복선) · 과일이 아기 뇨뇨 셋으로 · 무지개 — 17번째 신기한 일
{
  const SBX = STORY.sandbox;
  const TAGS = PLACES.map((p, i) => ({ t: PLN[i], p: [p[0], Y + 2.2, p[2]] }));
  SBX.how = { title: '과일 세계 — 이렇게 놀아요', lines: [
    ['❓', '노란 ? 를 찾아가요', '화면 위 줄이 가장 가까운 신기한 일을 알려 줘요. [H] = 길 안내 · [B] = 목록'],
    ['👗', '키위 ↔ 체리', '키위 집·체리 집 문 앞에서 옷을 갈아입어요. 지금 능력: {skills}'],
    ['☁️', '파란 구름 게이지', '체리 노래로 뇨뇨를 신나게, 키위 가위로 과일나무 가지치기, 신기한 일을 찾을수록 {meter}이 짙어져요. 가득 차면… 비밀!'],
  ], tip: '체리는 [Space]로 날 수 있어요 · 다 둘러보면 광장 가운데 무지개 문으로 정림초에 내려가요' };
  const BABY = [['nb1', 0xffb4a2, -21, 12.8], ['nb2', 0x8bc34a, -16.4, 12.6], ['nb3', 0x7e57c2, -20.6, 18.2]];
  const ring = NY.map((n, k) => { const a = k / NY.length * Math.PI * 2; return { fxMove: n[0], to: A(-4 + Math.cos(a) * 4.2, 14 + Math.sin(a) * 4.2), sec: 1.8, arc: 0.5, wait: false }; });
  const back = [...NY.filter(n => n[4] === 'p').map(n => ({ wander: [n[0]], rect: RECT.p, speed: 0.8 })), ...NY.filter(n => n[4] === 'v').map(n => ({ wander: [n[0]], rect: RECT.v, speed: 0.9 })), ...NY.filter(n => n[4] === 'f').map(n => ({ wander: [n[0]], rect: RECT.f, speed: 0.9 }))];
  const rains = (c, n, sz) => [A(-4, 14), A(-19, 14), A(11, 14), A(-4, 0), A(-19, 28), A(-4, 28)].map(at => ({ rain: { at, r: 6, n, color: c, size: sz, h: 9, puffs: 6 } }));
  SBX.meter = { icon: '☁️', name: '파란 구름', max: 16, hint: '체리 노래(F) · 키위 가지치기(F) · 신기한 일',
    feed: { disc: 1, skills: { sing: { kind: 'nyonyo', r: 7, n: 1, icon: '🎵', say: '뇨뇨가 신났어요!' }, cut: { kind: 'tree', r: 2.8, n: 1, icon: '✂️', say: '과일나무 가지치기!' } } },
    stages: [
      { at: 8, t: '파란 구름이 커져요', keep: [{ fxScale: 'blue', s: 2.3, rate: 60, sec: 0.01 }, { fx: 'puff', id: 'blue2', at: A(-0.5, 12, 26), s: 1.4, color: 0x5b8ff0, static: true, pop: false }],
        steps: [
          { banner: '☁️ 파란 구름 1단계 — 파란 구름이 점점 커져요!', bannerSec: 2.6 },
          { wait: 0.9 }, { fxScale: 'blue', s: 2.3, rate: 0.9, sec: 0.1 }, { wait: 1.2 }, { fx: 'puff', id: 'blue2', at: A(-0.5, 12, 26), s: 1.4, color: 0x5b8ff0, static: true },
          { emote: 'n8', icon: '❓' }, { emote: 'n9', icon: '😮' }, { emote: 'n10', icon: '❓' },
          { say: [['귤 뇨뇨', '있잖아 있잖아! 파란 구름이 점점 커지고 있어! 뇨뇨 왕님이 말한 옛날이야기 맞지?'], ['하얀 뇨뇨', '우리가 신나게 놀수록 구름이 짙어지는 것 같아… 계속 신나게 놀아 보자!']] },
        ] },
      { at: 12, t: '반짝이 비가 내려요', keep: [{ fx: 'puff', id: 'blue3', at: A(-7.5, 16, 25), s: 1.2, color: 0x3f6fd8, static: true, pop: false }],
        steps: [
          { banner: '☁️ 파란 구름 2단계 — 반짝이 비가 내리고 뇨뇨들이 하늘을 봐요', bannerSec: 2.6 },
          { wait: 0.6 }, { fx: 'puff', id: 'blue3', at: A(-7.5, 16, 25), s: 1.2, color: 0x3f6fd8, static: true },
          ...rains(0xdff0ff, 26, 0.12), ...ring, { glow: ['t1', 't2', 't3', 't4'], color: 0xffe27a },
          ...NY.map(n => ({ fxFace: n[0] })), { emote: 'n1', icon: '✨' }, { emote: 'n5', icon: '✨' },
          { say: [['뇨뇨 왕', '반짝이 비… 요정 비가 내리기 전엔 이렇게 반짝이가 먼저 내린다고 들었단다. 조금만 더 마을이 즐거워지면…!']] },
          ...back,
        ] },
      { at: 16, t: '요정 비', found: 'fairyrain',
        keep: [...BABY.map(([id, c, x, z]) => ({ fx: 'nyonyo', id, at: A(x, z), s: 0.55, color: c, pop: false })), { wander: BABY.map(b => b[0]), rect: RECT.f, speed: 0.7 }, { fx: 'rainbow', id: 'rbw', at: A(-4, 14), s: 1.6, h: 0, pop: false }],
        steps: [
          { time: 'sunset' },
          { banner: '🌧 요정 비! — 파란 구름에서 요정 비가 내려요', bannerSec: 2.6 },
          { tone: [[220, 0, 2.5, 'sine', 0.04, 160]] }, ...rains(0x7ab8ff, 46, 0.1), { wait: 1.6 }, ...rains(0x9cc9ff, 40, 0.09), { wait: 1.6 },
          ...BABY.map(([id, c], i) => ({ fx: 'orange', id, at: 't' + (i + 1), dy: 2.4, s: 1.3 })),
          ...BABY.map(([id, , x, z]) => ({ fxMove: id, to: A(x, z), sec: 0.9, arc: 0.4, wait: false })), { wait: 1 },
          ...BABY.map(([id, c]) => ({ morph: id, to: 'nyonyo', s: 0.55, toColor: c })), { wait: 0.4 },
          { time: 'day' }, { banner: '🌱 과일이 아기 뇨뇨가 되었어요!', bannerSec: 2.4 },
          ...BABY.map(([id]) => ({ fxAnim: id, anim: 'hop' })), { emote: 'nb1', icon: '🌱' }, { emote: 'nb2', icon: '🌱' }, { emote: 'nb3', icon: '🌱' },
          { fx: 'rainbow', id: 'rbw', at: A(-4, 14), s: 1.6, h: 0 }, { sound: 'done' },
          ...NY.map(n => ({ fxAnim: n[0], anim: 'dance' })),
          { say: [
            ['뇨뇨 왕', '요정 비다! 정말로 요정 비가 다시 내렸어! 마을이 즐거우니 파란 구름이 대답해 준 거야.'],
            ['아기 뇨뇨들', '뇨…? 뇨뇨! 뇨뇨뇨!'],
            ['뇨뇨 왕', '그런데 이상하구나… 비를 맞으니 내가 원래 무슨 과일이었는지 조금 생각날 것 같아. 하얗고… 동그랗고… 아니, 다음에 다시 생각해 보마.'],
          ] },
          ...NY.map(n => ({ fxAnim: n[0], anim: 'idle' })), ...BABY.map(([id]) => ({ fxAnim: id, anim: 'idle' })), { wander: BABY.map(b => b[0]), rect: RECT.f, speed: 0.7 },
        ] },
    ] };
  SBX.disc.push({ k: 'fairyrain', t: '🌧 요정 비가 다시 내린 날', h: '☁️ 파란 구름 게이지를 가득 채워요(체리 노래 · 키위 가지치기 · 신기한 일)' });
  const tw = SBX.disc.find(d => d.k === 'tower');
  tw.steps = [
    { banner: '🏰 성 지붕 위! 초록 구름 마을과 아래 정림초가 한눈에', bannerSec: 2.8 }, { glow: 'me', color: 0xffd23c },
    { say: [['체리', '와, 여기서 보니까 우리 마을이 키위가 그린 지도랑 똑같아! 저 아래 정림초 운동장도 보여.']] },
  ];
}
