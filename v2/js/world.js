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
  const colliders = [], zones = [], allBoxes = [], doors = [];
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
    if (Math.min(w, h, d) < 0.1499) throw new Error('헌법① 위반 <0.15m: ' + [w, h, d]);   // 0.1499=부동소수 오차 허용(0.15는 합법)
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
    const ch = chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const cy = baseY + h / 2;
    for (let i = 0; i < bpos.count; i++) {
      ch.pos.push(bpos.getX(i)*w+cx, bpos.getY(i)*h+cy, bpos.getZ(i)*d+cz);
      const ny = bnrm.getY(i), nx = bnrm.getX(i);
      // flat: AO 면제 — 천장·조명은 아랫면만 보이는데 아랫면 0.62를 먹으면 칙칙해진다
      const f = opt.flat ? 1 : ny > .5 ? 1 : ny < -.5 ? .62 : (nx !== 0 ? .88 : .94);
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
  // 외벽은 '바깥 절반 0.15 + 안쪽 절반 0.15'로 나눠 쌓는다 → 방 안에서 외벽색이 아니라 실내 도장이 보인다.
  // 두 절반은 맞닿을 뿐 겹치지 않으므로 감사 통과(면이 서로 반대를 향함). 0.15는 헌법① 최소치와 정확히 같다.
  function wallSeg(ax, len, h, cx, y0, z, hex, opt) {
    const box = (th, col, off, yy, hh) => ax === 'x' ? addBox(len, hh, th, col, cx, yy, z + off) : addBox(th, hh, len, col, z + off, yy, cx);
    // opt.dado = { top, lo, hi }: 안쪽 겹을 아래(lo)·위(hi) 두 톤으로(계단실 노랑/연민트 — 문서 v80c). top은 벽 바닥(opt.y0) 기준
    if ((opt.inner ?? (hex === WALL)) || opt.dado) {
      const f = opt.face ?? 1, d = opt.dado;
      box(0.15, hex, f*0.075, y0, h);
      const lo = d ? Math.max(0, Math.min(h, (opt.y0 ?? 0) + d.top - y0)) : 0;
      if (d && lo >= 0.15 && h - lo >= 0.15) { box(0.15, d.lo, -f*0.075, y0, lo); box(0.15, d.hi, -f*0.075, y0 + lo, h - lo); }
      else box(0.15, d ? (lo >= h - 0.15 ? d.lo : d.hi) : INNER, -f*0.075, y0, h);
    } else box(0.3, hex, 0, y0, h);
  }
  function wallX(x0, x1, z, hex, opt = {}) {
    if (x0 > x1) { console.warn('wallX 인자 역순 자동 정렬', x0, x1, z); const t = x0; x0 = x1; x1 = t; }
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, gaps = (opt.gaps ?? []).slice().sort((a,b)=>(a.c-a.w/2)-(b.c-b.w/2));
    let cur = x0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6;
      if (g0 - cur > 0.1499) wallSeg('x', g0 - cur, h, (cur+g0)/2, y0, z, hex, opt);
      if (h - dh > 0.1499) wallSeg('x', g1 - g0, h - dh, (g0+g1)/2, y0 + dh, z, hex, opt);
      if (dh <= 2.8 && (g.w <= 2.2 || g.door)) doors.push({ ax: 'x', cx: g.c, cz: z, w: g.w, y0, glass: !!g.glass });   // 인방 있는 좁은 개구=문
      cur = Math.max(cur, g1);
    }
    if (x1 - cur > 0.1499) wallSeg('x', x1 - cur, h, (cur+x1)/2, y0, z, hex, opt);
    if (opt.wins) {
      const n = opt.wins, gap = (x1-x0)/n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5, fc = opt.face ?? 1;
      for (let i = 0; i < n; i++) {
        const wc = x0 + gap*(i+.5), ww = Math.min(2.2, gap-1.6);
        if (ww < 1) continue;
        if (gaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        if (opt.noWin && opt.noWin.some(([a, b]) => wc + ww/2 > a && wc - ww/2 < b)) continue;   // 실제로는 벽인 구간
        addBox(ww, wh, 0.46, 0x51606c, wc, y0 + sill, z, { collide: false });   // 벽(0.3)보다 두꺼워 안·밖 양쪽에서 보인다
      }
    }
  }
  function wallZ(z0, z1, x, hex, opt = {}) {
    // ⚠️역순으로 넘기면 벽이 조용히 통째로 사라진다(세로복도 서벽 실종 사고) — 자동 정렬로 봉쇄
    if (z0 > z1) { console.warn('wallZ 인자 역순 자동 정렬', z0, z1, x); const t = z0; z0 = z1; z1 = t; }
    z0 += 0.15; z1 -= 0.15;
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, gaps = (opt.gaps ?? []).slice().sort((a,b)=>(a.c-a.w/2)-(b.c-b.w/2));
    let cur = z0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6;
      if (g0 - cur > 0.1499) wallSeg('z', g0 - cur, h, (cur+g0)/2, y0, x, hex, opt);
      if (h - dh > 0.1499) wallSeg('z', g1 - g0, h - dh, (g0+g1)/2, y0 + dh, x, hex, opt);
      if (dh <= 2.8 && (g.w <= 2.2 || g.door)) doors.push({ ax: 'z', cx: x, cz: g.c, w: g.w, y0, glass: !!g.glass });
      cur = Math.max(cur, g1);
    }
    if (z1 - cur > 0.1499) wallSeg('z', z1 - cur, h, (cur+z1)/2, y0, x, hex, opt);
    if (opt.wins) {
      const n = opt.wins, gap = (z1-z0)/n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5, fc = opt.face ?? 1;
      for (let i = 0; i < n; i++) {
        const wc = z0 + gap*(i+.5), ww = Math.min(2.2, gap-1.6);
        if (ww < 1) continue;
        if (gaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        if (opt.noWin && opt.noWin.some(([a, b]) => wc + ww/2 > a && wc - ww/2 < b)) continue;
        addBox(0.46, wh, ww, 0x51606c, x, y0 + sill, wc, { collide: false });
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
    addBox(0.5*s, 1.6*s, 0.5*s, 0x6d4e32, x, tY(z), z, { collide: false });
    // 밑동 충돌은 보이지 않게 12m까지 — 밑동(1.6) 위에 올라서면 점프로 지붕(3.7)에 닿았다(사용자 07-30 "나무 위로 못 올라가게")
    colliders.push({ x0: x-0.25*s, x1: x+0.25*s, y0: tY(z), y1: tY(z)+12, z0: z-0.25*s, z1: z+0.25*s });
    addBox(2.4*s, 1.5*s, 2.4*s, 0x3f7a3f, x, tY(z)+1.6*s, z, { collide: false });
    addBox(1.5*s, 1.1*s, 1.5*s, 0x4d8b4d, x, tY(z)+3.1*s, z, { collide: false });
  }

  const STAIR_DADO = { top: 1.3, lo: 0xf2d27a, hi: 0xd4ece2 };   // 계단실 벽: 아래 노랑 / 위 연민트(영상 v2180_0159~0198)
  const WALL = 0xd8c39a, PAVE = 0xcfc8ba, INNER = 0xefe9dc, FLOOR = 0xe7e2d6, WOOD = 0xc9a063, CEIL = 0xf2eee4;
  // 지붕은 두 겹 — 위는 지붕색, 아래는 아이보리 천장. 벽·칸막이 윗면(FH)과 정확히 맞닿아 겹치지 않는다.
  // (별도 천장판을 방 안에 띄우면 칸막이가 그걸 관통해 감사에 걸린다 — 실제로 26쌍 났었다)
  // 천장 — 지붕 밑면(짙은 회갈)이 그대로 보이던 것을 아이보리로 덮는다.
  // ⚠️크기는 '벽 안쪽 면에서 1cm 더 안쪽'. 벽 안쪽에 정확히 맞추면 벽 세그먼트와 x1/z1이 같아져 감사에 걸린다.
  // ⚠️높이는 지붕 밑면 바로 아래(top-0.16). 벽 윗면(top)과 같은 높이로 두면 칸막이가 관통해 걸린다.
  // ⚠️천장·조명은 '아래를 향한 면'이라 HemisphereLight의 groundColor(갈색 땅)에 물든다.
  //   정점색을 아무리 밝게 해도 소용없다 → 조명을 받지 않는 MeshBasicMaterial로 만든다(v1도 같은 결론).
  const ceilMat = new THREE.MeshBasicMaterial({ color: CEIL });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfdfbf2 });
  const flatBox = (w, h, d, mat, cx, y, cz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(cx, y + h / 2, cz);
    m.matrixAutoUpdate = false; m.updateMatrix();
    scene.add(m);
  };
  const ceil = (x0, x1, z0, z1, top) =>
    flatBox(x1-x0-0.32, 0.15, z1-z0-0.32, ceilMat, (x0+x1)/2, top - 0.16, (z0+z1)/2);
  const doorC = r => r.span[0] + 1.9;

  // ================= 지형 =================
  addPanel(320, 240, 0x7cb85c, 0, -1.001, -10);
  addBox(164, 1, 52, PAVE, 0, -1, TERR_Z - 26);
  addPanel(96, 64, 0xd8c79e, SCHOOL.field.center[0], -0.995, SCHOOL.field.center[1]);

  // ================= 본관 =================
  const [fx0, fx1] = FR.x, [fz0, fz1] = FR.z, zCor = fz0 + FR.corridorDepth;
  const hall = FR.rooms.find(r => r.type === 'hall');
  wallX(fx0, fx1, fz1, WALL, { gaps: [{ c: (hall.span[0]+hall.span[1])/2, w: 3.0, glass: true, door: true }], wins: 15, sill: 1.0, wh: 1.6, face: 1 });
  const wg = B.wings[0];
  // ── 서측 로비 (사용자 08-01 확정 + 영상 v2180_0201~0225 + 문서 v80d) ──
  //  복도를 따라 서쪽으로 가다 도서관 앞(LOB_X)에서 확 넓어진다. 로비 = x -40~LOB_X, z LOB_Z~zCor.
  //  측문(서관 서벽 SIDE_Z)으로 들어서면: 왼쪽(북벽)=보건실·나래반 문 / 정면(동벽 x=LOB_X)=도서관 문 /
  //  오른쪽(남벽)=유치원 정문(원무실 팻말) / 가운데=둥근 기둥 소파.
  const LOB_X = -26.4, LOB_Z = -42, SIDE_Z = -39.4;
  // 주복도 북벽 — 서관·급식동 구간은 양쪽 다 실내(실내벽), 마당 구간(x8.4~)만 외벽
  wallX(fx0, -12, fz0, INNER, { gaps: [
    { c: (fx0 + LOB_X) / 2, w: LOB_X - fx0, dh: FH },          // 로비로 통째로 트임
    { c: -14.3, w: 2.6 },                                        // 계단홀
  ] });
  wallX(-12, 8.4, fz0, INNER, { gaps: [
    { c: -11.3, w: 1.2, glass: true },                           // 뒷통로(주차장 가는 길) 유리문
    { c: B.kitchen.dutyRoom.doorC, w: 1.2 },
    { c: B.kitchen.doorC, w: 1.8 },
    { c: 6.9, w: 3.0, dh: FH },                                  // 세로복도
  ] });
  // 마당면 — 학생자치회 게시판 자리(화장실 문 맞은편)는 창이 아니라 벽(사용자 08-01)
  wallX(8.4, fx1, fz0, WALL, { gaps: [{ c: 20, w: 1.8 }], wins: 7, face: -1, noWin: [[8.6, 13.4]] });
  wallZ(fz0, fz1, fx0, WALL, { wins: 1, face: -1 });             // 서벽 — 측문은 서관 서벽(로비)으로
  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: FR.corridorExitZ, w: 1.8 }], wins: 1, face: 1 });
  const cGaps = FR.rooms.map(r => r.type === 'hall' ? { c: (r.span[0]+r.span[1])/2, w: 3.4, dh: 2.7 }   // 로비 북단 아치(인방에 현판)
    : r.name === '원무실' ? { c: doorC(r), w: 1.8, glass: true }          // 유치원 정문(원무실 팻말) — 짙은 유리 양문(v80d)
    : { c: doorC(r), w: 1.2 });
  // 교실은 앞뒤 문 두 개(사용자 07-30 "실제 교실은 앞뒤로 문도 두 개")
  const twoDoor = r => ['classroom', 'computer', 'daycare', 'science'].includes(r.type);
  const backDoor = r => ({ c: r.span[1] - 1.9, w: 1.2 });
  FR.rooms.filter(twoDoor).forEach(r => cGaps.push(backDoor(r)));
  wallX(fx0 + 0.15, fx1 - 0.15, zCor, INNER, { gaps: cGaps });   // 내부벽은 외벽에서 0.3 인셋(코너 관통 금지)
  addPanel(fx1-fx0-0.3, zCor-fz0-0.3, FLOOR, 0, 0.012, (fz0+zCor)/2);
  {   // 현관 로비 — 영상 v2179_0327~0339: 북단 목재 아치에 '웃음꽃 피는 즐거운 학교', 양쪽 유리 진열장
    const hc = (hall.span[0] + hall.span[1]) / 2;
    addBox(3.4, 0.6, 0.16, 0x8a5a3b, hc, 2.75, zCor + 0.23, { collide: false });   // 폭 = 양쪽 칸막이 사이(넘으면 칸막이와 겹침)
    sign('웃음꽃 피는 즐거운 학교', hc, 3.05, zCor + 0.33, 0, 0.26);
    addBox(0.5, 1.1, 5.0, 0x9fc3cf, hall.span[0] + 0.4, 0, -29.5);
    addBox(0.5, 1.1, 5.0, 0x9fc3cf, hall.span[1] - 0.4, 0, -29.5);
  }
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    if (i > 0) addBox(0.3, FH, fz1-zCor-0.3, INNER, s0, 0, (zCor+fz1)/2);
    addPanel(cw-0.5, fz1-zCor-0.5, r.type==='hall'?FLOOR:0xead9c0, cx, 0.014, (zCor+fz1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare') {
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, 0.9, zCor + 0.23, { collide: false });   // 0.23=벽면(0.15)에 딱 붙임(0.28은 5cm 떠 있었다)
      addBox(1.2, 0.85, 0.6, 0x8a5a3b, cx - 2, 0, zCor + 1.4);
      for (let dx = -1; dx <= 1; dx++) for (let dz = 0; dz < 2; dz++) {
        addBox(1.1, 0.72, 0.5, 0xb0a18e, cx + dx*1.7, 0, zCor + 3.4 + dz*1.7);
        addBox(0.5, 0.85, 0.4, 0x8a7f6e, cx + dx*1.7, 0, zCor + 4.05 + dz*1.7);   // 의자(뒤 책상과 0.6 통로 유지)
      }
    } else if (r.type !== 'hall' && r.type !== 'toilet') {
      addBox(1.3, 0.74, 0.7, 0xb0a18e, cx - 1, 0, zCor + 3.5);
      addBox(1.3, 0.74, 0.7, 0xb0a18e, cx + 1, 0, zCor + 2.2);
      addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6);
    }
    if (r.type === 'toilet') {
      addBox(cw-1.2, 1.2, 0.4, 0xdfe8ee, cx, 0, fz1 - 0.55);                       // 세면대
      addBox(0.3, FH, fz1-zCor-2.2, INNER, cx, 0, (zCor+fz1)/2 - 0.6);             // 남|여 구분벽
      [-3.1, -1.6, 1.6, 3.1].forEach(ox => addBox(0.24, 1.9, 1.5, 0xdfe8ee, cx+ox, 0, zCor + 1.55));  // 칸막이
    }
    sign(r.name, doorC(r) + 1.3, 2.35, zCor - 0.22, 0, 0.34);
  });
  {   // 복도 채우기 — 사물함·소화기·형광등(빈 복도가 v1 대비 가장 크게 비어 보이던 부분)
    // 창 아래 낮은 나무 사물함 — 영상 v2179_0462~0519: 북쪽 창 밑으로 복도 끝까지 이어진다(키 큰 철제함 아님)
    [[8.55, 19.1], [20.9, 39.85]].forEach(([a, b]) => {
      const n = Math.floor((b - a) / 1.2);
      for (let k = 0; k < n; k++) addBox(1.2, 0.85, 0.45, k % 2 ? 0xa9784a : 0xb4845a, a + 0.6 + k * 1.2, 0, fz0 + 0.375);
    });
    // 학생자치회 게시판 — 화장실 문 맞은편 벽(사용자 07-31·08-01 반복 지적: 창이 아니라 벽)
    addBox(4.4, 1.3, 0.16, 0x2f6e4f, 11.0, 1.05, fz0 + 0.23, { collide: false });
    sign('학생자치회', 11.0, 2.1, fz0 + 0.33, 0, 0.26);
    [12.5, 26.5, 35.5].forEach(x => addBox(0.24, 0.6, 0.24, 0xc4402e, x, 1.85, fz0 + 0.32, { collide: false }));  // 소화기
    for (let x = -37; x <= 38; x += 4.5)                                           // 형광등(지붕 밑면에 맞댐)
      flatBox(1.6, 0.16, 0.5, lampMat, x, FH - 0.32, (fz0 + zCor) / 2);   // 천장 밑면에 붙임
  }
  addBox(fx1-fx0+0.8, 0.3, fz1-fz0+0.38, 0xd9dce1, 0, FH, (fz0+fz1)/2 + 0.21);   // 북단은 서관 슬래브(z-38)와 접면까지만
  addBox(fx1-fx0+0.8, 0.45, 0.3, 0xe8e6de, 0, FH+0.3, fz1+0.25, { collide: false });
  addBox(4, 1.8, 3, 0xe8e6de, fx1-8, FH+0.3, (fz0+fz1)/2);
  {
    const hx = 6.15;
    addBox(76, 0.6, 0.2, 0x4a6fa5, 0, 2.65, fz1 + 0.14, { collide: false });
    [-4.2,-1.5,1.5,4.2].forEach(ox => addBox(0.4, 3.0, 0.4, 0x3b2d24, hx+ox, 0, fz1+4.2));
    addBox(11, 0.45, 5.6, 0x3b2d24, hx, 3.0, fz1+3.2);
    addBox(11.4, 0.3, 0.6, 0xe8b93a, hx, 3.45, fz1+5.9, { collide: false });   // 포치 테두리=노랑 포인트
    sign(SCHOOL.name, hx, 2.6, fz1 + 6.05, 0, 0.5);
    // 구령대(포치) — 영상 v2179_0282~0321. 가운데 계단은 없다(계단은 양 끝에서 옹벽을 따라 — 아래 '지형 단차')
    addBox(11.0, 1.0, 0.16, 0xc8cdd2, hx, 0, -18.25);                       // 앞 스테인리스 난간
    [[2.4, -20.8], [9.9, -20.8]].forEach(([tx9, tz9]) => {                    // 구령대 탁자·의자(사용자 07-31 "구령대 책상")
      addBox(1.4, 0.72, 0.8, 0x8a6a45, tx9, 0, tz9);
      addBox(0.45, 0.85, 0.45, 0x5a4636, tx9 - 0.95, 0, tz9); addBox(0.45, 0.85, 0.45, 0x5a4636, tx9 + 0.95, 0, tz9);
    });
    addBox(2.2, 1.3, 0.45, 0xa9784a, 3.4, 0, -23.625);                      // 현관 유리문 좌우 나무 신발장(사용자 07-31)
    addBox(1.6, 1.3, 0.45, 0xa9784a, 8.6, 0, -23.625);
    addPanel(3.0, 1.4, 0x7a3b3b, hx, 0.03, -23.0);                           // 발매트
  }

  // ================= 서관 =================
  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  wallX(wx0, -16.6, wz0, WALL, { h: FH, wins: 5, face: -1 });
  wallX(-16.6, wx1, wz0, WALL, { h: FH, face: -1, dado: STAIR_DADO });       // 계단실 북벽(참의 큰 창은 따로)
  wallX(wx0, -16.6, wz0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 5, face: -1, sill: 0.8 });
  wallX(-16.6, wx1, wz0, WALL, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO });
  wallZ(wz0, wz1, wx0, WALL, { h: FH, wins: 2, face: -1, gaps: [{ c: SIDE_Z, w: 2.2, glass: true }] });   // 측문(서측 바깥현관 유리 이중문)
  wallZ(wz0, wz1, wx0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 2, face: -1, sill: 0.8 });
  wallZ(wz0, wz1, wx1, WALL, { h: FH, dado: STAIR_DADO });                       // 동벽(주차장면) — 안쪽은 계단실
  wallZ(wz0, wz1, wx1, WALL, { y0: FH+0.3, h: FH-0.3, dado: STAIR_DADO });
  wallX(wx0, wx1, wz1, WALL, { y0: FH+0.3, h: FH-0.3, wins: 6, face: 1, sill: 0.8, noWin: [[-16.6, -12]] });  // 2층 남면(1층 z-38은 본관 북벽)
  addBox(1.0, 2.2, 0.16, 0x8a5a3b, -14.3, FH + 0.3, wz1 - 0.23);   // 2층 계단홀 옥상 쪽 나무문(문서 v80c) — 닫힌 모양만(열면 지붕 위로 나간다)
  addPanel(wx1-wx0-0.3, wz1-wz0-0.3, FLOOR, (wx0+wx1)/2, 0.012, (wz0+wz1)/2);
  {
    const nurse = wg.rooms.find(r => r.type === 'nurse'), narae = wg.rooms.find(r => r.name === '나래반');
    const nurseDoor = nurse.span[0] + 2.0, naraeDoor = (narae.span[0] + narae.span[1]) / 2;
    // 로비 북벽(z=LOB_Z): 보건실·나래반 문. 동끝은 로비 동벽 바깥면까지(모서리 빈틈 방지 — 맞댐)
    wallX(wx0 + 0.15, LOB_X + 0.15, LOB_Z, INNER, { gaps: [{ c: nurseDoor, w: 1.2 }, { c: naraeDoor, w: 1.8, glass: true }],
      wins: 4, sill: 1.55, wh: 0.9 });   // 나무틀 높은 창(영상 v2180_0210 오른쪽 벽 위)
    // 로비 동벽(x=LOB_X) = 도서관 서벽 — 측문을 정면으로 마주 보는 도서관 문
    wallZ(LOB_Z, fz0, LOB_X, INNER, { gaps: [{ c: SIDE_Z, w: 1.8, glass: true }] });
    // 로비 북쪽 방들 칸막이(z wz0~LOB_Z): 보건실|나래반, 나래반|문서고(문서고는 나래반 안에서 — 개구), 문서고|도서관
    const pz = (wz0 + 0.15 + LOB_Z - 0.15) / 2, pd = (LOB_Z - 0.15) - (wz0 + 0.15);
    addBox(0.3, FH, pd, INNER, narae.span[0], 0, pz);
    addBox(0.3, FH, 3.25, INNER, -28.6, 0, wz0 + 0.15 + 1.625);
    addBox(0.3, FH, 3.25, INNER, -28.6, 0, LOB_Z - 0.15 - 1.625);
    addBox(0.3, FH - 2.6, 1.2, INNER, -28.6, 2.6, pz);
    addBox(0.3, FH, pd, INNER, LOB_X, 0, pz);
    wg.rooms.forEach(r => {
      const [s0, s1] = r.span, cx = (s0 + s1) / 2;
      const deep = r.type === 'library' || r.type === 'stair';        // 도서실·계단홀은 복도 벽까지 깊다
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: deep ? fz0 : LOB_Z, y: 0, label: r.name });
      if (r.type === 'library') {
        for (let k = 0; k < 3; k++) addBox(6, 1.9, 0.5, 0x8a6a45, cx + 0.6, 0, wz0 + 2.0 + k * 2.3);
        addBox(2.4, 0.72, 1.2, 0xc9a063, cx + 0.6, 0, -41.2);          // 열람 탁자
      }
      if (r.type === 'nurse') { addBox(1.05, 0.5, 2, 0xf2f5f7, cx-1, 0, wz0+2.5); addBox(1.05, 0.5, 2, 0xf2f5f7, cx+1, 0, wz0+2.5); }
    });
    sign('보건실', nurseDoor, 2.35, LOB_Z + 0.22, 0, 0.34);
    sign('나래반', naraeDoor, 2.45, LOB_Z + 0.22, 0, 0.34);
    sign('문서고', -27.5, 2.35, LOB_Z + 0.22, 0, 0.28);
    sign('슬기샘 도서관', LOB_X - 0.22, 2.55, SIDE_Z, Math.PI / 2, 0.34);
    // 도서관 복도창(짙은 초록 시트지) + 창 아래 자작나무색 사물함 — 복도 북벽 x LOB_X~-16.6
    [-24.3, -21.4, -18.5].forEach(wx9 => addBox(2.4, 1.3, 0.46, 0x2f5a44, wx9, 1.05, fz0, { collide: false }));
    for (let k = 0; k < 8; k++) addBox(1.2, 0.85, 0.45, k % 2 ? 0xd8c3a0 : 0xe2cfad, LOB_X + 0.15 + 0.6 + k * 1.2, 0, fz0 + 0.375);
    // 로비 가운데 둥근 기둥 소파(주황·노랑 2단 + 연두 기둥 + 민트 잎 갓) — 측문→도서관 시선은 비켜 남쪽에
    const [dx9, dz9] = [-32.2, -37.4];
    addBox(2.3, 0.45, 2.3, 0xe8893a, dx9, 0, dz9);
    addBox(1.5, 0.4, 1.5, 0xf2b84b, dx9, 0.45, dz9);
    addBox(0.6, FH - 0.85, 0.6, 0xb8d67a, dx9, 0.85, dz9);
    flatBox(2.0, 0.2, 2.0, new THREE.MeshBasicMaterial({ color: 0xa8dcc6 }), dx9, FH - 0.5, dz9);   // 민트 갓 — 아랫면만 보이므로 조명 무시 재질(갈색 물듦 방지)
    // 문서고 벽 앞 쿠션 벤치(주황·초록·노랑) + 도서관 문 옆 도서반납함 — 영상 v2180_0210·0225
    [[-30.4, 0xe8893a], [-29.2, 0x8cc26a], [-28.0, 0xf2c14b]].forEach(([bx9, bc9]) => addBox(1.2, 0.45, 0.6, bc9, bx9, 0, LOB_Z + 0.45));
    addBox(0.4, 0.95, 0.55, 0x3d6fa8, LOB_X - 0.35, 0, SIDE_Z + 1.55);
    // 측문 안쪽: 오픈 신발장 + 체크 매트
    addBox(0.45, 1.2, 1.4, 0xb58a5a, wx0 + 0.375, 0, SIDE_Z + 2.0);   // 문 남쪽(북쪽은 로비 북벽과 겹침)
    addPanel(1.8, 2.0, 0x8a6a4e, wx0 + 1.1, 0.03, SIDE_Z);
    zones.push({ x0: fx0, x1: LOB_X, z0: LOB_Z, z1: zCor, y: 0, label: '서측 로비' });
  }
  {   // U자 계단 — 사용자 07-31 "1층 계단 위치는 비슷한데 올라가는 방법이 다름" + 영상 v2180_0159~0174 + 문서 v80c
      //  계단홀(x -16.6~-12)에서 A레인(서쪽 절반)으로 북쪽 반층 참까지 → 180° 돌아 B레인(동쪽 절반)으로 남쪽 2층.
    const STONE = 0xb9b7b0, AX = -15.375, BX = -13.225, LW = 2.15, N = 12, RISE = (FH + 0.3) / 2 / N, TR = 0.2875;
    const Z0 = -44.4, ZL = Z0 - N * TR;                                   // A레인 발치 z-44.4 · 참 남단 z-47.85
    wallZ(wz0, wz1, -16.6, INNER, { h: FH, face: -1, dado: STAIR_DADO });       // 도서실|계단홀 — 도서실 쪽은 실내색, 계단 쪽은 두 톤
    for (let i = 0; i < N; i++) addBox(LW, RISE * (i + 1), TR, STONE, AX, 0, Z0 - TR * (i + 0.5));        // A레인
    addBox(4.3, RISE * N, ZL - (wz0 + 0.15), STONE, -14.3, 0, (ZL + wz0 + 0.15) / 2);                    // 반층 참(북벽 창가)
    for (let j = 0; j < N; j++) addBox(LW, 0.3, TR, STONE, BX, RISE * (N + j + 1) - 0.3, ZL + TR * (j + 0.5));   // B레인(떠 있는 디딤판)
    addBox(4.6, 0.3, -37.98 - Z0, 0xd9dce1, -14.3, FH, (Z0 - 37.98) / 2);  // 2층 바닥이 계단홀 남쪽 위로 이어져 B레인 끝과 맞닿음
    addBox(LW, 1.05, 0.16, 0xc8cdd2, AX, FH + 0.3, Z0 + 0.08);            // 2층: A레인 위 빈 곳 난간
    addBox(3.2, 1.3, 0.46, 0x51606c, -14.3, RISE * N + 0.15, wz0, { collide: false });   // 참의 큰 창(9분할 — 문서 v80c)
    sign('계단 · 2층', -14.3, 2.95, fz0 + 0.22, 0, 0.3);
    // 계단홀 위는 2층 바닥이 뚫려 있어 1층 벽 윗단(FH)과 2층 벽 아랫단(FH+0.3) 사이가 비어 하늘이 보였다 → 테두리보로 메움
    addBox(4.6, 0.3, 0.3, WALL, -14.3, FH, wz0);                                       // 북벽
    addBox(0.3, 0.3, (Z0) - (wz0 + 0.15), WALL, -12, FH, (Z0 + wz0 + 0.15) / 2);       // 동벽(2층 바닥이 없는 구간만)
  }
  addBox(wx1-wx0-4.6, 0.3, wz1-wz0+0.02, 0xd9dce1, wx0 + (wx1-wx0-4.6)/2, FH, (wz0+wz1)/2+0.01);   // 남단 z-37.98 = 본관 지붕과 정확히 맞댐(하늘 틈 봉합)
  {
    const zc2 = wz1 - 2.7;
    B.upper.rooms.forEach((r, i) => {
      const [s0, s1] = r.span, cx = (s0+s1)/2;
      if (i > 0) addBox(0.3, FH-0.3, zc2-wz0-0.3, INNER, s0, FH+0.3, (wz0+zc2)/2);
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, FH+1.2, wz0+0.23, { collide: false });   // 2층 칠판은 30cm 떠 있었다
      // 가구 간격 규칙: 책상 폭 1.1 + 틈 1.1(사람 폭 0.52의 2배) — 좁은 실은 개수를 줄인다.
      // ⚠️1.45 간격은 틈이 0.35라 사람이 못 지나가 방이 통째로 봉쇄됐었다(SD2.reach가 적발).
      const nD = (s1 - s0) > 7 ? 3 : 1;
      for (let d = 0; d < nD; d++) addBox(1.1, 0.72, 0.5, 0xb0a18e, cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3);
      sign(r.name, doorC(r)+1.2, FH+2.55, zc2-0.22, 0, 0.34);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: zc2, y: FH+0.3, label: r.name });
    });
    zones.push({ x0: wx0, x1: -12.2, z0: zc2, z1: wz1, y: FH+0.3, label: '2층 복도' });
    wallX(wx0 + 0.15, -16.45, zc2, INNER, { y0: FH+0.3, h: FH-0.3, gaps: [...B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })), ...B.upper.rooms.filter(twoDoor).map(backDoor)] });
    wallZ(wz0, zc2, -16.6, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO });   // 소담실 동벽(계단홀 쪽 두 톤)
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xe8e6de, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });

  // ================= 급식동 =================
  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  wallX(kx0, kx1 - 0.15, kz0, WALL, { h: K.wallHeight, wins: 4, face: -1, sill: 2.4, wh: 1.2 });
  wallZ(kz0, kz1, kx0, WALL, { h: K.wallHeight, wins: 4, face: -1 });
  // 이 벽 = 세로복도 동벽 = 동관 서벽(x8.4 3중 공유). 개구: 동관 복도 연결(-56.5)·마당 문(-41).
  // ⚠️hallEastDoorZ(-44)는 서벽(x5.4) 문 — 여기 두면 2학년 교실 벽에 반쯤 걸린 구멍이 된다(실수했던 지점)
  wallZ(kz0, kz1, kx1, WALL, { h: K.wallHeight, gaps: [{ c: -56.5, w: 2.4 }, { c: B.linkCorridor.yardDoorZ, w: 1.6 }], face: 1 });
  addPanel(kx1-kx0-0.3, kz1-kz0-0.3, FLOOR, (kx0+kx1)/2, 0.012, (kz0+kz1)/2);
  wallX(kx0 + 0.15, 5.25, K.cookWallZ, INNER, { h: K.wallHeight, gaps: [{ c: K.cookDoorC, w: 1.4 }, { c: -1, w: 4.0, dh: K.wallHeight }] });   // 동단은 세로복도 서벽(x5.4) 앞까지
  addBox(4.0, 1.0, 0.3, INNER, -1, 0, K.cookWallZ);                                   // 배식창 아래(배식대 높이) — 창 = y 1.0~2.0
  addBox(4.0, K.wallHeight - 2.0, 0.3, INNER, -1, 2.0, K.cookWallZ);
  addBox(5.5, 0.95, 1, 0xc4c9cd, -1, 0, K.cookWallZ + 1.3);
  // 식탁: 홀 장축(동서) 방향으로 길게 — 사용자 08-01 "식탁 방향" 지적·영상 v2178. 양옆 짙은 빨강 둥근 의자 줄.
  const table9 = (tx, tz) => {
    addBox(3.2, 0.72, 0.8, 0xb5713d, tx, 0, tz);
    addBox(3.2, 0.42, 0.3, 0x9b2c3a, tx, 0, tz - 0.6); addBox(3.2, 0.42, 0.3, 0x9b2c3a, tx, 0, tz + 0.6);
  };
  [-7.2, -2.6, 2.0].forEach(tx => [-46.6, -44.2].forEach(tz => table9(tx, tz)));
  [-1.2, 3.0].forEach(tx => table9(tx, -40.4));                  // 당직실 동쪽 줄(급식실 남문 앞은 비움)
  addBox(0.2, 3.6, 7.4, 0x9aa0a6, kx0 + 0.25, 0, -46.0, { collide: false });   // 서벽 전폭 회색 주름 커튼 — 단상 없음, 뒤는 악기 보관
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
  wallZ(-58, fz0, LC.x[0], INNER, { gaps: [{ c: K.hallEastDoorZ, w: 1.8 }] });   // z-58까지(동관 복도 연결부) — 양쪽 다 실내라 실내벽
  // 세로복도에서 급식실이 보이는 창(사용자 07-31 "2·4학년 가는 복도에 급식실 보이는 창문")
  [-48.0, -40.2].forEach(wz9 => addBox(0.46, 1.4, 2.2, 0x51606c, LC.x[0], 1.0, wz9, { collide: false }));   // 식당홀 문(z-44)이 미끄러지는 자리 밖
  // (세로복도 동벽 = 급식동 동벽 x8.4 공유 — 위에서 통합 시공. 동관 복도 개구 -56.5)
  addPanel(LC.x[1]-LC.x[0]-0.3, 19.1, FLOOR, 6.9, 0.012, -47.85);
  addBox(3.0, 0.3, 19.7, 0xd9dce1, 6.45, FH, -47.85);   // 동관 지붕(x8~)과 겹침 금지·북단은 급식동 북벽 안쪽 면까지

  // ================= 동관 =================
  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  wallX(ex0 + 0.15, ex1, ez1, WALL, { wins: 8, face: 1 });   // 서단 0.3 인셋(공유벽 x8.4 관통 금지)
  wallX(ex0, ex1, ez0, WALL, { wins: 8, face: -1 });
  // 동벽: 창고 외부문(-50)만. ⚠️복도 동쪽끝엔 문이 없다(사용자 07-30 "그쪽 복도에서 바깥으로 나가는 곳은 없음" — 판벽+점검구)
  // ⚠️창고는 밖(텃밭 쪽)에서만 들어간다 — 복도와 이어지지 않음. 북벽에 뚫으면 복도로 들어갈 뿐(실제로 그랬음).
  wallZ(ez0, ez1, ex1, WALL, { wins: 2, face: 1, gaps: [{ c: -50, w: 1.2 }] });
  // (동관 서벽 = 급식동 동벽 x8.4 공유 — 이중 시공 금지)
  const eGaps = E.rooms.filter(r => !r.innerOnly && !r.external).map(r => ({ c: doorC(r), w: 1.2 }));
  E.rooms.filter(twoDoor).forEach(r => eGaps.push(backDoor(r)));
  wallX(ex0 + 0.15, ex1 - 0.15, zCE, INNER, { gaps: eGaps });
  addPanel(ex1-ex0-0.3, zCE-ez0-0.3, FLOOR, (ex0+ex1)/2, 0.012, (ez0+zCE)/2);
  E.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && r.name !== '과학준비실') addBox(0.3, FH, ez1-zCE-0.3, INNER, s0, 0, (zCE+ez1)/2);
    addPanel(s1-s0-0.5, ez1-zCE-0.5, 0xead9c0, cx, 0.014, (zCE+ez1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCE, z1: ez1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      addBox(3, 1.2, 0.16, 0x2e5d43, cx, 0.9, zCE + 0.23, { collide: false });
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
  wallZ(gz0, gz1, gx1, 0xa8503a, { h: 3.2, gaps: [{ c: gz, w: 3, glass: true, door: true }] });   // 체육관 현관 — 유리 양여닫이
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
    wallX(gx0 + 0.15, -72.85, -48.4, INNER, { h: 3.2, gaps: [{ c: -75.3, w: 1.2 }] });
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
    {   // 미끄럼틀 — 발판 윗면(0.2)에서 땅까지 한 판으로(떠 있는 계단식 판은 '부품이 따로 노는' 것으로 보였다 — 사용자 08-01)
      const ang = Math.atan2(1.2, 3.0), L = Math.hypot(1.2, 3.0);
      const chute = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, L), new THREE.MeshLambertMaterial({ color: 0xe8b93a }));
      chute.rotation.x = -ang;                                   // +z 끝(발판 쪽)을 들어 올린다
      chute.position.set(px - 4, -0.4 - 0.075, pz - 3.4 - 1.5);
      chute.matrixAutoUpdate = false; chute.updateMatrix(); scene.add(chute);
    }
    addBox(0.3, 0.5, 1.0, 0x9aa5ad, px-1, -0.5-0.5+0.5, pz+2);
    addBox(3.2, 0.16, 0.56, 0xc8cdd2, px-1, -0.34, pz+2, { collide: false });
    [[-1.5],[1.5]].forEach(([ox]) => addBox(0.62, 0.2, 0.62, 0x26282c, px-1+ox, -1, pz+2));
    [[0],[2.2]].forEach(([oz]) => {
      addBox(0.16, 2.2, 0.16, 0x3a6ea5, px+3, -1, pz-1+oz); addBox(0.16, 2.2, 0.16, 0x3a6ea5, px+5, -1, pz-1+oz);
    });
    addBox(2.16, 0.16, 0.16, 0x3a6ea5, px+4, 1.2, pz-1, { collide: false });
    addBox(2.16, 0.16, 0.16, 0x3a6ea5, px+4, 1.2, pz+1.2, { collide: false });
    [pz-1, pz+1.2].forEach(sz9 => [px+3.6, px+4.4].forEach(sx9 => {          // 그네: 가로대에 매달린 줄 2 + 의자(줄 없이 떠 있지 않게)
      addBox(0.6, 0.15, 0.3, 0xd94848, sx9, -0.55, sz9, { collide: false });
      addBox(0.16, 1.6, 0.16, 0x9aa0a6, sx9 - 0.22, -0.4, sz9, { collide: false });
      addBox(0.16, 1.6, 0.16, 0x9aa0a6, sx9 + 0.22, -0.4, sz9, { collide: false });
    }));
    {   // 둥근 벤치를 두른 나무 — 영상 v2179_0033~0039(놀이터 모래밭 가운데)
      const [tx9, tz9] = [px + 5.5, pz + 3.8];
      tree(tx9, tz9, 1.1);
      addBox(1.9, 0.42, 0.35, 0x6d5a4a, tx9, -1, tz9 - 0.8); addBox(1.9, 0.42, 0.35, 0x6d5a4a, tx9, -1, tz9 + 0.8);
      addBox(0.35, 0.42, 1.25, 0x6d5a4a, tx9 - 0.8, -1, tz9); addBox(0.35, 0.42, 1.25, 0x6d5a4a, tx9 + 0.8, -1, tz9);
    }
    {   // 구름사다리 — 영상 v2179_0027
      const [lx9, lz9] = [px - 5.5, pz + 3.5];
      [-1.5, 1.5].forEach(ox => [-0.5, 0.5].forEach(oz => addBox(0.16, 2.1, 0.16, 0x3a6ea5, lx9 + ox, -1, lz9 + oz)));
      [-0.5, 0.5].forEach(oz => addBox(3.16, 0.16, 0.16, 0x3a6ea5, lx9, 1.1, lz9 + oz, { collide: false }));
      for (let k = -2; k <= 2; k++) addBox(0.16, 0.16, 0.84, 0xc8cdd2, lx9 + k * 0.55, 1.1, lz9, { collide: false });
    }
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
  {   // 주차장 — ①서관 바로 뒤(사용자 08-01 "나래반·보건실 뒤가 바로 주차장") ②그 북쪽 띠(위성: 서관·급식동 서쪽 위)
      //   진입 = 계단홀 옆 뒷통로(x-11.3). 동관·텃밭 위(x>0)에는 주차장이 없다(위성 598019961f).
    const ASP = 0x8f9095, LINE = 0xe8eaea;
    addPanel(27.7, 7.3, ASP, -26.05, 0.008, -54.0);              // ① x -39.9~-12.2, z -57.65~-50.35
    addPanel(40, 8, ASP, -19.5, 0.008, -62.35);                   // ② x -39.5~0.5,  z -66.35~-58.35
    for (let x = -38.5; x <= -14.5; x += 2.5) addPanel(0.14, 2.6, LINE, x, 0.02, -56.2);
    for (let x = -38; x <= -1; x += 2.5) addPanel(0.14, 2.6, LINE, x, 0.02, -64.9);
    addPanel(4.8, 2.6, 0x3f6fb5, -16.0, 0.02, -51.8);              // 장애인 주차면(뒷통로 나오는 곳 가까이)
    [[-33.8, -56.0, 0x4d76b3, 0x6f92c4], [-24.8, -56.0, 0xe9ecef, 0xd8dde2], [-28.8, -64.8, 0xcf6b52, 0xe08a72]].forEach(([cx9, cz9, b9, t9]) => {
      addBox(1.8, 0.7, 4.0, b9, cx9, 0, cz9);
      addBox(1.6, 0.55, 2.0, t9, cx9, 0.7, cz9);
    });
    addBox(2.4, 2.5, 5.2, 0xe9b52a, -3.5, 0, -62.4);               // 노란 컨테이너 창고(영상 v2180_0027~0039)
    sign('주차장', -26, 1.6, -50.7, 0, 0.4);
    zones.push({ x0: -39.5, x1: -12.5, z0: -57.5, z1: -50.5, y: 0, label: '주차장' });
    zones.push({ x0: -39, x1: 0, z0: -66, z1: -58.6, y: 0, label: '주차장(북쪽)' });
    // 주차장 → 텃밭 흙길(급식동·동관 북쪽 따라) — 영상 v2180_0036~0048
    addPanel(40, 1.2, 0x8a7a5e, 20.5, 0.006, -59.2);
    // 텃밭 옆 나무 데크 + 피크닉 테이블(사용자 07-31·08-01: 데크는 텃밭 근처에만, 주차장엔 없음)
    addBox(6, 0.3, 6, 0x9a7650, 45, 0, -51);
    [[43.6, -52.4], [46.4, -49.6]].forEach(([px9, pz9]) => {
      addBox(1.6, 0.42, 0.8, 0x7a5636, px9, 0.3, pz9);
      addBox(1.6, 0.16, 0.3, 0x6d4e32, px9, 0.3, pz9 - 0.7); addBox(1.6, 0.16, 0.3, 0x6d4e32, px9, 0.3, pz9 + 0.7);
    });
    zones.push({ x0: 42.2, x1: 47.8, z0: -53.8, z1: -48.2, y: 0.3, label: '텃밭 쉼터' });
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
  {   // 무지개 쉼터 — 위성·영상 v2179_0024~0039: 남쪽 울타리 따라 초록·주황·파랑 반복 지붕, 갈색 기둥
    const [sx9, sz9] = SCHOOL.shelter.center, sl = SCHOOL.shelter.length, RB = [0x6cc070, 0xf0a04b, 0x6fb3e0];
    [-sl/2+0.5, 0, sl/2-0.5].forEach(ox => { addBox(0.3, 2.6, 0.3, 0x6d4e32, sx9+ox, -1, sz9-1.7); addBox(0.3, 2.6, 0.3, 0x6d4e32, sx9+ox, -1, sz9+1.7); });
    for (let k = 0; k < sl / 2; k++) addBox(2, 0.3, 4.4, RB[k % 3], sx9 - sl/2 + 1 + 2*k, 1.6, sz9);
    addBox(sl-2, 0.45, 0.6, 0xb5793f, sx9, -1, sz9-1.0);
    addBox(sl-2, 0.45, 0.6, 0xb5793f, sx9, -1, sz9+1.0);
    sign('무지개 쉼터', sx9, 1.2, sz9+2.1, 0, 0.34);
    // 놀이마당: 회색 포장 + 바닥 놀이 원(과녁형 동심원 — 같은 높이의 겹치지 않는 고리라 반짝임 없음)
    addPanel(18, 11.5, 0xb9bcc0, sx9 + 1, -0.98, sz9 - 3.4);          // 서단 x-44 = 놀이터 모래와 맞댐(겹치면 반짝임)
    const ringMat = {}, ring = (x, z, r0, r1, col) => {
      const m9 = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 32), ringMat[col] || (ringMat[col] = new THREE.MeshLambertMaterial({ color: col })));
      m9.rotation.x = -Math.PI / 2; m9.position.set(x, -0.97, z); m9.matrixAutoUpdate = false; m9.updateMatrix(); scene.add(m9);
    };
    [[sx9 - 5, sz9 - 5.5], [sx9 + 1.5, sz9 - 6.5], [sx9 + 6.5, sz9 - 4.8]].forEach(([cx9, cz9]) => {
      ring(cx9, cz9, 0.0, 0.45, 0xe24b4b); ring(cx9, cz9, 0.6, 0.85, 0xf2c94c); ring(cx9, cz9, 1.0, 1.25, 0x5b8fc9); ring(cx9, cz9, 1.4, 1.6, 0x8cc26a);
    });
  }
  {   // 셔틀버스 — 정문 안쪽 마당(사용자 07-31 "셔틀버스 새 위치" · 영상 v2179_0006~0024)
    addBox(10.5, 2.4, 2.5, 0xf2c230, 23.75, -1, 41.6);
    addBox(9.0, 0.8, 2.56, 0x2f3a45, 24.3, 0.4, 41.6, { collide: false });   // 창 띠
  }
  {
    const [gtx, gtz] = SCHOOL.gate;
    addBox(1, 3, 1, 0xb9b5aa, gtx-4, -1, gtz); addBox(1, 3, 1, 0xb9b5aa, gtx+4, -1, gtz);
    addBox(7, 0.5, 0.8, 0x8a9096, gtx, 2.1, gtz, { collide: false });
    sign(SCHOOL.name, gtx, 1.5, gtz - 0.65, 0, 0.55);
    addBox(116, 1.1, 0.3, 0xd8d2c6, gtx - 4 - 0.5 - 58, -1, gtz);
    addBox(42, 1.1, 0.3, 0xd8d2c6, gtx + 4 + 0.5 + 21, -1, gtz);
    addBox(0.16, 10, 0.16, 0xc8cdd2, -2.6, 0, -19.2);                          // 게양대 — 구령대 서쪽 잔디(길 위에 서 있었음)
    addBox(1.4, 0.9, 0.16, 0xf5f6f8, -2.6 + 0.85, 8.6, -19.2, { collide: false });
    tree(SCHOOL.bigTree[0], SCHOOL.bigTree[1], 2.2);
    [[-30,-19],[-10,-19],[30,-19],[44,20],[15,40],[-22,40],[56,-40]].forEach(([tx9,tz9]) => tree(tx9, tz9, 1));
    // 건물 앞 산책로: 잔디 두 줄 사이 타일 길 + 노란 점자블록 + 둥근 향나무
    [[-39.5, 0.65], [11.65, 39.5]].forEach(([a, b]) => {
      const w = b - a, c = (a + b) / 2;
      addPanel(w, 2.05, 0x6fa35a, c, 0.015, -22.775);
      addPanel(w, 2.15, 0x6fa35a, c, 0.015, -19.175);
      addPanel(w, 1.5, 0xdcc9a6, c, 0.02, -21.0);
      addPanel(w, 0.3, 0xe9c341, c, 0.03, -21.0);
    });
    [-37, -32.5, -28, -23.5, -19, -14.5, -10, -5.5, 16.5 + 3, 23.5, 28, 32.5, 37].forEach((sx9, k) => {
      const sz9 = k % 2 ? -19.2 : -22.8;
      addBox(1.1, 0.9, 1.1, 0x3f7a3f, sx9, 0, sz9);
      addBox(0.7, 0.4, 0.7, 0x4d8b4d, sx9, 0.9, sz9, { collide: false });
    });
  }
  {   // 지형 단차 마감 — 옹벽(좌 모자이크·우 마름돌)+동서 오르는 길. 옹벽 상면이 부지 레벨(y0)이라 길만 놓으면 이어진다
    addBox(82.65, 1, 0.4, 0xb9ad97, -40.675, -1, -17.8);   // 서측(테라스 남면에 맞댐 — 파고들면 동일평면)
    addBox(70.35, 1, 0.4, 0xc9c4bb, 46.825, -1, -17.8);    // 동측
    // 구령대 정면 모자이크 무늬(사용자 07-31 "구령대 정면으로 볼 때 무늬") — x 0.65~11.65
    const MOS = [0xe07a5f, 0xf2cc8f, 0x81b29a, 0x5b8fc9, 0xf4a261, 0xb48ed6];
    for (let k = 0; k < 20; k++) addBox(0.55, 1, 0.4, MOS[k % 6], 0.65 + 0.55 * (k + 0.5), -1, -17.8);
    // 운동장 → 구령대 계단: 양 끝에서 옹벽을 따라 6단씩(사용자 07-31 "운동장에서 구령대 올라가는 계단")
    for (let i = 0; i < 6; i++) {
      addBox(0.35, (i + 1) / 6, 1.6, PAVE, 11.65 + 0.35 * (5 - i) + 0.175, -1, -16.8);   // 동쪽 끝(통학로가 닿는 쪽)
      addBox(0.35, (i + 1) / 6, 1.6, PAVE, 0.65 - 0.35 * (5 - i) - 0.175, -1, -16.8);    // 서쪽 끝
    }
    [[-30, 4.4], [40, 4.4]].forEach(([rx, rw]) => {
      for (let i = 0; i < 3; i++) addBox(rw, 1 - i*0.33, 0.5, PAVE, rx, -1, -17.35 + i*0.5);
    });
    // 운동장 → 체육관 쪽 화강석 계단(영상 v2179_0084~0090, v1 x-43.5)
    for (let i = 0; i < 6; i++) addBox(3.0, (i + 1) / 6, 0.27, 0xb8b4ac, -43.5, -1, -17.6 + 0.27 * (5 - i) + 0.135);
    addPanel(2.2, 23.2, 0xd9c7a0, -45.2, 0.02, -30.0);                       // 계단 위 → 체육관 현관까지 타일 길(영상 v2179_0093~0099)
    // 통학로 — 정문→동측→구령대(노란 점자블록)
    addPanel(1.2, 57, 0xe9c341, 30, -0.985, 16);
    addPanel(17, 1.2, 0xe9c341, 22.1, -0.985, -12.5);
    addPanel(1.2, 3.4, 0xe9c341, 14.2, -0.985, -14.3);
  }
  {   // 랜드마크 소품 — 인식 포인트(v1 v0.22~0.52)
    // 교훈석 — 구령대 동쪽(영상 v2179_0285: 구령대→계단→교훈석→가로등→향나무→탑시계 순)
    addBox(1.3, 2.1, 0.7, 0x7d7f7c, 13.4, 0, -19.3);
    sign('바르고 슬기롭게', 13.4, 1.5, -18.88, 0, 0.2);
    addBox(0.16, 4.2, 0.16, 0x9aa0a6, 15.0, 0, -19.0);                         // 태양광 가로등
    addBox(0.7, 0.3, 0.4, 0xdfe3e8, 15.0, 4.2, -19.0, { collide: false });
    addBox(1.0, 1.7, 0.5, 0xb9b5aa, -8.5, 0, -19.3);                           // 교가비
    sign('교가비', -8.5, 1.95, -18.98, 0, 0.26);
    addBox(0.6, 5, 0.6, 0xdfe3e8, 16.5, 0, -19.2);                             // 탑시계
    addBox(1.5, 1.5, 0.34, 0xf5f6f8, 16.5, 4.7, -19.2, { collide: false });
    sign('12', 16.5, 5.45, -19.0, 0, 0.3);
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
  {   // 외벽 코발트 블루 띠 — 인식 포인트 1순위(실물 외벽=베이지 주조+파랑 띠+노랑 포인트+흰 파라펫)
    // ⚠️띠 끝을 벽 끝과 정확히 맞추면 x0가 같아져 감사에 걸린다 → 0.06 인셋
    const BLU = 0x4a6fa5, IN = 0.06;
    const bandX = (x0, x1, z, face, y) => addBox(x1-x0-IN*2, 0.55, 0.2, BLU, (x0+x1)/2, y, z + face*0.14, { collide: false });
    const bandZ = (z0, z1, x, face, y) => addBox(0.2, 0.55, z1-z0-IN*2, BLU, x + face*0.14, y, (z0+z1)/2, { collide: false });
    bandZ(wz0, wz1, wx0, -1, 2.65); bandZ(wz0, wz1, wx0, -1, 2.65 + FH);        // 서관 서면(1·2층)
    bandX(wx0, wx1, wz0, -1, 2.65); bandX(wx0, wx1, wz0, -1, 2.65 + FH);        // 서관 북면
    bandX(ex0, ex1, ez1, 1, 2.65);  bandX(ex0, ex1, ez0, -1, 2.65);             // 동관 남·북면
    bandZ(ez0, ez1, ex1, 1, 2.65);                                              // 동관 동면
    bandZ(kz0, kz1, kx0, -1, 3.2);  bandX(kx0, kx1, kz0, -1, 3.2);              // 급식동 서·북면
  }
  zones.push({ x0: fx0, x1: fx1, z0: fz0, z1: zCor, y: 0, label: '본관 복도' });
  zones.push({ x0: 0.65, x1: 11.65, z0: fz1, z1: -18.1, y: 0, label: '구령대' });
  zones.push({ x0: ex0 + 0.3, x1: ex1 - 0.3, z0: ez1 + 0.3, z1: fz0 - 0.3, y: 0, label: '가운데 마당' });
  zones.push({ x0: SCHOOL.playground.center[0]-7, x1: SCHOOL.playground.center[0]+7, z0: SCHOOL.playground.center[1]-5, z1: SCHOOL.playground.center[1]+5, y: -1, label: '놀이터' });
  zones.push({ x0: -52, x1: -44, z0: -13, z1: -7, y: -1, label: '유치원 놀이터' });
  zones.push({ x0: SCHOOL.garden.center[0]-4, x1: SCHOOL.garden.center[0]+4, z0: SCHOOL.garden.center[1]+3, z1: SCHOOL.garden.center[1]+4.5, y: 0, label: '텃밭' });
  zones.push({ x0: SCHOOL.field.center[0]-20, x1: SCHOOL.field.center[0]+20, z0: SCHOOL.field.center[1]-20, z1: SCHOOL.field.center[1]+20, y: -1, label: '운동장' });

  ceil(fx0, fx1, fz0, fz1, FH);                       // 본관
  [[fx0 + 0.16, LOB_X], [LC.x[0], LC.x[1]]].forEach(([a, b]) =>   // 벽 없는 경계의 천장 틈(맞댐 — 폭 정확히 0.32)
    flatBox(b - a, 0.15, 0.32, ceilMat, (a + b) / 2, FH - 0.16, fz0));
  ceil(wx0, wx1 - 4.6, wz0, wz1, FH);                 // 서관 1층(계단 구멍 제외)
  ceil(wx0, wx1, wz0, wz1, FH * 2);                   // 서관 2층
  ceil(kx0, 5.4, kz0, kz1, K.wallHeight);             // 급식동(세로복도 제외)
  ceil(ex0, ex1, ez0, ez1, FH);                       // 동관
  ceil(LC.x[0], LC.x[1], -58, fz0, FH);               // 세로복도
  ceil(gx0, gx1, gz0, gz1, G.wallHeight);             // 체육관

  // ================= 사람들 =================
  // 정적(청크 병합 — 드로우콜 0)·충돌 없음(길을 막지 않는다). ⚠️대사는 교사 승인분만 — 임의 생성 금지
  {
    const zoneOf = n => zones.find(z => z.label === n);
    function person(x, y, z, sex, s = 1) {
      const top = sex === '여' ? 0xe0708a : 0x4d7fd6, no = { collide: false };
      addBox(0.19*s, 0.55*s, 0.2*s, 0x2b3a55, x - 0.12*s, y, z, no);
      addBox(0.19*s, 0.55*s, 0.2*s, 0x2b3a55, x + 0.12*s, y, z, no);
      addBox(0.44*s, 0.5*s, 0.28*s, top, x, y + 0.55*s, z, no);
      addBox(0.34*s, 0.34*s, 0.34*s, 0xf1c9a0, x, y + 1.05*s, z, no);
      addBox(0.37*s, 0.19*s, 0.37*s, 0x3a2e28, x, y + 1.39*s, z, no);   // 머리카락은 머리 위에(파고들면 감사)
    }
    // 빈 자리 자동 탐색 — 방 안 격자에서 가구와 겹치지 않는 첫 자리(뒤쪽부터).
    // 사람도 allBoxes에 쌓이므로 다음 사람은 저절로 옆자리로 밀린다. 고정 좌표로 두면 의자·식탁에 박힌다(실제로 그랬음).
    function freeSpot(zn) {
      const y = zn.y ?? 0;
      const near = allBoxes.filter(b => b.x1 > zn.x0 && b.x0 < zn.x1 && b.z1 > zn.z0 && b.z0 < zn.z1
                                     && b.y0 < y + 1.6 && b.y1 > y + 0.05);
      for (let z = zn.z1 - 1.0; z > zn.z0 + 0.9; z -= 0.7)
        for (let x = zn.x0 + 1.0; x < zn.x1 - 0.9; x += 0.9)
          if (!near.some(b => b.x1 > x - 0.34 && b.x0 < x + 0.34 && b.z1 > z - 0.26 && b.z0 < z + 0.26))
            return [x, z];
      return null;
    }
    const place = (zn, nm, sex, s) => {
      const p = freeSpot(zn); if (!p) return;
      person(p[0], zn.y ?? 0, p[1], sex, s);
      sign(nm, p[0], (zn.y ?? 0) + 1.62 * s + 0.2, p[1], 0, 0.22);
    };
    Object.entries(SCHOOL.people).forEach(([cls, info]) => {
      const zn = zoneOf(cls); if (!zn) return;
      place(zn, cls + ' 선생님', info.t, 1.1);
      info.s.forEach(([nm, sx]) => place(zn, nm, sx, 1));
    });
    Object.entries(SCHOOL.staff).forEach(([room, list]) => {
      const zn = zoneOf(room); if (!zn) return;
      list.forEach(([nm, sx, sz]) => place(zn, nm, sx, sz === 'small' ? 0.8 : 1.1));
    });
  }

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
  return { colliders, grid, zones, doors, allBoxes, TERR_Z };
}
