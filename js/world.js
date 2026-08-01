// 학교 월드 생성 — data.js 를 읽어 3D로 세움
// v0.7: 성능(공유 지오메트리·8m 격자·행렬 동결) + 사진 색감 + 상호작용 확장
//   체육관: 무대는 북쪽(입구에서 우측), 방송실·준비실·화장실 + 철문
//   급식실: 긴 식탁+빨간 둥근의자+배식대+커튼 무대, 도서관 앞 쿠션 로비
import * as THREE from 'three';
import { mergeGeometries } from '../lib/BufferGeometryUtils.js';
import { SCHOOL } from './data.js';
import { textSign, taegeukTexture, trackTexture, courtTexture, bookStripes, netTexture, shade, cardTone, mosaicTexture, rubbleTexture, clockFace, compassRose, courseTexture, ovalRailTexture } from './textures.js';

// ---- 공유 지오메트리/재질 (성능 예산: geometries 최소화) ----
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const M = {};
// ⚠️ 모든 단색은 shade() 를 지나야 한다 (팔레트 8앵커 + 알베도 압축).
//    개별 hex 를 손보지 말고 textures.js 의 상수를 조정할 것.
function mat(color) {
  const c = shade(color);
  if (!M[c]) M[c] = new THREE.MeshLambertMaterial({ color: c });
  return M[c];
}
// 실내용 밝은 사본 (같은 색은 한 번만 만든다)
const M_IN = new Map();
function matLift(src) {
  let m = M_IN.get(src);
  if (!m) {
    m = src.clone();
    m.color.setRGB(Math.min(1, src.color.r * 1.26), Math.min(1, src.color.g * 1.11), src.color.b * 0.95);
    M_IN.set(src, m);
  }
  return m;
}
const BASIC_WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });        // 형광등
// 반투명 면은 depthWrite 를 꺼야 서로를 가리거나 앞뒤가 뒤집히지 않는다
const GLASS = new THREE.MeshLambertMaterial({ color: 0xcfe8f7, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
const GLASS_DOOR = new THREE.MeshLambertMaterial({ color: 0xa8d4ec, transparent: true, opacity: 0.6 });   // 유리문 인지성↑
const NET = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
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
  // ⚠️ 렉 사고(2026-08-01): 서측 밀도 급증으로 26m 청크가 비대해져 카메라 4레이+지면 레이가
  //    매 프레임 청크 전체 삼각형을 검사(BVH 없음) → 서측 5.3ms/프레임. 13m로 쪼개 레이 비용 1/4.
  const MCHUNK = 13;
  const buckets = new Map();       // 'cx_cz' → { geos: [], lamps: [] }
  // ⚠️ 밟을 수 없는 장식(나뭇잎·덤불 등) 전용 버킷.
  //    지면 판정(`_groundAt`)은 병합 청크 메시 **전체**에 레이를 쏘기 때문에,
  //    같은 청크에 들어가면 나뭇잎 위에 올라설 수 있게 된다.
  //    이 버킷의 메시는 grid 에 등록하지 않아 레이가 통과한다.
  const softGeos = [];
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
  // ---------- 실내 채움광 (조사 S-4) ----------
  // 채움광(hemi)을 줄여 바깥에 그늘을 만들면 **실내가 같이 어두워진다**. 실내엔 태양이 안 드니까.
  // 실내 색만 따뜻하게 살짝 올려 형광등 아래 느낌을 만든다. 런타임 비용 0(빌드 때 색에 굽는다).
  // 부수효과: 바깥이 한색·실내가 난색이라 **창 너머로 따뜻한 교실이 보이는 그림**이 생긴다.
  // ⚠️ 상자는 벽면보다 0.2m 안쪽 — 외벽 자체는 밝아지면 안 된다.
  const INDOOR_BOXES = [
    [-39.8, 39.8, -37.8, -24.2, 7.0],    // 앞줄
    [-39.8, -12.2, -49.8, -38.2, 7.0],   // 서관 (2층 포함)
    [-10.4, 8.2, -57.8, -38.2, 4.6],     // 급식동 + 세로복도
    [8.6, 39.4, -57.8, -44.6, 3.5],      // 동관
    [-74.8, -45.2, -64.8, -45.2, 8.2],   // 체육관
  ];
  // ⚠️ 값의 근거: 실내는 태양이 없어 HemisphereLight 만 받는데, **위를 향한 면(바닥)은
  //    skyColor(파랑)를 그대로 받아** 따뜻한 나무 바닥이 회녹색이 된다.
  //    그래서 lift 는 '밝게'가 아니라 **하늘색의 역수**로 잡는다(빨강↑ 파랑↓).
  const INDOOR_LIFT = [1.26, 1.11, 0.95];
  function isIndoor(x, y, z) {
    for (let i = 0; i < INDOOR_BOXES.length; i++) {
      const b = INDOOR_BOXES[i];
      if (x > b[0] && x < b[1] && z > b[2] && z < b[3] && y < b[4]) return true;
    }
    return false;
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
    _col.set(shade(colorHex));
    const lift = isIndoor(px, py + YOFF, pz) ? INDOOR_LIFT : null;
    const n = geo.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      cols[i * 3] = Math.min(1, _col.r * f[i] * (lift ? lift[0] : 1));
      cols[i * 3 + 1] = Math.min(1, _col.g * f[i] * (lift ? lift[1] : 1));
      cols[i * 3 + 2] = Math.min(1, _col.b * f[i] * (lift ? lift[2] : 1));
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
  /** 밟을 수 없는 장식용. geoAdd 와 동일하게 변환하되 충돌·레이 대상이 아니다. */
  function geoSoft(base, colorHex, px, py, pz, rot, sx, sy, sz) {
    const { g, f } = baseOf(base);
    const geo = g.clone();
    _eu.set(rot ? rot[0] || 0 : 0, rot ? rot[1] || 0 : 0, rot ? rot[2] || 0 : 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(px, py + YOFF, pz), _q, _vs.set(sx, sy, sz));
    geo.applyMatrix4(_m4);
    _col.set(shade(colorHex));
    const n = geo.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      cols[i * 3] = _col.r * f[i]; cols[i * 3 + 1] = _col.g * f[i]; cols[i * 3 + 2] = _col.b * f[i];
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    softGeos.push(geo);
    let minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
    const bb = baseOf(base).bb;
    for (let ci = 0; ci < 8; ci++) {
      _vc.set(ci & 1 ? bb.max.x : bb.min.x, ci & 2 ? bb.max.y : bb.min.y, ci & 4 ? bb.max.z : bb.min.z);
      _vc.applyMatrix4(_m4);
      minX=Math.min(minX,_vc.x); maxX=Math.max(maxX,_vc.x);
      minY=Math.min(minY,_vc.y); maxY=Math.max(maxY,_vc.y);
      minZ=Math.min(minZ,_vc.z); maxZ=Math.max(maxZ,_vc.z);
    }
    return { key: Math.floor(px / MCHUNK) + '_' + Math.floor(pz / MCHUNK),
             aabb: { minX, maxX, minY: minY - 0.02, maxY: maxY + 0.02, minZ, maxZ } };
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
    // 개별 메시(재질 지정)도 실내면 같은 채움광을 받아야 톤이 안 튄다
    if (opt.material && opt.material.color && opt.material.visible !== false &&
        !opt.material.transparent && isIndoor(cx, baseY + YOFF + h / 2, cz)) {
      opt = Object.assign({}, opt, { material: matLift(opt.material) });
    }
    const m = new THREE.Mesh(UNIT_BOX, opt.material);
    m.scale.set(w, h, d);
    m.position.set(cx, baseY + YOFF + h / 2, cz);
    if (opt.rot) m.rotation.set(opt.rot[0] || 0, opt.rot[1] || 0, opt.rot[2] || 0);
    // 눈에 안 보이는 충돌 상자는 카메라를 밀지 않고, **밟을 수도 없다**
    if (opt.noCam) m.userData.noCam = true;
    if (opt.material === INVIS) { m.userData.noRay = true; m.userData.noCam = m.userData.noCam || opt.noCam; }
    scene.add(m);
    if (opt.collide !== false) colliders.push(m);
    if (opt.walk) walkables.push(m);
    return m;
  }
  // 밟을 수 없는 장식 전용 상자 (v0.21 규칙: 지면 레이는 병합 청크 **전체**를 때리므로
  // collide:false만으로는 못 막는다 — 띠·난간처럼 올라서면 안 되는 것은 반드시 softGeos로 보낸다)
  const softBox = (w, h, d, color, cx, baseY, cz, rot) =>
    geoSoft(UNIT_BOX, color, cx, baseY + h / 2, cz, rot, w, h, d);
  // 통과는 막되 밟히지는 않는 것 (표지석·기둥) — 나무 줄기와 같은 패턴
  const solidSoftBox = (w, h, d, color, cx, baseY, cz, rot) => {
    const r = geoSoft(UNIT_BOX, color, cx, baseY + h / 2, cz, rot, w, h, d);
    staticEntries.push({ key: r.key, aabb: r.aabb, solid: true, noRay: true });
    return r;
  };
  const wallX = (x0, x1, z, y0, h, color, t = 0.3) => box(x1 - x0, h, t, color, (x0 + x1) / 2, y0, z);
  const wallZ = (z0, z1, x, y0, h, color, t = 0.3) => box(t, h, z1 - z0, color, x, y0, (z0 + z1) / 2);
  function wallXGaps(x0, x1, gaps, z, y0, h, color, t = 0.3) {
    let cur = x0;
    // ⚠️ 시작점 정렬 (spansOf와 동일 — c 정렬이면 포함된 틈 사이가 벽으로 남는다)
    [...gaps].sort((a, b) => (a.c - a.w / 2) - (b.c - b.w / 2)).forEach(g => {
      const g0 = g.c - g.w / 2, g1 = g.c + g.w / 2;
      if (g0 > cur + 0.05) wallX(cur, g0, z, y0, h, color, t);
      cur = Math.max(cur, g1);
    });
    if (cur < x1 - 0.05) wallX(cur, x1, z, y0, h, color, t);
  }
  function wallZGaps(z0, z1, gaps, x, y0, h, color, t = 0.3) {
    let cur = z0;
    [...gaps].sort((a, b) => (a.c - a.w / 2) - (b.c - b.w / 2)).forEach(g => {
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
  // 소방설비 — 실사에는 복도마다 있는데 지금까지 코드에 0개였다.
  // ⚠️ 핸드레일 밴드(y 0.955~1.045)를 피한다: 소화기는 0~0.55, 소화전 함은 1.10~1.90.
  // ⚠️ solidSoftBox — 통과는 막되 밟고 올라설 수는 없어야 한다.
  function fireExt(x, floorY, z, wallZv) {
    solidSoftBox(0.17, 0.5, 0.17, 0xc0392b, x, floorY, z);            // 몸통
    softBox(0.19, 0.06, 0.19, 0x2f3438, x, floorY + 0.5, z);          // 헤드
    softBox(0.05, 0.12, 0.05, 0x9aa0a4, x, floorY + 0.56, z);         // 손잡이
    if (wallZv !== undefined)                                          // 벽 소화기 표지
      geoAdd(UNIT_PLANE, 0xd0392e, x, 1.75, wallZv, [0, z > wallZv ? 0 : Math.PI, 0], 0.24, 0.3, 1);
  }
  function hydrant(x, z, rotY) {
    solidSoftBox(0.62, 0.8, 0.22, 0xc0392b, x, 1.10, z, [0, rotY, 0]);
    geoAdd(UNIT_PLANE, 0xf2e9d8, x + Math.sin(rotY) * 0.13, 1.5, z + Math.cos(rotY) * 0.13,
           [0, rotY, 0], 0.42, 0.26, 1);   // ⚠️ +방향·rotY 그대로 — 반대로 하면 표지가 함 뒤에서 벽을 본다
  }
  function exitLight(x, y, z, rotY) {                                  // 초록 비상구 유도등
    softBox(0.44, 0.2, 0.09, 0x2e9b57, x, y, z, [0, rotY, 0]);
    geoAdd(UNIT_PLANE, 0x8fe3b0, x + Math.sin(rotY) * 0.06, y + 0.1, z + Math.cos(rotY) * 0.06,
           [0, rotY, 0], 0.36, 0.14, 1);
  }
  // 실사: 실 이름표는 벽에 붙은 흰 팻말이 아니라 **천장에서 짧은 봉으로 내려온 파란 팻말**이다.
  // ceilY = 그 구역 천장 높이. 팻말 상단이 천장에 닿게 걸고 봉은 천장을 조금 관통시킨다(동일평면 깜빡임 방지).
  function hangSign(text, x, ceilY, z, rotY = 0, h = 0.3) {
    const s = textSign(text, { h, bg: '#2f6fd0', fg: '#ffffff', border: null, fontPx: 46, pad: 12 });
    const top = ceilY - 0.12;
    s.position.set(x, top - h / 2, z);
    s.rotation.y = rotY;
    scene.add(s);
    // 행거 봉 2개 — softBox(밟기·충돌 없음). box(collide:false)로 만들면 밟힌다
    [-1, 1].forEach(sd => {
      const ox = Math.cos(rotY) * sd * (h * 1.1), oz = -Math.sin(rotY) * sd * (h * 1.1);
      softBox(0.035, 0.16, 0.035, 0xb9bfc4, x + ox, top - 0.02, z + oz);
    });
    return s;
  }
  const glowGeos = [];
  const glassGeos = [];
  const ceilGeos = [];
  // 천장은 아래를 향한 면이라 HemisphereLight의 groundColor(잔디색)에 물들어 카키가 된다.
  // → 램버트 대신 밝은 무광 재질로 따로 병합 (실내가 칙칙해지는 주범 제거)
  function ceilAdd(x, y, z, w, d) {
    const { g } = baseOf(UNIT_PLANE);
    const gg = g.clone();
    _eu.set(Math.PI / 2, 0, 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(x, y + YOFF, z), _q, _vs.set(w, d, 1));
    gg.applyMatrix4(_m4);
    ceilGeos.push(gg);
  }
  function glowAdd(x, y, z, rotY, w, h, tint) {   // 밤 모드 불빛 사각 (평소 숨김 — 병합해 한 메시로)
    if (!tint) return;                            // 소등된 창은 아예 만들지 않음
    const { g } = baseOf(UNIT_PLANE);
    const gg = g.clone();
    _eu.set(0, rotY, 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(x + Math.sin(rotY) * 0.03, y + YOFF, z + Math.cos(rotY) * 0.03), _q, _vs.set(w * 0.9, h * 0.9, 1));
    gg.applyMatrix4(_m4);
    _col.set(tint);
    const n = gg.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { cols[i * 3] = _col.r; cols[i * 3 + 1] = _col.g; cols[i * 3 + 2] = _col.b; }
    gg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    glowGeos.push(gg);
  }
  // 창별 점등 여부·색온도 (결정적) — 전 창이 똑같이 켜지면 생활감이 없다
  let glowN = 0;
  const GLOW_TINTS = [0xffd98c, 0xffe6ad, 0xffcf72, 0xf6f0d8, 0xffdb96];
  function glowRoll() {
    const r = ((glowN++ * 2654435761) % 997) / 997;
    return r < 0.24 ? 0 : GLOW_TINTS[Math.floor(r * 100) % GLOW_TINTS.length];
  }
  function glassAdd(x, y, z, rotY, w, h) {   // 진짜 뚫린 창의 유리 — 전부 1개 메시로 병합
    const { g } = baseOf(UNIT_PLANE);
    const gg = g.clone();
    _eu.set(0, rotY, 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(x, y + YOFF, z), _q, _vs.set(w, h, 1));
    gg.applyMatrix4(_m4);
    glassGeos.push(gg);
  }
  // 창틀 새시 + 세로살. d>0.2 = 벽을 관통하는 진짜 창(양면 새시 + 양면 불빛)
  function paneTrim(x, y, z, rotY, w, h, d = 0.09) {
    // ⚠️ 오프셋 0.045 고정 — 0.035면 bar 가장자리 면이 **창 개구 벽면과 정확히 동일평면**이 되어
    //    전 학교 모든 창턱·창측이 반짝인다(평면 스캔으로 적발: y1.10 위향 겹침 계열의 정체)
    geoAdd(UNIT_BOX, 0xe8ecef, x, y + h / 2 + 0.045, z, [0, rotY, 0], w + 0.14, 0.07, d);
    geoAdd(UNIT_BOX, 0xe8ecef, x, y - h / 2 - 0.045, z, [0, rotY, 0], w + 0.14, 0.07, d);
    const tx4 = Math.cos(rotY) * (w / 2 + 0.045), tz4 = -Math.sin(rotY) * (w / 2 + 0.045);
    geoAdd(UNIT_BOX, 0xe8ecef, x + tx4, y, z + tz4, [0, rotY, 0], 0.07, h + 0.14, d);
    geoAdd(UNIT_BOX, 0xe8ecef, x - tx4, y, z - tz4, [0, rotY, 0], 0.07, h + 0.14, d);
    geoAdd(UNIT_BOX, 0xdde2e6, x, y, z, [0, rotY, 0], 0.045, h, Math.max(0.06, d - 0.05));
    const tint = glowRoll();          // 창 하나당 1번만 굴려 앞뒤 면이 같은 상태
    if (d > 0.2) {
      const ox = Math.sin(rotY) * (d / 2 + 0.01), oz = Math.cos(rotY) * (d / 2 + 0.01);
      glowAdd(x + ox, y, z + oz, rotY, w, h, tint);
      glowAdd(x - ox, y, z - oz, rotY + Math.PI, w, h, tint);
    } else {
      glowAdd(x, y, z, rotY, w, h, tint);
    }
  }
  function windowPane(x, y, z, rotY, w = 1.8, h = 1.4) {   // 불투명 스티커 창 (내부가 없는 벽용)
    geoAdd(UNIT_PLANE, 0xaed4ef, x, y, z, [0, rotY, 0], w, h, 1);
    paneTrim(x, y, z, rotY, w, h);
  }
  // 개구부를 뺀 남은 구간 목록 (실내 마감판 계산용)
  function spansOf(x0, x1, gaps) {
    const out = []; let cur = x0;
    // ⚠️ 정렬은 반드시 '시작점' 기준 — 중심(c) 기준이면 큰 틈이 나중에 와서
    //    그 안에 포함된 작은 틈들 사이 구간이 벽으로 살아남는다(도서관 문 앞 유령 굽도리 사고)
    [...gaps].sort((a, b) => (a.c - a.w / 2) - (b.c - b.w / 2)).forEach(g => {
      const g0 = g.c - g.w / 2, g1 = g.c + g.w / 2;
      if (g0 > cur + 0.05) out.push([cur, g0]);
      cur = Math.max(cur, g1);
    });
    if (cur < x1 - 0.05) out.push([cur, x1]);
    return out;
  }
  // 진짜 뚫린 창이 있는 X축 벽 (유리 너머 실내가 보임). doors=[{c,w,dh}] 문 개구부 포함
  // innerDir: 실내가 있는 z 방향(+1|-1). 주면 창 사이 기둥의 실내면을 실내색으로 덮는다.
  function wallXWin(x0, x1, z, color, wins, { y0 = 0, h = 3.4, sill = 1.1, wh = 1.4, doors = [], t = 0.3, innerDir = 0 } = {}) {
    const winTop = sill + wh;
    const dGaps = doors.map(d => ({ c: d.c, w: d.w }));
    wallXGaps(x0, x1, dGaps, z, y0, sill, color, t);
    wallXGaps(x0, x1, [...wins.map(g => ({ c: g.c, w: g.w })), ...dGaps], z, y0 + sill, wh, color, t);
    wallXGaps(x0, x1, doors.filter(d => (d.dh || 2.2) > winTop).map(d => ({ c: d.c, w: d.w })), z, y0 + winTop, h - winTop, color, t);
    doors.forEach(d => {
      const dh = d.dh || 2.2;
      if (dh < winTop) wallX(d.c - d.w / 2, d.c + d.w / 2, z, y0 + dh, winTop - dh, color, t);
      else if (dh < h) wallX(d.c - d.w / 2, d.c + d.w / 2, z, y0 + dh, h - dh, color, t);
    });
    wins.forEach(g => {
      glassAdd(g.c, y0 + sill + wh / 2, z, 0, g.w, wh);
      box(g.w, wh, 0.24, 0, g.c, y0 + sill, z, { material: INVIS });
      paneTrim(g.c, y0 + sill + wh / 2, z, 0, g.w, wh, t + 0.06);
    });
    if (innerDir) {   // 창 사이 기둥의 실내면 (노란 외벽이 방 안에 남던 것)
      const zi = z + innerDir * (t / 2 + 0.015), rot = innerDir > 0 ? 0 : Math.PI;
      spansOf(x0, x1, [...wins, ...dGaps]).forEach(([a, b]) =>
        geoAdd(UNIT_PLANE, innerC, (a + b) / 2, y0 + sill + wh / 2, zi, [0, rot, 0], b - a, wh, 1));
    }
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
      open: (opts.glass || opts.closed) ? false : true,   // 바깥과 통하는 문은 기본 닫힘
      axis, w, baseX: hx, baseZ: hz,
      aabb: axis === 'x'
        ? { minX: hx + 0.03, maxX: hx + w - 0.03, minY: (opts.y || 0), maxY: (opts.y || 0) + 2.2, minZ: hz - 0.1, maxZ: hz + 0.1 }
        : { minX: hx - 0.1, maxX: hx + 0.1, minY: (opts.y || 0), maxY: (opts.y || 0) + 2.2, minZ: hz + 0.03, maxZ: hz + w - 0.03 },
    };
    // 한국 학교 문법: 미닫이 — 열리면 문짝이 옆 벽 뒤로 미끄러져 겹침 (방 안을 막지 않음)
    d.slide = () => {
      const off = d.open ? d.w * 0.94 : 0;
      d.group.position.set(d.baseX - (d.axis === 'x' ? off : 0), d.y, d.baseZ - (d.axis === 'x' ? 0 : off));
    };
    d.slide();
    doors.push(d);
    return d;
  }

  // NPC 발밑 정적 그림자 (위치가 고정이라 미리 구워도 된다 — 전부 1개 메시)
  const blobGeos = [];
  function blobAt(x, y, z, sc) {
    const { g } = baseOf(CIRC_GEO);
    const gg = g.clone();
    _eu.set(-Math.PI / 2, 0, 0);
    _q.setFromEuler(_eu);
    _m4.compose(_vp.set(x, y + YOFF, z), _q, _vs.set(0.42 * sc, 0.42 * sc, 1));
    gg.applyMatrix4(_m4);
    return gg;
  }
  // 사람 NPC — E키로 말걸기 가능
  const SHIRTS = [0xe8863a, 0x67b26f, 0x4d9bd6, 0xd94f6b, 0xf2b134, 0x8e6fc9, 0x3aa8a0];
  const HAIRS = [0x3a2e28, 0x241d18, 0x4e3b2a];
  const MAT_PERSON = new THREE.MeshLambertMaterial({ vertexColors: true });
  function person(x, y, z, yaw, name, girl, opts = {}) {
    const g = new THREE.Group();
    const sc = opts.small ? 0.6 : opts.teacher ? 0.98 : 0.78;   // small=유치원생
    const shirtC = opts.teacher ? (girl ? 0xc76b8e : 0x4a6fa5) : SHIRTS[Math.floor(rng() * SHIRTS.length)];
    const pantsC = 0x5a6b8c, skinC = 0xf6cfa4;   // 피부는 partAdd 에서 'bright' 로 통과
    const hairC = HAIRS[Math.floor(rng() * HAIRS.length)];
    // 몸 전체를 지오메트리 1개로 병합 (그룹 로컬 좌표)
    const parts = [];
    const partAdd = (color, px, py, pz, sx, sy, sz) => {
      const { g: bg, f } = baseOf(UNIT_BOX);
      const geo = bg.clone();
      _m4.compose(_vp.set(px, py, pz), _q.identity(), _vs.set(sx, sy, sz));
      geo.applyMatrix4(_m4);
      _col.set(shade(color, color === skinC ? 'bright' : undefined));
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
    if (opts.sit) {
      // 앉은 자세 (의자 위): 허벅지 앞으로, 정강이 아래로
      partAdd(pantsC, 0.11, 0.06, 0.2, 0.16, 0.16, 0.38);
      partAdd(pantsC, -0.11, 0.06, 0.2, 0.16, 0.16, 0.38);
      partAdd(pantsC, 0.11, -0.15, 0.36, 0.15, 0.3, 0.17);
      partAdd(pantsC, -0.11, -0.15, 0.36, 0.15, 0.3, 0.17);
      partAdd(shirtC, 0, 0.42, 0, 0.5, 0.55, 0.3);
      partAdd(shirtC, 0.31, 0.4, 0.06, 0.13, 0.45, 0.15);
      partAdd(shirtC, -0.31, 0.4, 0.06, 0.13, 0.45, 0.15);
      partAdd(skinC, 0, 0.96, 0, 0.5, 0.48, 0.46);
      partAdd(hairC, 0, 1.24, 0, 0.54, 0.15, 0.5);
      if (girl) partAdd(hairC, 0, 0.94, -0.26, 0.54, 0.55, 0.12);
    } else {
      partAdd(pantsC, 0.11, 0.25, 0, 0.16, 0.5, 0.19);
      partAdd(pantsC, -0.11, 0.25, 0, 0.16, 0.5, 0.19);
      partAdd(shirtC, 0, 0.775, 0, 0.5, 0.55, 0.3);
      partAdd(shirtC, 0.31, 0.78, 0, 0.13, 0.5, 0.15);
      partAdd(shirtC, -0.31, 0.78, 0, 0.13, 0.5, 0.15);
      partAdd(skinC, 0, 1.3, 0, 0.5, 0.48, 0.46);
      partAdd(hairC, 0, 1.58, 0, 0.54, 0.15, 0.5);
      if (girl) partAdd(hairC, 0, 1.28, -0.26, 0.54, 0.55, 0.12);
    }
    const bodyMesh = new THREE.Mesh(mergeGeometries(parts, false), MAT_PERSON);
    // ⚠️ NPC 는 그림자를 드리우지 않는다.
    // 사람이 돌 때마다 그림자 맵을 다시 구우면 0.6초마다 화면이 한 번씩 끊기고
    // 그림자가 계단처럼 튄다(= 미세 떨림). 대신 발밑에 정적 그림자를 미리 굽는다.
    bodyMesh.castShadow = false;
    blobGeos.push(blobAt(x, y + (isIndoor(x, y + YOFF, z) ? 0.115 : 0.02), z, sc));   // 실내 바닥재(0.10) 위
    g.add(bodyMesh);
    const tag = textSign(name, { h: 0.26, fontPx: 36, pad: 12 });
    tag.position.y = opts.sit ? 1.62 : 1.95;
    g.add(tag);
    g.scale.setScalar(sc);
    g.position.set(x, y + (opts.sit ? 0.42 : 0), z);
    g.rotation.y = yaw;
    scene.add(g);
    interactables.push({ type: 'person', x, y, z, name, group: g, lines: opts.lines || null, li: 0 });
    persons.push({ group: g, x, z, yaw0: yaw, sc, tag });
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
  // 옹벽(축대) 전면 — 상면을 테라스 상면(0)보다 살짝 낮춰 z-fighting 방지
  // 테라스 상자(폭 164·중심 0)와 같은 구간을 전부 덮는다 (좁으면 체육관·텃밭 쪽에서 초록 상자 옆면이 드러남)
  box(164, 1.0, 0.35, 0xb5af9f, 0, -1.02, TERR_Z + 0.12, { collide: false });

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

  // 실사: 옥상은 평지붕 + 파라펫. **초록은 옥상 바닥(방수면)뿐이고 파라펫·처마는 흰/크림**이다.
  // 밖에서 보이는 것은 파라펫 4면뿐이라 여기가 초록이면 건물에 초록 띠가 둘러 보인다.
  const PARAPET_C = 0xe8e6de;
  // 천장은 벽 상단(y)보다 이만큼 아래. 조명·매달림 팻말이 전부 이 값을 기준으로 잡힌다.
  const CEIL_DROP = 0.27;

  function roofOver(x0, x1, z0, z1, y, color) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    // 슬래브 상면을 벽 상단(y)보다 0.1 올려 벽 윗면과의 z-fighting(옥상 반짝임) 차단
    box(x1 - x0 + 0.6, 0.3, z1 - z0 + 0.6, color, cx, y - 0.2, cz);
    // 실내 천장은 밝은 아이보리 (지붕 밑면 노출 방지)
    ceilAdd(cx, y - CEIL_DROP, cz, x1 - x0, z1 - z0);
    wallX(x0, x1, z1 + 0.15, y, 0.55, PARAPET_C, 0.25);
    wallX(x0, x1, z0 - 0.15, y, 0.55, PARAPET_C, 0.25);
    wallZ(z0, z1, x0 - 0.15, y, 0.55, PARAPET_C, 0.25);
    wallZ(z0, z1, x1 + 0.15, y, 0.55, PARAPET_C, 0.25);
    // 실사: 파라펫 위에 **흰 파이프 난간**이 둘러 있다 (옥상에서 사람이 다니는 학교 구조)
    const RY = y + 0.55, RAILC = 0xe9ecee;
    const railRun = (len, hor, rx, rz) => {          // 장식 — 밟히면 안 되므로 softBox
      softBox(hor ? len : 0.07, 0.07, hor ? 0.07 : len, RAILC, rx, RY + 0.68, rz);
      softBox(hor ? len : 0.05, 0.05, hor ? 0.05 : len, RAILC, rx, RY + 0.34, rz);
      const n = Math.max(2, Math.round(len / 3.2));
      for (let i = 0; i <= n; i++) {
        const t = -len / 2 + (len * i) / n;
        softBox(0.07, 0.75, 0.07, RAILC, rx + (hor ? t : 0), RY, rz + (hor ? 0 : t));
      }
    };
    railRun(x1 - x0 + 0.9, true, cx, z0 - 0.27);
    railRun(x1 - x0 + 0.9, true, cx, z1 + 0.27);
    railRun(z1 - z0 + 0.9, false, x0 - 0.27, cz);
    railRun(z1 - z0 + 0.9, false, x1 + 0.27, cz);
    // 옥상 진입 차단: 난간 위 투명 벽 (카메라 클램프 대상에선 제외 — userData.noCam)
    const guard = (w, d, gx3, gz3) => {
      const m = box(w, 2.6, d, 0, gx3, y + 0.3, gz3, { material: INVIS });
      m.userData.noCam = true;
    };
    guard(x1 - x0 + 0.9, 0.3, cx, z0 - 0.15);
    guard(x1 - x0 + 0.9, 0.3, cx, z1 + 0.15);
    guard(0.3, z1 - z0 + 0.9, x0 - 0.15, cz);
    guard(0.3, z1 - z0 + 0.9, x1 + 0.15, cz);
  }
  const lintelX = (c, w, z, color, y0 = 0) => wallX(c - w / 2, c + w / 2, z, y0 + 2.2, FH - 2.2, color);
  const lintelZ = (c, w, x, color, y0 = 0) => wallZ(c - w / 2, c + w / 2, x, y0 + 2.2, FH - 2.2, color);

  // ---- 책상+의자 ----
  function deskChair(x, y0, z, monitor) {
    box(0.5, 0.06, 0.64, 0xdeb877, x, y0 + 0.62, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x - 0.2, y0, z, { collide: false });
    box(0.05, 0.62, 0.6, 0x8a949c, x + 0.2, y0, z, { collide: false });
    box(0.5, 0.68, 0.64, 0, x, y0, z, { material: INVIS, noCam: true });
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

  // ---- 과학실 전용 세트 (실사: 연두+흰 실험대·유리 약품장 줄·모니터·나무 가로 블라인드) ----
  // ⚠️ function 선언으로 둔다(호이스팅) — 화살표 const 면 호출부(furnish 안)보다 위여야 하는 TDZ 규칙에 걸린다.
  // ⚠️ 폭은 반드시 cw 기준으로 클램프 — 상수로 박으면 좁은 방에서 벽을 뚫는다.
  function sciLab(cx, cw, y0, zB, dir, depth) {
    const at = o => zB + dir * o;
    const s0 = cx - cw / 2, s1 = cx + cw / 2;
    const bw2 = Math.min(cw - 2.6, 3.2);
    // 학생 실험대 4대 (2열 × 2줄) — 연두 몸통 + 스테인리스 상판 + 캐스터
    [-1, 1].forEach(sx => [0, 1].forEach(sz => {
      const dx = cx + sx * Math.min(cw * 0.22, 1.5), dz = at(depth * 0.42 + sz * 2.3);
      solidSoftBox(1.45, 0.78, 0.72, 0x8fc46a, dx, y0 + 0.06, dz);            // 몸통(통과 차단·밟기 불가)
      softBox(1.55, 0.06, 0.8, 0xd6dbe0, dx, y0 + 0.84, dz);                  // 스테인리스 상판
      [[-0.6, -0.28], [0.6, -0.28], [-0.6, 0.28], [0.6, 0.28]].forEach(([ox, oz]) =>
        softBox(0.08, 0.06, 0.08, 0x4a5058, dx + ox, y0, dz + oz));           // 캐스터
      softBox(0.05, 0.34, 0.42, 0x22262c, dx + sx * 0.5, y0 + 0.9, dz);       // 모니터
    }));
    // 교사용 실험대 (앞벽 쪽 — 교탁 자리)
    solidSoftBox(bw2, 0.8, 0.75, 0x8fc46a, s0 + 1.7, y0 + 0.06, at(depth * 0.18));
    softBox(bw2 + 0.1, 0.06, 0.82, 0xd6dbe0, s0 + 1.7, y0 + 0.86, at(depth * 0.18));
    // 벽면 유리 약품장 줄 (동벽) — 하부장 + 유리 상부장. ⚠️ 파스텔 서랍장은 !isSci 로 이미 뺐다
    for (let k = 0; k < 3; k++) {
      const cz = at([3.4, 7.2, 8.7][k]);   // ⚠️ 등간격이면 동벽 약품장이 과학준비실 문(z-49.8±0.7)을 침범(동선 순회 적발) — 문 앞만 비운 배열
      solidSoftBox(0.44, 0.85, 1.35, 0xeceae2, s1 - 0.24, y0, cz);            // 하부장
      solidSoftBox(0.42, 1.05, 1.35, 0xf4f2ea, s1 - 0.25, y0 + 0.9, cz);      // 상부장 프레임
      glassAdd(s1 - 0.48, y0 + 1.42, cz, Math.PI / 2, 1.2, 0.9);              // 유리문(전 월드 1메시 병합)
      softBox(0.03, 0.05, 1.3, 0x8fc46a, s1 - 0.46, y0 + 0.88, cz);           // 연두 띠
    }
    // 창가 나무 가로 블라인드 — 커튼(s1-0.95)과 안 겹치게 x 폭을 줄이고 z를 안쪽으로
    for (let k = 0; k < 5; k++)
      softBox(Math.min(cw - 3.4, 2.6), 0.04, 0.05, 0xb08d5a, cx - 0.3, y0 + 1.2 + k * 0.32, at(0.24));
  }

  // ---- 유치원 전용 세트 (실사: 저상 가구·놀이매트·캐릭터 벽화) ----
  // ⚠️ 자동 책상열(x = s0+3.1 한 줄)을 피해 s1 쪽에 놓는다 — 겹치면 책상이 매트 위에 선다.
  function kinderSet(cx, cw, y0, zB, dir, depth) {
    const at = o => zB + dir * o;
    const s0 = cx - cw / 2, s1 = cx + cw / 2;
    const mw = Math.min(cw - 3.2, 3.2);
    plane(mw, 2.4, 0xf5c9d6, s1 - mw / 2 - 0.3, y0 + 0.108, at(2.9));          // 놀이매트(분홍)
    plane(mw * 0.55, 1.5, 0xbfe3a8, s1 - mw * 0.3, y0 + 0.11, at(2.9));        // 연두 겹판
    // 저상 원형 테이블 2 + 낮은 스툴 4 (아이 치수 — 좌판 0.28이라 _blockedAt 밴드 밖: softBox로 충분)
    [[-0.9, 0], [0.9, 0]].forEach(([ox]) => {
      const tx = s1 - mw / 2 - 0.3 + ox, tz = at(2.9);
      softBox(1.0, 0.06, 1.0, 0xe8c98a, tx, y0 + 0.46, tz);
      softBox(0.12, 0.46, 0.12, 0xc9a86a, tx, y0, tz);
      [[-0.62, 0], [0.62, 0]].forEach(([sx2]) =>
        softBox(0.34, 0.28, 0.34, 0xf2a6b8, tx + sx2, y0, tz));
    });
    // 저상 교구장 (창가) + 캐릭터 벽화 띠 (굽도리 위 — 실사: 아이 그림 벽화)
    solidSoftBox(Math.min(cw - 4, 2.6), 0.62, 0.4, 0xf6c67a, cx - 0.4, y0, at(0.5));
    geoAdd(UNIT_PLANE, 0x8fd0a8, s1 - 1.4, y0 + 1.35, at(depth - 0.19), [0, dir > 0 ? Math.PI : 0, 0], 2.2, 0.7, 1);
    [[-0.6, 0xf2a6b8], [0.1, 0xf6c67a], [0.75, 0x9bc1e8]].forEach(([ox, cc]) =>
      geoAdd(UNIT_PLANE, cc, s1 - 1.4 + ox, y0 + 1.35, at(depth - 0.2), [0, dir > 0 ? Math.PI : 0, 0], 0.38, 0.44, 1));
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
        // 가구(책상 열·침대·식탁)와 안 겹치는 자리 계산
        const spread = Math.min(1.5, (cw - 2.2) / Math.max(1, st.length - 1));
        const sxp = r.name === '급식실' ? s0 + 2.2 + i * 1.6 : cx + (i - (st.length - 1) / 2) * spread;
        const szp = r.name === '급식실' ? at(depth - 1.4)
          : r.type === 'nurse' ? at(depth - 2.5)
          : at(1.9 + (i % 2) * 1.1);
        person(sxp, y0, szp, faceIn, nm, gd === '여', sz === 'small' ? { small: true } : { teacher: true });
      });
    }
    // 실 성격 플래그 — **벽 마감 블록보다 위**에 선언한다(아래에서 마감 색을 가르려면 여기서 읽어야 한다).
    // ⚠️ 과학실을 classy 에서 빼지 않는 이유: 실물 과학실에도 태극기·TV·게시판·천장 LED가 있다.
    //    빼면 그 10덩이를 전부 복제해야 하고, 비-classy 체인엔 science 케이스가 없어 빈 방이 된다.
    const isSci = r.type === 'science';
    const isKin = !!r.kinder;
    const classy = r.type === 'classroom' || r.type === 'computer' || isSci;
    // 바깥벽 실내면 마감 — 노란 외벽이 방 안에서 그대로 보이던 것을 실내 도장으로 덮는다.
    // 창 구간(약 0.95~2.55)은 비워 두고 아래 굽도리(연두)·위 띠(아이보리)만 붙인다.
    // (아래 타입별 분기에 return 이 있으므로 반드시 그 앞에서 그린다)
    if (r.type !== 'hall' && r.type !== 'toilet') {
      const skinZ = zB + dir * 0.17, skinRot = dir > 0 ? 0 : Math.PI;
      geoAdd(UNIT_PLANE, wainC, cx, y0 + 0.45, skinZ, [0, skinRot, 0], cw - 0.36, 0.9, 1);
      geoAdd(UNIT_PLANE, innerC, cx, y0 + 2.98, skinZ, [0, skinRot, 0], cw - 0.36, 0.82, 1);
      geoAdd(UNIT_BOX, 0xd8cdb2, cx, y0 + 0.92, skinZ, [0, skinRot, 0], cw - 0.36, 0.05, 0.03);   // 굽도리 몰딩
      // ⚠️ 측벽(좌우) 마감판은 넣지 않는다 — 열린 문 너머로 비스듬히 보이면
      //    '문 앞을 초록 판이 가로막는' 것처럼 보인다 (v0.16에서 실제 신고됨)
    }
    if (classy) {
      // ⚠️ bw 는 게이트 **밖**이어야 한다 — 아래 TV·게시판이 bw 를 쓴다. 안에 넣으면 전 교실 ReferenceError.
      const bw = Math.min(depth - 2.5, 4);
      if (!isSci) {                      // 과학실 앞벽은 칠판이 아니라 실험대·모니터다(실사)
      const frame = new THREE.Mesh(UNIT_PLANE, mat(0x9aa5ad));
      frame.scale.set(bw + 0.2, 1.4, 1);
      frame.position.set(s0 + 0.17, y0 + 1.7, zMid);
      frame.rotation.y = Math.PI / 2;
      scene.add(frame);
      // 초록 칠판 + 화이트보드 절반 (실제 교실: 칠판 왼쪽 + 스크린/보드 오른쪽)
      const board = new THREE.Mesh(UNIT_PLANE, mat(0x3f6b52));
      board.scale.set(bw, 1.25, 1);
      board.position.set(s0 + 0.2, y0 + 1.7, zMid);
      board.rotation.y = Math.PI / 2;
      scene.add(board);
      geoAdd(UNIT_PLANE, 0xf7f8f9, s0 + 0.21, y0 + 1.7, zMid + dir * (bw * 0.27), [0, Math.PI / 2, 0], bw * 0.42, 1.15, 1);
      box(0.12, 0.06, bw, 0xc8ccd0, s0 + 0.28, y0 + 1.02, zMid, { collide: false });   // 분필 트레이
      [-0.35, -0.15, 0.05].forEach((co, ci) =>   // 분필·지우개
        geoAdd(UNIT_BOX, ci === 2 ? 0x8a6a45 : 0xf5f5f0, s0 + 0.28, y0 + 1.09, zMid - dir * (bw * 0.3 + co), null, 0.06, 0.05, ci === 2 ? 0.16 : 0.1));
      }   // ← !isSci 칠판 세트 끝
      // 벽걸이 TV (브래킷 + 베젤 + 화면)
      box(0.05, 0.6, 0.05, 0x30343a, s0 + 0.6, y0 + 2.55, zMid + dir * (bw / 2 + 1), { collide: false });
      box(0.09, 0.78, 1.36, 0x22262c, s0 + 0.62, y0 + 1.82, zMid + dir * (bw / 2 + 1), { collide: false });
      geoAdd(UNIT_PLANE, 0x2b3a44, s0 + 0.68, y0 + 2.21, zMid + dir * (bw / 2 + 1), [0, Math.PI / 2, 0], 1.22, 0.66, 1);
      box(0.09, 0.28, 0.1, 0x4a5058, s0 + 0.62, y0 + 1.62, zMid + dir * (bw / 2 + 1), { collide: false });   // 하단 지지 브래킷
      const bulPal = [0xf2a6b8, 0xf6c67a, 0x8fd0a8, 0x9bc1e8, 0xc9aee5, 0xf4b8a0];
      const bul = new THREE.Mesh(UNIT_PLANE, mat(bulPal[Math.floor(rng() * bulPal.length)]));
      bul.scale.set(1.4, 1.05, 1);
      bul.position.set(s0 + 0.17, y0 + 1.7, zMid - dir * (bw / 2 + 1.1));
      bul.rotation.y = Math.PI / 2;
      scene.add(bul);
      // 교탁 — 칠판 앞 가운데. 다리를 달아야 '공중에 뜬 상자'로 안 보인다
      if (!isSci) {                    // 과학실은 교탁 대신 교사용 실험대
      const tdX = s0 + 1.6, tdZ = zMid + dir * 0.4;
      box(1.25, 0.08, 0.66, 0xc9b89c, tdX, y0 + 0.74, tdZ, { collide: false });
      box(1.1, 0.5, 0.56, 0xb0a18e, tdX, y0 + 0.22, tdZ, { collide: false });
      [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].forEach(([ox, oz]) =>
        box(0.06, 0.74, 0.06, 0x8a949c, tdX + ox, y0, tdZ + oz, { collide: false }));
      box(1.25, 0.82, 0.66, 0, tdX, y0, tdZ, { material: INVIS, noCam: true });
      }   // ← !isSci 교탁 끝
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
      if (!isSci) {                    // 학급문고는 교실만
      box(0.42, 0.72, 2.1, 0xa8825e, s1 - 0.4, y0, zMid + dir * 2.9);   // 학급문고
      [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x457b9d, 0xb56576, 0x6d9f71].forEach((bc2, bi) =>
        geoAdd(UNIT_BOX, bc2, s1 - 0.4, y0 + 0.87, zMid + dir * 2.9 + (bi - 2.5) * 0.28, null, 0.24, 0.3, 0.09));
      }
      // 원형 벽시계 (테두리 + 문자판 + 시침·분침) + 액자에 넣은 태극기
      geoAdd(CIRC_GEO, 0x4a5058, s0 + 0.175, y0 + 2.82, zMid, [0, Math.PI / 2, 0], 0.27, 0.27, 1);
      geoAdd(CIRC_GEO, 0xf9fafb, s0 + 0.185, y0 + 2.82, zMid, [0, Math.PI / 2, 0], 0.24, 0.24, 1);
      [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(ta =>   // 12·3·6·9 눈금
        geoAdd(UNIT_BOX, 0x8a949c, s0 + 0.192, y0 + 2.82 + Math.cos(ta) * 0.19, zMid + dir * Math.sin(ta) * 0.19,
          [0, Math.PI / 2, ta], 0.03, 0.05, 0.01));
      geoAdd(UNIT_BOX, 0x30343a, s0 + 0.195, y0 + 2.86, zMid + dir * 0.02, [0, Math.PI / 2, 0.5], 0.022, 0.15, 0.012);
      geoAdd(UNIT_BOX, 0x30343a, s0 + 0.195, y0 + 2.845, zMid - dir * 0.05, [0, Math.PI / 2, -1.15], 0.022, 0.19, 0.012);
      geoAdd(CIRC_GEO, 0x30343a, s0 + 0.2, y0 + 2.82, zMid, [0, Math.PI / 2, 0], 0.022, 0.022, 1);
      box(0.06, 0.46, 0.64, 0x8a5a3b, s0 + 0.17, y0 + 2.59, zMid - dir * 1.35, { collide: false });   // 액자 틀
      const tg = new THREE.Mesh(UNIT_PLANE, TAEGEUK_MAT);
      tg.scale.set(0.54, 0.36, 1);
      tg.position.set(s0 + 0.205, y0 + 2.82, zMid - dir * 1.35);
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
      geoAdd(UNIT_BOX, 0xdcd8cf, s0 + 0.665, y0 + 0.44, zMid, null, 0.02, 0.03, Math.min(depth - 3.5, 5.5) - 0.3);   // 캐비닛 손잡이 레일
      // 공기청정기: 송풍구 슬릿 + 표시등 (정체 인지)
      box(0.5, 1.85, 0.5, 0xf3f5f6, s0 + 0.58, y0, at(0.85));
      [0.55, 0.85, 1.15, 1.45].forEach(vy =>
        geoAdd(UNIT_BOX, 0xc4cdd4, s0 + 0.58, y0 + vy, at(0.85) - dir * 0.26, null, 0.34, 0.05, 0.02));
      geoAdd(UNIT_BOX, 0x67b26f, s0 + 0.58, y0 + 1.72, at(0.85) - dir * 0.26, null, 0.12, 0.06, 0.02);
      if (!isSci) {                    // ⚠️ 과학실 약품장과 x·z가 겹친다 — 반드시 함께 빼야 한다
      box(0.46, 1.05, 0.85, 0x9fd0e8, s1 - 0.44, y0, zMid - dir * 2.3);
      box(0.32, 0.24, 0.5, 0xf2d34c, s1 - 0.44, y0 + 1.05, zMid - dir * 2.3, { collide: false });
      }
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
      // 실사: 교실 천장은 **LED 평판등 6개(2열×3줄)** + 카세트 에어컨 + 원형 스피커.
      // ⚠️ y 는 천장(y0+FH-CEIL_DROP) 바로 아래여야 한다 — FH-0.12 는 천장 위라 안 보였다(실버그).
      const ceilY = y0 + FH - CEIL_DROP - 0.05;
      [0.34, 0.68].forEach(fxr => {
        [0.28, 0.5, 0.72].forEach(fzr => lamp(s0 + cw * fxr, ceilY, at(depth * fzr)));
      });
      softBox(0.86, 0.14, 0.86, 0xeceae2, s0 + cw * 0.5, ceilY - 0.16, at(depth * 0.24));   // 카세트 에어컨
      softBox(0.62, 0.05, 0.62, 0xc9c6bd, s0 + cw * 0.5, ceilY - 0.2, at(depth * 0.24));    // 흡입 그릴
      softBox(0.22, 0.09, 0.22, 0xe6e3da, s0 + cw * 0.5, ceilY - 0.11, at(depth * 0.76));   // 원형 스피커(근사)
      // 책상 수 = 학생 수 + 1 (명단 없으면 4)
      if (!isSci) {                    // 과학실은 학생 책상 대신 실험대
      const nx = Math.max(2, Math.min(3, Math.floor((cw - 4) / 1.5) + 1));
      const nz = Math.max(2, Math.min(4, Math.floor((depth - 3) / 1.45)));
      const ppl = SCHOOL.people && SCHOOL.people[r.name];
      const nSeat = Math.min(nx * nz, ppl ? ppl.s.length + 1 : 4);
      // 인원이 적으면 줄 수를 줄이고 가운데 정렬 (1명 반이 칠판 코앞에 몰리던 것 해소)
      const nzU = Math.max(1, Math.min(nz, Math.ceil(nSeat / Math.max(1, Math.ceil(nSeat / nz)))));
      const nxU = Math.ceil(nSeat / nzU);
      const seats = [];
      for (let k = 0; k < nSeat; k++) {
        const i = Math.floor(k / nzU), j = k % nzU;
        const dx = s0 + 3.1 + (nxU < nx ? (nx - nxU) * 0.75 : 0) + i * 1.5;
        const dz = zMid + (j - (nzU - 1) / 2) * 1.45;
        const scr = deskChair(dx, y0, dz, r.type === 'computer');
        if (scr) interactables.push({ type: 'computer', x: dx, y: y0, z: dz, mesh: scr });
        seats.push([dx, dz]);
      }
      if (ppl) {
        ppl.s.forEach(([nm, gd], k) => {
          if (k < seats.length) {
            const g = person(seats[k][0] + 0.62, y0, seats[k][1], -Math.PI / 2, nm, gd === '여',
              { sit: true, lines: ppl.lines && ppl.lines[nm] });
            npcs.set(`${r.name}:${nm}`, g);
          }
        });
        person(s0 + 2.4, y0, zMid + dir * (depth / 2 - 1.6), Math.PI / 2, '선생님', ppl.t === '여',
          { teacher: true, lines: ppl.lines && ppl.lines['선생님'] });
      }
      }   // ← !isSci 책상열·NPC 끝
      // ⚠️ 전용 세트는 반드시 이 return **앞**에서 부른다 — 아래 830줄부터는 classy 가 영원히 도달 못 한다
      if (isSci) sciLab(cx, cw, y0, zB, dir, depth);
      if (isKin) kinderSet(cx, cw, y0, zB, dir, depth);
      return;
    }
    lamp(cx, y0 + FH - CEIL_DROP - 0.05, zMid);
    if (r.type === 'daycare') {
      [[-1.6, 3.4, 0xf6c67a], [1.5, 5.6, 0x8fd0a8]].forEach(([ox, oz, tc]) => {
        box(1.7, 0.52, 1.7, tc, cx + ox, y0, at(oz));
        [[-1.05, 0], [1.05, 0], [0, -1.05], [0, 1.05]].forEach(([qx, qz]) =>
          box(0.38, 0.3, 0.38, 0xe8863a, cx + ox + qx, y0, at(oz) + qz));
      });
      plane(2.6, 1.9, 0xf2a6b8, cx + 0.9, y0 + 0.095, at(1.6));
      box(2, 1.1, 0.45, 0xd9a066, cx - cw / 2 + 1.3, y0, at(0.7));
      [0xe3453a, 0x4d9bd6, 0xf2b134].forEach((tc, i) =>
        box(0.3, 0.3, 0.3, tc, cx - cw / 2 + 0.7 + i * 0.55, y0 + 1.1, at(0.7), { collide: false }));
      box(1.6, 0.74, 0.7, 0xdeb877, cx + cw / 2 - 1.3, y0, at(depth - 2));
    } else if (r.type === 'office') {
      if (r.name === '교장실') {
        // 큰 책상 + 소파 세트 + 책장 + 교훈 액자
        box(1.9, 0.78, 0.85, 0x8a5a3b, cx, y0, at(1.3));
        box(0.55, 1.15, 0.55, 0x3a3f47, cx, y0, at(0.55));
        box(1.5, 0.72, 0.65, 0x6d4a34, cx - 0.9, y0, at(4.3));
        box(1.5, 0.72, 0.65, 0x6d4a34, cx + 0.9, y0, at(5.6));
        box(1.0, 0.42, 0.6, 0xc9b8a0, cx, y0, at(4.95), { walk: true });
        box(0.45, 1.9, Math.min(2.4, cw - 1.4), 0x8b5e34, s1 - 0.45, y0, zMid);
        const motto = textSign('꿈을 키우는 정림 어린이', { h: 0.3, bg: '#f7f3e8', fg: '#6d4a34', border: '#8a5a3b' });
        motto.position.set(cx, y0 + 2.35, at(0.25));
        motto.rotation.y = faceIn;
        scene.add(motto);
      } else if (r.name === '교무실') {
        // 마주보는 책상 4 + 파티션 + 소파 + 프린터·캐비닛
        [[-1.6, 3.4], [-1.6, 4.9], [1.4, 3.4], [1.4, 4.9]].forEach(([ox, oz]) => {
          box(1.3, 0.74, 0.7, 0xb0a18e, cx + ox, y0, at(oz));
        });
        box(0.06, 1.15, 2.6, 0x9db4c0, cx - 0.1, y0, at(4.15), { collide: false });
        box(1.4, 0.68, 0.6, 0x6d8296, s0 + 1.2, y0, at(depth - 1.4));
        box(0.6, 0.55, 0.55, 0xdfe3e8, s1 - 0.7, y0 + 0.74, at(1.0), { collide: false });
        box(0.7, 0.74, 0.6, 0xc8ccd0, s1 - 0.7, y0, at(1.0));
        box(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.55, y0, at(0.8));
      } else if (r.name === '행정실') {
        // 민원 카운터 + 뒤 사무 책상 + 서류장
        box(Math.min(2.8, cw - 1.2), 1.02, 0.5, 0xd8d2c6, cx, y0, at(depth - 1.6));
        box(1.3, 0.74, 0.7, 0xb0a18e, cx - 0.8, y0, at(2.6));
        box(1.3, 0.74, 0.7, 0xb0a18e, cx + 0.9, y0, at(1.4));
        box(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.55, y0, at(0.7));
      } else {
        // S4: 일반 사무실(원무실·소담실)이 책상+화분뿐이라 휑함 — 서류장·프린터·게시판·벽시계 보강
        const nDesk = Math.max(1, Math.round(cw / 2.2) - 1);
        for (let i = 0; i < nDesk; i++) {
          const dx8 = cx + (i - (nDesk - 1) / 2) * 1.7;
          box(1.3, 0.74, 0.7, 0xb0a18e, dx8, y0, at(4.2));
          box(0.5, 0.42, 0.5, 0x3a3f47, dx8, y0, at(3.4));                      // 의자
          box(0.34, 0.26, 0.05, 0x2f3438, dx8 - 0.25, y0 + 0.76, at(4.25), { collide: false });   // 모니터
        }
        box(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.55, y0, at(0.8));                  // 서류 캐비닛
        box(0.6, 0.55, 0.55, 0xdfe3e8, s1 - 0.75, y0 + 0.74, at(depth - 1.2), { collide: false });   // 프린터
        box(0.7, 0.74, 0.6, 0xc8ccd0, s1 - 0.75, y0, at(depth - 1.2));
        geoAdd(UNIT_PLANE, 0x6f8f6a, cx - 1.2, y0 + 1.7, at(0.22), null, 1.6, 1.0, 1);          // 게시판
        geoAdd(CIRC_GEO, 0xf4f2ea, cx + 1.4, y0 + 2.35, at(0.22), [0, faceIn, 0], 0.5, 0.5, 1);   // 벽시계
        geoAdd(CIRC_GEO, 0x3a3f47, cx + 1.4, y0 + 2.35, at(0.23), [0, faceIn, 0], 0.06, 0.06, 1);
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
        // 이불 + 접힌 깃 (맨 매트리스로 보이던 것 해소)
        box(0.98, 0.1, 1.3, 0x9bc1e8, cx - 1 + i * 2, y0 + 0.5, at(3.1), { collide: false });
        box(0.98, 0.06, 0.34, 0xf2f5f7, cx - 1 + i * 2, y0 + 0.6, at(2.5), { collide: false });
      });
      box(0.9, 1.6, 0.45, 0xe8edf2, cx + Math.min(1.6, cw / 2 - 0.75), y0, at(0.6));
      box(0.06, 1.5, 2.0, 0xf5f6f8, cx, y0 + 0.25, at(2.5), { collide: false });   // 침대 사이 커튼 스크린
      box(0.7, 0.9, 0.28, 0xf2f5f7, s0 + 0.65, y0 + 1.05, at(0.35), { collide: false });   // 약장
      geoAdd(UNIT_BOX, 0xd94848, s0 + 0.65, y0 + 1.5, at(0.5), null, 0.3, 0.08, 0.06);
      geoAdd(UNIT_BOX, 0xd94848, s0 + 0.65, y0 + 1.5, at(0.5), null, 0.08, 0.3, 0.06);
    } else if (r.type === 'cafeteria') {
      // 급식실 사진: 긴 식탁 + 빨간 둥근의자 + 배식대(스테인리스)
      // 실사(v78·사용자 확인): 식탁 긴 축은 동서가 아니라 **남북** — 4열이 나란히
      const colXs = cw >= 12 ? [cx - 4.5, cx - 1.5, cx + 1.5, cx + 4.5] : [cx - 1.5, cx + 1.5];
      const rowZs = [zMid - 1.6, zMid + 2.2];
      colXs.forEach(tx => rowZs.forEach(tz => {
        box(0.7, 0.08, 3.2, 0xb5713d, tx, y0 + 0.66, tz);
        // 식판·수저통 소품
        box(0.26, 0.04, 0.36, 0xd8dde2, tx - 0.12, y0 + 0.74, tz - 0.9, { collide: false });
        box(0.26, 0.04, 0.36, 0xd8dde2, tx + 0.12, y0 + 0.74, tz + 0.7, { collide: false });
        geoAdd(STUMP_GEO, 0x9aa5ad, tx, y0 + 0.82, tz, null, 0.28, 0.16, 0.28);
        [[-0.28, -1.4], [-0.28, 1.4], [0.28, -1.4], [0.28, 1.4]].forEach(([ox, oz]) =>
          box(0.06, 0.66, 0.06, 0xe8ebee, tx + ox, y0, tz + oz, { collide: false }));
        [-1.05, 0, 1.05].forEach(oz => [-0.66, 0.66].forEach(ox => {
          const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 10), mat(0xd94848));
          seat.position.set(tx + ox, y0 + 0.45, tz + oz);
          scene.add(seat);
          box(0.05, 0.44, 0.05, 0xe8ebee, tx + ox, y0, tz + oz, { collide: false });
          interactables.push({ type: 'chair', x: tx + ox, y: y0, z: tz + oz, yaw: ox < 0 ? Math.PI / 2 : -Math.PI / 2, msg: '맛있게 먹자! 🍚' });
        }));
      }));
      // 배식대: 조리실 접점(안쪽 벽) 앞에 가로로 — 동선 자연화
      box(5.5, 0.9, 1.0, 0xc4c9cd, cx + 0.4, y0, at(depth - 0.95));
      [[0xf5f2ea, -2.0], [0x8a5a30, -0.9], [0x67b26f, 0.2], [0xd0392e, 1.3]].forEach(([fc, ox]) =>
        box(0.6, 0.12, 0.5, fc, cx + 0.4 + ox, y0 + 0.9, at(depth - 0.95), { collide: false }));
      box(0.5, 0.3, 0.5, 0x3f9c5a, cx + 2.6, y0 + 0.9, at(depth - 0.95), { collide: false });  // 식판 더미
      // 실사(v78·사용자 확인): 남벽 전체가 **회색 주름 커튼**(뒤는 악기 보관) + 커튼 앞 트랙 스포트 1줄
      {
        const cz9 = at(0.24);
        softBox(cw - 1.2, 2.9, 0.1, 0x8b8f94, cx, y0 + 0.1, cz9);
        for (let fx9 = cx - (cw - 1.6) / 2; fx9 < cx + (cw - 1.6) / 2; fx9 += 0.55)
          softBox(0.1, 2.9, 0.13, 0x7c8085, fx9, y0 + 0.1, cz9);
        softBox(cw - 1.0, 0.18, 0.16, 0x6e7276, cx, y0 + 3.0, cz9);
        softBox(cw - 2.0, 0.06, 0.06, 0xd8dde2, cx, y0 + 3.55, at(1.1));
        for (let sx9 = cx - (cw - 3) / 2; sx9 <= cx + (cw - 3) / 2; sx9 += (cw - 3) / 5)
          lamp(sx9, y0 + 3.5, at(1.15));
      }
      // 실사: 천장 매입등 다수 — 그리드 2×3
      [cx - cw * 0.22, cx + cw * 0.22].forEach(lx9 =>
        [zMid - 3.4, zMid, zMid + 3.4].forEach(lz9 => lamp(lx9, y0 + 3.9, lz9)));
      // 실사(v78): 벽 마감 = 하부 **갈색 나무 웨인스코팅(1.1m)** + 상부 회청 — 동·서 벽 실내면
      [[s0 + 0.18, Math.PI / 2], [s1 - 0.18, -Math.PI / 2]].forEach(([wx0, wr]) => {
        geoAdd(UNIT_PLANE, 0x8a5a3b, wx0, y0 + 0.55, zMid, [0, wr, 0], depth - 0.6, 1.1, 1);
        geoAdd(UNIT_PLANE, 0x9fb3bd, wx0, y0 + 2.4, zMid, [0, wr, 0], depth - 0.6, 2.4, 1);
      });
      // 원형 벽시계(동벽) + 배식창 위 아이 그림 배너
      geoAdd(UNIT_PLANE, 0xf5f2ea, s1 - 0.2, y0 + 2.6, zMid - 2, [0, -Math.PI / 2, 0], 0.5, 0.5, 1);
      geoAdd(UNIT_PLANE, 0x2f3438, s1 - 0.21, y0 + 2.6, zMid - 2, [0, -Math.PI / 2, 0], 0.06, 0.3, 1);
      const kbn = textSign('🍚 오늘도 맛있게, 골고루!', { h: 0.3, bg: '#fdf3d0', fg: '#d94f6b', border: '#f2b134', fontPx: 40, pad: 12 });
      kbn.position.set(cx + 0.4, y0 + 2.2, at(depth - 1.55));
      scene.add(kbn);
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
      const lowStrip = new THREE.Mesh(UNIT_PLANE, books);
      lowStrip.scale.set(Math.min(depth - 5, 4.5) - 0.4, 0.5, 1);
      lowStrip.position.set(s0 + 0.82, y0 + 0.62, zMid + dir * 1.2);
      lowStrip.rotation.y = Math.PI / 2;
      scene.add(lowStrip);
      geoAdd(CIRC_GEO, 0xf2b96a, cx + cw / 4, y0 + 0.106, at(2.6), [-Math.PI / 2, 0, 0], 1.6, 1.6, 1);
      [[0.9, 0.4, 0xd94f6b], [-0.6, 0.9, 0x4d9bd6], [0.2, -0.7, 0x67b26f]].forEach(([ox, oz, bc5]) =>
        geoAdd(ICO_GEO, bc5, cx + cw / 4 + ox, y0 + 0.24, at(2.6) + oz, [0, rng() * 3, 0], 0.42, 0.26, 0.42));
      // 사서 데스크 + 위 소품 (컴퓨터·반납 책더미·명패)
      box(1.6, 0.78, 0.7, 0xb0a18e, s1 - 3.6, y0, at(depth - 1.3));   // 로비 노치를 피해 서쪽
      box(0.42, 0.06, 0.34, 0x30343a, s1 - 3.95, y0 + 0.78, at(depth - 1.3), { collide: false });
      geoAdd(UNIT_PLANE, 0x2b3a44, s1 - 3.95, y0 + 1.03, at(depth - 1.3) - dir * 0.02, [0, faceIn, 0], 0.4, 0.28, 1);
      box(0.05, 0.22, 0.3, 0x4a5058, s1 - 3.95, y0 + 0.84, at(depth - 1.3), { collide: false });
      [0xe76f51, 0x457b9d, 0xe9c46a].forEach((bc6, bi6) =>
        geoAdd(UNIT_BOX, bc6, s1 - 3.15, y0 + 0.82 + bi6 * 0.07, at(depth - 1.3), null, 0.3, 0.06, 0.22));
      const libTag = textSign('사서 선생님', { h: 0.12, bg: '#ffffff', fg: '#1d3557', border: null, fontPx: 28, pad: 10 });
      libTag.position.set(s1 - 3.4, y0 + 0.85, at(depth - 1.3) - dir * 0.36);
      libTag.rotation.y = faceIn;
      scene.add(libTag);
    } else if (r.type === 'toilet') {
      // 남|여 칸막이는 뒷벽~복도벽까지 꽉 채움 (연결 버그 픽스)
      const zA = Math.min(zB, at(depth)), zBt = Math.max(zB, at(depth));
      wallZ(zA, zBt, cx, y0, FH, 0xdfe8ee, 0.15);
      [-1, 1].forEach(s => {
        for (let k = 0; k < 2; k++) {
          box(0.95, 1.4, 0.95, 0xe8edf2, cx + s * (0.85 + k * 1.15), y0, at(0.75));
          box(0.06, 1.4, 0.95, 0xd2dbe2, cx + s * (0.85 + k * 1.15) - 0.5, y0, at(0.75), { collide: false });
          // 살짝 열린 칸막이 문
          geoAdd(UNIT_BOX, 0xc4cdd4, cx + s * (0.85 + k * 1.15) + s * 0.02, y0 + 0.72, at(1.42), null, 0.9, 1.28, 0.05);
        }
        // 세면대 + 수도꼭지 + 거울 (가운데 칸막이벽에 부착)
        box(0.5, 0.8, 0.45, 0xf2f5f7, cx + s * 0.45, y0, at(depth - 2.2));
        geoAdd(UNIT_BOX, 0xb8bdc2, cx + s * 0.28, y0 + 0.92, at(depth - 2.2), null, 0.05, 0.16, 0.05);
        geoAdd(UNIT_BOX, 0xb8bdc2, cx + s * 0.38, y0 + 1.0, at(depth - 2.2), null, 0.2, 0.05, 0.05);
        geoAdd(UNIT_PLANE, 0xcfe0ea, cx + s * 0.12, y0 + 1.6, at(depth - 2.2), [0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0], 0.6, 0.8, 1);
        // 칸막이 문 손잡이
        for (let k2 = 0; k2 < 2; k2++)
          geoAdd(UNIT_BOX, 0x8a949c, cx + s * (0.85 + k2 * 1.15) + 0.38, y0 + 0.72, at(1.4), null, 0.06, 0.06, 0.05);
      });
    } else if (r.type === 'storage') {
      box(1.2, 1.0, 0.9, 0x9c7a53, cx - cw / 2 + 1.1, y0, at(1.0));
      box(0.9, 0.7, 0.8, 0xb08a5e, cx - cw / 2 + 1.05, y0 + 1.0, at(1.05), { collide: false });
      box(1.1, 0.9, 0.9, 0x8a6a45, cx + cw / 2 - 1.1, y0, at(1.2));
      box(1.4, 0.5, 0.6, 0x9c7a53, cx, y0, at(0.7));
      // 깊은 창고는 안쪽까지 채운다 (텅 빈 방 느낌 해소)
      if (depth > 6) {
        const shR = Math.min(cw / 2 - 0.5, 1.5);
        // ⚠️ innerOnly 창고(과학준비실·문서고)는 문이 서쪽 벽에 있다 — 선반을 그 벽에 붙이면 문을 막는다(동선 순회 적발) → 좌우 반전
        const mir = r.innerOnly ? -1 : 1;
        box(0.45, 1.95, Math.min(depth - 3.5, 5), 0xb08a5e, cx - shR * mir, y0, at(depth / 2 + 0.6));   // 철제 선반
        [0.55, 1.15, 1.72].forEach(sy2 =>
          geoAdd(UNIT_BOX, 0x8a6a45, cx - shR * mir, y0 + sy2, at(depth / 2 + 0.6), null, 0.5, 0.05, Math.min(depth - 3.5, 5)));
        [[0.5, 0xe8ddc4], [1.1, 0xc9a06a], [1.68, 0xdfe3e8]].forEach(([by2, bc7], bi7) =>
          box(0.36, 0.34, 0.5, bc7, cx - shR * mir, y0 + by2 + 0.05, at(depth / 2 - 0.9 + bi7 * 1.1), { collide: false }));
        box(0.45, 1.6, 0.12, 0xd0392e, cx + (shR - 0.2) * mir, y0, at(depth - 1.2));            // 접이식 사다리
        [0.35, 0.75, 1.15, 1.45].forEach(ry3 =>
          geoAdd(UNIT_BOX, 0xd0392e, cx + (shR - 0.2) * mir, y0 + ry3, at(depth - 1.2), null, 0.42, 0.05, 0.16));
        box(0.75, 0.9, 0.75, 0x4d9bd6, cx + (shR - 0.3) * mir, y0, at(depth - 2.9));            // 체육 용구함
        [[-0.16, 0.16, 0xf2c94c], [0.18, -0.1, 0xd0392e]].forEach(([ox7, oz7, bc8]) => {
          const bl2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), mat(bc8));
          bl2.position.set(cx + shR - 0.3 + ox7, y0 + 1.06, at(depth - 2.9) + oz7);
          scene.add(bl2);
        });
        box(0.5, 1.15, 0.5, 0x9aa5ad, cx, y0, at(depth - 0.9));                          // 접이 의자 더미
        geoAdd(UNIT_BOX, 0xd97f2e, cx, y0 + 1.16, at(depth - 0.9), null, 0.46, 0.04, 0.46);
      }
    } else if (r.type === 'hall') {
      // 현관 신발장 (양쪽 벽)
      [[s0 + 0.32, 1], [s1 - 0.32, -1]].forEach(([sx3, sd]) => {
        box(0.34, 1.15, 2.6, 0xcfc4b2, sx3, y0, zMid + dir * 1.0);
        for (let ci2 = 0; ci2 < 8; ci2++) {
          geoAdd(UNIT_PLANE, [0xf2a6b8, 0x9bc1e8, 0xf6c67a, 0x8fd0a8][ci2 % 4],
            sx3 + sd * 0.18, y0 + 0.38 + Math.floor(ci2 / 4) * 0.45,
            zMid + dir * (1.0 + (ci2 % 4) * 0.6 - 0.9),
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
  // 슬래브끼리 겹치는 구간(서관×앞줄·세로복도×급식동 등)은 상면 높이를 2mm씩 어긋내
  // 동일평면 z-fighting(깜빡임)을 원천 차단한다. 2mm는 육안·물리 모두 무영향.
  box(fx1 - fx0 + 2, 0.08, fz1 - fz0 + 2, 0xcfc8ba, (fx0 + fx1) / 2, 0, (fz0 + fz1) / 2, { collide: false, walk: true });
  B.wings.forEach(wg => {
    box(wg.x[1] - wg.x[0] + 1, 0.078, wg.z[1] - wg.z[0], 0xcfc8ba, (wg.x[0] + wg.x[1]) / 2, 0, (wg.z[0] + wg.z[1]) / 2, { collide: false, walk: true });
  });
  const K = B.kitchen, LC = B.linkCorridor, E = B.eastWing;
  const [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  const [ex0, ex1] = E.x, [ez0, ez1] = E.z;
  const zCorE = ez0 + E.corridorDepth;
  box(kx1 - kx0 + 1, 0.076, kz1 - kz0, 0xcfc8ba, (kx0 + kx1) / 2, 0, (kz0 + kz1) / 2, { collide: false, walk: true });
  box(LC.x[1] - LC.x[0], 0.074, kz1 - ez0, 0xcfc8ba, (LC.x[0] + LC.x[1]) / 2, 0, (ez0 + kz1) / 2, { collide: false, walk: true });
  box(ex1 - ex0 + 1, 0.072, ez1 - ez0, 0xcfc8ba, (ex0 + ex1) / 2, 0, (ez0 + ez1) / 2, { collide: false, walk: true });
  box(fx1 - fx0 + 8, 0.06, 6, 0xd8d2c6, (fx0 + fx1) / 2, 0, fz1 + 3, { collide: false, walk: true });

  // ===== 복도 바닥 마감 (실사) =====
  // 지금까지 복도는 건물 슬래브(0xcfc8ba) 상면이 그대로 노출돼 있었다.
  // 실물: **구관 = 흰 대형 타일 + 양쪽 검은 대리석 테두리 띠(0.3m)** / 신관·2층 = 회색 테라조.
  // ⚠️ 반드시 plane() (병합 + staticEntries) — softBox 로 만들면 지면 레이가 통과해 슬래브로 되돌아간다.
  // ⚠️ 중앙 타일과 양쪽 띠는 z 구간이 서로 겹치지 않게 계산 → 같은 y 로 둬도 깜빡이지 않는다.
  const CORR_INSET = 0.17;                     // 굽도리(두께 0.34)의 절반 — 벽면에서 시작
  function corridorFloor(x0c, x1c, z0c, z1c, yc, mainC, bandC, bandW) {
    const a = z0c + CORR_INSET, b = z1c - CORR_INSET;
    if (b - a <= bandW * 2 + 0.1 || x1c - x0c <= 0.2) return;
    const seg = Math.max(1, Math.ceil((x1c - x0c) / MCHUNK));   // 26m 청크 단위로 쪼개 컬링 유지
    for (let i = 0; i < seg; i++) {
      const sx0 = x0c + ((x1c - x0c) * i) / seg, sx1 = x0c + ((x1c - x0c) * (i + 1)) / seg;
      const w = sx1 - sx0, cxx = (sx0 + sx1) / 2;
      plane(w, b - a - bandW * 2, mainC, cxx, yc, (a + b) / 2);
      if (bandW > 0) {
        plane(w, bandW, bandC, cxx, yc, a + bandW / 2);
        plane(w, bandW, bandC, cxx, yc, b - bandW / 2);
      }
    }
  }
  const TILE_W = 0xf2efe6, MARBLE_K = 0x2f3033, TERRAZZO = 0xbdbcb6;

  // 복도 나무 핸드레일 — 연두 굽도리(0.95) 상단을 따라 이어진다.
  // ⚠️ 반드시 softBox. 기존 1076줄이 box(collide:false)라 **레일을 밟고 올라설 수 있었다**(실버그).
  // gaps = [{c, w}] 문 개구부. axis 'x' = z벽을 따라 가로로, 'z' = x벽을 따라 세로로.
  // 복도 창 아래 목재 수납장 줄 (실사: 구관 복도 창측에 짙은 갈색 수납장이 연속으로 놓인다)
  // 핸드레일과 같은 벽에 두면 서로 관통한다 → **창측 벽 = 수납장 / 교실측 벽 = 핸드레일**로 나눈다.
  // ⚠️ solidSoftBox: 통과는 막되 밟고 올라설 수는 없어야 한다(높이 0.85 = 점프 1.04로 닿는다).
  const CAB_H = 0.85, CAB_D = 0.42;
  function lowCabinet(a0, a1, fixed, dir, gaps = []) {
    const cuts = [...gaps].sort((p, q) => (p.c - p.w / 2) - (q.c - q.w / 2));   // 시작점 정렬(포함-틈 버그 방지)
    let cur = a0;
    const runs = [];
    cuts.forEach(g => {
      const g0 = g.c - g.w / 2 - 0.15, g1 = g.c + g.w / 2 + 0.15;
      if (g0 > cur + 0.8) runs.push([cur, g0]);
      cur = Math.max(cur, g1);
    });
    if (a1 - cur > 0.8) runs.push([cur, a1]);
    const cz = fixed + dir * (CAB_D / 2 + 0.02);
    runs.forEach(([r0, r1]) => {
      const len = r1 - r0, ctr = (r0 + r1) / 2;
      solidSoftBox(len, CAB_H, CAB_D, 0x7a5a3c, ctr, 0.10, cz);                       // 몸통
      softBox(len + 0.06, 0.05, CAB_D + 0.06, 0x8f6c48, ctr, 0.10 + CAB_H, cz);       // 상판
      for (let t = r0 + 0.45; t < r1 - 0.2; t += 0.9)                                  // 문짝 손잡이
        softBox(0.22, 0.03, 0.03, 0xd8d2c6, t, 0.72, cz + dir * (CAB_D / 2 + 0.01));
    });
  }
  const RAIL_Y = 1.0, RAIL_OFF = 0.21;
  function railWall(a0, a1, fixed, axis, gaps = [], dir = -1, y0 = 0, c = railC) {
    const cuts = [...gaps].sort((p, q) => (p.c - p.w / 2) - (q.c - q.w / 2));   // 시작점 정렬(포함-틈 버그 방지)
    let cur = a0;
    const runs = [];
    cuts.forEach(g => {
      const g0 = g.c - g.w / 2 - 0.12, g1 = g.c + g.w / 2 + 0.12;
      if (g0 > cur + 0.5) runs.push([cur, g0]);
      cur = Math.max(cur, g1);
    });
    if (a1 - cur > 0.5) runs.push([cur, a1]);
    const off = fixed + dir * RAIL_OFF;
    runs.forEach(([r0, r1]) => {
      const len = r1 - r0, ctr = (r0 + r1) / 2;
      if (axis === 'x') {
        softBox(len, 0.075, 0.065, c, ctr, y0 + RAIL_Y, off);
        for (let t = r0 + 0.8; t < r1 - 0.4; t += 1.7)
          softBox(0.06, 0.1, 0.16, c, t, y0 + RAIL_Y - 0.1, fixed + dir * 0.13);
      } else {
        softBox(0.065, 0.075, len, c, off, y0 + RAIL_Y, ctr);
        for (let t = r0 + 0.8; t < r1 - 0.4; t += 1.7)
          softBox(0.16, 0.1, 0.06, c, fixed + dir * 0.13, y0 + RAIL_Y - 0.1, t);
      }
    });
  }

  // ---- 앞줄 ----
  const hallRoom = FR.rooms.find(r => r.type === 'hall');
  const hallCx = (hallRoom.span[0] + hallRoom.span[1]) / 2;
  // 서/동 외벽 + 주복도 양끝 유리문(빨강)
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 2.2 }], fx0, 0, FH, wallC);
  makeDoor(fx0, FR.corridorExitZ - 1.1, 2.2, 'z', { glass: true, swing: 1 });
  {
    const kTag = textSign('정림초등학교병설유치원', { h: 0.2, bg: '#5a4232', fg: '#f7edda', border: null, fontPx: 38, pad: 10 });
    kTag.position.set(fx0 + 0.35, 2.5, FR.corridorExitZ);
    kTag.rotation.y = Math.PI / 2;
    scene.add(kTag);
  }
  wallZGaps(fz0, fz1, [{ c: FR.corridorExitZ, w: 1.8 }], fx1, 0, FH, wallC);
  lintelZ(FR.corridorExitZ, 2.2, fx0, wallC);
  lintelZ(FR.corridorExitZ, 1.8, fx1, wallC);
  // ⚠️ 측문(서) 문은 위(w2.2) 하나뿐 — 예전 1.8 문과 겹쳐 '이중문'이 되던 것 제거(사용자 보고)
  makeDoor(fx1, FR.corridorExitZ - 0.9, 1.8, 'z', { glass: true, swing: -1 });
  // 복도 북벽 — 서측(서관 문+복도 미니창) / 동측(마당 큰창) 모두 진짜 뚫린 창
  const northGaps = [];
  const westWins = [];
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly) return;
    // 실사(사용자 확인): 도서관 앞은 복도가 **북쪽으로 갑자기 넓어지는 로비** — 문 개구가 아니라 전고 개구
    if (r.type === 'library') northGaps.push({ c: -17.9, w: 2.6, dh: FH });
    // 실사(사용자 사진3): 계단실 앞은 문형 개구가 아니라 **복도와 벽 없이 트인 홀** — 전고 4.2m 개구
    else if (r.type === 'stair') northGaps.push({ c: (r.span[0] + r.span[1]) / 2, w: 4.2, dh: FH });
    else northGaps.push({ c: doorCOf(r), w: 1.8 });
    if (r.type !== 'stair') {
      const cww = r.span[1] - r.span[0];
      westWins.push({ c: r.span[0] + cww * 0.55, w: 1.3 }, { c: r.span[0] + cww * 0.85, w: 1.3 });
    }
  }));
  // 실사(사진3)+위성: 주차장 문은 계단 '옆' — 서관 동쪽끝(x-12)·급식동(x-10.6) 사이 틈새 길이 주차장으로 통한다
  northGaps.push({ c: -11.3, w: 1.2 });
  northGaps.push({ c: K.dutyRoom.doorC, w: 1.6 });
  northGaps.push({ c: K.doorC, w: 2.4 });
  northGaps.push({ c: (LC.x[0] + LC.x[1]) / 2, w: LC.x[1] - LC.x[0], dh: FH });   // 세로복도 통로 = 전체 높이 개구
  // 실사(사용자 확인): 측문(서)~도서관(동)의 서측 구간은 좁은 복도가 아니라 **넓은 홀** —
  // fz0 벽의 서측(x -40~-16.6)을 통개구로 비우고, 서관 남벽을 z-39.9에 새로 세운다(홀 폭 4.5m)
  const HALL_E = -16.6, HALL_WALL_Z = fz0 - 1.9;
  wallXWin(fx0, ex0, fz0, innerC, westWins.filter(w2 => w2.c > HALL_E),
    { h: FH, sill: 1.9, wh: 0.9, doors: [...northGaps.filter(g => g.c > HALL_E), { c: (fx0 + HALL_E) / 2, w: HALL_E - fx0, dh: FH }] });
  // 새 서관 남벽(z-39.9): 보건실·나래반 문 + 복도창. 도서실 구간은 벽만(문은 동벽 직각문)
  {
    const wGaps = [], wWins = [];
    B.wings[0].rooms.forEach(r => {
      if (r.innerOnly || r.type === 'stair' || r.type === 'library') return;
      wGaps.push({ c: doorCOf(r), w: 1.8 });
      const cww = r.span[1] - r.span[0];
      wWins.push({ c: r.span[0] + cww * 0.75, w: 1.3 });
    });
    wallXWin(fx0, -19.2, HALL_WALL_Z, innerC, wWins, { h: FH, sill: 1.9, wh: 0.9, doors: wGaps });
    wGaps.forEach(gp => makeDoor(gp.c - gp.w / 2, HALL_WALL_Z, gp.w, 'x', { swing: 1 }));
    wallXGaps(fx0, -19.2, wGaps, HALL_WALL_Z, 0, 0.95, wainC, 0.34);
    // 홀 바닥(흰 타일 + 포인트) — 서관 슬래브(0.078) 위
    plane(-19.4 - fx0, 1.72, 0xf2efe6, (fx0 + -19.4) / 2, 0.101, HALL_WALL_Z + 0.96);
    // 홀 팻말: 새 벽 위로
    B.wings[0].rooms.forEach(r => {
      if (r.innerOnly || r.type === 'stair' || r.type === 'library') return;
      hangSign(r.name, doorCOf(r), FH - CEIL_DROP, HALL_WALL_Z - 0.5, 0, 0.26);
    });
  }
  const yardWins = [];
  // ⚠️ 화장실 맞은편(x 9.5~15) 구간은 창을 뚫지 않는다 — 실사에서 그 벽엔 **학생자치회 게시판**이 붙는다(사용자 확인)
  for (let wx = ex0 + 2.2; wx < fx1 - 1.6; wx += 4.4) {
    if (wx > 9.0 && wx < 15.5) continue;
    yardWins.push({ c: wx, w: 2.0 });
  }
  wallXWin(ex0, fx1, fz0, innerC, yardWins, { h: FH, sill: 1.1, wh: 1.6 });
  wallXGaps(fx0, fx1, [...northGaps, { c: -28.3, w: 23.8 }], fz0, 0, 0.95, wainC, 0.34);   // 서측 홀 구간엔 굽도리도 없다
  B.wings.forEach(wg => wg.rooms.forEach(r => {
    if (r.innerOnly || r.type === 'stair') return;
    if (r.type === 'library') {
      // 실사(사용자 확인): 도서관 문은 긴 복도 쪽이 아니라 **복도와 직각(동향)** — 로비 서벽에 유리 양문
      const LOB_X = -19.2, LOB_ZN = -41.6;
      // 위상(사용자 그림 재확인): 서벽 문(x-19.2, z-38 중앙) → 전실(x-19.2~-16.6)이 북으로 도서실과 **바로 통한다**
      // (옛 노치 북벽은 전실을 도서실과 갈라 문이 막다른 방으로 통하게 했다 — 제거)
      wallX(LOB_X, -16.6, -36.7, 0, FH, innerC);                        // 전실 남벽(복도와 분리·복도 통행선 z-36.2는 유지)
      wallZ(-39.9, -36.7, -16.6, 0, FH, innerC);                        // 전실 동벽(계단홀과 분리)
      // 사용자 재확인(그림): 측문에서 동진하는 시선(z-37대) **정면**에 문이 와야 한다 —
      // 문을 홀 중앙선(z-38)으로 내리고 벽을 남으로 연장(z-36.7까지). 남쪽 틈 z-36.7~-35.4는 주복도 동진 통로.
      wallZGaps(LOB_ZN, -36.7, [{ c: -38.0, w: 1.7 }], LOB_X, 0, FH, innerC);   // 로비 서벽 + 문 개구
      lintelZ(-38.0, 1.7, LOB_X, innerC);
      makeDoor(LOB_X, -38.0 - 0.85, 1.7, 'z', { glass: true, swing: 1 });
      hangSign('도서관', LOB_X - 0.6, FH - CEIL_DROP, -38.0, Math.PI / 2, 0.26);
      // 아치 프레임 + 현판 + 반납함 — 전부 **동향 문 앞(로비 안)**으로 (실사 d80_0222)
      const LW = 0x5a4232, ldz = -38.0;
      // ⚠️ 기둥 x는 벽면(-19.05)에서 4cm 이상 — 0.32면 기둥면(-19.03)과 벽면이 2mm 코플레이너로 반짝(평면 스캔 적발)
      [-1.3, 1.3].forEach(oz => solidSoftBox(0.3, 2.5, 0.26, LW, LOB_X + 0.4, 0, ldz + oz));
      softBox(0.34, 0.3, 2.9, LW, LOB_X + 0.32, 2.5, ldz);
      const lTag = textSign('슬기샘 도서관', { h: 0.22, bg: '#5a4232', fg: '#f7edda', border: null, fontPx: 42, pad: 10 });
      lTag.position.set(LOB_X + 0.5, 2.62, ldz);
      lTag.rotation.y = Math.PI / 2;
      scene.add(lTag);
      solidSoftBox(0.4, 1.05, 0.55, 0x7a8b99, LOB_X + 0.42, 0, ldz - 2.35);      // 도서반납함(문 옆·노치 안)
      geoAdd(UNIT_PLANE, 0x2f3438, LOB_X + 0.64, 0.88, ldz - 2.35, [0, Math.PI / 2, 0], 0.34, 0.08, 1);
      const rTag = textSign('도서반납함', { h: 0.11, bg: '#7a8b99', fg: '#ffffff', border: null, fontPx: 30, pad: 8 });
      rTag.position.set(LOB_X + 0.64, 0.62, ldz - 2.35);
      rTag.rotation.y = Math.PI / 2;
      scene.add(rTag);
    }
  }));
  makeDoor(-11.3 - 0.6, fz0, 1.2, 'x', { glass: true, swing: 1 });
  hangSign('주차장', -11.3, FH - CEIL_DROP, fz0 + 0.55, 0, 0.24);
  box(1.3, 0.04, 12.4, 0x6f7276, -11.3, 0.006, fz0 - 6.4, { collide: false, walk: true });   // 틈새 아스팔트 → 뒤 주차장
  makeDoor(K.dutyRoom.doorC - 0.8, fz0, 1.6, 'x', { swing: 1 });
  makeDoor(K.doorC - 1.2, fz0, 2.4, 'x', { swing: 1 });
  // 구관 복도 바닥: 흰 대형 타일 + 양쪽 검은 대리석 띠 (슬래브 0.08 위에 0.10)
  corridorFloor(fx0 + 0.2, fx1 - 0.2, fz0, zCor, 0.100, TILE_W, MARBLE_K, 0.30);
  // 실사(d80_0205): 서측 복도엔 갈색 포인트 타일이 일정 간격 + 유치원 복도면 캐릭터 벽화
  for (let ptx = -33; ptx < 36; ptx += 7) {
    if (Math.abs(ptx + 18.6) < 1.6) continue;   // 도넛 벤치 자리
    plane(0.9, 0.9, 0xb5906a, ptx, 0.105, -36.65);
  }
  [[-33.3, 0x8fbf6a, 1.6, 0.5], [-30.7, 0x8fbf6a, 1.6, 0.5], [-28.1, 0x8fbf6a, 1.6, 0.5]].forEach(([bx7, bc8, bw8, bh8]) =>
    geoAdd(UNIT_PLANE, bc8, bx7, 0.42, zCor - 0.16, [0, Math.PI, 0], bw8, bh8, 1));
  [[-32.6, 0xe86a6a], [-30.1, 0xf2c94c], [-27.6, 0xe86a6a]].forEach(([bx9, bc9]) =>
    geoAdd(UNIT_PLANE, bc9, bx9, 0.78, zCor - 0.16, [0, Math.PI, 0], 0.14, 0.2, 1));
  geoAdd(UNIT_PLANE, 0x8a5a3a, -31.1, 0.95, zCor - 0.16, [0, Math.PI, 0], 0.55, 0.8, 1);   // 곰
  // ⚠️ 북벽(창측)에는 레일을 깔지 않는다 — 실물은 여기가 **창 아래 목재 수납장** 자리다.
  //    레일과 수납장을 같은 벽에 두면 브래킷(y 0.90~1.00)이 상판(0.95)을 관통한다.
  //    교실측(zCor) 레일은 각 실 루프에서 계속 깔린다.
  lowCabinet(fx0 + 0.3, fx1 - 0.3, fz0, 1, [...northGaps, { c: -28.3, w: 23.8 }, { c: -14.3, w: 2.6 }, { c: -17.9, w: 3.0 }, { c: 24, w: 14 },
    { c: -29.8, w: 9.0 }, ...[-33, -18, 2, 21, 35].map(c => ({ c, w: 0.9 }))]);   // 소화기·도넛·유치원 구간 벽감
  // 실사(d80_0205): 유치원 앞 복도 사물함은 짙은 갈색이 아니라 **베이지 2단(h1.05)** + 은색 고리
  // ⚠️ 8.6m 통짜면 유치원 문 2개(-32.4·-27.2)를 가로막는다(동선 순회 적발) — 문 사이 3m만
  solidSoftBox(3.0, 1.05, 0.42, 0xd6c6a2, -29.8, 0.10, zCor - 0.25);   // 홀 남측벽(유치원 북벽) 앞
  softBox(3.1, 0.05, 0.46, 0xe2d4b2, -29.8, 1.15, zCor - 0.25);
  for (let hx3 = -31.0; hx3 < -28.4; hx3 += 0.62) {
    softBox(0.10, 0.03, 0.03, 0xb8b2a6, hx3, 0.45, zCor - 0.48);
    softBox(0.10, 0.03, 0.03, 0xb8b2a6, hx3, 0.85, zCor - 0.48);
  }
  // 실사(v81): 컴퓨터실~1학년 앞 복도 창측은 낮은 수납장이 아니라 **원목 3단 개별 락커**(손잡이+이름표)
  {
    const lk0 = 17.4, lk1 = 30.6, lkz = fz0 + 0.24;
    solidSoftBox(lk1 - lk0, 1.66, 0.42, 0xc8a878, (lk0 + lk1) / 2, 0.10, lkz);
    softBox(lk1 - lk0 + 0.08, 0.05, 0.46, 0xd8bc90, (lk0 + lk1) / 2, 1.76, lkz);
    for (let lx8 = lk0 + 0.3; lx8 < lk1; lx8 += 0.6) {
      [0.5, 1.05, 1.55].forEach(hy => softBox(0.09, 0.03, 0.03, 0x8a8f94, lx8, hy, lkz + 0.22));   // 손잡이 3단
      geoAdd(UNIT_PLANE, 0xf2efe6, lx8, 1.42, lkz + 0.222, null, 0.16, 0.1, 1);                     // 이름표
      softBox(0.02, 1.62, 0.02, 0xa8885c, lx8 + 0.28, 0.12, lkz + 0.21);                            // 칸 세로줄
    }
  }
  // 소방설비 (실사: 복도 곳곳 / 지금까지 코드에 0개)
  [-15.4, -5, 2, 21, 35].forEach(fx3 => fireExt(fx3, 0.10, fz0 + 0.42, fz0 + 0.16));   // 서측 홀 구간(벽 없음)엔 벽표지 못 붙이므로 제외
  // ⚠️ 서측 소화전은 옛 fz0 벽이 홀로 뚫리면서 허공에 떠 도서관 문 앞을 막았다 — 새 홀 남벽(z-39.9)으로 이사
  hydrant(-24, HALL_WALL_Z + 0.14, 0);
  hydrant(28, fz0 + 0.14, 0);
  // 유도등은 복도 끝 바깥문·계단실 개구에만 (문 위 매달림 팻말과 정면으로 겹치지 않게)
  exitLight(fx0 + 0.9, 2.45, FR.corridorExitZ, Math.PI / 2);
  exitLight(fx1 - 0.9, 2.45, FR.corridorExitZ, -Math.PI / 2);
  exitLight(-14.3, 2.45, fz0 + 0.2, 0);
  // ⚠️ 형광등 y: 천장(FH-CEIL_DROP=3.13)보다 **아래**여야 보인다. FH-0.12(3.28)는 천장 위라 안 보였다.
  for (let lx = fx0 + 3; lx < fx1 - 1; lx += 6) lamp(lx, FH - CEIL_DROP - 0.05, (fz0 + zCor) / 2);
  // 복도 벤치 — 계단실 개구부(-15.5~-13.1)를 피해 배치
  [-20.6, 15].forEach(bx5 => {
    box(1.8, 0.42, 0.42, 0xc9a06a, bx5, 0, fz0 + 0.55, { walk: true });
    box(1.8, 0.5, 0.1, 0xb08f5e, bx5, 0.42, fz0 + 0.34, { collide: false });   // 등받이
  });

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
      wallXWin(s0, s1, fz1, wallC, wins, { h: FH, innerDir: -1 });
      const gaps = r.type === 'toilet'
        ? [{ c: s0 + cw * 0.25, w: 1.6 }, { c: s0 + cw * 0.75, w: 1.6 }]
        : [{ c: doorCOf(r), w: 1.8 }];
      // 실제 교실처럼 앞문+뒷문
      const backDoor = ['classroom', 'computer', 'science', 'daycare'].includes(r.type) && cw >= 6.5;
      if (backDoor) gaps.push({ c: s1 - 1.9, w: 1.8 });
      // 복도쪽 벽: 문 개구부 + 진짜 뚫린 복도창 (복도에서 교실 안이 보임)
      // ⚠️ 화장실은 복도창을 뚫지 않는다 — 실물에 없고(사생활), 있으면 학생자치회 게시판이 창을 덮는다
      const cwins = r.type === 'toilet' ? []
        : (backDoor ? [s0 + cw * 0.42, s0 + cw * 0.6] : [s0 + cw * 0.55, s0 + cw * 0.85])
          .map(wxp => ({ c: wxp, w: 1.3 }));
      wallXWin(s0, s1, zCor, innerC, cwins, { h: FH, sill: 1.9, wh: 0.9, doors: gaps });
      gaps.forEach(gp => makeDoor(gp.c - gp.w / 2, zCor, gp.w, 'x',
        { swing: -1, color: r.kinder ? 0xe8c33c : undefined }));   // 실사: 유치원 문은 노란색
      // 팻말: 복도창 상단(2.8)과 천장(FH-0.27=3.13) 사이 띠에만 놓는다.
      // ⚠️ 높이 h 를 키우면 위가 천장에 잘린다 — 중심 2.95 · h 0.30 이 상한
      const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
      if (r.type === 'toilet') {
        hangSign('남자 화장실', gaps[0].c, FH - CEIL_DROP, zCor - 0.5, 0, 0.26);
        hangSign('여자 화장실', gaps[1].c, FH - CEIL_DROP, zCor - 0.5, 0, 0.26);
        // 실사(사용자 확인): 학생자치회 게시판은 화장실 문 옆이 아니라 **맞은편(북측 창벽)** — 그 구간 창은 위에서 제거함
        const tbX = (gaps[0].c + gaps[1].c) / 2;
        softBox(3.4, 1.35, 0.07, 0x3f6b52, tbX, 1.28, fz0 + 0.2);
        softBox(3.56, 0.09, 0.1, 0x8a6a45, tbX, 2.63, fz0 + 0.21);
        softBox(3.56, 0.09, 0.1, 0x8a6a45, tbX, 1.19, fz0 + 0.21);
        [[-1.15, 0xf2efe6], [-0.4, 0xfdf3d0], [0.4, 0xf2efe6], [1.15, 0xe8f0f6]].forEach(([ox, pc], pi) =>
          geoAdd(UNIT_PLANE, pc, tbX + ox, 1.28 + (pi % 2) * 0.34 - 0.14, fz0 + 0.24, [0, Math.PI, 0], 0.52, 0.66, 1));
        const tbTag = textSign('학생자치회 소식', { h: 0.19, bg: '#3f6b52', fg: '#ffffff', border: null, fontPx: 40, pad: 9 });
        tbTag.position.set(tbX, 2.63, fz0 + 0.26);
        scene.add(tbTag);
        solidSoftBox(3.4, 0.8, 0.4, 0x9c7a53, tbX, 0.10, fz0 + 0.4);
        softBox(3.48, 0.05, 0.46, 0xb08d5a, tbX, 0.90, fz0 + 0.4);
      } else {
        hangSign(label, gaps[0].c, FH - CEIL_DROP, zCor - 0.5, 0, 0.28);
      }
      furnish(r, cx, cw, 0, fz1, -1, fz1 - zCor);
      wallXGaps(s0, s1, gaps, zCor, 0, 0.95, wainC, 0.34);
      // 교실쪽 벽 핸드레일 — 문 개구부를 피해 끊어 깐다.
      // ⚠️ 예전엔 box(collide:false)라 **레일을 밟고 올라설 수 있었다**(실버그) → railWall(softBox)로 교체
      railWall(s0 + 0.15, s1 - 0.15, zCor, 'x', gaps, -1);
    }
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, floor: 0, label: r.type === 'hall' ? '현관' : `본관 1층 · ${r.name}` });
  });
  [...frontEdges].filter(x => x > fx0 + 0.01 && x < fx1 - 0.01)
    .forEach(x => wallZ(zCor, fz1, x, 0, FH, innerC));
  zones.push({ x0: fx0, x1: fx1, z0: fz0, z1: zCor, floor: 0, label: '본관 1층 복도' });

  // ===== 외벽 4색 시스템 (실사 실측) =====
  // 벽 자체는 황토 베이지(data.js wallColor)이고, 그 위에 **코발트 블루 수평띠 2줄 + 비비드 옐로우 1줄**과
  // **실 경계마다 파란 세로 기둥 스트립**을 덧댄다. 창(sill 1.1 ~ 2.5)을 피해 아래·위 밴드에만 놓는다.
  const BLUEC = 0x3f6fa8, YELC = 0xe8bf3c, FACE_T = 0.1;
  // ⚠️ 0.26 고정 — 창틀 프레임(fz1+0.18)·야간 glow판(fz1+0.19)보다 확실히 앞이어야 한다.
  //    0.16으로 두면 띠 상자(0.11~0.21)가 그 둘과 겹쳐 **창문이 반짝인다**(실기기 신고)
  const faceZ = fz1 + 0.26;
  // ⚠️ 전부 softBox — box(collide:false)로 하면 **띠를 밟고 올라설 수 있다**(측정으로 확인)
  const faceBand = (y0b, hb, colb) =>
    softBox(fx1 - fx0, hb, FACE_T, colb, (fx0 + fx1) / 2, y0b, faceZ);
  faceBand(0.62, 0.42, BLUEC);    // 창 아래 허리띠(중앙 구간용)
  faceBand(2.52, 0.5, YELC);
  faceBand(3.02, 0.38, BLUEC);
  // 실사(hi_0255·0264): 파라펫 코핑이 구간별 컬러 — 중앙 코발트·양끝 머스터드
  softBox(34.4, 0.4, 0.12, 0x3f6fa8, -0.8, FH + 0.02, fz1 + 0.33);
  softBox(21.6, 0.4, 0.12, 0xd9a622, -29.1, FH + 0.02, fz1 + 0.33);
  softBox(23.4, 0.4, 0.12, 0xd9a622, 28.2, FH + 0.02, fz1 + 0.33);
  // 실사(gym_0278·hi_0264): 서·동 양끝 1층은 **비비드 옐로우 대면적** — 가는 띠가 아니라 벽면
  [[-40, -18], [16.4, 40]].forEach(([xa, xb]) => {
    // ⚠️ 하단 밴드는 y0.5부터 — 운동장에서 보면 옹벽(높이 1.0)이 y1 아래를 가린다(자가 심사에서 확인)
    softBox(xb - xa, 1.06, 0.11, YELC, (xa + xb) / 2, 0.5, faceZ + 0.01);
    softBox(xb - xa, 0.92, 0.11, YELC, (xa + xb) / 2, 2.48, faceZ + 0.01);
  });
  [...frontEdges].filter(x => x > fx0 + 0.01 && x < fx1 - 0.01)
    .forEach(x => softBox(0.38, FH, FACE_T, (x < -18 || x > 16.4) ? YELC : BLUEC, x, 0, faceZ + 0.02));   // 양끝=노랑(실사)·동일평면 금지
  roofOver(fx0, fx1, fz0, fz1, FH, roofC);
  // 옥탑 구조물 + 환기구 (위성사진) — 슬래브 상면(FH+0.1) 위에 얹음
  // 실사(hi_0255): 옥탑은 회색 상자가 아니라 **흰 벽 + 청회색 박공지붕**
  box(4.6, 2.0, 3.2, 0xe9edf0, 19, FH + 0.1, -31);
  [[-0.78, 0.6], [0.78, -0.6]].forEach(([oz, rx8]) =>
    softBox(5.2, 0.13, 2.0, 0x93a9ba, 19, FH + 2.72, -31 + oz, [rx8, 0, 0]));
  softBox(5.3, 0.12, 0.3, 0x7f97ab, 19, FH + 3.28, -31);
  box(1.1, 0.7, 1.1, 0x9aa5ad, -6, FH + 0.1, -33);
  box(1.1, 0.7, 1.1, 0x9aa5ad, 30, FH + 0.1, -27.5);

  // 실사(gym_0278): 학교명은 지붕 위 공중이 아니라 현관 서측 1층 **파란 밴드에 흰 글씨**
  softBox(6.5, 0.7, 0.08, 0x1e4fa3, hallCx - 6.8, 2.35, faceZ);
  {
    const nm = textSign(SCHOOL.name, { h: 0.48, bg: '#1e4fa3', fg: '#ffffff', border: null, fontPx: 56, pad: 14 });
    nm.position.set(hallCx - 6.8, 2.7, faceZ + 0.06);
    scene.add(nm);
  }
  // 현관 유리문 파란 슬로건 띠 (실사: 문 유리에 흰 글씨 2줄)
  [['튼튼한 몸과 건강한 마음', -1.62], ['주도적인 배움과 성장', 1.62]].forEach(([txt, ox]) => {
    const bd = textSign(txt, { h: 0.24, bg: '#1e4fa3', fg: '#ffffff', border: null, fontPx: 44, pad: 14 });
    bd.position.set(hallCx + ox, 2.02, fz1 + 0.07);
    scene.add(bd);
  });
  // (구 회청색 캐노피 + 원기둥 2개는 제거 — 실물은 그 자리가 짙은 목재 필로티 포치다. 아래 정면 필로티 참조)
  sign('현관', hallCx, 2.55, fz1 + 0.42, 0, 0.45);
  // 현관 게시판 (사진3: 꿈은 이루어진다) — 벽 안쪽 면(7.85)보다 앞으로 빼서 정면이 보이게
  const hallEx = hallRoom.span[1] - 0.19;
  box(0.06, 1.15, 0.85, 0xc9526b, hallEx, 1.1, -27, { collide: false });
  const poster1 = textSign('꿈은 이루어진다 ⭐', { h: 0.2, bg: '#ffe9ee', fg: '#c9526b', fontPx: 36, pad: 12 });
  poster1.position.set(hallEx - 0.05, 1.55, -27);
  poster1.rotation.y = -Math.PI / 2;
  scene.add(poster1);
  const poster2 = textSign('오늘의 알림', { h: 0.17, bg: '#ffffff', fg: '#1d3557', fontPx: 34, pad: 12 });
  poster2.position.set(hallEx - 0.05, 1.02, -27);
  poster2.rotation.y = -Math.PI / 2;
  scene.add(poster2);
  // 현관 소품: 발판 매트 · 우산꽂이 · 안내 화분 (휑함 해소)
  // ⚠️ 우산꽂이·화분은 아치 기둥·신발장 자리와 겹쳐 이동했다 (조사에서 좌표 충돌 확인)
  plane(2.6, 1.5, 0x5a6b7a, hallCx, 0.1, fz1 - 1.2);
  box(0.42, 0.6, 0.42, 0x4a6fa5, hallRoom.span[0] + 0.55, 0, -25.2);
  [[-0.13, 0.11], [0.12, -0.09], [0.02, 0.02]].forEach(([ox, oz], ui) => {   // 겹치면 반짝임
    box(0.05, 0.85, 0.05, [0xd94f6b, 0xf2b134, 0x67b26f][ui], hallRoom.span[0] + 0.55 + ox, 0.6, -25.2 + oz, { collide: false });
    geoAdd(UNIT_BOX, [0xd94f6b, 0xf2b134, 0x67b26f][ui], hallRoom.span[0] + 0.55 + ox, 1.5, -25.2 + oz, null, 0.09, 0.16, 0.09);
  });
  geoAdd(STUMP_GEO, 0xa5673f, hallRoom.span[1] - 0.6, 0.22, -25.4, null, 0.8, 0.44, 0.8);
  geoAdd(ICO_GEO, 0x4d8b4d, hallRoom.span[1] - 0.6, 0.78, -25.4, [0, 1.2, 0], 0.42, 0.4, 0.42);

  // ===== 현관 로비 세트 (실사 — 인식성 최상위 공간) =====
  {
    const HX0 = hallRoom.span[0], HX1 = hallRoom.span[1];
    // 아치형 목재 게이트 + 현판 (로비 안쪽 z -26.45)
    const GATE_Z = -26.45, GWOOD = 0x5a4232;
    [HX0 + 0.47, HX1 - 0.47].forEach(gx4 => solidSoftBox(0.3, 2.3, 0.42, GWOOD, gx4, 0, GATE_Z));
    softBox(HX1 - HX0 - 0.6, 0.34, 0.46, GWOOD, hallCx, 2.3, GATE_Z);          // 상인방
    softBox(HX1 - HX0 - 1.2, 0.16, 0.4, 0x6d5236, hallCx, 2.64, GATE_Z);       // 캡 몰딩
    const gTag = textSign('웃음꽃피는 즐거운학교', { h: 0.24, bg: '#5a4232', fg: '#f7edda', border: null, fontPx: 44, pad: 12 });
    gTag.position.set(hallCx, 2.47, GATE_Z - 0.27);   // 남면 — 현관으로 **들어오는** 사람이 보는 쪽
    scene.add(gTag);
    // 바닥 컴퍼스 로즈 (safePoint 6.15,-29 는 통행 가능해야 — plane 이라 무해)
    const rose = new THREE.Mesh(UNIT_PLANE, new THREE.MeshBasicMaterial({ map: compassRose() }));
    rose.scale.set(1.6, 1.6, 1);
    rose.rotation.x = -Math.PI / 2;
    rose.position.set(hallCx, 0.104, -29.6);
    rose.matrixAutoUpdate = false; rose.updateMatrix();
    scene.add(rose);
    // 실사(사용자 사진4): 진열장·괘종시계는 벽이 아니라 **홀 중앙 아일랜드** — 등맞댄 진열장 2 + 시계가 섬으로
    box(1.7, 0.85, 1.0, 0x8a6a48, hallCx, 0, -32.2);                             // 하부장(등맞댐)
    solidSoftBox(1.64, 0.95, 0.94, 0xf2efe6, hallCx, 0.85, -32.2);               // 상부 프레임
    [ -0.51, 0.51 ].forEach(oz3 => glassAdd(hallCx, 1.32, -32.2 + oz3, 0, 1.5, 0.85));
    [[-0.45, 0.2], [0.05, 0.28], [0.5, 0.18]].forEach(([ox2, th]) =>
      geoAdd(UNIT_BOX, 0xd4af5a, hallCx + ox2, 0.93, -32.2, null, 0.1, th, 0.1));
    // 괘종시계 — 아일랜드 남단에 붙어 섬 (사진4: 진열장 옆)
    // ⚠️ 시계는 섬 **남단(z축)** — 서쪽(x축)에 붙이면 좌측 통로가 0.25m로 막힌다(보행 시험)
    solidSoftBox(0.5, 1.95, 0.34, 0x5f4636, hallCx, 0, -33.15);
    geoAdd(UNIT_PLANE, 0xf2efe6, hallCx, 1.62, -33.34, [0, Math.PI, 0], 0.3, 0.3, 1);
    glassAdd(hallCx, 0.85, -33.33, 0, 0.3, 0.9);
    geoAdd(UNIT_BOX, 0xd4af5a, hallCx, 0.75, -33.28, null, 0.05, 0.42, 0.05);
    // 주황+연두 줄무늬 소파 2연 (동벽 — 세그먼트가 z로 이어진 긴 벤치)
    [[-29.9, 0], [-31.0, 1]].forEach(([sz4, alt]) => {
      [0, 1, 2].forEach(si2 => box(0.46, 0.42, 0.34, (si2 + alt) % 2 ? 0x67b26f : 0xe8863a,
        HX1 - 0.55, 0, sz4 + (si2 - 1) * 0.34, { walk: true }));
    });
    // 원목 신발장 2열 (아치 안쪽 양벽) + 위 화분
    [[HX0 + 0.42, -27.6], [HX1 - 0.42, -27.6]].forEach(([sx5, sz5]) => {
      box(0.36, 1.1, 1.7, 0x9c7a53, sx5, 0, sz5);
      [0.36, 0.72].forEach(sy => geoAdd(UNIT_BOX, 0x7a5a3c, sx5, sy, sz5, null, 0.38, 0.03, 1.72));
      geoAdd(STUMP_GEO, 0xa5673f, sx5, 1.24, sz5 - 0.45, null, 0.4, 0.24, 0.4);
      geoAdd(ICO_GEO, 0x5a9b5a, sx5, 1.52, sz5 - 0.45, [0, 0.8, 0], 0.24, 0.22, 0.24);
    });
  }

  // ---------- 테라스 경계: 계단·구령대·경사로·초록 그물 펜스 (사진2·3) ----------
  // 구령대는 **현관 바로 앞**, 중앙 계단과 같은 축에 있다 (사용자 확인한 실제 구조).
  // 계단은 구령대 양옆으로 내려가고, 구령대 정면(운동장쪽)이 조회 방향.
  // ===== 정면 필로티 포치 (실사 영상 2026-07-31) =====
  // 실물은 '단상형 구령대'가 아니라 **짙은 목재무늬 사이딩 + 사각기둥 + 평지붕 캔틸레버**의 필로티다.
  // 그 안에 야외 목재 테이블이 놓여 아이들이 운동장을 내려다보며 앉는다. 현관 유리문은 포치 안쪽.
  // 계단은 좌우 2벌이 아니라 **중앙 1벌 6단**이고, 계단 좌측 옹벽만 컬러 모자이크, 우측은 흰 마름돌이다.
  const PODIUM_X = hallCx;
  const PORCH_W = 13, PORCH_Z0 = fz1, PORCH_Z1 = TERR_Z - 1;   // z -24 ~ -19 (깊이 5)
  const PORCH_H = 3.2, WOODC = 0x3b2d24;                        // 짙은 초콜릿 목재무늬
  const PORCH_CZ = (PORCH_Z0 + PORCH_Z1) / 2;

  // 실사: 깊은 fascia(0.7) + 상단 하늘색 캡 몰딩
  box(PORCH_W + 0.8, 0.7, PORCH_Z1 - PORCH_Z0 + 0.6, WOODC, PODIUM_X, PORCH_H, PORCH_CZ + 0.3, { collide: false });
  softBox(PORCH_W + 0.9, 0.08, PORCH_Z1 - PORCH_Z0 + 0.7, 0x5b8fc9, PODIUM_X, PORCH_H + 0.7, PORCH_CZ + 0.3);
  box(PORCH_W + 0.4, 0.08, PORCH_Z1 - PORCH_Z0 + 0.4, 0x2e241d, PODIUM_X, PORCH_H - 0.09, PORCH_CZ + 0.2, { collide: false });
  // 사각 기둥 5개 (앞줄) — 실물은 굵고 목재무늬
  // 실사(hi_0276): 슬림 기둥 4 + 좌측 모서리 기둥 + **우측 와이드 피어**. 좌측벽은 없다(개방)
  [-3.7, -1.25, 1.25, 3.7].forEach(ox => box(0.42, PORCH_H, 0.42, WOODC, PODIUM_X + ox, 0, PORCH_Z1 - 0.4));
  box(0.5, PORCH_H, 0.5, WOODC, PODIUM_X - 6.1, 0, PORCH_Z1 - 0.4);
  box(1.7, PORCH_H, 0.55, WOODC, PODIUM_X + 5.7, 0, PORCH_Z1 - 0.4);
  // 포치 전면 난간 — 실사(hi_0276): **은색 스테인리스가 중앙 끊김 없이 연속**, 개구는 양끝 계단 접속부뿐
  {
    const rlZ = PORCH_Z1 - 0.05;
    softBox(10.6, 0.07, 0.07, 0xc9ced4, PODIUM_X, 1.0, rlZ);
    softBox(10.6, 0.05, 0.05, 0xc9ced4, PODIUM_X, 0.55, rlZ);
    softBox(10.6, 0.05, 0.05, 0xc9ced4, PODIUM_X, 0.15, rlZ);
    for (let t = -5.1; t <= 5.1; t += 0.85) {
      softBox(0.05, 1.0, 0.05, 0xc9ced4, PODIUM_X + t, 0, rlZ);
      softBox(0.08, 0.08, 0.08, 0xe2e6ea, PODIUM_X + t, 1.0, rlZ);
    }
    box(10.6, 1.05, 0.1, 0, PODIUM_X, 0, rlZ, { material: INVIS, noCam: true });   // 낙하 방지
    // 오벌 링 패턴 패널 (실사 hi_0288: 세로봉 사이 장타원 링)
    const ovalTex = ovalRailTexture();
    ovalTex.wrapS = ovalTex.wrapT = THREE.RepeatWrapping;
    ovalTex.repeat.set(16, 1);
    const OVAL_MAT = new THREE.MeshLambertMaterial({ map: ovalTex, alphaTest: 0.4, side: THREE.DoubleSide });
    const op = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 0.8), OVAL_MAT);
    op.position.set(PODIUM_X, 0.56, rlZ);
    op.matrixAutoUpdate = false; op.updateMatrix();
    scene.add(op);
    dynamic.ovalMat = OVAL_MAT;
  }
  // 포치 안 야외 테이블 3세트 (원목 상판 + 양옆 벤치)
  [-4.2, 0, 4.2].forEach(ox => {
    const tx = PODIUM_X + ox, tz = PORCH_CZ + 0.4;
    box(1.7, 0.09, 0.8, 0x8a5a3b, tx, 0.66, tz, { collide: false, walk: true });          // 상판
    [-0.7, 0.7].forEach(lx => box(0.1, 0.66, 0.7, 0x6d4a34, tx + lx, 0, tz));             // 다리판
    [-0.72, 0.72].forEach(bz => {
      box(1.7, 0.08, 0.34, 0x9c6b4a, tx, 0.42, tz + bz, { collide: false, walk: true });  // 벤치 판
      [-0.7, 0.7].forEach(lx => box(0.08, 0.42, 0.3, 0x6d4a34, tx + lx, 0, tz + bz));
    });
  });

  // 측면 계단 2벌 — 실사(hi_0276·hi_0288): 중앙 계단은 없고, 단 양끝에서 **옹벽과 평행하게 좌우로** 8단 하강
  const ST_TREAD = 0.34, ST_N8 = 8, ST_Z = TERR_Z + 1.0;
  [-1, 1].forEach(sd => {
    for (let si = 0; si < ST_N8; si++) {
      box(ST_TREAD, 1 - si * 0.125, 1.4, 0xdcd6ca, PODIUM_X + sd * (5.5 + 0.17 + si * ST_TREAD), -1, ST_Z);
    }
    // ⚠️ 상단 참 — 계단 꼭대기(y0)와 테라스(z≤-18)를 잇는 착지판. 없으면 꼭대기 서쪽이 절벽(보행 시험에서 낙하)
    box(1.6, 1.0, 2.2, 0xdcd6ca, PODIUM_X + sd * 4.85, -1, ST_Z - 0.4, { walk: true });
    // 참 안쪽 끝 가드 — 여기서 중앙 방향으로 더 가면 운동장(-1)으로 떨어진다(보행 시험 2회 낙하)
    softBox(0.06, 1.0, 2.0, 0xc9ced4, PODIUM_X + sd * 4.02, 0, ST_Z - 0.3);
    softBox(0.1, 0.08, 2.0, 0xe2e6ea, PODIUM_X + sd * 4.02, 1.0, ST_Z - 0.3);
    box(0.12, 1.4, 2.2, 0, PODIUM_X + sd * 4.02, 0, ST_Z - 0.3, { material: INVIS, noCam: true });
    // 계단 경사 난간 (남측·바깥면) — 손잡이 + 접지 기둥 3
    const rA = Math.atan2(1, ST_N8 * ST_TREAD) * -sd;
    const rcx2 = PODIUM_X + sd * (5.67 + (ST_N8 * ST_TREAD) / 2);
    softBox(ST_N8 * ST_TREAD + 0.4, 0.07, 0.07, 0xc9ced4, rcx2, 0.35, ST_Z + 0.72, [0, 0, rA]);
    {   // 경사 오벌 패널
      const ot = ovalRailTexture();
      ot.wrapS = ot.wrapT = THREE.RepeatWrapping;
      ot.repeat.set(5, 1);
      const om = new THREE.Mesh(new THREE.PlaneGeometry(ST_N8 * ST_TREAD + 0.3, 0.72),
        new THREE.MeshLambertMaterial({ map: ot, alphaTest: 0.4, side: THREE.DoubleSide }));
      om.position.set(rcx2, -0.02, ST_Z + 0.72);
      om.rotation.z = rA;
      om.matrixAutoUpdate = false; om.updateMatrix();
      scene.add(om);
    }
    [0, 3.5, 7].forEach(si => {
      const sx8 = PODIUM_X + sd * (5.67 + si * ST_TREAD), yt = -si * 0.125 + 0.92;
      softBox(0.05, yt + 1, 0.05, 0xc9ced4, sx8, -1, ST_Z + 0.72);
    });
  });

  // 옹벽 마감 — 계단 **왼쪽만 컬러 모자이크**, 오른쪽은 흰 마름돌 (실사에서 좌우가 다르다)
  const wallFaceZ = TERR_Z + 0.12 + 0.175 + 0.01;   // 옹벽 남쪽(운동장쪽) 면 바로 앞
  const facePanel = (tex, x0f, x1f, tile) => {
    const t = tex; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round((x1f - x0f) / tile)), 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1f - x0f, 1.0), new THREE.MeshLambertMaterial({ map: t }));
    m.position.set((x0f + x1f) / 2, -0.5, wallFaceZ);
    m.matrixAutoUpdate = false; m.updateMatrix();
    scene.add(m);
  };
  // 실사(hi_0276·hi_0288): 모자이크=포치 정중앙 하부 전폭 · 마름돌=동측 계단 아래 저벽 · 서측=흰 판
  facePanel(mosaicTexture(), PODIUM_X - 5.5, PODIUM_X + 5.5, 2.2);
  facePanel(rubbleTexture(), PODIUM_X + 8.6, PODIUM_X + 14, 1.4);
  {
    const wp = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.0), mat(0xece8dd));
    wp.position.set(PODIUM_X - 11.3, -0.5, wallFaceZ);
    wp.matrixAutoUpdate = false; wp.updateMatrix();
    scene.add(wp);
  }
  box(11.4, 0.14, 0.42, 0xf0ece1, PODIUM_X, -0.07, TERR_Z + 0.12, { collide: false });

  // 표지석 2기 — 왼쪽 검은 교훈석, 오른쪽 회색 교가비 (실사 확인)
  // 자연석은 얇으면 '판때기'로 보인다 — 깊이를 두툼하게 주고, 위에 작은 덩어리를 얹어 실루엣을 깬다
  // ⚠️ 표지석은 통과는 막되 **밟고 올라설 수 없어야 한다**(밟히면 지붕 등반 발판이 된다 — 측정으로 확인)
  const stone = (sx, sz, w, h, d, colr, tilt) => {
    box(w + 0.7, 0.24, d + 0.7, 0xcfc7b6, sx, 0, sz);                          // 화강석 기단(낮아서 밟아도 무해)
    solidSoftBox(w, h * 0.72, d, colr, sx, 0.24, sz, [0, tilt, 0]);            // 아랫덩이
    solidSoftBox(w * 0.78, h * 0.34, d * 0.82, colr, sx + w * 0.06, 0.24 + h * 0.72, sz, [0, tilt - 0.22, 0]);
  };
  // 글씨는 돌보다 작게 — 팻말이 돌보다 넓으면 '검은 판때기'로 보인다
  stone(PODIUM_X - 8.6, TERR_Z - 1.8, 1.3, 2.5, 1.0, 0x3a3d40, 0.18);
  const mottoTag = textSign('바르고 크게 자율', { h: 0.19, bg: '#3f4245', fg: '#f2f4f6', border: null, fontPx: 40, pad: 8 });
  mottoTag.position.set(PODIUM_X - 8.55, 1.62, TERR_Z - 1.45);
  mottoTag.rotation.y = 0.18;
  scene.add(mottoTag);
  stone(PODIUM_X + 10.6, TERR_Z - 1.5, 1.9, 2.3, 1.2, 0x9aa0a4, -0.14);
  plane(1.4, 1.2, 0xdec23a, PODIUM_X + 8.9, -0.99, TERR_Z + 1.1);   // 계단 앞 점자블록(실사 hi_0288)
  const songTag = textSign('교 가', { h: 0.22, bg: '#a3a9ad', fg: '#2b2f33', border: null, fontPx: 44, pad: 10 });
  songTag.position.set(PODIUM_X + 10.6, 2.0, TERR_Z - 1.32);
  songTag.rotation.y = -0.14;
  scene.add(songTag);

  // 탑시계 (실사: 운동장에서 가장 눈에 띄는 수직 요소 — 기둥형 4면 시계)
  const CLK_X = PODIUM_X + 17, CLK_Z = TERR_Z - 1.6;
  box(0.9, 0.3, 0.9, 0xcfc7b6, CLK_X, 0, CLK_Z);
  // 실사(hi_0264): 문자판이 지붕선 **위**(약 6m) — 낮으면 건물에 묻힌다
  solidSoftBox(0.3, 5.2, 0.3, 0x4a4f55, CLK_X, 0.3, CLK_Z);
  solidSoftBox(1.0, 1.0, 1.0, 0x51585e, CLK_X, 5.5, CLK_Z);
  softBox(1.15, 0.14, 1.15, 0x3a4046, CLK_X, 6.5, CLK_Z);
  const CLK_MAT = new THREE.MeshBasicMaterial({ map: clockFace() });
  [[0, 0, 0.51], [Math.PI, 0, -0.51], [Math.PI / 2, 0.51, 0], [-Math.PI / 2, -0.51, 0]].forEach(([ry, ox, oz]) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.82), CLK_MAT);
    f.position.set(CLK_X + ox, 6.0, CLK_Z + oz);
    f.rotation.y = ry;
    f.matrixAutoUpdate = false; f.updateMatrix();
    scene.add(f);
  });

  zones.unshift({ x0: PODIUM_X - PORCH_W / 2, x1: PODIUM_X + PORCH_W / 2, z0: PORCH_Z0, z1: TERR_Z, label: '구령대(필로티)' });
  // 동·서 경사로 — 윗끝이 테라스면(y0)과 정확히 만나게 배치(턱 제거), 난간은 경사면에 밀착
  const RAMP_A = 0.235, RAMP_Z = TERR_Z + 2.3;
  const rampSurfY = t => -0.57 - t * Math.sin(RAMP_A);       // 경사면 상면 y (t = 로컬 z)
  [38, -34].forEach(rx2 => {
    box(3.6, 0.2, 4.9, 0xc4bfae, rx2, -0.77, RAMP_Z, { rot: [RAMP_A, 0, 0], collide: false, walk: true });
    [-1.83, 1.83].forEach(ox => {
      box(0.16, 0.22, 4.9, 0xc4bfae, rx2 + ox, -0.57, RAMP_Z, { rot: [RAMP_A, 0, 0], collide: false });        // 연석
      box(0.08, 0.07, 4.9, 0x9aa5ad, rx2 + ox, 0.295, RAMP_Z, { rot: [RAMP_A, 0, 0], collide: false });        // 손잡이 레일
      box(0.07, 0.06, 4.9, 0x9aa5ad, rx2 + ox, -0.11, RAMP_Z, { rot: [RAMP_A, 0, 0], collide: false });        // 중간 레일
      [-1.9, -0.65, 0.65, 1.9].forEach(t => {                                                                  // 지주 (경사 따라 높이 계산)
        box(0.07, 0.9, 0.07, 0x9aa5ad, rx2 + ox, rampSurfY(t), RAMP_Z + t * Math.cos(RAMP_A), { collide: false });
      });
    });
  });
  // 테라스 위 초록 그물 펜스 (통로에만 틈) — 격자 텍스처라 '초록 벽'이 아니라 그물망으로 보임
  const NET_TEX = netTexture();
  NET_TEX.wrapS = NET_TEX.wrapT = THREE.RepeatWrapping;
  const NET_FENCE = new THREE.MeshLambertMaterial({ map: NET_TEX, alphaTest: 0.4, side: THREE.DoubleSide });
  // 구령대(정면 6.6m)와 그 좌우 계단(각 3.4m) 구간은 펜스를 비운다
  // 필로티 앞은 실물에 펜스가 없다 — 모자이크 옹벽 구간(±10.5)까지 비운다
  // 실사(hi_0255·hi_0276): 정면 테라스 가장자리에 그물펜스는 **없다** — 관목 띠와 잔디뿐.
  // 낙하 방지 INVIS 충돌만 남기고 그물은 제거, 대신 관목 점열로 옹벽 위를 채운다.
  const netSegs = [[-40, -36.6], [-31.4, -9.6], [-2.4, PODIUM_X - 10.5], [PODIUM_X + 10.5, 35.4], [40.6, 52]];
  netSegs.forEach(([a, b]) => {
    const len = b - a;
    box(len, 1.6, 0.05, 0, (a + b) / 2, 0.05, TERR_Z - 0.15, { material: INVIS });   // 충돌 유지(낙하 방지)
    for (let px5 = a + 0.9; px5 < b - 0.4; px5 += 1.8) {
      bush(px5, TERR_Z - 0.55, 0.65 + ((px5 * 7) % 3) * 0.12);
    }
  });
  for (let bx3 = -38; bx3 <= 50; bx3 += 4.5) {
    if (Math.abs(bx3 - PODIUM_X) < 11) continue;   // 필로티·계단·표지석 자리
    bush(bx3, TERR_Z - 1.1, 0.8 + rng() * 0.5);
  }
  for (let bx6 = 54; bx6 <= 79; bx6 += 4) bush(bx6, TERR_Z - 1.0, 0.9 + rng() * 0.5);   // 동측 테라스 모서리 관목

  // ---- 서관 ----
  B.wings.forEach(wg => {
    const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
    const totalH = wg.twoStory ? FH * 2 : FH;
    // 북벽 1층: 진짜 뚫린 창 (2층 북벽은 2층 섹션에서 따로 세움)
    const nWins = [];
    wg.rooms.forEach(r => {
      if (r.type === 'stair') return;
      const rcx = (r.span[0] + r.span[1]) / 2, rcw = r.span[1] - r.span[0];
      const ww = Math.min(2.2, rcw - 1.2);
      nWins.push({ c: rcx - rcw / 4, w: ww }, { c: rcx + rcw / 4, w: ww });
    });
    // 계단홀 북측 주차장 문 개구(사용자 확인: 서관·급식동 사이 1층 길)
    wallXWin(wx0, wx1, wz0, wallC, nWins, { h: FH, sill: 1.05, wh: 1.5, innerDir: 1 });
    wallZ(wz0, wz1, wx0, 0, totalH, wallC);
    wallZ(wz0, wz1, wx1, 0, totalH, wallC);
    // S3 외피: 서관 서벽(외부·측문 옆)이 2층 통짜 민벽이었다 — 실물형 창 세트(면창)+배수관
    if (wg.twoStory) {
      [[-41.5], [-44.5], [-47.5]].forEach(([wzc]) => [1.55, 1.55 + FH].forEach(wy => {
        geoAdd(UNIT_PLANE, 0x4a4f42, wx0 - 0.16, wy, wzc, [0, -Math.PI / 2, 0], 1.7, 1.45, 1);
        glassAdd(wx0 - 0.17, wy, wzc, -Math.PI / 2, 1.55, 1.3);
        paneTrim(wx0 - 0.18, wy, wzc, Math.PI / 2, 1.55, 1.3);
      }));
      [-39.2, -48.8].forEach(dz => {
        softBox(0.09, totalH - 0.3, 0.09, 0x9aa5ad, wx0 - 0.22, 0.1, dz);        // 배수관
        softBox(0.16, 0.22, 0.14, 0x9aa5ad, wx0 - 0.22, totalH - 0.5, dz);
      });
    }
    const edges = new Set();
    wg.rooms.forEach(r => {
      const [s0, s1] = r.span;
      const cx = (s0 + s1) / 2, cw = s1 - s0;
      edges.add(s0); edges.add(s1);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: wz1, floor: 0, label: `본관 1층 · ${r.name}` });
      if (r.type !== 'stair') {
        furnish(r, cx, cw, 0, wz0, 1, (wz1 - 1.9) - wz0);   // ⚠️ 남벽이 z-39.9로 후퇴 — 옛 깊이면 가구가 홀에 삐져나온다(보행 시험)
      }
      if (r.type !== 'stair' && !r.innerOnly) {
        const nm = r.name === '도서실' ? '슬기샘 도서관' : r.name;
        sign(nm, doorCOf(r), 2.95, wz1 + 0.18, 0, 0.3);
      }
      if (r.innerOnly) sign(r.name, s0 - 0.18, 2.25, (wz0 + wz1) / 2, Math.PI / 2, 0.32);
    });
    const innerDoorX = new Set(wg.rooms.filter(r => r.innerOnly).map(r => r.span[0]));
    [...edges].filter(x => x > wx0 + 0.01 && x < wx1 - 0.01)
      .forEach(x => {
        // ⚠️ 남벽 후퇴(z-39.9)에 맞춰 칸막이도 짧게 — 옛 깊이면 홀 확장부를 울타리처럼 가로막는다(보행 시험에서 -34.75 정지)
        if (innerDoorX.has(x)) wallZGaps(wz0, wz1 - 1.9, [{ c: (wz0 + wz1) / 2, w: 1.4 }], x, 0, FH, innerC);
        else wallZ(wz0, wz1 - 1.9, x, 0, FH, innerC);
      });
  });
  // 도서관 앞 로비 — 실사(d80_0222): 벤치는 문 **서쪽**(문서고 벽 앞), 반납함만 동쪽
  [0xe8863a, 0x67b26f, 0xf2c94c, 0x67b26f].forEach((cc, i) =>
    box(0.6, 0.42, 0.6, cc, (i < 2 ? -28.25 + i * 0.7 : -26.75 + (i - 2) * 0.7), 0, -37.35, { walk: true }));
  // 실사(d80_0222): 지름 ~2.3m 2단 도넛 + 주황 패딩 기둥 — 1/3 스케일이던 것을 실물 크기로
  const colPole = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 1.0, 12), mat(0xf2ede2));
  colPole.position.set(-18.6, 2.9, -36.9);
  scene.add(colPole);
  const colWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 12), mat(0xe8863a));
  colWrap.position.set(-18.6, 1.5, -36.9);
  scene.add(colWrap);
  const colSeat = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.26, 14), mat(0xf2c94c));
  colSeat.position.set(-18.6, 0.13, -36.9);
  scene.add(colSeat); colliders.push(colSeat);
  const colMid = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.38, 14), mat(0xe8863a));
  colMid.position.set(-18.6, 0.45, -36.9);
  scene.add(colMid);

  // ---- 급식동 (위성 검은 지붕 전체 — 식당홀을 통해 조리실→식품창고로 들어가는 구조) ----
  const kh = K.wallHeight;
  const cookZ = K.cookWallZ, lcW = LC.x[0];
  // 북벽: 진짜 뚫린 상부 창 + 시설관리 바깥문
  const kWins = [];
  for (let wx = kx0 + 2.5; wx < kx1 - 1.5; wx += 4) {
    if (Math.abs(wx - K.backDoorC) > 2.2) kWins.push({ c: wx, w: 2 });
  }
  wallXWin(kx0, kx1, kz0, wallC, kWins, { h: kh, sill: 2.6, wh: 1.0, doors: [{ c: K.backDoorC, w: 1.6 }], innerDir: 1 });
  makeDoor(K.backDoorC - 0.8, kz0, 1.6, 'x', { color: 0x7d848c, swing: -1, closed: true });
  wallZ(kz0, kz1, kx0, 0, kh, wallC);
  // 동벽: 동관 복도로 통하는 개구부(북쪽) + 마당 유리문
  const eCorMid = (kz0 + E.z[0] + E.corridorDepth) / 2;
  // x=8.4 벽: z −58~−44.4 는 양쪽 다 실내(세로복도 ↔ 동관) → 실내색.
  // ⚠️ 동관 서벽을 여기서 한 번만 세운다 (예전엔 동관 쪽에서도 세워 같은 평면 2겹 = 깜빡임)
  wallZGaps(kz0, ez1, [{ c: eCorMid, w: 2.6 }], kx1, 0, kh, innerC);
  wallZGaps(ez1, kz1, [{ c: LC.yardDoorZ, w: 1.8 }], kx1, 0, kh, wallC);
  lintelZ(LC.yardDoorZ, 1.8, kx1, wallC);
  makeDoor(kx1, LC.yardDoorZ - 0.9, 1.8, 'z', { glass: true, swing: 1 });
  windowPane(kx1 + 0.18, 1.9, -47, Math.PI / 2, 1.4, 1.4);
  wallX(kx0, kx1, kz1, FH, kh - FH, wallC);
  roofOver(kx0, kx1, kz0, kz1, kh, K.roofColor);
  // 내부 벽: 세로복도 서벽(식당 문) · 식당|조리실 경계 · 조리실|식품창고 칸막이
  // 세로복도 서벽 — 실사(사용자 지적 #20): 복도에서 **급식실 내부가 보이는 창**이 있다.
  // ⚠️ 창 z 구간은 기존 초록 급식게시판(z -51.8~-49.2)과 문(-44.8~-43.2)을 피해서만 뚫는다.
  {
    const dGap = { c: K.hallEastDoorZ, w: 1.6 };
    const kWins = [{ c: -46.9, w: 3.0 }, { c: -40.9, w: 3.0 }];
    wallZGaps(kz0, kz1, [dGap], lcW, 0, 1.1, innerC);
    wallZGaps(kz0, kz1, [dGap, ...kWins], lcW, 1.1, 1.5, innerC);
    wallZGaps(kz0, kz1, [dGap], lcW, 2.6, FH - 2.6, innerC);
    kWins.forEach(g => {
      glassAdd(lcW, 1.85, g.c, Math.PI / 2, g.w, 1.5);
      paneTrim(lcW, 1.85, g.c, Math.PI / 2, g.w, 1.5, 0.36);
      box(0.45, 1.5, g.w, 0, lcW, 1.1, g.c, { material: INVIS });   // 통행 차단
    });
  }
  lintelZ(K.hallEastDoorZ, 1.6, lcW, innerC);
  makeDoor(lcW, K.hallEastDoorZ - 0.8, 1.6, 'z', { swing: 1 });
  wallXGaps(kx0, lcW, [{ c: K.cookDoorC, w: 1.6 }], cookZ, 0, FH, innerC);
  lintelX(K.cookDoorC, 1.6, cookZ, innerC);
  makeDoor(K.cookDoorC - 0.8, cookZ, 1.6, 'x', { swing: 1 });
  wallZGaps(kz0, cookZ, [{ c: K.storeDoorZ, w: 1.4 }], 0, 0, FH, innerC);
  makeDoor(0, K.storeDoorZ - 0.7, 1.4, 'z', { swing: 1 });
  // 바닥 (식당 테라조 / 조리실 회색 / 창고 베이지) — 슬래브 상면(0.08)보다 위로
  plane(lcW - kx0 - 0.6, kz1 - cookZ - 0.6, 0xe8e6df, (kx0 + lcW) / 2, 0.09, (cookZ + kz1) / 2);
  plane(-kx0 - 0.5, cookZ - kz0 - 0.6, 0xd8dbdd, kx0 / 2, 0.09, (kz0 + cookZ) / 2);
  plane(lcW - 0.5, cookZ - kz0 - 0.6, 0xcfc8bb, lcW / 2, 0.09, (kz0 + cookZ) / 2);
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
  box(0.7, 1.05, 0.5, 0xb8bdc2, -6.4, 3.2, kz0 + 1.3, { collide: false });   // 후드 덕트 (공중 부유 해소)
  box(0.55, 0.35, 1.1, 0xb8bdc2, -6.4, 3.9, kz0 + 0.75, { collide: false });
  const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.75, 12), mat(0xb8bdc2));
  pot2.position.set(-3.9, 0.38, kz0 + 1.6);
  scene.add(pot2); colliders.push(pot2);
  box(3.2, 0.92, 0.9, 0xc4c9cd, -5.5, 0, cookZ - 1.5);
  // 식품창고 선반·쌀포대·박스
  box(0.5, 1.7, 5.5, 0xb08a5e, 4.8, 0, (kz0 + cookZ) / 2);
  [[1.2, kz0 + 1.5], [2.2, kz0 + 2.2], [1.7, kz0 + 3.1]].forEach(([bx4, bz5]) =>
    box(0.7, 0.55, 0.5, 0xe8ddc4, bx4, 0, bz5));
  box(0.8, 0.8, 0.8, 0xc9a06a, 1.2, 0, cookZ - 1.3);
  [0, 1].forEach(i => lamp(-6 + i * 5, kh - CEIL_DROP - 0.05, -44, true));
  lamp(-4, kh - CEIL_DROP - 0.05, (kz0 + cookZ) / 2, true);
  hangSign('급식실', K.doorC + 1.7, FH - CEIL_DROP, fz0 + 0.5, 0, 0.28);
  zones.push({ x0: kx0, x1: lcW, z0: cookZ, z1: kz1, floor: 0, label: '본관 1층 · 급식실' });
  zones.push({ x0: kx0, x1: 0, z0: kz0, z1: cookZ, floor: 0, label: '급식실 · 조리실' });
  zones.push({ x0: 0, x1: lcW, z0: kz0, z1: cookZ, floor: 0, label: '급식실 · 식품창고' });
  const D = K.dutyRoom;
  wallX(D.x[0], D.x[1], D.z[0], 0, FH, innerC);
  wallZ(D.z[0], D.z[1], D.x[1], 0, FH, innerC);
  hangSign('당직실', D.doorC + 1.2, FH - CEIL_DROP, fz0 + 0.5, 0, 0.26);
  box(1.3, 0.74, 0.7, 0xb0a18e, (D.x[0] + D.x[1]) / 2, 0, D.z[0] + 1.2);
  box(1.05, 0.5, 1.95, 0xf2f5f7, D.x[1] - 0.8, 0, (D.z[0] + D.z[1]) / 2);
  zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], floor: 0, label: '본관 1층 · 당직실' });

  // ---- 세로복도 (급식동 안 내부 통로 — 외벽·지붕은 급식동이 담당) ----
  [-52, -47, -42].forEach(lz => lamp(6.9, kh - CEIL_DROP - 0.05, lz, false));
  // 서벽 급식 게시판 (민벽 해소)
  box(0.07, 1.25, 2.6, 0x3f6b52, lcW + 0.19, 1.05, -50.5, { collide: false });   // 벽면(+0.15) 앞
  const menuSign = textSign('오늘의 급식', { h: 0.24, bg: '#ffffff', fg: '#3a7d44', border: null, fontPx: 40, pad: 12 });
  menuSign.position.set(lcW + 0.24, 1.95, -50.5);
  menuSign.rotation.y = Math.PI / 2;
  scene.add(menuSign);
  ['월 · 잡곡밥 · 미역국', '화 · 카레라이스', '수 · 비빔밥 · 만둣국'].forEach((mtxt, mi) => {
    const ms = textSign(mtxt, { h: 0.16, bg: '#fdfaf0', fg: '#4a5058', border: null, fontPx: 30, pad: 10 });
    ms.position.set(lcW + 0.24, 1.45 - mi * 0.32, -50.5);
    ms.rotation.y = Math.PI / 2;
    scene.add(ms);
  });
  zones.push({ x0: LC.x[0], x1: LC.x[1], z0: ez0, z1: kz1, floor: 0, label: '본관 1층 복도' });

  // ===== 중정(마당) 실물화 — 인터로킹 포장 + 원형 화분·원뿔 향나무 + 민트 유리지붕 통로 =====
  {
    const ydX0 = LC.x[1] + 0.3, ydX1 = ex1 - 0.3, ydZ0 = ez1 + 0.3, ydZ1 = fz0 - 0.3;
    const ydCx = (ydX0 + ydX1) / 2, ydCz = (ydZ0 + ydZ1) / 2;
    box(ydX1 - ydX0, 0.045, ydZ1 - ydZ0, 0xb98a72, ydCx, 0, ydCz, { collide: false, walk: true });   // 붉은 인터로킹
    box(ydX1 - ydX0 - 3, 0.055, 1.4, 0x9aa0a4, ydCx, 0, ydCz, { collide: false, walk: true });        // 회색 띠
    // 실사(v80 105~123s): 화분이 통로 **중앙 1열로 연속** + 바닥에 호스
    {
      const hose2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 12), mat(0x2f5e3a));
      hose2.rotation.x = -Math.PI / 2;
      hose2.position.set(ydCx - 9.5, 0.09, ydCz + 1.2);
      scene.add(hose2);
    }
    [[ydCx - 6, ydCz], [ydCx, ydCz], [ydCx + 6, ydCz]].forEach(([hx2, hz2]) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 0.62, 10), mat(0x8a5a3c));
      pot.position.set(hx2, 0.31, hz2);
      scene.add(pot); colliders.push(pot);
      geoSoft(CONE_GEO, 0x3f6b45, hx2, 1.35, hz2, null, 0.72, 1.5, 0.72);
      geoSoft(CONE_GEO, 0x497a4e, hx2, 2.2, hz2, null, 0.45, 1.0, 0.45);
    });
    // 민트 유리지붕 연결통로 (마당 서단 — 세로복도 문 앞)
    [[ydX0 + 1.2, -41]].forEach(([px5, pz5]) => {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx6, sz6]) =>
        solidSoftBox(0.12, 2.3, 0.12, 0x9fd8c4, px5 + sx6 * 1.1, 0, pz5 + sz6 * 1.3));
      softBox(2.6, 0.08, 3.0, 0xbfe3d8, px5, 2.3, pz5);
      softBox(2.8, 0.05, 3.2, 0x9fd8c4, px5, 2.42, pz5);
    });
  }

  // ---- 동관 ----
  // 구조(사용자 확정): 안쪽 복도는 2학년→4학년→과학실(+내부 준비실)에서 끝.
  // 창고는 복도와 이어지지 않는 별도 공간 — 북쪽 바깥문으로만 진입. 복도에 바깥문 없음.
  const shed = E.rooms.find(r => r.external);
  const shed0 = shed.span[0];
  const shedC = (shed.span[0] + shed.span[1]) / 2;
  // 북벽 복도 구간: 진짜 뚫린 창
  const eNWins = [];
  for (let wx = LC.x[1] + 1.8; wx < shed0 - 1.8; wx += 4.4) eNWins.push({ c: wx, w: 2.0 });
  wallXWin(LC.x[1], shed0, ez0, wallC, eNWins, { h: FH, sill: 1.15, wh: 1.5, innerDir: 1 });
  // 북벽 창고 구간: 바깥문 + 문틀 (창고는 외부 진입 전용)
  wallXGaps(shed0, ex1, [{ c: shedC, w: 1.6 }], ez0, 0, FH, wallC);
  lintelX(shedC, 1.6, ez0, wallC);
  makeDoor(shedC - 0.8, ez0, 1.6, 'x', { color: 0x7d848c, swing: -1, closed: true });
  sign(shed.name, shedC, 2.5, ez0 - 0.28, Math.PI, 0.45);
  [shedC - 0.95, shedC + 0.95].forEach(fx5 => box(0.14, 2.3, 0.12, 0x8a6a45, fx5, 0, ez0 - 0.18, { collide: false }));
  box(2.05, 0.14, 0.12, 0x8a6a45, shedC, 2.3, ez0 - 0.18, { collide: false });
  wallZ(ez0, ez1, ex1, 0, FH, wallC);   // 동 외벽 (바깥문 없음 — 빨강 표시에 없음)
  // 동 외벽 디테일: 빗물 홈통 2줄 + 환기 그릴 (창 없는 민벽 해소)
  [-56, -47].forEach(dz2 => {
    box(0.16, 3.5, 0.16, 0xd8d2c6, ex1 + 0.14, 0, dz2, { collide: false });
    box(0.24, 0.14, 0.24, 0xc4bfae, ex1 + 0.14, 3.5, dz2, { collide: false });
  });
  geoAdd(UNIT_PLANE, 0x9aa5ad, ex1 + 0.16, 2.6, -51.5, [0, Math.PI / 2, 0], 0.7, 0.5, 1);
  [0, 1, 2].forEach(gi => geoAdd(UNIT_BOX, 0x6b7178, ex1 + 0.18, 2.72 - gi * 0.12, -51.5, null, 0.02, 0.04, 0.62));
  // (동관 서벽 = 위 급식동 동벽이 겸함 — 여기서 또 세우면 벽 2겹)
  const eBack = r => (r.type === 'classroom' || r.type === 'science') && r.span[1] - r.span[0] >= 6.5;
  const eGaps = E.rooms.filter(r => !r.external && !r.innerOnly).flatMap(r => {
    const g = [{ c: doorCOf(r), w: 1.8 }];
    if (eBack(r)) g.push({ c: r.span[1] - 1.9, w: 1.8 });
    return g;
  });
  // 복도쪽 벽 (창고 앞에서 끝): 문 + 진짜 뚫린 복도창
  const eCWins = E.rooms.filter(r => !r.external && !r.innerOnly).flatMap(r => {
    const cw = r.span[1] - r.span[0];
    return (eBack(r) ? [r.span[0] + cw * 0.42, r.span[0] + cw * 0.6] : [r.span[0] + cw * 0.55, r.span[0] + cw * 0.85])
      .map(wxp => ({ c: wxp, w: 1.3 }));
  });
  wallXWin(ex0, shed0, zCorE, innerC, eCWins, { h: FH, sill: 1.9, wh: 0.9, doors: eGaps });
  wallXGaps(ex0, shed0, eGaps, zCorE, 0, 0.95, wainC, 0.34);
  wallZ(ez0, zCorE, shed0, 0, FH, innerC);   // 복도 동쪽 끝막이 (창고와 분리)
  // 신관(동관) 복도: 실사는 베이지 대형 타일 + 짙은 회색 걸레받이 — 구관(흰 타일+검은 띠)과 다르다
  corridorFloor(ex0 + 0.2, shed0 - 0.2, ez0, zCorE, 0.098, 0xe7e0d0, 0x6a6a66, 0.22);
  // 신관(동관) 정체성은 색이 아니라 **형태**로 낸다 — 순백과 크림은 채움광 보정 뒤 거의 같아진다(채널이 포화).
  // 붉은 벽돌 노출 기둥 + 짙은 회색 걸레받이 (구관의 연두 굽도리와 확실히 구분)
  const eBrick = [];
  for (let bx6 = ex0 + 4.6; bx6 < shed0 - 1; bx6 += 8.6) {
    solidSoftBox(0.5, FH, 0.5, 0xa8503a, bx6, 0, ez0 + 0.27);
    eBrick.push({ c: bx6, w: 0.62 });           // ⚠️ 수납장이 기둥을 관통하지 않게 개구부로 넘긴다
  }
  {   // 걸레받이는 문 개구(eGaps)를 건너뛰며 깐다 — 통짜면 문지방을 가로지른다
    let cur = ex0 + 0.3;
    [...eGaps].sort((p, q) => p.c - q.c).forEach(g => {
      const g0 = g.c - g.w / 2 - 0.1, g1 = g.c + g.w / 2 + 0.1;
      if (g0 > cur + 0.4) geoAdd(UNIT_BOX, 0x5a5e60, (cur + g0) / 2, 0.16, zCorE - 0.18, null, g0 - cur, 0.12, 0.04);
      cur = Math.max(cur, g1);
    });
    if (shed0 - 0.3 - cur > 0.4) geoAdd(UNIT_BOX, 0x5a5e60, (cur + shed0 - 0.3) / 2, 0.16, zCorE - 0.18, null, shed0 - 0.3 - cur, 0.12, 0.04);
  }
  // 실사(v79 420s): 동관 복도 벽에 **적색 3구 신호등 모형** + 창턱 학생 석고 작품 줄
  {
    softBox(0.16, 0.62, 0.1, 0x8f2f2a, 19.5, 1.5, ez0 + 0.26);
    [1.62, 1.8, 1.98].forEach((sy, si2) =>
      geoAdd(UNIT_PLANE, [0xd94848, 0xf2b134, 0x67b26f][si2], 19.5, sy, ez0 + 0.315, null, 0.11, 0.11, 1));
    for (let ax2 = 13; ax2 < 32; ax2 += 3.6)
      geoAdd(UNIT_PLANE, 0xf2efe6, ax2, 1.32, ez0 + 0.47, null, 0.42, 0.5, 1);   // 석고 작품판(창턱 위)
  }
  // 동관도 같은 규칙 — 바깥벽(ez0)=수납장 / 교실측(zCorE)=핸드레일
  lowCabinet(ex0 + 0.3, shed0 - 0.3, ez0, 1, [...eBrick, ...[12, 22, 32].map(c => ({ c, w: 0.9 }))]);
  railWall(ex0 + 0.3, shed0 - 0.3, zCorE, 'x', eGaps, -1);
  [12, 22, 32].forEach(fx4 => fireExt(fx4, 0.098, ez0 + 0.42, ez0 + 0.16));
  // S3 외피: 동관 동벽(x=ex1) 민벽 — 창고 고창 2 + 배수관 2
  [[-52.8], [-49.6]].forEach(([hz2]) => {
    geoAdd(UNIT_PLANE, 0x4a4f42, ex1 + 0.16, 2.55, hz2, [0, Math.PI / 2, 0], 1.5, 0.8, 1);
    glassAdd(ex1 + 0.17, 2.55, hz2, Math.PI / 2, 1.35, 0.65);
    paneTrim(ex1 + 0.18, 2.55, hz2, Math.PI / 2, 1.35, 0.65);
  });
  [-45.6, -56.6].forEach(dz2 => {
    softBox(0.09, FH - 0.4, 0.09, 0x9aa5ad, ex1 + 0.22, 0.1, dz2);
    softBox(0.16, 0.22, 0.14, 0x9aa5ad, ex1 + 0.22, FH - 0.6, dz2);
  });
  exitLight(ex0 + 0.8, 2.45, (ez0 + zCorE) / 2, Math.PI / 2);
  for (let lx = ex0 + 3; lx < shed0 - 1; lx += 6) lamp(lx, FH - CEIL_DROP - 0.05, (ez0 + zCorE) / 2);
  const eEdges = new Set();
  E.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    eEdges.add(s0); eEdges.add(s1);
    if (!r.external && !r.innerOnly) {
      const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
      hangSign(label, doorCOf(r), FH - CEIL_DROP, zCorE - 0.5, 0, 0.28);
      // 신관(동관) 문 = 실사대로 **흰/미색 패널 도어 + 디지털 도어락**(구관의 짙은 원목과 다르다).
      // 도어락은 문틀 옆 고정(softBox — 문짝에 붙이면 드로우콜 +1/문). 전 학교 배선은 +80dc라 동관 한정.
      makeDoor(doorCOf(r) - 0.9, zCorE, 1.8, 'x', { swing: -1, color: 0xf2efe6 });
      softBox(0.07, 0.24, 0.06, 0x22262c, doorCOf(r) + 1.06, 1.15, zCorE - 0.19);
      if (eBack(r)) {
        makeDoor(s1 - 1.9 - 0.9, zCorE, 1.8, 'x', { swing: -1, color: 0xf2efe6 });
        softBox(0.07, 0.24, 0.06, 0x22262c, s1 - 1.9 + 1.06, 1.15, zCorE - 0.19);
      }
    }
    // 남벽(마당쪽): 진짜 뚫린 창
    const sww = Math.min(2.2, cw / 2 - 0.5);
    wallXWin(s0, s1, ez1, wallC, [{ c: cx - cw / 4, w: sww }, { c: cx + cw / 4, w: sww }], { h: FH, sill: 0.95, wh: 1.6, innerDir: -1 });
    furnish(r, cx, cw, 0, ez1, -1, r.external ? ez1 - ez0 : ez1 - zCorE);
    zones.push({ x0: s0, x1: s1, z0: r.external ? ez0 : zCorE, z1: ez1, floor: 0, label: `본관 1층 · ${r.name}` });
  });
  const eInner = new Map(E.rooms.filter(r => r.innerOnly).map(r => [r.span[0], r.name]));
  [...eEdges].filter(x => x > ex0 + 0.01 && x < ex1 - 0.01)
    .forEach(x => {
      if (eInner.has(x)) {   // 과학준비실: 과학실 안에서 들어가는 문
        const zm2 = (zCorE + ez1) / 2;
        wallZGaps(zCorE, ez1, [{ c: zm2, w: 1.4 }], x, 0, FH, innerC);
        makeDoor(x, zm2 - 0.7, 1.4, 'z', { swing: 1 });
        sign(eInner.get(x), x - 0.18, 2.25, zm2, -Math.PI / 2, 0.32);
      } else wallZ(zCorE, ez1, x, 0, FH, innerC);
    });
  roofOver(LC.x[1], ex1, ez0, ez1, FH, roofC);
  zones.push({ x0: ex0, x1: shed0, z0: ez0, z1: zCorE, floor: 0, label: '본관 1층 복도' });
  zones.push({ x0: ex0, x1: fx1, z0: ez1, z1: fz0, label: '마당' });
  tree(14, -41.2, 0.75);
  tree(33, -41.2, 0.85);
  // 마당 채우기: 화단 2 + 벤치 (식재를 촘촘히 — 흙만 보이던 것 해소)
  [[18, -40.6], [27, -42.2]].forEach(([fbx, fbz]) => {
    box(2.4, 0.38, 1.0, 0x8a5a3b, fbx, 0, fbz);
    box(2.5, 0.42, 0.12, 0xb08968, fbx, 0, fbz - 0.5, { collide: false });   // 화단 테두리
    box(2.5, 0.42, 0.12, 0xb08968, fbx, 0, fbz + 0.5, { collide: false });
    [-0.85, -0.3, 0.28, 0.85].forEach((ox8, oi) => {
      bush(fbx + ox8, fbz - 0.18, 0.5 + (oi % 2) * 0.14, [0xd94f6b, 0xf2b134, 0x8fd0a8, 0xc9aee5][oi]);
      bush(fbx + ox8 * 0.7, fbz + 0.22, 0.44 + (oi % 2) * 0.1);
    });
  });
  box(1.8, 0.42, 0.5, 0xc9b8a0, 22.5, 0, -41.4, { walk: true });
  box(1.8, 0.5, 0.1, 0xb08f5e, 22.5, 0.42, -41.65, { collide: false });   // 벤치 등받이

  // ---- 2층 ----
  const westWing = B.wings.find(w => w.twoStory);
  const [ux0, ux1] = westWing.x, [uz0, uz1] = westWing.z;
  const stairRoom = westWing.rooms.find(r => r.type === 'stair');
  const [tx0, tx1] = stairRoom.span;
  const zCor2 = uz1 - B.upper.corridorDepth;
  const wkX = tx0 + 1.5;
  box(wkX - ux0, 0.25, uz1 - uz0, slabC, (ux0 + wkX) / 2, FH - 0.25, (uz0 + uz1) / 2, { walk: true });
  box(tx1 - wkX, 0.25, 2.5, slabC, (wkX + tx1) / 2, FH - 0.25, uz0 + 1.25, { walk: true });
  // ===== U자형(꺾임) 계단 — 실사 확인(2026-07-31): 반 층 올라 계단참에서 180° 돌아 다시 반 층 =====
  // 동쪽 레인(A)으로 6단 → 참(y1.7) → 서쪽 레인(B)으로 6단 → 2층.
  // ⚠️ 시험으로 확정한 두 규칙:
  //  ① B레인은 **공중 디딤판**(밑이 뚫린 얇은 판) — 바닥까지 채우면 그 밑이 1층 입구인데 막아버린다
  //  ② 레인 사이에 **솔리드 칸막이** — 틈새(0.3m)에 끼면 지면 레이가 계단을 못 잡아 바닥으로 샌다
  const stepLo = uz1 - 1, stepHi = uz0 + 2.5;
  const U_TREAD = 0.55, U_RISE = FH / 12, U_N = 6;
  const midX = (wkX + tx1) / 2;
  const LANE_W = (tx1 - wkX) / 2 - 0.2;
  const laneE = midX + 0.06 + LANE_W / 2;
  const laneW = midX - 0.06 - LANE_W / 2;
  // ⚠️ A(오름 시작)는 **서쪽 레인** — 1층 입구 개구부(x -15.5~-13.1)와 정렬돼 진입이 직진이 된다.
  //    동쪽에 두면 좁은 남측 스트립에서 옆걸음해야 해서 두 번의 보행 시험 모두 실패했다.
  for (let i = 0; i < U_N; i++) {
    box(LANE_W, (i + 1) * U_RISE, U_TREAD + 0.03, 0xc9b8a0, laneW, 0, stepLo - (i + 0.5) * U_TREAD);
  }
  // 챌판 문구 스티커 (실사: 계단마다 컬러 띠 글귀)
  [0x9bc1e8, 0xe8863a, 0xc9aee5, 0x67b26f, 0xe8863a, 0x9bc1e8].forEach((cc, si) =>
    geoAdd(UNIT_PLANE, cc, laneW, (si + 1) * U_RISE - 0.06, stepLo - si * U_TREAD + 0.02, null, LANE_W - 0.2, 0.1, 1));
  // 계단참 (전 폭, y1.7) — **베이 북벽까지 채운 플랫폼**. 짧게 두면 북단에서 떨어진다(보행 시험에서 낙하 확인)
  const LAND_Z0 = stepLo - U_N * U_TREAD, LAND_D = (LAND_Z0 - stepHi) - 0.1;
  box(tx1 - wkX - 0.2, 1.7 + U_RISE * 0.5, LAND_D, 0xc9b8a0, midX, 0, LAND_Z0 - LAND_D / 2, { walk: true });
  geoAdd(UNIT_PLANE, 0xf2df8a, midX, 0.9, LAND_Z0 + 0.02, null, tx1 - wkX - 0.2, 1.6, 1);      // 참 남면 노랑 도장
  geoAdd(UNIT_PLANE, 0x67b26f, midX, 1.74, LAND_Z0 + 0.025, null, tx1 - wkX - 0.2, 0.09, 1);   // 참 코 초록띠
  plane(LANE_W, 0.4, 0xd9b545, laneW, 0.105, stepLo + 0.4);                                     // 1층 초입 점자블록
  plane(tx1 - wkX - 0.4, 0.35, 0xcfa85e, midX, 1.87, LAND_Z0 - 0.35);                           // 참 점자블록
  // B 레인 (참에서 북→남 오름, y1.7→3.4) — **동쪽 레인·공중 디딤판** (밑 1층 통행 유지)
  for (let i = 0; i < U_N; i++) {
    const topY = 1.7 + (i + 1) * U_RISE;
    box(LANE_W, 0.28, U_TREAD + 0.03, 0xc9b8a0, laneE, topY - 0.28, LAND_Z0 + (i + 0.5) * U_TREAD, { walk: true });
  }
  // B레인 챌판 스티커 (⚠️ LAND_Z0 선언 뒤에 있어야 한다 — TDZ 사고 1회)
  [0x67b26f, 0x9bc1e8, 0xe8863a, 0xc9aee5, 0x9bc1e8, 0x67b26f].forEach((cc, si) =>
    geoAdd(UNIT_PLANE, cc, laneE, 1.7 + (si + 1) * U_RISE - 0.06, LAND_Z0 + si * U_TREAD - 0.015, [0, Math.PI, 0], LANE_W - 0.2, 0.1, 1));
  // B 상부 착지판 — 전 폭 공중판(y3.1~3.4). 아래는 1층 입구 스트립(머리 위 3.1 확보).
  // 여기서 서쪽으로 걸으면 2층 복도 테라조(3.43)와 3cm 차로 이어진다.
  box(tx1 - wkX - 0.2, 0.3, 1.15, 0xc9b8a0, midX, FH - 0.3, stepLo + 0.05, { walk: true });
  // 레인 사이: 보이는 건 **허리높이 목재 난간벽**, 끼임 방지는 INVIS 전 높이 (3.6짜리 슬래브 벽은 흉하다)
  // 실사(d80_0160): 레인 사이는 목재 반벽이 아니라 **스테인리스 세로봉 + 볼 뉴얼**
  solidSoftBox(0.12, 0.2, stepLo - LAND_Z0 + 0.4, 0xa9a9a4, midX, 0, (stepLo + LAND_Z0) / 2 - 0.2);
  for (let bz2 = LAND_Z0 - 0.1; bz2 < stepLo + 0.2; bz2 += 0.55)
    softBox(0.045, 0.85, 0.045, 0xc8cdd2, midX, 0.22, bz2);
  softBox(0.06, 0.06, stepLo - LAND_Z0 + 0.4, 0xd4d9dd, midX, 1.05, (stepLo + LAND_Z0) / 2 - 0.2);
  [LAND_Z0 - 0.35, stepLo + 0.15].forEach(nz => softBox(0.13, 0.13, 0.13, 0xd4d9dd, midX, 1.11, nz));
  box(0.12, 3.6, stepLo - LAND_Z0 + 0.4, 0, midX, 0, (stepLo + LAND_Z0) / 2 - 0.2, { material: INVIS, noCam: true });
  // B 공중 디딤판 밑을 받치는 측판(스트링거) — 밑에서 올려다볼 때 '떠 있는 판'으로 안 보이게
  {
    const bAng = Math.atan2(1.7, U_N * U_TREAD);
    const bLen = Math.hypot(1.7, U_N * U_TREAD) + 0.5;
    [laneE - LANE_W / 2 + 0.04, laneE + LANE_W / 2 - 0.04].forEach(sx7 =>
      softBox(0.07, 0.34, bLen, 0xb8a88e, sx7, 2.25, LAND_Z0 + (U_N * U_TREAD) / 2, [-bAng, 0, 0]));
  }
  // 서측 낙하 방지 INVIS + 참 안쪽 손잡이
  // ⚠️ 높이 3.6 고정 — 더 올리면 2층(py3.4·충돌밴드 3.95~)에서 계단→복도 건너가기가 막힌다(시험으로 확인)
  box(0.1, 3.6, stepLo - stepHi, 0, wkX + 0.05, 0, (stepLo + stepHi) / 2, { material: INVIS, noCam: true });
  // 2층 슬래브 가장자리 난간벽 — B 착지판에서 복도로 **건너는 남측 구간(z -39.6~)은 비운다**
  wallZ(stepHi, -39.6, wkX, FH, 1.05, 0xb08968, 0.12);
  softBox(0.07, 0.09, LANE_W, 0xb08968, midX, 3.72, LAND_Z0 - 0.3, [0, Math.PI / 2, 0]);
  // 계단실 2톤 도장 (실사: 위 연민트 / 아래 노랑) — 동벽 실내면 스킨
  geoAdd(UNIT_PLANE, 0xf2df8a, (tx1 - 0.17), 0.75, (stepLo + stepHi) / 2, [0, -Math.PI / 2, 0], stepLo - stepHi, 1.5, 1);
  geoAdd(UNIT_PLANE, 0xd7ede4, (tx1 - 0.17), 2.45, (stepLo + stepHi) / 2, [0, -Math.PI / 2, 0], stepLo - stepHi, 1.9, 1);
  sign('2층 ↑', (tx0 + tx1) / 2, 2.5, uz1 + 0.18, 0, 0.45);
  plane(4.0, 1.7, 0xbdbcb6, (tx0 + tx1) / 2 + 0.75, 0.102, uz1 - 0.9);   // 홀 테라조(복도 흰타일과 경계)
  // (주차장 문은 계단 뒤 북벽이 아니라 주복도 fz0의 계단 개구 동쪽 틈새길 — 사용자 사진3 정정.
  //  북벽 문은 계단참(y1.7 솔리드)에 막혀 도달 불가였다)
  plane(3.4, 0.4, 0xd9b545, (tx0 + tx1) / 2 + 0.75, 0.104, uz1 + 0.25);  // 점자블록 띠(사진3)
  // 실사(d80_0160·0169): 계단참 정면(북벽)에 **목재 프레임 대형 통창** — 참에서 밖(주차장)이 보인다
  {
    const cwX = (wkX + tx1) / 2, cwW = 2.6;
    glassAdd(cwX, 3.2, uz0 + 0.15, 0, cwW, 2.6);
    paneTrim(cwX, 3.2, uz0 + 0.15, 0, cwW, 2.6, 0.36);
    geoAdd(UNIT_BOX, 0xb08d5a, cwX, 3.2, uz0 + 0.34, null, cwW + 0.2, 0.09, 0.07);   // 목재 중간틀(가로)
    geoAdd(UNIT_BOX, 0xb08d5a, cwX, 3.2, uz0 + 0.34, null, 0.09, 2.6, 0.07);          // 목재 중간틀(세로)
  }
  zones.push({ x0: tx0, x1: tx1, z0: uz0, z1: uz1, floor: 1, label: '계단' });
  const upEdges = new Set();
  const upNWins = [];
  B.upper.rooms.forEach(r => {
    const [s0, s1] = r.span;
    const cx = (s0 + s1) / 2, cw = s1 - s0;
    upEdges.add(s0); upEdges.add(s1);
    const upGaps = [{ c: doorCOf(r), w: 1.8 }];
    const upBack = r.type === 'classroom' && cw >= 6.5;
    if (upBack) upGaps.push({ c: s1 - 1.9, w: 1.8 });
    // 복도쪽 벽: 문 + 진짜 뚫린 복도창 (1층과 동일)
    const upCWins = (upBack ? [s0 + cw * 0.42, s0 + cw * 0.6] : [s0 + cw * 0.55, s0 + cw * 0.85])
      .map(wxp => ({ c: wxp, w: 1.3 }));
    wallXWin(s0, s1, zCor2, innerC, upCWins, { y0: FH, h: FH, sill: 1.9, wh: 0.9, doors: upGaps });
    upGaps.forEach(gp => makeDoor(gp.c - 0.9, zCor2, 1.8, 'x', { swing: 1, y: FH }));
    const label = SCHOOL.people && SCHOOL.people[r.name] ? `${r.name} 1반` : r.name;
    hangSign(label, doorCOf(r), FH * 2 - CEIL_DROP, zCor2 + 0.5, 0, 0.28);
    furnish(r, cx, cw, FH, uz0, 1, zCor2 - uz0);
    const ww2 = Math.min(2.2, cw - 1.2);
    upNWins.push({ c: cx - cw / 4, w: ww2 }, { c: cx + cw / 4, w: ww2 });
    zones.push({ x0: s0, x1: s1, z0: uz0, z1: zCor2, floor: 1, label: `본관 2층 · ${r.name}` });
  });
  // 2층 북벽·남벽: 진짜 뚫린 창 (서관 벽의 2층 구간)
  wallXWin(ux0, ux1, uz0, wallC, upNWins, { y0: FH, h: FH, sill: 1.05, wh: 1.5, innerDir: 1 });
  // 실사(d80_0181): 2층 남측은 펀치창이 아니라 **목재 리본창 연속 + 하부 격자 불투명유리 난간**
  const upSWins = [];
  for (let wx = ux0 + 1.6; wx <= tx0 - 1.4; wx += 2.6) upSWins.push({ c: wx, w: 2.2 });
  wallXWin(ux0, ux1, uz1, wallC, upSWins, { y0: FH, h: FH, sill: 0.9, wh: 1.7, innerDir: -1 });
  for (const g of upSWins)                                    // 창 아래 반투명 격자유리 띠(안쪽 면)
    geoAdd(UNIT_PLANE, 0xdcebe4, g.c, FH + 0.55, uz1 - 0.18, [0, Math.PI, 0], g.w, 0.62, 1);
  [...upEdges].filter(x => x > ux0 + 0.01 && x < ux1 - 0.01)
    .forEach(x => wallZ(uz0, zCor2, x, FH, FH, innerC));
  zones.push({ x0: ux0, x1: ux1, z0: zCor2, z1: uz1, floor: 1, label: '본관 2층 복도' });
  // 2층 복도: 실사는 **회색 테라조**(구관 흰타일과 다르다). 띠 없음.
  // ⚠️ x 상한은 zone(ux1)이 아니라 **슬래브가 끝나는 wkX** — ux1로 깔면 계단 개구부 위에 바닥이 뜬다.
  corridorFloor(ux0 + 0.2, wkX - 0.1, zCor2, uz1, FH + 0.03, TERRAZZO, TERRAZZO, 0);
  railWall(ux0 + 0.3, wkX - 0.3, uz1, 'x', [], -1, FH, 0xc8cdd2);   // ⚠️ y0=FH — 절대 y면 1층 방 안 허공에 뜬다(실버그)
  for (let lx = ux0 + 3; lx < tx0; lx += 6) lamp(lx, FH * 2 - CEIL_DROP - 0.05, (zCor2 + uz1) / 2);
  // S5: 2층 복도 소품 — 게시판 2·소화기·정수기(실사 학교 2층 복도 표준 구성)
  // (복도창·문 개구를 피한 벽 실구간: 6학년 -32~-31 · 5학년 -23~-22)
  geoAdd(UNIT_PLANE, 0x6f8f6a, -22.5, FH + 1.65, zCor2 + 0.17, null, 0.9, 1.1, 1);   // 게시판
  fireExt(-27, FH + 0.03, zCor2 + 0.42, zCor2 + 0.16);
  solidSoftBox(0.45, 1.1, 0.45, 0xe9ecee, -31.5, FH + 0.03, zCor2 + 0.45);   // 정수기
  softBox(0.3, 0.12, 0.3, 0x9db4c0, -31.5, FH + 1.13, zCor2 + 0.45);
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
  // 실사(2026-07-31): 체육관 본체 상부는 베이지 패널이 아니라 **회색 수직 골판 금속**이고,
  // 붉은 벽돌은 아래 부속동 높이까지만이다.
  const brickC = 0xa8503a, panelC = 0xa8a096;   // 회색 금속 패널 (#a69e94 계열)
  const bandH = 3.2;
  // 남북 긴 벽: 진짜 뚫린 창 2열 (아래 1.35~2.45 · 위 5.05~6.15)
  const gWins = [];
  for (let wx = gx0 + 3; wx < gx1 - 2; wx += 3.6) gWins.push({ c: wx, w: 2 });
  [gz0, gz1].forEach(gwz => {
    wallX(gx0, gx1, gwz, 0, 1.35, brickC, 0.35);
    wallXGaps(gx0, gx1, gWins, gwz, 1.35, 1.1, brickC, 0.35);
    wallX(gx0, gx1, gwz, 2.45, bandH - 2.45, brickC, 0.35);
    wallX(gx0, gx1, gwz, bandH, 5.05 - bandH, panelC, 0.35);
    wallXGaps(gx0, gx1, gWins, gwz, 5.05, 1.1, panelC, 0.35);
    wallX(gx0, gx1, gwz, 6.15, gh - 6.15, panelC, 0.35);
    gWins.forEach(g => {
      glassAdd(g.c, 1.9, gwz, 0, g.w, 1.1);
      glassAdd(g.c, 5.6, gwz, 0, g.w, 1.1);
      paneTrim(g.c, 1.9, gwz, 0, g.w, 1.1, 0.41);
      paneTrim(g.c, 5.6, gwz, 0, g.w, 1.1, 0.41);
      box(g.w, 1.1, 0.45, 0, g.c, 1.35, gwz, { material: INVIS });
    });
  });
  wallZ(gz0, gz1, gx0, 0, bandH, brickC, 0.35);
  wallZGaps(gz0, gz1, [{ c: gz, w: 3 }], gx1, 0, bandH, brickC, 0.35);
  wallZ(gz - 1.5, gz + 1.5, gx1, 2.2, 1.0, brickC, 0.35);   // 문 위 린텔
  wallZ(gz0, gz1, gx0, bandH, gh - bandH, panelC, 0.35);
  wallZ(gz0, gz1, gx1, bandH, gh - bandH, panelC, 0.35);
  // 철문(양쪽 여닫이) + 팻말
  makeDoor(gx1, gz - 1.5, 1.5, 'z', { color: 0x7d848c, swing: 1, closed: true });
  makeDoor(gx1, gz, 1.5, 'z', { color: 0x7d848c, swing: -1, closed: true });
  sign('체육관', gx1 + 0.25, 2.6, gz, Math.PI / 2, 0.5);
  // S6 전실(사용자 구술): 입구→복도(양쪽 화장실)→안쪽 문→본실
  {
    const vx0 = gx1 - 4.3, vh = 3.0;
    const czS = gz + 1.6, czN = gz - 1.6;                 // 복도 남·북 벽
    wallZGaps(gz - 4.6, gz + 4.6, [{ c: gz - 0.8, w: 1.6 }], vx0, 0, vh, 0xe8e4da, 0.14);   // 전실 서벽 + 본실 문 개구 (⚠️전실 폭만 — 전체 깊이면 본실이 갈라진다)
    makeDoor(vx0, gz - 1.6, 1.6, 'z', { glass: true, swing: 1 });
    wallXGaps(vx0, gx1, [{ c: vx0 + 1.15, w: 0.9 }], czS, 0, vh, 0xe8e4da, 0.14); // 남벽 + 남화장실 문
    wallXGaps(vx0, gx1, [{ c: vx0 + 1.15, w: 0.9 }], czN, 0, vh, 0xe8e4da, 0.14); // 북벽 + 북화장실 문
    wallX(vx0, gx1, gz + 4.6, 0, vh, 0xe8e4da, 0.14);    // 남화장실 안벽
    wallX(vx0, gx1, gz - 4.6, 0, vh, 0xe8e4da, 0.14);    // 북화장실 안벽
    [[czS, 1, '남자 화장실'], [czN, -1, '여자 화장실']].forEach(([wz9, sdir, nm9]) => {
      const tz = wz9 + sdir * 1.5;
      solidSoftBox(0.55, 0.8, 0.42, 0xf0f2f4, gx1 - 0.65, 0, tz);                 // 세면대
      geoAdd(CIRC_GEO, 0xd8dde2, gx1 - 0.65, 1.45, wz9 + sdir * 1.72, [0, 0, 0], 0.4, 0.5, 1);   // 거울
      [0, 1].forEach(k9 => solidSoftBox(0.5, 1.5, 0.09, 0xcfd4d9, vx0 + 0.85 + k9 * 1.1, 0, tz + sdir * 1.2));   // 칸막이
      [0, 1].forEach(k9 => solidSoftBox(0.38, 0.42, 0.5, 0xf0f2f4, vx0 + 0.6 + k9 * 1.1, 0, tz + sdir * 1.35));  // 변기
      sign(nm9, vx0 + 1.15, 2.2, wz9 + sdir * 0.2, sdir > 0 ? Math.PI : 0, 0.3);
    });
    zones.push({ x0: vx0, x1: gx1, z0: czN, z1: czS, label: '체육관 전실' });
    zones.push({ x0: vx0, x1: gx1, z0: czS, z1: gz + 4.6, label: '체육관 화장실' });
    zones.push({ x0: vx0, x1: gx1, z0: gz - 4.6, z1: czN, label: '체육관 화장실' });
  }
  // 실사(crop_gym_0068): 외벽 **원통 케이지 옥상 사다리** — 세로 봉 2 + 링 5
  {
    const cgX = gx1 + 0.22, cgZ = gz + 6;
    [-0.16, 0.16].forEach(oz => softBox(0.05, 6.4, 0.05, 0x9aa5ad, cgX, 1.2, cgZ + oz));
    for (let ry = 2.4; ry <= 7.2; ry += 1.2) softBox(0.5, 0.06, 0.62, 0x9aa5ad, cgX, ry, cgZ);
    for (let ru = 1.4; ru <= 7.0; ru += 0.45) softBox(0.04, 0.04, 0.3, 0xb9bfc4, cgX, ru, cgZ);
  }
  // 실사(gym_0078·0086): 운동장 북서 모서리에서 체육관·유치원 사이로 오르는 **아스팔트 통로 + 8단 석계단 + 라바콘 2**
  {
    const keepNW = YOFF;
    YOFF = 0;
    // 높은 단이 북(테라스 경계 z-18) 쪽, 낮은 단이 남(운동장) — 테라스면(0)과 최상단 top이 이어진다.
    // ⚠️ '상단 참' 박스를 남쪽에 두면 계단 남단을 덮어 1m 벽이 된다(보행 시험 2회 실패로 확정) — 참 불필요
    for (let si = 0; si < 8; si++)
      box(3.0, 1 - si * 0.125, 0.34, 0xcfc9bd, -43.5, -1, TERR_Z + 0.17 + si * 0.34);
    box(3.2, 0.04, 5.5, 0x6f7276, -43.5, 0.005, TERR_Z - 3.2, { collide: false, walk: true });   // 아스팔트 통로(테라스 위)
    YOFF = keepNW;
    [[-44.3, -14.6], [-42.7, -15.4]].forEach(([cx7, cz7]) => {
      const cone2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.42, 8), mat(0xe8632e));
      cone2.position.set(cx7, -0.79, cz7);
      scene.add(cone2);
    });
  }
  // 지붕 + 용마루 + 박공면
  // ⚠️ 지붕판 두 장이 용마루에서 서로 겹치거나 처마가 벽 상단을 파고들면
  //    같은 색 면끼리 z-fighting 이 나서 지붕 전체가 반짝인다(실측 6.7㎡ × 3곳).
  //    · 각 판의 안쪽 끝이 정확히 용마루에서 만나게 중심을 바깥으로 민다
  //    · 처마 끝을 벽 상단(gh)보다 0.30 위에 둔다
  const pAng = Math.atan2(2.5, G.depth / 2);
  const panelL = Math.hypot(G.depth / 2, 2.5) + 0.6;
  const halfZ = panelL / 2 * Math.cos(pAng);          // 판 중심의 z 오프셋
  const midY = gh + 0.30 + panelL / 2 * Math.sin(pAng);
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, midY, gz - halfZ, { rot: [-pAng, 0, 0], collide: false });
  box(G.width + 1.4, 0.22, panelL, 0xc35233, gx, midY, gz + halfZ, { rot: [pAng, 0, 0], collide: false });
  const ridgeY = gh + 0.30 + panelL * Math.sin(pAng);
  box(G.width + 1.6, 0.35, 1.5, 0xc35233, gx, ridgeY - 0.06, gz, { collide: false });   // 용마루 캡
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
  // 내부 연두 골판 하단벽 (실내 사진) — 높이를 창턱(1.35)에 맞춰 창을 가리지 않게
  box(G.width - 1, 1.1, 0.1, 0x8fc978, gx, 0.25, gz0 + 0.45, { collide: false });
  box(G.width - 1, 1.1, 0.1, 0x8fc978, gx, 0.25, gz1 - 0.45, { collide: false });
  box(0.1, 1.7, G.depth - 1, 0x8fc978, gx0 + 0.45, 0.25, gz, { collide: false });
  box(0.1, 1.7, G.depth - 1, 0x8fc978, gx1 - 0.45, 0.25, gz, { collide: false });
  [gz0 + 0.45, gz1 - 0.45].forEach(gwz2 =>   // 골판 상단 마감 몰딩
    box(G.width - 1, 0.09, 0.14, 0xe8ebee, gx, 1.35, gwz2, { collide: false }));
  // 북쪽: 방송실 | 무대 | 준비실 (입구에서 보면 우측)
  const gFrontZ = gz0 + 3.6;
  wallXGaps(gx0, -73, [{ c: -75.5, w: 1.6 }], gFrontZ, 0, 2.8, innerC);
  wallX(-73, -69, gFrontZ, 0, 2.8, innerC);
  wallXGaps(-55, -51.2, [{ c: -53, w: 1.6 }], gFrontZ, 0, 2.8, innerC);
  [[-73], [-69], [-55], [-51.2]].forEach(([px2]) => wallZ(gz0, gFrontZ, px2, 0, 2.8, innerC));
  // 방송실 (사진5: 초록 벽 + 믹서 + 마이크 + 모니터)
  box(4.7, 2.6, 0.07, 0x7cc26b, -75.5, 0, gz0 + 0.4, { collide: false });
  box(0.07, 2.6, 3.2, 0x7cc26b, gx0 + 0.4, 0, gz0 + 1.8, { collide: false });
  sign('방송실', -75.5, 2.35, gFrontZ + 0.18, 0, 0.4);
  box(1.8, 0.74, 0.7, 0x8a6a52, -75.5, 0, gz0 + 1.1);
  box(1.1, 0.14, 0.5, 0x2b2e33, -75.7, 0.76, gz0 + 1.05, { rot: [0.18, 0, 0], collide: false });
  box(0.45, 0.36, 0.05, 0x14161a, -76.2, 0.95, gz0 + 0.85, { collide: false });
  box(0.45, 0.36, 0.05, 0x14161a, -74.9, 0.95, gz0 + 0.85, { collide: false });
  const micPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), mat(0x30343a));
  micPole.position.set(-75.1, 0.95, gz0 + 1.15);
  scene.add(micPole);
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0x555b62));
  micHead.position.set(-75.1, 1.13, gz0 + 1.15);
  scene.add(micHead);
  zones.push({ x0: gx0, x1: -73, z0: gz0, z1: gFrontZ, label: '체육관 방송실' });
  // 무대 (사진6: 검은 상단막 + 정림초등학교 + 회색 커튼)
  box(14, 0.9, 3.6, 0xb5793f, -62, 0, gz0 + 1.8, { walk: true });
  box(2.4, 0.45, 1.1, 0xa96f3b, -62, 0, gFrontZ + 0.55, { walk: true });
  box(13.6, 3.2, 0.1, 0, -62, 0.9, gz0 + 0.5, { material: CURTAIN, collide: false });
  box(14.6, 0.8, 0.2, 0x1a1c20, -62, 4.2, gFrontZ - 0.2, { collide: false });
  const gymBanner = textSign('정림초등학교', { h: 0.4, bg: '#1a1c20', fg: '#ffffff', border: null, fontPx: 48, pad: 14 });
  gymBanner.position.set(-62, 4.25, gFrontZ - 0.05);
  scene.add(gymBanner);
  box(14.6, 0.14, 0.12, 0xd8b24a, -62, 3.76, gFrontZ - 0.16, { collide: false });   // 금장 트림
  // 준비실 (사진7: 매트·뜀틀·공 카트)
  sign('준비실', -53, 2.35, gFrontZ + 0.18, 0, 0.4);
  box(0.07, 2.6, 3.2, 0x7cc26b, -51.35, 0, gz0 + 1.8, { collide: false });
  box(2.2, 0.5, 1.5, 0x2f6fd0, -53.6, 0, gz0 + 1.1);
  [[1.05, 0.3], [0.85, 0.6], [0.68, 0.9]].forEach(([w, y], i) => box(w, 0.3, 0.7, i === 2 ? 0xd9b382 : 0xc79a63, -52, y - 0.3, gz0 + 0.9));
  box(1.0, 0.85, 0.75, 0xd0392e, -54.2, 0, gz0 + 2.8);
  box(1.0, 0.85, 0.75, 0x2b4fa0, -53, 0, gz0 + 2.9);
  [[-54.4, 0.95], [-54, 0.98]].forEach(([bx2, by]) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat([0xf2c94c, 0x4d9bd6][bx2 < -54.2 ? 0 : 1]));
    ball.position.set(bx2, by, gz0 + 2.8);
    scene.add(ball);
  });
  zones.push({ x0: -55, x1: -51.2, z0: gz0, z1: gFrontZ, label: '체육관 준비실' });
  // 화장실 (동쪽 입구 양옆)
  [[gz0, 1, '화장실(여)'], [gz1, -1, '화장실(남)']].forEach(([wz, d, nm]) => {
    wallZ(Math.min(wz, wz + d * 3.2), Math.max(wz, wz + d * 3.2), gx1 - 3.6, 0, 2.8, innerC);
    wallXGaps(gx1 - 3.6, gx1, [{ c: gx1 - 1.6, w: 1.3 }], wz + d * 3.2, 0, 2.8, innerC);
    sign(nm, gx1 - 1.6, 2.4, wz + d * (3.2 + 0.16), d > 0 ? 0 : Math.PI, 0.4);   // 벽면에 밀착
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 0.75, 0, wz + d * 0.75);
    box(0.9, 1.3, 0.9, 0xe8edf2, gx1 - 2.45, 0, wz + d * 0.75);
    box(0.5, 0.8, 0.45, 0xf2f5f7, gx1 - 1.6, 0, wz + d * 2.6);
    // 수도꼭지 + 거울
    geoAdd(UNIT_BOX, 0xb8bdc2, gx1 - 1.6, 0.92, wz + d * 2.78, null, 0.05, 0.16, 0.05);
    geoAdd(UNIT_BOX, 0xb8bdc2, gx1 - 1.6, 1.0, wz + d * 2.68, null, 0.05, 0.05, 0.16);
    geoAdd(UNIT_PLANE, 0xcfe0ea, gx1 - 1.6, 1.55, wz + d * 2.98, [0, d > 0 ? Math.PI : 0, 0], 0.7, 0.8, 1);
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
  // 아래 창 양옆 남색 커튼 (실내 사진)
  for (let wx = gx0 + 3; wx < gx1 - 2; wx += 3.6) {
    [[gz0, -1], [gz1, 1]].forEach(([wz, dir]) => {
      box(0.45, 2.3, 0.14, 0x2e3f66, wx - 1.22, 0.55, wz + dir * 0.55, { collide: false });
      box(0.45, 2.3, 0.14, 0x2e3f66, wx + 1.22, 0.55, wz + dir * 0.55, { collide: false });
    });
  }
  sign('체육관', gx1 + 0.25, gh - 1.2, gz, Math.PI / 2, 0.9);
  zones.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, label: '체육관' });

  // ---------- 유치원 놀이터 (체육관 남쪽 미니 놀이터 — 위성사진) ----------
  // 위성+사용자 확인: 유치원놀이터는 운동장 서변·**운동장과 같은 높이(y-1)**
  const kpX = -48, kpZ = -10;
  const keepKP = YOFF;
  YOFF = -1;
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
  // 실사(gym_0073): 파랑 그늘막 텐트 + 야자수형 그늘 기둥 + 파랑 원통 터널 미끄럼틀
  [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(([ox, oz]) =>
    solidSoftBox(0.09, 2.0, 0.09, 0x3a6ea5, kpX - 2.6 + ox, 0, kpZ + 1.6 + oz));
  softBox(2.9, 0.1, 2.9, 0x4d9bd6, kpX - 2.6, 2.0, kpZ + 1.6);
  softBox(2.0, 0.08, 2.0, 0x3a6ea5, kpX - 2.6, 2.35, kpZ + 1.6);             // 텐트 꼭대기
  solidSoftBox(0.16, 2.4, 0.16, 0x9c7a53, kpX + 3.2, 0, kpZ - 1.8);           // 야자수 줄기
  [[0.6, 0.2], [-0.6, 0.1], [0.1, 0.65]].forEach(([ox, oz]) =>
    geoSoft(ICO_GEO, 0x4d8b4d, kpX + 3.2 + ox, 2.5, kpZ - 1.8 + oz, [0, ox * 3, 0], 0.75, 0.3, 0.75));
  {                                                                            // 파랑 터널 미끄럼틀
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.2, 10, 1, true), mat(0x4d9bd6));
    tun.rotation.z = 1.05;
    tun.position.set(kpX + 0.6, 0.85, kpZ - 2.2);
    scene.add(tun);
    solidSoftBox(0.8, 1.3, 0.8, 0xe8863a, kpX + 1.5, 0, kpZ - 2.2);           // 승강대
  }
  sign('유치원 놀이터', kpX + 5.6, 0.5, kpZ - 3.2, Math.PI / 2, 0.4);
  YOFF = keepKP;
  zones.unshift({ x0: kpX - 5.5, x1: kpX + 5.5, z0: kpZ - 4.2, z1: kpZ + 4.2, label: '유치원 놀이터' });

  // ---------- 텃밭 (E키로 물주기) ----------
  const GA = SCHOOL.garden;
  // 실사 디테일: 검은 멀칭 위 호스 뭉치 + 붉은 대야
  {
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 6, 14), mat(0x2f5e3a));
    hose.rotation.x = -Math.PI / 2;
    hose.position.set(GA.center[0] - 7, 0.08, GA.center[1] + 3.4);
    scene.add(hose);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.3, 10), mat(0xc0392b));
    basin.position.set(GA.center[0] - 5.6, 0.15, GA.center[1] + 3.2);
    scene.add(basin); colliders.push(basin);
  }
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
      const bedLabel = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '유치원', '사랑반', '나래반'][bedIdx] || `${bedIdx + 1}번 밭`;
      const gsign2 = textSign(bedLabel, { h: 0.2, bg: '#24262c', fg: '#ffffff', border: null, fontPx: 40, pad: 12 });
      gsign2.position.set(bcx - 2.62, 0.72, bcz);   // 이랑 모서리에 걸치지 않게 안쪽으로
      gsign2.rotation.y = Math.PI / 2;
      scene.add(gsign2);
      geoAdd(UNIT_BOX, 0x555b62, bcx - 2.62, 0.35, bcz, null, 0.04, 0.72, 0.04);
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
  box(0.09, 1.55, 0.09, 0x9c6644, axg - 5.4, 0, gdz1 + 0.6, { collide: false });
  box(0.09, 1.55, 0.09, 0x9c6644, axg - 3.6, 0, gdz1 + 0.6, { collide: false });
  // 현수막 — 자기 지주 2개 위에 (펜스에 파묻혀 있던 것 수정)
  const bnX = axg + 4.6, bnZ = gdz1 + 0.75;
  const bn2 = textSign('2026 학교 치유텃밭 프로그램 운영', { h: 0.3, bg: '#ffffff', fg: '#3a7d44', border: '#7fc26b' });
  bn2.position.set(bnX, 1.45, bnZ);
  scene.add(bn2);
  [-2.55, 2.55].forEach(ox => box(0.08, 1.85, 0.08, 0x9aa5ad, bnX + ox, 0, bnZ, { collide: false }));
  box(5.2, 0.06, 0.06, 0x9aa5ad, bnX, 1.8, bnZ, { collide: false });
  // 실사(사용자 위성 구술): 텃밭 근처에 나무의자·쉴 곳 — 입구 양옆 등받이 벤치 2 + 그늘나무
  [[axg - 4.2], [axg + 4.2]].forEach(([bxw]) => {
    const bzw = gdz1 + 1.9;
    box(1.7, 0.08, 0.42, 0x9c6644, bxw, 0.42, bzw, { walk: true });            // 좌판
    box(1.7, 0.5, 0.07, 0x8a5a3a, bxw, 0.72, bzw + 0.2, { collide: false });   // 등받이(텃밭 쪽 보고 앉음)
    [-0.7, 0.7].forEach(ox => box(0.09, 0.42, 0.36, 0x6f4a2f, bxw + ox, 0, bzw, { collide: false }));
  });
  tree(axg - 7.5, gdz1 + 2.2, 1.15);
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

  // ===== 통학로 (실사 + 사용자 확인: "정문 기준 오른쪽길(큰 나무 있는 곳)에서 구령대까지") =====
  // 아이들은 모래 운동장을 가로지르지 않고 **동쪽 가장자리를 돌아** 구령대 계단으로 온다.
  // 포장 = 베이지 블록 + **중앙 노란 점자블록**(실측 #efd9ad / #ecd194) — 학교 전체를 잇는 시각 축.
  const PAVE_C = 0xefd9ad, TACT_C = 0xecd194, PAVE_W = 3.0, TACT_W = 0.55;
  // seg: [x0, x1, z0, z1] — 가로/세로 자동 판별
  // ⚠️ ②는 큰나무(46,34) 줄기와 데크(x~49.85)를 피해 그 **동쪽**으로 지난다.
  //    x 45~48로 두면 나무 줄기 충돌에 막혀 길이 끊긴다(측정으로 확인).
  [[28, 53.0, 38.5, 41.5],      // ① 정문 마당 → 동쪽으로
   [50.0, 53.0, -13.5, 38.5],   // ② 동쪽 북상 — ①(z38.5~)·③(~-13.5)과 상면 중첩 금지
   [4.5, 53.0, -16.5, -13.5],   // ③ 옹벽 앞을 따라 서쪽으로 → 구령대 계단
  ].forEach(([x0p, x1p, z0p, z1p]) => {
    const w = x1p - x0p, d = z1p - z0p, cx2 = (x0p + x1p) / 2, cz2 = (z0p + z1p) / 2;
    box(w, 0.05, d, PAVE_C, cx2, 0, cz2, { collide: false, walk: true });
    // 점자블록은 긴 축을 따라 중앙 1줄
    if (w >= d) box(w, 0.016, TACT_W, TACT_C, cx2, 0.05, cz2, { collide: false });
    else box(TACT_W, 0.016, d, TACT_C, cx2, 0.05, cz2, { collide: false });
  });
  // 큰나무 데크 진입 포장 — 통학로에서 데크로 꺾어 들어가는 짧은 갈래
  box(4.2, 0.05, 2.6, PAVE_C, 47.6, 0, 30.4, { collide: false, walk: true });
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
  // 골대는 trackTexture()가 그린 골라인 위에 정확히 선다
  // (캔버스 1024px=96m, strokeRect 반폭 260px → 260 × 96/1024 = 24.375m)
  const GOAL_DX = 24.375;
  goalAt(F.center[0] - GOAL_DX, F.center[1], -1, 1);
  // 위성원장 #6: 동측은 흰 소형이 아니라 **대형 황토 목재틀** 골대 (hi_0255·gym_0062)
  {
    const gxp = F.center[0] + GOAL_DX, gcz = F.center[1], sc = 1.4, WOOD_G = 0xc99a4e;
    [-2.6 * sc, 2.6 * sc].forEach(zo => box(0.14, 2 * sc, 0.14, WOOD_G, gxp, -1, gcz + zo));
    box(0.14, 0.14, 5.2 * sc + 0.14, WOOD_G, gxp, -1 + 2 * sc, gcz, { collide: false });
    [-2.6 * sc, 2.6 * sc].forEach(zo => box(1.15 * sc, 0.12, 0.12, WOOD_G, gxp + 0.58 * sc, -1 + 2 * sc - 0.06, gcz + zo, { collide: false }));
    box(0.12, 2 * sc, 5.4 * sc, 0, gxp + 1.1 * sc, -1, gcz, { material: NET });
    box(1.15 * sc, 0.08, 5.4 * sc, 0, gxp + 0.55 * sc, -1 + 1.95 * sc, gcz, { material: NET, collide: false });
  }
  goalAt(20, 4, 1, 0.75);   // 위성원장: 중동부 이동식 흰 소형 골대 (gym_0078)
  // (실사 영상 확인 2026-07-31) 미니 골대·미니 코트는 실제 운동장에 없다 — 제거함
  // 야간 조명탑 (사진2·3) — 큰나무(46,34) 시야를 가리지 않게 서쪽으로
  const FLOOD = new THREE.MeshBasicMaterial({ color: 0xb9bfc4 });   // 낮=소등, 밤=점등 (main에서 전환)
  dynamic.floodMat = FLOOD;
  // 실사(hi_0255·hi_0264): 콘크리트 전주 + 가로암 3단 × 5등, 약 12m — 통학로변
  // 위성원장 #7: 조명탑은 남서가 아니라 **북측 테라스 앞 동·서 각 1** (hi_0255·gym_0078)
  [[44, -15], [-30, -14]].forEach(([lx3, lz3]) => {
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 12, 8), mat(0x8d9298));
    lp.position.set(lx3, 5, lz3);
    scene.add(lp); colliders.push(lp);
    [8.4, 9.4, 10.4].forEach(ay => {
      box(3.2, 0.13, 0.13, 0x3c4146, lx3, ay, lz3, { collide: false });
      for (let ox = -1.28; ox <= 1.28; ox += 0.64)
        box(0.3, 0.3, 0.18, 0, lx3 + ox, ay + 0.16, lz3, { material: FLOOD, collide: false });
    });
  });
  // 위성원장 #5: 야외 농구골대 1기 — 운동장 북동 통로 어귀, 서향 (hi_0258~0267)
  {
    const bx = 46, bz = -13;
    const bpost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.6, 8), mat(0x8d9298));
    bpost.position.set(bx, terrY(bz) + 1.8, bz);
    scene.add(bpost); colliders.push(bpost);
    box(0.9, 0.12, 0.12, 0x8d9298, bx - 0.55, terrY(bz) + 3.15, bz, { collide: false });          // 암
    box(0.06, 1.05, 1.8, 0xffffff, bx - 1.05, terrY(bz) + 2.55, bz, { collide: false });          // 백보드
    box(0.05, 0.08, 0.08, 0xe8863a, bx - 1.16, terrY(bz) + 2.62, bz, { collide: false });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 14), mat(0xe8863a));
    rim.rotation.x = Math.PI / 2; rim.position.set(bx - 1.38, terrY(bz) + 2.6, bz);
    scene.add(rim);
  }
  // 위성원장 #12: 본관 동측 뒤 지붕 위로 솟는 거대 침엽수 (hi_0255·hi_0258)
  pine(33, -40.5, 2.6);   // (-46은 동관 내부 — 마당 동측으로)
  zones.push({ x0: F.center[0] - F.width / 2, x1: F.center[0] + F.width / 2, z0: F.center[1] - F.depth / 2, z1: F.center[1] + F.depth / 2, label: '운동장' });

  // ---------- 놀이터 ----------
  const [px, pz] = SCHOOL.playground.center;
  box(17, 0.05, 14, 0xb4b8bd, px, 0, pz, { collide: false, walk: true });   // 사진: 회색 벽돌 포장
  // 실사: 놀이기구 아래는 회색 포장이 아니라 **모래밭**이고, 옆에 잔디밭이 붙어 있다
  box(15, 0.058, 12, 0xdcc9a0, px + 0.5, 0, pz - 0.3, { collide: false, walk: true });   // 모래밭 — 그네·구름사다리까지 안에(v79_0030)
  // 검정 고무 경계블록 (실사 v79_0030)
  [[15.4, 0.2, 0, -6.2], [15.4, 0.2, 0, 6.2], [0.2, 12.4, -7.7, 0], [0.2, 12.4, 7.7, 0]].forEach(([w2, d2, ox2, oz2]) =>
    box(w2, 0.075, d2, 0x26282c, px + 0.5 + ox2, 0, pz - 0.3 + oz2, { collide: false }));
  box(17, 0.04, 4.5, 0x7fb86a, px, 0, pz + 9.3, { collide: false, walk: true });        // 남측 잔디밭
  // 자전거 교통안전 코스 (서쪽 별도 포장 — 노란 라인 + 숫자 타일)
  const rcx = px - 14, rcz = pz - 0.5;
  // 폭 11 = 놀이터 포장(px±8.5) 서단과 딱 맞닿게. 12로 두면 0.5m 겹치고 상면 차가 2mm라 반짝인다
  box(11, 0.048, 11, 0xb4b8bd, rcx, 0, rcz, { collide: false, walk: true });
  // 실사: 노란 직선이 아니라 **컬러 회전교차로 원 + 차선 + 사방치기(숫자·강아지)** — 캔버스 1장(1dc)
  {
    const crs = new THREE.Mesh(UNIT_PLANE, new THREE.MeshLambertMaterial({ map: courseTexture() }));
    crs.scale.set(10.6, 10.6, 1);
    crs.rotation.x = -Math.PI / 2;
    crs.position.set(rcx, YOFF + 0.056, rcz);
    crs.matrixAutoUpdate = false; crs.updateMatrix();
    scene.add(crs);
  }
  // (숫자 타일은 courseTexture 안에 그려져 있다 — 별도 팻말은 YOFF 누락으로 1m 공중부양했었음)
  zones.unshift({ x0: rcx - 6, x1: rcx + 6, z0: rcz - 5.5, z1: rcz + 5.5, label: '자전거 교통 코스' });
  const slX = px - 4.5, slZ = pz - 3;
  box(1.7, 0.14, 1.7, 0x9c7a53, slX, 1.62, slZ, { walk: true });
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([lx, lz]) => box(0.12, 1.62, 0.12, 0x8a6a45, slX + lx, 0, slZ + lz, { collide: false }));
  // 실사: 미끄럼면은 좁은 2조각이 아니라 **넓은 스테인리스 한 판** + 양옆 가드
  box(1.0, 0.07, 2.9, 0xd6dbe0, slX, 0.85, slZ + 1.95, { rot: [0.63, 0, 0], collide: false, walk: true });
  [-0.56, 0.56].forEach(ox => box(0.08, 0.2, 2.9, 0x9aa5ad, slX + ox, 0.9, slZ + 1.95, { rot: [0.63, 0, 0], collide: false }));
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
  // 실사(v79_0030): 스테인리스 2빔 + 빔 끝 반매몰 타이어
  box(0.5, 0.4, 0.9, 0x9aa5ad, ssX, 0, ssZ);
  box(3.2, 0.07, 0.3, 0xc8cdd2, ssX, 0.42, ssZ - 0.28, { rot: [0, 0, 0.13], collide: false, walk: true });
  box(3.2, 0.07, 0.3, 0xc8cdd2, ssX, 0.42, ssZ + 0.28, { rot: [0, 0, -0.13], collide: false, walk: true });
  [[-1.35, -0.28], [1.35, -0.28], [-1.35, 0.28], [1.35, 0.28]].forEach(([ox3, oz3]) =>
    solidSoftBox(0.55, 0.26, 0.22, 0x26282c, ssX + ox3, 0, ssZ + oz3));
  [[0.9, 1], [1.25, 0], [1.6, -1]].forEach(([bh, zo]) => {
    [-0.7, 0.7].forEach(sx => box(0.08, bh, 0.08, 0x3a6ea5, px + 3.5 + sx, 0, pz - 3.5 + zo, { collide: false }));
    const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), mat(0xc8cdd2));
    bb.rotation.z = Math.PI / 2;
    bb.position.set(px + 3.5, bh - 1, pz - 3.5 + zo);
    scene.add(bb);
  });
  // 목재 격자 정글짐 (실사: 나무 봉 격자 — box() 봉이라 밟고 올라갈 수 있다. 놀이기구는 올라가는 게 정상)
  {
    const jgX = px + 1.2, jgZ = pz - 3.2, JG = 0x9c7a53;
    [0, 0.75, 1.5].forEach(jy => {
      [-1.05, -0.35, 0.35, 1.05].forEach(jo => {
        box(2.2, 0.09, 0.09, JG, jgX, jy + 0.66, jgZ + jo, { walk: true });
        box(0.09, 0.09, 2.2, JG, jgX + jo, jy + 0.66, jgZ, { walk: true });
      });
    });
    [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]].forEach(([ox, oz]) =>
      box(0.11, 2.25, 0.11, 0x8a6a45, jgX + ox, 0, jgZ + oz));
  }
  // 구름사다리 (철봉 옆)
  {
    const mX = px + 6.8, mZ = pz - 1.5, MB = 0x3a6ea5;
    [[-0.45, -1.6], [0.45, -1.6], [-0.45, 1.6], [0.45, 1.6]].forEach(([ox, oz]) =>
      box(0.09, 1.9, 0.09, MB, mX + ox, 0, mZ + oz));
    [-0.45, 0.45].forEach(ox => box(0.07, 0.07, 3.4, MB, mX + ox, 1.9, mZ, { collide: false }));
    for (let mzo = -1.3; mzo <= 1.3; mzo += 0.4) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mat(0xc8cdd2));
      rung.rotation.z = Math.PI / 2;
      rung.position.set(mX, 1.93, mZ + mzo);
      scene.add(rung);
    }
  }
  // 큰 나무 + 나무 둘레 원형 벤치 (실사: 놀이터 옆 랜드마크)
  {
    const btX = rcx + 3.2, btZ = rcz - 4.6;   // 실사(v79_0030): 페인팅 원 바로 옆·그늘막 밖 북측
    tree(btX, btZ, 1.5);
    for (let ai = 0; ai < 8; ai++) {
      const a = (ai / 8) * Math.PI * 2;
      box(1.05, 0.09, 0.4, 0x30343a, btX + Math.cos(a) * 1.15, 0.42, btZ + Math.sin(a) * 1.15,
        { rot: [0, -a, 0], walk: true });
      box(0.07, 0.42, 0.07, 0x30343a, btX + Math.cos(a) * 1.15, 0, btZ + Math.sin(a) * 1.15, { collide: false });
    }
  }
  // 음수대 + 아치 캐노피 (실사: 스테인리스 급수대 4구 + 암갈색 아치 지붕)
  {
    const wfX = px - 2, wfZ = pz - 9;   // 실사(v79_0225): 숲놀이터 곁 수풀가 — 운동장 서단 고립 아님
    solidSoftBox(2.6, 0.82, 0.6, 0xc8cdd2, wfX, 0, wfZ);
    [-0.9, -0.45, 0, 0.45, 0.9].forEach(ox => softBox(0.07, 0.16, 0.07, 0x9aa5ad, wfX + ox, 0.82, wfZ));   // 5구
    [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]].forEach(([ox, oz]) =>
      solidSoftBox(0.1, 2.1, 0.1, 0x9aa5ad, wfX + ox, 0, wfZ + oz));
    [[-0.7, 0.24, 0.5], [0, 0.4, 0], [0.7, 0.24, -0.5]].forEach(([ox, ry, rz]) =>
      softBox(1.1, 0.06, 1.5, 0x6d4a34, wfX + ox, 2.1 + ry, wfZ, [0, 0, rz]));
  }
  // 자전거 코스 위 긴 그늘막 (실사: 목재무늬 기둥 + 회색 곡면 지붕이 코스를 덮는다)
  {
    const cnX = rcx, cnZ = rcz;
    // ⚠️ 기둥은 포장(±5.5) **바깥**, 그리고 동측 중앙(놀이터로 나가는 길목 z=27.5)은 비운다
    //    — 보행 시험에서 두 번 걸려서 확정한 배치
    [[-5.65, -4.2], [-5.65, 0], [-5.65, 4.2], [5.65, -4.2], [5.65, 4.2]].forEach(([ox, oz]) =>
      solidSoftBox(0.14, 2.5, 0.14, 0x8a6a45, cnX + ox, 0, cnZ + oz));
    [[-3.4, 0.2, 0.3], [0, 0.45, 0], [3.4, 0.2, -0.3]].forEach(([ox, oy, rz]) =>
      softBox(3.6, 0.07, 10.4, 0x9db4c0, cnX + ox, 2.5 + oy, cnZ, [0, 0, rz]));
  }
  // 안전수칙 안내판 (실사 v79_0045: 파란 2기둥 안내판)
  {
    const sb = textSign('어린이 놀이시설 안전수칙', { h: 0.5, bg: '#f2f5f8', fg: '#2e5fa8', border: '#2e5fa8', fontPx: 40, pad: 14 });
    sb.position.set(px - 7.8, 1.35, pz + 3.5);
    sb.rotation.y = Math.PI / 2;
    scene.add(sb);
    [-0.7, 0.7].forEach(oz4 => solidSoftBox(0.08, 1.9, 0.08, 0x9aa5ad, px - 7.8, 0, pz + 3.5 + oz4));
  }
  // 숲놀이터 벽돌길 + 목재 구조물 (실사 v79_0225)
  box(2.2, 0.05, 4, 0xd8c49a, px + 2, 0, pz - 6.5, { collide: false, walk: true });
  box(2.2, 0.05, 4.6, 0xd8c49a, px - 1, 0, pz - 9, { rot: [0, 0.5, 0], collide: false, walk: true });
  box(2.2, 0.05, 4.2, 0xd8c49a, px - 4, 0, pz - 11, { rot: [0, -0.4, 0], collide: false, walk: true });
  {
    const wfx = px - 7, wfz = pz - 9.5;
    [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].forEach(([ox5, oz5]) =>
      solidSoftBox(0.12, 1.8, 0.12, 0x8a6a45, wfx + ox5, 0, wfz + oz5));
    box(2.2, 0.1, 0.1, 0x9c7a53, wfx, 1.75, wfz - 0.8, { walk: true });
    box(2.2, 0.1, 0.1, 0x9c7a53, wfx, 1.75, wfz + 0.8, { walk: true });
  }
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
  // 콘크리트 기단 (폴이 바닥을 그대로 관통하던 것 해소)
  box(1.5, 0.28, 1.5, 0xd8d2c6, flx, 0, flz, { walk: true });
  box(1.05, 0.16, 1.05, 0xe4dfd2, flx, 0.28, flz, { walk: true });
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 10, 10), mat(0xc8cdd2));
  fpole.position.set(flx, 5.44, flz);
  scene.add(fpole); colliders.push(fpole);
  const fball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat(0xd8b24a));
  fball.position.set(flx, 10.54, flz);
  scene.add(fball);
  const flagGroup = new THREE.Group();
  const flag = new THREE.Mesh(UNIT_PLANE, new THREE.MeshBasicMaterial({ map: taegeukTexture(), side: THREE.DoubleSide }));
  flag.scale.set(1.95, 1.3, 1);
  flag.position.x = 1.02;
  flagGroup.add(flag);
  flagGroup.position.set(flx, 9.54, flz);
  scene.add(flagGroup);
  dynamic.flag = flagGroup;

  // ---------- 교문 + 길 (운동장 레벨) ----------
  const [gtx, gtz] = SCHOOL.gate;
  YOFF = -1;
  // 정문 안쪽 진입 마당 — 실사: 교문을 들어서면 폭 넓은 보도블록 마당이고 통학버스가 그 위에 선다.
  // (폭 4는 문짝 너비만 한 통로였고, 버스가 잔디에 서는 원인이었다)
  box(16, 0.05, gtz - (F.center[1] + F.depth / 2), 0xd8d2c6, gtx - 5, 0.006, (gtz + F.center[1] + F.depth / 2) / 2, { collide: false, walk: true });
  [-3.5, 3.5].forEach(sx => box(1, 3, 1, 0xb9b5aa, gtx + sx, 0, gtz));
  box(9, 0.5, 0.8, 0x8a9096, gtx, 3.05, gtz, { collide: false });
  function pine(tx, tz, s = 1) {
    const keep = YOFF;
    YOFF = terrY(tz);
    const tr = geoSoft(PTRUNK_GEO, 0x7a5230, tx, 0.8 * s, tz, null, s, s, s);
    staticEntries.push({ key: tr.key, aabb: tr.aabb, solid: true, noRay: true });
    [[1.15, 1.9], [0.9, 2.7], [0.62, 3.4]].forEach(([r, y]) => {
      geoSoft(CONE_GEO, 0x2f6b3f, tx, y * s, tz, null, r * s, 1.1 * s, r * s);
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
  // 회전 차단기 (삼각 회전바 3날 + 중심 기둥) — 가로바만 있어 문처럼 보이던 것 수정
  [-1.7, 0, 1.7].forEach(ox => {
    box(0.16, 0.66, 0.16, 0x8a949c, gtx + ox, 0, gtz, { collide: false });   // 날이 기둥을 뚫으면 반짝임
    box(0.2, 0.16, 0.2, 0xb9bfc6, gtx + ox, 0.66, gtz, { collide: false });
    [0, 2.094, 4.189].forEach(ta2 => {   // 120°씩 3날
      box(0.07, 0.07, 0.46, 0xb9bfc6, gtx + ox + Math.sin(ta2) * 0.41, 0.86, gtz + Math.cos(ta2) * 0.41,
        { rot: [0, ta2, 0], collide: false });
    });
  });
  [[gtx - 16, gtx - 4.5], [gtx + 4.5, gtx + 16]].forEach(([a, b]) => {   // 흰 펜스
    for (let fx2 = a; fx2 <= b; fx2 += 2) box(0.09, 1.15, 0.09, 0xf2f4f6, fx2, 0, gtz - 0.9, { collide: false });
    box(b - a, 0.07, 0.07, 0xf2f4f6, (a + b) / 2, 1.1, gtz - 0.9, { collide: false });
    box(b - a, 0.07, 0.07, 0xf2f4f6, (a + b) / 2, 0.6, gtz - 0.9, { collide: false });
  });
  // 지진 대피 안내판 — 다리 달린 입간판 (땅에 묻힌 듯 보이던 것 수정)
  const qsign = textSign('지진 옥외대피장소', { h: 0.32, bg: '#f2c94c', fg: '#1d3557', border: null });
  qsign.position.set(gtx - 5.5, 1.05, gtz - 0.95);
  scene.add(qsign);
  [-0.75, 0.75].forEach(ox => box(0.07, 0.92, 0.07, 0x8a949c, gtx - 5.5 + ox, 0, gtz - 0.95, { collide: false }));
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
  YOFF = 0;   // 주차장·창고·버스·뒤편은 테라스 레벨 (교문 구간의 -1이 새지 않게 복원)
  plane(52, 9, 0xb9bdc2, 6, 0.011, -64.5);
  for (let lx2 = -16; lx2 <= 28; lx2 += 2.75) {
    geoAdd(UNIT_BOX, 0xe8ebee, lx2, 0.03, -67.2, null, 0.09, 0.02, 4.2);
    geoAdd(UNIT_BOX, 0xe8ebee, lx2, 0.03, -61.6, null, 0.09, 0.02, 4.2);
  }
  // 실사: 컨테이너 창고는 밝은 회색이 아니라 **노란 골판 + 파란 지붕**
  [[36, -63.5], [43.5, -61.8]].forEach(([sx2, sz2]) => {
    box(5, 2.4, 4, 0xe8b83c, sx2, 0, sz2);
    box(5.6, 0.28, 4.6, 0x2f6fd0, sx2, 2.4, sz2, { collide: false });
    geoAdd(UNIT_PLANE, 0xc9992e, sx2 - 1.2, 1.05, sz2 + 2.01, null, 0.9, 2.0, 1);   // 문짝 음영
    for (let gx5 = -2.1; gx5 <= 2.1; gx5 += 0.6) {                                   // 골판 세로줄 (문짝 구간 스킵)
      if (gx5 > -1.66 && gx5 < -0.74) continue;
      geoAdd(UNIT_BOX, 0xd4a832, sx2 + gx5, 1.2, sz2 + 2.02, null, 0.07, 2.3, 0.02);
    }
  });
  // 장애인 주차구획 (실사: 파란 바탕 + 흰 테두리 + 라바콘)
  box(2.6, 0.014, 4.6, 0x2f6fd0, -13, 0.03, -64.4, { collide: false });
  [[-1.25, 0], [1.25, 0]].forEach(([ox]) => box(0.12, 0.016, 4.6, 0xe8ebee, -13 + ox, 0.032, -64.4, { collide: false }));
  [[-14, -62.4], [-12, -62.4]].forEach(([cx6, cz6]) => {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.42, 8), mat(0xe8632e));
    cone.position.set(cx6, 0.21, cz6);
    scene.add(cone);
  });
  zones.push({ x0: -20, x1: 48, z0: -69.5, z1: -59.5, label: '주차장' });

  // 노란 통학버스 — 실사 확인(2026-07-31): 북측 주차장이 아니라 **정문 안쪽 진입 마당**에 선다.
  // 좌표를 상수로 뺀 이유: 예전엔 리터럴 28/-64.5가 20줄에 흩어져 있어 옮길 때마다 새는 값이 생겼다.
  {
    const BUS_X = 22, BUS_Z = 41.8;             // 정문(30,44.5) 서쪽, 운동장 북단 밖
    const keepBus = YOFF;
    YOFF = terrY(BUS_Z);                        // 운동장 레벨(-1)
    const fZ = BUS_Z - 2.61, rZ = BUS_Z + 2.61; // 차체 면(±2.6) 바로 앞
    box(2.3, 1.5, 5.2, 0xf2c531, BUS_X, 0.5, BUS_Z);
    box(2.32, 0.32, 5.2, 0xf5f6f7, BUS_X, 2.0, BUS_Z, { collide: false });
    geoAdd(UNIT_PLANE, 0x2b3a4c, BUS_X - 1.17, 1.55, BUS_Z, [0, -Math.PI / 2, 0], 4.2, 0.62, 1);
    geoAdd(UNIT_PLANE, 0x2b3a4c, BUS_X + 1.17, 1.55, BUS_Z, [0, Math.PI / 2, 0], 4.2, 0.62, 1);
    geoAdd(UNIT_PLANE, 0x2b3a4c, BUS_X, 1.5, fZ, [0, Math.PI, 0], 1.9, 0.75, 1);   // 전면 유리
    geoAdd(UNIT_PLANE, 0x2b3a4c, BUS_X, 1.5, rZ, [0, 0, 0], 1.9, 0.7, 1);          // 후면 유리
    geoAdd(UNIT_BOX, 0xf5f6f7, BUS_X, 0.55, rZ - 0.02, null, 0.5, 0.15, 0.03);     // 번호판
    geoAdd(UNIT_BOX, 0xf5f6f7, BUS_X, 0.55, fZ + 0.02, null, 0.5, 0.15, 0.03);
    [-0.75, 0.75].forEach(ox => {                                                  // 전조등 · 후미등
      geoAdd(UNIT_BOX, 0xfff4d0, BUS_X + ox, 0.85, fZ + 0.02, null, 0.3, 0.18, 0.04);
      geoAdd(UNIT_BOX, 0xd0392e, BUS_X + ox, 1.05, rZ - 0.02, null, 0.28, 0.16, 0.04);
    });
    geoAdd(UNIT_BOX, 0x30343a, BUS_X, 1.02, fZ + 0.01, null, 2.2, 0.14, 0.05);     // 앞 범퍼 라인
    geoAdd(UNIT_BOX, 0x30343a, BUS_X, 0.4, fZ + 0.01, null, 2.3, 0.2, 0.06);
    geoAdd(UNIT_BOX, 0x30343a, BUS_X, 0.4, rZ - 0.01, null, 2.3, 0.2, 0.06);
    // 바퀴는 개별 Mesh라 YOFF가 자동 적용되지 않는다 — 직접 더할 것
    [[-0.85, -1.5], [0.85, -1.5], [-0.85, 1.5], [0.85, 1.5]].forEach(([ox, dz]) => {
      const wh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 10), mat(0x24262c));
      wh2.rotation.z = Math.PI / 2;
      wh2.position.set(BUS_X + ox, 0.34 + YOFF, BUS_Z + dz);
      scene.add(wh2);
    });
    YOFF = keepBus;
  }
  // 실사(v80 84~87s): 뒤뜰 서측에 **회색 조립식 작업동**(단층·옥상 흰 난간)
  {
    const wbX = -35.5, wbZ = -54.5;
    box(4.6, 2.5, 3.6, 0xc9cdd2, wbX, 0, wbZ);
    box(1.1, 1.9, 0.08, 0x8a8f94, wbX + 1.2, 0, wbZ + 1.82, { collide: false });   // 문짝
    [[-1.2, 0]].forEach(([ox]) => geoAdd(UNIT_PLANE, 0x5a6b7a, wbX + ox, 1.5, wbZ + 1.82, null, 1.0, 0.7, 1));
    [-1, 1].forEach(sx => softBox(0.06, 0.5, 3.7, 0xe9ecee, wbX + sx * 2.32, 2.5, wbZ));
    [-1, 1].forEach(sz => softBox(4.7, 0.5, 0.06, 0xe9ecee, wbX, 2.5, wbZ + sz * 1.85));
  }
  // 뒤뜰 피크닉 데크 + 보라 화단 (실사: 학교에서 가장 예쁜 공간 — 목재 데크·테이블·맥문동)
  {
    // 위성+사용자 확인: 이 데크는 서관 뒤(주차장 자리)가 아니라 **텃밭 서측** 쉼터다
    const dkX = 31.5, dkZ = -63.5;
    // 실사(사용자 사진2): 데크는 넓다(~15×8) — 테이블 5·흰 석상·흰 장식펜스·큰나무 2
    box(15, 0.14, 8, 0x9c6b4a, dkX, 0, dkZ, { walk: true });
    for (let fpx = dkX - 7; fpx <= dkX + 7; fpx += 1.4)
      softBox(0.06, 0.9, 0.06, 0xeceff2, fpx, 0.14, dkZ - 3.9);
    softBox(15, 0.06, 0.06, 0xeceff2, dkX, 1.0, dkZ - 3.9);
    softBox(15, 0.05, 0.05, 0xeceff2, dkX, 0.6, dkZ - 3.9);
    // 흰 석상(기단 + 백색 인물상 근사)
    box(0.8, 0.5, 0.8, 0xcfc7b6, dkX + 6.2, 0.14, dkZ - 2.6);
    solidSoftBox(0.42, 1.1, 0.36, 0xf0f0ea, dkX + 6.2, 0.64, dkZ - 2.6);
    softBox(0.3, 0.3, 0.26, 0xf0f0ea, dkX + 6.2, 1.74, dkZ - 2.6);
    { const t1 = geoSoft(TRUNK_GEO, 0x6d4e32, dkX - 4, 1.1, dkZ - 5.6, null, 2.0, 2.2, 2.0);
      staticEntries.push({ key: t1.key, aabb: t1.aabb, solid: true, noRay: true });
      [[0,3.4,0],[1.3,4.1,0.4],[-1.2,3.9,-0.3]].forEach(([ox2,oy2,oz2]) =>
        geoSoft(ICO_GEO, 0x3f6b3a, dkX - 4 + ox2, oy2, dkZ - 5.6 + oz2, [0, ox2*2, 0], 1.6, 1.15, 1.6)); }
    [[-4.6, -1.4], [0.2, -2.2], [4.6, -0.8], [-1.8, 1.6], [3.4, 2.2]].forEach(([ox, oz]) => {
      const tx6 = dkX + ox, tz6 = dkZ + oz;
      box(1.5, 0.1, 0.7, 0x8a5a3b, tx6, 0.62, tz6, { collide: false, walk: true });
      [-0.6, 0.6].forEach(lx => box(0.1, 0.62, 0.62, 0x6d4a34, tx6 + lx, 0.14, tz6));
      [-0.62, 0.62].forEach(bz => box(1.5, 0.09, 0.32, 0x9c6b4a, tx6, 0.42, tz6 + bz, { collide: false, walk: true }));
    });
    for (let fx6 = dkX - 5.5; fx6 <= dkX + 3.5; fx6 += 1.1)
      geoSoft(ICO_GEO, 0x9b7bd0, fx6, 0.3, dkZ + 4.6, [0, fx6, 0], 0.42, 0.34, 0.42);   // 맥문동 보라 띠
  }
  // 위성+사용자 확인: 보건실·나래반 뒤(서관 북측)는 **바로 주차장**
  {
    const pk0 = -33, pk1 = -10.7, pkz0 = -58.5, pkz1 = -50.6;
    box(pk1 - pk0, 0.05, pkz1 - pkz0, 0x6f7276, (pk0 + pk1) / 2, 0.006, (pkz0 + pkz1) / 2, { collide: false, walk: true });
    // 주차칸(서관 벽 쪽으로 머리 대는 직각 주차) — 흰 구획선 + 카스토퍼
    for (let sx8 = pk0 + 1.5; sx8 <= pk1 - 1.5; sx8 += 2.6) {
      geoAdd(UNIT_PLANE, 0xe8e8e4, sx8, 0.062, pkz1 - 2.5, [-Math.PI / 2, 0, 0], 0.1, 5.0, 1);
      if (sx8 < pk1 - 3) softBox(1.6, 0.11, 0.14, 0xd9b545, sx8 + 1.3, 0.05, pkz1 - 4.6);
    }
    // 주차 차량 2대 (단순 박스카 — 흰 SUV·회색 세단)
    [[pk0 + 4.1, 0xe9ecee, 1.55], [pk0 + 9.3, 0x8a8f94, 1.35]].forEach(([cx9, cc9, ch9]) => {
      box(1.75, ch9 * 0.55, 4.1, cc9, cx9, 0.32, pkz1 - 2.9);
      box(1.6, ch9 * 0.45, 2.3, cc9, cx9, 0.32 + ch9 * 0.55, pkz1 - 2.9, { collide: false });
      [[-0.92, -1.35], [0.92, -1.35], [-0.92, 1.35], [0.92, 1.35]].forEach(([wx9, wz9]) =>
        geoAdd(STUMP_GEO, 0x24262a, cx9 + wx9, 0.32, pkz1 - 2.9 + wz9, [0, 0, Math.PI / 2], 0.62, 0.2, 0.62));
    });
    sign('주차장', (pk0 + pk1) / 2, 1.5, pkz0 + 0.3, 0, 0.4);
  }
  // 뒤편 디테일: 실외기 + 배관 (서관·급식동 뒤)
  [[-38, -50.75], [-30, -50.75], [-22, -50.75], [-8.2, -58.75], [-1.8, -58.75]].forEach(([ax2, az2]) => {
    box(0.85, 0.7, 0.38, 0xdfe3e8, ax2, 0, az2);
    geoAdd(CIRC_GEO, 0x6b7178, ax2, 0.38, az2 - 0.21, [0, Math.PI, 0], 0.24, 0.24, 1);
    geoAdd(UNIT_BOX, 0x9aa5ad, ax2 + 0.55, 1.7, az2 + 0.25, null, 0.08, 3.2, 0.08);
  });
  // 자전거 보관소 (후문 옆 캐노피)
  [[-28.5, -67.3], [-21.5, -67.3], [-28.5, -65.7], [-21.5, -65.7]].forEach(([px6, pz6]) =>
    box(0.12, 2.1, 0.12, 0x8a949c, px6, 0, pz6));
  // 아치형 캐노피 (평판 → 3분할 완만한 곡면 + 물받이)
  box(7.8, 0.09, 1.05, 0x9db4c0, -25, 2.06, -67.05, { rot: [0.34, 0, 0], collide: false });
  box(7.8, 0.09, 0.95, 0x9db4c0, -25, 2.28, -66.5, { collide: false });
  box(7.8, 0.09, 1.05, 0x9db4c0, -25, 2.06, -65.95, { rot: [-0.34, 0, 0], collide: false });
  box(7.9, 0.08, 0.08, 0x7d98a8, -25, 1.98, -67.52, { collide: false });
  [[-27.3, 0x4d9bd6], [-25, 0xd94f6b], [-22.7, 0x67b26f]].forEach(([bx7, bColor]) => {
    geoAdd(STUMP_GEO, 0x2b2e33, bx7, 0.28, -66.9, [0, 0, Math.PI / 2], 0.9, 0.06, 0.9);
    geoAdd(STUMP_GEO, 0x2b2e33, bx7, 0.28, -66.0, [0, 0, Math.PI / 2], 0.9, 0.06, 0.9);
    geoAdd(UNIT_BOX, bColor, bx7, 0.52, -66.45, [-0.45, 0, 0], 0.05, 0.75, 0.05);
    geoAdd(UNIT_BOX, bColor, bx7 + 0.06, 0.62, -66.45, [0.9, 0, 0], 0.05, 0.5, 0.05);   // 프레임 하단 튜브 (겹치면 반짝임)
    geoAdd(UNIT_BOX, 0x30343a, bx7, 0.82, -66.95, null, 0.34, 0.045, 0.045);
    geoAdd(UNIT_BOX, 0x30343a, bx7, 0.78, -66.05, null, 0.16, 0.05, 0.12);
  });

  const bd = SCHOOL.bounds;
  const hedgeC = 0x4e7d3a;
  // 북측(테라스 레벨): 생울타리 + 후문
  YOFF = 0;
  wallXGaps(-bd.x, bd.x, [{ c: -30, w: 6 }], bd.zMin, 0, 0.95, hedgeC, 0.9);
  [-33.5, -26.5].forEach(px3 => box(0.8, 2.2, 0.8, 0xb9b5aa, px3, 0, bd.zMin));
  sign('후문', -30, 2.4, bd.zMin + 0.6, 0, 0.5);
  // 후문 차단봉 (상시 개방으로 보이던 것 — 접힌 차단봉 + 반사 스트라이프)
  box(0.14, 1.0, 0.14, 0xd0392e, -32.9, 0, bd.zMin + 0.3, { collide: false });
  box(5.4, 0.13, 0.13, 0xd0392e, -30.2, 0.82, bd.zMin + 0.3, { collide: false });
  for (let sb = -32.6; sb <= -27.8; sb += 1.2) box(0.55, 0.14, 0.14, 0xf5f6f7, sb, 0.815, bd.zMin + 0.3, { collide: false });
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
  box(0.3, 1.3, bd.zMax - TERR_Z, 0, bd.x, 0, (TERR_Z + bd.zMax) / 2, { material: INVIS, noCam: true });
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
  // 전선 — 5토막으로 나눠 가운데가 처지게 (직선 막대로 보이던 것 수정)
  [[4], [24]].forEach(([mz]) => {
    const SEG = 5, SPAN = 20, SAG = 0.55;
    for (let si = 0; si < SEG; si++) {
      const t0 = si / SEG - 0.5, t1 = (si + 1) / SEG - 0.5;
      const y0w = 7.75 - SAG * (1 - 4 * t0 * t0), y1w = 7.75 - SAG * (1 - 4 * t1 * t1);
      const zc = mz + (t0 + t1) / 2 * SPAN, len2 = Math.hypot((t1 - t0) * SPAN, y1w - y0w);
      const ang2 = Math.atan2(y1w - y0w, (t1 - t0) * SPAN);
      [bd.x - 1.65, bd.x - 0.75].forEach(wx4 =>
        box(0.035, 0.035, len2, 0x2b2b2b, wx4, (y0w + y1w) / 2 - 0.018, zc, { rot: [-ang2, 0, 0], collide: false }));
    }
  });
  YOFF = 0;
  // 경계 투명벽 (양 레벨 모두 커버)
  box(bd.x * 2 + 2, 8, 0.6, 0, 0, -1.2, bd.zMin, { material: INVIS, noCam: true });
  box(bd.x * 2 + 2, 8, 0.6, 0, 0, -1.2, bd.zMax, { material: INVIS, noCam: true });
  box(0.6, 8, bd.zMax - bd.zMin + 2, 0, -bd.x, -1.2, (bd.zMin + bd.zMax) / 2, { material: INVIS, noCam: true });
  box(0.6, 8, bd.zMax - bd.zMin + 2, 0, bd.x, -1.2, (bd.zMin + bd.zMax) / 2, { material: INVIS, noCam: true });

  function tree(tx, tz, s = 1) {
    const keep = YOFF;
    YOFF = terrY(tz);
    // 줄기는 부딪히기만 하고 **올라설 수는 없다** (지오메트리는 soft = 레이 통과, 충돌만 등록)
    const r = geoSoft(TRUNK_GEO, 0x8b5e34, tx, 0.7 * s, tz, null, s, s, s);
    staticEntries.push({ key: r.key, aabb: r.aabb, solid: true, noRay: true });
    // ⚠️ 한 나무의 덩어리 3개는 **같은 색**이어야 한다.
    //    색이 다르면 덩어리가 겹치는 면이 z-fighting 으로 깜빡인다(= 나무가 반짝임).
    const c1 = CANOPY[Math.floor(rng() * CANOPY.length)];
    rng();                          // 난수 흐름 유지
    const ry = rng() * Math.PI;
    geoSoft(ICO_GEO, c1, tx, 1.9 * s, tz, [0, ry, 0], 1.05 * s, 0.95 * s, 1.05 * s);
    geoSoft(ICO_GEO, c1, tx + 0.45 * s, 2.5 * s, tz + 0.2 * s, [0, ry + 1, 0], 0.7 * s, 0.66 * s, 0.7 * s);
    geoSoft(ICO_GEO, c1, tx - 0.5 * s, 2.2 * s, tz - 0.25 * s, [0, ry + 2, 0], 0.55 * s, 0.5 * s, 0.55 * s);
    YOFF = keep;
  }
  function bush(tx, tz, s = 1, color) {
    const keep = YOFF;
    YOFF = terrY(tz);
    geoSoft(ICO_GEO, color || CANOPY[Math.floor(rng() * CANOPY.length)], tx, 0.34 * s, tz, [0, rng() * 3, 0], 0.5 * s, 0.38 * s, 0.5 * s);
    YOFF = keep;
  }
  for (let tz = -35; tz <= 35; tz += 10) tree(70, tz, 1 + rng() * 0.4);
  for (let tz = -30; tz <= 40; tz += 10) tree(-80, tz, 1 + rng() * 0.4);
  [-30, -8, 10, 26].forEach(tx => tree(tx, -68, 1.1 + rng() * 0.3));
  tree(58, -20, 0.9);
  // 실사(hi_0255·0264): 동측 경계는 1.2m 흰 펜스가 아니라 **5.5m 초록 그물 방구망**
  {
    const bx0 = 49.4;   // 사진6: 방구망은 보도 **안쪽**(운동장과 보도 사이) — 55.3(보도 밖)은 반대였다
    const bg = new THREE.PlaneGeometry(56, 5.2);
    const buv = bg.attributes.uv;
    for (let ui = 0; ui < buv.count; ui++) buv.setXY(ui, buv.getX(ui) * 56 / 0.42, buv.getY(ui) * 5.2 / 0.42);
    const bm = new THREE.Mesh(bg, NET_FENCE);
    bm.rotation.y = Math.PI / 2;
    bm.position.set(bx0, 1.7, 12);
    bm.matrixAutoUpdate = false; bm.updateMatrix();
    scene.add(bm);
    for (let bz3 = -12; bz3 <= 36; bz3 += 6)
      box(0.14, 5.4, 0.14, 0x3f7d4a, bx0, -1, bz3);
    box(0.08, 0.08, 56, 0x2a6b3f, bx0, 4.25, 12, { collide: false });
    box(0.05, 5.4, 56, 0, bx0, -1, 12, { material: INVIS });
  }
  // 실사(gym_0278): 건물 앞은 포장 위 점열이 아니라 **웃자란 풀밭 + 대형 반송(구름 수형)**
  {
    const keepG = YOFF;
    YOFF = 0;   // 건물 앞 화단은 테라스 레벨 — 운동장 y로 깔면 테라스 아래 묻힌다(육안 확인)
  plane(35.5, 5.2, 0x77a054, -22.2, 0.055, TERR_Z - 3.1 + 0.5);
  plane(23.4, 5.2, 0x77a054, 28.2, 0.055, TERR_Z - 3.1 + 0.5);
  [[-28, TERR_Z - 2.6], [24, TERR_Z - 2.6], [34, TERR_Z - 2.8]].forEach(([tx8, tz8]) => {
    const tr8 = geoSoft(TRUNK_GEO, 0x4a3826, tx8, 0.9, tz8, null, 1.6, 1.6, 1.6);
    staticEntries.push({ key: tr8.key, aabb: tr8.aabb, solid: true, noRay: true });
    [[0, 1.9, 0], [0.9, 2.4, 0.3], [-0.9, 2.3, -0.2], [0.4, 2.9, -0.4], [-0.4, 2.8, 0.4]].forEach(([ox, oy, oz]) =>
      geoSoft(ICO_GEO, 0x516d49, tx8 + ox, oy, tz8 + oz, [0, ox * 2 + oy, 0], 0.85, 0.55, 0.85));
  });
    YOFF = keepG;
  }
  // 건물 앞 관목 줄
  for (let bx2 = fx0 + 2; bx2 < fx1 - 1; bx2 += 4.2) {
    if (Math.abs(bx2 - hallCx) > 3.2) bush(bx2, fz1 + 1.15, 1 + rng() * 0.5);
  }
  // 건물 앞 **다듬은 향나무 토피어리 줄** (실사: 학교 정면 전체에 둥근 토피어리가 늘어서 있다)
  // 짧은 줄기 + 둥근 구슬 2단 — 자연수형(tree)과 확실히 구분되게
  const topiary = (tx3, tz3, s = 1) => {
    const keep = YOFF;
    YOFF = terrY(tz3);
    geoSoft(TRUNK_GEO, 0x6d5236, tx3, 0.28 * s, tz3, null, 0.34 * s, 0.34 * s, 0.34 * s);
    geoSoft(ICO_GEO, 0x3f6b45, tx3, 0.78 * s, tz3, [0, 0.6, 0], 0.78 * s, 0.66 * s, 0.78 * s);
    geoSoft(ICO_GEO, 0x497a4e, tx3, 1.32 * s, tz3, [0, 2.1, 0], 0.52 * s, 0.46 * s, 0.52 * s);
    YOFF = keep;
  };
  for (let tx3 = fx0 + 3.4; tx3 <= fx1 - 2; tx3 += 5.6) {
    if (Math.abs(tx3 - hallCx) < 8.5) continue;                 // 필로티·계단·표지석 자리
    if (Math.abs(tx3 - SCHOOL.flagPole[0]) < 2.5) continue;
    topiary(tx3, fz1 + 2.6, 0.9 + rng() * 0.35);
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
      _col.set(shade(color));
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
    // 수관 덩어리는 전부 같은 색 (다르면 겹친 면이 깜빡인다)
    bt(ICO_GEO, 0x4d8b4d, 0, 6.6, 0, null, 3.6, 3.0, 3.6);
    bt(ICO_GEO, 0x4d8b4d, 2.0, 7.6, 0.8, [0, 1, 0], 2.4, 2.0, 2.4);
    bt(ICO_GEO, 0x4d8b4d, -2.1, 7.2, -0.7, [0, 2, 0], 2.2, 1.9, 2.2);
    bt(ICO_GEO, 0x4d8b4d, 0.4, 8.9, -0.2, [0, 3, 0], 1.9, 1.6, 1.9);
    bt(ICO_GEO, 0x4d8b4d, -1.2, 6.3, 1.7, [0, 4, 0], 1.8, 1.5, 1.8);
    const btMesh = new THREE.Mesh(mergeGeometries(parts, false), MAT_PERSON);
    btMesh.castShadow = true;
    const btGroup = new THREE.Group();
    btGroup.add(btMesh);
    btGroup.position.set(btx, terrY(btz), btz);
    scene.add(btGroup);
    dynamic.bigTree = btGroup;
    const keep3 = YOFF;
    YOFF = terrY(btz);
    box(1.3, 4.6, 1.3, 0, btx, 0, btz, { material: INVIS, noCam: true });
    // 우드 데크 + 피크닉 테이블 (사진: 나무 아래 데크 쉼터)
    box(8.5, 0.14, 6, 0x9c6b4a, btx - 0.4, 0, btz + 1.4, { walk: true });
    // 데크 스커트 (지면 위 떠 보이던 것 해소)
    box(8.7, 0.15, 0.14, 0x7d5238, btx - 0.4, -0.02, btz - 1.6, { collide: false });
    box(8.7, 0.15, 0.14, 0x7d5238, btx - 0.4, -0.02, btz + 4.4, { collide: false });
    box(0.14, 0.15, 6.2, 0x7d5238, btx - 4.65, -0.02, btz + 1.4, { collide: false });
    box(0.14, 0.15, 6.2, 0x7d5238, btx + 3.85, -0.02, btz + 1.4, { collide: false });
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
  dynamic.cloudMat = cloudMat;   // 시간대별 색 (밤에 흰 구름이 뜨는 것 방지)
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
  // 밤 창문 불빛 (숨김 상태로 준비 — applyTime에서 켬)
  if (glowGeos.length) {
    const glowMesh = new THREE.Mesh(mergeGeometries(glowGeos, false), new THREE.MeshBasicMaterial({ vertexColors: true }));
    glowMesh.visible = false;
    scene.add(glowMesh);
    dynamic.nightGlow = glowMesh;
  }
  // 진짜 뚫린 창 유리 — 1개 메시(드로우콜 1).
  // ⚠️ 반투명이므로 GLASS 는 depthWrite:false 여야 한다. 켜 두면 유리끼리·유리문과
  //    앞뒤가 프레임마다 뒤집혀 깜빡인다. (청크로 쪼개면 드로우콜만 100+ 늘고 효과는 미미)
  if (glassGeos.length) {
    scene.add(new THREE.Mesh(mergeGeometries(glassGeos, false), GLASS));
  }
  // NPC 발밑 정적 그림자 (1개 메시)
  if (blobGeos.length) {
    const bm = new THREE.Mesh(mergeGeometries(blobGeos, false),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false }));
    bm.renderOrder = -1;
    scene.add(bm);
  }
  // 밟을 수 없는 장식(나뭇잎·덤불) — grid 에 등록하지 않는다 (= 지면 레이가 통과)
  if (softGeos.length) {
    const sm = new THREE.Mesh(mergeGeometries(softGeos, false), MAT_CHUNK);
    sm.castShadow = true; sm.receiveShadow = true;
    scene.add(sm);
  }
  // 실내 천장 — 전부 1개 메시 (조명 영향 없는 밝은 무광)
  if (ceilGeos.length) {
    scene.add(new THREE.Mesh(mergeGeometries(ceilGeos, false), new THREE.MeshBasicMaterial({ color: 0xe4e0d6 })));
  }

  // ---------- 🧻 골판지 모드 (스킨 토글) ----------
  // 본편 룩은 그대로 두고, 버텍스 컬러와 재질 색만 골판지 톤으로 갈아끼운다.
  // 지오메트리·물리·배치는 전혀 건드리지 않는다. 토글 1회 비용만 들고 매 프레임 비용 0.
  // 컨셉: "4학년 아이들이 골판지로 만든 우리 학교" — 조잡함이 결함이 아니라 설정이 된다.
  {
    const cardOf = cardTone;   // 톤 정의는 textures.js (캐릭터와 공유)
    const vcMeshes = [];
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry.attributes.color) return;
      const a = o.geometry.attributes.color;
      const normal = Float32Array.from(a.array);
      const card = new Float32Array(a.array.length);
      for (let i = 0; i < a.array.length; i += 3) {
        const [r, g, b] = cardOf(normal[i], normal[i + 1], normal[i + 2]);
        card[i] = r; card[i + 1] = g; card[i + 2] = b;
      }
      vcMeshes.push({ attr: a, normal, card });
    });
    const texTints = [];
    scene.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.type === 'MeshLambertMaterial') texTints.push(o.material); });
    const matList = [];
    const pushMat = m => {
      if (!m || !m.color || matList.some(e => e.m === m)) return;
      const c = m.color;
      matList.push({ m, normal: [c.r, c.g, c.b], card: cardOf(c.r, c.g, c.b) });
    };
    Object.values(M).forEach(pushMat);
    M_IN.forEach(pushMat);
    scene.traverse(o => { if (o.isMesh && o.material && !o.material.map && o.material.type === 'MeshLambertMaterial') pushMat(o.material); });
    dynamic.setSkin = (on) => {
      vcMeshes.forEach(e => { e.attr.array.set(on ? e.card : e.normal); e.attr.needsUpdate = true; });
      matList.forEach(e => { const v = on ? e.card : e.normal; e.m.color.setRGB(v[0], v[1], v[2]); });
      // 흙·마루처럼 텍스처가 붙은 면은 재질 색으로 갈색을 곱해 톤을 맞춘다
      texTints.forEach(m => on ? m.color.setRGB(0.80, 0.66, 0.47) : m.color.setRGB(1, 1, 1));
    };
  }

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
    if (se.noRay) { gridInsert({ m: null, solid: se.solid, aabb: se.aabb }); return; }  // 충돌만, 밟기 불가
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
