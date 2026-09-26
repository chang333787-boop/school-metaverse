// ============================================================
// v2 월드 — 완성판. 헌법:
//  ① 부재 최소 0.15m(가는 봉·틀 금지 — 색면으로) ② 트림 저대비 ③ 동일평면 겹침 금지(빌드 감사)
//  ④ 16m 청크 병합 ⑤ 충돌 AABB 전용 ⑥ 예산 dc≤300·sim≤1ms
// ============================================================
import * as THREE from 'three';
import { SCHOOL } from './layout.js?v=8';   // LAYOUT-3 실측 배치(v1의 js/data.js는 참고용으로 그대로)

// 바깥 지형 높이(main.js 물리·검사도 같은 함수를 쓴다): 앞뜰·체육관 대지 = yard, 그 밖(둔덕 아래·운동장) = field
const TRN = SCHOOL.terrain;
export function terrainAt(x, z) {
  if (z < TRN.TERR_Z || (x < TRN.westX && z < TRN.westZ)) return TRN.yard;
  // 운동장 북서 모서리(영상 g_079~120): 대지 높이 앞마당(z < -10) → 흙 비탈(z -10 → -3)로 운동장까지 · 동쪽 끝 x -30~-27은 옆으로도 비탈(world.js 운동장 북서 모서리 블록과 같은 식)
  if (x >= TRN.westX && x < -27 && z < -3) { const t = Math.max(0, (x + 30) / 3) + Math.max(0, (z + 10) / 7); if (t < 1) return TRN.yard + (TRN.field - TRN.yard) * t; }
  return TRN.field;
}

export function buildWorld(scene) {
  const B = SCHOOL.building, FR = B.front;
  const FH = B.floorHeight, TR3 = SCHOOL.terrain, TERR_Z = TR3.TERR_Z;
  // 높이 세 층(영상 실측 09-24): 건물 바닥 0 · 앞뜰 YARD(현관 2단 아래) · 운동장 FIELD(구령대 계단 7단 아래)
  const YARD = TR3.yard, FIELD = TR3.field, COURT = TR3.court, GYF = SCHOOL.gym.floorY;
  const colliders = [], zones = [], allBoxes = [], doors = [];
  const hotspots = [];   // 상호작용 지점 — main.js가 E키/안내 클릭으로 실행
  const CHUNK = 16, chunks = new Map();
  const box_ = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const bpos = box_.attributes.position, bnrm = box_.attributes.normal;
  const _c = new THREE.Color();
  const tY = (z, x = 0) => terrainAt(x, z);

  function chunkOf(cx, cz) {
    const key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = chunks.get(key);
    if (!ch) { ch = { pos: [], col: [] }; chunks.set(key, ch); }
    return ch;
  }
  // PHYS-1 '올라서기 금지'(ns): 가구·울타리 등은 충돌 높이를 1.6 이상으로 — 점프 도달(0.97 + 오름 0.55 = 1.52)보다 높아
  // 위에 서지 못하고 넘지도 못한다. 보이지 않는 윗부분이 카메라를 밀지 않게 nc(카메라 무시) 표시.
  const NS = { ns: true };
  function noStand(c, min = 1.6) { c.y1 = Math.max(c.y1, c.y0 + min); c.nc = true; c.ns = true; return c; }   // ns = 끝의 NS-RAISE 패스가 알아보는 표시
  function addBox(w, h, d, hex, cx, baseY, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.1499) throw new Error('헌법① 위반 <0.15m: ' + [w, h, d]);   // 0.1499=부동소수 오차 허용(0.15는 합법)
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2, wall: !!opt.wall });   // wall=벽 조각(문이 숨는 곳)
    const ch = opt.at ? chunkOf(opt.at[0], opt.at[1]) : chunkOf(cx, cz);   // at = 이 청크에 합침(dGeo와 같음)
    _c.set(hex); _c.multiplyScalar(0.97);
    const cy = baseY + h / 2;
    for (let i = 0; i < bpos.count; i++) {
      ch.pos.push(bpos.getX(i)*w+cx, bpos.getY(i)*h+cy, bpos.getZ(i)*d+cz);
      const ny = bnrm.getY(i), nx = bnrm.getX(i);
      // flat: AO 면제 — 천장·조명은 아랫면만 보이는데 아랫면 0.62를 먹으면 칙칙해진다
      const f = opt.flat ? 1 : ny > .5 ? 1 : ny < -.5 ? .62 : (nx !== 0 ? .88 : .94);
      ch.col.push(_c.r*f, _c.g*f, _c.b*f);
    }
    if (opt.collide !== false || opt.ns) colliders.push(opt.ns ? noStand({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 })
                                                  : { x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
  }
  function addPanel(w, d, hex, cx, y, cz) {
    const ch = chunkOf(cx, cz);
    _c.set(hex); _c.multiplyScalar(0.97);
    const x0 = cx-w/2, x1 = cx+w/2, z0 = cz-d/2, z1 = cz+d/2;
    ch.pos.push(x0,y,z0, x0,y,z1, x1,y,z1,  x0,y,z0, x1,y,z1, x1,y,z0);
    for (let i = 0; i < 6; i++) ch.col.push(_c.r, _c.g, _c.b);
  }
  // ================= 디테일 층 (DETAIL-1 · 09-23) =================
  // 사용자 09-23 "기본 에셋이 너무 단순" — 헌법①(부재 ≥0.15)만으로는 사람·나무·책상이 블록 덩어리였다.
  // 작은 부재(≥3cm)·원기둥·다면체를 따로 모아 16m 청크로 병합한다. 헌법①의 이유(가는 부재가 원경에서 반짝임)는
  // '거리'로 막는다: near 층은 카메라에서 DETAIL_FAR 밖이면 청크째 숨긴다(main.js). far 층(나무 등 큰 덩어리)은 항상 보인다.
  // 상자 부재는 축정렬만 쓰고 감사(allBoxes, detail:true)에 넣는다 — 동일평면 금지 규칙은 그대로.
  const DNEAR = new Map(), DFAR = new Map();
  const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _de = new THREE.Euler(), _dv = new THREE.Vector3(), _ds = new THREE.Vector3();
  const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
  const BLOB1 = new THREE.IcosahedronGeometry(1, 1), BLOB0 = new THREE.IcosahedronGeometry(1, 0);
  // 건물 안 판정(INTERIOR-CULL · 09-24): 실내 작은 부재는 '실내 청크'로 따로 모아, 카메라가 밖에 있을 땐 가까울 때만 그린다(창으로만 보이므로)
  const BRECT = [[...B.front.x, ...B.front.z], [...B.entrance.x, ...B.entrance.z], [...B.wings[0].x, ...B.wings[0].z], [...B.kitchen.x, ...B.kitchen.z],
    [...B.centerLobby.x, ...B.centerLobby.z], [...B.linkCorridor.x, ...B.linkCorridor.z], [...B.eastWing.x, ...B.eastWing.z]];
  { const g = SCHOOL.gym; BRECT.push([g.center[0] - g.width/2, g.center[0] + g.width/2, g.center[1] - g.depth/2, g.center[1] + g.depth/2], [...g.annex.x, ...g.annex.z]); }
  const buildingOf = (x, z) => BRECT.findIndex(([a, b, c, d]) => x > a + 0.2 && x < b - 0.2 && z > c + 0.2 && z < d - 0.2);
  // OCC-CULL(integ · 09-24): 실내 청크를 '건물 × 층 × 16m 칸'으로 나눈다 — main.js가 벽·슬래브·지붕 뒤라 안 보이는 청크를 숨긴다(bi·fl)
  function dChunk(far, cx, cz, cy = 0) {
    if (far) return chunkOf(cx, cz);   // 큰 덩어리(나무·차·울타리 기둥)는 건물 청크에 그대로 합친다 — 같은 재질이라 드로우콜이 늘지 않는다
    const bi = buildingOf(cx, cz), inside = bi >= 0, fl = inside && cy > FH + 0.15 ? 2 : 1;
    const key = (inside ? 'i' + bi + (fl === 2 ? 'u' : '') + ':' : 'o') + Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = DNEAR.get(key);
    if (!ch) { ch = { pos: [], col: [], cx: (Math.floor(cx / CHUNK) + 0.5) * CHUNK, cz: (Math.floor(cz / CHUNK) + 0.5) * CHUNK, inside, bi, fl }; DNEAR.set(key, ch); }
    return ch;
  }
  // geo(비인덱스로 변환)를 행렬 m으로 옮겨 붙인다. 면 방향으로 명암(윗면 1·옆면 .9·아랫면 .62 — addBox와 같은 규칙)
  function dGeo(geo, m, hex, opt = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position;
    const ch = opt.at ? (opt.far ? chunkOf(opt.at[0], opt.at[1]) : dChunk(false, opt.at[0], opt.at[1], _dv.setFromMatrixPosition(m).y)) : dChunk(!!opt.far, _dv.setFromMatrixPosition(m).x, _dv.z, _dv.y);   // at = 이 청크에 합침(넓게 퍼진 먼 산을 한 덩이로 — 드로우콜 · near도 된다: 청크 경계가 한 덩어리(텃밭·창고)를 가르면 남쪽 칸 경계 구가 커져 먼 곳에서도 절두체에 든다)
    _c.set(hex); _c.multiplyScalar(0.97);
    const jit = opt.jitter || 0;
    for (let i = 0; i < P.count; i += 3) {
      _p0.fromBufferAttribute(P, i).applyMatrix4(m); _p1.fromBufferAttribute(P, i + 1).applyMatrix4(m); _p2.fromBufferAttribute(P, i + 2).applyMatrix4(m);
      const ny = _ds.subVectors(_p1, _p0).cross(_dv.subVectors(_p2, _p0)).normalize().y;
      let f = opt.flat ? 1 : ny > .5 ? 1 : ny < -.5 ? .62 : .9;
      if (jit) f *= 1 + jit * (Math.sin(i * 12.9898 + _p0.x * 3.1) * 0.5);   // 잎 덩어리 면마다 살짝 다른 초록
      ch.pos.push(_p0.x, _p0.y, _p0.z, _p1.x, _p1.y, _p1.z, _p2.x, _p2.y, _p2.z);
      for (let k = 0; k < 3; k++) ch.col.push(_c.r * f, _c.g * f, _c.b * f);
    }
  }
  function dBox(w, h, d, hex, cx, y0, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.0299) throw new Error('DETAIL 부재 <3cm: ' + [w, h, d]);
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0, y1: y0+h, z0: cz-d/2, z1: cz+d/2, detail: true });
    if (opt.collide) colliders.push({ x0: cx-w/2, x1: cx+w/2, y0, y1: y0+h, z0: cz-d/2, z1: cz+d/2 });
    _dm.compose(_dv.set(cx, y0 + h/2, cz), _dq.identity(), _ds.set(w, h, d));
    dGeo(box_, _dm, hex, opt);
  }
  // 원기둥(밑면 반지름 rb·윗면 rt). rot=[rx,ry,rz]로 기울일 수 있다(가지). 감사 대상 아님(곡면)
  const CYLC = new Map();   // PERF-LOAD: 같은 치수 원기둥은 한 번만 짓는다(비인덱스로 — 예전엔 부를 때마다 짓고 dGeo가 toNonIndexed · 정점 같음)
  function dCyl(rt, rb, h, hex, cx, y0, cz, opt = {}) {
    const seg = opt.seg || 7, key = rt + ',' + rb + ',' + h + ',' + seg;
    let g = CYLC.get(key);
    if (!g) { const g0 = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g0.translate(0, h / 2, 0); g = g0.toNonIndexed(); g0.dispose(); CYLC.set(key, g); }
    const r = opt.rot || [0, 0, 0];
    _dm.compose(_dv.set(cx, y0, cz), _dq.setFromEuler(_de.set(r[0], r[1], r[2])), _ds.set(1, 1, 1));
    dGeo(g, _dm, hex, opt);
  }
  // 둥근 덩어리(정이십면체 1분할 = 80면). 잎·머리숱 같은 부드러운 덩어리에. 감사 대상 아님
  function dBlob(sx, sy, sz, hex, cx, cy, cz, opt = {}) {
    _dm.compose(_dv.set(cx, cy, cz), _dq.setFromEuler(_de.set(0, opt.ry || 0, 0)), _ds.set(sx, sy, sz));
    dGeo(opt.chunky ? BLOB0 : BLOB1, _dm, hex, opt);
  }
  // 두 점 사이 봉(쇠파이프·사슬·그물). seg 6. 감사 대상 아님(곡면)
  const ROD = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0).toNonIndexed(), _up = new THREE.Vector3(0, 1, 0), _rd = new THREE.Vector3();
  const visRods = [];   // 물리 검사용: 봉·원기둥의 AABB(몸이 뚫고 지나가는지 SD2.solidCheck가 본다)
  const softVols = [];  // [integ 09-25] 몸이 지나가도 되는 낮은 풀·작물 덩어리 AABB(검진 health.js가 뚫림·발 묻힘에서 뺀다 — 풀밭처럼 걸어 들어가는 게 맞는 것만)
  function dRod(x0, y0, z0, x1, y1, z1, r, hex, opt = {}) {
    visRods.push({ x0: Math.min(x0, x1) - r, x1: Math.max(x0, x1) + r, y0: Math.min(y0, y1) - r, y1: Math.max(y0, y1) + r, z0: Math.min(z0, z1) - r, z1: Math.max(z0, z1) + r, r, a: [x0, y0, z0], b: [x1, y1, z1] });
    _rd.set(x1 - x0, y1 - y0, z1 - z0); const L = _rd.length(); _rd.divideScalar(L);
    _dm.compose(_dv.set(x0, y0, z0), _dq.setFromUnitVectors(_up, _rd), _ds.set(r, L, r));
    dGeo(ROD, _dm, hex, opt);
  }
  const post = (x, z, y0, y1, r = 0.08) => colliders.push({ x0: x - r, x1: x + r, y0, y1, z0: z - r, z1: z + r });
  // 방향 있는 조립용: 로컬(오른쪽 lx·위 ly·앞 lz)을 90° 단위 facing(0=북 -z, 1=동, 2=남, 3=서)으로 돌려 축정렬 상자로 놓는다
  function partAt(x, y, z, face, s) {
    return (lx, ly, lz, w, h, d, hex, opt) => {
      const [fx, fz, rx, rz] = [[0, -1, 1, 0], [1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1]][face & 3];
      const wx = x + (lx * rx + lz * fx) * s, wz = z + (lx * rz + lz * fz) * s;
      const odd = face & 1;
      dBox((odd ? d : w) * s, h * s, (odd ? w : d) * s, hex, wx, y + ly * s, wz, opt);
    };
  }
  const hash2 = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };

  // 아랫단 띠는 모든 시공이 끝난 뒤 깐다(buildPlinths) — 벽에 붙은 신발장·화분·이웃 건물 칸막이와 부딪히는 구간은 건너뛴다
  const plinths = [];
  function buildPlinths() {
    const low = []; let seen = 0;   // PERF-LOAD: 띠 높이(0~0.45)에 걸친 상자만 추려 둔다 — 띠가 더한 상자도 차례로 이어 붙여 예전(allBoxes 전체를 매번)과 같은 목록·순서
    for (const p of plinths) {
      for (; seen < allBoxes.length; seen++) { const b = allBoxes[seen]; if (!(b.y0 >= 0.45 || b.y1 <= 0)) low.push(b); }
      const bb = p.ax === 'x' ? { z0: p.o - 0.02, z1: p.o + 0.02 } : { x0: p.o - 0.02, x1: p.o + 0.02 };
      const cut = [];
      for (const b of low) {
        const hit = p.ax === 'x'
          ? (b.z1 > bb.z0 + 0.004 && b.z0 < bb.z1 - 0.004 && b.x1 > p.a0 && b.x0 < p.a1)
          : (b.x1 > bb.x0 + 0.004 && b.x0 < bb.x1 - 0.004 && b.z1 > p.a0 && b.z0 < p.a1);   // 벽 자신(면에 맞닿기만)은 제외
        if (hit) cut.push(p.ax === 'x' ? [b.x0 - 0.02, b.x1 + 0.02] : [b.z0 - 0.02, b.z1 + 0.02]);
      }
      cut.sort((u, v) => u[0] - v[0]);
      let a = p.a0;
      const emit = (u, v) => { if (v - u < 0.15) return; p.ax === 'x' ? dBox(v - u, 0.45, 0.04, 0x857563, (u + v)/2, 0, p.o) : dBox(0.04, 0.45, v - u, 0x857563, p.o, 0, (u + v)/2); };
      for (const [u, v] of cut) { if (u > a) emit(a, Math.min(u, p.a1)); a = Math.max(a, v); }
      if (a < p.a1) emit(a, p.a1);
    }
  }
  // 외벽은 '바깥 절반 0.15 + 안쪽 절반 0.15'로 나눠 쌓는다 → 방 안에서 외벽색이 아니라 실내 도장이 보인다.
  // 두 절반은 맞닿을 뿐 겹치지 않으므로 감사 통과(면이 서로 반대를 향함). 0.15는 헌법① 최소치와 정확히 같다.
  function wallSeg(ax, len, h, cx, y0, z, hex, opt) {
    const W9 = { wall: true };
    const box = (th, col, off, yy, hh) => ax === 'x' ? addBox(len, hh, th, col, cx, yy, z + off, W9) : addBox(th, hh, len, col, z + off, yy, cx, W9);
    // opt.dado = { top, lo, hi }: 안쪽 겹을 아래(lo)·위(hi) 두 톤으로(계단실 노랑/연민트 — 문서 v80c). top은 벽 바닥(opt.y0) 기준
    // opt.ext: 바깥벽(두 겹) 강제 — 카키 사이딩처럼 WALL이 아닌 바깥색. opt.innerHex: 안쪽 겹 색(로비 벽돌 등)
    const ext = opt.ext ?? (hex === WALL);
    if ((opt.inner ?? ext) || opt.dado) {
      const f = opt.face ?? 1, d = opt.dado;
      box(0.15, hex, f*0.075, y0, h);
      // 겉 무늬(PATTERN-1): 바깥 겹 바깥 면에서 1.2cm 앞에 무늬판(카키 사이딩·베이지 판·벽돌)
      if (opt.skin) patWall(opt.skin, ax, cx - len/2, cx + len/2, y0, y0 + h, z + f*0.162, f);
      // 아랫단 띠(DETAIL-3): 바깥벽 1층 바닥 조각에 짙은 띠 0.45 — 벽 면에서 4cm 튀어나옴(맞댐)
      if (ext && y0 === 0 && (opt.y0 ?? 0) === 0 && len >= 0.15) plinths.push({ ax, a0: cx - len/2, a1: cx + len/2, o: z + f*0.17 });
      const lo = d ? Math.max(0, Math.min(h, (opt.y0 ?? 0) + d.top - y0)) : 0;
      if (d && lo >= 0.15 && h - lo >= 0.15) { box(0.15, d.lo, -f*0.075, y0, lo); box(0.15, d.hi, -f*0.075, y0 + lo, h - lo); }
      else box(0.15, d ? (lo >= h - 0.15 ? d.lo : d.hi) : (opt.innerHex ?? INNER), -f*0.075, y0, h);
    } else box(0.3, hex, 0, y0, h);
  }
  // 벽 한 줄 — 문(gaps)과 창(wins·gaps의 win)을 '진짜 구멍'으로 뚫는다.
  //  창 = 창턱 아래 벽 + 인방 + 반투명 유리판(벽 두께 가운데 0.16). 예전엔 벽 위에 불투명 판을 붙여 실내가 안 보였다(사용자 07-30).
  //  문 = 바닥부터 트인 개구 + 인방(dh ≤ 2.8·폭 ≤ 2.2 또는 door:true → 문짝 수집).
  function wallRun(ax, a0, a1, line, hex, opt) {
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, doorGaps = opt.gaps ?? [];
    const gaps = doorGaps.map(g => ({ ...g }));
    if (opt.wins) {
      const n = opt.wins, span = (a1 - a0) / n, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5;
      for (let i = 0; i < n; i++) {
        const wc = a0 + span * (i + .5), ww = Math.min(2.2, span - 1.6);
        if (ww < 1) continue;
        if (doorGaps.some(g => Math.abs(g.c - wc) < g.w/2 + ww/2 + 0.3)) continue;
        if (opt.noWin && opt.noWin.some(([a, b]) => wc + ww/2 > a && wc - ww/2 < b)) continue;   // 실제로는 벽인 구간
        gaps.push({ c: wc, w: ww, sill, dh: sill + wh, win: true, frame: opt.frame });
      }
    }
    gaps.sort((p, q) => (p.c - p.w/2) - (q.c - q.w/2));
    let cur = a0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6, sl = g.sill ?? 0;
      if (g0 - cur > 0.1499) wallSeg(ax, g0 - cur, h, (cur + g0)/2, y0, line, hex, opt);
      if (sl > 0.1499) wallSeg(ax, g1 - g0, sl, (g0 + g1)/2, y0, line, hex, opt);                   // 창턱 아래
      if (h - dh > 0.1499) wallSeg(ax, g1 - g0, h - dh, (g0 + g1)/2, y0 + dh, line, hex, opt);     // 인방
      if (g.win) { const fw = (opt.ext ?? hex === WALL) ? (opt.face ?? 1) : 0;
        // 실내창 창턱이 점프로 닿는 높이(<1.6)면 유리 충돌을 벽 두께(0.3 + 양쪽 2mm)로 — 유리(0.16)가 창턱 벽(0.3)보다 얇으면
        //   그 차이 7cm 띠에서 창턱 윗면에 올라앉아 벽 앞 허공에 선다(classrooms 리뷰: 복도 쪽 실내창 창턱 1.1). 그림·감사는 그대로 0.16
        glassPane(ax, g1 - g0, Math.min(dh, h) - sl, (g0 + g1)/2, y0 + sl, line, !fw && sl < 1.6 ? 0.304 : 0.16); winFrame(ax, g0, g1, y0 + sl, y0 + Math.min(dh, h), line, fw, g.frame, g.noLedge);
        winLog.push({ ax, g0, g1, yb: y0 + sl, yt: y0 + Math.min(dh, h), y0, line, f: fw }); }
      else {
        // 문턱(FLOOR-1): 벽 두께 자리 바닥 — 바닥판은 벽 면에서 끝나므로 문 밑에 기초 윗면이 드러나지 않게 채운다
        if (sl === 0 && !g.noSill) ax === 'x' ? addPanel(g1 - g0, 0.3, 0xb3aea4, (g0 + g1)/2, y0 + 0.012, line) : addPanel(0.3, g1 - g0, 0xb3aea4, line, y0 + 0.012, (g0 + g1)/2);
        if (dh <= 2.8 && (g.w <= 2.2 || g.door))
          doors.push(ax === 'x' ? { ax, cx: g.c, cz: line, w: g.w, y0, dh, lintel: h - dh > 0.1499, glass: !!g.glass, slideOver: !!g.slideOver, color: g.color } : { ax, cx: line, cz: g.c, w: g.w, y0, dh, lintel: h - dh > 0.1499, glass: !!g.glass, slideOver: !!g.slideOver, color: g.color });
      }
      cur = Math.max(cur, g1);
    }
    if (a1 - cur > 0.1499) wallSeg(ax, a1 - cur, h, (cur + a1)/2, y0, line, hex, opt);
  }
  // 유리판 — 충돌은 개구 전체, 그림·감사는 사방 2cm 안쪽(창틀 속에 묻혀 틀 면과 같은 평면이 안 되게). 투명 유리 한 덩어리(드로우콜 1)
  const glassPos = [], winLog = [];   // winLog = 만든 창 목록(블라인드 등 창 뒤 꾸밈용)
  function glassPane(ax, len, hh, c, y, line, cth = 0.16) {   // cth = 충돌 두께(그림 두께는 늘 0.16)
    const w = ax === 'x' ? len : 0.16, d = ax === 'x' ? 0.16 : len, cx = ax === 'x' ? c : line, cz = ax === 'x' ? line : c;
    const cw = ax === 'x' ? w : cth, cd = ax === 'x' ? cth : d;
    colliders.push({ x0: cx - cw/2, x1: cx + cw/2, y0: y, y1: y + hh, z0: cz - cd/2, z1: cz + cd/2 });
    const iw = ax === 'x' ? w - 0.04 : w, id = ax === 'x' ? d : d - 0.04, ih = hh - 0.04;
    allBoxes.push({ x0: cx - iw/2, x1: cx + iw/2, y0: y + 0.02, y1: y + 0.02 + ih, z0: cz - id/2, z1: cz + id/2 });
    for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*iw + cx, bpos.getY(i)*ih + y + hh/2, bpos.getZ(i)*id + cz);
  }
  // 창틀(DETAIL-3): 알루미늄 틀 사방 6cm + 세로 창살(폭 1.3↑ 1개·2.6↑ 2개), 두께 0.2(벽 0.3·유리 0.16 사이 — 어느 면과도 안 겹침).
  // 바깥벽(f≠0)은 바깥쪽에 창턱(5cm 두께·10cm 튀어나옴)을 단다. 작은 부재라 near 층(멀면 숨김)
  function winFrame(ax, g0, g1, yb, yt, line, f, frame, noLedge = false) {
    const FR9 = frame ?? (f ? 0x7a5a3e : 0xdfe3e6), T = 0.2, len = g1 - g0;   // 바깥 창 = 나무색 틀(영상 f_165·a_480·v2180_0108), 안쪽 창 = 연회색
    const bx = (a0, a1, y0, y1, th = T, off = 0, col = FR9) => ax === 'x'
      ? dBox(a1 - a0, y1 - y0, th, col, (a0 + a1)/2, y0, line + off)
      : dBox(th, y1 - y0, a1 - a0, col, line + off, y0, (a0 + a1)/2);
    bx(g0, g0 + 0.06, yb, yt); bx(g1 - 0.06, g1, yb, yt);
    bx(g0 + 0.06, g1 - 0.06, yt - 0.06, yt); bx(g0 + 0.06, g1 - 0.06, yb, yb + 0.06);
    const nm = len > 2.3 ? 3 : len > 1.3 ? 1 : 0;                                    // 넓은 창 = 미닫이 4짝
    for (let k = 1; k <= nm; k++) { const mc = g0 + len * k / (nm + 1); bx(mc - 0.025, mc + 0.025, yb + 0.06, yt - 0.06); }
    if (f && yt - yb > 1.4) bx(g0 + 0.06, g1 - 0.06, yt - 0.47, yt - 0.42, T - 0.03);   // 위 가로살(작은 윗창 — 세로살과 면이 겹치지 않게 얇게)
    if (f && !noLedge) bx(g0 - 0.05, g1 + 0.05, yb - 0.05, yb, 0.1, f * 0.2, 0xcfc8ba);   // 바깥 창턱(상자 틀이 있는 창은 상자 창턱이 대신)
  }
  function wallX(x0, x1, z, hex, opt = {}) {
    if (x0 > x1) { console.warn('wallX 인자 역순 자동 정렬', x0, x1, z); const t = x0; x0 = x1; x1 = t; }
    wallRun('x', x0, x1, z, hex, opt);
  }
  function wallZ(z0, z1, x, hex, opt = {}) {
    // ⚠️역순으로 넘기면 벽이 조용히 통째로 사라진다(세로복도 서벽 실종 사고) — 자동 정렬로 봉쇄
    if (z0 > z1) { console.warn('wallZ 인자 역순 자동 정렬', z0, z1, x); const t = z0; z0 = z1; z1 = t; }
    wallRun('z', z0 + 0.15, z1 - 0.15, x, hex, opt);
  }
  // 팻말(SIGN-ATLAS · 09-23): 예전엔 팻말마다 텍스처·메시 1개씩(≈100 드로우콜). 이제 자리만 기록해 두고
  // 병합 단계에서 글자판 한 장(아틀라스)에 모아 메시 1개로 그린다. 반환값 m은 위치·회전만 가진 Object3D(hangSign이 옮긴다)
  const signCanvas = new Map(), signList = []; let signMeasure = null;
  // sty = { bg, fg } — 기본은 파란 팻말. 현관 아치 나무 현판처럼 색이 다른 글자판(09-24)
  function sign(text, x, y, z, rotY = 0, h = 0.42, sty = null) {
    const key = text + (sty ? '|' + sty.bg + sty.fg : '');
    let c = signCanvas.get(key);
    if (!c && text === EXIT_KEY) { c = exitCanvas(); signCanvas.set(key, c); }
    if (!c && text === FLAG_KEY) { c = taegukCanvas(); signCanvas.set(key, c); }
    if (!c) {
      c = document.createElement('canvas');
      if (!signMeasure) { signMeasure = document.createElement('canvas').getContext('2d'); signMeasure.font = '900 84px sans-serif'; }   // PERF-LOAD: 글자 폭은 한 붓으로(글꼴 한 번 — 같은 값)
      c.width = Math.ceil(signMeasure.measureText(text).width) + 56; c.height = 128;
      const g3 = c.getContext('2d');
      if (!(sty && sty.bg === 'none')) { g3.fillStyle = sty ? sty.bg : '#2f6fd0'; g3.beginPath(); g3.roundRect(2,2,c.width-4,c.height-4,20); g3.fill(); }   // bg 'none' = 글자만(벽에 붙인 글자)
      g3.font = '900 84px sans-serif'; g3.fillStyle = sty ? sty.fg : '#fff'; g3.textAlign='center'; g3.textBaseline='middle';
      g3.fillText(text, c.width/2, c.height/2 + 4);
      signCanvas.set(key, c);
    }
    const w = h * c.width / c.height;
    const m = new THREE.Object3D();
    m.position.set(x, y, z); m.rotation.y = rotY;
    signList.push({ m, c, w, h });
    return { m, w };
  }
  // 비상구 유도등 그림(피난구 — 초록 바탕 · '비상구' · 흰 사람이 문으로 달려간다). 글자판과 같은 아틀라스(조명 무시 재질 → 밤에도 빛남)
  const EXIT_KEY = '\u0001EXIT', FLAG_KEY = '\u0001FLAG';
  // 태극기(3:2 · 360×240). 태극 축 = 좌상-우하 대각선(빨강 머리 좌상·파랑 머리 우하, 빨강이 위) · 건(좌상)·곤(우하)·감(우상)·리(좌하), 괘 막대는 제 대각선에 수직
  function taegukCanvas() {
    const cv = document.createElement('canvas'); cv.width = 360; cv.height = 240; const g = cv.getContext('2d'), A = Math.atan2(2, 3);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 360, 240);
    g.save(); g.translate(180, 120); g.rotate(A);
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(0, 0, 60, Math.PI, 0); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(0, 0, 60, 0, Math.PI); g.fill();
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(-30, 0, 30, 0, Math.PI); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(30, 0, 30, Math.PI, 0); g.fill();
    g.restore();
    g.fillStyle = '#000000';
    const D = 110, ux = Math.cos(A), uy = Math.sin(A);
    [[-1, -1, A, [1, 1, 1]], [1, 1, A, [0, 0, 0]], [1, -1, -A, [0, 1, 0]], [-1, 1, -A, [1, 0, 1]]].forEach(([sx, sy, a, bars]) => {
      g.save(); g.translate(180 + sx * D * ux, 120 + sy * D * uy); g.rotate(a);
      bars.forEach((b, k) => { const x = -20 + k * 15; if (b) g.fillRect(x, -30, 10, 60); else { g.fillRect(x, -30, 10, 27.5); g.fillRect(x, 2.5, 10, 27.5); } });
      g.restore(); });
    return cv;
  }
  function exitCanvas() {
    const c = document.createElement('canvas'); c.width = 336; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#10a04e'; g.beginPath(); g.roundRect(2, 2, 332, 124, 14); g.fill();
    g.fillStyle = '#fff'; g.fillRect(222, 16, 90, 98); g.fillStyle = '#10a04e'; g.fillRect(236, 30, 62, 84);   // 문틀
    g.fillStyle = '#fff'; g.beginPath(); g.arc(184, 30, 12, 0, Math.PI * 2); g.fill();                           // 머리
    g.strokeStyle = '#fff'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
    const L = pts => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => g.lineTo(q[0], q[1])); g.stroke(); };
    L([[176, 48], [158, 80]]);                                   // 몸(앞으로 기울어짐)
    L([[172, 55], [192, 64], [206, 54]]); L([[172, 55], [154, 60], [140, 72]]);   // 팔
    L([[158, 80], [180, 92], [184, 114]]); L([[158, 80], [144, 100], [120, 106]]); // 다리
    g.font = '900 38px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('비상구', 66, 68);
    return c;
  }
  // (x, z) = 벽 안쪽 면 위 점, n = 면 법선 [nx, nz]. 흰 등 상자(3cm) + 그림판(상자 앞 1cm)
  function exitSign(x, z, y, n) {
    const [nx, nz] = n, ry = Math.atan2(nx, nz);
    if (nx === 0) dBox(0.41, 0.18, 0.03, 0xf2f2ee, x, y - 0.09, z + nz * 0.015);
    else dBox(0.03, 0.18, 0.41, 0xf2f2ee, x + nx * 0.015, y - 0.09, z);
    sign(EXIT_KEY, x + nx * 0.032, y, z + nz * 0.032, ry, 0.14);
  }
  function buildSigns() {
    if (!signList.length) return;
    // 아틀라스: 폭 2048, 줄 높이 96(+여백 8 — 밉맵 번짐 방지). 글자판은 128→96으로 줄여 담는다
    const AW = 2048, RH = 96, PAD = 8, uv = new Map();
    let x = PAD, y = PAD;
    for (const c of signCanvas.values()) {
      const w = Math.ceil(c.width * RH / c.height);
      if (x + w + PAD > AW) { x = PAD; y += RH + PAD; }
      uv.set(c, [x, y, w]); x += w + PAD;
    }
    const AH = y + RH + PAD;
    const at = document.createElement('canvas'); at.width = AW; at.height = AH;
    const g = at.getContext('2d');
    for (const [c, [ux, uy, uw]] of uv) g.drawImage(c, ux, uy, uw, RH);
    const tex = new THREE.CanvasTexture(at); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const pos = [], uvs = [], v = new THREE.Vector3();
    for (const { m, c, w, h } of signList) {
      m.updateMatrix();
      const [ux, uy, uw] = uv.get(c);
      const u0 = ux / AW, u1 = (ux + uw) / AW, v1 = 1 - uy / AH, v0 = 1 - (uy + RH) / AH;
      // 앞면(+z 0.008)과 뒷면(-z 0.008, 반대로 감김) — 양면 팻말. 뒷면 글자는 좌우를 뒤집어 바로 읽히게
      const quad = (zz, flip) => {
        const xs = flip ? [w/2, -w/2] : [-w/2, w/2];
        const P = [[xs[0], -h/2], [xs[1], -h/2], [xs[1], h/2], [xs[0], -h/2], [xs[1], h/2], [xs[0], h/2]];
        const U = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];
        P.forEach(([px, py], i) => { v.set(px, py, zz).applyMatrix4(m.matrix); pos.push(v.x, v.y, v.z); uvs.push(U[i][0], U[i][1]); });
      };
      quad(0.008, false); quad(-0.008, true);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 }));   // 투명 부분은 버린다(글자만 붙이는 팻말·둥근 모서리)
    mesh.matrixAutoUpdate = false; scene.add(mesh);
  }
  // 돌출 팻말 — 문 위에서 복도 쪽으로 튀어나온 파란 팻말(영상 v2179_0501·v1). 복도를 따라 걸으면 정면으로 보인다.
  // 사용자 07-31 "복도에서 문 위에 붙어야", "천장에 잘림" → 문 위·천장 아래 높이. dir = 복도가 있는 쪽(z 부호)
  function hangSign(text, x, y, zWall, dir, h = 0.3) {
    const s9 = sign(text, x, y, zWall, Math.PI / 2, h);
    s9.m.position.z = zWall + dir * (s9.w / 2 + 0.17); s9.m.updateMatrix();
  }
  // 나무(DETAIL-1): 가늘어지는 7각 줄기 + 가지 둘 + 둥근 잎 덩어리 4~5개(초록 세 가지). 자리마다 모양·방향이 다르다.
  // ⚠️밑동 충돌은 보이지 않게 12m까지 — 밑동 위에 올라서면 점프로 지붕에 닿았다(사용자 07-30 "나무 위로 못 올라가게")
  //   lite = 가벼운 모양(5각 줄기·가지 + 잎 덩어리 20면 BLOB0 — 484 → 160삼각형). 뒤뜰처럼 far 층 청크가 멀리서도 절두체에 통째로 들어오는 곳에 쓴다
  //   (서관 안에서 남동쪽을 보면 뒤뜰 far 층이 창·벽 너머로 +13k 더해져 15만을 넘었다 — 09-24 리뷰)
  function tree(x, z, s = 1, lite = false) {
    const y = tY(z, x), h = hash2(x, z), ry = h * Math.PI * 2, F = lite ? { far: true, seg: 5 } : { far: true };
    colliders.push({ x0: x-0.21*s, x1: x+0.21*s, y0: y, y1: y+12, z0: z-0.21*s, z1: z+0.21*s });   // [integ 09-25] 0.25 → 0.21: 줄기(밑 반지름 0.22 · 7각 안쪽 0.2)보다 넓으면 큰 나무(s 3.4)에서 줄기 앞 보이지 않는 벽
    dCyl(0.13*s, 0.22*s, 2.3*s, 0x6d4e32, x, y, z, F);
    dCyl(0.05*s, 0.08*s, 0.9*s, 0x6d4e32, x + Math.cos(ry)*0.1*s, y + 1.5*s, z + Math.sin(ry)*0.1*s, { ...F, rot: [0.7*Math.sin(ry), 0, 0.7*Math.cos(ry)] });
    dCyl(0.05*s, 0.08*s, 0.8*s, 0x6d4e32, x - Math.cos(ry)*0.1*s, y + 1.7*s, z - Math.sin(ry)*0.1*s, { ...F, rot: [-0.7*Math.sin(ry), 0, -0.7*Math.cos(ry)] });
    const G = [0x3f7a3f, 0x4d8b4d, 0x5c9a4f];
    const cl = [[0, 2.75, 0, 1.3, 1.0], [0.8, 2.45, 0.2, 0.9, 0.8], [-0.7, 2.5, -0.3, 0.95, 0.8], [0.15, 3.45, -0.15, 0.95, 0.8], [-0.2, 2.35, 0.75, 0.8, 0.7]];
    cl.forEach(([ox, oy, oz, r, sy], i) => {
      const c = Math.cos(ry), sn = Math.sin(ry), wx = x + (ox*c - oz*sn)*s, wz = z + (ox*sn + oz*c)*s;
      dBlob(r*s, r*sy*s, r*s, G[(i + Math.floor(h*3)) % 3], wx, y + oy*s, wz, { far: true, chunky: lite, ry: ry + i, jitter: lite ? 0.16 : 0.12 });
    });
  }

  // 배경 나무(위성 나무 무리용 — 가벼운 모양: 5각 줄기 + 둥근 잎 두 덩어리 ≈ 70삼각형). 밑동 충돌 12m(나무 위에 못 올라가게)
  function bgTree(x, z, s = 1) {
    const y = tY(z, x), h = hash2(x, z);
    colliders.push({ x0: x - 0.19*s, x1: x + 0.19*s, y0: y, y1: y + 12, z0: z - 0.19*s, z1: z + 0.19*s });   // [integ 09-25] 0.3 → 0.19 = 5각 줄기 안쪽(보이지 않는 벽 — 서쪽 대지 나무 무리)
    canopyBox(x, z, y + 3.2*s, 1.35*s, 1.36*s, 1.36*s, 0);   // [integ 09-25] 어린 나무(s < 0.8)는 잎 덩어리가 몸 높이 — 뚫고 지나가지 않게(ghost). 20면이라 반지름 × 0.85
    dCyl(0.14*s, 0.22*s, 2.6*s, 0x6d4e32, x, y, z, { far: true, seg: 5 });
    dBlob(1.6*s, 1.35*s, 1.6*s, [0x3f7a3f, 0x4d8b4d, 0x467f44][Math.floor(h*3) % 3], x, y + 3.2*s, z, { far: true, chunky: true, ry: h*6, jitter: 0.14 });
    dBlob(1.1*s, 0.95*s, 1.1*s, 0x5c9a4f, x + 0.5*s, y + 4.1*s, z - 0.3*s, { far: true, chunky: true, ry: h*9, jitter: 0.14 });
  }
  // 침엽수(DETAIL-1): 굵은 줄기 + 8각 원뿔 4단(위로 갈수록 밝은 초록·단마다 비틀어 결이 엇갈리게)
  function pine(x, z, s = 1) {
    const y = tY(z, x), ry = hash2(x, z) * Math.PI * 2;
    roundCol(x, z, (0.5 * s - 0.05) * 0.9, y, y + 12);   // [quality4 09-26] 상자 한 장(0.47s) → 십자 = 몸 높이(0.75) 7각 줄기 안쪽 — s 1.8(본관 동쪽 끝)에서 상자 모서리가 줄기 밖 0.3(보이지 않는 벽 9간선)
    dCyl(0.28*s, 0.5*s, 3.6*s, 0x6d4e32, x, y, z, { far: true });
    [[2.9, 2.6, 2.8, 0x2f6b46], [4.8, 2.1, 2.5, 0x3a7d52], [6.6, 1.6, 2.2, 0x468c5c], [8.2, 1.0, 1.9, 0x4f9663]]
      .forEach(([yy, r, h, c], i) => dCyl(0, r*s, h*s, c, x, y + yy*s, z, { far: true, seg: 8, rot: [0, ry + i*0.4, 0] }));
  }
  // 차(DETAIL-5): 차체(바닥 25cm 띄움)·바퀴 4·짙은 유리 캐빈·지붕·전조등·후미등. 길이 방향 = z. 충돌은 예전 상자 그대로
  function car(cx, cz, body, roof, y = 0, L = 4.0, W = 1.8, at = null) {   // at = 몸통을 이 청크에 합침
    colliders.push(noStand({ x0: cx - W/2, x1: cx + W/2, y0: y, y1: y + 1.25, z0: cz - L/2, z1: cz + L/2 }));
    const F = at ? { far: true, at } : { far: true };
    dBox(W, 0.5, L, body, cx, y + 0.25, cz, F);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => dCyl(0.32, 0.32, 0.22, 0x26282c, cx + sx*(W/2 - 0.08), y + 0.32, cz + sz*(L/2 - 0.75), { ...F, seg: 10, rot: [0, 0, Math.PI/2] }));
    dBox(W - 0.24, 0.4, L * 0.48, 0x34424f, cx, y + 0.75, cz + 0.1, F);       // 유리 캐빈
    dBox(W - 0.2, 0.08, L * 0.5, roof, cx, y + 1.15, cz + 0.1, F);            // 지붕
    [-1, 1].forEach(sx => {
      dBox(0.3, 0.12, 0.04, 0xf4f1e0, cx + sx*(W/2 - 0.3), y + 0.55, cz - L/2 - 0.02);   // 전조등(-z 앞)
      dBox(0.3, 0.12, 0.04, 0xc0392b, cx + sx*(W/2 - 0.3), y + 0.55, cz + L/2 + 0.02);   // 후미등
    });
  }
  // 책장(DETAIL-6): 6×1.9×0.5 양면 서가 — 옆판·지붕판·칸 4단·가운데 등판, 칸마다 양쪽으로 색색 책 덩어리(높이 제각각)
  const BOOK = [0xc0392b, 0x2e6da4, 0xe8a33d, 0x3fa37a, 0x8a6ad0, 0xe0708a, 0x5bb5c9, 0xf2d15c, 0x6b5b4a, 0xecebe4];
  function bookshelf(cx, cz, w = 6) {
    colliders.push(noStand({ x0: cx - w/2, x1: cx + w/2, y0: 0, y1: 1.9, z0: cz - 0.25, z1: cz + 0.25 }));
    const WD = 0x8a6a45;
    [-1, 1].forEach(sx => dBox(0.05, 1.9, 0.5, WD, cx + sx*(w/2 - 0.025), 0, cz));
    dBox(w - 0.1, 0.05, 0.5, WD, cx, 1.85, cz);
    dBox(w - 0.14, 1.76, 0.04, 0x7a5a3a, cx, 0.09, cz);                                // 가운데 등판(칸 판과 끝면 안 겹치게 2cm씩 안쪽)
    const LV = [0.05, 0.5, 0.95, 1.4];
    LV.forEach(y => dBox(w - 0.1, 0.04, 0.5, WD, cx, y, cz));
    LV.forEach((y, li) => [-1, 1].forEach(sz => {
      let x = cx - w/2 + 0.07, k = 0;
      while (x < cx + w/2 - 0.35) {
        const h9 = hash2(x * 3.1 + li, cz + sz), bw = 0.22 + h9 * 0.3, bh = 0.26 + ((h9 * 7) % 1) * 0.12;
        const x1 = Math.min(x + bw, cx + w/2 - 0.07);
        dBox(x1 - x - 0.01, bh, 0.19, BOOK[(k + li * 3 + (sz > 0 ? 5 : 0)) % BOOK.length], (x + x1)/2, y + 0.04, cz + sz * 0.125);
        x = x1 + 0.01; k++;
      }
    }));
  }
  // 가구(DETAIL-1): 충돌·자리 계산은 예전 상자 크기 그대로 두고, 보이는 모양만 부품으로 짓는다.
  const METAL = 0x8a9096;
  // 90° 돌림(rot=1): 지역 좌표 (가로 ox, 앞뒤 oz — 앞 = -z)를 세계로. 앞(-z)이 서쪽(-x)이 된다(교실 = 보건실 쪽을 본다 — 사용자 09-24)
  const RO = (rot, ox, oz) => rot ? [oz, -ox] : [ox, oz];
  const rBox = (rot, w, h, d, hex, cx, y0, cz, ox, oz, opt) => { const [px, pz] = RO(rot, ox, oz); rot ? dBox(d, h, w, hex, cx + px, y0, cz + pz, opt) : dBox(w, h, d, hex, cx + px, y0, cz + pz, opt); };
  const rCol = (rot, cx, cz, hw, hd, y0, y1) => rot ? { x0: cx-hd, x1: cx+hd, y0, y1, z0: cz-hw, z1: cz+hw } : { x0: cx-hw, x1: cx+hw, y0, y1, z0: cz-hd, z1: cz+hd };
  function studentDesk(cx, y, cz, top = 0xc9a06a, w = 1.1, rot = 0) {   // w×0.5·높이 0.72 — 나무 상판·쇠다리·책 넣는 칸
    colliders.push(noStand(rCol(rot, cx, cz, w/2, 0.25, y, y+0.72)));
    rBox(rot, w, 0.04, 0.5, top, cx, y+0.68, cz, 0, 0);
    const lx = w/2 - 0.05;
    [[-lx, -0.2], [lx, -0.2], [-lx, 0.2], [lx, 0.2]].forEach(([ox, oz]) => rBox(rot, 0.04, 0.68, 0.04, METAL, cx, y, cz, ox, oz));
    rBox(rot, w - 0.14, 0.1, 0.36, 0x9aa0a6, cx, y+0.52, cz, 0, -0.03);
  }
  const seatsOf = {};   // 교실 자리 목록(westClass가 채움 — 사람 배치가 학생을 앉히고 남은 자리에 '앉기')
  function chair(cx, y, cz, back = 1, col = 0x6f8fb0, rot = 0) {   // 0.5×0.85×0.4 — 앉는 판·등받이·쇠다리. back=등받이 쪽(지역 z 부호)
    colliders.push(noStand(rCol(rot, cx, cz, 0.25, 0.2, y, y+0.85)));
    rBox(rot, 0.42, 0.04, 0.4, col, cx, y+0.42, cz, 0, 0);
    rBox(rot, 0.42, 0.26, 0.035, col, cx, y+0.57, cz, 0, back*0.17);
    [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([ox, oz]) => rBox(rot, 0.03, 0.42, 0.03, METAL, cx, y, cz, ox, oz));
    [-0.18, 0.18].forEach(ox => rBox(rot, 0.03, 0.11, 0.03, METAL, cx, y+0.46, cz, ox, back*0.17));
  }
  function teacherDesk(cx, y, cz, rot = 0) {                        // 1.2×0.85×0.6 — 상판·서랍장(손잡이 3)·옆판 + 모니터 둘
    // [classrooms-14] 회색 철제 책상(밝은 상판·짙은 몸통) + 검은 모니터 2대, 서랍 손잡이는 교사 쪽(영상 a_427.5·a_490.5)
    colliders.push(noStand(rCol(rot, cx, cz, 0.6, 0.3, y, y+0.85)));
    rBox(rot, 1.24, 0.05, 0.64, 0xd9d6ce, cx, y+0.8, cz, 0, 0);
    rBox(rot, 0.42, 0.8, 0.56, 0x6b6f76, cx, y, cz, -0.36, 0);
    rBox(rot, 0.06, 0.8, 0.56, 0x6b6f76, cx, y, cz, 0.55, 0);
    [0.18, 0.43, 0.66].forEach(hy => rBox(rot, 0.16, 0.03, 0.03, 0xc9ccd0, cx, y+hy, cz, -0.36, -0.295));
    [-0.3, 0.3].forEach(ox => { rBox(rot, 0.08, 0.07, 0.08, 0x3a3d44, cx, y+0.85, cz, ox, 0.1); rBox(rot, 0.56, 0.34, 0.04, 0x2f3238, cx, y+0.92, cz, ox, 0.1);
      rBox(rot, 0.5, 0.28, 0.03, 0x3d5870, cx, y+0.95, cz, ox, 0.065); });
  }
  function officeDesk(cx, y, cz) {                                  // 1.3×0.74×0.7 — 상판·옆판·서랍장 + 모니터·키보드
    colliders.push(noStand({ x0: cx-0.65, x1: cx+0.65, y0: y, y1: y+0.74, z0: cz-0.35, z1: cz+0.35 }));
    dBox(1.34, 0.04, 0.74, 0xd9cdb6, cx, y+0.7, cz);
    dBox(0.05, 0.7, 0.66, 0xb8ab94, cx-0.62, y, cz);
    dBox(0.4, 0.7, 0.62, 0xb8ab94, cx+0.4, y, cz);
    dBox(0.08, 0.14, 0.08, 0x3a3d44, cx, y+0.74, cz-0.2);
    dBox(0.56, 0.34, 0.04, 0x2f3238, cx, y+0.88, cz-0.2);
    dBox(0.44, 0.03, 0.15, 0xe6e6e0, cx, y+0.74, cz+0.08);
  }

  const HALL_DADO = { top: 1.1, lo: 0xbfd89a, hi: 0xefe9dc };   // 본관 복도 벽: 아래 연두 징두리(영상 v2179_0462~0519)
  const STAIR_DADO = { top: 1.3, lo: 0xf2d27a, hi: 0xd4ece2 };   // 계단실 벽: 아래 노랑 / 위 연민트(영상 v2180_0159~0198)
  const WALL = 0xd8c39a, PAVE = 0xcfc8ba, INNER = 0xefe9dc, FLOOR = 0xe7e2d6, WOOD = 0xc9a063, CEIL = 0xf2eee4;
  const KHAKI = 0x9c9b7b, BLUE = 0x3f6fb0, YEL = 0xf2c230, DKWOOD = 0x4b3b31, BRICK = 0xa65d3f, STONE = 0xb9b7b0, FOUND = 0x857563;
  // ⚠️천장·조명은 '아래를 향한 면'이라 HemisphereLight의 groundColor(갈색 땅)에 물든다.
  //   정점색을 아무리 밝게 해도 소용없다 → 조명을 받지 않는 MeshBasicMaterial로 만든다(v1도 같은 결론).
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfdfbf2 });

  // ================= 무늬 층 (PATTERN-1 · 09-24) =================
  // 사용자 09-24 "천장 등 구조·바닥 디자인같은 것도 최대한 우리 학교라는 느낌" — 영상 프레임에서 읽은 바닥·천장·벽 무늬.
  // 무늬마다 사각형을 모았다가 캔버스 한 장을 월드 좌표(m)로 반복해 붙인다 → 무늬 하나 = 드로우콜 1.
  // 정점색(tint)을 곱하므로 같은 무늬로 색만 다른 칸(복도 가운데 갈색 타일·그늘진 잔디 등)을 만든다.
  const seeded = s => { s = Math.abs(Math.floor(s)) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const pick = (a, R) => a[((Math.floor(R() * a.length) % a.length) + a.length) % a.length];
  function tiles(g, N, n, cols, grout, gw, R, sheen = 0) {           // n×n 타일(타일마다 색 조금씩) + 줄눈(반복 이음매에서 반씩 이어짐)
    const s = N / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = pick(cols, R); g.fillRect(i*s, j*s, s, s);
      if (sheen) { const gr = g.createLinearGradient(i*s, j*s, (i+1)*s, (j+1)*s);
        gr.addColorStop(0, `rgba(255,255,255,${sheen})`); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(90,70,40,${sheen * 0.6})`);
        g.fillStyle = gr; g.fillRect(i*s, j*s, s, s); }
    }
    g.fillStyle = grout;
    for (let i = 0; i <= n; i++) { g.fillRect(i*s - gw/2, 0, gw, N); g.fillRect(0, i*s - gw/2, N, gw); }
  }
  function specks(g, N, k, cols, r0, r1, R, a = 1) {
    g.globalAlpha = a;
    for (let i = 0; i < k; i++) { g.fillStyle = pick(cols, R); g.beginPath(); g.arc(R()*N, R()*N, r0 + R()*(r1-r0), 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  function blotch(g, N, k, cols, r0, r1, a, R) {                    // 얼룩(가장자리 복제 → 이음매 없이 반복)
    g.globalAlpha = a;
    for (let i = 0; i < k; i++) {
      g.fillStyle = pick(cols, R); const r = r0 + R()*(r1-r0), x = R()*N, y = R()*N;
      for (const [ox, oy] of [[0,0],[N,0],[-N,0],[0,N],[0,-N]]) { g.beginPath(); g.arc(x+ox, y+oy, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  function bond(g, N, bw, bh, cols, joint, jw, R, odd = 0.5, accent = null) {   // 벽돌·보도블록 줄눈 쌓기(줄마다 반장 어긋남)
    for (let r = 0; r * bh < N; r++) {
      const off = (r % 2) * bw * odd;
      for (let x = -bw + off; x < N; x += bw) {
        g.fillStyle = accent && R() < accent[0] ? pick(accent[1], R) : pick(cols, R);
        g.fillRect(x, r*bh, bw, bh);
        if (x < 0) g.fillRect(x + N, r*bh, bw, bh);                   // 오른쪽 끝으로 넘어간 반장
      }
    }
    g.fillStyle = joint;
    for (let r = 0; r * bh <= N; r++) {
      g.fillRect(0, r*bh - jw/2, N, jw);
      const off = (r % 2) * bw * odd;
      for (let x = off; x <= N + bw; x += bw) g.fillRect(x - jw/2, r*bh, jw, bh);
    }
  }
  function planks(g, N, rows, cols, gap, R, minL, maxL) {           // 마루: 줄마다 길이 제각각인 널 + 결
    const rh = N / rows;
    for (let r = 0; r < rows; r++) {
      let x = -R() * maxL;
      while (x < N) {
        const L = minL + R() * (maxL - minL), c = pick(cols, R);
        g.fillStyle = c; g.fillRect(x, r*rh, L, rh); if (x < 0) g.fillRect(x + N, r*rh, Math.min(L, -x), rh);
        g.globalAlpha = 0.13; g.fillStyle = '#5a3a1c';
        for (let k = 0; k < 3; k++) { const yy = r*rh + 2 + R() * (rh - 4); g.fillRect(x + 4, yy, L - 8, 1); }
        g.globalAlpha = 1; g.fillStyle = gap; g.fillRect(x, r*rh, 1.5, rh);
        x += L;
      }
      g.fillStyle = gap; g.fillRect(0, r*rh, N, 1.5);
    }
  }
  const PATDEF = {
    // 이름: [한 장이 덮는 m, 캔버스 px, 천장(조명 무시)?, 그리기]
    tileC:  [0.9, 256, false, (g, N, R) => tiles(g, N, 2, ['#efe6d1', '#ebe1c9', '#f2ead8'], '#d8d2c6', 3, R, 0.08)],   // 현관 홀 크림 광택 45cm(영상 e_325~338 · hall_lobby-25: e_338 진열장 사이 ≈6.6칸 · 줄눈 옅게)
    tileW:  [0.9, 256, false, (g, N, R) => { tiles(g, N, 2, ['#eeebe4', '#eae6dc', '#f1eee8'], '#c9c2b2', 3, R, 0.05); specks(g, N, 160, ['#cfc9bd', '#bdb6a8'], 0.5, 1.1, R); }],   // 본관 복도 흰 45cm(영상 a_457~502)
    tileG:  [0.8, 256, false, (g, N, R) => { tiles(g, N, 2, ['#dad7d0', '#d5d2ca', '#dedbd4'], '#b3aea3', 3, R, 0.04); specks(g, N, 900, ['#9c978d', '#f4f2ee', '#7d7870', '#c9b9a0'], 0.5, 1.3, R); }],   // 로비·세로복도 테라초 40cm(c_344~358)
    ttile:  [0.8, 256, false, (g, N, R) => tiles(g, N, 4, ['#dfe6ea', '#dbe3e8', '#e4eaee'], '#b7c1c7', 2, R, 0.03)],   // 화장실 20cm
    wood:   [1.2, 256, false, (g, N, R) => planks(g, N, 12, ['#c9a676', '#cfad7e', '#c3a070', '#d3b386', '#c8a77a'], '#a98c62', R, 70, 190)],   // 교실 마루(영상 a_487~493·a_429 — 옅은 오크·판 줄 흐림, classrooms-17)
    gymw:   [2.4, 256, false, (g, N, R) => planks(g, N, 16, ['#e2b97f', '#dcb074', '#e7c28b', '#d8aa6e'], '#a07448', R, 110, 250)],     // 체육관 단풍나무 마루
    ecor:   [1.6, 256, false, (g, N, R) => { g.fillStyle = '#d9c7a0'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#cfbb93', '#e2d2ae'], 8, 30, 0.25, R); specks(g, N, 500, ['#b9a47c', '#efe3c6'], 0.5, 1.1, R, 0.7); }],   // 동관 복도 장판(c_364~373)
    check:  [0.4, 128, false, (g, N) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b2b' : '#d9d7cf'; g.fillRect(i*32, j*32, 32, 32); } }],   // 전실 흑백 체크 매트(e_322~324)
    rmat:   [0.6, 128, false, (g, N) => { g.fillStyle = '#8c3232'; g.fillRect(0, 0, N, N); g.strokeStyle = '#4f8c66'; g.lineWidth = 7;
              for (let k = -N; k <= 2*N; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + N, N); g.moveTo(k, N); g.lineTo(k + N, 0); g.stroke(); } }],   // 현관 앞 빨강·초록 고무 매트
    gmat:   [0.8, 128, false, (g, N, R) => { g.fillStyle = '#55585d'; g.fillRect(0, 0, N, N); g.fillStyle = '#4a4d52'; for (let k = 0; k < N; k += 8) g.fillRect(0, k, N, 3); specks(g, N, 120, ['#6a6d72'], 0.5, 1, R); }],   // 구령대·포털 짙은 회색 고무 매트
    pave:   [1.6, 256, false, (g, N, R) => bond(g, N, 32, 16, ['#dcc89c', '#d8c292', '#e1cea6', '#d6c08e'], '#b3a17c', 1.5, R, 0.5, [0.18, ['#b8ad97', '#c98f72', '#8f8b82', '#d2ae62', '#a9b0b8']])],   // 보도블록(영상 f_132~186 — 베이지에 회색·붉은·짙은 블록 섞임)
    brick:  [1.2, 240, false, (g, N, R) => bond(g, N, 48, 24, ['#a9624c', '#b36c55', '#9c5a45', '#b9765e'], '#8a5446', 2, R)],   // 가운데 마당 적벽돌 포장
    ilock:  [1.2, 256, false, (g, N, R) => {                           // 가운데 마당 물결 인터로킹(COURT-3 · 영상 Q_113.5~Q_128·b_108): 24×12cm 블록 · 가로 줄눈 물결 · 세로 줄눈 톱니 · 반 칸 엇갈림.
              g.fillStyle = '#978f80'; g.fillRect(0, 0, N, N);                //   밝은 회베이지 — 붉은 띠는 틴트(곱하기)로 같은 무늬를 쓴다
              const bw = N / 5, bh = N / 10, C = ['#e2dccf', '#d8d1c2', '#e6e0d4', '#d3cbbb', '#dcd5c7'];
              const wav = x => Math.sin(x / bw * Math.PI * 4) * 1.4;            // 가로 줄눈(주기 bw/2 — 윗줄·아랫줄이 같은 선을 쓴다)
              const zig = [0, 2.6, 0, -2.6, 0];                                  // 세로 줄눈 톱니(왼쪽 블록 오른변 = 오른쪽 블록 왼변)
              for (let r = 0; r < 10; r++) for (let k = 0; k < 5; k++) {
                const a = k * bw + (r % 2) * bw / 2, t = r * bh, col = pick(C, R), P = [];
                for (let i = 0; i <= 6; i++) { const x = a + bw * i / 6; P.push([x, t + wav(x)]); }
                for (let i = 1; i <= 3; i++) P.push([a + bw + zig[i], t + bh * i / 4]);
                for (let i = 6; i >= 0; i--) { const x = a + bw * i / 6; P.push([x, t + bh + wav(x)]); }
                for (let i = 3; i >= 1; i--) P.push([a + zig[i], t + bh * i / 4]);
                for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
                  g.fillStyle = col; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy)); g.closePath(); g.fill();
                  g.strokeStyle = '#8a8272'; g.lineWidth = 1.6; g.stroke(); }
              }
              blotch(g, N, 26, ['#b9b09e', '#cfc7b6', '#a9a28f'], 6, 22, 0.18, R); specks(g, N, 260, ['#8f887a', '#efe9dc'], 0.4, 1.0, R, 0.7); }],
    grass:  [3.2, 256, false, (g, N, R) => { g.fillStyle = '#6fa35a'; g.fillRect(0, 0, N, N); blotch(g, N, 70, ['#5e944d', '#80b567', '#699c51', '#78ab5f'], 10, 38, 0.22, R);
              g.lineWidth = 1.2; for (let i = 0; i < 1800; i++) { g.strokeStyle = pick(['rgba(70,120,55,0.45)', 'rgba(140,190,110,0.4)', 'rgba(95,140,70,0.4)'], R); const x = R()*N, y = R()*N; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5)*2, y - 2 - R()*3); g.stroke(); } }],
    dirt:   [4.0, 256, false, (g, N, R) => { g.fillStyle = '#d8c79e'; g.fillRect(0, 0, N, N); blotch(g, N, 55, ['#cdb98f', '#e2d3ad', '#d2bf94'], 12, 50, 0.2, R); specks(g, N, 420, ['#b8a57f', '#efe4c8', '#a8977a'], 0.6, 1.6, R); }],   // 운동장 흙
    asph:   [3.0, 256, false, (g, N, R) => { g.fillStyle = '#8f9094'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#85868a', '#9a9b9f'], 10, 40, 0.3, R); specks(g, N, 900, ['#6f7074', '#b0b1b4'], 0.4, 1, R, 0.8); }],
    gravel: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#b9b3a6'; g.fillRect(0, 0, N, N); specks(g, N, 2200, ['#a39c8e', '#d2ccc0', '#8c867a', '#c7c0b2'], 1, 2.6, R); }],   // 건물 밑 자갈 띠
    chip:   [2.0, 256, false, (g, N, R) => { g.fillStyle = '#a8875f'; g.fillRect(0, 0, N, N); for (let i = 0; i < 1600; i++) { g.fillStyle = pick(['#8e6e48', '#c2a276', '#9c7b52', '#b5946a'], R); g.save(); g.translate(R()*N, R()*N); g.rotate(R()*3.14); g.fillRect(-3, -1, 6, 2.2); g.restore(); } }],   // 숲놀이터 나무칩
    ctile:  [1.2, 256, true, (g, N, R) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, N, N); specks(g, N, 1500, ['#d3cdc1', '#dcd6ca'], 0.5, 0.95, R); g.fillStyle = '#d6d1c6'; for (let i = 0; i <= 2; i++) { g.fillRect(i*N/2 - 1.5, 0, 3, N); g.fillRect(0, i*N/2 - 1.5, N, 3); } }],   // 천장 텍스 60cm + T바
    coffer: [0.6, 128, true, (g, N) => { g.fillStyle = '#cfc8ba'; g.fillRect(0, 0, N, N); g.fillStyle = '#e0dace'; g.fillRect(4, 4, N-8, N-8); g.fillStyle = '#ebe6dc'; g.fillRect(12, 12, N-24, N-24); g.fillStyle = '#f7f5f0'; g.fillRect(20, 20, N-40, N-40); }],   // 로비·세로복도 우물반자(c_350~360)
    cflat:  [2.4, 128, true, (g, N) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, N, N); g.fillStyle = '#e3ded3'; g.fillRect(0, 0, N, 1); g.fillRect(0, 0, 1, N); g.fillRect(0, N/2, N, 1); }],   // 평천장(석고보드 이음)
    cwood:  [1.2, 128, true, (g, N, R) => planks(g, N, 8, ['#4e3d32', '#56443a', '#4a392f'], '#2f241e', R, 60, 128)],   // 현관 포털 짙은 나무 천장
    louver: [1.2, 128, true, (g, N, R) => { for (let i = 0; i < 10; i++) { g.fillStyle = pick(['#6b5847', '#735f4c', '#65523f'], R); g.fillRect(i*12.8, 0, 12.8, N); g.fillStyle = '#433428'; g.fillRect(i*12.8 + 11, 0, 1.8, N); } }],   // 구령대 지붕 밝은 갈색 루버 천장(영상 p_154·p_156·u_290 — 산책로 차양의 짙은 천장과 구별)
    woodP:  [1.2, 128, false, (g, N, R) => { g.fillStyle = pick(['#4d3c32', '#52413a', '#493a30'], R); g.fillRect(0, 0, N, N); g.globalAlpha = 0.16; g.fillStyle = '#2a1f19'; for (let k = 0; k < 26; k++) g.fillRect(0, R()*N, N, 1); g.fillStyle = '#6a5446'; for (let k = 0; k < 12; k++) g.fillRect(0, R()*N, N, 1); g.globalAlpha = 1;
              g.fillStyle = '#2a211b'; g.fillRect(0, 0, N, 1.5); g.fillRect(0, 0, 1.5, N); g.fillStyle = '#8a7a6c'; [[5, 5], [N - 6, 5], [5, N - 6], [N - 6, N - 6]].forEach(([x, y]) => g.fillRect(x, y, 2, 2)); }],   // 현관 돌출부·차양 큰 판 외장(영상 p_152·p_155·e_313: 1.2m 판 이음줄 + 가로 결 + 모서리 못)
    mosaic: [1.2, 256, false, (g, N, R) => {                           // 구령대 정면 조각 타일 — 둥근 판석 조각(크레이지 페이빙 · 영상 u_283·u_286·u_290): 격자 대신 이어 붙인 보로노이 조각 + 흰 줄눈
              const C = ['#9fbfd8', '#eed48c', '#e6a9b2', '#b8d3a0', '#a9b4bf', '#e9dcc0', '#f0c9a0'], n = 7, P = [];
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const c = pick(C, R), v = 0.92 + R() * 0.12; P.push([(i + 0.5 + (R() - 0.5) * 0.75) * N / n, (j + 0.5 + (R() - 0.5) * 0.75) * N / n, [1, 3, 5].map(o => Math.min(255, parseInt(c.slice(o, o + 2), 16) * v))]); }
              const img = g.createImageData(N, N), d = img.data;
              for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                let a = 1e9, b = 1e9, k = 0;
                for (let q = 0; q < P.length; q++) { let dx = Math.abs(x - P[q][0]), dy = Math.abs(y - P[q][1]); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; k = q; } else if (dd < b) b = dd; }
                const o = (y * N + x) * 4, c = Math.sqrt(b) - Math.sqrt(a) < 3.4 ? [242, 239, 232] : P[k][2];
                d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
              }
              g.putImageData(img, 0, 0); }],
    rockW:  [1.2, 128, false, (g, N, R) => {                           // 구령대 동쪽 계단 발치 흰 자연석 옹벽(영상 u_288·u_290) — 흰 돌 + 회색 줄눈
              const P = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 222 + R() * 26; P.push([(i + 0.5 + (R() - 0.5) * 0.7) * N / 4, (j + 0.5 + (R() - 0.5) * 0.7) * N / 4, [v, v - 2, v - 7]]); }
              const img = g.createImageData(N, N), d = img.data;
              for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
                let a = 1e9, b = 1e9, k = 0;
                for (let q = 0; q < P.length; q++) { let dx = Math.abs(x - P[q][0]), dy = Math.abs(y - P[q][1]); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; k = q; } else if (dd < b) b = dd; }
                const o = (y * N + x) * 4, c = Math.sqrt(b) - Math.sqrt(a) < 2.2 ? [138, 134, 126] : P[k][2];
                d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
              }
              g.putImageData(img, 0, 0); }],
    brickW: [1.2, 240, false, (g, N, R) => bond(g, N, 48, 16, ['#a5573d', '#b0624a', '#9a5038', '#b86c50'], '#d6ccbd', 2, R)],   // 적벽돌 벽(로비 서벽·체육관)
    siding: [2.4, 256, false, (g, N, R) => { for (let r = 0; r < 2; r++) { g.fillStyle = pick(['#9a9d8f', '#979a8c', '#9ea193'], R); g.fillRect(0, r*128, N, 128);   // 카키 큰 판(FRONT-3 · 영상 g_114 확대: 1.2 m 높이 녹회색 판 + 가는 가로 결 — 예전 20cm 사이딩·누런 올리브는 아님)
        for (let k = 0; k < 22; k++) { g.globalAlpha = 0.10 + R() * 0.12; g.fillStyle = R() < 0.5 ? '#7c7f6c' : '#b3b6a2'; g.fillRect(0, r*128 + 3 + R()*122, N, 1); } g.globalAlpha = 1;
        g.fillStyle = '#7a7d6b'; g.fillRect(0, r*128 + 126, N, 2); } g.fillRect(N - 2, 0, 2, N); }],   // 판 줄눈(가로 1.2 m · 세로 2.4 m)
    panelB: [2.4, 256, false, (g, N, R) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { g.fillStyle = pick(['#dcc7a1', '#d8c29a', '#dfcba7'], R); g.fillRect(i*128, j*64, 128, 64); } g.fillStyle = '#bea987'; for (let i = 0; i <= 2; i++) g.fillRect(i*128 - 1, 0, 2, N); for (let j = 0; j <= 4; j++) g.fillRect(0, j*64 - 1, N, 2); }],   // 본관 베이지 외벽 판(영상 p_149·f_162)
    photoB: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#2f6e4f'; g.fillRect(0, 0, N, N);   // 현관 홀 사진 게시판(영상 e_332~336)
              for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i*64 + 5 + R()*6, y = j*64 + 5 + R()*6, w = 46 + R()*8, h = 48 + R()*6;
                g.fillStyle = pick(['#f4f1e8', '#fbf7e9', '#e8f0f6'], R); g.fillRect(x, y, w, h);
                if (R() < 0.7) { g.fillStyle = pick(['#9cc3e0', '#e3b39c', '#b9d89e', '#e8d18a', '#c7b3dd', '#8fb28a'], R); g.fillRect(x + 4, y + 4, w - 8, h * 0.55); }
                g.fillStyle = '#9a9a9a'; for (let k = 0; k < 3; k++) g.fillRect(x + 5, y + h*0.68 + k*5, (w - 10) * (0.5 + R()*0.5), 2); } }],
    notice: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#2f6e4f'; g.fillRect(0, 0, N, N);   // 학생자치회 소식판(영상 a_459~460)
              for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 8 + R()*8, y = j*85 + 8 + R()*8, w = 62 + R()*8, h = 70;
                g.fillStyle = pick(['#fbf8ee', '#fff6d8', '#f6e3e3', '#e3eef8'], R); g.fillRect(x, y, w, h);
                g.fillStyle = pick(['#d24b4b', '#3b6fb5', '#2f8f5b', '#e0932f'], R); g.fillRect(x + 5, y + 5, w - 10, 9);
                g.fillStyle = '#8d8d8d'; for (let k = 0; k < 7; k++) g.fillRect(x + 5, y + 20 + k*7, (w - 10) * (0.45 + R()*0.55), 2); } }],
    stoneW: [1.6, 256, false, (g, N, R) => { g.fillStyle = '#b9b5ac'; g.fillRect(0, 0, N, N);   // 체육관 대지 돌 옹벽(영상 g_087~091: 짙은 회색 막돌 모자이크 + 밝은 굵은 줄눈)
              const n = 6, s = N / n, J = [];                                   // 흔든 격자 꼭짓점(가장자리 고정 → 이음매 없이 반복) → 칸마다 막돌 한 장
              for (let i = 0; i <= n; i++) { J[i] = []; for (let j = 0; j <= n; j++) J[i][j] = [i*s + (i % n ? (R() - 0.5) * s * 0.6 : 0), j*s + (j % n ? (R() - 0.5) * s * 0.6 : 0)]; }
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = [J[i][j], J[i+1][j], J[i+1][j+1], J[i][j+1]], cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
                g.fillStyle = pick(['#6e6a62', '#5f5b54', '#77726a', '#66625b', '#7d786f'], R); g.beginPath();
                q.forEach(([x, y], k) => { const X = cx + (x - cx) * 0.86, Y = cy + (y - cy) * 0.86; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill(); } }],
    brickG: [1.2, 240, false, (g, N, R) => bond(g, N, 48, 16, ['#a86a52', '#9d5f48', '#b07459', '#946049'], '#d6ccbd', 2, R)],   // 체육관·부속동 적벽돌(영상 g_087~094 — 갈색 도는 적벽돌 + 밝은 줄눈)
    teal:   [0.4, 128, false, (g, N, R) => { g.fillStyle = '#3f7f5e'; g.fillRect(0, 0, N, N); g.fillStyle = '#5f9a78';   // 로비 문 밖 발판 초록 격자 매트(COURT-3 · 영상 b_132·c_348)
              for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12); specks(g, N, 120, ['#2f5f47', '#7fb094'], 0.5, 1.1, R); }],
    tactX:  [0.3, 64, false, (g, N) => { g.fillStyle = '#e8c23e'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9a42c'; for (let k = 0; k < 4; k++) g.fillRect(0, 6 + k*16, N, 5); }],   // 점자블록(선형) — 동서 길
    tactZ:  [0.3, 64, false, (g, N) => { g.fillStyle = '#e8c23e'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9a42c'; for (let k = 0; k < 4; k++) g.fillRect(6 + k*16, 0, 5, N); }],   // 남북 길
    lockD:  [1.0, 64, false, (g, N) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N); g.fillStyle = 'rgba(40,28,20,0.85)'; g.fillRect(0, 0, N, 3); g.fillRect(0, 0, 3, N);   // 사물함 칸문 한 칸(정점색 = 문 색)
              g.fillStyle = 'rgba(40,28,20,0.35)'; g.fillRect(3, N - 5, N - 3, 2); g.fillRect(N - 5, 3, 2, N - 3); g.fillStyle = '#2f2f33'; g.fillRect(N - 14, N/2 - 7, 4, 14); g.fillStyle = '#f4f1e8'; g.fillRect(N/2 - 10, 8, 20, 7); }],
    mural:  [2.0, 256, false, (g, N, R) => {                           // 유치원 쪽 복도 벽 그림(영상 W_204~212: 언덕·나무·꽃·동물 오림) — 아래 절반만 보인다
              g.fillStyle = '#eaf3dc'; g.fillRect(0, 0, N, N);
              g.fillStyle = '#b9dc8e'; g.beginPath(); g.moveTo(0, N); for (let x = 0; x <= N; x += 8) g.lineTo(x, N * 0.72 + Math.sin(x / N * Math.PI * 2) * 10); g.lineTo(N, N); g.fill();
              g.fillStyle = '#9fcf73'; g.beginPath(); g.moveTo(0, N); for (let x = 0; x <= N; x += 8) g.lineTo(x, N * 0.84 + Math.sin(x / N * Math.PI * 4 + 1) * 6); g.lineTo(N, N); g.fill();
              for (let k = 0; k < 3; k++) { const x = 30 + k * 85 + R() * 20, y = N * 0.62; g.fillStyle = '#8a6a45'; g.fillRect(x - 3, y, 6, 30); g.fillStyle = pick(['#6fbf73', '#8cc26a', '#5fae65'], R); g.beginPath(); g.arc(x, y - 6, 18, 0, 7); g.fill(); }
              for (let k = 0; k < 9; k++) { const x = R() * N, y = N * 0.8 + R() * N * 0.15; g.fillStyle = '#6aa04a'; g.fillRect(x - 1, y, 2, 10); g.fillStyle = pick(['#f26d7d', '#f2c230', '#f08a5d', '#b37fd6', '#ffffff'], R); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
              g.fillStyle = '#c68a4a'; g.beginPath(); g.arc(N * 0.72, N * 0.8, 11, 0, 7); g.fill(); g.beginPath(); g.arc(N * 0.72 - 9, N * 0.8 - 10, 5, 0, 7); g.arc(N * 0.72 + 9, N * 0.8 - 10, 5, 0, 7); g.fill();   // 곰
              g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(N * 0.9, N * 0.58, 12, 0, 7); g.fill(); }],
    kidsArt: [1.2, 256, false, (g, N, R) => { g.fillStyle = '#c9a877'; g.fillRect(0, 0, N, N);   // 코르크판 + 아이 그림(교실 옆벽·복도 액자)
              for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 6 + R()*8, y = j*85 + 6 + R()*8, w = 70, h = 72;
                g.fillStyle = pick(['#ffffff', '#fdf6e3', '#f3f8ff'], R); g.fillRect(x, y, w, h); g.lineWidth = 3;
                for (let k = 0; k < 4; k++) { g.strokeStyle = pick(['#e24b4b', '#3b6fb5', '#2f8f5b', '#f2a03a', '#8a5ad0'], R); g.beginPath(); const t = R();
                  if (t < 0.35) g.arc(x + 15 + R()*40, y + 15 + R()*40, 6 + R()*10, 0, 7);
                  else if (t < 0.7) { g.moveTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); }
                  else g.rect(x + 10 + R()*35, y + 30 + R()*25, 18, 14);
                  g.stroke(); }
                if (R() < 0.5) { g.fillStyle = '#f2c230'; g.beginPath(); g.arc(x + w - 14, y + 14, 8, 0, 7); g.fill(); } } }],
    film:   [1.2, 128, false, (g, N) => { const gr = g.createLinearGradient(0, 0, N, N); gr.addColorStop(0, '#3a665e'); gr.addColorStop(0.5, '#2c524b'); gr.addColorStop(1, '#264842'); g.fillStyle = gr; g.fillRect(0, 0, N, N); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, N * 0.15, N, N * 0.08); }],   // 도서관 복도창 짙은 초록 시트지(영상 W_202~207)
    blind:  [0.5, 64, false, (g, N) => { for (let y = 0; y < N; y += 8) { g.fillStyle = '#a87a4b'; g.fillRect(0, y, N, 6); g.fillStyle = '#7f5a34'; g.fillRect(0, y + 6, N, 2); } }],   // 나무 가로살 블라인드(영상 a_487~493)
    hop:    [3.0, 256, false, (g, N) => { g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, N, N);   // 사방치기(바닥 그림) — 둘레는 포장 색
              g.fillStyle = '#f2b8a0'; g.beginPath(); g.arc(N * 0.2, N * 0.3, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(N * 0.2, N * 0.3, 18, 0, 7); g.fill();
              g.strokeStyle = '#ffffff'; g.lineWidth = 5; const c = [[1, 5], [1, 4], [0, 3], [2, 3], [1, 2], [0, 1], [2, 1], [1, 0]];
              c.forEach(([i, j]) => g.strokeRect(N * 0.32 + i * 36, 16 + j * 38, 36, 38));
              g.fillStyle = '#f2a03a'; g.fillRect(N * 0.32 + 36 + 3, 16 + 5 * 38 + 3, 30, 32); g.fillStyle = '#9ad0e8'; g.fillRect(N * 0.32 + 3, 16 + 3 * 38 + 3, 30, 32); }],
    curtain: [0.5, 128, false, (g, N) => { for (let x = 0; x < N; x++) { const v = 0.5 + 0.5 * Math.cos(x / N * Math.PI * 2), c = (a, k) => Math.round(a + v * k);   // 회색 주름 커튼(세로 골 — 급식실 영상 k_00)
      g.fillStyle = `rgb(${c(150, 32)},${c(146, 30)},${c(142, 28)})`; g.fillRect(x, 0, 1, N); } }],
    woodW:  [1.2, 128, false, (g, N, R) => { for (let i = 0; i < 8; i++) { g.fillStyle = pick(['#4d3c32', '#54423a', '#47372e'], R); g.fillRect(i*16, 0, 16, N); g.globalAlpha = 0.18; g.fillStyle = '#2a1f19'; for (let k = 0; k < 4; k++) g.fillRect(i*16 + 2 + R()*12, 0, 1, N); g.globalAlpha = 1; } g.fillStyle = '#2f241e'; for (let i = 0; i <= 8; i++) g.fillRect(i*16 - 0.5, 0, 1, N); }],   // 현관·구령대 짙은 나무 판 세로결
  };
  const PAT = new Map();
  function patPush(kind, pts, uv, n, tint) {
    let P = PAT.get(kind); if (!P) { P = { pos: [], uv: [], col: [] }; PAT.set(kind, P); }
    const [a, b, c] = pts;
    const cx = (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]), cy = (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[0])*(c[2]-a[2]), cz = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
    const ord = (cx*n[0] + cy*n[1] + cz*n[2]) < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    _c.set(tint); if (!PATDEF[kind][2]) _c.multiplyScalar(n[1] > 0.5 ? 0.97 : n[1] < -0.5 ? 0.62 : 0.9);
    for (const i of ord) { P.pos.push(pts[i][0], pts[i][1], pts[i][2]); P.uv.push(uv[i][0], uv[i][1]); P.col.push(_c.r, _c.g, _c.b); }
  }
  // 바닥(위를 봄)·천장(down=true, 아래를 봄) 사각형
  function patQuad(kind, x0, x1, z0, z1, y, down = false, tint = 0xffffff) {
    const s = PATDEF[kind][0];
    patPush(kind, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [[x0/s, -z0/s], [x1/s, -z0/s], [x1/s, -z1/s], [x0/s, -z1/s]], [0, down ? -1 : 1, 0], tint);
  }
  // 벽 면 무늬 — ax='x': z=line 평면(a=x), ax='z': x=line 평면(a=z). face = 바라보는 쪽 부호
  function patWall(kind, ax, a0, a1, y0, y1, line, face, tint = 0xffffff) {
    const s = PATDEF[kind][0];
    const pts = ax === 'x' ? [[a0, y0, line], [a1, y0, line], [a1, y1, line], [a0, y1, line]] : [[line, y0, a0], [line, y0, a1], [line, y1, a1], [line, y1, a0]];
    patPush(kind, pts, [[a0/s, y0/s], [a1/s, y0/s], [a1/s, y1/s], [a0/s, y1/s]], ax === 'x' ? [0, 0, face] : [face, 0, 0], tint);
  }
  // 방 바닥(벽 안쪽 면 사이를 정확히 — 문턱은 wallRun이 채운다)
  const floorQ = (kind, x0, x1, z0, z1, y = 0, tint) => patQuad(kind, x0, x1, z0, z1, y + 0.012, false, tint);
  // 조명(표면 부착 LED) — 전부 한 메시(예전엔 등마다 메시 1개 = 드로우콜 1개씩이었다)
  const lampPos = [];
  let flagMesh = null;
  function lamp(w, h, d, cx, y, cz) { for (let i = 0; i < bpos.count; i++) lampPos.push(bpos.getX(i)*w + cx, bpos.getY(i)*h + y + h/2, bpos.getZ(i)*d + cz); }
  // 천장: 지붕 밑면 바로 아래(top-0.16) 무늬 사각형. 벽 안쪽 면에서 1cm 더 안쪽.
  // 카메라가 천장을 뚫고 올라가 천장 속이 보이지 않게 충돌 등록(사람 머리엔 닿지 않는 높이)
  const ceil = (x0, x1, z0, z1, top, kind = 'ctile') => {
    patQuad(kind, x0 + 0.16, x1 - 0.16, z0 + 0.16, z1 - 0.16, top - 0.16, true);
    colliders.push({ x0: x0 + 0.16, x1: x1 - 0.16, y0: top - 0.16, y1: top - 0.01, z0: z0 + 0.16, z1: z1 - 0.16 });
  };
  // 건물 기초(YARD → 0): 바깥벽 바깥 면까지(드러난 쪽만). 이웃 건물과는 맞댐만(겹치면 감사에 걸린다)
  const foundation = (x0, x1, z0, z1, top = 0) => addBox(x1 - x0, top - YARD, z1 - z0, FOUND, (x0 + x1) / 2, YARD, (z0 + z1) / 2);
  const doorC = r => r.span[0] + 1.9;

  // ================= 소품 도우미 (INTERIOR-1 · 09-24) =================
  // 화분(테두리 화분 + 둥근 잎). tall = 줄기 있는 관엽. s ≥ 0.8(테두리 3cm 규칙)
  function potPlant(x, y, z, s = 1, tall = false, pot = 0xc46a4a) {
    dBox(0.2*s, 0.18*s, 0.2*s, pot, x, y, z);
    dBox(0.24*s, 0.04*s, 0.24*s, pot, x, y + 0.18*s, z);
    const h = hash2(x, z), G = [0x4f8f47, 0x5fa052, 0x6aae5a][Math.floor(h * 3) % 3];
    if (tall) {   // 관엽(야자·고무나무류 — 영상 e_327~331): 가는 줄기 + 사방으로 휘어 뻗은 긴 잎(잎 = 납작 늘인 다면체)
      dCyl(0.015*s, 0.02*s, 0.42*s, 0x6d4e32, x, y + 0.22*s, z);
      const n = 7, top = y + 0.62*s;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + h * 3, tilt = 0.35 + ((i * 37) % 5) * 0.12, len = (0.36 + ((i * 53) % 4) * 0.05) * s;
        const m = new THREE.Matrix4().makeTranslation(x, top, z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationX(-tilt))
          .multiply(new THREE.Matrix4().makeTranslation(0, 0, len * 0.5)).multiply(new THREE.Matrix4().makeScale(0.07*s, 0.018*s, len * 0.5));
        dGeo(BLOB0, m, i % 2 ? 0x5fa052 : G, { jitter: 0.15 });
      }
      dBlob(0.06*s, 0.08*s, 0.06*s, 0x74b862, x, top + 0.04*s, z, { chunky: true });
    } else {       // 작은 화초: 잎 뭉치 둘
      dBlob(0.12*s, 0.1*s, 0.12*s, G, x, y + 0.28*s, z, { chunky: true, ry: h*7, jitter: 0.22 });
      dBlob(0.08*s, 0.07*s, 0.08*s, 0x7cbc68, x + 0.05*s, y + 0.34*s, z - 0.03*s, { chunky: true, ry: h*5 + 1, jitter: 0.22 });
    }
    if (s >= 1.2) colliders.push(noStand({ x0: x - 0.13*s, x1: x + 0.13*s, y0: y, y1: y + 0.22*s, z0: z - 0.13*s, z1: z + 0.13*s }));   // 바닥 화분은 몸이 뚫지 않게
  }
  // 소화기(빨간 통 + 검은 머리) — 올라서기 금지 충돌
  function extinguisher(x, y, z) {
    dCyl(0.09, 0.09, 0.48, 0xc4302b, x, y, z, { seg: 10 });
    dCyl(0.045, 0.065, 0.09, 0x2a2a2a, x, y + 0.48, z, { seg: 8 });
    colliders.push(noStand({ x0: x - 0.12, x1: x + 0.12, y0: y, y1: y + 0.6, z0: z - 0.12, z1: z + 0.12 }));
  }
  // 큰 화분 나무(로비·세로복도 — 영상 c_350~353 벽돌 벽 앞 화분 셋)
  function bigPot(x, y, z) {
    dCyl(0.26, 0.2, 0.42, 0xe9e6de, x, y, z, { seg: 12 });
    dCyl(0.03, 0.04, 0.9, 0x6d4e32, x, y + 0.42, z, { seg: 6 });
    [[0, 1.45, 0, 0.42], [0.18, 1.15, 0.1, 0.3], [-0.16, 1.25, -0.1, 0.3], [0.05, 1.75, -0.05, 0.3]].forEach(([ox, oy, oz, r]) =>
      dBlob(r, r * 0.55, r, 0x3f7a3f, x + ox, y + oy, z + oz, { chunky: true, ry: ox * 9, jitter: 0.18 }));
    colliders.push(noStand({ x0: x - 0.26, x1: x + 0.26, y0: y, y1: y + 0.45, z0: z - 0.26, z1: z + 0.26 }));
  }
  // 유리 진열장(영상 e_326~338): 나무 받침·틀 + 앞 유리 + 안에 트로피·상장, 위에 작은 화분 줄
  //   ax = 늘어선 축, [a0,a1] 구간, wall = 붙은 벽 면 좌표, f = 방 안쪽 부호. 깊이 0.55·높이 0.95
  function displayCase(ax, a0, a1, wall, f, plants = true) {
    const D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: 0, y1: H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: 0, y1: H, z0: a0, z1: a1 }));
    at(L, 0.2, D, 0x8a6a45, c, 0, D/2);
    at(L, 0.05, D, 0xa07c52, c, H - 0.05, D/2);
    [a0 + 0.03, a1 - 0.03].forEach(e => at(0.06, H - 0.25, D, 0xa07c52, e, 0.2, D/2));
    { const gw = L - 0.12, gh = H - 0.25, off = D - 0.03, gx = ax === 'x' ? c : wall + f*off, gz = ax === 'x' ? wall + f*off : c;   // 앞 유리(렌더만)
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*(ax === 'x' ? gw : 0.02) + gx, bpos.getY(i)*gh + 0.2 + gh/2, bpos.getZ(i)*(ax === 'x' ? 0.02 : gw) + gz); }
    for (let a = a0 + 0.32; a < a1 - 0.25; a += 0.46) {                 // 트로피(금색 컵)·상장(세운 액자)
      const k = hash2(a, wall), tx = ax === 'x' ? a : wall + f*0.3, tz = ax === 'x' ? wall + f*0.3 : a;
      if (k < 0.5) { dCyl(0.05, 0.05, 0.05, 0xb8912e, tx, 0.2, tz, { seg: 8 }); dCyl(0.012, 0.012, 0.12, 0xc9a13a, tx, 0.25, tz, { seg: 6 }); dCyl(0.09, 0.04, 0.12, 0xe0b848, tx, 0.37, tz, { seg: 10 }); }
      else at(0.28, 0.22, 0.03, k < 0.75 ? 0xf3ead2 : 0xdfe8f2, a, 0.2, 0.22);
    }
    if (plants) for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.34) {
      const px = ax === 'x' ? a : wall + f*0.27, pz = ax === 'x' ? wall + f*0.27 : a;
      potPlant(px, H, pz, 0.8 + hash2(a, 1)*0.3, hash2(a, 2) > 0.8, hash2(a, 3) > 0.7 ? 0xd9d6ce : 0xc46a4a);
    }
  }
  // 나무 신발장·사물함(영상 e_316~331): 몸통 + 칸문(3cm 튀어나옴) + 손잡이. top = 상판 색(없으면 null)
  //   flat = 긴 줄(복도·교실 뒤): 칸문을 상자 대신 무늬 한 장(lockD)으로 — 칸문 상자 수백 개(삼각형 1만6천)를 사각형 둘로
  function lockerBank(ax, a0, a1, wall, f, H, rows, top = null, body = 0x8a5530, door = 0xa66a3a, flat = false, yb = 0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 }));
    at(L, H, D, body, c, 0, D/2);
    const n = Math.max(1, Math.round(L / 0.32)), cw = L / n, rh = (H - 0.1) / rows;
    if (flat) {
      const fz = wall + f * (D + 0.005), y0 = yb + 0.08, y1 = yb + 0.08 + rh * rows;
      const pts = ax === 'x' ? [[a0, y0, fz], [a1, y0, fz], [a1, y1, fz], [a0, y1, fz]] : [[fz, y0, a0], [fz, y0, a1], [fz, y1, a1], [fz, y1, a0]];
      patPush('lockD', pts, [[0, 0], [n, 0], [n, rows], [0, rows]], ax === 'x' ? [0, 0, f] : [f, 0, 0], door);
      if (top) at(L + 0.04, 0.03, D + 0.04, top, c, H, D/2);
      return;
    }
    for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) {
      const ca = a0 + cw * (i + 0.5), y = 0.08 + rh * r;
      at(cw - 0.035, rh - 0.035, 0.03, door, ca, y + 0.0175, D + 0.015);
      at(0.03, 0.07, 0.03, 0x2f2f33, ca + cw * 0.28, y + rh * 0.45, D + 0.045);
    }
    if (top) at(L + 0.04, 0.03, D + 0.04, top, c, H, D/2);
  }
  // 악기 칸(사용자 09-24 "좌우 악기 놓는 칸"): 뒤판·옆판·칸 판 3단 + 작은 북·실로폰·탬버린
  function instrumentShelf(ax, a0, a1, wall, f, H = 1.8) {
    const D = 0.4, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: 0, y1: H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: 0, y1: H, z0: a0, z1: a1 }));
    [a0 + 0.02, a1 - 0.02].forEach(e => at(0.04, H, D, 0xa9855a, e, 0, D/2));
    at(L - 0.08, H, 0.03, 0x8a6a45, c, 0, 0.015);
    [0, 0.6, 1.2, H - 0.04].forEach(y => at(L - 0.08, 0.04, D - 0.03, 0xa9855a, c, y, D/2 + 0.015));
    const n = Math.max(1, Math.floor((L - 0.1) / 0.45));
    for (let k = 0; k < n; k++) for (let r = 0; r < 3; r++) {
      const a = a0 + 0.28 + k * 0.45, y = r * 0.6 + 0.04, px = ax === 'x' ? a : wall + f*0.22, pz = ax === 'x' ? wall + f*0.22 : a, t = (k + r * 2) % 3;
      if (t === 0) dCyl(0.14, 0.14, 0.22, [0xd94848, 0x3f6fb0, 0xf2c230][r], px, y, pz, { seg: 10 });
      else if (t === 1) for (let b = 0; b < 5; b++) at(0.05, 0.03, 0.26 - b * 0.03, [0xe24b4b, 0xf2a03a, 0xf2d23a, 0x6cc070, 0x5b8fc9][b], a - 0.13 + b * 0.065, y, 0.22);
      else dCyl(0.12, 0.12, 0.05, 0xe8d6a8, px, y, pz, { seg: 12 });
    }
  }
  // 스테인리스 난간(영상 u_288~299): 둥근 손잡이 + 기둥 + 고리 살. yA→yB로 기울면 계단 난간.
  //   충돌 = 보이지 않는 벽(0.3m 토막·높이 1.6 — 점프로 올라서지 못하게·카메라 무시)
  function steelRail(x0, z0, x1, z1, yA, yB = yA, h = 0.95) {
    const S = 0xcdd2d6, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.9));
    const P = t => [x0 + (x1 - x0)*t, yA + (yB - yA)*t, z0 + (z1 - z0)*t];
    const a = P(0), b = P(1);
    dRod(a[0], a[1] + h, a[2], b[0], b[1] + h, b[2], 0.03, S);
    dRod(a[0], a[1] + 0.12, a[2], b[0], b[1] + 0.12, b[2], 0.015, S);
    for (let i = 0; i <= n; i++) { const p = P(i / n); dRod(p[0], p[1], p[2], p[0], p[1] + h, p[2], 0.028, S); }
    for (let i = 0; i < n * 4; i++) { const p = P((i + 0.5) / (n * 4)); dRod(p[0], p[1] + 0.12, p[2], p[0], p[1] + h - 0.1, p[2], 0.012, S); }
    const m = Math.max(1, Math.round(L / 0.3));
    for (let i = 0; i < m; i++) { const p = P(i / m), q = P((i + 1) / m);
      colliders.push({ x0: Math.min(p[0], q[0]) - 0.05, x1: Math.max(p[0], q[0]) + 0.05, y0: Math.min(p[1], q[1]), y1: Math.max(p[1], q[1]) + 1.6, z0: Math.min(p[2], q[2]) - 0.05, z1: Math.max(p[2], q[2]) + 0.05, nc: true }); }
  }
  // 초록 게시판(사진·안내문) — 벽 면에 붙은 판(4cm) + 무늬판(7mm 앞)
  function greenBoard(ax, a0, a1, wall, f, y0 = 1.15, y1 = 2.35, kind = 'photoB') {
    ax === 'x' ? dBox(a1 - a0, y1 - y0, 0.04, 0x2f6e4f, (a0 + a1)/2, y0, wall + f*0.02) : dBox(0.04, y1 - y0, a1 - a0, 0x2f6e4f, wall + f*0.02, y0, (a0 + a1)/2);
    patWall(kind, ax, a0 + 0.05, a1 - 0.05, y0 + 0.05, y1 - 0.05, wall + f*0.047, f);
  }
  // ================= 교실 내부 (CLASS-2 · 09-24 영상 a_424~433 = 4학년·a_487~495 = 3학년·s_388~408 = 과학실·c_465 = 컴퓨터실) =================
  const CLS_WALL = 0xfaf8f2, CLS_WALL_E = 0xfbfbf8, LIME = 0x8dc63f;   // 교실 벽 = 흰색·크림(영상 a_429·a_433.5 — 회베이지 INNER 아님) · 동관 연두 포인트
  const artPaper = bg => (g, N, R) => { g.fillStyle = bg; g.fillRect(0, 0, N, N);   // 게시판 바탕 + 아이 그림 종이(kidsArt와 같은 그림)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = i*85 + 6 + R()*8, y = j*85 + 6 + R()*8, w = 70, h = 72;
      g.fillStyle = pick(['#ffffff', '#fdf6e3', '#f3f8ff'], R); g.fillRect(x, y, w, h); g.lineWidth = 3;
      for (let k = 0; k < 4; k++) { g.strokeStyle = pick(['#e24b4b', '#3b6fb5', '#2f8f5b', '#f2a03a', '#8a5ad0'], R); g.beginPath(); const t = R();
        if (t < 0.35) g.arc(x + 15 + R()*40, y + 15 + R()*40, 6 + R()*10, 0, 7);
        else if (t < 0.7) { g.moveTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); g.lineTo(x + 8 + R()*50, y + 10 + R()*50); }
        else g.rect(x + 10 + R()*35, y + 30 + R()*25, 18, 14);
        g.stroke(); } } };
  Object.assign(PATDEF, {
    // 흰 사물함 칸문(영상 a_429·a_492: 흰 문 + 옅은 회색 틈 + 회색 손잡이) — lockD(짙은 3px 테·검은 손잡이)는 멀리서 회색 격자판으로 보였다
    lockW:  [1.0, 64, false, (g, N) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N); g.fillStyle = '#c9c6be'; g.fillRect(0, 0, N, 2); g.fillRect(0, 0, 2, N);
              g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(2, N - 3, N - 2, 2); g.fillRect(N - 3, 2, 2, N - 2);
              g.fillStyle = '#8c9096'; g.fillRect(N - 14, N/2 - 8, 5, 16); g.fillStyle = '#d8d4ca'; g.fillRect(N/2 - 11, 7, 22, 9); g.fillStyle = '#ffffff'; g.fillRect(N/2 - 10, 8, 20, 7); }],
    kidsArtG: [1.2, 256, false, artPaper('#aeb1b6')],   // 4학년 뒤 게시판 = 회색 펠트(영상 a_429·a_430.5)
    kidsArtC: [1.2, 256, false, artPaper('#efe6c8')],   // 3학년 뒤 게시판 = 크림(영상 a_492)
    film2:  [0.6, 128, false, (g, N) => { g.fillStyle = '#e4eaec'; g.fillRect(0, 0, N, N); g.fillStyle = '#fbfcfc'; for (let k = 0; k < N; k += N/8) { g.fillRect(k, 0, 3, N); g.fillRect(0, k, N, 3); } }],   // 교실 복도창 아랫칸 격자 시트(영상 a_466.5·a_480)
  });
  // 흰 붙박이 사물함·수납장(lockerBank flat과 같은 모양 + lockW 무늬). cw = 칸 폭. 윗판은 앞으로만 2cm 내밈(옆 가구와 끝면이 겹치지 않게)
  function whiteLockers(ax, a0, a1, wall, f, H, rows, top, body, door, yb = 0, cw = 0.32) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 }));
    at(L, H, D, body, c, 0, D/2);
    const n = Math.max(1, Math.round(L / cw)), rh = (H - 0.1) / rows;
    const fz = wall + f * (D + 0.005), y0 = yb + 0.08, y1 = yb + 0.08 + rh * rows;
    const pts = ax === 'x' ? [[a0, y0, fz], [a1, y0, fz], [a1, y1, fz], [a0, y1, fz]] : [[fz, y0, a0], [fz, y0, a1], [fz, y1, a1], [fz, y1, a0]];
    patPush('lockW', pts, [[0, 0], [n, 0], [n, rows], [0, rows]], ax === 'x' ? [0, 0, f] : [f, 0, 0], door);
    if (top) at(L, 0.03, D + 0.02, top, c, H, D/2 + 0.01);
  }
  // 바닥~H 통문 두 짝 흰 장(영상 a_429·a_430.5·a_492 — lockerBank는 칸 격자로 나눠서 따로 짓는다)
  function tallCab(ax, a0, a1, wall, f, H, yb = 0, body = 0xf2f0ea, door = 0xf7f5f0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 }));
    at(L, H, D, body, c, 0, D/2);
    [-1, 1].forEach(s => { at(L/2 - 0.03, H - 0.13, 0.03, door, c + s * L/4, 0.08, D + 0.015); at(0.03, 0.2, 0.03, 0x9aa0a6, c + s * 0.06, H * 0.45, D + 0.045); });
  }
  // 열린 칸 선반(4학년 뒤벽 가운데 — 영상 a_430.5): 옆판·칸 판 + 책 덩어리
  function openShelf(ax, a0, a1, wall, f, H, yb = 0) {
    const D = 0.45, L = a1 - a0, c = (a0 + a1) / 2;
    const at = (w, h, d, hex, ca, y, off) => ax === 'x' ? dBox(w, h, d, hex, ca, y + yb, wall + f*off) : dBox(d, h, w, hex, wall + f*off, y + yb, ca);
    const lo = Math.min(wall, wall + f*D), hi = Math.max(wall, wall + f*D);
    colliders.push(noStand(ax === 'x' ? { x0: a0, x1: a1, y0: yb, y1: yb + H, z0: lo, z1: hi } : { x0: lo, x1: hi, y0: yb, y1: yb + H, z0: a0, z1: a1 }));
    [a0 + 0.015, a1 - 0.015].forEach(e => at(0.03, H, D, 0xf2efe8, e, 0, D/2));
    [0, H/2 - 0.015, H - 0.03].forEach(y => at(L - 0.06, 0.03, D, 0xf2efe8, c, y, D/2));
    [0.03, H/2 + 0.015].forEach((y, k) => { let a = a0 + 0.06; for (let i = 0; a < a1 - 0.2; i++) { const w9 = 0.12 + hash2(a, y) * 0.14;
      at(w9, 0.2 + hash2(y, a) * 0.1, 0.24, BOOK[(i * 3 + k * 5) % BOOK.length], a + w9 / 2, y, 0.2); a += w9 + 0.03; } });
  }
  // 테 있는 게시판(greenBoard와 같은 틀 + 테 색만 다르게)
  function frameBoard(ax, a0, a1, wall, f, y0, y1, frame, kind) {
    ax === 'x' ? dBox(a1 - a0, y1 - y0, 0.04, frame, (a0 + a1)/2, y0, wall + f*0.02) : dBox(0.04, y1 - y0, a1 - a0, frame, wall + f*0.02, y0, (a0 + a1)/2);
    patWall(kind, ax, a0 + 0.05, a1 - 0.05, y0 + 0.05, y1 - 0.05, wall + f*0.047, f);
  }
  // 천장 4방향 카세트 에어컨(영상 a_429·a_490.5·a_492·s_393 — 급식실 것과 같은 짜임) · yTop = 천장 면
  function acUnit(x, yTop, z) {
    dBox(0.9, 0.05, 0.9, 0xf2f3f4, x, yTop - 0.05, z);
    dBox(0.5, 0.03, 0.5, 0x8a9096, x, yTop - 0.08, z);
    [-1, 1].forEach(s => { dBox(0.55, 0.03, 0.06, 0x5a5e64, x, yTop - 0.08, z + s * 0.34); dBox(0.06, 0.03, 0.55, 0x5a5e64, x + s * 0.34, yTop - 0.08, z); });
  }
  // 창 사이 기둥 벽걸이 선풍기(영상 a_427.5·a_429 = 4학년 흰 틀, a_490.5 = 3학년 흰 비닐 덮개). (x, zw) = 창 벽 안쪽 면, n = 방 안쪽 z 부호
  function wallFan(x, zw, n, y, cover) {
    dBox(0.1, 0.14, 0.1, 0xf2f3f4, x, y - 0.07, zw + n * 0.05);                                            // 벽 받침
    dCyl(0.03, 0.03, 0.12, 0xe6e7e8, x, y, zw + n * 0.1, { rot: [n * Math.PI / 2, 0, 0], seg: 6 });        // 목
    dBlob(0.08, 0.08, 0.07, cover ?? 0xf2f3f4, x, y, zw + n * 0.24, { chunky: true });                     // 모터
    dCyl(0.22, 0.22, 0.07, cover ?? 0xf4f5f6, x, y, zw + n * 0.3, { rot: [n * (Math.PI / 2 + 0.25), 0, 0], seg: 12 });   // 날개 망(살짝 아래를 봄)
  }
  // 교실 복도 쪽 실내창(영상 a_466.5·a_480·a_493.5·W_211): 앞문~뒷문 사이 두 짝 + 가운데 기둥 1.0(복도 액자 자리). 창턱 = 징두리 윗선 1.1
  function corWinsOf(r) {
    const W9 = r.span[1] - r.span[0], hw = (W9 - 6.4) / 2, cx9 = (r.span[0] + r.span[1]) / 2;
    if (hw < 0.6) return [];
    const fr = (r.name === '유치원' || r.name === '사랑반') ? 0xeeeeea : 0x7a5a3e;   // 유치원·사랑반 = 흰 틀(W_203·W_211)
    return [-1, 1].map(s => ({ c: cx9 + s * (0.5 + hw / 2), w: hw, sill: 1.1, dh: 2.8, win: true, frame: fr }));
  }
  function corWins() { return FR.rooms.filter(r => ['classroom', 'computer', 'daycare'].includes(r.type) && r.span[0] >= B.westLobby.x[0] - 0.01).flatMap(corWinsOf); }
  // 교실 팻말(영상 a_421.5 '4 1'·a_478.5 '3 1'·a_379.5 '과학실'): 크림 아크릴 판(윗변 가운데 둥글게 솟음) + 왼쪽 사선 색 띠(흰 학년 숫자) + 둥근 초록 로고 + 짙은 글자
  const CLS_BAND = { 1: '#7a2f5a', 2: '#c8702c', 3: '#1f6272', 4: '#3f7f36' };
  function classSignCanvas(label) {
    const gm = /^(\d)학년$/.exec(label), grade = gm && gm[1], c = document.createElement('canvas');
    const g0 = c.getContext('2d'); g0.font = '900 60px sans-serif';
    c.width = grade ? 300 : Math.ceil(g0.measureText(label).width) + 150; c.height = 128;
    const g = c.getContext('2d'), Wc = c.width;
    const plate = () => { g.beginPath(); g.roundRect(4, 28, Wc - 8, 96, 16); g.moveTo(Wc/2 + 30, 30); g.arc(Wc/2, 34, 30, 0, Math.PI, true); };
    g.fillStyle = '#f3efe2'; plate(); g.fill();
    g.save(); plate(); g.clip();
    g.fillStyle = grade ? (CLS_BAND[grade] || '#2f5f9a') : '#2f7f86';
    const bw = grade ? 104 : 40; g.beginPath(); g.moveTo(0, 0); g.lineTo(bw + 26, 0); g.lineTo(bw - 18, 128); g.lineTo(0, 128); g.fill();
    g.restore();
    g.strokeStyle = '#d8d0b8'; g.lineWidth = 3; plate(); g.stroke();
    const lx = grade ? Wc/2 : 82;   // 둥근 로고(초록 고리 + 잎)
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(lx, 76, 25, 0, 7); g.fill();
    g.strokeStyle = '#3f8f4a'; g.lineWidth = 6; g.beginPath(); g.arc(lx, 76, 20, 0.3, 5.6); g.stroke();
    g.fillStyle = '#6cb34a'; g.beginPath(); g.ellipse(lx + 3, 72, 9, 5, -0.6, 0, 7); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (grade) { g.font = '900 66px sans-serif'; g.fillStyle = '#ffffff'; g.fillText(grade, 48, 80); g.fillStyle = '#2a2f3a'; g.fillText('1', Wc - 62, 80); }
    else { g.font = '900 60px sans-serif'; g.fillStyle = '#1f2a44'; g.textAlign = 'left'; g.fillText(label, 118, 80); }
    return c;
  }
  // 복도 쪽으로 튀어나온 교실 팻말(hangSign과 같은 자리·방향 — 글자판만 교실 판)
  function classSign(label, x, y, zWall, dir) {
    const key = '\u0002CLS|' + label;
    if (!signCanvas.has(key)) signCanvas.set(key, classSignCanvas(label));
    const s9 = sign(key, x, y, zWall, Math.PI / 2, 0.36);
    s9.m.position.z = zWall + dir * (s9.w / 2 + 0.17); s9.m.updateMatrix();
  }
  // 4학년 대각선 코너 TV장(영상 a_424.5·a_426·a_427.5: 서벽·남벽 모서리를 45°로 가로지름 — 연두 키큰문 | 흰 하부장·열린 칸·TV | 연두 키큰문, 위 흰 머리판)
  function tvCorner(xw, zw, dz, y0) {
    const Wp = [xw, zw - dz * 1.75], Sp = [xw + 1.7, zw], L = Math.hypot(Sp[0] - Wp[0], Sp[1] - Wp[1]);
    const u = [(Sp[0] - Wp[0]) / L, (Sp[1] - Wp[1]) / L], n = [dz * u[1], -dz * u[0]], th = Math.atan2(-u[1], u[0]), H = 2.6;
    const shp = new THREE.Shape([new THREE.Vector2(xw, -zw), new THREE.Vector2(Wp[0], -Wp[1]), new THREE.Vector2(Sp[0], -Sp[1])]);   // 모서리 세모 기둥(shape y = -z)
    const pg = new THREE.ExtrudeGeometry(shp, { depth: H, bevelEnabled: false }); pg.rotateX(-Math.PI / 2);
    dGeo(pg, new THREE.Matrix4().makeTranslation(0, y0, 0), 0xf2f0ea); pg.dispose();
    const rb = (t0, t1, ya, yb, off, thk, hex) => { const t = (t0 + t1) / 2, o = off + thk / 2;   // 앞면에 붙는 판(앞면에서 off만큼 앞)
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(Wp[0] + u[0] * t + n[0] * o, y0 + (ya + yb) / 2, Wp[1] + u[1] * t + n[1] * o), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, th, 0)), new THREE.Vector3(t1 - t0, yb - ya, thk)), hex); };
    const G = LIME;
    rb(0.03, 0.5, 0.02, 2.05, 0.004, 0.02, G); rb(L - 0.5, L - 0.03, 0.02, 2.05, 0.004, 0.02, G);   // 양옆 연두 키큰문
    rb(0.56, L - 0.56, 0.06, 0.92, 0.004, 0.02, 0xf7f6f2);                                          // 가운데 흰 하부장 문
    rb(0.56, L - 0.56, 0.97, 1.17, 0.004, 0.02, 0x7d7a74);                                          // 열린 칸(그늘)
    rb(0.62, L - 0.62, 1.2, 2.0, 0.004, 0.05, 0x1e1f22); rb(0.66, L - 0.66, 1.24, 1.96, 0.054, 0.02, 0x2a3a4a);   // TV + 화면
    rb(0.03, L - 0.03, 2.06, 2.09, 0.004, 0.02, G); rb(0.03, L - 0.03, 2.55, 2.58, 0.004, 0.02, G);   // 머리판 위아래 연두 테
    [[0, 0.6, 0, 1.13], [0.6, 1.15, 0, 0.57], [0, 0.3, 1.13, 1.44]].forEach(([a, b, p, q]) => {    // 충돌 = 앞면을 넘지 않는 계단 상자
      const z0 = zw - dz * p, z1 = zw - dz * q;
      colliders.push(noStand({ x0: xw + a, x1: xw + b, y0, y1: y0 + H, z0: Math.min(z0, z1), z1: Math.max(z0, z1) })); });
  }
  // 교실(서향 — 사용자 09-24 "우리는 다 보건실 쪽 방향을 보고 있어" · 영상 a_487~493 복도에서 들어가면 오른쪽 = 칠판):
  //   서벽 = 흰 칠판(알루미늄 테) + 아래 낮은 흰 붙박이장 + 위 태극기 액자 · 앞 창가 = 회색 교사 책상(모니터)·주황 의자 + 천장에 매단 TV + 공기청정기
  //   동벽(뒤) = 흰 사물함 + 게시판 + 시계 · 창 아래 = 낮은 흰 수납장. 아이들 책상은 옆으로 붙여 서쪽을 본다.
  //   xw·xe = 서·동벽 안쪽 면, zc = 복도(문) 쪽 벽 안쪽 면, zw = 창 쪽 벽 안쪽 면. opt.backGap = 동벽 문 자리[z0, z1](나래반→문서고)
  //   opt.style = 'g4'(4학년: 코너 TV장·연두 포인트·회색 게시판) | 'g3'(3학년: 북끝 키 큰 장·크림 게시판·보조 탁자) · opt.ceilH = 천장 면(바닥 기준) · opt.computer = 컴퓨터실 책상
  function westClass(name, xw, xe, zc, zw, y0, opt = {}) {
    const dz = Math.sign(zw - zc), zm = (zc + zw) / 2, depth = Math.abs(zw - zc), W = xe - xw, top = opt.top ?? 0xcdb28a;
    const st = opt.style || '', ceilY = y0 + (opt.ceilH ?? 2.9);
    // [classrooms-7] 칠판(영상 a_487.5·a_426): 북끝 zc+1.35부터 · 아래 낮은 흰 붙박이장 줄 · 태극기(3학년 = 칠판 남쪽 1/3 위, a_489)
    const bw = Math.min(4.0, depth - 3.2), zb = zc + dz * (1.35 + bw / 2);
    dBox(0.04, 1.32, bw + 0.12, 0xaeb4ba, xw + 0.02, y0 + 0.9, zb);                  // 알루미늄 테
    dBox(0.03, 1.2, bw, 0xf3f5f4, xw + 0.055, y0 + 0.96, zb);                         // 흰 칠판
    dBox(0.09, 0.03, bw, 0xaeb4ba, xw + 0.085, y0 + 0.9, zb);                         // 마커 받침
    whiteLockers('z', zb - bw / 2, zb + bw / 2, xw, 1, 0.85, 1, 0xe6e4dc, 0xf2efe8, 0xf7f5f0, y0, 0.5);
    const fz = zb + dz * (st === 'g3' ? 0.7 : 0);
    dBox(0.03, 0.5, 0.72, 0x5a4632, xw + 0.015, y0 + 2.3, fz);                        // 태극기 액자 틀(칠판 테 위 — 감사: 칠판 테 윗끝 2.22와 안 겹치게)
    sign(FLAG_KEY, xw + 0.042, y0 + 2.55, fz, Math.PI / 2, 0.4);
    hotspots.push({ kind: 'board', x: xw + 1.4, z: zb, y: y0, r: 2.0, label: '칠판에 낙서하기', bx: xw + 0.08, by: y0 + 1.56, bz: zb, ry: Math.PI / 2 });
    if (st === 'g4') {   // [classrooms-9] 4학년 연두: 칠판 밑장 서랍 띠·걸레받이 · 칠판 벽 윗선·남끝 세로선(a_426)
      dBox(0.03, 0.13, bw - 0.02, LIME, xw + 0.465, y0 + 0.66, zb); dBox(0.03, 0.07, bw - 0.02, LIME, xw + 0.465, y0 + 0.005, zb);
      dBox(0.03, 0.03, Math.abs(zw - dz * 1.8 - zc) - 0.04, LIME, xw + 0.015, ceilY - 0.07, (zc + zw - dz * 1.8) / 2);
      dBox(0.03, ceilY - 0.07 - y0 - 0.9, 0.03, LIME, xw + 0.015, y0 + 0.9, zb + dz * (bw / 2 + 0.1));
    }
    if (st === 'g3') tallCab('z', Math.min(zc + dz * 0.02, zc + dz * 1.28), Math.max(zc + dz * 0.02, zc + dz * 1.28), xw, 1, 2.4, y0);   // [classrooms-7] 3학년 칠판 북끝 키 큰 흰 장(a_487.5)
    // TV: 4학년 = 코너 TV장([classrooms-8]) · 나머지 = 앞 창가 천장에 매단 TV(a_490.5) + 머리 부딪힘 충돌([classrooms-22])
    if (st === 'g4') tvCorner(xw, zw, dz, y0);
    else { const tz = zw - dz * 1.3, tx = xw + 0.9;
      dBox(0.07, 0.85, 1.5, 0x1e1f22, tx, y0 + 1.7, tz); dBox(0.03, 0.77, 1.4, 0x2a3a4a, tx + 0.05, y0 + 1.74, tz);
      dRod(tx, y0 + 2.55, tz, tx, ceilY, tz, 0.025, 0x9aa0a6);
      colliders.push({ x0: tx - 0.06, x1: tx + 0.07, y0: y0 + 1.65, y1: ceilY, z0: tz - 0.77, z1: tz + 0.77, nc: true }); }
    // [classrooms-14] 교사 자리: 회색 철제 책상 + 모니터 · 주황 메시 의자 · 창가 흰 공기청정기(교사 의자 동쪽 — a_490.5·a_427.5)
    const tdz = zw - dz * (st === 'g4' ? 1.45 : 1.3);
    teacherDesk(xw + 1.3, y0, tdz, 1); chair(xw + 0.72, y0, st === 'g4' ? zw - dz * 1.6 : tdz, -1, 0xd9643a, 1);
    if (!opt.computer) { const px = xw + (st === 'g4' ? 2.45 : 1.88);   // 4학년은 코너 TV장 옆 창가(a_426)
      addBox(0.5, 1.5, 0.4, 0xf2f3f4, px, y0, zw - dz * 0.75, NS); dBox(0.3, 0.03, 0.25, 0xa9aeb3, px, y0 + 1.5, zw - dz * 0.75); }
    if (st === 'g3') {   // 3학년 흰 천 덮은 보조 탁자(교사 책상 북쪽 L자) + 나무 스툴(a_487.5·a_490.5)
      const sz = zw - dz * 2.25;
      dBox(1.2, 0.72, 0.6, 0xf4f4f0, xw + 1.5, y0, sz); colliders.push(noStand({ x0: xw + 0.9, x1: xw + 2.1, y0, y1: y0 + 0.72, z0: sz - 0.3, z1: sz + 0.3 }));
      dCyl(0.16, 0.16, 0.45, 0xc9a06a, xw + 1.1, y0, zw - dz * 2.85, { seg: 10 }); colliders.push(noStand({ x0: xw + 0.94, x1: xw + 1.26, y0, y1: y0 + 0.45, z0: zw - dz * 2.85 - 0.16, z1: zw - dz * 2.85 + 0.16 }));
    }
    // 창 아래 낮은 흰 수납장(4학년은 코너 TV장 옆부터)
    whiteLockers('x', xw + (st === 'g4' ? 1.75 : 0.3), xe - 0.6, zw, -dz, opt.sill ? opt.sill - 0.15 : 0.8, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
    // [classrooms-11] 뒤(동벽): 4학년 = 양끝 키 큰 장 + 칸 사물함·가운데 열린 칸 + 회색 게시판, 연두 테 한 덩어리(a_429·a_430.5)
    //   3학년 = 북끝 키 큰 장 + 흰 사물함 2단 + 크림 게시판·밝은 나무 테(a_492) · 나머지 = 흰 사물함 + 아이 그림 게시판
    const za = Math.min(zc + dz * 0.3, zw - dz * 0.6), zb2 = Math.max(zc + dz * 0.3, zw - dz * 0.6);
    let ck = zm;
    if (st === 'g4') {
      tallCab('z', za, za + 0.9, xe, -1, 2.3, y0); tallCab('z', zb2 - 0.9, zb2, xe, -1, 2.3, y0);
      const s1 = za + 3.6, s2 = za + 4.6;
      whiteLockers('z', za + 0.9, s1, xe, -1, 1.0, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0); openShelf('z', s1, s2, xe, -1, 1.0, y0);
      whiteLockers('z', s2, zb2 - 0.9, xe, -1, 1.0, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
      frameBoard('z', za + 0.9, zb2 - 0.9, xe, -1, y0 + 1.05, y0 + 2.3, 0xd6d8d6, 'kidsArtG');
      dBox(0.03, 2.36, 0.06, LIME, xe - 0.015, y0, za - 0.03); dBox(0.03, 2.36, 0.06, LIME, xe - 0.015, y0, zb2 + 0.03);   // 연두 테(장 둘 + 게시판 + 사물함 한 덩어리)
      dBox(0.03, 0.06, zb2 - za, LIME, xe - 0.015, y0 + 2.3, (za + zb2) / 2);
      dBox(0.04, 0.07, zb2 - za - 0.02, LIME, xe - 0.47, y0 + 0.005, (za + zb2) / 2);                                        // 연두 걸레받이
    } else if (st === 'g3') {
      tallCab('z', za, za + 0.9, xe, -1, 2.1, y0);
      whiteLockers('z', za + 0.9, zb2, xe, -1, 1.3, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
      frameBoard('z', za + 1.1, zb2 - 0.2, xe, -1, y0 + 1.5, y0 + 2.4, 0xbfa27a, 'kidsArtC');
    } else {
      const segs = opt.backGap ? [[za, opt.backGap[0]], [opt.backGap[1], zb2]] : [[za, zb2]];
      segs.forEach(([u, v]) => { if (v - u < 0.6) return; whiteLockers('z', u, v, xe, -1, 1.3, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, y0);
        if (v - u > 1.4) greenBoard('z', u + 0.2, v - 0.2, xe, -1, y0 + 1.5, y0 + 2.4, 'kidsArt'); });
      if (opt.backGap) ck = (segs[1][0] + segs[1][1]) / 2;
    }
    dCyl(0.17, 0.17, 0.04, 0xf5f3ec, xe - 0.02, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 16 });
    dCyl(0.02, 0.02, 0.05, 0x2a2a2a, xe - 0.045, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 6 });
    const seats = [];
    if (opt.computer) {   // [classrooms-6] 컴퓨터실(영상 c_465.2~465.8 열린 문 틈): 나무 수납장 몸통 + 짙은 회색 상판 긴 책상 줄(서향) · 모니터·키보드
      // [integ 09-24] 줄 간격 1.7 → 2.0: 의자 등 ~ 다음 줄 책상 통로 0.6 → 0.9(몸 0.52 + 길격자 0.3 한 칸 — 가운데 자리 '앉기' 6곳이 닿는 칸 없음이던 것)
      for (let r = 0; r < 3 && xw + 2.4 + r * 2.0 < xe - 1.8; r++) for (const s of [-1, 1]) {
        const x = xw + 2.4 + r * 2.0, z = zm + s * 1.6;
        colliders.push(noStand({ x0: x - 0.35, x1: x + 0.35, y0, y1: y0 + 0.76, z0: z - 1.2, z1: z + 1.2 }));
        dBox(0.66, 0.72, 2.36, 0x9a744e, x, y0, z); dBox(0.7, 0.04, 2.4, 0x3c3d42, x, y0 + 0.72, z);
        [-0.6, 0, 0.6].forEach(o => dBox(0.03, 0.6, 0.03, 0x6e5238, x + 0.345, y0 + 0.06, z + o));   // 수납장 문 이음(학생 쪽)
        [-0.8, 0, 0.8].forEach(o => {
          dBox(0.12, 0.1, 0.12, 0x3a3d44, x - 0.18, y0 + 0.76, z + o); dBox(0.04, 0.34, 0.52, 0x2f3238, x - 0.18, y0 + 0.86, z + o);
          dBox(0.03, 0.28, 0.46, 0x3d5870, x - 0.145, y0 + 0.89, z + o); dBox(0.15, 0.03, 0.42, 0xe6e6e0, x + 0.12, y0 + 0.76, z + o);
          chair(x + 0.55, y0, z + o, 1, 0x4a4f58, 1); seats.push({ x: x + 0.55, z: z + o, sx: x + 1.05, sz: z + o });
        });
      }
    } else {
      // [classrooms-13] 아이들 책상: 줄 = x(칠판에서 동쪽으로), 칸 = z — 옆으로 맞붙인 줄(영상 a_492 앞줄 넷·a_430.5) · 의자 = 나무 좌판·회색 쇠다리
      const n = (SCHOOL.people[name]?.s.length ?? 4) + 2;
      const cols = Math.max(2, Math.min(4, Math.floor((depth - 2.2) / 1.4) + 1));
      const rows = Math.min(Math.max(1, Math.min(3, Math.floor((W - 4.1) / 1.7) + 1)), Math.ceil(n / cols));
      const order = [...Array(cols).keys()].sort((a, b) => Math.abs(a - (cols-1)/2) - Math.abs(b - (cols-1)/2) || a - b);
      // [integ 09-24] 줄 간격 1.7 → 1.9: 의자 등 ~ 다음 줄 책상 통로 0.7 → 0.9(맞붙인 줄 가운데 자리 '앉기'가 0.3m 길격자로 닿는 칸 없음이던 것 — 유치원·사랑반)
      //   뒤 통로가 좁은 방(나래반)은 줄 간격 1.7을 두고 칸을 띄워(1.4 → 1.6 — 틈 0.7 → 0.9) 칸 사이로 건너게 한다
      const narrow = (xe - 0.45) - (xw + 3.15 + (rows - 1) * 1.9) < 0.9, RP = narrow ? 1.7 : 1.9, pitch = narrow ? 1.6 : 0.7;
      for (let r = 0; r < rows; r++) for (const c of order) {
        if (seats.length >= n) break;
        const x = xw + 2.4 + r * RP, z = zm + (c - (cols-1)/2) * pitch;
        studentDesk(x, y0, z, top, 0.7, 1);
        chair(x + 0.55, y0, z, 1, opt.chair ?? 0xb98a5a, 1);
        seats.push({ x: x + 0.55, z, sx: x + 1.05, sz: z });
      }
    }
    seatsOf[name] = { seats, y: y0, teacher: { x: xw + 1.3, z: zm - dz * 0.6 }, face: 3, tFace: 1 };
  }
  // [classrooms-3·5] 과학실(영상 s_388~408: 번호키 문으로 남향 입장 → 오른쪽(서) = 키 큰 흰 유리장·연두 띠, 왼쪽(동) = 흰 칠판·태극기·벽걸이 TV·준비실 문,
  //   북벽 = 낮은 흰 유리 진열대 + 불투명 높은 창, 남벽 = 창·블라인드). 칠판이 동벽이라 앞줄은 동쪽을 본다(일반 교실 서향의 예외 — 영상 확인).
  //   바닥 = 회베이지 테라초(호출부) · 흰 실험대(검은 테·연두 끝판)·올리브 의자 · 칠판 앞 시연대(구즈넥 수전 둘). door = 복도 문 x, prepZ = 준비실 문 z
  function labRoom(xw, xe, zc, zw, door, prepZ, prepX = null) {   // prepX = 준비실 문이 북벽(복도 쪽 벽)에 있을 때 그 x(LINK-EAST-0 — 진열대가 문 앞에서 끝남)
    const dz = Math.sign(zw - zc);
    // 서벽 북끝 연두 낮은 장(s_390.5·s_404.5)
    { const z0 = zc, z1 = zc + dz * 0.9, c = (z0 + z1) / 2;
      dBox(0.5, 0.88, 0.9, 0x8dc63f, xw + 0.25, 0, c); dBox(0.52, 0.03, 0.9, 0xf2f2ee, xw + 0.26, 0.88, c);
      [-0.22, 0.22].forEach(o => { dBox(0.03, 0.78, 0.4, 0x9fd05a, xw + 0.515, 0.05, c + o); dBox(0.03, 0.14, 0.03, 0x9aa0a6, xw + 0.545, 0.55, c + o * 0.2); });
      colliders.push(noStand({ x0: xw, x1: xw + 0.52, y0: 0, y1: 0.91, z0: Math.min(z0, z1), z1: Math.max(z0, z1) })); }
    // 서벽 키 큰 흰 유리장(아래 흰 문 · 0.95 연두 띠 · 위 유리문 칸)
    { const a0 = Math.min(zc + dz * 0.95, zw - dz * 0.5), a1 = Math.max(zc + dz * 0.95, zw - dz * 0.5), L = a1 - a0, c = (a0 + a1) / 2, H = 2.3, n = Math.max(1, Math.round(L / 0.6)), cw = L / n;
      dBox(0.45, H, L, 0xf2f2ee, xw + 0.225, 0, c);
      dBox(0.47, 0.06, L - 0.02, LIME, xw + 0.255, 0.95, c);   // 벽에서 2cm 띄움(몸통 뒷면과 같은 평면이 안 되게)
      // 칸문·유리문 = 칸 무늬 한 장씩(LINK-EAST-0 삼각형 예산 — 칸마다 상자 3개였다)
      [[0.05, 0.91, 0xf7f7f3], [1.04, 2.24, 0xbfd2da]].forEach(([y0, y1, t]) => patPush('lockW', [[xw + 0.455, y0, a0], [xw + 0.455, y0, a1], [xw + 0.455, y1, a1], [xw + 0.455, y1, a0]], [[0, 0], [n, 0], [n, 1], [0, 1]], [1, 0, 0], t));
      colliders.push(noStand({ x0: xw, x1: xw + 0.47, y0: 0, y1: H, z0: a0, z1: a1 })); }
    // 북벽 낮은 흰 유리 진열대(문 동쪽 ~ 개수대 앞 — s_401.5·s_403) + 동북 모서리 스테인리스 개수대
    { const a0 = door + 0.75, a1 = prepX != null ? prepX - 0.65 : xe - 1.2, L = a1 - a0, c = (a0 + a1) / 2, n = Math.max(1, Math.round(L / 0.6)), cw = L / n, fz = zc + dz * 0.45;
      dBox(L, 0.9, 0.45, 0xf2f2ee, c, 0, zc + dz * 0.225);
      { const qz = zc + dz * 0.455; patPush('lockW', [[a0, 0.2, qz], [a1, 0.2, qz], [a1, 0.82, qz], [a0, 0.82, qz]], [[0, 0], [n, 0], [n, 1], [0, 1]], [0, 0, dz], 0xc4d6dd); }   // 유리 앞판 = 칸 무늬 한 장
      dBox(L, 0.03, 0.47, 0xf6f6f2, c, 0.9, zc + dz * 0.235);
      colliders.push(noStand({ x0: a0, x1: a1, y0: 0, y1: 0.93, z0: Math.min(zc, fz), z1: Math.max(zc, fz) }));
      const sx0 = xe - 1.1, sc = (sx0 + xe) / 2, szc = zc + dz * 0.3;
      dBox(1.1, 0.85, 0.6, 0xe9e9e4, sc, 0, szc); dBox(1.1, 0.04, 0.62, 0xc9ced2, sc, 0.85, szc + dz * 0.01); dBox(0.5, 0.03, 0.34, 0x7d848a, sc, 0.89, szc);
      dRod(sc, 0.89, zc + dz * 0.06, sc, 1.18, zc + dz * 0.06, 0.014, 0xc9ced2); dRod(sc, 1.18, zc + dz * 0.06, sc, 1.12, zc + dz * 0.26, 0.012, 0xc9ced2);
      colliders.push(noStand({ x0: sx0, x1: xe, y0: 0, y1: 0.89, z0: Math.min(zc, zc + dz * 0.61), z1: Math.max(zc, zc + dz * 0.61) })); }
    // 창 아래 낮은 흰 수납장
    whiteLockers('x', xw + 0.5, xe - 0.6, zw, -dz, 0.75, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, 0);
    // 동벽: 준비실 문 옆 종이타월함 · 짙은 게시판 · 흰 칠판(3.6) · 위 태극기(남쪽) · 남끝 벽걸이 TV
    const bw = Math.min(3.6, Math.abs(zw - zc) - 4.9), zb = zw - dz * (1.9 + bw / 2);   // COURT-3: 동관 깊이 7.6(방 7.3)이면 칠판 2.4 — 준비실 문·종이타월함과 겹치지 않게
    dBox(0.1, 0.34, 0.28, 0xf2f2ee, xe - 0.05, 1.15, prepZ + dz * 0.76);
    greenBoard('z', Math.min(prepZ + dz * 1.0, zb - dz * (bw / 2 + 0.3)), Math.max(prepZ + dz * 1.0, zb - dz * (bw / 2 + 0.3)), xe, -1, 1.0, 2.1, 'notice');
    dBox(0.04, 1.32, bw + 0.12, 0xaeb4ba, xe - 0.02, 0.9, zb); dBox(0.03, 1.2, bw, 0xf3f5f4, xe - 0.055, 0.96, zb); dBox(0.09, 0.03, bw, 0xaeb4ba, xe - 0.085, 0.9, zb);
    const fz = zb + dz * 1.0; dBox(0.03, 0.5, 0.72, 0x5a4632, xe - 0.015, 2.3, fz); sign(FLAG_KEY, xe - 0.042, 2.55, fz, -Math.PI / 2, 0.4);
    const tz = zw - dz * 0.8; dBox(0.07, 0.75, 1.3, 0x1e1f22, xe - 0.035, 1.75, tz); dBox(0.03, 0.67, 1.2, 0x2a3a4a, xe - 0.085, 1.79, tz);
    hotspots.push({ kind: 'board', x: xe - 0.6, z: zb, y: 0, r: 2.0, label: '칠판에 낙서하기', bx: xe - 0.08, by: 1.56, bz: zb, ry: -Math.PI / 2 });
    // 시연대(칠판 앞 — s_400.5): 흰 몸통 + 연두 앞판(학생 쪽) + 검은 테 흰 상판 + 구즈넥 수전 둘
    { const x = xe - 1.35, z = zb;
      dBox(0.76, 0.78, 2.36, 0xf2f2ee, x, 0, z); dBox(0.03, 0.6, 2.2, LIME, x - 0.395, 0.12, z);
      dBox(0.82, 0.03, 2.42, 0x2f2f2f, x, 0.78, z); dBox(0.8, 0.03, 2.4, 0xf4f4f0, x, 0.81, z);
      [-0.6, 0.6].forEach(o => { dBox(0.34, 0.03, 0.3, 0x8a9096, x, 0.84, z + o);
        dRod(x + 0.28, 0.84, z + o, x + 0.28, 1.16, z + o, 0.013, 0xc9ced2); dRod(x + 0.28, 1.16, z + o, x + 0.1, 1.1, z + o, 0.012, 0xc9ced2); });
      colliders.push(noStand({ x0: x - 0.41, x1: x + 0.41, y0: 0, y1: 0.84, z0: z - 1.21, z1: z + 1.21 })); }
    // 실험대 2줄 × 2칸(검은 테 흰 상판·연두 끝판) · 앞줄 의자는 칠판(동) 쪽을 본다 · 뒷줄은 벽 유리장에 붙어 통로 쪽에 앉는다
    const lab = (cx, cz) => {
      colliders.push(noStand({ x0: cx - 0.4, x1: cx + 0.4, y0: 0, y1: 0.81, z0: cz - 0.9, z1: cz + 0.9 }));
      dBox(0.7, 0.72, 1.7, 0xf4f4f0, cx, 0.03, cz);
      [-1, 1].forEach(s => dBox(0.68, 0.68, 0.03, LIME, cx, 0.05, cz + s * 0.865));
      dBox(0.82, 0.03, 1.82, 0x2f2f2f, cx, 0.75, cz); dBox(0.8, 0.03, 1.8, 0xeeeeea, cx, 0.78, cz);
    };
    const xA = xe - 2.8, xB = xw + 0.92, OL = 0x7d9a3a;
    const labChair = (cx, cz, back) => {   // 실험실 의자(앉는 판·등받이·가운데 쇠다리 — chair의 상자 8개 → 3개, LINK-EAST-0 삼각형 예산)
      colliders.push(noStand({ x0: cx - 0.2, x1: cx + 0.2, y0: 0, y1: 0.85, z0: cz - 0.25, z1: cz + 0.25 }));
      dBox(0.4, 0.04, 0.42, OL, cx, 0.42, cz); dBox(0.035, 0.34, 0.42, OL, cx + back * 0.17, 0.46, cz); dBox(0.06, 0.42, 0.26, METAL, cx, 0, cz); };   // 앞줄 실험대 x 33.95~34.75 · 뒷줄 31.45~32.25 · 의자 사이 통로 0.8
    const xM = xe - xw > 8.5 ? (xA + xB) / 2 + 0.3 : null;   // 긴 과학실(LINK-EAST-0 10.6m — 영상 a_393 실험대 여러 줄)은 가운데 줄 실험대 하나 더(의자는 삼각형 예산 때문에 생략)
    [-1.6, 1.6].forEach(o9 => { const cz = (zc + zw) / 2 + o9;
      lab(xA, cz); lab(xB, cz); if (xM) lab(xM, cz);
      [-0.45, 0.45].forEach(o => {
        labChair(xA - 0.65, cz + o, -1);          // 앞줄: 등받이 서쪽 → 동쪽(칠판)을 본다
        hotspots.push({ kind: 'sit', x: xA - 1.15, z: cz + o, y: 0, r: 0.75, label: '의자에 앉기', yaw: Math.PI / 2 });
        labChair(xB + 0.65, cz + o, 1);           // 뒷줄: 통로 쪽에 앉아 실험대를 본다
      });
    });
  }
  // [integ 09-25] 몸 높이로 내려온 잎 덩어리의 충돌(ghost — '보이는 것은 뚫리면 안 된다'). 타원체(중심 cy·세로 반지름 sy·가로 a·b·y축 회전 ry)를
  //   머리 높이(땅+1.4)에서 자른 가로 크기 × 0.8의 AABB — 모서리 빈 곳이 보이지 않는 벽이 되지 않게. 올라서기 금지(1.6)·카메라 무시.
  //   땅 높이가 바뀌는 곳(앞뜰 끝 둔덕·체육관 대지 끝)은 막이를 잎판 밑 땅(가운데 높이)이 이어지는 데까지만 줄인다 — 떠 있는 막이가 낮은 비탈 칸을 가두지 않게
  //   (몸 반지름 0.3 바깥까지 같은 높이일 때만). 머리보다 거의 위인 잎은 건너뜀
  //   [quality4 09-26] 줄인 쪽(비탈 위 잎판)을 밑을 띄운 막이로 따로 막아 보니 비탈 계단이 몸을 막이 높이로 들어 올려 그 자리에 갇혔다(앞뜰 둔덕 7칸) — 줄임 유지(그 ghost는 남김)
  function canopyBox(cx, cz, cy, sy, a, b, ry) {
    const c = Math.cos(ry), sn = Math.sin(ry), ha = Math.hypot(a * c, b * sn), hb = Math.hypot(a * sn, b * c), g = tY(cz, cx);
    const hq = g + 1.4, f = cy <= hq ? 1 : cy - hq >= sy * 0.95 ? 0 : Math.sqrt(1 - ((cy - hq) / sy) ** 2);
    if (f < 0.3) return;
    const off = (x, z) => Math.abs(tY(z, x) - g) > 0.15;
    let x0 = cx - 0.8 * f * ha, x1 = cx + 0.8 * f * ha, z0 = cz - 0.8 * f * hb, z1 = cz + 0.8 * f * hb;
    while (z1 > cz && [x0, cx, x1].some(x => off(x, z1 + 0.3))) z1 -= 0.1;
    while (z0 < cz && [x0, cx, x1].some(x => off(x, z0 - 0.3))) z0 += 0.1;
    while (x1 > cx && [z0, cz, z1].some(z => off(x1 + 0.3, z))) x1 -= 0.1;
    while (x0 < cx && [z0, cz, z1].some(z => off(x0 - 0.3, z))) x0 += 0.1;
    if (x1 - x0 < 0.3 || z1 - z0 < 0.3) return;
    const y0 = Math.max(g + 0.05, cy - sy * 0.9);
    colliders.push(noStand({ x0, x1, y0, y1: y0 + 1.6, z0, z1 }));
  }
  // [quality4 09-26] 돌린 타원 발자국(가로 반지름 a·b · y축 회전 ry — dBlob과 같은 회전: 로컬 x축 = 세계 (cos ry, −sin ry))의 k배 안쪽에 드는 축정렬 띠(≤0.3m)로 막는다.
  //   돌린 타원의 AABB 한 장은 모서리가 잎 밖으로 나가 보이지 않는 벽, 긴 쪽 끝은 몸이 뚫었다(앞뜰 낮게 퍼진 향나무 (36,-21) 보이지 않는 벽 2·ghost·발 묻힘).
  //   띠는 짧은 쪽 축으로 자르고(띠 수 적게) 띠 가운데 현(chord) 길이를 쓴다. ns = 올라서기 금지(1.6) · k: 80면 덩어리 0.9 · 20면(chunky — 면 가운데 0.8, 꼭짓점 1.0) 0.86
  function ellipseCols(cx, cz, a, b, ry, y0, y1, k = 0.9, ns = true) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = k * Math.hypot(a * c, b * s), hz = k * Math.hypot(a * s, b * c), alongX = hz <= hx;   // alongX = z로 자른 띠(띠 길이 방향 x)
    const A2 = 1 / (a * a), B2 = 1 / (b * b), H = alongX ? hz : hx, n = Math.max(2, Math.ceil(2 * H / 0.3));
    // 세계 오프셋 (dx, dz) → 로컬: lx = dx·c − dz·s, lz = dx·s + dz·c. 띠 좌표 t(자르는 축의 오프셋)에서 다른 축 현(chord)의 양 끝 오프셋
    const chord = t => { const [p, q, r] = alongX ? [c * c * A2 + s * s * B2, 2 * t * c * s * (B2 - A2), t * t * (s * s * A2 + c * c * B2) - k * k]
                                                    : [s * s * A2 + c * c * B2, 2 * t * c * s * (B2 - A2), t * t * (c * c * A2 + s * s * B2) - k * k];
      const D = q * q - 4 * p * r; if (D <= 0) return null; const e = Math.sqrt(D); return [(-q - e) / (2 * p), (-q + e) / (2 * p)]; };
    for (let i = 0; i < n; i++) { const t0 = -H + 2 * H * i / n, t1 = -H + 2 * H * (i + 1) / n, ch = chord((t0 + t1) / 2); if (!ch || ch[1] - ch[0] < 0.1) continue;
      const box = alongX ? { x0: cx + ch[0], x1: cx + ch[1], y0, y1, z0: cz + t0, z1: cz + t1 } : { x0: cx + t0, x1: cx + t1, y0, y1, z0: cz + ch[0], z1: cz + ch[1] };
      colliders.push(ns ? noStand(box) : box); }
  }
  // [quality4 09-26] 둥근 줄기·공 덩어리(반지름 r = 몸 높이에서 보이는 면 안쪽) 막이 = 십자 두 장(r × 0.62r · 0.62r × r) — 상자 한 장은 굵은 줄기(r ≥ 0.6)에서
  //   모서리가 줄기 밖(보이지 않는 벽 — 본관 동쪽 끝 큰 침엽수 9간선)이거나, 줄이면 옆을 몸이 뚫었다(큰 나무 잔디밭 향나무 ghost 8칸)
  function roundCol(x, z, r, y0, y1) {
    colliders.push({ x0: x - r, x1: x + r, y0, y1, z0: z - 0.62 * r, z1: z + 0.62 * r }, { x0: x - 0.62 * r, x1: x + 0.62 * r, y0, y1, z0: z - r, z1: z + r });
  }
  // 전정한 소나무(영상 f_132~186 앞뜰 — 굽은 줄기 + 납작한 구름 잎판). 밑동 충돌은 12m(나무 위에 못 올라가게)
  //   lite = 가벼운 모양(5각 줄기 + 잎판 20면 BLOB0 — 약 900 → 260삼각형 · 뒤뜰 far 층용, tree의 lite와 같은 이유)
  function prunedPine(x, z, s = 1, lite = false, at = null) {   // at = 이 청크에 합침
    const y = tY(z, x), R = seeded(Math.floor(Math.abs(x * 131 + z * 71)) + 7), F = { far: true, chunky: lite, jitter: lite ? 0.12 : 0, ...(at ? { at } : {}) };
    colliders.push({ x0: x - 0.2*s, x1: x + 0.2*s, y0: y, y1: y + 12, z0: z - 0.2*s, z1: z + 0.2*s });
    let px = x, py = y, pz = z, a = R() * 6.28;
    for (let k = 0; k < 3; k++) {
      const L = (0.75 + R()*0.35) * s, t = 0.28 + R()*0.2, dx = Math.cos(a), dz = Math.sin(a);
      dCyl(0.1*s*(1 - k*0.22), 0.13*s*(1 - k*0.22), L, 0x5e4a3a, px, py, pz, { far: true, seg: lite ? 5 : 7, rot: [t*dz, 0, -t*dx], ...(at ? { at } : {}) });
      px += Math.sin(t) * dx * L; py += Math.cos(t) * L; pz += Math.sin(t) * dz * L;
      a += 1.2 + R() * 1.6;
    }
    const pads = 4 + Math.floor(R() * 3), PG = [0x4a8250, 0x55905a, 0x4c8752];
    for (let k = 0; k < pads; k++) {
      const h = (1.0 + k * (2.1 / pads)) * s, r = (0.82 - k * 0.09 + R() * 0.2) * s, ang = R() * 6.28, d = (k === pads - 1 ? 0.1 : 0.45 + R() * 0.55) * s;
      dBlob(r, r * 0.34, r * 0.85, PG[k % 3], x + Math.cos(ang) * d, y + h, z + Math.sin(ang) * d, lite ? { ...F, ry: ang } : F);
      canopyBox(x + Math.cos(ang) * d, z + Math.sin(ang) * d, y + h, r * 0.34, r * (lite ? 0.95 : 1), r * (lite ? 0.81 : 0.85), lite ? ang : 0);   // [integ 09-25] 몸 높이 잎판 = 충돌(앞뜰 남 화단 ghost 200칸) · [quality4 09-26] lite 0.9·0.77 → 0.95·0.81(20면 꼭짓점 쪽 잎을 몸이 1~2cm 뚫음 — 텃밭 ghost 2)
      dBlob(r * 0.7, r * 0.26, r * 0.6, 0x6aa362, x + Math.cos(ang) * d, y + h + r * 0.18, z + Math.sin(ang) * d, { far: true, chunky: lite, ry: ang, jitter: 0.12, ...(at ? { at } : {}) });
    }
  }
  // 둥근 회양목(앞뜰 화단) — 올라서기 금지
  function shrub(x, z, r = 0.6, hex = 0x4d8b4d, lite = false) {   // lite = 20면(뒤뜰 far 층)
    const y = tY(z, x);
    colliders.push(noStand({ x0: x - r*0.85, x1: x + r*0.85, y0: y, y1: y + r*1.4, z0: z - r*0.85, z1: z + r*0.85 }));
    dBlob(r, r*0.78, r, hex, x, y + r*0.68, z, { far: true, chunky: lite, ry: x, jitter: lite ? 0.16 : 0.1 });
  }
  // 다듬은 회양목 둔덕(앞뜰 — 영상 f_132~183: 폭 1.5~2m·높이 0.9m 넓적한 둥근 덩어리가 서로 닿게 줄지어) — 윗면 밝은 잎 한 겹. 올라서기 금지
  function mound(x, z, w = 1.7, h = 0.9, d = 1.4, hex = 0x4f8a45, lite = false, ry = null) {   // lite = 몸통도 20면(뒤뜰 far 층) · ry = 몸통 회전(기본 = 자리 해시). 옆이 트인 덩어리는 0 — 축정렬 충돌상자(±0.42w)가 돌린 타원보다 넓어 보이지 않는 벽이 된다
    const y = tY(z, x), hh = hash2(x, z);
    // [integ 09-25 · quality4가 띠로 바꿈] 충돌 = 돌린(ry) 타원의 AABB × 0.8(lite 20면 = 안쪽 반지름 0.79라 0.62) — 예전 w·d × 0.42는 덩어리가 돌아가 있으면 상자 모서리가 밖으로 나가 보이지 않는 벽(앞뜰 북 화단·동관 뒤뜰 둔덕)
    //   ry(FRONT-3): 넘기면 그 각도로(0 = 축정렬 — 트인 자리 옆 덩어리), 안 넘기면 예전처럼 hash
    const r9 = ry == null ? hh * 6 : ry;
    ellipseCols(x, z, w / 2, d / 2, r9, y, y + h, lite ? 0.86 : 0.9);   // [quality4 09-26] AABB × 0.8 → 돌린 타원 띠(k 0.9 · 20면 0.86): AABB × 0.8은 긴 쪽 끝을 몸이 뚫어 발 묻힘(앞뜰 북 화단·동관 뒤뜰 둔덕)
    dBlob(w / 2, h * 0.62, d / 2, hex, x, y + h * 0.38, z, { far: true, chunky: lite, ry: r9, jitter: lite ? 0.14 : 0.1 });
    dBlob(w * 0.36, h * 0.3, d * 0.34, 0x8cb85a, x + (hh - 0.5) * 0.2, y + h * 0.72, z, { far: true, chunky: true, ry: hh * 9, jitter: 0.12 });
  }
  // 옆으로 퍼진 소나무(건물 앞 북 화단 — 영상 f_141·f_147·f_150: 굽은 줄기 둘 + 납작한 잎판이 옆으로 3~4단)
  function spreadPine(x, z, s = 1) {
    const y = tY(z, x), R = seeded(Math.floor(Math.abs(x * 97 + z * 53)) + 11), F = { far: true };
    colliders.push({ x0: x - 0.2 * s, x1: x + 0.2 * s, y0: y, y1: y + 12, z0: z - 0.2 * s, z1: z + 0.2 * s });
    const a0 = R() * 6.28;
    [0, 1].forEach(k => { const a = a0 + k * 2.4, t = 0.5 + R() * 0.25; dCyl(0.08 * s, 0.13 * s, 1.5 * s, 0x6a4a36, x, y, z, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }); });
    for (let k = 0; k < 4; k++) {
      const a = a0 + k * 1.7 + R() * 0.6, d = (0.7 + R() * 0.9) * s, h = (1.05 + k * 0.42 + R() * 0.2) * s, r = (1.0 - k * 0.12 + R() * 0.2) * s;
      dBlob(r * 1.25, r * 0.3, r, [0x557f47, 0x5c8a4e, 0x507a42][k % 3], x + Math.cos(a) * d, y + h, z + Math.sin(a) * d, F);
      canopyBox(x + Math.cos(a) * d, z + Math.sin(a) * d, y + h, r * 0.3, r * 1.25, r, 0);   // [integ 09-25] 몸 높이 잎판 = 충돌(앞뜰 북 화단 ghost)
      dBlob(r * 0.9, r * 0.22, r * 0.7, 0x76a45e, x + Math.cos(a) * d, y + h + r * 0.16, z + Math.sin(a) * d, { far: true, chunky: true, ry: a, jitter: 0.12 });
    }
  }
  // 층층 공 향나무(구령대 동쪽 3그루·앞뜰 — 영상 u_272·u_284·f_171·f_177: 줄기에 공 모양 덩어리 3~4개가 층층이, 키 3m 안팎)
  function ballJuniper(x, z, s = 1, lite = false) {   // lite = 공 덩어리 20면(뒤뜰 far 층)
    const y = tY(z, x), hh = hash2(x, z);
    // [integ 09-25] 0.3 → 0.48(lite 20면 0.4): 맨 아래 공(반지름 0.62·높이 0.04~1.06)을 몸이 뚫었다(구령대 동쪽 ghost) — 더 크면 상자 모서리가 공 밖(보이지 않는 벽)
    roundCol(x, z, (lite ? 0.85 : 0.9) * 0.62 * s, y, y + 12);   // [quality4 09-26] 상자 한 장 → 십자(맨 아래 공 안쪽 면) — 큰 나무 잔디밭 lite s 1.8(공 반지름 1.12)을 상자 0.72가 못 막아 ghost 8칸
    dCyl(0.07 * s, 0.11 * s, 2.6 * s, 0x5e4a3a, x, y, z, { far: true, seg: 6 });
    [[0.62, 0.55, 0, 0], [0.5, 1.35, 0.28, 0.1], [0.4, 2.05, -0.2, -0.12], [0.3, 2.65, 0.05, 0.08]].forEach(([r, h, ox, oz], k) =>
      dBlob(r * s, r * 0.82 * s, r * s, [0x2f6a3a, 0x357242, 0x2b6236, 0x3a7a46][k], x + ox * s * (hh > 0.5 ? 1 : -1), y + h * s, z + oz * s, { far: true, chunky: lite, ry: hh * 5 + k, jitter: lite ? 0.14 : 0.1 }));
  }
  // 바닥 나침반 무늬(현관 홀 — 영상 e_336~341): 캔버스 원판 한 장
  function compassRose(x, y, z, r) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.translate(128, 128);
    // hall_lobby-18(영상 e_336~340): 바깥 = 바닥 타일색 · 짙은 회색 굵은 링(0.78r) 안 짙은 회색 바탕에 크림 조각 · 큰 4방위 끝은 링 밖 r까지(검정/회색 반쪽) · 사이 4방위 = 적갈/크림
    g.fillStyle = '#eee5d0'; g.beginPath(); g.arc(0, 0, 127, 0, 7); g.fill();
    g.fillStyle = '#3a3d44'; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.fill();
    g.strokeStyle = '#e9e1cf'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 88, 0, 7); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8 - Math.PI / 2; g.fillStyle = '#e9e1cf'; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); g.lineTo(Math.cos(a - 0.2) * 84, Math.sin(a - 0.2) * 84); g.lineTo(Math.cos(a + 0.2) * 84, Math.sin(a + 0.2) * 84); g.closePath(); g.fill(); }
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? 84 : 127, w = k % 2 ? 16 : 24;
      [[1, k % 2 ? '#e8dfcf' : '#8a8f96'], [-1, k % 2 ? '#9a3b2e' : '#1f2024']].forEach(([sd, col]) => {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        g.lineTo(Math.cos(a + sd * Math.PI / 4) * w, Math.sin(a + sd * Math.PI / 4) * w); g.closePath(); g.fill(); });
    }
    g.fillStyle = '#e9e1cf'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m);
  }
  // 복도 나무 손잡이(영상 a_459~480: 연두 징두리 위 갈색 손잡이 0.85m) — 벽 면을 따라, skip 구간([a,b]) 건너뜀
  function railAlong(ax, a0, a1, wall, f, skip = [], y = 0.82) {
    const sk = skip.slice().sort((p, q) => p[0] - q[0]);
    let a = a0;
    const emit = (u, v) => { if (v - u < 0.3) return; ax === 'x' ? dBox(v - u, 0.07, 0.06, 0x8a5a3b, (u + v)/2, y, wall + f*0.03) : dBox(0.06, 0.07, v - u, 0x8a5a3b, wall + f*0.03, y, (u + v)/2); };
    for (const [u, v] of sk) { if (u > a) emit(a, Math.min(u, a1)); a = Math.max(a, v); }
    if (a < a1) emit(a, a1);
  }
  // 철망 울타리(격자 무늬 판 + 기둥 3m + 윗봉) — 무늬판은 전부 한 메시(드로우콜 1). 충돌 = 높이 3 벽(카메라 무시)
  const fencePos = [], fenceUV = [], fenceCol = [];
  // 옥상 난간(영상 v2180_0105~0129 가운데 마당·f_273 정면: 단층 지붕 가장자리 쇠 난간 — 가로대 둘 + 촘촘한 세로살).
  // 무늬 사각형만(밉맵이라 멀리서 가는 봉처럼 반짝이지 않는다) · 전부 한 메시. 지붕엔 못 올라가므로 충돌 없음
  const railPos = [], railUV = [];
  function roofRail(x0, z0, x1, z1, yb, H = 1.0) {
    const L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.3) return;
    const P = [[x0, yb, z0], [x1, yb, z1], [x1, yb + H, z1], [x0, yb + H, z0]], U = [[0, 0], [L / 1.6, 0], [L / 1.6, 1], [0, 1]];
    for (const i of [0, 1, 2, 0, 2, 3]) { railPos.push(...P[i]); railUV.push(...U[i]); }
  }
  function meshFence(x0, z0, x1, z1, yb, H = 1.8, col = 0x3d6b4a, post9 = 0x3d5a45, collide = true, railSeg = 0) {
    const L = Math.hypot(x1 - x0, z1 - z0), P = [[x0, yb, z0], [x1, yb, z1], [x1, yb + H, z1], [x0, yb + H, z0]], U = [[0, 0], [L / 0.6, 0], [L / 0.6, H / 0.6], [0, H / 0.6]];
    if (L < 0.3) return;                                                     // 길이 0 토막(꼭짓점이 경계선 위) — 봉 방향이 NaN이 된다
    _c.set(col);
    for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); }
    const n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0)*t, pz = z0 + (z1 - z0)*t; dRod(px, yb, pz, px, yb + H + 0.05, pz, 0.045, post9, { far: true }); }
    const nr = railSeg ? Math.max(1, Math.ceil(L / railSeg)) : 1;   // railSeg = 윗대 토막 길이(봉 하나는 시작점 청크에 들어간다 — 47m 봉 하나가 그 청크의 경계 구를 부풀려 서관 안에서도 절두체에 들었다. byRot과 같은 규칙)
    for (let k = 0; k < nr; k++) dRod(x0 + (x1 - x0) * k / nr, yb + H, z0 + (z1 - z0) * k / nr, x0 + (x1 - x0) * (k + 1) / nr, yb + H, z0 + (z1 - z0) * (k + 1) / nr, 0.03, post9, { far: true });
    if (collide) colliders.push({ x0: Math.min(x0, x1) - 0.12, x1: Math.max(x0, x1) + 0.12, y0: yb, y1: yb + Math.max(3, H + 0.3), z0: Math.min(z0, z1) - 0.12, z1: Math.max(z0, z1) + 0.12, nc: true });
  }
  // 비탈 사각형(보이는 면) + 보이지 않는 계단 충돌(물리는 AABB뿐) — 잔디 둔덕·경사로
  //   ax='z': z0(높이 y0) → z1(높이 y1), x 구간 [a0,a1]. ax='x': x0→x1, z 구간
  function slope(kind, ax, a0, a1, s0, s1, y0, y1, steps, tint = 0xffffff) {
    const S = PATDEF[kind][0];
    const pts = ax === 'z' ? [[a0, y0, s0], [a1, y0, s0], [a1, y1, s1], [a0, y1, s1]] : [[s0, y0, a0], [s0, y0, a1], [s1, y1, a1], [s1, y1, a0]];
    patPush(kind, pts, pts.map(p => [p[0] / S, -p[2] / S]), [0, 1, 0], tint);
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps, t1 = (k + 1) / steps, top = y0 + (y1 - y0) * (t0 + t1) / 2, lo = Math.min(y0, y1) - 0.02;
      const b0 = s0 + (s1 - s0) * t0, b1 = s0 + (s1 - s0) * t1;
      if (top - lo < 0.02) continue;
      colliders.push(ax === 'z' ? { x0: a0, x1: a1, y0: lo, y1: top, z0: Math.min(b0, b1), z1: Math.max(b0, b1) } : { x0: Math.min(b0, b1), x1: Math.max(b0, b1), y0: lo, y1: top, z0: a0, z1: a1 });
    }
  }
  // 세모 막음면(비탈 끝) — 수직 삼각형. ax='z'면 x=line 평면
  function slopeCap(kind, line, f, zTop, zBot, yTop, yBot, tint = 0xffffff) {
    const S = PATDEF[kind][0], pts = [[line, yBot, zBot], [line, yTop, zTop], [line, yBot, zTop], [line, yBot, zTop]];
    patPush(kind, pts, pts.map(p => [p[2] / S, p[1] / S]), [f, 0, 0], tint);
  }

  // ================= 지형 (LAYOUT-3 · 세 높이: 건물 0 · 앞뜰 YARD · 운동장 FIELD) =================
  patQuad('grass', -190, 170, -150, 130, FIELD - 0.012);                 // 바깥 잔디(운동장 흙보다 1.2cm 아래 — 먼 거리 깊이 정밀도 여유)
  // 학교 부지(YARD) = 앞뜰 남쪽 끝(TERR_Z) 북쪽 전체 + 체육관 대지(서쪽 띠). 두 상자는 z=TERR_Z에서 맞대기만(윗면 겹침 0)
  const SITE = 0xc2bcb0;
  addBox(150, YARD - FIELD, TERR_Z + 90, SITE, -13, FIELD, (TERR_Z - 90) / 2);                                   // x -88~62 · z -90~TERR_Z
  addBox(TR3.westX + 88, YARD - FIELD, TR3.westZ - TERR_Z, SITE, (TR3.westX - 88) / 2, FIELD, (TERR_Z + TR3.westZ) / 2);   // 체육관 대지(x < westX) 남쪽 연장
  { const F = SCHOOL.field;
    patQuad('dirt', TR3.westX, F.x[1], F.z[0], F.z[1], FIELD);
    patQuad('dirt', F.x[0], TR3.westX, TR3.westZ, F.z[1], FIELD);
    // 체육관 대지 옹벽(돌) 겉무늬 — 동면(운동장 쪽)·남면
    // (동면 돌 옹벽은 운동장 북서 모서리 흙 비탈 위로 드러난 세모만 — 운동장 북서 모서리 블록)
    patWall('stoneW', 'x', -86, SCHOOL.gymStairs.x[0], FIELD, YARD, TR3.westZ + 0.012, 1);   // 서쪽 볼벽 없음 — 계단 서끝까지(영상 g_087·g_088.5)
  }

  // ================= 본관 (LAYOUT-3: 위성 91 × 10 m · 복도 2.5 + 교실 7.5) =================
  const [fx0, fx1] = FR.x, [fz0, fz1] = FR.z, zCor = fz0 + FR.corridorDepth;
  const hall = FR.rooms.find(r => r.type === 'hall'), hc = (hall.span[0] + hall.span[1]) / 2;
  const wg = B.wings[0], WL = B.westLobby, CL = B.centerLobby, LC = B.linkCorridor, EN = B.entrance, RC = EN.recess;
  const LOB_X0 = WL.x[0], LOB_X = WL.x[1], LOB_Z = WL.northZ, VZ = WL.vestibuleZ, SIDE_Z = (VZ[0] + VZ[1]) / 2, KBZ = WL.kinderBlockZ;
  const HX0 = hall.span[0], HX1 = hall.span[1], EZI = EN.innerDoorZ;
  const twoDoor = r => ['classroom', 'computer', 'daycare', 'science'].includes(r.type);
  const backDoor = r => ({ c: r.span[1] - 1.9, w: 1.2 });
  // 기초: 본관 몸통 + 현관 돌출부 + 북벽 바깥 절반(뒷길·마당 쪽만 — 나머지는 이웃 건물 기초와 맞댐)
  addBox(fx1 - fx0 + 0.3, -YARD, fz1 + 0.15 - fz0, 0xbab7ae, (fx0 + fx1) / 2, YARD, (fz0 + fz1 + 0.15) / 2);   // 본관 몸통 기초 = 밝은 콘크리트 턱(FRONT-3 · 영상 g_112·g_114·f_180 — 짙은 갈색 띠 아님)
  foundation(EN.x[0], EN.x[1], fz1 + 0.15, EN.z[1] - 0.4);
  foundation(EN.x[0], RC.x[0], EN.z[1] - 0.4, EN.z[1]); foundation(RC.x[1], EN.x[1], EN.z[1] - 0.4, EN.z[1]);
  foundation(wg.x[1] + 0.15, B.kitchen.x[0] - 0.15, fz0 - 0.15, fz0);   // 뒷길 밑(서관 동벽 ~ 급식동 서벽)
  foundation(CL.x[1] + 0.15, fx1 + 0.15, fz0 - 0.15, fz0);

  // 정면(남) FACADE-2 → FRONT-3(09-24 재점검 · 영상 g_112~f_183 확대 대조): 방마다 한 줄로 이어진 깊은 상자 틀(윗판·양끝 날개·창턱 + 창 사이 기둥 · 깊이 0.6 — f_174·f_180 옆면)
  //   구간 색: 원무실·돌봄·1학년·3학년 동쪽 칸 = 카키 큰 판(녹회색 — g_114) · 유치원·사랑반·3학년 서쪽 칸 = 연회색 판(g_124·g_130·f_174·f_180) — 둘 다 노랑 상자
  //   행정실~현관·현관~컴퓨터실 = 베이지 판 + 파랑 상자(햇빛 면 수레국화 파랑 — f_138·f_165 · 예전 남색). 행정실+교장실은 차양 하나(f_141)
  //   실 경계 기둥 = 바닥~갓돌 위까지(연회색 · 1|3학년 노랑 · 돌봄|행정실·화장실|컴퓨터실 파랑 · 컴퓨터실|1학년은 가는 파랑 테 — f_171·f_174·g_130)
  const KHK = 0x9b9e90, PGRY = 0xd1d2ce, FBLUE = 0x78a2e2, FYEL = 0xeec83c;   // 렌더 표본 맞춤(영상 f_165·f_138 파랑 평균 ≈(90,118,160) · f_174 노랑 G/R 0.86 · g_114 카키 (131,128,108))
  PATDEF.panelG = [2.4, 256, false, (g, N, R) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { g.fillStyle = pick(['#d2d3cf', '#cdcecb', '#d6d7d3'], R); g.fillRect(i*64, j*32, 64, 32); }
    g.fillStyle = '#b0b1ad'; for (let i = 0; i <= 4; i++) g.fillRect(i*64 - 1, 0, 2, N); for (let j = 0; j <= 8; j++) g.fillRect(0, j*32 - 1, N, 2); }];   // 연회색 판(0.6 × 0.3 줄눈 — f_174·f_180 확대)
  const SEC_WALL = { y: KHK, g: PGRY, b: WALL }, SEC_SKIN = { y: 'siding', g: 'panelG', b: 'panelB' }, SEC_BOX = { y: FYEL, g: FYEL, b: FBLUE };
  const facadeGaps = [], FBOX = [];                                               // FBOX = 상자 틀 { a, b, col, fill:[[x0,x1],…] }
  { const FD9 = 0.6, MUL = 0.4;
    const half = x => x <= fx0 ? 1.8 : x >= fx1 ? 0.6 : (x === EN.x[0] || x === EN.x[1] || x === 10.4 || x === 14.6) ? 0.2 : x === -6.65 ? 0.3 : x === 33.05 ? 0.075 : 0.25;
    const R9 = FR.rooms.filter(r => r.type !== 'hall');
    const colOf = x => (x < -6.65 || x > 33.05) ? FYEL : FBLUE;
    const winsIn = (ra, rb, n, wmax) => { const w = Math.min(wmax, (rb - ra - (n - 1) * MUL) / n), s = (ra + rb - n * w - (n - 1) * MUL) / 2;
      return Array.from({ length: n }, (_, k) => ({ c: s + w / 2 + k * (w + MUL), w, sill: 1.0, dh: 2.6, win: true, noLedge: true })); };
    const fillOf = (a, b, gs) => { const f = []; let cur = a; gs.forEach(g => { if (g.c - g.w / 2 - cur > 0.01) f.push([cur, g.c - g.w / 2]); cur = g.c + g.w / 2; }); if (b - cur > 0.01) f.push([cur, b]); return f; };
    for (let i = 0; i < R9.length; i++) {
      const r = R9[i], [s0, s1] = r.span, n = Math.max(1, Math.round((s1 - s0) / 4.3));
      if (r.kinderOffice) {                                                        // 원무실(g_114 확대): 긴 상자 하나 = [좁은 창][좁은 창][카키 판][3짝 창] · 흰 틀
        const a = s0 + half(s0), b = s1 - half(s1), WF = 0xf2f2ee;
        const gs = [{ c: a + 0.65, w: 0.7 }, { c: a + 1.65, w: 0.7 }, { c: b - 1.1, w: 1.6 }].map(g => ({ ...g, sill: 1.0, dh: 2.6, win: true, noLedge: true, frame: WF }));
        facadeGaps.push(...gs); FBOX.push({ a, b, col: FYEL, fill: fillOf(a, b, gs).filter((f, k) => k !== 2) });   // 둘째 창과 3짝 창 사이(셋째 칸)는 카키 판(상자 안 벽이 그대로)
      } else if (r.type === 'toilet') {                                            // 화장실(f_165): 창마다 따로 작은 상자 + 베이지 벽
        const seg = (s1 - s0 - 0.8) / n;
        for (let k = 0; k < n; k++) { const g = { c: s0 + 0.4 + seg * (k + 0.5), w: Math.min(2.6, seg - 0.9), sill: 1.0, dh: 2.6, win: true, noLedge: true };
          facadeGaps.push(g); FBOX.push({ a: g.c - g.w / 2 - 0.3, b: g.c + g.w / 2 + 0.3, col: colOf(g.c), fill: [[g.c - g.w / 2 - 0.3, g.c - g.w / 2], [g.c + g.w / 2, g.c + g.w / 2 + 0.3]] }); }
      } else if (r.name === '행정실' && R9[i + 1] && R9[i + 1].name === '교장실') {  // 행정실+교장실 = 이어진 파랑 차양 하나(f_138·f_141)
        const r2 = R9[i + 1], a = s0 + half(s0), b = r2.span[1] - half(r2.span[1]);
        const gs = [...winsIn(a + 0.3, s1 - MUL / 2, 1, 3.6), ...winsIn(s1 + MUL / 2, b - 0.3, 1, 3.6)];
        facadeGaps.push(...gs); FBOX.push({ a, b, col: FBLUE, fill: fillOf(a, b, gs) }); i++;
      } else {
        const a = s0 + half(s0), b = s1 - half(s1), gs = winsIn(a + 0.3, b - 0.3, n, 3.8);
        facadeGaps.push(...gs); FBOX.push({ a, b, col: colOf((s0 + s1) / 2), fill: fillOf(a, b, gs) });
      }
    }
    // 창 상자 틀: 윗판(2.6~2.95)·창턱(0.85~0.98 — 창틀 턱과 윗면이 겹치지 않게)·날개와 창 사이 기둥(0.98~2.6) · 깊이 0.6 · 몸이 뚫지 않게 충돌
    FBOX.forEach(({ a, b, col, fill }) => { const zc = fz1 + 0.15 + FD9 / 2;
      dBox(b - a, 0.35, FD9, col, (a + b) / 2, 2.6, zc); dBox(b - a, 0.13, FD9, col, (a + b) / 2, 0.85, zc);
      fill.forEach(([u, v]) => dBox(v - u, 1.62, FD9, col, (u + v) / 2, 0.98, zc));
      colliders.push({ x0: a, x1: b, y0: YARD, y1: 2.95, z0: fz1 + 0.15, z1: fz1 + 0.15 + FD9, nc: true }); });
    // 실 경계 기둥(바닥~갓돌 위 · 상자보다 4cm 앞): [x, 폭, 색, 높이]
    const PD9 = FD9 + 0.04, PL = 0xd9dad6, TOP = FH + 0.84;
    [[-33.5, 0.5, PL, TOP], [-23.3, 0.5, PL, TOP], [-15, 0.5, PL, TOP], [-6.65, 0.6, FBLUE, TOP], [2.2, 0.5, FBLUE, 2.95], [24.15, 0.5, FBLUE, TOP], [41.45, 0.5, FYEL, TOP]].forEach(([x, w, c, t]) => {
      dBox(w, t - YARD, PD9, c, x, YARD, fz1 + 0.15 + PD9 / 2);
      colliders.push({ x0: x - w / 2, x1: x + w / 2, y0: YARD, y1: t, z0: fz1 + 0.15, z1: fz1 + 0.15 + PD9, nc: true }); });
    dBox(0.15, FH - 0.035 - YARD, 0.1, FBLUE, 33.05, YARD, fz1 + 0.2);                       // 컴퓨터실|1학년 = 가는 파랑 테(f_171)
    // 창턱 안쪽 7cm 턱에 점프로 올라앉지 못하게(유리 충돌 0.16 < 벽 0.3 — health perch) — 창 안쪽 면 앞 얇은 막이(유리 옆이라 보이지 않는 벽 아님)
    facadeGaps.forEach(g => colliders.push(noStand({ x0: g.c - g.w / 2, x1: g.c + g.w / 2, y0: 1.0, y1: 2.6, z0: fz1 - 0.15, z1: fz1 - 0.08 }, 0.1)));
    // 교실 창 가운데 살 흰 둥근 환기 캡 둘(영상 g_117·f_132·f_174·f_180 — 노랑 상자 창의 첫 칸)
    facadeGaps.forEach(g => { if (g.c > -33.5 && (g.c < -6.65 || g.c > 33.05) && g.w > 1.3) [1.35, 1.62].forEach(y9 => dCyl(0.085, 0.085, 0.08, 0xf2f2ee, g.c - g.w / 2 + 0.32, y9, fz1 + 0.1, { rot: [Math.PI / 2, 0, 0], seg: 10 })); });
    // 원무실 아래 벽 계량기·수도꼭지(g_114)
    dCyl(0.1, 0.1, 0.06, 0x9a9da0, -36.6, 0.55, fz1 + 0.15, { rot: [Math.PI / 2, 0, 0], seg: 10 }); dBox(0.05, 0.12, 0.1, 0xc0c3c6, -38.7, 0.3, fz1 + 0.2);
  }
  // 구간(카키 y · 연회색 g · 베이지 b) — 3학년 안의 연회색|카키 경계는 두 창 사이 기둥 가운데(f_180 — 벽 조각이 0.15보다 짧아지지 않게)
  const G3 = facadeGaps.filter(g => g.c > 41.45).sort((p, q) => p.c - q.c), G3X = G3.length > 1 ? (G3[0].c + G3[0].w / 2 + G3[1].c - G3[1].w / 2) / 2 : 46.2;
  const FSEC = [[fx0 - 0.15, -33.5, 'y'], [-33.5, -15, 'g'], [-15, -6.65, 'y'], [-6.65, EN.x[0], 'b'], [EN.x[1], 33.05, 'b'], [33.05, 41.45, 'y'], [41.45, G3X, 'g'], [G3X, fx1 + 0.15, 'y']];
  const secOf = x => (FSEC.find(([a, b]) => x > a && x < b) || FSEC[3])[2];
  const gapsIn = (a, b) => facadeGaps.filter(g => g.c > a && g.c < b);
  { const P9 = plinths.length;
    FSEC.forEach(([a, b, k]) => wallX(a, b, fz1, SEC_WALL[k], { gaps: gapsIn(a, b), face: 1, ext: true, skin: SEC_SKIN[k], innerHex: CLS_WALL }));
    plinths.splice(P9); }                                                          // 정면은 짙은 아랫단 띠 없음 — 벽 마감이 밝은 콘크리트 턱까지(g_112·f_180)
  // 학교 이름 큰 글자(영상 f_138~f_144 확대: 행정실~교장실 파랑 차양 바로 위 · 남색 글자 — 삼각측량 x -3.4~1.5)
  sign(SCHOOL.name.split('').join(' '), -1.0, 3.37, fz1 + 0.44, 0, 1.02, { bg: 'none', fg: '#23407e' });
  // 빗물관(영상 g_114·g_130·f_138·f_165): 남서 모서리는 바닥까지(회색), 나머지는 실 경계 기둥 옆 파라펫 → 상자 윗판 위에서 끝남
  dCyl(0.05, 0.05, FH + 0.25 - YARD, 0xb4b8bb, fx0 + 0.3, YARD, fz1 + 0.24, { seg: 8 });
  [-33.5, -15, -6.65, 24.15, 41.45].forEach(x => { const px = x + (x === -6.65 ? 0.42 : 0.36); dCyl(0.05, 0.05, FH + 0.25 - 2.95, 0xeceae4, px, 2.95, fz1 + 0.24, { seg: 8 }); });
  // 주복도 북벽 — ①도서관 남벽(초록 시트지 창) ②계단홀 트임 ③서관|급식동 뒷길(바깥) ④급식동 남벽(당직실·급식실 문) ⑤가운데 로비 트임 ⑥마당 쪽 창
  const STX0 = wg.rooms.find(r => r.type === 'stair').span[0];
  const libR = wg.rooms.find(r => r.type === 'library');
  wallX(LOB_X - 0.15, STX0 + 0.15, fz0, INNER, { face: -1, dado: HALL_DADO, gaps: [{ c: (libR.span[0] + 0.4 + libR.span[1] - 0.35) / 2, w: libR.span[1] - libR.span[0] - 0.75, sill: 1.05, dh: 2.45, win: true, frame: 0xc9cdd2 }] });   // 도서관 복도창 = 은색 틀 큰 유리 띠(영상 W_202~207 — 창 사이 벽 없음)
  const LANEW = { c: (wg.x[1] + B.kitchen.x[0]) / 2 - 0.15, w: 1.8, sill: 1.0, dh: 3.05, win: true };   // [main_corridor-12] 두 짝 + 윗창(영상 b_153·b_154.5 — 아래 베이지 사물함·돌 창턱)
  wallX(wg.x[1] - 0.15, B.kitchen.x[0], fz0, WALL, { face: -1, dado: HALL_DADO, gaps: [LANEW] });   // 뒷길 창(영상 b_154·b_019: 큰 나무틀 창 너머 벽돌벽 — 동쪽은 급식동 벽돌 덩어리)
  // 북쪽 면(급식실) = 옅은 청회색 · [main_corridor-11] 조리실 문 gap이 줄 끝 주석에 삼켜져 '조리실' 팻말이 막힌 벽에 붙어 있었다 → 되살림(영상 b_147·b_150 흰 문)
  wallX(B.kitchen.x[0], CL.x[0] + 0.15, fz0, 0xbcc8ca, { face: -1, dado: HALL_DADO, gaps: [{ c: B.kitchen.dutyRoom.doorC, w: 1.2, color: 0xa9afb5 }, { c: B.kitchen.staffDoorC, w: 1.0, color: 0xf2f2ee },   // 당직실 = 회색 철문(영상 b_150)
    { c: B.kitchen.exitC, w: 1.2, color: 0xf2f2ee }, { c: B.kitchen.doorC, w: 1.8, color: 0xf2f2ee }] });   // 당직실 · 조리실 · 급식실 출구 · 입구(흰 양문 — 영상 b_144·k_15)
  // 마당 쪽 벽: 로비 동쪽 모서리부터 학생자치회 게시판(영상 a_456~460: 로비 유리 바로 동쪽 북벽) → 그 동쪽은 창 + 창 아래 낮은 사물함
  const BOARD = [CL.x[1] + 0.35, CL.x[1] + 5.35];
  // [main_corridor-1] 마당 쪽 창(영상 a_462·a_466.5·a_474·a_496.5): 거의 통유리 — 큰 4짝 창 3.0 + 윗창 줄(winFrame 위 가로살), 창 사이 크림 기둥 0.45.
  //   서→동: 게시판(위는 윗창만 — a_459) → 경보벨 기둥 → 작은 2짝 창(a_462) → 대피도 액자 벽 → 흰 철문(열리지 않음 — a_463.5·a_516) → 소화기 기둥(a_465) → 큰 창 7칸
  const NW0 = 26.8, NWW = 3.0, NPW = 0.45, NBAY = [0, 1, 2, 3, 4, 5, 6].map(k => NW0 + k * (NWW + NPW));   // 큰 창 칸 서끝 x(마지막 칸 동끝 50.5 · 동쪽 끝벽 안쪽 면 50.85)
  const NWIN = [{ c: (BOARD[0] + BOARD[1]) / 2, w: BOARD[1] - BOARD[0] - 0.3, sill: 2.55, dh: 3.05, win: true }, { c: 24.0, w: 1.5, sill: 1.0, dh: 3.05, win: true },
    ...NBAY.map(a => ({ c: a + NWW / 2, w: NWW, sill: 1.0, dh: 3.05, win: true }))];
  wallX(CL.x[1] - 0.15, fx1 + 0.15, fz0, 0xe8e3d7, { gaps: NWIN, face: -1, ext: true, dado: { top: 1.0, lo: HALL_DADO.lo, hi: 0xf3ead2 } });   // 마당·뒤뜰 쪽 겉 = 크림(BACKYARD-30 영상 b_099~106) · 복도 쪽 = 징두리 1.0 + 따뜻한 크림
  // 긴 디테일 상자는 16m 청크 경계에서 자른다(한 조각이 옆 청크까지 뻗으면 그 청크 경계 구가 부풀어 먼 시점에서도 절두체에 든다 — byRot·meshFence와 같은 이유)
  const cut16 = (a, b, f) => { const P = []; for (let u = a; u < b - 1e-6;) { const v = Math.min(b, (Math.floor(u / 16 + 1e-6) + 1) * 16); P.push([u, v]); u = v; }
    for (let i = P.length - 1; i > 0; i--) if (P[i][1] - P[i][0] < 0.1) { P[i - 1][1] = P[i][1]; P.splice(i, 1); } if (P.length > 1 && P[0][1] - P[0][0] < 0.1) { P[1][0] = P[0][0]; P.shift(); } P.forEach(([u, v]) => f(u, v)); };
  const NWINC = NWIN.filter(g => g.sill < 2).map(g => g.c);   // 마당 쪽 창(창턱 1.0) 가운데 — 가운데 마당 블록의 창 아래 상자·홈통 자리(COURT-3)
  // 로비 트임 양끝 짙은 나무 기둥 마감(영상 c_342~344)
  [[CL.x[0] + 0.15, 1], [CL.x[1] - 0.15, -1]].forEach(([x9, f9]) => dBox(0.04, FH - 0.1, 0.34, DKWOOD, x9 + f9 * 0.02, 0, fz0));
  // [main_corridor-9] 동쪽 끝 = 복도 폭 전체 유리(영상 a_478.5·a_480): 가운데 유리 양문 1.3 + 양옆 고정 유리 0.45(은색 틀) — 예전엔 양옆 불투명 벽이라 어두운 구멍처럼 보였다
  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: fz0 + 0.15 + 0.225, w: 0.45, sill: 0, dh: 2.3, win: true, frame: 0xb8bcc0, noLedge: true }, { c: (fz0 + zCor) / 2, w: 1.3, dh: 2.3, glass: true, door: true, slideOver: true },
    { c: zCor - 0.15 - 0.225, w: 0.45, sill: 0, dh: 2.3, win: true, frame: 0xb8bcc0, noLedge: true }], face: 1, skin: 'panelB', innerHex: CLS_WALL });   // 주복도 동쪽 끝 유리문(영상 a_496) · 3학년 뒤벽은 창 없는 막힌 벽(a_492·a_493.5 — classrooms-0)
  // 교실벽(복도 남벽) — 서측 로비 서단(원무실 블록 동벽)부터. 원무실은 로비 북쪽까지 뻗은 블록이라 여기서 빠진다
  const DOORCOL = { '유치원': 0xf2c230, '사랑반': 0xf0a8b8 };   // 유치원 노랑 곰 문·사랑반 분홍 문(영상 IMG_2180 W_207·W_224)
  // [main_corridor-5] 화장실 문 넷(영상 a_456·a_457.5·a_517.5·a_520.5): 남직원(노랑 필름)·여직원(연보라) | 손 씻기 게시판 | 남학생(하늘·분홍 꽃)·여학생(연두·잎)
  //   예전 투명 유리 두 짝은 벽에 뚫린 구멍처럼 보였다 → 필름 색 문(glass 아님) + 스테인리스 문틀. 로비 맞은편(14.6~17.5)은 문 없는 벽 + 파란 테 게시판(a_522)
  const TDOOR = [[18.3, 0xf3dc6a, '남직원', '#3f6fb6'], [19.7, 0xd4bcef, '여직원', '#c9507e'], [22.0, 0xaed6f5, '남학생', '#3f6fb6'], [23.5, 0xc9e69e, '여학생', '#c9507e']];   // 필름 색(문은 조명 무시 — main.js doorInst.film)
  const cGaps = FR.rooms.filter(r => r.span[0] >= LOB_X0 - 0.01 && r.type !== 'toilet').map(r => r.type === 'hall' ? { c: hc, w: 3.32, dh: 2.5 } : { c: r.span[0] + 1.9, w: 1.2, color: DOORCOL[r.name] });
  FR.rooms.filter(r => twoDoor(r) && r.span[0] >= LOB_X0 - 0.01).forEach(r => cGaps.push({ ...backDoor(r), color: DOORCOL[r.name] }));
  TDOOR.forEach(([c, col]) => cGaps.push({ c, w: 0.9, color: col, tf: true }));
  // [main_corridor-0] 행정실·교장실·교무실 복도 쪽 실내창(영상 b_141·b_148.5·b_150·b_151.5): 문 옆부터 나무틀 창 + 아랫칸 격자 시트
  const offWinsOf = r => { if (r.type !== 'office' || r.kinderOffice) return [];
    const a = r.span[0] + 1.9 + 0.6 + 0.35, L = r.span[1] - 0.45 - a; if (L < 1.2) return [];   // 교장실(0.8)은 건너뜀
    const n = L >= 2.8 ? 2 : 1, w = (L - (n - 1) * 0.6) / n;
    return Array.from({ length: n }, (_, k) => ({ c: a + w / 2 + k * (w + 0.6), w, sill: 1.1, dh: 2.8, win: true, frame: k === 0 ? 0x8a98a4 : 0x7a5a3e })); };   // 문 옆 첫 칸 = 회청색 틀(먹 번짐 판 틀 — b_141·b_151.5 · 먹 번짐 무늬는 새 무늬 = 드로우콜이라 뺐다)
  const offWins = FR.rooms.flatMap(offWinsOf);
  wallX(LOB_X0 - 0.15, fx1 - 0.15, zCor, CLS_WALL, { gaps: [...cGaps, ...corWins(), ...offWins], face: 1 });
  doors.forEach(d => { if (d.ax === 'x' && Math.abs(d.cz - zCor) < 0.01 && TDOOR.some(([c]) => Math.abs(d.cx - c) < 0.01)) d.film = true; });   // [main_corridor-5] 화장실 필름 유리문 = 조명 무시 문짝(북향 면이 회색 판으로 보이던 것)   // + 교실 복도 쪽 실내창(classrooms-1) · 복도 쪽 면은 아래 조명 무시 무늬판이 덮으므로 한 겹(징두리 두 톤 상자 불필요 — 삼각형 절약)
  { // [main_corridor-2] 복도 남벽 복도 쪽 면 = 조명 무시 판(천장과 같은 이유): 이 면은 북(-z)을 봐서 해를 못 받아 반구광만 — 렌더 윗벽 #867f77 회보라·징두리 #776b40 올리브였다.
    //   영상 a_474: 북창 빛을 받는 남벽이 복도에서 가장 밝다(크림 #adaa9b ≈ 바닥 #afafb3 · 민트 징두리 #adc1a1 + 세로 홈 10cm).
    //   새 무늬(=메시·드로우콜)를 만들지 않고 기존 조명 무시 무늬를 UV로 골라 쓴다: 크림 = cflat 민짜 칸(줄눈 없는 UV), 징두리 = ctile T바 줄을 10cm 세로 홈으로(가로 줄은 피한 UV)
    //   벽 면 4mm 앞 · 문·창 구멍과 현관 아치(짙은 나무 판이 덮음)는 건너뛴다. 유치원·사랑반 징두리는 벽 그림(mural) 자리
    const k0 = FR.rooms.find(r => r.name === '유치원').span[0], k1 = FR.rooms.find(r => r.name === '사랑반').span[1];
    const SWZ = zCor - 0.154, DY = 1.1, CY = FH - 0.16, X0 = LOB_X0 + 0.15, X1 = fx1 - 0.15, ops = [...cGaps, ...corWins(), ...offWins, { c: hc, w: HX1 - HX0 - 0.3, sill: 0, dh: CY }];
    const skinQ = (kind, a, b, y0, y1) => { const D9 = kind === 'corDadoS';
      patPush(D9 ? 'ctile' : 'cflat', [[a, y0, SWZ], [b, y0, SWZ], [b, y1, SWZ], [a, y1, SWZ]], D9 ? [[a / 0.2, 0.12], [b / 0.2, 0.12], [b / 0.2, 0.38], [a / 0.2, 0.38]] : [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1],
        D9 ? 0xb9d3a2 : kind === 'strip' ? 0xeceeec : 0xe6e0cd); };   // strip = 손잡이 뒤 옅은 회백 띠(a_466.5·a_474 — 상자 대신 판 띠로: 삼각형 절약)
    const RS = [0.78, 0.92];
    const ys = [...new Set([0, DY, CY, ...RS, ...ops.flatMap(g => [g.sill ?? 0, g.dh ?? 2.6])])].filter(y => y >= 0 && y <= CY).sort((p, q) => p - q), bands = [];
    for (let i = 0; i + 1 < ys.length; i++) { const y0 = ys[i], y1 = ys[i + 1], ym = (y0 + y1) / 2; if (y1 - y0 < 0.004) continue;
      const kind = ym > RS[0] && ym < RS[1] ? 'strip' : ym < DY ? 'corDadoS' : 'corWallS', sk = ops.filter(g => (g.sill ?? 0) <= ym && Math.min(g.dh ?? 2.6, CY) >= ym).map(g => [g.c - g.w / 2, g.c + g.w / 2]);
      if (ym < DY) sk.push([k0 + 0.15, k1]);
      sk.sort((p, q) => p[0] - q[0]); const key = kind + JSON.stringify(sk), last = bands[bands.length - 1];
      if (last && last.key === key && Math.abs(last.y1 - y0) < 1e-6) last.y1 = y1; else bands.push({ key, kind, sk, y0, y1 }); }   // 구멍 목록이 같은 띠는 합침(사각형 수 절약)
    for (const { kind, sk, y0, y1 } of bands) { let a = X0;
      for (const [u, v] of [...sk, [X1, X1]]) { if (Math.min(u, X1) - a > 0.01) skinQ(kind, a, Math.min(u, X1), y0, y1); a = Math.max(a, v); } }
    const sk = cGaps.filter(g => g.c > k0 && g.c < k1).map(g => [g.c - g.w/2, g.c + g.w/2]).sort((a, b) => a[0] - b[0]);   // 유치원·사랑반 앞 복도 벽 그림(징두리 자리)
    let a = k0 + 0.15; for (const [u, v] of [...sk, [k1, k1]]) { if (u - a > 0.2) patWall('mural', 'x', a, u, 0.02, 1.08, zCor - 0.162, -1); a = v; }
    // [main_corridor-14] 징두리 위 갈색 몰딩(영상 a_474·b_142.5) + 둥근 나무 손잡이(뒤 회백 띠는 위 벽 판의 strip 띠)
    const WF = zCor - 0.15, CLO = 24.8;   // CLO = 화장실|컴퓨터실 사이 흰 창고 문 x
    const dsk = [...cGaps.map(g => [g.c - g.w / 2 - (g.tf ? 0.06 : 0), g.c + g.w / 2 + (g.tf ? 0.06 : 0)]), [HX0 + 0.15, HX1 - 0.15], [CLO - 0.47, CLO + 0.47]].sort((p, q) => p[0] - q[0]);
    const runs = []; let u0 = X0; for (const [u, v] of [...dsk, [X1, X1]]) { if (u - u0 > 0.3) runs.push([u0, Math.min(u, X1)]); u0 = Math.max(u0, v); }
    runs.forEach(([u, v]) => { const c = (u + v) / 2, L = v - u;
      dBox(L, 0.05, 0.04, 0x7a5a42, c, 1.05, WF - 0.02);                       // 몰딩(징두리 윗선 — 윗면 = 실내창 창턱 1.1: 사이 1cm 띠가 반짝이지 않게)
      if (L < 0.5) return;
      dRod(u + 0.08, 0.86, WF - 0.028, v - 0.08, 0.86, WF - 0.028, 0.024, 0x9a6440); });   // 둥근 손잡이(벽 판 띠에 붙임 — 받침 상자는 삼각형 예산 때문에 뺐다)
    [...corWins(), ...offWins].forEach(g => dBox(g.w, 0.03, 0.1, 0x7a5a42, g.c, 1.1, zCor - 0.15));   // 실내창 나무 창턱 판(몰딩 위 · 창틀 앞면까지 — a_474)
    // 화장실 문틀(스테인리스)·문 위 이름표·둥근 '화장실' 돌출 팻말 + 손 씻기 게시판(a_519) + 로비 맞은편 파란 테 게시판(a_522)
    TDOOR.forEach(([c, , nm, fg]) => { [-1, 1].forEach(s => dBox(0.05, 2.6, 0.04, 0xe2e6ea, c + s * 0.475, 0, WF - 0.02)); dBox(1.0, 0.05, 0.04, 0xe2e6ea, c, 2.6, WF - 0.02);   // 북(-z)을 봐서 어둡게 렌더 → 밝은 은색
      sign(nm, c, 2.82, WF - 0.02, Math.PI, 0.13, { bg: '#ffffff', fg }); });
    [19.05, 22.9].forEach(x => { const s9 = sign('화장실', x, 2.78, zCor, Math.PI / 2, 0.24, { bg: '#ffffff', fg: '#2f6fd0' }); s9.m.position.z = zCor - (s9.w / 2 + 0.17); s9.m.updateMatrix(); });
    // [main_corridor-4] 교실 문 위 채광창(영상 a_477·a_480 — 문 위 나무틀 유리 띠): 인방 복도 쪽 면에 조명 무시 판 두 장(나무틀 + 유리) — 문마다 삼각형 4개·새 메시 0
    //   (문 폭·두 짝 이음·색은 교실 담당 결정(classrooms-19 쪽창·꿀색)을 그대로 둔다 · 유치원·사랑반 색 문은 영상 확인 전이라 뺌)
    FR.rooms.filter(r => twoDoor(r) && r.span[0] >= LOB_X0 - 0.01 && !DOORCOL[r.name]).forEach(r => [{ c: r.span[0] + 1.9, w: 1.2 }, backDoor(r)].forEach(g => {
      const q = (a, b, y0, y1, z, tint) => patPush('cflat', [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1], tint);
      q(g.c - g.w / 2 - 0.05, g.c + g.w / 2 + 0.05, 2.63, 3.07, zCor - 0.16, 0x6a4c36);          // 나무틀
      q(g.c - g.w / 2 + 0.02, g.c + g.w / 2 - 0.02, 2.69, 3.01, zCor - 0.164, 0xb4c3ca); }));   // 유리(천장 빛이 비친 옅은 청회)
    frameBoard('x', 20.3, 21.4, WF, -1, 1.2, 2.2, 0x8fb4e0, 'kidsArt');
    frameBoard('x', 15.3, 16.9, WF, -1, 1.15, 2.3, 0x4f86c6, 'photoB');
    // [main_corridor-8] 화장실|컴퓨터실 사이 흰 창고 문(열리지 않음 — a_463.5·a_516) · [main_corridor-24] 컴퓨터실 앞문 옆 검은 번호키(a_465)
    dBox(0.9, 2.1, 0.04, 0xf0f0ec, CLO, 0, WF - 0.02); dBox(0.13, 0.03, 0.05, 0x9a9ea3, CLO + 0.3, 1.0, WF - 0.065);   // 레버 손잡이
    patPush('cflat', [[CLO - 0.43, 0.02, WF - 0.044], [CLO + 0.43, 0.02, WF - 0.044], [CLO + 0.43, 2.08, WF - 0.044], [CLO - 0.43, 2.08, WF - 0.044]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, -1], 0xf4f4f0);   // 앞면 = 조명 무시 흰 판(북향이라 회색으로 보이던 것 — a_516)
    { const cd = FR.rooms.find(r => r.type === 'computer').span[0] + 1.9; dBox(0.07, 0.2, 0.03, 0x1e1e22, cd + 0.72, 1.14, WF - 0.015); }
  }
  lockerBank('x', LOB_X + 0.2, STX0 - 0.3, fz0 + 0.15, 1, 0.85, 2, null, 0xd2bc98, 0xeadabb, true);   // 도서관 복도창 아래 자작나무색 사물함(영상 b_1xx)
  // 원무실 블록(영상 IMG_2180 213~216s): 로비 서쪽 끝 = 원무실 동벽의 '병설유치원' 짙은 유리 양문, 북쪽 = 측문 통로
  wallX(fx0 + 0.15, LOB_X0 + 0.15, KBZ, INNER);
  wallZ(KBZ, zCor, LOB_X0, INNER, { gaps: [{ c: (KBZ + zCor) / 2, w: 1.8, color: 0x4a4640 }] });   // 짙은 연기색 유리 양문(영상 W_213~215 — 안이 안 보임)
  sign('정림초등학교병설유치원', LOB_X0 + 0.22, 2.75, (KBZ + zCor) / 2, Math.PI / 2, 0.22, { bg: '#f2f2ee', fg: '#333333' });
  sign('원무실', LOB_X0 + 0.2, 2.42, (KBZ + zCor) / 2 - 1.05, Math.PI / 2, 0.12, { bg: '#f2f2ee', fg: '#333333' });   // 서쪽을 보면 문 오른쪽(북쪽 벽기둥) 위 모서리(영상 W_213.0·W_214.5)
  dBox(0.4, 0.5, 0.3, 0x222222, LOB_X0 + 0.37, 0, -34.9); colliders.push(noStand({ x0: LOB_X0 + 0.17, x1: LOB_X0 + 0.57, y0: 0, y1: 0.5, z0: -35.05, z1: -34.75 }));   // 검은 우산통 — 문 오른쪽(북쪽) 문짝 앞, 문 개구(-34.65) 밖
  { // [main_corridor-13·21] 복도 바닥(영상 a_462·a_474·a_507·b_141): 흰 타일 가로 3장(≈52cm) + 양쪽 벽 따라 짙은 녹흑 대리석 띠(≈0.31, 트임 앞도 이어짐) + 가운데 줄 8장마다 흐린 적갈 타일
    //   + 컴퓨터실|1학년 사이 짙은 회색 가로띠(a_471) + 화장실 문 앞 노란 블록(a_460.5·a_517.5)
    //   새 무늬 없이 tileW(흰 타일)·tactX(노란 블록)를 UV만 바꿔 쓴다(타일 T = 흰 칸 폭/3 · 줄눈 = 흰 칸 경계에서 시작)
    const cx0 = LOB_X0 + 0.15, cx1 = fx1 - 0.15, zN = fz0 + 0.15, zS = zCor - 0.15, zW0 = zN + 0.31, zW1 = zS - 0.31, T = (zW1 - zW0) / 3, S = 2 * T, za = zW0 + T, zb = zW0 + 2 * T;
    addPanel(cx1 - cx0, zW0 - zN, 0x243029, (cx0 + cx1)/2, 0.012, (zN + zW0)/2);
    addPanel(cx1 - cx0, zS - zW1, 0x243029, (cx0 + cx1)/2, 0.012, (zW1 + zS)/2);
    const fq = (x0, x1, z0, z1, tint = 0xffffff, tact = false) => patPush(tact ? 'tactX' : 'tileW', [[x0, 0.012, z0], [x1, 0.012, z0], [x1, 0.012, z1], [x0, 0.012, z1]],
      tact ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[x0 / S, -(z0 - zW0) / S], [x1 / S, -(z0 - zW0) / S], [x1 / S, -(z1 - zW0) / S], [x0 / S, -(z1 - zW0) / S]], [0, 1, 0], tint);
    const row = (z0, z1, spec) => { let x = cx0;
      for (const k of [...spec.keys()].sort((p, q) => p - q)) { const a = k * T, b = (k + 1) * T; if (a < cx0 || b > cx1) continue;
        if (a - x > 0.005) fq(x, a, z0, z1); const t9 = spec.get(k); t9 === 'tact' ? fq(a, b, z0, z1, 0xd8cca8, true) : fq(a, b, z0, z1, t9); x = b; }
      if (cx1 - x > 0.005) fq(x, cx1, z0, z1); };
    const side = new Map([[Math.round(33.8 / T), 0x6a6d72]]), mid = new Map(side);
    for (let k = Math.ceil(cx0 / T); (k + 1) * T <= cx1; k++) if (((k % 8) + 8) % 8 === 0 && !mid.has(k)) mid.set(k, 0xc49c84);
    TDOOR.forEach(([c]) => mid.set(Math.floor(c / T), 'tact'));
    const sideS = new Map(side);   // 남쪽 줄(교실·사무실 문 쪽)
    FR.rooms.filter(r => r.name === '행정실' || r.name === '교장실').forEach(r => sideS.set(Math.floor((r.span[0] + 1.9) / T), 'tact'));   // 행정실·교장실 문 앞 노란 블록(문 쪽 줄 — 영상 b_147·b_151.5)
    row(zW0, za, side); row(za, zb, mid); row(zb, zW1, sideS);
    floorQ('tileW', LOB_X0 + 0.15, LOB_X - 0.15, LOB_Z + 0.15, zN);          // 서측 로비
    floorQ('tileW', fx0 + 0.15, LOB_X0 + 0.15, VZ[0] + 0.15, KBZ - 0.15);   // 측문 통로(로비 바닥과 맞댐)
    for (let x9 = LOB_X0 + 2.0; x9 <= fx1 - 1; x9 += 3.6) x9 > CL.x[1] + 1   // 복도 사각 등(영상 a_457) · [main_corridor-25] 로비 동쪽은 60cm 텍스 한 칸 크기 정사각 평판(a_462·a_474 — 칸 가운데 z -32.7에 맞춤)
      ? lamp(0.56, 0.05, 0.56, x9, FH - 0.21, Math.round(((fz0 + zCor) / 2 - 0.3) / 0.6) * 0.6 + 0.3) : lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (fz0 + zCor) / 2);
  }
  { // 현관 돌출부(영상 p_149~161·e_312~324): 짙은 나무 판 상자 → 움푹한 포털(2단 계단·양옆 신발장) → 유리 벽·양문 → 전실(체크 매트) → 자동문 → 홀
    const [bx0, bx1] = EN.x, [bz0, bz1] = EN.z, [rx0, rx1] = RC.x, rzg = RC.z[0];   // rzg = 바깥 유리 벽 줄(-22.6)
    const DKW = (w, h, d, cx, y, cz) => addBox(w, h, d, DKWOOD, cx, y, cz);
    // hall_lobby 전용 무늬 = 아틀라스 한 장('hallAt' · 512px 네 칸) — 무늬 종류(=드로우콜)를 하나만 늘리고(옛 photoB 자리) 되풀이 대신 칸 하나를 사각형 하나에 붙인다.
    //   칸 0 = 전실 적갈·크림 체크 매트(8cm = 16px · 가장자리 한 칸 여백 = 밉맵 번짐 막이) · 칸 1 = 사진 게시판 한 판 · 칸 2 = 홀 신발장 문 · 칸 3 = 포털 신발장 문
    //   로비 45° 테라초는 새 무늬 대신 tileG 좌표를 45° 돌려 붙인다(hall_lobby-11). 석재판·윗단 판·점자는 기존 무늬(tileW·panelB·tactX)
    Object.assign(PATDEF, {
      hallAt: [1, 512, false, (g, N, R) => {
        for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = (i + j) % 2 ? '#8e5a4e' : '#e8dfcf'; g.fillRect(i*16, j*16, 16, 16); }   // 0: 전실 매트(영상 e_322.5·e_323)
        g.fillStyle = '#2f6e4f'; g.fillRect(256, 0, 256, 256);                                     // 1: 초록 게시판 바탕 + 윗변 구름꼴 연두 판 + 사진 5×4 + 제목 띠(영상 e_334·e_338)
        g.fillStyle = '#e3edc0'; g.fillRect(272, 58, 224, 182); [[296, 30], [344, 22], [392, 26], [440, 20], [478, 32]].forEach(([x, r]) => { g.beginPath(); g.arc(x, 60, r, Math.PI, 0); g.fill(); });
        g.fillStyle = '#6f9a4f'; g.fillRect(330, 50, 108, 14);
        for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { g.fillStyle = pick(['#5a5e62', '#63676a', '#54585c', '#6d6a5e', '#4f5a60'], R); g.fillRect(286 + i*41, 78 + j*40, 34, 31); g.fillStyle = 'rgba(230,236,240,0.35)'; g.fillRect(289 + i*41, 81 + j*40, 28, 9); }
        g.fillStyle = '#d7a268'; g.fillRect(0, 256, 256, 256);                                     // 2: 홀 신발장 칸문 = 꿀색 단풍 + 은색 둥근 꼭지 + 이름표(영상 e_326.5·e_330)
        for (let k = 0; k < 26; k++) { g.fillStyle = pick(['rgba(150,96,48,0.25)', 'rgba(222,170,110,0.3)'], R); g.fillRect(16 + R()*224, 256, 1 + R()*2, 256); }
        g.fillStyle = '#5a3a22'; g.fillRect(0, 256, 256, 19); g.fillRect(0, 493, 256, 19); g.fillRect(0, 256, 19, 256); g.fillRect(237, 256, 19, 256);   // 칸 사이 틈(여백까지 같은 색)
        g.fillStyle = '#e8eaec'; g.fillRect(100, 290, 56, 20); g.strokeStyle = '#9aa0a6'; g.lineWidth = 2; g.strokeRect(100, 290, 56, 20);
        g.fillStyle = '#9aa0a6'; g.beginPath(); g.arc(206, 392, 13, 0, 7); g.fill(); g.fillStyle = '#dfe3e6'; g.beginPath(); g.arc(204, 389, 9, 0, 7); g.fill();
        g.fillStyle = '#b27a4c'; g.fillRect(256, 256, 256, 256);                                   // 3: 포털 신발장 칸문(세로로 긴 문을 눌러 그림) = 붉은 갈색 나무결 + 왼쪽 은색 세로 막대 손잡이 + 빈 은색 명찰틀 셋(영상 e_318.5·e_320)
        for (let k = 0; k < 30; k++) { g.fillStyle = pick(['rgba(120,66,32,0.25)', 'rgba(214,150,96,0.25)'], R); g.fillRect(272 + R()*224, 256, 1 + R()*3, 256); }
        g.fillStyle = '#4a2a18'; g.fillRect(256, 256, 256, 19); g.fillRect(256, 493, 256, 19); g.fillRect(256, 256, 19, 256); g.fillRect(493, 256, 19, 256);
        g.fillStyle = '#6b7075'; g.fillRect(290, 296, 22, 62); g.fillStyle = '#e2e6ea'; g.fillRect(290, 298, 17, 58); g.fillStyle = '#a4aab0'; g.fillRect(301, 302, 4, 50);
        [0.2, 0.56, 0.9].forEach(t => { const y = 496 - t * 224 - 5; g.fillStyle = '#80878d'; g.fillRect(360, y, 62, 10); g.fillStyle = '#c9ced2'; g.fillRect(363, y + 2, 56, 6); }); }],
    });
    // 아틀라스 칸 k의 [u0,u1]×[v0,v1](0~1, v = 위쪽)을 사각형 pts(patPush 순서)에 붙인다 — 칸마다 16px 여백
    const atQ = (k, pts, n, uv = [0, 1, 0, 1]) => { const ox = (k % 2) * 0.5, oy = k < 2 ? 0.5 : 0, p = 16 / 512, s = 224 / 512, U = t => ox + p + t * s, V = t => oy + p + t * s;
      patPush('hallAt', pts, [[U(uv[0]), V(uv[2])], [U(uv[1]), V(uv[2])], [U(uv[1]), V(uv[3])], [U(uv[0]), V(uv[3])]], n, 0xffffff); };
    // 옆벽(두께 0.5 — 전실 옆면 + 포털 옆면). PORCH-2(영상 p_152·p_154·e_318·p_160): 포털 옆은 큰 유리창 — 아래 반투명 흰 유리(안쪽 신발장 등판을 가림)·위 투명(신발장 위로 바깥이 보임)
    const WZ0 = rzg + 0.15, WZ1 = bz1 - 0.65, WS = 0.15, WH = 2.8, wc = (WZ0 + WZ1)/2, ww = WZ1 - WZ0;
    const sideWall = (xo, xi, f) => {                                         // xo = 바깥 면 x, xi = 포털 안쪽 면 x, f = 바깥 방향(서 -1·동 +1)
      const xm = (xo + xi)/2, th = Math.abs(xo - xi);
      DKW(th, FH, WZ0 - bz0, xm, 0, (bz0 + WZ0)/2);                          // 뒤(전실 옆)
      DKW(th, FH, bz1 - WZ1, xm, 0, (WZ1 + bz1)/2);                          // 앞 모서리 기둥
      DKW(th, WS, ww, xm, 0, wc); DKW(th, FH - WH, ww, xm, WH, wc);           // 창턱 아래·인방
      glassPane('z', ww, WH - WS, wc, WS, xm);
      const fb = (z0, z1, y0, y1) => dBox(0.2, y1 - y0, z1 - z0, 0x9aa0a6, xm, y0, (z0 + z1)/2);
      fb(WZ0, WZ0 + 0.06, WS, WH); fb(WZ1 - 0.06, WZ1, WS, WH); fb(WZ0 + 0.06, WZ1 - 0.06, WH - 0.06, WH); fb(WZ0 + 0.06, WZ1 - 0.06, WS, WS + 0.06);
      fb(WZ0 + 0.06, WZ1 - 0.06, 1.75, 1.81);                                 // 반투명/투명 경계 가로살(신발장 높이)
      dBox(0.04, 1.75 - WS - 0.06, ww - 0.12, 0xdce5ea, xm, WS + 0.06, wc);    // 아래 반투명 흰 유리
      dBox(0.03, WH - WS, 0.06, BLUE, xo + f*0.015, WS, WZ0 - 0.03);            // 창 뒤쪽 세로 파랑 테(영상 p_152)
      [[xo, f], [xi, -f]].forEach(([xx, ff]) => {                              // 큰 판 무늬(woodP) — 창 자리는 비움
        patWall('woodP', 'z', xx === xo ? bz0 + 0.2 : bz1 - 2.6, WZ0, 0, FH, xx + ff*0.012, ff); patWall('woodP', 'z', WZ1, bz1, 0, FH, xx + ff*0.012, ff);
        patWall('woodP', 'z', WZ0, WZ1, 0, WS, xx + ff*0.012, ff); patWall('woodP', 'z', WZ0, WZ1, WH, FH, xx + ff*0.012, ff);
      });
      dBox(0.06, 0.1, bz1 - bz0 - 0.5, BLUE, xo + f*0.03, FH + 0.2, (bz0 + 0.5 + bz1)/2);   // 옆면 윗선 파랑 띠(영상 p_152·p_154 — 앞면 띠와 이어짐 · 본관 처마 끝(z -23.6)과 안 겹치게)
    };
    sideWall(bx0, rx0, -1); sideWall(bx1, rx1, 1);
    [[bx0, rx0], [rx1, bx1]].forEach(([a, b]) => patWall('woodP', 'x', a, b, 0, FH, bz1 + 0.012, 1));
    addBox(rx1 - rx0, FH - 2.9, 0.3, DKWOOD, (rx0 + rx1)/2, 2.9, bz1 - 0.15);    // 포털 앞 윗가림
    patWall('woodP', 'x', rx0, rx1, 2.9, FH, bz1 + 0.012, 1);
    patQuad('cwood', rx0, rx1, rzg + 0.15, bz1 - 0.3, 2.9, true);              // 포털 천장(짙은 나무)
    colliders.push({ x0: rx0, x1: rx1, y0: 2.9, y1: FH, z0: rzg + 0.15, z1: bz1 - 0.3 });
    lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 - 0.9, 2.86, (rzg + bz1)/2); lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 + 0.9, 2.86, (rzg + bz1)/2);
    addBox(bx1 - bx0, 0.3, bz1 - bz0, 0x2f2a26, (bx0 + bx1)/2, FH, (bz0 + bz1)/2);   // 돌출부 지붕
    dBox(bx1 - bx0 - 0.16, 0.03, bz1 - 0.08 - RC.z[0], 0xdcdedb, (bx0 + bx1)/2, FH + 0.3, (RC.z[0] + bz1 - 0.08)/2, { far: true });   // 윗면 흰 지붕재 = 포털 위만(위성 D: 앞쪽 흰 사각형 · FRONT-3)
    dBox(bx1 - bx0 - 0.16, 0.03, RC.z[0] - bz0 - 0.08, 0x2f8a68, (bx0 + bx1)/2, FH + 0.3, (bz0 + 0.08 + RC.z[0])/2, { far: true });   // 전실 위 = 본관 지붕과 같은 초록(위성 D 뒤쪽)
    dBox(bx1 - bx0 + 0.12, 0.1, 0.06, BLUE, (bx0 + bx1)/2, FH + 0.2, bz1 + 0.03);     // 윗선 파랑 띠(영상 p_152 — 양 모서리는 옆면 띠까지 덮음)
    // 포털 바닥 = 짙은 고무 매트, 앞 2단(YARD → -0.15 → 0)
    floorQ('gmat', rx0, rx1, rzg + 0.15, bz1 - 0.4);
    addBox(rx1 - rx0, -0.15 - YARD, 0.4, DKWOOD, (rx0 + rx1)/2, YARD, bz1 - 0.2);   // 아랫단 — 챌면 짙은 나무(영상 e_316·p_158)
    patQuad('gmat', rx0, rx1, bz1 - 0.4, bz1, -0.15 + 0.012);
    dBox(rx1 - rx0 - 0.06, 0.14, 0.03, DKWOOD, (rx0 + rx1)/2, -0.15, bz1 - 0.385);   // 윗단 챌면 나무판
    // 양옆 신발장(2단 문 — 영상 e_316~321·p_158~161): 바깥 유리 벽 앞에서 계단 쪽으로 2m
    //   hall_lobby-33(영상 e_318.5·e_320 확대): 칸문 = 아틀라스 칸 3(붉은 갈색 나무결 + 은색 세로 막대 손잡이 + 빈 은색 명찰틀 셋) — 손잡이는 보는 사람 왼쪽(서·동 모두)
    //   예전 칸문·손잡이·명찰틀 상자 144개(삼각형 ≈1700)를 칸마다 사각형 하나로(몸통 앞면 5mm 앞)
    [[rx0, 1], [rx1, -1]].forEach(([wall, f]) => {
      const a0 = rzg + 0.2, a1 = rzg + 2.2, D = 0.45, H = 1.75, n = 6, cw = (a1 - a0) / n, rh = (H - 0.1) / 2, fx = wall + f * (D + 0.005);
      colliders.push(noStand({ x0: Math.min(wall, wall + f * D), x1: Math.max(wall, wall + f * D), y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, H, a1 - a0, 0x8a5236, wall + f * D / 2, 0, (a0 + a1) / 2);
      for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { const z0 = a0 + cw * i, z1 = z0 + cw, y0 = 0.08 + rh * r, y1 = y0 + rh;
        atQ(3, [[fx, y0, z0], [fx, y0, z1], [fx, y1, z1], [fx, y1, z0]], [f, 0, 0], f > 0 ? [1, 0, 0, 1] : [0, 1, 0, 1]); }
    });
    // 바깥 유리 벽: 양옆 둥근 무늬 반투명 판 + 가운데 스테인리스 양문("우리학교 방문을 환영합니다")
    wallX(rx0, rx1, rzg, DKWOOD, { h: FH, inner: true, face: 1, gaps: [{ c: hc, w: 1.7, glass: true, door: true, dh: 2.5, slideOver: true }, { c: (rx0 + hc - 1.0)/2, w: hc - 1.0 - rx0, sill: 0, dh: 2.5, win: true, frame: 0xc9ced3 }, { c: (hc + 1.0 + rx1)/2, w: rx1 - hc - 1.0, sill: 0, dh: 2.5, win: true, frame: 0xc9ced3 }] });   // hall_lobby-29: 틀 = 밝은 스테인리스(영상 e_318·e_323)
    dBox(rx1 - rx0 - 0.04, 0.25, 0.05, 0xc9ced3, hc, 2.5, rzg + 0.175);            // 문 위 스테인리스 인방 띠(바깥 면)
    sign('우리학교 방문을 환영합니다', hc, 2.625, rzg + 0.215, 0, 0.16, { bg: '#f3e6ef', fg: '#4a5a9a' });   // 문 위 인방(문짝에 붙이면 열릴 때 공중에 뜬다)
    sign('CCTV 작동중', hc + 1.25, 2.625, rzg + 0.215, 0, 0.07, { bg: '#ffffff', fg: '#c0392b' });              // 문 오른쪽 위 작은 안내(영상 e_320·e_322)
    // hall_lobby-29(영상 e_318.5·e_323): 양옆 고정 유리 = 흰 반투명 필름(유리 속 불투명 판 두 면으로 흉내 — 안의 짙은 옆벽이 비치지 않게) + 바깥 면 흰 원호·동그라미
    [[rx0, hc - 1.0, 1], [hc + 1.0, rx1, -1]].forEach(([a9, b9, sd]) => {             // sd = 문 쪽 방향
      const c9 = (a9 + b9) / 2, w9 = b9 - a9 - 0.14, pl = new THREE.PlaneGeometry(w9, 2.36);
      dGeo(pl, new THREE.Matrix4().makeTranslation(c9, 1.25, rzg + 0.004), 0xdbe4e1); dGeo(pl, new THREE.Matrix4().makeTranslation(c9, 1.25, rzg - 0.004).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), 0xd3dcd9); pl.dispose();
      [[0.52, 0.035, c9 + sd * 0.3, 1.55, sd > 0 ? 1.7 : -0.46, 1.9, 16], [0.13, 0.025, c9 - sd * 0.08, 0.5, 0, 6.3, 12], [0.07, 0.02, c9 - sd * 0.08, 0.5, 0, 6.3, 10], [0.1, 0.022, c9 + sd * 0.12, 0.95, 0, 6.3, 10]].forEach(([r9, t9, x9, y9, th0, thl, sg]) => {
        const rg = new THREE.RingGeometry(r9 - t9, r9, sg, 1, th0, thl); dGeo(rg, new THREE.Matrix4().makeTranslation(x9, y9, rzg + 0.01), 0xf6f8f7, { flat: true }); rg.dispose(); });
    });
    // 전실(바깥문 ~ 자동문): 흑백 체크 매트. 자동문 양옆 고정 유리
    //   hall_lobby-14: 자동문 = 정면 벽 줄에 맞댐(EZI -24.15) → 전실 ≈1.25m(영상 e_322.5·e_323: 바깥문 바로 뒤 자동문)
    wallX(HX0 + 0.15, HX1 - 0.15, EZI, INNER, { gaps: [{ c: hc, w: 1.8, glass: true, door: true, slideOver: true }, { c: (HX0 + 0.15 + hc - 1.05)/2, w: hc - 1.05 - HX0 - 0.15, sill: 0, dh: 2.6, win: true, frame: 0xc9ced3 }, { c: (hc + 1.05 + HX1 - 0.15)/2, w: HX1 - 0.15 - hc - 1.05, sill: 0, dh: 2.6, win: true, frame: 0xc9ced3 }] });
    dBox(rx1 - rx0 - 0.04, 0.2, 0.03, 0xc9ced3, hc, 2.6, EZI + 0.165);             // 문 위 스테인리스 인방(전실 쪽)
    sign('외부인출입금지', hc + 1.5, 1.08, EZI + 0.112, 0, 0.1, { bg: '#ffffff', fg: '#c0392b' });   // 오른쪽 고정 유리 눈높이 스티커(영상 e_325.5)
    sign('자동문', hc + 1.5, 0.9, EZI + 0.112, 0, 0.07, { bg: '#f2c230', fg: '#2f5fa0' });
    floorQ('gmat', rx0, rx1, EZI + 0.15, rzg - 0.15, 0, 0x8a8580);                  // 전실 바닥 = 짙은 회색 테두리
    { const mx0 = rx0 + 0.12, mx1 = rx1 - 0.12, mz0 = EZI + 0.27, mz1 = rzg - 0.27, T9 = 1.12;   // 적갈·크림 체크 매트(영상 e_322.5·e_323) = 아틀라스 칸 0(한 장 1.12m = 14칸 — 이어 붙여도 칸 순서가 맞음)
      for (let x9 = mx0; x9 < mx1 - 0.01; x9 += T9) { const x1 = Math.min(mx1, x9 + T9);
        atQ(0, [[x9, 0.024, mz1], [x1, 0.024, mz1], [x1, 0.024, mz0], [x9, 0.024, mz0]], [0, 1, 0], [0, (x1 - x9) / T9, 0, (mz1 - mz0) / T9]); } }
    // 앞 포장 + 빨강·초록 고무 매트 + 노랑 우산꽂이(영상 e_313~316)
    patQuad('pave', bx0, bx1, bz1, SCHOOL.frontYard.walkN, YARD + 0.02);
    patQuad('rmat', hc - 1.2, hc + 1.2, bz1 + 0.02, bz1 + 1.1, YARD + 0.032);
    addBox(0.4, 0.55, 0.3, YEL, bx0 + 0.3, YARD, bz1 + 0.35, NS);
    zones.push({ x0: rx0, x1: rx1, z0: rzg, z1: bz1, y: 0, label: '현관 앞' });
    zones.push({ x0: rx0, x1: rx1, z0: fz1, z1: rzg, y: 0, label: '현관 전실', extra: true });   // hall_lobby-32: 바깥문~자동문(예전엔 '앞뜰 산책로'로 나왔다) · extra = '앞뜰 산책로' 띠 안에 일부러 포갠 작은 구역(판정은 좁은 쪽이 이김 — 겹침 셈 제외)
    hotspots.push({ kind: 'shoes', x: hc, z: rzg + 1.3, y: 0, r: 1.2, label: '실내화로 갈아신기' });   // 신발장 앞(우리 학교 등교 첫 동작)
  }
  { // 현관 홀(영상 e_325~341 · hall_lobby 09-24): 크림 광택 타일 + 나침반, 서쪽 = 수납장·호두색 진열장·사진 게시판·안내 책꽂이, 동쪽 = 음수대·진열장·신발장(검은 상판·화분), 북끝 = 짙은 나무 아치
    const hx0 = HX0 + 0.15, hx1 = HX1 - 0.15, hz0 = zCor + 0.15, hz1 = EZI - 0.15, hzm = (hz0 + hz1) / 2;
    const atQ = (k, pts, n, uv = [0, 1, 0, 1]) => { const ox = (k % 2) * 0.5, oy = k < 2 ? 0.5 : 0, p = 16 / 512, s = 224 / 512, U = t => ox + p + t * s, V = t => oy + p + t * s;   // 아틀라스 'hallAt' 칸 붙이기(현관 블록과 같은 셈)
      patPush('hallAt', pts, [[U(uv[0]), V(uv[2])], [U(uv[1]), V(uv[2])], [U(uv[1]), V(uv[3])], [U(uv[0]), V(uv[3])]], n, 0xffffff); };
    // 돌린 상자(안내판 등 — 감사 밖 dGeo) · 이 블록 지역 도우미
    const rbx = (w, h, d, hex, cx, y0, cz, ry) => dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(cx, y0 + h / 2, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(w, h, d)), hex);
    // 바닥: 크림 광택 타일 45cm(hall_lobby-25 · 영상 e_338 진열장 사이 ≈6.6칸) · 자동문부터 2.5m = 신발 벗는 곳(무늬 없는 광택 회갈색 — hall_lobby-21 · e_326.5~e_332)
    const SHZ = hz1 - 2.5;
    floorQ('tileC', hx0, hx1, hz0, SHZ); addPanel(hx1 - hx0, hz1 - SHZ, 0xa59f90, hc, 0.012, (SHZ + hz1) / 2);
    dBox(hx1 - hx0 - 0.02, 0.03, 0.03, 0xb9b7b0, hc, -0.012, SHZ);                  // 경계 금속 띠(바닥에 반쯤 묻힘)
    compassRose(hc, 0.018, hz0 + 3.0, 0.4);                                         // hall_lobby-18: 지름 0.8·아치에서 ≈3m(영상 e_338 진열장 사이 바닥폭 대비 0.25)
    // ---- 서벽(북 → 남): 짙은 나무 낮은 수납장 + 나무틀 판 → 짙은 호두색 진열장 셋(눕힌 액자) → 안내 책꽂이 + 환영 안내판 ----
    // hall_lobby-19(영상 e_338~341): 아치 옆 수납장 2m(문 4짝·은색 꼭지) · 위에 빨강 상자·연두 휴지곽 · 벽엔 나무틀 베이지 판(주의 스티커)
    addBox(0.45, 0.85, 2.0, 0x5a4636, hx0 + 0.225, 0, hz0 + 1.1, NS);
    for (let k = 0; k < 4; k++) { const z9 = hz0 + 0.35 + k * 0.5;
      dBox(0.03, 0.7, 0.47, 0x654f3e, hx0 + 0.465, 0.08, z9);
      dBox(0.03, 0.04, 0.04, 0xc8ccd0, hx0 + 0.495, 0.66, z9 + (k % 2 ? -0.18 : 0.18)); }
    dBox(0.22, 0.2, 0.25, 0xc8342c, hx0 + 0.2, 0.85, hz0 + 0.45); dBox(0.12, 0.1, 0.22, 0x9fd06a, hx0 + 0.2, 0.85, hz0 + 0.9);
    const palm = (x, y, z, s, pot) => {                                             // 싼 관엽(야자형 잎 4 — potPlant tall의 반값)
      dBox(0.2*s, 0.18*s, 0.2*s, pot, x, y, z); dBox(0.24*s, 0.04*s, 0.24*s, pot, x, y + 0.18*s, z);
      dCyl(0.015*s, 0.02*s, 0.4*s, 0x6d4e32, x, y + 0.22*s, z, { seg: 4 });
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + hash2(x, z) * 3, len = (0.34 + (i % 2) * 0.08) * s;
        dGeo(BLOB0, new THREE.Matrix4().makeTranslation(x, y + 0.6*s, z).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationX(-0.5 - (i % 2) * 0.25))
          .multiply(new THREE.Matrix4().makeTranslation(0, 0, len * 0.5)).multiply(new THREE.Matrix4().makeScale(0.08*s, 0.02*s, len * 0.5)), i % 2 ? 0x5fa052 : 0x4f8f47, { jitter: 0.15 }); } };
    const sprig = (x, y, z, s, pot) => { dBox(0.16*s, 0.14*s, 0.16*s, pot, x, y, z); dBlob(0.11*s, 0.1*s, 0.11*s, [0x4f8f47, 0x5fa052, 0x6aae5a][Math.floor(hash2(x, z) * 3)], x, y + 0.22*s, z, { chunky: true, ry: x * 7, jitter: 0.22 }); };   // 작은 화초
    const woodFrameBoard = (wx, f, z0, z1, y0, y1) => {                             // 나무틀 베이지 판(벽 면 wx·방 쪽 f) — 판은 틀 안쪽만(틀·판 뒷면이 겹치지 않게)
      const zc = (z0 + z1) / 2, L = z1 - z0, T = 0.06;
      dBox(0.03, y1 - y0 - 2*T, L - 2*T, 0xd8cdb8, wx + f*0.015, y0 + T, zc);
      dBox(0.045, T, L, DKWOOD, wx + f*0.0225, y0, zc); dBox(0.045, T, L, DKWOOD, wx + f*0.0225, y1 - T, zc);
      [z0 + T/2, z1 - T/2].forEach(z9 => dBox(0.045, y1 - y0 - 2*T, T, DKWOOD, wx + f*0.0225, y0 + T, z9));
    };
    woodFrameBoard(hx0, 1, hz0 + 0.3, hz0 + 1.9, 1.1, 2.4);
    [[1.85, hz0 + 0.75], [1.62, hz0 + 1.35]].forEach(([y9, z9]) => { dBox(0.03, 0.12, 0.3, 0xf2c230, hx0 + 0.045, y9, z9); dBox(0.03, 0.03, 0.3, 0x2a2a2a, hx0 + 0.045, y9 + 0.12, z9); });
    // hall_lobby-23(영상 e_327·e_334·e_338): 서벽 진열장 = 짙은 호두색 틀 + 유리 선반 2단 위 눕힌 액자·사진(트로피 없음) + 위에 흰 긴 화분받침
    const wCase = (a0, a1) => {
      const D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2, xm = hx0 + D / 2;
      colliders.push(noStand({ x0: hx0, x1: hx0 + D, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, 0.2, L, 0x3f3228, xm, 0, c); dBox(D, 0.05, L, 0x5a4636, xm, H - 0.05, c);
      [a0 + 0.03, a1 - 0.03].forEach(e => dBox(D, H - 0.25, 0.06, 0x5a4636, xm, 0.2, e));
      dBox(D - 0.08, 0.03, L - 0.14, 0xcfdde2, xm - 0.02, 0.56, c);                  // 유리 선반
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*0.02 + hx0 + D - 0.03, bpos.getY(i)*(H - 0.25) + 0.2 + (H - 0.25)/2, bpos.getZ(i)*(L - 0.12) + c);
      [0.2, 0.59].forEach((y9, r9) => { for (let a = a0 + 0.24; a < a1 - 0.18; a += 0.36) dBox(0.2, 0.03, 0.26, (Math.floor((a - a0) / 0.36) + r9) % 2 ? 0xe8e2d6 : 0xd9d2c2, hx0 + 0.27 + ((r9 + Math.floor(a * 3)) % 2) * 0.06, y9, a); });
      dBox(0.24, 0.06, L - 0.1, 0xf0f0ec, hx0 + 0.27, H, c);                         // 흰 긴 화분받침
      for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.3) sprig(hx0 + 0.27, H + 0.06, a, 0.9 + hash2(a, 1)*0.3, hash2(a, 3) > 0.6 ? 0xd9d6ce : 0xc46a4a);
    };
    { const a = hz0 + 2.2, b = hz1 - 0.9, L3 = (b - a - 0.1) / 3; for (let k = 0; k < 3; k++) wCase(a + k * (L3 + 0.05), a + k * (L3 + 0.05) + L3); }
    // hall_lobby-24(영상 e_334·e_338): 서벽 사진 게시판 = 초록 판 + 연두 판 3장(윗변 구름꼴 · 사진 격자) + 가운데 위 제목띠
    { const a = hz0 + 2.3, b = hz1 - 0.4, c = (a + b) / 2, L = b - a, PW = (L - 0.4) / 3;
      dBox(0.04, 1.4, L, 0x2f6e4f, hx0 + 0.02, 1.0, c);
      for (let k = 0; k < 3; k++) { const pc = a + 0.1 + PW / 2 + k * (PW + 0.1), q0 = pc - PW / 2 - 0.05, q1 = pc + PW / 2 + 0.05, X9 = hx0 + 0.045;   // 판 = 아틀라스 칸 1(구름꼴 윗변·사진 5×4 — 게시판 면 5mm 앞)
        atQ(1, [[X9, 1.03, q0], [X9, 1.03, q1], [X9, 2.12, q1], [X9, 2.12, q0]], [1, 0, 0], [1, 0, 0, 1]); }
      sign('창의지성을 갖춘 건강한 휴먼리더', hx0 + 0.08, 2.24, c, Math.PI / 2, 0.12, { bg: '#e8efd6', fg: '#3a5a3a' }); }
    // hall_lobby-20(영상 e_327·e_334·e_335): 남서 구석 = 연한 나무 안내 책꽂이(늘어진 잎 화분) + 그 앞 세워 둔 환영 안내판(학교 안내도)
    { const zc = hz1 - 0.37, xm = hx0 + 0.175;
      colliders.push(noStand({ x0: hx0, x1: hx0 + 0.35, y0: 0, y1: 0.9, z0: zc - 0.3, z1: zc + 0.3 }));
      [zc - 0.285, zc + 0.285].forEach(z9 => dBox(0.35, 0.9, 0.03, 0xd2a86a, xm, 0, z9));
      dBox(0.03, 0.88, 0.54, 0xc29a5e, hx0 + 0.015, 0.01, zc);
      [0.02, 0.32, 0.62, 0.87].forEach(y9 => dBox(0.32, 0.03, 0.54, 0xd2a86a, xm + 0.015, y9, zc));
      [0.05, 0.35].forEach((y9, r9) => { for (let k = 0; k < 3; k++) dBox(0.04, 0.22, 0.14, [0x5b8fc9, 0xf2d15c, 0xe0708a, 0x3fa37a][(k + r9) % 4], hx0 + 0.12 + k * 0.05, y9, zc - 0.17 + k * 0.17); });
      potPlant(xm, 0.9, zc, 1.0, false, 0xf2f2ee);
      dBlob(0.16, 0.22, 0.12, 0x5fa052, xm + 0.1, 0.78, zc + 0.08, { chunky: true, jitter: 0.2 });   // 늘어진 잎
      const bx = hx0 + 0.78, bz = hz1 - 0.62, ry = 2.0, fx = Math.sin(ry), fz = Math.cos(ry);            // 안내판(동북동을 봄)
      rbx(0.65, 0.95, 0.05, 0xf4f1e6, bx, 0.12, bz, ry);
      [-0.27, 0.27].forEach(o => rbx(0.04, 0.12, 0.04, 0x6b6f75, bx + Math.cos(ry) * o, 0, bz - Math.sin(ry) * o, ry));
      [[0x9fd06a, 0.62, 0.12], [0xf2c230, 0.24, 0.3], [0x9cc3e0, 0.24, 0.3]].forEach(([col, w9, h9], k) => rbx(w9, h9, 0.02, col, bx + fx * 0.035 + Math.cos(ry) * (k ? (k === 1 ? -0.15 : 0.15) : 0), k ? 0.25 : 0.62, bz + fz * 0.035 - Math.sin(ry) * (k ? (k === 1 ? -0.15 : 0.15) : 0), ry));
      sign('우리 학교에 오신 것을', bx + fx * 0.05, 0.86, bz + fz * 0.05, ry, 0.055, { bg: '#f4f1e6', fg: '#3a6a3a' });
      sign('환영합니다', bx + fx * 0.05, 0.79, bz + fz * 0.05, ry, 0.06, { bg: '#f4f1e6', fg: '#d0503a' });
      colliders.push(noStand({ x0: bx - 0.25, x1: bx + 0.25, y0: 0, y1: 1.07, z0: bz - 0.25, z1: bz + 0.25 }));
      hotspots.push({ kind: 'map', x: hx0 + 1.4, z: hz1 - 0.9, y: 0, r: 1.0, label: '학교 안내도 보기' }); }   // 게임 첫 안내 지점
    // ---- 동벽(남 → 북): 신발장 2.65m(자동문 쪽) → 긴 진열장 → 음수대(아치 옆) + 소화기 — hall_lobby-15(영상 e_327·e_330·e_332·e_338) ----
    // hall_lobby-22: 신발장 = 꿀색 단풍나무 + 은색 둥근 꼭지·이름표 + 검정 상판 · 위 화분 = 큰 흰 화분 위주(빨강 하나·짙은 하나)
    { const a0 = hz1 - 2.8, a1 = hz1 - 0.15, D = 0.45, H = 1.05, L = a1 - a0, c = (a0 + a1) / 2, n = Math.round(L / 0.32), cw = L / n, rh = (H - 0.1) / 3;
      colliders.push(noStand({ x0: hx1 - D, x1: hx1, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, H, L, 0xc08a50, hx1 - D / 2, 0, c);
      { const fx = hx1 - D - 0.005;                                                  // 칸문 = 아틀라스 칸 2(꿀색 단풍 + 은색 둥근 꼭지 + 이름표 · 칸 사이 틈) — 칸마다 사각형 하나
        for (let i = 0; i < n; i++) for (let r = 0; r < 3; r++) { const z0 = a0 + cw * i, z1 = z0 + cw, y0 = 0.08 + rh * r, y1 = y0 + rh;
          atQ(2, [[fx, y0, z0], [fx, y0, z1], [fx, y1, z1], [fx, y1, z0]], [-1, 0, 0]); } }
      dBox(D + 0.02, 0.03, L + 0.04, 0x2b2b2b, hx1 - (D + 0.02) / 2, H, c);
      [0xf2f2ee, 0xf2f2ee, 0xc8342c, 0xf2f2ee, 0x2f3a55].forEach((col, k) => k === 4 ? sprig(hx1 - 0.22, H + 0.03, a0 + 0.3 + k * 0.52, 1.4, col) : palm(hx1 - 0.22, H + 0.03, a0 + 0.3 + k * 0.52, 1.25, col)); }
    { const a0 = hz0 + 2.05, a1 = hz1 - 2.95, D = 0.55, H = 0.95, L = a1 - a0, c = (a0 + a1) / 2, xm = hx1 - D / 2;   // 긴 진열장(밝은 나무 틀·은·금 트로피 — 영상 e_332)
      colliders.push(noStand({ x0: hx1 - D, x1: hx1, y0: 0, y1: H, z0: a0, z1: a1 }));
      dBox(D, 0.2, L, 0x8a6a45, xm, 0, c); dBox(D, 0.05, L, 0xa07c52, xm, H - 0.05, c);
      [a0 + 0.03, a1 - 0.03].forEach(e => dBox(D, H - 0.25, 0.06, 0xa07c52, xm, 0.2, e));
      for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*0.02 + hx1 - D + 0.03, bpos.getY(i)*(H - 0.25) + 0.2 + (H - 0.25)/2, bpos.getZ(i)*(L - 0.12) + c);
      for (let a = a0 + 0.3; a < a1 - 0.2; a += 0.4) { const k = hash2(a, 5), col = k < 0.5 ? 0xe0b848 : 0xc9ccd0;
        if (k < 0.75) { dCyl(0.05, 0.05, 0.06, 0x8a6a45, hx1 - 0.3, 0.2, a, { seg: 5 }); dCyl(0.08, 0.035, 0.16 + k * 0.1, col, hx1 - 0.3, 0.26, a, { seg: 6 }); }
        else dBox(0.03, 0.22, 0.28, 0xf3ead2, hx1 - 0.22, 0.2, a); }
      for (let a = a0 + 0.2; a < a1 - 0.12; a += 0.34) sprig(hx1 - 0.27, H, a, 0.9 + hash2(a, 1) * 0.3, hash2(a, 3) > 0.6 ? 0xd9d6ce : 0xc46a4a); }
    greenBoard('z', hz0 + 2.0, hz1 - 3.0, hx1, -1, 1.05, 2.35, 'notice');           // 진열장 위 게시판(신발장 위는 높은 창)
    [[0.62, 0.9, 1.3, -0.55, true], [0.48, 0.7, 1.45, 0.25, false], [0.4, 0.55, 1.6, 0.85, false]].forEach(([w9, h9, y9, oz, band]) => {   // hall_lobby-24: 흰 포스터(하나는 보라 세로띠)
      const z9 = (hz0 + 2.0 + hz1 - 3.0) / 2 + oz; dBox(0.03, h9, w9, 0xf7f5ee, hx1 - 0.065, y9, z9);
      dBox(0.03, 0.08, w9 - 0.08, [0x3b6fb5, 0x2f8f5b, 0xd24b4b][Math.round(y9 * 10) % 3], hx1 - 0.095, y9 + h9 - 0.14, z9);
      if (band) dBox(0.03, h9 - 0.21, 0.1, 0xb58ad0, hx1 - 0.095, y9 + 0.05, z9 + w9 / 2 - 0.09); });
    // hall_lobby-16(영상 e_338~341·z_e340f): 우유 보관함·정수기가 아니라 음수대 하나(흰 몸통·연두 앞판·스테인리스 물받이·수도꼭지 4)
    { const fz = hz0 + 1.17, FL = 1.6;
      addBox(0.6, 0.8, FL, 0xf2f2ee, hx1 - 0.3, 0, fz, NS);
      dBox(0.03, 0.55, FL - 0.15, 0xa8d08c, hx1 - 0.615, 0.12, fz);
      dBox(0.03, 0.08, 0.3, 0x9aa0a6, hx1 - 0.615, 0.025, fz + FL / 2 - 0.25);      // 환기 그릴(남끝 아래)
      dBox(0.4, 0.04, FL - 0.15, 0xb9bec4, hx1 - 0.32, 0.8, fz);                     // 스테인리스 물받이
      dBox(0.08, 0.38, FL - 0.1, 0xa8d08c, hx1 - 0.05, 0.84, fz);                    // 뒤판
      for (let k = 0; k < 4; k++) dCyl(0.015, 0.015, 0.1, 0xc8ccd0, hx1 - 0.09, 1.05, fz - 0.525 + k * 0.35, { rot: [0, 0, Math.PI / 2], seg: 6 });
      dBox(0.03, 0.08, 0.2, 0x3a6fc0, hx1 - 0.105, 1.08, fz - FL / 2 + 0.2);         // 파란 조작판(북끝 위)
      dCyl(0.035, 0.03, 0.09, 0x9fd06a, hx1 - 0.2, 0.84, fz + FL / 2 - 0.2, { seg: 8 });   // 연두 컵
      woodFrameBoard(hx1, -1, hz0 + 0.45, hz0 + 1.9, 1.35, 2.4);                     // 위 나무틀 판(서벽 판과 같은 짝)
      hotspots.push({ kind: 'water', x: hx1 - 1.0, z: fz, y: 0, r: 1.0, label: '물 마시기' }); }
    // hall_lobby-28(영상 e_338~341): 아치 동쪽 기둥 밑 소화기 + 빨강 받침
    dBox(0.3, 0.05, 0.3, 0xc8342c, hx1 - 0.55, 0.005, hz0 + 0.18); extinguisher(hx1 - 0.55, 0.055, hz0 + 0.18);
    // hall_lobby-26(영상 e_327·e_332·e_334): 양 벽 윗단 = 베이지 나무판 띠 + 짙은 나무 몰딩(게시판 윗선·천장 줄)
    [[hx0, 1], [hx1, -1]].forEach(([wx, f]) => {
      patWall('panelB', 'z', hz0 + 0.06, hz1 - 0.06, 2.5, FH - 0.2, wx + f * 0.012, f, 0xf6efe2);
      dBox(0.04, 0.06, hz1 - hz0 - 0.12, DKWOOD, wx + f * 0.02, 2.44, hzm); dBox(0.04, 0.06, hz1 - hz0 - 0.12, DKWOOD, wx + f * 0.02, FH - 0.23, hzm); });
    // 북끝 아치(hall_lobby-17 · 영상 e_327·e_333·e_338·e_340): 끝벽 = 짙은 나무(바닥 ~ 2.95) · 개구부 폭 2.8·높이 2.25 · 위 두 모서리 둥글게(r 0.4)
    //   글자·교표는 나무에 직접. 복도 벽 개구(3.32 × 2.5)는 그대로 두고 홀 쪽에서 문설주·머리로 좁힌다(충돌 = 좁힌 자리만)
    { const AW = 2.8, AH = 2.25, TOP = 2.95, R9 = 0.4, a0 = hc - AW / 2, a1 = hc + AW / 2;
      [[hx0, a0], [a1, hx1]].forEach(([u, v]) => { dBox(v - u, TOP - 0.005, 0.36, DKWOOD, (u + v) / 2, 0.005, zCor);
        colliders.push({ x0: Math.max(u, hc - 1.66), x1: Math.min(v, hc + 1.66), y0: 0, y1: TOP, z0: zCor - 0.18, z1: zCor + 0.18 }); });
      dBox(AW, TOP - AH, 0.36, DKWOOD, hc, AH, zCor);
      colliders.push({ x0: a0, x1: a1, y0: AH, y1: TOP, z0: zCor - 0.18, z1: zCor + 0.18 });
      [[a0, 1], [a1, -1]].forEach(([x9, sx]) => {                                     // 모서리 채움(네모 − 1/4원) — 좌우 따로 그림(음수 배율은 면이 뒤집힌다)
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(sx * R9, 0); sh.absarc(sx * R9, -R9, R9, Math.PI / 2, sx > 0 ? Math.PI : 0, sx < 0); sh.lineTo(0, 0);
        const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: false, curveSegments: 6 }); fg.translate(0, 0, -0.18);
        dGeo(fg, new THREE.Matrix4().makeTranslation(x9, AH, zCor), DKWOOD); fg.dispose(); });
      sign('웃음꽃 피는', hc - 0.78, 2.6, zCor + 0.19, 0, 0.22, { bg: 'none', fg: '#f3e6c8' });
      sign('즐거운학교', hc + 0.78, 2.6, zCor + 0.19, 0, 0.22, { bg: 'none', fg: '#f3e6c8' });
      dCyl(0.16, 0.16, 0.02, 0xf0e8e0, hc, 2.6, zCor + 0.18, { rot: [Math.PI / 2, 0, 0], seg: 16 });                 // 교표 원판
      dCyl(0.07, 0.07, 0.015, 0xe07a9a, hc - 0.04, 2.63, zCor + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dCyl(0.06, 0.06, 0.015, 0x8cc26a, hc + 0.05, 2.56, zCor + 0.2, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dBlob(0.07, 0.05, 0.07, 0xe8e8e8, hc, 2.86, zCor + 0.22, { chunky: true }); }                                                // CCTV 돔
    for (let k = 0; k < 3; k++) lamp(1.3, 0.05, 0.08, hc, FH - 0.21, hz0 + 1.2 + k * 2.3);   // 가로 LED 막대(영상 e_325)
  }
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    const rz0 = r.kinderOffice ? KBZ : zCor;                                     // 원무실은 북쪽 KBZ까지
    // 칸막이. 현관 홀 양벽은 정면 벽 줄(-24)까지 — 정면 벽이 현관 자리에서 끊기므로 여기서 메운다
    if (i > 0) {
      const ze = (s0 === HX0 || s0 === HX1) ? fz1 : fz1 - 0.15;
      if (s0 === HX1) { wallRun('z', zCor + 0.15, ze, s0, INNER, { gaps: [{ c: EZI - 1.6, w: 2.8, sill: 1.12, dh: 2.45, win: true, frame: 0xc9ced3 }] });   // 현관 홀 동벽: 신발장 위 푸른 반투명 높은 창(영상 e_327·e_330 — hall_lobby-27: 신발장 상판 바로 위·신발장 길이)
        dBox(0.03, 2.45 - 1.12 - 0.14, 2.8 - 0.12, 0xb9d3ec, s0, 1.19, EZI - 1.6); }   // 필름(유리 속 — 불투명 푸른 흰빛)
      else {   // 교실 쪽 면 = 흰 교실 벽(classrooms-10) — 한쪽만 교실이면 0.15 두 겹으로 나눠 칠한다
        const isC = q => ['classroom', 'computer', 'daycare'].includes(q.type), cL = isC(FR.rooms[i - 1]), cR = isC(r), zc9 = (zCor + 0.15 + ze)/2, d9 = ze - zCor - 0.15;
        if (cL === cR) addBox(0.3, FH, d9, cL ? CLS_WALL : INNER, s0, 0, zc9);
        else { addBox(0.15, FH, d9, cL ? CLS_WALL : INNER, s0 - 0.075, 0, zc9); addBox(0.15, FH, d9, cR ? CLS_WALL : INNER, s0 + 0.075, 0, zc9); }
      }
    }
    zones.push({ x0: s0, x1: s1, z0: rz0, z1: fz1, y: 0, label: r.name });
    if (r.type === 'hall') return;
    const x0 = s0 + (i > 0 ? 0.15 : 0.15), x1 = s1 - 0.15, z0 = rz0 + 0.15, z1 = fz1 - 0.15;
    const CLS9 = r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare', CH = CLS9 ? FH - 0.4 : FH;   // [classrooms-16] 교실 천장 면 2.84(영상 a_487·a_492 — 창 머리·태극기 위가 바로 천장)
    if (CLS9) {
      if (r.type === 'computer') floorQ('tileW', x0, x1, z0, z1, 0, 0xa4a8ac); else floorQ('wood', x0, x1, z0, z1);   // 컴퓨터실 = 회색 올림 바닥(c_465.5)
      westClass(r.name, x0, x1, zCor + 0.15, z1, 0, { sill: 1.0, ceilH: CH - 0.16, style: r.name === '3학년' ? 'g3' : '', computer: r.type === 'computer' });   // 서향 교실(칠판 = 서벽)
      [1, 2].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * cw * 0.22, CH - 0.21, zCor + k * 2.5)));
      acUnit(r.name === '3학년' ? cx + 2.2 : cx, CH - 0.16, (zCor + fz1) / 2);   // [classrooms-15] 3학년은 뒤쪽 절반(a_490.5·a_492 삼각측량)
      corWinsOf(r).forEach(g => { dBox(g.w - 0.12, 0.06, 0.17, g.frame, g.c, 2.3, zCor);   // 복도 쪽 실내창: 위 가로살 + 아랫칸 격자 시트(양면)
        const a9 = g.c - g.w/2 + 0.06, b9 = g.c + g.w/2 - 0.06, z9 = zCor - 0.09, S9 = 0.44;
        patWall('film2', 'x', a9, b9, 1.16, 1.7, zCor + 0.09, 1);
        // [main_corridor-0] 복도 쪽 면 = 조명 무시 흰 격자 시트(북향이라 film2가 회색으로 렌더되던 것 — 영상 a_466.5·a_474·a_513은 흰 반투명 'ㅁ' 격자): 천장 ctile을 UV로 22cm 격자
        patPush('ctile', [[a9, 1.16, z9], [b9, 1.16, z9], [b9, 1.7, z9], [a9, 1.7, z9]], [[a9 / S9, 1.16 / S9], [b9 / S9, 1.16 / S9], [b9 / S9, 1.7 / S9], [a9 / S9, 1.7 / S9]], [0, 0, -1], 0xffffff); });
      if (r.name === '3학년') { const fw = facadeGaps.filter(g => g.c > s0 && g.c < s1);   // [classrooms-21] 창 사이 기둥 벽걸이 선풍기(흰 비닐 덮개 — a_490.5)
        for (let k = 1; k < fw.length; k++) wallFan((fw[k - 1].c + fw[k].c) / 2, z1, -1, 2.35, 0xd6d8da); }
      doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCor) < 0.01 && d.cx > s0 && d.cx < s1) { d.slot = true; if (d.color == null) d.color = 0xbc9a78; } });   // [classrooms-19] 가로 쪽창·옅은 꿀색 나무(a_480·a_465)
    } else if (r.type === 'toilet') {
      floorQ('ttile', x0, x1, z0, z1);
      // [main_corridor-5] 네 칸(문 넷 — 복도 남벽 TDOOR): 문 사이 칸막이 벽 셋 + 남학생 칸 뒷벽(여학생은 좁은 앞칸 → 남학생 칸 뒤 넓은 칸, ㄱ자)
      const TA = (TDOOR[0][0] + TDOOR[1][0]) / 2, TB = (TDOOR[1][0] + TDOOR[2][0]) / 2, TC = (TDOOR[2][0] + TDOOR[3][0]) / 2, TZ = zCor + 3.1;
      addBox(0.3, FH, z1 - z0, INNER, TA, 0, (z0 + z1) / 2); addBox(0.3, FH, z1 - z0, INNER, TB, 0, (z0 + z1) / 2);
      addBox(0.3, FH, TZ + 0.3 - z0, INNER, TC, 0, (z0 + TZ + 0.3) / 2);
      addBox(TC - TB - 0.3, FH, 0.3, INNER, (TB + TC) / 2, 0, TZ + 0.15);
      const sinkAt = (a, b, zc) => { dBox(b - a, 1.2, 0.4, 0xdfe8ee, (a + b) / 2, 0, zc); colliders.push(noStand({ x0: a, x1: b, y0: 0, y1: 1.2, z0: zc - 0.2, z1: zc + 0.2 })); };   // 세면대(올라서기 금지 · 디테일 층)
      sinkAt(x0 + 0.6, TA - 0.75, z1 - 0.2); sinkAt(TA + 0.35, TB - 0.35, z1 - 0.2); sinkAt(TB + 0.35, TC - 0.35, TZ - 0.2); sinkAt(TB + 0.6, x1 - 0.6, z1 - 0.2);
      [x0 + 1.2, x0 + 2.5].forEach(x => dBox(0.24, 1.9, 1.5, 0xdfe8ee, x, 0, zCor + 1.55, { collide: true }));   // 남직원 칸 변기 칸막이(디테일 층)
      [[(x0 + TA) / 2, (z0 + z1) / 2], [(TA + TB) / 2, (z0 + z1) / 2], [(TB + TC) / 2, (z0 + TZ) / 2], [(TB + x1) / 2, (TZ + z1) / 2]].forEach(([lx, lz]) => lamp(0.6, 0.05, 0.22, lx, FH - 0.21, lz));
    } else {
      floorQ('tileW', x0, x1, z0, z1, 0, 0xf2e6cf);
      officeDesk(cx - 1, 0, rz0 + 3.3);
      officeDesk(cx + 1, 0, rz0 + 2.0);
      addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6);
      lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (rz0 + fz1)/2);
      offWinsOf(r).forEach(g => { dBox(g.w - 0.12, 0.06, 0.17, g.frame, g.c, 2.3, zCor);   // [main_corridor-0] 사무실 복도 쪽 창: 위 가로살 + 아랫칸 격자 시트(틀 안쪽 1cm 띄움 — 틀과 모서리가 겹치면 비스듬히 볼 때 반짝임)
        const a9 = g.c - g.w/2 + 0.07, b9 = g.c + g.w/2 - 0.07, z9 = zCor - 0.095, S9 = g.frame === 0x8a98a4 ? 1.2 : 0.44;
        patWall('film2', 'x', a9, b9, 1.17, 1.7, zCor + 0.095, 1);
        // 복도 쪽 면 = 조명 무시 흰 격자 시트(북향이라 film2가 회색으로 렌더되던 것 — 영상 b_141·b_148.5는 흰 반투명): 천장 ctile을 UV로 22cm 격자(교실 창과 같은 칸 · 먹 번짐 판 칸은 60cm 큰 칸)
        patPush('ctile', [[a9, 1.17, z9], [b9, 1.17, z9], [b9, 1.7, z9], [a9, 1.7, z9]], [[a9 / S9, 1.17 / S9], [b9 / S9, 1.17 / S9], [b9 / S9, 1.7 / S9], [a9 / S9, 1.7 / S9]], [0, 0, -1], S9 > 1 ? 0xe9ecee : 0xffffff); });
    }
    if (r.type === 'toilet') { /* 팻말 = 복도 남벽 블록(TDOOR 이름표·둥근 '화장실' 팻말) */ }
    else if (!r.kinderOffice) classSign(r.name, r.span[0] + 1.9, 2.78, zCor, -1);   // [classrooms-18] 크림 교실 팻말(3-1·과학실 판과 같은 틀)
    ceil(s0, s1, r.kinderOffice ? fz0 - 0.16 : zCor, fz1, CH, r.type === 'toilet' ? 'cflat' : 'ctile');
  });
  // [main_corridor-23] 복도 남벽 작은 액자(영상 a_468·a_474·b_142.5): 두 창 사이 크림 기둥 가운데(교실 = 방 가운데 기둥 1.0 · 교무실 = 두 창 사이 0.6) — 짙은 녹회색 테
  FR.rooms.forEach(r => { if (r.type === 'hall' || r.type === 'toilet' || r.kinderOffice) return;
    const ow = offWinsOf(r), x = ow.length === 2 ? (ow[0].c + ow[1].c) / 2 : corWinsOf(r).length ? (r.span[0] + r.span[1]) / 2 : null;
    if (x === null) return;
    dBox(0.5, 0.62, 0.03, 0x3d4a44, x, 1.5, zCor - 0.165);
    patWall('kidsArt', 'x', x - 0.2, x + 0.2, 1.56, 2.06, zCor - 0.186, -1); });
  // 도서관 복도창 짙은 초록 시트지(영상 W_202~207 — 복도에서 안이 안 보임)
  [0.25, 0.5, 0.75].forEach(t => { const c = libR.span[0] + (libR.span[1] - libR.span[0]) * t; patWall('film', 'x', c - 1.04, c + 1.04, 1.11, 2.29, fz0 + 0.09, 1); });
  { // 복도 채우기 — 학생자치회 게시판·창 아래 낮은 사물함·소화기
    // [main_corridor-3·6·15] 창 아래 벽에 묻힌 짙은 갈색 사물함(깊이 0.3 — 복도 폭 1.9 유지) + 초록 띠 + 회색 돌 창턱(영상 a_466.5·a_474·a_496.5·a_507)
    //   서랍 3단(lockD 무늬) · 여닫이 두 짝(a_469.5·a_475.5·a_498·a_504 — 칸마다 번갈아). 기둥 밑에서 끊긴다. 게시판 밑에도 서랍(a_459·a_520.5)
    const LZ = fz0 + 0.15, LD = 0.3, LH = 0.85;
    const corLocker = (a0, a1, swing, body = 0x5a4232, door = 0x7a5c46, rows = 3, band = true) => {
      const L = a1 - a0, c = (a0 + a1) / 2;
      dBox(L, band ? LH : LH + 0.11, LD, body, c, 0, LZ + LD / 2);                     // 몸통(띠 없는 뒷길 사물함은 창턱까지 — b_154.5)
      if (band) dBox(L, 0.11, LD, HALL_DADO.lo, c, LH, LZ + LD / 2);                    // 초록 띠(몸통 앞면과 한 면 — 위아래로 맞닿기만)
      dBox(L, 0.05, LD + 0.04, 0x9c9b98, c, LH + 0.11, LZ + (LD + 0.04) / 2);           // 회색 화강석 창턱(앞으로 4cm)
      colliders.push(noStand({ x0: a0, x1: a1, y0: 0, y1: LH + 0.16, z0: LZ, z1: LZ + LD + 0.04 }));
      if (swing) [-1, 1].forEach(s => { dBox(L / 2 - 0.04, LH - 0.12, 0.03, 0x6e4632, c + s * L / 4, 0.06, LZ + LD + 0.015);
        dBox(0.03, 0.12, 0.03, 0xb8bcc0, c + s * 0.07, LH * 0.55, LZ + LD + 0.045); });
      else { const n = Math.max(1, Math.round(L / 0.42)), fz = LZ + LD + 0.005, y0 = 0.06, y1 = (band ? LH : LH + 0.11) - 0.04;
        patPush('lockD', [[a0 + 0.02, y0, fz], [a1 - 0.02, y0, fz], [a1 - 0.02, y1, fz], [a0 + 0.02, y1, fz]], [[0, 0], [n, 0], [n, rows], [0, rows]], [0, 0, 1], door); }
    };
    corLocker(BOARD[0] + 0.05, BOARD[1] - 0.05, false);
    corLocker(LANEW.c - LANEW.w / 2, LANEW.c + LANEW.w / 2, false, 0xcdb792, 0xeadabb, 2, false);   // 뒷길 창 아래 베이지 사물함 2단 · 초록 띠 없이 돌 창턱 바로 밑(b_154.5)
    // [main_corridor-10] 급식동 남벽 게시판(영상 b_141·b_144·b_150·b_151.5): 당직실|조리실 문 사이 큰 생활규칙 판(청보라 테) · 출구|입구 사이 학교 사진 판 · 입구|로비 사이 아이 그림 판(연파랑 테)
    //   (문 자리 재배치는 급식실 안 배치(CAFE-2)와 맞물려 두고, 비어 있는 벽에만 단다)
    { const K = B.kitchen, FZ = fz0 + 0.15;
      // 당직실 서쪽 = 큰 생활규칙 판(영상 b_150·b_151.5: 청보라 테 + 옅은 하늘 바탕·보라 제목 띠·흰 카드 셋(사진) — 뒷길 창 바로 동쪽까지)
      //   새 무늬를 쓰면 그 무늬 메시의 경계 상자가 커져 먼 화면에도 드로우콜 +1 → 복도 천장 cflat(조명 무시 민짜 칸)을 틴트로만
      { const a0 = K.x[0] + 0.12, a1 = K.dutyRoom.doorC - 0.75, Lb = a1 - a0, cw = (Lb - 0.4) / 3;
        dBox(Lb, 1.3, 0.04, 0x6d6fb8, (a0 + a1) / 2, 1.05, FZ + 0.02);
        const q = (u0, u1, y0, y1, z, t) => patPush('cflat', [[u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y1, z]], [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [0, 0, 1], t);
        q(a0 + 0.05, a1 - 0.05, 1.1, 2.3, FZ + 0.044, 0xc2dcf4);                              // 옅은 하늘 바탕
        q(a0 + Lb * 0.2, a1 - Lb * 0.2, 2.1, 2.24, FZ + 0.048, 0x8f80cc);                     // 보라 제목 띠
        for (let k = 0; k < 3; k++) { const u = a0 + 0.1 + k * (cw + 0.1);
          q(u, u + cw, 1.25, 1.98, FZ + 0.048, 0xffffff); q(u + 0.03, u + cw - 0.03, 1.62, 1.92, FZ + 0.052, [0x9cc3e0, 0xe3b39c, 0xb9d89e][k]); } }
      frameBoard('x', K.dutyRoom.doorC + 0.75, K.staffDoorC - 0.65, FZ, 1, 1.05, 2.35, 0xcfc6ae, 'photoB');   // 당직실|조리실 사이 사진·안내 판(b_147)
      frameBoard('x', K.exitC + 0.85, K.doorC - 1.15, FZ, 1, 1.1, 2.3, 0xe8e2cc, 'photoB');
      frameBoard('x', K.doorC + 1.15, CL.x[0] - 0.3, FZ, 1, 1.05, 2.35, 0x8fb4e0, 'kidsArt'); }
    NBAY.forEach((a, k) => corLocker(a, a + NWW, k === 1 || k === 3 || k === 4 || k === 5));
    // 창 사이 크림 기둥(바닥~천장, 사물함보다 4cm 더 나옴 — 아래 초록 징두리) · 소화기는 기둥 앞 바닥(a_465·a_471·a_480)
    const PD = LD + 0.04, CT = FH - 0.16;
    const pil = (x0, x1) => { const c = (x0 + x1) / 2; dBox(x1 - x0, 1.0, PD, HALL_DADO.lo, c, 0, LZ + PD / 2, { collide: true }); addBox(x1 - x0, CT - 1.0, PD, 0xf3ead2, c, 1.0, LZ + PD / 2); };   // 아래 초록 = 디테일 층(멀면 숨김 — 삼각형 예산)
    pil(NW0 - NPW - 0.05, NW0); NBAY.slice(1).forEach(a => pil(a - NPW, a));   // 동쪽 끝 모서리는 기둥 없이(끝 유리문 옆 고정 유리 자리)
    [NW0 - 0.25, NBAY[2] - NPW / 2, NBAY[4] - NPW / 2, NBAY[6] - NPW / 2].forEach(x => { extinguisher(x, 0, LZ + PD + 0.13);
      sign('소화기', x, 1.2, LZ + PD + 0.012, 0, 0.12, { bg: '#d83a2e', fg: '#ffffff' }); });   // 빨간 소화기 표지(a_465·a_475.5)
    // 경보 발신기(회색 판 + 빨간 둥근 벨 — a_462 게시판 동쪽 기둥·a_496.5 동쪽 기둥)
    [[BOARD[1] + 0.2, LZ], [NBAY[6] - NPW / 2, LZ + PD]].forEach(([x, zf]) => { dBox(0.22, 0.3, 0.03, 0xd9d9d4, x, 1.5, zf + 0.015); dCyl(0.075, 0.075, 0.04, 0xc4302b, x, 1.65, zf + 0.03, { rot: [Math.PI / 2, 0, 0], seg: 8 }); });   // 8각(삼각형 예산)
    // [main_corridor-8] 흰 철문(열리지 않는 설비 칸 문 — 마당 쪽엔 문이 없다 b_117~127) + 대피도 액자
    dBox(0.9, 2.1, 0.04, 0xf0f0ec, 25.85, 0, LZ + 0.02); dBox(0.13, 0.03, 0.05, 0x9a9ea3, 25.55, 1.0, LZ + 0.065);   // 레버 손잡이(원기둥 32면 → 상자 12면)
    dBox(0.5, 0.64, 0.03, 0xb8bcc0, 25.08, 1.25, LZ + 0.015); dBox(0.42, 0.56, 0.03, 0xf4f4f0, 25.08, 1.29, LZ + 0.02);
    // 게시판: 사물함 창턱 위에 얹힌다 · 제목 = 판 안 위쪽 연보라 리본(영상 a_459·a_460.5)
    // [main_corridor-7] 소식판 무늬를 2배 크게(같은 카드가 1.2m마다 반복돼 벽지처럼 보였다 — 영상은 큰 포스터·A4 몇 장) · 무늬는 그대로(급식실 게시판과 공유) UV만 2.4m
    dBox(BOARD[1] - BOARD[0], 1.38, 0.04, 0x2f6e4f, (BOARD[0] + BOARD[1]) / 2, 1.02, LZ + 0.02);
    { const a0 = BOARD[0] + 0.05, a1 = BOARD[1] - 0.05, y0 = 1.07, y1 = 2.35, z = LZ + 0.047, S9 = 2.4;
      patPush('notice', [[a0, y0, z], [a1, y0, z], [a1, y1, z], [a0, y1, z]], [[a0 / S9, y0 / S9], [a1 / S9, y0 / S9], [a1 / S9, y1 / S9], [a0 / S9, y1 / S9]], [0, 0, 1], 0xffffff); }
    // 제목 리본을 크게(영상 a_459: 판 위쪽 2/3를 덮는 연보라 리본) + 리본 윗선 왼쪽 삼각 깃발 줄(빨·노·파·초·보·주)
    { const bx = (BOARD[0] + BOARD[1]) / 2 + 0.3, s9 = sign('정림 학생자치회 소식', bx, 2.12, LZ + 0.058, 0, 0.34, { bg: '#cdb8e6', fg: '#4b2c7f' });
      const tri = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-0.055, 0, 0, 0, -0.09, 0, 0.055, 0, 0], 3));
      [0xd8403a, 0xf2c230, 0x3f78c8, 0x4fa05a, 0x8a5cc0, 0xf08a3a].forEach((hx, k) => dGeo(tri, new THREE.Matrix4().makeTranslation(bx - s9.w / 2 + 0.2 + k * 0.17, 2.392, LZ + 0.066), hx));
      tri.dispose(); }
    hotspots.push({ kind: 'notice', x: (BOARD[0] + BOARD[1]) / 2, z: fz0 + 1.1, y: 0, r: 1.6, label: '학생자치회 소식 읽기' });
    [LOB_X0 + 1.2, LANEW.c + LANEW.w / 2 + 0.3, 8.5].forEach(x => extinguisher(x, 0, fz0 + 0.3));   // 소화기(바닥 — 뒷길 창 것은 사물함 동쪽 끝으로)
    // [main_corridor-19] 비상구 유도등: 동쪽 끝 유리문 위(a_480) + 천장에 매단 양면 등(a_513·a_523.5·b_138 — 복도를 따라 '비상구 따라가기' 단서)
    exitSign(fx1 - 0.15, (fz0 + zCor) / 2, 2.55, [-1, 0]);
    [-8, 27.5, 38.7].forEach(x => { const zc = (fz0 + zCor) / 2; dBox(0.03, 0.18, 0.41, 0xf2f2ee, x, 2.81, zc); dRod(x, 2.99, zc, x, FH - 0.16, zc, 0.008, 0xb8bcc0);
      sign(EXIT_KEY, x + 0.017, 2.9, zc, Math.PI / 2, 0.14); sign(EXIT_KEY, x - 0.017, 2.9, zc, -Math.PI / 2, 0.14); });
  }
  // 지붕: 돌출부 자리는 비우고(돌출부 지붕과 맞댐) 세 조각. 북단 z-33.98 = 서관·로비 슬래브와 맞댐
  { const RZ0 = fz0 + 0.02, RZ1 = fz1 + 0.4, R3 = 0x2f8a68;   // FRONT-3: 청록 기운 짙은 초록(위성 D 네이버 (54,149,114)·Esri (65,167,118) — 예전 0x4f9a6c는 밝고 누렜다)
    addBox(EN.x[0] - (fx0 - 0.4), 0.3, RZ1 - RZ0, R3, (fx0 - 0.4 + EN.x[0])/2, FH, (RZ0 + RZ1)/2);
    addBox(fx1 + 0.4 - EN.x[1], 0.3, RZ1 - RZ0, R3, (EN.x[1] + fx1 + 0.4)/2, FH, (RZ0 + RZ1)/2);
    addBox(EN.x[1] - EN.x[0], 0.3, fz1 - RZ0, R3, (EN.x[0] + EN.x[1])/2, FH, (RZ0 + fz1)/2);
    // 앞 파라펫 = 구간 벽색 + 구간 색 갓돌(노랑/파랑 — 영상 f_165·f_174) · 지붕판 앞면(초록)은 벽색 띠로 가린다
    FSEC.map(([a9, b9, k9]) => [a9 < fx0 ? fx0 - 0.4 : a9, b9 > fx1 ? fx1 + 0.4 : b9, k9]).forEach(([a9, b9, k9]) => {   // FRONT-3: 정면 구간(카키·연회색·베이지)과 같은 칸
      const wc9 = SEC_WALL[k9], cc9 = SEC_BOX[k9], m9 = (a9 + b9) / 2, L9 = b9 - a9;
      addBox(L9, 0.45, 0.3, wc9, m9, FH + 0.3, fz1 + 0.25, { collide: false });
      dBox(L9, 0.07, 0.36, cc9, m9, FH + 0.75, fz1 + 0.25, { far: true });
      dBox(L9, 0.3, 0.03, wc9, m9, FH, fz1 + 0.415, { far: true });
      dBox(L9, 0.03, 0.24, wc9, m9, FH - 0.03, fz1 + 0.28);                         // FRONT-3: 지붕판 앞 처마 밑면(초록 판 아랫면이 짙은 줄로 보이던 것 — 영상은 벽 마감이 갓돌까지)
    });
    // 옥탑(COURT-3 · 영상 Q_109·Q_113.5 지붕 위 · Esri 흰 사각형 x 58.2~64): 청회색 샌드위치 판벽 + 낮은 박공(용마루 동서) · 북면 창 둘 · 동쪽 낮은 흰 설비 상자
    { const ox = 21.1, oz = -30.1, OW = 5.8, OD = 6.2, OH = 2.6, rh = 0.8, sy = rh / 1.5;
      addBox(OW, OH, OD, 0x9aa6b0, ox, FH + 0.3, oz);
      dGeo(new THREE.CylinderGeometry(1, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2), new THREE.Matrix4().compose(new THREE.Vector3(ox, FH + 0.3 + OH + 0.5 * sy, oz), new THREE.Quaternion(), new THREE.Vector3(OW + 0.6, sy, (OD + 0.6) / 2 / 0.866)), 0xd5d8d8, { far: true });
      [-1.3, 1.3].forEach(dx => dBox(1.2, 0.8, 0.03, 0x3a4048, ox + dx, FH + 1.6, oz - OD / 2 - 0.015));
      addBox(4, 0.8, 1.5, 0xe8e6de, 26, FH + 0.3, -32.25); }
    // 옥상 난간: 앞 = 흰 파라펫 위, 동·서 끝 = 지붕 위, 북 = 가운데 마당~동쪽 끝(서쪽은 서관 2층 벽·급식동 벽·로비 지붕과 맞닿아 없음)
    roofRail(fx0 - 0.3, fz1 + 0.25, EN.x[0], fz1 + 0.25, FH + 0.82); roofRail(EN.x[1], fz1 + 0.25, fx1 + 0.3, fz1 + 0.25, FH + 0.82);
    roofRail(fx1 + 0.93, fz0 - 0.78, fx1 + 0.93, fz1 + 0.1, FH + 0.3);   // 동쪽 = 처마 끝(COURT-3 b_108)
    // 서쪽 끝(영상 g_111~114): 난간 없이 앞면처럼 카키 파라펫 + 노랑 갓(초록 지붕판 옆면을 가림) · 남서 모서리 위 CCTV
    const WPZ = wg.z[1] + 0.15;                                                  // 서관 2층 남벽 바깥 면(여기서부터 — 겹치면 감사)
    addBox(0.3, 0.45, fz1 + 0.1 - WPZ, KHK, fx0 - 0.25, FH + 0.3, (WPZ + fz1 + 0.1)/2, { collide: false });
    dBox(0.36, 0.07, fz1 + 0.07 - WPZ, FYEL, fx0 - 0.25, FH + 0.75, (WPZ + fz1 + 0.07)/2, { far: true });
    dBox(0.03, 0.3, fz1 + 0.4 - RZ0, KHK, fx0 - 0.415, FH, (RZ0 + fz1 + 0.4)/2, { far: true });
    dBox(0.22, 0.1, 0.12, 0xf0f0f0, fx0 - 0.3, FH - 0.35, fz1 - 0.35); dBox(0.06, 0.12, 0.06, 0xf0f0f0, fx0 - 0.2, FH - 0.25, fz1 - 0.35);
    roofRail(CL.x[1] + 0.4, fz0 - 0.78, fx1 + 0.93, fz0 - 0.78, FH + 0.3);
    // COURT-3(영상 b_103.5~108·Q_109·Q_117.5): 북쪽(마당 쪽)·동쪽 지붕 끝 = 두꺼운 크림 처마 슬래브(벽에서 0.7·동쪽 0.85 돌출 · 두께 0.35) + 끝에 난간.
    //   윗면은 초록 지붕판보다 4mm 낮게(같은 평면 금지) · 밑면 = 조명 무시 무늬(땅색에 물들어 검게 보이지 않게 — 1cm 아래). BACKYARD-30의 흰 파라펫·노란 띠 자리를 대신함
    const PX0 = CL.x[1] + 0.4, PX1 = fx1 + 1.0, EZ9 = fz0 - 0.85;                    // 로비 지붕(동쪽 끝 +0.4)과 맞댐
    cut16(PX0, PX1, (u, v) => dBox(v - u, 0.35, RZ0 + 0.01 - EZ9, 0xe9e5dc, (u + v) / 2, FH - 0.056, (EZ9 + RZ0 + 0.01) / 2, { far: true }));
    cut16(RZ0 + 0.01, RZ1 - 0.02, (u, v) => dBox(PX1 - (fx1 + 0.15), 0.35, v - u, 0xe9e5dc, (fx1 + 0.15 + PX1) / 2, FH - 0.056, (u + v) / 2, { far: true }));
    patQuad('cflat', PX0, PX1, EZ9, fz0 - 0.15, FH - 0.064, true, 0xd9d4c6); patQuad('cflat', fx1 + 0.15, PX1, fz0 - 0.15, RZ1 - 0.02, FH - 0.064, true, 0xd9d4c6);
    // 동북 모서리(영상 q_107~q_108·b_108): 처마 위 검은 나팔 확성기(북쪽을 봄) · 처마 밑 흰 CCTV · 북면 첫 창 위 작은 흰 등
    { const kx = fx1 + 0.6, kz = fz0 - 0.5;
      dBox(0.06, 0.55, 0.06, 0x3a3a3a, kx, FH + 0.294, kz, { far: true });
      dBox(0.16, 0.16, 0.16, 0x2a2a2a, kx, FH + 0.85, kz, { far: true }); dCyl(0.16, 0.05, 0.3, 0x222222, kx, FH + 0.93, kz - 0.08, { far: true, seg: 6, rot: [-Math.PI / 2, 0, 0] });
      dBox(0.06, 0.1, 0.06, 0xe6e6e2, kx - 0.2, FH - 0.156, kz + 0.1); dBox(0.12, 0.1, 0.22, 0xf0f0ee, kx - 0.2, FH - 0.256, kz + 0.06);
      dBox(0.22, 0.15, 0.1, 0xeeeeea, fx1 - 0.85, 2.95, fz0 - 0.2); } }
  ceil(LOB_X0, fx1, fz0 - 0.16, zCor, FH, 'ctile');                          // 주복도(로비·계단홀 트임 앞까지 이어서 틈 없이) · [main_corridor-25] 60cm 텍스 + T바(영상 a_462·a_474)
  ceil(HX0, HX1, zCor, RC.z[0] + 0.16, FH, 'cflat');                          // 현관 홀 + 전실
  ceil(fx0, LOB_X0, KBZ, fz0 + 0.16, FH, 'ctile');                            // 측문 통로 남쪽 원무실 블록 북단(서관 몫과 맞댐)

  // ================= 서관 (1층 보건실·나래반·문서고·도서실·계단홀 / 2층 6·5학년·소담실) =================
  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  foundation(wx0 - 0.15, wx1 + 0.15, wz0 - 0.15, wz1);
  // 서쪽 끝 겉벽(서관 + 원무실 블록 + 본관 서단 한 줄 — 영상 g_111~114 카키 사이딩): 측문(유리 양문) + 보건실·원무실 창
  wallZ(wz0, fz1, wx0, KHAKI, { face: -1, ext: true, skin: 'siding', gaps: [{ c: SIDE_Z, w: 2.0, glass: true, door: true },
    { c: -42.2, w: 2.2, sill: 1.0, dh: 2.6, win: true }] });   // 본관 서쪽 끝(원무실 블록 서면)은 창 없는 카키 큰 판(영상 g_111~114)
  addBox(0.2, 0.6, fz0 - wz0 - 0.24, YEL, wx0 - 0.14, 2.65, (wz0 + fz0)/2, { collide: false });                       // 서면 노랑 띠(서관 몫만 — 본관 서쪽 끝엔 가운데 띠 없음)
  // 1층 북벽(주차장 쪽) + 계단참 큰 창 / 동벽(뒷길 쪽 — 계단홀 유리문)
  //   BACKYARD-0(09-24 영상 b_022~031): 주차장·뒷길 쪽 = 적벽돌(꼭대기까지) + 주황 콘크리트 띠 + 회색 알루미늄 창틀 — 베이지 판·파랑 띠가 아니다
  const WBR = BRICK, WFR = 0xa9adb0;
  wallX(wx0 - 0.15, STX0, wz0, WBR, { wins: 5, face: -1, ext: true, skin: 'brickW', frame: WFR });
  wallX(STX0, wx1 + 0.15, wz0, WBR, { face: -1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 2.0, dh: 3.4, win: true, frame: WFR }] });
  wallZ(wz0, wz1, wx1, WBR, { face: 1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: -37.9, w: 1.8, glass: true, door: true }] });   // 계단홀 → 뒷길 유리문
  // 2층 겉벽
  wallX(wx0 - 0.15, STX0, wz0, WBR, { y0: FH+0.3, h: FH-0.3, wins: 5, face: -1, sill: 0.8, ext: true, skin: 'brickW', frame: WFR });
  wallX(STX0, wx1 + 0.15, wz0, WBR, { y0: FH+0.3, h: FH-0.3, face: -1, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 0, dh: 2.6, win: true, frame: WFR }] });   // 참 큰 창 윗단(영상 b_168·s_187.5: 1층 창과 한 장으로 2층 천장 근처 6.3까지) · 겉 = 적벽돌(BACKYARD-0)
  wallZ(wz0, wz1, wx0, KHAKI, { y0: FH+0.3, h: FH-0.3, face: -1, ext: true, skin: 'siding', gaps: [{ c: (wz1 - B.upper.corridorDepth + wz1) / 2, w: 1.4, sill: 0.8, dh: 2.3, win: true }] });   // 2층 서면: 6학년 칠판 벽이라 창은 복도 끝만
  wallZ(wz0, wz1, wx1, WBR, { y0: FH+0.3, h: FH-0.3, ext: true, dado: STAIR_DADO, skin: 'brickW', gaps: [{ c: -35.2, w: 1.2, sill: 0.9, dh: 2.3, win: true, frame: WFR }] });   // 2층 계단홀 동벽 여닫이창(영상 s_184 — 너머 급식동 지붕) · 겉 = 적벽돌
  // 2층 남면(1층 z-34는 본관 북벽): 옥상문 서쪽부터 복도 서쪽 끝까지 쉼 없는 띠창(영상 s_177~182) — 아래 흰 반투명 + 스테인리스 세로살, 위 나무틀 미서기
  wallX(wx0 - 0.15, wx1 + 0.15, wz1, WALL, { y0: FH+0.3, h: FH-0.3, face: 1, skin: 'panelB',
    gaps: Array.from({ length: 12 }, (_, k) => ({ c: -39.7 + 2.1375 / 2 + k * 2.2875, w: 2.1375, sill: 0.25, dh: 2.7, win: true, frame: 0xb08a58 })) });
  lamp(27.24, 0.82, 0.03, -26.05, FH + 0.31, wz1 - 0.05);                                             // 아랫단 반투명 유리(조명 무시 흰 판 — 뒤에서 빛 받은 뿌연 유리)
  dBox(27.24, 0.05, 0.17, 0xb08a58, -26.05, FH + 1.13, wz1);                                         // 가로살(+1.15)
  for (let x9 = -39.4; x9 < -12.5; x9 += 0.6) dRod(x9, FH + 0.25, wz1 - 0.2, x9, FH + 1.13, wz1 - 0.2, 0.012, 0xc8ccd0);
  dRod(-39.6, FH + 1.0, wz1 - 0.2, -12.5, FH + 1.0, wz1 - 0.2, 0.02, 0xc8ccd0);                         // 가로 손잡이
  // 옥상문(영상 s_174~178: 남벽 동쪽 끝 밝은 나무 문 — 위 투명 유리·아래 세로 홈 판·둥근 손잡이) — 닫힌 모양만
  addBox(1.0, 2.2, 0.16, 0xc9a26a, -11.75, FH + 0.3, wz1 - 0.23);
  dBox(0.7, 1.0, 0.03, 0xcfe0e6, -11.75, FH + 1.35, wz1 - 0.325);
  [-11.95, -11.75, -11.55].forEach(x9 => dBox(0.03, 0.8, 0.03, 0xb08850, x9, FH + 0.45, wz1 - 0.325));
  dBlob(0.035, 0.035, 0.035, 0xc0c4c8, -12.12, FH + 1.3, wz1 - 0.345);
  floorQ('tileG', STX0 + 0.15, wx1 - 0.15, wz0 + 0.15, fz0 + 0.15, 0, 0xbdbdb9);        // 계단홀 1층 바닥 = 회색 테라초(영상 b_157~160·b_013.5 — 복도 흰 타일보다 짙음) · 복도 검은 띠와 맞댐
  {
    const nurse = wg.rooms.find(r => r.type === 'nurse'), narae = wg.rooms.find(r => r.name === '나래반'), docR = wg.rooms.find(r => r.name === '문서고');
    // 보건실 문(A) + 나래반 문(B)이 크림 돌판 기둥 하나를 사이에 두고 나란히(영상 W_213~220): A = 민트 그림 필름 한 짝 문, B = 반투명 흰 유리 양문(풍선 스티커)
    const nurseDoor = narae.span[0] - 0.95, naraeDoor = narae.span[0] + 1.05, PL0 = nurseDoor + 0.5, PL1 = naraeDoor - 0.8;   // PL = 두 문 사이 기둥 x 구간
    wallX(wx0 + 0.15, PL1, LOB_Z, INNER, { gaps: [{ c: nurseDoor, w: 1.0, color: 0xbfe0c8 }] });
    // 로비 북벽(영상 W_210~224): 연두 판 징두리 + 짙은 나무 띠 + 나무틀 실내창(창턱 1.5·윗선 2.7, 아랫단 아이 그림 스티커) — 나래반 창·문서고 창
    //   ⚠️첫 창은 B 문이 동쪽으로 열리는 자리(1.65m) 밖에서 시작 — 문짝이 창 유리를 쓸지 않게
    const LW1 = [naraeDoor + 2.5, docR.span[0] - 0.25], LW2 = [docR.span[0] + 0.25, LOB_X - 0.3];
    wallX(PL1, LOB_X + 0.15, LOB_Z, INNER, { face: -1, dado: HALL_DADO, gaps: [{ c: naraeDoor, w: 1.6, color: 0xe3e7ea },
      ...[LW1, LW2].map(([a, b]) => ({ c: (a + b) / 2, w: b - a, sill: 1.5, dh: 2.7, win: true, frame: 0xb88a58 }))] });
    [LW1, LW2].forEach(([a, b]) => lamp(b - a - 0.12, 0.54, 0.01, (a + b) / 2, 1.56, LOB_Z + 0.09));   // 유리 아랫단 흰 반투명 필름(안이 덜 보임 — 조명 무시 흰 판, 틀 면 5mm 뒤)
    dBox(LOB_X - 0.2 - (naraeDoor + 0.85), 0.4, 0.04, 0x5b4636, (naraeDoor + 0.85 + LOB_X - 0.2) / 2, 1.1, LOB_Z + 0.17);   // 짙은 나무 띠(1.1~1.5)
    dBox(LOB_X - 0.2 - (naraeDoor + 0.85), 0.05, 0.06, 0xeee6cf, (naraeDoor + 0.85 + LOB_X - 0.2) / 2, 1.05, LOB_Z + 0.18);   // 징두리 갓 레일
    sign('문서고', (LW2[0] + LW2[1]) / 2, 2.88, LOB_Z + 0.2, 0, 0.14);
    // 두 문 사이 크림 돌판 기둥(0.3 튀어나옴) + 옅은 분홍 세로 판 2장 엇갈림 · 문 위 분홍 머리판 + 크림 글씨(영상 W_216.5~220)
    addBox(PL1 - PL0, FH, 0.3, 0xece4d2, (PL0 + PL1) / 2, 0, LOB_Z + 0.3);
    dBox(0.26, 1.0, 0.03, 0xe6b1b5, PL0 + 0.17, 1.6, LOB_Z + 0.465); dBox(0.26, 1.0, 0.03, 0xe6b1b5, PL1 - 0.17, 0.35, LOB_Z + 0.465);
    dBox(0.5, 0.1, 0.06, INNER, (PL0 + PL1) / 2, 1.0, LOB_Z);                // 벽 속 표지: A 문은 서쪽으로 열린다(동쪽 = B 문 개구 — 문짝이 B 문을 가로막지 않게)
    dBox(PL0 - 0.02 - (nurseDoor - 0.6), 0.4, 0.06, 0xe7b8b8, (nurseDoor - 0.6 + PL0 - 0.02) / 2, 2.65, LOB_Z + 0.18);
    dBox(naraeDoor + 0.95 - (PL1 + 0.02), 0.4, 0.06, 0xe7b8b8, (PL1 + 0.02 + naraeDoor + 0.95) / 2, 2.65, LOB_Z + 0.18);
    sign('밝은숲 보금자리', (nurseDoor - 0.6 + PL0 - 0.02) / 2, 2.85, LOB_Z + 0.22, 0, 0.16, { bg: 'none', fg: '#fff3d6' });
    sign('Junglim Village', (PL1 + 0.02 + naraeDoor + 0.95) / 2, 2.85, LOB_Z + 0.22, 0, 0.2, { bg: 'none', fg: '#fff3d6' });
    // 로비 동벽 = 도서관 서벽: 슬기샘 도서관 유리 양문(서쪽을 봄) + 문 남쪽 도서반납함
    wallZ(LOB_Z, fz0, LOB_X, INNER, { gaps: [{ c: -36.6, w: 1.8, glass: true }] });
    { // 도서관 입구 짙은 나무 파사드(영상 W_222~226): 위 간판 띠(크림 글씨) + 양옆 기둥 판(포스터 액자) + 은색 문틀
      const FX = LOB_X - 0.15, D9 = 0xa8805f, zN = LOB_Z + 0.15, zS = fz0 - 0.15;
      dBox(0.06, 0.45, zS - zN, D9, FX - 0.03, 2.62, (zN + zS) / 2);
      dBox(0.06, 2.62, -37.56 - zN, D9, FX - 0.03, 0, (zN - 37.56) / 2); dBox(0.06, 2.62, zS + 35.64, D9, FX - 0.03, 0, (zS - 35.64) / 2);
      [-37.53, -35.67].forEach(z9 => dBox(0.05, 2.6, 0.06, 0xb9bec4, FX - 0.025, 0, z9));
      dBox(0.03, 0.8, 0.5, 0xe8e0f0, FX - 0.075, 1.2, -37.95); dBox(0.03, 0.8, 0.5, 0xf0e6d6, FX - 0.075, 1.2, -35.25);
      patWall('kidsArt', 'z', -38.15, -37.75, 1.25, 1.95, FX - 0.091, -1); patWall('kidsArt', 'z', -35.45, -35.05, 1.25, 1.95, FX - 0.091, -1);
      sign('슬기샘 도서관', FX - 0.08, 2.845, -36.6, Math.PI / 2, 0.3, { bg: 'none', fg: '#f3ead8' }); }
    // 로비 북쪽 방들 칸막이(z wz0~LOB_Z): 보건실|나래반, 나래반|문서고(문서고는 나래반 안에서 — 개구), 문서고|도서관, 도서관|계단
    const pz = (wz0 + 0.15 + LOB_Z - 0.15) / 2, pd = (LOB_Z - 0.15) - (wz0 + 0.15);
    addBox(0.3, FH, pd, INNER, narae.span[0], 0, pz);
    wallZ(wz0, LOB_Z, docR.span[0], INNER, { gaps: [{ c: pz, w: 1.0 }] });
    addBox(0.3, FH, pd, INNER, LOB_X, 0, pz);
    wallZ(wz0, wz1, STX0, INNER, { face: -1, dado: STAIR_DADO, gaps: [{ c: fz0 - 1.4, w: 1.0, color: 0xdcd3bd }] });   // 계단홀 서벽 = 도서관 뒷문(크림 평문)(영상 b_159~160 포스터 붙은 문)
    wg.rooms.forEach(r => {
      const [s0, s1] = r.span, cx = (s0 + s1) / 2;
      const deep = r.type === 'library' || r.type === 'stair';
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: deep ? fz0 : LOB_Z, y: 0, label: r.name });
      if (r.type !== 'stair') floorQ(r.type === 'library' ? 'wood' : r.type === 'nurse' ? 'ttile' : r.type === 'storage' ? 'tileW' : 'wood', s0 + 0.15, s1 - 0.15, wz0 + 0.15, (deep ? fz0 : LOB_Z) - 0.15);
      if (r.type === 'library') {
        for (let k = 0; k < 3; k++) bookshelf(cx + 0.6, wz0 + 1.6 + k * 2.1, 5.2);
        addBox(2.4, 0.72, 1.2, 0xc9a063, cx + 0.6, 0, fz0 - 1.6, NS);          // 열람 탁자
        hotspots.push({ kind: 'read', x: cx + 0.6, z: fz0 - 0.6, y: 0, r: 1.6, label: '책 읽기' });
        [0.25, 0.75].forEach(t => lamp(1.2, 0.05, 0.22, s0 + (s1 - s0) * t, FH - 0.21, (wz0 + fz0) / 2));
      }
      if (r.type === 'nurse') { addBox(1.05, 0.5, 2, 0xf2f5f7, cx - 1, 0, wz0 + 1.6); addBox(1.05, 0.5, 2, 0xf2f5f7, cx + 1, 0, wz0 + 1.6);
        dBox(0.04, 1.6, 2.2, 0xcfe3ee, cx, 0.4, wz0 + 1.7, { collide: true }); officeDesk(cx - 0.6, 0, LOB_Z - 1.2); lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }   // 책상 cx-0.6 = 문(nurseDoor) 서쪽으로 비킴 — cx+1.2면 문 바로 뒤를 막아 방에 못 들어갔다(맵 검진 09-24: 보건실 걷는 칸 2개)
      if (r.name === '나래반') { westClass(r.name, s0 + 0.15, s1 - 0.15, LOB_Z - 0.15, wz0 + 0.15, 0, { sill: 1.0, backGap: [pz - 0.9, pz + 0.9] }); lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }   // 동벽 = 문서고 문
      if (r.name === '문서고') [wz0 + 0.5, wz0 + 2.2].forEach(z9 => addBox(1.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9));
    });
    hangSign('보건실', nurseDoor, 2.78, LOB_Z, 1);
    hangSign('나래반', naraeDoor + 1.5, 2.78, LOB_Z, 1);   // 영상 W_220: B 문 동쪽 기둥 지나 첫 창 위
    hangSign('도서관', LOB_X + 0.35, 2.78, fz0, 1);        // 사물함 끝 도서관 남서 모서리에서 복도로(영상 W_207~208)
    { // 도서관 복도창 띠(한 장): 예전 창 셋 자리 필름 사이·윗단을 시트지로 채움 + 은색 가로 틀(2.1)
      const a = libR.span[0] + 0.46, b = libR.span[1] - 0.41, c3 = [0.25, 0.5, 0.75].map(t => libR.span[0] + (libR.span[1] - libR.span[0]) * t);
      let x9 = a; for (const c of c3) { if (c - 1.04 > x9 + 0.01) patWall('film', 'x', x9, c - 1.04, 1.11, 2.29, fz0 + 0.09, 1); x9 = c + 1.04; }
      if (b > x9 + 0.01) patWall('film', 'x', x9, b, 1.11, 2.29, fz0 + 0.09, 1);
      patWall('film', 'x', a, b, 2.29, 2.39, fz0 + 0.09, 1);
      dBox(b - a + 0.1, 0.05, 0.19, 0xc9cdd2, (a + b) / 2, 2.1, fz0); }
    // 로비 가운데 남쪽 둥근 기둥 소파(주황·노랑 2단 + 연두 기둥 + 민트 갓) — 측문→도서관 시선은 비켜 남쪽에(영상 W_205~212)
    const [dx9, dz9] = WL.sofa;
    colliders.push({ x0: dx9-1.15, x1: dx9+1.15, y0: 0, y1: 0.45, z0: dz9-1.15, z1: dz9+1.15 }, { x0: dx9-0.75, x1: dx9+0.75, y0: 0.45, y1: 0.85, z0: dz9-0.75, z1: dz9+0.75 }, { x0: dx9-0.3, x1: dx9+0.3, y0: 0.85, y1: FH, z0: dz9-0.3, z1: dz9+0.3 });
    // 링·기둥 아랫부분은 반은 주황·반은 레몬 노랑(엇갈림 — 영상 W_210 동쪽에서 앉는 링 주황, W_222 서쪽에서 노랑), 기둥 위 = 흰 크림, 천장 = 민트 팔각 깔때기 갓
    const half = (r, h, y, th0, hex, seg) => { const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false, th0, Math.PI); g.translate(dx9, y + h / 2, dz9); dGeo(g, new THREE.Matrix4(), hex, { far: true }); g.dispose(); };
    const OR = 0xe79a45, LY = 0xe9d949;   // CylinderGeometry θ 0 = +z 쪽, π/2 = +x(동)
    half(1.15, 0.45, 0, 0, OR, 12); half(1.15, 0.45, 0, Math.PI, LY, 12);
    half(0.78, 0.4, 0.45, 0, LY, 10); half(0.78, 0.4, 0.45, Math.PI, OR, 10);
    half(0.3, 1.1, 0.85, 0, LY, 8); half(0.3, 1.1, 0.85, Math.PI, OR, 8);
    dCyl(0.27, 0.27, FH - 0.51 - 1.95, 0xf1eee4, dx9, 1.95, dz9, { seg: 12, far: true });
    { const cap9 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.33, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xcfe6cf }));
      cap9.position.set(dx9, FH - 0.16 - 0.175, dz9); cap9.matrixAutoUpdate = false; cap9.updateMatrix(); scene.add(cap9); }
    // 북벽 창 아래 쿠션 벤치(주황·연두·노랑) + 도서반납함
    // 벤치 2개(영상 W_210·W_222~224): 방석 3칸(주황-연두-노랑 / 주황-연두-주황, 윗면 0.42) + 검은 쇠 다리. 올라서기 허용(벤치)
    const bz9 = LOB_Z + 0.15 + 0.3;
    [[-31.0, [0xe8893a, 0x8cc26a, 0xf2c14b]], [-28.0, [0xe8893a, 0x8cc26a, 0xe8893a]]].forEach(([bx9, cs9]) => {
      cs9.forEach((c9, k) => dBox(0.58, 0.14, 0.55, c9, bx9 + (k - 1) * 0.6, 0.28, bz9));
      dBox(1.76, 0.04, 0.5, 0x2b2b2b, bx9, 0.24, bz9);
      [[-0.84, -0.22], [0.84, -0.22], [-0.84, 0.22], [0.84, 0.22]].forEach(([ox, oz]) => dBox(0.04, 0.24, 0.04, 0x2b2b2b, bx9 + ox, 0, bz9 + oz));
      colliders.push({ x0: bx9 - 0.9, x1: bx9 + 0.9, y0: 0, y1: 0.42, z0: bz9 - 0.28, z1: bz9 + 0.28 }); });
    // 도서반납함(영상 W_224·W_226): 연회색 몸통 + 서쪽 흰 앞판(글씨) + 짙은 회색 윗판 — 파사드 남쪽 기둥 앞
    { const rx9 = LOB_X - 0.21 - 0.225;
      addBox(0.45, 0.95, 0.55, 0xc9cfd6, rx9, 0, -35.2, NS);
      dBox(0.03, 0.7, 0.45, 0xf4f6f8, rx9 - 0.24, 0.12, -35.2);
      dBox(0.47, 0.04, 0.57, 0x5a5e62, rx9, 0.95, -35.2);
      dBox(0.03, 0.06, 0.3, 0x3a3d42, rx9 - 0.27, 0.66, -35.2);
      sign('도서반납함', rx9 - 0.265, 0.5, -35.2, -Math.PI / 2, 0.08, { bg: '#f4f6f8', fg: '#2f6fd0' }); }
    // 측문 통로(영상 W_216.5~218): 북벽 서쪽 끝(측문 바로 옆)에 연한 나무 오픈 칸 신발장(2열×5단) + 옆 바닥 소화기 · 문 안 갈색 코일 매트 · 로비 경계 검은 띠
    { const sx0 = wx0 + 0.2, sx1 = wx0 + 1.0, sz0 = LOB_Z + 0.15, sz1 = LOB_Z + 0.5, SW = 0xcaa87a;
      [sx0 + 0.015, (sx0 + sx1) / 2, sx1 - 0.015].forEach(x9 => dBox(0.03, 1.2, sz1 - sz0, SW, x9, 0, (sz0 + sz1) / 2));
      for (let k = 0; k <= 5; k++) dBox(sx1 - sx0 - 0.03, 0.03, sz1 - sz0 - 0.02, SW, (sx0 + sx1) / 2, 0.02 + k * 0.232, (sz0 + sz1) / 2);
      [[0, 1, 0x3b3b3b], [1, 2, 0xe8e8e8], [0, 3, 0x5a78b0], [1, 0, 0xd06a5a]].forEach(([c9, r9, h9]) => dBox(0.26, 0.08, 0.22, h9, sx0 + 0.2 + c9 * 0.4, 0.05 + r9 * 0.232, (sz0 + sz1) / 2 + 0.03));
      colliders.push(noStand({ x0: sx0, x1: sx1, y0: 0, y1: 1.2, z0: sz0, z1: sz1 }));
      extinguisher(sx1 + 0.25, 0, LOB_Z + 0.3); }
    patQuad('check', wx0 + 0.15, wx0 + 1.6, VZ[0] + 0.3, VZ[1] - 0.3, 0.02, false, 0xb08a60);   // 갈색·베이지 코일 매트(체크 무늬를 갈색으로 물들임)
    addPanel(0.25, VZ[1] - VZ[0] - 0.3, 0x2f3236, LOB_X0 - 0.125, 0.02, SIDE_Z);                 // 통로|로비 경계 검은 띠
    // 계단홀 입구 서쪽 모서리: 회색 우산꽂이(우산 몇 개) + 소화기(영상 s_158.5~160·W_199)
    { const ux9 = STX0 + 0.45, uz9 = fz0 - 0.75;
      dBox(0.55, 0.42, 0.3, 0x9a948a, ux9, 0, uz9);
      [[-0.18, 0xf2c230], [-0.06, 0xe68aa8], [0.06, 0x3f6fb0], [0.18, 0xf2c230]].forEach(([o9, c9]) => dRod(ux9 + o9, 0.3, uz9, ux9 + o9 + 0.03, 0.95, uz9 + 0.02, 0.02, c9));
      colliders.push(noStand({ x0: ux9 - 0.28, x1: ux9 + 0.28, y0: 0, y1: 0.42, z0: uz9 - 0.15, z1: uz9 + 0.15 }));
      extinguisher(STX0 + 0.3, 0, fz0 - 0.35); }
    zones.push({ x0: LOB_X0, x1: LOB_X, z0: LOB_Z, z1: fz0, y: 0, label: '서측 로비' });
    zones.push({ x0: wx0, x1: LOB_X0, z0: VZ[0], z1: VZ[1], y: 0, label: '측문' });
    [-31.5, -28.0].forEach(x9 => lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (LOB_Z + fz0)/2));
    // 측문 밖: 턱 0.3 → 작은 참 + 남쪽으로 내려가는 경사로(크림 낮은 벽 — 영상 g_111~112)
    addBox(1.4, -YARD, 2.4, STONE, wx0 - 0.85, YARD, SIDE_Z);
    slope('pave', 'z', wx0 - 1.55, wx0 - 0.15, SIDE_Z + 1.2, SIDE_Z + 5.7, 0, YARD, 6);
    addBox(0.15, 0.9 - YARD, 4.5, 0xefe3b8, wx0 - 1.625, YARD, SIDE_Z + 3.45, NS);
  }
  { // U자 계단(영상 v2180_0159~0174 · 문서 v80c): 계단홀 서쪽 레인으로 북쪽 반층 참까지 → 180° 돌아 동쪽 레인으로 남쪽 2층
    const N = 12, RISE = (FH + 0.3) / 2 / N, TR = 0.2875, LW = (wx1 - STX0 - 0.3) / 2;
    const AX = STX0 + 0.15 + LW / 2, BX = wx1 - 0.15 - LW / 2, Z0 = -38.9, ZL = Z0 - N * TR;
    const SG = 0xa6a6a2;   // 디딤판·참 = 중간 회색 화강 테라초(영상 s_161.5·s_166.5 — 1층 흰 타일보다 한 톤 짙음)
    for (let i = 0; i < N; i++) addBox(LW, RISE * (i + 1), TR, SG, AX, 0, Z0 - TR * (i + 0.5));
    addBox(wx1 - STX0 - 0.3, RISE * N, ZL - (wz0 + 0.15), SG, (STX0 + wx1) / 2, 0, (ZL + wz0 + 0.15) / 2);   // 반층 참(북벽 창가)
    for (let j = 0; j < N; j++) addBox(LW, 0.3, TR, SG, BX, RISE * (N + j + 1) - 0.3, ZL + TR * (j + 0.5));  // 동 레인 디딤판
    addBox(wx1 - STX0, 0.3, wz1 + 0.02 - Z0, 0xd9dce1, (STX0 + wx1) / 2, FH, (Z0 + wz1 + 0.02) / 2);           // 2층 바닥(계단홀 남쪽 위)
    // 난간(영상 b_160~175): 두 레인 사이 스테인리스 · 벽 쪽 나무 손잡이 · 참 창 앞 막이
    const MX = STX0 + 0.15 + LW, WC = (STX0 + wx1) / 2, WH = 1.6;
    steelRail(MX - 0.07, Z0 - 0.2, MX - 0.07, ZL + 0.15, RISE, RISE * N);   // 칸막이 칠 면(MX-0.01~0.015)과 기둥 겉면이 스치지 않게 3cm 띄움
    steelRail(MX + 0.04, ZL + 0.15, MX + 0.04, Z0 - 0.2, RISE * (N + 1), FH + 0.3);
    dRod(STX0 + 0.21, 0.9, Z0, STX0 + 0.21, 0.9 + RISE * N, ZL, 0.03, 0x8a5a3b);
    dRod(wx1 - 0.21, 0.9 + RISE * N, ZL, wx1 - 0.21, 0.9 + FH + 0.3, Z0, 0.03, 0x8a5a3b);
    steelRail(STX0 + 0.3, wz0 + 0.35, wx1 - 0.3, wz0 + 0.35, RISE * N);
    // 2층: 서 레인 위 빈 곳 = 스테인리스 세로살 난간(영상 s_174·s_187.5 — 예전 회색 통벽). 충돌은 예전 벽 크기 그대로(떨어짐·올라서기 막기)
    steelRail(STX0 + 0.3, Z0 + 0.08, MX - 0.1, Z0 + 0.08, FH + 0.3);
    colliders.push(noStand({ x0: STX0 + 0.15, x1: MX, y0: FH + 0.3, y1: FH + 1.9, z0: Z0, z1: Z0 + 0.16, nc: true }));
    floorQ('tileG', STX0 + 0.15, wx1 - 0.15, Z0, wz1 + 0.02, FH + 0.3, 0xa9aaa7);                            // 2층 계단홀 = 중간 회색 테라초(영상 s_176~177)
    patQuad('cflat', STX0 + 0.15, wx1 - 0.15, Z0 + 0.01, fz0, FH - 0.012, true);                         // 1층 계단홀 천장(2층 바닥 밑면이 갈색으로 보이던 것)
    // 계단홀 입구 위 흰 보(영상 s_195·b_013.5 — 글자 없는 작은 회색 판 하나. 예전 '계단 · 2층' 글자 팻말은 영상에 없어 뺐다)
    addBox(wx1 - STX0 - 0.3, FH - 2.95, 0.3, 0xf2eee4, WC, 2.95, fz0, { collide: false });
    dBox(0.4, 0.15, 0.03, 0x9aa0a6, WC, 3.05, fz0 + 0.165);
    // 테두리보(1·2층 벽 사이 띠) — 참 창 폭은 비운다(영상 s_166.5·b_168: 참 바닥~2층 천장 근처까지 한 장으로 이어진 큰 창)
    addBox(WC - WH - STX0, 0.3, 0.3, WALL, (STX0 + WC - WH) / 2, FH, wz0);
    addBox(wx1 + 0.15 - (WC + WH), 0.3, 0.3, WALL, (WC + WH + wx1 + 0.15) / 2, FH, wz0);
    addBox(0.3, 0.3, Z0 - (wz0 + 0.15), WALL, wx1, FH, (Z0 + wz0 + 0.15) / 2);
    { const FC = 0x7a5a3e;   // 참 창: 1층 창(2.0~3.4)과 2층 창(3.7~6.3) 사이도 유리(틀 옆판·세로살 이음) + 맨 아랫줄 반투명 유리 + 가로살
      glassPane('x', 2 * WH, 0.3, WC, FH, wz0);
      [-1, 1].forEach(sd => dBox(0.06, 0.3, 0.2, FC, WC + sd * (WH - 0.03), FH, wz0));
      [-0.8, 0, 0.8].forEach(o => dBox(0.05, 0.3, 0.2, FC, WC + o, FH, wz0));
      dBox(2 * WH - 0.12, 0.05, 0.17, FC, WC, 2.88, wz0);
      lamp(2 * WH - 0.14, 0.81, 0.03, WC, 2.07, wz0 + 0.05);          // 반투명 유리 = 빛을 받는 흰 판(조명 무시 재질 — 북향 그늘에서도 뿌옇게 밝다)
      dBox(2 * WH - 0.12, 0.05, 0.17, FC, WC, 4.98, wz0); }
    // 칸막이(영상 b_013.5·s_160: 서 레인은 서벽과 칸막이 사이 슬롯) — 동 레인 디딤판 밑면까지 계단형. 동쪽 = 동 레인 밑 창고
    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = j === N - 1 ? Z0 + 0.15 : ZL + TR * (j + 1);
      addBox(0.2, RISE * (N + j + 1) - 0.3, zb - za, 0xd3eadf, MX + 0.1, 0, (za + zb) / 2); }
    // 창고 앞벽(작은 전실 북벽 — 크림 평문, 영상 b_013.5·s_160)
    wallX(MX + 0.2, wx1 - 0.15, Z0, INNER, { face: -1, dado: { top: 1.3, lo: 0xf3e2a0, hi: 0xd3eadf }, gaps: [{ c: wx1 - 0.85, w: 0.9, color: 0xe6dcc4 }] });
    dBox(0.1, 0.1, 0.06, INNER, wx1 - 0.22, 1.0, Z0);   // 벽 속 표지: 창고 문은 서쪽(칸막이 속)으로 열린다 — 동쪽이면 문짝이 동벽을 뚫고 뒷길로 삐져나온다
    zones.unshift({ x0: MX + 0.2, x1: wx1 - 0.15, z0: ZL, z1: Z0 - 0.15, y: 0, label: '계단 밑 창고' });   // 첫 일치 = 이 이름(숨바꼭질 지점)
    // 전실 수레(흰 틀·초록 바닥 — 영상 b_013.5) · 올라서기 금지
    { const cx = MX + 0.75, cz = Z0 + 0.75;
      dBox(0.6, 0.06, 0.9, 0x3f8a5a, cx, 0.22, cz); [-1, 1].forEach(s => dBox(0.04, 0.04, 0.9, 0xf2f2ee, cx + s * 0.28, 0.28, cz));
      dRod(cx - 0.28, 0.28, cz + 0.43, cx - 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee); dRod(cx + 0.28, 0.28, cz + 0.43, cx + 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee);
      dRod(cx - 0.28, 1.0, cz + 0.43, cx + 0.28, 1.0, cz + 0.43, 0.018, 0xf2f2ee);
      [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]].forEach(([ox, oz]) => dCyl(0.07, 0.07, 0.05, 0x2b2b2b, cx + ox, 0.08, cz + oz, { rot: [0, 0, Math.PI / 2], seg: 10 }));
      [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.38], [0.24, 0.38]].forEach(([ox, oz]) => dBox(0.04, 0.1, 0.04, 0x9aa0a6, cx + ox, 0.12, cz + oz));
      colliders.push(noStand({ x0: cx - 0.32, x1: cx + 0.32, y0: 0, y1: 1.05, z0: cz - 0.47, z1: cz + 0.47 })); }
    // 점자블록(영상 s_160·s_166.5·s_174): 서 레인 첫 단 앞 · 참의 두 레인 끝 · 2층 동 레인 끝 단 앞
    patQuad('tactX', AX - LW / 2 + 0.15, AX + LW / 2 - 0.15, Z0 + 0.25, Z0 + 0.65, 0.022);
    [AX, BX].forEach(x9 => patQuad('tactX', x9 - LW / 2 + 0.15, x9 + LW / 2 - 0.15, ZL - 0.5, ZL - 0.1, RISE * N + 0.01));
    patQuad('tactX', BX - LW / 2 + 0.15, BX + LW / 2 - 0.15, Z0 + 0.15, Z0 + 0.55, FH + 0.3 + 0.022);
    // 디딤판 앞끝 논슬립 줄(짙은 회색) + 챌면 몇 칸 색 띠(영상 s_161.5·b_163.5 — 글귀 대신 색만)
    const BAND = [0x9a7cc0, 0x7ab36a, 0xe89a52, 0x6f9fd6];
    for (let i = 0; i < N; i++) {
      dBox(LW, 0.03, 0.05, 0x6b6b67, AX, RISE * (i + 1), Z0 - TR * i - 0.025);
      dBox(LW, 0.03, 0.05, 0x6b6b67, BX, RISE * (N + i + 1), ZL + TR * i + 0.025);
      if (i % 3 === 1) { dBox(LW - 0.5, 0.06, 0.03, BAND[(i / 3) | 0], AX, RISE * i + 0.05, Z0 - TR * i + 0.015);
        dBox(LW - 0.5, 0.06, 0.03, BAND[((i / 3) | 0) ^ 1], BX, RISE * (N + i) + 0.05, ZL + TR * i - 0.015); }
    }
    // 벽 칠(STAIR-PAINT · 영상 s_158.5~187.5): 노랑/민트 경계가 나무 손잡이와 나란히 레인 따라 비스듬히 오르고(참 +1.3), 2층에서 다시 +1.3 수평.
    //   벽 면 1cm 앞 사다리꼴(건물 청크에 합침 → 드로우콜 0·감사 제외). B·D·T = 바닥선·노랑 윗선·꼭대기선([a0 값, a1 값] 선형)
    const SY = 0xf3e2a0, SM = 0xd3eadf, PQ = new Map();
    const paint = (ax, line, f, a0, a1, b0, b1, t0, t1, hex, off = 0.01) => {
      if (a1 - a0 < 0.01 || (t0 - b0) + (t1 - b1) < 0.004 || t0 < b0 - 1e-6 || t1 < b1 - 1e-6) return;
      const L = line + f * off, P = ax === 'z' ? [[L, b0, a0], [L, b1, a1], [L, t1, a1], [L, t0, a0]] : [[a0, b0, L], [a1, b1, L], [a1, t1, L], [a0, t0, L]];
      const u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], v = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
      const nn = ax === 'z' ? u[1] * v[2] - u[2] * v[1] : u[0] * v[1] - u[1] * v[0];
      let arr = PQ.get(hex); if (!arr) PQ.set(hex, arr = []);
      for (const i of (nn * f < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3])) arr.push(...P[i]);
    };
    const tone = (ax, line, f, a0, a1, B, D, T) => {
      const ts = [0, 1], cr = (P, Q) => { const d0 = P[0] - Q[0], d1 = P[1] - Q[1]; if (d0 * d1 < 0) ts.push(d0 / (d0 - d1)); };
      cr(B, D); cr(B, T); cr(D, T); ts.sort((p, q) => p - q);
      const at = (P, t) => P[0] + (P[1] - P[0]) * t;
      for (let k = 0; k < ts.length - 1; k++) {
        const u = ts[k], v = ts[k + 1]; if (v - u < 1e-4) continue;
        const b = [at(B, u), at(B, v)], t = [at(T, u), at(T, v)], d = [Math.max(b[0], Math.min(at(D, u), t[0])), Math.max(b[1], Math.min(at(D, v), t[1]))];
        paint(ax, line, f, at([a0, a1], u), at([a0, a1], v), b[0], b[1], d[0], d[1], SY);
        paint(ax, line, f, at([a0, a1], u), at([a0, a1], v), d[0], d[1], t[0], t[1], SM);
      }
    };
    const K = (v) => [v, v], TOP = K(FH * 2), up = 1.3, zS = wz1 - 0.15, z2 = wz1 - B.upper.corridorDepth - 0.15;
    const byW = z => (Z0 - z) / TR * RISE, byE = z => RISE * N + (z - ZL) / TR * RISE;
    // 서벽(x STX0 안쪽 면, +x를 봄): 참 · 서 레인 · 1층(도서관 뒷문 z fz0-1.4 ±0.5 비움) · 2층(소담실 동벽)
    const WX = STX0 + 0.15;
    tone('z', WX, 1, wz0 + 0.15, ZL, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('z', WX, 1, ZL, Z0, [byW(ZL), 0], [byW(ZL) + up, up], TOP);
    tone('z', WX, 1, Z0, fz0 - 1.9, K(0), K(up), K(FH)); tone('z', WX, 1, fz0 - 1.9, fz0 - 0.9, K(2.6), K(2.6), K(FH)); tone('z', WX, 1, fz0 - 0.9, zS, K(0), K(up), K(FH));
    tone('z', WX, 1, Z0, z2, K(FH + 0.3), K(FH + 0.3 + up), TOP);
    // 동벽(x wx1 안쪽 면, -x를 봄): 참 · 동 레인 · 1층 전실(뒷길 유리문 z -38.8~-37.0 비움) · 2층(창 z -35.8~-34.6 비움)
    const EX = wx1 - 0.15;
    tone('z', EX, -1, wz0 + 0.15, ZL, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('z', EX, -1, ZL, Z0, [byE(ZL), byE(Z0)], [byE(ZL) + up, byE(Z0) + up], TOP);
    tone('z', EX, -1, Z0, -38.8, K(0), K(up), K(FH)); tone('z', EX, -1, -38.8, -37.0, K(2.6), K(2.6), K(FH)); tone('z', EX, -1, -37.0, zS, K(0), K(up), K(FH));
    tone('z', EX, -1, Z0, -35.8, K(FH + 0.3), K(FH + 0.3 + up), TOP); tone('z', EX, -1, -35.8, -34.6, K(FH + 0.3), K(FH + 0.3 + up), K(FH + 1.2));
    tone('z', EX, -1, -35.8, -34.6, K(FH + 2.6), K(FH + 2.6), TOP); tone('z', EX, -1, -34.6, zS, K(FH + 0.3), K(FH + 0.3 + up), TOP);
    // 북벽(z wz0 안쪽 면, +z를 봄): 창 양옆 · 창 밑(창턱 2.0까지) · 창 위(6.3~)
    const NZ = wz0 + 0.15;
    tone('x', NZ, 1, STX0 + 0.15, WC - WH, K(RISE * N - 0.01), K(RISE * N + up), TOP); tone('x', NZ, 1, WC + WH, wx1 - 0.15, K(RISE * N - 0.01), K(RISE * N + up), TOP);
    tone('x', NZ, 1, WC - WH, WC + WH, K(RISE * N - 0.01), K(2.0), K(2.0)); tone('x', NZ, 1, WC - WH, WC + WH, K(6.3), K(6.3), TOP);
    // 칸막이 서면(서 레인 쪽) · 남면(전실 쪽)
    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = Math.min(Z0, ZL + TR * (j + 1)), tj = RISE * (N + j + 1) - 0.3;
      tone('z', MX, -1, za, zb, [byW(za), byW(zb)], [byW(za) + up, byW(zb) + up], K(tj)); }
    tone('z', MX, -1, Z0, Z0 + 0.15, K(0), K(up), K(FH)); tone('x', Z0 + 0.15, 1, MX, MX + 0.2, K(0), K(up), K(FH));
    // 검은 걸레받이(영상 s_161.5·s_166.5·s_187.5): 바닥·참 +0.1, 레인 = 디딤판 앞끝 선 위 0.1(칠 면보다 5mm 앞)
    //   ⚠️바닥 면을 뚫지 않게 바닥 위 2mm에서 시작(비스듬히 보이는 바닥과 교차선이 깜빡였다 — 칠 면이 그 틈을 채운다)
    const KB = 0x3a3d42, sk = (ax, line, f, a0, a1, b0, b1, h = 0.1) => paint(ax, line, f, a0, a1, b0, b1, b0 + h, b1 + h, KB, 0.015);
    const F1 = 0.014, FL = RISE * N + 0.002, F2 = FH + 0.3 + 0.014;
    sk('z', WX, 1, wz0 + 0.15, ZL, FL, FL); sk('z', WX, 1, ZL, Z0, byW(ZL), 0, RISE + 0.1);
    sk('z', WX, 1, Z0, fz0 - 1.9, F1, F1); sk('z', WX, 1, fz0 - 0.9, zS, F1, F1); sk('z', WX, 1, Z0, z2, F2, F2);
    sk('z', EX, -1, ZL, Z0, byE(ZL), byE(Z0), RISE + 0.1);   // 참 동벽 토막은 뺀다(서 레인 난간 기둥 너머 검은 띠가 걸을 때 번쩍임 — 깜빡임 검사 실측)
    sk('z', EX, -1, Z0, -38.8, F1, F1); sk('z', EX, -1, -37.0, zS, F1, F1); sk('z', EX, -1, Z0, zS, F2, F2);
    sk('x', NZ, 1, STX0 + 0.15, wx1 - 0.15, FL, FL);
    for (let j = 0; j < N; j++) { const za = ZL + TR * j, zb = Math.min(Z0, ZL + TR * (j + 1)), tj = RISE * (N + j + 1) - 0.3;
      if (tj > byW(za) + RISE + 0.1) sk('z', MX, -1, za, zb, byW(za), byW(zb), RISE + 0.1); }
    sk('z', MX, -1, Z0, Z0 + 0.15, F1, F1); sk('x', Z0 + 0.15, 1, MX, MX + 0.2, F1, F1);
    for (const [hex, arr] of PQ) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); dGeo(g, new THREE.Matrix4(), hex, { at: [WC, (wz0 + fz0) / 2] }); g.dispose(); }
    // 위치칩 구역(게임 지점 이름): 반층 참 + 두 레인 · 2층 계단홀(동 레인 윗부분 포함)
    zones.push({ x0: STX0, x1: wx1, z0: wz0, z1: Z0, y: RISE * N, label: '계단참' });
    zones.push({ x0: STX0, x1: wx1, z0: Z0 - 1.0, z1: wz1 - B.upper.corridorDepth, y: FH + 0.3, label: '2층 계단' });
  }
  addBox(STX0 - wx0, 0.3, wz1 - wz0 + 0.02, 0xd9dce1, (wx0 + STX0)/2, FH, (wz0 + wz1)/2 + 0.01);   // 1층 지붕 = 2층 바닥(남단 z-33.98 = 본관 지붕과 맞댐)
  ceil(wx0, STX0, wz0, KBZ + 0.16, FH, 'ctile');                                // 1층 천장: 로비 북쪽 방들·측문 통로
  ceil(LOB_X0, STX0, KBZ - 0.16, fz0 + 0.16, FH, 'ctile');                      // 서측 로비·도서관 남쪽
  {
    const zc2 = wz1 - B.upper.corridorDepth;
    B.upper.rooms.forEach((r, i) => {
      const [s0, s1] = r.span, cx = (s0+s1)/2;
      if (i > 0) addBox(0.3, FH-0.3, zc2-wz0-0.3, INNER, s0, FH+0.3, (wz0+zc2)/2);
      floorQ('wood', s0 + 0.15, s1 - 0.15, wz0 + 0.15, zc2 - 0.15, FH + 0.3);
      const nD = (s1 - s0) > 7 ? 3 : 1;
      if (r.type === 'classroom') westClass(r.name, s0 + 0.15, s1 - 0.15, zc2 - 0.15, wz0 + 0.15, FH + 0.3, { sill: 0.8 });   // 서향 교실(6학년 서벽 = 바깥벽 — 교실 쪽 창 없음)
      else for (let d = 0; d < nD; d++) { studentDesk(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3); chair(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3.65, 1); }
      hangSign(r.name, doorC(r), FH + 0.3 + 2.72, zc2, 1);
      zones.push({ x0: s0, x1: s1, z0: wz0, z1: zc2, y: FH+0.3, label: r.name });
      [1, 2].forEach(k => lamp(1.2, 0.05, 0.22, cx, FH*2 - 0.21, wz0 + k * 2.6));
      ceil(s0, s1, wz0, zc2, FH * 2, 'ctile');
    });
    zones.push({ x0: wx0, x1: wx1, z0: zc2, z1: wz1, y: FH+0.3, label: '2층 복도' });
    // 2층 교실 복도벽(영상 s_181~182): 노랑 징두리(+1.15)·민트 위 두 톤 + 교실마다 앞·뒷문 사이 짙은 나무틀 복도창(창턱 +1.2·윗선 +2.4)
    const upWins = B.upper.rooms.filter(twoDoor).map(r => { const a = doorC(r) + 0.95, b = backDoor(r).c - 0.95; return { c: (a + b) / 2, w: b - a, sill: 1.2, dh: 2.4, win: true, frame: 0x6b4a32 }; });
    wallX(wx0 + 0.15, STX0 + 0.15, zc2, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: { top: 1.15, lo: 0xf3e2a0, hi: 0xd3eadf }, gaps: [...B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })), ...B.upper.rooms.filter(twoDoor).map(backDoor), ...upWins] });
    { const sd = B.upper.rooms.find(r => r.name === '소담실');   // 소담실 문 위 '상담실' 팻말이 겹쳐 달림 · 계단 쪽 끝 코르크 게시판 · 화재경보 발신기(영상 s_177·s_181)
      hangSign('상담실', doorC(sd), FH + 0.3 + 2.38, zc2, 1);
      dBox(1.3, 0.95, 0.04, 0x8a6a45, -17.6, FH + 1.3, zc2 + 0.17); patWall('kidsArt', 'x', -18.2, -17.0, FH + 1.35, FH + 2.2, zc2 + 0.192, 1);
      dBox(0.25, 0.45, 0.04, 0xc0c4c8, -16.3, FH + 1.2, zc2 + 0.17);
      dCyl(0.07, 0.07, 0.04, 0xd8342c, -16.3, FH + 1.5, zc2 + 0.19, { rot: [Math.PI / 2, 0, 0], seg: 10 });
      dCyl(0.03, 0.03, 0.03, 0xe84a3a, -16.3, FH + 1.3, zc2 + 0.19, { rot: [Math.PI / 2, 0, 0], seg: 8 }); }
    wallZ(wz0, zc2, STX0, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO });   // 소담실 동벽(계단홀 쪽 두 톤)
    floorQ('tileG', wx0 + 0.15, STX0 + 0.15, zc2 + 0.15, wz1 - 0.15, FH + 0.3, 0xa9aaa7);   // 2층 복도 = 중간 회색 화강 테라초(영상 s_182 — 1층 흰 타일과 구분)
    ceil(wx0, wx1, zc2, wz1, FH * 2, 'cflat');
    for (let x9 = wx0 + 2; x9 < wx1 - 1; x9 += 3.6) lamp(0.62, 0.05, 0.3, x9, FH * 2 - 0.21, (zc2 + wz1)/2);
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xc98a4e, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });   // 북쪽 파라펫 = 주황 콘크리트 갓(영상 b_030)
  { // BACKYARD-0: 주황 콘크리트 띠(영상 n_030.5·b_022: 1층 창 머리 연속 띠 · 2층 창턱 띠 · 꼭대기 테 · 1층 창마다 창턱) — 벽 면에서 0.1 튀어나옴, 끝 0.06 인셋
    const ORG = 0xc98a4e, I9 = 0.06, xa = wx0 - 0.15 + I9, xb = wx1 + 0.25, za = wz0 - 0.15, zb = wz1 - 0.15 - I9, SW = [(STX0 + wx1)/2 - 1.62, (STX0 + wx1)/2 + 1.62];   // 북동 모서리는 북면 띠가 동면 띠 끝을 덮는다(맞댐)
    [[2.6, 0.2], [FH + 0.3 + 0.6, 0.14]].forEach(([y9, h9]) => {
      [[xa, SW[0]], [SW[1], xb]].forEach(([a, b]) => dBox(b - a, h9, 0.1, ORG, (a + b)/2, y9, wz0 - 0.2));   // 북면(계단참 큰 창 자리는 건너뜀)
      dBox(0.1, h9, zb - za, ORG, wx1 + 0.2, y9, (za + zb)/2);                                                 // 동면(뒷길)
    });
    dBox(wx1 - wx0 + 0.85, 0.3, 0.05, ORG, (wx0 + wx1)/2 + 0.025, FH*2, wz0 - 0.425);                       // 꼭대기 테(지붕판 북쪽 끝)
    dBox(0.05, 0.3, wz1 - wz0 + 0.8, ORG, wx1 + 0.425, FH*2, (wz0 + wz1)/2);                                 // 꼭대기 테(동쪽 끝)
    for (const w of winLog) if (w.ax === 'x' && Math.abs(w.line - wz0) < 0.01 && w.f === -1 && w.y0 === 0 && w.g1 < STX0)   // 1층 창턱(창보다 넓게)
      dBox(w.g1 - w.g0 + 0.3, 0.12, 0.16, ORG, (w.g0 + w.g1)/2, w.yb - 0.17, wz0 - 0.23);
  }

  // ================= 급식동 =================
  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z, KH = K.wallHeight;
  foundation(kx0 - 0.15, kx1, kz0 - 0.15, kz1);
  if (LC.z[0] - kz0 > 0.3) foundation(kx1, kx1 + 0.15, kz0 - 0.15, LC.z[0] - 0.15);                          // 북동 모서리 동면(세로복도보다 북쪽으로 나올 때만)
  // BACKYARD-1(09-24 영상 b_016~043): 서·북면 = 겨자 노랑 민무늬 칠(판 줄눈 없음) · 흰 알루미늄 창(위아래 2단) · 북면 판엔 창 없음(b_036~042)
  //   서면(뒷길) = '통제구역' 알루미늄 유리문(b_021~022) + 작은 창(당직실) + 큰 창 2 · 남끝 = 벽돌 덩어리(서쪽으로 튀어나옴 — b_016·b_021)
  const KYEL = 0xe9c35c, KWIN = 0xe9ecec;
  wallX(kx0 - 0.15, kx1 + 0.15, kz0, KYEL, { h: KH, face: -1, ext: true, gaps: [{ c: K.backDoorC, w: 1.2 }] });   // 조리실 뒷문
  wallZ(kz0, kz1, kx0, KYEL, { h: KH, face: -1, ext: true, gaps: [{ c: -39.55, w: 1.0, dh: 2.3, glass: true, door: true, color: 0x8a9096 },
    { c: -36.9, w: 1.0, sill: 1.1, dh: 2.0, win: true, frame: KWIN }, ...[-41.35, -43.85].map(c => ({ c, w: 2.2, sill: 0.95, dh: 3.3, win: true, frame: KWIN }))] });
  // 동벽(x 10): ①북쪽 밖 ②세로복도 서벽(급식실이 보이는 큰 실내 창 — 영상 c_351~356 · 북끝 짙은 문) ③로비 서벽(붉은 벽돌 — c_350~352). 위(FH~) = 바깥
  wallRun('z', kz0 + 0.15, LC.z[0], kx1, WALL, { h: KH, face: 1, skin: 'panelB' });
  // LINK-EAST-1·5·6·13(09-24 영상 c_351~362·a_444~451): 서벽 = 크림 기둥(0.6×0.25)으로 나뉜 3칸 창(흰 징두리 0.55 · 아래 쪽창 줄 · 짙은 큰 유리 · 위 광창)
  //   + 짙은 문(검은 알루미늄 틀 유리문 2.2 · 크림 차양) + 문~북벽을 채운 짙은 적벽돌 기둥. 벽돌 구간은 로비 서벽에만(z -37.6까지 — 큰 화분 셋 + AED 폭)
  //   칸 폭 비 3.5 : 3 : 3(영상) — 벽돌 북끝(로비 서벽 끝 = hall_lobby-5와 같은 식) ~ 짙은 문 옆 벽 0.4 사이에 맞춰 늘고 준다(로비 크기가 바뀌어도 그대로)
  const LBZ = CL.z[0] - 0.1, LZS = LBZ - 0.5, LZN = K.cornerDoorZ + 0.9, LBU = (LZS - LZN - 1.2) / 9.5;
  const LW = [3.5, 3, 3].map(k => k * LBU), LBAY = LW.map((w, i) => [LZS - LW.slice(0, i).reduce((a, b) => a + b, 0) - 0.6 * i - w / 2, w]);   // [가운데 z, 폭] 남→북
  const LPIL = [LZS - LW[0] - 0.3, LZS - LW[0] - LW[1] - 0.9];                          // 기둥 P1·P2 가운데 z
  wallRun('z', Math.max(LC.z[0], kz0 + 0.15), LBZ, kx1, 0xbcc8ca, { h: FH, inner: true, face: -1, gaps: [{ c: K.cornerDoorZ, w: 1.0, dh: 2.2, color: 0x1c2124 }, ...LBAY.map(([c, w]) => ({ c, w, sill: 0.55, dh: 2.7, win: true, frame: 0xe8ecec }))] });
  LBAY.forEach(([c, w]) => {
    dBox(0.16, 0.05, w, 0xf0ede4, kx1 + 0.23, 0.5, c);                                                  // 흰 징두리 위 창턱(복도 쪽으로 튀어나옴 — 기둥 면과 맞댐)
    // 줄 = 아래 쪽창(흐린 격자 시트 a_444·a_447) | 큰 유리(짙은 청회색 — 급식실 안이 거의 안 보임) | 위 광창(조금 밝게) — 복도 쪽만 · 줄 경계 = 무늬 바뀜(가로살 상자 대신 — 삼각형 예산) · 세로살 = winFrame 4짝
    //   큰 유리·광창 = 조명 무시 짙은 청회색(영상 c_353.8·c_358.2 중앙값 #353f37~#3f483c — 예전 초록 시트지 'film'은 그늘에서 거의 검정 #05160e)
    patWall('film2', 'z', c - w/2 + 0.06, c + w/2 - 0.06, 0.61, 1.1, kx1 + 0.09, 1, 0xc9cfd2);
    [[1.1, 2.4, 0x3c4843], [2.4, 2.64, 0x56625d]].forEach(([y0, y1, t9]) => patPush('cflat', [[kx1 + 0.09, y0, c - w/2 + 0.06], [kx1 + 0.09, y0, c + w/2 - 0.06], [kx1 + 0.09, y1, c + w/2 - 0.06], [kx1 + 0.09, y1, c - w/2 + 0.06]],
      [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], [1, 0, 0], t9));
  });
  LPIL.forEach(c => addBox(0.25, FH, 0.6, 0xece6d6, kx1 + 0.275, 0, c));                // 칸 사이 크림 기둥 P1·P2
  wallRun('z', LBZ, kz1 - 0.15, kx1, 0x9a8a78, { h: FH, inner: true, innerHex: 0xbcc8ca, face: 1 });
  patWall('brickW', 'z', LBZ, kz1 - 0.15, 0, FH, kx1 + 0.162, 1);
  wallRun('z', Math.max(LC.z[0], kz0 + 0.15), kz1 - 0.15, kx1, WALL, { y0: FH, h: KH - FH, face: 1, innerHex: 0xbcc8ca });
  addBox(0.35, FH, 0.65, 0x8e4f3c, kx1 + 0.325, 0, K.cornerDoorZ - 0.825);                             // 짙은 문 옆 적벽돌 기둥(문 설주 ~ 북벽 면 — c_362·a_444)
  patWall('brickW', 'z', K.cornerDoorZ - 1.14, K.cornerDoorZ - 0.51, 0, FH, kx1 + 0.512, 1, 0x8c7c78);
  patWall('brickW', 'x', kx1 + 0.16, kx1 + 0.49, 0, FH, K.cornerDoorZ - 0.488, 1, 0x8c7c78);
  { const dz = K.cornerDoorZ, cr = 0xe6dfcc;                                                           // 짙은 문 크림 틀 + 위 차양(a_444)
    dBox(0.18, 0.12, 1.15, cr, kx1 + 0.24, 2.28, dz + 0.075); dBox(0.06, 0.08, 1.08, cr, kx1 + 0.18, 2.2, dz + 0.04);   // 북쪽 끝 = 벽돌 기둥 남면에 맞댐
    dBox(0.06, 2.2, 0.08, cr, kx1 + 0.18, 0, dz + 0.54); }
  patQuad('gmat', kx1 + 0.15, kx1 + 1.1, K.cornerDoorZ - 0.5, K.cornerDoorZ + 0.5, 0.02, false, 0x9fd49a);   // 초록 매트
  exitSign(kx1 + 0.15, K.cornerDoorZ, 2.6, [1, 0]);                                                    // LINK-EAST-7: 비상구 유도등(동관 복도 축에서 정면 — a_438~442.5)
  // ---- CAFE-2(09-24): 영상 IMG_2178(급식실 안 15초) + 사용자 발언으로 다시 짠 급식실 ----
  //   홀(동) = 흰 양문 입구(남·로비 쪽) → 손 씻는 곳(동벽 남끝) → 식판 수레 → 배식대(서벽·재채기 가림 유리·반찬 칸, 위 만화 그림판) → 식탁(동서 · 빨간 둥근 의자) → 식판 반납대(남서) → 출구
  //   북벽 = 큰 회색 커튼(뒤 = 악기 보관 통로 — 세로복도 짙은 문에서 들어와 커튼 뒤로 홀에 나온다) + 서쪽 끝 회색 유리 양문(창고)
  const HX = K.hallX0, AZ = K.curtainZ, PX = K.passX, SZ = K.serveZ, SC = (SZ[0] + SZ[1]) / 2, Dm = K.dutyRoom, HALLC = 0xbcc8ca;   // 홀 벽 = 옅은 청회색(영상 k_00)
  // 벽: 조리실|홀·창고(x HX — 창고 문·배식창·조리실 문) · 홀 북벽(커튼 벽 — 창고 유리 양문·악기 통로 입구) · 악기 통로 북벽·서벽
  wallZ(kz0, kz1, HX, HALLC, { h: KH, inner: true, face: 1, innerHex: 0xe9ecea, gaps: [{ c: K.storeDoorZ, w: 1.2 }, { c: SC + 0.1, w: 4.8, sill: 1.0, dh: 2.1 }, { c: K.kitchenDoorZ, w: 1.4, glass: true, color: 0xc8ccd0 }] });   // 조리실 문 = 회색 알루미늄 유리문(영상 k_05)
  wallX(HX + 0.15, kx1 - 0.15, AZ, HALLC, { h: KH, inner: true, face: 1, gaps: [{ c: HX + 1.6, w: 1.6, glass: true, door: true, color: 0x8a9096 }, { c: PX + 0.65, w: 1.0, dh: 2.9 }] });   // 통로 입구 = 문짝 없음(커튼)
  wallX(PX - 0.15, kx1 - 0.15, K.cornerDoorZ - 0.9, INNER, { h: KH });
  wallZ(K.cornerDoorZ - 0.9 + 0.15, AZ - 0.15, PX, INNER, { h: KH });
  // 바닥: 홀 = 밝은 회색 화강석 무늬(영상 k_00) · 조리실 = 붉은 기 도는 미끄럼 방지 타일 · 창고·통로 · 당직실
  floorQ('tileG', HX + 0.15, kx1 - 0.15, AZ + 0.15, kz1 - 0.15, 0, 0xa9aaa7);   // 짙은 회색 테라조(영상 k_00 반들반들)
  floorQ('ttile', kx0 + 0.15, HX - 0.15, kz0 + 0.15, Dm.z[0] - 0.15, 0, 0xf2dcd0);
  floorQ('ttile', Dm.x[1] + 0.15, HX - 0.15, Dm.z[0] - 0.15, kz1 - 0.15, 0, 0xf2dcd0);
  floorQ('tileW', HX + 0.15, kx1 - 0.15, kz0 + 0.15, AZ - 0.15, 0, 0xd9d6cc);
  floorQ('tileW', Dm.x[0] + 0.15, Dm.x[1] - 0.15, Dm.z[0] + 0.15, kz1 - 0.15, 0, 0xf2e6cf);
  // ---- 배식대(서벽 홀 쪽): 스테인리스 몸체·상판·반찬 칸 5(밥·국·김치·나물·계란)·재채기 가림 유리·식판 미끄럼 받침 ----
  const XF = HX + 0.15, SL = SZ[1] - SZ[0];
  addBox(0.9, 0.85, SL, 0xc9ced3, XF + 0.45, 0, SC, NS);
  dBox(0.95, 0.04, SL + 0.1, 0xdfe3e6, XF + 0.475, 0.85, SC);
  [[0xf4f1e8, 'rice'], [0xc86a3a, 'soup'], [0xc8452c], [0x6fa04f], [0xe8c35a]].forEach(([col, k], i) => {
    const zc = SZ[0] + 0.62 + i * (SL - 1.24) / 4;
    if (k === 'soup') { dCyl(0.3, 0.27, 0.34, 0xb9bec2, XF + 0.42, 0.89, zc, { seg: 12 }); dCyl(0.26, 0.26, 0.02, col, XF + 0.42, 1.2, zc, { seg: 12 }); }
    else { dBox(0.5, 0.07, 0.8, 0xb9bec2, XF + 0.42, 0.89, zc); dBox(0.44, 0.04, 0.72, col, XF + 0.42, 0.96, zc, { jitter: 0.1 }); }
  });
  glassPane('z', SL - 0.3, 0.42, SC, 1.02, XF + 0.78);                                       // 재채기 가림 유리
  [SZ[0] + 0.2, SC, SZ[1] - 0.2].forEach(z9 => dRod(XF + 0.78, 0.89, z9, XF + 0.78, 1.46, z9, 0.02, 0xcfd4d8));
  dBox(0.3, 0.04, SL, 0xdfe3e6, XF + 1.05, 0.8, SC);                                       // 식판 미끄럼 받침(학생 쪽)
  hotspots.push({ kind: 'meal', x: XF + 1.6, z: SC, y: 0, r: 1.8, label: '급식 받기' });
  { // 배식창 위 만화 그림판(영상 k_04~k_10: 밥 먹는 아이들 그림) — 캔버스 한 장(글자 없음)
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 224; const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 224); bg.addColorStop(0, '#fff6d9'); bg.addColorStop(1, '#ffe7b8'); g.fillStyle = bg; g.fillRect(0, 0, 1024, 224);
    [['#f7b7c6', 60, 40], ['#bfe3f5', 300, 150], ['#c9ecb5', 700, 60], ['#ffd28a', 930, 170]].forEach(([c, x, y]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 70, 0, 7); g.fill(); });
    const kid = (x, hair, shirt, arm) => {
      g.fillStyle = shirt; g.beginPath(); g.ellipse(x, 205, 62, 50, 0, 0, 7); g.fill();
      g.fillStyle = '#f7d0ae'; g.beginPath(); g.arc(x, 112, 56, 0, 7); g.fill();
      g.fillStyle = hair; g.beginPath(); g.arc(x, 100, 58, Math.PI * 1.02, Math.PI * 1.98); g.fill(); g.fillRect(x - 58, 88, 20, 30); g.fillRect(x + 38, 88, 20, 30);
      g.fillStyle = '#2a2222'; [x - 20, x + 20].forEach(ex => { g.beginPath(); g.arc(ex, 116, 6, 0, 7); g.fill(); });
      g.fillStyle = '#f4a3a0'; [x - 34, x + 34].forEach(ex => { g.beginPath(); g.arc(ex, 132, 9, 0, 7); g.fill(); });
      g.strokeStyle = '#b0504a'; g.lineWidth = 5; g.beginPath(); g.arc(x, 132, 14, 0.15, Math.PI - 0.15); g.stroke();
      if (arm) { g.strokeStyle = '#f7d0ae'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 50, 190); g.lineTo(x + 95, 60 + arm); g.stroke(); }
    };
    kid(170, '#3a2e28', '#e0503c', 0); kid(430, '#4a3426', '#3f86d6', 12); kid(640, '#2a2220', '#f2c230', 0); kid(880, '#3a2e28', '#6fbf73', 20);
    [[290, '#ffffff'], [540, '#ffffff'], [770, '#ffffff']].forEach(([x, c]) => { g.fillStyle = '#d9574a'; g.beginPath(); g.ellipse(x, 196, 52, 26, 0, 0, Math.PI); g.fill();   // 밥그릇
      g.fillStyle = c; g.beginPath(); g.ellipse(x, 196, 50, 22, 0, Math.PI, 0); g.fill(); });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mu = new THREE.Mesh(new THREE.PlaneGeometry(SL + 0.4, 1.2), new THREE.MeshLambertMaterial({ map: tex }));
    mu.rotation.y = Math.PI / 2; mu.position.set(XF + 0.034, 2.9, SC); mu.matrixAutoUpdate = false; mu.updateMatrix(); scene.add(mu);
    dBox(0.03, 1.3, SL + 0.5, 0xf2f2ee, XF + 0.015, 2.25, SC);                               // 그림판 흰 테(그림 뒤)
  }
  // 식판·수저 수레 2(배식대 남끝 — 영상 k_05~k_08 스테인리스 수레) · 조리실 문 앞은 비운다
  [[SZ[1] + 0.55, 0xd8dde0], [SZ[1] + 1.35, 0x5b8fc9]].forEach(([z9, top9], i) => {
    const cx9 = XF + 0.35;
    colliders.push(noStand({ x0: cx9 - 0.3, x1: cx9 + 0.3, y0: 0, y1: 0.85, z0: z9 - 0.35, z1: z9 + 0.35 }));
    dBox(0.6, 0.04, 0.7, 0xdfe3e6, cx9, 0.8, z9); dBox(0.56, 0.03, 0.66, 0xc9ced3, cx9, 0.2, z9);
    [[-0.26, -0.31], [0.26, -0.31], [-0.26, 0.31], [0.26, 0.31]].forEach(([ox, oz]) => dBox(0.03, 0.8, 0.03, METAL, cx9 + ox, 0, z9 + oz));
    if (i === 0) dBox(0.42, 0.3, 0.54, top9, cx9, 0.84, z9);                                 // 식판 더미
    else [-0.14, 0.14].forEach(oz => dBox(0.32, 0.14, 0.2, top9, cx9, 0.84, z9 + oz));       // 수저 통
  });
  sign('식판 · 수저', XF + 0.04, 1.95, SZ[1] + 0.95, Math.PI / 2, 0.18);
  // 조리실 문 옆 초록 게시판(영상 k_06 왼쪽) · 입구 쪽 남벽 나무 징두리(k_15)
  greenBoard('z', K.kitchenDoorZ + 0.95, kz1 - 0.6, XF, 1, 1.1, 2.2, 'notice');
  [[XF, K.exitC - 0.6], [K.exitC + 0.6, K.doorC - 0.9], [K.doorC + 0.9, kx1 - 0.15]].forEach(([a9, b9]) => { if (b9 - a9 > 0.3) patWall('woodW', 'x', a9, b9, 0.02, 1.0, kz1 - 0.15 - 0.012, -1); });
  // 식판 반납대(남서 모서리 — 출구 옆): 스테인리스 대 + 잔반통 2 + 반납 식판 더미
  { const rx0 = XF, rx1 = K.exitC - 0.75, rz = kz1 - 0.15;
    addBox(rx1 - rx0, 0.85, 0.65, 0xc9ced3, (rx0 + rx1) / 2, 0, rz - 0.325, NS);
    dBox(rx1 - rx0 + 0.05, 0.04, 0.7, 0xdfe3e6, (rx0 + rx1) / 2 + 0.025, 0.85, rz - 0.35);
    dCyl(0.2, 0.18, 0.3, 0x5a8fc0, rx0 + 0.4, 0.89, rz - 0.35, { seg: 10 }); dCyl(0.2, 0.18, 0.3, 0x7aa35a, rx0 + 0.9, 0.89, rz - 0.35, { seg: 10 });
    dBox(0.42, 0.24, 0.54, 0xd8dde0, rx1 - 0.35, 0.89, rz - 0.35);
    sign('식판 반납', (rx0 + rx1) / 2, 1.75, rz - 0.02, Math.PI, 0.2);
    hotspots.push({ kind: 'trayback', x: (rx0 + rx1) / 2, z: rz - 1.2, y: 0, r: 1.4, label: '식판 반납하기' }); }
  // 식단표(남벽 출구와 입구 사이) · 시계(입구 위) · 쓰레기통·파란 양동이(영상 k_00)
  greenBoard('x', K.exitC + 0.95, K.doorC - 1.25, kz1 - 0.15, -1, 1.2, 2.2, 'notice');
  sign('이번 주 식단', (K.exitC + K.doorC) / 2 - 0.15, 2.42, kz1 - 0.19, Math.PI, 0.18);
  dCyl(0.2, 0.2, 0.04, 0xf5f3ec, K.doorC, 3.1, kz1 - 0.17, { rot: [Math.PI / 2, 0, 0], seg: 16 }); dCyl(0.02, 0.02, 0.05, 0x2a2a2a, K.doorC, 3.1, kz1 - 0.2, { rot: [Math.PI / 2, 0, 0], seg: 6 });
  [[K.exitC + 0.95, 0.25, 0.7, 0x2a2c30], [K.exitC + 1.5, 0.2, 0.36, 0x3f7fd6]].forEach(([x9, r9, h9, c9]) => {   // 출구 옆(영상 k_00 오른쪽 아래)
    dCyl(r9, r9 * 0.88, h9, c9, x9, 0, kz1 - 0.45, { seg: 12 });   // [integ 09-25] 이 줄이 위 주석 끝에 붙어 그려지지 않았다(충돌만 남아 보이지 않는 벽 · 청소선생님이 그 자리에 섰다)
    allBoxes.push({ x0: x9 - r9 * 0.7, x1: x9 + r9 * 0.7, y0: 0.01, y1: h9 - 0.01, z0: kz1 - 0.45 - r9 * 0.7, z1: kz1 - 0.45 + r9 * 0.7, detail: true });   // 사람 자리 찾기(freeSpot)가 통을 비키게
    colliders.push(noStand({ x0: x9 - r9, x1: x9 + r9, y0: 0, y1: h9, z0: kz1 - 0.45 - r9, z1: kz1 - 0.45 + r9 })); });
  // 손 씻는 곳(동벽 남끝 — 로비 벽 안쪽): 긴 스테인리스 개수대 + 수도꼭지 3 + 거울 · 정수기(남벽)
  { const wx = kx1 - 0.15, w0 = kz1 - 0.15 - 1.8, w1 = kz1 - 0.15 - 0.05;
    addBox(0.55, 0.8, w1 - w0, 0xdfe3e6, wx - 0.275, 0, (w0 + w1) / 2, NS);
    dBox(0.4, 0.03, w1 - w0 - 0.15, 0x9fb3c0, wx - 0.3, 0.8, (w0 + w1) / 2);
    [0.25, 0.5, 0.75].forEach(t => { const z9 = w0 + (w1 - w0) * t; dRod(wx - 0.07, 0.8, z9, wx - 0.07, 1.04, z9, 0.02, 0xcfd4d8); dRod(wx - 0.07, 1.04, z9, wx - 0.2, 1.04, z9, 0.015, 0xcfd4d8); });
    dBox(0.03, 0.55, w1 - w0 - 0.1, 0xcfdde6, wx - 0.015, 1.2, (w0 + w1) / 2);
    sign('손 씻는 곳', wx - 0.03, 1.98, (w0 + w1) / 2, -Math.PI / 2, 0.2);
    hotspots.push({ kind: 'wash', x: wx - 1.0, z: (w0 + w1) / 2, y: 0, r: 1.2, label: '손 씻기' }); }
  addBox(0.45, 1.3, 0.42, 0xe8eef2, K.doorC + 1.55, 0, kz1 - 0.36, NS);                   // 정수기(입구 옆)
  hotspots.push({ kind: 'water', x: K.doorC + 1.55, z: kz1 - 1.1, y: 0, r: 1.0, label: '물 마시기' });
  // ---- 식탁(영상 IMG_2178 k_09·k_15: 배식벽·창벽과 나란히 = 남북 · 나무결 상판·흰 쇠틀·빨간 둥근 의자 한쪽 5개) — 3열 × 3줄 ----
  const table9 = (tx, tz) => {
    const TL = 3.4, WF = 0xecebe6;
    colliders.push(noStand({ x0: tx - 0.4, x1: tx + 0.4, y0: 0, y1: 0.72, z0: tz - TL / 2, z1: tz + TL / 2 }));
    [-1, 1].forEach(sd => colliders.push(noStand({ x0: tx + sd * 0.62 - 0.17, x1: tx + sd * 0.62 + 0.17, y0: 0, y1: 0.42, z0: tz - TL / 2, z1: tz + TL / 2 })));
    dBox(0.8, 0.05, TL, 0xa8683a, tx, 0.67, tz);
    [-TL / 2 + 0.1, TL / 2 - 0.1].forEach(oz => { [-0.3, 0.3].forEach(ox => dBox(0.05, 0.67, 0.05, WF, tx + ox, 0, tz + oz)); dBox(0.55, 0.04, 0.036, WF, tx, 0.2, tz + oz); });
    dBox(0.05, 0.04, TL - 0.3, WF, tx, 0.2, tz);
    [-1, 1].forEach(sd => [-1.36, -0.68, 0, 0.68, 1.36].forEach(oz => {
      dCyl(0.16, 0.16, 0.05, 0x9b2c3a, tx + sd * 0.62, 0.4, tz + oz, { seg: 10 });
      dRod(tx + sd * 0.3, 0.2, tz + oz, tx + sd * 0.62, 0.4, tz + oz, 0.022, WF);
    }));
  };
  [XF + 2.75, XF + 5.15, XF + 7.55].forEach(tx => [-45.9, -41.5, -37.1].forEach(tz => table9(tx, tz)));
  // ---- 북벽 큰 회색 커튼(영상 k_00·k_11~13) — 가운데 악기 통로 입구 자리는 양옆으로 걷었다 ----
  { const cz = AZ + 0.15 + 0.05, c0 = HX + 1.6 + 0.95, o0 = PX + 0.15, o1 = PX + 1.15;
    [[c0, o0 - 0.3], [o1 + 0.3, kx1 - 0.15]].forEach(([a9, b9]) => patWall('curtain', 'x', a9, b9, 0.05, 3.95, cz, 1));
    [o0 - 0.15, o1 + 0.15].forEach(x9 => dBox(0.3, 3.9, 0.2, 0x8c8783, x9, 0.05, cz + 0.05));  // 걷어 모은 커튼 뭉치
    dBox(kx1 - 0.15 - c0 + 0.1, 0.4, 0.14, 0x7d7874, (c0 + kx1 - 0.15) / 2, 3.95, cz + 0.02);   // 커튼 박스(위 가림판)
    addBox(0.5, 1.8, 0.4, 0xf2f3f4, kx1 - 0.55, 0, AZ + 0.55, NS);                           // 스탠드 에어컨(커튼·창 모서리 — 영상 k_00)
    dRod(c0, KH - 0.4, AZ + 1.3, kx1 - 0.5, KH - 0.4, AZ + 1.3, 0.025, 0xf2f3f4);             // 커튼 앞 천장 레일 조명(영상 k_12)
    for (let x9 = c0 + 0.6; x9 < kx1 - 0.6; x9 += 1.3) { dRod(x9, KH - 0.4, AZ + 1.3, x9, KH - 0.55, AZ + 1.22, 0.012, 0x3a3d44); dCyl(0.045, 0.06, 0.12, 0x2a2c30, x9, KH - 0.66, AZ + 1.2, { seg: 8, rot: [0.5, 0, 0] }); }
  }
  // ---- 악기 보관 통로(세로복도 짙은 문 → 서쪽으로 → 커튼 뒤로 홀): 한 사람 폭·좌우 악기 칸(사용자 09-24) ----
  instrumentShelf('x', PX + 1.3, kx1 - 0.2, K.cornerDoorZ - 0.75, 1);
  instrumentShelf('x', PX + 1.3, kx1 - 0.2, AZ - 0.15, -1);
  zones.push({ x0: PX, x1: kx1, z0: K.cornerDoorZ - 0.9, z1: AZ, y: 0, label: '악기 보관 통로' });
  hotspots.push({ kind: 'drum', x: PX + 2.4, z: (K.cornerDoorZ - 0.9 + AZ) / 2, y: 0, r: 1.2, label: '악기 두드리기' });
  // ---- 창고(홀 북서 — 회색 유리 양문 · 조리실 문): 선반·쌓은 의자·상자 ----
  [HX + 1.2, HX + 3.2, HX + 5.2].forEach(x9 => addBox(1.8, 1.9, 0.5, 0x9aa0a6, x9, 0, kz0 + 0.45));
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) dCyl(0.16, 0.16, 0.05, 0x9b2c3a, HX + 3.2 + k * 0.42, 0.05 + j * 0.06, AZ - 1.2, { seg: 10 });
  colliders.push(noStand({ x0: HX + 3.05, x1: HX + 4.2, y0: 0, y1: 0.28, z0: AZ - 1.35, z1: AZ - 1.05 }));   // [quality4 09-26] 쌓은 의자 셋(충돌이 없어 발이 묻혔다 — 발 묻힘 4칸)
  addBox(1.0, 0.6, 0.7, 0xc9a877, HX + 5.0, 0, AZ - 1.1, NS);
  // ---- 조리실(서): 국솥 2·가스 레인지·밥 찜기·작업대 2·개수대(3칸)·식기세척기·냉장고 2 · 배식창 뒤 급식 수레 ----
  [[kx0 + 0.9, kz0 + 1.1], [kx0 + 2.05, kz0 + 1.1]].forEach(([x9, z9]) => { dCyl(0.55, 0.5, 0.85, 0xb9bec2, x9, 0, z9, { seg: 14 }); dCyl(0.5, 0.5, 0.05, 0x8a9096, x9, 0.85, z9, { seg: 14 });
    colliders.push(noStand({ x0: x9 - 0.55, x1: x9 + 0.55, y0: 0, y1: 0.9, z0: z9 - 0.55, z1: z9 + 0.55 })); });
  addBox(1.6, 0.85, 0.8, 0xc4c9cd, K.backDoorC + 1.45, 0, kz0 + 0.55, NS); dBox(1.5, 0.03, 0.7, 0x2a2c30, K.backDoorC + 1.45, 0.85, kz0 + 0.55);   // 가스 레인지(검은 상판 — 뒷문 동쪽)
  addBox(0.8, 1.8, 1.1, 0xd3d7da, kx0 + 0.55, 0, kz0 + 3.3, NS);                           // 밥 찜기(문 3단 — 서벽. 급식동 서벽을 -7.8로 옮겨 조리실이 1.2m 좁아짐)
  [0.45, 1.05, 1.62].forEach(y9 => dBox(0.03, 0.03, 0.9, 0x8a9096, kx0 + 0.965, y9, kz0 + 3.3));
  [[kx0 + 4.0, kz0 + 4.6], [kx0 + 4.0, kz0 + 7.4]].forEach(([x9, z9]) => addBox(2.4, 0.85, 0.8, 0xc4c9cd, x9, 0, z9, NS));   // 작업대
  addBox(0.75, 0.85, 3.0, 0xc9ced3, kx0 + 0.525, 0, kz0 + 6.0, NS);                         // 개수대 3칸(서벽)
  [-1, 0, 1].forEach(k => dBox(0.5, 0.03, 0.8, 0x8fa3b0, kx0 + 0.52, 0.85, kz0 + 6.0 + k * 0.95));
  addBox(1.3, 1.5, 0.8, 0xc9ced3, kx0 + 0.8, 0, kz0 + 2.3, NS); dBox(1.28, 0.7, 0.9, 0xb9bec2, kx0 + 0.8, 1.5, kz0 + 2.3);   // 식기세척기 + 후드(서벽 북쪽 — 서벽 창 자리 비킴)
  [kx0 + 1.1, kx0 + 2.5].forEach(x9 => { addBox(1.3, 2.0, 0.8, 0xdfe3e6, x9, 0, Dm.z[0] - 0.55, NS); dBox(0.03, 0.5, 0.05, 0x8a9096, x9 + 0.2, 1.0, Dm.z[0] - 0.14); });   // 냉장고 2(당직실 북벽 앞)
  [SC - 1.2, SC + 1.2].forEach(z9 => { addBox(0.7, 0.9, 1.0, 0xc4c9cd, HX - 0.6, 0, z9, NS); });   // 배식창 뒤 급식 수레
  addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 0.6, NS); addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 1.1, NS);   // 조리원 옷장(조리실 쪽 주복도 문 옆)
  addBox(kx1-kx0+0.4+K.roofWest, 0.3, kz1-kz0+0.8, 0x5e4d44, (kx0-K.roofWest+kx1+0.4)/2, KH, (kz0+kz1)/2);   // 갈색 지붕(위성 — 탁한 회갈색 · 서쪽 처마 0.7)
  { // BACKYARD-1: 급식동 겉(영상 b_016~043) — 북면 = 벽돌 기둥(폭 1.2·0.2 돌출·밝은 갓돌)과 노랑 판이 번갈아(n_036~040) · 북서 모서리 기둥 ·
    //   서면 남끝 = 벽돌 덩어리(서쪽으로 0.6 튀어나옴·노랑 밑단 — b_016·b_021) · 처마 = 짙은 슬레이트 금속 테 + 밑면(b_022·b_039) · '통제구역' 문 위 노랑 차양
    const KB = 0xa0604a, CAP = 0xcfcac0, SLT = 0x4a4e5e, PH = 3.75, x0o = kx0 - 0.15, z0o = kz0 - 0.15, RW = K.roofWest;
    const pierN = (a0, a1) => { addBox(a1 - a0, PH - YARD, 0.2, KB, (a0 + a1)/2, YARD, z0o - 0.1); patWall('brickW', 'x', a0 + 0.02, a1 - 0.02, YARD + 0.02, PH - 0.02, z0o - 0.212, -1);
      dBox(a1 - a0 + 0.1, 0.12, 0.3, CAP, (a0 + a1)/2, PH, z0o - 0.15); };
    pierN(x0o - 0.2, x0o + 1.0);                                                                   // 북서 모서리(북쪽 날개)
    addBox(0.2, PH - YARD, 1.2, KB, x0o - 0.1, YARD, z0o + 0.6);                                    // 북서 모서리(서쪽 날개)
    patWall('brickW', 'z', z0o - 0.18, z0o + 1.18, YARD + 0.02, PH - 0.02, x0o - 0.212, -1);
    dBox(0.3, 0.12, 1.25, CAP, x0o - 0.15, PH, z0o + 0.625);
    const PS = (kx1 + 0.15 - 0.6 - (x0o + 0.4)) / 4;                                               // 기둥 5개(모서리 포함) — 사이 노랑 판 ≈3m
    for (let k = 1; k <= 4; k++) { const c9 = x0o + 0.4 + PS * k; pierN(c9 - 0.6, c9 + 0.6); }
    // 서면 남끝 벽돌 덩어리(당직실 바깥)
    addBox(0.61, 0.35, 1.96, 0xc3a150, x0o - 0.305, YARD, kz1 - 0.15 - 0.98);
    addBox(0.6, 4.2 - YARD - 0.35, 1.95, KB, x0o - 0.3, YARD + 0.35, kz1 - 0.15 - 0.975);
    patWall('brickW', 'z', kz1 - 2.1 + 0.02, kz1 - 0.17, YARD + 0.37, 4.18, x0o - 0.612, -1);
    patWall('brickW', 'x', x0o - 0.58, x0o - 0.02, YARD + 0.37, 4.18, kz1 - 2.112, -1);
    dBox(0.7, 0.1, 2.0, CAP, x0o - 0.35, 4.2, kz1 - 0.15 - 1.0);
    // 처마: 밑면(슬레이트) + 테(지붕판 가장자리 — 지붕 윗면보다 5cm 높은 턱)
    dBox(kx1 + 0.4 - (kx0 - RW), 0.03, 0.25, 0x3d4150, (kx1 + 0.4 + kx0 - RW)/2, KH - 0.03, kz0 - 0.275);
    dBox(RW - 0.15, 0.03, kz1 - kz0 + 0.55, 0x3d4150, kx0 - (RW + 0.15)/2, KH - 0.03, (kz0 - 0.15 + kz1 + 0.4)/2);
    dBox(kx1 + 0.4 - (kx0 - RW - 0.06), 0.45, 0.06, SLT, (kx1 + 0.4 + kx0 - RW - 0.06)/2, KH - 0.1, kz0 - 0.43);
    dBox(0.06, 0.45, kz1 - kz0 + 0.8, SLT, kx0 - RW - 0.03, KH - 0.1, (kz0 + kz1)/2);
    dBox(0.3, 0.1, 1.4, 0xd2aa55, x0o - 0.15, 2.35, -39.55);                                       // '통제구역' 문 위 노랑 차양(b_021)
    exitSign(kx0 + 0.15, -39.55, 2.74, [1, 0]);
  }
  hangSign('급식실', K.doorC, 2.78, fz0, 1); sign('출구', K.exitC, 2.35, fz0 + 0.22, 0, 0.26); sign('조리실', K.staffDoorC, 2.35, fz0 + 0.22, 0, 0.26);
  // 급식동 남벽 윗부분(복도 벽은 FH까지): 식당 쪽 절반은 FH부터, 바깥(본관 지붕 위) 절반은 지붕 윗면(FH+0.3)부터 — 지붕 슬래브와 겹침 금지
  addBox(kx1 - kx0 + 0.3, KH - FH, 0.15, 0xbcc8ca, (kx0 + kx1)/2, FH, fz0 - 0.075);
  addBox(kx1 - kx0 + 0.3, KH - FH - 0.3, 0.15, WALL, (kx0 + kx1)/2, FH + 0.3, fz0 + 0.075);
  {                                                        // 당직실(급식동 남서 모서리)
    const D = K.dutyRoom;
    addBox(0.3, KH, D.z[1] - D.z[0] - 0.3, INNER, D.x[1], 0, (D.z[0] + D.z[1]) / 2);
    addBox(D.x[1] + 0.15 - (D.x[0] + 0.15), KH, 0.3, INNER, (D.x[0] + D.x[1]) / 2 + 0.15, 0, D.z[0]);
    officeDesk(D.x[0] + 0.85, 0, D.z[0] + 1.5);   // 서벽 작은 창 밑(급식동 서벽을 -7.8로 옮김)
    sign('당직실', D.doorC + 1.2, 2.35, fz0 + 0.22, 0, 0.32);
    zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], y: 0, label: '당직실' });
  }
  zones.push({ x0: HX, x1: kx1, z0: AZ, z1: kz1, y: 0, label: '급식실' });
  zones.push({ x0: kx0, x1: HX, z0: kz0, z1: Dm.z[0], y: 0, label: '조리실' });
  zones.push({ x0: HX, x1: PX, z0: kz0, z1: AZ, y: 0, label: '급식 창고' });
  ceil(HX, kx1, AZ, kz1, KH, 'ctile');
  ceil(kx0, HX, kz0, kz1, KH, 'cflat');
  ceil(HX, kx1, kz0, AZ, KH, 'cflat');
  for (let x9 = HX + 1.8; x9 < kx1 - 0.8; x9 += 3.0) for (let z9 = AZ + 2.0; z9 < kz1 - 0.8; z9 += 2.9) lamp(1.2, 0.05, 0.22, x9, KH - 0.21, z9);   // 홀 형광등 줄(영상 k_00)
  // 천장 에어컨(네모) — 형광등 줄 사이(등과 겹치면 아랫면이 같은 높이라 깜빡인다)
  [[HX + 3.3, AZ + 3.45], [HX + 9.3, AZ + 3.45], [HX + 6.3, AZ + 9.25]].forEach(([x9, z9]) => { dBox(0.9, 0.05, 0.9, 0xf2f3f4, x9, KH - 0.16 - 0.05, z9); dBox(0.5, 0.03, 0.5, 0xb8bec4, x9, KH - 0.16 - 0.08, z9); });   // 천장 에어컨(네모)
  for (let x9 = kx0 + 1.8; x9 < HX - 0.8; x9 += 3.2) for (let z9 = kz0 + 2.2; z9 < Dm.z[0] - 0.8; z9 += 3.6) lamp(1.2, 0.05, 0.22, x9, KH - 0.21, z9);

  // ================= 가운데 로비 · 세로복도 · 가운데 마당 (영상 c_344~364 · 위성 흰 지붕 x 50~57.5) =================
  {
    const [lx0, lx1] = CL.x, [lz0, lz1] = CL.z, [cx0, cx1] = LC.x, [cz0] = LC.z, E = B.eastWing, NOTCH_Z = E.z[1];   // NOTCH_Z = 동관 남벽(-39.5)
    // 기초(맞댐): 세로복도 · 동쪽 노치 쪽 띠 · 로비 · 로비 북쪽(노치) 띠
    foundation(cx0, cx1, cz0 - 0.15, lz0);
    foundation(cx1, cx1 + 0.15, NOTCH_Z + 0.15, lz0);
    foundation(lx0, lx1 + 0.15, lz0, lz1);
    foundation(cx1 + 0.15, lx1 + 0.15, lz0 - 0.15, lz0);
    // 로비(hall_lobby-0 · 영상 e_343·e_344·L_346·L_348·c_350.8): 현관 축에 가운데로 얕게(x 10~15 · z -36.7~-34). 트임 양쪽 = 네모 기둥 둘,
    //   북쪽 = 책상 뒤 통유리(롤블라인드 · 밖 노란 꽃), 동쪽 = 통유리 벽(북쪽 끝 좁은 고정 유리 → 자동 유리문 → 고정 유리), 서쪽 = 벽돌 벽 + 노퍽소나무 화분 셋 · AED
    // 동벽(hall_lobby-3 · 영상 L_348): 문은 고정 유리 앞(바깥 12cm)으로 남쪽으로 미끄러진다(slideOver) — 다 열리면 문짝 끝이 복도 북벽 속(-34.05)에서 멈춤
    const LDW = 1.05, LD1 = lz1 - 0.9, LDC = LD1 - LDW / 2, LD0 = LD1 - LDW;       // 영상 L_348: 북쪽 좁은 고정 유리 0.6 → 문 1.05(책상 동끝 바로 옆) → 남쪽 고정 유리 0.75 → 기둥(열린 문짝 끝이 기둥 속 5cm에서 멈춤)
    const rbx = (w, h, d, hex, cx, y0, cz, ry) => dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(cx, y0 + h / 2, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(w, h, d)), hex);   // 돌린 상자(감사 밖)
    wallZ(lz0, lz1, lx1, WALL, { face: 1, gaps: [{ c: (lz0 + 0.15 + LD0) / 2, w: LD0 - lz0 - 0.15, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3 },
      { c: LDC, w: LDW, glass: true, door: true, slideOver: true, dh: 2.5 },
      { c: (LD1 + lz1 - 0.15) / 2, w: lz1 - 0.15 - LD1, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3 }] });
    wallX(cx1 - 0.15, lx1 + 0.15, lz0, WALL, { face: -1, gaps: [{ c: (cx1 + lx1) / 2, w: lx1 - cx1 - 0.3, sill: 0.15, dh: 2.9, win: true, frame: 0xc9ced3, noLedge: true }] });   // 북쪽 통유리(hall_lobby-4: 창턱 낮게·가는 스테인리스 틀)
    // 윗부분 베이지 롤블라인드(2.03~2.88 — 영상 e_343·L_346): 북쪽 두 폭 · 동쪽 고정 유리 둘
    [-1, 1].forEach(sd => dBox((lx1 - cx1 - 0.3) / 2 - 0.09, 0.85, 0.04, 0xe6ddcf, (cx1 + lx1) / 2 + sd * ((lx1 - cx1 - 0.3) / 4 + 0.015), 2.03, lz0 + 0.125));
    [[lz0 + 0.15, LD0], [LD1, lz1 - 0.15]].forEach(([a, b]) => dBox(0.04, 0.85, b - a - 0.12, 0xe6ddcf, lx1 - 0.125, 2.03, (a + b) / 2));
    dBox(0.12, 0.1, 0.4, 0x222222, lx1 - 0.21, 2.52, LDC);                         // 자동문 센서(문 위 안쪽)
    { const X0 = lx0 + 0.15, X1 = lx1 - 0.15, Z0 = lz0 + 0.15, Z1 = lz1 + 0.15, q = 1 / (Math.SQRT2 * PATDEF.tileG[0]), uv = (x, z) => [(x + z) * q, (x - z) * q];   // hall_lobby-11: 테라초 40cm를 45° 돌려 깜(영상 c_350.8·e_343·L_346) = tileG 좌표만 45° 돌림(새 무늬 없음)
      patPush('tileG', [[X0, 0.012, Z0], [X1, 0.012, Z0], [X1, 0.012, Z1], [X0, 0.012, Z1]], [uv(X0, Z0), uv(X1, Z0), uv(X1, Z1), uv(X0, Z1)], [0, 1, 0], 0xffffff); }   // 남쪽 = 주복도 검은 띠와 맞댐 · 가운데 갈색 매트 없음(hall_lobby-12)
    patQuad('tactX', lx1 - 0.55, lx1 - 0.2, LDC - LDW / 2 + 0.05, LD1 - 0.05, 0.02);  // 자동문 안쪽 점자블록(영상 L_346·L_348)
    patQuad('tactX', hc - 0.3, hc + 0.3, lz1 - 0.02, lz1 + 0.28, 0.02);              // 트임 문턱 가운데 점자(영상 e_343)
    // hall_lobby-1(영상 e_341·e_343·e_344·L_348): 로비 트임 양쪽 네모 기둥 — 아래 1.15 = 짙은 나무 판(세로 홈), 위 = 베이지 석재판, 모서리 짙은 나무 띠, 트임 쪽 면 1.4m에 빨강 비상벨
    //   기둥 = 로비 벽 줄에 걸쳐 복도 쪽으로 0.3 튀어나옴(트임 안쪽 면 x 10.5 / 14.5 — 현관 축 대칭). 꼭대기·밑면은 벽과 같은 면이 되지 않게 띄움(감사)
    [[hc - 2.3, 1, 0.6], [hc + 2.36, -1, 0.72]].forEach(([px, inr, PW]) => {       // 안쪽 면 x 10.5 / 14.5 · 동 기둥은 동벽 바깥(15.22 · 나무 판 15.23 — 창턱 15.25와 어긋남)까지 — 열린 자동문 끝(x 15.04~15.2)이 통째로 숨는 자리
      const PD = 0.6, pz = lz1, yT = FH - 0.2;
      addBox(PW, FH - 0.02, PD, 0xd2c8b5, px, 0.005, pz);
      dBox(PW + 0.02, 1.15, PD + 0.02, DKWOOD, px, 0.012, pz);                      // 아랫단 짙은 나무 판
      [-0.12, 0.12].forEach(o => dBox(0.03, 1.0, 0.03, 0x2f241e, px + o, 0.08, pz + PD / 2 + 0.025));   // 세로 홈(복도 쪽)
      const lv0 = Math.max(px - PW / 2, lx0 + 0.15), lv1 = Math.min(px + PW / 2, lx1 - 0.15);
      patWall('tileW', 'x', px - PW / 2, px + PW / 2, 1.16, yT, pz + PD / 2 + 0.012, 1, 0xe2d7c2);      // 복도 쪽 면
      patWall('tileW', 'x', lv0, lv1, 1.16, yT, pz - PD / 2 - 0.012, -1, 0xe2d7c2);                    // 로비 쪽 면(보이는 곳만)
      patWall('tileW', 'z', pz - PD / 2, pz + PD / 2, 1.16, yT, px + inr * (PW / 2 + 0.012), inr, 0xe2d7c2);   // 트임 쪽 면
      patWall('tileW', 'z', pz + 0.15, pz + PD / 2, 1.16, yT, px - inr * (PW / 2 + 0.012), -inr, 0xe2d7c2);   // 복도로 튀어나온 바깥 옆면
      [[px + inr * PW / 2, pz + PD / 2], [px + inr * PW / 2, pz - PD / 2], [px - inr * PW / 2, pz + PD / 2]].forEach(([cx9, cz9]) => dBox(0.05, yT - 1.16, 0.05, DKWOOD, cx9, 1.16, cz9));   // 모서리 나무 띠
      dBox(0.04, 0.18, 0.14, 0xc8342c, px + inr * (PW / 2 + 0.03), 1.4, pz + 0.05);            // 비상벨
      dBox(0.03, 0.06, 0.06, 0xf4f4f0, px + inr * (PW / 2 + 0.065), 1.46, pz + 0.05);
    });
    // 배움터지킴이 책상(hall_lobby-2·8 · 영상 L_346·L_348·e_343): 북쪽 유리 앞(뒤 0.4 = 의자·선풍기), 서끝 = 괘종시계 옆 · 동끝과 유리 벽 사이 0.4(점자 자리)
    //   앞면 = 흰 걸레받이 + 큰 판 두 칸 + 위 띠, 위 = 옅은 나무 턱(앞으로 5cm) + 유리 칸막이
    const DW = 1.9, DD = 0.6, dkx = cx1 + 0.05 + DW / 2, dkz = lz0 + 0.5 + DD / 2, FZ = dkz + DD / 2 + 0.015;
    addBox(DW, 1.0, DD, 0xe8e6de, dkx, 0, dkz, NS);
    colliders[colliders.length - 1].z1 -= 0.12;   // [quality4 09-26] 책상 막이 앞면만 12cm 안으로(모습 그대로): 자동문 가운데 선(z −35.425)이 책상 앞 17cm라 몸(0.26)이 책상 동끝에 걸려 못 들어왔다(문 직진)
    dBox(DW - 0.02, 0.1, 0.03, 0xf2f2f0, dkx, 0.005, FZ);
    [-1, 1].forEach(sd => dBox(DW / 2 - 0.03, 0.66, 0.03, 0xbdb7aa, dkx + sd * DW / 4, 0.11, FZ));
    dBox(DW - 0.02, 0.2, 0.03, 0xdcdcd8, dkx, 0.78, FZ);
    dBox(0.03, 0.66, DD - 0.06, 0xbdb7aa, dkx - DW / 2 - 0.015, 0.11, dkz);          // 서쪽 옆판
    dBox(DW + 0.04, 0.03, DD + 0.08, 0xd8c29a, dkx, 1.0, dkz + 0.03);                // 옅은 나무 상판 턱
    glassPane('x', DW - 0.1, 0.35, dkx, 1.03, dkz - 0.05);                           // 유리 칸막이 + 스테인리스 윗테
    dBox(DW - 0.1, 0.03, 0.04, 0xc9ced3, dkx, 1.38, dkz - 0.05);
    // hall_lobby-7(영상 L_346·L_347 확대): 떠 있던 파란 팻말 대신 상판 서쪽 끝 작은 명패 '학교안전지킴이'
    dBox(0.34, 0.09, 0.03, 0xeef2ee, dkx - DW / 2 + 0.3, 1.03, dkz + 0.2);
    sign('학교안전지킴이', dkx - DW / 2 + 0.3, 1.075, dkz + 0.228, 0, 0.055, { bg: '#f4f6f2', fg: '#2f5f45' });
    chair(dkx - 0.25, 0, dkz - DD / 2 - 0.18, -1, 0xc89a5e);                          // 나무 등받이 의자
    { const fx = dkx + 0.6, fz = dkz - DD / 2 - 0.17;                                // 스탠드 선풍기(책상 뒤 바닥 · 머리 1.3)
      dCyl(0.16, 0.18, 0.04, 0xe8e8e4, fx, 0, fz, { seg: 8 }); dCyl(0.015, 0.015, 1.18, 0xdcdcdc, fx, 0.04, fz, { seg: 4 });
      dCyl(0.2, 0.2, 0.05, 0xeef2f5, fx, 1.3, fz - 0.02, { rot: [Math.PI / 2, 0, 0], seg: 12 });
      post(fx, fz, 0, 1.5, 0.12); }
    hotspots.push({ kind: 'visit', x: dkx, z: dkz + 1.0, y: 0, r: 1.1, label: '방문록에 이름 쓰기' });
    // 괘종시계(hall_lobby-2·9 · 영상 L_346·c_350.8·c_349.2): 책상 서끝 옆·북쪽 유리 서끝 기둥 앞, 남동쪽으로 돌림 · 백조목 머리 장식 + 유리 몸통(금색 관 3·추) + 흰 둥근 문자판
    { const ckx = cx1 - 0.35, ckz = lz0 + 0.45, cr = 0.6, cs = Math.sin(cr), cc = Math.cos(cr), CK = 0x2a1c18;
      const cp = (lx, lz) => [ckx + lx * cc + lz * cs, ckz - lx * cs + lz * cc];
      const cb = (w, h, d, hex, lx, y0, lz) => { const [x9, z9] = cp(lx, lz); rbx(w, h, d, hex, x9, y0, z9, cr); };
      const cy = (r, h, hex, lx, y0, lz, face, seg = 12) => { const g = new THREE.CylinderGeometry(r, r, h, seg, 1); g.translate(0, h / 2, 0); if (face) g.rotateX(Math.PI / 2);
        g.rotateY(cr); const [x9, z9] = cp(lx, lz); g.translate(x9, y0, z9); dGeo(g, new THREE.Matrix4(), hex, { at: [ckx, ckz] }); g.dispose(); };
      cb(0.56, 0.3, 0.4, CK, 0, 0, 0); cb(0.5, 0.2, 0.36, CK, 0, 0.3, 0);             // 받침 2단
      cb(0.42, 1.0, 0.3, CK, 0, 0.5, 0); cb(0.32, 0.82, 0.02, 0x4a3a34, 0, 0.59, 0.15);   // 몸통 + 앞 유리(어두운 속)
      [-0.07, 0, 0.07].forEach(o => cy(0.02, 0.5, 0xd8b35a, o, 0.9, 0.1, false, 4));  // 금색 관 셋
      cy(0.08, 0.02, 0xd8b35a, 0, 0.72, 0.13, true); cy(0.012, 0.3, 0xd8b35a, 0, 0.8, 0.12, false, 5);   // 추
      cb(0.5, 0.55, 0.34, CK, 0, 1.5, 0);                                              // 머리
      cy(0.14, 0.02, 0xf4efe0, 0, 1.77, 0.17, true, 16); cb(0.02, 0.1, 0.01, 0x222222, 0, 1.77, 0.19);   // 흰 둥근 문자판 + 바늘
      cb(0.56, 0.06, 0.38, CK, 0, 2.05, 0);
      [-1, 1].forEach(sd => { const [x9, z9] = cp(sd * 0.14, 0.05); dBlob(0.09, 0.12, 0.06, CK, x9, 2.19, z9, { chunky: true, ry: cr + sd }); });   // 백조목 뿔 둘
      { const [x9, z9] = cp(0, 0.05); dBlob(0.035, 0.08, 0.035, 0xd8b35a, x9, 2.23, z9, { chunky: true }); }                 // 가운데 꼭지
      colliders.push(noStand({ x0: ckx - 0.33, x1: ckx + 0.33, y0: 0, y1: 2.1, z0: ckz - 0.33, z1: ckz + 0.33 }));
      hotspots.push({ kind: 'clock', x: ckx - 0.15, z: ckz + 0.8, y: 0, r: 0.9, label: '괘종시계 보기' }); }
    // hall_lobby-6(영상 c_350.8·c_351.5·c_352.2): 벽돌 벽 앞 노퍽소나무 화분 셋(한 줄 · 흰 화분 + 바퀴 받침 · 층층 가지) + AED 흰 스탠드 + 작은 화분
    [lz1 - 0.75, lz1 - 1.4, lz1 - 2.05].forEach((z9, k) => { const x9 = lx0 + 0.55;
      dBox(0.46, 0.05, 0.46, 0xe6e6e6, x9, 0.005, z9); dCyl(0.24, 0.19, 0.4, 0xe9e6de, x9, 0.055, z9, { seg: 8 });
      dCyl(0.025, 0.035, 1.55, 0x6d4e32, x9, 0.45, z9, { seg: 6 });
      for (let j = 0; j < 5; j++) { const r9 = 0.46 - j * 0.07; [0, 1].forEach(q => dBlob(r9, 0.07 - j * 0.006, r9 * 0.42, j % 2 ? 0x3a6238 : 0x2e5230, x9 + (q ? 0.03 : -0.03), 0.88 + j * 0.24, z9, { chunky: true, ry: j * 0.9 + k + q * Math.PI / 2, jitter: 0.3 })); }   // 층마다 가지 넷(납작한 긴 덩어리 둘을 엇갈려 — 원판·선반처럼 보이지 않게 · 영상 c_350.8 층층 가지)
      colliders.push(noStand({ x0: x9 - 0.28, x1: x9 + 0.28, y0: 0, y1: 0.45, z0: z9 - 0.28, z1: z9 + 0.28 })); });
    dBox(0.25, 1.2, 0.35, 0xf4f4f0, lx0 + 0.285, 0.005, lz0 + 0.2); dBox(0.03, 0.12, 0.12, 0xd23a3a, lx0 + 0.425, 0.95, lz0 + 0.2);   // AED 스탠드
    colliders.push(noStand({ x0: lx0 + 0.15, x1: lx0 + 0.42, y0: 0, y1: 1.2, z0: lz0 + 0.02, z1: lz0 + 0.38 }));
    dBox(0.2, FH - 0.02, 0.12, 0xb8bcc0, lx0 + 0.25, 0.005, lz0 - 0.1);             // 벽돌 끝 회색 쇠 기둥(영상 c_350.8)
    potPlant(lx0 + 0.4, 0, lz0 - 0.4, 1.2);
    zones.push({ x0: lx0, x1: lx1, z0: lz0, z1: lz1, y: 0, label: '가운데 로비' });
    ceil(lx0, lx1, lz0, lz1 + 0.16, FH, 'coffer');
    [-1, 1].forEach(sx => lamp(0.55, 0.04, 0.55, hc + sx * 1.3, FH - 0.2, (lz0 + lz1) / 2));
    // ---- 세로복도(x 10~13.6): 서벽 = 급식실 창 + 주황·연두 소파, 동벽 = 처음 1.5m만 마당 창(노치) 뒤는 2학년 벽, 북끝 = 나무틀 창 ----
    // LINK-EAST-20: 노치 유리 = 낮은 턱(0.15)~천장 통유리 + 놋쇠 손잡이 난간 + 로비 모서리 흰 둥근 기둥(a_451.5·c_353.8)
    wallRun('z', NOTCH_Z + 0.15, lz0 - 0.15, cx1, WALL, { face: 1, gaps: [{ c: (NOTCH_Z + lz0) / 2, w: lz0 - NOTCH_Z - 0.3, sill: 0.15, dh: 2.7, win: true, noLedge: true }] });   // 바깥 창턱 없음(바로 밖 = 노란 꽃 화단)
    dRod(cx1 - 0.2, 0.9, NOTCH_Z + 0.2, cx1 - 0.2, 0.9, lz0 - 0.2, 0.025, 0xc9a24a);
    dRod(cx1 - 0.2, 0, (NOTCH_Z + lz0) / 2, cx1 - 0.2, 0.9, (NOTCH_Z + lz0) / 2, 0.018, 0xc9a24a);   // 받침 봉(가운데 하나)
    colliders.push(noStand({ x0: cx1 - 0.24, x1: cx1 - 0.15, y0: 0, y1: 0.95, z0: NOTCH_Z + 0.15, z1: lz0 - 0.15 }));
    dCyl(0.14, 0.14, 2.75, 0xf2f2f0, cx1 - 0.22, 0, lz0 + 0.08, { seg: 8 });
    colliders.push({ x0: cx1 - 0.36, x1: cx1 - 0.08, y0: 0, y1: 2.75, z0: lz0 - 0.06, z1: lz0 + 0.22 });
    floorQ('tileG', cx0 + 0.15, cx1 - 0.15, cz0 + 0.15, lz0 + 0.15, 0, 0xc3c5cd);   // LINK-EAST-17: 바닥이 벽보다 어둡고 무채색 회색 테라초(영상 c_356·c_358·a_447 — 베이지 기운 뺌)
    // LINK-EAST-2·15: 소파 1개(칸1 창 아래 — c_353.8·c_356·a_447) · 주황·노랑·연두 세로 줄 6 + 짧은 나무 다리 · 양 끝 흰 화분
    { const z9 = LBAY[0][0], L = 2.28, st = L / 6, BK = [0xef8f45, 0xf2c25a, 0x8cc26a], SE = [0x8cc26a, 0xef8f45, 0xf2c25a];
      colliders.push({ x0: cx0 + 0.15, x1: cx0 + 0.85, y0: 0, y1: 0.45, z0: z9 - L/2, z1: z9 + L/2 });
      for (let k = 0; k < 6; k++) { const zz = z9 + L/2 - st * (k + 0.5);
        dBox(0.6, 0.32, st, SE[k % 3], cx0 + 0.45, 0.1, zz); dBox(0.18, 0.43, st, BK[k % 3], cx0 + 0.25, 0.42, zz); }
      [z9 - L/2 + 0.08, z9 + L/2 - 0.08].forEach(zz => dBox(0.05, 0.1, 0.05, 0xb58a5a, cx0 + 0.68, 0, zz));   // 앞다리 둘(뒷다리는 등받이 밑이라 안 보임 — 삼각형 예산)
      { const pz = z9 - L/2 - 0.3; dBox(0.28, 0.26, 0.28, 0xf2f2ee, cx0 + 0.45, 0, pz); dBlob(0.22, 0.2, 0.22, 0x4f8f47, cx0 + 0.45, 0.42, pz, { chunky: true, jitter: 0.22 });   // 북쪽 끝 흰 화분(남쪽 끝 화분은 로비 벽돌 끝 — hall_lobby-6)
        colliders.push(noStand({ x0: cx0 + 0.3, x1: cx0 + 0.6, y0: 0, y1: 0.3, z0: pz - 0.15, z1: pz + 0.15 })); }
      hotspots.push({ kind: 'sit', x: cx0 + 1.05, z: z9, y: 0, r: 0.9, label: '소파에 앉기', yaw: Math.PI / 2 }); }
    // LINK-EAST-32: 노치 쪽 흰 화분(바퀴 받침) · 짙은 적갈 고무 대야 · 파란 양동이(c_356·a_450)
    [[cx1 - 0.45, NOTCH_Z + 0.4], [cx1 - 0.45, lz0 - 0.45]].forEach(([x9, z9]) => { potPlant(x9, 0, z9, 1.4, true, 0xf2f2ee);
      colliders.push(noStand({ x0: x9 - 0.4, x1: cx1 - 0.24, y0: 0, y1: 1.1, z0: z9 - 0.4, z1: z9 + 0.4 })); });   // 뻗은 잎(반지름 ≈0.6)을 몸이 뚫지 않게(건강 검진 ghost)
    dCyl(0.45, 0.38, 0.35, 0x6e2a26, cx1 - 0.6, 0, NOTCH_Z - 0.55, { seg: 10 });
    colliders.push(noStand({ x0: cx1 - 1.05, x1: cx1 - 0.15, y0: 0, y1: 0.4, z0: NOTCH_Z - 1.0, z1: NOTCH_Z - 0.1 }));
    dCyl(0.14, 0.12, 0.3, 0x2f5fd0, cx1 - 0.3, 0, NOTCH_Z - 1.25, { seg: 6 });
    colliders.push(noStand({ x0: cx1 - 0.45, x1: cx1 - 0.15, y0: 0, y1: 0.3, z0: NOTCH_Z - 1.4, z1: NOTCH_Z - 1.1 }));
    // LINK-EAST-14: 'AED 찾기' 지점 — AED 흰 스탠드는 로비 벽돌 끝(hall_lobby-6 · 같은 자리 lz0 + 0.2)에 선다. 여기선 핫스폿만(겹쳐 두 개가 되지 않게)
    hotspots.push({ kind: 'aed', x: cx0 + 0.9, z: lz0 + 0.2, y: 0, r: 0.8, label: 'AED 보관함 보기' });
    // LINK-EAST-31: 기둥 P1 동면 액자 그림(c_356·a_448.5 — 글자 없음)
    dBox(0.04, 0.68, 0.52, 0x5a3e2a, cx0 + 0.42, 1.25, LPIL[0]); dBox(0.03, 0.6, 0.44, 0x86b86a, cx0 + 0.445, 1.29, LPIL[0]);
    // LINK-EAST-30: X배너 둘(영상 글자만) — 기둥 P2 앞 '사이버 폭력 예방'(c_360.5) · 북서 모서리 벽돌 옆 '폭력없는 행복한 학교'(c_362.8)
    const xBanner = (x, z, ry, title, th) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), nx = Math.sin(ry), nz = Math.cos(ry), ux = Math.cos(ry), uz = -Math.sin(ry);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x, 1.03, z), q, new THREE.Vector3(0.6, 1.75, 0.02)), 0xf2f4f8);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x + nx * 0.015, 1.72, z + nz * 0.015), q, new THREE.Vector3(0.56, 0.16, 0.012)), 0x2f5fa8);
      sign(title, x + nx * 0.025, 1.5, z + nz * 0.025, ry, th, { bg: '#ffffff', fg: '#2f4f9a' });
      dRod(x - nx * 0.04, 0.02, z - nz * 0.04, x - nx * 0.04, 1.88, z - nz * 0.04, 0.012, 0x9aa0a6);   // 뒤 받침대
      // 충돌 = 판을 따라 세 토막(비스듬한 판 하나를 통짜 AABB로 감싸면 모서리가 '보이지 않는 벽'이 된다 — 건강 검진)
      const hx = 0.1 * Math.abs(ux) + 0.05 * Math.abs(nx), hz = 0.1 * Math.abs(uz) + 0.05 * Math.abs(nz);
      [-0.2, 0, 0.2].forEach(o => { const px = x + ux * o - nx * 0.02, pz = z + uz * o - nz * 0.02;
        colliders.push(noStand({ x0: px - hx, x1: px + hx, y0: 0, y1: 1.9, z0: pz - hz, z1: pz + hz })); });
    };
    xBanner(cx0 + 0.75, LPIL[1] - 0.8, 0.52, '사이버 폭력 예방', 0.09);
    xBanner(cx0 + 1.0, cz0 + 0.55, 0.3, '폭력없는 행복한 학교', 0.07);
    zones.push({ x0: cx0, x1: cx1, z0: cz0, z1: lz0, y: 0, label: '세로복도' });
    // LINK-EAST-16·23: 천장 2.75(c_362 자 — 창턱:창:천장 = 110:150:15px) · 우물반자가 북벽까지(교차부 포함) · 로비(FH)와 만나는 z -38엔 내림벽
    ceil(cx0, cx1, cz0, lz0 + 0.16, 2.91, 'coffer');
    addBox(cx1 - cx0 - 0.3, FH - 2.75, 0.15, INNER, (cx0 + cx1)/2, 2.75, lz0 + 0.075);
    for (let k = 0; k < 4; k++) lamp(0.55, 0.04, 0.55, (cx0 + cx1)/2, 2.71, cz0 + 1.3 + (lz0 - 1.5 - cz0 - 1.3) * k / 3);
    // 지붕(흰색): 세로복도 · 로비(남단 = 본관 지붕과 맞댐 z-33.98). 동관 초록 지붕과는 x 13.6에서 맞댐
    addBox(cx1 - cx0 - 0.15, 0.3, lz0 - cz0 + 0.4, 0xe6e7e3, (cx0 + 0.15 + cx1)/2, FH, (cz0 - 0.4 + lz0)/2);
    addBox(lx1 - lx0 - 0.15 + 0.4, 0.3, lz1 + 0.02 - lz0, 0xe6e7e3, (lx0 + 0.15 + lx1 + 0.4)/2, FH, (lz0 + lz1 + 0.02)/2);
    // ---- 가운데 마당(COURT-3 · 09-24 영상 IMG_2180 q_100~133·b_108~133 대조): 폭 6.6(동관 남벽 -40.9) · 바닥 -0.15(로비 문 앞 발판 한 단) ·
    //   회색 물결 인터로킹 + 양옆 붉은 띠 · 사발 화분 향나무 줄(5.2m 간격 · 하나는 잔디만) · 동관 앞 땅 화단 + 철사 울 · 로비 문 앞 초록 매트 발판 · 청록 차양 · 수돗가 흰 상자
    const MZ0 = NOTCH_Z + 0.15, MZ1 = fz0 - 0.15, MX1 = E.x[1] + 0.15, DX0 = lx1 + 0.15;          // DX0 = 로비 동벽 바깥 면
    const KZ0 = MZ0 + 0.8, KZ1 = KZ0 + 0.15, RN = KZ1 + 1.5, RS = MZ1 - 1.75, PZ9 = -37.45;   // 동관 화단 연석 z · 띠 경계(붉은 | 회색 | 붉은 — Q_113.5·Q_124·a_478) · 화분 줄
    const YB1 = 19.4, YZ = -37.35;                                                            // 로비 문 북쪽 노란 꽃 화단(x DX0~YB1 · 남끝 z YZ) · 문 앞 발판(x DX0~YB1)
    const GRY = 0xcfc8bc, RED = 0xbf7873, CRB = 0xc9c6bd, SOIL = 0x7a6a52;
    // 싼 부재(한 화면 삼각형 예산 — 급식 창고 닻 시점이 이 16m 칸을 비스듬히 본다): 뚜껑 없는 세모·네모 봉(6·8면) · 땅에 누운 띠(2면) · 팔각 판(8면) · 사면체 꽃(4면)
    const PR3 = new THREE.CylinderGeometry(1, 1, 1, 3, 1, true).translate(0, 0.5, 0).toNonIndexed(), PR4 = new THREE.CylinderGeometry(1, 1, 1, 4, 1, true).translate(0, 0.5, 0).toNonIndexed();
    const FLAT = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).toNonIndexed(), DISC = new THREE.CircleGeometry(1, 8).rotateX(-Math.PI / 2).toNonIndexed(), TET = new THREE.TetrahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0);
    const rodL = (x0, y0, z0, x1, y1, z1, r, hex, o = {}, G = PR3) => {       // dRod와 같은 자리 기록(물리 검사) · 면만 적게
      visRods.push({ x0: Math.min(x0, x1) - r, x1: Math.max(x0, x1) + r, y0: Math.min(y0, y1) - r, y1: Math.max(y0, y1) + r, z0: Math.min(z0, z1) - r, z1: Math.max(z0, z1) + r, r, a: [x0, y0, z0], b: [x1, y1, z1] });
      _rd.set(x1 - x0, y1 - y0, z1 - z0); const L9 = _rd.length(); _rd.divideScalar(L9);
      dGeo(G, _dm.compose(_dv.set(x0, y0, z0), _dq.setFromUnitVectors(_up, _rd), _ds.set(r, L9, r)), hex, o); };
    const ribbon = (x0, z0, x1, z1, w, y, hex) => { const L9 = Math.hypot(x1 - x0, z1 - z0);
      dGeo(FLAT, _dm.compose(_dv.set((x0 + x1) / 2, y, (z0 + z1) / 2), _dq.setFromEuler(_de.set(0, Math.atan2(-(z1 - z0), x1 - x0), 0)), _ds.set(L9, 1, w)), hex); };
    const disc = (r, hex, x, y, z) => dGeo(DISC, _dm.compose(_dv.set(x, y, z), _dq.identity(), _ds.set(r, 1, r)), hex);
    const tet = (s, hex, x, y, z, ry = 0) => dGeo(TET, _dm.compose(_dv.set(x, y, z), _dq.setFromEuler(_de.set(0.6, ry, 0.3)), _ds.set(s, s * 0.8, s)), hex);
    const BLADE = new THREE.CylinderGeometry(0.004, 0.05, 1, 3, 1, true).translate(0, 0.5, 0).toNonIndexed();
    const tuft = (x, y, z, h, hex, sd = 0) => { for (let k = 0; k < 6; k++) { const a = sd + k * 1.047, ln = 0.28 + 0.14 * ((k * 7 + Math.round(sd * 10)) % 3) / 2;   // 억새·키 큰 풀 = 가는 잎 여섯이 사방으로 벌어진 포기(잎마다 6면)
      _rd.set(Math.sin(ln) * Math.cos(a), Math.cos(ln), Math.sin(ln) * Math.sin(a));
      dGeo(BLADE, _dm.compose(_dv.set(x + Math.cos(a) * 0.05, y, z + Math.sin(a) * 0.05), _dq.setFromUnitVectors(_up, _rd), _ds.set(1, h * (0.8 + 0.1 * (k % 3)), 1)), hex, { jitter: 0.2 }); } };
    addBox(lx1 + 0.15 - (cx1 + 0.15), COURT - YARD, lz0 - 0.15 - MZ0, 0xb4806a, (cx1 + 0.15 + lx1 + 0.15)/2, YARD, (MZ0 + lz0 - 0.15)/2);   // 노치(화단)
    addBox(MX1 - DX0, COURT - YARD, MZ1 - MZ0, 0xb4806a, (DX0 + MX1)/2, YARD, (MZ0 + MZ1)/2);
    patQuad('ilock', DX0, MX1, MZ0, RN, COURT + 0.012, false, RED); patQuad('ilock', DX0, MX1, RN, RS, COURT + 0.012, false, GRY); patQuad('ilock', DX0, MX1, RS, MZ1, COURT + 0.012, false, RED);
    // 동쪽 끝 완만한 비탈(마당 → 뒤뜰 벽돌 마당 YARD) — 북끝 -39.35 = 뒤뜰 포장 경계(그 북쪽은 화단 끝·한 단)
    [[-39.35, RN, RED], [RN, RS, GRY], [RS, MZ1, RED]].forEach(([a, b, t]) => slope('ilock', 'x', a, b, MX1, MX1 + 1.5, COURT, YARD, 2, t));
    // 로비 문 앞 화강석 발판(윗면 = 로비 바닥 0 — 안에서 보면 턱 없음 · 영상 b_130.5~133.5) + 초록 격자 매트 · 노란 점자 띠 · 앞 야자 매트 · 북쪽 스테인리스 배수 격자
    addBox(YB1 - DX0, -COURT, MZ1 - (YZ + 0.15), 0xb9b7b0, (DX0 + YB1)/2, COURT, (YZ + 0.15 + MZ1)/2);
    patQuad('teal', DX0, YB1 - 0.12, YZ + 0.27, MZ1 - 0.05, 0.012);
    addPanel(0.3, 2.0, 0xe8c040, DX0 + 0.3, 0.02, lz1 - 1.3);
    addPanel(0.9, 1.6, 0x8a7a5a, YB1 + 0.6, COURT + 0.02, lz1 - 1.3);
    addPanel(1.0, 0.8, 0x9aa0a4, YB1 + 0.6, COURT + 0.02, YZ + 0.6); for (let k = 0; k < 6; k++) addPanel(0.03, 0.74, 0x6b7076, YB1 + 0.18 + k * 0.17, COURT + 0.026, YZ + 0.6);
    { // 문 오른쪽 낮은 나무 선반 + 흰 작은 화분·빨간 꽃(b_130.5·b_132)
      const sx = DX0 + 0.2, sz = YZ + 0.62;
      dBox(0.35, 0.4, 0.75, 0x9a7a52, sx, 0, sz); colliders.push(noStand({ x0: sx - 0.18, x1: sx + 0.18, y0: 0, y1: 0.45, z0: sz - 0.38, z1: sz + 0.38 }));
      dBox(0.12, 0.12, 0.68, 0xf2f2f0, sx, 0.4, sz);                                            // 흰 작은 화분 줄(한 상자)
      for (let k = 0; k < 4; k++) tet(0.07, k % 2 ? 0xd8342c : 0x4f8a3e, sx, 0.56, sz - 0.26 + k * 0.173, k);
    }
    // 로비 마당 문 위 청록 반투명 차양(영상 b_129~132 · q_128): 로비 앞면에서 3.45m · 기둥 하나(북동 모서리) · 앞 끝 둥근 턱 — 판은 조명 무시 무늬(밑면이 땅색에 물들어 검게 보이지 않게)
    { const CX1 = 21.1, CZ0 = YZ - 0.15, CY0 = 3.25, CY1 = 3.1, S9 = PATDEF.cflat[0];
      [[0, 1], [-0.012, -1]].forEach(([dy, n]) => { const P = [[DX0, CY0 + dy, CZ0], [CX1, CY1 + dy, CZ0], [CX1, CY1 + dy, MZ1], [DX0, CY0 + dy, MZ1]];
        patPush('cflat', P, P.map(p => [p[0] / S9, -p[2] / S9]), [0, n, 0], 0x9fd3c6); });
      rodL(CX1, CY1 - 0.02, CZ0, CX1, CY1 - 0.02, MZ1, 0.08, 0x8fc4b8, {}, PR4);                                          // 앞 끝 둥근 턱
      rodL(DX0, CY0 - 0.02, CZ0, CX1, CY1 - 0.02, CZ0, 0.025, 0xc8cdd2);   // 알루미늄 살(북쪽 끝)
      rodL(CX1 - 0.1, COURT, CZ0 + 0.05, CX1 - 0.1, CY1 - 0.02, CZ0 + 0.05, 0.05, 0xa9aeb2, {}, PR4); post(CX1 - 0.1, CZ0 + 0.05, COURT, CY1, 0.07); }
    // 노치 + 노란 꽃 화단(로비 북쪽 유리 밖 c_346~349 → 문 북쪽 유리 앞 b_130.5~132): 흙 + 초록 포기 + 루드베키아 노랑 · 연석 · 올라서지 못함
    addBox(0.15, 0.15, YZ - KZ1, CRB, YB1 + 0.075, COURT, (KZ1 + YZ)/2);                        // 노란 꽃 화단 동변
    addBox(YB1 + 0.15 - DX0, 0.15, 0.15, CRB, (DX0 + YB1 + 0.15)/2, COURT, YZ + 0.075);         // 노란 꽃 화단 남변(발판 북끝과 맞댐)
    patQuad('dirt', cx1 + 0.15, DX0, MZ0, lz0 - 0.15, COURT + 0.06, false, SOIL); patQuad('dirt', DX0, YB1, MZ0, YZ, COURT + 0.06, false, SOIL);
    //   덤불 = 큰 20면 덩어리(초록 몸 + 노랑 꽃 덮개) — 한 화면 삼각형 예산(본관 복도 시점이 마당을 정면으로 본다) 때문에 포기를 잘게 나누지 않는다
    //   꽃 덮개 = 낮은 오각 뿔(5면)
    const CAP5 = new THREE.CylinderGeometry(0, 1, 1, 5, 1, true).translate(0, 0.5, 0).toNonIndexed();
    [[14.8, -39.9, 1], [16.5, -39.2, 1], [18.45, -39.45, 1.3], [18.35, -37.95, 1]].forEach(([x9, z9, s9], i) => { const h9 = hash2(x9, z9);
      dBlob(0.62 * s9, 0.44, 0.55 * s9, i % 2 ? 0x4a7a36 : 0x55853e, x9, COURT + 0.4, z9, { chunky: true, ry: h9 * 6, jitter: 0.16 });
      dGeo(CAP5, _dm.compose(_dv.set(x9 + 0.04, COURT + 0.68, z9 - 0.03), _dq.setFromEuler(_de.set(0, h9 * 4, 0)), _ds.set(0.7 * s9, 0.2, 0.64 * s9)), i % 2 ? 0xf2c01e : 0xe8b31a, { jitter: 0.14 }); });   // 납작한 꽃 덮개(뾰족하면 보석처럼 보인다)
    colliders.push(noStand({ x0: cx1 + 0.15, x1: DX0, y0: COURT, y1: COURT + 0.9, z0: MZ0, z1: lz0 - 0.15 }), noStand({ x0: DX0, x1: YB1, y0: COURT, y1: COURT + 0.9, z0: MZ0, z1: YZ }));
    // 동관 앞 땅 화단(영상 Q_117.5~Q_128·b_129~130.5): 낮은 연석 + 빽빽한 포기(서쪽 = 백일홍·원추리 꽃 · 동끝 = 키 큰 풀) + 철사 울 — 올라서지 못함(술래잡기 동선 = 포장)
    addBox(MX1 - YB1, 0.15, 0.15, CRB, (YB1 + MX1)/2, COURT, (KZ0 + KZ1)/2);
    addBox(0.15, 0.15, KZ0 - MZ0 - 0.05, CRB, MX1 - 0.075, COURT, (MZ0 + 0.05 + KZ0)/2);       // 동끝 막음(벽돌 밑단 앞면에서)
    patQuad('dirt', YB1, MX1 - 0.15, MZ0, KZ0, COURT + 0.06, false, SOIL);
    //   포기 = 길게 늘인 20면 덩어리(2.5m) · 꽃 = 사면체 둘(서쪽 x < 33) — 예산(위 노란 꽃 덤불과 같은 이유)
    for (let x9 = YB1 + 1.1; x9 < MX1 - 0.6; x9 += 2.3) { const h9 = hash2(x9, 41), zz = MZ0 + 0.42 + (h9 - 0.5) * 0.12, tall = x9 > 40.5;
      if (tall) { tuft(x9 - 0.4, COURT + 0.05, zz, 1.05, 0x8e9a60, h9 * 6); tuft(x9 + 0.5, COURT + 0.05, zz + 0.05, 0.9, 0x9aa66e, h9 * 4); }   // 동끝 키 큰 풀
      else dBlob(1.25, 0.4 + h9 * 0.18, 0.42, [0x4f7f3a, 0x5d8f45, 0x466f34][Math.floor(h9 * 3)], x9, COURT + 0.32 + h9 * 0.08, zz, { chunky: true, ry: (h9 - 0.5) * 0.2, jitter: 0.2 });
      if (x9 < 33) for (let k = 0; k < 2; k++) { const hk = hash2(x9 + k, 43);
        tet(0.08, [0xe0485e, 0xf07a3a, 0xf29ab5, 0xd8342c][(k + Math.floor(h9 * 4)) % 4], x9 + (k - 0.5) * 0.8 + (hk - 0.5) * 0.2, COURT + 0.74 + hk * 0.15, zz + (hk - 0.5) * 0.3, hk * 6); }
    }
    { const fz9 = KZ0 - 0.04, fy = COURT + 0.06, xs = [];                                       // 철사 울(기둥 2.5m · 가로 철사 둘 — 하나는 파랑 비닐 · 철사는 5m 토막)
      for (let x9 = YB1 + 0.3; x9 < MX1 - 1.5; x9 += 5.0) xs.push(x9); xs.push(MX1 - 0.25);
      xs.forEach(x9 => rodL(x9, fy, fz9, x9, fy + 0.95, fz9, 0.014, 0x8a9096));
      for (let i = 0; i < xs.length - 1; i++) [[0.45, 0x8a9096], [0.8, 0x4a8ab0]].forEach(([h, c]) => rodL(xs[i], fy + h, fz9, xs[i + 1], fy + h, fz9, 0.007, c)); }
    colliders.push(noStand({ x0: YB1, x1: MX1, y0: COURT, y1: COURT + 1.0, z0: MZ0, z1: KZ0 }));
    { // 동관 동남 모서리 화단(영상 Q_106·Q_109·b_108 오른쪽): 마당 화단이 모서리를 돌아 이어짐 — 둥글게 다듬은 회양목 둘 + 키 큰 억새 + 철사 울 · 뒤뜰 벽돌 마당 높이(YARD)
      const X0 = MX1, X1 = 47.6, Z0 = -41.6, Z1 = -39.8;
      addBox(X1 - X0, 0.15, 0.15, CRB, (X0 + X1) / 2, YARD, Z1 + 0.075); addBox(0.15, 0.15, Z1 - Z0, CRB, X1 + 0.075, YARD, (Z0 + Z1) / 2);
      patQuad('dirt', X0, X1, Z0, Z1, YARD + 0.06, false, SOIL);
      dBlob(0.75, 0.5, 0.62, 0x2e5a2c, 46.0, YARD + 0.45, -40.5, { chunky: true, ry: 0.4, jitter: 0.12 }); dBlob(0.6, 0.45, 0.55, 0x33612f, 47.0, YARD + 0.4, -41.0, { chunky: true, ry: 1.3, jitter: 0.12 });
      [[45.5, -41.2], [46.9, -40.2], [45.6, -40.1]].forEach(([x9, z9], i) => tuft(x9, YARD + 0.05, z9, 1.1 - i * 0.1, i % 2 ? 0x9aa66e : 0x8e9a60, i * 2.1));   // 억새
      [[X0 + 0.1, Z1 - 0.05], [X1 - 0.05, Z1 - 0.05], [X1 - 0.05, Z0 + 0.1]].forEach(([x9, z9], i, A) => { rodL(x9, YARD + 0.06, z9, x9, YARD + 1.0, z9, 0.014, 0x8a9096);
        if (i) [[0.45, 0x8a9096], [0.8, 0x4a8ab0]].forEach(([h, c]) => rodL(A[i - 1][0], YARD + 0.06 + h, A[i - 1][1], x9, YARD + 0.06 + h, z9, 0.007, c)); });
      colliders.push(noStand({ x0: X0, x1: X1, y0: YARD, y1: YARD + 1.0, z0: Z0, z1: Z1 })); }
    // 가운데 줄 화분(영상 Q_113.5~Q_128): 짙은 사발 화분 + 검은 받침 + 불꽃형 향나무 — 동쪽에서 둘째(B)는 잔디만 · A는 마당 동쪽 끝 너머 뒤뜰 포장 위
    //   (면 수 예산: 향나무 5각 × 6띠 · 사발 5각 × 6띠 — 밑면은 흙·사발 속이라 뺌)
    const FLAME = new THREE.LatheGeometry([[0.34, 0.03], [0.46, 0.22], [0.44, 0.46], [0.38, 0.72], [0.25, 0.98], [0.11, 1.2], [0.01, 1.32]].map(([r, y]) => new THREE.Vector2(r, y)), 5);
    { const P9 = FLAME.attributes.position; for (let i = 0; i < P9.count; i++) { const x = P9.getX(i), y = P9.getY(i), z = P9.getZ(i), a = Math.atan2(z, x), f = 1 + 0.09 * Math.sin(a * 3 + y * 11) + 0.05 * Math.sin(a * 5 - y * 7);
      P9.setXYZ(i, x * f, y, z * f); } }   // 잎 뭉치 결(가지 끝이 들쭉날쭉한 향나무 — 매끈한 불꽃 모양이 아니게)
    const BOWL = new THREE.LatheGeometry([[0.2, 0], [0.14, 0.24], [0.34, 0.35], [0.43, 0.55], [0.43, 0.67], [0.36, 0.62], [0.001, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 5);   // 검은 받침 + 짙은 사발 + 테(한 덩어리)
    [[26.4, 0], [31.6, 0], [36.8, 0], [42.0, 1], [47.0, 0]].forEach(([x9, grass]) => {
      const y9 = x9 > MX1 + 1.5 ? YARD : COURT, z9 = PZ9;
      dGeo(BOWL, _dm.compose(_dv.set(x9, y9, z9), _dq.identity(), _ds.set(1, 1, 1)), 0x3a2d28);
      if (grass) dBlob(0.37, 0.12, 0.37, 0x8e9a55, x9, y9 + 0.62, z9, { chunky: true, jitter: 0.25 });
      else dGeo(FLAME, _dm.compose(_dv.set(x9, y9 + 0.55, z9), _dq.setFromEuler(_de.set(0, x9, 0)), _ds.set(1, 1.0, 1)), 0x44703a, { far: true, jitter: 0.22 });
      colliders.push(noStand({ x0: x9 - 0.43, x1: x9 + 0.43, y0: y9, y1: y9 + 0.67, z0: z9 - 0.43, z1: z9 + 0.43 }));
    });
    hotspots.push({ kind: 'pot', x: 36.8, z: PZ9 + 0.75, y: COURT, r: 1.0, label: '향나무 화분에 물 주기' });   // 가운데 향나무 화분(C) 남쪽 — 수돗가에서 물 받고 오는 동선
    // 본관 벽 앞 큰 흰 콘크리트 상자(실외기 덮개 겸 수돗가 — 영상 Q_124·Q_128·b_129·b_130.5): 얼룩 윗판 · 북면 갈색 루버 두 칸 · 동끝 파란 수도관·빨간 밸브 · 윗판 위 빗자루
    { const SX0 = 23.2, SX1 = 27.9, SD = 1.5, sc = (SX0 + SX1) / 2, sz = MZ1 - SD / 2;
      addBox(SX1 - SX0, 1.0, SD, 0xe4e2dc, sc, COURT, sz, NS);
      dBox(SX1 - SX0 + 0.1, 0.1, SD + 0.1, 0xc4c2bb, sc, COURT + 1.0, MZ1 - (SD + 0.1) / 2);
      [24.3, 26.8].forEach(lx => patWall('louver', 'x', lx - 0.5, lx + 0.5, COURT + 0.2, COURT + 0.82, MZ1 - SD - 0.012, -1, 0x9a8878));   // 갈색 루버 두 칸(b_129 — 조명 무시 루버 무늬)
      rodL(SX1 + 0.07, COURT, sz - 0.35, SX1 + 0.07, COURT + 0.55, sz - 0.35, 0.05, 0x2a5aa8, {}, PR4); dBox(0.12, 0.08, 0.12, 0xc0302a, SX1 + 0.07, COURT + 0.5, sz - 0.35);
      rodL(SX1 - 0.02, COURT + 0.42, sz - 0.35, SX1 + 0.16, COURT + 0.42, sz - 0.35, 0.03, 0x9aa0a6);
      rodL(SX0 + 0.3, COURT + 1.12, sz + 0.2, SX0 + 1.8, COURT + 1.14, sz - 0.1, 0.018, 0x8a6a45); dBox(0.3, 0.05, 0.14, 0xc9a86a, SX0 + 0.25, COURT + 1.12, sz + 0.2);   // 싸리 빗자루
      rodL(SX0 + 2.4, COURT + 1.12, sz + 0.3, SX0 + 3.6, COURT + 1.12, sz + 0.1, 0.015, 0x2a5aa8); dBox(0.4, 0.05, 0.12, 0x3a6ac8, SX0 + 3.7, COURT + 1.1, sz + 0.1);   // 파란 대걸레
      hotspots.push({ kind: 'wash', x: SX1 + 0.6, z: sz - 0.35, y: COURT, r: 1.0, label: '수돗가에서 손 씻기' });
      // 검은 호스(꼭지에서 동쪽으로 구불구불 — Q_120.5·Q_124) — 땅에 누운 띠
      const hp = []; for (let k = 0; k <= 8; k++) { const x9 = SX1 + 0.1 + k * 1.5; hp.push([x9, sz - 0.35 - (k ? 0.5 : 0) - Math.sin(k * 2.1) * 0.5 - (k > 4 ? (k - 4) * 0.15 : 0)]); }
      for (let k = 0; k < hp.length - 1; k++) ribbon(hp[k][0], hp[k][1], hp[k + 1][0], hp[k + 1][1], 0.035, COURT + 0.04, 0x1f1f1f); }
    // 바닥 소품: 둥근 맨홀 · 네모 배수 격자(Q_118~Q_128)
    [[24.6, -36.4], [38.0, -35.3]].forEach(([x9, z9]) => disc(0.35, 0x4b4843, x9, COURT + 0.026, z9));
    [[37.2, -36.3], [40.2, -38.6]].forEach(([x9, z9]) => { addPanel(0.5, 0.35, 0x55585d, x9, COURT + 0.02, z9); for (let k = 0; k < 4; k++) addPanel(0.44, 0.03, 0x33363a, x9, COURT + 0.026, z9 - 0.12 + k * 0.08); });
    // 로비 쪽 끝 화분: 노퍽소나무(흰 화분·층층 가지) · 무화과 흰 화분 셋(받침) — 영상 Q_131·b_130.5
    { const nx = 21.4, nz = MZ1 - 0.8;                                                           // 수돗가 상자 서쪽·첫째와 둘째 창 사이 앞(b_130.5 — 문 앞 b_132 시야 밖)
      dCyl(0.22, 0.17, 0.42, 0xf2f2ee, nx, COURT, nz, { seg: 6 }); rodL(nx, COURT + 0.4, nz, nx, COURT + 2.1, nz, 0.045, 0x6d4e32);
      [[0.52, 0.78], [0.42, 1.08], [0.32, 1.38], [0.2, 1.66]].forEach(([r, y], k) => dBlob(r, 0.13, r, k % 2 ? 0x3f6a3a : 0x355f33, nx, COURT + y, nz, { chunky: true, ry: k * 0.7, jitter: 0.25 }));   // 층층 가지(처진 잎 층 — 두껍게)
      colliders.push(noStand({ x0: nx - 0.48, x1: nx + 0.48, y0: COURT, y1: COURT + 0.5, z0: nz - 0.48, z1: nz + 0.48 })); }   // 가지 층까지 막음(몸이 가지를 뚫고 지나가지 않게)
    [[20.7, -36.2], [21.9, -38.9]].forEach(([x9, z9], i) => {
      disc(0.25, 0xe8e8e4, x9, COURT + 0.03, z9); dCyl(0.19, 0.14, 0.36, 0xf2f2ee, x9, COURT + 0.03, z9, { seg: 6 });
      rodL(x9, COURT + 0.35, z9, x9 + 0.05, COURT + 1.25 - i * 0.15, z9 - 0.04, 0.02, 0x7a6a50);
      [[0.2, 1.05, 0.1], [-0.12, 1.28, -0.08]].forEach(([ox, oy, oz], k) => dGeo(OCT, _dm.compose(_dv.set(x9 + ox, COURT + oy - i * 0.12, z9 + oz), _dq.setFromEuler(_de.set(0.15, ox * 5 + k, 0.1)), _ds.set(0.34, 0.06, 0.26)), k ? 0x6f9e44 : 0x7aa84a));   // 큰 잎 = 납작한 마름모(8면)
      colliders.push(noStand({ x0: x9 - 0.3, x1: x9 + 0.3, y0: COURT, y1: COURT + 0.4, z0: z9 - 0.3, z1: z9 + 0.3 }));
    });
    // 본관 북면(영상 Q_113.5~Q_128·b_108): 창마다 아래 튀어나온 크림 상자(실외기 덮개형 · 윗판 — 창턱 바로 밑) · 창 사이 짙은 선홈통 + 네모 깔때기 · 밑단 크림(짙은 띠 없음)
    //   수돗가 상자(23.2~27.9) 양옆은 상자를 자름 · 마당 동쪽 끝 너머(뒤뜰 YARD)까지 이어짐(b_108·Q_109) · 게시판 뒤 첫 창 = 유리 뒤 흰 판(b_132)
    NWINC.forEach(c => {
      let a = c - 1.7, b = c + 1.7;
      if (a < 23.1 && b > 23.1) b = 23.1; if (a < 28.0 && b > 28.0) a = 28.0;
      if (b - a < 1.0) return;                                                                        // 수돗가 옆 짧은 토막은 생략
      const y0 = b > MX1 ? YARD + 0.005 : COURT + 0.006, m = (a + b) / 2;
      dBox(b - a, 0.95 - y0, 0.46, 0xf1ebda, m, y0, MZ1 - 0.236);   // 윗면 0.95 = 본관 창 바깥 창턱(0.95~1.0 — MAIN-COR) 바로 밑(같은 평면 금지)                                     // 벽 면에서 6mm 띄움(마당 받침 상자 뒷면과 같은 평면이 안 되게) · 윗판 턱은 면 수 예산으로 생략
      colliders.push(noStand({ x0: a, x1: b, y0, y1: 1.01, z0: MZ1 - 0.49, z1: MZ1 }));
    });
    cut16(DX0 + 0.06, fx1 + 0.09, (u, v) => dBox(v - u, 0.45 - (YARD + 0.015), 0.03, 0xe8e3d7, (u + v) / 2, YARD + 0.015, MZ1 - 0.03));   // 밑단 크림(짙은 띠 자리 — 벽 면 1cm 앞)
    [0, 2, 4, 6].filter(k => k < NWINC.length - 1).forEach(k => { const x9 = (NWINC[k] + NWINC[k + 1]) / 2, y9 = x9 > MX1 ? YARD : COURT;
      rodL(x9, y9, MZ1 - 0.07, x9, FH + 0.1, MZ1 - 0.07, 0.05, 0x6f706c, {}, PR4); dBox(0.22, 0.25, 0.18, 0x77776f, x9, FH - 0.45, MZ1 - 0.1); });
    zones.push({ x0: lx1, x1: MX1, z0: MZ0, z1: MZ1, y: COURT, label: '가운데 마당' });
  }

  // ================= 동관 (2학년·4학년·과학실·과학준비실 + 동끝 창고) =================
  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  const endX = E.rooms.find(r => r.external).span[0];                                // 창고 서벽(40.5)
  // LINK-EAST-0(영상 e_366~381): 복도 끝 판벽 corX(32.3) · 남쪽 줄 방 SR · 끝벽 뒤 복도 줄 = 과학준비실 PRP · 과학실 문 = 끝벽 앞(layout door)
  const corX = E.corridorEndX ?? endX, SR = E.rooms.filter(r => r.row !== 'corridor'), PRP = E.rooms.find(r => r.row === 'corridor'), eDoorC = r => r.door ?? doorC(r);
  foundation(ex0, ex1 + 0.15, ez0 - 0.15, ez1);
  foundation(ex0, ex1 + 0.15, ez1, ez1 + 0.15);
  // COURT-3(영상 Q_117.5·Q_120.5·Q_126.5·b_129~130.5): 마당 쪽 남면 = 매끈한 크림 칠(판 무늬·파랑 띠 없음) · 큰 4짝 창 + 윗창(밝은 참나무 틀) ·
  //   창 아래 적벽돌 + 콘크리트 창턱 띠 · 창 사이·방 경계 크림 벽기둥 · 회색 홈통·흰 환기 캡
  const ESG = SR.filter(r => !r.external).flatMap(r => {   // SR = 남쪽 줄 방(과학준비실은 복도 줄 — LINK-EAST-0)
    const n = r.type === 'science' ? 3 : Math.max(1, Math.round((r.span[1] - r.span[0]) / 4.3)), seg = (r.span[1] - r.span[0] - 0.8) / n;
    return [...Array(n).keys()].map(k => ({ c: r.span[0] + 0.4 + seg * (k + 0.5), w: Math.min(3.2, seg - 0.5), sill: 0.95, dh: 2.85, win: true, frame: 0xa8875a, noLedge: true })); });
  wallX(ex0 - 0.15, ex1 + 0.15, ez1, 0xe8e3d7, { face: 1, ext: true, innerHex: CLS_WALL_E, gaps: ESG });
  { const zo = ez1 + 0.15, bx0 = LC.x[1] + 0.21, bx1 = ex1 + 0.09, bm = (bx0 + bx1) / 2, BY = 0.83;
    cut16(bx0, bx1, (u, v) => dBox(v - u, BY - COURT, 0.05, 0x8a4a3a, (u + v) / 2, COURT, zo + 0.025));    // 적벽돌 밑단(짙은 띠 자리도 덮음)
    patWall('brickW', 'x', bx0, bx1, COURT, BY, zo + 0.062, 1, 0xa88076);
    cut16(bx0, bx1, (u, v) => dBox(v - u, 0.12, 0.2, 0xcfcac0, (u + v) / 2, BY, zo + 0.1));                // 콘크리트 창턱 띠
    const gs = ESG.map(g => [g.c - g.w / 2, g.c + g.w / 2]).sort((p, q) => p[0] - q[0]), piers = [];
    for (let i = 0; i < gs.length - 1; i++) piers.push([gs[i][1], gs[i + 1][0]]);
    piers.push([gs[gs.length - 1][1] + 0.3, gs[gs.length - 1][1] + 1.0]);                                  // 준비실 창 동쪽(창고 벽 시작)
    piers.forEach(([a, b], i) => { const pw = Math.min(0.55, b - a - 0.06), pc = (a + b) / 2;
      dBox(pw, FH - 0.06 - COURT, 0.25, 0xe8e1cf, pc, COURT + 0.005, zo + 0.006 + 0.125);
      if (i % 2 === 1) { const hx = pc + pw / 2 + 0.12, hz = zo + 0.08;                           // 회색 홈통(넓은 벽 쪽 — 뚜껑 없는 네모 봉: 면 수 예산)
        visRods.push({ x0: hx - 0.045, x1: hx + 0.045, y0: COURT, y1: FH + 0.05, z0: hz - 0.045, z1: hz + 0.045, r: 0.045, a: [hx, COURT, hz], b: [hx, FH + 0.05, hz] });
        dGeo(new THREE.CylinderGeometry(1, 1, 1, 4, 1, true).translate(0, 0.5, 0), _dm.compose(_dv.set(hx, COURT, hz), _dq.identity(), _ds.set(0.045, FH + 0.05 - COURT, 0.045)), 0x8d9094); }
      if (i === 0) [1.35, 1.7].forEach(y9 => dCyl(0.13, 0.13, 0.14, 0xf2f2ee, pc, y9, zo + 0.26, { seg: 5, rot: [Math.PI / 2, 0, 0] }));   // 흰 환기 캡(Q_117.5·b_129)
    });
  }
  // BACKYARD-14(09-24 영상 b_043·b_085~088·d_088): 북·동면 = 흰빛 크림 패널(파랑 띠·베이지 판 아님) · 창틀은 갈색 그대로
  const ECR = 0xe8e3d7;
  // LINK-EAST-8·25: 북벽 창 = 세로복도 북끝 나무틀 4짝(c_362 자: 폭 2.8·창턱 1.15·천장까지 0.2 — 위 가로살 없음) · 동관 복도 5묶음(e_366~381 — 예전 자동 9칸은 7묶음) · 준비실 2 · 창고 1
  //   틀 = 연한 원목(실내 c_364·c_365 — 예전 짙은 밤색) · 실내 흰 창턱(깊음 — 아이 작품이 기댄다 e_374)
  const EFR = 0xa58660, NW = [{ c: (LC.x[0] + LC.x[1]) / 2 + 0.15, w: LC.x[1] - LC.x[0] - 0.8, sill: 1.15, dh: 2.55, win: true, frame: EFR }, ...[15.7, 19.45, 23.2, 26.9, 30.65, 34.4, 38.3, 43.2].map(c => ({ c, w: 2.2, sill: 1.0, dh: 2.5, win: true, frame: EFR }))];
  wallX(LC.x[0] + 0.15, ex1 + 0.15, ez0, ECR, { face: -1, ext: true, gaps: NW });   // 북벽(세로복도 북끝 창 포함)
  NW.forEach(g => { if (g.c < endX) dBox(g.w + 0.1, 0.04, 0.16, 0xf3f0e8, g.c, g.sill - 0.04, ez0 + 0.23); });
  // 동벽(BACKYARD-20 영상 b_085~088·d_089): 북쪽 절반 골판 차양 밑 = 어두운 창 + 흰 문(창고) · 남쪽 = 작은 창. ⚠️복도 동쪽 끝엔 문이 없다(사용자 "그쪽 복도에서 바깥으로 나가는 곳은 없음")
  wallZ(ez0, ez1, ex1, ECR, { face: 1, ext: true, gaps: [{ c: ez0 + 1.2, w: 1.3, sill: 1.0, dh: 2.2, win: true }, { c: ez0 + 2.9, w: 1.0, door: true, color: 0xe9e8e2 }, { c: ez1 - 1.4, w: 1.2, sill: 1.2, dh: 2.4, win: true }] });
  wallRun('z', zCE + 0.15, ez1 - 0.15, ex0, INNER, { inner: true, face: -1, innerHex: CLS_WALL_E });   // 세로복도 동벽 = 2학년 서벽(노치 창은 로비 쪽에서) · 교실 쪽 면 = 흰 교실 벽
  addBox(0.5, FH, 0.3, INNER, ex0 + 0.25, 0, ez0 + 0.3);                                              // LINK-EAST-9: 교차부 북벽 기둥(c_362.8·c_364.2 — 첫 동관 창과 안 겹침)
  dBox(0.03, 0.12, 0.08, 0xf4f4f2, ex0 - 0.165, 1.2, zCE - 0.02);                                     // 2학년 모서리 흰 스위치(a_444·c_362.8)
  // [classrooms-19] 동관 문 = 베이지 회색 나뭇결(영상 a_423·a_384) · [classrooms-3] 과학실 = 번호키 문 하나(뒷문 없음 — a_379.5·s_389)
  // LINK-EAST-4: 문 높이 2.2 + 위 광창(연회갈 틀) — 영상 c_365.8·e_366 · 문 위가 막힌 벽이던 것
  const DOORC = 0xe6ddcc, eGaps = SR.filter(r => !r.innerOnly && !r.external).map(r => ({ c: eDoorC(r), w: 1.2, dh: 2.2, color: DOORC }));
  SR.filter(r => twoDoor(r) && r.type !== 'science').forEach(r => eGaps.push({ ...backDoor(r), dh: 2.2, color: DOORC }));
  // [classrooms-2] 교실 쪽 창(영상 a_421.5·a_432·a_433.5): 2·4학년 = 앞문~뒷문 사이 두 짝(창턱 1.5·밝은 베이지 틀 — 예전 wins:8은 문 근처라 자동으로 빠졌다),
  //   과학실 = 진열대 위 불투명 높은 창(s_403 — LINK-EAST-0 뒤로는 준비실 쪽 벽) · 준비실 문 = 과학실 북벽 동끝(개수대 서쪽)
  const eWins = [], SCI = SR.find(r => r.type === 'science'), prepX = PRP ? SCI.span[1] - 0.15 - 1.9 : null;
  SR.forEach(r => {
    if (r.type === 'classroom') { const a = doorC(r) + 0.75, b = backDoor(r).c - 0.75, p = r.name === '4학년' ? 0.5 : 0.8, w9 = (b - a - p) / 2;
      eWins.push({ c: a + w9 / 2, w: w9, sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }, { c: b - w9 / 2, w: w9, sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }); }
    else if (r.type === 'science') { const a = PRP ? corX + 1.1 : eDoorC(r) + 0.75, b = PRP ? prepX - 1.2 : r.span[1] - 1.35;
      eWins.push({ c: (a + b) / 2, w: Math.min(2.3, b - a - 0.4), sill: 1.5, dh: 2.5, win: true, frame: 0xd8cfbd }); }
  });
  const eSplit = SCI.span[0], eAll = [...eGaps, ...eWins];
  // 복도 남벽: 교실 쪽 면 = 연두 세로판 징두리(4학년 a_433.5 — 1.05) + 흰 벽 · 과학실 쪽 = 흰 벽(끝벽 뒤 = 준비실 벽 — 준비실 문)
  wallX(ex0 - 0.15, eSplit, zCE, INNER, { gaps: eAll.filter(g => g.c < eSplit), face: -1, dado: { top: 1.05, lo: 0xbfd89a, hi: CLS_WALL_E } });
  wallX(eSplit, endX - 0.15, zCE, INNER, { gaps: [...eAll.filter(g => g.c > eSplit), ...(PRP ? [{ c: prepX, w: 1.0, dh: 2.2, color: DOORC }] : [])], face: -1, inner: true, innerHex: CLS_WALL_E });
  wallZ(ez0, ez1, endX, INNER, {});                                                                // 창고 서벽
  // LINK-EAST-4: 복도 쪽 문 = 북향 면이라 반구광만 받아 회갈색(#877d73)이 됐다 — 영상은 문이 벽만큼 밝은 연회색 나무결(c_371.8·a_379.5) → 문 색 밝기 보정(main.js lum)
  doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCE) < 0.01 && d.cx > ex0 && d.cx < corX) d.lum = 1.45; });
  if (corX < endX - 0.3) wallZ(ez0, zCE, corX, INNER, {});                                         // 복도 동쪽 끝 판벽(LINK-EAST-0)
  // LINK-EAST-17: 복도 쪽 흰 벽(북창 빛을 받아 영상에선 가장 밝은 면 — c_365.8·c_371.8·a_447) = 조명 무시 무늬(천장과 같은 이유 — 북·서향 면은 반구광만 받아 회갈색이 됐다)
  //   새 메시(드로우콜)를 만들지 않게 평천장 무늬(cflat — 이미 조명 무시)의 줄 없는 한가운데만 찍어 쓴다(평평한 한 색 = #f4f1ea × 정점색)
  const CH = 2.75, uq = (ax, a0, a1, y0, y1, line, f, tint) => patPush('cflat', ax === 'x' ? [[a0, y0, line], [a1, y0, line], [a1, y1, line], [a0, y1, line]] : [[line, y0, a0], [line, y0, a1], [line, y1, a1], [line, y1, a0]],
    [[0.1, 0.1], [0.4, 0.1], [0.4, 0.4], [0.1, 0.4]], ax === 'x' ? [0, 0, f] : [f, 0, 0], tint);
  const unlitWall = (ax, a0, a1, line, f, gs, tint) => {   // 벽 면 앞 1.2cm · 문·창 자리는 비움(창턱 아래·인방 위만)
    let cur = a0;
    for (const g of gs.filter(g => g.c + g.w/2 > a0 && g.c - g.w/2 < a1).sort((p, q) => p.c - q.c)) {
      const g0 = Math.max(a0, g.c - g.w/2), g1 = Math.min(a1, g.c + g.w/2), sl = g.sill ?? 0, dh = Math.min(g.dh ?? 2.6, CH);
      if (g0 - cur > 0.01) uq(ax, cur, g0, 0, CH, line, f, tint);
      if (sl > 0.01) uq(ax, g0, g1, 0, sl, line, f, tint);
      if (CH - dh > 0.01) uq(ax, g0, g1, dh, CH, line, f, tint);
      cur = g1; }
    if (a1 - cur > 0.01) uq(ax, cur, a1, 0, CH, line, f, tint);
  };
  // LINK-EAST-33(영상 e_370.5·a_379.5·c_371.8): 문 = 복도 벽보다 0.15 들어간 자리 — 문 양옆 설주 기둥이 복도로 튀어나온다(천장 2.75까지)
  //   문과 이웃 틈(문·창·복도 끝) 사이 벽이 2.4 이하면 한 덩어리(4학년 뒷문~과학실 문 = 분홍 게시물 붙은 기둥 a_379.5) · 그보다 길면 문 옆 0.4만
  //   기둥 면 = 남벽과 같은 조명 무시 흰 면(북향 상자 면은 회갈색이 된다 — LINK-EAST-17)
  const PZ = zCE - 0.3, piers = new Map();
  { const W0 = ex0 - 0.15, W1 = corX - 0.15, gs = eAll.filter(g => g.c < corX).map(g => [g.c - g.w/2, g.c + g.w/2]);
    eGaps.forEach(g => { const a = g.c - g.w/2, b = g.c + g.w/2;
      const pv = Math.max(W0, ...gs.filter(q => q[1] <= a + 1e-6).map(q => q[1])), nx = Math.min(W1, ...gs.filter(q => q[0] >= b - 1e-6).map(q => q[0]));
      [[pv, a, -1], [b, nx, 1]].forEach(([u, v, s]) => { const L = v - u; if (L < 0.1499) return;
        const [p0, p1] = L <= 2.4 ? [u, v] : s < 0 ? [a - 0.4, a] : [b, b + 0.4]; piers.set(p0.toFixed(3), [p0, p1]); }); }); }
  const onPier = x => [...piers.values()].some(([p0, p1]) => x > p0 - 1e-6 && x < p1 + 1e-6), faceZ = x => onPier(x) ? PZ : zCE - 0.15;
  //   보이는 면 = 조명 무시 사각형 셋(앞 + 양옆 — 윗면은 천장 위·뒷면은 벽 속이라 상자 6면을 만들 필요가 없다) · 충돌은 따로
  piers.forEach(([p0, p1]) => { colliders.push({ x0: p0, x1: p1, y0: 0, y1: CH, z0: PZ, z1: zCE - 0.15 });
    uq('x', p0, p1, 0, CH, PZ, -1, 0xedeae6); [[p0, -1], [p1, 1]].forEach(([l9, f9]) => uq('z', PZ, zCE - 0.15, 0, CH, l9, f9, 0xdedad3)); });
  unlitWall('x', ex0 - 0.15, corX - 0.15, zCE - 0.162, -1, [...eAll, ...[...piers.values()].map(([p0, p1]) => ({ c: (p0 + p1)/2, w: p1 - p0, sill: 0, dh: CH }))], 0xedeae6);   // 동관 복도 남벽(≈#e3dfd7) · 기둥 뒤는 건너뜀
  unlitWall('z', zCE - 0.15, ez1 + 0.15, ex0 - 0.162, -1, [], 0xf0ede9);                           // 세로복도 동벽(2학년 서벽)
  { // 복도 바닥: 황갈 장판 + 둘레 짙은 숯색 띠 0.3(입구·끝벽 앞도 가로지름 — LINK-EAST-24 c_364.2·a_379.5)
    const x0 = ex0 - 0.15, x1 = corX - 0.15, z0 = ez0 + 0.15, z1 = zCE - 0.15, B9 = 0.3, BC = 0x34332f;
    addPanel(x1 - x0, B9, BC, (x0 + x1)/2, 0.012, z0 + B9/2); addPanel(x1 - x0, B9, BC, (x0 + x1)/2, 0.012, z1 - B9/2);
    addPanel(B9, z1 - z0 - 2*B9, BC, x0 + B9/2, 0.012, (z0 + z1)/2); addPanel(B9, z1 - z0 - 2*B9, BC, x1 - B9/2, 0.012, (z0 + z1)/2);
    floorQ('ecor', x0 + B9, x1 - B9, z0 + B9, z1 - B9, 0, 0xb7bcdb);                                  // LINK-EAST-17: 바닥이 벽보다 어둡게 · 노란 장판 무늬를 푸른 틴트로 눌러 회베이지(영상 #8e816f 비율 — c_371.8·e_370.5)
    // LINK-EAST-28: 소화기(북벽 밑 — c_371.8·a_379.5) + 빨간 '소화기' 표지 · LINK-EAST-29: 회색 분전함(첫 두 창 사이 — c_364.2·e_369.5)
    [16.2, 20.0, 24.5, corX - 0.8].forEach(x9 => { extinguisher(x9, 0, z0 + 0.14); dBox(0.14, 0.18, 0.03, 0xd0202a, x9, 0.66, z0 + 0.015); });
    dBox(0.5, 0.7, 0.12, 0x9aa0a6, 17.6, 1.75, z0 + 0.06); dBox(0.03, 0.08, 0.03, 0x5a5e63, 17.8, 2.1, z0 + 0.135);   // 높이 1.75~2.45(e_369.5 — 천장 가까이)
    for (let x9 = ex0 + 1.8; x9 < corX - 1; x9 += 3.8) lamp(0.62, 0.05, 0.3, x9, CH - 0.05, (ez0 + zCE)/2);
    ceil(LC.x[1] - 0.32, corX, ez0, zCE, CH + 0.16, 'cflat');                                       // LINK-EAST-16·23: 천장 2.75 · 교차부는 세로복도 우물반자
    zones.push({ x0: ex0, x1: corX, z0: ez0, z1: zCE, y: 0, label: '동관 복도' });
    // LINK-EAST-27: 북창 창턱의 아이 작품(기댄 종이)·노란 바구니(c_373.2·e_374)
    [23.0, 23.35, 23.7, 26.3, 26.65, 27.0].forEach((x9, k) => { const pz = z0 + 0.1 + (k % 2) * 0.03;
      dBox(0.28, 0.22, 0.03, 0xf7f7f2, x9, 1.0, pz); dBox(0.08, 0.06, 0.03, [0xe24b4b, 0x3b6fb5, 0x2f8f5b, 0xf2a03a][k % 4], x9 - 0.05, 1.1, pz + 0.02); });
    dBox(0.3, 0.08, 0.14, 0xf2d23a, 24.0, 1.0, z0 + 0.09);
    // LINK-EAST-12: 끝벽 = 연베이지 나무결 판벽(윗띠 · 큰 판 2 + 흰 표찰 · 난간대 · 아래 세로 징두리 5 — a_379.5·a_381·e_378)
    //   판 = 조명 무시 사각형들(바탕 = 판 사이 줄눈 색 · 판은 3mm 앞 — 서향 그늘이라 상자 판은 회갈색이 됐다) + 튀어나온 난간대만 상자
    const zc = (ez0 + zCE)/2, fx = corX - 0.15, z0e = ez0 + 0.15, WZ = (onPier(fx - 0.01) ? PZ : zCE - 0.15) - z0e,   // 문 옆 기둥이 끝벽에 닿으면 판벽은 기둥 면까지
      pq = (za, zb, y0, y1, t, d = 0.015) => uq('z', z0e + za, z0e + zb, y0, y1, fx - d, -1, t);
    //   색 = 연베이지 나무결(영상 a_379.5 중앙값: 큰 판 #cdc6b8 · 징두리 #c4bcac · 윗띠 #b8ad98 · 줄눈 #9e9585 — 예전 틴트는 거의 흰색으로 떴다)
    pq(0, WZ, 0, CH, 0xaca08b, 0.012);                                                             // 바탕(줄눈)
    pq(0.05, WZ - 0.05, 2.3, 2.65, 0xc8ba9f);                                                      // 윗띠
    [[0.07, WZ / 2 - 0.02], [WZ / 2 + 0.02, WZ - 0.07]].forEach(([a, b]) => pq(a, b, 1.06, 2.25, 0xdfd5c1));   // 큰 판 2(미닫이 붙박이장)
    for (let k = 0; k < 5; k++) { const a = 0.05 + k * (WZ - 0.1) / 5; pq(a + 0.02, a + (WZ - 0.1) / 5 - 0.02, 0.12, 0.96, 0xd5cab4); }   // 아래 세로 징두리 5
    pq(0, WZ, 0, 0.1, 0x6e685f);                                                                    // 걸레받이
    [[0.47, 1.95], [WZ / 2 + 0.42, 1.95]].forEach(([a, y]) => pq(a, a + 0.08, y, y + 0.05, 0xffffff, 0.018));   // 흰 표찰
    dBox(0.04, 0.05, WZ - 0.12, 0xc9bda8, fx - 0.02, 0.98, z0e + WZ / 2);                                      // 난간대
  }
  // LINK-EAST-4·26·11: 문 위 광창 + 문틀(연회갈 — 기둥 사이에 꼭 맞게) · 앞문 서쪽 반 안내 액자(은색 틀·분홍 테 — 글자 없음) · 과학실 번호키 + 분홍 게시물(기둥 면에)
  eGaps.forEach(g => { const fz = zCE - 0.165, hw = g.w/2;
    dBox(g.w, 0.45, 0.03, 0xa89c88, g.c, 2.2, fz); dBox(g.w - 0.02, 0.35, 0.03, 0x9fb4bc, g.c, 2.25, fz - 0.015);
    [-1, 1].forEach(s => { if (!onPier(g.c + s * (hw + 0.05))) dBox(0.05, 2.2, 0.03, 0xa89c88, g.c + s * (hw + 0.025), 0, fz); }); });
  SR.filter(r => r.type === 'classroom').forEach(r => { const x9 = doorC(r) - 1.25, fz = faceZ(x9);
    dBox(0.36, 0.48, 0.03, 0xc8c8cc, x9, 1.25, fz - 0.015); dBox(0.32, 0.44, 0.03, 0xf0c8d8, x9, 1.27, fz - 0.03); dBox(0.26, 0.36, 0.03, 0xf6f4f0, x9, 1.31, fz - 0.045); });
  { const c = eDoorC(SCI), kx = c + 0.72, nx9 = c - 0.95, kz = faceZ(kx) - 0.015, nz = faceZ(nx9) - 0.015;
    dBox(0.07, 0.22, 0.03, 0x15171a, kx, 1.05, kz); dBox(0.04, 0.08, 0.03, 0x3b6fe0, kx, 1.12, kz - 0.015);
    dBox(0.3, 0.42, 0.03, 0xf0c8d8, nx9, 1.2, nz); dBox(0.24, 0.34, 0.03, 0xfbf6f8, nx9, 1.24, nz - 0.015);
    hotspots.push({ kind: 'keypad', x: kx, z: zCE - 0.8, y: 0, r: 0.8, label: '번호키 누르기' }); }   // 보물찾기·방탈출 자물쇠 자리
  SR.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && !r.external) addBox(0.3, FH, ez1 - zCE - 0.3, CLS_WALL_E, s0, 0, (zCE + ez1)/2);
    const z0 = (r.external ? ez0 : zCE) + 0.15, x0 = s0 + 0.15, x1 = s1 - 0.15;
    floorQ(r.external || r.type === 'storage' ? 'tileW' : r.type === 'science' ? 'tileG' : 'wood', x0, x1, z0, ez1 - 0.15, 0, r.external ? 0xb9b6ae : 0xffffff);   // 과학실 = 회베이지 테라초(s_390.5)
    zones.push({ x0: s0, x1: s1, z0: r.external ? ez0 : zCE, z1: ez1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      if (r.type === 'science') { labRoom(s0 + 0.15, s1 - 0.15, zCE + 0.15, ez1 - 0.15, eDoorC(r), PRP ? zCE - 0.25 : zCE + 1.45, prepX); [3.45, 5.75].forEach(k => acUnit(cx, FH - 0.16, zCE + k));
        eWins.filter(g => g.c > s0 && g.c < s1).forEach(g => [1, -1].forEach(f => patWall('film2', 'x', g.c - g.w/2 + 0.06, g.c + g.w/2 - 0.06, g.sill + 0.06, g.dh - 0.06, zCE + f * 0.09, f))); }   // 불투명 높은 창(s_403)
      else { const g4 = r.name === '4학년';
        westClass(r.name, s0 + 0.15, s1 - 0.15, zCE + 0.15, ez1 - 0.15, 0, { sill: 0.9, ceilH: FH - 0.16, style: g4 ? 'g4' : '' });   // 서향 교실
        acUnit(cx, FH - 0.16, zCE + 3.45);
        // 징두리 위 베이지 몰딩 + 가는 연두 선(a_433.5) — 문 자리는 건너뜀
        const dg = eGaps.filter(g => g.c > s0 && g.c < s1).map(g => [g.c - g.w/2 - 0.02, g.c + g.w/2 + 0.02]).sort((p, q) => p[0] - q[0]);
        let a9 = s0 + 0.15; for (const [u, v] of [...dg, [s1 - 0.15, s1 - 0.15]]) { if (u - a9 > 0.2) { dBox(u - a9, 0.07, 0.03, 0xe6dfc8, (a9 + u)/2, 1.05, zCE + 0.165); dBox(u - a9, 0.03, 0.04, LIME, (a9 + u)/2, 1.12, zCE + 0.17); } a9 = v; }
        if (g4) {   // 4학년: 창 사이 흰 벽걸이 환기장치(a_432·a_433.5) · 창 사이 기둥 선풍기(a_427.5) · 동남 모서리 파스텔 접이 매트(a_429·a_430.5)
          const wv = eWins.filter(g => g.c > s0 && g.c < s1).sort((p, q) => p.c - q.c), vx = (wv[0].c + wv[0].w/2 + wv[1].c - wv[1].w/2) / 2;
          dBox(0.44, 0.42, 0.22, 0xf2f3f4, vx, 2.1, zCE + 0.26); dBox(0.3, 0.26, 0.03, 0xd2d6da, vx, 2.18, zCE + 0.385);
          const n9 = Math.max(1, Math.round((s1 - s0) / 4.3)), sg9 = (s1 - s0 - 0.8) / n9;
          for (let k = 1; k < n9; k++) wallFan(s0 + 0.4 + sg9 * k, ez1 - 0.15, -1, 2.35);
          [0xbcd7ef, 0xc4e3bf, 0xf7e6a0, 0xf2c4d6].forEach((c9, k) => addPanel(0.55, 1.4, c9, s1 - 0.15 - 2.67 + 0.275 + k * 0.55, 0.02, ez1 - 0.15 - 1.17));
        }
      }
      [1, 2, 3].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * (s1 - s0) * 0.22, FH - 0.21, zCE + k * 2.3)));
      doors.forEach(d => { if (d.ax === 'x' && !d.glass && Math.abs(d.cz - zCE) < 0.01 && d.cx > s0 && d.cx < s1) d.slot = true; });   // [classrooms-19] 가로 쪽창(a_423·a_384)
    } else if (r.innerOnly) [ez1 - 0.6, zCE + 0.6].forEach(z9 => addBox(s1 - s0 - 0.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9));
    else if (r.external) { [ez0 + 0.6, ez0 + 2.0].forEach(z9 => addBox(s1 - s0 - 0.8, 1.6, 0.6, 0x8a9096, cx - 0.2, 0, z9));   // 체육 기구 선반·매트
      addBox(1.6, 0.4, 1.2, 0x3f6fb0, cx - 0.3, 0, ez1 - 1.4); }
    if (!r.innerOnly && !r.external) classSign(r.name, eDoorC(r), 2.5, zCE - 0.03, -1);   // [classrooms-18] '2-1'·'4-1'·'과학실' 크림 판(a_421.5·a_379.5) — 천장 2.75 밑
    ceil(s0, s1, r.external ? ez0 : zCE, ez1, FH, r.external ? 'cflat' : 'ctile');
  });
  if (PRP) { const [p0, p1] = PRP.span, pc = (p0 + p1) / 2;                                            // 과학준비실(끝벽 뒤 복도 줄 — 과학실 북벽 문으로만)
    floorQ('tileW', p0 + 0.15, p1 - 0.15, ez0 + 0.15, zCE - 0.15);
    zones.push({ x0: p0, x1: p1, z0: ez0, z1: zCE, y: 0, label: PRP.name });
    ceil(p0, p1, ez0, zCE, FH, 'ctile');
    addBox(0.5, 1.9, 1.6, 0x9aa0a6, p0 + 0.4, 0, (ez0 + zCE) / 2);                                    // 회색 철제 선반(끝벽 뒤)
    addBox(1.4, 1.9, 0.45, 0x9aa0a6, 36.35, 0, ez0 + 0.375);                                          // 창 사이 선반
    addBox(1.2, 0.85, 0.5, 0xd8dcdf, p1 - 0.9, 0, ez0 + 0.4, NS);                                     // 낮은 약품장
    [p0 + 2.2, p1 - 2.2].forEach(x9 => lamp(1.2, 0.05, 0.22, x9, FH - 0.21, (ez0 + zCE) / 2)); }
  addBox(endX - ex0 + 0.4, 0.3, ez1 - ez0 + 0.8, 0x3a8f66, (ex0 + endX + 0.4)/2, FH, (ez0 + ez1)/2);            // 초록 지붕(위성: 본관보다 짙고 청록 기 — COURT-3)
  addBox(ex1 + 0.4 - (endX + 0.4), 0.3, ez1 - ez0 + 0.8, 0xe6e7e3, (endX + 0.4 + ex1 + 0.4)/2, FH, (ez0 + ez1)/2);   // 창고 흰 지붕(위성)
  // COURT-3(영상 Q_113.5·Q_117.5·b_108 오른쪽): 마당 쪽·동쪽 지붕 끝 = 크림 처마 슬래브(0.6 돌출 · 윗면은 지붕판보다 4mm 낮게 · 밑면 조명 무시 무늬) + 끝에 난간
  { const EX9 = ex1 + 0.75, EZ9 = ez1 + 0.75;
    cut16(LC.x[1] + 0.15, EX9, (u, v) => dBox(v - u, 0.35, EZ9 - (ez1 + 0.15), 0xe9e5dc, (u + v) / 2, FH - 0.056, (ez1 + 0.15 + EZ9) / 2, { far: true }));
    cut16(ez0 - 0.38, ez1 + 0.15, (u, v) => dBox(EX9 - (ex1 + 0.15), 0.35, v - u, 0xe9e5dc, (ex1 + 0.15 + EX9) / 2, FH - 0.056, (u + v) / 2, { far: true }));
    patQuad('cflat', LC.x[1] + 0.15, EX9, ez1 + 0.15, EZ9, FH - 0.064, true, 0xd9d4c6); patQuad('cflat', ex1 + 0.15, EX9, ez0 - 0.38, ez1 + 0.15, FH - 0.064, true, 0xd9d4c6);
    roofRail(LC.x[1] + 0.15, EZ9 - 0.07, EX9 - 0.07, EZ9 - 0.07, FH + 0.3); roofRail(LC.x[0] + 0.15, ez0 - 0.3, EX9 - 0.07, ez0 - 0.3, FH + 0.3);   // 옥상 난간(마당 쪽·북쪽 — 북쪽은 세로복도 지붕까지)
    roofRail(EX9 - 0.07, ez0 - 0.3, EX9 - 0.07, EZ9 - 0.07, FH + 0.3); }
  { // BACKYARD-14·20·21: 초록 지붕 북쪽 끝 = 흰 테(영상 d_088 — 초록 테가 안 보임) · 동면 골판 차양 + 기둥 · 차양 밑 도구 더미 · 옥상 초록 함·실외기
    dBox(endX + 0.4 - ex0, 0.4, 0.05, 0xeceae4, (ex0 + endX + 0.4)/2, FH - 0.05, ez0 - 0.425, { far: true });
    const cx9 = ex1 + 0.15, cz0 = ez0 + 0.1, cz1 = ez0 + 5.7;                                      // 차양 x ex1+0.15~+1.75
    dBox(1.6, 0.05, cz1 - cz0, 0xa9adb0, cx9 + 0.8, 2.65, (cz0 + cz1)/2);
    [cz0 + 0.15, cz1 - 0.15].forEach(z9 => { dRod(cx9 + 1.55, YARD, z9, cx9 + 1.55, 2.65, z9, 0.04, 0x8a9096); post(cx9 + 1.55, z9, YARD, 2.65, 0.06); });
    // 도구 더미(문 남쪽): 팔레트 3단·노란 판·손수레 · 라바콘 2(창 앞)
    for (let k = 0; k < 3; k++) dBox(1.0, 0.12, 0.85, 0x8a6a45, cx9 + 0.65, YARD + k * 0.13, cz0 + 4.85);
    dBox(0.05, 1.0, 0.8, 0xf2c230, cx9 + 0.3, YARD + 0.39, cz0 + 4.85);
    dBox(0.55, 0.3, 0.9, 0x5f6b72, cx9 + 0.8, YARD + 0.3, cz0 + 3.85); dCyl(0.18, 0.18, 0.08, 0x26282c, cx9 + 0.76, YARD + 0.12, cz0 + 4.25, { seg: 10, rot: [0, 0, Math.PI / 2] });
    colliders.push(noStand({ x0: cx9, x1: cx9 + 1.35, y0: YARD, y1: YARD + 1.4, z0: cz0 + 3.35, z1: cz0 + 5.35 }));
    [cz0 + 0.45, cz0 + 0.95].forEach(z9 => { dCyl(0.03, 0.17, 0.7, 0xe8532a, cx9 + 0.35, YARD + 0.03, z9, { seg: 10 }); dCyl(0.11, 0.13, 0.1, 0xf4f4f0, cx9 + 0.35, YARD + 0.35, z9, { seg: 10 });
      dBox(0.36, 0.03, 0.36, 0x333333, cx9 + 0.35, YARD, z9); });
    colliders.push(noStand({ x0: cx9, x1: cx9 + 0.6, y0: YARD, y1: YARD + 0.75, z0: cz0 + 0.2, z1: cz0 + 1.2 }));
    dBox(1.0, 1.2, 0.9, 0x3f7d4c, 43.5, FH + 0.3, ez0 + 3.5, { far: true }); dBox(1.06, 0.06, 0.96, 0x4f9160, 43.5, FH + 1.5, ez0 + 3.5, { far: true });   // 옥상 초록 함(영상 b_085·d_088)
    [37.8, 39.0, 40.2].forEach(x9 => { dBox(0.9, 0.75, 0.35, 0xe8e8e6, x9, FH + 0.3, ez0 + 0.75, { far: true }); dCyl(0.25, 0.25, 0.02, 0x9a9ea2, x9, FH + 0.68, ez0 + 0.56, { seg: 12, rot: [Math.PI / 2, 0, 0] }); });   // 실외기
  }

  // ================= 체육관 (위성 29.5 × 25.5 본실 + 동쪽 부속동 · 바닥 GYF = 대지 + 3단) =================
  const G = SCHOOL.gym, gx = G.center[0], gz = G.center[1], GA = G.annex, GDZ = G.doorZ;
  const gx0 = gx-G.width/2, gx1 = gx+G.width/2, gz0 = gz-G.depth/2, gz1 = gz+G.depth/2;
  const GH = G.wallHeight, GB = 0xa4674f;                     // 벽돌 = 갈색 도는 적벽돌(영상 g_087~094 — 예전 0xa8503a는 너무 빨갰다)
  const GWU = 0x9ea4aa, GBZ = -24.85, GUP = 1.3;               // 윗벽 = 차가운 청회색 세로 골판(영상 g_060~072·f_252) · 붉은 북쪽 날개|본실 경계(위성 A) · 본실 지붕 단 높이
  const GCZ0 = GDZ - 3.15, GCZ1 = GDZ + 3.15, GTZ = GCZ1 + 2.2; // 부속동 전실(유리 파사드 뒤)·남 화장실|창고 벽 z
  const GBW = [gx0 + 6.5, gx0 + 8.5, gx - 1, gx + 1, gx1 - 8.5, gx1 - 6.5];   // 남면 창 자리(2개씩 3쌍 — 영상 g_066·g_072: 윗벽 가로창 쌍 바로 아래 벽돌 띠에 흰 틀 창)
  foundation(gx0 - 0.15, gx1 + 0.15, gz0 - 0.15, gz1 + 0.15, GYF);
  foundation(gx1 + 0.15, GA.x[1] + 0.15, GA.z[0] - 0.15, GA.z[1] + 0.15, GYF);
  // 본실 벽: 아래 적벽돌(3.2 · 남면 흰 틀 창 6) + 위 청회색 골판·고측창. 동벽은 부속동과 공유(안쪽 문 = 전실 · 창고 문)
  wallX(gx0 - 0.15, gx1 + 0.15, gz0, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickG', face: -1 });
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickG', face: 1, gaps: GBW.map(c => ({ c, w: 1.2, sill: 1.0, dh: 2.3, win: true, frame: 0xf2f0ea, noLedge: true })) });
  wallZ(gz0, gz1, gx0, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickG', face: -1 });
  wallZ(gz0, gz1, gx1, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickG', face: 1, gaps: [{ c: GDZ, w: 2.2, door: true }, { c: GTZ + 1.6, w: 2.2, door: true }] });
  wallX(gx0 - 0.15, gx1 + 0.15, gz0, GWU, { y0: GYF + 3.2, h: GH - 3.2, wins: 8, sill: 2.2, wh: 1.4, frame: 0x9aa0a6 });
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, GWU, { y0: GYF + 3.2, h: GH - 3.2, gaps: GBW.map(c => ({ c, w: 1.6, sill: 2.3, dh: 3.0, win: true, frame: 0xf2f2f0 })) });
  wallZ(gz0, gz1, gx0, GWU, { y0: GYF + 3.2, h: GH - 3.2 });
  wallZ(gz0, gz1, gx1, GWU, { y0: GYF + 3.2, h: GH - 3.2 });
  floorQ('gymw', gx0 + 0.15, gx1 - 0.15, gz0 + 0.15, gz1 - 0.15, GYF);
  {   // 겉모습·코트(DETAIL-7): 상부 청회색 세로 골판(창 자리는 위아래로 끊음)·크림 띠 / 코트 선·가운데 원·농구 링
    const RIB = 0x8e949b, TRIM = 0xe9dfc4, Y3 = GYF + 3.2, TOP = GYF + GH - 0.05, TOPU = GYF + GH + GUP - 0.05;
    // 창 있는 면(wz = 창 가운데 목록): 창 폭 안의 골은 창 아래·위만. 북면은 고측창 띠(2.2~3.6)를 통째로 비운다. 본실 단(GBZ 남쪽)은 지붕 단 윗끝까지
    const ribs = (ax, a0, a1, line, f, wz = null, band = false) => { for (let a = a0 + 0.5; a < a1 - 0.4; a += 0.8) {
      const top = (ax === 'x' ? line > GBZ : a > GBZ + 0.1) ? TOPU : TOP, hit = wz && wz.some(c => Math.abs(a - c) < 0.87);
      const segs = band ? [[Y3 + 0.15, Y3 + 2.05], [Y3 + 3.75, top]] : hit ? [[Y3 + 0.15, Y3 + 2.25], [Y3 + 3.05, top]] : [[Y3 + 0.15, top]];
      segs.forEach(([y0, y1]) => { if (ax === 'x') dBox(0.1, y1 - y0, 0.04, RIB, a, y0, line + f*0.17); else dBox(0.04, y1 - y0, 0.1, RIB, line + f*0.17, y0, a); }); } };
    ribs('x', gx0, gx1, gz0, -1, null, true); ribs('x', gx0, gx1, gz1, 1, GBW); ribs('z', gz0, gz1, gx0, -1); ribs('z', gz0, GA.z[0] - 0.3, gx1, 1); ribs('z', GA.z[1] + 0.3, gz1, gx1, 1);
    for (let a = gx0 + 0.5; a < gx1 - 0.4; a += 0.8) dBox(0.1, GUP - 0.45, 0.04, RIB, a, GYF + GH + 0.4, GBZ - 0.02);   // 본실 단 북면(붉은 지붕 위로 드러난 골판 — 위성 A: 경계 z -24.85에 회색 면)
    dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz0 - 0.2); dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz1 + 0.2);
    dBox(0.1, 0.15, G.depth + 0.2, TRIM, gx0 - 0.2, Y3 - 0.1, gz);
    GBW.forEach(c => { dBox(1.4, 0.1, 0.1, TRIM, c, GYF + 2.3, gz1 + 0.2); dBox(1.4, 0.06, 0.12, TRIM, c, GYF + 0.94, gz1 + 0.21); });   // 벽돌 띠 창 크림 인방·창턱(영상 g_066)
    {   // 동남 모서리 원형 안전망 쇠사다리(영상 g_069~090: 부속동 남쪽에 드러난 본실 동벽 — 부속동 지붕 높이부터 지붕 위까지)
      const lx = gx1 + 0.62, lz = (GA.z[1] + gz1) / 2 + 0.2, L0 = GYF + 2.6, L1 = GYF + GH + GUP + 0.9, S9 = 0x9aa0a6;
      [-0.22, 0.22].forEach(o => { dRod(lx, L0, lz + o, lx, L1, lz + o, 0.03, S9, { far: true }); dRod(gx1 + 0.16, L0 + 0.3, lz + o, lx, L0 + 0.3, lz + o, 0.025, S9); dRod(gx1 + 0.16, L1 - 0.6, lz + o, lx, L1 - 0.6, lz + o, 0.025, S9); });
      for (let y = L0 + 0.3; y < L1 - 0.1; y += 0.3) dRod(lx, y, lz - 0.22, lx, y, lz + 0.22, 0.015, S9);
      const hoop = new THREE.TorusGeometry(0.38, 0.022, 4, 10, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2);   // 반원 고리(동쪽으로 볼록 — 처마 0.5 밖이라 지붕을 뚫지 않는다)
      for (let y = L0 + 2.0; y < L1; y += 0.8) dGeo(hoop, new THREE.Matrix4().makeTranslation(lx, y, lz), S9, { far: true });
      [-0.3, -0.1, 0.1, 0.3].forEach(o => { const r = Math.sqrt(Math.max(0, 0.38 * 0.38 - o * o)); dRod(lx + r, L0 + 2.0, lz + o, lx + r, L1 - 0.2, lz + o, 0.012, S9); });
    }
    const LN = 0xf5f1e6, cw9 = gx1 - 1.2 - (gx0 + 1.2), cc9 = gx, ch9 = gz1 - 1.2 - (gz0 + 5.0), cz9 = (gz0 + 5.0 + gz1 - 1.2) / 2;
    addPanel(cw9, 0.08, LN, cc9, GYF + 0.022, cz9 - ch9/2); addPanel(cw9, 0.08, LN, cc9, GYF + 0.022, cz9 + ch9/2);
    addPanel(0.08, ch9 - 0.08, LN, gx0 + 1.24, GYF + 0.022, cz9); addPanel(0.08, ch9 - 0.08, LN, gx1 - 1.24, GYF + 0.022, cz9);
    addPanel(0.08, ch9 - 0.08, LN, cc9, GYF + 0.022, cz9);
    const ring9 = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.83, 40), new THREE.MeshLambertMaterial({ color: LN }));
    ring9.rotation.x = -Math.PI/2; ring9.position.set(cc9, GYF + 0.023, cz9); ring9.matrixAutoUpdate = false; ring9.updateMatrix(); scene.add(ring9);
    [[gx0 + 0.6, 1], [gx1 - 0.6, -1]].forEach(([bx9, dir]) => {                    // 농구 링(서·동 벽 앞)
      const rx = bx9 + dir * 0.45;
      addBox(0.3, 1.1, 1.9, 0xffffff, bx9, GYF + 2.4, cz9, { collide: false });
      dGeo(new THREE.TorusGeometry(0.23, 0.02, 5, 14).rotateX(Math.PI/2), new THREE.Matrix4().makeTranslation(rx, GYF + 3.05, cz9), 0xe8752a);
      dRod(bx9 + dir*0.15, GYF + 3.05, cz9, rx - dir*0.23, GYF + 3.05, cz9, 0.025, 0xe8752a);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; dRod(rx + Math.cos(a)*0.23, GYF + 3.05, cz9 + Math.sin(a)*0.23, rx + Math.cos(a)*0.14, GYF + 2.65, cz9 + Math.sin(a)*0.14, 0.008, 0xf2f2f2); }
      dBox(0.03, 0.45, 0.6, 0xd94848, bx9 + dir*0.165, GYF + 2.75, cz9);
    });
  }
  {   // 북쪽 띠(위성 붉은 지붕 3.6m): 무대(가운데) + 방송실(서)·체육 준비실(동)
    const NZ = gz0 + 3.6, SX0 = gx0 + 5, SX1 = gx1 - 5;
    addBox(SX1 - SX0 - 0.3, 0.9, NZ - gz0 - 0.15, 0xb5793f, (SX0 + SX1)/2, GYF, (gz0 + 0.15 + NZ)/2);   // 무대(양옆 방 벽 면에 맞댐)
    [SX0 + 1.4, SX1 - 1.4].forEach(x9 => { addBox(1.6, 0.3, 0.3, 0xa96f3b, x9, GYF, NZ + 0.45); addBox(1.6, 0.6, 0.3, 0xa96f3b, x9, GYF, NZ + 0.15); });   // 무대 오르는 2단
    dBox(SX1 - SX0 - 0.4, 2.2, 0.12, 0x8a2e3a, (SX0 + SX1)/2, GYF + 0.9, gz0 + 0.25);   // 무대 뒤 막
    wallZ(gz0, NZ, SX0, INNER, { y0: GYF, h: 3.2 });
    wallX(gx0 + 0.15, SX0 + 0.15, NZ, INNER, { y0: GYF, h: 3.2, gaps: [{ c: (gx0 + SX0)/2, w: 1.2 }] });
    wallZ(gz0, NZ, SX1, INNER, { y0: GYF, h: 3.2 });
    wallX(SX1 - 0.15, gx1 - 0.15, NZ, INNER, { y0: GYF, h: 3.2, gaps: [{ c: (SX1 + gx1)/2, w: 1.2 }] });
    addBox(2.4, 0.75, 0.6, 0x8a5a3b, (gx0 + SX0)/2, GYF, gz0 + 1.2, NS);                     // 방송 콘솔
    addBox(1.6, 1.9, 0.5, 0x9aa0a6, (SX1 + gx1)/2, GYF, gz0 + 0.6);                        // 준비실 선반
    sign('방송실', (gx0 + SX0)/2, GYF + 2.4, NZ + 0.25, 0, 0.3);
    sign('준비실', (SX1 + gx1)/2, GYF + 2.4, NZ + 0.25, 0, 0.3);
    zones.push({ x0: gx0, x1: SX0, z0: gz0, z1: NZ, y: GYF, label: '체육관 방송실' });
    zones.push({ x0: SX1, x1: gx1, z0: gz0, z1: NZ, y: GYF, label: '체육관 준비실' });
    zones.push({ x0: SX0, x1: SX1, z0: gz0, z1: NZ, y: GYF + 0.9, label: '체육관 무대' });
    ceil(gx0, SX0, gz0, NZ, GYF + 3.2 + 0.15, 'ctile'); ceil(SX1, gx1, gz0, NZ, GYF + 3.2 + 0.15, 'ctile');
  }
  {   // 부속동(전실·화장실·체육 창고) — 현관 = 동벽 유리 파사드(영상 g_100~112: 북쪽 벽돌벽(작은 창 2) → 유리 양문 → 벽돌 기둥 → 유리 양문 + 옆 고정 유리)
    const [ax0, ax1] = GA.x, [az0, az1] = GA.z, AH = 4.4, CZ0 = GCZ0, CZ1 = GCZ1, TZ = GTZ;
    const DN = GDZ - 1.95, DS = GDZ + 0.55, SG = GDZ + 2.25;                               // 북 양문·남 양문·남 옆 고정 유리 가운데 z(사이 0.5 = 벽돌 기둥)
    const AWZ = [az0 + 1.5, az0 + 3.0, TZ + 1.2, TZ + 3.6, az1 - 1.1];                    // 동면 작은 네모창(영상 g_091~103: 현관 북쪽 2 · 창고 3 — 노랑 상자 틀)
    wallX(gx1 + 0.15, ax1 + 0.15, az0, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: -1, wins: 1, sill: 1.6, wh: 0.8 });
    wallX(gx1 + 0.15, ax1 + 0.15, az1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: 1, wins: 1, sill: 1.6, wh: 0.8 });
    wallZ(az0, az1, ax1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickG', face: 1, gaps: [
      { c: DN, w: 2.0, glass: true, door: true, slideOver: true }, { c: DS, w: 2.0, glass: true, door: true, slideOver: true },
      { c: SG, w: 1.4, sill: 0, dh: 2.6, win: true, frame: 0xc9cdd1, noLedge: true },
      ...AWZ.map(c => ({ c, w: 0.7, sill: 2.0, dh: 2.55, win: true, frame: 0xf2f0ea, noLedge: true }))] });
    [[DN, 2.0], [DS, 2.0]].forEach(([c, w]) => {                                 // 스테인리스 문틀(문짝 미끄럼 면 +0.04 밖으로는 안 나옴 — 영상 g_103.5·g_105)
      [-1, 1].forEach(sd => dBox(0.12, 2.6, 0.07, 0xc9cdd1, ax1 - 0.04, GYF, c + sd * (w/2 - 0.035)));
      dBox(0.12, 0.08, w - 0.14, 0xc9cdd1, ax1 - 0.04, GYF + 2.52, c); });
    AWZ.forEach(c => { const X = ax1 + 0.225;                                              // 노랑 상자 틀(윗판·날개·창턱 — 본관 창과 같은 모양)
      dBox(0.15, 0.08, 0.9, YEL, X, GYF + 2.55, c); dBox(0.15, 0.06, 0.9, YEL, X, GYF + 1.94, c);
      [-1, 1].forEach(sd => dBox(0.15, 0.53, 0.08, YEL, X, GYF + 2.0, c + sd * 0.41)); });
    wallX(gx1 + 0.15, ax1 - 0.15, CZ0, INNER, { y0: GYF, h: 3.2, gaps: [{ c: ax0 + 2.6, w: 1.0 }] });
    wallX(gx1 + 0.15, ax1 - 0.15, CZ1, INNER, { y0: GYF, h: 3.2, gaps: [{ c: ax0 + 2.6, w: 1.0 }] });
    wallX(gx1 + 0.15, ax1 - 0.15, TZ, INNER, { y0: GYF, h: 3.2 });
    floorQ('tileG', gx1 + 0.15, ax1 - 0.15, CZ0 + 0.15, CZ1 - 0.15, GYF);
    floorQ('ttile', gx1 + 0.15, ax1 - 0.15, az0 + 0.15, CZ0 - 0.15, GYF); floorQ('ttile', gx1 + 0.15, ax1 - 0.15, CZ1 + 0.15, TZ - 0.15, GYF);
    floorQ('tileW', gx1 + 0.15, ax1 - 0.15, TZ + 0.15, az1 - 0.15, GYF, 0xb9b6ae);
    [[az0 + 0.5, CZ0], [CZ1, TZ - 0.5]].forEach(([z9a, z9b]) => addBox(1.2, 1.1, 0.4, 0xdfe8ee, ax1 - 0.9, GYF, (z9a + z9b)/2, NS));
    sign('화장실', ax0 + 2.6, GYF + 2.2, CZ0 + 0.22, 0, 0.26); sign('화장실', ax0 + 2.6, GYF + 2.2, CZ1 - 0.22, 0, 0.26);
    [az1 - 1.2, az1 - 3.2].forEach(z9 => addBox(3.6, 1.6, 0.7, 0x8a9096, (gx1 + ax1)/2, GYF, z9));   // 체육 창고 선반
    addBox(ax1 - gx1 + 0.4, 0.3, az1 - az0 + 0.4, 0xe6e7e3, (gx1 + ax1 + 0.4)/2, GYF + AH, (az0 + az1)/2);   // 흰 지붕(위성)
    [-23, -19, -15, -11].forEach(z9 => { dBox(1.1, 0.8, 0.65, 0x8a8f92, gx1 + 2.0, GYF + AH + 0.3, z9, { far: true }); dCyl(0.28, 0.28, 0.03, 0x4a4e52, gx1 + 2.0, GYF + AH + 0.3 + 0.8, z9, { seg: 10 }); });   // 옥상 실외기(위성 A 짙은 덩어리·영상 g_087~090)
    ceil(gx1, ax1, az0, az1, GYF + 3.2 + 0.15, 'ctile');
    zones.push({ x0: gx1, x1: ax1, z0: CZ0, z1: CZ1, y: GYF, label: '체육관 전실' });
    zones.push({ x0: gx1, x1: ax1, z0: TZ, z1: az1, y: GYF, label: '체육 창고' });
    // 현관 밖(영상 g_100~112): 참(GYF) + 동쪽 3단 · 북쪽 끝 크림 낮은 벽 + 스테인리스 손잡이 · 남쪽 끝에서 경사로(크림 낮은 벽)
    //   붉은 독립 기둥은 없다(차양 = 기둥 없는 캔틸레버, 부속동 동벽 전체 길이 — 위성 A 크림 띠 z -28~-7)
    const LX1 = ax1 + 2.0, LZ0 = CZ0 - 0.4, LZ1 = CZ1 + 0.2, LW = 0.2;                   // 참 동쪽 끝·북/남 끝, 북쪽 낮은 벽 두께
    addBox(LX1 - ax1 - 0.15, GYF - YARD, LZ1 - LZ0 - LW, STONE, (ax1 + 0.15 + LX1)/2, YARD, (LZ0 + LW + LZ1)/2);
    addBox(0.35, GYF - 0.15 - YARD, LZ1 - LZ0 - LW, STONE, LX1 + 0.175, YARD, (LZ0 + LW + LZ1)/2);
    addBox(0.35, GYF - 0.3 - YARD, LZ1 - LZ0 - LW, STONE, LX1 + 0.525, YARD, (LZ0 + LW + LZ1)/2);
    addBox(LX1 + 0.7 - ax1 - 0.15, 1.05 + GYF - YARD, LW, 0xefe3b8, (ax1 + 0.15 + LX1 + 0.7)/2, YARD, LZ0 + LW/2, NS);   // 북쪽 끝 크림 낮은 벽(영상 g_111·g_112.5)
    dRod(ax1 + 0.3, GYF + 0.85, LZ0 + LW + 0.07, LX1, GYF + 0.85, LZ0 + LW + 0.07, 0.025, 0xc9cdd1);                         // 스테인리스 손잡이(참 → 계단 따라 내려감)
    dRod(LX1, GYF + 0.85, LZ0 + LW + 0.07, LX1 + 0.7, YARD + 0.85, LZ0 + LW + 0.07, 0.025, 0xc9cdd1);
    patQuad('gmat', ax1 + 0.35, ax1 + 1.95, SG - 1.3, SG + 1.1, GYF + 0.012, false, 0xd8a8a4);   // 큰 붉은회색 매트(영상 g_103.5)
    patQuad('gmat', ax1 + 0.35, ax1 + 1.15, DN - 0.6, DN + 0.6, GYF + 0.012);                      // 짙은 회색 매트(북 양문 앞)
    patQuad('tactZ', LX1 - 0.34, LX1 - 0.04, LZ0 + LW + 0.1, SG - 1.4, GYF + 0.012);              // 점자 띠(계단 위 가장자리)
    patQuad('tactZ', LX1 + 0.78, LX1 + 1.08, LZ0 + LW + 0.1, LZ1, YARD + 0.022);                    // 노랑 점자 줄(현관 계단 옆 — 참 북끝~경사로 북끝까지만 · 영상 g_097.5~102. 그 남쪽 옆길은 맨 보도블록 — g_091.5~096)
    const EZ0 = az0 - 0.14, EZ1 = az1 + 0.14;                                                        // 차양: 동벽 전체(북·남 벽 바깥 면에서 1cm 안쪽)
    addBox(LX1 - ax1 + 0.05, 0.2, EZ1 - EZ0, 0xf1ead8, (ax1 + 0.15 + LX1 + 0.2)/2, GYF + 2.95, (EZ0 + EZ1)/2);
    dBox(0.08, 0.28, EZ1 - EZ0 + 0.16, YEL, LX1 + 0.24, GYF + 2.91, (EZ0 + EZ1)/2, { far: true });
    sign('체육관', LX1 + 0.3, GYF + 3.35, GDZ, Math.PI/2, 0.5);
    sign('튼튼한 몸과 건강한 마음', ax1 + 0.25, GYF + 1.35, SG, Math.PI/2, 0.15);                   // 옆 고정 유리 파란 띠 글씨(영상 g_105) + 아래 초록 잔디 그림 띠
    dBox(0.03, 0.42, 1.3, 0x5cb85c, ax1 + 0.23, GYF + 0.02, SG);
    [TZ + 2.4, az1 - 0.3].forEach(z9 => dCyl(0.05, 0.05, AH - 0.2, 0xc5c9cc, ax1 + 0.24, GYF, z9, { seg: 6 }));   // 은색 선홈통(영상 g_093·g_094.5)
    const RZ0 = LZ1, RZ1 = RZ0 + 7.0;                                                                 // 경사로(영상 g_093~099 · 위성 A 크림 선 z -13.5~-8)
    slope('pave', 'z', ax1 + 0.15, ax1 + 1.45, RZ0, RZ1, GYF, YARD, 10, 0xd8d4cc);
    addBox(0.2, 0.9 + GYF - YARD, RZ1 - RZ0, 0xefe3b8, ax1 + 1.55, YARD, (RZ0 + RZ1)/2, NS);
    dRod(ax1 + 1.4, GYF + 0.85, RZ0, ax1 + 1.4, YARD + 0.85, RZ1, 0.025, 0xc9cdd1);                  // 손잡이 두 줄(낮은 벽 안쪽 · 건물 벽 쪽 — 영상 g_094.5)
    dRod(ax1 + 0.34, GYF + 0.85, RZ0, ax1 + 0.34, YARD + 0.85, RZ1, 0.025, 0xc9cdd1);
    zones.push({ x0: ax1, x1: LX1 + 0.7, z0: LZ0, z1: LZ1, y: GYF, label: '체육관 현관' });
  }
  // 지붕(위성 A: 붉은 북쪽 날개 z ~-24.85 = 벽 높이 · 본실 = 한 단(GUP) 높은 회색 판 한 장 — 위성 붉은 띠 남쪽 2.6 m 어두운 띠 = 본실 그림자, 용마루 음영 없음)
  //   날개 판 윗면과 본실 단 북면은 맞대기만. 본실 판 옆면은 짙은 회색 갓(영상 g_066·f_252: 반듯한 짙은 회색 윤곽), 윗면은 밝은 회색 판
  { const gd = gz1 + 0.5 - GBZ, gzc = (GBZ + gz1 + 0.5) / 2;
    addBox(G.width + 1, 0.4, GBZ - gz0 + 0.5, 0xb8886c, gx, GYF + GH, (gz0 - 0.5 + GBZ) / 2);      // 붉은 날개(위성 흐린 테라코타 — 예전 0xc35233은 선명한 주황)
    addBox(G.width + 0.3, GUP, gz1 + 0.15 - GBZ, GWU, gx, GYF + GH, (GBZ + gz1 + 0.15) / 2);        // 본실 단(골판 면)
    addBox(G.width + 1, 0.4, gd, 0x62686e, gx, GYF + GH + GUP, gzc);                               // 본실 지붕 판(짙은 회색 갓)
    dBox(G.width + 0.88, 0.04, gd - 0.12, 0xc3c6c4, gx, GYF + GH + GUP + 0.4, gzc, { far: true }); }
  zones.push({ x0: gx0, x1: gx1, z0: gz0 + 3.6, z1: gz1, y: GYF, label: '체육관' });
  // 비상구 유도등(바깥으로 나가는 문 위 인방 · 문 높이 2.6 위): 현관 자동문(홀 쪽)·측문·계단홀 뒷문·로비 마당 문·급식실 뒷문·체육관 전실 문·부속동 현관
  exitSign(hc, EZI - 0.15, 2.74, [0, -1]);
  exitSign(wx0 + 0.15, SIDE_Z, 2.74, [1, 0]);
  exitSign(wx1 - 0.15, -37.9, 2.74, [-1, 0]);
  exitSign(CL.x[1] - 0.15, CL.z[1] - 1.425, 2.74, [-1, 0]);   // 로비 자동문(책상 동끝 옆 — hall_lobby-3) 위
  exitSign(K.backDoorC, kz0 + 0.15, 2.74, [0, 1]);
  exitSign(gx1 - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  exitSign(GA.x[1] - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  ceil(gx0, gx1, gz0, gz1, GYF + GH, 'ctile');

  // ================= 앞뜰 (영상 f_132~186·p_146~163 · 위성): 건물 → 콘크리트 턱 → 북 화단(둥근 회양목) → 산책로(점자블록) → 남 화단(전정 소나무) → 잔디 둔덕 =================
  const FY = SCHOOL.frontYard, PR = SCHOOL.porch, EP = SCHOOL.eastPath, fzW = fz1 + 0.15;
  const WX0 = -38.5, WX1 = 53.5;                                              // 앞뜰 구역 칸 동서 끝(서 = 체육관 앞 아스팔트 마당 구역과 이음, 동 = 본관 동쪽 뒤뜰 길)
  const WS = -35.5;                                                            // FRONT-3: 산책로 서끝(영상 g_115~g_121 확대 · 네이버 보정 -35) — 그 서쪽은 아스팔트 마당
  // 큰 구름 소나무(FRONT-3 · 영상 g_124~f_144: 굵게 비틀린 줄기 + 두툼한 구름 덩어리 — 예전 얇은 원판 우산) — 이 블록 지역 도우미
  //   FRONT-3b(영상 f_135·g_130·f_276·f_279·u_280 운동장에서 본 실루엣): 줄기가 2 m 안팎에서 가지로 갈라져 잎판이 옆으로 넓게 퍼진 '폭 > 키' 둥근 지붕
  //   (1차는 잎판을 위로 쌓아 운동장에서 보면 키 7 m 기둥·물음표 모양이었다). n = 아래 단 잎판 수(둘레로 퍼짐), sp = 옆 퍼짐 배율
  //   잎판 밑면 ≥ 발 +1.54 s · 가지 ≥ 발 +1.7 s(몸 높이 1.5 위 — 뚫림 0)
  const cloudPine = (x, z, s, n = 4, sp = 1) => {
    const y = YARD, R9 = seeded(Math.floor(Math.abs(x * 131 + z * 71)) + 5), F9 = { far: true };
    colliders.push({ x0: x - 0.22 * s, x1: x + 0.22 * s, y0: y, y1: y + 12, z0: z - 0.22 * s, z1: z + 0.22 * s });   // 줄기(반지름 0.2s)보다 조금만 크게 — 모서리가 줄기에서 0.36 넘게 멀면 '보이지 않는 벽'
    let px = x, py = y, pz = z, a = R9() * 6.28;
    [[1.25, 0.07], [0.7, 0.32]].forEach(([L9, t], k) => { const L = L9 * s;
      dCyl(0.15 * s * (1 - k * 0.25), 0.2 * s * (1 - k * 0.25), L, 0x5a4636, px, py, pz, { far: true, seg: 7, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] });
      px += Math.sin(t) * Math.cos(a) * L; py += Math.cos(t) * L; pz += Math.sin(t) * Math.sin(a) * L; a += 2.0 + R9() * 1.0; });
    const PG = [0x719a52, 0x7aa45a, 0x6c944e], a0 = R9() * 6.28, pads = [];          // pads = [방위, 거리, 높이, 반지름](× s) · 색: 밑면(갈색 땅빛에 물듦)이 영상 f_135·f_144 잎 밑(≈ 55,62,40)에 가깝게 밝힘(예전 0x3f6f3c는 거의 검정 8,25,6)
    for (let k = 0; k < n; k++) pads.push([a0 + k * 6.28 / n + (R9() - 0.5) * 0.7, (1.1 + R9() * 0.3) * sp, 2.0 + R9() * 0.2, 0.82 + R9() * 0.12]);   // 아래 단(둘레로 넓게)
    for (let k = 0; k < 2; k++) pads.push([a0 + 0.8 + k * 3.14 + (R9() - 0.5) * 0.5, 0.55 * sp, 2.75 + R9() * 0.15, 0.78]);                                        // 가운데 단
    pads.push([a0, 0.1, 3.35, 0.7]);                                                                                                                                 // 꼭대기
    pads.forEach(([ang, d, h, r], k) => { const cx = x + Math.cos(ang) * d * s, cz = z + Math.sin(ang) * d * s, cy = y + h * s, rr = r * s;
      if (k < Math.min(n, 3)) dRod(px, py, pz, cx, cy - rr * 0.3, cz, 0.065 * s, 0x5a4636, F9);    // 가지(줄기 끝 → 아래 단 잎판 밑 — 잎판 사이로 보이는 짙은 가지, f_135·f_144)
      const top9 = k === pads.length - 1;
      dBlob(rr * 1.15, rr * 0.56, rr, top9 ? 0x4c7641 : PG[k % 3], cx, cy, cz, { far: true, chunky: k >= n, ry: ang, jitter: 0.12 });   // 가운데·꼭대기는 20면(삼각형 예산 — 1차와 같은 양) · 꼭대기는 덮개 없이 짙은 색
      if (!top9) dBlob(rr * 1.08, rr * 0.36, rr * 0.94, 0x4a7440, cx, cy + rr * 0.2, cz, { far: true, chunky: true, ry: ang + 1, jitter: 0.12 }); });   // 짙은 윗면 덮개(해 받는 윗면이 회양목보다 짙게 — 위성 D·f_279 짙은 수관 · 밝힌 밑면과 대비를 줄임 · 꼭대기는 생략 — 삼각형 예산)
  };
  // 북 화단 옆으로 퍼진 소나무(FRONT-3b · 영상 f_138·f_144·g_121: 옆으로 누운 굽은 줄기 둘 + 층진 두툼한 잎판 세 단 · 밝은 황록 ≈(105,111,66))
  //   공용 spreadPine은 얇은 원판이 위로 쌓여 밑면이 검게 보였다 → 이 블록 지역 도우미. 몸 높이(발 +1.3) 아래 잎판은 올라서기 금지 덩어리(x ±2.2) 안에만, 벽 창 상자·산책로 위로는 안 나감
  const layerPine = (x, z, s) => {
    const y = YARD, R = seeded(Math.floor(Math.abs(x * 97 + z * 53)) + 11), ax = R() < 0.5 ? 0 : Math.PI;
    const zW = fzW + 0.62, zS = FY.walkN - 0.12, PL = [0x8ca45a, 0x96ad62, 0x869c54];
    colliders.push({ x0: x - 0.2 * s, x1: x + 0.2 * s, y0: y, y1: y + 12, z0: z - 0.2 * s, z1: z + 0.2 * s });
    colliders.push(noStand({ x0: x - 2.2, x1: x + 2.2, y0: y, y1: y + 1.0, z0: fzW + 0.25, z1: FY.strip + 1.75 }));
    [0, 1].forEach(k => { const a = ax + k * Math.PI + (R() - 0.5) * 0.6, t = 0.5 + R() * 0.2; dCyl(0.08 * s, 0.13 * s, 1.5 * s, 0x6a4a36, x, y, z, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }); });
    const pad = (cx, h, cz, r, k) => { const zc = Math.min(Math.max(cz, zW + 0.85 * r), zS - 0.85 * r);
      dBlob(r * 1.25, r * 0.42, r * 0.85, PL[k % 3], cx, y + h, zc, { far: true, ry: (R() - 0.5) * 0.4, jitter: 0.12 });
      dBlob(r * 0.9, r * 0.2, r * 0.62, 0x7f9f55, cx, y + h + r * 0.3, zc, { far: true, chunky: true, ry: R(), jitter: 0.12 }); };   // 윗면(위에서 보면 너무 희던 것 — 위성 D 짙은 수관)
    [-1, 1].forEach((sg, k) => pad(x + sg * (0.5 + R() * 0.2) * s, 1.0 * s, z - 0.25, 0.9 * s, k));                       // 아래 단(몸 높이 — 덩어리 안)
    [-1, 1].forEach((sg, k) => { const a = ax + (sg > 0 ? 0 : Math.PI) + (R() - 0.5) * 1.4, d = (0.9 + R() * 0.5) * s;   // 가운데 단(밑면 ≥ 발 +1.4 — 옆으로 넓게)
      pad(x + Math.cos(a) * d, 1.7 * s, z + Math.sin(a) * d, 0.8 * s, k + 1); });
    { const a = R() * 6.28, d = (0.3 + R() * 0.3) * s; pad(x + Math.cos(a) * d, 2.25 * s, z + Math.sin(a) * d, 0.7 * s, 2); }   // 꼭대기
  };
  {
    const N0 = FY.walkN, S0 = FY.walkS, C = 0.12, TX = (N0 + S0) / 2, AY = YARD + 0.012;
    // FRONT-3 도우미(이 블록 안): 세모·비스듬한 경계석
    const tri9 = (kind, A, B9, C9, tint = 0xffffff) => { const S9 = PATDEF[kind][0], P9 = [A, B9, C9, C9].map(([x, z]) => [x, AY, z]); patPush(kind, P9, P9.map(q => [q[0] / S9, -q[2] / S9]), [0, 1, 0], tint); };
    const quad9 = (kind, A, B9, C9, D9, tint = 0xffffff) => { const S9 = PATDEF[kind][0], P9 = [A, B9, C9, D9].map(([x, z]) => [x, AY, z]); patPush(kind, P9, P9.map(q => [q[0] / S9, -q[2] / S9]), [0, 1, 0], tint); };
    const curb9 = (x0, z0, x1, z1) => { const L9 = Math.hypot(x1 - x0, z1 - z0); if (L9 < 0.03) return;
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, YARD + 0.04, (z0 + z1) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.atan2(z1 - z0, x1 - x0), 0)), new THREE.Vector3(L9 + 0.1, 0.08, C)), 0xa9a59c, { far: true }); };
    // 서끝(영상 g_114~g_121): 본관 서쪽 첫 칸 앞 = 짙은 아스팔트 마당 · 북 화단은 벽에서 곧게(x NBX) 나와 사분원(반지름 RN)으로 산책로 서끝에 닿음
    //   · 산책로 끝 = 노랑 점자 한 줄 · 남 화단은 산책로 모서리에서 둥글게 꺾여 남서쪽(운동장 가)으로 — 조명탑·큰 적송은 그 안(운동장 북서 모서리 블록)
    const NBX = -37.2, RN = 1.7, NCX = WS, NCZ = N0 - C - RN, CW = 0.25;       // CW = 벽 밑 밝은 콘크리트 턱(자갈 띠 대신 — f_171·f_174·f_180)
    const ARC = Array.from({ length: 7 }, (_, i) => { const t = Math.PI - (Math.PI / 2) * i / 6; return [NCX + RN * Math.cos(t), NCZ + RN * Math.sin(t)]; });   // (NBX, NCZ) → (WS, N0 - C)
    const SB = [[WS, S0 + C], [WS - 0.55, S0 + C + 0.13], [WS - 0.95, S0 + C + 0.43], [WS - 1.2, S0 + C + 0.88], [WS - 1.4, S0 + C + 1.48], [WS - 2.0, S0 + C + 2.68], [WS - 2.6, TERR_Z]];   // 남 화단 서끝(둥근 모서리 → 남서 사선)
    // 북 화단(현관 돌출부 자리 비움): 잔디 + 벽 밑 콘크리트 턱
    const GN = 0xe9cadb, GS = 0xdcb898;                                            // 잔디 틴트(영상 f_171 표본: 북 화단 (104,113,57) · 남 화단 긴 풀 (82,93,36) — 예전 틴트는 G가 25~35% 높았다)
    [[NBX, EN.x[0]], [EN.x[1], fx1 + 0.15]].forEach(([a, b]) => { addPanel(b - a, CW, 0xc4c1b8, (a + b) / 2, AY, fzW + CW / 2); patQuad('grass', a < WS ? WS : a, b, fzW + CW, N0 - C, AY, false, GN); });
    patQuad('grass', NBX, WS, fzW + CW, NCZ, AY, false, GN);
    for (let i = 0; i < 6; i++) tri9('grass', [NCX, NCZ], ARC[i], ARC[i + 1], GN);                           // 둥근 끝
    patQuad('grass', fx1 + 0.15, WX1 + 3, fz1 - 10, N0 - C, AY, false, 0xe9f2df);   // 본관 동쪽 끝 잔디(뒤뜰 길까지)
    // 서끝 아스팔트 마당(체육관 앞 마당 아스팔트 x -39.2/-38.5에서 이어 받음)
    patQuad('asph', -39.2, NBX, fzW, N0 - C, AY);
    for (let i = 0; i < 6; i++) tri9('asph', [NBX, N0 - C], ARC[i + 1], ARC[i]);
    patQuad('asph', WX0, WS, N0 - C, S0 + C, AY);
    for (let i = 0; i < SB.length - 1; i++) quad9('asph', [WX0, SB[i][1]], SB[i], SB[i + 1], [WX0, SB[i + 1][1]]);
    curb9(NBX, fzW, NBX, NCZ); for (let i = 0; i < 6; i++) curb9(...ARC[i], ...ARC[i + 1]);                 // 북 화단 둥근 경계석
    for (let i = 0; i < SB.length - 1; i++) curb9(...SB[i], ...SB[i + 1]);                                   // 남 화단 둥근 경계석
    addBox(1.0, 0.15, 0.8, 0xbdb8ad, WS - 1.85, YARD, S0 + C + 1.15);                                            // 남 화단 모서리 밖 작은 콘크리트 턱(g_120)
    // 산책로: 경계석(북·남) + 보도블록(30cm 줄눈 — f_171·f_174 확대) + 가운데 노란 점자블록 + 서끝 가로 점자 한 줄. 현관 앞은 북 경계석을 끊는다
    PATDEF.paveF = [1.2, 256, false, (g, N, R) => bond(g, N, 64, 64, ['#dfbd7e', '#d8b577', '#e2c286', '#dbb97c'], '#b09360', 2, R, 0.5, [0.07, ['#a5a39e', '#8f9194', '#c07a60', '#d8d2c4']])];
    [[WS, EN.x[0]], [EN.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, N0 - C/2, { far: true }));
    [[WS, EP.x[0]], [EP.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, S0 + C/2, { far: true }));   // 남 경계석(동쪽 통학로 갈림목은 끊음)
    patQuad('paveF', WS + 0.3, WX1, N0, TX - 0.15, YARD + 0.02); patQuad('paveF', WS + 0.3, WX1, TX + 0.15, S0, YARD + 0.02);
    patQuad('tactX', WS + 0.3, WX1, TX - 0.15, TX + 0.15, YARD + 0.02); patQuad('tactX', WS, WS + 0.3, N0, S0, YARD + 0.02);
    // 남 화단(구령대 테라스 자리 비움) — 서끝은 둥근 경계석 안쪽
    [[WS, PR.x[0]], [PR.x[1], EP.x[0]], [EP.x[1], 60]].forEach(([a, b]) => patQuad('grass', a, b, S0 + C, TERR_Z, AY, false, GS));
    for (let i = 0; i < SB.length - 1; i++) quad9('grass', SB[i], [WS, SB[i][1]], [WS, SB[i + 1][1]], SB[i + 1], GS);
    // 정면·서쪽 끝 벽의 짙은 아랫단 띠 없앰(서쪽 끝 = 원무실 블록 서면 — 영상 g_112·g_114: 판벽이 밝은 콘크리트 턱까지)
    for (let i = plinths.length - 1; i >= 0; i--) { const p9 = plinths[i]; if (p9.ax === 'z' && Math.abs(p9.o - (fx0 - 0.17)) < 0.01 && p9.a1 > fz0) { if (p9.a0 >= fz0 - 0.01) plinths.splice(i, 1); else p9.a1 = fz0; } }   // 서관 몫(z < fz0)은 그대로
    // FRONT-2(영상 g_115~f_183·u_272 대조): 북 화단 = 넓적한 회양목 두 줄(엇갈려 닿게) + 옆으로 퍼진 소나무, 남 화단 = 산책로 가 회양목 한 줄 + 큰 구름 소나무 + 층층 공 향나무
    //   FRONT-3(f_165~f_180): 현관 동쪽 북 화단은 산책로 쪽 줄 대신 낮게 퍼진 향나무 몇 덩이 · 1학년·3학년 앞은 벽 쪽 회양목 몇 개만(잔디 — 파사드까지 걸어 들어감)
    const MC = [0x6a9444, 0x5f8a3e, 0x74a04c];                                        // 영상 회양목 = 노란 기 도는 연두
    const NP = [-34.5, -16.5, -4.0, 4.6];                                             // 북 화단 퍼진 소나무 자리(영상 g_121·f_141·f_147·f_150)
    const NT = [-24.3, -12.6];                                                        // 북 화단 작은 관상수(g_124·g_130 — 창 상자 앞 가는 줄기·둥근 수관)
    const open1 = x => x > 33 && x < 40.5 && ![34.5, 38.0].some(q => Math.abs(q - x) < 0.76);   // FRONT-3: 1학년 앞 건물 쪽 줄에서 비우는 자리(잔디로 걸어 들어감)
    for (let x9 = -36.35, k = 0; x9 < fx1 - 0.5; x9 += 1.5, k++) {
      if (x9 > EN.x[0] - 1.0 && x9 < EN.x[1] + 1.0) continue;
      const nearP = NP.some(px => Math.abs(px - x9) < 1.6) || NT.some(px => Math.abs(px - x9) < 1.0), east = x9 > EN.x[1];
      if (!nearP && !open1(x9)) mound(x9, FY.strip + 0.85, 1.9 + (k % 3) * 0.22, 1.0 + (k % 2) * 0.18, 1.4, MC[k % 3], false, open1(x9 - 1.5) || open1(x9 + 1.5) ? 0 : null);   // 건물 쪽 줄(FRONT-3: 조금 더 크게 — g_130·f_132 큰 둥근 회양목 · 위성 D 수관) · 빈 자리 옆 덩어리는 돌리지 않음(옆면 = 잎)
      if (x9 + 0.75 > -35.2 && !(east && x9 < 40.5)) mound(x9 + 0.75, N0 - 0.85, 1.55 + ((k + 1) % 3) * 0.2, 0.8 + ((k + 1) % 2) * 0.12, 1.25, MC[(k + 1) % 3]);   // 산책로 쪽 줄
    }
    NP.forEach((x9, k) => layerPine(x9, FY.strip + 0.9, 1.05 + (k % 2) * 0.15));     // FRONT-3b: 층진 두툼한 잎판(낮은 잎판 밑은 layerPine 안 올라서기 금지 덩어리 — 몸이 잎판을 뚫지 않게)
    [[17.6, -20.5, 2.9], [22.2, -20.45, 2.4], [27.0, -20.55, 2.7], [36.0, -21.0, 2.6]].forEach(([x9, z9, w9], k) => {   // 낮게 퍼진 향나무(f_165·f_171 왼쪽 앞)
      dBlob(w9 / 2, 0.5, 0.7, [0x5d8a45, 0x557f3f][k % 2], x9, YARD + 0.18, z9, { far: true, ry: k * 0.3, jitter: 0.12 });
      dBlob(w9 * 0.36, 0.2, 0.5, 0x7aa65a, x9 + 0.1, YARD + 0.52, z9, { far: true, chunky: true, ry: k, jitter: 0.12 });
      ellipseCols(x9, z9, w9 / 2, 0.7, k * 0.3, YARD, YARD + 0.65, 0.9); ellipseCols(x9 + 0.1, z9, w9 * 0.36, 0.5, k, YARD, YARD + 0.65, 0.86); });   // [quality4 09-26] 축정렬 상자 → 돌린 두 잎 덩어리 띠((36,-21) 보이지 않는 벽 2·ghost·발 묻힘)
    NT.forEach(x9 => { const z9 = FY.strip + 0.1;                                    // 작은 관상수(가는 줄기 · 둥근 수관 — 키 2.6)
      post(x9, z9, YARD, YARD + 2.6, 0.08); dCyl(0.045, 0.06, 1.7, 0x6b5240, x9, YARD, z9, { far: true, seg: 6 });
      dBlob(0.62, 0.55, 0.6, 0x4f8a3c, x9, YARD + 2.05, z9, { far: true, jitter: 0.14 }); dBlob(0.4, 0.32, 0.38, 0x6aa04c, x9 + 0.15, YARD + 2.4, z9 - 0.05, { far: true, chunky: true }); });
    // 남 화단: 산책로 가 회양목 줄(구령대·교훈석·동쪽 통학로 갈림목·큰 소나무·태양광 등 자리는 비움) — 구령대 동쪽은 드문드문 몇 덩이(f_171·f_174: 긴 풀 + 토피어리)
    const CP = [[-29.0, -16.0, 1.3], [-13.2, -15.9, 1.6], [-8.6, -16.2, 1.25], [-1.2, -15.8, 1.35]];   // FRONT-3b: 교장실 앞 소나무는 키 ≈5 m(f_144: 태양광 등 머리와 비슷한 높이) → 1.35   // 큰 구름 소나무(g_124·g_130·f_132·f_138·f_144 · 위성 D 산책로 바로 남쪽 수관)
    const SKIP = [[PR.x[0] - 3.0, PR.x[1] + 3.6], [EP.x[0] - 1.0, EP.x[1] + 1.0], ...CP.map(([x9]) => [x9 - 1.3, x9 + 1.3]), [-18.6, -16.4]];
    for (let x9 = WS + 0.9, k = 0; x9 < 52; x9 += 1.6, k++) {
      if (SKIP.some(([a, b]) => x9 > a && x9 < b) || (x9 > PR.x[1] + 3.6 && x9 < EP.x[0] - 1.0)) continue;
      if (x9 < PR.x[0] - 3.0 && k % 4 === 2) { const w9 = 2.1, d9 = 0.95, z9 = S0 + C + 0.75;   // 윗면 평평한 생울타리(g_124·g_127·f_141 — 둥근 덩어리 사이에 섞임)
        dBlob(w9 * 0.53, 0.46, d9 * 0.55, 0x648f43, x9, YARD + 0.34, z9, { far: true, jitter: 0.1 }); dBlob(w9 * 0.47, 0.07, d9 * 0.47, 0x7aa655, x9, YARD + 0.78, z9, { far: true, ry: 0.02, jitter: 0.08 });
        colliders.push(noStand({ x0: x9 - w9 / 2, x1: x9 + w9 / 2, y0: YARD, y1: YARD + 0.84, z0: z9 - d9 / 2, z1: z9 + d9 / 2 })); continue; }
      mound(x9, S0 + C + 0.75, 1.5 + (k % 3) * 0.15, 0.75 + (k % 2) * 0.12, 1.2, MC[(k + 2) % 3]);
    }
    [[27.0, -16.3], [32.6, -16.4], [36.6, -16.1]].forEach(([x9, z9], k) => mound(x9, z9, 1.6, 0.9, 1.25, MC[k % 3]));   // 구령대 동쪽 드문 덩어리
    CP.forEach(([x9, z9, s9]) => cloudPine(x9, z9, s9));
    cloudPine(37.0, S0 + 2.2, 1.35); prunedPine(44.5, S0 + 3.0, 1.6);                   // 동쪽 전정 소나무(f_174·f_180·u_272 오른쪽 — 44.5는 동쪽 통학로 갈림목 쪽)
    // 구령대 동쪽 줄(영상 u_272 왼→오: 교가비·태양광 등·향나무·탑시계·향나무·정원등·향나무·가로등·소나무) + 교훈석 서쪽 향나무(f_147)
    //   FRONT-3: 1학년 앞 층층 향나무는 키 4.5m 안팎·산책로 바로 옆(f_171·f_174·f_273) · 검은 정원등은 더 동쪽·더 큼(흰 반투명 등통 + 흰 머리 + 작은 태양광 판 — f_174)
    [[23.8, S0 + 2.5, 1.0], [32.4, S0 + 2.4, 1.0]].forEach(([x9, z9, s9]) => ballJuniper(x9, z9, s9));   // PORCH-2: 교훈석 서쪽 향나무 자리 = 무궁화(e_304), 첫 그루는 태양광 등(22.3)과 띄움
    { const tx9 = 30.0, tz9 = S0 + 1.35, R9 = seeded(3011);                           // 1학년 앞 큰 층층 향나무(f_171·f_174·f_273: 둥근 덩어리 여럿이 뭉친 키 ≈4.5 m · 폭 ≈3 m 토피어리)
      colliders.push({ x0: tx9 - 0.35, x1: tx9 + 0.35, y0: YARD, y1: YARD + 12, z0: tz9 - 0.35, z1: tz9 + 0.35 });
      [[-0.95, 0.95, -0.95, 0.95], [0.35, 1.75, -0.4, 1.0], [-1.72, -0.28, -0.97, 0.47]].forEach(([a9, b9, c9, d9]) => colliders.push(noStand({ x0: tx9 + a9, x1: tx9 + b9, y0: YARD, y1: YARD + 1.4, z0: tz9 + c9, z1: tz9 + d9 })));   // 아래 세 덩어리 발자국대로(모서리가 잎에서 멀면 보이지 않는 벽)
      dCyl(0.1, 0.15, 3.6, 0x5e4a3a, tx9, YARD, tz9, { far: true, seg: 6 });
      [[0, 0.75, 0, 1.05], [1.05, 1.25, 0.3, 0.78], [-1.0, 1.5, -0.25, 0.8], [0.15, 2.25, 0.1, 0.9], [0.95, 2.7, -0.2, 0.66], [-0.8, 3.0, 0.2, 0.62], [0.05, 3.75, 0, 0.52]].forEach(([ox, oy, oz, r], k) =>
        dBlob(r, r * 0.86, r, [0x2f6a3a, 0x357242, 0x2b6236][k % 3], tx9 + ox, YARD + oy, tz9 + oz, { far: true, ry: R9() * 6, jitter: 0.1 })); }
    { const lx9 = 35.6, lz9 = S0 + 1.05;                                              // 검은 정원등(f_174: 기둥 2 m + 검은 등통 0.45 × 1.0 · 옆면 흰 반투명 판 · 흰 머리 · 태양광 판)
      post(lx9, lz9, YARD, YARD + 3.0, 0.12); dCyl(0.05, 0.06, 1.95, 0x22252a, lx9, YARD, lz9, { far: true, seg: 6 });
      dBox(0.42, 0.95, 0.42, 0x22252a, lx9, YARD + 1.95, lz9, { far: true });
      dBox(0.3, 0.72, 0.46, 0xe8ecec, lx9, YARD + 2.06, lz9, { far: true }); dBox(0.46, 0.7, 0.3, 0xe8ecec, lx9, YARD + 2.07, lz9, { far: true });
      lamp(0.2, 0.5, 0.2, lx9, YARD + 2.15, lz9);
      dBox(0.52, 0.07, 0.52, 0xf2f2ee, lx9, YARD + 2.9, lz9, { far: true });
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(lx9, YARD + 3.08, lz9), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.45, 0, 0)), new THREE.Vector3(0.36, 0.03, 0.26)), 0x2b3f6b, { far: true }); }
    { const lx9 = 34.6, lz9 = S0 + 1.3;                                               // 가로등(키 5m·LED 머리 — u_272 오른쪽)
      post(lx9, lz9, YARD, YARD + 5.2, 0.1); dCyl(0.05, 0.08, 5.0, 0x9aa0a6, lx9, YARD, lz9, { far: true, seg: 8 });
      dRod(lx9, YARD + 4.9, lz9, lx9 - 0.6, YARD + 5.05, lz9, 0.03, 0x9aa0a6, { far: true }); dBox(0.5, 0.08, 0.2, 0xd9dde0, lx9 - 0.75, YARD + 4.98, lz9, { far: true }); lamp(0.4, 0.03, 0.14, lx9 - 0.75, YARD + 4.95, lz9); }
    // 조명탑(운동장 북서 모서리 블록 -36, -15.5) → 본관 서쪽 지붕으로 가는 전선(영상 g_115~g_121: 기둥 윗부분에서 유치원 쪽 처마로 처져 이어짐)
    { const A9 = [-36, YARD + 8.2, -15.5], B9 = [-33.5, FH + 0.9, fz1 + 0.35], M9 = [(A9[0] + B9[0]) / 2, (A9[1] + B9[1]) / 2 - 0.45, (A9[2] + B9[2]) / 2];
      dRod(...A9, ...M9, 0.012, 0x2a2a2a, { far: true }); dRod(...M9, ...B9, 0.012, 0x2a2a2a, { far: true }); }
    // 본관 지붕 앞쪽 흰 옥상 실외기 줄(위성 D: 남 파라펫 1.3 m 안쪽 · 방마다 하나 · 높이 ≈1 m)
    [-39.3, -31, -21, -12, 2.5, 5.3].forEach(x9 => { dBox(1.0, 0.9, 0.7, 0xe3e5e1, x9, FH + 0.3, -25.3, { far: true }); dBox(0.7, 0.6, 0.03, 0x8c9094, x9, FH + 0.45, -24.935, { far: true }); });
    zones.push({ x0: WX0, x1: WX1, z0: fz1, z1: FY.walkS, y: YARD, label: '앞뜰 산책로' });
  }
  {   // 구령대(영상 u_272~299): 모자이크 앞면 + 흰 갓돌 + 스테인리스 난간, 양 끝 7단 계단(앞면 따라 가운데로 오름), 위 = 짙은 고무 매트·탁자·의자
      //   PORCH-2(영상 p_152·p_156·p_161·u_283·위성 대조): 지붕은 둘 — ① 산책로 차양(돌출부 서면 x 10.25 → 무대 동단, 돌출부 앞면 → 무대 북쪽 기둥 줄 · 짙은 나무 천장 + 천창 하나)
      //   ② 구령대 지붕(무대보다 0.2 넓게 · 밝은 갈색 루버 천장). 둘 다 처마 밑 1.9·윗면 2.95(앞판 1m 깊은 상자 지붕 — u_283 무대 앞면 1.05를 자로 잼)
      //   예전엔 판 하나가 무대 3.25m 위에 떠 키 큰 정자로 보였고, 돌출부 동쪽 차양 북쪽 가가 기둥 없이 떠 있었다.
    const [px0, px1] = PR.x, pc = (px0 + px1) / 2, pw = px1 - px0, FZ = TR3.fieldZ, BZ = TERR_Z, R = YARD - FIELD;
    addBox(pw, R, FZ - BZ, 0xd7d0c2, pc, FIELD, (BZ + FZ)/2);                    // 구령대 몸체(둔덕 자리)
    patWall('mosaic', 'x', px0, px1, FIELD + 0.12, YARD - 0.1, FZ + 0.012, 1);
    dBox(pw + 0.1, 0.12, 0.3, 0xf2f0ea, pc, YARD - 0.1, FZ - 0.1);                 // 흰 갓돌
    patQuad('gmat', px0, px1, FY.walkS + 0.12, FZ - 0.25, YARD + 0.012);
    // 기둥(짙은 나무 0.4각 · 영상 u_283·p_154): 앞줄 = 모서리 둘, 북쪽 줄 = 약 2m 간격 넷(산책로 남쪽 경계석 바로 뒤), 차양 북동 = 돌출부 동쪽 화단 가(p_161)
    const Y0 = 1.9, Y1 = 2.95, PZN = FY.walkS + 0.12 + 0.2, ZJ = FY.walkS + 0.05;   // 처마 밑·지붕 윗면·북쪽 기둥 줄 z·두 지붕 이음줄
    const CX0 = EN.x[0], CX1 = px1, CZ0 = EN.z[1], RX0 = px0 - 0.2, RX1 = px1 + 0.2, RZ1 = FZ + 0.2;
    const pillar = (x9, z9, d9 = 0.4, py = YARD) => {                              // py = 무늬 시작 높이(갓돌 위에 선 기둥은 갓돌 윗면부터)
      addBox(0.4, Y0 - YARD, d9, DKWOOD, x9, YARD, z9);
      patWall('woodP', 'x', x9 - 0.2, x9 + 0.2, py, Y0, z9 + d9/2 + 0.012, 1); patWall('woodP', 'x', x9 - 0.2, x9 + 0.2, py, Y0, z9 - d9/2 - 0.012, -1);
      patWall('woodP', 'z', z9 - d9/2, z9 + d9/2, py, Y0, x9 + 0.212, 1); patWall('woodP', 'z', z9 - d9/2, z9 + d9/2, py, Y0, x9 - 0.212, -1);
    };
    [[px0 + 0.25, PZN], [px0 + 2.2, PZN], [px0 + 4.1, PZN], [px1 - 0.25, PZN]].forEach(([x9, z9]) => pillar(x9, z9));
    //   앞 모서리 둘(영상 e_304: 계단 도착 트임의 남쪽 모서리 = 앞 난간 줄에 붙은 기둥 · 트임 약 1m) — 깊이 0.28로 흰 갓돌 위에 선다(남면 = 갓돌 앞면 FZ+0.05보다 1cm 뒤).
    //   북면 z = FZ-0.24 → 계단 통로(z BZ+0.11 ~ FZ-0.17)를 7cm만 먹는다(몸 부풀림 뒤 남는 폭 0.33 · 예전 0.3 안쪽 0.4각 기둥은 통로 남쪽 40cm를 막아 7cm만 남겼다)
    [px0 + 0.2, px1 - 0.2].forEach(x9 => pillar(x9, FZ - 0.1, 0.28, YARD + 0.02));
    pillar(CX1 - 0.25, CZ0 + 0.185, 0.37);                                       // 차양 북동 기둥(북 경계석 1cm 앞에서 멈춤)
    // 지붕 판 둘(짙은 나무 상자) — 윗면·밑면이 같은 높이로 이음줄 ZJ에서 맞닿기만
    addBox(RX1 - RX0, Y1 - Y0, RZ1 - ZJ, 0x2f2a26, (RX0 + RX1)/2, Y0, (ZJ + RZ1)/2);   // 구령대 지붕
    addBox(CX1 - CX0, Y1 - Y0, ZJ - CZ0, 0x2f2a26, (CX0 + CX1)/2, Y0, (CZ0 + ZJ)/2);   // 산책로 차양(북쪽 = 돌출부 앞면에 맞댐)
    patQuad('louver', RX0, RX1, ZJ, RZ1, Y0 - 0.012, true);                        // 구령대 = 밝은 루버 천장(영상 p_154·u_290)
    dBox(RX1 - RX0 - 0.16, 0.03, RZ1 - ZJ - 0.08, 0x78a887, (RX0 + RX1)/2, Y1, (ZJ + RZ1 - 0.08)/2, { far: true });   // 윗면 지붕재(위성 D: 구령대 위 넓은 판 = 연한 초록 반투명 판 · 산책로 차양 = 회청록 — FRONT-3) · 가장자리 8cm 안쪽이라 땅에선 안 보임
    dBox(CX1 - CX0 - 0.16, 0.03, ZJ - CZ0 - 0.08, 0x5d8373, (CX0 + CX1)/2, Y1, (CZ0 + 0.08 + ZJ)/2, { far: true });
    const SK = [12.5 - 0.8, 12.5 + 0.8, CZ0 + 0.7, CZ0 + 1.5];                     // 천창 하나 — 현관 입구 앞(영상 p_152·p_156: 유리 두 칸)
    [[CX0, CX1, CZ0, SK[2]], [CX0, CX1, SK[3], ZJ], [CX0, SK[0], SK[2], SK[3]], [SK[1], CX1, SK[2], SK[3]]].forEach(([a, b, c, d]) => patQuad('cwood', a, b, c, d, Y0 - 0.012, true));
    patQuad('cflat', SK[0], SK[1], SK[2], SK[3], Y0 - 0.012, true, 0x9fd3f0);       // 천창 유리(조명 무시 재질 — 땅색에 물들지 않게)
    [[SK[0], SK[0] + 0.05, SK[2], SK[3]], [SK[1] - 0.05, SK[1], SK[2], SK[3]], [SK[0] + 0.05, SK[1] - 0.05, SK[2], SK[2] + 0.05], [SK[0] + 0.05, SK[1] - 0.05, SK[3] - 0.05, SK[3]], [12.47, 12.53, SK[2] + 0.05, SK[3] - 0.05]]
      .forEach(([a, b, c, d]) => dBox(b - a, 0.03, d - c, DKWOOD, (a + b)/2, Y0 - 0.042, (c + d)/2));   // 천창 틀·가운데 살
    // 처마 겉면 = 큰 판 무늬 + 윗선 파랑 띠(네 변 — 영상 p_152·u_276). 띠는 모서리에서 한쪽이 덮고 다른 쪽은 거기서 멈춘다(윗면·아랫면 겹침 0)
    patWall('woodP', 'x', RX0, RX1, Y0, Y1, RZ1 + 0.012, 1);
    patWall('woodP', 'z', ZJ, RZ1, Y0, Y1, RX0 - 0.012, -1); patWall('woodP', 'z', ZJ, RZ1, Y0, Y1, RX1 + 0.012, 1);
    patWall('woodP', 'x', RX0, CX0, Y0, Y1, ZJ - 0.012, -1); patWall('woodP', 'x', CX1, RX1, Y0, Y1, ZJ - 0.012, -1);
    patWall('woodP', 'z', CZ0, ZJ, Y0, Y1, CX0 - 0.012, -1); patWall('woodP', 'z', CZ0, ZJ, Y0, Y1, CX1 + 0.012, 1);
    patWall('woodP', 'x', EN.x[1], CX1, Y0, Y1, CZ0 - 0.012, -1);
    const bl = (x0, x1, z0, z1) => dBox(x1 - x0, 0.1, z1 - z0, BLUE, (x0 + x1)/2, Y1 - 0.1, (z0 + z1)/2);
    bl(RX0 - 0.06, RX1 + 0.06, RZ1, RZ1 + 0.06); bl(RX0 - 0.06, RX0, ZJ, RZ1); bl(RX1, RX1 + 0.06, ZJ, RZ1);
    bl(RX0 - 0.06, CX0, ZJ - 0.06, ZJ); bl(CX1, RX1 + 0.06, ZJ - 0.06, ZJ);
    bl(CX0 - 0.06, CX0, CZ0, ZJ - 0.06); bl(CX1, CX1 + 0.06, CZ0, ZJ - 0.06); bl(EN.x[1], CX1 + 0.06, CZ0 - 0.06, CZ0);
    // 난간: 앞면(모서리 기둥 사이) + 서·동 옆면(무대 옆 잔디에서 걸어 들어오지 못하게) + 북쪽 서쪽 첫 칸(영상 e_313·p_154) — 나머지 북쪽 칸은 현관 쪽 출입구
    steelRail(px0 + 0.4, FZ - 0.12, px1 - 0.4, FZ - 0.12, YARD + 0.02);          // 앞 모서리 기둥 안쪽 면 사이
    // 계단 난간(영상 u_288~295): 양쪽 두 줄 · 세로로 긴 타원 고리 살. 충돌 = steelRail과 같은 0.3m 토막(높이 1.6·카메라 무시)
    //   고리 살은 칸마다 무늬 판 하나(투명 바탕 + 은색 고리 그림 — 아래 한 메시) — 봉으로 세우면 고리 하나가 삼각형 200개라 무늬로 바꿨다
    const loopPos = [], loopUV = [];
    const loopRail = (x0, z0, x1, z1, yA, yB, h = 0.95) => {
      const S = 0xcdd2d6, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.9));
      const P = t => [x0 + (x1 - x0)*t, yA + (yB - yA)*t, z0 + (z1 - z0)*t];
      const a = P(0), b = P(1);
      dRod(a[0], a[1] + h, a[2], b[0], b[1] + h, b[2], 0.03, S);
      dRod(a[0], a[1] + 0.12, a[2], b[0], b[1] + 0.12, b[2], 0.015, S);
      for (let i = 0; i <= n; i++) { const p = P(i / n); dRod(p[0], p[1], p[2], p[0], p[1] + h, p[2], 0.028, S); }
      for (let i = 0; i < n; i++) { const p = P(i / n), q = P((i + 1) / n), Q = [[p, 0.13, 0, 0], [q, 0.13, 1, 0], [q, h - 0.03, 1, 1], [p, h - 0.03, 0, 1]];
        [0, 1, 2, 0, 2, 3].forEach(k => { const [c, dy, u, v] = Q[k]; loopPos.push(c[0], c[1] + dy, c[2]); loopUV.push(u, v); }); }
      const m = Math.max(1, Math.round(L / 0.3));
      for (let i = 0; i < m; i++) { const p = P(i / m), q = P((i + 1) / m);
        colliders.push({ x0: Math.min(p[0], q[0]) - 0.05, x1: Math.max(p[0], q[0]) + 0.05, y0: Math.min(p[1], q[1]), y1: Math.max(p[1], q[1]) + 1.6, z0: Math.min(p[2], q[2]) - 0.05, z1: Math.max(p[2], q[2]) + 0.05, nc: true }); }
    };
    // 무대 옆면·북쪽 첫 칸 = 고리 살(영상 p_152·p_154 — 앞면만 곧은 살). 옆면은 계단 도착 자리(z BZ~FZ) 앞에서 멈춤
    loopRail(px0 + 0.1, PZN + 0.2, px0 + 0.1, BZ + 0.06, YARD + 0.02, YARD + 0.02); loopRail(px1 - 0.1, PZN + 0.2, px1 - 0.1, BZ + 0.06, YARD + 0.02, YARD + 0.02);
    loopRail(px0 + 0.45, PZN, px0 + 2.0, PZN, YARD + 0.02, YARD + 0.02);
    // 양 끝 계단: 서쪽 = 동쪽으로 오름(x px0-1.8~px0), 동쪽 = 서쪽으로 오름. 6단 + 마지막 턱 = 구령대 면(7단 · 1.05)
    //   영상 u_290·u_293: 옆면 = 흰 경사 띠 + 그 아래 모자이크(무대 앞면과 이어진 사다리꼴), 디딤판 = 회색 화강석 + 짙은 논슬립(맨 아래·맨 위 단 = 노랑)
    for (let i = 0; i < 6; i++) {
      const h = R * (i + 1) / 7;
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px0 - 1.8 + 0.3 * i + 0.15, FIELD, (BZ + FZ)/2);
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px1 + 1.8 - 0.3 * i - 0.15, FIELD, (BZ + FZ)/2);
      [[px0 - 1.8 + 0.3 * i + 0.15, -1], [px1 + 1.8 - 0.3 * i - 0.15, 1]].forEach(([x9, f]) => {
        dBox(0.3, 0.04, FZ - BZ - 0.1, 0xb3b0a8, x9, FIELD + h, (BZ + FZ)/2 - 0.05);                                        // 화강석 디딤판
        colliders.push({ x0: x9 - 0.15, x1: x9 + 0.15, y0: FIELD + h, y1: FIELD + h + 0.051, z0: BZ, z1: FZ - 0.1 });            // 디딤판·논슬립 윗면에 선다(발이 논슬립을 뚫지 않게)
        dBox(0.06, 0.045, FZ - BZ - 0.14, i === 0 || i === 5 ? YEL : 0x3d3f43, x9 + f * 0.1, FIELD + h + 0.006, (BZ + FZ)/2 - 0.05);   // 논슬립(내려가는 쪽 끝)
      });
    }
    [[px0 - 1.8, px0, 1], [px1 + 1.8, px1, -1]].forEach(([xa, xb, f]) => {        // 계단 옆면 모자이크 사다리꼴(흰 띠 0.2 아래)
      const xf = xa + f * 0.34, pts = [[xf, FIELD + 0.12, FZ + 0.012], [xb, FIELD + 0.12, FZ + 0.012], [xb, YARD - 0.2, FZ + 0.012], [xb, YARD - 0.2, FZ + 0.012]];
      patPush('mosaic', pts, pts.map(p => [p[0] / 1.2, p[1] / 1.2]), [0, 0, 1], 0xffffff);
      loopRail(xa, FZ - 0.12, xb, FZ - 0.12, FIELD, YARD);                          // 바깥(앞) 줄
      loopRail(xa, BZ + 0.06, xb, BZ + 0.06, FIELD, YARD);                          // 안쪽(둔덕) 줄 — 화단에서 계단 옆으로 뛰어내리지 못하게
      colliders.push(noStand({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: FIELD, y1: YARD + 1.62, z0: BZ, z1: BZ + 0.11 }));
    });
    // 동쪽 계단 발치(영상 u_288·u_290): 1m 포장 참 + 뒤 흰 자연석 옹벽(화단 높이까지) — 잔디 둔덕은 그 동쪽부터(둔덕 블록 PR.x[1] + 2.8)
    addBox(1.0, 0.6, 0.25, 0xe3e0d8, px1 + 2.3, FIELD, BZ + 0.125);                  // 낮은 옹벽(0.6) 위는 가파른 잔디(화단 높이로)
    patWall('rockW', 'x', px1 + 1.8, px1 + 2.8, FIELD, FIELD + 0.6, BZ + 0.25 + 0.012, 1);
    slope('grass', 'z', px1 + 1.8, px1 + 2.8, BZ, BZ + 0.25, YARD, FIELD + 0.6, 1, 0xf2f6e8); slopeCap('grass', px1 + 1.8, -1, BZ, BZ + 0.25, YARD, FIELD + 0.6);
    patQuad('pave', px1 + 1.8, px1 + 2.8, BZ + 0.25, FZ, FIELD + 0.02);
    addBox(1.18, 0.45, 0.3, 0xb3b1aa, px0 - 2.41, FIELD, FZ - 0.15);                 // 서쪽 계단 발치 둔덕 끝 회색 낮은 블록(영상 u_283) — 동쪽 면은 둔덕 끝 잔디 마감(x px0-1.8)보다 2cm 뒤(같은 면 겹침 깜빡임)
    { // 고리 살 무늬 메시(칸마다 세로 타원 고리 둘 + 위아래 짧은 살 — 영상 u_290·p_152)
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g9 = cv.getContext('2d');
      g9.strokeStyle = '#ffffff'; g9.lineWidth = 3.2;
      [32, 96].forEach(x9 => { g9.beginPath(); g9.moveTo(x9, 0); g9.lineTo(x9, 27); g9.moveTo(x9, 101); g9.lineTo(x9, 128); g9.stroke(); g9.beginPath(); g9.ellipse(x9, 64, 9, 37, 0, 0, Math.PI * 2); g9.stroke(); });
      const tx9 = new THREE.CanvasTexture(cv); tx9.colorSpace = THREE.SRGBColorSpace; tx9.anisotropy = 4;
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(loopPos, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(loopUV, 2));
      lg.computeVertexNormals(); lg.computeBoundingSphere();
      const lm = new THREE.Mesh(lg, new THREE.MeshLambertMaterial({ map: tx9, color: 0xcdd2d6, alphaTest: 0.5, side: THREE.DoubleSide }));
      lm.matrixAutoUpdate = false; scene.add(lm);
    }
    hotspots.push({ kind: 'mic', x: pc, z: FZ - 1.0, y: YARD, r: 1.5, label: '구령대 마이크 잡기' });
    // 탁자·의자(영상 u_296~299·e_300): 티크색 슬랫 상판 1.5×0.8 + 짙은 쇠틀, 팔걸이 슬랫 의자 6(양옆 2·양끝 1) — 무대 길이 방향 한 줄
    const patio = (cx, cz, face) => {
      const at = partAt(cx, YARD, cz, face, 1), T = 0x9a6e45, F = 0x3a3d44;
      [-0.15, -0.005, 0.14].forEach(lz => at(0, 0.42, lz, 0.5, 0.03, 0.13, T));
      [0.55, 0.68, 0.81].forEach(ly => at(0, ly, -0.24, 0.5, 0.08, 0.03, T));
      [-1, 1].forEach(sx => { at(sx * 0.25, 0, -0.24, 0.04, 0.9, 0.05, F); at(sx * 0.25, 0, 0.2, 0.04, 0.42, 0.04, F); at(sx * 0.25, 0.42, 0.2, 0.04, 0.23, 0.04, F); at(sx * 0.27, 0.65, -0.02, 0.05, 0.03, 0.5, T); });
      colliders.push(noStand({ x0: cx - 0.3, x1: cx + 0.3, y0: YARD, y1: YARD + 0.9, z0: cz - 0.3, z1: cz + 0.3 }));
    };
    [[pc - 1.55, FZ - 2.2], [pc + 1.55, FZ - 2.2]].forEach(([tx9, tz9]) => {
      colliders.push(noStand({ x0: tx9 - 0.75, x1: tx9 + 0.75, y0: YARD, y1: YARD + 0.72, z0: tz9 - 0.4, z1: tz9 + 0.4 }));
      for (let k = 0; k < 5; k++) dBox(1.5, 0.04, 0.14, 0xa77b4f, tx9, YARD + 0.68, tz9 - 0.33 + k * 0.165);   // 슬랫 상판(틈 2.5cm)
      dBox(1.4, 0.04, 0.7, 0x3a3d44, tx9, YARD + 0.635, tz9);                                                  // 쇠틀
      [[-0.66, -0.32], [0.66, -0.32], [-0.66, 0.32], [0.66, 0.32]].forEach(([ox, oz]) => dBox(0.05, 0.635, 0.05, 0x3a3d44, tx9 + ox, YARD, tz9 + oz));
      [-0.38, 0.38].forEach(ox => { patio(tx9 + ox, tz9 - 0.68, 2); patio(tx9 + ox, tz9 + 0.68, 0); });
    });
    patio(pc - 2.72, FZ - 2.2, 1); patio(pc + 2.72, FZ - 2.2, 3);
    zones.push({ x0: px0, x1: px1, z0: FY.walkS, z1: FZ, y: YARD, label: '구령대' });
  }
  {   // 잔디 둔덕(영상 u_283~287: 앞뜰 끝 = 옹벽이 아니라 잔디 비탈 + 아래 경계석) — 구령대·계단·동쪽 경사로 자리는 비운다
    const BZ = TERR_Z, FZ = TR3.fieldZ;
    //   FRONT-3b(영상 f_273·f_282·f_288·u_286 확대): 둔덕 발 = 높이 ≈0.2 콘크리트 경계석(앞면 짙은 회색 · 윗면 밝은 갓) → 그 앞 운동장 가를 따라 짙은 배수 띠(폭 ≈0.38 — 무대·계단 앞도 이어짐) · 비탈 긴 풀 사이 흰 주먹돌
    const bank = (a, b) => { slope('grass', 'z', a, b, BZ, FZ, YARD, FIELD, 8, 0xd6b89c);   // FRONT-3: 칙칙한 긴 풀빛 · 계단 8(비탈 면과 딛는 높이 차 ≤ 7cm — 떠 있음 검사)
      addBox(b - a, 0.2, 0.22, 0x8f8b82, (a + b)/2, FIELD, FZ + 0.11);
      dBox(b - a - 0.02, 0.04, 0.24, 0xb9b5ab, (a + b)/2, FIELD + 0.2, FZ + 0.11, { far: true }); };   // 갓: 앞뒤 1cm·양끝 1cm 비켜(같은 평면 겹침 없음)
    bank(-27, PR.x[0] - 1.8); bank(PR.x[1] + 2.8, EP.x[0]); bank(EP.x[1], 60);   // 서쪽 끝(x < -27)은 둔덕 대신 흙 비탈 앞마당(운동장 북서 모서리 블록 — 영상 g_079~120) · 동쪽은 계단 발치 포장 참(1m) 다음부터(PORCH-2 · u_288)
    addPanel(EP.x[0] + 27, 0.38, 0x5d5a53, (EP.x[0] - 27) / 2, FIELD + 0.012, FZ + 0.41);                         // 짙은 배수 띠(경계석 앞 — 동쪽 통학로 경사로에서 끊김)
    patQuad('grass', PR.x[0] - 1.8, PR.x[1] + 1.8, FZ, FZ + 0.22, FIELD + 0.012, false, 0xd6b89c);                 // 무대·계단 앞 좁은 풀 띠(u_286 — 경계석 대신)
    { const R9 = seeded(4242);                                                                                         // 비탈 주먹돌(반쯤 묻힘 — 윗면 ≤ 비탈 +5cm: 발 묻힘 검사 밖)
      for (let k = 0; k < 9; k++) { const x9 = k < 5 ? -26 + k * 6.4 + R9() * 3.0 : PR.x[1] + 3.5 + (k - 5) * 5.0 + R9() * 2.4, z9 = BZ + 0.3 + R9() * (FZ - BZ - 0.6), ys = YARD + (FIELD - YARD) * (z9 - BZ) / (FZ - BZ);
        dBlob(0.13 + R9() * 0.07, 0.07, 0.1 + R9() * 0.05, [0xd4d2cb, 0xc4c1b8, 0xdedbd2][k % 3], x9, ys - 0.02, z9, { chunky: true, ry: R9() * 6, far: true }); } }
    slopeCap('grass', -27, -1, BZ, FZ, YARD, FIELD, 0xd6b89c);
    slopeCap('grass', PR.x[0] - 1.8, 1, BZ, FZ, YARD, FIELD, 0xd6b89c); slopeCap('grass', PR.x[1] + 2.8, -1, BZ, FZ, YARD, FIELD, 0xd6b89c);
    slopeCap('grass', EP.x[0], 1, BZ, FZ, YARD, FIELD, 0xd6b89c); slopeCap('grass', EP.x[1], -1, BZ, FZ, YARD, FIELD, 0xd6b89c);
    // 동쪽 통학로 경사로(영상 f_186~195: 산책로 동끝 → 남쪽 운동장 옆길로 내려감)
    slope('pave', 'z', EP.x[0], EP.x[1], BZ, FZ + 2.6, YARD, FIELD, 8);
    slopeCap('pave', EP.x[0], -1, BZ, FZ + 2.6, YARD, FIELD); slopeCap('pave', EP.x[1], 1, BZ, FZ + 2.6, YARD, FIELD);
    patQuad('pave', EP.x[0], EP.x[1], FY.walkS, BZ, YARD + 0.02);
  }
  {   // 랜드마크(영상 f_146~151·u_272~291·e_304~311): 교훈석·무궁화·게양대·서쪽 태양광 등(구령대 서쪽 남 화단) · 소나무·교가비·태양광 가로등·탑시계(동쪽)
      //   PORCH-2: 동쪽 줄은 무대 끝 상대값이 아니라 절대 x(u_283 무대 앞면에 맞춘 카메라 — 교가비는 무대 동단보다 약 4.8m, 태양광 등은 약 7m 동쪽)
    const [px0, px1] = PR.x, S1 = FY.walkS + 1.9;
    // 선돌(윤곽 다각형을 두께만큼 뽑아 앞면이 평평 — 새김 글씨를 붙인다). ry = 앞면 방위(0 = 남 +z, π/2 = 동). 반환 = 앞면 위 점(u 오른쪽·v 위)
    const standStone = (outline, depth, hex, x, y, z, ry, jitter = 0) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v))), { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1 });
      g.translate(0, 0, -depth / 2);
      dGeo(g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), hex, { far: true, jitter });
      g.dispose();
      const w = depth / 2 + 0.06, c = Math.cos(ry), s9 = Math.sin(ry);
      return (u, v) => [x + u * c + w * s9, y + v, z - u * s9 + w * c];
    };
    // 교훈석(영상 e_311·e_306·p_149·u_283): 산책로 남쪽 경계석에 붙은 네모 화강석 받침 + 뾰족한 짙은 화강석 선돌(높이 약 2.4) · 앞면(동남 — 구령대 쪽)에 흰 세로 새김 글씨
    const SX = px0 - 2.6, SZ9 = FY.walkS + 0.12 + 0.45, MRY = 1.2;
    addBox(1.4, 0.45, 0.9, 0xc9c6bd, SX, YARD, SZ9, NS);
    const mf = standStone([[-0.5, 0], [0.52, 0], [0.5, 0.5], [0.45, 1.1], [0.36, 1.55], [0.2, 1.95], [0.02, 2.38], [-0.14, 2.3], [-0.3, 2.05], [-0.42, 1.6], [-0.5, 1.0], [-0.53, 0.4]], 0.4, 0x66696c, SX, YARD + 0.45, SZ9, MRY, 0.22);
    { const nx = Math.sin(MRY), nz = Math.cos(MRY);   // 뒤쪽 울퉁불퉁한 자연석 덩어리(앞면은 평평 — 글씨 자리)
      [[0.95, 0.4, 0.26, 0.32], [1.7, 0.3, 0.2, 0.26]].forEach(([v, sx, sy, sz]) => dBlob(sx, sy * 3, sz, 0x5c5f62, SX - nx * 0.12, YARD + 0.45 + v, SZ9 - nz * 0.12, { chunky: true, ry: MRY, jitter: 0.2, far: true })); }
    colliders.push(noStand({ x0: SX - 0.55, x1: SX + 0.55, y0: YARD, y1: YARD + 2.85, z0: SZ9 - 0.45, z1: SZ9 + 0.45 }));
    const vText = (str, u, v0, h) => [...str].forEach((ch, k) => { const [x9, y9, z9] = mf(u, v0 - k * h * 1.35); sign(ch, x9, y9, z9, MRY, h, { bg: 'none', fg: '#f2efe6' }); });
    vText('교훈', 0.2, 1.62, 0.2); vText('바르고', -0.03, 1.98, 0.23); vText('슬기롭게', -0.27, 1.74, 0.23);   // 세로쓰기 — 오른쪽 줄부터(영상 e_311: 글자가 앞면을 거의 채움)
    // 무궁화(영상 e_304·e_306·e_311: 교훈석 앞 구령대 쪽 — 분홍 꽃 핀 둥근 관목 2m)
    { const hx = SX + 0.5, hz = SZ9 + 1.5, R9 = seeded(97);
      dBlob(0.95, 0.95, 0.9, 0x4f7f3f, hx, YARD + 0.95, hz, { far: true, jitter: 0.1 });
      dBlob(0.7, 0.55, 0.65, 0x5c8c49, hx + 0.15, YARD + 1.7, hz - 0.05, { far: true, jitter: 0.1, ry: 0.7 });
      dBlob(0.55, 0.6, 0.5, 0x56863f, hx - 0.55, YARD + 1.25, hz + 0.3, { far: true, jitter: 0.1, ry: 1.9 });
      for (let k = 0; k < 34; k++) { const a = R9() * 6.28, e = (R9() - 0.3) * 1.2, r9 = 0.93;
        dBlob(0.08, 0.07, 0.08, k % 3 ? 0xd98fc8 : 0xe6a8d8, hx + Math.cos(a) * Math.cos(e) * r9, YARD + 1.05 + Math.sin(e) * 0.9, hz + Math.sin(a) * Math.cos(e) * r9 * 0.95, { far: true, chunky: true }); }
      colliders.push(noStand({ x0: hx - 0.75, x1: hx + 0.75, y0: YARD, y1: YARD + 1.8, z0: hz - 0.7, z1: hz + 0.7 })); }
    // 태양광 가로등(DETAIL-6): 기둥·팔·등 머리(조명 재질)·기운 패널
    const solarLamp = (LX, LZ, cctv) => {
      post(LX, LZ, YARD, YARD + 4.2, 0.1);
      dCyl(0.06, 0.1, 4.3, 0x9aa0a6, LX, YARD, LZ, { far: true, seg: 8 });
      dRod(LX, YARD + 4.0, LZ, LX, YARD + 4.0, LZ + 0.75, 0.035, 0x9aa0a6, { far: true });
      dBox(0.34, 0.1, 0.5, 0xdfe3e8, LX, YARD + 3.85, LZ + 0.9, { far: true });
      lamp(0.26, 0.04, 0.4, LX, YARD + 3.81, LZ + 0.9);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(LX, YARD + 4.55, LZ), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), new THREE.Vector3(0.9, 0.05, 0.6)), 0x2b3f6b, { far: true });
      if (cctv) {   // 기둥 중간 = 검은 나팔 확성기(운동장 쪽) + 그 밑 녹슨 갈색 함·띠쇠(FRONT-3b · 영상 f_288·u_284·u_286 확대 — 예전 작은 검은 상자 하나)
        dCyl(0.24, 0.09, 0.36, 0x2b2d31, LX, YARD + 2.78, LZ + 0.09, { far: true, seg: 4, rot: [Math.PI / 2, Math.PI / 4, 0] });
        dBox(0.2, 0.26, 0.13, 0x6b4a3a, LX, YARD + 2.22, LZ + 0.145, { far: true }); dBox(0.26, 0.05, 0.05, 0x8a8f92, LX, YARD + 2.52, LZ + 0.1, { far: true }); }
    };
    solarLamp(4.6, -14.9, false);                                                    // 서쪽(영상 f_144·u_276·u_279·e_306: 교훈석 남서쪽)
    solarLamp(-17.5, FY.walkS + 1.3, false);                                          // FRONT-3: 사랑반·돌봄 앞 남 화단(영상 g_127~f_132 — 산책로 바로 남쪽, 셋 방위 교차)
    solarLamp(-1.6, -14.6, false);                                                    // FRONT-3b: 교장실 앞 큰 소나무 옆(영상 f_138 방위 108.7°·f_144 방위 120.5° 교차 → (-1.6, -14.6))
    // 교가비(영상 u_272·u_284·u_288·u_290: 세운 밝은 회색 선돌 + 네모 받침 · 평평한 앞면 위 왼쪽 '교가' + 가사 줄)
    const GX = 20.3, GZ = S1 + 0.3, GRY = -0.2;
    addBox(1.6, 0.35, 0.8, 0xa9a7a0, GX, YARD, GZ, NS);
    const gf = standStone([[-0.7, 0], [0.7, 0], [0.72, 0.6], [0.62, 1.12], [0.4, 1.46], [0.05, 1.6], [-0.36, 1.5], [-0.6, 1.2], [-0.72, 0.6]], 0.4, 0xcac6bd, GX, YARD + 0.35, GZ, GRY);
    colliders.push(noStand({ x0: GX - 0.8, x1: GX + 0.8, y0: YARD, y1: YARD + 1.95, z0: GZ - 0.45, z1: GZ + 0.45 }));
    { const [x9, y9, z9] = gf(-0.28, 1.22); sign('교가', x9, y9, z9, GRY, 0.2, { bg: 'none', fg: '#3d3a36' }); }
    for (let k = 0; k < 6; k++) { const [x9, y9, z9] = gf(0.08, 1.05 - k * 0.13);
      dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(x9, y9, z9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, GRY, 0)), new THREE.Vector3(0.9 - (k % 3) * 0.08, 0.03, 0.01)), 0x6f6a62, { far: true }); }
    hotspots.push({ kind: 'song', x: GX, z: GZ + 1.1, y: YARD, r: 1.3, label: '교가 흥얼거리기' });
    cloudPine(px1 + 2.6, -15.0, 1.1, 4, 0.8);                                            // 무대 동쪽 전정 소나무(영상 u_283·u_288·u_290: 교가비 앞을 반쯤 가림) — FRONT-3: 구름 소나무(잎이 몸 높이 위라 뚫림 0 · 퍼짐 0.8 = 무대 지붕 동끝 15.7에 안 닿게)
    solarLamp(22.3, S1 + 0.5, true);
    { const tx9 = 25.5, tz9 = S1 + 0.2;                                              // 탑시계(영상 u_272·u_284: 네모 회색 돌기둥 둘 + 받침돌 + 안쪽 세로 물결 장식 · 흰 네모 시계 — 양면)
      [-0.3, 0.3].forEach(o => { dBox(0.4, 0.35, 0.4, 0xd8d5cc, tx9 + o, YARD, tz9, { far: true }); dBox(0.24, 3.95, 0.24, 0x9a9890, tx9 + o, YARD + 0.35, tz9, { far: true }); post(tx9 + o, tz9, YARD, YARD + 4.3, 0.2);
        for (let k = 0; k < 6; k++) { const ya = YARD + 1.5 + k * 0.29, sx = -Math.sign(o) * 0.14;
          dRod(tx9 + o + sx, ya, tz9 + (k % 2 ? 0.07 : -0.07), tx9 + o + sx, ya + 0.29, tz9 + (k % 2 ? -0.07 : 0.07), 0.018, 0x3a3d44, { far: true }); } });
      addBox(1.0, 1.0, 0.3, 0xf5f6f8, tx9, YARD + 4.3, tz9, { collide: false });
      [-1, 1].forEach(sd => { dCyl(0.4, 0.4, 0.03, 0xffffff, tx9, YARD + 4.8, tz9 + sd * 0.165, { rot: [Math.PI / 2, 0, 0], seg: 20, far: true });
        dBox(0.04, 0.3, 0.03, 0x22252a, tx9, YARD + 4.8, tz9 + sd * 0.19, { far: true }); dBox(0.22, 0.04, 0.03, 0x22252a, tx9 + 0.1, YARD + 4.78, tz9 + sd * 0.198, { far: true }); });   // 시곗바늘(분·시 — 면이 겹치지 않게 시침을 8mm 앞)
      hotspots.push({ kind: 'clock', x: tx9, z: tz9 + 0.8, y: YARD, r: 1.3, label: '탑시계 보기' }); }
    const [fpx, fpz] = SCHOOL.flagPole;                                             // 게양대(교훈석과 무대 서쪽 난간 사이 — 영상 e_304·e_311·p_152·u_276)
    addBox(0.16, 10, 0.16, 0xc8cdd2, fpx, YARD, fpz);
    { // 태극기(캔버스 = taegukCanvas · 양면)
      const cv = taegukCanvas();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.93, 14, 4), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      fl.position.set(fpx + 0.78, YARD + 9.05, fpz); fl.matrixAutoUpdate = false; fl.updateMatrix(); fl.frustumCulled = false; scene.add(fl);
      flagMesh = fl;                                                                // main.js가 펄럭이게 한다(정점 75개)
    }
    // 게임 지점 이름(보물찾기·퀴즈 스테이션용): 교훈석·게양대 + 남 화단 구역(구령대 구역이 먼저 잡히도록 뒤에)
    hotspots.push({ kind: 'motto', x: SX + 1.0, z: SZ9 - 0.1, y: YARD, r: 1.2, label: '교훈 읽기' });
    hotspots.push({ kind: 'flag', x: fpx + 0.5, z: fpz - 0.6, y: YARD, r: 1.2, label: '태극기 올려다보기' });
    zones.push({ x0: WX0, x1: WX1, z0: FY.walkS, z1: TERR_Z, y: YARD, label: '앞뜰 남쪽 화단' });
  }

  // ================= 운동장·놀이 시설 (FIELD) =================
  const FLD = SCHOOL.field, FCX = (TR3.westX + SCHOOL.eastFenceX) / 2, FCZ = (FLD.z[0] + SCHOOL.southFenceZ) / 2;
  // 골대(DETAIL-4) — 사용자 09-24 "4개: 동서로 큰 골대, 학교 쪽·정문 쪽에 작은(하프) 골대 — 체육관 쪽으로 붙어 있음"
  //   (x,z) = 골문 가운데, back = 그물이 뻗는 쪽 [dx,dz](운동장 바깥), s ≥ 1 = 큰 골대(7.32×2.44 규격) · 작은 = 3.0×1.8(영상 g_066~079 — 세로가 더 높음)
  //   앞틀(기둥·가로대) + 옆·뒤 = 가로대 끝에서 뒤로 둥글게 굽혀 내려오는 쇠파이프 한 줄(큰 골대는 은색 — 영상 g_066~076·f_261, 앞틀 노랑은 칠 벗겨진 톤) + 그물, 그물 충돌은 계단 3칸(골문 안은 들어감)
  function goal(x, z, back, hex, s) {
    const big = s >= 1, [bx, bz] = back, px = -bz, pz = bx, H = big ? 2.44 : 1.8, D = big ? 1.6 : 0.9, W = big ? 3.66 : 1.5, F = { far: true }, Y = FIELD;
    const FC9 = big ? 0xd9b060 : hex, BC9 = big ? 0xa9adb0 : hex;
    const P = (u, v) => [x + px*u + bx*v, z + pz*u + bz*v];
    [-W, W].forEach(u => {
      const [ax9, az9] = P(u, 0), [b1x, b1z] = P(u, D*0.3), [b2x, b2z] = P(u, D*0.62), [ex9, ez9] = P(u, D);
      dRod(ax9, Y, az9, ax9, Y + H, az9, 0.06, FC9, F); post(ax9, az9, Y, Y + H);
      dRod(ax9, Y + H, az9, b1x, Y + H - 0.08, b1z, 0.04, BC9, F);
      dRod(b1x, Y + H - 0.08, b1z, b2x, Y + H - 0.45, b2z, 0.04, BC9, F);
      dRod(b2x, Y + H - 0.45, b2z, ex9, Y, ez9, 0.04, BC9, F);
      dRod(ax9, Y, az9, ex9, Y, ez9, 0.035, BC9, F);
    });
    { const [a1, b1] = P(-W, 0), [a2, b2] = P(W, 0); dRod(a1, Y + H, b1, a2, Y + H, b2, 0.06, FC9, F); }
    { const [a1, b1] = P(-W, D), [a2, b2] = P(W, D); dRod(a1, Y, b1, a2, Y, b2, 0.035, BC9, F); }
    // [integ 09-25] 그물 충돌 = 그물이 몸 높이(1.5)로 내려온 자리(vb)부터 뒤끝까지 — 예전엔 가로대 바로 뒤(0.5D)부터 막아 그물 앞 0.3~0.6m가 보이지 않는 벽(동쪽 큰 골대 21간선)
    //   vb 앞 그물 밑은 머리 막이(발+1.52 위 — 걷기는 되고 점프하면 그물에 머리가 닿음)
    const vb = D * (0.5 + 0.5 * Math.max(0, 1 - 1.5 / (H - 0.1))), Q = (v0, v1) => { const [c0x, c0z] = P(-W, v0), [c1x, c1z] = P(W, v1); return { x0: Math.min(c0x, c1x), x1: Math.max(c0x, c1x), z0: Math.min(c0z, c1z), z1: Math.max(c0z, c1z) }; };
    colliders.push(noStand({ ...Q(vb, D), y0: Y, y1: Y + 1.6 }));
    if (vb > D * 0.5 + 0.05) colliders.push({ ...Q(D * 0.5, vb), y0: Y + 1.52, y1: Y + H, nc: true });
    for (let k = -W + 0.5; k < W; k += 0.5) { const [s0x, s0z] = P(k, D*0.5), [s1x, s1z] = P(k, D); dRod(s0x, Y + H - 0.1, s0z, s1x, Y, s1z, 0.012, 0xd8dcdf); }
    for (let t = 0.25; t < 1; t += 0.25) { const v = D*(0.5 + 0.5*t), yy = Y + (H - 0.1)*(1 - t), [s0x, s0z] = P(-W, v), [s1x, s1z] = P(W, v); dRod(s0x, yy, s0z, s1x, yy, s1z, 0.012, 0xd8dcdf); }
  }
  goal(-35.3, FCZ + 3.0, [-1, 0], 0xe0a83a, 1.4);                                // 서쪽 큰 골대(영상 g_072·g_075: 북쪽 기둥 ≈ 유치원 놀이터 남쪽 울타리 선, 골문선 = 놀이터 동쪽 울타리에서 ≈6.2 m 동쪽)
  goal(SCHOOL.eastFenceX - 4.5, FCZ, [1, 0], 0xe0a83a, 1.4);                    // 동쪽 큰 골대
  goal(-13, FLD.z[0] + 1.2, [0, -1], 0xf0f2f4, 0.8);                             // 학교 쪽 작은 골대(체육관 쪽으로 붙음) — 가로대 1.6 > 키 1.5 · FRONT-3b: 둔덕 발 배수 띠 바로 앞(영상 f_279·u_280 · 위성 D 흰 사각형 x -14.5~-11.2)
  goal(-24, SCHOOL.southFenceZ - 3.2, [0, 1], 0xf0f2f4, 0.8);                    // 정문 쪽 작은 골대
  {   // 운동장 동쪽 높은 초록 철망(영상 f_192~219) · 조명탑(북변). 남쪽(쉼터·정문 쪽)은 울타리 없이 트임(사용자 09-24 "정문에서 울타리가 운동장을 가로막지 않아")
    const EF = SCHOOL.eastFenceX, FP = SCHOOL.forestPlay;
    // 높은 철망·농구대 둘 = '동쪽 통학로' 블록(EAST-2 — 철망은 z 3~33만, 연두 기둥 6m · 가는 회색 그물)
    // 조명탑 2: 서 = 앞뜰 남 화단 서끝 큰 소나무 옆 대지(영상 g_079.5→g_085.5 기둥 추적 = g_115.5~120 '회색 함 달린 굵은 콘크리트 기둥'), 동 = 구령대 동쪽(운동장 북변)
    //   콘크리트 기둥 14.5 m + 머리 = 짙은 가로팔 4단 × 둥근 투광등(서 4·동 3 — 영상 g_072·g_081·f_264) · 기둥 중간 회색 제어함
    [[-36, -15.5, YARD, 4], [30, FLD.z[0] + 1.2, FIELD, 3]].forEach(([lx, lz, ly, n9]) => {
      post(lx, lz, ly, ly + 12, 0.25);
      dCyl(0.14, 0.28, 14.5, 0xb8b7b0, lx, ly, lz, { far: true, seg: 8 });
      dBox(0.4, 0.6, 0.25, 0xb8bcc0, lx - 0.4, ly + 1.9, lz, { far: true }); dBox(0.3, 0.05, 0.05, 0x8a8f92, lx - 0.3, ly + 2.2, lz);
      for (let r = 0; r < 4; r++) { const ay = ly + 12.0 + r * 0.7;
        dBox(2.4, 0.08, 0.08, 0x4f545a, lx, ay, lz + 0.2, { far: true });
        for (let i = 0; i < n9; i++) { const ex = lx - 0.9 + i * 1.8 / (n9 - 1);
          dBlob(0.22, 0.2, 0.18, 0x3d4248, ex, ay + 0.26, lz + 0.36, { chunky: true, far: true }); lamp(0.26, 0.2, 0.05, ex, ay + 0.16, lz + 0.55); } }   // 등(밤에 빛남)
    });
  }
  // ---- 남쪽 마당 도우미(SOUTH-2 · 09-24): 남서 울타리 선 · 비스듬한 바닥·띠 · 이 구역 무늬 ----
  //   무늬는 PATDEF를 고치지 않고 여기서 덧붙인다(다른 구역 작업과 겹치지 않게)
  PATDEF.paveG = [1.6, 256, false, (g, N, R) => bond(g, N, 32, 16, ['#8d8f92', '#86888c', '#939599', '#7f8286'], '#6a6c70', 1.5, R)];   // 짙은 회색 보도블록(영상 s_009~049 평균 #868687)
  PATDEF.sand = [2.4, 256, false, (g, N, R) => { g.fillStyle = '#d3bb8a'; g.fillRect(0, 0, N, N); blotch(g, N, 50, ['#c9ae7c', '#dcc697', '#cdb484'], 10, 40, 0.25, R); specks(g, N, 700, ['#b39a6c', '#eadbb8', '#a88f63'], 0.5, 1.4, R); }];   // 놀이터 모래(흙보다 누렇게 — 영상 s_021~049)
  PATDEF.redRd = [3.0, 256, false, (g, N, R) => { g.fillStyle = '#b86a5c'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#ad6053', '#c27566', '#b36b5a'], 10, 40, 0.3, R); specks(g, N, 700, ['#9a5448', '#cf8a7a'], 0.4, 1, R, 0.8); }];   // 정문 밖 붉은 어린이보호구역 포장(영상 s_000·g_000.5)
  PATDEF.kidHop = [3.6, 512, false, (g, N, R) => {   // 누운 아이 그림 + 숫자 사방치기(영상 s_039~045) — 한 장(바탕 = 회색 보도블록)
    bond(g, N, 28, 14, ['#8d8f92', '#86888c', '#939599', '#7f8286'], '#6a6c70', 1.5, R);
    g.save(); g.translate(N * 0.53, N * 0.52); g.rotate(-0.18); g.scale(1.2, 1.2);
    g.fillStyle = '#2c2d31'; g.beginPath(); g.ellipse(-N * 0.33, -N * 0.02, N * 0.1, N * 0.12, 0, 0, 7); g.fill();   // 머리카락
    g.fillStyle = '#f1c7a2'; g.beginPath(); g.ellipse(-N * 0.3, 0, N * 0.085, N * 0.1, 0, 0, 7); g.fill();          // 얼굴
    g.fillStyle = '#f4f2ec'; g.fillRect(-N * 0.22, -N * 0.14, N * 0.3, N * 0.28);                                    // 흰 윗옷
    g.fillStyle = '#f1c7a2'; g.fillRect(-N * 0.16, -N * 0.26, N * 0.07, N * 0.13); g.fillRect(-N * 0.16, N * 0.13, N * 0.07, N * 0.13);   // 팔
    g.fillStyle = '#2c2d31'; g.fillRect(N * 0.08, -N * 0.12, N * 0.2, N * 0.24);                                     // 검은 바지
    g.fillStyle = '#e8a36a'; g.fillRect(N * 0.28, -N * 0.12, N * 0.1, N * 0.09); g.fillRect(N * 0.28, N * 0.03, N * 0.1, N * 0.09);   // 주황 신발
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; const cw = N * 0.1, x0 = -N * 0.2;
    [[0, 0], [1, 0], [2, -0.5], [2, 0.5], [3, 0], [4, -0.5], [4, 0.5], [5, 0]].forEach(([i, j], k) => {
      g.strokeRect(x0 + i * cw, (j - 0.5) * cw, cw, cw);
      g.fillStyle = '#6fb3e0'; g.font = '700 ' + Math.round(cw * 0.7) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k + 1), x0 + (i + 0.5) * cw, j * cw); });
    g.restore(); }];
  const SB = SCHOOL.boundary, [SGX, SGZ] = SCHOOL.gate;
  const SWA = SB.find(p => p[1] === SGZ && p[0] < SGX), SWB = SB[SB.indexOf(SWA) + 1];            // 남서 변 = 정문 서쪽 기둥 → 남서 모서리
  const fenceZ = x => SWA[1] + (x - SWA[0]) * (SWB[1] - SWA[1]) / (SWB[0] - SWA[0]);
  const grassZ = x => fenceZ(x) - 2.0, walkZ = x => fenceZ(x) - 2.8;                                // 울타리 안쪽 잔디 띠(경계석) · 울타리 따라 좁은 보도(= 모래 띠 남변)
  function floor4(kind, P, y, tint = 0xffffff, uv = null) {                                           // 네 점 바닥(비스듬한 변) — 무늬는 월드 좌표 반복(uv를 주면 그대로)
    const s = PATDEF[kind][0], Q = [], U = [];
    P.forEach((p, i) => { const q = Q[Q.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4) { Q.push(p); if (uv) U.push(uv[i]); } });   // 뾰족 끝(겹친 점)은 빼고
    if (Q.length === 3) { Q.push(Q[2]); if (uv) U.push(U[2]); }                                        // 세모 → 첫 세 점으로 앞뒤(위를 봄)가 정해지게
    patPush(kind, Q.map(([x, z]) => [x, y, z]), uv ? U : Q.map(([x, z]) => [x / s, -z / s]), [0, 1, 0], tint);
  }
  const band = (kind, xa, xb, top, bot, y, tint) => floor4(kind, [[xa, top(xa)], [xb, top(xb)], [xb, bot(xb)], [xa, bot(xa)]], y, tint);
  function slab(x0, z0, x1, z1, w, h, hex, y0, opt = {}) {                                            // 비스듬한 띠(경계석·울타리 턱) — 곡면처럼 감사 밖(dGeo)
    const L = Math.hypot(x1 - x0, z1 - z0);
    _dm.compose(_dv.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2), _dq.setFromEuler(_de.set(0, -Math.atan2(z1 - z0, x1 - x0), 0)), _ds.set(L, h, w));
    dGeo(box_, _dm, hex, opt);
  }

  {   // 놀이터(SOUTH-2 · 영상 s_028~049 · 위성): 모래 + 스테인리스 기구(긴 미끄럼틀·그네·철봉·늑목) + 파랑 테 안내판 · 운동장 쪽 낮은 쇠 난간 + 검은 고무 경계석
    //   예전 빨강 지붕 나무 탑·파랑 그네·정글짐·구름사다리는 영상에 없다(전부 은회색 쇠)
    const Y = FIELD, S9 = 0xc3c8cc, ST = 0xd5d9dc, PX = SCHOOL.plaza.x[0], RUB = 0x2a2b2d;
    floor4('sand', [[-49.2, 45.8], [PX, 45.8], [PX, 55.6], [-46.3, 55.6]], Y + 0.01);
    // FSW-2(09-24): 모래가 남서 구석까지(네이버 항공 — 모래 남끝 위성 z≈88.5 = 게임 64.3 · 그 남쪽 = 나무 둔덕) — 동끝(-31)은 모래 띠 남변(walkZ)과 맞댐
    floor4('sand', [[-46.3, 55.6], [PX, 55.6], [-31, 58.5], [-43.5, 64.3]], Y + 0.01);                  // FSW-3: 동끝은 마당 혀 남끝 45° 사선(아래 포장 세모)과 맞댐
    floor4('sand', [[-31, 58.5], [-31, walkZ(-31)], [-43.5, 64.3], [-43.5, 64.3]], Y + 0.01);
    //   FSW-3 마당 혀 남끝 사선 포장(영상 h_040.5·h_042·h_043.5 카메라 풀이: 혀 서변 남끝 (-33.0, 55.5) → 남동 45° → (-30.6, 58.4) → 동쪽 z≈58.5 · 네이버 둥근 모서리) — 쉼터 블록 모래 띠 북변(Cz 서끝 58.5)과 이어짐
    floor4('paveG', [[PX, 55.6], [-31, 55.6], [-31, 58.5], [-31, 58.5]], Y + 0.02);
    patQuad('dirt', -49.5, -31, SCHOOL.field.z[1], 45.8, Y);                                          // 운동장 흙이 난간까지(영상 s_048·s_049.5 — 잔디 없음)
    // 운동장 쪽 낮은 쇠 난간(가로봉 둘) + 검은 고무 경계석(영상 s_048~052)
    //   FSW-2: 난간은 서쪽 약 10m만(영상 s_046.5 확대 — 동끝이 방위 304°·z 45.8 선 = x≈-39.7, h_047 측량과 같음) · 윗단 0.7·가운데 0.35 · 동쪽은 경계석만(트임)
    for (let x9 = -49.0; x9 <= -39.6 + 1e-6; x9 += 1.88) dRod(x9, Y, 45.8, x9, Y + 0.72, 45.8, 0.03, S9);
    [0.35, 0.7].forEach(h9 => dRod(-49.0, Y + h9, 45.8, -39.6, Y + h9, 45.8, 0.025, S9));
    colliders.push(noStand({ x0: -49.05, x1: -39.55, y0: Y, y1: Y + 0.75, z0: 45.74, z1: 45.86 }));
    {   // FSW-2: 난간 서끝 뒤 콘크리트 전신주 + 회색 함(영상 s_045·s_046.5 확대 — 그네 오른쪽 뒤·모래 서쪽 끝 비탈 발치, 방위 292.5°)
      const x9 = -49.55, z9 = 44.95;
      dCyl(0.13, 0.19, 10.5, 0xbfc2c0, x9, Y, z9, { far: true, seg: 8 }); colliders.push({ x0: x9 - 0.2, x1: x9 + 0.2, y0: Y, y1: Y + 10.5, z0: z9 - 0.2, z1: z9 + 0.2, nc: true });   // nc: 3인칭 카메라가 가는 기둥에 걸려 튀지 않게
      dBox(0.34, 0.72, 0.26, 0xb6babd, x9 + 0.3, Y + 2.5, z9, { far: true }); dBox(0.05, 0.6, 0.2, 0x8a8f92, x9 + 0.495, Y + 2.56, z9);
      dBox(1.6, 0.1, 0.1, 0x6d7278, x9, Y + 9.6, z9, { far: true });                                 // 완목
    }
    dBox(PX + 49.2, 0.1, 0.12, RUB, (PX - 49.2) / 2, Y, 45.8);
    colliders.push({ x0: -49.2, x1: PX, y0: Y, y1: Y + 0.1, z0: 45.74, z1: 45.86 });                 // FSW-2: 밟고 넘는 턱(난간을 줄여 트인 동쪽 구간 — 발이 경계석에 묻혀 보이지 않게, 영상 s_052.5 두툼한 고무 경계석)
    dBox(0.12, 0.1, 55.6 - 45.86, RUB, PX, Y, (45.86 + 55.6) / 2);                                   // 서쪽 끝 혀 둘레
    slab(PX + 0.04, 55.6, -31, 58.5 - 0.02, 0.12, 0.1, RUB, Y);                                        // FSW-3: 혀 남끝 사선 경계석(예전 동서 한 줄)
    slab(-31, walkZ(-31) + 0.06, -43.4, 64.36, 0.14, 0.045, RUB, Y);                                  // FSW-2: 모래 남끝(둔덕 쪽) 고무 경계석 — 4.5cm(발 묻힘 검사 층 아래 · 모래 띠 경계석과 윗면이 어긋남)
    {   // 긴 스테인리스 미끄럼틀(영상 s_036·s_039~046.5 — 방위가 다른 프레임 모두 화면 가로: 왼쪽=남 계단·발판, 오른쪽=북 운동장 쪽으로 내려감)
      //   FSW-3(09-25 · 영상 1920px h_040.5·h_042·h_043.5·h_046.5 — 쉼터 기둥·운동장 경계석·마당 혀 서변으로 카메라 자리를 풀어 땅 위 점을 잰 값):
      //   발판 2.0(h_042 발판 아랫선 = 2.0 · 예전 1.2) + 옆 세로살 울 0.9 · 앞뒤 윗대 · 남쪽 = 가파른 쇠 계단(가로 1.7 · 디딤 9 · 옆판·손잡이·가새)
      //   · 북쪽 = 발판보다 좁은 판 2.55 + 끝 평판 0.5 — 판은 북북동으로 25° 틀어짐(판 끝 네 프레임 평균 = 발판 북변 가운데에서 3.07m·방위 30° · 발판 기둥은 거의 정남북)
      //   · 자리 = 발판 가운데가 마당 혀 서변에서 2.0 서쪽(잰 값 2.3 — 혀 서변이 영상보다 0.8 서쪽이라 판 끝이 경계석에 닿지 않게 0.3 당김)
      const mx = PX - 2.0, mz = 54.75, D = 2.0, HW = 0.55, pz0 = mz - 0.5, pz1 = mz + 0.5, HE = 0.34, CG = 0.9;
      dBox(2 * HW, 0.06, 1.0, ST, mx, Y + D - 0.06, mz);                                                   // 발판
      [[-HW, pz0], [HW, pz0], [-HW, pz1], [HW, pz1]].forEach(([ox, z9]) => dRod(mx + ox, Y, z9, mx + ox, Y + D + CG, z9, 0.045, S9));   // 네 기둥(울 윗대까지)
      [-HW, HW].forEach(ox => { dRod(mx + ox, Y + D + CG, pz0, mx + ox, Y + D + CG, pz1, 0.035, S9); dRod(mx + ox, Y + D + 0.08, pz0, mx + ox, Y + D + 0.08, pz1, 0.025, S9);
        for (let z9 = pz0 + 0.125; z9 < pz1 - 0.06; z9 += 0.125) dRod(mx + ox, Y + D + 0.08, z9, mx + ox, Y + D + CG, z9, 0.015, S9); });   // 옆 세로살 울(영상 h_043.5)
      [pz0, pz1].forEach(z9 => dRod(mx - HW, Y + D + CG, z9, mx + HW, Y + D + CG, z9, 0.03, S9));          // 앞뒤 윗대(드나드는 곳 위)
      colliders.push({ x0: mx - HW, x1: mx + HW, y0: Y + 1.5, y1: Y + D, z0: pz0, z1: pz1 });                // 발판(밑은 트임 — 네 기둥 사이로 지나갈 수 있다)
      [[-HW, pz0], [HW, pz0], [-HW, pz1], [HW, pz1]].forEach(([ox, z9]) => colliders.push({ x0: mx + ox - 0.05, x1: mx + ox + 0.05, y0: Y, y1: Y + D + CG, z0: z9 - 0.05, z1: z9 + 0.05, nc: true }));   // nc: 3인칭 카메라가 가는 기둥에 걸려 튀지 않게
      [-HW, HW].forEach(ox => colliders.push(noStand({ x0: mx + ox - 0.04, x1: mx + ox + 0.04, y0: Y + D, y1: Y + D + 1.6, z0: pz0, z1: pz1 })));   // 울(옆으로 떨어지지 않게 · 발판에서 점프로도 못 넘게)
      // 계단(남쪽 +z): 기운 옆판 둘 + 디딤 9 + 손잡이(아래 기둥 → 발판 울 윗대) + 가새 — 보이는 디딤과 같은 높이의 충돌 9단(한 단 0.2)
      //   옆 막이 = 손잡이(몸이 옆으로 뚫고 지나가지 않게 · 윗부분은 발판에서 점프로 못 올라서게 D+1.6) · 폭 0.9 → 걷는 칸(0.3 격자 x = 6+0.3i) 한 줄이 가운데로 지난다
      const HS = 0.45, SR = 1.7, sz1 = pz1 + SR, NS9 = 9, rr = SR / (NS9 + 1), La = Math.hypot(SR, D), aa = Math.atan2(D, SR);
      [-HS, HS].forEach(ox => {
        _dm.compose(_dv.set(mx + ox * 0.94, Y + D / 2, (pz1 + sz1) / 2), _dq.setFromEuler(_de.set(aa, 0, 0)), _ds.set(0.04, 0.16, La)); dGeo(box_, _dm, S9);
        dRod(mx + ox, Y + 0.9, sz1 - 0.04, mx + ox, Y + D + CG, pz1, 0.025, S9);                               // 손잡이
        dRod(mx + ox, Y, sz1 - 0.04, mx + ox, Y + 0.9, sz1 - 0.04, 0.025, S9);                                 // 손잡이 아래 기둥
        [0.35, 0.65].forEach(t => { const zq = sz1 - SR * t; dRod(mx + ox, Y + D * t + 0.05, zq, mx + ox, Y + D * t + 0.82, zq + 0.28, 0.018, S9); });   // 가새(옆판 → 손잡이)
        colliders.push(noStand({ x0: mx + ox - 0.04, x1: mx + ox + 0.04, y0: Y, y1: Y + D + 1.6, z0: pz1, z1: sz1 })); });
      for (let k = 1; k <= NS9; k++) { const zc = sz1 - k * rr, h9 = D * k / (NS9 + 1);
        dBox(2 * HS * 0.88, 0.03, 0.14, ST, mx, Y + h9 - 0.03, zc);
        colliders.push({ x0: mx - HS, x1: mx + HS, y0: h9 > 1.5 ? Y + 1.5 : Y, y1: Y + h9, z0: k === NS9 ? pz1 : zc - rr / 2, z1: zc + rr / 2 }); }   // 몸보다 높은 디딤은 얇은 판만(밑이 트임 — 보이지 않는 벽 방지)
      // 판(발판 북변 가운데에서 25° 틀어 D → HE) + 옆 턱 + 끝 평판·다리. 판·턱 아래 끝을 0.16 늘려 평판 속에 묻는다(끝면이 평판 위로 나오면 역광 실선이 깜빡인다)
      //   충돌 = 판을 6토막으로 나눈 네 모서리의 축정렬 상자(가운데 높이 · 판 아랫면이 몸보다 높은 칸은 얇은 판만 — 밑으로 지나가고 보이지 않는 벽이 되지 않게)
      const PH = 25 * Math.PI / 180, Lh = 2.55, Lr = 0.5, Lc = Math.hypot(Lh, D - HE), ac = Math.atan2(D - HE, Lh);
      const CB9 = new THREE.Matrix4().compose(new THREE.Vector3(mx, 0, pz0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -PH, 0)), new THREE.Vector3(1, 1, 1));   // 판 로컬(−z = 판이 내려가는 쪽)
      const cW = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(CB9);
      const base9 = CB9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, Y + (D + HE) / 2, -Lh / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ac, 0, 0)), new THREE.Vector3(1, 1, 1)));
      const E9 = 0.16, part9 = (w, h, ox, oy, hex) => dGeo(box_, base9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, -E9 / 2), new THREE.Quaternion(), new THREE.Vector3(w, h, Lc + E9))), hex, { far: true });
      part9(0.62, 0.05, 0, 0, ST); part9(0.05, 0.22, -0.335, 0.09, S9); part9(0.05, 0.22, 0.335, 0.09, S9);
      dGeo(box_, CB9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(0, Y + HE - 0.03, -Lh - Lr / 2), new THREE.Quaternion(), new THREE.Vector3(0.72, 0.06, Lr))), ST, { far: true });   // 끝 평판
      [-0.3, 0.3].forEach(ox => { const a9 = cW(ox, Y, -Lh - Lr + 0.08); dRod(a9.x, Y, a9.z, a9.x, Y + HE - 0.06, a9.z, 0.03, S9); });   // 끝 다리(영상 h_046.5)
      const colR = (x0, x1, z0, z1, y0, y1) => { const P9 = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => cW(x, 0, z));
        colliders.push({ x0: Math.min(...P9.map(p => p.x)), x1: Math.max(...P9.map(p => p.x)), y0, y1, z0: Math.min(...P9.map(p => p.z)), z1: Math.max(...P9.map(p => p.z)) }); };
      for (let k = 0; k < 6; k++) { const hm = D - (D - HE) * (k + 0.5) / 6; colR(-0.36, 0.36, -Lh * (k + 1) / 6, -Lh * k / 6, hm > 1.5 ? Y + 1.5 : Y, Y + hm); }
      colR(-0.36, 0.36, -Lh - Lr, -Lh, Y, Y + HE);
      const to9 = cW(0, 0, -Lh - Lr + 0.2);
      hotspots.push({ kind: 'slide', x: mx, z: mz, y: Y + D, r: 1.0, label: '미끄럼틀 타기', from: [mx, Y + D, mz - 0.4], to: [to9.x, Y + HE, to9.z] });
    }
    {   // 회색 쇠 A형 그네 1대 · 의자 2(영상 s_046.5 왼쪽) — FSW-2: 가로보 양끝 ≈(-44.3, 49.3)~(-41.1, 48.9)(s_046.5 삼각측량·네이버 점 줄), 의자 초록·빨강
      const x9 = -42.7, z9 = 49.1, G9 = 0x9aa0a6;
      [-1.6, 1.6].forEach(o => { dRod(x9 + o, Y, z9 - 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true }); dRod(x9 + o, Y, z9 + 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true });
        colliders.push(noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 - 0.84, z1: z9 - 0.38 }), noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 + 0.38, z1: z9 + 0.84 })); });
      dRod(x9 - 1.7, Y + 2.3, z9, x9 + 1.7, Y + 2.3, z9, 0.06, G9, { far: true });
      [-0.6, 0.6].forEach(o => { [-0.2, 0.2].forEach(d9 => dRod(x9 + o + d9, Y + 2.28, z9, x9 + o + d9, Y + 0.5, z9, 0.012, 0x8a9096));
        dBox(0.5, 0.05, 0.22, o < 0 ? 0x4fae52 : 0xd8463c, x9 + o, Y + 0.45, z9);
        colliders.push(noStand({ x0: x9 + o - 0.25, x1: x9 + o + 0.25, y0: Y + 0.45, y1: Y + 2.2, z0: z9 - 0.11, z1: z9 + 0.11 })); });
    }
    {   // FSW-2 평행 매달리기 틀(영상 s_036~042 왼쪽 · s_040.5 확대: 기둥 4 위에 윗대 2줄 ≈2.1m · 길이 3.6 동서 · 폭 1.2 · 양끝 틀에 발 가로대 0.45·0.8 · 모서리 U자 손잡이)
      //   자리 = 네이버 항공 흐린 네모(게임 -43.5~-40 · 59~63) + s_039·s_042 방위 — 예전 '철봉 두 단'(-39~-36.6, 57)이 이 틀이었다
      //   FSW-3(09-25): 카메라를 푼 h_039·h_040.5에서 양끝 틀 = x -29.1(z 61.4~63.3) · x -32.9(z 61.3~62.9) → 가운데 (-31.0, 62.2) — 예전 (-40.8, 62.3)은 방위만 맞고 거리가 10m 멀었다(네이버 흐린 네모는 아래 오르기 틀)
      const cx9 = -31.0, cz9 = 62.2, HL = 1.8, HW = 0.6, H9 = 2.1;
      [-HL, HL].forEach(ox => { [-HW, HW].forEach(oz => { dRod(cx9 + ox, Y, cz9 + oz, cx9 + ox, Y + H9, cz9 + oz, 0.045, S9); colliders.push({ x0: cx9 + ox - 0.07, x1: cx9 + ox + 0.07, y0: Y, y1: Y + H9, z0: cz9 + oz - 0.07, z1: cz9 + oz + 0.07, nc: true }); });
        dRod(cx9 + ox, Y + H9, cz9 - HW, cx9 + ox, Y + H9, cz9 + HW, 0.03, S9);
        [0.45, 0.8].forEach(h9 => dRod(cx9 + ox, Y + h9, cz9 - HW, cx9 + ox, Y + h9, cz9 + HW, 0.022, S9));
        colliders.push(noStand({ x0: cx9 + ox - 0.06, x1: cx9 + ox + 0.06, y0: Y, y1: Y + H9, z0: cz9 - HW - 0.06, z1: cz9 + HW + 0.06 }));
        const sx9 = Math.sign(ox);
        [-HW, HW].forEach(oz => { dRod(cx9 + ox, Y + H9, cz9 + oz, cx9 + ox + sx9 * 0.28, Y + H9, cz9 + oz, 0.025, S9); dRod(cx9 + ox + sx9 * 0.28, Y + H9, cz9 + oz, cx9 + ox + sx9 * 0.28, Y + H9 - 0.32, cz9 + oz, 0.025, S9); }); });
      [-HW, HW].forEach(oz => dRod(cx9 - HL, Y + H9, cz9 + oz, cx9 + HL, Y + H9, cz9 + oz, 0.03, S9));
    }
    {   // FSW-3 계단식 오르기 틀(영상 h_039·h_040.5·h_042 확대: 은회색 격자 세 단 — 앞(동) 낮은 단 1.0 · 뒤(서) 북쪽 절반 1.5 · 그 위 작은 탑 2.3)
      //   자리 = 카메라를 푼 h_039·h_040.5 둘 다 x -39.5 · z 59.4~62.3(남북으로 길게) — 예전 (-44, 58.4)·높이 1m 한 단(FSW-2)
      const cx9 = -39.5, cz9 = 60.9, HL = 1.4, HW = 0.6, G9 = S9;
      const cage9 = (x0, x1, z0, z1, y0, y1, dz) => {   // 한 단: 네 모서리 기둥 + 긴 변 세로살 + 윗·가운데 둘레 + 윗면 가로살
        [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => dRod(x, Y + y0, z, x, Y + y1, z, 0.03, G9));
        [x0, x1].forEach(x => { for (let z = z0 + dz; z < z1 - 0.1; z += dz) dRod(x, Y + y0, z, x, Y + y1, z, 0.018, G9); });
        [y1, (y0 + y1) / 2].forEach(h => { [x0, x1].forEach(x => dRod(x, Y + h, z0, x, Y + h, z1, 0.02, G9)); [z0, z1].forEach(z => dRod(x0, Y + h, z, x1, Y + h, z, 0.02, G9)); });
        for (let z = z0 + dz; z < z1 - 0.1; z += dz) dRod(x0, Y + y1, z, x1, Y + y1, z, 0.018, G9); };
      cage9(cx9 - HW, cx9 + HW, cz9 - HL, cz9 + HL, 0, 1.0, 0.4);                                      // 아래 단(전체)
      cage9(cx9 - HW, cx9 + 0.05, cz9 - HL, cz9 + 0.2, 1.0, 1.5, 0.4);                                  // 가운데 단(서쪽·북쪽 절반)
      cage9(cx9 - 0.5, cx9 - 0.05, cz9 - 0.95, cz9 - 0.5, 1.5, 2.3, 0.45);                              // 작은 탑
      colliders.push(noStand({ x0: cx9 - HW - 0.05, x1: cx9 + HW + 0.05, y0: Y, y1: Y + 1.05, z0: cz9 - HL - 0.05, z1: cz9 + HL + 0.05 }));
      colliders.push(noStand({ x0: cx9 - HW - 0.05, x1: cx9 + 0.1, y0: Y, y1: Y + 2.35, z0: cz9 - HL - 0.05, z1: cz9 + 0.25 }));
    }
    {   // 파랑 테 안내판(글자 없이 — 영상 s_043.5~045: 두 기둥 · 판 앞면은 동쪽 마당을 봄)
      //   FSW-3(09-25 · h_042·h_043.5 카메라 풀이): 다리 둘이 마당 혀 서쪽 경계석 바로 안쪽 포장 위(0.5) · 다리 사이 1.08 · 판 1.1×0.8(아랫변 1.05·윗변 1.9) — 예전 1.6×1.1은 컸다
      const x9 = PX + 0.5, z9 = 54.4;
      [-0.54, 0.54].forEach(o => { dRod(x9, Y, z9 + o, x9, Y + 1.92, z9 + o, 0.035, S9); post(x9, z9 + o, Y, Y + 1.92, 0.06); });
      dBox(0.05, 0.84, 1.12, 0x2f6fd0, x9 - 0.025, Y + 1.05, z9);
      dBox(0.03, 0.74, 1.02, 0xf4f4f0, x9 + 0.015, Y + 1.1, z9);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y + 1.0, y1: Y + 1.92, z0: z9 - 0.56, z1: z9 + 0.56 }));
      [[0, 1.72, 0.92, 0.1, 0x3a78c8], [-0.25, 1.36, 0.42, 0.28, 0x9cc3e0], [0.22, 1.36, 0.46, 0.28, 0xe3b39c], [-0.25, 1.18, 0.42, 0.08, 0x8d8d8d], [0.22, 1.18, 0.4, 0.08, 0x8d8d8d]].forEach(([oz, yy, w, h, c]) => dBox(0.03, h, w, c, x9 + 0.045, Y + yy, z9 + oz));
    }
    {   // FSW-3 그네 둘레 낮은 쇠 난간(영상 h_042·h_043.5·h_046.5 — 미끄럼틀 뒤 'ㄱ'자: 동변 x≈-39.3 · z 47.4~54.7, 남변 z≈55.1 · x -39.5 → 서쪽 울타리)
      //   운동장 쪽 난간(z 45.8)의 동끝 기둥에서 꺾여 그네 자리를 두른다 · 동변 가운데(z 50.5~52.5)는 드나드는 틈(영상에선 안내판·미끄럼틀에 가려 안 보임 — 게임 동선)
      const RX = -39.6, RZ = 55.1, WX = -46.7, rail9 = (x0, z0, x1, z1, skip0) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.9));
        for (let i = skip0 ? 1 : 0; i <= n; i++) { const t = i / n; dRod(x0 + (x1 - x0) * t, Y, z0 + (z1 - z0) * t, x0 + (x1 - x0) * t, Y + 0.72, z0 + (z1 - z0) * t, 0.03, S9); }
        [0.35, 0.7].forEach(h9 => dRod(x0, Y + h9, z0, x1, Y + h9, z1, 0.025, S9));
        colliders.push(noStand({ x0: Math.min(x0, x1) - 0.06, x1: Math.max(x0, x1) + 0.06, y0: Y, y1: Y + 0.75, z0: Math.min(z0, z1) - 0.06, z1: Math.max(z0, z1) + 0.06 })); };
      rail9(RX, 45.8, RX, 50.5, true); rail9(RX, 52.5, RX, RZ); rail9(RX, RZ, WX, RZ, true);   // 첫 기둥이 앞 난간 끝 기둥과 같은 자리면 건너뜀(겹친 봉)
    }
    {   // 남서 구석 나무 둔덕(FSW-2 · 네이버 모래 남끝 z≈64.3 → 그 남쪽 울타리까지 · Esri 나무 무리 게임 -48~-30 · 58~71(겨울 그림자 포함) · 영상 s_036~042 왼쪽: 큰 돌 박은 비탈 + 떨기나무 + 활엽수)
      const sE = x => walkZ(-31) + (x + 31) * (64.3 - walkZ(-31)) / (-12.5);                            // 모래 남끝(둔덕 발치)
      [[-41.4, 67.3, 1.05], [-35.6, 66.6, 0.75]].forEach(([x9, z9, s9]) => { bgTree(x9, z9, s9); colliders[colliders.length - 1].nc = true; });   // 모서리 큰 나무 하나(영상 s_039 왼쪽 끝) + 작은 나무 — 그 너머 하우스 지붕이 보이게 · 둔덕 속 줄기라 카메라만 통과(nc)
      [[-42.3, 65.8, 0.85, 0x3f6f3a], [-39.3, 65.7, 0.95, 0x4a7a40], [-35.3, 65.5, 0.8, 0x3f6f3a], [-31.9, 65.3, 0.75, 0x4f8045]].forEach(([x9, z9, r9, c9]) => shrub(x9, z9, r9, c9, true));
      [-42.8, -41.3, -39.6, -38.0, -36.2, -34.4, -32.8].forEach((x9, k) => { const z9 = sE(x9) + 0.62, w9 = 0.6 + 0.14 * (k % 3), h9 = 0.42 + 0.1 * ((k + 1) % 3);   // 둔덕 발치 큰 돌 줄(영상 s_036~039 왼쪽 — 돌 쌓은 비탈)
        dBlob(w9, h9, 0.42, [0x9d988c, 0xa8a397, 0x8f8a7f][k % 3], x9, Y + h9 * 0.45, z9, { chunky: true, far: true, ry: k * 1.7 });
        ellipseCols(x9, z9, w9, 0.42, k * 1.7, Y, Y + h9, 0.86); });   // [quality4 09-26] 축정렬 상자(돌을 안 돌린 크기) → 돌린 돌 띠: (-41.3) 돌이 97° 돌아 북쪽 끝을 몸이 밟았다(발 묻힘 3칸)
      dBlob(0.58, 0.42, 0.56, 0x979286, -31.35, Y + 0.16, 64.1, { chunky: true, far: true, ry: 0.7 });          // 보도·경계석 서끝을 막는 큰 돌(보도는 둔덕에서 끝남)
      colliders.push(noStand({ x0: -31.87, x1: -30.83, y0: Y, y1: Y + 0.58, z0: 63.58, z1: 64.62 }));
    }
    {   // FSW-3 쉼터 맨 서쪽 칸 = 모래(영상 1920px h_046.5·h_048 확대: 마당 혀 동변 = 밝은 콘크리트 경계석, 그 동쪽 쉼터 첫 칸 밑은 풀 섞인 모래 — 둘째 기둥 줄 전까지)
      //   카메라 풀이 h_046.5: 모래 동끝 x ≈ -28.9(화면 끝) · 쉼터 기둥 x -30.5·-27.0 → 첫 칸 x -30.75~-27.2 · z 44.5(쉼터 북변)~49.2(휴지통 남쪽) — 보도블록(+0.02) 위 1cm(+0.03, 바닥 그림과 같은 층)
      const bx0 = -30.75, bx1 = -27.2, bz0 = SCHOOL.plaza.z[0], bz1 = 49.2, KB = 0xcfccc4;
      patQuad('sand', bx0, bx1, bz0, bz1, Y + 0.03);
      dBox(0.12, 0.045, bz1 - bz0 - 0.12, KB, bx0 - 0.06, Y, (bz0 + bz1 - 0.12) / 2);                    // 혀 동변 콘크리트 경계석 — 4.5cm(발 묻힘 검사 층 아래)
      dBox(bx1 - bx0 + 0.12, 0.045, 0.12, KB, (bx0 + bx1) / 2, Y, bz1 - 0.06);                  // 남변
      [[-29.6, 46.2, 0.3], [-28.2, 47.6, 0.25], [-30.1, 48.4, 0.22]].forEach(([x9, z9, r9]) => dBlob(r9, 0.035, r9 * 0.8, 0x7fa35a, x9, Y + 0.01, z9, { jitter: 0.2 }));   // 풀 포기(영상 h_046.5)
    }
    zones.push({ x0: -48.5, x1: PX, z0: 45.8, z1: 69.3, y: Y, label: '놀이터' });                     // FSW-2: 남서 구석(울타리 모서리 z 69.3)까지
  }
  const FNC = 0x8dbb5a, FNP = 0x7fae4f;   // 이 구역 철망 = 밝은 연두 용접망 + 둥근 기둥(영상 g_087~100)
  {   // 유치원 놀이터(네이버 항공 울타리 사각형 · 영상 g_060~085): 풀 섞인 모래 + 조합놀이대(야자수 기둥·육각 지붕 탑 둘·미끄럼틀 4) + 흔들말 + 파랑 그늘막 + 연두 울타리
    const KP = SCHOOL.kinderPlayground, kpx = (KP.x[0] + KP.x[1])/2, kpz = (KP.z[0] + KP.z[1])/2, Y = FIELD, KW = KP.x[1] - KP.x[0], KD = KP.z[1] - KP.z[0];
    patQuad('dirt', KP.x[0] + 0.15, KP.x[1] - 0.15, KP.z[0] + 0.15, KP.z[1] - 0.15, Y + 0.008, false, 0xc9cf9e);   // 풀 섞인 모래(영상 g_072~076 — 누런 모래에 풀 기운)
    {   // 조합놀이대(영상 g_066~076): 놀이터 가운데~서쪽 4.5×3.5 m — 탑 A(발판 1.2 · 육각 지붕) + 탑 B(발판 1.5 · 육각 지붕) · 서쪽 야자수 기둥
      const cx = kpx - 1.3, cz = kpz + 1.4, F9 = { far: true }, PU = 0x6d5fb0, TL = 0x3f9a7a;   // 남쪽 울타리 바로 뒤(영상 g_069~075)
      const zA = cz + 0.2, zB = cz - 1.0;                                                  // 탑 A(남)·탑 B(북) 발판 가운데 z — 두 발판은 맞대기만
      addBox(1.2, 0.15, 1.2, 0x3a6ea5, cx, Y + 1.05, zA); addBox(1.2, 0.15, 1.2, 0x3a6ea5, cx, Y + 1.35, zB);
      [[-0.55, zA + 0.55], [0.55, zA + 0.55], [-0.55, zA - 0.55], [0.55, zA - 0.55]].forEach(([ox, z9]) => { dRod(cx + ox, Y, z9, cx + ox, Y + 2.6, z9, 0.05, PU, F9); colliders.push(noStand({ x0: cx + ox - 0.06, x1: cx + ox + 0.06, y0: Y, y1: Y + 2.6, z0: z9 - 0.06, z1: z9 + 0.06 })); });
      [[-0.55, zB - 0.55], [0.55, zB - 0.55]].forEach(([ox, z9]) => { dRod(cx + ox, Y, z9, cx + ox, Y + 3.0, z9, 0.05, PU, F9); colliders.push(noStand({ x0: cx + ox - 0.06, x1: cx + ox + 0.06, y0: Y, y1: Y + 3.0, z0: z9 - 0.06, z1: z9 + 0.06 })); });   // [quality4 09-26] 기둥 막이 = 발판 위 봉 끝까지(예전 발판 밑까지 — 발판 위에서 봉을 뚫음 ghost) · 올라서기 금지(NS-RAISE가 발판+1.6까지)
      dCyl(0, 0.92, 0.85, TL, cx, Y + 2.6, zA, { far: true, seg: 6 }); dBlob(0.11, 0.11, 0.11, 0xf2c230, cx, Y + 3.5, zA, { chunky: true, far: true });
      dCyl(0, 0.8, 0.7, TL, cx, Y + 3.0, zB - 0.05, { far: true, seg: 6, rot: [0, 0.5, 0] });
      dBox(0.6, 0.9, 0.06, 0x3563c9, cx - 0.28, Y + 0.12, zA + 0.63);                      // 파랑 장난감 벽판(주판 알 — 영상 g_072)
      [0x3a9d5d, 0xe24b4b, 0xf2c230].forEach((c9, r) => { for (let k = 0; k < 3; k++) dBlob(0.05, 0.05, 0.03, c9, cx - 0.46 + k * 0.18, Y + 0.45 + r * 0.2, zA + 0.68, { chunky: true }); });
      dCyl(0.42, 0.42, 0.8, 0xf2c230, cx + 1.0, Y + 1.5 + 0.42, zB, { far: true, seg: 10, rot: [0, 0, Math.PI / 2] });   // 노랑 터널(탑 B 동쪽) — 눕힌 원기둥은 밑면에서 −x로 뻗어 cx+0.2~1.0: 서쪽 절반이 탑 B 동쪽 두 기둥 사이 지붕 밑(영상 g_072·g_073.5 — 자리 그대로)
      colliders.push(noStand({ x0: cx + 0.3, x1: cx + 1.0, y0: Y + 1.5, y1: Y + 2.34, z0: zB - 0.4, z1: zB + 0.4 }));   // [quality4 09-26] 터널 막이(몸 1.5는 기어 지나가지 못함 — 예전 충돌 없음 ghost) · 서끝만 입구(cx+0.2)보다 0.1 안: 부풀림 0.26 → 몸 중심 ≤ cx+0.04 — 탑 가운데 줄(cx)·길격자 열 x −47.1(cx−0.05)로 A→B가 이어지고 터널 속 열(cx+0.25)은 막힘(cx+0.2면 A→B 열이 1cm 차로 끊김 · cx+0.6이면 몸이 입구 속 0.4 — ghost·발 묻힘)
      addBox(0.8, 0.15, 0.9, 0x3a6ea5, cx + 1.0, Y + 1.35, zB);
      [[0.75, 0.6], [0.4, 0.9]].forEach(([h9, z9]) => addBox(0.5, h9, 0.3, 0x3a6ea5, cx + 0.3, Y, zA + z9 + 0.15));   // 올라가는 발판 2단(남쪽 — 발판 0.75·0.4)
      {   // 야자수 기둥(서쪽 — 영상 g_072: 보라 봉 + 초록 잎 5장)
        const px9 = cx - 1.9, pz9 = zA - 0.2;
        dRod(px9, Y, pz9, px9, Y + 3.3, pz9, 0.08, PU, F9); post(px9, pz9, Y, Y + 3.3, 0.12);   // [quality4 09-26] 막이 2.2 → 봉 끝 3.3: 흰 미끄럼틀 꼭대기(−0.15)에서 점프로 막이 윗면(0.85)에 올라앉았다(perch 6칸)
        for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3; dBlob(0.68, 0.07, 0.22, k % 2 ? 0x3f8f6a : 0x4fa070, px9 + Math.cos(a) * 0.56, Y + 3.3 - 0.12, pz9 + Math.sin(a) * 0.56, { far: true, ry: -a }); }
        dBlob(0.16, 0.14, 0.16, 0x3f8f6a, px9, Y + 3.35, pz9, { far: true, chunky: true });
      }
      // 미끄럼틀(바닥판 + 양옆 턱) — 두 점 사이 기운 판. 충돌 = 발판 아래 부분만 올라서기 금지 상자로(뚫고 지나가지 않게)
      const bed = (x0, y0, z0, x1, y1, z1, w, col, rail) => {
        const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, hz = Math.hypot(dx, dz), Ls = Math.hypot(hz, dy);
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.atan2(-dy, hz), Math.atan2(dx, dz), 0, 'YXZ')), c = new THREE.Vector3((x0 + x1)/2, (y0 + y1)/2, (z0 + z1)/2);
        const part = (sx, sy, ox, oy) => dGeo(box_, new THREE.Matrix4().compose(c.clone().add(new THREE.Vector3(ox, oy, 0).applyQuaternion(q)), q, new THREE.Vector3(sx, sy, Ls)), sx > 0.1 ? col : rail, F9);
        part(w, 0.06, 0, 0); part(0.05, 0.2, -w/2 - 0.025, 0.07); part(0.05, 0.2, w/2 + 0.025, 0.07);
        const n9 = Math.max(1, Math.ceil(hz / 0.35));                                     // 충돌 = 판 밑을 채운 계단(아이처럼 거꾸로 걸어 올라갈 수 있고, 밑으로는 못 지나간다)
        for (let k = 0; k < n9; k++) { const t0 = k / n9, t1 = (k + 1) / n9, xa = x0 + dx * t0, xb = x0 + dx * t1, za = z0 + dz * t0, zb = z0 + dz * t1;
          colliders.push({ x0: Math.min(xa, xb) - w/2 + 0.05, x1: Math.max(xa, xb) + w/2 - 0.05, y0: Y, y1: y0 + dy * (t0 + t1) / 2, z0: Math.min(za, zb) - w/2 + 0.05, z1: Math.max(za, zb) + w/2 - 0.05 }); }
      };
      const wave = (x0, z0, x1, z1, w, col, rail) => { const P9 = [[0, 1.2], [0.38, 0.62], [0.58, 0.7], [1, 0.12]].map(([t, h]) => [x0 + (x1 - x0) * t, Y + h, z0 + (z1 - z0) * t]);
        for (let k = 0; k < 3; k++) bed(...P9[k], ...P9[k + 1], w, col, rail); };
      wave(cx + 0.6, zA - 0.25, cx + 3.3, zA + 1.2, 0.5, 0xd9869a, 0xc76f86);                // 분홍 물결 미끄럼틀 둘(동남쪽 — 영상 g_072·g_075)
      wave(cx + 0.6, zA + 0.35, cx + 3.1, zA + 1.9, 0.5, 0xd9869a, 0xc76f86);
      bed(cx + 1.4, Y + 1.5, zB - 0.1, cx + 3.8, Y + 0.12, zB - 0.5, 0.55, 0x4a7fd6, 0x3a6ab8); // 파랑 곧은 미끄럼틀(터널 → 동쪽)
      bed(cx - 0.6, Y + 1.2, zA + 0.2, cx - 1.25, Y + 0.8, zA + 0.95, 0.5, 0xeeeeea, 0xd9d9d4);   // 흰 굽은 미끄럼틀(서쪽 — 영상 g_069·g_072)
      bed(cx - 1.25, Y + 0.8, zA + 0.95, cx - 1.35, Y + 0.12, zA + 2.2, 0.5, 0xeeeeea, 0xd9d9d4);
      {   // 회색 원통 나선 미끄럼틀(뒤쪽 — 영상 g_073.5·g_076.5)
        const pts = [[0.1, 1.85, zB - 0.7], [-0.4, 1.45, zB - 1.5], [-1.2, 1.0, zB - 1.7], [-1.8, 0.55, zB - 1.1], [-1.95, 0.4, zB - 0.3]].map(([ox, h, z9]) => new THREE.Vector3(cx + ox, Y + h, z9));
        dGeo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.33, 8, false), new THREE.Matrix4(), 0xb8bcc0, F9);
        pts.forEach(v => colliders.push(noStand({ x0: v.x - 0.33, x1: v.x + 0.33, y0: Y, y1: Math.max(v.y + 0.33, Y + 1.6), z0: v.z - 0.33, z1: v.z + 0.33 })));   // [quality4 09-26] 첫 점(탑 B 발판 위 관 입구)도 — 발판에서 관을 뚫던 ghost
      }
      hotspots.push({ kind: 'slide', x: cx + 0.3, z: zA, y: Y + 1.2, r: 1.0, label: '미끄럼틀 타기', from: [cx + 0.6, Y + 1.2, zA - 0.25], to: [cx + 3.4, Y, zA + 1.3] });
    }
    [[kpx + 2.2, kpz - 2.3, 0xd97a5a], [kpx + 3.0, kpz - 0.9, 0x5a8fd9]].forEach(([rx9, rz9, c9]) => {   // 스프링 흔들 말
      colliders.push(noStand({ x0: rx9 - 0.3, x1: rx9 + 0.3, y0: Y, y1: Y + 0.5, z0: rz9 - 0.3, z1: rz9 + 0.3 }));
      dBox(0.5, 0.04, 0.5, 0x8a9096, rx9, Y, rz9);
      dCyl(0.1, 0.12, 0.3, 0x3a3d44, rx9, Y + 0.04, rz9, { seg: 8 });
      dBlob(0.34, 0.18, 0.18, c9, rx9, Y + 0.5, rz9, { chunky: true });
      dBlob(0.13, 0.15, 0.13, c9, rx9 + 0.3, Y + 0.67, rz9, { chunky: true });
      dRod(rx9 + 0.22, Y + 0.75, rz9 - 0.14, rx9 + 0.22, Y + 0.75, rz9 + 0.14, 0.02, 0xf2c230);
    });
    {   // 파랑 그늘막(영상 g_069~081 — 놀이터 북동)
      const sx9 = KP.x[1] - 2.0, sz9 = KP.z[0] + 2.3;
      [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([ox, oz]) => { dRod(sx9 + ox, Y, sz9 + oz, sx9 + ox, Y + 2.4, sz9 + oz, 0.05, 0xdfe3e8, { far: true }); post(sx9 + ox, sz9 + oz, Y, Y + 2.4, 0.06); });
      dCyl(0, 2.2, 0.7, 0x2f6fd0, sx9, Y + 2.4, sz9, { far: true, seg: 4, rot: [0, Math.PI/4, 0] });
    }
    // 울타리 1.5 m 밝은 연두(영상 g_075~088) — 동쪽은 한 줄, 출입문 = 북쪽 울타리 동끝 1.2 m(계단 앞 보도블록 쪽으로 열린 문짝)
    const GT0 = KP.x[1] - 1.5, GT1 = KP.x[1] - 0.3;
    meshFence(KP.x[0], KP.z[0], GT0, KP.z[0], Y, 1.5, FNC, FNP);
    meshFence(GT1 - 0.01, KP.z[0], KP.x[1], KP.z[0], Y, 1.5, FNC, FNP, false);   // 경첩 쪽 0.3 토막(0.3 딱이면 길이 0 판정에 걸려 안 그려짐 → 1cm 늘림 · 충돌은 문짝·동쪽 울타리가 맡음)
    meshFence(KP.x[0], KP.z[1], KP.x[1], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(KP.x[0], KP.z[0], KP.x[0], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(KP.x[1], KP.z[0], KP.x[1], KP.z[1], Y, 1.5, FNC, FNP);
    meshFence(GT1, KP.z[0] - 0.05, GT1 + 0.1, KP.z[0] - 1.15, Y, 1.3, FNC, FNP, false);   // 열어 둔 문짝(바깥으로 활짝 — 문 폭을 가리지 않게 경첩 동쪽으로)
    colliders.push({ x0: GT1 - 0.02, x1: GT1 + 0.22, y0: Y, y1: Y + 3, z0: KP.z[0] - 1.27, z1: KP.z[0] + 0.12, nc: true });   // 문짝 충돌 = 경첩(GT1) 동쪽만 → 지나갈 폭 = 서쪽 울타리 끝~GT1 전부(몸 중심 띠 0.54 m — 4cm 훑기 x -42.62~-42.10 전 z)
    dBox(0.04, 0.7, 0.9, 0x2f62b8, KP.x[1] + 0.08, Y + 0.6, KP.z[0] + 1.6);                // 파랑 게시판(동쪽 울타리 — 영상 g_084)
    dBox(0.03, 0.5, 0.7, 0xf2f0ea, KP.x[1] + 0.115, Y + 0.72, KP.z[0] + 1.6);
    dCyl(0.05, 0.05, 1.7, 0x9aa0a6, KP.x[1] + 0.35, Y, KP.z[1] - 0.35, { seg: 6 }); post(KP.x[1] + 0.35, KP.z[1] - 0.35, Y, Y + 1.7, 0.06);   // 동남 모서리 둥근 머리 안내판(영상 g_075·g_076.5)
    dCyl(0.32, 0.32, 0.04, 0xeef2f4, KP.x[1] + 0.35, Y + 1.75, KP.z[1] - 0.35, { seg: 14, rot: [0, 0, Math.PI / 2], far: true });
    // 검은 배수 띠 + 흰 경계석(동·남 울타리 밖 — 영상 g_072~078)
    addPanel(0.45, KD + 0.5, 0x4a4c4a, KP.x[1] + 0.28, Y + 0.015, kpz + 0.25); dBox(0.12, 0.08, KD + 0.62, 0xdad6cc, KP.x[1] + 0.56, Y, kpz + 0.31);
    addPanel(KW + 0.05, 0.45, 0x4a4c4a, kpx - 0.025, Y + 0.015, KP.z[1] + 0.275); dBox(KW + 0.55, 0.08, 0.12, 0xdad6cc, kpx + 0.225, Y, KP.z[1] + 0.56);
    sign('유치원 놀이터', kpx, Y + 1.8, KP.z[0] - 0.2, 0, 0.32);
    zones.push({ x0: KP.x[0], x1: KP.x[1], z0: KP.z[0], z1: KP.z[1], y: Y, label: '유치원 놀이터' });
  }
  {   // 운동장 → 체육관 대지 화강석 계단 7단(영상 g_082~091) — 대지 남면(z westZ)에서 운동장으로 내민 계단
      //   서쪽 = 옹벽 돌면이 계단 끝까지(볼벽 없음) · 동쪽 = 계단 따라 내려오는 볼벽 3토막 + 콘크리트 갓 · 발치 = 보도블록 앞마당 + 검은 배수 띠(영상 g_084~091)
    const GS = SCHOOL.gymStairs, Z = TR3.westZ, R = YARD - FIELD, KP = SCHOOL.kinderPlayground;
    for (let i = 0; i < 6; i++) addBox(GS.x[1] - GS.x[0], R * (6 - i) / 7, 0.3, 0xb8b4ac, (GS.x[0] + GS.x[1])/2, FIELD, Z + 0.15 + 0.3 * i);
    [1.15, 0.9, 0.6].forEach((h, k) => { const z9 = Z + 0.3 + 0.6 * k;
      addBox(0.3, h, 0.6, 0x8f8a80, GS.x[1] + 0.15, FIELD, z9);
      dBox(0.34, 0.06, 0.6, 0xa29d92, GS.x[1] + 0.15, FIELD + h, z9);
      patWall('stoneW', 'z', z9 - 0.3, z9 + 0.3, FIELD, FIELD + h, GS.x[1] + 0.312, 1); });
    patQuad('pave', KP.x[0], GS.x[1] + 0.3, Z, KP.z[0] - 0.1, FIELD + 0.012);             // 계단 앞 색 보도블록 앞마당(옹벽 발치 따라 놀이터 북쪽 울타리까지)
    addPanel(0.36, KP.z[0] - 0.1 - (Z + 1.0), 0x4a4c4a, GS.x[1] + 0.48, FIELD + 0.015, (Z + 1.0 + KP.z[0] - 0.1)/2);   // 볼벽 동쪽 발치 배수 띠(비탈 밑으로 들어가는 곳부터)
    // 체육관 옆길 동쪽: 콘크리트 턱(0.35) 위 초록 철망 1.8 — 현관 참 남쪽 끝~계단 위(영상 g_091~115) · 서쪽 = 계단 서끝에서 부속동 남동 모서리까지 철망(체육관 남쪽 띠 마당은 막힘 — g_090·g_091.5)
    const CB0 = -19.5;
    addBox(0.3, 0.35, Z - CB0, 0x9c978c, TR3.westX - 0.15, YARD, (CB0 + Z)/2);
    meshFence(TR3.westX - 0.15, CB0, TR3.westX - 0.15, Z, YARD + 0.35, 1.8, FNC, FNP);
    meshFence(-86, Z - 0.15, GS.x[0] - 0.3, Z - 0.15, YARD, 1.5, FNC, FNP);
    meshFence(GS.x[0] - 0.3, Z - 0.15, GS.x[0] - 0.3, G.annex.z[1] + 0.2, YARD, 1.5, FNC, FNP);
    meshFence(GS.x[0] - 0.3, G.annex.z[1] + 0.2, G.annex.x[1] + 0.15, G.annex.z[1] + 0.2, YARD, 1.5, FNC, FNP);
    colliders.push({ x0: GS.x[0] - 0.42, x1: GS.x[0] - 0.18, y0: YARD + 3, y1: YARD + 6, z0: G.annex.z[1] + 0.08, z1: Z - 0.03, nc: true },   // 부속동 차양 남끝 옆 철망 윗면에 못 올라서게(점프로 차양 위 도달 차단)
                   { x0: G.annex.x[1] + 0.03, x1: GS.x[0] - 0.18, y0: YARD + 3, y1: YARD + 6, z0: G.annex.z[1] + 0.08, z1: G.annex.z[1] + 0.32, nc: true });
    dBox(0.03, 1.0, 3.2, 0xf2f2ee, TR3.westX - 0.12, YARD + 0.75, -15.5);                     // 철망 흰 현수막(영상 g_099·g_100.5)
    // 체육관 옆길(보도블록 — 계단 위 → 현관 참 북쪽 끝 · 영상 g_091~102) + 맨홀 · 그 북쪽·현관 앞·본관 서쪽 = 아스팔트 앞마당(영상 g_100~120)
    const PX0 = G.annex.x[1] + 1.45, PX1 = TR3.westX - 0.3, PZ0 = GCZ0 - 0.4, AX0 = G.annex.x[1] + 0.15, WE = fx0 - 0.15;
    patQuad('pave', PX0, PX1, PZ0, Z - 0.3, YARD + 0.012);
    [[-41.4, -7.5], [-41.3, -13]].forEach(([x9, z9]) => dCyl(0.3, 0.3, 0.02, 0x4b3f35, x9, YARD + 0.013, z9, { seg: 12 }));
    [[gx1 + 0.15, WE, G.annex.z[0] - 3, G.annex.z[0] - 0.15],                                   // 부속동 북쪽(체육관|본관 사이 길 남끝)
     [AX0, WE, G.annex.z[0] - 0.15, fzW], [AX0, -39.2, fzW, PZ0], [PX1, -39.2, PZ0, -19.5],     // 부속동 동쪽 · 현관 앞 · 철망 북끝 앞
     [-39.2, -38.5, -19.62, -19.5], [TR3.westX, -38.5, -19.5, TERR_Z], [TR3.westX, -36, TERR_Z, -10],   // 산책로 서끝 · 운동장 쪽 앞마당(비탈 위까지)
     [TR3.westX - 0.3, WE, gz0 - 0.15, G.annex.z[0] - 3], [gx1 + 0.15, AX0, gz0 - 0.15, G.annex.z[0] - 3]].forEach(([a, b, c, d]) => patQuad('asph', a, b, c, d, YARD + 0.012));
    zones.push({ x0: GS.x[0], x1: GS.x[1], z0: Z, z1: Z + 1.8, y: FIELD + 0.5, label: '체육관 계단' });
    zones.push({ x0: G.annex.x[1], x1: TR3.westX, z0: PZ0, z1: Z, y: YARD, label: '체육관 옆길' });
    zones.push({ x0: G.annex.x[1], x1: WE, z0: gz0, z1: PZ0, y: YARD, label: '체육관 앞 마당' });
    zones.push({ x0: TR3.westX, x1: -38.5, z0: PZ0, z1: Math.min(-9.5, SCHOOL.field.z[0]), y: YARD, label: '체육관 앞 마당' });   // [integ] x0 = 옆길 동끝·z1 = 운동장 북끝(겹침 제거)
    { const KP = SCHOOL.kinderPlayground, x0 = SCHOOL.field.x[0], x1 = TR3.westX;   // 운동장 서쪽 띠(놀이터 남·북·계단 앞 — 예전엔 '학교') — [integ] 유치원 놀이터 칸을 비워 겹침 0(계약표 multi: field-2…)
      zones.push({ x0, x1, z0: Z, z1: KP.z[0], y: FIELD, label: '운동장' }, { x0, x1, z0: KP.z[1], z1: SCHOOL.southFenceZ, y: FIELD, label: '운동장' });
      if (KP.x[1] < x1) zones.push({ x0: KP.x[1], x1, z0: KP.z[0], z1: KP.z[1], y: FIELD, label: '운동장' }); }
  }
  {   // 운동장 북서 모서리(영상 g_079~120): 둔덕·옹벽 대신 대지 높이 앞마당(아스팔트 + 주황 볼라드 2) → 흙 비탈(z -10 → -3)로 운동장까지
      //   동쪽 끝(x -30~-27)은 옆으로도 흙 비탈(둔덕은 -27부터). 높이는 terrainAt이 같은 식으로 준다(물리·놓기)
    const XE = -30, XS = -27, ZT = -10, ZB = -3;
    addBox(XE - TR3.westX, YARD - FIELD, ZT - TERR_Z, SITE, (TR3.westX + XE)/2, FIELD, (TERR_Z + ZT)/2);   // 대지 높이 앞마당 몸체(x westX~-30 · z TERR_Z~-10)
    patQuad('dirt', -36, XE, TERR_Z, ZT, YARD + 0.012);
    slope('dirt', 'z', TR3.westX, XE, ZT, ZB, YARD, FIELD, 10);
    slope('dirt', 'x', TERR_Z, ZT, XE, XS, YARD, FIELD, 4);
    patPush('dirt', [[XE, YARD, ZT], [XE, FIELD, ZB], [XS, FIELD, ZT], [XS, FIELD, ZT]], [[XE/4, -ZT/4], [XE/4, -ZB/4], [XS/4, -ZT/4], [XS/4, -ZT/4]], [0, 1, 0], 0xffffff);   // 모서리 세모 비탈
    slopeCap('stoneW', TR3.westX + 0.012, 1, TR3.westZ, ZT, YARD + (FIELD - YARD) * (TR3.westZ - ZT) / (ZB - ZT), YARD);   // 대지 동면 돌 옹벽(비탈 위로 드러난 세모 — 계단 쪽으로 높아짐)
    {   // 큰 적송(영상 g_115.5~120·g_081~085: 조명탑 기둥 바로 동쪽 — 기울어 갈라진 붉은 갈색 줄기 + 넓고 성긴 우산형 수관, 키 ≈7 m)
      const x9 = -34.7, z9 = -15.2, R7 = seeded(3517), up = (x, y, z, rx, rz, L) => [x - Math.sin(rz) * L, y + Math.cos(rz) * Math.cos(rx) * L, z + Math.sin(rx) * L];
      colliders.push({ x0: x9 - 0.25, x1: x9 + 0.25, y0: YARD, y1: YARD + 12, z0: z9 - 0.25, z1: z9 + 0.25 });
      dCyl(0.14, 0.21, 3.0, 0x8a5a3e, x9, YARD, z9, { far: true, rot: [0.1, 0, -0.25] });
      const T1 = up(x9, YARD, z9, 0.1, -0.25, 3.0);
      [[-0.1, -0.45, 2.6], [0.25, 0.3, 2.3]].forEach(([rx, rz, L], k) => { dCyl(0.08, 0.13, L, 0x8a5a3e, ...T1, { far: true, rot: [rx, 0, rz] });
        const T2 = up(...T1, rx, rz, L);
        for (let j = 0; j < 3; j++) { const a = R7() * 6.28, d = 0.4 + R7() * 0.8, h = -0.3 + j * 0.45;
          dBlob(1.25 - j * 0.2, 0.26, 0.95 - j * 0.12, [0x3f6b3c, 0x4a7644, 0x436f3f][(j + k) % 3], T2[0] + Math.cos(a) * d, T2[1] + h, T2[2] + Math.sin(a) * d, { far: true, ry: a, jitter: 0.12 }); } });
    }
    [[-39.4, ZT - 0.35], [-37.0, ZT - 0.35]].forEach(([x9, z9]) => {                       // 주황 볼라드 + 흰 반사띠(영상 g_084~088)
      dCyl(0.09, 0.15, 0.62, 0xe8742c, x9, YARD, z9, { seg: 10, far: true }); dBlob(0.1, 0.09, 0.1, 0xe8742c, x9, YARD + 0.62, z9, { far: true });
      dCyl(0.125, 0.135, 0.08, 0xf2f2f2, x9, YARD + 0.42, z9, { seg: 10 });
      colliders.push(noStand({ x0: x9 - 0.18, x1: x9 + 0.18, y0: YARD, y1: YARD + 0.75, z0: z9 - 0.18, z1: z9 + 0.18 })); });
  }
  {   // 운동장 서쪽 경계(영상 g_060~069·f_252): 1.8 철망 위 높이 7 m 공막이 그물 + 바로 뒤 빽빽한 생울타리 + 하우스 동쪽 나무 무리(위성 A: x -58~-46 · z -2.5~17)
    //   FSW-2(09-24): 공막이 그물은 운동장 옆 곧은 구간만 — 남끝 = 울타리가 비스듬히 꺾이는 곳(z 43.3 · 끝기둥 버팀대 s_046.5·s_051), 북끝 = 유치원 놀이터 남쪽(g_069·g_072: 놀이터·체육관 앞엔 높은 기둥 없음)
    //   높이 = 운동장 위 약 6.0(s_054 수평선 측량 5.96/6.0/6.0 · 아래 철망 1.8 위 4.2)
    //   FSW-3(09-25): 남끝 43.3 → 37.0 · 윗선 6.5 — 1920px h_046.5·h_051 카메라 풀이(운동장 경계석·혀 서변·조명탑·체육관 끝으로 검산)에서 버팀대 달린 끝기둥 z 36.9·37.3, 기둥 사이 ≈3.2, 기둥 키 6.6
    //   (s_051 끝기둥 방위 301° — 예전 43.3이면 285°라 화면 왼쪽 끝에 걸린다) · 끝기둥 남쪽(z 37~43.5)은 1.8 철망만
    const NZ0 = 37.0, NZ1 = SCHOOL.kinderPlayground.z[1] + 1.0;
    meshFence(-50.5, NZ0, -50.5, NZ1, FIELD + 1.8, 4.7, 0x33413a, 0x6f9a5a, false);
    dRod(-50.5, FIELD + 4.6, NZ0, -50.5, FIELD, NZ0 + 2.2, 0.045, 0x6f9a5a, { far: true });          // 끝기둥 버팀대(울타리 선 따라 남쪽으로 · 영상 h_051 확대)
    dRod(-50.5, FIELD + 4.6, NZ1, -50.5, FIELD, NZ1 - 2.1, 0.045, 0x6f9a5a, { far: true });
    { const n9 = Math.max(1, Math.round((NZ0 - NZ1) / 3)); for (let i = 0; i <= n9; i++) { const z9 = NZ0 + (NZ1 - NZ0) * i / n9; dRod(-50.5, FIELD, z9, -50.5, FIELD + 1.8, z9, 0.045, 0x6f9a5a, { far: true }); } }   // FSW-3: 그물 기둥 아랫도막(땅까지 — 영상 h_051: 굵은 기둥이 바닥부터 · 윗도막은 meshFence가 1.8부터)
    for (let z9 = 16.2, k = 0; z9 <= 43; z9 += 1.25, k++) dBlob(0.42 + 0.1 * (k % 3), 0.3 + 0.06 * (k % 2), 0.4, [0x9d988c, 0x8f8a7f, 0xa8a397][k % 3], -51.2 - 0.12 * (k % 2), FIELD + 0.12, z9, { chunky: true, ry: k, at: [-45, 29] });   // FSW-2: 그물 뒤 비탈 발치 돌(영상 s_054~057 왼쪽 아래) — near 층(가까이서만)
    for (let z9 = 1.5, k = 0; z9 <= 41; z9 += 2.2, k++) dBlob(1.6, 1.4, 1.5, k % 2 ? 0x2f4a33 : 0x3a5a3c, -52.3 - (k % 3) * 0.3, FIELD + 1.3, z9, { far: true, chunky: true, jitter: 0.18, ry: k });   // FSW-2: 20면(먼 시점 삼각형 — 하우스를 늘린 만큼 덜어냄) · 윗선 2.7(영상 g_060: 생울타리 위로 하우스 지붕이 보인다)
    [[-55.5, -1, 1.2], [-52.6, 3, 1.1], [-55.5, 7.5, 1.25], [-52.6, 12, 1.05], [-55.2, 16.5, 1.15]].forEach(([x9, z9, s9]) => bgTree(x9, z9, s9));
  }
  {   // 무지개 쉼터 + 놀이마당(SOUTH-2 · 영상 s_006~049 · 위성 색 지붕 z 44.5~49)
    //   쉼터 = 둥근 기둥 11쌍(아래 2m 나뭇결 덮개 + 위 스테인리스·까치발) + 얕은 아치 지붕(처마 2.6·가운데 3.3 — 윗면 색 칸, 아랫면 짙은 회갈색 s_022~027)
    //   놀이마당 = 짙은 회색 보도블록(쉼터 밑부터) · 남쪽 = 검은 고무 경계석 + 모래 띠(동쪽으로 뾰족) + 울타리 따라 좁은 보도 + 잔디 띠
    const [sx9, sz9] = SCHOOL.shelter.center, sl = SCHOOL.shelter.length, RB = [0x6cc070, 0xf0a04b, 0x6fb3e0], Y = FIELD, PZ = SCHOOL.plaza, RUB = 0x2a2b2d;
    const sxa = sx9 - sl / 2, sxb = sx9 + sl / 2, RR = 4.46, AL = 0.568, YC = 3.3 - RR;   // 아치: 반지름 4.46·반각 0.568 → 폭 4.8·솟음 0.7
    const archY = dz => Y + YC + Math.sqrt(RR * RR - dz * dz);
    for (let k = 0; k <= 10; k++) {
      const px9 = sxa + 0.5 + k * 3.5;
      [-1, 1].forEach(sg => { const pz9 = sz9 + sg * 1.7, yt = archY(1.7);
        dCyl(0.1, 0.1, 2.0, 0xa8602e, px9, Y, pz9, { far: true, seg: 8 });                               // 나뭇결 덮개(영상 s_025 주황 갈색)
        dCyl(0.07, 0.07, yt - Y - 2.0, 0xc9ced3, px9, Y + 2.0, pz9, { far: true, seg: 8 });                // 스테인리스
        dRod(px9, Y + 2.35, pz9, px9, archY(2.25) - 0.02, sz9 + sg * 2.25, 0.03, 0xc9ced3, { far: true });   // 까치발(처마 쪽)
        post(px9, pz9, Y, Y + 2.9, 0.1); });
    }
    [-1, 1].forEach(sg => dRod(sxa + 0.2, archY(1.7) - 0.05, sz9 + sg * 1.7, sxb - 0.2, archY(1.7) - 0.05, sz9 + sg * 1.7, 0.05, 0xc9ced3, { far: true }));   // 기둥 줄 도리
    {   // 지붕: 3m 칸 12개(서쪽부터 초록·주황·파랑 — 위성 색 칸) · 윗면(바깥을 봄)과 아랫면(같은 곡면을 뒤집어 아래를 봄)
      const top9 = new THREE.CylinderGeometry(RR, RR, 3.0, 8, 1, true, Math.PI / 2 - AL, 2 * AL).rotateZ(Math.PI / 2), under9 = top9.clone().scale(1, 1, -1);
      for (let k = 0; k < sl / 3; k++) { const m9 = new THREE.Matrix4().makeTranslation(sxa + 1.5 + 3 * k, Y + YC, sz9);
        dGeo(top9, m9, RB[k % 3], { far: true }); dGeo(under9, m9, 0x7a7268, { far: true }); }
      [-1, 1].forEach(sg => dRod(sxa, Y + 2.6, sz9 + sg * 2.4, sxb, Y + 2.6, sz9 + sg * 2.4, 0.045, 0xe9e7e0, { far: true }));   // 처마 끝 테
      [sxa, sxb].forEach(ex9 => { for (let i = 0; i < 8; i++) { const a0 = -AL + 2 * AL * i / 8, a1 = -AL + 2 * AL * (i + 1) / 8;   // 양 끝 아치 윤곽
        dRod(ex9, Y + YC + RR * Math.cos(a0), sz9 + RR * Math.sin(a0), ex9, Y + YC + RR * Math.cos(a1), sz9 + RR * Math.sin(a1), 0.045, 0xe9e7e0, { far: true }); } });
      colliders.push({ x0: sxa, x1: sxb, y0: Y + 2.6, y1: Y + 3.3, z0: sz9 - 2.4, z1: sz9 + 2.4 });   // 카메라가 지붕을 뚫지 않게(사람 머리엔 안 닿음)
    }
    [sxb - 2.3, sxb - 5.8].forEach(bx9 => {   // 짧은 벤치 둘(동쪽 두 칸 가운데 — 영상 g_006.5·f_249: 짙은 나무 판 + 검은 쇠 다리, 등받이 없음)
      dBox(3.2, 0.06, 0.42, 0x5a3e2c, bx9, Y + 0.4, sz9);
      [-1.4, 1.4].forEach(o => dBox(0.06, 0.4, 0.36, 0x2b2d30, bx9 + o, Y, sz9));
      colliders.push({ x0: bx9 - 1.6, x1: bx9 + 1.6, y0: Y, y1: Y + 0.46, z0: sz9 - 0.21, z1: sz9 + 0.21 });
      hotspots.push({ kind: 'sit', x: bx9, z: sz9 - 0.5, y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.PI });
    });
    { const tx9 = sxa + 0.5, tz9 = sz9 + 2.25;   // 서쪽 끝 기둥 곁 스테인리스 휴지통(영상 s_043.5·s_046.5)
      dCyl(0.18, 0.17, 0.66, 0xb9bec2, tx9, Y, tz9, { seg: 10 }); dCyl(0.19, 0.19, 0.06, 0x2b2d30, tx9, Y + 0.66, tz9, { seg: 10 });
      colliders.push(noStand({ x0: tx9 - 0.2, x1: tx9 + 0.2, y0: Y, y1: Y + 0.72, z0: tz9 - 0.2, z1: tz9 + 0.2 })); }

    // ---- 바닥: 운동장 흙이 쉼터 북끝까지(위성 흙 띠 · 영상 s_046.5 — 잔디 없음) + 짙은 회색 보도블록 + 모래 띠 ----
    const SE9 = -3.2, Cz = x => 58.5 + (x + 31) * (54.4 - 58.5) / (SE9 + 31);                          // 모래 띠 북변(검은 고무 경계석): 서끝 58.5 → 동끝(x -3.2) 54.4 — 동끝은 남북 테(폭 약 2m · 영상 s_019.5~021)
    //   FSW-3(09-25): 서끝 55.6 → 58.5 — 영상 h_040.5·h_042 카메라 풀이(쉼터 기둥·운동장 경계석·혀 서변)로 잰 남쪽 경계석 z 58.3~59.0(x -30~-26) · 네이버 항공 포장 남끝 (-30, 57.7)·(-20, 56.9) · 서쪽 혀 남끝은 45° 사선(놀이터 블록)
    patQuad('dirt', -31, SCHOOL.forestPlay.x[0], SCHOOL.field.z[1], PZ.z[0], Y);
    patQuad('paveG', PZ.x[0], -31, 45.8, 55.6, Y + 0.02);                                            // 서쪽 끝 혀(운동장으로 나가는 길 · 안내판 앞)
    band('paveG', -31, SE9, () => PZ.z[0], Cz, Y + 0.02);
    band('paveG', SE9, PZ.x[1], () => PZ.z[0], grassZ, Y + 0.02);                                    // 버스 타는 곳까지(영상 s_009~016.5)
    band('paveG', -31, SE9, walkZ, grassZ, Y + 0.02);                                                 // 울타리 따라 좁은 보도(영상 s_018~022 왼쪽)
    band('sand', -31, SE9, Cz, walkZ, Y + 0.01);                                                      // 모래 띠(영상 s_021~036)
    slab(-31, Cz(-31), SE9, Cz(SE9), 0.12, 0.1, RUB, Y);                                              // 검은 고무 경계석(마당 쪽 · 모래 쪽 · 동끝)
    slab(-31, walkZ(-31), SE9, walkZ(SE9), 0.12, 0.1, RUB, Y);
    slab(SE9, Cz(SE9) - 0.06, SE9, walkZ(SE9) + 0.06, 0.12, 0.1, RUB, Y);
    slab(-31, grassZ(-31) + 0.08, SWA[0], grassZ(SWA[0]) + 0.08, 0.15, 0.15, 0xd9d6cf, Y);               // 잔디 띠 흰 콘크리트 경계석
    const GX1 = PZ.x[1] + 4.4;                                                                         // 진입로(4.4m) 끝까지
    dBox(GX1 + 31, 0.03, 0.3, 0x55585c, (GX1 - 31) / 2, Y, PZ.z[0] - 0.16);                           // 철 그레이팅 배수로(영상 g_005·s_003 — 포장과 운동장 사이)
    for (let x9 = -30.6; x9 < GX1; x9 += 0.6) dBox(0.04, 0.035, 0.26, 0x3c3f43, x9, Y + 0.005, PZ.z[0] - 0.16);
    dBox(0.6, 0.03, 0.9, 0x4a4d52, -1.2, Y + 0.02, 55.3);                                            // 뾰족 끝 앞 사각 철 뚜껑(영상 s_019.5·s_021)
    [[5.8, 44.0], [11.6, 43.9]].forEach(([x9, z9]) => {                                               // 빨강 둥근머리 볼라드(영상 g_003.5~g_006.5)
      dCyl(0.07, 0.2, 0.62, 0xe0482c, x9, Y, z9, { seg: 10 }); dCyl(0.11, 0.15, 0.08, 0xf2f2f2, x9, Y + 0.3, z9, { seg: 10 }); dBlob(0.12, 0.12, 0.12, 0xe0482c, x9, Y + 0.66, z9);
      colliders.push(noStand({ x0: x9 - 0.2, x1: x9 + 0.2, y0: Y, y1: Y + 0.8, z0: z9 - 0.2, z1: z9 + 0.2 })); });

    // ---- 모래 띠 놀이기구: 나무 말뚝 줄 · 스테인리스 시소 둘 · 높은 늑목 둘(영상 s_021~036) ----
    for (let k = 0; k < 8; k++) { const t = k / 7, x9 = -11.5 + 7.2 * t, z9 = 56.8 - 1.1 * t, h9 = 1.0 + 0.5 * hash2(x9, 3.1);
      dBox(0.12, h9, 0.12, 0x8a6a4a, x9, Y, z9); colliders.push(noStand({ x0: x9 - 0.1, x1: x9 + 0.1, y0: Y, y1: Y + h9, z0: z9 - 0.1, z1: z9 + 0.1 })); }
    [[-17.2, 57.9], [-14.0, 57.5]].forEach(([x9, z9]) => {
      const SS = 0xc9ced3;
      dBox(0.3, 0.35, 0.3, 0x8a9096, x9, Y, z9);
      [-0.12, 0.12].forEach(o => dRod(x9 - 1.6, Y + 0.28, z9 + o, x9 + 1.6, Y + 0.62, z9 + o, 0.035, SS));
      [-1.35, 1.35].forEach(o => { const yy = Y + 0.45 + o / 1.6 * 0.17;
        dRod(x9 + o, yy, z9, x9 + o, yy + 0.16, z9, 0.02, SS); dGeo(new THREE.TorusGeometry(0.12, 0.02, 5, 10), new THREE.Matrix4().makeTranslation(x9 + o, yy + 0.28, z9), SS); });
      [-1.5, 1.5].forEach(o => dCyl(0.26, 0.26, 0.13, 0x26282c, x9 + o, Y, z9, { seg: 10 }));   // 받침 반쪽 타이어
      colliders.push(noStand({ x0: x9 - 1.65, x1: x9 + 1.65, y0: Y, y1: Y + 0.7, z0: z9 - 0.3, z1: z9 + 0.3 }));
    });
    [[-21.0, 58.7], [-24.4, 59.3]].forEach(([x9, z9]) => {   // 높은 늑목(은색 사다리틀 2.5m)
      const SS = 0xc3c8cc, H9 = 2.5;
      [-0.6, 0.6].forEach(o => { dRod(x9, Y, z9 + o, x9, Y + H9, z9 + o, 0.04, SS, { far: true }); dRod(x9 + 0.8, Y, z9 + o, x9, Y + 1.6, z9 + o, 0.03, SS);
        colliders.push(noStand({ x0: x9, x1: x9 + 0.85, y0: Y, y1: Y + 1.6, z0: z9 + o - 0.06, z1: z9 + o + 0.06 })); });
      for (let y9 = 0.3; y9 < H9; y9 += 0.3) dRod(x9, Y + y9, z9 - 0.6, x9, Y + y9, z9 + 0.6, 0.02, SS);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y, y1: Y + H9, z0: z9 - 0.66, z1: z9 + 0.66 }));
    });

    // ---- 둥근 벤치 나무(영상 s_031.5~039 · 위성 짙은 수관): 퍼진 활엽수 + 사각 흙 화단(밝은 콘크리트 테) + 짙은 숯색 곡선 돌 벤치 4(남쪽 트임) + 북 모양 돌 의자 3 ----
    { const tx9 = -22.8, tz9 = 52.6, CB = 0xc9c6bf;
      tree(tx9, tz9, 1.35);
      [[0, 3.9, 0, 3.0, 0x4d8b4d], [1.1, 4.3, -0.6, 2.0, 0x5c9a4f], [-1.2, 4.1, 0.7, 1.9, 0x3f7a3f]].forEach(([ox, oy, oz, r, c]) =>   // 넓게 퍼진 납작한 수관(영상 s_031.5~036)
        dBlob(r, r * 0.3, r * 0.9, c, tx9 + ox, Y + oy, tz9 + oz, { far: true, jitter: 0.12, ry: ox }));
      patQuad('dirt', tx9 - 1.3, tx9 + 1.3, tz9 - 1.3, tz9 + 1.3, Y + 0.03, false, 0xb0916a);
      addBox(2.9, 0.15, 0.15, CB, tx9, Y, tz9 - 1.375); addBox(2.9, 0.15, 0.15, CB, tx9, Y, tz9 + 1.375);
      addBox(0.15, 0.15, 2.6, CB, tx9 - 1.375, Y, tz9); addBox(0.15, 0.15, 2.6, CB, tx9 + 1.375, Y, tz9);
      [0, 70, 140, 210].forEach(c9 => {   // 각도 = 동쪽에서 북쪽으로(도) · 벤치 하나 = 50°
        const a0 = (c9 - 25) * Math.PI / 180, a1 = (c9 + 25) * Math.PI / 180, sh = new THREE.Shape();
        sh.absarc(0, 0, 2.3, a0, a1, false); sh.absarc(0, 0, 1.8, a1, a0, true);
        dGeo(new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(tx9, Y, tz9), 0x5b5f66, { far: true });
        for (let i = 0; i < 3; i++) { const b0 = a0 + (a1 - a0) * i / 3, b1 = a0 + (a1 - a0) * (i + 1) / 3, xs = [], zs = [];
          [b0, b1].forEach(b => [1.8, 2.3].forEach(r => { xs.push(tx9 + r * Math.cos(b)); zs.push(tz9 - r * Math.sin(b)); }));
          colliders.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Y, y1: Y + 0.45, z0: Math.min(...zs), z1: Math.max(...zs) }); }
        const cm = c9 * Math.PI / 180;
        if (c9 < 200) hotspots.push({ kind: 'sit', x: tx9 + 2.75 * Math.cos(cm), z: tz9 - 2.75 * Math.sin(cm), y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.atan2(Math.cos(cm), -Math.sin(cm)) });
      });
      [250, 275, 300].forEach(c9 => { const cm = c9 * Math.PI / 180, x9 = tx9 + 2.55 * Math.cos(cm), z9 = tz9 - 2.55 * Math.sin(cm);
        dCyl(0.22, 0.22, 0.44, 0x62666c, x9, Y, z9, { seg: 9, far: true });
        colliders.push({ x0: x9 - 0.22, x1: x9 + 0.22, y0: Y, y1: Y + 0.44, z0: z9 - 0.22, z1: z9 + 0.22 }); });
    }

    // ---- 바닥 놀이 그림(선 과녁·달팽이 길·색 원 묶음·분홍 네모·누운 아이 사방치기) — 전부 청크 병합(예전 원마다 메시 20개 → 드로우콜 0) ----
    const RY = Y + 0.03, YL = 0xf2c94c, PK = 0xe25a70, GR = 0x6fbf5a, SK = 0x7cc4e8, PU = 0xa98bd6, WH = 0xf2f2ee;
    const ringG = (x, z, r0, r1, col, t0 = 0, tl = Math.PI * 2) => dGeo(new THREE.RingGeometry(r0, r1, 40, 1, t0, tl).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, RY, z), col);
    const rectG = (x, z, w, d, col) => dGeo(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.Matrix4().makeTranslation(x, RY, z), col);
    { const [ax, az] = [-6.8, 51.0];   // 큰 선 과녁(영상 s_024~027: 노랑 점 → 분홍빨강 원판 → 초록 → 하늘 → 노랑 선)
      ringG(ax, az, 0, 0.3, YL); ringG(ax, az, 0.3, 0.78, PK); ringG(ax, az, 1.0, 1.1, GR); ringG(ax, az, 1.38, 1.48, SK); ringG(ax, az, 1.75, 1.86, YL); }
    { const [ax, az] = [2.6, 52.7];    // 달팽이 길(영상 s_013.5~019.5: 노랑 원판 + 겹겹 호) — 북쪽 절반은 버스 밑
      ringG(ax, az, 0, 1.2, YL); ringG(ax, az, 1.2, 1.26, 0xf4e8b0);
      [[1.6, SK, 0.2, 4.2], [2.0, PU, -0.4, 4.4], [2.4, WH, 0.6, 3.6], [2.75, YL, -0.9, 4.0]].forEach(([r, c, t0, tl]) => ringG(ax, az, r, r + 0.1, c, Math.PI + t0, tl)); }
    { const [ax, az] = [-14.2, 51.4];  // 바랜 색 원 묶음 + 흰 호(영상 s_027~030) — 서로 겹치지 않게(같은 높이 겹침 = 깜빡임)
      ringG(ax, az, 1.4, 1.5, WH, 0.3, 5.2); ringG(ax, az, 2.3, 2.4, SK, 3.3, 2.6); ringG(ax, az, 1.85, 1.95, YL, 2.0, 2.2); ringG(ax, az, 0.45, 0.55, PK);
      ringG(-10.9, 51.1, 0.5, 0.6, GR); ringG(-17.6, 50.6, 0.6, 0.7, PU, 0.6, 4.6); }
    { const [qx, qz] = [-18.6, 52.9];  // 분홍 네모(노랑 테 — 영상 s_031.5~034.5)
      rectG(qx, qz, 0.84, 0.84, 0xe25a7a); rectG(qx, qz - 0.48, 1.08, 0.12, YL); rectG(qx, qz + 0.48, 1.08, 0.12, YL); rectG(qx - 0.48, qz, 0.12, 0.84, YL); rectG(qx + 0.48, qz, 0.12, 0.84, YL); }
    rectG(-10.8, 49.6, 4.0, 0.1, WH);                                                                  // 흰 곧은 선(영상 s_025.5·s_027 — 쉼터 기둥 줄 바로 앞)
    [[-10.8, 52.6], [-10.3, 52.9], [-9.8, 52.6], [-9.3, 52.9]].forEach(([fx, fz]) => rectG(fx, fz, 0.16, 0.28, 0xf0a04b));   // 주황 발자국
    floor4('kidHop', [[-31.6, 50.0], [-27.6, 50.0], [-27.6, 56.4], [-31.6, 56.4]], RY, 0xffffff, [[1, 0], [1, 1], [0, 1], [0, 0]]);   // 누운 아이 + 사방치기(영상 s_039~045) — FSW-3: 카메라를 푼 h_040.5·h_042·h_043.5에서 남북으로 긴 그림(x -31.5~-27.6 · z 49.5~56.5 · 머리 = 남쪽) — 예전 4.4m 네모·동서

    zones.push({ x0: sxa, x1: sxb, z0: sz9 - 2.25, z1: sz9 + 2.25, y: Y, label: '무지개 쉼터' });
    zones.push({ x0: PZ.x[0], x1: SE9, z0: sz9 + 2.25, z1: 55.6, y: Y, label: '놀이마당' });
    zones.push({ x0: -31, x1: SE9, z0: 55.6, z1: 62, y: Y, label: '모래 놀이터' });
  }
  {   // 동쪽 통학로 EAST-2(09-24 · 영상 f_183~f_243 + 위성 E 대조) — 산책로 동끝 경사로 → 높은 철망 동쪽 크림 보도 → 큰 나무 남쪽에서 서쪽으로 굽어 운동장 남쪽 길(정문 보도와 이어짐)
    //   북 구간(z -9.8~12): 폭 3m · 동쪽 가 = 쇠 배수 덮개 + 흰 경계석 + 큰 자연석 두른 화단(회양목·단풍·태양광 가로등) — 영상 f_192~210
    //   남 구간(z 12~38): 폭 2.5m · 동쪽 가 = 세운 통나무 경계 + 철사 울타리 학급 화단 · 철망 기둥에서 건너오는 연두 문틀 넷 — f_212~228
    //   굽이 안쪽 = 큰 나무 아래 포장 쉼터(돌 벤치·나무 조각·공원 벤치 — f_225·f_233) · 굽이 바깥 = 통나무 경계 + 꽃 화단 + 다듬은 생울타리(f_233)
    //   점자블록은 경사로(갈림목)에만(f_192 — 보도 본선은 크림 블록뿐) · 높은 철망은 z 3~33(f_192: 경사로 발치에서 약 15m 트임 · f_228 남끝 = 향나무)
    const EP2 = SCHOOL.eastPath, EF = SCHOOL.eastFenceX, Y = FIELD, [PX0, PX1] = EP2.x, F9 = { far: true }, G9 = 0x9ccc5e;
    // 작은 부재 청크 고르기(성능): 16m 칸마다 새 청크가 생기면 드로우콜이 늘고, 긴 구역을 한 청크로 묶으면 경계 구가 커져 본관 동끝 교실 안에서도 절두체에 든다(+1콜)
    //   → 북 구간 z -2~12 = 가까이 층 (40,8) 청크(골대가 이미 만든 청크 — 새 청크 없음 · 먼 층에 두면 급식 창고·원무실 등 먼 곳 시점에서도 그려져 최악 삼각형 +670)
    //     z < -2 = 먼 층 (40,-8) 청크(3학년 교실 시점에 이미 그려지는 청크 — (40,8)이 거기까지 넓어지면 그 시점 +1콜)
    //     남 구간 = 가까이 층 (40,24)·(40,40) 두 청크(55m 밖이면 숨김) · 긴 띠는 청크마다 잘라 넣는다(47m 경계석 하나가 (40,24) 청크 경계 구를 r24로 키워 3학년 교실 시점에 +1콜이었다)
    const NA = (o, z) => (o && o.far) ? o : z < -2 ? { ...(o || {}), far: true, at: [40, -8] } : z < 12 ? { ...(o || {}), at: [40, 8] } : { ...(o || {}), at: [40, z < 34 ? 20 : 36] };
    const dBoxE = (w, h, d, c, x, y, z, o) => dBox(w, h, d, c, x, y, z, NA(o, z)), dBlobE = (sx, sy, sz, c, x, y, z, o) => dBlob(sx, sy, sz, c, x, y, z, NA(o, z)), dRodE = (x0, y0, z0, x1, y1, z1, r, c, o) => dRod(x0, y0, z0, x1, y1, z1, r, c, NA(o, z0));
    const dCylE = (rt, rb, h, c, x, y, z, o) => dCyl(rt, rb, h, c, x, y, z, NA(o, z)), slabE = (x0, z0, x1, z1, w, h, c, y0, o) => slab(x0, z0, x1, z1, w, h, c, y0, NA(o, z0));
    const BZ = TERR_Z, ZR = TR3.fieldZ + 2.6, ZS = 12, PX1S = PX0 + 2.5, FZ0 = 3, FZ1 = 33;
    const ZC = 38.0, SZ0 = 41.3, SZ1 = 44.5, RI = SZ0 - ZC, XC = PX0 - RI, ROX = PX1S - XC, ROZ = SZ1 - ZC, SX0 = 17.5;   // 굽이 = 타원 사분원(중심 XC,ZC) · 남쪽 길 z [SZ0,SZ1] · 서끝 = 정문 진입로 동변(SOUTH-2 베이지 보도와 맞댐)
    const R8 = seeded(4711), pk = a => a[Math.floor(R8() * a.length) % a.length];
    PATDEF.paveE = [1.6, 256, false, (g, N, R) => bond(g, N, 32, 32, ['#e6e0cb', '#e1dbc4', '#ebe5d1', '#dcd6c0'], '#bdb6a2', 1.5, R, 0.5, [0.05, ['#8a8c90', '#cdb2a6', '#a3a09a', '#9ea6ae']])];   // 크림 보도블록(영상 중앙값 #e4dec6 · 가끔 짙은 회색·분홍 칸 — 앞뜰 산책로의 노란 기와 다름)
    // ---- 도우미(이 블록 안에서만) ----
    const barrier = (x0, z0, x1, z1, y0 = Y, pad = 0.06) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (Math.abs(x1 - x0) < 0.01 || Math.abs(z1 - z0) < 0.01 ? 99 : 0.3)));   // 올라서기 금지 선(축에 나란하면 한 장, 비스듬하면 0.3m 토막)
      for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
        colliders.push(noStand({ x0: Math.min(ax, bx) - pad, x1: Math.max(ax, bx) + pad, y0, y1: y0 + 1.6, z0: Math.min(az, bz) - pad, z1: Math.max(az, bz) + pad })); } };
    const logLine = pts => {   // 세운 통나무 경계(높이 0.28 · 두께 0.14) — pts = 선(보도 쪽이 오른쪽 법선 +[dz,-dx]가 아니라 nrm 부호로 지정) — 몸통 slab + 보도 쪽 통나무 무늬 + 막이
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0, s] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) continue;
        const nx = s * (z1 - z0) / L, nz = -s * (x1 - x0) / L, o = 0.08;   // nx,nz = 보도 쪽 법선
        slabE(x0, z0, x1, z1, 0.14, 0.28, 0x7d6346, Y);
        const P = [[x0 + nx * o, Y, z0 + nz * o], [x1 + nx * o, Y, z1 + nz * o], [x1 + nx * o, Y + 0.29, z1 + nz * o], [x0 + nx * o, Y + 0.29, z0 + nz * o]];
        const u0 = (pts[i][3] || 0) / 1.2, u1 = u0 + L / 1.2; pts[i + 1][3] = (pts[i][3] || 0) + L;
        patPush('wood', P, [[0, u0], [0, u1], [0.24, u1], [0.24, u0]], [nx, 0, nz], 0x9c7c5c);   // 교실 마루 무늬를 세워 씀(널 10cm = 통나무 한 개 — 새 무늬를 만들면 드로우콜 +1)
        barrier(x0, z0, x1, z1); } };
    const wireLine = (pts, step = 2.5) => {   // 쇠 말뚝 + 철사 세 가닥(영상 f_216~233) — 올라서기 금지 선
      let acc = step;
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.05) continue;
        [0.45, 0.9].forEach(h => dRodE(x0, Y + h, z0, x1, Y + h, z1, 0.005, 0xd0d4d8));
        for (let t = 0; t < L; t += 0.25) { acc += 0.25; if (acc >= step) { acc = 0; const px = x0 + (x1 - x0) * t / L, pz = z0 + (z1 - z0) * t / L; dRodE(px, Y, pz, px, Y + 1.02, pz, 0.012, 0xc8cdd2); } }
        barrier(x0, z0, x1, z1); } };
    const plants = (x0, z0, x1, z1, n, cols, rm = 0.38) => { for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * R8(), z = z0 + (z1 - z0) * R8(), r = rm * (0.6 + R8() * 0.4);   // 화단 풀포기(잎 덩어리 + 꽃 점) — 몸이 뚫지 않게 작은 막이
      dBlobE(r, r * 1.1, r, pk([0x5f8f45, 0x6b9a4c, 0x557f3e]), x, Y + r * 0.8, z, { chunky: true, jitter: 0.15, ry: x * 3 + z });
      if (cols) for (let j = 0; j < 2; j++) dBlobE(0.07, 0.06, 0.07, pk(cols), x + (R8() - 0.5) * r, Y + r * 1.6 + R8() * 0.1, z + (R8() - 0.5) * r, { chunky: true });
      colliders.push(noStand({ x0: x - r * 0.8, x1: x + r * 0.8, y0: Y, y1: Y + 0.5, z0: z - r * 0.8, z1: z + r * 0.8 })); } };
    const hedge = (x, z, w, h, d, hex, hl = true, nr = false) => {   // 다듬은 생울타리·회양목(mound 모양) — 막이는 돌린 타원 띠(ellipseCols — 타원 둘레 밖으로 모서리가 튀어나오지 않게 · 보이지 않는 벽/발 묻힘 0)
      dBlobE(w / 2, h * 0.62, d / 2, hex, x, Y + h * 0.38, z, { far: !nr, chunky: true, ry: x, jitter: 0.12 });   // nr = 가까이 층(북 구간 — 먼 시점 삼각형)
      if (hl) dBlobE(w * 0.36, h * 0.3, d * 0.34, 0x8cb85a, x, Y + h * 0.72, z, { far: !nr, chunky: true, ry: z, jitter: 0.12 });
      ellipseCols(x, z, w / 2, d / 2, x, Y, Y + h, 0.86); };   // [quality4 09-26] 십자 두 장(축정렬) → 돌린(ry = x) 20면 덩어리 띠 — 큰 생울타리 (41.25, 46.8) 보이지 않는 벽 2간선
    const arcPts = (rx, rz, t0, t1, n, dx = 0, dz = 0) => { const P = []; for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; P.push([XC + dx + rx * Math.cos(t), ZC + dz + rz * Math.sin(t)]); } return P; };

    // ---- 바닥: 크림 보도(북 3m → 남 2.5m) · 굽이 · 남쪽 길 ----
    patQuad('paveE', PX0, PX1, ZR, ZS, Y + 0.02);   // 북 구간도 크림 보도(영상 f_196~210 — 앞뜰 노란 보도와 다름) · paveE 메시는 남 구간 때문에 3학년·체육관 방송실 시점에 이미 그려져 콜 최댓값 그대로
    floor4('paveE', [[PX0, ZS], [PX1, ZS], [PX1S, ZS + 2], [PX0, ZS + 2]], Y + 0.02);
    patQuad('paveE', PX0, PX1S, ZS + 2, ZC, Y + 0.02);
    { const n = 10; for (let k = 0; k < n; k++) { const a = k / n * Math.PI / 2, b = (k + 1) / n * Math.PI / 2;
      floor4('paveE', [[XC + RI * Math.cos(a), ZC + RI * Math.sin(a)], [XC + ROX * Math.cos(a), ZC + ROZ * Math.sin(a)], [XC + ROX * Math.cos(b), ZC + ROZ * Math.sin(b)], [XC + RI * Math.cos(b), ZC + RI * Math.sin(b)]], Y + 0.02); } }
    patQuad('paveE', SX0, XC, SZ0, SZ1, Y + 0.02);
    // 경사로 발치 앞 포장 참(영상 f_192 — 매트 서쪽 넓은 포장 + '주차금지' 콘) · 가로 배수 덮개
    patQuad('paveE', EF - 1.3, PX0, TR3.fieldZ + 0.2, ZR, Y + 0.02);
    dBoxE(PX1 - EF + 1.3, 0.03, 0.3, 0x5b5e62, (EF - 1.3 + PX1) / 2, Y, ZR + 0.15, { flat: true });
    // 서쪽 가 화강석 경계석(철망 발치 — f_198·f_210) · 굽이 안쪽 가 경계석(쉼터와 보도 사이 — f_233) · 남쪽 길 북쪽 가 검은 배수 덮개(운동장 쪽 — f_240·f_243)
    [[ZR + 0.3, -2.01], [-2.01, ZS], [ZS, 33.99], [33.99, ZC]].forEach(([a, b]) => dBoxE(0.12, 0.04, b - a, 0xd4cdb9, PX0 + 0.06, Y, (a + b) / 2));   // 높이 4cm(발 묻힘 띠 0.15 아래) · 청크마다 한 토막
    { const P = arcPts(RI + 0.07, RI + 0.07, 0, Math.PI / 2, 10); for (let k = 0; k + 1 < P.length; k++) slabE(P[k][0], P[k][1], P[k + 1][0], P[k + 1][1], 0.14, 0.035, 0xd4cdb9, Y); }
    dBoxE(31.0 - SX0 - 0.3, 0.03, 0.3, 0x3e4145, (SX0 + 0.3 + 31.0) / 2, Y, SZ0 - 0.15, { flat: true });
    // 경사로(앞뜰 블록의 보도 비탈) 위: 노란 점자 + 짙은 고무 매트 둘 + 산책로 → 경사로 점자 이음(f_189·f_192)
    { const TXc = (PX0 + PX1) / 2 - 0.1, a = Math.atan2(YARD - FIELD, ZR - BZ), L = Math.hypot(ZR - BZ, YARD - FIELD);
      patQuad('tactZ', TXc - 0.15, TXc + 0.15, (SCHOOL.frontYard.walkN + SCHOOL.frontYard.walkS) / 2 + 0.15, BZ, YARD + 0.03);
      slope('tactZ', 'z', TXc - 0.15, TXc + 0.15, BZ, ZR, YARD + 0.012, FIELD + 0.012, 0);
      [[TXc - 0.65, 0.95], [TXc + 0.65, 0.95]].forEach(([mx, mw]) => { _dm.compose(_dv.set(mx, (YARD + FIELD) / 2 + 0.014, (BZ + ZR) / 2), _dq.setFromEuler(_de.set(a, 0, 0)), _ds.set(mw, 0.02, L - 0.3)); dGeo(box_, _dm, 0x55544c, { flat: true, far: true, at: [40, -8] }); });
      dBoxE(1.2, 0.03, 0.9, 0x6a6a64, TXc + 0.65, Y + 0.005, ZR + 0.75, { flat: true }); }
    { const cx9 = EF - 0.55, cz9 = TR3.fieldZ + 2.2;   // '주차금지' 주황 표지 콘(f_192 — 글자 읽힘)
      dCylE(0.08, 0.26, 0.6, 0xe0602f, cx9, Y + 0.02, cz9, { seg: 10 }); dCylE(0.05, 0.05, 0.18, 0xe0602f, cx9, Y + 0.62, cz9, { seg: 8 });
      dCylE(0.2, 0.2, 0.04, 0xe0602f, cx9, Y + 0.86, cz9, { seg: 8, rot: [Math.PI / 2, 0, 0] });
      sign('주차금지', cx9, Y + 0.86, cz9 - 0.015, Math.PI, 0.1, { bg: '#e0602f', fg: '#ffffff' });
      colliders.push(noStand({ x0: cx9 - 0.26, x1: cx9 + 0.26, y0: Y, y1: Y + 1.0, z0: cz9 - 0.26, z1: cz9 + 0.26 })); }

    // ---- 높은 철망(연두 기둥 6m · 가는 회색 다이아 그물 — f_196~225) + 이중 기둥(사다리 보강) + 보도 위 연두 문틀 넷 + 청록 공막이 그물 ----
    { const x = EF, H = 6.0, L = FZ1 - FZ0, C9 = 0.2;
      const panel = (P, U, hex) => { _c.set(hex); for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); } };
      panel([[x, Y, FZ0], [x, Y, FZ1], [x, Y + H, FZ1], [x, Y + H, FZ0]], [[0, 0], [L / C9, 0], [L / C9, H / C9], [0, H / C9]], 0xa9b3a5);
      panel([[x + 0.02, Y, FZ0], [x + 0.02, Y, FZ1], [x + 0.02, Y + H, FZ1], [x + 0.02, Y + H, FZ0]], [[0.5, 0.5], [0.5 + L / 0.14, 0.5], [0.5 + L / 0.14, 0.5 + H / 0.14], [0.5, 0.5 + H / 0.14]], 0x9aa596);   // 한 겹 더(엇갈린 칸) — 멀리서 회녹색 안개처럼(영상 f_192·f_198)
      panel([[x - 0.05, Y + 4.6, FZ0 + 0.2], [x - 0.05, Y + 3.4, 12], [x - 0.3, Y + 4.4, 18.5], [x - 0.3, Y + 5.2, FZ0 + 0.2]], [[0, 0], [8.8 / 0.35, 0], [15.3 / 0.35, 1.2 / 0.35], [0, 0.6 / 0.35]], 0x3fa58a);   // 청록 공막이 그물(f_201·f_210 — 늘어져 비스듬)
      const n = Math.round(L / 3);
      for (let i = 0; i <= n; i++) { const z9 = FZ0 + L * i / n;
        dRodE(x, Y, z9, x, Y + H + 0.05, z9, 0.05, G9, F9); post(x, z9, Y, Y + H);
        if (i % 3 === 1) { dRodE(x, Y, z9 + 0.45, x, Y + H, z9 + 0.45, 0.045, G9, F9); [1.5, 3.0, 4.5].forEach(h => dRodE(x, Y + h, z9, x, Y + h, z9 + 0.45, 0.035, G9)); } }   // 9m마다 이중 기둥
      for (let k = 0; k < Math.ceil(L / 8); k++) { const za = FZ0 + L * k / Math.ceil(L / 8), zb = FZ0 + L * (k + 1) / Math.ceil(L / 8); dRodE(x, Y + H, za, x, Y + H, zb, 0.035, G9, F9); dRodE(x, Y + 0.15, za, x, Y + 0.15, zb, 0.025, G9); }
      colliders.push({ x0: x - 0.12, x1: x + 0.12, y0: Y, y1: Y + H + 0.3, z0: FZ0 - 0.12, z1: FZ1 + 0.12, nc: true });
      [21, 24, 27, 30].forEach(z9 => { const px = PX1S + 0.3;   // 보도 위를 건너는 문틀(f_220·f_225 — 동쪽 가 기둥 + 가로대 둘, 머리 위 3.2m)
        dRodE(px, Y, z9, px, Y + 4.7, z9, 0.045, G9, F9); post(px, z9, Y, Y + 3.0, 0.06);
        [3.2, 4.6].forEach(h => dRodE(x, Y + h, z9, px, Y + h, z9, 0.04, G9)); }); }

    // ---- 북 구간 동쪽: 배수 덮개 + 흰 경계석 + 큰 자연석 두른 화단(f_192~210) ----
    [[ZR, -2.01], [-2.01, ZS]].forEach(([a, b]) => { dBoxE(0.35, 0.03, b - a, 0x6b6e70, PX1 + 0.175, Y, (a + b) / 2, { flat: true }); dBoxE(0.12, 0.1, b - a, 0xd4cdb9, PX1 + 0.41, Y, (a + b) / 2); });   // 청크마다 한 토막
    let rz1 = ZR;
    for (let z9 = ZR + 0.45; z9 < ZS - 0.2; z9 += 0.78 + R8() * 0.25) {
      const sx = 0.36 + R8() * 0.14, sy = 0.3 + R8() * 0.2, sz = 0.42 + R8() * 0.18; rz1 = z9 + sz + 0.35;
      dBlobE(sx, sy, sz, pk([0xd3d0c7, 0xc3c0b6, 0xdedbd2, 0xa9a69c]), PX1 + 0.85 + (R8() - 0.5) * 0.12, Y + sy * 0.45, z9, { chunky: true, jitter: 0.18, ry: z9 * 2.3 });
      if (R8() > 0.45) dBlobE(sx * 0.8, sy * 0.9, sz * 0.8, pk([0xd3d0c7, 0xdedbd2, 0xb4b1a8]), PX1 + 1.45, Y + sy * 0.7, z9 + 0.3, { chunky: true, jitter: 0.18, ry: z9 * 1.7 });
    }
    barrier(PX1 + 0.5, ZR + 0.1, PX1 + 0.5, rz1, Y, 0.0); colliders[colliders.length - 1].x1 = PX1 + 1.6;   // [quality4 09-26] 1.35 → 1.6: 둘째 돌 줄(PX1+1.45 · 반지름 ≤0.4)까지 — 생울타리 막이를 모양대로 줄이자 돌과 울타리 사이 0.3 틈에 몸이 끼어 돌을 밟았다(발 묻힘)
    { const MC9 = [0x6a9444, 0x5f8a3e, 0x74a04c];
      for (let z9 = ZR + 0.9, k = 0; z9 < ZS - 0.5; z9 += 1.75, k++) hedge(PX1 + 2.45 + (k % 2) * 0.25, z9, 1.5 + (k % 3) * 0.2, 0.9 + (k % 2) * 0.2, 1.4, MC9[k % 3], k % 2 === 0, z9 >= -2);
      for (let z9 = ZR + 2.2, k = 0; z9 < ZS - 1; z9 += 3.4, k++) hedge(PX1 + 4.2, z9, 1.8, 1.05, 1.6, MC9[(k + 1) % 3], false, z9 >= -2); }
    [[PX1 + 5.6, -6.5, 1.15], [PX1 + 6.2, 1.0, 1.25], [PX1 + 5.4, 8.0, 1.05]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true));   // 단풍·벚 느낌 활엽수(f_192·f_201)
    { const lx9 = PX1 + 3.0, lz9 = 4.8;   // 태양광 가로등(f_192·f_196·f_201 — 회색 기둥 + 기운 판 + LED 머리)
      post(lx9, lz9, Y, Y + 5.6, 0.1); dCylE(0.05, 0.09, 5.6, 0x9aa0a6, lx9, Y, lz9, F9);
      _dm.compose(_dv.set(lx9 + 0.05, Y + 5.75, lz9), _dq.setFromEuler(_de.set(0, 0, 0.5)), _ds.set(0.9, 0.04, 0.6)); dGeo(box_, _dm, 0x2b3f6b, F9);
      dRodE(lx9, Y + 5.2, lz9, lx9 - 0.7, Y + 5.35, lz9, 0.03, 0x9aa0a6, F9); dBoxE(0.45, 0.07, 0.18, 0xd9dde0, lx9 - 0.85, Y + 5.3, lz9, F9); lamp(0.36, 0.03, 0.12, lx9 - 0.85, Y + 5.27, lz9); }
    { const qx = PX1 + 1.2, qz = -1.0;   // 작은 짙은 안내판(f_201 — 글자는 읽히지 않아 넣지 않음)
      dBoxE(0.06, 1.2, 0.06, 0x3a3d44, qx, Y, qz); dBoxE(0.04, 0.35, 0.5, 0x3a3d44, qx, Y + 1.2, qz); post(qx, qz, Y, Y + 1.6, 0.06); }
    { const ux = 49.75, uz = 16.4;   // 콘크리트 전봇대(f_210·f_212 — 흰 울타리 바로 바깥) + 완목 + 변압기
      post(ux, uz, Y, Y + 11, 0.2); dCylE(0.13, 0.19, 10.5, 0xb8b4aa, ux, Y, uz, { far: true, seg: 8 });
      dBoxE(1.8, 0.12, 0.12, 0x8a8f92, ux, Y + 9.6, uz, F9); dBoxE(1.4, 0.1, 0.1, 0x8a8f92, ux, Y + 8.9, uz, F9);
      [-0.33, 0.33].forEach(o => dCylE(0.22, 0.22, 0.75, 0x9aa0a6, ux, Y + 7.4, uz + o, { far: true, seg: 8 })); }

    // ---- 남 구간 동쪽: 세운 통나무 경계 + 철사 울타리 학급 화단 · 개수대 자리 트임 ----
    const KZ0 = SCHOOL.sink[1] - 1.8, KZ1 = SCHOOL.sink[1] + 1.8, LX = PX1S + 0.07, WX = PX1S + 0.7, EWX = 49.0;   // EWX = 화단 동쪽 흰 울타리(아래)
    logLine([[PX1 + 0.07, ZS, -1], [LX, ZS + 2, -1], [LX, KZ0, -1]]);
    logLine([[LX, KZ1, -1], [LX, ZC, -1]]);
    wireLine([[PX1 + 0.5, ZS + 0.3], [WX, ZS + 2.2], [WX, KZ0 - 0.2]]); wireLine([[WX, KZ1 + 0.2], [WX, ZC - 0.2]]);
    wireLine([[LX, ZS + 2.2], [WX, ZS + 2.2]], 0.3); wireLine([[LX, KZ0], [WX, KZ0]], 0.3); wireLine([[LX, KZ1], [WX, KZ1]], 0.3);   // 통나무~철사 사이 띠 막음(끝)
    plants(LX + 0.2, ZS + 2.4, WX - 0.2, KZ0 - 0.2, 14, [0xd9485a, 0xf2b632, 0xe9e2f0], 0.2);
    plants(WX + 0.5, ZS + 1.0, PX1S + 4.6, KZ0 - 0.4, 26, [0xd9485a, 0xf2b632, 0xf07aa0]);
    plants(WX + 0.5, KZ1 + 0.4, PX1S + 3.2, ZC - 0.5, 8, [0xf2b632, 0xd9485a]);
    [[WX + 0.3, 16.5], [WX + 0.3, 22.5], [WX + 0.3, 26.0]].forEach(([x9, z9]) => { dBoxE(0.03, 0.35, 0.03, 0xe8e8e4, x9, Y, z9); dBoxE(0.03, 0.1, 0.16, 0xf4f4f0, x9 + 0.012, Y + 0.3, z9); colliders.push(noStand({ x0: x9 - 0.05, x1: x9 + 0.05, y0: Y, y1: Y + 0.4, z0: z9 - 0.1, z1: z9 + 0.1 })); });   // 흰 식물 이름표(f_220)
    sign('4학년', PX1S + 0.5, Y + 0.45, KZ0 - 0.35, -Math.PI / 2, 0.1, { bg: '#2a2c30', fg: '#ffffff' }); dBoxE(0.03, 0.4, 0.03, 0x2a2c30, PX1S + 0.53, Y, KZ0 - 0.35);   // 학급 화단 팻말(f_225 — 글자 읽힘)
    [[PX1S + 4.2, 24.5, 1.1]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true));
    hedge(PX1S + 2.2, 19.8, 1.4, 0.9, 1.3, 0x5f8a3e);
    // 화단 바닥 = 무성한 짙은 풀(영상 f_212~225 — 무릎 높이 풀·여러해살이가 빽빽함: 깎은 잔디가 아님) + 키 큰 풀 덩어리(흰 산형 꽃 섞임)
    patQuad('grass', LX + 0.08, EWX - 0.15, ZS + 2, ZC, Y + 0.005, false, 0x8ea76f);
    plants(WX + 0.6, ZS + 2.6, EWX - 0.6, KZ0 - 0.6, 16, [0xf4f4ee, 0xe9e2f0], 0.5);
    plants(WX + 0.9, KZ1 + 1.8, EWX - 0.6, ZC - 0.6, 6, null, 0.5);

    // ---- 개수대(f_222~225): 콘크리트 판 + 스테인리스 기둥 여섯 + 보라 반투명 곡선 지붕 · 등판 + 물통 + 수도꼭지 다섯(서쪽 = 보도를 봄) + 검은 호스 ----
    { const [kx9, kz9] = SCHOOL.sink, SS = 0xc8cdd2;
      dBoxE(45.85 - LX - 0.07, 0.05, KZ1 - KZ0, 0xc4c0b5, (LX + 0.07 + 45.85) / 2, Y, kz9, { collide: true });   // 밝은 콘크리트(지붕 그늘에서 아스팔트처럼 검게 보이던 것)
      [PX1S + 0.35, 45.55].forEach(x9 => [kz9 - 1.6, kz9, kz9 + 1.6].forEach(z9 => { dRodE(x9, Y + 0.05, z9, x9, Y + 2.45, z9, 0.045, SS, F9); post(x9, z9, Y, Y + 2.4, 0.06); }));
      const RW = (45.55 - PX1S - 0.35) / 2 + 0.12, xm = (PX1S + 0.35 + 45.55) / 2;
      [[1, 1], [-1, 0.985]].forEach(([sz9, r9]) => { const g = new THREE.CylinderGeometry(RW * r9, RW * r9, 3.6, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
        dGeo(g, new THREE.Matrix4().compose(new THREE.Vector3(xm, Y + 2.45, kz9), new THREE.Quaternion(), new THREE.Vector3(1, 0.42, sz9)), 0x5a4a66, F9); g.dispose(); });   // 안팎 두 겹(밑에서 봐도 보이게)
      [PX1S + 0.35, 45.55].forEach(x9 => dRodE(x9, Y + 2.45, kz9 - 1.8, x9, Y + 2.45, kz9 + 1.8, 0.035, SS, F9));
      const bx = kx9 + 0.45;
      addBox(0.3, 1.0, 2.2, 0xb9bdc0, bx, Y + 0.05, kz9, NS);
      dBoxE(0.6, 0.6, 2.2, 0xaeb3b6, bx - 0.45, Y + 0.05, kz9);
      dBoxE(0.5, 0.03, 2.1, 0x6f7478, bx - 0.45, Y + 0.64, kz9);
      for (let i = 0; i < 5; i++) dRodE(bx - 0.15, Y + 0.95, kz9 - 0.8 + i * 0.4, bx - 0.3, Y + 0.93, kz9 - 0.8 + i * 0.4, 0.018, 0xd8dcdf);
      colliders.push(noStand({ x0: bx - 0.75, x1: bx + 0.15, y0: Y, y1: Y + 1.05, z0: kz9 - 1.1, z1: kz9 + 1.1 }));
      [[bx - 0.8, kz9 - 1.2, bx - 1.3, kz9 - 1.6], [bx - 1.3, kz9 - 1.6, bx - 1.9, kz9 - 1.1], [bx - 1.9, kz9 - 1.1, PX1S - 0.2, kz9 - 2.1]].forEach(([a, b, c, d]) => dRodE(a, Y + 0.07, b, c, Y + 0.07, d, 0.018, 0x1e1f22));
      hotspots.push({ kind: 'wash', x: bx - 1.1, z: kz9, y: Y, r: 1.2, label: '손 씻기' });
      zones.push({ x0: PX1S, x1: 45.85, z0: KZ0, z1: KZ1, y: Y, label: '개수대' }); }

    // ---- 철망 남끝 짙은 향나무(f_225·f_228 — 원기둥 모양 · 발치 담쟁이) ----
    { const jx = EF - 0.4, jz = FZ1 + 1.3;
      colliders.push({ x0: jx - 1.0, x1: jx + 1.0, y0: Y, y1: Y + 12, z0: jz - 1.0, z1: jz + 1.0 });
      [[1.25, 1.2, 0x2f4a33], [1.6, 2.55, 0x35553a], [1.45, 3.8, 0x2f4a33], [1.1, 5.0, 0x3a5c3e], [0.7, 6.0, 0x35553a]].forEach(([r, h, c], k) => dBlobE(r, 0.95, r, c, jx + (k % 2) * 0.1, Y + h, jz, { far: true, chunky: true, jitter: 0.12, ry: k }));   // 영상 f_225·f_228: 폭 3m·키 6.5m 빽빽한 원기둥 — 몸 높이(1.5) 아래 층은 막이 크기, 위층만 넓게
      dBlobE(1.2, 0.11, 1.15, 0x3f6a3a, jx + 0.1, Y, jz + 0.1, { chunky: true, jitter: 0.15 }); }

    // ---- 굽이 바깥: 통나무 경계 + 철사 울타리 꽃 화단 + 다듬은 큰 생울타리(f_228·f_233) ----
    { const LA = arcPts(ROX + 0.07, ROZ + 0.07, 0, Math.PI / 2, 12).map(([x, z]) => [x, z, -1]), WA = arcPts(ROX + 0.7, ROZ + 0.7, 0.05, Math.PI / 2 - 0.02, 12);
      logLine(LA);
      wireLine([[WX, ZC - 0.2], ...WA]);
      wireLine([WA[WA.length - 1], LA[LA.length - 1]], 0.5);
      [[0.2, 0.9], [0.55, 0.9], [0.9, 0.9], [1.25, 0.9]].forEach(([t, d]) => { const x = XC + (ROX + 0.35 + d * 0.2) * Math.cos(t), z = ZC + (ROZ + 0.35 + d * 0.2) * Math.sin(t);
        dBlobE(0.3, 0.32, 0.3, 0x5f8f45, x, Y + 0.25, z, { chunky: true, jitter: 0.15 }); [0xd9485a, 0xf2b632, 0xe06a8a].forEach((c, j) => dBlobE(0.08, 0.07, 0.08, c, x + (j - 1) * 0.15, Y + 0.55, z + (j % 2) * 0.1, { chunky: true })); });
      for (let z9 = KZ1 + 0.9, k = 0; z9 < ZC + 1.6; z9 += 1.25, k++) hedge(PX1S + 2.15 + (z9 > ZC ? (z9 - ZC) * 0.35 : 0), z9, 1.7, 1.35 + (k % 2) * 0.1, 1.7, [0x4f7a3c, 0x557f40][k % 2]);   // 개수대 남쪽 길게 다듬은 생울타리(f_225·f_228 왼쪽)
      [[PX1S + 1.6, ZC + 3.4, 2.8, 1.8, 2.4], [PX1S - 1.4, SZ1 + 2.3, 2.6, 1.6, 2.2]].forEach(([x9, z9, w, h, d], k) => hedge(x9, z9, w, h, d, [0x4f7a3c, 0x557f40, 0x4a7338][k % 3]));
      [[PX1S + 5.0, 41.0, 1.2], [PX1S + 5.3, 36.0, 1.15]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true)); }   // 흰 울타리(x 49) 안쪽

    // ---- 굽이 안쪽: 큰 나무 아래 포장 쉼터(f_225·f_233 — 돌 벤치·나무 조각·공원 벤치·평상, 안쪽 가 마리골드 화단) ----
    { const QX0 = 31.0, QZ0 = 30.6;
      patQuad('paveE', QX0, EF - 0.15, QZ0, FZ1 + 0.2, Y + 0.02);
      patQuad('paveE', QX0, PX0, FZ1 + 0.2, ZC, Y + 0.02);
      { const n = 10, cx9 = QX0; for (let k = 0; k < n; k++) { const a = k / n * Math.PI / 2, b = (k + 1) / n * Math.PI / 2;
        const A = [XC + RI * Math.cos(a), ZC + RI * Math.sin(a)], B9 = [XC + RI * Math.cos(b), ZC + RI * Math.sin(b)];
        floor4('paveE', [[cx9, A[1]], A, B9, [cx9, B9[1]]], Y + 0.02); } }
      // 마리골드 화단(굽이 안쪽 가 — f_233 오른쪽 앞)
      const IB = arcPts(RI - 1.1, RI - 1.1, 0.25, 1.3, 6), IO = arcPts(RI - 0.25, RI - 0.25, 0.25, 1.3, 6);
      wireLine(IB); wireLine(IO, 1.8); wireLine([IB[0], IO[0]], 0.4); wireLine([IB[6], IO[6]], 0.4);
      for (let k = 0; k < 9; k++) { const t = 0.32 + k * 0.11 + (R8() - 0.5) * 0.06, r = RI - 0.45 - R8() * 0.45, x = XC + r * Math.cos(t), z = ZC + r * Math.sin(t), q = 0.16 + R8() * 0.12;
        dBlobE(q, q * 0.9, q, pk([0x5a8a40, 0x4f7f3a, 0x62924a]), x, Y + q * 0.7, z, { jitter: 0.15, ry: k }); for (let j = 0; j < 3; j++) dBlobE(0.06, 0.05, 0.06, pk([0xf2a82a, 0xf5c030, 0xe8902a]), x + (R8() - 0.5) * q * 1.4, Y + q * 1.45, z + (R8() - 0.5) * q * 1.4, { chunky: true }); }
      // 둥근 화강석 벤치 둘(큰 나무 밑동 남쪽을 두른 호 + 쉼터 가운데) — 앉을 수 있음
      const arcBench = (cx, cz, r, t0, t1, n) => { for (let k = 0; k < n; k++) { const a = t0 + (t1 - t0) * k / n, b = t0 + (t1 - t0) * (k + 1) / n;
        const ax = cx + r * Math.cos(a), az = cz + r * Math.sin(a), bx = cx + r * Math.cos(b), bz = cz + r * Math.sin(b);
        slabE(ax, az, bx, bz, 0.42, 0.42, 0x8d8f8c, Y + 0.02); slabE(ax, az, bx, bz, 0.46, 0.05, 0x9a9c99, Y + 0.44);
        for (let h9 = 0; h9 < 2; h9++) { const px = ax + (bx - ax) * h9 / 2, pz = az + (bz - az) * h9 / 2, qx = ax + (bx - ax) * (h9 + 1) / 2, qz = az + (bz - az) * (h9 + 1) / 2;
          colliders.push({ x0: Math.min(px, qx) - 0.1, x1: Math.max(px, qx) + 0.1, y0: Y, y1: Y + 0.49, z0: Math.min(pz, qz) - 0.1, z1: Math.max(pz, qz) + 0.1 }); } } };
      const [tx9, tz9] = SCHOOL.bigTree;
      arcBench(tx9, tz9, 1.9, 0.5, 2.3, 5);
      arcBench(33.6, 33.6, 1.7, -0.3, 1.2, 4);
      hotspots.push({ kind: 'sit', x: tx9 + 1.9 * Math.cos(1.4), z: tz9 + 1.9 * Math.sin(1.4) + 0.45, y: Y, r: 0.9, label: '큰 나무 벤치에 앉기', yaw: Math.PI });
      // 나무 조각(탑 모양·작은 집 — f_233 오른쪽) · 짙은 공원 벤치(f_225 — 주물 다리) · 낮고 긴 나무 평상(남쪽 농구대 옆)
      { const [ax, az] = [33.6 + 1.7 * Math.cos(0.1), 33.6 + 1.7 * Math.sin(0.1)];
        dBoxE(0.34, 0.5, 0.34, 0xa38456, ax, Y + 0.49, az); dBoxE(0.46, 0.08, 0.46, 0x8a6b48, ax, Y + 0.99, az); dBoxE(0.26, 0.42, 0.26, 0xa38456, ax, Y + 1.07, az); dBoxE(0.4, 0.08, 0.4, 0x8a6b48, ax, Y + 1.49, az); dBoxE(0.16, 0.22, 0.16, 0xa38456, ax, Y + 1.57, az);
        colliders.push(noStand({ x0: ax - 0.25, x1: ax + 0.25, y0: Y + 0.49, y1: Y + 1.8, z0: az - 0.25, z1: az + 0.25 }));
        const [hx, hz] = [33.6 + 1.7 * Math.cos(0.9), 33.6 + 1.7 * Math.sin(0.9)];
        dBoxE(0.4, 0.3, 0.3, 0xb08e60, hx, Y + 0.49, hz); dCylE(0, 0.3, 0.22, 0x8a6b48, hx, Y + 0.79, hz, { seg: 4, rot: [0, Math.PI / 4, 0] });
        colliders.push(noStand({ x0: hx - 0.22, x1: hx + 0.22, y0: Y + 0.49, y1: Y + 1.1, z0: hz - 0.2, z1: hz + 0.2 })); }
      { const bx9 = 35.4, bz9 = 32.2;   // 공원 벤치(등받이 · 서쪽을 봄 — 운동장 쪽)
        for (let k = 0; k < 4; k++) dBoxE(0.09, 0.04, 1.6, 0x6d5236, bx9 - 0.15 + k * 0.11, Y + 0.44, bz9);
        for (let k = 0; k < 3; k++) dBoxE(0.04, 0.09, 1.6, 0x6d5236, bx9 + 0.3, Y + 0.6 + k * 0.13, bz9);
        [-0.7, 0.7].forEach(o => { dBoxE(0.5, 0.44, 0.06, 0x2a2c30, bx9 + 0.05, Y + 0.02, bz9 + o); dBoxE(0.06, 0.5, 0.06, 0x2a2c30, bx9 + 0.3, Y + 0.46, bz9 + o); });
        colliders.push(noStand({ x0: bx9 - 0.22, x1: bx9 + 0.36, y0: Y, y1: Y + 0.95, z0: bz9 - 0.82, z1: bz9 + 0.82 }));
        hotspots.push({ kind: 'sit', x: bx9 - 0.55, z: bz9, y: Y, r: 0.9, label: '벤치에 앉기', yaw: Math.PI / 2 }); }
      { const px9 = 33.2, pz9 = 30.9;   // 낮고 긴 나무 평상(f_220 농구대 뒤)
        dBoxE(3.0, 0.08, 0.6, 0x7a6a55, px9, Y + 0.34, pz9); [-1.3, 1.3].forEach(o => dBoxE(0.12, 0.34, 0.5, 0x5e5042, px9 + o, Y, pz9));
        colliders.push({ x0: px9 - 1.5, x1: px9 + 1.5, y0: Y, y1: Y + 0.42, z0: pz9 - 0.3, z1: pz9 + 0.3 }); }
    }

    // ---- 큰 나무(상징물 — f_192·f_196: 둥글고 빽빽한 수관 폭 약 15m·키 약 16m, 밑동 = 철망 서쪽 2m) ----
    { const [tx, tz] = SCHOOL.bigTree, BK = 0x5a4a3c;
      colliders.push({ x0: tx - 0.55, x1: tx + 0.55, y0: Y, y1: Y + 12, z0: tz - 0.55, z1: tz + 0.55 });
      dCylE(0.42, 0.62, 6.2, BK, tx, Y, tz, { far: true, seg: 9 });
      dCylE(0.6, 0.85, 0.5, BK, tx, Y, tz, { far: true, seg: 9 });
      [[0.4, 0.55], [2.5, 0.5], [4.4, 0.6], [5.6, 0.45]].forEach(([a, t]) => dCylE(0.14, 0.26, 3.6, BK, tx + Math.cos(a) * 0.2, Y + 5.2, tz + Math.sin(a) * 0.2, { far: true, rot: [t * Math.sin(a), 0, -t * Math.cos(a)] }));
      dBlobE(6.6, 5.0, 6.6, 0x4a6e42, tx, Y + 11.4, tz, { far: true, chunky: true, jitter: 0.12 });
      [[0, 4.4, 9.8, 4.3], [1.05, 4.8, 9.0, 4.1], [2.1, 4.5, 10.8, 4.5], [3.15, 4.7, 9.4, 4.0], [4.2, 4.6, 10.4, 4.4], [5.25, 4.8, 9.2, 4.2]].forEach(([a, d, h, r], k) =>
        dBlobE(r, r * 0.88, r, [0x507647, 0x44683e, 0x5a7f4e][k % 3], tx + Math.cos(a) * d, Y + h, tz + Math.sin(a) * d, { far: true, chunky: true, jitter: 0.14, ry: a }));
      dBlobE(4.0, 3.0, 4.0, 0x5a804e, tx + 0.5, Y + 15.4, tz - 0.4, { far: true, chunky: true, jitter: 0.14 }); }

    // ---- 야외 농구대 둘(마주 봄 — f_192·f_198: 북쪽 = 남향 · f_220: 큰 나무 앞 = 북향 · 투명 판 + 녹슨 주황 링) ----
    [[34.3, 3.5, 1], [34.9, 26.6, -1]].forEach(([hx, hz, dir]) => { const pz = hz - dir * 0.95, S9 = 0xb9bdc0;
      post(hx, pz, Y, Y + 3.4, 0.12); dCylE(0.07, 0.09, 3.3, S9, hx, Y, pz, { far: true, seg: 8 });
      dRodE(hx, Y + 3.1, pz, hx, Y + 3.3, hz - dir * 0.08, 0.05, S9, F9); dRodE(hx, Y + 2.6, pz, hx, Y + 3.0, hz - dir * 0.08, 0.04, S9, F9);
      dBoxE(1.8, 1.05, 0.04, 0xdfe7ea, hx, Y + 2.85, hz, F9);
      [0.01, 1.0].forEach(y9 => dBoxE(1.76, 0.04, 0.05, 0x9aa0a6, hx, Y + 2.85 + y9, hz, F9));
      [-0.9, 0.9].forEach(o => dBoxE(0.04, 1.04, 0.06, 0x9aa0a6, hx + o, Y + 2.855, hz, F9));
      dGeo(new THREE.TorusGeometry(0.23, 0.02, 5, 14).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(hx, Y + 3.05, hz + dir * 0.28), 0xc4622d, F9); });

    // ---- 남쪽 길 남쪽 가: 자연석 줄(f_240·f_243) ----
    for (let x9 = SCHOOL.forestPlay.x[0] + 0.3; x9 < XC - 0.3; x9 += 0.8 + R8() * 0.3) { const SW8 = SCHOOL.forestPlay.x[0] + 2.9, SM8 = SCHOOL.forestPlay.x[0] + 5.1; if (Math.abs(x9 - SW8) < 0.95 || Math.abs(x9 - SM8) < 0.95) continue;   // 데크 계단 앞은 비움(숲놀이터 블록 SW9·SM9)
      const s = 0.3 + R8() * 0.15; dBlobE(s * 1.2, s * 0.7, s, pk([0xb8b6ae, 0xa9a79f, 0xcac8c0]), x9, Y + s * 0.2, SZ1 + 0.4, { chunky: true, jitter: 0.18, ry: x9 });
      colliders.push(noStand({ x0: x9 - s * 1.05, x1: x9 + s * 1.05, y0: Y, y1: Y + s * 0.85, z0: SZ1 + 0.4 - s * 0.9, z1: SZ1 + 0.4 + s * 0.9 })); }   // 막이 = 돌 겉모양 크기(발 묻힘 0)
    // ---- 화단 동쪽 흰 울타리(영상 f_205~f_228 왼쪽 — 화단 뒤 흰 쇠 울타리 + 바로 바깥 전봇대 · 그 너머 밭) ----
    //   북 = 학교 둘레 x 60(f_201 왼쪽 먼 흰 울타리) 에서 사선으로 들어와 z 14부터 x 49로 남쪽 둘레(정문 동쪽 사선)까지. 바깥 x 49~60은 밭(들어가지 못함)
    { const EZ1 = 45 + (60 - EWX) / (60 - 21.1) * (55.5 - 45) - 0.08;   // 정문 동쪽 사선 둘레(SOUTH-2: (60,45)→(21.1,55.5))와 만나는 곳
      const wf = (x0, z0, x1, z1, e0) => { const L = Math.hypot(x1 - x0, z1 - z0), H = 1.3, P = [[x0, Y, z0], [x1, Y, z1], [x1, Y + H, z1], [x0, Y + H, z0]], U = [[0, 0], [L / 0.6, 0], [L / 0.6, H / 0.6], [0, H / 0.6]];   // 흰 쇠 울타리 — 그물판은 울타리 메시(fencePos), 기둥·윗대는 가까이 층(먼 시점 삼각형 — meshFence 기둥은 먼 층)
        _c.set(0xf6f6f2); for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); }
        const n = Math.max(1, Math.round(L / 2.5)), at = z => ({ at: [40, z < 12 ? 8 : z < 34 ? 20 : 36] });
        for (let i = e0 ? 0 : 1; i <= n; i++) { const px = x0 + (x1 - x0) * i / n, pz = z0 + (z1 - z0) * i / n; dBox(0.08, H - 0.19, 0.08, 0xeeeeea, px, Y + 0.25, pz, at(pz)); }   // 콘크리트 턱(0.25) 위에 섬
        for (let k = 0; k < n; k++) { const za = z0 + (z1 - z0) * k / n; dRod(x0 + (x1 - x0) * k / n, Y + H, za, x0 + (x1 - x0) * (k + 1) / n, Y + H, z0 + (z1 - z0) * (k + 1) / n, 0.025, 0xeeeeea, at(za)); } };
      wf(59.85, 8.0, EWX, 14.0, true);
      { const n = Math.ceil(Math.hypot(59.85 - EWX, 6) / 0.3); for (let i = 0; i < n; i++) { const ax = 59.85 + (EWX - 59.85) * i / n, az = 8 + 6 * i / n, bx = 59.85 + (EWX - 59.85) * (i + 1) / n, bz = 8 + 6 * (i + 1) / n;
        colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: Y, y1: Y + 4.5, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); } }   // 사선 = 0.3m 토막 막이(보이지 않는 벽 0)
      wf(EWX, 14.0, EWX, EZ1, false); colliders.push({ x0: EWX - 0.12, x1: EWX + 0.12, y0: Y, y1: Y + 4.5, z0: 14.0, z1: EZ1 + 0.12, nc: true });
      slab(59.85, 8.0, EWX, 14.0, 0.22, 0.25, 0xbdb9b0, Y, { far: true }); dBox(0.22, 0.25, EZ1 - 14.0, 0xbdb9b0, EWX, Y, (14.0 + EZ1) / 2, { far: true });   // 콘크리트 턱
      patQuad('grass', EWX + 0.15, 59.85, 14.2, 45.0, Y + 0.004, false, 0xc9d8a8); }   // 울타리 너머 밭(평평한 풀 — 영상 f_212)
    // ---- 본관 동쪽 끝 둘레(위성 E-1: 회색 맨바닥 띠 x 56.5~62 → 잔디) · 동쪽 뾰족한 큰 침엽수(f_264 조명탑 왼쪽) · 본관 옥상 앞쪽 흰 실외기 넷(위성) ----
    { const NC = FY.walkN - 0.12, SC = FY.walkS + 0.12;
      patQuad('grass', WX1 + 3, 62, fz1 - 10, NC, YARD + 0.012, false, 0xe9f2df);          // 앞뜰 '본관 동쪽 끝 잔디'(x ~WX1+3)에 맞대기
      patQuad('grass', WX1, 62, NC, SC, YARD + 0.012, false, 0xe9f2df);                    // 산책로 동끝 너머
      patQuad('grass', 60, 62, SC, TERR_Z, YARD + 0.012, false, 0xe2eed6);                  // 남 화단(x ~60) 너머 둘레 밖
      pine(56.8, -27.5, 1.8);
      // 동쪽 가장자리 나무 띠 둘째 줄(위성 E-5: z -20~10 x 55.5~59 끊기지 않는 수관 — 기존 x 55 한 줄 사이에 엇갈려) · 가까이 층 한 청크(56,-8)
      //   먼 층이면 급식 창고 등 먼 시점 최악 삼각형 래칫을 넘는다 — 66m 밖에선 숨는다(x 55 줄은 그대로 보임) · 둔덕(z -13.6~-12.4) 위는 피함(아래 밑동이면 잎이 대지 몸 높이에 걸림)
      [[57.7, -21.0, 1.05], [58.4, -16.5, 0.95], [57.5, -6.5, 1.1], [58.4, 0.5, 1.0], [57.6, 6.0, 0.95]].forEach(([x9, z9, s9]) => { const y9 = tY(z9, x9), h9 = hash2(x9, z9), N9 = { at: [56, -8] };
        colliders.push({ x0: x9 - 0.19 * s9, x1: x9 + 0.19 * s9, y0: y9, y1: y9 + 12, z0: z9 - 0.19 * s9, z1: z9 + 0.19 * s9 });   // [quality4 09-26] 0.3 → 0.19 = 5각 줄기(밑 0.22) 안쪽(bgTree와 같음) — (58.4,-16.5) 보이지 않는 벽 2간선
        dCyl(0.14 * s9, 0.22 * s9, 2.6 * s9, 0x6d4e32, x9, y9, z9, { ...N9, seg: 5 });
        dBlob(1.7 * s9, 1.4 * s9, 1.7 * s9, [0x3f7a3f, 0x4d8b4d, 0x467f44][Math.floor(h9 * 3) % 3], x9, y9 + 3.2 * s9, z9, { ...N9, chunky: true, ry: h9 * 6, jitter: 0.14 });
        dBlob(1.15 * s9, 0.95 * s9, 1.15 * s9, 0x5c9a4f, x9 - 0.4 * s9, y9 + 4.1 * s9, z9 + 0.3 * s9, { ...N9, chunky: true, ry: h9 * 9, jitter: 0.14 }); });
      // 동쪽 둘레 밖 흰 연석 찻길(위성 E: x 58.7~63.5 · z 12~45 남북 → (60,12)에서 북동으로 꺾임 · 남쪽 끝 = 남동 시멘트 마을길) — 둘레 울타리(x 60) 바깥으로 1.5m 비킴
      floor4('asph', [[60.5, 12], [65, 12], [65, 46.4], [60.5, 46.4]], Y + 0.01);
      floor4('asph', [[60.5, 12], [74.5, -1.67], [77.5, 1.67], [65, 12]], Y + 0.01);
      floor4('asph', [[74.5, -1.67], [90.6, -14.75], [93.4, -11.25], [77.5, 1.67]], Y + 0.01);
      slab(60.45, 12.3, 60.45, 46.3, 0.15, 0.12, 0xe8e8e2, Y, { far: true });   // 흰 연석
      // '주차금지' 콘 하나 더(f_243 — 남쪽 길 서끝 운동장 쪽 · 버스 쪽)
      { const cx9 = 17.9, cz9 = 40.7; dCyl(0.08, 0.26, 0.6, 0xe0602f, cx9, Y + 0.02, cz9, { seg: 10, at: [40, 36] }); dCyl(0.05, 0.05, 0.18, 0xe0602f, cx9, Y + 0.62, cz9, { seg: 8, at: [40, 36] });
        dCyl(0.2, 0.2, 0.04, 0xe0602f, cx9, Y + 0.86, cz9, { seg: 8, rot: [Math.PI / 2, 0, 0], at: [40, 36] }); sign('주차금지', cx9, Y + 0.86, cz9 - 0.015, Math.PI, 0.1, { bg: '#e0602f', fg: '#ffffff' });
        colliders.push(noStand({ x0: cx9 - 0.26, x1: cx9 + 0.26, y0: Y, y1: Y + 1.0, z0: cz9 - 0.26, z1: cz9 + 0.26 })); }
      [[25.8, -24.6], [28.8, -24.6], [37.1, -24.6], [46.6, -24.6]].forEach(([x9, z9]) => { dBox(1.0, 0.8, 0.6, 0xe6e8e4, x9, FH + 0.3, z9, { far: true }); }); }
    zones.push({ x0: PX0, x1: PX1 + 3, z0: TR3.fieldZ, z1: 50, y: FIELD, label: '동쪽 통학로' });
  }
  {   // 숲놀이터 EAST-2 — 사용자 09-24 "큰나무 바로 아래 저 구석" · 영상 f_233~243: 남쪽 길 남쪽 나무들 사이 높은 나무 데크(난간·아이 그림판·계단 둘) + 동쪽 검은 그물 놀이틀
    const FP = SCHOOL.forestPlay, Y = FIELD, DX0 = FP.x[0] + 2.2, DX1 = DX0 + 6.0, DZ0 = 46.0, DZ1 = 48.8, DH = 0.9, WD = 0x8a6b48, RL = 0x7a5c3e, SW9 = DX0 + 0.7, SM9 = DX0 + 2.9;   // 계단 = 서끝 · 가운데(f_240)
    // 작은 부재 청크 고르기(성능): 16m 칸마다 새 청크가 생기면 드로우콜이 늘고, 긴 구역을 한 청크로 묶으면 경계 구가 커져 본관 동끝 교실 안에서도 절두체에 든다(+1콜)
    //   → 북 구간(z < 12) = 이미 있는 먼 층 청크(40,-8)에 합침(본관에서 이미 보이는 청크) · 남 구간 = 가까이 층 (40,24)·(40,40) 두 청크(55m 밖이면 숨김)
    const NA = (o, z) => (o && o.far) ? o : z < 12 ? { ...(o || {}), far: true, at: [40, -8] } : { ...(o || {}), at: [40, z < 34 ? 20 : 36] };
    const dBoxE = (w, h, d, c, x, y, z, o) => dBox(w, h, d, c, x, y, z, NA(o, z)), dBlobE = (sx, sy, sz, c, x, y, z, o) => dBlob(sx, sy, sz, c, x, y, z, NA(o, z)), dRodE = (x0, y0, z0, x1, y1, z1, r, c, o) => dRod(x0, y0, z0, x1, y1, z1, r, c, NA(o, z0));
    const dCylE = (rt, rb, h, c, x, y, z, o) => dCyl(rt, rb, h, c, x, y, z, NA(o, z)), slabE = (x0, z0, x1, z1, w, h, c, y0, o) => slab(x0, z0, x1, z1, w, h, c, y0, NA(o, z0));
    addBox(DX1 - DX0, DH, DZ1 - DZ0, WD, (DX0 + DX1) / 2, Y, (DZ0 + DZ1) / 2);                                 // 데크(올라설 수 있음)
    for (let x9 = DX0 + 0.3; x9 < DX1 - 0.2; x9 += 0.3) dBoxE(0.03, 0.03, DZ1 - DZ0 - 0.1, 0x6e5438, x9, Y + DH - 0.015, (DZ0 + DZ1) / 2);   // 널 틈
    const stair = (sx, n9 = 4) => { for (let k = 1; k <= n9; k++) addBox(1.0, DH * k / n9, 0.3, 0x6d5236, sx, Y, DZ0 - 0.15 - 0.3 * (n9 - k));   // 앞(북)으로 내려오는 계단
      // 양옆 옆판 + 손잡이(f_240 — 계단 양쪽 난간) · 막이: 계단 옆으로 떨어져 데크 앞 좁은 띠(자연석 줄 뒤)에 갇히던 것(검진 갇힘 10칸) 차단
      const SL = 0.3 * n9, a9 = Math.atan2(DH, SL);
      [-1, 1].forEach(s => { const x9 = sx + s * 0.535;
        _dm.compose(_dv.set(x9, Y + DH / 2 + 0.02, DZ0 - SL / 2), _dq.setFromEuler(_de.set(-a9, 0, 0)), _ds.set(0.05, 0.22, Math.hypot(SL, DH))); dGeo(box_, _dm, 0x7a5c3e, { at: [40, 36] });
        dBoxE(0.06, 0.95, 0.06, RL, x9, Y, DZ0 - SL + 0.05);
        dRodE(x9, Y + 0.95, DZ0 - SL + 0.05, x9, Y + DH + 0.95, DZ0 - 0.05, 0.03, 0x8a6b48);
        colliders.push(noStand({ x0: x9 - 0.03, x1: x9 + 0.03, y0: Y, y1: Y + DH + 1.0, z0: DZ0 - SL - 0.02, z1: DZ0 })); }); };
    stair(SM9); stair(SW9);
    // 난간(기둥 + 윗대 + 살) — 계단 자리는 트임 · 막이는 난간 선마다
    const rail = (x0, z0, x1, z1, e0 = true, e1 = true, dy = 0) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.5));   // e0·e1 = 끝 기둥을 세울지(모서리 기둥은 한 번만) · dy = 윗대 높이 비킴(모서리에서 겹치는 윗대)
      for (let i = e0 ? 0 : 1; i <= (e1 ? n : n - 1); i++) { const t = i / n; dBoxE(0.08, 0.95, 0.08, RL, x0 + (x1 - x0) * t, Y + DH, z0 + (z1 - z0) * t); }
      for (let t = 0.25 / L; t < 1; t += 0.25 / L) { if (Math.abs(t * n - Math.round(t * n)) * L / n < 0.1) continue; dBoxE(0.04, 0.8, 0.04, RL, x0 + (x1 - x0) * t, Y + DH + 0.05, z0 + (z1 - z0) * t); }
      dBoxE(Math.abs(x1 - x0) + 0.1, 0.06, Math.abs(z1 - z0) + 0.1, 0x8a6b48, (x0 + x1) / 2, Y + DH + 0.95 + dy, (z0 + z1) / 2);
      colliders.push(noStand({ x0: Math.min(x0, x1) - 0.06, x1: Math.max(x0, x1) + 0.06, y0: Y + DH, y1: Y + DH + 1.6, z0: Math.min(z0, z1) - 0.06, z1: Math.max(z0, z1) + 0.06 })); };
    rail(SW9 + 0.5, DZ0 + 0.04, SM9 - 0.5, DZ0 + 0.04); rail(SM9 + 0.5, DZ0 + 0.04, DX1 - 0.04, DZ0 + 0.04);
    rail(DX0 + 0.04, DZ1 - 0.04, DX1 - 0.04, DZ1 - 0.04); rail(DX0 + 0.04, DZ0 + 0.04, DX0 + 0.04, DZ1 - 0.16, true, false, 0.01); rail(DX1 - 0.04, DZ0 + 0.16, DX1 - 0.04, DZ1 - 0.16, false, false, 0.01);   // 동쪽(그물 쪽)도 난간
    // 앞 난간 아이 그림판(색 칸 7) + 흰 안내판(f_240)
    [0xe8574a, 0xf2c230, 0x4f9fdc, 0x6fbf5a, 0xf08a3a, 0x9a6fd0].forEach((c, k) => dBoxE(0.32, 0.3, 0.03, c, SM9 + 0.75 + k * 0.36, Y + DH + 0.45, DZ0 - 0.02));
    dBoxE(0.6, 0.7, 0.03, 0xf2f2ee, (SW9 + SM9) / 2, Y + DH + 0.12, DZ0 - 0.02);
    // 동쪽 검은 그물 놀이틀(f_240 — 통나무 틀 안에 처진 검은 그물) · 들어가지 못함(막이)
    { const NX0 = DX1, NX1 = FP.x[1], NZ0 = DZ0, NZ1 = DZ1, BY = Y + 0.85;
      [[NX0 + 0.08, NZ0 + 0.08], [NX1 - 0.08, NZ0 + 0.08], [NX0 + 0.08, NZ1 - 0.08], [NX1 - 0.08, NZ1 - 0.08]].forEach(([px9, pz9]) => dBoxE(0.16, 0.85, 0.16, 0x9a7b52, px9, Y, pz9));
      dBoxE(NX1 - NX0, 0.15, 0.15, 0xc9a877, (NX0 + NX1) / 2, BY, NZ0 + 0.075); dBoxE(NX1 - NX0, 0.15, 0.15, 0xc9a877, (NX0 + NX1) / 2, BY, NZ1 - 0.075);
      dBoxE(0.15, 0.15, NZ1 - NZ0 - 0.3, 0xc9a877, NX1 - 0.075, BY + 0.005, (NZ0 + NZ1) / 2);
      for (let x9 = NX0 + 0.3; x9 < NX1 - 0.1; x9 += 0.3) { dRodE(x9, BY, NZ0 + 0.15, x9, BY - 0.3, (NZ0 + NZ1) / 2, 0.012, 0x2f3236); dRodE(x9, BY - 0.3, (NZ0 + NZ1) / 2, x9, BY, NZ1 - 0.15, 0.012, 0x2f3236); }
      for (let z9 = NZ0 + 0.3; z9 < NZ1 - 0.1; z9 += 0.3) { const sag = 0.3 * Math.sin(Math.PI * (z9 - NZ0) / (NZ1 - NZ0)); dRodE(NX0, BY - sag * 0.7, z9, (NX0 + NX1) / 2, BY - sag, z9, 0.012, 0x2f3236); dRodE((NX0 + NX1) / 2, BY - sag, z9, NX1 - 0.15, BY - sag * 0.7, z9, 0.012, 0x2f3236); }
      colliders.push(noStand({ x0: NX0, x1: NX1, y0: Y, y1: Y + 1.0, z0: NZ0, z1: NZ1 })); }
    sign('숲놀이터', SM9 + 1.65, Y + DH + 1.22, DZ0 - 0.02, Math.PI, 0.3);
    // 데크 둘레 나무(f_240 — 데크를 뚫고 선 듯 가까이) · 숲놀이터 바닥 = 잔디(나무칩 없음)
    [[DX0 - 1.3, 47.6, 1.2], [DX1 - 1.0, 50.0, 1.05]].forEach(([x9, z9, s9]) => tree(x9, z9, s9, true));
    zones.push({ x0: FP.x[0], x1: FP.x[1], z0: FP.z[0], z1: FP.z[1], y: Y, label: '숲놀이터' });
  }
  {   // 통학버스(관광버스형 — 영상 g_006.5·s_009~019.5): 쉼터 동쪽 칸 옆에 서쪽을 보고 선다 · 길이 11.6·높이 3.2 · 문 = 오른쪽(북)
    const [bx9, bz9] = SCHOOL.bus, F = { far: true }, Y = FIELD, BK = 0x2f3a45;
    colliders.push(noStand({ x0: bx9 - 5.8, x1: bx9 + 5.8, y0: Y, y1: Y + 3.2, z0: bz9 - 1.25, z1: bz9 + 1.25 }));
    dBox(11.6, 2.85, 2.5, 0xf2c230, bx9, Y + 0.35, bz9, F);
    dBox(11.6, 0.2, 2.46, 0x3a3d44, bx9, Y + 0.15, bz9, F);
    dBox(9.8, 1.1, 2.54, BK, bx9 + 0.3, Y + 1.75, bz9, F);                                            // 옆 창 띠
    dBox(0.06, 1.5, 2.3, BK, bx9 - 5.83, Y + 1.35, bz9, F);                                           // 앞유리
    dBox(0.06, 0.95, 2.2, BK, bx9 + 5.83, Y + 2.05, bz9, F);                                          // 뒷유리(위 1/3)
    dBox(0.1, 0.3, 2.42, 0x26282c, bx9 - 5.85, Y + 0.3, bz9, F);                                       // 앞 범퍼
    dBox(0.1, 0.3, 2.42, 0x26282c, bx9 + 5.85, Y + 0.3, bz9, F);
    dBox(0.9, 2.2, 0.04, 0x3a4652, bx9 - 4.6, Y + 0.4, bz9 - 1.27, F);                                 // 오른쪽(북) 문
    dBox(2.2, 0.55, 0.03, 0xf4f1e0, bx9 + 1.6, Y + 1.1, bz9 + 1.265);                                  // 옆 흰 판(글자 없이 — 영상 s_016.5 흰 스티커 자리)
    [[-3.9], [2.6], [4.1]].forEach(([ox]) => [-1, 1].forEach(sz => dCyl(0.5, 0.5, 0.3, 0x26282c, bx9 + ox, Y + 0.5, bz9 + sz * 1.12, { far: true, seg: 10, rot: [Math.PI / 2, 0, 0] })));
    [-1, 1].forEach(sz => { dBox(0.04, 0.18, 0.4, 0xf4f1e0, bx9 - 5.82, Y + 0.6, bz9 + sz * 0.85);
      dBox(0.04, 0.7, 0.16, 0xc0392b, bx9 + 5.82, Y + 0.75, bz9 + sz * 1.05);                          // 뒷등(세로)
      dRod(bx9 - 5.8, Y + 2.4, bz9 + sz * 1.2, bx9 - 6.25, Y + 2.2, bz9 + sz * 1.35, 0.025, 0x26282c, F); });   // 사이드미러 팔
    zones.push({ x0: Math.max(-4.5, ...zones.filter(q => q.label === '놀이마당').map(q => q.x1)), x1: SCHOOL.plaza.x[1], z0: SCHOOL.shelter.center[1] + 2.25, z1: 56, y: Y, label: '버스 타는 곳' });   // [integ 09-25] 서끝 = 놀이마당 동끝(겹침 53칸 제거)
  }

  // ================= 뒤뜰 (영상 IMG_2180 0~107s · 위성): 서관 뒤 주차장 · 노란 창고 · 흙길 · 큰 텃밭 · 동관 동쪽 데크 =================
  //   BACKYARD-2(09-24 위성 B·영상 b_018~106 대조): 주차 3줄(북쪽 줄 서쪽 끝은 연석 따라 비스듬)·남서 잔디섬·장애인 구획 · 노란 컨테이너 두 동 ·
  //   검은 잡초매트 길 + 깎은 잔디·바위 둘레·생울타리 · 텃밭(검은 매트 + 두둑마다 다른 작물·호스·수도) · 큰 나무들이 뚫고 선 데크 + A자 피크닉 탁자 · 벽돌 마당·전봇대
  function whiteFence(x0, z0, x1, z1, yb) {   // 북쪽 흰 무늬 쇠 울타리(영상 b_031~033 — 정문 서쪽 것과 같은 모양) + 콘크리트 턱. 충돌은 1m 토막(비스듬한 변을 AABB 하나로 막으면 주차장이 통째로 막힌다)
    meshFence(x0, z0, x1, z1, yb, 1.3, 0xf6f6f2, 0xe9e9e4, false, 8);
    byRot(x0, z0, x1, z1, 0.22, 0.25, yb, 0xc9c6be, { far: true });
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3));   // [integ 09-25] 1m ± 0.12 → 0.3m ± 0.06(남쪽 diagWall과 같은 규칙) — 비스듬한 북쪽 변에서 토막 모서리가 울타리 앞 0.3m 보이지 않는 벽이었다
    for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
      colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: yb, y1: yb + 3, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); }
  }
  function byRot(x0, z0, x1, z1, w, h, y0, hex, opt = {}) {   // 두 점 사이 비스듬한 상자(연석·턱·먼 공장) — dGeo라 감사 밖. 8m 넘으면 토막(청크 경계 상자가 부풀면 절두체 컬링이 안 된다)
    const L = Math.hypot(x1 - x0, z1 - z0), n = opt.whole ? 1 : Math.max(1, Math.ceil(L / 8)), a = Math.atan2(-(z1 - z0), x1 - x0);
    for (let i = 0; i < n; i++) {
      _dm.compose(_dv.set(x0 + (x1 - x0) * (i + 0.5) / n, y0 + h / 2, z0 + (z1 - z0) * (i + 0.5) / n), _dq.setFromEuler(_de.set(0, a, 0)), _ds.set(L / n, h, w));
      dGeo(box_, _dm, hex, opt);
    }
  }
  const dBlob0 = dBlob, dRod0 = dRod;
  function byPanel(w, d, hex, cx, y, cz, a) {   // 돌린 바닥 칠(주차선·빗금·기호 — 로컬 d축이 (-sin a, cos a)) · addPanel과 같은 청크 병합
    const ch = chunkOf(cx, cz), c = Math.cos(a), s = Math.sin(a);
    _c.set(hex); _c.multiplyScalar(0.97);
    const P = [[-w/2, -d/2], [-w/2, d/2], [w/2, d/2], [w/2, -d/2]].map(([u, v]) => [cx + u * c - v * s, cz + u * s + v * c]);
    for (const i of [0, 1, 2, 0, 2, 3]) { ch.pos.push(P[i][0], y, P[i][1]); ch.col.push(_c.r, _c.g, _c.b); }
  }
  {
    const PK = SCHOOL.parking, K2 = B.kitchen, Y = YARD, LINE = 0xe8eaea, [cw, cm, ce] = PK.curb;
    const byQuad = (kind, pts, y, tint = 0xffffff) => { const S = PATDEF[kind][0], P = (pts.length === 3 ? [...pts, pts[2]] : pts).map(([x, z]) => [x, y, z]); patPush(kind, P, P.map(p => [p[0] / S, -p[2] / S]), [0, 1, 0], tint); };
    const SHU = SCHOOL.shed.units, zS = SHU[1].z[1] + 0.25;                    // 창고 남쪽 동 지붕 남끝 = 대각 연석 시작(위성 B-9)
    const kx0o = K2.x[0] - 0.15, kz0o = K2.z[0] - 0.15;                       // 급식동 서벽·북벽 바깥 면
    const TH = Math.atan2(cm[1] - cw[1], cm[0] - cw[0]), dcx = Math.cos(TH), dcz = Math.sin(TH);
    const zc = x => x >= cm[0] ? cm[1] : cm[1] + (x - cm[0]) * dcz / dcx;     // 북쪽 연석 z
    const xd = z => PK.x[1] + (z - zS) / (kz0o - zS) * (kx0o - PK.x[1]);       // 급식동 북서 대각 연석 x
    const [f0, f1, f2, f3] = SCHOOL.boundary.slice(2, 6), lerpZ = (a, b, x) => a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    const FZ = x => x <= f1[0] ? lerpZ(f0, f1, x) : x <= f2[0] ? lerpZ(f1, f2, x) : lerpZ(f2, f3, x);   // 북쪽 울타리 z
    const GP = SCHOOL.garden.poly, DK = SCHOOL.gardenDeck, DX = DK.x, DZ = DK.z, DT = Y + 0.24;
    const PZ = [-56.55, -55.65];                                                // 흙길 z(위성 옅은 선 z -55.3 · 영상 폭 0.9)
    const XB = E.x[1] + 0.15, XH = 49.2;                                        // 벽돌 마당 x(동관 동면 ~ 비비추 화단)
    const GR = 0xb4c08a, MOW = 'dirt', MAT = 0x5a5856, BRK = 0xae8c80;                        // 누렇게 깎은 잔디(영상 b_036~088 — 풀 무늬는 너무 짙은 초록이라 흙 무늬에 올리브 틴트) · 검은 잡초매트 · 바랜 적갈 인터로킹 블록(보도블록 무늬 — 20×10cm)

    // ---- 바닥: 아스팔트(연석 안) · 뒷길 · 잔디(서로 맞대기만 — 겹치면 깜빡인다) ----
    patQuad('asph', G.annex.x[1] + 0.15, TR3.westX - 0.3, gz0 - 0.15, G.annex.z[0] - 3, Y + 0.012);
    patQuad('asph', gx1 + 0.15, wx0 - 0.15, wz0 - 0.15, gz0 - 0.15, Y + 0.012);
    patQuad('asph', PK.x[0], kx0o, cm[1], wz0 - 0.15, Y + 0.012);
    patQuad('asph', kx0o, PK.x[1], cm[1], zS, Y + 0.012);
    byQuad('asph', [[kx0o, zS], [PK.x[1], zS], [kx0o, kz0o]], Y + 0.012);                          // 급식동 북서 대각 연석 안
    byQuad('asph', [cw, cm, [cw[0], cm[1]]], Y + 0.012);                                            // 북쪽 줄 서쪽 비스듬한 끝
    patQuad('asph', wx1 + 0.15, kx0o, wz0 - 0.15, fz0 - 0.15, Y + 0.012, false, 0xc8c8c8);        // 서관|급식동 뒷길(3.2m · 틴트는 곱셈 → 주차장보다 조금 짙게)
    [[cw, cm], [cm, ce], [[PK.x[1], zS], [kx0o, kz0o]]].forEach(([a, b]) => byRot(a[0], a[1], b[0], b[1], 0.15, 0.1, Y + 0.012, 0xd4d2cc, { far: true }));   // 연석
    byQuad(MOW, [f0, [cm[0], FZ(cm[0])], cm, [f0[0], zc(f0[0])]], Y + 0.012, GR);             // 북쪽 줄 뒤 풀띠(서쪽 비스듬)
    patQuad(MOW, cm[0], PK.x[1], FZ(0), cm[1], Y + 0.012, false, GR);
    patQuad(MOW, PK.x[1], GP[0][0], FZ(0), zS, Y + 0.012, false, GR);                          // 창고 둘레·동쪽 풀밭(위성 B-9)
    patQuad(MOW, GP[0][0], GP[1][0], FZ(0), GP[0][1], Y + 0.012, false, GR);                  // 텃밭 북쪽 띠
    byQuad(MOW, [[GP[1][0], FZ(GP[1][0])], [GP[2][0], FZ(GP[2][0])], GP[2], GP[1]], Y + 0.012, GR);
    byQuad(MOW, [GP[2], [50, FZ(50) + 0.9], [50, GP[3][1]], GP[3]], Y + 0.012, GR);             // 텃밭 동쪽 큰 나무 잔디밭
    byQuad(MOW, [[GP[2][0], FZ(GP[2][0])], [50, FZ(50)], [50, FZ(50) + 0.9], GP[2]], Y + 0.012, GR);
    byQuad(MOW, [[50, FZ(50)], [60, FZ(60)], [60, DZ[0]], [50, DZ[0]]], Y + 0.012, GR);         // 데크 북쪽
    patQuad(MOW, GP[0][0], 50, GP[4][1], PZ[0], Y + 0.012, false, GR);                          // 흙길 북쪽(텃밭 앞)
    byQuad(MOW, [[xd(PZ[0]), PZ[0]], [PK.x[1], zS], [GP[0][0], zS], [GP[0][0], PZ[0]]], Y + 0.012, GR);
    byQuad(MOW, [[xd(PZ[1]), PZ[1]], [XB, PZ[1]], [XB, kz0o], [kx0o, kz0o]], Y + 0.012, GR);  // 흙길 남쪽(바위 둘레 화단·생울타리)
    [[f0, f1], [f1, f2], [f2, f3]].forEach(([a, b]) => byQuad('grass', [[a[0], -90], a, b, [b[0], -90]], Y + 0.012, 0xb7c99a));   // 울타리 밖 풀
    byQuad('asph', [[xd(PZ[0]), PZ[0]], [XB, PZ[0]], [XB, PZ[1]], [xd(PZ[1]), PZ[1]]], Y + 0.012, MAT);   // 검은 잡초매트 길(영상 b_036~058 — 곧은 한 줄)

    // ---- 주차 3줄(위성 B-3·B-4·B-14) + 칸마다 검은 고무 바퀴멈춤 둘(영상 b_030~036 — 높이 0.1) ----
    const FAR = { far: true };                                                  // 작은 부재도 건물 청크에 합친다(주차장·창고 칸에 가까운 층 청크가 새로 생기면 드로우콜이 는다)
    const stop2 = (cx, cz, az) => [-0.55, 0.55].forEach(o => dBox(0.6, 0.1, 0.14, 0x2b2b2b, cx + o, Y + 0.012, cz, az ? { far: true, at: [cx + o, az] } : FAR));   // az = 이 z의 청크에 합침
    for (let x = cm[0] - 0.5; x <= PK.x[1] - 1.2; x += 2.5) { addPanel(0.14, 5.0, LINE, x, Y + 0.022, cm[1] + 2.7); if (x + 2.5 <= PK.x[1] - 1.2) stop2(x + 1.25, cm[1] + 0.65); }   // 북쪽 줄 직선부(연석에 머리)
    const LC9 = Math.hypot(cm[0] - cw[0], cm[1] - cw[1]);
    for (let s9 = 3.0; s9 < LC9 - 0.5; s9 += 2.5) {                                               // 북쪽 줄 서쪽 비스듬한 부분 — 연석에 수직인 선
      byPanel(0.14, 5.0, LINE, cm[0] - dcx * s9 - dcz * 2.7, Y + 0.022, cm[1] - dcz * s9 + dcx * 2.7, TH);
      if (s9 + 2.5 < LC9 - 0.5) stop2(cm[0] - dcx * (s9 + 1.25) - dcz * 0.65, cm[1] - dcz * (s9 + 1.25) + dcx * 0.65); }
    for (let x = -26; x <= -3.4; x += 2.5) { addPanel(0.14, 5.0, LINE, x, Y + 0.022, -62.1); if (x + 2.5 <= -3.4) stop2(x + 1.25, -60.4, -64.5); }   // 가운데 줄(북쪽 통로에서 후진 → 남쪽 끝 바퀴멈춤)
    const HC = [-20.5, -17.2, -15.7, -12.4, -11.0], HZ = [-50.25, -45.35], HY = Y + 0.038, WH = 0xf4f6f6;   // 장애인 구획 x(위성 B-8)
    for (let x = HC[0] - 2.5; x >= wx0 + 1.9; x -= 2.5) { addPanel(0.14, HZ[1] - HZ[0], LINE, x, Y + 0.022, (HZ[0] + HZ[1]) / 2); stop2(x + 1.25, HZ[1] - 0.6); }   // 남쪽 줄(서관 서쪽 끝 바깥 = 체육관 쪽 차로 — 비움)
    // 장애인 구획(영상 b_025~031): [서칸 ♿][가운데 빗금][동칸 ♿][동쪽 끝 빗금] — 파랑 칠 위 흰 선·빗금·휠체어 기호(칠보다 16mm 위 — 8mm는 비스듬히 보면 깜빡였다) · 라바콘 3 · 서관 북벽 파란 P 표지판
    addPanel(HC[4] - HC[0], HZ[1] - HZ[0], 0x3f6fb5, (HC[0] + HC[4]) / 2, Y + 0.022, (HZ[0] + HZ[1]) / 2);
    HC.forEach((x9, i) => addPanel(0.12, HZ[1] - HZ[0], WH, x9 + (i === 0 ? 0.06 : i === 4 ? -0.06 : 0), HY, (HZ[0] + HZ[1]) / 2));
    [HZ[0] + 0.06, HZ[1] - 0.06].forEach(z9 => addPanel(HC[4] - HC[0], 0.12, WH, (HC[0] + HC[4]) / 2, HY, z9));
    [[HC[1], HC[2]], [HC[3], HC[4]]].forEach(([a, b]) => { for (let z9 = HZ[0] + 0.7; z9 < HZ[1] - 0.6; z9 += 0.6) byPanel(0.1, (b - a - 0.14) * 1.41, WH, (a + b) / 2, HY, z9, Math.PI / 4); });
    [(HC[0] + HC[1]) / 2, (HC[2] + HC[3]) / 2].forEach(cx9 => {                                  // 휠체어 기호(바퀴 고리 + 등받이·자리·발판 + 머리)
      const cz9 = (HZ[0] + HZ[1]) / 2 + 0.2;
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; byPanel(0.07, 0.25, WH, cx9 + 0.05 + Math.cos(a) * 0.4, HY, cz9 + 0.25 + Math.sin(a) * 0.4, a); }
      addPanel(0.11, 0.65, WH, cx9 - 0.15, HY, cz9 - 0.2); addPanel(0.55, 0.11, WH, cx9 + 0.1, HY, cz9 + 0.07); addPanel(0.11, 0.4, WH, cx9 + 0.4, HY, cz9 + 0.3); addPanel(0.22, 0.22, WH, cx9 - 0.15, HY, cz9 - 0.72);
      stop2(cx9, HZ[1] - 0.6);
    });
    const cone = (x9, z9) => { dCyl(0.03, 0.16, 0.68, 0xe0582a, x9, Y + 0.05, z9, { seg: 8, far: true }); dCyl(0.1, 0.12, 0.1, 0xf4f4f0, x9, Y + 0.33, z9, { seg: 8, far: true }); dBox(0.36, 0.03, 0.36, 0x2e2e30, x9, Y + 0.02, z9, FAR);
      colliders.push(noStand({ x0: x9 - 0.18, x1: x9 + 0.18, y0: Y, y1: Y + 0.75, z0: z9 - 0.18, z1: z9 + 0.18 })); };
    [[-16.4, -49.9], [-12.9, -49.4], [-14.0, -47.9]].forEach(([x9, z9]) => cone(x9, z9));
    sign('P', -16.55, 1.05, wz0 - 0.19, 0, 0.5);                                                 // 창 동쪽 벽돌 면·창턱 높이(영상 n_030.5)
    // 차: 흰 SUV(장애인 구획 서쪽 옆 — b_030) · 회색 · 흰 세단(창고 앞 가운데 줄 동쪽 끝 — b_033~036) · 흰 세단(북쪽 줄 — b_031)
    car(HC[0] - 1.25, (HZ[0] + HZ[1]) / 2, 0xf2f3f4, 0xe6e8ea, Y, 4.7, 1.9);
    car(HC[0] - 11.25, (HZ[0] + HZ[1]) / 2, 0x8f959b, 0xa3a9ae, Y);
    car(-4.75, -61.9, 0xeef0f2, 0xe2e5e8, Y, 4.0, 1.8, [-4.75, -64.5]);          // (전조등이 z -64 청크 경계를 넘지 않게 — 가까운 층 청크가 새로 생긴다) · 몸통은 북쪽 칸(항상 그려지는 대지 청크 밖)
    car(-21.25, cm[1] + 2.7, 0xeef0f2, 0xe2e5e8, Y);
    // 남서 잔디섬(위성 B-5: 연석이 비스듬히 오다 둥글게 꺾임) + 큰 활엽수 · 서쪽 끝 침엽수 · 사각 생울타리(영상 b_030) — 잔디는 아스팔트보다 12mm 위
    const ISL = [[PK.x[0], -69.55], [-31, -65.3], [-29.5, -61], [-31.5, -57], [PK.x[0], -56.5]];
    byQuad('grass', [ISL[0], ISL[1], ISL[2], [PK.x[0], -61]], Y + 0.024, 0xb9c98f);
    byQuad('grass', [[PK.x[0], -61], ISL[2], ISL[3], ISL[4]], Y + 0.024, 0xb9c98f);
    for (let i = 0; i < 4; i++) byRot(ISL[i][0], ISL[i][1], ISL[i + 1][0], ISL[i + 1][1], 0.15, 0.1, Y + 0.012, 0xc9c9c4, { far: true });
    tree(-40, -61.5, 3.4); pine(-48.5, -51, 1.05);
    addBox(3, 1.2, 1.0, 0x4e7a3e, -45, Y, -68, NS); dBlob(1.55, 0.3, 0.55, 0x5f8d4a, -45, Y + 1.2, -68, { far: true, chunky: true, jitter: 0.12 });

    // ---- 노란 창고(위성 B-1·영상 b_033~042): 골함석 컨테이너 두 동 · 평평한 파란 판 지붕(처마 0.25) · 서면(주차장 쪽)에 문(남쪽 끝)·흰 틀 쇠창살 창 ----
    const SHC = 0xf0b41c, SHR = 0xd99e12, SHH = SCHOOL.shed.h;
    SHU.forEach(u => {
      const [ux0, ux1] = u.x, [uz0, uz1] = u.z, cx9 = (ux0 + ux1)/2, cz9 = (uz0 + uz1)/2, dc = uz1 - 0.15 - 0.45, wc = uz1 - 3.5;
      const SA = { far: true, at: [cx9, Math.min(cz9, -64.5)] };   // 두 동 다 창고·텃밭 칸(z -64 북쪽 청크)에: 남쪽 동이 흙길·급식동 칸(서쪽 골은 항상 그려지는 대지 청크)에 들어가 서관 안에서도 그려졌다
      addBox(ux1 - ux0, SHH, uz1 - uz0, SHC, cx9, Y, cz9, { at: SA.at });
      dBox(ux1 - ux0 + 0.5, 0.1, uz1 - uz0 + 0.5, 0x3f6fb0, cx9, Y + SHH, cz9, SA);
      for (let z9 = uz0 + 0.2; z9 < uz1 - 0.1; z9 += 0.45) {                                      // 골함석 세로 골(0.45 간격 — 문·창 자리는 건너뜀)
        if (Math.abs(z9 - dc) > 0.52 && Math.abs(z9 - wc) > 0.45) dBox(0.04, SHH - 0.2, 0.07, SHR, ux0 - 0.02, Y + 0.1, z9, SA);
        dBox(0.04, SHH - 0.2, 0.07, SHR, ux1 + 0.02, Y + 0.1, z9, SA); }
      for (let x9 = ux0 + 0.2; x9 < ux1 - 0.1; x9 += 0.45) [uz0 - 0.02, uz1 + 0.02].forEach(z9 => dBox(0.07, SHH - 0.2, 0.04, SHR, x9, Y + 0.1, z9, SA));
      dBox(0.04, 2.1, 0.9, 0xe6aa18, ux0 - 0.02, Y + 0.03, dc, SA); dBox(0.03, 0.05, 0.14, 0xc9ced3, ux0 - 0.055, Y + 1.0, dc + 0.3, SA);   // 문 + 손잡이
      dBox(0.04, 0.7, 0.8, 0xf2f2ee, ux0 - 0.02, Y + 1.25, wc, SA); dBox(0.03, 0.58, 0.68, 0x3e4a55, ux0 - 0.05, Y + 1.31, wc, SA);            // 흰 틀 창 + 어두운 유리
      [-0.2, 0, 0.2].forEach(o => dRod(ux0 - 0.075, Y + 1.3, wc + o, ux0 - 0.075, Y + 1.9, wc + o, 0.012, 0xf4f4f0, SA));                   // 쇠창살
    });

    // ---- 텃밭 길 둘레(영상 b_036~058): 길 남쪽 = 반쯤 묻힌 회색 자연석 줄 + 잡초·관목 화단 + 어린 나무 · 동관 북면 앞 키 1.8m 생울타리 · 길 북쪽 = 전정 소나무 ----
    for (let x9 = xd(PZ[1]) + 0.5, k = 0; x9 < 20; x9 += 1.0, k++) { const h9 = hash2(x9, 5), sx = 0.26 + h9 * 0.12, sy = 0.18 + hash2(x9, 6) * 0.1, z9 = PZ[1] + 0.75 + (hash2(x9, 7) - 0.5) * 0.12;
      dBlob(sx, sy, sx * 0.85, [0x8e8b84, 0x9a978f, 0x7f7d77][k % 3], x9, Y + 0.06, z9, { far: true, chunky: true, ry: h9 * 6, jitter: 0.2 });
      colliders.push({ x0: x9 - sx * 0.8, x1: x9 + sx * 0.8, y0: Y, y1: Y + 0.06 + sy * 0.8, z0: z9 - sx * 0.65, z1: z9 + sx * 0.65 }); }
    const weed = (x, z, r, hex) => { dBlob(r, r * 0.8, r, hex, x, Y + r * 0.62, z, { chunky: true, ry: x * 3, jitter: 0.18 }); colliders.push(noStand({ x0: x - r * 0.85, x1: x + r * 0.85, y0: Y, y1: Y + r * 1.4, z0: z - r * 0.85, z1: z + r * 0.85 })); };   // 잡초·관목 덩어리(가볍게 — 20면)
    for (let x9 = xd(PZ[1]) + 0.7, k = 0; x9 < 14; x9 += 1.45, k++) { const h9 = hash2(x9, 11);
      weed(x9, -53.75 + (h9 - 0.5) * 0.3, 0.42 + h9 * 0.22, [0x5e8f45, 0x74a553, 0x4f8a45][k % 3]);
      if (k % 2) weed(x9 + 0.6, -52.35, 0.34 + h9 * 0.12, [0x6b9c4c, 0x588a42][k % 4 > 1 ? 1 : 0]); }
    [[0.4, -52.5], [6.3, -52.4], [11.6, -52.5]].forEach(([x9, z9]) => bgTree(x9, z9, 0.45));   // 어린 나무 = 배경 나무 모양(60삼각형 — far 층이라 서관에서 동쪽을 볼 때 절두체에 든다)
    for (let x9 = 14.3; x9 < 44; x9 += 2.95) dBox(Math.min(2.9, 44.3 - x9), 1.3, 0.9, 0x4a7a37, x9 + Math.min(2.9, 44.3 - x9) / 2, Y, -53.3);   // 생울타리 몸통(깎은 면)
    for (let x9 = 15.1; x9 < 44; x9 += 1.5) { const h9 = hash2(x9, 21);                                   // 둥근 윗면(잎 덩어리)
      dBlob(0.95, 0.42 + h9 * 0.12, 0.58, h9 > 0.5 ? 0x5a8c42 : 0x4f8540, x9, Y + 1.3, -53.3 + (h9 - 0.5) * 0.08, { chunky: true, ry: h9 * 0.4, jitter: 0.16 }); }   // 20면(80면 × 20개 = 서관에서 보이는 가까운 층 +1.6k였다)
    colliders.push(noStand({ x0: 14.3, x1: 44.3, y0: Y, y1: Y + 1.8, z0: -53.8, z1: -52.8 }));   // [integ 09-25] 몸통(x 14.3~44.3 · z ±0.45)에 맞춤 — 양 끝 0.3m 보이지 않는 벽
    [[4.4, -61.6, 1.0], [8.8, -63.2, 1.05], [13.6, -58.2, 1.0]].forEach(([x9, z9, s9]) => prunedPine(x9, z9, s9, true, [x9, -64.5]));   // 흙길 북쪽 = 창고·텃밭 칸에(창고와 같은 이유)
    // 흙길 끝 큰 나무 무리(영상 b_043~076: 정면 멀리 좁은 원뿔 침엽수 둘 + 짙은 향나무 + 큰 활엽수) · 지주 묶은 어린 나무(b_082~088)
    const tallConifer = (x, z, h) => { const y = tY(z, x); colliders.push({ x0: x - 0.3, x1: x + 0.3, y0: y, y1: y + 14, z0: z - 0.3, z1: z + 0.3 });
      dCyl(0.18, 0.32, h * 0.4, 0x5a4636, x, y, z, { far: true, seg: 6 });
      [[0.18, 2.1, 0.34], [0.34, 1.75, 0.3], [0.5, 1.35, 0.26], [0.64, 0.95, 0.22], [0.78, 0.55, 0.2]].forEach(([t, r, hh], i) =>
        dCyl(0, r, h * hh, [0x2f5a34, 0x355f38, 0x3d6b3f][i % 3], x, y + h * t, z, { far: true, seg: 7, rot: [0, i * 0.7, 0] })); };
    tallConifer(42.4, -60.9, 16); tallConifer(45.1, -59.4, 15);
    ballJuniper(46.6, -62.4, 1.8, true); tree(49.2, -60.6, 1.9, true);
    bgTree(47.4, -57.7, 0.42); dRod(47.55, Y, -57.7, 47.55, Y + 1.5, -57.7, 0.025, 0xb89a6e); post(47.55, -57.7, Y, Y + 1.5, 0.05);
    shrub(46.2, -51.8, 0.45, 0x5c8f45, true);

    // ---- 텃밭(위성 B-2·영상 b_051~076): 바닥 거의 전부 검은 잡초매트 + 흙 두둑(동서) — 두둑마다 다른 작물(잎채소·메리골드·고구마·콩 지주·검은 비닐) ----
    const GD = SCHOOL.garden, gxe = z => GP[3][0] + (z - GP[3][1]) * (GP[3][0] - GP[2][0]) / (GP[3][1] - GP[2][1]);   // 비스듬한 동쪽 끝 x
    byQuad('asph', [GP[0], GP[1], [GP[1][0], GP[4][1]], GP[4]], Y + 0.012, MAT);
    byQuad('asph', [GP[1], GP[2], GP[3], [GP[1][0], GP[3][1]]], Y + 0.012, MAT);
    const crop = (kind, a, b, rz) => {
      // x<16(청크 0열)은 건물 청크에 합침 — 가까운 층 청크 +1 방지. 남쪽 두 줄(z -64 남쪽)은 텃밭 칸(z -64 북쪽 청크)에 at으로 모은다:
      //   청크 경계 -64가 텃밭 남쪽 띠를 가르면 흙길·생울타리 칸의 경계 구가 작물까지 커져, 서관 안에서 동쪽을 볼 때 절두체에 들었다(09-24 리뷰)
      const top = Y + 0.18, o9 = (cx, opt) => { const o = cx < 16 ? { ...opt, far: true } : { ...opt }; if (rz > -64) o.at = [cx, -64.5]; return o; };
      const dBlob = (sx, sy, sz, hex, cx, cy, cz, opt = {}) => dBlob0(sx, sy, sz, hex, cx, cy, cz, o9(cx, opt));
      const dRod = (x0, y0, z0, x1, y1, z1, r, hex) => dRod0(x0, y0, z0, x1, y1, z1, r, hex, o9(x0, {}));
      if (kind !== 'bean') softVols.push({ x0: a, x1: b, y0: top + 0.005, y1: top + 1.0, z0: rz - 0.6, z1: rz + 0.6, why: '텃밭 작물(' + kind + ')' });
      if (kind === 'mulch') { for (let x9 = a + 0.4; x9 < b - 0.2; x9 += 0.9) dBlob(0.12, 0.14, 0.12, 0x6aa84f, x9, top + 0.08, rz + (hash2(x9, 3) - 0.5) * 0.5, { chunky: true }); return; }
      if (kind === 'leafy') { let k9 = 0; for (let x9 = a + 0.3; x9 < b - 0.2; x9 += 0.55, k9++) { const o = k9 % 2 ? 0.26 : -0.26; dBlob(0.3, 0.44, 0.3, hash2(x9, o) > 0.5 ? 0x6aa84f : 0x7cb85a, x9, top + 0.3, rz + o, { chunky: true, ry: x9 * 3 + o, jitter: 0.3 }); } return; }
      if (kind === 'marigold') { for (let x9 = a + 0.35; x9 < b - 0.2; x9 += 0.85) { const zz = rz + (hash2(x9, 4) - 0.5) * 0.4;
          dBlob(0.3, 0.26, 0.3, 0x4f8a3e, x9, top + 0.2, zz, { chunky: true, ry: x9 });
          [[0.12, 0.08], [-0.08, -0.12]].forEach(([ox, oz], j) => dBlob(0.08, 0.07, 0.08, j ? 0xf39a1c : 0xf7c531, x9 + ox, top + 0.42, zz + oz, { chunky: true })); } return; }
      if (kind === 'potato') { for (let x9 = a + 0.4; x9 < b - 0.3; x9 += 0.95) dBlob(0.55, 0.16, 0.52, hash2(x9, 5) > 0.5 ? 0x4f8f3e : 0x5c9a48, x9, top + 0.08, rz, { chunky: true, ry: x9, jitter: 0.25 }); return; }
      for (let x9 = a + 0.3; x9 < b - 0.1; x9 += 1.2) [-0.35, 0.35].forEach(o => { dRod(x9, top, rz + o, x9, top + 1.6, rz + o * 0.3, 0.02, 0x9c7a53); dBlob(0.2, 0.34, 0.2, 0x4d8b4d, x9, top + 0.9, rz + o * 0.6, { chunky: true, ry: x9 + o }); });   // 콩: A자 지주 + 끈 + 덩굴
      dRod(a + 0.3, top + 1.5, rz, b - 0.1, top + 1.5, rz, 0.01, 0xd8d4c8);
      let xl = a + 0.3; while (xl + 1.2 < b - 0.1) xl += 1.2;   // [integ 09-25] 충돌 = 첫 지주 ~ 끝 지주(두둑 끝 0.3~1.3m가 보이지 않는 벽이던 것 — 옆 두둑에서 건너올 때)
      colliders.push(noStand({ x0: a + 0.05, x1: xl + 0.25, y0: Y, y1: Y + 1.8, z0: rz - 0.45, z1: rz + 0.45 }));   // z ±0.45 = 지주(±0.35)·덩굴(±0.41)
    };
    const PLAN = [['marigold', 'leafy'], ['potato', 'mulch', 'leafy'], ['bean', 'potato'], ['leafy', 'mulch', 'marigold'], ['potato', 'bean'], ['mulch', 'leafy']];
    PLAN.forEach((pl, i) => {
      const rz = GP[4][1] - 1.25 - i * 2.45, a0 = GP[0][0] + 0.8, b0 = gxe(rz - 0.6) - 0.6, sl = (b0 - a0 - 0.5 * (pl.length - 1)) / pl.length;
      pl.forEach((kind, j) => { const a = a0 + j * (sl + 0.5), b = a + sl;
        addBox(b - a, 0.18, 1.2, kind === 'mulch' ? 0x2a2a2c : 0x7a5e44, (a + b) / 2, Y, rz, kind === 'bean' ? { collide: false } : {});   // [integ 09-25] 콩 두둑 올라서기 금지는 위 지주 충돌이 맡는다(두둑 전체 NS면 끝이 보이지 않는 벽)
        crop(kind, a, b, rz); });
    });
    // 텃밭 소품(영상 b_063~076): 긴 화분의 벼 · 수도 스탠드 + 뒤집힌 붉은 대야 · 감긴 회색 호스 · 태양광 정원등
    for (let k = 0; k < 5; k++) { const x9 = 26.5 + k * 1.05, z9 = GP[4][1] - 0.35; addBox(0.9, 0.3, 0.35, 0xb4552f, x9, Y, z9, NS);   // [integ 09-25] 올라서기 금지 — 화분 위에 서면 벼를 몸이 뚫었다(ghost)
      [-0.2, 0.2].forEach(o => dBlob(0.14, 0.42, 0.11, 0x9cc45a, x9 + o, Y + 0.55, z9, { chunky: true, jitter: 0.3, at: [x9, -64.5] })); }   // 텃밭 칸에(위 작물과 같은 이유)
    const tp = [35.0, GP[4][1] - 0.4];
    dCyl(0.05, 0.05, 0.9, 0xeeeeee, tp[0], Y, tp[1], { seg: 8 }); dBox(0.05, 0.05, 0.14, 0x9aa0a6, tp[0], Y + 0.78, tp[1] + 0.09); colliders.push(noStand({ x0: tp[0] - 0.07, x1: tp[0] + 0.07, y0: Y, y1: Y + 0.95, z0: tp[1] - 0.07, z1: tp[1] + 0.07 }));
    dCyl(0.35, 0.25, 0.18, 0xb0452f, tp[0] + 0.75, Y, tp[1] + 0.1, { seg: 12 }); colliders.push({ x0: tp[0] + 0.4, x1: tp[0] + 1.1, y0: Y, y1: Y + 0.18, z0: tp[1] - 0.3, z1: tp[1] + 0.4 });
    [[0.36, 0], [0.26, 0.03]].forEach(([r9, y9]) => { for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, b = (k + 1) / 9 * Math.PI * 2, hx = 36.4, hz = -58.6;
      dRod(hx + Math.cos(a) * r9, Y + 0.03 + y9, hz + Math.sin(a) * r9, hx + Math.cos(b) * r9, Y + 0.03 + y9, hz + Math.sin(b) * r9, 0.02, 0xbfc3c4); } });
    [[tp[0], tp[1] + 0.1, 35.6, -58.95], [36.05, -58.6, 36.4 - 0.36, -58.6]].forEach(([a, b, c, d]) => dRod(a, Y + 0.03, b, c, Y + 0.03, d, 0.02, 0xbfc3c4));
    for (let x9 = 12; x9 < 34; x9 += 4.4) { const z9 = GP[4][1] + 0.3, A9 = x9 >= 16 ? { at: [x9, -64.5] } : {}; dRod(x9, Y, z9, x9, Y + 0.5, z9, 0.02, 0x2a2a2a, A9); dBox(0.12, 0.08, 0.12, 0x333333, x9, Y + 0.5, z9, A9); dBox(0.1, 0.03, 0.1, 0x3a5a8a, x9, Y + 0.58, z9, A9);   // x ≥ 16만 텃밭 칸에(x < 16 칸엔 가까운 층 작물이 없어 새 청크 = 드로우콜 +1)
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y, y1: Y + 0.6, z0: z9 - 0.08, z1: z9 + 0.08 })); }
    hotspots.push({ kind: 'garden', x: tp[0], z: tp[1] + 0.9, y: Y, r: 2.2, label: '텃밭에 물 주기' });

    // ---- 나무 데크(영상 b_090~099): 큰 활엽수 다섯이 뚫고 선 넓은 데크(회갈색으로 바랜 판) + A자 다리 피크닉 탁자 7 + 북동 구석 흰 조각상 ----
    addBox(DX[1] - DX[0], 0.24, DZ[1] - DZ[0], 0x6f5a4c, (DX[0] + DX[1]) / 2, Y, (DZ[0] + DZ[1]) / 2);
    patQuad('gymw', DX[0], DX[1], DZ[0], DZ[1], DT + 0.012, false, 0x948c8c);   // 회갈색으로 바랜 판(영상 b_093)
    [[51.6, -54.3], [53.2, -50.4], [56.8, -52.2], [52.1, -45.6], [57.6, -46.2]].forEach(([x9, z9]) => tree(x9, z9, 1.7, true));   // 가벼운 모양(데크 청크 = far 층 — 서관 안에서 동쪽을 보면 절두체에 든다)
    const picnic = (x, z, rot) => {   // 상판 1.8×0.75(높이 0.7) + 붙은 벤치 둘(0.42) + A자 다리 · 벤치 쪽에 앉기
      const T = DT + 0.012, W9 = 0x8a6a50, L9 = 0x6f5440;
      const o9 = {}, bx = (lx, ly, lz, w, h, d) => rot ? dBox(d, h, w, W9, x + lz, T + ly, z + lx, o9) : dBox(w, h, d, W9, x + lx, T + ly, z + lz, o9);   // 가까운 층(09-24 리뷰: far 층이면 서관 안에서 동쪽을 볼 때 85m 밖 탁자까지 그렸다)
      const rd = (a, b, r) => { const P = p => rot ? [x + p[2], T + p[1], z + p[0]] : [x + p[0], T + p[1], z + p[2]]; const A = P(a), Bq = P(b); dRod(A[0], A[1], A[2], Bq[0], Bq[1], Bq[2], r, L9, o9); };   // 남쪽 탁자는 가까운 층(55m 밖은 숨김 — 본관 복도에서 보이는 삼각형을 줄인다)
      bx(0, 0.7, 0, 1.8, 0.05, 0.75); [-0.62, 0.62].forEach(o => bx(0, 0.42, o, 1.8, 0.05, 0.28));
      [-0.7, 0.7].forEach(lx => { rd([lx, 0, -0.72], [lx, 0.7, -0.12], 0.035); rd([lx, 0, 0.72], [lx, 0.7, 0.12], 0.035); rd([lx, 0.4, -0.78], [lx, 0.4, 0.78], 0.03); });
      rd([-0.7, 0.35, 0], [0.7, 0.35, 0], 0.03);
      colliders.push(noStand(rot ? { x0: x - 0.8, x1: x + 0.8, y0: DT, y1: T + 0.75, z0: z - 0.95, z1: z + 0.95 } : { x0: x - 0.95, x1: x + 0.95, y0: DT, y1: T + 0.75, z0: z - 0.8, z1: z + 0.8 }));
      // 앉는 자리 = 충돌 상자(반폭 0.8) + 몸 반지름 0.26 = 1.06 바깥(1.1). 안쪽(0.95)이면 몸이 막힘 안으로 순간이동해 일어나지 못했다(09-24 리뷰) — 몸은 앞으로 0.42 당겨 앉아 벤치(0.48~0.76) 위에 온다
      hotspots.push(rot ? { kind: 'sit', x: x + 1.1, z, y: DT, r: 0.75, label: '의자에 앉기', yaw: -Math.PI / 2 } : { kind: 'sit', x, z: z + 1.1, y: DT, r: 0.75, label: '의자에 앉기' });
    };
    [[51.8, -52.5, 0], [54.2, -54.3, 1], [55, -51, 0], [57.5, -49.5, 0], [53.8, -47.6, 1], [56.6, -44.6, 0], [51.3, -44.1, 1]].forEach(([x9, z9, r9]) => picnic(x9, z9, r9));
    { const sx9 = 58.35, sz9 = -55.7, T = DT + 0.012, WHT = 0xf1f0ea;                                   // 흰 조각상(받침 위 인물 — 얼굴·글자 없이 형태만)
      dBox(0.6, 0.8, 0.6, 0xe6e4de, sx9, T, sz9); dBox(0.7, 0.08, 0.7, 0xd9d6ce, sx9, T + 0.8, sz9);                   // 가까운 층(탁자와 같은 이유)
      dCyl(0.16, 0.3, 0.5, WHT, sx9, T + 0.88, sz9, { seg: 10 }); dBlob(0.2, 0.36, 0.17, WHT, sx9, T + 1.62, sz9, { ry: 0.3 }); dBlob(0.13, 0.15, 0.13, WHT, sx9, T + 2.1, sz9, { chunky: true });
      colliders.push(noStand({ x0: sx9 - 0.35, x1: sx9 + 0.35, y0: DT, y1: T + 2.3, z0: sz9 - 0.35, z1: sz9 + 0.35 })); }
    // 데크 서쪽: 나무 경사로(→ 벽돌 마당) · 비비추 화단(보라 꽃대) + 화강석 경계석(영상 d_090·b_099~105)
    slope('gymw', 'x', -49.25, -47.85, DX[0], XH - 0.6, DT, Y + 0.02, 3, 0x948c8c);
    [[DZ[0] + 0.2, -49.45], [-47.65, -36.5]].forEach(([za, zb]) => {
      patQuad('dirt', XH, DX[0], za, zb, Y + 0.012, false, 0x9a8a70);
      for (let z9 = za + 0.35; z9 < zb - 0.2; z9 += 0.55) { const h9 = hash2(49.6, z9);
        const o9 = {};                                                              // 가까운 층(데크 탁자와 같은 칸 — 탁자를 가까운 층으로 옮겨 칸이 이미 있다)
        dBlob(0.34, 0.26, 0.3, h9 > 0.5 ? 0x4f8a3e : 0x5c9a4a, 49.6 + (h9 - 0.5) * 0.2, Y + 0.18, z9, { ...o9, chunky: true, ry: z9, jitter: 0.25 });
        if (h9 > 0.5) dRod(49.6 + (h9 - 0.5) * 0.3, Y + 0.3, z9, 49.6 + (h9 - 0.5) * 0.3, Y + 0.8, z9 + 0.05, 0.015, 0x9c8ac9, o9); }
      colliders.push(noStand({ x0: XH + 0.05, x1: DX[0] - 0.02, y0: Y, y1: Y + 0.8, z0: za, z1: zb }));
      addBox(0.15, 0.2, zb - za, 0xc9c6be, XH - 0.075, Y, (za + zb) / 2);
    });

    // ---- 벽돌 마당(동관 동면 ~ 비비추 화단 · 영상 d_089·b_099~106): 바랜 적갈 인터로킹 + 가운데 회베이지 판 · 맨홀 · 콘크리트 전봇대(완목 2단·가로등) ----
    //   COURT-3(영상 q_104.5~q_112): 가운데 마당과 같은 물결 인터로킹('ilock') — 가운데 회색 판 + 가장자리 붉은 띠 · 마당 북쪽 붉은 띠(z -39.35~-38.3)가 동쪽으로 이어짐 · 본관 앞은 회색
    const BRK2 = 0xbf7873, GRY2 = 0xcfc8bc;
    patQuad('ilock', XB, XH, PZ[0], -52, Y + 0.012, false, BRK2);
    patQuad('ilock', XB, 46.3, -52, -39.35, Y + 0.012, false, BRK2); patQuad('ilock', 48.1, XH, -52, -39.35, Y + 0.012, false, BRK2);
    patQuad('ilock', 46.3, 48.1, -52, -39.35, Y + 0.012, false, GRY2);   // 가운데 회색 판(q_106)
    patQuad('ilock', 46.65, XH, -39.35, -38.3, Y + 0.012, false, BRK2); patQuad('ilock', 46.65, XH, -38.3, fz0 - 0.3, Y + 0.012, false, GRY2);
    patQuad('ilock', XH, 53.5, -36.3, fz0 - 0.3, Y + 0.012, false, GRY2);   // 남쪽 끝 = 본관 북벽 따라 동쪽으로(전봇대 둘레 회색 — q_109·q_111)
    [[47.5, -50.5], [47.3, -38.3]].forEach(([x9, z9]) => dCyl(0.35, 0.35, 0.02, 0x6b6b6b, x9, Y + 0.012, z9, { seg: 12, far: true }));
    { const px9 = 48.5, pz9 = -35.9;                                                            // COURT-3: 본관 북벽 앞 1.6m · 화분 A 동남쪽(영상 q_107~q_112: 마당 동쪽 입구 — 벽돌 마당 가운데 아님)
      dCyl(0.12, 0.18, 11, 0x9a9a96, px9, Y, pz9, { far: true, seg: 8 });
      [9.4, 10.2].forEach(h9 => { dBox(1.8, 0.1, 0.1, 0x8a8a86, px9, Y + h9, pz9, { far: true }); [-0.7, -0.25, 0.25, 0.7].forEach(o => dCyl(0.04, 0.05, 0.12, 0xf2f2ee, px9 + o, Y + h9 + 0.1, pz9, { far: true, seg: 6 })); });
      dRod(px9, Y + 7.5, pz9, px9 - 1.4, Y + 7.9, pz9, 0.04, 0x8a8a86, { far: true }); dBox(0.45, 0.12, 0.2, 0xdfe3e6, px9 - 1.5, Y + 7.78, pz9, { far: true });
      [-0.12, 0.12].forEach(o => dRod(px9 + o, Y + 8.9, pz9, 49.9 + o, FH + 0.35, -34.75, 0.012, 0x2a2a2a, { far: true }));   // 본관 옥상으로 가는 인입선 둘(q_106·q_109)
      colliders.push({ x0: px9 - 0.2, x1: px9 + 0.2, y0: Y, y1: Y + 11, z0: pz9 - 0.2, z1: pz9 + 0.2 }); }
    // 데크 남쪽: 바위·관목 둔덕(영상 b_099·b_105)
    patQuad(MOW, DX[0], 60, DZ[1], -36.3, Y + 0.012, false, GR); patQuad(MOW, 53.5, 60, -36.3, fz0 - 0.3, Y + 0.012, false, GR);
    [[51.6, -41.4, 1.8, 0.8, 1.3], [54.6, -40.2, 2.0, 0.9, 1.4], [57.8, -41.6, 1.7, 0.8, 1.2], [52.3, -38.2, 1.5, 0.7, 1.1]].forEach(([x9, z9, w9, h9, d9]) => mound(x9, z9, w9, h9, d9, 0x557f47, true));
    [[55.6, -37.7], [58.6, -38.5]].forEach(([x9, z9]) => weed(x9, z9, 0.55, 0x4d8b4d));

    // ---- 뒷길(영상 b_015~028): 계단홀 문 밖 디딤판·고무 매트·벽돌 기둥 · 급식동 서벽 앞 케이블 트레이 더미·실외기(작은 LG 1·큰 것 5)·맨홀·배수 격자 ----
    { const dz9 = -37.9;
      addBox(0.85, -YARD, 2.2, 0xbdb8ae, wx1 + 0.575, YARD, dz9);
      addPanel(0.85, 1.9, 0x8c3a36, wx1 + 0.575, 0.012, dz9); for (let k = 0; k < 4; k++) addPanel(0.06, 1.8, 0x4f8c66, wx1 + 0.27 + k * 0.2, 0.02, dz9);   // 빨강·초록 고무 매트(무늬 판을 새로 쓰면 뒤뜰 화면에 드로우콜 +1)
      addBox(0.45, 1.1, 0.45, BRICK, wx1 + 0.375, YARD, dz9 - 1.325, NS);
      patWall('brickW', 'x', wx1 + 0.17, wx1 + 0.58, YARD + 0.02, YARD + 1.08, dz9 - 1.562, -1);
      dBox(0.55, 0.08, 0.55, 0xcfcac0, wx1 + 0.425, YARD + 1.1, dz9 - 1.3); }
    { const xo = kx0o - 0.04;                                                                     // 급식동 서벽 아랫단 띠 바깥 면
      dBox(0.5, 0.4, 3.0, 0xb8bec4, xo - 0.25, Y, -42.3, FAR); dBox(0.46, 0.04, 2.9, 0x9aa0a6, xo - 0.25, Y + 0.4, -42.3, FAR);
      colliders.push(noStand({ x0: xo - 0.5, x1: xo, y0: Y, y1: Y + 0.5, z0: -43.8, z1: -40.8 }));
      addBox(0.3, 0.55, 0.8, 0xeceeee, xo - 0.15, Y, -36.9, NS); dCyl(0.2, 0.2, 0.02, 0x8a9096, xo - 0.3, Y + 0.27, -36.9, { seg: 8, rot: [0, 0, Math.PI / 2], far: true });
      for (let k = 0; k < 5; k++) { const z9 = -45.45 - k * 0.9; dBox(0.35, 1.3, 0.86, 0xeef0ee, xo - 0.175, Y, z9, FAR); dCyl(0.3, 0.3, 0.02, 0x8a9096, xo - 0.35, Y + 0.85, z9, { seg: 8, rot: [0, 0, Math.PI / 2], far: true }); }
      colliders.push(noStand({ x0: xo - 0.35, x1: xo, y0: Y, y1: Y + 1.3, z0: -45.45 - 4 * 0.9 - 0.43, z1: -45.45 + 0.43 }));
      dCyl(0.35, 0.35, 0.02, 0x6b6b6b, (wx1 + kx0o) / 2, Y + 0.012, -43.2, { seg: 12, far: true }); dBox(1.0, 0.03, 0.6, 0x6f7274, (wx1 + kx0o) / 2 - 0.3, Y + 0.012, -40.4, FAR); }

    // ---- 울타리 밖 북쪽(위성 B-11·영상 b_030~033): 나무 띠(세 무리 — 틈으로 공장이 보임) + 너머 회청색 2층 공장(24° 기운 긴 지붕) ----
    [[-46, -38], [-24, -14], [-5, 7]].forEach(([a, b], g9) => { for (let x9 = a; x9 <= b; x9 += 4.8) { const h9 = hash2(x9, g9 + 31); bgTree(x9 + (h9 - 0.5) * 1.2, FZ(x9) - 3.2 - h9 * 2.2, 1.0 + h9 * 0.35); } });
    byRot(-32.3, -104, 4.7, -121, 11, 7.5, FIELD, 0xb7c0c8, { far: true, whole: true, at: [-14, -112] });
    byRot(-32.3, -104, 4.7, -121, 11.6, 0.3, FIELD + 7.5, 0xdfe3e6, { far: true, whole: true, at: [-14, -112] });

    zones.push({ x0: PK.x[0], x1: wx1, z0: wz0 - 12, z1: wz0, y: Y, label: '주차장' });
    zones.push({ x0: PK.x[0], x1: PK.x[1], z0: cm[1], z1: wz0 - 12, y: Y, label: '주차장(북쪽)' });
    zones.push({ x0: wx1, x1: K2.x[0], z0: wz0, z1: fz0, y: Y, label: '뒷길' });
    zones.push({ x0: PK.x[1], x1: SHU[0].x[1] + 0.25, z0: SHU[0].z[0] - 0.25, z1: zS, y: Y, label: '노란 창고' });
    zones.push({ x0: Math.max(xd(PZ[1]), PK.x[1]), x1: XB, z0: GP[4][1], z1: kz0o, y: Y, label: '텃밭 길' });   // [integ] 서끝 = 주차장(북쪽) 동끝(겹침 제거)
    zones.push({ x0: GD.x[0], x1: GD.x[1], z0: GD.z[0], z1: GD.z[1], y: Y, label: '텃밭' });
    zones.push({ x0: GP[3][0], x1: 50, z0: -66, z1: GP[4][1], y: Y, label: '큰 나무 잔디밭' });
    zones.push({ x0: DX[0], x1: DX[1], z0: DZ[0], z1: DZ[1], y: DT, label: '텃밭 쉼터' });
    zones.push({ x0: XB, x1: DX[0], z0: PZ[0], z1: -39.35, y: Y, label: '동관 뒤뜰' });
    zones.push({ x0: XB, x1: DX[0], z0: -39.35, z1: fz0 - 0.3, y: Y, label: '마당 동쪽 입구' });   // COURT-3: 가운데 마당 동쪽 끝 너머 — 전봇대·화분 A(영상 q_106~q_113)
  }

  // ================= 위성 나무 무리(Esri z19: 체육관 북서쪽 숲·서쪽 울타리 나무 줄·동쪽 가장자리·텃밭 동쪽·정문 옆) =================
  {
    const R9 = seeded(4242), jit = () => (R9() - 0.5) * 2.4;   // ±1.2 m
    // 위성 A(09-24): 체육관 북동 모서리 → 북서로 넓어지는 대각 아스팔트 길 + z -50.5~-47 동서 흙길(울타리 -86까지 · 닫힌 문짝).
    //   체육관 북쪽 z -47.5~-31 어두운 면은 숲이 아니라 체육관 겨울 그림자 → 체육관|길 사이 나무는 4그루 이하, 결 보이는 수관은 흙길 북쪽 z -61~-51에 빽빽하게
    const tri = (kind, A, Bp, Cp, tint = 0xffffff) => { const S = PATDEF[kind][0], P9 = [A, Bp, Cp, Cp].map(([x, z]) => [x, YARD + 0.012, z]); patPush(kind, P9, P9.map(q => [q[0] / S, -q[2] / S]), [0, 1, 0], tint); };
    const fan = (kind, o, chain, tint) => { for (let i = 0; i < chain.length - 1; i++) tri(kind, o, chain[i], chain[i + 1], tint); };
    fan('asph', [-51.35, -44.65], [[-51.35, -38.7], [-52.4, -39], [-55, -41], [-57, -44], [-58, -44.65]]);                               // 대각 길(기존 아스팔트 서쪽 조각)
    fan('asph', [-48, -50.5], [[-48, -44.65], [-58, -44.65], [-59, -45.3], [-61, -46.2], [-62.5, -47], [-62.5, -50.5]]);                 // 대각 길(z -44.65 북쪽 조각 — 주차장 서끝까지)
    patQuad('dirt', -86, -62.5, -50.5, -47, YARD + 0.012, false, 0xd2cab0);                                                             // 동서 흙길(위성 황토 165~181,161~172,127~139)
    [-50.6, -46.9].forEach(z9 => dBox(0.16, 1.9, 0.16, 0x8a9096, -86.2, YARD, z9, { far: true }));                                       // 울타리 문 기둥 + 닫힌 문짝
    dBox(0.05, 1.5, 3.5, 0x9aa0a6, -86.2, YARD + 0.1, -48.75, { far: true });
    patQuad('grass', -86, -53.5, -86, -50.5, YARD + 0.012, false, 0xc4d6ac);                                                          // 숲 바닥(흙길 북쪽)
    fan('grass', [-86, gz0 - 0.15], [[-86, -47], [-62.5, -47], [-61, -46.2], [-59, -45.3], [-58, -44.65], [-57, -44], [-55, -41], [-53.5, -39.85], [-53.5, gz0 - 0.15]], 0xc4d6ac);   // 체육관 북쪽 잔디(대각 길 남서쪽)
    for (let x = -84; x <= -58; x += 6.5) for (let z = -84; z <= -38.5; z += 6.5) { const sk = R9(), jx = jit() * 2.2, jz = jit() * 2.2, sc = 0.75 + R9() * 0.7;   // 체육관 북서쪽 숲(격자가 보이지 않게 크게 흩고 15%는 비움 — 과수원처럼 줄 서 보이던 것)
      const keep = z >= -46 ? x <= -77.5 : z > -62 ? false : sk > 0.55;   // 그림자 띠 = 서쪽 2열만 · 흙길 둘레 = 아래 빽빽한 줄이 대신 · 그 북쪽(창고·밭) = 드문드문
      if (sk > 0.15 && keep) bgTree(x + jx, z + jz, sc); }
    { const R8 = seeded(8123);
      for (let z = -60.5; z <= -53; z += 3.75) for (let x = -86.5; x <= -59.5; x += 4.5) bgTree(x + (R8() - 0.5) * 1.6, z + (R8() - 0.5) * 1.2, 1.1 + R8() * 0.4);   // 흙길 북쪽 결 보이는 수관(위성 A)
      for (let z = -44; z <= -24; z += 5) bgTree(-87.2 + (R8() - 0.5) * 0.4, z + (R8() - 0.5) * 1.5, 1.1 + R8() * 0.2); }                // 서쪽 울타리 밖 나무 줄(그림자 밖 수관 — 울타리 -86 너머)
    for (let z = 20; z <= 60; z += 5.5) { const jx9 = jit() * 0.3, zz = z + jit(), sc9 = 0.8 + R9() * 0.25;   // 서쪽 울타리 밖 나무 줄(울타리 -50.5와 비닐하우스 사이) — 난수 부르는 순서 그대로
      const xw9 = zz > 40 ? (Math.max(-50.5, -50.5 + 7.9 * (zz - 43.5) / 25.8) + (-58 + (zz - 3) * 5 / 74)) / 2 : -53.6;   // FSW-2: z 40 남쪽은 비스듬한 울타리(-50.5,43.5→-42.6,69.3)와 기운 하우스 동벽 사이 가운데
      bgTree(xw9 + jx9, zz, sc9 * (zz > 40 ? 0.72 : 0.85)); if (zz > 40) colliders[colliders.length - 1].nc = true; }   // 울타리 밖(못 닿음) — 3인칭 카메라만 줄기에 걸리지 않게                                              // FSW-2: 놀이터 서쪽은 작은 나무(영상 s_039~046.5 — 관목 위로 하우스 지붕이 크게 보인다)
    for (let z = -38; z <= 30; z += 7) bgTree(55 + jit() * 0.8, z + jit(), 0.9 + R9() * 0.35);                  // 동쪽 가장자리(데크 남쪽부터)
    for (let z = -84; z <= -58; z += 6.5) bgTree(58.5 + jit() * 0.4, z + jit(), 0.85 + R9() * 0.3);              // 텃밭 동쪽
    // 정문 옆 둥근 나무 3그루 → '학교 둘레·정문' 블록의 소나무 섬(SOUTH-2 — (16.5,47.8)은 진입로 한가운데였다)
  }

  // ================= 학교 둘레(울타리 다각형 · 정문) + 동네 =================
  {
    const BND = SCHOOL.boundary, [gtx, gtz] = SCHOOL.gate;
    const Y = FIELD;
    // 비스듬한 변의 충돌 = 선을 따라 0.3m 토막(여유 0.06). 예전엔 변마다 AABB 한 장이라 비스듬한 변(정문 양쪽)이
    //   놀이마당 남쪽·놀이터·통학로 끝을 덮는 보이지 않는 벽(최대 6m)이 됐다(SOUTH-2 걷기 실측 z 52.7·44.6에서 멈춤)
    const diagWall = (x0, z0, x1, z1, yb, H) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.3);
      for (let i = 0; i < n; i++) { const ax = x0 + (x1 - x0) * i / n, az = z0 + (z1 - z0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, bz = z0 + (z1 - z0) * (i + 1) / n;
        colliders.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, y0: yb, y1: yb + Math.max(4.5, H + 0.3), z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, nc: true }); } };   // 4.5: 윗면(예전 3)이 올라설 면이 되지 않게
    // 흰 철제 장식 울타리(영상 s_007.5~036: 2m마다 흰 네모 기둥 + 아치·소용돌이 판 + 빨강 사과·노랑 원 장식, 밑에 콘크리트 턱) — 판은 한 메시(투명 무늬)
    const ornPos = [], ornUV = [];
    const ornFence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ya = Y + 0.3, yb2 = Y + 1.55;
      const P = [[x0, ya, z0], [x1, ya, z1], [x1, yb2, z1], [x0, yb2, z0]], U = [[0, 0], [L / 2, 0], [L / 2, 1], [0, 1]];
      for (const i of [0, 1, 2, 0, 2, 3]) { ornPos.push(...P[i]); ornUV.push(...U[i]); }
      slab(x0, z0, x1, z1, 0.25, 0.3, 0xbdb9b0, Y, { far: true });                                     // 콘크리트 턱
      const n = Math.max(1, Math.round(L / 2));
      for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
        dBox(0.1, 1.3, 0.1, 0xf6f6f2, px, Y + 0.3, pz, { far: true }); dBox(0.16, 0.06, 0.16, 0xe9e9e4, px, Y + 1.6, pz, { far: true }); }
      diagWall(x0, z0, x1, z1, Y, 1.6); };
    for (let i = 0; i < BND.length; i++) {
      const [x0, z0] = BND[i], [x1, z1] = BND[(i + 1) % BND.length];
      if (z0 === gtz && z1 === gtz && Math.abs((x0 + x1) / 2 - gtx) < 1) continue;                    // SOUTH-2 정문(두 기둥 사이) — 아래 옛 정문 분기 둘은 꼭짓점이 정문 한가운데에 없어 더는 타지 않는다
      if (z0 === gtz || z1 === gtz) { ornFence(x0, z0, x1, z1); continue; }                            // 정문 양쪽 변 = 흰 장식 울타리(남서 영상 s_009~036 · 남동 s_000 왼쪽 끝)
      const yb = (x, z) => terrainAt(x, z);
      if (z0 < -70 && z1 < -70 && Math.min(x0, x1) > -49.5) { whiteFence(x0, z0, x1, z1, YARD); continue; }   // 북쪽 = 흰 무늬 쇠 울타리(BACKYARD-2 — 뒤뜰 블록)
      if (Math.abs(x1 - gtx) < 0.01 && Math.abs(z1 - gtz) < 0.01) { const t = 1 - 4.5 / Math.hypot(x1 - x0, z1 - z0); meshFence(x0, z0, x0 + (x1 - x0)*t, z0 + (z1 - z0)*t, yb(x0, z0), 1.8); continue; }
      if (Math.abs(x0 - gtx) < 0.01 && Math.abs(z0 - gtz) < 0.01) { const t = 4.5 / Math.hypot(x1 - x0, z1 - z0); meshFence(x0 + (x1 - x0)*t, z0 + (z1 - z0)*t, x1, z1, yb(x1, z1), 1.3, 0xf6f6f2, 0xe9e9e4); continue; }   // 정문 서쪽 = 흰 무늬 울타리(영상 s_009~024)
      // 높이가 바뀌는 변(서·동)은 둔덕/대지 경계에서 두 토막
      if (z0 === TR3.westZ && z1 === TR3.westZ) continue;          // 체육관 대지 남변 = 대지 위 철망(위에서 이미 둘렀다)
      const ya = yb(x0 + (x1 - x0) * 0.02, z0 + (z1 - z0) * 0.02), yc = yb(x0 + (x1 - x0) * 0.98, z0 + (z1 - z0) * 0.98);   // 끝점이 경계선 위일 때 안쪽 높이로
      if (Math.abs(x1 - x0) > 0.3 && Math.abs(z1 - z0) > 0.3) { meshFence(x0, z0, x1, z1, ya, 1.8, undefined, undefined, false); diagWall(x0, z0, x1, z1, ya, 1.8); continue; }   // 비스듬한 변(남서 모서리) — 토막 충돌
      if (ya === yc) meshFence(x0, z0, x1, z1, ya, 1.8);
      else { const zc = x0 < TR3.westX ? TR3.westZ : TERR_Z, t = (zc - z0) / (z1 - z0); meshFence(x0, z0, x0 + (x1 - x0)*t, zc, ya, 1.8); meshFence(x0 + (x1 - x0)*t, zc, x1, z1, yc, 1.8); }
    }
    if (ornPos.length) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const g9 = cv.getContext('2d');
      g9.strokeStyle = '#ffffff'; g9.lineWidth = 7; g9.lineCap = 'round';
      g9.beginPath(); g9.moveTo(0, 8); g9.lineTo(256, 8); g9.moveTo(0, 150); g9.lineTo(256, 150); g9.stroke();                       // 윗·아랫 가로대
      g9.lineWidth = 5; for (let x = 16; x < 256; x += 32) { g9.beginPath(); g9.moveTo(x, 150); g9.lineTo(x, 62); g9.stroke(); }     // 세로살
      g9.lineWidth = 6; [0, 128].forEach(ox => { g9.beginPath(); g9.arc(ox + 64, 64, 60, Math.PI, 0); g9.stroke();                  // 아치 둘(2m에 두 칸)
        g9.lineWidth = 4; [[ox + 34, 1], [ox + 94, -1]].forEach(([cx, s]) => { g9.beginPath(); g9.arc(cx, 44, 14, 0, Math.PI * 1.6 * s, s < 0); g9.stroke(); }); g9.lineWidth = 6; });   // 소용돌이
      g9.fillStyle = '#e04848'; [[64, 30], [192, 30]].forEach(([x, y]) => { g9.beginPath(); g9.arc(x, y, 12, 0, 7); g9.fill(); });  // 빨강 사과 장식
      g9.fillStyle = '#f2c230'; [[32, 96], [96, 96], [160, 96], [224, 96]].forEach(([x, y]) => { g9.beginPath(); g9.arc(x, y, 9, 0, 7); g9.fill(); });   // 노랑 원
      const ot = new THREE.CanvasTexture(cv); ot.wrapS = THREE.RepeatWrapping; ot.colorSpace = THREE.SRGBColorSpace; ot.anisotropy = 4;
      const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(ornPos, 3)); og.setAttribute('uv', new THREE.Float32BufferAttribute(ornUV, 2));
      og.computeVertexNormals(); og.computeBoundingSphere();
      const om = new THREE.Mesh(og, new THREE.MeshLambertMaterial({ map: ot, alphaTest: 0.5, side: THREE.DoubleSide }));
      om.matrixAutoUpdate = false; scene.add(om);
    }

    // ---- 정문(영상 s_000~001.5·g_000.5~002): 화강석 기둥 둘(폭 1.2·깊이 0.9·높이 2.0 + 두 단 갓) — 아래 문 선 따라 뚫린 통로 홈(접힌 신축문이 들어감) · 가로보·이름판 없음 ----
    const GC = 0xdad8d2, GW = SWA[0] + 0.6, GE = BND.find(p => p[1] === gtz && p[0] > gtx)[0] - 0.6;    // 기둥 중심 x(바깥 면 = 울타리 끝)
    [GW, GE].forEach(px9 => {
      addBox(1.3, 0.15, 1.0, 0xb3b0a8, px9, Y, gtz);
      addBox(1.2, 1.2, 0.2, GC, px9, Y + 0.15, gtz - 0.35); addBox(1.2, 1.2, 0.2, GC, px9, Y + 0.15, gtz + 0.35);
      addBox(1.2, 0.65, 0.9, GC, px9, Y + 1.35, gtz);
      dBox(1.4, 0.12, 1.1, 0xbdbab3, px9, Y + 2.0, gtz, { far: true }); dBox(1.25, 0.1, 0.95, 0xc4c1ba, px9, Y + 2.12, gtz, { far: true });
      const bk = px9 < gtx ? -1 : 1;
      dBox(1.05, 0.04, 0.48, 0x55585c, px9 - bk * 0.075, Y + 0.15, gtz);                                 // 홈 바닥(짙은 레일)
      addBox(0.15, 1.2, 0.5, 0x55585c, px9 + bk * 0.525, Y + 0.15, gtz);   // 홈 안쪽 막힌 벽(문 쪽으로만 열림 — 영상 s_001.5)
    });
    colliders.push({ x0: GW + 0.6, x1: GE - 0.6, y0: Y, y1: Y + 4.5, z0: gtz - 0.1, z1: gtz + 0.1, nc: true });   // 정문 선 막이(학교 밖 도로로 새지 않게 — 게임 기초 맵) · 윗면이 올라설 면이 되지 않게 4.5m(기둥 윗면 2.0 + 점프·디딤 1.52 < 4.5)
    { // 접힌 스테인리스 신축교문(영상 s_000·g_001: ∩ 살 10개 + 아래 X 링크 + 바퀴) — 동쪽 기둥 서쪽으로 3m
      const S9 = 0xcdd2d6, x00 = GE - 0.75;
      for (let k = 0; k < 10; k++) { const x9 = x00 - k * 0.3;
        [-0.25, 0.25].forEach(o => dRod(x9, Y + 0.08, gtz + o, x9, Y + 0.85, gtz + o, 0.022, S9));
        dGeo(new THREE.TorusGeometry(0.25, 0.022, 5, 10, Math.PI).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(x9, Y + 0.85, gtz), S9);
        dCyl(0.06, 0.06, 0.04, 0x26282c, x9, Y, gtz - 0.25, { seg: 8, rot: [0, 0, Math.PI / 2] });
        if (k < 9) [-0.25, 0.25].forEach(o => { dRod(x9, Y + 0.25, gtz + o, x9 - 0.3, Y + 0.75, gtz + o, 0.015, S9); dRod(x9, Y + 0.75, gtz + o, x9 - 0.3, Y + 0.25, gtz + o, 0.015, S9); }); }
      colliders.push(noStand({ x0: x00 - 2.75, x1: GE - 0.6, y0: Y, y1: Y + 1.1, z0: gtz - 0.32, z1: gtz + 0.32 }, 2.3));   // 2.3: 기둥 받침(0.15)에서 점프·디딤(1.52)으로 1.67까지 닿는다 — 1.6이면 접힌 문→기둥→막이 위로 올라 밖으로 나갔다
    }
    // ---- 정문 안쪽: 회색 아스팔트 진입로(흰 테두리선 — 영상 g_005) + 동쪽 베이지 보도(진입로~소나무 섬 · 숲놀이터 서쪽 모퉁이까지 — 영상 g_002~003.5) ----
    //   동쪽 통학로로 잇는 길은 숲놀이터 북쪽(영상 f_234~243: 서쪽으로 걸을 때 데크 = 왼쪽)이라 east_path 작업(곡선 길 + 숲놀이터 남쪽 이동)에 맡긴다 — 숲놀이터와 울타리 사이 띠는 뺐다
    const DX0 = SCHOOL.plaza.x[1], DX1 = DX0 + 4.4, PZ0 = SCHOOL.plaza.z[0];
    patQuad('asph', DX0, DX1, PZ0, gtz - 0.2, Y + 0.02, false, 0xe8e8e8);
    [DX0 + 0.2, DX1 - 0.2].forEach(lx => addPanel(0.15, gtz - 0.2 - PZ0 - 0.4, 0xeeeeea, lx, Y + 0.03, (PZ0 + gtz - 0.2) / 2));
    patQuad('pave', DX1, GE - 0.2, PZ0, gtz - 0.3, Y + 0.02);
    patQuad('pave', GE - 0.2, SCHOOL.forestPlay.x[0], PZ0, 47.1, Y + 0.02);                           // 숲놀이터 서쪽 모퉁이
    // ---- 정문 동쪽 소나무 섬(영상 s_001.5·g_001~003.5 · 위성 짙은 수관 x 21~33): 화강 경계석 + 자연석 + 억새 + 붉은 줄기 키 큰 소나무 ----
    { const IX = GE - 0.2, IZ = 49.3;
      addBox(0.15, 0.15, gtz - 0.6 - IZ, 0xb8b4ab, IX + 0.075, Y, (IZ + gtz - 0.6) / 2);                    // 서쪽 경계석(베이지 보도 쪽)
      [[0.5, 5.3, 0.45], [1.2, 4.2, 0.35], [0.4, 2.6, 0.4], [1.9, 5.6, 0.3], [2.6, 3.4, 0.38], [0.7, 1.2, 0.3]].forEach(([ox, oz, r]) => {
        dBlob(r * 1.3, r * 0.7, r, 0xbdb9b0, IX + ox, Y + r * 0.3, IZ + oz, { far: true, chunky: true, ry: ox * 3 });
        ellipseCols(IX + ox, IZ + oz, r * 1.3, r, ox * 3, Y, Y + r, 0.86); });   // [quality4 09-26] 자연석 막이(충돌이 없어 발이 묻혔다 — 정문 앞 발 묻힘 27칸)
      [[1.0, 3.2], [1.6, 4.9], [0.6, 4.0], [2.3, 2.2], [1.4, 1.5]].forEach(([ox, oz]) => { dBlob(0.45, 0.55, 0.45, 0x7fa35a, IX + ox, Y + 0.4, IZ + oz, { jitter: 0.15 });
        softVols.push({ x0: IX + ox - 0.46, x1: IX + ox + 0.46, y0: Y - 0.2, y1: Y + 0.96, z0: IZ + oz - 0.46, z1: IZ + oz + 0.46, why: '억새(풀 — 걸어 들어감)' }); });   // [integ 09-25]
      const tallPine = (x, z, s = 1) => { const y = Y, R = seeded(Math.floor(Math.abs(x * 57 + z * 91)) + 3), lean = (R() - 0.5) * 0.14, a = R() * 6.28, H = 6.2 * s;
        colliders.push({ x0: x - 0.25, x1: x + 0.25, y0: y, y1: y + 12, z0: z - 0.25, z1: z + 0.25 });
        dCyl(0.13 * s, 0.22 * s, H, 0x8a5a3c, x, y, z, { far: true, rot: [lean * Math.sin(a), 0, lean * Math.cos(a)] });
        const tx = x + Math.cos(a) * H * lean * 0.9, tz = z - Math.sin(a) * H * lean * 0.9;
        [[H - 0.5, 2.3], [H + 0.6, 2.0], [H + 1.6, 1.4], [H - 1.4, 1.6]].forEach(([h, r], k) => { const ang = a + k * 2.1, d = k === 2 ? 0.2 : 0.9;
          dBlob(r * s, r * 0.36 * s, r * 0.85 * s, [0x3f6b3f, 0x4a7a46, 0x3a633b, 0x44743f][k], tx + Math.cos(ang) * d, y + h * s, tz + Math.sin(ang) * d, { far: true, jitter: 0.12, ry: ang }); }); };
      [[IX + 1.8, 52.0, 1.0], [IX + 3.6, 50.4, 1.1], [IX + 4.6, 53.0, 0.95], [IX + 7.0, 51.0, 1.15], [IX + 9.9, 50.2, 1.0], [IX + 12.2, 49.8, 1.1], [IX + 8.6, 52.3, 0.9]].forEach(([x9, z9, s9]) => tallPine(x9, z9, s9));
    }
    // ---- 학교 안내판(초록 머리띠 + 학교 이름 — 영상 s_007.5~012 왼쪽) + 회색 가로등(네모 머리) — 잔디 띠 위, 버스 마당(북)을 본다 ----
    { const ax = SWA[0] - 3.1, az = fenceZ(ax) - 1.1, BW = 0x7a5c44;
      [-1.1, 1.1].forEach(o => { dBox(0.12, 2.4, 0.12, 0x6b5440, ax + o, Y, az); post(ax + o, az, Y, Y + 2.4, 0.08); });
      dBox(2.4, 1.5, 0.08, BW, ax, Y + 0.85, az);
      colliders.push(noStand({ x0: ax - 1.2, x1: ax + 1.2, y0: Y + 0.8, y1: Y + 2.4, z0: az - 0.06, z1: az + 0.06 }));
      dBox(1.05, 1.1, 0.03, 0x4f8fcf, ax - 0.55, Y + 0.95, az - 0.055); dBox(1.05, 1.1, 0.03, 0xf4f4f0, ax + 0.55, Y + 0.95, az - 0.055);
      dBox(0.7, 0.5, 0.03, 0x6fae5a, ax - 0.55, Y + 1.2, az - 0.085);                                     // 그림판 속 나무 그림
      for (let k = 0; k < 5; k++) dBox(0.8, 0.04, 0.03, 0x9a9a9a, ax + 0.55, Y + 1.15 + k * 0.16, az - 0.085);   // 글판(줄무늬로만)
      dBox(2.3, 0.3, 0.04, 0x2f6b46, ax, Y + 2.08, az - 0.06);
      sign(SCHOOL.name, ax - 0.3, Y + 2.23, az - 0.09, Math.PI, 0.22, { bg: '#2f6b46', fg: '#ffffff' });
      const lx = ax + 1.7, lz = az - 0.5;
      dCyl(0.09, 0.12, 5.0, 0x9aa0a6, lx, Y, lz, { far: true, seg: 8 }); post(lx, lz, Y, Y + 5, 0.12);
      dBox(0.3, 0.22, 0.5, 0x8a9096, lx, Y + 5.0, lz - 0.15, { far: true }); lamp(0.24, 0.04, 0.4, lx, Y + 4.97, lz - 0.15);
      dBox(0.16, 0.14, 0.26, 0xdfe3e8, lx + 0.12, Y + 3.6, lz - 0.2);                                   // CCTV
      dBlob(0.35, 0.3, 0.35, 0x9ccf3a, ax - 2.2, Y + 0.28, az + 0.1); dBlob(0.3, 0.26, 0.3, 0x93c636, ax - 3.0, Y + 0.24, az + 0.3);   // 둥근 연두 댑싸리 둘(영상 s_009)
      [[ax - 2.2, az + 0.1, 0.26], [ax - 3.0, az + 0.3, 0.22]].forEach(([x9, z9, r9]) => colliders.push(noStand({ x0: x9 - r9, x1: x9 + r9, y0: Y, y1: Y + 0.5, z0: z9 - r9, z1: z9 + r9 })));   // [integ 09-25] 덤불도 몸이 뚫지 않게(ghost)
    }
    // ---- 정문 밖 설치물(영상 s_000·s_001.5): 현수막 틀(글자 없이) · '30' 어린이보호구역 표지 · CCTV 기둥 ----
    { const bx = GE + 1.3, bz = gtz + 1.0;
      [0, 3.0].forEach(o => { dBox(0.1, 4.2, 0.1, 0x8a9096, bx + o, Y, bz, { far: true }); post(bx + o, bz, Y, Y + 4.2, 0.08); });
      [[2.4, 0xf0eee8, 0xe98fae], [3.3, 0xf0eee8, 0x8cc26a]].forEach(([y9, c9, s9]) => { dBox(2.9, 0.85, 0.03, c9, bx + 1.5, Y + y9, bz, { far: true });
        dBox(2.6, 0.18, 0.03, s9, bx + 1.5, Y + y9 + 0.5, bz - 0.03); dBox(1.8, 0.1, 0.03, 0xb9b9b9, bx + 1.5, Y + y9 + 0.2, bz - 0.03); });
      const sx = GE + 0.9, sz = gtz + 0.75;
      dCyl(0.05, 0.05, 3.2, 0x9aa0a6, sx, Y, sz, { seg: 6 }); post(sx, sz, Y, Y + 3.2, 0.06);
      dGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 20).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(sx, Y + 2.75, sz - 0.04), 0xf2c230, { far: true });
      dGeo(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(sx, Y + 2.75, sz - 0.07), 0xd83a3a, { far: true });
      sign('30', sx, Y + 2.75, sz - 0.095, Math.PI, 0.26, { bg: '#ffffff', fg: '#222222' });
      dBox(0.5, 0.3, 0.03, 0xf4f4f0, sx, Y + 2.2, sz - 0.05);
      dCyl(0.08, 0.1, 4.2, 0x9aa0a6, GE + 0.55, Y, gtz + 1.6, { far: true, seg: 8 }); post(GE + 0.55, gtz + 1.6, Y, Y + 4.2, 0.1);
      dBox(0.3, 0.15, 0.15, 0xdfe3e8, GE + 0.55, Y + 3.9, gtz + 1.42);
    }
    zones.push({ x0: Math.max(SWA[0], ...zones.filter(q => q.label === '버스 타는 곳').map(q => q.x1)), x1: GE + 0.6, z0: gtz - 4.5, z1: gtz - 0.1, y: Y, label: '정문' });   // [integ 09-25] 서끝 = 버스 타는 곳 동끝(겹침 48칸 제거)
  }
  {   // 동네 — 정문 밖이 허공이면 학교가 떠 있어 보인다
    const Y = FIELD;
    // SOUTH-2(위성 Esri·네이버 + 영상 s_000~036): 정문 밖은 동서 찻길이 아니라 남쪽으로 뻗는 붉은 어린이보호구역 포장 · 동쪽 흰 조립식 창고 ·
    //   울타리 밖은 여름 밭(초록 이랑) · 남동 울타리 밖 시멘트 마을길 · 정문 남서 큰 회색 골판 지붕 창고 · 멀리 농가·정자
    const [gx9, gz9] = SCHOOL.gate, SEA = SCHOOL.boundary.find(p => p[1] === gz9 && p[0] > gx9);
    floor4('redRd', [[SWA[0] - 0.9, fenceZ(SWA[0] - 0.9) + 0.2], [SEA[0], gz9 + 0.1], [SEA[0] + 7.4, 60], [SWA[0] + 0.6, 60]], Y + 0.012);   // 정문 앞 넓은 붉은 포장(사다리꼴)
    floor4('redRd', [[SEA[0], gz9 + 0.1], [SEA[0] + 8.4, gz9 - 2.2], [SEA[0] + 7.4, 60], [SEA[0] + 7.4, 60]], Y + 0.012);   // 동쪽 세모(남동 마을길과 만남)
    floor4('redRd', [[SWA[0] + 0.6, 60], [SEA[0] + 7.4, 60], [SEA[0] + 6.4, 66], [SWA[0] + 4.6, 66]], Y + 0.012);
    floor4('redRd', [[SWA[0] + 4.6, 66], [SEA[0] + 6.4, 66], [SEA[0] + 6.4, 140], [SWA[0] + 6.6, 140]], Y + 0.012);   // 남쪽으로 뻗는 길(폭 약 8m)
    addPanel(0.14, 74, 0xe8c547, (SWA[0] + SEA[0]) / 2 + 6, Y + 0.022, 103);                           // 노랑 중앙선
    { const mz = x => 48.3 + (55 - x) * 0.225;                                                         // 남동 마을길(시멘트 · 폭 3.2 — 울타리 밖으로 돌아 정문길에 합류)
      floor4('gravel', [[SEA[0] + 8.4, mz(SEA[0] + 8.4)], [62, mz(62)], [62, mz(62) + 3.2], [SEA[0] + 8.4, mz(SEA[0] + 8.4) + 3.2]], Y + 0.014); }
    { const px9 = SEA[0] + 14, pz9 = 61.3;                                                              // 흰 조립식 창고(영상 s_000·g_000.5 — 정문 밖 동쪽)
      addBox(6, 2.7, 5.5, 0xeef0ee, px9, Y, pz9);
      dBox(6.4, 0.15, 5.9, 0x9fb0b8, px9, Y + 2.7, pz9, { far: true });
      dBox(0.9, 2.0, 0.04, 0x8a9aa4, px9 - 1.5, Y, pz9 - 2.77, { far: true }); dBox(1.2, 0.8, 0.04, 0x5b7590, px9 + 1.2, Y + 1.1, pz9 - 2.77, { far: true }); }
    {   // 밭(여름 — 흙 이랑 위 초록 작물 줄): 남서 울타리 밖 · 남동 마을길 밖
      const rows = (x0, x1, z0, z1, dz) => { for (let z = z0; z <= z1; z += dz) slab(x0, z, x1, z, 0.6, 0.35, 0x5f9a45, Y); };   // 이랑(감사·검사 밖 — 울타리 밖 원경)
      // FSW-2: 밭은 남쪽으로 z 88까지(위성 Esri 갈색 밭 · 예전 집 세 채 자리) — 서쪽 칸(x -34~-5.5)과 동쪽 칸(창고 북쪽)은 맞대기만(같은 높이 겹침 = 깜빡임)
      const FX9 = -5.5, FXW = -34;
      floor4('dirt', [[FX9, fenceZ(FX9) + 1.3], [SWA[0] - 1.2, fenceZ(SWA[0] - 1.2) + 1.3], [SWA[0] - 1.2, 67.8], [FX9, 67.8]], Y + 0.004, 0x9c8a60);
      floor4('dirt', [[FXW, fenceZ(FXW) + 1.3], [FX9, fenceZ(FX9) + 1.3], [FX9, 88], [FXW, 88]], Y + 0.004, 0x9c8a60);
      const rowT = (x0, x1, z) => slab(x0, z, x1, z, 0.75, 0.8, 0x4d8a3c, Y);                          // 남서쪽 밭 = 키 큰 여름 작물 줄(영상 s_010.5~033 울타리 너머 짙은 초록 — 낮은 줄이면 흙 줄무늬로 보였다)
      for (let z = 61.2; z <= 67.2; z += 1.1) { const xa = Math.max(FX9 + 0.5, (58.513 + 1.8 - z) / 0.25321); if (SWA[0] - 1.6 - xa > 1) rowT(xa, SWA[0] - 1.6, z); }
      for (let z = 64.4; z <= 87.5; z += 1.1) { const xa = Math.max(FXW + 0.5, (58.513 + 1.8 - z) / 0.25321); if (FX9 - 0.4 - xa > 1) rowT(xa, FX9 - 0.4, z); }
      slab(SWA[0] - 0.5, fenceZ(SWA[0] - 0.5) + 0.75, -27, fenceZ(-27) + 0.75, 0.8, 0.04, 0xc9c4b8, Y, { far: true });   // 울타리 따라 콘크리트 농로
      patQuad('dirt', SEA[0] + 18, 64.5, 58, 100, Y + 0.004, false, 0x9c8a60); rows(SEA[0] + 18.4, 64.1, 58.6, 99.4, 1.2);
    }
    { const gx0 = -4.5, gx1 = 14.5, gz0 = 68.5, gz1 = 84;                                               // FSW-2: 위성 밝은 네모(x -4.5~14.5 · z 68~84) = 비닐 멀칭한 밭 — 같은 사진의 3.5m 쉼터 지붕은 북쪽으로 6m 그늘인데 이 네모는 그늘이 없고,
      patQuad('dirt', gx0, gx1, gz0, gz1, Y + 0.004, false, 0xd6d5cc);                                //   영상 s_010.5~016.5(정문 쪽에서 서쪽 울타리 너머)에도 큰 창고가 없다(예전 4.5m 골판 창고)
      for (let x = gx0 + 0.8; x < gx1 - 0.3; x += 1.3) slab(x, gz0 + 0.5, x, gz1 - 0.5, 0.7, 0.14, 0xe4e4de, Y); }   // 흰 비닐 두둑(남북)
    const HOUSE = [[-64, 76, 0xd9c9b0, 0xa9503f], [-44, 81, 0xcfd6dc, 0x50606e], [-24, 86, 0xe0d3ba, 0x6f4a30], [4, 92, 0xe6d9c6, 0xa9503f], [70, 68, 0xdfd2bd, 0x6f4a30]];
    const PRISM = new THREE.CylinderGeometry(1, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2);   // 세모 기둥: 축 = x, 꼭짓점 위(y 1)·밑변 y -0.5·반폭 0.866
    HOUSE.forEach(([hx9, hz, wc, rc], i) => {
      if (i < 3) return;   // FSW-2: x -64·-44·-24 세 채는 뺀다(위성 = 비닐하우스 남끝·나무 덩어리·밭 · 영상 s_028~042 울타리 너머에 2층 집 없음) — i는 남은 집 모양이 그대로이게 유지
      const d9 = i % 2 ? 7.4 : 6.2, h9 = i % 3 ? 5.2 : 6.6, rh = 1.6 + (i % 2) * 0.5, sy = rh / 1.5;
      addBox(9, h9, d9, wc, hx9, Y, hz);
      dGeo(PRISM, new THREE.Matrix4().compose(new THREE.Vector3(hx9, Y + h9 + 0.5 * sy, hz), new THREE.Quaternion(), new THREE.Vector3(9.8, sy, (d9 + 0.9) / 2 / 0.866)), rc, { far: true });   // 박공지붕(처마 45cm)
      addBox(1.1, 2.1, 0.2, 0x6d5340, hx9, Y, hz - d9/2 - 0.11, { collide: false });
      [-2.6, 2.6].forEach(ox => [1.0, 3.5].forEach(wy => {   // 앞 창(학교 쪽 — 짙은 유리 + 흰 틀)
        dBox(1.5, 1.2, 0.05, 0xf2f0ea, hx9 + ox, Y + wy - 0.06, hz - d9/2 - 0.025, { far: true }); dBox(1.3, 1.0, 0.05, 0x5b7590, hx9 + ox, Y + wy + 0.04, hz - d9/2 - 0.05, { far: true }); }));
    });
    {   // FSW-2 파랑 지붕 큰 창고(위성 Esri 파랑 지붕 게임 x -67~-49 · z 76~89 = 비닐하우스 남끝 · 영상 s_028.5~033 울타리 너머 짙은 지붕 넓은 건물 — 예전 4m 정자 자리)
      const x0 = -66.5, x1 = -48.8, z0 = 77.2, z1 = 88.8, H9 = 3.4, cx9 = (x0 + x1) / 2, cz9 = (z0 + z1) / 2, sy = 2.1 / 1.5;
      slab(x0, cz9, x1, cz9, z1 - z0, H9, 0xd9dad5, Y, { far: true });
      dGeo(PRISM, new THREE.Matrix4().compose(new THREE.Vector3(cx9, Y + H9 + 0.5 * sy, cz9), new THREE.Quaternion(), new THREE.Vector3(x1 - x0 + 0.8, sy, (z1 - z0 + 1.0) / 2 / 0.866)), 0x3a5570, { far: true });   // 위성 파랑 · 영상은 짙은 청회색
      [x0 + 3, x0 + 9, x1 - 5].forEach(dx9 => slab(dx9 - 1.4, z0 - 0.03, dx9 + 1.4, z0 - 0.03, 0.06, 2.6, 0x8d949a, Y, { far: true }));   // 북면 셔터
    }
    [[-34, 74, 1.0], [-36.5, 77.5, 1.1], [30, 72, 0.95], [40, 56, 0.9]].forEach(([tx9, tz9, s9]) => bgTree(tx9, tz9, s9));   // 울타리 밖 나무 — FSW-2: (-58,66)은 새 하우스 속, (-14,76)은 밭 한가운데라 남서 나무 덩어리로 옮김
    [[-49.2, 67.6, 0.95], [-44.6, 74.8, 0.9], [-40.2, 71.6, 0.95], [-48.2, 62.0, 0.8], [-37.5, 70.4, 0.75], [-46.8, 72.4, 0.8]].forEach(([tx9, tz9, s9]) => { bgTree(tx9, tz9, s9); colliders[colliders.length - 1].nc = true; });   // 울타리 밖 — 카메라만 통과 · 키 ≈4m(놀이터에서 하우스 마루가 그 위로 보이게 — 영상 s_039·s_042)   // FSW-2 남서 모서리 밖 나무 덩어리(위성 Esri 게임 -50~-35 · 64~76 · 영상 s_031.5~039 왼쪽 원경)
    {   // FSW-2 서쪽 큰 연동 비닐하우스(위성 Esri: 폭 8m × 3연동 한 동 · 북끝 z≈3 → 남끝 z≈77 · 남쪽으로 갈수록 동쪽으로 약 3.9° · 동벽 z 20 -57.3 · z 75 -53)
      //   영상 s_036~051·g_060: 담장·생울타리 위로 크게 솟은 은회색 아치 지붕 + 마루 위 철골 레일(s_046.5 확대) — 옆벽 3.2 + 아치 2.9 = 마루 6.1 + 레일 0.55
      //   (s_051 역산 5.6~6.8 · s_046.5에서 높은 그물 6m와 견준 마루 ≈5.7(거리 보정) · s_051 체육관 지붕보다 화면에서 높게 보임)
      //   예전 3칸 반원 터널(z 2.5~54.8 · 마루 4)은 남쪽 22m가 모자랐다. 여섯 토막으로 나눠 청크마다(긴 한 덩어리는 청크 경계 구를 부풀린다)
      const [ax9, az9] = [-70, 3], [bx9, bz9] = [-65, 77], L9 = Math.hypot(bx9 - ax9, bz9 - az9), phi = Math.atan2(bx9 - ax9, bz9 - az9);
      const WH = 3.2, RS = 2.9, BW = 8, RR9 = (BW * BW / 4 + RS * RS) / (2 * RS), AA = Math.asin(BW / 2 / RR9), YC9 = WH - RR9 * Math.cos(AA), NSG = 6, SL = L9 / NSG;
      const GWL = 0x8e9a98, GRF = 0xb0babf, GFR = 0x737c80, B9 = new THREE.Matrix4().compose(new THREE.Vector3(ax9, Y, az9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, phi, 0)), new THREE.Vector3(1, 1, 1));
      const W9 = (v, y, u) => new THREE.Vector3(v, y, u).applyMatrix4(B9);                             // 하우스 로컬(v 동 +·u 남 +) → 월드
      const at9 = (v, y, u, sx = 1, sy2 = 1, sz = 1) => B9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(v, y, u), new THREE.Quaternion(), new THREE.Vector3(sx, sy2, sz)));
      const _z9 = new THREE.Vector3(0, 0, 1), _t9 = new THREE.Vector3();
      let AT9 = null;                                                                                    // 이 토막의 청크(토막마다 한 청크 — 드로우콜·경계 구)
      const bar9 = (a, b, w, c, far) => { _t9.subVectors(b, a); const L = _t9.length(); _t9.divideScalar(L);   // 두 점 사이 가는 네모 막대(12면 · dRod와 달리 몸 검사 목록 밖 — 울타리 밖이라 닿지 않는다)
        dGeo(box_, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(_z9, _t9), new THREE.Vector3(w, w, L)), c, far ? { far: true, at: AT9 } : { at: AT9 }); };
      const arch = new THREE.CylinderGeometry(RR9, RR9, SL, 8, 1, true, Math.PI / 2 - AA, 2 * AA).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
      const rib = new THREE.TorusGeometry(RR9, 0.06, 3, 6, 2 * AA).rotateZ(Math.PI / 2 - AA);
      //   멀리서도 보이는 몸통(옆벽·아치·물받이)은 far 층, 살·레일·기둥은 near 층(55m 밖이면 숨김 — 먼 시점 삼각형 예산)
      const FAT = [[-66, 21], [-62, 58]];                                                               // far 몸통 = 두 청크(북·남 절반 — 예전 하우스·나무 줄 청크에 합쳐 드로우콜을 늘리지 않는다)
      for (let i = 0; i < NSG; i++) { const uc = (i + 0.5) * SL, u0 = i * SL, u1 = (i + 1) * SL, cw = W9(0, 0, uc); AT9 = [cw.x, cw.z];
        const F9 = { far: true, at: FAT[i < NSG / 2 ? 0 : 1] };
        [-1, 1].forEach(sg => dGeo(box_, at9(sg * (1.5 * BW - 0.03), WH / 2, uc, 0.06, WH, SL), GWL, F9));   // 옆벽(동·서)
        [-1, 0, 1].forEach(k => { dGeo(arch, at9(k * BW, YC9, uc), GRF, F9);
          bar9(W9(k * BW, WH + RS + 0.55, u0), W9(k * BW, WH + RS + 0.55, u1), 0.08, GFR, false);            // 마루 위 철골 레일
          bar9(W9(k * BW, WH + RS - 0.05, u0 + 0.3), W9(k * BW, WH + RS + 0.55, u0 + 0.3), 0.06, GFR, false); });
        [-0.5, 0.5].forEach(k => bar9(W9(k * BW, WH - 0.04, u0), W9(k * BW, WH - 0.04, u1), 0.14, GFR, false));  // 연동 골(물받이)
        for (let u = u0 + 1.55, n9 = 0; u < u1 - 0.3; u += 3.1, n9++) { dGeo(rib, at9(BW, YC9, u), 0x5a6367, { at: AT9 });   // 동쪽 칸 아치 살 3.1m마다(영상 s_046.5 확대 — 처마에서 마루로 휘는 짙은 줄)
          if (n9 % 2 === 0) bar9(W9(1.5 * BW + 0.02, 0, u), W9(1.5 * BW + 0.02, WH, u), 0.07, GFR, false); }   // 동벽 기둥
      }
      const endS = new THREE.Shape(); endS.moveTo(-1.5 * BW, 0); endS.lineTo(1.5 * BW, 0); endS.lineTo(1.5 * BW, WH);   // 박공 끝벽(3칸 아치 윤곽)
      [1, 0, -1].forEach(k => endS.absarc(k * BW, YC9, RR9, Math.PI / 2 - AA, Math.PI / 2 + AA, false));
      endS.lineTo(-1.5 * BW, 0);
      const endG = new THREE.ShapeGeometry(endS, 6);
      { const c0 = W9(0, 0, SL / 2), c1 = W9(0, 0, L9 - SL / 2);
        dGeo(endG, at9(0, 0, L9 + 0.01), GWL, { far: true, at: [-62, 58] });                           // 남끝(남을 봄)
        dGeo(endG.clone().rotateY(Math.PI), at9(0, 0, -0.01), GWL, { far: true, at: [-66, 21] }); }      // 북끝(북을 봄)
    }
    {   // FSW-2 서쪽 비스듬한 울타리 밖 돌 박은 흙 둔덕 + 빽빽한 떨기나무(위성 Esri 짙은 띠 z 43~61 · 영상 s_039~046.5: 놀이터 서쪽 = 돌 비탈 위 관목 벽, 그 너머 하우스)
      //   울타리 선(남서 모서리 → 곧은 서쪽 변 꺾임)을 따라 바깥으로 0.35~4.6m · 높이 1.3 · 걸어서 닿지 않는 곳이라 충돌 없음(far 병합)
      const SB9 = SCHOOL.boundary, iS = SB9.findIndex(p => p[0] === -50.5 && p[1] === 43.5), E9 = SB9[iS - 1], S9b = SB9[iS];
      if (iS > 0 && E9[1] > S9b[1]) {
        const dx9 = S9b[0] - E9[0], dz9 = S9b[1] - E9[1], L0 = Math.hypot(dx9, dz9), tx = dx9 / L0, tz = dz9 / L0, nx = tz, nz = -tx;   // t = 모서리 → 꺾임(북북서), n = 바깥(서)
        const U0 = -1.5, U1 = L0 + 1.5, cs = new THREE.Shape();
        cs.moveTo(0.35, 0); cs.lineTo(4.6, 0); cs.lineTo(3.6, 1.35); cs.lineTo(2.0, 1.25); cs.lineTo(0.35, 0);
        const bg9 = new THREE.ExtrudeGeometry(cs, { depth: U1 - U0, bevelEnabled: false, curveSegments: 1 });
        const bm9 = new THREE.Matrix4().makeBasis(new THREE.Vector3(nx, 0, nz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(tx, 0, tz)).setPosition(E9[0] + tx * U0, Y, E9[1] + tz * U0);
        dGeo(bg9, bm9, 0x7d8a58, { far: true });
        const P9 = (u, d) => [E9[0] + tx * u + nx * d, E9[1] + tz * u + nz * d], hB = d => d < 2 ? 1.25 * (d - 0.35) / 1.65 : 1.3;
        for (let u = U0 + 0.8, k = 0; u < U1 - 0.5; u += 2.2, k++) {
          const d1 = 1.0 + 0.3 * Math.sin(k * 2.3), [rx, rz] = P9(u, d1), rs = 0.32 + 0.1 * ((k * 7) % 3);
          if (k % 2 === 0) dBlob(rs * 1.3, rs * 0.8, rs, [0x9d988c, 0x8f8a7f, 0xa8a397][k % 3], rx, Y + hB(d1) + 0.05, rz, { chunky: true, far: true, ry: k });   // 비탈에 박은 돌
          [[1.9, 1.05], [3.2, 1.15]].forEach(([d2, r2], j) => { const [sx, sz] = P9(u + j * 1.1, d2 + 0.25 * Math.sin(k + j)), rr = r2 * (0.85 + 0.3 * hash2(sx, sz));   // 관목 윗선 ≈ 운동장 위 2.5~3m(영상 s_046.5 — 높은 그물 6m의 절반)
            dBlob(rr, rr * 0.7, rr, [0x3f6f3a, 0x4a7a40, 0x36613a][(k + j) % 3], sx, Y + hB(d2) + rr * 0.35, sz, { chunky: true, far: true, jitter: 0.16, ry: k + j }); });
        }
      }
    }
    // 먼 산 능선(남쪽): 둥근 덩어리 5개씩 겹친다(초록 상자는 멀리서 네모 벽으로 보였다)
    [[-58, 116, 26, 13, -2.3], [6, 124, 34, 16, -4.3], [62, 112, 24, 11, -3.3]].forEach(([mx, mz, mw, mh, my], i) => {
      for (let k = 0; k < 5; k++) { const t = k / 4 - 0.5, hh = mh * (1 - Math.abs(t) * 0.9) * (0.85 + hash2(mx + k, mz) * 0.3);
        dBlob(mw * 0.62, hh, mw * 0.5, [0x5f8a5a, 0x6a955f, 0x58804f][(i + k) % 3], mx + t * mw * 2.2, my, mz + (k % 2) * 3, { far: true, jitter: 0.1, ry: k, at: [mx, mz] }); }
    });
  }
  {   // 외벽 파랑·노랑 띠(인식 포인트 1순위) — 띠 끝 0.06 인셋(감사)
    const IN = 0.06;
    const bandX = (x0, x1, z, face, y, col = BLUE) => addBox(x1-x0-IN*2, 0.55, 0.2, col, (x0+x1)/2, y, z + face*0.14, { collide: false });
    const bandZ = (z0, z1, x, face, y, col = BLUE) => addBox(0.2, 0.55, z1-z0-IN*2, col, x + face*0.14, y, (z0+z1)/2, { collide: false });
    // 서관 북면·동관 북·동·남면·급식동 서·북면 파랑 띠는 지웠다(BACKYARD-0·1·14 · COURT-3 Q_117.5~b_129: 영상엔 벽돌·노랑·크림 벽뿐)
    bandZ(wz0, wz1, wx0, -1, 2.65 + FH, YEL);                                     // 서관 서면 2층(노랑)
  }
  zones.push({ x0: LOB_X0, x1: fx1, z0: fz0, z1: zCor, y: 0, label: '본관 복도' });
  zones.push({ x0: TR3.westX, x1: SCHOOL.eastFenceX, z0: FLD.z[0], z1: SCHOOL.southFenceZ, y: FIELD, label: '운동장' });

  // 교실·사무실 바깥 창 블라인드(영상 a_487~493: 나무 가로살 블라인드를 창 윗부분에 걷어 올림) — 만든 창 목록(winLog)에서 방 안쪽 구역을 찾아
  { const ROOMS = new Set([...FR.rooms, ...wg.rooms, ...B.upper.rooms, ...B.eastWing.rooms].filter(r => !['hall', 'toilet', 'storage', 'stair'].includes(r.type)).map(r => r.name));
    for (const w of winLog) {
      if (!w.f) continue;
      const mid = (w.g0 + w.g1) / 2, px = w.ax === 'x' ? mid : w.line - w.f * 0.6, pz = w.ax === 'x' ? w.line - w.f * 0.6 : mid;
      const zn = zones.find(Z => px > Z.x0 && px < Z.x1 && pz > Z.z0 && pz < Z.z1 && Math.abs((Z.y ?? 0) - w.y0) < 0.5);
      if (!zn || !ROOMS.has(zn.label) || w.yt - w.yb < 0.9) continue;
      patWall('blind', w.ax, w.g0 + 0.06, w.g1 - 0.06, w.yt - 0.5, w.yt - 0.06, w.line - w.f * 0.18, -w.f);
    }
  }

  // ================= 사람들 =================
  // 정적(청크 병합 — 드로우콜 0)·충돌 없음(길을 막지 않는다). ⚠️대사는 교사 승인분만 — 임의 생성 금지
  {
    const zoneOf = n => zones.find(z => z.label === n);
    // 사람(DETAIL-1): 신발·다리·몸통·소매·손·목·머리·눈·입·볼·머리숱(여=긴 뒷머리). 옷색은 자리마다 다르게.
    // 크기 s(아이 1·어른 1.1·유치원 0.8). face = 바라보는 쪽(0북·1동·2남·3서). 발밑 y. 전체 키 ≈ 1.5·s
    // ⚠️겹치는 부품끼리 폭은 0.02 이상 다르게(머리 .32·앞머리 .28·짧은뒷머리 .34·정수리 .36·긴뒷머리 .40) — s=0.8에서도 면 차이 ≥8mm(감사 EPS 4mm)
    const TOPS = [0x4d7fd6, 0x3fa37a, 0xe8a33d, 0x8a6ad0, 0xd9574a, 0x5bb5c9, 0xf2d15c, 0xe0708a, 0x7a8a9a, 0xf08a5d, 0x6fbf73, 0xffffff];
    const BOTS = [0x2b3a55, 0x3d4f7a, 0x6b5b4a, 0x2f2f36, 0x5a6f8a, 0x8a8f99];
    const SKIN = [0xf1c9a0, 0xe8b98f, 0xf5d3b0], HAIR = [0x3a2e28, 0x2a2220, 0x4a3426, 0x5a3d2b];
    // CHAR-1(09-24 사용자 "캐릭터 모델링도"): 둥근 머리·머리 모양(짧은/단발/포니테일/양갈래)·눈(반짝임)·눈썹·볼·귀·반팔+팔·손·흰 실내화(아이)·치마/바지.
    //   실사 아님(사용자 07-30 "사람은 실제처럼 구현하지마") — 둥근 저폴리 인형. 부품은 청크 병합(드로우콜 0). 앞 = face 쪽
    const PSPH = new THREE.SphereGeometry(1, 8, 6).toNonIndexed(), PSM = new THREE.SphereGeometry(1, 6, 4).toNonIndexed(), PCAP = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.58).toNonIndexed();   // 머리 80면·중간 덩어리 36면·작은 것 PICO 20면·아주 작은 것(눈·볼·입) POCT 8면
    const PCYL = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, -0.5, 0).toNonIndexed(), PBODY = new THREE.CylinderGeometry(0.92, 1, 1, 9, 1).translate(0, 0.5, 0).toNonIndexed(), POCT = new THREE.OctahedronGeometry(1, 0);
    const PSKIRT = new THREE.CylinderGeometry(0.7, 1, 1, 10, 1).translate(0, -0.5, 0).toNonIndexed(), PICO = new THREE.IcosahedronGeometry(1, 0);
    const _pq = new THREE.Quaternion(), _pv = new THREE.Vector3(), _ps = new THREE.Vector3(), _pm = new THREE.Matrix4(), _pe = new THREE.Euler();
    function partGeo(x, y, z, face, s) {   // (지역 lx 오른쪽·ly 위·lz 앞) 단위 도형을 크기 (sx,sy,sz)로 놓는다. rx = 앞뒤로 기울임(+ = 끝이 앞으로)
      const th = [0, -Math.PI / 2, Math.PI, Math.PI / 2][face & 3], c = Math.cos(th), sn = Math.sin(th);
      return (geo, lx, ly, lz, sx, sy, sz, hex, rx = 0, rz = 0) => {
        const X = lx, Z = -lz;
        _pq.setFromEuler(_pe.set(rx, th, rz, 'YXZ'));
        _pm.compose(_pv.set(x + (X * c + Z * sn) * s, y + ly * s, z + (-X * sn + Z * c) * s), _pq, _ps.set(sx * s, sy * s, sz * s));
        dGeo(geo, _pm, hex, { flat: false });
      };
    }
    // sit=true: 의자(앉는 판 0.46)에 앉아 책상에 팔을 올린 자세. 앞 = 책상 쪽
    function person(x, y, z, sex, s = 1, face = 2, sit = false) {
      const G = partGeo(x, y, z, face, s), P = partAt(x, y, z, face, s), no = { collide: false };
      // 몸 충돌(PHYS-1): 사람을 뚫고 지나가지 않게. 선 사람 = 0.44×0.44×키, 앉은 사람 = 의자 위(0.85~키)만 — 의자·책상은 자기 충돌이 있다
      const hw = 0.22 * s;
      // 높이는 1.6 이상 — 점프 도달(0.97 + 오름 0.55 = 1.52)보다 높아야 머리 위에 올라서지 못한다
      colliders.push({ x0: x - hw, x1: x + hw, y0: y + (sit ? 0.85 : 0), y1: y + Math.max(1.6, 1.5 * s + 0.1), z0: z - hw, z1: z + hw });
      const h1 = hash2(x, z), h2 = hash2(z, x), pick = (a, h) => a[Math.floor(h * a.length) % a.length];
      const top = pick(TOPS, h1), bot = pick(BOTS, h2), skin = pick(SKIN, h1 * 7 % 1), hair = pick(HAIR, h2 * 5 % 1);
      const girl = sex === '여', adult = s > 1.05, SH = adult ? 0x3a3d44 : 0xf2f2ee, style = Math.floor(h2 * 13 % 1 * 3);
      // 다리·신발(아이 = 흰 실내화)
      if (sit) {
        P(-0.1, 0, 0.36, 0.14, 0.08, 0.24, SH, no); P(0.1, 0, 0.36, 0.14, 0.08, 0.24, SH, no);
        [-0.09, 0.09].forEach(lx => { G(PCYL, lx, 0.47, 0.0, 0.07, 0.36, 0.07, girl ? skin : bot, Math.PI / 2); G(PCYL, lx, 0.47, 0.34, 0.058, 0.4, 0.058, girl ? skin : bot); });
        if (girl) G(PSM, 0, 0.5, 0.12, 0.21, 0.07, 0.24, bot);                                   // 치마(무릎 위)
      } else {
        P(-0.1, 0, 0.03, 0.14, 0.08, 0.24, SH, no); P(0.1, 0, 0.03, 0.14, 0.08, 0.24, SH, no);
        if (girl) { [-0.085, 0.085].forEach(lx => G(PCYL, lx, 0.42, 0, 0.055, 0.35, 0.055, skin)); G(PSKIRT, 0, 0.64, 0, 0.21, 0.26, 0.16, bot); }
        else [-0.09, 0.09].forEach(lx => G(PCYL, lx, 0.62, 0, 0.072, 0.55, 0.072, bot));
      }
      // 몸통(둥근 원통)·어깨·팔
      G(PBODY, 0, 0.58, 0, 0.19, 0.46, 0.13, top);
      [-0.19, 0.19].forEach(lx => G(PICO, lx, 0.96, 0, 0.08, 0.07, 0.08, top));
      if (sit) [-1, 1].forEach(sd => { G(PCYL, sd * 0.21, 0.97, 0, 0.055, 0.28, 0.055, top, 0.9); G(PCYL, sd * 0.17, 0.78, 0.2, 0.045, 0.24, 0.045, skin, Math.PI / 2); G(PICO, sd * 0.17, 0.78, 0.45, 0.05, 0.045, 0.055, skin); });
      else [-1, 1].forEach(sd => { G(PCYL, sd * 0.225, 0.97, 0, 0.058, 0.2, 0.058, top, 0, sd * 0.1); G(PCYL, sd * 0.245, 0.78, 0, 0.046, 0.22, 0.046, skin, 0, sd * 0.1); G(PICO, sd * 0.265, 0.53, 0, 0.052, 0.058, 0.052, skin); });
      // 머리(둥근)·목·귀·얼굴
      const Y = 1.2 + (sit ? 0.02 : 0);
      G(PCYL, 0, Y - 0.08, 0, 0.05, 0.06, 0.05, skin);
      G(PSPH, 0, Y + 0.09, 0, 0.18, 0.175, 0.17, skin);
      [-1, 1].forEach(sd => {
        G(PICO, sd * 0.176, Y + 0.08, 0, 0.03, 0.045, 0.03, skin);                                                   // 귀
        G(POCT, sd * 0.068, Y + 0.1, 0.158, 0.026, 0.038, 0.016, 0x2a2222);                                           // 눈
        G(POCT, sd * 0.062, Y + 0.114, 0.171, 0.01, 0.01, 0.006, 0xffffff);                                          // 눈 반짝임
        G(POCT, sd * 0.068, Y + 0.155, 0.158, 0.036, 0.01, 0.012, hair);                                             // 눈썹
        if (!adult) G(POCT, sd * 0.112, Y + 0.05, 0.142, 0.032, 0.022, 0.012, 0xf4a3a0);                                 // 볼
      });
      G(POCT, 0, Y + 0.025, 0.164, 0.032, 0.013, 0.01, 0xb0504a);                                                      // 입
      // 머리카락: 뒤통수·정수리 모자 + 앞머리. 여 = 단발/포니테일/양갈래, 남 = 짧은 머리(+어른은 약간 길게)
      G(PCAP, 0, Y + 0.1, -0.01, 0.192, 0.2, 0.185, hair, 0.55);                                                   // 뒤로 기울인 모자 — 앞 테두리가 눈썹 위(기울이지 않으면 눈을 덮는다)
      G(PSM, 0, Y + 0.21, 0.11, 0.15, 0.06, 0.075, hair, -0.35);
      G(PSM, 0, Y + 0.07, -0.11, 0.17, 0.14, 0.085, hair);
      if (girl) {
        if (style === 0) { G(PSM, 0, Y - 0.03, -0.1, 0.19, 0.17, 0.1, hair); [-1, 1].forEach(sd => G(PSM, sd * 0.17, Y + 0.02, 0.02, 0.05, 0.13, 0.07, hair)); }   // 단발
        else if (style === 1) { G(PSM, 0, Y + 0.02, -0.22, 0.07, 0.13, 0.07, hair); G(PICO, 0, Y + 0.12, -0.19, 0.035, 0.035, 0.035, pick(TOPS, h2)); }    // 포니테일 + 머리끈
        else [-1, 1].forEach(sd => { G(PSM, sd * 0.2, Y - 0.02, -0.04, 0.06, 0.12, 0.06, hair); G(PICO, sd * 0.19, Y + 0.08, -0.04, 0.03, 0.03, 0.03, pick(TOPS, h1)); });   // 양갈래
      } else [-1, 1].forEach(sd => G(PICO, sd * 0.165, Y + 0.12, 0.03, 0.045, 0.09, 0.07, hair));                   // 옆머리(짧게)
    }
    // 사람도 allBoxes에 쌓이므로 다음 사람은 저절로 옆자리로 밀린다. 고정 좌표로 두면 의자·식탁에 박힌다(실제로 그랬음).
    function freeSpot(zn) {
      const y = zn.y ?? 0;
      const near = allBoxes.filter(b => b.x1 > zn.x0 && b.x0 < zn.x1 && b.z1 > zn.z0 && b.z0 < zn.z1
                                     && b.y0 < y + 1.6 && b.y1 > y + 0.05);
      // 문 앞 1.4m는 비운다(나래반 선생님이 문 바로 안에 서서 문서고까지 막았던 사고 — 09-24 reach)
      const dr = doors.filter(d => Math.abs(d.y0 - y) < 1 && d.cx > zn.x0 - 2 && d.cx < zn.x1 + 2 && d.cz > zn.z0 - 2 && d.cz < zn.z1 + 2);
      for (let z = zn.z1 - 1.0; z > zn.z0 + 0.9; z -= 0.7)
        for (let x = zn.x0 + 1.0; x < zn.x1 - 0.9; x += 0.9)
          if (!near.some(b => b.x1 > x - 0.34 && b.x0 < x + 0.34 && b.z1 > z - 0.26 && b.z0 < z + 0.26) && !dr.some(d => Math.hypot(d.cx - x, d.cz - z) < 1.4))
            return [x, z];
      return null;
    }
    const place = (zn, nm, sex, s) => {
      const p = freeSpot(zn); if (!p) return;
      // 방 가운데 쪽을 바라본다(90° 단위) — 뒤통수만 보이던 블록 인형이 아니게
      const dx = (zn.x0 + zn.x1) / 2 - p[0], dz = (zn.z0 + zn.z1) / 2 - p[1];
      const face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz > 0 ? 2 : 0);
      person(p[0], zn.y ?? 0, p[1], sex, s, face);
      sign(nm, p[0], (zn.y ?? 0) + 1.62 * s + 0.2, p[1], 0, 0.22);
    };
    // 교실(서향): 선생님은 칠판 앞에 서서 아이들 쪽(동)을, 아이들은 자기 자리에 앉아 칠판 쪽(서 = 보건실 쪽)을 본다. 남은 자리 = '앉기'
    const sitSpot = (L, st) => hotspots.push({ kind: 'sit', x: st.sx ?? st.x, z: st.sz ?? st.z + 0.5, y: L.y, r: 0.75, label: '의자에 앉기', yaw: L.face === 3 ? -Math.PI / 2 : Math.PI });
    Object.entries(SCHOOL.people).forEach(([cls, info]) => {
      const zn = zoneOf(cls); if (!zn) return;
      const L = seatsOf[cls];
      if (!L) { place(zn, cls + ' 선생님', info.t, 1.1); info.s.forEach(([nm, sx]) => place(zn, nm, sx, 1)); return; }
      person(L.teacher.x, L.y, L.teacher.z, info.t, 1.1, L.tFace ?? 2);
      sign(cls + ' 선생님', L.teacher.x, L.y + 1.62 * 1.1 + 0.2, L.teacher.z, 0, 0.22);
      info.s.forEach(([nm, sx], i) => {
        const st = L.seats[i]; if (!st) { place(zn, nm, sx, 1); return; }
        person(st.x, L.y, st.z, sx, 1, L.face ?? 0, true);
        sign(nm, st.x, L.y + 1.74, st.z, 0, 0.22);
      });
      L.seats.slice(info.s.length).forEach(st => sitSpot(L, st));
    });
    Object.entries(seatsOf).forEach(([nm, L]) => { if (!SCHOOL.people[nm]) L.seats.forEach(st => sitSpot(L, st)); });
    const FIXED = { '급식선생님': [HX - 0.95, SC - 0.4, 1] };   // 배식창 뒤(조리실)에서 홀을 본다
    Object.entries(SCHOOL.staff).forEach(([room, list]) => {
      const zn = zoneOf(room); if (!zn) return;
      list.forEach(([nm, sx, sz]) => {
        const f = FIXED[nm];
        if (f) { person(f[0], 0, f[1], sx, 1.1, f[2]); sign(nm, f[0], 1.62 * 1.1 + 0.2, f[1], 0, 0.22); }
        else place(zn, nm, sx, sz === 'small' ? 0.8 : 1.1);
      });
    });
  }

  buildPlinths();   // 감사 전에 — 띠도 감사 대상
  // ================= 감사 + 병합 =================
  {
    // PERF-LOAD(09-26): 예전 이중 루프(상자 7천 → 2,450만 쌍)가 buildWorld 본문(너무 커서 최적화되지 않는 함수)에서 돌아 로드 1.7초(크롬북 ≈6초)였다.
    //  판정식(sm·ov, z → x → y 순)과 결과 순서(i, j 오름차순)는 그대로 두고 후보 쌍만 고른다: 면 좌표 1cm 칸(EPS 4mm < 1cm → 이웃 칸까지)
    //  + 그 축과 함께 겹쳐야 하는 가로 구간(겹침 > 0.02) 쓸기. 작은 함수(IIFE)라 최적화된다(≈8ms). 인공 결함 10판(쌍 430~1,980·NaN·무한·뒤집힌 상자)으로 예전 식과 같음 확인.
    const EPS = 0.004, faults = (() => {
      const N = allBoxes.length, hit = new Map(), V = {};   // V = 좌표 6개를 한 줄 배열로(같은 값 — 정렬·쓸기에서 빠르게)
      for (const k of ['x0', 'x1', 'y0', 'y1', 'z0', 'z1']) { const a = V[k] = new Float64Array(N); for (let i = 0; i < N; i++) a[i] = allBoxes[i][k]; }
      const ov = (a0,a1,b0,b1) => Math.min(a1,b1) - Math.max(a0,b0) > 0.02, sm = (p,q) => Math.abs(p-q) < EPS;
      const judge = (A, Bb) => ((sm(A.z0,Bb.z0)||sm(A.z1,Bb.z1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) ? 'z'
        : ((sm(A.x0,Bb.x0)||sm(A.x1,Bb.x1)) && ov(A.z0,A.z1,Bb.z0,Bb.z1) && ov(A.y0,A.y1,Bb.y0,Bb.y1)) ? 'x'
        : ((sm(A.y0,Bb.y0)||sm(A.y1,Bb.y1)) && ov(A.x0,A.x1,Bb.x0,Bb.x1) && ov(A.z0,A.z1,Bb.z0,Bb.z1)) ? 'y' : null;
      for (const [c, u0, u1] of [['z0','x0','x1'], ['z1','x0','x1'], ['x0','z0','z1'], ['x1','z0','z1'], ['y0','x0','x1'], ['y1','x0','x1']]) {
        const C = V[c], U0 = V[u0], U1 = V[u1], bk = new Map();   // 면 좌표 1cm 칸 → 상자 번호(좌표가 NaN·무한이면 sm이 늘 거짓 — 뺀다. 가로 구간이 NaN이면 ov가 늘 거짓)
        for (let i = 0; i < N; i++) { const k = Math.floor(C[i] / 0.01); if (!isFinite(k) || U0[i] !== U0[i] || U1[i] !== U1[i]) continue; let a = bk.get(k); if (!a) bk.set(k, a = []); a.push(i); }
        for (const [k, a] of bk) { const n9 = bk.get(k + 1), L = n9 ? a.concat(n9) : a; if (L.length < 2) continue;
          L.sort((p, q) => U0[p] - U0[q]);
          for (let s = 0; s < L.length; s++) { const e = U1[L[s]];
            for (let t = s + 1; t < L.length && U0[L[t]] <= e; t++) { const i = Math.min(L[s], L[t]), j = Math.max(L[s], L[t]), key = i * N + j;
              if (!hit.has(key)) { const ax = judge(allBoxes[i], allBoxes[j]); if (ax) hit.set(key, [i, j, ax]); } } } }
      }
      return [...hit.keys()].sort((p, q) => p - q).map(q => hit.get(q));
    })();
    if (faults.length) {
      const fmt = b9 => '[' + [b9.x0,b9.x1,b9.y0,b9.y1,b9.z0,b9.z1].map(v=>+v.toFixed(2)).join(',') + ']';
      faults.slice(0, 30).forEach(([i,j,ax]) => console.error('헌법③ ' + ax + ' A=' + fmt(allBoxes[i]) + ' B=' + fmt(allBoxes[j])));
      console.error('헌법③ 위반 총 ' + faults.length + '쌍 — 수정 전 커밋 금지.');
    } else console.log('헌법③ 감사: 동일평면 겹침 0');
  }
  // 바닥 높이(검사·NS-RAISE용): 건물 안 = 그 바닥, 밖 = 지형 · UPPER = 서관 2층 바닥
  const FLOORS = [[fx0, fx1, fz0, fz1, 0], [EN.x[0], EN.x[1], fz1, EN.z[1], 0], [wx0, wx1, wz0, wz1, 0], [kx0, kx1, kz0, kz1, 0],
    [CL.x[0], CL.x[1], CL.z[0], CL.z[1], 0], [LC.x[0], LC.x[1], LC.z[0], LC.z[1], 0], [ex0, ex1, ez0, ez1, 0],
    [LC.x[1], ex1 + 0.15, ez1, fz0, COURT], [gx0, gx1, gz0, gz1, GYF], [G.annex.x[0], G.annex.x[1], G.annex.z[0], G.annex.z[1], GYF]];
  const baseAt = (x, z) => { for (const [a, b, c, d, y] of FLOORS) if (x >= a && x <= b && z >= c && z <= d) return y; return terrainAt(x, z); };
  const UPPER = [wx0, wx1, wz0, wz1, FH + 0.3];
  // 상자가 놓인 층 바닥: 서관 위 2층 상자 = 2층 바닥, 나머지 = baseAt(가운데) — main.js gndOf와 같은 규칙
  const floorOf = b => (b.y0 >= UPPER[4] - 0.15 && b.x0 > UPPER[0] - 0.6 && b.x1 < UPPER[1] + 0.6 && b.z0 > UPPER[2] - 0.6 && b.z1 < UPPER[3] + 0.6) ? UPPER[4] : baseAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
  // ================= NS-RAISE(MAP-HEALTH-1 · 09-24) — 올라서기 금지 무력화 막기 =================
  // 건강 검진 실측: NS(1.6) 상자 25개가 옆의 낮은 딛을 곳(벤치·계단·턱·비탈 계단)을 밟고 점프하면 윗면에 올라섰다
  //   (점프 도달 = 발+1.52 — 딛을 곳이 0.1만 높아도 1.6을 넘는다: 개수대·피크닉 탁자·난간·마당 경계 등).
  // 규칙: NS 상자(+ 높이 2.6 이하 nc 막이 — 계단 난간 토막 등)마다 1m 안의 '올라설 수 있는'(nc 아닌) 상자 중
  //   윗면이 NS 윗면-1.55보다 높은 것의 최고 윗면 m → y1 = m + 1.6. 보이지 않는 윗부분만 늘어난다(nc = 카메라 무시).
  //   새로 만드는 NS에도 자동 적용 — 구간별로 따로 고치지 않는다. 울타리·경계 막이(nc·3m 이상)는 건드리지 않는다.
  // 막이 3개(리뷰 09-24 — 합치면 다른 구역 상자가 망가지던 것: 매단 TV 머리 막이가 2층 슬래브를 뚫고 2층 바닥에 0.4m 턱):
  //   ① 매단 상자(밑을 받치는 층 바닥·nc 아닌 윗면보다 0.6 넘게 뜬 것 — TV·게시판 막이 등)는 건너뛴다.
  //   ② 새 y1 ≤ 발자국 위 가장 낮은 충돌 상자 밑면(천장·슬래브·지붕) − 0.01. (y0 + 2.6 상한은 쓰지 않는다 — 운동장 NS가
  //      1m 안 1.45m 턱보다 낮아져 무력화 4곳이 되살아났다. 위가 트인 곳은 m < 원래 y1이라 늘어나도 +1.6 안쪽.)
  //   ③ 딛을 곳 d = 층 바닥에서 점프로 닿는 윗면만(d.y1 − floorOf(d) ≤ 1.52) — 칠판 윗면(2.5) 같은 것은 세지 않는다.
  (() => { const R9 = 1.0, JUMP = 1.52, HANG = 0.6;   // PERF-LOAD: 작은 함수(IIFE)로 — buildWorld 본문은 너무 커서 최적화되지 않는다(50 → 수 ms)
    const fp = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.02 && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > 0.02;   // 발자국 겹침
    const solid = colliders.filter(d => !d.nc), stand = solid.filter(d => d.y1 - floorOf(d) <= JUMP);
    // PERF-LOAD: 딛을 곳·받침 후보를 8m 칸에서만 — 모으는 값이 최댓값·최솟값뿐이라 순서·중복과 무관(결과 같음). 좌표가 유한하지 않거나 뒤집힌 상자는 늘 후보, 그런 c는 전부 훑음
    const ok4 = b => isFinite(b.x0) && isFinite(b.x1) && isFinite(b.z0) && isFinite(b.z1) && b.x0 <= b.x1 && b.z0 <= b.z1;
    const ncell = (b, e) => (Math.floor((b.x1 + e) / 8) - Math.floor((b.x0 - e) / 8) + 1) * (Math.floor((b.z1 + e) / 8) - Math.floor((b.z0 - e) / 8) + 1);   // 걸치는 8m 칸 수
    const CMAX = 4096;   // 칸 수 상한(occ_merge 로딩 리뷰): 아주 큰 상자(수 km)는 칸마다 넣지 않고 odd(늘 후보)로 · 그런 c는 전부 훑음 — 결과 같음, 빌드가 멈추지 않게
    const cells = L => { const H = new Map(), odd = []; for (const d of L) { if (!ok4(d) || ncell(d, 0) > CMAX) { odd.push(d); continue; }
        for (let gx = Math.floor(d.x0 / 8); gx <= Math.floor(d.x1 / 8); gx++) for (let gz = Math.floor(d.z0 / 8); gz <= Math.floor(d.z1 / 8); gz++) { const k = gx * 4096 + gz; let a = H.get(k); if (!a) H.set(k, a = []); a.push(d); } }
      return { H, odd, all: L }; };
    const near = (G, c, e) => { if (!ok4(c) || ncell(c, e) > CMAX) return G.all; const out = G.odd.slice();
      for (let gx = Math.floor((c.x0 - e) / 8); gx <= Math.floor((c.x1 + e) / 8); gx++) for (let gz = Math.floor((c.z0 - e) / 8); gz <= Math.floor((c.z1 + e) / 8); gz++) { const a = G.H.get(gx * 4096 + gz); if (a) for (const d of a) out.push(d); }
      return out; };
    const SG = cells(solid), TG = cells(stand);
    for (const c of colliders) { if (!c.ns && !(c.nc && c.y1 - c.y0 <= 2.6)) continue;
      let sup = floorOf(c), ceil9 = 1e9;
      for (const d of near(SG, c, 0)) { if (!fp(c, d)) continue;
        if (d.y1 <= c.y0 + 0.02) { if (d.y1 > sup) sup = d.y1; } else if (d.y0 >= c.y1 - 0.01 && d.y0 < ceil9) ceil9 = d.y0; }
      if (c.y0 > sup + HANG) continue;                                                   // ① 매단 상자
      let m = -1e9;
      for (const d of near(TG, c, R9)) { if (d.y1 <= c.y1 - 1.55 || d.y1 >= c.y1) continue;   // ③ stand = 점프로 닿는 윗면
        if (d.x1 < c.x0 - R9 || d.x0 > c.x1 + R9 || d.z1 < c.z0 - R9 || d.z0 > c.z1 + R9) continue;
        if (d.y1 > m) m = d.y1; }
      if (m === -1e9) continue;
      const y9 = Math.min(m + 1.6, ceil9 - 0.01);                                        // ② 천장·슬래브 밑
      if (y9 > c.y1) c.y1 = y9; } })();
  const grid = new Map();
  colliders.forEach((b, i) => {
    for (let gx2 = Math.floor(b.x0/8); gx2 <= Math.floor(b.x1/8); gx2++)
      for (let gz2 = Math.floor(b.z0/8); gz2 <= Math.floor(b.z1/8); gz2++) {
        const k = gx2 + ':' + gz2;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(i);
      }
  });
  let glassMesh = null;
  if (glassPos.length) {   // 창 유리 — 반투명 한 덩어리(밤엔 main.js가 따뜻하게 빛나게 한다)
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glassPos), 3));
    gg.computeVertexNormals(); gg.computeBoundingSphere();
    const gm = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: 0xa9d4e4, transparent: true, opacity: 0.32, depthWrite: false }));
    gm.matrixAutoUpdate = false; gm.renderOrder = 2; scene.add(gm); glassMesh = gm;
  }
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  // PERF-LOAD: 비인덱스 청크 법선 — three computeVertexNormals(면마다 cb×ab → Float32 저장 → 정점마다 정규화 → Float32)와 같은 식·같은 순서(값이 같다), Vector3 호출 없이
  const flatNormals = g => { const P = g.attributes.position.array, N = new Float32Array(P.length);
    for (let i = 0; i + 8 < P.length; i += 9) { const bx = P[i + 3], by = P[i + 4], bz = P[i + 5], cbx = P[i + 6] - bx, cby = P[i + 7] - by, cbz = P[i + 8] - bz, abx = P[i] - bx, aby = P[i + 1] - by, abz = P[i + 2] - bz;
      const x = Math.fround(cby * abz - cbz * aby), y = Math.fround(cbz * abx - cbx * abz), z = Math.fround(cbx * aby - cby * abx), s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
      N[i] = N[i + 3] = N[i + 6] = x * s; N[i + 1] = N[i + 4] = N[i + 7] = y * s; N[i + 2] = N[i + 5] = N[i + 8] = z * s; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); };
  // PERF-LOAD: 경계 상자·구 — three computeBoundingBox(min·max)·computeBoundingSphere(상자 가운데 → 최대 거리²의 제곱근)와 같은 식을 한 번에. 비었거나 NaN이면 three 것 그대로(경고 문구 포함)
  const bounds = (g, box) => { const P = g.attributes.position.array; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i + 2 < P.length; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z); }
    if (!(x0 <= x1 && y0 <= y1 && z0 <= z1)) { g.computeBoundingSphere(); if (box) g.computeBoundingBox(); return; }
    const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5; let r2 = 0;
    for (let i = 0; i + 2 < P.length; i += 3) { const dx = cx - P[i], dy = cy - P[i + 1], dz = cz - P[i + 2]; r2 = Math.max(r2, dx * dx + dy * dy + dz * dz); }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
    if (box) g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)); };
  for (const ch of chunks.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    flatNormals(g); bounds(g, true);
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false; m.userData.st = true;   // OCC-CULL: main.js가 매 프레임 상자(AABB)로 절두체 검사
    scene.add(m);
  }
  buildSigns();
  // 무늬 층 병합(PATTERN-1): 무늬마다 캔버스 한 장(월드 좌표 반복) + 메시 하나
  for (const [kind, P] of PAT) {
    const [, N, basic, draw] = PATDEF[kind];
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    let seed = 17; for (const ch of kind) seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
    draw(cv.getContext('2d'), N, seeded(seed));
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(P.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, basic ? new THREE.MeshBasicMaterial({ map: tex, vertexColors: true }) : new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }));
    m.matrixAutoUpdate = false; scene.add(m);
  }
  if (lampPos.length) {   // 조명 — 한 메시(조명 무시 재질)
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lampPos, 3)); lg.computeVertexNormals(); lg.computeBoundingSphere();
    const lm = new THREE.Mesh(lg, lampMat); lm.matrixAutoUpdate = false; scene.add(lm);
  }
  if (railPos.length) {   // 옥상 난간 — 흰 가로대·세로살 무늬(투명 바탕) × 은회색, 전부 한 메시
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g9 = cv.getContext('2d');
    g9.fillStyle = '#ffffff'; g9.fillRect(0, 0, 128, 6); g9.fillRect(0, 54, 128, 4);
    for (let x = 0; x < 128; x += 16) g9.fillRect(x, 6, 3, 48);
    g9.fillRect(0, 0, 6, 64);
    const rt = new THREE.CanvasTexture(cv); rt.wrapS = THREE.RepeatWrapping; rt.colorSpace = THREE.SRGBColorSpace; rt.anisotropy = 4;
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(railUV, 2));
    rg.computeVertexNormals(); rg.computeBoundingSphere();
    const rm = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: rt, color: 0xc9ced3, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    rm.matrixAutoUpdate = false; rm.renderOrder = 1; scene.add(rm);
  }
  if (fencePos.length) {  // 철망 — 흰 격자 무늬 × 정점색(초록·연두·흰), 판 전부 한 메시
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g9 = cv.getContext('2d');
    g9.strokeStyle = 'rgba(255,255,255,0.95)'; g9.lineWidth = 3;
    g9.beginPath(); g9.moveTo(0, 0); g9.lineTo(64, 64); g9.moveTo(64, 0); g9.lineTo(0, 64); g9.stroke();
    const ft = new THREE.CanvasTexture(cv); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.colorSpace = THREE.SRGBColorSpace;
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fencePos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fenceUV, 2)); fg.setAttribute('color', new THREE.Float32BufferAttribute(fenceCol, 3));
    fg.computeVertexNormals(); fg.computeBoundingSphere();
    const fm = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: ft, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    fm.matrixAutoUpdate = false; fm.renderOrder = 1; scene.add(fm);
  }
  // 디테일 층 병합 — near 청크는 main.js가 거리로 켜고 끈다(DETAIL_FAR)
  const details = [];
  // OCC-CULL: 무거운 실내 청크(삼각형 > 5000 — 사람·책상이 가득한 교실)는 방(구역) 단위로 한 번 더 나눈다 — 옆 교실이 벽 뒤면 통째로 빠지게.
  //  삼각형 무게중심이 든 구역(그 높이 아래 가장 위 구역)끼리 묶고, 작은 묶음(< 600)은 나머지에 둔다(드로우콜 억제)
  const splitRooms = ch => { const T = ch.pos.length / 9; if (!ch.inside || T <= 5000) return [ch];
    let ax0 = 1e9, ax1 = -1e9, az0 = 1e9, az1 = -1e9; for (let i = 0; i < ch.pos.length; i += 3) { const x = ch.pos[i], z = ch.pos[i + 2]; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (z < az0) az0 = z; if (z > az1) az1 = z; }
    const ZC = zones.filter(q => q.x1 > ax0 && q.x0 < ax1 && q.z1 > az0 && q.z0 < az1), key = new Int16Array(T), cnt = new Map();
    for (let t = 0; t < T; t++) { const o = t * 9, x = (ch.pos[o] + ch.pos[o + 3] + ch.pos[o + 6]) / 3, y = (ch.pos[o + 1] + ch.pos[o + 4] + ch.pos[o + 7]) / 3, z = (ch.pos[o + 2] + ch.pos[o + 5] + ch.pos[o + 8]) / 3;
      let best = -1, by = -1e9; for (let k = 0; k < ZC.length; k++) { const q = ZC[k]; if (x >= q.x0 && x < q.x1 && z >= q.z0 && z < q.z1 && q.y <= y + 0.5 && q.y > by) { by = q.y; best = k; } }
      key[t] = best; cnt.set(best, (cnt.get(best) || 0) + 1); }
    for (let t = 0; t < T; t++) if (cnt.get(key[t]) < 600) key[t] = -1;
    const out = new Map(); for (let t = 0; t < T; t++) { let o = out.get(key[t]); if (!o) { o = { ...ch, pos: [], col: [] }; out.set(key[t], o); }
      for (let k = t * 9; k < t * 9 + 9; k++) { o.pos.push(ch.pos[k]); o.col.push(ch.col[k]); } }
    return [...out.values()]; };
  for (const [M, far] of [[DNEAR, false]]) for (const ch0 of M.values()) for (const ch of splitRooms(ch0)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    flatNormals(g); bounds(g, !far);
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
    if (!far) { details.push({ mesh: m, cx: ch.cx, cz: ch.cz, inside: ch.inside, bi: ch.bi, fl: ch.fl, box: g.boundingBox }); }
  }
  details.brect = BRECT; details.wing = 2; details.FH = FH;   // OCC-CULL: main.js 가림 컬링이 건물 칸(BRECT 순서 — 2 = 서관, 2층이 있는 유일한 동)·층고를 읽는다
  for (const g of CYLC.values()) g.dispose(); CYLC.clear();   // 원기둥 캐시는 빌드 동안만(dGeo가 정점을 청크로 복사했다 — 더 안 씀 · 메모리)
  return { colliders, grid, zones, doors, allBoxes, hotspots, details, visRods, soft: softVols, TERR_Z, terrainAt, baseAt, UPPER, bounds: SCHOOL.boundary, glassMesh, flag: flagMesh };
}
