// 걷기 충돌 — 원기둥(blockers) + 얇은 벽 선분(walls)을 8m 격자에 넣고 가까운 칸만 봄(전체 순회 X · 매 걸음 new X)
// push(p, r) = 사람 원(반지름 r)을 밀어냄(p.x·p.z를 고침) · cut(ax,az,bx,bz, cam) = 선분 a→b가 벽에 처음 닿는 비율(카메라를 벽 안쪽에 둠)
// cam = true면 키 큰 벽만(낮은 벽 = 배열에 .low — 울타리·난간·다리 밧줄·선착장 끝 — 은 카메라가 넘어 봄 · 11-01 조작감 팀 A)
//   .edge = 보이지 않는 걷기 끝 선(물가·절벽·비탈 등고선) — edgeOK(t)가 참일 때만 막음(카메라: 선 너머 땅이 눈높이보다 높으면 = 바위벽 · 낮으면 = 낭떠러지·물 → 넘어 봄)
const CELL = 8;
export function createCollide(blockers = [], walls = []) {
  const grid = new Map(), key = (i, j) => i * 73856093 ^ j * 19349663;
  const add = (i, j, k) => { const h = key(i, j); let a = grid.get(h); if (!a) grid.set(h, a = []); a.push(k); };
  const B = blockers.map((b) => [b.x, b.z, b.r]), Wl = walls.map((w) => w.slice(0, 4)), camOK = Uint8Array.from(walls, (w) => (w.low ? 0 : w.edge ? 2 : 1));
  const seen = new Uint32Array(Wl.length); let gen = 0;   // 한 번 본 벽 표시(매 프레임 new Set X)
  B.forEach((b, k) => { for (let i = Math.floor((b[0] - b[2]) / CELL); i <= Math.floor((b[0] + b[2]) / CELL); i++) for (let j = Math.floor((b[1] - b[2]) / CELL); j <= Math.floor((b[1] + b[2]) / CELL); j++) add(i, j, k); });
  Wl.forEach((w, k) => {                                  // 선분이 지나는 칸(굵게 한 칸씩 넉넉히)
    const n = Math.max(1, Math.ceil(Math.hypot(w[2] - w[0], w[3] - w[1]) / (CELL * 0.5)));
    const seen = new Set();
    for (let s = 0; s <= n; s++) { const x = w[0] + (w[2] - w[0]) * s / n, z = w[1] + (w[3] - w[1]) * s / n, i = Math.floor(x / CELL), j = Math.floor(z / CELL), h = i + ',' + j; if (!seen.has(h)) { seen.add(h); add(i, j, ~k); } }
  });
  const C = { blockers: B, walls: Wl, count: B.length + Wl.length };
  C.push = (p, r = 0.35, cam = false) => {                 // cam = 카메라 자리(키 큰 벽만 · 원기둥 X)
    for (let pass = 0; pass < 2; pass++) for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const a = grid.get(key(Math.floor(p.x / CELL) + di, Math.floor(p.z / CELL) + dj)); if (!a) continue;
      for (let q = 0; q < a.length; q++) {
        const k = a[q];
        if (cam && (k >= 0 || !camOK[~k])) continue;
        if (k >= 0) { const b = B[k], dx = p.x - b[0], dz = p.z - b[1], d = Math.hypot(dx, dz), rr = b[2] + r; if (d < rr && d > 1e-5) { p.x = b[0] + dx / d * rr; p.z = b[1] + dz / d * rr; } }
        else {
          const w = Wl[~k], ex = w[2] - w[0], ez = w[3] - w[1], L2 = ex * ex + ez * ez || 1e-9;
          let t = ((p.x - w[0]) * ex + (p.z - w[1]) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const cx = w[0] + ex * t, cz = w[1] + ez * t, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
          if (d < r) { if (d > 1e-5) { p.x = cx + dx / d * r; p.z = cz + dz / d * r; } else { const L = Math.sqrt(L2); p.x = cx - ez / L * r; p.z = cz + ex / L * r; } }
        }
      }
    }
    return p;
  };
  C.cut = (ax, az, bx, bz, cam, edgeOK) => {             // 0~1(1 = 안 닿음) — 카메라 끌어당기기용
    let best = 1; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL * 0.5)));   // 칸 반 크기마다(대각선으로 칸 모서리만 스치는 벽도)
    if (++gen > 4e9) { gen = 1; seen.fill(0); }
    for (let s = 0; s <= n; s++) for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {   // 둘레 칸까지(벽은 4m마다 찍은 칸에만 들어 있어 칸 모서리를 지나는 벽을 놓치던 것)
      const a = grid.get(key(Math.floor((ax + (bx - ax) * s / n) / CELL) + di, Math.floor((az + (bz - az) * s / n) / CELL) + dj)); if (!a) continue;
      for (let q = 0; q < a.length; q++) {
        const k = a[q]; if (k >= 0) continue; const wi = ~k; if (seen[wi] === gen) continue; seen[wi] = gen;
        if (cam && !camOK[wi]) continue;
        const w = Wl[wi], rx = bx - ax, rz = bz - az, sx = w[2] - w[0], sz = w[3] - w[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) continue;
        const t = ((w[0] - ax) * sz - (w[1] - az) * sx) / den, u = ((w[0] - ax) * rz - (w[1] - az) * rx) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && t < best && !(cam && camOK[wi] === 2 && !(edgeOK && edgeOK(t)))) best = t;
      }
    }
    return best;
  };
  return C;
}
