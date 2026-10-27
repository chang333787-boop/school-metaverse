// 🏢 빈 건물에 할 일(BLDG-1 · 코덱스 10-24 표 13줄 '기존 놀이·창구를 역할이 맞는 건물 2~3곳에 연결' · 사용자 10-24 '빈 건물이 생각보다 많아')
//   경찰서 👮 = 112 신고 연습(긴급 출동 119 신고 창과 같은 번호판 꼴 · 상황 셋 + 위치 말하기) · 길 잃은 아이를 도운 뒤 들어가면 경찰관이 고맙다는 말 → 칭찬 게시판에 붙음
//   병원·보건소·보건실 🩹 = 응급 처치 배우기(긴급 출동 119 처치에서 쓴 것 그대로 · 문제 셋) · 넘어진 이웃을 도운 뒤 들어가면 나은 이웃이 기다리는 의자에 있음(E = 인사)
//   동물보호센터 🥣 = 하루 한 번 밥 주기(강아지·고양이 그릇에 알맞은 사료 고르기 → 그릇이 차고 강아지가 반김)
//   눈에 보이는 결과: 칭찬 게시판·응급 처치 판 글이 바뀜(캔버스 한 장) · 밥그릇이 참 · 나은 이웃의 몸
//   지킴: 판타지 X · 전투 X · 실명 X(경찰관·간호사·동물보호사·이웃 = 이름 없는 역할 · 몸 있음) · 피 X · 보상 = 솜씨만(꼬리표 bldg:<곳> → rwCheck 한 문 · 하루 한 번)
//   은행 🏦 = 저금하기(BANK-1 · 코덱스 표 11줄 '창구·센터·은행·우체국') — 지갑 돈을 통장에 넣고 꺼냄(옮김 · 돈이 늘지 않음) · 7일마다 이자 한 줄(아주 작게 · 문 bldg:bankint) · 벽 '내 통장' 판에 줄이 적힘 · 09:00~16:00
//   우체국 📦 = 소포 보내기(town_indoor.js 우체국 방에 E 하나를 더함 · deco) — 가방 물건 하나 → 받을 이웃(이름 없는 일꾼 역할) → 지도 보고 주소 칸 고르기 → 소포 값 → 다음 날 그 이웃 곁에 가면 고맙다는 말풍선 + 하트 · 창구 09:00~18:00
//   BLDG-3(사용자 10-24 차례 '빈 건물·직업 나머지'): 들어가도 할 일이 없던 곳 넷에 창 하나 + 보이는 결과 하나(새 놀이 엔진 X)
//     영화관 🎬 = 상영 시간표 읽기(집에서 온 쪽지 '몇 시까지' → 끝나는 시각을 견줘 고름 · 셈 X) → 표(500원) → 자리 '다4' 찾기(옆벽 줄 글자 + 의자 번호 = 지도 칸 주소와 같은 꼴) → 화면에 영화 · 다 보면 시계가 끝나는 시각으로
//     공장 🏭 = 만드는 차례 견학(일 다섯을 1번 자리부터 차례로 → 분업 물음 하나) → 줄 끝 깔판에 오늘 만든 상자 · 젤리 케이크 공장 = 젤리 케이크 · 다른 공장 = 밭에서 온 농산물 포장(✨ 아이 카드에 물건이 없어서)
//     노인정·경로당 👵 = 어르신께 옛 땅이름 듣기(배다리·역말·숯골·새터 = 전국에 흔한 땅이름의 뜻 · 이 마을 역사로 지어 쓰지 않음) + '돌다리' 낱말 뜻 · 벽 '땅이름 이야기' 판 · 탁자 E = 어르신과 우물고누(town_table.js)
//     박물관 🏺 = 옛 물건 넷(맷돌·다듬잇돌·지게·호롱) 쓰임 → 오늘날 무엇이 그 일을 하나 · 알아본 받침대에 금빛 표 · 곤충 박물관은 들어가지 않음(쇼가 따로 있음)
//   렉: 매 프레임 일 0 · 새 Light X · 방은 들어갈 때만 지음(town_indoor.js KIT) · 판 = 캔버스 한 장(나오면 버림) · 밥 = 합친 부품 1
export const BD_V = 1;
import { CINE, filmDraw, filmLen, filmMusic } from './town_cine.js?v=2';   /* CINE-3 영화관 짧은 영화 */
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// 건물 이름 → 방 갈래(town.js pubIn이 부름 · 동물병원은 보호센터 동물만 쓰는 곳이라 들어가지 않음)
export const bldgKind = nm => { const t = String(nm || ''); if (/경찰|파출소|지구대/.test(t)) return 'police'; if (/은행/.test(t)) return 'bank'; if (/동물보호|보호 ?센터/.test(t)) return 'shelter'; if (/동물/.test(t)) return null; if (/병원|의원|보건소|보건실|진료소/.test(t)) return 'clinic'; if (/영화관/.test(t)) return 'cinema'; if (/곤충/.test(t)) return null; if (/박물관/.test(t)) return 'museum'; if (/공장/.test(t)) return 'factory'; if (/노인정|경로당/.test(t)) return 'elder'; return null; };   /* BLDG-3 · 마을회관은 이야기 도착 자리 · 주민 회의 설계(town_buildings.md T1)라 아직 X */
// 문 연 때(docs/systems/town_hours.md) — 경찰서 = 늘(24시간)
export const BD_HRS = { police: null, clinic: [9, 18], shelter: [10, 17], bank: [9, 16], cinema: [10, 21], factory: [9, 18], elder: [9, 18], museum: [9, 18] };   /* BLDG-3 영화관 = 첫 상영 10:00 · 마지막 19:00 상영 · 공장·노인정·박물관 = 낮 */
export const BD_KINDS = ['police', 'clinic', 'shelter', 'bank', 'post', 'cinema', 'factory', 'elder', 'museum'];   /* 문 이름표·J 검색에 할 일을 붙이는 갈래(town.js bldTip) */
export const POST_HRS = [9, 18];   /* 우체국 창구(방은 집배원 체험 자리라 늘 들어감 · 창구 E만 시간을 봄) */
const TIP = { police: T2('112 신고 연습', '112 call practice'), clinic: T2('응급 처치 배우기', 'Learn first aid'), shelter: T2('동물 밥 주기', 'Feed the animals'), bank: T2('저금하기', 'Save money'), post: T2('소포 보내기', 'Send a parcel'), cinema: T2('상영 시간표 보고 영화 보기', 'Read the timetable and see a film'), factory: T2('만드는 차례 견학', 'See how things are made'), elder: T2('옛 땅이름 듣기', 'Hear old place names'), museum: T2('옛 물건 알아보기', 'Find out about old things') };
const PARCEL = 500, SENDK = ['food', 'treat', 'goods', 'wild'];   /* 소포 값(엽서 우표 200원보다 조금 비쌈) · 보낼 수 있는 물건 갈래(도장·도구·요리 X) */
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const CSS = `.twn-p .bd-pad{display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center;margin:8px 0}.twn-p .bd-pad button{min-height:52px;font-size:22px;padding:0}
.twn-p .bd-num{font:900 28px/1.2 ui-monospace,Menlo,monospace;text-align:center;letter-spacing:6px;min-height:36px;border:3px solid var(--ink,#2b2420);border-radius:10px;background:#fff;margin:4px auto;width:200px}
.twn-p .bd-ch{display:grid;gap:8px;margin:6px 0}.twn-p .bd-ch button{min-height:48px;font-size:15px;text-align:left}
.twn-p .bd-sit{background:#fff8dc;border:2px solid #b07a00;border-radius:12px;padding:8px 12px;margin:6px 0;font-size:16px;line-height:1.5}
.twn-p .bd-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:15px;line-height:1.5}
.twn-p .bd-bar{display:grid;grid-template-columns:76px 1fr auto;gap:8px;align-items:center;margin:4px 0;font-size:15px}.twn-p .bd-bar i{display:block;height:18px;border:2px solid var(--ink,#2b2420);border-radius:4px;min-width:2px}
.twn-p .bd-pb{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0;background:#fff}.twn-p .bd-pb td,.twn-p .bd-pb th{border:1px solid #c9b27a;padding:3px 6px;text-align:right}.twn-p .bd-pb td:first-child,.twn-p .bd-pb th:first-child,.twn-p .bd-pb td:nth-child(2){text-align:left}
.twn-p .bd-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}.twn-p .bd-two button{min-height:48px;font-size:15px}
.twn-p canvas.bd-map{display:block;width:100%;max-width:340px;margin:6px auto;border-radius:8px;cursor:pointer}
.twn-p .bd-cmp{display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin:6px 0}.twn-p .bd-cmp button{min-height:44px;font-size:15px;padding:0}.twn-p .bd-cmp i{display:flex;align-items:center;justify-content:center;font:900 13px/1 sans-serif;color:#8a8f99;font-style:normal}
.twn-p .bd-wl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0}.twn-p .bd-wl button{min-height:86px;padding:6px 4px;font-size:14px;line-height:1.3}.twn-p .bd-wl b{display:block;width:54px;height:32px;margin:0 auto 6px;border:2px solid #2b2420;border-radius:6px}
.twn-p .bd-env{background:#fffdf5;border:2px solid #c9b27a;border-radius:6px;padding:10px 14px;margin:6px 0;font-size:15px;line-height:1.7;position:relative}.twn-p .bd-env .wet{filter:blur(3px);color:#6a7c94;background:#c9d6e6;border-radius:6px}
.twn-p .bd-ph{max-width:260px;margin:6px auto;background:#1c2128;border-radius:18px;padding:12px}.twn-p .bd-ph div{background:#f2f4f7;border-radius:10px;padding:8px 10px;font-size:14px;line-height:1.5}.twn-p .bd-ph small{display:block;color:#c0c6cc;margin-bottom:6px}
.twn-p canvas.bd-bill{display:block;width:100%;max-width:320px;margin:6px auto}.twn-p .bd-rule{font-size:13px;background:#eef6f1;border:2px solid #2f6d5a;border-radius:8px;padding:6px 10px;margin:6px 0}`;

// 112 연습 상황(실제 신고 번호 규칙만 · 무섭게 쓰지 않음)
const SIT = [
  [112, T2('시장에서 어린 동생이 엄마를 잃어버리고 울고 있어요.', 'At the market a little child has lost their mum and is crying.')],
  [119, T2('이웃이 계단에서 넘어져 발목을 다쳤어요. 일어나지 못해요.', 'A neighbour fell on the stairs and hurt an ankle. They cannot get up.')],
  [119, T2('옆집 창문에서 검은 연기가 나와요.', 'Black smoke is coming out of the window next door.')],
  [112, T2('학교 앞에 세워 둔 자전거가 없어졌어요.', 'The bike I left in front of school is gone.')],
  [112, T2('큰길 신호등이 꺼져서 차들이 엉켜 있어요.', 'The traffic lights on the main road are off and cars are stuck.')],
  [119, T2('더운 날 할머니가 길가에 주저앉아 어지럽다고 해요.', 'On a hot day a grandma sat down by the road and says she is dizzy.')],
];
const WHERE = [[1, T2('어디인지(칸 이름 · 가까운 건물)', 'Where it is (the cell · a building nearby)')], [0, T2('내가 좋아하는 음식', 'My favourite food')], [0, T2('오늘 날씨', 'Today’s weather')]];
// 응급 처치 문제(긴급 출동 119 처치 글과 같은 내용)
const AID = [
  [T2('발목을 삐었어요. 다친 발은 어떻게 할까요?', 'An ankle is twisted. What do we do with the hurt foot?'), [T2('움직이지 않고 차갑게 대요', 'Keep it still and cool it'), T2('세게 주물러 풀어요', 'Rub it hard'), T2('걸으면서 풀어요', 'Walk it off')], T2('다친 곳은 움직이면 더 아파요. 차갑게 대면 붓기가 덜해요.', 'Moving it hurts more. Cooling it keeps the swelling down.')],
  [T2('차갑게 댄 다음에는 다친 발을 어떻게 둘까요?', 'After cooling it, where should the hurt foot go?'), [T2('가방 같은 것으로 받쳐 높이 올려요', 'Prop it up high, on a bag for example'), T2('뜨거운 물에 담가요', 'Put it in hot water'), T2('바닥에 끌고 다녀요', 'Drag it along the floor')], T2('다친 곳을 심장보다 높이 두면 덜 부어요.', 'Raising it above the heart keeps the swelling down.')],
  [T2('더위를 먹고 어지러워해요. 먼저 어디로 옮길까요?', 'Someone is dizzy from the heat. Where do we move them first?'), [T2('시원한 그늘로', 'Into cool shade'), T2('햇볕이 드는 곳으로', 'Into the sunshine'), T2('달려서 집까지', 'Run all the way home')], T2('더위를 먹으면 몸을 먼저 식혀야 해요.', 'With heat sickness the body must cool down first.')],
  [T2('더위 먹은 이웃이 정신이 또렷해요. 무엇을 줄까요?', 'The neighbour with heat sickness is fully awake. What do we give?'), [T2('시원한 물', 'Cool water'), T2('뜨거운 국', 'Hot soup'), T2('아무것도 주지 않아요', 'Nothing at all')], T2('정신이 또렷하면 물을 조금씩 마시게 해요. 정신이 흐리면 아무것도 먹이지 않고 119를 기다려요.', 'If they are fully awake, give sips of water. If not, give nothing and wait for 119.')],
];
const FOOD = [T2('강아지 사료', 'Dog food'), T2('고양이 사료', 'Cat food'), T2('초콜릿 과자', 'Chocolate biscuits')];
const WORDS = {
  police: [[T2('신고', 'Report'), T2('도움이 필요한 일을 경찰서·소방서 같은 곳에 알리는 것', 'Telling the police or fire station about something that needs help')]],
  clinic: [[T2('응급 처치', 'First aid'), T2('구급대원이 오기 전에 다친 사람을 먼저 돌보는 것', 'Caring for a hurt person before the paramedics arrive')]],
  shelter: [[T2('입양', 'Adoption'), T2('보호하던 동물을 새 가족이 맞아 기르는 것', 'When a new family takes home an animal that was in care')]],
  bank: [[T2('저축', 'Saving'), T2('돈을 바로 쓰지 않고 모아 두는 것', 'Keeping money instead of spending it straight away')], [T2('이자', 'Interest'), T2('돈을 맡긴 값으로 은행이 조금 더 얹어 주는 돈', 'A little extra money the bank adds for keeping your money')]],
  cinema: [[T2('상영', 'Screening'), T2('영화를 큰 화면에 비추어 보여 주는 것', 'Showing a film on a big screen')], [T2('시간표', 'Timetable'), T2('일이 시작하고 끝나는 때를 차례로 적은 표', 'A table of when things start and end')]],
  factory: [[T2('분업', 'Division of labour'), T2('일을 여러 사람이 나누어 맡아 하는 것', 'Sharing out the steps of a job among many people')], [T2('원료', 'Raw material'), T2('물건을 만드는 데 쓰는 바탕 재료', 'The basic stuff a product is made from')]],
  elder: [[T2('지명', 'Place name'), T2('땅이나 마을의 이름', 'The name of a piece of land or a village')], [T2('유래', 'Origin'), T2('어떤 이름이나 일이 생겨난 까닭', 'How a name or a thing came to be')]],
  museum: [[T2('유물', 'Relic'), T2('옛사람들이 남긴 물건', 'Things left by people long ago')], [T2('전시', 'Exhibition'), T2('여러 사람이 보도록 물건을 늘어놓아 보여 주는 것', 'Setting things out for many people to see')]],
  post: [[T2('주소', 'Address'), T2('받는 사람이 사는 곳·일하는 곳을 적은 글', 'Words that say where the person lives or works')], [T2('우편', 'Post'), T2('편지·소포를 받는 곳까지 날라 주는 일', 'Carrying letters and parcels to where they need to go')]],
};

// ───────── BLDG-3 자료 ─────────
// 🎬 영화(이름 없는 작은 영화 · 실제 영화·회사 X · 장면 글 = 사실만) · 상영 = [영화, 시작(분), 끝(분)] — 같은 영화는 늘 같은 길이(80·100·100분)
//   CINE-3(10-27): 영화 = town_cine.js 움직이는 짧은 영화(40~50초 · 카메라가 움직이는 장면 · 마디 박자 음악) · 여기는 제목·포스터 색만
const FILMS = CINE.map(f => ({ t: f.t, bg: f.bg }));
const SHOWS = [[0, 600, 680], [1, 690, 790], [2, 780, 880], [0, 870, 950], [1, 960, 1060], [2, 1050, 1150], [0, 1140, 1220]];
export const BD_SHOWS = SHOWS.map(q => ({ s: q[1], e: q[2], t: FILMS[q[0]].t }));   /* DAY-2 오늘 시간표 줄(town_day.js)이 읽음 */
const TICKET = 500, ROWS = ['가', '나', '다', '라', '마'], ROWZ = [-4.5, -3.2, -1.9, -0.6, 0.7], COLX = c => -2.5 + (c - 1);   /* 영화 표 값(소포와 같은 결) · 줄 가(화면 앞)~마 · 번호 1~6 */
const hm = m => String((m / 60) | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
// 🏭 만드는 차례(일 다섯 · 1번 자리부터) — [일, 까닭(틀리게 고르면)]
const LINES = {
  jelly: { p: T2('젤리 케이크', 'jelly cake'), ic: '🍰', st: [T2('밀가루·달걀·우유 섞기', 'Mix flour, eggs and milk'), T2('틀에 붓고 굽기', 'Pour into tins and bake'), T2('딸기 젤리 얹기', 'Put strawberry jelly on top'), T2('모양·무게 검사하기', 'Check shape and weight'), T2('상자에 담기', 'Pack into boxes')] },
  farm: { p: T2('밭에서 온 감자', 'potatoes from the fields'), ic: '🥔', st: [T2('흙 씻어 내기', 'Wash off the soil'), T2('크기·흠 고르기', 'Sort by size and marks'), T2('무게 달기', 'Weigh'), T2('상자에 담기', 'Pack into boxes'), T2('트럭에 싣기', 'Load onto the truck')] },
};
// 🚚 BLDG-3b 만든 다음 날 가게·장터에 들어오는 것(생산 → 유통 → 소비) · 값 = 그 가게 보통 값(젤리 케이크 = 빵집 빵 값 · 감자 = 산지 가게처럼 파는 값의 두 배 → 사서 되팔면 손해) · 셋까지
export const FAC_GOOD = { jelly: { e: '🍰', v: 1200 }, farm: { e: '🥔', v: 300 } }, FAC_N = 3;
const WHY_DIV = [[1, T2('같은 시간에 더 많이, 고르게 만들 수 있어요', 'More can be made in the same time, and more evenly')], [0, T2('일하는 사람이 필요 없어져요', 'No workers are needed any more')], [0, T2('만든 물건이 저절로 가게에 가요', 'The products go to the shops by themselves')]];
// 👵 옛 땅이름(전국에 흔한 이름의 뜻 · 이 마을의 역사로 쓰지 않음) — [이름, 맞는 뜻, 틀린 뜻 둘]
const OLDN = [
  [T2('배다리', 'Baedari'), T2('배를 나란히 이어 그 위로 건너던 다리가 있던 곳', 'A place with a bridge made of boats tied side by side'), [T2('배를 만들던 큰 공장', 'A big boat factory'), T2('배 모양으로 생긴 산', 'A hill shaped like a boat')], T2('「배」와 「다리」로 떼어 보렴.', 'Split it into “boat” and “bridge”.')],
  [T2('역말', 'Yeongmal'), T2('옛날 나랏일로 오가는 사람이 말을 갈아타던 역이 있던 마을', 'A village with an old post station where riders changed horses'), [T2('기차역 앞에 선 시장', 'A market outside a railway station'), T2('말을 많이 기르던 목장', 'A ranch with many horses')], T2('「역」은 기차가 생기기 훨씬 전에도 있었단다. 「말」은 마을이라는 뜻이야.', 'There were “stations” long before trains. “Mal” means village.')],
  [T2('숯골', 'Sutgol'), T2('숯을 굽던 골짜기 마을', 'A valley village where charcoal was made'), [T2('물이 아주 맑은 골짜기', 'A valley with very clear water'), T2('눈이 많이 오는 골짜기', 'A valley with lots of snow')], T2('「숯」과 「골(골짜기)」로 떼어 보렴.', 'Split it into “charcoal” and “valley”.')],
  [T2('새터', 'Saeteo'), T2('사람들이 새로 모여 마을을 이룬 터', 'A spot where people came and made a new village'), [T2('새가 많이 모이는 숲', 'A wood where many birds gather'), T2('새 학교가 선 자리', 'Where a new school was built')], T2('「새」는 새롭다는 뜻, 「터」는 자리라는 뜻이란다.', '“Sae” means new, “teo” means site.')],
];
const OUR_N = [T2('돌다리', 'Doldari (stone bridge)'), T2('돌을 놓아 건너게 만든 다리', 'A crossing made of stones'), [T2('돌을 캐던 산', 'A hill where stone was dug'), T2('돌처럼 단단한 다리', 'A bridge as hard as stone')], T2('「돌」과 「다리」로 떼어 보렴. 물을 건너는 것이 다리란다.', 'Split it into “stone” and “bridge”. A bridge takes you over water.')];
// 🏺 옛 물건 — [이름, 쓰임(맞음), 틀림 둘, 오늘날(맞음), 틀림 둘, 한 줄]
const MUSE = [
  [T2('맷돌', 'Millstone'), T2('곡식을 갈아서 가루로 만들었어요', 'Ground grain into flour'), [T2('물을 길어 날랐어요', 'Carried water'), T2('옷을 꿰맸어요', 'Sewed clothes')], T2('믹서기·방앗간 기계', 'A blender or a mill machine'), [T2('냉장고', 'A fridge'), T2('텔레비전', 'A TV')], T2('위 돌 구멍에 곡식을 넣고 손잡이를 돌리면 두 돌 사이에서 갈려요.', 'Put grain in the hole of the top stone and turn the handle; it is ground between the stones.')],
  [T2('다듬잇돌과 방망이', 'Ironing stone and bats'), T2('빨래한 옷감을 두드려 구김을 펴고 부드럽게 했어요', 'Beat washed cloth to smooth out creases'), [T2('곡식을 갈았어요', 'Ground grain'), T2('밤에 불을 밝혔어요', 'Gave light at night')], T2('다리미', 'An iron'), [T2('전기밥솥', 'A rice cooker'), T2('자전거', 'A bicycle')], T2('방망이로 옷감을 두드리는 소리를 다듬이 소리라고 했어요.', 'The sound of beating cloth with the bats was called dadeumi sound.')],
  [T2('지게', 'A-frame carrier'), T2('무거운 짐을 등에 지고 날랐어요', 'Carried heavy loads on the back'), [T2('물고기를 잡았어요', 'Caught fish'), T2('곡식을 갈았어요', 'Ground grain')], T2('수레·트럭', 'A cart or a truck'), [T2('라디오', 'A radio'), T2('전등', 'A lamp')], T2('나무로 짠 틀에 짐을 얹고 두 어깨끈으로 졌어요.', 'The load sat on a wooden frame carried with two shoulder straps.')],
  [T2('호롱', 'Oil lamp'), T2('기름을 넣고 심지에 불을 붙여 밤을 밝혔어요', 'Burned oil on a wick to light the night'), [T2('물을 끓였어요', 'Boiled water'), T2('짐을 날랐어요', 'Carried loads')], T2('전등', 'An electric light'), [T2('선풍기', 'A fan'), T2('다리미', 'An iron')], T2('전기가 들어오기 전에는 호롱불이나 촛불로 방을 밝혔어요.', 'Before electricity, rooms were lit with oil lamps or candles.')],
];
const MUX = [-3.6, -1.2, 1.2, 3.6], MUZ = -1.4;   /* 박물관 받침대 자리 */

// ───────── DEPTH-1 창구 손님(깊이 표 ③ 대상 · 사용자 10-25 '열 번째에도 다르게') ─────────
//   판마다 다른 사람이 찾아옴(이름 없는 역할 · 몸 있음): 경찰서 = 길 묻는 관광객·잃은 지갑·자전거 등록 · 병원 = 넘어진 아이 보호자·벌에 쏘인 이웃·더위 먹은 할아버지 보호자
//     은행 = 찢어진 돈을 가져온 어린이·통장 잃은 어르신·이상한 문자를 받은 이웃 · 우체국 = 주소가 틀린 편지·비에 젖은 편지·소포 싸기 · 박물관 = 생김새·오늘날·쓰임으로 묻는 손님
//   같은 갈래도 사정(v)이 달라 답이 바뀜(벌 쏘임 = 침이 보이면 긁어 빼기 · 숨이 차면 119) → 답을 외워 풀 수 없음 · 판단 = 그 창 안에서 본 것(지도·봉투·지폐·가져온 것·받침대)
//   고르기 = 날짜 씨앗 + 어제 손님과 다른 갈래 + 최근 두 손님과 다른 손님 · 틀리면 벌·점수 X — 손님이 까닭을 들어 되물음 + 10분이 지남 · 보상 = 그 건물 하루 한 번 문(reward) 그대로
export const VTYPE = { police: ['tour', 'wallet', 'bike'], clinic: ['kid', 'bee', 'heat'], bank: ['bill', 'lost', 'sms'], post: ['addr', 'wet', 'pack'], museum: ['shape', 'today', 'use'] };
const VNUM = { tour: 3, wallet: 4, bike: 3, kid: 2, bee: 3, heat: 2, bill: 3, lost: 2, sms: 3, addr: 3, wet: 2, pack: 3, shape: 4, today: 4, use: 4 };   /* 갈래마다 사정 수 */
const VAT = { police: [1.7, -1.75], clinic: [-0.9, -1.85], bank: [1.75, -1.8], post: [0.4, 0.4], museum: [2.6, 2.0] };   /* 손님이 서는 자리(로컬 · 방 쪽을 봄) · E = 그 앞 0.85m */
const VWHO = { tour: T2('길 묻는 관광객', 'A tourist asking the way'), wallet: T2('지갑을 잃은 손님', 'Someone who lost a wallet'), bike: T2('자전거 등록하러 온 어린이', 'A child registering a bike'),
  kid: T2('넘어진 아이와 보호자', 'A parent with a child who fell'), bee: T2('벌에 쏘인 이웃', 'A neighbour stung by a bee'), heat: T2('할아버지를 모시고 온 보호자', 'Someone who brought their grandpa'),
  bill: T2('찢어진 돈을 가져온 어린이', 'A child with a torn banknote'), lost: T2('통장을 잃은 어르신', 'An elder who lost a bankbook'), sms: T2('이상한 문자를 받은 이웃', 'A neighbour with a strange text'),
  addr: T2('잘못 온 편지를 가져온 이웃', 'A neighbour with a misdelivered letter'), wet: T2('비에 젖은 편지를 가져온 집배원', 'A mail carrier with a rain-soaked letter'), pack: T2('소포를 싸러 온 손님', 'Someone wrapping a parcel'),
  shape: T2('다른 나라에서 온 손님', 'A visitor from another country'), today: T2('손주와 온 할아버지', 'A grandpa with his grandchild'), use: T2('견학 온 어린이', 'A child on a school visit') };
/* 몸 모양: [손님 꼴(k%3 = 0 → 어린이 키), 흰머리, 지팡이, 배낭, 곁에 선 어린이 꼴(-1 = 없음), 의자에 앉은 사람 꼴(-1 = 없음)] */
const VLOOK = { tour: [2, 0, 0, 1, -1, -1], wallet: [5, 0, 0, 0, -1, -1], bike: [3, 0, 0, 0, -1, -1], kid: [4, 0, 0, 0, 0, -1], bee: [7, 0, 0, 0, -1, -1], heat: [5, 0, 0, 0, -1, 1],
  bill: [9, 0, 0, 0, -1, -1], lost: [4, 1, 1, 0, -1, -1], sms: [8, 0, 0, 0, -1, -1], addr: [2, 0, 0, 0, -1, -1], wet: [1, 0, 0, 1, -1, -1], pack: [6, 0, 0, 0, -1, -1], shape: [7, 0, 0, 1, -1, -1], today: [1, 1, 1, 0, 3, -1], use: [3, 0, 0, 1, -1, -1] };
const DIR8K = [T2('북', 'north'), T2('북동', 'north-east'), T2('동', 'east'), T2('남동', 'south-east'), T2('남', 'south'), T2('남서', 'south-west'), T2('서', 'west'), T2('북서', 'north-west')];
const WCOL = [[T2('빨간색', 'red'), '#d9473b'], [T2('파란색', 'blue'), '#3d74c9'], [T2('갈색', 'brown'), '#8a5a34'], [T2('초록색', 'green'), '#3c9a5a']];
const WIN = [T2('교통카드', 'a bus card'), T2('도서관 카드', 'a library card'), T2('집 열쇠', 'a house key'), T2('머리끈', 'a hair tie')];
const BEE = [T2('쏘인 곳에 까만 침이 박혀 보여요. 조금 부었어요. 숨은 편하게 쉬어요.', 'A black stinger is stuck in the skin. It is a little swollen. Breathing is easy.'),
  T2('침은 보이지 않아요. 쏘인 곳이 빨갛게 부었어요. 숨은 편하게 쉬어요.', 'No stinger can be seen. It is red and swollen. Breathing is easy.'),
  T2('숨쉬기가 힘들다고 해요. 입술과 얼굴이 부어올라요.', 'They say it is hard to breathe. The lips and face are swelling up.')];
const BEEC = [T2('카드처럼 납작한 것으로 침을 긁어 빼고 차갑게 대요', 'Scrape the stinger out with something flat like a card, then cool it'), T2('차가운 것을 대고 지켜봐요', 'Put something cold on it and keep watching'), T2('바로 119에 알려요', 'Call 119 straight away'), T2('손가락으로 침을 꽉 집어 빼요', 'Pinch the stinger out with fingers')];
const BEEW = [T2('침이 안 보이는데 긁으면 더 아프기만 할 것 같아요.', 'There is no stinger to see. Scraping would only hurt more.'), T2('숨쉬기가 너무 힘들대요. 차갑게 대는 것보다 더 급한 것 같아요.', 'It is so hard to breathe. This seems more urgent than cooling it.'), T2('숨은 편하게 쉬어요. 여기서 먼저 해 줄 수 있는 게 있지 않을까요?', 'Breathing is easy. Isn’t there something we can do here first?'), T2('손가락으로 꽉 집으면 침 속 독이 더 들어간대요.', 'Pinching it pushes more venom in, they say.')];
const MCLUE = { shape: [T2('둥근 돌 두 개가 포개져 있고, 위 돌에 구멍과 손잡이가 있었어요', 'two round stones on top of each other, with a hole and a handle on the top one'), T2('납작하고 긴 돌 위에 나무 방망이 두 개가 있었어요', 'a long flat stone with two wooden bats on it'), T2('나무로 짠 틀에 어깨끈 두 개가 달려 있었어요', 'a wooden frame with two shoulder straps'), T2('작은 그릇 위에 심지가 꽂혀 있었어요', 'a small bowl with a wick sticking out')],
  today: [T2('요즘 믹서기가 하는 일을 옛날에 하던 물건', 'the thing that did a blender’s job long ago'), T2('요즘 다리미가 하는 일을 옛날에 하던 물건', 'the thing that did an iron’s job long ago'), T2('요즘 수레나 트럭이 하는 일을 옛날에 하던 물건', 'the thing that did a cart’s or truck’s job long ago'), T2('요즘 전등이 하는 일을 옛날에 하던 물건', 'the thing that did an electric light’s job long ago')],
  use: [T2('곡식을 넣고 손잡이를 돌려 가루로 만든 물건', 'the thing you put grain in and turned by the handle to make flour'), T2('빨래한 옷감을 두드려 구김을 편 물건', 'the thing for beating washed cloth smooth'), T2('무거운 짐을 등에 지고 나른 물건', 'the thing for carrying heavy loads on your back'), T2('밤에 기름을 태워 방을 밝힌 물건', 'the thing that burned oil to light a room at night')] };

// 마을 쪽이 넘기는 것(A): GAME · T3 · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · sfx(k) · dialog(o) · bubble(o, t) · skUp(k, n, src) · rec(k, o) · open(h0, h1)
//   은행·우체국(BANK-1): money() · pay(v) · refund(v) · won(v) · bag() · items · itemName(e) · take(e) · nbs() · heartTo(hk, n, src) · me() · mapGrid(cv, pts) · parts(fn)
//   BLDG-3: addHot(h)(방 안 E 하나 더 · 나가면 같이 치움) · table(놀이, { who })(town_table.js 판 놀이 창) · 시계 = GAME.waitMin(분)
export function createBldg(A) {
  const T3 = A.T3, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark(), sfx = k => A.sfx(k), toast = (t, s) => A.say(t, s);
  const S = () => { const g = A.GAME.S; let s = g.bldg; if (!s || typeof s !== 'object' || s.v !== BD_V) s = g.bldg = { v: BD_V, police: {}, clinic: {}, shelter: {}, bank: {}, post: {} }; for (const k of BD_KINDS) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
  let css = null, CUR = null, DBG = [];
  if (!document.getElementById('bd-css')) { css = document.createElement('style'); css.id = 'bd-css'; css.textContent = CSS; document.head.appendChild(css); }
  const log = t => { DBG.push(t); if (DBG.length > 20) DBG.shift(); };
  const emLog = () => { const e = A.GAME.S.emerg; return e && Array.isArray(e.log) ? e.log : []; };
  const keyOf = q => q.k + ':' + q.d + ':' + q.x + ',' + q.z;
  const ago = n => en() ? (n === 1 ? 'yesterday' : n + ' days ago') : (n === 1 ? '어제' : n === 2 ? '그저께' : '사흘 전');
  // 도운 일 가운데 아직 인사를 못 받은 것(어제~사흘 전 · 오늘 일은 다음 날부터)
  const pending = (k, seen) => { const D = day(); return emLog().find(q => q && q.k === k && q.ok && q.d < D && D - q.d <= 3 && !(seen || []).includes(keyOf(q))) || null; };
  const helped = k => emLog().filter(q => q && q.k === k && q.ok).length;
  const open = k => { const H = BD_HRS[k]; return !H || A.open(H[0], H[1]); };
  const hh = h => String(h).padStart(2, '0') + ':00';
  const dayT = d => en() ? 'Day ' + d : d + '일째', kindT = k => k === 'in' ? (en() ? 'in' : '넣음') : k === 'out' ? (en() ? 'out' : '꺼냄') : (en() ? 'interest' : '이자');

  // ───────── 바깥(town.js) 연결 ─────────
  function tip(k) { return TIP[k] ? L(TIP[k]) : ''; }
  function canIn(k, B9) { if (!BD_HRS[k] || open(k)) return true; const nm = (B9 && B9.name) || '', H = BD_HRS[k]; toast('🌙 ' + (en() ? nm + ' is closed now. It opens at ' + hh(H[0]) + '.' : nm + '은 지금 문을 닫았어요. ' + hh(H[0]) + '에 열어요.'), 3); return false; }
  function opts(B9, k) { if (!TIP[k]) return {}; if (k === 'post') return { deco: (S9, made, X9) => postDeco(S9, made, B9, X9 && X9.K), onExtra: kk => use(kk) }; return { room: (at, K) => build(k, at, K, B9), onExtra: kk => use(kk) }; }
  function left() { if (A.why) A.why().roomLeft(); if (!CUR) return; if (CUR.play) filmStop(); if (CUR.board) { CUR.board.m.material.map.dispose(); CUR.board.m.material.dispose(); } CUR = null; }   /* 방 모양(geometry)은 town_indoor exit()이 치움 · 캔버스 재질만 여기서 */

  // ───────── 벽 판(캔버스 한 장 · 글이 바뀌면 다시 그림) ─────────
  function boardMesh(K, S9, x, y, z, ry, w, h) { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ map: tx })); m.position.set(S9.at[0] + x, S9.at[1] + y, S9.at[2] + z); m.rotation.y = ry; m.updateMatrix(); m.matrixAutoUpdate = false; m.userData.fx = 1; (S9.extra || (S9.extra = [])).push(m); return { m, c, tx }; }
  function boardDraw() { if (!CUR || !CUR.board) return; if (CUR.k === 'cinema') return screenDraw(); const { c, tx } = CUR.board, g = c.getContext('2d'), W = c.width, H = c.height, e = en(), k = CUR.k, s = S()[k], D = day();
    g.fillStyle = '#c8945a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(10, 10, W - 20, H - 20); g.fillStyle = '#2b2420'; g.textAlign = 'left'; g.textBaseline = 'top';
    const title = k === 'factory' ? (e ? 'Made today' : '오늘 만든 것') : k === 'elder' ? (e ? 'Place-name stories' : '땅이름 이야기') : k === 'museum' ? (e ? 'Old things I found out' : '내가 알아본 옛 물건') : k === 'police' ? (e ? 'Praise board' : '칭찬 게시판') : k === 'clinic' ? (e ? 'First aid board' : '응급 처치 판') : k === 'bank' ? (e ? 'My bankbook' : '내 통장') : (e ? 'Waiting for a new family' : '새 가족을 기다려요');
    g.font = '900 40px ' + FONT; g.fillText(title, 28, 24); const lines = [];
    if (k === 'police') { if (s.d112) lines.push(['★', e ? '112 helper: practised ' + (s.n112 | 0) + ' time(s)' : '112 어린이 도우미 · 연습 ' + (s.n112 | 0) + '번']); const n = helped('lost'); if (n) lines.push(['♥', e ? 'Helped ' + n + ' lost child(ren) find family' : '길 잃은 아이 ' + n + '명을 가족에게']); if ((s.thx || []).length) lines.push(['✉', e ? 'Thank-you notes from families: ' + s.thx.length : '아이 가족이 보낸 고맙다는 쪽지 ' + s.thx.length + '장']); if (!lines.length) lines.push(['·', e ? 'Practise 112 calls at the counter.' : '창구에서 112 신고를 연습해요.']); }
    else if (k === 'clinic') { if (s.dfa) { lines.push(['✓', e ? 'Twisted ankle: keep still, cool, raise' : '발목을 삐면: 움직이지 않기, 차갑게, 높이']); lines.push(['✓', e ? 'Heat sickness: shade, water, fan' : '더위를 먹으면: 그늘, 물, 부채질']); } const n = (s.hi || []).length; if (n) lines.push(['♥', e ? 'Neighbours who got better and said thanks: ' + n : '나아서 고맙다고 한 이웃 ' + n + '명']); if (!lines.length) lines.push(['·', e ? 'Learn first aid with the nurse.' : '간호사 선생님께 응급 처치를 배워요.']); }
    else if (k === 'bank') { const H9 = (s.hist || []).slice(-3); for (const r of H9) lines.push([r[1] === 'in' ? '+' : r[1] === 'out' ? '−' : '★', dayT(r[0]) + '  ' + kindT(r[1]) + ' ' + A.won(r[2]) + '  →  ' + A.won(r[3])]); lines.unshift(['■', (e ? 'In the bankbook: ' : '통장에 있는 돈: ') + A.won(s.bal | 0)]); if (!H9.length) lines.push(['·', e ? 'Save at the counter and a line is written here.' : '창구에서 저금하면 여기에 한 줄씩 적혀요.']); }
    else if (k === 'factory') { const LN = LINES[CUR.made.line] || LINES.farm; lines.push([s.made === D ? '✓' : '·', s.made === D ? (e ? 'Today: 8 boxes of ' + L(LN.p) : '오늘 만든 ' + L(LN.p) + ' 상자 8개') : (e ? 'The line is waiting for today' : '오늘 줄은 아직 쉬고 있어요')]); lines.push(['■', (e ? 'Steps: ' : '차례: ') + LN.st.map(t => L(t).split(' ')[0]).join(' → ')]); { const q = facDeliv(); if (q) lines.push(['🚚', e ? 'Boxes went to: ' + q.to : '상자가 간 곳: ' + q.to]); } if (s.n) lines.push(['★', e ? 'Visits: ' + s.n : '견학한 날 ' + s.n + '번']); }
    else if (k === 'elder') { const G9 = (s.got || []).slice(-4); for (const nm of G9) { const q = OLDN.concat([OUR_N]).find(o => L(o[0]).split(' ')[0] === nm); if (q) lines.push(['·', nm + ' = ' + L(q[1])]); } if (!G9.length) lines.push(['·', e ? 'Hear old place names from the elder.' : '어르신께 옛 땅이름을 들어요.']); }
    else if (k === 'museum') { const G9 = Object.keys(s.got || {}).map(Number).filter(i => MUSE[i]); lines.push(['■', (e ? 'Found out: ' : '알아본 것: ') + G9.length + '/' + MUSE.length]); for (const i of G9.slice(0, 3)) lines.push(['✓', L(MUSE[i][0]) + ' → ' + L(MUSE[i][3])]); }
    else { lines.push(['♥', e ? 'Dogs 3 and cats 2 are waiting' : '강아지 셋, 고양이 둘이 기다려요']); lines.push([s.fed === D ? '✓' : '·', s.fed === D ? (e ? 'Fed today. Thank you!' : '오늘 밥을 먹었어요. 고마워요!') : (e ? 'Not fed yet today' : '오늘 아직 밥을 못 먹었어요')]); if (s.n) lines.push(['★', e ? 'Meals you gave: ' + s.n : '내가 준 밥 ' + s.n + '번']); }
    g.font = '800 30px ' + FONT; lines.slice(0, 4).forEach(([ic, t], i) => { const y = 92 + i * 52; g.fillStyle = ic === '·' ? '#8a8f99' : '#b5483a'; g.fillText(ic, 30, y); g.fillStyle = '#2b2420'; let tt = t; while (g.measureText(tt).width > W - 110 && tt.length > 4) tt = tt.slice(0, -1); g.fillText(tt === t ? t : tt + '…', 68, y); });
    tx.needsUpdate = true; }

  // 🎬 화면(캔버스 512×216): 쉴 때 = 오늘 상영 시간표(지난 상영 = 흐리게 · 내 표 = 노랑) · 상영 때 = 영화 장면 글 + 단순한 그림
  const wrapT = (g, t, w) => { const out = []; let cur = ''; for (const ch of String(t)) { if (g.measureText(cur + ch).width > w && cur) { const sp = cur.lastIndexOf(' '); if (sp > 4) { out.push(cur.slice(0, sp)); cur = cur.slice(sp + 1) + ch; } else { out.push(cur); cur = ch; } } else cur += ch; } if (cur) out.push(cur); return out; };
  function screenDraw() { const { c, tx } = CUR.board, g = c.getContext('2d'), W = c.width, H = c.height, e = en(), s = S().cinema, D = day(), now = now9(); g.textBaseline = 'top';
    if (CUR.play) { CUR.play.si = filmDraw(g, W, H, CINE[CUR.play.f], CUR.play.T, e); CUR.play.n++; tx.needsUpdate = true; return; }   /* CINE-3 상영 = 움직이는 영화 한 장(0.033초마다) */
    g.fillStyle = '#15121c'; g.fillRect(0, 0, W, H); g.fillStyle = '#f2c230'; g.font = '900 24px ' + FONT; g.textAlign = 'center'; g.fillText(e ? 'Today’s timetable' : '오늘 상영 시간표', W / 2, 8); g.textAlign = 'left'; g.font = '800 18px ' + FONT;
    SHOWS.forEach((sh, i) => { const mine = s.tk && s.tk.d === D && s.tk.i === i, y = 42 + i * 24; g.fillStyle = mine ? '#f2c230' : sh[1] <= now ? '#6a6478' : '#f6f4ee'; g.fillText(hm(sh[1]) + ' ~ ' + hm(sh[2]) + '   ' + L(FILMS[sh[0]].t) + (mine ? '  🎫 ' + s.tk.seat : ''), 70, y); });
    tx.needsUpdate = true; }

  // ───────── 방 짓기(로컬 = 방 가운데 · 문 = 앞벽 +z · 뒤 = −z) ─────────
  const LP = (x, z, ry) => (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
  function dog(K, S9, x, z, y, ry, hex) { const Q = LP(x, z, ry), P = (k, lx, ly, lz, sx, sy, sz, c, rx) => { const [a, b] = Q(lx, lz); K.part(S9, k, a, y + ly, b, sx, sy, sz, c, 0, ry, rx || 0); }, dk = 0x2b2b2b;
    for (const [a, b] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) P('b', a, 0, b, 0.08, 0.26, 0.08, hex); P('b', 0, 0.24, 0, 0.3, 0.26, 0.66, hex); P('b', 0, 0.4, 0.36, 0.26, 0.26, 0.26, hex);
    P('b', 0, 0.42, 0.52, 0.13, 0.11, 0.1, hex); P('b', 0, 0.49, 0.575, 0.05, 0.04, 0.02, dk); for (const s9 of [-1, 1]) { P('b', s9 * 0.07, 0.55, 0.495, 0.035, 0.035, 0.02, dk); P('b', s9 * 0.1, 0.6, 0.33, 0.06, 0.12, 0.08, 0x6b4a2f); } P('b', 0, 0.42, -0.42, 0.05, 0.05, 0.2, hex, -0.6); }   /* 강아지(마을 마당 강아지와 같은 상자 꼴 · 귀 · 눈 · 꼬리) */
  function cat(K, S9, x, z, y, ry, hex) { const Q = LP(x, z, ry), P = (k, lx, ly, lz, sx, sy, sz, c, rx) => { const [a, b] = Q(lx, lz); K.part(S9, k, a, y + ly, b, sx, sy, sz, c, 0, ry, rx || 0); };
    for (const [a, b] of [[-0.07, 0.15], [0.07, 0.15], [-0.07, -0.15], [0.07, -0.15]]) P('b', a, 0, b, 0.06, 0.18, 0.06, hex); P('b', 0, 0.17, 0, 0.22, 0.19, 0.44, hex); P('b', 0, 0.28, 0.27, 0.2, 0.19, 0.18, hex);
    for (const s9 of [-1, 1]) { P('k', s9 * 0.06, 0.47, 0.27, 0.045, 0.09, 0, hex); P('b', s9 * 0.05, 0.4, 0.365, 0.03, 0.03, 0.02, 0x2b2b2b); } P('b', 0, 0.3, -0.25, 0.04, 0.3, 0.04, hex, -0.3); }   /* 고양이(뾰족 귀 · 선 꼬리) */
  const bowl = (K, S9, x, z, c) => K.part(S9, 'c16', x, 0.012, z, 0.13, 0.055, 0, c);

  function build(k, at, K, B9) { left(); const name = (B9 && B9.name) || '', made = k === 'police' ? roomPolice(at, K, name) : k === 'clinic' ? roomClinic(at, K, name) : k === 'bank' ? (bankInt(), roomBank(at, K, name)) : k === 'cinema' ? roomCinema(at, K, name) : k === 'factory' ? roomFactory(at, K, name) : k === 'elder' ? roomElder(at, K, name) : k === 'museum' ? roomMuseum(at, K, name) : roomShelter(at, K, name); CUR = { k, at, name, door: B9 && B9.door ? [+B9.door[0], +B9.door[1]] : null, made, board: made.board || null, food: made.food || null, prod: made.prod || null, stars: made.stars || null, play: null }; boardDraw(); visPlace(k, made, K); log('build ' + k); return made; }
  function roomPolice(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], navy = 0x2b3a5c;
    const S9 = K.shell(at, W, D, H, { wall: 0xf1f3f6, wains: navy, winY: [], noLights: true, ft: ['tile', 1.0, 0xe9edf2] }), P = S9.put; S9.ac = K.cs(navy);
    { const cx = -1.0, zc = -hd + 1.5; P('b', cx, 0, zc, 4.4, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 4.3, 0.5, 0.012, 0x3d5a8a); P('b', cx, 1.0, zc, 4.46, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 2.23, 0.33, -0.5, 1.1);   // 민원 창구 탁자
      P('b', cx + 1.3, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', cx + 1.3, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x7fb8e0, 1); P('b', cx - 1.2, 1.04, zc, 0.32, 0.02, 0.24, 0xffffff);   // 화면(빛) · 종이
      K.sign(S9, en() ? 'Help desk' : '민원 창구', cx, 0.42, zc + 0.33, 0, 1.4, 0.26, { bg: '#3d5a8a', fr: false }); K.standGuest(S9, ox + cx, oy, oz + zc - 0.7, 0, 1); P('c16', cx, 1.6, zc - 0.7, 0.17, 0.08, 0, navy); P('b', cx, 1.6, zc - 0.56, 0.2, 0.02, 0.1, 0x1c2638);   // 경찰관(이름 없음 · 모자)
      K.sign(S9, '112', cx, 2.45, -hd + 0.02, 0, 1.2, 0.6, { bg: '#2b3a5c', fr: 0xf6f4ee, fs: 1.2 }); }
    K.mainSign(S9, name, 2.9, 2.75, -hd + 0.02, 0, { bg: '#2b3a5c' });
    { const bz = -0.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }   // 칭찬 게시판 틀(글 = 캔버스)
    const board = boardMesh(K, S9, hw - 0.046, 1.67, -0.6, -Math.PI / 2, 2.4, 1.5);
    for (const z of [-0.2, 0.55, 1.3]) K.chair(S9, seats, -hw + 1.3, z, Math.PI / 2, 0x3d5a8a); K.stable(S9, -hw + 0.55, 2.2, 0.6, 0.6, 0xb07d4a, 0.5); K.plant(S9, -hw + 0.5, -hd + 0.5, 1);   // 기다리는 의자 · 낮은 탁자 · 화분
    K.sign(S9, en() ? 'Call 112 if someone is lost or in danger' : '길을 잃거나 위험할 때는 112', -hw + 0.02, 2.2, 0.55, Math.PI / 2, 2.6, 0.3, { bg: '#3d5a8a', fr: 0xf6f4ee });
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.3, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['민원 창구 · 경찰관(이름 없음)', '112 간판', '칭찬 게시판(112 연습 · 도운 일)', '기다리는 의자'], board, extra: [{ k: 'bd:112', stand: [-1.0, 0, -hd + 2.35], r: 1.3, label: '👮 ' + L(TIP.police) }, { k: 'bd:board', stand: [hw - 1.0, 0, -0.6], r: 1.2, label: '📋 ' + (en() ? 'Read the praise board' : '칭찬 게시판 보기') }], cam: { d: 3.8, p: 0.55 } }; }
  function roomClinic(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], teal = 0x3f9f8a;
    const S9 = K.shell(at, W, D, H, { wall: 0xf7faf9, wains: teal, winY: [], noLights: true, ft: ['tile', 1.0, 0xeef4f2] }), P = S9.put; S9.ac = K.cs(teal);
    { const cx = -2.6, zc = -hd + 1.4; P('b', cx, 0, zc, 3.0, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 2.9, 0.5, 0.012, teal); P('b', cx, 1.0, zc, 3.06, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 1.53, 0.33, -0.5, 1.1);   // 접수대
      P('b', cx + 0.8, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', cx + 0.8, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x9fe0c8, 1); K.sign(S9, en() ? 'Reception' : '접수', cx, 0.42, zc + 0.33, 0, 0.9, 0.26, { bg: K.cs(teal), fr: false });
      K.standGuest(S9, ox + cx, oy, oz + zc - 0.7, 0, 4); P('b', cx, 1.0, zc - 0.55, 0.36, 0.5, 0.02, 0xffffff); }   // 간호사(이름 없음 · 흰 앞치마)
    { const x0 = 0.8, x1 = hw - 0.2, zc = -hd + 1.0; P('b', (x0 + x1) / 2, 2.25, zc + 0.6, x1 - x0, 0.05, 0.05, 0xb8bec4); for (let i = 0; i < 6; i++) P('b', x0 + 0.3 + i * (x1 - x0 - 0.6) / 5, 0.12, zc + 0.6, 0.62, 2.1, 0.04, i % 2 ? 0xcfe8e0 : 0xbfe0d6); K.colL(S9, (x0 + x1) / 2, zc + 0.6, (x1 - x0) / 2, 0.06, -0.5, 2.3);   // 진료실 커튼
      K.sign(S9, en() ? 'Exam room' : '진료실', (x0 + x1) / 2, 2.6, -hd + 0.02, 0, 1.4, 0.36, { bg: K.cs(teal), fr: 0xf6f4ee }); }
    K.mainSign(S9, name, -2.6, 2.75, -hd + 0.02, 0, { bg: K.cs(teal) });
    { const x = -hw + 0.06; P('b', x, 0.9, -1.6, 0.04, 1.4, 0.24, 0xffffff); for (let i = 0; i < 8; i++) P('b', x + 0.025, 0.95 + i * 0.17, -1.6, 0.01, 0.015, i % 2 ? 0.1 : 0.18, 0x3f9f8a); K.sign(S9, en() ? 'Height' : '키 재기', -hw + 0.02, 2.5, -1.6, Math.PI / 2, 0.8, 0.24, { bg: K.cs(teal), fr: 0xf6f4ee }); }   // 키 재는 막대(눈금)
    { const x = -hw + 0.25; P('b', x, 0, 0.8, 0.4, 1.6, 1.4, 0xf2f2ee); for (const y of [0.5, 1.0, 1.5]) P('b', x + 0.06, y, 0.8, 0.3, 0.02, 1.3, 0xd8dce0); for (let i = 0; i < 9; i++) K.I(S9, 'b', x + 0.04, 0.52 + ((i / 3) | 0) * 0.5, 0.25 + (i % 3) * 0.5, 0.18, 0.12, 0.14, [0xffffff, 0xf2c230, 0x5aa6e0][i % 3]); K.colL(S9, x, 0.8, 0.21, 0.71, -0.5, 1.6); }   // 약 선반(약 상자)
    for (let i = 0; i < 4; i++) K.chair(S9, seats, -0.6 + i * 0.75, 0.0, Math.PI, 0x3f9f8a);   // 기다리는 의자 줄(접수대 쪽을 봄)
    { const bz = 1.7; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }
    const board = boardMesh(K, S9, hw - 0.046, 1.67, 1.7, -Math.PI / 2, 2.4, 1.5);
    const hi = pending('hurt', S().clinic.hi); let nb = null; if (hi) { const nx = 2.6, nz = 2.0; K.standGuest(S9, ox + nx, oy, oz + nz, Math.PI, 2); nb = { q: hi, at: [ox + nx, oy, oz + nz] }; }   // 나은 이웃(이름 없는 역할 · 기다리는 의자 곁에 섬)
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.3, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    const ex = [...(A.why ? [{ k: 'why:ht', stand: [-hw + 0.8, 0, -1.6], r: 0.9, label: '📏 ' + (en() ? 'Measure my height' : '키 재 보기') }] : []), { k: 'bd:aid', stand: [-2.6, 0, -hd + 2.25], r: 1.3, label: '🩹 ' + L(TIP.clinic) }, { k: 'bd:board', stand: [hw - 1.0, 0, 1.7], r: 1.1, label: '📋 ' + (en() ? 'Read the first aid board' : '응급 처치 판 보기') }];
    if (nb) ex.push({ k: 'bd:hi', stand: [2.6, 0, 1.2], r: 1.1, label: '🙂 ' + (en() ? 'Say hello to the neighbour who got better' : '나은 이웃에게 인사') });
    return { S: S9, W, D, H, seats, items: ['접수대 · 간호사(이름 없음)', '기다리는 의자 줄', '진료실 커튼', '키 재는 막대', '응급 처치 판', '약 선반'], board, nb, extra: ex, cam: { d: 3.8, p: 0.55 } }; }
  function roomShelter(at, K, name) { const W = 12, D = 10, H = 3.4, hw = W / 2, hd = D / 2, seats = [], grn = 0x5cbf73, [ox, oy, oz] = at;
    const S9 = K.shell(at, W, D, H, { wall: 0xf6f0e4, wains: grn, winY: [], noLights: true, ft: ['wood', 1.0, 0xf2e2c8] }), P = S9.put; S9.ac = K.cs(grn);
    const pens = [-2.7, 0, 2.7], z0 = -hd, z1 = -hd + 2.4, DOG = [0xc8a070, 0xf2ede0, 0x3a3a3a], bowls = [];   const WY = A.why ? A.why() : null;   /* WHY-1(town_why.js) 강아지·고양이 = 움직이는 몸(쓰다듬기·공·산책) — 없으면 예전 정적 몸 */
    for (let i = 0; i < 3; i++) { const cx = pens[i], x0 = cx - 1.35, x1 = cx + 1.35; P('b', cx, 0.006, (z0 + z1) / 2, 2.66, 0.02, 2.36, 0x9ccf7a);   // 칸 바닥 깔개
      P('b', cx, 0.62, z1, 2.7, 0.06, 0.06, 0xf6f4ee); P('b', cx, 0.3, z1 + 0.003, 2.7, 0.06, 0.05, 0xf6f4ee); for (let k = i ? 1 : 0; k <= 6; k++) P('b', x0 + k * 0.45, 0, z1, 0.05, 0.7, 0.05, 0xe9e5dc);   // 앞 울타리(문살 · 이웃 칸과 같은 기둥은 한 번만)
      for (const xs of [x0, x1]) { if (i && xs === x0) continue; P('b', xs, 0, (z0 + z1) / 2 - 0.03, 0.06, 0.66, 2.34, 0xe9e5dc); }   // 칸막이(위 = 울타리 위 가로대보다 낮게 · 앞 끝은 기둥 뒤에서 멈춤 — 같은 평면 X)
      K.colL(S9, cx, (z0 + z1) / 2, 1.38, 1.24, -0.5, 0.75); if (!WY) dog(K, S9, cx - 0.35, z0 + 1.2, 0, 0.5 - i * 0.5, DOG[i]);
      bowl(K, S9, cx + 0.55, z1 - 0.35, 0x3d74c9); K.part(S9, 'c16', cx + 0.55, 0.06, z1 - 0.35, 0.11, 0.008, 0, 0x6fc3dc); bowl(K, S9, cx + 0.95, z1 - 0.35, 0xe0453a); bowls.push([cx + 0.95, z1 - 0.35, 'd']);   // 물그릇(물) · 밥그릇
      K.sign(S9, [en() ? 'Bori' : '보리', en() ? 'Kongi' : '콩이', en() ? 'Duri' : '두리'][i], cx, 1.15, z1 + 0.04, 0, 0.7, 0.24, { bg: '#5cbf73', fr: 0xf6f4ee }); P('b', cx, 0.7, z1 + 0.04, 0.03, 0.33, 0.03, 0x8a6a4a); }   // 칸 이름표(동물 이름 = 보호소가 지어 준 이름 · 사람 이름 X)
    { const q = emLog().find(q9 => q9 && q9.k === 'pet' && q9.ok && q9.d < day() && day() - q9.d <= 4); if (q) { const px = 1.8, pz = 1.0, ry = -2.4, [cx9, cz9] = LP(px, pz, ry)(0, 0.25); P('b', px, 0.006, pz, 1.2, 0.02, 0.9, 0xe8d5b0); dog(K, S9, px, pz, 0.026, ry, q.pc || 0xc8a070); K.part(S9, 'b', cx9, 0.386, cz9, 0.3, 0.07, 0.09, q.cc || 0xe0453a, 0, ry, 0); bowl(K, S9, px + 0.75, pz + 0.15, 0x3d74c9); S().shelter.pet = keyOf(q); } }   /* PET-1(town_emerg.js pet): 비 오는 날 데려온 강아지 = 다음 날부터 나흘 · 같은 털·목줄 색 · 담요 · 물그릇 */
    { const tx = -hw + 1.0, tz = 1.4; P('b', tx, 0, tz, 0.9, 0.06, 0.9, 0xc8a070); P('c', tx, 0.06, tz, 0.1, 1.1, 0, 0xd9c7a5); P('b', tx, 0.6, tz, 0.7, 0.05, 0.7, 0xc8a070); P('b', tx, 1.16, tz, 0.8, 0.06, 0.8, 0xc8a070); K.colL(S9, tx, tz, 0.48, 0.48, -0.5, 1.25);   // 고양이 쉼터 탑
      if (!WY) { cat(K, S9, tx, tz, 1.22, 0.8, 0x7a7a7a); cat(K, S9, tx + 0.05, tz - 0.05, 0.65, -0.6, 0xef9b4a); } bowl(K, S9, tx + 0.9, tz - 0.3, 0xf2c230); bowls.push([tx + 0.9, tz - 0.3, 'c']); K.sign(S9, en() ? 'Cats' : '고양이', tx, 1.9, tz, Math.PI / 2, 0.8, 0.24, { bg: '#ef8b33', fr: 0xf6f4ee, two: true }); P('b', tx, 1.22, tz, 0.03, 0.56, 0.03, 0x8a6a4a); }
    { const x = hw - 0.3, z = 0.6; P('b', x, 0, z, 0.5, 1.6, 2.2, 0xb07d4a); for (const y of [0.55, 1.1]) P('b', x - 0.26, y, z, 0.02, 0.03, 2.1, 0x8a5a34);   // 사료 선반(포대 · 통)
      for (let i = 0; i < 3; i++) { K.I(S9, 'b', x - 0.05, 0.02, z - 0.7 + i * 0.7, 0.36, 0.48, 0.3, [0xd9473b, 0x3d74c9, 0xd9473b][i]); K.I(S9, 'b', x - 0.05, 0.58, z - 0.7 + i * 0.7, 0.32, 0.4, 0.28, [0xf2c230, 0x3cc76a, 0xf2c230][i]); } K.colL(S9, x, z, 0.27, 1.12, -0.5, 1.6);
      K.sign(S9, en() ? 'Pet food' : '사료', x - 0.27, 1.9, z, -Math.PI / 2, 1.0, 0.3, { bg: '#5cbf73', fr: 0x8a6a4a }); K.standGuest(S9, ox + x - 1.2, oy, oz + z + 1.5, -Math.PI / 2, 6); }   // 동물보호사(이름 없음)
    K.mainSign(S9, name, 0, 2.85, -hd + 0.02, 0, { bg: '#3f8f4e' });
    { const bz = 2.6; P('b', -hw + 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }
    const board = boardMesh(K, S9, -hw + 0.046, 1.67, 2.6, Math.PI / 2, 2.4, 1.5);
    const food = K.parts(put => { for (const [bx, bz, t] of bowls) { put('c16', ox + bx, oy + 0.067, oz + bz, 0.108, 0.014, 0, t === 'c' ? 0xb07d4a : 0x8a5a34); for (let k = 0; k < 4; k++) put('s', ox + bx + Math.cos(k * 1.6) * 0.05, oy + 0.084, oz + bz + Math.sin(k * 1.6) * 0.05, 0.025, 0.6, 0, t === 'c' ? 0xc8945a : 0x9a6a3c); } });   // 밥(그릇 속 사료 · 밥을 주면 보임)
    food.visible = S().shelter.fed === day(); S9.extra = S9.extra || []; S9.extra.push(food);
    const wyx = WY ? WY.shelterRoom(K, S9, { pens, z0, z1, tower: [-hw + 1.0, 1.4], at }) : [];
    K.wwin(S9, 'F', -3.6, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.6, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-3, 0, 3]) for (const z of [-1.4, 2.0]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['강아지 칸 셋(울타리 · 물그릇 · 밥그릇)', '고양이 쉼터 탑 · 고양이 둘', '사료 선반', '동물보호사(이름 없음)', '새 가족을 기다려요 판'], board, food, dogs: pens.map(cx => [ox + cx - 0.35, oy, oz + z0 + 1.2]),
      extra: [...wyx, { k: 'bd:feed', stand: [hw - 1.2, 0, 0.6], r: 1.3, label: '🥣 ' + (en() ? 'Feed the animals (once a day)' : '동물 밥 주기 (하루 한 번)') }, { k: 'bd:board', stand: [-hw + 1.0, 0, 2.6], r: 1.1, label: '📋 ' + (en() ? 'Read the board' : '알림판 보기') }], cam: { d: 3.8, p: 0.55 } }; }

  // 은행(11×9): 뒤 = 예금 창구 둘(번호 빛판 · 은행원 둘) · 왼쪽 뒤 = 번호표 기계 · 왼벽 = 기다리는 의자 · 오른벽 = '내 통장' 판(캔버스) · 오른쪽 앞 = 현금 지급기(소품)
  function roomBank(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], grn = 0x2f6d5a;
    const S9 = K.shell(at, W, D, H, { wall: 0xf6f4ee, wains: grn, winY: [], noLights: true, ft: ['tile', 1.0, 0xeceae4] }), P = S9.put; S9.ac = K.cs(grn);
    { const cx = -0.5, zc = -hd + 1.5; P('b', cx, 0, zc, 5.0, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 4.9, 0.5, 0.012, grn); P('b', cx, 1.0, zc, 5.06, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 2.53, 0.33, -0.5, 1.1);   /* 예금 창구 탁자 */
      P('b', cx, 1.04, zc, 0.04, 0.62, 0.6, 0xc0c4c8);   /* 두 창구 사이 칸막이 */
      for (let k = 0; k < 2; k++) { const x = cx + (k ? 1.25 : -1.25); K.sign(S9, String(k + 1), x, 2.42, -hd + 0.02, 0, 0.4, 0.34, { bg: '#1c2a22', fg: '#ff6a4a', fr: 0x3a3d42 }); P('b', x + 0.6, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', x + 0.6, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x9fd8c0, 1); P('b', x - 0.5, 1.04, zc, 0.3, 0.02, 0.22, 0xffffff); K.standGuest(S9, ox + x, oy, oz + zc - 0.7, 0, k ? 6 : 1); }   /* 창구 번호(빛) · 화면(빛) · 종이 · 은행원 둘(이름 없음) */
      K.sign(S9, en() ? 'Savings counter' : '예금 창구', cx, 0.42, zc + 0.33, 0, 1.6, 0.26, { bg: '#2f6d5a', fr: false }); }
    { const x = -4.4, z = -hd + 0.17; P('b', x, 0, z, 0.42, 1.25, 0.3, 0xe9edf2); P('b', x, 1.0, z + 0.16, 0.3, 0.16, 0.02, 0x9fd8c0, 1); P('b', x, 0.82, z + 0.16, 0.08, 0.08, 0.02, 0xe0453a); P('b', x, 0.66, z + 0.16, 0.18, 0.03, 0.02, 0xffffff); K.colL(S9, x, z, 0.21, 0.15, -0.5, 1.3);   /* 번호표 기계(빛 화면 · 빨간 단추 · 표 나오는 틈) */
      K.sign(S9, en() ? 'Take a number' : '번호표', x, 1.75, -hd + 0.02, 0, 0.8, 0.24, { bg: '#2f6d5a', fr: 0xf6f4ee }); }
    K.mainSign(S9, name, 3.7, 2.75, -hd + 0.02, 0, { bg: '#2f6d5a' }); K.plant(S9, hw - 0.5, -hd + 0.5, 1);
    for (const z of [-0.6, 0.2, 1.0]) K.chair(S9, seats, -hw + 1.3, z, Math.PI / 2, grn);   /* 기다리는 의자 */
    K.sign(S9, en() ? 'Save a little, again and again' : '조금씩, 꾸준히 모아요', -hw + 0.02, 2.2, 0.2, Math.PI / 2, 2.4, 0.3, { bg: '#2f6d5a', fr: 0xf6f4ee });
    { const bz = -0.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }   /* 통장 판 틀(글 = 캔버스) */
    const board = boardMesh(K, S9, hw - 0.046, 1.67, -0.6, -Math.PI / 2, 2.4, 1.5);
    { const x = hw - 0.3, z = 2.7; P('b', x, 0, z, 0.5, 2.0, 0.7, 0xc9ced4); P('b', x - 0.256, 1.12, z, 0.012, 0.3, 0.42, 0x7fb8e0, 1); P('b', x - 0.28, 0.92, z, 0.06, 0.04, 0.36, 0x3a3d42); K.colL(S9, x, z, 0.25, 0.35, -0.5, 2.0);   /* 현금 지급기(소품 · 빛 화면 · 손잡이 판) */
      K.sign(S9, en() ? 'Cash machine' : '현금 지급기', x - 0.262, 1.75, z, -Math.PI / 2, 0.66, 0.2, { bg: '#2f6d5a', fr: false }); }
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 2.6, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['예금 창구 둘 · 은행원(이름 없음)', '번호표 기계', '기다리는 의자', '내 통장 판', '현금 지급기(소품)'], board,
      extra: [{ k: 'bd:bank', stand: [-1.75, 0, -hd + 2.35], r: 1.3, label: '🏦 ' + L(TIP.bank) }, { k: 'bd:board', stand: [hw - 1.0, 0, -0.6], r: 1.2, label: '📒 ' + (en() ? 'Read my bankbook board' : '내 통장 판 보기') }, ...(A.why ? [{ k: 'why:tk', stand: [-4.4, 0, -hd + 0.95], r: 0.9, label: '🎫 ' + (en() ? 'Take a number' : '번호표 뽑기') }, { k: 'why:atm', stand: [hw - 1.05, 0, 2.7], r: 0.9, label: '🏧 ' + (en() ? 'Cash machine' : '현금 지급기') }] : [])], cam: { d: 3.8, p: 0.55 } }; }

  // 우체국(town_indoor.js 방 그대로): 1번 창구(직원 앞) = 소포 접수 E · 보낸 날엔 저울 위에 소포 상자(합친 부품 1 · 다음 날 아침 닿으면 사라짐)
  function postDeco(S9, made, B9, K) { left(); const [ox, oy, oz] = S9.at, x = -2.98, z = -2.525, D = day(), s = S().post;
    const box = A.parts(put => { put('b', ox + x, oy + 1.10, oz + z, 0.26, 0.2, 0.22, 0xc8945a); put('b', ox + x, oy + 1.30, oz + z, 0.06, 0.012, 0.23, 0xd9b27a); put('b', ox + x, oy + 1.15, oz + z + 0.112, 0.14, 0.08, 0.004, 0xffffff); });   /* 상자 · 테이프 · 주소 쪽지(앞면 2mm 앞 — 같은 면 X) */
    box.visible = (s.box || []).some(q => q.d === D && !q.ok); (S9.extra || (S9.extra = [])).push(box);
    (made.extra || (made.extra = [])).push({ k: 'bd:post', stand: [-3.33, 0, -1.55], r: 1.2, label: '📦 ' + L(TIP.post) });
    CUR = { k: 'post', at: S9.at, name: (B9 && B9.name) || '', made, board: null, box, door: B9 && B9.door ? B9.door.slice(0, 2) : null }; made.S = made.S || S9; visPlace('post', made, K); log('build post'); }   /* K = town_indoor 부품(deco 셋째 칸 · 창구 손님 몸) */


  // ───────── BLDG-3 방(로컬 = 방 가운데 · 문 = 앞벽 +z) ─────────
  const seatOf = (D, i) => ROWS[hashS('sr:' + D + ':' + i) % 5] + (1 + hashS('sc:' + D + ':' + i) % 6);
  const seatAt9 = sq => { const r = ROWS.indexOf(String(sq)[0]), c = +String(sq).slice(1); return r < 0 || !(c >= 1 && c <= 6) ? null : [COLX(c), ROWZ[r]]; };
  const seatHot = sq => { const p = seatAt9(sq); return p ? { k: 'bd:seat', stand: [p[0], 0, p[1] + 0.65], r: 0.85, label: '🎫 ' + (en() ? 'My seat ' + sq + ' — sit and watch' : '내 자리 ' + sq + ' — 앉아서 보기') } : null; };
  // 영화관(12×14 · KIDEYE-2 10-25: 12 깊이면 들어간 자리 뒤 3m가 모자라 카메라가 천장 구석에서 내려다봐 시간표 윗줄이 위 칸 뒤로 · 머리가 화면 아래를 덮음 → 2m 깊게 · 의자 0.9m 화면 쪽 · 들어가는 자리 문에서 3.9m · 낮게 보는 카메라): 뒤 = 큰 화면(캔버스 · 쉴 때 = 오늘 상영 시간표 · 상영 때 = 영화 장면) · 의자 다섯 줄(가 = 화면 앞 ~ 마) × 여섯(번호) · 줄 글자 = 왼벽 · 번호 = 의자 등 · 왼쪽 앞 = 매표소(직원)
  function roomCinema(at, K, name) { const W = 12, D = 14, H = 4.0, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], dummy = [], red = 0xb5483a, wl = 0x4a3f5c;
    const S9 = K.shell(at, W, D, H, { wall: wl, wains: 0x2b2433, winY: [], noLights: true, ft: ['tile', 1.0, 0x9a5a5a] }), P = S9.put; S9.ac = K.cs(0x6a3a6a);
    K.mainSign(S9, name, -2.8, 3.3, hd - 0.02, Math.PI, { bg: '#6a3a6a' });
    for (let r = 0; r < 5; r++) K.sign(S9, ROWS[r], -hw + 0.02, 1.25, ROWZ[r], Math.PI / 2, 0.36, 0.36, { bg: '#f2c230', fg: '#2b2420', fr: false });   /* 줄 글자(왼벽 · 지도 위 칸 글자처럼) */
    { const x = -4.3, z = 3.4; P('b', x, 0, z, 0.6, 1.0, 2.0, 0xf6f4ee); P('b', x + 0.306, 0.1, z, 0.012, 0.5, 1.9, 0x6a3a6a); P('b', x, 1.0, z, 0.66, 0.04, 2.06, 0xd8dce0); K.colL(S9, x, z, 0.33, 1.0, -0.5, 1.1);   /* 매표소 탁자 */
      P('b', x - 0.05, 1.04, z + 0.6, 0.3, 0.3, 0.42, 0x2b2d31); P('b', x - 0.022, 1.08, z + 0.6, 0.012, 0.22, 0.36, 0x9fd8c0, 1);   /* 화면(빛) */
      K.sign(S9, en() ? 'Tickets' : '매표소', -hw + 0.02, 2.3, z, Math.PI / 2, 1.2, 0.3, { bg: '#6a3a6a', fr: 0xf6f4ee }); K.standGuest(S9, ox - 5.2, oy, oz + z, Math.PI / 2, 3); }   /* 영화관 직원(이름 없음) */
    P('b', 0, 0.7, -hd + 0.02, 5.9, 2.6, 0.04, 0x1c1c22);   /* 화면 틀(KIDEYE-2: 윗변 3.3m — 들어가자마자 시간표 윗줄까지 보이게) */
    const board = boardMesh(K, S9, 0, 2.0, -hd + 0.046, 0, 5.7, 2.4);
    for (let r = 0; r < 5; r++) for (let c = 1; c <= 6; c++) { const x = COLX(c), z = ROWZ[r]; K.chair(S9, dummy, x, z, Math.PI, red); K.sign(S9, String(c), x, 0.78, z + 0.226, 0, 0.2, 0.16, { bg: '#2b2420', fg: '#f6f4ee', fr: false }); }   /* 의자 서른(앉기 E는 표에 적힌 자리 하나만) · 번호 = 의자 등 */
    FILMS.forEach((f, i) => P('b', hw - 0.02, 1.2, -2.2 + i * 1.6, 0.04, 1.3, 0.9, parseInt(f.bg.slice(1), 16)));   /* 영화 포스터 판(오른벽 · 글 X) */
    for (const x of [-3, 3]) for (const z of [-2, 2]) K.panelL(S9, x, z, 0.5);
    const ex = [{ k: 'bd:ticket', stand: [-3.4, 0, 3.4], r: 1.2, label: '🎬 ' + (en() ? 'Ticket desk — read the timetable' : '매표소 — 상영 시간표 보기') }], tk = S().cinema.tk;
    if (tk && tk.d === day() && S().cinema.seen !== day()) { const h = seatHot(tk.seat); if (h) ex.push(h); }
    return { S: S9, W, D, H, seats, items: ['큰 화면(쉴 때 = 상영 시간표)', '의자 다섯 줄 × 여섯(줄 글자 · 의자 번호)', '매표소 · 영화관 직원(이름 없음)', '영화 포스터 판'], board, extra: ex, spz: 3.9, cam: { d: 3.2, p: innerHeight > innerWidth ? 0.2 : 0.3 } }; }   /* 세로 화면(휴대폰) = 위 칸(방 안내·할 일 줄)이 더 길게 내려와 조금 더 낮게 봄 */
  // 공장(13×10 · KIDEYE-2: 9 깊이면 들어간 자리 뒤가 모자라 카메라가 줄 앞에 붙어 내려다봄 · 이름판·자리 번호가 위 칸 뒤 → 1m 깊게 · 판 낮게): 뒤 = 긴 줄(컨베이어) · 일하는 자리 다섯(번호 판 · 위생모 쓴 직원 다섯 · 이름 없음) · 줄 끝 = 깔판(오늘 만든 상자가 쌓임) · 오른벽 = '오늘 만든 것' 판
  function roomFactory(at, K, name) { const W = 13, D = 10, H = 4.2, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], zc = -1.4, gry = 0x5a7a8a, kd = /젤리|케이크/.test(name) ? 'jelly' : 'farm', pc = kd === 'jelly' ? 0xf08fb2 : 0xc8945a;
    const S9 = K.shell(at, W, D, H, { wall: 0xe8ecef, wains: gry, winY: [], noLights: true, ft: ['tile', 1.0, 0xd0d4d8] }), P = S9.put; S9.ac = K.cs(gry);
    P('b', 0, 0, zc, 10.4, 0.76, 0.9, 0x6b7680); P('b', 0, 0.76, zc, 10.3, 0.03, 0.72, 0x2b2d31); K.colL(S9, 0, zc, 5.2, 0.45, -0.5, 0.9);   /* 긴 줄(몸 · 띠) */
    for (let i = 0; i < 12; i++) K.I(S9, 'b', -4.6 + i * 0.84, 0.79, zc, 0.22, 0.14, 0.22, i % 3 === 2 ? 0xd9b27a : pc);   /* 줄 위 물건 */
    for (let i = 0; i < 5; i++) { const x = -4 + i * 2; K.standGuest(S9, ox + x, oy, oz + zc - 0.95, 0, i + 1); P('c16', x, 1.6, zc - 0.95, 0.18, 0.1, 0, 0xffffff); K.sign(S9, String(i + 1), x, 2.2, -hd + 0.02, 0, 0.4, 0.4, { bg: '#5a7a8a', fr: 0xf6f4ee }); }   /* 직원 다섯(위생모) · 자리 번호 */
    K.mainSign(S9, name, 0, 2.95, -hd + 0.02, 0, { bg: '#5a7a8a' });
    P('b', 5.75, 0, zc, 0.9, 0.12, 0.9, 0x9a7a4a); K.colL(S9, 5.75, zc, 0.45, 0.45, -0.5, 1.0);   /* 깔판 */
    const prod = K.parts(put => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) { const x = ox + 5.55 + a * 0.4, z = oz + zc - 0.2 + b * 0.4, y = oy + 0.12 + c * 0.31; put('b', x, y, z, 0.36, 0.3, 0.36, 0xc8945a); put('b', x, y + 0.302, z, 0.06, 0.006, 0.37, 0xd9b27a); } }); prod.visible = S().factory.made === day(); (S9.extra || (S9.extra = [])).push(prod);   /* 오늘 만든 상자 여덟(테이프 · 줄을 돌리면 보임) */
    { const bz = 1.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); } const board = boardMesh(K, S9, hw - 0.046, 1.67, 1.6, -Math.PI / 2, 2.4, 1.5);
    K.sign(S9, en() ? 'Wear a hat and wash your hands' : '위생모를 쓰고 손을 씻어요', -hw + 0.02, 2.2, 1.2, Math.PI / 2, 2.6, 0.3, { bg: '#5a7a8a', fr: 0xf6f4ee });
    K.wwin(S9, 'F', -3.6, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.6, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-4, 0, 4]) for (const z of [-2.4, 1.4]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['긴 줄(컨베이어)', '일하는 자리 다섯 · 위생모 쓴 직원(이름 없음)', '자리 번호 판', '깔판(오늘 만든 상자)', '오늘 만든 것 판'], board, prod, line: kd,
      extra: [{ k: 'bd:line', stand: [0, 0, zc + 1.45], r: 1.3, label: '🏭 ' + L(TIP.factory) }, { k: 'bd:board', stand: [hw - 1.0, 0, 1.6], r: 1.2, label: '📋 ' + (en() ? 'Read the board' : '오늘 만든 것 판 보기') }], spz: 3.4, cam: { d: 3.2, p: innerHeight > innerWidth ? 0.22 : 0.35 } }; }   /* 세로 화면 = 영화관과 같은 까닭으로 조금 낮게 */
  // 노인정·경로당(10×8): 뒤 = '땅이름 이야기' 판 · 그 곁에 이야기해 주는 어르신(이름 없음 · 흰머리 · 지팡이) · 오른쪽 = 고누 탁자(앉은 어르신) · 왼벽 = 쉬는 의자
  function roomElder(at, K, name) { const W = 10, D = 8, H = 3.2, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], sE = [], dummy = [], br = 0x9a6a3c;
    const S9 = K.shell(at, W, D, H, { wall: 0xf3ead8, wains: br, winY: [], noLights: true }), P = S9.put; S9.ac = K.cs(0x7a5a3a);
    K.mainSign(S9, name, -2.9, 2.6, -hd + 0.02, 0, { bg: '#7a5a3a' });
    P('b', 0.6, 0.88, -hd + 0.02, 2.48, 1.58, 0.04, 0x8a6a4a); const board = boardMesh(K, S9, 0.6, 1.67, -hd + 0.046, 0, 2.4, 1.5);   /* 땅이름 이야기 판 */
    { const x = -1.6, z = -hd + 1.0; K.standGuest(S9, ox + x, oy, oz + z, 0, 1); P('c16', x, 1.6, z, 0.17, 0.08, 0, 0xdcdcdc); P('b', x + 0.32, 0, z + 0.16, 0.03, 0.86, 0.03, 0x6b4a2f); }   /* 어르신(이름 없음 · 흰머리 · 지팡이) */
    { const x = 2.6, z = 0.8; K.stable(S9, x, z, 1.0, 0.8, 0x8a5a34, 0.74); P('b', x, 0.74, z, 0.5, 0.02, 0.5, 0xd9b27a); for (const [a, b, c] of [[-0.2, -0.2, 0xffffff], [0.2, -0.2, 0xffffff], [-0.2, 0.2, 0x2b2420], [0.2, 0.2, 0x2b2420]]) P('c16', x + a, 0.76, z + b, 0.04, 0.02, 0, c);   /* 고누 판 · 말 넷 */
      K.chair(S9, sE, x, z - 0.8, 0, br); K.sitGuest(S9, sE, 0, 2); K.chair(S9, dummy, x, z + 0.8, Math.PI, br); }   /* 맞수 어르신(앉음) · 내 의자 */
    for (const z of [0.2, 1.1]) K.chair(S9, seats, -hw + 0.9, z, Math.PI / 2, br); K.sitGuest(S9, seats, 0, 4); K.plant(S9, -hw + 0.5, -hd + 0.5, 1);
    K.wwin(S9, 'F', -2.8, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 2.8, 0.9, 1.6, 1.2, { sun: true }); for (const x of [-2.4, 2.4]) for (const z of [-1.4, 1.6]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['땅이름 이야기 판', '이야기해 주는 어르신(이름 없음)', '고누 탁자 · 맞수 어르신(이름 없음)', '쉬는 의자'], board,
      extra: [{ k: 'bd:elder', stand: [-1.6, 0, -hd + 2.0], r: 1.2, label: '👵 ' + L(TIP.elder) }, { k: 'bd:board', stand: [0.9, 0, -hd + 1.3], r: 0.9, label: '📋 ' + (en() ? 'Read the place-name board' : '땅이름 이야기 판 보기') }, { k: 'bd:gonu', stand: [2.6, 0, 2.2], r: 1.1, label: '⚪ ' + (en() ? 'Play well gonu with the elder' : '어르신과 우물고누') }], cam: { d: 3.8, p: 0.55 } }; }
  // 박물관(12×10): 받침대 넷(맷돌 · 다듬잇돌과 방망이 · 지게 · 호롱 · 앞에 이름판) · 알아본 받침대 = 금빛 표 · 뒤 = 학예사(이름 없음) · 오른벽 = '내가 알아본 옛 물건' 판
  function roomMuseum(at, K, name) { const W = 12, D = 10, H = 3.6, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], gry = 0x5b6670, wd = 0x8a5a34, z = MUZ;
    const S9 = K.shell(at, W, D, H, { wall: 0xeceff1, wains: gry, winY: [], noLights: true, ft: ['tile', 1.0, 0xe4e7ea] }), P = S9.put; S9.ac = K.cs(gry);
    K.mainSign(S9, name, -2.4, 2.8, -hd + 0.02, 0, { bg: '#5b6670' }); K.sign(S9, en() ? 'Long ago and today' : '옛날과 오늘날', 2.4, 2.8, -hd + 0.02, 0, 2.0, 0.4, { bg: '#8a6a4a', fr: 0xf6f4ee });
    MUSE.forEach((m, i) => { const x = MUX[i]; P('b', x, 0, z, 0.9, 0.9, 0.9, 0xf6f4ee); K.colL(S9, x, z, 0.45, 0.45, -0.5, 1.4); K.sign(S9, L(m[0]), x, 0.55, z + 0.455, 0, 0.84, 0.22, { bg: '#5b6670', fr: false });
      if (i === 0) { P('c16', x, 0.9, z, 0.3, 0.12, 0, 0x8a8f99); P('c16', x, 1.03, z, 0.28, 0.12, 0, 0x9aa0a8); P('c', x + 0.08, 1.15, z, 0.03, 0.01, 0, 0x5a5f66); P('b', x + 0.22, 1.15, z, 0.04, 0.18, 0.04, wd); }   /* 맷돌(아래 돌 · 위 돌 · 구멍 · 손잡이) */
      else if (i === 1) { P('b', x, 0.9, z, 0.6, 0.16, 0.32, 0xb8b2a8); for (const a of [-0.08, 0.08]) P('b', x + a, 1.06, z, 0.05, 0.05, 0.42, wd); }   /* 다듬잇돌 · 방망이 둘 */
      else if (i === 2) { for (const a of [-0.18, 0.18]) P('b', x + a, 0.9, z, 0.05, 1.1, 0.05, wd); for (const y of [1.15, 1.55]) P('b', x, y, z, 0.31, 0.04, 0.04, wd); P('b', x, 1.3, z + 0.03, 0.31, 0.3, 0.02, 0x9a7a4a); }   /* 지게(두 다리 · 가름대 · 등판) */
      else { P('c16', x, 0.9, z, 0.1, 0.12, 0, 0xe8e2d0); P('c', x, 1.02, z, 0.015, 0.05, 0, 0xf2f2ee); P('s', x, 1.11, z, 0.03, 1.6, 0, 0xffd27a, 1); } });   /* 호롱(기름 그릇 · 심지 · 불빛) */
    const stars = MUSE.map((m, i) => { const g = K.parts(put => { put('s', ox + MUX[i] + 0.3, oy + 0.95, oz + z + 0.3, 0.06, 0.8, 0, 0xf2c230, 1); put('c16', ox + MUX[i] + 0.3, oy + 0.9, oz + z + 0.3, 0.07, 0.01, 0, 0xb07a00); }); g.visible = !!(S().museum.got || {})[i]; (S9.extra || (S9.extra = [])).push(g); return g; });   /* 알아본 표(금빛 · 받침대 위 모퉁이) */
    K.standGuest(S9, ox, oy, oz - hd + 0.9, 0, 6);   /* 학예사(이름 없음) */
    { const bz = 1.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); } const board = boardMesh(K, S9, hw - 0.046, 1.67, 1.6, -Math.PI / 2, 2.4, 1.5);
    for (const zz of [1.0, 2.2]) K.chair(S9, seats, -hw + 0.9, zz, Math.PI / 2, gry);
    K.wwin(S9, 'F', -3.4, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.4, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-3, 0, 3]) for (const zz of [-2.2, 1.8]) K.panelL(S9, x, zz);
    const ex = MUSE.map((m, i) => ({ k: 'bd:mu' + i, stand: [MUX[i], 0, z + 1.25], r: 1.0, label: '🏺 ' + L(m[0]) + (en() ? ' — what was it for?' : ' — 무엇에 썼을까?') })); ex.push({ k: 'bd:board', stand: [hw - 1.0, 0, 1.6], r: 1.2, label: '📋 ' + (en() ? 'Read my old-things board' : '내가 알아본 옛 물건 판 보기') }); if (A.pathRoom) for (const q of A.pathRoom('museum', K, S9) || []) ex.push(q);   /* PATH-1 나의 길 관찰가 표지판 = 진열장 · 관찰 기록 판(town_path.js) */
    return { S: S9, W, D, H, seats, items: ['받침대 넷(맷돌 · 다듬잇돌과 방망이 · 지게 · 호롱)', '알아본 표(금빛)', '학예사(이름 없음)', '내가 알아본 옛 물건 판'], board, stars, extra: ex, cam: { d: 3.8, p: 0.55 } }; }

  // ───────── E ─────────
  function use(kk) { if (!CUR || A.panelOpen()) return; if (/^why:/.test(kk)) return A.why && A.why().use(kk); if (/^pth:/.test(kk)) return A.pathUse && A.pathUse(kk); if (kk === 'bd:vis') return visOpen(); if (kk === 'bd:112') return police(); if (kk === 'bd:aid') return clinic(); if (kk === 'bd:hi') return greet(); if (kk === 'bd:feed') return feed(); if (kk === 'bd:bank') return bank(); if (kk === 'bd:post') return post(); if (kk === 'bd:board') return readBoard(); if (kk === 'bd:ticket') return cinema(); if (kk === 'bd:seat') return seatUse(); if (kk === 'bd:line') return factory(); if (kk === 'bd:elder') return elder(); if (kk === 'bd:gonu') return gonu(); if (/^bd:mu\d$/.test(kk)) return museum(+kk.slice(5)); }
  const pick = (L9, n, seed) => L9.map((x, i) => [hashS(seed + ':' + i), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map(q => q[1]);
  const shuf = (L9, seed) => L9.map((x, i) => [hashS(seed + ':' + L(x[1] || x)), x, i]).sort((a, b) => a[0] - b[0]);
  const wordBox = k => '<div class="bd-wd">' + WORDS[k].map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div>';
  function reward(k, sk, n) { const s = S()[k], D = day(); if (s.rw === D) return false; s.rw = D; mark(); A.skUp(sk, n, 'bldg:' + k); return true; }

  // 👮 경찰서: 도운 아이 가족의 인사(있으면 먼저) → 112 연습(상황 셋 · 번호판 · 마지막 = 무엇을 꼭 말하나)
  async function police() { const s = S().police, e = en(), q = pending('lost', s.thx);
    if (q) { const n = day() - q.d; await A.dialog({ who: e ? 'Police officer' : '경찰관', icon: '👮', text: e ? 'You took a lost child back to their family ' + ago(n) + ' in ' + q.cell + '. The family asked me to say thank you. I will pin their note on the praise board.' : ago(n) + ' ' + q.cell + ' 칸에서 길 잃은 아이를 가족에게 데려다줬지요? 아이 가족이 고맙다고 전해 달래요. 쪽지를 칭찬 게시판에 붙여 둘게요.' });
      (s.thx || (s.thx = [])).push(keyOf(q)); s.thx = s.thx.slice(-6); mark(); boardDraw(); sfx('ding'); A.skUp('explore', 1, 'bldg:thx'); A.rec('bldg', { k: 'police', ev: 'thx', cell: q.cell }); toast('📋 ' + (e ? 'A thank-you note is on the praise board.' : '칭찬 게시판에 고맙다는 쪽지가 붙었어요.'), 2.8); return; }
    const D = day(), cases = (() => { const L9 = pick(SIT, 3, 'p112:' + D); if (!L9.some(x => x[0] === 112)) L9[0] = SIT[0]; if (!L9.some(x => x[0] === 119)) L9[2] = SIT[1]; return L9; })();
    let i = 0, num = '', mis = 0, stage = 0; const WH = shuf(WHERE, 'w' + D);
    const draw = () => '<h3>👮 ' + esc(L(TIP.police)) + '</h3>' + (stage === 0
      ? '<div class="sm">' + esc(e ? 'Police officer: “Which number would you call? Press it, then 📞.” (' + (i + 1) + ' of 3)' : '경찰관: "이럴 때는 몇 번에 전화할까요? 번호를 누르고 📞를 눌러요." (' + (i + 1) + '/3)') + '</div><div class="bd-sit">' + esc(L(cases[i][1])) + '</div><div class="bd-num">' + (num || '&nbsp;') + '</div><div class="bd-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '📞'].map(k => '<button class="' + (k === '📞' ? '' : 'sub') + '" data-k="' + k + '">' + k + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : stage === 1 ? '<div class="pc-tx">' + esc(e ? 'Police officer: “When you call, what must you say clearly?”' : '경찰관: "신고할 때 꼭 또렷하게 말해야 하는 것은 무엇일까요?"') + '</div><div class="bd-ch">' + WH.map(([, w], j) => '<button class="sub" data-w="' + j + '">' + esc(L(w[1])) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Police officer: “Well done. 112 is for the police: someone lost, something stolen, roads in trouble. 119 is for fires, injuries and sudden illness. Never make joke calls.”' : '경찰관: "잘했어요. 112는 경찰이에요. 길을 잃었을 때, 물건을 도둑맞았을 때, 길에 사고가 났을 때 걸어요. 119는 불이 나거나 다치고 아플 때예요. 장난 전화는 하지 않아요."') + '</div>' + wordBox('police'))
      + '<div class="row"><button class="' + (stage === 2 ? '' : 'sub') + '" data-a="x">' + (stage === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bd112'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.k != null) { const k = b.dataset.k; if (k === '⌫') num = num.slice(0, -1); else if (k === '📞') { const want = String(cases[i][0]); if (num === want) { sfx('ding'); num = ''; i++; if (i >= cases.length) stage = 1; paint(); return; } mis++; msg(num === '112' || num === '119' ? (want === '112' ? (e ? 'Officer: “Nobody is hurt and there is no fire. Who helps find lost people and lost things?”' : '경찰관: "다친 사람도 불도 없어요. 길 잃은 사람과 잃어버린 물건은 누가 찾아 줄까요?"') : (e ? 'Officer: “Someone is hurt or there is a fire. Who comes with an ambulance or a fire engine?”' : '경찰관: "다쳤거나 불이 났어요. 구급차와 소방차는 어디에서 올까요?"')) : (e ? 'Officer: “Emergency numbers are 112 (police) and 119 (fire and ambulance).”' : '경찰관: "급할 때 거는 번호는 112(경찰)와 119(소방·구급)예요."')); num = ''; sfx('tick'); } else if (num.length < 4) num += k; sfx('tick'); const n9 = P.querySelector('.bd-num'); if (n9) n9.innerHTML = num || '&nbsp;'; return; }
      if (b.dataset.w != null) { if (WH[+b.dataset.w][1][0]) { stage = 2; s.d112 = D; s.n112 = (s.n112 | 0) + 1; mark(); sfx('ding'); reward('police', 'explore', 2); A.rec('bldg', { k: 'police', ev: '112', mis }); boardDraw(); paint(); return; } mis++; sfx('tick'); msg(e ? 'Officer: “Police cars need to know where to go first.”' : '경찰관: "경찰차가 먼저 알아야 하는 것은 어디로 가야 하는지예요."'); } };
    log('police'); }

  // 🩹 병원·보건소: 응급 처치 문제 셋(같은 날은 같은 문제)
  function clinic() { const s = S().clinic, e = en(), D = day(), Q = pick(AID, 3, 'aid:' + D); let i = 0, mis = 0, done = false;
    const opts9 = q => q[1].map((t, j) => [hashS(D + L(t)), t, j]).sort((a, b) => a[0] - b[0]);
    const draw = () => '<h3>🩹 ' + esc(L(TIP.clinic)) + '</h3>' + (!done
      ? '<div class="sm">' + esc(e ? 'Nurse: “Let’s go over what to do before the ambulance comes.” (' + (i + 1) + ' of 3)' : '간호사 선생님: "구급차가 오기 전에 할 일을 같이 알아봐요." (' + (i + 1) + '/3)') + '</div><div class="bd-sit">' + esc(L(Q[i][0])) + '</div><div class="bd-ch">' + opts9(Q[i]).map(([, t, j]) => '<button class="sub" data-o="' + j + '">' + esc(L(t)) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Nurse: “Good. I put the first aid card on the board. If someone is badly hurt, call 119 first and stay with them.”' : '간호사 선생님: "잘했어요. 응급 처치 카드를 판에 붙여 둘게요. 많이 다친 사람을 보면 먼저 119에 알리고 곁에 있어 줘요."') + '</div>' + wordBox('clinic'))
      + '<div class="row"><button class="' + (done ? '' : 'sub') + '" data-a="x">' + (done ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdaid'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.o != null) { if (+b.dataset.o === 0) { sfx('ding'); toast('🩹 ' + L(Q[i][2]), 3.2); i++; if (i >= Q.length) { done = true; s.dfa = D; s.nfa = (s.nfa | 0) + 1; mark(); reward('clinic', 'work', 2); A.rec('bldg', { k: 'clinic', ev: 'aid', mis }); boardDraw(); } paint(); return; } mis++; sfx('tick'); msg((e ? 'Nurse: “Think again. ' : '간호사 선생님: "다시 생각해 봐요. ') + L(Q[i][2]) + '"'); } };
    log('clinic'); }
  async function greet() { const s = S().clinic, nb = CUR && CUR.made.nb, e = en(); if (!nb || (s.hi || []).includes(keyOf(nb.q))) { if (nb) A.bubble({ x: nb.at[0], y: nb.at[1], z: nb.at[2], sc: 1 }, e ? 'See you around!' : '또 만나요!'); return; }
    const heat = nb.q.v === 'heat', n = day() - nb.q.d; await A.dialog({ who: e ? 'Neighbour' : '이웃', icon: '🙂', text: heat ? (e ? 'You helped me ' + ago(n) + ' when I was sick from the heat. I came for a check-up, and I am all better now. Thank you!' : ago(n) + ' 더위를 먹었을 때 도와줘서 고마워요. 오늘 검사를 받으러 왔는데 이제 다 나았대요!') : (e ? 'You called 119 for me ' + ago(n) + ' when I hurt my ankle. The doctor says it has healed. Thank you!' : ago(n) + ' 발목을 다쳤을 때 119에 알려 줘서 고마워요. 의사 선생님이 이제 다 나았대요!') });
    (s.hi || (s.hi = [])).push(keyOf(nb.q)); s.hi = s.hi.slice(-6); mark(); boardDraw(); sfx('ding'); A.skUp('work', 1, 'bldg:hi'); A.rec('bldg', { k: 'clinic', ev: 'hi', cell: nb.q.cell }); A.bubble({ x: nb.at[0], y: nb.at[1], z: nb.at[2], sc: 1 }, e ? 'Thank you!' : '고마워요!'); }

  // 🥣 보호센터: 강아지 그릇 → 고양이 그릇(알맞은 사료 고르기) → 그릇이 참
  function feed() { const s = S().shelter, e = en(), D = day();
    if (s.fed === D) { toast('🥣 ' + (e ? 'Animal carer: “They have eaten today. Come again tomorrow!”' : '동물보호사: "오늘은 벌써 밥을 먹었어요. 내일 또 와 줘요!"'), 3); return; }
    let st = 0, mis = 0; const OR = FOOD.map((t, j) => [hashS(D + L(t)), t, j]).sort((a, b) => a[0] - b[0]);
    const why = (want, got) => got === 2 ? (e ? 'Chocolate is harmful to dogs and cats. We never give them people snacks.' : '초콜릿은 개와 고양이 몸에 해로워요. 사람 간식은 주지 않아요.') : want === 0 ? (e ? 'Cat food is made for cats. Dogs eat dog food.' : '고양이 사료는 고양이 몸에 맞춘 거예요. 강아지는 강아지 사료를 먹어요.') : (e ? 'Cats need more of the nutrients that come from meat, so they eat cat food.' : '고양이는 고기에서 얻는 영양이 더 많이 필요해서 고양이 사료를 먹어요.');
    const draw = () => '<h3>🥣 ' + esc(L(TIP.shelter)) + '</h3>' + (st < 2
      ? '<div class="sm">' + esc(e ? 'Animal carer: “Please fill the bowls. Pick the right food.”' : '동물보호사: "밥그릇을 채워 줄래요? 알맞은 밥을 골라요."') + '</div><div class="bd-sit">' + esc(st === 0 ? (e ? 'The dogs’ bowls (Bori, Kongi, Duri)' : '강아지 밥그릇 (보리 · 콩이 · 두리)') : (e ? 'The cats’ bowl' : '고양이 밥그릇')) + '</div><div class="bd-ch">' + OR.map(([, t, j]) => '<button class="sub" data-f="' + j + '">' + esc(L(t)) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Animal carer: “Thank you. These animals are waiting for a new family. Fresh water and the right food every day keep them healthy.”' : '동물보호사: "고마워요. 이 아이들은 새 가족을 기다리고 있어요. 날마다 깨끗한 물과 알맞은 밥을 먹어야 건강해요."') + '</div>' + wordBox('shelter'))
      + '<div class="row"><button class="' + (st === 2 ? '' : 'sub') + '" data-a="x">' + (st === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdfeed'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); if (st === 2 && CUR && CUR.made.dogs) { const d0 = CUR.made.dogs[1]; A.bubble({ x: d0[0], y: d0[1], z: d0[2], sc: 0.6 }, e ? 'Woof!' : '멍멍!'); } return; }
      if (b.dataset.f != null) { const f = +b.dataset.f; if (f === st) { sfx('pop'); st++; if (st === 2) { s.fed = D; s.n = (s.n | 0) + 1; mark(); if (CUR && CUR.food) CUR.food.visible = true; reward('shelter', 'look', 2); A.rec('bldg', { k: 'shelter', ev: 'feed', mis }); boardDraw(); } paint(); return; } mis++; sfx('tick'); msg((e ? 'Animal carer: “' : '동물보호사: "') + why(st, f) + '"'); } };
    log('feed'); }
  // 🏦 은행: 이자(7일마다 · 통장 돈 100원에 2원꼴 · 10원 단위 · 한 번에 200원까지 · 500원보다 적으면 0) — 들어갈 때·창을 열 때 지난 주를 셈
  function bankInt() { const s = S().bank, D = day(); if (!s.wk) return 0; let n = 0, sum = 0;
    while (D - s.wk >= 7 && n < 8) { s.wk += 7; n++; const b = s.bal | 0, v0 = b >= 500 ? Math.min(200, Math.max(10, Math.floor(b * 0.02 / 10) * 10)) : 0; if (!v0) continue; const v = A.GAME.rw('money', 'bldg:bankint', v0) | 0; if (v > 0) { s.bal = b + v; sum += v; (s.hist || (s.hist = [])).push([s.wk, 'int', v, s.bal]); } }
    if (n) { if (s.hist) s.hist = s.hist.slice(-12); mark(); } if (sum) toast('🏦 ' + (en() ? 'Interest of ' + A.won(sum) + ' was added to your bankbook.' : '이자 ' + A.won(sum) + '이 통장에 붙었어요.'), 3); return sum; }
  function bank() { const s = S().bank, e = en(); bankInt(); let say9 = '';
    const pb = () => { const H9 = (s.hist || []).slice(-5); return '<table class="bd-pb"><tr><th>' + (e ? 'Day' : '날') + '</th><th>' + (e ? 'What' : '적은 것') + '</th><th>' + (e ? 'Amount' : '돈') + '</th><th>' + (e ? 'Balance' : '남은 돈') + '</th></tr>' + (H9.length ? H9.map(r => '<tr><td>' + esc(dayT(r[0])) + '</td><td>' + esc(kindT(r[1])) + '</td><td>' + esc(A.won(r[2])) + '</td><td>' + esc(A.won(r[3])) + '</td></tr>').join('') : '<tr><td colspan="4" style="text-align:center;color:#8a8f99">' + (e ? 'Nothing written yet' : '아직 적힌 줄이 없어요') + '</td></tr>') + '</table>'; };
    const bar = (lb, v, mx, c) => '<div class="bd-bar"><span>' + lb + '</span><i style="width:' + Math.max(1, Math.round(100 * v / mx)) + '%;background:' + c + '"></i><b>' + esc(A.won(v)) + '</b></div>';
    const draw = () => { const m = A.money() | 0, b = s.bal | 0, mx = Math.max(m, b, 1), half = Math.floor(m / 2 / 100) * 100, nx = s.wk ? 7 - (day() - s.wk) : 0;
      return '<h3>🏦 ' + esc(L(TIP.bank)) + '</h3><div class="sm">' + esc(say9 || (e ? 'Bank clerk: “Money you put in the bankbook is kept safe. Every 7 days the bank adds a little interest.”' : '은행원: "통장에 넣은 돈은 은행이 안전하게 지켜 줘요. 7일마다 이자를 조금 얹어 줘요."')) + '</div>'
        + bar(e ? '💰 Wallet' : '💰 지갑', m, mx, '#f2c230') + bar(e ? '📒 Bankbook' : '📒 통장', b, mx, '#5cbf8a') + pb()
        + '<div class="bd-two"><button data-d="1000"' + (m < 1000 ? ' disabled' : '') + '>' + (e ? 'Put in 1,000 won' : '1,000원 넣기') + '</button><button data-d="half"' + (half < 100 ? ' disabled' : '') + '>' + (e ? 'Put in half my money' : '가진 돈의 반 넣기') + '</button><button class="sub" data-w="1000"' + (b < 1000 ? ' disabled' : '') + '>' + (e ? 'Take out 1,000 won' : '1,000원 꺼내기') + '</button><button class="sub" data-w="all"' + (b < 1 ? ' disabled' : '') + '>' + (e ? 'Take it all out' : '다 꺼내기') + '</button></div>'
        + '<div class="sm">' + esc(s.wk ? (e ? 'Next interest in ' + nx + ' day(s).' : '다음 이자까지 ' + nx + '일 남았어요.') : (e ? 'Interest starts 7 days after your first saving.' : '처음 넣은 날부터 7일마다 이자가 붙어요.')) + '</div><div class="sm" data-m></div>' + wordBox('bank')
        + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>'; };
    const P = A.openP(draw(), false, 'bdbank'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; } const D = day(), H = s.hist || (s.hist = []);
      if (b.dataset.d) { const m = A.money() | 0, v = b.dataset.d === 'half' ? Math.floor(m / 2 / 100) * 100 : 1000; if (v < 100 || !A.pay(v)) { sfx('tick'); msg(e ? 'Not enough money in your wallet.' : '지갑에 돈이 모자라요.'); return; }
        s.bal = (s.bal | 0) + v; if (!s.wk) s.wk = D; H.push([D, 'in', v, s.bal]); s.hist = H.slice(-12); s.n = (s.n | 0) + 1; mark(); sfx('ding'); reward('bank', 'trade', 2); A.rec('bldg', { k: 'bank', ev: 'in', v }); boardDraw();
        say9 = e ? 'Bank clerk: “I wrote ' + A.won(v) + ' in your bankbook.”' : '은행원: "통장에 ' + A.won(v) + '을 넣고 한 줄 적었어요."'; paint(); return; }
      if (b.dataset.w) { const bl = s.bal | 0, v = b.dataset.w === 'all' ? bl : Math.min(1000, bl); if (v < 1) return; s.bal = bl - v; A.refund(v); H.push([D, 'out', v, s.bal]); s.hist = H.slice(-12); mark(); sfx('pop'); A.rec('bldg', { k: 'bank', ev: 'out', v }); boardDraw();
        say9 = e ? 'Bank clerk: “Here is ' + A.won(v) + '. It is back in your wallet.”' : '은행원: "' + A.won(v) + '을 꺼내 드렸어요. 지갑으로 돌아갔어요."'; paint(); } };
    log('bank'); }

  // 📦 우체국: 물건 고르기 → 받을 이웃 → 지도 보고 주소 칸 → 소포 값 → 접수증(다음 날 닿음)
  function nbPick(D) { const seen = new Set(), cells = new Set(), out = [], at = (CUR && CUR.door) || [0, 0];   /* 받을 이웃 = 이 우체국에서 가까운 아홉 가운데 셋(다음 날 걸어가 인사할 수 있게) · 날마다 바뀜 */
    const L9 = (A.nbs() || []).filter(q => q && q.hk && q.cell && !seen.has(q.hk) && seen.add(q.hk)).map(q => [Math.hypot(q.x - at[0], q.z - at[1]), q]).sort((a, b) => a[0] - b[0]).slice(0, 9).map(q => [hashS('nb:' + D + ':' + q[1].hk), q[1]]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
    for (const q of L9) { if (out.length >= 3) break; if (cells.has(q.cell)) continue; cells.add(q.cell); out.push(q); } return { pick: out, all: L9 }; }
  function post() { const s = S().post, e = en(), D = day();
    if (!A.open(POST_HRS[0], POST_HRS[1])) { toast('🌙 ' + (e ? 'The post counter is closed now. It opens at ' + hh(POST_HRS[0]) + '.' : '우체국 창구는 지금 문을 닫았어요. ' + hh(POST_HRS[0]) + '에 열어요.'), 3); return; }
    if ((s.box || []).some(q => q.d === D)) { toast('📦 ' + (e ? 'Post clerk: “Your parcel for today is with us. It arrives tomorrow morning. Come again tomorrow!”' : '우체국 직원: "오늘 소포는 벌써 받았어요. 내일 아침에 닿아요. 내일 또 와요!"'), 3.2); return; }
    const bag = A.bag(), goods = Object.keys(bag).filter(k => bag[k] > 0 && SENDK.includes((A.items[k] || [])[2])).slice(0, 8);
    if (!goods.length) { toast('📦 ' + (e ? 'Post clerk: “You have nothing to send. Bring food or a small thing in your bag.”' : '우체국 직원: "보낼 물건이 없어요. 가방에 먹거리나 작은 물건을 담아 와요."'), 3.2); return; }
    const NB = nbPick(D); if (!NB.pick.length) { toast('📦 ' + (e ? 'There is nobody to send to yet.' : '아직 소포를 받을 이웃이 없어요.'), 3); return; }
    let st = 0, it = null, nb = null, mis = 0, ADDR = [];
    const draw = () => '<h3>📦 ' + esc(L(TIP.post)) + '</h3>' + (st === 0
      ? '<div class="sm">' + esc(e ? 'Post clerk: “What would you like to send?” (1 of 4)' : '우체국 직원: "무엇을 보낼까요?" (1/4)') + '</div><div class="bd-two">' + goods.map(k => '<button class="sub" data-e="' + esc(k) + '">' + esc(k + ' ' + A.itemName(k)) + ' ×' + bag[k] + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 1 ? '<div class="sm">' + esc(e ? 'Post clerk: “Who is it for?” (2 of 4)' : '우체국 직원: "누구에게 보낼까요?" (2/4)') + '</div><div class="bd-ch">' + NB.pick.map((q, j) => '<button class="sub" data-n="' + j + '">' + esc(q.icon + ' ' + q.who) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 2 ? '<div class="sm">' + esc(e ? 'Post clerk: “Write the address. Which cell is the red dot in? Read the letter on top and the number on the left.” (3 of 4)' : '우체국 직원: "주소를 써요. 빨간 점은 어느 칸에 있나요? 위 글자와 왼쪽 숫자를 이어 읽어요." (3/4)') + '</div><canvas class="bd-map" width="340" height="220"></canvas><div class="bd-two">' + ADDR.map(c => '<button class="sub" data-c="' + esc(c) + '">' + esc(e ? 'Cell ' + c : c + ' 칸') + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 3 ? '<div class="bd-sit">' + [e ? 'Item: ' + it + ' ' + A.itemName(it) : '보내는 물건: ' + it + ' ' + A.itemName(it), e ? 'To: ' + nb.who : '받는 사람: ' + nb.who, e ? 'Address: cell ' + nb.cell : '주소: ' + nb.cell + ' 칸'].map(t => esc(t)).join('<br>') + '</div><div class="sm">' + esc(e ? 'Post clerk: “The parcel costs ' + A.won(PARCEL) + '. It arrives tomorrow.” (4 of 4)' : '우체국 직원: "소포 값은 ' + A.won(PARCEL) + '이에요. 내일 닿아요." (4/4)') + '</div><div class="row"><button data-p="1"' + ((A.money() | 0) < PARCEL ? ' disabled' : '') + '>' + (e ? 'Pay ' + A.won(PARCEL) + ' and send' : A.won(PARCEL) + ' 내고 보내기') + '</button></div><div class="sm" data-m>' + ((A.money() | 0) < PARCEL ? esc(e ? 'Not enough money. Help a worker or sell at a market first.' : '돈이 모자라요. 일꾼을 거들거나 장터에서 팔고 와요.') : '') + '</div>'
      : '<div class="pc-tx">' + esc(e ? 'Post clerk: “Thank you. Your parcel goes in the mail bag tonight and reaches ' + nb.who + ' in cell ' + nb.cell + ' tomorrow. Go and say hello!”' : '우체국 직원: "고마워요. 소포는 오늘 밤 우편 가방에 실려 내일 ' + nb.cell + ' 칸 ' + nb.who + '께 닿아요. 내일 가서 인사해 봐요!"') + '</div>' + wordBox('post'))
      + '<div class="row"><button class="' + (st === 4 ? '' : 'sub') + '" data-a="x">' + (st === 4 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdpost'), msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    let hit = null; const paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); hit = null; const cv = P.querySelector('canvas.bd-map'); if (cv && nb) { const me = A.me(); try { hit = A.mapGrid(cv, [{ x: nb.x, z: nb.z, label: nb.icon, main: true }, { x: me.x, z: me.z, label: e ? 'Me' : '나' }]); } catch (x9) { hit = null; } } };
    const addr = c => { if (c === nb.cell) { sfx('ding'); st = 3; paint(); return; } mis++; sfx('tick'); msg(e ? 'Post clerk: “Find the red dot, then go straight up to the letter and straight left to the number.”' : '우체국 직원: "빨간 점에서 위로 곧장 올라가면 글자, 왼쪽으로 곧장 가면 숫자가 있어요."'); };
    P.onclick = ev => { const cv = ev.target.closest && ev.target.closest('canvas.bd-map'); if (cv && typeof hit === 'function' && st === 2) { const r = cv.getBoundingClientRect(), c = hit((ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height); if (c) addr(c); return; }
      const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.e) { it = b.dataset.e; st = 1; sfx('tick'); paint(); return; }
      if (b.dataset.n != null) { nb = NB.pick[+b.dataset.n]; const oth = NB.all.map(q => q.cell).filter((c, i, a) => c && c !== nb.cell && a.indexOf(c) === i), two = pick(oth, 2, 'ad:' + D + nb.cell); ADDR = shuf([nb.cell, ...two].map(c => [c, c]), 'ad' + D).map(q => q[1][0]); st = 2; log('addr ' + nb.cell); sfx('tick'); paint(); return; }
      if (b.dataset.c) { addr(b.dataset.c); return; }
      if (b.dataset.p) { if (!((A.bag()[it] | 0) > 0)) { msg(e ? 'That item is no longer in your bag.' : '그 물건이 가방에 없어요.'); return; } if (!A.pay(PARCEL)) { sfx('tick'); msg(e ? 'Not enough money.' : '돈이 모자라요.'); return; } A.take(it);
        const B = (s.box || []).filter(q => !q.ok || D - q.ok < 3); B.push({ id: 'p' + D + '-' + ((s.n | 0) + 1), e: it, to: nb.hk, k: nb.k, who: nb.who, icon: nb.icon, cell: nb.cell, x: +nb.x.toFixed(1), z: +nb.z.toFixed(1), g: +(+nb.g).toFixed(2), d: D, ok: 0 }); s.box = B.slice(-8); s.n = (s.n | 0) + 1; mark();
        if (CUR && CUR.box) CUR.box.visible = true; sfx('ding'); reward('post', 'explore', 2); A.rec('bldg', { k: 'post', ev: 'send', e: it, cell: nb.cell, mis }); st = 4; paint(); } };
    log('post'); }
  // 1초마다(town.js): 어제 넘게 보낸 소포 = 아침에 한 줄 · 받는 이웃 10m 안에 가면 말풍선 + 하트(문 bldg:post)
  function sec() { facSec(); const s = S().post, D = day(), L9 = (s.box || []).filter(q => q && !q.ok && q.d < D); if (!L9.length) return; const e = en();
    if (s.told !== D && !A.panelOpen()) { s.told = D; mark(); const q = L9[0]; toast('📦 ' + (e ? 'Your parcel reached ' + q.who + ' in cell ' + q.cell + '. Go and say hello!' : '보낸 소포가 ' + q.cell + ' 칸 ' + q.who + '께 닿았어요. 가서 인사해 봐요.'), 4); return; }
    const me = A.me(); if (!me) return;
    for (const q of L9) { if (Math.hypot(me.x - q.x, me.z - q.z) > 10 || Math.abs(me.y - q.g) > 4) continue; q.ok = D; mark(); A.bubble({ x: q.x, y: q.g, z: q.z, sc: 1 }, e ? 'Got your parcel. Thank you!' : '소포 잘 받았어요. 고마워요!'); A.heartTo(q.to, 1, 'bldg:post'); sfx('ding');
      toast('📦 ' + (e ? q.who + ' got your ' + A.itemName(q.e) + ' and says thank you. ❤' : q.who + '이 ' + A.itemName(q.e) + ' 소포를 받고 고맙대요. ❤'), 3); A.rec('bldg', { k: 'post', ev: 'thx', cell: q.cell }); if (CUR && CUR.box) CUR.box.visible = false; break; } }
  // ───────── BLDG-3 창 ─────────
  const now9 = () => A.GAME.S.min | 0;
  const panelOf = (h, k) => { const P = A.openP(h, false, k); return { P, paint: h9 => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = h9; }, msg: t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; } }; };
  const choices = (L9, seed, attr) => '<div class="bd-ch">' + shuf(L9, seed).map(([, q]) => '<button class="sub" data-' + attr + '="' + q[0] + '">' + esc(L(q[1])) + '</button>').join('') + '</div><div class="sm" data-m></div>';
  // 🎬 영화관: 매표소 = 상영 시간표 + 집에서 온 쪽지('몇 시까지') → 끝나는 시각을 견줘 고르기 → 표 값 → 표(자리 다4) · 자리 E = 기다리기(시작 시각까지) → 장면 셋 → 시계 = 끝나는 시각
  function cinema() { const s = S().cinema, e = en(), D = day(), now = now9();
    if (s.seen === D) { toast('🎬 ' + (e ? 'Cinema staff: “You have seen a film today. Come again tomorrow!”' : '영화관 직원: "오늘은 벌써 영화를 봤어요. 내일 또 와요!"'), 3); return; }
    if (s.tk && s.tk.d === D) { const sh = SHOWS[s.tk.i]; toast('🎫 ' + (e ? 'Your ticket: ' + L(FILMS[sh[0]].t) + ' ' + hm(sh[1]) + ' · seat ' + s.tk.seat + '. Find the row letter on the left wall and the number on the seat.' : '내 표: ' + L(FILMS[sh[0]].t) + ' ' + hm(sh[1]) + ' · 자리 ' + s.tk.seat + '. 왼벽 줄 글자와 의자 번호를 찾아요.'), 4); return; }
    const up = SHOWS.map((q, i) => i).filter(i => SHOWS[i][1] > now).slice(0, 4);
    if (!up.length) { toast('🌙 ' + (e ? 'Cinema staff: “All of today’s films have started. The first film tomorrow is at 10:00.”' : '영화관 직원: "오늘 상영은 모두 시작했어요. 내일은 10:00에 첫 상영이에요."'), 3.2); return; }
    const lim = up.length >= 2 ? Math.ceil(SHOWS[up[hashS('lim:' + D) % (up.length - 1)]][2] / 30) * 30 : 22 * 60;
    let st = 0, mis = 0, got = -1;
    const row = i => { const sh = SHOWS[i]; return '<tr><td>' + esc(L(FILMS[sh[0]].t)) + '</td><td>' + hm(sh[1]) + '</td><td>' + hm(sh[2]) + '</td></tr>'; };
    const draw = () => '<h3>🎬 ' + esc(L(TIP.cinema)) + '</h3>' + (st === 0
      ? '<div class="sm">' + esc(e ? 'To do: pick a film that ends by the time on the note.' : '할 일: 쪽지에 적힌 시각까지 끝나는 영화를 골라요.') + '</div>'
        + '<div class="bd-sit">📝 ' + esc(up.length >= 2 ? (e ? 'Note from home: “Be home by ' + hm(lim) + '.”' : '집에서 온 쪽지: 「' + hm(lim) + '까지는 집에 와요.」') : (e ? 'This is the last film today.' : '오늘 마지막 상영이에요.')) + '<br>' + esc(e ? 'Now: ' + hm(now) : '지금 시각: ' + hm(now)) + '</div>'
        + '<table class="bd-pb"><tr><th>' + (e ? 'Film' : '영화') + '</th><th>' + (e ? 'Starts' : '시작') + '</th><th>' + (e ? 'Ends' : '끝') + '</th></tr>' + up.map(row).join('') + '</table>'
        + '<div class="bd-ch">' + up.map((i, j) => '<button class="sub" data-s="' + j + '">' + esc(hm(SHOWS[i][1]) + ' ' + L(FILMS[SHOWS[i][0]].t)) + '</button>').join('') + '</div>'
        + '<div class="sm">' + esc(e ? 'A ticket costs ' + A.won(TICKET) + '. Wallet: ' + A.won(A.money() | 0) : '표 값 ' + A.won(TICKET) + ' · 지갑 ' + A.won(A.money() | 0)) + '</div><div class="sm" data-m></div>'
      : '<div class="bd-sit">🎫 ' + esc(L(FILMS[SHOWS[got][0]].t)) + '<br>' + esc(e ? 'Starts ' + hm(SHOWS[got][1]) + ' · ends ' + hm(SHOWS[got][2]) : '시작 ' + hm(SHOWS[got][1]) + ' · 끝 ' + hm(SHOWS[got][2])) + '<br><b>' + esc(e ? 'Seat ' + s.tk.seat : '자리 ' + s.tk.seat) + '</b></div>'
        + '<div class="pc-tx">' + esc(e ? 'Cinema staff: “The row letter is on the left wall and the number is on the back of each seat. It is just like finding a cell on the town map!”' : '영화관 직원: "줄 글자는 왼벽에, 번호는 의자 등에 있어요. 마을 지도에서 칸 주소를 찾는 것과 같아요!"') + '</div>' + wordBox('cinema'))
      + '<div class="row"><button class="' + (st === 1 ? '' : 'sub') + '" data-a="x">' + (st === 1 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const W9 = panelOf(draw(), 'bdcine');
    W9.P.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.s != null) { const i = up[+b.dataset.s], sh = SHOWS[i];
        if (sh[2] > lim) { mis++; sfx('tick'); W9.msg(e ? 'Cinema staff: “That film ends at ' + hm(sh[2]) + '. That is later than ' + hm(lim) + ' on the note. Compare the end times.”' : '영화관 직원: "그 영화는 ' + hm(sh[2]) + '에 끝나요. 쪽지의 ' + hm(lim) + '보다 늦어요. 끝나는 시각을 견줘 봐요."'); return; }
        if (!A.pay(TICKET)) { sfx('tick'); W9.msg(e ? 'Not enough money in your wallet.' : '지갑에 돈이 모자라요.'); return; }
        got = i; s.tk = { d: D, i, seat: seatOf(D, i) }; s.n = (s.n | 0) + 1; mark(); sfx('ding'); A.rec('bldg', { k: 'cinema', ev: 'ticket', i, mis }); log('seat ' + s.tk.seat);
        const h = seatHot(s.tk.seat); if (h && CUR && CUR.k === 'cinema') { CUR.made.extra.push(h); if (A.addHot) { const p = [CUR.at[0] + h.stand[0], CUR.at[1], CUR.at[2] + h.stand[2]]; A.addHot({ kind: 'game', x: p[0], y: p[1], z: p[2], r: h.r, label: h.label, use: () => use('bd:seat') }); } }
        boardDraw(); st = 1; W9.paint(draw()); } };
    log('cinema'); }
  function seatUse() { const s = S().cinema, e = en(), D = day(), tk = s.tk;
    if (CUR && CUR.play) { filmStop(); toast('🎬 ' + (e ? 'You stopped the film. Your ticket works until its end time.' : '영화를 그만 봤어요. 표에 적힌 끝나는 시각 전에는 다시 앉아 볼 수 있어요.'), 3.2); return; }
    if (s.seen === D) { toast('🎬 ' + (e ? 'You have seen today’s film.' : '오늘 영화는 다 봤어요.'), 2.6); return; }
    if (!tk || tk.d !== D) { toast('🎫 ' + (e ? 'Buy a ticket at the ticket desk first.' : '먼저 매표소에서 표를 사요.'), 2.6); return; }
    const sh = SHOWS[tk.i], now = now9();
    if (now >= sh[2]) { s.tk = null; mark(); toast('🌙 ' + (e ? 'That film has already finished. A ticket is only for its own time.' : '그 상영은 벌써 끝났어요. 표는 적힌 시각에만 쓸 수 있어요.'), 3.2); return; }
    if (now < sh[1]) { const W9 = panelOf('<h3>🎫 ' + esc(e ? 'Seat ' + tk.seat : '자리 ' + tk.seat) + '</h3><div class="pc-tx">' + esc(e ? 'The film starts at ' + hm(sh[1]) + '. It is ' + hm(now) + ' now. Sit and wait?' : '영화는 ' + hm(sh[1]) + '에 시작해요. 지금은 ' + hm(now) + '이에요. 앉아서 기다릴까요?') + '</div><div class="row"><button data-w="1">' + (e ? 'Wait until ' + hm(sh[1]) : hm(sh[1]) + '까지 기다리기') + '</button><button class="sub" data-a="x">' + (e ? 'Later' : '나중에') + '</button></div>', 'bdseat');
      W9.P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.w) { A.GAME.waitMin(sh[1]); A.closeP(); play(); return; } A.closeP(); }; return; }
    play(); }
  // CINE-3: 자리에 앉음(몸 고정 · 화면 쪽) → 큰 화면에서 영화가 움직임(창 X · 관객석에서 봄) · 다 보면 시계 = 끝나는 시각 · 자리 E = 그만 보기 · 방을 나가면 멈춤·정리
  function play() { const s = S().cinema, e = en(), tk = s.tk; if (!tk || !CUR || CUR.play) return; const sh = SHOWS[tk.i], F = CINE[sh[0]], p9 = seatAt9(tk.seat);
    CUR.play = { f: sh[0], i: tk.i, T: 0, t0: performance.now() + 300, si: 0, n: 0, len: filmLen(F), last: 0, raf: 0, au: null }; sfx('pop');
    if (p9 && A.seat) A.seat(true, [CUR.at[0] + p9[0], CUR.at[1], CUR.at[2] + p9[1]]); if (A.goal) A.goal('🎬 ' + (e ? 'Now showing — E on your seat to stop' : '상영 중 — 그만 보려면 자리에서 E'));
    const M = A.mus && A.mus(); if (M && M.playEv) { M.hold(true); try { CUR.play.au = M.playEv(filmMusic(F), { lead: 0.3 }); } catch (er) { CUR.play.au = null; } }
    const P = CUR.play, loop = now => { if (!CUR || CUR.play !== P) return; P.raf = requestAnimationFrame(loop); if (now - P.last < 33) return; P.last = now; P.T = Math.max(0, (now - P.t0) / 1000); if (P.T >= P.len) { filmEnd(); return; } boardDraw(); };
    boardDraw(); P.raf = requestAnimationFrame(loop); log('play ' + tk.i); }
  function filmStop() { const P = CUR && CUR.play; if (!P) return; cancelAnimationFrame(P.raf); if (P.au) { try { P.au.stop(); } catch (er) { /* */ } } const M = A.mus && A.mus(); if (M && M.hold) M.hold(false); if (A.seat) A.seat(false); if (A.goal) A.goal(''); CUR.play = null; boardDraw(); }
  function filmEnd() { const s = S().cinema, e = en(), D = day(), tk = s.tk; if (!tk || !CUR || !CUR.play) return; const sh = SHOWS[tk.i]; filmStop();
    if (now9() < sh[2]) A.GAME.waitMin(sh[2]); s.seen = D; mark(); reward('cinema', 'explore', 2); A.rec('bldg', { k: 'cinema', ev: 'watch', i: tk.i }); boardDraw();
    toast('🎬 ' + (e ? 'The film is over. It is ' + hm(now9()) + ' now — the end time on your ticket.' : '영화가 끝났어요. 지금 ' + hm(now9()) + ' — 표에 적힌 끝나는 시각이에요.'), 3.6); }
  // 🚚 BLDG-3b 공장 → 가게·장터: 만든 다음 날(사흘 안) 아침 = 상자가 트럭에 실려 가게(젤리 케이크 → 빵집·가게)·장터(감자 → 장터)에 들어옴 · 갈 곳은 마을 쪽(A.facDest)이 판 이름으로 고름 · 그 창에 '우리가 만든 것' 한 칸 · 보상 X(솜씨는 공장에서 받음)
  const facNow = () => { const q = S().factory.dl; return q && !q.none && day() - q.d <= 1 ? q : null; };   /* 들어온 날 + 다음 날까지 진열 */
  function facDeliv() { const s = S().factory, D = day(); if (!(s.made > 0) || s.made >= D || D - s.made > 3 || (s.dl && s.dl.m === s.made)) return facNow();
    const ln = LINES[s.ln] ? s.ln : 'farm', G = FAC_GOOD[ln], to = A.facDest ? A.facDest(ln, s.door || null) : null;
    s.dl = to ? { m: s.made, d: D, ln, e: G.e, v: G.v, kind: to.kind, key: to.key, to: to.name, at: to.at || null, nm: s.nm || '', left: FAC_N } : { m: s.made, d: D, none: 1 }; mark();
    if (to) { if (A.diary) A.diary('🏭', facLine(s.dl, false)); A.rec('bldg', { k: 'factory', ev: 'deliv', line: ln, to: to.kind }); log('deliv ' + ln + ' ' + to.name); }
    return facNow(); }
  function facLine(q, e) { const n = Math.max(1, q.d - q.m), p = LINES[q.ln].p, nm = q.nm || (e ? 'the factory' : '공장'), ago = n => e ? (n === 1 ? 'yesterday' : n + ' days ago') : (n === 1 ? '어제' : n === 2 ? '그저께' : '사흘 전');
    return e ? 'The boxes of ' + L(p) + ' made at ' + nm + ' ' + ago(n) + ' came to ' + q.to + ' by truck' : ago(n) + ' ' + nm + '에서 만든 ' + p[0] + ' 상자가 트럭에 실려 ' + q.to + '에 들어왔어요'; }
  function facSec() { const q = facDeliv(); if (!q || q.d !== day() || q.told === q.d || A.panelOpen()) return; q.told = q.d; mark(); toast('🚚 ' + facLine(q, en()), 4); }   /* 아침 한 번 = 한 줄(창이 닫혀 있을 때) */
  function facNews(d) { const q = facDeliv(); return q && q.d === d ? [{ k: q.ln, t: [facLine(q, false), facLine(q, true)], at: q.at }] : []; }
  function facAt(kind, key) { const q = facDeliv(); return q && q.kind === kind && q.key === key ? { e: q.e, v: q.v, left: q.left | 0, nm: q.nm, ln: q.ln, ago: ago(Math.max(1, day() - q.m)) } : null; }
  function facTake(kind, key) { const q = facNow(); if (!q || q.kind !== kind || q.key !== key || !(q.left > 0)) return false; q.left--; mark(); A.rec('bldg', { k: 'factory', ev: 'buy', line: q.ln }); return true; }
  // 🏭 공장: 일 다섯을 1번 자리부터 차례로 → 분업 물음 → 줄 끝 깔판에 오늘 만든 상자
  function factory() { const s = S().factory, e = en(), D = day(), kd = (CUR && CUR.made.line) || 'farm', LN = LINES[kd];
    if (s.made === D) { toast('🏭 ' + (e ? 'Factory worker: “The line has run today. Come and watch again tomorrow!”' : '공장 직원: "오늘 줄은 벌써 돌았어요. 내일 또 견학 와요!"'), 3); return; }
    let st = 0, mis = 0; const got = [], OR = shuf(LN.st.map((t, j) => [j, t]), 'ln:' + D);
    const slots = () => '<div class="bd-sit">' + LN.st.map((t, j) => (j + 1) + '. ' + (j < got.length ? '<b>' + esc(L(t)) + '</b>' : '?')).join('<br>') + '</div>';
    const draw = () => '<h3>🏭 ' + esc(L(TIP.factory)) + '</h3>' + (st === 0
      ? '<div class="sm">' + esc(e ? 'To do: give the jobs to places 1 to 5 in the order things are made (' + got.length + '/5).' : '할 일: 만드는 차례대로 1번 자리부터 일을 맡겨요 (' + got.length + '/5).') + '</div>' + slots()
        + '<div class="bd-ch">' + OR.filter(([, q]) => !got.includes(q[0])).map(([, q]) => '<button class="sub" data-j="' + q[0] + '">' + esc(L(q[1])) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 1 ? slots() + '<div class="sm">' + esc(e ? 'Factory worker: “Five people each do one job. What is good about that?”' : '공장 직원: "다섯 사람이 한 가지씩 나누어 맡았어요. 무엇이 좋을까요?"') + '</div>' + choices(WHY_DIV, 'dv:' + D, 'v')
      : '<div class="pc-tx">' + esc(e ? 'Factory worker: “The line is running! Today’s boxes of ' + L(LN.p) + ' are stacked at the end of the line. A truck takes them to the shops.”' : '공장 직원: "줄이 돌아가요! 오늘 만든 ' + L(LN.p) + ' 상자가 줄 끝 깔판에 쌓였어요. 트럭에 실려 가게로 가요."') + '</div>' + wordBox('factory'))
      + '<div class="row"><button class="' + (st === 2 ? '' : 'sub') + '" data-a="x">' + (st === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const W9 = panelOf(draw(), 'bdline');
    W9.P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.j != null) { const j = +b.dataset.j; if (j === got.length) { got.push(j); sfx('pop'); if (got.length === 5) st = 1; W9.paint(draw()); return; }
        mis++; sfx('tick'); W9.msg(got.length ? (e ? 'Factory worker: “Not yet. Place ' + (got.length + 1) + ' gets what comes out of “' + L(LN.st[got.length - 1]) + '”. What happens next?”' : '공장 직원: "아직 일러요. ' + (got.length + 1) + '번 자리는 「' + L(LN.st[got.length - 1]) + '」을 마친 것을 받아요. 그다음은 무엇일까요?"') : (e ? 'Factory worker: “Place 1 comes first. Start with the raw materials.”' : '공장 직원: "1번 자리가 맨 처음이에요. 원료를 다루는 일부터 해요."')); return; }
      if (b.dataset.v != null) { if (+b.dataset.v === 1) { st = 2; s.made = D; s.n = (s.n | 0) + 1; s.ln = kd; s.nm = (CUR && CUR.name) || ''; s.door = (CUR && CUR.door) || null; mark(); if (CUR && CUR.prod) CUR.prod.visible = true; sfx('ding'); reward('factory', 'work', 2); A.rec('bldg', { k: 'factory', ev: 'line', line: kd, mis }); boardDraw(); W9.paint(draw()); return; }
        mis++; sfx('tick'); W9.msg(e ? 'Factory worker: “Think again. If five people each do one job at the same time, what happens?”' : '공장 직원: "다시 생각해 봐요. 다섯 사람이 같은 때에 저마다 한 가지를 하면 어떻게 될까요?"'); } };
    log('line ' + kd); }
  // 👵 노인정·경로당: 옛 땅이름 셋 + '돌다리' 낱말 뜻 → 벽 판에 들은 이름
  function elder() { const s = S().elder, e = en(), D = day();
    if (s.heard === D) { toast('👵 ' + (e ? 'Elder: “That is all my stories for today. Come and visit again tomorrow.”' : '어르신: "오늘 이야기는 다 했단다. 내일 또 놀러 오렴."'), 3); return; }
    const Q = pick(OLDN, 3, 'old:' + D).concat([OUR_N]); let i = 0, mis = 0;
    const draw = () => '<h3>👵 ' + esc(L(TIP.elder)) + '</h3>' + (i < Q.length
      ? '<div class="sm">' + esc((e ? 'To do: pick what the name means (' + (i + 1) + '/' + Q.length + ').' : '할 일: 이름의 뜻을 골라요 (' + (i + 1) + '/' + Q.length + ').') + (i === 0 ? (e ? ' Elder: “Long ago, people named places after how the land looked or the work done there.”' : ' 어르신: "옛날 사람들은 땅 모양이나 그곳에서 하던 일을 보고 이름을 지었단다."') : '')) + '</div>'
        + '<div class="bd-sit" style="font-size:22px;font-weight:900;text-align:center">「' + esc(L(Q[i][0])) + '」</div>' + choices([[1, Q[i][1]], [0, Q[i][2][0]], [0, Q[i][2][1]]], 'on:' + D + ':' + i, 'o')
      : '<div class="pc-tx">' + esc(e ? 'Elder: “Can you picture the old days just from the names? When you see a name sign on the road, think about what it means.”' : '어르신: "이름만 들어도 옛 모습이 떠오르지? 길에서 이름 팻말을 보면 무슨 뜻일지 생각해 보렴."') + '</div>' + wordBox('elder'))
      + '<div class="row"><button class="' + (i >= Q.length ? '' : 'sub') + '" data-a="x">' + (i >= Q.length ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const W9 = panelOf(draw(), 'bdelder');
    W9.P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.o == null) return;
      if (+b.dataset.o === 1) { const nm = L(Q[i][0]).split(' ')[0], g = s.got || (s.got = []); if (!g.includes(nm)) g.push(nm); s.got = g.slice(-8); sfx('pop'); i++; if (i >= Q.length) { s.heard = D; s.n = (s.n | 0) + 1; mark(); reward('elder', 'explore', 2); A.rec('bldg', { k: 'elder', ev: 'names', mis }); boardDraw(); } W9.paint(draw()); return; }
      mis++; sfx('tick'); W9.msg((e ? 'Elder: “' : '어르신: "') + L(Q[i][3]) + '"'); };
    log('elder'); }
  function gonu() { const e = en(); if (A.table && A.table('gonu', { who: e ? 'Elder' : '노인정 어르신' })) return; toast('⚪ ' + (e ? 'Elder: “Let’s play another time.”' : '어르신: "다음에 한 판 두자꾸나."'), 2.6); }
  // 🏺 박물관: 옛 물건 하나 = 쓰임 → 오늘날 무엇이 이 일을 하나 → 한 줄 · 받침대에 금빛 표
  function museum(k) { const m = MUSE[k]; if (!m) return; const s = S().museum, e = en(), D = day(); let st = 0, mis = 0;
    const draw = () => '<h3>🏺 ' + esc(L(m[0])) + '</h3>' + (st === 0
      ? '<div class="sm">' + esc(e ? 'Curator: “What did people long ago use this for?” (1/2)' : '학예사: "옛날 사람들은 이것으로 무엇을 했을까요?" (1/2)') + '</div>' + choices([[1, m[1]], [0, m[2][0]], [0, m[2][1]]], 'mu:' + k + ':' + D, 'o')
      : st === 1 ? '<div class="bd-sit">✓ ' + esc(L(m[1])) + '</div><div class="sm">' + esc(e ? 'Curator: “What does this job today?” (2/2)' : '학예사: "오늘날에는 무엇이 이 일을 할까요?" (2/2)') + '</div>' + choices([[1, m[3]], [0, m[4][0]], [0, m[4][1]]], 'mn:' + k + ':' + D, 'o')
      : '<div class="bd-sit">✓ ' + esc(L(m[1])) + '<br>✓ ' + esc((e ? 'Today: ' : '오늘날: ') + L(m[3])) + '</div><div class="pc-tx">' + esc(L(m[5])) + '</div>' + (Object.keys(s.got || {}).length >= MUSE.length ? wordBox('museum') : ''))
      + '<div class="row"><button class="' + (st === 2 ? '' : 'sub') + '" data-a="x">' + (st === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const W9 = panelOf(draw(), 'bdmu');
    W9.P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.o == null) return;
      if (+b.dataset.o === 1) { sfx('pop'); st++; if (st === 2) { const g = s.got || (s.got = {}); if (!g[k]) g[k] = D; mark(); if (CUR && CUR.stars && CUR.stars[k]) CUR.stars[k].visible = true; reward('museum', 'look', 2); A.rec('bldg', { k: 'museum', ev: 'item', i: k, mis }); boardDraw(); } W9.paint(draw()); return; }
      mis++; sfx('tick'); W9.msg(e ? 'Curator: “Look closely at its shape. What could it hold, turn or carry?”' : '학예사: "생김새를 잘 봐요. 무엇을 담거나, 돌리거나, 나를 수 있을까요?"'); };
    log('museum ' + k); }

  // ───────── DEPTH-1 창구 손님 ─────────
  const hasB = w => { const c = String(w).trim().slice(-1).charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; };   /* 받침 있음 → 이에요·이·은 */
  const ieyo = w => w + (hasB(w) ? '이에요' : '예요'), iga = w => w + (hasB(w) ? '이' : '가'), eun = w => w + (hasB(w) ? '은' : '는');
  const uniqNb = () => { const seen = new Set(); return (A.nbs() || []).filter(q => q && q.hk && q.cell && !seen.has(q.hk) && seen.add(q.hk)); };
  const tourList = () => { const dr = CUR && CUR.door; if (!dr) return []; const off = q => { const a = Math.atan2(q.x - dr[0], -(q.z - dr[1])) / (Math.PI / 4); return Math.abs(a - Math.round(a)) * 45; };   /* 방위 가운데에서 벗어난 각(도) */
    const L9 = uniqNb().filter(q => Math.hypot(q.x - dr[0], q.z - dr[1]) >= 45).sort((a, b) => (a.hk < b.hk ? -1 : 1)), C9 = L9.filter(q => off(q) <= 14); return C9.length >= 2 ? C9 : L9; };   /* 두 방위 사이에 걸친 곳(애매한 답)은 빼고 */
  const cellList = () => { const out = [], cells = new Set(); for (const q of nbPick(day()).all) { if (cells.has(q.cell)) continue; cells.add(q.cell); out.push(q); } return out; };   /* 우체국 곁 이웃(칸이 서로 다른 것만) */
  const visOk = (k, t) => (t === 'tour' ? tourList().length > 0 : t === 'addr' || t === 'wet' ? cellList().length >= 3 : true);
  function visPick(k, D) { const s = S()[k], T9 = VTYPE[k]; if (!T9) return null; if (s.vt && s.vt.d === D) return s.vt;
    const H9 = Array.isArray(s.vh) ? s.vh : [], lastT = H9.length ? String(H9[H9.length - 1]).split(':')[0] : '';
    let types = T9.filter(t => t !== lastT && visOk(k, t)); if (!types.length) types = T9.filter(t => visOk(k, t)); if (!types.length) return null;
    const cand = []; for (const t of types) for (let v = 0; v < VNUM[t]; v++) { const id = t + ':' + v; if (!H9.slice(-2).includes(id)) cand.push(id); }
    if (!cand.length) return null; const id = cand.map(q => [hashS('vis:' + k + ':' + D + ':' + q), q]).sort((a, b) => a[0] - b[0])[0][1];
    s.vt = { d: D, id, p: hashS('vp:' + k + ':' + D) % 997 }; s.vh = H9.concat([id]).slice(-6); mark(); return s.vt; }   /* 오늘 손님 = 들어갈 때 한 번 정함(같은 날은 같은 손님) */
  function visPlace(k, made, K) { if (!VTYPE[k] || !K || !CUR || !made || !made.S) return; const D = day(), s = S()[k]; let vt = null; try { vt = visPick(k, D); } catch (x9) { vt = null; } CUR.vis = vt; if (!vt) return; if (s.vok === D) { CUR.visGone = true; return; }   /* 오늘 손님은 도와드린 뒤 돌아감 */
    const S9 = made.S, [ox, oy, oz] = S9.at, [lx, lz] = VAT[k], t = vt.id.split(':')[0], Lk = VLOOK[t], ad = Lk[0] % 3 ? 1 : 0.75;
    K.standGuest(S9, ox + lx, oy, oz + lz, 0, Lk[0]);
    if (Lk[1]) K.part(S9, 's', lx, 1.54 * ad, lz, 0.163 * ad, 0.75, 0, 0xdcdcdc);   /* 흰머리(머리카락 공보다 조금 큼) */
    if (Lk[2]) K.part(S9, 'b', lx + 0.3, 0, lz + 0.14, 0.03, 0.86 * ad, 0.03, 0x6b4a2f);   /* 지팡이 */
    if (Lk[3]) K.part(S9, 'b', lx, 0.86 * ad, lz - 0.23, 0.28 * ad, 0.36 * ad, 0.12, [0x3d74c9, 0xe0453a, 0x3c9a5a][vt.p % 3]);   /* 배낭(등에 닿음) */
    if (Lk[4] >= 0) K.standGuest(S9, ox + lx + 0.55, oy, oz + lz + 0.1, 0, Lk[4]);   /* 곁에 선 어린이 */
    if (Lk[5] >= 0 && made.seats && made.seats.length && K.sitGuest) K.sitGuest(S9, made.seats, 0, Lk[5]);   /* 기다리는 의자에 앉은 할아버지 */
    CUR.visAt = [ox + lx, oy + 1.7 * ad, oz + lz];
    (made.extra || (made.extra = [])).push({ k: 'bd:vis', stand: [lx, 0, lz + 0.85], r: 1.0, label: '🙋 ' + (en() ? 'Visitor: ' : '찾아온 손님 — ') + L(VWHO[t]) }); log('vis ' + k + ' ' + vt.id); }
  const billDraw = (cv, n) => { const g = cv.getContext('2d'), W = cv.width, H = cv.height, x0 = 16, y0 = 14, w = W - 32, h = H - 28, cw = w / 5, chh = h / 4, kept = (c, r) => c * 4 + r < n;
    g.fillStyle = '#f6f9fc'; g.fillRect(0, 0, W, H); g.setLineDash([5, 4]); g.strokeStyle = '#8a8f99'; g.lineWidth = 1.5; g.strokeRect(x0, y0, w, h); g.setLineDash([]);
    for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) if (kept(c, r)) { g.fillStyle = (c + r) % 2 ? '#bfe0c4' : '#b3d8b9'; g.fillRect(x0 + c * cw, y0 + r * chh, cw + 0.5, chh + 0.5); }
    g.strokeStyle = 'rgba(43,36,32,.25)'; g.lineWidth = 1; for (let c = 1; c < 5; c++) { g.beginPath(); g.moveTo(x0 + c * cw, y0); g.lineTo(x0 + c * cw, y0 + h); g.stroke(); } for (let r = 1; r < 4; r++) { g.beginPath(); g.moveTo(x0, y0 + r * chh); g.lineTo(x0 + w, y0 + r * chh); g.stroke(); }
    g.fillStyle = '#2f6d5a'; g.font = '900 22px ' + FONT; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(en() ? '1,000' : '천 원', x0 + 10, y0 + chh * 0.6); g.font = '700 12px ' + FONT; g.fillStyle = '#5a6a60'; g.fillText(en() ? 'dotted line = whole note' : '점선 = 원래 크기', x0 + 6, y0 + h - 10); };
  const bikeSvg = (fr, st, lk, v) => { const F = v === 1 ? '<g transform="translate(121 88) rotate(-76)"><rect x="-26" y="-7" width="52" height="14" rx="3" fill="#2b2420"/><text x="0" y="4" font-size="10" fill="#fff" text-anchor="middle">' + fr + '</text></g>' : v === 2 ? '<rect x="104" y="128" width="52" height="14" rx="3" fill="#2b2420"/><text x="130" y="139" font-size="10" fill="#fff" text-anchor="middle">' + fr + '</text>' : '<g transform="translate(165 90) rotate(-34)"><rect x="-26" y="-7" width="52" height="14" rx="3" fill="#2b2420"/><text x="0" y="4" font-size="10" fill="#fff" text-anchor="middle">' + fr + '</text></g>';
    return '<svg viewBox="0 0 300 160" style="width:100%;max-width:320px;display:block;margin:6px auto;background:#f6f9fc;border-radius:8px" aria-hidden="true"><circle cx="70" cy="115" r="34" fill="none" stroke="#2b2420" stroke-width="5"/><circle cx="222" cy="115" r="34" fill="none" stroke="#2b2420" stroke-width="5"/>'
      + '<path d="M70 115 L130 118 L115 55 L200 60 L130 118 M70 115 L115 55 M200 60 L222 115" stroke="#3d74c9" stroke-width="6" fill="none" stroke-linejoin="round"/><rect x="100" y="44" width="32" height="9" rx="4" fill="#2b2420"/><path d="M200 60 L196 44 L212 40" stroke="#2b2420" stroke-width="5" fill="none"/>'
      + '<rect x="206" y="44" width="52" height="30" fill="#d9b27a" stroke="#8a5a34" stroke-width="2"/><rect x="217" y="51" width="30" height="16" fill="#fff" stroke="#e0453a" stroke-width="2"/><text x="232" y="63" font-size="11" text-anchor="middle">' + st + '</text>'
      + '<rect x="40" y="128" width="40" height="18" rx="5" fill="#f2c230" stroke="#2b2420" stroke-width="2"/><text x="60" y="141" font-size="11" text-anchor="middle">' + lk + '</text>' + F + '</svg>'; };
  function visCase(k, vt) { const e = en(), [t, v0] = vt.id.split(':'), v = +v0, p = vt.p | 0, sp = (ko, e9) => (e ? e9 : ko), O = (ok, h, w) => ({ ok: ok ? 1 : 0, h, w: w || '' });
    const C = { t, v, who: L(VWHO[t]), ask: '', view: '', after: null, ch: [], thx: '', sk: { police: 'explore', clinic: 'work', bank: 'trade', post: 'explore', museum: 'look' }[k] };
    if (t === 'tour') { const L9 = tourList(), q = L9.length ? L9[(p + v * 7) % L9.length] : null, dr = CUR && CUR.door; if (!q || !dr) return null; const a = Math.atan2(q.x - dr[0], -(q.z - dr[1])), di = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
      C.ask = sp('관광객: "' + q.who + ' 계신 곳에 가 보고 싶어요. 지도로 보면 여기서 어느 쪽이에요?"', 'Tourist: “I want to visit the ' + q.who + '. On the map, which way is it from here?”');
      C.view = '<canvas class="bd-map" width="340" height="220"></canvas><div class="sm">' + esc(sp('빨간 점 = 가고 싶은 곳 · 노란 점 = 여기 · 위가 북쪽', 'Red dot = where they want to go · yellow dot = here · up is north')) + '</div>';
      C.after = P => { const cv = P.querySelector('canvas.bd-map'); if (cv) try { A.mapGrid(cv, [{ x: q.x, z: q.z, label: q.icon, main: true }, { x: dr[0], z: dr[1], label: e ? 'Here' : '여기' }]); } catch (x9) { /* 지도 없음 */ } };
      C.cmp = true; C.ch = DIR8K.map((d, j) => O(j === di, esc(L(d)), sp('관광객: "' + L(d) + '쪽이요? 노란 점에서 빨간 점을 보면 그쪽이 아닌 것 같아요. 지도는 위가 북쪽이지요?"', 'Tourist: “' + L(d) + '? From the yellow dot the red dot doesn’t look that way. Up is north, right?”')));
      C.thx = sp('관광객: "' + L(DIR8K[di]) + '쪽이군요! 지도 보는 법도 알았어요. 고마워요!"', 'Tourist: “' + L(DIR8K[di]) + ', then! Thank you!”'); C.ans = di; }
    else if (t === 'wallet') { const c0 = v % 4, i0 = (p + v) % 4, c1 = (c0 + 1 + (p % 3)) % 4, i1 = (i0 + 1 + ((p >> 2) % 3)) % 4, cn = j => L(WCOL[j][0]), it = j => L(WIN[j]);
      C.ask = sp('손님: "지갑을 잃어버렸어요. 쪽지에 적어 왔어요. 주운 물건 상자에 제 것이 있을까요?"', 'Visitor: “I lost my wallet. I wrote it down. Is mine in the lost-and-found box?”');
      C.view = '<div class="bd-sit">' + esc(sp('손님 쪽지 — 색: ' + cn(c0) + ' · 안에 든 것: ' + it(i0), 'Note — colour: ' + cn(c0) + ' · inside: ' + it(i0))) + '</div><div class="sm">' + esc(sp('주운 물건 상자', 'Lost-and-found box')) + '</div>'; C.grid = true;
      const card = (c, i) => '<b style="background:' + WCOL[c][1] + '"></b>' + esc(sp('안에: ', 'Inside: ') + it(i));
      C.ch = [O(1, card(c0, i0)), O(0, card(c0, i1), sp('손님: "색은 맞는데 안에 든 것이 달라요. 제 지갑엔 ' + iga(it(i0)) + ' 들어 있어요."', 'Visitor: “The colour is right, but mine has ' + it(i0) + ' inside.”')), O(0, card(c1, i0), sp('손님: "안에 든 것은 같은데, 제 지갑은 ' + ieyo(cn(c0)) + '."', 'Visitor: “Same thing inside, but mine is ' + cn(c0) + '.”'))];
      C.thx = sp('손님: "맞아요, 제 지갑이에요! 색도 안에 든 것도 꼼꼼히 봐 줘서 고마워요."', 'Visitor: “That’s mine! Thank you for checking so carefully.”'); }
    else if (t === 'bike') { const fr = 'KB' + (1000 + (p * 7 + v * 131) % 9000), st = String(10 + (p * 3 + v) % 89), lk = String(1000 + (p * 13 + v * 77) % 9000).slice(-4);
      C.ask = sp('어린이: "자전거를 잃어버렸을 때 찾을 수 있게 번호를 적어 내래요. 어떤 번호를 적어요?"', 'Child: “They want a number so they can find my bike if it gets lost. Which number do I write?”');
      C.view = bikeSvg(fr, st, lk, v) + '<div class="sm">' + esc(sp('자전거에 보이는 번호 셋', 'Three numbers on the bike')) + '</div>';
      C.ch = [O(1, esc(fr)), O(0, esc(st), sp('어린이: "그건 바구니에 붙인 스티커예요. 스티커는 떼어지면 없어지잖아요. 떼어지지 않는 번호가 있을까요?"', 'Child: “That’s a sticker on the basket. Stickers can come off. Is there a number that can’t?”')), O(0, esc(lk), sp('어린이: "앗, 그건 자물쇠 번호예요! 자물쇠 번호는 남에게 알려 주면 안 되잖아요."', 'Child: “Oh, that’s my lock code! I shouldn’t tell anyone that.”'))];
      C.thx = sp('어린이: "자전거 몸에 새긴 번호구나! 이건 떼어지지도 않고 자전거마다 달라요. 고마워요!"', 'Child: “The number stamped on the frame! It never comes off and every bike has its own. Thanks!”'); }
    else if (t === 'kid') { C.ask = sp('보호자: "아이가 놀이터에서 넘어져 무릎이 살짝 까졌어요. 무엇부터 해 줄까요?"', 'Parent: “My child fell at the playground and scraped a knee a little. What do we do first?”');
      C.view = '<div class="bd-sit">' + esc(v ? sp('아이 무릎: 집에서 깨끗한 물로 씻고 왔어요. 흙은 없어요.', 'Knee: already washed with clean water at home. No dirt.') : sp('아이 무릎: 흙과 모래가 묻어 있어요.', 'Knee: there is dirt and sand on it.')) + '</div>';
      C.ch = [O(!v, esc(sp('깨끗한 물로 흙을 씻어 내요', 'Wash the dirt off with clean water')), sp('보호자: "벌써 깨끗이 씻고 왔어요. 그다음은요?"', 'Parent: “We already washed it. What next?”')), O(v, esc(sp('깨끗한 밴드로 덮어요', 'Cover it with a clean plaster')), sp('보호자: "흙이 묻은 채로 덮으면 흙이 안에 갇힐 것 같아요. 먼저 무엇을 할까요?"', 'Parent: “If we cover it with dirt on, the dirt gets trapped. What first?”')), O(0, esc(sp('침을 발라 줘요', 'Put spit on it')), sp('보호자: "입 안에는 세균이 많대요. 다른 방법은요?"', 'Parent: “Mouths are full of germs, they say. Another way?”'))];
      C.thx = v ? sp('보호자: "깨끗한 밴드로 덮었어요. 고마워요!"', 'Parent: “Covered with a clean plaster. Thank you!”') : sp('보호자: "흙부터 씻어 내야 덧나지 않는군요. 씻고 밴드를 붙일게요. 고마워요!"', 'Parent: “Wash the dirt off first so it doesn’t get worse. Thank you!”'); }
    else if (t === 'bee') { C.ask = sp('이웃: "밭일하다 벌에 쏘였어요. 어떻게 하면 좋을까요?"', 'Neighbour: “A bee stung me in the field. What should I do?”'); C.view = '<div class="bd-sit">' + esc(L(BEE[v])) + '</div>';
      const why = j => (j === 3 ? BEEW[3] : v === 2 ? BEEW[1] : j === 0 ? BEEW[0] : j === 2 ? BEEW[2] : T2('침이 아직 박혀 있어요. 침부터 빼야 하지 않을까요?', 'The stinger is still in. Shouldn’t it come out first?'));
      C.ch = BEEC.map((q, j) => O(j === v, esc(L(q)), sp('이웃: "', 'Neighbour: “') + L(why(j)) + sp('"', '”')));
      C.thx = v === 2 ? sp('간호사 선생님: "숨이 차거나 얼굴이 부으면 몸 전체가 놀란 거예요. 바로 119에 알린 게 맞아요."', 'Nurse: “Trouble breathing or a swelling face means the whole body is reacting. Calling 119 straight away was right.”') : sp('이웃: "한결 나아요. 고마워요!"', 'Neighbour: “That feels much better. Thank you!”'); }
    else if (t === 'heat') { C.ask = sp('보호자: "할아버지가 더운 밭에서 오셔서 어지럽대요. 의자에 앉아 계세요."', 'Carer: “Grandpa came in from a hot field and feels dizzy. He is sitting on the chair.”');
      C.view = '<div class="bd-sit">' + esc(v ? sp('할아버지: 불러도 대답이 흐려요. 어리둥절해하세요.', 'Grandpa: he answers only faintly and seems confused.') : sp('할아버지: 말을 또렷하게 하세요. 얼굴이 빨갛고 땀을 많이 흘려요.', 'Grandpa: he speaks clearly. His face is red and he is sweating a lot.')) + '</div>';
      C.ch = [O(!v, esc(sp('시원한 곳에서 물을 조금씩 드려요', 'Cool place, and sips of water')), sp('보호자: "대답도 흐린데 물을 드려도 될까요? 사레들릴 것 같아요."', 'Carer: “He can hardly answer. Is water safe? He might choke.”')), O(v, esc(sp('물은 드리지 말고 바로 119에 알려요', 'No water, call 119 straight away')), sp('보호자: "말씀은 또렷하게 하세요. 여기서 먼저 식혀 드릴 수 있지 않을까요?"', 'Carer: “He speaks clearly. Can’t we cool him down here first?”')), O(0, esc(sp('뜨거운 차를 드려요', 'Give him hot tea')), sp('보호자: "더위를 먹었는데 뜨거운 차는 몸을 더 덥힐 것 같아요."', 'Carer: “He has heat sickness. Hot tea would warm him up even more.”'))];
      C.thx = v ? sp('간호사 선생님: "정신이 흐리면 아무것도 먹이지 않고 119를 기다려요. 잘 골랐어요."', 'Nurse: “If someone is not fully awake, give nothing and wait for 119. Good choice.”') : sp('보호자: "그늘에서 물을 조금씩 드시니 한결 나아지셨어요. 고마워요!"', 'Carer: “Shade and sips of water, and he is much better. Thank you!”'); }
    else if (t === 'bill') { const n = [16, 9, 3][v] + (p % 4); C.ans = n;
      C.ask = sp('어린이: "돼지 저금통에서 꺼낸 천 원이 찢어졌어요. 이것도 저금할 수 있어요?"', 'Child: “The 1,000-won note from my piggy bank is torn. Can I still save it?”');
      C.view = '<canvas class="bd-bill" width="320" height="150"></canvas><div class="bd-rule">' + esc(sp('은행 안내판 — 찢어진 돈 바꾸기: 남은 부분이 4분의 3 넘으면 전부 · 5분의 2 넘으면 반 · 그보다 적으면 못 바꿔요', 'Bank notice — torn notes: more than 3/4 left = full value · more than 2/5 left = half · less = cannot be changed')) + '</div>';
      C.after = P => { const cv = P.querySelector('canvas.bd-bill'); if (cv) billDraw(cv, n); };
      const re = sp('어린이: "음… 남은 칸이 안내판 글과 맞아요? 점선 칸과 다시 견줘 봐 줄래요?"', 'Child: “Hmm… does what is left match the notice? Compare it with the dotted outline again?”');
      C.ch = [O(v === 0, esc(sp('천 원 그대로 넣어요', 'Save the full 1,000 won')), re), O(v === 1, esc(sp('반값(오백 원)만 넣어요', 'Save half (500 won)')), re), O(v === 2, esc(sp('바꿀 수 없어요', 'It cannot be changed')), re)];
      C.thx = [sp('어린이: "거의 다 남아서 천 원 그대로래요. 저금했어요!"', 'Child: “Almost all of it is left, so it counts in full!”'), sp('어린이: "반쯤 남아서 반값이구나. 다음엔 돈을 아껴 다룰래요."', 'Child: “About half is left, so half value. I will be more careful.”'), sp('어린이: "조금밖에 안 남아서 못 바꾸는구나. 다음엔 지갑에 잘 넣을래요."', 'Child: “So little is left it can’t be changed. I’ll keep notes in a wallet.”')][v]; }
    else if (t === 'lost') { C.ask = sp('어르신: "통장을 잃어버렸어요. 어떻게 해야 하지요?"', 'Elder: “I have lost my bankbook. What should I do?”');
      C.view = '<div class="bd-sit">' + esc(sp('어르신이 가져온 것: 지갑 · 도장' + (v ? '' : ' · 신분증'), 'The elder brought: wallet · seal' + (v ? '' : ' · ID card'))) + '</div>';
      C.ch = [O(!v, esc(sp('잃은 통장을 못 쓰게 먼저 신고하고, 신분증으로 새 통장을 만들어요', 'Report the lost bankbook first so nobody can use it, then make a new one with the ID card')), sp('어르신: "어머, 오늘은 신분증을 안 가져왔는데요?"', 'Elder: “Oh dear, I didn’t bring my ID card today.”')),
        O(v, esc(sp('잃은 통장을 못 쓰게 먼저 신고하고, 신분증을 가지고 다시 오시라고 해요', 'Report it first, then ask them to come back with an ID card')), sp('어르신: "신분증은 여기 가져왔어요. 오늘 바로 만들 수 없을까요?"', 'Elder: “I have my ID card right here. Can’t we do it today?”')),
        O(0, esc(sp('통장이 없어도 돈을 그냥 내드려요', 'Just hand over the money without a bankbook')), sp('어르신: "아무것도 안 보고 돈을 주면, 다른 사람이 제 돈을 가져갈 수도 있겠네요?"', 'Elder: “If you hand money out without checking, someone else could take mine, couldn’t they?”'))];
      C.thx = v ? sp('어르신: "신고부터 해 두니 마음이 놓여요. 내일 신분증 가지고 올게요."', 'Elder: “I feel better now it is reported. I’ll bring my ID card tomorrow.”') : sp('어르신: "신고하고 새 통장까지 만들었어요. 고마워요!"', 'Elder: “Reported and a new bankbook already. Thank you!”'); }
    else if (t === 'sms') { const M9 = [[sp('모르는 번호', 'Unknown number'), sp('엄마, 나야. 휴대폰이 고장 나서 친구 폰으로 보내. 급하니까 이 통장으로 돈 좀 보내 줘.', 'Mum, it’s me. My phone broke so I’m using a friend’s. It’s urgent, please send money to this account.'), sp('돈을 보내 달래요', 'it asks for money')],
        [sp('은행이라고 적힌 번호', 'A number that says “bank”'), sp('통장 확인이 필요합니다. 통장 비밀번호를 답장으로 보내 주세요.', 'We need to check your account. Reply with your PIN.'), sp('비밀번호를 보내 달래요', 'it asks for the PIN')],
        [sp('모르는 번호', 'Unknown number'), sp('택배 주소가 잘못됐어요. 아래 주소를 눌러 고쳐 주세요. http://tb-check.example', 'Your parcel address is wrong. Tap the link below to fix it. http://tb-check.example'), sp('주소를 눌러 달래요', 'it asks you to tap a link')]][v];
      C.ask = sp('이웃: "이런 문자가 왔어요. 어떻게 할까요?"', 'Neighbour: “I got this text. What should I do?”');
      C.view = '<div class="bd-ph"><small>' + esc(M9[0]) + '</small><div>' + esc(M9[1]) + '</div></div>';
      const re = sp('이웃: "이 문자는 ' + M9[2] + '. 다시 읽어 봐 줄래요?"', 'Neighbour: “This one says ' + M9[2] + '. Could you read it again?”');
      C.ch = [O(v === 0, esc(sp('돈을 보내지 말고, 가족의 원래 번호로 직접 전화해 물어봐요', 'Don’t send money. Call the family member on their usual number')), re), O(v === 1, esc(sp('비밀번호는 아무에게도 알려 주지 않아요. 답장하지 말고 은행 창구에 알려요', 'Never give a PIN to anyone. Don’t reply, tell the bank counter')), re), O(v === 2, esc(sp('주소를 누르지 말고 문자를 지워요', 'Don’t tap the link. Delete the text')), re), O(0, esc(sp('문자가 시키는 대로 해요', 'Do what the text says')), sp('이웃: "정말 그래도 될까요? 누가 보냈는지 확실하지 않은 문자예요."', 'Neighbour: “Is that really OK? I can’t be sure who sent it.”'))];
      C.thx = sp('은행원: "잘 골랐어요. 급하다고 재촉하는 문자일수록 한 번 멈추고 확인해요."', 'Bank clerk: “Good choice. The more a text rushes you, the more you should stop and check.”'); }
    else if (t === 'addr' || t === 'wet') { const L9 = cellList(), n9 = L9.length, qi = (p + v) % n9, q = L9[qi], w2 = L9[(qi + 1 + (p % (n9 - 1))) % n9], o3 = L9.find(x => x !== q && x !== w2);   /* 1 + p%(n−1) = 1~n−1 칸 건너 → 늘 다른 이웃 */
      if (t === 'addr') { C.ask = sp('이웃: "이 편지가 우리 집에 잘못 왔어요. 봉투 칸이 틀렸나 봐요. 받는 분은 지도에서 어느 칸에 계세요?"', 'Neighbour: “This letter came to my house by mistake. The cell on it must be wrong. Which cell is the person in?”');
        C.view = '<div class="bd-env">' + esc(sp('받는 사람: ', 'To: ') + q.icon + ' ' + q.who) + '<br>' + esc(sp('주소: ' + w2.cell + ' 칸', 'Address: cell ' + w2.cell)) + '</div><canvas class="bd-map" width="340" height="220"></canvas><div class="sm">' + esc(sp('빨간 점 = 받는 분이 일하는 곳', 'Red dot = where the person works')) + '</div>';
        C.after = P => { const cv = P.querySelector('canvas.bd-map'); C.hit = null; if (cv) try { C.hit = A.mapGrid(cv, [{ x: q.x, z: q.z, label: q.icon, main: true }]); } catch (x9) { C.hit = null; } };
        C.ch = [O(1, esc(sp(q.cell + ' 칸', 'Cell ' + q.cell)), ''), O(0, esc(sp(w2.cell + ' 칸', 'Cell ' + w2.cell)), sp('이웃: "봉투에 적힌 칸이 그래서 우리 집에 잘못 왔어요. 빨간 점을 봐 줄래요?"', 'Neighbour: “That’s the cell on the envelope, which is why it came to me. Look at the red dot?”')), O(0, esc(sp(o3.cell + ' 칸', 'Cell ' + o3.cell)), sp('이웃: "빨간 점에서 위로 곧장 가면 글자, 왼쪽으로 곧장 가면 숫자예요."', 'Neighbour: “From the red dot, straight up is the letter and straight left is the number.”'))];
        C.cells = [q.cell, w2.cell, o3.cell]; C.thx = sp('이웃: "' + q.cell + ' 칸이군요! 편지 나누는 칸에 바로 넣어 둘게요. 고마워요!"', 'Neighbour: “Cell ' + q.cell + '! I’ll put it in the sorting rack. Thanks!”'); }
      else { const to = esc(sp('받는 곳: ', 'To: ') + q.icon + ' ' + q.who + ' · ' + q.cell + sp(' 칸', '')), fr = esc(sp('보내는 곳: ', 'From: ') + w2.icon + ' ' + w2.who + ' · ' + w2.cell + sp(' 칸', ''));
        C.ask = sp('집배원: "비에 젖어 글씨가 번진 편지가 있어요. 어떻게 할까요?"', 'Mail carrier: “The rain smudged the writing on this letter. What do we do?”');
        C.view = '<div class="bd-env">' + (v ? to + '<br><span class="wet">' + fr + '</span>' : '<span class="wet">' + to + '</span><br>' + fr) + '</div>';
        C.ch = [O(v, esc(sp('받는 곳으로 보내요', 'Send it to the address on it')), sp('집배원: "받는 곳 글씨가 번져서 안 보여요. 어디로 보내지요?"', 'Mail carrier: “The “to” address is smudged. Where would we send it?”')), O(!v, esc(sp('보낸 사람에게 돌려보내요', 'Return it to the sender')), sp('집배원: "받는 곳은 또렷하게 보이는데요? 돌려보낼 까닭이 있을까요?"', 'Mail carrier: “The “to” address is clear. Why send it back?”')), O(0, esc(sp('아무 집 우편함에 넣어요', 'Put it in any letterbox')), sp('집배원: "아무 집에 넣으면 받는 분이 영영 못 받아요."', 'Mail carrier: “Then the right person would never get it.”'))];
        C.thx = v ? sp('집배원: "받는 곳이 보이니 그대로 갖다드릴게요."', 'Mail carrier: “The address is clear, so I’ll deliver it.”') : sp('집배원: "보낸 분 주소는 보이니 돌려보내 다시 쓰시게 할게요."', 'Mail carrier: “The sender’s address is clear, so it goes back to be rewritten.”'); } }
    else if (t === 'pack') { const IT9 = [sp('유리병에 든 꿀', 'Honey in a glass jar'), sp('털장갑 한 켤레', 'A pair of woolly gloves'), sp('얼린 생선', 'Frozen fish')], W9 = [[null, sp('꿀은 상하지 않아요. 유리병이 깨지지 않게 하는 게 먼저 아닐까요?', 'Honey doesn’t go off. Isn’t keeping the glass safe more important?'), sp('봉투에 그냥 넣으면 유리병이 부딪혀 깨질 것 같아요.', 'In a plain envelope the glass jar could knock and break.')], [sp('장갑은 깨지지 않아요. 너무 크게 싸면 소포만 커져요.', 'Gloves don’t break. Too much wrapping just makes it bigger.'), sp('장갑은 녹거나 상하지 않아요.', 'Gloves don’t melt or go off.'), null], [sp('깨지진 않지만 가는 동안 녹아서 상할 것 같아요.', 'It won’t break, but it could thaw and go off on the way.'), null, sp('봉투에 넣으면 가는 동안 녹아서 상할 것 같아요.', 'In an envelope it would thaw and go off.')]][v];
      C.ask = sp('손님: "이걸 소포로 보내려는데 어떻게 쌀까요?"', 'Visitor: “I want to send this. How should I wrap it?”'); C.view = '<div class="bd-sit">' + esc(sp('보낼 것: ', 'To send: ') + IT9[v]) + '</div>';
      const P3 = [sp("뽁뽁이로 싸고 '깨지기 쉬움' 표시를 붙여요", "Wrap it in bubble wrap and add a 'fragile' label"), sp('얼음팩과 함께 스티로폼 상자에 담아요', 'Pack it with ice packs in a foam box'), sp('종이 봉투에 그냥 담아요', 'Just put it in a paper envelope')], OK3 = [0, 2, 1][v];
      C.ch = P3.map((h, j) => O(j === OK3, esc(h), W9[j] ? sp('손님: "', 'Visitor: “') + W9[j] + sp('"', '”') : ''));
      C.thx = sp('우체국 직원: "보낼 물건을 보고 싸는 방법을 고르니 받는 분이 멀쩡하게 받겠어요."', 'Post clerk: “You chose the wrapping by looking at the item. It will arrive safely.”'); }
    else { const i = v % 4, cl = L(MCLUE[t][i]); C.ask = t === 'shape' ? sp('손님: "아까 전시실에서 ' + cl + '. 그 물건 이름이 뭐예요?"', 'Visitor: “In the hall I saw ' + cl + '. What is it called?”') : t === 'today' ? sp('할아버지: "' + cl + ', 손주에게 알려 주고 싶은데 이름이 뭐였더라?"', 'Grandpa: “' + cl + ' — I want to tell my grandchild. What was it called?”') : sp('어린이: "' + iga(cl) + ' 뭐예요?"', 'Child: “What is ' + cl + '?”');
      C.view = '<div class="sm">' + esc(sp('받침대 넷을 둘러보고 골라요.', 'Look around the four stands, then choose.')) + '</div>';
      C.ch = MUSE.map((m, j) => O(j === i, esc(L(m[0])), sp('손님: "' + eun(L(m[0])) + ' 제가 말한 것과 달라요. 받침대를 한 번 둘러봐 줄래요?"', 'Visitor: “The ' + L(m[0]) + ' isn’t what I meant. Could you look at the stands again?”')));
      C.thx = sp('손님: "아, ' + L(MUSE[i][0]) + '! 고마워요." 학예사: "옛날 사람들은 이것으로 ' + L(MUSE[i][1]).replace(/요$/, '요.') + '"', 'Visitor: “Ah, the ' + L(MUSE[i][0]) + '! Thank you.” Curator: “Long ago it ' + L(MUSE[i][1]).toLowerCase() + '.”'); }
    return C; }
  function visOpen() { const k = CUR && CUR.k, vt = CUR && CUR.vis; if (!vt) return; const s = S()[k], e = en(), D = day();
    if (s.vok === D) { if (CUR.visAt) A.bubble({ x: CUR.visAt[0], y: CUR.visAt[1], z: CUR.visAt[2], sc: 1 }, e ? 'Thank you again!' : '다시 한번 고마워요!'); return; }
    const C = visCase(k, vt); if (!C) { toast('🙋 ' + (e ? 'The visitor has gone home.' : '손님이 돌아갔어요.'), 2.4); return; }
    let mis = 0, done = false, said = ''; const ORD = C.ch.map((q, j) => [hashS('vo:' + vt.id + ':' + D + ':' + j), j]).sort((a, b) => a[0] - b[0]).map(q => q[1]); CUR.visC = C;
    const body = () => { if (done) return '<div class="bd-sit">✓ ' + C.ch.filter(q => q.ok).map(q => q.h).join('') + '</div><div class="pc-tx">' + esc(C.thx) + '</div>'; let h = '<div class="sm">' + esc(C.ask) + '</div>' + C.view;
      if (C.cmp) h += '<div class="bd-cmp">' + [7, 0, 1, 6, -1, 2, 5, 4, 3].map(j => (j < 0 ? '<i>' + (e ? 'N ↑' : '북 ↑') + '</i>' : '<button class="sub" data-v="' + j + '">' + C.ch[j].h + '</button>')).join('') + '</div>';
      else h += '<div class="' + (C.grid ? 'bd-wl' : 'bd-ch') + '">' + ORD.map(j => '<button class="sub" data-v="' + j + '">' + C.ch[j].h + '</button>').join('') + '</div>';
      return h + '<div class="sm" data-m>' + esc(said) + '</div>'; };
    const draw = () => '<h3>🙋 ' + esc(C.who) + '</h3>' + body() + '<div class="row"><button class="' + (done ? '' : 'sub') + '" data-a="x">' + (done ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdvis'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); if (!done && C.after) C.after(P); }; if (C.after) C.after(P);
    const pickV = j => { const q = C.ch[j]; if (!q || done) return;
      if (q.ok) { done = true; s.vok = D; s.vn = (s.vn | 0) + 1; mark(); sfx('ding'); reward(k, C.sk, 2); A.rec('bldg', { k, ev: 'vis', id: vt.id, mis }); if (CUR && CUR.visAt) A.bubble({ x: CUR.visAt[0], y: CUR.visAt[1], z: CUR.visAt[2], sc: 1 }, e ? 'Thank you!' : '고마워요!'); paint(); return; }
      mis++; sfx('tick'); const m9 = now9() + 10; if (A.GAME.waitMin) A.GAME.waitMin(m9); said = q.w + (e ? ' (10 minutes passed)' : ' (10분이 지났어요)'); CUR.visMis = mis; paint(); };
    P.onclick = ev => { const cv = ev.target.closest && ev.target.closest('canvas.bd-map'); if (cv && typeof C.hit === 'function' && C.cells && !done) { const r = cv.getBoundingClientRect(), c = C.hit((ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height), j = c ? C.cells.indexOf(c) : -1; if (j >= 0) pickV(j); return; }
      const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.v != null) pickV(+b.dataset.v); };
    log('vis open ' + vt.id); }

  function readBoard() { const e = en(), k = CUR.k, s = S()[k], D = day(); let body = '';
    if (k === 'police') { const n = helped('lost'); body = (s.d112 ? (e ? '★ 112 helper: practised ' + (s.n112 | 0) + ' time(s).' : '★ 112 어린이 도우미: 연습 ' + (s.n112 | 0) + '번') : (e ? 'Practise 112 calls at the counter to get your name here.' : '창구에서 112 신고 연습을 하면 여기에 붙어요.')) + '<br>' + (n ? (e ? '♥ Lost children you helped home: ' + n : '♥ 가족에게 데려다준 길 잃은 아이: ' + n + '명') : (e ? 'When a 112 call comes, help a lost child find family.' : '112 출동이 오면 길 잃은 아이의 가족을 찾아 줘요.')); }
    else if (k === 'clinic') body = (s.dfa ? (e ? '✓ Twisted ankle: keep still, cool it, raise it.<br>✓ Heat sickness: shade, water if awake, fan.' : '✓ 발목을 삐면: 움직이지 않기, 차갑게, 높이 올리기<br>✓ 더위를 먹으면: 그늘로, 정신이 또렷하면 물, 부채질') : (e ? 'Learn first aid with the nurse to fill this board.' : '간호사 선생님께 응급 처치를 배우면 이 판이 채워져요.')) + ((s.hi || []).length ? '<br>' + (e ? '♥ Neighbours who said thanks: ' : '♥ 고맙다고 한 이웃: ') + s.hi.length : '');
    else if (k === 'bank') body = (e ? 'In the bankbook: ' : '통장에 있는 돈: ') + esc(A.won(s.bal | 0)) + '<br>' + ((s.hist || []).slice(-5).map(r => esc(dayT(r[0]) + ' · ' + kindT(r[1]) + ' ' + A.won(r[2]) + ' → ' + A.won(r[3]))).join('<br>') || (e ? 'Save at the counter and a line is written here.' : '창구에서 저금하면 여기에 한 줄씩 적혀요.'));
    else if (k === 'factory') { const LN = LINES[CUR.made.line] || LINES.farm; body = (s.made === D ? (e ? '✓ Today: 8 boxes of ' + L(LN.p) + '.' : '✓ 오늘 만든 ' + L(LN.p) + ' 상자 8개') : (e ? 'The line is waiting. Watch how things are made at the line.' : '오늘 줄은 아직 쉬고 있어요. 줄 앞에서 만드는 차례를 견학해요.')) + '<br>' + LN.st.map((t, j) => (j + 1) + '. ' + esc(L(t))).join('<br>'); }
    else if (k === 'elder') { const G9 = s.got || []; body = G9.length ? G9.map(nm => { const q = OLDN.concat([OUR_N]).find(o => L(o[0]).split(' ')[0] === nm); return q ? '「' + esc(nm) + '」 = ' + esc(L(q[1])) : ''; }).filter(Boolean).join('<br>') : (e ? 'Hear old place names from the elder to fill this board.' : '어르신께 옛 땅이름을 들으면 이 판이 채워져요.'); }
    else if (k === 'museum') { const G9 = Object.keys(s.got || {}).map(Number).filter(i => MUSE[i]); body = (e ? 'Found out: ' : '알아본 옛 물건: ') + G9.length + '/' + MUSE.length + (G9.length ? '<br>' + G9.map(i => '✓ ' + esc(L(MUSE[i][0]) + ' → ' + (e ? 'today: ' : '오늘날 ') + L(MUSE[i][3]))).join('<br>') : ''); }
    else body = (s.fed === D ? (e ? '✓ Fed today.' : '✓ 오늘 밥을 먹었어요.') : (e ? 'Not fed yet today. Ask at the food shelf.' : '오늘 아직 밥을 못 먹었어요. 사료 선반에서 도와요.')) + (s.n ? '<br>' + (e ? '★ Meals you gave: ' + s.n : '★ 내가 준 밥: ' + s.n + '번') : '');
    const P = A.openP('<h3>📋 ' + esc(CUR.name) + '</h3><div class="pc-tx">' + body + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'bdboard'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }

  function dispose() { left(); if (css) { css.remove(); css = null; } }
  return { tip, canIn, opts, left, dispose, open, sec, facNews, facAt, facTake, facPend: () => { const f = ((A.GAME.S.bldg || {}).factory) || {}; return f.made > 0 && !(f.dl && f.dl.m === f.made); }, pend: () => { const b = (A.GAME.S.bldg || {}).post; return !!(b && Array.isArray(b.box) && b.box.some(q => q && !q.ok)); },
    info: () => ({ cur: CUR ? { k: CUR.k, name: CUR.name, food: CUR.food ? CUR.food.visible : null, prod: CUR.prod ? CUR.prod.visible : null, stars: CUR.stars ? CUR.stars.map(g => g.visible) : null, play: CUR.play ? { f: CUR.play.f, T: +CUR.play.T.toFixed(2), si: CUR.play.si, n: CUR.play.n, len: +CUR.play.len.toFixed(1), au: !!CUR.play.au } : null, line: CUR.made.line || null, box: CUR.box ? CUR.box.visible : null, nb: !!(CUR.made && CUR.made.nb), at: CUR.at, vis: CUR.vis ? { id: CUR.vis.id, d: CUR.vis.d, gone: !!CUR.visGone, mis: CUR.visMis | 0, ans: CUR.visC ? CUR.visC.ch.findIndex(q => q.ok) : -1 } : null, extra: (CUR.made.extra || []).map(h => ({ k: h.k, label: h.label, at: [CUR.at[0] + h.stand[0], CUR.at[1] + h.stand[1], CUR.at[2] + h.stand[2]] })) } : null, s: JSON.parse(JSON.stringify(S())), dbg: DBG.slice() }),
    dbg: { use: kk => use(kk), vpick: (k, d) => visPick(k, d == null ? day() : d), vcase: () => { const C = CUR && CUR.vis ? visCase(CUR.k, CUR.vis) : null; return C ? { t: C.t, v: C.v, ans: C.ch.findIndex(q => q.ok), n: C.ch.length, cmp: !!C.cmp, cells: C.cells || null, who: C.who } : null; }, sec: () => sec(), fac: () => facDeliv(), int: () => bankInt(), board: () => (CUR && CUR.board ? CUR.board.c.toDataURL().length : 0), px: () => { if (!CUR || !CUR.board) return null; const c = CUR.board.c, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 64) h = (Math.imul(h, 31) + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; }, ff: sec => { if (CUR && CUR.play) CUR.play.t0 -= sec * 1000; }, png: () => (CUR && CUR.board ? CUR.board.c.toDataURL('image/png') : null), films: () => CINE.map(f => ({ id: f.id, len: +filmLen(f).toFixed(1), shots: f.shots.length })) } };   /* CINE-3 시험: 화면 픽셀 지문 · 빨리 감기 */
}
