// 🏡 이웃 하루 일과 + 먹이·물 연쇄(ROUTINE-1 · 사용자 10-24 차례 마지막 '이웃 일과·먹이·물 연쇄' · docs/systems/town_routine.md)
//   ① 일과: 일 시간(town.js WHRS · docs/systems/town_hours.md)이 있는 일꾼은 일 시간 밖엔 몸이 자리를 비움 — 아침에 집 문(없으면 길가)에서 걸어 나와 일터로 · 일이 끝나면 집 쪽으로 걸어가 들어감
//      E(같이 해요·장터)는 몸이 일터에 서 있을 때만 · 일 시간 앞에 먼저 와 서 있으면 예전처럼 '쉬는 중 · 07:00부터' 이름표
//      예외 = 이야기 단계가 그 일꾼을 쓸 때(wkNeed · 주기 단계) · 잔치 초대 · 양몰이 중 — 이때는 늘 자리에 있음
//      걷는 몸은 한 번에 넷까지 · 카메라 75m 안 · 낮에만(밤엔 어차피 안 보여 바로 옮김) · 시계가 크게 뛰면(잠·시험) 바로 옮김 · 매 프레임 일 = 걷는 몸만(새 객체 X)
//   ② 먹이·물 연쇄(CHAIN 한 줄 = 조건 → 다음 날 수): 비 사흘 → 논물이 불어 개구리가 늘고 왜가리가 논까지 먹으러 옴 · 비 없는 날 닷새 → 개울물이 줄어 물새가 줄어듦
//      날씨 기록(하루 하나) → 아침마다 한 번 셈 → town_wild.js가 종마다 나올 자리 수만 바꿈(A.fc) · 아침 소식판 한 줄 + 처음 바뀐 아침 알림 한 줄 · 도감 '먹이 사슬' 한 줄(본 것만)
//      잡아먹는 장면 X — '먹으러 온다'까지만 · 사실만(개구리는 물 고인 논·웅덩이에 모이고, 왜가리는 개구리·물고기를 먹으러 물 많은 곳에 옴)
export const ROUTINE_V = 1;
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
  // ── ① 일과 ──
  function build() { L.length = 0; MV.length = 0; DOORS = null; const H = A.hots() || [];
    for (const e of H) { const hot = e[0], k = e[2], w = e[3]; if (!w || !A.playk(k) || w.gate || w.i == null) continue; const h9 = A.hrs(k); if (!h9 || (h9[0] <= 0 && h9[1] >= 24)) continue;   /* 징검다리 = 늘(일이 아니라 놀이) */
      const ph = w.ph || 0; L.push({ w, hot, k, st: 'in', offW: false, hm: undefined, t: 0, Lw: 0, x0: 0, z0: 0, x1: 0, z1: 0, ry: 0, hold: 0, sg: Math.floor(ph * 1.27) % 8, sg2: Math.floor(ph * 2.31) % 6 }); w.out9 = 0; }
    lastMin = -1; }
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
    if (!hm) for (const r of [8, 12, 16, 20, 26, 32]) { for (let a = 0; a < 12 && !hm; a++) { const x = w.x + Math.cos(a * 0.5236) * r, z = w.z + Math.sin(a * 0.5236) * r; if (A.onRoad(x, z, 0.6) && clear(w.x, w.z, x, z)) hm = { x, z, door: 0 }; } if (hm) break; }
    o.hm = hm; return hm; }
  const walkMin = o => { const h = o.hm; return h ? Math.min(25, Math.ceil(Math.hypot(h.x - o.w.x, h.z - o.w.z) / SPD / SPM) + 2) : h === 0 ? 0 : 14; };   /* 집을 아직 안 셌으면 어림 14분(1초에 셋씩 셈) */
  function wantIn(o, m) { const w = o.w; if (w.party || A.need(w) || A.herd(w)) return true; const H = HO[o.k] || A.hrs(o.k), cs = H[0] * 60 - walkMin(o) - o.sg, la = H[1] * 60 + o.sg2; return m >= cs && m < la; }
  const camD = o => { const c = A.map.camera.position; return Math.hypot(c.x - o.w.x, c.z - o.w.z); };
  function unMove(o) { const j = MV.indexOf(o); if (j >= 0) MV.splice(j, 1); }
  function setIn(o) { unMove(o); o.st = 'in'; o.hold = 0; const w = o.w, h = M(); w.out9 = 0; if (o.hot && o.offW !== false) { o.offW = false; o.hot.off = false; } if (h) { h.set(w.i, w.x, w.g + 0.02, w.z, w.ry); h.reset(w.i); } }
  function setOut(o) { unMove(o); o.st = 'out'; o.hold = 0; const w = o.w, h = M(); w.out9 = 1; if (o.hot) { o.offW = true; o.hot.off = true; } if (h) { h.set(w.i, w.x, w.g + 0.02, w.z, w.ry); h.reset(w.i); } }
  function walk(o, st, x0, z0, x1, z1) { const h = M(); o.st = st; o.t = 0; o.x0 = x0; o.z0 = z0; o.x1 = x1; o.z1 = z1; o.Lw = Math.hypot(x1 - x0, z1 - z0); o.ry = Math.atan2(x1 - x0, z1 - z0); o.hold = 0; o.w.out9 = 0; MV.push(o); if (h) { h.act(o.w.i, 'walk', 'none'); h.set(o.w.i, x0, A.ty(x0, z0) + 0.02, z0, o.ry); } }
  const canWalk = o => MV.length < MAXW && A.night() < 1 && camD(o) < 75 && !!homeOf(o);
  function sec() { if (!A.on()) return; const k9 = keyOf(); if (k9 !== key) { key = k9; build(); } if (!L.length) { chainSec(); return; }
    const G = S(), m = G.min, jump = lastMin < 0 || G.day !== lastDay || Math.abs(m - lastMin) > 4; lastMin = m; lastDay = G.day;
    let hb = 3; for (const o of L) { if (o.hm === undefined && hb > 0) { hb--; homeOf(o); } const want = wantIn(o, m);
      if (o.st === 'in' && !want) { if (!jump && canWalk(o)) { const h = homeOf(o); walk(o, 'go', o.w.x, o.w.z, h.x, h.z); nGo++; } else if (!jump && A.night() < 1 && camD(o) < 40) nWait++; else { setOut(o); nSnap++; } }   /* 걸어갈 길이 없는데 눈앞(40m 안)이면 그 자리에서 '쉬는 중'으로 기다렸다가 멀어지면 들어감(눈앞에서 사라지지 않게) */
      else if (o.st === 'out' && want) { if (!jump && canWalk(o) && !(o.w.party || A.need(o.w) || A.herd(o.w))) { const h = homeOf(o); walk(o, 'come', h.x, h.z, o.w.x, o.w.z); nCome++; } else { setIn(o); nSnap++; } }
      else if (o.st === 'go' && want) setIn(o);
      else if (o.st === 'come' && !want) setOut(o);
      else if (o.st === 'go' && o.hold && camD(o) > 30) setOut(o);   /* 길가에서 멈춘 몸 = 카메라가 멀어지면 들어감(눈앞에서 사라지지 않게) */
      const off = o.st !== 'in'; if (o.hot && o.offW !== off) { o.offW = off; o.hot.off = off; } }   /* 내가 바꿀 때만 씀(길 위 사건 등 다른 갈래가 잠시 끈 E를 되켜지 않음) */
    chainSec(); }
  function tick(dt) { if (!MV.length) return; const t0 = performance.now(), h = M();
    for (let i = MV.length - 1; i >= 0; i--) { const o = MV[i]; if (o.hold) continue; o.t += dt * SPD; const u = Math.min(1, o.t / (o.Lw || 1)), x = o.x0 + (o.x1 - o.x0) * u, z = o.z0 + (o.z1 - o.z0) * u;
      if (h) h.set(o.w.i, x, A.ty(x, z) + 0.02, z, o.ry);
      if (u >= 1) { if (o.st === 'come') setIn(o); else if (o.hm && o.hm.door) setOut(o); else { o.hold = 1; if (h) h.act(o.w.i, 'stand', 'none'); } } }
    const ms = performance.now() - t0; tickMs = ms; if (ms > tickMax) tickMax = ms; }
  const outAt = (x, z) => { for (const o of L) if (o.st !== 'in' && Math.abs(o.w.x - x) < 1 && Math.abs(o.w.z - z) < 1) return true; return false; };
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
  return { sec, tick, fc, news, saw, dexLine, outAt, rec, water,
    info: () => ({ n: L.length, mv: MV.length, nGo, nCome, nSnap, nWait, tickMs: +tickMs.toFixed(3), tickMax: +tickMax.toFixed(3), chain: { ...C(), w: { ...C().w } },
      list: L.map(o => ({ i: o.w.i, k: o.k, st: o.st, nd: !!(o.w.party || A.need(o.w) || A.herd(o.w)), cs: (HO[o.k] || A.hrs(o.k))[0] * 60 - walkMin(o) - o.sg, la: (HO[o.k] || A.hrs(o.k))[1] * 60 + o.sg2, mx: o.st === 'go' || o.st === 'come' ? +(o.x0 + (o.x1 - o.x0) * Math.min(1, o.t / (o.Lw || 1))).toFixed(2) : null, mz: o.st === 'go' || o.st === 'come' ? +(o.z0 + (o.z1 - o.z0) * Math.min(1, o.t / (o.Lw || 1))).toFixed(2) : null, hold: o.hold, x: +o.w.x.toFixed(1), z: +o.w.z.toFixed(1), off: !!(o.hot && o.hot.off), out: !!o.w.out9, hm: o.hm === undefined ? null : o.hm ? { x: +o.hm.x.toFixed(1), z: +o.hm.z.toFixed(1), door: o.hm.door } : 0, hrs: A.hrs(o.k) })) }),
    homes: () => { for (const o of L) homeOf(o); return L.filter(o => o.hm).length; }, reset: () => { key = ''; }, hrsTest: (k, v) => { if (v) HO[k] = v; else delete HO[k]; } };
}
