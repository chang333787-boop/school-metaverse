// 걷기 충돌 — 원기둥(blockers) + 얇은 벽 선분(walls)을 8m 격자에 넣고 가까운 칸만 봄(전체 순회 X · 매 걸음 new X)
// push(p, r) = 사람 원(반지름 r)을 밀어냄(p.x·p.z를 고침) · cut(ax,az,bx,bz) = 선분 a→b가 벽에 처음 닿는 비율(카메라를 벽 안쪽에 둠)
const CELL = 8;
export function createCollide(blockers = [], walls = []) {
  const grid = new Map(), key = (i, j) => i * 73856093 ^ j * 19349663;
  const add = (i, j, k) => { const h = key(i, j); let a = grid.get(h); if (!a) grid.set(h, a = []); a.push(k); };
  const B = blockers.map((b) => [b.x, b.z, b.r]), Wl = walls.map((w) => w.slice(0, 4));
  B.forEach((b, k) => { for (let i = Math.floor((b[0] - b[2]) / CELL); i <= Math.floor((b[0] + b[2]) / CELL); i++) for (let j = Math.floor((b[1] - b[2]) / CELL); j <= Math.floor((b[1] + b[2]) / CELL); j++) add(i, j, k); });
  Wl.forEach((w, k) => {                                  // 선분이 지나는 칸(굵게 한 칸씩 넉넉히)
    const n = Math.max(1, Math.ceil(Math.hypot(w[2] - w[0], w[3] - w[1]) / (CELL * 0.5)));
    const seen = new Set();
    for (let s = 0; s <= n; s++) { const x = w[0] + (w[2] - w[0]) * s / n, z = w[1] + (w[3] - w[1]) * s / n, i = Math.floor(x / CELL), j = Math.floor(z / CELL), h = i + ',' + j; if (!seen.has(h)) { seen.add(h); add(i, j, ~k); } }
  });
  const near = (x, z) => grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
  const C = { blockers: B, walls: Wl, count: B.length + Wl.length };
  C.push = (p, r = 0.35) => {
    for (let pass = 0; pass < 2; pass++) for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const a = grid.get(key(Math.floor(p.x / CELL) + di, Math.floor(p.z / CELL) + dj)); if (!a) continue;
      for (let q = 0; q < a.length; q++) {
        const k = a[q];
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
  C.cut = (ax, az, bx, bz) => {                          // 0~1(1 = 안 닿음) — 카메라 끌어당기기용
    let best = 1; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / CELL)), done = new Set();
    for (let s = 0; s <= n; s++) {
      const a = near(ax + (bx - ax) * s / n, az + (bz - az) * s / n); if (!a) continue;
      for (let q = 0; q < a.length; q++) {
        const k = a[q]; if (k >= 0 || done.has(k)) continue; done.add(k);
        const w = Wl[~k], rx = bx - ax, rz = bz - az, sx = w[2] - w[0], sz = w[3] - w[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) continue;
        const t = ((w[0] - ax) * sz - (w[1] - az) * sx) / den, u = ((w[0] - ax) * rz - (w[1] - az) * rx) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1 && t < best) best = t;
      }
    }
    return best;
  };
  return C;
}
