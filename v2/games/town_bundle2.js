// 🧺 꾸러미를 채우면 마을이 바뀜(BUNDLE-2 · 성취 네 기둥 ④ '내 결과가 남는 마을' · 정본 docs/systems/town_achieve.md · 스타듀 마을 회관 결)
//   꾸러미 하나 = 마을 한 곳(그 마을에 있는 자리만 · 없으면 다음 자리) — 채운 날 밤이 지나면 그 자리에 새 물건 + 작은 판('마을 사람들이 함께 만들었어요' · 아이 이름 X)
//   봄 = 정자 앞 꽃밭 · 여름 = 다리 밤길 등(밤에 켜짐 · MeshBasic 부품 · 새 Light X) · 가을 = 장터 옆 잔치 천막과 긴 상 · 겨울 = 비탈길 모래 상자(제설함)
//   텃밭 = 학교 텃밭 옆 빗물 통 · 숲 = 숲길 들머리 그루터기 쉼터 · 요리 = 행정복지센터 앞 나눔 냉장고
//   이어짐: 아침 소식판 한 줄(news) · 나의 길 🤝 이웃 걸음 하나(town_path.js stepsOf가 S.bun2.on을 셈) · 하루 마무리 '오늘 바뀐 것'(dayRow)·'내일 기다리는 것'(dayWait) · 꾸러미 창 '채우면 …' 한 줄(hint)
//   🤝 이웃 사연 한 장: 하트 단계 셋(단골)을 넘은 이웃에게 E = 그 이웃의 사연 한 장(일 · 하루 · 지역 생활 · 사실만 · 이름 없는 역할) · 갈래마다 한 번 · 수첩 🛤 나의 길 이웃 줄에 남음(다시 읽기)
//   보상 = 바뀐 마을 자체 · 사연은 솜씨(관찰) 조금만(rwCheck 'tale:<갈래>' 꼬리표)
//   저장 GAME.S.bun2 = { v, q: { 꾸러미: 채운 날 }, on: { 꾸러미: 마을에 생긴 날 }, told: { 꾸러미: 1 }, tale: { 갈래: { d, hk } } }
//   지킴: 판타지 X · 실명 X · 지어낸 행사·역사 X(일반 사실만) · 지역 비하 X · 매 프레임 일 0(1초 칸 sec) · 줄 가운데 // 주석 X · 글자 판(캔버스)에 이모지 X
export const BUN2_V = 1;
export const TALE_LV = 3;
const T2 = (ko, en) => [ko, en];
const FONT = '"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif';
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

// 자리 이름(그 물건이 놓인 곳)
export const PLACE_W = { pav: T2('정자 앞', 'by the pavilion'), stall: T2('장터 옆', 'by the market'), hall: T2('행정복지센터 앞', 'outside the community centre'), post: T2('우체국 앞', 'outside the post office'),
  bridge: T2('다리 보도', 'along the bridge walkway'), slope: T2('비탈길', 'on the steep road'), farm: T2('학교 텃밭 옆', 'by the school garden'), forest: T2('숲길 들머리', 'where the forest path starts') };
// 꾸러미마다 바뀌는 것: at = 자리 차례(앞 것이 이 마을에 없으면 다음) · v = 놓는 말 · fact = 판 E 사실 한 줄
export const CHG = {
  spring: { ic: '🌸', kind: 'flower', at: ['pav', 'stall', 'hall'], thing: T2('꽃밭', 'flower beds'), v: T2('가꿨어요', 'planted'), fact: T2('봄꽃은 벌과 나비를 불러요. 벌이 꽃가루를 옮겨 주면 열매가 맺혀요.', 'Spring flowers bring bees and butterflies. When bees carry pollen, fruit can form.') },
  summer: { ic: '🏮', kind: 'lamp', at: ['bridge', 'stall', 'hall'], thing: T2('밤길 등', 'night lamps'), v: T2('달았어요', 'put up'), fact: T2('밤에 물가를 건널 때는 발밑이 잘 보여야 안전해요. 등은 해가 지면 켜져요.', 'Crossing water at night is safer when you can see your feet. The lamps come on after sunset.') },
  autumn: { ic: '⛺', kind: 'tent', at: ['stall', 'pav', 'hall'], thing: T2('잔치 천막과 긴 상', 'a festival tent and long table'), v: T2('세웠어요', 'set up'), fact: T2('가을걷이가 끝나면 이웃끼리 모여 거둔 것을 나눠 먹어요.', 'After the autumn harvest, neighbours get together and share what they grew.') },
  winter: { ic: '❄️', kind: 'sand', at: ['slope', 'hall'], thing: T2('모래 상자', 'sand boxes'), v: T2('놓았어요', 'set out'), fact: T2('언 비탈길에 모래를 뿌리면 바닥이 거칠어져서 덜 미끄러워요.', 'Sand on an icy slope makes the ground rough, so it is less slippery.') },
  garden: { ic: '💧', kind: 'barrel', at: ['farm'], thing: T2('빗물 통', 'a rain barrel'), v: T2('놓았어요', 'set up'), fact: T2('비가 올 때 빗물을 모아 두었다가 텃밭에 줘요. 수돗물을 아낄 수 있어요.', 'Rain is saved in the barrel and used on the garden later. It saves tap water.') },
  forest: { ic: '🌲', kind: 'stump', at: ['forest', 'pav', 'hall'], thing: T2('그루터기 쉼터', 'a stump rest spot'), v: T2('만들었어요', 'made'), fact: T2('바람에 쓰러진 나무를 잘라 앉을 자리로 썼어요. 숲에서 난 것을 숲에서 다시 써요.', 'A tree blown down by the wind was cut into seats. What comes from the forest is used again in the forest.') },
  cook: { ic: '🍳', kind: 'fridge', at: ['hall', 'post', 'stall'], thing: T2('나눔 냉장고', 'a sharing fridge'), v: T2('놓았어요', 'set up'), fact: T2('남는 음식을 넣어 두면 필요한 이웃이 가져가요. 음식을 덜 버리게 돼요.', 'Leftover food goes in, and neighbours who need it take it. Less food is thrown away.') },
};

// 🤝 이웃 사연(갈래 = 마을 PLAYK 열쇠 · 일 · 하루 · 지역 생활 · 일반 사실만 · 이름 없는 일꾼의 말)
export const TALES = {
  shiitake: [T2('제 하루는 이른 아침에 참나무 원목 사이를 걷는 걸로 시작해요.', 'My day starts early, walking between the oak logs.'), T2('원목에 버섯 씨를 넣고 한 해쯤 기다려야 첫 표고가 나와요.', 'After we put mushroom spawn in a log, we wait about a year for the first shiitake.'), T2('비 온 다음 날에는 갓이 쑥 커져서 손이 바빠져요.', 'The day after rain, the caps grow fast and my hands get busy.'), T2('기다리는 일이 많지만, 첫 버섯이 올라오는 날은 지금도 설레요.', 'There is a lot of waiting, but the day the first mushroom comes up still makes me happy.')],
  cabbage: [T2('여기는 산 위라서 여름에도 아침저녁이 서늘해요.', 'Up here on the mountain, mornings and evenings stay cool even in summer.'), T2('그래서 한여름에도 배추를 키울 수 있어요.', 'That is why we can grow cabbage in the middle of summer.'), T2('거두는 철에는 해 뜨기 전에 나와서 더워지기 전에 배추를 베요.', 'In harvest season we come out before sunrise and cut the cabbages before it gets hot.'), T2('여름에 먹는 배추는 이런 높은 산밭에서 많이 와요.', 'A lot of the cabbage people eat in summer comes from high fields like this.')],
  potato: [T2('봄에 씨감자를 조각내서 심어요. 조각마다 싹 날 눈이 있어야 해요.', 'In spring we cut seed potatoes into pieces. Each piece needs an eye to sprout.'), T2('여름이 시작될 무렵 캐서 하지감자라고도 불러요.', 'We dig them around the start of summer, so some call them midsummer potatoes.'), T2('캔 감자를 햇볕에 오래 두면 껍질이 푸르게 변해요.', 'If dug potatoes stay in the sun too long, the skin turns green.'), T2('그래서 캔 다음에는 그늘에서 말려요.', 'So after digging, we dry them in the shade.')],
  lumber: [T2('나무를 베면 그 자리에 꼭 어린나무를 다시 심어요.', 'Whenever we cut a tree, we always plant a young one in its place.'), T2('오늘 심은 나무가 다 자라려면 수십 년이 걸려요.', 'A tree planted today takes decades to grow up.'), T2('그래서 저는 제가 다 보지 못할 숲을 심는다고 생각해요.', 'So I think of it as planting a forest I may not see fully grown.'), T2('봄에 땅이 녹으면 심는 일이 제일 바빠요.', 'When the ground thaws in spring, planting is our busiest work.')],
  beehive: [T2('벌통을 열기 전에 연기를 살살 피워요. 그러면 벌들이 얌전해져요.', 'Before opening a hive I puff a little smoke. It calms the bees.'), T2('꽃이 많은 봄에는 벌들이 하루에도 셀 수 없이 드나들어요.', 'In spring, with so many flowers, the bees fly in and out more times than I can count.'), T2('아카시아꽃이 피는 늦봄이 꿀을 제일 많이 뜨는 때예요.', 'Late spring, when the acacia blooms, is when we collect the most honey.'), T2('벌이 건강하려면 마을 둘레에 꽃이 이어서 피어야 해요.', 'For bees to stay healthy, flowers need to keep blooming around the town.')],
  pasture: [T2('소와 양은 하루에 풀을 아주 많이 먹어요.', 'Cows and sheep eat a lot of grass every day.'), T2('그래서 아침마다 오늘은 어느 풀밭으로 보낼지 정해요.', 'So every morning I decide which field they go to today.'), T2('한곳만 계속 먹이면 풀이 다시 자랄 틈이 없거든요.', 'If they graze one place all the time, the grass has no chance to grow back.'), T2('겨울에는 가을에 말려 둔 건초를 먹여요.', 'In winter they eat the hay we dried in autumn.')],
  saltpan: [T2('염전 일은 날씨가 정해요.', 'In salt-pan work, the weather decides.'), T2('맑고 바람 부는 날에 바닷물이 잘 말라서 소금이 많이 생겨요.', 'On sunny, windy days the seawater dries well and we get lots of salt.'), T2('비가 오면 소금이 녹아 버려서 비 오기 전에 서둘러 거둬요.', 'Rain melts the salt, so we hurry to rake it in before the rain.'), T2('그래서 저는 아침마다 하늘부터 봐요.', 'That is why I look at the sky first every morning.')],
  paddy: [T2('봄에 논에 물을 대고 모를 심어요.', 'In spring we fill the paddy with water and plant rice seedlings.'), T2('여름 내내 물 높이를 살피고 풀을 뽑아요.', 'All summer we watch the water level and pull weeds.'), T2('가을에 벼가 고개를 숙이면 거둘 때예요.', 'In autumn, when the rice heads droop, it is time to harvest.'), T2('밥 한 그릇이 되기까지 봄부터 가을까지 꼬박 걸려요.', 'A bowl of rice takes the whole time from spring to autumn.')],
  strawberry: [T2('딸기는 비닐하우스 안에서 겨울에도 자라요.', 'Strawberries grow in the greenhouse even in winter.'), T2('꽃이 피면 하우스 안에 벌을 넣어 꽃가루를 옮기게 해요.', 'When the flowers open, we let bees into the greenhouse to carry the pollen.'), T2('추운 아침에는 하우스 안이 너무 차지 않은지 먼저 살펴요.', 'On cold mornings I first check the greenhouse is not too chilly.'), T2('한겨울에 먹는 딸기는 이렇게 하우스에서 와요.', 'The strawberries people eat in midwinter come from greenhouses like this.')],
  pear: [T2('봄에 배꽃이 피면 붓으로 꽃가루를 하나하나 묻혀 주기도 해요.', 'When the pear trees bloom in spring, we sometimes dab pollen on each flower with a brush.'), T2('열매가 작을 때 종이 봉지를 씌워서 벌레와 센 햇볕을 막아요.', 'While the fruit is small, we cover it with paper bags against bugs and strong sun.'), T2('봉지 씌울 때는 일손이 많이 필요해서 이웃끼리 서로 거들어요.', 'Bagging takes many hands, so neighbours help each other.'), T2('가을에 봉지를 벗길 때가 일 년 중 제일 기다려지는 날이에요.', 'Taking the bags off in autumn is the day I look forward to most.')],
  stall: [T2('장날에는 새벽부터 짐을 풀어요.', 'On market day I unpack from dawn.'), T2('여기 물건은 이 근처 밭과 바다에서 온 것이 많아요.', 'A lot of what I sell comes from the fields and sea nearby.'), T2('단골손님은 얼굴만 봐도 무엇을 찾는지 알아요.', 'I know what my regulars want just by seeing their faces.'), T2('장터는 물건만 사고파는 곳이 아니라 소식도 오가는 곳이에요.', 'A market is not just for buying and selling. News travels here too.')],
  fisher: [T2('고기잡이배는 새벽 물때에 맞춰 나가요.', 'Fishing boats go out with the early tide.'), T2('바다 날씨가 나쁘면 아무리 바빠도 나가지 않아요.', 'If the sea weather is bad, we do not go out, however busy we are.'), T2('잡은 고기는 항구에서 경매로 팔려요.', 'The fish we catch are sold by auction at the harbour.'), T2('배가 무사히 돌아오면 그날 일의 반은 끝난 거예요.', 'Once the boat is safely back, half the day’s work is done.')],
  clam: [T2('조개는 물이 빠진 썰물 때만 캘 수 있어요.', 'We can only dig clams at low tide.'), T2('그래서 제 하루는 물때표를 보고 정해요.', 'So I plan my day by the tide table.'), T2('작은 조개는 다시 갯벌에 놓아줘요.', 'Small clams go back into the mud.'), T2('그래야 내년에도 캘 조개가 남아요.', 'That way there will still be clams next year.')],
  seaweed: [T2('김은 찬 바닷물을 좋아해서 늦가을부터 겨울까지 키워요.', 'Laver likes cold seawater, so we grow it from late autumn through winter.'), T2('바다에 그물을 펼쳐 두면 김이 붙어 자라요.', 'We spread nets in the sea and the laver grows on them.'), T2('새벽에 배를 타고 나가서 김을 거둬 와요.', 'At dawn we take the boat out and bring the laver in.'), T2('물이 차가워서 손은 시리지만, 그때 김이 맛있어요.', 'The water is cold on my hands, but that is when laver tastes best.')],
  oyster: [T2('굴은 줄에 매달려 바닷물 속 작은 먹이를 걸러 먹으며 자라요.', 'Oysters hang on ropes and grow by filtering tiny food from the seawater.'), T2('먹을 만큼 자라는 데 한두 해쯤 걸려요.', 'They take about one or two years to grow big enough to eat.'), T2('겨울에 굴이 제일 맛있어서 그때가 제일 바빠요.', 'Oysters taste best in winter, so that is our busiest time.'), T2('바다가 깨끗해야 굴도 잘 자라서 바다를 늘 살펴요.', 'Oysters need clean water, so I always keep an eye on the sea.')],
};

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · busy() · panel() · say(t, s) · sfx(k) · banner(t, s) · chip(k, t, o) · route(p) · dialog(o) · rec(k, o) · diary(t)
//   buildParts(fn) · gy(x, z) · okSpot(x, z) · free(x, z)(학교 안 텃밭 곁 — 막힘만 봄) · spots()(나의 길 자리 = pav·stall·hall·post) · bridges() · roads() · farmRow() · res() · gate()
//   book()(꾸러미 책 — 다 찬 것 보기) · night() · skUp(k, n, src) · repOf(w) · who(w) · hearts(hk) · playk(k) · relabel()(일꾼 E 글 다시)
export function createBundle2(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, mark = () => A.GAME.mark();
  const st = () => { const g = G(); let s = g.bun2; if (!s || typeof s !== 'object' || s.v !== BUN2_V) s = g.bun2 = { v: BUN2_V, q: {}, on: {}, told: {}, tale: {} }; for (const k of ['q', 'on', 'told', 'tale']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
  let dead = false, BOOT = false, VIS = {}, HOT = {}, TRY = {}, AT = {}, LAMPS = [], litOn = null, dayT = 0, dayK = -1, tellT = -1e9, tlK = '', tlT = 0, telling = false, chipK = ''; const DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };

  // ───────── 자리 고르기 ─────────
  /* 발자리(가로 w · 세로 d · 돌림 ry)의 가운데와 네 귀가 모두 빈 땅인가 */
  const foot = (ok, x, z, w, d, ry) => { const c = Math.cos(ry), s = Math.sin(ry); if (!ok(x, z)) return false; for (const [a, b] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) if (!ok(x + a * c + b * s, z - a * s + b * c)) return false; return true; };
  const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  /* 이미 놓은 꾸러미 물건(가운데 · 판) r 안인가 */
  function nearMine(x, z, r) { for (const id of keys(AT)) { const pl = AT[id]; if (!pl) continue; for (const o of pl.pts.concat(pl.sign ? [pl.sign] : [])) if (Math.hypot(o.x - x, o.z - z) < r + (o === pl.sign ? 0 : 1.2)) return true; } return false; }
  const okA = (x, z) => A.okSpot(x, z) && !(A.avoid && A.avoid(x, z)) && !nearMine(x, z, 1.4);
  const okS = (x, z) => (A.stand ? A.stand(x, z) : A.okSpot(x, z)) && !(A.avoid && A.avoid(x, z)) && !nearMine(x, z, 1.4);   /* 보도 위도 됨(차로·물·막힘만 X) — 다리 등·모래 상자 */
  /* 기준점 둘레(r0 ~ r0 + 6) 16 방향에서 발자리가 들어가는 곳 · 물건 앞(로컬 +z)은 기준점을 봄 */
  function near(cx, cz, r0, w, d, ok) { ok = ok || okA; for (const r of [r0, r0 + 1.5, r0 + 3, r0 + 4.5, r0 + 6]) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + 0.2, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r, ry = faceTo(x, z, cx, cz); if (foot(ok, x, z, w, d, ry)) return { x, z, ry }; } return null; }
  /* 물건 옆 판 자리(물건 오른쪽 · 없으면 왼쪽 · 앞) */
  function signBy(o, w, ok) { ok = ok || okA; const c = Math.cos(o.ry), s = Math.sin(o.ry); for (const [a, b] of [[w / 2 + 0.8, 0.3], [-(w / 2 + 0.8), 0.3], [w / 2 + 1.4, 0.8], [-(w / 2 + 1.4), 0.8], [0, 1.6], [w / 2 + 2.2, 0], [-(w / 2 + 2.2), 0], [w / 2 + 0.8, -0.6], [-(w / 2 + 0.8), -0.6], [w / 2 + 3, 0.4], [-(w / 2 + 3), 0.4]]) { const x = o.x + a * c + b * s, z = o.z - a * s + b * c; if (ok(x, z)) return { x, z, ry: o.ry }; } return null; }
  const hallLike = (P, k) => (P[k] && P[k].door ? { x: P[k].door[0], z: P[k].door[1] } : null);
  /* 꾸러미 하나의 자리 = { at: 자리 이름, pts: [{ x, z, ry }…], sign: { x, z, ry } } | null — 처음 한 번 굳힘(같은 판이면 늘 같은 곳) */
  function placeOf(id) { if (AT[id] !== undefined) return AT[id]; const C = CHG[id]; let out = null; const P = A.spots() || {};
    for (const at of C.at) { out = tryAt(C, at, P); if (out) { out.at = at; break; } }
    AT[id] = out; log('place ' + id + ' ' + (out ? out.at + ' ' + out.pts.length : 'none')); return out; }
  const SZ = { flower: [3.6, 1.2], lamp: [0.5, 0.5], tent: [3.6, 2.8], sand: [1.4, 0.8], barrel: [1.5, 0.8], stump: [2.4, 2.0], fridge: [1.6, 1.0] };
  function tryAt(C, at, P) { const [w, d] = SZ[C.kind];
    if (at === 'bridge') { const RK = b => (b.kind === '아이 다리' || b.kind === '나무다리' ? 0 : b.kind === '큰길 다리' ? 2 : 1), g = A.gate ? A.gate() : [16.5, 50], dG = b => Math.hypot((b.x0 + b.x1) / 2 - g[0], (b.z0 + b.z1) / 2 - g[1]);   /* 걷는 다리(아이 다리·나무다리) 먼저 · 그다음 학교에서 가까운 것 */
      const B = (A.bridges() || []).filter(b => b && b.ax && b.kind !== '돌다리' && b.y1 != null).sort((a, b) => RK(a) - RK(b) || dG(a) - dG(b)); if (!B.length || !A.deck) return null;
      for (const b of B.slice(0, 6)) { const [p0, p1] = b.ax, ux0 = p1[0] - p0[0], uz0 = p1[1] - p0[1], ul = Math.hypot(ux0, uz0) || 1, ux = ux0 / ul, uz = uz0 / ul, px = -uz, pz = ux, mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, pts = [];
        const span = Math.max(Math.abs(ux) * (b.x1 - b.x0), Math.abs(uz) * (b.z1 - b.z0)), hw = Math.max(0.6, Math.min(8, 0.5 * (Math.abs(px) * (b.x1 - b.x0) + Math.abs(pz) * (b.z1 - b.z0))));   /* 다리 길이 · 반폭(바닥 상자 모서리 기준) */
        const W = Math.min(16, Math.max(b.x1 - b.x0, b.z1 - b.z0)), ok9 = (x, z) => A.deck(x, z, b.y1);   /* ax = 다리 걷는 줄(큰길 다리는 한쪽 보도 가운데) — 옆으로 훑어 서는 바닥 끝(난간 바로 안쪽)을 찾음 */
        for (const t of span > 10 ? [-span / 8, span / 8] : [0]) { const at = o => [mx + ux * t + px * o, mz + uz * t + pz * o]; if (ok9(...at(0)) == null) continue; let lo = 0, hi = 0;   /* 다리 가운데쪽(물 위) · 걷는 줄(0)에서 이어진 바닥만 */
          for (let o = 0.25; o <= W && ok9(...at(o)) != null; o += 0.25) hi = o; for (let o = -0.25; o >= -W && ok9(...at(o)) != null; o -= 0.25) lo = o;
          const O = [[hi, 0.5], [lo, -0.5]].filter(([o, k]) => !(A.lane && A.lane(...at(o + k)))).map(q => q[0]);   /* 걷는 바닥 끝 가운데 차로 쪽이 아닌 끝 = 난간 바로 안쪽(보도 가운데를 막지 않게) */
          for (const o of O) { const x = mx + ux * t + px * o, z = mz + uz * t + pz * o, y = ok9(x, z); if (y == null || nearMine(x, z, 0.6) || (A.avoid && A.avoid(x, z)) || pts.some(q => Math.hypot(q.x - x, q.z - z) < 1)) continue; const s = o >= (lo + hi) / 2 ? 1 : -1; pts.push({ x, z, ry: Math.atan2(-px * s, -pz * s), y }); } }
        if (pts.length >= 2) return { pts, sign: [[p0, 1], [p1, -1]].map(([e, sg]) => near(e[0] - ux * sg * 1.2, e[1] - uz * sg * 1.2, 1.2, 1.3, 0.3, okS)).find(Boolean) || null, br: b.kind || '' }; }   /* 판 = 다리 들머리 땅 */
      return null; }
    if (at === 'slope') { const R = A.roads() || [], g = A.gate ? A.gate() : [16.5, 50], C9 = [];   /* 길 조각을 8m씩 따라가며 기운 곳(고갯길) — 높이 차 / 8m */
      for (const s of R) { if (!s || !s.a || !s.b) continue; const Lg = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); if (Lg < 8) continue; const ux = (s.b[0] - s.a[0]) / Lg, uz = (s.b[1] - s.a[1]) / Lg; let y0 = A.gy(s.a[0], s.a[1]);
        for (let t = 8; t <= Lg; t += 8) { const x = s.a[0] + ux * t, z = s.a[1] + uz * t, y1 = A.gy(x, z), gr = Math.abs(y1 - y0) / 8; y0 = y1; const mx = x - ux * 4, mz = z - uz * 4; if (gr > 0.05 && Math.hypot(mx - g[0], mz - g[1]) < 900) C9.push({ ux, uz, hw: s.hw || 3, gr, mx, mz }); } }
      C9.sort((a, b) => b.gr - a.gr); const pts = [];
      for (const c of C9) { if (pts.length >= 2) break; if (pts.some(q => Math.hypot(q.x - c.mx, q.z - c.mz) < 40)) continue; const px = -c.uz, pz = c.ux, hw = c.hw;
        let got = null; for (const t of [0, -3, 3, -6, 6]) { const bx = c.mx + c.ux * t, bz = c.mz + c.uz * t, by = A.gy(bx, bz), okL = (x, z) => okS(x, z) && Math.abs(A.gy(x, z) - by) < 0.45;   /* 길가 보도(길과 같은 높이 · 옹벽·둔덕 위 X) */
          for (const sd of [1, -1]) for (const off of [hw + 0.5, hw + 0.9, hw + 1.3, hw - 0.2]) { const x = bx + px * sd * off, z = bz + pz * sd * off, ry = Math.atan2(-px * sd, -pz * sd); if (!got && foot(okL, x, z, w, d, ry)) got = { x, z, ry, gr: +c.gr.toFixed(3) }; } if (got) break; }
        if (got) pts.push(got); }
      if (!pts.length) return null; return { pts, sign: pts.map(o => signBy(o, w, okS)).find(Boolean) || null }; }
    if (at === 'farm') { const F = A.farmRow ? A.farmRow() : null; if (!F) return null; const ok = A.free ? (x, z) => A.free(x, z) && !nearMine(x, z, 1.4) : okA, cz = F[2];
      const mx = (F[0] + F[1]) / 2; for (const dz of [-6.5, 6.5, -7.5, 7.5, -9, 9, -1.5, 1.5, 0]) for (const x of [F[0] + 1, F[1] - 1, mx, F[0] - 2.2, F[1] + 2.2]) { const z = cz + dz, ry = dz ? Math.atan2(0, -Math.sign(dz)) : Math.atan2(mx - x, 0);   /* 밭 앞·뒤 길(두둑 사이) 먼저 · 물건 앞 = 밭 쪽 */
        if (foot(ok, x, z, w, d, ry)) { const o = { x, z, ry }; return { pts: [o], sign: signBy(o, w, ok) }; } }
      return null; }
    let c = null;
    if (at === 'pav') c = P.pav && P.pav.c ? { x: P.pav.c[0], z: P.pav.c[1], r: 5.6 } : null;
    else if (at === 'stall') c = P.stall ? { x: P.stall[0], z: P.stall[1], r: 4.5 } : null;
    else if (at === 'hall' || at === 'post') { const h = hallLike(P, at); c = h ? { ...h, r: 3.6 } : null; }
    else if (at === 'forest') { const R = (A.res && A.res()) || [], g = A.gate ? A.gate() : [16.5, 50]; let b = null, bd = 1e18; for (const q of R) { const d9 = Math.hypot(q.x - g[0], q.z - g[1]); if (d9 < bd) { bd = d9; b = q; } } c = b ? { x: b.x, z: b.z, r: 3 } : null; }
    if (!c) return null; const o = near(c.x, c.z, c.r, w, d); if (!o) return null; return { pts: [o], sign: signBy(o, w) }; }

  // ───────── 짓기(합친 부품 · 땅에 섬 · 지지 없는 부재 X) ─────────
  const addG = (g, x, z, ry, y) => { g.position.set(x, y == null ? A.gy(x, z) : y, z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); return g; };
  function parts(kind, put) {
    if (kind === 'flower') { for (const s of [-1, 1]) { const cx = s * 0.95; put('b', cx, 0, 0, 1.7, 0.22, 0.9, 0x8a6a4a); put('b', cx, 0.22, 0, 1.58, 0.03, 0.78, 0x5a3e28);   /* 나무 틀 · 흙 */
        const COL = [0xe85a8a, 0xf2c230, 0xffffff, 0xb070d0, 0xf08a3a]; for (let i = 0; i < 9; i++) { const a = cx - 0.6 + (i % 5) * 0.3 + (i > 4 ? 0.15 : 0), b = i > 4 ? 0.18 : -0.18, h = 0.16 + (i % 3) * 0.04; put('b', a, 0.25, b, 0.02, h, 0.02, 0x4f8a3a); put('s', a, 0.25 + h + 0.03, b, 0.065, 0.75, 0, COL[(i + (s > 0 ? 2 : 0)) % COL.length]); put('b', a + 0.05, 0.25 + h * 0.5, b, 0.08, 0.012, 0.03, 0x5fae45); } } }   /* 줄기 · 꽃송이 · 잎 */
    else if (kind === 'lamp') { put('c', 0, 0, 0, 0.14, 0.22, 0, 0x5a5f66); put('c', 0, 0.22, 0, 0.05, 2.2, 0, 0x3a3f4a); put('b', 0, 2.42, 0, 0.36, 0.05, 0.36, 0x3a3f4a); put('k', 0, 2.8, 0, 0.25, 0.16, 0, 0x3a3f4a); }   /* 받침 · 기둥 · 등 밑판 · 갓(등 유리는 낮·밤 둘로 따로) */
    else if (kind === 'tent') { for (const [a, b] of [[-1.6, -1.15], [1.6, -1.15], [-1.6, 1.15], [1.6, 1.15]]) put('c', a, 0, b, 0.045, 2.25, 0, 0x8a8f99);   /* 기둥 넷 */
      put('b', 0, 2.25, 0, 3.5, 0.06, 2.5, 0xf6f0e0); for (const a of [-1.31, -0.44, 0.44, 1.31]) put('b', a, 2.31, 0, 0.42, 0.012, 2.54, 0xc0504a);   /* 천막 지붕 · 빨간 줄 */
      for (const b of [-1.26, 1.26]) put('b', 0, 2.07, b, 3.5, 0.18, 0.02, 0xc0504a);   /* 앞뒤 드림 */
      for (const [a, b] of [[-1.05, -0.3], [1.05, -0.3], [-1.05, 0.3], [1.05, 0.3]]) put('b', a, 0, b, 0.07, 0.7, 0.07, 0x7a5232); put('b', 0, 0.7, 0, 2.4, 0.05, 0.72, 0x9b6a3c);   /* 긴 상 */
      for (const b of [-0.78, 0.78]) { put('b', 0, 0.42, b, 2.2, 0.05, 0.3, 0x9b6a3c); for (const a of [-0.95, 0.95]) put('b', a, 0, b, 0.06, 0.42, 0.24, 0x7a5232); }   /* 긴 의자 둘 */
      for (const [a, b, c] of [[-0.8, -0.12, 0xf6f4ee], [-0.25, 0.14, 0xf6f4ee], [0.3, -0.1, 0xf6f4ee], [0.85, 0.12, 0xf6f4ee]]) { put('c', a, 0.75, b, 0.13, 0.05, 0, c); } put('s', -0.8, 0.81, -0.12, 0.08, 0.5, 0, 0xe8d06a); put('s', -0.25, 0.81, 0.14, 0.09, 0.5, 0, 0xf4f1e8); put('s', 0.3, 0.81, -0.1, 0.08, 0.5, 0, 0xa0465a); put('s', 0.85, 0.81, 0.12, 0.08, 0.5, 0, 0xd9a060); }   /* 그릇 넷(배·밥·고구마·떡) */
    else if (kind === 'sand') { put('b', 0, 0, 0, 0.92, 0.56, 0.56, 0xf2c230); put('b', 0, 0.56, 0, 0.96, 0.06, 0.6, 0xe0a020); put('b', 0, 0.26, 0.2825, 0.62, 0.12, 0.005, 0x2b2420); put('b', 0.5, 0.2, 0.2825, 0.04, 0.16, 0.01, 0x9aa0a6);   /* 노란 상자 · 뚜껑 · 검은 띠 · 손잡이 */
      put('s', 0.75, 0, -0.05, 0.2, 0.45, 0, 0xd9c49a); put('b', 0.72, 0, 0.18, 0.05, 0.9, 0.05, 0x8a6a4a); put('b', 0.72, 0.02, 0.27, 0.18, 0.02, 0.14, 0x8a8f99); }   /* 모래 무더기 · 삽(자루 · 날) */
    else if (kind === 'barrel') { put('c16', 0, 0, 0, 0.36, 0.95, 0, 0x3b7fc4); put('c16', 0, 0.95, 0, 0.38, 0.04, 0, 0x2b5f94); for (const y of [0.25, 0.7]) put('c16', 0, y, 0, 0.365, 0.03, 0, 0x2b5f94); put('b', 0, 0.12, 0.36, 0.06, 0.06, 0.1, 0x9aa0a6);   /* 빗물 통 · 뚜껑 · 테 둘 · 꼭지 */
      put('c', 0.65, 0, 0.25, 0.14, 0.28, 0, 0x5aa65a); put('b', 0.83, 0.18, 0.25, 0.22, 0.04, 0.04, 0x5aa65a); }   /* 물뿌리개 */
    else if (kind === 'stump') { for (const [a, b, r, h] of [[-0.75, 0.5, 0.24, 0.42], [0.75, 0.5, 0.24, 0.4], [0, -0.55, 0.26, 0.44]]) { put('c', a, 0, b, r, h, 0, 0x8a5a34); put('c', a, h, b, r - 0.04, 0.01, 0, 0xd9b48a); }   /* 그루터기 셋 · 나이테 면 */
      put('c', 0, 0, 0.1, 0.36, 0.5, 0, 0x7a4a2a); put('c', 0, 0.5, 0.1, 0.33, 0.01, 0, 0xd9b48a); put('s', 0.12, 0.53, 0.06, 0.05, 0.7, 0, 0x8a5a34); }   /* 가운데 넓은 그루터기(탁자) · 솔방울 하나 */
    else if (kind === 'fridge') { put('b', 0, 0, 0, 0.82, 1.72, 0.68, 0xf2f4f2); put('b', 0, 1.0, 0.3425, 0.78, 0.012, 0.005, 0x9aa0a6); put('b', 0.32, 1.2, 0.3425, 0.04, 0.3, 0.02, 0x8a8f99); put('b', 0.32, 0.55, 0.3425, 0.04, 0.3, 0.02, 0x8a8f99);   /* 냉장고 · 문 사이 · 손잡이 둘 */
      put('b', 0, 0.9, 0.3475, 0.36, 0.22, 0.004, 0x6aa84f);   /* 초록 나눔 표(판 글은 옆 판에) */
      for (const a of [-0.5, 0.5]) put('b', a, 0, -0.42, 0.06, 2.1, 0.06, 0x6b4a2f); put('b', 0, 2.1, -0.05, 1.2, 0.05, 0.9, 0x6b8a5a); }   /* 차양 기둥 둘 · 차양 지붕 */
  }
  /* 판 하나 = 기둥 둘 + 판 뒤 널 + 글자 판(앞면) */
  function standSign(o, id) { const C = CHG[id], w = 1.3, h = 0.8, y = 0.75; const g = A.buildParts(put => { for (const s of [-1, 1]) put('b', s * (w / 2 + 0.03), 0, -0.04, 0.08, y + h + 0.06, 0.08, 0x6b4a2f); put('b', 0, y - 0.05, -0.07, w + 0.12, h + 0.12, 0.05, 0x8a6a4a); }); addG(g, o.x, o.z, o.ry);
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const gc = c.getContext('2d'), W = c.width, H = c.height, e = en();
    gc.fillStyle = '#6b8a5a'; gc.fillRect(0, 0, W, H); gc.fillStyle = '#fbf7ec'; gc.fillRect(12, 12, W - 24, H - 24); gc.fillStyle = '#2b2420'; gc.textAlign = 'left'; gc.textBaseline = 'top';
    gc.font = '900 40px ' + FONT; gc.fillText(L(C.thing).replace(/^a /, ''), 30, 30); gc.font = '800 27px ' + FONT; gc.fillStyle = '#4a3a2a'; gc.fillText(e ? 'Made together by the townspeople' : '마을 사람들이 함께 만들었어요', 30, 96);
    gc.fillStyle = '#6b8a5a'; gc.fillText(e ? 'from the ' + bunT(id)[1].toLowerCase() : bunT(id)[0] + jo(bunT(id)[0], '으로', '로'), 30, 140);
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: tx })); m.userData.fx = 1; m.position.set(0, y + h / 2 + 0.01, -0.035); g.add(m); m.updateMatrixWorld(true); return g; }
  const BT = { spring: T2('봄 꾸러미', 'Spring bundle'), summer: T2('여름 꾸러미', 'Summer bundle'), autumn: T2('가을 꾸러미', 'Autumn bundle'), winter: T2('겨울 꾸러미', 'Winter bundle'), garden: T2('텃밭 꾸러미', 'Garden bundle'), forest: T2('숲 꾸러미', 'Forest bundle'), cook: T2('요리 꾸러미', 'Cooking bundle') };
  const bunT = id => BT[id] || T2('꾸러미', 'Bundle');
  function build(id) { drop(id); const C = CHG[id], pl = placeOf(id); if (!C || !pl) return null; const gs = [];
    for (const o of pl.pts) { const g = A.buildParts(put => parts(C.kind, put)); gs.push(addG(g, o.x, o.z, o.ry, o.y));
      if (C.kind === 'lamp') { const dayG = A.buildParts(put => put('b', 0, 2.47, 0, 0.3, 0.32, 0.3, 0xe8e2c8)), nightG = A.buildParts(put => put('b', 0, 2.47, 0, 0.3, 0.32, 0.3, 0xffe2a0, 1));   /* 등 유리: 낮 = 우윳빛 · 밤 = 빛나는 부품(MeshBasic) */
        const nt = !!A.night(); dayG.visible = !nt; nightG.visible = nt; gs.push(addG(dayG, o.x, o.z, o.ry, o.y), addG(nightG, o.x, o.z, o.ry, o.y)); LAMPS.push([dayG, nightG]); } }
    if (pl.sign) { gs.push(standSign(pl.sign, id)); const s = pl.sign; hot(id, s.x + Math.sin(s.ry) * 1.1, s.z + Math.cos(s.ry) * 1.1, '📋 ' + (en() ? 'Read the board: ' : '판 읽기 — ') + L(C.thing).replace(/^a /, ''), () => readSign(id)); }
    VIS[id] = gs; log('build ' + id + ' @' + pl.at + ' n' + pl.pts.length); return gs; }
  const hot = (id, x, z, label, use) => { if (HOT[id]) HOT[id].remove(); HOT[id] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: 1.4, label, use }); };
  function drop(id) { const v = VIS[id]; if (v) { for (const g of v) { map.remove(g); g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); } } }); } LAMPS = LAMPS.filter(q => !v.includes(q[0])); delete VIS[id]; } if (HOT[id]) { HOT[id].remove(); delete HOT[id]; } }

  // ───────── 글 ─────────
  const pw = id => { const pl = placeOf(id); return pl ? PLACE_W[pl.at] : null; };
  /* 자리 + 물건 + 조사: '정자 앞에 꽃밭이' */
  function phr(id, j1, j2, e) { const C = CHG[id], p = pw(id); if (!p) return null; if (e) return [C.thing[1], p[1]]; const th = C.thing[0]; return p[0] + '에 ' + th + jo(th, j1, j2); }
  function didLine(id, e) { const C = CHG[id], p = pw(id); if (!p) return ''; return e ? 'The townspeople ' + C.v[1] + ' ' + C.thing[1] + ' ' + p[1] + '.' : '마을 사람들이 ' + phr(id, '을', '를') + ' ' + C.v[0]; }
  function readSign(id) { const C = CHG[id], e = en(); A.dialog({ who: e ? 'Town board' : '마을 알림판', icon: '📋', text: [(e ? 'With the ' + bunT(id)[1].toLowerCase() + ' you filled, ' : '네가 채운 ' + bunT(id)[0] + jo(bunT(id)[0], '으로', '로') + ' ') + (e ? didLine(id, 1).charAt(0).toLowerCase() + didLine(id, 1).slice(1) : didLine(id, 0) + '.'), L(C.fact)] }); A.sfx('tick'); log('read ' + id); }
  /* 꾸러미 창 한 줄 */
  function hint(id) { if (!CHG[id]) return ''; const s = st(), e = en(), C = CHG[id]; if (!pw(id)) return ''; const p = pw(id);
    if (s.on[id] != null) return C.ic + ' ' + (e ? 'Now in town: ' + C.thing[1] + ' ' + p[1] + '. Tap to go' : phr(id, '이', '가') + ' 생겼어요. 눌러서 가 보기');
    if (s.q[id] != null) return C.ic + ' ' + (e ? 'Tomorrow morning: ' + C.thing[1] + ' ' + p[1] : '내일 아침 ' + phr(id, '이', '가') + ' 생겨요');
    return C.ic + ' ' + (e ? 'Fill it for ' + C.thing[1] + ' ' + p[1] : '채우면 ' + phr(id, '이', '가') + ' 생겨요'); }
  function where(id) { const pl = placeOf(id), C = CHG[id]; if (!pl) return null; const o = pl.sign || pl.pts[0]; return { icon: C.ic, name: L(C.thing).replace(/^a /, ''), door: [o.x, o.z] }; }
  function go(id) { const p = where(id); if (p) A.route(p); return !!p; }

  // ───────── 꾸러미가 다 참(town.js openBundles가 부름) ─────────
  function filled(id) { if (!CHG[id]) return ''; const s = st(); if (s.q[id] == null && s.on[id] == null) { s.q[id] = day(); mark(); A.rec('bun2', { ev: 'fill', id }); log('fill ' + id); } return pw(id) ? (en() ? 'Tomorrow morning: ' + CHG[id].thing[1] + ' ' + pw(id)[1] : '내일 아침 ' + phr(id, '이', '가') + ' 생겨요') : ''; }

  // ───────── 1초 칸 ─────────
  function boot() { BOOT = true; const s = st(), d = day(); let n = 0; try { for (const r of A.book() || []) if (r.done && CHG[r.B.id] && s.q[r.B.id] == null && s.on[r.B.id] == null) { s.on[r.B.id] = d; s.told[r.B.id] = 1; n++; } } catch (x) { /* 꾸러미 책 없음 */ }   /* 이 기능 전에 다 채운 꾸러미 = 조용히 바로 */
    if (n) mark(); log('boot legacy ' + n); }
  function sec() { if (dead || !A.on()) return; const s = st(), d = day(), t = performance.now(); if (!BOOT) boot(); if (d !== dayK) { dayK = d; dayT = t; }
    for (const id of keys(s.q)) if (s.on[id] == null && (s.q[id] | 0) < d) { s.on[id] = d; mark(); A.rec('bun2', { ev: 'on', id }); log('on ' + id + ' d' + d); }
    for (const id of keys(s.on)) if (!VIS[id] && !TRY[id]) { TRY[id] = 1; build(id); }
    if (t - dayT > 15000 && t - tellT > 6500 && !A.busy() && !A.panel()) for (const id of keys(s.on)) { if (s.told[id] || s.on[id] !== d || !VIS[id]) continue; s.told[id] = 1; tellT = t; mark();   /* 여럿이면 6.5초마다 하나씩(배너가 서로 덮지 않게) */ const C = CHG[id], e = en();
      A.banner(C.ic + ' ' + (e ? didLine(id, 1) + ' (' + bunT(id)[1] + ')' : didLine(id, 0) + '(' + bunT(id)[0] + ')'), 4.2); A.sfx('done'); if (A.diary) A.diary(C.ic + ' ' + (e ? didLine(id, 1) : didLine(id, 0) + '.'));
      chipK = id; A.chip('twn-bun2', C.ic + ' ' + (e ? 'Go and see' : '보러 가기'), { onClick: () => { A.chip('twn-bun2', null); chipK = ''; go(id); } }); setTimeout(() => { if (chipK === id && !dead) { A.chip('twn-bun2', null); chipK = ''; } }, 90000); log('tell ' + id); break; }
    if (LAMPS.length) { const nt = !!A.night(); if (nt !== litOn) { litOn = nt; for (const [a, b] of LAMPS) { a.visible = !nt; b.visible = nt; } } }
    if (t - tlT > 3000) { tlT = t; const k9 = readyKeys().join(','); if (k9 !== tlK) { tlK = k9; if (A.relabel) A.relabel(); } } }

  // ───────── 아침 소식 · 하루 마무리 · 나의 길 ─────────
  function news(d) { const s = st(), o = []; for (const id of keys(s.q)) { if ((s.q[id] | 0) !== d - 1 || !pw(id)) continue; const C = CHG[id], pl = placeOf(id), at = pl ? [(pl.sign || pl.pts[0]).x, (pl.sign || pl.pts[0]).z] : null;
      o.push({ k: 'bun:' + id, t: [C.ic + ' 어제 채운 ' + bunT(id)[0] + jo(bunT(id)[0], '으로', '로') + ' ' + didLine(id, 0), C.ic + ' With the ' + bunT(id)[1].toLowerCase() + ' you filled yesterday, ' + didLine(id, 1).charAt(0).toLowerCase() + didLine(id, 1).slice(1)], at }); } return o; }
  function dayRow(d) { const s = st(), e = en(), L9 = [];
    for (const id of keys(s.on)) if (s.on[id] === d && s.q[id] != null && pw(id)) L9.push(CHG[id].ic + ' ' + (e ? didLine(id, 1) : didLine(id, 0)));
    for (const id of keys(s.q)) if (s.q[id] === d && s.on[id] == null && pw(id)) L9.push(CHG[id].ic + ' ' + (e ? bunT(id)[1] + ' filled. Tomorrow morning: ' + CHG[id].thing[1] + ' ' + pw(id)[1] : bunT(id)[0] + jo(bunT(id)[0], '을', '를') + ' 채웠어요. 내일 아침 ' + phr(id, '이', '가') + ' 생겨요'));
    if (!L9.length) return null; return ['bun2', '🧺', e ? 'Town changes' : '마을이 바뀜', esc(L9.join(e ? ' · ' : '. '))]; }
  function dayWait(d0, pre) { if (!pre) return null; const s = st(); for (const id of keys(s.q)) { if (s.q[id] !== d0 || s.on[id] != null || !pw(id)) continue; const C = CHG[id], p = where(id);
      return { ic: C.ic, s: T2(C.thing[0], C.thing[1]), t: T2('내일 아침 ' + phr(id, '이', '가') + ' 생겨요', 'Tomorrow morning: ' + C.thing[1] + ' ' + pw(id)[1]), p: p ? { ...p } : null }; } return null; }

  // ───────── 🤝 이웃 사연 ─────────
  const hkOf = w => { const r = w && A.repOf ? A.repOf(w) : w; return r && r.hk ? r.hk : ''; };
  function ready(w) { if (!w || !w.k || !TALES[w.k]) return false; const hk = hkOf(w); if (!hk || st().tale[w.k]) return false; return (A.hearts(hk) | 0) >= TALE_LV; }
  function readyKeys() { const o = new Set(); try { for (const w of A.workers() || []) if (w && w.rep && ready(w)) o.add(w.k); } catch (x) { /* 일꾼 없음 */ } return [...o].sort(); }
  const label = w => '💬 ' + (en() ? 'Listen to the ' + A.who(w) + '’s story' : A.who(w) + ' 이야기 듣기');
  async function tellTale(w) { if (telling || !ready(w)) return false; telling = true; const k = w.k, hk = hkOf(w), e = en(), P = A.playk ? A.playk(k) : null, who = A.who(w);
    try { await A.dialog({ who, icon: P ? P[0] : '🙂', cap: e ? 'A neighbour’s story' : '이웃 사연', text: TALES[k].map(q => q[e ? 1 : 0]) }); } catch (x) { /* 대화 창 없음 */ }
    const s = st(); if (!s.tale[k]) { s.tale[k] = { d: day(), hk }; mark(); if (A.skUp) A.skUp('look', 2, 'tale:' + k); A.rec('bun2', { ev: 'tale', k }); if (A.diary) A.diary('💬 ' + (e ? 'Heard the story of the ' + who : who + '에게 사연을 들었어요')); A.say('💬 ' + (e ? 'Saved in the notebook under My paths' : '수첩 🛤 나의 길 이웃 줄에 적어 두었어요'), 3); if (A.relabel) A.relabel(); tlK = readyKeys().join(','); log('tale ' + k); }
    telling = false; return true; }
  /* E가 불림: 들려줄 사연이 있으면 사연(그 E는 여기서 끝) · 없으면 false(원래 E 그대로) */
  function tale(w) { if (!ready(w) || telling) return false; tellTale(w); return true; }
  function tales() { const s = st(), o = []; for (const k of keys(s.tale)) if (TALES[k]) { const w = (A.workers() || []).find(q => q && q.k === k && q.rep && hkOf(q) === s.tale[k].hk) || (A.workers() || []).find(q => q && q.k === k); o.push({ k, ic: A.playk && A.playk(k) ? A.playk(k)[0] : '💬', who: w ? A.who(w) : k, d: s.tale[k].d }); } return o.sort((a, b) => a.d - b.d); }
  async function retell(k) { const t = tales().find(q => q.k === k); if (!t) return false; const e = en(); await A.dialog({ who: t.who, icon: t.ic, cap: e ? 'A neighbour’s story' : '이웃 사연', text: TALES[k].map(q => q[e ? 1 : 0]) }); return true; }

  function dispose() { dead = true; for (const id of keys(VIS)) drop(id); for (const id of keys(HOT)) HOT[id].remove(); HOT = {}; LAMPS = []; A.chip('twn-bun2', null); }
  function rebuild() { for (const id of keys(VIS)) drop(id); AT = {}; TRY = {}; LAMPS = []; litOn = null; }
  return { sec, filled, hint, go, where, news, dayRow, dayWait, tale, ready, label, tales, retell, dispose, rebuild, readSign,
    info: () => { const s = st(); return { q: { ...s.q }, on: { ...s.on }, told: { ...s.told }, tale: { ...s.tale }, vis: keys(VIS), live: Object.fromEntries(keys(VIS).map(id => [id, VIS[id].length && VIS[id].every(g => !!g.parent)])), hot: keys(HOT), lamps: LAMPS.length, lit: litOn, at: Object.fromEntries(keys(AT).map(id => [id, AT[id] ? { at: AT[id].at, pts: AT[id].pts.map(o => [+o.x.toFixed(2), +o.z.toFixed(2), +o.ry.toFixed(3)]), sign: AT[id].sign ? [+AT[id].sign.x.toFixed(2), +AT[id].sign.z.toFixed(2), +AT[id].sign.ry.toFixed(3)] : null } : null])), ready: readyKeys(), chip: chipK }; },
    place: id => placeOf(id), near: (x, z, r) => nearMine(x, z, r), dbg: () => DBG.slice() };
}
