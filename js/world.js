// 학교 월드 생성 — data.js 를 읽어 3D로 세움
// v0.7: 성능(공유 지오메트리·8m 격자·행렬 동결) + 사진 색감 + 상호작용 확장
//   체육관: 무대는 북쪽(입구에서 우측), 방송실·준비실·화장실 + 철문
//   급식실: 긴 식탁+빨간 둥근의자+배식대+커튼 무대, 도서관 앞 쿠션 로비
import * as THREE from 'three';
import { SCHOOL } from './data.js';
import { textSign, taegeukTexture, trackTexture, courtTexture, bookStripes } from './textures.js';

// ---- 공유 지오메트리/재질 (성능 예산: geometries 최소화) ----
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const M = {};
function mat(color) {
  if (!M[color]) M[color] = new THREE.MeshLambertMaterial({ color });
  return M[color];
}
const BASIC_WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });        // 형광등
const GLASS = new THREE.MeshLambertMaterial({ color: 0xcfe8f7, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
const GLASS_DOOR = new THREE.MeshLambertMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.45 });
const NET = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
const INVIS = new THREE.MeshBasicMaterial({ visible: false });
const CURTAIN = new THREE.MeshLambertMaterial({ color: 0x8a8f96 });

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWorld(scene) {
  const colliders = [];
  const walkables = [];
  const zones = [];
  const doors = [];
  const interactables = [];
  const npcs = new Map();          // '방이름:이름' → NPC 그룹 (캐릭터 선택 시 숨김)
  const dynamic = { flag: null, clouds: [] };
  const rng = mulberry32(20260728);

  // ---------- 공용 헬퍼 ----------
  function box(w, h, d, color, cx, baseY, cz, opt = {}) {
    const m = new THREE.Mesh(UNIT_BOX, opt.material || mat(color));
    m.scale.set(w, h, d);
    m.position.set(cx, baseY + h / 2, cz);
    if (opt.rot) m.rotation.set(opt.rot[0] || 0, opt.rot[1] || 0, opt.rot[2] || 0);
    scene.add(m);
    if (opt.collide !== false) colliders.push(m);
    if (opt.walk) walkables.push(m);
    return m;
  }
  const wallX = (x0, x1, z, y0, h, color, t = 0.3) => box(x1 - x0, h, t, color, (x0 + x1) / 2, y0, z);
  const wallZ = (z0, z1, x, y0, h, color, t = 0.3) => box(t, h, z1 - z0, color, x, y0, (z0 + z1) / 2);
  function wallXGaps(x0, x1, gaps, z, y0, h, color, t = 0.3) {
    let cur = x0;
    [...gaps].sort((a, b) => a.c - b.c).forEach(g => {
      const g0 = g.c - g.w / 2, g1 = g.c + g.w / 2;
      if (g0 > cur + 0.05) wallX(cur, g0, z, y0, h, color, t);
      cur = Math.max(cur, g1);
    });
    if (cur < x1 - 0.05) wallX(cur, x1, z, y0, h, color, t);
  }
  function wallZGaps(z0, z1, gaps, x, y0, h, color, t = 0.3) {
    let cur = z0;
    [...gaps].sort((a, b) => a.c - b.c).forEach(g => {
      const g0 = g.c - g.w / 2, g1 = g.c + g.w / 2;
      if (g0 > cur + 0.05) wallZ(cur, g0, x, y0, h, color, t);
      cur = Math.max(cur, g1);
    });
    if (cur < z1 - 0.05) wallZ(cur, z1, x, y0, h, color, t);
  }
  function plane(w, d, colorOrMat, x, y, z) {
    const m = new THREE.Mesh(UNIT_PLANE, typeof colorOrMat === 'number' ? mat(colorOrMat) : colorOrMat);
    m.scale.set(w, d, 1);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    scene.add(m);
    walkables.push(m);
    return m;
  }
  function sign(text, x, y, z, rotY = 0, h = 0.55) {
    const s = textSign(text, { h });
    s.position.set(x, y, z);
    s.rotation.y = rotY;
    scene.add(s);
    return s;
  }
  function windowPane(x, y, z, rotY, w = 1.8, h = 1.4) {
    const wm = new THREE.Mesh(UNIT_PLANE, mat(0xaed4ef));
    wm.scale.set(w, h, 1);
    wm.position.set(x, y, z);
    wm.rotation.y = rotY;
    scene.add(wm);
    return wm;
  }
  function lamp(x, y, z, alongX = true) {   // 형광등: 조명 대신 항상 밝은 박스
    box(alongX ? 1.7 : 0.22, 0.05, alongX ? 0.22 : 1.7, 0, x, y, z, { material: BASIC_WHITE, collide: false });
  }

  // 진짜 뚫린 창이 있는 벽: 창턱(0~1.1) + 상단(2.5~) + 창기둥 + 유리 + 투명 충돌
  function wallWindows(x0, x1, z, color, wins, y0 = 0, hTot = 3.4) {
    wallX(x0, x1, z, y0, 1.1, color);
    wallX(x0, x1, z, y0 + 2.5, hTot - 2.5, color);
    wallXGaps(x0, x1, wins, z, y0 + 1.1, 1.4, color);
    wins.forEach(g => {
      box(g.w, 1.4, 0.06, 0, g.c, y0 + 1.1, z, { material: GLASS, collide: false });
      box(g.w, 1.4, 0.24, 0, g.c, y0 + 1.1, z, { material: INVIS });
    });
  }

  // 여닫는 문 (E키). glass=외부 유리문(알루미늄 프레임+손잡이, 기본 닫힘)
  function makeDoor(hx, hz, w, axis, opts = {}) {
    const g = new THREE.Group();
    const pw = w - 0.12;
    const pm = opts.glass ? GLASS_DOOR : mat(opts.color || 0x9c6644);
    const panel = new THREE.Mesh(UNIT_BOX, pm);
    panel.scale.set(axis === 'x' ? pw : 0.07, 2.2, axis === 'x' ? 0.07 : pw);
    const off = pw / 2 + 0.03;
    if (axis === 'x') panel.position.x = off; else panel.position.z = off;
    panel.position.y = 1.1;
    g.add(panel);
    if (opts.glass) {
      // 알루미늄 프레임 + 중간 가로대 + 손잡이
      const alu = mat(0xb8bcc0);
      [[0.06, 2.2, 0.02], [pw, 0.08, 1.06], [pw, 0.08, 0.02], [pw, 0.06, 2.16]].forEach(([lw, lh, ly], i) => {
        const bar = new THREE.Mesh(UNIT_BOX, alu);
        if (axis === 'x') { bar.scale.set(i === 0 ? 0.1 : lw, lh, 0.1); bar.position.set(off, ly, 0); }
        else { bar.scale.set(0.1, lh, i === 0 ? 0.1 : lw); bar.position.set(0, ly, off); }
        g.add(bar);
      });
      const handle = new THREE.Mesh(UNIT_BOX, mat(0x555b62));
      if (axis === 'x') { handle.scale.set(0.5, 0.06, 0.12); handle.position.set(off + pw * 0.28, 1.05, 0.1); }
      else { handle.scale.set(0.12, 0.06, 0.5); handle.position.set(0.1, 1.05, off + pw * 0.28); }
      g.add(handle);
    }
    g.position.set(hx, opts.y || 0, hz);
    scene.add(g);
    const d = {
      x: axis === 'x' ? hx + w / 2 : hx,
      z: axis === 'x' ? hz : hz + w / 2,
      y: opts.y || 0,
      group: g,
      open: opts.glass ? false : true,
      openRot: (opts.swing || 1) * 1.5,
      aabb: axis === 'x'
        ? { minX: hx + 0.03, maxX: hx + w - 0.03, minY: (opts.y || 0), maxY: (opts.y || 0) + 2.2, minZ: hz - 0.1, maxZ: hz + 0.1 }
        : { minX: hx - 0.1, maxX: hx + 0.1, minY: (opts.y || 0), maxY: (opts.y || 0) + 2.2, minZ: hz + 0.03, maxZ: hz + w - 0.03 },
    };
    g.rotation.y = d.open ? d.openRot : 0;
    doors.push(d);
    return d;
  }

  // 사람 NPC — E키로 말걸기 가능
  const SHIRTS = [0xe8863a, 0x67b26f, 0x4d9bd6, 0xd94f6b, 0xf2b134, 0x8e6fc9, 0x3aa8a0];
  const HAIRS = [0x3a2e28, 0x241d18, 0x4e3b2a];
  function person(x, y, z, yaw, name, girl, opts = {}) {
    const g = new THREE.Group();
    const sc = opts.teacher ? 1.12 : 0.88;
    const shirtM = mat(opts.teacher ? (girl ? 0xc76b8e : 0x4a6fa5) : SHIRTS[Math.floor(rng() * SHIRTS.length)]);
    const pantsM = mat(0x5a6b8c);
    const skinM = mat(0xf6cfa4);
    const hairM = mat(HAIRS[Math.floor(rng() * HAIRS.length)]);
    [[0.11], [-0.11]].forEach(([lx]) => {
      const leg = new THREE.Mesh(UNIT_BOX, pantsM);
      leg.scale.set(0.16, 0.5, 0.19);
      leg.position.set(lx, 0.25, 0);
      g.add(leg);
    });
    const body = new THREE.Mesh(UNIT_BOX, shirtM);
    body.scale.set(0.5, 0.55, 0.3);
    body.position.y = 0.775;
    g.add(body);
    [[0.31], [-0.31]].forEach(([axp]) => {
      const arm = new THREE.Mesh(UNIT_BOX, shirtM);
      arm.scale.set(0.13, 0.5, 0.15);
      arm.position.set(axp, 0.78, 0);
      g.add(arm);
    });
    const head = new THREE.Mesh(UNIT_BOX, skinM);
    head.scale.set(0.5, 0.48, 0.46);
    head.position.y = 1.3;
    g.add(head);
    const hairTop = new THREE.Mesh(UNIT_BOX, hairM);
    hairTop.scale.set(0.54, 0.15, 0.5);
    hairTop.position.y = 1.58;
    g.add(hairTop);
    if (girl) {
      const hairBack = new THREE.Mesh(UNIT_BOX, hairM);
      hairBack.scale.set(0.54, 0.55, 0.12);
      hairBack.position.set(0, 1.28, -0.26);
      g.add(hairBack);
    }
    const tag = textSign(name, { h: 0.26, fontPx: 36, pad: 12 });
    tag.position.y = 1.95;
    g.add(tag);
    g.scale.setScalar(sc);
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    scene.add(g);
    interactables.push({ type: 'person', x, y, z, name, group: g, lines: opts.lines || null, li: 0 });
    return g;
  }

  // ---------- 하늘/땅 ----------
  const ground = new THREE.Mesh(UNIT_PLANE, mat(0x7cb85c));
  ground.scale.set(320, 240, 1);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  walkables.push(ground);

  // ---------- 본관 ----------
  const B = SCHOOL.building;
  const FH = B.floorHeight;
  const wallC = B.wallColor;
  const roofC = B.roofColor;
  const innerC = 0xfaf3e3;
  const slabC = 0xd9d2c2;
  const wainC = 0xbcd9a5, railC = 0xc98a5b;

  const FR = B.front;
  const [fx0, fx1] = FR.x;
  const [fz0, fz1] = FR.z;
  const zCor = fz0 + FR.corridorDepth;
  const doorCOf = r => r.span[0] + 1.9;

  function roofOver(x0, x1, z0, z1, y, color) {
    box(x1 - x0 + 0.6, 0.25, z1 - z0 + 0.6, color, (x0 + x1) / 2, y - 0.25, (z0 + z1) / 2);
    wallX(x0, x1, z1 + 0.15, y, 0.55, color, 0.25);
    wallX(x0, x1, z0 - 0.15, y, 0.55, color, 0.25);
    wallZ(z0, z1, x0 - 0.15, y, 0.55, color, 0.25);
    wallZ(z0, z1, x1 + 0.15, y, 0.55, color, 0.25);
  }
  const lintelX = (c, w, z, color, y0 = 0) => wallX(c - w / 2, c + w / 2, z, y0 + 2.2, FH - 2.2, color);
  const lintelZ = (c, w, x, color, y0 = 0) => wallZ(c - w / 2, c + w / 2, x, y0 + 2.2, FH - 2.2, color);

  // ---- 책상+의자 ----
  function deskChair(x, y0, z, monitor) {
    box(0.5, 0.06, 0.64, 0xdeb877, x, y0 + 0.62, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x - 0.2, y0, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x + 0.2, y0, z, { collide: false });
    box(0.5, 0.68, 0.64, 0, x, y0, z, { material: INVIS });
    let scr = null;
    if (monitor) {
      box(0.34, 0.5, 0.44, 0xb5713d, x, y0 + 0.68, z, { collide: false });
      scr = new THREE.Mesh(UNIT_PLANE, new THREE.MeshBasicMaterial({ color: 0x1a2b30 }));
      scr.scale.set(0.55, 0.4, 1);
      scr.position.set(x + 0.12, y0 + 1.15, z);
      scr.rotation.y = Math.PI / 2;
      scene.add(scr);
      box(0.06, 0.5, 0.66, 0x22262c, x + 0.22, y0 + 0.68, z, { collide: false });
    }
    const chX = x + 0.62;
    box(0.4, 0.05, 0.4, 0xd9a066, chX, y0 + 0.4, z, { collide: false });
    box(0.06, 0.5, 0.4, 0xd9a066, chX + 0.17, y0 + 0.45, z, { collide: false });
    [[-0.15, -0.15], [-0.15, 0.15], [0.15, -0.15], [0.15, 0.15]].forEach(([ox, oz]) =>
      box(0.04, 0.4, 0.04, 0x8a949c, chX + ox, y0, z + oz, { collide: false }));
    interactables.push({ type: 'chair', x: chX, y: y0, z, yaw: -Math.PI / 2 });
    return scr;
  }

  // ---- 방 가구 ----
  function furnish(r, cx, cw, y0, zB, dir, depth) {
    const at = o => zB + dir * o;
    const faceIn = dir > 0 ? 0 : Math.PI;
    const s0 = cx - cw / 2, s1 = cx + cw / 2;
    const zMid = zB + dir * depth / 2;
    const classy = r.type === 'classroom' || r.type === 'computer' || r.type === 'science';
    if (classy) {
      const bw = Math.min(depth - 2.5, 4);
      const frame = new THREE.Mesh(UNIT_PLANE, mat(0x9aa5ad));
      frame.scale.set(bw + 0.2, 1.4, 1);
      frame.position.set(s0 + 0.17, y0 + 1.7, zMid);
      frame.rotation.y = Math.PI / 2;
      scene.add(frame);
      const board = new THREE.Mesh(UNIT_PLANE, mat(0xf7f8f9));
      board.scale.set(bw, 1.25, 1);
      board.position.set(s0 + 0.2, y0 + 1.7, zMid);
      board.rotation.y = Math.PI / 2;
      scene.add(board);
      box(0.12, 0.06, bw, 0xc8ccd0, s0 + 0.28, y0 + 1.02, zMid, { collide: false });
      box(0.05, 0.6, 0.05, 0x30343a, s0 + 0.6, y0 + 2.55, zMid + dir * (bw / 2 + 1), { collide: false });
      box(0.07, 0.72, 1.3, 0x22262c, s0 + 0.65, y0 + 1.85, zMid + dir * (bw / 2 + 1), { collide: false });
      const bulPal = [0xf2a6b8, 0xf6c67a, 0x8fd0a8, 0x9bc1e8, 0xc9aee5, 0xf4b8a0];
      const bul = new THREE.Mesh(UNIT_PLANE, mat(bulPal[Math.floor(rng() * bulPal.length)]));
      bul.scale.set(1.4, 1.05, 1);
      bul.position.set(s0 + 0.17, y0 + 1.7, zMid - dir * (bw / 2 + 1.1));
      bul.rotation.y = Math.PI / 2;
      scene.add(bul);
      box(1.3, 0.74, 0.7, 0xb0a18e, s0 + 1.5, y0, zB + dir * 1.3);
      box(0.45, 1.5, Math.min(depth - 3, 5), 0xc9a06a, s1 - 0.45, y0, zMid);
      lamp(s0 + cw * 0.38, y0 + FH - 0.12, zMid);
      lamp(s0 + cw * 0.72, y0 + FH - 0.12, zMid);
      // 책상 수 = 학생 수 + 1 (명단 없으면 4)
      const nx = Math.max(2, Math.min(3, Math.floor((cw - 4) / 1.9) + 1));
      const nz = Math.max(2, Math.min(4, Math.floor((depth - 3) / 1.7)));
      const ppl = SCHOOL.people && SCHOOL.people[r.name];
      const nSeat = Math.min(nx * nz, ppl ? ppl.s.length + 1 : 4);
      const seats = [];
      for (let k = 0; k < nSeat; k++) {
        const i = Math.floor(k / nz), j = k % nz;
        const dx = s0 + 3.1 + i * 1.9;
        const dz = zMid + (j - (nz - 1) / 2) * 1.7;
        const scr = deskChair(dx, y0, dz, r.type === 'computer');
        if (scr) interactables.push({ type: 'computer', x: dx, y: y0, z: dz, mesh: scr });
        seats.push([dx, dz]);
      }
      if (ppl) {
        ppl.s.forEach(([nm, gd], k) => {
          if (k < seats.length) {
            const g = person(seats[k][0] + 1.15, y0, seats[k][1], -Math.PI / 2, nm, gd === '여',
              { lines: ppl.lines && ppl.lines[nm] });
            npcs.set(`${r.name}:${nm}`, g);
          }
        });
        person(s0 + 2.4, y0, zMid + dir * (depth / 2 - 1.6), Math.PI / 2, '선생님', ppl.t === '여',
          { teacher: true, lines: ppl.lines && ppl.lines['선생님'] });
      }
      return;
    }
    lamp(cx, y0 + FH - 0.12, zMid);
    if (r.type === 'daycare') {
      [[-1.6, 3.4, 0xf6c67a], [1.5, 5.6, 0x8fd0a8]].forEach(([ox, oz, tc]) => {
        box(1.7, 0.52, 1.7, tc, cx + ox, y0, at(oz));
        [[-1.05, 0], [1.05, 0], [0, -1.05], [0, 1.05]].forEach(([qx, qz]) =>
          box(0.38, 0.3, 0.38, 0xe8863a, cx + ox + qx, y0, at(oz) + qz));
      });
      plane(2.6, 1.9, 0xf2a6b8, cx + 0.9, y0 + 0.02, at(1.6));
      box(2, 1.1, 0.45, 0xd9a066, cx - cw / 2 + 1.3, y0, at(0.7));
      [0xe3453a, 0x4d9bd6, 0xf2b134].forEach((tc, i) =>
        box(0.3, 0.3, 0.3, tc, cx - cw / 2 + 0.7 + i * 0.55, y0 + 1.1, at(0.7), { collide: false }));
      box(1.6, 0.74, 0.7, 0xdeb877, cx + cw / 2 - 1.3, y0, at(depth - 2));
    } else if (r.type === 'office') {
      const nDesk = Math.max(1, Math.round(cw / 2.2) - 1);
      for (let i = 0; i < nDesk; i++) {
        box(1.3, 0.74, 0.7, 0xb0a18e, cx + (i - (nDesk - 1) / 2) * 1.7, y0, at(4.2));
      }
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 10), mat(0xa5673f));
      pot.position.set(cx + cw / 2 - 0.7, y0 + 0.2, at(1));
      scene.add(pot); colliders.push(pot);
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(0x4d8b4d));
      leaf.position.set(cx + cw / 2 - 0.7, y0 + 0.85, at(1));
      scene.add(leaf);
    } else if (r.type === 'nurse') {
      [0, 1].forEach(i => {
        box(1.05, 0.5, 1.95, 0xf2f5f7, cx - 1 + i * 2, y0, at(2.5));
        box(0.6, 0.14, 0.35, 0xdfe8ee, cx - 1 + i * 2, y0 + 0.5, at(1.7), { collide: false });
      });
      box(0.9, 1.6, 0.45, 0xe8edf2, cx + Math.min(1.6, cw / 2 - 0.75), y0, at(0.6));
    } else if (r.type === 'cafeteria') {
      // 급식실 사진: 긴 식탁 + 빨간 둥근의자 + 배식대(스테인리스)
      const colXs = cw >= 12 ? [cx - 2.4, cx + 2.6] : [cx];
      const rowZs = [zMid - 3, zMid, zMid + 3];
      colXs.forEach(tx => rowZs.forEach(tz => {
        box(3.2, 0.08, 0.7, 0xb5713d, tx, y0 + 0.66, tz);
        [[-1.4, -0.28], [1.4, -0.28], [-1.4, 0.28], [1.4, 0.28]].forEach(([ox, oz]) =>
          box(0.06, 0.66, 0.06, 0xe8ebee, tx + ox, y0, tz + oz, { collide: false }));
        [-1.05, 0, 1.05].forEach(ox => [-0.66, 0.66].forEach(oz => {
          const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 10), mat(0xd94848));
          seat.position.set(tx + ox, y0 + 0.45, tz + oz);
          scene.add(seat);
          box(0.05, 0.44, 0.05, 0xe8ebee, tx + ox, y0, tz + oz, { collide: false });
          interactables.push({ type: 'chair', x: tx + ox, y: y0, z: tz + oz, yaw: oz < 0 ? 0 : Math.PI, msg: '맛있게 먹자! 🍚' });
        }));
      }));
      // 배식대 (서쪽) + 음식
      box(1.1, 0.9, 5, 0xc4c9cd, s0 + 1.3, y0, zMid + 1);
      [[0xf5f2ea, -0.8], [0x8a5a30, 0.2], [0x67b26f, 1.2], [0xd0392e, 2.2]].forEach(([fc, oz]) =>
        box(0.5, 0.12, 0.6, fc, s0 + 1.3, y0 + 0.9, zMid + oz, { collide: false }));
      box(0.5, 0.3, 0.5, 0x3f9c5a, s0 + 1.3, y0 + 0.9, zMid - 1.6, { collide: false });  // 식판 더미
    } else if (r.type === 'library') {
      const books = new THREE.MeshLambertMaterial({ map: bookStripes() });
      const sSpread = Math.min(2.4, (cw - 2.2) / 2);
      for (let i = 0; i < 3; i++) {
        const sx = cx + (i - 1) * sSpread;
        box(2, 2.05, 0.5, 0x8b5e34, sx, y0, at(0.8));
        [0.6, 1.25, 1.85].forEach(by => {
          const strip = new THREE.Mesh(UNIT_PLANE, books);
          strip.scale.set(1.8, 0.42, 1);
          strip.position.set(sx, y0 + by, at(0.8) + dir * 0.27);
          strip.rotation.y = faceIn;
          scene.add(strip);
        });
      }
      box(2.2, 0.72, 1.1, 0xdeb877, cx, y0, at(4.6));
      if (cw >= 8.5) box(2.2, 0.72, 1.1, 0xdeb877, cx - 2.8, y0, at(4.6));
    } else if (r.type === 'toilet') {
      // 남|여 칸막이는 뒷벽~복도벽까지 꽉 채움 (연결 버그 픽스)
      const zA = Math.min(zB, at(depth)), zBt = Math.max(zB, at(depth));
      wallZ(zA, zBt, cx, y0, FH, 0xdfe8ee, 0.15);
      [-1, 1].forEach(s => {
        for (let k = 0; k < 2; k++) {
          box(0.95, 1.4, 0.95, 0xe8edf2, cx + s * (0.85 + k * 1.15), y0, at(0.75));
          box(0.06, 1.4, 0.95, 0xd2dbe2, cx + s * (0.85 + k * 1.15) - 0.5, y0, at(0.75), { collide: false });
        }
        box(0.5, 0.8, 0.45, 0xf2f5f7, cx + s * 1.2, y0, at(depth - 2.2));
      });
    } else if (r.type === 'storage') {
      box(1.2, 1.0, 0.9, 0x9c7a53, cx - cw / 2 + 1.1, y0, at(1.0));
      box(0.9, 0.7, 0.8, 0xb08a5e, cx - cw / 2 + 1.05, y0 + 1.0, at(1.05), { collide: false });
      box(1.1, 0.9, 0.9, 0x8a6a45, cx + cw / 2 - 1.1, y0, at(1.2));
      box(1.4, 0.5, 0.6, 0x9c7a53, cx, y0, at(0.7));
    }
  }

  // ---- 바닥판 ----
  box(fx1 - fx0 + 2, 0.08, fz1 - fz0 + 2, 0xcfc8ba, (fx0 + fx1) / 2, 0, (fz0 + fz1) / 2, { collide: false, walk: true });
  B.wings.forEach(wg => {
    box(wg.x[1] - wg.x[0] + 1, 0.08, wg.z[1] - wg.z[0], 0xcfc8ba, (wg.x[0] + wg.x[1]) / 2, 0, (wg.z[0] + wg.z[1]) / 2, { collide: false, walk: true });
  });
  const K = B.kitchen, LC = B.linkCorridor, E = B.eastWing;
  const [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  const [ex0, ex1] = E.x, [ez0, ez1] = E.z;
  const zCorE = ez0 + E.corridorDepth;
  box(kx1 - kx0 + 1, 0.08, kz1 - kz0, 0xcfc8ba, (kx0 + kx1) / 2, 0, (kz0 + kz1) / 2, { collide: false, walk: true });
  box(LC.x[1] - LC.x[0], 0.08, kz1 - ez0, 0xcfc8ba, (LC.x[0] + LC.x[1]) / 2, 0, (ez0 + kz1) / 2, { collide: false, walk: true });
  box(ex1 - ex0 + 1, 0.08, ez1 - ez0, 0xcfc8ba, (ex0 + ex1) / 2, 0, (ez0 + ez1) / 2, { collide: false, walk: true });
  box(fx1 - fx0 + 8, 0.06, 6, 0xd8d2c6, (fx0 + fx1) / 2, 0, fz1 + 3, { collide: false, walk: true });

  // ---- 앞줄 ----
  const hallRoom = FR.rooms.find(r => r.type === 'hall');
  const hallCx = (hallRoom.span[0] + hallRoom.span[1]) / 2;
  // 서/동 외벽 + 주복도 양끝 유리문(빨강)
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 1.8 }], fx0, 0, FH, wallC);
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 1.8 }], fx1, 0, FH, wallC);
  lintelZ(FR.corridorExitZ, 1.8, fx0, wallC);
  lintelZ(FR.corridorExitZ, 1.8, fx1, wallC);
  makeDoor(fx0, FR.corridorExitZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  makeDoor(fx1, FR.corridorExitZ - 0.9, 1.8, 'z', { glass: true, swing: -1 });
  // 복도 북벽
  const northGaps = [];
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly) return;
    northGaps.push({ c: r.type === 'stair' ? (r.span[0] + r.span[1]) / 2 : doorCOf(r), w: r.type === 'stair' ? 2.4 : 1.8 });
  }));
  northGaps.push({ c: K.dutyRoom.doorC, w: 1.6 });
  northGaps.push({ c: K.doorC, w: 2.4 });
  northGaps.push({ c: (LC.x[0] + LC.x[1]) / 2, w: LC.x[1] - LC.x[0], noLintel: true });
  wallXGaps(fx0, fx1, northGaps, fz0, 0, FH, innerC);
  wallXGaps(fx0, fx1, northGaps, fz0, 0, 0.95, wainC, 0.34);
  northGaps.forEach(g => { if (!g.noLintel) lintelX(g.c, g.w, fz0, innerC); });
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly || r.type === 'stair') return;
    makeDoor(doorCOf(r) - 0.9, fz0, 1.8, 'x', { swing: 1 });
  }));
  makeDoor(K.dutyRoom.doorC - 0.8, fz0, 1.6, 'x', { swing: 1 });
  makeDoor(K.doorC - 1.2, fz0, 2.4, 'x', { swing: 1 });
  // 주복도 동측 북벽(마당쪽) 큰 창 + 복도 형광등
  for (let wx = ex0 + 1.6; wx < fx1 - 1.2; wx += 3.2) {
    windowPane(wx, 1.9, fz0 - 0.18, Math.PI, 2.4, 1.6);
    windowPane(wx, 1.9, fz0 + 0.18, 0, 2.4, 1.6);
  }
  for (let lx = fx0 + 3; lx < fx1 - 1; lx += 6) lamp(lx, FH - 0.12, (fz0 + zCor) / 2);

  // 앞줄 방들
  const frontEdges = new Set();
  FR.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    frontEdges.add(s0); frontEdges.add(s1);
    if (r.type === 'hall') {
      // 현관 정면: 유리문 + 옆벽
      wallXGaps(s0, s1, [{ c: hallCx, w: 3.2 }], fz1, 0, FH, wallC);
      lintelX(hallCx, 3.2, fz1, wallC);
      makeDoor(hallCx - 1.6, fz1, 3.2, 'x', { glass: true, swing: 1 });
    } else {
      // 남쪽 벽: 진짜 뚫린 창 (하늘색 표시 — 안팎이 보임)
      const wins = cw < 6
        ? [{ c: cx, w: Math.min(2.4, cw - 1.6) }]
        : [{ c: cx - cw / 4, w: 2.1 }, { c: cx + cw / 4, w: 2.1 }];
      wallWindows(s0, s1, fz1, wallC, wins, 0, FH);
      const gaps = r.type === 'toilet'
        ? [{ c: s0 + cw * 0.25, w: 1.6 }, { c: s0 + cw * 0.75, w: 1.6 }]
        : [{ c: doorCOf(r), w: 1.8 }];
      wallXGaps(s0, s1, gaps, zCor, 0, FH, innerC);
      gaps.forEach(gp => { lintelX(gp.c, gp.w, zCor, innerC); makeDoor(gp.c - gp.w / 2, zCor, gp.w, 'x', { swing: -1 }); });
      // 팻말은 문 바로 위 (교실은 "1반" 표기)
      const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
      if (r.type === 'toilet') {
        sign('남자 화장실', gaps[0].c, 2.42, zCor - 0.18, 0, 0.4);
        sign('여자 화장실', gaps[1].c, 2.42, zCor - 0.18, 0, 0.4);
      } else {
        sign(label, gaps[0].c, 2.42, zCor - 0.18, 0, 0.45);
      }
      furnish(r, cx, cw, 0, fz1, -1, fz1 - zCor);
      wallXGaps(s0, s1, gaps, zCor, 0, 0.95, wainC, 0.34);
      [[s0, gaps[0].c - 1], [gaps[gaps.length - 1].c + 1, s1]].forEach(([a, b]) => {
        if (b - a > 0.8) box(b - a - 0.3, 0.07, 0.06, railC, (a + b) / 2, 0.78, zCor - 0.21, { collide: false });
      });
      [s0 + cw * 0.55, s0 + cw * 0.85].forEach(wxp => windowPane(wxp, 2.35, zCor - 0.17, Math.PI, 1.3, 0.9));
    }
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, floor: 0, label: r.type === 'hall' ? '현관' : `본관 1층 · ${r.name}` });
  });
  [...frontEdges].filter(x => x > fx0 + 0.01 && x < fx1 - 0.01)
    .forEach(x => wallZ(zCor, fz1, x, 0, FH, innerC));
  zones.push({ x0: fx0, x1: fx1, z0: fz0, z1: zCor, floor: 0, label: '본관 1층 복도' });
  roofOver(fx0, fx1, fz0, fz1, FH, roofC);

  sign(SCHOOL.name, hallCx, FH + 1.1, fz1 + 0.35, 0, 1.2);
  box(5, 0.2, 2.6, 0x9aa5ad, hallCx, 3.0, fz1 + 1.25, { collide: false });
  [-2.1, 2.1].forEach(px => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 8), mat(0x8a949c));
    pole.position.set(hallCx + px, 1.5, fz1 + 2.3);
    scene.add(pole);
  });
  sign('현관', hallCx, 2.55, fz1 + 2.42, 0, 0.45);
  // 현관 게시판 (사진3: 꿈은 이루어진다)
  box(0.06, 1.15, 0.85, 0xc9526b, hallRoom.span[1] - 0.15, 1.1, -27, { collide: false });
  const poster1 = textSign('꿈은 이루어진다 ⭐', { h: 0.2, bg: '#ffe9ee', fg: '#c9526b', fontPx: 36, pad: 12 });
  poster1.position.set(hallRoom.span[1] - 0.1, 1.55, -27);
  poster1.rotation.y = Math.PI / 2;
  scene.add(poster1);

  // ---- 서관 ----
  B.wings.forEach(wg => {
    const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
    const totalH = wg.twoStory ? FH * 2 : FH;
    wallX(wx0, wx1, wz0, 0, totalH, wallC);
    wallZ(wz0, wz1, wx0, 0, totalH, wallC);
    wallZ(wz0, wz1, wx1, 0, totalH, wallC);
    if (totalH > FH) wallX(wx0, wx1, wz1, FH, totalH - FH, wallC);
    const edges = new Set();
    wg.rooms.forEach(r => {
      const [s0, s1] = r.span;
      const cx = (s0 + s1) / 2, cw = s1 - s0;
      edges.add(s0); edges.add(s1);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: wz1, floor: 0, label: `본관 1층 · ${r.name}` });
      if (r.type !== 'stair') {
        furnish(r, cx, cw, 0, wz0, 1, wz1 - wz0);
        [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, 1.8, wz0 - 0.18, Math.PI, 2.2, 1.5));
      }
      if (r.type !== 'stair' && !r.innerOnly) {
        const nm = r.name === '도서실' ? '슬기샘 도서관' : r.name;
        sign(nm, doorCOf(r), 2.42, wz1 + 0.18, 0, 0.45);
        [s0 + cw * 0.55, s0 + cw * 0.85].forEach(wxp => windowPane(wxp, 2.35, wz1 + 0.17, 0, 1.3, 0.9));
      }
      if (r.innerOnly) sign(r.name, s0 - 0.18, 2.2, (wz0 + wz1) / 2, Math.PI / 2, 0.4);
    });
    const innerDoorX = new Set(wg.rooms.filter(r => r.innerOnly).map(r => r.span[0]));
    [...edges].filter(x => x > wx0 + 0.01 && x < wx1 - 0.01)
      .forEach(x => {
        if (innerDoorX.has(x)) wallZGaps(wz0, wz1, [{ c: (wz0 + wz1) / 2, w: 1.4 }], x, 0, FH, innerC);
        else wallZ(wz0, wz1, x, 0, FH, innerC);
      });
  });
  // 도서관 앞 로비 (사진1: 쿠션 의자 + 기둥 원형 소파)
  [0xe8863a, 0x67b26f, 0xe8863a, 0x67b26f].forEach((cc, i) =>
    box(0.6, 0.42, 0.6, cc, -23.6 + i * 0.85, 0, -37.55, { walk: true }));
  const colPole = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.6, 10), mat(0xf2ede2));
  colPole.position.set(-18.6, 1.6, -36.6);
  scene.add(colPole);
  const colWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 1.0, 10), mat(0xe8863a));
  colWrap.position.set(-18.6, 0.95, -36.6);
  scene.add(colWrap);
  const colSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.42, 12), mat(0xf2c94c));
  colSeat.position.set(-18.6, 0.21, -36.6);
  scene.add(colSeat); colliders.push(colSeat);

  // ---- 급식동 + 당직실 ----
  const kh = K.wallHeight;
  wallX(kx0, kx1, kz0, 0, kh, wallC);
  wallZ(kz0, kz1, kx0, 0, kh, wallC);
  wallZ(kz0, kz1, kx1, 0, kh, wallC);
  wallX(kx0, kx1, kz1, FH, kh - FH, wallC);
  roofOver(kx0, kx1, kz0, kz1, kh, K.roofColor);
  const kcx = (kx0 + kx1) / 2, kzc = (kz0 + kz1) / 2;
  plane(kx1 - kx0 - 0.7, kz1 - kz0 - 0.7, 0xe8e6df, kcx, 0.03, kzc);   // 테라조 바닥
  furnish({ type: 'cafeteria' }, kcx, kx1 - kx0, 0, kz0, 1, kz1 - kz0);
  // 북쪽 끝 작은 무대 + 회색 커튼 (사진2)
  box(10, 0.5, 1.8, 0x9c8a76, kcx, 0, kz0 + 1.3, { walk: true });
  box(9.6, 2.8, 0.1, 0, kcx, 0.5, kz0 + 0.55, { material: CURTAIN, collide: false });
  [0, 1, 2].forEach(i => lamp(kcx - 4 + i * 4, kh - 0.15, kzc, true));
  sign('급식실', K.doorC + 1.7, 2.42, fz0 + 0.18, 0, 0.45);
  for (let wx = kx0 + 2.5; wx < kx1 - 1.5; wx += 4) windowPane(wx, 3.1, kz0 - 0.18, Math.PI, 2, 1);
  zones.push({ x0: kx0, x1: kx1, z0: kz0, z1: kz1, floor: 0, label: '본관 1층 · 급식실' });
  const D = K.dutyRoom;
  wallX(D.x[0], D.x[1], D.z[0], 0, FH, innerC);
  wallZ(D.z[0], D.z[1], D.x[1], 0, FH, innerC);
  sign('당직실', D.doorC + 1.2, 2.42, fz0 + 0.18, 0, 0.4);
  box(1.3, 0.74, 0.7, 0xb0a18e, (D.x[0] + D.x[1]) / 2, 0, D.z[0] + 1.2);
  box(1.05, 0.5, 1.95, 0xf2f5f7, D.x[1] - 0.8, 0, (D.z[0] + D.z[1]) / 2);
  zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], floor: 0, label: '본관 1층 · 당직실' });

  // ---- 세로복도 ----
  wallZGaps(ez1, kz1, [{ c: LC.yardDoorZ, w: 1.8 }], LC.x[1], 0, FH, wallC);
  lintelZ(LC.yardDoorZ, 1.8, LC.x[1], wallC);
  makeDoor(LC.x[1], LC.yardDoorZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  windowPane(LC.x[1] + 0.18, 1.9, -43.2, Math.PI / 2, 1.4, 1.4);
  wallZ(ez0, kz0, LC.x[0], 0, FH, wallC);
  roofOver(LC.x[0], LC.x[1], ez1, kz1, FH, roofC);
  [-52, -47, -42].forEach(lz => lamp(6.9, FH - 0.12, lz, false));
  zones.push({ x0: LC.x[0], x1: LC.x[1], z0: ez0, z1: kz1, floor: 0, label: '본관 1층 복도' });

  // ---- 동관 ----
  const shed = E.rooms.find(r => r.external);
  const shedC = shed ? (shed.span[0] + shed.span[1]) / 2 : null;
  wallXGaps(LC.x[0], ex1, shed ? [{ c: shedC, w: 1.8 }] : [], ez0, 0, FH, wallC);
  if (shed) {
    lintelX(shedC, 1.8, ez0, wallC);
    makeDoor(shedC - 0.9, ez0, 1.8, 'x', { glass: true, swing: -1 });
    sign(shed.name, shedC, 2.4, ez0 - 0.25, Math.PI, 0.45);
  }
  for (let wx = LC.x[0] + 2; wx < (shed ? shed.span[0] : ex1) - 1.5; wx += 3.5) {
    windowPane(wx, 1.9, ez0 - 0.18, Math.PI, 2.2, 1.5);
    windowPane(wx, 1.9, ez0 + 0.18, 0, 2.2, 1.5);
  }
  wallZ(ez0, ez1, ex1, 0, FH, wallC);   // 동 외벽 (바깥문 없음 — 빨강 표시에 없음)
  wallX(ex0, ex1, ez1, 0, FH, wallC);
  wallZ(zCorE, ez1, ex0, 0, FH, wallC);
  const eGaps = E.rooms.filter(r => !r.external).map(r => ({ c: doorCOf(r), w: 1.8 }));
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, FH, innerC);
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, 0.95, wainC, 0.34);
  eGaps.forEach(g => lintelX(g.c, g.w, zCorE, innerC));
  for (let lx = ex0 + 3; lx < ex1 - 1; lx += 6) lamp(lx, FH - 0.12, (ez0 + zCorE) / 2);
  const eEdges = new Set();
  E.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    eEdges.add(s0); eEdges.add(s1);
    if (!r.external) {
      const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
      sign(label, doorCOf(r), 2.42, zCorE - 0.18, 0, 0.45);
      makeDoor(doorCOf(r) - 0.9, zCorE, 1.8, 'x', { swing: -1 });
      [s0 + cw * 0.55, s0 + cw * 0.85].forEach(wxp => windowPane(wxp, 2.35, zCorE - 0.17, Math.PI, 1.3, 0.9));
    }
    furnish(r, cx, cw, 0, ez1, -1, ez1 - zCorE);
    [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, 1.75, ez1 + 0.18, 0, 2.2, 1.6));
    zones.push({ x0: s0, x1: s1, z0: zCorE, z1: ez1, floor: 0, label: `본관 1층 · ${r.name}` });
  });
  [...eEdges].filter(x => x > ex0 + 0.01 && x < ex1 - 0.01)
    .forEach(x => wallZ(zCorE, ez1, x, 0, FH, innerC));
  roofOver(LC.x[0], ex1, ez0, ez1, FH, roofC);
  zones.push({ x0: ex0, x1: ex1, z0: ez0, z1: zCorE, floor: 0, label: '본관 1층 복도' });
  zones.push({ x0: ex0, x1: fx1, z0: ez1, z1: fz0, label: '마당' });
  tree(14, -41.2, 0.75);
  tree(33, -41.2, 0.85);

  // ---- 2층 ----
  const westWing = B.wings.find(w => w.twoStory);
  const [ux0, ux1] = westWing.x, [uz0, uz1] = westWing.z;
  const stairRoom = westWing.rooms.find(r => r.type === 'stair');
  const [tx0, tx1] = stairRoom.span;
  const zCor2 = uz1 - B.upper.corridorDepth;
  const wkX = tx0 + 1.5;
  box(wkX - ux0, 0.25, uz1 - uz0, slabC, (ux0 + wkX) / 2, FH - 0.25, (uz0 + uz1) / 2, { walk: true });
  box(tx1 - wkX, 0.25, 2.5, slabC, (wkX + tx1) / 2, FH - 0.25, uz0 + 1.25, { walk: true });
  const stepLo = uz1 - 1, stepHi = uz0 + 2.5;
  const nStep = 12;
  const rise = FH / nStep, tread = (stepLo - stepHi) / nStep;
  for (let i = 0; i < nStep; i++) {
    box(tx1 - wkX - 0.2, (i + 1) * rise, tread + 0.03, 0xc9b8a0, (wkX + tx1) / 2, 0, stepLo - (i + 0.5) * tread);
  }
  wallZ(stepHi, uz1, wkX, FH, 1.05, 0xb08968, 0.12);
  sign('2층 ↑', (tx0 + tx1) / 2, 2.5, uz1 + 0.18, 0, 0.45);
  zones.push({ x0: tx0, x1: tx1, z0: uz0, z1: uz1, floor: 1, label: '계단' });
  const upEdges = new Set();
  B.upper.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    upEdges.add(s0); upEdges.add(s1);
    wallXGaps(s0, s1, [{ c: doorCOf(r), w: 1.8 }], zCor2, FH, FH, innerC);
    lintelX(doorCOf(r), 1.8, zCor2, innerC, FH);
    makeDoor(doorCOf(r) - 0.9, zCor2, 1.8, 'x', { swing: 1, y: FH });
    const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
    sign(label, doorCOf(r), FH + 2.42, zCor2 + 0.18, 0, 0.45);
    furnish(r, cx, cw, FH, uz0, 1, zCor2 - uz0);
    [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, FH + 1.8, uz0 - 0.18, Math.PI, 2.2, 1.5));
    zones.push({ x0: s0, x1: s1, z0: uz0, z1: zCor2, floor: 1, label: `본관 2층 · ${r.name}` });
  });
  [...upEdges].filter(x => x > ux0 + 0.01 && x < ux1 - 0.01)
    .forEach(x => wallZ(uz0, zCor2, x, FH, FH, innerC));
  zones.push({ x0: ux0, x1: ux1, z0: zCor2, z1: uz1, floor: 1, label: '본관 2층 복도' });
  for (let wx = ux0 + 1.5; wx <= tx0 - 1; wx += 3) windowPane(wx, FH + 1.8, uz1 + 0.18, 0);
  for (let lx = ux0 + 3; lx < tx0; lx += 6) lamp(lx, FH * 2 - 0.12, (zCor2 + uz1) / 2);
  roofOver(ux0, ux1, uz0, uz1, FH * 2, roofC);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.5, 14), mat(0xc8cdd2));
  tank.position.set(ux0 + 4, FH * 2 + 0.75, uz0 + 3);
  scene.add(tank);

  // ---------- 체육관 (사진4·6·7·8: 무대는 북쪽=입구 우측) ----------
  const G = SCHOOL.gym;
  const [gx, gz] = G.center;
  const gx0 = gx - G.width / 2, gx1 = gx + G.width / 2;
  const gz0 = gz - G.depth / 2, gz1 = gz + G.depth / 2;
  const gh = G.wallHeight;
  const brickC = 0xa8503a, panelC = 0x8f979e, frameC = 0x2e7d46;
  const bandH = 3.2;
  wallX(gx0, gx1, gz0, 0, bandH, brickC, 0.35);
  wallX(gx0, gx1, gz1, 0, bandH, brickC, 0.35);
  wallZ(gz0, gz1, gx0, 0, bandH, brickC, 0.35);
  wallZGaps(gz0, gz1, [{ c: gz, w: 3 }], gx1, 0, bandH, brickC, 0.35);
  wallZ(gz - 1.5, gz + 1.5, gx1, 2.2, 1.0, brickC, 0.35);   // 문 위 린텔
  wallX(gx0, gx1, gz0, bandH, gh - bandH, panelC, 0.35);
  wallX(gx0, gx1, gz1, bandH, gh - bandH, panelC, 0.35);
  wallZ(gz0, gz1, gx0, bandH, gh - bandH, panelC, 0.35);
  wallZ(gz0, gz1, gx1, bandH, gh - bandH, panelC, 0.35);
  // 철문(양쪽 여닫이) + 팻말
  makeDoor(gx1, gz - 1.5, 1.5, 'z', { color: 0x7d848c, swing: 1 });
  makeDoor(gx1, gz, 1.5, 'z', { color: 0x7d848c, swing: -1 });
  sign('체육관', gx1 + 0.25, 2.6, gz, Math.PI / 2, 0.5);
  // 지붕 + 용마루 + 박공면
  const panelL = Math.hypot(G.depth / 2, 2.5) + 0.6;
  const pAng = Math.atan2(2.5, G.depth / 2);
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, gh + 1.14, gz - G.depth / 4, { rot: [-pAng, 0, 0], collide: false });
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, gh + 1.14, gz + G.depth / 4, { rot: [pAng, 0, 0], collide: false });
  box(G.width + 1.6, 0.35, 1.5, 0xc35233, gx, gh + 2.35, gz, { collide: false });
  [gx0, gx1].forEach(gex => {
    [[0, G.depth - 1], [1, G.depth * 0.62], [2, G.depth * 0.3]].forEach(([k, dd]) => {
      box(0.36, 0.85, dd, panelC, gex, gh + k * 0.82, gz, { collide: false });
    });
  });
  const gymFloor = new THREE.Mesh(UNIT_PLANE, new THREE.MeshLambertMaterial({ map: courtTexture() }));
  gymFloor.scale.set(G.width - 0.8, G.depth - 0.8, 1);
  gymFloor.rotation.x = -Math.PI / 2;
  gymFloor.position.set(gx, 0.03, gz);
  scene.add(gymFloor);
  walkables.push(gymFloor);
  // 내부 초록 띠 (사진8)
  box(G.width - 1, 1.0, 0.08, 0x3f9c5a, gx, 0.25, gz1 - 0.45, { collide: false });
  box(0.08, 1.0, G.depth - 1, 0x3f9c5a, gx0 + 0.45, 0.25, gz, { collide: false });
  // 북쪽: 방송실 | 무대 | 준비실 (입구에서 보면 우측)
  const gFrontZ = gz0 + 3.6;
  wallXGaps(gx0, -70, [{ c: -72.5, w: 1.6 }], gFrontZ, 0, 2.8, innerC);
  wallX(-70, -66, gFrontZ, 0, 2.8, innerC);
  wallXGaps(-52, -48.2, [{ c: -50, w: 1.6 }], gFrontZ, 0, 2.8, innerC);
  [[-70], [-66], [-52], [-48.2]].forEach(([px2]) => wallZ(gz0, gFrontZ, px2, 0, 2.8, innerC));
  // 방송실 (사진5: 초록 벽 + 믹서 + 마이크 + 모니터)
  box(4.7, 2.6, 0.07, 0x7cc26b, -72.5, 0, gz0 + 0.4, { collide: false });
  box(0.07, 2.6, 3.2, 0x7cc26b, gx0 + 0.4, 0, gz0 + 1.8, { collide: false });
  sign('방송실', -72.5, 2.35, gFrontZ + 0.18, 0, 0.4);
  box(1.8, 0.74, 0.7, 0x8a6a52, -72.5, 0, gz0 + 1.1);
  box(1.1, 0.14, 0.5, 0x2b2e33, -72.7, 0.76, gz0 + 1.05, { rot: [0.18, 0, 0], collide: false });
  box(0.45, 0.36, 0.05, 0x14161a, -73.2, 0.95, gz0 + 0.85, { collide: false });
  box(0.45, 0.36, 0.05, 0x14161a, -71.9, 0.95, gz0 + 0.85, { collide: false });
  const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), mat(0x30343a));
  micPole.position.set(-72.1, 0.95, gz0 + 1.15);
  scene.add(micPole);
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0x555b62));
  micHead.position.set(-72.1, 1.13, gz0 + 1.15);
  scene.add(micHead);
  zones.push({ x0: gx0, x1: -70, z0: gz0, z1: gFrontZ, label: '체육관 방송실' });
  // 무대 (사진6: 검은 상단막 + 정림초등학교 + 회색 커튼)
  box(14, 0.9, 3.6, 0xb5793f, -59, 0, gz0 + 1.8, { walk: true });
  box(2.4, 0.45, 1.1, 0xa96f3b, -59, 0, gFrontZ + 0.55, { walk: true });
  box(13.6, 3.2, 0.1, 0, -59, 0.9, gz0 + 0.5, { material: CURTAIN, collide: false });
  box(14.6, 0.8, 0.2, 0x1a1c20, -59, 4.2, gFrontZ - 0.2, { collide: false });
  const gymBanner = textSign('정림초등학교', { h: 0.4, bg: '#1a1c20', fg: '#ffffff', border: null, fontPx: 48, pad: 14 });
  gymBanner.position.set(-59, 4.25, gFrontZ - 0.05);
  scene.add(gymBanner);
  // 준비실 (사진7: 매트·뜀틀·공 카트)
  sign('준비실', -50, 2.35, gFrontZ + 0.18, 0, 0.4);
  box(0.07, 2.6, 3.2, 0x7cc26b, -48.35, 0, gz0 + 1.8, { collide: false });
  box(2.2, 0.5, 1.5, 0x2f6fd0, -50.6, 0, gz0 + 1.1);
  [[1.05, 0.3], [0.85, 0.6], [0.68, 0.9]].forEach(([w, y], i) => box(w, 0.3, 0.7, i === 2 ? 0xd9b382 : 0xc79a63, -49, y - 0.3, gz0 + 0.9));
  box(1.0, 0.85, 0.75, 0xd0392e, -51.2, 0, gz0 + 2.8);
  box(1.0, 0.85, 0.75, 0x2b4fa0, -50, 0, gz0 + 2.9);
  [[-51.4, 0.95], [-51, 0.98]].forEach(([bx2, by]) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat([0xf2c94c, 0x4d9bd6][bx2 < -51.2 ? 0 : 1]));
    ball.position.set(bx2, by, gz0 + 2.8);
    scene.add(ball);
  });
  zones.push({ x0: -52, x1: -48.2, z0: gz0, z1: gFrontZ, label: '체육관 준비실' });
  // 화장실 (동쪽 입구 양옆)
  [[gz0, 1, '화장실(여)'], [gz1, -1, '화장실(남)']].forEach(([wz, d, nm]) => {
    wallZ(Math.min(wz, wz + d * 3.2), Math.max(wz, wz + d * 3.2), gx1 - 3.2, 0, 2.8, innerC);
    wallXGaps(gx1 - 3.2, gx1, [{ c: gx1 - 1.6, w: 1.3 }], wz + d * 3.2, 0, 2.8, innerC);
    sign(nm, gx1 - 1.6, 2.2, wz + d * 3.45, d > 0 ? 0 : Math.PI, 0.4);
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 0.75, 0, wz + d * 0.75);
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 2.45, 0, wz + d * 0.75);
    box(0.5, 0.8, 0.45, 0xf2f5f7, gx1 - 1.6, 0, wz + d * 2.6);
  });
  // 농구 골대 2 (동서)
  [[gx0 + 2.5, 1], [gx1 - 2.5, -1]].forEach(([hx, dir]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 10), mat(0x555b62));
    pole.position.set(hx, 1.8, gz + 3);
    scene.add(pole); colliders.push(pole);
    box(1.5, 1, 0.08, 0xf2f5f7, hx + dir * 0.45, 2.45, gz + 3, { rot: [0, Math.PI / 2, 0], collide: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 18), mat(0xe07a2f));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(hx + dir * 0.85, 2.6, gz + 3);
    scene.add(ring);
  });
  for (let wx = gx0 + 3; wx < gx1 - 2; wx += 3.6) {
    [[gz0, -1, Math.PI], [gz1, 1, 0]].forEach(([wz, dir, ry]) => {
      [5.6, 1.9].forEach(wy => {
        const fr = new THREE.Mesh(UNIT_PLANE, mat(frameC));
        fr.scale.set(2.3, 1.4, 1);
        fr.position.set(wx, wy, wz + dir * 0.2);
        fr.rotation.y = ry;
        scene.add(fr);
        windowPane(wx, wy, wz + dir * 0.24, ry, 2, 1.1);
      });
    });
  }
  sign('체육관', gx1 + 0.25, gh - 1.2, gz, Math.PI / 2, 0.9);
  zones.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, label: '체육관' });

  // ---------- 텃밭 (E키로 물주기) ----------
  const GA = SCHOOL.garden;
  const [axg, azg] = GA.center;
  const gaW = GA.width || 14, gaD = GA.depth || 15;
  const gdx0 = axg - gaW / 2, gdx1 = axg + gaW / 2, gdz0 = azg - gaD / 2, gdz1 = azg + gaD / 2;
  for (let bcx = gdx0 + 3.5; bcx <= gdx1 - 3.4; bcx += 6.5) {
    for (let bcz = gdz0 + 1.9; bcz <= gdz1 - 1.8; bcz += 2.6) {
      box(5, 0.45, 1.7, 0x7a5230, bcx, 0, bcz, { walk: true });
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 7), mat(0x4d9b4d));
        sp.position.set(bcx - 1.8 + i * 0.9, 0.6, bcz + (rng() - 0.5) * 0.7);
        scene.add(sp);
      }
      // 물 주면 자라는 작물 (처음엔 숨김)
      const grown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const gp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.66, 7), mat(0x3f9c5a));
        gp.position.set(bcx - 1.4 + i * 1.4, 0.75, bcz);
        grown.add(gp);
      }
      [[-0.7, 0.72], [0.9, 0.68]].forEach(([ox, oy]) => {
        const tm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(0xd94f30));
        tm.position.set(bcx + ox, oy, bcz + 0.2);
        grown.add(tm);
      });
      grown.visible = false;
      scene.add(grown);
      interactables.push({ type: 'garden', x: bcx, y: 0, z: bcz, grown });
    }
  }
  const fenceC = 0x9c6644;
  wallX(gdx0, gdx1, gdz0, 0.3, 0.1, fenceC, 0.08);
  wallX(gdx0, gdx1, gdz0, 0.65, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: axg, w: 2.4 }], gdz1, 0.3, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: axg, w: 2.4 }], gdz1, 0.65, 0.1, fenceC, 0.08);
  [[gdx0], [gdx1]].forEach(([fx]) => {
    wallZ(gdz0, gdz1, fx, 0.3, 0.1, fenceC, 0.08);
    wallZ(gdz0, gdz1, fx, 0.65, 0.1, fenceC, 0.08);
  });
  for (let fx = gdx0; fx <= gdx1 + 0.01; fx += 3.5) {
    box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz0, { collide: false });
    if (Math.abs(fx - axg) > 1.4) box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz1, { collide: false });
  }
  const spole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), mat(0x9c6644));
  spole.position.set(axg, 0.85, azg + 1);
  scene.add(spole);
  box(1.1, 0.09, 0.09, 0x9c6644, axg, 1.15, azg + 1, { collide: false });
  const shead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), mat(0xf6cfa4));
  shead.position.set(axg, 1.75, azg + 1);
  scene.add(shead);
  const shat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.3, 10), mat(0xd8b24a));
  shat.position.set(axg, 2, azg + 1);
  scene.add(shat);
  sign('우리 텃밭', axg - 4.5, 1.55, gdz1 + 0.6, Math.PI, 0.55);
  box(0.09, 1.3, 0.09, 0x9c6644, axg - 5.4, 0, gdz1 + 0.6, { collide: false });
  box(0.09, 1.3, 0.09, 0x9c6644, axg - 3.6, 0, gdz1 + 0.6, { collide: false });
  zones.push({ x0: gdx0, x1: gdx1, z0: gdz0, z1: gdz1, label: '텃밭' });

  // ---------- 운동장 ----------
  const F = SCHOOL.field;
  const fplane = new THREE.Mesh(UNIT_PLANE, new THREE.MeshLambertMaterial({ map: trackTexture() }));
  fplane.scale.set(F.width, F.depth, 1);
  fplane.rotation.x = -Math.PI / 2;
  fplane.position.set(F.center[0], 0.012, F.center[1]);
  scene.add(fplane);
  walkables.push(fplane);
  [[-1], [1]].forEach(([s]) => {
    const gxp = F.center[0] + s * (F.width / 2 - 18);
    [-2.6, 2.6].forEach(zo => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 8), mat(0xffffff));
      post.position.set(gxp, 1, F.center[1] + zo);
      scene.add(post); colliders.push(post);
    });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 8), mat(0xffffff));
    bar.rotation.x = Math.PI / 2;
    bar.position.set(gxp, 2, F.center[1]);
    scene.add(bar);
    box(0.12, 2, 5.4, 0, gxp + s * 1.1, 0, F.center[1], { material: NET });
    [-2.7, 2.7].forEach(zo => box(1.15, 2, 0.1, 0, gxp + s * 0.55, 0, F.center[1] + zo, { material: NET }));
    box(1.15, 0.08, 5.4, 0, gxp + s * 0.55, 1.95, F.center[1], { material: NET, collide: false });
  });
  zones.push({ x0: F.center[0] - F.width / 2, x1: F.center[0] + F.width / 2, z0: F.center[1] - F.depth / 2, z1: F.center[1] + F.depth / 2, label: '운동장' });

  // ---------- 놀이터 ----------
  const [px, pz] = SCHOOL.playground.center;
  box(17, 0.05, 14, 0xe8d8ae, px, 0, pz, { collide: false, walk: true });
  const slX = px - 4.5, slZ = pz - 3;
  box(1.7, 0.14, 1.7, 0x9c7a53, slX, 1.62, slZ, { walk: true });
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([lx, lz]) => box(0.12, 1.62, 0.12, 0x8a6a45, slX + lx, 0, slZ + lz, { collide: false }));
  [-0.34, 0.34].forEach(ox => box(0.55, 0.09, 2.9, 0xccd2d8, slX + ox, 0.85, slZ + 1.95, { rot: [0.63, 0, 0], collide: false, walk: true }));
  [-0.68, 0, 0.68].forEach(ox => box(0.08, 0.16, 2.9, 0x9aa5ad, slX + ox, 0.9, slZ + 1.95, { rot: [0.63, 0, 0], collide: false }));
  box(0.85, 0.1, 2.1, 0xa9805a, slX, 0.8, slZ - 1.35, { rot: [-0.95, 0, 0], collide: false, walk: true });
  const swX = px + 4.5, swZ = pz + 3.5;
  const swbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), mat(0x3a6ea5));
  swbar.rotation.z = Math.PI / 2;
  swbar.position.set(swX, 2.25, swZ);
  scene.add(swbar);
  [[-1.7], [1.7]].forEach(([sx]) => {
    [[-0.5], [0.5]].forEach(([zz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), mat(0x3a6ea5));
      leg.position.set(swX + sx, 1.15, swZ + zz);
      leg.rotation.x = zz > 0 ? -0.22 : 0.22;
      scene.add(leg); colliders.push(leg);
    });
  });
  [[-0.7], [0.7]].forEach(([sx]) => {
    box(0.5, 0.06, 0.26, 0xe3453a, swX + sx, 0.55, swZ, { collide: false });
    [[-0.2], [0.2]].forEach(([cxo]) => box(0.03, 1.62, 0.03, 0x777777, swX + sx + cxo, 0.6, swZ, { collide: false }));
  });
  const ssX = px - 4.5, ssZ = pz + 3.5;
  box(0.3, 0.35, 0.3, 0x9aa5ad, ssX, 0, ssZ);
  box(3.2, 0.09, 0.38, 0x67b26f, ssX, 0.42, ssZ, { rot: [0, 0, 0.13], collide: false, walk: true });
  [[0.9, 1], [1.25, 0], [1.6, -1]].forEach(([bh, zo]) => {
    [-0.7, 0.7].forEach(sx => box(0.08, bh, 0.08, 0x3a6ea5, px + 3.5 + sx, 0, pz - 3.5 + zo, { collide: false }));
    const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), mat(0xc8cdd2));
    bb.rotation.z = Math.PI / 2;
    bb.position.set(px + 3.5, bh, pz - 3.5 + zo);
    scene.add(bb);
  });
  zones.push({ x0: px - 8.5, x1: px + 8.5, z0: pz - 7, z1: pz + 7, label: '놀이터' });

  // ---------- 정자 가는 벽돌길 ----------
  box(3, 0.05, 9, 0xc97f5a, px, 0, pz + 11.5, { collide: false, walk: true });
  box(2.4, 0.32, 1.5, 0x8fae6d, px, 0, pz + 12, { walk: true });
  for (let i = 0; i < 6; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat([0xe8863a, 0xd94f6b, 0xf2b134][i % 3]));
    fl.position.set(px - 1 + i * 0.4, 0.45, pz + 12 + (rng() - 0.5) * 0.8);
    scene.add(fl);
  }
  const pvX = px, pvZ = pz + 16.2;
  [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([ox, oz]) => box(0.14, 2.2, 0.14, 0x8a5a3b, pvX + ox, 0, pvZ + oz));
  const pvRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.1, 6), mat(0x7a4e2d));
  pvRoof.position.set(pvX, 2.75, pvZ);
  scene.add(pvRoof);
  box(2, 0.42, 0.6, 0xc9b8a0, pvX, 0, pvZ + 0.85, { walk: true });
  box(2, 0.42, 0.6, 0xc9b8a0, pvX, 0, pvZ - 0.85, { walk: true });
  zones.push({ x0: pvX - 2.6, x1: pvX + 2.6, z0: pvZ - 2.6, z1: pvZ + 2.6, label: '정자' });

  // ---------- 무지개 지붕 쉼터 ----------
  const SH = SCHOOL.shelter;
  const [shx, shz] = SH.center, shL = SH.length;
  const shColors = [0x67b26f, 0xf2b134, 0x4d9bd6, 0xe8863a, 0xd94f6b];
  const nSeg = Math.round(shL / 2);
  for (let i = 0; i < nSeg; i++) {
    box(2, 0.16, 4.4, shColors[i % shColors.length], shx - shL / 2 + 1 + i * 2, 2.5, shz, { collide: false });
  }
  for (let sxp = -shL / 2; sxp <= shL / 2 + 0.01; sxp += 4) {
    box(0.14, 2.5, 0.14, 0x8a949c, shx + sxp, 0, shz - 1.9);
    box(0.14, 2.5, 0.14, 0x8a949c, shx + sxp, 0, shz + 1.9);
  }
  box(shL - 2, 0.42, 0.5, 0xc9b8a0, shx, 0, shz + 1, { walk: true });
  box(shL - 2, 0.42, 0.5, 0xc9b8a0, shx, 0, shz - 1, { walk: true });
  zones.push({ x0: shx - shL / 2, x1: shx + shL / 2, z0: shz - 2.5, z1: shz + 2.5, label: '무지개 쉼터' });

  // ---------- 국기게양대 ----------
  const [flx, flz] = SCHOOL.flagPole;
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 10, 10), mat(0xc8cdd2));
  fpole.position.set(flx, 5, flz);
  scene.add(fpole); colliders.push(fpole);
  const fball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat(0xd8b24a));
  fball.position.set(flx, 10.1, flz);
  scene.add(fball);
  const flagGroup = new THREE.Group();
  const flag = new THREE.Mesh(UNIT_PLANE, new THREE.MeshBasicMaterial({ map: taegeukTexture(), side: THREE.DoubleSide }));
  flag.scale.set(1.95, 1.3, 1);
  flag.position.x = 1.02;
  flagGroup.add(flag);
  flagGroup.position.set(flx, 9.1, flz);
  scene.add(flagGroup);
  dynamic.flag = flagGroup;

  // ---------- 교문 + 길 ----------
  const [gtx, gtz] = SCHOOL.gate;
  box(4, 0.05, gtz - (F.center[1] + F.depth / 2), 0xd8d2c6, gtx, 0.006, (gtz + F.center[1] + F.depth / 2) / 2, { collide: false, walk: true });
  [-3.5, 3.5].forEach(sx => box(1, 3, 1, 0xb9b5aa, gtx + sx, 0, gtz));
  box(9, 0.5, 0.8, 0x8a9096, gtx, 3.05, gtz, { collide: false });
  function pine(tx, tz, s = 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 8), mat(0x7a5230));
    trunk.position.set(tx, 0.8 * s, tz);
    scene.add(trunk); colliders.push(trunk);
    [[1.15, 1.9], [0.9, 2.7], [0.62, 3.4]].forEach(([r, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r * s, 1.1 * s, 8), mat(0x2f6b3f));
      cone.position.set(tx, y * s, tz);
      scene.add(cone);
    });
  }
  pine(gtx + 5.5, gtz - 2.5, 1.15);
  pine(gtx + 8.5, gtz - 1.2, 0.95);
  sign(SCHOOL.name, gtx, 2.35, gtz, 0, 0.7);
  const gateBlock = new THREE.Mesh(UNIT_BOX, INVIS);
  gateBlock.scale.set(7, 3, 0.3);
  gateBlock.position.set(gtx, 1.5, gtz);
  scene.add(gateBlock); colliders.push(gateBlock);
  zones.push({ x0: gtx - 6, x1: gtx + 6, z0: gtz - 4, z1: gtz + 2, label: '교문' });

  // ---------- 울타리 + 투명 경계벽 + 나무 + 구름 ----------
  const bd = SCHOOL.bounds;
  const hedgeC = 0x4e7d3a;
  box(bd.x * 2, 0.95, 0.9, hedgeC, 0, 0, bd.zMin);
  wallXGaps(-bd.x, bd.x, [{ c: gtx, w: 9 }], bd.zMax, 0, 1.1, 0xeef1f3, 0.25);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, -bd.x, 0, (bd.zMin + bd.zMax) / 2);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, bd.x, 0, (bd.zMin + bd.zMax) / 2);
  box(bd.x * 2 + 2, 6, 0.6, 0, 0, 0, bd.zMin, { material: INVIS });
  box(bd.x * 2 + 2, 6, 0.6, 0, 0, 0, bd.zMax, { material: INVIS });
  box(0.6, 6, bd.zMax - bd.zMin + 2, 0, -bd.x, 0, (bd.zMin + bd.zMax) / 2, { material: INVIS });
  box(0.6, 6, bd.zMax - bd.zMin + 2, 0, bd.x, 0, (bd.zMin + bd.zMax) / 2, { material: INVIS });

  function tree(tx, tz, s = 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 1.4 * s, 8), mat(0x8b5e34));
    trunk.position.set(tx, 0.7 * s, tz);
    scene.add(trunk); colliders.push(trunk);
    const g1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05 * s, 0), mat(0x4d8b4d));
    g1.position.set(tx, 1.9 * s, tz);
    scene.add(g1);
    const g2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 * s, 0), mat(0x5e9c53));
    g2.position.set(tx + 0.45 * s, 2.5 * s, tz + 0.2 * s);
    scene.add(g2);
  }
  for (let tz = -35; tz <= 35; tz += 10) tree(70, tz, 1 + rng() * 0.4);
  for (let tz = -30; tz <= 40; tz += 10) tree(-80, tz, 1 + rng() * 0.4);
  [-30, -8, 10, 26].forEach(tx => tree(tx, -68, 1.1 + rng() * 0.3));
  tree(58, -20, 0.9);
  const [btx, btz] = SCHOOL.bigTree;
  tree(btx, btz, 3.4);

  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 5; i++) {
    const cg = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2.2 + rng() * 1.6, 8, 8), cloudMat);
      s.position.set(j * 2.6 - 2.6, rng() * 0.8, rng() * 1.5);
      s.scale.y = 0.55;
      cg.add(s);
    }
    cg.position.set(-90 + i * 42 + rng() * 12, 33 + rng() * 8, -30 + rng() * 55);
    scene.add(cg);
    dynamic.clouds.push(cg);
  }

  // ---------- 성능: 정적 행렬 동결 + 8m 격자 ----------
  scene.traverse(o => { o.matrixAutoUpdate = false; o.updateMatrix(); });
  doors.forEach(d => { d.group.matrixAutoUpdate = true; });
  dynamic.clouds.forEach(c => { c.matrixAutoUpdate = true; });
  if (dynamic.flag) dynamic.flag.matrixAutoUpdate = true;
  scene.updateMatrixWorld(true);

  const CELL = 8;
  const grid = new Map();
  const solidSet = new Set(colliders);
  const tmpB = new THREE.Box3();
  [...new Set([...walkables, ...colliders])].forEach(m => {
    tmpB.setFromObject(m);
    const e = {
      m, solid: solidSet.has(m),
      aabb: { minX: tmpB.min.x, maxX: tmpB.max.x, minY: tmpB.min.y, maxY: tmpB.max.y, minZ: tmpB.min.z, maxZ: tmpB.max.z },
    };
    for (let gxc = Math.floor(e.aabb.minX / CELL); gxc <= Math.floor(e.aabb.maxX / CELL); gxc++) {
      for (let gzc = Math.floor(e.aabb.minZ / CELL); gzc <= Math.floor(e.aabb.maxZ / CELL); gzc++) {
        const k = gxc + ':' + gzc;
        let arr = grid.get(k);
        if (!arr) { arr = []; grid.set(k, arr); }
        arr.push(e);
      }
    }
  });

  // R키 탈출 지점 (복도·마당·운동장 등 안전한 곳)
  const safePoints = [
    { x: 6.15, y: 0, z: -29 },
    { x: -20, y: 0, z: -36.2 }, { x: 0, y: 0, z: -36.2 }, { x: 20, y: 0, z: -36.2 },
    { x: 6.9, y: 0, z: -46 },
    { x: 24, y: 0, z: -56.2 },
    { x: 24, y: 0, z: -41 },
    { x: 0, y: 0, z: 20 },
    { x: -60, y: 0, z: -52 },
    { x: -26, y: FH, z: -39.7 },
  ];

  return {
    colliders, walkables, zones, dynamic, doors, interactables, npcs,
    grid, CELL, safePoints,
    spawn: new THREE.Vector3(0, 0, 38),
    buildingInfo: { zFront: fz1, zBack: -58, zDiv: zCor, FH },
  };
}
