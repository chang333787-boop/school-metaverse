// 학교 월드 생성 — data.js 를 읽어 3D로 세움
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
  const walkables = [];  // 발 딛는 면 (충돌 없음: 바닥·경사로 등)
  const zones = [];      // HUD 위치 표시용
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

  // ---------- 하늘/땅 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 240), mat(0x7cb85c));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  walkables.push(ground);

  // ---------- 본관 ----------
  const B = SCHOOL.building;
  const [bx, bz] = B.center;
  const W = B.width, D = B.depth, FH = B.floorHeight;
  const zFront = bz + D / 2;                 // -24 (남쪽 정면=복도쪽)
  const zBack = bz - D / 2;                  // -36
  const zDiv = zFront - B.corridorDepth;     // 복도/교실 경계 -27.4
  const wallC = B.wallColor;
  const innerC = 0xfaf3e3;

  // 바닥판
  box(W + 2, 0.08, D + 2, 0xcfc8ba, bx, 0, bz, { collide: false, walk: true });
  // 현관 앞 포장
  box(72, 0.06, 6, 0xd8d2c6, bx, 0, zFront + 3, { collide: false, walk: true });

  for (let f = 0; f < 2; f++) {
    const y0 = f * FH;
    const floor = B.floors[f];
    // 복도/교실 경계벽 + 방 문
    if (f === 0) { wallX(-W / 2, -24, zDiv, y0, FH, innerC); wallX(24, W / 2, zDiv, y0, FH, innerC); }
    floor.rooms.forEach(r => {
      const [s0, s1] = r.span;
      const cx = bx + (s0 + s1) / 2;
      if (r.type !== 'hall') {
        wallXGaps(bx + s0, bx + s1, [{ c: cx, w: r.door || 1.6 }], zDiv, y0, FH, innerC);
      }
      // 방 이름 팻말(복도 쪽)
      sign(r.name, cx, y0 + 2.5, zDiv + 0.18, 0, 0.5);
      zones.push({ x0: bx + s0, x1: bx + s1, z0: zBack, z1: zDiv, floor: f, label: `본관 ${floor.label} · ${r.name}` });
    });
    // 방 사이 칸막이
    const xsSet = new Set();
    floor.rooms.forEach(r => { xsSet.add(r.span[0]); xsSet.add(r.span[1]); });
    [...xsSet].filter(x => Math.abs(x) < W / 2 - 0.01).forEach(x => wallZ(zBack, zDiv, bx + x, y0, FH, innerC));
    // 외벽
    if (f === 0) {
      wallXGaps(bx - W / 2, bx + W / 2, [{ c: bx, w: 4 }], zFront, y0, FH, wallC);
      wallXGaps(bx - W / 2, bx + W / 2, [{ c: bx, w: 3 }], zBack, y0, FH, wallC);
    } else {
      wallX(bx - W / 2, bx + W / 2, zFront, y0, FH, wallC);
      wallX(bx - W / 2, bx + W / 2, zBack, y0, FH, wallC);
    }
    wallZ(zBack, zFront, bx - W / 2, y0, FH, wallC);
    wallZ(zBack, zFront, bx + W / 2, y0, FH, wallC);
    // 계단/복도 zone
    zones.push({ x0: bx - W / 2, x1: bx - 24.5, z0: zDiv, z1: zFront, floor: f, label: `본관 계단 (${floor.label})` });
    zones.push({ x0: bx + 24.5, x1: bx + W / 2, z0: zDiv, z1: zFront, floor: f, label: `본관 계단 (${floor.label})` });
    if (f === 1) {
      zones.push({ x0: bx - W / 2, x1: bx - 24, z0: zBack, z1: zDiv, floor: 1, label: '본관 2층 홀' });
      zones.push({ x0: bx + 24, x1: bx + W / 2, z0: zBack, z1: zDiv, floor: 1, label: '본관 2층 홀' });
    }
    zones.push({ x0: bx - W / 2, x1: bx + W / 2, z0: zDiv, z1: zFront, floor: f, label: `본관 ${floor.label} 복도` });
    // 창문(교실 바깥벽=북쪽, 복도 바깥벽=남쪽)
    floor.rooms.forEach(r => {
      if (r.type === 'hall') return;
      const [s0, s1] = r.span, cw = s1 - s0;
      [-cw / 4, cw / 4].forEach(off => {
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), mat(0xaed4ef));
        wm.position.set(bx + (s0 + s1) / 2 + off, y0 + 1.8, zBack - 0.18);
        wm.rotation.y = Math.PI;
        scene.add(wm);
      });
    });
    for (let wx = -30; wx <= 30; wx += 3) {
      if (f === 0 && Math.abs(wx) < 3.2) continue;
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.4), mat(0xaed4ef));
      wm.position.set(bx + wx, y0 + 1.8, zFront + 0.18);
      scene.add(wm);
    }
  }

  // 2층 슬래브: 교실 밴드 전체 + 복도 밴드(경사로 구멍 제외)
  const slabC = 0xd9d2c2;
  box(W, 0.25, zDiv - zBack, slabC, bx, FH - 0.25, (zBack + zDiv) / 2, { walk: true });
  box(0.5, 0.25, B.corridorDepth, slabC, bx - W / 2 + 0.25, FH - 0.25, (zDiv + zFront) / 2, { walk: true });
  box(50, 0.25, B.corridorDepth, slabC, bx, FH - 0.25, (zDiv + zFront) / 2, { walk: true });
  box(0.5, 0.25, B.corridorDepth, slabC, bx + W / 2 - 0.25, FH - 0.25, (zDiv + zFront) / 2, { walk: true });

  // 경사로(계단 대용) + 2층 난간
  const rampL = Math.hypot(6.5, FH);
  const rampAng = Math.atan2(FH, 6.5);
  const rampZ = (zDiv + zFront) / 2;
  box(rampL, 0.22, 3.1, 0xc9b8a0, bx - 28.25, FH / 2 - 0.11, rampZ, { rot: [0, 0, -rampAng], collide: false, walk: true });
  box(rampL, 0.22, 3.1, 0xc9b8a0, bx + 28.25, FH / 2 - 0.11, rampZ, { rot: [0, 0, rampAng], collide: false, walk: true });
  [[-1], [1]].forEach(([s]) => {
    const hx0 = s < 0 ? bx - 31.5 : bx + 25, hx1 = s < 0 ? bx - 25 : bx + 31.5;
    // 북쪽 난간: 경사로 꼭대기 쪽 2.2m는 2층 출입구로 비워둠
    const gapC = s < 0 ? bx - 30.4 : bx + 30.4;
    wallXGaps(hx0, hx1, [{ c: gapC, w: 2.2 }], zDiv + 0.08, FH, 1.05, 0xb08968, 0.12);
    // 복도 본체 쪽(구멍 안쪽) 난간 — 추락 방지
    wallZ(zDiv, zFront, (s < 0 ? hx1 : hx0) + (s < 0 ? 0.07 : -0.07), FH, 1.05, 0xb08968, 0.12);
  });
  sign('← 2층', bx - 23, 2.45, zDiv + 0.18, 0, 0.45);
  sign('2층 →', bx + 23, 2.45, zDiv + 0.18, 0, 0.45);

  // 지붕 + 파라펫 + 물탱크
  box(W + 0.6, 0.25, D + 0.6, B.roofColor, bx, FH * 2 - 0.25, bz);
  wallX(bx - W / 2, bx + W / 2, zFront + 0.15, FH * 2, 0.55, B.roofColor, 0.25);
  wallX(bx - W / 2, bx + W / 2, zBack - 0.15, FH * 2, 0.55, B.roofColor, 0.25);
  wallZ(zBack, zFront, bx - W / 2 - 0.15, FH * 2, 0.55, B.roofColor, 0.25);
  wallZ(zBack, zFront, bx + W / 2 + 0.15, FH * 2, 0.55, B.roofColor, 0.25);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.5, 14), mat(0xc8cdd2));
  tank.position.set(bx + 22, FH * 2 + 0.75, bz - 2);
  scene.add(tank);

  // 학교 이름 간판 + 현관 표시 + 캐노피
  sign(SCHOOL.name, bx, FH * 2 + 0.95, zFront + 0.35, 0, 1.35);
  sign('현관', bx, 3.75, zFront + 0.2, 0, 0.5);
  box(6, 0.2, 2.6, 0x9aa5ad, bx, 3.3, zFront + 1.25, { collide: false });
  [-2.6, 2.6].forEach(px => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 8), mat(0x8a949c));
    pole.position.set(bx + px, 1.65, zFront + 2.3);
    scene.add(pole);
  });

  // ---------- 교실 가구 ----------
  B.floors.forEach((floor, f) => {
    const y0 = f * FH;
    floor.rooms.forEach(r => {
      const [s0, s1] = r.span;
      const cx = bx + (s0 + s1) / 2, cw = s1 - s0;
      const deskC = 0xdeb877, darkC = 0x4a4f57;
      const addDeskRows = (cols, monitor) => {
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < 2; j++) {
            const dx = cx + (i - (cols - 1) / 2) * 1.7, dz = -32.6 + j * 1.9;
            box(0.62, 0.72, 0.45, deskC, dx, y0, dz);
            box(0.4, 0.45, 0.4, 0x8d99ae, dx, y0, dz + 0.55);
            if (monitor) box(0.5, 0.35, 0.06, darkC, dx, y0 + 0.74, dz - 0.08, { collide: false });
          }
        }
      };
      if (r.type === 'classroom' || r.type === 'computer' || r.type === 'science') {
        // 칠판(교실 안쪽 북벽)
        const bb = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(cw - 2, 4), 1.2), mat(r.type === 'science' ? 0xffffff : 0x2e6b4f));
        bb.position.set(cx, y0 + 1.7, zBack + 0.18);
        scene.add(bb);
        box(0.9, 0.85, 0.55, 0x9c6644, cx - cw / 2 + 1, y0, -34.4);
        addDeskRows(Math.min(3, Math.floor((cw - 1.5) / 1.8)), r.type === 'computer');
      } else if (r.type === 'office') {
        for (let i = 0; i < Math.max(2, Math.floor(cw / 2.4)); i++) {
          box(1.3, 0.74, 0.7, 0xb0a18e, cx + (i - 0.8) * 1.7, y0, -31.8);
        }
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 10), mat(0xa5673f));
        pot.position.set(bx + s1 - 0.7, y0 + 0.2, -35);
        scene.add(pot); colliders.push(pot);
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(0x4d8b4d));
        leaf.position.set(bx + s1 - 0.7, y0 + 0.85, -35);
        scene.add(leaf);
      } else if (r.type === 'nurse') {
        [0, 1].forEach(i => {
          box(1.05, 0.5, 1.95, 0xf2f5f7, cx - 1 + i * 2, y0, -33.5);
          box(0.6, 0.14, 0.35, 0xdfe8ee, cx - 1 + i * 2, y0 + 0.5, -34.2, { collide: false });
        });
        box(0.9, 1.6, 0.45, 0xe8edf2, cx + 1.6, y0, -35.4);
      } else if (r.type === 'cafeteria') {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            box(3.4, 0.74, 0.85, 0x9db4c0, cx - 3 + i * 3.6, y0, -33.8 + j * 2.6);
          }
        }
        box(6, 0.95, 0.9, 0xc0c6cc, cx, y0, -28.6);
      } else if (r.type === 'library') {
        const books = new THREE.MeshLambertMaterial({ map: bookStripes() });
        for (let i = 0; i < 3; i++) {
          const sx = cx - 2.4 + i * 2.4;
          box(2, 2.05, 0.5, 0x8b5e34, sx, y0, -35.2);
          [0.6, 1.25, 1.85].forEach(by => {
            const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), books);
            strip.position.set(sx, y0 + by, -34.93);
            scene.add(strip);
          });
        }
        box(2.2, 0.72, 1.1, 0xdeb877, cx, y0, -31);
        box(2.2, 0.72, 1.1, 0xdeb877, cx - 2.8, y0, -31);
      } else if (r.type === 'music') {
        box(1.5, 1.05, 0.65, 0x22223b, cx - 1, y0, -34.8);
        const keys = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.18), mat(0xffffff));
        keys.position.set(cx - 1, y0 + 0.8, -34.45);
        keys.rotation.x = -0.5;
        scene.add(keys);
        for (let i = 0; i < 4; i++) box(0.4, 0.45, 0.4, 0x9c6644, cx + 0.6 + (i % 2) * 1, y0, -33 + Math.floor(i / 2) * 1.2);
      } else if (r.type === 'broadcast') {
        box(2.4, 0.74, 0.8, 0x4a4f57, cx, y0, -34.6);
        box(0.6, 0.42, 0.08, 0x111318, cx - 0.6, y0 + 0.76, -34.7, { collide: false });
        box(0.6, 0.42, 0.08, 0x111318, cx + 0.6, y0 + 0.76, -34.7, { collide: false });
        const onair = textSign('ON AIR', { h: 0.3, bg: '#7a1f1f', fg: '#ffffff', border: null });
        onair.position.set(cx, y0 + 2.6, -35.7);
        scene.add(onair);
      }
    });
  });

  // ---------- 체육관 ----------
  const G = SCHOOL.gym;
  const [gx, gz] = G.center;
  const gx0 = gx - G.width / 2, gx1 = gx + G.width / 2;
  const gz0 = gz - G.depth / 2, gz1 = gz + G.depth / 2;
  const gh = G.wallHeight, gymC = 0xe9e1d0;
  wallX(gx0, gx1, gz0, 0, gh, gymC, 0.35);
  wallX(gx0, gx1, gz1, 0, gh, gymC, 0.35);
  wallZ(gz0, gz1, gx0, 0, gh, gymC, 0.35);
  wallZGaps(gz0, gz1, [{ c: gz, w: 3 }], gx1, 0, gh, gymC, 0.35);
  // 지붕(박공)
  const panelL = Math.hypot(G.depth / 2, 2.5) + 0.6;
  const pAng = Math.atan2(2.5, G.depth / 2);
  box(G.width + 1.4, 0.22, panelL, 0x7d8a97, gx, gh + 1.14, gz - G.depth / 4, { rot: [-pAng, 0, 0], collide: false });
  box(G.width + 1.4, 0.22, panelL, 0x7d8a97, gx, gh + 1.14, gz + G.depth / 4, { rot: [pAng, 0, 0], collide: false });
  // 바닥 코트
  const gymFloor = new THREE.Mesh(new THREE.PlaneGeometry(G.width - 0.8, G.depth - 0.8), new THREE.MeshLambertMaterial({ map: courtTexture() }));
  gymFloor.rotation.x = -Math.PI / 2;
  gymFloor.position.set(gx, 0.03, gz);
  scene.add(gymFloor);
  walkables.push(gymFloor);
  // 농구 골대 2
  [[gx0 + 2.2, 1], [gx1 - 2.2, -1]].forEach(([hx, dir]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 10), mat(0x555b62));
    pole.position.set(hx, 1.8, gz);
    scene.add(pole); colliders.push(pole);
    box(1.5, 1, 0.08, 0xf2f5f7, hx + dir * 0.45, 2.45, gz, { rot: [0, Math.PI / 2, 0], collide: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 18), mat(0xe07a2f));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(hx + dir * 0.85, 2.6, gz);
    scene.add(ring);
  });
  // 매트 + 뜀틀 + 공
  box(3, 0.14, 2, 0x4d7fb5, gx + 8, 0, gz - 6.2, { walk: true });
  [[1.15, 0.3], [0.95, 0.6], [0.75, 0.9]].forEach(([w, y], i) => box(w, 0.3, 0.75, i === 2 ? 0xd9b382 : 0xc79a63, gx + 8, y - 0.3, gz - 3.4));
  [[-4, 3.2], [3, 5.5]].forEach(([dx, dz]) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), mat(0xe07a2f));
    ball.position.set(gx + dx, 0.15, gz + dz);
    scene.add(ball);
  });
  // 높은 창
  for (let wx = gx0 + 3; wx < gx1 - 2; wx += 3.6) {
    [[gz0 - 0.22, Math.PI], [gz1 + 0.22, 0]].forEach(([wz, ry]) => {
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1), mat(0xaed4ef));
      wm.position.set(wx, 4.9, wz);
      wm.rotation.y = ry;
      scene.add(wm);
    });
  }
  sign('체육관', gx1 + 0.25, 5.4, gz, Math.PI / 2, 0.9);
  zones.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, label: '체육관' });

  // ---------- 텃밭 ----------
  const [ax, az] = SCHOOL.garden.center;
  const gdx0 = ax - 7, gdx1 = ax + 7, gdz0 = az - 7.5, gdz1 = az + 7.5;
  [[-3.5], [3.5]].forEach(([cxo]) => {
    [-5, 0, 5].forEach(zo => {
      const bed = box(5, 0.45, 1.7, 0x7a5230, ax + cxo, 0, az + zo, { walk: true });
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 7), mat(0x4d9b4d));
        sp.position.set(ax + cxo - 1.8 + i * 0.9, 0.6, az + zo + (rng() - 0.5) * 0.7);
        scene.add(sp);
      }
      const tom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(0xd94f30));
      tom.position.set(ax + cxo + 1.2, 0.55, az + zo - 0.3);
      scene.add(tom);
    });
  });
  // 울타리
  const fenceC = 0x9c6644;
  wallX(gdx0, gdx1, gdz0, 0.3, 0.1, fenceC, 0.08);
  wallX(gdx0, gdx1, gdz0, 0.65, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: ax, w: 2 }], gdz1, 0.3, 0.1, fenceC, 0.08);
  wallXGaps(gdx0, gdx1, [{ c: ax, w: 2 }], gdz1, 0.65, 0.1, fenceC, 0.08);
  [[gdx0], [gdx1]].forEach(([fx]) => {
    wallZ(gdz0, gdz1, fx, 0.3, 0.1, fenceC, 0.08);
    wallZ(gdz0, gdz1, fx, 0.65, 0.1, fenceC, 0.08);
  });
  for (let fx = gdx0; fx <= gdx1 + 0.01; fx += 3.5) {
    box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz0, { collide: false });
    if (Math.abs(fx - ax) > 1.2) box(0.12, 0.95, 0.12, fenceC, fx, 0, gdz1, { collide: false });
  }
  // 허수아비
  const scx = ax, scz = az + 2.5;
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
  const gsign = sign('우리 텃밭', ax, 1.3, gdz1 + 0.6, Math.PI, 0.55);
  box(0.09, 1.05, 0.09, 0x9c6644, ax - 0.9, 0, gdz1 + 0.6, { collide: false });
  box(0.09, 1.05, 0.09, 0x9c6644, ax + 0.9, 0, gdz1 + 0.6, { collide: false });
  zones.push({ x0: gdx0, x1: gdx1, z0: gdz0, z1: gdz1, label: '텃밭' });

  // ---------- 운동장 ----------
  const F = SCHOOL.field;
  const fplane = new THREE.Mesh(new THREE.PlaneGeometry(F.width, F.depth), new THREE.MeshLambertMaterial({ map: trackTexture() }));
  fplane.rotation.x = -Math.PI / 2;
  fplane.position.set(F.center[0], 0.012, F.center[1]);
  scene.add(fplane);
  walkables.push(fplane);
  // 축구 골대
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
  });
  zones.push({ x0: F.center[0] - F.width / 2, x1: F.center[0] + F.width / 2, z0: F.center[1] - F.depth / 2, z1: F.center[1] + F.depth / 2, label: '운동장' });

  // ---------- 놀이터 ----------
  const [px, pz] = SCHOOL.playground.center;
  box(17, 0.05, 14, 0xe8d8ae, px, 0, pz, { collide: false, walk: true });
  // 미끄럼틀
  const slX = px - 4.5, slZ = pz - 3;
  box(1.5, 0.14, 1.5, 0xf2b134, slX, 1.62, slZ, { walk: true });
  [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([lx, lz]) => box(0.1, 1.62, 0.1, 0xd8912f, slX + lx, 0, slZ + lz, { collide: false }));
  box(0.9, 0.1, 2.9, 0xe3453a, slX, 0.85, slZ + 1.95, { rot: [0.63, 0, 0], collide: false, walk: true });
  box(0.85, 0.1, 2.1, 0x9aa5ad, slX, 0.8, slZ - 1.35, { rot: [-0.95, 0, 0], collide: false, walk: true });
  // 그네
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
  // 시소 + 철봉
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
  [-3.5, 3.5].forEach(sx => box(1, 3, 1, 0xb07d62, gtx + sx, 0, gtz));
  box(9, 0.5, 0.8, 0x8d6b53, gtx, 3.05, gtz, { collide: false });
  const gateSign = sign(SCHOOL.name, gtx, 2.35, gtz, 0, 0.7);
  const gateBlock = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  gateBlock.position.set(gtx, 1.5, gtz);
  scene.add(gateBlock); colliders.push(gateBlock);
  zones.push({ x0: gtx - 6, x1: gtx + 6, z0: gtz - 4, z1: gtz + 2, label: '교문' });

  // ---------- 울타리(경계) + 나무 + 구름 ----------
  const bd = SCHOOL.bounds;
  const hedgeC = 0x4e7d3a;
  box(bd.x * 2, 0.95, 0.9, hedgeC, 0, 0, bd.zMin);
  wallXGaps(-bd.x, bd.x, [{ c: gtx, w: 9 }], bd.zMax, 0, 0.95, hedgeC, 0.9);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, -bd.x, 0, 0);
  box(0.9, 0.95, bd.zMax - bd.zMin, hedgeC, bd.x, 0, 0);

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
  for (let tz = -40; tz <= 40; tz += 10) tree(-76, tz, 1 + rng() * 0.4);
  [-24, -10, 6, 20].forEach(tx => tree(tx, -41, 1.1 + rng() * 0.3));
  tree(36, -40, 1); tree(58, -20, 0.9); tree(-38, 8, 1.1); tree(-38, 28, 1);

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
    colliders, walkables, zones, dynamic,
    spawn: new THREE.Vector3(0, 0, 38),
    buildingInfo: { zFront, zBack, zDiv, FH },
  };
}
