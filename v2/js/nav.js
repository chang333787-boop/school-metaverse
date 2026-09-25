// v2 길격자·길찾기(MAP-API-1 · 09-24) — 순수 함수·타입 배열(import 없음)
// 플레이어와 **같은 물리 함수**(main.js groundAt·blockedAt)를 주입받아 0.3m 격자를 채운다 = 도달성 게이트(reach)와 게임 길찾기의 단일 출처.
//   격자 0.3m: 계단 단 깊이(0.72)보다 촘촘해야 한 칸 이동이 한 단을 넘지 않는다. 원점 (6, 8) = 예전 reach 출발점.
//   칸 (ix, iz) ↔ 월드 (OX + ix·S, OZ + iz·S) — 좌표를 누적하지 않고 매번 이 식으로(부동소수 드리프트 0).
//   간선은 방향이 있다(떨어지기는 한 방향) → path(a,b)가 있어도 path(b,a)가 없을 수 있다.
export const S = 0.3, OX = 6, OZ = 8;
export const RECT = [-90, -90, 64, 66];                        // 격자 범위 x0, z0, x1, z1 (reach와 같다)
const IX0 = -321, IZ0 = -328, NW = 518, NH = 525;             // 열 색인 범위(RECT를 덮고 한 칸 여유)
const DX = [1, -1, 0, 0], DZ = [0, 0, 1, -1];                   // 방향 0:+x 1:-x 2:+z 3:-z (반대 = d ^ 1)

// ---------- 빌드(생성기 — 4096칸마다 양보) ----------
// q = { groundAt(x,z,fromY), blockedAt(x,z,y) } · o = { jump:false|true|'both', maxPops, recordBlocked }
//   jump=true  : 점프 정점(발+0.97)에서 막힘·착지(발+1.5까지) — 예전 reach({jump:true})와 같은 규칙(옥상 검사)
//   jump='both': 걷기 간선 + 점프 간선 둘 다(건강 검진의 '점프로도 못 돌아옴'·올라서기 금지 무력화 검사)
export function* buildGen(q, o = {}) {
  const jump = o.jump || false, maxPops = o.maxPops || 900000, rec = o.recordBlocked ?? !jump;   // 걷기 격자는 막힌 간선도 적어 둔다(건강 검진의 '보이지 않는 벽')
  let cap = 262144, n = 0;
  let ix = new Int16Array(cap), iz = new Int16Array(cap), y = new Float32Array(cap), yb = new Int8Array(cap), next = new Int32Array(cap), e = new Int32Array(cap * 4).fill(-1);
  const colHead = new Int32Array(NW * NH).fill(-1);
  let stack = new Int32Array(65536), sp = 0, blocked = rec ? new Int32Array(65536) : null, nb = 0;
  const grow = () => {
    const c2 = Math.floor(cap * 1.5);
    const g = (A, k = 1) => { const B = new A.constructor(c2 * k); B.set(A); return B; };
    ix = g(ix); iz = g(iz); y = g(y); yb = g(yb); next = g(next); const e2 = new Int32Array(c2 * 4).fill(-1); e2.set(e); e = e2; cap = c2;
  };
  const col = (cix, ciz) => (cix - IX0) * NH + (ciz - IZ0);
  const add = (cix, ciz, gy, b) => {
    if (n >= cap) grow();
    ix[n] = cix; iz[n] = ciz; y[n] = gy; yb[n] = b; const c = col(cix, ciz); next[n] = colHead[c]; colHead[c] = n; return n++;
  };
  const find = (cix, ciz, b) => { for (let i = colHead[col(cix, ciz)]; i >= 0; i = next[i]) if (yb[i] === b) return i; return -1; };
  const push = v => { if (sp >= stack.length) { const s2 = new Int32Array(stack.length * 2); s2.set(stack); stack = s2; } stack[sp++] = v; };
  const sy = q.groundAt(OX, OZ, 2);
  push(add(0, 0, sy, Math.round(sy * 2)));
  const modes = jump === 'both' ? [[0, 0.55], [0.97, 1.5]] : jump ? [[0.97, 1.5]] : [[0, 0.55]];
  let pops = 0;
  while (sp && pops < maxPops) {
    const c = stack[--sp]; pops++;
    const cix = ix[c], ciz = iz[c], cy = y[c];
    for (let d = 0; d < 4; d++) {
      const nix = cix + DX[d], niz = ciz + DZ[d], nx = OX + nix * S, nz = OZ + niz * S;
      if (nx < RECT[0] || nx > RECT[2] || nz < RECT[1] || nz > RECT[3]) continue;
      for (let m = 0; m < modes.length; m++) {
        const [JY, UP] = modes[m];
        if (q.blockedAt(nx, nz, cy + JY)) { if (rec && m === 0) { if (nb >= blocked.length) { const b2 = new Int32Array(blocked.length * 2); b2.set(blocked); blocked = b2; } blocked[nb++] = c * 4 + d; } continue; }
        const g = q.groundAt(nx, nz, cy + JY);
        if (g > cy + UP) continue;                                   // 못 오르는 턱
        const b = Math.round(g * 2);
        let j = find(nix, niz, b);
        if (j < 0) { j = add(nix, niz, g, b); push(j); }
        e[c * 4 + d] = j;   // 'both': 걷기가 되면 걷기 간선(걷기가 되는 곳은 점프 착지 높이도 같다 — 같은 발자국 판정), 안 되면 점프 간선
        break;
      }
    }
    if ((pops & 4095) === 0) yield pops;
  }
  return finish({ n, ix, iz, y, yb, next, e, colHead, pops, jump, blocked: rec ? blocked.subarray(0, nb) : null });
}
export function buildSync(q, o = {}) { const g = buildGen(q, o); let r; while (!(r = g.next()).done); return r.value; }
// rAF마다 sliceMs씩 — 크롬북에서 게임 시작 때 화면이 멈추지 않게
export function buildSliced(q, o = {}, sliceMs = 6) {
  return new Promise((res, rej) => {
    const g = buildGen(q, o);
    const run = () => { try { const t0 = performance.now(); for (;;) { const r = g.next(); if (r.done) return res(r.value); if (performance.now() - t0 > sliceMs) break; } requestAnimationFrame(run); } catch (err) { rej(err); } };
    run();
  });
}

// ---------- Nav 객체 ----------
function finish(B) {
  const n = B.n, ix = B.ix.subarray(0, n), iz = B.iz.subarray(0, n), y = B.y.subarray(0, n), yb = B.yb.subarray(0, n), next = B.next.subarray(0, n), e = B.e.subarray(0, n * 4), colHead = B.colHead;
  const col = (cix, ciz) => (cix < IX0 || ciz < IZ0 || cix >= IX0 + NW || ciz >= IZ0 + NH) ? -1 : (cix - IX0) * NH + (ciz - IZ0);
  const X = i => OX + ix[i] * S, Z = i => OZ + iz[i] * S;
  // 역인접(CSR) — 출발점으로 되돌아갈 수 있는가(갇힘 칸) · 다익스트라 역방향에도 쓴다
  let rev = null;
  const revCSR = () => {
    if (rev) return rev;
    const cnt = new Int32Array(n + 1);
    const each = f => { for (let i = 0; i < n; i++) for (let d = 0; d < 4; d++) { const j = e[i * 4 + d]; if (j >= 0) f(i, j); } };
    each((i, j) => cnt[j + 1]++);
    for (let i = 0; i < n; i++) cnt[i + 1] += cnt[i];
    const pred = new Int32Array(cnt[n]), fill = cnt.slice(0, n);
    each((i, j) => { pred[fill[j]++] = i; });
    return (rev = { cnt, pred });
  };
  const back = () => {   // 출발점(0번)으로 돌아올 수 있는 칸 = 1
    const { cnt, pred } = revCSR(), ok = new Uint8Array(n), st = new Int32Array(n); let sp = 0; ok[0] = 1; st[sp++] = 0;
    while (sp) { const v = st[--sp]; for (let p = cnt[v]; p < cnt[v + 1]; p++) { const u = pred[p]; if (!ok[u]) { ok[u] = 1; st[sp++] = u; } } }
    return ok;
  };
  const N = {
    S, ox: OX, oz: OZ, count: n, start: 0, pops: B.pops, jump: B.jump, ix, iz, y, e, blockedEdges: B.blocked,
    zone: null, inSchool: null, clr: null, canReturn: null, traps: 0, mask: new Uint8Array(n),
    X, Z, pos: i => [X(i), y[i], Z(i)],
    // 같은 열(ix, iz)에서 높이 버킷 b인 칸
    find(cix, ciz, b) { const c = col(cix, ciz); if (c < 0) return -1; for (let i = colHead[c]; i >= 0; i = next[i]) if (yb[i] === b) return i; return -1; },
    // 가장 가까운 칸(수평² + 4·dy², 조건 lo < y-칸y < hi · 기본 -0.6~1.6) — 링 탐색
    snap(x, yy, z, maxR = 1.5, lo = -0.6, hi = 1.6) {
      const bx = Math.round((x - OX) / S), bz = Math.round((z - OZ) / S), R = Math.ceil(maxR / S);
      let best = -1, bd = 1e9;
      for (let r = 0; r <= R; r++) {
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const c = col(bx + dx, bz + dz); if (c < 0) continue;
          for (let i = colHead[c]; i >= 0; i = next[i]) {
            const dy = yy - y[i]; if (!(dy > lo && dy < hi)) continue;
            const px = X(i) - x, pz = Z(i) - z, d2 = px * px + pz * pz; if (d2 > maxR * maxR) continue;
            const s2 = d2 + dy * dy * 4; if (s2 < bd) { bd = s2; best = i; }
          }
        }
        if (best >= 0 && (r - 1) * S > Math.sqrt(bd)) break;
      }
      return best;
    },
    // 후처리: 구역 번호(zoneFn → 인덱스|-1)·학교 안(inFn)·여유 칸 수·갇힘 칸
    finish(zoneFn, inFn) {
      const zn = new Int16Array(n), ins = new Uint8Array(n);
      for (let i = 0; i < n; i++) { const x = X(i), z = Z(i); zn[i] = zoneFn ? zoneFn(x, y[i], z) : -1; ins[i] = inFn ? (inFn(x, z) ? 1 : 0) : 1; }
      N.zone = zn; N.inSchool = ins;
      // 여유(clearance): 나가는 간선이 4개 미만인 칸(벽·가구 옆)에서 다중 BFS, 최대 20칸
      const clr = new Uint8Array(n).fill(20), qq = new Int32Array(n); let h = 0, t = 0;
      for (let i = 0; i < n; i++) { let k = 0; for (let d = 0; d < 4; d++) if (e[i * 4 + d] >= 0) k++; if (k < 4) { clr[i] = 0; qq[t++] = i; } }
      while (h < t) { const v = qq[h++], cv = clr[v] + 1; if (cv >= 20) continue; for (let d = 0; d < 4; d++) { const j = e[v * 4 + d]; if (j >= 0 && clr[j] > cv) { clr[j] = cv; qq[t++] = j; } } }
      N.clr = clr;
      N.canReturn = back(); let tr = 0; for (let i = 0; i < n; i++) if (!N.canReturn[i]) tr++; N.traps = tr;
      return N;
    },
    // 막기(게임 중 정문 닫기 등): rect = [x0, z0, x1, z1] 또는 (i) => bool. 겹쳐 막아도 remove가 서로 풀지 않게 카운터
    block(rect) {
      const f = typeof rect === 'function' ? rect : i => { const x = X(i), z = Z(i); return x >= rect[0] && x <= rect[2] && z >= rect[1] && z <= rect[3]; };
      const list = []; for (let i = 0; i < n; i++) if (f(i)) { N.mask[i]++; list.push(i); }
      return { remove() { for (const i of list) if (N.mask[i]) N.mask[i]--; list.length = 0; } };
    },
    path(a, b, opt = {}) { return astar(a, b, opt); },
    // 조건에 맞는 칸 하나(무작위) — filter(i)·minClear(칸)·allowOutside·farFrom [{x,z,r}]·rng
    random(opt = {}) {
      const rng = opt.rng || Math.random, mc = opt.minClear ?? 2, far = opt.farFrom || [], f = opt.filter;
      const cand = [];
      for (let i = 0; i < n; i++) {
        if (N.mask[i] || (N.clr && N.clr[i] < mc) || (!opt.allowOutside && N.inSchool && !N.inSchool[i]) || (N.canReturn && !N.canReturn[i])) continue;
        if (f && !f(i)) continue;
        let ok = true; for (const p of far) { const dx = X(i) - p.x, dz = Z(i) - p.z; if (dx * dx + dz * dz < p.r * p.r) { ok = false; break; } }
        if (ok) cand.push(i);
      }
      return cand.length ? cand[Math.floor(rng() * cand.length)] : -1;
    },
    // 한 칸에서 모든 칸까지 걷는 비용(다익스트라, maxLen m까지) — 도망·난이도 계산용
    //   game_find(09-26): 예전엔 묵은 힙 항목 검사가 거꾸로(hkey < dc)였고 nd(64비트)를 Float32 D와 견줘, 올림 반올림된 칸이 끝없이 다시 들어가 힙이 터졌다(Array buffer allocation failed).
    //   → 묵은 항목은 건너뛰고(hkey > dc) 거리는 Math.fround로 D와 같은 정밀도에서 견준다.
    distField(a, maxLen = 1e9) {
      const D = new Float32Array(n).fill(Infinity); if (a < 0) return D;
      heapReset(); D[a] = 0; hpush(a, 0);
      while (hn) { const c = hpop(); const dc = D[c]; if (hkey > dc) continue; if (dc > maxLen) break;
        for (let d = 0; d < 4; d++) { const j = e[c * 4 + d]; if (j < 0 || N.mask[j]) continue; const nd = Math.fround(dc + S + Math.abs(y[j] - y[c]) * 0.5); if (nd < D[j]) { D[j] = nd; hpush(j, nd); } } }
      return D;
    },
    export() { return { v: 1, S, ox: OX, oz: OZ, n, ix, iz, y, e, zone: N.zone, clr: N.clr, inSchool: N.inSchool }; },
  };
  // ----- A*(이진 힙 · 타입 배열 재사용 · stamp로 초기화 비용 0) -----
  const gS = new Float32Array(n), came = new Int32Array(n), stamp = new Uint32Array(n), closed = new Uint32Array(n); let run = 0;
  let heap = new Int32Array(1024), hf = new Float32Array(1024), hn = 0, hkey = 0;
  const heapReset = () => { hn = 0; };
  const hpush = (i, f) => { if (hn >= heap.length) { const a = new Int32Array(heap.length * 2), b = new Float32Array(heap.length * 2); a.set(heap); b.set(hf); heap = a; hf = b; }
    let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= f) break; heap[k] = heap[p]; hf[k] = hf[p]; k = p; } heap[k] = i; hf[k] = f; };
  const hpop = () => { const top = heap[0]; hkey = hf[0]; const li = heap[--hn], lf = hf[hn]; let k = 0;
    for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; heap[k] = heap[c]; hf[k] = hf[c]; k = c; } heap[k] = li; hf[k] = lf; return top; };
  function astar(a, b, opt) {
    if (a < 0 || b < 0) return { ok: false, reason: 'snap', pts: [], len: 0, nodes: [] };
    const maxExp = opt.maxExp || 150000, bad = opt.bad, cost = opt.cost, out = !!opt.allowOutside;
    run++; heapReset(); let exp = 0;
    const bx = ix[b], bz = iz[b], by = y[b];
    const H = i => (Math.abs(ix[i] - bx) + Math.abs(iz[i] - bz)) * S + Math.abs(y[i] - by) * 0.5;
    stamp[a] = run; gS[a] = 0; came[a] = -1; hpush(a, H(a));
    while (hn) {
      const c = hpop(); if (closed[c] === run) continue; closed[c] = run; exp++;
      if (c === b) {
        const nodes = []; for (let i = b; i !== -1; i = came[i]) nodes.push(i); nodes.reverse();
        const keep = opt.smooth === false ? nodes : smooth(nodes);
        return { ok: true, len: gS[b], exp, nodes, pts: keep.map(i => [+X(i).toFixed(2), +y[i].toFixed(2), +Z(i).toFixed(2)]) };
      }
      if (exp > maxExp) return { ok: false, reason: 'limit', exp, pts: [], len: 0, nodes: [] };
      for (let d = 0; d < 4; d++) {
        const j = e[c * 4 + d]; if (j < 0 || closed[j] === run || N.mask[j]) continue;
        if (!out && N.inSchool && !N.inSchool[j] && j !== b) continue;
        if (bad && bad(j)) continue;
        const ng = gS[c] + (S + Math.abs(y[j] - y[c]) * 0.5) * (cost ? cost(j) : 1);
        if (stamp[j] !== run || ng < gS[j]) { stamp[j] = run; gS[j] = ng; came[j] = c; hpush(j, ng + H(j)); }
      }
    }
    return { ok: false, reason: 'unreachable', exp, pts: [], len: 0, nodes: [] };
  }
  // 경로 펴기: 4연결 DDA 직선이 격자 간선을 따라 끊김 없이 이어지고 한 걸음 |dy| ≤ 0.35면 중간점 생략(탐욕적 최원점)
  function lineOK(a, b) {
    let i = a; const dx = ix[b] - ix[a], dz = iz[b] - iz[a], sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, ax = Math.abs(dx), az = Math.abs(dz);
    let tx = ax ? 0.5 / ax : Infinity, tz = az ? 0.5 / az : Infinity; const ddx = ax ? 1 / ax : Infinity, ddz = az ? 1 / az : Infinity;
    for (let k = ax + az; k > 0; k--) {
      let d; if (tx < tz) { tx += ddx; d = sx > 0 ? 0 : 1; } else { tz += ddz; d = sz > 0 ? 2 : 3; }
      const j = e[i * 4 + d]; if (j < 0 || N.mask[j] || Math.abs(y[j] - y[i]) > 0.35) return false; i = j;
    }
    return i === b;
  }
  function smooth(p) {
    if (p.length < 3) return p.slice();
    const out = [p[0]]; let k = 0;
    while (k < p.length - 1) { let far = k + 1; for (let m = Math.min(p.length - 1, k + 400); m > k + 1; m--) if (lineOK(p[k], p[m])) { far = m; break; } out.push(p[far]); k = far; }
    return out;
  }
  return N;
}
