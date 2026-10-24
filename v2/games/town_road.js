// 🚲 길 위 사건(WAKE-1b · 사용자 10-19 '이거 완전 수면제 게임이다, 하니까 너무 졸려'): 넓은 마을을 오가는 길에 짧고 손맛 있는 일 셋(싸움 X · 뽑기 X)
//   ① 자전거 고리 코스 — 자전거 도로 위 고리 줄(코스 넷까지 · 고리 8~15) · 첫 고리를 지나면 시간 재기 · 고리마다 딩(한 칸씩 높게) · 내 최고 기록 + 금·은·동 도장(가방) · 걸어도 지나가지만 기록은 자전거로만
//   ② 길에서 도움 요청 — 움직이는 동안 놀이 시계가 흐르면(이야기 중엔 두 배 늦게 · 하루 넷까지) 가까운 일꾼이 손을 듦 → E → 모자 잡기 · 떨어뜨린 것 셋 줍기(새 사람 X — 있는 일꾼만)
//      성공 = 그 이웃 ❤(하루 한 번) · 100원 · 일 솜씨 +2(하루 넷까지) · 실패·그만둠 = 벌 X('다음엔 꼭!') · 하는 동안 위 가운데 줄 = 할 일 + 남은 시간
//   ③ 바람에 날아온 보물 지도 조각 — 바람 센 날 종이 한 장이 날아와 앞에 떨어짐 → E = town_treasure.js take()(큰 지도가 열린 뒤 · 그날 지도를 아직 안 받았을 때 · 하루 한 번)
//   렉: 매 프레임 = 진행 중인 것만(다음 고리 하나와의 평면 거리 · 굴러가는 모자 · 나는 종이) · 생기기·끝 판정 = 1초 칸(sec) · 새 Light X · 매 프레임 새 객체 X
//   그리기: 고리 = 인스턴스 하나(가까운 코스만) · 사건 중에만 모자(+2)·주울 것(+1)·종이(+1) · 정본 문서 docs/systems/town_road.md
export const RD_V = 1;
const T2 = (ko, en) => [ko, en];
const DIRN = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];
const bearing = (dx, dz) => (Math.atan2(dx, -dz) * 57.29578 + 360) % 360;   /* 0 = 북(−z) · 90 = 동(+x) */
const dir8 = b => Math.round(b / 45) % 8;
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// 고리 코스: 간격·수 · 메달(금 = 이상 시간 × 1.25 · 은 × 1.6 · 동 = 자전거로 끝까지)
const SPACE = 36, RMIN = 8, RWANT = 12, RMAX = 15, NCOURSE = 4, RR = 1.35, RY = 1.45, LAT = 2.1;
const MED = [null, { e: '🥉', t: T2('동', 'bronze') }, { e: '🥈', t: T2('은', 'silver') }, { e: '🥇', t: T2('금', 'gold') }];
const NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760, 1975.53, 2093];   /* 고리마다 한 칸씩 높게(도레미 두 옥타브) */
const RCOL = { start: 0x3cc76a, next: 0xffd23a, rest: 0xf6f4ee, end: 0xe0453a };   /* 초록 = 출발 · 노랑 = 다음 · 흰 = 나중 · 빨강 = 도착 */
const RFACT = [T2('자전거는 길 오른쪽 자전거 도로로 달려요.', 'Ride on the bike lane on the right side of the road.'), T2('자전거를 탈 땐 안전모를 꼭 써요.', 'Always wear a helmet when you ride a bike.'), T2('자전거 도로가 끝나면 속도를 줄이고 앞을 잘 봐요.', 'Slow down and look ahead where the bike lane ends.')];

// 도움 요청: 일(고르는 차례 = 덜 해 본 것부터) · 떨어뜨린 것 = 그 일터 것(없으면 사과)
const HK = ['hat', 'pick'];
const CROPK = { potato: ['🥔', T2('감자', 'potatoes'), 0xb98b5a, 0.22, T2('감자는 땅속 줄기에 양분이 모여 굵어진 거예요.', 'A potato is an underground stem that swells with stored food.')],
  cabbage: ['🥬', T2('배추', 'cabbages'), 0x9bd46e, 0.3, T2('배추는 서늘한 가을에 잘 자라서 김장할 때 많이 써요.', 'Napa cabbage grows well in cool autumn, just in time for making kimchi.')],
  strawberry: ['🍓', T2('딸기', 'strawberries'), 0xe8434a, 0.16, T2('딸기 씨는 열매 겉에 콕콕 박혀 있어요.', 'Strawberry seeds sit on the outside of the fruit.')],
  pear: ['🍐', T2('배', 'pears'), 0xe8d06a, 0.2, T2('배나무는 봄에 하얀 꽃이 피고 가을에 열매가 익어요.', 'Pear trees bloom white in spring and the fruit ripens in autumn.')],
  shiitake: ['🍄', T2('표고버섯', 'shiitake'), 0x8a5a3a, 0.18, T2('표고버섯은 참나무 통나무에서 길러요.', 'Shiitake mushrooms are grown on oak logs.')] };
const CROP0 = ['🍎', T2('사과', 'apples'), 0xd8402e, 0.2, T2('사과는 가을에 빨갛게 익어요.', 'Apples turn red and ripe in autumn.')];
const NOHELP = new Set(['swim', 'guest']);

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · busy() 창·놀이 · away() 실내·버스·지하철·배·잠 · bike() · bikeOn() 자전거가 열렸나 · night() · story() 이야기 진행 중 · rideFast() 버스 등
//   lanes() [구간, 안쪽, 바깥쪽] · roads() RSEG · crossPts() 교차로 [[x, z]] · inSchool · water(x, z) · onBridge(x, z, m) · blocked(x, z, y) · gy(x, z) 서는 높이 · okSpot(x, z) 서는 빈 땅(차도·물·마당·막힘 X) · inLane(x, z) 차도
//   gate() 학교 정문 · place(x, z) 자리 말 · cell(x, z) · workers() WKP · wkMesh() 일꾼 인스턴스(act·reset·hat) · wkHot(w) 그 일꾼 E · playk(k) [아이콘, 이름, 영어]
//   routeBusy() 빨간 선 길 안내 중 · bubble(o, t) · heart(w, n) · money(n) · bagAdd(e) · bagHas(e) · skUp(k, n) · rec(k, o) · windy() · wind() {x, z, k}
//   treasure() 보물 지도 모듈 · root()
export function createRoad(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.road; if (!s || typeof s !== 'object' || s.v !== RD_V) s = g.road = { v: RD_V, ring: {}, hk: {}, n: 0 }; if (!s.ring || typeof s.ring !== 'object') s.ring = {}; if (!s.hk || typeof s.hk !== 'object') s.hk = {}; return s; };
  const mark = () => A.GAME.mark(), toast = (t, s, lv) => (A.say ? A.say(t, s, lv) : map.hud.toast(t, s)), banner = (t, s) => map.hud.banner(t, s), sfx = k => map.sfx && map.sfx(k), tone = (...a) => map.tone && map.tone(...a);
  const O = new T3.Object3D(), C9 = new T3.Color();   /* 스크래치(매 프레임 새 객체 X) */
  let CS = [], built = false, buildMs = 0, NEAR = [], RING = null, RGEO = null, RMAT = null, ringKey = '', RACE = null;
  let REQ = null, ACT = null, PAPER = null, goalT = null, q4 = 0, lastMin = -1, movMin = 40, movP = 0, lx = 1e9, lz = 1e9, fx = 1e9, fz = 1e9;
  let HAT = null, HATG = [], ITEM = null, PAP = null, PAPT = null, PAPG = null;
  const DBG = [];

  // ───────── ① 고리 코스 짓기(처음 1초 칸에서 한 번 · 자전거 도로 줄 → 1m 점 → 몸이 막히는 곳에서 끊음 → 36m마다 고리) ─────────
  let BQ = null;   /* 짓기 차례(줄 묶음) — 1초 칸마다 3ms씩 나눠 지음(한 프레임에 12ms 몰리지 않게) */
  function build(all) { const t0 = performance.now(); if (!BQ) { CS = []; BQ = { ch: [], i: 0, cand: [], XP: null, ms: 0 };
    let lanes = (A.lanes() || []).map(([s, a9, b9]) => ({ s, oc: (a9 + b9) / 2 }));
    if (!lanes.length) for (const s of A.roads() || []) if (s.r.big) { const o = s.hw - 1.1; lanes.push({ s, oc: o }, { s, oc: -o }); }   /* 자전거 도로가 없는 마을 = 큰길 인도 가운데 */
    const G = new Map(); for (const ln of lanes) { const sg = ln.oc >= 0 ? 1 : -1; let g = G.get(ln.s.r); if (!g) G.set(ln.s.r, g = { 1: [], '-1': [] }); g[sg].push(ln); }
    BQ.XP = A.crossPts() || [];
    for (const [, sides] of G) for (const sg of [1, -1]) { const arr = sides[sg].sort((p, q) => p.s.i9 - q.s.i9); let ch = [];
      const flush = () => { if (ch.length) BQ.ch.push([ch, sg]); ch = []; };
      for (const ln of arr) { if (ch.length && ln.s.i9 !== ch[ch.length - 1].s.i9 + 1) flush(); ch.push(ln); } flush(); } }
    const cand = BQ.cand; while (BQ.i < BQ.ch.length && (all || performance.now() - t0 < 3)) { const [ch, sg] = BQ.ch[BQ.i++]; runsOf(ch, sg, BQ.XP, cand); }
    BQ.ms += performance.now() - t0; if (BQ.i < BQ.ch.length) return; built = true;
    cand.sort((a, b) => a.d0 - b.d0);
    for (const c of cand) { if (CS.length >= NCOURSE) break; if (CS.some(o => o.rings.some(r => c.rings.some(q => Math.hypot(q.x - r.x, q.z - r.z) < 150)))) continue; CS.push(c); }
    CS.forEach((c, k) => { const r0 = c.rings[0]; c.id = 'r' + Math.round(r0.x) + '_' + Math.round(r0.z); c.k = k; const m = c.rings[c.rings.length >> 1]; c.cx = m.x; c.cz = m.z; c.rad = 0; for (const r of c.rings) c.rad = Math.max(c.rad, Math.hypot(r.x - c.cx, r.z - c.cz));
      c.L = 0; for (let i = 1; i < c.rings.length; i++) c.L += Math.hypot(c.rings[i].x - c.rings[i - 1].x, c.rings[i].z - c.rings[i - 1].z); c.par = c.L / 22; c.gold = Math.round(c.par * 1.25 * 10) / 10; c.silver = Math.round(c.par * 1.6 * 10) / 10;
      c.place = A.place(m.x, m.z); c.cell = A.cell(r0.x, r0.z); c.ps = 1; });
    buildMs = Math.round(BQ.ms + performance.now() - t0); BQ = null; }
  // 한 줄(같은 길 · 같은 쪽 · 잇닿은 구간) → 가는 차례 점 → 1m 점마다 몸이 서는지 → 이어진 토막마다 고리
  function runsOf(ch, sg, XP, cand) { const P = [];
    for (const { s, oc } of ch) { const L0 = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); if (L0 < 0.5) continue; const px = -(s.b[1] - s.a[1]) / L0, pz = (s.b[0] - s.a[0]) / L0; P.push([s.a[0] + px * oc, s.a[1] + pz * oc], [s.b[0] + px * oc, s.b[1] + pz * oc]); }
    if (sg < 0) P.reverse(); if (P.length < 2) return;   /* 오른쪽 차로 = 구간 a → b가 + 쪽(오른쪽) · − 쪽은 b → a로 달림 */
    const X = [], Z = [], Y = [], OK = [], NX = []; let rem = 0;
    for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], L0 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L0 < 0.01) continue; const tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0; let t = rem;
      for (; t < L0; t += 1) { X.push(a[0] + tx * t); Z.push(a[1] + tz * t); } rem = t - L0; }   /* 1m 점(구간이 바뀌어도 간격 그대로) */
    let py = null; for (let i = 0; i < X.length; i++) { const x = X[i], z = Z[i], y = A.gy(x, z); let ok = Number.isFinite(y) && !A.inSchool(x, z) && !A.water(x, z) && !A.onBridge(x, z, 2) && !A.blocked(x, z, y + 0.6);
      if (ok && py != null && Math.abs(y - py) > 1.0) ok = false; py = ok ? y : null; Y.push(y); OK.push(ok); let nx = false; for (const q of XP) if (Math.abs(q[0] - x) < 11 && Math.abs(q[1] - z) < 11) { nx = true; break; } NX.push(nx); }
    let i0 = -1; for (let i = 0; i <= X.length; i++) { if (i < X.length && OK[i]) { if (i0 < 0) i0 = i; continue; } if (i0 >= 0 && i - i0 > SPACE * (RMIN - 1) + 16) ringsOn(i0, i - 1, X, Z, Y, NX, cand); i0 = -1; } }
  function ringClear(x, z, y, dx, dz) { const px = -dz, pz = dx; for (const l of [-RR, 0, RR]) { if (A.blocked(x + px * l, z + pz * l, y + (l ? 0.35 : 1.5))) return false; } return true; }
  function ringsOn(i0, i1, X, Z, Y, NX, cand) { const R = []; let k = i0 + 8;
    while (k < i1 - 6) { let j = -1; for (const d of [0, 3, -3, 6, -6, 9]) { const q = k + d; if (q < i0 + 4 || q > i1 - 4 || NX[q]) continue; const a = Math.max(i0, q - 3), b = Math.min(i1, q + 3); let dx = X[b] - X[a], dz = Z[b] - Z[a]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl; if (!ringClear(X[q], Z[q], Y[q], dx, dz)) continue; j = q; R.push({ x: X[q], y: Y[q] + RY, z: Z[q], dx, dz, i: q }); break; }
      k = j >= 0 ? j + SPACE : k + 6; }
    for (let s = 0; s + RMIN <= R.length; s += RWANT) { let w = R.slice(s, s + RWANT); if (R.length - (s + RWANT) < RMIN && R.length - s <= RMAX) w = R.slice(s); if (w.length < RMIN) break; let gap = false; for (let i = 1; i < w.length; i++) if (w[i].i - w[i - 1].i > SPACE * 1.8) gap = true; if (gap) continue;
      const gt = A.gate(); cand.push({ rings: w.map(r => ({ x: r.x, y: r.y, z: r.z, dx: r.dx, dz: r.dz })), path: { x: X.slice(w[0].i, w[w.length - 1].i + 1), z: Z.slice(w[0].i, w[w.length - 1].i + 1) }, d0: Math.hypot(w[0].x - gt[0], w[0].z - gt[1]) }); if (w.length > RWANT) break; } }

  // 고리 그리기: 인스턴스 하나 · 가까운 코스만 채움(바뀐 것이 있을 때만 올림)
  function ringMesh() { if (RING) return RING; RGEO = new T3.TorusGeometry(RR, 0.1, 6, 22); RMAT = new T3.MeshLambertMaterial({ color: 0xffffff, flatShading: true }); RING = new T3.InstancedMesh(RGEO, RMAT, NCOURSE * RMAX); RING.setColorAt(0, C9.setHex(RCOL.rest)); RING.count = 0; RING.userData.fx = 1; RING.frustumCulled = false; RING.matrixAutoUpdate = false; RING.visible = false; return RING; }
  function paint() { const key = NEAR.map(c => c.k).join(',') + '|' + (RACE ? RACE.c.k + ':' + RACE.i : '-'); if (key === ringKey && RING && (RING.parent || !NEAR.length)) return; ringKey = key; const M = ringMesh(); if (!M.parent) { const r = A.root(); if (r) r.add(M); }
    let n = 0; for (const c of NEAR) { const on = RACE && RACE.c === c; c.rings.forEach((r, i) => { const gone = on && i < RACE.i; O.position.set(r.x, r.y, r.z); O.rotation.set(0, Math.atan2(r.dx, r.dz), 0); const sc = gone ? 0.001 : i === 0 && !on ? 1.15 : 1; O.scale.set(sc, sc, sc); O.updateMatrix(); M.setMatrixAt(n, O.matrix);
      const col = i === c.rings.length - 1 ? RCOL.end : on ? (i === RACE.i ? RCOL.next : RCOL.rest) : i === 0 ? RCOL.start : RCOL.rest; M.setColorAt(n, C9.setHex(col)); n++; }); }
    M.count = n; M.visible = n > 0; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; }
  function nearSec(me) { const want = A.bikeOn() && !A.away() ? CS.filter(c => Math.hypot(me.x - c.cx, me.z - c.cz) < c.rad + 230) : []; if (RACE && !want.includes(RACE.c)) want.push(RACE.c);
    const same = want.length === NEAR.length && want.every((c, i) => c === NEAR[i]); if (!same) { for (const c of want) if (!NEAR.includes(c)) c.ps = 1; NEAR = want; } paint(); }

  // 고리 지나기: 평면(고리 자리 · 가는 쪽)을 뒤 → 앞으로 넘고, 넘은 자리가 고리 안(옆 2.1m · 높이)이면 지남
  const sOf = (r, me) => (me.x - r.x) * r.dx + (me.z - r.z) * r.dz;
  const inRing = (r, me) => Math.abs(-(me.x - r.x) * r.dz + (me.z - r.z) * r.dx) < LAT && Math.abs(me.y + 0.9 - r.y) < 2.4;
  function startCheck(me) { for (const c of NEAR) { const r = c.rings[0], s = sOf(r, me); if (c.ps < 0 && s >= 0 && s < 4 && inRing(r, me)) { c.ps = s; raceStart(c, me); return; } c.ps = s; } }
  function raceStart(c, me) { const bk = !!A.bike(); RACE = { c, i: 1, t: 0, bike: bk, lx: me.x, lz: me.z, ps: sOf(c.rings[1], me), walk: 0, off: false }; ding(0); paint(); goalT = null;
    toast(bk ? '🚲 ' + (en() ? 'Go! Ride through the yellow rings' : '출발! 노란 고리를 차례로 지나요') : '🚶 ' + (en() ? 'Practice run. Records count only on the bike (B)' : '연습이에요. 기록은 자전거(B)로만 남아요'), 2.2); }
  function ding(i) { const f = NOTES[Math.min(i, NOTES.length - 1)]; tone(f, 0, 0.16, 'triangle', 0.12); tone(f / 2, 0, 0.12, 'sine', 0.05); }
  function raceFrame(dt, me) { const R = RACE, c = R.c; if (!A.busy()) R.t += dt; const jp = Math.abs(me.x - R.lx) + Math.abs(me.z - R.lz); R.lx = me.x; R.lz = me.z; if (jp > 30) { raceEnd(true); return; } if (R.bike && !A.bike()) R.walk += jp;   /* 자전거에서 내려(차에 부딪혀도) 걸은 거리 — 20m 넘으면 연습 */
    const r = c.rings[R.i], s = sOf(r, me); if (R.ps < 0 && s >= 0 && s < 4 && inRing(r, me)) { ding(R.i); R.i++; if (R.i >= c.rings.length) { finish(); return; } R.ps = sOf(c.rings[R.i], me); paint(); goalT = null; return; } R.ps = s; }
  function raceSec(me) { const R = RACE, c = R.c; if (R.bike && !A.bike()) { if (!R.off) { R.off = true; setTimeout(() => { if (RACE === R && R.bike && !A.bike()) toast('🚲 ' + (en() ? 'Press B to get back on and keep going!' : 'B를 눌러 다시 타고 이어 달려요!'), 2.6); }, 2600); } if (R.walk > 20) { R.bike = false; toast('🚶 ' + (en() ? 'You walked off the bike: this run is practice now (no record)' : '자전거에서 내려 걸었어요. 이번 판은 연습이에요(기록 X)'), 2.8); } } else if (A.bike()) R.off = false;
    const r = c.rings[R.i]; if (A.away() || R.t > c.par * 4 + 40 || Math.hypot(me.x - r.x, me.z - r.z) > 130) raceEnd(false); }
  function raceEnd(jump) { if (!RACE) return; RACE = null; paint(); goalT = null; toast('⏱ ' + (jump ? (en() ? 'Ring course stopped (you moved away)' : '고리 코스를 멈췄어요(다른 곳으로 옮겼어요)') : (en() ? 'Ring course stopped. Next time for sure!' : '고리 코스를 멈췄어요. 다음엔 꼭!')), 2.4); }
  function finish() { const R = RACE, c = R.c, t = Math.round(R.t * 10) / 10, e = en(); RACE = null; c.ps = 1; paint(); goalT = null; tone(1046.5, 0.12, 0.25, 'triangle', 0.12); tone(1318.5, 0.24, 0.25, 'triangle', 0.12); tone(1568, 0.36, 0.4, 'triangle', 0.12);
    if (!R.bike) { banner('🏁 ' + (e ? 'Practice done: ' + t + ' s. Records count only on the bike (B)' : '연습 완주 ' + t + '초! 기록은 자전거(B)로만 남아요'), 3.2); A.rec('road', { k: 'ring', id: c.id, t, m: 0 }); return; }
    const s = S(), Q = s.ring[c.id] || (s.ring[c.id] = { b: 0, m: 0, n: 0 }), best = !Q.b || t < Q.b, m = t <= c.gold ? 3 : t <= c.silver ? 2 : 1; Q.n++; if (best) Q.b = t; if (m > Q.m) Q.m = m;
    const st = !A.bagHas(MED[m].e); if (st) A.bagAdd(MED[m].e); const xk = 'rd:ring:' + c.id; if (!A.GAME.picked(xk)) { A.GAME.pick(xk); A.skUp('explore', 2); }   /* 탐험 솜씨 = 코스마다 하루 한 번(같은 코스 되풀이로 무한히 X) */ A.rec('road', { k: 'ring', id: c.id, t, m }); mark(); A.GAME.flush && A.GAME.flush();
    banner('🏁 ' + (e ? 'Finished in ' + t + ' s ' + MED[m].e + (best ? ' New best!' : ' (best ' + Q.b + ' s)') : t + '초에 완주 ' + MED[m].e + (best ? ' 내 최고 기록!' : ' (내 최고 ' + Q.b + '초)')), 3.4);
    const nx = m < 3 ? (e ? 'Next: ' + MED[m + 1].e + ' within ' + (m === 1 ? c.silver : c.gold) + ' s' : '다음 ' + MED[m + 1].e + ' = ' + (m === 1 ? c.silver : c.gold) + '초 안') : '';
    setTimeout(() => { if (!RACE) toast((st ? MED[m].e + ' ' + (e ? L(MED[m].t) + ' ring stamp in your bag! ' : '고리 코스 ' + L(MED[m].t) + ' 도장이 가방에 들어갔어요. ') : '') + (nx ? nx + '. ' : '') + '💡 ' + L(RFACT[(s.n++) % RFACT.length]), 4.6); mark(); }, 1600); }

  // ───────── ② 길에서 도움 요청 ─────────
  const W = () => A.workers() || [];
  const atHub = w => !!(A.hub && A.hub(w.x, w.z)), okWorker = w => w && w.k && A.playk(w.k) && (w.k !== 'stall' || atHub(w)) && !w.gate && !w.party && !NOHELP.has(w.role) && !A.water(w.x, w.z);
  function camFwd() { const e9 = map.camera.matrixWorld.elements, cl = Math.hypot(e9[8], e9[10]) || 1; return [-e9[8] / cl, -e9[10] / cl]; }
  function helpTry(me, force, fi) { const cf = camFwd(), WK = W(); let bi = -1, bd = 1e9;
    for (let i = 0; i < WK.length; i++) { const w = WK[i]; if (!okWorker(w)) continue; if (fi != null && i !== fi) continue; const dx = w.x - me.x, dz = w.z - me.z, d = Math.hypot(dx, dz); if (fi == null && (d < 14 || d > 70 || Math.abs(w.g - me.y) > 6)) continue; const fr = d > 0.1 ? (dx * cf[0] + dz * cf[1]) / d : 1; if (fi == null && fr < 0.25) continue; const sc = d - fr * 20 - (atHub(w) ? 25 : 0); if (sc < bd) { bd = sc; bi = i; } }   /* HUB-1: 모이는 곳(학교 앞·장터·강가 40m 안) 일꾼이 먼저 · 장터 상인은 모이는 곳에서만 */
    if (bi < 0) return false; const w = WK[bi], s = S(), order = force ? [force] : HK.slice().sort((a, b) => (s.hk[a] || 0) - (s.hk[b] || 0) || HK.indexOf(a) - HK.indexOf(b));
    for (const k of order) { const plan = PLAN[k](w, me); if (plan) { reqStart(bi, w, k, plan); return true; } DBG.push(k + ' 못 함 @' + Math.round(w.x) + ',' + Math.round(w.z)); if (DBG.length > 30) DBG.shift(); } return false; }
  /* 그 자리 위가 트였나(지붕·차광막·처마 밑 X) + (nb = 둘레 1m 넷도 막히지 않음) */
  function openAt(x, z, y, nb) { const top = map.q.groundAt(x, z, y + 8); if (Number.isFinite(top) && top - y > 0.4) return false; if (nb) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (A.blocked(x + dx, z + dz, y + 0.6)) return false; return true; }
  const PLAN = {
    hat(w) { const Wd = A.wind(); let ax = Wd.x, az = Wd.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al; const P = [], R9 = rng('hat:' + A.GAME.S.day + ':' + Math.round(w.x)); let x = w.x + ax * 1.2, z = w.z + az * 1.2; const turn = R9() < 0.5 ? 1 : -1;
      for (let k = 0; k < 70; k++) { let moved = false; for (const a of [0, 0.6, -0.6, 1.1, -1.1]) { const ca = Math.cos(a * turn), sa = Math.sin(a * turn), dx = ax * ca - az * sa, dz = ax * sa + az * ca, nx = x + dx, nz = z + dz; if (!A.okSpot(nx, nz)) continue; const y = A.gy(nx, nz); if (!Number.isFinite(y) || Math.abs(y - w.g) > 4 || !openAt(nx, nz, y)) continue; ax = ax * 0.7 + dx * 0.3; az = az * 0.7 + dz * 0.3; const l9 = Math.hypot(ax, az) || 1; ax /= l9; az /= l9; x = nx; z = nz; P.push(x, y, z); moved = true; break; } if (!moved) break; }
      return P.length / 3 >= 16 ? { P } : null; },
    pick(w) { const R9 = rng('pick:' + A.GAME.S.day + ':' + Math.round(w.x) + ':' + Math.round(w.z)), sp = [], a0 = R9() * 6.28;
      for (let k = 0; k < 36 && sp.length < 3; k++) { const a = a0 + k * 2.4, d = 7 + (k * 3.7) % 11, x = w.x + Math.cos(a) * d, z = w.z + Math.sin(a) * d; if (!A.okSpot(x, z)) continue; const y = A.gy(x, z); if (!Number.isFinite(y) || Math.abs(y - w.g) > 2.5 || !openAt(x, z, y, true)) continue; if (sp.some(q => Math.hypot(q[0] - x, q[2] - z) < 4)) continue;
        const wl = A.walkLen ? A.walkLen([w.x, w.z], [x, z], 1.2, 8) : 0; if (wl < 0 || wl > d * 1.6 + 6) continue; sp.push([x, y, z]); }   /* FIX-RD1 줍기 0/3: 지붕·차광막 밑이나 걸어서 못 닿는 곳(울타리 너머)에 떨어지면 몸이 지붕 위·담 밖에 서서 E가 안 닿음 → 하늘이 트이고 일꾼 자리에서 걸어서 닿는 땅만 */
      return sp.length === 3 ? { sp, crop: CROPK[w.k] || CROP0 } : null; } };
  const who = w => { const K = A.playk(w.k); return K ? (en() ? K[2] : K[1]) : ''; };
  function hotOff(w, off) { const h = A.wkHot(w); if (!h) return; if (off) { if (h.rdOff == null) { h.rdOff = !!h.off; h.off = true; } } else if (h.rdOff != null) { h.off = h.rdOff; delete h.rdOff; } }
  function reqStart(i, w, kind, plan) { const e = en(); REQ = { i, w, kind, plan, t: 0, bq: 0 }; const M = A.wkMesh(); if (M) M.act(i, 'wave', 0); hotOff(w, true);
    REQ.h = map.interact.add({ kind: 'game', x: w.x, z: w.z, y: w.g, r: 3.2, label: '🙋 ' + (e ? 'Help the ' + who(w) + ' worker' : who(w) + ' 일꾼 도와드리기'), use: () => offer() });
    A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, e ? 'Excuse me! Can you help?' : '저기요! 잠깐 도와줄래요?'); sfx('tick'); toast('🙋 ' + (e ? 'A worker is waving at you!' : '저기 일꾼이 손을 들었어요!'), 2.4, 1); goalT = null; }
  function reqEnd(quiet) { if (!REQ) return; const r = REQ; REQ = null; if (r.h) r.h.remove(); const M = A.wkMesh(); if (M) M.reset(r.i); hotOff(r.w, false); if (!quiet && !A.panelOpen()) toast('🙋 ' + (en() ? 'Maybe next time!' : '다음에 도와드려요!'), 2); goalT = null; }
  function limitOf() { return 75; }
  function taskLine(r) { const e = en(); if (r.kind === 'hat') return e ? 'Catch the hat the wind blew away and bring it back.' : '바람에 날아간 모자를 잡아서 가져다드려요.';
    if (r.kind === 'pick') return e ? 'Pick up the three ' + r.plan.crop[1][1] + ' that fell and bring them back.' : '떨어진 ' + r.plan.crop[1][0] + ' 셋을 주워서 가져다드려요.'; return ''; }
  function offer() { if (!REQ || ACT || A.busy()) return; const r = REQ, e = en(), lim = limitOf(r);
    const P = A.openP('<h3>🙋 ' + (e ? 'A neighbour asks for help' : '이웃의 부탁') + '</h3><div style="font-weight:800;margin:4px 0 6px">' + esc((e ? 'To do: ' : '할 일: ') + taskLine(r)) + '</div>'
      + '<div class="sm">⏱ ' + esc(e ? 'About ' + mmss(lim) + '. It is fine if you cannot make it.' : mmss(lim) + ' 안에 해요. 못 해도 괜찮아요.') + '</div>'
      + '<div class="row"><button class="sub" data-a="no">' + (e ? 'Maybe later' : '다음에 할게요') + '</button><button data-a="ok">' + (e ? 'I will help!' : '도와드릴게요') + '</button></div>', false, 'road');
    if (P) P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'ok') { A.closeP(); actStart(); } else if (b.dataset.a === 'no') { A.closeP(); reqEnd(true); movMin = 0; } }; }
  function actStart() { if (!REQ) return; const r = REQ, w = r.w, e = en(); REQ = null; if (r.h) r.h.remove(); ACT = { kind: r.kind, w, i: r.i, plan: r.plan, el: 0, lim: limitOf(r), got: 0, s: 0, hx: w.x, hz: w.z, hy: w.g, carry: false }; const M = A.wkMesh(); if (M) M.reset(r.i);
    if (r.kind === 'hat') { if (M && M.hat) M.hat(r.i, false); hatMake(w); ACT.hy0 = w.g + 1.72; ACT.fly = 0.7; ACT.h = map.interact.add({ kind: 'game', x: w.x, z: w.z, y: w.g, r: 1.9, label: '👒 ' + (e ? 'Catch the hat' : '모자 잡기'), use: () => hatCatch() }); ACT.h.hot.off = true;
      A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, e ? 'Oh no, my hat! The wind took it!' : '앗, 모자가 바람에 날아가요!'); }
    else if (r.kind === 'pick') { const C = r.plan.crop; itemMake(C); ACT.hs = r.plan.sp.map((p, k) => map.interact.add({ kind: 'game', x: p[0], z: p[2], y: p[1], r: 2.0, label: C[0] + ' ' + (e ? 'Pick up ' + C[1][1] : C[1][0] + ' 줍기'), use: () => pickOne(k) }));
      A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, e ? 'Oops, my basket tipped over!' : '앗, 바구니를 엎었어요!'); }
    sfx('pop'); goalT = null; }
  function actEnd(ok, why) { const a = ACT; if (!a) return; ACT = null; const w = a.w, e = en(), M = A.wkMesh(); if (M) { M.reset(a.i); if (M.hat) M.hat(a.i, true); } hotOff(w, false);
    if (a.h) a.h.remove(); if (a.hs) for (const h of a.hs) h.remove(); if (HAT) HAT.visible = false; if (ITEM) ITEM.visible = false;
    const s = S(); if (ok) { s.hk[a.kind] = (s.hk[a.kind] || 0) + 1; const hk9 = 'rd:h:' + w.k + ':' + Math.round(w.x) + ':' + Math.round(w.z), hOk = !A.GAME.picked(hk9), pay = A.GAME.uses('road:pay') < 4;   /* 하루 한도: 그 이웃 ❤ = 하루 한 번 · 100원·일 솜씨 = 하루 넷(되풀이로 무한히 오르지 않게 · FIX-LK1과 같은 길) */
      if (hOk) { A.GAME.pick(hk9); A.heart(w, 1); } if (pay) { A.GAME.use('road:pay'); A.money(100); A.skUp('work', 2); } A.GAME.use('road:help'); mark(); A.GAME.flush && A.GAME.flush(); sfx('ding');
      const L9 = a.kind === 'hat' ? T2('고마워요! 바람이 참 세네요.', 'Thank you! What a wind!') : a.kind === 'pick' ? T2('고마워요! 덕분에 금방 끝났어요.', 'Thank you! That was quick!') : T2('고마워요!', 'Thank you!');
      A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(L9));
      banner('🙋 ' + (e ? 'You helped!' + (hOk ? ' ❤+1' : '') + (pay ? (hOk ? ' and' : '') + ' 100 won' : '') : '도와드렸어요!' + (hOk ? ' ❤+1' : '') + (pay ? (hOk ? ', ' : ' ') + '100원을 받았어요' : '')) + (pay ? '' : (e ? ' (today\'s share is done)' : ' (오늘 받을 몫은 끝)')), 3);
      const f = a.kind === 'hat' ? windFact() : L(a.plan.crop[4]);
      setTimeout(() => toast('💡 ' + f, 4.6, 1), 1500); }
    else { A.GAME.use('road:help'); mark(); if (Math.hypot(map.player.pos().x - w.x, map.player.pos().z - w.z) < 45) A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(T2('괜찮아요, 다음에 또 부탁해요!', 'That is OK, maybe next time!')));
      toast('⏱ ' + (why === 'time' ? (e ? 'Time is up. Next time for sure!' : '시간이 다 됐어요. 다음엔 꼭!') : (e ? 'The favour stopped. Next time for sure!' : '부탁을 멈췄어요. 다음엔 꼭!')), 3.6); }
    A.rec('road', { k: a.kind, ok: ok ? 1 : 0, t: Math.round(a.el) }); movMin = 0; goalT = null; }
  function windFact() { const Wd = A.wind(), k = dir8(bearing(Wd.x, Wd.z)); return en() ? 'Today the wind blows ' + DIRN[k][1] + ', so the hat rolled that way.' : '오늘 바람은 ' + DIRN[k][0] + '쪽으로 불어요. 그래서 모자도 그쪽으로 굴러갔어요.'; }

  // 모자: 몸에서 날아올라(0.7초) 미리 정한 길(바람 쪽 · 막히면 비켜 감)을 따라 굴러감 · 점점 느려짐 · 잡으면 들고 가서 돌려드림
  //   모자 = 세 겹(바깥 = 자리·가는 쪽 · 가운데 = 굴 때 옆으로 세움 · 안 = 바퀴처럼 돎) — 챙으로 서서 굴러감
  function hatMake(w) { const RL = A.wkRole ? A.wkRole(w) : null, hc = (RL && RL.hat) || 0xe8d38a;
    if (!HAT) hatBuild(hc); else HATG[0].material.color.setHex(hc); HAT.visible = true; hatPose(w.x, w.g + 1.72, w.z, 0, 0, 0); }
  function hatBuild(hc) { const g = new T3.Group(), tip = new T3.Group(), spin = new T3.Group(), mt = new T3.MeshLambertMaterial({ color: hc, flatShading: true }), mb = new T3.MeshLambertMaterial({ color: 0x8a5a3a });
      const brim = new T3.Mesh(new T3.CylinderGeometry(0.34, 0.36, 0.03, 14), mt), crown = new T3.Mesh(new T3.CylinderGeometry(0.17, 0.2, 0.15, 12), mt), band = new T3.Mesh(new T3.CylinderGeometry(0.205, 0.205, 0.04, 12), mb); crown.position.y = 0.09; band.position.y = 0.04; spin.add(brim, crown, band); tip.add(spin); g.add(tip); HATG = [brim, crown, band]; g.userData.fx = 1; g.userData.tip = tip; g.userData.spin = spin; g.visible = false; map.add(g); HAT = g; }
  function hatPose(x, y, z, yaw, tip, spin) { HAT.position.set(x, y, z); HAT.rotation.set(0, yaw, 0); HAT.userData.tip.rotation.set(0, 0, tip); HAT.userData.spin.rotation.set(0, spin, 0); }
  function hatFrame(dt, me) { const a = ACT, P = a.plan.P, n = P.length / 3; if (a.carry) { hatPose(me.x, me.y + 1.75, me.z, 0, 0, 0); return; }
    if (a.fly > 0) { a.fly -= dt; const u = 1 - Math.max(0, a.fly) / 0.7; hatPose(a.w.x + (P[0] - a.w.x) * u, a.hy0 + (P[1] + 0.36 - a.hy0) * u + Math.sin(u * Math.PI) * 1.4, a.w.z + (P[2] - a.w.z) * u, u * 3, u * Math.PI / 2, u * 6); return; }
    if (A.busy()) return; const v = Math.max(1.3, 3.6 * Math.exp(-a.s / 26)) * (A.windy() ? 1.25 : 1) * (0.8 + 0.4 * Math.abs(Math.sin(a.el * 1.7))); a.s = Math.min(n - 1, a.s + v * dt);
    const k = Math.floor(a.s), f = a.s - k, k2 = Math.min(n - 1, k + 1), x = P[k * 3] + (P[k2 * 3] - P[k * 3]) * f, y = P[k * 3 + 1] + (P[k2 * 3 + 1] - P[k * 3 + 1]) * f, z = P[k * 3 + 2] + (P[k2 * 3 + 2] - P[k * 3 + 2]) * f;
    const rolling = a.s < n - 1.01; if (rolling) hatPose(x, y + 0.36, z, Math.atan2(P[k2 * 3] - P[k * 3], P[k2 * 3 + 2] - P[k * 3 + 2]), Math.PI / 2, -a.s / 0.36); else hatPose(x, y + 0.02, z, 0.6, 0, 0); a.hx = x; a.hz = z; a.hy = y; }
  function hatCatch() { const a = ACT; if (!a || a.kind !== 'hat' || a.carry || a.fly > 0) return; a.carry = true; if (a.h) a.h.hot.off = true; sfx('pop'); toast('👒 ' + (en() ? 'Got it! Bring it back to the worker' : '잡았어요! 이웃께 가져다드려요'), 2.2); goalT = null; }
  // 떨어진 것 셋: 인스턴스 하나(3) · E마다 하나 · 다 주우면 이웃 곁(3.5m)에서 저절로 드림
  function itemBuild() { ITEM = new T3.InstancedMesh(new T3.IcosahedronGeometry(1, 0), new T3.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), 3); ITEM.setColorAt(0, C9.setHex(0xffffff)); ITEM.count = 0; ITEM.visible = false; ITEM.userData.fx = 1; ITEM.frustumCulled = false; map.add(ITEM); }
  function itemMake(C) { if (!ITEM) itemBuild();
    ITEM.visible = true; ACT.plan.sp.forEach((p, k) => { const sc = Math.max(C[3], 0.26); O.position.set(p[0], p[1] + sc * 0.8, p[2]); O.rotation.set(k, k * 2, 0); O.scale.set(sc, sc * 0.9, sc);   /* 풀에 묻히지 않게 0.26m 이상 */ O.updateMatrix(); ITEM.setMatrixAt(k, O.matrix); ITEM.setColorAt(k, C9.setHex(C[2])); }); ITEM.count = 3; ITEM.instanceMatrix.needsUpdate = true; if (ITEM.instanceColor) ITEM.instanceColor.needsUpdate = true; }
  function pickOne(k) { const a = ACT; if (!a || a.kind !== 'pick' || a.got & (1 << k)) return; a.got |= 1 << k; if (a.hs[k]) a.hs[k].hot.off = true; O.position.set(0, -1e4, 0); O.scale.set(0.001, 0.001, 0.001); O.updateMatrix(); ITEM.setMatrixAt(k, O.matrix); ITEM.instanceMatrix.needsUpdate = true; sfx('tick'); goalT = null;
    const n = [0, 1, 2].filter(i => a.got & (1 << i)).length; toast(a.plan.crop[0] + ' ' + n + '/3' + (n === 3 ? (en() ? ' All picked! Bring them back' : ' 다 주웠어요! 이웃께 가져다드려요') : ''), 1.8); }

  // ───────── ③ 바람에 날아온 지도 조각 ─────────
  function paperOk() { const T = A.treasure && A.treasure(); return !!(T && T.on && T.free && T.free()); }
  function paperTry(me, force) { if (!force && (!A.windy() || !paperOk())) return false; const Wd = A.wind(), cf = camFwd(); let land = null;
    for (const f of [13, 17, 10, 21]) { for (const l of [0, 3, -3, 6, -6]) { const x = me.x + cf[0] * f - cf[1] * l, z = me.z + cf[1] * f + cf[0] * l; if (!A.okSpot(x, z)) continue; const y = A.gy(x, z); if (!Number.isFinite(y) || Math.abs(y - me.y) > 2.5) continue; land = [x, y, z]; break; } if (land) break; }
    if (!land) return false; let wx = Wd.x, wz = Wd.z; const wl = Math.hypot(wx, wz) || 1; wx /= wl; wz /= wl; PAPER = { x0: land[0] - wx * 26, y0: land[1] + 8, z0: land[2] - wz * 26, x: land[0], y: land[1], z: land[2], t: 0, fly: 3.4, life: 0, h: null }; papMake(); PAP.visible = true; toast('💨 ' + (en() ? 'A sheet of paper blew in on the wind!' : '바람에 종이 한 장이 날아왔어요!'), 2.6); goalT = null; return true; }
  function papMake() { if (PAP) return PAP; const c = document.createElement('canvas'); c.width = 64; c.height = 48; const g = c.getContext('2d'); g.fillStyle = '#efe0b8'; g.fillRect(0, 0, 64, 48); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.strokeRect(2, 2, 60, 44); g.strokeStyle = '#2f6fd0'; g.beginPath(); g.moveTo(6, 34); g.bezierCurveTo(20, 26, 30, 40, 58, 22); g.stroke(); g.strokeStyle = '#6b4a2b'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(10, 10); g.lineTo(28, 20); g.lineTo(44, 14); g.stroke(); g.setLineDash([]); g.strokeStyle = '#c8352e'; g.lineWidth = 3; g.beginPath(); g.moveTo(42, 8); g.lineTo(50, 16); g.moveTo(50, 8); g.lineTo(42, 16); g.stroke();
    PAPT = new T3.CanvasTexture(c); PAPT.colorSpace = T3.SRGBColorSpace; PAPG = new T3.PlaneGeometry(0.46, 0.34); PAP = new T3.Mesh(PAPG, new T3.MeshLambertMaterial({ map: PAPT, side: T3.DoubleSide })); PAP.userData.fx = 1; PAP.visible = false; map.add(PAP); return PAP; }
  function paperFrame(dt) { const p = PAPER; if (p.fly <= 0) return; p.t += dt; const u = Math.min(1, p.t / 3.4), ez = 1 - (1 - u) * (1 - u); PAP.position.set(p.x0 + (p.x - p.x0) * ez + Math.sin(p.t * 3.1) * 1.1 * (1 - u), p.y0 + (p.y + 0.02 - p.y0) * u + Math.sin(p.t * 4.3) * 0.5 * (1 - u), p.z0 + (p.z - p.z0) * ez + Math.cos(p.t * 2.7) * 1.1 * (1 - u)); PAP.rotation.set(p.t * 2.2, p.t * 1.3, p.t * 3.1);
    if (u >= 1) { p.fly = 0; PAP.position.set(p.x, p.y + 0.02, p.z); PAP.rotation.set(-Math.PI / 2, 0, 0.4); p.h = map.interact.add({ kind: 'game', x: p.x, z: p.z, y: p.y, r: 1.9, label: '🗺 ' + (en() ? 'Pick up the blown paper' : '바람에 날아온 종이 줍기'), use: () => paperPick() }); } }
  function paperPick() { const p = PAPER; if (!p) return; paperGone(); A.GAME.use('road:paper'); mark(); A.rec('road', { k: 'paper', ok: 1 }); const T = A.treasure && A.treasure(); sfx('tick'); if (T) T.take(); }
  function paperGone() { const p = PAPER; if (!p) return; PAPER = null; if (p.h) p.h.remove(); if (PAP) PAP.visible = false; movP = 0; goalT = null; }

  // ───────── 위 가운데 줄(0.25초 칸에서만 글을 다시 씀) ─────────
  function goalNow(me) { const e = en();
    if (RACE) { const R = RACE; return '🚲 ' + (e ? 'Ring ' : '고리 ') + Math.min(R.i, R.c.rings.length) + '/' + R.c.rings.length + '  ⏱ ' + R.t.toFixed(1) + (e ? ' s' : '초') + (R.bike ? '' : (e ? ' (practice)' : ' (연습)')); }
    if (ACT) { const a = ACT, left = mmss(a.lim - a.el), w = a.w, dw = Math.round(Math.hypot(me.x - w.x, me.z - w.z));
      if (a.kind === 'hat') return a.carry ? '👒 ' + (e ? 'Bring the hat back to the worker (' + dw + ' m)' : '모자를 이웃께 가져다드려요 (' + dw + 'm)') + '  ⏱ ' + left : '👒 ' + (e ? 'Catch the rolling hat (E) ' : '굴러가는 모자를 잡아요 (E) ') + Math.round(Math.hypot(me.x - a.hx, me.z - a.hz)) + 'm  ⏱ ' + left;
      if (a.kind === 'pick') { const C = a.plan.crop, n = [0, 1, 2].filter(i => a.got & (1 << i)).length; if (n === 3) return C[0] + ' ' + (e ? 'Bring them back to the worker (' + dw + ' m)' : '이웃께 가져다드려요 (' + dw + 'm)') + '  ⏱ ' + left;
        let bd = 1e9, bx = 0, bz = 0; a.plan.sp.forEach((p, k) => { if (a.got & (1 << k)) return; const d = Math.hypot(p[0] - me.x, p[2] - me.z); if (d < bd) { bd = d; bx = p[0] - me.x; bz = p[2] - me.z; } });
        return C[0] + ' ' + n + '/3  ' + (e ? 'nearest: ' + DIRN[dir8(bearing(bx, bz))][1] + ' ' + Math.round(bd) + ' m' : '가까운 것은 ' + DIRN[dir8(bearing(bx, bz))][0] + '쪽 ' + Math.round(bd) + 'm') + '  ⏱ ' + left; }
      return null; }
    if (REQ) { const w = REQ.w, d = Math.round(Math.hypot(me.x - w.x, me.z - w.z)); return '🙋 ' + (e ? 'The ' + who(w) + ' worker is waving. Go and press E (' + d + ' m)' : who(w) + ' 일꾼이 손을 들었어요. 가서 E (' + d + 'm)'); }
    if (PAPER && PAPER.fly <= 0) { const d = Math.round(Math.hypot(me.x - PAPER.x, me.z - PAPER.z)); if (d < 50) return '🗺 ' + (e ? 'Pick up the paper that blew in (E) ' : '날아온 종이를 주워 봐요 (E) ') + d + 'm'; }
    if (!A.routeBusy()) for (const c of NEAR) { const r = c.rings[0], s = sOf(r, me), lat = Math.abs(-(me.x - r.x) * r.dz + (me.z - r.z) * r.dx); if (s < -1 && s > -45 && lat < 14) { const Q = S().ring[c.id];
      return '🚲 ' + (e ? 'Ring course: ride through the green ring to start. ' + MED[3].e + ' within ' + c.gold + ' s' : '고리 코스: 초록 고리를 자전거로 지나면 시작해요. ' + MED[3].e + ' ' + c.gold + '초 안') + (Q && Q.b ? (e ? ' (best ' + Q.b + ' s ' : ' (내 최고 ' + Q.b + '초 ') + (MED[Q.m] ? MED[Q.m].e : '') + ')' : ''); } }
    return null; }

  // ───────── 매 프레임 · 1초 칸 ─────────
  function tick(dt) { if (!built) return; const me = map.player.pos();
    if (RACE) raceFrame(dt, me); else if (NEAR.length && !ACT && !REQ && !A.busy()) startCheck(me);
    if (ACT) { if (!A.busy()) ACT.el += dt; if (ACT.kind === 'hat' && HAT) hatFrame(dt, me); }
    if (PAPER) paperFrame(dt);
    if ((q4 += dt) < 0.25) return; q4 = 0;
    if (ACT) { const a = ACT;
      if (a.kind === 'hat' && a.h && !a.carry) { const h = a.h.hot; h.x = a.hx; h.z = a.hz; h.y = a.hy; h.off = a.fly > 0; }
      const dw = Math.hypot(me.x - a.w.x, me.z - a.w.z); if (dw < 3.6 && ((a.kind === 'hat' && a.carry) || (a.kind === 'pick' && a.got === 7))) { actEnd(true); return; }
      if (a.el > a.lim) { actEnd(false, 'time'); return; } }
    const g = goalNow(me); if (g !== goalT) goalT = g; }
  function sec() { if (!A.on()) return; if (!built) { build(false); if (!built) return; } const me = map.player.pos(), mv = Math.hypot(me.x - lx, me.z - lz); lx = me.x; lz = me.z; nearSec(me);
    const m9 = A.GAME.S.min, dm = lastMin >= 0 && m9 > lastMin && m9 - lastMin < 6 ? m9 - lastMin : 0; lastMin = m9;
    if (RACE) { raceSec(me); return; }
    if (ACT) { if (A.away() || A.night()) actEnd(false, 'away'); return; }
    if (REQ) { REQ.t++; const w = REQ.w, d = Math.hypot(me.x - w.x, me.z - w.z); if (A.away() || A.night() || REQ.t > 50 || d > 120) { reqEnd(d > 120 || REQ.t > 50); movMin = 30; return; } if (!A.busy() && (REQ.bq += 1) >= 6 && d < 60) { REQ.bq = 0; A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, en() ? 'Excuse me! Can you help?' : '저기요! 잠깐 도와줄래요?'); } return; }
    if (PAPER) { PAPER.life++; if (PAPER.life > 120 || Math.hypot(me.x - PAPER.x, me.z - PAPER.z) > 100 || A.away()) paperGone(); return; }
    if (A.busy() || A.away() || A.inSchool(me.x, me.z)) return;
    const moving = mv > 1.2 && mv < 40; if (!moving) return; movMin += dm; movP += dm;
    if (!A.night() && movMin >= (A.story() ? 200 : 100) && A.GAME.uses('road:help') < 4) { if (!helpTry(me)) movMin -= 25; return; }
    if (movP >= 50 && !A.GAME.uses('road:paper')) { if (!paperTry(me)) movP -= 15; } }

  // ───────── 짓기 · 치우기 ─────────
  function abort() { if (RACE) { RACE = null; } if (ACT) { const a = ACT; ACT = null; const M = A.wkMesh(); if (M) { M.reset(a.i); if (M.hat) M.hat(a.i, true); } hotOff(a.w, false); if (a.h) a.h.remove(); if (a.hs) for (const h of a.hs) h.remove(); }
    if (REQ) reqEnd(true); if (PAPER) paperGone(); if (HAT) HAT.visible = false; if (ITEM) ITEM.visible = false; goalT = null; }
  // 셰이더 미리 짜기: 고리·모자·주울 것·종이를 처음 보일 때 새로 짜면 그 프레임이 늘어짐(town_check frames.worst +5~10ms) → 들어올 때 한 번(마을 warmGPU는 이 모듈 짓기 전에 돎)
  function warm() { const R9 = window.SD2 && window.SD2.renderer, root = A.root(), sc = root && root.parent; ringMesh(); if (root && !RING.parent) root.add(RING); if (!ITEM) itemBuild(); if (!PAP) papMake(); if (!HAT) hatBuild(0xe8d38a);
    if (!R9 || !R9.compile || !sc) return; try { for (const o of [RING, ITEM, PAP, HAT]) R9.compile(o, map.camera, sc); } catch (e) { /* 옛 three */ } }
  function init() { abort(); NEAR = []; ringKey = ''; built = false; CS = []; BQ = null; if (RING && RING.parent) RING.parent.remove(RING); if (RING) RING.visible = false; lastMin = -1; lx = lz = 1e9; warm(); }
  function dispose() { abort(); if (RING) { if (RING.parent) RING.parent.remove(RING); RGEO.dispose(); RMAT.dispose(); RING.dispose(); RING = null; }
    if (HAT) { map.remove(HAT); for (const m of HATG) { m.geometry.dispose(); m.material.dispose(); } HAT = null; HATG = []; } if (ITEM) { map.remove(ITEM); ITEM.geometry.dispose(); ITEM.material.dispose(); ITEM.dispose(); ITEM = null; }
    if (PAP) { map.remove(PAP); PAPG.dispose(); PAPT.dispose(); PAP.material.dispose(); PAP = null; } }
  // 시험(town_road.cjs)·문서용: 읽기 + 사건 바로 만들기
  function audit() { const out = []; for (const c of CS) { let blk = 0, off = 0, wet = 0, sch = 0, n = 0; const P = c.path; for (let i = 0; i < P.x.length; i++) { const x = P.x[i], z = P.z[i], y = A.gy(x, z); n++; if (A.blocked(x, z, y + 0.6)) blk++; if (!A.onLane(x, z)) off++; if (A.water(x, z)) wet++; if (A.inSchool(x, z)) sch++; }
      let clr = 0; for (const r of c.rings) if (!ringClear(r.x, r.z, r.y - RY, r.dx, r.dz)) clr++; out.push({ id: c.id, n, blk, off, wet, sch, ringBlk: clr }); } return out; }
  return { init, tick, sec, dispose, abort, get goal() { return goalT; }, get active() { return !!(RACE || ACT || REQ); },
    info: () => ({ built, buildMs, courses: CS.map(c => ({ id: c.id, k: c.k, n: c.rings.length, L: Math.round(c.L), gold: c.gold, silver: c.silver, place: c.place, cell: c.cell, rings: c.rings.map(r => [+r.x.toFixed(1), +r.y.toFixed(2), +r.z.toFixed(1), +r.dx.toFixed(3), +r.dz.toFixed(3)]) })), near: NEAR.map(c => c.k), drawn: RING ? RING.count : 0, ringVis: !!(RING && RING.visible),
      race: RACE && { k: RACE.c.k, i: RACE.i, t: +RACE.t.toFixed(1), bike: RACE.bike }, req: REQ && { kind: REQ.kind, i: REQ.i, t: REQ.t, x: REQ.w.x, z: REQ.w.z, g: REQ.w.g }, act: ACT && { kind: ACT.kind, el: +ACT.el.toFixed(1), lim: ACT.lim, carry: ACT.carry, got: ACT.got, hat: ACT.kind === 'hat' ? [+ACT.hx.toFixed(1), +ACT.hz.toFixed(1)] : null, fly: ACT.fly, sp: ACT.kind === 'pick' ? ACT.plan.sp.map(p => [+p[0].toFixed(1), +p[2].toFixed(1)]) : null, wx: ACT.w.x, wz: ACT.w.z, wg: ACT.w.g, i: ACT.i },
      paper: PAPER && { x: +PAPER.x.toFixed(1), z: +PAPER.z.toFixed(1), fly: PAPER.fly > 0, h: !!PAPER.h }, S: JSON.parse(JSON.stringify(S())), uses: { help: A.GAME.uses('road:help'), paper: A.GAME.uses('road:paper') }, mov: [movMin, movP], goal: goalT, dbg: DBG.slice() }),
    audit, dbg: { help: (kind, wi) => { const me = map.player.pos(); if (RACE || ACT || REQ) return false; return helpTry(me, kind, wi); }, offer: () => offer(), accept: () => { if (REQ) actStart(); return !!ACT; }, left: s => { if (ACT) ACT.el = Math.max(0, ACT.lim - s); }, paper: () => paperTry(map.player.pos(), true), fin: (k, t) => { const c = CS[k]; if (!c || RACE) return false; RACE = { c, i: c.rings.length, t, bike: true, lx: 0, lz: 0, ps: 0, walk: 0, off: false }; finish(); return true; },   /* 시험: 자전거 완주 하나를 바로(솜씨 하루 한도 확인) */ paperOk: () => paperOk(), build: () => { if (!built) build(true); nearSec(map.player.pos()); return CS.length; },
      path: (k, st = 3) => { const c = CS[k]; if (!c) return null; const o = []; for (let i = 0; i < c.path.x.length; i += st) o.push([+c.path.x[i].toFixed(1), +c.path.z[i].toFixed(1)]); return o; }, mov: (m, p) => { movMin = m; if (p != null) movP = p; } } };
}
