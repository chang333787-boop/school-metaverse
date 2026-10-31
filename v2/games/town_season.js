// 🗓 계절 행사(SEASON-1 · 정본 docs/systems/town_season.md) — 행사 한 줄 = 행사 하나(EV 표)
//   게임 달력(한 계절 = 7일 · town_game.js CAL_LEN)의 그 날에만 마을 행사 마당·이웃 집 앞 모습과 할 거리가 바뀜
//   날짜 = 실제 풍습 날(음력·절기)을 그 계절 석 달 안 자리로 옮겨 7일 칸에 맞춤(문서 §2) · 잔치 날(town_feast.js fd)과 겹치면 하루 비킴 · 태풍 날이면 다음 날
//   할 거리 = E 한 번에 끝나지 않음 · 세상에서 본 것(사람 머리색·앉은 자리 · 다발 끈 색 · 떡 무늬 · 마당 차례 · 문 앞 김치통 · 하늘의 달)으로 판단 · 틀려도 벌 X(그 자리 이웃이 까닭 한 줄)
//   잇는 체계: 판 놀이 윷(town_table.js) · 잔치 준비 갈래(REC 'season' → town_feast.js srcOf) · 하루 일기 · 아침 소식 · 날씨 창 달력 줄
//   지킴: 실제 풍습만(지어내기 X · 종교 강요 X) · 판타지·전투 X(씨름 = 구경·응원만) · 실명 X(이웃 = 하는 일·어르신) · 지역 비하 X · 숫자·% X · 새 Light X(달집 불·달 = MeshBasic)
//     · 매 프레임 일 0(1초 칸 sec) · 저절로 뜨는 알림 = say(t, s, 1) · 사람 수 그대로(있는 일꾼을 옮기고 옷만 바꿈) · 홍보판 X(A.on())
//   저장 GAME.S.season = { v, d 그날, id 그날 행사, st 그날 한 것, mv { '행사:본래 날': 1 } 태풍으로 미룸, ann 알림 날, past [{ id, d, ok }] }
import { nightsW } from './town_feast.js?v=5';
export const SEASON_V = 1;
const T2 = (ko, en) => [ko, en];
const FONT = '"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif';
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
const DIR8 = [T2('북', 'north'), T2('북동', 'north-east'), T2('동', 'east'), T2('남동', 'south-east'), T2('남', 'south'), T2('남서', 'south-west'), T2('서', 'west'), T2('북서', 'north-west')];
const dir8 = (dx, dz) => DIR8[Math.round(((Math.atan2(dx, -dz) * 57.29578 + 360) % 360) / 45) % 8];   /* 0 = 북(−z) · 동 = +x */
const HB = { top: [0xf6e27a, 0xf2a7b8, 0x9fd6a8], bot: [0xc8423a, 0x2f5fa8], old: [0xf4f0e6, 0x2f5fa8, 3] };   /* 한복(저고리 · 치마·바지) · 어르신 = 흰 저고리 + 남색 + 흰머리(머리색 칸 3) */
const hb = i => [HB.top[i % 3], HB.bot[(i >> 1) % 2]];

// ───────── 행사 표(한 줄 = 행사 하나) — sea·k = 게임 달력 자리(그 계절 k번째 날) · b = 잔치 준비 갈래 · real = 실제 날 ─────────
export const EV = {
  chu: { ic: '🌕', sea: 'autumn', k: 2, b: 'food', real: T2('음력 8월 15일(양력 9월 중순~10월 초)', 'Lunar 8/15 (mid Sep to early Oct)'), t: T2('추석', 'Chuseok'),
    fact: T2('추석은 한 해 농사를 고마워하는 날이에요. 햇곡식으로 송편을 빚고, 조상의 산소에 인사하러 가요. 밤에는 둥근 보름달 아래에서 손을 잡고 강강술래를 했어요.', 'Chuseok gives thanks for the harvest. Families make songpyeon from new rice and visit ancestors’ graves. At night people held hands and danced ganggangsullae under the full moon.'),
    todo: [T2('송편 빚기 — 이웃마다 맞는 소 고르기', 'Make songpyeon — pick the right filling for each neighbour'), T2('성묘길 챙기기 — 산에 갈 때 챙길 것 고르기', 'Grave-visit trip — choose what to take to the hills'), T2('밤: 보름달 아래 강강술래 구경', 'Night: watch ganggangsullae under the full moon')],
    lines: [T2('올해 햅쌀로 반죽했어. 송편 소는 사람마다 좋아하는 게 달라.', 'The dough is from this year’s new rice. Everyone likes a different filling.'), T2('성묘 가는 산길은 마른 풀이 많아. 불씨 하나도 조심해야 해.', 'The hill path to the graves is full of dry grass. Even one spark is dangerous.'), T2('오늘 밤엔 달이 아주 둥글 거야.', 'The moon will be perfectly round tonight.')] },
  kim: { ic: '🥬', sea: 'autumn', k: 6, b: 'food', real: T2('입동 무렵(양력 11월 중순~하순)', 'Around Ipdong (mid to late Nov)'), t: T2('김장', 'Gimjang (kimchi making)'),
    fact: T2('김장은 추운 겨울을 나려고 늦가을에 김치를 한꺼번에 많이 담그는 일이에요. 이웃이 모여 품앗이로 함께 담그고, 담근 김치를 나눴어요.', 'Gimjang is making lots of kimchi in late autumn to last the cold winter. Neighbours gather to help each other and share the kimchi.'),
    todo: [T2('배추 절이기 차례 — 마당에 놓인 차례를 보고 고르기', 'Salting order — read the stations in the yard'), T2('김치 나누기 — 김장을 못 한 이웃 집에 한 통씩', 'Share kimchi — one tub to each home that could not make any')],
    lines: [T2('배추는 추위에 강해서 늦가을이 제일 맛있어.', 'Cabbage stands the cold, so it tastes best in late autumn.'), T2('혼자 하면 사흘, 같이 하면 하루야. 이게 품앗이지.', 'Alone it takes three days, together just one. That is pumasi.'), T2('다 담그면 못 한 집에 한 통씩 나눠 드리자.', 'When we finish, let’s take a tub to homes that could not make any.')] },
  seol: { ic: '🙇', sea: 'winter', k: 5, b: 'guest', real: T2('음력 1월 1일(양력 1월 하순~2월 중순)', 'Lunar 1/1 (late Jan to mid Feb)'), t: T2('설날', 'Seollal (Lunar New Year)'),
    fact: T2('설날엔 한복을 차려입고 웃어른께 세배를 드려요. 어른은 덕담을 해 주고, 떡국 한 그릇을 먹으면 나이를 한 살 더 먹는다고 했어요.', 'On Seollal people wear hanbok and bow to their elders (sebae). Elders give kind words, and a bowl of tteokguk means you are a year older.'),
    todo: [T2('세배 — 이웃 세 집 앞, 웃어른께 먼저', 'Sebae — three homes, elders first'), T2('떡국 먹기', 'Eat tteokguk'), T2('윷놀이 한 판', 'A game of yut')],
    lines: [T2('새해 첫날이라 다들 한복을 입었네.', 'It is the first day of the year, so everyone is in hanbok.'), T2('세배는 웃어른께 먼저 드리는 거란다.', 'You bow to the eldest first.'), T2('윷놀이 판 깔아 뒀어. 한 판 하고 가.', 'The yut mat is out. Play a round before you go.')] },
  bor: { ic: '🌰', sea: 'winter', k: 6, b: 'safe', real: T2('음력 1월 15일(설날 보름 뒤)', 'Lunar 1/15 (a fortnight after Seollal)'), t: T2('정월 대보름', 'Jeongwol Daeboreum'),
    fact: T2('정월 대보름은 새해 첫 보름달이 뜨는 날이에요. 아침엔 부럼을 깨물어 한 해 건강을 빌고, 저녁엔 달맞이를 하며 달집을 태워 소원을 빌었어요.', 'Daeboreum is the first full moon of the year. In the morning people crack nuts (bureom) for good health; in the evening they greet the moon and burn a dalijip to make wishes.'),
    todo: [T2('부럼 깨기', 'Crack bureom nuts'), T2('달맞이 — 보름달이 뜨는 쪽 맞히기', 'Moon greeting — which way does the full moon rise?'), T2('달집 태우기 — 안전 줄 밖에서', 'Burning the dalijip — from behind the safety line')],
    lines: [T2('달집은 해 지고 달이 뜨면 태워. 그 전엔 가까이 가도 돼.', 'We burn the dalijip once the moon is up. Until then you can go near it.'), T2('불이 붙으면 안전 줄 밖에서만 봐요. 소방관이 곁에 있을게요.', 'Once it is lit, watch only from behind the safety line. A firefighter will stay close.'), T2('부럼은 이로 딱 깨물어야 해.', 'You crack bureom with your teeth.')] },
  dano: { ic: '🌿', sea: 'summer', k: 2, b: 'show', real: T2('음력 5월 5일(양력 6월 초~중순)', 'Lunar 5/5 (early to mid June)'), t: T2('단오', 'Dano'),
    fact: T2('단오는 여름이 시작될 무렵의 명절이에요. 창포를 삶은 물에 머리를 감고, 높은 그네를 뛰고, 씨름을 하고, 수리취떡을 나눠 먹었어요. 수릿날이라고도 해요.', 'Dano comes at the start of summer. People washed their hair in iris water, rode tall swings, held ssireum wrestling and shared surichwi rice cakes. It is also called Surinal.'),
    todo: [T2('창포 다발 고르기', 'Find the iris (changpo) bundle'), T2('수리취떡 무늬 보기', 'Look at the rice-cake pattern'), T2('씨름 구경하며 응원하기', 'Watch and cheer the ssireum')],
    lines: [T2('창포물에 머리를 감으면 머릿결이 좋아진다고 했어.', 'They said washing in iris water makes hair shine.'), T2('씨름판 모래 안은 선수만 들어가. 우리는 밖에서 응원하자.', 'Only wrestlers go inside the sand ring. We cheer from outside.'), T2('그네 줄을 새로 맸어. 아주 높이 올라가.', 'The swing ropes are new. It goes really high.')] },
};
export const EV_ORDER = ['chu', 'kim', 'seol', 'bor', 'dano'];

// 판단 거리(실제 풍습·안전 수칙만)
const FILL = { sesame: T2('깨 소', 'sesame filling'), bean: T2('콩 소', 'bean filling'), chest: T2('밤 소', 'chestnut filling') };
const WANT = [   /* 송편 소 — 깨 소 = 깨에 꿀·설탕(달다) · 콩 소 = 삶은 콩(담백) · 밤 소 = 삶은 밤(포슬포슬) */
  { t: T2('나는 깨를 먹으면 몸이 가려워. 깨 말고 다른 걸로 부탁해.', 'Sesame makes me itchy. Anything but sesame, please.'), ok: ['bean', 'chest'], why: T2('깨 소에는 깨가 들어가요.', 'Sesame filling is made of sesame.') },
  { t: T2('나는 달콤한 송편이 좋아.', 'I like sweet songpyeon.'), ok: ['sesame'], why: T2('달콤한 건 깨에 꿀을 섞은 깨 소예요. 콩 소와 밤 소는 덜 달아요.', 'The sweet one is sesame mixed with honey. Bean and chestnut are less sweet.') },
  { t: T2('나는 단 건 조금 줄이고 싶어.', 'I want to cut down on sweet things.'), ok: ['bean', 'chest'], why: T2('깨 소엔 꿀이나 설탕을 섞어 달아요.', 'Sesame filling is mixed with honey or sugar, so it is sweet.') },
  { t: T2('포슬포슬하고 고소한 게 좋아. 가을 산에서 줍는 거.', 'I like something soft and crumbly, the kind you pick up on autumn hills.'), ok: ['chest'], why: T2('가을 산에서 줍는 포슬포슬한 건 밤이에요.', 'The crumbly thing from autumn hills is the chestnut.') },
  { t: T2('나는 콩을 못 먹어. 콩은 빼 줘.', 'I can’t eat beans. No beans, please.'), ok: ['sesame', 'chest'], why: T2('콩 소에는 콩이 들어가요.', 'Bean filling is made of beans.') }];
const PACK = [   /* 성묘길(산림청 성묘철 산불·벌 쏘임 주의) */
  ['sleeve', T2('긴소매 옷', 'Long sleeves'), 1, T2('좋아요. 풀숲에서 벌레와 풀잎에 덜 긁혀요.', 'Good. Long sleeves protect you from bugs and sharp grass.')],
  ['water', T2('물병', 'A water bottle'), 1, T2('좋아요. 산길은 생각보다 오래 걸어요.', 'Good. The hill path is longer than it looks.')],
  ['lighter', T2('라이터', 'A lighter'), 0, T2('산에서는 불씨 하나로 산불이 날 수 있어요. 라이터는 두고 가요.', 'One spark can start a forest fire. Leave the lighter at home.')],
  ['perfume', T2('진한 향수', 'Strong perfume'), 0, T2('진한 냄새에 벌이 모여들 수 있어요. 성묘철엔 벌을 조심해요.', 'Strong smells can draw bees. Watch out for bees on grave visits.')]];
const KIMS = [   /* 김장 차례(마당 왼쪽 → 오른쪽 자리와 같음) */
  [T2('배추를 반으로 가르기', 'Cut the cabbages in half'), T2('통배추에는 소금이 속까지 안 배요. 먼저 갈라요.', 'Salt can’t reach inside a whole cabbage. Cut it first.')],
  [T2('잎 사이사이 소금을 뿌려 절이기', 'Salt between the leaves'), T2('아직 안 절였어요. 소금을 먼저 뿌려요.', 'It isn’t salted yet. Salt it first.')],
  [T2('하룻밤 두며 뒤집어 주기', 'Leave overnight and turn them'), T2('소금이 고루 배려면 하룻밤 두고 뒤집어야 해요.', 'To salt evenly, it must sit overnight and be turned.')],
  [T2('맑은 물에 씻어 물 빼기', 'Rinse and drain'), T2('짠 소금물을 먼저 씻어 내야 해요.', 'Rinse off the salty water first.')],
  [T2('양념 속을 넣어 통에 담기', 'Add the seasoning and pack the tubs'), T2('물이 덜 빠지면 양념이 싱거워져요. 씻고 물부터 빼요.', 'If it isn’t drained, the seasoning goes watery. Rinse and drain first.')]];

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · ready() · lang() · esc · openP(h, w, k) · closeP() · panel() · busy() · storm() · stormNote(t) 태풍 날 창 한 줄 · say(t, s, lv) · sfx(k) · banner(t, s) · chip(k, t, o) · route(p) · dialog(o)
//   rec(k, o) · buildParts(fn) · gy(x, z) · collider(o) · season(d) 달력 계절 | null(달력 끔) · calDay(d) 1~7 · feastDay() · me() · site() 행사 마당 { x, z, ry } | null · houses(x, z, n) [{ door, fw }]
//   gather(L [{ x, z, ry, act, dr }] | null) → 자리마다 모인 일꾼 번호(−1 = 못 구함) · act(slot, a) 몸짓 바꾸기 · bubbleW(slot, t) · table(g) 판 놀이 창 · diary(e, t)
export function createSeason(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, min = () => G().min | 0, mark = () => A.GAME.mark();
  const S = () => { const g = G(); let s = g.season; if (!s || typeof s !== 'object' || s.v !== SEASON_V) s = g.season = { v: SEASON_V, d: -1, id: null, st: {}, mv: {}, ann: -1, past: [] };
    if (!s.st || typeof s.st !== 'object') s.st = {}; if (!s.mv || typeof s.mv !== 'object') s.mv = {}; if (!Array.isArray(s.past)) s.past = []; return s; };
  let dead = false, SITE = null, VIS = {}, HOT = {}, HOTL = {}, HOTF = {}, HS = [], GK = '', SLOT = [], MOON = null, FLAME = null, chipT = 0, metD = -1, metT = 0, boutT = 0, KEY = '', TQ = []; const DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const rnd = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); return ((h >>>= 0) % 100000) / 100000; }; };
  const shuf = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };
  /* 시험은 TQ에 답을 넣어 두면 창 대신 그 답(창 글·고르기 줄은 그대로 만듦) */
  const ask = o => (TQ.length ? Promise.resolve(TQ.shift()) : A.dialog(o));

  // ───────── 날짜(게임 달력 → 그날 행사) ─────────
  const baseId = d => { const s9 = A.season(d); if (!s9 || s9 === 'now') return null; const k = A.calDay(d); for (const id of EV_ORDER) if (EV[id].sea === s9 && EV[id].k === k) return id; return null; };
  /* 잔치 날과 겹치면 하루 뒤(뒷날도 행사면 하루 앞) · 태풍으로 미룬 것 = 하루 뒤 */
  const target = (id, bd) => { const fd = A.feastDay ? A.feastDay() | 0 : 0; if (fd === bd) return baseId(bd + 1) ? bd - 1 : bd + 1; if (S().mv[id + ':' + bd]) return bd + 1; return bd; };
  function rawOn(d) { for (const bd of [d - 1, d, d + 1]) { const id = baseId(bd); if (id && target(id, bd) === d) return id; } return null; }
  const idOn = d => { const s = S(); return s.d === d ? s.id : rawOn(d); };   /* 그날 시작한 행사는 그날 끝까지(잔치 날이 나중에 옮겨 와도) */
  const dayOf = (id, from) => { for (let d = from; d < from + 60; d++) if (rawOn(d) === id) return d; return -1; };
  const cur = () => { const s = S(); return s.d === day() ? s.id : null; };
  const on = () => !!cur();
  const st = () => S().st;

  // ───────── 행사 마당(학교·잔치 마당과 떨어진 평평한 빈 땅) ─────────
  function site() { if (SITE !== null) return SITE || null; const sp = A.site ? A.site() : null; if (!sp) { SITE = false; log('site X'); return null; } const ry = sp.ry, cs = Math.cos(ry), sn = Math.sin(ry);
    SITE = { x: sp.x, z: sp.z, ry, Q: (lx, lz) => [sp.x + lx * cs + lz * sn, sp.z - lx * sn + lz * cs] }; log('site ' + sp.x.toFixed(1) + ',' + sp.z.toFixed(1)); return SITE; }
  const toYard = () => { const P = site(); if (!P) return null; const [x, z] = P.Q(0, 8.5); const E9 = EV[cur()]; return { icon: E9 ? E9.ic : '🗓', name: (E9 ? L(E9.t) + ' ' : '') + (en() ? 'yard' : '마당'), door: [x, z] }; };

  // ───────── 짓기(물건 하나 = 제 땅 높이 · 큰 것만 충돌) ─────────
  function drop(id) { const v = VIS[id]; if (!v) return; for (const g of v.g) { map.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.userData.own && o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); } for (const c of v.C) c.remove(); delete VIS[id]; }
  function pieceAt(v, x, z, ry, fn) { const g = A.buildParts(fn); g.position.set(x, A.gy(x, z), z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); v.g.push(g); return g; }
  function piece(v, lx, lz, fn, ry) { const P = site(), [x, z] = P.Q(lx, lz); return pieceAt(v, x, z, P.ry + (ry || 0), fn); }
  function col(v, lx, lz, hx, hz, h) { const P = site(), [x, z] = P.Q(lx, lz), q = Math.abs(Math.sin(P.ry)) > 0.5, ax = q ? hz : hx, az = q ? hx : hz, y = A.gy(x, z); v.C.push(A.collider({ x0: x - ax, x1: x + ax, z0: z - az, z1: z + az, y0: y - 1, y1: y + h, nc: true })); }
  function board(v, lx, lz, w, h, draw) { const g = piece(v, lx, lz, p => { for (const s9 of [-1, 1]) p('b', s9 * (w / 2 + 0.03), 0, -0.04, 0.09, 0.8 + h + 0.08, 0.09, 0x6b4a2f); p('b', 0, 0.74, -0.07, w + 0.14, h + 0.14, 0.05, 0x7a5232); });
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: tx })); m.userData.own = 1; m.position.set(0, 0.8 + h / 2 + 0.01, -0.035); g.add(m); m.updateMatrixWorld(true); draw(c.getContext('2d'), c.width, c.height); tx.needsUpdate = true; col(v, lx, lz, w / 2 + 0.1, 0.12, 0.8 + h); }
  const fitT = (g, t, w) => { let s = String(t); if (g.measureText(s).width <= w) return s; while (s.length > 2 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };
  const paper = (id, sub) => (g, W, H) => { g.fillStyle = '#7a3b2a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(12, 12, W - 24, H - 24); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + Math.round(H * 0.3) + 'px ' + FONT; g.fillText(fitT(g, L(EV[id].t), W - 50), W / 2, H * 0.38); g.font = '800 ' + Math.round(H * 0.15) + 'px ' + FONT; g.fillStyle = '#5a4a3a'; g.fillText(fitT(g, L(sub), W - 50), W / 2, H * 0.72); };
  const table = (p, x, z, w, d, hex) => { for (const [a, b] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]]) p('b', x + a, 0, z + b, 0.07, 0.4, 0.07, 0x5a3e28); p('b', x, 0.4, z, w, 0.05, d, hex || 0x9b6a3c); };   /* 낮은 상(앉아서 먹는 높이) */
  const mat = (p, x, z, w, d) => { p('b', x, 0, z, w, 0.03, d, 0xd9c27a); for (let i = 0; i < 6; i++) p('b', x, 0.03, z - d / 2 + (i + 0.5) * d / 6, w - 0.04, 0.004, 0.04, 0xa88a3a); };   /* 멍석·돗자리 */
  const basin = (p, x, z, r, hex, inner) => { p('c', x, 0, z, r, 0.32, 0, hex); p('c', x, 0.3, z, r * 0.9, 0.03, 0, inner); };
  const cabbage = (p, x, y, z, s) => { p('s', x, y + s * 0.8, z, s * 0.75, 1.15, 0, 0x6fb34f); p('s', x, y + s * 0.95, z, s * 0.5, 1.1, 0, 0xc8e69a); };
  const half = (p, x, y, z, s, ry) => { p('b', x, y, z, s * 1.3, s * 0.55, s * 0.6, 0xe8f0c0, 0, ry); p('b', x, y + s * 0.55, z, s * 1.3, 0.02, s * 0.6, 0x7fbf4f, 0, ry); };
  const tub = (p, x, y, z, red) => { p('b', x, y, z, 0.42, 0.34, 0.3, red ? 0xc8423a : 0xe8e4da); p('b', x, y + 0.34, z, 0.44, 0.05, 0.32, 0x2f6fd0); };   /* 김치통(빨간 속이 보이는 반투명 통 대신 색으로) */

  function buildYard(id) { const P = site(); if (!P) return; const v = VIS.yard = { g: [], C: [] }, R = rnd('ssn:' + id + ':' + day());
    if (id === 'seol') { board(v, 0, 6.2, 2.2, 1.1, paper(id, T2('웃어른께 먼저 세배를 드려요', 'Bow to the eldest first')));
      piece(v, -3.6, 0, p => { mat(p, 0, 0, 3.0, 3.0); for (let i = 0; i < 20; i++) { const s9 = (i % 5) / 5, sd = (i / 5) | 0, [a, b] = sd === 0 ? [-1 + 2 * s9, -1] : sd === 1 ? [1, -1 + 2 * s9] : sd === 2 ? [1 - 2 * s9, 1] : [-1, 1 - 2 * s9]; p('c', a * 1.1, 0.035, b * 1.1, 0.08, 0.01, 0, 0x2b2420); }
        for (const t of [-0.66, -0.33, 0.33, 0.66]) { p('c', t * 1.1, 0.035, t * 1.1, 0.07, 0.01, 0, 0x2b2420); p('c', t * 1.1, 0.035, -t * 1.1, 0.07, 0.01, 0, 0x2b2420); } p('c', 0, 0.035, 0, 0.11, 0.01, 0, 0xc8423a);
        for (let i = 0; i < 4; i++) p('b', 1.75, 0.03, -0.45 + i * 0.3, 0.52, 0.05, 0.1, i % 2 ? 0xe9c98a : 0xc9a25a); });   /* 멍석 윷판(말판 점 · 가운데 빨간 점) · 윷가락 넷 */
      piece(v, 3.6, 0, p => { table(p, 0, 0, 1.6, 1.0, 0x8a3a2c); for (let i = 0; i < 6; i++) { const a = (i % 3 - 1) * 0.45, b = (i < 3 ? -0.22 : 0.22); p('c', a, 0.45, b, 0.15, 0.08, 0, 0xf6f4ee); p('c', a, 0.53, b, 0.12, 0.01, 0, 0xfbf7ec); p('c', a + 0.03, 0.54, b, 0.04, 0.008, 0, 0xe9b04a); } }); col(v, 3.6, 0, 0.85, 0.55, 0.5); }   /* 떡국 상(흰 떡 · 노란 지단) */
    else if (id === 'bor') { board(v, 0, 6.2, 2.2, 1.1, paper(id, T2('달맞이 · 부럼 · 달집', 'Moon · nuts · dalijip')));
      piece(v, 0, -3.2, p => { p('c', 0, 0, 0, 1.9, 0.3, 0, 0x7a5a3a); p('k', 0, 0.2, 0, 1.8, 4.6, 0, 0x4f6b3a); p('k', 0, 0.2, 0, 1.6, 4.9, 0, 0xc9a25a, 0, 0.4); p('c', 0, 1.6, 0, 1.25, 0.12, 0, 0x8a6a3a); p('c', 0, 3.0, 0, 0.65, 0.1, 0, 0x8a6a3a); p('c', 0, 4.8, 0, 0.05, 1.0, 0, 0x6b4a2f); p('b', 0.24, 5.55, 0, 0.44, 0.3, 0.02, 0xfbf7ec); });   /* 달집(솔가지 + 짚 · 새끼줄 둘 · 소원 쪽지) */
      col(v, 0, -3.2, 1.9, 1.9, 4.8);
      piece(v, 0, -3.2, p => { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, x = Math.sin(a) * 6.6, z = Math.cos(a) * 6.6; p('c', x, 0, z, 0.06, 0.95, 0, 0xf28a2a); p('b', x, 0.6, z, 0.13, 0.08, 0.13, 0xffffff); const b2 = (i + 1) / 14 * 6.283, x2 = Math.sin(b2) * 6.6, z2 = Math.cos(b2) * 6.6; p('b', (x + x2) / 2, 0.85, (z + z2) / 2, 0.025, 0.025, Math.hypot(x2 - x, z2 - z), 0xe0453a, 0, Math.atan2(x2 - x, z2 - z)); } });   /* 안전 줄(고깔 기둥 열넷 · 빨간 줄) */
      FLAME = piece(v, 0, -3.2, p => { p('k', 0, 0.25, 0, 2.15, 4.4, 0, 0xff6a14, 1); for (let i = 0; i < 6; i++) { const a = i * 1.047; p('k', Math.sin(a) * 1.1, 0.3, Math.cos(a) * 1.1, 0.85, 3.4 + (i % 3) * 0.9, 0, [0xff8a2a, 0xffb040, 0xffd060][i % 3], 1); } p('k', 0, 1.0, 0, 1.1, 5.9, 0, 0xffc04a, 1); }); FLAME.visible = !!st().lit;   /* 불(MeshBasic 꼭짓점 색 · 새 Light X) */
      piece(v, -4.4, 3.0, p => { table(p, 0, 0, 1.2, 0.8); p('c', 0, 0.45, 0, 0.32, 0.06, 0, 0x8a5a2c); for (let i = 0; i < 12; i++) { const a = i * 2.4, r9 = 0.08 + (i % 4) * 0.05; p('s', Math.cos(a) * r9, 0.55, Math.sin(a) * r9, i % 3 === 0 ? 0.06 : 0.045, 0.9, 0, [0x9a6a3a, 0xd9b77a, 0x6b3a1e][i % 3]); } }); col(v, -4.4, 3.0, 0.65, 0.45, 0.5);   /* 부럼 상(호두 · 땅콩 · 밤) */
      for (const lx of [5.6, 6.3]) piece(v, lx, -0.6, p => { p('c', 0, 0, 0, 0.11, 0.5, 0, 0xd8402e); p('c', 0, 0.5, 0, 0.05, 0.08, 0, 0x2b2420); p('b', 0.06, 0.52, 0, 0.12, 0.03, 0.03, 0x2b2420); }); }   /* 소화기 둘 */
    else if (id === 'dano') { board(v, 0, 6.2, 2.2, 1.1, paper(id, T2('창포물 · 그네 · 씨름 · 수리취떡', 'Iris water · swing · ssireum · rice cake')));
      piece(v, -5.2, -3.4, p => { for (const s9 of [-1, 1]) { p('c', s9 * 1.7, 0, 0, 0.13, 6.2, 0, 0x6b4a2f); p('c', s9 * 1.7, 0, 0, 0.3, 0.15, 0, 0x8d8a80); } p('b', 0, 6.05, 0, 3.6, 0.16, 0.16, 0x6b4a2f); for (const s9 of [-1, 1]) p('b', s9 * 0.42, 1.0, 0, 0.03, 5.05, 0.03, 0xd9c27a); p('b', 0, 0.92, 0, 1.0, 0.07, 0.3, 0x9b6a3c); p('b', 0, 6.21, 0, 3.0, 0.05, 0.05, 0xe0453a); });   /* 높은 그네(기둥 둘 · 가로대 · 줄 둘 · 발판) */
      col(v, -6.9, -3.4, 0.16, 0.16, 6.2); col(v, -3.5, -3.4, 0.16, 0.16, 6.2);
      piece(v, 3.0, -3.0, p => { p('c', 0, 0, 0, 3.2, 0.06, 0, 0xe2cf9a); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; p('b', Math.sin(a) * 3.25, 0.06, Math.cos(a) * 3.25, 0.12, 0.1, 0.86, 0xc9a25a, 0, a + 1.5708); } });   /* 씨름 모래판 · 짚 띠 */
      const cp = R() < 0.5 ? 0 : 1; st().cpk = st().cpk == null ? cp : st().cpk;
      piece(v, 4.6, 3.2, p => { basin(p, 0, 0, 0.55, 0x8a6a4a, 0x7fb0c8); for (const [k9, bx] of [[0, -1.0], [1, 1.0]]) { const iris = k9 === st().cpk, tie = k9 === 0 ? 0xe0453a : 0x2f6fd0; p('b', bx, 0, 0, 0.5, 0.06, 0.5, 0x8a6a4a);
        if (iris) for (let i = 0; i < 9; i++) p('b', bx - 0.16 + (i % 3) * 0.16, 0.06, -0.1 + ((i / 3) | 0) * 0.1, 0.035, 0.95 + (i % 2) * 0.2, 0.012, 0x4f8a3a, 0, i * 0.4, (i % 3 - 1) * 0.12);
        else for (let i = 0; i < 7; i++) { p('c', bx - 0.12 + (i % 3) * 0.12, 0.06, -0.08 + ((i / 3) | 0) * 0.09, 0.015, 0.32, 0, 0x6b8a3a); p('s', bx - 0.12 + (i % 3) * 0.12, 0.42 + (i % 2) * 0.08, -0.08 + ((i / 3) | 0) * 0.09, 0.15, 0.35, 0, 0x7fae4a); }
        p('c', bx, 0.26, 0, 0.17, 0.07, 0, tie); } });   /* 창포물 대야 · 다발 둘(빨간 끈 · 파란 끈 — 창포 = 칼처럼 길고 곧은 잎 · 다른 하나 = 둥근 잎) */
      col(v, 4.6, 3.2, 1.4, 0.5, 0.4);
      piece(v, -3.8, 3.2, p => { table(p, 0, 0, 1.4, 0.9, 0x8a5a34); for (let i = 0; i < 6; i++) { const a = (i % 3 - 1) * 0.4, b = i < 3 ? -0.2 : 0.2; p('c', a, 0.45, b, 0.15, 0.06, 0, 0x4f7a3a); for (let k9 = 0; k9 < 6; k9++) p('b', a, 0.512, b, 0.22, 0.004, 0.018, 0x2f4a24, 0, k9 * 0.5236); p('c', a, 0.513, b, 0.035, 0.004, 0, 0x2f4a24); } }); col(v, -3.8, 3.2, 0.75, 0.5, 0.5); }   /* 수리취떡(초록 둥근 떡 · 수레바퀴 무늬 바퀴살 여섯) */
    else if (id === 'chu') { board(v, 0, 6.2, 2.2, 1.1, paper(id, T2('송편 · 성묘길 · 강강술래', 'Songpyeon · grave path · ganggangsullae')));
      piece(v, -3.4, 0.4, p => { table(p, 0, 0, 1.8, 1.0); for (const [k9, x, hex] of [[0, -0.55, 0x3a2a1a], [1, 0, 0x8a5a3a], [2, 0.55, 0xe8c890]]) { p('c', x, 0.45, -0.25, 0.16, 0.1, 0, 0xf6f4ee); for (let i = 0; i < 5; i++) p('s', x + (i % 3 - 1) * 0.05, 0.56, -0.25 + ((i / 3) | 0) * 0.05 - 0.02, 0.04, 0.8, 0, hex); }
        p('c', 0, 0.45, 0.22, 0.28, 0.06, 0, 0xc98a4a); for (let i = 0; i < 4; i++) p('s', -0.12 + i * 0.08, 0.54, 0.22, 0.05, 0.9, 0, [0xf6f4ee, 0x9fd06a, 0xf2a7b8, 0xf6f4ee][i]); }); col(v, -3.4, 0.4, 0.95, 0.55, 0.5);   /* 송편 상: 소 그릇 셋(깨 · 콩 · 밤) · 반죽 */
      board(v, 6.4, 3.4, 1.5, 0.8, (g, W, H) => { g.fillStyle = '#2f6b3a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + Math.round(H * 0.3) + 'px ' + FONT; g.fillText(en() ? 'Grave path' : '성묘길', W / 2, H * 0.36); g.font = '800 ' + Math.round(H * 0.17) + 'px ' + FONT; g.fillText(en() ? 'Beware of forest fires' : '산불 조심', W / 2, H * 0.72); }); }   /* 성묘길 · 산불 조심 팻말 */
    else if (id === 'kim') { board(v, 0, 6.2, 2.2, 1.1, paper(id, T2('같이 담그고 나눠요', 'Make it together, share it')));
      const X = [-7.2, -3.8, -0.4, 3.0, 6.4];
      piece(v, X[0], -1.2, p => { for (let i = 0; i < 9; i++) cabbage(p, (i % 3 - 1) * 0.42, ((i / 3) | 0) * 0.28, (((i / 3) | 0) % 2) * 0.2 - 0.1 + ((i % 3) - 1) * 0.05, 0.24); p('b', 0.9, 0, 0.5, 0.5, 0.35, 0.3, 0x7a5232); for (let i = 0; i < 5; i++) half(p, -0.7 + i * 0.36, 0, 0.75, 0.24, 0.3); });   /* ① 통배추 더미 → 반 가른 배추 */
      piece(v, X[1], -1.2, p => { basin(p, 0, 0, 0.85, 0xc8423a, 0xe8f0c0); for (let i = 0; i < 6; i++) half(p, -0.4 + (i % 3) * 0.4, 0.33, -0.2 + ((i / 3) | 0) * 0.4, 0.26, i); p('b', 1.1, 0, 0.3, 0.45, 0.55, 0.3, 0xf4f4ee); p('b', 1.1, 0.55, 0.3, 0.3, 0.05, 0.2, 0xffffff); });   /* ② 절이는 대야 · 소금 포대 */
      piece(v, X[2], -1.2, p => { basin(p, 0, 0, 0.85, 0x2f6fd0, 0xe8f0c0); p('b', 0, 0.36, 0, 1.5, 0.03, 1.5, 0x9a8a5a); p('c', 0.55, 0.39, 0.55, 0.12, 0.12, 0, 0x8d8a80); });   /* ③ 덮어 하룻밤(거적 · 누름돌) */
      piece(v, X[3], -1.2, p => { basin(p, -0.4, 0, 0.6, 0x8d8a80, 0x7fb0c8); p('b', 0.65, 0, 0, 0.7, 0.5, 0.9, 0x9b6a3c); for (let i = 0; i < 6; i++) half(p, 0.65 - 0.2 + (i % 2) * 0.4, 0.5, -0.3 + ((i / 2) | 0) * 0.3, 0.22, 1.5708); });   /* ④ 헹굼 물 · 물 빠지는 채반 */
      piece(v, X[4], -1.2, p => { basin(p, 0, 0, 0.7, 0xc8423a, 0xb8321e); for (let i = 0; i < 6; i++) tub(p, -0.6 + (i % 3) * 0.5, ((i / 3) | 0) * 0.4, 0.95, true); });   /* ⑤ 양념 대야(빨간 속) · 김치통 */
      for (const x of X) col(v, x, -1.2, 0.95, 0.95, 0.45); }
    log('yard ' + id); }
  /* 이웃 집 앞(세배 = 돗자리 · 김장 = 이미 담근 집 문 앞 김치통) */
  function buildHouses(id) { HS = []; const P = site(); if (!P || (id !== 'seol' && id !== 'kim')) return; const n = id === 'seol' ? 3 : 4, H = (A.houses ? A.houses(P.x, P.z, n) : []) || [], R = rnd('ssnh:' + id + ':' + day());
    if (H.length < n) { log('houses ' + H.length); return; } const s = st(); if (s.sp == null) s.sp = Math.floor(R() * n);
    H.forEach((h, i) => { const fw = h.fw, at = [h.door[0] + fw[0] * 1.9, h.door[1] + fw[1] * 1.9], ry = Math.atan2(fw[0], fw[1]); HS.push({ i, door: h.door, at, ry, hot: [h.door[0] + fw[0] * 3.1, h.door[1] + fw[1] * 3.1] });
      const v = VIS['h' + i] = { g: [], C: [] };
      if (id === 'seol') pieceAt(v, at[0], at[1], ry, p => mat(p, 0, 0, 1.6, 1.3));
      else if (i === s.sp) pieceAt(v, at[0] - fw[1] * 1.1, at[1] + fw[0] * 1.1, ry, p => { basin(p, 0, 0, 0.5, 0xc8423a, 0xb8321e); tub(p, 0.75, 0, 0, true); tub(p, 0.75, 0.39, 0, true); tub(p, 0.75, 0, 0.36, true); }); });   /* 이미 담근 집 = 문 옆 빨간 대야 + 김치통 */
    log('houses ' + HS.map(h => h.door.map(Math.round).join(',')).join(' | ')); }
  function addTub(i) { const h = HS[i]; if (!h) return; const v = VIS['h' + i] || (VIS['h' + i] = { g: [], C: [] }); pieceAt(v, h.at[0] + Math.cos(h.ry) * 0.9, h.at[1] - Math.sin(h.ry) * 0.9, h.ry, p => tub(p, 0, 0, 0, true)); }   /* 나눈 김치통이 그 집 문 앞에 남음 */
  function dropAll() { for (const id of keys(VIS)) drop(id); FLAME = null; HS = []; for (const k of keys(HOT)) HOT[k].remove(); HOT = {}; for (const k of keys(HOTL)) delete HOTL[k]; KEY = ''; if (GK) { A.gather(null); GK = ''; SLOT = []; } moonOff(); }

  // ───────── 보름달(대보름·추석 저녁 · 동쪽에서 떠오름 · MeshBasic 하나) ─────────
  function moonOff() { if (MOON) { map.remove(MOON); MOON.geometry.dispose(); MOON.material.dispose(); MOON = null; } }
  const moonUp = () => min() >= 18 * 60;
  function moonSec() { const id = cur(), want = (id === 'bor' || id === 'chu') && min() >= 17 * 60 + 50; if (!want) { moonOff(); return; }
    if (!MOON) { MOON = new T3.Mesh(new T3.CircleGeometry(9, 28), new T3.MeshBasicMaterial({ color: 0xfff0c4, fog: false })); MOON.userData.own = 1; MOON.userData.fx = 1; MOON.renderOrder = -1; map.add(MOON); }
    const t = Math.max(0, Math.min(1, (min() - 18 * 60) / 360)), el = (12 + 43 * t) / 57.3, az = (88 + 50 * t) / 57.3, me = A.me(), R9 = Math.min(300, ((map.camera && map.camera.far) || 400) * 0.8);   /* 카메라 먼 끝 안쪽(안 잘리게) · 크기는 거리 따라 */   /* 여섯 시 = 동쪽 지붕 위(마을 건물에 안 가리게 조금 높이) · 자정 = 남동 하늘 높이 */
    const dx = Math.sin(az) * Math.cos(el), dz = -Math.cos(az) * Math.cos(el), dy = Math.sin(el); MOON.position.set(me.x + dx * R9, (me.y || 0) + 1.6 + dy * R9, me.z + dz * R9); MOON.scale.setScalar(R9 / 300); MOON.lookAt(me.x, (me.y || 0) + 1.6, me.z); MOON.updateMatrixWorld(true); }

  // ───────── 이웃 모이기(있는 일꾼 · 수 그대로 · 옷만 한복) ─────────
  function spots() { const id = cur(), P = site(); if (!id || !P) return []; const m = min(), out = [], Y = (lx, lz, ry, act, dr) => { const [x, z] = P.Q(lx, lz); out.push({ x, z, ry: P.ry + ry, act, dr }); };
    const day9 = m >= 8 * 60 && m < 18 * 60;
    if (id === 'seol') { if (day9) { HS.forEach((h, i) => out.push({ x: h.at[0], z: h.at[1], ry: h.ry, act: i === st().sp ? 'sitg' : 'nod', dr: i === st().sp ? HB.old : hb(i + 1), house: i }));
      [[-3.6, -1.9, 0], [-3.6, 1.9, Math.PI], [-5.5, 0, Math.PI / 2], [3.6, -1.1, 0]].forEach(([a, b, r9], i) => Y(a, b, r9, i < 3 ? 'sitg' : 'stand', hb(i))); } }
    else if (id === 'bor') { if (m >= 8 * 60 && m < 22 * 60 + 30) { Y(6.0, 0.4, Math.PI, 'stand', [0xe0a030, 0x3a3a3a]); Y(-4.4, 1.9, 0, 'stand', null); }   /* 소방관(주황 방화복) · 부럼 상 이웃 */
      if (m >= 16 * 60 && m < 22 * 60 + 30) for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4, x = Math.sin(a) * 8.4, z = -3.2 + Math.cos(a) * 8.4; Y(x, z, a + Math.PI, 'cheer', i % 3 ? null : hb(i)); } }   /* 안전 줄 밖 둘레 */
    else if (id === 'dano') { if (day9) { Y(2.55, -3.0, Math.PI / 2, st().bout === 2 ? 'cheer' : 'reach', [0xf4f0e6, 0x2f5fa8]); Y(3.45, -3.0, -Math.PI / 2, st().bout === 2 ? 'sitg' : 'reach', [0xf4f0e6, 0xc8423a]);   /* 청·홍 샅바 선수 */
      for (let i = 0; i < 5; i++) { const a = 2.2 + i * 0.45; Y(3.0 + Math.sin(a) * 4.3, -3.0 + Math.cos(a) * 4.3, a + Math.PI, 'cheer', i % 2 ? hb(i) : null); } Y(-5.2, -3.4, 0, 'stand', hb(4)); Y(-3.8, 4.6, Math.PI, 'stand', null); } }
    else if (id === 'chu') { if (day9) { [[-3.4, -0.7, 0], [-4.6, 0.4, Math.PI / 2], [-2.2, 0.4, -Math.PI / 2]].forEach(([a, b, r9], i) => Y(a, b, r9, 'sitg', hb(i))); Y(6.4, 2.4, Math.PI, 'stand', null); }
      if (m >= 19 * 60 && m < 22 * 60 + 30) for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; Y(Math.sin(a) * 3.6, -3.4 + Math.cos(a) * 3.6, a + Math.PI / 2, 'walk', hb(i)); } }   /* 강강술래 둥근 원(손잡고 도는 몸짓) */
    else if (id === 'kim') { if (day9) { [-7.2, -3.8, -0.4, 3.0, 6.4].forEach((x, i) => Y(x, 0.2, Math.PI, i % 2 ? 'pick' : 'reach', null)); }
      if (m >= 8 * 60 && m < 20 * 60) HS.forEach((h, i) => out.push({ x: h.at[0], z: h.at[1], ry: h.ry, act: 'stand', dr: i === st().sp ? null : i === (st().sp + 1) % 4 ? HB.old : null, house: i })); }
    return out; }
  function gatherSec() { const L9 = spots(), k = JSON.stringify(L9.map(q => [q.x.toFixed(1), q.z.toFixed(1), q.act, q.dr ? 1 : 0])); if (k === GK) return; GK = k; SLOT = L9.length ? A.gather(L9) : (A.gather(null), []); log('gather ' + L9.length + ' → ' + SLOT.filter(i => i >= 0).length); }
  const houseSlot = i => { const L9 = spots(); const j = L9.findIndex(q => q.house === i); return j >= 0 ? SLOT[j] : -1; };

  // ───────── E 자리 ─────────
  const hotAt = (id, x, z, label, use, r) => { if (HOTL[id] === label && HOT[id]) return; if (HOT[id]) HOT[id].remove(); HOT[id] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 1.7, label, use }); HOTL[id] = label; HOTF[id] = use; };
  const hot = (id, lx, lz, label, use, r) => { const P = site(); if (!P) return; const [x, z] = P.Q(lx, lz); hotAt(id, x, z, label, use, r); };
  const unhot = id => { if (HOT[id]) { HOT[id].remove(); delete HOT[id]; delete HOTL[id]; } };
  function hots() { const id = cur(), e = en(), s = st(); if (!id) return; const W = (k, t) => t[e ? 1 : 0];
    hot('board', 0, 7.3, EV[id].ic + ' ' + L(EV[id].t) + (e ? ' — what to do' : ' — 할 일 보기'), () => openBoard(), 1.6);
    if (id === 'seol') { hot('yut', -3.6, 1.95, '🎯 ' + (e ? 'Play yut' : '윷놀이 한 판'), () => yut(), 1.6); if ((s.sb || []).length >= 3) hot('dd', 3.6, 0.85, '🍲 ' + (e ? 'Eat tteokguk' : '떡국 먹기'), () => eatDd(), 1.5); else unhot('dd');
      HS.forEach((h, i) => hotAt('h' + i, h.hot[0], h.hot[1], '🙇 ' + (e ? 'Bow (sebae)' : '세배 드리기'), () => bow(i), 1.8)); }
    else if (id === 'bor') { hot('nut', -4.4, 3.75, '🌰 ' + W(0, T2('부럼 깨기', 'Crack bureom')), () => nut(), 1.5); hot('moon', 0, 5.2, '🌕 ' + (e ? 'Moon greeting' : '달맞이'), () => moonAsk(), 1.6); }
    else if (id === 'dano') { hot('cp', 4.6, 4.0, '🌿 ' + (e ? 'Iris water' : '창포물'), () => iris(), 1.6); hot('cake', -3.8, 4.0, '🟢 ' + (e ? 'Surichwi rice cake' : '수리취떡'), () => cake(), 1.5); hot('ring', 3.0, 1.0, '📣 ' + (e ? 'Cheer the ssireum' : '씨름 응원하기'), () => cheer(), 1.8); hot('swing', -5.2, -2.2, '🎢 ' + (e ? 'Watch the swing' : '그네 구경'), () => swing(), 1.6); }
    else if (id === 'chu') { hot('sp', -3.4, 1.25, '🌕 ' + (e ? 'Make songpyeon' : '송편 빚기'), () => songp(), 1.6); hot('trail', 6.4, 4.4, '🌲 ' + (e ? 'Pack for the grave path' : '성묘길 챙기기'), () => trail(), 1.6); if (min() >= 19 * 60) hot('ggr', 0, 0.6, '🌕 ' + (e ? 'Watch ganggangsullae' : '강강술래 구경'), () => ggr(), 2.0); else unhot('ggr'); }
    else if (id === 'kim') { hot('kim', -7.2, 0.9, '🥬 ' + (e ? 'Help with gimjang' : '김장 거들기'), () => kimOpen(), 1.6); HS.forEach((h, i) => hotAt('h' + i, h.hot[0], h.hot[1], '🥬 ' + (e ? 'Bring kimchi' : '김치 전하기'), () => give(i), 1.8)); } }

  // ───────── 할 거리 ─────────
  const sayN = (slot, t) => { if (slot >= 0 && A.bubbleW) A.bubbleW(slot, t); };
  const late = () => { const m = min(); return m < 7 * 60 || m >= 22 * 60 + 30; };
  const sleepy = () => { if (!late()) return false; A.say(en() ? '🌙 Everyone is resting now. Come back in the morning.' : '🌙 이웃들이 쉬는 때예요. 아침에 다시 와요.', 2.6); return true; };
  function step(k) { const s = st(); s[k] = s[k] || 1; mark(); A.rec('season', { id: cur(), ev: 'step', s: k }); checkDone(); }
  /* RWFIX-1(코덱스 C E9): 안내판 줄 = 끝 조건(같은 표 하나) — 설날 윷놀이·추석 강강술래를 안 했는데 '다 했어요'·일기에 적던 것 */
  const didOf = (id, s) => [id === 'chu' ? (s.spn | 0) >= 3 : id === 'kim' ? (s.ko | 0) >= 5 : id === 'seol' ? (s.sb || []).length >= 3 : id === 'bor' ? !!s.nut : !!s.cp, id === 'chu' ? (s.pk || []).length >= 2 : id === 'kim' ? (s.dv || []).length >= 3 : id === 'seol' ? !!s.dd : id === 'bor' ? !!s.dir : !!s.cake, id === 'chu' ? !!s.ggr : id === 'seol' ? !!s.yut : id === 'bor' ? !!s.lit : !!s.cheer].slice(0, EV[id].todo.length);
  function checkDone() { const id = cur(), s = st(); if (!id || s.done) return; const ok = didOf(id, s).every(Boolean);
    if (!ok) return; s.done = 1; A.chip('twn-ssn', null); chipT = 0; const S9 = S(); S9.past.push({ id, d: day(), ok: 1 }); while (S9.past.length > 20) S9.past.shift(); mark();
    A.banner(EV[id].ic + ' ' + (en() ? L(EV[id].t) + ': you did it all today' : '오늘 ' + L(EV[id].t) + ' 할 일을 다 했어요'), 4); A.sfx('done'); A.rec('season', { id, ev: 'done', b: EV[id].b });
    if (A.diary) A.diary(EV[id].ic, en() ? L(EV[id].t) + ': ' + EV[id].todo.map(t => t[1].split(' — ')[0]).join(', ') : L(EV[id].t) + jo(L(EV[id].t), '이었어요', '였어요') + '. ' + EV[id].todo.map(t => t[0].split(' — ')[0]).join(', ') + ' 했어요'); log('done ' + id); }

  /* 설날 — 세배(웃어른 = 흰머리로 돗자리에 앉은 이웃 먼저) · 떡국 · 윷 */
  async function bow(i) { if (sleepy()) return; const s = st(), e = en(), sb = s.sb || (s.sb = []), h = HS[i], el = HS[s.sp], slot = houseSlot(i); if (!h) return;
    if (sb.includes(i)) { A.say(e ? '🙇 You already bowed here. Happy New Year!' : '🙇 이 집엔 벌써 세배했어요.', 2.2); return; }
    if (!sb.includes(s.sp) && i !== s.sp) { const d = dir8(el.at[0] - h.at[0], el.at[1] - h.at[1]); sayN(slot, e ? 'Thank you! But bow to the eldest first. Go to the elder to the ' + d[1] + '.' : '고맙구나. 그런데 세배는 웃어른께 먼저 드린단다. ' + d[0] + '쪽 집 어르신부터 뵙고 오렴.');
      await ask({ who: e ? 'Neighbour' : '이웃', icon: '🙂', text: [e ? 'Thank you! But on Seollal you bow to the eldest first. The elder is in the house to the ' + d[1] + '. Look for white hair, sitting on a mat.' : '고맙구나. 그런데 설날엔 웃어른께 먼저 세배를 드린단다. ' + d[0] + '쪽 집에 어르신이 계셔. 돗자리에 앉아 계신 흰머리 어르신을 찾아보렴.'] }); log('bow early ' + i); return; }
    if (i === s.sp) { const R = rnd('greet:' + day()), C = shuf([['ok', e ? '“Happy New Year!”' : '「새해 복 많이 받으세요」'], ['money', e ? '“Please give me New Year money.”' : '「세뱃돈 주세요」'], ['bye', e ? '“Goodbye.”' : '「안녕히 계세요」']], R);
      const r = await ask({ who: e ? 'Elder neighbour' : '이웃 어르신', icon: '👵', text: [e ? 'You bow low, hands together. What do you say as you get up?' : '두 손을 모으고 큰절을 올렸어요. 일어나며 무엇이라고 말할까요?'], choices: C });
      if (r !== 'ok') { if (r) await ask({ who: e ? 'Elder neighbour' : '이웃 어르신', icon: '👵', text: [r === 'money' ? (e ? 'Ho ho. Sebae is a greeting, not a way to ask for money. Try again.' : '허허, 세배는 인사란다. 돈을 먼저 말하면 서운하지. 다시 해 보렴.') : (e ? 'That is what you say when leaving. What do you wish someone at New Year?' : '그건 헤어질 때 하는 인사란다. 새해엔 무엇을 빌어 주지?')] }); log('greet ' + r); return; }
      sb.push(i); mark(); sayN(slot, e ? 'Grow up healthy and brave this year.' : '그래, 올해도 건강하고 씩씩하게 자라렴.'); A.sfx('pop'); A.say(e ? '🙇 The elder gave you kind words (deokdam). Now the other two homes.' : '🙇 어르신이 덕담을 해 주셨어요. 이제 다른 두 집에도 가 봐요.', 3); }
    else { sb.push(i); mark(); sayN(slot, e ? 'Happy New Year to you too! Study and play well.' : '너도 새해 복 많이 받아라. 즐겁게 배우고 놀렴.'); A.sfx('pop'); }
    A.rec('season', { id: 'seol', ev: 'step', s: 'bow' }); if (sb.length >= 3) { A.banner('🙇 ' + (e ? 'You bowed at all three homes. Tteokguk is ready in the yard.' : '세 집 모두 세배를 드렸어요. 마당 상에 떡국이 차려졌어요.'), 4); const p = toYard(); if (p) { chipT = performance.now(); A.chip('twn-ssn', '🍲 ' + (e ? 'Tteokguk' : '떡국 먹으러'), { onClick: () => { A.chip('twn-ssn', null); A.route(p); } }); } } else hint(); KEY = ''; }
  async function eatDd() { const s = st(), e = en(); if (s.dd) { A.say(e ? '🍲 You already had a bowl. One is enough.' : '🍲 떡국은 벌써 한 그릇 먹었어요.', 2.2); return; }
    await ask({ who: e ? 'Neighbour' : '이웃', icon: '🍲', text: [e ? 'Here’s a bowl of tteokguk. White rice-cake slices are said to wish for a clean, bright year.' : '떡국 한 그릇 먹으렴. 하얀 가래떡처럼 깨끗하고 밝은 한 해를 보내라는 뜻이 있단다.', e ? 'With this bowl, you are a year older.' : '이 한 그릇을 먹으면 한 살 더 먹는 거야.'] }); s.dd = 1; mark(); A.sfx('done'); checkDone(); }
  function yut() { if (sleepy()) return; if (!(A.table && A.table('yut'))) A.say(en() ? '🎯 The yut mat is busy now. Try again soon.' : '🎯 지금은 윷판을 쓸 수 없어요. 조금 뒤에 다시 해요.', 2.4); else { st().yut = 1; mark(); checkDone(); } }

  /* 정월 대보름 — 부럼 · 달맞이(방위) · 달집(안전 줄 밖) */
  async function nut() { if (sleepy()) return; const s = st(), e = en(); if (s.nut) { A.say(e ? '🌰 Crack! You already cracked your bureom.' : '🌰 부럼은 벌써 깨물었어요.', 2.2); return; }
    const C = shuf([['ok', e ? 'Walnuts and peanuts' : '호두와 땅콩'], ['candy', e ? 'Candy and jelly' : '사탕과 젤리'], ['rice', e ? 'Rice cake and noodles' : '떡과 국수'], ['fruit', e ? 'Apple and pear' : '사과와 배']], rnd('nut:' + day()));
    const r = await ask({ who: e ? 'Neighbour' : '이웃', icon: '🌰', text: [e ? 'On Daeboreum morning you crack hard nuts with your teeth, wishing for no boils all year. Look at the tray. Which are bureom?' : '대보름 아침엔 단단한 열매를 이로 딱 깨물며 한 해 동안 부스럼이 나지 않기를 빌어요. 상 위를 잘 봐요. 부럼은 어느 것일까요?'], choices: C });
    if (r !== 'ok') { if (r) A.say(e ? '🌰 Look at the tray again: small, hard nuts with shells.' : '🌰 상 위를 다시 봐요. 껍데기가 단단한 작은 열매예요.', 3); return; }
    s.nut = 1; mark(); A.sfx('pop'); A.say(e ? '🌰 Crack! Walnuts, peanuts and chestnuts are bureom.' : '🌰 딱! 호두, 땅콩, 밤이 부럼이에요.', 3); A.rec('season', { id: 'bor', ev: 'step', s: 'nut' }); checkDone(); hint(); }
  function moonAsk() { if (sleepy()) return; const s = st(), e = en(); if (s.dir) { A.say(moonUp() ? (e ? '🌕 The moon is up in the east. Make a wish!' : '🌕 동쪽 하늘에 보름달이 떴어요. 소원을 빌어요.') : (e ? '🌕 The moon rises around six in the evening.' : '🌕 달은 저녁 여섯 시쯤 떠올라요.'), 2.6); return; }
    if (min() < 16 * 60) { A.say(e ? '🌕 The moon comes up in the evening. Come back after four in the afternoon.' : '🌕 달은 저녁에 떠요. 오후 네 시 넘어 다시 와요.', 3); return; }
    const up = moonUp(), q = up ? (e ? 'The full moon is up. Which way is it? Look up and around the sky.' : '보름달이 떴어요. 어느 쪽 하늘에 있나요? 고개를 들어 하늘을 둘러봐요.') : (e ? 'The full moon will rise soon. From which way? The sun is setting in the west, and a full moon rises facing the sun.' : '곧 보름달이 떠요. 어느 쪽에서 떠오를까요? 해는 서쪽으로 지고, 보름달은 해와 마주 보는 쪽에서 떠요.');
    const svg = '<svg viewBox="0 0 200 200" width="190" height="190" style="display:block;margin:6px auto"><circle cx="100" cy="100" r="78" fill="#fbf7ec" stroke="#2b2420" stroke-width="4"/><text x="100" y="17" text-anchor="middle" font-size="15" font-weight="900">' + (e ? 'N' : '북') + '</text>'
      + (up ? '' : '<circle cx="34" cy="100" r="13" fill="#f2a23a" stroke="#2b2420" stroke-width="2"/><text x="34" y="132" text-anchor="middle" font-size="12" font-weight="800">' + (e ? 'setting sun' : '지는 해') + '</text>') + '<circle cx="100" cy="100" r="6" fill="#c8423a"/><text x="100" y="120" text-anchor="middle" font-size="12" font-weight="800">' + (e ? 'you' : '나') + '</text></svg>';
    const B9 = (k, t, st9) => '<button class="sub" data-dir="' + k + '" style="' + st9 + ';min-width:64px;min-height:44px">' + esc(t) + '</button>';
    const h = '<h3>🌕 ' + esc(e ? 'Moon greeting' : '달맞이') + '</h3><div class="sm">' + esc(q) + '</div>' + svg
      + '<div style="display:grid;grid-template-columns:repeat(3,auto);justify-content:center;gap:6px">' + '<span></span>' + B9('n', e ? 'North' : '북', '') + '<span></span>' + B9('w', e ? 'West' : '서', '') + '<span></span>' + B9('e', e ? 'East' : '동', '') + '<span></span>' + B9('s', e ? 'South' : '남', '') + '<span></span></div>'
      + '<div class="sm" data-why style="margin-top:6px;font-weight:800"></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'season'); if (!W) return; W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.dir) { const r = answerDir(b.dataset.dir); const w9 = W.querySelector('[data-why]'); if (w9) w9.textContent = r.t; if (r.ok) setTimeout(() => { if (!dead) A.closeP(); }, 1600); } }; log('moon panel ' + (up ? 'up' : 'pre')); return W; }
  function answerDir(d) { const s = st(), e = en(), up = moonUp(); if (d !== 'e') { log('dir ' + d); return { ok: false, t: up ? (e ? 'Look again. Turn until you face the moon.' : '다시 하늘을 둘러봐요. 달이 보이는 쪽으로 몸을 돌려 봐요.') : d === 'w' ? (e ? 'That is where the sun sets. The full moon is on the opposite side.' : '그쪽은 해가 지는 쪽이에요. 보름달은 그 맞은편에서 떠요.') : (e ? 'Opposite the setting sun. Look at the sun on the compass.' : '지는 해의 맞은편이에요. 나침반 그림의 해를 봐요.') }; }
    s.dir = 1; mark(); A.sfx('ding'); A.rec('season', { id: 'bor', ev: 'step', s: 'dir' }); return { ok: true, t: up ? (e ? 'Yes! The full moon is in the east. We light the dalijip now. Step behind the safety line.' : '맞아요! 보름달은 동쪽에 떴어요. 이제 달집에 불을 붙여요. 안전 줄 밖으로 물러서요.') : (e ? 'Yes! It rises in the east around six. When it is up, the dalijip is lit.' : '맞아요! 저녁 여섯 시쯤 동쪽에서 떠올라요. 달이 뜨면 달집에 불을 붙여요.') }; }
  function fireSec() { const s = st(), e = en(); if (cur() !== 'bor' || s.lit || !s.dir || !moonUp() || late()) return; const P = site(); if (!P) return; const [cx, cz] = P.Q(0, -3.2), me = A.me(), d = Math.hypot(me.x - cx, me.z - cz);
    if (d > 60) return; const fs = SLOT[0];
    if (d < 6.9) { if (!s.warn) { s.warn = 1; mark(); sayN(fs, e ? 'Please step behind the safety line first.' : '안전 줄 밖으로 먼저 물러서 주세요.'); A.say(e ? '🧯 The firefighter waits until everyone is behind the red line.' : '🧯 모두 빨간 안전 줄 밖으로 나가야 소방관이 불을 붙여요.', 3.2, 1); } return; }
    s.lit = 1; mark(); if (FLAME) FLAME.visible = true; A.sfx('done'); A.banner('🔥 ' + (e ? 'The dalijip is burning under the full moon. Make a wish for the year.' : '보름달 아래 달집이 타올라요. 한 해 소원을 빌어요.'), 4.5);
    sayN(fs, e ? 'In the old days children swung fire cans in empty fields, but fire is never a children’s game. Adults put the embers out with water.' : '옛날엔 빈 논밭에서 쥐불놀이도 했지만, 불은 어린이끼리 다루지 않아요. 불씨는 어른이 물로 끝까지 꺼요.');
    A.rec('season', { id: 'bor', ev: 'step', s: 'lit' }); checkDone(); log('lit ' + d.toFixed(1)); }

  /* 단오 — 창포 다발(끈 색) · 수리취떡 무늬 · 씨름 응원(모래판 밖) · 그네 */
  async function iris() { if (sleepy()) return; const s = st(), e = en(); if (s.cp) { A.say(e ? '🌿 You washed your hair in iris water. It smells fresh.' : '🌿 창포물에 머리를 감았어요. 풀 내음이 나요.', 2.2); return; }
    const C = shuf([['0', e ? 'The bundle with a red tie' : '빨간 끈으로 묶은 다발'], ['1', e ? 'The bundle with a blue tie' : '파란 끈으로 묶은 다발']], rnd('cp:' + day()));
    const r = await ask({ who: e ? 'Neighbour' : '이웃', icon: '🌿', text: [e ? 'On Dano we boiled changpo (sweet flag) and washed our hair in the water. Changpo grows by streams; its leaves are long and straight like a sword. Which bundle by the basin is changpo?' : '단오엔 창포를 삶은 물에 머리를 감았어요. 창포는 냇가에서 자라고, 잎이 칼처럼 길고 곧아요. 대야 곁 두 다발 가운데 창포는 어느 쪽일까요?'], choices: C });
    if (r == null) return; if (+r !== s.cpk) { A.say(e ? '🌿 Those leaves are round. Look for long, straight leaves.' : '🌿 그 다발은 잎이 둥글어요. 길고 곧은 잎을 찾아봐요.', 3); return; }
    s.cp = 1; mark(); A.sfx('pop'); A.say(e ? '🌿 That’s changpo. You wash your hair in the iris water.' : '🌿 그게 창포예요. 창포물에 머리를 감았어요.', 3); A.rec('season', { id: 'dano', ev: 'step', s: 'cp' }); checkDone(); hint(); }
  async function cake() { if (sleepy()) return; const s = st(), e = en(); if (s.cake) { A.say(e ? '🟢 You already had a surichwi cake.' : '🟢 수리취떡은 벌써 먹었어요.', 2.2); return; }
    const C = shuf([['ok', e ? 'A cart wheel' : '수레바퀴'], ['star', e ? 'A star' : '별'], ['fish', e ? 'A fish' : '물고기'], ['leaf', e ? 'A leaf' : '나뭇잎']], rnd('cake:' + day()));
    const r = await ask({ who: e ? 'Neighbour' : '이웃', icon: '🟢', text: [e ? 'These green cakes are made with surichwi leaves. Look closely at the table: what pattern is pressed on them?' : '수리취 잎을 넣어 빚은 초록 떡이에요. 상 위 떡을 가까이 봐요. 어떤 무늬가 찍혀 있나요?'], choices: C });
    if (r !== 'ok') { if (r) A.say(e ? '🟢 Look again: lines spread out from the middle.' : '🟢 다시 봐요. 가운데에서 살이 퍼져 나가요.', 3); return; }
    s.cake = 1; mark(); A.sfx('pop'); A.say(e ? '🟢 A cart wheel! Dano is also called Surinal, and the cakes carry a wheel pattern.' : '🟢 수레바퀴예요! 단오를 수릿날이라고도 해서 수레바퀴 무늬를 찍은 수리취떡을 먹었어요.', 3.6); A.rec('season', { id: 'dano', ev: 'step', s: 'cake' }); checkDone(); hint(); }
  async function cheer() { if (sleepy()) return; const s = st(), e = en(), P = site(); if (!P) return; const [cx, cz] = P.Q(3.0, -3.0), me = A.me();
    if (Math.hypot(me.x - cx, me.z - cz) < 3.4) { A.say(e ? '📣 Only the wrestlers go on the sand. Watch from outside the straw ring.' : '📣 모래판 안은 선수만 들어가요. 짚 띠 밖에서 봐요.', 3); return; }
    if (s.bout === 1) { A.say(e ? '📣 The bout is on. Cheer!' : '📣 지금 겨루는 중이에요. 응원해요!', 1.8); return; }
    const fast = TQ.length > 0, C = shuf([['b', e ? 'Cheer for blue belt' : '청 샅바 응원'], ['r', e ? 'Cheer for red belt' : '홍 샅바 응원']], rnd('bt:' + day() + ':' + (s.cheer | 0)));
    const r = await ask({ who: e ? 'Referee neighbour' : '심판 이웃', icon: '📣', text: [e ? 'Two wrestlers grab each other’s satba (cloth belts). The first to touch the sand with anything but the feet loses. Whom will you cheer?' : '두 선수가 서로 샅바를 잡았어요. 발이 아닌 곳이 모래에 먼저 닿으면 져요. 누구를 응원할까요?'], choices: C });
    if (!r) return; s.bout = 1; mark(); GK = ''; A.sfx('pop'); A.banner('📣 ' + (e ? 'Push, pull, lift... the crowd claps along.' : '밀고 당기고 들어 올리고… 이웃들이 손뼉을 쳐요.'), 3);
    clearTimeout(boutT); boutT = setTimeout(() => { if (dead || cur() !== 'dano') return; s.bout = 2; s.cheer = (s.cheer | 0) + 1; mark(); GK = ''; gatherSec(); A.sfx('done');
      A.banner('📣 ' + (e ? 'One wrestler touched the sand. They help each other up and bow.' : '한 선수가 모래에 먼저 닿았어요. 둘이 서로 일으켜 주고 인사해요.'), 4); A.rec('season', { id: 'dano', ev: 'step', s: 'cheer' }); checkDone(); hint(); }, fast ? 50 : 3200); }
  function swing() { if (sleepy()) return; const e = en(); A.say(e ? '🎢 On Dano people rode tall swings and saw who could go highest. Ropes hang from a beam between two tall posts.' : '🎢 단오엔 높은 그네를 뛰며 누가 더 높이 오르나 겨뤘어요. 큰 기둥 둘 사이 가로대에 줄을 매어 달아요.', 4); st().sw = 1; mark(); }

  /* 추석 — 송편(이웃마다 소 고르기) · 성묘길 챙기기(산불·벌) · 강강술래 */
  const orders = () => { const R = rnd('sp:' + day()); return shuf(WANT, R).slice(0, 3); };
  async function songp() { if (sleepy()) return; const s = st(), e = en(), n = s.spn | 0, O = orders(); if (n >= 3) { A.say(e ? '🌕 You made songpyeon for all three neighbours.' : '🌕 세 이웃의 송편을 다 빚었어요.', 2.2); return; }
    const q = O[n], C = shuf(keys(FILL).map(k => [k, L(FILL[k])]), rnd('spc:' + day() + ':' + n)), slot = SLOT[n] != null ? SLOT[n] : -1;
    sayN(slot, L(q.t)); const r = await ask({ who: e ? 'Neighbour at the table' : '송편 상 이웃', icon: '🌕', text: [L(q.t), e ? 'Look at the three filling bowls. Which filling will you put in?' : '소 그릇 셋을 봐요. 어떤 소를 넣어 빚을까요?'], choices: C });
    if (r == null) return; if (!q.ok.includes(r)) { await ask({ who: e ? 'Neighbour at the table' : '송편 상 이웃', icon: '🌕', text: [L(q.why) + (e ? ' Try another one.' : ' 다른 소로 다시 빚어 볼래?')] }); log('sp wrong ' + r); return; }
    s.spn = n + 1; mark(); A.sfx('pop'); sayN(slot, e ? 'Thank you! It looks like a half moon.' : '고마워! 반달처럼 예쁘게 빚었네.'); if (VIS.yard) { const i = n; piece(VIS.yard, -3.4 + (i - 1) * 0.25, 0.85, p => { p('s', 0, 0.5, 0, 0.06, 0.7, 0, [0xf6f4ee, 0x9fd06a, 0xf2a7b8][i]); }); }   /* 빚은 송편이 상에 하나씩 */
    A.rec('season', { id: 'chu', ev: 'step', s: 'sp' }); checkDone(); hint(); }
  async function trail() { if (sleepy()) return; const s = st(), e = en(), pk = s.pk || (s.pk = []); if (pk.length >= 2) { A.say(e ? '🌲 The family is ready for the hill path.' : '🌲 성묘 가는 가족은 챙길 것을 다 챙겼어요.', 2.2); return; }
    const C = shuf(PACK.filter(q => !pk.includes(q[0])).map(q => [q[0], L(q[1])]), rnd('pk:' + day() + ':' + pk.length));
    const r = await ask({ who: e ? 'Family going to the graves' : '성묘 가는 이웃', icon: '🌲', text: [e ? 'We’re walking up the hill to greet our ancestors’ graves. The grass is dry in autumn. What should we take? Pick one.' : '조상 산소에 인사하러 산길을 올라가요. 가을 산은 풀이 말라 있어요. 무엇을 챙겨 갈까요? 하나 골라 줘요.'], choices: C });
    const q = PACK.find(x => x[0] === r); if (!q) return; A.say((q[2] ? '🌲 ' : '🧯 ') + L(q[3]), 3.4); if (!q[2]) { log('pk wrong ' + r); return; }
    pk.push(r); mark(); A.sfx('pop'); A.rec('season', { id: 'chu', ev: 'step', s: 'pk' }); if (pk.length >= 2) A.banner('🌲 ' + (e ? 'Ready for the hill path. No sparks in dry hills.' : '성묘길 준비 끝. 마른 산에선 불씨 하나도 조심해요.'), 3.6); checkDone(); hint(); }
  function ggr() { const s = st(), e = en(); if (!moonUp()) return; A.say(e ? '🌕 Under the full moon, neighbours hold hands in a big circle and go round, singing “ganggang sullae”.' : '🌕 둥근 보름달 아래 이웃들이 손을 잡고 둥글게 돌며 「강강술래」를 불러요.', 4); A.sfx('pop'); s.ggr = 1; mark(); checkDone(); }

  /* 김장 — 절이기 차례(마당 자리를 보고) · 나누기(문 앞에 김치통이 이미 있는 집은 빼고) */
  function kimOpen() { if (sleepy()) return; const s = st(), e = en(); if ((s.ko | 0) >= 5) { const left = 3 - (s.dv || []).length; A.say(left > 0 ? (e ? '🥬 Take the kimchi to homes that could not make any. Look at the doorsteps.' : '🥬 김장을 못 한 이웃 집에 김치를 전해요. 문 앞을 잘 봐요.') : (e ? '🥬 All shared. Thank you!' : '🥬 다 나눴어요. 고마워요!'), 3); hint(); return; }
    const R = rnd('ko:' + day()), ord = shuf([0, 1, 2, 3, 4], R), n = s.ko | 0;
    const h = '<h3>🥬 ' + esc(e ? 'Gimjang order' : '김장 차례') + '</h3><div class="sm">' + esc(e ? 'Five stations stand in the yard. Look at what each one has, then tap the steps in order.' : '마당에 다섯 자리가 차례로 놓여 있어요. 자리마다 놓인 것을 보고, 하는 차례대로 눌러요.') + '</div>'
      + '<div data-done style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">' + KIMS.slice(0, n).map(k => '<span style="border:2px solid #2b2420;border-radius:8px;padding:3px 8px;background:#e8f0c0;font-weight:800">' + esc(L(k[0])) + '</span>').join('') + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px">' + ord.filter(i => i >= n).map(i => '<button class="sub" data-k="' + i + '" style="min-height:44px;text-align:left">' + esc(L(KIMS[i][0])) + '</button>').join('') + '</div>'
      + '<div class="sm" data-why style="margin-top:6px;font-weight:800"></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'season'); if (!W) return; W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.k != null) { const r = pickKim(+b.dataset.k); if (r.ok) { if (r.all) { W.querySelectorAll('[data-k]').forEach(q => { q.disabled = true; }); setTimeout(() => { if (!dead && W.isConnected) A.closeP(); }, 1400); } else { A.closeP(); kimOpen(); return; } }   /* RWFIX-1(코덱스 C E7·E8): 다 됐으면 단추를 막음(두 번 누름 예외) · 1.4초 뒤엔 이 창이 아직 떠 있을 때만 닫음(다른 창을 닫던 것) */ const w9 = W.querySelector('[data-why]'); if (w9) w9.textContent = r.t; } }; return W; }
  function pickKim(k) { const s = st(), e = en(), n = s.ko | 0; if (n >= KIMS.length) return { ok: false, t: '' }; if (k !== n) { log('kim wrong ' + k + ' at ' + n); return { ok: false, t: L(KIMS[n][1]) }; }
    s.ko = n + 1; mark(); A.sfx('ding'); if (s.ko < 5) return { ok: true, t: '' };
    s.carry = 3; mark(); A.rec('season', { id: 'kim', ev: 'step', s: 'order' }); A.banner('🥬 ' + (e ? 'The kimchi is done. Take one tub each to three homes that could not make any.' : '김치가 다 됐어요. 김장을 못 한 세 집에 한 통씩 전해요.'), 4.5); hint(); return { ok: true, all: true, t: e ? 'All done!' : '다 됐어요!' }; }
  async function give(i) { if (sleepy()) return; const s = st(), e = en(), dv = s.dv || (s.dv = []), slot = houseSlot(i);
    if (dv.includes(i)) { A.say(e ? '🥬 You already brought kimchi here.' : '🥬 이 집엔 벌써 김치를 전했어요.', 2.2); return; }
    if (!(s.carry > 0)) { A.say(e ? '🥬 First help with the gimjang in the yard.' : '🥬 먼저 김장 마당에서 김장을 거들어요.', 2.6); const p = toYard(); if (p) A.route(p); return; }
    if (i === s.sp) { s.spNo = 1; mark(); sayN(slot, e ? 'We made ours yesterday. See the tubs by the door? Take it to a home that needs it.' : '우리 집은 어제 담갔단다. 문 옆 김치통 보이지? 못 한 집에 갖다주렴.'); await ask({ who: e ? 'Neighbour' : '이웃', icon: '🥬', text: [e ? 'Thank you, but we already made kimchi yesterday. Look at the red basin and tubs by our door. Please take it to a home that couldn’t make any.' : '고마워. 그런데 우리 집은 어제 김장했단다. 문 옆 빨간 대야랑 김치통 보이지? 김장을 못 한 집에 갖다주렴.'] }); log('give decoy'); return; }
    s.carry--; dv.push(i); mark(); addTub(i); A.sfx('pop'); const old = i === (s.sp + 1) % 4;
    sayN(slot, old ? (e ? 'My back hurt this year, so I couldn’t make any. Thank you, dear.' : '올해는 허리가 아파 못 담갔는데, 고맙구나.') : (e ? 'We were too busy this year. Thank you!' : '올해는 바빠서 못 담갔어요. 고마워요!'));
    A.rec('season', { id: 'kim', ev: 'step', s: 'give' }); checkDone(); if (!st().done) hint(); KEY = ''; }

  /* 다음 할 일 칩(빨간 선) — 가까운 남은 집 · 마당 */
  function hint() { const id = cur(), s = st(), e = en(); if (!id || s.done) return null; let to = null, t = '';
    if (id === 'seol' && (s.sb || []).length < 3) { const left = HS.filter(h => !(s.sb || []).includes(h.i)), me = A.me(); left.sort((a, b) => Math.hypot(a.at[0] - me.x, a.at[1] - me.z) - Math.hypot(b.at[0] - me.x, b.at[1] - me.z)); if (left.length) { to = { icon: '🙇', name: e ? 'neighbour’s home' : '이웃 집', door: left[0].hot }; t = '🙇 ' + (e ? 'Sebae homes' : '세배할 집'); } }
    else if (id === 'kim' && s.carry > 0) { const me = A.me(), left = HS.filter(h => !(s.dv || []).includes(h.i) && !(s.spNo && h.i === s.sp)).sort((a, b) => Math.hypot(a.at[0] - me.x, a.at[1] - me.z) - Math.hypot(b.at[0] - me.x, b.at[1] - me.z)); if (left.length) { to = { icon: '🥬', name: e ? 'neighbour’s home' : '이웃 집', door: left[0].hot }; t = '🥬 ' + (e ? 'Homes to share with' : '김치 전할 집'); } }   /* RWFIX-1(코덱스 C E10): 이미 김장했다고 들은 집은 다시 권하지 않음 */
    if (!to) { const p = toYard(); if (!p) return null; to = p; t = EV[id].ic + ' ' + L(EV[id].t) + (e ? ' yard' : ' 마당'); }
    chipT = performance.now(); A.chip('twn-ssn', t, { onClick: () => { A.chip('twn-ssn', null); A.route(to); } }); return to; }

  // ───────── 안내판·수첩 창 ─────────
  function openBoard() { const id = cur(), s = st(), e = en(); if (!id) return null; const E9 = EV[id];
    const did = didOf(id, s);
    const rows = E9.todo.map((t, i) => '<div style="border:2px solid #2b2420;border-left:8px solid ' + (did[i] ? '#2f8a4e' : '#c8a060') + ';border-radius:10px;padding:6px 9px;margin:6px 0;background:#fffdf6;font-size:15px;font-weight:800">' + esc(L(t)) + '<div style="font-size:13px;opacity:.78;font-weight:700">' + esc(did[i] ? (e ? 'Done' : '했어요') : (e ? 'Not yet' : '아직')) + '</div></div>').join('');
    const h = '<h3>' + E9.ic + ' ' + esc(L(E9.t)) + '</h3><div class="sm">' + esc(L(E9.fact)) + '</div>' + rows + '<div class="row"><button class="sub" data-a="go">🧭 ' + (e ? 'Show the way' : '길 안내') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'season'); if (!W) return null; W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); if (b.dataset.a === 'go') { A.closeP(); const to = hint() || toYard(); if (to) { A.chip('twn-ssn', null); A.route(to); } } }; log('board'); return W; }

  // ───────── 1초 칸 ─────────
  function begin() { const s = S(), d = day(); if (s.d === d) return; dropAll(); const id = rawOn(d); s.d = d; s.st = {}; s.id = id; s.ann = -1; s.sk = String(A.season(d)); mark(); metD = -1; log('day ' + d + ' → ' + (id || '-'));
    if (id) { buildHouses(id); buildYard(id); } }
  function sec() { if (dead || !A.on()) { if (VIS.yard) dropAll(); return; } const s = S(), d = day();
    if (s.d !== d) begin();
    { const sk = String(A.season(d)); if (s.sk == null) { s.sk = sk; mark(); } else if (s.sk !== sk) { s.sk = sk; const id2 = rawOn(d); if (id2 !== s.id) { dropAll(); A.chip('twn-ssn', null); chipT = 0; s.id = id2; s.st = {}; s.ann = -1; metD = -1; log('cal ' + sk + ' → ' + (id2 || '-')); if (id2) { buildHouses(id2); buildYard(id2); } } mark(); } }   /* RWFIX-1(코덱스 C E17): 달력·고정 계절을 바꾸면 그날 행사를 다시 셈(날짜만 보던 캐시) · 같은 행사면 한 것은 그대로 */
    const id = cur();
    if (id && A.storm && A.storm() && min() < 10 * 60) { const bd = [d - 1, d].find(b => baseId(b) === id && target(id, b) === d); if (bd != null && !s.mv[id + ':' + bd]) { s.mv[id + ':' + bd] = 1; mark(); const t9 = '🌀 ' + (en() ? 'A typhoon is here, so ' + L(EV[id].t) + ' moves to tomorrow.' : '태풍이 와서 ' + L(EV[id].t) + jo(L(EV[id].t), '을', '를') + ' 내일로 미뤄요.'); if (!(A.stormNote && A.stormNote(t9))) A.say(t9, 4, 1); s.d = -1; begin(); return; } }   /* TYPH-2 = 태풍 날 창 안 한 줄(따로 알림 X) */
    if (!id) return; if (!VIS.yard) { buildHouses(id); buildYard(id); }
    gatherSec(); hots(); fireSec(); moonSec();
    if (A.ready() && !A.busy() && !A.panel() && s.ann !== d && min() >= 6 * 60) { s.ann = d; mark(); A.say(EV[id].ic + ' ' + (en() ? 'Today is ' + L(EV[id].t) + '. ' + L(EV[id].todo[0]).split(' — ')[0] + ' and more in the ' + L(EV[id].t) + ' yard.' : '오늘은 ' + L(EV[id].t) + jo(L(EV[id].t), '이에요', '예요') + '. ' + L(EV[id].t) + ' 마당에서 ' + L(EV[id].todo[0]).split(' — ')[0] + jo(L(EV[id].todo[0]).split(' — ')[0], '을', '를') + ' 해 볼까요?'), 5, 1); hint(); }
    if (metD !== d && SLOT.length && min() >= 8 * 60) { const P = site(), me = A.me(); if (P && Math.hypot(me.x - P.x, me.z - P.z) < 18) { metD = d; const L9 = EV[id].lines, sl = SLOT.filter(i => i >= 0); sayN(sl[sl.length - 1], L(L9[0])); clearTimeout(metT); metT = setTimeout(() => { if (!dead && cur() === id) sayN(sl[0], L(L9[1 + (d % (L9.length - 1))])); }, 4200); } }
    if (chipT && performance.now() - chipT > 90000) { A.chip('twn-ssn', null); chipT = 0; } }

  // ───────── 아침 소식 · 달력 줄 ─────────
  function news(d) { const P = site(), at = P ? P.Q(0, 7.3) : null, id = idOn(d), nx = idOn(d + 1);
    if (id) { const E9 = EV[id]; return [{ k: 'season', t: [E9.ic + ' 오늘은 ' + E9.t[0] + jo(E9.t[0], '이에요', '예요') + '. ' + E9.todo[0][0].split(' — ')[0] + ', ' + E9.todo[1][0].split(' — ')[0] + ' 같이 해요', E9.ic + ' Today is ' + E9.t[1] + ': ' + E9.todo[0][1].split(' — ')[0].toLowerCase() + ' and more'], at }]; }
    if (nx) { const E9 = EV[nx]; return [{ k: 'season', t: [E9.ic + ' 내일은 ' + E9.t[0] + jo(E9.t[0], '이에요', '예요') + '. 이웃들이 ' + (nx === 'kim' ? '배추를 다듬고' : nx === 'chu' ? '햅쌀을 빻고' : nx === 'dano' ? '그네 줄을 매고' : nx === 'bor' ? '달집을 쌓고' : '한복을 꺼내고') + ' 있어요', E9.ic + ' Tomorrow is ' + E9.t[1] + '. The neighbours are getting ready'], at: null }]; }
    return []; }
  const calLine = () => { const d = day(), id = idOn(d); if (id) return EV[id].ic + ' ' + (en() ? 'Today is ' + L(EV[id].t) : '오늘은 ' + L(EV[id].t)); for (let i = 1; i <= 6; i++) { const q = idOn(d + i); if (q) return EV[q].ic + ' ' + (en() ? L(EV[q].t) + ' in ' + nightsW(i, 1) : L(EV[q].t) + '까지 ' + nightsW(i)); } return ''; };

  function dispose() { dead = true; clearTimeout(metT); clearTimeout(boutT); dropAll(); A.chip('twn-ssn', null); }
  function rebuild() { SITE = null; const id = cur(); dropAll(); if (id) { buildHouses(id); buildYard(id); } }
  return { sec, news, calLine, dispose, rebuild, open: () => openBoard(), idOn, has: () => true,
    info: () => { const s = S(), P = site(); return { day: day(), id: cur(), st: JSON.parse(JSON.stringify(s.st)), mv: { ...s.mv }, past: s.past.slice(), site: P ? [+P.x.toFixed(1), +P.z.toFixed(1), +P.ry.toFixed(2)] : null, vis: keys(VIS), hot: { ...HOTL }, slot: SLOT.slice(), houses: HS.map(h => [+h.hot[0].toFixed(1), +h.hot[1].toFixed(1)]), moon: MOON ? [+MOON.position.x.toFixed(0), +MOON.position.y.toFixed(0), +MOON.position.z.toFixed(0)] : null, flame: !!(FLAME && FLAME.visible), parts: keys(VIS).reduce((n, k) => n + VIS[k].g.length, 0) }; },
    dbg: { q: (...a) => { TQ.push(...a); }, use: id => (HOTF[id] && HOT[id] ? HOTF[id]() : null), dir: d => answerDir(d), orders: () => orders().map(q => q.ok), tq: () => TQ.slice(), kim: k => pickKim(k), at: (lx, lz) => { const P = site(); return P ? P.Q(lx, lz) : null; }, house: i => (HS[i] ? { at: HS[i].at.slice(), hot: HS[i].hot.slice(), sp: st().sp } : null), log: () => DBG.slice(), base: d => baseId(d), dayOf: (id, f) => dayOf(id, f == null ? day() : f) } };
}
