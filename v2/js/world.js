// ============================================================
// v2 월드 — 완성판. 헌법:
//  ① 부재 최소 0.15m(가는 봉·틀 금지 — 색면으로) ② 트림 저대비 ③ 동일평면 겹침 금지(빌드 감사)
//  ④ 16m 청크 병합 ⑤ 충돌 AABB 전용 ⑥ 예산 dc≤300·sim≤1ms
// ============================================================
import * as THREE from 'three';
import { SCHOOL } from '../../js/data.js';

export function buildWorld(scene) {
  const B = SCHOOL.building, FR = B.front;
  const FH = B.floorHeight, TERR_Z = -18;
  const colliders = [], zones = [], allBoxes = [];
  const CHUNK = 16, chunks = new Map();
  const box_ = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const bpos = box_.attributes.position, bnrm = box_.attributes.normal;
  const _c = new THREE.Color();
  const tY = z => (z > TERR_Z ? -1 : 0);

  function chunkOf(cx, cz) {
    const key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = chunks.get(key);
    if (!ch) { ch = { pos: [], col: [] }; chunks.set(key, ch); }
    return ch;
  }
  function addBox(w, h, d, hex, cx, baseY, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.15) throw new Error('헌법① 위반 <0.15m: ' + [w, h, d]);
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
    const ch = chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const cy = baseY + h / 2;
    for (let i = 0; i < bpos.count; i++) {
      ch.pos.push(bpos.getX(i)*w+cx, bpos.getY(i)*h+cy, bpos.getZ(i)*d+cz);
      const ny = bnrm.getY(i), nx = bnrm.getX(i);
      const f = ny > .5 ? 1 : ny < -.5 ? .62 : (nx !== 0 ? .88 : .94);
      ch.col.push(_c.r*f, _c.g*f, _c.b*f);
    }
    if (opt.collide !== false) colliders.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
  }
  function addPanel(w, d, hex, cx, y, cz) {
    const ch = chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const x0 = cx-w/2, x1 = cx+w/2, z0 = cz-d/2, z1 = cz+d/2;
    ch.pos.push(x0,y,z0, x0,y,z1, x1,y,z1,  x0,y,z0, x1,y,z1, x1,y,z0);
    for (let i = 0; i < 6; i++) ch.col.push(_c.r, _c.g, _c.b);
  }
  function wallX(x0, x1, z, hex, opt = {}) {
    if (x0 > x1) { console.warn('wallX 인자 역순 자동 정렬', x0, x1, z); const t = x0; x0 = x1; x1 = t; }
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, gaps = (opt.gaps ?? []).slice().sort((a,b)=>(a.c-a.w/2)-(b.c-b.w/2));
    let cur = x0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6;
      if (g0 - cur > 0.05) addBox(g0 - cur, h, 0.3, hex, (cur+g0)/2, y0, z);
      if (h - dh > 0.15) addBox(g1 - g0, h - dh, 0.3, hex, (g0+g1)/2, y0 + dh, z);
      cur = Math.max(cur, g1);
    }
    if (x1 - cur > 0.05) addBox(x1 - cur, h, 0.3, hex, (cur+x1)/2, y0, z);
    if (opt.wins) {
      const n = opt.wins, gap = (x1-x0)/n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5, fc = opt.face ?? 1;
      for (let i = 0; i < n; i++) {
        const wc = x0 + gap*(i+.5), ww = Math.min(2.2, gap-1.6);
        if (ww < 1) continue;
        if (gaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        addBox(ww, wh, 0.2, 0x51606c, wc, y0 + sill, z + fc*0.13, { collide: false });
      }
    }
  }
  function wallZ(z0, z1, x, hex, opt = {}) {
    // ⚠️역순으로 넘기면 벽이 조용히 통째로 사라진다(세로복도 서벽 실종 사고) — 자동 정렬로 봉쇄
    if (z0 > z1) { console.warn('wallZ 인자 역순 자동 정렬', z0, z1, x); const t = z0; z0 = z1; z1 = t; }
    z0 += 0.3; z1 -= 0.3;
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, gaps = (opt.gaps ?? []).slice().sort((a,b)=>(a.c-a.w/2)-(b.c-b.w/2));
    let cur = z0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6;
      if (g0 - cur > 0.05) addBox(0.3, h, g0 - cur, hex, x, y0, (cur+g0)/2);
      if (h - dh > 0.15) addBox(0.3, h - dh, g1 - g0, hex, x, y0 + dh, (g0+g1)/2);
      cur = Math.max(cur, g1);
    }
    if (z1 - cur > 0.05) addBox(0.3, h, z1 - cur, hex, x, y0, (cur+z1)/2);
    if (opt.wins) {
      const n = opt.wins, gap = (z1-z0)/n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5, fc = opt.face ?? 1;
      for (let i = 0; i < n; i++) {
        const wc = z0 + gap*(i+.5), ww = Math.min(2.2, gap-1.6);
        if (ww < 1) continue;
        if (gaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        addBox(0.2, wh, ww, 0x51606c, x + fc*0.13, y0 + sill, wc, { collide: false });
      }
    }
  }
  const signCache = new Map();
  function sign(text, x, y, z, rotY = 0, h = 0.42) {
    let entry = signCache.get(text + h);
    if (!entry) {
      const c = document.createElement('canvas'); const g2 = c.getContext('2d');
      g2.font = '900 84px sans-serif';
      c.width = Math.ceil(g2.measureText(text).width) + 56; c.height = 128;
      const g3 = c.getContext('2d');
      g3.fillStyle = '#2f6fd0'; g3.beginPath(); g3.roundRect(2,2,c.width-4,c.height-4,20); g3.fill();
      g3.font = '900 84px sans-serif'; g3.fillStyle = '#fff'; g3.textAlign='center'; g3.textBaseline='middle';
      g3.fillText(text, c.width/2, c.height/2 + 4);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const w = h * c.width / c.height;
      const f = new THREE.PlaneGeometry(w, h).toNonIndexed(); f.translate(0,0,0.008);
      const bk = new THREE.PlaneGeometry(w, h).toNonIndexed(); bk.rotateY(Math.PI); bk.translate(0,0,-0.008);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...f.attributes.position.array, ...bk.attributes.position.array]),3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([...f.attributes.uv.array, ...bk.attributes.uv.array]),2));
      entry = { geo, mat: new THREE.MeshBasicMaterial({ map: tex }) };
      signCache.set(text + h, entry);
    }
    const m = new THREE.Mesh(entry.geo, entry.mat);
    m.position.set(x, y, z); m.rotation.y = rotY; m.matrixAutoUpdate = false; m.updateMatrix();
    scene.add(m);
  }
  function tree(x, z, s = 1) {
    addBox(0.5*s, 1.6*s, 0.5*s, 0x6d4e32, x, tY(z), z);
    addBox(2.4*s, 1.5*s, 2.4*s, 0x3f7a3f, x, tY(z)+1.6*s, z, { collide: false });
    addBox(1.5*s, 1.1*s, 1.5*s, 0x4d8b4d, x, tY(z)+3.1*s, z, { collide: false });
  }

  const WALL = 0xd8c39a, PAVE = 0xcfc8ba, INNER = 0xefe9dc, FLOOR = 0xe7e2d6, WOOD = 0xc9a063;
  const doorC = r => r.span[0] + 1.9;

  // ================= 지형 =================
  addPanel(320, 240, 0x7cb85c, 0, -1.001, -10);
  addBox(164, 1, 52, PAVE, 0, -1, TERR_Z - 26);
  addPanel(96, 64, 0xd8c79e, SCHOOL.field.center[0], -0.995, SCHOOL.field.center[1]);

  // ================= 본관 =================
  const [fx0, fx1] = FR.x, [fz0, fz1] = FR.z, zCor = fz0 + FR.corridorDepth;
  const hall = FR.rooms.find(r => r.type === 'hall');
  wallX(fx0, fx1, fz1, WALL, { gaps: [{ c: (hall.span[0]+hall.span[1])/2, w: 3.0 }], wins: 15, sill: 1.0, wh: 1.6, face: 1 });
  const wg = B.wings[0];
  // 서측(v1 v0.49 실사): 주복도 서측이 서관 홀로 통째로 트임 — 방 문은 홀벽 z-39.9에.
  // + 주차장 틈새길(서관·급식동 사이 x-11.3) + 당직실 문
  const nGaps = [
    { c: -28.2, w: 22.9, dh: FH },
    { c: -14.3, w: 2.6 },
    { c: -11.3, w: 1.2 },
    { c: B.kitchen.dutyRoom.doorC, w: 1.2 },
    { c: B.kitchen.doorC, w: 1.8 },
    { c: 6.9, w: 3.0, dh: FH },
    { c: 20, w: 1.8 },
  ];
  wallX(fx0, fx1, fz0, WALL, { gaps: nGaps, wins: 10, face: -1 });
  wallZ(fz0, fz1, fx0, WALL, { gaps: [{ c: FR.corridorExitZ, w: 1.8 }], wins: 1, face: -1 });
  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: FR.corridorExitZ, w: 1.8 }], wins: 1, face: 1 });
  const cGaps = FR.rooms.map(r => r.type === 'hall' ? { c: (r.span[0]+r.span[1])/2, w: 3.4, dh: FH } : { c: doorC(r), w: 1.2 });
  wallX(fx0 + 0.3, fx1 - 0.3, zCor, INNER, { gaps: cGaps });   // 내부벽은 외벽에서 0.3 인셋(코너 관통 금지)
  addPanel(fx1-fx0-0.6, zCor-fz0-0.3, FLOOR, 0, 0.012, (fz0+zCor)/2);
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    if (i > 0) addBox(0.3, FH, fz1-zCor-0.6, INNER, s0, 0, (zCor+fz1)/2);
    addPanel(cw-0.5, fz1-zCor-0.5, r.type==='hall'?FLOOR:0xead9c0, cx, 0.014, (zCor+fz1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare') {
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, 0.9, zCor + 0.28, { collide: false });
      addBox(1.2, 0.85, 0.6, 0x8a5a3b, cx - 2, 0, zCor + 1.4);
      for (let dx = -1; dx <= 1; dx++) for (let dz = 0; dz < 2; dz++)
        addBox(1.1, 0.72, 0.5, 0xb0a18e, cx + dx*1.7, 0, zCor + 3.4 + dz*1.7);
    } else if (r.type !== 'hall' && r.type !== 'toilet') {
      addBox(1.3, 0.74, 0.7, 0xb0a18e, cx - 1, 0, zCor + 3.5);
      addBox(1.3, 0.74, 0.7, 0xb0a18e, cx + 1, 0, zCor + 2.2);
      addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6);
    }
    if (r.type === 'toilet') addBox(cw-1.2, 1.2, 0.4, 0xdfe8ee, cx, 0, fz1 - 0.55);
    sign(r.name, doorC(r) + 1.3, 2.35, zCor - 0.22, 0, 0.34);
  });
  addBox(fx1-fx0+0.8, 0.3, fz1-fz0+0.38, 0xd9dce1, 0, FH, (fz0+fz1)/2 + 0.21);   // 북단은 서관 슬래브(z-38)와 접면까지만
  addBox(fx1-fx0+0.8, 0.45, 0.3, 0xe8e6de, 0, FH+0.3, fz1+0.25, { collide: false });
  addBox(4, 1.8, 3, 0xe8e6de, fx1-8, FH+0.3, (fz0+fz1)/2);
  {
    const hx = 6.15;
    addBox(76, 0.6, 0.2, 0x4a6fa5, 0, 2.65, fz1 + 0.14, { collide: false });
    [-4.2,-1.5,1.5,4.2].forEach(ox => addBox(0.4, 3.0, 0.4, 0x3b2d24, hx+ox, 0, fz1+4.2));
    addBox(11, 0.45, 5.6, 0x3b2d24, hx, 3.0, fz1+3.2);
    addBox(11.4, 0.3, 0.6, 0x5b8fc9, hx, 3.45, fz1+5.9, { collide: false });
    for (let i = 0; i < 6; i++) addBox(6.4, 0.18*(6-i), 0.36, PAVE, hx, -1, fz1+6.2+0.36*i);
    sign(SCHOOL.name, hx, 2.6, fz1 + 6.05, 0, 0.5);
  }

  // ================= 서관 =================
  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z, HZ = -39.9;   // HZ=서측홀 벽(방 깊이 10.1 — v1 v0.49)
  wallX(wx0, wx1, wz0, WALL, { h: FH, wins: 6, face: -1 });
  wallX(wx0, wx1, wz0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 6, face: -1, sill: 0.8 });
  wallZ(wz0, wz1, wx0, WALL, { h: FH, wins: 2, face: -1 });
  wallZ(wz0, wz1, wx0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 2, face: -1, sill: 0.8 });
  wallZ(wz0, wz1, wx1, WALL, { h: FH });                                          // 동벽(주차장면) — 미시공이던 구멍
  wallZ(wz0, wz1, wx1, WALL, { y0: FH+0.3, h: FH-0.3 });
  wallX(wx0, wx1, wz1, WALL, { y0: FH+0.3, h: FH-0.3, wins: 6, face: 1, sill: 0.8 });  // 2층 남면(1층 z-38은 본관 북벽)
  addPanel(wx1-wx0-0.6, 11.85, FLOOR, (wx0+wx1)/2, 0.012, -43.775);
  wallX(wx0 + 0.3, -16.75, HZ, INNER,
    { gaps: wg.rooms.filter(r => !r.innerOnly && r.type !== 'stair').map(r => ({ c: doorC(r), w: 1.4 })) });
  wg.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && r.type !== 'stair' && r.name !== '문서고') addBox(0.3, FH, 9.65, INNER, s0, 0, -44.875);
    zones.push({ x0: s0, x1: s1, z0: wz0, z1: HZ, y: 0, label: r.name });
    if (r.type === 'library') for (let k = 0; k < 3; k++) addBox(6, 1.9, 0.5, 0x8a6a45, cx, 0, wz0 + 2.2 + k*2.4);
    if (r.type === 'nurse') { addBox(1.05, 0.5, 2, 0xf2f5f7, cx-1, 0, wz0+2.5); addBox(1.05, 0.5, 2, 0xf2f5f7, cx+1, 0, wz0+2.5); }
    if (r.type !== 'stair' && !r.innerOnly) sign(r.name, doorC(r) + 1.2, 2.35, HZ + 0.22, 0, 0.34);
  });
  addBox(0.3, FH, 4.7, INNER, -28.6, 0, -47.35);    // 문서고 칸막이(나래반에서 진입 — innerOnly)
  addBox(0.3, FH, 3.75, INNER, -28.6, 0, -41.925);
  addBox(0.3, 1.0, 1.2, INNER, -28.6, 2.4, -44.4);
  {
    const sx = -14.3, w9 = 3.2;
    addBox(0.3, FH, wz1-wz0-0.6, INNER, -16.6, 0, (wz0+wz1)/2);
    for (let i = 0; i < 13; i++)
      addBox(w9, 0.285*(i+1), 0.72, 0xc9b8a0, sx, 0, fz0 - 0.95 - 0.72*i);
    addBox(3.9, 0.3, 1.6, 0xc9b8a0, -14.65, FH, fz0 - 0.95 - 0.72*12 - 1.15);   // 착지참 — 서쪽 슬래브(x-16.6)까지 닿게
    sign('2층', sx + 1.7, 2.5, fz0 - 0.5, 0, 0.34);
  }
  addBox(wx1-wx0-4.6, 0.3, wz1-wz0+0.02, 0xd9dce1, wx0 + (wx1-wx0-4.6)/2, FH, (wz0+wz1)/2+0.01);   // 남단 z-37.98 = 본관 지붕과 정확히 맞댐(하늘 틈 봉합)
  {
    const zc2 = wz1 - 2.7;
    B.upper.rooms.forEach((r, i) => {
      const [s0, s1] = r.span, cx = (s0+s1)/2;
      if (i > 0) addBox(0.3, FH-0.3, zc2-wz0-0.6, INNER, s0, FH+0.3, (wz0+zc2)/2);
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, FH+1.2, wz0+0.53, { collide: false });
      // 가구 간격 규칙: 책상 폭 1.1 + 틈 1.1(사람 폭 0.52의 2배) — 좁은 실은 개수를 줄인다.
      // ⚠️1.45 간격은 틈이 0.35라 사람이 못 지나가 방이 통째로 봉쇄됐었다(SD2.reach가 적발).
      const nD = (s1 - s0) > 7 ? 3 : 1;
      for (let d = 0; d < nD; d++) addBox(1.1, 0.72, 0.5, 0xb0a18e, cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3);
      sign(r.name, doorC(r)+1.2, FH+2.55, zc2-0.22, 0, 0.34);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: zc2, y: FH+0.3, label: r.name });
    });
    zones.push({ x0: wx0, x1: -17.2, z0: zc2, z1: wz1, y: FH+0.3, label: '2층 복도' });
    wallX(wx0 + 0.3, -17.2, zc2, INNER, { y0: FH+0.3, h: FH-0.3, gaps: B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })) });   // 동단은 개구 가드 앞에서
    addBox(0.45, 1.2, 9.64, 0xc8cdd2, wx1-4.6-0.25, FH+0.3, -43.12);   // 개구 가드 — 착지참(z-49.5) 구간은 열어 2층 진입로 확보
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xe8e6de, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });

  // ================= 급식동 =================
  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  wallX(kx0, kx1 - 0.3, kz0, WALL, { h: K.wallHeight, wins: 4, face: -1, sill: 2.4, wh: 1.2 });
  wallZ(kz0, kz1, kx0, WALL, { h: K.wallHeight, wins: 4, face: -1 });
  // 이 벽 = 세로복도 동벽 = 동관 서벽(x8.4 3중 공유). 개구: 동관 복도 연결(-56.5)·마당 문(-41).
  // ⚠️hallEastDoorZ(-44)는 서벽(x5.4) 문 — 여기 두면 2학년 교실 벽에 반쯤 걸린 구멍이 된다(실수했던 지점)
  wallZ(kz0, kz1, kx1, WALL, { h: K.wallHeight, gaps: [{ c: -56.5, w: 2.4 }, { c: B.linkCorridor.yardDoorZ, w: 1.6 }], face: 1 });
  addPanel(kx1-kx0-0.6, kz1-kz0-0.6, FLOOR, (kx0+kx1)/2, 0.012, (kz0+kz1)/2);
  wallX(kx0 + 0.3, 5.25, K.cookWallZ, INNER, { h: K.wallHeight, gaps: [{ c: K.cookDoorC, w: 1.4 }] });   // 동단은 세로복도 서벽(x5.4) 앞까지
  addBox(5.5, 0.95, 1, 0xc4c9cd, -1, 0, K.cookWallZ + 1.3);
  [[-5.2,-44],[-2.5,-46.5],[1,-43],[3.4,-46]].forEach(([tx,tz]) => {   // 양끝 식탁은 당직실 벽·세로복도 서벽과 이격
    addBox(0.8, 0.72, 3.2, 0xb5713d, tx, 0, tz);
    addBox(0.36, 0.42, 3.2, 0xd94848, tx-0.75, 0, tz); addBox(0.36, 0.42, 3.2, 0xd94848, tx+0.75, 0, tz);
  });
  addBox(kx1-kx0+0.8, 0.3, kz1-kz0+0.8, 0x46352b, (kx0+kx1)/2, K.wallHeight, (kz0+kz1)/2);
  sign('급식실', K.doorC + 1.5, 2.35, fz0 + 0.22, 0, 0.36);
  {                                                        // 당직실(급식동 남서 모서리 — data.js dutyRoom)
    const D = K.dutyRoom;
    addBox(0.3, FH, 3.7, INNER, D.x[1], 0, -40.0);         // 동측 칸막이 z-41.85~-38.15
    addBox(3.7, FH, 0.3, INNER, (D.x[0]+D.x[1])/2, 0, D.z[0]);   // 북측 칸막이
    addBox(1.3, 0.74, 0.7, 0xb0a18e, D.doorC - 0.6, 0, -40.5);
    sign('당직실', D.doorC + 1.2, 2.35, fz0 + 0.22, 0, 0.32);
    zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], y: 0, label: '당직실' });
  }
  wallZ(kz0, K.cookWallZ, 0, INNER, { h: K.wallHeight, gaps: [{ c: K.storeDoorZ, w: 1.2 }] });   // 조리실→식품창고(v1 실측 x0~5.4)
  zones.push({ x0: -6.4, x1: 5.25, z0: K.cookWallZ, z1: kz1, y: 0, label: '급식실' });
  zones.push({ x0: kx0, x1: -0.3, z0: kz0, z1: K.cookWallZ, y: 0, label: '조리실' });
  zones.push({ x0: 0.3, x1: 5.25, z0: kz0, z1: K.cookWallZ, y: 0, label: '식품창고' });

  // ================= 세로복도 =================
  const LC = B.linkCorridor;
  wallZ(fz0, -58, LC.x[0], WALL, { gaps: [{ c: K.hallEastDoorZ, w: 1.8 }], face: 1 });   // z-58까지 — 동관 복도 연결부까지 내려간다
  // (세로복도 동벽 = 급식동 동벽 x8.4 공유 — 위에서 통합 시공. 동관 복도 개구 -56.5)
  addPanel(LC.x[1]-LC.x[0]-0.6, 19.1, FLOOR, 6.9, 0.012, -47.85);
  addBox(3.0, 0.3, 20, 0xd9dce1, 6.45, FH, -48);   // 동관 지붕(x8~)과 슬래브 겹침 금지

  // ================= 동관 =================
  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  wallX(ex0 + 0.3, ex1, ez1, WALL, { wins: 8, face: 1 });   // 서단 0.3 인셋(공유벽 x8.4 관통 금지)
  wallX(ex0, ex1, ez0, WALL, { wins: 8, face: -1 });
  // 동벽: 복도 동쪽끝 바깥문(-56.65) + 창고 외부문(-50).
  // ⚠️창고는 external — 복도 문이 없다. 북벽에 뚫으면 복도로 들어갈 뿐 창고엔 못 들어간다(실제로 그랬음).
  wallZ(ez0, ez1, ex1, WALL, { wins: 2, face: 1, gaps: [{ c: -56.65, w: 1.8 }, { c: -50, w: 1.2 }] });
  // (동관 서벽 = 급식동 동벽 x8.4 공유 — 이중 시공 금지)
  const eGaps = E.rooms.filter(r => !r.innerOnly && !r.external).map(r => ({ c: doorC(r), w: 1.2 }));
  wallX(ex0 + 0.3, ex1 - 0.3, zCE, INNER, { gaps: eGaps });
  addPanel(ex1-ex0-0.6, zCE-ez0-0.3, FLOOR, (ex0+ex1)/2, 0.012, (ez0+zCE)/2);
  E.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && r.name !== '과학준비실') addBox(0.3, FH, ez1-zCE-0.6, INNER, s0, 0, (zCE+ez1)/2);
    addPanel(s1-s0-0.5, ez1-zCE-0.5, 0xead9c0, cx, 0.014, (zCE+ez1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCE, z1: ez1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, 0.9, zCE + 0.28, { collide: false });
      for (let dx = -1; dx <= 1; dx++) for (let dz = 0; dz < 2; dz++)
        addBox(1.1, 0.72, 0.5, r.type==='science'?0x8fc46a:0xb0a18e, cx + dx*1.7, 0, zCE + 3.2 + dz*1.7);
    }
    if (!r.innerOnly && !r.external) sign(r.name, doorC(r)+1.2, 2.35, zCE - 0.22, 0, 0.34);
  });
  addBox(0.3, FH, 4.3, INNER, 32.8, 0, -52.85);     // 과학준비실 칸막이(과학실에서 진입 — innerOnly)
  addBox(0.3, FH, 4.7, INNER, 32.8, 0, -47.05);
  addBox(0.3, 1.0, 1.3, INNER, 32.8, 2.4, -50.05);
  addBox(ex1-ex0+0.8, 0.3, ez1-ez0+0.8, 0xd9dce1, (ex0+ex1)/2, FH, (ez0+ez1)/2);
  zones.push({ x0: LC.x[0], x1: LC.x[1], z0: -58, z1: fz0, y: 0, label: '세로복도' });
  zones.push({ x0: ex0, x1: ex1, z0: ez0, z1: zCE, y: 0, label: '동관 복도' });

  // ================= 체육관 =================
  const G = SCHOOL.gym, gx = G.center[0], gz = G.center[1];
  const gx0 = gx-G.width/2, gx1 = gx+G.width/2, gz0 = gz-G.depth/2, gz1 = gz+G.depth/2;
  wallX(gx0, gx1, gz0, 0xa8503a, { h: 3.2 });
  wallX(gx0, gx1, gz1, 0xa8503a, { h: 3.2 });
  wallZ(gz0, gz1, gx0, 0xa8503a, { h: 3.2 });
  wallZ(gz0, gz1, gx1, 0xa8503a, { h: 3.2, gaps: [{ c: gz, w: 3 }] });
  wallX(gx0, gx1, gz0, 0xa8a096, { y0: 3.2, h: G.wallHeight-3.2 });
  wallX(gx0, gx1, gz1, 0xa8a096, { y0: 3.2, h: G.wallHeight-3.2 });
  wallZ(gz0, gz1, gx0, 0xa8a096, { y0: 3.2, h: G.wallHeight-3.2 });
  wallZ(gz0, gz1, gx1, 0xa8a096, { y0: 3.2, h: G.wallHeight-3.2 });
  addPanel(G.width-0.8, G.depth-0.8, WOOD, gx, 0.012, gz);
  addBox(14, 0.9, 3.6, 0xb5793f, gx - 1, 0, gz0 + 2.2);
  addBox(2.4, 0.45, 1.2, 0xa96f3b, gx - 1, 0, gz0 + 4.6);
  {                                                        // 전실(v1 S6 실구조): 동문→복도→양쪽 화장실→안쪽문→본실
    const vx = gx1 - 3.2, vcx = (vx+gx1)/2 - 0.15;
    addBox(0.3, 3.2, 4.15, 0xcfc8bd, vx, 0, gz - 3.175);   // 전실 서벽(전실 폭만) + 내실문
    addBox(0.3, 3.2, 4.15, 0xcfc8bd, vx, 0, gz + 3.175);
    addBox(0.3, 0.6, 2.2, 0xcfc8bd, vx, 2.6, gz);
    [ -1, 1 ].forEach(s9 => {
      const pz9 = gz + s9*2.2;
      addBox(1.05, 3.2, 0.3, 0xcfc8bd, (vx+0.15+gx1-2)/2, 0, pz9);   // 화장실 칸막이(문 폭 1.0·전실 서벽 동면에서 시작)
      addBox(0.85, 3.2, 0.3, 0xcfc8bd, gx1-0.575, 0, pz9);
      addBox(1.0, 1.0, 0.3, 0xcfc8bd, gx1-1.5, 2.2, pz9);
      addBox(3.2, 3.2, 0.3, 0xcfc8bd, vcx, 0, gz + s9*5.4);          // 화장실 안쪽벽
      addBox(2.4, 1.1, 0.4, 0xdfe8ee, vcx, 0, gz + s9*4.9);
      sign('화장실', gx1-1.5, 2.0, pz9 - s9*0.24, 0, 0.28);
    });
  }
  addBox(0.3, 1.1, 1.9, 0xffffff, gx0 + 1.2, 2.4, gz, { collide: false });
  addBox(0.3, 1.1, 1.9, 0xffffff, gx1 - 4.4, 2.4, gz, { collide: false });   // 동측 백보드는 본실 안(전실 서벽 앞)
  addBox(G.width+1, 0.4, G.depth+1, 0xc35233, gx, G.wallHeight, gz);
  addBox(G.width+0.4, 0.5, G.depth*0.62, 0xc35233, gx, G.wallHeight+0.4, gz);
  addBox(G.width-0.2, 0.5, G.depth*0.3, 0xb04a2e, gx, G.wallHeight+0.9, gz);
  sign('체육관', gx1 + 0.35, 2.7, gz, Math.PI/2, 0.5);
  {                                                        // 방송실(서북)·준비실(동북) — v1 실측 z-52~-48.4
    wallZ(gz0, -48.4, -73, INNER, { h: 3.2 });
    wallX(gx0 + 0.3, -72.85, -48.4, INNER, { h: 3.2, gaps: [{ c: -75.3, w: 1.2 }] });
    wallZ(gz0, -48.4, -55, INNER, { h: 3.2 });
    wallX(-54.85, -51.2, -48.4, INNER, { h: 3.2, gaps: [{ c: -53, w: 1.2 }] });
    addBox(0.3, 3.2, 3.0, INNER, -51.2, 0, -50.2);
    addBox(2.4, 0.75, 0.6, 0x8a5a3b, -75.3, 0, -50.6);     // 방송 콘솔
    addBox(1.6, 1.9, 0.5, 0x9aa0a6, -53, 0, -50.6);        // 준비실 선반
    sign('방송실', -75.3, 2.4, -48.15, 0, 0.3);
    sign('준비실', -53, 2.4, -48.15, 0, 0.3);
    zones.push({ x0: -77.5, x1: -73.3, z0: -51.5, z1: -48.7, y: tY(gz), label: '체육관 방송실' });
    zones.push({ x0: -54.7, x1: -51.5, z0: -51.5, z1: -48.7, y: tY(gz), label: '체육관 준비실' });
  }
  zones.push({ x0: gx0, x1: gx1-3.5, z0: -47.5, z1: gz1, y: tY(gz), label: '체육관' });
  zones.push({ x0: gx1-3.2, x1: gx1, z0: gz-2, z1: gz+2, y: tY(gz), label: '체육관 전실' });
  zones.push({ x0: gx1-3.0, x1: gx1, z0: gz+2.4, z1: gz+5.2, y: tY(gz), label: '체육관 화장실(남)' });
  zones.push({ x0: gx1-3.0, x1: gx1, z0: gz-5.2, z1: gz-2.4, y: tY(gz), label: '체육관 화장실(북)' });

  // ================= 시설·조경 =================
  addPanel(0.35, 64, 0xf0ede4, SCHOOL.field.center[0], -0.99, SCHOOL.field.center[1]);
  function goal(x, hex, s) {
    [-2.6*s, 2.6*s].forEach(oz => addBox(0.16, 2*s, 0.16, hex, x, -1, SCHOOL.field.center[1]+oz));
    addBox(0.16, 0.16, 5.2*s+0.16, hex, x, -1+2*s, SCHOOL.field.center[1], { collide: false });
  }
  goal(SCHOOL.field.center[0]-24.4, 0xf0f2f4, 1);
  goal(SCHOOL.field.center[0]+24.4, 0xc99a4e, 1.4);
  {
    const [px, pz] = SCHOOL.playground.center;
    addPanel(16, 13, 0xdcc9a0, px, -0.99, pz);
    for (let i = 0; i < 4; i++) addBox(1.2, 0.3*(4-i), 0.4, 0xa9805a, px-4, -1, pz-1.2+0.4*i);
    addBox(1.6, 1.2, 1.6, 0x9c7a53, px-4, -1, pz-2.6);
    for (let i = 0; i < 3; i++) addBox(1.1, 0.3, 1.0, 0xd6dbe0, px-4, -1+0.88-0.3*i, pz-3.6-0.95*i, { collide: false });
    addBox(0.3, 0.5, 1.0, 0x9aa5ad, px-1, -0.5-0.5+0.5, pz+2);
    addBox(3.2, 0.16, 0.56, 0xc8cdd2, px-1, -0.34, pz+2, { collide: false });
    [[-1.5],[1.5]].forEach(([ox]) => addBox(0.62, 0.2, 0.62, 0x26282c, px-1+ox, -1, pz+2));
    [[0],[2.2]].forEach(([oz]) => {
      addBox(0.16, 2.2, 0.16, 0x3a6ea5, px+3, -1, pz-1+oz); addBox(0.16, 2.2, 0.16, 0x3a6ea5, px+5, -1, pz-1+oz);
    });
    addBox(2.16, 0.16, 0.16, 0x3a6ea5, px+4, 1.2, pz-1, { collide: false });
    addBox(2.16, 0.16, 0.16, 0x3a6ea5, px+4, 1.2, pz+1.2, { collide: false });
    // 정글짐: x봉과 z봉은 y를 0.09 어긋나게(교차부 동일평면 금지)·봉 끝은 기둥 중심(끝면이 기둥 안)
    for (let gy9 = 0; gy9 < 3; gy9++) for (let gx9 = 0; gx9 < 3; gx9++) {
      addBox(2.4, 0.16, 0.16, 0x9c7a53, px+0.5, -1+0.7*(gy9+1), pz-4.5+gx9*1.2, { collide: false });
      addBox(0.16, 0.16, 2.4, 0x9c7a53, px-0.7+gx9*1.2, -1+0.7*(gy9+1)+0.09, pz-3.3, { collide: false });
    }
    [px-0.7, px+0.5, px+1.7].forEach(jx => { addBox(0.16, 2.2, 0.16, 0x8a6a45, jx, -1, pz-4.62); addBox(0.16, 2.2, 0.16, 0x8a6a45, jx, -1, pz-1.98); });
    sign('놀이터', px, 1.6, pz+5.8, 0, 0.4);
  }
  {
    const [tx, tz] = SCHOOL.garden.center;
    for (let i = 0; i < 3; i++) addBox(9, 0.35, 1.6, 0x4a3628, tx, 0, tz - 2.6 + i*2.6);
    [-5.2, 5.2].forEach(ox => addBox(0.16, 1.0, 9.6, 0xf2f4f6, tx+ox, 0, tz));
    addBox(3.6, 1.0, 0.16, 0xf2f4f6, tx-3.3, 0, tz+4.9);   // 남측 울타리 — 가운데 1.8m 출입구
    addBox(3.6, 1.0, 0.16, 0xf2f4f6, tx+3.3, 0, tz+4.9);
    addBox(10.24, 1.0, 0.16, 0xf2f4f6, tx, 0, tz-4.9);
    sign('우리 텃밭', tx, 1.7, tz + 5.6, 0, 0.4);
  }
  {                                                        // 유치원놀이터 — 운동장 서변 y-1 (v1 v0.50)
    const kpx = -48, kpz = -10;
    addPanel(9, 7, 0xe2cf9f, kpx, -0.992, kpz);
    addBox(1.4, 1.0, 1.4, 0x9c7a53, kpx-0.5, -1, kpz-1.5);
    addBox(1.0, 0.5, 0.4, 0xa9805a, kpx-0.5, -1, kpz-2.5);
    addBox(0.9, 0.3, 0.8, 0xd6dbe0, kpx-0.5, -0.38, kpz-0.6, { collide: false });
    addBox(0.9, 0.3, 0.8, 0xd6dbe0, kpx-0.5, -0.69, kpz+0.2, { collide: false });
    addBox(0.6, 0.5, 0.6, 0xd97a5a, kpx+1.6, -1, kpz+1.2);
    addBox(0.6, 0.5, 0.6, 0x5a8fd9, kpx+2.6, -1, kpz-0.4);
    addBox(0.16, 0.8, 7, 0xeef0e9, kpx-4.5, -1, kpz);
    addBox(8.8, 0.8, 0.16, 0xeef0e9, kpx+0.1, -1, kpz-3.5);   // 서측 울타리와 모서리 이격
    addBox(8.8, 0.8, 0.16, 0xeef0e9, kpx+0.1, -1, kpz+3.5);
    sign('유치원 놀이터', kpx, 1.3, kpz+3.3, 0, 0.32);
  }
  {                                                        // 주차장 — 학교 북쪽 바깥(v1 실측 x-20~48, z-69.5~-59.5). 진입=주복도 x-11.3 틈새길
    addPanel(68, 10, 0x8f9095, 14, 0.008, -64.5);
    for (let i = 0; i <= 13; i++) addPanel(0.25, 9, 0xe8eaea, -19 + i*5, 0.011, -64.5);
    [[-14, 0x4d76b3, 0x6f92c4], [1, 0xc4c9cd, 0xd8dde2], [21, 0xcf6b52, 0xe08a72]].forEach(([cx9, b9, t9]) => {
      addBox(1.8, 0.7, 4.0, b9, cx9, 0, -64.5);
      addBox(1.6, 0.55, 2.0, t9, cx9, 0.7, -64.5);
    });
    sign('주차장', 14, 1.6, -59.9, 0, 0.4);
    zones.push({ x0: -18, x1: 46, z0: -67, z1: -61, y: 0, label: '주차장' });
  }
  {                                                        // 숲놀이터(랜드마크·통나무형) — 운동장 서쪽 v1 x-62~-47, z17~20.5
    const fz9 = 18.75;
    addPanel(15, 3.5, 0xc9b291, -54.5, -0.99, fz9);
    [-61, -57.5, -54, -50.5, -47.5].forEach(lx => addBox(0.42, 1.9, 0.42, 0x7a5636, lx, -1, fz9 - 1.2));   // 통나무 기둥 열
    addBox(14, 0.36, 0.36, 0x8a6a45, -54.5, 0.55, fz9 - 1.2, { collide: false });                          // 가로 통나무(매달리기)
    // 밟고 건너는 통나무 — 지면에 앉힌다(공중 부재 금지: 지지 없는 부재는 '따로 노는' 것으로 보인다)
    addBox(3.6, 0.45, 0.5, 0x7a5636, -59.5, -1, fz9 + 0.6);
    addBox(3.6, 0.75, 0.5, 0x7a5636, -55.5, -1, fz9 + 0.6);
    addBox(3.6, 0.45, 0.5, 0x7a5636, -51.5, -1, fz9 + 0.6);
    [-60.5, -58, -49.5].forEach(sx9 => addBox(0.7, 0.45, 0.7, 0x6d4e32, sx9, -1, fz9 + 1.5));              // 그루터기 의자
    sign('숲놀이터', -54.5, 0.9, fz9 + 1.9, 0, 0.4);
    zones.push({ x0: -62, x1: -47, z0: 17, z1: 20.5, y: -1, label: '숲놀이터' });
  }
  {                                                        // 자전거 교통 코스 — v1 x-72~-60, z22~33
    addPanel(12, 11, 0x6f7176, -66, -0.99, 27.5);
    for (let i = 0; i < 5; i++) addPanel(0.22, 1.4, 0xf0ede4, -66, -0.985, 23.2 + i*2.2);                  // 중앙 점선
    [24.4, 30.6].forEach(cz9 => { for (let i = 0; i < 6; i++) addPanel(0.7, 0.22, 0xf0ede4, -70.5 + i*1.8, -0.985, cz9); });  // 횡단보도
    addBox(0.22, 2.4, 0.22, 0x5a5f66, -71.2, -1, 26);                                                      // 신호등
    addBox(0.34, 0.9, 0.3, 0x2f3338, -71.2, 1.4, 26, { collide: false });
    addBox(0.22, 2.0, 0.22, 0x5a5f66, -60.8, -1, 29);                                                      // 표지판
    addBox(0.7, 0.7, 0.16, 0xdfe3e8, -60.8, 1.0, 29, { collide: false });
    sign('자전거 교통 코스', -66, 0.9, 33.4, 0, 0.4);
    zones.push({ x0: -71, x1: -61, z0: 23, z1: 32, y: -1, label: '자전거 교통 코스' });
  }
  {                                                        // 정자 — v1 x-54.6~-49.4, z41.6~46.8
    const px9 = -52, pz9 = 44.2;
    [[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]].forEach(([ox,oz]) => addBox(0.34, 2.6, 0.34, 0x8a5a3b, px9+ox, -1, pz9+oz));
    addPanel(5.2, 5.2, 0xc9a063, px9, -0.55, pz9);
    addBox(5.6, 0.32, 5.6, 0x6f4a30, px9, 1.6, pz9);
    addBox(4.2, 0.4, 4.2, 0x8a5a3b, px9, 1.92, pz9, { collide: false });
    addBox(4.6, 0.3, 0.35, 0x9c6b45, px9, -0.55, pz9 - 2.0, { collide: false });                           // 앉는 난간
    addBox(4.6, 0.3, 0.35, 0x9c6b45, px9, -0.55, pz9 + 2.0, { collide: false });
    sign('정자', px9, 1.2, pz9 + 2.9, 0, 0.38);
    zones.push({ x0: px9-1.8, x1: px9+1.8, z0: pz9-1.8, z1: pz9+1.8, y: -1, label: '정자' });
  }
  {                                                        // 텃밭 쉼터(퍼걸러) — data.js shelter
    const [sx9, sz9] = SCHOOL.shelter.center, sl = SCHOOL.shelter.length;
    [-sl/2+0.5, 0, sl/2-0.5].forEach(ox => { addBox(0.3, 2.6, 0.3, 0x6d4e32, sx9+ox, -1, sz9-1.7); addBox(0.3, 2.6, 0.3, 0x6d4e32, sx9+ox, -1, sz9+1.7); });
    addBox(sl, 0.3, 4.4, 0x8a6a45, sx9, 1.6, sz9);
    addBox(sl-2, 0.45, 0.6, 0xb5793f, sx9, -1, sz9-1.0);
    addBox(sl-2, 0.45, 0.6, 0xb5793f, sx9, -1, sz9+1.0);
    sign('쉼터', sx9, 1.2, sz9+2.1, 0, 0.34);
  }
  {
    const [gtx, gtz] = SCHOOL.gate;
    addBox(1, 3, 1, 0xb9b5aa, gtx-4, -1, gtz); addBox(1, 3, 1, 0xb9b5aa, gtx+4, -1, gtz);
    addBox(7, 0.5, 0.8, 0x8a9096, gtx, 2.1, gtz, { collide: false });
    sign(SCHOOL.name, gtx, 1.5, gtz - 0.65, 0, 0.55);
    addBox(116, 1.1, 0.3, 0xd8d2c6, gtx - 4 - 0.5 - 58, -1, gtz);
    addBox(42, 1.1, 0.3, 0xd8d2c6, gtx + 4 + 0.5 + 21, -1, gtz);
    addBox(0.16, 10, 0.16, 0xc8cdd2, SCHOOL.flagPole[0], 0, SCHOOL.flagPole[1]);
    addBox(1.4, 0.9, 0.16, 0xf5f6f8, SCHOOL.flagPole[0]+0.85, 8.6, SCHOOL.flagPole[1], { collide: false });
    tree(SCHOOL.bigTree[0], SCHOOL.bigTree[1], 2.2);
    [[-30,-21],[-10,-21],[14,-21],[30,-21],[44,20],[20,40],[-30,40],[56,-40]].forEach(([tx9,tz9]) => tree(tx9, tz9, 1));
  }
  {   // 지형 단차 마감 — 옹벽(좌 모자이크·우 마름돌)+동서 오르는 길. 옹벽 상면이 부지 레벨(y0)이라 길만 놓으면 이어진다
    addBox(84.95, 1, 0.4, 0xb9ad97, -39.525, -1, -17.8);   // 서측(테라스 남면에 맞댐 — 파고들면 동일평면)
    addBox(72.65, 1, 0.4, 0xc9c4bb, 45.675, -1, -17.8);    // 동측
    [[-30, 4.4], [40, 4.4]].forEach(([rx, rw]) => {
      for (let i = 0; i < 3; i++) addBox(rw, 1 - i*0.33, 0.5, PAVE, rx, -1, -17.35 + i*0.5);
    });
    // 통학로 — 정문→동측→구령대(노란 점자블록)
    addPanel(1.2, 57, 0xe9c341, 30, -0.985, 16);
    addPanel(24, 1.2, 0xe9c341, 18.15, -0.985, -12.5);
    addPanel(1.2, 5.5, 0xe9c341, 6.15, -0.985, -15.85);
  }
  {   // 랜드마크 소품 — 인식 포인트(v1 v0.22~0.52)
    addBox(2.2, 1.15, 0.8, 0x9aa0a6, -3.2, 0, -20.2);                          // 교훈석
    sign('바르고 크게 자율', -3.2, 1.35, -20.75, 0, 0.3);
    addBox(1.0, 1.7, 0.5, 0xb9b5aa, -8.5, 0, -20.4);                           // 교가비
    sign('교가비', -8.5, 1.95, -20.7, 0, 0.26);
    addBox(0.6, 5, 0.6, 0xdfe3e8, 16, 0, -21);                                 // 탑시계
    addBox(1.5, 1.5, 0.34, 0xf5f6f8, 16, 4.7, -21, { collide: false });
    sign('12', 16, 5.45, -21.2, 0, 0.3);
    [-30, 42].forEach(lx => {                                                  // 조명탑(운동장 북측 동서)
      addBox(0.5, 12, 0.5, 0xbfc4c9, lx, -1, -12);
      addBox(2.6, 0.7, 0.9, 0xdfe3e8, lx, 10.6, -12, { collide: false });
    });
    addBox(0.34, 3.4, 0.34, 0x8a9096, 44, -1, 24);                             // 야외 농구골대
    addBox(0.26, 1.1, 1.8, 0xf5f6f8, 43.72, 2.3, 24, { collide: false });
    [[62, -8], [67, 6]].forEach(([px9, pz9]) => {                              // 거대 침엽수
      addBox(1.1, 3.2, 1.1, 0x6d4e32, px9, tY(pz9), pz9);
      addBox(4.4, 2.6, 4.4, 0x2f6b46, px9, tY(pz9) + 3.2, pz9, { collide: false });
      addBox(3.2, 2.4, 3.2, 0x3a7d52, px9, tY(pz9) + 5.8, pz9, { collide: false });
      addBox(1.8, 2.0, 1.8, 0x468c5c, px9, tY(pz9) + 8.2, pz9, { collide: false });
    });
    addBox(1.8, 0.45, 0.8, 0xc9a063, -31, 0, -38.95);                          // 서측홀 벤치(통로 1.1m 확보)
    // 옥상 흰 난간 — 북측은 서관 2층 남벽과 y0가 같아 겹치므로 서관 없는 구간만
    addBox(52.4, 0.45, 0.3, 0xe8e6de, 14.2, FH+0.3, -37.83, { collide: false });
    // 동서 난간은 북측 난간·남측 파라펫과 '맞대기'(겹치면 코너에서 동일평면)
    [-40.25, 40.25].forEach(rx9 => addBox(0.3, 0.45, 13.78, 0xe8e6de, rx9, FH+0.3, -30.79, { collide: false }));
  }
  {   // 동네 — 정문 밖이 허공이면 학교가 떠 있어 보인다(v1 사이클2와 같은 처리)
    addPanel(180, 7, 0x6f7176, 0, -0.99, 52);                                   // 앞길
    for (let i = 0; i < 22; i++) addPanel(2.2, 0.24, 0xf0ede4, -80 + i*7.6, -0.985, 52);
    for (let i = 0; i < 7; i++) addPanel(0.8, 6.4, 0xf0ede4, 26.2 + i*1.3, -0.985, 52);   // 정문 앞 횡단보도
    const HOUSE = [[-64, 0xd9c9b0, 0xa9503f], [-46, 0xcfd6dc, 0x50606e], [-24, 0xe0d3ba, 0x6f4a30],
                   [4, 0xd2ddd3, 0x466b52], [26, 0xe6d9c6, 0xa9503f], [50, 0xccd4de, 0x50606e], [70, 0xdfd2bd, 0x6f4a30]];
    HOUSE.forEach(([hx9, wc, rc], i) => {
      const d9 = i % 2 ? 7.4 : 6.2, h9 = i % 3 ? 5.2 : 6.6;
      addBox(9, h9, d9, wc, hx9, -1, 62 + (i % 2) * 1.4);
      addBox(9.8, 0.5, d9 + 0.8, rc, hx9, -1 + h9, 62 + (i % 2) * 1.4);
      addBox(1.1, 2.1, 0.2, 0x6d5340, hx9, -1, 62 + (i % 2) * 1.4 - d9/2 - 0.11, { collide: false });
    });
    [-72, -54, -34, -12, 14, 38, 60, 78].forEach(tx9 => tree(tx9, 47.5, 0.9));
    // 먼 능선 — 서로 겹치므로 밑동 높이를 어긋내 동일평면을 피한다(잔디 아래는 어차피 안 보인다)
    [[-58, 96, 26, 13, -1], [6, 104, 34, 16, -3], [62, 92, 24, 11, -2]].forEach(([mx, mz, mw, mh, my]) =>
      addBox(mw * 2.6, mh, mw, 0x6f8f66, mx, my, mz, { collide: false }));
  }
  zones.push({ x0: fx0, x1: fx1, z0: fz0, z1: zCor, y: 0, label: '본관 복도' });
  zones.push({ x0: -39.7, x1: -16.75, z0: HZ, z1: fz0, y: 0, label: '서측홀' });
  zones.push({ x0: ex0 + 0.3, x1: ex1 - 0.3, z0: ez1 + 0.3, z1: fz0 - 0.3, y: 0, label: '가운데 마당' });
  zones.push({ x0: SCHOOL.playground.center[0]-7, x1: SCHOOL.playground.center[0]+7, z0: SCHOOL.playground.center[1]-5, z1: SCHOOL.playground.center[1]+5, y: -1, label: '놀이터' });
  zones.push({ x0: -52, x1: -44, z0: -13, z1: -7, y: -1, label: '유치원 놀이터' });
  zones.push({ x0: SCHOOL.garden.center[0]-4, x1: SCHOOL.garden.center[0]+4, z0: SCHOOL.garden.center[1]+3, z1: SCHOOL.garden.center[1]+4.5, y: 0, label: '텃밭' });
  zones.push({ x0: SCHOOL.field.center[0]-20, x1: SCHOOL.field.center[0]+20, z0: SCHOOL.field.center[1]-20, z1: SCHOOL.field.center[1]+20, y: -1, label: '운동장' });

  // ================= 감사 + 병합 =================
  {
    const EPS = 0.004, faults = [];
    const ov = (a0,a1,b0,b1) => Math.min(a1,b1) - Math.max(a0,b0) > 0.02;
    for (let i = 0; i < allBoxes.length; i++) for (let j = i+1; j < allBoxes.length; j++) {
      const A = allBoxes[i], Bb = allBoxes[j];
      const sm = (p,q) => Math.abs(p-q) < EPS;
      if ((sm(A.z0,Bb.z0)||sm(A.z1,Bb.z1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) faults.push([i,j,'z']);
      else if ((sm(A.x0,Bb.x0)||sm(A.x1,Bb.x1)) && ov(A.z0,A.z1,Bb.z0,Bb.z1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) faults.push([i,j,'x']);
      else if ((sm(A.y0,Bb.y0)||sm(A.y1,Bb.y1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.z0,A.z1,Bb.z0,Bb.z1)) faults.push([i,j,'y']);
    }
    if (faults.length) {
      const fmt = b9 => '[' + [b9.x0,b9.x1,b9.y0,b9.y1,b9.z0,b9.z1].map(v=>+v.toFixed(2)).join(',') + ']';
      faults.slice(0, 30).forEach(([i,j,ax]) => console.error('헌법③ ' + ax + ' A=' + fmt(allBoxes[i]) + ' B=' + fmt(allBoxes[j])));
      console.error('헌법③ 위반 총 ' + faults.length + '쌍 — 수정 전 커밋 금지.');
    } else console.log('헌법③ 감사: 동일평면 겹침 0');
  }
  const grid = new Map();
  colliders.forEach((b, i) => {
    for (let gx2 = Math.floor(b.x0/8); gx2 <= Math.floor(b.x1/8); gx2++)
      for (let gz2 = Math.floor(b.z0/8); gz2 <= Math.floor(b.z1/8); gz2++) {
        const k = gx2 + ':' + gz2;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(i);
      }
  });
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  for (const ch of chunks.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
  }
  return { colliders, grid, zones, TERR_Z };
}
