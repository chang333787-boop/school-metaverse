// 학교 월드 생성 — data.js 를 읽어 3D로 세움
// v0.7: 성능(공유 지오메트리·8m 격자·행렬 동결) + 사진 색감 + 상호작용 확장
//   체육관: 무대는 북쪽(입구에서 우측), 방송실·준비실·화장실 + 철문
//   급식실: 긴 식탁+빨간 둥근의자+배식대+커튼 무대, 도서관 앞 쿠션 로비
import * as THREE from 'three';
import { mergeGeometries } from '../lib/BufferGeometryUtils.js';
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
const NET_GREEN = new THREE.MeshLambertMaterial({ color: 0x2f8f4f, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
const INVIS = new THREE.MeshBasicMaterial({ visible: false });
const CURTAIN = new THREE.MeshLambertMaterial({ color: 0x2e3f66 });   // 사진: 남색 커튼
const TAEGEUK_MAT = new THREE.MeshBasicMaterial({ map: taegeukTexture() });

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
  const persons = [];              // 숨쉬기·쳐다보기 애니메이션용
  const dynamic = { flag: null, clouds: [] };
  const rng = mulberry32(20260728);

  // ---------- 청크 병합 (v0.9: draw call 1/10) ----------
  // 단색 정적 상자·면은 개별 Mesh 대신 26m 청크별 지오메트리로 합친다.
  // 색은 버텍스 컬러로 굽고(재질 1개), 이때 높이·아랫면 기반 가짜 AO도 함께 굽는다.
  const MCHUNK = 26;
  const buckets = new Map();       // 'cx_cz' → { geos: [], lamps: [] }
  const staticEntries = [];        // 병합된 아이템의 충돌/레이 등록 { key, aabb, solid }
  const NONIDX = new Map();        // base geometry → { g(비인덱스), f(정점별 AO 계수), bb }
  function baseOf(geo) {
    let e = NONIDX.get(geo);
    if (!e) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.computeBoundingBox();
      const bb = g.boundingBox;
      const pos = g.attributes.position, nor = g.attributes.normal;
      const span = Math.max(1e-6, bb.max.y - bb.min.y);
      const isFlat = geo.type === 'PlaneGeometry' || geo.type === 'CircleGeometry';   // 평면류: 높이 그라디언트 무의미
      const f = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        let v = isFlat ? 1 : 0.85 + 0.17 * ((pos.getY(i) - bb.min.y) / span);
        if (nor.getY(i) < -0.5) v *= 0.78;          // 아랫면(처마 밑·슬래브 밑) 어둡게
        f[i] = Math.min(1.03, v);
      }
      e = { g, f, bb };
      NONIDX.set(geo, e);
    }
    return e;
  }
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _eu = new THREE.Euler();
  const _vp = new THREE.Vector3(), _vs = new THREE.Vector3(), _vc = new THREE.Vector3();
  const _col = new THREE.Color();
  function geoAdd(base, colorHex, px, py, pz, rot, sx, sy, sz) {
    const { g, f, bb } = baseOf(base);
    const geo = g.clone();
    _eu.set(rot ? rot[0] || 0 : 0, rot ? rot[1] || 0 : 0, rot ? rot[2] || 0 : 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(px, py + YOFF, pz), _q, _vs.set(sx, sy, sz));
    geo.applyMatrix4(_m4);
    _col.set(colorHex);
    const n = geo.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      cols[i * 3] = _col.r * f[i];
      cols[i * 3 + 1] = _col.g * f[i];
      cols[i * 3 + 2] = _col.b * f[i];
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const key = Math.floor(px / MCHUNK) + '_' + Math.floor(pz / MCHUNK);
    let b = buckets.get(key);
    if (!b) { b = { geos: [], lamps: [] }; buckets.set(key, b); }
    b.geos.push(geo);
    // AABB: base 바운딩박스 8모서리를 변환해 계산
    let minX = 1e9, minY = 1e9, minZ = 1e9, maxX = -1e9, maxY = -1e9, maxZ = -1e9;
    for (let ci = 0; ci < 8; ci++) {
      _vc.set(ci & 1 ? bb.max.x : bb.min.x, ci & 2 ? bb.max.y : bb.min.y, ci & 4 ? bb.max.z : bb.min.z);
      _vc.applyMatrix4(_m4);
      minX = Math.min(minX, _vc.x); maxX = Math.max(maxX, _vc.x);
      minY = Math.min(minY, _vc.y); maxY = Math.max(maxY, _vc.y);
      minZ = Math.min(minZ, _vc.z); maxZ = Math.max(maxZ, _vc.z);
    }
    return { key, aabb: { minX, maxX, minY: minY - 0.02, maxY: maxY + 0.02, minZ, maxZ } };
  }
  // 나무용 공유 베이스
  const TRUNK_GEO = new THREE.CylinderGeometry(0.14, 0.2, 1.4, 8);
  const PTRUNK_GEO = new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8);
  const ICO_GEO = new THREE.IcosahedronGeometry(1, 0);
  const CONE_GEO = new THREE.ConeGeometry(1, 1, 8);
  const STUMP_GEO = new THREE.CylinderGeometry(0.3, 0.34, 1, 9);
  const CIRC_GEO = new THREE.CircleGeometry(1, 18);
  const CANOPY = [0x4d8b4d, 0x55924f, 0x5e9c53, 0x467e49, 0x63a457];

  // ---------- 지형 단차 (사진: 학교 부지가 운동장보다 1m 높음) ----------
  // z <= TERR_Z(-18) = 학교 테라스(y0), z > TERR_Z = 운동장 레벨(y -1)
  const TERR_Z = -18;
  let YOFF = 0;                      // 남측(운동장 레벨) 구역 생성 시 -1로 설정
  const terrY = z => (z > TERR_Z ? -1 : 0);

  // ---------- 공용 헬퍼 ----------
  function box(w, h, d, color, cx, baseY, cz, opt = {}) {
    if (!opt.material) {
      // 병합 경로 (단색 정적 — YOFF는 geoAdd에서 한 번만 적용)
      const r = geoAdd(UNIT_BOX, color, cx, baseY + h / 2, cz, opt.rot, w, h, d);
      staticEntries.push({ key: r.key, aabb: r.aabb, solid: opt.collide !== false });
      return null;
    }
    const m = new THREE.Mesh(UNIT_BOX, opt.material);
    m.scale.set(w, h, d);
    m.position.set(cx, baseY + YOFF + h / 2, cz);
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
    if (typeof colorOrMat === 'number') {
      const r = geoAdd(UNIT_PLANE, colorOrMat, x, y, z, [-Math.PI / 2, 0, 0], w, d, 1);
      staticEntries.push({ key: r.key, aabb: r.aabb, solid: false });
      return null;
    }
    const m = new THREE.Mesh(UNIT_PLANE, colorOrMat);
    m.scale.set(w, d, 1);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + YOFF, z);
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
    geoAdd(UNIT_PLANE, 0xaed4ef, x, y, z, [0, rotY, 0], w, h, 1);
  }
  function lamp(x, y, z, alongX = true) {   // 형광등: 조명 대신 항상 밝은 박스 (청크별 병합)
    const { g } = baseOf(UNIT_BOX);
    const geo = g.clone();
    _m4.compose(_vp.set(x, y, z), _q.identity(), _vs.set(alongX ? 1.7 : 0.22, 0.05, alongX ? 0.22 : 1.7));
    geo.applyMatrix4(_m4);
    const key = Math.floor(x / MCHUNK) + '_' + Math.floor(z / MCHUNK);
    let b = buckets.get(key);
    if (!b) { b = { geos: [], lamps: [] }; buckets.set(key, b); }
    b.lamps.push(geo);
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
  const MAT_PERSON = new THREE.MeshLambertMaterial({ vertexColors: true });
  function person(x, y, z, yaw, name, girl, opts = {}) {
    const g = new THREE.Group();
    const sc = opts.small ? 0.6 : opts.teacher ? 0.98 : 0.78;   // small=유치원생
    const shirtC = opts.teacher ? (girl ? 0xc76b8e : 0x4a6fa5) : SHIRTS[Math.floor(rng() * SHIRTS.length)];
    const pantsC = 0x5a6b8c, skinC = 0xf6cfa4;
    const hairC = HAIRS[Math.floor(rng() * HAIRS.length)];
    // 몸 전체를 지오메트리 1개로 병합 (그룹 로컬 좌표)
    const parts = [];
    const partAdd = (color, px, py, pz, sx, sy, sz) => {
      const { g: bg, f } = baseOf(UNIT_BOX);
      const geo = bg.clone();
      _m4.compose(_vp.set(px, py, pz), _q.identity(), _vs.set(sx, sy, sz));
      geo.applyMatrix4(_m4);
      _col.set(color);
      const n = geo.attributes.position.count;
      const cols = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        cols[i * 3] = _col.r * f[i];
        cols[i * 3 + 1] = _col.g * f[i];
        cols[i * 3 + 2] = _col.b * f[i];
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      parts.push(geo);
    };
    partAdd(pantsC, 0.11, 0.25, 0, 0.16, 0.5, 0.19);
    partAdd(pantsC, -0.11, 0.25, 0, 0.16, 0.5, 0.19);
    partAdd(shirtC, 0, 0.775, 0, 0.5, 0.55, 0.3);
    partAdd(shirtC, 0.31, 0.78, 0, 0.13, 0.5, 0.15);
    partAdd(shirtC, -0.31, 0.78, 0, 0.13, 0.5, 0.15);
    partAdd(skinC, 0, 1.3, 0, 0.5, 0.48, 0.46);
    partAdd(hairC, 0, 1.58, 0, 0.54, 0.15, 0.5);
    if (girl) partAdd(hairC, 0, 1.28, -0.26, 0.54, 0.55, 0.12);
    const bodyMesh = new THREE.Mesh(mergeGeometries(parts, false), MAT_PERSON);
    bodyMesh.castShadow = true;
    g.add(bodyMesh);
    const tag = textSign(name, { h: 0.26, fontPx: 36, pad: 12 });
    tag.position.y = 1.95;
    g.add(tag);
    g.scale.setScalar(sc);
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    scene.add(g);
    interactables.push({ type: 'person', x, y, z, name, group: g, lines: opts.lines || null, li: 0 });
    persons.push({ group: g, x, z, yaw0: yaw, sc });
    return g;
  }

  // ---------- 하늘/땅 (기준 지면 = 운동장 레벨 y-1, 학교 테라스 슬래브 = y0) ----------
  const ground = new THREE.Mesh(UNIT_PLANE, mat(0x7cb85c));
  ground.scale.set(320, 240, 1);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  scene.add(ground);
  walkables.push(ground);
  // 학교 테라스 (사진: 건물 부지가 운동장보다 높음)
  box(164, 1, 52, 0x7cb85c, 0, -1, TERR_Z - 26, { walk: true });
  // 옹벽(축대) 전면
  box(98, 1.02, 0.35, 0xb5af9f, 6, -1.02, TERR_Z + 0.12, { collide: false });

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
    // 실내 천장은 밝은 아이보리 (지붕 밑면 노출 방지)
    geoAdd(UNIT_PLANE, 0xf2efe8, (x0 + x1) / 2, y - 0.27, (z0 + z1) / 2, [Math.PI / 2, 0, 0], x1 - x0, z1 - z0, 1);
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
    box(0.4, 0.05, 0.4, 0xd97f2e, chX, y0 + 0.4, z, { collide: false });   // 사진: 주황 의자
    box(0.06, 0.5, 0.4, 0xd97f2e, chX + 0.17, y0 + 0.45, z, { collide: false });
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
    // 교직원 NPC (data.js staff — 실명 대신 직함)
    const st = SCHOOL.staff && SCHOOL.staff[r.name];
    if (st) {
      st.forEach(([nm, gd, sz], i) => {
        person(cx - Math.min(cw / 2 - 1.2, 2.4) + i * 1.5, y0, at(3.0 + (i % 2) * 1.5),
          faceIn, nm, gd === '여', sz === 'small' ? { small: true } : { teacher: true });
      });
    }
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
      // 후면(복도쪽) 사물함 — 표준 교실 구성, 앞뒷문 사이
      if (cw >= 7) {
        const lkW = cw - 6.8;
        box(lkW, 1.05, 0.42, 0xe3dccc, cx, y0, at(depth - 0.45));
        const pastel = [0xf2a6b8, 0xf6c67a, 0x8fd0a8, 0x9bc1e8, 0xc9aee5, 0xf4b8a0];
        const nCub = Math.max(3, Math.floor(lkW / 0.55));
        for (let ci = 0; ci < nCub; ci++) {
          geoAdd(UNIT_PLANE, pastel[ci % pastel.length],
            cx - lkW / 2 + (ci + 0.5) * (lkW / nCub), y0 + 0.62, at(depth - 0.45) - dir * 0.23,
            [0, dir > 0 ? Math.PI : 0, 0], lkW / nCub - 0.12, 0.66, 1);
        }
      }
      // ---- 교실답게: 바닥·작품게시판·학급문고·시계·태극기·커튼·분리수거·청소함·화분 ----
      plane(cw - 0.5, depth - 0.6, 0xe3d2ac, cx, y0 + 0.095, zMid);   // 우드톤 교실 바닥
      const bbW = Math.min(depth - 4.5, 6.5);
      geoAdd(UNIT_PLANE, 0x4e7d5a, s1 - 0.21, y0 + 1.78, zMid, [0, -Math.PI / 2, 0], bbW, 1.4, 1);
      const paper = [0xffffff, 0xfff3c9, 0xffe1e7, 0xe3f2ff, 0xe9ffe3];
      for (let ai = 0; ai < 8; ai++) {
        const az = zMid + (ai % 4 - 1.5) * (bbW / 4.4);
        const ay = y0 + (ai < 4 ? 2.08 : 1.5);
        geoAdd(UNIT_PLANE, paper[Math.floor(rng() * paper.length)], s1 - 0.23, ay, az,
          [0, -Math.PI / 2, (rng() - 0.5) * 0.16], 0.44, 0.34, 1);
      }
      box(0.42, 0.72, 2.1, 0xa8825e, s1 - 0.4, y0, zMid + dir * 2.9);   // 학급문고
      [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x457b9d, 0xb56576, 0x6d9f71].forEach((bc2, bi) =>
        geoAdd(UNIT_BOX, bc2, s1 - 0.4, y0 + 0.87, zMid + dir * 2.9 + (bi - 2.5) * 0.28, null, 0.24, 0.3, 0.09));
      // 시계 + 태극기 (앞벽 위)
      geoAdd(UNIT_PLANE, 0xf7f8f9, s0 + 0.185, y0 + 2.82, zMid, [0, Math.PI / 2, 0], 0.46, 0.46, 1);
      geoAdd(UNIT_PLANE, 0x30343a, s0 + 0.19, y0 + 2.86, zMid, [0, Math.PI / 2, 0.5], 0.05, 0.17, 1);
      geoAdd(UNIT_PLANE, 0x30343a, s0 + 0.19, y0 + 2.8, zMid, [0, Math.PI / 2, -1.1], 0.05, 0.13, 1);
      const tg = new THREE.Mesh(UNIT_PLANE, TAEGEUK_MAT);
      tg.scale.set(0.54, 0.36, 1);
      tg.position.set(s0 + 0.185, y0 + 2.82, zMid - dir * 1.35);
      tg.rotation.y = Math.PI / 2;
      scene.add(tg);
      // 커튼 (창가 양끝) — 걷어둔 모습
      box(0.5, 2.3, 0.14, 0xeadfc8, s0 + 0.95, y0 + 0.75, at(0.33), { collide: false });
      box(0.5, 2.3, 0.14, 0xeadfc8, s1 - 0.95, y0 + 0.75, at(0.33), { collide: false });
      // 분리수거함 3종 + 청소도구함 (뒷문 동쪽 구석)
      [0x67b26f, 0x4d9bd6, 0xf2b134].forEach((bc3, bi) =>
        box(0.3, 0.38, 0.3, bc3, s1 - 0.55, y0, at(depth - 0.75 - bi * 0.45)));
      box(0.62, 1.5, 0.45, 0x9aa5ad, s1 - 0.62, y0, at(depth - 2.35));
      // 창가 화분
      [[s0 + 2.6], [s0 + 4.6]].forEach(([pxp]) => {
        geoAdd(STUMP_GEO, 0xa5673f, pxp, y0 + 0.19, at(0.5), null, 0.62, 0.38, 0.62);
        geoAdd(ICO_GEO, 0x4d8b4d, pxp, y0 + 0.62, at(0.5), [0, rng() * 3, 0], 0.3, 0.28, 0.3);
      });
      // ---- 실제 교실 사진 반영: 앞벽 흰 로어캐비닛·공기청정기·파스텔 서랍장·러그 ----
      box(0.45, 0.88, Math.min(depth - 3.5, 5.5), 0xf5f4f0, s0 + 0.44, y0, zMid);
      box(0.5, 1.85, 0.5, 0xf3f5f6, s0 + 0.58, y0, at(0.85));
      box(0.46, 1.05, 0.85, 0x9fd0e8, s1 - 0.44, y0, zMid - dir * 2.3);
      box(0.32, 0.24, 0.5, 0xf2d34c, s1 - 0.44, y0 + 1.05, zMid - dir * 2.3, { collide: false });
      plane(2.4, 1.7, 0xf2c9a0, cx + 0.6, y0 + 0.106, at(depth - 2.1));
      // 여닫는 사물함 2칸 (E키 — 방탈출 요소)
      if (cw >= 7) {
        const lkW2 = cw - 6.8;
        [cx - lkW2 / 2 + 0.35, cx + lkW2 / 2 - 0.35].forEach(lx4 => {
          const lg2 = new THREE.Group();
          const ld = new THREE.Mesh(UNIT_BOX, mat(0xded5c6));
          ld.scale.set(0.5, 0.62, 0.05);
          ld.position.x = 0.25;
          lg2.add(ld);
          const lh2 = new THREE.Mesh(UNIT_BOX, mat(0x8a949c));
          lh2.scale.set(0.07, 0.07, 0.09);
          lh2.position.set(0.42, 0, -dir * 0.05);
          lg2.add(lh2);
          lg2.position.set(lx4 - 0.25, y0 + 0.62, at(depth - 0.45) - dir * 0.25);
          scene.add(lg2);
          interactables.push({ type: 'locker', x: lx4, y: y0, z: at(depth - 0.45) - dir * 0.3, group: lg2, open: false, openRot: -dir * 1.85 });
        });
      }
      lamp(s0 + cw * 0.38, y0 + FH - 0.12, zMid);
      lamp(s0 + cw * 0.72, y0 + FH - 0.12, zMid);
      // 책상 수 = 학생 수 + 1 (명단 없으면 4)
      const nx = Math.max(2, Math.min(3, Math.floor((cw - 4) / 1.5) + 1));
      const nz = Math.max(2, Math.min(4, Math.floor((depth - 3) / 1.45)));
      const ppl = SCHOOL.people && SCHOOL.people[r.name];
      const nSeat = Math.min(nx * nz, ppl ? ppl.s.length + 1 : 4);
      const seats = [];
      for (let k = 0; k < nSeat; k++) {
        const i = Math.floor(k / nz), j = k % nz;
        const dx = s0 + 3.1 + i * 1.5;
        const dz = zMid + (j - (nz - 1) / 2) * 1.45;
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
      const nSh = Math.max(3, Math.floor((cw - 2.5) / 2.3));
      for (let i = 0; i < nSh; i++) {
        const sx = s0 + 1.5 + i * ((cw - 3) / Math.max(1, nSh - 1));
        box(2, 2.05, 0.5, 0x8b5e34, sx, y0, at(0.8));
        [0.6, 1.25, 1.85].forEach(by => {
          const strip = new THREE.Mesh(UNIT_PLANE, books);
          strip.scale.set(1.8, 0.42, 1);
          strip.position.set(sx, y0 + by, at(0.8) + dir * 0.27);
          strip.rotation.y = faceIn;
          scene.add(strip);
        });
      }
      box(2.2, 0.72, 1.1, 0xdeb877, cx + 1.2, y0, at(4.8));
      box(2.2, 0.72, 1.1, 0xdeb877, cx - 1.8, y0, at(4.8));
      // 낮은 서가 + 원형 러그 + 빈백 독서 코너 + 사서 데스크 (넓어진 도서관)
      box(0.5, 1.1, Math.min(depth - 5, 4.5), 0x9c6b4a, s0 + 0.55, y0, zMid + dir * 1.2);
      geoAdd(CIRC_GEO, 0xf2b96a, cx + cw / 4, y0 + 0.106, at(2.6), [-Math.PI / 2, 0, 0], 1.6, 1.6, 1);
      [[0.9, 0.4, 0xd94f6b], [-0.6, 0.9, 0x4d9bd6], [0.2, -0.7, 0x67b26f]].forEach(([ox, oz, bc5]) =>
        geoAdd(ICO_GEO, bc5, cx + cw / 4 + ox, y0 + 0.24, at(2.6) + oz, [0, rng() * 3, 0], 0.42, 0.26, 0.42));
      box(1.6, 0.78, 0.7, 0xb0a18e, s1 - 1.4, y0, at(depth - 1.3));
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
    } else if (r.type === 'hall') {
      // 현관 신발장 (양쪽 벽)
      [[s0 + 0.32, 1], [s1 - 0.32, -1]].forEach(([sx3, sd]) => {
        box(0.34, 1.15, 2.6, 0xcfc4b2, sx3, y0, zMid + dir * 1.0);
        for (let ci2 = 0; ci2 < 8; ci2++) {
          geoAdd(UNIT_PLANE, [0xf2a6b8, 0x9bc1e8, 0xf6c67a, 0x8fd0a8][ci2 % 4],
            sx3 + sd * 0.18, y0 + 0.38 + Math.floor(ci2 / 4) * 0.45,
            zMid + dir * (1.0 - 1.0 + (ci2 % 4) * 0.6 - 0.9),
            [0, sd > 0 ? Math.PI / 2 : -Math.PI / 2, 0], 0.4, 0.36, 1);
        }
      });
    }
    // 창가 화분 (사무·보건·도서·돌봄 공통 — 창밖에서 봐도 빈 방 느낌 방지)
    if (['office', 'nurse', 'library', 'daycare'].includes(r.type)) {
      geoAdd(STUMP_GEO, 0xa5673f, s0 + 1.0, y0 + 0.19, at(0.55), null, 0.6, 0.38, 0.6);
      geoAdd(ICO_GEO, 0x4d8b4d, s0 + 1.0, y0 + 0.62, at(0.55), [0, rng() * 3, 0], 0.28, 0.26, 0.28);
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
  [-15, 15].forEach(bx5 => box(1.8, 0.42, 0.42, 0xc9a06a, bx5, 0, fz0 + 0.55, { walk: true }));   // 복도 벤치

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
      // 실제 교실처럼 앞문+뒷문
      const backDoor = ['classroom', 'computer', 'science', 'daycare'].includes(r.type) && cw >= 6.5;
      if (backDoor) gaps.push({ c: s1 - 1.9, w: 1.8 });
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
      (backDoor ? [s0 + cw * 0.42, s0 + cw * 0.6] : [s0 + cw * 0.55, s0 + cw * 0.85])
        .forEach(wxp => windowPane(wxp, 2.35, zCor - 0.17, Math.PI, 1.3, 0.9));
    }
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, floor: 0, label: r.type === 'hall' ? '현관' : `본관 1층 · ${r.name}` });
  });
  [...frontEdges].filter(x => x > fx0 + 0.01 && x < fx1 - 0.01)
    .forEach(x => wallZ(zCor, fz1, x, 0, FH, innerC));
  zones.push({ x0: fx0, x1: fx1, z0: fz0, z1: zCor, floor: 0, label: '본관 1층 복도' });
  roofOver(fx0, fx1, fz0, fz1, FH, roofC);
  // 옥탑 구조물 + 환기구 (위성사진)
  box(3, 1.6, 2.4, 0xc8ccd2, 20, FH, -31);
  box(1.1, 0.7, 1.1, 0x9aa5ad, -6, FH, -33);
  box(1.1, 0.7, 1.1, 0x9aa5ad, 30, FH, -27.5);

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

  // ---------- 테라스 경계: 계단·구령대·경사로·초록 그물 펜스 (사진2·3) ----------
  for (let si = 0; si < 4; si++) {   // 현관 앞 중앙 계단 (운동장으로 내려감)
    box(5.2, 0.8 - si * 0.22, 0.42, 0xc9c4b8, hallCx, -1, TERR_Z + 0.24 + si * 0.42);
  }
  // 구령대 (테라스 가장자리, 운동장을 내려다봄)
  box(6, 0.75, 2.8, 0xd8d2c6, -6, 0, TERR_Z - 1.6, { walk: true });
  box(1.1, 0.55, 0.7, 0x9aa5ad, -6, 0.75, TERR_Z - 2.4);   // 연단
  box(1.6, 0.22, 0.5, 0xc9c4b8, -8.6, 0, TERR_Z - 0.4, { walk: true });
  box(1.6, 0.5, 0.5, 0xc9c4b8, -8.6, 0, TERR_Z - 1.1, { walk: true });
  zones.unshift({ x0: -9.2, x1: -2.8, z0: TERR_Z - 3.2, z1: TERR_Z, label: '구령대' });
  // 동·서 경사로
  [38, -34].forEach(rx2 => {
    box(3.6, 0.2, 4.8, 0xc4bfae, rx2, -0.62, TERR_Z + 1.7, { rot: [0.235, 0, 0], collide: false, walk: true });
  });
  // 테라스 위 초록 그물 펜스 (통로에만 틈)
  const netSegs = [[-40, -36.6], [-31.4, -9.6], [-2.4, hallCx - 3.2], [hallCx + 3.2, 35.4], [40.6, 52]];
  netSegs.forEach(([a, b]) => {
    box(b - a, 1.5, 0.05, 0, (a + b) / 2, 0.15, TERR_Z - 0.15, { material: NET_GREEN });
    for (let px5 = a; px5 <= b + 0.01; px5 += 4) {
      box(0.07, 1.7, 0.07, 0x2a6b3f, px5, 0, TERR_Z - 0.15, { collide: false });
    }
  });
  for (let bx3 = -38; bx3 <= 50; bx3 += 4.5) bush(bx3, TERR_Z - 1.1, 0.8 + rng() * 0.5);

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

  // ---- 급식동 (위성 검은 지붕 전체 — 식당홀을 통해 조리실→식품창고로 들어가는 구조) ----
  const kh = K.wallHeight;
  const cookZ = K.cookWallZ, lcW = LC.x[0];
  wallXGaps(kx0, kx1, [{ c: K.backDoorC, w: 1.6 }], kz0, 0, kh, wallC);   // 북벽 + 시설관리 바깥문
  makeDoor(K.backDoorC - 0.8, kz0, 1.6, 'x', { color: 0x7d848c, swing: -1 });
  wallZ(kz0, kz1, kx0, 0, kh, wallC);
  wallZGaps(kz0, kz1, [{ c: LC.yardDoorZ, w: 1.8 }], kx1, 0, kh, wallC);  // 동벽 + 마당 유리문
  lintelZ(LC.yardDoorZ, 1.8, kx1, wallC);
  makeDoor(kx1, LC.yardDoorZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  windowPane(kx1 + 0.18, 1.9, -47, Math.PI / 2, 1.4, 1.4);
  wallX(kx0, kx1, kz1, FH, kh - FH, wallC);
  roofOver(kx0, kx1, kz0, kz1, kh, K.roofColor);
  // 내부 벽: 세로복도 서벽(식당 문) · 식당|조리실 경계 · 조리실|식품창고 칸막이
  wallZGaps(kz0, kz1, [{ c: K.hallEastDoorZ, w: 1.6 }], lcW, 0, FH, innerC);
  lintelZ(K.hallEastDoorZ, 1.6, lcW, innerC);
  makeDoor(lcW, K.hallEastDoorZ - 0.8, 1.6, 'z', { swing: 1 });
  wallXGaps(kx0, lcW, [{ c: K.cookDoorC, w: 1.6 }], cookZ, 0, FH, innerC);
  lintelX(K.cookDoorC, 1.6, cookZ, innerC);
  makeDoor(K.cookDoorC - 0.8, cookZ, 1.6, 'x', { swing: 1 });
  wallZGaps(kz0, cookZ, [{ c: K.storeDoorZ, w: 1.4 }], 0, 0, FH, innerC);
  makeDoor(0, K.storeDoorZ - 0.7, 1.4, 'z', { swing: 1 });
  // 바닥 (식당 테라조 / 조리실 회색 / 창고 베이지)
  plane(lcW - kx0 - 0.6, kz1 - cookZ - 0.6, 0xe8e6df, (kx0 + lcW) / 2, 0.03, (cookZ + kz1) / 2);
  plane(-kx0 - 0.5, cookZ - kz0 - 0.6, 0xd8dbdd, kx0 / 2, 0.03, (kz0 + cookZ) / 2);
  plane(lcW - 0.5, cookZ - kz0 - 0.6, 0xcfc8bb, lcW / 2, 0.03, (kz0 + cookZ) / 2);
  furnish({ type: 'cafeteria', name: '급식실' }, (kx0 + lcW) / 2, lcW - kx0, 0, kz1, -1, kz1 - cookZ);
  // 작은 무대 + 남색 커튼 + 금장 트림 (체육관 사진 감성)
  box(6, 0.5, 1.6, 0x9c8a76, 1.4, 0, cookZ + 0.95, { walk: true });
  box(5.6, 2.6, 0.1, 0, 1.4, 0.5, cookZ + 0.28, { material: CURTAIN, collide: false });
  box(6.2, 0.16, 0.14, 0xd8b24a, 1.4, 3.12, cookZ + 0.24, { collide: false });
  sign('조리실', K.cookDoorC, 2.35, cookZ + 0.2, 0, 0.4);
  sign('식품창고', 0.2, 2.2, (kz0 + cookZ) / 2, Math.PI / 2, 0.34);
  // 조리실 설비 (스테인리스 조리대·큰솥·후드)
  box(3.6, 0.92, 0.95, 0xc4c9cd, -6.4, 0, kz0 + 1.6);
  box(2.6, 0.92, 0.95, 0xc4c9cd, -1.6, 0, kz0 + 1.6);
  box(3, 0.7, 0.6, 0x9aa5ad, -6.4, 2.5, kz0 + 1.55, { collide: false });
  const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.75, 12), mat(0xb8bdc2));
  pot2.position.set(-3.9, 0.38, kz0 + 1.6);
  scene.add(pot2); colliders.push(pot2);
  box(3.2, 0.92, 0.9, 0xc4c9cd, -5.5, 0, cookZ - 1.5);
  // 식품창고 선반·쌀포대·박스
  box(0.5, 1.7, 5.5, 0xb08a5e, 4.8, 0, (kz0 + cookZ) / 2);
  [[1.2, kz0 + 1.5], [2.2, kz0 + 2.2], [1.7, kz0 + 3.1]].forEach(([bx4, bz5]) =>
    box(0.7, 0.55, 0.5, 0xe8ddc4, bx4, 0, bz5));
  box(0.8, 0.8, 0.8, 0xc9a06a, 1.2, 0, cookZ - 1.3);
  [0, 1].forEach(i => lamp(-6 + i * 5, kh - 0.15, -44, true));
  lamp(-4, kh - 0.15, (kz0 + cookZ) / 2, true);
  sign('급식실', K.doorC + 1.7, 2.42, fz0 + 0.18, 0, 0.45);
  for (let wx = kx0 + 2.5; wx < kx1 - 1.5; wx += 4) windowPane(wx, 3.1, kz0 - 0.18, Math.PI, 2, 1);
  zones.push({ x0: kx0, x1: lcW, z0: cookZ, z1: kz1, floor: 0, label: '본관 1층 · 급식실' });
  zones.push({ x0: kx0, x1: 0, z0: kz0, z1: cookZ, floor: 0, label: '급식실 · 조리실' });
  zones.push({ x0: 0, x1: lcW, z0: kz0, z1: cookZ, floor: 0, label: '급식실 · 식품창고' });
  const D = K.dutyRoom;
  wallX(D.x[0], D.x[1], D.z[0], 0, FH, innerC);
  wallZ(D.z[0], D.z[1], D.x[1], 0, FH, innerC);
  sign('당직실', D.doorC + 1.2, 2.42, fz0 + 0.18, 0, 0.4);
  box(1.3, 0.74, 0.7, 0xb0a18e, (D.x[0] + D.x[1]) / 2, 0, D.z[0] + 1.2);
  box(1.05, 0.5, 1.95, 0xf2f5f7, D.x[1] - 0.8, 0, (D.z[0] + D.z[1]) / 2);
  zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], floor: 0, label: '본관 1층 · 당직실' });

  // ---- 세로복도 (급식동 안 내부 통로 — 외벽·지붕은 급식동이 담당) ----
  [-52, -47, -42].forEach(lz => lamp(6.9, kh - 0.15, lz, false));
  zones.push({ x0: LC.x[0], x1: LC.x[1], z0: ez0, z1: kz1, floor: 0, label: '본관 1층 복도' });

  // ---- 동관 ----
  const shed = E.rooms.find(r => r.external);
  const shedC = shed ? (shed.span[0] + shed.span[1]) / 2 : null;
  wallXGaps(LC.x[1], ex1, shed ? [{ c: shedC, w: 1.8 }] : [], ez0, 0, FH, wallC);
  if (shed) {
    lintelX(shedC, 1.8, ez0, wallC);
    makeDoor(shedC - 0.9, ez0, 1.8, 'x', { glass: true, swing: -1 });
    sign(shed.name, shedC, 2.4, ez0 - 0.25, Math.PI, 0.45);
  }
  for (let wx = LC.x[1] + 1.4; wx < (shed ? shed.span[0] : ex1) - 1.5; wx += 3.5) {
    windowPane(wx, 1.9, ez0 - 0.18, Math.PI, 2.2, 1.5);
    windowPane(wx, 1.9, ez0 + 0.18, 0, 2.2, 1.5);
  }
  wallZ(ez0, ez1, ex1, 0, FH, wallC);   // 동 외벽 (바깥문 없음 — 빨강 표시에 없음)
  wallX(ex0, ex1, ez1, 0, FH, wallC);
  wallZ(zCorE, ez1, ex0, 0, FH, wallC);
  const eBack = r => (r.type === 'classroom' || r.type === 'science') && r.span[1] - r.span[0] >= 6.5;
  const eGaps = E.rooms.filter(r => !r.external && !r.innerOnly).flatMap(r => {
    const g = [{ c: doorCOf(r), w: 1.8 }];
    if (eBack(r)) g.push({ c: r.span[1] - 1.9, w: 1.8 });
    return g;
  });
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, FH, innerC);
  wallXGaps(ex0, ex1, eGaps, zCorE, 0, 0.95, wainC, 0.34);
  eGaps.forEach(g => lintelX(g.c, g.w, zCorE, innerC));
  for (let lx = ex0 + 3; lx < ex1 - 1; lx += 6) lamp(lx, FH - 0.12, (ez0 + zCorE) / 2);
  const eEdges = new Set();
  E.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    eEdges.add(s0); eEdges.add(s1);
    if (!r.external && !r.innerOnly) {
      const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
      sign(label, doorCOf(r), 2.42, zCorE - 0.18, 0, 0.45);
      makeDoor(doorCOf(r) - 0.9, zCorE, 1.8, 'x', { swing: -1 });
      if (eBack(r)) makeDoor(s1 - 1.9 - 0.9, zCorE, 1.8, 'x', { swing: -1 });
      (eBack(r) ? [s0 + cw * 0.42, s0 + cw * 0.6] : [s0 + cw * 0.55, s0 + cw * 0.85])
        .forEach(wxp => windowPane(wxp, 2.35, zCorE - 0.17, Math.PI, 1.3, 0.9));
    }
    furnish(r, cx, cw, 0, ez1, -1, ez1 - zCorE);
    [-cw / 4, cw / 4].forEach(off => windowPane(cx + off, 1.75, ez1 + 0.18, 0, 2.2, 1.6));
    zones.push({ x0: s0, x1: s1, z0: zCorE, z1: ez1, floor: 0, label: `본관 1층 · ${r.name}` });
  });
  const eInner = new Map(E.rooms.filter(r => r.innerOnly).map(r => [r.span[0], r.name]));
  [...eEdges].filter(x => x > ex0 + 0.01 && x < ex1 - 0.01)
    .forEach(x => {
      if (eInner.has(x)) {   // 과학준비실: 과학실 안에서 들어가는 문
        const zm2 = (zCorE + ez1) / 2;
        wallZGaps(zCorE, ez1, [{ c: zm2, w: 1.4 }], x, 0, FH, innerC);
        makeDoor(x, zm2 - 0.7, 1.4, 'z', { swing: 1 });
        sign(eInner.get(x), x - 0.18, 2.15, zm2, -Math.PI / 2, 0.32);
      } else wallZ(zCorE, ez1, x, 0, FH, innerC);
    });
  roofOver(LC.x[1], ex1, ez0, ez1, FH, roofC);
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
    const upGaps = [{ c: doorCOf(r), w: 1.8 }];
    if (r.type === 'classroom' && cw >= 6.5) upGaps.push({ c: s1 - 1.9, w: 1.8 });
    wallXGaps(s0, s1, upGaps, zCor2, FH, FH, innerC);
    upGaps.forEach(gp => {
      lintelX(gp.c, gp.w, zCor2, innerC, FH);
      makeDoor(gp.c - 0.9, zCor2, 1.8, 'x', { swing: 1, y: FH });
    });
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
  roofOver(ux0, ux1, uz0, uz1, FH * 2, 0xd9dce1);  // 위성: 서관 지붕은 밝은 회백색
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.5, 14), mat(0xc8cdd2));
  tank.position.set(ux0 + 4, FH * 2 + 0.75, uz0 + 3);
  scene.add(tank);

  // ---------- 체육관 (사진4·6·7·8: 무대는 북쪽=입구 우측) ----------
  const G = SCHOOL.gym;
  const [gx, gz] = G.center;
  const gx0 = gx - G.width / 2, gx1 = gx + G.width / 2;
  const gz0 = gz - G.depth / 2, gz1 = gz + G.depth / 2;
  const gh = G.wallHeight;
  const brickC = 0xa8503a, panelC = 0xd9cbb2, frameC = 0x2e7d46;   // 사진: 상단 베이지 패널
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
  // 내부 연두 골판 하단벽 (실내 사진)
  box(G.width - 1, 1.8, 0.1, 0x8fc978, gx, 0.25, gz0 + 0.45, { collide: false });
  box(G.width - 1, 1.8, 0.1, 0x8fc978, gx, 0.25, gz1 - 0.45, { collide: false });
  box(0.1, 1.8, G.depth - 1, 0x8fc978, gx0 + 0.45, 0.25, gz, { collide: false });
  box(0.1, 1.8, G.depth - 1, 0x8fc978, gx1 - 0.45, 0.25, gz, { collide: false });
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
  box(14.6, 0.14, 0.12, 0xd8b24a, -59, 3.76, gFrontZ - 0.16, { collide: false });   // 금장 트림
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
        if (wy < 3) {   // 아래 창엔 남색 커튼 (실내 사진)
          box(0.45, 2.3, 0.14, 0x2e3f66, wx - 1.22, 0.55, wz + dir * 0.55, { collide: false });
          box(0.45, 2.3, 0.14, 0x2e3f66, wx + 1.22, 0.55, wz + dir * 0.55, { collide: false });
        }
      });
    });
  }
  sign('체육관', gx1 + 0.25, gh - 1.2, gz, Math.PI / 2, 0.9);
  zones.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, label: '체육관' });

  // ---------- 유치원 놀이터 (체육관 남쪽 미니 놀이터 — 위성사진) ----------
  const kpX = -54, kpZ = -39;
  plane(10.6, 8, 0x8fae6d, kpX, 0.02, kpZ);
  const kf = 0x3f8f4f;
  wallXGaps(kpX - 5.3, kpX + 5.3, [], kpZ - 4, 0.52, 0.09, kf, 0.07);
  wallXGaps(kpX - 5.3, kpX + 5.3, [], kpZ + 4, 0.52, 0.09, kf, 0.07);
  wallZGaps(kpZ - 4, kpZ + 4, [], kpX - 5.3, 0.52, 0.09, kf, 0.07);
  wallZGaps(kpZ - 4, kpZ + 4, [{ c: kpZ, w: 1.6 }], kpX + 5.3, 0.52, 0.09, kf, 0.07);
  for (let fp = -5.3; fp <= 5.3; fp += 2.65) {
    box(0.09, 0.85, 0.09, kf, kpX + fp, 0, kpZ - 4, { collide: false });
    box(0.09, 0.85, 0.09, kf, kpX + fp, 0, kpZ + 4, { collide: false });
  }
  // 미니 미끄럼틀
  box(1.1, 0.14, 1.1, 0xf2b134, kpX - 2.8, 0.92, kpZ - 1.4, { walk: true });
  [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([ox, oz]) =>
    box(0.09, 0.92, 0.09, 0xe8863a, kpX - 2.8 + ox, 0, kpZ - 1.4 + oz, { collide: false }));
  box(0.65, 0.09, 1.9, 0xe3453a, kpX - 2.8, 0.44, kpZ - 0.05, { rot: [0.48, 0, 0], collide: false, walk: true });
  box(0.6, 0.08, 1.3, 0x9aa5ad, kpX - 2.8, 0.42, kpZ - 2.35, { rot: [-0.75, 0, 0], collide: false, walk: true });
  // 스프링 라이더 2
  [[kpX + 0.6, kpZ + 1.7, 0xd94f6b], [kpX + 2.5, kpZ - 1.1, 0x4d9bd6]].forEach(([sx4, sz4, sc4]) => {
    const spr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.34, 8), mat(0x555b62));
    spr.position.set(sx4, 0.17, sz4);
    scene.add(spr);
    box(0.6, 0.3, 0.24, sc4, sx4, 0.34, sz4);
    box(0.2, 0.22, 0.16, sc4, sx4 + 0.32, 0.5, sz4, { collide: false });
  });
  // 소형 그네
  const kgX = kpX - 0.6, kgZ = kpZ + 2.4;
  [[-0.9], [0.9]].forEach(([ox]) => box(0.08, 1.55, 0.08, 0xf2b134, kgX + ox, 0, kgZ));
  box(1.9, 0.07, 0.07, 0xf2b134, kgX, 1.55, kgZ, { collide: false });
  box(0.42, 0.05, 0.2, 0xe3453a, kgX, 0.5, kgZ, { collide: false });
  [[-0.15], [0.15]].forEach(([ox]) => box(0.025, 1.0, 0.025, 0x777777, kgX + ox, 0.55, kgZ, { collide: false }));
  sign('유치원 놀이터', kpX + 5.6, 1.5, kpZ - 3.2, Math.PI / 2, 0.4);
  zones.unshift({ x0: kpX - 5.5, x1: kpX + 5.5, z0: kpZ - 4.2, z1: kpZ + 4.2, label: '유치원 놀이터' });

  // ---------- 텃밭 (E키로 물주기) ----------
  const GA = SCHOOL.garden;
  const [axg, azg] = GA.center;
  const gaW = GA.width || 14, gaD = GA.depth || 15;
  const gdx0 = axg - gaW / 2, gdx1 = axg + gaW / 2, gdz0 = azg - gaD / 2, gdz1 = azg + gaD / 2;
  let bedIdx = 0;
  for (let bcx = gdx0 + 3.5; bcx <= gdx1 - 3.4; bcx += 6.5) {
    for (let bcz = gdz0 + 1.9; bcz <= gdz1 - 1.8; bcz += 2.6) {
      box(5, 0.42, 1.7, 0x24262c, bcx, 0, bcz, { walk: true });   // 사진: 검은 멀칭 이랑
      const crop = bedIdx % 6;
      for (let i = 0; i < 6; i++) {
        const sx5 = bcx - 2 + i * 0.8, szr = bcz + (rng() - 0.5) * 0.5;
        if (crop === 0) geoAdd(ICO_GEO, 0x7fc26b, sx5, 0.55, szr, [0, rng() * 3, 0], 0.2, 0.14, 0.2);
        else if (crop === 1) geoAdd(ICO_GEO, 0x6d3a52, sx5, 0.55, szr, [0, rng() * 3, 0], 0.2, 0.13, 0.2);
        else if (crop === 2) geoAdd(STUMP_GEO, 0x4d9b4d, sx5, 0.62, szr, null, 0.06, 0.5, 0.06);
        else if (crop === 3) {   // 토마토 + 지지대 (사진)
          geoAdd(UNIT_BOX, 0x8a8378, sx5, 0.85, szr, null, 0.04, 0.9, 0.04);
          geoAdd(ICO_GEO, 0x4d8b4d, sx5, 0.75, szr, [0, rng() * 3, 0], 0.16, 0.22, 0.16);
          if (i % 2) geoAdd(ICO_GEO, 0xd94f30, sx5 + 0.08, 0.6, szr + 0.06, null, 0.07, 0.07, 0.07);
        } else if (crop === 4) geoAdd(ICO_GEO, 0xe8863a, sx5, 0.52, szr, null, 0.1, 0.09, 0.1);
        else geoAdd(ICO_GEO, 0x55924f, sx5, 0.55, szr, [0, rng() * 3, 0], 0.17, 0.15, 0.17);
      }
      // 학년 팻말 (사진: 이랑마다 검은 원형 팻말)
      const gsign2 = textSign(`${(bedIdx % 6) + 1}학년`, { h: 0.2, bg: '#24262c', fg: '#ffffff', border: null, fontPx: 40, pad: 12 });
      gsign2.position.set(bcx - 2.75, 0.72, bcz);
      gsign2.rotation.y = Math.PI / 2;
      scene.add(gsign2);
      geoAdd(UNIT_BOX, 0x555b62, bcx - 2.75, 0.35, bcz, null, 0.04, 0.72, 0.04);
      bedIdx++;
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
  const fenceC = 0xf2f4f6;   // 사진: 흰 장식 펜스
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
  const bn2 = textSign('2026 학교 치유텃밭 프로그램 운영', { h: 0.3, bg: '#ffffff', fg: '#3a7d44', border: '#7fc26b' });
  bn2.position.set(axg + 4.2, 0.85, gdz1 + 0.05);
  scene.add(bn2);
  box(0.09, 1.3, 0.09, 0x9c6644, axg - 5.4, 0, gdz1 + 0.6, { collide: false });
  box(0.09, 1.3, 0.09, 0x9c6644, axg - 3.6, 0, gdz1 + 0.6, { collide: false });
  zones.push({ x0: gdx0, x1: gdx1, z0: gdz0, z1: gdz1, label: '텃밭' });

  // ---------- 운동장 (운동장 레벨 y=-1) ----------
  const F = SCHOOL.field;
  YOFF = -1;
  const fplane = new THREE.Mesh(UNIT_PLANE, new THREE.MeshLambertMaterial({ map: trackTexture() }));
  fplane.scale.set(F.width, F.depth, 1);
  fplane.rotation.x = -Math.PI / 2;
  fplane.position.set(F.center[0], -0.988, F.center[1]);
  scene.add(fplane);
  walkables.push(fplane);
  function goalAt(gxp, gcz, s, sc) {   // s=개구 방향(±1), sc=크기 배율
    [-2.6 * sc, 2.6 * sc].forEach(zo => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2 * sc, 8), mat(0xffffff));
      post.position.set(gxp, -1 + sc, gcz + zo);
      scene.add(post); colliders.push(post);
    });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2 * sc, 8), mat(0xffffff));
    bar.rotation.x = Math.PI / 2;
    bar.position.set(gxp, -1 + 2 * sc, gcz);
    scene.add(bar);
    box(0.12, 2 * sc, 5.4 * sc, 0, gxp + s * 1.1 * sc, 0, gcz, { material: NET });
    [-2.7 * sc, 2.7 * sc].forEach(zo => box(1.15 * sc, 2 * sc, 0.1, 0, gxp + s * 0.55 * sc, 0, gcz + zo, { material: NET }));
    box(1.15 * sc, 0.08, 5.4 * sc, 0, gxp + s * 0.55 * sc, 1.95 * sc, gcz, { material: NET, collide: false });
  }
  goalAt(F.center[0] - (F.width / 2 - 18), F.center[1], -1, 1);
  goalAt(F.center[0] + (F.width / 2 - 18), F.center[1], 1, 1);
  // 미니 골대 한 쌍 (사진2)
  goalAt(-4, 22, -1, 0.55);
  goalAt(16, 22, 1, 0.55);
  // 야간 조명탑 (사진2·3)
  [[-38, 30], [48, 27]].forEach(([lx3, lz3]) => {
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 9, 8), mat(0x9aa5ad));
    lp.position.set(lx3, 3.5, lz3);
    scene.add(lp); colliders.push(lp);
    box(2.0, 0.4, 0.28, 0x6b7178, lx3, 8, lz3, { collide: false });
    [-0.6, 0, 0.6].forEach(ox => box(0.3, 0.26, 0.16, 0, lx3 + ox, 8.42, lz3, { material: BASIC_WHITE, collide: false }));
  });
  zones.push({ x0: F.center[0] - F.width / 2, x1: F.center[0] + F.width / 2, z0: F.center[1] - F.depth / 2, z1: F.center[1] + F.depth / 2, label: '운동장' });

  // ---------- 놀이터 ----------
  const [px, pz] = SCHOOL.playground.center;
  box(17, 0.05, 14, 0xb4b8bd, px, 0, pz, { collide: false, walk: true });   // 사진: 회색 벽돌 포장
  // 자전거 교통안전 코스 (서쪽 별도 포장 — 노란 라인 + 숫자 타일)
  const rcx = px - 14, rcz = pz - 0.5;
  box(12, 0.05, 11, 0xb4b8bd, rcx, 0, rcz, { collide: false, walk: true });
  box(7, 0.014, 0.32, 0xf2c531, rcx, 0.05, rcz - 3.2, { collide: false });
  box(7, 0.014, 0.32, 0xf2c531, rcx, 0.05, rcz + 3.2, { collide: false });
  box(0.32, 0.014, 6.7, 0xf2c531, rcx - 3.35, 0.05, rcz, { collide: false });
  box(0.32, 0.014, 6.7, 0xf2c531, rcx + 3.35, 0.05, rcz, { collide: false });
  const t13 = textSign('13', { h: 0.7, bg: '#3aa8a0', fg: '#ffffff', border: null });
  t13.rotation.x = -Math.PI / 2;
  t13.position.set(rcx + 2.1, 0.06, rcz - 1.9);
  scene.add(t13);
  const t6 = textSign('6', { h: 0.7, bg: '#4d9bd6', fg: '#ffffff', border: null });
  t6.rotation.x = -Math.PI / 2;
  t6.position.set(rcx - 1.9, 0.06, rcz + 2.1);
  scene.add(t6);
  zones.unshift({ x0: rcx - 6, x1: rcx + 6, z0: rcz - 5.5, z1: rcz + 5.5, label: '자전거 교통 코스' });
  const slX = px - 4.5, slZ = pz - 3;
  box(1.7, 0.14, 1.7, 0x9c7a53, slX, 1.62, slZ, { walk: true });
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([lx, lz]) => box(0.12, 1.62, 0.12, 0x8a6a45, slX + lx, 0, slZ + lz, { collide: false }));
  [-0.34, 0.34].forEach(ox => box(0.55, 0.09, 2.9, 0xccd2d8, slX + ox, 0.85, slZ + 1.95, { rot: [0.63, 0, 0], collide: false, walk: true }));
  [-0.68, 0, 0.68].forEach(ox => box(0.08, 0.16, 2.9, 0x9aa5ad, slX + ox, 0.9, slZ + 1.95, { rot: [0.63, 0, 0], collide: false }));
  box(0.85, 0.1, 2.1, 0xa9805a, slX, 0.8, slZ - 1.35, { rot: [-0.95, 0, 0], collide: false, walk: true });
  const swX = px + 4.5, swZ = pz + 3.5;
  const swbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), mat(0x3a6ea5));
  swbar.rotation.z = Math.PI / 2;
  swbar.position.set(swX, 1.25, swZ);
  scene.add(swbar);
  [[-1.7], [1.7]].forEach(([sx]) => {
    [[-0.5], [0.5]].forEach(([zz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), mat(0x3a6ea5));
      leg.position.set(swX + sx, 0.15, swZ + zz);
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
    bb.position.set(px + 3.5, bh - 1, pz - 3.5 + zo);
    scene.add(bb);
  });
  zones.push({ x0: px - 8.5, x1: px + 8.5, z0: pz - 7, z1: pz + 7, label: '놀이터' });

  // ---------- 숲놀이터 (통나무 징검다리 + 균형 통나무) ----------
  [[-3, -8.6, 0.34], [-1.4, -9.7, 0.46], [0.4, -9.2, 0.58], [2, -8.3, 0.46], [3.5, -9.4, 0.34]].forEach(([ox, oz, h]) => {
    const st = geoAdd(STUMP_GEO, 0x9c7a53, px + ox, h / 2, pz + oz, null, 1, h, 1);
    staticEntries.push({ key: st.key, aabb: st.aabb, solid: true });
    geoAdd(STUMP_GEO, 0xc9a06a, px + ox, h + 0.005, pz + oz, null, 0.86, 0.012, 0.86);  // 나이테 단면
  });
  const lg = geoAdd(STUMP_GEO, 0x8a6a45, px - 6.8, 0.42, pz - 5.2, [0, 0, Math.PI / 2], 0.9, 4.4, 0.9);
  staticEntries.push({ key: lg.key, aabb: lg.aabb, solid: false });
  [[-9], [-4.6]].forEach(([ox]) => {
    const sp2 = geoAdd(STUMP_GEO, 0x9c7a53, px + ox, 0.16, pz - 5.2, null, 1, 0.32, 1);
    staticEntries.push({ key: sp2.key, aabb: sp2.aabb, solid: true });
  });
  zones.unshift({ x0: px - 10, x1: px + 5, z0: pz - 11, z1: pz - 7.5, label: '숲놀이터' });

  // ---------- 정자 가는 벽돌길 ----------
  box(3, 0.05, 9, 0xc97f5a, px, 0, pz + 11.5, { collide: false, walk: true });
  box(2.4, 0.32, 1.5, 0x8fae6d, px, 0, pz + 12, { walk: true });
  for (let i = 0; i < 6; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat([0xe8863a, 0xd94f6b, 0xf2b134][i % 3]));
    fl.position.set(px - 1 + i * 0.4, -0.55, pz + 12 + (rng() - 0.5) * 0.8);
    scene.add(fl);
  }
  const pvX = px, pvZ = pz + 16.2;
  [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([ox, oz]) => box(0.14, 2.2, 0.14, 0x8a5a3b, pvX + ox, 0, pvZ + oz));
  const pvRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.1, 6), mat(0x7a4e2d));
  pvRoof.position.set(pvX, 1.75, pvZ);
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

  // ---------- 국기게양대 (테라스 위) ----------
  YOFF = 0;
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

  // ---------- 교문 + 길 (운동장 레벨) ----------
  const [gtx, gtz] = SCHOOL.gate;
  YOFF = -1;
  box(4, 0.05, gtz - (F.center[1] + F.depth / 2), 0xd8d2c6, gtx, 0.006, (gtz + F.center[1] + F.depth / 2) / 2, { collide: false, walk: true });
  [-3.5, 3.5].forEach(sx => box(1, 3, 1, 0xb9b5aa, gtx + sx, 0, gtz));
  box(9, 0.5, 0.8, 0x8a9096, gtx, 3.05, gtz, { collide: false });
  function pine(tx, tz, s = 1) {
    const keep = YOFF;
    YOFF = terrY(tz);
    const tr = geoAdd(PTRUNK_GEO, 0x7a5230, tx, 0.8 * s, tz, null, s, s, s);
    staticEntries.push({ key: tr.key, aabb: tr.aabb, solid: true });
    [[1.15, 1.9], [0.9, 2.7], [0.62, 3.4]].forEach(([r, y]) => {
      geoAdd(CONE_GEO, 0x2f6b3f, tx, y * s, tz, null, r * s, 1.1 * s, r * s);
    });
    YOFF = keep;
  }
  pine(gtx + 5.5, gtz - 2.5, 1.15);
  pine(gtx + 8.5, gtz - 1.2, 0.95);
  sign(SCHOOL.name, gtx, 1.35, gtz, 0, 0.7);
  const gateBlock = new THREE.Mesh(UNIT_BOX, INVIS);
  gateBlock.scale.set(7, 3, 0.3);
  gateBlock.position.set(gtx, 0.5, gtz);
  scene.add(gateBlock); colliders.push(gateBlock);
  zones.push({ x0: gtx - 6, x1: gtx + 6, z0: gtz - 4, z1: gtz + 2, label: '교문' });
  // 정문 디테일 (거리뷰 사진: 파란 간판·현수막·회전차단기·흰 펜스·안전 팻말)
  const gsb = textSign(SCHOOL.name, { h: 0.9, bg: '#1e4fa3', fg: '#ffffff', border: null });
  gsb.position.set(gtx + 9, 2.35, gtz - 0.6);
  scene.add(gsb);
  const gbn = textSign('함께 놀고 깨우치며 비상하는 "행복한 배움터"', { h: 0.38, bg: '#ffffff', fg: '#d94f6b', border: null });
  gbn.position.set(gtx + 9, 1.6, gtz - 0.6);
  scene.add(gbn);
  [gtx + 5.6, gtx + 12.4].forEach(px4 => box(0.16, 3.7, 0.16, 0x9aa5ad, px4, 0, gtz - 0.6));
  [-1.6, 0, 1.6].forEach(ox => {   // 회전 차단기 근사
    box(0.1, 1.1, 0.1, 0xb9bfc6, gtx + ox - 0.7, 0, gtz, { collide: false });
    box(0.1, 1.1, 0.1, 0xb9bfc6, gtx + ox + 0.7, 0, gtz, { collide: false });
    box(1.5, 0.1, 0.1, 0xb9bfc6, gtx + ox, 1.1, gtz, { collide: false });
  });
  [[gtx - 16, gtx - 4.5], [gtx + 4.5, gtx + 16]].forEach(([a, b]) => {   // 흰 펜스
    for (let fx2 = a; fx2 <= b; fx2 += 2) box(0.09, 1.15, 0.09, 0xf2f4f6, fx2, 0, gtz - 0.9, { collide: false });
    box(b - a, 0.07, 0.07, 0xf2f4f6, (a + b) / 2, 1.1, gtz - 0.9, { collide: false });
    box(b - a, 0.07, 0.07, 0xf2f4f6, (a + b) / 2, 0.6, gtz - 0.9, { collide: false });
  });
  const qsign = textSign('지진 옥외대피장소', { h: 0.32, bg: '#f2c94c', fg: '#1d3557', border: null });
  qsign.position.set(gtx - 5.5, 0.25, gtz - 0.95);
  scene.add(qsign);
  // 서쪽 담 너머 비닐하우스 (풍경 — 지형 레벨별)
  [6, -26].forEach(gz2 => {
    const keep2 = YOFF;
    YOFF = terrY(gz2);
    box(6, 1.9, 26, 0xdfe4e8, -89, 0, gz2, { collide: false });
    box(5, 1.0, 26, 0xcdd5da, -89, 1.9, gz2, { collide: false });
    YOFF = keep2;
  });

  // ---------- 울타리 + 투명 경계벽 + 나무 + 구름 ----------
  // ---------- 북측 주차장 + 창고 + 후문 (위성사진) ----------
  plane(52, 9, 0xb9bdc2, 6, 0.011, -64.5);
  for (let lx2 = -16; lx2 <= 28; lx2 += 2.75) {
    geoAdd(UNIT_BOX, 0xe8ebee, lx2, 0.03, -67.2, null, 0.09, 0.02, 4.2);
    geoAdd(UNIT_BOX, 0xe8ebee, lx2, 0.03, -61.6, null, 0.09, 0.02, 4.2);
  }
  [[36, -63.5], [43.5, -61.8]].forEach(([sx2, sz2]) => {
    box(5, 2.4, 4, 0xdfe3e8, sx2, 0, sz2);
    box(5.6, 0.28, 4.6, 0x2f6fd0, sx2, 2.4, sz2, { collide: false });
  });
  // 노란 스쿨버스 (사진)
  box(2.3, 1.5, 5.2, 0xf2c531, 28, 0.5, -64.5);
  box(2.32, 0.32, 5.2, 0xf5f6f7, 28, 2.0, -64.5, { collide: false });
  geoAdd(UNIT_PLANE, 0x2b3a4c, 26.83, 1.55, -64.5, [0, -Math.PI / 2, 0], 4.2, 0.62, 1);
  geoAdd(UNIT_PLANE, 0x2b3a4c, 29.17, 1.55, -64.5, [0, Math.PI / 2, 0], 4.2, 0.62, 1);
  geoAdd(UNIT_PLANE, 0x2b3a4c, 28, 1.5, -61.85, [0, Math.PI, 0], 1.9, 0.75, 1);
  [[-0.85, -63], [0.85, -63], [-0.85, -66], [0.85, -66]].forEach(([ox, wz3]) => {
    const wh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 10), mat(0x24262c));
    wh2.rotation.z = Math.PI / 2;
    wh2.position.set(28 + ox, 0.34, wz3);
    scene.add(wh2);
  });
  zones.push({ x0: -20, x1: 48, z0: -69.5, z1: -59.5, label: '주차장' });

  const bd = SCHOOL.bounds;
  const hedgeC = 0x4e7d3a;
  // 북측(테라스 레벨): 생울타리 + 후문
  YOFF = 0;
  wallXGaps(-bd.x, bd.x, [{ c: -30, w: 6 }], bd.zMin, 0, 0.95, hedgeC, 0.9);
  [-33.5, -26.5].forEach(px3 => box(0.8, 2.2, 0.8, 0xb9b5aa, px3, 0, bd.zMin));
  sign('후문', -30, 2.0, bd.zMin + 0.6, 0, 0.5);
  // 서·동 생울타리 — 테라스 구간(y0)
  box(0.9, 0.95, TERR_Z - bd.zMin, hedgeC, -bd.x, 0, (bd.zMin + TERR_Z) / 2);
  box(0.9, 0.95, TERR_Z - bd.zMin, hedgeC, bd.x, 0, (bd.zMin + TERR_Z) / 2);
  // 남측(운동장 레벨): 교문 옆 흰 펜스 + 서쪽 생울타리
  YOFF = -1;
  wallXGaps(-bd.x, bd.x, [{ c: gtx, w: 9 }], bd.zMax, 0, 1.1, 0xeef1f3, 0.25);
  box(0.9, 0.95, bd.zMax - TERR_Z, hedgeC, -bd.x, 0, (TERR_Z + bd.zMax) / 2);
  // 동측 남쪽 구간: 흰 장식 펜스 + 개나리 덤불 (사진3 감성)
  for (let fz3 = TERR_Z + 1; fz3 <= bd.zMax - 0.5; fz3 += 2.2) {
    box(0.09, 1.25, 0.09, 0xf2f4f6, bd.x, 0, fz3, { collide: false });
  }
  box(0.07, 0.07, bd.zMax - TERR_Z - 1, 0xf2f4f6, bd.x, 1.15, (TERR_Z + bd.zMax) / 2, { collide: false });
  box(0.07, 0.07, bd.zMax - TERR_Z - 1, 0xf2f4f6, bd.x, 0.62, (TERR_Z + bd.zMax) / 2, { collide: false });
  box(0.3, 1.3, bd.zMax - TERR_Z, 0, bd.x, 0, (TERR_Z + bd.zMax) / 2, { material: INVIS });
  for (let bz4 = TERR_Z + 3; bz4 <= bd.zMax - 2; bz4 += 5) {
    bush(bd.x - 2.2, bz4, 0.9 + rng() * 0.5, rng() < 0.5 ? 0xd9c84a : 0x8aa04a);   // 개나리
  }
  // 전신주 + 전선 (사진3)
  [[-6], [14], [34]].forEach(([pz5]) => {
    const pole5 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 8.5, 8), mat(0x8a8378));
    pole5.position.set(bd.x - 1.2, 3.25, pz5);
    scene.add(pole5); colliders.push(pole5);
    box(1.7, 0.12, 0.12, 0x6b5d4f, bd.x - 1.2, 7.9, pz5, { collide: false });
  });
  [[4], [24]].forEach(([mz]) => {
    box(0.035, 0.035, 20, 0x2b2b2b, bd.x - 1.65, 7.75, mz, { collide: false });
    box(0.035, 0.035, 20, 0x2b2b2b, bd.x - 0.75, 7.75, mz, { collide: false });
  });
  YOFF = 0;
  // 경계 투명벽 (양 레벨 모두 커버)
  box(bd.x * 2 + 2, 8, 0.6, 0, 0, -1.2, bd.zMin, { material: INVIS });
  box(bd.x * 2 + 2, 8, 0.6, 0, 0, -1.2, bd.zMax, { material: INVIS });
  box(0.6, 8, bd.zMax - bd.zMin + 2, 0, -bd.x, -1.2, (bd.zMin + bd.zMax) / 2, { material: INVIS });
  box(0.6, 8, bd.zMax - bd.zMin + 2, 0, bd.x, -1.2, (bd.zMin + bd.zMax) / 2, { material: INVIS });

  function tree(tx, tz, s = 1) {
    const keep = YOFF;
    YOFF = terrY(tz);
    const r = geoAdd(TRUNK_GEO, 0x8b5e34, tx, 0.7 * s, tz, null, s, s, s);
    staticEntries.push({ key: r.key, aabb: r.aabb, solid: true });
    const c1 = CANOPY[Math.floor(rng() * CANOPY.length)];
    const c2 = CANOPY[Math.floor(rng() * CANOPY.length)];
    const ry = rng() * Math.PI;
    geoAdd(ICO_GEO, c1, tx, 1.9 * s, tz, [0, ry, 0], 1.05 * s, 0.95 * s, 1.05 * s);
    geoAdd(ICO_GEO, c2, tx + 0.45 * s, 2.5 * s, tz + 0.2 * s, [0, ry + 1, 0], 0.7 * s, 0.66 * s, 0.7 * s);
    geoAdd(ICO_GEO, c2, tx - 0.5 * s, 2.2 * s, tz - 0.25 * s, [0, ry + 2, 0], 0.55 * s, 0.5 * s, 0.55 * s);
    YOFF = keep;
  }
  function bush(tx, tz, s = 1, color) {
    const keep = YOFF;
    YOFF = terrY(tz);
    geoAdd(ICO_GEO, color || CANOPY[Math.floor(rng() * CANOPY.length)], tx, 0.34 * s, tz, [0, rng() * 3, 0], 0.5 * s, 0.38 * s, 0.5 * s);
    YOFF = keep;
  }
  for (let tz = -35; tz <= 35; tz += 10) tree(70, tz, 1 + rng() * 0.4);
  for (let tz = -30; tz <= 40; tz += 10) tree(-80, tz, 1 + rng() * 0.4);
  [-30, -8, 10, 26].forEach(tx => tree(tx, -68, 1.1 + rng() * 0.3));
  tree(58, -20, 0.9);
  // 건물 앞 관목 줄
  for (let bx2 = fx0 + 2; bx2 < fx1 - 1; bx2 += 4.2) {
    if (Math.abs(bx2 - hallCx) > 3.2) bush(bx2, fz1 + 1.15, 1 + rng() * 0.5);
  }
  // 건물 앞 가로수 줄 (위성사진: 남측 전면에 촘촘한 원형 수관)
  for (let tx2 = fx0 + 4; tx2 <= fx1 - 3; tx2 += 7) {
    if (Math.abs(tx2 - hallCx) < 4 || Math.abs(tx2 - SCHOOL.flagPole[0]) < 3) continue;
    tree(tx2, fz1 + 2.3, 0.72 + rng() * 0.3);
  }
  // ---------- 거대나무 (랜드마크 — 개별 메시, 산들바람에 흔들림) ----------
  const [btx, btz] = SCHOOL.bigTree;
  {
    const parts = [];
    const bt = (base, color, px2, py2, pz2, rot, sx, sy, sz) => {
      const { g, f } = baseOf(base);
      const geo = g.clone();
      _eu.set(rot ? rot[0] || 0 : 0, rot ? rot[1] || 0 : 0, rot ? rot[2] || 0 : 0);
      _q.setFromEuler(_eu);
      _m4.compose(_vp.set(px2, py2, pz2), _q, _vs.set(sx, sy, sz));
      geo.applyMatrix4(_m4);
      _col.set(color);
      const n = geo.attributes.position.count;
      const cols = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        cols[i * 3] = _col.r * f[i];
        cols[i * 3 + 1] = _col.g * f[i];
        cols[i * 3 + 2] = _col.b * f[i];
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      parts.push(geo);
    };
    bt(TRUNK_GEO, 0x7a5230, 0, 2.4, 0, null, 3.4, 3.4, 3.4);
    bt(TRUNK_GEO, 0x7a5230, 1.1, 4.7, 0.4, [0, 0, -0.5], 1.5, 2.2, 1.5);
    bt(TRUNK_GEO, 0x7a5230, -1.0, 4.9, -0.3, [0, 0, 0.55], 1.3, 2.0, 1.3);
    bt(ICO_GEO, 0x4d8b4d, 0, 6.6, 0, null, 3.6, 3.0, 3.6);
    bt(ICO_GEO, 0x55924f, 2.0, 7.6, 0.8, [0, 1, 0], 2.4, 2.0, 2.4);
    bt(ICO_GEO, 0x467e49, -2.1, 7.2, -0.7, [0, 2, 0], 2.2, 1.9, 2.2);
    bt(ICO_GEO, 0x63a457, 0.4, 8.9, -0.2, [0, 3, 0], 1.9, 1.6, 1.9);
    bt(ICO_GEO, 0x55924f, -1.2, 6.3, 1.7, [0, 4, 0], 1.8, 1.5, 1.8);
    const btMesh = new THREE.Mesh(mergeGeometries(parts, false), MAT_PERSON);
    btMesh.castShadow = true;
    const btGroup = new THREE.Group();
    btGroup.add(btMesh);
    btGroup.position.set(btx, terrY(btz), btz);
    scene.add(btGroup);
    dynamic.bigTree = btGroup;
    const keep3 = YOFF;
    YOFF = terrY(btz);
    box(1.3, 4.6, 1.3, 0, btx, 0, btz, { material: INVIS });
    // 우드 데크 + 피크닉 테이블 (사진: 나무 아래 데크 쉼터)
    box(8.5, 0.14, 6, 0x9c6b4a, btx - 0.4, 0, btz + 1.4, { walk: true });
    [[btx - 2.7, btz + 1.3], [btx + 1.9, btz + 2.5]].forEach(([tx3, tz3]) => {
      box(1.5, 0.1, 0.7, 0x8a5a3b, tx3, 0.62, tz3);
      box(0.12, 0.62, 0.6, 0x8a5a3b, tx3 - 0.6, 0.14, tz3, { collide: false });
      box(0.12, 0.62, 0.6, 0x8a5a3b, tx3 + 0.6, 0.14, tz3, { collide: false });
      box(1.5, 0.09, 0.32, 0x9c6b4a, tx3, 0.34, tz3 - 0.62, { walk: true });
      box(1.5, 0.09, 0.32, 0x9c6b4a, tx3, 0.34, tz3 + 0.62, { walk: true });
    });
    YOFF = keep3;
    zones.unshift({ x0: btx - 5.5, x1: btx + 5.5, z0: btz - 5.5, z1: btz + 5.5, label: '큰 나무' });
  }

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

  // ---------- 청크 병합 flush ----------
  const MAT_CHUNK = new THREE.MeshLambertMaterial({ vertexColors: true });
  const chunkMeshes = new Map();
  buckets.forEach((b, key) => {
    if (b.geos.length) {
      const mesh = new THREE.Mesh(mergeGeometries(b.geos, false), MAT_CHUNK);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      chunkMeshes.set(key, mesh);
      b.geos.length = 0;
    }
    if (b.lamps.length) {
      const lm = new THREE.Mesh(mergeGeometries(b.lamps, false), BASIC_WHITE);
      scene.add(lm);
      b.lamps.length = 0;
    }
  });

  // ---------- 성능: 정적 행렬 동결 + 8m 격자 ----------
  scene.traverse(o => { o.matrixAutoUpdate = false; o.updateMatrix(); });
  doors.forEach(d => { d.group.matrixAutoUpdate = true; });
  persons.forEach(p => { p.group.matrixAutoUpdate = true; });
  if (dynamic.bigTree) dynamic.bigTree.matrixAutoUpdate = true;
  interactables.forEach(t => { if (t.type === 'locker') t.group.matrixAutoUpdate = true; });
  dynamic.clouds.forEach(c => { c.matrixAutoUpdate = true; });
  if (dynamic.flag) dynamic.flag.matrixAutoUpdate = true;
  scene.updateMatrixWorld(true);

  // 그림자 굽기 대상: colliders만 cast(투명·투명벽 제외), walkables만 receive
  // 문·구름·국기는 cast 금지 (움직이면 유령 그림자)
  colliders.forEach(m => {
    if (m.material && m.material.visible !== false && !m.material.transparent) m.castShadow = true;
  });
  walkables.forEach(m => { m.receiveShadow = true; });

  const CELL = 8;
  const grid = new Map();
  function gridInsert(e) {
    for (let gxc = Math.floor(e.aabb.minX / CELL); gxc <= Math.floor(e.aabb.maxX / CELL); gxc++) {
      for (let gzc = Math.floor(e.aabb.minZ / CELL); gzc <= Math.floor(e.aabb.maxZ / CELL); gzc++) {
        const k = gxc + ':' + gzc;
        let arr = grid.get(k);
        if (!arr) { arr = []; grid.set(k, arr); }
        arr.push(e);
      }
    }
  }
  const solidSet = new Set(colliders);
  const tmpB = new THREE.Box3();
  [...new Set([...walkables, ...colliders])].forEach(m => {
    tmpB.setFromObject(m);
    gridInsert({
      m, solid: solidSet.has(m),
      aabb: { minX: tmpB.min.x, maxX: tmpB.max.x, minY: tmpB.min.y, maxY: tmpB.max.y, minZ: tmpB.min.z, maxZ: tmpB.max.z },
    });
  });
  // 병합된 정적 아이템: 레이 대상은 자기 청크 메시, 충돌은 개별 AABB
  staticEntries.forEach(se => {
    const mesh = chunkMeshes.get(se.key);
    if (!mesh) return;
    gridInsert({ m: mesh, solid: se.solid, aabb: se.aabb });
  });

  // R키 탈출 지점 (복도·마당·운동장 등 안전한 곳)
  const safePoints = [
    { x: 6.15, y: 0, z: -29 },
    { x: -20, y: 0, z: -36.2 }, { x: 0, y: 0, z: -36.2 }, { x: 20, y: 0, z: -36.2 },
    { x: 6.9, y: 0, z: -46 },
    { x: 24, y: 0, z: -56.2 },
    { x: 24, y: 0, z: -41 },
    { x: 0, y: -1, z: 20 },
    { x: -60, y: 0, z: -52 },
    { x: -26, y: FH, z: -39.7 },
  ];

  return {
    colliders, walkables, zones, dynamic, doors, interactables, npcs, persons,
    grid, CELL, safePoints,
    spawn: new THREE.Vector3(0, 0, 38),
    buildingInfo: { zFront: fz1, zBack: -58, zDiv: zCor, FH },
  };
}
