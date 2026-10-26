// 🚒 소방 깊게(FIRE-5 · 사용자 10-25 '소방서 퀘스트 한 10번 깨니까 개노잼 · 깊이가 한 칸인 것들이 너무 많아'): 불 사건 한 판을 짜는 표와 씨앗 — 그리기·DOM 없음(노드에서 바로 시험)
//   다섯 겹: ① 상황(맑음·바람 센 날·비·연기 자욱/밤) × 집 갈래(주택·아파트 2층·가게·창고 — 판에 있는 건물) ② 판단(불 원인 → 알맞은 대처 · 불티 쪽 먼저) ③ 구할 대상(2층 창가 어르신·고양이·다시 들어가려는 이웃)
//   ④ 도전 칸 1~5(소화기 → 호스 → 사다리차 → 두 곳 동시 → 반장) ⑤ 끝나도 이어짐(원인 찾기 → 예방 판 → 다음 날 새 소화기·소식 → 소방서 예방 지도)
//   내용 = 소방청·국민재난안전포털 어린이 안전 교육에 나오는 사실만(문어발 멀티탭 · 식용유 불엔 물 X · 난로 둘레 탈 것 X · 쓰레기 태우기 X · 콘센트 먼지) · 다치는 사람 X · 큰 불길 X
const T2 = (ko, en) => [ko, en];
export const F5_V = 1;

// ① 상황 넷: 날씨·때가 정하는 것이 먼저(비·밤·바람 센 날) · 아니면 씨앗(바람이 이따금 셈 · 연기 자욱)
export const SIT = {
  calm: { t: T2('맑은 날', 'Clear day'), say: T2('바람이 잔잔해요. 불이 한곳에서 타고 있어요.', 'The air is still. The fire is in one place.') },
  windy: { t: T2('바람 센 날', 'Windy day'), say: T2('바람이 세요. 불티가 바람을 따라 날아가요.', 'It is windy. Sparks fly the way the wind blows.') },
  rain: { t: T2('비 오는 날', 'Rainy day'), say: T2('비가 와도 집 안 불은 저절로 꺼지지 않아요. 길이 미끄러워 소방차가 천천히 와요.', 'Rain does not put out a fire inside a house. The road is slippery, so the engine drives slowly.') },
  dark: { t: T2('연기가 자욱한 때', 'Thick smoke'), say: T2('연기 때문에 둘레가 어두워요. 손전등으로 비추며 찾아요.', 'The smoke makes it dark. Use the torch to look around.') },
};
// 집 갈래 넷(건물 kind → 갈래) · h2 = 2층 이상(어르신 구조)
export const HTYPE = {
  house: { t: T2('주택', 'house'), re: /^(house|villa|home)$/ },
  apt: { t: T2('아파트 2층', 'flat on the 2nd floor'), re: /^apt$/ },
  shop: { t: T2('가게', 'shop'), re: /^shop$/ },
  store: { t: T2('창고', 'storehouse'), re: /^(gearshed|factory)$/ },
};
export const typeOf = kind => { for (const k in HTYPE) if (HTYPE[k].re.test(kind || '')) return k; return null; };

// ② 원인 다섯 → 대처 갈래(elec 전기 = 전원 먼저 · oil 기름 = 덮기 · gen 일반 = 물)
//   say = 이웃이 본 것(단서) · clue = 불 끈 뒤 살펴본 것 · tip = 예방 판 글 · next = 다음 날 이웃이 바꾼 것(소식 한 줄)
export const CAUSE = {
  tap: { k: 'elec', icon: '🔌', t: T2('문어발 멀티탭', 'Overloaded power strip'), types: ['house', 'apt', 'shop'],
    say: T2('방에서 "탁" 소리가 나더니 멀티탭 쪽에서 연기가 났어요.', 'There was a pop, then smoke came from the power strip.'),
    clue: T2('멀티탭 하나에 플러그가 여섯 개나 꽂혀 있었고, 까맣게 녹아 있어요.', 'Six plugs were in one power strip, and it has melted black.'),
    tip: T2('멀티탭 하나에 플러그를 많이 꽂지 않아요. 안 쓰는 플러그는 뽑아요.', 'Do not plug too many things into one strip. Unplug what you are not using.'),
    next: T2('어제 불난 집 이웃이 녹은 멀티탭을 버리고 새 멀티탭으로 바꿨어요. 문 옆엔 새 소화기도 있어요', 'Yesterday’s fire house threw out the melted strip and got a new one. A new extinguisher stands by the door') },
  dust: { k: 'elec', icon: '🔌', t: T2('먼지 쌓인 콘센트', 'Dusty socket'), types: ['shop', 'store', 'house'],
    say: T2('냉장고 뒤 콘센트에서 불꽃이 튀었어요.', 'Sparks came from the socket behind the fridge.'),
    clue: T2('냉장고 뒤 콘센트에 먼지가 두껍게 쌓였고, 그 둘레가 까맣게 탔어요.', 'Thick dust had piled up on the socket behind the fridge, and it is burnt black around it.'),
    tip: T2('콘센트 둘레 먼지를 마른 천으로 닦아요. 오래 안 쓰는 플러그는 뽑아 둬요.', 'Wipe dust off sockets with a dry cloth. Unplug things you do not use for a long time.'),
    next: T2('어제 불난 곳 이웃이 콘센트 먼지를 닦고 덮개를 달았어요. 문 옆엔 새 소화기도 있어요', 'Yesterday’s fire place cleaned the sockets and put covers on. A new extinguisher stands by the door') },
  pot: { k: 'oil', icon: '🍳', t: T2('켜 둔 기름 냄비', 'Oil pan left on the stove'), types: ['house', 'apt', 'shop'],
    say: T2('튀김 기름을 불에 올려 두고 잠깐 전화를 받으러 갔어요.', 'I left frying oil on the stove and went to answer the phone.'),
    clue: T2('가스레인지 위 냄비가 까맣게 탔고, 불이 켜진 채였어요.', 'The pan on the stove is burnt black, and the burner was still on.'),
    tip: T2('요리할 땐 자리를 비우지 않아요. 기름 불엔 물을 붓지 말고 뚜껑을 덮어요.', 'Never leave cooking alone. Do not pour water on an oil fire — cover it with a lid.'),
    next: T2('어제 불난 집 이웃이 부엌에 주방용 소화기를 두었어요. 요리할 땐 자리를 지킨대요', 'Yesterday’s fire house put a kitchen extinguisher by the stove. They will stay by the stove from now on') },
  heater: { k: 'gen', icon: '♨️', t: T2('난로 곁 빨래', 'Laundry by the heater'), types: ['house', 'apt', 'store'], noSummer: true,
    say: T2('젖은 빨래를 빨리 말리려고 난로 바로 곁에 널어 두었어요.', 'I hung wet laundry right by the heater to dry it fast.'),
    clue: T2('난로 바로 앞 빨래 건조대가 타서 휘어 있어요.', 'The drying rack right in front of the heater is burnt and bent.'),
    tip: T2('난로 둘레에는 옷·이불·종이처럼 탈 것을 두지 않아요.', 'Keep clothes, blankets and paper away from heaters.'),
    next: T2('어제 불난 곳 이웃이 난로 둘레에 안전 울타리를 쳤어요. 빨래는 햇볕에 말린대요', 'Yesterday’s fire place put a safety guard round the heater. Laundry dries in the sun now') },
  trash: { k: 'gen', icon: '🚮', t: T2('마당 쓰레기 태우기', 'Burning rubbish in the yard'), types: ['house', 'store'],
    say: T2('마당 구석에서 쓰레기를 태우다가 불티가 벽 쪽으로 날아갔어요.', 'Rubbish was being burnt in the yard, and sparks flew onto the wall.'),
    clue: T2('마당 구석에 쓰레기를 태운 재가 남아 있고, 벽 아래쪽이 그을렸어요.', 'Ash from burnt rubbish is left in the corner of the yard, and the bottom of the wall is scorched.'),
    tip: T2('쓰레기는 태우지 않고 나눠서 버려요(분리배출).', 'Never burn rubbish. Sort it and put it out for collection.'),
    next: T2('어제 불난 곳 이웃이 쓰레기를 나눠 버리는 통을 마당에 두었어요. 문 옆엔 새 소화기도 있어요', 'Yesterday’s fire place set up sorting bins in the yard. A new extinguisher stands by the door') },
};
export const CAUSE_ORDER = ['tap', 'dust', 'pot', 'heater', 'trash'];
// 대처 고르기(반장 소방관이 물음) · 맞는 것 = METHOD_OK[갈래]
export const METHOD = [
  T2('바로 물을 뿌려요', 'Spray water right away'),
  T2('전기부터 끊어요(차단기 내리기)', 'Cut the power first (switch off the breaker)'),
  T2('뚜껑·덮개로 덮어 공기를 막아요', 'Cover it with a lid to block the air'),
  T2('창문을 활짝 열어 바람을 넣어요', 'Open the windows wide to let air in'),
];
export const METHOD_OK = { gen: 0, elec: 1, oil: 2 };
export const METHOD_WHY = {
  gen: T2('종이·나무·옷이 타는 불은 물로 식혀서 꺼요.', 'Paper, wood and cloth fires are put out by cooling them with water.'),
  elec: T2('전기가 흐르는 곳에 물을 뿌리면 감전될 수 있어요. 차단기를 먼저 내려요.', 'Water on live electricity can give a shock. Switch off the breaker first.'),
  oil: T2('기름 불에 물을 부으면 기름이 튀어 불이 커져요. 덮어서 공기를 막아요.', 'Water on an oil fire makes the oil spit and the fire grow. Cover it to block the air.'),
};
export const METHOD_NO = T2('바람(공기)이 들어가면 불이 더 세져요.', 'More air makes a fire stronger.');

// ③ 구할 대상 셋(+ 지붕 고양이 = 1층 집에서 사다리)
export const TARGET = {
  elder: { t: T2('2층 창가 어르신', 'Grandpa at the 2nd-floor window'), need: 'h2' },
  cat: { t: T2('숨은 고양이', 'A hiding cat') },
  roofcat: { t: T2('지붕 위 고양이', 'A cat on the roof'), need: 'roof' },
  stop: { t: T2('다시 들어가려는 이웃', 'A neighbour going back in') },
};
export const STOP_ITEM = [T2('휴대폰', 'my phone'), T2('가방', 'my bag'), T2('사진첩', 'the photo album'), T2('지갑', 'my wallet')];
export const STOP_Q = { c: [T2('들어가면 안 돼요! 연기는 몇 번만 마셔도 위험해요. 물건은 소방관께 말씀드려요.', 'Please don’t go in! Even a few breaths of smoke are dangerous. Tell the firefighters instead.'), T2('빨리 다녀오세요!', 'Be quick!'), T2('뒷문으로 몰래 들어가요.', 'Sneak in through the back door.')], ok: 0,
  yes: T2('맞아요… 물건은 다시 사면 되지요. 여기서 기다릴게요.', 'You’re right… things can be replaced. I’ll wait here.'),
  no: T2('한 번 나온 집에는 다시 들어가지 않는대요. 소방관께 말씀드릴게요.', 'Once you are out, you never go back in. I’ll tell the firefighters.') };

// 이웃 안전 물음(여섯 가운데 판마다 하나~둘)
export const QPOOL = [
  { q: T2('연기가 무서워요. 연기 속에서는 어떻게 나가야 해요?', 'The smoke is scary. How do we get out through smoke?'), c: [T2('몸을 낮추고 코와 입을 막고 계단으로 나가요', 'Stay low, cover nose and mouth, use the stairs'), T2('승강기를 타고 빨리 내려가요', 'Take the lift down quickly'), T2('숨을 크게 들이마시고 뛰어요', 'Take a deep breath and run')], ok: 0, yes: T2('아, 그렇군요! 연기는 위로 올라가서 몸을 낮추면 숨쉬기 쉬워요. 고마워요!', 'I see! Smoke rises, so staying low makes it easier to breathe. Thank you!'), no: T2('아, 불이 나면 승강기는 멈추거나 연기가 들어올 수 있대요. 몸을 낮추고 계단으로 나갈게요.', 'Oh, in a fire the lift can stop or fill with smoke. I’ll stay low and take the stairs.') },
  { q: T2('불이 난 걸 처음 보면 몇 번에 전화해요?', 'If I see a fire first, which number do I call?'), c: [T2('119', '119'), T2('112', '112'), T2('114', '114')], ok: 0, yes: T2('맞아요, 119! 불이나 사고, 아픈 사람이 있을 때 걸어요.', 'Right, 119 — for fires, accidents and sick people.'), no: T2('불이 나면 119예요. 112는 경찰이에요. 잘 기억할게요!', 'Fire is 119. 112 is the police. I’ll remember!') },
  { q: T2('옷에 불이 붙으면 어떻게 해요?', 'What if your clothes catch fire?'), c: [T2('멈추고, 눕고, 굴러요', 'Stop, drop and roll'), T2('바람이 불게 마구 뛰어요', 'Run fast so the wind blows it out'), T2('손으로 세게 털어요', 'Beat it hard with your hands')], ok: 0, yes: T2('그렇지요! 뛰면 바람 때문에 불이 커져요. 멈추고 눕고 구르면 꺼져요.', 'Yes! Running feeds the fire air. Stop, drop and roll puts it out.'), no: T2('뛰면 바람 때문에 불이 커진대요. 멈추고, 눕고, 구르는 거예요.', 'Running feeds the fire air. It’s stop, drop and roll.') },
  { q: T2('불이 났을 때 방문을 열기 전에 뭘 해야 해요?', 'Before opening a door in a fire, what should you do?'), c: [T2('손등으로 손잡이를 살짝 대 봐요. 뜨거우면 다른 길로', 'Touch the handle with the back of your hand. If hot, use another way'), T2('발로 세게 차서 열어요', 'Kick it open hard'), T2('문을 활짝 열고 크게 소리쳐요', 'Fling it open and shout')], ok: 0, yes: T2('맞아요. 손잡이가 뜨거우면 문 밖에 불이 있다는 뜻이에요.', 'Right. A hot handle means fire on the other side.'), no: T2('손등으로 손잡이를 먼저 대 본대요. 뜨거우면 문 너머에 불이 있는 거예요.', 'First touch the handle with the back of your hand. Hot means fire behind it.') },
  { q: T2('밖으로 나온 다음엔 어떻게 해요?', 'What do we do once we are outside?'), c: [T2('정한 곳에 모여 기다리고, 다시 들어가지 않아요', 'Meet at the agreed spot and never go back in'), T2('불 끄는 걸 가까이서 구경해요', 'Watch the firefighters up close'), T2('두고 온 물건을 가지러 가요', 'Go back for things you left')], ok: 0, yes: T2('그렇군요. 다 같이 모여 있으면 누가 아직 안에 있는지 소방관이 바로 알 수 있어요.', 'I see. If we all meet up, the firefighters know at once if anyone is still inside.'), no: T2('한 번 나오면 다시 들어가지 않고, 정한 곳에 모여 있는 거래요.', 'Once out, you stay out and meet at the agreed spot.') },
  { q: T2('불이 나기 전에 집에 꼭 있어야 하는 것은 뭐예요?', 'What should every home have before a fire happens?'), c: [T2('소화기와 화재 감지기', 'An extinguisher and a smoke alarm'), T2('커다란 선풍기', 'A big fan'), T2('양초 여러 개', 'Lots of candles')], ok: 0, yes: T2('맞아요! 감지기는 연기를 먼저 알려 주고, 작은 불은 소화기로 꺼요.', 'Right! The alarm warns of smoke first, and the extinguisher puts out small fires.'), no: T2('집마다 소화기와 화재 감지기를 두는 거래요. 감지기가 연기를 먼저 알려 줘요.', 'Every home should have an extinguisher and a smoke alarm. The alarm warns you first.') },
];

// ④ 도전 칸 다섯(칸이 오를수록 하나씩 더해짐) · n = 불꽃 수 · tool = 'ext'(소화기 · 넣은 양이 정해짐) | 'hose' · up = 높은 곳 구조(사다리) · two = 두 곳 · boss = 대원 둘에게 일 맡기기
export const FLV = [null,
  { t: T2('소화기로 작은 불', 'Small fire with an extinguisher'), n: 2, tool: 'ext' },
  { t: T2('호스로 불 끄기', 'Put it out with the hose'), n: 4, tool: 'hose' },
  { t: T2('사다리차로 높은 곳 구하기', 'Rescue up high with the ladder truck'), n: 5, tool: 'hose', up: 1 },
  { t: T2('두 곳에 동시에 불', 'Fire in two places at once'), n: 4, tool: 'hose', two: 1 },
  { t: T2('반장 — 대원 둘에게 일 맡기기', 'Crew leader — give two firefighters their jobs'), n: 5, tool: 'hose', two: 1, boss: 1 },
];
// 반장 칸에서 맡길 일(필요한 것만 맞음)
export const TASK = {
  power: T2('차단기 내리기', 'Switch off the breaker'),
  cover: T2('냄비에 덮개 덮기', 'Cover the pan'),
  spot: T2('옆 불티 자리 막기', 'Stop the sparks next door'),
  guide: T2('이웃 대피 안내', 'Guide the neighbours to safety'),
  ladder: T2('사다리 펴기', 'Raise the ladder'),
  watch: T2('소방차 곁에서 구경하기', 'Stand by the engine and watch'),
};

// 씨앗 꼴(같은 날·같은 판 수 = 같은 판 · 시험에서 되풀이)
export const rnd = seed => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const pickW = (R, L9) => { let t = 0; for (const q of L9) t += q[1]; let r = R() * t; for (const q of L9) { r -= q[1]; if (r <= 0) return q[0]; } return L9[L9.length - 1][0]; };

/* 한 판 짜기
   o = { seed, lv(1~5), types: { house: n, apt: n, … } 둘레에 있는 집 갈래 수, wx: 'clear'|'rain'|'snow', night, windy, season, h2(type → 2층 이상?), hist: ['상황|원인|대상', …] 최근 판 }
   → { lv, sit, type, cause, method, target, two, up(불티 자리가 바람 아래쪽), qs: [QPOOL 번호], item, key } */
export function firePlan(o) {
  const lv = Math.max(1, Math.min(5, o.lv | 0 || 1)), L9 = FLV[lv], hist = o.hist || [];
  let best = null;
  for (let t = 0; t < 8; t++) { const R = rnd((o.seed >>> 0) + t * 40503);
    const avail = Object.keys(HTYPE).filter(k => (o.types || {})[k] > 0); if (!avail.length) return null;
    const type = avail[Math.floor(R() * avail.length)];
    const sit = o.wx === 'rain' || o.wx === 'snow' ? 'rain' : o.night ? 'dark' : o.windy ? 'windy' : pickW(R, [['calm', 4], ['windy', 3], ['dark', type === 'store' || type === 'apt' ? 4 : 2]]);
    const cs = CAUSE_ORDER.filter(k => CAUSE[k].types.includes(type) && !(CAUSE[k].noSummer && o.season === 'summer'));
    const cause = cs[Math.floor(R() * cs.length)];
    const h2 = !!(o.h2 && o.h2[type]), tg = [];
    if (L9.up) { if (h2) tg.push(['elder', 3]); if (type === 'house' || type === 'shop' || type === 'store') tg.push(['roofcat', h2 ? 1 : 3]); if (!tg.length) tg.push(['elder', 1]); }
    else { tg.push(['cat', 3], ['stop', 3]); if (h2 && lv >= 2) tg.push(['elder', 2]); if (lv >= 2 && type !== 'apt') tg.push(['roofcat', 1]); }
    const target = pickW(R, tg);
    const qn = lv === 1 || target === 'stop' ? 1 : 2, qs = []; const pool = QPOOL.map((_, i) => i).filter(i => !(target === 'stop' && i === 4));
    while (qs.length < qn && pool.length) qs.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    const P = { lv, sit, type, cause, method: CAUSE[cause].k, target, two: !!L9.two, up: R() < 0.65, qs, item: Math.floor(R() * STOP_ITEM.length), key: sit + '|' + cause + '|' + target, R2: Math.floor(R() * 1e9) };
    if (!best) best = P; if (!hist.slice(-4).includes(P.key) && !hist.slice(-2).some(k => k.split('|')[1] === cause)) return P; }   /* 최근 네 판과 같은 조합 · 최근 두 판과 같은 원인은 다시 고름 */
  return best; }
