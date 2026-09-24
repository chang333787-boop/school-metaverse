// v2 맵 건강 검진(MAP-HEALTH-1 · 09-24) — ?check=1(빠른 판)·?health=1·SD2.health(opt)일 때만 불러온다(학생 접속엔 0바이트).
// 플레이어와 **같은 함수**(SD2.phys·길격자 nav.js)로 게임을 깨는 결함을 잰다. 월드는 읽기만 한다(SD2.step을 쓰는 문 직진 시험만 플레이어를 옮겼다 되돌림).
//   빠른 판(quick): 걷기/점프 그래프 · 갇힘 · 울타리 밖 · 계단 턱 · 올라서기 금지 무력화 · 구역 이름 · 문 그래프 · 상호작용 지점     (~0.6초)
//   전체 판        : + 보이는 기하 복셀화 → 보이지 않는 벽·뚫림·떠 있음 · 3인칭 카메라 벽 뚫림 · 문 직진 · 구역별 성능 · 그림(img)
// 게이트(0이어야 통과)와 래칫(기준선보다 늘면 실패)을 나눈다. 허용목록(ALLOW)은 항목마다 why 필수. 정본 = docs/map_api.md §건강 검진
export const BASELINE = {   // 래칫 기준선(09-24 impl-gamemap 실측 · NS-RAISE·보건실 책상 뒤) — 줄면 여기도 줄인다. 늘면 실패(새 결함인지 목록으로 확인)
  ghost: 461, sunk: 1095, floating: 332, nsBypass: 0, perch: 30, noZonePct: 5, multiZone: 1101, tallStep: 2797,
};
export const ALLOW = {
  invisible: [   // 보이지 않는 벽 허용 구간(x0,x1,z0,z1) — 이유 필수
    { x0: -95, x1: 70, z0: 58, z1: 70, why: '학교 둘레 밖 도로·동네(정문 밖) — 울타리 밖은 게이트가 따로 본다' },
    { x0: 12.8, x1: 20.2, z0: 54.9, z1: 56.1, why: '정문 선 막이(SOUTH-2 world.js) — 영상은 교문이 열려 있어 보이는 문이 없지만 게임 기초 맵이라 학교 밖 도로로 못 나가게 일부러 막음' },
  ],
  deadDoors: [],  // 일부러 막힌 문 [x, z, why]
  multiZone: [   // 월드 구역 겹침 중 '일부러 포갠' 짝(작은 구역이 큰 구역 안의 한 자리 — 판정은 가장 좁은 구역이 이긴다). 이 두 라벨만 겹친 칸은 세지 않는다
    { a: '계단참', b: '계단', why: 'U자 계단 반층 참 — 계단 안의 한 자리(숨바꼭질·위치 칩이 참을 부른다)' },
    { a: '계단 밑 창고', b: '계단', why: '계단 밑 숨는 칸 — world.js가 일부러 첫 일치로 넣은 지점' },
    { a: '체육관 현관', b: '체육관 옆길', why: '현관 참(차양 밑)이 옆길 보도블록 한가운데에 있다(FWG 영상 g_091~102)' },
    { a: '체육관 계단', b: '운동장', why: '운동장 서쪽 띠 북끝의 화강석 계단(g_082~091) — 띠 안의 한 자리' },
    { a: '현관 앞', b: '앞뜰 산책로', why: '현관 돌출부 앞 참이 산책로 띠 안에 있다(합치기 전 기준선에도 있던 겹침)' },
    { a: '개수대', b: '동쪽 통학로', why: '개수대가 통학로 띠 안에 선다(사용자 09-23 (44,16))' },
    { a: '숲놀이터', b: '운동장', why: '큰 나무 아래 숲놀이터가 운동장 남동 구석을 차지한다(사용자 09-24 — 합치기 전 기준선 664칸)' },
    { a: '구령대', b: '앞뜰 남쪽 화단', why: '구령대가 남 화단 띠를 끊고 둔덕까지 나온다(u_272~299 — 구령대가 이긴다)' },
  ],
};

export async function runHealth(SD2, opt = {}) {
  const T00 = performance.now(), TM = {}, lap = k => { TM[k] = Math.round(performance.now() - T00); };
  const quick = !!opt.quick, W = SD2.world, C = W.colliders, G = W.grid, MAP = SD2.map, Z = W.zones;
  const { groundAt, blockedAt, ceilAt, camHit } = SD2.phys;
  const R = { version: 1, quick, counts: {}, lists: {}, gates: {} }, K = R.counts, Lst = R.lists;
  const S = 0.3, DX = [1, -1, 0, 0], DZ = [0, 0, 1, -1];
  // 상자 조회(8m 격자 — 물리와 같은 부풀림 0.26)
  const NC = C.length, stamp = new Int32Array(NC + 4096); let ST = 0;
  const near = (x, z, r, fn) => { ST++; for (let gx = Math.floor((x - r) / 8); gx <= Math.floor((x + r) / 8); gx++) for (let gz = Math.floor((z - r) / 8); gz <= Math.floor((z + r) / 8); gz++) {
    const cell = G.get(gx + ':' + gz); if (!cell) continue; for (const i of cell) { if (stamp[i] === ST) continue; stamp[i] = ST; if (fn(C[i], i)) return true; } } return false; };
  const inB = (b, x, z) => x > b.x0 - 0.26 && x < b.x1 + 0.26 && z > b.z0 - 0.26 && z < b.z1 + 0.26;
  const blockersAt = (x, z, y) => { const o = []; near(x, z, 0.3, (b, i) => { if (inB(b, x, z) && b.y1 > y + 0.55 && b.y0 < y + 1.5) o.push(i); return false; }); return o; };
  const zname = (x, y, z) => { const q = MAP.zoneAt(x, y, z); return q ? q.label : '(구역 없음)'; };
  const clusters = (idx, X, Zf, Y, cell = 1.5, top = 12) => { const m = new Map();
    for (const i of idx) { const k = Math.floor(X(i) / cell) + ',' + Math.floor(Zf(i) / cell) + ',' + Math.round(Y(i)); const e = m.get(k); if (e) e.n++; else m.set(k, { n: 1, x: +X(i).toFixed(1), z: +Zf(i).toFixed(1), y: +Y(i).toFixed(2) }); }
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, top).map(c => ({ ...c, zone: zname(c.x, c.y, c.z) })); };

  // ---------- H1 걷기 그래프 · 점프 포함 그래프 · 갇힘 · 울타리 밖 · 옥상 · 계단 턱 ----------
  const F = MAP.navSync(opt.fresh ? { fresh: true } : {}).raw;        // 걷기(도달성 게이트와 같은 격자)
  const FJ = MAP.navSync({ jump: 'both', fresh: !!opt.fresh }).raw;  // 걷기 + 점프
  lap('graphs');
  const inWalk = new Uint8Array(FJ.count), jOf = new Int32Array(F.count);
  for (let i = 0; i < F.count; i++) { const j = FJ.find(F.ix[i], F.iz[i], Math.round(F.y[i] * 2)); jOf[i] = j; if (j >= 0) inWalk[j] = 1; }
  const cls = new Uint8Array(F.count); let trapW = 0, trapJ = 0;   // 1 = 걸어서는 못 돌아옴(점프로 탈출) · 2 = 점프로도 못 돌아옴
  for (let i = 0; i < F.count; i++) { if (F.canReturn[i]) continue; const j = jOf[i]; if (j >= 0 && FJ.canReturn[j]) { cls[i] = 1; trapW++; } else { cls[i] = 2; trapJ++; } }
  const jumpOnly = []; for (let j = 0; j < FJ.count; j++) if (!inWalk[j]) jumpOnly.push(j);
  const oobW = [], oobJ = [];
  for (let i = 0; i < F.count; i++) if (!F.inSchool[i]) oobW.push(i);
  for (const j of jumpOnly) if (!FJ.inSchool[j]) oobJ.push(j);
  const U = W.UPPER; let roof = 0;
  for (let j = 0; j < FJ.count; j++) { const x = FJ.X(j), z = FJ.Z(j); if (FJ.y[j] > 3.0 && !(x > U[0] - 0.2 && x < U[1] + 0.2 && z > U[2] - 0.2 && z < U[3] + 0.2) && FJ.inSchool[j]) roof++; }
  let tall = 0; for (let i = 0; i < F.count; i++) for (let d = 0; d < 4; d++) { const j = F.e[i * 4 + d]; if (j >= 0) { const dy = F.y[j] - F.y[i]; if (dy > 0.3 && dy <= 0.55) tall++; } }
  Object.assign(K, { cells: F.count, jumpCells: FJ.count, trapWalkOnly: trapW, trapEvenJump: trapJ, jumpOnly: jumpOnly.length, oobWalk: oobW.length, oobJump: oobJ.length, roof, tallStep: tall });
  const FX = i => F.X(i), FZ = i => F.Z(i), FY = i => F.y[i], JX = j => FJ.X(j), JZ = j => FJ.Z(j), JY = j => FJ.y[j];
  Lst.trapWalkOnly = clusters([...cls.keys()].filter(i => cls[i] === 1), FX, FZ, FY);
  Lst.trapEvenJump = clusters([...cls.keys()].filter(i => cls[i] === 2), FX, FZ, FY);
  Lst.oobWalk = clusters(oobW, FX, FZ, FY, 4, 8); Lst.oobJump = clusters(oobJ, JX, JZ, JY, 4, 8);
  lap('traps');

  // ---------- H9 올라서기 금지(NS) 무력화 · 올라앉는 곳: 점프로만 닿는 칸이 어떤 충돌 상자 윗면에 서 있나 ----------
  { const ns = new Map(), perch = new Map();
    for (const j of jumpOnly) { if (!FJ.inSchool[j]) continue; const x = FJ.X(j), z = FJ.Z(j), y = FJ.y[j];
      near(x, z, 0.3, (b, i) => { if (inB(b, x, z) && Math.abs(b.y1 - y) < 0.011) { const top = y - W.baseAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2), m = b.nc ? ns : perch;
        if (m === ns || top > 0.6) { const e = m.get(i); if (e) e.n++; else m.set(i, { n: 1, top: +top.toFixed(2), box: [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1].map(v => +v.toFixed(2)) }); } } return false; }); }
    K.nsBypass = ns.size; K.perch = perch.size;
    Lst.nsBypass = [...ns.values()].sort((a, b) => b.n - a.n).slice(0, 25); Lst.perch = [...perch.values()].sort((a, b) => b.top - a.top).slice(0, 25); }
  lap('ns');

  // ---------- H10 구역 이름 ----------
  { let ins = 0, noz = 0, multi = 0; const own = new Int32Array(Z.length), noZ = [], multiPairs = new Map();
    for (let i = 0; i < F.count; i++) { if (!F.inSchool[i]) continue; ins++; const zi = F.zone[i]; if (zi < 0) { noz++; noZ.push(i); } else own[zi]++;
      if (zi >= 0) { const x = F.X(i), z = F.Z(i), y = F.y[i], L = []; for (const q of Z) if (!q.extra && MAP.inZone(q, x, y, z)) L.push(q.label);   // 월드 구역끼리 겹침만(덧붙인 넓은 구역은 일부러 겹친다)
        if (L.length > 1 && !(L.length === 2 && ALLOW.multiZone.some(a => (a.a === L[0] && a.b === L[1]) || (a.a === L[1] && a.b === L[0])))) { multi++; const key = L.join(' | '); multiPairs.set(key, (multiPairs.get(key) || 0) + 1); } } }
    K.noZonePct = +(100 * noz / Math.max(1, ins)).toFixed(1); K.multiZone = multi;
    Lst.multiZone = [...multiPairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    Lst.noZoneTop = clusters(noZ, FX, FZ, FY, 6, 15); Lst.shadowedZones = Z.map((q, k) => [q.label, own[k]]).filter(a => a[1] < 40);
    Lst.anchors = MAP.pois({ src: 'zone' }).map(p => ({ zone: p.zone, label: p.label, at: p.stand ? p.stand.map(v => +v.toFixed(2)) : null })); }
  lap('zones');

  // ---------- H7 문: 문 양쪽 0.9m 칸 사이 걷기 경로(문 중심 6m 안 BFS) — 양방향 ≤ 4m ----------
  { const mark = new Int32Array(F.count), dist = new Float32Array(F.count), qq = new Int32Array(F.count); let run = 0;
    const bfs = (a, b, cx, cz) => { run++; let h = 0, t = 0; qq[t++] = a; mark[a] = run; dist[a] = 0;
      while (h < t) { const v = qq[h++]; if (v === b) return dist[v] * S; for (let d = 0; d < 4; d++) { const u = F.e[v * 4 + d]; if (u < 0 || mark[u] === run) continue;
        if ((F.X(u) - cx) ** 2 + (F.Z(u) - cz) ** 2 > 36) continue; mark[u] = run; dist[u] = dist[v] + 1; qq[t++] = u; } } return -1; };
    const bad = [];
    W.doors.forEach((d, k) => {
      if (ALLOW.deadDoors.some(a => Math.abs(a[0] - d.cx) < 0.5 && Math.abs(a[1] - d.cz) < 0.5)) return;
      const nX = d.ax === 'x' ? 0 : 1, nZ = d.ax === 'x' ? 1 : 0;
      const A = F.snap(d.cx - nX * 0.9, d.y0, d.cz - nZ * 0.9, 0.45, -0.6, 0.6), B = F.snap(d.cx + nX * 0.9, d.y0, d.cz + nZ * 0.9, 0.45, -0.6, 0.6);
      const r = { door: 'door:' + k, at: [+d.cx.toFixed(2), +d.cz.toFixed(2)], y0: d.y0, w: +d.w.toFixed(2), zones: d.zones };
      if (A < 0 || B < 0) { r.why = '문 옆 칸 없음 ' + (A < 0 ? 'A' : '') + (B < 0 ? 'B' : ''); bad.push(r); return; }
      const ab = bfs(A, B, d.cx, d.cz), ba = bfs(B, A, d.cx, d.cz);
      if (ab < 0 || ba < 0 || ab > 4 || ba > 4) { r.why = '경로 ' + [ab, ba].map(v => +v.toFixed(1)).join('/') + 'm'; bad.push(r); }
    });
    K.doorGraphFail = bad.length; Lst.doors = bad; }
  lap('doors');

  // ---------- H8 상호작용 지점: 도달 · 앉았다 일어날 때 끼임 · 미끄럼틀 끝 ----------
  { const bad = [];
    for (const h of W.hotspots) { if (h.off || h.kind === 'game') continue;
      if (F.snap(h.x, h.y, h.z, h.r + S / 2, -1.6, 1.6) < 0) bad.push({ id: h.id, why: '닿는 칸 없음', at: [+h.x.toFixed(2), +h.z.toFixed(2), h.y] });
      if (h.kind === 'sit' && blockedAt(h.x, h.z, h.y) && !DX.some((dx, d) => !blockedAt(h.x + dx * 0.07, h.z + DZ[d] * 0.07, h.y))) bad.push({ id: h.id, why: '일어나면 끼임', at: [+h.x.toFixed(2), +h.z.toFixed(2), h.y] });
      if (h.kind === 'slide' && h.to && blockedAt(h.to[0], h.to[2], h.to[1])) bad.push({ id: h.id, why: '미끄럼틀 끝 막힘', at: h.to }); }
    K.hotspotBad = bad.length; Lst.hotspots = bad; }
  lap('hot');

  if (!quick) {
    // ---------- H2 보이는 기하 복셀화(0.1m 기둥 × 0.1m 층) + 윗면 지도(0.3m × 0.05m) ----------
    SD2.scene.updateMatrixWorld(true);
    const meshes = []; SD2.scene.children.forEach(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return; const m = o.material; if (o.frustumCulled === false && m && m.fog === false) return; meshes.push(o); });
    const VX0 = -92, VZ0 = -92, VH = 0.1, VNX = 1580, VNZ = 1600, VY0 = -2, VDY = 0.1, VW = 4, vb4 = new Uint32Array(VNX * VNZ * VW);
    const FX0 = -92, FZ0 = -92, FHs = 0.3, FNX = 527, FNZ = 534, FQ = 0.05, FW = 10, fb = new Uint32Array(FNX * FNZ * FW);
    const mark = (x, y, z) => { const ix = Math.floor((x - VX0) / VH), iz = Math.floor((z - VZ0) / VH); if (ix < 0 || iz < 0 || ix >= VNX || iz >= VNZ) return; const iy = Math.floor((y - VY0) / VDY); if (iy < 0 || iy >= VW * 32) return; vb4[(ix * VNZ + iz) * VW + (iy >> 5)] |= (1 << (iy & 31)) >>> 0; };
    const fmark = (ix, iz, y) => { const q = Math.floor((y - VY0) / FQ); if (q < 0 || q >= FW * 32) return; fb[(ix * FNZ + iz) * FW + (q >> 5)] |= (1 << (q & 31)) >>> 0; };
    const V3 = SD2.camera.position.constructor, M4 = SD2.camera.matrixWorld.constructor, va = new V3(), vb = new V3(), vc = new V3(), ident = new M4();
    let triN = 0, softN = 0;
    // 몸이 지나가도 되는 낮은 풀·작물(world.soft — AABB마다 why)은 무게중심이 그 안인 삼각형을 복셀에서 뺀다(뚫림·발 묻힘 검진 오류 · integ 09-25)
    const SOFT = W.soft || [], SG = new Map(); for (const v of SOFT) for (let gx = Math.floor(v.x0 / 4); gx <= Math.floor(v.x1 / 4); gx++) for (let gz = Math.floor(v.z0 / 4); gz <= Math.floor(v.z1 / 4); gz++) { const k = gx * 1000 + gz; if (!SG.has(k)) SG.set(k, []); SG.get(k).push(v); }
    const isSoft = (x, y, z) => { const L = SG.get(Math.floor(x / 4) * 1000 + Math.floor(z / 4)); if (L) for (const v of L) if (x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1 && y > v.y0 && y < v.y1) return true; return false; };
    for (const o of meshes) {
      const Pp = o.geometry.attributes.position, I = o.geometry.index, M = o.matrixWorld, useM = !M.equals(ident), nT = I ? I.count / 3 : Pp.count / 3;
      for (let t = 0; t < nT; t++) {
        va.fromBufferAttribute(Pp, I ? I.getX(t * 3) : t * 3); vb.fromBufferAttribute(Pp, I ? I.getX(t * 3 + 1) : t * 3 + 1); vc.fromBufferAttribute(Pp, I ? I.getX(t * 3 + 2) : t * 3 + 2);
        if (useM) { va.applyMatrix4(M); vb.applyMatrix4(M); vc.applyMatrix4(M); }
        const mnx = Math.min(va.x, vb.x, vc.x), mxx = Math.max(va.x, vb.x, vc.x), mnz = Math.min(va.z, vb.z, vc.z), mxz = Math.max(va.z, vb.z, vc.z);
        if (mxx < VX0 || mnx > VX0 + VNX * VH || mxz < VZ0 || mnz > VZ0 + VNZ * VH) continue; triN++;
        if (SG.size && isSoft((va.x + vb.x + vc.x) / 3, (va.y + vb.y + vc.y) / 3, (va.z + vb.z + vc.z) / 3)) { softN++; continue; }
        const ux = vb.x - va.x, uy = vb.y - va.y, uz = vb.z - va.z, wx = vc.x - va.x, wy = vc.y - va.y, wz = vc.z - va.z;
        const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, nl = Math.hypot(nx, ny, nz); if (nl < 1e-9) continue;
        const area = nl / 2, nyn = ny / nl;
        if (nyn > 0.3) {   // 윗면 지도
          const d = (vb.z - vc.z) * (va.x - vc.x) + (vc.x - vb.x) * (va.z - vc.z);
          if (Math.abs(d) > 1e-9) {
            const i0x = Math.max(0, Math.ceil((mnx - FX0) / FHs - 0.5)), i1x = Math.min(FNX - 1, Math.floor((mxx - FX0) / FHs - 0.5)), i0z = Math.max(0, Math.ceil((mnz - FZ0) / FHs - 0.5)), i1z = Math.min(FNZ - 1, Math.floor((mxz - FZ0) / FHs - 0.5));
            for (let ix = i0x; ix <= i1x; ix++) for (let iz = i0z; iz <= i1z; iz++) { const px = FX0 + (ix + 0.5) * FHs, pz = FZ0 + (iz + 0.5) * FHs;
              const l1 = ((vb.z - vc.z) * (px - vc.x) + (vc.x - vb.x) * (pz - vc.z)) / d, l2 = ((vc.z - va.z) * (px - vc.x) + (va.x - vc.x) * (pz - vc.z)) / d, l3 = 1 - l1 - l2;
              if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue; fmark(ix, iz, l1 * va.y + l2 * vb.y + l3 * vc.y); }
            if (mxx - mnx < FHs || mxz - mnz < FHs) { const cx = (va.x + vb.x + vc.x) / 3, cz = (va.z + vb.z + vc.z) / 3, ix = Math.floor((cx - FX0) / FHs), iz = Math.floor((cz - FZ0) / FHs); if (ix >= 0 && iz >= 0 && ix < FNX && iz < FNZ) fmark(ix, iz, (va.y + vb.y + vc.y) / 3); }
          }
        }
        if (Math.abs(nyn) > 0.9 && area > 4) continue;   // 큰 수평면(바닥·천장·지붕)은 '보이는 부재'에서 뺀다
        const lab = Math.hypot(ux, uy, uz), lca = Math.hypot(wx, wy, wz), lbc = Math.hypot(vc.x - vb.x, vc.y - vb.y, vc.z - vb.z);
        let o0 = va, p1 = vb, p2 = vc; if (lab >= lbc && lab >= lca) { o0 = vc; p1 = va; p2 = vb; } else if (lca >= lbc && lca >= lab) { o0 = vb; p1 = vc; p2 = va; }
        const Ux = p1.x - o0.x, Uy = p1.y - o0.y, Uz = p1.z - o0.z, Vx = p2.x - o0.x, Vy = p2.y - o0.y, Vz = p2.z - o0.z;
        const nu = Math.max(1, Math.ceil(Math.hypot(Ux, Uy, Uz) / 0.07)), nv = Math.max(1, Math.ceil(Math.hypot(Vx, Vy, Vz) / 0.07)); if (nu * nv > 3e6) continue;
        for (let i = 0; i <= nu; i++) { const s = i / nu; for (let j = 0; j <= nv; j++) { const tt = j / nv; if (s + tt > 1.0001) break; mark(o0.x + Ux * s + Vx * tt, o0.y + Uy * s + Vy * tt, o0.z + Uz * s + Vz * tt); } }
      }
    }
    K.voxTris = triN; K.softTris = softN; lap('voxel');
    // lo = true: 아래 끝이 걸친 층(0.1m)은 빼고 y0 위에서 시작하는 층만 — 발 묻힘·뚫림에서 발+0.05~0.15의 턱·연석·바닥 무늬가 층 반올림으로 세이던 검진 오류(integ 09-24)
    const visAny = (x0, x1, z0, z1, y0, y1, lo = false) => { const a = Math.max(0, Math.floor((x0 - VX0) / VH)), b = Math.min(VNX - 1, Math.floor((x1 - VX0) / VH)), c = Math.max(0, Math.floor((z0 - VZ0) / VH)), d = Math.min(VNZ - 1, Math.floor((z1 - VZ0) / VH));
      const q0 = Math.max(0, lo ? Math.ceil((y0 - VY0) / VDY - 1e-6) : Math.floor((y0 - VY0) / VDY)), q1 = Math.min(VW * 32 - 1, Math.floor((y1 - VY0) / VDY)); if (q1 < q0) return false;
      const m = [0, 0, 0, 0]; for (let q = q0; q <= q1; q++) m[q >> 5] |= (1 << (q & 31));
      for (let ix = a; ix <= b; ix++) for (let iz = c; iz <= d; iz++) { const k = (ix * VNZ + iz) * VW; if ((vb4[k] & m[0]) || (vb4[k + 1] & m[1]) || (vb4[k + 2] & m[2]) || (vb4[k + 3] & m[3])) return true; } return false; };
    const floorBelow = (x, z, y) => { const ix = Math.floor((x - FX0) / FHs), iz = Math.floor((z - FZ0) / FHs); if (ix < 0 || iz < 0 || ix >= FNX || iz >= FNZ) return null;
      const base = (ix * FNZ + iz) * FW; for (let q = Math.min(FW * 32 - 1, Math.floor((y - VY0) / FQ)); q >= 0; q--) if (fb[base + (q >> 5)] & (1 << (q & 31))) return VY0 + (q + 0.5) * FQ; return null; };
    // ---------- H3 보이지 않는 벽: 막힌 간선 앞 ±0.36·발+0.05~1.5에 보이는 기하가 하나도 없음 ----------
    const invis = [], invCol = new Map(), BE = F.blockedEdges || [];
    for (let k = 0; k < BE.length; k++) { const c = BE[k] >> 2, d = BE[k] & 3, cy = F.y[c], tx = F.X(c) + DX[d] * S, tz = F.Z(c) + DZ[d] * S;
      if (ALLOW.invisible.some(a => tx >= a.x0 && tx <= a.x1 && tz >= a.z0 && tz <= a.z1)) continue;
      if (visAny(tx - 0.36, tx + 0.36, tz - 0.36, tz + 0.36, cy + 0.05, cy + 1.5)) continue;
      invis.push(c); for (const bi of blockersAt(tx, tz, cy)) invCol.set(bi, (invCol.get(bi) || 0) + 1); }
    K.invisibleEdges = invis.length; Lst.invisible = clusters(invis, FX, FZ, FY, 2, 15);
    Lst.invisibleColliders = [...invCol.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([i, n]) => { const b = C[i]; return { n, i, box: [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1].map(v => +v.toFixed(2)), nc: !!b.nc }; });
    // ---------- H4·H5 뚫림(몸 높이에 보이는 기하) · 발 묻힘 · 떠 있음 · 바닥 없음 ----------
    const ghost = [], sunk = [], floating = [], voidF = [];
    for (let i = 0; i < F.count; i++) { if (!F.inSchool[i]) continue; const x = F.X(i), z = F.Z(i), y = F.y[i];
      if (visAny(x - 0.05, x + 0.05, z - 0.05, z + 0.05, y + 0.4, y + 1.3, true)) ghost.push(i);
      if (visAny(x - 0.05, x + 0.05, z - 0.05, z + 0.05, y + 0.15, y + 0.4, true)) sunk.push(i);
      let best = null; for (const ox of [-0.3, 0, 0.3]) for (const oz of [-0.3, 0, 0.3]) { const v = floorBelow(x + ox, z + oz, y + 0.04); if (v !== null && (best === null || v > best)) best = v; }
      if (best === null) voidF.push(i); else if (y - best > 0.15) floating.push(i); }
    Object.assign(K, { ghost: ghost.length, sunk: sunk.length, floating: floating.length, void: voidF.length });
    if (opt.raw) { const P3 = a => a.map(i => [+F.X(i).toFixed(2), +F.Z(i).toFixed(2), +F.y[i].toFixed(2)]); R.raw = { ghost: P3(ghost), sunk: P3(sunk), invisible: P3(invis), floating: P3(floating) }; }   // 칸 전체(분류·원인 찾기용)
    Lst.ghost = clusters(ghost, FX, FZ, FY, 1.5, 20); Lst.floating = clusters(floating, FX, FZ, FY, 2, 12); Lst.sunk = clusters(sunk, FX, FZ, FY, 1.5, 12); Lst.void = clusters(voidF, FX, FZ, FY, 3, 8);
    lap('invisibleGhost');
    // ---------- H6 3인칭 카메라 벽 뚫림(main.js step()과 같은 식) — 1.2m 표본 × 8방향 × 피치 3 ----------
    { const AS = 1366 / 610, cam = { poses: 0, behind: 0, nearWall: 0, nearFloor: 0, lowClip: 0 }, byP = {}, bad = [], camCol = new Map();
      const segSolid = (ax, ay, az, bx, by, bz) => { let res = -1; const dx = bx - ax, dy = by - ay, dz = bz - az;
        near((ax + bx) / 2, (az + bz) / 2, 0.9, (b, i) => { if (b.nc) return false; let t0 = 0, t1 = 1; const o = [ax, ay, az], dd = [dx, dy, dz], lo = [b.x0, b.y0, b.z0], hi = [b.x1, b.y1, b.z1];
          for (let a = 0; a < 3; a++) { if (Math.abs(dd[a]) < 1e-8) { if (o[a] < lo[a] || o[a] > hi[a]) return false; } else { let p = (lo[a] - o[a]) / dd[a], q = (hi[a] - o[a]) / dd[a]; if (p > q) { const s = p; p = q; q = s; } if (p > t0) t0 = p; if (q < t1) t1 = q; if (t0 > t1) return false; } }
          res = i; return true; }); return res; };
      for (let i = 0; i < F.count; i++) {
        if ((F.ix[i] & 3) || (F.iz[i] & 3) || cls[i] || !F.inSchool[i]) continue;
        const px = F.X(i), pz = F.Z(i), py = F.y[i], indoor = ceilAt(px, pz, py + 1.6, py + 5.5) !== null;
        for (const pitch of [0.3, -0.2, 0.9]) for (let k = 0; k < 8; k++) {
          const yaw = k * Math.PI / 4, hy = py + 1.3, pch = indoor ? Math.min(pitch, 0.2) : pitch, CD = indoor ? 3.3 : 6.3, fov = indoor ? 60 : 52;
          // 실제 카메라와 같은 식(SD2.camPose — main.js CAM-3): 가운데 거리 + 옆벽 비키기
          const Cp = SD2.camPose(px, hy, pz, yaw, pch, CD, fov, AS), rx0 = Math.cos(yaw), rz0 = -Math.sin(yaw);
          const cx = Cp.x0 + rx0 * Cp.sh, cy = Cp.y, cz = Cp.z0 + rz0 * Cp.sh, lx = px + rx0 * Cp.sh, lz = pz + rz0 * Cp.sh;
          const vx = cx - lx, vy = cy - hy, vz = cz - lz, vl = Math.hypot(vx, vy, vz) || 1;
          let why = null, wb = -1;
          if (camHit(lx, hy, lz, vx / vl, vy / vl, vz / vl, vl) < vl - 0.01) { why = 'behind'; wb = segSolid(lx, hy, lz, cx, cy, cz); }   // 시선(머리)과 카메라 사이에 벽 = 벽 뒤에 선 카메라
          else { const fx = -vx / vl, fy = -vy / vl, fz = -vz / vl, hh = 0.3 * Math.tan(fov * Math.PI / 360), hw = hh * AS; let rx = fz, rz = -fx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
            const upx = rz * fy, upy = fz * rx - fx * rz, upz = -fy * rx;
            for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]]) { const bi = segSolid(cx, cy, cz, cx + fx * 0.3 + rx * hw * sa + upx * hh * sb, cy + fy * 0.3 + upy * hh * sb, cz + fz * 0.3 + rz * hw * sa + upz * hh * sb);
              if (bi >= 0) { const b = C[bi]; wb = bi; why = b.y1 <= py + 0.12 ? 'nearFloor' : !(b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4) ? 'nearWall' : 'lowClip'; break; } } }
          cam.poses++; const bp = byP[pitch] || (byP[pitch] = { poses: 0, behind: 0, nearWall: 0, nearFloor: 0, lowClip: 0 }); bp.poses++;
          if (why) { cam[why]++; bp[why]++; if (pitch === 0.3 && (why === 'behind' || why === 'nearWall')) { if (bad.length < 3000) bad.push(i); if (wb >= 0) camCol.set(wb, (camCol.get(wb) || 0) + 1); } }
        }
      }
      K.camPoses0 = byP[0.3] ? byP[0.3].poses : 0; K.camBehind0 = byP[0.3] ? byP[0.3].behind : 0; K.camWall0 = byP[0.3] ? byP[0.3].nearWall : 0;
      K.camBadPct0 = +(100 * (K.camBehind0 + K.camWall0) / Math.max(1, K.camPoses0)).toFixed(2); R.camera = { all: cam, byPitch: byP }; Lst.camTop = clusters(bad, FX, FZ, FY, 2, 15);
      Lst.camColliders = [...camCol.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([i, n]) => { const b = C[i]; return { n, i, box: [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1].map(v => +v.toFixed(2)) }; }); }   // 기본 피치에서 카메라를 벽 뒤로 보내거나 근평면에 걸린 콜라이더(integ 09-25)
    lap('camera');
    // ---------- 문 직진(진짜 SD2.step) — 플레이어를 옮겼다 되돌린다 ----------
    { const P0 = SD2.pos().map(Number), fail = [];
      for (const d of W.doors) { const nX = d.ax === 'x' ? 0 : 1, nZ = d.ax === 'x' ? 1 : 0;
        for (const sg of [1, -1]) { const ax = d.cx - nX * 1.1 * sg, az = d.cz - nZ * 1.1 * sg, ay = groundAt(ax, az, d.y0 + 0.3); if (blockedAt(ax, az, ay) || Math.abs(ay - d.y0) > 0.6) continue;
          SD2.tp(ax, az, ay + 0.01); SD2.yaw(Math.atan2(-nX * sg, -nZ * sg)); SD2.step(Math.ceil(2.2 / 4.2 * 60) + 25, ['KeyW']);   // W = (-sin yaw, -cos yaw) 쪽
          const p = SD2.pos().map(Number), prog = (p[0] - d.cx) * nX * sg + (p[2] - d.cz) * nZ * sg; if (prog < 0.6) fail.push({ at: [+d.cx.toFixed(2), +d.cz.toFixed(2)], dir: sg, stuck: p }); } }
      SD2.tp(P0[0], P0[2], P0[1]); K.doorStraightFail = fail.length; Lst.doorStraight = fail.slice(0, 12); }
    lap('doorWalk');
    // ---------- H11 구역별 성능(구역 닻에서 3인칭 4방향 · 1366×610) ----------
    if (opt.perf !== false) {
      const { renderer, scene, camera } = SD2, gl = renderer.getContext(), px1 = new Uint8Array(4), pr0 = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(1366, 610); camera.aspect = 1366 / 610;
      const zp = [];
      for (const p of MAP.pois({ src: 'zone' })) { if (!p.stand) continue; const [px, py, pz] = p.stand, indoor = ceilAt(px, pz, py + 1.6, py + 5.5) !== null; let tri = 0, calls = 0, ms = 0;
        for (let k = 0; k < 4; k++) { const yaw = k * Math.PI / 2, pch = indoor ? 0.2 : 0.3, CD = indoor ? 3.3 : 6.3, hy = py + 1.3, dx = Math.sin(yaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(yaw) * Math.cos(pch);
          const want = Math.max(0.5, Math.min(CD, camHit(px, hy, pz, dx, dy, dz, CD) - 0.3)); camera.fov = indoor ? 60 : 52; camera.updateProjectionMatrix();
          camera.position.set(px + dx * want, hy + dy * want, pz + dz * want); camera.lookAt(px, hy, pz); camera.updateMatrixWorld(); SD2.detailTick(1);
          const t0 = performance.now(); renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); ms = Math.max(ms, performance.now() - t0);
          tri = Math.max(tri, renderer.info.render.triangles); calls = Math.max(calls, renderer.info.render.calls); }
        zp.push({ zone: p.label, tri, calls, ms: +ms.toFixed(2) }); }
      renderer.setPixelRatio(pr0); renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      zp.sort((a, b) => b.tri - a.tri); R.perf = { worst: zp.slice(0, 8), maxTri: zp.length ? zp[0].tri : 0, maxCalls: Math.max(0, ...zp.map(z => z.calls)) };
      K.perfMaxTri = R.perf.maxTri; K.perfMaxCalls = R.perf.maxCalls;
      R.perf.bigColliders = C.map((b, i) => [i, b.x1 - b.x0, b.z1 - b.z0, b]).filter(a => (a[1] > 20 || a[2] > 20) && a[3].y1 > -1e5).map(([i, w, d, b]) => ({ i, w: +w.toFixed(1), d: +d.toFixed(1), x: [+b.x0.toFixed(1), +b.x1.toFixed(1)], z: [+b.z0.toFixed(1), +b.z1.toFixed(1)], nc: !!b.nc }));
      lap('perf');
    }
    // ---------- H12 그림(위에서 본 지도 · 0.3m = 2px) ----------
    if (opt.img) {
      const draw = kind => { const Xa = -90, Za = -90, SC = 2, cv = document.createElement('canvas'); cv.width = 514 * SC; cv.height = 520 * SC; const g = cv.getContext('2d');
        g.fillStyle = '#20242a'; g.fillRect(0, 0, cv.width, cv.height);
        const put = (x, z, col, s = SC) => { g.fillStyle = col; g.fillRect(Math.round((x - Xa) / S) * SC - (s - SC) / 2, Math.round((z - Za) / S) * SC - (s - SC) / 2, s, s); };
        const hcol = y => y < -1 ? '#8fb87a' : y < -0.2 ? '#a9c98f' : y < 0.1 ? '#c7d9b0' : y < 0.6 ? '#d9e6c4' : '#eef2d8';
        if (kind === 'walk') { for (const j of jumpOnly) if (FJ.y[j] < 2.5) put(FJ.X(j), FJ.Z(j), '#3a6fe0');
          for (let i = 0; i < F.count; i++) if (F.y[i] < 2.5) put(F.X(i), F.Z(i), cls[i] === 2 ? '#e02424' : cls[i] === 1 ? '#f39a1e' : !F.inSchool[i] ? '#e030e0' : F.zone[i] < 0 ? '#6a6f78' : hcol(F.y[i])); }
        else { for (let i = 0; i < F.count; i++) if (F.y[i] < 2.5) put(F.X(i), F.Z(i), F.zone[i] < 0 ? '#6a6f78' : '#4a5a4a');
          for (const i of floating) put(F.X(i), F.Z(i), '#b04ae0', 4); for (const i of sunk) put(F.X(i), F.Z(i), '#e0c040', 4); for (const i of ghost) put(F.X(i), F.Z(i), '#ff3030', 4); for (const i of invis) put(F.X(i), F.Z(i), '#30e0ff', 4); }
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.font = '11px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.85)';
        for (const q of Z) { if (q.floor === 2) continue; const x0 = (q.x0 - Xa) / S * SC, z0 = (q.z0 - Za) / S * SC; g.strokeRect(x0, z0, (q.x1 - q.x0) / S * SC, (q.z1 - q.z0) / S * SC); g.fillText(q.label, x0 + 2, z0 + 11); }
        g.strokeStyle = 'rgba(255,120,255,0.9)'; g.beginPath(); W.bounds.forEach(([x, z], k) => { const X = (x - Xa) / S * SC, Y = (z - Za) / S * SC; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.stroke();
        return cv.toDataURL('image/png'); };
      R.img = { walk: draw('walk'), issues: draw('issues') };
    }
  }

  // ---------- 게이트(0이어야 통과) · 래칫(기준선보다 늘면 실패) ----------
  const gate = (name, value, limit, pass = value <= limit) => { R.gates[name] = { value, limit, pass }; };
  gate('울타리 밖', K.oobWalk + K.oobJump, 0);
  gate('갇힘(점프로도 못 돌아옴)', K.trapEvenJump, 0);
  gate('옥상(점프 포함)', K.roof, 0);
  gate('문 그래프', K.doorGraphFail, 0);
  gate('상호작용 지점', K.hotspotBad, 0);
  gate('구역 없는 칸 %', K.noZonePct, BASELINE.noZonePct);
  for (const k of ['nsBypass', 'perch', 'multiZone', 'tallStep']) gate('래칫 ' + k, K[k], BASELINE[k]);
  if (!quick) {
    gate('보이지 않는 벽', K.invisibleEdges, 0);
    gate('카메라 벽 뚫림 %(기본 피치)', K.camBadPct0, 0.3);
    for (const k of ['ghost', 'sunk', 'floating']) gate('래칫 ' + k, K[k], BASELINE[k]);
    if (R.perf) { gate('한 화면 삼각형(구역 닻)', K.perfMaxTri, 150000); gate('드로우콜(구역 닻)', K.perfMaxCalls, 200); }
  }
  R.ms = TM; R.ms.total = Math.round(performance.now() - T00);
  const gs = Object.entries(R.gates), fails = gs.filter(([, g]) => !g.pass);
  R.summary = '🩺 맵 건강 검진(' + (quick ? '빠른' : '전체') + '): 게이트 ' + (gs.length - fails.length) + '/' + gs.length + ' · 칸 ' + K.cells + ' · 밖 ' + (K.oobWalk + K.oobJump) + ' · 갇힘 ' + K.trapEvenJump + ' · 문 ' + K.doorGraphFail + ' · 지점 ' + K.hotspotBad
    + ' · 구역 없음 ' + K.noZonePct + '%' + (quick ? '' : ' · 보이지 않는 벽 ' + K.invisibleEdges + ' · 카메라 ' + K.camBadPct0 + '%' + (R.perf ? ' · 최악 ' + (K.perfMaxTri / 1e4).toFixed(1) + '만/' + K.perfMaxCalls + '콜' : '')) + ' · ' + R.ms.total + 'ms';
  if (opt.log !== false) {
    // 실패 게이트는 warn(병행 구간 담당이 고칠 기존 결함이 섞여 있다 — 어느 게 새로 생겼는지는 기준선·목록으로 본다)
    if (fails.length) console.warn(R.summary + ' — 실패: ' + fails.map(([n, g]) => n + ' ' + g.value + '>' + g.limit).join(' · '));
    else console.log(R.summary);
  }
  return R;
}
