// 🏞 판 밖 탐험 땅(EXPLORE-1 · 설계 docs/systems/town_explore.md 차례 1·2·4 최소판) — 층층골(지층 절벽·폭포·화석) · 까망봉(쉬는 작은 화산·말굽 분화구)
//   엔진 = 능력만: 자료 D.edges(ourtown.js 한 줄 · ✨ 사용자 승인 10-18)가 있을 때만 생김 · zz_* 마을엔 아무것도 없음 · 판 칸은 하나도 바꾸지 않음(판 밖 둘레 땅 위에만)
//   땅 = 모서리마다 작은 땅 판 하나(8m 칸 + 벽·물가 자리 줄) · 판 밖 땅(skirt) 0.5m 아래에서 솟아 나옴(둘레 18m 섞임 · 같은 색이라 이음매가 안 보임) · 몸 높이 = 그 판 삼각형 그대로(h)
//   걷기 = 플레이어 걷기 경계에만 trail(x, z) 더함(town.js inWalk는 그대로 — 일꾼·도착·바로 가기·바다는 판 사각형을 그대로 씀)
//   층층골: 남북 V자 골 · 서쪽 벽(동쪽을 봄)에 다섯 띠(위 → 아래 자갈·모래·진흙·조개 화석·고사리 화석) · 남쪽 끝 12m 폭포와 소 · 소에서 골 어귀로 냇물(물은 낮은 곳으로)
//     발굴 = 벽 밑 흙더미 넷(자리마다 나오는 것이 정해짐 · 무작위 X): ⛏ 삽으로 걷기 → 🧹 빗자루로 쓸기 → 🔍 돋보기로 보기 → 수첩 🦴 지층 기둥에 띠 색을 보고 붙이기 → '먼저일까 나중일까' 한 물음
//     화석은 가져가지 않음(사진·수첩에만 — 화석 산지 보호는 사실)
//   까망봉: 지름 160m · 높이 35m 원뿔 + 말굽꼴 분화구(터진 쪽 = 마을 쪽 = 드나드는 길) · 송이(붉은 갈색)·현무암 돌 · 돋보기 관찰 한 장(구멍 숭숭 vs 화강암 알갱이) · 분출·연기·재난 X
//   저장 GAME.S.xp = { fos: { 자리: [띠, day] }, col: [기둥에 붙인 자리], st: { 자리: 0~3 }, q: day, sc: day } · 일이 생길 때만 GAME.mark · 보상 = rwCheck 문(꼬리표 'xp:fos'·'xp:crater')
//   렉: 매 프레임 일 0(1초 칸에서 가까이 왔나만) · 새 Light X · 그리기 = 땅 판 2 + 폭포 1 + 소·냇물 1 + 흙더미·돌판·무늬 인스턴스 3
export const XP_V = 1;
const T2 = (a, b) => [a, b];
// 띠(위 → 아래) · lo = 이 띠가 시작하는 높이(골 바닥 쪽 판 밖 땅 위 m)
export const BANDS = [
  { id: 'gravel', t: T2('자갈층', 'Gravel layer'), hex: 0x9b958b, lo: 11.9 },
  { id: 'sand', t: T2('모래층', 'Sand layer'), hex: 0xd9bf88, lo: 9.5 },
  { id: 'mud', t: T2('진흙층', 'Mud layer'), hex: 0x86684f, lo: 7.1 },
  { id: 'shell', t: T2('조개 화석층', 'Shell fossil layer'), hex: 0xcbbb9e, lo: 4.7 },
  { id: 'fern', t: T2('고사리 화석층', 'Fern fossil layer'), hex: 0x5f584a, lo: -99 },
];
const bandAt = b => { for (let i = 0; i < BANDS.length; i++) if (b >= BANDS[i].lo) return i; return BANDS.length - 1; };
// 흙더미 넷(u = 골 어귀에서 남쪽으로 m · band = 무너져 내린 띠 · 사실만)
export const FINDS = [
  { id: 'f1', u: 30, band: 4, ic: '🌿', t: T2('고사리 화석', 'Fern fossil'), line: T2('잎이 새 깃털처럼 잘게 갈라진 고사리 자국이 돌에 남았어요. 고사리는 축축한 땅에서 자라요.', 'The print of a fern leaf, split finely like a feather, is left in the stone. Ferns grow on damp land.') },
  { id: 'f2', u: 46, band: 3, ic: '🐚', t: T2('조개 화석', 'Shell fossil'), line: T2('부채처럼 퍼진 줄무늬가 있는 조개껍데기 자국이에요. 이 층이 쌓일 때 이곳은 물속이었어요.', 'The print of a shell with lines spread like a fan. When this layer was laid down, this place was under water.') },
  { id: 'f3', u: 58, band: 2, ic: '🌊', t: T2('물결 자국', 'Ripple marks'), line: T2('고운 진흙에 물결 무늬가 굳어 있어요. 얕은 물 밑에서 물결이 진흙을 밀어 생긴 무늬예요.', 'Wave lines are set in the fine mud. Small waves in shallow water pushed the mud into this pattern.') },
  { id: 'f4', u: 70, band: 0, ic: '⚪', t: T2('둥근 자갈', 'Rounded gravel'), line: T2('자갈이 둥글둥글해요. 흐르는 물에 오래 굴러 모서리가 닳았어요.', 'The pebbles are round. They rolled in flowing water for a long time and their corners wore away.') },
];
const GZ = { L: 90, wall: -8, flo: 8, slope: 28, fade: 18, Pm: 14.4 };   // 골: 길이 · 서쪽 벽 · 바닥 동쪽 끝 · 동쪽 비탈 끝(v) · 섞임 · 고원 높이(= 폭포 위 · 바닥 끝 2.4 + 12)
const CZ = { R: 80, H: 35, rim: 30, flr: 10, fh: 22, gap: 0.32, out: 112 };   // 봉: 반지름 · 높이 · 테두리 · 분화구 바닥 반지름 · 바닥 높이 · 터진 쪽 반폭(rad) · 판에서 가운데까지
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · edges() → D.edges · geo() → { X, BZ1, EZ1, TY, base(x, z) = 판 밖 땅 높이(TY 기준) } · rgb(hex) · noise(x, z) · rng(씨앗)
//   mat() → { mtn, river, pond } · geos(g) · fogm(m) · rc(g, f) · col(상자) · box(…) · sign(x, z, ry, 글, y0) · enth · on() · lang() · esc · openP · closeP · skUp · bagAdd · tools() · shoot() · busy()
export function createXp(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], esc = t => A.esc(t);
  const DUST = new T3.Color(0xd2c6b0), _m = new T3.Matrix4(), _q = new T3.Quaternion(), _v = new T3.Vector3(), _s = new T3.Vector3(), _c = new T3.Color(), _e = new T3.Euler();
  let E = [], G = null, secQ = 0, dead = false, PILE = null, SLAB = null, MARK = null, MATI = null, SITES = [], colSel = '', colMsg = '';
  const told = {};
  const S = () => { const s = A.GAME.S; let x = s.xp; if (!x || typeof x !== 'object' || Array.isArray(x)) x = s.xp = {}; if (!x.fos || typeof x.fos !== 'object') x.fos = {}; if (!Array.isArray(x.col)) x.col = []; if (!x.st || typeof x.st !== 'object') x.st = {}; return x; };
  const day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark(), toast = (t, s) => map.hud.toast(t, s || 3), tone = (...a) => { if (map.tone) map.tone(...a); };

  // ───────── 자리 잡기(짓기마다 · drawSkirt 안에서) ─────────
  function prep() { G = A.geo(); E = []; for (const d of A.edges() || []) {
    if (d.k === 'gorge') { const gx = G.X(d.at[0]), gz0 = G.BZ1 + 14; E.push({ d, k: 'gorge', id: d.id || 'gorge', gx, gz0, x0: gx - 58, x1: gx + 66, z0: G.BZ1 + 6, z1: gz0 + GZ.L + 40 }); }
    else if (d.k === 'crater') { const cx = G.X(d.at[0]), cz = G.BZ1 + (d.out || CZ.out) + 8, r = CZ.R + 32; E.push({ d, k: 'crater', id: d.id || 'crater', cx, cz, x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r }); } } }
  const foot = (e, x, z) => x >= e.x0 && x <= e.x1 && z >= e.z0 && z <= e.z1;
  const edgeOf = (x, z) => { for (const e of E) if (foot(e, x, z)) return e; return null; };
  // 섞임(0 = 판 밖 땅 그대로 · 1 = 이 땅 모양)
  function wOf(e, x, z) { if (e.k === 'gorge') { const F = GZ.fade; return ss(e.x0, e.x0 + F, x) * ss(e.x1, e.x1 - F, x) * ss(e.z0, e.z0 + F, z) * ss(e.z1, e.z1 - F, z); } return ss(CZ.R + 30, CZ.R + 8, Math.hypot(x - e.cx, z - e.cz)); }
  // 골: 판 밖 땅 위 높이(m) — u = 어귀에서 남쪽 · v = 골 가운데에서 동쪽
  const gF = u => 1.6 + 0.8 * Math.min(1, Math.max(0, u / GZ.L)), gP = u => 0.6 + (GZ.Pm - 0.6) * ss(-8, 30, u);
  const gFloor = u => Math.min(gF(u), gP(u)), gSlope = (u, v) => { const f = gFloor(u); return f + (gP(u) - f) * (v - GZ.flo) / (GZ.slope - GZ.flo); };
  const POOL = { v: 0, u: GZ.L - 7, r: 7.4 };
  function gBump(u, v) { if (u > GZ.L) return GZ.Pm; if (v < GZ.wall) return gP(u); if (v <= GZ.flo) { const f = gFloor(u), dp = Math.hypot(v - POOL.v, u - POOL.u); return dp < POOL.r + 0.4 ? f - 1.0 * ss(POOL.r + 0.4, POOL.r - 3.2, dp) : f; } if (v < GZ.slope) return gSlope(u, v); return gP(u); }
  // 봉: 원뿔(바깥 비탈) + 분화구(안쪽 사발) + 마을 쪽(북)으로 터진 골(말굽꼴) · 바깥 끝 0.6
  function cBump(dx, dz) { const r = Math.hypot(dx, dz), { R, H, rim, flr, fh } = CZ; let h = r < rim ? fh + (H - fh) * ss(flr, rim, r) : r < R ? 0.6 + (H - 0.6) * (1 - (r - rim) / (R - rim)) : 0.6;
    const a = Math.abs(Math.atan2(dx, -dz)), s = 1 - ss(CZ.gap * 0.55, CZ.gap, a); if (s > 0 && r > flr) { const g = Math.max(0.6, fh * (1 - (r - flr) / (R + 6 - flr))); h = h + (Math.min(h, g) - h) * s; } return h; }
  const bump = (e, x, z) => e.k === 'gorge' ? gBump(z - e.gz0, x - e.gx) : cBump(x - e.cx, z - e.cz);
  const hEdge = (e, x, z) => { const b = G.base(x, z), w = wOf(e, x, z); return b - 0.5 + w * (bump(e, x, z) + 0.5); };

  // ───────── 땅 판(작은 메시 하나 · 8m 칸 + 벽·물가 자리 줄) ─────────
  const axis = (a0, a1, st, extra) => { const o = []; for (let v = a0; v <= a1 + 0.01; v += st) o.push(v); if (o[o.length - 1] < a1 - 0.01) o.push(a1);   /* 끝 줄 = 발자국 끝 그대로(몸 높이가 판 끝에서 잘리지 않게) */ for (const v of extra) if (v > a0 && v < a1 && !o.some(q => Math.abs(q - v) < 0.12)) o.push(v); return o.sort((a, b) => a - b); };
  function grid(e) { let xs, zs;
    if (e.k === 'gorge') { const xe = [-8.3, -8, -4, 0, 4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28].map(v => e.gx + v), ze = []; for (let u = -8; u <= 32; u += 4) ze.push(e.gz0 + u); for (const u of [GZ.L - 14.4, GZ.L - 10.5, GZ.L - 7, GZ.L - 3.5, GZ.L, GZ.L + 0.3, GZ.L + 5]) ze.push(e.gz0 + u); for (const f of FINDS) ze.push(e.gz0 + f.u - 2, e.gz0 + f.u + 2);
      xs = axis(e.x0, e.x1, 8, xe); zs = axis(e.z0, e.z1, 8, ze); }
    else { const R9 = e.x1 - e.cx, ex = [], ez = []; for (let r = -40; r <= 40; r += 4) { ex.push(e.cx + r); ez.push(e.cz + r); } xs = axis(e.x0, e.x1, 8, ex); zs = axis(e.z0, e.z1, 8, ez); void R9; }
    const nx = xs.length, nz = zs.length, H = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) H[j * nx + i] = hEdge(e, xs[i], zs[j]); e.xs = xs; e.zs = zs; e.H = H; }
  const bs = (L9, v) => { let lo = 0, hi = L9.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L9[m] <= v) lo = m; else hi = m - 1; } return lo; };
  // 판 삼각형 그대로(a·d·b / a·c·d — 판 밖 땅 skirtH와 같은 나눔)
  function meshH(e, x, z) { const { xs, zs, H } = e, n = xs.length, i = bs(xs, x), j = bs(zs, z), fx = Math.min(1, Math.max(0, (x - xs[i]) / (xs[i + 1] - xs[i]))), fz = Math.min(1, Math.max(0, (z - zs[j]) / (zs[j + 1] - zs[j]))), a = H[j * n + i], b = H[j * n + i + 1], c = H[(j + 1) * n + i], d = H[(j + 1) * n + i + 1];
    return fx >= fz ? a + (b - a) * fx + (d - b) * fz : a + (d - c) * fx + (c - a) * fz; }
  // 색(판 밖 땅 색 skC와 섞임 · 계절 다시 칠하기도 이 함수)
  function tCol(e, x, h, z, ny, skC) { const base = skC(x, h, z, ny), w = wOf(e, x, z); if (w < 0.002) return base; const n9 = A.noise(x / 5.3, z / 5.3), n2 = A.noise(x / 17 + 9, z / 17); let c;
    if (e.k === 'gorge') { const u = z - e.gz0, v = x - e.gx, b = bump(e, x, z);
      if (u > GZ.L + 0.15 || v < GZ.wall - 0.15 || v >= GZ.slope - 0.3 || b > GZ.Pm - 0.4 && v > GZ.flo) c = base;
      else if (v <= GZ.flo) { c = mix(A.rgb(0xb5a890), A.rgb(0x988c77), n9); if (Math.hypot(v - POOL.v, u - POOL.u) < POOL.r + 0.6) c = mix(c, A.rgb(0x6f675a), 0.5); }
      else { const bi = bandAt(b); c = A.rgb(BANDS[bi].hex, 0.92 + 0.14 * n9); if (b > GZ.Pm - 1.4) c = mix(c, base, 0.5); } }
    else { const dx = x - e.cx, dz = z - e.cz, r = Math.hypot(dx, dz); c = mix(A.rgb(0x8f4b35), A.rgb(0x6d3a2b), n9); if (n2 > 0.68) c = mix(c, A.rgb(0x4d4743), 0.7);
      const gr = ss(50, 78, r) * (0.5 + 0.6 * n2); if (gr > 0) c = mix(c, base, Math.min(1, gr)); }
    return mix(base, c, w); }
  // 판 + 벽 + 돌을 한 메시로(그리기 1) · 벽·돌 꼭짓점은 계절 칠하기에서 빠짐(땅 높이와 다름 → null)
  function buildMesh(e, group, skC) { grid(e); const { xs, zs, H } = e, nx = xs.length, nz = zs.length, P = [], N = [], C = [], I = [], TY = G.TY;
    const slopeAt = (L9, H9, k, st) => { const a = k > 0 ? (H9(k) - H9(k - 1)) / (L9[k] - L9[k - 1]) : null, b = k < L9.length - 1 ? (H9(k + 1) - H9(k)) / (L9[k + 1] - L9[k]) : null; if (a == null) return b; if (b == null) return a; const sa = Math.abs(a) > st, sb = Math.abs(b) > st; return sa && !sb ? b : sb && !sa ? a : (a + b) / 2; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const h = H[j * nx + i], gx = slopeAt(xs, k => H[j * nx + k], i, 2.2), gz = slopeAt(zs, k => H[k * nx + i], j, 2.2), l = Math.hypot(gx, 1, gz); P.push(xs[i], TY + h, zs[j]); N.push(-gx / l, 1 / l, -gz / l); const c = tCol(e, xs[i], h, zs[j], 1 / l, skC); C.push(c[0], c[1], c[2]); }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; I.push(a, d, b, a, c, d); }
    let nv = nx * nz; const quad = (p0, p1, p2, p3, n, col) => { for (const p of [p0, p1, p2, p3]) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); } I.push(nv, nv + 1, nv + 2, nv, nv + 2, nv + 3); nv += 4; };
    const band9 = (b, k) => A.rgb(BANDS[bandAt(b)].hex, 0.9 + 0.12 * A.noise(k * 0.37 + b * 0.11, b * 0.3));
    if (e.k === 'gorge') { const xF = e.gx + GZ.wall + 0.1, xB = e.gx + GZ.wall - 0.4, yb = (x, z, b) => TY + G.base(x, z) - 0.5 + wOf(e, x, z) * (b + 0.5);   /* 벽 높이도 땅 판과 같은 섞임(골 어귀 = 판 쪽으로 낮아짐) */
      const LOS = BANDS.map(q => q.lo).filter(q => q > -50).reverse();
      // 서쪽 벽(동쪽을 봄): 2m 토막 · 띠마다 한 장 · 위 = 고원 + 8cm 덮개 · 몸 막이(토막마다 · 위 = 낮은 끝)
      for (let u = 0; u < GZ.L - 0.01; u += 2) { const ua = u, ub = Math.min(GZ.L - 0.1, u + 2), za = e.gz0 + ua, zb = e.gz0 + ub, fA = gFloor(ua), fB = gFloor(ub), pA = gP(ua), pB = gP(ub);
        const topA = yb(xF, za, pA) + 0.08, topB = yb(xF, zb, pB) + 0.08, botA = yb(xF, za, fA - 0.3), botB = yb(xF, zb, fB - 0.3); if (Math.min(topA - yb(xF, za, fA), topB - yb(xF, zb, fB)) < 0.38) continue;
        const cuts = [-50, ...LOS, 99];
        for (let k = 0; k < cuts.length - 1; k++) { const loA = Math.max(yb(xF, za, cuts[k]), botA), loB = Math.max(yb(xF, zb, cuts[k]), botB), hiA = Math.min(yb(xF, za, cuts[k + 1]), topA), hiB = Math.min(yb(xF, zb, cuts[k + 1]), topB); if (hiA <= loA + 0.01 && hiB <= loB + 0.01) continue;
          quad([xF, loA, za], [xF, Math.max(loA, hiA), za], [xF, Math.max(loB, hiB), zb], [xF, loB, zb], [1, 0, 0], band9(k === 0 ? 2 : cuts[k] + 0.5, u)); }
        const gc = A.rgb(BANDS[0].hex, 0.95); quad([xB, TY + meshH(e, xB, za) + 0.08, za], [xB, TY + meshH(e, xB, zb) + 0.08, zb], [xF, topB, zb], [xF, topA, za], [0, 1, 0], gc);
        A.col({ x0: xB, x1: xF, z0: za, z1: zb, y0: Math.min(botA, botB) - 1, y1: Math.min(topA, topB) }); }
      // 남쪽 끝 벽(북쪽을 봄 · 폭포 뒤): v −8.1 ~ 28
      const zW = e.gz0 + GZ.L - 0.1, zK = e.gz0 + GZ.L + 0.4, pL = GZ.Pm;
      for (let v = GZ.wall - 0.1; v < GZ.slope - 0.01; v += 2) { const xa = e.gx + v, xb = e.gx + Math.min(GZ.slope, v + 2), ha = meshH(e, xa, zW) - 0.3, hb = meshH(e, xb, zW) - 0.3, ta = yb(xa, zW, pL) + 0.08, tb = yb(xb, zW, pL) + 0.08, cuts = [-50, ...LOS, 99];
        for (let k = 0; k < cuts.length - 1; k++) { const loA = Math.max(yb(xa, zW, cuts[k]), TY + ha), loB = Math.max(yb(xb, zW, cuts[k]), TY + hb), hiA = Math.min(yb(xa, zW, cuts[k + 1]), ta), hiB = Math.min(yb(xb, zW, cuts[k + 1]), tb); if (hiA <= loA + 0.01 && hiB <= loB + 0.01) continue;
          quad([xb, loB, zW], [xa, loA, zW], [xa, Math.max(loA, hiA), zW], [xb, Math.max(loB, hiB), zW], [0, 0, -1], band9(k === 0 ? 2 : cuts[k] + 0.5, v + 40)); }
        quad([xb, tb, zW], [xa, ta, zW], [xa, TY + meshH(e, xa, zK) + 0.08, zK], [xb, TY + meshH(e, xb, zK) + 0.08, zK], [0, 1, 0], A.rgb(BANDS[0].hex, 0.95)); }
      A.col({ x0: e.gx + GZ.wall - 0.4, x1: e.gx + GZ.slope, z0: zW, z1: zK, y0: yb(e.gx, zW, gFloor(GZ.L)) - 2, y1: yb(e.gx, zW, pL) + 0.08 });
      // 골 어귀 쪽 도구 상자(나무 · 정적)
      { const x = e.gx + 5.5, z = e.gz0 + 9, y = TY + meshH(e, x, z); A.box(x, y, z, 0.9, 0.55, 0.6, 0, 0x8a5a32); A.box(x, y + 0.55, z, 0.96, 0.07, 0.66, 0, 0x6b4426); A.col({ x0: x - 0.48, x1: x + 0.48, z0: z - 0.33, z1: z + 0.33, y0: y - 0.5, y1: y + 0.62 }); e.box = [x, y, z]; }
      A.sign(e.gx - 4.5, e.gz0 + 4, Math.PI, en() ? 'Layer Gorge — strata and fossils' : '층층골 — 지층과 화석', TY + meshH(e, e.gx - 4.5, e.gz0 + 4)); }
    else { // 까망봉 돌(현무암·송이 · 바닥에 30% 묻힘 · 낮은 다면체)
      const R9 = A.rng('xp:crater:' + e.id); e.rocks = [];
      for (let k = 0; k < 46; k++) { const a = R9() * 6.2832, r = k < 14 ? R9() * (CZ.flr + 6) : CZ.flr + R9() * (CZ.R - 18), x = e.cx + Math.sin(a) * r, z = e.cz - Math.cos(a) * r; if (Math.abs(Math.atan2(x - e.cx, -(z - e.cz))) < CZ.gap * 0.8 && r > CZ.flr - 2 && r < CZ.R - 10 && R9() < 0.8) continue;
        const s = 0.45 + R9() * (k < 14 ? 0.9 : 1.3), y = TY + meshH(e, x, z), col = A.rgb(R9() < 0.5 ? 0x4c4643 : 0x7e4030, 0.9 + R9() * 0.2), V = [[0, 1.0, 0], [1, 0.1, 0], [0, 0.15, 1], [-1, 0.05, 0], [0, 0.1, -1], [0, -0.7, 0]].map(([a9, b9, c9], q) => { const j9 = 0.75 + R9() * 0.5; return [x + a9 * s * j9 * (q === 0 || q === 5 ? 0.6 : 1), y + (b9 - 0.3) * s * 0.8 * j9, z + c9 * s * j9]; });
        for (const [p, q, t] of [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]]) { const A9 = V[p], B9 = V[q], C9 = V[t], ux = B9[0] - A9[0], uy = B9[1] - A9[1], uz = B9[2] - A9[2], vx = C9[0] - A9[0], vy = C9[1] - A9[1], vz = C9[2] - A9[2]; let n0 = uy * vz - uz * vy, n1 = uz * vx - ux * vz, n2 = ux * vy - uy * vx; const nl = Math.hypot(n0, n1, n2) || 1; n0 /= nl; n1 /= nl; n2 /= nl;
          for (const Q of [A9, C9, B9]) { P.push(Q[0], Q[1], Q[2]); N.push(-n0, -n1, -n2); C.push(col[0], col[1], col[2]); } I.push(nv, nv + 1, nv + 2); nv += 3; }
        if (s > 0.9) e.rocks.push([+x.toFixed(1), +z.toFixed(1)]); }
      const sx = e.cx + 6, sz = e.cz - CZ.R - 2; A.sign(sx, sz, Math.PI, en() ? 'Kkamang Cone — a resting volcano' : '까망봉 — 쉬는 작은 화산', TY + meshH(e, sx, sz)); }
    { let n = 0, bad = 0; for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (Math.hypot(nx, ny, nz) < 1e-6) continue; n++; if (nx * (N[a] + N[b] + N[c]) + ny * (N[a + 1] + N[b + 1] + N[c + 1]) + nz * (N[a + 2] + N[b + 2] + N[c + 2]) < 0) bad++; } e.wind = { n, bad }; }   /* 시험: 앞면(감기 차례)이 넣은 법선 쪽인가(벽·덮개·돌 포함) — 짓기 때 한 번 */
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere(); g.attributes.color.setUsage(T3.DynamicDrawUsage); A.geos(g);
    const m = new T3.Mesh(g, A.mat().mtn); m.matrixAutoUpdate = false; m.receiveShadow = false; m.userData.fx = 1; m.userData.k9 = 'xp'; m.userData.xp = 1; group.add(m); A.fogm(m);
    A.rc(g, (x, y, z, ny) => { if (!foot(e, x, z) || Math.abs(y - TY - meshH(e, x, z)) > 0.05) return null; return tCol(e, x, y - TY, z, ny, skC); }); }
  // 폭포 · 위 냇물 · 소 · 골 바닥 냇물(물 재질 둘 = 강 물결이 흘러내림 · 연못)
  function buildWater(e, group) { const TY = G.TY, R = [], RC9 = [], RU = [], RN = [], W = [], WC = [], WU = [], WN = [], foamC = [0.92, 0.97, 0.98], blueC = [0.55, 0.8, 0.9], deepC = [0.25, 0.55, 0.66];
    const rq = (p0, p1, p2, p3, c0, c1, u0, u1, v0, v1) => { for (const [p, c, u, v] of [[p0, c0, u0, v0], [p1, c0, u1, v0], [p2, c1, u1, v1], [p0, c0, u0, v0], [p2, c1, u1, v1], [p3, c1, u0, v1]]) { R.push(p[0], p[1], p[2]); RC9.push(c[0], c[1], c[2]); RU.push(u, v); RN.push(0, 0, -1); } };
    const zW = e.gz0 + GZ.L - 0.1, top = TY + G.base(e.gx, zW) + GZ.Pm + 0.12, poolY = TY + meshH(e, e.gx + POOL.r * 0.7, e.gz0 + POOL.u) - 0.22; e.poolY = poolY;
    const xs9 = [-2.6, -1.3, 0, 1.3, 2.6], rows = 9; for (let r = 0; r < rows; r++) { const t0 = r / rows, t1 = (r + 1) / rows, y0 = top + (poolY - 0.05 - top) * t0, y1 = top + (poolY - 0.05 - top) * t1, z0 = zW - 0.3 - 0.9 * t0 * t0, z1 = zW - 0.3 - 0.9 * t1 * t1, c0 = t0 < 0.12 || t0 > 0.85 ? foamC : mix(blueC, foamC, 0.35), c1 = t1 < 0.12 || t1 > 0.85 ? foamC : mix(blueC, foamC, 0.35);
      for (let k = 0; k < xs9.length - 1; k++) { const xa = e.gx + xs9[k], xb = e.gx + xs9[k + 1]; rq([xa, y0, z0], [xb, y0, z0], [xb, y1, z1], [xa, y1, z1], c0, c1, xs9[k] / 3, xs9[k + 1] / 3, (top - y0) / 3, (top - y1) / 3); } }
    // 폭포 위 냇물(고원 위 6m · 벽 끝으로 흘러감)
    { const zt = e.gz0 + GZ.L + 5, ya = TY + meshH(e, e.gx, zt) + 0.07, yb = top - 0.05; for (let k = 0; k < xs9.length - 1; k++) { const xa = e.gx + xs9[k], xb = e.gx + xs9[k + 1]; for (const [p, c, u, v] of [[[xa, ya, zt], blueC, xs9[k] / 3, -2], [[xb, ya, zt], blueC, xs9[k + 1] / 3, -2], [[xb, yb, zW - 0.3], foamC, xs9[k + 1] / 3, 0], [[xa, ya, zt], blueC, xs9[k] / 3, -2], [[xb, yb, zW - 0.3], foamC, xs9[k + 1] / 3, 0], [[xa, yb, zW - 0.3], foamC, xs9[k] / 3, 0]]) { R.push(p[0], p[1], p[2]); RC9.push(c[0], c[1], c[2]); RU.push(u, v); RN.push(0, 1, 0); } } }
    // 소(둥근 물낯) · 골 바닥 냇물(v 0~4 = 땅 판 한 칸 그대로 + 7cm)
    const pc = [e.gx + POOL.v, e.gz0 + POOL.u], seg = 22; for (let k = 0; k < seg; k++) { const a0 = k / seg * 6.2832, a1 = (k + 1) / seg * 6.2832; for (const [x, z, c] of [[pc[0], pc[1], deepC], [pc[0] + Math.cos(a1) * POOL.r, pc[1] + Math.sin(a1) * POOL.r, null], [pc[0] + Math.cos(a0) * POOL.r, pc[1] + Math.sin(a0) * POOL.r, null]]) { const c9 = c || (z > pc[1] + 3 ? foamC : blueC); W.push(x, poolY, z); WC.push(c9[0], c9[1], c9[2]); WU.push(x / 9, z / 9); WN.push(0, 1, 0); } }
    { const zs = e.zs.filter(z => z >= e.gz0 + 2 && z <= e.gz0 + GZ.L - 10.4), xa = e.gx, xb = e.gx + 4; for (let j = 0; j < zs.length - 1; j++) { const za = zs[j], zb = zs[j + 1], q = [[xa, za], [xb, za], [xb, zb], [xa, zb]].map(([x, z]) => [x, TY + meshH(e, x, z) + 0.07, z]); for (const k of [0, 2, 1, 0, 3, 2]) { const p = q[k]; W.push(p[0], p[1], p[2]); WC.push(blueC[0], blueC[1], blueC[2]); WU.push(p[0] / 9, p[2] / 9); WN.push(0, 1, 0); } } }
    const mk = (P, C, U, N9, mt) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N9, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.computeBoundingSphere(); A.geos(g); const m = new T3.Mesh(g, mt); m.matrixAutoUpdate = false; m.userData.fx = 1; m.userData.k9 = 'xpw'; group.add(m); A.fogm(m); return m; };
    mk(R, RC9, RU, RN, A.mat().river); mk(W, WC, WU, WN, A.mat().pond); }

  // ───────── 흙더미·돌판·무늬(인스턴스 셋 · 자리 상태가 바뀔 때만 다시 놓음) ─────────
  const MK = { f1: [[0, 0, 0.5, 0.035, 0], ...[-0.16, -0.05, 0.06, 0.17].flatMap((t, k) => [[t, 0.07, 0.15, 0.03, 0.75 - k * 0.05], [t, -0.07, 0.15, 0.03, -0.75 + k * 0.05]]).slice(0, 8)],
    f2: [-0.9, -0.45, 0, 0.45, 0.9].map(a => [Math.sin(a) * 0.1, Math.cos(a) * 0.1 - 0.12, 0.24, 0.03, a + Math.PI / 2]).concat([[0, -0.13, 0.12, 0.05, 0]]),
    f3: [-0.18, -0.06, 0.06, 0.18].map(t => [0, t, 0.62, 0.035, 0]), f4: [[-0.25, 0.08, 0.1, 0.09, 0.3], [-0.05, -0.1, 0.12, 0.1, 1.1], [0.14, 0.1, 0.09, 0.09, 0.4], [0.3, -0.06, 0.11, 0.1, 2.0], [0.02, 0.16, 0.08, 0.08, 0.9]] };
  function inst() { if (PILE) return; MATI = new T3.MeshLambertMaterial({ color: 0xffffff, flatShading: true }); const mk = (g, n) => { const o = new T3.InstancedMesh(g, MATI, n); o.frustumCulled = false; o.count = 0; o.setColorAt(0, _c.set(0xffffff)); o.instanceColor.needsUpdate = true; o.userData.fx = 1; return o; };
    PILE = mk(new T3.IcosahedronGeometry(1, 0), 6); SLAB = mk(new T3.BoxGeometry(1, 1, 1), 6); MARK = mk(new T3.BoxGeometry(1, 1, 1), 40); }
  function sitesPrep() { SITES = []; const e = E.find(q => q.k === 'gorge'); if (!e) return; for (const f of FINDS) { const x = e.gx + GZ.wall + 1.15, z = e.gz0 + f.u, y = G.TY + meshH(e, x, z); SITES.push({ f, x, y, z, e }); } }
  function sitesDraw() { if (!PILE) return; const st = S().st; let np = 0, ns = 0, nm = 0;
    for (const s of SITES) { const k = st[s.f.id] | 0, hex = BANDS[s.f.band].hex;
      if (k === 0) { PILE.setMatrixAt(np, _m.compose(_v.set(s.x, s.y + 0.05, s.z), _q.setFromEuler(_e.set(0, s.f.u * 0.7, 0)), _s.set(0.95, 0.5, 0.8))); PILE.setColorAt(np, _c.setHex(hex).multiplyScalar(0.85)); np++; }
      else { SLAB.setMatrixAt(ns, _m.compose(_v.set(s.x, s.y + 0.07, s.z), _q.setFromEuler(_e.set(0, 0.25, 0)), _s.set(1.0, 0.14, 0.72))); _c.setHex(hex); if (k === 1) _c.lerp(DUST, 0.6); SLAB.setColorAt(ns, _c); ns++;
        if (k >= 2) for (const [a, b, l, w, r] of MK[s.f.id]) { const cs = Math.cos(0.25), sn = Math.sin(0.25), px = s.x + a * cs + b * sn, pz = s.z - a * sn + b * cs; MARK.setMatrixAt(nm, _m.compose(_v.set(px, s.y + 0.145, pz), _q.setFromEuler(_e.set(0, 0.25 + r, 0)), _s.set(l, 0.012, w))); MARK.setColorAt(nm, _c.setHex(s.f.band === 4 ? 0xc9c0aa : 0x3a342b)); nm++; } } }
    for (const [o, n] of [[PILE, np], [SLAB, ns], [MARK, nm]]) { o.count = n; o.visible = n > 0; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; } }
  // 마을 짓기 때(drawSkirt): 자리 → 땅 판 → 물 → 흙더미
  function draw(group, skC) { prep(); for (const e of E) { buildMesh(e, group, skC); if (e.k === 'gorge') buildWater(e, group); } inst(); sitesPrep(); for (const o of [PILE, SLAB, MARK]) group.add(o); sitesDraw(); }
  void _c;

  // ───────── 바깥에서 묻는 것(몸 높이·걷기·이름·나무 비킴·장소) ─────────
  function h(x, z) { for (const e of E) if (e.H && foot(e, x, z)) return meshH(e, x, z); return null; }
  function trail(x, z) { for (const e of E) { if (e.k === 'gorge') { if (Math.abs(x - e.gx - 1) < 9 && z > G.EZ1 - 8 && z < e.gz0 + 4) return true; if (x > e.gx - 44 && x < e.gx + 50 && z >= e.gz0 - 2 && z < e.gz0 + GZ.L + 26) return true; }
    else { const dx = x - e.cx, dz = z - e.cz; if (Math.abs(dx) < 10 && z > G.EZ1 - 8 && z < e.cz - CZ.R + 12) return true; if (dx * dx + dz * dz < (CZ.R + 14) * (CZ.R + 14)) return true; } } return false; }
  const nameOf = e => (en() ? e.d.en : e.d.name) || e.d.name;
  function nameAt(x, z) { for (const e of E) { if (e.k === 'gorge' ? x > e.gx - 44 && x < e.gx + 50 && z >= e.gz0 - 6 && z < e.gz0 + GZ.L + 26 : Math.hypot(x - e.cx, z - e.cz) < CZ.R + 8) return nameOf(e); } return null; }
  const footAny = (x, z) => { for (const e of E) if (foot(e, x, z) && wOf(e, x, z) > 0.02) return true; return false; };
  function places() { const o = []; for (const e of E) { if (e.k === 'gorge') o.push({ id: 'xp_' + e.id, name: e.d.name, en: e.d.en, kind: 'prop', nat: true, x: e.gx, z: e.gz0 + 40, door: [e.gx + 2, e.gz0 + 24], icon: '🦴', sym: '◆', ai: e.d.ai || '✨', prop: true });
    else o.push({ id: 'xp_' + e.id, name: e.d.name, en: e.d.en, kind: 'prop', nat: true, x: e.cx, z: e.cz, door: [e.cx, e.cz - 3], icon: '⛰', sym: '⛰', ai: e.d.ai || '✨', prop: true }); } return o; }

  // ───────── E 자리(짓기마다 · setEntries) ─────────
  function init() { if (!A.on()) return; const e = E.find(q => q.k === 'gorge');
    if (e && e.box) { const [x, y, z] = e.box; A.enth.push(map.interact.add({ kind: 'game', x, z, y: y + 0.6, r: 2.0, label: en() ? '🧰 Borrow dig tools' : '🧰 발굴 도구 빌리기', use: () => borrow() })); }
    for (const s of SITES) A.enth.push(map.interact.add({ kind: 'game', x: s.x, z: s.z, y: s.y + 0.4, r: 1.9, label: en() ? '🦴 Dig spot' : '🦴 발굴 자리', use: () => siteHint(s) }));
    const c = E.find(q => q.k === 'crater'); if (c) { const R9 = c.rocks.find(r => Math.hypot(r[0] - c.cx, r[1] - c.cz) < CZ.flr + 6) || [c.cx + 2, c.cz]; A.enth.push(map.interact.add({ kind: 'game', x: R9[0], z: R9[1], y: G.TY + meshH(c, R9[0], R9[1]) + 0.6, r: 2.4, label: en() ? '🔍 Look at the stones' : '🔍 돌 살펴보기', use: () => crater() })); } }
  function borrow() { const T = A.tools(); if (!T) return; const a = T.api.give('broom'), b = T.api.give('lens'); tone(880, 0, 0.06, 'triangle', 0.05);
    toast(a || b ? (en() ? '🧰 You borrowed a broom and a magnifier. Shovel (2) → broom (5) → magnifier (4)' : '🧰 빗자루와 돋보기를 빌렸어요. 삽(2) → 빗자루(5) → 돋보기(4) 차례로 써요') : (en() ? '🧰 Shovel (2) → broom (5) → magnifier (4) at the soil heaps by the wall' : '🧰 벽 밑 흙더미에 삽(2) → 빗자루(5) → 돋보기(4) 차례로 써요'), 4); }
  const NEXT = [T2('⛏ 삽(2)을 들고 흙더미를 겨눠 걷어 내요', '⛏ Hold the shovel (2) and clear the soil heap'), T2('🧹 빗자루(5)로 돌판을 살살 쓸어요', '🧹 Gently sweep the stone slab with the broom (5)'), T2('🔍 돋보기(4)로 돌판 무늬를 들여다봐요', '🔍 Look at the pattern with the magnifier (4)'), T2('🔍 돋보기로 다시 보거나 수첩 🦴 지층에 붙여요', '🔍 Look again, or add it to 🦴 Strata in your notebook')];
  function siteHint(s) { const k = S().st[s.f.id] | 0; if (k >= 3) { card(s.f); return; } toast(L(NEXT[k]), 3.2); }
  // 도구 띠가 묻는 것: 고리 자리 곁 흙더미(그 도구 차례일 때만 붙음 · 아니면 hint 글)
  const want = { shovel: 0, broom: 1, lens: 2 };
  function near(x, z, tool) { let b = null, bd = 1.7; for (const s of SITES) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s; } } if (!b) return null; const k = S().st[b.f.id] | 0; if (!(k === want[tool] || (tool === 'lens' && k === 3))) return null; return { x: b.x, y: b.y + 0.12, z: b.z, id: b.f.id }; }
  function hint(x, z, tool) { let b = null, bd = 2.2; for (const s of SITES) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s; } } if (!b) return null; const k = S().st[b.f.id] | 0; if (k === want[tool] || (tool === 'lens' && k === 3)) return null; return L(NEXT[Math.min(3, k)]); }
  function lensAt(x, z) { const c = E.find(q => q.k === 'crater'); if (!c || !c.H) return null; const r = Math.hypot(x - c.cx, z - c.cz); if (r > CZ.R - 6) return null; return { x, y: G.TY + meshH(c, x, z) + 0.05, z, kind: 'xrock', key: 'crater' }; }
  function use(tool, id) { if (id === 'crater') { crater(); return true; } const s = SITES.find(q => q.f.id === id); if (!s) return false; const X9 = S(), k = X9.st[id] | 0, e = en();
    if (tool === 'shovel' && k === 0) { X9.st[id] = 1; mark(); sitesDraw(); tone(523, 0, 0.08, 'triangle', 0.05); toast(e ? '⛏ You cleared the heap — a stone slab that fell from the wall! Now sweep it with the broom (5)' : '⛏ 흙더미를 걷어 냈어요. 벽에서 떨어진 돌판이 나왔어요! 이제 빗자루(5)로 쓸어요', 3.6); return true; }
    if (tool === 'broom' && k === 1) { X9.st[id] = 2; mark(); sitesDraw(); tone(784, 0, 0.08, 'triangle', 0.05); toast(e ? '🧹 The dust is gone and a pattern shows! Look closely with the magnifier (4)' : '🧹 먼지를 쓸었더니 무늬가 드러났어요! 돋보기(4)로 들여다봐요', 3.6); return true; }
    if (tool === 'lens' && k >= 2) { if (k === 2) { X9.st[id] = 3; if (!X9.fos[id]) X9.fos[id] = [s.f.band, day()]; mark(); sitesDraw(); A.skUp('look', 2, 'xp:fos'); tone(988, 0, 0.1, 'triangle', 0.05); tone(1319, 0.1, 0.12, 'triangle', 0.05); } card(s.f); return true; }
    return false; }
  // ───────── 창: 화석 관찰 카드 · 지층 기둥(수첩 🦴) · 까망봉 돌 ─────────
  const sw = (hex, w) => '<span style="display:inline-block;width:' + (w || 22) + 'px;height:16px;vertical-align:-3px;border:2px solid #2b2420;border-radius:4px;background:#' + hex.toString(16).padStart(6, '0') + '"></span>';
  const ART = { f1: '<path d="M20 60 L84 30" stroke="#d8cfba" stroke-width="3"/>' + [0, 1, 2, 3, 4, 5].map(k => { const x = 28 + k * 10, y = 56 - k * 4.7; return '<path d="M' + x + ' ' + y + ' l-6 -12 M' + x + ' ' + y + ' l10 8" stroke="#d8cfba" stroke-width="2.4"/>'; }).join(''),
    f2: [-50, -25, 0, 25, 50].map(a => '<path d="M52 66 L' + (52 + Math.sin(a * Math.PI / 180) * 34).toFixed(1) + ' ' + (66 - Math.cos(a * Math.PI / 180) * 34).toFixed(1) + '" stroke="#3a342b" stroke-width="2.6"/>').join('') + '<path d="M18 52 Q52 6 86 52" stroke="#3a342b" stroke-width="2.6" fill="none"/>',
    f3: [26, 38, 50, 62].map(y => '<path d="M14 ' + y + ' q9 -7 18 0 t18 0 t18 0 t18 0 t18 0" stroke="#3a342b" stroke-width="2.6" fill="none"/>').join(''),
    f4: [[30, 40, 9], [52, 30, 8], [70, 46, 10], [44, 58, 8], [74, 26, 6]].map(([x, y, r]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 0.8) + '" fill="#c9c2b4" stroke="#3a342b" stroke-width="2"/>').join('') };
  function card(f) { if (A.busy() && !document.querySelector('.twn-p')) { toast(en() ? '🦴 Finish what you are doing first, then look again' : '🦴 하던 일을 마치고 다시 살펴봐요', 2.4); return; } const e = en(), X9 = S(), hex = BANDS[f.band].hex, on = X9.col.includes(f.id);
    const P = A.openP('<h3>' + f.ic + ' ' + esc(L(f.t)) + '</h3><div class="st"><svg width="104" height="80" viewBox="0 0 104 80" style="flex:none;border:2px solid #2b2420;border-radius:8px;background:#' + hex.toString(16).padStart(6, '0') + '">' + ART[f.id] + '</svg><span>' + esc(L(f.line)) + '</span></div>'
      + '<div class="sm">' + (e ? 'Slab colour ' : '돌판 색 ') + sw(hex) + (on ? (e ? ' — it is on your strata column.' : ' — 지층 기둥에 붙였어요.') : (e ? ' — which layer of the wall did it fall from? Match the colour on your strata column.' : ' — 벽의 어느 띠에서 떨어졌을까요? 지층 기둥에서 같은 색을 찾아 붙여요.')) + '</div>'
      + '<div class="sm">' + (e ? 'We leave fossils where they are and keep them as photos and notes.' : '화석은 가져가지 않아요. 사진과 수첩에 남겨요.') + '</div>'
      + '<div class="row"><button data-a="col">🦴 ' + (e ? 'Strata column' : '지층 기둥') + '</button><button class="sub" data-a="ph">📷 ' + (e ? 'Photo' : '사진 찍기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'xp');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'x') A.closeP(); else if (a === 'col') { colSel = on ? '' : f.id; colMsg = ''; openCol(); } else if (a === 'ph') { A.closeP(); A.shoot(); } }; }
  function openCol() { const e = en(), X9 = S(), found = FINDS.filter(f => X9.fos[f.id]), free = found.filter(f => !X9.col.includes(f.id)), onB = i => FINDS.filter(f => f.band === i && X9.col.includes(f.id));
    const rows = BANDS.map((b, i) => { const L9 = onB(i), hx = b.hex.toString(16).padStart(6, '0'), dark = i === 4 || i === 2; return '<div data-b="' + i + '" style="display:flex;align-items:center;gap:8px;min-height:38px;padding:4px 10px;background:#' + hx + ';color:' + (dark ? '#fff' : '#2b2420') + ';border:2px solid #2b2420;border-top-width:' + (i ? 0 : 2) + 'px;cursor:' + (colSel ? 'pointer' : 'default') + '">' + (L9.length ? '<b>' + esc(L(b.t)) + '</b> ' + L9.map(f => f.ic + ' ' + esc(L(f.t))).join(' · ') : '<span style="opacity:.75">' + (colSel ? (e ? 'tap to add here' : '여기에 붙이기') : '') + '</span>') + '</div>'; }).join('');
    const tray = free.length ? '<div class="sm">' + (e ? 'Found, not yet on the column — pick one, then tap the layer with the same colour:' : '찾았지만 아직 안 붙인 것 — 하나를 고르고, 같은 색 띠를 눌러요:') + '</div><div class="row">' + free.map(f => '<button class="' + (colSel === f.id ? '' : 'sub') + '" data-f="' + f.id + '">' + sw(BANDS[f.band].hex, 16) + ' ' + f.ic + ' ' + esc(L(f.t)) + '</button>').join('') + '</div>' : '';
    const q = qPair(), qh = q && !X9.q ? '<div class="grp">' + (e ? 'Think' : '생각해 봐요') + '</div><div class="sm">' + (e ? 'Was the <b>' + esc(L(BANDS[q.a].t)) + '</b> laid down before or after the <b>' + esc(L(BANDS[q.b].t)) + '</b>?' : '<b>' + esc(L(BANDS[q.a].t)) + '</b>은 <b>' + esc(L(BANDS[q.b].t)) + '</b>보다 먼저 쌓였을까요, 나중에 쌓였을까요?') + '</div><div class="row"><button class="sub" data-q="before">' + (e ? 'Before' : '먼저') + '</button><button class="sub" data-q="after">' + (e ? 'After' : '나중') + '</button></div>'
      : X9.q ? '<div class="sm">' + (e ? 'Lower layers were laid down first, and new layers piled on top. The lower, the older.' : '아래층이 먼저 쌓이고 그 위에 새 층이 쌓여요. 아래에 있을수록 오래된 층이에요.') + '</div>' : '';
    const P = A.openP('<h3>🦴 ' + (e ? 'Strata column' : '지층 기둥') + '</h3><div class="sm">' + (e ? 'The Layer Gorge wall from top to bottom. ' : '층층골 벽을 위에서 아래로 옮긴 그림이에요. ') + (found.length ? '' : (e ? 'Dig the soil heaps under the wall to fill it.' : '벽 밑 흙더미를 발굴해서 채워요.')) + '</div><div style="margin:6px 0">' + rows + '</div>' + (colMsg ? '<div class="sm"><b>' + esc(colMsg) + '</b></div>' : '') + tray + qh
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'xp');
    P.onclick = ev => { const t = ev.target.closest('[data-f],[data-b],[data-q],[data-a]'); if (!t) return; const d = t.dataset;
      if (d.a === 'x') { colSel = ''; colMsg = ''; A.closeP(); return; }
      if (d.f) { colSel = colSel === d.f ? '' : d.f; colMsg = ''; openCol(); return; }
      if (d.b != null && colSel) { const f = FINDS.find(q9 => q9.id === colSel); if (f && f.band === +d.b) { X9.col.push(f.id); mark(); A.skUp('look', 1, 'xp:fos'); tone(1047, 0, 0.1, 'triangle', 0.05); colMsg = (e ? 'Added to the ' : '') + L(BANDS[f.band].t) + (e ? '.' : '에 붙였어요.'); colSel = ''; } else colMsg = e ? 'The colour is different. Compare the slab colour with the layers again.' : '색이 달라요. 돌판 색과 띠 색을 다시 견줘 봐요.'; openCol(); return; }
      if (d.q && q) { if (d.q === q.ans) { X9.q = day(); mark(); A.skUp('look', 3, 'xp:fos'); tone(1047, 0, 0.1, 'triangle', 0.05); tone(1568, 0.1, 0.14, 'triangle', 0.05); colMsg = e ? 'Right!' : '맞아요!'; } else colMsg = e ? 'Read the column from the bottom up. Which layer was on the ground first?' : '기둥 그림을 아래에서 위로 읽어 봐요. 어느 층이 먼저 바닥에 깔렸을까요?'; openCol(); } }; }
  // 물음 짝: 기둥에 붙은 띠 둘 — 붙인 수가 짝수면 아래층을 물음(먼저) · 홀수면 위층을 물음(나중) — 정답 자리가 한쪽에 몰리지 않게
  function qPair() { const X9 = S(), B9 = [...new Set(X9.col.map(id => (FINDS.find(f => f.id === id) || {}).band).filter(b => b != null))].sort((a, b) => a - b); if (B9.length < 2) return null; const up = B9[0], lo = B9[B9.length - 1];
    return X9.col.length % 2 ? { a: up, b: lo, ans: 'after' } : { a: lo, b: up, ans: 'before' }; }
  function crater() { const e = en(), X9 = S(), d = day(), first = X9.sc !== d; if (first) { X9.sc = d; mark(); A.skUp('look', 2, 'xp:crater'); A.bagAdd('⚫', 1, 'xp:crater'); }
    const holes = [[30, 28, 4], [44, 22, 3], [52, 40, 5], [36, 48, 3], [26, 40, 2.5], [48, 54, 3], [58, 30, 2.5], [40, 34, 2]].map(([x, y, r]) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#2a1a14"/>').join(''), grains = [[86, 30, '#2b2b2b'], [100, 26, '#f4f1ea'], [110, 38, '#e8b4a8'], [94, 44, '#2b2b2b'], [106, 52, '#f4f1ea'], [88, 54, '#e8b4a8'], [114, 46, '#2b2b2b'], [98, 36, '#f4f1ea']].map(([x, y, c]) => '<rect x="' + (x - 4) + '" y="' + (y - 3) + '" width="8" height="6" fill="' + c + '" transform="rotate(' + (x * 7 % 60) + ' ' + x + ' ' + y + ')"/>').join('');
    const P = A.openP('<h3>⛰ ' + (e ? 'Kkamang Cone — the crater' : '까망봉 — 분화구') + '</h3><div class="st"><svg width="150" height="86" viewBox="0 0 150 86" style="flex:none"><circle cx="40" cy="38" r="26" fill="#8f4b35" stroke="#2b2420" stroke-width="2"/>' + holes + '<circle cx="100" cy="40" r="26" fill="#d9d4cc" stroke="#2b2420" stroke-width="2"/>' + grains + '<text x="40" y="80" font-size="11" text-anchor="middle" fill="#2b2420">' + (e ? 'scoria · basalt' : '송이 · 현무암') + '</text><text x="100" y="80" font-size="11" text-anchor="middle" fill="#2b2420">' + (e ? 'granite' : '화강암') + '</text></svg><span>'
      + (e ? 'The red-brown stones are scoria and the black ones are basalt. Under the magnifier they are full of little holes — gas escaped as the hot magma cooled.' : '붉은 갈색 돌은 송이, 검은 돌은 현무암이에요. 돋보기로 보면 구멍이 숭숭 뚫려 있어요. 뜨거운 마그마가 식을 때 가스가 빠져나간 자리예요.') + '</span></div>'
      + '<div class="sm">' + (e ? 'Granite, like the stones round the school flower beds, has no holes. You can see big white, black and pink grains instead.' : '학교 둘레석 같은 화강암은 구멍이 없고, 하얀·검은·분홍 알갱이가 크게 보여요.') + '</div>'
      + '<div class="sm">' + (e ? 'This is a small volcano that is resting. Rain on the crater floor soaks into the ground quickly through cracks in the rock.' : '여기는 쉬고 있는 작은 화산이에요. 분화구 바닥에 비가 와도 돌 틈으로 물이 금방 땅속에 스며들어요.') + '</div>'
      + (first ? '<div class="sm">' + (e ? 'You put one small scoria pebble in your bag. What happens if you put it in water?' : '작은 송이 한 알을 가방에 넣었어요. 물에 넣으면 어떻게 될까요?') + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="ph">📷 ' + (e ? 'Photo' : '사진 찍기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'xp');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); else if (b.dataset.a === 'ph') { A.closeP(); A.shoot(); } }; }

  // ───────── 1초 칸: 처음 들어오면 한 줄(하루 한 번 · 저장 X) ─────────
  function tick(dt) { if (dead || !E.length || (secQ += dt) < 1) return; secQ = 0; if (!A.on() || A.busy()) return; const me = map.player.pos(), d = day();
    for (const e of E) { const inn = e.k === 'gorge' ? Math.abs(me.x - e.gx) < 30 && me.z > e.gz0 && me.z < e.gz0 + GZ.L : Math.hypot(me.x - e.cx, me.z - e.cz) < CZ.R; if (!inn || told[e.id] === d) continue; told[e.id] = d;
      toast(e.k === 'gorge' ? (en() ? '🦴 Layer Gorge — the wall has layers of colour. Clear a soil heap with the shovel (2)' : '🦴 층층골 — 벽에 색 띠가 층층이 보여요. 벽 밑 흙더미를 삽(2)으로 걷어 봐요') : (en() ? '⛰ Kkamang Cone — a small resting volcano. Walk into the crater and look at the stones' : '⛰ 까망봉 — 쉬고 있는 작은 화산이에요. 분화구 안으로 걸어 들어가 돌을 살펴봐요'), 4); } }
  function dispose() { dead = true; for (const o of [PILE, SLAB, MARK]) if (o) { if (o.parent) o.parent.remove(o); o.geometry.dispose(); } if (MATI) MATI.dispose(); PILE = SLAB = MARK = MATI = null; }
  const has = () => Object.keys(S().fos).length > 0;
  const API = { edges: () => E.map(e => e.k === 'gorge' ? { k: e.k, id: e.id, gx: +e.gx.toFixed(1), gz0: +e.gz0.toFixed(1), L: GZ.L, wall: +(e.gx + GZ.wall).toFixed(2), pool: [+(e.gx + POOL.v).toFixed(1), +(e.gz0 + POOL.u).toFixed(1)], poolY: e.poolY, box: e.box, foot: [e.x0, e.z0, e.x1, e.z1], wind: e.wind } : { k: e.k, id: e.id, cx: +e.cx.toFixed(1), cz: +e.cz.toFixed(1), R: CZ.R, H: CZ.H, foot: [e.x0, e.z0, e.x1, e.z1], rocks: (e.rocks || []).length, wind: e.wind }),
    sites: () => SITES.map(s => ({ id: s.f.id, x: +s.x.toFixed(2), z: +s.z.toFixed(2), y: +s.y.toFixed(2), band: s.f.band, st: S().st[s.f.id] | 0 })), state: () => JSON.parse(JSON.stringify(S())), base: (x, z) => G.base(x, z), bump: (x, z) => { const e = edgeOf(x, z); return e ? +bump(e, x, z).toFixed(2) : null; },
    use, openCol, card: id => card(FINDS.find(f => f.id === id)), crater, near, hint, lensAt, borrow, inst: () => ({ pile: PILE && PILE.count, slab: SLAB && SLAB.count, mark: MARK && MARK.count }) };
  const off = () => { E = []; SITES = []; if (PILE) for (const o of [PILE, SLAB, MARK]) o.count = 0; };   /* 매트 모습으로 다시 지을 때 = 땅·걷기 없음 */
  return { draw, off, init, tick, dispose, h, trail, nameAt, foot: footAny, places, near, hint, lensAt, use, openCol, has, api: API, get on() { return E.length > 0; } };
}
