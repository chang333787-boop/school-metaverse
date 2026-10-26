// 🏙 마디탑 전망대(TOWER-1 · 사용자 10-26 '롯데월드타워 같은 랜드마크(디자인 달라야 함) 하고 전망대 있으면 좋겠음 — 산에서 보는 것처럼 풍경 보이게')
//   모양 = 대나무 마디: 팔각 몸통 아홉 마디가 위로 갈수록 조금씩 좁아지고 마디마다 8°씩 비틀림 · 마디 이음 = 크림색 띠(밤 = 은은한 띠 불빛 · MeshBasic · 새 Light X)
//          꼭대기 = 둥근 전망층(유리 띠 + 난간 두른 둥근 바닥 · 걸어 다님) + 가운데 엘리베이터 집 + 죽순 꼴 첨탑(항공 장애등)
//   키 = 몸통 153m + 전망층 9m(바닥 162m) + 첨탑 = 약 190m — 뒷산 정상(약 290m)보다 낮고 아파트(30m)의 여섯 배 · 학교·마을 어디서나 보이는 상징
//   자리 = 시내(높은 건물 동네) 빈 땅 — SITE 표(칸 지도로 확인한 정본) · 짓기 때 둘레 21m가 비었는지 다시 보고, 막혔으면 가까운 빈 땅을 찾음
//   아이가 하는 것: 입구 E → 엘리베이터 창(층 숫자가 올라감 · 2.6초) → 전망층에 서서 걸어 다니며 둘러봄 → 망원경 E(그 방향 랜드마크 이름 · 방위 · 거리 · 한 줄) → 가운데 E로 내려감
//   멀리 보기: 전망층에 있는 동안만 va() = 1 → town.js 높은 곳 전망(VIEW-ALT)이 안개·카메라 far를 넓힘 · 내려오면 그대로 되돌림
//   렉: 몸통 = 합친 메시 하나(먼 깊이 압축 셰이더 · 어디서나 보임) + 불빛 띠 하나 + 간판 하나 = 그리기 3 · 정적 matrixAutoUpdate false · 매 프레임 일 = 1초 칸 셈 하나(망원경·전망층에 있을 때만 떨어짐 막기 한 줄) · 새 객체 X
//   지킴: 판타지 X · 실제 건물 이름 X · 홍보판(SM_PROMO) X · 알림은 say(t, s, 1)
export const TOWER_V = 1;
const T2 = (ko, en) => [ko, en];
const NAME = T2('마디탑', 'Madi Tower');
/* 정본 자리(마을 id → 가운데 [x, z]) — 칸 지도로 확인(도로·건물·물과 겹치지 않음 · 보고서에 적음) */
const SITE = { ourtown: [346, 252] };   /* 마10 칸 서쪽 큰길(x 316)과 강 사이 빈 땅 · 동쪽 이웃 칸 마11 = 「큰건물」 높은 건물 동네 */
const SEG = 9, SEGH = 17, R0 = 10.5, RSTEP = 0.55, TWIST = 0.14;   /* 마디 아홉 · 마디 높이 17m · 밑 반지름 10.5m → 맨 위 6.1m · 마디마다 8° */
const DRUM = 9, DR = 13, RAIL = 12.3, CORE = 3.3, SPIRE = 28, PLAZA = 20, POD = 15, PODH = 6;
const HOURS = [9 * 60, 22 * 60];   /* 전망대 여는 때 9시 ~ 22시(docs/systems/town_hours.md 한 줄) */
const DIR8 = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];

export function createTower(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const say = (t, s) => A.say(t, s || 4, 1), sayNow = (t, s) => A.say(t, s || 4), sfx = k => { if (A.sfx) A.sfx(k); };
  let dead = false, built = null, R9 = null, COL = [], mode = '', ride = null, scope = null, acc = 0, ph9 = -1, tries = 0;
  const DBG = [], log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };

  // ───────── 자리 고르기 ─────────
  const gy = (x, z) => A.ty(x, z);
  function siteOk(cx, cz) { let lo = 1e9, hi = -1e9;
    for (let r = 0; r <= PLAZA + 1; r += 3) { const n = r ? Math.max(8, Math.round(r * 2.1)) : 1; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (!A.free(x, z)) return null; const y = gy(x, z); if (y < lo) lo = y; if (y > hi) hi = y; if (hi - lo > 0.8) return null; } }
    return { lo, hi }; }
  function scan(x0, z0, x1, z1, st) { const out = []; for (let x = x0; x <= x1; x += st) for (let z = z0; z <= z1; z += st) { const s = siteOk(x, z); if (s) out.push([Math.round(x), Math.round(z), +(s.hi - s.lo).toFixed(2)]); } return out; }
  function pick() { const s0 = SITE[A.id], C = s0 || A.center(); if (!C) return null; if (s0) { const s = siteOk(C[0], C[1]); if (s) return { x: C[0], z: C[1], ...s, at: 'site' }; }
    for (let r = 6; r <= (s0 ? 90 : 260); r += 6) { const n = Math.max(8, Math.round(r / 5)); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, x = C[0] + Math.cos(a) * r, z = C[1] + Math.sin(a) * r, s = siteOk(x, z); if (s) return { x, z, ...s, at: 'near' }; } } return null; }
  function faceRoad(cx, cz) { let best = null; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, ux = Math.sin(a), uz = Math.cos(a); for (let d = PLAZA; d < 80; d += 1.5) if (A.onRoad(cx + ux * d, cz + uz * d)) { if (!best || d < best.d) best = { d, a }; break; } } return best ? best.a : 0; }

  // ───────── 모양(합친 꼴 · 낮은 다각 · 면마다 평평한 빛) ─────────
  const B = () => ({ p: [], n: [], c: [] }), _c = new T3.Color();
  const tri = (G, a, b, c, col) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; _c.setHex(col);
    for (const q of [a, b, c]) { G.p.push(q[0], q[1], q[2]); G.n.push(nx, ny, nz); G.c.push(_c.r, _c.g, _c.b); } };
  const quad = (G, a, b, c, d, col) => { tri(G, a, b, c, col); tri(G, a, c, d, col); };
  /* 각기둥 옆면(r0 → r1 · n면 · rot 돌림 · colF(k) = 면 색) + 윗면·아랫면(선택) */
  function prism(G, cx, cz, y0, y1, r0, r1, n, rot, colF, cap) { const cb = typeof cap === 'object' && cap ? 1 : cap | 0; for (let k = 0; k < n; k++) { const a0 = rot + k / n * 6.2832, a1 = rot + (k + 1) / n * 6.2832, P = (r, a, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      quad(G, P(r0, a0, y0), P(r1, a0, y1), P(r1, a1, y1), P(r0, a1, y0), colF(k)); if (cb & 1) tri(G, [cx, y1, cz], P(r1, a1, y1), P(r1, a0, y1), typeof cap === 'object' ? cap.top : colF(k)); if (cb & 2) tri(G, [cx, y0, cz], P(r0, a0, y0), P(r0, a1, y0), colF(k)); } }
  /* 상자(가운데 아래 · ry 돌림) */
  function box(G, x, y, z, sx, sy, sz, ry, col, top) { const c = Math.cos(ry), s = Math.sin(ry), V = (u, v, w) => [x + u * c + w * s, y + v, z - u * s + w * c], hx = sx / 2, hz = sz / 2;
    const p = [V(-hx, 0, -hz), V(hx, 0, -hz), V(hx, 0, hz), V(-hx, 0, hz), V(-hx, sy, -hz), V(hx, sy, -hz), V(hx, sy, hz), V(-hx, sy, hz)];
    quad(G, p[4], p[7], p[6], p[5], top ?? col); quad(G, p[3], p[2], p[6], p[7], col); quad(G, p[1], p[0], p[4], p[5], col); quad(G, p[2], p[1], p[5], p[6], col); quad(G, p[0], p[3], p[7], p[4], col); }
  /* 잎(마름모 판 · 양면 · 폭은 비스듬히 세워 옆에서도 보이게) — 뿌리 반지름 rb·높이 yb에서 a 방향으로 길이 Ln · 폭 W · 올라가는 각 el */
  function leaf(G, cx, cz, rb, yb, a, Ln, W, el) { const ux = Math.cos(a), uz = Math.sin(a), ce = Math.cos(el), se = Math.sin(el), tx = -uz, tz = ux, Bp = [cx + ux * rb, yb, cz + uz * rb], at = t => [Bp[0] + ux * ce * Ln * t, Bp[1] + se * Ln * t, Bp[2] + uz * ce * Ln * t];
    const m = at(0.42), T = at(1), wy = 0.62, wl = Math.hypot(1, wy), M1 = [m[0] + tx * W / 2 / wl, m[1] + wy * W / 2 / wl, m[2] + tz * W / 2 / wl], M2 = [m[0] - tx * W / 2 / wl, m[1] - wy * W / 2 / wl, m[2] - tz * W / 2 / wl], c1 = 0xa6d68e, c2 = 0x86c070;
    tri(G, Bp, M1, T, c1); tri(G, Bp, T, M2, c2); tri(G, Bp, T, M1, c1); tri(G, Bp, M2, T, c2); }
  const segR = i => R0 - i * RSTEP, stepsN = s => Math.max(1, Math.ceil((s.hi + 0.06 - s.lo) / 0.28)), stepY = (s, k) => s.lo + (s.hi + 0.06 - s.lo) * (k + 1) / stepsN(s);

  function build(site) { const { x: cx, z: cz } = site, g0 = site.hi + 0.06, fa = faceRoad(cx, cz), fa0 = Math.atan2(Math.cos(fa), Math.sin(fa)), G = B(), H = B();   /* G = 몸(빛 받음) · H = 불빛 띠·등(MeshBasic) */
    const jade = [0xbadfc4, 0x82b99d], cream = 0xf0e8d4, warm = 0xfff0c8;
    const nS = stepsN(site); for (let k = 0; k < nS; k++) prism(G, cx, cz, site.lo - 0.8 - k * 0.01, stepY(site, k), PLAZA - (nS - 1 - k) * 1.2, PLAZA - (nS - 1 - k) * 1.2, 28, 0, () => (k === nS - 1 ? 0xd9d2c2 : 0xc9c0ad), { top: k === nS - 1 ? 0xe4ddcc : 0xd3cab6 });   /* 광장 판(땅이 낮은 쪽은 한 단 0.3m 아래 돌계단 고리) */
    prism(G, cx, cz, g0, g0 + 0.18, PLAZA - 3.2, PLAZA - 3.2, 28, 0.06, () => 0xcfc6b2, { top: 0xd8cfbb });   /* 안쪽 돌 고리(무늬) */
    const pr = Math.PI / 8;   /* 팔각 = 면이 축을 봄 */
    prism(G, cx, cz, g0, g0 + PODH, POD, POD, 8, pr, k => (k % 2 ? 0xe9dfc8 : 0xf3ead6), { top: 0xd6ccb6 });   /* 아랫집(매표·엘리베이터 홀) */
    prism(G, cx, cz, g0 + PODH, g0 + PODH + 0.5, POD + 0.25, POD + 0.25, 8, pr, () => 0xbfae8c, { top: 0xcdbd9c });   /* 처마 띠 */
    for (let i = 0; i < SEG; i++) { const y0 = g0 + (i ? i * SEGH : PODH + 0.5), y1 = g0 + (i + 1) * SEGH, r = segR(i), r1 = segR(i) - RSTEP * 0.6, rot = pr + i * TWIST;
      prism(G, cx, cz, y0, y1 - 0.6, r, r1, 8, rot, k => jade[k % 2], 0);   /* 마디 몸(옥빛 판 · 유리 줄 번갈아 → 비틀림이 보임) */
      prism(G, cx, cz, y1 - 0.8, y1 + 0.8, r1 + 1.2, r1 + 1.2, 8, rot, () => cream, { top: 0xe2d8bf });   /* 마디 띠(굵게 — 멀리서도 마디가 보이게) */
      prism(H, cx, cz, y1 - 0.22, y1 + 0.22, r1 + 1.24, r1 + 1.24, 8, rot, () => warm, 0);
      if (i === 3 || i === 5 || i === 7) leaf(G, cx, cz, r1 + 1.0, y1 + 0.8, fa0 + 0.9 + (i - 3) * 1.6, 19, 5.2, 0.55); }   /* 대나무 잎 둘(마디에서 번갈아 — 멀리서 보는 모양을 다른 탑과 다르게) */   /* 띠 불빛(낮 = 연한 크림 · 밤 = 은은히) */
    const yT = g0 + SEG * SEGH + 0.6, rT = segR(SEG - 1) - RSTEP * 0.6, Yd = yT + DRUM;
    prism(G, cx, cz, yT, yT + 3.5, rT, DR, 16, 0, () => 0xe8dfca, 0);   /* 전망층 받침(나팔꼴) */
    prism(G, cx, cz, yT + 3.5, yT + 7.6, DR, DR, 16, 0, k => (k % 4 === 0 ? 0xe2d8c0 : 0x9fc6d6), 0);   /* 유리 띠(안 전망층) */
    prism(G, cx, cz, yT + 7.6, Yd, DR, DR, 16, 0, () => cream, { top: 0xd8bf96 });   /* 바닥판(나무빛 윗면) */
    [[11.4, 0xceb187], [9.9, 0xdcc39b], [7.4, 0xcfb28a], [5.2, 0xdcc39b]].forEach(([r, c], k) => prism(G, cx, cz, Yd, Yd + 0.012 * (k + 1), r, r, 16, 0.1 * k, () => c, { top: c }));   /* 바닥 나무 고리 무늬(겹 높이를 어긋냄) */
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832; box(H, cx + Math.cos(a) * 11.7, Yd, cz + Math.sin(a) * 11.7, 0.5, 0.14, 0.5, -a, warm); }   /* 바닥 발밑등 여덟 */
    prism(H, cx, cz, yT + 7.25, yT + 7.5, DR + 0.05, DR + 0.05, 16, 0, () => warm, 0);
    prism(H, cx, cz, yT + 4.3, yT + 6.6, DR + 0.04, DR + 0.04, 16, 0, k => (k % 4 === 0 ? 0xe2d8c0 : 0xc4e2ee), 0);   /* 전망층 창 불빛(낮 = 유리빛 · 밤 = 밝게) */
    const NP = 32; for (let k = 0; k < NP; k++) { const a = k / NP * 6.2832, x = cx + Math.cos(a) * RAIL, z = cz + Math.sin(a) * RAIL, ry = -a, ch = 2 * RAIL * Math.sin(Math.PI / NP) + 0.06;   /* 난간 = 기둥 + 위·가운데 가로대 */
      box(G, x, Yd, z, 0.12, 1.15, 0.12, ry, 0x7b8a96); const xm = cx + Math.cos(a + Math.PI / NP) * RAIL * Math.cos(Math.PI / NP), zm = cz + Math.sin(a + Math.PI / NP) * RAIL * Math.cos(Math.PI / NP), rm = -(a + Math.PI / NP) + Math.PI / 2;
      box(G, xm, Yd + 1.1, zm, ch, 0.09, 0.14, rm, 0xe9e3d6); box(G, xm, Yd + 0.55, zm, ch, 0.05, 0.05, rm, 0x7b8a96); if (k % 4 === 0) box(H, x, Yd + 1.19, z, 0.16, 0.08, 0.16, ry, warm); }
    prism(G, cx, cz, Yd - 0.5, Yd + 3.4, CORE, CORE, 12, 0, k => (k === 0 ? 0x5f7f92 : 0xeee6d2), 0);   /* 엘리베이터 집(한 면 = 문) */
    prism(G, cx, cz, Yd + 3.4, Yd + 3.8, CORE + 0.35, CORE + 0.35, 12, 0, () => 0xbfae8c, { top: 0xcdbd9c });
    prism(G, cx, cz, Yd + 3.8, Yd + SPIRE * 0.45, 1.7, 0.9, 8, 0.2, k => jade[k % 2], 0); prism(G, cx, cz, Yd + SPIRE * 0.45, Yd + SPIRE * 0.45 + 0.5, 1.15, 1.15, 8, 0.2, () => cream, { top: 0xe2d8bf });
    prism(G, cx, cz, Yd + SPIRE * 0.45 + 0.5, Yd + SPIRE, 0.85, 0.12, 8, 0.45, k => jade[k % 2], 1);   /* 죽순 꼴 첨탑 */
    for (let k = 0; k < 3; k++) leaf(G, cx, cz, 1.2, Yd + SPIRE * 0.45 + 0.4, fa0 + 0.5 + k * 2.094, 9, 2.4, 0.95);   /* 첨탑 잎 셋(죽순 껍질처럼 비스듬히) */
    box(H, cx, Yd + SPIRE, cz, 0.35, 0.35, 0.35, 0, 0xff4a3a);   /* 항공 장애등 */
    /* 입구 = 가까운 길 쪽 · 엘리베이터 문도 같은 쪽 */
    const fx = Math.sin(fa), fz = Math.cos(fa), apo = POD * Math.cos(pr), doorY = g0;
    { const ry = fa, x = cx + fx * (apo + 0.05), z = cz + fz * (apo + 0.05); box(G, x, doorY, z, 5.2, 3.4, 0.12, ry, 0x5f7f92); box(G, cx + fx * (apo + 1.6), doorY + 3.6, cz + fz * (apo + 1.6), 7.4, 0.3, 3.2, ry, 0xbfae8c, 0xcdbd9c);   /* 유리문 + 차양 */
      for (const s9 of [-1, 1]) box(G, cx + fx * (apo + 3.0) + fz * s9 * 3.4, doorY, cz + fz * (apo + 3.0) - fx * s9 * 3.4, 0.22, 3.6, 0.22, ry, 0x9a8a6a); }
    /* 망원경 자리: 이 마을 안 랜드마크 방향(서로 60° 넘게 다름 · 셋까지) */
    const marks = landmarks(cx, cz, Yd), tels = [];
    for (const m of marks) { const a = m.a0, x = cx + Math.cos(a) * (RAIL - 0.75), z = cz + Math.sin(a) * (RAIL - 0.75), ry = Math.atan2(Math.cos(a), Math.sin(a));
      box(G, x, Yd, z, 0.22, 1.0, 0.22, ry, 0x8a9aa6); box(G, x, Yd + 0.95, z, 0.34, 0.36, 0.34, ry, 0x3d78b0, 0x4a86bd); tels.push({ ...m, x, z, a, ex: x - Math.cos(a) * 0.9, ez: z - Math.sin(a) * 0.9 }); }
    /* 망원경 몸통(기울인 통 — 방향 맞춘 상자 몇 개) */
    for (const t of tels) { const ux = Math.cos(t.a), uz = Math.sin(t.a), ry = Math.atan2(ux, uz); for (let k = 0; k < 4; k++) box(G, t.x + ux * (k * 0.16 - 0.2), Yd + 1.28 + k * 0.03, t.z + uz * (k * 0.16 - 0.2), 0.2 + k * 0.02, 0.2 + k * 0.02, 0.2, ry, 0x2c5a85); }
    const geo = (A9, m) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A9.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(A9.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(A9.c, 3)); g.computeBoundingSphere(); const ms = new T3.Mesh(g, m); ms.matrixAutoUpdate = false; ms.frustumCulled = false; ms.userData.fx = 1; return ms; };
    const MB = A.haze(new T3.MeshLambertMaterial({ vertexColors: true })), MG = A.haze(new T3.MeshBasicMaterial({ vertexColors: true }));
    const grp = new T3.Group(); grp.matrixAutoUpdate = false; grp.userData.fx = 1; grp.userData.tower = 1; const mb2 = geo(G, MB), mg = geo(H, MG); grp.add(mb2, mg);
    /* 간판(입구 차양 위 · 캔버스 한 장) */
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x2 = cv.getContext('2d'); x2.fillStyle = '#f4ecd8'; x2.fillRect(0, 0, 512, 128); x2.fillStyle = '#5f7f92'; x2.fillRect(0, 112, 512, 16);
    x2.fillStyle = '#2c4250'; x2.font = 'bold 64px "Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(en() ? 'Madi Tower' : '마디탑 전망대', 256, 58);
    const tx = new T3.CanvasTexture(cv); tx.colorSpace = T3.SRGBColorSpace; const MS = new T3.MeshLambertMaterial({ map: tx }), sg = new T3.Mesh(new T3.PlaneGeometry(6.4, 1.6), MS);
    sg.position.set(cx + fx * (apo + 0.09), doorY + 4.6, cz + fz * (apo + 0.09)); sg.rotation.y = fa; sg.updateMatrix(); sg.matrixAutoUpdate = false; grp.add(sg);
    const dA = Math.atan2(fz, fx), ea = { x: cx + Math.cos(dA) * (CORE + 1.1), z: cz + Math.sin(dA) * (CORE + 1.1) };
    return { site, grp, mats: [MB, MG, MS], geos: [mb2.geometry, mg.geometry, sg.geometry], tex: tx, MG, cx, cz, g0, Yd, fa, apo, tels,
      gate: { x: cx + fx * (apo + 2.2), z: cz + fz * (apo + 2.2) }, out: { x: cx + fx * (apo + 5.2), z: cz + fz * (apo + 5.2) }, lift: ea, arrive: { x: cx + Math.cos(dA) * (CORE + 2.6), z: cz + Math.sin(dA) * (CORE + 2.6) } }; }

  /* 랜드마크 = 이 마을 자료에 있는 것만(학교 · 뒷산 정상 · 바다 · 등대 · 섬 · 호수) — 한 줄 = 엔진이 지은 사실만 */
  function landmarks(cx, cz, Yd) { const P = A.places(), out = [], H9 = Math.round(Yd - A.TY);
    const C = [[p => p.school || /^우리 학교$/.test(p.name || ''), () => T2('우리 학교', 'Our school'), () => T2('정문을 나서면 마을 길이 시작돼요.', 'The town roads start at its front gate.')],
      [p => p.id === 'summit', p => T2('뒷산 정상', 'Mountain summit'), p => { const h = Math.round(Math.max(gy(p.x, p.z), map.q.groundAt(p.x, p.z, 2000)) - A.TY); return h > H9 ? T2('땅에서 약 ' + h + 'm — 이 전망대(' + H9 + 'm)보다 높아요. 등산로로 걸어 올라갈 수 있어요.', 'About ' + h + ' m high, taller than this deck (' + H9 + ' m). A trail goes up.') : T2('땅에서 약 ' + h + 'm — 등산로로 걸어 올라갈 수 있어요.', 'About ' + h + ' m high. A trail goes up.'); }],
      [p => /해수욕장/.test(p.name || ''), p => T2(p.name, p.en || 'Beach'), () => T2('바다와 모래사장이 만나는 곳이에요.', 'Where the sea meets the sand.')],
      [p => /등대/.test(p.name || ''), p => T2(p.name, p.en || 'Lighthouse'), () => T2('밤이 되면 불빛으로 배에게 길을 알려 줘요.', 'At night its light shows boats the way.')],
      [p => /섬/.test(p.name || '') && !/섬유/.test(p.name || ''), p => T2(p.name, p.en || 'Island'), p => (p.isle || /썰물/.test(p.name || '') ? T2('썰물 때 바닷길이 드러나면 걸어서 갈 수 있어요.', 'At low tide a sea path appears and you can walk there.') : T2('바다 위에 있는 섬이에요.', 'An island in the sea.'))],
      [p => /^호수$|호수$/.test(p.name || ''), p => T2(p.name, p.en || 'Lake'), () => T2('마을의 강물이 이어지는 큰 물이에요.', 'A big body of water linked to the river.')]];
    for (const [f, nm, ln] of C) { const p = P.find(q => f(q) && q.x != null); if (!p) continue; const d = Math.hypot(p.x - cx, p.z - cz); if (d < 120) continue; const a = Math.atan2(p.z - cz, p.x - cx);
      const o9 = out.find(o => Math.abs(Math.atan2(Math.sin(o.a0 - a), Math.cos(o.a0 - a))) < 1.05); if (o9) { if (Math.abs(Math.atan2(Math.sin(o9.a0 - a), Math.cos(o9.a0 - a))) < 0.35 && !o9.also.length) o9.also.push({ nm: nm(p), ln: ln(p), d }); continue; }   /* 같은 쪽(20° 안) = 같은 망원경에 한 줄 더 */
      if (out.length < 3) out.push({ also: [], id: p.id || nm(p)[0], nm: nm(p), ln: ln(p), x0: p.x, z0: p.z, d, a0: a, y: gy(p.x, p.z) }); }
    return out; }
  const dir8 = (dx, dz) => { const a = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; return DIR8[Math.round(a / 45) % 8]; };
  const km = d => (d >= 1000 ? (d / 1000).toFixed(1) + 'km' : Math.round(d / 10) * 10 + 'm');

  // ───────── 충돌(보이는 것 = 몸 막힘 · 광장·아랫집·전망층 바닥·난간·엘리베이터 집) ─────────
  function rows(cx, cz, r, y0, y1, nc, hw) { for (let z = -r; z < r; z += 1) { const zc = Math.min(Math.abs(z), Math.abs(z + 1)), w = hw ? hw(zc) : Math.sqrt(Math.max(0, r * r - zc * zc)); if (w < 0.2) continue; COL.push(map.collider.add({ x0: cx - w, x1: cx + w, y0, y1, z0: cz + z, z1: cz + z + 1, nc })); } }
  function colsOn() { if (COL.length || !built) return; const b = built, { cx, cz, g0, Yd } = b, ap = POD * Math.cos(Math.PI / 8);
    { const s9 = b.site, nS = stepsN(s9); for (let k = 0; k < nS; k++) rows(cx, cz, PLAZA - (nS - 1 - k) * 1.2, s9.lo - 2, stepY(s9, k), false); } rows(cx, cz, ap, g0 - 2, g0 + PODH + 0.5, false, z => Math.min(ap, ap * Math.SQRT2 - z));
    rows(cx, cz, DR, Yd - 1.2, Yd, false); rows(cx, cz, CORE, Yd, Yd + 3.8, false);
    const n = Math.ceil(2 * Math.PI * (RAIL - 0.2) / 0.75); for (let k = 0; k < n; k++) { const a = k / n * 6.2832, x = cx + Math.cos(a) * (RAIL - 0.2), z = cz + Math.sin(a) * (RAIL - 0.2); COL.push(map.collider.add({ x0: x - 0.3, x1: x + 0.3, y0: Yd, y1: Yd + 2.6, z0: z - 0.3, z1: z + 0.3, nc: true })); } }
  function colsOff() { for (const h of COL) h.remove(); COL = []; }

  // ───────── 오르내리기(엘리베이터 창 2.6초 · 층 숫자) ─────────
  const open = () => { const m = A.GAME.S.min % 1440; return m >= HOURS[0] && m < HOURS[1]; };
  function up() { if (ride || !built) return; if (!open()) return sayNow(en() ? '🛗 ' + L(NAME) + ' is closed now (open 9:00 to 22:00)' : '🛗 ' + L(NAME) + '은 지금 문을 닫았어요 (아침 9시 ~ 밤 10시)', 4);
    if (A.busy && A.busy()) return; if (A.prep && A.prep() === false) return; go(true); }
  function down() { if (ride) return; scopeOff(); go(false); }
  function go(isUp) { const b = built, FL = 52, H = Math.round(b.Yd - b.g0), t0 = performance.now(), DUR = 2600; sfx('ding');
    const pan = A.openP('<h3>🛗 ' + esc(L(NAME)) + (en() ? ' lift' : ' 엘리베이터') + '</h3><div style="display:flex;align-items:center;gap:22px;padding:6px 4px 10px"><div style="position:relative;width:16px;height:150px;border:2px solid #2c4250;border-radius:3px;background:#eef3f0"><div data-tw="dot" style="position:absolute;left:1px;width:10px;height:14px;background:#5f7f92;border-radius:2px;bottom:' + (isUp ? 1 : 133) + 'px"></div></div>'
      + '<div><div data-tw="fl" style="font-size:54px;font-weight:800;color:#2c4250;line-height:1">' + (isUp ? '1' : FL) + (en() ? 'F' : '층') + '</div><div data-tw="m" style="font-size:18px;color:#4a5a66;margin-top:6px">' + (isUp ? 0 : H) + 'm</div><div style="font-size:15px;color:#4a5a66;margin-top:10px">' + (isUp ? (en() ? 'Going up to the observation deck' : '전망층으로 올라가요') : (en() ? 'Going down to the ground' : '땅으로 내려가요')) + '</div></div></div>', false, 'tower');
    ride = { isUp, t0, pan, iv: 0 }; log('ride ' + (isUp ? 'up' : 'down'));
    ride.iv = setInterval(() => { if (dead) return; const k = Math.min(1, (performance.now() - t0) / DUR), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, f = isUp ? e : 1 - e;
      if (pan && pan.isConnected) { const q = s => pan.querySelector('[data-tw="' + s + '"]'); q('fl').textContent = Math.max(1, Math.round(1 + f * (FL - 1))) + (en() ? 'F' : '층'); q('m').textContent = Math.round(f * H) + 'm'; q('dot').style.bottom = (1 + f * 132) + 'px'; }
      if (k >= 1) { clearInterval(ride.iv); arrive(isUp, pan && pan.isConnected); } }, 50); }
  function arrive(isUp, mine) { const b = built; ride = null; if (mine) A.closeP();   /* 엘리베이터 창이 아직 떠 있을 때만 닫음(그사이 연 다른 창은 그대로) */ if (isUp) { map.player.teleport([b.arrive.x, b.Yd + 0.05, b.arrive.z]); map.player.lookAt([b.cx + (b.arrive.x - b.cx) * 3, b.cz + (b.arrive.z - b.cz) * 3]); mode = 'deck'; sfx('done');
      const S = A.GAME.S; S.tower = S.tower || { n: 0 }; S.tower.n = (S.tower.n | 0) + 1; A.GAME.mark && A.GAME.mark(); if (A.rec) A.rec('tower', { n: S.tower.n });
      say(en() ? '🏙 Deck ' + Math.round(b.Yd - b.g0) + ' m up. Walk around and use a telescope (E).' : '🏙 땅에서 ' + Math.round(b.Yd - b.g0) + 'm 전망층이에요. 걸어 다니며 망원경(E)으로 멀리 봐요.', 5); }
    else { map.player.teleport([b.out.x, A.ty(b.out.x, b.out.z) + 0.3, b.out.z]); map.player.lookAt([b.out.x + (b.out.x - b.cx), b.out.z + (b.out.z - b.cz)]); mode = ''; sfx('tick'); } log('arrive ' + (isUp ? 'deck' : 'ground')); }

  // ───────── 망원경(peek 시점 · 좁은 화각 · 고개는 ±40°) ─────────
  let ov = null, keyH = null;
  function scopeOn(t) { if (scope) return scopeOff(); const b = built, C9 = window.SD2 && SD2.CTRL; if (!C9) return; const ex = b.cx + Math.cos(t.a) * (RAIL + 0.7), ez = b.cz + Math.sin(t.a) * (RAIL + 0.7), ey = b.Yd + 2.2,   /* 눈 = 난간 밖(바닥·난간이 시야를 가리지 않게) */ dx = t.x0 - ex, dz = t.z0 - ez, dist = Math.hypot(dx, dz);
    const yaw = Math.atan2(-dx, -dz), down9 = Math.atan2(ey - t.y - 20, dist); map.player.lookAt([t.x0, t.z0]); if (map.player.setPitch) map.player.setPitch(0.3 + Math.max(-0.3, Math.min(0.33, down9)));
    C9.peek = { x: ex, y: ey, z: ez, yaw, fov: 16 }; map.player.freeze(true); scope = { t, T: 0 }; sfx('tick');
    ov = document.createElement('div'); ov.className = 'twn-scope'; ov.style.cssText = 'position:fixed;inset:0;z-index:40;pointer-events:none;display:flex;align-items:center;justify-content:center';
    const d8 = dir8(t.x0 - b.cx, t.z0 - b.cz);
    ov.innerHTML = '<div style="width:min(82vmin,640px);height:min(82vmin,640px);border-radius:50%;box-shadow:0 0 0 200vmax rgba(12,18,24,.9);border:6px solid #1e2a33"></div><div style="position:absolute;left:50%;bottom:6vh;transform:translateX(-50%);max-width:min(560px,92vw);background:#f7f2e6;color:#22313b;border:2px solid #2c4250;border-radius:8px;padding:10px 16px;font-size:17px;line-height:1.45;pointer-events:auto">'
      + '<b style="font-size:20px">🔭 ' + esc(L(t.nm)) + '</b> <span style="color:#4a5a66">' + (en() ? L(d8) + ' · ' + km(t.d) : L(d8) + '쪽 · ' + km(t.d)) + '</span><br>' + esc(L(t.ln)) + t.also.map(q => '<br><span style="color:#4a5a66">' + (q.d > t.d ? (en() ? 'Farther: ' : '더 멀리: ') : (en() ? 'Nearer: ' : '더 가까이: ')) + '</span><b>' + esc(L(q.nm)) + '</b> ' + km(q.d) + ' — ' + esc(L(q.ln))).join('') + '<br><button data-tw="x" style="margin-top:8px;min-height:40px;padding:4px 16px;font-size:16px;border:2px solid #2c4250;border-radius:6px;background:#fff;cursor:pointer">' + (en() ? 'Step back (E)' : '그만 보기 (E)') + '</button></div>';
    ov.querySelector('[data-tw="x"]').onclick = () => scopeOff(); document.body.appendChild(ov);
    keyH = e => { if (/^(Escape|KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.code)) scopeOff(); }; addEventListener('keydown', keyH, true);
    const S = A.GAME.S; S.tower = S.tower || { n: 0 }; S.tower.seen = S.tower.seen || {}; S.tower.seen[t.id] = 1; log('scope ' + t.id); }
  function scopeOff() { if (!scope) return; const C9 = window.SD2 && SD2.CTRL; if (C9) C9.peek = null; map.player.freeze(false); scope = null; if (ov) { ov.remove(); ov = null; } if (keyH) { removeEventListener('keydown', keyH, true); keyH = null; } log('scope off'); }

  // ───────── E 자리 ─────────
  function entries(push) { if (dead || !A.on()) return; const R = A.root(); if (!R) return;
    if (!built && tries < 2) { tries++; const s = pick(); if (s) { built = build(s); log('site ' + Math.round(s.x) + ',' + Math.round(s.z) + ' ' + s.at); } else log('no site'); }
    if (!built) return; if (R9 !== R) { if (built.grp.parent) built.grp.parent.remove(built.grp); R.add(built.grp); built.grp.updateMatrixWorld(true); R9 = R; } colsOn(); paint(true);
    const b = built, add = (x, z, y, r, label, use) => push(map.interact.add({ kind: 'game', x, z, y, r, label, use }));
    add(b.gate.x, b.gate.z, b.g0, 2.2, en() ? '🛗 Go up ' + L(NAME) + ' (observation deck)' : '🛗 ' + L(NAME) + ' 전망대 올라가기', up);
    add(b.lift.x, b.lift.z, b.Yd, 1.8, en() ? '🛗 Take the lift down' : '🛗 엘리베이터로 내려가기', down);
    for (const t of b.tels) add(t.ex, t.ez, b.Yd, 1.3, '🔭 ' + (en() ? 'Telescope: ' : '망원경 — ') + L(t.nm), () => scopeOn(t));
    if (A.addPlace) A.addPlace({ id: 'tower', name: L(NAME) + (en() ? '' : ' 전망대'), en: 'Madi Tower', kind: 'prop', x: b.cx, z: b.cz, door: [b.gate.x, b.gate.z], icon: '🏙', sym: '🏙', ai: '사용자 10-26 랜드마크 전망 타워(AI)', prop: true }); }
  /* 밤 = 띠 불빛 또렷이 · 낮 = 연한 크림(1초 칸에서 때가 바뀔 때만) */
  function paint(force) { if (!built) return; const v = Math.max(0, Math.min(1, A.night ? A.night() : 0)), k = Math.round(v * 10); if (!force && k === ph9) return; ph9 = k; const s = 0.8 + 0.2 * v; built.MG.color.setRGB(s, s, s); }
  const onDeck = () => { if (!built) return false; const p = map.player.get(); return Math.abs(p.y - built.Yd) < 3 && Math.hypot(p.x - built.cx, p.z - built.cz) < DR + 1; };
  function sec() { if (!built) return; if (!A.on()) { colsOff(); scopeOff(); if (built.grp.parent) { built.grp.parent.remove(built.grp); R9 = null; } mode = ''; return; }
    paint(false); if (mode === 'deck' && !onDeck() && !ride) { mode = ''; scopeOff(); log('left deck'); } else if (!mode && onDeck()) mode = 'deck'; }
  function tick(dt) { if (dead) return; if ((acc += dt) >= 1) { acc = 0; sec(); }
    if (mode === 'deck' && !ride) { const p = map.player.get(); if (p.y < built.Yd - 4 && Math.hypot(p.x - built.cx, p.z - built.cz) < DR + 6) { map.player.teleport([built.arrive.x, built.Yd + 0.05, built.arrive.z]); log('catch'); } }
    if (scope && (scope.T += dt) > 25) scopeOff(); }
  function dispose() { dead = true; scopeOff(); if (ride) { clearInterval(ride.iv); ride = null; } colsOff(); if (built) { if (built.grp.parent) built.grp.parent.remove(built.grp); for (const g of built.geos) g.dispose(); for (const m of built.mats) m.dispose(); built.tex.dispose(); built = null; } }
  return { entries, tick, dispose, va: () => (built && !ride && onDeck() ? 1 : 0), on: () => !!built, info: () => ({ built: !!built, mode, ride: !!ride, scope: scope ? scope.t.id : null, cols: COL.length, site: built ? { x: +built.cx.toFixed(1), z: +built.cz.toFixed(1), g0: +built.g0.toFixed(2), Yd: +built.Yd.toFixed(2), top: +(built.Yd + SPIRE).toFixed(1), fa: +built.fa.toFixed(2), cell: A.cell(built.cx, built.cz) } : null, gate: built && built.gate, lift: built && built.lift, tels: built ? built.tels.map(t => ({ id: t.id, nm: t.nm[0], ln: t.ln[0], d: Math.round(t.d), x: t.ex, z: t.ez, dir: dir8(t.x0 - built.cx, t.z0 - built.cz)[0] })) : [], dbg: DBG.slice() }), dbg: { scan, siteOk, up: () => up(), down: () => down(), scopeOff } };
}
