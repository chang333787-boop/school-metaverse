// 🎒 가방이 의미 있게(BAG-2 · 사용자 10-25 '인벤토리가 별로 의미가 없는 것 같아' · 성취 네 기둥 ① 계획하는 하루)
//   메인 진단: 모이기만 하고 써야 할 때가 없음 · 먹어도 아무 일 없음 · 쓸 곳이 가방에서 안 보임 · 가방 칸 제한은 하지 않음
//   ① 먹으면 힘(탐험 체력 town_stam.js와 잇기): 든든한 것(밥·감자·고구마) = 숨 한 칸 더(반나절) · 요리 = 한 칸 더(두세 시간)
//      과일·단것 = 숨이 조금 빨리 돌아옴(한두 시간) · 한 칸까지(겹쳐 쌓이지 않음 · 다시 먹으면 시간만 이어짐) · 물 위·벽에서는 못 먹음
//      '내일 기다리는 것'(town_day 손잡이 bagWait) = 어제 못 닿은 체력 목표가 한 칸 위면 '도시락 챙기기' 한 줄(본 것 = 실패 기록만 근거)
//   ② 이웃 부탁: 하루 하나(일찍 들어주면 둘째 하나) · 일꾼(몸 있음)이 그 일·계절에 맞는 것 n개를 오늘 18:00까지 · 가방(I)에서 곁의 일꾼에게 📦 드리기
//      가져다주면 = 마음 +1(rwCheck 'req:') + 다음 아침 문 앞 답례(town.js nbMark 'req' · 하루 하나 그대로) · 못 맞추면 '다음에 또'(벌 X)
//   ③ 쓸 곳 한 줄: 가방에서 물건을 누르면 아는 것만(장터에 가 봤으면 장터 값 · 들은 좋아함 · 열린 요리법 · 꾸러미 · 오늘 부탁 · 마당 · 먹으면) → 🧭 빨간 선
//   지키는 선: 판타지 X(효과 = '힘이 나요' 정도 · 실제 영양 사실) · 실명 X(이웃 = 일 이름) · 셈 문제 X · 아이콘·% X · 매 프레임 일 0(1초 칸 sec) · 새 Light X
//   마을 쪽이 넘기는 것(A): GAME · lang() · esc(t) · on() · busy() · panel() · tasksOn() · say(t, s) · toast(t, s) · sfx(k) · bubble(w, t) · route(p)
//     workers() · hkOf(w) · who(k) · me() · cell(x, z) · season() · canGet(e) · shopSell(e) [{ name, door }] · mush() [x, z] | null · market() [x, z] | null · kitchen() [x, z] | null · home() [x, z] | null
//     recipes() [[e, ko, en, need]] (열린 것만) · bundles() [{ B, need, put, done }] · openBundles() · nbMark(w, why, e) · heart(w, n, src) · tally(k)
//     stam() 상태 | null · stamFill() · stamShow(s) · stamBusy() · stamGraph() | null
import { GIFT_OF } from './town_news.js?v=11';
import { inSeason, seaKey } from './town_bundle.js?v=3';
import { ITEMS, itemName, won } from './town_game.js?v=43';
import { DECO } from './town_cozy.js?v=2';
export const BAG2_V = 1;
const T2 = (ko, en) => [ko, en];
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };
const hm = m => String(((m / 60) | 0) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// ① 먹을 것마다 효과: x = 숨 한 칸 더(0·1) · xm = 그 시간(게임 분) · f = 숨 돌아오는 빠르기(배) · fm = 그 시간 · why = 까닭(사실 한 줄)
//   든든한 것(녹말 · 반나절 = 360분) · 요리(단백질·채소 = 두세 시간) · 과일·단것(당 = 금방 · 짧게) — 효과는 놀이 속 어림(✨) · 과장 X
export const FOOD = {
  '🍙': { x: 1, xm: 360, why: T2('밥은 천천히 힘이 돼서 오래 든든해요', 'Rice gives energy slowly, so it keeps you going') },
  '🥔♨': { x: 1, xm: 360, why: T2('감자는 녹말이 많아 오래 든든해요', 'Potatoes are full of starch and keep you going') },
  '🍠♨': { x: 1, xm: 360, why: T2('고구마는 녹말이 많아 오래 든든해요', 'Sweet potatoes are full of starch and keep you going') },
  '🍠☀': { x: 1, xm: 240, why: T2('말린 고구마도 든든한 간식이에요', 'Dried sweet potato is a filling snack') },
  '🍲': { x: 1, xm: 240, why: T2('따뜻한 국이 몸을 데우고 든든해요', 'Warm soup heats you up and fills you') },
  '🐟♨': { x: 1, xm: 240, why: T2('생선은 몸을 튼튼하게 하는 단백질이 많아요', 'Fish has lots of protein for a strong body') },
  '🐟☀': { x: 1, xm: 240, why: T2('말린 생선도 단백질이 많아요', 'Dried fish has lots of protein too') },
  '🥞': { x: 1, xm: 180, why: T2('밀가루와 달걀이 든든해요', 'Flour and egg fill you up') },
  '🍓🥞': { x: 1, xm: 180, f: 1.5, fm: 90, why: T2('팬케이크는 든든하고 딸기는 금방 힘이 나요', 'Pancake fills you and strawberry gives quick energy') },
  '🥘': { x: 1, xm: 180, why: T2('버섯과 버터가 든든해요', 'Mushroom and butter fill you up') },
  '🥗': { x: 1, xm: 150, why: T2('산나물 반찬이 몸에 좋아요', 'Wild greens are good for you') },
  '🌽♨': { x: 1, xm: 180, why: T2('옥수수는 녹말이 많아 든든해요', 'Corn is starchy and filling') },
  '🍿': { x: 1, xm: 120, why: T2('옥수수로 만든 간식이라 조금 든든해요', 'A corn snack — a little filling') },
  '🍞': { x: 1, xm: 180, why: T2('빵은 밀가루라 든든해요', 'Bread is made of flour and fills you') },
  '🍞♨': { x: 1, xm: 180, why: T2('토스트는 밀가루라 든든해요', 'Toast is made of flour and fills you') },
  '🍄♨': { f: 1.5, fm: 120, why: T2('버섯구이는 가벼운 반찬이에요', 'Grilled mushroom is a light side dish') },
  '🍄☀': { f: 1.5, fm: 90, why: T2('말린 버섯은 가벼운 반찬이에요', 'Dried mushroom is a light side dish') },
  '🍃☀': { f: 1.5, fm: 90, why: T2('묵나물은 가벼운 반찬이에요', 'Dried greens are a light side dish') },
  '🍮': { f: 2, fm: 90, why: T2('달콤한 것은 금방 힘이 나요(오래가지는 않아요)', 'Sweet things give quick energy (it doesn’t last long)') },
  '🍦': { f: 2, fm: 60, why: T2('달콤한 것은 금방 힘이 나요(오래가지는 않아요)', 'Sweet things give quick energy (it doesn’t last long)') },
  '🍰': { f: 2, fm: 60, why: T2('달콤한 것은 금방 힘이 나요(오래가지는 않아요)', 'Sweet things give quick energy (it doesn’t last long)') },
  '🥤': { f: 2, fm: 60, why: T2('달콤한 음료는 금방 힘이 나요(오래가지는 않아요)', 'A sweet drink gives quick energy (it doesn’t last long)') },
  '🥤❄': { f: 2, fm: 60, why: T2('시원하고 달콤해서 금방 힘이 나요', 'Cool and sweet — quick energy') },
  '🥛❄': { f: 1.5, fm: 60, why: T2('시원한 우유 얼음이에요', 'A cool milk ice') },
  '🍓❄': { f: 2, fm: 90, why: T2('과일은 금방 힘이 나요', 'Fruit gives quick energy') },
  '🍓': { f: 2, fm: 120, why: T2('과일은 금방 힘이 나요', 'Fruit gives quick energy') },
  '🍐': { f: 2, fm: 120, why: T2('배는 물이 많고 달아서 금방 힘이 나요', 'Pears are juicy and sweet — quick energy') },
  '🍅': { f: 1.5, fm: 90, why: T2('방울토마토는 물이 많아 상큼해요', 'Cherry tomatoes are juicy and fresh') },
  '🥒': { f: 1.5, fm: 60, why: T2('오이는 물이 많아 시원해요', 'Cucumbers are full of water and cool') },
  '🥛': { f: 1.5, fm: 90, why: T2('우유 한 잔이에요', 'A glass of milk') },
};
export const RAW_OK = ['🍓', '🍐', '🍅', '🥒', '🥛'];   // 날로 먹어도 되는 먹거리(감자·쌀·버섯은 익혀야 함 → 먹기 단추 X)
export const LONG = Object.keys(FOOD).filter(e => FOOD[e].x && FOOD[e].xm >= 300);   // 도시락감(반나절)

// ② 이웃 부탁: 일 갈래마다 [물건, 수, 까닭] — 실제로 있는 음식·일(배숙·겉절이·김밥·굴김치…) · 자기 일에서 나는 것은 부탁하지 않음
const R = (e, n, ko, en) => ({ e, n, why: T2(ko, en) });
export const REQ = {
  shiitake: [R('🥬', 2, '표고 배춧국을 끓이려고요', 'I want to make shiitake and cabbage soup'), R('🥔', 2, '표고 감자볶음을 하려고요', 'I want to stir-fry shiitake with potatoes')],
  cabbage: [R('🧂', 2, '배추를 소금에 절이려고요', 'I need to salt the cabbages'), R('🐟', 1, '일 끝나고 생선을 구워 먹으려고요', 'I want to grill a fish after work')],
  potato: [R('🧂', 1, '감자를 삶을 때 소금을 조금 넣으려고요', 'A pinch of salt for boiling potatoes'), R('🐟', 1, '저녁 반찬으로 생선을 구우려고요', 'I want fish for dinner')],
  lumber: [R('🥔', 2, '쉬는 참에 감자를 쪄 먹으려고요', 'I want to steam potatoes on my break'), R('🍐', 1, '나무를 심다 보면 목이 말라요', 'Planting trees makes me thirsty')],
  beehive: [R('🍐', 1, '배에 꿀을 넣고 배숙을 만들려고요', 'I want to make baesuk — pear cooked with honey'), R('🍓', 2, '딸기에 꿀을 찍어 먹으려고요', 'I want to dip strawberries in honey')],
  pasture: [R('🍓', 2, '우유에 딸기를 갈아 딸기 우유를 만들려고요', 'I want to make strawberry milk'), R('🍚', 2, '점심밥을 지으려고요', 'I need rice for lunch')],
  saltpan: [R('🍚', 2, '점심에 주먹밥을 만들려고요', 'I want to make rice balls for lunch'), R('🥬', 1, '소금에 버무려 겉절이를 하려고요', 'I want to make fresh kimchi')],
  paddy: [R('🐟', 1, '저녁 반찬으로 생선을 구우려고요', 'I want fish for dinner'), R('🌿', 2, '김에 밥을 싸 먹으려고요', 'I want to wrap rice in laver')],
  strawberry: [R('🥛', 1, '딸기 우유를 만들려고요', 'I want to make strawberry milk'), R('🍯', 1, '딸기잼에 꿀을 조금 넣으려고요', 'A little honey for strawberry jam')],
  pear: [R('🍯', 1, '배숙을 만들려고요', 'I want to make baesuk'), R('🥛', 1, '배를 갈아 우유에 넣으려고요', 'I want to blend pear into milk')],
  fisher: [R('🧂', 2, '생선을 소금에 절여 두려고요', 'I need to salt the fish'), R('🍚', 2, '배에서 먹을 주먹밥을 만들려고요', 'I want rice balls to eat on the boat')],
  clam: [R('🥔', 1, '조갯국에 감자를 넣으려고요', 'I want potato in my clam soup'), R('🥬', 1, '조개 배춧국을 끓이려고요', 'I want to make clam and cabbage soup')],
  seaweed: [R('🍚', 2, '김밥을 말려고요', 'I want to roll gimbap'), R('🥬', 1, '김 무침에 배추를 곁들이려고요', 'I want cabbage with my laver side dish')],
  oyster: [R('🥬', 2, '굴을 넣은 김치를 담그려고요', 'I want to make oyster kimchi'), R('🍚', 2, '굴밥을 지으려고요', 'I want to cook oyster rice')],
};
export const REQ_DUE = 18 * 60, REQ_T0 = 6 * 60 + 30, REQ_2ND = 15 * 60;   // 오늘 저녁 6시까지 · 아침 6:30부터 붙음 · 둘째는 15:00 전에 첫째를 들어주면
const STAMN = { R1: T2('바다 뗏목', 'the sea raft'), R2: T2('작은 바위섬', 'the little rock island'), R3: T2('등표 바위', 'the beacon rock'), C1: T2('밧줄 바위', 'the rope rock'), C2: T2('산 중턱 바위벽', 'the mountainside rock wall'), C3: T2('정상 바위탑', 'the summit rock tower') };

export function createBag(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, now = () => G().min | 0, abs = () => day() * 1440 + now(), mark = () => A.GAME.mark();
  const DBG = []; const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const S = () => { const g = G(); let s = g.bag2; if (!s || typeof s !== 'object' || s.v !== BAG2_V) s = g.bag2 = { v: BAG2_V, fx: { x: 0, xT: 0, f: 1, fT: 0, e: '' }, rq: { d: 0, L: [] }, kn: { mk: null, eat: {} }, miss: {} }; if (!s.fx) s.fx = { x: 0, xT: 0, f: 1, fT: 0, e: '' }; if (!s.rq || !Array.isArray(s.rq.L)) s.rq = { d: 0, L: [] }; if (!s.kn) s.kn = { mk: null, eat: {} }; if (!s.kn.eat) s.kn.eat = {}; if (!s.miss) s.miss = {}; return s; };
  let USE = [], dead = false;

  // ───────── ① 먹으면 힘 ─────────
  const extra = () => { const f = S().fx; return f.x > 0 && abs() < f.xT ? 1 : 0; };
  const fast = () => { const f = S().fx; return f.f > 1 && abs() < f.fT ? f.f : 1; };
  const edible = e => !!FOOD[e] && (RAW_OK.includes(e) || ['dish', 'treat'].includes((ITEMS[e] || [])[2]));
  const canEatNow = () => !(A.stamBusy && A.stamBusy());
  function fxText(e, untilX, untilF) { const F = FOOD[e]; if (!F) return ''; const p = []; if (F.x) p.push(en() ? 'one more breath ring' + (untilX ? ' until ' + hm(untilX % 1440) : '') : '숨이 한 칸 더 길어요' + (untilX ? '(' + hm(untilX % 1440) + '까지)' : ''));
    if (F.f > 1) p.push(en() ? 'breath comes back faster' + (untilF ? ' until ' + hm(untilF % 1440) : '') : '숨이 조금 빨리 돌아와요' + (untilF ? '(' + hm(untilF % 1440) + '까지)' : '')); return p.join(en() ? ', ' : ' · '); }
  function fxPlain(e) { const F = FOOD[e]; if (!F) return ''; const h = m => (m >= 300 ? T2('반나절', 'half a day') : m >= 150 ? T2('두세 시간', 'a few hours') : T2('한두 시간', 'an hour or two')); const p = [];
    if (F.x) p.push(en() ? 'one more breath ring for ' + L(h(F.xm)) : '숨 한 칸 더 · ' + L(h(F.xm))); if (F.f > 1) p.push(en() ? 'breath back faster for ' + L(h(F.fm)) : '숨이 빨리 돌아옴 · ' + L(h(F.fm))); return p.join(en() ? ', ' : ', '); }
  /* 먹기: town.js eatDish가 GAME.take 뒤에 부름 → 배너 꼬리 한 줄 · 땅에서 먹으면 숨이 바로 다 참 */
  function eat(e) { const F = FOOD[e]; if (!F) return ''; const s = S(), f = s.fx, t = abs(); if (F.x) { f.x = 1; f.xT = Math.max(f.xT > t ? f.xT : 0, t + F.xm); } if (F.f > 1) { f.f = Math.max(fast(), F.f); f.fT = Math.max(f.fT > t ? f.fT : 0, t + F.fm); } f.e = e; s.kn.eat[e] = day(); mark();
    if (A.stamFill) A.stamFill(); if (A.stamShow) A.stamShow(2.6); log('eat ' + e + ' x' + extra() + ' f' + fast());
    return L(F.why) + (en() ? '. ' : '. ') + fxText(e, F.x ? f.xT : 0, F.f > 1 ? f.fT : 0); }
  function fxNow() { const s = S(), f = s.fx, t = abs(), o = []; if (f.x > 0 && t < f.xT) o.push(en() ? 'one more breath ring until ' + hm(f.xT % 1440) : '숨 한 칸 더 ' + hm(f.xT % 1440) + '까지'); if (f.f > 1 && t < f.fT) o.push(en() ? 'faster breath until ' + hm(f.fT % 1440) : '숨이 빨리 돌아옴 ' + hm(f.fT % 1440) + '까지'); return o.join(' · '); }
  /* 가방 윗줄(먹은 힘이 남았을 때만) */
  function bagLine() { const t = fxNow(); return t ? '<div class="sm" data-bfx="1" style="font-weight:700;color:#7a4a12">😋 ' + esc(t) + '</div>' : ''; }

  // 도시락 계획: 어제(본 것) 못 닿은 목표 가운데 지금 칸 + 1에서 닿는 것
  function lunchGoal() { const st = A.stam && A.stam(), g = A.stamGraph && A.stamGraph(); if (!st || !g) return null; const s9 = G().stam || {}, fail = s9.fail || {}; let best = null;
    for (const q of g.stamps || []) { if (st.got[q.id] || q.k !== st.n + 1 || !fail[q.id]) continue; if (!best || q.k < best.k) best = q; } return best; }
  const longIn = () => LONG.filter(e => A.GAME.count(e) > 0);
  function wait(d0, pre) { void d0; const q = lunchGoal(); if (!q) return null; const nm = STAMN[q.id] || T2('그 목표', 'that goal'), hav = longIn(), k9 = A.kitchen && A.kitchen(), e = en();
    const t = hav.length ? T2('도시락 챙기기: 가방에 ' + jo(itemName(hav[0], false), '이', '가') + ' 있어요. 먹고 가면 숨이 한 칸 더 길어서 ' + nm[0] + '에 닿을 수 있어요', 'Pack a lunch: you have ' + itemName(hav[0], true) + '. Eat it first — one more breath ring gets you to ' + nm[1])
      : T2('도시락 챙기기: ' + nm[0] + '에 다시 가려면 주먹밥·군고구마·구운 감자를 먹고 가요. 숨이 한 칸 더 길어요(반나절)', 'Pack a lunch: to try ' + nm[1] + ' again, eat a rice ball, roasted sweet potato or roasted potato first — one more breath ring for half a day');
    const p = hav.length ? { icon: '🍙', name: L(nm), en: nm[1], door: [q.x, q.z] } : (k9 ? { icon: '🍳', name: e ? 'House with a kitchen' : '부엌 있는 집', en: 'House with a kitchen', door: k9 } : null);
    S().kn.tip = day(); mark(); return { k: 'lunch', ic: '🍙', s: T2('도시락', 'Lunch'), t, p }; }

  // ───────── ② 이웃 부탁 ─────────
  const who = k => A.who(k), wById = q => { const W = A.workers(); return W.find(w => A.hkOf(w) === q.hk) || W.find(w => w.k === q.k && Math.hypot(w.x - q.x, w.z - q.z) < 3) || null; };
  const NO = { stall: 1, stones: 1, cook: 1 };
  function srcOf(e, skipK, from) { const me = from || A.me(), sea = A.season(); let b = null, bd = 1e18; const W = A.workers();
    for (const w of W) { if (!w.k || w.k === skipK || GIFT_OF[w.k] !== e || NO[w.k] || w.rep === false || w.out9 || !inSeason(w.k, sea)) continue; const d = (w.x - me.x) ** 2 + (w.z - me.z) ** 2; if (d < bd) { bd = d; b = { icon: e, name: who(w.k) + (en() ? '' : ' 일꾼'), en: who(w.k) + ' worker', door: [w.x, w.z] }; } }
    if (b) return b; if (e === '🍄') { const m = A.mush && A.mush(); if (m) return { icon: '🍄', name: en() ? 'Mushrooms' : '버섯 나는 곳', en: 'Mushrooms', door: m }; }
    const sh = A.shopSell ? A.shopSell(e) : []; if (sh && sh.length) { let c = null, cd = 1e18; for (const q of sh) { const d = (q.door[0] - me.x) ** 2 + (q.door[1] - me.z) ** 2; if (d < cd) { cd = d; c = q; } } return { icon: '🛒', name: c.name, en: c.name, door: c.door }; }
    return null; }
  const rng = seed => { let r = (seed * 2654435761 + 977) >>> 0; return () => (r = (r * 1103515245 + 12345) >>> 0) / 4294967296; };
  function pick(d, skip) { const W = A.workers(), seen = G().cells || {}, used = new Set(skip.map(q => q.k)), C = [];
    for (const w of W) { if (!w.k || NO[w.k] || !REQ[w.k] || w.rep === false || w.out9 || used.has(w.k)) continue; let o = null, od = 1e18; for (const r of REQ[w.k]) { if (r.e === GIFT_OF[w.k] || !A.canGet(r.e)) continue; const q = srcOf(r.e, w.k, { x: w.x, z: w.z }); if (!q) continue; const d9 = Math.hypot(q.door[0] - w.x, q.door[1] - w.z); if (d9 < od) { od = d9; o = r; } } if (!o) continue;   /* 구하는 곳이 그 이웃에게서 가까운 것부터 */ C.push({ w, o, met: !!seen[A.cell(w.x, w.z)] }); }
    if (!C.length) return null; const yk = (S().last || {}).k, M = C.filter(c => c.met && c.w.k !== yk), N = C.filter(c => c.w.k !== yk), P = M.length ? M : N.length ? N : C, rn = rng(d * 7 + skip.length); P.sort((a, b) => (a.w.x - b.w.x) || (a.w.z - b.w.z)); const c2 = P[(rn() * P.length) | 0];   /* 가 본 칸의 이웃 먼저 · 어제 부탁한 이웃은 쉼 */
    return { k: c2.w.k, hk: A.hkOf(c2.w), x: +c2.w.x.toFixed(1), z: +c2.w.z.toFixed(1), e: c2.o.e, n: c2.o.n, why: c2.o.why, due: REQ_DUE, st: 'open', said: 0, d }; }
  function today() { const s = S(); return s.rq.d === day() ? s.rq.L : []; }
  function make() { const s = S(), d = day(); if (s.rq.d !== d) { const y = s.rq.L.filter(q => q.st !== 'done' && q.said); for (const q of y) s.miss[q.hk] = d; s.rq = { d, L: [] }; }   /* 어제 못 들어준 것 = '다음에 또' 한 번 */
    const L9 = s.rq.L; if (now() < REQ_T0) return; if (!L9.length) { const q = pick(d, []); if (q) { L9.push(q); s.last = { d, k: q.k }; mark(); log('req ' + q.k + ' ' + q.e + q.n); } return; }
    if (L9.length === 1 && L9[0].st === 'done' && (L9[0].at || 0) < REQ_2ND && now() < REQ_2ND) { const q = pick(d, L9); if (q) { L9.push(q); mark(); log('req2 ' + q.k + ' ' + q.e + q.n); setTimeout(() => { if (!dead && A.on()) A.toast('📦 ' + (en() ? 'Another neighbour has a small request: ' : '다른 이웃도 작은 부탁이 있대요: ') + reqShort(q), 3.6); }, 1200); } } }
  const reqShort = q => (en() ? who(q.k) + ' worker — ' + q.n + ' ' + itemName(q.e, true) : who(q.k) + ' 일꾼 — ' + itemName(q.e, false) + ' ' + q.n + '개');
  const reqAsk = q => (en() ? 'Could you bring me ' + q.n + ' ' + itemName(q.e, true) + '? ' + q.why[1] + '. By 6 pm today would be great.' : itemName(q.e, false) + ' ' + q.n + '개 가져다줄래요? ' + q.why[0] + '. 오늘 저녁 6시까지면 좋아요.');
  function reqFor(w) { if (!w) return null; const hk = A.hkOf(w); return today().find(q => q.hk === hk && q.st === 'open') || null; }
  function lateFix() { if (now() < REQ_DUE) return; let ch = false; for (const q of today()) if (q.st === 'open') { q.st = 'late'; ch = true; } if (ch) mark(); }
  /* 가방 윗줄(곁의 일꾼이 부탁한 이웃이면) — 📦 단추 */
  function deliverHtml(w) { lateFix(); const q = reqFor(w); if (!q) { const hk = w && A.hkOf(w), z = hk && today().find(r => r.hk === hk && r.st === 'late'); return z ? '<div class="sm">' + esc(en() ? 'The request was for today by 18:00 — they said maybe next time.' : '오늘 18:00까지였던 부탁이에요. 다음에 또 부탁한대요.') + '</div>' : ''; }
    const have = A.GAME.count(q.e), ok = have >= q.n;
    return '<div class="sm" data-breq="1" style="background:#eef4fb;border:2px solid #1d3557;border-radius:8px;padding:6px 8px;font-weight:700">📦 ' + esc(en() ? 'Request: ' + q.n + ' ' + itemName(q.e, true) + ' (you have ' + have + ')' : '부탁: ' + itemName(q.e, false) + ' ' + q.n + '개(가방에 ' + have + '개)') + ' <button class="' + (ok ? 'pri' : 'sub') + '" data-rqd="1" style="min-height:34px;padding:3px 10px"' + (ok ? '' : ' disabled') + '>' + esc(en() ? 'Give' : '드리기') + '</button></div>'; }
  function deliver(w) { lateFix(); const q = reqFor(w); if (!q) return false; if (A.GAME.count(q.e) < q.n) { A.say(en() ? '📦 Not enough yet — ' + q.n + ' needed' : '📦 아직 모자라요. ' + q.n + '개가 있어야 해요', 2.4); return false; }
    for (let i = 0; i < q.n; i++) A.GAME.take(q.e, 1); q.st = 'done'; q.at = now(); mark(); A.nbMark(w, 'req', q.e); A.heart(w, 1, 'req:' + q.k); if (A.tally) A.tally('gift'); A.sfx('ding');
    A.bubble(w, en() ? 'Thank you! I’ll leave a little thank-you at your door tomorrow morning.' : '고마워요! 내일 아침에 문 앞에 작은 답례를 둘게요.'); A.say('📦 ' + (en() ? 'You brought the ' + itemName(q.e, true) + '. A thank-you comes tomorrow morning.' : itemName(q.e, false) + jo(itemName(q.e, false), '을', '를') + ' 가져다줬어요. 내일 아침에 답례가 와요.'), 3.2); log('done ' + q.k); return true; }
  function goReq(i) { const q = today()[i]; if (!q) return false; const w = wById(q), have = A.GAME.count(q.e); if (q.st === 'open' && have < q.n) { const p = srcOf(q.e, q.k); if (p) { A.route(p); return true; } }
    const at = w ? [w.x, w.z] : [q.x, q.z]; A.route({ icon: '📦', name: who(q.k) + (en() ? ' worker' : ' 일꾼'), en: who(q.k) + ' worker', door: at }); return true; }
  function rowHtml(q, i) { const e = en(), have = A.GAME.count(q.e), dn = q.st === 'done', lt = q.st === 'late';
    const sub = dn ? (e ? 'Brought — a thank-you comes tomorrow morning' : '가져다줬어요. 내일 아침에 답례가 와요') : lt ? (e ? 'Missed the time — they’ll ask again another day' : '시간이 지났어요. 다음에 또 부탁한대요') : (e ? q.why[1] + '. You have ' + have + '.' : q.why[0] + '. 가방에 ' + have + '개.');
    const btn = !dn && !lt ? '<button class="sub" data-rq="' + i + '">🧭 ' + (have >= q.n ? (e ? 'To the neighbour' : '이웃에게') : (e ? 'Where to get it' : '구하는 곳')) + '</button>' : '';
    return '<div class="st"' + (dn || lt ? ' style="opacity:.6"' : '') + '><span><small>📦 ' + esc(e ? 'Neighbour’s request · by 18:00' : '이웃 부탁 · 18:00까지') + '</small><br><b>' + esc(reqShort(q)) + '</b><br><small>' + esc(sub) + '</small></span>' + btn + '</div>'; }
  function tasksHtml() { lateFix(); const L9 = today(); return L9.map(rowHtml).join(''); }
  function boardHtml() { lateFix(); const L9 = today(); if (!L9.length) return ''; return '<div class="sm" style="margin-top:6px"><b>' + esc(en() ? 'Today’s small requests' : '오늘 이웃 부탁') + '</b></div>' + L9.map(rowHtml).join(''); }
  function due(d) { if (d !== day()) return null; const q = today().find(r => r.st === 'open'); if (!q) return null; const w = wById(q);
    return { m: q.due, ic: '📦', s: T2('부탁 마감', 'Request due'), t: T2(who(q.k) + ' 일꾼 부탁(' + itemName(q.e, false) + ' ' + q.n + '개) 마감', who(q.k) + ' worker’s request (' + q.n + ' ' + itemName(q.e, true) + ') due'), p: { icon: '📦', name: who(q.k) + ' 일꾼', en: who(q.k) + ' worker', door: w ? [w.x, w.z] : [q.x, q.z] } }; }
  const key = () => today().map(q => q.k + q.st[0]).join(',');

  // ───────── ③ 쓸 곳 한 줄(아는 것만) ─────────
  function uses(e) { const e9 = en(), I = ITEMS[e] || [], out = [], s = S();
    for (const q of today()) if (q.e === e && q.st === 'open') { const w = wById(q); out.push({ ic: '📦', t: e9 ? 'Today’s request: ' + reqShort(q) + ' by 18:00' : '오늘 부탁: ' + reqShort(q) + '(18:00까지)', p: { icon: '📦', name: who(q.k) + ' 일꾼', en: who(q.k) + ' worker', door: w ? [w.x, w.z] : [q.x, q.z] } }); }
    if (edible(e) && s.kn.eat[e]) out.push({ ic: '😋', t: (e9 ? 'If you eat it: ' : '먹으면: ') + fxPlain(e) + (e9 ? ' — ' : '. ') + L(FOOD[e].why) });
    else if (edible(e) && LONG.includes(e) && s.kn.tip) out.push({ ic: '😋', t: e9 ? 'A filling lunch — one more breath ring' : '든든한 도시락감이에요. 숨 한 칸 더' });
    if (I[3] > 0 && s.kn.mk) out.push({ ic: '🛒', t: e9 ? 'Sells at the market for about ' + won(I[3]) : '장터에서 ' + won(I[3]) + '쯤에 팔려요', p: { icon: '🛒', name: e9 ? 'market' : '장터', en: 'market', door: s.kn.mk } });
    const NK = G().nbk || {}; let nl = 0; for (const hk in NK) { const r = NK[hk]; if (!r || !Array.isArray(r.l) || !r.l.includes(e) || nl >= 2) continue; const w = A.workers().find(q => A.hkOf(q) === hk); if (!w || !w.k) continue; nl++; out.push({ ic: '🎁', t: e9 ? 'The ' + who(w.k) + ' worker said they like it' : who(w.k) + ' 일꾼이 좋아한다고 했어요', p: { icon: '🎁', name: who(w.k) + ' 일꾼', en: who(w.k) + ' worker', door: [w.x, w.z] } }); }
    const kt = A.kitchen && A.kitchen(); for (const r of (A.recipes ? A.recipes() : [])) { const n = r[3] && r[3][e]; if (!n) continue; out.push({ ic: '🍳', t: e9 ? 'Ingredient for ' + r[2] + ' (' + n + ')' : r[1] + ' 재료(' + n + '개)', p: kt ? { icon: '🍳', name: e9 ? 'House with a kitchen' : '부엌 있는 집', en: 'House with a kitchen', door: kt } : null }); if (out.length > 7) break; }
    for (const row of (A.bundles ? A.bundles() : [])) { if (row.done || !row.need[e] || (row.put[e] || 0) >= row.need[e]) continue; out.push({ ic: '🧺', t: e9 ? 'Goes in the ' + row.B.t[1] + ' (' + (row.put[e] || 0) + '/' + row.need[e] + ')' : row.B.t[0] + '에 넣을 수 있어요(' + (row.put[e] || 0) + '/' + row.need[e] + ')', a: 'bun' }); }
    if (DECO[e]) { const h = A.home && A.home(); out.push({ ic: '🏡', t: e9 ? 'You can put it in our yard' : '우리 집 마당에 놓을 수 있어요', p: h ? { icon: '🏡', name: e9 ? 'our house' : '우리 집', en: 'our house', door: h } : null }); }
    return out.slice(0, 7); }
  /* 가방 창 안 '쓸 곳' 칸(.bg-use)에 그 물건의 줄 · 🧭 = 빨간 선 · 꾸러미 = 꾸러미 창 */
  function useShow(P9, e) { const box = P9 && P9.querySelector('.bg-use'); if (!box) return false; USE = uses(e); const e9 = en();
    box.innerHTML = '<div style="font-weight:800;margin-bottom:3px">' + e + ' ' + esc(itemName(e, e9)) + (e9 ? ' — where it’s useful' : ' — 쓸 곳') + '</div>' + (USE.length ? USE.map((u, i) => '<div class="bg-u" style="display:flex;gap:8px;align-items:center;margin:3px 0"><span style="flex:1">' + u.ic + ' ' + esc(u.t) + '</span>' + (u.p ? '<button class="sub" data-ug="' + i + '" style="min-height:34px;padding:2px 9px">🧭</button>' : u.a === 'bun' ? '<button class="sub" data-ug="' + i + '" style="min-height:34px;padding:2px 9px">🧺</button>' : '') + '</div>').join('')
      : '<div>' + esc(e9 ? 'You don’t know a use yet. Visit a market or listen to neighbours.' : '아직 쓸 곳을 몰라요. 장터에 가 보거나 이웃 이야기를 들어 봐요.') + '</div>');
    box.style.display = ''; for (const c of P9.querySelectorAll('[data-use]')) c.style.outline = c.dataset.use === e ? '3px solid #ff5a36' : ''; A.sfx('tick'); log('use ' + e + ' ' + USE.length); return true; }
  function useGo(i) { const u = USE[i]; if (!u) return false; if (u.a === 'bun') { A.openBundles(); return true; } if (!u.p) return false; A.closeP(); A.route(u.p); return true; }
  const useBox = () => '<div class="bg-use sm" style="display:none;background:#fffaf0;border:2px solid #2b2420;border-radius:8px;padding:6px 8px;margin:6px 0"></div>';
  const tapHint = () => '<div class="sm" style="opacity:.8">' + esc(en() ? 'Tap a thing to see where it’s useful.' : '물건을 누르면 쓸 곳이 보여요.') + '</div>';
  function sawMarket(at) { const s = S(); s.kn.mk = [+at[0].toFixed(1), +at[1].toFixed(1)]; mark(); }

  // ───────── 1초 칸: 부탁 붙이기 · 곁을 지나면 부탁 말 · 어제 못 들어준 이웃 = '다음에 또' ─────────
  let sq = 0;
  function sec() { if (dead || !A.on()) return; if (A.tasksOn && !A.tasksOn()) return; make(); lateFix(); if ((sq = (sq + 1) % 2)) return; if (A.busy() || A.panel()) return;
    const me = A.me(), s = S();
    for (const q of today()) { if (q.st !== 'open' || q.said) continue; const w = wById(q); if (!w || Math.hypot(w.x - me.x, w.z - me.z) > 7) continue; q.said = 1; mark(); A.bubble(w, reqAsk(q)); A.say('📦 ' + reqAsk(q) + (en() ? ' (Bag I → Give)' : ' (가방 I → 드리기)'), 4.2); log('ask ' + q.k); return; }
    for (const hk in s.miss) { if (s.miss[hk] !== day()) continue; const w = A.workers().find(q => A.hkOf(q) === hk); if (!w || Math.hypot(w.x - me.x, w.z - me.z) > 6) continue; delete s.miss[hk]; mark(); A.bubble(w, en() ? 'About yesterday — no worries. I’ll ask again another time.' : '어제 부탁은 괜찮아요. 다음에 또 부탁할게요.'); log('miss ' + hk); return; } }
  function dispose() { dead = true; }
  return { extra, fast, edible, canEatNow, eat, fxNow, bagLine, wait, lunchGoal, reqFor, deliverHtml, deliver, goReq, tasksHtml, boardHtml, due, key, uses, useShow, useGo, useBox, tapHint, sawMarket, sec, dispose,
    wk: k => { const me = A.me(); let b = null, bd = 1e18; for (const w of A.workers()) { if (w.k !== k || w.rep === false) continue; const d = (w.x - me.x) ** 2 + (w.z - me.z) ** 2; if (d < bd) { bd = d; b = w; } } return b && { x: b.x, z: b.z, g: b.g }; },   /* 시험 손잡이 */
    today: () => JSON.parse(JSON.stringify(today())), state: () => JSON.parse(JSON.stringify(S())), make, dbg: () => DBG.slice() };
}
