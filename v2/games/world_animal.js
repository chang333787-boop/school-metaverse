// 상상 세계 '동물 세계' — 세계 판 5번(시아·지원)을 바탕으로 Claude가 세계관을 넓힌 판(WORLD-FX · 10-07)
//   아이들 것: 학교 운동장에서 신기한 물약을 먹고 어린 카피바라가 됨 → 반 친구들이 놀라 신고 → 동물병원에서 건강 검사 → 동물원 카피바라 존에서 돌봄·친구 사귀기 →
//   규칙(밥 거부 금지 · 탈출 시도 금지 — 한 마리가 말을 안 들으면 모두 따라 할 수 있어서) → 반전: 사실 꿈이었다 · 둘 다 같은 꿈이었다
//   화면 사람: 반 친구 = 우리 학교 3D 친구들 · 사육사·구조대원·수의사 = 이름 대신 직업(판의 수아·준혁은 📖 안내서에 그대로) · 하람이는 3D 명단에 없어 안내서에만
export const WHO = { '이야기': '📖', '시아': '🍀', '지원': '🎀', '은규': '🧢', '인우': '⚽', '예지': '🌼', '유은': '⭐', '구조대원': '🚑', '수의사': '🩺', '사육사': '🧑‍🌾', '느릿이': '🦫', '첨벙이': '🦫', '오물이': '🦫' };
const F = (x, z) => [x, -1.35, z];
const ZC = [-22, 16];   // 동물원 카피바라 존(운동장 서쪽)

export const STORY = {
  title: '동물 세계',
  chapters: [],   // 10-08 교사 '애들한테 1~5장으로 설계하라고 한 것도 아닌데 임의로 1~5장 — 김샘' → 장 이름·배너 없음(아이들이 장을 나눈 판만 장을 씀)
  start: { at: F(-2, 9.5), h: 0 },
  book: {
    title: '동물 세계 안내서', chip: '동물 세계 안내서',
    pages: [
      { icon: '🌍', h: '어떤 세계?', items: [
        ['k', '이 세계의 이름은 동물 세계. 어떤 물약을 먹었더니 갑자기 카피바라로 변했기 때문이에요.'],
        ['k', '반전! 그것은 사실 꿈이었어요. 엄청난 것은, 둘 다 같은 꿈이었다는 거예요.'],
        ['a', '동물 세계는 잠든 사이에 우리 학교 위로 겹쳐지는 꿈속 세계예요. 꿈속에서는 운동장에 동물원이 생기고, 보건실은 동물병원이 돼요.'],
        ['a', '두 사람이 같은 꿈을 꾼 까닭은 아직 아무도 몰라요. 꿈에서 깬 뒤에도 무언가가 남아 있다면…?'],
      ] },
      { icon: '🗺', h: '어떤 곳?', items: [
        ['k', '학교 운동장 · 동물원 · 동물병원 · 카피바라 존 · 시아 집 침대'],
        ['k', '학교 운동장에서 신기한 물약을 먹고 어린 카피바라가 되었어요. 반 친구들이 카피바라를 보고 놀라 신고를 했어요.'],
        ['k', '동물병원에 가서 건강을 체크하고, 동물원에서 카피바라를 돌봐 준다고 해서 동물원으로 갔어요. 카피바라 존에 들어가서 친구들을 많이 사귀었어요.'],
        ['a', '카피바라 존: 둥근 나무 울타리 안에 연못과 건초 더미가 있어요. 울타리 남쪽에 작은 틈이 하나 있어요(탈출하면 안 돼요!).'],
      ] },
      { icon: '🦫', h: '누가 나와?', items: [
        ['k', '시아(장난기 많음) · 지원(장난기 또는 호기심) · 사육사 수아(착하고 리더십 많음) · 하람(개구쟁이·호기심) · 유은(똑똑하고 리더십 많음) · 은규·인우·예지·구조해 가는 사람 준혁(무뚝뚝함)'],
        ['a', '카피바라 친구들: 느릿이(느긋해서 늘 졸려요) · 첨벙이(연못 수영 대장) · 오물이(풀을 쉬지 않고 먹는 먹보)'],
        ['a', '진짜 카피바라는 세상에서 가장 큰 쥐 무리(설치류) 동물이에요. 물을 좋아하고 헤엄을 잘 쳐요. 성격이 순해서 새가 등에 앉아도 가만히 있을 만큼 다른 동물과 잘 지내요.'],
      ] },
      { icon: '📜', h: '규칙', items: [
        ['k', '이 세계에서는 밥을 거부하면 안 돼요. 탈출을 시도하면 안 돼요.'],
        ['k', '왜냐하면 말을 안 들으면 다른 카피바라도 따라 해서, 모든 카피바라가 말을 안 들을 수도 있기 때문이에요.'],
        ['a', '카피바라는 무리 지어 살아서 서로 따라 하는 성질이 있어요. 한 마리가 겁을 먹으면 다 같이 물로 뛰어들기도 해요.'],
      ] },
      { icon: '✨', h: '신기한 것', items: [
        ['k', '마법 물약: 마법 물약을 먹고 시아와 지원이가 카피바라로 변했어요.'],
        ['k', '엄청난 것은 둘 다 같은 꿈이었다는 것!'],
        ['a', '물약은 민트빛으로 반짝이고, 마시면 어린 카피바라가 돼요. 같이 마시면 같이 변해요.'],
      ] },
      { icon: '🌱', h: '다음 이야기 씨앗', items: [
        ['s', '다른 친구가 물약을 마시면 무슨 동물이 될까? 은규는? 유은이는?'],
        ['s', '그 물약은 누가 만들었을까? 왜 운동장에 떨어져 있었을까?'],
        ['s', '꿈에서 깼는데 책상 위에 물약 병이 남아 있다면? 정말 꿈이었을까?'],
        ['s', '사육사 수아의 하루는 어떨까? 카피바라 말고 어떤 동물들을 돌볼까?'],
        ['s', '카피바라 친구들(느릿이·첨벙이·오물이)이 거꾸로 우리 학교에 놀러 온다면?'],
        ['s', '반대로, 동물이 물약을 먹고 사람이 된다면 학교에서 무슨 일이 생길까?'],
      ] },
    ],
  },
  // WORLD-LOOK(10-08 교사 '그래픽이 학교 메타버스에 갇힌 느낌'): 물약을 마신 순간부터 '꿈속 동화책' — 라벤더 하늘 · 분홍 안개(학교 건물은 꿈처럼 흐려짐) · 비눗방울 · 꽃 들판 동물원 · 만화 그림자 · 꿈 테두리
  //   하얗게 번쩍 → '사실 꿈이었다' = 원래 학교 화풍으로 돌아옴(꿈과 현실이 화면으로도 갈림)
  toon: [125, 190, 238, 255],
  looks: { dream: { top: 0xb9a6ff, horizon: 0xffe0ee, fogColor: 0xf6dcef, fog: [9, 40], hemi: [0xfff2ff, 0xc5e6b8, 1.4], sun: [0xffe6cc, 2.1], exp: 1.12, clouds: 0xffe6f5, far: 300, ui: 'dream', minimap: false,
    amb: { color: 0xeaf4ff, n: 60, r: 12, size: 0.5, rise: 0.06, wind: [0.05, 0.02], opacity: 0.42 },
    sunset: { top: 0xb68cff, horizon: 0xffc6a8, fogColor: 0xf3c4c9, hemi: [0xffd9e0, 0xb4cfa0, 1.3], sun: [0xffb487, 1.7] },
    night: { top: 0x24195a, horizon: 0x5c4590, fogColor: 0x4e3d80, hemi: [0x9d8ee0, 0x3b4f45, 1.0], sun: [0xbfb0ff, 0.6], stars: true } } },
  steps: [
    { hide: '보건선생님' },
    { npc: '은규', to: F(-4.6, 4.6), face: 180 },
    { npc: '인우', to: F(-3.0, 3.8), face: 180 },
    { npc: '예지', to: F(0.6, 4.0), face: 180 },
    { npc: '유은', to: F(1.9, 4.8), face: 180 },
    { say: [['이야기', '점심시간, 학교 운동장. 우리는 친구들과 놀고 있었어요.']] },
    { me: ['시아', '지원'], ask: '이야기 속에서 누가 되어 볼까요?' },
    { setv: { mate: { 시아: '지원', 지원: '시아' } } },
    { party: ['시아', '지원'] },
    { circle: 'party', r: 1.3 },
    { chapter: 1 },
    { fx: 'potion', id: 'potion', at: F(-2, 7.2) },
    { say: [['{mate}', '어? 저기 반짝이는 게 있어! 병인데… 민트색으로 빛나.']] },
    { use: 'potion', label: '🧪 물약 살펴보기', goal: '🧪 운동장에 떨어진 반짝이는 병을 살펴봐요', r: 1.6 },
    { ask: ['{mate}', '냄새가 엄청 달콤해… 한 모금만 마셔 볼까?'], choices: ['🧪 같이 한 모금!', '🤔 조금 무섭지만… 마셔 볼래'], set: 'drink' },
    { fxDel: 'potion' },
    { glow: 'party', color: 0x7cf0c4 },
    { look: 'dream' },
    { body: 'capy', bodyS: 1, color: 0xa87a4f },
    { hide: { 시아: '지원', 지원: '시아' } },
    { party: [] },
    { fx: 'capy', id: 'mate', at: 'me', side: 0.8, s: 0.5, color: 0x9c6b3f, pop: false },
    { shrink: 0.5, sec: 1.4 },
    { follow: ['mate'], d: 0.7, speed: 3 },
    { emote: 'mate', icon: '😮' },
    { say: [
      ['이야기', '빛이 사라지자… 우리는 어린 카피바라가 되어 있었어요!'],
      ['{mate}', '꾸잉?! 우리 카피바라가 됐어!'],
    ] },
    { act: '유은', pose: 'explain', faceTo: 'me' }, { emote: '유은', icon: '😮' }, { emote: '예지', icon: '❗' }, { emote: '은규', icon: '❓' },
    { say: [
      ['유은', '어? 운동장에 아기 카피바라 두 마리가 있어! 다치면 안 되니까 빨리 신고하자!'],
      ['은규', '…카피바라네.'],
      ['인우', '…진짜네.'],
    ] },
    { fx: 'keeper', id: 'rescue', at: F(-2, 24), h: 180, color: 0xff7a1a, cap: 0xff7a1a, leg: 0x37474f, pop: false },
    { fxMove: 'rescue', to: F(-2, 11.2), sec: 3.2 },
    { fxFace: 'rescue' },
    { say: [['구조대원', '신고 받고 왔습니다. 걱정 마세요, 아기 카피바라들은 동물병원에서 먼저 건강을 확인할게요.']] },
    // 2장 — 동물병원(꿈속에선 보건실이 동물병원)
    { chapter: 2 },
    { dark: 1.6 },
    { fx: 'keeper', id: 'vet', at: [-38, 0, -39.3], color: 0xffffff, cap: 0x4fc3f7, leg: 0x4fc3f7, pop: false },
    { tp: [-36.9, 0, -41.2], h: 210 },
    { fxFace: 'vet' },
    { banner: '🏥 동물병원', bannerSec: 2 },
    { say: [['수의사', '어서 와요, 아기 카피바라들! 건강 검사를 해 볼게요.']] },
    { use: 'vet', label: '🩺 건강 검사 받기', goal: '🩺 수의사 선생님께 가서 검사를 받아요', r: 1.6 },
    { emote: 'me', icon: '❤️' },
    { say: [
      ['수의사', '심장 소리 쿵쿵, 아주 튼튼해요. 이빨도 반짝반짝. 몸무게도 딱 알맞네요!'],
      ['수의사', '카피바라는 물을 좋아하고, 헤엄도 잘 쳐요. 동물원 카피바라 존에서 친구들이랑 지내면 금방 신날 거예요.'],
    ] },
    // 3장 — 카피바라 존(운동장에 생긴 동물원)
    { chapter: 3 },
    { dark: 1.6 },
    { fxDel: 'vet' },
    { fxDel: 'rescue' },
    { fx: 'ground', id: 'mead', at: [-6, -1.338, 16], w: 70, d: 31, c1: 0x93d27c, c2: 0xc6eba0, cell: 1.2, dots: [0xffffff, 0xffd1e8, 0xfff3a0, 0xd9c8ff], ndots: 420, dotR: 0.07, static: true, pop: false },   // 꿈속 운동장 = 꽃 들판(운동장 흙을 덮음)
    { fx: 'pen', id: 'pen', at: F(ZC[0], ZC[1]), r: 5, static: true, pop: false },
    { fx: 'capy', id: 'c1', at: F(-24, 14), s: 0.65, color: 0x8d5f38, anim: 'sleep', pop: false },
    { fx: 'capy', id: 'c2', at: F(-21, 15.6), s: 0.65, color: 0xa87a4f, pop: false },
    { fx: 'capy', id: 'c3', at: F(-24.5, 17.6), s: 0.65, color: 0x96643a, pop: false },
    { fx: 'capy', id: 'c4', at: F(-19.6, 13.2), s: 0.6, color: 0xb08050, pop: false },
    { fx: 'capy', id: 'c5', at: F(-20, 18.4), s: 0.6, color: 0x8a5a34, pop: false },
    { wander: ['c4', 'c5'], rect: [-25, 12, -19, 19], speed: 0.35 },
    { fx: 'keeper', id: 'keeper', at: F(-22, 22.0), h: 0, color: 0x8d7b4a, cap: 0x2e7d32, pop: false },
    { tp: F(-22, 19.6), h: 0 },
    { arena: [-26.4, 11.6, -17.6, 20.4], arenaMsg: '사육사 선생님이 지켜보고 있어요 — 울타리 밖으로는 못 나가요' },
    { banner: '🦫 동물원 카피바라 존', bannerSec: 2 },
    { fxFace: 'keeper' },
    { say: [
      ['사육사', '반가워, 아기 카피바라들! 오늘부터 여기서 지내게 될 거야. 나는 너희를 돌봐 줄 사육사야.'],
      ['사육사', '여기 규칙은 딱 두 가지야. 밥을 거부하면 안 되고, 탈출하려고 하면 안 돼.'],
      ['사육사', '한 마리가 말을 안 들으면 다른 카피바라도 따라 해서, 모두 말을 안 듣게 될 수도 있거든.'],
    ] },
    { say: [['{mate}', '여기 카피바라 친구들이 많아! 친구를 사귀어 보자!']] },
    { use: 'c1', label: '👋 인사하기', goal: '🦫 카피바라 친구 사귀기 (1/3)', r: 1.2 },
    { fxAnim: 'c1', anim: 'idle' }, { fxFace: 'c1' }, { emote: 'c1', icon: '😴' },
    { say: [['느릿이', '하아암… 안녕. 나는 느릿이. 해가 따뜻하면 그냥 계속 졸려…']] },
    { follow: ['mate', 'c1'], d: 0.7, speed: 3 },
    { use: 'c2', label: '👋 인사하기', goal: '🦫 카피바라 친구 사귀기 (2/3)', r: 1.2 },
    { fxFace: 'c2' }, { emote: 'c2', icon: '💦' },
    { say: [['첨벙이', '안녕! 나는 첨벙이! 카피바라는 헤엄을 엄청 잘 쳐. 연못에서 나랑 놀자!']] },
    { follow: ['mate', 'c1', 'c2'], d: 0.7, speed: 3 },
    { use: 'c3', label: '👋 인사하기', goal: '🦫 카피바라 친구 사귀기 (3/3)', r: 1.2 },
    { fxFace: 'c3' }, { fxAnim: 'c3', anim: 'eat' }, { emote: 'c3', icon: '🌿' },
    { say: [['오물이', '오물오물… 안녕. 나는 오물이. 풀은 하루 종일 먹어도 맛있어.']] },
    { follow: ['mate', 'c1', 'c2', 'c3'], d: 0.7, speed: 3 },
    { fxAnim: 'c3', anim: 'idle' },
    { emote: 'party', icon: '❤️' },
    { say: [['이야기', '카피바라 친구들이 졸졸 따라왔어요. 카피바라는 순해서 누구와도 잘 지낸대요.']] },
    // 4장 — 규칙(아이들 규칙 = 💥 게임 오버 · 다시 고르기)
    { chapter: 4 },
    { label: 'feed' },
    { fx: 'food', id: 'food', at: F(-22, 18.4), s: 1.2 },
    { fxMove: 'keeper', to: F(-22, 20.8), sec: 1 },
    { say: [['사육사', '밥 먹을 시간이야! 신선한 풀이랑 당근이란다.']] },
    { ask: ['{mate}', '배가 고픈데… 어떻게 할까?'], choices: ['😋 맛있게 먹는다', '🙅 안 먹을래, 집 밥 먹고 싶어!'], set: 'eat' },
    { if: { eat: 1 }, then: [
      { sound: 'buzz' },
      { emote: 'c1', icon: '🙅' }, { emote: 'c2', icon: '🙅' }, { emote: 'c3', icon: '🙅' },
      { say: [
        ['이야기', '💥 게임 오버! 우리가 밥을 거부하자 다른 카피바라들도 모두 따라서 밥을 안 먹었어요.'],
        ['이야기', '모두 배가 고파 힘이 없어졌고, 사육사 선생님은 걱정이 가득해졌어요. 규칙에는 다 이유가 있었어요.'],
        ['이야기', '🔄 다시 골라 볼까요?'],
      ] },
      { goto: 'feed' },
    ] },
    { fxAnim: 'mate', anim: 'eat' }, { fxAnim: 'c1', anim: 'eat' }, { fxAnim: 'c2', anim: 'eat' }, { fxAnim: 'c3', anim: 'eat' },
    { emote: 'party', icon: '😋' },
    { say: [['사육사', '잘 먹는구나! 너희가 맛있게 먹으니까 다른 친구들도 따라 먹네.']] },
    { fxDel: 'food' },
    { fxAnim: 'mate', anim: 'idle' }, { fxAnim: 'c1', anim: 'idle' }, { fxAnim: 'c2', anim: 'idle' }, { fxAnim: 'c3', anim: 'idle' },
    { label: 'night' },
    { time: 'night' },
    { fxMove: 'keeper', to: F(-22, 30), sec: 2, wait: false },
    { say: [
      ['이야기', '밤이 되었어요. 사육사 선생님도 퇴근했어요.'],
      ['{mate}', '쉿… 울타리 남쪽에 작은 틈이 있어. 저기로 나가면 집에 갈 수 있을지도 몰라.'],
    ] },
    { ask: ['{mate}', '어떻게 할까?'], choices: ['🌙 친구들과 여기 남는다', '🏃 틈으로 몰래 나간다'], set: 'run' },
    { if: { run: 1 }, then: [
      { sound: 'buzz' },
      { say: [
        ['이야기', '💥 게임 오버! 우리가 틈으로 빠져나가자 다른 카피바라들도 줄줄이 따라 나왔어요.'],
        ['이야기', '운동장이 카피바라로 가득해졌고, 다친 친구도 생겼어요. 한 마리가 규칙을 어기면 모두가 따라 할 수 있어요.'],
        ['이야기', '🔄 다시 골라 볼까요?'],
      ] },
      { goto: 'night' },
    ] },
    { say: [['느릿이', '잘 생각했어… 여기서 같이 자자. 하아암…']] },
    { fxAnim: 'mate', anim: 'sleep' }, { fxAnim: 'c1', anim: 'sleep' }, { fxAnim: 'c2', anim: 'sleep' }, { fxAnim: 'c3', anim: 'sleep' },
    { emote: 'party', icon: '💤', sec: 3 },
    { wait: 1.5 },
    // 마지막 장 — 꿈(아이들 반전)
    { chapter: 5 },
    { dark: 2.4, darkColor: '#ffffff' },
    { look: null },
    { arena: 'school' },
    { body: null },
    { fxDel: 'all' },
    { grow: true, sec: 0.3 },
    { time: 'day' },
    { tp: [27.6, -42.6], h: 270 },
    { banner: '…그것은 사실 꿈이었다', bannerSec: 3 },
    { wait: 1.2 },
    { party: ['시아', '지원'] },
    { circle: 'party', r: 1.2 },
    { say: [
      ['이야기', '다음 날 아침, 4학년 교실.'],
      ['{mate}', '있잖아… 나 어젯밤에 엄청 이상한 꿈 꿨어. 운동장에서 물약을 먹고 카피바라가 됐어.'],
      ['{me}', '뭐? 나도! 동물병원에도 가고, 동물원에서 느릿이랑 첨벙이랑 오물이도 만났어!'],
      ['{mate}', '말도 안 돼… 우리 둘 다 같은 꿈을 꾼 거야?!'],
    ] },
    { fx: 'potion', id: 'potion2', at: 'me', fwd: 0.9 },
    { emote: 'party', icon: '❓', sec: 3 },
    { say: [['이야기', '그런데 그때, 발밑으로 작은 민트색 병 하나가 데구루루 굴러 왔어요…']] },
    { end: {
      title: '동물 세계',
      body: '물약을 마시고 어린 카피바라가 되어 동물병원과 동물원에서 하루를 보냈어요. 규칙을 지키니 모두가 행복했어요. 그런데… 정말 꿈이었을까요?',
      listTitle: '✨ 세계를 넓히려고 더한 것 · 📖 자세한 건 세계 안내서에',
      list: [
        '꿈속 동물 세계 = 잠든 사이 우리 학교 위에 겹쳐지는 세계(운동장 → 동물원 · 보건실 → 동물병원)',
        '물약 모습(민트빛) · 같이 마시면 같이 변함',
        '카피바라 친구 셋의 이름과 성격(느릿이·첨벙이·오물이)',
        '진짜 카피바라 이야기(헤엄 · 순함 · 무리 지어 서로 따라 함 → 아이들 규칙의 까닭과 이어짐)',
        '규칙을 어기면 💥 게임 오버 → 다시 고르기',
        '사육사·구조대원·수의사는 화면에 직업 이름으로(판에 쓴 이름은 📖 안내서에 그대로)',
        '마지막 물약 병(정말 꿈이었을까?) — 다음 이야기로 이어지는 씨앗',
        '🌱 다음 이야기 씨앗 6개 — 📖 세계 안내서 마지막 쪽',
      ],
    } },
  ],
};

// ───────── 자유 탐험(SANDBOX · 10-07 교사 '마법사 마을 깊이가 최소 · E만 누르지 말고 보이는 모습 · 40분 고민했는데 3분이면 허무') ─────────
//   밥을 먹은 뒤 '동물원 놀이 시간' — 카피바라 존이 넓은 마당으로 열림 · 신기한 일 16가지(앞 이야기 4 + 탐험 12) · F 🗣 꾸잉(친구 부르기) · R 💦 첨벙 · B 목록 · 사육사에게 '잘 시간'
const YD = [-38, 3.5, -13, 28.5];
const PEN = [];   // 울타리 충돌(문 = 남쪽 6·7번 칸은 열림)
for (let k = 0; k < 28; k++) { if (k === 6 || k === 7) continue; const a = (k + 0.5) / 28 * Math.PI * 2, x = ZC[0] + Math.cos(a) * 5, z = ZC[1] + Math.sin(a) * 5, w = Math.abs(Math.sin(a)) * 1.12 / 2 + 0.08, d = Math.abs(Math.cos(a)) * 1.12 / 2 + 0.08; PEN.push([x - w, -1.35, z - d, x + w, -0.35, z + d]); }
STORY.sandbox = {
  title: '동물 세계의 신기한 일',
  skills: [
    { k: 'call', key: 'KeyF', icon: '🗣', name: '꾸잉', color: 0xd7ccc8, anim: 'call', emote: '🗣', affect: { kind: 'capy', anim: 'idle', r: 9, come: true }, tone: [[740, 0, 0.12, 'triangle', 0.12, 980], [740, 0.16, 0.14, 'triangle', 0.12, 1040]] },
    { k: 'splash', key: 'KeyR', icon: '💦', name: '첨벙', color: 0x6ec6ff, emote: '😆', tone: [[300, 0, 0.2, 'sine', 0.1, 120]] },
  ],
  exit: { at: F(-22, 22.4), r: 1.8, label: '🌇 우리로 돌아가 잘 준비하기' },
  acts: [
    { start: { use: 'c1', r: 1.6, label: '💬 느릿이' }, steps: [{ sayOne: [['느릿이', '하아암… 해 드는 자리에서 가만히 있으면 잠이 솔솔 와. 너도 해 봐.'], ['느릿이', '카피바라는 하루에 풀을 아주 많이 먹어. 그래서 늘 오물오물…'], ['느릿이', '울타리 밖 마당 구석에 아기들이 숨었대. 꾸잉(F) 하고 부르면 나올지도.']] }] },
    { start: { use: 'c2', r: 1.6, label: '💬 첨벙이' }, steps: [{ sayOne: [['첨벙이', '카피바라는 발가락 사이에 물갈퀴가 조금 있어. 그래서 헤엄을 잘 쳐!'], ['첨벙이', '연못에 들어오면 경주하자! 내가 이길걸?'], ['첨벙이', '물속에서는 코랑 눈이랑 귀만 내놓고 숨어 있을 수도 있어.']] }] },
    { start: { use: 'c3', r: 1.6, label: '💬 오물이' }, steps: [{ sayOne: [['오물이', '오물오물… 건초 더미 옆에 풀이 많아. 풀 뜯기 대회 할래?'], ['오물이', '당근 바구니는 사육사님 창고 옆에 있어. 당근 좋아…'], ['오물이', '카피바라 이빨은 평생 자라서, 풀을 많이 씹어야 알맞게 닳아.']] }] },
    { after: ['yuzu'], start: { use: 'keeper', r: 1.8, label: '💬 사육사' }, steps: [{ sayOne: [['사육사', '카피바라는 순해서 다른 동물들이랑도 잘 지낸단다.'], ['사육사', '울타리 문은 꼭 닫아야 해. 한 마리가 나가면 모두 따라 나가거든.']] }] },
  ],
  disc: [
    { k: 'potion', t: '🧪 물약을 마시고 아기 카피바라로', h: '운동장의 민트색 물약(이야기 1장)' },
    { k: 'hospital', t: '🩺 동물병원 건강 검사', h: '구조대원과 동물병원(이야기 2장)' },
    { k: 'friends', t: '🦫 카피바라 친구 셋 사귀기', h: '느릿이·첨벙이·오물이(이야기 3장)' },
    { k: 'feed', t: '🥕 밥 먹는 규칙 지키기', h: '사육사가 주는 밥(이야기 4장)' },
    { k: 'swim', t: '🏊 첨벙이와 연못 헤엄 경주', h: '우리 안 연못으로 들어가요', mark: F(-21.2, 16.6), start: { near: F(-21.2, 16.6), r: 1.6 }, steps: [
      { say: [['첨벙이', '헤엄 경주! 물 위 부표 세 개를 차례로 돌고 오기야. 준비, 시작!']] },
      { fxMove: 'c2', to: 'b1', sec: 2.2, wait: false },
      { seq: { ids: ['b1', 'b2', 'b3'], goal: '🏊 부표를 차례로 돌아요', show: true, r: 1.0, color: 0x6ec6ff, wrong: '앗, 순서가 달라요! 처음 부표부터' } },
      { rain: { at: 'me', r: 0.5, n: 30, color: 0x9be7ff, size: 0.06, h: 0.6, puffs: 3 } }, { emote: 'c2', icon: '😮' },
      { say: [['첨벙이', '헉, 나보다 빨라! 카피바라 발가락 사이 물갈퀴를 잘 쓰는걸?']] }, { wander: ['c2'], rect: [-24, 14, -20, 18], speed: 0.4 }] },
    { k: 'bird', t: '🐦 등에 새가 앉았어요', h: '동쪽 큰 나무 그늘에서 가만히(움직이지 않기)', mark: F(-15.4, 25.4), start: { near: F(-15.6, 25.2), r: 2.4 }, steps: [
      { say: [['이야기', '나무 위에서 작은 새가 우리를 내려다봐요. 가만히 있어 볼까요?']] },
      { still: { sec: 3, goal: '🐦 3초 동안 움직이지 말고 기다려요' } },
      { fx: 'bird', id: 'bd', at: F(-15.4, 26.6), dy: 3.2, s: 1.6, color: 0x6d8bd1 }, { fxMove: 'bd', to: 'head:me', sec: 1.4, arc: 0.6 }, { hold: 'bd', on: 'me', where: 'head' },
      { emote: 'bd', icon: '🎵' },
      { say: [['이야기', '새가 등에 사뿐히 앉았어요! 카피바라는 성격이 순해서 새들이 등에 앉아 쉬어 가기도 해요(진짜 카피바라도 그래요).']] },
      { wait: 2 }, { fxMove: 'bd', to: F(-10, 30), dy: 5, sec: 1.6, arc: 1 }, { fxDel: 'bd' }] },
    { k: 'yuzu', t: '🍊 귤 온천에 들어가기', h: '사육사의 부탁 — 마당에 굴러다니는 귤 다섯 개', mark: 'keeper', start: { use: 'keeper', r: 1.8, label: '🍊 사육사의 부탁 듣기' }, steps: [
      { fxFace: 'keeper' }, { say: [['사육사', '추운 날 어떤 동물원에서는 카피바라에게 귤을 띄운 따뜻한 온천을 해 준단다. 마당에 귤이 굴러다니던데, 다섯 개만 모아 줄래?']] },
      { spawn: { kind: 'orange', id: 'og', n: 5, rect: [-36, 5, -15, 27], y: -1.35, s: 1.6 } },
      { catch: { ids: ['og1', 'og2', 'og3', 'og4', 'og5'], goal: '🍊 굴러다니는 귤 모으기', flee: 1.2, range: 2.4, wander: YD, speed: 0.7, r: 0.9, then: 'follow', d: 0.6, color: 0xff9f1a } },
      { goal: '♨️ 온천(서쪽)으로 가요', go: 'spa', label: '온천', r: 1.6 },
      { fxMove: 'og1', to: F(-30.4, 22.2), dy: 0.05, sec: 0.5, wait: false }, { fxMove: 'og2', to: F(-29.6, 21.6), dy: 0.05, sec: 0.6, wait: false }, { fxMove: 'og3', to: F(-30.2, 21.4), dy: 0.05, sec: 0.7, wait: false },
      { fxMove: 'og4', to: F(-29.6, 22.4), dy: 0.05, sec: 0.8, wait: false }, { fxMove: 'og5', to: F(-30.0, 22.0), dy: 0.05, sec: 0.9 },
      { follow: ['og1', 'og2', 'og3', 'og4', 'og5'], off: true },
      { goal: '♨️ 귤 온천에 쏙!', go: F(-30, 22), label: '귤 온천', r: 0.7 },
      { rain: { at: F(-30, 22), r: 0.9, n: 30, color: 0xffffff, size: 0.12, h: 0.1, puffs: 6 } }, { emote: 'me', icon: '😊', sec: 3 }, { emote: 'mate', icon: '😊', sec: 3 },
      { say: [['{mate}', '으아~ 따뜻하다… 귤 냄새도 좋아. 카피바라가 왜 온천을 좋아하는지 알겠어.']] }] },
    { k: 'grass', t: '🌿 오물이와 풀 뜯기 대회', h: '우리 안 건초 더미 옆에서 오물이가 기다려요', mark: F(-24.2, 14.5), start: { near: F(-24.2, 14.8), r: 1.4 }, steps: [
      { say: [['오물이', '풀 뜯기 대회! 마당 풀 여섯 덤불을 먼저 먹는 쪽이 이기는 거야. 시작!']] },
      { spawn: { kind: 'sprout', id: 'gs', n: 6, rect: [-36, 5, -15, 27], y: -1.35, s: 2.4 } }, { fxAnim: 'c3', anim: 'eat' },
      { catch: { ids: ['gs1', 'gs2', 'gs3', 'gs4', 'gs5', 'gs6'], goal: '🌿 풀 덤불 먹기', r: 0.8, color: 0x7cb342 } },
      { fxAnim: 'c3', anim: 'idle' }, { emote: 'c3', icon: '😮' },
      { say: [['오물이', '벌써 여섯 덤불?! 나는 다섯 개밖에 못 먹었는데… 너 진짜 카피바라 같아!']] }] },
    { k: 'mud', t: '🟤 진흙 목욕', h: '마당 서쪽 진흙 웅덩이로 첨벙(R)', mark: 'mudp', start: { skill: 'splash', on: 'mudp', r: 1.6 }, steps: [
      { glow: 'me', color: 0x6d4c33 }, { body: 'capy', color: 0x5d4037 }, { emote: 'me', icon: '😆' },
      { say: [['{mate}', '으하하, 진흙투성이! 진흙을 바르면 뜨거운 햇볕도 벌레도 막아 준대. 카피바라의 선크림이야!']] },
      { wait: 2 }, { body: 'capy', color: 0xa87a4f }] },
    { k: 'fence', t: '🔧 울타리 문 고치기', h: '사육사 창고(북서쪽) 널빤지 셋을 우리 남쪽 문으로', mark: 'pl1', start: { use: 'pl1', r: 1.6, label: '🪵 널빤지 들기' }, steps: [
      { say: [['사육사', '고마워! 우리 남쪽 문이 헐거워졌거든. 한 마리가 나가면 모두 따라 나갈 수 있으니까, 널빤지로 튼튼하게 막자.']] },
      { carry: { id: 'pl1', to: F(-22.4, 21.3), goal: '🪵 널빤지를 우리 남쪽 문으로 (1/3)', r: 1.3 } },
      { carry: { id: 'pl2', to: F(-22.0, 21.4, 0.35), goal: '🪵 널빤지를 우리 남쪽 문으로 (2/3)', r: 1.3 } },
      { carry: { id: 'pl3', to: F(-21.6, 21.3, 0.7), goal: '🪵 널빤지를 우리 남쪽 문으로 (3/3)', r: 1.3 } },
      { sound: 'done' }, { say: [['사육사', '튼튼해졌다! 규칙에는 다 이유가 있단다. 모두가 안전하려고 지키는 거야.']] }] },
    { k: 'leaves', t: '🍂 사육사 도와 낙엽 치우기', h: '마당 곳곳의 낙엽 더미 다섯', mark: 'lf1', start: { near: 'lf1', r: 1.6 }, steps: [
      { say: [['사육사', '오, 낙엽 치우는 걸 도와주려고? 다섯 더미만 모아 주면 마당이 깨끗해지겠다!']] },
      { catch: { ids: ['lf1', 'lf2', 'lf3', 'lf4', 'lf5'], goal: '🍂 낙엽 더미 치우기', r: 0.9, color: 0xd9822b } },
      { say: [['사육사', '깨끗해졌다! 동물원 사육사는 매일 청소하고, 밥 주고, 건강도 살핀단다.']] }] },
    { k: 'babies', t: '👶 숨은 아기 카피바라 찾기', h: '마당 구석구석 숨은 아기 셋 — 꾸잉(F)으로 부르고 데려와요', mark: 'bb1', start: { near: 'bb1', r: 2.4 }, steps: [
      { say: [['느릿이', '어, 우리 아기들이네! 마당에서 놀다가 길을 잃었나 봐. 데려다줄래?']] },
      { catch: { ids: ['bb1', 'bb2', 'bb3'], goal: '👶 아기 카피바라 데려오기 (꾸잉 F로 부르면 다가와요)', flee: 0.5, range: 1.8, wander: YD, speed: 0.4, r: 1.0, then: 'follow', d: 0.5, color: 0xd7ccc8 } },
      { goal: '👶 아기들을 느릿이에게', go: 'c1', label: '느릿이', r: 1.6 },
      { follow: ['bb1', 'bb2', 'bb3'], off: true }, { fxMove: 'bb1', to: 'c1', sec: 0.8, wait: false }, { fxMove: 'bb2', to: 'c1', sec: 0.9, wait: false }, { fxMove: 'bb3', to: 'c1', sec: 1.0 },
      { emote: 'c1', icon: '❤️', sec: 3 }, { say: [['느릿이', '고마워… 카피바라는 엄마가 아니어도 무리가 다 같이 아기들을 돌봐 준단다.']] },
      { wander: ['bb1', 'bb2', 'bb3'], rect: [-24, 13, -20, 19], speed: 0.3 }] },
    { k: 'visit', t: '🏫 구경 온 반 친구들에게 첨벙 인사', h: '동쪽 울타리 밖 반 친구들 앞에서 첨벙(R)', mark: F(-13.6, 14), start: { skill: 'splash', at: F(-13.6, 14), r: 2.6 }, steps: [
      { act: '유은', pose: 'cheer', faceTo: 'me' }, { act: '예지', pose: 'cheer', faceTo: 'me' }, { emote: '유은', icon: '😄' }, { emote: '예지', icon: '😍' },
      { say: [['유은', '저 아기 카피바라 좀 봐! 우리한테 인사하는 것 같아!'], ['은규', '…귀엽네.'], ['인우', '…진짜 귀엽다.']] },
      { act: '유은', pose: 'stand', faceTo: 'me' }, { act: '예지', pose: 'stand', faceTo: 'me' }] },
    { k: 'photo', t: '📸 친구들과 기념사진', h: '친구 셋을 사귀고 아기들을 찾은 뒤, 사진기 앞에서', mark: 'cam', after: ['babies'], start: { use: 'cam', r: 1.8, label: '📸 기념사진 찍기' }, steps: [
      { fxMove: 'c1', to: 'me', side: -0.8, sec: 0.8, wait: false }, { fxMove: 'c2', to: 'me', side: 0.8, sec: 0.8, wait: false }, { fxMove: 'c3', to: 'me', fwd: -0.8, sec: 0.8, wait: false },
      { fxMove: 'mate', to: 'me', side: 0.5, fwd: -0.5, sec: 0.8 },
      { banner: '📸 하나, 둘…', bannerSec: 1.2 }, { wait: 1.2 }, { dark: 0.5, darkColor: '#ffffff' }, { banner: '📸 찰칵! 카피바라 친구들과 기념사진', bannerSec: 2.4 }, { sound: 'done' },
      { say: [['{mate}', '꿈에서 깨도 이 사진은 기억할 거야!']] }] },
    { k: 'sleepy', t: '😴 해 드는 자리에서 낮잠', h: '느릿이 말처럼, 마당 북서쪽 해 드는 자리에서 가만히', mark: F(-31, 8), start: { near: F(-31, 8), r: 1.8 }, steps: [
      { say: [['이야기', '햇볕이 따뜻해요… 느릿이처럼 가만히 있어 볼까요?']] }, { still: { sec: 4, goal: '😴 4초 동안 가만히' } },
      { bodyPose: 'sleep' }, { emote: 'me', icon: '💤', sec: 3 }, { wait: 2.5 }, { bodyPose: null },
      { say: [['이야기', '꾸벅… 카피바라는 하루에 짧은 낮잠을 여러 번 자요. 느긋한 게 카피바라의 힘!']] }] },
    { k: 'carrot', t: '🥕 당근을 오물이에게', h: '창고 옆 당근 바구니에서 당근을 이고 오물이에게', mark: 'cart', start: { use: 'cart', r: 1.6, label: '🥕 당근 하나 들기' }, steps: [
      { fx: 'food', id: 'cr', at: 'me', s: 1.0 }, { carry: { id: 'cr', to: 'c3', goal: '🥕 당근을 오물이에게', r: 1.4, del: true } },
      { fxAnim: 'c3', anim: 'eat' }, { emote: 'c3', icon: '😋', sec: 3 }, { say: [['오물이', '오물오물… 최고야! 카피바라 이빨은 평생 자라서, 이렇게 씹어 줘야 알맞게 닳아.']] }, { fxAnim: 'c3', anim: 'idle' }] },
  ],
};
{
  const S = STORY.steps, at = (pred) => S.findIndex(pred), ins = (i, ...a) => S.splice(i, 0, ...a), js = (st) => JSON.stringify(st);
  ins(at(st => st.say && /꾸잉\?! 우리 카피바라가/.test(js(st))) + 1, { found: 'potion' });
  ins(at(st => st.say && /심장 소리 쿵쿵/.test(js(st))) + 1, { found: 'hospital' });
  ins(at(st => st.say && /졸졸 따라왔어요/.test(js(st))) + 1, { found: 'friends' });
  ins(at(st => st.say && /잘 먹는구나/.test(js(st))) + 1, { found: 'feed' });
  const iN = at(st => st.label === 'night');
  ins(iN,
    { fx: 'drop', id: 'b1', at: F(-22.6, 15.8, 0.05), s: 2.5, pop: false }, { fx: 'drop', id: 'b2', at: F(-20.0, 15.8, 0.05), s: 2.5, pop: false }, { fx: 'drop', id: 'b3', at: F(-21.0, 17.6, 0.05), s: 2.5, pop: false },
    { fx: 'tree', id: 'tr', at: F(-15.4, 26.6), fruit: 0x8bc34a, pop: false }, { fx: 'spring', id: 'spa', at: F(-30, 22), s: 1, pop: false }, { fx: 'mud', id: 'mudp', at: F(-32, 11), s: 1.6, pop: false },
    { fx: 'plank', id: 'pl1', at: F(-34, 25.4), s: 1.2, pop: false }, { fx: 'plank', id: 'pl2', at: F(-34, 25.9), s: 1.2, pop: false }, { fx: 'plank', id: 'pl3', at: F(-34, 26.4), s: 1.2, pop: false },
    { fx: 'food', id: 'cart', at: F(-33.2, 23.6), s: 1.8, pop: false }, { fx: 'gift', id: 'cam', at: F(-26, 26.5), s: 1.6, color: 0x37474f, pop: false },
    { fx: 'leafpile', id: 'lf1', at: F(-17, 7), s: 2, pop: false }, { fx: 'leafpile', id: 'lf2', at: F(-27, 5), s: 2, pop: false }, { fx: 'leafpile', id: 'lf3', at: F(-36, 15), s: 2, pop: false },
    { fx: 'leafpile', id: 'lf4', at: F(-14.5, 22), s: 2, pop: false }, { fx: 'leafpile', id: 'lf5', at: F(-22, 27.5), s: 2, pop: false },
    { fx: 'capy', id: 'bb1', at: F(-36, 27), s: 0.32, color: 0xb08050, pop: false }, { fx: 'capy', id: 'bb2', at: F(-14, 5), s: 0.32, color: 0xa87a4f, pop: false }, { fx: 'capy', id: 'bb3', at: F(-37, 5), s: 0.32, color: 0x96643a, pop: false },
    { fxMove: 'keeper', to: F(-28, 24.5), sec: 0.2 },
    { npc: '은규', to: F(-11.6, 12.6), face: 270 }, { npc: '인우', to: F(-11.6, 14.0), face: 270 }, { npc: '예지', to: F(-11.6, 15.4), face: 270 }, { npc: '유은', to: F(-11.6, 16.8), face: 270 },
    { solid: PEN },
    { follow: ['c1', 'c2', 'c3'], off: true }, { wander: ['c1'], rect: [-24, 13, -20, 19], speed: 0.3 }, { wander: ['c2'], rect: [-24, 14, -20, 18], speed: 0.4 }, { wander: ['c3'], rect: [-24.5, 13.5, -22.5, 15.5], speed: 0.3 },
    { arena: YD, arenaMsg: '여기까지가 카피바라 마당이에요' },
    { say: [
      ['사육사', '밥도 잘 먹었으니, 이제 놀이 시간! 오늘은 마당 문을 열어 줄게. 해 질 녘에 우리 문 앞으로 오면 잘 시간이야.'],
      ['느릿이', '하아암… 카피바라는 무리 지어 살아. 친구가 많아지면 무리도 커지지. 꾸잉(F) 하고 불러 봐…'],
    ] },
    { sandbox: true },
    { dark: 1.2 }, { tp: F(-22, 18.6), h: 0 }, { arena: [-26.4, 11.6, -17.6, 20.4], arenaMsg: '밤에는 우리 안에 있어야 해요' },
    { follow: ['mate', 'c1', 'c2', 'c3'], d: 0.7, speed: 3 });
  const iT = at(st => st.say && /작은 틈이 있어/.test(js(st)));
  S[iT] = { say: [['이야기', '밤이 되었어요. 사육사 선생님도 퇴근했어요.'], ['{mate}', '쉿… 사육사님이 깜빡하고 울타리 문을 살짝 열어 두셨어. 저기로 나가면 집에 갈 수 있을지도 몰라.']] };
}

// ───────── SANDBOX-2(10-08 교사 기본값 '풍성 4 · 놀이 4 · 효과 3~4 · 이야기 4 · 직관성 높게') ─────────
//   들어갈 때 영상(마당 이름표) · 하는 법 창 · 🦫 무리 게이지 = 꾸잉(F)으로 친구를 부르고 신기한 일을 찾으면 차오름 →
//   1단계 마당 카피바라 둘이 무리에 들어옴 → 2단계 무리가 나를 따라 함(첨벙·잠 — 아이들 규칙 '한 마리가 하면 모두 따라 해요'를 좋은 쪽으로) → 가득 = 👑 무리 대장(노을 · 사육사·반 친구들 박수 — 17번째)
{
  const SBX = STORY.sandbox, Y0 = -1.35;
  const TAGS = [['🏊 연못', -21.2, 16.6, 0.3], ['♨️ 온천', -30, 22, 0.6], ['🟤 진흙', -32, 11, 0.3], ['🧑‍🌾 사육사', -28, 24.5, 2.1], ['📸 사진기', -26, 26.5, 0.8], ['🌳 나무 그늘', -15.4, 26.6, 3.4], ['🏫 반 친구들', -11.6, 14.7, 1.9], ['🥕 당근', -33.2, 23.6, 0.7]].map(([t, x, z, dy]) => ({ t, p: [x, Y0 + dy, z] }));
  SBX.how = { title: '동물 세계 — 이렇게 놀아요', lines: [
    ['❓', '노란 ? 를 찾아가요', '화면 위 줄이 가장 가까운 신기한 일을 알려 줘요. [H] = 길 안내 · [B] = 목록'],
    ['🦫', '아기 카피바라의 능력', '{skills} — 꾸잉으로 친구를 부르고, 첨벙으로 장난쳐요'],
    ['👣', '무리를 키워요', '꾸잉으로 카피바라 친구를 부르고 신기한 일을 찾을수록 {meter} 게이지가 차요. 무리가 커지면 친구들이 나를 따라 해요!'],
  ], tip: '다 둘러보면 해 질 녘에 우리 남쪽 문 앞에서 잘 준비를 해요' };
  SBX.herdD = 0.75;
  SBX.mimic = { splash: { anim: 'hop', emote: '😆', color: 0x9be7ff }, call: { anim: 'idle', emote: '🗣' } };
  SBX.meter = { icon: '🦫', name: '무리', max: 15, hint: '꾸잉(F)으로 카피바라 친구를 부르고 신기한 일을 찾아요',
    feed: { disc: 1, skills: { call: { kind: 'capy', r: 9, n: 1, icon: '❤️', say: '카피바라 친구가 반가워해요' } } },
    stages: [
      { at: 6, t: '무리가 커져요', keep: [{ herd: ['mate', 'c4', 'c5'] }],
        steps: [
          { emote: 'c4', icon: '❤️' }, { emote: 'c5', icon: '❤️' }, { fxMove: 'c4', to: 'me', side: -0.9, fwd: -0.6, sec: 1.4, arc: 0.15, wait: false }, { fxMove: 'c5', to: 'me', side: 0.9, fwd: -0.6, sec: 1.4, arc: 0.15 },
          { herd: ['mate', 'c4', 'c5'] },
          { banner: '🦫 무리 1단계 — 마당 카피바라들이 무리에 들어왔어요', bannerSec: 2.6 },
          { say: [['이야기', '마당의 카피바라 둘이 졸졸 따라오기 시작했어요. 카피바라는 무리 지어 사는 동물이라, 친구가 생기면 같이 다녀요.']] },
        ] },
      { at: 10, t: '무리가 나를 따라 해요', keep: [{ herd: ['mate', 'c4', 'c5', 'c1', 'c2', 'c3'] }, { mimic: true }],
        steps: [
          { herd: ['mate', 'c4', 'c5', 'c1', 'c2', 'c3'] }, { mimic: true },
          { say: [['느릿이', '하아암… 우리도 같이 갈래. 카피바라는 서로 따라 해. 네가 첨벙 하면 우리도 첨벙, 네가 자면 우리도 꾸벅.']] },
          { waitSkill: { k: 'splash', goal: '💦 첨벙(R)을 해 봐요 — 무리가 따라 해요!' } },
          { wait: 0.9 },
          { say: [['{mate}', '봤어? 다 같이 첨벙! 한 마리가 하면 모두 따라 하니까… 우리가 좋은 걸 하면 다들 좋은 걸 따라 하겠다!']] },
        ] },
      { at: 15, t: '무리 대장', found: 'leader', keep: [{ time: 'sunset' }],
        steps: [
          { time: 'sunset' },
          { banner: '👑 무리 가득! — 모두가 믿고 따르는 무리 대장', bannerSec: 2.6 },
          { emote: 'keeper', icon: '👏', sec: 4 }, { fxAnim: 'keeper', anim: 'hop' },
          { act: '유은', pose: 'cheer', faceTo: 'me' }, { act: '예지', pose: 'cheer', faceTo: 'me' }, { emote: '유은', icon: '👏' }, { emote: '예지', icon: '👏' }, { emote: '은규', icon: '😮' }, { emote: '인우', icon: '😮' },
          { fxAnim: 'c1', anim: 'hop' }, { fxAnim: 'c2', anim: 'hop' }, { fxAnim: 'c3', anim: 'hop' }, { fxAnim: 'c4', anim: 'hop' }, { fxAnim: 'c5', anim: 'hop' }, { fxAnim: 'mate', anim: 'hop' }, { sound: 'done' },
          { rain: { at: 'me', r: 1.2, n: 30, color: 0xffd23c, size: 0.07, h: 1.6, puffs: 5 } },
          ...['c1', 'c2', 'c3', 'c4', 'c5', 'mate'].map(id => ({ fxAnim: id, anim: 'idle' })), { fxAnim: 'keeper', anim: 'idle' },
          { say: [
            ['사육사', '와, 무리가 모두 너를 따라다니는구나! 카피바라 무리는 믿을 수 있는 친구를 따라다녀.'],
            ['사육사', '규칙을 잘 지켰더니 모두가 좋은 걸 따라 하게 됐어. 한 마리가 잘하면, 모두가 잘하게 되는 거지!'],
            ['{mate}', '처음엔 규칙이 무섭기만 했는데… 이제 왜 있는지 알겠어.'],
          ] },
          { act: '유은', pose: 'stand', faceTo: 'me' }, { act: '예지', pose: 'stand', faceTo: 'me' },
        ] },
    ] };
  SBX.disc.push({ k: 'leader', t: '👑 카피바라 무리 대장', h: '🦫 무리 게이지를 가득 채워요(꾸잉 F로 친구 부르기 · 신기한 일)' });
}
