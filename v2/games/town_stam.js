// 탐험 체력(STAM-1 · 최종 차례 10번 줄 · 정본 docs/systems/town_stam.md): 헤엄(1칸 = 30m)·오르기(1칸 = 5m)에만 사다리 · 시작 3칸 → 9칸 · 칸 +1 = 그 단계 칸을 끝까지 다 써야 닿는 도장(평생 한 번 · rwCheck 밖)
//   다 써도 벌 X: 헤엄 = 누워 뜨기(생존수영) → 마지막 발판 쪽으로 떠밀림 → 10초 뒤 안전요원 배 → 모래사장 · 오르기 = 천천히 미끄러져 내려옴 · 비탈 달리기 = 걷기(사다리 밖)
//   바퀴 = 64px 세상 안 Sprite 하나(숫자·% X) · 하루 기력 X · 판타지 X · 새 사람 X(안전요원·강사 = 이미 있는 일꾼 자리를 옮김)
//   마을 쪽이 넘기는 것(A): map · T3 · GAME · lang() · say(t, s) · sfx(k) · SEAY() · gNat(x, z)(땅 높이 · 충돌 X) · seaSd · wAt · inWalk · inSchool · occHit · onRoad · bboxOf · rng0 · hashS
//     · 짓기 도우미 box · rock1 · rodQ · ballQ · bucket · rgb · signBoard · pcol · clearTrees · own(geo|mat) · root() · trail()(정상 등산로 점) · view()(전망대) · summit()
//     · swimming() · bike() · setBike(v) · busy() · night() · skUp · diary(t) · bubble(w, t) · workers() · stick() · umbOpen() · umbClose()
export const STAM_SW = 30, STAM_CL = 5, STAM_RUN = 10;   // 칸당 능력(헤엄 m · 오르기 m · 비탈 달리기 m)
const SWIM_SP = 2.3, CLIMB_SP = { chain: 0.9, rope: 0.8 }, FLOAT_SP = 0.6, BOAT_IN = 6, BOAT_OUT = 8, SLIDE_SP = 1.5, PUSH_SP = 0.8;
const INK = '#2f7d4a', EMPTY = '#d9d5cc', LOW = '#e0782a';   // 종이 교과서 결 초록 잉크 · 빈 칸 연회색 · 1칸 아래 주황
const T2 = (ko, en) => [ko, en];
const TXT = {
  swim1: T2('숨이 차면 누워서 떠요 — 이렇게요', 'If you run out of breath, float on your back — like this'),
  grow: T2('숨이 길어졌어요. 조금 더 멀리 갈 수 있어요.', 'Your breath got longer. You can go a little farther.'),
  float: T2('숨이 다 찼어요 — 누워서 떠요. 구조 요청은 손을 흔들어요', 'Out of breath — float on your back. Wave to ask for help'),
  boat: T2('안전요원 배가 와요 — 아무 키나 누르면 건너뛰어요', 'The lifeguard boat is coming — press any key to skip'),
  drop: T2('모래사장에 내려 주었어요. 숨을 고르면 다시 헤엄칠 수 있어요', 'Dropped off on the sand. Catch your breath and swim again'),
  slide: T2('손이 풀려 천천히 미끄러져 내려왔어요', 'Your hands got tired and you slid down slowly'),
  hold: T2('꼭 잡고 있어요', 'Hold on tight'),
  push: T2('부표 안에서만 헤엄쳐요', 'Swim only inside the buoys'),
  run0: T2('숨이 차요 — 걸으면 금방 돌아와요', 'Out of breath — walk and it comes back soon'),
  grab: T2('밧줄을 잡았어요 — W(위)를 누르고 있으면 올라가요', 'You grabbed the rope — hold W (up) to climb'),
  top: T2('끝까지 올랐어요!', 'You made it to the top!'),
  sign: T2('밧줄 길 — 꼭 잡고 천천히', 'Rope path — hold tight, go slowly'),
  coach: T2('바람자루가 날리는 쪽의 반대가 바람이 오는 쪽이에요. 바람을 마주 보고 달려요.', 'The wind comes from the side opposite to where the windsock points. Run facing the wind.'),
  coachHot: T2('🌬 강사에게 바람 묻기', '🌬 Ask the instructor about the wind'),
  first: T2('처음 비행은 뒷산 전망대 체험장에서 강사와 해요', 'Your first flight is at the lookout on the back mountain, with the instructor'),
  tail: T2('바람이 뒤에서 불어요 — 반대쪽 띠로 가 봐요', 'The wind is behind you — try the strip on the other side'),
  wing: T2('날개가 섰어요 — 띠 끝까지 달려요', 'The wing is up — run to the end of the strip'),
  fly: T2('떴어요! A·D로 돌고 S로 천천히', 'You are flying! A/D to turn, S to slow down'),
  land: T2('사뿐히 내렸어요', 'Soft landing'),
  noLand: T2('여기는 내릴 수 없는 곳이라 가까운 땅으로 미끄러져 내려와요', 'You cannot land here, so you slide down to nearby ground'),
  paraOk: T2('패러글라이딩 체험을 했어요', 'I tried paragliding'),
  pstrip: T2('패러글라이딩 출발 띠', 'Paragliding launch strip'),
  view9: T2('전망 바위', 'Lookout rock'),
  signC: T2('쇠사슬 길 — 꼭 잡고 천천히', 'Chain path — hold tight, go slowly'),
};
const PLACE = { R1: T2('바다 뗏목', 'the sea raft'), C1: T2('뒷산 밧줄 바위', 'the rope rock on the back mountain'), R2: T2('작은 바위섬', 'the little rock island'), C2: T2('산 중턱 바위벽', 'the rock wall halfway up the mountain'), R3: T2('등표 바위', 'the beacon rock'), C3: T2('정상 바위탑', 'the summit rock tower') };
const DIARY = { R1: T2('오늘 바다 뗏목까지 헤엄쳤어요', 'Today I swam to the sea raft'), C1: T2('오늘 뒷산 밧줄 바위를 끝까지 올랐어요', 'Today I climbed the rope rock to the top'), R2: T2('오늘 작은 바위섬까지 헤엄쳤어요', 'Today I swam to the little rock island'), C2: T2('오늘 산 중턱 바위벽을 끝까지 올랐어요', 'Today I climbed the rock wall halfway up the mountain'), R3: T2('오늘 등표 바위까지 헤엄쳤어요', 'Today I swam to the beacon rock'), C3: T2('오늘 정상 바위탑을 끝까지 올랐어요', 'Today I climbed the summit rock tower') };
const MAXN = 9;

export function createStam(A) {
  const map = A.map, T3 = A.T3, en = () => A.lang() === 'en', L = t => t[en() ? 1 : 0];
  const CFG = A.cfg && A.cfg();   // ourtown.js stam(✨) — 없으면 아무것도 안 생김(엔진 = 능력)
  const S = () => { const G = A.GAME.S; let s = G.stam; if (!s || s.v !== 1) s = G.stam = { v: 1, n: 3, got: {}, para: 0, fail: {}, said: {}, tip: {} }; s.got = s.got || {}; s.fail = s.fail || {}; s.said = s.said || {}; s.tip = s.tip || {}; return s; };
  const day = () => A.GAME.S.day || 0;
  // 몸 상태(저장 X — 새로 열면 다 찬 채로)
  const ST = { v: 3, mode: null, rest: 0, full: 0, lx: 0, ly: 0, lz: 0, has: false, last: null, runLock: false, sayT: 0, anim: 0, animK: 0, said1: 0 };
  let G = null;   // 지은 자료(헤엄 길·발판·오르기 길·도장)
  const nNow = () => Math.min(MAXN, Math.max(3, S().n | 0));
  // ───────── 헤엄 길(prep — 짓기 전 땅 단계 · prepSwim 끝에서 한 번) ─────────
  function prep(W) { if (ST.mode) end('rebuild'); if (ST.wing) wingShow(false); G = null; if (!CFG || !W || !CFG.swim) return;   /* 다시 짓기(계절·판 모습) = 붙든 몸 먼저 풂 */ const SEAY = A.SEAY(), cs = 2;
    let bx = 0, bz = 0, bn = 0; for (let j = 0; j < W.nz; j++) for (let i = 0; i < W.nx; i++) if (W.g[j * W.nx + i] === 1) { bx += W.x0 + (i + 0.5) * cs; bz += W.z0 + (j + 0.5) * cs; bn++; } if (!bn) return; bx /= bn; bz /= bn;
    let ox = A.seaSd(bx - 6, bz) - A.seaSd(bx + 6, bz), oz = A.seaSd(bx, bz - 6) - A.seaSd(bx, bz + 6); const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;   // 바다 쪽(물가 거리가 줄어드는 쪽)
    const CS = CFG.swim.map((c, ci) => { const a = (c.ang || 0) * Math.PI / 180, dx = ox * Math.cos(a) - oz * Math.sin(a), dz = ox * Math.sin(a) + oz * Math.cos(a); return { ...c, ci: ci + 1, dx, dz, L: (c.k - 0.4) * STAM_SW + 90 }; });
    let X0 = W.x0, Z0 = W.z0, X1 = W.x0 + W.nx * cs, Z1 = W.z0 + W.nz * cs; for (const c of CS) { const ex = bx + c.dx * c.L, ez = bz + c.dz * c.L; X0 = Math.min(X0, ex - 24); Z0 = Math.min(Z0, ez - 24); X1 = Math.max(X1, ex + 24); Z1 = Math.max(Z1, ez + 24); }
    X0 = W.x0 - Math.ceil((W.x0 - X0) / cs) * cs; Z0 = W.z0 - Math.ceil((W.z0 - Z0) / cs) * cs; const nx = Math.ceil((X1 - X0) / cs), nz = Math.ceil((Z1 - Z0) / cs), g = new Uint8Array(nx * nz), cid = new Uint8Array(nx * nz), di = Math.round((W.x0 - X0) / cs), dj = Math.round((W.z0 - Z0) / cs);
    for (let j = 0; j < W.nz; j++) for (let i = 0; i < W.nx; i++) g[(j + dj) * nx + i + di] = W.g[j * W.nx + i];
    const cx = i => X0 + (i + 0.5) * cs, cz = j => Z0 + (j + 0.5) * cs, gn = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) gn[j * nx + i] = A.gNat(cx(i), cz(j));
    const mark = (x, z, ci) => { const i = Math.floor((x - X0) / cs), j = Math.floor((z - Z0) / cs); if (i < 0 || j < 0 || i >= nx || j >= nz) return; const k = j * nx + i; if (g[k] === 0 && A.seaSd(x, z) < 1.5) { g[k] = 3; cid[k] = ci; } };
    const gAt9 = (x, z) => { const i = Math.floor((x - X0) / cs), j = Math.floor((z - Z0) / cs); return i < 0 || j < 0 || i >= nx || j >= nz ? 0 : g[j * nx + i]; };
    for (const c of CS) { let t0 = null; for (let t = 40; t >= -160; t -= 1) if (gAt9(bx + c.dx * t, bz + c.dz * t) === 1) { t0 = t; break; } if (t0 == null) { c.Lm = -1; continue; } c.t0 = t0;   /* 해수욕장 띠는 굽은 만(灣)이라 가운데가 띠 밖일 수 있음 → 띠 바깥 끝에서 줄을 냄 */
      let Lm = c.L; for (let t = t0 + 4; t < c.L; t += 1) { const x = bx + c.dx * t, z = bz + c.dz * t; if (A.seaSd(x, z) > -5) { Lm = t - 8; break; } } c.Lm = Lm; for (let t = t0 - 4; t < Lm; t += 1) for (let s = -6; s <= 6; s += 1) mark(bx + c.dx * t - c.dz * s, bz + c.dz * t + c.dx * s, c.ci); }
    const GRID = { g, cid, gn, x0: X0, z0: Z0, nx, nz, cs };
    const swimK = k => (g[k] === 1 || g[k] === 3) && gn[k] < SEAY - 0.45;
    const pads = [];
    const padHit = (P, x, z, m) => { const lx = (x - P.x) * P.ux + (z - P.z) * P.uz, lz = -(x - P.x) * P.uz + (z - P.z) * P.ux; return Math.abs(lx) <= P.hd + m && Math.abs(lz) <= P.hw + m; };
    const snap = (x, z) => Math.abs(x) >= Math.abs(z) ? [Math.sign(x) || 1, 0] : [0, Math.sign(z) || 1];   /* 충돌 상자 = 축 맞춘 네모(AABB) → 발판도 축에 맞춤 */
    const sizeOf = P => { const i0 = pads.indexOf(P); pads.splice(i0, 1); const F9 = field(); pads.splice(i0, 0, P); let m = 1e9; for (let a = -P.hd - 2.5; a <= P.hd + 2.5; a += 0.5) for (let b = -P.hw - 2.5; b <= P.hw + 2.5; b += 0.5) { if (Math.abs(a) < P.hd + 1.4 && Math.abs(b) < P.hw + 1.4) continue; m = Math.min(m, fAt(F9, P.x + P.ux * a - P.uz * b, P.z + P.uz * a + P.ux * b)); } return m; };
    const field = (only) => { const F = new Float64Array(nx * nz).fill(1e9), H = [];   /* only = 이 발판에서만 출발(시험 짝 거리 · null = 물가 + 모든 발판 · 'shore' = 물가만) */ const push = (k, d) => { if (d >= F[k]) return; F[k] = d; H.push([d, k]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
      const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!swimK(k) || pads.some(P => padHit(P, cx(i), cz(j), 0.6))) continue; let src = false;
        for (let b = -1; b <= 1 && !src; b++) for (let a = -1; a <= 1 && !src; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const q = jj * nx + ii; if (!swimK(q) && (g[q] === 1 || g[q] === 3 || gn[q] >= SEAY - 0.45)) src = true; }
        if (only) src = only === 'shore' ? src : false; if (!src && pads.some(P => (!only || only === P) && only !== 'shore' && padHit(P, cx(i), cz(j), 2.2))) src = true; if (src) push(k, 1.0); }
      const NB = []; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { if (!a && !b) continue; if (Math.abs(a) === 2 && Math.abs(b) === 2) continue; if ((Math.abs(a) === 2 || Math.abs(b) === 2) && (a % 2 === 0 && b % 2 === 0)) continue; NB.push([a, b, Math.hypot(a, b) * cs]); }   /* 16 이웃(아는 말 걸음까지) */
      while (H.length) { const [d, k] = pop(); if (d > F[k]) continue; const i = k % nx, j = (k / nx) | 0; for (const [a, b, w] of NB) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const q = jj * nx + ii; if (!swimK(q) || pads.some(P => padHit(P, cx(ii), cz(jj), 0.6))) continue; if (Math.abs(a) === 2 || Math.abs(b) === 2) { const mk = (j + Math.round(b / 2)) * nx + i + Math.round(a / 2); if (!swimK(mk)) continue; } push(q, d + w); } }
      return F; };
    const fAt = (F, x, z) => { const i = Math.floor((x - X0) / cs), j = Math.floor((z - Z0) / cs); return i < 0 || j < 0 || i >= nx || j >= nz ? 1e9 : F[j * nx + i]; };
    let F0 = null; for (const c of CS) { const F = field(); if (!F0) F0 = F; const need = (c.k - 0.4) * STAM_SW, hd = c.kind === 'raft' ? 2.5 : 3.5, hw = c.kind === 'raft' ? 2.5 : 4.0; let tE = -1;
      for (let t = (c.t0 ?? 0) - 4; t < c.Lm - 12; t += 0.5) { const x = bx + c.dx * t, z = bz + c.dz * t; const f9 = fAt(F, x, z); if (f9 >= need && f9 < 1e8) { tE = t; break; } } if (tE < 0) continue;
      const [ax, az] = snap(c.dx, c.dz); let tc = tE + 1.0 + hd; const P = { id: c.id, k: c.k, kind: c.kind || 'rock', ci: c.ci, x: bx + c.dx * tc, z: bz + c.dz * tc, ux: ax, uz: az, hd, hw, ex: bx + c.dx * tE, ez: bz + c.dz * tE, need, tE };
      pads.push(P); for (let it = 0; it < 4; it++) { const sz9 = sizeOf(P); if (Math.abs(sz9 - need) < 0.6) break; tc += (need - sz9) * 0.9; P.x = bx + c.dx * tc; P.z = bz + c.dz * tc; } P.tc = tc; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (cid[k] !== c.ci) continue; const x = cx(i), z = cz(j), t = (x - bx) * c.dx + (z - bz) * c.dz; if (t > tc + hd + 8) { g[k] = 0; cid[k] = 0; } }
      for (let a = -hd - 9; a <= hd + 9; a += 1) for (let b = -hw - 9; b <= hw + 9; b += 1) mark(P.x + P.ux * a - P.uz * b, P.z + P.uz * a + P.ux * b, c.ci); }
    for (let it = 0; it < 2; it++) { const fill = []; for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; if (g[k] || A.seaSd(cx(i), cz(j)) > 1.5) continue; let n = 0, c0 = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { if (!a && !b) continue; const q = (j + b) * nx + i + a; if (g[q] === 1 || g[q] === 3) { n++; if (cid[q]) c0 = cid[q]; } } if (n >= 5) fill.push([k, c0]); } for (const [k, c0] of fill) { g[k] = 3; cid[k] = c0; } }   /* STAM-1 고침: 해수욕장 띠와 부표 줄이 비스듬히 만나는 곳의 한 칸 틈(물인데 줄 밖) = 메움 — 띠 가장자리를 따라 헤엄치다 틈에서 떠밀리던 것(R3 칸 6) */
    void padHit;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (g[k] || A.seaSd(cx(i), cz(j)) > 1.5) continue; let near = false; for (let b = -3; b <= 3 && !near; b++) for (let a = -3; a <= 3 && !near; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const q = jj * nx + ii; if (g[q] === 1 || g[q] === 3) near = true; } if (near) g[k] = 2; }   /* 부표 밖 6m = 바닥만 받침(떠밀어 되돌리는 띠) */
    const Ff = field(); for (const P of pads) P.size = +sizeOf(P).toFixed(1);
    W.g = g; W.x0 = X0; W.z0 = Z0; W.nx = nx; W.nz = nz; W.cid = cid; W.buoys = W.buoys.filter(([x, z]) => { const i = Math.floor((x - X0) / cs), j = Math.floor((z - Z0) / cs); let c3 = false; for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && g[jj * nx + ii] === 3) c3 = true; } return !c3; });
    const ringMin = (F9, P) => { let m = 1e9; for (let a = -P.hd - 2.5; a <= P.hd + 2.5; a += 0.5) for (let b = -P.hw - 2.5; b <= P.hw + 2.5; b += 0.5) { if (Math.abs(a) < P.hd + 1.4 && Math.abs(b) < P.hw + 1.4) continue; m = Math.min(m, fAt(F9, P.x + P.ux * a - P.uz * b, P.z + P.uz * a + P.ux * b)); } return m; };
    const pairs = () => { const out = {}; const Fs = field('shore'); for (const P of pads) out['shore>' + P.id] = +ringMin(Fs, P).toFixed(1); for (const Q of pads) { const Fq = field(Q); for (const P of pads) if (P !== Q) out[Q.id + '>' + P.id] = +ringMin(Fq, P).toFixed(1); } return out; };   /* 시험 A: 물가·발판 → 발판 헤엄 거리 */
    G = { W, GRID, pads, CS, bx, bz, ox, oz, F: Ff, F0, f0At: (x, z) => fAt(F0, x, z), pairs, fAt: (x, z) => fAt(Ff, x, z), climbs: [], stamps: [], guard: W.guard }; }
  // ───────── 짓기(정적 상자 = 청크 병합 · 감사 받음) ─────────
  function build(group) { if (!G || !CFG) return; const SEAY = A.SEAY(), Bk = A.bucket;
    for (const c of G.CS) { const P = G.pads.find(q => q.ci === c.ci), tEnd = P ? P.tE + 1 + P.hd * 2 + 6 : 0; if (!P) continue;   /* 부표 줄(그 단계 목표까지 · 양옆 6m) */
      for (const s of [-6.5, 6.5]) { let last = null; for (let t = (c.t0 ?? 0) + 2; t <= tEnd; t += 4) { if (cellAt(G.bx + c.dx * t - c.dz * s, G.bz + c.dz * t + c.dx * s) === 1) { last = null; continue; } const x = G.bx + c.dx * t - c.dz * s, z = G.bz + c.dz * t + c.dx * s; if (A.seaSd(x, z) > -1 || (P && Math.abs((x - P.x) * P.ux + (z - P.z) * P.uz) < P.hd + 3 && Math.abs(-(x - P.x) * P.uz + (z - P.z) * P.ux) < P.hw + 2)) { last = null; continue; } const B = Bk(x, z); A.ballQ(B, [x, SEAY + 0.05, z], 0.3, A.rgb(c.ci === 1 ? 0xf2c230 : c.ci === 2 ? 0xe0453a : 0xf4f2ea), 1, 0.8, 1, 7); if (last) A.rodQ(B, [last[0], SEAY + 0.12, last[1]], [x, SEAY + 0.12, z], 0.02, A.rgb(0xf4f2ea)); last = [x, z]; } } }
    for (const P of G.pads) { const ry = Math.atan2(P.ux, P.uz), Q = (a, b) => [P.x + P.ux * a - P.uz * b, P.z + P.uz * a + P.ux * b];   /* 발판: 뗏목(나무 갑판 · 기둥 깃발) · 바위섬(넓적 바위 + 둘레 바위) · 앞쪽에 물속 디딤(0.5m씩 두 번) */
      const top = SEAY + 0.2, sx = P.hw * 2, sz = P.hd * 2, [stx, stz] = Q(-P.hd - 0.8, 0);
      if (P.kind === 'raft') { A.box(P.x, SEAY - 0.3, P.z, sx, 0.5, sz, ry, 0xb98a55, { top: 0xc99a62 }); for (const [a, b] of [[-P.hd + 0.4, -P.hw + 0.4], [P.hd - 0.4, -P.hw + 0.4], [P.hd - 0.4, P.hw - 0.4], [-P.hd + 0.4, P.hw - 0.4]]) { const [x, z] = Q(a, b); A.box(x, SEAY - 0.7, z, 0.6, 0.4, 0.6, ry, 0x3f6d8c); } }
      else { A.box(P.x, SEAY - 1.6, P.z, sx, 1.8, sz, ry, 0x8f8a7c, { top: 0x9d978a }); const R = A.rng0(A.hashS('stam' + P.id)); for (const [a, b] of [[P.hd * 0.55, P.hw * 0.7], [P.hd * 0.6, -P.hw * 0.75], [-P.hd * 0.1, P.hw * 0.85]]) { const [x, z] = Q(a, b); A.rock1(x, top - 0.4, z, 1.1 + R() * 0.5, R, 0x8a8478); }
        if (P.kind === 'beacon') { const [bx9, bz9] = Q(-P.hd * 0.35, P.hw * 0.4); for (let k = 0; k < 4; k++) A.box(bx9, top + k * 1.1, bz9, 0.7, 1.1, 0.7, 0, k % 2 ? 0xe0453a : 0x2b2b2b); A.box(bx9, top + 4.4, bz9, 0.95, 0.5, 0.95, 0, 0x2b2b2b); A.pcol(bx9, bz9, 0.35, 0.35, 0, top, top + 4.9); } }   /* 등표(바다 위 위험 표지 · 검정·빨강 띠) */
      A.box(stx, SEAY - 0.8, stz, 1.2, 0.5, 1.6, ry, P.kind === 'raft' ? 0x9a6b3e : 0x7f7a6e, { top: P.kind === 'raft' ? 0xb98a55 : 0x8f8a7c });
      A.pcol(P.x, P.z, P.hw, P.hd, ry, SEAY - 2, top); A.pcol(stx, stz, 0.6, 0.8, ry, SEAY - 2, SEAY - 0.3);
      const [fx, fz] = Q(P.hd * 0.4, -P.hw * 0.55); A.box(fx, top, fz, 0.12, 3.4, 0.12, ry, 0xe8e4da); A.box(fx - P.uz * 0.54, top + 2.6, fz + P.ux * 0.54, 0.06, 0.62, 0.95, ry + Math.PI / 2, P.ci === 1 ? 0xf2c230 : P.ci === 2 ? 0xe0453a : 0x2f6b9a, { B: Bk(fx, fz) });   /* 깃발(모래사장에서 보이는 단서) */
      A.pcol(fx, fz, 0.1, 0.1, ry, top, top + 3.4); stampBox(fx, fz, top, ry, P); }
    climbBuild(); launchBuild(); }
  function stampBox(x, z, y, ry, P) { const Q = (a, b) => [x + Math.cos(ry) * a + Math.sin(ry) * b, z - Math.sin(ry) * a + Math.cos(ry) * b], [sx9, sz9] = Q(0.0, 0.7); A.box(sx9, y, sz9, 0.14, 1.05, 0.14, ry, 0x6b4a2f); A.box(sx9, y + 1.05, sz9, 0.42, 0.3, 0.32, ry, 0xc8452f, { top: 0xd65a3e });   /* 등산로 스탬프 함 모양(빨간 함 · 기둥) */
    A.pcol(sx9, sz9, 0.22, 0.18, ry, y, y + 1.35); G.stamps.push({ id: P.id, k: P.k, x: sx9, z: sz9, y, cx: P.cx ?? P.x, cz: P.cz ?? P.z, r: P.r ?? Math.hypot(P.hd, P.hw) + 0.4 }); }   /* 발판·꼭대기 위 어디든 1초 서 있으면 꾹(그 자리는 사다리로만 닿음) */
  // ───────── 오르기 길(표시 있는 바위벽만 · 밧줄·쇠사슬) ─────────
  //   자리 찾기: 기준점(전망대·등산로 높이·정상) 둘레를 돌며 — 밑동이 걸어 닿는 평지 · 길·집·물 아님 · 둘레 50m 안 걸어 닿는 땅이 꼭대기보다 낮음(우산·점프로 못 감)
  function climbBuild() { if (!CFG.climb) return; G.climbs.length = 0;
    for (const c of CFG.climb) { const ats = (typeof c.at === 'number' ? [0, 15, -15, 30, -30, 45, -45, 60].map(d => anchorOf(c.at + d)) : [anchorOf(c.at)]).filter(Boolean); if (!ats.length) continue; const H1 = (c.k - 0.4) * STAM_CL, tiers = c.tiers || 1, Ht = H1 * tiers, fw = c.w || 8, fd = c.d || 7; let best = null;   /* 등산로 높이 기준이면 그 높이 ±60m 안에서 차례로 */
      for (const at of ats) for (let r = c.r0 || 18; r <= (c.r1 || 110) && !best; r += 6) for (let i = 0; i < 24 && !best; i++) for (let ro = 0; ro < 4 && !best; ro++) { const a = i / 24 * 6.2832 + r * 0.37, x = at[0] + Math.cos(a) * r, z = at[1] + Math.sin(a) * r, ry = Math.round(Math.atan2(at[0] - x, at[1] - z) / (Math.PI / 2) + ro) * (Math.PI / 2);   /* 앞면(길) = 기준점 쪽부터 네 방향 */
        const Q = (u, v) => [x + Math.cos(ry) * u + Math.sin(ry) * v, z - Math.sin(ry) * u + Math.cos(ry) * v]; const C4 = [[-fw / 2, -fd / 2], [fw / 2, -fd / 2], [fw / 2, fd / 2], [-fw / 2, fd / 2]].map(([u, v]) => Q(u, v)), hs = C4.map(([qx, qz]) => A.gNat(qx, qz)), yl = Math.min(...hs), y9 = Math.max(...hs);
        const DB = G.cdb || (G.cdb = {}), db = k9 => { DB[c.id + ':' + k9] = (DB[c.id + ':' + k9] || 0) + 1; }; if (y9 - yl > (c.slope || 2.5)) { db('slope'); continue; } const BX = (c.bases || [0]).map(u => Q(u, fd / 2 + 0.45)), BY = BX.map(([qx, qz]) => A.gNat(qx, qz)), y0 = Math.max(...BY); if (BX.some(([qx, qz]) => !okBase(qx, qz)) || Math.max(...BY) - Math.min(...BY) > 0.3 || y0 - yl > (c.slope || 2.0)) { db('base'); continue; }   /* 밑동 = 밧줄 앞 서는 자리 땅 높이(오르기 높이의 기준) */ if (C4.some(([qx, qz]) => !A.inWalk(qx, qz) || A.onRoad(qx, qz, 2) || A.wAt(qx, qz)) || A.occHit(x - fw, z - fw, x + fw, z + fw)) { db('foot'); continue; }
        const top = y0 + H1; let hi = -1e9; for (let rr = 6; rr <= 54; rr += 3) for (let k = 0; k < 20; k++) { const qx = x + Math.cos(k / 20 * 6.2832) * (rr + fw / 2), qz = z + Math.sin(k / 20 * 6.2832) * (rr + fw / 2); if (A.inWalk(qx, qz)) hi = Math.max(hi, A.gNat(qx, qz)); } if (hi > top - 2.5) { db('hi'); continue; }
        best = { x, z, ry, y0, yl, Q, fw, fd }; }
      if (!best) { G.miss = (G.miss || []).concat(c.id); continue; }
      const { x, z, ry, y0, yl, Q } = best, gy = yl - 1.2, R = A.rng0(A.hashS('stamc' + c.id)); A.clearTrees(x, z, Math.max(fw, fd) + 4);
      A.box(x, gy, z, fw, y0 + H1 - gy, fd, ry, 0xa39d90, { top: 0xaea898 }); A.pcol(x, z, fw / 2, fd / 2, ry, gy, y0 + H1);
      for (let yb = y0 + 2.6, n9 = 0; yb < y0 + H1 - 1.6; yb += 3.4 + R() * 1.6, n9++) A.box(x, yb, z, fw + 0.16, 0.45 + R() * 0.5, fd + 0.16, ry, [0x8f8a7c, 0xb3ac9c, 0x857f72][n9 % 3]);   /* 바위 결(층 띠 · 5cm 내밂) */
      if (tiers === 1 && !c.flat) for (const [u, v] of [[fw / 2 - 1.3, fd / 2 - 1.4], [fw / 2 - 1.0, -fd / 2 + 1.2]]) { const [qx, qz] = Q(u, v); A.rock1(qx, y0 + H1 - 0.35, qz, 0.9 + R() * 0.4, R, 0x9a9486); }   /* 꼭대기 어깨 바위(밧줄·도장함 반대쪽 · 출발대 얹는 바위는 평평하게) */
      const fx = Math.sin(ry), fz = Math.cos(ry);   /* 앞면 바깥 = (sin ry, cos ry) */
      const addRoute = (u, kind, yb, yt, off, onLedge) => { const fu = [fx, fz], [wx, wz] = Q(u, off), bx9 = wx + fu[0] * 0.45, bz9 = wz + fu[1] * 0.45, inn = 1.4, tx = wx - fu[0] * inn, tz = wz - fu[1] * inn;
        const r9 = { id: c.id, k: c.k, kind, bx: bx9, bz: bz9, y0: yb, y1: yt, nx: fu[0], nz: fu[1], tx, tz, sp: CLIMB_SP[kind], wx, wz, ledge: !!onLedge }; G.climbs.push(r9);
        if (kind === 'rope') { A.rodQ(A.bucket(wx, wz), [wx + fu[0] * 0.12, yb + 0.2, wz + fu[1] * 0.12], [wx + fu[0] * 0.12, yt + 0.3, wz + fu[1] * 0.12], 0.035, A.rgb(0xc9a46a)); for (let y = yb + 1.2; y < yt; y += 1.6) A.rodQ(A.bucket(wx, wz), [wx + fu[0] * 0.04 - fu[1] * 0.18, y, wz + fu[1] * 0.04 + fu[0] * 0.18], [wx + fu[0] * 0.2 + fu[1] * 0.18, y + 0.05, wz + fu[1] * 0.2 - fu[0] * 0.18], 0.04, A.rgb(0x6b4a2f)); }   /* 밧줄 + 발 디딤 막대 */
        else { for (let y = yb + 0.2; y < yt + 0.2; y += 0.34) { const o9 = ((Math.round((y - yb) / 0.34)) % 2) ? 0.05 : -0.05; A.rodQ(A.bucket(wx, wz), [wx + fu[0] * 0.1 + fu[1] * o9, y, wz + fu[1] * 0.1 - fu[0] * o9], [wx + fu[0] * 0.1 - fu[1] * o9, y + 0.3, wz + fu[1] * 0.1 + fu[0] * o9], 0.028, A.rgb(0x8d939a)); } for (let y = yb + 1.0; y < yt; y += 2.2) A.box(wx + fu[0] * 0.15, y, wz + fu[1] * 0.15, 0.5, 0.06, 0.16, ry, 0x7a8087); }   /* 쇠사슬 고리 + 쇠 발판 */
        const sgx = bx9 + fu[0] * (onLedge ? 0.6 : 1.4) - fu[1] * 1.3, sgz = bz9 + fu[1] * (onLedge ? 0.6 : 1.4) + fu[0] * 1.3; A.signBoard(null, sgx, sgz, Math.atan2(fu[0], fu[1]), L(kind === 'rope' ? TXT.sign : TXT.signC), { w: 1.9, h: 0.55, y: 1.0, y0: onLedge ? yb : A.gNat(sgx, sgz), bg: 0x2f6b3a, bgc: '#2f6b3a', fg: '#fff7e0' }); return r9; };
      if (tiers === 1) { addRoute(0, c.kind || 'rope', y0, y0 + H1, fd / 2); const [sx9, sz9] = Q(-fw / 2 + 1.1, -fd / 2 + 1.1); stampBox(sx9, sz9, y0 + H1, ry, { id: c.id, k: c.k, cx: x, cz: z, r: Math.hypot(fw, fd) / 2 + 0.3 }); }
      else {   /* 갈래 둘(6단계 중턱 바위벽): 곧은 쇠사슬 = 한 번에 턱까지 · 턱 있는 밧줄 길 = 턱까지 오르고 쉰 뒤 다시 위 전망 바위까지(돌아가는 길 · 구경) — 두 길 모두 6칸 */
        const ld = c.ledge || 4.5, fw2 = fw - 2.4, fd2 = fd - ld - 0.3, [c2x, c2z] = Q(0, (0.3 - ld) / 2), top2 = y0 + 2 * H1;
        A.box(c2x, y0 + H1, c2z, fw2, H1, fd2, ry, 0x9a948a, { top: 0xaea898 }); A.pcol(c2x, c2z, fw2 / 2, fd2 / 2, ry, y0 + H1, top2);
        for (let yb = y0 + H1 + 3.0, n9 = 0; yb < top2 - 1.6; yb += 3.6 + R() * 1.4, n9++) A.box(c2x, yb, c2z, fw2 + 0.16, 0.45 + R() * 0.5, fd2 + 0.16, ry, [0x857f72, 0xb3ac9c, 0x8f8a7c][n9 % 3]);
        addRoute(-fw / 4, 'chain', y0, y0 + H1, fd / 2); addRoute(fw / 4, 'rope', y0, y0 + H1, fd / 2); addRoute(fw / 4 - 0.4, 'rope', y0 + H1, top2, fd / 2 - ld, true);
        const [sx9, sz9] = Q(-fw / 2 + 0.9, fd / 2 - 0.9); stampBox(sx9, sz9, y0 + H1, ry, { id: c.id, k: c.k, cx: Q(0, fd / 2 - ld / 2)[0], cz: Q(0, fd / 2 - ld / 2)[1], r: fw / 2 + 0.2 });
        const [vx9, vz9] = Q(-fw2 / 2 + 1.4, (0.3 - ld) / 2); A.signBoard(null, vx9, vz9, ry, L(TXT.view9), { w: 1.6, h: 0.5, y: 0.9, y0: top2, bg: 0x2f6b3a, bgc: '#2f6b3a', fg: '#fff7e0' }); G.views = (G.views || []).concat([{ id: c.id, x: c2x, z: c2z, y: top2 }]); }
      for (const [u, v] of [[-fw / 2 - 0.6, -fd / 4], [fw / 2 + 0.7, -fd / 3]]) { const [qx, qz] = Q(u, v); A.rock1(qx, A.gNat(qx, qz) - 0.4, qz, 1.0 + R() * 0.6, R, 0x857f72); }   /* 밑동 바위(옆·뒤 · 길 쪽은 비움) */
      const cr = Math.abs(Math.cos(ry)), sr = Math.abs(Math.sin(ry)); G.rocks = (G.rocks || []).concat([{ id: c.id, x, z, ry, hw: fw / 2, hd: fd / 2, hx: cr * fw / 2 + sr * fd / 2, hz: sr * fw / 2 + cr * fd / 2, top: y0 + Ht, y0, ledge: tiers > 1 ? y0 + H1 : null }]); } }
  function anchorOf(k) { if (k === 'view') return A.view(); if (k === 'summit') return A.summit(); if (typeof k === 'number') { const P = A.trail(); if (!P) return null; let best = null, bd = 1e9; for (let i = 0; i < P.length - 1; i++) for (let t = 0; t <= 1; t += 0.1) { const x = P[i][0] + (P[i + 1][0] - P[i][0]) * t, z = P[i][1] + (P[i + 1][1] - P[i][1]) * t, d = Math.abs(A.gNat(x, z) - (A.TY() + k)); if (d < bd) { bd = d; best = [x, z]; } } return best; } return null; }
  function okBase(x, z) { return A.inWalk(x, z) && !A.onRoad(x, z, 1.2) && !A.wAt(x, z) && !A.inSchool(x, z) && !A.occHit(x - 1, z - 1, x + 1, z + 1); }
  // ───────── 패러글라이딩 출발대(GLIDE-1 · 곳마다 서로 반대쪽을 보는 띠 둘 → 어떤 바람에도 한쪽은 늘 열림) ─────────
  //   띠 = 길이 6 · 폭 2.4 · 땅에서 0.15 위 평평한 나무 판(앞 끝이 내리막 위로 나옴) · 충돌 상자가 축 네모라 띠도 동서·남북 둘 중 내리막이 더 트인 쪽
  const SW9 = [];   /* 바람자루(1초 칸에서 바람 쪽으로) */
  function launchBuild() { G.launch = []; SW9.length = 0; if (!CFG.pads) { sockMesh(); return; }
    for (const c of CFG.pads) { const onRock = c.at === 'rock' ? (G.rocks || []).find(r => r.id === c.rock) : null; if (c.at === 'rock' && !onRock) continue; const at = onRock ? [onRock.x, onRock.z] : anchorOf(c.at); if (!at) continue; let best = null;
      const tryAt = (x, z, y0) => { let bq = -1e9, bt = 0; for (const th of [0, Math.PI / 2]) { const q = [th, th + Math.PI].map(t9 => { const dx = Math.round(Math.sin(t9)), dz = Math.round(Math.cos(t9)); if (onRock) return (dx ? onRock.hx : onRock.hz) >= 6.7 ? 99 : -1e9;
          for (let t = 0.6; t <= 6.6; t += 1) { const qx = x + dx * t, qz = z + dz * t, gx = A.gNat(qx, qz); if (gx > y0 + 0.05 || gx < y0 - 3.5 || A.onRoad(qx, qz, 1.2) || A.wAt(qx, qz) || A.occHit(qx - 1.2, qz - 1.2, qx + 1.2, qz + 1.2)) return -1e9; }
          let hi = -1e9; for (let t = 8; t <= 50; t += 3) hi = Math.max(hi, A.gNat(x + dx * t, z + dz * t)); return y0 - hi; }); const m9 = Math.min(q[0], q[1]); if (m9 > bq) { bq = m9; bt = th; } } return [bq, bt]; };
      if (onRock) { const y0 = onRock.top + 0.12, [q9, th] = tryAt(at[0], at[1], y0); if (q9 > 0) best = { x: at[0], z: at[1], y: y0, th, q: q9 }; }
      else for (let r = c.r0 || 6; r <= (c.r1 || 60) && !best; r += 3) for (let i = 0; i < 16 && !best; i++) { const a = i / 16 * 6.2832 + r * 0.21, x = at[0] + Math.cos(a) * r, z = at[1] + Math.sin(a) * r; if (!okBase(x, z) || A.occHit(x - 3, z - 3, x + 3, z + 3) || (G.rocks || []).some(R9 => Math.hypot(R9.x - x, R9.z - z) < 16)) continue; const y0 = A.gNat(x, z) + 0.15, [q9, th] = tryAt(x, z, y0); if (q9 > 1.5) best = { x, z, y: y0, th, q: q9 }; }
      if (!best && !onRock) { let bs = -1e9; for (let r = c.r0 || 6; r <= (c.r1 || 45); r += 3) for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 + r * 0.21, x = at[0] + Math.cos(a) * r, z = at[1] + Math.sin(a) * r; if (!okBase(x, z) || A.occHit(x - 8, z - 8, x + 8, z + 8) || (G.rocks || []).some(R9 => Math.hypot(R9.x - x, R9.z - z) < 18)) continue;   /* 꼭대기가 아니면(한쪽이 오르막) = 이륙 데크(나무 다리 위 띠 둘 · 계단) — 오르막 쪽 띠도 땅보다 높아 늘 뜰 수 있음 · 내리막 쪽 활공 길이 가장 긴 자리 */
          for (const th of [0, Math.PI / 2]) { const dx = Math.round(Math.sin(th)), dz = Math.round(Math.cos(th)); let hiS = -1e9, okS = true; for (let t = -6.8; t <= 6.8; t += 0.8) { const qx = x + dx * t, qz = z + dz * t; hiS = Math.max(hiS, A.gNat(qx, qz), A.gNat(qx - dz * 1.3, qz + dx * 1.3), A.gNat(qx + dz * 1.3, qz - dx * 1.3)); if (A.onRoad(qx, qz, 1.5) || A.wAt(qx, qz) || A.occHit(qx - 1.3, qz - 1.3, qx + 1.3, qz + 1.3)) okS = false; } if (!okS) continue;
            const y0 = hiS + 4.5, clr = [1, -1].map(sg => { let m = 1e9; for (let t = 8; t <= 160; t += 4) m = Math.min(m, y0 - 0.29 * t - A.gNat(x + dx * sg * t, z + dz * sg * t)); return m; }), up = [1, -1].map(sg => y0 - A.gNat(x + dx * sg * 10, z + dz * sg * 10)); if (Math.min(up[0], up[1]) < -1.5) continue;
            const sx0 = x - dz * 2.2, sz0 = z + dx * 2.2, gS = A.gNat(sx0 - dz * 6.5, sz0 + dx * 6.5); if (!okBase(sx0 - dz * 7.2, sz0 + dx * 7.2) || y0 - gS > 7.5 || y0 - gS < 2) continue; const sc = Math.max(clr[0], clr[1]); if (sc > bs) { bs = sc; best = { x, z, y: y0, th, q: +sc.toFixed(1), deck: true }; } } } }
      if (!best) { G.miss = (G.miss || []).concat(c.id); continue; }
      A.clearTrees(best.x, best.z, 10); const pd = { id: c.id, x: best.x, z: best.z, y: best.y, coach: !!c.coach, strips: [], rock: onRock ? onRock.id : null, q: +best.q.toFixed(1) }, wood = 0xb98a55, yd = best.y;
      for (const th of [best.th, best.th + Math.PI]) { const dx = Math.round(Math.sin(th)), dz = Math.round(Math.cos(th)), cx = best.x + dx * 3.6, cz = best.z + dz * 3.6, sx = dx ? 6 : 2.4, sz = dx ? 2.4 : 6;
        A.box(cx, yd - 0.12, cz, sx, 0.12, sz, 0, onRock ? 0x9a6b3e : wood, { top: onRock ? 0xb07a48 : 0xc99a62 }); A.pcol(cx, cz, sx / 2, sz / 2, 0, yd - 1.5, yd);
        if (!onRock) for (const [u, v] of [[-2.6, -1.0], [-2.6, 1.0], [2.6, -1.0], [2.6, 1.0]]) { const lx = cx + (dx ? u : v), lz = cz + (dx ? v : u), gl = A.gNat(lx, lz); if (yd - 0.12 - gl > 0.2) { A.box(lx, gl - 0.3, lz, 0.22, yd - 0.12 - gl + 0.3, 0.22, 0, 0x6b4a2f); A.pcol(lx, lz, 0.11, 0.11, 0, gl - 0.3, yd - 0.12); } }
        for (let k = 0; k < 3; k++) { const t = 1.8 + k * 2.0, mx = best.x + dx * t, mz = best.z + dz * t; A.box(mx, yd, mz, dx ? 0.5 : 2.0, 0.02, dx ? 2.0 : 0.5, 0, 0xf2f0e6); }   /* 흰 달리기 줄 */
        pd.strips.push({ a: Math.atan2(dx, dz), dx, dz, cx, cz, y: yd, len: 6, hw: 1.2, bx: best.x + dx * 0.6, bz: best.z + dz * 0.6 }); }
      const s0 = pd.strips[0], px = -s0.dz, pz = s0.dx; pd.cx = best.x + px * 2.4; pd.cz = best.z + pz * 2.4; pd.cry = Math.atan2(s0.dx, s0.dz);
      if (best.deck) { A.box(best.x, yd - 0.12, best.z, s0.dx ? 1.2 : 2.4, 0.12, s0.dx ? 2.4 : 1.2, 0, wood, { top: 0xc99a62 }); A.pcol(best.x, best.z, s0.dx ? 0.6 : 1.2, s0.dx ? 1.2 : 0.6, 0, yd - 1.5, yd);   /* 데크 가운데 칸 + 옆으로 내려가는 계단(0.3m씩 · 땅까지 꽉 찬 단) */
        const sx0 = best.x + px * 1.2, sz0 = best.z + pz * 1.2; let n9 = 0; for (let k = 0; k < 40; k++) { const t = 0.21 + k * 0.42, qx = sx0 + px * t, qz = sz0 + pz * t, g9 = A.gNat(qx, qz), y1 = yd - (k + 1) * 0.3; if (y1 <= g9 + 0.05) break; n9 = k + 1; A.box(qx, g9 - 0.3, qz, px ? 0.42 : 1.4, y1 - g9 + 0.3, px ? 1.4 : 0.42, 0, k % 2 ? 0xa8794a : wood, { top: 0xb98a55 }); A.pcol(qx, qz, px ? 0.21 : 0.7, px ? 0.7 : 0.21, 0, g9 - 1, y1); }
        pd.cx = best.x + px * 1.2 + px * (n9 * 0.42 + 1.4); pd.cz = best.z + pz * 1.2 + pz * (n9 * 0.42 + 1.4); pd.deck = true; }
      const wx = best.x - px * (best.deck ? 0.9 : 2.4), wz = best.z - pz * (best.deck ? 0.9 : 2.4), wy = onRock || best.deck ? yd - 0.12 : A.gNat(wx, wz); A.box(wx, wy, wz, 0.12, 4.2, 0.12, 0, 0xe8e4da); A.pcol(wx, wz, 0.1, 0.1, 0, wy, wy + 4.2); SW9.push({ x: wx, y: wy + 4.0, z: wz });   /* 바람자루 기둥 */
      { const sx9 = best.deck ? pd.cx - px * 1.6 + s0.dx * 1.6 : best.x - px * 1.2 - s0.dx * 0.2, sz9 = best.deck ? pd.cz - pz * 1.6 + s0.dz * 1.6 : best.z - pz * 1.2 - s0.dz * 0.2; A.signBoard(null, sx9, sz9, Math.atan2(px, pz), L(TXT.pstrip), { w: 2.0, h: 0.5, y: 1.0, y0: onRock ? yd - 0.12 : A.gNat(sx9, sz9), bg: 0x2f6b3a, bgc: '#2f6b3a', fg: '#fff7e0' }); }
      G.launch.push(pd); }
    sockMesh(); }
  let SOCK = null;
  function sockMesh() { if (!SOCK) { const g = new T3.ConeGeometry(0.28, 1.3, 8, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.65); const m = new T3.MeshLambertMaterial({ color: 0xe8702a, side: T3.DoubleSide }); A.own(m); A.own(g); SOCK = { g, m, ms: [] }; }
    for (const m of SOCK.ms) if (m.parent) m.parent.remove(m); SOCK.ms.length = 0; const R9 = A.root(); if (!R9) return; for (const w of SW9) { const o = new T3.Mesh(SOCK.g, SOCK.m); o.position.set(w.x, w.y, w.z); o.userData.fx = 1; R9.add(o); SOCK.ms.push(o); } sockAim(); }
  function sockAim() { if (!SOCK) return; const W = A.wind(day()); for (const o of SOCK.ms) o.rotation.set(0, Math.atan2(W.x, W.z), 0); }   /* 바람이 불어 가는 쪽으로 날림 */
  const windDot = st => { const W = A.wind(day()); return -(st.dx * W.x + st.dz * W.z); };   /* 띠 방향 · 바람이 오는 쪽(−W) — 0 이상 = 맞바람(90° 안) */
  function onStrip(me) { if (!G.launch) return null; for (const pd of G.launch) { if (Math.abs(pd.x - me.x) > 9 || Math.abs(pd.z - me.z) > 9) continue; for (const st of pd.strips) { const s9 = (me.x - st.bx) * st.dx + (me.z - st.bz) * st.dz, l9 = -(me.x - st.bx) * st.dz + (me.z - st.bz) * st.dx; if (s9 > -0.2 && s9 < st.len + 0.3 && Math.abs(l9) < st.hw + 0.1 && Math.abs(me.y - st.y) < 0.7) return { pd, st, s: s9 }; } } return null; }
  function paraIdle(dt, me, dx, dz, dl) { const o = onStrip(me), was = ST.strip; ST.strip = o; if (!o) { if (ST.wing && was && dl > 1e-3 && (dx * was.st.dx + dz * was.st.dz) / dl > 0.6 && was.s > was.st.len - 1.6) { takeoff(me, was); return; } if (ST.runT || ST.wing) { ST.runT = 0; wingShow(false); } return; } const s = S();   /* 띠 앞 끝을 넘어 달려 나가도 뜸(달리기로 빨리 와도) */
    if (!s.para && o.pd.id !== 'P1') { if (dl > 0.01) sayOnce('first', TXT.first, 3); return; }
    const sp = dl / Math.max(dt, 1e-3), dot = dl > 1e-4 ? (dx * o.st.dx + dz * o.st.dz) / dl : 0;
    if (sp > 1.6 && dot > 0.6) { if (windDot(o.st) < -1e-3) { ST.runT = 0; if (now9() - (ST.tailT || 0) > 6000) { ST.tailT = now9(); say(TXT.tail, 3); } return; } ST.runT = (ST.runT || 0) + dt * Math.min(1.8, sp / 4.2); if (ST.runT >= 1.0 && !ST.wing) { wingShow(true); say(TXT.wing, 2); map.sfx && map.sfx('pop'); } if (ST.wing) { const W9 = wingMesh(); W9.grp.position.set(me.x, me.y, me.z); W9.grp.rotation.set(0, Math.atan2(o.st.dx, o.st.dz), 0); } if (ST.wing && o.s >= o.st.len - 0.4) takeoff(me, o); }
    else if (sp < 0.5) { ST.runT = 0; if (ST.wing) wingShow(false); } }
  // 날개(개별 Mesh 하나 + 줄 LineSegments 하나 · 날 때만) · 착지 그림자(지름 3m 판 하나)
  let WING = null;
  function wingMesh() { if (WING) return WING; const N = 12, R = 4.0, H = 6.2, P = [], I = []; for (let i = 0; i <= N; i++) { const th = -0.95 + 1.9 * i / N, x = R * Math.sin(th), y = H + R * Math.cos(th) - R; P.push(x, y, -0.9, x, y, 0.9); if (i < N) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); const m = new T3.MeshLambertMaterial({ color: 0xf2a23a, side: T3.DoubleSide, flatShading: true }); A.own(g); A.own(m);
    const L9 = []; for (const i of [0, 4, 8, 12]) L9.push(0, 1.15, 0, P[i * 6], P[i * 6 + 1], 0); const lg = new T3.BufferGeometry(); lg.setAttribute('position', new T3.Float32BufferAttribute(L9, 3)); const lm = new T3.LineBasicMaterial({ color: 0x3b3b3b }); A.own(lg); A.own(lm);
    const grp = new T3.Group(); grp.add(new T3.Mesh(g, m), new T3.LineSegments(lg, lm)); grp.visible = false; map.add(grp);
    const sg = new T3.CircleGeometry(1.5, 16); sg.rotateX(-Math.PI / 2); const sm = new T3.MeshBasicMaterial({ color: 0x1d2a22, transparent: true, opacity: 0.28, depthWrite: false }); A.own(sg); A.own(sm); const sh = new T3.Mesh(sg, sm); sh.visible = false; sh.renderOrder = 2; map.add(sh);
    return (WING = { grp, sh }); }
  function wingShow(on) { ST.wing = !!on; if (!on && !WING) return; const W9 = wingMesh(); W9.grp.visible = !!on; if (!on) W9.sh.visible = false; }
  // 못 내리는 곳: 물 · 학교 칸(SR + 8m) · 걷기 경계 밖 · 지붕(집 칸) · 체력 바위(사다리 목표)
  function bad(x, z) { const SR = A.SR(); if (A.wAt(x, z) || A.seaSd(x, z) < 2) return 'water'; if (x > SR[0] - 8 && x < SR[2] + 8 && z > SR[1] - 8 && z < SR[3] + 8) return 'school'; if (!A.inWalk(x, z)) return 'out'; if (A.occHit(x - 1.2, z - 1.2, x + 1.2, z + 1.2)) return 'roof'; if ((G.rocks || []).some(r => Math.abs(r.x - x) < r.hx + 2.5 && Math.abs(r.z - z) < r.hz + 2.5)) return 'rock'; if ((G.launch || []).some(q => Math.abs(q.x - x) < 8 && Math.abs(q.z - z) < 8)) return 'pad'; return ''; }
  function takeoff(me, o) { const s = S(); ST.mode = 'para'; ST.pf = { x: me.x, y: me.y + 0.5, z: me.z, h: Math.atan2(o.st.dx, o.st.dz), t: 0, q: 0, av: 0, first: !s.para, from: o.pd.id, x0: me.x, z0: me.z }; ST.runT = 0; ST.strip = null; map.player.pose('para', { y: 0 }); say(TXT.fly, 2.6); map.sfx && map.sfx('go'); if (A.umbClose) A.umbClose(); }
  const PG = { fwd: 5.5, sink: 1.6, bfwd: 4.0, bsink: 1.9, turn: 50 * Math.PI / 180, avoid: 30 * Math.PI / 180, drift: 0.6, strong: 1.0 };
  function paraStep(F, dt, inp, Wd) { const tr = inp.turn * PG.turn + F.av * PG.avoid, br = inp.brake; F.h -= tr * dt; const fwd = br ? PG.bfwd : PG.fwd, sink = br ? PG.bsink : PG.sink, sx = Math.sin(F.h), sz = Math.cos(F.h);
    const nx = F.x + (sx * fwd + Wd.x) * dt, nz = F.z + (sz * fwd + Wd.z) * dt, ny = F.y - sink * dt; if (!map.q.blocked(nx, nz, ny)) { F.x = nx; F.z = nz; } F.y = ny; F.t += dt; F.tilt = -inp.turn - F.av; }
  function hitAhead(F, h, Wd) { const sx = Math.sin(h) * PG.fwd + Wd.x, sz = Math.cos(h) * PG.fwd + Wd.z; for (let t = 0.5; t <= 6; t += 0.5) { const x = F.x + sx * t, z = F.z + sz * t; if (F.y - PG.sink * t <= A.gNat(x, z) + 0.3) return bad(x, z) || 'ok'; } return ''; }   /* 앞 6초(≈30m) 안에 땅에 닿으면 그 자리가 내릴 수 있나 · '' = 아직 높음 */
  function zoneOut(x, z) { const Z = A.zone(); return x < Z[0] || x > Z[2] || z < Z[1] || z > Z[3]; }
  function landGuess(F, h, Wd) { const sx = Math.sin(h) * PG.fwd + Wd.x, sz = Math.cos(h) * PG.fwd + Wd.z; for (let t = 2; t <= 260; t += 2) { const x = F.x + sx * t, z = F.z + sz * t; if (F.y - PG.sink * t <= A.gNat(x, z) + 0.3) return [x, z, bad(x, z)]; } return null; }   /* 지금 방향으로 계속 날면 어디쯤 내리나(2초 걸음 · 활공 계산기) */
  function homeTurn(F) { const H = A.home(), want = Math.atan2(H[0] - F.x, H[1] - F.z), d = Math.atan2(Math.sin(want - F.h), Math.cos(want - F.h)); return Math.abs(d) < 0.15 ? 0 : d > 0 ? -1 : 1; }
  function avoidUpd(F, Wd) { const lx = F.x + (Math.sin(F.h) * PG.fwd + Wd.x) * 6, lz = F.z + (Math.cos(F.h) * PG.fwd + Wd.z) * 6; if (zoneOut(lx, lz)) { F.av = homeTurn(F) || 1; return; }   /* 비행 구역(걷기 판 + 정상 둘레) 끝 30m 앞 = 마을 쪽으로 돎 */
    if ((F.lq = (F.lq || 0) + 1) % 5 === 0) { const g9 = landGuess(F, F.h, Wd); F.far = g9 && (g9[2] === 'out' || g9[2] === 'water' || g9[2] === 'school') ? homeTurn(F) : 0; }   /* 내릴 곳이 걷기 경계 밖·물이면 멀리서부터 마을 쪽으로 */
    const a = hitAhead(F, F.h, Wd); if (a === '' || a === 'ok') { F.av = F.far || 0; return; } const R9 = hitAhead(F, F.h - 0.7, Wd), L9 = hitAhead(F, F.h + 0.7, Wd), good = v => v === '' || v === 'ok'; F.av = good(R9) ? 1 : good(L9) ? -1 : (F.av || 1); }   /* 못 내리는 곳이 30m 앞이면 몸이 저절로 그쪽에서 돌아감(+30°/s) */
  function windVec() { const W = A.wind(day()), k = A.strong(day()) ? PG.strong : PG.drift; return { x: W.x * k, z: W.z * k }; }
  function paraTick(dt) { const F = ST.pf, Wd = windVec(), st = map.player.stick();
    const turn = ((map.player.held('KeyD') || map.player.held('ArrowRight')) ? 1 : 0) - ((map.player.held('KeyA') || map.player.held('ArrowLeft')) ? 1 : 0) + (st ? Math.max(-1, Math.min(1, st.mx * 1.4)) : 0), brake = keyDn();
    if ((F.q += dt) >= 0.1) { F.q = 0; avoidUpd(F, Wd); shadowUpd(F, Wd, brake); }
    paraStep(F, dt, { turn: Math.max(-1, Math.min(1, turn)), brake }, Wd); const ga = map.q.groundAt(F.x, F.z, F.y + 0.4), y = Math.max(F.y, ga);
    pin(F.x, y, F.z, { yaw: F.h, cam: Math.atan2(-Math.sin(F.h), -Math.cos(F.h)) }); map.player.pose('para', { y: F.tilt }); const W9 = wingMesh(); W9.grp.visible = true; W9.grp.position.set(F.x, y, F.z); W9.grp.rotation.set(0, F.h, (F.tilt || 0) * 0.15);
    if ((F.y - ga <= 0.3 && F.t > 0.6) || F.t > 600) landAt(F, ga); }
  function shadowUpd(F, Wd, brake) { const W9 = wingMesh(), sink = brake ? PG.bsink : PG.sink, fwd = brake ? PG.bfwd : PG.fwd, g0 = A.gNat(F.x, F.z), T = Math.max(1, (F.y - g0) / sink); let at = null;
    for (let k = 1; k <= 12; k++) { const t = T * k / 12 * 1.4, x = F.x + (Math.sin(F.h) * fwd + Wd.x) * t, z = F.z + (Math.cos(F.h) * fwd + Wd.z) * t, y = F.y - sink * t, g = map.q.groundAt(x, z, y + 0.5); if (y <= g) { at = [x, g, z]; break; } }
    if (!at) { W9.sh.visible = false; return; } W9.sh.visible = true; W9.sh.position.set(at[0], at[1] + 0.06, at[2]); }
  function landAt(F, ga) { const why = bad(F.x, F.z) || (ga - A.gNat(F.x, F.z) > 1.2 ? 'roof' : ''); wingShow(false); ST.lastLand = { x: +F.x.toFixed(1), z: +F.z.toFixed(1), why, from: F.from, d: +Math.hypot(F.x - F.x0, F.z - F.z0).toFixed(0) };
    if (!why) { ST.mode = null; unpin(); map.player.pose(null); say(TXT.land, 2); map.sfx && map.sfx('ding'); paraDone(F); return; }
    const spot = goodSpot(F.x, F.z); if (!spot) { ST.mode = null; unpin(); map.player.pose(null); paraDone(F); return; } const y0 = Math.max(F.y, ga); ST.mode = 'pslide'; ST.ps = { x: F.x, z: F.z, y0, tx: spot[0], tz: spot[1], ty: spot[2], L: Math.hypot(spot[0] - F.x, spot[1] - F.z), t: 0, F }; map.player.pose(null); say(TXT.noLand, 2.6); }
  function goodSpot(x, z) { for (let r = 2; r <= 600; r += r < 120 ? 2 : 6) for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r; if (bad(qx, qz)) continue; const gn = A.gNat(qx, qz), gq = map.q.groundAt(qx, qz, gn + 2); if (Math.abs(gq - gn) > 0.3 || map.q.blocked(qx, qz, gq + 0.2)) continue; return [qx, qz, gq]; } return null; }
  function pslideTick(dt) { const P = ST.ps; P.t += dt; const k = Math.min(1, P.t / Math.min(2.5, Math.max(0.6, P.L / 4))), x = P.x + (P.tx - P.x) * k, z = P.z + (P.tz - P.z) * k, y = P.y0 + (P.ty - P.y0) * k; pin(x, Math.max(y, P.ty), z); if (k >= 1) { ST.mode = null; unpin(); paraDone(P.F); } }
  function paraDone(F) { const s = S(); if (F.first && !s.para) { s.para = 1; A.GAME.mark(); A.diary(L(TXT.paraOk)); A.skUp('explore', 1, 'stam:para'); } }
  // ───────── 사람(이미 있는 일꾼 자리 옮기기 · 새 사람 X) ─────────
  let GUARD = null; const COACH = [];
  function people(WKP) { GUARD = null; COACH.length = 0; if (!G || !CFG) return; const pool = WKP.filter(w => w.role === 'guest' && !w.k).concat(WKP.filter(w => w.rep === false && w.k && w.k !== 'stall' && w.k !== 'fisher')), take = () => { const w = pool.shift(); if (!w) return null; w.gate = null; w.k = null; w.hk = null; w.stam = 1; return w; };
    const put = (w, x, z, y, ry) => { A.moveCol(w.x, w.z, x, z, y); w.x = x; w.z = z; w.g = y; w.ry = ry; w.role = 'guest'; };   /* 몸 충돌 상자도 같이 옮김 */
    if (G.guard) { const w = take(); if (w) { const [gx, gz, ry] = G.guard, x = gx + Math.sin(ry) * 2.6, z = gz + Math.cos(ry) * 2.6; put(w, x, z, A.gNat(x, z), ry); GUARD = w; } }
    for (const pd of (G.launch || []).filter(p => p.coach)) { const w = take(); if (!w) break; put(w, pd.cx, pd.cz, pd.rock ? pd.y - 0.12 : A.gNat(pd.cx, pd.cz), pd.cry + Math.PI / 2); COACH.push({ w, pd }); pd.w = w; } }
  function entries(add) { for (const { w, pd } of COACH) add({ kind: 'game', x: w.x, z: w.z, y: w.g, r: 2.4, label: L(TXT.coachHot), use: () => { if (!A.night()) A.bubble(w, L(TXT.coach)); else say(TXT.coach, 4); void pd; } }); }
  // ───────── 바퀴(64px 캔버스 Sprite 하나 · 1/16칸 바뀔 때만 · 초당 10번까지) ─────────
  let WH = null; const WV = new T3.Vector3(), WR = new T3.Vector3();
  function wheel() { if (WH) return WH; const c = document.createElement('canvas'); c.width = c.height = 64; const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; const m = new T3.SpriteMaterial({ map: tx, depthTest: false, transparent: true }); const s = new T3.Sprite(m); s.scale.set(0.42, 0.42, 1); s.renderOrder = 9; s.visible = false; map.add(s); WH = { s, c, g: c.getContext('2d'), tx, key: '', t: 0, hide: 0 }; return WH; }
  function wheelDraw(now) { const W9 = wheel(), n = nNow(), q = Math.round(Math.max(0, Math.min(n, ST.v)) * 16) / 16, ak = ST.anim > 0 ? Math.round(ST.anim * 20) : 0, key = n + ':' + q + ':' + ak; if (key === W9.key || now - W9.t < 100) return; W9.key = key; W9.t = now;
    const g = W9.g; g.clearRect(0, 0, 64, 64); const gap = 0.16, a0 = -Math.PI / 2, seg = Math.PI * 2 / n, low = q < 1;
    for (let i = 0; i < n; i++) { let s0 = a0 + i * seg + gap / 2, s1 = a0 + (i + 1) * seg - gap / 2; if (ST.anim > 0 && i === ST.animK) s1 = s0 + (s1 - s0) * (1 - ST.anim); g.lineCap = 'butt'; g.lineWidth = 9; g.strokeStyle = EMPTY; g.beginPath(); g.arc(32, 32, 24, s0, s1); g.stroke();
      const f = Math.max(0, Math.min(1, q - i)); if (f > 0) { g.strokeStyle = low ? LOW : INK; g.beginPath(); g.arc(32, 32, 24, s0, s0 + (s1 - s0) * f); g.stroke(); } }
    g.lineWidth = 2; g.strokeStyle = 'rgba(40,52,44,.55)'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.stroke(); W9.tx.needsUpdate = true; }
  function wheelTick(dt, me, now) { const W9 = wheel(), act = !!ST.mode || ST.running || ST.anim > 0, full = ST.v >= nNow() - 1e-3; if (act || !full) W9.hide = 1.0; else W9.hide -= dt; const on = W9.hide > 0 && !A.busy() && !A.away(); W9.s.visible = on; if (!on) return;
    const cam = map.camera; WR.set(1, 0, 0).applyQuaternion(cam.quaternion); WV.set(me.x + WR.x * 0.55, me.y + 1.95, me.z + WR.z * 0.55); W9.s.position.copy(WV); wheelDraw(now); }
  // ───────── 상태 바꾸기 ─────────
  const say = (t, s) => A.say(L(t), s || 2.6), sayOnce = (k, t, s) => { const T = S().tip; if (T[k] === day()) return; T[k] = day(); A.GAME.mark(); say(t, s); };
  function drain(c) { if (c <= 0) return; ST.v = Math.max(0, ST.v - c); ST.rest = 0; }
  function pin(x, y, z, o) { const P9 = ST.pin || (ST.pin = {}); P9.x = x; P9.y = y; P9.z = z; P9.g = !!(o && o.g); P9.yaw = o && o.yaw != null ? o.yaw : null; P9.cam = o && o.cam != null ? o.cam : null; map.player.pin(P9); }
  function unpin() { map.player.pin(null); }
  function end(why) { const m = ST.mode; if (!m) return; ST.mode = null; unpin(); map.player.pose(null); if (ST.wing) wingShow(false); map.player.ride(false); if (A.swimming()) map.player.pose('swim'); ST.climb = null; ST.fl = null; if (BOATM) BOATM.visible = false; ST.why = why; if (why === 'rebuild' && (m === 'para' || m === 'climb')) ST.snap = 1; }   /* 판 모습 바꾸기(Y)·다시 짓기로 붙든 몸을 풀면 = 다음 칸에 바로 밑 땅으로(공중에 남지 않게) */
  // ───────── 1초 칸 ─────────
  function sec(me) { if (!G) return; void me; if ((ST.sq = (ST.sq || 0) + 1) % 5 === 0) sockAim(); }
  // ───────── 매 프레임 ─────────
  const keyUp = () => map.player.held('KeyW') || map.player.held('ArrowUp') || ((map.player.stick() || {}).my > 0.35), keyDn = () => map.player.held('KeyS') || map.player.held('ArrowDown') || ((map.player.stick() || {}).my < -0.35);
  function tick(dt, me) { if (ST.snap) { ST.snap = 0; const g9 = map.q.groundAt(me.x, me.z, me.y); if (me.y - g9 > 0.6) map.player.teleport([me.x, g9 + 0.05, me.z]); } if (!G || !CFG) { if (WH) WH.s.visible = false; return; } const now = performance.now(); if (!ST.has) { ST.has = true; ST.lx = me.x; ST.ly = me.y; ST.lz = me.z; ST.v = nNow(); }
    const busy = A.busy(); if (ST.anim > 0) { ST.anim = Math.max(0, ST.anim - dt / 0.8); }
    const dx = me.x - ST.lx, dz = me.z - ST.lz, dy = me.y - ST.ly, dl = Math.hypot(dx, dz), jump = dl > 3 || Math.abs(dy) > 6; ST.lx = me.x; ST.ly = me.y; ST.lz = me.z; bikeTick(dt, me, dx, dz, jump ? 0 : dl);
    if (ST.mode && !busy) modeTick(dt, me, now); else if (ST.mode && busy) { if (ST.pin) map.player.pin(ST.pin); }
    else if (!busy) { const sw = A.swimming();
      if (sw && !jump) { drain(dl / STAM_SW); ST.lastSwim = now; if (!s9().tip.swim) firstSwim(); const ci = cellAt(me.x, me.z); if (ci === 2) pushStart(me); else if (ST.v <= 0) floatStart(me); }
      else if (!sw) { trackRest(me); climbIdle(dt, me); if (!jump) paraIdle(dt, me, dx, dz, dl); runTick(dt, me, dy, dl, jump); const rest = Math.abs(map.player.vy) < 0.05 && !ST.running; if (rest) { ST.rest += dt; if (ST.rest > 1.0) ST.v = Math.min(nNow(), ST.v + nNow() / 3.0 * dt); } else ST.rest = 0; }
      stampTick(dt, me); }
    wheelTick(dt, me, now); }
  const s9 = () => S();
  function cellAt(x, z) { const W = G.W, i = Math.floor((x - W.x0) / 2), j = Math.floor((z - W.z0) / 2); return i >= 0 && j >= 0 && i < W.nx && j < W.nz ? W.g[j * W.nx + i] : 0; }
  function trackRest(me) { if (Math.abs(map.player.vy) > 0.05) return; let best = null, bd = 1e9; for (const P of G.pads) { const d = Math.hypot(P.x - me.x, P.z - me.z); if (d < P.hd + P.hw + 3 && d < bd) { bd = d; best = P; } } ST.last = best ? { x: best.x, z: best.z, id: best.id, y: A.SEAY() + 0.2, pad: best } : (A.swimming() ? ST.last : { x: me.x, z: me.z, id: 'shore', y: me.y }); }
  function firstSwim() { const s = S(); s.tip.swim = 1; A.GAME.mark(); if (GUARD && !A.night()) { A.bubble(GUARD, L(TXT.swim1)); GUARD.demo = 2; ST.first = 'guard'; } else { say(TXT.swim1, 3); ST.first = 'say'; } }
  // 부표 밖 띠 = 순간이동 대신 0.8m/s로 부드럽게 되돌림
  function pushStart(me) { const W = G.W; let best = null, bd = 1e9; const i0 = Math.floor((me.x - W.x0) / 2), j0 = Math.floor((me.z - W.z0) / 2); for (let b = -6; b <= 6; b++) for (let a = -6; a <= 6; a++) { const i = i0 + a, j = j0 + b; if (i < 0 || j < 0 || i >= W.nx || j >= W.nz) continue; const g = W.g[j * W.nx + i]; if (g !== 1 && g !== 3) continue; const x = W.x0 + (i + 0.5) * 2, z = W.z0 + (j + 0.5) * 2, d = Math.hypot(x - me.x, z - me.z); if (d < bd) { bd = d; best = [x, z]; } } if (!best) return;
    const ux = (best[0] - me.x) / (bd || 1), uz = (best[1] - me.z) / (bd || 1); ST.mode = 'push'; ST.push = { x: me.x, z: me.z, y: me.y, tx: best[0] + ux * 1.5, tz: best[1] + uz * 1.5 }; if (now9() - ST.sayT > 6000) { ST.sayT = now9(); say(TXT.push, 2.2); } }
  const now9 = () => performance.now();
  function floatStart(me) { const s = S(), ci = cellCid(me.x, me.z), id = ci ? (G.pads.find(P => P.ci === ci) || {}).id || 'band' : 'band', F = s.fail[id] && s.fail[id][0] === day() ? s.fail[id] : (s.fail[id] = [day(), 0]); F[1]++; A.GAME.mark();
    ST.mode = 'float'; ST.fl = { t: 0, x: me.x, z: me.z, y: A.SEAY() - 0.25, id, src: ST.last && ST.last.id !== 'shore' ? [ST.last.x, ST.last.z] : shoreNear(me.x, me.z) }; map.player.pose('lie', { y: 0.0 }); say(TXT.float, 3.4); map.sfx && map.sfx('pop');
    if (F[1] >= 2 && s.said[id] !== day()) hint(id, 'swim'); }
  function cellCid(x, z) { const W = G.W, i = Math.floor((x - W.x0) / 2), j = Math.floor((z - W.z0) / 2); return i >= 0 && j >= 0 && i < W.nx && j < W.nz && W.cid ? W.cid[j * W.nx + i] : 0; }
  function shoreNear(x, z) { const W = G.W, SEAY = A.SEAY(); let best = null, bd = 1e9; for (let j = 0; j < W.nz; j++) for (let i = 0; i < W.nx; i++) { const k = j * W.nx + i; if (W.g[k] !== 1) continue; const cx = W.x0 + (i + 0.5) * 2, cz = W.z0 + (j + 0.5) * 2; if (G.GRID.gn[k] < SEAY - 0.45) continue; const d = Math.hypot(cx - x, cz - z); if (d < bd) { bd = d; best = [cx, cz]; } } return best || [G.bx, G.bz]; }
  function hint(id, kind) { const s = S(); s.said[id] = day(); A.GAME.mark(); const want = ['R1', 'C1', 'R2', 'C2', 'R3', 'C3'].find(k => !s.got[k] && G.stamps.some(q => q.id === k) && k !== id && (G.stamps.find(q => q.id === k) || {}).k < ((G.stamps.find(q => q.id === id) || {}).k || 99)); if (!want) return;
    const who = kind === 'swim' ? GUARD : (COACH[0] && COACH[0].w); const line = en() ? 'Running out of breath fast, huh. People who made it to ' + PLACE[want][1] + ' have longer breath.' : '숨이 금방 차네요. ' + PLACE[want][0] + '에 다녀온 사람들은 숨이 길던데요.';
    if (who && !A.night()) { const me = map.player.pos(); if (Math.hypot(who.x - me.x, who.z - me.z) < 90) A.bubble(who, line); } }
  function modeTick(dt, me, now) { const m = ST.mode;
    if (m === 'push') { const P = ST.push, d = Math.hypot(P.tx - P.x, P.tz - P.z); if (d < 0.2 || keyAny()) { ST.mode = null; unpin(); return; } const st = Math.min(d, PUSH_SP * dt); P.x += (P.tx - P.x) / d * st; P.z += (P.tz - P.z) / d * st; pin(P.x, me.y, P.z); if (cellAt(P.x, P.z) !== 2) { const dd = Math.hypot(P.tx - P.x, P.tz - P.z); if (dd < 1.0) { ST.mode = null; unpin(); } } return; }
    if (m === 'float') { const F = ST.fl; F.t += dt; const [sx, sz] = F.src, d = Math.hypot(sx - F.x, sz - F.z); if (d > 6) { F.x += (sx - F.x) / d * FLOAT_SP * dt; F.z += (sz - F.z) / d * FLOAT_SP * dt; } pin(F.x, A.SEAY() - 0.25, F.z); if (F.t > 10) rescueStart(); return; }
    if (m === 'rescue') return rescueTick(dt);
    if (m === 'climb') return climbTick(dt, me);
    if (m === 'slide') return slideTick(dt);
    if (m === 'para') return paraTick(dt, me);
    if (m === 'pslide') return pslideTick(dt); }
  let keyHit = 0; const onKey = () => { keyHit = performance.now(); }; addEventListener('keydown', onKey, true); addEventListener('pointerdown', onKey, true);
  const keyAny = () => false;
  // ───────── 구조 배(이미 있는 결의 작은 배 · 구조 때만 보임) ─────────
  let BOATM = null;
  function boatMesh() { if (BOATM) return BOATM; const g = new T3.Group(), m1 = new T3.MeshLambertMaterial({ color: 0xe0453a, flatShading: true }), m2 = new T3.MeshLambertMaterial({ color: 0xf4f2ea, flatShading: true }); A.own(m1); A.own(m2);
    const hull = new T3.Mesh(new T3.BoxGeometry(1.5, 0.55, 3.4), m1); hull.position.y = 0.1; const deck = new T3.Mesh(new T3.BoxGeometry(1.2, 0.12, 2.6), m2); deck.position.y = 0.42; A.own(hull.geometry); A.own(deck.geometry); g.add(hull, deck); g.visible = false; map.add(g); return (BOATM = g); }
  function rescueStart() { const F = ST.fl, b = boatMesh(), [gx, gz] = G.guard ? [G.guard[0], G.guard[1]] : [G.bx, G.bz], st = shoreNear(gx, gz), dsea = [st[0] + G.ox * 6, st[1] + G.oz * 6];
    ST.mode = 'rescue'; ST.rs = { ph: 'in', bx: dsea[0], bz: dsea[1], home: dsea, land: G.guard ? [gx + Math.sin(G.guard[2]) * 4.5, gz + Math.cos(G.guard[2]) * 4.5] : st, t: 0, k0: performance.now() }; b.visible = true; b.position.set(dsea[0], A.SEAY() - 0.1, dsea[1]); say(TXT.boat, 3.2); map.sfx && map.sfx('honk'); void F; }
  function rescueTick(dt) { const R = ST.rs, F = ST.fl, b = BOATM, y = A.SEAY() - 0.1; R.t += dt; const skip = keyHit > R.k0 + 300;
    const mv = (tx, tz, sp) => { const d = Math.hypot(tx - R.bx, tz - R.bz); if (d < 0.05) return true; const st = Math.min(d, sp * dt); R.bx += (tx - R.bx) / d * st; R.bz += (tz - R.bz) / d * st; b.rotation.y = Math.atan2(tx - R.bx, tz - R.bz); return d - st < 0.05; };
    if (skip && R.ph !== 'land') { R.bx = R.home[0]; R.bz = R.home[1]; R.ph = 'land'; R.lt = 0; R.lx = R.home[0]; R.lz = R.home[1]; }
    if (R.ph === 'in') { if (mv(F.x - G.ox * 1.2, F.z - G.oz * 1.2, BOAT_IN)) { R.ph = 'out'; map.player.pose(null); map.player.ride(true); } pin(F.x, A.SEAY() - 0.25, F.z); }
    else if (R.ph === 'out') { const done = mv(R.home[0], R.home[1], BOAT_OUT); pin(R.bx, y + 0.5, R.bz); if (done) { R.ph = 'land'; R.lt = 0; R.lx = R.bx; R.lz = R.bz; } }
    if (R.ph === 'land') { R.lt += dt; const k = Math.min(1, R.lt / 0.8), x = R.lx + (R.land[0] - R.lx) * k, z = R.lz + (R.land[1] - R.lz) * k, gy = A.gNat(x, z); pin(x, Math.max(gy, A.SEAY() - 0.2) + 0.05 + Math.sin(k * Math.PI) * 0.5, z); if (k >= 1) { map.player.ride(false); ST.mode = null; unpin(); b.visible = false; ST.v = Math.min(ST.v, 0.0); say(TXT.drop, 3.2); ST.lastDrop = [x, z]; } }
    b.position.set(R.bx, y, R.bz); }
  // ───────── 오르기(W를 0.3초 · 누르고 있으면 오름 · 놓으면 매달려 멈춤) ─────────
  function climbIdle(dt, me) { if (A.bike() || !G.climbs.length) return; let rt = null; for (const r of G.climbs) { if (Math.hypot(r.bx - me.x, r.bz - me.z) > 1.0 || Math.abs(me.y - r.y0) > 1.0) continue; const p = map.player.get(), a = (p.h || 0) * Math.PI / 180, fx = Math.sin(a), fz = -Math.cos(a); if (-(fx * r.nx + fz * r.nz) > 0.7) { rt = r; break; } }
    if (!rt || !keyUp()) { ST.grab = 0; return; } ST.grab = (ST.grab || 0) + dt; if (ST.grab < 0.3) return; ST.grab = 0; ST.mode = 'climb'; ST.climb = { r: rt, y: Math.max(rt.y0, me.y), t: 0, snd: 0, pull: -1 }; map.player.pose('climb', { y: 0 }); if (!S().tip.climb) { S().tip.climb = 1; A.GAME.mark(); say(TXT.grab, 3); } map.sfx && map.sfx('tick'); }
  function climbTick(dt, me) { const C = ST.climb, r = C.r, yaw = Math.atan2(-r.nx, -r.nz), cam = Math.atan2(r.nx, r.nz); void me;
    if (C.pull >= 0) { C.pull += dt / 0.4; const k = Math.min(1, C.pull), x = r.bx + (r.tx - r.bx) * k, z = r.bz + (r.tz - r.bz) * k; pin(x, r.y1 + Math.sin(k * Math.PI) * 0.35 + (k >= 1 ? 0.02 : 0), z, { yaw, cam }); if (k >= 1) { ST.mode = null; unpin(); map.player.pose(null); ST.climb = null; map.sfx && map.sfx('ding'); say(TXT.top, 1.8); } return; }
    let v = 0; if (keyUp()) v = r.sp; else if (keyDn()) v = -r.sp;
    if (v > 0 && ST.v <= 0) { ST.mode = 'slide'; ST.sl = { r, y: C.y, to: r.y0 }; map.player.pose('climb', { y: 0 }); const s = S(), F = s.fail[r.id] && s.fail[r.id][0] === day() ? s.fail[r.id] : (s.fail[r.id] = [day(), 0]); F[1]++; A.GAME.mark(); say(TXT.slide, 2.8); if (F[1] >= 2 && s.said[r.id] !== day()) hint(r.id, 'climb'); return; }
    const ny = Math.max(r.y0, Math.min(r.y1, C.y + v * dt)), d = ny - C.y; if (d > 0) drain(d / STAM_CL); else if (d < 0) drain(-d / (STAM_CL * 2)); C.y = ny; C.snd += Math.abs(d); if (C.snd > 0.5) { C.snd = 0; map.sfx && map.sfx('tick'); }
    map.player.pose('climb', { y: v }); pin(r.bx, C.y, r.bz, { yaw, cam });
    if (C.y >= r.y1 - 1e-3) { C.pull = 0; return; }
    if ((keyDn() || map.player.held('Space')) && C.y - r.y0 < 2.0 && (C.y <= r.y0 + 0.02 || map.player.held('Space'))) { ST.mode = null; unpin(); map.player.pose(null); ST.climb = null; return; }
    if (map.player.held('Space') && C.y - r.y0 >= 2.0) sayOnce('hold', TXT.hold, 1.8); }
  function slideTick(dt) { const Sl = ST.sl, r = Sl.r; Sl.y = Math.max(Sl.to, Sl.y - SLIDE_SP * dt); pin(r.bx, Sl.y, r.bz, { yaw: Math.atan2(-r.nx, -r.nz) }); if (Sl.y <= Sl.to + 1e-3) { ST.mode = null; unpin(); map.player.pose(null); ST.sl = null; } }
  // ───────── 비탈 달리기(사다리 밖 · 다 쓰면 걷기) ─────────
  function runTick(dt, me, dy, dl, jump) { const st = map.player.stick(), run = !A.bike() && map.player.input && ((map.player.held('ShiftLeft') || map.player.held('ShiftRight')) || (st && st.m >= 0.92)); ST.running = !!run && !ST.runLock; void me;
    if (ST.running && !jump && dy > 0 && dl > 1e-3 && dy / dl > 0.1 && Math.abs(map.player.vy) < 0.05) { drain(dy / STAM_RUN); if (ST.v <= 0 && !ST.runLock) { ST.runLock = true; ST.running = false; map.player.run(false); say(TXT.run0, 2.4); map.sfx && map.sfx('pop'); } }
    if (ST.runLock && ST.v >= nNow() - 1e-3) { ST.runLock = false; if (!A.bike()) map.player.run(true); } }
  // ───────── 도장(그 단계 칸을 끝까지 다 써야 닿는 자리 · 1초 서 있으면 꾹) ─────────
  function stampTick(dt, me) { const s = S(); for (const q of G.stamps) { if (s.got[q.id]) continue; if (Math.hypot(q.cx - me.x, q.cz - me.z) > q.r || Math.abs(me.y - q.y) > 1.3) { q.t = 0; continue; } q.t = (q.t || 0) + dt; if (q.t < 1.0) continue; q.t = 0; award(q); } }
  function award(q) { const s = S(), n0 = nNow(); s.got[q.id] = day(); s.n = Math.min(MAXN, Math.max(n0, q.k + 1)); A.GAME.mark(); map.sfx && map.sfx('ding');
    if (s.n > n0) { ST.anim = 1; ST.animK = s.n - 1; ST.v = s.n; say(TXT.grow, 3.2); } A.skUp('explore', 1, 'stam:' + q.id); A.diary(L(DIARY[q.id] || DIARY.R1)); }
  // ───────── 자전거 꺾기(손맛 · 사다리 밖): 빠를수록 도는 빠르기 상한(8m/s 아래 260°/s → 21m/s 170°/s) · 탈 때만 기울기 ±0.35 · 세게 돌면 뒷바퀴 흙먼지 ─────────
  const BK = { on: false, v: 0, h: null, w: 0, q: 0, off: true }, DUST = []; let DM = null; const DQ = new T3.Object3D();   /* off = 돌기 상한 끔(기본 · 설계 §2-7 '교차로 봇이 실패하면 상한을 끄고 기울기만' — 10-25 다시 잰 교차로 40곳 가운데 상한 켬 6곳이 모퉁이에 1~3초 붙음 · 끔 0곳) */
  function bikeTick(dt, me, dx, dz, dl) { const on = A.bike(); if (on !== BK.on) { BK.on = on; map.player.leanMax(on ? 0.35 : null); if (!on) map.player.turnMax(null); BK.h = null; BK.w = 0; } if (DUST.length) dustTick(dt); if (!on) return;
    const v = dl / Math.max(dt, 1e-3); BK.v += (v - BK.v) * Math.min(1, dt * 4); const deg = BK.v <= 8 ? 260 : BK.v >= 21 ? 170 : 260 - (BK.v - 8) / 13 * 90; map.player.turnMax(BK.off ? null : deg * Math.PI / 180);
    if (dl > 1e-3) { const h = Math.atan2(dx, dz); if (BK.h != null) { const w = Math.abs(Math.atan2(Math.sin(h - BK.h), Math.cos(h - BK.h))) / Math.max(dt, 1e-3); BK.w += (w - BK.w) * Math.min(1, dt * 6); } BK.h = h; }
    if ((BK.q -= dt) <= 0 && BK.w > 150 * Math.PI / 180 && BK.v > 12) { BK.q = 0.3; puff(me.x - Math.sin(BK.h) * 0.8, me.y + 0.1, me.z - Math.cos(BK.h) * 0.8); } }
  function puff(x, y, z) { if (!DM) { const g = new T3.IcosahedronGeometry(0.3, 0), m = new T3.MeshLambertMaterial({ color: 0xc8b48a, flatShading: true }); A.own(g); A.own(m); DM = new T3.InstancedMesh(g, m, 6); DM.frustumCulled = false; DM.count = 0; map.add(DM); }
    if (DUST.length >= 6) DUST.shift(); DUST.push({ x, y, z, t: 0 }); }
  function dustTick(dt) { let n = 0; for (let i = DUST.length - 1; i >= 0; i--) { const d = DUST[i]; d.t += dt; if (d.t > 0.6) { DUST.splice(i, 1); continue; } } for (const d of DUST) { const k = d.t / 0.6, sc = (0.5 + k * 1.2) * (1 - k * k); DQ.position.set(d.x, d.y + k * 0.5, d.z); DQ.scale.setScalar(Math.max(0.01, sc)); DQ.updateMatrix(); DM.setMatrixAt(n++, DQ.matrix); } DM.count = n; DM.instanceMatrix.needsUpdate = true; DM.visible = n > 0; }
  // ───────── 바깥에서 부르는 것 ─────────
  function onTp() { if (ST.mode) { end('tp'); } ST.has = false; ST.v = nNow(); }
  function reset() { if (ST.mode) end('reset'); ST.has = false; ST.v = nNow(); if (ST.runLock) { ST.runLock = false; map.player.run(true); } }
  function dispose() { removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onKey, true); if (WH) { map.remove(WH.s); WH.tx.dispose(); WH.s.material.dispose(); WH = null; } if (BOATM) { map.remove(BOATM); BOATM = null; } if (WING) { map.remove(WING.grp); map.remove(WING.sh); WING = null; } if (DM) { map.remove(DM); DM = null; } if (BK.on) { map.player.turnMax(null); map.player.leanMax(null); } if (ST.mode) end('dispose'); }
  function graph() { if (!G) return null; return { pads: G.pads.map(P => ({ id: P.id, k: P.k, kind: P.kind, x: +P.x.toFixed(1), z: +P.z.toFixed(1), size: P.size, need: P.need, ex: +P.ex.toFixed(1), ez: +P.ez.toFixed(1), tE: P.tE, hd: P.hd, hw: P.hw, ux: P.ux, uz: P.uz })), climbs: G.climbs.map(r => ({ id: r.id, k: r.k, kind: r.kind, bx: +r.bx.toFixed(2), bz: +r.bz.toFixed(2), y0: +r.y0.toFixed(2), y1: +r.y1.toFixed(2), h: +(r.y1 - r.y0).toFixed(2), nx: r.nx, nz: r.nz, tx: +r.tx.toFixed(2), tz: +r.tz.toFixed(2) })), stamps: G.stamps.map(q => ({ id: q.id, k: q.k, x: +q.x.toFixed(1), z: +q.z.toFixed(1), y: +q.y.toFixed(2) })), rocks: (G.rocks || []).map(r => ({ ...r })), cdb: G.cdb || null, anchors: (CFG.climb || []).map(c => [c.id, anchorOf(c.at)]), band: [+G.bx.toFixed(1), +G.bz.toFixed(1), +G.ox.toFixed(3), +G.oz.toFixed(3)], cs: G.CS.map(c => ({ id: c.id, dx: +c.dx.toFixed(3), dz: +c.dz.toFixed(3), Lm: c.Lm, t0: c.t0 })), miss: G.miss || [], shore: shoreNear(G.bx, G.bz), guard: G.guard, land: G.guard ? [G.guard[0] + Math.sin(G.guard[2]) * 4.5, G.guard[1] + Math.cos(G.guard[2]) * 4.5] : null, launch: (G.launch || []).map(p => ({ id: p.id, x: p.x, z: p.z, y: p.y, strips: p.strips.map(s => ({ a: s.a, cx: s.cx, cz: s.cz, y: s.y, len: s.len })) })), people: { guard: !!GUARD, coach: COACH.length } }; }
  function simFlight(padId, si, wk, strong, plan) { const pd = (G.launch || []).find(q => q.id === padId), st = pd && pd.strips[si]; if (!st) return null; const a = wk == null ? null : wk / 8 * 6.2832, k9 = strong ? PG.strong : PG.drift, W = a == null ? { x: 0, z: 0 } : { x: Math.sin(a) * k9, z: -Math.cos(a) * k9 }, open = a == null ? true : -(st.dx * Math.sin(a) + st.dz * -Math.cos(a)) >= -1e-3;   /* 시험 E: 같은 걸음 함수(paraStep·avoidUpd)로 몸 없이 날려 봄 · wk = 바람이 불어 가는 8방위(0 = 북) */
    const F = { x: st.bx + st.dx * (st.len - 0.4), y: st.y + 0.5, z: st.bz + st.dz * (st.len - 0.4), h: Math.atan2(st.dx, st.dz), t: 0, av: 0 }, x0 = F.x, z0 = F.z, dt = 0.2; let q = 0;
    for (let i = 0; i < 4000; i++) { const p9 = plan ? plan(F.t) : { turn: 0, brake: false }; if ((q += dt) >= 0.2) { q = 0; avoidUpd(F, W); } paraStep(F, dt, p9, W); const ga = map.q.groundAt(F.x, F.z, F.y + 0.4); if (F.y - ga <= 0.3 && F.t > 0.6) { const why = bad(F.x, F.z) || (ga - A.gNat(F.x, F.z) > 1.2 ? 'roof' : ''), sp = why ? goodSpot(F.x, F.z) : null; return { x: +F.x.toFixed(1), z: +F.z.toFixed(1), d: +Math.hypot(F.x - x0, F.z - z0).toFixed(0), t: +F.t.toFixed(0), why, open, end: sp ? [+sp[0].toFixed(1), +sp[1].toFixed(1), bad(sp[0], sp[1])] : null }; } }
    return { x: F.x, z: F.z, d: Math.hypot(F.x - x0, F.z - z0), t: F.t, why: 'long', open }; }
  const swimF = (x, z, z0) => G ? (z0 ? G.f0At(x, z) : G.fAt(x, z)) : 1e9;
  const pairs = () => G ? G.pairs() : null;
  const dbg = (x, z) => { if (!G) return null; const R = G.GRID, i = Math.floor((x - R.x0) / R.cs), j = Math.floor((z - R.z0) / R.cs), k = j * R.nx + i; return [R.g[k], +R.gn[k].toFixed(2), +G.f0At(x, z).toFixed(1), +A.SEAY().toFixed(2)]; };
  return { prep, build, people, tick, sec, onTp, reset, dispose, graph, swimF, dbg, pairs, cellAt: (x, z) => G ? cellAt(x, z) : 0,
    state: () => ({ n: nNow(), v: +ST.v.toFixed(3), mode: ST.mode, got: { ...S().got }, para: S().para, fail: JSON.parse(JSON.stringify(S().fail)), running: !!ST.running, runLock: ST.runLock, last: ST.last && ST.last.id, rs: ST.rs ? ST.rs.ph : null, drop: ST.lastDrop || null, why: ST.why || null, first: ST.first || null, wheel: !!(WH && WH.s.visible) }),
    set: n => { const s = S(); s.n = Math.min(MAXN, Math.max(3, n | 0)); ST.v = s.n; A.GAME.mark(); }, fill: v => { ST.v = v == null ? nNow() : v; },
    bikeTurn: on => { BK.off = !on; if (!on) map.player.turnMax(null); }, bikeInfo: () => ({ on: BK.on, v: +BK.v.toFixed(1), w: +(BK.w * 180 / Math.PI).toFixed(0), off: BK.off, dust: DUST.length }),
    canBike: () => !ST.mode, noUmb: () => !!ST.mode || !!ST.strip, entries, walkable: (x, z) => A.inWalk(x, z) && !A.wAt(x, z), gNat: (x, z) => A.gNat(x, z), badAt: (x, z) => G ? bad(x, z) : null, simFlight: (padId, si, w, strong, plan) => simFlight(padId, si, w, strong, plan), last: () => ST.lastLand || null, busyBody: () => !!ST.mode, air: () => ST.mode === 'para', get mode() { return ST.mode; } };
}
