// 🧰 도구 띠(TOOL-1 · 사용자 10-19 "실제로 도구를 사용해서 뭔가를 하는 게 0개네" · "도파민이 안 나와") — 설계 docs/systems/town_tools.md
//   손에 도구를 늘 들고 다니다가 겨눈 곳(땅 위 흰 고리)에 바로 씀 · 세상이 그 자리에서 바뀜(물 자국·구덩이·쓸린 자리·찌) · 쓸 때마다 소리 + 보상 연출(town.js skUp·bagPop 그대로)
//   1~5 = 들기/내려놓기 · 클릭·F = 쓰기 · 터치 = 🧰 쓰기 단추 하나(들었을 때만) · ☰ 메뉴 '🧰 도구' = 띠를 펼쳐 고르기
//   물뿌리개(코디 10-19 '메타버스 물총 조준 결'): 누르는 동안 계속 뿌림 · 꼭지에서 포물선 물줄기 · 떨어질 자리 = 흰 고리(텃밭·모닥불·꽃은 고리가 닿은 자리로 판정) · 물통이 비면 수돗가·강가에서 E
//     물방울 풀·포물선 각 = watergun.js(물총 놀이)에서 옮겨 씀(그 파일은 그대로) · 조준 연결부 = map.player.aim·shoulder(공용)
//   엔진 = map.player.hold·holdUse·toolTip·act('dig'|'cast'|'peer'|'sweep') — 정본 docs/map_api.md §19
//   렉: 매 프레임 = 고리 따라가기 + 물방울(살아 있을 때만) + 찌 시계 · 겨눔 = 0.1초 · 숨김·받기·쓸 자리·젖은 자국 = 0.25초 · 새 Light X · 매 프레임 new X
//     그리기 = 고리 1 + 물방울 1 + 덩이 1 + 조각 1 + 구덩이 1 + 젖은 자국 1(있을 때만) — 바뀔 때만 setMatrixAt
//   지어내지 않음(사실만: 지렁이·분해자 · 금어기·놓아주기 · 바닷물 · 꽃의 암술·수술) · 새 사람 X(빗자루 = 마을회관 앞 쪽지 · 낚싯대 = 부두 어부 일꾼) · 홍보판(SM_PROMO) X
import { fishAt, FISH_FACT } from './town_fish.js?v=2';   /* FISH-2: 바다 = 물때·계절로 걸리는 고기(가까운 얕은 물) */
export const TOOLS_V = 1;
export const TOOL_ORDER = ['can', 'shovel', 'rod', 'lens', 'broom'];
export const TOOL = {
  can: { ic: '💧', t: ['물뿌리개', 'Watering can'], how: ['텃밭·꽃·모닥불을 겨눠 누르고 있으면 물을 뿌려요', 'Aim at the garden, flowers or a campfire and hold to pour'], get: ['처음부터 있어요', 'You have it from the start'] },
  shovel: { ic: '⛏', t: ['삽', 'Shovel'], how: ['흙이나 풀밭을 겨눠 쓰면 땅을 파요. 무엇이 나올까요?', 'Aim at soil or grass to dig. What will you find?'], get: ['처음부터 있어요', 'You have it from the start'] },
  rod: { ic: '🎣', t: ['낚싯대', 'Fishing rod'], how: ['물 위를 겨눠 던져요. 찌가 쏙 들어가면 눌러요. 걸리면 물고기 반대쪽으로 끌어요', 'Aim at the water and cast. When the float dips, press. Then pull the opposite way to the fish'], get: ['부두 어부께 받아요', 'Get it from the pier fisher'] },
  lens: { ic: '🔍', t: ['돋보기', 'Magnifier'], how: ['곤충·꽃·버섯·돌을 겨눠 들여다봐요. 잡지 않고 보기만 해요', 'Aim at insects, flowers, mushrooms or stones to look closely. Just look, never catch'], get: ['곤충을 처음 관찰하면 생겨요', 'Comes after your first insect watch'] },
  broom: { ic: '🧹', t: ['빗자루', 'Broom'], how: ['낙엽·눈·쓰레기를 겨눠 쓸어요. 마을이 깨끗해져요', 'Aim at leaves, snow or litter and sweep. The town gets clean'], get: ['마을회관이나 경로당 앞에서 빌려요', 'Borrow it at a village hall or senior center'] },
};
// 민물고기(강·연못에서 낚싯대로 · 사실만) — 도감 「🎣 낚은 물고기」에 바다 물고기(town_fish.js)와 같이 들어감
export const FRESH = [
  { id: 'bungeo', t: ['붕어', 'Crucian carp'], line: ['강·연못·저수지에 흔히 살아요 — 물풀에 알을 붙여 낳아요', 'Common in rivers, ponds and reservoirs — lays eggs on water plants'] },
  { id: 'pirami', t: ['피라미', 'Pale chub'], line: ['맑은 냇물에 떼 지어 살아요 — 알 낳을 때가 되면 수컷 몸에 고운 빛깔이 생겨요', 'Lives in schools in clear streams — males get bright colours when it is time to spawn'] },
  { id: 'megi', t: ['메기', 'Catfish'], line: ['긴 수염으로 어두운 물속에서 먹이를 찾아요 — 낮엔 숨고 밤에 움직여요', 'Finds food in dark water with its long whiskers — hides by day and moves at night'] },
];
for (const f of FRESH) { f.icon = '🐟'; f.sea = 'any'; f.hint = ['🎣 강·연못에서 낚싯대로', '🎣 With the rod at a river or pond']; }
// 돋보기로 본 것(사실 한 줄)
const LOOKF = {
  flower: ['🌼 꽃 가운데에 암술과 수술이 있어요. 꽃가루가 암술에 닿아야 씨가 생겨요', '🌼 In the middle of a flower are the pistil and stamens. Pollen must reach the pistil to make seeds'],
  mush: ['🍄 버섯 갓 아래 주름에서 아주 작은 홀씨가 나와 퍼져요', '🍄 Tiny spores drift out from the gills under the mushroom cap'],
  poison: [' 독버섯이니 만지지 않아요', ' It is poisonous, so we never touch it'],
  stone: ['⚪ 돌을 자세히 보면 색과 크기가 다른 알갱이가 보여요. 돌은 여러 알갱이(광물)가 모여 만들어져요', '⚪ Look closely: grains of different colours and sizes. Rocks are made of many grains (minerals)'],
  soil: ['🌱 흙 속에 모래 알갱이와 잘게 부서진 잎 조각이 섞여 있어요', '🌱 The soil is a mix of sand grains and tiny bits of broken leaves'],
};
const NOTHING = [['⛏ 흙만 나왔어요 — 다른 곳도 파 봐요', '⛏ Just soil — try digging somewhere else'], ['⛏ 흙만 나왔어요 — 겉흙이 검은 건 썩은 잎이 섞여서예요', '⛏ Just soil — topsoil is dark because rotten leaves are mixed in']];
const RANGE = { can: [0.9, 3.6], shovel: [0.9, 2.4], rod: [2.4, 9], lens: [0.6, 2.4], broom: [0.8, 2.4] };   // 고리 거리(내 앞 m) — 아래를 보면 가까이 · 위를 보면 멀리
const TANK = 100, USE = 12, RATE = 34, GV = 9.8, PMAX = 140, MMAX = 10, HMAX = 8, CELL = 24;
const HIDE = { bike: ['🚲 자전거에서 내려서 써요 (B)', '🚲 Get off the bike to use it (B)'], in: ['🏠 밖에서 써요', '🏠 Use it outside'], boat: ['⛵ 배에서 내려서 써요', '⛵ Get off the boat first'], swim: ['🌊 물 밖에서 써요', '🌊 Get out of the water first'] };

export function createTools(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], esc = t => A.esc(t);
  const _f = new T3.Vector3(), _v = new T3.Vector3(), _n = new T3.Vector3(), _q = new T3.Quaternion(), _s = new T3.Vector3(), _m = new T3.Matrix4(), _c = new T3.Color(), _e = new T3.Euler(), _Z = new T3.Vector3(0, 0, 1);
  const ZERO = new T3.Matrix4().makeScale(0, 0, 0);
  let built = false, dead = false, shownK = null, pressing = false, burstT = 0, aimQ = 0, secQ = 0, holdK = 0, aimHold = 0, shQ = 0, shV = 0, shW = 0, sprayT = 0, emptyT = 0, hissT = 0, wetQ = 0, tipQ = 0;
  const T = { x: 0, y: 0, z: 0, ok: false, lock: '', k: '' }, OVR = { on: false, x: 0, z: 0 }, ACC = { bed: [], fire: 0, fi: -1, fl: 0, flk: '', pot: 0, potk: '' };
  let FS = null, FILL = null, OVL = null, WORM = null, PICK = 0, dirty = true, center = null, lastMode = '', lastDay = -1, tchBtn = null, BAR = null, CSS = null, FAUCH = [], FAUOFF = null, RIVH = null, STANDH = [], seaTold = -1;
  const PEND = [], PILES = [], PCACHE = new Map(), FGRID = new Map();
  // ── 저장(GAME.S.tools) — 예전 저장에도 물뿌리개·삽은 있음 ──
  const S = () => { const s = A.GAME.S; let t = s.tools; if (!t || typeof t !== 'object' || Array.isArray(t)) t = s.tools = {}; if (!t.have || typeof t.have !== 'object') t.have = {}; t.have.can = A.canAway && A.canAway() ? 0 : 1; t.have.shovel = 1;   /* SPEND-1: 맡긴 날 = 물뿌리개 없음 */
    if (!(t.tank >= 0)) t.tank = TANK; if (!Array.isArray(t.holes)) t.holes = []; if (!t.bloom || typeof t.bloom !== 'object') t.bloom = {}; if (!t.sw || typeof t.sw !== 'object') t.sw = { d: 0, k: {} }; if (!t.clean || typeof t.clean !== 'object') t.clean = { d: 0, n: 0, all: 0 };
    if (!t.n || typeof t.n !== 'object') t.n = {}; if (t.cur && !t.have[t.cur]) t.cur = null; return t; };
  const mark = () => A.GAME.mark(), day = () => A.GAME.S.day | 0, toast = (t, s) => map.hud.toast(t, s), tone = (...a) => { if (map.tone) map.tone(...a); };
  const cur = () => S().cur || null;

  // ───────── 그림(처음 쓸 때 한 번 짓기 · map.add = 게임이 멈추면 치움) ─────────
  let RING = null, DROP = null, MOUND = null, BITS = null, HOLE = null, WET = null, WORMM = null; const MATS = [], GEOS = [];
  const inst = (g, m, n) => { const o = new T3.InstancedMesh(g, m, n); o.frustumCulled = false; o.count = 0; o.visible = false; o.setColorAt(0, _c.set(0xffffff)); o.instanceColor.needsUpdate = true; map.add(o); MATS.push(m); GEOS.push(g); return o; };
  function build() { if (built) return; built = true;
    RING = new T3.Mesh(new T3.RingGeometry(0.2, 0.3, 24), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); RING.rotation.x = -Math.PI / 2; RING.renderOrder = 3; RING.visible = false; RING.userData.fx = 1; map.add(RING); MATS.push(RING.material); GEOS.push(RING.geometry);
    DROP = inst(new T3.IcosahedronGeometry(1, 0), new T3.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1d3142 }), PMAX);   // watergun.js 물방울과 같은 결
    const fl = new T3.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    MOUND = inst(new T3.IcosahedronGeometry(1, 0), fl, 96); BITS = inst(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: 0xffffff }), 64);
    const disc = () => new T3.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
    HOLE = inst(disc(), new T3.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), HMAX + 2); HOLE.renderOrder = 1;
    WET = inst(disc(), new T3.MeshBasicMaterial({ color: 0xffffff, blending: T3.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), MMAX); WET.renderOrder = 1;   // 곱하기 = 젖은 곳만 어둡게(watergun 자국 결)
    WORMM = inst(new T3.IcosahedronGeometry(1, 1), new T3.MeshLambertMaterial({ color: 0xe8958e }), 5);
    for (const m of [MOUND, BITS, HOLE, WET, WORMM]) m.userData.fx = 1; DROP.userData.fx = 1; }

  // ───────── 겨눔(0.1초): 카메라 광선이 내 발 높이에 닿는 곳 → 도구 거리로 자름 → 벽이면 그 앞 → 대상이 가까우면 붙음(노란 고리) ─────────
  const water = (x, z) => A.water(x, z);
  function surfY(x, z, yh) { const w = water(x, z); const g = A.gy(x, z, yh + 1.6); return w && w.y > g - 0.3 ? Math.max(w.y, g) : g; }
  function aimCalc(force) { const k = cur(); if (!k) return; const me = map.player.pos(), cam = map.camera, R = RANGE[k]; _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const fl = Math.hypot(_f.x, _f.z) || 1, hx = _f.x / fl, hz = _f.z / fl;
    let x, z;
    if (OVR.on) { x = OVR.x; z = OVR.z; }
    else { const o = cam.position; let d = R[1]; if (_f.y < -0.02) { const s = (me.y - o.y) / _f.y; if (s > 0) d = (o.x + _f.x * s - me.x) * hx + (o.z + _f.z * s - me.z) * hz; }
      d = Math.max(R[0], Math.min(R[1], d)); const bl = map.q.blocked || map.q.blockedAt;
      for (let s = 0.45; s <= d; s += 0.3) { const x9 = me.x + hx * s, z9 = me.z + hz * s; if (bl(x9, z9, me.y + 0.5)) { d = Math.max(Math.min(R[0], 0.6), s - 0.4); break; } }
      x = me.x + hx * d; z = me.z + hz * d; }
    let y = surfY(x, z, me.y), lock = '', tk = '';
    const sn = snap(k, x, z, me); if (sn) { x = sn[0]; z = sn[2]; y = sn[1]; lock = sn[3]; tk = sn[4] || ''; }
    T.x = x; T.y = y; T.z = z; T.ok = true; T.lock = lock; T.k = tk;
    if (k === 'rod') { const w = water(x, z); T.ok = !!w; if (w) T.y = w.y; }
    if (force && RING) RING.position.set(T.x, T.y + 0.05, T.z); }
  // 붙는 대상: 삽 = 보물 흙더미 · 빗자루 = 쓸 자리 · 돋보기 = 곤충·버섯·꽃·돌 · 물뿌리개 = 텃밭·모닥불·꽃·화분(고리가 그 위면 노랑만 — 자리는 그대로)
  function snap(k, x, z, me) {
    if (k === 'shovel' || k === 'broom') { const xp = A.xp && A.xp(), f = xp && xp.near(x, z, k); if (f) return [f.x, f.y, f.z, 'fos', f.id]; }   /* EXPLORE-1 층층골 흙더미·돌판(그 도구 차례일 때만) */
    if (k === 'shovel') { const t = A.trs(), c = t && t.near && t.near(x, z); if (c) return [c.x, c.y, c.z, 'trs']; return null; }
    if (k === 'broom') { let b = null, bd = 1.4; for (const p of PILES) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } } return b ? [b.x, b.y, b.z, 'pile', b.k] : null; }
    if (k === 'lens') { const L9 = lensAt(x, z, me); return L9 ? [L9.x, L9.y, L9.z, L9.kind, L9.key] : null; }
    if (k === 'can') { const y = surfY(x, z, me.y); if (bedAt(x, z) >= 0) return [x, y, z, 'bed']; const ch = A.chem(); if (ch && ch.fireAt && ch.fireAt(x, z, 1.0) >= 0) return [x, y, z, 'fire']; if (flowerAt(x, z, 0.8)) return [x, y, z, 'flower']; if (potAt(x, z)) return [x, y, z, 'pot']; }
    return null; }
  function bedAt(x, z) { const B = A.farm.beds() || []; for (let i = 0; i < B.length; i++) { const b = B[i]; if (x > b[0] - 0.3 && x < b[1] + 0.3 && Math.abs(z - b[2]) < 0.85) return i; } return -1; }
  function flowerGrid() { if (FGRID.size) return; for (const f of A.flowers() || []) { const k = Math.floor(f.x / 8) + ':' + Math.floor(f.z / 8); let a = FGRID.get(k); if (!a) FGRID.set(k, a = []); a.push(f); } FGRID.set('_', []); }   // 꽃 자리 8m 칸(처음 한 번 · 짓기마다 다시)
  function flowerAt(x, z, r) { flowerGrid(); let b = null, bd = r; const gx = Math.floor(x / 8), gz = Math.floor(z / 8); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = FGRID.get((gx + i) + ':' + (gz + j)); if (a) for (const f of a) { const d = Math.hypot(f.x - x, f.z - z); if (d < bd) { bd = d; b = f; } } } return b; }
  let POTS = null; function potAt(x, z) { if (!POTS) POTS = (map.interact.list({ kind: 'pot' }) || []).map(h => (h.at ? [h.at[0], h.at[1], h.at[2]] : [h.x, h.y, h.z])); for (const p of POTS) if (Math.hypot(p[0] - x, p[2] - z) < 1.0) return p; return null; }
  function lensAt(x, z, me) { let b = null, bd = 1.7; { const xp = A.xp && A.xp(), f = xp && xp.near(x, z, 'lens'); if (f) return { x: f.x, y: f.y, z: f.z, kind: 'fos', key: f.id }; }   /* EXPLORE-1 드러난 돌판 */
    for (const s of A.bugs() || []) { if (!s.b || !s.spr || !s.spr.visible) continue; const p = s.spr.position, d = Math.min(Math.hypot(p.x - x, p.z - z), Math.hypot(p.x - me.x, p.z - me.z) < 2.6 ? Math.hypot(p.x - x, p.z - z) * 0.6 : 9); if (d < bd) { bd = d; b = { x: p.x, y: p.y, z: p.z, kind: 'bug', s, key: 'bug' }; } }
    if (b) return b; bd = 1.4; for (const m of A.mush() || []) { const d = Math.hypot(m.x - x, m.z - z); if (d < bd) { bd = d; b = { x: m.x, y: A.gy(m.x, m.z, me.y + 1) + 0.1, z: m.z, kind: 'mush', m, key: 'mush' }; } }
    if (b) return b; const f = flowerAt(x, z, 1.0); if (f) return { x: f.x, y: f.y + 0.3, z: f.z, kind: 'flower', key: 'flower' };
    const R9 = A.res(); if (R9 && R9.spots) { bd = 1.4; for (const s of R9.spots()) { if (s.k !== 'stone' || !s.on) continue; const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = { x: s.x, y: s.y + 0.05, z: s.z, kind: 'stone', key: 'stone' }; } } }
    if (!b) { const xp = A.xp && A.xp(), c = xp && xp.lensAt(x, z); if (c) return c; }   /* EXPLORE-1 까망봉 송이·현무암 */
    return b; }

  // ───────── 숨김·보이기(0.25초) — 실내·자전거·배·버스·지하철·헤엄·쉬기·우산·스키·놀이·직업 체험 중엔 내려 둠(저장된 cur는 그대로) ─────────
  const hiddenWhy = () => A.hide();
  const usable = () => !!cur() && A.on() && !hiddenWhy() && !A.busy();
  function showSync() { const k = cur(), want = k && A.on() && !hiddenWhy() ? k : null; if (want !== shownK) { shownK = want; map.player.hold(want); if (!want) stopPour(); } }

  // ───────── 들기·내려놓기 · 띠 ─────────
  function hold(k) { const t = S(); if (k === 'can' && !t.have.can) { toast(en() ? '🔧 The watering can is being fixed — it comes to our door tomorrow morning' : '🔧 물뿌리개를 맡겼어요. 내일 아침 우리 집 앞에 와요', 2.8); return false; } if (k && !t.have[k]) { toast('🔒 ' + L(TOOL[k].t) + (en() ? ' — not yet. ' : ' — 아직 없어요. ') + L(TOOL[k].get), 2.8); return false; }
    const nk = k && t.cur !== k ? k : null; if (nk === t.cur) return true; stopPour(); if (FS) fishStop(); t.cur = nk; mark(); showSync(); aimCalc(true); barSync(); tchSync(); A.keysLine(); PICK = 0;
    if (nk) { tone(880, 0, 0.06, 'triangle', 0.05); tone(1320, 0.06, 0.08, 'triangle', 0.04); if (!t.n['h:' + nk]) { t.n['h:' + nk] = 1; toast(TOOL[nk].ic + ' ' + L(TOOL[nk].how) + (A.tch() ? (en() ? ' (🧰 Use)' : ' (🧰 쓰기)') : (en() ? ' (click or F)' : ' (클릭 또는 F)')), 4); } }
    else tone(520, 0, 0.06, 'triangle', 0.04); return true; }
  function barSync() { if (!BAR) return; const t = S(), k = cur(), on = !!(A.on() && (shownK || PICK > 0)); BAR.classList.toggle('on', on); if (!on) return;
    for (const b of BAR.children) { const k9 = b.dataset.t; b.classList.toggle('cur', k9 === k); b.classList.toggle('no', !t.have[k9]); b.title = L(TOOL[k9].t) + (t.have[k9] ? '' : ' — ' + L(TOOL[k9].get)); }
    tankSync(); }
  let tankW = -1; function tankSync() { if (!BAR) return; const w = Math.round(S().tank); if (w === tankW) return; tankW = w; const s = BAR.querySelector('em s'); if (s) { s.style.width = w + '%'; s.style.background = w < 20 ? '#e0603a' : '#3a8fe0'; } }
  function tchSync() { if (!tchBtn) return; const on = A.tch() && !!shownK && !A.busy(); tchBtn.style.display = on ? 'flex' : 'none'; if (on) { const k = cur(); tchBtn.firstChild.textContent = '🧰 ' + (FS && FS.ph === 'bite' ? (en() ? 'Pull!' : '당겨요!') : (en() ? 'Use' : '쓰기')); tchBtn.title = L(TOOL[k].t); } }
  function ui() { if (BAR) return; CSS = document.createElement('style'); CSS.textContent = '.twn-tools{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:21;display:none;gap:5px;padding:5px 6px;background:#fff8ea;border:2px solid #2b2420;border-radius:12px;box-shadow:0 3px 0 #2b2420;pointer-events:auto}'
      + '.twn-tools.on{display:flex}.twn-tools button{position:relative;width:44px;height:44px;padding:0;border:2px solid #2b2420;border-bottom-width:4px;border-radius:9px;background:#fff;cursor:pointer;font:24px/1 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;color:#2b2420}'
      + '.twn-tools button i{font-style:normal}.twn-tools button b{position:absolute;left:3px;top:1px;font:900 11px system-ui,sans-serif;color:#6a5a4a}.twn-tools button.cur{background:#ffe48a;border-color:#c8443a}.twn-tools button.no{opacity:.35}'
      + '.twn-tools button em{position:absolute;left:5px;right:5px;bottom:3px;height:5px;border-radius:3px;background:#d9cbb5;overflow:hidden}.twn-tools button em s{display:block;height:100%;width:100%;background:#3a8fe0;text-decoration:none}body.touch .twn-tools button b{display:none}body.h-keys .twn-tools{bottom:58px}body.touch .twn-tools{bottom:12px}'
      + '.twn-tuse{position:fixed;right:calc(196px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));z-index:22;display:none;align-items:center;justify-content:center;min-width:92px;height:52px;padding:0 14px;border-radius:26px;background:#fff8ea;color:#2b2420;border:3px solid #2b2420;box-shadow:0 4px 0 #2b2420;font:900 17px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.twn-tuse.dn{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}';
    document.head.appendChild(CSS);
    BAR = document.createElement('div'); BAR.className = 'twn-tools ttl-keep'; BAR.innerHTML = TOOL_ORDER.map((k, i) => '<button data-t="' + k + '"><i>' + TOOL[k].ic + '</i><b>' + (i + 1) + '</b>' + (k === 'can' ? '<em><s></s></em>' : '') + '</button>').join('');
    BAR.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); hold(b.dataset.t); }); document.body.appendChild(BAR);
    tchBtn = document.createElement('div'); tchBtn.className = 'twn-tuse ttl-keep'; tchBtn.innerHTML = '<span>🧰 쓰기</span>';
    const dn = e => { e.preventDefault(); e.stopPropagation(); tchBtn.classList.add('dn'); try { tchBtn.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } press(true, 't'); }, up = e => { e.stopPropagation(); tchBtn.classList.remove('dn'); press(false, 't'); };
    tchBtn.addEventListener('pointerdown', dn); tchBtn.addEventListener('pointerup', up); tchBtn.addEventListener('pointercancel', up); tchBtn.addEventListener('lostpointercapture', up); document.body.appendChild(tchBtn); }

  // ───────── 누르기(클릭·F·🧰) — 물뿌리개는 누르는 동안 · 나머지는 한 번 ─────────
  function press(on, src) {
    if (!on) { if (pressing && (!src || pressing === src || src === 'all')) { pressing = false; } return false; }
    if (!cur() || !A.on()) return false; const why = hiddenWhy(); if (why) { if (HIDE[why]) toast(L(HIDE[why]), 2); return true; } if (A.busy()) return false;
    if (cur() === 'can') { if (FILL) return true; if (!pressing) { ACM.clear(); POURB.clear(); pourN = 0; sideQ = 0; } pressing = src || 'k'; return true; }
    useOnce(); return true; }
  function stopPour() { pressing = false; burstT = 0; map.player.holdUse(false); }
  function useOnce() { const k = cur(), act = map.player.acting; if (!k) return; if (k === 'rod' && FS) { fishPress(); return; } if (act && /^(dig|cast|peer|sweep|reach)$/.test(act)) return;
    aimCalc(true); if (!T.lock && k !== 'rod' && k !== 'can') { const xp = A.xp && A.xp(), h9 = xp && xp.hint(T.x, T.z, k); if (h9) { toast(h9, 2.8); return; } }   /* EXPLORE-1 흙더미 곁인데 차례가 아닌 도구 = 다음 할 일 한 줄 */
    if (k === 'shovel') useShovel(); else if (k === 'rod') useRod(); else if (k === 'lens') useLens(); else if (k === 'broom') useBroom(); }

  // ───────── 💧 물뿌리개: 포물선 물방울(watergun.js 풀 결) · 고리 자리 판정 · 물통 ─────────
  const kind = new Uint8Array(PMAX), px = new Float32Array(PMAX), py = new Float32Array(PMAX), pz = new Float32Array(PMAX), vx = new Float32Array(PMAX), vy = new Float32Array(PMAX), vz = new Float32Array(PMAX), life = new Float32Array(PMAX), psz = new Float32Array(PMAX);
  let pNext = 0, pAlive = 0;
  function spawn(k, x, y, z, ux, uy, uz, lt, size) { for (let n = 0; n < PMAX; n++) { const i = (pNext + n) % PMAX; if (kind[i]) continue; kind[i] = k; px[i] = x; py[i] = y; pz[i] = z; vx[i] = ux; vy[i] = uy; vz[i] = uz; life[i] = lt; psz[i] = size; pNext = (i + 1) % PMAX; pAlive++; return i; } return -1; }
  function splash(x, y, z, n) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, s = 0.5 + Math.random() * 0.6; spawn(3, x, y + 0.03, z, Math.cos(a) * s, 1.1 + Math.random() * 0.8, Math.sin(a) * s, 0.3 + Math.random() * 0.15, 0.025); } }
  /* SPEND-1 넓은 꼭지(설계 town_phase3.md): 물줄기 셋 = 가운데(고리) + 옆 둘(곁 두둑·화분 · 없으면 고리 양옆 1.1m) · 옆 자리는 0.15초마다 다시 고름 · 물통 쓰는 양은 그대로 */
  const SIDE = [{ x: 0, y: 0, z: 0, on: false }, { x: 0, y: 0, z: 0, on: false }], EA = [0, 0, 0]; let sideQ = 0;
  const wideOn = () => !!(A.wide && A.wide());
  function sideCalc(me) { SIDE[0].on = SIDE[1].on = false; if (!wideOn()) return; const B = A.farm.beds() || [], c = [], bi0 = bedAt(T.x, T.z);
    for (let i = 0; i < B.length; i++) { if (i === bi0) continue; const b = B[i], px = Math.max(b[0] + 0.3, Math.min(b[1] - 0.3, T.x)), d = Math.hypot(px - T.x, b[2] - T.z); if (d > 0.9 && d < 2.9) c.push([d, px, b[2]]); }
    for (const p of A.homePots ? A.homePots() : []) { const d = Math.hypot(p[0] - T.x, p[2] - T.z); if (d > 0.5 && d < 2.6) c.push([d, p[0], p[2]]); }
    c.sort((a, b) => a[0] - b[0]); const h = Math.atan2(T.x - me.x, T.z - me.z), ux = Math.cos(h), uz = -Math.sin(h);   /* 고리 방향에 수직(옆) */
    for (let k = 0; k < 2; k++) { const s = SIDE[k], q = c[k]; if (q) { s.x = q[1]; s.z = q[2]; } else { const sg = k ? -1 : 1; s.x = T.x + ux * 1.1 * sg; s.z = T.z + uz * 1.1 * sg; } s.y = surfY(s.x, s.z, me.y); s.on = true; } }
  function stream(j, nx, ny, nz, tx, ty, tz, rate, dt) { const dx = tx - nx, dz = tz - nz, dh = Math.hypot(dx, dz), h = ty - ny, a = 0.35, ca = Math.cos(a), den = 2 * ca * ca * (dh * Math.tan(a) - h);   // 발사각 20° 고정 → 그 자리까지 닿는 빠르기(포물선)
    let v = den > 1e-3 ? Math.sqrt(GV * dh * dh / den) : 2; v = Math.max(1.2, Math.min(7.5, v)); const ux = dh > 0.05 ? dx / dh : 0, uz = dh > 0.05 ? dz / dh : 0, tl = Math.max(0.12, Math.min(1.6, dh > 0.05 ? dh / (v * ca) : 0.4));
    EA[j] += rate * dt; while (EA[j] >= 1) { EA[j] -= 1; const jt = 0.18; spawn(1, nx, ny, nz, ux * v * ca + (Math.random() - 0.5) * jt, v * Math.sin(a) + (Math.random() - 0.5) * jt, uz * v * ca + (Math.random() - 0.5) * jt, tl * (0.94 + Math.random() * 0.12), 0.034); } }
  function pourTick(dt) { const t = S(), me = map.player.pos();
    if (t.tank <= 0) { map.player.holdUse(false); if ((emptyT -= dt) <= 0) { emptyT = 2.5; tone(220, 0, 0.14, 'triangle', 0.07, 180); toast(en() ? '💧 The can is empty — fill it at a tap or a riverbank (E)' : '💧 물이 다 떨어졌어요 — 수돗가나 강가에서 E로 채워요', 2.6); } return; }
    map.player.holdUse(true); const tip = map.player.toolTip(); let nx, ny, nz; if (tip && tip.ok) { nx = tip.x; ny = tip.y; nz = tip.z; } else { const h = Math.atan2(T.x - me.x, T.z - me.z); nx = me.x + Math.sin(h) * 0.45; ny = me.y + 0.62; nz = me.z + Math.cos(h) * 0.45; }
    if ((sideQ -= dt) <= 0) { sideQ = 0.15; sideCalc(me); }
    t.tank = Math.max(0, t.tank - USE * dt); const w3 = SIDE[0].on; stream(0, nx, ny, nz, T.x, T.y, T.z, w3 ? RATE * 0.5 : RATE, dt); if (w3) for (let k = 0; k < 2; k++) { const s = SIDE[k]; if (s.on) stream(k + 1, nx, ny, nz, s.x, s.y, s.z, RATE * 0.25, dt); }
    if ((sprayT -= dt) <= 0) { sprayT = 0.14; tone(1300 + Math.random() * 400, 0, 0.05, 'triangle', 0.012, 700); }   // 쏴아(작게 — lessons E '소리는 배경')
    aimHold = 0.6; map.player.aim(Math.atan2(T.x - me.x, -(T.z - me.z)) * 180 / Math.PI);
    pourHit(dt); }
  /* 젖는 자리 판정 = 물줄기마다(가운데 + 옆 둘) · 쌓임 = 자리마다(날이 바뀌거나 새로 누르면 처음부터 — 예전엔 한 번 물 준 두둑은 그 탭이 닫힐 때까지 다시 안 젖던 것) */
  const ACM = new Map(); let acmD = -1, pourN = 0, pourMax = 0; const POURB = new Set();
  const acc = (k, dt, need) => { const v = ACM.get(k) || 0; if (v < 0) return false; const n = v + dt; if (n >= need) { ACM.set(k, -1); return true; } ACM.set(k, n); return false; };
  function pourHit(dt) { if (acmD !== day()) { acmD = day(); ACM.clear(); } const wet = (wetQ -= dt) <= 0; if (wet) wetQ = 0.4; hitAt(T.x, T.z, T.y, dt, true, wet); if (SIDE[0].on) for (const s of SIDE) if (s.on) hitAt(s.x, s.z, s.y, dt, false, wet); }
  function hitAt(x, z, y, dt, main, wet) { const t = S(), en9 = en(); if (water(x, z) && !(main && T.lock === 'bed')) return;   // 물 위 = 아무 일 없음
    if (wet) wetAdd(x, y, z);
    const bi = bedAt(x, z); if (bi >= 0) { if (!acc('b' + bi, dt, 0.9)) return; const st = A.farm.st(bi);
      if (st === 'water') { A.farm.use(bi); A.rec('can-bed'); if (!POURB.has(bi)) { POURB.add(bi); pourN = POURB.size; pourMax = Math.max(pourMax, pourN); } } else if (!main) return; else if (st === 'empty') toast(en9 ? '🌱 Plant seeds first (E), then water' : '🌱 먼저 씨앗을 심어요 (E) — 그다음 물을 줘요', 2.4); else if (st === 'grow') toast(en9 ? '🌱 Already watered today — it grows while you sleep' : '🌱 오늘은 물을 줬어요 — 자는 동안 자라요', 2.4); else if (st === 'ripe') toast(en9 ? '🧺 It is ripe — harvest it with E' : '🧺 다 자랐어요 — E로 거둬요', 2.4); return; }
    if (A.homePots) for (const q of A.homePots()) { if (Math.hypot(q[0] - x, q[2] - z) > 0.7) continue; if (acc('h' + q[3], dt, 0.8)) A.potWater(q[3]); return; }   /* 우리 집 화분 = 손으로 E 물 주기와 같은 일 */
    if (main) { const ch = A.chem(), fi = ch && ch.fireAt ? ch.fireAt(x, z, 1.0) : -1; if (fi >= 0) { if (ACC.fi !== fi) { ACC.fi = fi; ACC.fire = 0; } ACC.fire += dt; if ((hissT -= dt) <= 0) { hissT = 0.3; tone(2300, 0, 0.25, 'sawtooth', 0.012, 900); } if (ACC.fire >= 1.1) { ACC.fire = 0; if (ch.fireDouse(fi)) { A.rec('can-fire'); A.skUp('look', 1, 'fire'); } } return; } }
    const f = flowerAt(x, z, 0.8); if (f) { const k = Math.round(f.x * 2) + ':' + Math.round(f.z * 2); if (!acc('f' + k, dt, 0.8)) return; const B = t.bloom, b = B[k];
      if (b && b.w === day()) { if (main) toast(en9 ? '🌷 You watered this flower today — come back tomorrow' : '🌷 이 꽃은 오늘 물을 줬어요 — 내일 또 줘요', 2.2); return; }
      B[k] = { x: +f.x.toFixed(2), y: +f.y.toFixed(2), z: +f.z.toFixed(2), c: Math.min(9, ((b && b.c) || 0) + 1), w: day() }; const ks = Object.keys(B); if (ks.length > 20) { ks.sort((a9, b9) => B[a9].w - B[b9].w); delete B[ks[0]]; } mark(); dirty = true;
      A.skUp('farm', 1, 'flower'); A.rec('can-flower'); toast(en9 ? '🌷 Watered the flowers — one more will bloom tomorrow' : '🌷 꽃에 물을 줬어요 — 내일 한 송이 더 피어요', 2.6); return; }
    const p = potAt(x, z); if (p) { const k = Math.round(p[0]) + ':' + Math.round(p[2]); if (!acc('p' + k, dt, 0.8)) return; if (t.n['pot:' + k] === day()) return; t.n['pot:' + k] = day(); mark(); A.skUp('farm', 1, 'pot:' + k); toast(en9 ? '🌱 Watered the pot plant' : '🌱 화분에 물을 줬어요', 2); } }
  function dropTick(dt) { if (!pAlive) { if (DROP && DROP.visible) DROP.visible = false; return; } let n = 0;
    for (let i = 0; i < PMAX; i++) { const k = kind[i]; if (!k) continue; if ((life[i] -= dt) <= 0) { kind[i] = 0; pAlive--; if (k === 1 && Math.random() < 0.35) splash(px[i], py[i], pz[i], 1); continue; }
      vy[i] -= GV * dt; px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
      if (k === 1) { _n.set(vx[i], vy[i], vz[i]).normalize(); _q.setFromUnitVectors(_Z, _n); _s.set(psz[i], psz[i], psz[i] * 2.6); } else { _q.identity(); _s.setScalar(psz[i]); }
      DROP.setMatrixAt(n, _m.compose(_v.set(px[i], py[i], pz[i]), _q, _s)); DROP.setColorAt(n, _c.set(k === 1 ? 0x8fd8ff : 0xcfeeff)); n++; }
    DROP.count = n; DROP.visible = n > 0; if (n) { DROP.instanceMatrix.needsUpdate = true; DROP.instanceColor.needsUpdate = true; } }
  // 젖은 자국(1분 · 마지막 20초에 작아짐 · 고정 칸 MMAX)
  const WM = []; for (let i = 0; i < MMAX; i++) WM.push({ on: false, x: 0, y: 0, z: 0, r: 0, t: 0 });
  function wetAdd(x, y, z) { for (const w of WM) if (w.on && Math.hypot(w.x - x, w.z - z) < 0.45) { w.t = 60; w.r = Math.min(0.62, w.r + 0.05); wetDraw(); return; } let w = WM.find(q => !q.on); if (!w) w = WM.reduce((a, b) => (a.t < b.t ? a : b)); w.on = true; w.x = x; w.y = y; w.z = z; w.r = 0.32; w.t = 60; wetDraw(); }
  function wetDraw() { if (!WET) return; let n = 0; for (const w of WM) { if (!w.on) continue; const r = w.r * Math.min(1, w.t / 20); WET.setMatrixAt(n, _m.compose(_v.set(w.x, w.y + 0.025, w.z), _q.identity(), _s.set(r, 1, r))); WET.setColorAt(n, _c.set(0x8a8f96)); n++; } WET.count = n; WET.visible = n > 0 && A.on(); WET.instanceMatrix.needsUpdate = true; WET.instanceColor.needsUpdate = true; }
  function wetSec(dt) { let ch = false; for (const w of WM) if (w.on) { w.t -= dt; ch = true; if (w.t <= 0) w.on = false; } if (ch) wetDraw(); }
  // 물 채우기: 학교 수돗가·텃밭 수도(지점 'wash'·'garden' — 물뿌리개를 든 동안만 그 자리 E = 채우기) · 약수터 · 강·연못가(내 자리 E) · 바닷물은 짜서 X
  function faucets() { for (const h of FAUCH) h.remove(); FAUCH = []; const L9 = [], SEEN = new Set();
    for (const kd of ['wash', 'garden']) for (const h of map.interact.list({ kind: kd }) || []) { if (h.pump || String(h.id || '').startsWith('game:')) continue; L9.push(h); }
    for (const h of L9) { const k = Math.round(h.x) + ':' + Math.round(h.z); if (SEEN.has(k)) continue; SEEN.add(k); const H9 = map.interact.add({ kind: 'game', x: h.x, z: h.z, y: h.y, r: Math.max(1.0, h.r || 1.2), label: en() ? '💧 Fill the watering can' : '💧 물뿌리개에 물 채우기', use: () => fill([h.x, h.y, h.z]) }); H9.hot.off = true; H9.src = h; FAUCH.push(H9); A.enth.push(H9); }
    for (const [x, z] of A.springs() || []) { const y = A.gy(x, z); const H9 = map.interact.add({ kind: 'game', x, z, y, r: 1.8, label: en() ? '💧 Fill at the spring' : '💧 약수터에서 물 채우기', use: () => fill([x, y, z]) }); H9.hot.off = true; FAUCH.push(H9); A.enth.push(H9); }
    RIVH = map.interact.add({ kind: 'game', x: 0, z: 0, y: -99, r: 1.2, label: en() ? '💧 Fill from the water' : '💧 강물 채우기', use: () => { const me = map.player.pos(); fill([RIVH.hot.wx, me.y, RIVH.hot.wz]); } }); RIVH.hot.off = true; A.enth.push(RIVH); }
  function fillSync() { const can = shownK === 'can' && S().tank < TANK - 1, src = FAUCH.filter(h => h.src);
    for (const h of FAUCH) if (h.hot.off === can) h.hot.off = !can;
    if (can && !FAUOFF && src.length) { const set = new Set(src.map(h => h.src)); FAUOFF = map.interact.enable(h => set.has(h), false); } else if (!can && FAUOFF) { FAUOFF.remove(); FAUOFF = null; }   // 손 씻기·물 주기 E는 그동안만 쉼
    if (!RIVH) return; const me = map.player.pos(); let fw = null, sea = false; if (can) for (let r = 1.2; r <= 2.8 && !fw; r += 0.8) for (let a = 0; a < 8; a++) { const x = me.x + Math.cos(a * 0.785) * r, z = me.z + Math.sin(a * 0.785) * r, w = water(x, z); if (!w) continue; if (w.sea) { sea = true; continue; } fw = [x, z]; break; }
    const h = RIVH.hot; if (fw) { h.x = me.x; h.z = me.z; h.y = me.y; h.wx = fw[0]; h.wz = fw[1]; if (h.off) h.off = false; } else if (!h.off) h.off = true;
    if (sea && !fw && S().tank < 50 && seaTold !== day()) { seaTold = day(); toast(en() ? '🌊 Sea water is salty, so we do not give it to plants — fill up at a tap or riverbank' : '🌊 바닷물은 짜서 식물에 주지 않아요 — 수돗가나 강가에서 채워요', 3.6); } }
  function fill(at) { if (FILL || !A.on()) return; if (cur() !== 'can') { hold('can'); } stopPour(); FILL = { t: 0, g: 0 }; map.player.act('reach', { at: [at[0], at[1] + 0.5, at[2]], msg: null }); }
  function fillTick(dt) { const t = S(); FILL.t += dt; t.tank = Math.min(TANK, t.tank + 85 * dt); tankSync(); if ((FILL.g -= dt) <= 0) { FILL.g = 0.2; tone(260 + Math.random() * 220, 0, 0.09, 'sine', 0.05, 520); }   // 꼴깍꼴깍
    if (FILL.t > 1.25 || t.tank >= TANK) { FILL = null; t.tank = TANK; mark(); tankSync(); tone(784, 0, 0.1, 'triangle', 0.05); toast(en() ? '💧 The can is full!' : '💧 물을 가득 채웠어요!', 1.8); A.rec('fill'); } }

  // ───────── ⛏ 삽 ─────────
  function useShovel() { const x = T.x, z = T.z, y = T.y, en9 = en(), t = S();
    if (T.lock === 'fos') { const id = T.k; map.player.act('dig', { at: [x, y, z], msg: null, midAt: 1.55, color: 0x8a7458, color2: 0xa8957a, onMid: () => { const xp = A.xp(); if (xp && xp.use('shovel', id)) A.rec('dig-fos'); } }); return; }   /* EXPLORE-1 층층골 흙더미(무엇이 나올지 자리마다 정해짐 · 무작위 X) */
    if (T.lock === 'trs') { map.player.act('dig', { at: [x, y, z], msg: null, midAt: 1.55, onMid: () => { const tr = A.trs(); if (tr && tr.shovel && tr.shovel()) { A.rec('dig-trs'); } } }); return; }
    if (A.inSchool(x, z)) { toast(en9 ? '🏫 We do not dig at school — dig in the town soil' : '🏫 학교 땅은 파지 않아요 — 마을 흙에서 파요', 2.4); return; }
    if (water(x, z)) { toast(en9 ? '💧 You cannot dig in water' : '💧 물에서는 팔 수 없어요', 2); return; }
    const snow = A.snowy(); if (!snow && !A.okGround(x, z)) { toast(en9 ? '⛏ Not here — dig on soil or grass' : '⛏ 여기는 팔 수 없어요 — 흙이나 풀밭에서 파요', 2.2); return; }
    if (t.holes.some(h => h[4] === day() && Math.hypot(h[0] - x, h[1] - z) < 0.7)) { toast(en9 ? '⛏ You already dug here' : '⛏ 여기는 벌써 팠어요', 1.8); return; }
    map.player.act('dig', { at: [x, y, z], msg: null, midAt: 1.55, color: snow ? 0xf4f8fb : 0x6b4a2e, color2: snow ? 0xdde6ec : 0x8a6a48, onMid: () => digDone(x, y, z, snow) }); }
  function digDone(x, y, z, snow) { const t = S(), en9 = en(); t.holes.push([+x.toFixed(2), +z.toFixed(2), +y.toFixed(2), snow ? 's' : 'd', day()]); while (t.holes.length > HMAX) t.holes.shift(); mark(); dirty = true; holeDraw(); A.rec(snow ? 'dig-snow' : 'dig');
    if (snow) { const n = A.GAME.use('tool:snow'); if (n <= 6) A.skUp('work', 1, 'snow'); toast(n === 1 ? (en9 ? '⛄ Cleared the snow — the path is less slippery now' : '⛄ 눈을 치웠어요 — 길이 덜 미끄러워요') : (en9 ? '⛄ Cleared the snow' : '⛄ 눈을 치웠어요'), 2.2); return; }
    const n = A.GAME.use('tool:dig'), R = Math.random(), farmy = A.fieldNear(x, z); let got = null;
    if (!t.n.worm && n >= 2) got = 'worm';   // 처음엔 둘째 삽질에 꼭 지렁이(첫 만남 = 관찰 카드)
    else if (farmy && R < 0.35 && A.GAME.uses('tool:pot') < 3) got = 'potato'; else if (R < 0.55 && A.GAME.uses('tool:peb') < 3) got = 'pebble'; else if (R < 0.78) got = 'worm';
    if (got === 'potato') { A.GAME.use('tool:pot'); A.bagAdd('🥔', 1, 'dig:potato'); A.skUp('farm', 1, 'dig:potato'); toast(en9 ? '🥔 A potato! It grew under the soil near the field' : '🥔 감자가 나왔어요! 밭 둘레 흙 속에서 자랐어요', 2.4); return; }
    if (got === 'pebble') { A.GAME.use('tool:peb'); A.bagAdd('⚪', 1, 'dig:pebble'); A.skUp('look', 1, 'dig:pebble'); toast(en9 ? '⚪ A pebble — water and time wore it round' : '⚪ 조약돌이 나왔어요 — 물과 세월에 닳아 동글동글해요', 2.4); return; }
    if (got === 'worm') { wormShow(x, y, z); const first = !t.n.worm; t.n.worm = (t.n.worm || 0) + 1; mark(); const ch = A.chem(); if (ch && ch.lawFound) ch.lawFound('compost', '⛏', 'worm');
      if (first) { A.skUp('look', 3, 'worm'); setTimeout(() => { if (!dead) wormCard(); }, 1400); } else { A.skUp('look', 1, 'worm'); toast(en9 ? '🐛 A wriggly earthworm — a decomposer that makes soil rich. We covered it back up' : '🐛 지렁이가 꿈틀 — 흙을 기름지게 하는 분해자예요. 다시 흙에 덮어 줬어요', 3); } return; }
    toast(L(NOTHING[n % NOTHING.length]), 2.2); }
  function wormCard() { if (A.busy()) { setTimeout(() => { if (!dead) wormCard(); }, 1500); return; } const e = en();
    const P = A.openP('<h3>🔍 ' + (e ? 'Observation card — decomposer' : '관찰 카드 — 분해자') + '</h3><div class="st"><b class="n">🐛</b><span>' + (e ? 'You found an earthworm!' : '지렁이를 찾았어요!') + '</span></div>'
      + '<div class="sm">' + (e ? 'Earthworms eat soil with rotten leaves and leave droppings that make the soil rich. Their tunnels let air and water into the ground.' : '지렁이는 흙과 함께 썩은 잎을 먹고, 똥으로 내보내 흙을 기름지게 해요. 지렁이가 다니는 굴로 공기와 물이 흙 속에 들어가요.') + '</div>'
      + '<div class="sm"><b>' + (e ? 'Decomposer' : '분해자') + '</b> ' + (e ? 'a living thing that breaks dead plants and animals back into soil (worms, fungi, bacteria)' : '죽은 생물을 잘게 부숴 흙으로 돌려보내는 생물(지렁이·곰팡이·세균)') + '</div>'
      + '<div class="sm">' + (e ? 'We covered it back up with soil. (Notebook → Rules)' : '지렁이는 다시 흙에 덮어 줬어요. (수첩 → 규칙 칸)') + '</div><div class="row"><button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'tool');
    P.onclick = ev => { const b = ev.target.closest('button'); if (b) A.closeP(); }; }
  function wormShow(x, y, z) { WORM = { x, y, z, t: 0 }; }
  function wormTick(dt) { const W = WORM; W.t += dt; if (W.t > 3.2) { WORMM.visible = false; WORM = null; return; } const up = Math.min(1, W.t / 0.4) * (W.t > 2.6 ? Math.max(0, (3.2 - W.t) / 0.6) : 1);
    for (let i = 0; i < 5; i++) { const s = i / 4, w = Math.sin(W.t * 7 + s * 4) * 0.05; WORMM.setMatrixAt(i, _m.compose(_v.set(W.x - 0.12 + s * 0.24, W.y + 0.02 + up * (0.05 + Math.sin(s * 3.1) * 0.05), W.z + w), _q.identity(), _s.setScalar(0.03 * (i === 0 ? 1.15 : 1)))); }
    WORMM.count = 5; WORMM.visible = true; WORMM.instanceMatrix.needsUpdate = true; }
  function holeDraw() { if (!HOLE) return; const t = S(); let n = 0; for (const h of t.holes) { if (h[4] !== day()) continue; const s = h[3] === 's'; HOLE.setMatrixAt(n, _m.compose(_v.set(h[0], h[2] + 0.02, h[1]), _q.identity(), _s.set(s ? 0.48 : 0.3, 1, s ? 0.48 : 0.3))); HOLE.setColorAt(n, _c.set(s ? 0x7d6a55 : 0x3b2a1e)); n++; }
    HOLE.count = n; HOLE.visible = n > 0 && A.on(); HOLE.instanceMatrix.needsUpdate = true; HOLE.instanceColor.needsUpdate = true; }

  // ───────── 🎣 낚싯대: 던지기 → 2~6초 뒤 입질(찌가 쏙 + 소리) → 1초 안에 누르면 잡음 → 놓아주기·가방 ─────────
  function useRod() { const e = en(); let at = null; if (T.ok) at = [T.x, T.y + 0.02, T.z];
    if (!at) { const me = map.player.pos(); _f.set(0, 0, -1).applyQuaternion(map.camera.quaternion); const fl = Math.hypot(_f.x, _f.z) || 1; for (let d = 2.4; d <= 9 && !at; d += 0.5) { const x = me.x + _f.x / fl * d, z = me.z + _f.z / fl * d, w = water(x, z); if (w) at = [x, w.y + 0.02, z]; } }
    if (!at) { toast(e ? '🎣 Face the water and cast — the ring must be on the water' : '🎣 물가에서 물을 보고 던져요 — 고리가 물 위에 있어야 해요', 2.6); return; }
    const w = water(at[0], at[2]), sea = !!(w && w.sea), G = A.GAME; let fish = null, why = '';
    if (sea) { const r = fishAt(A.season(), A.low(), 'near', 'worm', G.S.dex, G.S.day * 7 + G.uses('tool:catch')); fish = r.f; why = r.why; } else fish = A.night() ? FRESH[2] : FRESH[(Math.random() * 2) | 0];   /* 메기 = 밤에 움직임(사실) · 낮 = 붕어·피라미 */
    const h = map.player.act('cast', { at, msg: null }); if (!h) return; FS = { h, ph: 'fly', t: 0, bite: fish ? 2 + Math.random() * 4 : 7, bt: 0, sea, at, fish, why }; A.rec('cast'); tchSync(); }
  function fishStop() { if (FS && FS.h && !FS.h.done) FS.h.stop(); FS = null; tchSync(); }
  function fishPress() { const F = FS, e = en(); if (!F) return; if (F.ph === 'bite') { F.h.reel(true); F.ph = 'got'; tchSync(); setTimeout(() => { if (!dead) tugGo(F.fish); }, 650); return; }
    if (F.ph === 'fly' || F.ph === 'wait') { F.h.reel(false); F.ph = 'early'; toast(e ? '🎣 Too early — wait until the float dips' : '🎣 너무 일찍 당겼어요 — 찌가 쏙 들어갈 때 눌러요', 2.4); } }
  function fishTick(dt) { const F = FS, e = en(); if (F.h.done) { if (F.ph === 'wait' || F.ph === 'fly' || F.ph === 'bite') toast(e ? '🎣 You reeled in the line' : '🎣 낚싯줄을 거뒀어요', 1.6); FS = null; tchSync(); return; }
    if (F.ph === 'fly') { if (F.h.landed) { F.ph = 'wait'; F.t = 0; } return; }
    if (F.ph === 'wait') { F.t += dt; if (F.t >= F.bite && !F.fish) { F.h.reel(false); F.ph = 'none'; tchSync(); toast('🎣 ' + L(FISH_FACT[F.why || 'low']), 4); A.rec('nobite'); return; } if (F.t >= F.bite) { F.h.dip(); F.ph = 'bite'; F.bt = 0; tchSync(); pop(e ? '❗ Now!' : '❗ 지금!'); tone(1175, 0, 0.08, 'square', 0.04); tone(1568, 0.08, 0.1, 'square', 0.04); } return; }
    if (F.ph === 'bite') { F.bt += dt; if (F.bt > 2.5) { F.h.reel(false); F.ph = 'miss'; tchSync(); toast(e ? '💨 It got away — press as soon as the float dips' : '💨 놓쳤어요 — 찌가 쏙 들어가면 바로 눌러요', 2.4); A.rec('miss'); } } }
  function pop(txt) { const p = document.createElement('div'); p.className = 'twn-pop'; p.style.color = '#ffe36b'; p.textContent = txt; document.body.appendChild(p); setTimeout(() => p.remove(), 1300); }
  /* FISH-2: 찌가 쏙 → 누르면 일 놀이와 같은 줄다리기 한 마리(town.js tug → town_minigame.js mkTug) → 낚으면 놓아주기·가방 */
  function tugGo(fish) { if (!fish) return; const e = en(); const ok = A.tug(fish, res => { if (dead) return; if (res > 0) { A.rec('tug-ok'); catchShow(fish); } else if (res === 0) { A.rec('tug-miss'); toast(e ? '💨 It got away — pull the opposite way to the fish' : '💨 물고기가 달아났어요 — 물고기 반대쪽으로 끌어요', 2.6); } }); if (!ok) catchShow(fish); }
  function catchShow(fish) { const e = en(), G = A.GAME; if (!fish) return; G.use('tool:catch');
    const neu = G.found('fish:' + fish.id); A.skUp('look', neu ? 3 : 1, 'fish:' + fish.id); A.rec('catch', { id: fish.id }); const full = G.uses('tool:fish') >= 2;
    const P = A.openP('<h3>🎣 ' + (e ? 'You caught a fish!' : '물고기를 낚았어요!') + '</h3><div style="display:flex;gap:14px;align-items:center;margin:6px 0"><div style="font-size:54px;line-height:1">🐟</div><div><b style="font-size:18px">' + esc(L(fish.t)) + '</b><div class="sm">' + esc(L(fish.line)) + '</div></div></div>'
      + (neu ? '<div class="sm">' + (e ? 'Added to the codex: 🎣 Fish met.' : '도감 「🎣 낚은 물고기」에 넣었어요.') + '</div>' : '')
      + '<div class="sm">' + (e ? 'Let it go and it grows up to lay eggs. In breeding season people agree not to fish.' : '놓아주면 다시 자라 알을 낳아요. 알 낳는 때(금어기)엔 잡지 않기로 약속해요.') + '</div>'
      + '<div class="row"><button data-a="rel">💧 ' + (e ? 'Let it go' : '놓아주기') + '</button><button class="sub" data-a="bag"' + (full ? ' disabled' : '') + '>🎒 ' + (e ? 'Into the bag' : '가방에 넣기') + '</button></div>'
      + (full ? '<div class="sm">' + (e ? 'Today’s share for the bag (2) is full — new share tomorrow at 6:00' : '오늘 가방 몫(두 마리)은 다 찼어요 — 내일 아침 6시에 다시') + '</div>' : ''), false, 'tool');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; A.closeP(); if (b.dataset.a === 'bag') { G.use('tool:fish'); A.bagAdd('🐟', 1, 'rod'); A.skUp('work', 1, 'rod'); A.rec('fish-bag'); } else release(); }; }
  function release() { const e = en(), G = A.GAME, n = G.use('tool:rel'); if (n <= 4) A.skUp('look', 2, 'rod:release'); const ch = A.chem(); if (ch && ch.lawFound) ch.lawFound('release', '🐟', 'swim'); A.rec('release');
    setTimeout(() => { if (!dead && !A.busy()) map.player.act('emo3'); }, 120);   // 머리 위 하트
    if (n === 1) { const me = map.player.pos(); let w = null, bd = 400; for (const q of A.workers() || []) { if (q.k !== 'fisher' || q.rep === false) continue; const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < bd) { bd = d; w = q; } } if (w) { const up = G.heart(w.hk || 'nb:fisher:' + A.cell(w.x, w.z), 1, 'rod');   /* NB-0 일터 열쇠 */ if (up) A.heartUp(up, w); } }
    toast(e ? '💧 You let the fish go — it will grow and lay eggs' : '💧 물고기를 놓아줬어요 — 다시 자라 알을 낳아요', 2.8); }

  // ───────── 🔍 돋보기 ─────────
  function useLens() { const e = en(), t = S(); let x = T.x, y = T.y, z = T.z; const me = map.player.pos(), L9 = T.lock ? lensAt(x, z, me) : null;
    const h = map.player.act('peer', { at: [x, y, z], msg: null, midAt: 1.35, onMid: () => {
      if (L9 && L9.kind === 'bug') { A.bugLook(L9.s); A.rec('lens-bug'); return; }
      if (L9 && (L9.kind === 'fos' || L9.kind === 'xrock')) { const xp = A.xp(); if (xp) xp.use('lens', L9.key); A.rec('lens-' + L9.kind); return; }   /* EXPLORE-1 화석 돌판 · 까망봉 돌 */
      const kd = L9 ? L9.kind : 'soil', d = day(), first = t.n['l:' + kd] !== d; t.n['l:' + kd] = d; mark(); if (first) A.skUp('look', 1, 'lens:' + kd); A.rec('lens-' + kd);
      if (kd === 'mush') toast(L(LOOKF.mush) + (L9.m.poison ? L(LOOKF.poison) : ''), 4); else toast(L(LOOKF[kd]), 4); } });
    void h; void e; }

  // ───────── 🧹 빗자루: 쓸 자리(24m 칸마다 그날 정해짐 · 가을 = 낙엽 · 겨울·눈 = 눈 · 그 밖 = 길가 쓰레기 몇 곳) ─────────
  const swMode = () => { const s = A.season(), w = A.wx(); return s === 'winter' || w === 'snow' ? 'snow' : s === 'autumn' ? 'leaf' : 'litter'; };
  function cellPiles(cx, cz, d, mode) { const key = d + ':' + mode + ':' + cx + ':' + cz; let L9 = PCACHE.get(key); if (L9) return L9; L9 = []; PCACHE.set(key, L9); const R = A.rng('tsw:' + A.id + ':' + key), kit = mode !== 'litter' && !!(A.kitPile && A.kitPile(cx * CELL + CELL / 2, cz * CELL + CELL / 2)), p = kit ? 0.9 : mode === 'litter' ? 0.16 : 0.5; if (R() > p) return L9;   /* CELLKIT-1: 칸 키트가 '골목 쓸기'를 고른 칸 = 낙엽·눈 더미가 더 자주·둘 */
    const n = kit ? 2 : mode === 'litter' ? 1 : R() < 0.4 ? 2 : 1; for (let i = 0; i < 10 && L9.length < n; i++) { const x = cx * CELL + 2 + R() * (CELL - 4), z = cz * CELL + 2 + R() * (CELL - 4); if (A.inSchool(x, z)) continue; if (!(A.side(x, z) || (mode !== 'litter' && A.okGround(x, z)))) continue;
      L9.push({ k: cx + ':' + cz + ':' + L9.length, x: +x.toFixed(2), z: +z.toFixed(2), y: A.gy(x, z), r: R(), mode }); } return L9; }
  function pilesSync(force) { const me = map.player.pos(), cx = Math.floor(me.x / CELL), cz = Math.floor(me.z / CELL), d = day(), mode = swMode(), t = S(); if (t.sw.d !== d) { t.sw = { d, k: {} }; mark(); }
    const sig = cx + ':' + cz + ':' + d + ':' + mode; if (!force && sig === center) return; center = sig; if (mode !== lastMode || d !== lastDay) { PCACHE.clear(); lastMode = mode; lastDay = d; }
    PILES.length = 0; if (A.on()) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const p of cellPiles(cx + i, cz + j, d, mode)) if (!t.sw.k[p.k]) PILES.push(p); dirty = true; }
  function useBroom() { if (T.lock === 'fos') { const id = T.k; map.player.act('sweep', { at: [T.x, T.y, T.z], msg: null, colors: [0xd2c6b0, 0xb8a888], midAt: 1.7, onMid: () => { const xp = A.xp(); if (xp && xp.use('broom', id)) A.rec('sweep-fos'); } }); return; }   /* EXPLORE-1 돌판 쓸기 */
    const e = en(), t = S(), p = T.lock === 'pile' ? PILES.find(q => q.k === T.k) : null, mode = swMode();
    const cols = !p ? [0xb8a888, 0xa89878] : p.mode === 'leaf' ? [0xd8762a, 0xc8452e, 0xe8b23a] : p.mode === 'snow' ? [0xf4f8fb, 0xe2ebf2] : [0xf4f4ee, 0xd8d0c0, 0xc8443a];
    map.player.act('sweep', { at: [T.x, T.y, T.z], msg: null, colors: cols, midAt: 1.7, onMid: () => {
      if (!p) { if (Math.random() < 0.5) toast(e ? '🧹 Nothing to sweep here — look for leaves, snow or litter' : '🧹 여긴 쓸 것이 없어요 — 낙엽·눈·쓰레기를 찾아봐요', 2.2); return; }
      t.sw.k[p.k] = 1; const i = PILES.indexOf(p); if (i >= 0) PILES.splice(i, 1); dirty = true; const d = day(); if (t.clean.d !== d) { t.clean.d = d; t.clean.n = 0; } t.clean.n++; t.clean.all = (t.clean.all || 0) + 1; mark(); A.rec('sweep', { m: p.mode });
      A.skUp('work', 1, 'sweep'); tone(988, 0.05, 0.08, 'triangle', 0.04); tone(1319, 0.13, 0.1, 'triangle', 0.04);
      const what = p.mode === 'leaf' ? (e ? 'leaves' : '낙엽을') : p.mode === 'snow' ? (e ? 'snow' : '눈을') : (e ? 'litter' : '쓰레기를');
      toast(e ? '🧹 Swept up the ' + what + '! Today you cleaned ' + t.clean.n + (t.clean.n > 1 ? ' spots' : ' spot') + ' in town' : '🧹 ' + what + ' 쓸었어요! 오늘 마을을 ' + t.clean.n + '곳 깨끗이 했어요', 2.8);
      const me = map.player.pos(); let w = null, bd = 40; for (const q of A.workers() || []) { if (!q.k || q.rep === false) continue; const dd = Math.hypot(q.x - me.x, q.z - me.z); if (dd < bd) { bd = dd; w = q; } }
      if (w) { const hk = w.hk || 'nb:' + w.k + ':' + A.cell(w.x, w.z); if (A.GAME.uses('swh:' + hk) < 1) { A.GAME.use('swh:' + hk); const up = A.GAME.heart(hk, 1, 'sweep'); A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, e ? 'So clean now. Thank you!' : '깨끗해졌네요. 고마워요!'); if (up) setTimeout(() => { if (!dead) A.heartUp(up, w); }, 1200); } } } }); void mode; }
  // 빗자루 빌리는 곳: 마을회관·경로당 문 옆(기대 세운 빗자루 + 쪽지 E) — 새 사람 X
  let STANDS = [];
  function stands() { for (const h of STANDH) h.remove(); STANDH = []; STANDS = []; const bl = map.q.blocked || map.q.blockedAt;
    for (const p of A.places() || []) { if (!/마을회관|경로당/.test(p.name || '') || !p.door) continue; const nx0 = p.door[0] - p.x, nz0 = p.door[1] - p.z, nl = Math.hypot(nx0, nz0) || 1, nx = nx0 / nl, nz = nz0 / nl; let at = null;
      for (const sd of [1.7, -1.7, 2.4, -2.4]) { const x = p.door[0] + nx * 0.9 - nz * sd, z = p.door[1] + nz * 0.9 + nx * sd; if (!bl(x, z, A.gy(x, z) + 0.6)) { at = [x, z]; break; } } if (!at) continue;
      const y = A.gy(at[0], at[1]); STANDS.push({ x: at[0], y, z: at[1], ry: Math.atan2(nx, nz) });
      const H9 = map.interact.add({ kind: 'game', x: at[0], z: at[1], y, r: 1.6, label: en() ? '🧹 Borrow the broom' : '🧹 빗자루 빌리기', use: () => broomTake(p) }); STANDH.push(H9); A.enth.push(H9); }
    standSync(); dirty = true; }
  function standSync() { const off = !!S().have.broom; for (const h of STANDH) if (h.hot.off !== off) h.hot.off = off; }
  function broomTake(p) { const e = en(); if (S().have.broom) { toast(e ? '🧹 You already have a broom — press 5 to hold it' : '🧹 빗자루는 벌써 있어요 — 5를 눌러 들어요', 2.4); return; }   /* FEEL-2: 예전엔 아무 말 없이 끝 */ toast((e ? '📝 A note by the door: "Anyone who cleans the town may use it." — ' : '📝 문 옆 쪽지: "마을을 깨끗이 해 줄 분은 마음껏 쓰세요" — ') + esc(p.name || ''), 3.6); got('broom'); standSync(); dirty = true; }

  // ───────── 덩이·조각 그리기(바뀔 때만): 쓸 자리 · 구덩이 흙 · 꽃 한 송이 더 · 기대 선 빗자루 ─────────
  const LEAFC = [0xd8762a, 0xc8452e, 0xe8b23a, 0x9a6a3a], FLC = [0xf28bb0, 0xf6d23c, 0xb48cf0, 0xff8a5c, 0xffffff];
  function drawAll() { dirty = false; if (!MOUND) return; const on = A.on(), t = S(), d = day(), me = map.player.pos(); let m = 0, b = 0;
    const M = (x, y, z, sx, sy, sz, hex, ry = 0) => { if (m >= 96) return; MOUND.setMatrixAt(m, _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sx, sy, sz))); MOUND.setColorAt(m, _c.set(hex)); m++; };
    const Bx = (x, y, z, sx, sy, sz, hex, ry = 0, rz = 0) => { if (b >= 64) return; BITS.setMatrixAt(b, _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, rz)), _s.set(sx, sy, sz))); BITS.setColorAt(b, _c.set(hex)); b++; };
    if (on) { for (const p of PILES) { const r = p.r * 6.28;
        if (p.mode === 'leaf') for (let i = 0; i < 3; i++) M(p.x + Math.cos(r + i * 2.1) * 0.22, p.y + 0.05, p.z + Math.sin(r + i * 2.1) * 0.22, 0.26 + 0.06 * i, 0.07 + 0.02 * i, 0.22 + 0.05 * i, LEAFC[(i + ((p.r * 10) | 0)) % 4], r + i);
        else if (p.mode === 'snow') { M(p.x, p.y + 0.06, p.z, 0.48, 0.2, 0.4, 0xf4f8fb, r); M(p.x + 0.3, p.y + 0.04, p.z + 0.12, 0.26, 0.13, 0.24, 0xe6eef4, r + 1); }
        else { Bx(p.x, p.y + 0.02, p.z, 0.2, 0.03, 0.15, 0xf4f4ee, r); Bx(p.x + 0.22, p.y + 0.035, p.z + 0.08, 0.07, 0.07, 0.13, 0xc8443a, r + 0.6); Bx(p.x - 0.14, p.y + 0.02, p.z + 0.16, 0.12, 0.03, 0.09, 0xf2c230, r - 0.4); } }
      for (const h of t.holes) { if (h[4] !== d) continue; if (h[3] === 's') M(h[0] + 0.55, h[2] + 0.05, h[1], 0.3, 0.14, 0.26, 0xf4f8fb); else M(h[0] + 0.42, h[2] + 0.04, h[1] + 0.1, 0.24, 0.1, 0.2, 0x6b4a2e, 0.4); }
      for (const k of Object.keys(t.bloom)) { const q = t.bloom[k], n = Math.min(3, q.c - (q.w === d ? 1 : 0)); if (n <= 0 || Math.hypot(q.x - me.x, q.z - me.z) > 60 || A.noFlower()) continue;
        for (let i = 0; i < n; i++) { const a = i * 2.2 + (q.x * 3) % 6, x = q.x + Math.cos(a) * 0.32, z = q.z + Math.sin(a) * 0.32; Bx(x, q.y + 0.18, z, 0.03, 0.36, 0.03, 0x4f9a3e); M(x, q.y + 0.38, z, 0.08, 0.06, 0.08, FLC[(i + k.length) % FLC.length]); } }
      if (!t.have.broom) for (const s of STANDS) { Bx(s.x, s.y + 0.48, s.z, 0.035, 0.86, 0.035, 0xb08850, s.ry, 0.14); Bx(s.x + Math.cos(s.ry) * 0.06, s.y + 0.11, s.z - Math.sin(s.ry) * 0.06, 0.22, 0.2, 0.05, 0xe2c46a, s.ry, 0.14); } }
    MOUND.count = m; MOUND.visible = m > 0; BITS.count = b; BITS.visible = b > 0; MOUND.instanceMatrix.needsUpdate = BITS.instanceMatrix.needsUpdate = true; MOUND.instanceColor.needsUpdate = BITS.instanceColor.needsUpdate = true; holeDraw(); }

  // ───────── 받기(큰 보상 연출 · 바로 손에) ─────────
  function got(k) { const t = S(); if (!TOOL[k] || t.have[k]) return false; t.have[k] = 1; mark(); PEND.push(k); return true; }
  function giftTick() { if (!PEND.length || OVL || A.busy()) return; const k = PEND.shift(), T9 = TOOL[k], e = en(), i = TOOL_ORDER.indexOf(k) + 1;
    const el = document.createElement('div'); el.className = 'twn-lvup'; el.innerHTML = '<div class="c"><div class="i">' + T9.ic + '</div>' + (e ? 'New tool: ' : '새 도구! ') + esc(L(T9.t)) + '<small>' + esc(L(T9.how)) + '</small><small>' + (A.tch() ? (e ? 'It is in your hand — tap 🧰 Use' : '손에 들었어요 — 🧰 쓰기를 눌러요') : (e ? 'It is in your hand — ' + i + ' = hold · click or F = use' : '손에 들었어요 — ' + i + ' = 들기 · 클릭 또는 F = 쓰기')) + '</small></div>';
    const cols = ['#e85a8a', '#f2c84b', '#6a9ae0', '#4fa85a', '#f0863a', '#fff8ea']; for (let j = 0; j < 36; j++) { const q = document.createElement('i'); q.style.background = cols[j % cols.length]; q.style.left = (Math.random() * 100).toFixed(1) + '%'; el.appendChild(q);
      try { q.animate([{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translate(' + ((Math.random() - 0.5) * 180).toFixed(0) + 'px,' + (innerHeight * (0.65 + Math.random() * 0.4)).toFixed(0) + 'px) rotate(' + ((Math.random() - 0.5) * 720).toFixed(0) + 'deg)' }], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards', delay: Math.random() * 250 }); } catch (er) { /* 옛 브라우저 */ } }   /* town.js lvFx와 같은 종이 꽃가루 */
    document.body.appendChild(el); OVL = el; [523, 659, 784, 1047, 1319].forEach((f, j) => tone(f, j * 0.1, 0.22, 'triangle', 0.06)); A.rec('got', { k });
    S().cur = null; hold(k); setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); if (OVL === el) OVL = null; }, 400); }, 3600); }
  function rodGive() { if (S().have.rod) return; const me = map.player.pos(); for (const w of A.workers() || []) { if (w.k !== 'fisher') continue; if (Math.hypot(w.x - me.x, w.z - me.z) < 5 && Math.abs(w.g - me.y) < 3) { A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, en() ? 'Here, borrow a fishing rod. Try casting at the water!' : '낚싯대 하나 빌려줄게요. 물가에서 던져 봐요!'); got('rod'); return; } } }

  // ───────── 어깨 너머 시점(물총 결 — 오른쪽 1m가 트였을 때만 0.4m 비켜 섬 · 0.2초마다 확인) ─────────
  function shoulderTick(dt) { if ((shQ -= dt) <= 0) { shQ = 0.2; const me = map.player.pos(), cp = map.camera.position; _f.set(0, 0, -1).applyQuaternion(map.camera.quaternion); const rx = -_f.z, rz = _f.x, l = Math.hypot(rx, rz) || 1, ux = rx / l, uz = rz / l, bl = map.q.blocked || map.q.blockedAt;
      shW = shownK && !A.busy() && !map.player.first && !bl(me.x + ux, me.z + uz, me.y + 1.2) && !bl(cp.x + ux, cp.z + uz, cp.y) ? 0.4 : 0; if (shV !== 0 || shW !== 0) map.player.shoulder(shV); }
    if (Math.abs(shV - shW) > 1e-3) { shV += Math.sign(shW - shV) * Math.min(Math.abs(shW - shV), dt * (shW < shV ? 4 : 1.5)); map.player.shoulder(shV); } }

  // ───────── 돌기 ─────────
  function tick(dt) { if (dead || window.SM_PROMO) return; if (!built) { if (!A.on()) return; build(); ui(); faucets(); stands(); pilesSync(true); holeDraw(); barSync(); showSync(); }
    const on = A.on();
    if ((secQ += dt) >= 0.25) { const st = secQ; secQ = 0; showSync(); if (on) { pilesSync(false); fillSync(); rodGive(); giftTick(); wetSec(st); if (S().holes.length && S().holes[0][4] !== day()) { S().holes = S().holes.filter(h => h[4] === day()); mark(); holeDraw(); } }
      if (PICK > 0 && (PICK -= st) <= 0) PICK = 0; barSync(); tchSync(); if (RING) RING.visible = false; }
    if (dirty) drawAll();
    if (FILL) fillTick(dt);
    if (WORM) wormTick(dt);
    if (FS) fishTick(dt);
    if (burstT > 0 && (burstT -= dt) <= 0 && pressing === 'b') pressing = false;
    const ok = on && !!shownK && !A.busy();
    if (ok) { if ((aimQ -= dt) <= 0) { aimQ = 0.1; aimCalc(false); } if (RING) { const vis = cur() !== 'rod' || T.ok; RING.visible = vis && !(cur() === 'rod' && FS); if (vis) { RING.position.x += (T.x - RING.position.x) * Math.min(1, dt * 14); RING.position.z += (T.z - RING.position.z) * Math.min(1, dt * 14); RING.position.y = T.y + 0.05;
          const s = cur() === 'broom' ? 1.35 : cur() === 'lens' ? 0.8 : 1; RING.scale.set(s, s, s); RING.material.color.setHex(T.lock ? 0xffd23c : 0xffffff); } } }
    else if (RING && RING.visible) RING.visible = false;
    if (ok && pressing && cur() === 'can' && !FILL) pourTick(dt); else { if (pressing && cur() !== 'can') pressing = false; map.player.holdUse(false); if (aimHold > 0 && (aimHold -= dt) <= 0) map.player.aim(null); }
    dropTick(dt);
    if (on) shoulderTick(dt); }
  // 키(town.js keyDn이 부름 — 창·대화·놀이가 아닐 때): 1~5 = 들기 · 도구를 들고 보일 때만 F = 쓰기(아니면 예전대로 장소 찾기)
  function key(e) { if (dead || !A.on() || A.busy() || (window.__pause && window.__pause.on) || document.body.classList.contains('title-on')) return false; const c = e.code, d = /^(?:Digit|Numpad)([1-5])$/.exec(c);
    if (d) { hold(TOOL_ORDER[+d[1] - 1]); return true; }
    if (c === 'KeyF' && shownK) { press(true, 'f'); return true; } return false; }
  const onKU = e => { if (e.code === 'KeyF') press(false, 'f'); };
  const onMD = e => { if (e.button !== 0 || !shownK || !e.target || e.target.tagName !== 'CANVAS' || !document.pointerLockElement) return; press(true, 'm'); };
  const onMU = e => { if (e.button === 0) press(false, 'm'); };
  const onClk = e => { const d9 = e.detail || {}; if (d9.center || document.pointerLockElement || !shownK || A.tch()) return; if (cur() === 'can') { if (press(true, 'b')) burstT = 0.9; } else press(true, 'c'); };   // 마우스 늘 보임(끌기) = 톡 → 한 번(물뿌리개는 0.9초)
  const onBlur = () => press(false, 'all');
  addEventListener('keyup', onKU); addEventListener('mousedown', onMD); addEventListener('mouseup', onMU); addEventListener('sm-click', onClk); addEventListener('blur', onBlur);
  // 짓기마다(setEntries) — 실제 짓기는 첫 tick(마을 아래쪽 선언보다 먼저 돌지 않게 · CHEM과 같은 규칙)
  function init() { if (window.SM_PROMO) return; FGRID.clear(); POTS = null; PCACHE.clear(); center = null; if (built) { faucets(); stands(); pilesSync(true); } if (window.SM_TOWN) window.SM_TOWN.tools = API; }
  function dispose() { dead = true; removeEventListener('keyup', onKU); removeEventListener('mousedown', onMD); removeEventListener('mouseup', onMU); removeEventListener('sm-click', onClk); removeEventListener('blur', onBlur);
    if (FS) fishStop(); stopPour(); map.player.aim(null); if (shV) map.player.shoulder(0); map.player.hold(null); if (FAUOFF) { FAUOFF.remove(); FAUOFF = null; } for (const h of FAUCH.concat(STANDH)) h.remove(); FAUCH = []; STANDH = []; if (RIVH) { RIVH.remove(); RIVH = null; }
    for (const o of [RING, DROP, MOUND, BITS, HOLE, WET, WORMM]) if (o) map.remove(o); for (const m of MATS) m.dispose(); for (const g of GEOS) g.dispose(); if (BAR) BAR.remove(); if (tchBtn) tchBtn.remove(); if (CSS) CSS.remove(); if (OVL) OVL.remove(); BAR = tchBtn = CSS = OVL = null; }
  // 시험·디버그(SM_TOWN.tools)
  const API = {
    info: () => { const t = S(); return { have: Object.keys(t.have).filter(k => t.have[k]), cur: t.cur, shown: shownK, engine: map.player.holding, tank: +t.tank.toFixed(1), pressing: !!pressing, aim: { x: +T.x.toFixed(2), y: +T.y.toFixed(2), z: +T.z.toFixed(2), ok: T.ok, lock: T.lock, k: T.k }, ring: !!(RING && RING.visible),
      fish: FS ? { ph: FS.ph, t: +FS.t.toFixed(2), bite: +FS.bite.toFixed(2) } : null, fill: !!FILL, holes: t.holes.filter(h => h[4] === day()).length, piles: PILES.length, mode: swMode(), clean: { ...t.clean }, bloom: Object.keys(t.bloom).length, worm: t.n.worm || 0, drops: pAlive, bar: !!(BAR && BAR.classList.contains('on')), touch: !!(tchBtn && tchBtn.style.display !== 'none'),
      faucets: FAUCH.length, faucetOn: FAUCH.filter(h => !h.hot.off).length, river: !!(RIVH && !RIVH.hot.off), stands: STANDS.length, pend: PEND.slice(), ovl: !!OVL, wet: WM.filter(w => w.on).length, wide: wideOn(), sides: SIDE.filter(q => q.on).map(q => [+q.x.toFixed(2), +q.z.toFixed(2)]), pourN, pourMax }; },   /* SPEND-1: 이번 누름에 젖은 두둑 수 · 가장 많이 */
    hold: k => hold(k), give: k => got(k), aim: (x, z) => { if (x == null) OVR.on = false; else { OVR.on = true; OVR.x = x; OVR.z = z; } aimCalc(true); return { ...T }; }, press: (on, src) => press(on, src || 'k'), use: () => press(true, 'k'),
    bite: () => { if (FS && FS.ph === 'wait') FS.bite = FS.t; else if (FS && FS.ph === 'fly') FS.bite = 0; return !!FS; }, piles: () => PILES.map(p => ({ k: p.k, x: p.x, z: p.z, y: +p.y.toFixed(2), mode: p.mode })), stands: () => STANDS.map(s => ({ x: +s.x.toFixed(1), z: +s.z.toFixed(1) })),
    tank: v => { S().tank = Math.max(0, Math.min(TANK, v)); tankSync(); fillSync(); }, faucets: () => FAUCH.map(h => ({ x: +h.hot.x.toFixed(2), z: +h.hot.z.toFixed(2), y: +h.hot.y.toFixed(2), off: h.hot.off, src: !!h.src })), sync: () => { showSync(); fillSync(); barSync(); tchSync(); pilesSync(true); drawAll(); },
    pick: () => pick(), mesh: () => ({ ring: RING, mound: MOUND && MOUND.count, bits: BITS && BITS.count, hole: HOLE && HOLE.count, wet: WET && WET.count }) };
  function pick() { if (!A.on()) return; ui(); PICK = 8; barSync(); if (!A.tch()) toast(en() ? '🧰 Press 1–5 to hold a tool (click a slot too)' : '🧰 숫자 1~5로 도구를 들어요 (칸을 눌러도 돼요)', 2.6); }
  function keys9() { const e = en(), K = [['1~5', e ? 'tools' : '도구']]; if (shownK) K.push([e ? 'Click·F' : '클릭·F', e ? 'use' : '쓰기']); return K; }
  return { init, tick, dispose, key, got, hold, pick, keys: keys9, get cur() { return shownK; }, get have() { return { ...S().have }; }, api: API };
}
