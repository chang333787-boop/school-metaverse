// 🏡 이웃 하루 일과 + 먹이·물 연쇄(ROUTINE-1 · 사용자 10-24 차례 마지막 '이웃 일과·먹이·물 연쇄' · docs/systems/town_routine.md)
//   ① 일과: 일 시간(town.js WHRS · docs/systems/town_hours.md)이 있는 일꾼은 일 시간 밖엔 몸이 자리를 비움 — 아침에 집 문(없으면 길가)에서 걸어 나와 일터로 · 일이 끝나면 집 쪽으로 걸어가 들어감
//      E(같이 해요·장터)는 몸이 일터에 서 있을 때만 · 일 시간 앞에 먼저 와 서 있으면 예전처럼 '쉬는 중 · 07:00부터' 이름표
//      예외 = 이야기 단계가 그 일꾼을 쓸 때(wkNeed · 주기 단계) · 잔치 초대 · 양몰이 중 — 이때는 늘 자리에 있음
//      걷는 몸은 한 번에 넷까지 · 카메라 75m 안 · 낮에만(밤엔 어차피 안 보여 바로 옮김) · 시계가 크게 뛰면(잠·시험) 바로 옮김 · 매 프레임 일 = 걷는 몸만(새 객체 X)
//   ROUTINE-2 갈래 셋(10-25 · 사람 수 그대로 · 있는 일꾼의 하루에만 · 보상·소식·도감 X):
//      점심 12:00~13:00 = 열에 여섯이 일터 곁 빈 벤치(18m 안)에 걸터앉거나 일터 가장자리 땅에 앉아 도시락 · 그동안 E = '점심 먹는 중 · 13:00에 다시 일해요' 한 줄
//      장 보러 가기 = 하루 둘 · 14:30~15:30에 일을 일찍 마치고 230m 안 가게 문·장터 판매대 앞까지 길(인도 쪽)로 걸어가 4초 안 → 장바구니를 들고 집으로
//      정자에 모이기 = 맑은 날 18:00~20:00 · 정자 곁 이웃 셋이 일을 마친 뒤 마루에 걸터앉아 이야기(이름 없는 이웃 · 날씨·농사·장날) · 비·눈 = 안 모임 · 밤에도 그 몸만 보임
//   ROUTINE-3 저녁·밤 갈래(NIGHT-1 · 10-26 사용자 '시간에 따른 사람들의 행동 변화' · 사람 수 그대로 · 밤에도 그 몸만 보임):
//      🚶 저녁 산책 = 맑은 날 19:05~20:40 · 하루 셋 · 집 앞 → 길가 → 조금 더 → 길가 → 집(한 바퀴) · 🏋 밤 운동 = 맑은 날 20:00~21:40 · 운동 쉼터 320m 안 이웃 둘 · 팔 뻗기·손뼉
//      🛍 퇴근길 장보기 = 하루 둘 · 일을 마치면 집 대신 가게 → 장바구니 들고 집(밤이 되어도 그 몸만 보임) · 비·눈 오는 밤 = 산책·운동 없음(일찍 들어감 · 거리 사람 몫은 town_night.js)
//   ② 먹이·물 연쇄(CHAIN 한 줄 = 조건 → 다음 날 수): 비 사흘 → 논물이 불어 개구리가 늘고 왜가리가 논까지 먹으러 옴 · 비 없는 날 닷새 → 개울물이 줄어 물새가 줄어듦
//      날씨 기록(하루 하나) → 아침마다 한 번 셈 → town_wild.js가 종마다 나올 자리 수만 바꿈(A.fc) · 아침 소식판 한 줄 + 처음 바뀐 아침 알림 한 줄 · 도감 '먹이 사슬' 한 줄(본 것만)
//      잡아먹는 장면 X — '먹으러 온다'까지만 · 사실만(개구리는 물 고인 논·웅덩이에 모이고, 왜가리는 개구리·물고기를 먹으러 물 많은 곳에 옴)
export const ROUTINE_V = 3;
export const CHAIN = {
  base: { frog: 0.67, heron: 0.8, egret: 0.75, spotbill: 1 },   /* 보통 날 = 자리의 이만큼만 나옴(늘고 줄 몫을 남김) */
  rows: [
    { k: 'wet', need: ['rain', 3], f: { frog: 1, heron: 1, egret: 1, spotbill: 1 }, paddy: 1,
      t: ['🐸 비가 사흘 와서 논물이 불었어요. 개구리가 늘자 왜가리가 논까지 먹이를 찾으러 왔어요', '🐸 Three days of rain filled the rice fields. More frogs came out, and herons came to the fields to feed'] },
    { k: 'dry', need: ['clear', 5], f: { frog: 0.34, heron: 0.4, egret: 0.5, spotbill: 0.5 }, paddy: 0,
      t: ['☀️ 비 없는 날이 닷새 이어져 개울물이 줄었어요. 물새들이 물 많은 곳으로 옮겨 가 조금만 보여요', '☀️ Five days without rain left the streams low. Water birds moved to wetter places, so only a few are here'] }
  ]
};
// WATER-1 물 높이(하루 한 번 · 아침): 비 n일 → 물이 n/3만큼 불어남(사흘이면 다) · 비 없는 날 셋째부터 닷새까지 → 줄어듦 · 어제 비 = 길 웅덩이가 하루 더 남음
//   lv −1(가뭄) ~ 0(보통) ~ +1(비 뒤) · 높이는 town_look.js WLV(+0.14m · −0.24m · 둔치 덮개 −0.70 아래 · 석축 밑 −1.4 위) · 색·자갈·논 갈라짐도 이 값 하나로
export function waterOf(kind, n) { const lv = kind === 'rain' ? Math.min(1, n / 3) : kind === 'clear' ? -Math.max(0, Math.min(1, (n - 2) / 3)) : 0; return { lv: Math.round(lv * 1000) / 1000, pud: kind === 'rain' && n >= 1 ? 1 : 0 }; }
// 어제까지 이어진 날씨 줄(비 n일 · 비 없는 날 n일) — W = {날: 'rain'|'clear'|'snow'} · fb(k) = 기록 없는 날 예보
export function streakOf(W, d, fb) { let kind = '', n = 0;
  for (let k = d - 1; k >= Math.max(1, d - 8); k--) { const w = W[k] || (fb ? fb(k) : null); if (!w) break; const t = w === 'rain' ? 'rain' : w === 'clear' ? 'clear' : 'x'; if (t === 'x') break; if (!kind) kind = t; if (t !== kind) break; n++; }
  return { kind, n, row: CHAIN.rows.find(r => r.need[0] === kind && n >= r.need[1]) || null }; }

export function createRoutine(A) {
  const L = [], MV = [], MAXW = 4, SPD = 1.4, SPM = 0.7, en = () => A.lang() === 'en';
  let key = '', lastMin = -1, lastDay = -1, DOORS = null, nGo = 0, nCome = 0, nSnap = 0, nWait = 0, tickMs = 0, tickMax = 0;
  const S = () => A.GAME.S, M = () => A.mesh(), HO = {};   /* HO = 시험만(일 시간 바꿔 보기) */
  // ROUTINE-2 갈래 셋(점심 · 장 보러 가기 · 정자에 모이기) — 사람 수는 그대로 · 있는 일꾼의 하루에만
  const PV = [], SEATN = new Map(), EVS = { lunGo: 1, lun: 1, lunBack: 1, shopGo: 1, shopIn: 1, shopHome: 1, pavCome: 1, pav: 1, pavGo: 1, eveGo: 1, eve: 1, gymGo: 1, gym: 1, gymBack: 1 };
  const NOLUN = { stall: 1, cook: 1, stones: 1 }, BENCHONLY = { paddy: 1, fisher: 1, saltpan: 1 }, NOSHOP = { stall: 1, cook: 1, stones: 1 }, NOPAV = { cook: 1, stones: 1 };
  let NVA = new Uint8Array(0), nvN = 0, dayEv = -1, nLun = 0, nShop = 0, nPav = 0, nTalk = 0, nEve = 0, nGym = 0, nEsh = 0;
  const hsh = (a, b) => { let h = Math.imul(a + 1, 73856093) ^ Math.imul(b + 7, 19349663); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };   /* 날·사람마다 늘 같은 0~1 */
  // ── ① 일과 ──
  function build() { lunOffAll(); L.length = 0; MV.length = 0; DOORS = null; const H = A.hots() || [];
    for (const e of H) { const hot = e[0], k = e[2], w = e[3]; if (!w || !A.playk(k) || w.gate || w.i == null) continue; const h9 = A.hrs(k); if (!h9 || (h9[0] <= 0 && h9[1] >= 24)) continue;   /* 징검다리 = 늘(일이 아니라 놀이) */
      const ph = w.ph || 0; L.push({ w, hot, k, st: 'in', offW: false, hm: undefined, t: 0, Lw: 0, x0: 0, z0: 0, x1: 0, z1: 0, ry: 0, hold: 0, sg: Math.floor(ph * 1.27) % 8, sg2: Math.floor(ph * 2.31) % 6,
        P: null, Lc: null, si: 0, cx: w.x, cz: w.z, gy: 0, gyOn: 0, tm: 0, lunD: -1, lun: null, ls: 0, le: 0, lb: 0, lh: null, seat: null, shopPick: -1, shopD: -1, ts: 0, tgt: null, pv: null, pvD: -1 }); w.out9 = 0; }
    NVA = new Uint8Array(Math.max(1, (A.workers() || []).length)); nvN = 0; dayEv = -1; evBuild(); lastMin = -1; }
  function keyOf() { const H = A.hots() || []; return H.length + ':' + (H[0] ? H[0][3] && H[0][3].i : '') + ':' + (A.workers() || []).length; }
  const doors = () => DOORS || (DOORS = A.doors() || []);
  // 두 점 사이를 몸으로 걸을 수 있나(0.8m 걸음 · 막힘·물·턱 0.6m X)
  function clear(x0, z0, x1, z1) { const dx = x1 - x0, dz = z1 - z0, D = Math.hypot(dx, dz); if (D < 2) return false; let gp = A.ty(x0, z0);
    for (let s = 0.8; s <= D; s += 0.8) { const x = x0 + dx * s / D, z = z0 + dz * s / D, g = A.ty(x, z); if (Math.abs(g - gp) > 0.6 || A.wAt(x, z) || A.blocked(x, z, g + 0.4)) return false; gp = g; } return true; }
  // 집 = 32m 안 집 문 앞(1.2m 바깥 · 일터에서 곧장 걸어 닿는 것) → 없으면 32m 안 길가 → 없으면 0(바로 숨김)
  function homeOf(o) { if (o.hm !== undefined) return o.hm; const w = o.w, C = [];
    for (const d of doors()) { const dd = Math.hypot(d[0] - w.x, d[1] - w.z); if (dd > 3 && dd < 32) C.push([dd - (d[2] ? 12 : 0), d]); }
    C.sort((a, b) => a[0] - b[0]); let hm = 0;
    for (let i = 0; i < C.length && i < 6 && !hm; i++) { const d = C[i][1], dx = w.x - d[0], dz = w.z - d[1], l = Math.hypot(dx, dz) || 1, x = d[0] + dx / l * 1.2, z = d[1] + dz / l * 1.2; if (clear(w.x, w.z, x, z)) hm = { x, z, door: 1 }; }
    if (!hm) hm = roadNear(w.x, w.z, w.x, w.z, 32); if (hm) hm.door = hm.door || 0;
    o.hm = hm; return hm; }
  function roadNear(x0, z0, fx, fz, R) { for (const r of [8, 12, 16, 20, 26, 32]) { if (r > R) break; for (let a = 0; a < 12; a++) { const x = x0 + Math.cos(a * 0.5236) * r, z = z0 + Math.sin(a * 0.5236) * r; if (A.onRoad(x, z, 0.6) && clear(fx, fz, x, z)) return { x, z, door: 0 }; } } return 0; }
  function openNear(x0, z0) { for (const r of [18, 24]) for (let a = 0; a < 12; a++) { const x = x0 + Math.cos(a * 0.5236) * r, z = z0 + Math.sin(a * 0.5236) * r; if (!A.wAt(x, z) && clear(x0, z0, x, z) && clear(x, z, x0, z0)) return { x, z, door: 0 }; } return 0; }
  const walkMin = o => { const h = o.hm; return h ? Math.min(25, Math.ceil(Math.hypot(h.x - o.w.x, h.z - o.w.z) / SPD / SPM) + 2) : h === 0 ? 0 : 14; };   /* 집을 아직 안 셌으면 어림 14분(1초에 셋씩 셈) */
  function wantIn(o, m) { const w = o.w; if (w.party || A.need(w) || A.herd(w)) return true; if (o.shopD === S().day && m >= o.ts) return false;   /* ROUTINE-2 장 보러 간 날 = 일을 일찍 마침 */ const H = HO[o.k] || A.hrs(o.k), cs = H[0] * 60 - walkMin(o) - o.sg, la = H[1] * 60 + o.sg2; return m >= cs && m < la; }
  const camAt = (x, z) => { const c = A.map.camera.position; return Math.hypot(c.x - x, c.z - z); }, camD = o => camAt(o.w.x, o.w.z);
  function unMove(o) { const j = MV.indexOf(o); if (j >= 0) MV.splice(j, 1); }
  function hotOff(o) { if (o.hot && o.offW !== true) { o.offW = true; o.hot.off = true; } }
  function nvSet(o, v) { const i = o.w.i; if (i == null || i >= NVA.length || !NVA[i] === !v) return; NVA[i] = v ? 1 : 0; nvN += v ? 1 : -1; }   /* 밤에도 보이는 몸(정자) */
  function evClean(o) { lunEnd(o); seatFree(o); nvSet(o, 0); o.P = null; o.gyOn = 0; }
  function setIn(o) { evClean(o); unMove(o); o.st = 'in'; o.hold = 0; const w = o.w, h = M(); w.out9 = 0; if (o.hot && o.offW !== false) { o.offW = false; o.hot.off = false; } if (h) { h.set(w.i, w.x, w.g + 0.02, w.z, w.ry); h.reset(w.i); } }
  function setOut(o) { evClean(o); unMove(o); o.st = 'out'; o.hold = 0; const w = o.w, h = M(); w.out9 = 1; if (o.hot) { o.offW = true; o.hot.off = true; } if (h) { h.set(w.i, w.x, w.g + 0.02, w.z, w.ry); h.reset(w.i); } }
  // 걷기 = 꺾은선(점 둘이면 곧은 길) · 시작할 때만 배열을 만듦(매 프레임 새 객체 X)
  function walkP(o, st, P, tool, gy) { const h = M(); unMove(o); o.st = st; o.t = 0; o.P = P; o.si = 0; const Lc = [0]; for (let i = 1; i < P.length; i++) Lc.push(Lc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); o.Lc = Lc; o.Lw = Lc[Lc.length - 1] || 0.01;
    o.x0 = P[0][0]; o.z0 = P[0][1]; o.x1 = P[P.length - 1][0]; o.z1 = P[P.length - 1][1]; o.cx = o.x0; o.cz = o.z0; o.ry = Math.atan2(P[1][0] - P[0][0], P[1][1] - P[0][1]); o.hold = 0; o.gyOn = gy ? 1 : 0; o.gy = gy ? A.gy(o.x0, o.z0, A.ty(o.x0, o.z0) + 1.2) : 0; MV.push(o);
    if (h) { h.act(o.w.i, 'walk', tool || 'none'); h.set(o.w.i, o.x0, (gy ? o.gy : A.ty(o.x0, o.z0)) + 0.02, o.z0, o.ry); } }
  function walk(o, st, x0, z0, x1, z1) { walkP(o, st, [[x0, z0], [x1, z1]]); o.w.out9 = 0; }
  const canWalk = o => MV.length < MAXW && A.night() < 1 && camD(o) < 75 && !!homeOf(o);
  const canWalk2 = (x, z) => MV.length < MAXW && camAt(x, z) < 75;   /* 갈래 셋 = 정자는 밤에도 보이므로 밤 조건 없음 */
  function sec() { if (!A.on()) return; const k9 = keyOf(); if (k9 !== key) { key = k9; build(); } if (!L.length) { chainSec(); return; }
    const G = S(), m = G.min, jump = lastMin < 0 || G.day !== lastDay || Math.abs(m - lastMin) > 4; lastMin = m; lastDay = G.day; if (G.day !== dayEv) evDay(G.day);
    let hb = 3; for (const o of L) { if (o.hm === undefined && hb > 0) { hb--; homeOf(o); } if (evSec(o, m, jump)) continue; const want = wantIn(o, m);
      if (o.st === 'in' && !want && o.eshD === G.day && o.shopD !== G.day && o.tgt && m >= 17 * 60 && m < 20 * 60 && !(o.w.party || A.need(o.w) || A.herd(o.w)) && !nearBusy(o)) { nEsh++; shopStart(o, jump); continue; }   /* ROUTINE-3 퇴근길 장보기 */
      if (o.st === 'in' && !want) { if (!jump && canWalk(o)) { const h = homeOf(o); walk(o, 'go', o.w.x, o.w.z, h.x, h.z); nGo++; } else if (!jump && A.night() < 1 && camD(o) < 40) nWait++; else { setOut(o); nSnap++; } }   /* 걸어갈 길이 없는데 눈앞(40m 안)이면 그 자리에서 '쉬는 중'으로 기다렸다가 멀어지면 들어감(눈앞에서 사라지지 않게) */
      else if (o.st === 'out' && want) { if (!jump && canWalk(o) && !(o.w.party || A.need(o.w) || A.herd(o.w))) { const h = homeOf(o); walk(o, 'come', h.x, h.z, o.w.x, o.w.z); nCome++; } else { setIn(o); nSnap++; } }
      else if (o.st === 'go' && want) setIn(o);
      else if (o.st === 'come' && !want) setOut(o);
      else if (o.st === 'go' && o.hold && camD(o) > 30) setOut(o);   /* 길가에서 멈춘 몸 = 카메라가 멀어지면 들어감(눈앞에서 사라지지 않게) */
      const off = o.st !== 'in'; if (o.hot && o.offW !== off) { o.offW = off; o.hot.off = off; } }   /* 내가 바꿀 때만 씀(길 위 사건 등 다른 갈래가 잠시 끈 E를 되켜지 않음) */
    talkSec(); chainSec(); }
  function tick(dt) { if (!MV.length) return; const t0 = performance.now(), h = M();
    for (let i = MV.length - 1; i >= 0; i--) { const o = MV[i]; if (o.hold) continue; o.t += dt * SPD; const P = o.P, Lc = o.Lc; let k = o.si; while (k < P.length - 2 && o.t >= Lc[k + 1]) k++;
      if (k !== o.si) { o.si = k; o.ry = Math.atan2(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]); }
      const sl = (Lc[k + 1] - Lc[k]) || 1, u = Math.min(1, Math.max(0, (o.t - Lc[k]) / sl)), x = P[k][0] + (P[k + 1][0] - P[k][0]) * u, z = P[k][1] + (P[k + 1][1] - P[k][1]) * u; o.cx = x; o.cz = z;
      if (o.gyOn) o.gy = A.gy(x, z, o.gy + 0.6);   /* 장 보는 길 = 다리·턱 위도 발밑 높이를 따라감(조금 전 높이 + 0.6에서 아래로) */
      if (h) h.set(o.w.i, x, (o.gyOn ? o.gy : A.ty(x, z)) + 0.02, z, o.ry);
      if (o.t >= o.Lw) arrive(o, h); }
    const ms = performance.now() - t0; tickMs = ms; if (ms > tickMax) tickMax = ms; }
  const stand = (o, h, tool) => { o.hold = 1; if (h) h.act(o.w.i, 'stand', tool); };
  function arrive(o, h) { const st = o.st;
    if (st === 'come' || st === 'lunBack') setIn(o);
    else if (st === 'go' || st === 'shopHome') { if (o.hm && o.hm.door) setOut(o); else stand(o, h, st === 'go' ? 'none' : undefined); }   /* 장바구니는 길가에 서 있는 동안도 듦 */
    else if (st === 'lunGo') lunSit(o);
    else if (st === 'shopGo') { unMove(o); o.st = 'shopIn'; o.tm = 4; o.w.out9 = 1; }   /* 가게 안 = 4초 숨김 → 바구니를 들고 나옴 */
    else if (st === 'pavCome') pavSit(o);
    else if (st === 'pavGo') stand(o, h, 'none');
    else if (st === 'eveGo' || st === 'gymBack') setOut(o);
    else if (st === 'gymGo') gymAt(o); }
  const outAt = (x, z) => { for (const o of L) if (o.st !== 'in' && Math.abs(o.w.x - x) < 1 && Math.abs(o.w.z - z) < 1) return true; return false; };
  // ── ROUTINE-2 갈래 셋 ──
  function seatTake(o, s) { seatFree(o); if (!s) return; o.seat = s; const q = SEATN.get(s); if (q) { q.n++; return; } SEATN.set(s, { n: 1, h: A.map.interact.enable(h9 => h9.kind === 'sit' && h9.seat === s.seat, false) }); }   /* 이웃이 앉은 자리 = 내 '앉기' E를 끔(둘이 앉아도 한 번만 · 다 일어나면 되돌림) */
  function seatFree(o) { const s = o.seat; if (!s) return; o.seat = null; const q = SEATN.get(s); if (!q) return; if (--q.n <= 0) { SEATN.delete(s); if (q.h) q.h.remove(); } }
  // 정자(SITS 'pav' 넷 = 정자 하나) → 자리 셋(같은 마루 가장자리에 둘이 서로 조금 돌아앉고 · 옆 가장자리에 하나) · 정자가 없는 마을은 가장 많은 이웃 곁 벤치(자리 둘)
  function evBuild() { PV.length = 0; const SI = A.sits() || [], G = [];
    for (const s of SI) { if (s.kind !== 'pav') continue; let g = G.find(q => Math.hypot(q.x - s.seat.x, q.z - s.seat.z) < 4.5); if (!g) G.push(g = { x: s.seat.x, z: s.seat.z, S: [] }); g.S.push(s); g.x = g.S.reduce((a, q) => a + q.seat.x, 0) / g.S.length; g.z = g.S.reduce((a, q) => a + q.seat.z, 0) / g.S.length; }
    const spot = (s, lat) => { const y = s.seat.yaw, c = Math.cos(y), n = Math.sin(y); return { s, x: s.seat.x + c * lat, z: s.seat.z - n * lat, y: s.seat.y, yaw: y - Math.sign(lat) * 0.28, sx: s.stand[0] + c * lat, sz: s.stand[1] - n * lat }; };
    for (const g of G) { if (g.S.length < 2) continue; PV.push({ k: 'pav', x: g.x, z: g.z, sp: [spot(g.S[0], 0.55), spot(g.S[0], -0.55), spot(g.S[1], 0.3)], ap: undefined, tk: 0, li: 0, cool: 0 }); }
    const ok = o => !NOPAV[o.k] && !o.w.gate;
    if (!PV.length) { let best = null, bn = 1; for (const s of SI) { if (s.kind !== 'bench') continue; let n = 0; for (const o of L) if (ok(o) && Math.hypot(o.w.x - s.seat.x, o.w.z - s.seat.z) < 220) n++; if (n > bn) { bn = n; best = s; } } if (best) PV.push({ k: 'bench', x: best.seat.x, z: best.seat.z, sp: [spot(best, 0.45), spot(best, -0.45)], ap: undefined, tk: 0, li: 0, cool: 0 }); }
    for (const P of PV) { const C = L.filter(o => ok(o) && !o.pv).sort((a, b) => Math.hypot(a.w.x - P.x, a.w.z - P.z) - Math.hypot(b.w.x - P.x, b.w.z - P.z)); C.slice(0, P.sp.length).forEach((o, j) => { o.pv = { P, j }; }); }
    const T = (A.shops() || []).map(d => [d[0], d[1]]); for (const o of L) if (o.k === 'stall') T.push([o.w.hx ?? o.w.x, o.w.hz ?? o.w.z]);   /* 장터 = 판매대 앞 · 가게 = 문 앞 */
    for (const o of L) { o.tgt = null; if (NOSHOP[o.k] || o.w.gate || (HO[o.k] || A.hrs(o.k))[1] < 17) continue; let b = null, bd = 230; for (const t of T) { const d = Math.hypot(t[0] - o.w.x, t[1] - o.w.z); if (d < bd && d > 6) { bd = d; b = t; } } o.tgt = b; } }
  // 날마다(아침 한 번): 점심 먹는 일꾼(열에 여섯쯤) · 장 보러 가는 이웃 둘(오후 14:30~15:30 떠남)
  function evDay(d) { dayEv = d; const C = [];
    for (const o of L) { o.lunD = !NOLUN[o.k] && hsh(d, o.w.i * 3 + 1) < 0.6 ? d : -1; o.lun = null; if (o.tgt && homeOf(o)) C.push(o); }   /* 집 자리가 있는 이웃만(바구니를 들고 들어갈 문·길가) */
    C.sort((a, b) => hsh(d, a.w.i * 5 + 2) - hsh(d, b.w.i * 5 + 2)); for (const o of C.slice(0, 2)) { o.shopPick = d; o.ts = 14 * 60 + 30 + Math.floor(hsh(d, o.w.i * 7 + 3) * 60); }
    eveDay(d, C.slice(2)); }
  const meD = o => { const p = A.me(); return p ? Math.hypot(p.x - o.w.x, p.z - o.w.z) : 1e9; };
  const nearBusy = o => A.busy() && meD(o) < 12;   /* 내가 그 일꾼과 놀이·창을 하는 중이면 그 자리에 둠 */
  function evSec(o, m, jump) { const w = o.w, d = S().day, nd = !!(w.party || A.need(w) || A.herd(w));
    if (EVS[o.st]) { const c = o.st[0];
      if (c === 'l') { if (nd || m >= o.le || m < 11 * 60 + 50) { setIn(o); if (jump) nSnap++; return false; }
        if (jump && o.st !== 'lun') { lunSit(o); return true; }
        if (o.st === 'lun' && m >= o.lb) { if (o.lun.bench && canWalk2(o.cx, o.cz)) { lunEnd(o); seatFree(o); walkP(o, 'lunBack', [[o.lun.sx, o.lun.sz], [w.x, w.z]]); } else setIn(o); }
        return true; }
      if (c === 's') { if (nd) { setIn(o); return false; } if (jump) { setOut(o); nSnap++; return true; }
        if (o.st === 'shopIn') { if (--o.tm <= 0) shopHome(o); }
        else if (camAt(o.cx, o.cz) > 140 || (o.hold && camAt(o.cx, o.cz) > 30)) setOut(o);   /* 멀어지면(또는 길가에서 기다리다) 들어감 */
        return true; }
      if (c === 'e' || c === 'g') return eveSec(o, m, jump, nd);
      const P = o.pv.P, sp = P.sp[o.pv.j], stay = !nd && A.wx() === 'clear' && m >= 18 * 60 && m < 20 * 60 + o.sg2;
      if (o.st === 'pavGo') { if (jump || (o.hold && camAt(o.cx, o.cz) > 30) || camAt(o.cx, o.cz) > 140) setOut(o); return true; }
      if (!stay) { if (!jump && o.st === 'pav' && P.ap && canWalk2(o.cx, o.cz)) { seatFree(o); walkP(o, 'pavGo', [[sp.sx, sp.sz], [P.ap.x, P.ap.z]]); o.w.out9 = 2; } else { setOut(o); if (jump) nSnap++; } return true; }
      if (jump && o.st !== 'pav') pavSit(o); return true; }
    if (nd) return false;
    if (o.st === 'in' && o.lunD === d && m >= 12 * 60 + (o.sg % 4) * 3 && m < 12 * 60 + 40 && !nearBusy(o) && lunStart(o, jump)) return true;
    if (o.st === 'in' && o.shopPick === d && o.shopD !== d && m >= o.ts && m < o.ts + 90 && !nearBusy(o)) { shopStart(o, jump); return true; }
    if (o.st === 'out' && o.eveD === d && A.wx() === 'clear' && m >= o.eveT && m < o.eveT + 25) { eveStart(o, jump); return true; }   /* ROUTINE-3 저녁 산책 */
    if (o.st === 'out' && o.gymD === d && o.gym && A.wx() === 'clear' && m >= o.gymT && m < o.gymT + 25) { gymStart(o, jump); return true; }   /* ROUTINE-3 밤 운동 */
    if (o.st === 'out' && o.pv && o.pvD !== d && !(o.pv.P.cool > 0) && A.wx() === 'clear' && m >= 18 * 60 + o.sg * 2 && m < 19 * 60 + 50) {   /* 걸어오는 이웃은 3초씩 사이를 두고 하나씩 */ pavStart(o, jump); return true; }
    return false; }
  // ── ROUTINE-3 저녁·밤 갈래 ──
  //   날마다(아침 한 번): 퇴근길 장보기 둘(낮 장보기와 다른 이웃 · 일이 17시 뒤에 끝나는 이웃) · 저녁 산책 셋(정자 이웃 X · 집 자리가 있는 이웃) · 밤 운동 둘(운동 쉼터가 집에서 320m 안)
  function eveDay(d, C2) { for (const o of L) { o.eshD = -1; o.eveD = -1; o.gymD = -1; o.gym = null; }
    for (const o of C2.filter(q => (HO[q.k] || A.hrs(q.k))[1] >= 17).slice(0, 2)) o.eshD = d;
    const E = L.filter(o => !o.pv && !NOPAV[o.k] && !o.w.gate && o.eshD !== d && o.shopPick !== d && homeOf(o)).sort((a, b) => hsh(d, a.w.i * 11 + 5) - hsh(d, b.w.i * 11 + 5));
    const GY = (A.gyms && A.gyms()) || [], EG = L.filter(o => !NOPAV[o.k] && !o.w.gate && o.eshD !== d && o.shopPick !== d && homeOf(o)).sort((a, b) => hsh(d, a.w.i * 11 + 5) - hsh(d, b.w.i * 11 + 5)); let ng = 0; for (const o of EG) { if (ng >= 2) break;   /* 정자 이웃도 운동은 감(정자 20:00에 끝남 → 20:15부터) */ const h = homeOf(o); if (!h) continue; let b = null, bd = 320; for (const g of GY) { const dd = Math.hypot(g[0] - h.x, g[1] - h.z); if (dd < bd) { bd = dd; b = g; } } if (!b) continue; o.gymD = d; o.gym = b; o.gymT = 20 * 60 + 15 + Math.floor(hsh(d, o.w.i * 17 + 3) * 40); o.gymE = 21 * 60 + 25 + (o.sg % 4) * 4; ng++; }   /* 운동 쉼터 곁 이웃 먼저 */
    for (const o of E.filter(q => q.gymD !== d).slice(0, 3)) { o.eveD = d; o.eveT = 19 * 60 + 5 + Math.floor(hsh(d, o.w.i * 13 + 7) * 50); o.eveE = o.eveT + 40; } }
  function far(x0, z0, R0, ex, ez) { for (const r of [14, 20, 26]) for (let a = 0; a < 12; a++) { const x = x0 + Math.cos(a * 0.5236) * r, z = z0 + Math.sin(a * 0.5236) * r; if (Math.hypot(x - ex, z - ez) < 10 || !A.onRoad(x, z, 0.6) || !clear(x0, z0, x, z)) continue; return { x, z }; } return null; }
  function evePath(o) { const h = homeOf(o); if (!h) return null; const p1 = h.door ? roadNear(h.x, h.z, h.x, h.z, 32) : h; if (!p1) return [[h.x, h.z]]; const p2 = far(p1.x, p1.z, 26, h.x, h.z); const P = [[h.x, h.z]]; if (p1 !== h) P.push([p1.x, p1.z]); if (p2) P.push([p2.x, p2.z], [p1.x, p1.z]); if (p1 !== h) P.push([h.x, h.z]); return P; }
  function eveStart(o, jump) { o.eveD = -1; const P = evePath(o); if (!P) return; nEve++; hotOff(o); nvSet(o, 1); o.eP = P;
    if (!jump && P.length > 1 && canWalk2(P[0][0], P[0][1])) { walkP(o, 'eveGo', P); o.w.out9 = 2; } else eveHold(o, P[Math.min(1, P.length - 1)]); }
  function eveHold(o, q) { const h = M(), w = o.w; unMove(o); o.st = 'eve'; o.hold = 1; o.cx = q[0]; o.cz = q[1]; w.out9 = 2; nvSet(o, 1); if (h) { h.set(w.i, q[0], A.ty(q[0], q[1]) + 0.02, q[1], o.ry || w.ry); h.act(w.i, 'stand', 'none'); } }   /* 산책 중 멈춰 선 몸(카메라가 멀 때 · 걷기 자리가 없을 때) */
  function gymStart(o, jump) { o.gymD = -1; const g = o.gym, h0 = homeOf(o); if (!g || !h0) return; nGym++; hotOff(o); nvSet(o, 1); const sp = A.gymSpot ? A.gymSpot(g, o.w.i) : { x: g[0] + 1.5, z: g[1] }; o.gS = sp;
    const R = !jump && canWalk2(h0.x, h0.z) ? A.route([h0.x, h0.z], [sp.x, sp.z]) : null; if (R && R.ok && R.pts.length > 1 && R.len < 400) { walkP(o, 'gymGo', side(R.pts), 'none', true); o.w.out9 = 2; } else gymAt(o); }
  function gymAt(o) { const h = M(), w = o.w, q = o.gS; unMove(o); o.st = 'gym'; o.hold = 0; o.tm = 0; o.cx = q.x; o.cz = q.z; w.out9 = 2; nvSet(o, 1); if (h) { h.set(w.i, q.x, A.ty(q.x, q.z) + 0.02, q.z, q.ry ?? w.ry); h.act(w.i, 'reach', 'none'); } }
  function eveSec(o, m, jump, nd) { const st = o.st, wet = A.wx() !== 'clear';
    if (nd || jump) { setOut(o); return false; }
    if (st === 'eve') { if (m >= o.eveE || wet) { setOut(o); return true; } if (o.eP && o.eP.length > 2 && canWalk2(o.cx, o.cz) && camAt(o.cx, o.cz) < 60) { const P = o.eP.slice(1); o.eP = null; walkP(o, 'eveGo', P); o.w.out9 = 2; } return true; }
    if (st === 'eveGo') { if (wet || camAt(o.cx, o.cz) > 140) setOut(o); return true; }
    if (st === 'gym') { const h = M(); if (m >= o.gymE || wet) { const h0 = homeOf(o), R = h0 && canWalk2(o.cx, o.cz) && !wet ? A.route([o.cx, o.cz], [h0.x, h0.z]) : null; if (R && R.ok && R.pts.length > 1) { walkP(o, 'gymBack', side(R.pts), 'none', true); o.w.out9 = 2; } else setOut(o); return true; }
      if (h && ++o.tm % 4 === 0) h.act(o.w.i, (o.tm / 4) % 2 ? 'cheer' : 'reach', 'none'); return true; }   /* 4초마다 팔 뻗기 ↔ 손뼉(체조) */
    if (st === 'gymGo' || st === 'gymBack') { if (camAt(o.cx, o.cz) > 140) { if (st === 'gymGo') gymAt(o); else setOut(o); } return true; }
    return true; }
  // ① 점심(12:00~13:00): 일터 곁 18m 안 빈 벤치(곧장 걸어 닿는 것)에 걸터앉아 도시락 · 없으면 일터 가장자리 2~3m 땅에 앉음(논·부두·염전 일꾼은 벤치만) · 그동안 E = 점심 한 줄
  function lunSpot(o) { const w = o.w, SI = A.sits() || []; let b = null, bd = 18;
    for (const s of SI) { if (s.kind !== 'bench' || SEATN.has(s)) continue; const d = Math.hypot(s.stand[0] - w.x, s.stand[1] - w.z); if (d < bd && clear(w.x, w.z, s.stand[0], s.stand[1])) { bd = d; b = s; } }
    if (b) return { s: b, x: b.seat.x, y: b.seat.y, z: b.seat.z, yaw: b.seat.yaw, sx: b.stand[0], sz: b.stand[1], bench: 1, wm: Math.ceil(bd / SPD / SPM) + 1 };
    if (BENCHONLY[o.k]) return null; const g0 = A.ty(w.x, w.z), a0 = (w.ph || 0) * 2.1;
    for (const r of [2.4, 3.2]) for (let a = 0; a < 8; a++) { const q = a0 + a * 0.785, x = w.x + Math.cos(q) * r, z = w.z + Math.sin(q) * r, g = A.ty(x, z);
      if (Math.abs(g - g0) > 0.35 || A.wAt(x, z) || A.onRoad(x, z, 0.4) || A.blocked(x, z, g + 0.3) || A.blocked(x, z, g + 0.9) || outAt(x, z)) continue;
      return { s: null, x, y: g + 0.02, z, yaw: Math.atan2(w.x - x, w.z - z), sx: x, sz: z, bench: 0, wm: 0 }; }   /* 일하던 밭을 보고 앉음 */
    return null; }
  function lunStart(o, jump) { if (!o.lun) o.lun = lunSpot(o); const s = o.lun; if (!s) { o.lunD = -1; return false; }
    o.le = 13 * 60 - 1 - (o.sg2 % 3); o.lb = o.le - s.wm - 1; nLun++; hotOff(o); seatTake(o, s.s);
    if (s.bench && !jump && canWalk2(o.w.x, o.w.z)) { walkP(o, 'lunGo', [[o.w.x, o.w.z], [s.sx, s.sz]]); o.w.out9 = 2; } else lunSit(o); return true; }
  function lunSit(o) { const s = o.lun, h = M(), w = o.w; unMove(o); o.st = 'lun'; o.hold = 0; o.cx = s.x; o.cz = s.z; w.out9 = 2; hotOff(o); seatTake(o, s.s);
    if (h) { h.set(w.i, s.x, s.y, s.z, s.yaw); h.act(w.i, s.bench ? 'sit' : 'sitg', s.bench ? 'lunch' : 'lunchg'); }
    if (!o.lh) { const e9 = en(), who = A.who(o.k); o.lh = A.map.interact.add({ kind: 'game', x: s.x, z: s.z, y: s.y, r: 1.9, label: '🍱 ' + who + (e9 ? ' — lunch break · back at 13:00' : ' — 점심 먹는 중 · 13:00부터'), use: () => lunUse(o) }); } }
  function lunUse(o) { const e9 = en(), s = o.lun; if (!s) return; A.bub({ x: o.cx, y: s.y - 0.3, z: o.cz, sc: 1 }, '🍱 ' + (e9 ? 'Lunch time! I work again at 13:00.' : '점심 먹는 중이에요. 13:00에 다시 일해요!')); A.say('🍱 ' + A.who(o.k) + (e9 ? ' — having lunch · works again 13:00~' + (HO[o.k] || A.hrs(o.k))[1] + ':00' : ' — 점심 먹는 중 · 13:00에 다시 일해요'), 3); }
  function lunEnd(o) { if (o.lh) { o.lh.remove(); o.lh = null; } }
  function lunOffAll() { for (const o of L) { lunEnd(o); seatFree(o); } }
  // ② 장 보러 가기(오후 · 하루 둘): 일을 일찍 마치고 230m 안 가게 문 앞·장터 판매대 앞까지 길(빨간 선과 같은 길 · 인도 쪽으로 비켜)로 걸어감 → 4초 안 → 장바구니를 들고 집 문 앞으로
  //   카메라 75m 밖에서 떠나는 날은 걷지 않고 바로 들어감(아무도 못 봄) · 걷다가 140m 밖으로 멀어지면 바로 들어감 · 걷는 몸 상한 넷 그대로
  function side(P) { const out = [P[0]];
    for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.3) continue; const s = l > 3 ? A.onRoad((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0) : null;
      if (!s || !s.hw) { out.push([b[0], b[1]]); continue; } const off = Math.max(0.4, s.hw - (s.r && s.r.big ? 1.65 : 0.95)), rx = -dz / l * off, rz = dx / l * off, a2 = [a[0] + rx, a[1] + rz], b2 = [b[0] + rx, b[1] + rz], q = out[out.length - 1];
      if (q.sd) { q[0] = (q[0] + a2[0]) / 2; q[1] = (q[1] + a2[1]) / 2; } else out.push(a2); b2.sd = 1; out.push(b2); }
    const e = P[P.length - 1], q = out[out.length - 1]; if (q[0] !== e[0] || q[1] !== e[1]) out.push([e[0], e[1]]); return out.length > 1 ? out : [P[0], e]; }
  function shopStart(o, jump) { const w = o.w; o.shopD = S().day; nShop++; if (jump || !canWalk2(w.x, w.z) || !homeOf(o)) { setOut(o); nSnap++; return; }
    const R = A.route([w.x, w.z], o.tgt); if (!R || !R.ok || R.len > 380 || R.pts.length < 2) { setOut(o); return; } hotOff(o); walkP(o, 'shopGo', side(R.pts), 'none', true); w.out9 = 2; if (o.eshD === S().day) nvSet(o, 1); }
  function shopHome(o) { const h9 = homeOf(o); if (!h9 || camAt(o.cx, o.cz) > 90) { setOut(o); return; } const R = A.route(o.tgt, [h9.x, h9.z]); if (!R || !R.ok || R.pts.length < 2) { setOut(o); return; } walkP(o, 'shopHome', side(R.pts), 'carry', true); o.w.out9 = 2; if (o.eshD === S().day) nvSet(o, 1); }
  // ③ 정자에 모이기(맑은 날 18:00~20:00): 정자 곁 이웃 셋이 일을 마친 뒤 하나씩 와서 마루에 걸터앉아 이야기 · 비·눈 오면 안 모이고 오는 중에 오면 흩어짐 · 밤에도 그 몸만 보임
  //   말풍선 = 이름 없는 이웃의 하루 이야기(날씨·농사·장날 · 지금 상태로 고름) · 내가 16m 안에 있을 때만 6초에 한 줄(말풍선 하나를 같이 씀)
  function pavStart(o, jump) { const P = o.pv.P, sp = P.sp[o.pv.j]; o.pvD = S().day; nPav++; if (P.ap === undefined) P.ap = roadNear(P.x, P.z, P.sp[0].sx, P.sp[0].sz, 32) || openNear(P.sp[0].sx, P.sp[0].sz) || null;   /* 길이 멀면 18~24m 밖 빈 땅(곧장 걸어 닿는 곳)에서 걸어옴 */
    hotOff(o); nvSet(o, 1); seatTake(o, sp.s); if (!jump && P.ap && canWalk2(P.x, P.z)) { walkP(o, 'pavCome', [[P.ap.x, P.ap.z], [sp.sx, sp.sz]]); o.w.out9 = 2; P.cool = 3; } else pavSit(o); }
  function pavSit(o) { const P = o.pv.P, sp = P.sp[o.pv.j], h = M(), w = o.w; unMove(o); o.st = 'pav'; o.hold = 0; o.cx = sp.x; o.cz = sp.z; w.out9 = 2; hotOff(o); nvSet(o, 1); seatTake(o, sp.s); if (h) { h.set(w.i, sp.x, sp.y, sp.z, sp.yaw); h.act(w.i, 'sit', 'none'); } }
  function talkLines() { const e9 = en(), T = [], f = A.fcW ? A.fcW(1) : '', sn = A.seas ? A.seas() : '', J = A.jang ? A.jang() : null, c = today(), P2 = (k, e) => T.push(e9 ? e : k);
    P2('오늘 하루도 수고 많았어요.', 'Thanks for all your work today.');
    if (f === 'rain') P2('내일 비 온대요. 널어 둔 것 걷어야겠어요.', 'Rain tomorrow. Bring in the washing!'); else if (f === 'snow') P2('내일 눈 온대요. 길 미끄럽겠어요.', 'Snow tomorrow. Roads will be slippery.'); else P2('내일도 맑대요. 밭일하기 좋겠어요.', 'Sunny again tomorrow. Good for the fields.');
    const SN = { spring: ['논에 물 대고 모내기 준비할 때예요.', 'Time to get the rice fields ready.'], summer: ['한낮엔 더우니 아침저녁에 일해요.', 'Too hot at noon. We work early and late.'], autumn: ['벼가 누렇게 익었어요. 곧 거둬야지요.', 'The rice is golden. Harvest soon!'], winter: ['김장은 다들 끝냈어요?', 'Has everyone made their kimchi?'] }[sn]; if (SN) P2(SN[0], SN[1]);
    if (J) { if (J.on) P2('오늘 장터에 사람이 많았어요.', 'The market was busy today.'); else if (J.left === 1) P2('내일이 장날이에요. 무얼 내다 팔까요?', 'Market day tomorrow. What shall we sell?'); else if (J.left > 1) P2('장날은 ' + J.left + '일 뒤예요.', 'Market day is in ' + J.left + ' days.'); }
    if (c.k === 'wet') P2('비가 사흘 오더니 논에 개구리가 늘었어요.', 'After the rain there are more frogs.'); else if (c.k === 'dry') P2('비가 안 와서 개울물이 줄었어요.', 'No rain, so the stream is low.');
    const R = e9 ? ['That is true.', 'Yes, I think so too.', 'Ha ha, right.'] : ['그러게요.', '맞아요, 그래야겠어요.', '하하, 그렇지요.'], Q = []; T.forEach((t, i) => { Q.push(t, R[i % R.length]); }); return Q; }
  function talkSec() { if (!PV.length) return; for (const P of PV) if (P.cool > 0) P.cool--; const me = A.me(); if (!me) return;
    for (const P of PV) { if (P.tk > 0) P.tk--; if (P.tk > 0 || Math.hypot(me.x - P.x, me.z - P.z) > 16) continue; const SA = L.filter(o => o.pv && o.pv.P === P && o.st === 'pav'); if (SA.length < 2 || A.busy() || !A.bubFree()) continue;
      const Q = talkLines(), i = P.li++ % Q.length, o = SA[i % SA.length], sp = P.sp[o.pv.j]; A.bub({ x: sp.x, y: sp.y - 0.3, z: sp.z, sc: 1 }, Q[i]); P.tk = 6; nTalk++; } }
  // ── ② 먹이·물 연쇄 ──
  const C = () => { let c = S().chain; if (!c || typeof c !== 'object' || !c.w || typeof c.w !== 'object') c = S().chain = { w: {}, d: 0, k: '', pk: '', said: 0, saw: 0, hist: null }; return c; };
  function rec(w9) { const c = C(), d = S().day, w = w9 || A.wxDay(); if (!w || c.w[d] === w) return; c.w[d] = w; for (const k of Object.keys(c.w)) if (+k < d - 9) delete c.w[k]; A.GAME.mark(); }
  function today() { const c = C(), d = S().day; if (c.d === d) return c; const R = streakOf(c.w, d, k => A.fcW(k - d)); c.pk = c.d === d - 1 ? c.k : ''; c.d = d; c.k = R.row ? R.row.k : ''; c.kind = R.kind; c.n = R.n; if (c.k) c.hist = { k: c.k, d, n: R.n }; A.GAME.mark(); return c; }
  const rowOf = k => CHAIN.rows.find(r => r.k === k) || null;
  function fc() { const c = today(), r = rowOf(c.k); return { f: r ? r.f : CHAIN.base, paddy: !!(r && r.paddy) }; }
  function chainSec() { rec(); const c = today(); if (!c.k || c.k === c.pk || c.said === c.d || A.busy() || S().min < 6 * 60 + 5) return; c.said = c.d; A.GAME.mark(); const r = rowOf(c.k); if (r) A.say(r.t[en() ? 1 : 0], 5); }   /* 바뀐 첫 아침 = 한 줄 알림(같은 일이 이어지는 날은 소식판에만) */
  function news() { const c = today(), r = rowOf(c.k); if (!r) return null; const W = A.wild && A.wild(), at = W && r.paddy && W.fcAt ? W.fcAt() : null; return { k: r.k, t: r.t, at }; }
  function saw() { const c = today(); if (c.k === 'wet' && c.saw !== c.d) { c.saw = c.d; A.GAME.mark(); } }
  // 도감 한 줄(본 것만): 비 → 논물 → 개구리 → 왜가리 · 못 만난 동물은 안 씀(…) · 개구리·왜가리 둘 다 못 봤으면 안 보임
  function dexLine(D) { const e9 = en(), seen = id => !!(D && D['wild:' + id] != null); if (!seen('frog') && !seen('heron')) return '';
    const c = C(), P = [e9 ? 'rain' : '비', e9 ? 'water in the rice field' : '논물']; if (seen('frog')) P.push(e9 ? 'frogs' : '참개구리'); if (seen('heron')) P.push(e9 ? 'herons' : '왜가리');   /* 못 만난 동물은 칸을 비우지 않고 아예 안 씀(UBI-1 찾은 것만 쌓임) */
    const t = (e9 ? 'Food chain: ' : '먹이 사슬: ') + P.join(' → ') + (seen('frog') && seen('heron') ? '' : ' → …');
    const s = c.saw && seen('heron') ? (e9 ? ' (day ' + c.saw + ': you saw herons feeding in the rice field after three days of rain)' : ' (' + c.saw + '일째: 비 사흘 뒤 논에 먹이를 찾으러 온 왜가리를 봤어요)') : '';
    return t + s; }
  function water() { const c = today(), W = waterOf(c.kind || '', c.n || 0); W.d = c.d; return W; }   /* WATER-1 그날 물 높이(아침 한 번 셈 · today()가 날마다 한 번) */
  const r1 = v => +(+v).toFixed(1), evOf = o => ({ lun: o.lunD === S().day ? (o.lun ? { x: r1(o.lun.x), z: r1(o.lun.z), bench: o.lun.bench, le: o.le, lb: o.lb } : 'wait') : null, hot: o.lh ? o.lh.hot.label : null, shop: o.shopPick === S().day ? { ts: o.ts, tgt: o.tgt && o.tgt.map(r1), done: o.shopD === S().day } : null, pv: o.pv ? PV.indexOf(o.pv.P) : -1, pvD: o.pvD, nv: o.w.i != null && !!NVA[o.w.i], out9: o.w.out9, act: M() && M().actOf ? M().actOf(o.w.i) : null, tool: M() && M().toolOf ? M().toolOf(o.w.i) : null });
  return { sec, tick, fc, news, saw, dexLine, outAt, rec, water, nightN: () => nvN, nightVis: i => !!NVA[i],   /* ROUTINE-2 town.js 일꾼 몸 보이기(밤 = 정자에 모인 몸만) */
    ev: () => ({ nLun, nShop, nPav, nTalk, nEve, nGym, nEsh, eve: L.filter(o => o.eveD === S().day || o.gymD === S().day || o.eshD === S().day || /^(eve|gym)/.test(o.st)).map(o => ({ i: o.w.i, k: o.k, st: o.st, eveT: o.eveD === S().day ? o.eveT : null, gymT: o.gymD === S().day ? o.gymT : null, esh: o.eshD === S().day, x: r1(o.cx), z: r1(o.cz), nv: o.w.i != null && !!NVA[o.w.i] })), nightN: nvN, busy: !!A.busy(), bubFree: !!A.bubFree(), pv: PV.map(P => ({ k: P.k, x: r1(P.x), z: r1(P.z), ap: P.ap ? [r1(P.ap.x), r1(P.ap.z)] : P.ap, sp: P.sp.map(q => [r1(q.x), r1(q.z), r1(q.y)]), who: L.filter(o => o.pv && o.pv.P === P).map(o => o.w.i) })), seats: SEATN.size,
      shoppers: L.filter(o => o.shopPick === S().day).map(o => o.w.i), cand: L.filter(o => o.tgt).map(o => ({ i: o.w.i, k: o.k, d: Math.round(Math.hypot(o.tgt[0] - o.w.x, o.tgt[1] - o.w.z)), hm: !!homeOf(o) })), lines: talkLines() }),
    evTest: { shop: (i, ts) => { const o = L.find(q => q.w.i === i); if (!o || !o.tgt) return false; o.shopPick = S().day; o.shopD = -1; o.ts = ts; return true; }, lun: (i, on) => { const o = L.find(q => q.w.i === i); if (!o) return false; o.lunD = on === false ? -1 : S().day; o.lun = null; return true; }, pvReset: () => { for (const o of L) o.pvD = -1; }, path: i => { const o = L.find(q => q.w.i === i); return o && o.P ? o.P.map(q => [r1(q[0]), r1(q[1])]) : null; } },
    info: () => ({ n: L.length, mv: MV.length, nGo, nCome, nSnap, nWait, tickMs: +tickMs.toFixed(3), tickMax: +tickMax.toFixed(3), chain: { ...C(), w: { ...C().w } },
      list: L.map(o => ({ i: o.w.i, k: o.k, st: o.st, nd: !!(o.w.party || A.need(o.w) || A.herd(o.w)), cs: (HO[o.k] || A.hrs(o.k))[0] * 60 - walkMin(o) - o.sg, la: (HO[o.k] || A.hrs(o.k))[1] * 60 + o.sg2, mx: MV.includes(o) ? +o.cx.toFixed(2) : null, mz: MV.includes(o) ? +o.cz.toFixed(2) : null, cx: r1(o.cx), cz: r1(o.cz), ev: evOf(o), hold: o.hold, x: +o.w.x.toFixed(1), z: +o.w.z.toFixed(1), off: !!(o.hot && o.hot.off), out: !!o.w.out9, hm: o.hm === undefined ? null : o.hm ? { x: +o.hm.x.toFixed(1), z: +o.hm.z.toFixed(1), door: o.hm.door } : 0, hrs: A.hrs(o.k) })) }),
    homes: () => { for (const o of L) homeOf(o); return L.filter(o => o.hm).length; }, reset: () => { key = ''; }, hrsTest: (k, v) => { if (v) HO[k] = v; else delete HO[k]; } };
}
