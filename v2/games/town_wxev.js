// 🌡 날씨 사건(WXEV-1 · 설계 docs/systems/town_wxev.md · 태풍(town_typhoon.js)과 같은 꼴: 예보 → 대비 → 그날 → 뒤 결과)
//   사건 한 줄 = 사건 하나(EV 표) · 할 일 갈래는 JOB 표(desk 물품 · ask 본 것으로 말하기 · side 자리 고르기 · post 알림 붙이기 · time 때 맞추기 · fill 채우기 · clear 눈 치우기 · tap 한 번 손)
//   🥵 폭염(여름 · 사흘): 어르신 댁 안부 · 무더위 쉼터 알림 · 가축 그늘막·물 · 텃밭 물은 아침·저녁 → 그날 한낮(12~16시) 밖에 오래 있으면 땀·숨참(말 한 줄) · 그늘·쉼터로 → 뒤 결과
//   ❄️ 폭설(겨울 · 이틀): 제설함 채우기 · 정류장 버스 알림 → 그날 눈 쌓인 길(느려짐 · 비탈에서 뛰면 미끄러짐) · 어디부터 치울지(삽·빗자루 = town_tools.js) → 치운 길만 다음 날 녹아 있음
//   지킴: 사실만(안전 수칙·실제 대비) · 판타지 X · 무서움 X(사람·동물 늘 무사) · 숫자·% 표시 X(때만) · 실명 X(이웃 = 하는 일 · 임시 몸 = 이름 없는 역할) · 새 Light X · 매 프레임 일 0(1초 칸) · 홍보판 X(A.on)
//   겹침: 태풍 판 동안 시작 X(태풍도 이 판 동안 시작 X — A.other) · 잔치 날(town_feast.js fd)이 그날이면 시작을 미루고, 대비 중에 겹치면 하루 늦춤
export const WX_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const WX = { work: [8, 19], hall: [9, 18], gap: 14, first: 5, chance: 4, heat: [12 * 60, 16 * 60], tired: 25, snowEnd: 13 * 60, stroke: 25, strokeN: 3, wrong: 20, slipV: 5.6, slipG: 0.1 };
/* 일하는 때 · 센터 창구 · 다음 판까지 날 · 처음 판 날 · 아침 넷에 하나 · 한낮 · 밖에서 지친다(1초 칸 수) · 눈 치우기 마감(밟혀 다져지기 전) · 한 삽 분 · 한 곳 삽 수(제설함 채운 곳 = 하나 덜) · 틀린 자리 분 · 미끄러지는 빠르기(m/s) · 비탈(기울기) */

// ───────── 사건 표(한 줄 = 사건 하나) — 새 사건 = 줄 하나 + plan 하나(docs §5 씨앗 줄: 한파·가뭄·황사) ─────────
//   sea 계절 · evK 그날(k) · resK 결과 날 · endK 끝 · wx 그날 날씨 · fc[k] 예보 · jobs 대비·그날 할 일 갈래(plan이 자리를 고름)
export const EV = {
  heat: { ic: '🥵', t: T2('폭염', 'Heatwave'), sea: ['summer'], evK: 3, resK: 4, endK: 6, wx: 'clear', fc: { 2: 'clear', 3: 'clear' },
    radio: T2('아침 라디오: 모레까지 아주 더운 날이 이어져요. 모레 한낮(낮 12시~4시쯤)이 가장 더워요. 물을 자주 마시고, 한낮엔 밖에 오래 있지 말고, 혼자 계신 어르신 안부를 살펴 주세요. 무더위 쉼터가 문을 열어요.', 'Morning radio: very hot days until the day after tomorrow, hottest around midday (12 to 4). Drink water often, avoid long stays outside at midday, and check on older neighbours living alone. Cooling shelters will open.'),
    jobs: ['elder', 'elder', 'paper', 'post', 'shade', 'trough', 'garden'] },
  snow: { ic: '❄️', t: T2('폭설', 'Heavy snow'), sea: ['winter'], evK: 2, resK: 3, endK: 5, wx: 'snow', fc: { 2: 'snow', 3: 'clear' },
    radio: T2('아침 라디오: 내일 새벽부터 눈이 많이 와요. 비탈길과 버스 정류장이 미끄러울 수 있고, 버스가 늦거나 쉴 수 있어요. 제설함에 모래를 채워 두고, 눈은 사람이 밟아 다지기 전에 치우면 덜 얼어요.', 'Morning radio: heavy snow from early tomorrow. Slopes and bus stops may be slippery, and buses may be late or stop. Fill the grit boxes, and clear snow before people pack it down so it freezes less.'),
    jobs: ['bags', 'box', 'box', 'box', 'notice', 'clear', 'clear', 'clear', 'clear', 'clear'] },
};
// 할 일 갈래: ic · 이름 · 몇 분 · 어느 날(k ≤ 이 날까지 · 그날 할 일은 ev) · 결과 줄(했음/놓침) · 이웃 말(고마움/다음엔)
const JOB = {
  elder: { ic: '👵', t: T2('어르신 댁 안부 여쭙기', 'Check on an older neighbour'), m: 15, till: 3 },
  paper: { ic: '📄', t: T2('무더위 쉼터 알림 받기', 'Get the cooling-shelter notice'), m: 10, till: 3 },
  post: { ic: '📌', t: T2('무더위 쉼터 문 연다고 알리기', 'Post that the cooling shelter is open'), m: 10, till: 3 },
  shade: { ic: '⛱', t: T2('목장 그늘막 치기', 'Put up shade at the farm'), m: 30, till: 3 },
  trough: { ic: '🚰', t: T2('목장 물통 가득 채우기', 'Fill the farm water trough'), m: 15, till: 3 },
  garden: { ic: '🌱', t: T2('텃밭 물 주기(아침·저녁)', 'Water the garden (morning or evening)'), m: 15, till: 3 },
  bags: { ic: '🧰', t: T2('제설 모래 받기', 'Get grit bags'), m: 10, till: 1 },
  box: { ic: '📦', t: T2('제설함 채우기', 'Fill a grit box'), m: 15, till: 1 },
  notice: { ic: '🚏', t: T2('정류장에 버스 알림 붙이기', 'Post a bus notice at the stop'), m: 10, till: 1 },
  clear: { ic: '⛏', t: T2('눈 치우기', 'Clear snow'), m: 0, till: 2 },
};
// 어르신 댁에서 보이는 것(본 것) → 맞는 말(사실: 폭염 안전 수칙)
const OBS = {
  cup: { see: T2('식탁 위 물컵이 비어 있어요. "목은 안 마르단다."', 'The cup on the table is empty. “I’m not thirsty.”'), adv: 'drink' },
  field: { see: T2('문 앞에 호미와 모자가 있어요. "점심 먹고 밭 매러 가야지."', 'A hoe and hat by the door. “I’ll weed the field after lunch.”'), adv: 'noon' },
  fan: { see: T2('선풍기가 멈춰 있고 방이 후끈해요. "고장 났나 봐."', 'The fan has stopped and the room is stuffy. “I think it’s broken.”'), adv: 'shelter' },
  coat: { see: T2('두꺼운 긴 옷을 입고 계세요.', 'They are wearing a thick long-sleeved top.'), adv: 'cloth' },
};
const ADV = {
  drink: T2('목이 마르지 않아도 물을 자주 조금씩 드세요', 'Sip water often, even if you’re not thirsty'),
  noon: T2('낮 12시~4시 한낮엔 밭일을 쉬고 아침·저녁에 하세요', 'Skip field work 12 to 4 and do it morning or evening'),
  shelter: T2('한낮엔 무더위 쉼터에서 시원하게 계세요', 'Spend midday at the cooling shelter'),
  cloth: T2('헐렁하고 밝은 색 얇은 옷으로 갈아입으세요', 'Change into loose, light-coloured thin clothes'),
};
const NOTE = [
  { ok: 1, t: T2('내일은 눈 때문에 버스가 늦거나 쉴 수 있어요. 걸어서 가는 길을 미리 알아 두세요.', 'Tomorrow buses may be late or stop because of snow. Know your walking route.') },
  { ok: 0, t: T2('내일도 버스는 늘 오던 때에 와요.', 'Tomorrow buses come at the usual times.'), why: T2('라디오 예보와 달라요. 예보에서 버스가 어떻게 된다고 했나요?', 'That is not what the radio said. What did the forecast say about buses?') },
  { ok: 0, t: T2('눈길에선 미끄러우니 찻길 가운데로 걸어요.', 'Snowy pavements are slippery, so walk in the middle of the road.'), why: T2('찻길은 차가 미끄러져 더 위험해요. 다시 골라 봐요.', 'Cars slide on snowy roads — that is more dangerous. Choose again.') },
];
const CSS = `.twn-p .wx-r{border:2px solid #b9c7d4;border-radius:12px;background:#f8fbff;padding:6px 10px;margin:6px 0;line-height:1.45}.twn-p .wx-r.done{opacity:.6}.twn-p .wx-r b{font-size:15px}
.twn-p .wx-ch{display:grid;gap:8px;margin:6px 0}.twn-p .wx-ch button{min-height:46px;font-size:15px;text-align:left}.twn-p .wx-see{background:#fff8e6;border-left:4px solid #e0a23a;padding:4px 8px;margin:6px 0}
.twn-p canvas.wx-map{display:block;width:100%;max-width:520px;height:auto;border-radius:8px;margin:4px 0}`;

// 마을 쪽이 넘기는 것(A): map · GAME · on() · lang() · esc · openP · closeP · panel() · busy() · say(t, s, l) · sfx(k) · bubble(o, t)
//   places() · houses() [{ name, door, c }] · stops() [[x, z, sch]] · farm() { at } | null · gate() · inSchool · inb() · land · gy · road(x, z) · water(x, z) · cell · mapSnip · route(p)
//   season() 놀이 계절 · setWx(w) · wx() · skUp(k, n, src) · taskEv(ev) · diary(t) · buildParts(fn) · shade(x, z) 나무·정류장 지붕 밑 · slow(on) · hold(k) 도구 들기 · puff(x, y, z, cols, up)
//   typhOn() 태풍 판 중 · feastDay() 잔치 날 | 0 · bike() 자전거 중
export function createWxEv(A) {
  const map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t == null ? '' : t)), esc = t => A.esc(t);
  const G = () => A.GAME, day = () => G().S.day | 0, now = () => G().S.min | 0, mark = () => G().mark();
  const S = () => { const g = G().S; let s = g.wxev; if (!s || typeof s !== 'object' || s.v !== WX_V) s = g.wxev = { v: WX_V, n: 0, cur: null, last: {}, log: [], mem: {} }; if (!s.last || typeof s.last !== 'object') s.last = {}; if (!Array.isArray(s.log)) s.log = []; if (!s.mem || typeof s.mem !== 'object') s.mem = {}; return s; };
  const C = () => S().cur, E = () => (C() ? EV[C().k] : null);
  let dead = false, css = null, VIS = [], HOT = [], VKEY = '', DBG = [], said = {}, lastP = null, slowOn = false, sweatT = 0;
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const me = () => map.player.pos();
  const K = () => { const c = C(); return c ? day() - c.d0 + 1 : 0; };
  const evDay = d => { const c = C(); return !!c && (d == null ? day() : d) === c.d0 + EV[c.k].evK - 1; };
  if (!document.getElementById('wx-css')) { css = document.createElement('style'); css.id = 'wx-css'; css.textContent = CSS; document.head.appendChild(css); }

  // ───────── 자리 고르기(판 시작 때 한 번 · 저장) — 판에 없는 곳은 그 할 일이 저절로 빠짐 ─────────
  const P = () => A.places() || [];
  const doorOf = p => (p.door ? [p.door[0], p.door[1]] : [p.x, p.z]);
  const findP = re => P().filter(p => p && p.name && re.test(p.name) && p.kind !== 'area' && !A.inSchool(p.x, p.z));
  const landNear = (x, z, R9) => { if (A.land(x, z)) return [x, z]; for (let r = 0.8; r <= (R9 || 4); r += 0.8) for (let a = 0; a < 12; a++) { const xx = x + Math.cos(a * 0.5236) * r, zz = z + Math.sin(a * 0.5236) * r; if (A.land(xx, zz)) return [xx, zz]; } return null; };
  const r1 = a => [+(+a[0]).toFixed(2), +(+a[1]).toFixed(2)];
  const far = (p, L9, d) => L9.every(q => !q || Math.hypot(q[0] - p[0], q[1] - p[1]) >= d);
  const kidHouse = n => /네(\s|$)|집$/.test(n || '');
  const grade = (x, z) => { const t = A.ty || A.gy, y0 = t(x - 3, z), y1 = t(x + 3, z), y2 = t(x, z - 3), y3 = t(x, z + 3); return Math.max(Math.abs(y1 - y0), Math.abs(y3 - y2)) / 6; };   /* 땅 높이만(담·방음벽 윗면 X) */
  function planHeat(seed) { const R9 = rng('wxh:' + seed), out = [], gate = A.gate();
    const shP = findP(/노인정|경로당/)[0] || findP(/행정복지|주민센터/)[0] || null, shelter = shP ? { nm: shP.name, at: r1(doorOf(shP)) } : null;
    const hallP = findP(/행정복지|주민센터/).sort((a, b) => (shelter ? Math.hypot(a.x - shelter.at[0], a.z - shelter.at[1]) - Math.hypot(b.x - shelter.at[0], b.z - shelter.at[1]) : 0))[0] || shP;
    // 어르신 댁 둘: 이름 없는 집 가운데 쉼터(없으면 정문)에 가까운 둘 · 서로 20m 넘게
    const base = shelter ? shelter.at : gate, HS = (A.houses() || []).filter(h => h && h.door && !kidHouse(h.name) && !A.inSchool(h.door[0], h.door[1])).sort((a, b) => Math.hypot(a.door[0] - base[0], a.door[1] - base[1]) - Math.hypot(b.door[0] - base[0], b.door[1] - base[1]));
    const OK = Object.keys(OBS), took = [];
    for (const h of HS) { if (took.length >= 2) break; const st = landNear(h.door[0] + (h.door[0] - h.c[0]) * 0.25, h.door[1] + (h.door[1] - h.c[1]) * 0.25, 3); if (!st || !far(st, took.map(q => q.at), 20)) continue;
      const a = OK[(R9() * 4) | 0]; let b = OK[(R9() * 4) | 0]; if (b === a) b = OK[(OK.indexOf(a) + 1 + took.length) % 4]; took.push({ k: 'elder', at: r1(st), site: r1(h.door), obs: [a, b] }); }
    out.push(...took);
    if (hallP && shelter) { const hd = doorOf(hallP), st = landNear(hd[0] + 1.6, hd[1] + 1.6, 4) || hd; out.push({ k: 'paper', at: r1(st), site: r1(hd), nm: hallP.name }); const sd = landNear(shelter.at[0] - 1.4, shelter.at[1] + 1.4, 3) || shelter.at; out.push({ k: 'post', at: r1(sd), site: shelter.at, nm: shelter.nm }); }
    // 목장: 우리 남쪽 = 그늘막 맞는 자리(한낮 해 = 남쪽 하늘) · 북쪽 = 틀린 자리 · 물통 = 동쪽
    { const f = findP(/목장|축사|외양간/)[0]; if (f) { const c = [f.x, f.z], so = landNear(c[0], c[1] + 6, 4), no = landNear(c[0], c[1] - 6, 4), tr = landNear(c[0] + 5, c[1], 4);
      if (so && no && tr && Math.hypot(so[0] - no[0], so[1] - no[1]) > 4) { out.push({ k: 'shade', at: r1(c), site: r1(c), spots: [r1(so), r1(no)], ok: 0, nm: f.name }); out.push({ k: 'trough', at: r1(tr), site: r1(tr), nm: f.name }); } } }
    // 텃밭: 마을 텃밭(없으면 학교 텃밭)
    { const g = findP(/텃밭|채소밭/)[0], at = g ? landNear(doorOf(g)[0], doorOf(g)[1], 4) : (A.farm() ? A.farm().at : null); if (at) out.push({ k: 'garden', at: r1(at), site: r1(at), nm: g ? g.name : T2('학교 텃밭', 'the school garden'), wet: [] }); }
    return { jobs: out, shelter, hall: hallP ? hallP.name : '' }; }
  function planSnow(seed) { const R9 = rng('wxs:' + seed), gate = A.gate(), out = [];
    // 비탈: 정문 둘레 길 위에서 가장 가파른 곳(한 번만 훑음)
    let slope = null, bg = 0, bs = -1; const t0 = performance.now(); for (let x = gate[0] - 420; x <= gate[0] + 420; x += 8) for (let z = gate[1] - 420; z <= gate[1] + 420; z += 8) { const g = grade(x, z), dd = Math.hypot(x - gate[0], z - gate[1]), sc = Math.min(g, 0.15) - dd / 6000; if (sc <= bs || A.inSchool(x, z) || !A.road(x, z) || !A.land(x, z) || (A.ty && Math.abs(A.gy(x, z) - A.ty(x, z)) > 0.4)) continue; bs = sc; bg = g; slope = [x, z]; }   /* 땅 기울기 먼저(싸다) → 길·땅 · 가파른 길(0.15 넘으면 같게 침) 가운데 정문에 가까운 곳 */
    const school = (() => { for (let d = 5; d <= 16; d += 1.5) { const p = [gate[0], gate[1] + d]; if (!A.inSchool(p[0], p[1]) && A.land(p[0], p[1])) return p; } return landNear(gate[0], gate[1] + 8, 6); })();
    const SP = (A.stops() || []).filter(q => !A.inSchool(q[0], q[1]) && !q[2]).sort((a, b) => Math.hypot(a[0] - gate[0], a[1] - gate[1]) - Math.hypot(b[0] - gate[0], b[1] - gate[1]));
    const stop = (() => { for (const q of SP) { const fx = q[3] || 0, fz = q[4] || 0, p = landNear(q[0] + fx * 1.8 + fz * 2.6, q[1] + fz * 1.8 - fx * 2.6, 2.4); if (p && far(p, [slope, school], 30)) return p; } return null; })();   /* 정류장 지붕 밑 X — 타고 내리는 길가 옆 */
    const HS = (A.houses() || []).filter(h => h && h.door && !A.inSchool(h.door[0], h.door[1])).sort((a, b) => Math.hypot(a.door[0] - gate[0], a.door[1] - gate[1]) - Math.hypot(b.door[0] - gate[0], b.door[1] - gate[1]));
    let alley = null; for (const h of HS) { const p = landNear(h.door[0] + (h.door[0] - h.c[0]) * 0.3, h.door[1] + (h.door[1] - h.c[1]) * 0.3, 3); if (p && far(p, [slope, school, stop], 35) && grade(p[0], p[1]) < WX.slipG) { alley = p; break; } }
    let park = null; for (const q of findP(/공원|놀이터|광장|쉼터/)) { const p = landNear(doorOf(q)[0], doorOf(q)[1], 4); if (p && far(p, [slope, school, stop, alley], 35)) { park = { p, nm: q.name }; break; } }
    const near = p => { let b = null, bd = 60; for (const q of P()) { if (!q.name || q.kind === 'area' || q.kind === 'house' || kidHouse(q.name) || A.inSchool(q.x, q.z)) continue; const d = Math.hypot(q.x - p[0], q.z - p[1]); if (d < bd) { bd = d; b = q; } } return b ? b.name : ''; };
    const SPT = [['slope', slope, 1, T2('비탈길', 'the slope')], ['stop', stop, 1, T2('버스 정류장', 'the bus stop')], ['school', school, 1, T2('학교 가는 길(정문 앞)', 'the way to school (gate)')], ['alley', alley, 0, T2('집 앞 골목', 'the lane by the houses')], ['park', park && park.p, 0, T2(park ? park.nm + ' 앞' : '공터', park ? 'by ' + park.nm : 'the open lot')]];
    for (const [w, p, imp, nm] of SPT) { if (!p) continue; const nb = near(p); out.push({ k: 'clear', w, at: r1(p), site: r1(p), imp, nm, nb, left: WX.strokeN, slope: w === 'slope' ? +bg.toFixed(3) : 0 }); }
    // 제설함 셋(비탈 · 정류장 · 골목) — 모래는 둘뿐 · 어디에 채울지 판단
    for (const w of ['slope', 'stop', 'alley']) { const q = out.find(o => o.w === w); if (!q) continue; const p = landNear(q.at[0] + 2.2, q.at[1] + 1.2, 3) || q.at; out.push({ k: 'box', w, at: r1(p), site: r1(p), nm: q.nm, full: 0 }); }
    const hallP = findP(/행정복지|주민센터/)[0] || findP(/노인정|경로당|마을회관/)[0]; if (hallP) { const hd = doorOf(hallP), st = landNear(hd[0] + 1.6, hd[1] + 1.6, 4) || hd; out.unshift({ k: 'bags', at: r1(st), site: r1(hd), nm: hallP.name }); }
    if (stop) { const p = landNear(stop[0] - 1.6, stop[1] + 1.2, 3) || stop; out.push({ k: 'notice', at: r1(p), site: r1(p), nm: T2('버스 정류장', 'the bus stop') }); }
    void R9; log('slope scan ' + (performance.now() - t0).toFixed(0) + 'ms'); return { jobs: out, slope: slope ? r1(slope) : null, grade: +bg.toFixed(3), hall: hallP ? hallP.name : '' }; }

  // ───────── 판 시작·날 ─────────
  function start(k, why) { const s = S(), d = day(), R = EV[k]; if (!R) return null; const p = (k === 'heat' ? planHeat : planSnow)(d + ':' + (s.n | 0) + ':' + (G().S.v || 0));
    s.n = (s.n | 0) + 1; s.cur = { k, d0: d, n: s.n, jobs: p.jobs.map((q, i) => ({ ...q, id: q.k + i, st: '', mis: 0 })), shelter: p.shelter || null, mat: { n: 0, d: 0 }, res: null, said: {}, body: { t: 0, tired: 0, rest: 0, long: 0, warn: 0 }, slip: 0, fc: 0, shift: 0 };
    mark(); VKEY = ''; log('start ' + k + ' ' + d + ' ' + why + ' jobs ' + p.jobs.map(q => q.k).join(',') + (p.grade != null ? ' grade ' + p.grade : '')); return info(); }
  const seaOk = k => EV[k].sea.includes(A.season());
  function want(force) { const s = S(), d = day(); if (s.cur || window.SM_PROMO || now() > 11 * 60 || (A.typhOn && A.typhOn())) return null;
    for (const k of Object.keys(EV)) { if (!seaOk(k)) continue; const l = s.last[k] | 0; if (!force && (l ? d - l < WX.gap : d < WX.first)) continue; if (!force && hashS('wxev:' + k + ':' + d) % WX.chance) continue;
      const fd = A.feastDay ? A.feastDay() | 0 : 0; if (fd && fd >= d && fd <= d + EV[k].evK - 1) { log('feast skip ' + k + ' ' + d); continue; } return k; } return null; }
  function onDay() { if (dead || !A.on()) return; said = {}; let c = C();
    if (!c) { const k = want(); if (k) start(k, 'auto'); c = C(); if (!c) return; }
    const k = K(), R = E();
    if (k < R.evK) { const fd = A.feastDay ? A.feastDay() | 0 : 0; if (fd && evDay(fd)) { c.d0++; c.shift++; mark(); A.say(R.ic + ' ' + (en() ? 'The forecast changed: the ' + L(R.t).toLowerCase() + ' comes a day later, after the feast.' : '예보가 바뀌었어요. ' + L(R.t) + '은 잔치 다음 날로 하루 늦게 와요.'), 4, 1); log('shift feast ' + fd); } }
    if (K() === R.evK) { A.setWx(R.wx); c.said.ev = 0; mark(); }
    if (K() === R.resK && !c.res) result();
    if (K() > R.endK) finish();
    VKEY = ''; }
  function finish() { const s = S(), c = s.cur; if (!c) return; s.log.unshift({ k: c.k, n: c.n, d0: c.d0, ok: c.jobs.filter(q => q.st === 'done').map(q => q.k), miss: c.jobs.filter(q => q.st !== 'done').map(q => q.k) }); s.log.length = Math.min(s.log.length, 6); s.last[c.k] = day(); s.cur = null; mark(); clearVis(); slowSet(false); log('finish ' + day()); }

  // ───────── 시간 ─────────
  function spend(m) { const t = now() + m; if (t > WX.work[1] * 60) return false; G().waitMin(t); A.sfx('tick'); A.say('⏳ ' + (en() ? m + ' minutes passed' : m + '분이 지났어요'), 2.2); return true; }
  const late = m => now() < WX.work[0] * 60 || now() + m > WX.work[1] * 60;
  const lateMsg = () => A.say(now() < WX.work[0] * 60 ? (en() ? '🌙 Too early — neighbours start at 08:00' : '🌙 아직 일러요. 이웃들은 8시부터 일해요') : (en() ? '🌙 It is late — let’s do it tomorrow' : '🌙 날이 저물었어요. 내일 해요'), 3);
  const openJobs = () => { const c = C(); if (!c) return []; const k = K(), R = E(); return c.jobs.filter(q => q.st !== 'done' && (q.k === 'clear' ? k === R.evK : k <= JOB[q.k].till)); };
  const reward = () => { A.skUp('work', 1, 'case:wxev'); A.taskEv('wxev'); };
  function done(q, msg) { q.st = 'done'; q.dd = day(); mark(); A.sfx('ding'); reward(); if (msg) A.say(L(msg), 3.4); VKEY = ''; log('done ' + q.id); }
  function wrong(q, why) { q.mis = (q.mis | 0) + 1; mark(); A.sfx('tick'); const ok = spend(WX.wrong); A.say('🤔 ' + L(why) + (ok ? (en() ? ' (20 minutes lost)' : ' (20분이 더 걸렸어요)') : ''), 4.2); log('wrong ' + q.id); }
  const job = id => (C() ? C().jobs.find(q => q.id === id || q.k === id) : null);

  // ───────── 모습(합친 부품 · 상태가 바뀔 때만 다시 지음) · E 자리 ─────────
  function clearVis() { for (const g of VIS) { map.remove(g); g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); } VIS = []; for (const h of HOT) h.remove(); HOT = []; VKEY = ''; }
  const add = (g, x, z, ry, y) => { g.position.set(x, y == null ? A.gy(x, z) : y, z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); VIS.push(g); return g; };
  const hot = (x, z, label, use, r) => { const h = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 2.0, label, use }); HOT.push(h); return h; };
  const P3 = fn => A.buildParts(fn);
  const elderBody = () => P3(put => { for (const sg of [-1, 1]) put('b', sg * 0.09, 0, 0, 0.12, 0.78, 0.12, 0x5a5048); put('c', 0, 0.78, 0, 0.18, 0.55, 0, 0x8a6a9a); for (const sg of [-1, 1]) put('b', sg * 0.23, 0.84, 0.02, 0.08, 0.46, 0.08, 0x8a6a9a); put('s', 0, 1.48, 0, 0.16, 1, 0, 0xf2c9a0); put('s', 0, 1.53, -0.01, 0.17, 0.75, 0, 0xd8d4cc); put('b', 0.3, 0, 0.12, 0.04, 0.9, 0.04, 0x6b5238); });
  const deskP = () => P3(put => { for (const sx of [-0.45, 0.45]) put('b', sx, 0, 0, 0.06, 0.7, 0.5, 0x8a6a4a); put('b', 0, 0.7, 0, 1.0, 0.05, 0.6, 0xd9c7a5); put('b', -0.25, 0.75, 0, 0.3, 0.2, 0.22, 0xc9b48a); put('b', 0.22, 0.75, 0.05, 0.36, 0.02, 0.26, 0xffffff); });
  const boardP = paper => P3(put => { put('b', 0, 0, 0, 0.08, 1.5, 0.08, 0x6b5238); put('b', 0, 1.1, 0.02, 0.8, 0.6, 0.05, 0x9a7a52); if (paper) put('b', 0, 1.12, 0.06, 0.6, 0.44, 0.02, paper); });
  const frameP = cloth => P3(put => { for (const [a, b] of [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]]) put('b', a, 0, b, 0.08, 2.0, 0.08, 0x7a5a3a); if (cloth) put('b', 0, 2.0, 0, 3.0, 0.05, 2.2, 0x3f8f5a); else put('c', 1.4, 0.05, 1.3, 0.12, 0.9, 0, 0x3f8f5a, 0, 0, 1.5708); });
  const troughP = full => P3(put => { put('b', 0, 0, 0, 1.6, 0.45, 0.6, 0x8a9096); if (full) put('b', 0, 0.38, 0, 1.44, 0.04, 0.46, 0x5aa8e0); });
  const boxP = full => P3(put => { put('b', 0, 0, 0, 0.9, 0.7, 0.6, 0xe6b422); put('b', 0, 0.7, 0, 0.96, 0.06, 0.66, 0x2f6b3a); if (full) put('b', 0, 0.76, 0, 0.5, 0.14, 0.3, 0xc9b48a); });
  const moundP = left => P3(put => { const f = Math.max(0.25, left / WX.strokeN); put('b', 0, 0, 0, 3.4, 0.06, 2.4, 0xf4f8fb); [[-0.9, 0.35, 0xffffff], [0.2, -0.45, 0xeef4f9], [0.95, 0.4, 0xffffff], [0.05, 0.5, 0xf4f8fb], [-0.35, -0.25, 0xffffff]].forEach(([dx, dz, cl], i) => put('s', dx, 0.02, dz, 0.5 + 0.28 * f - i * 0.03, 0.3 + 0.14 * f, 0, cl)); });   /* 둥근 눈 더미(삽 수만큼 낮아짐) */
  const iceP = () => P3(put => { put('b', 0, 0.02, 0, 3.4, 0.04, 2.4, 0xcfe6f2); put('b', 0.4, 0.05, 0.2, 1.4, 0.02, 0.9, 0xe6f3fa); });
  const wetP = () => P3(put => { put('b', 0, 0.02, 0, 3.2, 0.03, 2.2, 0x5f646a); });
  const pileP = () => P3(put => { put('s', 0, 0, 0, 0.8, 0.5, 0, 0xf4f8fb); put('s', 0.3, 0.2, 0.1, 0.45, 0.6, 0, 0xffffff); });   /* 치운 눈을 길가에 모은 더미 */
  function sync() { if (!A.on()) return; const c = C(), k = K(), key = c ? [c.n, k, A.lang(), c.jobs.map(q => q.st + (q.left == null ? '' : q.left) + (q.full | 0)).join(''), c.res ? 1 : 0, c.mat.d === day() ? c.mat.n : '', c.paper | 0].join('|') : '';
    if (key === VKEY) return; clearVis(); VKEY = key; if (!c) return; const R = E(), pre = k < R.evK, isEv = k === R.evK, after = k >= R.resK;
    for (const q of c.jobs) { const J = JOB[q.k], open = q.st !== 'done' && k <= J.till;
      if (q.k === 'elder' && open) { add(elderBody(), q.at[0], q.at[1], Math.atan2(q.site[0] - q.at[0], q.site[1] - q.at[1]) + Math.PI); if (open) hot(q.at[0], q.at[1], '👵 ' + (en() ? 'Older neighbour — ' : '어르신 댁 — ') + L(J.t), () => talkElder(q), 2.4); }
      if ((q.k === 'paper' || q.k === 'bags') && open) { add(deskP(), q.at[0], q.at[1], 0); hot(q.at[0], q.at[1] + 0.8, J.ic + ' ' + L(J.t), () => deskUse(q), 2.2); }
      if (q.k === 'post') { add(boardP(q.st === 'done' ? 0xfff2a8 : 0), q.at[0], q.at[1], 0); if (open) hot(q.at[0], q.at[1], '📌 ' + L(J.t), () => postUse(q), 1.8); }
      if (q.k === 'notice') { add(boardP(q.st === 'done' ? 0xdfeefc : 0), q.at[0], q.at[1], 0); if (open) hot(q.at[0], q.at[1], '🚏 ' + L(J.t), () => noticeUse(q), 1.8); }
      if (q.k === 'shade') { if (q.st === 'done') add(frameP(true), q.spots[q.ok][0], q.spots[q.ok][1], 0); else if (open) q.spots.forEach((p, i) => { add(frameP(false), p[0], p[1], 0); hot(p[0], p[1], '⛱ ' + (en() ? 'Put the shade up on this side' : '이쪽에 그늘막 치기'), () => shadeUse(q, i), 2.0); }); }
      if (q.k === 'trough') { add(troughP(q.st === 'done'), q.at[0], q.at[1], 0); if (open) hot(q.at[0], q.at[1], '🚰 ' + L(J.t), () => troughUse(q), 1.8); }
      if (q.k === 'garden' && open) hot(q.at[0], q.at[1], '🌱 ' + L(J.t), () => gardenUse(q), 2.2);
      if (q.k === 'box') { add(boxP(!!q.full), q.at[0], q.at[1], 0); if (pre && !q.full) hot(q.at[0], q.at[1], '📦 ' + L(q.nm) + ' ' + (en() ? 'grit box — fill it' : '제설함 채우기'), () => boxUse(q), 1.6); }
      if (q.k === 'clear') { if (isEv && q.st !== 'done') { add(moundP(q.left), q.at[0], q.at[1], 0); hot(q.at[0] + 0.01, q.at[1] + 0.01, '⛏ ' + L(q.nm) + (en() ? ' — clear the snow (shovel 2 · broom 5)' : ' — 눈 치우기(삽 2 · 빗자루 5)'), () => clearHint(q), 2.4); }
        if (isEv && q.st === 'done') { add(pileP(), q.at[0] + 2.4, q.at[1] - 1.6, 0); }
        if (after && c.res) add(q.st === 'done' ? wetP() : iceP(), q.at[0], q.at[1], 0); } }
    log('sync ' + key + ' vis ' + VIS.length + ' hot ' + HOT.length); }

  // ───────── 🥵 폭염 할 일 ─────────
  function talkElder(q) { if (A.panel() || A.busy()) return; if (late(JOB.elder.m)) { lateMsg(); return; } const e = en(), c = C(); let picked = [];
    const want = q.obs.map(o => OBS[o].adv), opts = Object.keys(ADV).sort((a, b) => hashS(a + q.id + c.n) - hashS(b + q.id + c.n));
    const draw = () => '<h3>👵 ' + (e ? 'Checking on an older neighbour' : '어르신 댁 안부') + '</h3><div class="pc-tx">' + esc(e ? '“Oh, you came to see me in this heat? I’m fine, I’m fine.”' : '"이 더위에 와 줬구나. 나는 괜찮단다."') + '</div>'
      + '<div class="sm">' + esc(e ? 'What you see:' : '보이는 것:') + '</div>' + q.obs.map(o => '<div class="wx-see">' + esc(L(OBS[o].see)) + '</div>').join('')
      + '<div class="sm">' + esc(e ? 'Pick the two tips that fit what you saw.' : '본 것에 맞는 말 두 가지를 골라 말씀드려요.') + '</div><div class="wx-ch">' + opts.map(a => '<button class="sub" data-v="' + a + '"' + (picked.includes(a) ? ' disabled' : '') + '>' + esc(L(ADV[a])) + '</button>').join('') + '</div><div class="sm" data-m></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Later' : '다음에') + '</button></div>';
    const W = A.openP(draw(), false, 'wxelder'), msg = t => { const m = W.querySelector('[data-m]'); if (m) m.textContent = t; };
    W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const v = b.dataset.v; if (!v) return;
      if (!want.includes(v)) { q.mis = (q.mis | 0) + 1; mark(); A.sfx('tick'); msg(e ? '“That’s good advice, but it’s not what I need now. What did you see here?”' : '"좋은 말이지만 지금 나한테 맞는 건 아니구나. 여기서 본 걸 떠올려 보렴."'); return; }
      picked.push(v); A.sfx('pop'); if (picked.length < 2) { W.innerHTML = draw(); msg(e ? '“I see. And what else?”' : '"그렇구나. 또?"'); return; }
      A.closeP(); spend(JOB.elder.m); done(q, T2('👵 "그렇게 하마. 들러 줘서 고맙다."', '👵 “I’ll do that. Thank you for stopping by.”')); }; }
  function deskUse(q) { if (A.panel() || A.busy()) return; const e = en(), c = C(), h = now() / 60; if (h < WX.hall[0] || h >= WX.hall[1]) { A.say('🌙 ' + (e ? 'The centre hands things out 09:00–18:00' : '행정복지센터는 9시~6시에 나눠 줘요'), 2.8); return; } if (late(10)) { lateMsg(); return; }
    if (q.k === 'paper') { c.paper = 1; spend(10); done(q, T2('📄 무더위 쉼터 알림을 받았어요. 쉼터 앞 게시판에 붙여요.', '📄 Got the cooling-shelter notice. Post it on the board at the shelter.')); return; }
    if (c.mat.d !== day()) { c.mat.d = day(); c.mat.n = 0; } if (c.mat.n >= 2) { A.say('🧰 ' + (e ? 'You already got today’s two bags — everyone shares.' : '오늘 몫 두 자루는 받았어요. 다 같이 나눠 써요.'), 3); return; }
    c.mat.n = 2; c.bags = (c.bags | 0) + 2; spend(10); done(q, T2('🧰 제설 모래 두 자루를 받았어요. 제설함은 셋, 모래는 둘 — 어디가 더 미끄러울까요?', '🧰 Two grit bags. Three boxes, two bags — where will it be most slippery?')); }
  function postUse(q) { if (A.panel() || A.busy()) return; const c = C(); if (!c.paper) { log('post nopaper'); A.say('📄 ' + (en() ? 'Get the notice at the community centre first.' : '먼저 행정복지센터에서 알림을 받아 와요.'), 3); return; } if (late(10)) { lateMsg(); return; } spend(10); done(q, T2('📌 "무더위 쉼터 — 낮 동안 시원하게 쉬어 가세요" 알림을 붙였어요.', '📌 Posted: “Cooling shelter — come in and rest in the cool during the day.”')); }
  function shadeUse(q, i) { if (A.panel() || A.busy()) return; if (late(JOB.shade.m)) { lateMsg(); return; } if (i !== q.ok) { wrong(q, T2('여긴 우리 북쪽이라 한낮엔 해가 반대편(남쪽 하늘)에서 비춰 그늘이 안 생겨요. 한낮 해가 있는 쪽을 가려야 해요.', 'This is the north side. At midday the sun is in the southern sky, so no shade falls here. Block the side the midday sun comes from.')); return; }
    spend(JOB.shade.m); done(q, T2('⛱ 남쪽에 그늘막을 쳤어요. 한낮에도 소들이 그늘에서 쉴 수 있어요.', '⛱ Shade up on the south side. The cows can rest in the shade at midday.')); }
  function troughUse(q) { if (A.panel() || A.busy()) return; if (late(JOB.trough.m)) { lateMsg(); return; } spend(JOB.trough.m); done(q, T2('🚰 물통을 가득 채웠어요. 더운 날엔 동물도 물을 훨씬 많이 마셔요.', '🚰 Trough full. Animals drink much more water on hot days.')); }
  const goodWater = m => m < 10 * 60 || m >= 17 * 60;
  function watered(q, how) { const m = now(); if (q.st === 'done') return false;
    if (!goodWater(m)) { q.mis = (q.mis | 0) + 1; mark(); A.sfx('tick'); A.say('🤔 ' + (en() ? 'At this time of day the water dries up fast before reaching the roots. Water in the morning or evening.' : '이때 준 물은 뿌리까지 가기 전에 금방 말라 버려요. 아침 일찍이나 해 질 무렵에 줘요.'), 4.2); log('water bad ' + how); return false; }
    if (how === 'e') spend(JOB.garden.m); done(q, T2('🌱 서늘할 때 물을 줘서 뿌리까지 스며들었어요.', '🌱 Watered while it was cool, so it soaked down to the roots.')); return true; }
  function gardenUse(q) { if (A.panel() || A.busy()) return; if (late(JOB.garden.m)) { lateMsg(); return; } watered(q, 'e'); }
  // ───────── ❄️ 폭설 할 일 ─────────
  function boxUse(q) { if (A.panel() || A.busy()) return; const c = C(); if (!(c.bags > 0)) { A.say('🧰 ' + (en() ? 'You need a grit bag from the community centre.' : '제설 모래가 있어야 해요. 행정복지센터에서 받아요.'), 3); return; } if (late(JOB.box.m)) { lateMsg(); return; }
    c.bags--; q.full = 1; spend(JOB.box.m); done(q, T2('📦 제설함에 모래를 채웠어요. 눈이 오면 미끄러운 데 뿌려요.', '📦 Grit box filled. When it snows, spread it where it is slippery.')); }
  function noticeUse(q) { if (A.panel() || A.busy()) return; if (late(JOB.notice.m)) { lateMsg(); return; } const e = en(), L9 = NOTE.slice().sort((a, b) => hashS(L(a.t) + C().n) - hashS(L(b.t) + C().n));
    const W = A.openP('<h3>🚏 ' + esc(L(JOB.notice.t)) + '</h3><div class="sm">' + esc(e ? 'Which notice should go on the bus stop board?' : '정류장 게시판에 어떤 알림을 붙일까요?') + '</div><div class="wx-ch">' + L9.map((o, i) => '<button class="sub" data-i="' + i + '">' + esc(L(o.t)) + '</button>').join('') + '</div><div class="sm" data-m></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'wxnote');
    W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const o = L9[+b.dataset.i]; if (!o) return; if (!o.ok) { q.mis = (q.mis | 0) + 1; mark(); A.sfx('tick'); const m = W.querySelector('[data-m]'); if (m) m.textContent = L(o.why); return; }
      A.closeP(); spend(JOB.notice.m); done(q, T2('🚏 버스 알림을 붙였어요. 기다리던 이웃이 "미리 알아서 다행이네" 해요.', '🚏 Notice posted. A waiting neighbour says, “Good to know ahead.”')); }; }
  function clearHint(q) { if (A.panel() || A.busy()) return; if (A.hold) A.hold('shovel'); A.say('⛏ ' + (en() ? 'Shovel in hand — aim at the snow pile and press click or F. Each scoop takes time.' : '삽을 들었어요. 눈 더미를 겨눠 클릭·F로 퍼내요. 한 삽마다 시간이 들어요.'), 3.6); void q; }
  function stroke(q, tool) { const c = C(); if (!c || !evDay() || q.st === 'done') return false; if (now() >= WX.snowEnd) { A.say('👣 ' + (en() ? 'People have walked on it all morning — the snow is packed hard now. Clear it earlier next time.' : '사람들이 다니며 밟아서 눈이 단단히 다져졌어요. 다음엔 더 일찍 치워요.'), 4); return false; }
    if (now() < WX.work[0] * 60) { lateMsg(); return false; } const box = c.jobs.find(o => o.k === 'box' && o.w === q.w && o.full);
    q.left = Math.max(0, (q.left == null ? WX.strokeN : q.left) - 1 - (box && q.left === WX.strokeN ? 1 : 0)); mark(); spend(WX.stroke); VKEY = ''; log('stroke ' + q.id + ' ' + tool + ' left ' + q.left);
    if (q.left <= 0) { done(q, box ? T2('⛏ 다 치우고 제설함 모래도 뿌렸어요. 이제 덜 미끄러워요.', '⛏ Cleared, and you spread grit from the box. Much less slippery now.') : T2('⛏ 이 길 눈을 다 치웠어요. 지나가던 이웃이 "고맙다!" 해요.', '⛏ This path is clear. A passing neighbour says “Thank you!”')); }
    else A.say('⛏ ' + (en() ? 'Some snow cleared — keep going.' : '눈을 조금 퍼냈어요. 더 퍼내요.') + (box && q.left === WX.strokeN - 2 ? (en() ? ' The grit from the box helps.' : ' 제설함 모래 덕분에 빨라요.') : ''), 2.4); return true; }
  // 도구 띠(town_tools.js) 손잡이: 겨눈 자리 가까운 눈 더미 · 쓰면 한 삽
  const toolApi = { near: (x, z, k) => { if ((k !== 'shovel' && k !== 'broom') || !evDay() || C().k !== 'snow') return null; let b = null, bd = 2.6; for (const q of C().jobs) { if (q.k !== 'clear' || q.st === 'done') continue; const d = Math.hypot(q.at[0] - x, q.at[1] - z); if (d < bd) { bd = d; b = q; } } return b ? { x: b.at[0], y: A.gy(b.at[0], b.at[1]) + 0.3, z: b.at[1], id: b.id } : null; },
    use: (k, id) => { const q = job(id); return q ? stroke(q, k) : false; } };
  function tap(k) { const c = C(); if (!c || c.k !== 'heat' || k !== 'can-bed') return; const q = c.jobs.find(o => o.k === 'garden' && o.st !== 'done'); if (q && K() <= JOB.garden.till) watered(q, 'can'); }

  // ───────── 그날 몸 ─────────
  function slowSet(on) { if (on === slowOn) return; slowOn = on; if (A.slow) A.slow(on); }
  function heatSec() { const c = C(), m = me(), b = c.body, t = now(), noon = t >= WX.heat[0] && t < WX.heat[1];
    if (!noon) { if (b.tired) { b.tired = 0; b.t = 0; mark(); slowSet(false); } return; }
    const sh = c.shelter, cool = A.inb() || (sh && Math.hypot(m.x - sh.at[0], m.z - sh.at[1]) < 8), shade = cool || A.shade(m.x, m.z);
    if (cool) { if (b.tired) { b.rest++; A.say('🌳 ' + (en() ? 'You cooled off with a cup of water in the shade. Breathing is easy again.' : '시원한 곳에서 물 한 잔 마시고 쉬었더니 숨이 골라졌어요.'), 3.4); } b.t = 0; b.tired = 0; slowSet(false); mark(); return; }
    b.t = Math.max(0, b.t + (shade ? -2 : 1));
    if (!b.tired && b.t >= WX.tired) { b.tired = 1; b.warn++; mark(); slowSet(true); A.say('💦 ' + (en() ? 'You are sweating a lot and out of breath. Rest in the shade or at the cooling shelter.' : '땀이 줄줄 나고 숨이 차요. 그늘이나 무더위 쉼터에서 쉬어요.'), 4.2, 1); log('tired'); }
    if (b.tired && b.t <= 0) { b.tired = 0; slowSet(false); mark(); A.say('🌳 ' + (en() ? 'Resting in the shade helped.' : '그늘에서 쉬니 좀 나아졌어요.'), 2.6); }
    if (b.tired) { b.long++; if (A.puff && ++sweatT % 2 === 0) A.puff(m.x, m.y + 1.55, m.z, [0x8fd8ff, 0xcfeeff], 0.4); if (b.long % 30 === 0) A.say('💦 ' + (en() ? 'Still hot — find shade.' : '아직 더워요. 그늘을 찾아요.'), 2.6, 1); } }
  function snowSec() { const c = C(), m = me(), k = K(), R = E(); if (A.wx() !== 'snow' && k === R.evK) A.setWx('snow');
    const L0 = lastP; lastP = [m.x, m.z, m.y]; if (A.inb() || (A.bike && A.bike())) { slowSet(false); return; }
    let onSnow = false; for (const q of c.jobs) { if (q.k !== 'clear') continue; const d = Math.hypot(q.at[0] - m.x, q.at[1] - m.z); if (d < 3.2 && (k === R.evK ? q.st !== 'done' : q.st !== 'done' && !!c.res)) onSnow = true; }
    slowSet(onSnow);
    if (!L0 || k !== R.evK && !onSnow) return; const dh = Math.hypot(m.x - L0[0], m.z - L0[1]), rise = Math.abs(m.y - L0[2]);
    if (dh > WX.slipV && dh < 20 && rise / dh >= WX.slipG) { c.slip++; mark(); const bx = L0[0] - m.x, bz = L0[1] - m.z, l = Math.hypot(bx, bz) || 1; map.player.teleport([m.x + bx / l * 0.8, A.gy(m.x + bx / l * 0.8, m.z + bz / l * 0.8) + 0.05, m.z + bz / l * 0.8]); A.sfx('tick');
      A.say('😮 ' + (en() ? 'You slipped running on the snowy slope! On snow, take small steps and go slowly.' : '눈 쌓인 비탈에서 뛰다가 미끄러졌어요! 눈길에선 보폭을 좁게, 천천히 걸어요.'), 3.6, 1); lastP = null; log('slip'); } }

  // ───────── 결과 ─────────
  const RES = {
    elder: (q, ok) => ok ? T2('어르신 댁: 말씀드린 대로 물을 자주 드시고 한낮엔 쉬셨대요.', 'Older neighbour: they sipped water and rested at midday, as you said.') : T2('들르지 못한 어르신 댁은 이웃이 대신 들렀어요. 모두 무사해요.', 'A neighbour checked on the house you missed. Everyone is fine.'),
    paper: () => null,
    post: (q, ok) => ok ? T2('무더위 쉼터에 어르신들이 모여 시원하게 한낮을 보냈어요.', 'Older neighbours spent the hot midday together at the cooling shelter.') : T2('쉼터가 문 연 걸 몰라 집에서 더위를 참은 분이 있었대요.', 'Some did not know the shelter was open and put up with the heat at home.'),
    shade: (q, ok) => ok ? T2('목장 소들이 그늘막 밑에서 쉬어서 기운이 있어요.', 'The cows rested under the shade and look lively.') : T2('그늘이 없어 소들이 더위에 지쳐 젖이 덜 나왔대요. 소들은 무사해요.', 'With no shade the cows got tired in the heat and gave less milk. They are fine.'),
    trough: (q, ok) => ok ? T2('물통이 넉넉해서 동물들이 물을 실컷 마셨어요.', 'The full trough let the animals drink plenty.') : T2('물통이 금방 비어 목장 주인이 여러 번 채웠대요.', 'The trough emptied fast, so the farmer refilled it many times.'),
    garden: (q, ok) => ok ? T2('텃밭 잎이 싱싱해요. 서늘할 때 준 물이 뿌리까지 갔어요.', 'The garden leaves look fresh — the cool-time water reached the roots.') : T2('텃밭 잎이 조금 시들었어요. 아침에 물을 주면 다시 살아나요.', 'The garden leaves drooped a bit. Morning water will perk them up.'),
    bags: () => null, notice: (q, ok) => ok ? T2('알림을 본 이웃들은 미리 걸어서 갔어요.', 'Neighbours who saw the notice walked instead.') : T2('정류장에서 버스를 오래 기다린 사람이 있었대요.', 'Some people waited a long time at the bus stop.'),
    box: (q, ok) => (q.w === 'alley' ? null : ok ? T2(L(q.nm) + ' 제설함 모래를 뿌려서 덜 미끄러웠어요.', 'Grit from the box at ' + L(q.nm) + ' made it less slippery.') : T2(L(q.nm) + ' 제설함이 비어 있어서 뿌릴 모래가 없었대요.', 'The grit box at ' + L(q.nm) + ' was empty.')),
    clear: (q, ok) => ok ? T2(L(q.nm) + ': 치운 자리는 오늘 아침 녹아 있어요.', L(q.nm) + ': the cleared spot has melted this morning.') : T2(L(q.nm) + ': 못 치운 눈이 다져져 얼었어요' + (q.imp ? '. 다들 조심조심 둘러 갔대요.' : '.'), L(q.nm) + ': the snow left there got packed and froze' + (q.imp ? '. Everyone went around it carefully.' : '.')),
  };
  const MEM = { thx: T2('그때 도와줘서 고마워. 덕분에 잘 지나갔어.', 'Thanks for helping back then. It went fine thanks to you.'),
    elder: T2('다음엔 우리 집도 한번 들러 주렴. 이웃이 와 줘서 무사했단다.', 'Next time, please stop by my house too. A neighbour came, so I was fine.'),
    clear: T2('다음 큰눈엔 여기부터 같이 치우자. 비탈은 얼면 오르기 힘들어.', 'Next big snow, let’s clear here first together. Slopes are hard once they freeze.'),
    any: T2('다음엔 미리 같이 준비하자. 다친 사람이 없어서 다행이야.', 'Next time let’s get ready early together. Good thing no one was hurt.') };
  function result() { const c = C(), out = []; for (const q of c.jobs) { if (q.k === 'paper' || q.k === 'bags') continue; const ok = q.k === 'box' ? !!q.full : q.st === 'done', t = RES[q.k] && RES[q.k](q, ok); if (!t) continue;
      out.push({ id: q.id, k: q.k, ok: ok ? 1 : 0, t, imp: q.imp | 0 });
      if (q.k === 'elder' || q.k === 'clear' && q.imp || q.k === 'shade') S().mem[c.k + ':' + q.id + ':' + c.n] = { k: ok ? 'thx' : 'next', j: q.k, d: day(), at: q.at, n: c.n }; }
    if (c.k === 'heat') out.push({ id: 'body', k: 'body', ok: c.body.warn && !c.body.rest ? 0 : 1, t: c.body.warn ? (c.body.rest ? T2('한낮에 숨이 찼을 때 그늘·쉼터에서 쉬었어요.', 'When you were out of breath at midday, you rested in the shade.') : T2('한낮에 숨이 찼는데 계속 밖에 있었어요. 다음엔 그늘부터 찾아요.', 'You kept going outside when out of breath. Next time find shade first.')) : T2('한낮엔 밖에 오래 있지 않았어요.', 'You did not stay outside long at midday.') });
    if (c.k === 'snow' && c.slip) out.push({ id: 'slip', k: 'slip', ok: 0, t: T2('눈길에서 뛰다 미끄러진 적이 있어요. 눈길에선 천천히 걸어요.', 'You slipped running on snow. Walk slowly on snow.') });
    c.res = { d: day(), L: out }; c.said.res = 0; mark(); VKEY = '';
    const R = EV[c.k], ok = out.filter(o => o.ok).length; A.diary((en() ? R.t[1] + ' passed. ' : L(R.t) + '이 지나갔어요. ') + (en() ? (ok === out.length ? 'Everything I prepared went well.' : 'Some things I prepared went well, some I will do earlier next time.') : (ok === out.length ? '준비한 것이 다 잘 됐어요.' : '준비한 곳은 괜찮았고, 못 한 곳은 다음엔 더 일찍 하기로 했어요.')));
    log('result ' + ok + '/' + out.length); return c.res; }
  function resPanel() { const e = en(), c = C(), R = E(), Rs = c.res; if (!Rs) return null; const ok = Rs.L.filter(o => o.ok), no = Rs.L.filter(o => !o.ok), row = o => '<div class="wx-r"><b>' + esc(L(o.t)) + '</b></div>';
    const W = A.openP('<h3>🌅 ' + esc(e ? 'After the ' + R.t[1].toLowerCase() : L(R.t) + '이 지나간 아침') + '</h3><div class="sm">' + esc(e ? 'Everyone in town is safe. Here is what changed:' : '마을 사람과 동물은 모두 무사해요. 달라진 것은 이래요.') + '</div>'
      + (ok.length ? '<div class="grp">' + (e ? 'Ready in time' : '준비한 곳') + '</div>' + ok.map(row).join('') : '') + (no.length ? '<div class="grp">' + (e ? 'Next time' : '다음엔') + '</div>' + no.map(row).join('') : '')
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button></div>', false, 'wxres');
    W.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; return W; }
  function memSec() { const s = S(), m = me(), d = day(); for (const [key, o] of Object.entries(s.mem)) { if (!o || !o.at || d - o.d > 3) { if (o && d - o.d > 6) { delete s.mem[key]; mark(); } continue; } if (said['mem:' + key] === d || Math.hypot(o.at[0] - m.x, o.at[1] - m.z) > 9) continue; said['mem:' + key] = d;
      const t = o.k === 'thx' ? MEM.thx : MEM[o.j] || MEM.any; A.say('💬 ' + (o.j === 'elder' ? (en() ? 'Older neighbour' : '어르신') : (en() ? 'Neighbour' : '이웃')) + ': "' + L(t) + '"', 4); break; } }
  function fcPanel() { const e = en(), c = C(), R = E(); c.fc = day(); mark();
    const W = A.openP('<h3>📻 ' + esc(R.ic + ' ' + (e ? R.t[1] + ' forecast' : L(R.t) + ' 예보')) + '</h3><div class="pc-tx">' + esc(L(R.radio)) + '</div>'
      + '<div class="sm">' + esc(c.k === 'heat' ? (e ? 'Neighbours need a hand before the hot day. You can’t do it all at once — choose what matters most.' : '더운 날이 오기 전에 이웃을 도와요. 한 번에 다 할 수는 없어요. 무엇이 가장 급한지 정해요.') : (e ? 'Tomorrow you won’t have time to clear everywhere before people pack the snow down. Where do people walk most, and where is it easy to fall?' : '내일은 사람들이 밟기 전에 모든 곳을 치울 시간이 없어요. 어디로 사람이 많이 다니고, 어디서 넘어지기 쉬울까요?')) + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button><button class="sub" data-a="nb">📒 ' + esc(e ? 'Notebook' : L(R.t) + ' 수첩') + '</button></div>', false, 'wxfc');
    W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') open(); }; return W; }
  function evPanel() { const e = en(), c = C(), R = E(); c.said.ev = 1; mark();
    const t = c.k === 'heat' ? (e ? 'The hottest day. From 12 to 4, staying outside long makes you sweat and pant. Rest in shade, indoors or at the cooling shelter.' : '가장 더운 날이에요. 낮 12시~4시에 밖에 오래 있으면 땀이 나고 숨이 차요. 그늘이나 건물 안, 무더위 쉼터에서 쉬어요.')
      : (e ? 'Snow everywhere. Buses are running late. Clear the paths before 1 pm, when people will have packed it down. On slopes, walk slowly.' : '온 마을에 눈이 쌓였어요. 버스가 늦게 다녀요. 사람들이 다 밟기 전, 낮 1시까지 길을 치워요. 비탈에선 천천히 걸어요.');
    const W = A.openP('<h3>' + esc(R.ic + ' ' + (e ? R.t[1] + ' today' : '오늘 ' + L(R.t))) + '</h3><div class="pc-tx">' + esc(t) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button><button class="sub" data-a="nb">📒 ' + esc(e ? 'Notebook' : L(R.t) + ' 수첩') + '</button></div>', false, 'wxday');
    W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') open(); }; return W; }

  // ───────── 수첩 ─────────
  function where(q) { const g = A.gate(), dx = q.site[0] - g[0], dz = q.site[1] - g[1], DN = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')], i = ((Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) % 8) + 8) % 8;
    return (en() ? L(q.nm || '') + ' in ' + A.cell(q.site[0], q.site[1]) + ' — ' + L(DN[i]) + ' of the school gate' : A.cell(q.site[0], q.site[1]) + ' 칸 ' + L(q.nm || '') + ' — 학교 정문에서 ' + L(DN[i]) + '쪽').trim(); }
  function open() { if (dead) return null; const e = en(), c = C(); if (!c) { A.say(e ? 'No weather news right now' : '지금은 날씨 소식이 없어요', 2.2); return null; } const R = E(), k = K();
    const left = k < R.evK ? (k === R.evK - 1 ? (e ? 'tomorrow' : '내일') : (e ? 'the day after tomorrow' : '모레')) : k === R.evK ? (e ? 'today' : '오늘') : (e ? 'passed' : '지나갔어요');
    const L9 = c.jobs.filter(q => q.k !== 'clear' ? k <= JOB[q.k].till : k <= R.evK), row = q => { const J = JOB[q.k], dn = q.k === 'box' ? !!q.full : q.st === 'done';
      const st = dn ? (e ? 'Done' : '했어요') : q.k === 'clear' && k < R.evK ? (e ? 'Snow comes tomorrow' : '눈은 내일 와요') : (e ? 'Not yet' : '아직이에요');
      return '<div class="wx-r' + (dn ? ' done' : '') + '"><b>' + J.ic + ' ' + esc(L(J.t)) + '</b><div class="sm">' + esc(where(q)) + '</div><div class="sm">' + esc(st) + '</div>' + (!dn ? '<button class="sub" data-map="' + q.id + '">🗺 ' + (e ? 'Map' : '지도') + '</button><button class="sub" data-go="' + q.id + '">🧭 ' + (e ? 'Show the way' : '길 안내') + '</button>' : '') + '</div>'; };
    const tip = c.k === 'heat' ? (e ? 'Heat safety: drink water often · rest 12–4 · loose light clothes · check on older neighbours.' : '더위 안전: 물 자주 마시기 · 낮 12시~4시엔 쉬기 · 헐렁하고 밝은 옷 · 어르신 안부.') : (e ? 'Snow safety: clear before it is packed · slopes and bus stops first · small slow steps · buses may be late.' : '눈 안전: 밟혀 다져지기 전에 치우기 · 넘어지기 쉬운 곳부터 · 좁은 보폭으로 천천히 · 버스는 늦을 수 있어요.');
    const W = A.openP('<h3>📒 ' + esc(R.ic + ' ' + (e ? R.t[1] + ' notebook' : L(R.t) + ' 수첩')) + ' — ' + esc(left) + '</h3><div class="sm">' + esc(tip) + '</div>' + (c.k === 'snow' && k < R.evK ? '<div class="sm">' + esc(e ? 'Grit bags you have: ' + (c.bags ? 'some' : 'none') : '가진 제설 모래: ' + (c.bags ? '있어요' : '없어요')) + '</div>' : '')
      + (L9.length && !c.res ? L9.map(row).join('') : '') + (c.res ? c.res.L.map(o => '<div class="wx-r' + (o.ok ? '' : ' done') + '">' + esc(L(o.t)) + '</div>').join('') : '') + '<canvas class="wx-map" width="520" height="220" style="display:none"></canvas><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', true, 'wxnb');
    W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const d = b.dataset; if (d.a === 'x') { A.closeP(); return; } const q = job(d.map || d.go); if (!q) return;
      if (d.map) { const cv = W.querySelector('canvas.wx-map'), m = me(); if (!cv) return; cv.style.display = ''; try { A.mapSnip(cv, [{ x: q.site[0], z: q.site[1], label: L(q.nm || JOB[q.k].t), main: true }, { x: m.x, z: m.z, label: e ? 'Me' : '나' }]); } catch (x) { /* 지도 조각 없음 */ } return; }
      A.closeP(); A.route({ icon: JOB[q.k].ic, name: L(q.nm || JOB[q.k].t), door: q.at.slice(0, 2) }); };
    log('open k' + k); return W; }

  // ───────── 1초 칸 ─────────
  let first = true;
  function sec() { if (dead || !A.on()) return; if (first) { first = false; if (!C()) { const k = want(); if (k) start(k, 'auto'); } if (C() && K() === E().resK && !C().res) result(); }
    const c = C(); if (!c) { if (VIS.length || HOT.length) clearVis(); slowSet(false); return; } const R = E(), k = K();
    if (k > R.endK) { finish(); return; } sync();
    const free = !A.panel() && !A.busy();
    if (k === 1 && c.fc !== day() && free) fcPanel();
    if (k === R.evK && !c.said.ev && free) evPanel();
    if (k === R.evK && c.k === 'heat') heatSec(); else if (c.k === 'snow' && k >= R.evK && k <= R.resK) snowSec(); else slowSet(false);
    if (k >= R.resK && c.res && !c.said.res && free) { c.said.res = 1; mark(); resPanel(); }
    if (k >= R.resK) memSec(); }

  // ───────── 바깥 손잡이(town.js) ─────────
  const line = () => { const c = C(); if (!c) return ''; const R = E(), k = K(), e = en(), n = openJobs().length;
    if (k < R.evK) return R.ic + ' ' + (e ? R.t[1] + ' coming ' + (k === R.evK - 1 ? 'tomorrow' : 'soon') + (n ? ' · get ready' : ' · all ready') : (k === R.evK - 1 ? '내일 ' : '곧 ') + L(R.t) + (n ? ' — 대비하기' : ' — 준비 다 했어요'));
    if (k === R.evK) return R.ic + ' ' + (e ? R.t[1] + ' today — open the notebook' : '오늘 ' + L(R.t) + ' — 수첩 보기'); return ''; };
  const goal = () => { const c = C(); if (!c) return ''; const R = E(), k = K(), e = en(), t = now(); if (k !== R.evK) return '';
    if (c.k === 'heat') return t >= 11 * 60 && t < WX.heat[1] ? (c.body.tired ? (e ? '💦 Out of breath — rest in the shade or the cooling shelter' : '💦 숨이 차요 — 그늘이나 무더위 쉼터에서 쉬어요') : (e ? '🥵 Heatwave — at midday stay in the shade' : '🥵 폭염 — 한낮엔 그늘·쉼터에서 지내요')) : '';
    return t < WX.snowEnd ? (e ? '❄️ Heavy snow — which path first, before 1 pm? · walk slowly on slopes' : '❄️ 폭설 — 낮 1시 전에 어디부터 치울까요 · 비탈에선 천천히') : (e ? '❄️ Snow day — walk slowly on slopes' : '❄️ 눈 온 날 — 비탈에선 천천히 걸어요'); };
  function wait(d1) { const c = C(); if (!c) return null; const R = EV[c.k], k1 = d1 - c.d0 + 1;
    if (k1 >= 2 && k1 < R.evK) return { k: 'wxev', ic: R.ic, s: T2(L(R.t) + ' 대비', R.t[1] + ' prep'), t: T2(L(R.t) + '이 모레 와요. 이웃 부탁이 남아 있어요', 'The ' + R.t[1].toLowerCase() + ' comes the day after tomorrow. Neighbours still need help'), p: null };
    if (k1 === R.evK) return { k: 'wxev', ic: R.ic, s: T2(L(R.t), R.t[1]), t: c.k === 'heat' ? T2('내일 가장 더워요. 한낮엔 그늘·쉼터에서 지내요', 'Tomorrow is the hottest. Stay in the shade at midday') : T2('내일 새벽부터 큰눈이 와요. 어디부터 치울지 정해 둬요', 'Heavy snow from early tomorrow. Decide where to clear first'), p: null };
    if (k1 === R.resK) return { k: 'wxev', ic: '🌅', s: T2(L(R.t) + ' 뒤', 'After'), t: T2(L(R.t) + '이 지나간 아침, 준비한 곳이 어떻게 됐는지 봐요', 'The morning after — see how the places you prepared did'), p: null }; return null; }
  function ctx(Cx) { const c = C(); if (!c) return; const k = K(), R = E(); if (k > R.evK) return; const q = openJobs()[0]; if (!q) return; const a = [A.cell(q.site[0], q.site[1]), 'only', R.ic, ''];
    a.ev = 'wxev'; a.t = T2(R.ic + ' ' + L(R.t) + ' 대비 하나 하기', R.ic + ' Do one ' + R.t[1].toLowerCase() + ' task'); a.tp = T2(R.ic + ' ' + L(R.t) + ' 대비를 했어요', R.ic + ' Did a ' + R.t[1].toLowerCase() + ' task'); a.why = T2(L(R.t) + ' 예보가 나왔대요', 'There is a ' + R.t[1].toLowerCase() + ' forecast'); a.disc = 'wxev'; a.nm = ''; Cx.only = a; }
  function dayRows(d) { const c = C(); if (!c) return []; const R = EV[c.k], k = d - c.d0 + 1, out = [], pp = (q, ic) => (q ? { icon: ic, name: L(q.nm || JOB[q.k].t), door: [q.at[0], q.at[1]] } : null);
    if (c.k === 'heat' && k <= R.evK) { const g = c.jobs.find(q => q.k === 'garden' && q.st !== 'done'); if (g) out.push({ m: 7 * 60, g: 'wxwater', ic: '🌱', s: T2('텃밭 물', 'Garden water'), t: T2('텃밭 물은 아침 10시 전이나 저녁 5시 넘어서', 'Water the garden before 10 or after 5'), p: pp(g, '🌱') });
      if (k === R.evK) out.push({ m: WX.heat[0], g: 'wxnoon', ic: '🥵', s: T2('한낮 더위', 'Midday heat'), t: T2('낮 12시~4시엔 그늘·무더위 쉼터에서 쉬어요', 'From 12 to 4, rest in the shade or the cooling shelter'), p: c.shelter ? { icon: '🏠', name: c.shelter.nm, door: c.shelter.at.slice(0, 2) } : null }); }
    if (c.k === 'snow' && k === R.evK) out.push({ m: WX.work[0] * 60, g: 'wxsnow', ic: '⛏', s: T2('눈 치우기', 'Clear snow'), t: T2('사람들이 밟기 전, 낮 1시까지 길 치우기', 'Clear paths by 1 pm, before people pack the snow'), p: null });
    return out; }
  const key = () => { const c = C(); return c ? c.k + c.n + ':' + c.d0 + ':' + c.jobs.filter(q => q.st === 'done').length : ''; };
  function news(d) { const c = C(); if (!c) return []; const R = EV[c.k], k = d - c.d0 + 1, at = c.jobs[0] ? c.jobs[0].at : null;
    if (k === 1) return [{ k: 'wxev', t: [R.ic + ' ' + L(R.t) + ' 예보가 나왔어요. 이웃 대비를 도와요', R.ic + ' A ' + R.t[1].toLowerCase() + ' forecast is out. Help the neighbours get ready'], at }];
    if (k === R.evK) return [{ k: 'wxev', t: c.k === 'heat' ? ['🥵 오늘 가장 더워요. 한낮엔 그늘·무더위 쉼터에서', '🥵 Hottest day today. Shade and cooling shelters at midday'] : ['❄️ 밤새 큰눈이 왔어요. 버스는 늦게 다녀요', '❄️ Heavy snow overnight. Buses are running late'], at }];
    if (k === R.resK) return [{ k: 'wxev', t: ['🌅 ' + L(R.t) + '이 지나갔어요. 준비한 곳을 둘러봐요', '🌅 The ' + R.t[1].toLowerCase() + ' has passed. Go and see the places you prepared'], at }]; return []; }
  const fcAt = d => { const c = C(); if (!c) return null; const k = d - c.d0 + 1; return EV[c.k].fc[k] || null; };
  const wxLine = () => { const c = C(); if (!c) return ''; const R = E(), k = K(), e = en(); if (k > R.evK) return '';
    return R.ic + ' ' + (k === R.evK ? (e ? R.t[1] + ' today' : '오늘 ' + L(R.t)) : c.k === 'heat' ? (e ? 'Heatwave until the day after tomorrow — hottest at midday' : '모레까지 폭염 — 한낮이 가장 더워요') : (e ? 'Heavy snow from early tomorrow' : '내일 새벽부터 큰눈')); };
  const on = () => !!C();
  function dispose() { dead = true; clearVis(); slowSet(false); if (css) { css.remove(); css = null; } }
  function info() { const s = S(), c = s.cur; return { on: !!c, k: c ? c.k : '', sea: A.season(), n: s.n, d0: c ? c.d0 : 0, kk: K(), last: { ...s.last }, jobs: c ? c.jobs.map(q => ({ ...q })) : [], bags: c ? c.bags | 0 : 0, paper: c ? c.paper | 0 : 0, body: c ? { ...c.body } : null, slip: c ? c.slip | 0 : 0, shift: c ? c.shift | 0 : 0, res: c && c.res ? JSON.parse(JSON.stringify(c.res)) : null,
    mem: JSON.parse(JSON.stringify(s.mem)), log: s.log.slice(0, 3), vis: VIS.length, hot: HOT.map(h => h.label || (h.hot && h.hot.label) || ''), line: line(), goal: goal(), wxLine: wxLine(), slow: slowOn, dbg: DBG.slice() }; }
  // 시험 손잡이: E 자리의 쓰기를 그대로 부름(자리 판단 · 시간 · 물건이 실제와 같음)
  const dbg = { talk: id => { const q = job(id); if (q) talkElder(q); }, desk: id => { const q = job(id || (C().k === 'heat' ? 'paper' : 'bags')); if (q) deskUse(q); }, post: () => postUse(job('post')), shade: i => shadeUse(job('shade'), i), trough: () => troughUse(job('trough')), garden: () => gardenUse(job('garden')),
    box: id => boxUse(job(id)), notice: () => noticeUse(job('notice')), stroke: (id, k) => stroke(job(id), k || 'shovel'), near: (x, z, k) => toolApi.near(x, z, k), heatSec: () => heatSec(), snowSec: () => snowSec(), result: () => result(), finish: () => finish(), want: () => want(true), sync: () => { VKEY = ''; sync(); return VIS.length; }, tap: k => tap(k) };
  return { sec, day: onDay, start, open, line, goal, wait, ctx, dayRows, key, news, fcAt, wxLine, evDay, on, info, dbg, dispose, tap, tool: toolApi };
}
