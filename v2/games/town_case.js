// 📒 사건 수첩 엔진(CASE-1 · 사용자 10-25 '추론하면서 여러 구간에 걸쳐 해내는 퀘스트가 없어 · 마을 박물관 게임 같아 · 조급함이 없어' · 설계 docs/systems/town_case.md)
//   사용자 덧말(10-25): '가서 E만 누르는 것 싫고 · 막대 놀이 싫고 · 적지 않은 스트레스를 받아 가며 성취' → ① 단서 자리엔 빨간 선 X(이웃 말의 칸·방위·랜드마크 + 지도) · 확인 자리만 빨간 선
//     ② 틀린 가설 = 게임 시각이 흐르고 기한이 줄어듦(벌·점수 X) ③ 단서 하나는 몸으로(강·호숫가를 걸으며 세 군데 물 떠서 견주기 · 공사장 울타리 안에 들어가야 흙더미가 보임) ④ 막대·꾹 누르기 X ⑤ 보고서 근거는 '본 것'만
//   고리 = 생김(이미 있는 엔진 값에서 저절로 · 사건 표 줄의 when) → 단서 모으기(장소·사람·때가 서로 다름 · 수첩에 '본 것'과 '들은 생각'을 나눠 적음) → 까닭 고르기(단서 셋 이상 · 셋 중 하나)
//     → 확인(고른 까닭의 확인 자리만 빨간 선 · 틀리면 '아니었어요' + 시각 90분) → 보고서(근거 둘 · 창구 직원이 '생각'은 되물음) → 행정복지센터 창구(town_fix.js 탁자 · 09~18시)
//     → 결과(기한 안 = 다음 날 흙막이 + 물이 하루씩 맑아짐 + 아침 소식 + 이웃 반응 둘 · 늦음 = 큰비 날 논 한 칸 흙탕 하루 + '다음엔 빨리') → 다음 사건 씨앗
//   사건 표 CASES: 줄 하나 = 사건 하나(when = 생기는 조건 · place = 자리 정하기 · clues · hyps · ok = 보고서에 쓸 수 있는 본 것) · ready:false = 표 줄만(아직 안 지음)
//   지킴: 판타지 X · 전투 X · 범인 몰기 X(공사하는 분도 이웃 · '생각이 다름'까지) · 실제 회사 이름 X · 실명 X(상인·논 일꾼·공사 일꾼 = 이름 없는 역할) · 4학년(지시문 한 문장 · 새 낱말 둘 + 낱말 상자)
//   렉: 매 프레임 일 0(모두 1초 칸 sec) · 새 Light X · 사건 소품 = 합친 부품(공사장 1 · 배수구 1 · 안내판 1 + 글씨 1 · 흙탕 논 1)
//   둘째 사건 ⚖️ 사라진 장터 저울(SCALE-1 · 10-26): 장날 아침 · 범인 몰기 X = 오해를 푸는 이야기(옆 가게 이웃이 눈금이 틀린 저울을 계량 검사에 맡기고 말을 못 전함)
//     단서 여섯 = 판매대 바닥 자국(방위) · 정류장 시간표 · 정자 이웃(맑은 저녁 6~8시) · 옆 가게 이웃(오후 · 본 것을 보여 줘야 생각남) · 맡긴 곳 장부(9~18시) · 날씨 기록(어제 바람)
//     보고 = 상인에게 본 것 둘 → 다음 날 고친 저울 + '정확해요' 판 + 서로 고맙다는 소식 · 늦으면 다음 장날 임시 저울(줄이 길어요 · 벌 X)
//   셋째 사건 🚧 공사장 길 안전(SITEROAD-1 · 10-26): 흐려진 강이 끝난 다음 날부터(seeds.siteRoad) · 흙막이 세운 그 공사장 입구 앞 등굣길
//     단서 여섯 = 입구 곁에 서서 지켜보기(몸으로 · 아침 8~9시에만 트럭) · 길바닥 흙 · 쌓인 자재(눈높이) · 끊긴 보도 · 길을 자주 지나는 이웃(생각: 빨라서) · 공사 일꾼(생각: 어두워서)
//     까닭 셋(빨라서 = 과속 방지 턱 · 어두워서 = 가로등 · 아이들이 다니는 때 + 끊긴 보도 + 가린 자재 ✓) → 창구 보고 + 대책 고르기 → 다음 날 울타리 친 임시 보도 · 건널목 표시 · '공사 차량 시간' 판 · 늦으면 하루 보도 막힘
//   사건마다 다른 것 = 사건 표 줄의 글(ann·yes·ask·recv·nosup…) + PLACE[id] + 모습·E 자리(sync·hotSync 안 갈래) · 고리·수첩·기한·보고 창·칩은 같음
export const CASE_V = 1;
const DIR8 = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];
const dir8 = (dx, dz) => Math.round(((Math.atan2(dx, -dz) * 57.29578 + 360) % 360) / 45) % 8;   /* 0 = 북(−z) · 90 = 동(+x) — town_emerg.js와 같음 */
function T2(ko, en) { return [ko, en]; }
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const DAYM = 24 * 60, DUE_H = 18, COST = 90;   /* 기한 = 생긴 날 포함 사흘째 18:00(창구 닫는 때) · 틀린 가설 = 90분 */

// ───────── 사건 표(줄 하나 = 사건 하나) ─────────
//   when(c) = 그날 아침 생기나(c = { water, wx, day }) · days = 기한(날) · clue 갈래: 'sample'(몸으로 물 떠 보기) · 'look'(그 자리 E·K) · 'talk'(사람 · 때 있음) · 'wx'(날씨 창)
//   f = 수첩 칸('fact' 본 것 · 'idea' 들은 생각) · hyps = 까닭 셋(chk = 확인 자리 · ok = 맞는 까닭) · sup = 보고서에서 '맞는 까닭을 보여 주는' 본 것
export const CASES = {
  river: { ready: true, icon: '🌊', t: T2('흐려진 강', 'The muddy river'), days: 3,
    when: c => c.water && c.water.lv >= 0.99,   /* 비 사흘 → 물 높이 +1(town_routine.js waterOf · WATER-1)인 첫 아침 */
    q: T2('강물이 왜 흙빛이 되었는지 까닭을 찾아요.', 'Find out why the river turned muddy.'),
    words: [[T2('토사', 'Silt'), T2('빗물에 쓸려 내려온 흙과 모래', 'Soil and sand washed down by rain')], [T2('흙막이', 'Silt fence'), T2('흙이 쓸려 나가지 않게 막는 판이나 덮개', 'Boards or covers that stop soil from washing away')]],
    clues: ['sample', 'site', 'drain', 'sign', 'rain', 'market', 'farmer'],
    hyps: [{ k: 'fac', t: T2('공장에서 흘려보낸 물 때문이에요', 'Water let out by the factory'), chk: 'drain', fk: 'drain', no: T2('배수구 물은 맑아요. 공장 때문은 아니었어요.', 'The drain water is clear. It was not the factory.') },
      { k: 'rain', t: T2('비가 많이 와서 저절로 흐려졌어요', 'It is just from lots of rain'), chk: 'far', fk: 'far', no: T2('여기도 비가 똑같이 왔는데 물이 맑아요. 비만으로는 아니었어요.', 'The same rain fell here, yet the water is clear. Rain alone was not it.') },
      { k: 'site', t: T2('공사장 흙이 빗물에 쓸려 왔어요', 'Soil from the building site washed in with the rain'), chk: 'trail', fk: 'trail', ok: 1 }],
    sup: ['sample', 'site', 'sign', 'trail'], chkOnly: ['trail', 'far'], next: 'siteRoad', repTo: 'hall', lateMax: 3, lateOn: c => c.wx === 'rain',   /* 늦으면 = 큰비 오는 날 논 한 칸 흙탕 */
    ann: T2('비 사흘 뒤 강물이 흙빛이에요. 사흘 안에 까닭을 찾아 행정복지센터에 알려요(📒 수첩 칩).', 'The river is brown after three days of rain. Find out why within 3 days (tap the notebook chip).'),
    yes: T2('이제 보고서를 내요. 직접 본 것 둘을 골라 행정복지센터 창구(09~18시)에 내요.', 'Now write a report: pick two things you saw yourself, and hand it in at the community centre desk (9 am–6 pm).'),
    ask: T2('직원: "강물이 왜 흐려졌나요? 근거를 두 가지 골라 주세요."', 'Clerk: “Why did the river get muddy? Pick two pieces of evidence.”'),
    nosup: T2('직원: "그건 다른 까닭이 아니라는 근거예요. 공사장 흙이라는 걸 보여 주는 것도 하나 골라 줘요."', 'Clerk: “Those show what it was NOT. Add one that shows it was the site soil.”'),
    recv: T2('직원: "고마워요. 내일 공사하는 분들과 함께 공사장에 흙막이를 세울게요."', 'Clerk: “Thank you. Tomorrow we will put up silt fences at the site with the builders.”') },
  // 다음 사건(표 줄만 · 아직 안 지음 · docs/systems/town_case.md §5)
  // 🌀 태풍 — 안전한 대피 길(TYPH-1 · ext = 다른 모듈이 몰고 감: town_typhoon.js가 이 줄의 단서·까닭·근거를 씀 · 이 엔진의 plan은 건너뜀)
  //   단서 = 예보·안내문(본 것) · 이웃 소문 셋(들은 생각) · 내가 걸어 본 길(본 것 · 몸으로 · 강가 낮은 곳 X · 가파른 비탈 = 체력) → 까닭(어느 길) → 어르신께 알림(근거 = 본 것만)
  typhoon: { ready: true, ext: 'typhoon', icon: '🧭', t: T2('태풍 — 안전한 대피 길', 'Typhoon — the safe way to the shelter'), days: 3, when: () => false,
    q: T2('노인정 어르신들이 대피소까지 갈 안전한 길을 찾아요.', 'Find a safe way to the shelter for the elders.'),
    clues: ['ty_fc', 'ty_hall', 'ty_fast', 'ty_hill', 'ty_last', 'ty_walk'],
    hyps: [{ k: 'walk', t: T2('내가 걸어 본 길', 'The way I walked'), ok: 1 }, { k: 'river', t: T2('강을 따라가는 강변길', 'The riverside path') }, { k: 'hill', t: T2('산비탈 지름길', 'The steep hill shortcut') }],
    sup: ['ty_walk'] },
  // ⚖️ 사라진 장터 저울(SCALE-1): 장날 아침(어제 바람이 약했던 날) · 기한 이틀(다음 장날 전) · 보고 = 장터 상인에게(repTo 'mk')
  //   4학년 사회(시장·생산·소비): 저울이 정확해야 사는 사람도 파는 사람도 손해를 보지 않음(공정한 거래) · 범인 몰기 X — 가짜 까닭 둘은 확인하면 '아니었어요'
  scale: { ready: true, icon: '⚖️', t: T2('사라진 장터 저울', 'The missing market scale'), days: 2,
    when: c => !!(c.jang && c.jang.on && c.day > 0 && !c.windyY),
    q: T2('장터 저울이 어디로 갔는지 알아내요.', 'Find out where the market scale went.'),
    words: [[T2('계량', 'Measuring'), T2('무게나 양을 저울 같은 기구로 재는 일', 'Finding a weight or amount with a tool such as a scale')], [T2('눈금', 'Scale marks'), T2('저울이나 자에 수를 읽도록 그어 놓은 금', 'Lines on a scale or ruler for reading numbers')]],
    clues: ['track', 'bus', 'wit', 'nbr', 'book', 'calm'], chkOnly: ['roll', 'lost', 'shelf'], lead0: 'sc0',
    hyps: [{ k: 'wind', t: T2('바람에 넘어져 어디로 굴러갔어요', 'The wind knocked it over and it rolled away'), chk: 'roll', fk: 'roll', no: T2('판매대 뒤 낮은 곳에도 저울이 없어요. 바람 때문은 아니었어요.', 'The scale is not in the low ground behind the stall either. It was not the wind.') },
      { k: 'took', t: T2('누가 모르고 가져갔어요', 'Someone took it by mistake'), chk: 'lost', fk: 'lost', no: T2('분실물 장부에 저울이 없어요. 누가 모르고 가져간 것은 아니었어요.', 'There is no scale in the lost-and-found book. Nobody took it by mistake.') },
      { k: 'fix', t: T2('눈금이 틀려서 누가 고치러 맡겼어요', 'Its marks were wrong, so someone took it to be fixed'), chk: 'fix', fk: 'shelf', ok: 1 }],
    sup: ['track', 'book', 'shelf'], repTo: 'mk', lateMax: 6, lateOn: c => !!(c.jang && c.jang.on && c.day > c.d0),   /* 늦으면 = 다음 장날 상인이 임시 저울로 팜 */
    ann: T2('장날인데 상인의 저울이 없어졌어요. 이틀 안에 저울이 어디로 갔는지 알아내 상인에게 알려요(📒 수첩 칩).', 'It is market day and the seller’s scale is gone. Find out where it went within 2 days and tell the seller (notebook chip).'),
    yes: T2('이제 상인에게 알려요. 직접 본 것 둘을 골라 장터 상인(아침 8시~저녁 7시)에게 보여 줘요.', 'Now tell the seller: pick two things you saw yourself and show them to the market seller (8 am–7 pm).'),
    ask: T2('상인: "저울이 어디로 갔는지 알아냈어요? 근거를 두 가지 보여 줘요."', 'Seller: “Did you find out where my scale went? Show me two pieces of evidence.”'),
    nosup: T2('상인: "그걸로는 저울이 어디로 갔는지 모르겠어요. 저울이 간 곳을 보여 주는 것도 하나 골라 줘요."', 'Seller: “That does not tell me where the scale went. Add one that shows where it went.”'),
    recv: T2('상인: "아, 옆 가게에서 눈금을 고치러 맡겨 준 거였군요! 누가 가져간 줄 알았어요. 내일 아침이면 저울이 돌아온대요. 고마워요."', 'Seller: “Oh, my neighbour took it to have the marks fixed! I thought someone had taken it. It comes back tomorrow morning. Thank you.”') },
  // 🚧 공사장 길 안전(SITEROAD-1): 흐려진 강이 끝난 다음 날부터 · 기한 사흘 · 보고 = 행정복지센터 창구 + 대책 고르기(fixes) · 늦으면 = 다음 날 하루 보도 막힘
  //   4학년 사회(우리 고장의 문제 · 안전): 위험한 곳은 '왜' 위험한지(때 · 자리 · 눈높이)를 알아야 맞는 대책을 고름 · 공사하는 분도 이웃(범인 몰기 X · 불편해지는 사람도 있음)
  siteRoad: { ready: true, icon: '🚧', t: T2('공사장 길 안전', 'Safe road by the building site'), days: 3, seed: 'river',
    when: c => !!(c.seeds && c.seeds.siteRoad != null && c.day > c.seeds.siteRoad),
    q: T2('공사장 앞 등굣길이 어디가 왜 위험한지 알아내요.', 'Find out where and why the school road by the building site is dangerous.'),
    words: [[T2('보도', 'Pavement'), T2('사람이 걸어 다니도록 찻길과 나누어 만든 길', 'The part of a street made for people to walk on, apart from the cars')], [T2('시야', 'Line of sight'), T2('눈으로 볼 수 있는 넓이', 'How far and wide your eyes can see')]],
    clues: ['sr_truck', 'sr_mud', 'sr_pile', 'sr_gap', 'sr_nbr', 'sr_crew'], chkOnly: ['sr_slow', 'sr_lamp', 'sr_cross'], lead0: 'sr0',
    hyps: [{ k: 'speed', t: T2('트럭이 너무 빨리 달려서 위험해요', 'The trucks drive too fast'), chk: 'slow', fk: 'sr_slow', no: T2('입구 앞 찻길에 과속 방지 턱과 "천천히" 표지가 있어 트럭이 빨리 달릴 수 없어요. 빨라서 위험한 것은 아니었어요.', 'There is a speed bump and a “Slow” sign by the gate, so trucks cannot go fast there. Speed was not it.') },
      { k: 'dark', t: T2('저녁에 길이 어두워서 위험해요', 'The road is too dark in the evening'), chk: 'lamp', fk: 'sr_lamp', no: T2('입구 곁에 가로등이 둘 서 있어요. 아이들이 학교 가는 아침엔 해가 떠서 밝아요. 어두워서 위험한 것은 아니었어요.', 'There are two street lamps by the gate, and the morning school walk is in daylight. Darkness was not it.') },
      { k: 'cross', t: T2('아이들이 다니는 때에 트럭이 드나들고, 보도가 끊기고, 자재가 눈을 가려요', 'Trucks come and go while children walk by, the pavement breaks off, and building materials block the view'), chk: 'c', fk: 'sr_cross', ok: 1 }],
    sup: ['sr_truck', 'sr_pile', 'sr_gap', 'sr_cross'], repTo: 'hall', lateMax: 2, lateOn: () => true,   /* 늦으면 = 기한 다음 날 하루 보도 막힘(길 건너편으로 돌아감) */
    fixes: [{ k: 'fix', ok: 1, t: T2('등교 때(아침 8~9시)는 트럭이 쉬고, 끊긴 자리에 울타리 친 보도를 내고, 자재를 안쪽으로 옮겨요', 'Trucks rest during the school walk (8–9 am), a fenced path fills the gap, and the materials move inside') },
      { k: 'away', t: T2('공사가 끝날 때까지 아이들이 먼 길로 돌아서 다녀요', 'Children take a long way round until the works end'), no: T2('공사는 오래 이어져요. 아이들이 날마다 먼 길을 돌면 힘들고 늦어요. 이 길을 안전하게 바꿀 방법은 없을까요?', 'The works will go on for a long time. A long way round every day is tiring and makes them late. Can we make this road safe instead?') },
      { k: 'care', t: T2('트럭 운전하는 분께 조심해 달라고 말해요', 'Ask the truck drivers to be careful'), no: T2('조심하는 것만으로는 끊긴 보도와 눈을 가리는 자재가 그대로예요. 본 것을 하나씩 고치는 방법을 골라 줄래요?', 'Being careful leaves the broken pavement and the blocking pile as they are. Can you pick a way that fixes what you saw?') }],
    ann: T2('공사장 앞 길로 학교 가는 아이들이 위험하대요. 사흘 안에 어디가 왜 위험한지 알아내 행정복지센터에 알려요(📒 수첩 칩).', 'Children walking to school past the building site are in danger. Find out where and why within 3 days and tell the community centre (notebook chip).'),
    yes: T2('이제 보고서를 내요. 직접 본 것 둘을 골라 행정복지센터 창구(09~18시)에 내요.', 'Now write a report: pick two things you saw yourself, and hand it in at the community centre desk (9 am–6 pm).'),
    ask: T2('직원: "공사장 앞 길이 왜 위험한가요? 근거를 두 가지 골라 주세요."', 'Clerk: “Why is the road by the site dangerous? Pick two pieces of evidence.”'),
    nosup: T2('직원: "그건 다른 까닭이 아니라는 근거예요. 아이들이 왜 위험한지 보여 주는 것도 하나 골라 줘요."', 'Clerk: “Those show what it was NOT. Add one that shows why the children are in danger.”'),
    fixAsk: T2('직원: "잘 알았어요. 그럼 무엇을 하면 좋을까요?"', 'Clerk: “I see. So what should we do?”'),
    recv: T2('직원: "좋아요. 내일 공사하는 분들과 함께 그렇게 바꿀게요. 아침 8~9시엔 트럭이 쉬어요."', 'Clerk: “Good. Tomorrow we will change it with the builders. Trucks will rest from 8 to 9 am.”') },
};

// 단서 글(본 것 = 내가 직접 본·잰 것 · 들은 생각 = 이웃이 한 말)
export const CL = {
  sample: { f: 'fact', ic: '💧', t: T2('물을 세 군데 떠 보니 공사장 가까운 물이 가장 흐리고, 먼 호숫가 물은 맑았어요.', 'I took water from three places: it was muddiest near the site and clear on the far shore.') },
  site: { f: 'fact', ic: '⛏', t: T2('공사장 울타리 안 흙더미에 덮개가 없고, 빗물 고랑이 물 쪽으로 나 있었어요.', 'Inside the fence the soil heaps had no cover, and rain channels ran toward the water.') },
  drain: { f: 'fact', ic: '🏭', t: T2('공장 배수구에서 나오는 물은 맑았어요.', 'The water from the factory drain was clear.') },
  sign: { f: 'fact', ic: '🚏', t: T2('정류장 안내판에 "공사 차량이 드나들어요 · 호수 둘레 땅 고르기"라고 쓰여 있었어요.', 'The bus stop notice said: "Works vehicles coming and going · levelling ground by the lake".') },
  rain: { f: 'fact', ic: '🌧', t: T2('날씨 기록을 보니 사흘 동안 비가 왔어요.', 'The weather record shows three days of rain.') },
  market: { f: 'idea', ic: '🗣', t: T2('장터 상인: "새벽마다 흙 실은 트럭이 호수 쪽 길로 가더라고요. 그 흙 때문일지도 몰라요."', 'Market seller: "Trucks full of soil go up the lake road every morning. Maybe it is that soil."') },
  farmer: { f: 'idea', ic: '🗣', t: T2('논 일꾼: "공장에서 물을 흘려보내서 그런 것 같아요."', 'Rice farmer: "I think the factory is letting water out."') },
  trail: { f: 'fact', ic: '🔎', t: T2('흙물이 공사장 고랑을 따라 호수로 흘러들고 있었어요.', 'Muddy water was running from the site channels into the lake.') },
  ty_fc: { f: 'fact', ic: '📻', who: T2('라디오 일기 예보', 'Radio forecast'), t: T2('비가 많이 오면 강물이 불어나요.', 'Heavy rain makes the river rise.') },
  ty_hall: { f: 'fact', ic: '🏛', who: T2('행정복지센터 안내문', 'Community centre notice'), t: T2('강물이 불면 강가 낮은 길이 잠길 수 있어요. 대피소는 높은 곳에 있어요.', 'When the river rises, low riverside paths can flood. The shelter is on high ground.') },
  ty_fast: { f: 'idea', ic: '🗣', who: T2('지나가던 이웃', 'A passing neighbour'), t: T2('대피할 땐 강변길이 제일 빠르대.', 'They say the riverside path is the fastest way to the shelter.') },
  ty_hill: { f: 'idea', ic: '🗣', who: T2('장터 손님', 'A shopper at the market'), t: T2('산비탈 지름길로 가면 금방이래.', 'They say the steep hill shortcut gets you there fast.') },
  ty_last: { f: 'idea', ic: '🗣', who: T2('정자에 앉은 이웃', 'A neighbour at the pavilion'), t: T2('지난번 태풍 땐 별일 없었으니 이번에도 괜찮을 거래.', 'Nothing happened last time, so they think it will be fine again.') },
  ty_walk: { f: 'fact', ic: '🧭', who: T2('내가 걸어 본 것', 'What I walked'), t: T2('내가 직접 걸어 보니 강가 낮은 곳과 가파른 비탈을 안 지나요.', 'I walked it myself: no low riverside ground, no steep slope.') },
  far: { f: 'fact', ic: '💧', t: T2('비는 똑같이 왔는데 먼 호숫가 물은 맑았어요.', 'The same rain fell, but the far shore was clear.') },
  // ⚖️ 사라진 장터 저울 — 글에 자리(방위·곳 이름)가 들어가는 것은 함수(p = 사건 자리)
  track: { f: 'fact', ic: '👣', t: p => T2('판매대 앞 바닥에 저울 받침 자국 넷이 있고, 그 곁에서 수레 바퀴 자국이 ' + DIR8[p.dir][0] + '쪽으로 나 있어요.', 'By the stall there are four marks from the scale’s feet, and cart wheel tracks lead off to the ' + DIR8[p.dir][1] + '.') },
  bus: { f: 'fact', ic: '🚏', t: T2('장터 앞 정류장 시간표를 보니 마지막 버스는 저녁 6시 10분이에요.', 'The timetable at the market bus stop says the last bus is at 6:10 pm.') },
  wit: { f: 'idea', ic: '🗣', who: T2('정자 이웃', 'the neighbour at the pavilion'), t: p => T2('정자 이웃: "어제 마지막 버스를 기다리는데, 버스가 오기 조금 전에 장터에서 수레 끄는 소리가 ' + DIR8[p.dir][0] + '쪽으로 났어요. 누가 저울을 가져간 걸까요?"', 'Pavilion neighbour: “Yesterday, while I waited for the last bus, just before it came I heard a cart going ' + DIR8[p.dir][1] + ' from the market. Did someone take the scale?”') },
  nbr: { f: 'idea', ic: '🗣', who: T2('옆 가게 이웃', 'the neighbour at the next stall'), t: p => T2('옆 가게 이웃: "아, 그 바퀴 자국은 제 수레예요! 어제 저녁에 저울 눈금이 0에 안 맞길래 ' + p.fix.name + '에 맡겼어요. 아차, 상인에게 말을 못 했네요."', 'Next-stall neighbour: “Oh, those are my cart tracks! Yesterday evening the scale did not read zero, so I took it to the ' + p.fix.name + '. Oops, I forgot to tell the seller.”') },
  book: { f: 'fact', ic: '📒', t: p => T2(p.fix.name + ' ' + (p.fix.kind === 'insp' ? '계량 검사' : '수리') + ' 장부에 "어제 오후 5시 50분, 장터 저울 한 대. 눈금이 0에 안 맞음. 맡긴 사람: 장터 옆 가게"라고 쓰여 있어요.', 'The ' + (p.fix.kind === 'insp' ? 'measuring check' : 'repair') + ' book at the ' + p.fix.name + ' says: “Yesterday 5:50 pm, one market scale. Does not read zero. Left by: the next stall.”') },
  calm: { f: 'fact', ic: '🌤', t: T2('날씨 기록을 보니 어제는 바람이 약했어요.', 'The weather record says the wind was light yesterday.') },
  roll: { f: 'fact', ic: '🔎', t: T2('판매대 뒤 낮은 곳까지 살펴봤는데 저울이 없고, 받침 자국도 반듯하게 남아 있어요.', 'I looked down in the low ground behind the stall: no scale, and the foot marks are still neat.') },
  lost: { f: 'fact', ic: '🔎', t: p => T2(p.lost.name + ' 분실물 장부에 저울은 없어요.', 'There is no scale in the lost-and-found book at the ' + p.lost.name + '.') },
  // 🚧 공사장 길 안전 — 본 것 넷(지켜보기는 몸으로) · 들은 생각 둘(그럴듯하지만 틀린 의견) · 확인 자리에서만 얻는 본 것 셋
  sr_truck: { f: 'fact', ic: '🚚', t: T2('입구 곁에 서서 지켜보니, 아이들이 학교 가는 아침 8시~9시에 흙 실은 트럭이 입구를 드나들어요.', 'Standing by the gate I watched: from 8 to 9 am, when children walk to school, soil trucks go in and out.') },
  sr_mud: { f: 'fact', ic: '👣', t: T2('입구 앞 찻길에 트럭 바퀴에서 떨어진 흙이 깔려 있어요. 밟아 보니 미끄러워요.', 'Soil from the truck wheels covers the road by the gate. It is slippery underfoot.') },
  sr_pile: { f: 'fact', ic: '📦', t: T2('보도 곁에 공사 자재가 어른 키보다 높게 쌓여 있어요. 아이 눈높이에서는 입구에서 나오는 트럭이 안 보여요.', 'Building materials are piled higher than a grown-up by the pavement. At a child’s eye height you cannot see trucks coming out of the gate.') },
  sr_gap: { f: 'fact', ic: '🚶', t: T2('입구 앞에서 보도가 끊겨 있어요. 걷는 사람은 트럭이 나오는 길로 내려서야 해요.', 'The pavement stops at the gate. People on foot must step into the trucks’ way.') },
  sr_nbr: { f: 'idea', ic: '🗣', who: T2('그 길을 자주 지나는 이웃', 'the neighbour who often walks that road'), t: T2('그 길을 자주 지나는 이웃: "트럭이 너무 빨리 달려서 위험한 거예요. 빠르기만 줄이면 될 거예요."', 'Neighbour who often walks there: “The trucks are just too fast. Slow them down and it will be fine.”') },
  sr_crew: { f: 'idea', ic: '🗣', who: T2('공사 일꾼', 'the site worker'), t: T2('공사 일꾼: "우리 트럭은 아침에만 흙을 날라요. 천천히 다니니까 괜찮아요. 저녁에 길이 어두운 게 문제 아닐까요?"', 'Site worker: “Our trucks only carry soil in the morning, and they go slowly. Isn’t the dark road in the evening the problem?”') },
  sr_slow: { f: 'fact', ic: '🔎', t: T2('입구 앞 찻길에 과속 방지 턱이 있고 "공사 차량 천천히" 표지가 서 있어요.', 'There is a speed bump by the gate and a “Works vehicles: slow” sign.') },
  sr_lamp: { f: 'fact', ic: '🔎', t: T2('입구 곁에 가로등이 둘 서 있어요. 아이들은 해가 뜬 밝은 아침에 이 길로 다녀요.', 'Two street lamps stand by the gate, and children walk here in the bright morning.') },
  sr_cross: { f: 'fact', ic: '🔎', t: T2('끊긴 보도 자리에 아이 눈높이로 서 보니, 자재 더미에 가려 입구 쪽이 안 보이고 바로 앞이 트럭이 나오는 길이에요.', 'Standing at child height where the pavement breaks, the pile hides the gate, and the trucks’ way is right in front of me.') },
  shelf: { f: 'fact', ic: '🔎', t: p => T2(p.fix.name + ' 선반에 "장터" 이름표를 단 저울이 있고, 눈금을 0에 다시 맞춰 두었어요.', 'On a shelf at the ' + p.fix.name + ' is a scale tagged “market”, with its marks set back to zero.') },
};
const ct = (k, p, i) => { const t = CL[k].t; return (typeof t === 'function' ? t(p) : t)[i]; };   /* 단서 글(자리가 들어가는 글은 함수) */
// 단서를 찾을 실마리(빨간 선 X · 칸·방위·랜드마크 말만) — 처음 · 이웃에게 들은 뒤
const LEAD = {
  start: p => [T2('강이나 호숫가 물가에 가면 물을 떠서 견주어 볼 수 있어요. 여러 군데를 떠 봐요.', 'At the river or lake shore you can take water samples. Try several places.'),
    T2('장터(' + p.mkCell + ' 칸) 상인이 아침에 무언가를 봤대요. 장터가 붐비는 아침 8~10시에 가 봐요.', 'A seller at the market (' + p.mkCell + ') saw something. Go while it is busy, 8–10 am.'),
    T2('비가 얼마나 왔는지는 날씨 창(위 시계 칩)에 기록이 있어요.', 'The weather window (clock chip) keeps a rain record.')],
  market: p => [T2('트럭이 다니는 호수 쪽 길 정류장(' + p.sign.cell + ' 칸)에 안내판이 있대요. 호숫가 공사장 울타리(' + p.site.cell + ' 칸 근처)도 찾아봐요.', 'There is a notice at the bus stop on the lake road (' + p.sign.cell + '). Look for the site fence by the lake (near ' + p.site.cell + ').')],
  farmer: p => [T2('공장 물이 나오는 배수구가 ' + p.drain.cell + ' 칸 물가에 있대요.', 'The factory drain comes out at the water’s edge in ' + p.drain.cell + '.')],
  farm0: p => [T2('논 일꾼은 오후(13~18시)에 ' + p.fmCell + ' 칸 논에서 일해요. 논 물은 농수로로 호수에서 와요.', 'The rice farmer works in the paddy in ' + p.fmCell + ' in the afternoon (1–6 pm). Paddy water comes from the lake by the canal.')],
  // ⚖️ 사라진 장터 저울(빨간 선 X · 칸·방위 말만 · 맡긴 곳은 바퀴 자국 방위 + 지도로 찾음)
  sc0: p => [T2('장터(' + p.mkCell + ' 칸) 판매대 바닥에 무슨 자국이 남았는지 살펴봐요.', 'Look at the ground by the stall at the market (' + p.mkCell + ') for marks.'),
    T2('장터 앞 정류장(' + p.bus.cell + ' 칸)에 버스 시간표가 있어요.', 'There is a timetable at the market bus stop (' + p.bus.cell + ').'),
    T2('어제 저녁 버스를 기다린 이웃이 정자(' + p.pav.cell + ' 칸)에 있대요. 정자 이웃들은 맑은 날 저녁 6~8시에 모여요.', 'A neighbour who waited for the bus yesterday sits at the pavilion (' + p.pav.cell + '). They meet there 6–8 pm on clear days.'),
    T2('옆 가게 이웃은 오후 1~6시에 이야기할 수 있어요. 어제 바람은 날씨 창(위 시계 칩)에 기록이 있어요.', 'The next-stall neighbour can talk 1–6 pm. Yesterday’s wind is in the weather window (clock chip).')],
  sc_track: p => [T2('바퀴 자국이 ' + DIR8[p.dir][0] + '쪽으로 나 있어요. 그쪽에 무엇이 있는지 지도에서 찾아봐요.', 'The wheel tracks lead ' + DIR8[p.dir][1] + '. Look on the map for what is that way.')],
  sc_nbr0: () => [T2('옆 가게 이웃은 잘 모른대요. 직접 본 것을 보여 주면 생각이 날지도 몰라요.', 'The next-stall neighbour does not know. Showing something you saw might help them remember.')],
  sc_nbr: p => [T2('저울을 맡겼다는 ' + p.fix.name + '(' + p.fix.cell + ' 칸)에 가서 장부를 직접 봐요(9~18시).', 'Go and read the book at the ' + p.fix.name + ' (' + p.fix.cell + ') yourself (9 am–6 pm).')],
  // 🚧 공사장 길 안전(빨간 선 X · 칸 이름과 '흙막이 세운 공사장'만)
  sr0: p => [T2('흙막이를 세운 공사장(' + p.cell + ' 칸) 입구 앞 길을 따라 걸으며 위험한 곳을 찾아봐요.', 'Walk along the road by the gate of the silt-fenced site (' + p.cell + ') and look for danger spots.'),
    T2('트럭이 언제 다니는지는 입구 곁에 서서 지켜봐야 알 수 있어요.', 'To know when the trucks run, stand by the gate and watch.'),
    T2('그 길을 자주 지나는 이웃(' + p.nb.cell + ' 칸에서 일해요)과 공사 일꾼(낮)에게도 물어봐요.', 'Ask the neighbour who often walks that road (works in ' + p.nb.cell + ') and the site worker (daytime) too.')],
  sr_crew: () => [T2('공사 일꾼은 트럭이 아침에만 다닌대요. 아침에 입구 곁에 서서 지켜봐요.', 'The site worker says the trucks run only in the morning. Stand by the gate in the morning and watch.')],
  sc_wit: () => [T2('정자 이웃은 마지막 버스가 오기 조금 전에 들었대요. 그때가 몇 시인지 정류장 시간표로 알아봐요.', 'The pavilion neighbour heard it just before the last bus. Check the bus stop timetable for the time.')],
};

const CSS = `.twn-p .cs-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}.twn-p .cs-c{border:2px solid #c9b27a;border-radius:10px;padding:6px 8px;background:#fffdf2;font-size:14px;line-height:1.45;min-height:56px}
.twn-p .cs-c h4{margin:0 0 4px;font-size:14px}.twn-p .cs-c div{margin:3px 0}.twn-p .cs-c.idea{border-style:dashed;background:#f6f8fb}
.twn-p .cs-ch{display:grid;gap:8px;margin:6px 0}.twn-p .cs-ch button{min-height:46px;font-size:15px;text-align:left}.twn-p .cs-ch button.on{outline:3px solid #2f6db5}
.twn-p .cs-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:14px;line-height:1.5}
.twn-p .cs-ld{font-size:14px;line-height:1.5;margin:4px 0}.twn-p .cs-due{font-weight:800;color:#a2541b}
@media (max-width:480px){.twn-p .cs-g{grid-template-columns:1fr}}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · banner(t, s) · chip(k, t, o) · sfx(k)
//   busy() · away() · open() 사건이 열렸나 · emOn() 긴급 사건 중 · storyBusy() 이야기 단계가 겹침 · water() 그날 물 높이(town_routine) · wxLog() 날마다 날씨 · wxDay()
//   waters() [{ id, k, name, sh }] · sdOf(sh, x, z) · sd(x, z) 물까지 · factories() · stops() · workers() · cell(x, z) · place(x, z) · okSpot(x, z) · onRoad(x, z) · gy(x, z)
//   guide(to, info) · guideOff() · mapSnip(cv, pts) · skUp(k, n, src) · rec(k, o) · buildParts(fn) · me() · bubble(o, t)
export function createCase(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.case; if (!s || typeof s !== 'object' || s.v !== CASE_V) s = g.case = { v: CASE_V, d: -1, cur: null, done: {}, log: [], helper: 0, seeds: {} }; if (!Array.isArray(s.log)) s.log = []; if (!s.done || typeof s.done !== 'object') s.done = {}; if (!s.seeds || typeof s.seeds !== 'object') s.seeds = {}; return s; };
  const mark = () => A.GAME.mark(), toast = (t, s) => A.say(t, s), sfx = k => A.sfx && A.sfx(k), day = () => A.GAME.S.day | 0, now = () => day() * DAYM + (A.GAME.S.min | 0);
  let dead = false, OFF = false, css = null, HOT = {}, HKEY = {}, VIS = {}, VKEY = {}, CHIPK = '', DBG = [], lastWx = -1;
  if (!document.getElementById('cs-css')) { css = document.createElement('style'); css.id = 'cs-css'; css.textContent = CSS; document.head.appendChild(css); }
  const me = () => A.me(), dist = (x, z) => { const m = me(); return Math.hypot(x - m.x, z - m.z); };
  const log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  const r2 = v => Math.round(v * 100) / 100;

  // ───────── 자리 정하기(생길 때 한 번 · 저장에 남김) ─────────
  //   강 = 가장 긴 물 줄 · 물머리 = 그 줄 첫 점 곁 물(호수) · 공사장 = 물머리 기슭(강이 나가는 쪽) 22~34m 뭍 · 고랑 끝 = 공사장 → 물가
  //   먼 물가 = 공사장에서 가장 먼 물머리 기슭 · 배수구 = 물에 가장 가까운 공장 → 그 물가 · 안내판 = 공사장에서 가장 가까운 정류장 곁 · 상인 = 장터 일꾼 · 논 일꾼 = 농수로 끝에 가장 가까운 논 일꾼
  function placeRiver() { const W = A.waters() || [], lines = W.filter(w => w.k === 'water' && w.sh && w.sh.line), polys = W.filter(w => w.k === 'water' && w.sh && w.sh.poly);
    if (!lines.length) { log('pl:1'); return null; } const len = l => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); return s; };
    const R = lines.sort((a, b) => len(b.sh.line) - len(a.sh.line))[0], RL = R.sh.line, p0 = RL[0];
    let src = null, bd = 40; for (const w of polys) { const d = A.sdOf(w.sh, p0[0], p0[1]); if (d < bd) { bd = d; src = w; } }
    if (!src) { log('pl:2'); return null; } const sdS = (x, z) => A.sdOf(src.sh, x, z), P = src.sh.poly; let cx = 0, cz = 0; for (const q of P) { cx += q[0]; cz += q[1]; } cx /= P.length; cz /= P.length;
    let out = null; for (let i = 1; i < RL.length && !out; i++) if (sdS(RL[i][0], RL[i][1]) > 2) out = RL[i];   /* 강이 물머리를 나가는 곳 */
    if (!out) out = RL[1] || RL[0];
    const C = []; for (let a = 0; a < 32; a++) { const ux = Math.cos(a * 0.19635), uz = Math.sin(a * 0.19635); let e = null; for (let t = 0; t < 400; t += 1) { const x = cx + ux * t, z = cz + uz * t; if (sdS(x, z) > 0) { e = [x, z]; break; } } if (!e) continue;
      for (const r of [16, 20, 24, 28, 32, 36, 40, 44]) { const x = e[0] + ux * r, z = e[1] + uz * r; if (!A.okSpot(x, z) || A.onRoad(x, z) || A.sd(x, z) < 11) continue; let ok = true; for (const [dx, dz] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) if (A.onRoad(x + dx, z + dz) || A.sd(x + dx, z + dz) < 10) ok = false; if (!ok) continue; let cr = 0; for (let t = 0; t < r; t += 1.5) if (A.onRoad(e[0] + ux * t, e[1] + uz * t)) cr = 1;   /* 공사장 → 물가 사이 찻길 = 뒤로(흙물 고랑이 길을 건너지 않게) */
        const tr9 = A.tree && A.tree(x, z, 6.5); C.push({ x, z, ex: e[0] - ux * 1.5, ez: e[1] - uz * 1.5, ux, uz, a, sc: Math.hypot(x - out[0], z - out[1]) + (tr9 ? 400 : 0) + (cr ? 900 : 0) }); break; } }   /* 나무가 울타리 안에 드는 자리는 뒤로(없으면 그래도 씀) */
    if (!C.length) { log('pl:3'); return null; } C.sort((a, b) => a.sc - b.sc); const st = C[0];
    let tr = null; for (let t = 0; t < 60; t += 0.5) { const x = st.x - st.ux * t, z = st.z - st.uz * t; if (A.sd(x, z) < 1.6) { tr = [x, z]; break; } } if (!tr) tr = [st.ex + st.ux * 2, st.ez + st.uz * 2];
    let far = null, fd = 0; for (const q of C) { const d = Math.hypot(q.x - st.x, q.z - st.z); if (d > fd) { fd = d; far = q; } }
    let fx = null; if (far) for (let t = 0; t < 70; t += 0.5) { const x = far.x - far.ux * t, z = far.z - far.uz * t; if (A.sd(x, z) < 1.6) { fx = [x, z]; break; } } if (!fx || fd < 60) { log('pl:4'); return null; }
    const F = A.factories() || []; let fac = null, fcd = 700; const nearW = (x, z) => { let b = null, d9 = 1e9; for (const L9 of [RL]) for (let i = 1; i < L9.length; i++) for (let t = 0; t <= 1; t += 0.05) { const qx = L9[i - 1][0] + (L9[i][0] - L9[i - 1][0]) * t, qz = L9[i - 1][1] + (L9[i][1] - L9[i - 1][1]) * t, d = Math.hypot(qx - x, qz - z); if (d < d9) { d9 = d; b = [qx, qz]; } } for (const q of P) { const d = Math.hypot(q[0] - x, q[1] - z); if (d < d9) { d9 = d; b = [q[0], q[1]]; } } return [b, d9]; };
    for (const f of F) { const [, d] = nearW(f.x, f.z); if (d < fcd && Math.hypot(f.x - st.x, f.z - st.z) > 60) { fcd = d; fac = f; } } if (!fac) { log('pl:5'); return null; }
    let dr = null; { const [b] = nearW(fac.x, fac.z), ux = fac.x - b[0], uz = fac.z - b[1], l = Math.hypot(ux, uz) || 1; for (let t = 0; t < 60; t += 0.5) { const x = b[0] + ux / l * t, z = b[1] + uz / l * t; if (A.sd(x, z) > 1.4) { dr = { x, z, ux: ux / l, uz: uz / l }; break; } } } if (!dr) { log('pl:6'); return null; }
    const ST = A.stops() || []; let sg = null, sgd = 380; for (const q of ST) { const d = Math.hypot(q[0] - st.x, q[1] - st.z); if (d < sgd && d > 12) { for (const [ox, oz] of [[1.8, 1.2], [-1.8, 1.2], [1.8, -1.2], [-1.8, -1.2], [2.6, 0], [-2.6, 0], [0, 2.6], [0, -2.6]]) if (A.okSpot(q[0] + ox, q[1] + oz) && !A.onRoad(q[0] + ox, q[1] + oz)) { sg = { x: q[0] + ox, z: q[1] + oz, sx: q[0], sz: q[1] }; sgd = d; break; } } }
    if (!sg) { log('pl:7'); return null; }
    const WK = A.workers() || [], wkAt = (k, rx, rz) => { let b = null, d9 = 1e9; for (const w of WK) { if (w.k !== k || w.i == null) continue; const d = Math.hypot(w.x - rx, w.z - rz); if (d < d9) { d9 = d; b = w; } } return b; };
    const canal = W.find(w => w.k === 'canal' && w.sh && w.sh.line && Math.hypot(w.sh.line[0][0] - cx, w.sh.line[0][1] - cz) < 200), cEnd = canal ? canal.sh.line[canal.sh.line.length - 1] : [st.x, st.z];
    const mk = wkAt('stall', st.x, st.z), fm = wkAt('paddy', cEnd[0], cEnd[1]); if (!mk || !fm) { log('pl:8'); return null; }
    const side = (w, k) => { const x0 = w.hx ?? w.x, z0 = w.hz ?? w.z; for (const r of [2.4, 3.2]) for (let a = 0; a < 8; a++) { const x = x0 + Math.cos(a * 0.785 + 0.4) * r, z = z0 + Math.sin(a * 0.785 + 0.4) * r; if (A.okSpot(x, z)) return { x: r2(x), z: r2(z), i: w.i, k }; } return { x: r2(x0 + 2), z: r2(z0 + 2), i: w.i, k }; };
    const mud = { x: r2(fm.x + 3), z: r2(fm.z + 3) };
    return { river: R.id, src: src.id, srcName: src.name || '', site: { x: r2(st.x), z: r2(st.z), ux: r2(st.ux), uz: r2(st.uz), cell: A.cell(st.x, st.z) }, trail: { x: r2(tr[0]), z: r2(tr[1]) }, far: { x: r2(fx[0]), z: r2(fx[1]), cell: A.cell(fx[0], fx[1]) },
      drain: { x: r2(dr.x), z: r2(dr.z), ux: r2(dr.ux), uz: r2(dr.uz), cell: A.cell(dr.x, dr.z), fac: fac.name || '' }, sign: { x: r2(sg.x), z: r2(sg.z), sx: r2(sg.sx), sz: r2(sg.sz), cell: A.cell(sg.x, sg.z) },
      market: side(mk, 'stall'), farmer: side(fm, 'paddy'), mkCell: A.cell(mk.x, mk.z), fmCell: A.cell(fm.x, fm.z), mud, out: [r2(out[0]), r2(out[1])], line: RL.map(q => [r2(q[0]), r2(q[1])]), poly: P.map(q => [r2(q[0]), r2(q[1])]) };
  }
  // ⚖️ 장터 = 곁(40m 안)에 다른 일꾼이 있는 장터 일꾼(상인 + 옆 가게 이웃) · 바닥 자국 = 판매대 앞 3.5~6.5m 빈 땅
  //   맡긴 곳 = 장터에서 600m 안 수리·철물점(수리) → 없으면 마을회관·행정복지센터(계량 검사) · 분실물 = 맡긴 곳 말고 가장 가까운 행정복지센터·경찰서
  //   정류장 = 장터에서 가장 가까운 정류장 곁(시간표) · 낮은 곳 = 바닥 자국 둘레 4~8m에서 가장 낮은 빈 땅 · 정자 = 일과(ROUTINE-2)가 고른 정자
  /* 정류장 앞(길 쪽) 방향: 저절로 놓은 정류장은 .f · 아니면 둘레 2~5m에서 찻길이 있는 쪽 */
  function roadDir(x, z) { let sx = 0, sz = 0; for (const r of [2, 3, 4, 5]) for (let a = 0; a < 16; a++) { const ux = Math.cos(a * 0.3927), uz = Math.sin(a * 0.3927); if (A.onRoad(x + ux * r, z + uz * r)) { sx += ux; sz += uz; } } const l = Math.hypot(sx, sz); return l > 0.5 ? [sx / l, sz / l] : null; }
  function placeScale() { const WK = A.workers() || [], PL9 = (A.places ? A.places() : []) || [];
    let best = null; for (const a of WK) { if (a.k !== 'stall' || a.i == null || a.gate) continue; for (const b of WK) { if (b === a || b.i == null || b.gate) continue; const d = Math.hypot(a.x - b.x, a.z - b.z) + (b.k === 'stall' ? 0 : 20); if (d < 60 && (!best || d < best.d)) best = { a, b, d }; } }
    if (!best) { log('sc:1'); return null; }
    const ring = (x0, z0, R, av, md) => { for (const r of R) for (let a = 0; a < 12; a++) { const x = x0 + Math.cos(a * 0.5236 + 0.3) * r, z = z0 + Math.sin(a * 0.5236 + 0.3) * r; if (!A.okSpot(x, z) || av.some(q => Math.hypot(q.x - x, q.z - z) < md)) continue; return { x: r2(x), z: r2(z) }; } return null; };
    const mk = best.a, nb = best.b, m0 = { x: mk.hx ?? mk.x, z: mk.hz ?? mk.z }, n0 = { x: nb.hx ?? nb.x, z: nb.hz ?? nb.z };
    const sMk = ring(m0.x, m0.z, [2.4, 3.2, 4], [], 0), sNb = sMk && ring(n0.x, n0.z, [2.4, 3.2, 4, 5], [sMk], 3), tr = sMk && sNb && ring(m0.x, m0.z, [3.5, 4.5, 5.5, 6.5], [sMk, sNb], 3);
    if (!tr) { log('sc:2'); return null; }
    const near = (ok, maxD, from) => { let b = null, bd = maxD; for (const P of PL9) { if (!P.door || P.kind === 'school' || P.kind === 'house' || !ok(P)) continue; const d = Math.hypot(P.x - from.x, P.z - from.z); if (d < bd) { bd = d; b = P; } } return b; };
    let fx = near(P => /수리|철물/.test(P.name || ''), 600, m0), fk = 'fix'; if (!fx) { fx = near(P => /마을회관|행정복지|주민센터/.test(P.name || ''), 600, m0) || near(P => /행정복지|마을회관/.test(P.name || ''), 4000, m0); fk = 'insp'; }
    if (!fx) { log('sc:3'); return null; } const fS = ring(fx.door[0], fx.door[1], [2.6, 3.4, 4.2, 5], [], 0); if (!fS) { log('sc:4'); return null; }
    const ls = near(P => (P.kind === 'police' || /행정복지/.test(P.name || '')) && Math.hypot(P.x - fx.x, P.z - fx.z) > 30, 4000, m0), lS = ls && ring(ls.door[0], ls.door[1], [2.6, 3.4, 4.2, 5], [], 0); if (!lS) { log('sc:5'); return null; }
    const ST = A.stops() || []; let bs = null, bsd = 500; for (const q of ST) { const d = Math.hypot(q[0] - m0.x, q[1] - m0.z); if (!(d < bsd && d > 8)) continue;
      const f9 = q.f || roadDir(q[0], q[1]); if (f9) { const c = f9[1], sn = f9[0]; for (const [lx, lz] of [[-3.2, 0.1], [-3.2, -0.4], [3.7, 0.1], [3.7, -0.4], [-3.8, 0.1], [-3.8, -0.5]]) { const x = q[0] + lx * c + lz * sn, z = q[1] - lx * sn + lz * c; if (A.okSpot(x, z)) { bs = { x: r2(x), z: r2(z), sx: r2(q[0]), sz: r2(q[1]), ry: r2(Math.atan2(sn, c)) }; bsd = d; break; } } if (bs && bsd === d) continue; }   /* 지붕 옆 · 길 쪽을 봄(정류장 뒤 유리 너머 X) */
      for (const [ox, oz] of [[1.8, 1.2], [-1.8, 1.2], [1.8, -1.2], [-1.8, -1.2], [2.6, 0], [-2.6, 0], [0, 2.6], [0, -2.6]]) if (A.okSpot(q[0] + ox, q[1] + oz) && !A.onRoad(q[0] + ox, q[1] + oz)) { bs = { x: r2(q[0] + ox), z: r2(q[1] + oz), sx: r2(q[0]), sz: r2(q[1]) }; bsd = d; break; } }
    if (!bs) { log('sc:6'); return null; } bs.cell = A.cell(bs.x, bs.z);
    let rl = null, ry = 1e9; for (const r of [4, 5, 6, 7, 8]) for (let a = 0; a < 12; a++) { const x = tr.x + Math.cos(a * 0.5236) * r, z = tr.z + Math.sin(a * 0.5236) * r; if (!A.okSpot(x, z) || Math.hypot(x - sMk.x, z - sMk.z) < 3 || Math.hypot(x - sNb.x, z - sNb.z) < 3) continue; const y = A.gy(x, z); if (y < ry - 0.05) { ry = y; rl = { x: r2(x), z: r2(z) }; } }
    if (!rl) { log('sc:7'); return null; }
    const pv = A.pav ? A.pav() : null; if (!pv) { log('sc:8'); return null; }
    const ux = fx.door[0] - tr.x, uz = fx.door[1] - tr.z, ul = Math.hypot(ux, uz) || 1;
    return { mk: { x: sMk.x, z: sMk.z, i: mk.i, k: 'stall' }, nb: { x: sNb.x, z: sNb.z, i: nb.i, k: nb.k }, mkCell: A.cell(m0.x, m0.z), track: { x: tr.x, z: tr.z, ux: r2(ux / ul), uz: r2(uz / ul), fy: r2(Math.atan2(sMk.x - tr.x, sMk.z - tr.z)) }, dir: dir8(ux, uz),
      fix: { x: fS.x, z: fS.z, name: fx.name || '', kind: fk, cell: A.cell(fx.x, fx.z), dx: fx.door[0], dz: fx.door[1] }, lost: { x: lS.x, z: lS.z, name: ls.name || '', cell: A.cell(ls.x, ls.z) }, bus: bs, roll: rl, pav: { x: r2(pv.x), z: r2(pv.z), cell: A.cell(pv.x, pv.z) } };
  }
  // 🚧 공사장 길 안전: 공사장 = 흐려진 강과 같은 자리(placeRiver · 같은 마을이면 같은 곳) · 입구 = 울타리 길 쪽 5.2m · 트럭 길 = 입구 → 가장 가까운 찻길(45m 안)
  //   끊긴 보도 = 트럭 길이 찻길 가장자리 1.3m 안쪽을 지나는 곳(c) · 보도 = 그 줄을 따라 양쪽 2.6~11m · 자재 더미 = 끊긴 자리 한쪽 곁 · 지켜보는 자리 = 다른 쪽 곁
  //   과속 방지 턱 = 입구 앞 찻길 · '천천히' 표지·가로등 둘 = 보도 줄 · 길을 자주 지나는 이웃 = 입구에서 가장 가까운 일꾼(600m 안)
  function placeSiteRoad() { const b = placeRiver(); if (!b) { log('sr:1'); return null; } const st = b.site, ux = st.ux, uz = st.uz, gx = st.x + ux * 5.2, gz = st.z + uz * 5.2;
    let rd = null; for (let t = 0.5; t < 45 && !rd; t += 0.5) for (const a of [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6]) { const c = Math.cos(a), sn = Math.sin(a), vx = ux * c - uz * sn, vz = ux * sn + uz * c; if (A.onRoad(gx + vx * t, gz + vz * t)) { rd = { t, vx, vz }; break; } }
    if (!rd) { log('sr:2'); return null; }
    const rx = gx + rd.vx * rd.t, rz = gz + rd.vz * rd.t; let sxx = 0, sxz = 0, szz = 0, nR = 0; for (const r of [3, 5, 7]) for (let a = 0; a < 16; a++) { const dx = Math.cos(a * 0.3927) * r, dz = Math.sin(a * 0.3927) * r; if (A.onRoad(rx + dx, rz + dz)) { sxx += dx * dx; sxz += dx * dz; szz += dz * dz; nR++; } }   /* 찻길 방향 = 둘레 찻길 점들의 긴 축 */
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz); let tx = Math.cos(th), tz = Math.sin(th), nx = -tz, nz = tx; if (nx * rd.vx + nz * rd.vz < 0) { nx = -nx; nz = -nz; }   /* n = 입구 → 찻길(길에 수직) · t = 길 따라 */
    let t0 = 0; while (t0 < 45 && !A.onRoad(gx + nx * t0, gz + nz * t0)) t0 += 0.25; if (t0 >= 45 || nR < 6) { log('sr:2b'); return null; }
    const ed = Math.max(0.3, t0 - 1.3), cx = gx + nx * ed, cz = gz + nz * ed;
    const at = (s, o) => ({ x: r2(cx + tx * s - nx * o), z: r2(cz + tz * s - nz * o) }), inSite = q => { const dx = q.x - st.x, dz = q.z - st.z, a = dx * ux + dz * uz, b = dx * uz - dz * ux; return Math.abs(a) < 4.8 && Math.abs(b) < 5.8; }, fine = q => A.okSpot(q.x, q.z) && !A.onRoad(q.x, q.z) && !inSite(q);   /* s = 길 따라 · o = 찻길에서 안쪽으로 · 공사장 울타리 안 X */
    const first = (L) => { for (const [s, o] of L) { const q = at(s, o); if (fine(q)) return q; } return null; };
    let t1 = t0; while (t1 < t0 + 30 && A.onRoad(gx + nx * t1, gz + nz * t1)) t1 += 0.25; const fo = -(t1 - ed + 1.2);   /* 길 건너편(찻길 너머 1.2m) = o 음수 */
    let side = 0, pile = null, watch = null; for (const sg of [1, -1]) { if (side) break; const p9 = first([[sg * 3.6, 1.9], [sg * 3.8, 1.2], [sg * 4.4, 0.9], [sg * 5, 0.6]]), w9 = p9 && first([[-sg * 3.4, 1.4], [-sg * 3.4, 0.9], [-sg * 4, 0.5], [-sg * 4.6, 0.3], [-sg * 1.4, fo], [-sg * 2.6, fo], [0, fo], [sg * 1.4, fo]]); if (p9 && w9) { side = sg; pile = p9; watch = w9; } }   /* 지켜보는 자리 = 자재 반대쪽 곁 → 없으면 길 건너편(입구가 보이는 곳) */
    if (!side) { log('sr:3'); return null; }
    const slowS = first([[-side * 6.2, 0.3], [-side * 7.4, 0.3], [-side * 8.6, 0.5], [-side * 5.4, 0.8], [side * 6.2, 0.3], [side * 7.4, 0.3]]), lampA = first([[side * 8.6, 0.3], [side * 9.6, 0.3], [side * 10.6, 0.5], [side * 7.4, 0.9]]), lampB = first([[-side * 10, 0.3], [-side * 11, 0.3], [-side * 9.2, 0.7], [-side * 4, fo], [side * 4, fo]]);
    const far9 = (q, L9) => L9.every(o => !o || Math.hypot(o.x - q.x, o.z - q.z) > 1.1), firstF = (L, av) => { for (const [s, o] of L) { const q = at(s, o); if (fine(q) && far9(q, av)) return q; } return null; };
    const crew = first([[-side * 1.7, 3.4], [-side * 2.2, 2.8], [side * 1.6, 3.6], [0, 4.2], [-side * 1.8, 0.9], [-side * 2.2, 0.4], [side * 1.8, 0.4]]);
    const info = firstF([[-side * 2.4, 0.3], [-side * 4.8, 0.3], [-side * 8.6, 0.3], [-side * 9.8, 0.3], [side * 6.2, 0.3], [side * 7.4, 0.3]], [slowS, lampA, lampB, crew]);   /* 안내판('공사 차량 시간' · '보도 막힘') = 입구 쪽 보도 줄 */
    if (!slowS || !lampA || !crew || !info) { log('sr:4'); return null; }
    const sw = []; for (const sg of [-1, 1]) for (let s = 2.6; s <= 11.2; s += 1.2) if (fine(at(sg * s, 0))) sw.push(r2(sg * s));
    const WK = A.workers() || []; let nb = null, nd = 600; for (const w of WK) { if (w.i == null || w.gate) continue; const d = Math.hypot(w.x - gx, w.z - gz); if (d < nd) { nd = d; nb = w; } } if (!nb) { log('sr:5'); return null; }
    const nb0 = { x: nb.hx ?? nb.x, z: nb.hz ?? nb.z }; let nbS = null; for (const r of [2.4, 3.2]) for (let a = 0; a < 8 && !nbS; a++) { const x = nb0.x + Math.cos(a * 0.785 + 0.4) * r, z = nb0.z + Math.sin(a * 0.785 + 0.4) * r; if (A.okSpot(x, z)) nbS = { x: r2(x), z: r2(z) }; } if (!nbS) nbS = { x: r2(nb0.x + 2), z: r2(nb0.z + 2) };
    return { site: { x: st.x, z: st.z, ux, uz }, cell: st.cell, gate: { x: r2(gx), z: r2(gz) }, n: [r2(nx), r2(nz)], ed: r2(ed), side, c: { x: r2(cx), z: r2(cz) }, cCell: A.cell(cx, cz),
      mud: { x: r2(cx + nx * 1.5), z: r2(cz + nz * 1.5) }, bump: { x: r2(cx + nx * 3.6), z: r2(cz + nz * 3.6) }, pile, watch, slow: slowS, info, lamp: lampA, lamp2: lampB, crew, sw,
      nb: { x: nbS.x, z: nbS.z, i: nb.i, k: nb.k, cell: A.cell(nb0.x, nb0.z) } };
  }
  const PLACE = { river: placeRiver, scale: placeScale, siteRoad: placeSiteRoad };

  // 물빛(0 맑음 ~ 1 흙빛): 물머리 안 = 고랑 끝에서 멀수록 맑음 · 강 = 흐림(내려갈수록 조금씩 옅어짐) · 흙막이 뒤 = 날마다 맑아짐
  function murk(q, x, z) { const p = q.pl, k = clearK(q), dT = Math.hypot(x - p.trail.x, z - p.trail.z); let inSrc = false; { const P = p.poly; let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } inSrc = c || dT < 40 || edgeD(P, x, z) < 9; }
    let m; const span = Math.max(50, Math.hypot(p.far.x - p.trail.x, p.far.z - p.trail.z)); if (inSrc) m = dT < span * 0.4 ? 0.95 : dT < span * 0.7 ? 0.55 : 0.12; else { let s = 0, best = 1e9, acc = 0; const R = p.line; for (let i = 1; i < R.length; i++) { const sl = Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]); for (let t = 0; t <= 1; t += 0.1) { const d = Math.hypot(R[i - 1][0] + (R[i][0] - R[i - 1][0]) * t - x, R[i - 1][1] + (R[i][1] - R[i - 1][1]) * t - z); if (d < best) { best = d; s = acc + sl * t; } } acc += sl; } m = 0.8 - Math.min(0.25, s / 1600); }
    return Math.max(0.05, m * k); }
  function edgeD(P, x, z) { let dp = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[j], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); dp = Math.min(dp, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z)); } return dp; }
  const clearK = q => { if (!q.fixD) return 1; const n = day() - q.fixD; return n <= 0 ? 1 : n === 1 ? 0.65 : n === 2 ? 0.35 : 0.1; };
  const murkWord = m => m > 0.6 ? T2('흙빛', 'muddy') : m > 0.3 ? T2('조금 흐림', 'a bit cloudy') : T2('맑음', 'clear');

  // ───────── 때 ─────────
  const dueAt = q => (q.d0 + (CASES[q.id].days - 1)) * DAYM + DUE_H * 60;
  function dueText(q) { const left = dueAt(q) - now(), dd = (q.d0 + CASES[q.id].days - 1) - day(), e = en();
    if (left <= 0) return e ? 'past the deadline' : '기한 지남';
    if (dd >= 2) return e ? 'due in ' + (dd + 1) + ' days' : (dd + 1 === 3 ? '기한 사흘' : '기한 ' + (dd + 1) + '일');
    if (dd === 1) return e ? 'due tomorrow, 6 pm' : '기한 이틀(내일 18시까지)';
    const h = Math.max(1, Math.round(left / 60)); return e ? 'due today 6 pm · ' + h + ' h left' : '오늘 18시까지 · ' + h + '시간 남음'; }
  function spend(min) { const G = A.GAME.S; G.min = Math.min(DAYM - 10, (G.min | 0) + min); mark(); }

  // ───────── 생김 ─────────
  function ctx() { const D = day(); return { water: A.water ? A.water() : null, wx: A.wxDay ? A.wxDay() : '', day: D, jang: A.jang ? A.jang() : null, windyY: A.windy ? !!A.windy(D - 1) : false, seeds: S().seeds }; }
  function plan(force, only) { const s = S(), D = day(); if (s.cur) return null; if (!force && s.d === D) return null;
    if (!force) { if (!A.open() || A.busy() || A.away() || (A.GAME.S.min | 0) < 6 * 60 + 30) { if (DBG[DBG.length - 1] !== 'wait') log('wait'); return null; } if (A.emOn() || A.storyBusy()) { s.d = D; mark(); log('skip ' + D); return null; } }
    s.d = D; mark(); const c = ctx();
    for (const id of Object.keys(CASES)) { const R = CASES[id]; if (!R.ready || R.ext || (s.done[id] && !force) || !PLACE[id] || (only && id !== only)) continue;   /* ext = 다른 모듈이 몰고 가는 줄(TYPH-1) */ if (!force && !R.when(c)) continue;
      const pl = PLACE[id](); if (!pl) { log('noPlace ' + id); continue; }
      s.cur = { id, d0: D, st: 'open', pl, clues: {}, samples: [], leads: [CASES[id].lead0 || 'start'], hyp: '', tried: [], wrong: 0, chk: 0, rep: null, repTry: 0, fixD: 0, late: 0, mudD: 0, said: 0 }; mark(); log('plan ' + id + ' ' + D); A.rec('case', { id, ev: 'start', d: D });
      announce(); return s.cur; }
    return null; }
  function announce() { const q = S().cur; if (!q) return; const R = CASES[q.id], e = en();
    A.banner(R.icon + ' ' + (e ? 'New case: ' : '새 사건: ') + L(R.t), 3.6); sfx('ding');
    A.say('📒 ' + L(R.ann), 5, 2); }   /* NOTE-1 사건 시작 = 중요(lv2 · 창이 닫힌 뒤 · 못 보면 🔔 지난 알림) */

  // ───────── 1초 칸 ─────────
  function sec() { if (dead || !A.on()) return; if (OFF) { if (S().cur) { S().cur = null; mark(); } sync(); hotSync(); chipSync(); return; } const s = S(), D = day(); let q = s.cur;
    if (!q) { plan(false); q = s.cur; }
    if (q) { if (q.st === 'open' && now() > dueAt(q) && D > q.d0 + CASES[q.id].days - 1) { q.st = 'late'; q.late = D; mark(); A.rec('case', { id: q.id, ev: 'late', d: D }); }
      const R = CASES[q.id]; if (q.st === 'late' && !q.mudD && R.lateOn({ wx: A.wxDay ? A.wxDay() : '', jang: A.jang ? A.jang() : null, day: D, d0: q.d0 })) { q.mudD = D; mark(); }   /* 늦으면 = 흐려진 강: 큰비 오는 날 논 한 칸 흙탕(하루) · 저울: 다음 장날 임시 저울(하루) */
      if (q.st === 'late' && !q.mudD && D >= q.late + R.lateMax) { q.mudD = -1; mark(); }   /* 그동안 그날이 안 오면 X */
      if (q.st === 'late' && q.mudD && (q.mudD < 0 || D > q.mudD) && !q.fixD) { q.fixD = D; q.st = 'lateFix'; mark(); }   /* 그다음 날 마을이 흙막이를 세움(벌 X) */
      if (q.st === 'ok' && D > q.rep.d && !q.fixD) { q.fixD = D; q.st = 'fixed'; mark(); s.helper = (s.helper | 0) + 1; A.rec('case', { id: q.id, ev: 'fixed', d: D }); }
      if ((q.st === 'fixed' || q.st === 'lateFix') && D >= q.fixD + 4) { s.log.unshift({ id: q.id, d0: q.d0, st: q.st === 'fixed' ? 'ok' : 'late', fixD: q.fixD, hyp: q.hyp, wrong: q.wrong, rep: q.rep ? q.rep.ev : null }); s.log.length = Math.min(s.log.length, 10); s.done[q.id] = D; const nx = CASES[q.id].next; if (nx) s.seeds[nx] = D; s.cur = null; mark(); q = null; } }
    watchSec(q); sync(); hotSync(); chipSync(); }

  // ───────── 모습(합친 부품) ─────────
  //   공사장 = 울타리(입구 하나 · 길 쪽) + 흙더미 셋 + 빗물 고랑(물가까지 흙빛 띠) + 공사 일꾼(이름 없는 역할 · 08~18시) · 흙막이 뒤 = 판 여섯 + 흙더미 덮개 · 고랑 X
  function partsSite(q, fixed) { return A.buildParts(put => {
    const W = 11, D = 9, H = 1.5, gap = 2.6;   /* 틀: z = 물 쪽(−) ~ 길 쪽(+) */
    for (const sg of [-1, 1]) put('b', sg * W / 2, 0, 0, 0.08, H, D, 0xe7d38a, 0, 0);   /* 옆 울타리 */
    for (const sg of [-1, 1]) cb(sg * W / 2, 0, 0.1, D, H); cb(0, -D / 2, W, 0.1, H); for (const sg of [-1, 1]) cb(sg * (W / 4 + gap / 4), D / 2, W / 2 - gap / 2, 0.1, H);
    put('b', 0, 0, -D / 2, W, H, 0.08, 0xe7d38a); put('b', -(W / 4 + gap / 4), 0, D / 2, W / 2 - gap / 2, H, 0.08, 0xe7d38a); put('b', W / 4 + gap / 4, 0, D / 2, W / 2 - gap / 2, H, 0.08, 0xe7d38a);   /* 물 쪽 · 길 쪽(가운데 입구) */
    for (let i = -2; i <= 2; i++) put('b', i * W / 4, H, D / 2 + 0.06, 0.1, 0.12, 0.1, 0x3a3a3a);
    const pile = (x, z, r, h) => fixed ? put('k', x, 0.02, z, r * 1.05, h * 0.9, 0, 0x3f6fa0) : put('k', x, 0.02, z, r, h, 0, 0x8a6a45);   /* 흙더미(흙빛) · 흙막이 뒤 = 파란 덮개 */
    pile(-2.6, -1.2, 2.0, 1.9); pile(1.4, -1.8, 1.7, 1.6); pile(2.8, 1.6, 1.3, 1.2);
    if (!fixed) for (let i = 0; i < 4; i++) put('b', -1.5 + i * 0.25, 0.01 + i * 0.004, -3.0 - i * 0.6, 0.35, 0.03, 0.7, 0x6b5233);   /* 울타리 안 빗물 고랑 */
    else { const zf = -D / 2 - 1.6; for (let i = -3; i <= 2; i++) put('b', i * 1.5 + 0.75, -0.15, zf, 1.4, 0.95, 0.06, i % 2 ? 0x3f6b3a : 0x4a7a44); for (let i = -3; i <= 3; i++) put('b', i * 1.5, -0.2, zf - 0.09, 0.09, 1.2, 0.09, 0x5a4632); }   /* 흙막이 판 여섯 + 말뚝 = 울타리 밖 물 쪽(밖에서 보이게) */
    put('b', W / 2 - 1.2, 0, D / 2 - 1.4, 0.06, 1.2, 0.06, 0x6a6e73); put('b', W / 2 - 1.2, 1.2, D / 2 - 1.4, 0.9, 0.55, 0.04, 0xf2c94c, 0, 0);   /* 안전 표지 */
  }); }
  function partsTrail(q) { const p = q.pl, st = p.site, tx = p.trail.x - st.x, tz = p.trail.z - st.z, l = Math.hypot(tx, tz) || 1, n = Math.max(2, Math.floor((l - 4.5) / 1.4)); return A.buildParts(put => {
    for (let i = 0; i < n; i++) { const t = 4.5 + i * 1.4, x = tx / l * t, z = tz / l * t, g = A.gy(st.x + x, st.z + z) - A.gy(st.x, st.z); put('b', x + Math.sin(i * 1.7) * 0.25, g + 0.02 + (i % 2) * 0.006, z, 0.55 + (i % 3) * 0.12, 0.03, 1.5, i % 2 ? 0x6b5233 : 0x7a5e3b, 0, Math.atan2(tx, tz)); } }); }
  function partsDrain() { return A.buildParts(put => { put('b', 0, -0.4, 0.1, 1.0, 0.9, 0.7, 0x9aa0a6); put('c', 0, 0.12, -0.25, 0.22, 0.9, 0, 0x7d858c, 0, 0, -Math.PI / 2); put('b', 0, -0.3, -1.2, 0.12, 0.42, 0.06, 0xbfe3f2); put('b', 0, -0.33, -1.5, 0.6, 0.03, 0.6, 0xbfe3f2); }); }
  function partsSign() { return A.buildParts(put => { put('b', 0, 0, -0.08, 0.08, 1.4, 0.08, 0x6a6e73); put('b', 0, 1.15, -0.02, 1.1, 0.75, 0.04, 0xfbfaf3); put('b', 0, 1.12, -0.047, 1.16, 0.81, 0.012, 0xe58a1f); }); }
  function signText(e) { const c = document.createElement('canvas'); c.width = 256; c.height = 176; const g = c.getContext('2d');
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 30px ' + FONT; g.fillText(e ? 'Works vehicles' : '공사 차량', 128, 40); g.fillText(e ? 'coming and going' : '드나들어요', 128, 78); g.font = '700 21px ' + FONT; g.fillStyle = '#56606b'; g.fillText(e ? 'Levelling ground by the lake' : '호수 둘레 땅 고르기', 128, 120); g.fillText(e ? 'Please take care' : '조심해 주세요', 128, 150);
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; const geo = new T3.PlaneGeometry(1.04, 0.7); const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: tx })); m.position.set(0, 1.525, 0.02); m.userData.own = 1; return m; }
  function partsMud() { return A.buildParts(put => { put('b', 0, 0.04, 0, 10, 0.04, 10, 0x7a5e3b); for (const [x, z, w] of [[-2.5, 1.8, 2.2], [2.2, -1.4, 1.8], [0.6, 3.1, 1.2], [-1.2, -2.8, 1.5]]) put('b', x, 0.085, z, w, 0.02, w * 0.7, 0x8f7552, 0, x * 0.3); }); }   /* 흙탕물이 덮은 논 한 칸(10m · 옅은 얼룩 넷) */
  function worker() { return A.buildParts(put => { for (const sg of [-1, 1]) put('b', sg * 0.09, 0, 0, 0.12, 0.8, 0.12, 0x3b4a5c); put('c', 0, 0.8, 0, 0.19, 0.55, 0, 0xf0a030); for (const sg of [-1, 1]) put('b', sg * 0.24, 0.86, 0.02, 0.08, 0.46, 0.08, 0xf0a030);
    put('s', 0, 1.5, 0, 0.16, 1, 0, 0xf2c9a0); put('c', 0, 1.58, 0, 0.19, 0.1, 0, 0xf5d020); put('s', 0, 1.62, 0, 0.17, 0.6, 0, 0xf5d020); }); }   /* 공사 일꾼(이름 없는 역할 · 노란 안전모 · 주황 조끼) */
  // 🚧 공사장 길 소품(합친 부품 · 끊긴 보도 가운데 c 기준 · 앞 = +z = 찻길 쪽 · +x = 길 따라 −s): 보도 판 · 자재 더미 · 길바닥 흙 · 과속 방지 턱 · 가로등 둘('천천히' 표지 · 안내판은 따로 roadSign)
  //   mode 'open' = 알아보는 동안 · 'fixed' = 고친 뒤(끊긴 자리에 철판 보도 + 건널목 표시 + 노란 울타리 · 자재 X · 흙 X) · 'closed' = 늦은 날(고깔 줄 + '보도 막힘' 판)
  function partsRoad(q, mode) { const p = q.pl, nx = p.n[0], nz = p.n[1], c0 = p.c, g0 = A.gy(c0.x, c0.z), gyL = (lx, lz) => A.gy(c0.x + lx * nz + lz * nx, c0.z - lx * nx + lz * nz) - g0, L = w => [r2((w.x - c0.x) * nz - (w.z - c0.z) * nx), r2((w.x - c0.x) * nx + (w.z - c0.z) * nz)];
    return A.buildParts(put => {
      for (const s of p.sw) put('b', -s, gyL(-s, 0) - 0.02, 0, 1.12, 0.11, 1.5, Math.round(Math.abs(s) / 1.2) % 2 ? 0xc9c4b8 : 0xbdb8ad);   /* 보도 판(입구 앞 5.2m가 비어 있음) */
      const [bx, bz] = L(p.bump); for (let i = -4; i <= 4; i++) put('b', bx + i * 0.5, gyL(bx + i * 0.5, bz) + 0.004 + (i % 2 ? 0.003 : 0), bz, 0.5, 0.07, 0.55, i % 2 ? 0xf2c94c : 0x3a3a3a);   /* 과속 방지 턱(노랑·검정) */
      for (const lp of [p.lamp, p.lamp2]) { if (!lp) continue; const [lx, lz] = L(lp), y = gyL(lx, lz); put('c', lx, y, lz, 0.07, 4.2, 0, 0x5a6068); put('b', lx, y + 4.15, lz + 0.3, 0.14, 0.08, 0.75, 0x5a6068); put('b', lx, y + 4.08, lz + 0.55, 0.28, 0.07, 0.36, 0xfff3c4, 1); }   /* 가로등(머리 = 빛 없는 밝은 판 · 새 Light X) */
      if (mode !== 'fixed') { const [px, pz] = L(p.pile), y = gyL(px, pz); cb(px - 0.85, pz, 2.1, 1.3, 2.1); cb(px + 1.35, pz, 1.3, 1.3, 1.0); for (let i = 0; i < 4; i++) put('b', px - 0.9 + (i % 2) * 0.1, y + i * 0.52, pz, 2.0, 0.5, 1.3, i % 2 ? 0x9aa0a6 : 0x8a8f95);   /* 자재 더미(블록 판 넷 · 어른 키보다 높게 2.1m) */
        for (let i = 0; i < 3; i++) put('c', px + 1.35, y + 0.18 + i * 0.36, pz - 0.45 + i * 0.45, 0.18, 1.3, 0, 0x6a7078, 0, 0, Math.PI / 2);   /* 쌓인 관 셋 */
        for (let i = 0; i < 6; i++) { const lz = -p.ed + 0.6 + i * ((p.ed + 3.2) / 6); put('b', Math.sin(i * 1.9) * 0.6, gyL(0, lz) + 0.006 + (i % 2) * 0.004, lz, 1.4 + (i % 3) * 0.3, 0.03, 0.9, i % 2 ? 0x6b5233 : 0x7a5e3b); } }   /* 바퀴에서 떨어진 흙(입구 → 찻길) */
      if (mode === 'fixed') { put('b', 0, gyL(0, 0) - 0.02, 0, 4.0, 0.11, 1.5, 0x8d9aa6); for (let i = -3; i <= 3; i++) put('b', i * 0.55, gyL(i * 0.55, 0) + 0.09, 0, 0.32, 0.025, 1.3, 0xf6f6f0);   /* 철판 보도 + 건널목 흰 줄(트럭 길을 건너는 자리) */
        for (const s of p.sw.concat([-2.5, 2.5])) { const y = gyL(-s, 0.85); put('b', -s, y, 0.85, 0.08, 1.0, 0.08, 0xf2c94c); put('b', -s, y + 1.0, 0.85, 0.1, 0.06, 0.1, 0x3a3a3a); }   /* 노란 울타리 말뚝(찻길 쪽 · 검은 머리) */
        for (const sg of [-1, 1]) { const S = p.sw.filter(s => s * sg > 0); if (!S.length) continue; const s0 = Math.min(...S.map(Math.abs)) * sg, s1 = Math.max(...S.map(Math.abs)) * sg, m = (s0 + s1) / 2, w = Math.abs(s1 - s0) + 1.2; cb(-m, 0.85, w, 0.12, 1.0); for (const [h, col] of [[0.5, 0x3a3a3a], [0.84, 0xf2c94c]]) put('b', -m, gyL(-m, 0.85) + h, 0.85, w, 0.09, 0.05, col); } }   /* 노랑·검정 가로대(입구 앞 트럭 길은 비워 둠) */
      if (mode === 'closed') cb(0, 0.2, 4.0, 0.4, 0.62);
      if (mode === 'closed') { for (let i = -2; i <= 2; i++) { const x = i * 0.9, y = gyL(x, 0.2); put('b', x, y, 0.2, 0.34, 0.03, 0.34, 0xe06a2a); put('k', x, y + 0.03, 0.2, 0.15, 0.6, 0, 0xe06a2a); put('b', x - 0.12, y + 0.32, 0.2, 0.24, 0.08, 0.24, 0xffffff); } }   /* 고깔 다섯(끊긴 자리를 막음) */
    }); }
  function partsTruck() { return A.buildParts(put => { for (const [x, z] of [[-0.95, -1.7], [0.95, -1.7], [-0.95, 0.4], [0.95, 0.4], [-0.95, 1.7], [0.95, 1.7]]) put('c', x, 0.45, z, 0.45, 0.3, 0, 0x2b2b2b, 0, Math.PI / 2, Math.PI / 2);   /* 바퀴 여섯 */
    put('b', 0, 0.55, -0.6, 2.2, 0.3, 4.4, 0x4a4f55); put('b', 0, 0.85, 1.55, 2.2, 1.55, 1.3, 0xe8a23a); put('b', 0, 1.7, 2.2, 1.9, 0.55, 0.04, 0x9cc4dc);   /* 차대 · 앞칸(앞 = +z) · 앞 유리 */
    put('b', 0, 0.85, -0.85, 2.3, 1.15, 3.1, 0xd8902c); put('b', 0, 2.0, -0.85, 2.0, 0.25, 2.8, 0x7a5e3b); }); }   /* 짐칸 + 흙 */
  function roadSign(e, lines, col) { const g = partsSign(); g.add(board(lines(e), 1.04, 0.7, 1.525, 0.02, col)); return g; }
  // ⚖️ 저울 사건 소품(합친 부품 · 앞 = +z): 바닥 자국(받침 자국 넷 + 바퀴 자국 두 줄 · 맡긴 곳 쪽) · 장부 탁자 · 저울(돌아온 저울 + '정확해요' 판 · 임시 저울 = 막대저울)
  function partsTrack(q) { const p = q.pl, t = p.track, ry = Math.atan2(t.ux, t.uz), c = Math.cos(ry), s = Math.sin(ry), g0 = A.gy(t.x, t.z), gy = (lx, lz) => A.gy(t.x + lx * c + lz * s, t.z - lx * s + lz * c) - g0; return A.buildParts(put => {
    for (const [lx, lz] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) put('b', lx, gy(lx, lz) + 0.005, lz, 0.13, 0.03, 0.13, 0x4a3a2c);   /* 저울 받침 자국 넷 */
    for (let i = 0; i < 7; i++) for (const sg of [-1, 1]) { const lz = 0.9 + i * 1.0, lx = sg * 0.38 + Math.sin(i * 0.9) * 0.05; put('b', lx, gy(lx, lz) + 0.006 + (i % 2) * 0.004, lz, 0.07, 0.03, 0.85, 0x5a4a3a); } }); }   /* 수레 바퀴 자국 두 줄(맡긴 곳 쪽으로 7m) */
  function partsBook() { return A.buildParts(put => { for (const [x, z] of [[-0.32, -0.18], [0.32, -0.18], [-0.32, 0.18], [0.32, 0.18]]) put('b', x, 0, z, 0.06, 0.74, 0.06, 0x7a5a3c);
    put('b', 0, 0.74, 0, 0.8, 0.05, 0.48, 0x8a6a45); put('b', -0.13, 0.79, 0.02, 0.24, 0.03, 0.32, 0xfbfaf3); put('b', 0.13, 0.79, 0.02, 0.24, 0.03, 0.32, 0xf4efe0); put('b', 0, 0.79, 0.02, 0.02, 0.035, 0.32, 0x8a3a2c); }); }   /* 장부 탁자 + 펼친 장부 */
  function partsScale(tmp) { return A.buildParts(put => { put('b', 0, 0, 0, 0.9, 0.72, 0.55, 0x9a7a52); put('b', 0, 0.72, 0, 0.96, 0.04, 0.6, 0x7a5a3c);   /* 판매대 낮은 탁자 */
    if (!tmp) { put('b', 0, 0.76, 0, 0.42, 0.06, 0.34, 0x9aa0a6); put('b', 0, 0.82, 0, 0.36, 0.02, 0.28, 0xd8dde2); put('b', 0, 0.76, -0.2, 0.06, 0.34, 0.06, 0x6a6e73); put('c', 0, 1.12, -0.2, 0.13, 0.05, 0, 0xf5f5f0, 0, 0, Math.PI / 2); put('b', 0, 1.1, -0.17, 0.012, 0.1, 0.012, 0xc0392b);   /* 접시 저울 + 바늘 판(0에 바늘) */
      put('b', 0.98, 0, -0.06, 0.05, 0.92, 0.05, 0x6a6e73); put('b', 0.98, 0.92, -0.02, 0.8, 0.56, 0.03, 0xfbfaf3); put('b', 0.98, 0.9, -0.047, 0.84, 0.6, 0.012, 0x2f7d4a); }   /* '정확해요' 판(글씨는 따로) */
    else { put('b', 0, 0.76, 0, 0.05, 0.5, 0.05, 0x6a5a48); put('b', 0, 1.24, 0, 0.7, 0.03, 0.04, 0x6a5a48); for (const sg of [-1, 1]) { put('b', sg * 0.33, 1.0, 0, 0.012, 0.24, 0.012, 0x4a4038); put('c', sg * 0.33, 0.98, 0, 0.11, 0.02, 0, 0xb08a4a); } put('b', 0.28, 0.76, 0.12, 0.06, 0.06, 0.06, 0x555a60); put('b', 0.38, 0.76, 0.12, 0.05, 0.05, 0.05, 0x555a60); } }); }   /* 임시 막대저울 + 추 둘 */
  function board(lines, w, h, y, z, col, x) { const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w); const g = c.getContext('2d'); g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, c.width, c.height); g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length; lines.forEach((t, i) => { g.font = (i === 0 ? '900 28px ' : '700 22px ') + FONT; g.fillStyle = i === 0 ? (col || '#2b2420') : '#3d4650'; g.fillText(t, 128, c.height * (i + 0.6) / (n + 0.2)); });
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: tx })); m.position.set(x || 0, y, z); m.userData.own = 1; return m; }
  function drop(k) { const g = VIS[k]; if (!g) return; map.remove(g); g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } } }); VIS[k] = null; }
  /* CASE-COL: 울타리·자재 더미·고깔은 몸이 못 지나감 · 만들 때 cb(가운데 x, z, 너비, 깊이, 높이)로 적고 놓을 때 세상 칸으로 바꿈(긴 판은 0.7m 조각 · 돌린 판도 꼭 맞게) · 허리 아래 = 카메라 통과(nc) */
  let COLS = null; const HC = {};
  const cb = (x, z, w, d, h) => { if (COLS) COLS.push([x, z, w, d, h]); };
  function colsOn(k, x, z, ry, y0) { const c9 = Math.cos(ry), s9 = Math.sin(ry), out = [];
    for (const [lx, lz, w, d, h] of COLS) { const n = Math.max(1, Math.ceil(Math.max(w, d) / 0.7)), alongX = w >= d;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5, px = lx + (alongX ? t * w : 0), pz = lz + (alongX ? 0 : t * d), hw = (alongX ? w / n : w) / 2 + 0.02, hd = (alongX ? d : d / n) / 2 + 0.02;
        const wx = x + px * c9 + pz * s9, wz = z - px * s9 + pz * c9, ex = Math.abs(hw * c9) + Math.abs(hd * s9), ez = Math.abs(hw * s9) + Math.abs(hd * c9), g9 = A.gy(wx, wz);
        try { const hd9 = map.collider.add({ x0: wx - ex, x1: wx + ex, z0: wz - ez, z1: wz + ez, y0: Math.min(y0, g9) - 0.5, y1: g9 + h, nc: h <= 1.2 }); if (hd9) out.push(hd9); } catch (e9) { /* 칸 넣기 실패 = 보이기만 */ } } }
    HC[k] = out; }
  function colsOff(k) { const H = HC[k]; if (!H) return; for (const h of H) { try { h.remove(); } catch (e9) { /* 이미 빠짐 */ } } HC[k] = null; }
  function put(k, key, mk, x, z, ry) { if (VKEY[k] === key) return; VKEY[k] = key; drop(k); colsOff(k); if (!key) return; COLS = []; const g = mk(); const C9 = COLS; COLS = null; g.position.set(x, A.gy(x, z), z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); VIS[k] = g; if (C9.length && map.collider && map.collider.add) { COLS = C9; colsOn(k, x, z, ry || 0, A.gy(x, z)); COLS = null; } }
  function sync() { const q0 = S().cur; syncScale(q0 && q0.id === 'scale' ? q0 : null); syncSite(q0 && q0.id === 'siteRoad' ? q0 : null); const q = q0 && q0.id === 'river' ? q0 : null;
    const e = en(), p = q && q.pl, live = q && q.st !== 'done', fixed = !!(q && q.fixD && day() >= q.fixD), siteA = p ? Math.atan2(p.site.ux, p.site.uz) : 0, m9 = A.GAME.S.min | 0;
    put('site', live ? 'site:' + (fixed ? 1 : 0) + p.site.x : '', () => partsSite(q, fixed), p && p.site.x, p && p.site.z, siteA);
    put('trail', live && !fixed ? 'trail:' + p.trail.x : '', () => partsTrail(q), p && p.site.x, p && p.site.z, 0);
    put('drain', live ? 'drain:' + p.drain.x : '', () => partsDrain(), p && p.drain.x, p && p.drain.z, p ? Math.atan2(p.drain.ux, p.drain.uz) : 0);
    put('sign', live ? 'sign:' + p.sign.x + e : '', () => { const g = partsSign(); g.add(signText(e)); return g; }, p && p.sign.x, p && p.sign.z, p ? Math.atan2(p.sign.sx - p.sign.x, p.sign.sz - p.sign.z) : 0);
    put('mud', q && q.mudD > 0 && day() === q.mudD ? 'mud:' + q.mudD : '', () => partsMud(), p && p.mud.x, p && p.mud.z, 0);
    const wOn = live && m9 >= 8 * 60 && m9 < 18 * 60, gx = p ? p.site.x + p.site.ux * 6.2 + p.site.uz * 2.2 : 0, gz = p ? p.site.z + p.site.uz * 6.2 - p.site.ux * 2.2 : 0;
    put('wk', wOn ? 'wk:' + gx : '', () => worker(), gx, gz, siteA); }
  //   🚧 공사장 길: 공사장(흙막이 선 모습) · 길 소품(알아보는 동안 / 고친 뒤 / 늦은 날) · '천천히' 표지 · 안내판(고친 뒤 '공사 차량 시간' · 늦은 날 '보도 막힘')
  //     트럭 = 알아보는 동안엔 아침 8~9시에만 입구에 · 고친 뒤엔 그때를 비우고 9~12시 · 공사 일꾼 = 8~18시
  const srMode = q => { const D = day(); return q.fixD && D >= q.fixD ? 'fixed' : q.mudD > 0 && D === q.mudD ? 'closed' : 'open'; };
  function syncSite(q) { const e = en(), p = q && q.pl, live = !!q, mode = q ? srMode(q) : '', m9 = A.GAME.S.min | 0, ry = p ? Math.atan2(p.n[0], p.n[1]) : 0;
    put('sr_site', live ? 'srs:' + p.site.x : '', () => partsSite(q, true), p && p.site.x, p && p.site.z, p ? Math.atan2(p.site.ux, p.site.uz) : 0);
    put('sr_road', live ? 'srr:' + mode + p.c.x : '', () => partsRoad(q, mode), p && p.c.x, p && p.c.z, ry);
    put('sr_slow', live ? 'srw:' + e : '', () => roadSign(e, e9 => (e9 ? ['Works vehicles', 'SLOW'] : ['공사 차량', '천천히']), '#c0392b'), p && p.slow.x, p && p.slow.z, ry);
    put('sr_info', live && mode !== 'open' ? 'sri:' + mode + e : '', () => roadSign(e, mode === 'fixed' ? (e9 => (e9 ? ['Works vehicles', 'Rest 8–9 am', 'school walk time'] : ['공사 차량 시간', '아침 8~9시 쉬어요', '아이들 학교 가는 때'])) : (e9 => (e9 ? ['Pavement closed', 'Please use', 'the other side'] : ['보도 막힘', '길 건너편으로', '돌아가 주세요'])), mode === 'fixed' ? '#2f7d4a' : '#c0392b'), p && p.info.x, p && p.info.z, ry);
    const rush = m9 >= 8 * 60 && m9 < 9 * 60, trk = live && (mode === 'fixed' ? m9 >= 9 * 60 && m9 < 12 * 60 : rush), tx = p ? p.gate.x + p.n[0] * 1.6 : 0, tz = p ? p.gate.z + p.n[1] * 1.6 : 0;
    put('sr_truck', trk ? 'srt:' + tx : '', () => partsTruck(), tx, tz, ry);
    put('sr_wk', live && m9 >= 8 * 60 && m9 < 18 * 60 ? 'srk:' + p.crew.x : '', () => worker(), p && p.crew.x, p && p.crew.z, ry + Math.PI); }
  //   저울: 알아보는 동안(open) = 바닥 자국 · 정류장 시간표 · 맡긴 곳 장부 탁자 · 돌아온 날부터 = 저울 + '정확해요' 판 · 늦은 장날 하루 = 임시 막대저울
  function syncScale(q) { const e = en(), p = q && q.pl, live = !!q, back = !!(q && q.fixD && day() >= q.fixD), slow = !!(q && q.mudD > 0 && day() === q.mudD && !back), t = p && p.track, fixA = p ? Math.atan2(p.fix.x - p.fix.dx, p.fix.z - p.fix.dz) : 0;
    put('sc_track', live && q.st === 'open' ? 'trk:' + t.x : '', () => partsTrack(q), t && t.x, t && t.z, t ? Math.atan2(t.ux, t.uz) : 0);
    put('sc_bus', live && q.st === 'open' ? 'bus:' + p.bus.x + e : '', () => { const g = partsSign(); g.add(board(e ? ['Bus timetable', 'Last bus', '6:10 pm'] : ['버스 시간표', '마지막 버스', '저녁 6시 10분'], 1.04, 0.7, 1.525, 0.02)); return g; }, p && p.bus.x, p && p.bus.z, p ? (p.bus.ry != null ? p.bus.ry : Math.atan2(p.bus.sx - p.bus.x, p.bus.sz - p.bus.z)) : 0);
    put('sc_book', live && !back && q.st === 'open' ? 'book:' + p.fix.x : '', () => partsBook(), p && p.fix.x, p && p.fix.z, fixA);
    put('sc_scale', back ? 'sc:1' + e : slow ? 'sc:tmp' : '', () => { const g = partsScale(slow); if (!slow) g.add(board(e ? ['Measured', 'Accurate'] : ['계량 검사', '정확해요'], 0.76, 0.52, 1.2, 0.0, '#2f7d4a', 0.98)); return g; }, t && t.x, t && t.z, t ? t.fy + Math.PI : 0); }   /* 판·바늘 = 손님 쪽(상인 반대쪽)을 봄 */

  // ───────── E 자리(그 자리 · 빨간 선 X — 확인 자리만 빨간 선) ─────────
  function hot(k, on, x, z, label, use, r) { const key = on ? label + ':' + x + ':' + z : ''; if (HKEY[k] === key) return; HKEY[k] = key; if (HOT[k]) { HOT[k].remove(); HOT[k] = null; } if (!on) return; HOT[k] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 2.2, label, use }); }
  function hotSync() { const q0 = S().cur; hotScale(q0 && q0.id === 'scale' ? q0 : null); hotSite(q0 && q0.id === 'siteRoad' ? q0 : null); const q = q0 && q0.id === 'river' ? q0 : null, e = en(), open = !!(q && q.st === 'open'), p = q && q.pl, m9 = A.GAME.S.min | 0;
    hot('site', open, p && p.site.x + p.site.ux * 0.8, p && p.site.z + p.site.uz * 0.8, '🔍 ' + (e ? 'Look at the soil heaps' : '흙더미 살펴보기'), () => clue('site', 'look'), 2.6);
    hot('drain', open, p && p.drain.x, p && p.drain.z, (q && q.hyp === 'fac' ? '🔎 ' : '🔍 ') + (e ? 'Look at the drain' : '배수구 살펴보기'), () => (q.hyp === 'fac' ? check('fac') : clue('drain', 'look')));
    hot('sign', open, p && p.sign.x, p && p.sign.z, '🔍 ' + (e ? 'Read the bus stop notice' : '정류장 안내판 읽기'), () => clue('sign', 'look'));
    hot('trail', open && q.hyp === 'site', p && p.trail.x, p && p.trail.z, '🔎 ' + (e ? 'Follow the muddy channel' : '흙물 자국 따라가 보기'), () => check('site'));
    hot('far', open && q.hyp === 'rain', p && p.far.x, p && p.far.z, '💧 ' + (e ? 'Compare the water here' : '여기 물 견주어 보기'), () => check('rain'));
    const tIn = (h0, h1) => () => { const m = A.GAME.S.min | 0; return m >= h0 * 60 && m < h1 * 60; }, mkT = tIn(8, 10), fmT = tIn(13, 18);   /* 누른 때의 시각으로 봄 */
    hot('market', open && !q.clues.market, p && p.market.x, p && p.market.z, '🗣 ' + (e ? 'Ask about the river' : '강 이야기 묻기'), () => talk('market', mkT()), 2.0);
    hot('farmer', open && !q.clues.farmer, p && p.farmer.x, p && p.farmer.z, '🗣 ' + (e ? 'Ask about the river' : '강 이야기 묻기'), () => talk('farmer', fmT()), 2.0);
    hot('wk', !!(q && (q.st === 'fixed' || q.st === 'lateFix') && VIS.wk), p && p.site.x + p.site.ux * 6.2 + p.site.uz * 2.2 + p.site.ux * 1.2, p && p.site.z + p.site.uz * 6.2 - p.site.ux * 2.2 + p.site.uz * 1.2, '🗣 ' + (e ? 'Talk to the site worker' : '공사 일꾼과 이야기하기'), () => react('wk'), 2.0); }
  const wkOut = i => { const w = (A.workers() || []).find(o => o.i === i); return !w || !!w.out9; };
  function talk(k, inTime) { const q = S().cur, e = en(); log('talk ' + k + ' ' + inTime + ' ' + (A.GAME.S.min | 0) + (A.panelOpen() ? ' panel' : '')); if (!q || A.panelOpen()) return; const p = q.pl[k];
    if (!inTime) { toast('🗣 ' + (k === 'market' ? (e ? 'Seller: “Busy now — come back in the morning, 8–10, when the market is lively.”' : '상인: "지금은 바빠요. 장터가 붐비는 아침 8~10시에 다시 와 줘요."') : (e ? 'Farmer: “I’m not here now — I work in the paddy 1–6 pm.”' : '논 일꾼: "지금은 쉬는 때예요. 오후 1~6시에 논에 있어요."')), 3.4); return; }
    if (wkOut(p.i)) { toast(e ? 'Nobody is here right now.' : '지금은 자리에 아무도 없어요.', 2.4); return; }
    A.bubble({ x: p.x, y: A.gy(p.x, p.z), z: p.z, sc: 1 }, ct(k, q.pl, e ? 1 : 0).replace(/^[^:]+: /, '')); clue(k, 'talk'); if (!q.leads.includes(k)) q.leads.push(k); if (k === 'market' && !q.leads.includes('farm0')) q.leads.push('farm0'); mark(); }

  // ⚖️ 저울 E 자리(단서 자리엔 빨간 선 X · 확인 자리만 빨간 선) — 사람이 하는 일은 일하는 때가 있음(town_hours.md)
  const minIn = (h0, h1) => { const m = A.GAME.S.min | 0; return m >= h0 * 60 && m < h1 * 60; };
  function hotScale(q) { const e = en(), open = !!(q && q.st === 'open'), p = q && q.pl, back = !!(q && q.fixD && day() >= q.fixD), slow = !!(q && q.mudD > 0 && day() === q.mudD && !back);
    hot('sc_track', open, p && p.track.x, p && p.track.z, '🔍 ' + (e ? 'Look at the ground by the stall' : '판매대 바닥 살펴보기'), () => clue('track', 'look'), 2.0);
    hot('sc_bus', open, p && p.bus.x, p && p.bus.z, '🔍 ' + (e ? 'Read the bus timetable' : '버스 시간표 읽기'), () => clue('bus', 'look'));
    hot('sc_book', open, p && p.fix.x, p && p.fix.z, (q && q.hyp === 'fix' ? '🔎 ' + (e ? 'Look at the shelf' : '저울 선반 살펴보기') : '🔍 ' + (e ? 'Read the book' : (p && p.fix.kind === 'insp' ? '계량 검사' : '수리') + ' 장부 보기')), () => { if (!minIn(9, 18)) { toast('🕘 ' + (e ? 'Closed now. Open 9 am–6 pm.' : '지금은 문을 닫았어요. 9시~18시에 열어요.'), 2.6); return; } if (q.hyp === 'fix') check('fix'); else clue('book', 'look'); });
    hot('sc_roll', open && q.hyp === 'wind', p && p.roll.x, p && p.roll.z, '🔎 ' + (e ? 'Search the low ground' : '판매대 뒤 낮은 곳 살펴보기'), () => check('wind'));
    hot('sc_lost', open && q.hyp === 'took', p && p.lost.x, p && p.lost.z, '🔎 ' + (e ? 'Read the lost-and-found book' : '분실물 장부 보기'), () => check('took'));
    hot('sc_wit', open && !q.clues.wit, p && p.pav.x, p && p.pav.z, '🗣 ' + (e ? 'Ask about last evening' : '어제 저녁 이야기 묻기'), () => talkScale('wit'), 3.2);
    hot('sc_nbr', open && !q.clues.nbr, p && p.nb.x, p && p.nb.z, '🗣 ' + (e ? 'Ask about the scale' : '저울 이야기 묻기'), () => talkScale('nbr'), 1.8);
    hot('sc_mk', !!(q && (open || back || slow)), p && p.mk.x, p && p.mk.z, open ? (q.chk ? '📝 ' + (e ? 'Tell the seller' : '상인에게 알려 주기') : '🗣 ' + (e ? 'Listen to the seller' : '상인 이야기 듣기')) : '🗣 ' + (e ? 'Talk to the seller' : '상인과 이야기하기'), () => talkScale('mk'), 1.8);
    hot('sc_nb2', !!(q && back), p && p.nb.x, p && p.nb.z, '🗣 ' + (e ? 'Talk to the next-stall neighbour' : '옆 가게 이웃과 이야기하기'), () => talkScale('nb2'), 1.8); }
  function talkScale(k) { const q = S().cur, e = en(); if (!q || q.id !== 'scale' || A.panelOpen()) return; const p = q.pl, bub = (o, t) => A.bubble({ x: o.x, y: A.gy(o.x, o.z), z: o.z, sc: 1 }, t); log('talkS ' + k + ' ' + (A.GAME.S.min | 0));
    if (k === 'wit') { if (!minIn(18, 20) || (A.wxDay && A.wxDay() !== 'clear')) { toast('🗣 ' + (e ? 'The neighbours meet at the pavilion 6–8 pm on clear days.' : '정자 이웃들은 맑은 날 저녁 6~8시에 정자에 모여요.'), 3); return; }
      if (A.pavOn && !A.pavOn()) { toast(e ? 'Nobody is at the pavilion yet. Wait a little.' : '정자에 아직 아무도 없어요. 조금 기다려 봐요.', 2.6); return; }
      bub(p.pav, ct('wit', p, e ? 1 : 0).replace(/^[^:]+: /, '')); clue('wit', 'talk'); if (!q.leads.includes('sc_wit')) q.leads.push('sc_wit'); mark(); return; }
    const wOk = (o, h0, h1) => minIn(h0, h1) && !wkOut(o.i);
    if (k === 'nbr') { if (!minIn(13, 18)) { toast('🗣 ' + (e ? 'Neighbour: “Busy now — come back 1–6 pm.”' : '옆 가게 이웃: "지금은 바빠요. 오후 1~6시에 다시 와 줘요."'), 3); return; } if (wkOut(p.nb.i)) { toast(e ? 'Nobody is here right now.' : '지금은 자리에 아무도 없어요.', 2.4); return; }
      const F = Object.keys(q.clues).filter(c => CL[c].f === 'fact'), say0 = e ? 'Neighbour: “The scale? Hmm, I don’t really know.”' : '옆 가게 이웃: "저울이요? 글쎄요, 잘 모르겠어요."';
      if (!F.length) { toast('🗣 ' + say0, 3); if (!q.leads.includes('sc_nbr0')) { q.leads.push('sc_nbr0'); mark(); } A.rec('case', { id: q.id, ev: 'nbr0' }); return; }
      let msg = ''; const draw = () => '<h3>👀 ' + (e ? 'What will you show?' : '무엇을 보여 줄까요?') + '</h3><div class="pc-tx">' + esc(say0) + '</div><div class="sm">' + esc(e ? 'Showing something you saw yourself might help them remember.' : '직접 본 것을 보여 주면 생각이 날지도 몰라요.') + '</div>'
        + '<div class="cs-ch">' + F.map(c => '<button class="sub" data-f="' + c + '">' + CL[c].ic + ' ' + esc(ct(c, p, e ? 1 : 0)) + '</button>').join('') + '</div><div class="sm" style="color:#a2541b;font-weight:700">' + esc(msg) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
      const P = A.openP(draw(), false, 'casenbr'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); };
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const f = b.dataset.f; if (!f) return; A.rec('case', { id: q.id, ev: 'show', k: f });
        if (f !== 'track') { msg = e ? 'Neighbour: “Hmm, that does not remind me of anything.”' : '옆 가게 이웃: "음, 그걸 봐도 잘 모르겠어요."'; sfx('tick'); paint(); return; }
        A.closeP(); bub(p.nb, ct('nbr', p, e ? 1 : 0).replace(/^[^:]+: /, '')); clue('nbr', 'talk'); if (!q.leads.includes('sc_nbr')) q.leads.push('sc_nbr'); mark(); };
      return; }
    if (k === 'mk') { if (!wOk(p.mk, 8, 19)) { toast('🗣 ' + (e ? 'The seller is at the market 8 am–7 pm.' : '상인은 아침 8시~저녁 7시에 장터에 있어요.'), 2.8); return; }
      if (q.st === 'open' && q.chk) { report(q); return; }
      if (q.st === 'open') { bub(p.mk, e ? 'I left my scale on the stall last evening, and this morning it was gone.' : '어제 저녁 판매대에 저울을 두고 갔는데, 아침에 와 보니 없어요.'); return; }
      bub(p.mk, q.fixD && day() >= q.fixD ? (e ? 'I was worried when it vanished. Thank you for having it fixed!' : '말없이 사라져서 걱정했는데, 고쳐 줘서 고마워요!') : (e ? 'This spare scale is slow. Sorry for the wait!' : '임시 저울이라 좀 느려요. 기다려 줘서 고마워요.')); return; }
    if (k === 'nb2') bub(p.nb, e ? 'Sorry I forgot to tell you. Next time I will leave a note.' : '말을 못 전해서 미안해요. 다음엔 쪽지를 남길게요.'); }

  // 🚧 공사장 길 E 자리(단서 자리엔 빨간 선 X · 확인 자리만) — 지켜보기 = 그 시각(8~9시)에 그 자리에 서 있어야(1초 칸이 셈 · 떠나면 처음부터)
  function hotSite(q) { const e = en(), open = !!(q && q.st === 'open'), p = q && q.pl, done9 = !!(q && q.fixD && day() >= q.fixD);
    hot('sr_watch', open && !q.clues.sr_truck && !q.watch, p && p.watch.x, p && p.watch.z, '🔍 ' + (e ? 'Stand by the gate and watch' : '입구 곁에 서서 지켜보기'), () => watchStart(), 2.0);
    hot('sr_mud', open, p && p.mud.x, p && p.mud.z, '🔍 ' + (e ? 'Look at the road surface' : '길바닥 살펴보기'), () => clue('sr_mud', 'look'), 2.0);
    hot('sr_pile', open, p && p.pile.x, p && p.pile.z, '🔍 ' + (e ? 'Look at the pile of materials' : '쌓인 자재 살펴보기'), () => clue('sr_pile', 'look'), 2.4);
    hot('sr_gap', open, p && p.c.x, p && p.c.z, q && q.hyp === 'cross' ? '🔎 ' + (e ? 'Stand at child height where it breaks' : '끊긴 보도에 아이 눈높이로 서 보기') : '🔍 ' + (e ? 'Look at the pavement' : '보도 살펴보기'), () => (q.hyp === 'cross' ? check('cross') : clue('sr_gap', 'look')), 1.8);
    hot('sr_slow', open && q.hyp === 'speed', p && p.slow.x, p && p.slow.z, '🔎 ' + (e ? 'Look at the road by the gate' : '입구 앞 찻길 살펴보기'), () => check('speed'));
    hot('sr_lamp', open && q.hyp === 'dark', p && p.lamp.x, p && p.lamp.z, '🔎 ' + (e ? 'Look at the street lamps' : '가로등 살펴보기'), () => check('dark'));
    hot('sr_nbr', open && !q.clues.sr_nbr, p && p.nb.x, p && p.nb.z, '🗣 ' + (e ? 'Ask about the site road' : '공사장 길 이야기 묻기'), () => talkSite('nbr'), 2.0);
    hot('sr_crew', !!(q && VIS.sr_wk && (open ? !q.clues.sr_crew : done9)), p && p.crew.x, p && p.crew.z, '🗣 ' + (open ? (e ? 'Ask the site worker' : '공사 일꾼에게 묻기') : (e ? 'Talk to the site worker' : '공사 일꾼과 이야기하기')), () => talkSite('crew'), 2.0); }
  function watchStart() { const q = S().cur, e = en(); if (!q || q.id !== 'siteRoad' || q.st !== 'open' || A.panelOpen()) return;
    if (!minIn(8, 9)) { toast('🚚 ' + (e ? 'The gate is quiet now. No trucks are coming or going.' : '지금은 입구가 조용해요. 드나드는 트럭이 없어요.'), 3); A.rec('case', { id: q.id, ev: 'watch0', m: A.GAME.S.min | 0 }); return; }
    q.watch = 1; mark(); toast('🚚 ' + (e ? 'Stay here and watch the gate for a while. If you leave, you start again.' : '이 자리에 서서 입구를 잠깐 지켜봐요. 자리를 떠나면 처음부터 다시 봐요.'), 3.4); }
  function watchSec(q) { if (!q || q.id !== 'siteRoad' || q.st !== 'open' || !q.watch) return; const w = q.pl.watch, e = en();
    if (dist(w.x, w.z) > 3.5 || A.away() || !minIn(8, 9)) { q.watch = 0; mark(); log('watch:left'); A.say('🚚 ' + (e ? 'You did not see it through. Come back and watch again.' : '끝까지 못 봤어요. 다시 와서 지켜봐요.'), 2.6, 1); return; }
    if (++q.watch > 6 && !A.panelOpen()) { q.watch = 0; mark(); clue('sr_truck', 'body'); } }
  function talkSite(k) { const q = S().cur, e = en(); if (!q || q.id !== 'siteRoad' || A.panelOpen()) return; const p = q.pl, bub = (o, t) => A.bubble({ x: o.x, y: A.gy(o.x, o.z), z: o.z, sc: 1 }, t); log('talkR ' + k + ' ' + (A.GAME.S.min | 0));
    if (k === 'nbr') { if (wkOut(p.nb.i)) { toast(e ? 'Nobody is here right now.' : '지금은 자리에 아무도 없어요.', 2.4); return; } bub(p.nb, ct('sr_nbr', p, e ? 1 : 0).replace(/^[^:]+: /, '')); clue('sr_nbr', 'talk'); return; }
    if (k !== 'crew' || !VIS.sr_wk) return;
    if (q.st === 'open') { bub(p.crew, ct('sr_crew', p, e ? 1 : 0).replace(/^[^:]+: /, '')); clue('sr_crew', 'talk'); if (!q.leads.includes('sr_crew')) { q.leads.push('sr_crew'); mark(); } return; }
    bub(p.crew, e ? 'Resting an hour each morning slows the work a little. Still, the children come first.' : '아침 한 시간을 쉬니 공사가 조금 늦어져요. 그래도 아이들이 먼저지요.'); }

  // ───────── 단서 얻기 ─────────
  function clue(k, how, quiet) { const q = S().cur, e = en(); if (!q || q.st !== 'open') return false; const neu = !q.clues[k];
    if (neu) { q.clues[k] = { d: day(), m: A.GAME.S.min | 0, how }; mark(); A.skUp('look', 1, 'case:' + q.id); A.rec('case', { id: q.id, ev: 'clue', k, how }); sfx('ding'); }
    if (!quiet) { const c = CL[k]; if (A.panelOpen()) A.closeP(); const P = A.openP('<h3>' + c.ic + ' ' + esc(c.f === 'fact' ? (e ? 'What I saw' : '본 것') : (e ? 'What I heard' : '들은 생각')) + '</h3><div class="pc-tx">' + esc(ct(k, q.pl, e ? 1 : 0)) + '</div><div class="sm">' + esc(neu ? (e ? 'Written in the notebook.' : '수첩에 적었어요.') : (e ? 'Already in the notebook.' : '벌써 수첩에 있어요.')) + (neu && nClue(q) === 3 && !q.hyp ? ' ' + esc(e ? 'Three clues — you can now pick a reason in the notebook.' : '단서가 셋이에요. 수첩에서 까닭을 골라 볼 수 있어요.') : '') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="nb">📒 ' + (e ? 'Notebook' : '수첩 보기') + '</button></div>', false, 'caseclue');
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') notebook(); }; }
    return neu; }
  const nClue = q => Object.keys(q.clues).filter(k => !(CASES[q.id].chkOnly || []).includes(k)).length;   /* 확인 자리에서만 얻는 본 것은 셈 X */

  // 💧 물 떠 보기(몸으로): 강·호숫가 물가(물에서 3.5m 안)에서만 · 앞서 뜬 곳과 30m 넘게 떨어져야 새로 셈 · 셋 이상 + 맑은 곳·흐린 곳이 다 있어야 단서
  function nearWater() { const q = S().cur; if (!q || q.id !== 'river' || q.st !== 'open' || A.away()) return false; const m = me(), sd = A.sd(m.x, m.z); if (!(sd > -1.2 && sd < 3.5)) return false;
    const p = q.pl; let dl = 1e9; for (let i = 1; i < p.line.length; i++) { const a = p.line[i - 1], b = p.line[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((m.x - a[0]) * dx + (m.z - a[1]) * dz) / l2)); dl = Math.min(dl, Math.hypot(a[0] + dx * t - m.x, a[1] + dz * t - m.z)); }
    return dl < 32 || edgeD(p.poly, m.x, m.z) < 8; }
  function sample() { const q = S().cur, e = en(); if (!q || A.panelOpen() || A.busy()) return; const m = me(); if (!nearWater()) { toast(e ? 'Go right to the water’s edge first.' : '물가 바로 앞까지 가야 물을 뜰 수 있어요.', 2.4); return; }
    const mm = murk(q, m.x, m.z), near = q.samples.find(o => Math.hypot(o.x - m.x, o.z - m.z) < 30), cell = A.cell(m.x, m.z);
    if (!near) { q.samples.push({ x: r2(m.x), z: r2(m.z), m: r2(mm), cell, d: day(), t: A.GAME.S.min | 0 }); mark(); sfx('pop'); A.rec('case', { id: q.id, ev: 'sample', m: r2(mm), cell }); }
    const S9 = q.samples, hasC = S9.some(o => o.m < 0.3), hasM = S9.some(o => o.m > 0.6), done = S9.length >= 3 && hasC && hasM;
    const hint = done ? '' : S9.length < 3 ? (e ? 'Take water at ' + (3 - S9.length) + ' more place(s), each 30 m or more apart.' : '30m 넘게 떨어진 곳에서 ' + (3 - S9.length) + '번 더 떠 봐요.') : !hasC ? (e ? 'All brown so far. Is it clearer farther away?' : '아직 모두 흐려요. 더 먼 물가는 어떨까요?') : (e ? 'All clear so far. Where does it get muddy?' : '아직 모두 맑아요. 어디부터 흐려질까요?');
    const P = A.openP('<h3>💧 ' + (e ? 'Water sample' : '물 떠 보기') + '</h3><canvas class="cs-cup" width="300" height="150" style="display:block;margin:4px auto;max-width:100%"></canvas><div class="pc-tx">' + esc((e ? 'Here (' + cell + '): ' : '여기(' + cell + ' 칸) 물: ') + L(murkWord(mm))) + (near ? ' <small>' + esc(e ? '(near a place you already sampled)' : '(앞서 뜬 곳과 가까워요)') + '</small>' : '') + '</div>'
      + '<div class="sm">' + esc(e ? 'Samples so far: ' : '지금까지 뜬 물: ') + S9.map(o => o.cell + ' ' + L(murkWord(o.m))).join(' / ') + '</div>' + (hint ? '<div class="sm">' + esc(hint) + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="nb">📒 ' + (e ? 'Notebook' : '수첩 보기') + '</button></div>', false, 'casesmp');
    cup(P.querySelector('canvas'), S9.slice(-3), near ? null : S9[S9.length - 1]);
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') notebook(); };
    if (done && !q.clues.sample) clue('sample', 'body', true); }
  function cup(cv, L9, cur) { if (!cv) return; const g = cv.getContext('2d'), e = en(); g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 300, 150);
    L9.forEach((o, i) => { const x = 20 + i * 95, y = 22, w = 70, h = 96; g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); const mx = o.m, r = Math.round(196 - 90 * mx), gg = Math.round(222 - 120 * mx), b = Math.round(236 - 170 * mx); g.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')'; g.fillRect(x + 3, y + 22, w - 6, h - 25);
      g.fillStyle = 'rgba(40,30,20,' + (1 - mx).toFixed(2) + ')'; g.font = '800 14px ' + FONT; g.textAlign = 'center'; g.fillText(e ? 'ABC' : '가나다', x + w / 2, y + h - 12);   /* 바닥 글씨가 보이면 맑음(투명도 재기) */
      g.strokeStyle = o === cur ? '#2f6db5' : '#4a4038'; g.lineWidth = o === cur ? 4 : 2; g.strokeRect(x, y, w, h); g.fillStyle = '#2b2420'; g.font = '700 13px ' + FONT; g.fillText(o.cell, x + w / 2, y + h + 18); }); }

  // ───────── 까닭 고르기 → 확인 ─────────
  function hypPick() { const q = S().cur, e = en(), R = q && CASES[q.id]; if (!q || q.st !== 'open') return; if (nClue(q) < 3) { toast(e ? 'Find at least three clues first.' : '단서를 셋 넘게 모아야 까닭을 고를 수 있어요.', 2.6); return; }
    const H = R.hyps.slice().sort((a, b) => hashS(a.k + q.d0) - hashS(b.k + q.d0));
    const P = A.openP('<h3>🤔 ' + (e ? 'Pick a reason' : '까닭 고르기') + '</h3><div class="pc-tx">' + esc(e ? 'Which reason fits your clues best?' : '모은 단서로 보면 어떤 까닭이 가장 그럴듯해요?') + '</div><div class="sm">' + esc(e ? 'Then go and check it. A wrong guess costs time (90 min).' : '고른 까닭은 그 자리에 가서 확인해요. 틀리면 시간이 90분 흘러요.') + '</div>'
      + '<div class="cs-ch">' + H.map(h => '<button class="sub" data-h="' + h.k + '"' + (q.tried.includes(h.k) ? ' disabled style="opacity:.5"' : '') + '>' + esc(L(h.t)) + (q.tried.includes(h.k) ? esc(e ? ' (it was not this)' : ' (아니었어요)') : '') + '</button>').join('') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'casehyp');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const k = b.dataset.h; if (!k || q.tried.includes(k)) return; q.hyp = k; mark(); A.closeP(); A.rec('case', { id: q.id, ev: 'hyp', k });
      const to = chkAt(q, k); A.guide([to.x, to.z], { icon: '🔎', name: e ? 'Check here' : '확인할 곳' }); toast(e ? 'Follow the red line to the place to check.' : '확인할 곳까지 빨간 선을 따라가요.', 2.6); }; }
  const chkAt = (q, k) => { const h = CASES[q.id].hyps.find(o => o.k === k); return q.pl[h.chk]; };
  function check(k) { const q = S().cur, e = en(), R = q && CASES[q.id]; if (!q || q.st !== 'open' || q.hyp !== k || A.panelOpen()) return; const h = R.hyps.find(o => o.k === k); A.guideOff();
    if (!h.ok) { q.tried.push(k); q.wrong++; q.hyp = ''; spend(COST); clue(h.fk, 'check', true); A.rec('case', { id: q.id, ev: 'no', k }); sfx('tick');
      const P = A.openP('<h3>🔎 ' + (e ? 'Checked' : '확인해 봤어요') + '</h3><div class="pc-tx">' + esc(L(h.no)) + '</div><div class="sm cs-due">' + esc((e ? 'Checking took 90 min · ' : '확인하느라 90분이 흘렀어요 · ') + dueText(q)) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="h">🤔 ' + (e ? 'Pick another reason' : '다른 까닭 고르기') + '</button></div>', false, 'casechk');
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'h') hypPick(); }; return; }
    q.chk = day(); clue(h.fk, 'check', true); A.skUp('explore', 3, 'case:' + q.id + ':chk'); A.rec('case', { id: q.id, ev: 'yes', k }); sfx('ding');
    const P = A.openP('<h3>🔎 ' + (e ? 'That was it!' : '맞았어요!') + '</h3><div class="pc-tx">' + esc(ct(h.fk, q.pl, e ? 1 : 0)) + '</div><div class="sm">' + esc(L(R.yes)) + '</div><div class="sm cs-due">' + esc(dueText(q)) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="way">🧭 ' + esc(L(repWay(q).t)) + '</button></div>', false, 'casechk');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'way') { const w = repWay(q); if (w.at) { A.guide(w.at, { icon: w.icon, name: L(w.name) }); toast(e ? 'Follow the red line.' : '빨간 선을 따라가요.', 2.2); } } }; }
  function hallNear() { const H = A.halls ? A.halls() : [], m0 = me(); let b = null, bd = 1e18; for (const h of H) { const d = Math.hypot(h.door[0] - m0.x, h.door[1] - m0.z); if (d < bd) { bd = d; b = h; } } return b; }
  /* 보고하는 곳: 흐려진 강 = 행정복지센터 창구 · 저울 = 장터 상인 */
  function repWay(q) { if (CASES[q.id].repTo === 'mk') return { icon: '⚖️', t: T2('장터 상인 길 안내', 'Way to the seller'), name: T2('장터 상인', 'Market seller'), at: [q.pl.mk.x, q.pl.mk.z] }; const hl = hallNear(); return { icon: '🏛', t: T2('행정복지센터 길 안내', 'Way to the centre'), name: T2('행정복지센터', 'Community centre'), at: hl ? hl.door : null }; }

  // ───────── 보고서(흐려진 강 = 창구 · town_fix.js 탁자에서 부름 / 저울 = 장터 상인 E) ─────────
  //   근거 둘(모은 단서를 섞어 보임 · 칸 이름 없이) → '생각'이면 되물음 · 본 것이지만 맞는 까닭을 보여 주지 않으면 하나 더 · 맞으면 접수 + 낱말 둘
  function desk(h) { const q = S().cur; if (!q || q.st !== 'open' || !q.chk || CASES[q.id].repTo !== 'hall') return false; if (A.panelOpen() || A.busy()) return true; report(q); return true; }
  const IDEA_RIVER = { market: T2('그건 장터 상인의 생각이에요. 직접 보거나 뜬 것으로 골라 줄래요?', 'That is what the seller thinks. Can you pick something you saw or measured yourself?'), farmer: T2('그건 논 일꾼의 생각이에요. 직접 본 것으로 골라 줄래요?', 'That is what the farmer thinks. Can you pick something you saw yourself?') };
  const ideaAsk = w => { const W = w || T2('이웃', 'a neighbour'); return T2('그건 ' + W[0] + '의 생각이에요. 직접 본 것으로 골라 줄래요?', 'That is what ' + W[1] + ' thinks. Can you pick something you saw yourself?'); };
  function report(q) { const e = en(), R = CASES[q.id], hall = R.repTo === 'hall';
    const K = Object.keys(q.clues).sort((a, b) => hashS(a + q.d0 + 'r') - hashS(b + q.d0 + 'r')); let pick = [], msg = '';
    const draw = () => '<h3>📝 ' + (e ? 'Case report: ' : '사건 보고서: ') + esc(L(R.t)) + '</h3><div class="pc-tx">' + esc(L(R.ask)) + '</div>'
      + '<div class="sm">' + esc((e ? 'Reason: ' : '까닭: ') + L(R.hyps.find(o => o.ok).t)) + '</div><div class="cs-ch">' + K.map(k => '<button class="sub' + (pick.includes(k) ? ' on' : '') + '" data-k="' + k + '">' + CL[k].ic + ' ' + esc(ct(k, q.pl, e ? 1 : 0)) + '</button>').join('') + '</div>'
      + '<div class="sm" data-m style="color:#a2541b;font-weight:700">' + esc(msg) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="go"' + (pick.length === 2 ? '' : ' disabled style="opacity:.5"') + '>' + (hall ? '📮 ' + (e ? 'Hand in' : '내기') : '👀 ' + (e ? 'Show' : '보여 주기')) + '</button></div>';
    const P = A.openP(draw(), false, 'caserep'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.k) { const k = b.dataset.k; pick = pick.includes(k) ? pick.filter(o => o !== k) : pick.concat(k).slice(-2); msg = ''; paint(); return; }
      if (b.dataset.a === 'go' && pick.length === 2) { q.repTry++; mark(); const idea = pick.find(k => CL[k].f === 'idea');
        if (idea) { const who = hall ? (e ? 'Clerk' : '직원') : (e ? 'Seller' : '상인'); msg = who + (e ? ': “' : ': "') + L(IDEA_RIVER[idea] || ideaAsk(CL[idea].who)) + (e ? '”' : '"'); sfx('tick'); A.rec('case', { id: q.id, ev: 'repIdea', k: idea }); pick = pick.filter(k => k !== idea); paint(); return; }
        if (!pick.some(k => R.sup.includes(k))) { msg = L(R.nosup); sfx('tick'); pick = []; paint(); return; }
        const ev0 = pick.slice(), bx = P.querySelector('.bx') || P;
        const accept = () => { q.rep = { d: day(), m: A.GAME.S.min | 0, ev: ev0, fx: q.fixK || '' }; q.st = 'ok'; mark(); A.skUp('explore', 4, 'case:' + q.id + ':rep'); A.rec('case', { id: q.id, ev: 'rep', k: ev0, tries: q.repTry, wrong: q.wrong }); sfx('ding'); P.onclick = ev9 => { const b9 = ev9.target.closest('button'); if (b9) A.closeP(); };
          bx.innerHTML = '<h3>📝 ' + (hall ? (e ? 'Report received' : '보고서를 받았어요') : (e ? 'The seller understands' : '상인이 알았어요')) + '</h3><div class="pc-tx">' + esc(L(R.recv)) + '</div><div class="cs-wd">' + R.words.map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '좋아요') + '</button></div>'; };
        if (!R.fixes) { accept(); return; }
        /* 🚧 대책 고르기(근거가 받아들여진 뒤 · 섞어 보임) — 본 것을 고치지 못하는 대책은 직원이 까닭을 말하고 다시 고름(시간 X) */
        const F = R.fixes.slice().sort((a, b) => hashS(a.k + q.d0 + 'f') - hashS(b.k + q.d0 + 'f')); let fm = '';
        const drawF = () => '<h3>🛠 ' + (e ? 'What should we do?' : '대책 고르기') + '</h3><div class="pc-tx">' + esc(L(R.fixAsk)) + '</div><div class="cs-ch">' + F.map(f => '<button class="sub" data-x="' + f.k + '">' + esc(L(f.t)) + '</button>').join('') + '</div><div class="sm" style="color:#a2541b;font-weight:700">' + esc(fm) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
        bx.innerHTML = drawF(); P.onclick = ev9 => { const b9 = ev9.target.closest('button'); if (!b9) return; if (b9.dataset.a === 'x') { A.closeP(); return; } const f = F.find(o => o.k === b9.dataset.x); if (!f) return; A.rec('case', { id: q.id, ev: 'fixPick', k: f.k });
          if (!f.ok) { fm = (e ? 'Clerk: “' : '직원: "') + L(f.no) + (e ? '”' : '"'); sfx('tick'); bx.innerHTML = drawF(); return; }
          q.fixK = f.k; accept(); }; } }; }

  // ───────── 수첩 창 ─────────
  function notebook() { const q = S().cur, e = en(); if (!q) { toast(e ? 'No case right now.' : '지금은 사건이 없어요.', 2); return; } if (A.panelOpen()) A.closeP(); const R = CASES[q.id];
    const col = f => Object.keys(q.clues).filter(k => CL[k].f === f).map(k => '<div>' + CL[k].ic + ' ' + esc(ct(k, q.pl, e ? 1 : 0)) + '</div>').join('') || '<div class="sm">' + esc(e ? '(nothing yet)' : '(아직 없어요)') + '</div>';
    const leads = q.leads.flatMap(k => (LEAD[k] ? LEAD[k](q.pl) : [])).map(t => '<div class="cs-ld">· ' + esc(L(t)) + '</div>').join('');
    const res = resultHtml(q); const st = q.st;
    const P = A.openP('<h3>📒 ' + (e ? 'Case notebook: ' : '사건 수첩: ') + esc(L(R.t)) + '</h3><div class="pc-tx">' + esc((e ? 'Task: ' : '할 일: ') + L(R.q)) + '</div>'
      + (st === 'open' ? '<div class="sm cs-due">' + esc(dueText(q)) + (q.hyp ? esc(e ? ' · checking: ' : ' · 확인하러 가는 까닭: ') + esc(L(R.hyps.find(o => o.k === q.hyp).t)) : '') + (q.chk ? esc(R.repTo === 'mk' ? (e ? ' · tell: the market seller' : ' · 알릴 곳: 장터 상인') : (e ? ' · report: community centre desk' : ' · 보고서: 행정복지센터 창구')) : '') + '</div>' : '')
      + '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'What I saw (facts)' : '본 것(사실)') + '</h4>' + col('fact') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'What I heard (ideas)' : '들은 생각') + '</h4>' + col('idea') + '</div></div>'
      + (q.samples.length ? '<canvas class="pc-map" width="560" height="220"></canvas>' : '') + (st === 'open' ? '<div class="grp">' + (e ? 'Where to look' : '알아볼 곳') + '</div>' + leads : '') + res
      + '<div class="cs-wd">' + R.words.map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>' + (st === 'open' && !q.chk ? '<button data-a="h"' + (nClue(q) >= 3 ? '' : ' disabled style="opacity:.5"') + '>🤔 ' + (e ? 'Pick a reason' : '까닭 고르기') + (nClue(q) >= 3 ? '' : esc(e ? ' (3 clues)' : ' (단서 셋부터)')) + '</button>' : '') + (st === 'open' && q.hyp ? '<button class="sub" data-a="way">🧭 ' + (e ? 'Way to check' : '확인할 곳 길') + '</button>' : '') + '</div>', false, 'case');
    const cv = P.querySelector('canvas'); if (cv) A.mapSnip(cv, q.samples.map((o, i) => ({ x: o.x, z: o.z, label: (i + 1) + ' ' + L(murkWord(o.m)), main: o.m > 0.6 })));
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'h') hypPick(); else if (b.dataset.a === 'way' && q.hyp) { const to = chkAt(q, q.hyp); A.guide([to.x, to.z], { icon: '🔎', name: e ? 'Check here' : '확인할 곳' }); } }; return P; }
  function resultHtml(q) { const e = en(), D = day(); if (q.st === 'open') return ''; if (q.id === 'scale') return resultScale(q); if (q.id === 'siteRoad') return resultSite(q);
    if (q.st === 'ok') return '<div class="grp">' + (e ? 'Waiting for' : '기다리는 것') + '</div><div class="cs-ld">' + esc(e ? 'Tomorrow morning: silt fences at the site.' : '내일 아침: 공사장에 흙막이가 서요.') + '</div>';
    const late = q.st === 'late' || q.st === 'lateFix', mudNow = q.mudD > 0 && D === q.mudD, H = [];
    if (late) H.push(e ? 'The report was late. ' : '보고가 늦었어요. ', mudNow || q.mudD > 0 ? (e ? 'In the heavy rain, muddy water ran down the canal into one rice paddy for a day. ' : '큰비 오는 날 흙탕물이 농수로를 타고 논 한 칸에 하루 들어갔어요. ') : '', e ? 'Next time, tell the centre sooner.' : '다음엔 더 빨리 알려 줘요.');
    const fx = q.fixD && D >= q.fixD; const F = fx ? [e ? 'Six silt-fence boards stand at the site, and the soil heaps are covered.' : '공사장에 흙막이 판 여섯 장이 섰고, 흙더미에 덮개를 덮었어요.', e ? 'The water gets a little clearer each day.' : '물이 하루하루 조금씩 맑아져요.'] : [];
    const I = fx ? [e ? 'Rice farmer: “The canal water will be clear for the paddy. Good!”' : '논 일꾼: "농수로 물이 맑아지면 논이 좋아하겠어요."', e ? 'Site worker: “The fences slowed our work by a day. Still, it had to be done.”' : '공사 일꾼: "흙막이를 세우느라 공사가 하루 늦어졌어요. 그래도 했어야 할 일이지요."'] : [];
    return '<div class="grp">' + (e ? 'What happened' : '어떻게 되었나') + '</div>' + (H.length ? '<div class="cs-ld">' + esc(H.join('')) + '</div>' : '') + (F.length ? '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'Facts' : '본 것') + '</h4>' + F.map(t => '<div>' + esc(t) + '</div>').join('') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'Ideas' : '생각') + '</h4>' + I.map(t => '<div>' + esc(t) + '</div>').join('') + '</div></div><div class="cs-ld">' + esc(e ? 'In our real town: is there a silt fence at the building sites near us?' : '우리 진짜 동네라면? 가까운 공사장에 흙막이가 있는지 살펴봐요.') + '</div>' : ''); }
  // ⚖️ 저울 결과: 기다림 · 돌아온 저울(본 것 둘 + 생각 둘 · 서로 고맙다) · 늦음(임시 저울 · 벌 X) · 공정한 거래 한 줄 · 우리 진짜 동네라면?
  function resultScale(q) { const e = en(), D = day();
    if (q.st === 'ok') return '<div class="grp">' + (e ? 'Waiting for' : '기다리는 것') + '</div><div class="cs-ld">' + esc(e ? 'Tomorrow morning: the fixed scale comes back to the market.' : '내일 아침: 장터에 고친 저울이 돌아와요.') + '</div>';
    const late = q.st === 'late' || q.st === 'lateFix', back = q.fixD && D >= q.fixD, H = [];
    if (late) H.push(e ? 'You told the seller late. ' : '상인에게 늦게 알렸어요. ', q.mudD > 0 ? (e ? 'On market day the seller weighed with a slow spare scale, and the queue was long. ' : '장날에 상인이 임시 저울로 무게를 재느라 손님 줄이 길었어요. ') : '', e ? 'Next time, tell them sooner.' : '다음엔 더 빨리 알려 줘요.');
    const F = back ? [e ? 'The scale is back on the stall with a “Measured · Accurate” card.' : '장터 판매대에 저울이 돌아왔고, "계량 검사 · 정확해요" 판이 붙었어요.', e ? 'With nothing on it, the needle points to 0.' : '아무것도 안 올리면 바늘이 0을 가리켜요.'] : [];
    const I = back ? [e ? 'Seller: “I was worried when it vanished. Thank you for having it fixed!”' : '상인: "말없이 사라져서 걱정했는데, 고쳐 줘서 고마워요."', e ? 'Next-stall neighbour: “Sorry I forgot to tell you. Next time I will leave a note.”' : '옆 가게 이웃: "말을 못 전해서 미안해요. 다음엔 쪽지를 남길게요."'] : [];
    return '<div class="grp">' + (e ? 'What happened' : '어떻게 되었나') + '</div>' + (H.length ? '<div class="cs-ld">' + esc(H.join('')) + '</div>' : '') + (F.length ? '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'Facts' : '본 것') + '</h4>' + F.map(t => '<div>' + esc(t) + '</div>').join('') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'Ideas' : '생각') + '</h4>' + I.map(t => '<div>' + esc(t) + '</div>').join('') + '</div></div>'
      + '<div class="cs-ld">' + esc(e ? 'A scale must be accurate so that neither the buyer nor the seller loses out.' : '저울이 정확해야 사는 사람도 파는 사람도 손해를 보지 않아요.') + '</div><div class="cs-ld">' + esc(e ? 'In our real town: is there a check sticker on the market scales?' : '우리 진짜 동네라면? 시장 저울에 검사 표시가 붙어 있는지 살펴봐요.') + '</div>' : ''); }
  // 🚧 공사장 길 결과: 기다림 · 고친 길(본 것 둘 + 생각 둘 · 불편해진 공사 일꾼도) · 늦음(하루 보도 막힘 · 벌 X) · 배운 것 한 줄 · 우리 진짜 동네라면?
  function resultSite(q) { const e = en(), D = day();
    if (q.st === 'ok') return '<div class="grp">' + (e ? 'Waiting for' : '기다리는 것') + '</div><div class="cs-ld">' + esc(e ? 'Tomorrow morning: a fenced path by the site gate, and no trucks from 8 to 9 am.' : '내일 아침: 공사장 앞에 울타리 친 보도가 생기고, 아침 8~9시엔 트럭이 쉬어요.') + '</div>';
    const late = q.st === 'late' || q.st === 'lateFix', fx = q.fixD && D >= q.fixD, H = [];
    if (late) H.push(e ? 'The report was late. ' : '보고가 늦었어요. ', q.mudD > 0 ? (e ? 'For a day the pavement by the site was closed, and children walked round on the other side of the road. ' : '하루 동안 공사장 앞 보도가 막혀, 학교 가는 아이들이 길 건너편으로 돌아서 다녔어요. ') : '', e ? 'Next time, tell the centre sooner.' : '다음엔 더 빨리 알려 줘요.');
    const F = fx ? [e ? 'Steel plates and a crossing mark now fill the gap in the pavement, with a yellow fence on the road side.' : '끊긴 보도에 철판 보도와 건널목 표시가 생기고, 찻길 쪽에 노란 울타리가 섰어요.', e ? 'The pile moved inside the site, and a sign says works vehicles rest from 8 to 9 am.' : '자재 더미를 공사장 안쪽으로 옮겼고, "공사 차량 시간 · 아침 8~9시 쉬어요" 판이 섰어요.'] : [];
    const I = fx ? [e ? 'Site worker: “Resting an hour each morning slows the work a little. Still, the children come first.”' : '공사 일꾼: "아침 한 시간을 쉬니 공사가 조금 늦어져요. 그래도 아이들이 먼저지요."', e ? 'Neighbour who often walks there: “Now the children do not have to step into the road.”' : '그 길을 자주 지나는 이웃: "이제 아이들이 찻길로 내려서지 않아도 되겠어요."'] : [];
    return '<div class="grp">' + (e ? 'What happened' : '어떻게 되었나') + '</div>' + (H.length ? '<div class="cs-ld">' + esc(H.join('')) + '</div>' : '') + (F.length ? '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'Facts' : '본 것') + '</h4>' + F.map(t => '<div>' + esc(t) + '</div>').join('') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'Ideas' : '생각') + '</h4>' + I.map(t => '<div>' + esc(t) + '</div>').join('') + '</div></div>'
      + '<div class="cs-ld">' + esc(e ? 'To pick the right fix, find out when, where and at whose eye height a place is dangerous.' : '언제, 어디서, 누구 눈높이에서 위험한지 알아야 맞는 대책을 고를 수 있어요.') + '</div><div class="cs-ld">' + esc(e ? 'In our real town: if there is a building site on the way to school, is the pavement unbroken?' : '우리 진짜 동네라면? 학교 가는 길에 공사장이 있으면 보도가 끊기지 않았는지 살펴봐요.') + '</div>' : ''); }
  function react(k) { const q = S().cur, e = en(); if (!q || k !== 'wk' || !VIS.wk) return; const g = VIS.wk.position; A.bubble({ x: g.x, y: g.y, z: g.z, sc: 1 }, e ? 'The fences slowed us by a day. Still, it had to be done.' : '흙막이 세우느라 하루 늦어졌어요. 그래도 했어야 할 일이지요.'); }

  // ───────── 칩 · 위 가운데 줄 · 하루 마무리 · 소식 · 찾기 ─────────
  function chipSync() { const q = S().cur, e = en(); let k = ''; let t = null, fn = null;
    if (q && q.st === 'open') { if (q.id === 'river' && nearWater()) { t = '💧 ' + (e ? 'Take a water sample' : '여기 물 떠 보기'); fn = () => sample(); k = 'w'; } else { t = '📒 ' + L(CASES[q.id].t) + ' · ' + dueText(q); fn = () => notebook(); k = 'n:' + t; } }
    else if (q && (q.st === 'ok' || ((q.st === 'fixed' || q.st === 'lateFix' || q.st === 'late') && day() <= (q.fixD || q.late) + 1))) { t = '📒 ' + L(CASES[q.id].t) + (e ? ' · result' : ' · 결과 보기'); fn = () => notebook(); k = 'r:' + q.st; }
    if (k === CHIPK) return; CHIPK = k; A.chip('twn-case', t, t ? { onClick: fn } : undefined); }
  function line() { const q = S().cur; if (!q || q.st !== 'open') return ''; return CASES[q.id].icon + ' ' + L(CASES[q.id].t) + ' · ' + dueText(q); }
  function recapLine(d) { const q = S().cur, e = en(); if (!q) return ''; const R = CASES[q.id];
    if (q.st === 'open') return '📒 ' + (e ? 'Waiting tomorrow: ' : '내일 기다리는 것: ') + L(R.t) + ' — ' + (q.d0 + R.days - 1 - d === 1 ? (e ? 'tomorrow is the last day' : '내일이 마지막 날이에요') : q.d0 + R.days - 1 - d <= 0 ? (e ? 'today was the last day' : '오늘이 마지막 날이었어요') : (e ? (q.d0 + R.days - 1 - d + 1) + ' days left' : (q.d0 + R.days - 1 - d + 1) + '일 남았어요'));
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d) return '📒 ' + (q.id === 'scale' ? (e ? 'Tomorrow morning: see if the scale is back at the market' : '내일 아침: 장터에 저울이 돌아왔는지 보러 가요') : q.id === 'siteRoad' ? (e ? 'Tomorrow morning: see how the road by the building site has changed' : '내일 아침: 공사장 앞 길이 어떻게 바뀌었는지 보러 가요') : (e ? 'Tomorrow morning: see the silt fences at the building site' : '내일 아침: 공사장에 흙막이가 서는지 보러 가요'));
    return ''; }
  function news(d) { const q = S().cur, out = []; if (!q) return out; const R = CASES[q.id], p = q.pl; if (q.id === 'scale') return newsScale(q, d); if (q.id === 'siteRoad') return newsSite(q, d);
    if (q.st === 'open' && q.d0 === d) out.push({ k: 'case:' + q.id, two: 1, t: T2('🌊 비 사흘 뒤 강물이 흙빛이에요. 왜 그럴까요?', '🌊 After three days of rain the river is brown. Why?'), at: null });
    if (q.st === 'fixed' && q.fixD === d) out.push({ k: 'case:' + q.id, t: T2('🚧 어제 낸 보고서대로 ' + p.site.cell + ' 칸 공사장에 흙막이를 세웠어요. 강물이 조금씩 맑아질 거예요', '🚧 As you reported, silt fences went up at the site in ' + p.site.cell + '. The river will slowly clear'), at: [p.site.x, p.site.z] });
    if (q.mudD > 0 && q.mudD === d) out.push({ k: 'case:' + q.id + ':mud', two: 1, t: T2('🌧 큰비에 흙탕물이 농수로를 타고 ' + A.cell(p.mud.x, p.mud.z) + ' 칸 논 한 곳에 들어갔어요', '🌧 In the heavy rain, muddy water ran down the canal into a paddy in ' + A.cell(p.mud.x, p.mud.z)), at: [p.mud.x, p.mud.z] });
    if (q.st === 'lateFix' && q.fixD === d) out.push({ k: 'case:' + q.id, t: T2('🚧 행정복지센터가 ' + p.site.cell + ' 칸 공사장에 흙막이를 세웠어요. 다음엔 더 빨리 알려 줘요', '🚧 The centre put up silt fences at the site in ' + p.site.cell + '. Next time, tell them sooner'), at: [p.site.x, p.site.z] });
    void R; return out; }
  /* 아침 소식판은 잠에서 깬 때 한 번 지음 → 1초 칸이 상태를 넘기기 전이어도 오늘 일어날 일을 실음 */
  function newsScale(q, d) { const p = q.pl, out = [], at = [p.mk.x, p.mk.z];
    if (q.st === 'open' && q.d0 === d) out.push({ k: 'case:' + q.id, two: 1, t: T2('⚖️ 장날 아침, ' + p.mkCell + ' 칸 장터 상인의 저울이 없어졌대요. 어디로 갔을까요?', '⚖️ Market day: the seller’s scale at the market in ' + p.mkCell + ' is gone. Where did it go?'), at: null });
    if ((q.st === 'fixed' && q.fixD === d) || (q.st === 'ok' && q.rep && q.rep.d < d)) out.push({ k: 'case:' + q.id, t: T2('⚖️ ' + p.fix.name + '에서 눈금을 맞춘 저울이 장터로 돌아왔어요. 상인과 옆 가게 이웃이 서로 고맙다고 했어요', '⚖️ The scale, set right at the ' + p.fix.name + ', is back at the market. The seller and the next-stall neighbour thanked each other'), at });
    if ((q.mudD > 0 && q.mudD === d) || (q.st === 'late' && !q.mudD && d === day() && d > q.d0 && A.jang && A.jang().on)) out.push({ k: 'case:' + q.id + ':slow', two: 1, t: T2('⚖️ 장터 상인이 오늘은 임시 저울로 팔아요. 무게를 재는 데 오래 걸려 손님 줄이 길어요', '⚖️ Today the market seller is using a slow spare scale, so the queue is long'), at });
    if ((q.st === 'lateFix' && q.fixD === d) || (q.st === 'late' && q.mudD > 0 && d > q.mudD)) out.push({ k: 'case:' + q.id, t: T2('⚖️ ' + p.fix.name + '에서 고친 저울이 장터로 돌아왔어요. 다음엔 더 빨리 알려 줘요', '⚖️ The fixed scale came back from the ' + p.fix.name + '. Next time, tell them sooner'), at });
    return out; }
  function newsSite(q, d) { const p = q.pl, out = [], at = [p.watch.x, p.watch.z];
    if (q.st === 'open' && q.d0 === d) out.push({ k: 'case:' + q.id, two: 1, t: T2('🚧 흙막이를 세운 ' + p.cell + ' 칸 공사장 앞 길로 학교 가는 아이들이 위험하대요. 어디가 왜 위험할까요?', '🚧 Children walking to school past the silt-fenced site in ' + p.cell + ' are in danger. Where, and why?'), at: null });
    if ((q.st === 'fixed' && q.fixD === d) || (q.st === 'ok' && q.rep && q.rep.d < d)) out.push({ k: 'case:' + q.id, t: T2('🚧 보고서대로 ' + p.cell + ' 칸 공사장 앞에 울타리 친 보도와 건널목 표시가 생겼어요. 아침 8~9시엔 공사 차량이 쉬어요', '🚧 As you reported, the site in ' + p.cell + ' now has a fenced path and a crossing mark. Works vehicles rest from 8 to 9 am'), at });
    if ((q.mudD > 0 && q.mudD === d) || (q.st === 'open' && d > q.d0 + CASES[q.id].days - 1)) out.push({ k: 'case:' + q.id + ':shut', two: 1, t: T2('🚧 ' + p.cell + ' 칸 공사장 앞 보도가 오늘 하루 막혀요. 학교 가는 아이들은 길 건너편으로 돌아가요', '🚧 The pavement by the site in ' + p.cell + ' is closed today. Children walk round on the other side'), at });
    if ((q.st === 'lateFix' && q.fixD === d) || (q.st === 'late' && q.mudD > 0 && d > q.mudD)) out.push({ k: 'case:' + q.id, t: T2('🚧 행정복지센터가 ' + p.cell + ' 칸 공사장 앞에 울타리 친 보도를 냈어요. 다음엔 더 빨리 알려 줘요', '🚧 The centre put a fenced path by the site in ' + p.cell + '. Next time, tell them sooner'), at });
    return out; }
  function findList() { const q = S().cur, e = en(); if (!q || q.st !== 'open') return []; const L9 = [];
    if (q.hyp) { const to = chkAt(q, q.hyp); L9.push({ icon: '🔎', t: e ? 'Check the reason (' + L(CASES[q.id].t) + ')' : '까닭 확인하기 · ' + L(CASES[q.id].t), at: [to.x, to.z] }); }
    if (q.chk && CASES[q.id].repTo === 'mk') L9.push({ icon: '📝', t: e ? 'Tell the market seller' : '상인에게 알려 주기 · 장터', at: [q.pl.mk.x, q.pl.mk.z] });
    else if (q.chk) { const h = hallNear(); if (h) L9.push({ icon: '📝', t: e ? 'Hand in the case report' : '사건 보고서 내기 · 행정복지센터', at: h.door }); }
    return L9; }
  // 물빛(WATER-1 값 덮기): 사건이 풀리기 전 = 흙탕 그대로(0.75 아래로 안 내려감) · 흙막이 뒤 = 하루씩 맑아짐
  function water(W) { const q = S().cur; if (!q || q.id !== 'river' || !W || OFF || W.lv < 0) return W;   /* 가뭄(−)은 덮지 않음 */ const D = day(); let f = null;
    if (q.st === 'open' || q.st === 'ok' || q.st === 'late') f = 0.75; else if (q.fixD) { const n = D - q.fixD; f = n <= 0 ? 0.75 : n === 1 ? 0.5 : n === 2 ? 0.25 : null; }
    if (q.mudD > 0 && D === q.mudD) f = 1;
    if (f != null && !(W.lv >= f)) W.lv = f; return W; }
  // 날씨 창이 열리면 = 비 기록(본 것)
  function onWx(P) { const q = S().cur, e = en(); if (!q || q.st !== 'open' || !P) return; const W = A.wxLog ? A.wxLog() : {}, D = day(), row = [];
    if (q.id === 'scale') { const w = W[D - 1], wy = A.windy ? !!A.windy(D - 1) : false, div = document.createElement('div'); div.className = 'sm'; div.dataset.case = '1'; div.style.cssText = 'margin:6px 0;padding:6px 8px;border:2px dashed #c9b27a;border-radius:10px;background:#fffdf2';
      div.textContent = '📒 ' + (e ? 'Yesterday: ' : '어제 날씨: ') + (w === 'rain' ? (e ? 'rain' : '비') : w === 'snow' ? (e ? 'snow' : '눈') : (e ? 'clear' : '맑음')) + (e ? ', wind ' : ', 바람 ') + (wy ? (e ? 'strong' : '셈') : (e ? 'light' : '약함')) + (wy ? '' : (e ? ' — written in the notebook' : ' — 수첩에 적었어요'));
      const bx = P.querySelector('.bx') || P, h3 = bx.querySelector('h3'); if (h3 && h3.nextSibling) bx.insertBefore(div, h3.nextSibling.nextSibling || null); else bx.appendChild(div); if (!wy) clue('calm', 'wx', true); return; }
    if (q.id !== 'river') return;   /* 비 기록 = 흐려진 강만 */
    for (let k = D - 3; k <= D - 1; k++) row.push(W[k] === 'rain' ? '🌧' : W[k] === 'snow' ? '❄️' : W[k] ? '☀️' : '·');
    const div = document.createElement('div'); div.className = 'sm'; div.dataset.case = '1'; div.style.cssText = 'margin:6px 0;padding:6px 8px;border:2px dashed #c9b27a;border-radius:10px;background:#fffdf2'; div.textContent = '📒 ' + (e ? 'Rain record, last 3 days: ' : '지난 사흘 날씨 기록: ') + row.join(' ') + (e ? ' — written in the notebook' : ' — 수첩에 적었어요');
    const bx = P.querySelector('.bx') || P, h3 = bx.querySelector('h3'); if (h3 && h3.nextSibling) bx.insertBefore(div, h3.nextSibling.nextSibling || null); else bx.appendChild(div);
    if (row.filter(t => t === '🌧').length >= 3) clue('rain', 'wx', true); }
  // 📷 사진(K): 셔터 그 프레임 — 물가면 물 떠 보기와 같이 셈 X(창은 안 띄움) · 공사장 울타리 안이면 흙더미 단서
  function photo() { const q = S().cur; if (!q || q.st !== 'open') return; const p = q.pl; if (q.id === 'scale') { if (dist(p.track.x, p.track.z) < 4) clue('track', 'photo', true); else if (dist(p.bus.x, p.bus.z) < 4) clue('bus', 'photo', true); return; }
    if (q.id === 'siteRoad') { if (dist(p.pile.x, p.pile.z) < 4) clue('sr_pile', 'photo', true); else if (dist(p.c.x, p.c.z) < 3) clue('sr_gap', 'photo', true); else if (dist(p.mud.x, p.mud.z) < 3) clue('sr_mud', 'photo', true); return; } if (dist(p.site.x, p.site.z) < 7) clue('site', 'photo', true); else if (dist(p.sign.x, p.sign.z) < 4) clue('sign', 'photo', true); else if (dist(p.drain.x, p.drain.z) < 5) clue('drain', 'photo', true); }
  function dayLine() { return line(); }
  // town_day.js 손잡이: wait = 하루 마무리 '내일 기다리는 것' 한 줄 · due = 오늘 때 목록(마지막 날 18:00) · key = 때 목록 다시 셀 열쇠 — 단서 자리 길(p)은 주지 않음(빨간 선 X · 창구·흙막이만)
  const hallP = () => { const h = hallNear(); return h ? { icon: '🏛', name: en() ? 'Community centre' : '행정복지센터', door: h.door } : null; };
  const repP = q => (CASES[q.id].repTo === 'mk' ? { icon: '⚖️', name: en() ? 'market seller' : '장터 상인', door: [q.pl.mk.x, q.pl.mk.z] } : hallP());
  function wait(d) { const q = S().cur; if (!q) return null; const R = CASES[q.id], last = q.d0 + R.days - 1;
    if (q.st === 'open') { const left = last - d; return { ic: R.icon, s: T2(L9(R.t) + ' 기한', 'Case due'), t: left === 1 ? T2(L9(R.t) + ': 내일이 마지막 날이에요(' + (R.repTo === 'mk' ? '' : '창구 ') + '18시까지)', L9(R.t, 1) + ': tomorrow is the last day (' + (R.repTo === 'mk' ? '' : 'desk ') + 'until 6 pm)') : left <= 0 ? T2(L9(R.t) + ': 기한이 지났어요', L9(R.t, 1) + ': past the deadline') : T2(L9(R.t) + ': 오늘 말고 ' + left + '일 남았어요', L9(R.t, 1) + ': ' + left + ' more days'), p: q.chk ? repP(q) : null }; }
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d && q.id === 'scale') return { ic: '⚖️', s: T2('장터 저울', 'Market scale'), t: T2('내일 아침 장터에 고친 저울이 돌아와요', 'The fixed scale comes back to the market tomorrow morning'), p: { icon: '⚖️', name: en() ? 'market' : '장터', door: [q.pl.mk.x, q.pl.mk.z] } };
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d && q.id === 'siteRoad') return { ic: '🚧', s: T2('공사장 길', 'Site road'), t: T2('내일 아침 공사장 앞에 울타리 친 보도가 생겨요', 'A fenced path goes in by the site tomorrow morning'), p: { icon: '🚧', name: en() ? 'site road' : '공사장 길', door: [q.pl.watch.x, q.pl.watch.z] } };
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d) return { ic: '🚧', s: T2('흙막이', 'Silt fence'), t: T2('낸 보고서대로 공사장에 흙막이가 서요', 'Silt fences go up at the site, as you reported'), p: { icon: '🚧', name: en() ? 'building site' : '공사장', door: [q.pl.site.x + q.pl.site.ux * 7, q.pl.site.z + q.pl.site.uz * 7] } };
    return null; }
  function due(d) { const q = S().cur; if (!q || q.st !== 'open' || q.d0 + CASES[q.id].days - 1 !== d) return null; const R = CASES[q.id]; return { m: DUE_H * 60, ic: '📒', s: T2(L9(R.t) + ' 기한', 'Case due'), t: R.repTo === 'mk' ? T2(L9(R.t) + ' 기한(장터 상인에게 18시까지)', L9(R.t, 1) + ' due (tell the market seller by 6 pm)') : T2(L9(R.t) + ' 보고서 기한(행정복지센터 창구 18시까지)', L9(R.t, 1) + ' report due (community centre desk until 6 pm)'), p: q.chk ? repP(q) : null }; }
  const L9 = (t, i) => t[i || 0];
  function key() { const q = S().cur; return q ? q.id + q.st + q.d0 + (q.chk ? 'c' : '') : ''; }
  function dispose() { dead = true; for (const k of Object.keys(VIS)) drop(k); for (const k of Object.keys(HOT)) if (HOT[k]) HOT[k].remove(); HOT = {}; A.chip('twn-case', null); if (css) { css.remove(); css = null; } }
  const meshN = g => { let n = 0; if (g) g.traverse(o => { if (o.isMesh) n++; }); return n; };
  return { sec, line, dayLine, wait, due, key, recapLine, news, findList, water, onWx, photo, desk, notebook, dispose, get on() { const q = S().cur; return !!(q && q.st === 'open'); },
    info: () => { const s = S(), q = s.cur; return { cur: q ? JSON.parse(JSON.stringify(q)) : null, d: s.d, done: { ...s.done }, seeds: { ...s.seeds }, log: s.log.slice(0, 3), helper: s.helper, due: q ? dueAt(q) : null, now: now(), dueT: q ? dueText(q) : '', line: line(), chip: CHIPK, near: nearWater(),
      meshes: Object.fromEntries(Object.keys(VIS).map(k => [k, meshN(VIS[k])])), hots: Object.fromEntries(Object.keys(HOT).filter(k => HOT[k]).map(k => [k, HKEY[k]])), dbg: DBG.slice() }; },
    dbg: { plan: id => { const s = S(); s.cur = null; s.d = -1; s.done = {}; return plan(true, id); }, ctx: () => ctx(), gate: () => ({ open: !!A.open(), busy: !!A.busy(), away: !!A.away(), min: A.GAME.S.min | 0 }), windy: d => (A.windy ? !!A.windy(d) : null), planNat: () => { const s = S(); s.cur = null; s.d = -1; s.done = {}; return plan(false); }, sample: () => sample(), murk: (x, z) => { const q = S().cur; return q ? murk(q, x, z) : null; }, sync: () => { sec(); return { ...VKEY }; }, clear: () => { const s = S(); s.cur = null; s.d = -1; s.done = {}; mark(); sec(); }, off: v => { OFF = !!v; sec(); return OFF; } } };   /* off = 물 높이만 재는 시험(town_water.cjs)이 사건 없이 */
}
