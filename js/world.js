// 학교 월드 생성 — data.js 를 읽어 3D로 세움
// v0.6: 교실 동서 배치(칠판=서쪽 벽) + 반별 NPC + 진짜 계단 + 여닫는 문(E키)
//        외부출입구는 빨강 표시 5곳만(유리문), 각 실 문은 보라 표시(서쪽 치우침)
import * as THREE from 'three';
import { SCHOOL } from './data.js';
import { textSign, taegeukTexture, trackTexture, courtTexture, bookStripes } from './textures.js';

const M = {}; // 재질 캐시
function mat(color) {
  if (!M[color]) M[color] = new THREE.MeshLambertMaterial({ color });
  return M[color];
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildWorld(scene) {
  const colliders = [];  // 수평 충돌 + 위에 올라설 수 있음
  const walkables = [];  // 발 딛는 면 (충돌 없음: 바닥·경사면 등)
  const zones = [];      // HUD 위치 표시용
  const doors = [];      // 여닫는 문 (E키)
  const interactables = []; // 컴퓨터·의자 등 (E키)
  const dynamic = { flag: null, clouds: [] };
  const rng = mulberry32(20260728);

  // ---------- 공용 헬퍼 ----------
  function box(w, h, d, color, cx, baseY, cz, opt = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opt.material || mat(color));
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
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      typeof colorOrMat === 'number' ? mat(colorOrMat) : colorOrMat
    );
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
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xaed4ef));
    wm.position.set(x, y, z);
    wm.rotation.y = rotY;
    scene.add(wm);
    return wm;
  }

  // 여닫는 문. axis 'x': 동서 벽의 구멍 / 'z': 남북 벽의 구멍. 힌지는 서/북쪽 끝
  // glass: 외부 유리문(기본 닫힘). swing: 열릴 때 도는 방향(±1)
  function makeDoor(hx, hz, w, axis, opts = {}) {
    const g = new THREE.Group();
    const pm = opts.glass
      ? new THREE.MeshLambertMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.45 })
      : mat(0x9c6644);
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(axis === 'x' ? w - 0.12 : 0.07, 2.2, axis === 'x' ? 0.07 : w - 0.12), pm);
    if (axis === 'x') panel.position.x = (w - 0.12) / 2 + 0.03;
    else panel.position.z = (w - 0.12) / 2 + 0.03;
    panel.position.y = 1.1 + (opts.y || 0);
    g.add(panel);
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

  // 사람 NPC (반별 명단). girl: 머리 모양, teacher: 크고 어른 옷
  const SHIRTS = [0xe8863a, 0x67b26f, 0x4d9bd6, 0xd94f6b, 0xf2b134, 0x8e6fc9, 0x3aa8a0];
  const HAIRS = [0x3a2e28, 0x241d18, 0x4e3b2a];
  function person(x, y, z, yaw, name, girl, teacher = false) {
    const g = new THREE.Group();
    const sc = teacher ? 1.12 : 0.88;
    const shirt = new THREE.MeshLambertMaterial({ color: teacher ? (girl ? 0xc76b8e : 0x4a6fa5) : SHIRTS[Math.floor(rng() * SHIRTS.length)] });
    const pants = mat(0x5a6b8c);
    const skin = mat(0xf6cfa4);
    const hair = mat(HAIRS[Math.floor(rng() * HAIRS.length)]);
    [[0.11], [-0.11]].forEach(([lx]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.19), pants);
      leg.position.set(lx, 0.25, 0);
      g.add(leg);
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), shirt);
    body.position.y = 0.775;
    g.add(body);
    [[0.31], [-0.31]].forEach(([ax]) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.15), shirt);
      arm.position.set(ax, 0.78, 0);
      g.add(arm);
    });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.46), skin);
    head.position.y = 1.3;
    g.add(head);
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.15, 0.5), hair);
    hairTop.position.y = 1.58;
    g.add(hairTop);
    if (girl) {
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.55, 0.12), hair);
      hairBack.position.set(0, 1.28, -0.26);
      g.add(hairBack);
    }
    const tag = textSign(name, { h: 0.26 });
    tag.position.y = 1.95;
    g.add(tag);
    g.scale.setScalar(sc);
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    scene.add(g);
    return g;
  }

  // ---------- 하늘/땅 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 240), mat(0x7cb85c));
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
  const [fz0, fz1] = FR.z;                 // fz0=-38(북) fz1=-24(남 정면)
  const zCor = fz0 + FR.corridorDepth;     // 복도(북측) 남쪽 경계 -34.4
  const doorCOf = r => r.span[0] + 1.9;    // 보라 표시: 문은 방 서쪽에 치우침

  function roofOver(x0, x1, z0, z1, y, color) {
    box(x1 - x0 + 0.6, 0.25, z1 - z0 + 0.6, color, (x0 + x1) / 2, y - 0.25, (z0 + z1) / 2);
    wallX(x0, x1, z1 + 0.15, y, 0.55, color, 0.25);
    wallX(x0, x1, z0 - 0.15, y, 0.55, color, 0.25);
    wallZ(z0, z1, x0 - 0.15, y, 0.55, color, 0.25);
    wallZ(z0, z1, x1 + 0.15, y, 0.55, color, 0.25);
  }

  // ---- 책상+의자 (실제 모양, 의자는 앉기 가능) ----
  function deskChair(x, y0, z, monitor) {
    // 책상: 상판 + 다리 2 (학생은 서쪽(-x)을 봄)
    box(0.5, 0.06, 0.64, 0xdeb877, x, y0 + 0.62, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x - 0.2, y0, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x + 0.2, y0, z, { collide: false });
    box(0.5, 0.68, 0.64, 0x000000, x, y0, z, { material: new THREE.MeshBasicMaterial({ visible: false }) });
    let scr = null;
    if (monitor) {
      box(0.34, 0.5, 0.44, 0xb5713d, x, y0 + 0.68, z, { collide: false });  // 본체함
      scr = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4), new THREE.MeshBasicMaterial({ color: 0x1a2b30 }));
      scr.position.set(x + 0.12, y0 + 1.15, z);
      scr.rotation.y = Math.PI / 2;
      scene.add(scr);
      box(0.06, 0.5, 0.66, 0x22262c, x + 0.22, y0 + 0.68, z, { collide: false });
    }
    // 의자: 좌판 + 등받이 + 다리 (동쪽에서 서쪽을 보고 앉음)
    const chX = x + 0.62;
    box(0.4, 0.05, 0.4, 0xd9a066, chX, y0 + 0.4, z, { collide: false });
    box(0.06, 0.5, 0.4, 0xd9a066, chX + 0.17, y0 + 0.45, z, { collide: false });
    box(0.04, 0.4, 0.04, 0x8a949c, chX - 0.15, y0, z - 0.15, { collide: false });
    box(0.04, 0.4, 0.04, 0x8a949c, chX - 0.15, y0, z + 0.15, { collide: false });
    box(0.04, 0.4, 0.04, 0x8a949c, chX + 0.15, y0, z - 0.15, { collide: false });
    box(0.04, 0.4, 0.04, 0x8a949c, chX + 0.15, y0, z + 0.15, { collide: false });
    interactables.push({ type: 'chair', x: chX, y: y0, z, yaw: -Math.PI / 2 });
    return scr;
  }

  // ---- 방 가구 ----
  // 동서형(교실): zB/dir은 창문 방향 계산용, 칠판·책상은 서쪽 벽 기준 (사진2)
  function furnish(r, cx, cw, y0, zB, dir, depth) {
    const at = o => zB + dir * o;
    const faceIn = dir > 0 ? 0 : Math.PI;
    const s0 = cx - cw / 2, s1 = cx + cw / 2;
    const zMid = zB + dir * depth / 2;
    const classy = r.type === 'classroom' || r.type === 'computer' || r.type === 'science';
    if (classy) {
      // 칠판(화이트보드)·TV = 서쪽 벽, 책상은 서쪽을 봄, 사물함 = 동쪽 벽
      const bw = Math.min(depth - 2.5, 4);
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(bw + 0.2, 1.4), mat(0x9aa5ad));
      frame.position.set(s0 + 0.17, y0 + 1.7, zMid);
      frame.rotation.y = Math.PI / 2;
      scene.add(frame);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, 1.25), mat(0xf7f8f9));
      board.position.set(s0 + 0.2, y0 + 1.7, zMid);
      board.rotation.y = Math.PI / 2;
      scene.add(board);
      box(0.12, 0.06, bw, 0xc8ccd0, s0 + 0.28, y0 + 1.02, zMid, { collide: false });
      // 천장걸이 TV (서쪽 벽 옆)
      box(0.05, 0.6, 0.05, 0x30343a, s0 + 0.6, y0 + 2.55, zMid + dir * (bw / 2 + 1), { collide: false });
      box(0.07, 0.72, 1.3, 0x22262c, s0 + 0.65, y0 + 1.85, zMid + dir * (bw / 2 + 1), { collide: false });
      // 게시판 (교실별 색 다름, 서쪽 벽)
      const bulPal = [0xf2a6b8, 0xf6c67a, 0x8fd0a8, 0x9bc1e8, 0xc9aee5, 0xf4b8a0];
      const bul = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), mat(bulPal[Math.floor(rng() * bulPal.length)]));
      bul.position.set(s0 + 0.17, y0 + 1.7, zMid - dir * (bw / 2 + 1.1));
      bul.rotation.y = Math.PI / 2;
      scene.add(bul);
      // 교사 책상 (서쪽 앞)
      box(1.3, 0.74, 0.7, 0xb0a18e, s0 + 1.5, y0, zB + dir * 1.3);
      // 사물함 (동쪽 벽)
      box(0.45, 1.5, Math.min(depth - 3, 5), 0xc9a06a, s1 - 0.45, y0, zMid);
      // 책상 그리드 (열=x, 줄=z)
      const nx = Math.max(2, Math.min(3, Math.floor((cw - 4) / 1.9) + 1));
      const nz = Math.max(2, Math.min(4, Math.floor((depth - 3) / 1.7)));
      const seats = [];
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const dx = s0 + 3.1 + i * 1.9;
          const dz = zMid + (j - (nz - 1) / 2) * 1.7;
          const scr = deskChair(dx, y0, dz, r.type === 'computer');
          if (scr) interactables.push({ type: 'computer', x: dx, y: y0, z: dz, mesh: scr });
          seats.push([dx, dz]);
        }
      }
      // 반 친구들 + 선생님 (명단)
      const ppl = SCHOOL.people && SCHOOL.people[r.name];
      if (ppl) {
        ppl.s.forEach(([nm, gd], k) => {
          if (k < seats.length) person(seats[k][0] + 1.15, y0, seats[k][1], -Math.PI / 2, nm, gd === '여');
        });
        person(s0 + 2.4, y0, zMid + dir * (depth / 2 - 1.6), Math.PI / 2, '선생님', ppl.t === '여', true);
      }
      return;
    }
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
      const nT = Math.max(1, Math.floor((cw - 1.6) / 3.6));
      const rowZ = Math.min(depth - 4, Math.max(4, depth * 0.45));
      for (let i = 0; i < nT; i++) {
        for (let j = 0; j < 2; j++) {
          box(3.4, 0.74, 0.85, 0x9db4c0, cx + (i - (nT - 1) / 2) * 3.6, y0, at(rowZ + j * 2.6));
        }
      }
      box(Math.min(7, cw - 3), 0.95, 1.1, 0xc0c6cc, cx, y0, at(1.4));
      sign('조리실', cx, y0 + 2.3, at(0.25), faceIn, 0.45);
    } else if (r.type === 'library') {
      const books = new THREE.MeshLambertMaterial({ map: bookStripes() });
      const sSpread = Math.min(2.4, (cw - 2.2) / 2);
      for (let i = 0; i < 3; i++) {
        const sx = cx + (i - 1) * sSpread;
        box(2, 2.05, 0.5, 0x8b5e34, sx, y0, at(0.8));
        [0.6, 1.25, 1.85].forEach(by => {
          const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), books);
          strip.position.set(sx, y0 + by, at(0.8) + dir * 0.27);
          strip.rotation.y = faceIn;
          scene.add(strip);
        });
      }
      box(2.2, 0.72, 1.1, 0xdeb877, cx, y0, at(4.6));
      if (cw >= 8.5) box(2.2, 0.72, 1.1, 0xdeb877, cx - 2.8, y0, at(4.6));
    } else if (r.type === 'toilet') {
      // 남|여 칸막이 + 칸 + 세면대 (양쪽 다)
      const zLo = Math.min(zB, at(depth - 1.6)), zHi = Math.max(zB, at(depth - 1.6));
      wallZ(zLo, zHi, cx, y0, FH, 0xdfe8ee, 0.15);
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
  // 현관 앞 포장
  box(fx1 - fx0 + 8, 0.06, 6, 0xd8d2c6, (fx0 + fx1) / 2, 0, fz1 + 3, { collide: false, walk: true });

  // ---- 앞줄 ----
  const hallRoom = FR.rooms.find(r => r.type === 'hall');
  const hallCx = (hallRoom.span[0] + hallRoom.span[1]) / 2;
  // 남쪽 정면 외벽 + 현관 유리문(빨강 표시)
  wallXGaps(fx0, fx1, [{ c: hallCx, w: 3.2 }], fz1, 0, FH, wallC);
  makeDoor(hallCx - 1.6, fz1, 3.2, 'x', { glass: true, swing: 1 });
  // 서/동 외벽: 주복도 양끝 유리문(빨강 표시)
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 1.8 }], fx0, 0, FH, wallC);
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 1.8 }], fx1, 0, FH, wallC);
  makeDoor(fx0, FR.corridorExitZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  makeDoor(fx1, FR.corridorExitZ - 0.9, 1.8, 'z', { glass: true, swing: -1 });
  // 복도 북벽: 서관 방 문 + 당직실·급식실 문(보라) + 세로복도 합류
  const northGaps = [];
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly) return;
    northGaps.push({ c: r.type === 'stair' ? (r.span[0] + r.span[1]) / 2 : doorCOf(r), w: r.type === 'stair' ? 2.4 : 1.8 });
  }));
  northGaps.push({ c: K.dutyRoom.doorC, w: 1.6 });
  northGaps.push({ c: K.doorC, w: 2.4 });
  northGaps.push({ c: (LC.x[0] + LC.x[1]) / 2, w: LC.x[1] - LC.x[0] });
  wallXGaps(fx0, fx1, northGaps, fz0, 0, FH, innerC);
  wallXGaps(fx0, fx1, northGaps, fz0, 0, 0.95, wainC, 0.34);
  // 서관·급식동 방문들 (북벽에 달림)
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly || r.type === 'stair') return;
    makeDoor(doorCOf(r) - 0.9, fz0, 1.8, 'x', { swing: 1 });
  }));
  makeDoor(K.dutyRoom.doorC - 0.8, fz0, 1.6, 'x', { swing: 1 });
  makeDoor(K.doorC - 1.2, fz0, 2.4, 'x', { swing: 1 });
  // 주복도 동측 북벽(마당쪽) 큰 창 — 하늘색 표시: 밖이 보여야 함
  for (let wx = ex0 + 1.6; wx < fx1 - 1.2; wx += 3.2) {
    windowPane(wx, 1.9, fz0 - 0.18, Math.PI, 2.4, 1.6);
    windowPane(wx, 1.9, fz0 + 0.18, 0, 2.4, 1.6);
  }

  // 앞줄 방들 (문은 북쪽 복도, 서쪽 치우침 — 보라 표시)
  const frontEdges = new Set();
  FR.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    frontEdges.add(s0); frontEdges.add(s1);
    if (r.type !== 'hall') {
      const gaps = r.type === 'toilet'
        ? [{ c: s0 + cw * 0.25, w: 1.6 }, { c: s0 + cw * 0.75, w: 1.6 }]
        : [{ c: doorCOf(r), w: 1.8 }];
      wallXGaps(s0, s1, gaps, zCor, 0, FH, innerC);
      gaps.forEach(gp => makeDoor(gp.c - gp.w / 2, zCor, gp.w, 'x', { swing: -1 }));
      sign(r.name, cx, 2.5, zCor - 0.18, 0, 0.5);
      furnish(r, cx, cw, 0, fz1, -1, fz1 - zCor);
      // 남쪽 큰 창(운동장쪽 — 하늘색 표시)
      [-cw / 4, 0, cw / 4].forEach(off => windowPane(cx + off, 1.75, fz1 + 0.18, 0, 2.2, 1.6));
      // 복도: 연두 하부벽 + 손잡이 + 복도 쪽 창
      wallXGaps(s0, s1, gaps, zCor, 0, 0.95, wainC, 0.34);
      const dC = gaps[0].c;
      [[s0, dC - 1], [gaps[gaps.length - 1].c + 1, s1]].forEach(([a, b]) => {
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

  // 학교 이름 간판 + 현관 캐노피
  sign(SCHOOL.name, hallCx, FH + 1.1, fz1 + 0.35, 0, 1.2);
  box(5, 0.2, 2.6, 0x9aa5ad, hallCx, 3.0, fz1 + 1.25, { collide: false });
  [-2.1, 2.1].forEach(px => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 8), mat(0x8a949c));
    pole.position.set(hallCx + px, 1.5, fz1 + 2.3);
    scene.add(pole);
  });
  sign('현관', hallCx, 2.55, fz1 + 2.42, 0, 0.45);

  // ---- 서관 (주 복도 북쪽, 위에 2층) ----
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
        // 북쪽 창 (하늘색 표시)
        [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, 1.8, wz0 - 0.18, Math.PI, 2.2, 1.5));
      }
      if (r.type !== 'stair' && !r.innerOnly) {
        sign(r.name, cx, 2.5, wz1 + 0.18, 0, 0.5);
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

  // ---- 급식동 + 당직실 ----
  const kh = K.wallHeight;
  wallX(kx0, kx1, kz0, 0, kh, wallC);                 // 북 (바깥문 없음 — 빨강 표시에 없음)
  wallZ(kz0, kz1, kx0, 0, kh, wallC);                 // 서
  wallZ(kz0, kz1, kx1, 0, kh, wallC);                 // 동 (세로복도 쪽, 문 없음)
  wallX(kx0, kx1, kz1, FH, kh - FH, wallC);           // 남측 복도벽 위 필러
  roofOver(kx0, kx1, kz0, kz1, kh, K.roofColor);
  furnish({ type: 'cafeteria' }, (kx0 + kx1) / 2, kx1 - kx0, 0, kz0, 1, kz1 - kz0);
  sign('급식실', K.doorC + 1.6, 2.5, fz0 + 0.18, 0, 0.5);
  for (let wx = kx0 + 2.5; wx < kx1 - 1.5; wx += 4) windowPane(wx, 3.1, kz0 - 0.18, Math.PI, 2, 1);
  zones.push({ x0: kx0, x1: kx1, z0: kz0, z1: kz1, floor: 0, label: '본관 1층 · 급식실' });
  // 당직실 (급식동 남서 모서리, 문은 주복도)
  const D = K.dutyRoom;
  wallX(D.x[0], D.x[1], D.z[0], 0, FH, innerC);
  wallZ(D.z[0], D.z[1], D.x[1], 0, FH, innerC);
  sign('당직실', D.doorC + 1.2, 2.5, fz0 + 0.18, 0, 0.45);
  box(1.3, 0.74, 0.7, 0xb0a18e, (D.x[0] + D.x[1]) / 2, 0, D.z[0] + 1.2);
  box(1.05, 0.5, 1.95, 0xf2f5f7, D.x[1] - 0.8, 0, (D.z[0] + D.z[1]) / 2);
  zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], floor: 0, label: '본관 1층 · 당직실' });

  // ---- 세로복도 (현관 북쪽 → 동관) + 마당 유리문(빨강) ----
  wallZGaps(ez1, kz1, [{ c: LC.yardDoorZ, w: 1.8 }], LC.x[1], 0, FH, wallC);
  makeDoor(LC.x[1], LC.yardDoorZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  windowPane(LC.x[1] + 0.18, 1.9, -43.2, Math.PI / 2, 1.4, 1.4);
  wallZ(ez0, kz0, LC.x[0], 0, FH, wallC);
  roofOver(LC.x[0], LC.x[1], ez1, kz1, FH, roofC);
  zones.push({ x0: LC.x[0], x1: LC.x[1], z0: ez0, z1: kz1, floor: 0, label: '본관 1층 복도' });

  // ---- 동관 (마당 건너 북쪽, 복도는 북측) ----
  const shed = E.rooms.find(r => r.external);
  // 북 외벽: 창고 바깥문(빨강) + 복도 큰 창(하늘색)
  const shedC = shed ? (shed.span[0] + shed.span[1]) / 2 : null;
  wallXGaps(LC.x[0], ex1, shed ? [{ c: shedC, w: 1.8 }] : [], ez0, 0, FH, wallC);
  if (shed) {
    makeDoor(shedC - 0.9, ez0, 1.8, 'x', { glass: true, swing: -1 });
    sign(shed.name, shedC, 2.4, ez0 - 0.25, Math.PI, 0.45);
  }
  for (let wx = LC.x[0] + 2; wx < (shed ? shed.span[0] : ex1) - 1.5; wx += 3.5) {
    windowPane(wx, 1.9, ez0 - 0.18, Math.PI, 2.2, 1.5);
    windowPane(wx, 1.9, ez0 + 0.18, 0, 2.2, 1.5);
  }
  wallZ(ez0, ez1, ex1, 0, FH, wallC);                 // 동 외벽
  wallX(ex0, ex1, ez1, 0, FH, wallC);                 // 남 외벽(마당쪽)
  wallZ(zCorE, ez1, ex0, 0, FH, wallC);               // 서: 방 서벽
  const eGaps = E.rooms.filter(r => !r.external).map(r => ({ c: doorCOf(r), w: 1.8 }));
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, FH, innerC);
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, 0.95, wainC, 0.34);
  const eEdges = new Set();
  E.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    eEdges.add(s0); eEdges.add(s1);
    if (!r.external) {
      sign(r.name, cx, 2.5, zCorE - 0.18, 0, 0.5);
      makeDoor(doorCOf(r) - 0.9, zCorE, 1.8, 'x', { swing: -1 });
      [s0 + cw * 0.55, s0 + cw * 0.85].forEach(wxp => windowPane(wxp, 2.35, zCorE - 0.17, Math.PI, 1.3, 0.9));
    }
    furnish(r, cx, cw, 0, ez1, -1, ez1 - zCorE);
    // 남쪽 창은 마당을 봄 (하늘색 표시)
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

  // ---- 2층 (서관 위: 6학년|5학년|소담실 + 계단) ----
  const westWing = B.wings.find(w => w.twoStory);
  const [ux0, ux1] = westWing.x, [uz0, uz1] = westWing.z;
  const stairRoom = westWing.rooms.find(r => r.type === 'stair');
  const [tx0, tx1] = stairRoom.span;
  const zCor2 = uz1 - B.upper.corridorDepth;

  const wkX = tx0 + 1.5;
  box(wkX - ux0, 0.25, uz1 - uz0, slabC, (ux0 + wkX) / 2, FH - 0.25, (uz0 + uz1) / 2, { walk: true });
  box(tx1 - wkX, 0.25, 2.5, slabC, (wkX + tx1) / 2, FH - 0.25, uz0 + 1.25, { walk: true });
  // 진짜 계단 (아이들: 슬라이드 말고 계단 모양!)
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
    makeDoor(doorCOf(r) - 0.9, zCor2, 1.8, 'x', { swing: 1, y: FH });
    sign(r.name, cx, FH + 2.5, zCor2 + 0.18, 0, 0.5);
    furnish(r, cx, cw, FH, uz0, 1, zCor2 - uz0);
    [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, FH + 1.8, uz0 - 0.18, Math.PI, 2.2, 1.5));
    zones.push({ x0: s0, x1: s1, z0: uz0, z1: zCor2, floor: 1, label: `본관 2층 · ${r.name}` });
  });
  [...upEdges].filter(x => x > ux0 + 0.01 && x < ux1 - 0.01)
    .forEach(x => wallZ(uz0, zCor2, x, FH, FH, innerC));
  zones.push({ x0: ux0, x1: ux1, z0: zCor2, z1: uz1, floor: 1, label: '본관 2층 복도' });
  for (let wx = ux0 + 1.5; wx <= tx0 - 1; wx += 3) windowPane(wx, FH + 1.8, uz1 + 0.18, 0);
  roofOver(ux0, ux1, uz0, uz1, FH * 2, roofC);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.5, 14), mat(0xc8cdd2));
  tank.position.set(ux0 + 4, FH * 2 + 0.75, uz0 + 3);
  scene.add(tank);

  // ---------- 체육관 ----------
  const G = SCHOOL.gym;
  const [gx, gz] = G.center;
  const gx0 = gx - G.width / 2, gx1 = gx + G.width / 2;
  const gz0 = gz - G.depth / 2, gz1 = gz + G.depth / 2;
  const gh = G.wallHeight;
  const brickC = 0x9e4f38, panelC = 0x9aa3ab, frameC = 0x2e7d46;
  const bandH = 3.2;
  wallX(gx0, gx1, gz0, 0, bandH, brickC, 0.35);
  wallX(gx0, gx1, gz1, 0, bandH, brickC, 0.35);
  wallZ(gz0, gz1, gx0, 0, bandH, brickC, 0.35);
  wallZGaps(gz0, gz1, [{ c: gz, w: 3 }], gx1, 0, bandH, brickC, 0.35);
  wallX(gx0, gx1, gz0, bandH, gh - bandH, panelC, 0.35);
  wallX(gx0, gx1, gz1, bandH, gh - bandH, panelC, 0.35);
  wallZ(gz0, gz1, gx0, bandH, gh - bandH, panelC, 0.35);
  wallZ(gz0, gz1, gx1, bandH, gh - bandH, panelC, 0.35);
  // 지붕(박공) + 용마루 + 박공면 막기 (아이들: 지붕이 뚫려있다)
  const panelL = Math.hypot(G.depth / 2, 2.5) + 0.6;
  const pAng = Math.atan2(2.5, G.depth / 2);
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, gh + 1.14, gz - G.depth / 4, { rot: [-pAng, 0, 0], collide: false });
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, gh + 1.14, gz + G.depth / 4, { rot: [pAng, 0, 0], collide: false });
  box(G.width + 1.6, 0.35, 1.5, 0xc35233, gx, gh + 2.35, gz, { collide: false });
  [gx0, gx1].forEach(gex => {
    [[0, G.depth - 1, 0.85], [1, G.depth * 0.62, 0.85], [2, G.depth * 0.3, 0.9]].forEach(([k, dd, hh]) => {
      box(0.36, hh, dd, panelC, gex, gh + k * 0.82, gz, { collide: false });
    });
  });
  const gymFloor = new THREE.Mesh(new THREE.PlaneGeometry(G.width - 0.8, G.depth - 0.8), new THREE.MeshLambertMaterial({ map: courtTexture() }));
  gymFloor.rotation.x = -Math.PI / 2;
  gymFloor.position.set(gx, 0.03, gz);
  scene.add(gymFloor);
  walkables.push(gymFloor);
  // 무대 + 방송실(마이크) + 준비실(체육 재료 보관) + 화장실
  box(4, 0.9, 12, 0xb5793f, gx0 + 2.35, 0, gz, { walk: true });
  box(2, 0.45, 2.4, 0xa96f3b, gx0 + 5.35, 0, gz, { walk: true });
  sign('무대', gx0 + 0.55, 4.3, gz, Math.PI / 2, 0.6);
  wallZ(gz0, gz0 + 4, gx0 + 4.2, 0, 2.8, innerC);
  wallXGaps(gx0, gx0 + 4.2, [{ c: gx0 + 2.1, w: 1.6 }], gz0 + 4, 0, 2.8, innerC);
  sign('방송실', gx0 + 2.1, 2.2, gz0 + 4.2, 0, 0.45);
  box(1.8, 0.74, 0.7, 0x4a4f57, gx0 + 1.6, 0, gz0 + 1.2);
  const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), mat(0x30343a));
  micPole.position.set(gx0 + 1.6, 0.9, gz0 + 1.2);
  scene.add(micPole);
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0x555b62));
  micHead.position.set(gx0 + 1.6, 1.08, gz0 + 1.2);
  scene.add(micHead);
  zones.push({ x0: gx0, x1: gx0 + 4.2, z0: gz0, z1: gz0 + 4, label: '체육관 방송실' });
  // 준비실 — 공·매트·뜀틀은 여기에 (아이들 요청)
  wallZ(gz1 - 4, gz1, gx0 + 4.2, 0, 2.8, innerC);
  wallXGaps(gx0, gx0 + 4.2, [{ c: gx0 + 2.1, w: 1.6 }], gz1 - 4, 0, 2.8, innerC);
  sign('준비실', gx0 + 2.1, 2.2, gz1 - 4.2, Math.PI, 0.45);
  box(2.6, 0.14, 1.6, 0x4d7fb5, gx0 + 1.8, 0, gz1 - 1.2, { walk: true });
  [[1.15, 0.3], [0.95, 0.6], [0.75, 0.9]].forEach(([w, y], i) => box(w, 0.3, 0.75, i === 2 ? 0xd9b382 : 0xc79a63, gx0 + 3.2, y - 0.3, gz1 - 3.2));
  [[gx0 + 1.1, gz1 - 3.3], [gx0 + 1.7, gz1 - 3.6]].forEach(([bx2, bz2]) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), mat(0xe07a2f));
    ball.position.set(bx2, 0.15, bz2);
    scene.add(ball);
  });
  zones.push({ x0: gx0, x1: gx0 + 4.2, z0: gz1 - 4, z1: gz1, label: '체육관 준비실' });
  // 화장실 (동쪽 입구 양옆, 칸막이 포함)
  [[gz0, 1, '화장실(여)'], [gz1, -1, '화장실(남)']].forEach(([wz, d, nm]) => {
    wallZ(Math.min(wz, wz + d * 3.2), Math.max(wz, wz + d * 3.2), gx1 - 3.2, 0, 2.8, innerC);
    wallXGaps(gx1 - 3.2, gx1, [{ c: gx1 - 1.6, w: 1.3 }], wz + d * 3.2, 0, 2.8, innerC);
    sign(nm, gx1 - 1.6, 2.2, wz + d * 3.45, d > 0 ? 0 : Math.PI, 0.4);
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 0.75, 0, wz + d * 0.75);
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 2.45, 0, wz + d * 0.75);
    box(0.5, 0.8, 0.45, 0xf2f5f7, gx1 - 1.6, 0, wz + d * 2.6);
  });
  // 농구 골대 2
  [[gx0 + 7.5, 1], [gx1 - 2.2, -1]].forEach(([hx, dir]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 10), mat(0x555b62));
    pole.position.set(hx, 1.8, gz);
    scene.add(pole); colliders.push(pole);
    box(1.5, 1, 0.08, 0xf2f5f7, hx + dir * 0.45, 2.45, gz, { rot: [0, Math.PI / 2, 0], collide: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 18), mat(0xe07a2f));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(hx + dir * 0.85, 2.6, gz);
    scene.add(ring);
  });
  // 창 2열 + 초록 창틀
  for (let wx = gx0 + 3; wx < gx1 - 2; wx += 3.6) {
    [[gz0, -1, Math.PI], [gz1, 1, 0]].forEach(([wz, dir, ry]) => {
      [5.6, 1.9].forEach(wy => {
        const fr = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.4), mat(frameC));
        fr.position.set(wx, wy, wz + dir * 0.2);
        fr.rotation.y = ry;
        scene.add(fr);
        windowPane(wx, wy, wz + dir * 0.24, ry, 2, 1.1);
      });
    });
  }
  sign('체육관', gx1 + 0.25, gh - 1.2, gz, Math.PI / 2, 0.9);
  zones.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, label: '체육관' });

  // ---------- 텃밭 ----------
  const GA = SCHOOL.garden;
  const [ax, az] = GA.center;
  const gaW = GA.width || 14, gaD = GA.depth || 15;
  const gdx0 = ax - gaW / 2, gdx1 = ax + gaW / 2, gdz0 = az - gaD / 2, gdz1 = az + gaD / 2;
  for (let bcx = gdx0 + 3.5; bcx <= gdx1 - 3.4; bcx += 6.5) {
    for (let bcz = gdz0 + 1.9; bcz <= gdz1 - 1.8; bcz += 2.6) {
      box(5, 0.45, 1.7, 0x7a5230, bcx, 0, bcz, { walk: true });
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 7), mat(0x4d9b4d));
        sp.position.set(bcx - 1.8 + i * 0.9, 0.6, bcz + (rng() - 0.5) * 0.7);
        scene.add(sp);
      }
      if (rng() > 0.5) {
        const tom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(0xd94f30));
        tom.position.set(bcx + 1.2, 0.55, bcz - 0.3);
        scene.add(tom);
      }
    }
  }
  const fenceC = 0x9c6644;
  wallX(gdx0, gdx1, gdz0, 0.3, 0.1, fenceC, 0.08);
  wallX(gdx0, gdx1, gdz0, 0.65, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: ax, w: 2.4 }], gdz1, 0.3, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: ax, w: 2.4 }], gdz1, 0.65, 0.1, fenceC, 0.08);
  [[gdx0], [gdx1]].forEach(([fx]) => {
    wallZ(gdz0, gdz1, fx, 0.3, 0.1, fenceC, 0.08);
    wallZ(gdz0, gdz1, fx, 0.65, 0.1, fenceC, 0.08);
  });
  for (let fx = gdx0; fx <= gdx1 + 0.01; fx += 3.5) {
    box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz0, { collide: false });
    if (Math.abs(fx - ax) > 1.4) box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz1, { collide: false });
  }
  const scx = ax, scz = az + 1;
  const spole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), mat(0x9c6644));
  spole.position.set(scx, 0.85, scz);
  scene.add(spole);
  box(1.1, 0.09, 0.09, 0x9c6644, scx, 1.15, scz, { collide: false });
  const shead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), mat(0xf6cfa4));
  shead.position.set(scx, 1.75, scz);
  scene.add(shead);
  const shat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.3, 10), mat(0xd8b24a));
  shat.position.set(scx, 2, scz);
  scene.add(shat);
  sign('우리 텃밭', ax - 4.5, 1.55, gdz1 + 0.6, Math.PI, 0.55);
  box(0.09, 1.3, 0.09, 0x9c6644, ax - 5.4, 0, gdz1 + 0.6, { collide: false });
  box(0.09, 1.3, 0.09, 0x9c6644, ax - 3.6, 0, gdz1 + 0.6, { collide: false });
  zones.push({ x0: gdx0, x1: gdx1, z0: gdz0, z1: gdz1, label: '텃밭' });

  // ---------- 운동장 ----------
  const F = SCHOOL.field;
  const fplane = new THREE.Mesh(new THREE.PlaneGeometry(F.width, F.depth), new THREE.MeshLambertMaterial({ map: trackTexture() }));
  fplane.rotation.x = -Math.PI / 2;
  fplane.position.set(F.center[0], 0.012, F.center[1]);
  scene.add(fplane);
  walkables.push(fplane);
  // 축구 골대 + 그물 (반투명, 통과 불가)
  const netM = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
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
    box(0.12, 2, 5.4, 0, gxp + s * 1.1, 0, F.center[1], { material: netM });
    [-2.7, 2.7].forEach(zo => box(1.15, 2, 0.1, 0, gxp + s * 0.55, 0, F.center[1] + zo, { material: netM }));
    box(1.15, 0.08, 5.4, 0, gxp + s * 0.55, 1.95, F.center[1], { material: netM, collide: false });
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
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.3), new THREE.MeshBasicMaterial({ map: taegeukTexture(), side: THREE.DoubleSide }));
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
  const gateBlock = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  gateBlock.position.set(gtx, 1.5, gtz);
  scene.add(gateBlock); colliders.push(gateBlock);
  zones.push({ x0: gtx - 6, x1: gtx + 6, z0: gtz - 4, z1: gtz + 2, label: '교문' });

  // ---------- 울타리(경계) + 나무 + 구름 ----------
  const bd = SCHOOL.bounds;
  const hedgeC = 0x4e7d3a;
  box(bd.x * 2, 0.95, 0.9, hedgeC, 0, 0, bd.zMin);
  wallXGaps(-bd.x, bd.x, [{ c: gtx, w: 9 }], bd.zMax, 0, 1.1, 0xeef1f3, 0.25);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, -bd.x, 0, (bd.zMin + bd.zMax) / 2);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, bd.x, 0, (bd.zMin + bd.zMax) / 2);
  const invMat = new THREE.MeshBasicMaterial({ visible: false });
  box(bd.x * 2 + 2, 6, 0.6, 0, 0, 0, bd.zMin, { material: invMat });
  box(bd.x * 2 + 2, 6, 0.6, 0, 0, 0, bd.zMax, { material: invMat });
  box(0.6, 6, bd.zMax - bd.zMin + 2, 0, -bd.x, 0, (bd.zMin + bd.zMax) / 2, { material: invMat });
  box(0.6, 6, bd.zMax - bd.zMin + 2, 0, bd.x, 0, (bd.zMin + bd.zMax) / 2, { material: invMat });

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
  for (let tz = -30; tz <= 40; tz += 10) tree(-76, tz, 1 + rng() * 0.4);
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

  return {
    colliders, walkables, zones, dynamic, doors, interactables,
    spawn: new THREE.Vector3(0, 0, 38),
    buildingInfo: { zFront: fz1, zBack: -58, zDiv: zCor, FH },
  };
}
