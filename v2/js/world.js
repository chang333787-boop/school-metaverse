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
  const nGaps = wg.rooms.filter(r => !r.innerOnly && r.type !== 'stair').map(r => ({ c: doorC(r), w: 1.4 }));
  nGaps.push({ c: -14.3, w: 2.6 });
  nGaps.push({ c: B.kitchen.doorC, w: 1.8 });
  nGaps.push({ c: 6.9, w: 3.0, dh: FH });
  nGaps.push({ c: 20, w: 1.8 });
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
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, label: r.name });
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
  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  wallX(wx0, wx1, wz0, WALL, { h: FH, wins: 6, face: -1 });
  wallX(wx0, wx1, wz0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 6, face: -1, sill: 0.8 });
  wallZ(wz0, wz1, wx0, WALL, { h: FH, wins: 2, face: -1 });
  wallZ(wz0, wz1, wx0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 2, face: -1, sill: 0.8 });
  addPanel(wx1-wx0-0.6, wz1-wz0-0.6, FLOOR, (wx0+wx1)/2, 0.012, (wz0+wz1)/2);
  wg.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && r.type !== 'stair') addBox(0.3, FH, wz1-wz0-0.6, INNER, s0, 0, (wz0+wz1)/2);
    zones.push({ x0: s0, x1: s1, z0: wz0, z1: wz1, label: r.name });
    if (r.type === 'library') for (let k = 0; k < 3; k++) addBox(6, 1.9, 0.5, 0x8a6a45, cx, 0, wz0 + 2.2 + k*2.4);
    if (r.type === 'nurse') { addBox(1.05, 0.5, 2, 0xf2f5f7, cx-1, 0, wz0+2.5); addBox(1.05, 0.5, 2, 0xf2f5f7, cx+1, 0, wz0+2.5); }
    if (r.type !== 'stair' && !r.innerOnly) sign(r.name, doorC(r) + 1.2, 2.35, fz0 + 0.55, 0, 0.34);
  });
  {
    const sx = -14.3, w9 = 3.2;
    addBox(0.3, FH, wz1-wz0-0.6, INNER, -16.6, 0, (wz0+wz1)/2);
    for (let i = 0; i < 13; i++)
      addBox(w9, 0.285*(i+1), 0.72, 0xc9b8a0, sx, 0, fz0 - 0.95 - 0.72*i);
    addBox(w9, 0.3, 1.6, 0xc9b8a0, sx, FH, fz0 - 0.95 - 0.72*12 - 1.15);
    sign('2층', sx + 1.7, 2.5, fz0 - 0.5, 0, 0.34);
  }
  addBox(wx1-wx0-4.6, 0.3, wz1-wz0, 0xd9dce1, wx0 + (wx1-wx0-4.6)/2, FH, (wz0+wz1)/2);
  {
    const zc2 = wz1 - 2.7;
    B.upper.rooms.forEach((r, i) => {
      const [s0, s1] = r.span, cx = (s0+s1)/2;
      if (i > 0) addBox(0.3, FH-0.3, zc2-wz0-0.6, INNER, s0, FH+0.3, (wz0+zc2)/2);
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, FH+1.2, wz0+0.53, { collide: false });
      for (let dx = -1; dx <= 1; dx++) addBox(1.1, 0.72, 0.5, 0xb0a18e, cx + dx*1.45, FH+0.3, wz0+3);
      sign(r.name, doorC(r)+1.2, FH+2.55, zc2-0.22, 0, 0.34);
    });
    wallX(wx0 + 0.3, -17.2, zc2, INNER, { y0: FH+0.3, h: FH-0.3, gaps: B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })) });   // 동단은 개구 가드 앞에서
    addBox(0.45, 1.2, wz1-wz0-0.6, 0xc8cdd2, wx1-4.6-0.25, FH+0.3, (wz0+wz1)/2);
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xe8e6de, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });

  // ================= 급식동 =================
  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  wallX(kx0, kx1 - 0.3, kz0, WALL, { h: K.wallHeight, wins: 4, face: -1, sill: 2.4, wh: 1.2 });
  wallZ(kz0, kz1, kx0, WALL, { h: K.wallHeight, wins: 4, face: -1 });
  wallZ(kz0, kz1, kx1, WALL, { h: K.wallHeight, gaps: [{ c: K.hallEastDoorZ, w: 1.8 }, { c: B.linkCorridor.yardDoorZ, w: 1.6 }], face: 1 });   // 이 벽이 곧 세로복도 동벽(x8.4 공유 — 이중 시공 금지)
  addPanel(kx1-kx0-0.6, kz1-kz0-0.6, FLOOR, (kx0+kx1)/2, 0.012, (kz0+kz1)/2);
  wallX(kx0 + 0.3, kx1 - 0.3, K.cookWallZ, INNER, { h: K.wallHeight, gaps: [{ c: K.cookDoorC, w: 1.4 }] });
  addBox(5.5, 0.95, 1, 0xc4c9cd, -1, 0, K.cookWallZ + 1.3);
  [[-6,-43],[-2.5,-46],[1,-43],[4.5,-46]].forEach(([tx,tz]) => {
    addBox(0.8, 0.72, 3.2, 0xb5713d, tx, 0, tz);
    addBox(0.36, 0.42, 3.2, 0xd94848, tx-0.75, 0, tz); addBox(0.36, 0.42, 3.2, 0xd94848, tx+0.75, 0, tz);
  });
  addBox(kx1-kx0+0.8, 0.3, kz1-kz0+0.8, 0x46352b, (kx0+kx1)/2, K.wallHeight, (kz0+kz1)/2);
  sign('급식실', K.doorC + 1.5, 2.35, fz0 - 0.25, 0, 0.36);

  // ================= 세로복도 =================
  const LC = B.linkCorridor;
  wallZ(fz0, -55.3, LC.x[0], WALL, { gaps: [{ c: K.hallEastDoorZ, w: 1.8 }], face: 1 });
  // (세로복도 동벽 = 급식동 동벽 x8.4 공유 — 위에서 통합 시공)
  addPanel(LC.x[1]-LC.x[0]-0.6, fz0 - -55.3 - 0.6, FLOOR, 6.9, 0.012, (fz0 + -55.3)/2);
  addBox(3.0, 0.3, fz0 - -55.3, 0xd9dce1, 6.45, FH, (fz0 + -55.3)/2);   // 동관 지붕(x8~)과 슬래브 겹침 금지

  // ================= 동관 =================
  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  wallX(ex0, ex1, ez1, WALL, { wins: 8, face: 1 });
  wallX(ex0, ex1, ez0, WALL, { wins: 8, face: -1 });
  wallZ(ez0, ez1, ex1, WALL, { wins: 2, face: 1 });
  // (동관 서벽 = 급식동 동벽 x8.4 공유 — 이중 시공 금지)
  const eGaps = E.rooms.filter(r => !r.innerOnly && !r.external).map(r => ({ c: doorC(r), w: 1.2 }));
  wallX(ex0 + 0.3, ex1 - 0.3, zCE, INNER, { gaps: eGaps });
  addPanel(ex1-ex0-0.6, zCE-ez0-0.3, FLOOR, (ex0+ex1)/2, 0.012, (ez0+zCE)/2);
  E.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0) addBox(0.3, FH, ez1-zCE-0.6, INNER, s0, 0, (zCE+ez1)/2);
    addPanel(s1-s0-0.5, ez1-zCE-0.5, 0xead9c0, cx, 0.014, (zCE+ez1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCE, z1: ez1, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, 0.9, zCE + 0.28, { collide: false });
      for (let dx = -1; dx <= 1; dx++) for (let dz = 0; dz < 2; dz++)
        addBox(1.1, 0.72, 0.5, r.type==='science'?0x8fc46a:0xb0a18e, cx + dx*1.7, 0, zCE + 3.2 + dz*1.7);
    }
    if (!r.innerOnly && !r.external) sign(r.name, doorC(r)+1.2, 2.35, zCE - 0.22, 0, 0.34);
  });
  addBox(ex1-ex0+0.8, 0.3, ez1-ez0+0.8, 0xd9dce1, (ex0+ex1)/2, FH, (ez0+ez1)/2);

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
  addBox(0.3, 1.1, 1.9, 0xffffff, gx0 + 1.2, 2.4, gz, { collide: false });
  addBox(0.3, 1.1, 1.9, 0xffffff, gx1 - 1.2, 2.4, gz, { collide: false });
  addBox(G.width+1, 0.4, G.depth+1, 0xc35233, gx, G.wallHeight, gz);
  addBox(G.width+0.4, 0.5, G.depth*0.62, 0xc35233, gx, G.wallHeight+0.4, gz);
  addBox(G.width-0.2, 0.5, G.depth*0.3, 0xb04a2e, gx, G.wallHeight+0.9, gz);
  sign('체육관', gx1 + 0.35, 2.7, gz, Math.PI/2, 0.5);

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
    [-4.9, 4.9].forEach(oz => addBox(10.24, 1.0, 0.16, 0xf2f4f6, tx, 0, tz+oz));
    sign('우리 텃밭', tx, 1.7, tz + 5.6, 0, 0.4);
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
  zones.push({ x0: -82, x1: 82, z0: -70, z1: 46, label: '학교 마당' });

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
