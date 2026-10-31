// 🎉 마을 잔치(FEAST-1 · 큰 줄거리 「첫 마을 잔치」 · 정본 docs/systems/town_feast.md · 사용자 10-25~26 '하루하루가 따로 놀고 다음 날 이거 해야지가 없다 · 성취가 뭔지 모르겠다 · 조급함 · 유기적')
//   새 놀이를 만들지 않고 이미 있는 것을 하나로 꿰는 줄기 — 게임 날로 정해진 잔치 날(첫 판 14일째 · 그 뒤 14일마다)까지 다섯 갈래 준비
//   갈래 = 마을 사람이 맡긴 준비(이웃 = 하는 일): 🍲 잔치 음식(식당 요리사) · 🏮 마당 꾸미기(정원사) · 🥁 공연(장구 선생님) · 🙇 손님맞이(행정복지센터 직원) · 🧯 안전(소방관)
//     채우는 것 = 이미 있는 놀이·체계의 기록(REC.add 꼬리 · GAME.tally · 저장 칸 늘어남) + 잔치 게시판에 가방 물건 드리기(요리·재료 / 솔방울·마른 가지·양털·화분·풍경)
//     갈래마다 하루 두 번까지만 셈(조급함 = 하루에 다 못 함 · 다음 날 할 것) · 두 번 = 한 단계 · 세 단계 = 잔치 마당에 물건이 하나씩 생김(숫자·% X)
//   잔치 날: 10시부터 잔치 마당(이웃이 모이는 정자 둘레 빈 땅)에 일꾼들이 모임(있는 일꾼 · 수 그대로) · 준비한 것만 나타남 · 못 한 갈래 = 빈 자리 + 이웃 한마디 '다음 잔치엔…'(벌 X)
//     무대 E = 장구 장단(town_janggu.js 창 그대로) · 상 E = 음식 나누기(가방 요리 한 접시) · 게시판 E = 📷 올해 잔치 사진(이 기기 앨범 · photo.js) · 18시 = 잔치 마당 → 야시장 등불 길(NIGHT-1)
//   잔치 다음 날 = 지난 잔치 판(마을에 남음) + 다음 잔치 주제가 그 날의 계절대로(꽃 잔치·호미씻이·추수 잔치·동지 팥죽 — 실제 풍습만)
//   저장 GAME.S.feast = { v, n 몇 번째, fd 잔치 날, d0 준비 시작 날, th 주제, lv { 갈래: 보탬 수 }, dc { d, b { 갈래: 그날 보탬 }, s { 출처: 그날 보탬 } }, ann 아침 알림 날, ann0 처음 알림 n,
//     fx { met, show, ate, ph } 잔치 날 한 것, cn { cells, typ, deco } 저장 칸 지난 값, past [{ n, d, th, st { 갈래: 단계 }, met, show, ate, ph }] }
//   지킴: 판타지·전투 X · 실명 X · 학생 작품 X · 지역 비하 X · 숫자·% 체크칸 X(남은 날 = '열 밤' 낱말) · 빈 칭찬 X · 컷신 X(그 자리 변화 + 배너) · 새 Light X(등 = MeshBasic 색만 바꿈)
//     · 매 프레임 일 0(1초 칸 sec) · 저절로 뜨는 알림 = say(t, s, 1) · 창이 떠 있으면 미룸 · 글자 판(캔버스)에 이모지 X · 홍보판 X(on())
export const FEAST_V = 1, FIRST_DAY = 14, GAP = 14, PER = 2, CAP = 2;
const T2 = (ko, en) => [ko, en];
const FONT = '"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif';
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
const NK = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두', '열세', '열네', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스무'];
const NE = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/* 잔치까지 남은 밤(낱말 · 숫자 X) */
export const nightsW = (n, en) => (n <= 0 ? (en ? 'today' : '오늘') : en ? (NE[n] || 'many') + (n === 1 ? ' night' : ' nights') : (NK[n] || '스무 넘는') + ' 밤');

// 주제(잔치 날의 계절 · 실제 풍습만)
export const THEMES = {
  flower: { t: T2('꽃 잔치', 'Flower feast'), dish: [0xe48aa6, 0xf2c230, 0x9bc46a], fact: T2('봄에는 산에 핀 진달래꽃으로 화전을 부쳐 먹으며 꽃구경을 했어요. 이것을 화전놀이라고 해요.', 'In spring people fried azalea-petal pancakes (hwajeon) and went flower viewing. This is called hwajeon-nori.') },
  homi: { t: T2('호미씻이 잔치', 'Homi-ssisi feast'), dish: [0x6aa84f, 0xf6f4ee, 0xe0453a], fact: T2('여름 김매기를 마치면 호미를 씻어 걸어 두고, 마을 사람들이 모여 음식을 나누고 풍물을 쳤어요. 이것을 호미씻이라고 해요.', 'When summer weeding was done, farmers washed and hung up their hoes, then shared food and played pungmul music together. This is called homi-ssisi.') },
  harvest: { t: T2('추수 잔치', 'Harvest feast'), dish: [0xf6f4ee, 0xe9b04a, 0xc98a4a], fact: T2('가을걷이를 마치면 햇곡식으로 떡과 밥을 지어 이웃과 나누며 한 해 농사를 고마워했어요.', 'After the autumn harvest, people made rice cakes and rice from the new grain and shared them, giving thanks for the year.') },
  dongji: { t: T2('동지 팥죽 잔치', 'Dongji red-bean porridge feast'), dish: [0x7a2e2a, 0x7a2e2a, 0xf6f4ee], fact: T2('한 해 가운데 밤이 가장 긴 동지에는 팥죽을 쑤어 이웃과 나눠 먹었어요.', 'On Dongji, the longest night of the year, people cooked red-bean porridge and shared it with neighbours.') },
};
export const themeOf = s => (s === 'spring' ? 'flower' : s === 'autumn' ? 'harvest' : s === 'winter' ? 'dongji' : 'homi');

// 다섯 갈래(맡긴 이 = 하는 일 · things = 단계마다 생기는 것 · how = 채우는 길 · made = 잔치 날 이웃 말 · miss = 못 한 갈래 '다음 잔치엔…')
export const BR = {
  food: { ic: '🍲', col: '#d9822b', t: T2('잔치 음식', 'Feast food'), who: T2('식당 요리사', 'the restaurant cook'),
    ask: T2('잔치 상에 올릴 음식을 같이 준비해 줄래?', 'Will you help get food ready for the feast table?'),
    things: [T2('긴 잔칫상', 'a long feast table'), T2('가마솥과 화덕', 'a big pot on a stone hearth'), T2('음식 천막', 'a food tent')],
    how: T2('요리하기, 요리 나눠 주기, 빵집 주문, 이웃 일 거들기, 텃밭 물 주기, 야시장 장보기, 게시판에 요리나 재료 드리기', 'Cook, share dishes, bakery orders, help neighbours at work, water the garden, shop at the night market, bring dishes or ingredients to the board'),
    made: T2('상에 차린 음식, 다 같이 나눠 먹자.', 'Let’s all share the food on the table.'), miss: T2('다음 잔치엔 상 위에 음식이 더 있으면 좋겠어. 요리해서 나눠 주면 돼.', 'Next feast, I hope there’s more food on the table. Cook and share some.') },
  deco: { ic: '🏮', col: '#c8423a', t: T2('마당 꾸미기', 'Decorations'), who: T2('정원사', 'the gardener'),
    ask: T2('잔치 마당이 멀리서도 보이게 꾸며 줄래?', 'Will you decorate the feast yard so people can see it from far away?'),
    things: [T2('잔치 현수막', 'a feast banner'), T2('줄 등', 'a string of lanterns'), T2('꽃 화분 줄', 'a row of flower pots')],
    how: T2('꾸러미 채우기(꽃밭, 밤길 등, 쉼터, 모래 상자), 우리 집 마당 꾸미기, 게시판에 솔방울이나 마른 가지, 양털, 화분, 풍경 드리기', 'Fill bundles (flowers, night lamps, rest spot, sand boxes), decorate our yard, bring pine cones, twigs, wool, pots or wind chimes to the board'),
    made: T2('등이랑 현수막 덕분에 멀리서도 잔치 마당이 보였어.', 'With the banner and lanterns we could see the feast yard from far away.'), miss: T2('다음 잔치엔 등을 달아 보자. 솔방울이나 마른 가지도 꾸밀 거리가 돼.', 'Next feast, let’s hang lanterns. Pine cones and dry twigs make good decorations too.') },
  show: { ic: '🥁', col: '#7d5bb8', t: T2('공연 준비', 'Performance'), who: T2('장구 선생님', 'the janggu teacher'),
    ask: T2('잔치 무대에서 칠 장단을 연습해 둘래?', 'Will you practise a rhythm to play on the feast stage?'),
    things: [T2('낮은 무대', 'a low stage'), T2('북과 장구, 차양', 'a drum, a janggu and an awning'), T2('오색 천 뒷막', 'a five-colour backdrop')],
    how: T2('장구 장단 배우기, 내 장단 들려주기, 판 놀이 한 판, 모내기 노래 박자 맞추기', 'Janggu lessons, playing my rhythm for people, a board game, the rice-planting song rhythm'),
    made: T2('무대가 생겨서 장단 소리가 마을 끝까지 들리겠다.', 'With a stage, the rhythm will carry to the edge of town.'), miss: T2('다음 잔치엔 무대에서 장단을 치고 싶어. 장구 선생님께 배워 둘래?', 'Next feast, I want to hear a rhythm on a stage. Will you learn one from the janggu teacher?') },
  guest: { ic: '🙇', col: '#3b6fb6', t: T2('손님맞이', 'Welcoming guests'), who: T2('행정복지센터 직원', 'the community centre clerk'),
    ask: T2('처음 오는 손님이 길을 헤매지 않게 도와줄래?', 'Will you help so first-time guests don’t get lost?'),
    things: [T2('어서 오세요 안내판', 'a welcome sign'), T2('손님 돗자리와 걸상', 'mats and stools for guests'), T2('안내 천막과 방명록', 'a help tent and a guest book')],
    how: T2('마을 새 칸 가 보기(하루 한 번), 직업 체험(마을 여권), 여권 부탁 들어주기, 이웃 부탁·선물, 우체국에서 소포 보내기', 'Visit a new map cell (once a day), job experiences (town passport), passport requests, neighbour requests and presents, send a parcel at the post office'),
    made: T2('안내판 덕분에 처음 온 손님도 길을 안 헤맸어.', 'Thanks to the sign, even first-time guests didn’t get lost.'), miss: T2('다음 잔치엔 손님 맞을 안내판이 있으면 좋겠어. 마을 길을 많이 알아 두면 안내할 수 있어.', 'Next feast, a welcome sign would help. If you know the town’s roads, you can guide guests.') },
  safe: { ic: '🧯', col: '#2f8a4e', t: T2('안전', 'Safety'), who: T2('소방관', 'the firefighter'),
    ask: T2('사람이 많이 모여도 안전하게 준비해 줄래?', 'Will you help keep everyone safe when lots of people gather?'),
    things: [T2('구급함 탁자', 'a first-aid table'), T2('소화기와 안전 고깔', 'fire extinguishers and safety cones'), T2('안전 쉼터 천막', 'a safety tent')],
    how: T2('긴급 출동, 고칠 곳 신고, 사건 수첩 풀기, 태풍 준비, 112 신고 연습, 응급 처치 배우기, 밤 순찰', 'Emergencies, reporting repairs, solving cases, typhoon prep, 112-call practice, first aid, night patrol'),
    made: T2('구급함이랑 소화기가 있으니 마음 놓고 놀 수 있어.', 'With the first-aid kit and extinguishers here, everyone can relax and have fun.'), miss: T2('다음 잔치엔 구급함을 챙겨 두자. 사람이 모이면 다치는 일도 생겨.', 'Next feast, let’s have a first-aid kit ready. When crowds gather, people can get hurt.') },
};
export const B_ORDER = ['food', 'deco', 'show', 'guest', 'safe'];
export const GIVE = { food: e => e, deco: ['🌰', '🍂', '🧶', '🌻', '🎐'] };
/* 이미 있는 기록 → 갈래(순수 · 시험이 그대로 부름) · k = REC 갈래 | 'tally:…' | 'st:…'(저장 칸 늘어남) | 'give:…' */
export function srcOf(k, o) { o = o || {};
  if (k === 'tally:cooked' || k === 'tally:shared' || k === 'tally:farmW' || k === 'help' || k === 'give:food') return 'food';
  if (k === 'tally:gift' || k === 'st:cells') return 'guest';
  if (k === 'st:deco' || k === 'give:deco') return 'deco';
  if (k === 'st:typh') return 'safe';
  if (k === 'job') { if (o.k === 'bake') return o.ph === 'order-end' ? 'food' : null; if (o.k === 'kitchen') return 'food'; if (o.k === 'rhy:mo') return 'show'; if (o.k === 'passreq') return o.ph === 'done' ? 'guest' : null; return o.done === 1 ? 'guest' : null; }
  if (k === 'bun2') return o.ev !== 'fill' ? null : ['cook', 'autumn', 'garden'].includes(o.id) ? 'food' : ['spring', 'summer', 'forest', 'winter'].includes(o.id) ? 'deco' : null;
  if (k === 'night') return o.k === 'mkt' ? 'food' : o.k === 'patrol' ? 'safe' : null;
  if (k === 'janggu') return o.s != null ? 'show' : null;
  if (k === 'busk') return 'show';
  if (k === 'season') return o.ev === 'done' && BR[o.b] ? o.b : null;   /* SEASON-1 계절 행사를 다 하면 그 행사 갈래(설날 = 손님맞이 · 대보름 = 안전 · 단오 = 공연 · 추석·김장 = 음식) */
  if (k === 'table') return o.ph === 'end' ? 'show' : null;
  if (k === 'case') return o.ev === 'fixed' ? 'safe' : null;
  if (k === 'fix') return o.ev === 'rep' ? 'safe' : null;
  if (k === 'emerg') return o.ev === 'done' ? 'safe' : null;
  if (k === 'ent') return entBr(o.k);   /* ENT-F(코덱스 10-27 'srcOf에 실내 부탁 ent가 빠짐'): 들어간 가게 갈래 → 알맞은 잔치 갈래(ENT_BR) */
  if (k === 'bldg') return (o.k === 'police' && o.ev === '112') || (o.k === 'clinic' && o.ev === 'aid') ? 'safe' : o.k === 'post' && o.ev === 'send' ? 'guest' : null;
  return null; }
/* 실내 부탁(town_enter.js CATS 키 → 잔치 갈래) — 음식점·먹을거리 가게 = 음식 · 꽃집·철물점·농자재·문구·목공 = 마당 꾸미기 · 학원·서점·사진관 = 공연 · 안내·부동산·여행사·센터·회관·민박·이웃 집 = 손님맞이 · 병원·약국·수리 = 안전 · 나머지(신발·안경·낚시…) = 셈 X */
export const ENT_BR = { food: ['noodle', 'kimbap', 'snack', 'chicken', 'cutlet', 'bibim', 'porridge', 'chinese', 'pizza', 'seafood', 'fruit', 'deli', 'ricecake', 'butcher', 'dryfish', 'fishmkt', 'farmstand', 'mill', 'ice', 'store'],
  deco: ['flower', 'hardware', 'farmsupply', 'stationery', 'workshop'], show: ['english', 'math', 'piano', 'art', 'taekwondo', 'study', 'science', 'books', 'photo'],
  guest: ['realty', 'travel', 'center', 'office', 'terminal', 'inn', 'hall', 'home', 'apt', 'gift', 'laundry', 'salon', 'bath'], safe: ['pharmacy', 'via:clinic', 'machine'] };
export const entBr = k => B_ORDER.find(b => ENT_BR[b].includes(String(k || ''))) || null;
const SRC_CAP = { 'st:cells': 1 };   /* 걷기만으로 손님맞이가 다 차지 않게(하루 한 번) */
export const stageOf = n => Math.min(3, ((n | 0) / PER) | 0);

const CSS = `.twn-p .fst-row{border:3px solid #2b2420;border-left:9px solid var(--fc,#c8423a);border-radius:12px;background:#fffdf6;padding:8px 10px;margin:8px 0}
.twn-p .fst-row h4{margin:0 0 2px;font-size:16px}.twn-p .fst-row .who{font-size:13px;opacity:.8}.twn-p .fst-has{font-size:15px;font-weight:800;margin:3px 0}.twn-p .fst-nx{font-size:14px;margin:2px 0}
.twn-p .fst-how{font-size:13px;opacity:.82}.twn-p .fst-day{font-size:13px;font-weight:800;color:#5a4a3a;margin-top:3px}.twn-p .fst-pics{display:flex;gap:6px;margin:4px 0}
.twn-p .fst-pics span{border:2px solid #2b2420;border-radius:8px;padding:2px 8px;font-size:13px;background:#fbe9c8}.twn-p .fst-pics span.no{border-style:dashed;border-color:#bfae8c;background:none;color:#8a7a5a}
.twn-p .fst-give{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.twn-p .fst-give button{min-height:40px;font-size:14px}.twn-p .fst-past{font-size:14px;margin:4px 0}.twn-p .fst-story{font-size:14px;font-weight:800;background:#fbe9c8;border:2px solid #2b2420;border-radius:10px;padding:4px 8px;margin:2px 0 6px}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · ready() 할 일 화면이 열렸나 · lang() · esc · openP(h, wide, kind) · closeP() · panel() · busy() · storm() 태풍 날 · stormNote(t) 태풍 날 창 한 줄(true면 따로 알림 X)
//   say(t, s, lv) · sfx(k) · banner(t, s) · chip(k, t, o) · route(p) · dialog(o) · rec(k, o) · buildParts(fn) · gy(x, z) · collider(o) · season(d) · diary(t) · take(e) · bag() · item(e) [ko, en, kind]
//   site(x, z) 잔치 마당 { x, z, ry } | null · spots() 나의 길 자리(pav · stall · hall) · gather(L) 일꾼 모으기([x, z, ry] | null → 모인 수) · cheer() 모인 일꾼 손뼉 · bubbleW(i, t) 모인 i번째 일꾼 말
//   lampLine(from, to, n) [[x, z]] · nightMkt() [x, z] | null · janggu() 장구 창 열기(true|false) · photo(label) Promise(rec | null)
export function createFeast(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, min = () => G().min | 0, mark = () => A.GAME.mark();
  const zero = () => ({ food: 0, deco: 0, show: 0, guest: 0, safe: 0 });
  const S = () => { const g = G(); let s = g.feast; if (!s || typeof s !== 'object' || s.v !== FEAST_V) s = g.feast = { v: FEAST_V, n: 0, fd: 0, d0: 0, th: 'homi', lv: zero(), dc: null, ann: -1, ann0: -1, fx: {}, cn: null, past: [] };
    if (!s.lv || typeof s.lv !== 'object') s.lv = zero(); if (!s.fx || typeof s.fx !== 'object') s.fx = {}; if (!Array.isArray(s.past)) s.past = []; return s; };
  let css = null, dead = false, SITE = null, VIS = {}, HOT = {}, BKEY = '', PKEY = '', LIT = null, GAT = 0, NLN = null, chipK = '', chipT = 0, tally0 = null, metT = 0; const DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  if (!document.getElementById('fst-css')) { css = document.createElement('style'); css.id = 'fst-css'; css.textContent = CSS; document.head.appendChild(css); }
  /* GAME.tally 꼬리(요리·나눔·선물·텃밭 물) — 끝나면 되돌림 */
  { const g = A.GAME, t0 = g.tally; if (typeof t0 === 'function' && !t0.fst) { const f = function (k, n) { const r = t0.apply(this, arguments); try { tap('tally:' + k, null); } catch (e) { /* 잔치 셈 실패는 놀이를 막지 않음 */ } return r; }; f.fst = 1; f.t0 = t0; g.tally = f; tally0 = t0; } }

  const st = b => stageOf(S().lv[b]);
  const stages = () => Object.fromEntries(B_ORDER.map(b => [b, st(b)]));
  const isDay = () => day() === S().fd;
  const prepOn = () => { const s = S(), d = day(); return s.fd > 0 && d >= s.d0 && (d < s.fd || (d === s.fd && min() < 600)); };
  const festOn = () => isDay() && min() >= 600 && min() < 23 * 60;
  const title = () => { const s = S(), th = THEMES[s.th] || THEMES.homi; return s.n === 0 ? (en() ? 'First town feast (' + th.t[1] + ')' : '첫 마을 잔치(' + th.t[0] + ')') : L(th.t); };
  const banT = () => { const s = S(), th = THEMES[s.th] || THEMES.homi; return s.n === 0 ? (en() ? 'Our First Town Feast' : '우리 마을 첫 잔치') : (en() ? 'Our Town ' + th.t[1] : '우리 마을 ' + th.t[0]); };
  const left = () => S().fd - day();
  const thingsOf = b => BR[b].things.slice(0, st(b)).map(L);

  // ───────── 잔치 마당 자리(이웃이 모이는 정자 둘레 · 없으면 장터 · 행정복지센터 · 학교 앞) ─────────
  function site() { if (SITE) return SITE; const P = (A.spots && A.spots()) || {}, c = P.pav ? P.pav.c : P.stall ? P.stall : P.hall ? P.hall.door : [16.5, 50]; const sp = A.site ? A.site(c[0], c[1]) : null; if (!sp) return null;
    const ry = sp.ry, cs = Math.cos(ry), sn = Math.sin(ry); SITE = { x: sp.x, z: sp.z, ry, Q: (lx, lz) => [sp.x + lx * cs + lz * sn, sp.z - lx * sn + lz * cs] }; log('site ' + sp.x.toFixed(1) + ',' + sp.z.toFixed(1) + ' ry ' + ry.toFixed(2)); return SITE; }
  const toDoor = () => { const P = site(); if (!P) return null; const [x, z] = P.Q(-6.5, 10); return { icon: '🎉', name: en() ? 'feast yard' : '잔치 마당', door: [x, z] }; };

  // ───────── 짓기(물건 하나 = 제 땅 높이 · 충돌은 큰 것만) ─────────
  function drop(id) { const v = VIS[id]; if (!v) return; for (const g of v.g) { map.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.userData.own && o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); } for (const c of v.C) c.remove(); delete VIS[id]; }
  function piece(v, lx, lz, fn, ry) { const P = site(), [x, z] = P.Q(lx, lz), g = A.buildParts(fn); g.position.set(x, A.gy(x, z), z); g.rotation.y = P.ry + (ry || 0); g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); v.g.push(g); return g; }
  function col(v, lx, lz, hx, hz, h) { const P = site(), [x, z] = P.Q(lx, lz), q = Math.abs(Math.sin(P.ry)) > 0.5, ax = q ? hz : hx, az = q ? hx : hz, y = A.gy(x, z); v.C.push(A.collider({ x0: x - ax, x1: x + ax, z0: z - az, z1: z + az, y0: y - 1, y1: y + h, nc: true })); }
  function board(w, h, draw) { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: tx })); m.userData.own = 1; const B = { m, redraw: () => { draw(c.getContext('2d'), c.width, c.height); tx.needsUpdate = true; } }; B.redraw(); return B; }
  const fitT = (g, t, w) => { let s = String(t); if (g.measureText(s).width <= w) return s; while (s.length > 2 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };
  /* 서 있는 판(기둥 둘 + 뒤 널 + 글자 판) — 바깥 땅에 섬 */
  function standB(v, lx, lz, w, h, y, draw, frame) { const g = piece(v, lx, lz, put => { for (const s of [-1, 1]) put('b', s * (w / 2 + 0.03), 0, -0.04, 0.09, y + h + 0.08, 0.09, 0x6b4a2f); put('b', 0, y - 0.06, -0.07, w + 0.14, h + 0.14, 0.05, frame || 0x8a6a4a); });
    const B = board(w, h, draw); B.m.position.set(0, y + h / 2 + 0.01, -0.035); g.add(B.m); B.m.updateMatrixWorld(true); col(v, lx, lz, w / 2 + 0.1, 0.12, y + h); return B; }
  const paper = (g, W, H, frame, head) => { g.fillStyle = frame; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(12, 12, W - 24, H - 24); g.fillStyle = '#2b2420'; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '900 34px ' + FONT; g.fillText(fitT(g, head, W - 60), 30, 24); };
  /* 등 줄(인스턴스 하나 · MeshBasic = 밤엔 주황으로 바꿈 · 새 Light X) */
  function lanterns(pts) { const geo = new T3.SphereGeometry(0.26, 10, 7); geo.scale(1, 1.25, 1); const m = new T3.InstancedMesh(geo, new T3.MeshBasicMaterial({ color: 0xd8c8a0 }), pts.length), M4 = new T3.Matrix4(); pts.forEach((p, i) => { M4.makeTranslation(p[0], p[1], p[2]); m.setMatrixAt(i, M4); }); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.userData.own = 1; m.userData.fx = 1; map.add(m); return m; }
  const fireCol = (p, hex) => { p('c', 0, 0, 0, 0.11, 0.5, 0, hex); p('c', 0, 0.5, 0, 0.05, 0.08, 0, 0x2b2420); p('b', 0.06, 0.52, 0, 0.12, 0.03, 0.03, 0x2b2420); };

  function build(id) { drop(id); const P = site(); if (!P) return; const v = VIS[id] = { g: [], C: [], at: null }, s = S(), th = THEMES[s.th] || THEMES.homi, D = th.dish;
    if (id === 'board') { v.B = standB(v, -6.5, 8.2, 2.2, 1.45, 0.75, (g, W, H) => { const e = en(); paper(g, W, H, '#c8423a', banT()); g.font = '800 26px ' + FONT; g.fillStyle = '#5a4a3a';
        g.fillText(isDay() ? (e ? 'The feast is today' : '오늘이 잔치 날이에요') : day() > s.fd ? '' : (e ? nightsW(left(), 1) + ' until the feast' : '잔치까지 ' + nightsW(left())), 30, 74);
        g.font = '800 23px ' + FONT; B_ORDER.forEach((b, i) => { const y = 120 + i * 40, n = st(b); g.fillStyle = BR[b].col; g.fillRect(30, y + 6, 14, 14); g.fillStyle = '#2b2420'; g.fillText(fitT(g, L(BR[b].t) + ' — ' + (n ? BR[b].things[n - 1][e ? 1 : 0] : (e ? 'not yet' : '아직')), W - 120), 54, y); }); }, 0x7a5232); v.at = [-6.5, 8.2]; }
    else if (id === 'plaque') { if (!s.past.length) { drop(id); return; } v.B = standB(v, -10.6, 8.2, 1.6, 1.15, 0.7, (g, W, H) => { const e = en(); paper(g, W, H, '#6b4a2f', e ? 'Past feasts' : '지난 잔치'); g.font = '800 23px ' + FONT;
        s.past.slice(-4).reverse().forEach((q, i) => { const T = THEMES[q.th] || THEMES.homi, nm = q.n === 0 ? (e ? 'First feast' : '첫 마을 잔치') : T.t[e ? 1 : 0], got = B_ORDER.filter(b => (q.st || {})[b] > 0).map(b => BR[b].t[e ? 1 : 0]); g.fillStyle = '#2b2420'; g.fillText(fitT(g, nm, W - 70), 30, 76 + i * 64); g.fillStyle = '#5a4a3a'; g.font = '700 20px ' + FONT; g.fillText(fitT(g, got.length ? got.join(', ') : (e ? 'a quiet feast' : '조용한 잔치'), W - 70), 30, 104 + i * 64); g.font = '800 23px ' + FONT; }); }, 0x5a3e28); }
    else if (id === 'food:0') { piece(v, -9.6, -0.6, p => { for (const [a, b] of [[-0.42, -1.85], [0.42, -1.85], [-0.42, 1.85], [0.42, 1.85]]) p('b', a, 0, b, 0.08, 0.66, 0.08, 0x7a5232); p('b', 0, 0.66, 0, 1.0, 0.06, 4.0, 0x9b6a3c);
        for (let i = 0; i < 6; i++) { const z = -1.6 + i * 0.64; p('c', -0.22, 0.72, z, 0.15, 0.06, 0, 0xf6f4ee); p('s', -0.22, 0.78, z, 0.1, 0.45, 0, D[i % 3]); p('c', 0.24, 0.72, z + 0.2, 0.13, 0.05, 0, 0xf6f4ee); } }); col(v, -9.6, -0.6, 0.55, 2.05, 0.75); }   /* 긴 상 · 그릇 열둘 */
    else if (id === 'food:1') { piece(v, -9.8, 3.6, p => { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; p('b', Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62, 0.3, 0.32, 0.26, 0x8d8a80, 0, a); } p('c', 0, 0.3, 0, 0.56, 0.42, 0, 0x2f2f33); p('c', 0, 0.72, 0, 0.62, 0.05, 0, 0x2f2f33); p('c', 0, 0.77, 0, 0.5, 0.06, 0, 0x55473a); p('c', 0, 0.83, 0, 0.06, 0.08, 0, 0x55473a); p('s', 0.18, 0.9, 0.1, 0.12, 0.6, 0, 0xeeeeee); }); col(v, -9.8, 3.6, 0.8, 0.8, 0.9);   /* 화덕(돌 아홉) · 가마솥 · 뚜껑 · 김 한 줌 */
      piece(v, -11.7, -0.6, p => { for (const [a, b] of [[-0.38, -1.4], [0.38, -1.4], [-0.38, 1.4], [0.38, 1.4]]) p('b', a, 0, b, 0.08, 0.66, 0.08, 0x7a5232); p('b', 0, 0.66, 0, 0.9, 0.06, 3.1, 0x9b6a3c); for (let i = 0; i < 4; i++) { p('b', 0, 0.72, -1.1 + i * 0.73, 0.5, 0.06, 0.36, 0xc98a4a); p('s', 0, 0.8, -1.1 + i * 0.73, 0.12, 0.5, 0, D[(i + 1) % 3]); } }); col(v, -11.7, -0.6, 0.5, 1.6, 0.75); }   /* 둘째 상 · 떡 판 넷 */
    else if (id === 'food:2') { piece(v, -10.6, -0.6, p => { for (const [a, b] of [[-2.2, -2.6], [2.2, -2.6], [-2.2, 2.6], [2.2, 2.6]]) p('b', a, 0, b, 0.09, 2.5, 0.09, 0xd8d4ca); p('k', 0, 2.5, 0, 3.6, 1.2, 0, 0xf6f4ee); p('b', 0, 2.42, -2.6, 4.4, 0.18, 0.04, 0xd9822b); p('b', 0, 2.42, 2.6, 4.4, 0.18, 0.04, 0xd9822b); }); }   /* 흰 천막(고깔 지붕 · 주황 띠) — 두 상 위 */
    else if (id === 'deco:0') { piece(v, 0, 8.8, p => { for (const s9 of [-1, 1]) { p('c', s9 * 3.4, 0, 0, 0.08, 3.6, 0, 0x6b4a2f); p('s', s9 * 3.4, 3.62, 0, 0.11, 1, 0, 0xe9b04a); } p('b', 0, 2.62, -0.05, 6.8, 0.06, 0.05, 0x6b4a2f); });
      const B = board(6.2, 0.86, (g, W, H) => { g.fillStyle = '#c8423a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(8, 8, W - 16, H - 16); g.fillStyle = '#c8423a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + Math.round(H * 0.5) + 'px ' + FONT; g.fillText(fitT(g, banT(), W - 40), W / 2, H / 2 + 2); });
      B.m.material.side = T3.DoubleSide; B.m.position.set(0, 3.1, 0); v.g[0].add(B.m); B.m.updateMatrixWorld(true); v.B = B; for (const s9 of [-1, 1]) col(v, s9 * 3.4, 8.8, 0.12, 0.12, 3.6); }   /* 들머리 현수막(양쪽 장대 · 글 = 잔치 이름) */
    else if (id === 'deco:1') { const pts = []; piece(v, 0, 0.4, p => { for (const s9 of [-1, 1]) { p('c', s9 * 12.2, 0, 0, 0.08, 3.7, 0, 0x6b4a2f); p('c', s9 * 12.2, 0, 0, 0.3, 0.12, 0, 0x8d8a80); } for (let i = 0; i < 24; i++) { const x = -12 + i + 0.5, y = 3.55 - Math.sin((x + 12) / 24 * Math.PI) * 0.45; p('b', x, y, 0, 1.02, 0.025, 0.025, 0x3a2a1a); } });
      for (let i = 0; i < 11; i++) { const lx = -10 + i * 2, y = 3.55 - Math.sin((lx + 12) / 24 * Math.PI) * 0.45 - 0.42, [x, z] = P.Q(lx, 0.4); pts.push([x, A.gy(P.Q(0, 0.4)[0], P.Q(0, 0.4)[1]) + y, z]); }
      v.lan = lanterns(pts); v.g.push(v.lan); for (const s9 of [-1, 1]) col(v, s9 * 12.2, 0.4, 0.12, 0.12, 3.7); }   /* 마당을 가로지르는 줄 등(청사초롱 꼴 · 밤에 켜짐) */
    else if (id === 'deco:2') { for (const s9 of [-1, 1]) piece(v, s9 * 5.6, 8.9, p => { for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.85; p('c', x, 0, 0, 0.24, 0.36, 0, 0xb5483a); p('c', x, 0.36, 0, 0.27, 0.05, 0, 0x8a3a2c); p('c', x, 0.36, 0, 0.2, 0.06, 0, 0x4a3426);
        for (let j = 0; j < 4; j++) { const a = j * 1.57 + i; p('c', x + Math.cos(a) * 0.08, 0.4, Math.sin(a) * 0.08, 0.012, 0.3, 0, 0x4f8a3a); p('s', x + Math.cos(a) * 0.1, 0.72, Math.sin(a) * 0.1, 0.07, 0.8, 0, [0xe0453a, 0xf2c230, 0xe48aa6, 0xffffff][(i + j) % 4]); } } }); }   /* 들머리 양쪽 꽃 화분 넷씩 */
    else if (id === 'show:0') { piece(v, 0, -6.6, p => { p('b', 0, 0, 0, 8.0, 0.4, 4.0, 0x9b6a3c); for (let i = 0; i < 9; i++) p('b', -3.6 + i * 0.9, 0.4, 0, 0.02, 0.004, 3.96, 0x7a5232); p('b', 0, 0, 2.35, 2.2, 0.2, 0.7, 0x8a5a34); }); col(v, 0, -6.6, 4.0, 2.0, 0.4); }   /* 낮은 마루 무대 + 디딤 단 */
    else if (id === 'show:1') { piece(v, 0, -6.6, p => { for (const [a, b] of [[-3.9, -1.9], [3.9, -1.9], [-3.9, 1.9], [3.9, 1.9]]) p('c', a, 0.4, b, 0.07, 2.9, 0, 0xc8423a); p('b', 0, 3.3, 0, 8.3, 0.08, 4.3, 0x2f6fd0); for (const b of [-2.15, 2.15]) p('b', 0, 3.1, b, 8.3, 0.22, 0.03, 0xf2c230);
        p('b', -2.2, 0.4, -0.8, 0.07, 0.7, 0.07, 0x5a3e28); p('c', -2.2, 1.0, -0.8, 0.42, 0.5, 0, 0xc8423a); p('c', -2.2, 1.5, -0.8, 0.4, 0.02, 0, 0xf6f4ee); p('c', -2.2, 0.98, -0.8, 0.4, 0.02, 0, 0xf6f4ee);   /* 북(받침 · 붉은 몸 · 흰 가죽) */
        p('b', 2.2, 0.4, -0.8, 0.9, 0.34, 0.3, 0x5a3e28); p('c', 2.2, 0.74, -0.8, 0.2, 0.06, 0, 0xc8423a, 0, 0, 1.5708); p('s', 1.9, 0.86, -0.8, 0.2, 1, 0, 0xc8423a); p('s', 2.5, 0.86, -0.8, 0.2, 1, 0, 0xc8423a); p('b', 2.2, 0.82, -0.8, 0.5, 0.06, 0.06, 0x7a3b1e); }); }   /* 차양 기둥 넷 · 파란 지붕 · 노란 띠 · 장구(잘록한 허리) */
    else if (id === 'show:2') { piece(v, 0, -8.85, p => { p('b', 0, 0, 0, 0.1, 3.9, 0.1, 0x6b4a2f); p('b', -4.1, 0, 0, 0.1, 3.9, 0.1, 0x6b4a2f); p('b', 4.1, 0, 0, 0.1, 3.9, 0.1, 0x6b4a2f); p('b', 0, 3.75, 0, 8.4, 0.08, 0.08, 0x6b4a2f);
        [0x2f6fd0, 0xe0453a, 0xf2c230, 0xf6f4ee, 0x2b2b2b].forEach((c, i) => p('b', -3.2 + i * 1.6, 0.6, 0.08, 1.5, 3.1, 0.04, c)); for (const s9 of [-1, 1]) { p('c', s9 * 4.6, 0, 0.6, 0.05, 4.4, 0, 0x6b4a2f); p('b', s9 * 4.6 + s9 * 0.4, 3.7, 0.6, 0.8, 0.5, 0.02, s9 < 0 ? 0xe0453a : 0x2f6fd0); } }); col(v, 0, -8.85, 4.2, 0.15, 3.9); }   /* 오방색 뒷막 · 양쪽 깃발 */
    else if (id === 'guest:0') { v.B = standB(v, 7.6, 8.6, 1.9, 1.05, 0.8, (g, W, H) => { const e = en(); g.fillStyle = '#3b6fb6'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(10, 10, W - 20, H - 20); g.fillStyle = '#3b6fb6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 54px ' + FONT; g.fillText(e ? 'Welcome' : '어서 오세요', W / 2, H * 0.4);
        g.font = '800 26px ' + FONT; g.fillStyle = '#2b2420'; g.fillText(fitT(g, banT(), W - 40), W / 2, H * 0.72); }, 0x2f4f8a); }   /* 어서 오세요 안내판 */
    else if (id === 'guest:1') { piece(v, 7.8, 3.4, p => { for (const a of [-1.25, 1.25]) { p('b', a, 0, 0, 2.2, 0.03, 1.6, 0xd9c27a); for (let i = 0; i < 6; i++) p('b', a, 0.03, -0.65 + i * 0.26, 2.16, 0.004, 0.05, 0xa88a3a); } for (let i = 0; i < 4; i++) { const x = -1.8 + i * 1.2; p('c', x, 0, 1.5, 0.2, 0.38, 0, 0x9b6a3c); p('c', x, 0.38, 1.5, 0.22, 0.04, 0, 0x7a5232); } }); }   /* 돗자리 둘(짚 무늬) · 걸상 넷 */
    else if (id === 'guest:2') { piece(v, 10.9, 6.4, p => { for (const [a, b] of [[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1]]) p('b', a, 0, b, 0.08, 2.2, 0.08, 0xd8d4ca); p('k', 0, 2.2, 0, 2.3, 1.0, 0, 0x3b6fb6); p('b', 0, 0, 0.2, 1.4, 0.72, 0.6, 0xf6f4ee); p('b', 0.2, 0.72, 0.2, 0.42, 0.04, 0.3, 0xfbf7ec); p('b', 0.2, 0.765, 0.2, 0.02, 0.006, 0.28, 0x3b6fb6); p('c', -0.4, 0.72, 0.2, 0.03, 0.18, 0, 0x2b2420); }); col(v, 10.9, 6.6, 0.75, 0.35, 0.75); }   /* 파란 안내 천막 · 탁자 · 방명록 · 붓 */
    else if (id === 'safe:0') { piece(v, 10.9, -4.4, p => { for (const [a, b] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) p('b', a, 0, b, 0.07, 0.72, 0.07, 0x7a5232); p('b', 0, 0.72, 0, 1.4, 0.05, 0.75, 0xf6f4ee); p('b', 0, 0.77, 0, 0.5, 0.3, 0.32, 0xffffff); p('b', 0, 0.84, 0.165, 0.26, 0.08, 0.004, 0xe0453a); p('b', 0, 0.8, 0.165, 0.08, 0.2, 0.004, 0xe0453a); p('b', 0, 1.07, 0, 0.22, 0.04, 0.05, 0x8a8f99); }); col(v, 10.9, -4.4, 0.75, 0.4, 0.8); }   /* 구급함(흰 상자 · 빨간 십자 · 손잡이) */
    else if (id === 'safe:1') { for (const [lx, lz] of [[9.0, -5.9], [12.6, -5.9]]) piece(v, lx, lz, p => fireCol(p, 0xd8402e)); piece(v, 0, -3.3, p => { for (const x of [-5.4, -4.6, 4.6, 5.4]) { p('k', x, 0, 0, 0.17, 0.5, 0, 0xf28a2a); p('b', x, 0.22, 0, 0.21, 0.07, 0.21, 0xffffff); p('b', x, 0, 0, 0.36, 0.03, 0.36, 0x2b2420); } }); }   /* 소화기 둘 · 무대 앞 안전 고깔 넷 */
    else if (id === 'safe:2') { piece(v, 10.9, -4.4, p => { for (const [a, b] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) p('b', a, 0, b, 0.08, 2.3, 0.08, 0xd8d4ca); p('k', 0, 2.3, 0, 2.7, 1.0, 0, 0xf6f4ee); p('b', 0, 2.32, 1.2, 3.2, 0.2, 0.03, 0x2f8a4e); p('c', 0, 3.3, 0, 0.03, 0.9, 0, 0x6b4a2f); p('b', 0.26, 3.85, 0, 0.5, 0.34, 0.02, 0xffffff); p('b', 0.26, 3.85, 0.012, 0.3, 0.08, 0.004, 0xe0453a); p('b', 0.26, 3.85, 0.014, 0.08, 0.26, 0.004, 0xe0453a); });
      v.B = standB(v, 13.0, -2.2, 1.2, 0.6, 0.8, (g, W, H) => { const e = en(); g.fillStyle = '#2f8a4e'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + (e ? 50 : 66) + 'px ' + FONT; g.fillText(e ? 'Safety tent' : '안전 쉼터', W / 2, H * 0.42); g.font = '800 26px ' + FONT; g.fillText(e ? 'Lost child? Come here' : '길 잃은 어린이는 여기로', W / 2, H * 0.78); }, 0x1f5a34); }   /* 흰 천막 · 초록 띠 · 구급 깃발 · 안전 쉼터 팻말 */
    log('build ' + id); }
  function buildAll() { if (!site()) return; build('board'); build('plaque'); for (const b of B_ORDER) for (let i = 0; i < 3; i++) { const id = b + ':' + i; if (i < st(b)) { if (!VIS[id]) build(id); } else drop(id); } lightNow(true); }
  function lightNow(force) { const m = min(), on = m >= 18 * 60 + 30 || m < 5 * 60 + 30; if (!force && on === LIT) return; LIT = on; const c = on ? 0xffa53a : 0xd8c8a0; for (const id of ['deco:1']) { const v = VIS[id]; if (v && v.lan) v.lan.material.color.setHex(c); } if (NLN) NLN.material.color.setHex(c); }

  // ───────── E ─────────
  const HOTL = {}, hot = (id, lx, lz, label, use, r) => { if (HOT[id]) HOT[id].remove(); const P = site(); if (!P) return; const [x, z] = P.Q(lx, lz); HOT[id] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 1.7, label, use }); HOTL[id] = label; };
  const unhot = id => { if (HOT[id]) { HOT[id].remove(); delete HOT[id]; delete HOTL[id]; } };
  function hots() { const e = en(), f = festOn(), s = S(); const want = { board: 1, food: f && st('food') > 0 ? 1 : 0, show: f && st('show') > 0 ? 1 : 0 }, k = JSON.stringify([want, e, f, s.fx.ph | 0]); if (k === PKEY) return; PKEY = k;
    hot('board', -6.5, 9.4, f ? '📷 ' + (e ? 'Take this year’s feast photo' : '올해 잔치 사진 찍기') : '🎉 ' + (e ? 'Feast preparation board' : '잔치 준비 게시판'), () => (f ? photo() : open(true)), 1.6);
    if (want.food) hot('food', -8.6, -0.6, '🍲 ' + (e ? 'Share the feast food' : '잔치 음식 나누기'), () => share(), 1.6); else unhot('food');
    if (want.show) hot('show', 0, -3.9, '🥁 ' + (e ? 'Play a rhythm on the stage' : '무대에서 장단 치기'), () => perform(), 1.8); else unhot('show'); }
  function give(b, e9) { const s = S(), e = en(); if (!prepOn()) { A.say(e ? '🎉 Preparation is over. Enjoy the feast.' : '🎉 준비는 끝났어요. 잔치를 즐겨요.', 2.4); return false; }
    const dc = S().dc && S().dc.d === day() ? S().dc.b : {}; if ((dc[b] | 0) >= CAP) { add(b, 'give:' + b, true); return false; }
    if (!A.take(e9)) return false; add(b, 'give:' + b, true); A.sfx('ding'); return true; }
  function giveRow(b) { const B9 = A.bag() || {}, e = en(); const L9 = keys(B9).filter(k => (B9[k] | 0) > 0 && (b === 'food' ? ['dish', 'food'].includes((A.item(k) || [])[2]) : GIVE.deco.includes(k))).slice(0, 6);
    if (!L9.length) return '<div class="fst-how">' + esc(b === 'food' ? (e ? 'No dish or ingredient in your bag.' : '가방에 요리나 재료가 없어요.') : (e ? 'No pine cone, twigs, wool, pot or wind chime in your bag.' : '가방에 솔방울, 마른 가지, 양털, 화분, 풍경이 없어요.')) + '</div>';
    return '<div class="fst-give">' + L9.map(k => '<button class="sub" data-gb="' + b + '" data-ge="' + esc(k) + '">' + esc(k + ' ' + ((A.item(k) || [])[e ? 1 : 0] || '') + (e ? ' — give' : ' 드리기')) + '</button>').join('') + '</div>'; }
  async function share() { const s = S(), e = en(), n = st('food'), B9 = A.bag() || {}, d9 = keys(B9).find(k => (B9[k] | 0) > 0 && (A.item(k) || [])[2] === 'dish');
    const what = BR.food.things.slice(0, n).map(t => t[e ? 1 : 0]).join(e ? ', ' : ', ');
    const r = await A.dialog({ who: L(BR.food.who), icon: '🍲', text: [(e ? 'On the table: ' : '상 위에 차린 것: ') + what + '.', L((THEMES[s.th] || THEMES.homi).fact), d9 ? (e ? 'You have ' + (A.item(d9) || [])[1] + ' in your bag. Put a plate on the table?' : '가방에 ' + (A.item(d9) || [])[0] + '이 있네. 한 접시 올릴래?') : (e ? 'Come and eat with everyone.' : '와서 같이 먹자.')], choices: d9 ? [['put', e ? 'Put it on the table' : '상에 올리기'], ['eat', e ? 'Just eat together' : '같이 먹기만']] : null });
    if (d9 && r === 'put' && A.take(d9)) A.say(e ? '🍲 Your dish is on the feast table. The neighbours share it.' : '🍲 내 요리 한 접시가 잔칫상에 올랐어요. 이웃들이 나눠 먹어요.', 3, 1);
    s.fx.ate = 1; mark(); A.cheer(); A.sfx('pop'); A.rec('feast', { ev: 'ate', d: day() }); }
  /* 무대 = 저장한 내 장단이 있으면 그 자리에서 들려주기(버스킹 · 모인 이웃이 손뼉) · 없으면 장구 선생님 창(한 판 끝나면 공연한 것) */
  function perform() { const e = en(), s = S(); s.fx.want = day(); mark(); if (A.busk && A.busk()) { s.fx.bk = 1; mark(); return; }
    if (!A.janggu()) A.say(e ? '🥁 There is no janggu teacher in this town yet.' : '🥁 이 마을엔 아직 장구 선생님이 없어요.', 2.6); }
  function photo() { const s = S(), e = en(); if (A.busy()) { log('photo busy'); return null; } A.closeP && A.closeP(); const lab = (s.n === 0 ? (e ? 'First town feast' : '첫 마을 잔치') : L((THEMES[s.th] || THEMES.homi).t));
    const p = A.photo(lab); if (p && p.then) p.then(rec => { if (dead || !rec) return; s.fx.ph = 1; mark(); A.chip('twn-fst', null); chipK = ''; A.rec('feast', { ev: 'photo', d: day() }); if (A.diary) A.diary((e ? 'Took a photo at the ' : '') + lab + (e ? '' : '에서 사진을 찍었어요')); }); log('photo ' + !!p); return p; }

  // ───────── 보탬(이미 있는 기록이 들어오는 곳) ─────────
  function add(b, src, loud) { const s = S(), d = day(), e = en(); if (!b || !BR[b] || !prepOn()) return false; if (!s.dc || s.dc.d !== d) s.dc = { d, b: {}, s: {} };
    if ((s.dc.b[b] | 0) >= CAP) { if (loud) A.say(e ? '🎉 That is enough ' + BR[b].t[1].toLowerCase() + ' for today. You can help again tomorrow.' : '🎉 오늘 ' + BR[b].t[0] + ' 몫은 했어요. 내일 또 도울 수 있어요.', 2.6); return false; }
    if (SRC_CAP[src] && (s.dc.s[src] | 0) >= SRC_CAP[src]) return false;
    const n0 = st(b); s.dc.b[b] = (s.dc.b[b] | 0) + 1; s.dc.s[src] = (s.dc.s[src] | 0) + 1; s.lv[b] = (s.lv[b] | 0) + 1; mark(); const n1 = st(b);
    A.rec('feast', { ev: 'prep', b, src: src.slice(0, 20), st: n1 }); log('add ' + b + ' ' + src + ' → ' + s.lv[b]);
    if (n1 > n0) { build(b + ':' + (n1 - 1)); if (VIS.board && VIS.board.B) VIS.board.B.redraw(); A.banner(BR[b].ic + ' ' + (e ? 'Feast yard: ' : '잔치 마당에 ') + L(BR[b].things[n1 - 1]) + (e ? ' is up' : jo(BR[b].things[n1 - 1][0], '이', '가') + ' 생겼어요'), 4); A.sfx('done');
      chipK = 'see'; chipT = performance.now(); A.chip('twn-fst', '🎉 ' + (e ? 'See the feast yard' : '잔치 마당 보기'), { onClick: () => { A.chip('twn-fst', null); chipK = ''; const p = toDoor(); if (p) A.route(p); } });
      if (A.diary) A.diary(e ? BR[b].t[1] + ': ' + BR[b].things[n1 - 1][1] : BR[b].t[0] + ': ' + BR[b].things[n1 - 1][0] + jo(BR[b].things[n1 - 1][0], '이', '가') + ' 잔치 마당에 생겼어요'); }
    else A.say(BR[b].ic + ' ' + (e ? 'A step closer for ' + BR[b].t[1].toLowerCase() + ' (' + BR[b].who[1] + ')' : BR[b].t[0] + ' 준비가 한 걸음 나아갔어요(' + BR[b].who[0] + ')'), 2.4, loud ? 0 : 1);
    return true; }
  function jo(w, a, b9) { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b9; }
  function tap(k, o) { if (dead || !A.on() || k === 'feast') return; const s = S(), e = en();
    if (((k === 'janggu' && o && o.s != null) || k === 'busk') && isDay() && s.fx.want === day() && !s.fx.show) { s.fx.show = 1; mark(); A.cheer(); A.banner('🥁 ' + (e ? 'The neighbours clap along to your rhythm on the stage' : '무대에서 친 장단에 이웃들이 손뼉을 쳐요'), 4); A.sfx('done'); A.rec('feast', { ev: 'show', d: day() }); return; }
    const b = srcOf(k, o); if (b) add(b, k); }
  /* 저장 칸 늘어남(기록이 따로 없는 것: 새 칸 · 태풍 준비 · 마당 꾸미기) */
  function counters() { const g = G(), d = day(), ty = g.typh && Array.isArray(g.typh.reqs) ? g.typh.reqs.filter(q => q && q.st === 'done').length : 0, cn = { cells: keys(g.cells).length, typ: ty, deco: (Array.isArray(g.deeds) ? g.deeds : []).filter(q => q && q.t === 'deco' && q.d === d).length, d };
    const s = S(), o = s.cn; s.cn = cn; if (!o) return; if (cn.cells > o.cells) add('guest', 'st:cells'); if (cn.typ > o.typ) add('safe', 'st:typh'); if (o.d === d && cn.deco > o.deco) add('deco', 'st:deco'); }

  // ───────── 날짜 ─────────
  function plan(force) { const s = S(), d = day(); if (s.fd > 0 && !force) return; const th = themeOf(A.season ? A.season(Math.max(FIRST_DAY, d + 7)) : 'now');
    Object.assign(s, { n: 0, fd: Math.max(FIRST_DAY, d + 7), d0: d, th, lv: zero(), dc: null, fx: {}, ann: -1, ann0: -1 }); mark(); log('plan fd ' + s.fd + ' ' + th); }
  function finish() { const s = S(), d = day(), e = en(); if (!(s.fd > 0 && d > s.fd)) return false; const stg = stages();
    s.past.push({ n: s.n, d: s.fd, th: s.th, st: stg, met: s.fx.met | 0, show: s.fx.show | 0, ate: s.fx.ate | 0, ph: s.fx.ph | 0 }); while (s.past.length > 12) s.past.shift();
    const got = B_ORDER.filter(b => stg[b] > 0).map(b => BR[b].t[e ? 1 : 0]), nm = s.n === 0 ? (e ? 'First town feast' : '첫 마을 잔치') : (THEMES[s.th] || THEMES.homi).t[e ? 1 : 0];
    if (A.diary) A.diary(e ? nm + ': ' + (got.length ? got.join(', ') : 'a quiet feast') : nm + ': ' + (got.length ? got.join(', ') + ' 준비가 잔치 마당에 나왔어요' : '조용히 지나갔어요'));
    let fd = s.fd + GAP; while (fd < d + 7) fd += GAP; const th = themeOf(A.season ? A.season(fd) : 'now');
    Object.assign(s, { n: s.n + 1, fd, d0: d, th, lv: zero(), dc: null, fx: {}, ann: -1 }); mark(); A.rec('feast', { ev: 'end', n: s.n - 1, got: got.length });
    for (const b of B_ORDER) for (let i = 0; i < 3; i++) drop(b + ':' + i); build('plaque'); if (VIS.board && VIS.board.B) VIS.board.B.redraw(); PKEY = ''; log('finish → next ' + fd + ' ' + th); return true; }
  function bestAsk() { const d = day(); let best = null; B_ORDER.forEach((b, i) => { const s9 = st(b); if (s9 >= 3) return; const sc = s9 * 10 + ((i + d) % 5); if (!best || sc < best.sc) best = { b, sc }; }); return best ? best.b : null; }   /* 다 선 갈래는 권하지 않음 · 다섯 갈래가 다 서면 null = 준비 끝(코덱스 10-27) */
  const allDone = () => B_ORDER.every(b => st(b) >= 3);
  function notice(first) { const s = S(), e = en(), b = bestAsk(), n = left(), p = toDoor();
    if (isDay()) { A.say('🎉 ' + (e ? 'Today is the ' + title() + '! Neighbours gather in the feast yard from 10:00.' : '오늘은 ' + title() + ' 날이에요! 10시부터 잔치 마당에 이웃들이 모여요.'), 5, 1); }
    else if (!b) A.say('🎉 ' + (e ? 'Feast prep is all done. Now we wait for the feast day — ' + nightsW(n, 1) + ' to go.' : title() + ' 준비 끝! 이제 잔칫날을 기다려요. ' + nightsW(n) + ' 남았어요.'), 4.5, 1);   /* 다섯 갈래가 다 섬 */
    else if (first) { A.banner('🎉 ' + (e ? title() + ' in ' + nightsW(n, 1) : title() + '까지 ' + nightsW(n)), 5); A.say(e ? BR[b].who[1].replace(/^./, c => c.toUpperCase()) + ' put up the feast board: five kinds of preparation. ' + BR[b].ask[1] : BR[b].who[0] + jo(BR[b].who[0], '이', '가') + ' 잔치 준비 게시판을 세웠어요. 준비 다섯 갈래가 있어요. ' + BR[b].ask[0], 5, 1); }
    else A.say('🎉 ' + (e ? nightsW(n, 1).replace(/^./, c => c.toUpperCase()) + ' until the feast. Today, how about ' + BR[b].t[1].toLowerCase() + ' for ' + BR[b].who[1] + '?' : title() + '까지 ' + nightsW(n) + '이에요. 오늘은 ' + BR[b].who[0] + jo(BR[b].who[0], '이', '가') + ' 맡긴 ' + BR[b].t[0] + jo(BR[b].t[0], '을', '를') + ' 해 볼까요?'), 4.5, 1);
    if (p) { chipK = 'go'; chipT = performance.now(); A.chip('twn-fst', '🎉 ' + (e ? 'Feast board' : '잔치 게시판') + (isDay() ? '' : ' · ' + (e ? nightsW(n, 1) : nightsW(n))), { onClick: () => { A.chip('twn-fst', null); chipK = ''; A.route(p); } }); } log('notice ' + (first ? 'first' : '') + ' ' + b); }
  /* 잔치 날 모이기(앞 두 줄 · 무대를 봄) */
  function gatherSpots(n) { const P = site(); if (!P) return []; const out = [], [sx, sz] = P.Q(0, -6.6); for (let i = 0; i < n; i++) { const row = i < 6 ? 0 : 1, k = row ? i - 6 : i, cnt = row ? 5 : 6, lx = (k - (cnt - 1) / 2) * 1.5, lz = row ? 0.9 : -1.6, [x, z] = P.Q(lx + (row ? 0.4 : 0), lz); out.push([x, z, Math.atan2(sx - x, sz - z)]); } return out; }
  function feastSec() { const s = S(), e = en(), on = festOn(), m = min();
    const want = on ? Math.min(11, 4 + B_ORDER.reduce((a, b) => a + st(b), 0) / 2 | 0) : 0; if (want !== GAT) { const got = A.gather(want ? gatherSpots(want) : null); GAT = want; log('gather ' + want + ' → ' + got); }
    if (on && !s.fx.met && A.me) { const me = A.me(), P = site(); if (P && Math.hypot(me.x - P.x, me.z - P.z) < 16) { s.fx.met = 1; mark(); const mk = B_ORDER.filter(b => st(b) > 0), ms = B_ORDER.filter(b => st(b) === 0);
        A.bubbleW(0, L(mk.length ? BR[mk[(day() + mk.length) % mk.length]].made : T2('준비는 조금 모자랐어도 이렇게 모이니 좋다.', 'We were not fully ready, but it is good to be together.')));
        const t2 = ms.length ? L(BR[ms[day() % ms.length]].miss) : L(T2('오늘 잔치 마당이 가득 찼어. 다섯 갈래 준비가 다 나왔네.', 'The feast yard is full today. All five kinds of preparation came out.'));
        metT = setTimeout(() => { if (!dead) A.bubbleW(1, t2); }, 4200); A.rec('feast', { ev: 'met', d: day(), miss: ms.length }); } }
    if (on && m >= 18 * 60 && !NLN && A.nightMkt && A.lampLine) { const to = A.nightMkt(), P = site(); if (to && P && Math.hypot(to[0] - P.x, to[1] - P.z) < 700) { const L9 = A.lampLine(P.Q(0, 9.5), to, 14); if (L9.length) { NLN = lanterns(L9.map(([x, z]) => [x, A.gy(x, z) + 2.3, z])); lightNow(true); if (!s.fx.nm) { s.fx.nm = 1; mark(); A.banner('🏮 ' + (e ? 'Lanterns now run from the feast yard to the night market' : '잔치 마당에서 야시장까지 등불 길이 켜졌어요'), 4.5); A.chip('twn-fst', '🏮 ' + (e ? 'Night market' : '야시장 가기'), { onClick: () => { A.chip('twn-fst', null); chipK = ''; A.route({ icon: '🏮', name: e ? 'night market' : '야시장', door: to }); } }); chipK = 'nm'; chipT = performance.now(); } } } }
    if (s.fx.bk === 1 && !(A.jgOn && A.jgOn())) { s.fx.bk = 2; mark(); A.cheer(); }   /* 버스킹이 끝나면 손뼉 친 이웃을 잔치 자리로 다시 */
    if (!on && NLN) { map.remove(NLN); NLN.geometry.dispose(); NLN.material.dispose(); NLN = null; }
    if (on && m >= 20 * 60 && !s.fx.ph && !s.fx.phc && !A.busy() && !A.panel()) { s.fx.phc = 1; mark(); A.say('📷 ' + (e ? 'Before the feast ends, take this year’s feast photo at the board.' : '잔치가 끝나기 전에 게시판에서 올해 잔치 사진을 찍어요.'), 4, 1); chipK = 'ph'; chipT = performance.now(); A.chip('twn-fst', '📷 ' + (e ? 'Feast photo' : '잔치 사진'), { onClick: () => { A.chip('twn-fst', null); chipK = ''; const p = toDoor(); if (p) A.route(p); } }); } }
  function sec(force) { if (dead || !A.on()) return; const s = S(), d = day();
    if (!(s.fd > 0)) plan(); if (d > s.fd) finish();
    if (isDay() && A.storm && A.storm() && min() < 600) { s.fd++; s.ann = -1; mark(); const t9 = '🌀 ' + (en() ? 'A typhoon is here, so the feast moves to tomorrow.' : '태풍이 와서 잔치를 하루 미뤄요.'); if (!(A.stormNote && A.stormNote(t9))) A.say(t9, 4, 1); log('storm → ' + s.fd); }   /* TYPH-2 = 태풍 날 창 안 한 줄(따로 알림 X) */
    if (!VIS.board) buildAll(); counters();
    if (A.ready() && !A.busy() && !A.panel()) { if (s.ann0 !== s.n) { s.ann0 = s.n; s.ann = d; mark(); notice(true); } else if (s.ann !== d && min() >= 6 * 60) { s.ann = d; mark(); notice(false); } }
    feastSec(); hots(); lightNow(false);
    const bk = [left(), isDay(), JSON.stringify(stages()), en()].join('|'); if (bk !== BKEY) { BKEY = bk; if (VIS.board && VIS.board.B) VIS.board.B.redraw(); }
    if (chipK && performance.now() - chipT > 90000) { A.chip('twn-fst', null); chipK = ''; } }

  /* STORYF-1(코덱스 10-27 '이야기를 끝내면 잔치인가, 날짜가 오면 잔치인가'): 창 맨 위 한 줄 = 이야기의 잔치와 이 잔치의 관계 */
  function storyLine() { const s = S(), e = en(), Q = G().story || {}, F = Q.fest || {}, n = left(), when = isDay() ? (e ? 'It is today.' : '오늘이 그날이에요.') : (e ? nightsW(n, 1).replace(/^./, c => c.toUpperCase()) + ' to go.' : nightsW(n) + ' 남았어요.');
    if (s.n === 0) return '📜 ' + (e ? 'The feast the prologue note asked helpers for is this one. ' : '프롤로그 쪽지가 도우미를 찾던 그 첫 잔치가 바로 이 잔치예요. ') + when;
    const fin = F.site && !F.done ? (e ? ' The feast at ' + F.site + ' you chose in the story opens at the end of the story.' : ' 이야기에서 고른 ' + F.site + ' 잔치는 이야기 마지막 장에서 열려요.') : '';
    return '📜 ' + (e ? 'After the first feast, a town feast comes back every two weeks. ' : '첫 잔치 뒤로 두 이레마다 돌아오는 마을 잔치예요. ') + when + fin; }
  // ───────── 수첩 🎉 잔치 · 게시판 창 ─────────
  function open(atBoard) { const s = S(), e = en(), th = THEMES[s.th] || THEMES.homi, on = isDay(), pre = prepOn(), dc = s.dc && s.dc.d === day() ? s.dc.b : {};
    const rows = B_ORDER.map(b => { const R = BR[b], n = st(b), pics = R.things.map((t, i) => '<span class="' + (i < n ? '' : 'no') + '">' + esc(L(t)) + '</span>').join(''), cap = (dc[b] | 0) >= CAP;
      const nx = n >= 3 ? (e ? 'All three are up in the feast yard.' : '셋 다 잔치 마당에 섰어요.') : on ? L(R.miss) : (e ? 'Next: ' : '다음: ') + L(R.things[n]);
      const today = !pre ? '' : cap ? (e ? 'Today’s share is done. You can help again tomorrow.' : '오늘 몫은 했어요. 내일 또 도울 수 있어요.') : (dc[b] | 0) ? (e ? 'You can help once more today.' : '오늘 한 번 더 도울 수 있어요.') : (e ? 'You can help today.' : '오늘 도울 수 있어요.');
      return '<div class="fst-row" style="--fc:' + R.col + '" data-br="' + b + '"><h4>' + R.ic + ' ' + esc(L(R.t)) + ' <span class="who">' + esc((e ? 'asked by ' : '맡긴 이: ') + L(R.who)) + '</span></h4><div class="fst-pics">' + pics + '</div><div class="fst-nx">' + esc(nx) + '</div>'
        + (pre ? '<div class="fst-how">' + esc((e ? 'How: ' : '하는 법: ') + L(R.how)) + '</div><div class="fst-day">' + esc(today) + '</div>' : '') + (atBoard && pre && !cap && (b === 'food' || b === 'deco') ? giveRow(b) : '') + '</div>'; }).join('');
    const head = !on && pre && allDone() ? (e ? 'Prep is all done — every kind is up in the feast yard. Now we wait for the feast day: ' + nightsW(left(), 1) + ' to go.' : '준비 끝! 다섯 갈래가 다 잔치 마당에 섰어요. 이제 잔칫날을 기다려요. ' + nightsW(left()) + ' 남았어요.') : on ? (e ? 'Today is the feast. Neighbours gather in the feast yard from 10:00. What you prepared is out there.' : '오늘이 잔치 날이에요. 10시부터 잔치 마당에 이웃이 모여요. 준비한 것이 그대로 나와 있어요.') : (e ? nightsW(left(), 1).replace(/^./, c => c.toUpperCase()) + ' until the feast. Five neighbours asked for help. Each kind can move up to one thing a day.' : '잔치까지 ' + nightsW(left()) + '. 이웃 다섯이 준비를 맡겼어요. 갈래마다 하루에 한 가지씩 생길 수 있어요.');
    const past = s.past.slice(-3).reverse().map(q => { const T = THEMES[q.th] || THEMES.homi, got = B_ORDER.filter(b => (q.st || {})[b] > 0).map(b => BR[b].t[e ? 1 : 0]); return '<div class="fst-past">' + esc((q.n === 0 ? (e ? 'First town feast' : '첫 마을 잔치') : T.t[e ? 1 : 0]) + ' — ' + (got.length ? got.join(', ') : (e ? 'a quiet feast' : '조용한 잔치')) + (q.ph ? (e ? ' · photo in the album' : ' · 앨범에 사진') : '')) + '</div>'; }).join('');
    const h = '<h3>🎉 ' + esc(title()) + '</h3>' + (storyLine() ? '<div class="fst-story">' + esc(storyLine()) + '</div>' : '') + '<div class="sm">' + esc(head) + '</div><div class="sm" style="margin:4px 0">' + esc(L(th.fact)) + '</div>' + rows + (past ? '<div class="grp">' + (e ? 'Past feasts' : '지난 잔치') + '</div>' + past : '')
      + '<div class="row"><button class="sub" data-a="go">🧭 ' + (e ? 'Go to the feast yard' : '잔치 마당 가기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'feast'); W.onclick = ev => { const b9 = ev.target.closest('button'); if (!b9) return; if (b9.dataset.gb) { if (give(b9.dataset.gb, b9.dataset.ge)) open(atBoard); return; } if (b9.dataset.a === 'go') { A.closeP(); const p = toDoor(); if (p) A.route(p); return; } if (b9.dataset.a === 'x') A.closeP(); }; log('open ' + (atBoard ? 'board' : 'nb')); return W; }

  // ───────── 하루 마무리 · 아침 소식 · 달력 손잡이 ─────────
  function dayRow(d) { const s = S(), e = en(); if (!s.dc || s.dc.d !== d) return null; const B9 = B_ORDER.filter(b => (s.dc.b[b] | 0) > 0); if (!B9.length) return null;
    return ['feast', '🎉', e ? 'Feast preparation' : '잔치 준비', esc(B9.map(b => L(BR[b].t)).join(', ') + (e ? ' moved forward' : ' 준비를 도왔어요'))]; }
  function wait(d1) { const s = S(), e = en(), p = toDoor(); if (!(s.fd > 0)) return null; const n = s.fd - d1; if (n < 0 || n > 6) return null; const b = bestAsk();
    const t = n === 0 ? T2(title() + ' 날이에요. 10시부터 잔치 마당에 이웃이 모여요', 'It is the ' + title() + '. Neighbours gather in the feast yard from 10:00') : !b ? T2(title() + '까지 ' + nightsW(n) + '. 준비는 다 끝났어요. 잔칫날을 기다려요', nightsW(n, 1) + ' until the feast. Everything is ready — just wait for the day') : T2(title() + '까지 ' + nightsW(n) + '. ' + BR[b].who[0] + jo(BR[b].who[0], '이', '가') + ' 맡긴 ' + BR[b].t[0] + jo(BR[b].t[0], '이', '가') + ' 아직 모자라요', nightsW(n, 1) + ' until the feast. ' + BR[b].t[1] + ' for ' + BR[b].who[1] + ' still needs help');
    return { k: 'feast', ic: '🎉', s: T2(n === 0 ? '잔치 날' : '잔치까지 ' + nightsW(n), n === 0 ? 'Feast day' : nightsW(n, 1) + ' to the feast'), t, p: p ? { ...p } : null }; }
  function news(d) { const s = S(); if (!(s.fd > 0)) return []; const P = site(), at = P ? P.Q(-6.5, 9.4) : null, b = bestAsk(), last = s.past[s.past.length - 1];
    if (last && last.d === d - 1) { const T = THEMES[s.th] || THEMES.homi; return [{ k: 'feast', t: ['🎉 어제 잔치가 끝났어요. 다음은 ' + T.t[0] + ', ' + nightsW(s.fd - d) + ' 남았어요', '🎉 Yesterday’s feast is over. Next is the ' + T.t[1] + ', ' + nightsW(s.fd - d, 1) + ' away'], at }]; }
    if (d === s.fd) return [{ k: 'feast', t: ['🎉 오늘은 ' + title() + ' 날! 10시부터 잔치 마당에 이웃이 모여요', '🎉 Today is the ' + title() + '! Neighbours gather from 10:00'], at }];
    if (d < s.fd && !b) return [{ k: 'feast', t: ['🎉 ' + title() + '까지 ' + nightsW(s.fd - d) + '. 준비는 다 끝났어요. 잔칫날을 기다려요', '🎉 ' + nightsW(s.fd - d, 1) + ' to the feast. Everything is ready — wait for the day'], at }];
    if (d < s.fd) return [{ k: 'feast', t: ['🎉 ' + title() + '까지 ' + nightsW(s.fd - d) + '. ' + BR[b].who[0] + jo(BR[b].who[0], '이', '가') + ' ' + BR[b].t[0] + ' 준비를 부탁했어요', '🎉 ' + nightsW(s.fd - d, 1) + ' to the feast. ' + BR[b].who[1].replace(/^./, c => c.toUpperCase()) + ' asked for help with ' + BR[b].t[1].toLowerCase()], at }];
    return []; }
  const calLine = () => { const s = S(); if (!(s.fd > 0)) return ''; return '🎉 ' + (isDay() ? (en() ? 'Today is the ' + title() : '오늘은 ' + title() + ' 날') : (en() ? title() + ' in ' + nightsW(left(), 1) : title() + '까지 ' + nightsW(left()))); };
  const festNear = me => { if (!festOn()) return false; const P = site(); return !!P && Math.hypot(me.x - P.x, me.z - P.z) < 120; };

  function dispose() { dead = true; clearTimeout(metT); for (const id of keys(VIS)) drop(id); for (const id of keys(HOT)) HOT[id].remove(); HOT = {}; if (NLN) { map.remove(NLN); NLN.geometry.dispose(); NLN.material.dispose(); NLN = null; } if (GAT) { A.gather(null); GAT = 0; } A.chip('twn-fst', null);
    const g = A.GAME; if (g.tally && g.tally.fst && tally0) g.tally = tally0; if (css) { css.remove(); css = null; } }
  function rebuild() { SITE = null; for (const id of keys(VIS)) drop(id); for (const id of keys(HOT)) HOT[id].remove(); HOT = {}; PKEY = ''; if (GAT) { A.gather(null); GAT = 0; } buildAll(); }
  return { sec, open, tap, dayRow, wait, news, calLine, festNear, dispose, rebuild, has: () => true,
    info: () => { const s = S(), P = site(); return { fd: s.fd, n: s.n, th: s.th, d0: s.d0, day: day(), left: left(), lv: { ...s.lv }, st: stages(), dc: s.dc, fx: { ...s.fx }, past: s.past.slice(), prep: prepOn(), on: festOn(), gat: GAT, lit: LIT, nln: NLN ? NLN.count : 0, chip: chipK,
      site: P ? [+P.x.toFixed(1), +P.z.toFixed(1), +P.ry.toFixed(2)] : null, vis: keys(VIS), vat: Object.fromEntries(keys(VIS).map(id => [id, VIS[id].g.map(g => [+g.position.x.toFixed(1), +g.position.z.toFixed(1), +g.position.y.toFixed(2), !!g.parent])])), hot: Object.fromEntries(keys(HOT).map(k => [k, HOTL[k] || ''])) }; },
    dbg: { add: (b, src) => add(b, src || 'dbg', true), tap: (k, o) => tap(k, o), finish: () => finish(), plan: () => plan(true), log: () => DBG.slice(), at: (lx, lz) => { const P = site(); return P ? P.Q(lx, lz) : null; }, photo: () => photo(), share: () => share(), perform: () => perform() } };
}
