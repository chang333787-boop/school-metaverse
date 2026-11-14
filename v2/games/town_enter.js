// 🚪 거의 모든 건물에 들어가기(ENTER-1 · 사용자 10-26 저녁 '거의 모든 건물에 들어갈 수 있으면 좋겠어' · docs/systems/town_enter.md)
//   갈래 표(CATS) 한 줄 = 그 가게다운 방 하나: 방 꼴(st) · 여는 때(h) · 칸 넷(이름 · 진열 꼴 · 물건 꼴 · 색 · 사실 한 줄) · 부탁(손님 말 → 맞는 칸) · 가방에서 사 주는 것(want)
//   들어가면 할 일(E 한 번에 끝 X — 보고 고르기): 가게 = 손님이 찾는 것이 있는 칸을 찾아 E(몸으로 걸어감 · 틀리면 주인 한 줄) · 식당 = 주문 쪽지의 탁자 찾아 E(창가·안쪽 · 혼자·둘) · 학원 = 선생님 E로 수업 한 판(ACAD-1 · town_acad.js · 학원 안만 셈 예외)
//     집·아파트 = 이웃(하는 일로 부름 · 이름 X) 정리 돕기(바닥에 놓인 것 → 제자리) · 마을회관 = 이웃 부탁 게시판(BAG-2 그대로) · 터미널·안내소·여행사·부동산 = 손님 바람 → 맞는 판
//     이미 있는 가게 방(마트·편의점·빵집·카페·아이스크림)은 그 방 그대로 + 계산대 E = 사기 · 진열 돕기(창 고르기) · 치과·소아과·안과 = 병원 창구(town_bldg.js) · AI 이름 '공장' = 공장 견학
//   지킴: 실제 상호·상표 X · 판타지 X · 실명 X(주인·손님·이웃 = 이름 없는 역할 · 몸 있음) · 사실만 · 셈 X · 지역 비하 X · 홍보판(SM_PROMO)엔 X
//   보상 = 솜씨만(꼬리표 ent:<갈래> → rwCheck 한 문 · 하루 한 번) + 보이는 결과(봉투·접시·제자리·별) · 가방 팔기 = 기본 값(장터보다 낮게 · 'mv:sell' · 가게에서 산 것 X)
//   렉: 매 프레임 일 0 · 새 Light X · 방은 들어갈 때만(town_indoor.js KIT · 합친 부품 + 인스턴스) · 나오면 치움 · 문 표시 고리·글자판은 그리지 않음(1,300곳 · E 안내만)
//   ENTER-3(11-07 · town_enter2.js · docs/systems/town_enter3.md): 가게·식당·사무실·창고 = 갈래마다 판단 틀(고르기·그림·도구·나누기·순서·읽기·구도·지도) + 내용 표 · 집·아파트 = 오늘의 부탁(일곱 갈래 · 이웃 일·동네·철·때) + 가끔 그 집만의 일 + 기억 말 + 답례(엽서·그 일의 작은 것) + 모음(도운 집 n/전체)
import { CONTENT, MENU, HJOB, JOBKEY, HFIND, HEV, PCARDS, PC_WHERE, HMEM, HKNAME, homePlan, homeSpec, createPlay } from './town_enter2.js?v=5';
export const ENT_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const W0 = 0x9b6a3c, WD = 0x6b4a2f, WL = 0xc8a070, GR = 0x8a9098, WH = 0xf6f4ee;
// 칸 한 줄: [이름, 진열 꼴(shelf·table·tier·case·peg·rack·bin·ice·board·cab), 물건 꼴(shape), 색, 사실 한 줄]
// 부탁 한 줄: [손님 말, 맞는 칸 번호, 칸(1 = 처음 · 2 = 세 번 도운 뒤)]
const CATS = {
  flower: { re: /꽃집|꽃 가게|화원/, ic: '💐', st: 'shop', h: [9, 20], acc: 0x4e9a43, wall: 0xf7f3ea, ft: ['wood', 1.0, 0xf2e6d6], wt: [['wave', 1.2, 0xffffff, 0.9, 3.3, 'B']], owner: '꽃집 주인', tip: '손님 꽃 찾아 주기', sk: 'look', sig: 'flowerbench',
    slots: [['해바라기', 'tier', 'flower', 0xf2c230, '여름에 피는 큰 노란 꽃이에요.'], ['장미', 'tier', 'flower', 0xd8262e, '줄기에 가시가 있어요.'], ['국화', 'tier', 'flower', 0xf6f0d0, '가을에 피는 꽃이에요.'], ['카네이션', 'tier', 'flower', 0xe0453a, '어버이날에 많이 드려요.']],
    asks: [['어린 줄기일 때 해를 따라 고개를 돌리는 큰 노란 꽃이요.', 0, 1], ['줄기에 가시가 있는 꽃을 주세요. 조심해서요!', 1, 1], ['가을에 피는 꽃을 할머니께 드리고 싶어요.', 2, 1], ['어버이날에 부모님 가슴에 달아 드릴 꽃이요.', 3, 1], ['씨를 볶아 먹기도 하는 꽃이요.', 0, 2], ['찬 서리가 내릴 즈음까지 피는 꽃이요.', 2, 2], ['5월 8일에 드릴 꽃이요.', 3, 2]] },
  stationery: { re: /문구/, ic: '✏️', st: 'shop', h: [8, 20], acc: 0x3d74c9, wall: 0xf8f6ef, ft: ['tile', 1.0, 0xf4f1ea], wt: [['stripe', 0.8, 0xeef4ff, 0.9, 3.3, 'B']], owner: '문구점 주인', tip: '준비물 찾아 주기', sk: 'trade', sig: 'island',
    slots: [['공책', 'shelf', 'book', 0x3d74c9, '줄 공책, 그림 공책이 있어요.'], ['연필·지우개', 'case', 'pencil', 0xf2c230, '연필로 쓰고 지우개로 지워요.'], ['풀·가위', 'peg', 'glue', 0xe0453a, '자르고 붙이는 도구예요.'], ['색종이', 'shelf', 'card', 0xf08fb2, '접고 오려서 만들어요.']],
    asks: [['받아쓰기를 할 줄 그은 것이요.', 0, 1], ['틀린 글씨를 지울 것이요.', 1, 1], ['종이 두 장을 붙일 것이요.', 2, 1], ['종이학을 접을 알록달록한 종이요.', 3, 1], ['일기를 날마다 쓸 것이요.', 0, 2], ['깎아서 쓰는 것이요.', 1, 2], ['종이를 반듯하게 오릴 것이요.', 2, 2]] },
  pharmacy: { re: /약국/, ic: '💊', st: 'shop', h: [9, 21], acc: 0x2f9f58, wall: 0xf7faf8, ft: ['tile', 1.0, 0xf2f6f3], owner: '약사', tip: '약국 물건 찾아 주기', sk: 'work', sig: 'pharm',
    slots: [['밴드·소독', 'shelf', 'box', 0xf2c230, '다친 곳을 깨끗이 하고 붙여요.'], ['마스크', 'shelf', 'mask', 0x8fc4e8, '기침할 때 남을 지켜 줘요.'], ['칫솔·치약', 'shelf', 'brush', 0x3cc76a, '이를 닦는 데 써요.'], ['손 소독제', 'shelf', 'bottle', 0x8a5bd1, '물이 없을 때 손을 닦아요.']],
    asks: [['무릎이 까졌어요. 붙일 것을 주세요.', 0, 1], ['기침이 나서 입을 가릴 것이 필요해요.', 1, 1], ['밥 먹고 이를 닦을 것이요.', 2, 1], ['소풍 가서 물이 없을 때 손을 닦을 것이요.', 3, 1], ['상처를 깨끗하게 할 것이요.', 0, 2], ['감기 걸린 동생이 학교에 쓰고 갈 것이요.', 1, 2]] },
  salon: { re: /미용실|이발소|헤어/, ic: '💇', st: 'shop', h: [10, 20], acc: 0xd85a8a, wall: 0xfbf6f7, ft: ['checker', 1.2, 0xf4f4f4], owner: '미용사', tip: '미용 도구 가져다주기', sk: 'work', sig: 'mirror',
    slots: [['수건', 'shelf', 'towel', 0xf6f0e4, '머리를 감은 뒤 닦아요.'], ['빗·가위', 'case', 'comb', 0x3a3d42, '머리를 빗고 잘라요.'], ['드라이어', 'peg', 'dryer', 0xe0453a, '젖은 머리를 따뜻한 바람으로 말려요.'], ['샴푸', 'shelf', 'bottle', 0x2fb5b0, '머리를 감을 때 써요.']],
    asks: [['머리를 감고 나서 닦을 것을 주세요.', 0, 1], ['머리를 짧게 자를 것이요.', 1, 1], ['젖은 머리를 말릴 것이요.', 2, 1], ['머리를 감을 거품이요.', 3, 1], ['따뜻한 바람이 나오는 것이요.', 2, 2], ['엉킨 머리를 풀 것이요.', 1, 2]] },
  laundry: { re: /세탁/, ic: '👔', st: 'shop', h: [8, 20], acc: 0x3d74c9, wall: 0xf3f6fa, ft: ['tile', 1.0, 0xeef2f6], owner: '세탁소 주인', tip: '빨래 나누기', sk: 'work', sig: 'rail',
    slots: [['물빨래', 'cab', 'washer', 0xf6f4ee, '물과 세제로 빨아요.'], ['드라이클리닝', 'rack', 'cloth', 0x3a4866, '물 대신 다른 액체로 빨아요. 모직 옷은 물에 빨면 줄어들 수 있어요.'], ['다림질', 'table', 'iron', 0xb8bec4, '구김을 펴요.'], ['찾아갈 옷', 'rack', 'cloth', 0xe9e2d0, '번호표를 보고 찾아가요.']],
    asks: [['흙이 묻은 운동복이에요.', 0, 1], ['물에 빨면 줄어드는 모직 코트예요.', 1, 1], ['깨끗하지만 구겨진 셔츠예요.', 2, 1], ['어제 맡긴 옷을 찾으러 왔어요.', 3, 1], ['털실로 짠 겨울 외투예요.', 1, 2], ['땀에 젖은 수건이에요.', 0, 2]] },
  books: { re: /서점|책방/, ic: '📚', st: 'shop', h: [10, 21], acc: 0x6b4a2f, wall: 0xf3ead8, ft: ['wood', 1.0, 0xf0e2c8], owner: '서점 주인', tip: '책 찾아 주기', sk: 'look', sig: 'reading',
    slots: [['동화', 'shelf', 'book', 0xf08fb2, '옛날이야기, 그림책이 있어요.'], ['과학', 'shelf', 'book', 0x3cc76a, '동물, 우주, 공룡 책이 있어요.'], ['역사', 'shelf', 'book', 0xb03a2e, '옛사람과 옛 물건 이야기예요.'], ['지도·여행', 'shelf', 'book', 0x3d74c9, '지도책과 여행 안내서예요.']],
    asks: [['토끼와 거북이 이야기책이요.', 0, 1], ['별자리를 알아보는 책이요.', 1, 1], ['옛날 임금님이 살던 궁궐 이야기요.', 2, 1], ['우리나라 산과 강이 그려진 책이요.', 3, 1], ['공룡 화석을 알아보는 책이요.', 1, 2], ['세종 대왕이 한글을 만든 이야기요.', 2, 2], ['다른 나라를 여행하는 안내서요.', 3, 2]] },
  optician: { re: /안경/, ic: '👓', st: 'shop', h: [10, 20], acc: 0x2b5a8a, wall: 0xf6f7f9, ft: ['tile', 1.0, 0xf2f4f6], owner: '안경사', tip: '안경 물건 찾아 주기', sk: 'look', sig: 'chart',
    slots: [['안경테', 'case', 'glasses', 0x3a3d42, '얼굴에 맞는 테를 골라요.'], ['선글라스', 'case', 'glasses', 0x1c1c1e, '햇빛에서 눈을 지켜요.'], ['렌즈 닦는 천', 'shelf', 'card', 0x8fc4e8, '안경알을 닦아요.'], ['안경집', 'shelf', 'box', 0xd85a8a, '안경을 넣어 다녀요.']],
    asks: [['새 안경테를 골라 보고 싶어요.', 0, 1], ['햇빛이 눈부신 바닷가에 가요.', 1, 1], ['안경알이 뿌옇게 됐어요.', 2, 1], ['안경을 가방에 넣을 때 쓸 것이요.', 3, 1], ['눈이 쌓인 스키장은 햇빛이 눈부셔요.', 1, 2], ['안경이 눌리지 않게 넣어 둘 것이요.', 3, 2]] },
  fruit: { re: /과일/, ic: '🍎', st: 'shop', h: [8, 21], acc: 0xd8352a, wall: 0xf7f1e4, ft: ['wood', 1.0, 0xeedcc0], owner: '과일 가게 주인', tip: '과일 찾아 주기', sk: 'trade', sig: 'crates', want: ['🍓', '🍐', '🍅'],
    slots: [['사과', 'bin', 'apple', 0xd8352a, '가을에 많이 따요.'], ['귤', 'bin', 'orange', 0xf08a24, '겨울에 껍질을 손으로 까 먹어요.'], ['수박', 'bin', 'melon', 0x5f9e48, '여름에 먹는 크고 줄무늬 있는 과일이에요.'], ['배', 'bin', 'pear', 0xd9cc66, '물이 많고 사각사각해요.']],
    asks: [['가을에 따는 빨간 과일이요.', 0, 1], ['겨울에 손으로 껍질을 까 먹는 주황 과일이요.', 1, 1], ['여름에 먹는 크고 줄무늬 있는 과일이요.', 2, 1], ['물이 많고 사각사각한 누런 과일이요.', 3, 1], ['제주도에서 많이 나는 겨울 과일이요.', 1, 2], ['씨가 까맣고 속이 빨간 여름 과일이요.', 2, 2]] },
  hardware: { re: /철물|공구/, ic: '🔨', st: 'shop', h: [8, 19], acc: 0xef8b33, wall: 0xeef0f2, ft: ['checker', 1.2, 0xe9ebee], wt: [['brick', 1.4, 0xffffff, 0.9, 3.3, 'B']], owner: '철물점 주인', tip: '연장 찾아 주기', sk: 'work', sig: 'island',
    slots: [['못·망치', 'peg', 'hammer', 0x6b7078, '나무에 못을 박아요.'], ['전구', 'shelf', 'bulb', 0xfff2a8, '나간 불을 갈아 끼워요.'], ['테이프', 'peg', 'roll', 0x8a5a34, '붙이고 감아요.'], ['호스', 'bin', 'hose', 0x3cc76a, '먼 곳까지 물을 보내요.']],
    asks: [['나무판에 액자를 걸 거예요.', 0, 1], ['방 전등이 나갔어요.', 1, 1], ['찢어진 상자를 붙일 거예요.', 2, 1], ['마당 꽃밭에 물을 주려고요.', 3, 1], ['어두운 창고를 밝히고 싶어요.', 1, 2], ['세차할 때 물을 길게 보낼 것이요.', 3, 2]] },
  deli: { re: /반찬/, ic: '🥢', st: 'shop', h: [9, 20], acc: 0xc8332b, wall: 0xf7f2e8, ft: ['tile', 1.0, 0xf2ede2], owner: '반찬 가게 주인', tip: '반찬 찾아 주기', sk: 'trade', sig: 'island', want: ['🥬', '🥒', '🍃'],
    slots: [['김치', 'table', 'tray', 0xd8452a, '배추에 양념을 버무려 익혀요.'], ['나물', 'table', 'tray', 0x5aa84c, '시금치, 고사리를 무쳐요.'], ['멸치볶음', 'table', 'tray', 0xc9a77a, '작은 생선을 볶아요.'], ['장조림', 'table', 'tray', 0x6b3a1e, '고기를 간장에 졸여요.']],
    asks: [['배추로 담근 빨간 반찬이요.', 0, 1], ['시금치 무친 것이요.', 1, 1], ['작은 생선을 볶은 반찬이요.', 2, 1], ['간장에 졸인 고기 반찬이요.', 3, 1], ['겨울 앞에 김장해서 먹는 것이요.', 0, 2], ['고사리처럼 산과 들에서 나는 것이요.', 1, 2]] },
  ricecake: { re: /떡집|떡 가게|떡방앗간/, ic: '🍡', st: 'shop', h: [7, 19], acc: 0x8a5bd1, wall: 0xf8f2ea, ft: ['wood', 1.0, 0xf0e2cc], owner: '떡집 주인', tip: '떡 찾아 주기', sk: 'trade', sig: 'steam', want: ['🍚'],
    slots: [['송편', 'table', 'mochi', 0xb8d8a0, '추석에 빚는 반달 모양 떡이에요.'], ['떡국 떡', 'table', 'disc', 0xf6f4ee, '설날 떡국에 넣어요.'], ['인절미', 'table', 'cake', 0xd9b46a, '콩가루를 묻혀요.'], ['시루떡', 'table', 'cake', 0x8a4a3a, '팥고물을 켜켜이 얹어 쪄요.']],
    asks: [['추석에 먹는 반달 모양 떡이요.', 0, 1], ['설날 아침 떡국에 넣을 떡이요.', 1, 1], ['고소한 콩가루를 묻힌 떡이요.', 2, 1], ['팥고물을 켜켜이 얹은 떡이요.', 3, 1], ['솔잎을 깔고 찌는 떡이요.', 0, 2], ['이사 가면 이웃과 나누는 붉은 팥 떡이요.', 3, 2]] },
  photo: { re: /사진관|사진/, ic: '📷', st: 'shop', h: [10, 19], acc: 0x3a4866, wall: 0xf5f5f2, ft: ['wood', 1.0, 0xe6d6be], owner: '사진사', tip: '사진 찾아 주기', sk: 'look', sig: 'studio',
    slots: [['증명사진', 'board', 'frame', 0xffffff, '작은 사진이에요. 학생증에 붙여요.'], ['가족 사진 액자', 'board', 'frame', 0xd8b04a, '큰 액자에 넣어 걸어요.'], ['앨범', 'shelf', 'book', 0x8a5a34, '사진을 모아 넣는 책이에요.'], ['엽서 사진', 'shelf', 'card', 0x8fc4e8, '풍경 사진을 엽서로 만들어요.']],
    asks: [['학생증에 붙일 작은 사진이요.', 0, 1], ['할머니 생신 가족사진을 벽에 걸고 싶어요.', 1, 1], ['찍은 사진을 모아 넣을 책이요.', 2, 1], ['멀리 사는 친구에게 바다 사진을 보내고 싶어요.', 3, 1], ['여권에 붙일 사진이요.', 0, 2]] },
  shoes: { re: /신발/, ic: '👟', st: 'shop', h: [10, 21], acc: 0xe0453a, wall: 0xf6f4ef, ft: ['wood', 1.0, 0xeedfca], owner: '신발 가게 주인', tip: '신발 찾아 주기', sk: 'trade', sig: 'bench',
    slots: [['운동화', 'shelf', 'shoe', 0xf6f4ee, '달리기할 때 신어요.'], ['장화', 'shelf', 'boot', 0xf2c230, '비 오는 날 신어요.'], ['실내화', 'shelf', 'shoe', 0xe9eef4, '학교 안에서 갈아 신어요.'], ['구두', 'shelf', 'shoe', 0x3a2414, '행사에 갈 때 신어요.']],
    asks: [['체육 시간에 달리기할 신발이요.', 0, 1], ['비 오는 날 물웅덩이를 건널 신발이요.', 1, 1], ['학교 안에서 갈아 신을 하얀 신발이요.', 2, 1], ['결혼식에 갈 때 신을 신발이요.', 3, 1], ['갯벌 체험에 신고 갈 신발이요.', 1, 2]] },
  toys: { re: /장난감/, ic: '🧸', st: 'shop', h: [10, 21], acc: 0xf2c230, wall: 0xfdf8ea, ft: ['checker', 1.2, 0xfff6e0], wt: [['paper', 1.0, 0xfff4e8, 0.9, 3.3, 'B']], owner: '장난감 가게 주인', tip: '장난감 찾아 주기', sk: 'trade', sig: 'island',
    slots: [['공', 'bin', 'ball', 0xe0453a, '차고 던지며 놀아요.'], ['블록', 'shelf', 'block', 0x3d74c9, '쌓아서 만들어요.'], ['퍼즐', 'shelf', 'box', 0x3cc76a, '조각을 맞춰 그림을 완성해요.'], ['인형', 'shelf', 'teddy', 0xc98a44, '안고 자요.']],
    asks: [['운동장에서 축구할 것이요.', 0, 1], ['쌓아서 집을 지을 것이요.', 1, 1], ['조각을 맞추면 그림이 되는 것이요.', 2, 1], ['안고 잘 폭신한 것이요.', 3, 1], ['피구할 때 쓸 것이요.', 0, 2]] },
  bike: { re: /자전거/, ic: '🚲', st: 'shop', h: [9, 19], acc: 0x2f8fc4, wall: 0xeef3f6, ft: ['checker', 1.2, 0xe6eaee], owner: '자전거 가게 주인', tip: '자전거 물건 찾아 주기', sk: 'explore', sig: 'bikes',
    slots: [['헬멧', 'shelf', 'helmet', 0x3d74c9, '넘어질 때 머리를 지켜요.'], ['전조등', 'shelf', 'bulb', 0xfff2a8, '밤길 앞을 비춰요.'], ['바람 넣는 펌프', 'peg', 'pump', 0x3a3d42, '바퀴에 바람을 넣어요.'], ['자물쇠', 'peg', 'lock', 0xe0453a, '세워 둔 자전거를 잠가요.']],
    asks: [['자전거 탈 때 머리를 지킬 것이요.', 0, 1], ['밤에 앞을 비출 불이요.', 1, 1], ['바퀴가 납작해졌어요.', 2, 1], ['자전거를 세워 둘 때 잠글 것이요.', 3, 1], ['자전거 탈 때 꼭 써야 하는 것이요.', 0, 2]] },
  butcher: { re: /정육/, ic: '🥩', st: 'shop', h: [9, 20], acc: 0xc8332b, wall: 0xf7f7f5, ft: ['tile', 1.0, 0xf0f0ee], owner: '정육점 주인', tip: '고기 찾아 주기', sk: 'trade', sig: 'island',
    slots: [['닭고기', 'ice', 'meat', 0xf2d0b0, '삼계탕에 써요.'], ['돼지고기', 'ice', 'meat', 0xf0a8a0, '삼겹살은 돼지고기예요.'], ['소고기', 'ice', 'meat', 0xc8433a, '불고기에 많이 써요.'], ['달걀', 'table', 'egg', 0xf6efe4, '닭이 낳아요.']],
    asks: [['삼계탕에 넣을 고기요.', 0, 1], ['삼겹살이요.', 1, 1], ['불고기에 쓸 고기요.', 2, 1], ['달걀말이 할 것이요.', 3, 1], ['인삼과 함께 끓이는 보양식 고기요.', 0, 2]] },
  dryfish: { re: /건어물/, ic: '🦑', st: 'shop', h: [7, 19], acc: 0x2f8fc4, wall: 0xf3efe6, ft: ['wood', 1.0, 0xe8dcc6], owner: '건어물 가게 주인', tip: '마른 해산물 찾아 주기', sk: 'trade', sig: 'island', want: ['🌿', '🐟'],
    slots: [['미역', 'bin', 'leaf', 0x2f4a2a, '생일에 미역국을 끓여요.'], ['김', 'shelf', 'card', 0x1f2a1c, '김밥을 말아요.'], ['멸치', 'bin', 'fish', 0xc0c6cc, '국물을 우려요.'], ['오징어', 'bin', 'squid', 0xe8c8a0, '다리가 열 개예요.']],
    asks: [['생일 아침 국을 끓일 것이요.', 0, 1], ['김밥을 말 것이요.', 1, 1], ['국물을 낼 작은 생선이요.', 2, 1], ['다리가 열 개인 것이요.', 3, 1], ['바닷속 바위에 붙어 자라는 미끄러운 풀이요.', 0, 2]] },
  fishmkt: { re: /수산물|어시장|생선 가게|활어|어항|위판/, ic: '🐟', st: 'shop', h: [6, 19], acc: 0x2f8fc4, wall: 0xeef6fa, ft: ['tile', 1.0, 0xe6f0f4], owner: '수산물 가게 주인', tip: '해산물 찾아 주기', sk: 'trade', sig: 'tank', want: ['🐟', '🐚'],
    slots: [['고등어', 'ice', 'fish', 0x3a6a8a, '등이 푸른 생선이에요.'], ['조개', 'ice', 'clam', 0xd9c8a0, '껍데기가 두 장이에요.'], ['새우', 'ice', 'shrimp', 0xef8b6a, '익히면 빨개져요.'], ['꽃게', 'ice', 'crab', 0xc8433a, '옆으로 걸어요.']],
    asks: [['등이 푸른 생선이요.', 0, 1], ['껍데기가 두 장인 것이요.', 1, 1], ['익히면 빨개지는 수염 달린 것이요.', 2, 1], ['옆으로 걷는 것이요.', 3, 1], ['갯벌에서 캐는 것이요.', 1, 2], ['집게발이 있는 것이요.', 3, 2]] },
  ice: { re: /얼음/, ic: '🧊', st: 'shop', h: [6, 20], acc: 0x5fb6e0, wall: 0xf0f7fb, ft: ['tile', 1.0, 0xe8f2f8], owner: '얼음 가게 주인', tip: '얼음 찾아 주기', sk: 'work', sig: 'freezer',
    slots: [['각얼음', 'bin', 'cube', 0xdff3ff, '음료에 넣어요.'], ['큰 얼음', 'bin', 'block', 0xcfeaff, '빙수를 갈아요.'], ['스티로폼 상자', 'shelf', 'box', 0xf6f6f6, '생선을 시원하게 실어 가요.'], ['아이스팩', 'shelf', 'pack', 0x8fc4e8, '부딪힌 곳을 차갑게 해요.']],
    asks: [['음료에 넣을 작은 얼음이요.', 0, 1], ['빙수를 갈 큰 얼음이요.', 1, 1], ['잡은 생선을 시원하게 실어 갈 상자요.', 2, 1], ['부딪힌 곳을 차갑게 할 것이요.', 3, 1]] },
  farmstand: { re: /농산물|직판장|채소 가게|농협 하나로/, ic: '🥬', st: 'shop', h: [8, 19], acc: 0x4e9a43, wall: 0xf4efe2, ft: ['wood', 1.0, 0xe8d8bc], owner: '직판장 일꾼', tip: '농산물 찾아 주기', sk: 'trade', sig: 'crates', want: ['🥬', '🥔', '🥕', '🌽', '🍠', '🥒', '🍅'],
    slots: [['쌀·잡곡', 'bin', 'sack', 0xeee4cc, '논에서 거둬요.'], ['채소', 'bin', 'cabbage', 0x8fd06a, '밭에서 거둬요.'], ['뿌리채소', 'bin', 'potato', 0xc89a5a, '땅속에서 자라요.'], ['달걀', 'table', 'egg', 0xf6efe4, '닭장에서 모아요.']],
    asks: [['밥 지을 것이요.', 0, 1], ['쌈 싸 먹을 잎채소요.', 1, 1], ['땅속에서 자란 감자요.', 2, 1], ['닭이 낳은 것이요.', 3, 1], ['고구마처럼 땅속에서 크는 것이요.', 2, 2]] },
  mill: { re: /방앗간|정미소/, ic: '🌾', st: 'shop', h: [8, 18], acc: 0xa2541b, wall: 0xf3ead8, ft: ['wood', 1.0, 0xe6d6be], owner: '방앗간 주인', tip: '방앗간 물건 찾아 주기', sk: 'work', sig: 'grinder', want: ['🍚', '🌽'],
    slots: [['고춧가루', 'shelf', 'jar', 0xc8332b, '빨간 고추를 말려 빻아요.'], ['참기름', 'shelf', 'bottle', 0xb07a20, '깨를 볶아 짜요.'], ['쌀가루', 'bin', 'sack', 0xf6f4ee, '떡을 만들어요.'], ['미숫가루', 'shelf', 'jar', 0xd9b46a, '곡식을 볶아 갈아요.']],
    asks: [['김치 양념에 넣을 빨간 가루요.', 0, 1], ['깨를 볶아 짠 고소한 기름이요.', 1, 1], ['떡을 만들 가루요.', 2, 1], ['여름에 물에 타 먹는 곡식 가루요.', 3, 1], ['비빔밥에 한 방울 넣는 고소한 것이요.', 1, 2]] },
  farmsupply: { re: /농약방|농자재|종묘|씨앗/, ic: '🌱', st: 'shop', h: [7, 19], acc: 0x4e9a43, wall: 0xf3efe2, ft: ['checker', 1.2, 0xe8e6dc], owner: '농자재 가게 주인', tip: '농사 물건 찾아 주기', sk: 'farm', sig: 'island',
    slots: [['봄 씨앗', 'shelf', 'pack', 0xf2c230, '봄에 심는 옥수수, 콩 씨앗이에요.'], ['가을 씨앗', 'shelf', 'pack', 0xb03a2e, '가을에 심는 마늘, 보리예요.'], ['모종', 'table', 'sprout', 0x5aa84c, '싹이 튼 어린 식물이에요.'], ['호미·장갑', 'peg', 'tool', 0x8a5a34, '흙을 파고 손을 지켜요. 약은 어른이 다뤄요.']],
    asks: [['봄에 심을 옥수수 씨앗이요.', 0, 1], ['가을에 심어 겨울을 나는 마늘이요.', 1, 1], ['이미 싹이 튼 고추를 심고 싶어요.', 2, 1], ['밭에서 잡초를 콕콕 뽑을 것이요.', 3, 1], ['겨울을 나고 봄에 거두는 보리요.', 1, 2]] },
  machine: { re: /농기계|수리/, ic: '🚜', st: 'shop', h: [8, 18], acc: 0xef8b33, wall: 0xe9ecef, ft: ['checker', 1.4, 0xdcdfe2], owner: '수리 기사', tip: '부품 찾아 주기', sk: 'work', sig: 'tractor',
    slots: [['타이어', 'bin', 'wheel', 0x2b2d31, '바퀴 바깥 고무예요.'], ['기름', 'shelf', 'bottle', 0xd8b04a, '기계가 부드럽게 돌아요.'], ['렌치', 'peg', 'hammer', 0x9aa0a6, '나사를 조이고 풀어요.'], ['전구', 'shelf', 'bulb', 0xfff2a8, '경운기 앞불이에요.']],
    asks: [['경운기 바퀴 고무가 닳았어요.', 0, 1], ['기계가 삐걱거려요.', 1, 1], ['헐거운 나사를 조일 것이요.', 2, 1], ['밤에 논길을 비출 앞불이 나갔어요.', 3, 1]] },
  gift: { re: /기념품/, ic: '🎁', st: 'shop', h: [10, 20], acc: 0x8a5bd1, wall: 0xfbfaf6, ft: ['wood', 1.0, 0xeee2d0], owner: '기념품 가게 주인', tip: '기념품 찾아 주기', sk: 'trade', sig: 'island',
    slots: [['엽서', 'shelf', 'card', 0x8fc4e8, '풍경 그림이 있어요.'], ['열쇠고리', 'peg', 'key', 0xd8b04a, '가방에 달아요.'], ['모자', 'shelf', 'cap', 0xe0453a, '햇볕을 가려요.'], ['손수건', 'shelf', 'towel', 0xf2c230, '땀을 닦아요.']],
    asks: [['친구에게 풍경을 보낼 것이요.', 0, 1], ['가방에 달 작은 것이요.', 1, 1], ['햇볕을 가릴 것이요.', 2, 1], ['땀을 닦을 것이요.', 3, 1]] },
  herbs: { re: /약초|산나물|버섯 가게|토종꿀/, ic: '🌿', st: 'shop', h: [8, 19], acc: 0x6b8a3a, wall: 0xf2ead8, ft: ['wood', 1.0, 0xe6d6b8], wt: [['slat', 1.0, 0xffffff, 0.9, 3.3, 'B']], owner: '약초 가게 주인', tip: '산 물건 찾아 주기', sk: 'look', sig: 'baskets', want: ['🍄', '🍃', '🍯'],
    slots: [['쑥', 'bin', 'leaf', 0x6b9a4a, '쑥떡을 만들어요.'], ['도라지', 'bin', 'root', 0xf2ece0, '하얀 뿌리를 먹어요.'], ['대추', 'bin', 'apple', 0x9a2a1e, '삼계탕에 넣는 빨간 열매예요.'], ['말린 버섯', 'bin', 'shroom', 0x8a5a34, '표고를 햇볕에 말려요.']],
    asks: [['쑥떡을 만들 향긋한 풀이요.', 0, 1], ['하얀 뿌리를 먹는 나물이요.', 1, 1], ['삼계탕에 넣는 빨간 열매요.', 2, 1], ['표고를 햇볕에 말린 것이요.', 3, 1], ['도라지 타령에 나오는 것이요.', 1, 2]] },
  gear: { re: /어구|낚시 가게|낚시/, ic: '🎣', st: 'shop', h: [5, 19], acc: 0x2f6fd0, wall: 0xeef3f6, ft: ['wood', 1.0, 0xdcd0bc], wt: [['slat', 1.0, 0xe6f0ff, 0.9, 3.3, 'B']], owner: '어구점 주인', tip: '어구 찾아 주기', sk: 'work', sig: 'nets',
    slots: [['그물', 'bin', 'net', 0x2f8f6a, '물고기를 한꺼번에 잡아요.'], ['낚싯대', 'peg', 'rod', 0x3a3d42, '한 마리씩 낚아요.'], ['부표', 'bin', 'ball', 0xef7a24, '물에 떠서 그물 자리를 알려요.'], ['장화·장갑', 'shelf', 'boot', 0xf2c230, '갯벌과 바닷물에서 발과 손을 지켜요.']],
    asks: [['물고기를 한꺼번에 잡을 것이요.', 0, 1], ['한 마리씩 낚을 것이요.', 1, 1], ['물에 떠서 그물 자리를 알려 줄 것이요.', 2, 1], ['갯벌에 들어갈 때 신을 것이요.', 3, 1], ['멀리서도 보이게 바다에 띄우는 주황 공이요.', 2, 2]] },
  outdoor: { re: /등산|캠핑 용품|아웃도어/, ic: '🥾', st: 'shop', h: [9, 20], acc: 0x4e7a3a, wall: 0xf2f0e8, ft: ['wood', 1.0, 0xe2d4ba], owner: '등산 장비 가게 주인', tip: '산 갈 준비물 찾아 주기', sk: 'explore', sig: 'island',
    slots: [['등산화', 'shelf', 'boot', 0x6b4a2f, '미끄러운 산길에서 발을 지켜요.'], ['배낭', 'shelf', 'bag', 0x2f6b4a, '물과 간식을 넣어 메요.'], ['물병', 'shelf', 'bottle', 0x3d74c9, '산에서 마실 물을 담아요.'], ['지팡이', 'peg', 'rod', 0x9aa0a6, '내리막에서 몸을 받쳐 줘요.']],
    asks: [['미끄러운 바위 길에서 신을 것이요.', 0, 1], ['물과 간식을 넣어 멜 것이요.', 1, 1], ['산꼭대기에서 마실 물을 담을 것이요.', 2, 1], ['내리막길에서 몸을 받쳐 줄 것이요.', 3, 1]] },
  pet: { re: /꼬리 용품|반려|펫/, ic: '🐾', st: 'shop', h: [10, 20], acc: 0xef8b33, wall: 0xfbf6ee, ft: ['wood', 1.0, 0xf0e2c8], owner: '용품 가게 주인', tip: '반려동물 물건 찾아 주기', sk: 'look', sig: 'island',
    slots: [['강아지 사료', 'bin', 'sack', 0xc89a5a, '강아지 몸에 맞춘 밥이에요.'], ['고양이 사료', 'bin', 'sack', 0x8fc4e8, '고양이 몸에 맞춘 밥이에요.'], ['목줄', 'peg', 'roll', 0xe0453a, '산책할 때 매요.'], ['장난감', 'bin', 'ball', 0xf2c230, '물고 놀아요.']],
    asks: [['강아지 밥이요.', 0, 1], ['고양이 밥이요.', 1, 1], ['강아지 산책할 때 맬 것이요.', 2, 1], ['강아지가 물고 놀 것이요.', 3, 1]] },
  bath: { re: /사우나|목욕/, ic: '♨️', st: 'shop', h: [6, 22], acc: 0x2fb5b0, wall: 0xeef7f6, ft: ['tile', 1.0, 0xe2f0ee], wt: [['subway', 1.0, 0xffffff, 0.9, 3.3, 'BLR']], owner: '목욕탕 주인', tip: '목욕 물건 가져다주기', sk: 'work', sig: 'lockers',
    slots: [['수건', 'shelf', 'towel', 0xf6f0e4, '몸을 닦아요.'], ['바가지', 'bin', 'bowl', 0xf2c230, '물을 떠요.'], ['신발장 열쇠', 'peg', 'key', 0xe0453a, '신발을 넣고 잠가요.'], ['비누', 'shelf', 'soap', 0xf6d0dc, '몸을 씻어요.']],
    asks: [['씻고 나서 몸을 닦을 것이요.', 0, 1], ['물을 떠서 부을 것이요.', 1, 1], ['신발을 넣고 잠글 열쇠요.', 2, 1], ['몸을 씻을 거품이 나는 것이요.', 3, 1]] },
  // 식당 갈래(주문 쪽지 → 탁자 · 창가/안쪽 · 혼자/둘) — menu = 차림표(접시 색)
  noodle: { re: /국숫집|국수|칼국수/, ic: '🍜', st: 'diner', h: [10, 21], acc: 0xb07a20, wall: 0xf6eedd, ft: ['wood', 1.0, 0xe8d4b4], owner: '국숫집 주인', tip: '주문 나르기', sk: 'work', menu: [['잔치국수', 0xf2e6c8], ['비빔국수', 0xd8452a], ['칼국수', 0xe9dcc0]] },
  kimbap: { re: /김밥/, ic: '🍙', st: 'diner', h: [8, 21], acc: 0x2f6b3a, wall: 0xf7f3ea, ft: ['tile', 1.0, 0xf2eee4], owner: '김밥집 주인', tip: '주문 나르기', sk: 'work', menu: [['김밥', 0x2b3a2a], ['라면', 0xe0a040], ['떡볶이', 0xd8352a]] },
  snack: { re: /분식|떡볶이|어묵/, ic: '🍢', st: 'diner', h: [10, 21], acc: 0xd8352a, wall: 0xfdf3e8, ft: ['checker', 1.2, 0xfbefe0], owner: '분식집 주인', tip: '주문 나르기', sk: 'work', menu: [['떡볶이', 0xd8352a], ['순대', 0x3a2a2a], ['튀김', 0xd9a35c]] },
  chicken: { re: /치킨|통닭/, ic: '🍗', st: 'diner', h: [12, 23], acc: 0xef8b33, wall: 0xfdf3e4, ft: ['wood', 1.0, 0xead6b8], owner: '치킨집 주인', tip: '주문 나르기', sk: 'work', menu: [['후라이드 치킨', 0xd99a44], ['양념 치킨', 0xb8331e]] },
  cutlet: { re: /돈가스/, ic: '🍛', st: 'diner', h: [11, 21], acc: 0xa2541b, wall: 0xf7efe2, ft: ['wood', 1.0, 0xe8d6bc], owner: '돈가스집 주인', tip: '주문 나르기', sk: 'work', menu: [['돈가스', 0xc98a44], ['우동', 0xf2e6c8]] },
  bibim: { re: /비빔밥|백반|한식|들마을 식당|산채 식당|^식당$|두부/, ic: '🍚', st: 'diner', h: [11, 21], acc: 0x8a5a34, wall: 0xf4ecdc, ft: ['wood', 1.0, 0xe2ceb0], owner: '식당 주인', tip: '주문 나르기', sk: 'work', menu: [['비빔밥', 0xd8452a], ['된장찌개', 0xa2741e], ['두부 부침', 0xf2e6c8]] },
  porridge: { re: /죽집/, ic: '🥣', st: 'diner', h: [8, 20], acc: 0xd9a35c, wall: 0xf8f2e6, ft: ['wood', 1.0, 0xeedcc0], owner: '죽집 주인', tip: '주문 나르기', sk: 'work', menu: [['호박죽', 0xf2b030], ['전복죽', 0xc8c0a0]] },
  chinese: { re: /중국집|중화/, ic: '🥟', st: 'diner', h: [11, 21], acc: 0xc8332b, wall: 0xfaf0e6, ft: ['tile', 1.0, 0xf2e6da], owner: '중국집 주인', tip: '주문 나르기', sk: 'work', menu: [['짜장면', 0x2b1d14], ['짬뽕', 0xc8332b], ['군만두', 0xd9a35c]] },
  pizza: { re: /피자|스파게티|햄버거|샤브|뷔페/, ic: '🍕', st: 'diner', h: [11, 22], acc: 0xc8332b, wall: 0xfaf3ea, ft: ['checker', 1.2, 0xf4ebe0], owner: '식당 주인', tip: '주문 나르기', sk: 'work', menu: [['피자', 0xe0a040], ['스파게티', 0xd8452a], ['샐러드', 0x5aa84c]] },
  seafood: { re: /횟집|매운탕|해물|조개구이/, ic: '🐟', st: 'diner', h: [11, 22], acc: 0x2f8fc4, wall: 0xeef4f6, ft: ['wood', 1.0, 0xdcd0bc], owner: '바닷가 식당 주인', tip: '주문 나르기', sk: 'work', sig: 'tank', menu: [['매운탕', 0xc8332b], ['물회', 0xd8452a], ['조개 칼국수', 0xe9dcc0]] },
  // 학원·교실(ACAD-1 · 선생님 E = 수업 한 판 · town_acad.js · 문 = 10~21시 자습실 · 수업 = 오후 2~7시)
  english: { re: /영어/, ic: '🔤', st: 'class', h: [10, 21], acc: 0x3d74c9, wall: 0xf4f7fb, ft: ['tile', 1.0, 0xeef2f6], owner: '영어 선생님', tip: '낱말·대화 수업', sk: 'explore', board: 'English' },
  math: { re: /수학/, ic: '📐', st: 'class', h: [10, 21], acc: 0x2f9f58, wall: 0xf4f8f4, ft: ['tile', 1.0, 0xeef4ee], owner: '수학 선생님', tip: '분수·소수·도형 수업', sk: 'explore', board: '수학' },
  piano: { re: /피아노|음악/, ic: '🎹', st: 'class', h: [10, 21], acc: 0x8a5bd1, wall: 0xf7f4fb, ft: ['wood', 1.0, 0xeadcc6], owner: '피아노 선생님', tip: '음 높이·리듬 수업', sk: 'explore', sig: 'pianos', board: '음악' },
  art: { re: /미술|그림/, ic: '🎨', st: 'class', h: [10, 21], acc: 0xef8b33, wall: 0xfbf6ee, ft: ['wood', 1.0, 0xeedcc6], owner: '미술 선생님', tip: '색 섞기·무늬 수업', sk: 'look', sig: 'easels', board: '색과 무늬' },
  taekwondo: { re: /태권도|체육관|합기도/, ic: '🥋', st: 'class', h: [10, 21], acc: 0x2b5a8a, wall: 0xf4f6fa, ft: ['tile', 1.2, 0xdde8f4], owner: '사범님', tip: '동작 순서 수업', sk: 'explore', sig: 'mats', board: '태권도' },
  science: { re: /과학|코딩/, ic: '🔬', st: 'class', h: [10, 21], acc: 0x2fb5b0, wall: 0xf2f8f8, ft: ['tile', 1.0, 0xeaf4f4], owner: '과학 선생님', tip: '과학·코딩 수업', sk: 'look', board: '과학·코딩' },
  study: { re: /공부방|독서|논술|교실/, ic: '📖', st: 'class', h: [10, 21], acc: 0x6b4a2f, wall: 0xf6f0e4, ft: ['wood', 1.0, 0xeedcc0], owner: '공부방 선생님', tip: '읽기·과학 수업', sk: 'explore', board: '공부방' },
  // 사무실·안내(손님 바람 → 맞는 판)
  realty: { re: /부동산/, ic: '🏠', st: 'office', h: [9, 19], acc: 0x2f6b4a, wall: 0xf4f2ec, ft: ['wood', 1.0, 0xe6d8c2], owner: '부동산 직원', tip: '손님에게 맞는 집 고르기', sk: 'explore',
    slots: [['학교 앞 아파트', 'board', 'house', 0x3d74c9, '학교까지 걸어서 가까워요.'], ['바닷가 집', 'board', 'house', 0x2fb5b0, '창으로 바다가 보여요.'], ['산 아래 집', 'board', 'house', 0x4e9a43, '숲이 가깝고 조용해요.'], ['시장 옆 집', 'board', 'house', 0xef8b33, '장 보기가 편해요.']],
    asks: [['아이가 학교에 걸어 다니면 좋겠어요.', 0, 1], ['창밖으로 바다를 보고 싶어요.', 1, 1], ['숲 가까운 조용한 곳이요.', 2, 1], ['장 보러 가기 편한 곳이요.', 3, 1], ['고깃배 일을 해서 항구가 가까워야 해요.', 1, 2], ['아침마다 산길을 걷고 싶어요.', 2, 2]] },
  travel: { re: /여행사|관광 안내|안내소|체험 농장 안내|캠핑장 관리/, ic: '🧭', st: 'office', h: [9, 18], acc: 0x2f8fc4, wall: 0xf2f6fa, ft: ['tile', 1.0, 0xeaf0f4], owner: '안내 직원', tip: '여행 손님 안내하기', sk: 'explore', mapE: true,
    slots: [['바다 여행', 'board', 'wave', 0x2f8fc4, '갯벌 체험, 배 타기를 해요.'], ['산 여행', 'board', 'peak', 0x4e9a43, '등산, 단풍 구경을 해요.'], ['들 여행', 'board', 'field', 0xd9b46a, '논, 밭 체험 농장을 가요.'], ['시내 여행', 'board', 'city', 0x8a5bd1, '박물관, 지하철을 타요.']],
    asks: [['조개를 캐 보고 싶어요.', 0, 1], ['단풍 구경을 가고 싶어요.', 1, 1], ['모내기 체험을 하고 싶어요.', 2, 1], ['박물관에 가고 싶어요.', 3, 1], ['밀물과 썰물을 보고 싶어요.', 0, 2], ['산꼭대기에서 해 뜨는 것을 보고 싶어요.', 1, 2]] },
  office: { re: /보험|회사|사무소|어촌계|산림 관리|택배|농업 기술/, ic: '🗂', st: 'office', h: [9, 18], acc: 0x5a6b7a, wall: 0xf2f3f4, ft: ['tile', 1.0, 0xe9ebee], owner: '사무실 직원', tip: '서류 나누기', sk: 'work',
    slots: [['파란 서류함', 'board', 'file', 0x3d74c9, '새로 온 서류예요.'], ['초록 서류함', 'board', 'file', 0x3cc76a, '다 끝난 서류예요.'], ['노란 서류함', 'board', 'file', 0xf2c230, '도장이 필요한 서류예요.'], ['우편 상자', 'bin', 'box', 0xc8945a, '밖으로 보낼 서류예요.']],
    asks: [['오늘 새로 들어온 서류예요.', 0, 1], ['다 처리한 서류예요.', 1, 1], ['아직 도장을 안 찍은 서류예요.', 2, 1], ['봉투에 넣어 보낼 서류예요.', 3, 1]] },
  center: { re: /행정복지센터|주민센터|면사무소|동사무소/, ic: '🏛', st: 'office', h: [9, 18], acc: 0x2f6fd0, wall: 0xf3f5f8, ft: ['tile', 1.0, 0xeaeef2], owner: '센터 직원', tip: '민원 손님 안내하기', sk: 'explore',
    slots: [['민원 창구', 'board', 'file', 0x3d74c9, '서류를 떼고 이사 온 것을 알려요.'], ['복지 상담', 'board', 'heart', 0xe0453a, '도움이 필요한 이웃을 이어 줘요.'], ['고칠 곳 신고', 'board', 'cone', 0xef8b33, '문 옆 민원 안내 탁자에서 받아요.'], ['마을 소식', 'board', 'card', 0x4e9a43, '마을 행사, 알림을 붙여요.']],
    asks: [['이사 와서 새 주소를 알리고 싶어요.', 0, 1], ['혼자 사시는 할머니가 도움이 필요해요.', 1, 1], ['보도블록이 깨졌어요.', 2, 1], ['이번 달 마을 행사가 궁금해요.', 3, 1]] },
  // 창고·작업장
  ware: { re: /창고|물류|집하장|미곡처리장|냉동/, ic: '📦', st: 'ware', h: [8, 18], acc: 0xef8b33, wall: 0xe6e8ea, ft: ['checker', 2.0, 0xd6d9dc], owner: '창고 일꾼', tip: '상자 나르기', sk: 'work',
    slots: [['산 마을 칸', 'shelf', 'crate', 0x4e9a43, '산 마을로 가는 상자예요.'], ['들 마을 칸', 'shelf', 'crate', 0xd9b46a, '들 마을로 가는 상자예요.'], ['바다 마을 칸', 'shelf', 'crate', 0x2f8fc4, '바다 마을로 가는 상자예요.'], ['시내 칸', 'shelf', 'crate', 0x8a5bd1, '시내로 가는 상자예요.']],
    asks: [['그물과 부표가 든 상자예요.', 2, 1], ['호미와 볍씨가 든 상자예요.', 1, 1], ['등산 지팡이가 든 상자예요.', 0, 1], ['지하철 표 기계 부품이 든 상자예요.', 3, 1], ['김 양식 줄이 든 상자예요.', 2, 2], ['표고버섯 종균이 든 상자예요.', 0, 2]] },
  workshop: { re: /가구 공장|목공|종이 공장/, ic: '🏭', st: 'ware', h: [9, 18], acc: 0x8a5a34, wall: 0xeee6d8, ft: ['wood', 1.2, 0xd8c4a4], owner: '공장 일꾼', tip: '재료 나누기', sk: 'work',
    slots: [['나무판', 'shelf', 'plank', 0xc8a070, '책상, 의자를 만들어요.'], ['종이 상자', 'bin', 'box', 0xc8945a, '접어서 모아요.'], ['우유갑', 'bin', 'carton', 0xf6f4ee, '씻어 말려 따로 모아요.'], ['신문지', 'bin', 'paper', 0xdedad0, '반듯하게 묶어요.']],
    asks: [['의자 다리를 만들 재료요.', 0, 1], ['납작하게 접은 택배 상자예요.', 1, 1], ['씻어서 말린 우유갑이에요.', 2, 1], ['다 읽은 신문이에요.', 3, 1], ['종이팩은 따로 모아요. 주스 팩도 그래요.', 2, 2]] },
  // 쉼·모임
  inn: { re: /민박|펜션|게스트하우스/, ic: '🛏', st: 'inn', h: null, acc: 0x2f8fc4, wall: 0xf6f2ea, ft: ['wood', 1.0, 0xe8d6bc], owner: '민박 주인', tip: '손님 방 정리 돕기', sk: 'work',
    slots: [['이불장', 'cab', 'quilt', 0xf08fb2, '이불을 개어 넣어요.'], ['수건 걸이', 'peg', 'towel', 0xf6f0e4, '젖은 수건을 걸어 말려요.'], ['신발장', 'cab', 'shoe', 0x8a5a34, '신발을 넣어요.'], ['창가 탁자', 'table', 'cup', 0xf6f4ee, '찻잔을 놓아요.']],
    asks: [['손님이 개어 둔 이불이요.', 0, 1], ['손님이 쓴 젖은 수건이요.', 1, 1], ['현관에 벗어 둔 신발이요.', 2, 1], ['따뜻한 차를 담을 잔이요.', 3, 1]] },
  hall: { re: /마을회관|경로당 쉼터|주민 회의/, ic: '🏘', st: 'hall', h: [9, 18], acc: 0x8a5a34, wall: 0xf3ead8, ft: ['wood', 1.0, 0xe2ceb0], owner: '마을 이장', tip: '이웃 부탁 게시판', sk: 'explore' },
  terminal: { re: /버스 터미널|터미널/, ic: '🚌', st: 'term', h: [6, 22], acc: 0x2f6fd0, wall: 0xf2f4f6, ft: ['checker', 1.6, 0xe4e7ea], owner: '매표소 직원', tip: '타는 곳 안내하기', sk: 'explore', mapE: true,
    slots: [['1번 타는 곳', 'board', 'peak', 0x4e9a43, '산 쪽으로 가는 버스예요.'], ['2번 타는 곳', 'board', 'wave', 0x2f8fc4, '바다 쪽으로 가는 버스예요.'], ['3번 타는 곳', 'board', 'city', 0x8a5bd1, '시내로 가는 버스예요.']],
    asks: [['등산하러 가요.', 0, 1], ['갯벌 체험을 하러 가요.', 1, 1], ['지하철로 갈아타려고 해요.', 2, 1], ['계곡에서 버섯 농장을 보려고요.', 0, 2], ['등대를 보러 가요.', 1, 2]] },
  // 집·아파트(우리 집처럼 · 이웃 = 하는 일로)
  home: { st: 'home', h: [8, 20], acc: 0x8a5a34, owner: '이웃', tip: '정리 돕기', sk: 'work' },
  apt: { st: 'apt', h: [8, 20], acc: 0x5a6b7a, owner: '이웃', tip: '정리 돕기', sk: 'work' },
  // 이미 있는 가게 방(town_indoor.js) — 계산대 = 사기 + 진열 돕기(창 고르기)
  store: { st: 'store', ic: '🛒', owner: '점원', tip: '물건 사기, 진열 돕기', sk: 'trade' },
};
for (const k in MENU) if (CATS[k]) CATS[k].menu = MENU[k].dishes.map(d => [d[0], d[1]]);   /* ENTER-3: 식당 차림표 = 갈래마다 다른 차림(town_enter2.js MENU) */
// 이미 있는 가게 방 진열 돕기(갈래마다 칸 셋 · 물건 → 칸 · 까닭)
const SORT = {
  conv: [['냉장 칸', '과자 칸', '라면·통조림 칸'], [['우유', 0, '우유는 차갑게 둬야 쉽게 상하지 않아요.'], ['감자칩', 1, '과자는 봉지째 과자 칸에 둬요.'], ['컵라면', 2, '컵라면은 따뜻한 곳에 둬도 돼요.'], ['요구르트', 0, '요구르트도 차갑게 둬요.'], ['참치 통조림', 2, '통조림은 오래 두어도 괜찮아요.']]],
  grocery: [['냉장 칸', '과일·채소 칸', '과자·통조림 칸'], [['우유', 0, '우유는 차갑게 둬야 쉽게 상하지 않아요.'], ['사과', 1, '과일은 과일 칸에 둬요.'], ['배추', 1, '채소는 채소 칸이에요.'], ['버터', 0, '버터는 녹지 않게 차갑게 둬요.'], ['통조림', 2, '통조림은 오래 두어도 괜찮아요.']]],
  bakery: [['빵 선반', '차가운 진열장', '봉투 자리'], [['식빵', 0, '식빵은 빵 선반에 둬요.'], ['생크림 케이크', 1, '생크림은 녹기 쉬워서 차갑게 둬요.'], ['종이 봉투', 2, '봉투는 계산대 옆에 둬요.'], ['크루아상', 0, '크루아상은 빵 선반이에요.'], ['샌드위치', 1, '햄, 채소가 든 샌드위치는 차갑게 둬요.']]],
  cafe: [['차가운 음료', '따뜻한 음료', '케이크'], [['얼음 넣은 주스', 0, '얼음이 녹기 전에 차가운 칸이에요.'], ['따뜻한 코코아', 1, '김이 나는 음료는 따뜻한 칸이에요.'], ['딸기 케이크', 2, '케이크는 케이크 칸이에요.'], ['따뜻한 우유', 1, '따뜻한 칸이에요.'], ['아이스티', 0, '차가운 칸이에요.']]],
  icecream: [['냉동 통', '콘·컵 선반', '숟가락 통'], [['딸기 아이스크림 통', 0, '아이스크림은 얼어 있어야 해요.'], ['과자 콘', 1, '콘은 바삭하게 선반에 둬요.'], ['작은 숟가락', 2, '숟가락은 숟가락 통이에요.'], ['종이컵', 1, '컵은 선반에 둬요.'], ['초코 아이스크림 통', 0, '녹지 않게 냉동 통이에요.']]],
  gift: [['옷 걸이', '모자 선반', '인형 선반'], [['티셔츠', 0, '옷은 걸어 둬요.'], ['모자', 1, '모자는 모자 선반이에요.'], ['곰 인형', 2, '인형은 인형 선반이에요.']]],
  mtn: [['버섯 가판', '약초 가판', '꿀 선반'], [['표고버섯', 0, '버섯 가판이에요.'], ['산나물', 1, '산나물은 약초 가판이에요.'], ['꿀단지', 2, '꿀은 꿀 선반이에요.']]],
};
// 이웃이 하는 일(구역마다 · 이름 X) + 그 집 소품 칸(정리 돕기 넷째 칸)
const JOBS = {
  바다: [['고깃배 타는 이웃', ['장화 걸이', 'boot', 0xf2c230, '바다에서 신고 온 장화를 말려요.'], '바다에서 신고 온 젖은 장화요.'], ['김 기르는 이웃', ['그물 바구니', 'net', 0x2f8f6a, '김 양식 그물을 손질해요.'], '김 양식장에서 쓴 작은 그물이요.']],
  들: [['농사짓는 이웃', ['모자 걸이', 'cap', 0xe9d27a, '밭일 할 때 쓰는 밀짚모자예요.'], '밭에서 쓰고 온 밀짚모자요.'], ['과수원 하는 이웃', ['바구니 자리', 'bowl', 0xc8945a, '열매 따는 바구니예요.'], '배를 따 담던 바구니요.']],
  산: [['버섯 기르는 이웃', ['장작 바구니', 'plank', 0x8a5a34, '겨울 난로에 넣을 장작이에요.'], '마당에서 주워 온 장작이요.'], ['숲을 지키는 이웃', ['모자 걸이', 'cap', 0x4e7a3a, '산에서 쓰는 모자예요.'], '산길에서 쓰고 온 모자요.']],
  강: [['낚시를 좋아하는 이웃', ['낚싯대 자리', 'rod', 0x3a3d42, '낚싯대를 세워 둬요.'], '강가에서 쓴 낚싯대요.']],
  시내: [['버스 운전하는 이웃', ['모자 걸이', 'cap', 0x2f6fd0, '운전할 때 쓰는 모자예요.'], '버스 운전할 때 쓰는 모자요.'], ['요리하는 이웃', ['앞치마 걸이', 'cloth', 0xf6f4ee, '부엌에서 두르는 앞치마예요.'], '부엌에서 두른 앞치마요.'], ['회사 다니는 이웃', ['가방 자리', 'bag', 0x3a3d42, '출근 가방을 둬요.'], '회사에 들고 가는 가방이요.'], ['간호사 이웃', ['가방 자리', 'bag', 0xe9eef4, '병원 갈 때 드는 가방이에요.'], '병원에 들고 가는 가방이요.']],
};
JOBS.읍내 = JOBS.시내; JOBS.관광 = JOBS.시내;
const HOME_SLOTS = [['책장', 'cab', 'book', 0x3d74c9, '책을 꽂아 둬요.'], ['장난감 상자', 'bin', 'block', 0xe0453a, '놀고 나서 넣어요.'], ['빨래 바구니', 'bin', 'towel', 0xa8c8e8, '벗은 옷을 넣어요.']];
const HOME_ASKS = [['바닥에 떨어진 동화책이요.', 0, 1], ['소파 밑에서 나온 블록이요.', 1, 1], ['벗어 둔 양말이요.', 2, 1], ['다 읽은 그림책이요.', 0, 2], ['굴러다니는 장난감 자동차요.', 1, 2], ['젖은 수건이요.', 2, 2]];
// 이름 → 갈래(town.js inKind 마지막 · 이름 없는 건물은 kind로 집·아파트) — 병원 갈래·은행·공장은 기존 방(via)
const VIA = [[/치과|소아과|안과|정형외과|이비인후과|피부과|내과/, 'clinic'], [/^농협$|^수협$/, 'bank'], [/^공장$/, 'factory']];
export function entOf(o) { const nm = String(o.name || ''); if (!nm) return o.kind === 'house' ? 'home' : o.kind === 'apt' ? 'apt' : null;
  for (const [re, k] of VIA) if (re.test(nm)) return 'via:' + k;
  if (o.shop) return 'store';
  for (const k in CATS) { const C = CATS[k]; if (C.re && C.re.test(nm)) return k; }
  return o.kind === 'house' ? 'home' : o.kind === 'apt' ? 'apt' : null; }
export const ENT_CATS = CATS;
export const ENT_HOURS = Object.fromEntries(Object.entries(CATS).map(([k, C]) => [k, C.h || null]));

export function createEnter(A) {
  const en = () => A.lang() === 'en', esc = t => A.esc(t), day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark(), toast = (t, s) => A.say(t, s), sfx = k => A.sfx && A.sfx(k);
  const S = () => { const g = A.GAME.S; let s = g.ent; if (!s || typeof s !== 'object' || s.v !== ENT_V) s = g.ent = { v: ENT_V, b: {}, c: {} }; return s; };   /* b = 건물마다 { n 도운 수, d 마지막 날, t 오늘 수 } · c = 갈래마다 { n, last: [최근 부탁 둘] } */
  let CUR = null; const DBG = [], log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  const hh = h => String(h).padStart(2, '0') + ':00', josa = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b; };
  const info = B9 => { const nm = B9.name || B9.signT || '', k = entOf({ name: nm, kind: B9.kind, shop: !!A.shopOf(nm) }); return { nm, k }; };
  const regOf = B9 => A.region(B9.cx, B9.cz) || '시내';
  const jobOf = B9 => { const L9 = JOBS[regOf(B9)] || JOBS.시내; return L9[hashS(String(B9.b && B9.b.id || '') + ':' + Math.round(B9.cx)) % L9.length]; };
  function name(B9) { const { nm, k } = info(B9); if ((k === 'home' || k === 'apt') && B9.name) return B9.name; if (k === 'home') return jobOf(B9)[0] + (en() ? "'s house" : '네 집'); if (k === 'apt') return (B9.dong ? B9.dong + ' ' : '') + (en() ? jobOf(B9)[0] + "'s flat" : jobOf(B9)[0] + '네 집'); return nm; }
  const catOf = B9 => { const k = info(B9).k; return k && !k.startsWith('via:') ? k : null; };
  const hoursOf = B9 => { const k = catOf(B9); if (k === 'store') { const S9 = A.shopOf(info(B9).nm); return S9 ? [S9[2], S9[3]] : null; } return k && CATS[k] ? CATS[k].h : null; };
  function tip(B9) { const k = catOf(B9); if (!k) return ''; if (en()) return 'Help inside'; const C = CATS[k], g = A.GAME && A.GAME.S;
    if (g && (C.st === 'home' || C.st === 'apt')) { const id = String(B9.b && B9.b.id || '') + ':' + Math.round(B9.cx) + ',' + Math.round(B9.cz), r = (g.ent && g.ent.b && g.ent.b[id]) || {}; return HKNAME[homePlan({ id, day: g.day | 0, min: g.min | 0, n: r.n | 0, pk: r.pk, pd: r.pd }).kind] || C.tip; }   /* PATH-1D 3(2차 평가 '문 글은 정리 돕기인데 안에서는 다른 부탁'): 집 문 글 = 그날 그 집 부탁 이름(planFor와 같은 셈 · 여기서는 읽기만 — 적지 않음) */
    return C.tip; }
  function canIn(B9) { const H = hoursOf(B9); if (!H || A.GAME.open(H[0], H[1])) return true; const k = catOf(B9), nm = name(B9);
    if (k === 'home' || k === 'apt') toast('🌙 ' + (en() ? 'The neighbour is resting. The door is locked. Come back after 8:00.' : nm + josa(nm, '은', '는') + ' 쉬는 시간이에요. 문이 잠겼어요. 아침 8시부터 찾아가요.'), 3.2);
    else toast('🌙 ' + (en() ? nm + ' is closed now. It opens at ' + hh(H[0]) + '.' : nm + josa(nm, '은', '는') + ' 지금 문을 닫았어요. ' + hh(H[0]) + '에 열어요.'), 3.2);
    log('shut ' + k); return false; }
  const bRec = id => { const s = S(); let r = s.b[id]; if (!r) { r = s.b[id] = { n: 0, d: -1, t: 0 }; const ks = Object.keys(s.b); if (ks.length > 240) delete s.b[ks[0]]; } if (r.d !== day()) { r.d = day(); r.t = 0; } return r; };
  const cRec = k => { const s = S(); return s.c[k] || (s.c[k] = { n: 0, last: [] }); };
  // ENTER-3 판단 틀 · 집 오늘의 부탁 · 모음
  const PLAY = createPlay({ en, esc, openP: (h, w, k) => A.openP(h, w, k), closeP: () => A.closeP(), sfx });
  const sea = () => { const s9 = A.season ? A.season() : 'now'; return s9 === 'now' ? 'summer' : s9; };
  const reg5 = B9 => { const r9 = regOf(B9); return r9 === '읍내' || r9 === '관광' ? '시내' : r9; };
  const contentOf = (k, nm) => { const X = CONTENT[k]; if (Array.isArray(X)) return X.find(q => q.re.test(nm || '')) || X[X.length - 1]; if (X) return X; if (MENU[k]) { const M9 = MENU[k]; return { f: 'tray', how: M9.how || '주문 쪽지에 맞는 음식을 골라요.', n: 1, items: M9.dishes.map(d => [d[0], '', d[2], d[3], d[1]]), asks: M9.asks, learn: '' }; } return null; };
  const hk = id => hashS(id).toString(36);
  function planFor(id) { const b = bRec(id), P9 = homePlan({ id, day: day(), min: A.GAME.S.min | 0, n: b.n, pk: b.pk, pd: b.pd }); b.pk = P9.kind; b.pd = day(); mark(); return P9; }
  const HINTRO = { tidy: '정리 좀 도와줄래요?', cook: '같이 밥 만들래요?', water: '화분 물 주기 좀 도와줄래요?', fix: '고장 난 게 있어요.', table: '상 좀 같이 차릴래요?', job: '일 준비 좀 도와줄래요?', find: '물건이 안 보여요.' };   /* 말풍선 = 한 문장(이웃이 가까이 서 있어 긴 말은 화면을 덮음) · PATH-1C u: 물 주기 = 「화분 좀 봐 줄래요?」 → 아이가 화분 앞으로 가서 E·물뿌리개를 눌러 봄(화분은 소품 · 할 수 있는 일은 이웃에게 말 걸기) → 곁에서 뜨는 E 글(화분 물 주기)과 같은 말로 */
  const HTHANK = { tidy: '집이 깔끔해졌어요.', cook: '맛있게 잘 만들었어요.', water: '화분이 싱싱해지겠어요.', fix: '이제 잘 돼요.', table: '상이 예쁘게 차려졌어요.', job: '일이 금방 끝났어요.', find: '찾아 줘서 다행이에요.', bday: '아이가 정말 좋아하겠어요.', move: '짐이 제자리를 찾았어요.', guest: '손님이 좋아하겠어요.' };

  // ───────── 물건 꼴(방 안 작은 것 · 인스턴스 규칙: b 상자(밑 = y) · c 기둥(반지름 a·c · 높이 b · 밑 = y) · s 공(반지름 a·b·c · 가운데 = y) · k 고깔) ─────────
  function shape(E, sh, x, y, z, col, ry = 0, s = 1) { const q = (k, dx, dy, dz, a, b, c, hx, r2 = 0, rx = 0, gl = 0) => { const cs = Math.cos(ry), sn = Math.sin(ry); E(k, x + (dx * cs + dz * sn) * s, y + dy * s, z + (-dx * sn + dz * cs) * s, a * s, b * s, c * s, hx, ry + r2, rx, gl); };
    switch (sh) {
      case 'flower': q('c', 0, 0, 0, 0.012, 0.34, 0.012, 0x3f8a3a); q('s', 0, 0.38, 0, 0.065, 0.05, 0.065, col); q('s', 0, 0.39, 0, 0.026, 0.026, 0.026, sh === 'flower' && col === 0xf2c230 ? 0x5a3a1e : 0xfff2a8); q('s', 0.04, 0.18, 0, 0.04, 0.012, 0.022, 0x4e9a43); break;
      case 'ball': q('s', 0, 0.1, 0, 0.1, 0.1, 0.1, col); q('s', 0, 0.1, 0, 0.102, 0.03, 0.102, 0xffffff); break;
      case 'box': q('b', 0, 0, 0, 0.18, 0.14, 0.12, col); q('b', 0, 0.05, 0, 0.184, 0.035, 0.124, 0xffffff); break;
      case 'crate': q('b', 0, 0, 0, 0.42, 0.3, 0.34, 0xc8945a); q('b', 0, 0.12, 0, 0.424, 0.06, 0.344, col); q('b', 0, 0.3, 0, 0.06, 0.006, 0.35, 0xd9b27a); break;
      case 'bottle': q('c', 0, 0, 0, 0.035, 0.17, 0.035, col); q('c', 0, 0.17, 0, 0.015, 0.05, 0.015, col); q('c', 0, 0.22, 0, 0.018, 0.02, 0.018, 0xf6f4ee); q('c', 0, 0.06, 0, 0.037, 0.05, 0.037, 0xffffff); break;
      case 'jar': q('c', 0, 0, 0, 0.048, 0.13, 0.048, col); q('c', 0, 0.13, 0, 0.052, 0.03, 0.052, 0x3a3d42); break;
      case 'bulb': q('c', 0, 0, 0, 0.022, 0.04, 0.022, 0xc0c4c8); q('s', 0, 0.09, 0, 0.05, 0.06, 0.05, col, 0, 0, 1); break;
      case 'roll': q('c', 0, 0, 0, 0.07, 0.05, 0.07, col); q('c', 0, 0.001, 0, 0.03, 0.051, 0.03, 0xe9e2d0); break;
      case 'hose': for (let i = 0; i < 4; i++) q('c', 0, i * 0.035, 0, 0.2 - i * 0.012, 0.03, 0.2 - i * 0.012, i % 2 ? col : 0x2f9f58); break;
      case 'shoe': for (const sx of [-0.06, 0.06]) { q('b', sx, 0, 0, 0.1, 0.03, 0.24, 0xf6f4ee); q('b', sx, 0.03, -0.02, 0.095, 0.06, 0.18, col); q('b', sx, 0.03, 0.07, 0.09, 0.03, 0.06, col); } break;
      case 'boot': for (const sx of [-0.07, 0.07]) { q('b', sx, 0, 0.02, 0.11, 0.08, 0.24, col); q('b', sx, 0.08, -0.03, 0.11, 0.24, 0.12, col); q('b', sx, 0.3, -0.03, 0.115, 0.02, 0.125, 0x3a3d42); } break;
      case 'fish': q('s', 0, 0.045, 0, 0.16, 0.045, 0.055, col); q('s', 0, 0.06, 0, 0.13, 0.025, 0.04, 0xdfe6ea); q('k', 0.17, 0.045, 0, 0.04, 0.08, 0.02, col, Math.PI / 2, Math.PI / 2); break;
      case 'squid': q('s', 0, 0.03, 0, 0.06, 0.03, 0.16, col); for (let i = 0; i < 5; i++) q('b', -0.04 + i * 0.02, 0, 0.17, 0.01, 0.01, 0.12, col); break;
      case 'shrimp': q('s', 0, 0.03, 0, 0.03, 0.03, 0.1, col); q('s', 0, 0.05, -0.08, 0.025, 0.025, 0.03, col); break;
      case 'clam': q('s', 0, 0.025, 0, 0.07, 0.03, 0.055, col); q('s', 0, 0.035, 0, 0.065, 0.012, 0.05, 0xb8a888); break;
      case 'crab': q('s', 0, 0.04, 0, 0.11, 0.04, 0.08, col); for (const sx of [-1, 1]) { q('s', sx * 0.14, 0.05, -0.07, 0.04, 0.03, 0.03, col); for (let i = 0; i < 3; i++) q('b', sx * 0.11, 0, -0.02 + i * 0.04, 0.08, 0.015, 0.012, col); } break;
      case 'leaf': for (let i = 0; i < 5; i++) q('s', -0.08 + i * 0.04, 0.03, (i % 2) * 0.05 - 0.02, 0.07, 0.025, 0.04, i % 2 ? col : 0x4e7a3a); break;
      case 'pack': q('b', 0, 0, 0, 0.11, 0.15, 0.012, col); q('b', 0, 0.04, 0.0065, 0.08, 0.06, 0.004, 0xffffff); q('s', 0, 0.07, 0.009, 0.02, 0.02, 0.004, 0x4e9a43); break;
      case 'frame': q('b', 0, 0, 0, 0.3, 0.24, 0.025, 0x3a2a1c); q('b', 0, 0.025, 0.013, 0.24, 0.19, 0.006, col); q('s', -0.03, 0.12, 0.018, 0.035, 0.035, 0.004, 0xf2cfa8); q('s', 0.05, 0.11, 0.018, 0.03, 0.03, 0.004, 0xf2cfa8); break;
      case 'book': q('b', 0, 0, 0, 0.05, 0.24, 0.17, col); q('b', 0, 0.02, 0.0005, 0.052, 0.025, 0.171, 0xffffff); break;
      case 'card': for (let i = 0; i < 3; i++) q('b', (i - 1) * 0.07, i * 0.005, 0, 0.12, 0.005, 0.16, i === 1 ? 0xf6f4ee : col); break;
      case 'towel': for (let i = 0; i < 3; i++) q('b', 0, i * 0.055, 0, 0.26, 0.05, 0.2, i % 2 ? 0xffffff : col); break;
      case 'mask': for (let i = 0; i < 2; i++) q('b', (i - 0.5) * 0.17, 0, 0, 0.15, 0.09, 0.03, col); q('b', 0, 0.03, 0.016, 0.3, 0.01, 0.004, 0xffffff); break;
      case 'brush': for (let i = 0; i < 3; i++) { q('b', (i - 1) * 0.05, 0, 0, 0.02, 0.18, 0.015, [col, 0x3d74c9, 0xe0453a][i]); q('b', (i - 1) * 0.05, 0.18, 0.005, 0.022, 0.03, 0.025, 0xffffff); } break;
      case 'pencil': for (let i = 0; i < 4; i++) { q('b', -0.06 + i * 0.04, 0, 0, 0.018, 0.012, 0.18, i % 2 ? col : 0x3cc76a); q('b', -0.06 + i * 0.04, 0, 0.095, 0.012, 0.01, 0.02, 0xe8c8a0); } q('b', 0.1, 0, -0.04, 0.05, 0.02, 0.03, 0xf6d0dc); break;
      case 'glue': q('c', -0.05, 0, 0, 0.025, 0.1, 0.025, 0xf6f4ee); q('c', -0.05, 0.1, 0, 0.026, 0.025, 0.026, col); q('b', 0.06, 0, 0, 0.04, 0.012, 0.16, 0xc0c4c8); q('c', 0.06, 0, -0.1, 0.03, 0.012, 0.03, col); break;
      case 'comb': q('b', 0, 0, 0, 0.18, 0.012, 0.04, col); for (let i = 0; i < 6; i++) q('b', -0.07 + i * 0.028, 0, 0.03, 0.008, 0.008, 0.03, col); break;
      case 'dryer': q('b', 0, 0, 0, 0.045, 0.13, 0.05, 0x3a3d42); q('b', 0, 0.12, -0.04, 0.1, 0.11, 0.2, col); q('c', 0, 0.175, 0.06, 0.04, 0.07, 0.04, 0x3a3d42, 0, Math.PI / 2); break;
      case 'washer': q('b', 0, 0, 0, 0.6, 0.85, 0.55, 0xf6f4ee); q('c', 0, 0.42, 0.28, 0.18, 0.02, 0.18, 0x8fc4e8, 0, Math.PI / 2); q('c', 0, 0.42, 0.281, 0.2, 0.012, 0.2, 0xb8bec4, 0, Math.PI / 2); q('b', 0, 0.75, 0.275, 0.4, 0.06, 0.012, 0xd8dce0); break;
      case 'cloth': q('b', 0, 0, 0, 0.012, 0.012, 0.36, 0x6b7078); q('b', 0, -0.62, 0, 0.06, 0.6, 0.4, col); q('b', 0, -0.32, 0, 0.065, 0.3, 0.5, col); break;
      case 'iron': q('b', 0, 0, 0, 0.12, 0.06, 0.2, col); q('b', 0, 0.06, -0.02, 0.04, 0.05, 0.1, 0x3a3d42); break;
      case 'glasses': for (const sx of [-0.045, 0.045]) q('c', sx, 0.03, 0, 0.035, 0.006, 0.035, col, 0, Math.PI / 2); q('b', 0, 0.055, 0, 0.03, 0.008, 0.006, col); break;
      case 'apple': for (let i = 0; i < 5; i++) q('s', -0.12 + (i % 3) * 0.12, 0.055 + (i > 2 ? 0.08 : 0), (i > 2 ? 0 : -0.05) + (i % 2) * 0.08, 0.055, 0.052, 0.055, col); break;
      case 'orange': for (let i = 0; i < 6; i++) q('s', -0.1 + (i % 3) * 0.1, 0.045 + (i > 2 ? 0.07 : 0), (i % 2) * 0.08 - 0.04, 0.046, 0.04, 0.046, col); break;
      case 'pear': for (let i = 0; i < 4; i++) q('s', -0.09 + (i % 2) * 0.18, 0.06, (i > 1 ? 0.08 : -0.08), 0.06, 0.065, 0.06, col); break;
      case 'melon': q('s', 0, 0.13, 0, 0.16, 0.13, 0.15, col); for (let i = 0; i < 4; i++) q('s', 0, 0.13, 0, 0.162 - i * 0.0005, 0.131, 0.02, 0x2f5a2a, i * 0.78); break;
      case 'cabbage': for (let i = 0; i < 3; i++) q('s', -0.13 + i * 0.13, 0.09, 0, 0.1, 0.09, 0.1, i % 2 ? col : 0xa8dc84); break;
      case 'potato': for (let i = 0; i < 6; i++) q('s', -0.1 + (i % 3) * 0.1, 0.04 + (i > 2 ? 0.05 : 0), (i % 2) * 0.07 - 0.03, 0.05, 0.035, 0.04, col); break;
      case 'root': for (let i = 0; i < 5; i++) q('k', -0.08 + i * 0.04, 0.02, 0, 0.018, 0.16, 0.018, col, 0, Math.PI / 2); break;
      case 'shroom': for (let i = 0; i < 5; i++) { q('c', -0.08 + i * 0.04, 0, (i % 2) * 0.05, 0.012, 0.03, 0.012, 0xe8dcc0); q('s', -0.08 + i * 0.04, 0.035, (i % 2) * 0.05, 0.035, 0.015, 0.035, col); } break;
      case 'sack': q('b', 0, 0, 0, 0.36, 0.38, 0.24, col); q('s', 0, 0.38, 0, 0.17, 0.05, 0.11, col); q('b', 0, 0.14, 0.121, 0.24, 0.1, 0.004, 0x3d74c9); break;
      case 'tray': q('b', 0, 0, 0, 0.36, 0.04, 0.26, 0xf6f4ee); for (let i = 0; i < 6; i++) q('s', -0.12 + (i % 3) * 0.12, 0.05, (i > 2 ? 0.05 : -0.05), 0.06, 0.03, 0.045, col); break;
      case 'mochi': q('b', 0, 0, 0, 0.32, 0.02, 0.24, 0xf6f4ee); for (let i = 0; i < 6; i++) q('s', -0.1 + (i % 3) * 0.1, 0.04, (i > 2 ? 0.05 : -0.05), 0.04, 0.025, 0.028, col); break;
      case 'disc': q('b', 0, 0, 0, 0.32, 0.02, 0.24, 0xf6f4ee); for (let i = 0; i < 9; i++) q('c', -0.1 + (i % 3) * 0.1, 0.02, -0.07 + ((i / 3) | 0) * 0.07, 0.03, 0.012, 0.022, col); break;
      case 'cake': q('b', 0, 0, 0, 0.32, 0.02, 0.24, 0xf6f4ee); for (let i = 0; i < 4; i++) q('b', -0.075 + (i % 2) * 0.15, 0.02, (i > 1 ? 0.055 : -0.055), 0.13, 0.05, 0.1, col); break;
      case 'meat': q('b', 0, 0, 0, 0.24, 0.02, 0.17, 0xf6f4ee); q('b', 0, 0.02, 0, 0.2, 0.03, 0.13, col); q('b', 0.02, 0.05, 0, 0.12, 0.004, 0.06, 0xf6f0ea); break;
      case 'egg': q('b', 0, 0, 0, 0.26, 0.035, 0.2, 0xd9c8a0); for (let i = 0; i < 6; i++) q('s', -0.08 + (i % 3) * 0.08, 0.06, (i > 2 ? 0.045 : -0.045), 0.032, 0.04, 0.032, col); break;
      case 'helmet': q('s', 0, 0.02, 0, 0.13, 0.1, 0.15, col); q('b', 0, 0, 0, 0.24, 0.02, 0.26, 0x3a3d42); break;
      case 'pump': q('c', 0, 0, 0, 0.03, 0.42, 0.03, col); q('b', 0, 0.42, 0, 0.2, 0.03, 0.03, 0x3a3d42); q('b', 0, 0, 0, 0.14, 0.02, 0.06, 0x3a3d42); break;
      case 'lock': q('b', 0, 0, 0, 0.08, 0.09, 0.03, col); q('c', 0, 0.09, 0, 0.03, 0.05, 0.012, 0xc0c4c8); break;
      case 'hammer': q('b', 0, 0, 0, 0.03, 0.26, 0.03, 0x8a5a34); q('b', 0, 0.26, 0, 0.14, 0.045, 0.045, col); break;
      case 'tool': q('b', 0, 0, 0, 0.03, 0.22, 0.03, 0x8a5a34); q('k', 0, 0.2, 0.02, 0.05, 0.09, 0.02, 0x9aa0a6, 0, -0.6); q('b', 0.09, 0, 0, 0.07, 0.12, 0.02, 0xf2c230); break;
      case 'sprout': q('b', 0, 0, 0, 0.3, 0.06, 0.22, 0x5a3c26); for (let i = 0; i < 6; i++) { q('c', -0.1 + (i % 3) * 0.1, 0.06, (i > 2 ? 0.05 : -0.05), 0.006, 0.09, 0.006, 0x3f8a3a); q('s', -0.1 + (i % 3) * 0.1, 0.15, (i > 2 ? 0.05 : -0.05), 0.03, 0.015, 0.02, col); } break;
      case 'wheel': q('c', 0, 0.3, 0, 0.3, 0.07, 0.3, col, 0, Math.PI / 2); q('c', 0, 0.3, -0.001, 0.2, 0.072, 0.2, 0x9aa0a6, 0, Math.PI / 2); break;
      case 'block': for (let i = 0; i < 5; i++) q('b', -0.1 + (i % 3) * 0.1, (i > 2 ? 0.08 : 0), (i > 2 ? 0.02 : 0), 0.08, 0.08, 0.08, [col, 0xf2c230, 0x3cc76a, 0xe0453a, 0x3d74c9][i]); break;
      case 'teddy': q('s', 0, 0.09, 0, 0.09, 0.09, 0.07, col); q('s', 0, 0.22, 0, 0.065, 0.06, 0.06, col); for (const sx of [-1, 1]) q('s', sx * 0.05, 0.28, 0, 0.022, 0.022, 0.015, col); q('s', 0, 0.21, 0.05, 0.022, 0.018, 0.015, 0xf2e2c8); break;
      case 'cube': for (let i = 0; i < 8; i++) q('b', -0.09 + (i % 4) * 0.06, (i > 3 ? 0.05 : 0), (i % 2) * 0.05 - 0.02, 0.045, 0.045, 0.045, col); break;
      case 'net': q('b', 0, 0, 0, 0.42, 0.08, 0.32, col); q('b', 0, 0.08, 0, 0.36, 0.06, 0.26, 0x24604a); q('s', 0.14, 0.17, 0.08, 0.05, 0.05, 0.05, 0xef7a24); break;
      case 'rod': q('c', 0, 0, 0, 0.012, 1.3, 0.012, col); q('c', 0, 0.2, 0.02, 0.03, 0.03, 0.03, 0x9aa0a6, 0, Math.PI / 2); break;
      case 'key': q('c', 0, 0.04, 0, 0.025, 0.006, 0.025, col, 0, Math.PI / 2); q('b', 0, 0, 0, 0.012, 0.04, 0.004, 0xc0c4c8); break;
      case 'cap': q('s', 0, 0.02, 0, 0.1, 0.07, 0.1, col); q('b', 0, 0.01, 0.1, 0.16, 0.012, 0.1, col); break;
      case 'bowl': q('c', 0, 0, 0, 0.1, 0.07, 0.1, col); q('c', 0, 0.071, 0, 0.085, 0.002, 0.085, 0x8a5a34); break;
      case 'soap': for (let i = 0; i < 3; i++) q('b', (i - 1) * 0.1, 0, 0, 0.08, 0.035, 0.05, i === 1 ? 0xf2f6ff : col); break;
      case 'plank': for (let i = 0; i < 4; i++) q('b', 0, i * 0.045, 0, 0.5, 0.04, 0.12 - (i % 2) * 0.02, i % 2 ? col : 0xb8905e); break;
      case 'carton': for (let i = 0; i < 4; i++) { q('b', -0.09 + (i % 2) * 0.12, (i > 1 ? 0.2 : 0), 0, 0.1, 0.2, 0.1, col); q('b', -0.09 + (i % 2) * 0.12, (i > 1 ? 0.2 : 0) + 0.07, 0, 0.102, 0.05, 0.102, 0x3d74c9); } break;
      case 'paper': for (let i = 0; i < 4; i++) q('b', 0, i * 0.03, 0, 0.36, 0.028, 0.26, i % 2 ? col : 0xcfcabc); q('b', 0, 0, 0, 0.02, 0.13, 0.27, 0xc8945a); break;
      case 'quilt': for (let i = 0; i < 3; i++) q('b', 0, i * 0.08, 0, 0.5, 0.075, 0.36, i % 2 ? 0xf6f4ee : col); break;
      case 'cup': q('c', 0, 0, 0, 0.04, 0.08, 0.04, col); q('b', 0.045, 0.02, 0, 0.02, 0.04, 0.01, col); break;
      case 'bag': q('b', 0, 0, 0, 0.32, 0.24, 0.12, col); q('b', 0, 0.24, 0, 0.16, 0.06, 0.02, col); break;
      case 'plate': q('c', 0, 0, 0, 0.13, 0.015, 0.13, 0xffffff); q('s', 0, 0.035, 0, 0.08, 0.03, 0.08, col); break;
      default: q('b', 0, 0, 0, 0.14, 0.12, 0.12, col);
    } }

  // ───────── 진열 꼴(벽 sd = B·F·L·R · u0~u1 벽을 따라 · 칸 하나) — 돌아감 = 칸의 '서는 자리'(로컬) ─────────
  const SDRY = { B: 0, F: Math.PI, L: Math.PI / 2, R: -Math.PI / 2 };
  function station(S9, K, E, sd, u0, u1, slot, rnd) { const B = K.WB(S9, sd), uc = (u0 + u1) / 2, L9 = u1 - u0, [, sty, sh, col] = slot, ry = SDRY[sd], at = (u, v) => B.m(u, v);
    let dep = 0.5, top = 0, hTop = 1.0;
    const row = (y, v, sp, a0 = u0 + 0.12, a1 = u1 - 0.12, sc = 1) => { if (!sc) return; for (let u = a0 + sp / 2; u <= a1 - sp / 2 + 0.001; u += sp) { const [x, z] = at(u, v); shape(E, sh, x, y, z, col, ry, sc); } };
    if (sty === 'shelf') { dep = 0.48; hTop = 1.85; B.P('b', uc, 0, 0.06, L9, 1.845, 0.03, WD);   /* FIX-4B 뒤판 윗면 = 옆 기둥 윗면(1.85)과 같은 평면 X */ for (const u of [u0 + 0.03, u1 - 0.03]) B.P('b', u, 0, 0.27, 0.05, 1.85, 0.42, W0); B.P('b', uc, 1.85, 0.27, L9, 0.04, 0.44, W0);
      const sp = sh === 'book' ? 0.065 : sh === 'shoe' || sh === 'boot' ? 0.32 : sh === 'card' ? 0.26 : sh === 'helmet' ? 0.32 : sh === 'towel' || sh === 'quilt' ? 0.34 : sh === 'crate' ? 0.5 : sh === 'sack' ? 0.42 : sh === 'plank' ? 0.6 : 0.22;
      for (const y of [0.1, 0.62, 1.14]) { B.P('b', uc, y, 0.27, L9 - 0.1, 0.03, 0.42, 0xd9b27a); B.P('b', uc, y - 0.035, 0.485, L9 - 0.12, 0.04, 0.012, 0xfff2a8); if (sh === 'book') { let u = u0 + 0.1; while (u < u1 - 0.12) { const w = 0.045 + rnd() * 0.03, [x, z] = at(u + w / 2, 0.22); E('b', x, y + 0.03, z, sd === 'L' || sd === 'R' ? 0.18 : w - 0.006, 0.22 + rnd() * 0.1, sd === 'L' || sd === 'R' ? w - 0.006 : 0.18, rnd() < 0.55 ? col : [0xe0453a, 0x2f6fd0, 0xf2c230, 0x3cc76a, 0x8a5bd1, 0xf6f4ee][rnd() * 6 | 0], 0); u += w; } } else row(y + 0.03, 0.26, sp, u0 + 0.1, u1 - 0.1, sh === 'crate' ? 1 : 1.1); }
      B.col(u0, u1, 0, 0.5, -0.5, 1.9); }
    else if (sty === 'table' || sty === 'cab') { dep = 0.62; hTop = sty === 'cab' ? 0.9 : 0.78; const h = hTop; if (sty === 'cab') { B.P('b', uc, 0, 0.32, L9, h, 0.6, W0); for (let i = 0; i < Math.max(1, Math.round(L9 / 0.6)); i++) { const n = Math.max(1, Math.round(L9 / 0.6)), cu = u0 + (i + 0.5) * L9 / n; B.P('b', cu, 0.08, 0.625, L9 / n - 0.06, h - 0.16, 0.012, 0xb8905e); B.P('b', cu + L9 / n * 0.3, h * 0.55, 0.636, 0.03, 0.12, 0.012, 0xd8b04a); } B.P('b', uc, h, 0.32, L9 + 0.04, 0.04, 0.64, WD); top = h + 0.04; }
      else { B.P('b', uc, h - 0.05, 0.32, L9, 0.05, 0.6, W0); for (const u of [u0 + 0.06, u1 - 0.06]) for (const v of [0.07, 0.57]) B.P('b', u, 0, v, 0.06, h - 0.05, 0.06, WD); B.P('b', uc, 0.18, 0.32, L9 - 0.14, 0.03, 0.5, 0xd9b27a); top = h; }
      row(top, 0.3, sh === 'washer' ? 0.75 : sh === 'tray' || sh === 'mochi' || sh === 'disc' || sh === 'cake' || sh === 'egg' || sh === 'sprout' ? 0.4 : sh === 'quilt' ? 0.6 : 0.26); if (sh === 'washer' && sty !== 'cab') {   /* FIX-4B 장(cab) 안이면 받침판 = 장 몸통과 같은 면 → 탁자일 때만 */ B.P('b', uc, 0, 0.32, L9, 0.04, 0.6, 0xd8dce0); }
      B.col(u0, u1, 0, 0.64, -0.5, h + 0.1); }
    else if (sty === 'tier') { dep = 0.75; hTop = 0.75; B.P('b', uc, 0, 0.5, L9, 0.32, 0.5, W0); B.P('b', uc, 0, 0.18, L9 - 0.03, 0.62, 0.32, WD);
      for (const [y, v] of [[0.32, 0.55], [0.62, 0.2]]) for (let u = u0 + 0.22; u < u1 - 0.1; u += 0.32) { const [x, z] = at(u, v); E('c', x, y, z, 0.12, 0.26, 0.12, 0x9aa0a6); E('c', x, y + 0.25, z, 0.125, 0.012, 0.125, 0x6b7078); for (let i = 0; i < 4; i++) shape(E, 'flower', x + Math.cos(i * 1.7) * 0.05, y + 0.12, z + Math.sin(i * 1.7) * 0.05, col, i, 1.05 + (i % 2) * 0.12); }
      B.col(u0, u1, 0, 0.76, -0.5, 1.0); }
    else if (sty === 'case') { dep = 0.62; hTop = 0.95; B.P('b', uc, 0, 0.32, L9, 0.86, 0.58, WH); B.P('b', uc, 0.12, 0.612, L9 - 0.08, 0.6, 0.012, S9.acc || 0x3d74c9); B.P('b', uc, 0.86, 0.32, L9 + 0.02, 0.03, 0.6, 0x2b2d31);   /* FIX-4B 유리장 윗판 0.89(벽 아래 판 위 끝 0.885와 같은 평면 X) */
      for (const u of [u0 + 0.02, u1 - 0.02]) for (const v of [0.04, 0.6]) B.P('b', u, 0.89, v, 0.025, 0.2, 0.025, 0xc0c4c8); B.P('b', uc, 1.09, 0.04, L9, 0.025, 0.025, 0xc0c4c8); B.P('b', uc, 1.09, 0.6, L9, 0.025, 0.025, 0xc0c4c8);
      row(0.89, 0.32, sh === 'glasses' ? 0.18 : 0.26); B.col(u0, u1, 0, 0.62, -0.5, 1.1); }
    else if (sty === 'peg') { dep = 0.55; hTop = 0.85; B.P('b', uc, 0.95, 0.05, L9, 1.2, 0.03, 0xd9b98a); for (let i = 0; i < Math.floor(L9 / 0.1); i++) for (let j = 0; j < 11; j++) if ((i + j) % 2 === 0) { const [x, z] = at(u0 + 0.05 + i * 0.1, 0.066); E('b', x, 1.0 + j * 0.1, z, 0.012, 0.012, 0.012, 0x8a6a4a); }
      B.P('b', uc, 0, 0.3, L9, 0.82, 0.5, W0); B.P('b', uc, 0.82, 0.3, L9 + 0.02, 0.035, 0.52, WD);
      for (let u = u0 + 0.22; u < u1 - 0.15; u += 0.3) for (const y of [1.15, 1.6]) { const [x, z] = at(u, 0.1); shape(E, sh, x, y, z, col, ry, sh === 'rod' ? 0.6 : 1); }
      row(0.855, 0.32, 0.34); B.col(u0, u1, 0, 0.56, -0.5, 1.0); }
    else if (sty === 'rack') { dep = 0.7; hTop = 0.4; for (const u of [u0 + 0.05, u1 - 0.05]) { B.P('b', u, 0, 0.35, 0.05, 1.75, 0.05, 0x9aa0a6); B.P('b', u, 0, 0.35, 0.08, 0.04, 0.5, 0x6b7078); } B.P('b', uc, 1.72, 0.35, L9, 0.035, 0.035, 0xb8bec4);
      for (let u = u0 + 0.2; u < u1 - 0.15; u += 0.16) { const [x, z] = at(u, 0.35); shape(E, 'cloth', x, 1.7, z, rnd() < 0.7 ? col : [0xf6f4ee, 0x3d74c9, 0x6b4a2f][rnd() * 3 | 0], ry + Math.PI / 2, 1); }
      B.col(u0, u1, 0.1, 0.62, -0.5, 1.8); }
    else if (sty === 'bin') { dep = 0.7; hTop = 0.45; const n = Math.max(1, Math.floor(L9 / 0.62)); for (let i = 0; i < n; i++) { const cu = u0 + (i + 0.5) * L9 / n, [x, z] = at(cu, 0.36); B.P('b', cu, 0, 0.36, L9 / n - 0.06, 0.3, 0.6, i % 2 ? 0xa8794a : 0xb8895a); B.P('b', cu, 0.3, 0.07, L9 / n - 0.06, 0.05, 0.03, 0x8a5a34); B.P('b', cu, 0.3, 0.65, L9 / n - 0.06, 0.05, 0.03, 0x8a5a34); shape(E, sh, x, 0.3, z, col, ry + (i % 2) * 0.3, sh === 'wheel' || sh === 'net' || sh === 'melon' ? 0.95 : 1.35); }
      B.P('b', uc, 0, 0.04, L9, 0.5, 0.05, WL); B.col(u0, u1, 0, 0.68, -0.5, 0.7); }
    else if (sty === 'ice') { dep = 0.75; hTop = 0.85; B.P('b', uc, 0, 0.38, L9, 0.8, 0.7, 0xc0c8d0); B.P('b', uc, 0.8, 0.38, L9 - 0.04, 0.04, 0.66, 0xe8f6ff, 1); for (let i = 0; i < Math.floor(L9 / 0.08); i++) { const [x, z] = at(u0 + 0.06 + i * 0.08, 0.38); E('b', x, 0.84, z, 0.05, 0.02, 0.5, 0xf4fbff); }
      row(0.86, 0.36, sh === 'crab' ? 0.44 : sh === 'meat' ? 0.36 : 0.3, u0 + 0.12, u1 - 0.12, 1.35); B.P('b', uc, 0.84, 0.72, L9, 0.06, 0.04, 0x9aa0a6); B.col(u0, u1, 0, 0.76, -0.5, 1.0); }
    else if (sty === 'board') { dep = 0.5; hTop = 0.8; B.P('b', uc, 1.0, 0.04, L9 - 0.1, 1.15, 0.03, 0x3a3d42); B.P('b', uc, 1.05, 0.06, L9 - 0.2, 1.05, 0.012, 0xf6f4ee); B.P('b', uc, 1.48, 0.068, L9 - 0.3, 0.55, 0.006, col);
      const [px, pz] = at(uc, 0.074); if (sh === 'peak') { for (let i = -1; i <= 1; i++) { const [x9, z9] = at(uc + i * 0.28, 0.074); E('k', x9, 1.5, z9, 0.2 - Math.abs(i) * 0.05, 0.42 - Math.abs(i) * 0.12, 0.012, 0x2f6b3a, ry); } }
      else if (sh === 'wave') { for (let i = 0; i < 3; i++) { const [x9, z9] = at(uc, 0.074); E('b', x9, 1.55 + i * 0.12, z9, L9 - 0.5, 0.05, 0.008, 0xffffff, ry); } E('s', px, 1.9, pz, 0.09, 0.09, 0.01, 0xf2c230, ry); }
      else if (sh === 'field') { for (let i = 0; i < 4; i++) { const [x9, z9] = at(uc, 0.074); E('b', x9, 1.52 + i * 0.1, z9, L9 - 0.4 - i * 0.1, 0.04, 0.008, i % 2 ? 0x5aa84c : 0xd9b46a, ry); } }
      else if (sh === 'city') { for (let i = 0; i < 4; i++) { const [x9, z9] = at(uc - 0.36 + i * 0.24, 0.074); E('b', x9, 1.5, z9, 0.16, 0.2 + (i % 3) * 0.12, 0.008, [0xf6f4ee, 0xd8dce0, 0xf2c230, 0xe0eaf4][i], ry); } }
      else if (sh === 'house') { E('b', px, 1.52, pz, 0.38, 0.24, 0.008, 0xf6f4ee, ry); E('k', px, 1.76, pz, 0.28, 0.18, 0.012, 0xb03a2e, ry); E('b', px, 1.52, pz, 0.08, 0.14, 0.012, 0x6b4a2f, ry); }
      else if (sh === 'heart') { E('s', px, 1.75, pz, 0.14, 0.12, 0.01, 0xffffff, ry); E('s', px, 1.75, pz, 0.1, 0.09, 0.014, 0xe0453a, ry); }
      else if (sh === 'cone') { E('k', px, 1.52, pz, 0.12, 0.34, 0.012, 0xef7a24, ry); E('b', px, 1.64, pz, 0.12, 0.04, 0.016, 0xffffff, ry); }
      else { for (let i = 0; i < 3; i++) { const [x9, z9] = at(uc - 0.3 + i * 0.3, 0.074); E('b', x9, 1.55, z9, 0.22, 0.28, 0.008, 0xffffff, ry); E('b', x9, 1.75, z9, 0.16, 0.02, 0.01, col, ry); } }
      B.P('b', uc, 0, 0.3, L9 - 0.2, 0.75, 0.42, W0); B.P('b', uc, 0.75, 0.3, L9 - 0.16, 0.035, 0.44, WD); if (['house', 'peak', 'wave', 'field', 'city', 'heart', 'cone'].includes(sh)) { for (let u = u0 + 0.35; u < u1 - 0.3; u += 0.36) { const [x9, z9] = at(u, 0.3); shape(E, 'card', x9, 0.785, z9, col, ry, 0.9); } } else row(0.785, 0.3, 0.4, u0 + 0.2, u1 - 0.2, 1);   /* 판 밑 탁자 = 안내 쪽지 */
      B.col(u0 + 0.1, u1 - 0.1, 0, 0.52, -0.5, 1.0); }
    const [sx, sz] = at(uc, dep + 0.7), [tx, tz] = at(uc, Math.max(0.2, dep - 0.3)), [lx, lz] = at(uc, 0.035), [fx, fz] = at(uc, dep + 0.22);
    K.sign(S9, slot[0], lx, sty === 'shelf' ? 2.2 : sty === 'board' || sty === 'peg' ? 2.4 : 2.0, lz, ry, Math.min(L9 - 0.1, Math.max(0.9, [...slot[0]].length * 0.22 + 0.3)), 0.3, { bg: S9.ac || '#2f6fd0', fr: 0xf6f4ee });
    return { stand: [sx, 0, sz], top: [tx, hTop, tz], front: [fx, 0, fz], ry, sty }; }

  // ───────── 방 꼴 ─────────
  const roomE = (S9, K) => (k, x, y, z, a, b, c, hx, ry = 0, rx = 0, gl = 0) => gl ? K.part(S9, k, x, y, z, a, k === 's' ? b / a : b, c, hx, 1, ry, rx) : K.I(S9, k, x, y, z, a, b, c, hx, ry, rx);
  const partE = (put, at) => (k, x, y, z, a, b, c, hx, ry = 0, rx = 0, gl = 0) => put(k, at[0] + x, at[1] + y, at[2] + z, a, k === 's' ? b / a : b, c, hx, gl, ry, rx);
  function base(at, K, C, W, D, H, o = {}) { const S9 = K.shell(at, W, D, H, { wall: C.wall ?? 0xf6f0e4, wains: o.wains ?? C.acc, winY: [], noLights: true, ft: C.ft || ['tile', 1.0, 0xf4f1ea], wt: C.wt }); S9.ac = K.cs(C.acc); S9.acc = C.acc;
    if (!o.noFront) for (const s of [-1, 1]) K.wwin(S9, 'F', s * (W / 4 + 0.4), 0.85, Math.min(1.9, W / 2 - 1.8), 1.3, { sun: true });
    for (const x of [-W / 4, W / 4]) for (const z of [-D / 4, D / 4]) K.panelL(S9, x, z); return S9; }
  const counter = (S9, K, x, z, w, c) => { const P = S9.put; P('b', x, 0, z, w, 0.98, 0.6, WH); P('b', x, 0.12, z + 0.306, w - 0.1, 0.6, 0.012, c); P('b', x, 0.98, z, w + 0.06, 0.04, 0.66, WD); K.colL(S9, x, z, w / 2 + 0.03, 0.33, -0.5, 1.05); P('b', x + w / 2 - 0.45, 1.02, z - 0.1, 0.36, 0.06, 0.26, 0x3a3d42); P('b', x + w / 2 - 0.45, 1.08, z - 0.12, 0.3, 0.16, 0.03, 0x2b2d31); P('b', x + w / 2 - 0.45, 1.1, z - 0.105, 0.26, 0.11, 0.006, 0x9fe0c8, 1); };   /* 계산대(앞 띠 · 윗판 · 계산기 화면 빛) */
  const bagAt = (K, at, x, y, z, slot) => K.parts(put => { const E = partE(put, at); E('b', x, y, z, 0.3, 0.32, 0.2, 0xd9b27a); E('b', x, y + 0.32, z, 0.3, 0.025, 0.2, 0xc8a070); shape(E, slot[2], x, y + 0.34, z, slot[3], 0, 0.8); });   /* 성공 = 계산대 위 종이봉투 + 그 물건 */
  function sig(S9, K, E, C, W, D, rnd, seats) { const P = S9.put, hw = W / 2, hd = D / 2;   /* 갈래마다 정체 소품 하나(가운데 섬 · 의자 · 거울 · 수조 …) */
    switch (C.sig) {
      case 'island': { P('b', 0.4, 0, 0.3, 1.6, 0.72, 0.9, W0); P('b', 0.4, 0.72, 0.3, 1.66, 0.04, 0.96, WD); K.colL(S9, 0.4, 0.3, 0.83, 0.48, -0.5, 0.8); const s0 = C.slots[(rnd() * 4) | 0]; for (let i = 0; i < 4; i++) shape(E, s0[2], 0.4 - 0.5 + (i % 2) * 1.0, 0.76, 0.3 - 0.2 + ((i / 2) | 0) * 0.4, s0[3], 0, 0.9); break; }
      case 'flowerbench': { P('b', 0.4, 0, 0.3, 1.6, 0.76, 0.8, 0x6b8a4a); P('b', 0.4, 0.76, 0.3, 1.66, 0.04, 0.86, WD); K.colL(S9, 0.4, 0.3, 0.83, 0.43, -0.5, 0.8); for (let i = 0; i < 5; i++) shape(E, 'flower', -0.2 + i * 0.3, 0.8, 0.3, C.slots[i % 4][3], 0, 1.1); E('b', 1.0, 0.8, 0.45, 0.3, 0.01, 0.2, 0xf6d0dc); E('b', 0.9, 0.8, 0.1, 0.12, 0.25, 0.02, 0xc0c4c8); break; }
      case 'pharm': { P('b', -2.6, 0, -hd + 0.3, 2.6, 2.0, 0.4, WH); for (const y of [0.6, 1.05, 1.5]) { P('b', -2.6, y, -hd + 0.35, 2.5, 0.025, 0.36, 0xd8dce0); for (let i = 0; i < 9; i++) E('b', -3.75 + i * 0.28, y + 0.025, -hd + 0.38, 0.2, 0.16, 0.14, [0xffffff, 0xf2c230, 0x5aa6e0, 0x3cc76a][(i + ((y * 10) | 0)) % 4]); } K.colL(S9, -2.6, -hd + 0.3, 1.3, 0.2, -0.5, 2.0); break; }
      case 'mirror': { P('b', 0.4, 0, 0.3, 1.8, 0.8, 0.5, WH); P('b', 0.4, 0.8, 0.3, 1.84, 0.04, 0.54, WD); P('b', 0.4, 0.84, 0.3, 1.1, 0.95, 0.06, 0xd8b04a); for (const s9 of [-1, 1]) P('b', 0.4, 0.92, 0.3 + s9 * 0.036, 0.94, 0.79, 0.012, 0xdfeaf2, 1); for (const s9 of [-1, 1]) { P('b', 0.4 + s9 * 0.75, 0.84, 0.3, 0.3, 0.02, 0.4, 0xf6f4ee); P('c', 0.4 + s9 * 0.75, 0.86, 0.25, 0.04, 0.16, 0, 0x2fb5b0); P('b', 0.4 + s9 * 0.75 + 0.08, 0.86, 0.38, 0.04, 0.01, 0.18, 0x3a3d42); } K.colL(S9, 0.4, 0.3, 0.92, 0.29, -0.5, 1.95);   /* 가운데 양면 거울 */
        for (const s9 of [-1, 1]) { const z = 0.3 + s9 * 1.05; P('c', 0.4, 0, z, 0.22, 0.05, 0, 0x3a3d42); P('c', 0.4, 0.05, z, 0.04, 0.4, 0, 0x9aa0a6); P('b', 0.4, 0.45, z, 0.5, 0.1, 0.5, C.acc); P('b', 0.4, 0.55, z + s9 * 0.22, 0.5, 0.6, 0.08, C.acc); K.colL(S9, 0.4, z, 0.26, 0.26, -0.5, 0.9); seats.push({ seat: [S9.at[0] + 0.4, S9.at[1] + 0.55, S9.at[2] + z], yaw: s9 < 0 ? Math.PI : 0, stand: [S9.at[0] + 0.4 + 0.75, S9.at[1], S9.at[2] + z] }); } break; }
      case 'rail': { P('b', 0.6, 1.9, 0.4, 2.6, 0.04, 0.04, 0xb8bec4); for (const x of [-0.7, 1.9]) { P('b', x, 0, 0.4, 0.05, 1.92, 0.05, 0x9aa0a6); P('b', x, 0, 0.4, 0.08, 0.04, 0.5, 0x6b7078); } for (let i = 0; i < 8; i++) shape(E, 'cloth', -0.45 + i * 0.29, 1.88, 0.4, [0x3d74c9, 0xf6f4ee, 0x3a4866, 0xe9e2d0, 0x8a5bd1][i % 5], Math.PI / 2, 1); K.colL(S9, 0.6, 0.4, 1.35, 0.28, -0.5, 2.0);   /* 찾아갈 옷 걸이(번호표) */ P('b', 0.6, 0, 1.6, 1.4, 0.9, 0.4, 0xd8dce0); P('b', 0.6, 0.9, 1.6, 1.42, 0.03, 0.42, 0x8fc4e8); K.colL(S9, 0.6, 1.6, 0.71, 0.21, -0.5, 1.0); break; }
      case 'reading': { K.rtable(S9, 0.6, 0.6, 0.55, 0xe9e2d0); K.chair(S9, seats, 0.6 - 0.95, 0.6, Math.PI / 2, 0x6b8a4a); K.chair(S9, seats, 0.6 + 0.95, 0.6, -Math.PI / 2, 0x6b8a4a); K.sitGuest(S9, seats, seats.length - 1, 3); shape(E, 'book', 0.5, 0.78, 0.6, 0x3d74c9, 1.2, 1); break; }
      case 'chart': { P('b', 0.4, 0, 0.3, 0.06, 0.9, 0.06, 0x9aa0a6); P('b', 0.4, 0.9, 0.3, 0.9, 1.25, 0.04, 0xffffff); for (let i = 0; i < 6; i++) P('b', 0.4, 1.95 - i * 0.18, 0.324, 0.5 - i * 0.07, 0.1, 0.01, 0x2b2d31); P('b', 0.4, 0, 0.3, 0.5, 0.04, 0.4, 0x6b7078); K.colL(S9, 0.4, 0.3, 0.45, 0.2, -0.5, 2.2); K.chair(S9, seats, 0.4, 2.0, Math.PI, C.acc); break; }   /* 가운데 시력표 판 + 볼 자리 의자 */
      case 'crates': { for (let i = 0; i < 3; i++) { P('b', -0.4 + i * 0.75, 0, 0.6, 0.62, 0.42, 0.5, 0xa8794a); shape(E, C.slots[i][2], -0.4 + i * 0.75, 0.42, 0.6, C.slots[i][3], 0, 1.0); } K.colL(S9, 0.35, 0.6, 1.15, 0.26, -0.5, 0.6); break; }
      case 'steam': { for (let i = 0; i < 3; i++) { P('c16', -0.2 + i * 0.7, 0, 0.6, 0.28, 0.78, 0, 0x9aa0a6); P('c16', -0.2 + i * 0.7, 0.78, 0.6, 0.3, 0.1, 0, 0xc8a070); P('c16', -0.2 + i * 0.7, 0.88, 0.6, 0.26, 0.12, 0, 0xd9b27a); } K.colL(S9, 0.5, 0.6, 1.1, 0.32, -0.5, 1.0); break; }
      case 'studio': { for (const x of [0.5, 2.1]) P('b', x, 0, -1.5, 0.06, 2.1, 0.06, 0x3a3d42); P('b', 1.3, 2.1, -1.5, 1.7, 0.05, 0.08, 0x3a3d42); P('b', 1.3, 0.1, -1.43, 1.5, 1.95, 0.02, 0x5a8ac8); P('b', 1.3, 0, -1.0, 1.5, 0.012, 0.8, 0x5a8ac8); K.colL(S9, 1.3, -1.5, 0.85, 0.08, -0.5, 2.2); K.stool(S9, seats, 1.3, -0.95, 0, 0x3a3d42);   /* 배경 천(틀) + 앉는 걸상 */
        for (const a of [0, 2.1, 4.2]) P('b', 1.3 + Math.sin(a) * 0.22, 0, 0.2 + Math.cos(a) * 0.22, 0.03, 1.2, 0.03, 0x3a3d42); P('b', 1.3, 1.2, 0.2, 0.26, 0.18, 0.18, 0x2b2d31); P('b', 1.3, 1.24, 0.1, 0.1, 0.1, 0.06, 0x6b7078); K.colL(S9, 1.3, 0.2, 0.26, 0.26, -0.5, 1.4); break; }   /* 사진기(세 다리) */
      case 'bench': { P('b', 0.5, 0, 0.6, 1.8, 0.42, 0.5, C.acc); P('b', 0.5, 0.42, 0.6, 1.8, 0.06, 0.5, 0x8a5a34); K.colL(S9, 0.5, 0.6, 0.9, 0.25, -0.5, 0.48); seats.push({ seat: [S9.at[0] + 0.5, S9.at[1] + 0.48, S9.at[2] + 0.6], yaw: 0, stand: [S9.at[0] + 0.5, S9.at[1], S9.at[2] + 1.2] }); P('b', 1.6, 0, 0.6, 0.02, 0.01, 0.4, 0xc0c4c8); break; }
      case 'bikes': { for (let i = 0; i < 2; i++) { const x = -0.2 + i * 1.5, z = 0.8; for (const dz of [-0.45, 0.45]) K.part(S9, 'c16', x - 0.015, 0.33, z + dz, 0.33, 0.03, 0, 0x2b2d31, 0, Math.PI / 2, Math.PI / 2);   /* FIX-4B 바퀴 3cm(뼈대 4cm 옆면과 같은 평면 X) */ P('b', x, 0.5, z, 0.04, 0.04, 0.9, i ? 0xe0453a : 0x3d74c9); P('b', x, 0.5, z - 0.05, 0.04, 0.35, 0.04, i ? 0xe0453a : 0x3d74c9); P('b', x, 0.85, z - 0.05, 0.1, 0.04, 0.22, 0x2b2d31); P('b', x, 0.95, z + 0.4, 0.5, 0.03, 0.03, 0x3a3d42); K.colL(S9, x, z, 0.15, 0.8, -0.5, 1.0); } break; }
      case 'tank': { P('b', 0.6, 0, 0.7, 1.8, 0.45, 0.8, 0x3a3d42); P('b', 0.6, 0.45, 0.7, 1.7, 0.42, 0.7, 0x5fc0e6, 1); for (const [dx, dz, sx, sz] of [[0, -0.38, 1.8, 0.06], [0, 0.38, 1.8, 0.06], [-0.88, 0, 0.06, 0.82], [0.88, 0, 0.06, 0.82]]) P('b', 0.6 + dx, 0.45, 0.7 + dz, sx, 0.5, sz, 0x9aa0a6);   /* 위가 열린 수조(물 = 빛 · 테) */
        for (let i = 0; i < 5; i++) shape(E, 'fish', 0.1 + i * 0.25, 0.85, 0.55 + (i % 2) * 0.28, [0x3a6a8a, 0xef8b6a, 0x9aa0a6, 0x3a6a8a, 0xc8433a][i], 0.5 * i, 1.0); K.colL(S9, 0.6, 0.7, 0.92, 0.42, -0.5, 1.0); break; }
      case 'freezer': { for (let i = 0; i < 2; i++) { P('b', -0.2 + i * 1.3, 0, 0.6, 1.1, 0.85, 0.7, 0xf6f6f6); P('b', -0.2 + i * 1.3, 0.85, 0.6, 1.04, 0.02, 0.64, 0xdff3ff, 1); } K.colL(S9, 0.45, 0.6, 1.2, 0.36, -0.5, 0.9); break; }
      case 'grinder': { P('b', 0.4, 0, 0.5, 1.0, 0.9, 0.8, 0x9aa0a6); P('k', 0.4, 0.9, 0.5, 0.4, 0.5, 0, 0xc0c4c8); P('c', 0.4, 0.55, 0.95, 0.08, 0.25, 0, 0x6b7078, 0, Math.PI / 2); P('c16', 0.4, 0, 1.25, 0.25, 0.3, 0, 0xc8a070); K.colL(S9, 0.4, 0.75, 0.5, 0.65, -0.5, 1.4); break; }
      case 'tractor': { P('b', 0.4, 0.35, 0.8, 0.8, 0.5, 1.4, 0xe0453a); P('b', 0.4, 0.85, 0.5, 0.6, 0.35, 0.5, 0xe0453a); for (const [dx, dz, r] of [[-0.5, 0.3, 0.4], [0.5, 0.3, 0.4], [-0.45, 1.35, 0.25], [0.45, 1.35, 0.25]]) K.part(S9, 'c16', 0.4 + dx + (dx < 0 ? -0.1 : 0.1), r, 0.8 + dz - 0.4, r, 0.2, 0, 0x2b2d31, 0, Math.PI / 2, Math.PI / 2); P('b', 0.4, 0.85, 1.3, 0.04, 0.6, 0.04, 0x3a3d42); K.colL(S9, 0.4, 0.8, 0.65, 0.9, -0.5, 1.4); break; }
      case 'baskets': { for (let i = 0; i < 3; i++) { P('c16', -0.3 + i * 0.7, 0, 0.6, 0.28, 0.3, 0, 0xc8945a); shape(E, C.slots[i][2], -0.3 + i * 0.7, 0.3, 0.6, C.slots[i][3], 0, 0.9); } K.colL(S9, 0.4, 0.6, 1.0, 0.3, -0.5, 0.5); P('b', 0.4, 2.6, 0.6, 2.4, 0.03, 0.03, 0x8a5a34); for (const x of [-0.75, 1.55]) P('b', x, 2.63, 0.6, 0.02, 0.67, 0.02, 0x6b7078); for (let i = 0; i < 6; i++) { E('b', -0.6 + i * 0.4, 2.2, 0.6, 0.012, 0.4, 0.012, 0x8a6a4a); E('s', -0.6 + i * 0.4, 2.15, 0.6, 0.08, 0.12, 0.06, 0x6b8a3a); } break; }
      case 'nets': { P('b', 0.4, 0, 0.6, 1.6, 0.35, 0.9, 0x2f6b4a); P('b', 0.4, 0.35, 0.6, 1.4, 0.18, 0.75, 0x24604a); for (let i = 0; i < 4; i++) E('s', -0.2 + i * 0.4, 0.62, 0.6 + (i % 2) * 0.2, 0.12, 0.12, 0.12, 0xef7a24); K.colL(S9, 0.4, 0.6, 0.8, 0.45, -0.5, 0.75); break; }
      case 'lockers': { for (let i = 0; i < 9; i++) { P('b', -0.2 + (i % 3) * 0.6, 0.05 + ((i / 3) | 0) * 0.6, 0.3, 0.56, 0.56, 0.5, 0xd8dce0); P('b', -0.2 + (i % 3) * 0.6 + 0.15, 0.22 + ((i / 3) | 0) * 0.6, 0.556, 0.08, 0.12, 0.012, 0xe0453a); } P('b', 0.4, 0, 0.3, 1.82, 0.05, 0.52, 0x9aa0a6); K.colL(S9, 0.4, 0.3, 0.91, 0.26, -0.5, 1.9); P('b', 0.4, 0, 1.25, 1.6, 0.42, 0.42, 0x8a5a34); K.colL(S9, 0.4, 1.25, 0.8, 0.21, -0.5, 0.45); seats.push({ seat: [S9.at[0] + 0.4, S9.at[1] + 0.42, S9.at[2] + 1.25], yaw: 0, stand: [S9.at[0] + 0.4, S9.at[1], S9.at[2] + 1.85] }); break; }   /* 가운데 옷장(신발장 열쇠) + 앞 걸상 */
    } }
  // 가게 방(손님 바람 → 칸): 계산대 + 주인(뒤) + 손님(앞) · 칸 넷(뒤벽 오른쪽 둘 · 왼벽 · 오른벽) · 정체 소품
  function roomShop(at, K, C, nm, B9) { const W = 10.4, D = 8.6, H = 3.3, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, rnd = K.rndOf((hashS(nm + B9.cx) % 2147483646) + 1), seats = [], S9 = base(at, K, C, W, D, H), E = roomE(S9, K);
    const cx = -2.7, cz = -hd + 1.45; counter(S9, K, cx, cz, 2.6, C.acc); K.standGuest(S9, ox + cx, oy, oz + cz - 0.75, 0, 1); K.mainSign(S9, nm, cx, 2.75, -hd + 0.03, 0);
    K.standGuest(S9, ox + cx - 0.9, oy, oz + cz + 1.05, Math.PI, 3 + (hashS(nm) % 2) * 3);   /* 손님(아이 키 · 계산대를 봄) */
    const SP = [['B', 0.2, 2.3], ['B', 2.55, 4.95], ['L', -1.2, 1.6], ['R', -1.9, 0.9]], st = C.slots.map((s, i) => station(S9, K, E, SP[i][0], SP[i][1], SP[i][2], s, rnd));
    sig(S9, K, E, C, W, D, rnd, seats); K.plant(S9, hw - 0.6, hd - 0.7, 0.9);
    const ex = [{ k: 'ent:ask', stand: [cx + 0.5, 0, cz + 1.0], r: 1.2, label: '🙋 ' + C.owner + ' — ' + C.tip }].concat(st.map((s, i) => ({ k: 'ent:s' + i, stand: s.stand, r: 1.0, label: '🔎 ' + C.slots[i][0] + (en() ? '' : ' 칸') })));
    const bags = C.slots.map(s => bagAt(K, at, cx + 0.6, 1.02, cz + 0.05, s)); bags.forEach(g => { g.visible = false; }); S9.extra = (S9.extra || []).concat(bags);
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.0, p: 0.55 }, spz: 3.0, st, show: bags, cnt: [cx + 0.6, 1.02, cz + 0.05], owner: [ox + cx, oy, oz + cz - 0.75], guest: [ox + cx - 0.9, oy, oz + cz + 1.05], items: ['계산대 · ' + C.owner + '(이름 없음)', '손님(이름 없음)'].concat(C.slots.map(s => s[0] + ' 칸')) }; }
  // 식당: 주방 창구(뒤) + 요리사 · 탁자 넷(왼쪽 = 창가 · 오른쪽 = 안쪽 · 손님 혼자/둘) · 차림표
  function roomDiner(at, K, C, nm, B9) { const W = 11, D = 9, H = 3.3, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, rnd = K.rndOf((hashS(nm + B9.cx) % 2147483646) + 1), seats = [], S9 = base(at, K, C, W, D, H), E = roomE(S9, K), P = S9.put;
    P('b', 0, 0, -hd + 1.3, 4.6, 1.0, 0.5, WH); P('b', 0, 0.12, -hd + 1.556, 4.5, 0.6, 0.012, C.acc); P('b', 0, 1.0, -hd + 1.3, 4.66, 0.05, 0.6, WD); K.colL(S9, 0, -hd + 1.3, 2.33, 0.3, -0.5, 1.1);   /* 주방 창구 */
    P('b', 0, 0, -hd + 0.4, 4.6, 0.9, 0.6, 0xb8bec4); for (let i = 0; i < 3; i++) { P('c16', -1.4 + i * 1.4, 0.912, -hd + 0.4, 0.2, 0.18, 0, 0x6b7078); P('c16', -1.4 + i * 1.4, 0.9, -hd + 0.4, 0.12, 0.012, 0, 0xff8a3a, 1); }   /* 화구·냄비(FIX-4B 냄비는 불꽃 판 위 — 밑면이 같은 평면 X) */
    K.standGuest(S9, ox + 0.8, oy, oz - hd + 0.95, 0, 4); P('b', 0.8, 1.66, -hd + 0.95, 0.24, 0.16, 0.24, 0xffffff);   /* 요리사(흰 모자) */
    K.mainSign(S9, nm, 0, 2.8, -hd + 0.03, 0); { const mt = C.menu.map(m => m[0]).join(' · '); K.sign(S9, mt, 0, 2.15, -hd + 0.03, 0, Math.min(4.4, [...mt].length * 0.2 + 0.6), 0.36, { bg: '#2b2d31', fg: '#fff2a8', fr: WD }); }
    for (let i = 0; i < C.menu.length; i++) shape(E, 'plate', -1.2 + i * 1.2, 1.05, -hd + 1.3, C.menu[i][1], 0, 1);
    for (const z of [-0.9, 1.7]) K.wwin(S9, 'L', z, 0.95, 1.4, 1.2, { sun: true });
    const T = [], cnt = rnd() < 0.5 ? [1, 2, 2, 1] : [2, 1, 1, 2];   /* 탁자 넷: [창가 뒤 · 창가 앞 · 안쪽 뒤 · 안쪽 앞] — 혼자·둘이 창가·안쪽마다 하나씩 */
    [[-3.6, -0.9, 1], [-3.6, 1.7, 1], [3.4, -0.9, 0], [3.4, 1.7, 0]].forEach(([x, z, win], i) => { K.stable(S9, x, z, 0.9, 1.1, WL, 0.74); const s0 = seats.length; K.chair(S9, seats, x - 0.8, z, Math.PI / 2, C.acc); K.chair(S9, seats, x + 0.8, z, -Math.PI / 2, C.acc);
      for (let g = 0; g < cnt[i]; g++) K.sitGuest(S9, seats, s0 + (win ? g === 0 ? 0 : 1 : g === 0 ? 1 : 0), (i * 2 + g) % 8 === 0 ? 1 : (i * 2 + g) % 8); E('c', x, 0.74, z + 0.3, 0.05, 0.08, 0.05, 0xfff2a8); E('b', x, 0.74, z - 0.35, 0.12, 0.02, 0.18, 0xd8dce0);
      T.push({ x, z, win: !!win, n: cnt[i], back: z < 0, stand: [x, 0, z + 1.15] }); K.sign(S9, String(i + 1), x, 1.25, z, Math.PI / 2 * (win ? 1 : -1), 0.3, 0.3, { bg: S9.ac, fr: false, two: true }); P('b', x, 0.74, z, 0.02, 0.36, 0.02, 0x3a3d42); });
    const plates = T.map(t => K.parts(put => { const E2 = partE(put, at); for (const dz of [-0.2, 0.2]) shape(E2, 'plate', t.x, 0.75, t.z + dz, C.menu[0][1], 0, 1); })); plates.forEach(g => { g.visible = false; }); S9.extra = (S9.extra || []).concat(plates);
    K.plant(S9, hw - 0.6, hd - 0.7, 0.9); K.plant(S9, -hw + 0.6, hd - 0.7, 0.9);
    const ex = [{ k: 'ent:ask', stand: [-1.2, 0, -hd + 2.1], r: 1.2, label: '🍽 ' + (en() ? 'Kitchen window — take an order' : '주방 창구 — 주문 쪽지 받기') }].concat(T.map((t, i) => ({ k: 'ent:s' + i, stand: t.stand, r: 0.95, label: '🍽 ' + (i + 1) + (en() ? ' table' : '번 탁자') })));
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.2, p: 0.6 }, spz: 3.0, T, show: plates, owner: [ox + 0.8, oy, oz - hd + 0.95], items: ['주방 창구 · 요리사(이름 없음)', '차림표', '탁자 넷 · 손님(이름 없음)', '창가 창'] }; }
  // 교실: 칠판 + 선생님 + 책상(아이 손님) · 갈래 소품(피아노·이젤·매트)
  function roomClass(at, K, C, nm, B9) { const W = 10.4, D = 8.6, H = 3.3, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], S9 = base(at, K, C, W, D, H), E = roomE(S9, K), P = S9.put;
    P('b', 0, 0.9, -hd + 0.05, 4.2, 1.4, 0.04, 0x8a6a4a); P('b', 0, 0.96, -hd + 0.075, 4.0, 1.28, 0.012, C.sig === 'mats' ? 0xf6f4ee : 0x2f5a3a); K.sign(S9, C.board, 0, 1.95, -hd + 0.1, 0, 2.2, 0.36, { bg: C.sig === 'mats' ? '#f6f4ee' : '#2f5a3a', fg: C.sig === 'mats' ? '#2b2d31' : '#ffffff', fr: false });
    const stars = [0, 1, 2, 3, 4].map(i => K.parts(put => { const E2 = partE(put, at), x = 0.35 + i * 0.36; E2('s', x, 1.3, -hd + 0.11, 0.13, 0.13, 0.02, 0xf2c230); E2('s', x, 1.3, -hd + 0.125, 0.065, 0.065, 0.02, 0xfff2a8); })); const ak = catOf(B9), two = ak === 'study', stars2 = two ? [0, 1, 2, 3, 4].map(i => K.parts(put => { const E2 = partE(put, at), x = 0.35 + i * 0.36; E2('s', x, 1.06, -hd + 0.11, 0.11, 0.11, 0.02, 0x7ec8f2); E2('s', x, 1.06, -hd + 0.125, 0.055, 0.055, 0.02, 0xe6f4ff); })) : [], AS = { [ak]: stars }; if (two) AS.science = stars2;
    for (const k9 in AS) { const n9 = A.acad ? A.acad().stars(k9) : 0; AS[k9].forEach((g, i) => { g.visible = i < n9; }); } S9.extra = stars.concat(stars2);   /* ACAD-1 칠판 별 = 그 과목 마친 단계 수(0~5) · 공부방 = 노랑 독서·논술 + 파랑 과학·코딩 두 줄 */
    K.mainSign(S9, nm, -3.5, 2.75, -hd + 0.03, 0); K.standGuest(S9, ox - 2.6, oy, oz - hd + 1.3, 0.4, 2); P('b', -2.6, 0, -hd + 2.0, 1.1, 0.8, 0.55, W0); K.colL(S9, -2.6, -hd + 2.0, 0.55, 0.28, -0.5, 0.85);
    if (C.sig === 'mats') { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) P('b', -1.8 + i * 1.2, 0, -0.6 + j * 1.2, 1.18, 0.025, 1.18, (i + j) % 2 ? 0x3d74c9 : 0xe0453a); for (let i = 0; i < 4; i++) K.standGuest(S9, ox - 1.8 + i * 1.2, oy + 0.025, oz + 0.2, Math.PI, i * 3);   /* FIX-4B 매트 2.5cm(창 햇빛 바닥 자국 3cm와 같은 평면 X) */ P('b', hw - 0.05, 0.4, 0, 0.03, 2.0, 3.4, 0x3a3d42); P('b', hw - 0.07, 0.45, 0, 0.012, 1.9, 3.3, 0xcfe8ff, 1); }
    else { [[-2.8, 0.2], [-1.5, 0.2], [1.5, 0.2], [2.8, 0.2], [-2.8, 1.8], [-1.5, 1.8], [1.5, 1.8], [2.8, 1.8]].forEach(([x, z], i) => { K.stable(S9, x, z - 0.35, 1.0, 0.5, WL, 0.66); const s0 = seats.length; K.chair(S9, seats, x, z + 0.15, Math.PI, C.acc); if (i % 3 !== 1) K.sitGuest(S9, seats, s0, (i * 3) % 9); E('b', x - 0.2, 0.66, z - 0.4, 0.2, 0.012, 0.26, 0xf6f4ee); });
      if (C.sig === 'pianos') { K.putF(S9, 'd_i9', -hw + 0.5, -0.6, Math.PI / 2); K.colL(S9, -hw + 0.6, -0.6, 0.4, 0.8, -0.5, 1.3); K.putF(S9, 'd_i9', hw - 0.5, -0.6, -Math.PI / 2); K.colL(S9, hw - 0.6, -0.6, 0.4, 0.8, -0.5, 1.3); }
      if (C.sig === 'easels') for (const [x, z] of [[-hw + 0.8, -0.6], [hw - 0.8, -0.6]]) { P('b', x, 0, z, 0.05, 1.6, 0.05, WD); P('b', x, 0.9, z + 0.05, 0.7, 0.55, 0.03, 0xf6f4ee); P('b', x, 1.0, z + 0.07, 0.5, 0.3, 0.006, 0x8fc4e8); P('b', x - 0.1, 1.12, z + 0.075, 0.2, 0.1, 0.006, 0xf2c230); K.colL(S9, x, z, 0.36, 0.2, -0.5, 1.6); } }
    for (let i = 0; i < 3; i++) K.wwin(S9, i % 2 ? 'R' : 'L', -0.8 + i * 0.4, 1.0, 1.3, 1.1, { sun: true });
    const ex = [{ k: 'ent:acad', stand: [-1.6, 0, -hd + 2.2], r: 1.2, label: '📝 ' + C.owner + ' — ' + C.tip }];
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.2, p: 0.62 }, spz: 2.9, show: stars.concat(stars2), acadStars: AS, owner: [ox - 2.6, oy, oz - hd + 1.3], items: ['칠판 · ' + C.owner + '(이름 없음)', '책상 · 배우는 아이(이름 없음)'] }; }
  // 사무실·안내·터미널: 책상 + 직원 · 판(칸) 셋~넷 · 기다리는 의자
  function roomOffice(at, K, C, nm, B9) { const term = C.st === 'term', W = term ? 12 : 10.4, D = 8.6, H = term ? 3.8 : 3.3, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, rnd = K.rndOf((hashS(nm + B9.cx) % 2147483646) + 1), seats = [], S9 = base(at, K, C, W, D, H), E = roomE(S9, K), P = S9.put;
    const cx = term ? -3.6 : -2.6, cz = -hd + 1.5; counter(S9, K, cx, cz, 2.4, C.acc); K.standGuest(S9, ox + cx, oy, oz + cz - 0.75, 0, 5); K.mainSign(S9, nm, cx, 2.8, -hd + 0.03, 0); K.standGuest(S9, ox + cx + 0.9, oy, oz + cz + 1.0, Math.PI, 7);
    const SP = term ? [['B', 0.0, 2.6], ['B', 2.9, 5.6], ['R', -1.8, 1.0]] : [['B', 0.2, 2.3], ['B', 2.55, 4.95], ['L', -1.2, 1.6], ['R', -1.9, 0.9]], st = C.slots.map((s, i) => station(S9, K, E, SP[i][0], SP[i][1], SP[i][2], s, rnd));
    const n = term ? 4 : 3; for (let i = 0; i < n; i++) K.chair(S9, seats, -0.6 + i * 0.7, 1.4, Math.PI, 0x5a6b7a); K.sitGuest(S9, seats, 1, 4); if (term) K.sitGuest(S9, seats, 3, 6);
    K.plant(S9, hw - 0.6, hd - 0.7, 0.9);
    const ok = C.slots.map((s, i) => K.parts(put => { const E2 = partE(put, at), p = st[i].top; E2('c', p[0], 0.79, p[2], 0.11, 0.015, 0.11, 0x2f9f58); E2('b', p[0] - 0.03, 0.805, p[2], 0.05, 0.012, 0.012, 0xffffff); E2('b', p[0] + 0.02, 0.805, p[2], 0.1, 0.012, 0.012, 0xffffff, 0.8); })); ok.forEach(g => { g.visible = false; }); S9.extra = ok;
    const ex = [{ k: 'ent:ask', stand: [cx + 0.5, 0, cz + 1.0], r: 1.2, label: '🙋 ' + C.owner + ' — ' + C.tip }].concat(st.map((s, i) => ({ k: 'ent:s' + i, stand: s.stand, r: 1.0, label: '📋 ' + C.slots[i][0] })));
    if (C.mapE) ex.push({ k: 'ent:map', stand: [hw - 1.4, 0, hd - 2.4], r: 0.9, label: '🗺 ' + (en() ? 'Look at the big town map' : '큰 마을 지도 보기') });
    if (C.mapE) { P('b', hw - 0.05, 0.9, hd - 2.4, 0.03, 1.3, 1.6, 0x3a3d42); P('b', hw - 0.07, 0.95, hd - 2.4, 0.012, 1.2, 1.5, 0xe8e0c8); for (let i = 0; i < 6; i++) P('b', hw - 0.08 - i * 0.002, 1.0 + rnd() * 0.9, hd - 3.0 + rnd() * 1.2, 0.006, 0.16 + rnd() * 0.2, 0.2 + rnd() * 0.3, [0x5aa84c, 0x5fb6e0, 0xd9b46a, 0x8a9098][i % 4]); }
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.0, p: 0.55 }, spz: 3.0, st, show: ok, cnt: [cx + 0.6, 1.02, cz + 0.05], owner: [ox + cx, oy, oz + cz - 0.75], items: ['창구 · ' + C.owner + '(이름 없음)', '기다리는 의자 · 손님(이름 없음)'].concat(C.slots.map(s => s[0])) }; }
  // 창고·작업장: 높은 선반(칸) + 손수레 + 일꾼
  function roomWare(at, K, C, nm, B9) { const W = 12, D = 9.6, H = 4.2, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, rnd = K.rndOf((hashS(nm + B9.cx) % 2147483646) + 1), seats = [], S9 = base(at, K, C, W, D, H, { noFront: false }), E = roomE(S9, K), P = S9.put;
    K.standGuest(S9, ox - 2.4, oy, oz - hd + 1.6, 0.3, 4); P('b', -2.4, 1.66, -hd + 1.6, 0.26, 0.12, 0.26, 0xf2c230); K.mainSign(S9, nm, -2.6, 3.3, -hd + 0.03, 0);
    const SP = [['B', 0.0, 2.8], ['B', 3.1, 5.9], ['L', -1.8, 1.4], ['R', -1.8, 1.4]], st = C.slots.map((s, i) => station(S9, K, E, SP[i][0], SP[i][1], SP[i][2], s, rnd));
    P('b', 0.2, 0, 1.0, 1.2, 0.14, 0.8, 0xc8945a); for (let i = 0; i < 4; i++) shape(E, 'crate', -0.05 + (i % 2) * 0.5, 0.14 + ((i / 2) | 0) * 0.3, 1.0, C.slots[i][3], 0, 1); K.colL(S9, 0.2, 1.0, 0.6, 0.4, -0.5, 0.75);
    P('b', -2.4, 0, 1.2, 0.7, 0.05, 1.0, 0x6b7078); P('b', -2.4, 0, 0.72, 0.7, 1.0, 0.04, 0x6b7078); for (const dx of [-0.33, 0.33]) K.part(S9, 'c16', -2.4 + dx + (dx < 0 ? -0.03 : 0.03), 0.08, 1.6, 0.08, 0.05, 0, 0x2b2d31, 0, Math.PI / 2, Math.PI / 2); K.colL(S9, -2.4, 1.1, 0.36, 0.5, -0.5, 1.0);
    const ok = C.slots.map((s, i) => K.parts(put => { const E2 = partE(put, at), sh9 = st[i].sty === 'shelf', p = sh9 ? st[i].top : st[i].front; shape(E2, 'crate', p[0], sh9 ? 1.89 : 0, p[2], s[3], st[i].ry, 0.9); })); ok.forEach(g => { g.visible = false; }); S9.extra = ok;
    const ex = [{ k: 'ent:ask', stand: [-1.6, 0, -hd + 2.4], r: 1.2, label: '🙋 ' + C.owner + ' — ' + C.tip }].concat(st.map((s, i) => ({ k: 'ent:s' + i, stand: s.stand, r: 1.0, label: '📦 ' + C.slots[i][0] })));
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.4, p: 0.6 }, spz: 3.2, st, show: ok, owner: [ox - 2.4, oy, oz - hd + 1.6], items: ['높은 선반 칸 넷', '손수레 · 상자 더미', C.owner + '(이름 없음)'] }; }
  // 마을회관: 긴 탁자 + 의자 + 이웃 부탁 게시판(BAG-2)
  function roomHall(at, K, C, nm, B9) { const W = 12, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], S9 = base(at, K, C, W, D, H), P = S9.put;
    K.mainSign(S9, nm, 0, 2.8, -hd + 0.03, 0); P('b', 0, 0.9, -hd + 0.05, 3.2, 1.4, 0.04, 0x8a6a4a); P('b', 0, 0.95, -hd + 0.075, 3.0, 1.3, 0.012, 0xc8a070); for (let i = 0; i < 6; i++) P('b', -1.1 + (i % 3) * 1.1, 1.25 + ((i / 3) | 0) * 0.55, -hd + 0.085, 0.6, 0.42, 0.006, [0xffffff, 0xfff2a8, 0xcfe8ff, 0xffd0dc][i % 4]);
    K.sign(S9, en() ? 'Neighbours’ requests' : '이웃 부탁', 0, 2.2, -hd + 0.1, 0, 1.6, 0.3, { bg: '#8a5a34', fr: false });
    for (const z of [-0.6, 2.2]) { K.stable(S9, 0, z, 4.0, 0.9, WL, 0.74); for (let i = 0; i < 4; i++) { K.chair(S9, seats, -1.5 + i, z - 0.75, 0, 0x8a5a34); K.chair(S9, seats, -1.5 + i, z + 0.75, Math.PI, 0x8a5a34); } }
    K.sitGuest(S9, seats, 1, 2); K.sitGuest(S9, seats, 6, 5); K.sitGuest(S9, seats, 11, 7); K.standGuest(S9, ox - 2.8, oy, oz - hd + 1.3, 0.3, 1);
    for (const s of ['L', 'R']) for (const z of [-1.2, 1.6]) K.wwin(S9, s, z, 1.0, 1.3, 1.1, { sun: true });
    const ex = [{ k: 'ent:board', stand: [0, 0, -hd + 1.4], r: 1.3, label: '📌 ' + (en() ? 'Read the neighbours’ request board' : '이웃 부탁 게시판 보기') }];
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 4.2, p: 0.6 }, spz: 3.0, show: [], owner: [ox - 2.8, oy, oz - hd + 1.3], items: ['이웃 부탁 게시판', '긴 탁자 둘 · 의자', '이웃(이름 없음)'] }; }
  // 집·아파트·민박: 거실(소파·TV·러그) + 부엌(싱크대·냉장고·식탁) + 정리 칸 넷(책장·장난감·빨래·일 소품) — 바닥에 놓인 것이 부탁
  // ENTER-3 집 소품(동네 색 · 이웃 일 구석 · 철 · 그 집만의 일 · 찾기 자리) — 모두 방을 지을 때 한 번(합친 부품 · 인스턴스)
  const REGPAL = { 바다: [[0xeef5f8, 0xf4f7f2, 0xe8f0f6], [0x2f6f9a, 0x3a8ab0, 0x2a5a7a], [0xe8dcc8, 0xdcd0bc, 0xe2d6c0]], 들: [[0xf7f0dc, 0xf5ecd2, 0xf2ead8], [0xa2741e, 0x8a6a2a, 0x6b8a3a], [0xe8d2a0, 0xe0c890, 0xead8b0]], 산: [[0xf0ece0, 0xe9efe4, 0xf2eadc], [0x4e7a3a, 0x6b4a2f, 0x3f6a4a], [0xc8a070, 0xb8905e, 0xd0aa7a]], 강: [[0xeef6f2, 0xf2f6ee, 0xe8f2ee], [0x2f8f8a, 0x3a7a6a, 0x2a6a7a], [0xe0d4bc, 0xd8ccb4, 0xe6dac2]], 시내: [[0xf6efe2, 0xf2f4ee, 0xf7ecef], [0x8a5a34, 0x5a6b7a, 0x9a5a6a], [0xe8d2b0, 0xf0dcc0, 0xdcc4a0]] };
  const FINDSP = (hw, hd) => [[[-0.3, 0.02, 1.25], [-0.3, 0, 1.95], '거실 깔개 옆'], [[2.75, 0.755, -0.18], [2.75, 0, 0.55], '부엌 식탁 위'], [[0.3, 0.02, -hd + 0.5], [0.3, 0, -hd + 1.25], '창가 바닥'], [[hw - 1.0, 0.02, hd - 0.95], [hw - 1.7, 0, hd - 1.25], '현관 쪽 화분 옆'], [[hw - 0.35, 0.765, 0.95], [hw - 1.15, 0, 0.95], '일 도구 놓는 곳']];
  function jobCorner(S9, K, E, jk, hw) { const P = S9.put, x = hw - 0.35, y = 0.76, R = -Math.PI / 2;   /* 오른벽 낮은 장 + 그 일의 소품(그물·김발·밀짚모자·배 바구니·장작·산불 조심·낚싯대·노선도·냄비·노트북·구급상자) */
    P('b', x, 0, 1.6, 0.6, 0.72, 1.6, W0); P('b', x, 0.72, 1.6, 0.64, 0.04, 1.64, WD); P('b', x - 0.306, 0.1, 1.6, 0.012, 0.5, 1.5, 0xb8905e); K.colL(S9, x, 1.6, 0.32, 0.82, -0.5, 0.8);
    switch (jk) {
      case 'fish': shape(E, 'net', x, y, 1.2, 0x2f8f6a, R, 0.8); shape(E, 'ball', x, y, 2.05, 0xef7a24); shape(E, 'ball', x - 0.05, y, 1.8, 0xf6f4ee, 0, 0.8); shape(E, 'boot', hw - 0.3, 0, 0.45, 0xf2c230, R); break;
      case 'laver': shape(E, 'net', x, y, 1.25, 0x24604a, R, 0.8); E('b', x, y, 2.0, 0.3, 0.06, 0.32, 0x1f2a1c); E('b', x, y + 0.06, 2.0, 0.28, 0.012, 0.3, 0x2b3a2a); P('b', hw - 0.06, 1.15, 1.6, 0.03, 0.62, 0.95, 0x6b4a2f); P('b', hw - 0.08, 1.2, 1.6, 0.012, 0.52, 0.85, 0x1f2a1c); break;
      case 'farm': shape(E, 'cap', hw - 0.13, 1.42, 1.2, 0xe9d27a, R); P('b', hw - 0.05, 1.5, 1.2, 0.06, 0.03, 0.03, WD); shape(E, 'sack', x, y, 2.0, 0xeee4cc, R, 0.8); shape(E, 'tool', x, y, 1.3, 0x8a5a34, R); break;
      case 'orchard': shape(E, 'bowl', x, y, 1.25, 0xc8945a, 0, 1.6); shape(E, 'pear', x, y + 0.05, 1.25, 0xd9cc66, 0, 0.8); shape(E, 'pear', x, y, 2.0, 0xd9cc66); break;
      case 'mush': shape(E, 'plank', x, y, 1.25, 0x8a5a34, 0, 0.7); shape(E, 'shroom', x, y, 2.0, 0x8a5a34, R); break;
      case 'forest': shape(E, 'cap', hw - 0.13, 1.42, 1.2, 0x4e7a3a, R); P('b', hw - 0.05, 1.5, 1.2, 0.06, 0.03, 0.03, WD); K.sign(S9, en() ? 'Fire safety' : '산불 조심', hw - 0.04, 1.75, 2.0, R, 0.9, 0.3, { bg: '#c8332b', fr: 0xf6f4ee }); shape(E, 'rod', hw - 0.15, 0, 0.55, 0x8a5a34); shape(E, 'bag', x, y, 2.05, 0x4e7a3a, R, 0.8); break;
      case 'river': shape(E, 'rod', hw - 0.15, 0, 0.5, 0x3a3d42); shape(E, 'rod', hw - 0.15, 0, 0.64, 0x2f6fd0); E('b', x, y, 1.8, 0.3, 0.26, 0.45, 0x3d74c9); E('b', x, y + 0.26, 1.8, 0.31, 0.04, 0.46, 0xf6f4ee); break;
      case 'bus': P('b', hw - 0.05, 1.05, 1.6, 0.02, 0.42, 1.2, 0xf6f4ee); E('b', hw - 0.066, 1.24, 1.6, 0.01, 0.04, 1.0, 0x2f6fd0); for (let i = 0; i < 5; i++) E('s', hw - 0.072, 1.26, 1.15 + i * 0.22, 0.03, 0.03, 0.01, 0xf6f4ee); K.sign(S9, en() ? 'Bus route' : '버스 노선도', hw - 0.04, 1.62, 1.6, R, 1.1, 0.26, { bg: '#2f6fd0', fr: false }); shape(E, 'cap', x, y, 1.3, 0x2f6fd0, R); break;
      case 'cook': E('c', x, y, 1.2, 0.16, 0.16, 0.16, 0x9aa0a6); E('c', x, y + 0.16, 1.2, 0.165, 0.015, 0.165, 0x6b7078); E('b', x, y, 1.95, 0.3, 0.03, 0.46, 0xc8a070); shape(E, 'cloth', hw - 0.12, 1.95, 2.25, 0xf6f4ee, 0, 1); break;
      case 'nurse': E('b', x, y, 1.3, 0.3, 0.2, 0.4, 0xffffff); E('b', x, y + 0.2, 1.3, 0.1, 0.012, 0.03, 0xd8262e); E('b', x, y + 0.203, 1.3, 0.03, 0.012, 0.1, 0xd8262e); shape(E, 'bag', x, y, 2.05, 0xe9eef4, R, 0.8); break;
      default: E('b', x, y, 1.5, 0.3, 0.02, 0.4, 0x3a3d42); E('b', x + 0.13, y + 0.02, 1.5, 0.02, 0.24, 0.38, 0x2b2d31); E('b', x + 0.118, y + 0.05, 1.5, 0.004, 0.18, 0.32, 0x9fc8f0, 0, 0, 1); shape(E, 'bag', x, y, 2.1, 0x3a3d42, R, 0.8);
    } }
  function seasonProp(S9, K, E, s9, x, z) { if (s9 === 'spring') { E('c', x, 0, z, 0.09, 0.32, 0.09, 0xd8e8f0); for (let i = 0; i < 3; i++) shape(E, 'flower', x + (i - 1) * 0.05, 0.28, z, [0xf08fb2, 0xf2c230, 0xffffff][i], 0, 1.1); }   /* 봄 꽃병 · 여름 선풍기 · 가을 감 바구니 · 겨울 난로 */
    else if (s9 === 'autumn') { shape(E, 'bowl', x, 0, z, 0xc8945a, 0, 1.6); shape(E, 'orange', x, 0.05, z, 0xf08a24, 0, 1); }
    else if (s9 === 'winter') { E('b', x, 0, z, 0.42, 0.56, 0.26, 0xd8dce0); E('b', x, 0.56, z, 0.44, 0.03, 0.28, 0x8a9098); E('b', x, 0.12, z - 0.136, 0.3, 0.3, 0.01, 0xff8a3a, 0, 0, 1); }
    else { E('c', x, 0, z, 0.17, 0.03, 0.17, 0xf6f4ee); E('c', x, 0.03, z, 0.022, 0.78, 0.022, 0xf6f4ee); E('c', x, 0.86, z - 0.03, 0.2, 0.06, 0.2, 0x8fc4e8, 0, Math.PI / 2); E('c', x, 0.86, z - 0.07, 0.05, 0.02, 0.05, 0xf6f4ee, 0, Math.PI / 2); }
    K.colL(S9, x, z, 0.23, 0.18, -0.5, 1.0); }
  function evProps(S9, K, E, ev, hd, seats, ch0) {   /* 그 집만의 일 — 들어가면 먼저 보이는 것(생일 케이크·고깔·글씨 띠 · 이삿짐 상자 · 손님과 손님 신발) */
    if (ev === 'bday') { E('c', 2.4, 0.74, -0.42, 0.15, 0.11, 0.15, 0xf6f0e4); E('c', 2.4, 0.85, -0.42, 0.155, 0.02, 0.155, 0xf08fb2); for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4, cx9 = 2.4 + Math.cos(a) * 0.07, cz9 = -0.42 + Math.sin(a) * 0.07; E('c', cx9, 0.87, cz9, 0.008, 0.06, 0.008, [0xe0453a, 0x3d74c9, 0xf2c230, 0x3cc76a][i]); E('s', cx9, 0.945, cz9, 0.012, 0.018, 0.012, 0xffd060, 0, 0, 1); }
      for (const dx of [-0.45, 0.45]) E('k', 2.4 + dx, 0.74, -0.2, 0.06, 0.16, 0.06, dx < 0 ? 0x3d74c9 : 0xe0453a); K.sign(S9, en() ? 'Happy birthday' : '생일 축하해요', -0.2, 2.15, -hd + 0.09, 0, 1.6, 0.32, { bg: '#d85a8a', fr: false }); }
    if (ev === 'move') { for (let i = 0; i < 5; i++) shape(E, 'crate', -0.75 + (i % 2) * 0.48, ((i / 2) | 0) * 0.3, 1.45 + (i % 2 ? 0.05 : 0), [0xc8945a, 0xb8895a][i % 2], 0, 1); K.colL(S9, -0.51, 1.47, 0.5, 0.22, -0.5, 1.0); }
    if (ev === 'guest' && ch0 >= 0) { K.sitGuest(S9, seats, ch0 + 1, 5); for (const dx of [-0.75, -0.5]) shape(E, 'shoe', dx, 0, hd - 0.4, 0x3a2414, Math.PI, 0.9); } }
  // FIX-4E(11-07): 집·민박 이웃 부탁 E(🙋) = 그 방의 다른 E(정리 칸 · 찾기 자리 · 일 도구 · 앉기 · 나가기 · 이곳 알아보기)에서 2.5m 넘게 — 정리 칸 1.86m · 소파 앉기 1.71m · 민박 이불장 1.39m였음(E는 가까운 쪽이 가져가 엉뚱한 창이 열림 · lessons E표)
  //   이웃 몸은 바라던 자리(body0) 그대로 두고 부탁 E만 몸 둘레 0.6~1.4m에서 고름 → 안 되면 몸도 그 가까이 빈 자리로 · 둘 다 문에서 걸어 닿는 칸만(town_bldg visSpot과 같은 셈)
  function askSpot(S9, W, D, E9, body0, ask0) { const [ox, oy, oz] = S9.at, hw = W / 2, hd = D / 2, cols = S9.cols || [], st = 0.25, GAP = 2.5;
    const solid = (x, z, r) => cols.some(c => c.y1 > oy + 0.3 && c.y0 < oy + 1.7 && ox + x + r > c.x0 && ox + x - r < c.x1 && oz + z + r > c.z0 && oz + z - r < c.z1);
    const NX = Math.floor(W / st), NZ = Math.floor(D / st), ix = x => Math.round((x + hw) / st - 0.5), iz = z => Math.round((z + hd) / st - 0.5), cx = i => -hw + (i + 0.5) * st, cz = j => -hd + (j + 0.5) * st, seen = new Uint8Array(NX * NZ), Q = [];
    { const i0 = ix(0), j0 = iz(hd - 0.9); if (i0 >= 0 && j0 >= 0 && i0 < NX && j0 < NZ) { seen[j0 * NX + i0] = 1; Q.push(i0, j0); } }
    while (Q.length) { const j = Q.pop(), i = Q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, j2 = j + b; if (i2 < 0 || j2 < 0 || i2 >= NX || j2 >= NZ || seen[j2 * NX + i2]) continue; seen[j2 * NX + i2] = solid(cx(i2), cz(j2), 0.3) ? 2 : 1; if (seen[j2 * NX + i2] === 1) Q.push(i2, j2); } }
    const walk = (x, z) => { const i = ix(x), j = iz(z); return i >= 0 && j >= 0 && i < NX && j < NZ && seen[j * NX + i] === 1; }, GP = (S9.gp || []).map(([gx, gz]) => [gx - ox, gz - oz]);
    const okE = (x, z) => walk(x, z) && !solid(x, z, 0.3) && E9.every(([a, b]) => Math.hypot(a - x, b - z) >= GAP);
    const ring = (bx, bz) => { const tx = ask0[0] + bx - body0[0], tz = ask0[1] + bz - body0[1]; let best = null, bd = 1e9; for (let r = 0.6; r <= 1.41; r += 0.2) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, x = bx + Math.sin(a) * r, z = bz + Math.cos(a) * r, d = Math.hypot(x - tx, z - tz); if (d < bd && okE(x, z)) { bd = d; best = [x, z]; } } return best; };
    if (okE(ask0[0], ask0[1])) return { body: body0, ask: ask0 }; const e0 = ring(body0[0], body0[1]); if (e0) return { body: body0, ask: e0 };
    const C9 = []; for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const x = cx(i), z = cz(j); if (seen[j * NX + i] === 1 && !solid(x, z, 0.35) && !GP.some(([a, b]) => Math.hypot(a - x, b - z) < 0.9) && E9.every(([a, b]) => Math.hypot(a - x, b - z) >= 0.9)) C9.push([Math.hypot(x - body0[0], z - body0[1]), x, z]); }
    C9.sort((a, b) => a[0] - b[0]); for (const [, x, z] of C9) { const e = ring(x, z); if (e) return { body: [x, z], ask: e }; }
    console.warn('[ENTER] 이웃 부탁 E: 다른 E에서 2.5m 넘는 곳 없음'); return { body: body0, ask: ask0 }; }
  function roomHome(at, K, C, nm, B9, kind, plan) { const apt = kind === 'apt', inn = kind === 'inn', pk = plan ? plan.kind : 'tidy', PAL = REGPAL[reg5(B9)] || REGPAL.시내, W = apt ? 10 : 9.6, D = apt ? 8 : 7.8, H = 2.9, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, rnd = K.rndOf((hashS(nm + B9.cx) % 2147483646) + 1), seats = [], tone = hashS(String(B9.b && B9.b.id) + 't') % 3;
    const C2 = { ...C, wall: inn ? [0xf6efe2, 0xf2f4ee, 0xf7ecef][tone] : PAL[0][tone], acc: inn ? [0x8a5a34, 0x5a6b7a, 0x9a5a6a][tone] : PAL[1][tone], ft: apt ? ['wood', 1.0, 0xf0e2cc] : ['wood', 1.0, inn ? [0xe8d2b0, 0xf0dcc0, 0xdcc4a0][tone] : PAL[2][tone]], wt: [[['stripe', 0.9, 0xfff8f0, 0.9, H, 'BLR'], ['paper', 1.0, 0xffffff, 0.9, H, 'BLR'], ['wave', 1.2, 0xfffaf4, 0.9, H, 'BLR']][tone]] };
    const S9 = base(at, K, C2, W, D, H, { noFront: true }), E = roomE(S9, K), P = S9.put; let ch0 = -1;
    if (apt) { P('b', 0, 0.3, -hd + 0.04, 2.4, 2.2, 0.04, 0xf7f6f2); P('b', 0, 0.35, -hd + 0.065, 2.2, 2.1, 0.012, 0xbfe3f5, 2); P('b', 0, 0.35, -hd + 0.075, 0.05, 2.1, 0.012, 0xf7f6f2); }   /* 아파트 = 베란다 큰 창(뒤 · FIX-4B 폭 2.4 — 뒷벽 칸(−4.0~−1.3)·싱크대(1.3~)와 겹치지 않게: 칸 이름판·통 테가 창틀과 같은 평면이던 것) */
    else K.wwin(S9, 'B', 0, 1.0, 1.8, 1.2, { sun: true }); if (!inn) K.wwin(S9, 'L', 0.4, 1.25, 1.4, 1.0, { sun: true });
    if (inn) { P('b', -1.8, 0, -1.0, 2.0, 0.18, 1.5, 0xf08fb2); P('b', -1.8, 0.18, -1.0, 1.9, 0.08, 1.4, 0xf6f4ee); P('b', -1.8, 0.26, -1.55, 0.5, 0.1, 0.3, 0xffffff); K.colL(S9, -1.8, -1.0, 1.0, 0.75, -0.5, 0.3); K.rtable(S9, 1.2, -0.6, 0.35, 0xe9e2d0, 0.35); K.putF(S9, 'd_i16', 1.2, -0.6, 0); for (const a of [0.6, 2.6]) { P('c16', 1.2 + Math.sin(a) * 0.62, 0, -0.6 + Math.cos(a) * 0.62, 0.22, 0.08, 0, 0xe08a3a); } K.putF(S9, 'd_i2', -3.3, -1.6, 0); P('b', -1.8, 0, -1.9, 2.1, 0.9, 0.06, 0x8a5a34); K.colL(S9, -1.8, -1.9, 1.05, 0.05, -0.5, 0.9); }   /* 방석 둘 · 세움 등 · 이불 머리판 */
    else { if (!apt && ['들', '산', '바다', '강'].includes(regOf(B9))) { K.stable(S9, -3.6, 0.4, 0.9, 1.3, 0x8a5a34, 0.36); for (const [dx, dz] of [[-0.75, -0.3], [-0.75, 0.3], [0.75, -0.3], [0.75, 0.3]]) P('c16', -3.6 + dx * 0.9, 0, 0.4 + dz * 1.4, 0.24, 0.08, 0, C2.acc); shape(E, 'bowl', -3.6, 0.36, 0.2, 0xf2c230, 0, 0.7); shape(E, 'cup', -3.5, 0.36, 0.7, 0xf6f4ee, 0, 1); }   /* 들·산·바다 집 = 좌식 상 + 방석 */
      else { K.putF(S9, 'd_i8', -hw + 0.55, 0.4, Math.PI / 2); K.colL(S9, -hw + 0.55, 0.4, 0.42, 1.12, -0.5, 0.7); seats.push({ seat: [ox - hw + 0.5, oy + 0.45, oz + 0.4], yaw: Math.PI / 2, stand: [ox - hw + 1.3, oy, oz + 0.4] }); } K.putF(S9, 'd_i16', -1.2, 0.4, 0); K.putF(S9, 'd_i7', 0.6, 0.4, -Math.PI / 2); K.colL(S9, 0.6, 0.4, 0.25, 0.76, -0.5, 1.3);
      P('b', 2.6, 0, -hd + 0.35, 2.6, 0.9, 0.6, 0xf6f4ee); P('b', 2.6, 0.9, -hd + 0.35, 2.66, 0.04, 0.64, 0x8a9098); P('b', 2.2, 0.94, -hd + 0.35, 0.6, 0.02, 0.4, 0xb8bec4); P('b', 3.3, 0.94, -hd + 0.3, 0.4, 0.12, 0.3, 0x3a3d42); K.colL(S9, 2.6, -hd + 0.35, 1.33, 0.32, -0.5, 1.0);   /* 싱크대 · 개수대 · 가스레인지 */
      P('b', hw - 0.4, 0, -hd + 1.3, 0.7, 1.9, 0.7, 0xeef0f2); P('b', hw - 0.756, 1.1, -hd + 1.3, 0.012, 0.7, 0.6, 0xd8dce0); K.colL(S9, hw - 0.4, -hd + 1.3, 0.35, 0.35, -0.5, 1.9);   /* 냉장고 */
      ch0 = seats.length; K.stable(S9, 2.4, -0.4, 1.2, 0.8, WL, 0.74); K.chair(S9, seats, 2.4 - 0.85, -0.4, Math.PI / 2, C2.acc); K.chair(S9, seats, 2.4 + 0.85, -0.4, -Math.PI / 2, C2.acc); if (!['cook', 'bday', 'table', 'guest'].includes(pk)) { shape(E, 'bowl', 2.3, 0.74, -0.4, 0xf2c230, 0, 0.8); shape(E, 'cup', 2.6, 0.74, -0.3, 0xf6f4ee, 0, 1); } }
    const job = jobOf(B9), slots = inn ? C.slots : HOME_SLOTS.concat([[job[1][0], ['cap', 'boot', 'rod', 'cloth'].includes(job[1][1]) ? 'peg' : job[1][1] === 'bag' ? 'table' : 'bin', job[1][1], job[1][2], job[1][3]]]);
    const SP = inn ? [['L', -0.2, 1.8], ['R', -1.8, -0.2], ['F', -hw + 0.4, -2.0], ['R', 0.6, 2.4]] : [['L', -hd + 0.4, -1.6], ['F', 1.3, 3.1], ['B', -hw + 1.0, -1.3], ['F', -hw + 0.5, -1.6]];
    const st = slots.map((s, i) => station(S9, K, E, SP[i][0], SP[i][1], SP[i][2], s, rnd));
    const asks = inn ? C.asks : HOME_ASKS.concat([[job[2], 3, 1]]);
    const mess = slots.map((s, i) => K.parts(put => { const E2 = partE(put, at); shape(E2, s[2], -1.6 + (i % 2) * 0.8, 0.03, (i > 1 ? 0.8 : 0), s[3], 0.6 * i, s[2] === 'rod' ? 0.5 : 0.9); })), put9 = slots.map((s, i) => K.parts(put => { const E2 = partE(put, at), p = st[i].top; shape(E2, s[2], p[0], p[1] + 0.005, p[2], s[3], st[i].ry, s[2] === 'rod' ? 0.6 : 0.85); }));
    mess.concat(put9).forEach(g => { g.visible = false; }); S9.extra = mess.concat(put9);
    K.plant(S9, hw - 0.5, hd - 0.6, 0.8);
    const jk = JOBKEY[job[0]] || 'office'; let fnd = null;
    if (!inn) { jobCorner(S9, K, E, jk, hw); seasonProp(S9, K, E, sea(), 1.05, hd - 0.45); if (plan && plan.ev) evProps(S9, K, E, plan.ev, hd, seats, ch0);
      if (pk === 'water') { for (const x of [-0.7, 0, 0.7]) { E('c', x, 0, -hd + 0.45, 0.13, 0.22, 0.13, 0xc8693a); E('c', x, 0.22, -hd + 0.45, 0.12, 0.012, 0.12, 0xc8a070); E('s', x, 0.3, -hd + 0.45, 0.1, 0.05, 0.1, 0xa8b860); } K.colL(S9, 0, -hd + 0.45, 0.85, 0.15, -0.5, 0.4); }   /* 마른 화분 셋(물 주면 흙이 짙어지고 잎이 섬) */
      if (pk === 'find' && plan) { const SP9 = FINDSP(hw, hd), j = hashS(plan.id + ':f:' + day()) % SP9.length, obj = HFIND[hashS(plan.id + ':o:' + day()) % HFIND.length], g9 = K.parts(put => { const E2 = partE(put, at), p9 = SP9[j][0]; shape(E2, obj[2], p9[0], p9[1], p9[2], obj[3], 0.4, 1.6); }); S9.extra = (S9.extra || []).concat([g9]); fnd = { obj, zone: SP9[j][2], at: j, g: g9, spots: [j, (j + 2) % SP9.length, (j + 4) % SP9.length].map(i => ({ i, stand: SP9[i][1] })) }; } }   /* 찾기 = 진짜 한 곳 + 헛걸음 둘(귀띔으로 고름) */
    const E9 = st.map(s => [s.stand[0], s.stand[2]]).concat(fnd ? fnd.spots.map(q => [q.stand[0], q.stand[2]]) : [], inn ? [] : [[hw - 1.15, 2.15]], seats.filter(s => !s.taken && s.stand).map(s => [s.stand[0] - ox, s.stand[2] - oz]), [[0, hd - 0.9], [1.7, hd - 1.75]]);   /* 정리 칸 · 찾기 자리 · 일 도구 · 앉기(절대 좌표) · 나가기 · 이곳 알아보기(있을 수 있는 자리) */
    const AS = askSpot(S9, W, D, E9, [-2.7, 1.6], [-2.1, 1.0]), [abx, abz] = AS.body, [aex, aez] = AS.ask;
    K.standGuest(S9, ox + abx, oy, oz + abz, Math.atan2(aex - abx, aez - abz), 2 + tone * 3 === 6 ? 7 : 2 + tone * 3);   /* 이웃(어른 · 이름 없음) · 부탁 E 쪽을 봄 */
    const askR = Math.max(1.1, Math.min(1.9, Math.hypot(aex - abx, aez - abz) + 0.3));   /* PATH-1C u(2차 평가 B 268 '이웃 앞 E 무반응'): 부탁 E는 다른 E를 피해 이웃 몸에서 0.6 ~ 1.5 m 떨어진 바닥에 놓임(FIX-4E) → 반지름 1.1로는 문에서 이웃에게 곧장 걸어가 곁에 서도 E가 안 떴음(1.15 ~ 1.4 m) → 반지름이 이웃 몸까지 덮게(자리는 그대로 · E는 여전히 가까운 쪽이 가져감) */
    const who = inn ? C.owner : job[0], ex = [{ k: 'ent:ask', stand: [aex, 0, aez], r: askR, label: '🙋 ' + who + ' — ' + (inn ? C.tip : (en() ? 'Help' : HKNAME[pk] || '정리 돕기')) }].concat(st.map((s, i) => ({ k: 'ent:s' + i, stand: s.stand, r: 1.0, label: '🧺 ' + slots[i][0] }))).concat(fnd ? fnd.spots.map(q => ({ k: 'ent:f' + q.i, stand: q.stand, r: 0.9, label: '🔎 ' + (en() ? 'Look here' : '여기 살펴보기') })) : []).concat(inn ? [] : [{ k: 'ent:j', stand: [hw - 1.15, 0, 2.15], r: 0.8, label: '🧰 ' + (en() ? 'The neighbour’s work things' : (HJOB[jk] ? HJOB[jk].nm.replace(' 이웃', '') + ' 일 도구 보기' : '일 도구 보기')) }]);
    return { S: S9, W, D, H, seats, extra: ex, cam: { d: 3.8, p: 0.6 }, spz: 2.6, st, show: put9, mess, slots, asks, who, jk, find: fnd, owner: [ox + abx, oy, oz + abz], items: inn ? ['이불 · 작은 탁자', who + '(이름 없음)'] : ['거실 소파 · TV · 러그', '부엌 싱크대 · 냉장고 · 식탁', who + '(이름 없음 · 하는 일로)'].concat(slots.map(s => s[0])) }; }

  // ───────── 바깥(town.js) 연결 ─────────
  function opts(B9) { const { nm, k } = info(B9), C = CATS[k], en9 = en(); if (!C) return {}; const id = String(B9.b && B9.b.id || '') + ':' + Math.round(B9.cx) + ',' + Math.round(B9.cz);
    const set = made => { CUR = { k, C, id, nm: name(B9), made, task: null, mis: 0, at: null, B9 }; log('in ' + k); return made; };
    if (C.st === 'store') { const S9 = A.shopOf(nm); return { name: nm, room: (at, K) => { const r = K.shopRoom(at, S9[1], nm); if (r.counter) r.counter.label = en9 ? '🛒 Counter (buy · help stock shelves)' : '🛒 계산대 (사기 · 진열 돕기)'; CUR = null; const m = set(r); CUR.at = at; CUR.sub = S9[1]; return m; }, onShop: () => storeMenu(B9), onBake: /빵|제과/.test(nm) ? () => A.bake() : null, onExtra: kk => use(kk) }; }
    const home = C.st === 'home' || C.st === 'apt', plan = home ? { ...planFor(id), id } : null;   /* ENTER-3 오늘의 부탁 = 방을 짓기 전에 정함(그 부탁 소품까지 같이 지음) */
    const R9 = C.st === 'diner' ? roomDiner : C.st === 'class' ? roomClass : C.st === 'office' || C.st === 'term' ? roomOffice : C.st === 'ware' ? roomWare : C.st === 'hall' ? roomHall : C.st === 'home' || C.st === 'apt' || C.st === 'inn' ? (a, K9, C9, n9, B) => roomHome(a, K9, C9, n9, B, C.st, plan) : roomShop;
    return { name: name(B9), room: (at, K) => { const m = R9(at, K, C, name(B9), B9), late = K.parts(() => {}); m.S.extra = (m.S.extra || []).concat([late]); set(m); CUR.at = at; CUR.K = K; CUR.late = late; CUR.plan = plan; CUR.reg = reg5(B9); CUR.jk = m.jk || null; greet(); return m; }, onExtra: kk => use(kk) }; }   /* late = 끝날 때 한 번 짓는 결과(계산대 봉투·그릇·싱싱한 화분) — 나가면 town_indoor exit가 같이 치움 */
  function greet() { if (!CUR) return; if (CUR.C.st === 'class' && A.acad && !A.acad().inClass() && CUR.made.owner) { const o9 = CUR.made.owner, t9 = A.acad().hourLine(); setTimeout(() => { if (CUR && CUR.made.owner === o9) A.bubble({ x: o9[0], y: o9[1], z: o9[2], sc: 1 }, t9); }, 900); return; }   /* ACAD-1 수업 시간 밖 = 한 줄 */
    const r = S().b[CUR.id], P9 = CUR.plan, o = CUR.made.owner, e = en(); if (!o) return; let t = null;   /* ENTER-3 집 = 오늘 한 일 · 그 집만의 일 · 지난번 일 기억 · 처음 = 오늘 부탁 */
    if (P9) t = r && r.dd === day() ? (e ? 'Thanks again for today!' : '오늘 와 줘서 고마웠어요.') : P9.ev ? (HEV[P9.ev][3].match(/^[^.!?]*[.!?]/) || [HEV[P9.ev][3]])[0] : r && r.n > 0 && r.lk ? (HMEM[r.lk] || '또 왔네요!') : '어서 와요! ' + (HINTRO[P9.kind] || '');
    else if (r && r.n > 0) t = e ? 'You came back! Thanks for last time.' : '또 왔네요! 지난번에 고마웠어요.';
    if (t) { log('greet ' + t.slice(0, 40)); setTimeout(() => { if (CUR && CUR.made.owner === o) A.bubble({ x: o[0], y: o[1], z: o[2], sc: 1 }, t); }, 900); } }
  function use(kk) { if (!CUR || A.panelOpen()) return; log('use ' + kk);
    if (kk === 'ent:ask') return ask(); if (kk === 'ent:acad') return acad(); if (kk === 'ent:board') return A.board(); if (kk === 'ent:map') return A.openMap();
    if (/^ent:s\d$/.test(kk)) return slotE(+kk.slice(5)); if (/^ent:f\d$/.test(kk)) return findE(+kk.slice(5)); if (kk === 'ent:j') return jobLook(); }
  function jobLook() { const J = HJOB[CUR.jk]; if (!J) return; const L9 = [J.pc[2], J.task.learn], t = L9[(day() + hashS(CUR.id)) % 2]; sayOwner(t); toast('🧰 ' + t, 3); log('job look'); }   /* 일 구석 = 그 일 사실 두 갈래(날마다 번갈아) */
  const slotsOf = () => CUR.made.slots || CUR.C.slots, asksOf = () => CUR.made.asks || CUR.C.asks;
  const sayOwner = t => { const o = CUR.made.owner; if (o) A.bubble({ x: o[0], y: o[1], z: o[2], sc: 1 }, t); };
  const who = () => CUR.made.who || CUR.C.owner;
  function pick(L9, key, extra) { const c = cRec(CUR.k), D = day(), b = bRec(CUR.id), seed = hashS(CUR.id + ':' + D + ':' + b.t + ':' + (extra || '')); const ok = L9.map((q, i) => i).filter(i => !c.last.includes(key(i))); const pool = ok.length ? ok : L9.map((q, i) => i); return pool[seed % pool.length]; }
  function ask() { const C = CUR.C, e = en(); if (CUR.task) return showTask();
    if (CUR.plan) return askHome();
    const X9 = contentOf(CUR.k, CUR.B9 ? info(CUR.B9).nm : CUR.nm); if (X9 && X9.f !== 'walk') { const c = cRec(CUR.k), two = !!(CUR.C.slots && CUR.C.asks && CUR.made.st), form = !two ? 'frame' : c.lf ? (c.lf === 'frame' ? 'walk' : 'frame') : (hashS(CUR.id + ':' + day()) % 2 ? 'frame' : 'walk'); c.lf = form; mark(); log('form ' + form); if (form === 'frame') return askFrame(X9); }   /* 교사 11-07 '건물별로 다 다를 필요는 없어 · 지금보다 다양성 있게' — 한 갈래에 판 꼴 둘(그 갈래 판단 판 · 걸어서 칸 찾기)을 번갈아 */
    return askWalk(); }
  function askWalk() { const C = CUR.C, e = en();
    if (C.st === 'diner') { const T = CUR.made.T, c = cRec(CUR.k), hard = c.n >= 3, ti = pick(T, i => 't' + i), t = T[ti], dish = C.menu[(hashS(CUR.id + day() + bRec(CUR.id).t) % C.menu.length)];
      const where = (hard ? (t.back ? '문에서 먼 ' : '문 쪽 ') : '') + (t.win ? '창가에 ' : '안쪽에 ') + (t.n === 1 ? '혼자 앉은 손님' : '둘이 앉은 손님');
      CUR.task = { slot: ti, t: dish[0] + ' — ' + where, dish }; if (hard) CUR.task.t = dish[0] + ' — ' + where; showTask(); return; }
    const L9 = asksOf(), c = cRec(CUR.k), tier = c.n >= 3 ? 2 : 1, cand = L9.map((q, i) => i).filter(i => L9[i][2] <= tier); let ai = pick(cand, i => 'a' + cand[i]); ai = cand[ai];
    CUR.task = { slot: L9[ai][1], ai, t: L9[ai][0] }; if (CUR.made.mess) { CUR.made.mess.forEach(g => { g.visible = false; }); CUR.made.mess[CUR.task.slot].visible = true; }
    showTask(); }
  // ENTER-3 판단 틀 판(가게·식당·사무실·창고)
  function askFrame(X9) { const C = CUR.C, c = cRec(CUR.k), b = bRec(CUR.id), din = C.st === 'diner';
    PLAY.open({ C: X9, ttl: CUR.nm, ic: C.ic, who: din ? '주문 쪽지' : '손님', seed: CUR.id + ':' + day() + ':' + b.t, tier: c.n >= 3 ? 2 : 1, last: c.l || [], sea: sea(), onDone: res => frameDone(res, X9), onBtn: () => sellMenu() });
    sayOwner(din ? (en() ? 'Could you take this order?' : '이 주문 좀 맡아 줄래요?') : X9.f === 'read' ? (en() ? 'Could you read this for the customer?' : '손님한테 이것 좀 읽어 줄래요?') : (en() ? 'Could you help this customer?' : '이 손님 좀 도와줄래요?')); log('frame ' + X9.f); }
  const keep = keys => { const c = cRec(CUR.k); c.l = (c.l || []).concat(keys || []).slice(-8); };
  function lateAdd(fn) { if (!CUR || !CUR.K || !CUR.late) return null; const g = CUR.K.parts(put => fn(partE(put, CUR.at))); CUR.late.add(g); return g; }
  function lateClear() { if (!CUR || !CUR.late) return; for (const g of CUR.late.children.slice()) { CUR.late.remove(g); g.traverse(m => { if (m.geometry) m.geometry.dispose(); }); } }
  function credit(o) { const C = CUR.C, b = bRec(CUR.id), c = cRec(CUR.k), first = b.t === 0, s9 = S(); b.t++; b.n++; c.n++; (s9.ck = s9.ck || {})[CUR.k] = 1; mark(); if (first) A.skUp(C.sk || 'work', 2, 'ent:' + CUR.k); A.rec && A.rec('ent', { k: CUR.k, mis: o.mis | 0, f: o.f || 'walk' }); return { first, t: b.t }; }   /* 솜씨 = 예전 그대로(꼬리표 ent:<갈래> · 건물마다 그날 처음) */
  function frameDone(res, X9) { const C = CUR.C, e = en(), din = C.st === 'diner'; keep(res.keys);
    if (din) { const T = CUR.made.T, c = cRec(CUR.k), hard = c.n >= 3, ti = pick(T, i => 't' + i), t = T[ti], d9 = res.out[0] || [C.menu[0][0], '', [], '', C.menu[0][1]], where = (hard ? (t.back ? '문에서 먼 ' : '문 쪽 ') : '') + (t.win ? '창가에 ' : '안쪽에 ') + (t.n === 1 ? '혼자 앉은 손님' : '둘이 앉은 손님');
      CUR.task = { slot: ti, t: d9[0] + ' — ' + where, dish: [d9[0], d9[4]], col: d9[4] }; log('task ' + CUR.task.t); return { say: (e ? 'Kitchen: ' : '주방: "') + d9[0] + ' 나왔어요! ' + where + '에게 가져다줘요."', sub: (e ? 'To do: ' : '할 일: ') + '탁자 번호판을 보며 그 손님 탁자를 찾아가 E를 눌러요.' }; }
    if (X9.walk && res.slot != null) { CUR.task = { slot: res.slot, t: (res.slot + 1) + '번 타는 곳으로 안내', via: 1 }; log('task ' + CUR.task.t); return { say: '손님: "고마워요! ' + (res.slot + 1) + '번 타는 곳까지 같이 가 줄래요?"', sub: (e ? 'To do: ' : '할 일: ') + (res.slot + 1) + '번 타는 곳 판 앞에 가서 E를 눌러요.' }; }
    lateClear(); if (CUR.made.cnt) { const [x, y, z] = CUR.made.cnt, it = res.out[0], col = it ? it[4] : X9.res ? X9.res[1] : 0xd9b27a; lateAdd(E2 => { E2('b', x, y, z, 0.3, 0.32, 0.2, 0xd9b27a); E2('b', x, y + 0.32, z, 0.3, 0.025, 0.2, 0xc8a070); shape(E2, (X9.res || ['box'])[0], x, y + 0.345, z, col, 0, 0.8); }); }   /* 계산대 위 봉투 + 그 물건 */
    if (C.st === 'ware' || C.st === 'office' || C.st === 'term') (CUR.made.show || []).forEach(g => { g.visible = true; });   /* 창고 = 선반 칸마다 상자 · 사무실 = 판마다 초록 표 */
    const cr = credit(res); sfx('ding'); const thx = it0 => (e ? 'Thank you!' : '고마워요! ' + (it0 ? it0[0] + ', 딱 그거예요.' : '덕분에 잘 됐어요.'));
    sayOwner(thx(res.out[0])); return { say: who() + ': "' + thx(res.out[0]) + '"', sub: (X9.learn ? X9.learn + ' ' : '') + (e ? '' : '오늘 여기서 ' + cr.t + '번째예요.'), btn: CUR.C.want && sellable().length ? (e ? '🧺 Sell from my bag' : '🧺 가방 물건 팔기') : '' }; }   /* 가방 팔기(want) = 판단 판 차례에도 끝 창에서 */
  // ENTER-3 집: 오늘의 부탁(하루 한 집 한 부탁)
  function askHome() { const P9 = CUR.plan, b = bRec(CUR.id), e = en();
    if (b.dd === day()) { sayOwner(e ? 'That was plenty for today. Come again tomorrow!' : '오늘은 이걸로 충분해요. 내일 또 와요!'); toast('🏠 ' + (e ? 'Done here today. Try another neighbour’s house.' : '오늘 이 집 부탁은 끝났어요. 다른 이웃 집에도 가 봐요.'), 3); return; }
    if (P9.kind === 'tidy') return askWalk();
    if (P9.kind === 'find') { const F9 = CUR.made.find; if (!F9) return askWalk(); CUR.task = { find: 1, spot: F9.at, t: F9.obj[0] + josa(F9.obj[0], '을', '를') + ' 어디 뒀더라… ' + F9.zone + '에서 본 것 같아요.' }; showTask(); return; }
    const X9 = homeSpec(P9.kind, CUR.jk, CUR.reg, sea()); if (!X9) return askWalk();
    PLAY.open({ C: X9, ttl: CUR.nm, ic: P9.ev ? HEV[P9.ev][0] : '🏠', who: who(), seed: CUR.id + ':' + day(), tier: (b.n | 0) >= 3 ? 2 : 1, last: [], sea: sea(), onDone: res => homeFrameDone(P9.kind, res, X9) }); log('home ' + P9.kind); }
  function homeFinish(kind, o) { const b = bRec(CUR.id), s9 = S(), P9 = CUR.plan; b.dd = day(); b.lk = kind; const cr = credit(o); (s9.hv = s9.hv || {})[hk(CUR.id)] = 1; s9.pc = s9.pc || {};   /* 답례 = 그 일 엽서(처음) → 아니면 그 일에서 나는 작은 것(꼬리표 ent:gift · 하루 넷) · 알림 = 실제로 들어온 것만 */
    const pcId = P9 && P9.ev ? 'e:' + P9.ev : 'j:' + CUR.jk, PC9 = PCARDS.find(q => q[0] === pcId); let got = '';
    if (PC9 && !s9.pc[pcId]) { s9.pc[pcId] = day(); got = en() ? 'a postcard “' + PC9[2] + '”' : '엽서 「' + PC9[2] + '」를 받았어요(엽서 ' + Object.keys(s9.pc).length + '/' + PCARDS.length + ')'; }
    else { const g9 = (HJOB[CUR.jk] || {}).gift; if (g9) { A.GAME.add(g9, 1, 'ent:gift'); if (A.GAME.lastN > 0) { const n9 = A.itemName(g9); got = en() ? n9 : g9 + ' ' + n9 + josa(n9, '을', '를') + ' 받았어요'; } } }
    mark(); const hv = Object.keys(s9.hv).length; log('home done ' + kind);
    return { got, line: en() ? 'Homes helped: ' + hv + '.' : '도운 집은 ' + hv + '곳이에요.', cr }; }   /* FIX-4D: 분모(집 566채) X — PHASE2 '% 지우기'(모음은 숫자 하나) */
  const HDONE = { tidy: '정리를 마쳤어요.', cook: '음식을 다 만들었어요.', water: '화분에 물을 줬어요.', fix: '고장 난 것을 고쳤어요.', table: '상을 차렸어요.', job: '이웃 일을 도왔어요.', find: '잃어버린 것을 찾았어요.', bday: '생일 준비를 마쳤어요.', move: '이삿짐을 나눴어요.', guest: '손님상을 차렸어요.' };
  const homeToast = (kind, R9) => toast('✅ ' + (en() ? 'Done. ' : HDONE[kind] + ' ') + R9.line + (R9.got ? (en() ? ' Thank-you gift: ' + R9.got + '.' : ' 답례로 ' + R9.got + '.') : ''), 3.6);
  function homeRes(kind, X9, res) { const hd = CUR.made.D / 2, hw = CUR.made.W / 2;   /* 부탁마다 방 안에 남는 결과 */
    lateAdd(E2 => { switch (kind) {
      case 'cook': case 'bday': (X9.dish || []).forEach((d, i) => { const x = 2.1 + i * 0.55, z = -0.55; E2('c', x, 0.74, z, 0.11, 0.06, 0.11, 0xffffff); E2('c', x, 0.8, z, 0.095, 0.012, 0.095, d[1]); }); break;
      case 'water': for (const x of [-0.7, 0, 0.7]) { E2('c', x, 0.233, -hd + 0.45, 0.121, 0.006, 0.121, 0x5a3a22); for (let i = 0; i < 3; i++) E2('s', x + Math.cos(i * 2.1) * 0.06, 0.36 + i * 0.03, -hd + 0.45 + Math.sin(i * 2.1) * 0.06, 0.07, 0.05, 0.07, 0x4e9a43); } shape(E2, 'bowl', 1.1, 0, -hd + 0.55, 0x3d74c9, 0, 1); break;
      case 'fix': { const rs = (res && res.rs && res.rs[res.rs.length - 1]) || ['box', 0x3a3d42]; if (rs[2]) E2('s', 2.0, 0.83, -0.6, 0.06, 0.07, 0.06, rs[1], 0, 0, 1); else shape(E2, rs[0], 2.0, 0.745, -0.6, rs[1], 0.3, 1.2); break; }
      case 'table': case 'guest': { const z0 = kind === 'guest' ? -0.6 : -0.2, f = kind === 'guest' ? -1 : 1; E2('c', 2.4 - 0.22 * f, 0.74, z0, 0.06, 0.05, 0.06, 0xffffff); E2('c', 2.4 + 0.02 * f, 0.74, z0, 0.065, 0.045, 0.065, 0x8a5a34); E2('b', 2.4 + 0.2 * f, 0.745, z0, 0.012, 0.008, 0.18, 0xc0c4c8); E2('b', 2.4 + 0.24 * f, 0.745, z0, 0.01, 0.008, 0.2, 0x8a5a34); for (const dx of [-0.12, 0.12]) E2('c', 2.4 + dx, 0.74, z0 - 0.2 * f, 0.05, 0.02, 0.05, dx < 0 ? 0x5aa84c : 0xd8452a); if (kind === 'guest') E2('c', 2.4, 0.74, -0.4, 0.09, 0.07, 0.09, 0xc8332b); break; }
      case 'job': shape(E2, 'crate', hw - 0.35, 0.76, 1.6, 0x4e9a43, Math.PI / 2, 0.7); break;
      case 'move': shape(E2, 'bowl', 2.2, 0.94, -hd + 0.35, 0xf6f4ee, 0, 1); shape(E2, 'book', 2.6, 0.745, -0.62, 0x3d74c9, 1.2, 1); break;
      case 'find': { const o = CUR.made.find.obj; shape(E2, o[2], 2.0, 0.745, -0.62, o[3], 0.3, 1.4); break; }
    } }); }
  function homeFrameDone(kind, res, X9) { const e = en(); homeRes(kind, X9, res); const R9 = homeFinish(kind, res); sfx('ding'); const t = (e ? 'Thank you! ' : '고마워요! ') + (HTHANK[kind] || '');
    sayOwner(t); homeToast(kind, R9);
    return { say: who() + ': "' + t + '"', sub: (X9.learn ? X9.learn + ' ' : '') + (R9.got ? (e ? 'Thank-you gift: ' + R9.got + '.' : '답례로 ' + R9.got + '.') : '') }; }
  function findE(i) { const e = en(), t = CUR.task, F9 = CUR.made.find; if (!t || !t.find || !F9) { toast('🔎 ' + (e ? 'Nothing special here.' : '여기엔 별것 없어요.'), 2); return; }
    if (i !== t.spot) { CUR.mis++; sfx('tick'); toast('🤔 ' + (e ? 'Not here.' : '여기는 없어요. ' + F9.zone + josa(F9.zone, '이라고', '라고') + ' 했지요?'), 2.6); log('find miss ' + i); return; }
    if (F9.g) F9.g.visible = false; CUR.task = null; homeRes('find', {}, null); const R9 = homeFinish('find', { mis: CUR.mis, f: 'find' }); CUR.mis = 0; sfx('ding'); const tt = (e ? 'You found it! ' : '찾았다! ') + HTHANK.find;
    sayOwner(tt); homeToast('find', R9); }
  function showTask() { const e = en(), C = CUR.C, home = !!CUR.made.mess, din = C.st === 'diner';
    if (CUR.task && CUR.task.find) { const P = A.openP('<h3>🔎 ' + esc(CUR.nm) + '</h3><div class="sm">' + esc(e ? 'To do: go where the neighbour says and press E to look.' : '할 일: 이웃이 말한 곳에 가서 E를 눌러 살펴봐요.') + '</div><div class="bd-sit">' + esc(who() + ': "' + CUR.task.t + '"') + '</div><div class="row"><button data-a="go" data-def="1">' + (e ? 'OK' : '찾으러 가요') + '</button></div>', false, 'enttask'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; sayOwner(e ? 'Could you look for it?' : '같이 좀 찾아 줄래요?'); log('task find'); return; }
    if (CUR.task && CUR.task.via) { const P = A.openP('<h3>' + (C.ic || '🚌') + ' ' + esc(CUR.nm) + '</h3><div class="sm">' + esc((e ? 'To do: ' : '할 일: ') + CUR.task.t + ' — 그 판 앞에서 E를 눌러요.') + '</div><div class="row"><button data-a="go" data-def="1">' + (e ? 'OK' : '안내하러 가요') + '</button></div>', false, 'enttask'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; return; }
    const how = din ? (e ? 'Find the table on the order slip and press E there.' : '할 일: 쪽지에 적힌 손님 탁자를 찾아 E를 눌러요.') : home ? (e ? 'Find where this thing belongs and press E there.' : '할 일: 바닥에 놓인 것의 제자리를 찾아 E를 눌러요.') : C.st === 'office' || C.st === 'term' ? (e ? 'Find the board that fits and press E there.' : '할 일: 손님 바람에 맞는 판을 찾아 E를 눌러요.') : (e ? 'Find the shelf that has it and press E there.' : '할 일: 손님이 찾는 것이 있는 칸을 찾아 E를 눌러요.');
    const said = din ? (e ? 'Order slip: ' : '주문 쪽지: ') + CUR.task.t : (home ? who() : C.st === 'ware' || C.st === 'office' || C.st === 'term' ? (e ? 'Customer' : '손님') : (e ? 'Customer' : '손님')) + ': "' + CUR.task.t + '"';
    const P = A.openP('<h3>' + (C.ic || '🙋') + ' ' + esc(CUR.nm) + '</h3><div class="sm">' + esc(how) + '</div><div class="bd-sit">' + esc(said) + '</div>' + (CUR.C.want && !din ? sellRow() : '') + '<div class="row"><button data-a="go">' + (e ? 'OK, I’ll find it' : '찾으러 가요') + '</button></div>', false, 'enttask');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'sell') { A.closeP(); sellMenu(); return; } A.closeP(); };
    sayOwner(din ? (e ? 'Table order — off you go!' : '이 주문 좀 날라 줄래요?') : home ? (e ? 'Could you help me tidy up?' : '정리 좀 도와줄래요?') : (e ? 'Could you help this customer?' : '이 손님 좀 도와줄래요?')); log('task ' + CUR.task.t); }
  function slotE(i) { const e = en(), C = CUR.C, sl = (slotsOf() || [])[i], din = C.st === 'diner';
    if (!CUR.task) { if (din) { const t = CUR.made.T[i]; toast('🍽 ' + (i + 1) + (e ? ' table' : '번 탁자 — ') + (t.win ? '창가 · ' : '안쪽 · ') + (t.n === 1 ? '혼자 앉은 손님' : '둘이 앉은 손님'), 2.6); return; } if (sl) toast('🔎 ' + sl[0] + ' — ' + sl[4], 2.8); return; }
    if (CUR.task.find) { toast('🔎 ' + (e ? 'Look where the neighbour said.' : '이웃이 말한 곳을 찾아봐요.'), 2.2); return; }
    if (i === CUR.task.slot) return done(i);
    CUR.mis++; sfx('tick'); const nm = din ? (i + 1) + '번 탁자' : sl ? sl[0] : '';
    sayOwner(din ? (e ? 'Not that table — check the window side and how many people.' : '그 탁자가 아니에요. 창가인지, 몇 명인지 다시 봐요.') : (e ? 'Hmm, that is ' + nm + '. Listen again.' : '음, 거기는 ' + nm + josa(nm, '이에요', '예요') + '. 손님 말을 다시 들어 봐요.'));
    toast('🤔 ' + (e ? 'Not here — think again' : nm + josa(nm, '은', '는') + ' 아니에요. 다시 생각해 봐요.'), 2.4); log('miss ' + i); }
  function done(i) { const e = en(), C = CUR.C, b = bRec(CUR.id), c = cRec(CUR.k), t = CUR.task; sfx('ding');
    const sh = CUR.made.show || []; if (CUR.made.mess) { CUR.made.mess[i].visible = false; if (sh[i]) sh[i].visible = true; } else if (C.st === 'diner' && t && t.col != null && CUR.made.T) { const T9 = CUR.made.T[i]; lateAdd(E2 => { for (const dz of [-0.2, 0.2].slice(0, T9.n)) shape(E2, 'plate', T9.x, 0.75, T9.z + dz, t.col, 0, 1); }); } else if (C.st === 'diner' || C.st === 'office' || C.st === 'term' || C.st === 'ware') { if (sh[i]) sh[i].visible = true; } else { sh.forEach((g, j) => { g.visible = j === i; }); }   /* ENTER-3 식당 = 고른 음식 색 접시(손님 수만큼) */
    if (CUR.plan && CUR.made.mess) { CUR.task = null; const R9 = homeFinish('tidy', { mis: CUR.mis, f: 'walk' }); CUR.mis = 0; sayOwner(en() ? 'Thank you! The house is tidy.' : '고마워요! ' + HTHANK.tidy); homeToast('tidy', R9); log('done ' + i); return; }
    const key = C.st === 'diner' ? 't' + i : 'a' + t.ai; c.last.push(key); while (c.last.length > 2) c.last.shift(); credit({ mis: CUR.mis, f: t && t.via ? 'read' : C.st === 'diner' ? 'tray' : 'walk' }); CUR.task = null; CUR.mis = 0;
    sayOwner(e ? 'Thank you! That’s it.' : C.st === 'diner' ? '고마워요! 손님이 좋아해요.' : CUR.made.mess ? '고마워요! 집이 깔끔해졌어요.' : '고마워요! 딱 그거예요.');
    toast('✅ ' + (e ? 'Done! (' + b.t + ' today here)' : (C.st === 'diner' ? '주문을 날랐어요' : CUR.made.mess ? '제자리에 놓았어요' : '찾아 줬어요') + '. 오늘 여기서 ' + b.t + '번째예요') + (c.n === 3 ? (e ? '. Harder requests from now' : '. 이제 조금 어려운 부탁도 와요') : ''), 3); log('done ' + i); }
  // 학원 수업(ACAD-1 · town_acad.js): 선생님 E = 수업 한 판(오후 2~7시) 또는 자습(그 밖) · 단계를 마치면 칠판 별(여기 show) · 들른 수는 '또 왔네요' 인사에
  const ACAD_SUBS = { study: ['study', 'science'] }, acadLast = {};   /* 공부방 = 한 선생님이 독서·논술과 과학·코딩(이 마을엔 과학·코딩 간판 건물이 없어 공부방에서 엶) */
  function acad() { const k = CUR.k, made = CUR.made, id = CUR.id, subs = ACAD_SUBS[k] || [k]; if (!A.acad) return;
    A.acad().open(acadLast[k] || k, { subs, pick: k2 => { acadLast[k] = k2; }, say: t => sayOwner(t), stars: (n, k2) => { ((made.acadStars || {})[k2 || k] || []).forEach((g, i) => { g.visible = i < n; }); }, done: () => { const b = bRec(id); b.t++; b.n++; cRec(k).n++; mark(); } }); log('acad ' + k); }
  // 이미 있는 가게 방: 계산대 = 사기 · 진열 돕기
  function storeMenu(B9) { const e = en(), P = A.openP('<h3>🛒 ' + esc(CUR ? CUR.nm : '') + '</h3><div class="sm">' + esc(e ? 'Clerk: "Welcome! What would you like to do?"' : '점원: "어서 오세요! 무엇을 할까요?"') + '</div><div class="bd-two"><button data-a="buy">🛒 ' + (e ? 'Buy' : '물건 사기') + '</button><button data-a="sort">📦 ' + (e ? 'Help stock shelves' : '진열 돕기') + '</button></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'entstore');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'buy') A.shop(B9); else if (b.dataset.a === 'sort') sortMenu(); }; }
  function sortMenu() { if (!CUR) return; const e = en(), T = SORT[CUR.sub] || SORT.grocery, zones = T[0], b = bRec(CUR.id), seed = hashS(CUR.id + ':' + day() + ':' + b.t), L9 = T[1].map((q, i) => [hashS(seed + ':' + i), q]).sort((a, c) => a[0] - c[0]).slice(0, 3).map(q => q[1]); let st = 0, mis = 0;
    const draw = m => st >= 3 ? '<h3>📦 ' + (e ? 'Shelves stocked' : '진열 끝') + '</h3><div class="pc-tx">' + esc(e ? 'Clerk: "Thanks! Now customers can find things easily."' : '점원: "고마워요! 이제 손님들이 쉽게 찾겠어요."') + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '좋아요') + '</button></div>'
      : '<h3>📦 ' + (e ? 'Help stock shelves' : '진열 돕기') + ' ' + (st + 1) + '/3</h3><div class="sm">' + esc(e ? 'Which shelf does it go on?' : '할 일: 이 물건을 어느 칸에 둘까요?') + '</div><div class="bd-sit">' + esc(L9[st][0]) + '</div><div class="bd-ch">' + zones.map((z, i) => '<button class="sub" data-z="' + i + '">' + esc(z) + '</button>').join('') + '</div><div class="sm" data-m>' + esc(m || '') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P = A.openP(draw(), false, 'entsort'), paint = m => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(m); };
    P.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.a === 'x') { A.closeP(); return; } if (bt.dataset.z == null) return; const z = +bt.dataset.z, q = L9[st];
      if (z === q[1]) { sfx('pop'); st++; if (st === 3) { const first = b.t === 0; b.t++; b.n++; cRec(CUR.k).n++; mark(); if (first) A.skUp('trade', 2, 'ent:store'); log('sort done'); } paint(st < 3 ? (e ? 'Right! ' : '맞아요! ') + q[2] : ''); return; }
      mis++; sfx('tick'); paint((e ? 'Not there: ' : '거기는 아니에요. ') + q[2]); }; log('sort'); }
  // 가방에서 사 주기(그 가게가 쓰는 것만 · 기본 값 · 장터보다 낮음 · 가게에서 산 것 X)
  const sellable = () => (CUR.C.want || []).filter(em => A.own(em) > 0);
  function sellRow() { const L9 = sellable(), e = en(); return L9.length ? '<div class="sm">' + esc(e ? 'This shop also buys some things from your bag.' : '이 가게는 가방에 있는 ' + L9.map(em => A.itemName(em)).join(' · ') + '도 사 줘요.') + '</div><div class="row"><button class="sub" data-a="sell">🧺 ' + (e ? 'Sell from bag' : '가방 물건 팔기') + '</button></div>' : ''; }
  function sellMenu() { const e = en(), draw = m => { const L9 = sellable(); return '<h3>🧺 ' + esc(CUR.nm) + (e ? ' buys' : ' — 가방 물건 팔기') + '</h3><div class="sm">' + esc(e ? 'Shop price (markets often pay more).' : '가게 값이에요. 장터에서는 더 받을 때가 많아요.') + '</div>' + (L9.length ? '<div class="bd-ch">' + L9.map(em => '<button class="sub" data-e="' + em + '">' + em + ' ' + esc(A.itemName(em)) + ' ×' + A.own(em) + ' — ' + A.won(A.price(em)) + '</button>').join('') + '</div>' : '<div class="sm">' + esc(e ? 'Nothing this shop buys.' : '이 가게가 사는 물건이 이제 없어요.') + '</div>') + '<div class="sm" data-m>' + esc(m || '') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>'; };
    const P = A.openP(draw(), false, 'entsell'), paint = m => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(m); };
    P.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.a === 'x') { A.closeP(); return; } const em = bt.dataset.e; if (!em || A.own(em) < 1) return; const v = A.price(em); if (!A.sell(em, v)) return; sfx('ding'); log('sell ' + em); paint((e ? 'Sold for ' : '팔았어요: ') + A.won(v)); }; }
  // ENTER-3 모음(가방 🏅): 도운 집 n곳 · 도운 가게·일터 n갈래(분모 X · FIX-4D) · 엽서 14
  function colHtml() { PLAY.css && PLAY.css(); const s9 = S(), e = en(), hv = Object.keys(s9.hv || {}).length, ckT = Object.keys(CATS).filter(k => !['home', 'apt', 'store', 'class'].includes(CATS[k].st)), ck = ckT.filter(k => (s9.ck || {})[k]).length, pc = s9.pc || {};
    return '<div class="grp" data-b3grp="ent">' + (e ? 'Neighbours' : '이웃 집·가게') + '</div><div class="e3-col"><div><b>🏠 ' + (e ? 'Homes helped ' : '도운 집 ') + hv + (e ? '' : '곳') + '</b></div><div><b>🏪 ' + (e ? 'Kinds of shops and workplaces ' : '도운 가게·일터 ') + ck + (e ? '' : '갈래') + '</b></div></div>'
      + '<div class="e3-pcs">' + PCARDS.map(p => pc[p[0]] ? '<div class="pc" title="' + esc(p[3]) + '"><i>' + p[1] + '</i><b>' + esc(p[2]) + '</b><small>' + esc(p[3]) + '</small></div>' : '<div class="pc no"><i>✉</i><b>?</b><small>' + esc(PC_WHERE[p[0]] || '') + (e ? '' : '에서 받아요') + '</small></div>').join('') + '</div>'; }
  function left() { if (!CUR) return; CUR = null; PLAY.close(); }   /* 방 모양·숨긴 결과(S9.extra)는 town_indoor exit()가 치움 */
  return { tip, canIn, opts, left, name, hoursOf, catOf, use,
    info: () => CUR ? { k: CUR.k, id: CUR.id, nm: CUR.nm, owner: CUR.made.owner || null, task: CUR.task ? { ...CUR.task } : null, extra: (CUR.made.extra || []).map(h => ({ k: h.k, label: h.label, at: CUR.at ? [CUR.at[0] + h.stand[0], CUR.at[1] + h.stand[1], CUR.at[2] + h.stand[2]] : null })), shown: (CUR.made.show || []).map(g => !!g.visible), mess: (CUR.made.mess || []).map(g => !!g.visible), T: CUR.made.T || null, plan: CUR.plan ? { kind: CUR.plan.kind, ev: CUR.plan.ev || null } : null, jk: CUR.jk || null, reg: CUR.reg || null, find: CUR.made.find ? { at: CUR.made.find.at, zone: CUR.made.find.zone, obj: CUR.made.find.obj[0] } : null, late: CUR.late ? CUR.late.children.length : 0, f: (contentOf(CUR.k, CUR.B9 ? info(CUR.B9).nm : '') || {}).f || null, items: CUR.made.items || [] } : null,
    s: () => S(), dbg: () => DBG.slice(), play: PLAY, colHtml, contentOf,
    frames: () => Object.keys(CATS).filter(k => !['home', 'apt', 'store', 'class'].includes(CATS[k].st)).map(k => { const X = CONTENT[k]; return [k, CATS[k].st, Array.isArray(X) ? X.map(q => q.f).join('|') : (contentOf(k, '') || {}).f || (CATS[k].st === 'hall' ? 'board' : 'walk')]; }) };
}
