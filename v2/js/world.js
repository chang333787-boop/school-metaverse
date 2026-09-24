// ============================================================
// v2 월드 — 완성판. 헌법:
//  ① 부재 최소 0.15m(가는 봉·틀 금지 — 색면으로) ② 트림 저대비 ③ 동일평면 겹침 금지(빌드 감사)
//  ④ 16m 청크 병합 ⑤ 충돌 AABB 전용 ⑥ 예산 dc≤300·sim≤1ms
// ============================================================
import * as THREE from 'three';
import { SCHOOL } from './layout.js?v=4';   // LAYOUT-3 실측 배치(v1의 js/data.js는 참고용으로 그대로)

// 바깥 지형 높이(main.js 물리·검사도 같은 함수를 쓴다): 앞뜰·체육관 대지 = yard, 그 밖(둔덕 아래·운동장) = field
const TRN = SCHOOL.terrain;
export function terrainAt(x, z) { return (z < TRN.TERR_Z || (x < TRN.westX && z < TRN.westZ)) ? TRN.yard : TRN.field; }

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
  function noStand(c, min = 1.6) { c.y1 = Math.max(c.y1, c.y0 + min); c.nc = true; return c; }
  function addBox(w, h, d, hex, cx, baseY, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.1499) throw new Error('헌법① 위반 <0.15m: ' + [w, h, d]);   // 0.1499=부동소수 오차 허용(0.15는 합법)
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2, wall: !!opt.wall });   // wall=벽 조각(문이 숨는 곳)
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
  const insideBuilding = (x, z) => BRECT.some(([a, b, c, d]) => x > a + 0.2 && x < b - 0.2 && z > c + 0.2 && z < d - 0.2);
  function dChunk(far, cx, cz) {
    if (far) return chunkOf(cx, cz);   // 큰 덩어리(나무·차·울타리 기둥)는 건물 청크에 그대로 합친다 — 같은 재질이라 드로우콜이 늘지 않는다
    const inside = insideBuilding(cx, cz), key = (inside ? 'i' : 'o') + Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = DNEAR.get(key);
    if (!ch) { ch = { pos: [], col: [], cx: (Math.floor(cx / CHUNK) + 0.5) * CHUNK, cz: (Math.floor(cz / CHUNK) + 0.5) * CHUNK, inside }; DNEAR.set(key, ch); }
    return ch;
  }
  // geo(비인덱스로 변환)를 행렬 m으로 옮겨 붙인다. 면 방향으로 명암(윗면 1·옆면 .9·아랫면 .62 — addBox와 같은 규칙)
  function dGeo(geo, m, hex, opt = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position;
    const ch = opt.at ? chunkOf(opt.at[0], opt.at[1]) : dChunk(!!opt.far, _dv.setFromMatrixPosition(m).x, _dv.z);   // at = 이 청크에 합침(넓게 퍼진 먼 산을 한 덩이로 — 드로우콜)
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
  function dCyl(rt, rb, h, hex, cx, y0, cz, opt = {}) {
    const g = new THREE.CylinderGeometry(rt, rb, h, opt.seg || 7, 1);
    g.translate(0, h / 2, 0);
    const r = opt.rot || [0, 0, 0];
    _dm.compose(_dv.set(cx, y0, cz), _dq.setFromEuler(_de.set(r[0], r[1], r[2])), _ds.set(1, 1, 1));
    dGeo(g, _dm, hex, opt); g.dispose();
  }
  // 둥근 덩어리(정이십면체 1분할 = 80면). 잎·머리숱 같은 부드러운 덩어리에. 감사 대상 아님
  function dBlob(sx, sy, sz, hex, cx, cy, cz, opt = {}) {
    _dm.compose(_dv.set(cx, cy, cz), _dq.setFromEuler(_de.set(0, opt.ry || 0, 0)), _ds.set(sx, sy, sz));
    dGeo(opt.chunky ? BLOB0 : BLOB1, _dm, hex, opt);
  }
  // 두 점 사이 봉(쇠파이프·사슬·그물). seg 6. 감사 대상 아님(곡면)
  const ROD = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0), _up = new THREE.Vector3(0, 1, 0), _rd = new THREE.Vector3();
  const visRods = [];   // 물리 검사용: 봉·원기둥의 AABB(몸이 뚫고 지나가는지 SD2.solidCheck가 본다)
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
    for (const p of plinths) {
      const bb = p.ax === 'x' ? { z0: p.o - 0.02, z1: p.o + 0.02 } : { x0: p.o - 0.02, x1: p.o + 0.02 };
      const cut = [];
      for (const b of allBoxes) {
        if (b.y0 >= 0.45 || b.y1 <= 0) continue;
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
      if (g.win) { const fw = (opt.ext ?? hex === WALL) ? (opt.face ?? 1) : 0; glassPane(ax, g1 - g0, Math.min(dh, h) - sl, (g0 + g1)/2, y0 + sl, line); winFrame(ax, g0, g1, y0 + sl, y0 + Math.min(dh, h), line, fw, g.frame, g.noLedge);
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
  function glassPane(ax, len, hh, c, y, line) {
    const w = ax === 'x' ? len : 0.16, d = ax === 'x' ? 0.16 : len, cx = ax === 'x' ? c : line, cz = ax === 'x' ? line : c;
    colliders.push({ x0: cx - w/2, x1: cx + w/2, y0: y, y1: y + hh, z0: cz - d/2, z1: cz + d/2 });
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
  const signCanvas = new Map(), signList = [];
  // sty = { bg, fg } — 기본은 파란 팻말. 현관 아치 나무 현판처럼 색이 다른 글자판(09-24)
  function sign(text, x, y, z, rotY = 0, h = 0.42, sty = null) {
    const key = text + (sty ? '|' + sty.bg + sty.fg : '');
    let c = signCanvas.get(key);
    if (!c && text === EXIT_KEY) { c = exitCanvas(); signCanvas.set(key, c); }
    if (!c && text === FLAG_KEY) { c = taegukCanvas(); signCanvas.set(key, c); }
    if (!c) {
      c = document.createElement('canvas'); const g2 = c.getContext('2d');
      g2.font = '900 84px sans-serif';
      c.width = Math.ceil(g2.measureText(text).width) + 56; c.height = 128;
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
  function tree(x, z, s = 1) {
    const y = tY(z, x), h = hash2(x, z), ry = h * Math.PI * 2, F = { far: true };
    colliders.push({ x0: x-0.25*s, x1: x+0.25*s, y0: y, y1: y+12, z0: z-0.25*s, z1: z+0.25*s });
    dCyl(0.13*s, 0.22*s, 2.3*s, 0x6d4e32, x, y, z, F);
    dCyl(0.05*s, 0.08*s, 0.9*s, 0x6d4e32, x + Math.cos(ry)*0.1*s, y + 1.5*s, z + Math.sin(ry)*0.1*s, { far: true, rot: [0.7*Math.sin(ry), 0, 0.7*Math.cos(ry)] });
    dCyl(0.05*s, 0.08*s, 0.8*s, 0x6d4e32, x - Math.cos(ry)*0.1*s, y + 1.7*s, z - Math.sin(ry)*0.1*s, { far: true, rot: [-0.7*Math.sin(ry), 0, -0.7*Math.cos(ry)] });
    const G = [0x3f7a3f, 0x4d8b4d, 0x5c9a4f];
    const cl = [[0, 2.75, 0, 1.3, 1.0], [0.8, 2.45, 0.2, 0.9, 0.8], [-0.7, 2.5, -0.3, 0.95, 0.8], [0.15, 3.45, -0.15, 0.95, 0.8], [-0.2, 2.35, 0.75, 0.8, 0.7]];
    cl.forEach(([ox, oy, oz, r, sy], i) => {
      const c = Math.cos(ry), sn = Math.sin(ry), wx = x + (ox*c - oz*sn)*s, wz = z + (ox*sn + oz*c)*s;
      dBlob(r*s, r*sy*s, r*s, G[(i + Math.floor(h*3)) % 3], wx, y + oy*s, wz, { far: true, ry: ry + i, jitter: 0.12 });
    });
  }

  // 배경 나무(위성 나무 무리용 — 가벼운 모양: 5각 줄기 + 둥근 잎 두 덩어리 ≈ 70삼각형). 밑동 충돌 12m(나무 위에 못 올라가게)
  function bgTree(x, z, s = 1) {
    const y = tY(z, x), h = hash2(x, z);
    colliders.push({ x0: x - 0.3*s, x1: x + 0.3*s, y0: y, y1: y + 12, z0: z - 0.3*s, z1: z + 0.3*s });
    dCyl(0.14*s, 0.22*s, 2.6*s, 0x6d4e32, x, y, z, { far: true, seg: 5 });
    dBlob(1.6*s, 1.35*s, 1.6*s, [0x3f7a3f, 0x4d8b4d, 0x467f44][Math.floor(h*3) % 3], x, y + 3.2*s, z, { far: true, chunky: true, ry: h*6, jitter: 0.14 });
    dBlob(1.1*s, 0.95*s, 1.1*s, 0x5c9a4f, x + 0.5*s, y + 4.1*s, z - 0.3*s, { far: true, chunky: true, ry: h*9, jitter: 0.14 });
  }
  // 침엽수(DETAIL-1): 굵은 줄기 + 8각 원뿔 4단(위로 갈수록 밝은 초록·단마다 비틀어 결이 엇갈리게)
  function pine(x, z, s = 1) {
    const y = tY(z, x), ry = hash2(x, z) * Math.PI * 2;
    colliders.push({ x0: x-0.55*s, x1: x+0.55*s, y0: y, y1: y+12, z0: z-0.55*s, z1: z+0.55*s });
    dCyl(0.28*s, 0.5*s, 3.6*s, 0x6d4e32, x, y, z, { far: true });
    [[2.9, 2.6, 2.8, 0x2f6b46], [4.8, 2.1, 2.5, 0x3a7d52], [6.6, 1.6, 2.2, 0x468c5c], [8.2, 1.0, 1.9, 0x4f9663]]
      .forEach(([yy, r, h, c], i) => dCyl(0, r*s, h*s, c, x, y + yy*s, z, { far: true, seg: 8, rot: [0, ry + i*0.4, 0] }));
  }
  // 차(DETAIL-5): 차체(바닥 25cm 띄움)·바퀴 4·짙은 유리 캐빈·지붕·전조등·후미등. 길이 방향 = z. 충돌은 예전 상자 그대로
  function car(cx, cz, body, roof, y = 0, L = 4.0, W = 1.8) {
    colliders.push(noStand({ x0: cx - W/2, x1: cx + W/2, y0: y, y1: y + 1.25, z0: cz - L/2, z1: cz + L/2 }));
    const F = { far: true };
    dBox(W, 0.5, L, body, cx, y + 0.25, cz, F);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => dCyl(0.32, 0.32, 0.22, 0x26282c, cx + sx*(W/2 - 0.08), y + 0.32, cz + sz*(L/2 - 0.75), { far: true, seg: 10, rot: [0, 0, Math.PI/2] }));
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
  function teacherDesk(cx, y, cz, rot = 0) {                        // 1.2×0.85×0.6 — 상판·서랍장(손잡이 3)·옆판
    colliders.push(noStand(rCol(rot, cx, cz, 0.6, 0.3, y, y+0.85)));
    rBox(rot, 1.24, 0.05, 0.64, 0x8a5a3b, cx, y+0.8, cz, 0, 0);
    rBox(rot, 0.42, 0.8, 0.56, 0x7a4e33, cx, y, cz, -0.36, 0);
    rBox(rot, 0.06, 0.8, 0.56, 0x7a4e33, cx, y, cz, 0.55, 0);
    [0.18, 0.43, 0.66].forEach(hy => rBox(rot, 0.16, 0.03, 0.03, 0xd8c9a8, cx, y+hy, cz, -0.36, 0.295));
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
    tileC:  [1.2, 256, false, (g, N, R) => tiles(g, N, 2, ['#efe6d1', '#ebe1c9', '#f2ead8'], '#c6b89b', 3, R, 0.08)],   // 현관 홀 크림 광택 60cm(영상 e_325~338)
    tileW:  [0.9, 256, false, (g, N, R) => { tiles(g, N, 2, ['#eeebe4', '#eae6dc', '#f1eee8'], '#c9c2b2', 3, R, 0.05); specks(g, N, 160, ['#cfc9bd', '#bdb6a8'], 0.5, 1.1, R); }],   // 본관 복도 흰 45cm(영상 a_457~502)
    tileG:  [0.8, 256, false, (g, N, R) => { tiles(g, N, 2, ['#dad7d0', '#d5d2ca', '#dedbd4'], '#b3aea3', 3, R, 0.04); specks(g, N, 900, ['#9c978d', '#f4f2ee', '#7d7870', '#c9b9a0'], 0.5, 1.3, R); }],   // 로비·세로복도 테라초 40cm(c_344~358)
    ttile:  [0.8, 256, false, (g, N, R) => tiles(g, N, 4, ['#dfe6ea', '#dbe3e8', '#e4eaee'], '#b7c1c7', 2, R, 0.03)],   // 화장실 20cm
    wood:   [1.2, 256, false, (g, N, R) => planks(g, N, 12, ['#c9935a', '#d19c62', '#c28a52', '#d6a56b', '#cc975e'], '#8a5c34', R, 70, 190)],   // 교실 마루(영상 a_487~493)
    gymw:   [2.4, 256, false, (g, N, R) => planks(g, N, 16, ['#e2b97f', '#dcb074', '#e7c28b', '#d8aa6e'], '#a07448', R, 110, 250)],     // 체육관 단풍나무 마루
    ecor:   [1.6, 256, false, (g, N, R) => { g.fillStyle = '#d9c7a0'; g.fillRect(0, 0, N, N); blotch(g, N, 40, ['#cfbb93', '#e2d2ae'], 8, 30, 0.25, R); specks(g, N, 500, ['#b9a47c', '#efe3c6'], 0.5, 1.1, R, 0.7); }],   // 동관 복도 장판(c_364~373)
    check:  [0.4, 128, false, (g, N) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b2b' : '#d9d7cf'; g.fillRect(i*32, j*32, 32, 32); } }],   // 전실 흑백 체크 매트(e_322~324)
    rmat:   [0.6, 128, false, (g, N) => { g.fillStyle = '#8c3232'; g.fillRect(0, 0, N, N); g.strokeStyle = '#4f8c66'; g.lineWidth = 7;
              for (let k = -N; k <= 2*N; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + N, N); g.moveTo(k, N); g.lineTo(k + N, 0); g.stroke(); } }],   // 현관 앞 빨강·초록 고무 매트
    gmat:   [0.8, 128, false, (g, N, R) => { g.fillStyle = '#55585d'; g.fillRect(0, 0, N, N); g.fillStyle = '#4a4d52'; for (let k = 0; k < N; k += 8) g.fillRect(0, k, N, 3); specks(g, N, 120, ['#6a6d72'], 0.5, 1, R); }],   // 구령대·포털 짙은 회색 고무 매트
    pave:   [1.6, 256, false, (g, N, R) => bond(g, N, 32, 16, ['#dcc89c', '#d8c292', '#e1cea6', '#d6c08e'], '#b3a17c', 1.5, R, 0.5, [0.18, ['#b8ad97', '#c98f72', '#8f8b82', '#d2ae62', '#a9b0b8']])],   // 보도블록(영상 f_132~186 — 베이지에 회색·붉은·짙은 블록 섞임)
    brick:  [1.2, 240, false, (g, N, R) => bond(g, N, 48, 24, ['#a9624c', '#b36c55', '#9c5a45', '#b9765e'], '#8a5446', 2, R)],   // 가운데 마당 적벽돌 포장
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
    mosaic: [1.2, 256, false, (g, N, R) => {                           // 구령대 정면 조각 타일(영상 u_285~291)
              const C = ['#e9a3a0', '#f0d27e', '#9fc8e6', '#b3d99f', '#d2b3e3', '#f4c49a', '#f7efe0', '#8fb8d8'], n = 6, s = N / n, J = [];
              for (let i = 0; i <= n; i++) { J[i] = []; for (let j = 0; j <= n; j++) J[i][j] = [i*s + (i % n ? (R() - 0.5) * s * 0.5 : 0), j*s + (j % n ? (R() - 0.5) * s * 0.5 : 0)]; }
              g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, N, N);
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = [J[i][j], J[i+1][j], J[i+1][j+1], J[i][j+1]]; g.fillStyle = pick(C, R); g.beginPath(); q.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); }
              g.strokeStyle = '#f5f2ea'; g.lineWidth = 4;
              for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = [J[i][j], J[i+1][j], J[i+1][j+1], J[i][j+1]]; g.beginPath(); q.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); } }],
    brickW: [1.2, 240, false, (g, N, R) => bond(g, N, 48, 16, ['#a5573d', '#b0624a', '#9a5038', '#b86c50'], '#d6ccbd', 2, R)],   // 적벽돌 벽(로비 서벽·체육관)
    siding: [1.2, 240, false, (g, N, R) => { for (let r = 0; r < 6; r++) { g.fillStyle = pick(['#a0a07f', '#9d9d7c', '#a3a383'], R); g.fillRect(0, r*40, N, 40); g.fillStyle = '#7f8064'; g.fillRect(0, r*40 + 37, N, 3); g.fillStyle = '#b4b596'; g.fillRect(0, r*40, N, 1); } }],   // 유치원 쪽 카키 사이딩(영상 g_111~117)
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
    stoneW: [1.6, 256, false, (g, N, R) => { g.fillStyle = '#8f8a80'; g.fillRect(0, 0, N, N); let y = 0;   // 체육관 대지 돌 옹벽(영상 g_081~090)
              while (y < N) { const h = 26 + R()*20; let x = -R()*40; while (x < N) { const w = 40 + R()*50; g.fillStyle = pick(['#a9a498', '#b7b2a6', '#9d988c', '#c1bcb0'], R); g.fillRect(x + 2, y + 2, w - 4, h - 4); x += w; } y += h; } }],
    teal:   [0.8, 128, false, (g, N, R) => { g.fillStyle = '#5b9d97'; g.fillRect(0, 0, N, N); specks(g, N, 500, ['#4c8a84', '#72b3ad'], 0.5, 1.2, R); }],   // 로비 문 밖 고무 바닥
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
  // 교실(서향 — 사용자 09-24 "우리는 다 보건실 쪽 방향을 보고 있어" · 영상 a_487~493 복도에서 들어가면 오른쪽 = 칠판):
  //   서벽 = 흰 칠판(알루미늄 테) + 위 태극기 액자 · 앞 창가 = 교사 책상 + 천장에 매단 TV · 동벽(뒤) = 흰 사물함 + 아이 그림 게시판 + 시계 · 창 아래 = 낮은 흰 수납장.
  //   아이들 책상 줄은 서쪽을 본다. xw·xe = 서·동벽 안쪽 면, zc = 복도(문) 쪽 벽 안쪽 면, zw = 창 쪽 벽 안쪽 면. opt.backGap = 동벽 문 자리[z0, z1](나래반→문서고)
  function westClass(name, xw, xe, zc, zw, y0, opt = {}) {
    const dz = Math.sign(zw - zc), zm = (zc + zw) / 2, depth = Math.abs(zw - zc), W = xe - xw, top = opt.top ?? 0xc9a06a;
    const bw = Math.min(3.6, depth - 2.4);
    dBox(0.04, 1.32, bw + 0.12, 0xaeb4ba, xw + 0.02, y0 + 0.79, zm);                 // 알루미늄 테
    dBox(0.03, 1.2, bw, 0xf3f5f4, xw + 0.055, y0 + 0.85, zm);                         // 흰 칠판
    dBox(0.09, 0.03, bw, 0xaeb4ba, xw + 0.085, y0 + 0.82, zm);                        // 마커 받침
    dBox(0.03, 0.5, 0.72, 0x5a4632, xw + 0.015, y0 + 2.2, zm);                        // 태극기 액자 틀(칠판 위 — 영상 a_489)
    sign(FLAG_KEY, xw + 0.042, y0 + 2.45, zm, Math.PI / 2, 0.4);
    hotspots.push({ kind: 'board', x: xw + 1.4, z: zm, y: y0, r: 2.0, label: '칠판에 낙서하기', bx: xw + 0.08, by: y0 + 1.45, bz: zm, ry: Math.PI / 2 });
    const tz = zw - dz * 1.3, tx = xw + 0.9;                                          // TV — 앞 창가 천장에 매닮(영상 a_487·a_490)
    dBox(0.07, 0.72, 1.28, 0x1e1f22, tx, y0 + 1.9, tz); dBox(0.03, 0.64, 1.18, 0x2a3a4a, tx + 0.05, y0 + 1.94, tz);
    dRod(tx, y0 + 2.62, tz, tx, y0 + 2.9, tz, 0.025, 0x9aa0a6);
    teacherDesk(xw + 1.3, y0, zw - dz * 1.3, 1); chair(xw + 0.72, y0, zw - dz * 1.3, -1, 0x3a4a5a, 1);
    // 창 아래 낮은 흰 수납장 · 뒤(동벽) 흰 사물함 + 아이 그림 게시판 + 시계
    lockerBank('x', xw + 0.3, xe - 0.6, zw, -dz, opt.sill ? opt.sill - 0.15 : 0.8, 2, 0xe9e6de, 0xf2efe8, 0xf7f5f0, true, y0);
    const za = Math.min(zc + dz * 0.3, zw - dz * 0.6), zb2 = Math.max(zc + dz * 0.3, zw - dz * 0.6);
    const segs = opt.backGap ? [[za, opt.backGap[0]], [opt.backGap[1], zb2]] : [[za, zb2]];
    segs.forEach(([u, v]) => { if (v - u < 0.6) return; lockerBank('z', u, v, xe, -1, 1.3, 3, 0xe9e6de, 0xf2efe8, 0xf7f5f0, true, y0);
      if (v - u > 1.4) greenBoard('z', u + 0.2, v - 0.2, xe, -1, y0 + 1.5, y0 + 2.4, 'kidsArt'); });
    const ck = opt.backGap ? (segs[1][0] + segs[1][1]) / 2 : zm;
    dCyl(0.17, 0.17, 0.04, 0xf5f3ec, xe - 0.02, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 16 });
    dCyl(0.02, 0.02, 0.05, 0x2a2a2a, xe - 0.045, y0 + 2.62, ck, { rot: [0, 0, Math.PI / 2], seg: 6 });
    // 아이들 책상: 줄 = x(칠판에서 동쪽으로), 칸 = z. 학생 수 + 빈자리 2
    const n = (SCHOOL.people[name]?.s.length ?? 4) + 2;
    const cols = Math.max(2, Math.min(4, Math.floor((depth - 2.2) / 1.4) + 1));
    const rows = Math.min(Math.max(1, Math.min(3, Math.floor((W - 4.1) / 1.7) + 1)), Math.ceil(n / cols));
    const order = [...Array(cols).keys()].sort((a, b) => Math.abs(a - (cols-1)/2) - Math.abs(b - (cols-1)/2) || a - b);
    const seats = [];
    for (let r = 0; r < rows; r++) for (const c of order) {
      if (seats.length >= n) break;
      const x = xw + 2.4 + r * 1.7, z = zm + (c - (cols-1)/2) * 1.4;
      studentDesk(x, y0, z, top, 0.7, 1);
      chair(x + 0.55, y0, z, 1, undefined, 1);
      seats.push({ x: x + 0.55, z, sx: x + 1.05, sz: z });
    }
    seatsOf[name] = { seats, y: y0, teacher: { x: xw + 1.3, z: zm - dz * 0.6 }, face: 3, tFace: 1 };
  }
  // 전정한 소나무(영상 f_132~186 앞뜰 — 굽은 줄기 + 납작한 구름 잎판). 밑동 충돌은 12m(나무 위에 못 올라가게)
  function prunedPine(x, z, s = 1) {
    const y = tY(z, x), R = seeded(Math.floor(Math.abs(x * 131 + z * 71)) + 7), F = { far: true };
    colliders.push({ x0: x - 0.2*s, x1: x + 0.2*s, y0: y, y1: y + 12, z0: z - 0.2*s, z1: z + 0.2*s });
    let px = x, py = y, pz = z, a = R() * 6.28;
    for (let k = 0; k < 3; k++) {
      const L = (0.75 + R()*0.35) * s, t = 0.28 + R()*0.2, dx = Math.cos(a), dz = Math.sin(a);
      dCyl(0.1*s*(1 - k*0.22), 0.13*s*(1 - k*0.22), L, 0x5e4a3a, px, py, pz, { far: true, rot: [t*dz, 0, -t*dx] });
      px += Math.sin(t) * dx * L; py += Math.cos(t) * L; pz += Math.sin(t) * dz * L;
      a += 1.2 + R() * 1.6;
    }
    const pads = 4 + Math.floor(R() * 3), PG = [0x4a8250, 0x55905a, 0x4c8752];
    for (let k = 0; k < pads; k++) {
      const h = (1.0 + k * (2.1 / pads)) * s, r = (0.82 - k * 0.09 + R() * 0.2) * s, ang = R() * 6.28, d = (k === pads - 1 ? 0.1 : 0.45 + R() * 0.55) * s;
      dBlob(r, r * 0.34, r * 0.85, PG[k % 3], x + Math.cos(ang) * d, y + h, z + Math.sin(ang) * d, F);
      dBlob(r * 0.7, r * 0.26, r * 0.6, 0x6aa362, x + Math.cos(ang) * d, y + h + r * 0.18, z + Math.sin(ang) * d, { far: true, ry: ang, jitter: 0.12 });
    }
  }
  // 둥근 회양목(앞뜰 화단) — 올라서기 금지
  function shrub(x, z, r = 0.6, hex = 0x4d8b4d) {
    const y = tY(z, x);
    colliders.push(noStand({ x0: x - r*0.85, x1: x + r*0.85, y0: y, y1: y + r*1.4, z0: z - r*0.85, z1: z + r*0.85 }));
    dBlob(r, r*0.78, r, hex, x, y + r*0.68, z, { far: true, ry: x, jitter: 0.1 });
  }
  // 다듬은 회양목 둔덕(앞뜰 — 영상 f_132~183: 폭 1.5~2m·높이 0.9m 넓적한 둥근 덩어리가 서로 닿게 줄지어) — 윗면 밝은 잎 한 겹. 올라서기 금지
  function mound(x, z, w = 1.7, h = 0.9, d = 1.4, hex = 0x4f8a45) {
    const y = tY(z, x), hh = hash2(x, z);
    colliders.push(noStand({ x0: x - w * 0.42, x1: x + w * 0.42, y0: y, y1: y + h, z0: z - d * 0.42, z1: z + d * 0.42 }));
    dBlob(w / 2, h * 0.62, d / 2, hex, x, y + h * 0.38, z, { far: true, ry: hh * 6, jitter: 0.1 });
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
      dBlob(r * 0.9, r * 0.22, r * 0.7, 0x76a45e, x + Math.cos(a) * d, y + h + r * 0.16, z + Math.sin(a) * d, { far: true, chunky: true, ry: a, jitter: 0.12 });
    }
  }
  // 층층 공 향나무(구령대 동쪽 3그루·앞뜰 — 영상 u_272·u_284·f_171·f_177: 줄기에 공 모양 덩어리 3~4개가 층층이, 키 3m 안팎)
  function ballJuniper(x, z, s = 1) {
    const y = tY(z, x), hh = hash2(x, z);
    colliders.push({ x0: x - 0.3 * s, x1: x + 0.3 * s, y0: y, y1: y + 12, z0: z - 0.3 * s, z1: z + 0.3 * s });
    dCyl(0.07 * s, 0.11 * s, 2.6 * s, 0x5e4a3a, x, y, z, { far: true, seg: 6 });
    [[0.62, 0.55, 0, 0], [0.5, 1.35, 0.28, 0.1], [0.4, 2.05, -0.2, -0.12], [0.3, 2.65, 0.05, 0.08]].forEach(([r, h, ox, oz], k) =>
      dBlob(r * s, r * 0.82 * s, r * s, [0x2f6a3a, 0x357242, 0x2b6236, 0x3a7a46][k], x + ox * s * (hh > 0.5 ? 1 : -1), y + h * s, z + oz * s, { far: true, ry: hh * 5 + k, jitter: 0.1 }));
  }
  // 바닥 나침반 무늬(현관 홀 — 영상 e_336~341): 캔버스 원판 한 장
  function compassRose(x, y, z, r) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.translate(128, 128);
    g.fillStyle = '#e9e1cf'; g.beginPath(); g.arc(0, 0, 127, 0, 7); g.fill();
    g.strokeStyle = '#3a3d44'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 116, 0, 7); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 98, 0, 7); g.stroke();
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? 72 : 110, w = k % 2 ? 14 : 22;
      [[1, k % 2 ? '#8a8f96' : '#b3372f'], [-1, k % 2 ? '#3a3d44' : '#2b2b30']].forEach(([sd, col]) => {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        g.lineTo(Math.cos(a + sd * Math.PI / 4) * w, Math.sin(a + sd * Math.PI / 4) * w); g.closePath(); g.fill(); });
    }
    g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
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
  function meshFence(x0, z0, x1, z1, yb, H = 1.8, col = 0x3d6b4a, post9 = 0x3d5a45, collide = true) {
    const L = Math.hypot(x1 - x0, z1 - z0), P = [[x0, yb, z0], [x1, yb, z1], [x1, yb + H, z1], [x0, yb + H, z0]], U = [[0, 0], [L / 0.6, 0], [L / 0.6, H / 0.6], [0, H / 0.6]];
    if (L < 0.3) return;                                                     // 길이 0 토막(꼭짓점이 경계선 위) — 봉 방향이 NaN이 된다
    _c.set(col);
    for (const i of [0, 1, 2, 0, 2, 3]) { fencePos.push(...P[i]); fenceUV.push(...U[i]); fenceCol.push(_c.r, _c.g, _c.b); }
    const n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + (x1 - x0)*t, pz = z0 + (z1 - z0)*t; dRod(px, yb, pz, px, yb + H + 0.05, pz, 0.045, post9, { far: true }); }
    dRod(x0, yb + H, z0, x1, yb + H, z1, 0.03, post9, { far: true });
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
    patWall('stoneW', 'z', TR3.fieldZ, TR3.westZ, FIELD, YARD, TR3.westX + 0.012, 1);
    patWall('stoneW', 'x', -86, SCHOOL.gymStairs.x[0] - 0.3, FIELD, YARD, TR3.westZ + 0.012, 1);
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
  foundation(fx0 - 0.15, fx1 + 0.15, fz0, fz1 + 0.15);
  foundation(EN.x[0], EN.x[1], fz1 + 0.15, EN.z[1] - 0.4);
  foundation(EN.x[0], RC.x[0], EN.z[1] - 0.4, EN.z[1]); foundation(RC.x[1], EN.x[1], EN.z[1] - 0.4, EN.z[1]);
  foundation(-10.85, -9.15, fz0 - 0.15, fz0);
  foundation(CL.x[1] + 0.15, fx1 + 0.15, fz0 - 0.15, fz0);

  // 정면(남) FACADE-2(09-24 영상 g_111~f_183 전수): 창마다 튀어나온 상자 틀(윗판·양옆 날개·창턱) + 구간 색.
  //   서쪽 끝~돌봄교실(x ~-6.65) = 카키 사이딩 + 노랑 상자 + 흰 기둥(실 경계) · 행정실~현관 = 베이지 판 + 파랑 상자(위 = 학교 이름 띠 자리)
  //   현관~컴퓨터실(~33.05) = 베이지 + 파랑 · 1·3학년 = 카키 + 노랑 + 흰 기둥. 구간 경계 = 파랑 기둥(f_138·f_171). 창틀 = 나무색(바깥 창 공통)
  const FSEC = [[fx0 - 0.15, -6.65, 'y'], [-6.65, EN.x[0], 'b'], [EN.x[1], 33.05, 'b'], [33.05, fx1 + 0.15, 'y']];
  const secOf = x => (FSEC.find(([a, b]) => x > a && x < b) || FSEC[1])[2];
  const facadeGaps = [];
  FR.rooms.forEach(r => {
    if (r.type === 'hall') return;
    const [s0, s1] = r.span, n = Math.max(1, Math.round((s1 - s0) / 4.3)), seg = (s1 - s0 - 0.8) / n;
    for (let k = 0; k < n; k++) facadeGaps.push({ c: s0 + 0.4 + seg * (k + 0.5), w: Math.min(2.6, seg - 0.9), sill: 1.0, dh: 2.6, win: true, noLedge: true });
  });
  const gapsIn = (a, b) => facadeGaps.filter(g => g.c > a && g.c < b);
  FSEC.forEach(([a, b, k]) => wallX(a, b, fz1, k === 'y' ? KHAKI : WALL, { gaps: gapsIn(a, b), face: 1, ext: true, skin: k === 'y' ? 'siding' : 'panelB' }));
  // 창 상자 틀: 윗판(2.6~2.95)·날개(0.85~2.6)·창턱(0.85~0.98 — 창틀 턱과 윗면이 겹치지 않게) · 깊이 0.3 · 몸이 뚫지 않게 충돌
  facadeGaps.forEach(g => {
    const col = secOf(g.c) === 'y' ? YEL : BLUE, D = 0.3, zc = fz1 + 0.15 + D / 2, hw = g.w / 2;
    dBox(g.w + 0.6, 0.35, D, col, g.c, 2.6, zc);
    [-1, 1].forEach(sd => dBox(0.3, 1.75, D, col, g.c + sd * (hw + 0.15), 0.85, zc));
    dBox(g.w, 0.13, D, col, g.c, 0.85, zc);
    colliders.push({ x0: g.c - hw - 0.3, x1: g.c + hw + 0.3, y0: 0, y1: 2.95, z0: fz1 + 0.15, z1: fz1 + 0.15 + D, nc: true });
  });
  // 기둥: 카키 구간 실 경계 = 흰 기둥, 구간 경계(카키↔베이지) = 넓은 파랑 기둥 — 바닥~처마
  FR.rooms.forEach(r => { const x = r.span[0]; if (x > fx0 + 0.5 && secOf(x - 0.01) === 'y' && secOf(x + 0.01) === 'y') dBox(0.45, FH - 0.02, 0.12, 0xe6e4dc, x, 0.01, fz1 + 0.21); });
  [-6.65, 33.05].forEach(x => dBox(0.6, FH - 0.02, 0.14, BLUE, x, 0.01, fz1 + 0.22));
  // 학교 이름 큰 글자(영상 f_138~f_144: 행정실~교무실 위 베이지 벽 — 남색 글자, 글자 사이 넓게)
  sign(SCHOOL.name.split('').join(' '), (-6.65 + EN.x[0]) / 2, 3.5, fz1 + 0.44, 0, 1.3, { bg: 'none', fg: '#23407e' });
  // 빗물관(흰 — 영상 g_118·f_165·f_174): 실 경계 몇 곳
  [-33.5, -15, 2.2, 24.15, 41.45].forEach(x => { const px = x + 0.45; dCyl(0.05, 0.05, FH + 0.25, 0xeceae4, px, 0, fz1 + 0.24, { seg: 8 }); });
  // 주복도 북벽 — ①도서관 남벽(초록 시트지 창) ②계단홀 트임 ③서관|급식동 뒷길(바깥) ④급식동 남벽(당직실·급식실 문) ⑤가운데 로비 트임 ⑥마당 쪽 창
  const STX0 = wg.rooms.find(r => r.type === 'stair').span[0];
  const libR = wg.rooms.find(r => r.type === 'library');
  wallX(LOB_X - 0.15, STX0 + 0.15, fz0, INNER, { face: -1, dado: HALL_DADO, gaps: [0.25, 0.5, 0.75].map(t => ({ c: libR.span[0] + (libR.span[1] - libR.span[0]) * t, w: 2.2, sill: 1.05, dh: 2.35, win: true })) });
  wallX(wg.x[1] - 0.15, B.kitchen.x[0], fz0, WALL, { face: -1, dado: HALL_DADO, gaps: [{ c: (wg.x[1] + B.kitchen.x[0]) / 2, w: 1.2, sill: 1.1, dh: 2.3, win: true }] });   // 뒷길 창(영상 b_154: 창 너머 벽돌벽)
  wallX(B.kitchen.x[0], CL.x[0] + 0.15, fz0, 0xbcc8ca, { face: -1, dado: HALL_DADO, gaps: [{ c: B.kitchen.dutyRoom.doorC, w: 1.2 },   // 북쪽 면(급식실) = 옅은 청회색 { c: B.kitchen.staffDoorC, w: 1.0, color: 0x9aa0a6 },
    { c: B.kitchen.exitC, w: 1.2, color: 0xf2f2ee }, { c: B.kitchen.doorC, w: 1.8, color: 0xf2f2ee }] });   // 당직실 · 조리실 · 급식실 출구 · 입구(흰 양문 — 영상 b_144·k_15)
  // 마당 쪽 벽: 로비 동쪽 모서리부터 학생자치회 게시판(영상 a_456~460: 로비 유리 바로 동쪽 북벽) → 그 동쪽은 창 + 창 아래 낮은 사물함
  const BOARD = [CL.x[1] + 0.35, CL.x[1] + 5.35];
  wallX(CL.x[1] - 0.15, fx1 + 0.15, fz0, WALL, { wins: 10, face: -1, noWin: [[BOARD[0] - 0.4, BOARD[1] + 0.4]], dado: HALL_DADO, skin: 'panelB' });
  // 로비 트임 양끝 짙은 나무 기둥 마감(영상 c_342~344)
  [[CL.x[0] + 0.15, 1], [CL.x[1] - 0.15, -1]].forEach(([x9, f9]) => dBox(0.04, FH - 0.1, 0.34, DKWOOD, x9 + f9 * 0.02, 0, fz0));
  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: (fz0 + zCor) / 2, w: 1.8, glass: true }], wins: 1, face: 1, skin: 'panelB' });   // 주복도 동쪽 끝 유리문(영상 a_496)
  // 교실벽(복도 남벽) — 서측 로비 서단(원무실 블록 동벽)부터. 원무실은 로비 북쪽까지 뻗은 블록이라 여기서 빠진다
  const DOORCOL = { '유치원': 0xf2c230, '사랑반': 0xf0a8b8 };   // 유치원 노랑 곰 문·사랑반 분홍 문(영상 IMG_2180 W_207·W_224)
  const cGaps = FR.rooms.filter(r => r.span[0] >= LOB_X0 - 0.01).map(r => r.type === 'hall' ? { c: hc, w: 3.32, dh: 2.5 } : { c: r.span[0] + 1.9, w: 1.2, color: DOORCOL[r.name], glass: r.type === 'toilet' });
  FR.rooms.filter(r => (twoDoor(r) || r.type === 'toilet') && r.span[0] >= LOB_X0 - 0.01).forEach(r => cGaps.push({ ...backDoor(r), color: DOORCOL[r.name], glass: r.type === 'toilet' }));   // 화장실 = 그림 유리문(영상 a_462)
  wallX(LOB_X0 - 0.15, fx1 - 0.15, zCor, INNER, { gaps: cGaps, face: 1, dado: HALL_DADO });
  { const k0 = FR.rooms.find(r => r.name === '유치원').span[0], k1 = FR.rooms.find(r => r.name === '사랑반').span[1];   // 유치원·사랑반 앞 복도 벽 그림(징두리 자리)
    const sk = cGaps.filter(g => g.c > k0 && g.c < k1).map(g => [g.c - g.w/2, g.c + g.w/2]).sort((a, b) => a[0] - b[0]);
    let a = k0 + 0.15; for (const [u, v] of [...sk, [k1, k1]]) { if (u - a > 0.2) patWall('mural', 'x', a, u, 0.02, 1.08, zCor - 0.162, -1); a = v; } }
  railAlong('x', LOB_X0 + 0.15, fx1 - 0.15, zCor - 0.15, -1, cGaps.map(g => [g.c - g.w/2 - 0.05, g.c + g.w/2 + 0.05]));   // 교실 쪽 나무 손잡이
  lockerBank('x', LOB_X + 0.2, STX0 - 0.3, fz0 + 0.15, 1, 0.85, 2, null, 0xd2bc98, 0xeadabb, true);   // 도서관 복도창 아래 자작나무색 사물함(영상 b_1xx)
  // 원무실 블록(영상 IMG_2180 213~216s): 로비 서쪽 끝 = 원무실 동벽의 '병설유치원' 짙은 유리 양문, 북쪽 = 측문 통로
  wallX(fx0 + 0.15, LOB_X0 + 0.15, KBZ, INNER);
  wallZ(KBZ, zCor, LOB_X0, INNER, { gaps: [{ c: (KBZ + zCor) / 2, w: 1.8, glass: true }] });
  sign('정림초등학교병설유치원', LOB_X0 + 0.22, 2.75, (KBZ + zCor) / 2, Math.PI / 2, 0.22);
  { // 복도 바닥(영상 a_457~502): 흰 45cm 타일 + 양쪽 벽 따라 검은 띠 25cm(트임 앞도 이어짐) + 가운데 줄 3.6m마다 갈색 타일
    const cx0 = LOB_X0 + 0.15, cx1 = fx1 - 0.15, zN = fz0 + 0.15, zS = zCor - 0.15, BW = 0.25, T = 0.45, za = -32.85, zb = -32.4;
    addPanel(cx1 - cx0, BW, 0x2f3236, (cx0 + cx1)/2, 0.012, zN + BW/2);
    addPanel(cx1 - cx0, BW, 0x2f3236, (cx0 + cx1)/2, 0.012, zS - BW/2);
    floorQ('tileW', cx0, cx1, zN + BW, za); floorQ('tileW', cx0, cx1, zb, zS - BW);
    let x = cx0;
    for (let k = Math.ceil(cx0 / T); (k + 1) * T <= cx1; k++) {
      if (((k % 8) + 8) % 8) continue;
      floorQ('tileW', x, k * T, za, zb); floorQ('tileW', k * T, (k + 1) * T, za, zb, 0, 0xb07850); x = (k + 1) * T;
    }
    floorQ('tileW', x, cx1, za, zb);
    floorQ('tileW', LOB_X0 + 0.15, LOB_X - 0.15, LOB_Z + 0.15, zN);          // 서측 로비
    floorQ('tileW', fx0 + 0.15, LOB_X0 + 0.15, VZ[0] + 0.15, KBZ - 0.15);   // 측문 통로(로비 바닥과 맞댐)
    for (let x9 = LOB_X0 + 2.0; x9 <= fx1 - 1; x9 += 3.6) lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (fz0 + zCor) / 2);   // 복도 사각 등(영상 a_457)
  }
  { // 현관 돌출부(영상 p_149~161·e_312~324): 짙은 나무 판 상자 → 움푹한 포털(2단 계단·양옆 신발장) → 유리 벽·양문 → 전실(체크 매트) → 자동문 → 홀
    const [bx0, bx1] = EN.x, [bz0, bz1] = EN.z, [rx0, rx1] = RC.x, rzg = RC.z[0];   // rzg = 바깥 유리 벽 줄(-22.6)
    const DKW = (w, h, d, cx, y, cz) => addBox(w, h, d, DKWOOD, cx, y, cz);
    DKW(rx0 - bx0, FH, bz1 - bz0, (bx0 + rx0)/2, 0, (bz0 + bz1)/2);          // 서쪽 벽(두께 0.5 — 전실 옆면 + 포털 옆면)
    DKW(bx1 - rx1, FH, bz1 - bz0, (rx1 + bx1)/2, 0, (bz0 + bz1)/2);
    [[bx0, -1], [rx0, 1], [rx1, -1], [bx1, 1]].forEach(([xx, f]) => patWall('woodW', 'z', bz0 + (xx === rx0 || xx === rx1 ? bz1 - bz0 - 2.6 : 0.2), bz1, 0, FH, xx + f*0.012, f));
    [[bx0, rx0], [rx1, bx1]].forEach(([a, b]) => patWall('woodW', 'x', a, b, 0, FH, bz1 + 0.012, 1));
    addBox(rx1 - rx0, FH - 2.9, 0.3, DKWOOD, (rx0 + rx1)/2, 2.9, bz1 - 0.15);    // 포털 앞 윗가림
    patWall('woodW', 'x', rx0, rx1, 2.9, FH, bz1 + 0.012, 1);
    patQuad('cwood', rx0, rx1, rzg + 0.15, bz1 - 0.3, 2.9, true);              // 포털 천장(짙은 나무)
    colliders.push({ x0: rx0, x1: rx1, y0: 2.9, y1: FH, z0: rzg + 0.15, z1: bz1 - 0.3 });
    lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 - 0.9, 2.86, (rzg + bz1)/2); lamp(0.22, 0.04, 0.22, (rx0 + rx1)/2 + 0.9, 2.86, (rzg + bz1)/2);
    addBox(bx1 - bx0, 0.3, bz1 - bz0, 0x2f2a26, (bx0 + bx1)/2, FH, (bz0 + bz1)/2);   // 돌출부 지붕
    dBox(bx1 - bx0 + 0.06, 0.1, 0.06, BLUE, (bx0 + bx1)/2, FH + 0.2, bz1 + 0.03);     // 윗선 파랑 띠(영상 p_152)
    // 포털 바닥 = 짙은 고무 매트, 앞 2단(YARD → -0.15 → 0)
    floorQ('gmat', rx0, rx1, rzg + 0.15, bz1 - 0.4);
    addBox(rx1 - rx0, -0.15 - YARD, 0.4, STONE, (rx0 + rx1)/2, YARD, bz1 - 0.2);
    patQuad('gmat', rx0, rx1, bz1 - 0.4, bz1, -0.15 + 0.012);
    // 양옆 신발장(2단 문·갈색 — 영상 e_316~321·p_158~161): 바깥 유리 벽 앞에서 계단 쪽으로 2m
    lockerBank('z', rzg + 0.2, rzg + 2.2, rx0, 1, 1.75, 2, null, 0x7e4a2a, 0xa35f33);
    lockerBank('z', rzg + 0.2, rzg + 2.2, rx1, -1, 1.75, 2, null, 0x7e4a2a, 0xa35f33);
    // 바깥 유리 벽: 양옆 둥근 무늬 반투명 판 + 가운데 스테인리스 양문("우리학교 방문을 환영합니다")
    wallX(rx0, rx1, rzg, DKWOOD, { h: FH, inner: true, face: 1, gaps: [{ c: hc, w: 1.7, glass: true, door: true, dh: 2.5, slideOver: true }, { c: (rx0 + hc - 1.0)/2, w: hc - 1.0 - rx0, sill: 0, dh: 2.5, win: true, frame: 0x9aa0a6 }, { c: (hc + 1.0 + rx1)/2, w: rx1 - hc - 1.0, sill: 0, dh: 2.5, win: true, frame: 0x9aa0a6 }] });
    sign('우리학교 방문을 환영합니다', hc, 2.68, rzg + 0.17, 0, 0.16, { bg: '#f3e6ef', fg: '#4a5a9a' });   // 문 위 인방(문짝에 붙이면 열릴 때 공중에 뜬다)
    // 전실(바깥문 ~ 자동문): 흑백 체크 매트. 자동문 양옆 고정 유리
    wallX(HX0 + 0.15, HX1 - 0.15, EZI, INNER, { gaps: [{ c: hc, w: 1.8, glass: true, door: true, slideOver: true }, { c: (HX0 + 0.15 + hc - 1.05)/2, w: hc - 1.05 - HX0 - 0.15, sill: 0, dh: 2.6, win: true }, { c: (hc + 1.05 + HX1 - 0.15)/2, w: HX1 - 0.15 - hc - 1.05, sill: 0, dh: 2.6, win: true }] });
    sign('외부인 출입금지', hc, 2.75, EZI + 0.17, 0, 0.16, { bg: '#fbeeee', fg: '#c0392b' });
    floorQ('check', rx0, rx1, fz1 + 0.15, rzg - 0.15);
    floorQ('check', HX0 + 0.15, HX1 - 0.15, EZI + 0.15, fz1 + 0.15);
    // 앞 포장 + 빨강·초록 고무 매트 + 노랑 우산꽂이(영상 e_313~316)
    patQuad('pave', bx0, bx1, bz1, SCHOOL.frontYard.walkN, YARD + 0.02);
    patQuad('rmat', hc - 1.2, hc + 1.2, bz1 + 0.02, bz1 + 1.1, YARD + 0.032);
    addBox(0.4, 0.55, 0.3, YEL, bx0 + 0.3, YARD, bz1 + 0.35, NS);
    zones.push({ x0: rx0, x1: rx1, z0: rzg, z1: bz1, y: 0, label: '현관 앞' });
    hotspots.push({ kind: 'shoes', x: hc, z: rzg + 1.3, y: 0, r: 1.2, label: '실내화로 갈아신기' });   // 신발장 앞(우리 학교 등교 첫 동작)
  }
  { // 현관 홀(영상 e_325~341): 크림 광택 타일 + 나침반, 서쪽 = 유리 진열장 + 사진 게시판, 동쪽 = 신발장(검은 상판·화분) + 진열장, 북끝 = 나무 아치
    const hx0 = HX0 + 0.15, hx1 = HX1 - 0.15, hz0 = zCor + 0.15, hz1 = EZI - 0.15;
    floorQ('tileC', hx0, hx1, hz0, hz1);
    compassRose(hc, 0.018, hz0 + 2.3, 0.62);
    displayCase('z', hz0 + 0.5, hz0 + 2.2, hx0, 1); displayCase('z', hz0 + 2.3, hz0 + 4.0, hx0, 1); displayCase('z', hz0 + 4.1, hz1 - 0.45, hx0, 1);
    greenBoard('z', hz0 + 0.45, hz1 - 0.4, hx0, 1, 1.2, 2.45);
    lockerBank('z', hz1 - 3.0, hz1 - 0.35, hx1, -1, 1.05, 3, 0x2b2b2b);
    for (let z9 = hz1 - 2.8; z9 < hz1 - 0.5; z9 += 0.38) potPlant(hx1 - 0.25, 1.08, z9, 0.85 + hash2(z9, 3) * 0.35, hash2(z9, 4) > 0.55, hash2(z9, 5) > 0.6 ? 0x2f3a55 : 0xd9d6ce);
    displayCase('z', hz0 + 1.9, hz1 - 3.15, hx1, -1);
    // 우유 보관함(영상 e_339~341: 아치 옆 흰 몸통 + 연두 앞판 + 유리 뚜껑)
    addBox(0.62, 0.86, 0.95, 0xf2f2ee, hx1 - 0.31, 0, hz0 + 1.3, NS);
    dBox(0.03, 0.6, 0.85, 0x9fd06a, hx1 - 0.635, 0.12, hz0 + 1.3);
    dBox(0.66, 0.04, 0.99, 0xd6e4e8, hx1 - 0.33, 0.86, hz0 + 1.3);
    hotspots.push({ kind: 'milk', x: hx1 - 1.0, z: hz0 + 1.3, y: 0, r: 0.9, label: '우유 꺼내기' });
    greenBoard('z', hz0 + 0.45, EZI - 2.95, hx1, -1, 1.35, 2.45);                     // 동벽 게시판은 북쪽(남쪽은 높은 창)
    // 북끝 아치(짙은 나무 틀 + 둥근 모서리) + "웃음꽃 피는 즐거운 학교" 나무 현판(홀 쪽)
    // 기둥·머리틀은 벽 끝·인방과 같은 면이 되지 않게 4cm 감싸고 바닥·인방 밑면에서 살짝 띄운다(감사)
    [[HX0 + 0.15, hc - 1.62], [hc + 1.62, HX1 - 0.15]].forEach(([a9, b9]) => dBox(b9 - a9, 2.455, 0.36, DKWOOD, (a9 + b9)/2, 0.005, zCor));
    dBox(3.9, 0.3, 0.36, DKWOOD, hc, 2.46, zCor);
    [[-1], [1]].forEach(([sd]) => dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(hc + sd * 1.55, 2.4, zCor), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, sd * 0.785)), new THREE.Vector3(0.42, 0.14, 0.34)), DKWOOD));
    addBox(3.4, 0.42, 0.16, 0x6b4a32, hc, 2.78, zCor + 0.23, { collide: false });
    sign('웃음꽃 피는 즐거운 학교', hc, 2.99, zCor + 0.33, 0, 0.26, { bg: '#6b4a32', fg: '#f6e7c4' });
    for (let k = 0; k < 3; k++) lamp(1.3, 0.05, 0.08, hc, FH - 0.21, hz0 + 1.2 + k * 2.2);   // 가로 LED 막대(영상 e_325)
    hotspots.push({ kind: 'water', x: hc + 1.2, z: hz0 + 0.8, y: 0, r: 1.2, label: '물 마시기' });
    addBox(0.5, 1.3, 0.45, 0xe8eef2, hx1 - 0.25, 0, hz0 + 0.35, NS);            // 정수기(아치 옆 — 사용자 07-31)
  }
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    const rz0 = r.kinderOffice ? KBZ : zCor;                                     // 원무실은 북쪽 KBZ까지
    // 칸막이. 현관 홀 양벽은 정면 벽 줄(-24)까지 — 정면 벽이 현관 자리에서 끊기므로 여기서 메운다
    if (i > 0) {
      const ze = (s0 === HX0 || s0 === HX1) ? fz1 : fz1 - 0.15;
      if (s0 === HX1) wallRun('z', zCor + 0.15, ze, s0, INNER, { gaps: [{ c: EZI - 1.55, w: 2.3, sill: 1.35, dh: 2.55, win: true }] });   // 현관 홀 동벽: 신발장 위 반투명 높은 창(영상 e_329~331)
      else addBox(0.3, FH, ze - zCor - 0.15, INNER, s0, 0, (zCor + 0.15 + ze)/2);
    }
    zones.push({ x0: s0, x1: s1, z0: rz0, z1: fz1, y: 0, label: r.name });
    if (r.type === 'hall') return;
    const x0 = s0 + (i > 0 ? 0.15 : 0.15), x1 = s1 - 0.15, z0 = rz0 + 0.15, z1 = fz1 - 0.15;
    if (r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare') {
      floorQ('wood', x0, x1, z0, z1);
      westClass(r.name, x0, x1, zCor + 0.15, z1, 0, { sill: 1.0 });                  // 서향 교실(칠판 = 서벽)
      [1, 2].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * cw * 0.22, FH - 0.21, zCor + k * 2.5)));
    } else if (r.type === 'toilet') {
      floorQ('ttile', x0, x1, z0, z1);
      addBox(cw-1.2, 1.2, 0.4, 0xdfe8ee, cx, 0, fz1 - 0.55, NS);                // 세면대
      addBox(0.3, FH, fz1-zCor-2.2, INNER, cx, 0, (zCor+fz1)/2 - 0.6);           // 남|여 구분벽
      [-3.1, -1.6, 1.6, 3.1].forEach(ox => addBox(0.24, 1.9, 1.5, 0xdfe8ee, cx+ox, 0, zCor + 1.55));
      lamp(1.2, 0.05, 0.22, cx - 2.3, FH - 0.21, (zCor + fz1)/2); lamp(1.2, 0.05, 0.22, cx + 2.3, FH - 0.21, (zCor + fz1)/2);
    } else {
      floorQ('tileW', x0, x1, z0, z1, 0, 0xf2e6cf);
      officeDesk(cx - 1, 0, rz0 + 3.3);
      officeDesk(cx + 1, 0, rz0 + 2.0);
      addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6);
      lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (rz0 + fz1)/2);
    }
    if (!r.kinderOffice) hangSign(r.name, r.span[0] + 1.9, 2.78, zCor, -1);
    ceil(s0, s1, r.kinderOffice ? fz0 - 0.16 : zCor, fz1, FH, r.type === 'toilet' ? 'cflat' : 'ctile');
  });
  // 복도 남벽 액자(영상 a_468~480): 실마다 두 문 사이 가운데 눈높이(문과 겹치는 좁은 실은 건너뜀)
  FR.rooms.forEach(r => { if (r.type === 'hall' || r.kinderOffice) return; const x = (r.span[0] + r.span[1]) / 2;
    if (Math.abs(x - (r.span[0] + 1.9)) < 1.1) return;
    dBox(0.84, 0.62, 0.03, 0x6b4a32, x, 1.45, zCor - 0.165);
    patWall('kidsArt', 'x', x - 0.36, x + 0.36, 1.5, 2.02, zCor - 0.186, -1); });
  // 도서관 복도창 짙은 초록 시트지(영상 W_202~207 — 복도에서 안이 안 보임)
  [0.25, 0.5, 0.75].forEach(t => { const c = libR.span[0] + (libR.span[1] - libR.span[0]) * t; patWall('film', 'x', c - 1.04, c + 1.04, 1.11, 2.29, fz0 + 0.09, 1); });
  { // 복도 채우기 — 학생자치회 게시판·창 아래 낮은 사물함·소화기
    greenBoard('x', BOARD[0], BOARD[1], fz0 + 0.15, 1, 0.95, 2.3, 'notice');
    sign('정림 학생자치회 소식', (BOARD[0] + BOARD[1]) / 2, 2.45, fz0 + 0.24, 0, 0.24, { bg: '#2f6e4f', fg: '#ffffff' });
    hotspots.push({ kind: 'notice', x: (BOARD[0] + BOARD[1]) / 2, z: fz0 + 1.1, y: 0, r: 1.6, label: '학생자치회 소식 읽기' });
    lockerBank('x', BOARD[1] + 0.4, fx1 - 0.3, fz0 + 0.15, 1, 0.85, 2, null, 0x8a5530, 0xb07a48, true);   // 창 아래 낮은 나무 사물함(영상 a_465)
    [LOB_X0 + 1.2, -10.2, 8.5, 21.8].forEach(x => extinguisher(x, 0, fz0 + 0.3));   // 소화기(바닥)
  }
  // 지붕: 돌출부 자리는 비우고(돌출부 지붕과 맞댐) 세 조각. 북단 z-33.98 = 서관·로비 슬래브와 맞댐
  { const RZ0 = fz0 + 0.02, RZ1 = fz1 + 0.4, R3 = 0x4f9a6c;
    addBox(EN.x[0] - (fx0 - 0.4), 0.3, RZ1 - RZ0, R3, (fx0 - 0.4 + EN.x[0])/2, FH, (RZ0 + RZ1)/2);
    addBox(fx1 + 0.4 - EN.x[1], 0.3, RZ1 - RZ0, R3, (EN.x[1] + fx1 + 0.4)/2, FH, (RZ0 + RZ1)/2);
    addBox(EN.x[1] - EN.x[0], 0.3, fz1 - RZ0, R3, (EN.x[0] + EN.x[1])/2, FH, (RZ0 + fz1)/2);
    // 앞 파라펫 = 구간 벽색 + 구간 색 갓돌(노랑/파랑 — 영상 f_165·f_174) · 지붕판 앞면(초록)은 벽색 띠로 가린다
    [[fx0 - 0.4, -6.65, 'y'], [-6.65, EN.x[0], 'b'], [EN.x[1], 33.05, 'b'], [33.05, fx1 + 0.4, 'y']].forEach(([a9, b9, k9]) => {
      const wc9 = k9 === 'y' ? KHAKI : WALL, cc9 = k9 === 'y' ? YEL : BLUE, m9 = (a9 + b9) / 2, L9 = b9 - a9;
      addBox(L9, 0.45, 0.3, wc9, m9, FH + 0.3, fz1 + 0.25, { collide: false });
      dBox(L9, 0.07, 0.36, cc9, m9, FH + 0.75, fz1 + 0.25, { far: true });
      dBox(L9, 0.3, 0.03, wc9, m9, FH, fz1 + 0.415, { far: true });
    });
    addBox(4, 1.8, 3, 0xe8e6de, fx1 - 8, FH + 0.3, (fz0 + fz1)/2);
    // 옥상 난간: 앞 = 흰 파라펫 위, 동·서 끝 = 지붕 위, 북 = 가운데 마당~동쪽 끝(서쪽은 서관 2층 벽·급식동 벽·로비 지붕과 맞닿아 없음)
    roofRail(fx0 - 0.3, fz1 + 0.25, EN.x[0], fz1 + 0.25, FH + 0.82); roofRail(EN.x[1], fz1 + 0.25, fx1 + 0.3, fz1 + 0.25, FH + 0.82);
    roofRail(fx0 - 0.3, RZ0 + 0.1, fx0 - 0.3, fz1 + 0.1, FH + 0.3); roofRail(fx1 + 0.3, RZ0 + 0.1, fx1 + 0.3, fz1 + 0.1, FH + 0.3);
    roofRail(CL.x[1] + 0.15, RZ0 + 0.1, fx1 + 0.3, RZ0 + 0.1, FH + 0.3); }
  ceil(LOB_X0, fx1, fz0 - 0.16, zCor, FH, 'cflat');                          // 주복도(로비·계단홀 트임 앞까지 이어서 틈 없이)
  ceil(HX0, HX1, zCor, RC.z[0] + 0.16, FH, 'cflat');                          // 현관 홀 + 전실
  ceil(fx0, LOB_X0, KBZ, fz0 + 0.16, FH, 'ctile');                            // 측문 통로 남쪽 원무실 블록 북단(서관 몫과 맞댐)

  // ================= 서관 (1층 보건실·나래반·문서고·도서실·계단홀 / 2층 6·5학년·소담실) =================
  const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  foundation(wx0 - 0.15, wx1 + 0.15, wz0 - 0.15, wz1);
  // 서쪽 끝 겉벽(서관 + 원무실 블록 + 본관 서단 한 줄 — 영상 g_111~114 카키 사이딩): 측문(유리 양문) + 보건실·원무실 창
  wallZ(wz0, fz1, wx0, KHAKI, { face: -1, ext: true, skin: 'siding', gaps: [{ c: SIDE_Z, w: 2.0, glass: true, door: true },
    { c: -42.2, w: 2.2, sill: 1.0, dh: 2.6, win: true }, { c: -33.0, w: 1.6, sill: 1.0, dh: 2.6, win: true }, { c: -28.0, w: 2.2, sill: 1.0, dh: 2.6, win: true }] });
  addBox(0.2, 0.6, fz1 - wz0 - 0.24, YEL, wx0 - 0.14, 2.65, (wz0 + fz1)/2, { collide: false });                       // 서면 노랑 띠
  // 1층 북벽(주차장 쪽) + 계단참 큰 창 / 동벽(뒷길 쪽 — 계단홀 유리문)
  wallX(wx0 - 0.15, STX0, wz0, WALL, { wins: 5, face: -1, skin: 'panelB' });
  wallX(STX0, wx1 + 0.15, wz0, WALL, { face: -1, dado: STAIR_DADO, skin: 'panelB', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 2.0, dh: 3.4, win: true }] });
  wallZ(wz0, wz1, wx1, WALL, { face: 1, dado: STAIR_DADO, skin: 'panelB', gaps: [{ c: -37.9, w: 1.8, glass: true, door: true }] });   // 계단홀 → 뒷길 유리문
  // 2층 겉벽
  wallX(wx0 - 0.15, STX0, wz0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 5, face: -1, sill: 0.8, skin: 'panelB' });
  wallX(STX0, wx1 + 0.15, wz0, WALL, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO, skin: 'panelB', gaps: [{ c: (STX0 + wx1)/2, w: 3.2, sill: 0, dh: 1.3, win: true }] });   // 참 큰 창 윗단(영상 b_168: 참 바닥~2층 높이)
  wallZ(wz0, wz1, wx0, KHAKI, { y0: FH+0.3, h: FH-0.3, face: -1, ext: true, skin: 'siding', gaps: [{ c: (wz1 - B.upper.corridorDepth + wz1) / 2, w: 1.4, sill: 0.8, dh: 2.3, win: true }] });   // 2층 서면: 6학년 칠판 벽이라 창은 복도 끝만
  wallZ(wz0, wz1, wx1, WALL, { y0: FH+0.3, h: FH-0.3, dado: STAIR_DADO, skin: 'panelB' });
  wallX(wx0 - 0.15, wx1 + 0.15, wz1, WALL, { y0: FH+0.3, h: FH-0.3, wins: 6, face: 1, sill: 0.8, skin: 'panelB', noWin: [[STX0 - 0.2, wx1]] });  // 2층 남면(1층 z-34는 본관 북벽)
  addBox(1.0, 2.2, 0.16, 0x8a5a3b, (STX0 + wx1)/2, FH + 0.3, wz1 - 0.23);   // 2층 계단홀 옥상 쪽 나무문(문서 v80c) — 닫힌 모양만
  floorQ('tileG', STX0 + 0.15, wx1 - 0.15, wz0 + 0.15, fz0 + 0.15);        // 계단홀 1층 바닥 = 회색 테라초(영상 b_157~160) · 복도 검은 띠와 맞댐
  {
    const nurse = wg.rooms.find(r => r.type === 'nurse'), narae = wg.rooms.find(r => r.name === '나래반'), docR = wg.rooms.find(r => r.name === '문서고');
    // 보건실 문 + 나래반 문이 분홍 판 기둥 하나를 사이에 두고 나란히(영상 IMG_2180 205~210s: '밝은숲 보금자리' 그림 유리문·풍선 유리문)
    const nurseDoor = narae.span[0] - 0.95, naraeDoor = narae.span[0] + 1.05;
    wallX(wx0 + 0.15, LOB_X + 0.15, LOB_Z, INNER, { gaps: [{ c: nurseDoor, w: 1.2, glass: true }, { c: naraeDoor, w: 1.4, glass: true },
      { c: (narae.span[0] + 1.9 + docR.span[0] - 0.1) / 2, w: docR.span[0] - 0.1 - narae.span[0] - 1.9 - 0.4, sill: 1.55, dh: 2.45, win: true }] });
    dBox(0.5, 2.4, 0.04, 0xf0a8b8, narae.span[0], 0.1, LOB_Z + 0.17);   // 분홍 판 기둥(두 문 사이·로비 쪽)
    // 로비 동벽 = 도서관 서벽: 슬기샘 도서관 유리 양문(서쪽을 봄) + 문 남쪽 도서반납함
    wallZ(LOB_Z, fz0, LOB_X, INNER, { gaps: [{ c: -36.6, w: 1.8, glass: true }] });
    // 로비 북쪽 방들 칸막이(z wz0~LOB_Z): 보건실|나래반, 나래반|문서고(문서고는 나래반 안에서 — 개구), 문서고|도서관, 도서관|계단
    const pz = (wz0 + 0.15 + LOB_Z - 0.15) / 2, pd = (LOB_Z - 0.15) - (wz0 + 0.15);
    addBox(0.3, FH, pd, INNER, narae.span[0], 0, pz);
    wallZ(wz0, LOB_Z, docR.span[0], INNER, { gaps: [{ c: pz, w: 1.0 }] });
    addBox(0.3, FH, pd, INNER, LOB_X, 0, pz);
    wallZ(wz0, wz1, STX0, INNER, { face: -1, dado: STAIR_DADO, gaps: [{ c: fz0 - 1.4, w: 1.0 }] });   // 계단홀 서벽 = 도서관 뒷문(영상 b_159~160 포스터 붙은 문)
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
        dBox(0.04, 1.6, 2.2, 0xcfe3ee, cx, 0.4, wz0 + 1.7, { collide: true }); officeDesk(cx + 1.2, 0, LOB_Z - 1.2); lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }
      if (r.name === '나래반') { westClass(r.name, s0 + 0.15, s1 - 0.15, LOB_Z - 0.15, wz0 + 0.15, 0, { sill: 1.0, backGap: [pz - 0.9, pz + 0.9] }); lamp(1.2, 0.05, 0.22, cx, FH - 0.21, (wz0 + LOB_Z)/2); }   // 동벽 = 문서고 문
      if (r.name === '문서고') [wz0 + 0.5, wz0 + 2.2].forEach(z9 => addBox(1.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9));
    });
    hangSign('보건실', nurseDoor, 2.78, LOB_Z, 1);
    hangSign('나래반', naraeDoor, 2.78, LOB_Z, 1);
    sign('밝은숲 보금자리', nurseDoor, 1.95, LOB_Z + 0.2, 0, 0.14, { bg: '#e8f3dc', fg: '#3f7a3f' });
    sign('슬기샘 도서관', LOB_X - 0.22, 2.55, -36.6, Math.PI / 2, 0.34);
    // 로비 가운데 남쪽 둥근 기둥 소파(주황·노랑 2단 + 연두 기둥 + 민트 갓) — 측문→도서관 시선은 비켜 남쪽에(영상 W_205~212)
    const [dx9, dz9] = WL.sofa;
    colliders.push({ x0: dx9-1.15, x1: dx9+1.15, y0: 0, y1: 0.45, z0: dz9-1.15, z1: dz9+1.15 }, { x0: dx9-0.75, x1: dx9+0.75, y0: 0.45, y1: 0.85, z0: dz9-0.75, z1: dz9+0.75 }, { x0: dx9-0.3, x1: dx9+0.3, y0: 0.85, y1: FH, z0: dz9-0.3, z1: dz9+0.3 });
    dCyl(1.15, 1.15, 0.45, 0xe8893a, dx9, 0, dz9, { seg: 20 });
    dCyl(0.78, 0.78, 0.4, 0xf2b84b, dx9, 0.45, dz9, { seg: 18 });
    dCyl(0.3, 0.3, FH - 0.85 - 0.5, 0xf0d27a, dx9, 0.85, dz9, { seg: 12, far: true });   // 노랑 기둥(영상 W_206~212)
    { const cap9 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.95, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0xf4ecd6 }));
      cap9.position.set(dx9, FH - 0.4, dz9); cap9.matrixAutoUpdate = false; cap9.updateMatrix(); scene.add(cap9); }
    // 북벽 창 아래 쿠션 벤치(주황·연두·노랑) + 도서반납함
    [[-31.6, 0xe8893a], [-30.4, 0x8cc26a], [-29.2, 0xf2c14b], [-28.0, 0xe8893a]].forEach(([bx9, bc9]) => addBox(1.15, 0.45, 0.6, bc9, bx9, 0, LOB_Z + 0.45));
    addBox(0.45, 0.95, 0.55, 0x3d6fa8, LOB_X - 0.4, 0, -35.2, NS);
    // 측문 통로: 신발장(오픈) + 체크 매트 + 소화기
    lockerBank('x', wx0 + 1.5, wx0 + 3.3, KBZ - 0.15, -1, 1.2, 3, null, 0xb58a5a, 0xc49868);
    patQuad('check', wx0 + 0.15, wx0 + 1.4, VZ[0] + 0.3, VZ[1] - 0.3, 0.02);
    extinguisher(LOB_X0 - 0.3, 0, VZ[0] + 0.3);
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
    for (let i = 0; i < N; i++) addBox(LW, RISE * (i + 1), TR, STONE, AX, 0, Z0 - TR * (i + 0.5));
    addBox(wx1 - STX0 - 0.3, RISE * N, ZL - (wz0 + 0.15), STONE, (STX0 + wx1) / 2, 0, (ZL + wz0 + 0.15) / 2);   // 반층 참(북벽 창가)
    for (let j = 0; j < N; j++) addBox(LW, 0.3, TR, STONE, BX, RISE * (N + j + 1) - 0.3, ZL + TR * (j + 0.5));  // 동 레인(떠 있는 디딤판)
    addBox(wx1 - STX0, 0.3, wz1 + 0.02 - Z0, 0xd9dce1, (STX0 + wx1) / 2, FH, (Z0 + wz1 + 0.02) / 2);           // 2층 바닥(계단홀 남쪽 위)
    addBox(LW, 1.05, 0.16, 0xc8cdd2, AX, FH + 0.3, Z0 + 0.08, NS);                                             // 2층: 서 레인 위 빈 곳 난간(올라서기 금지)
    // 난간(영상 b_160~175): 두 레인 사이 스테인리스 · 벽 쪽 나무 손잡이 · 참 창 앞 막이
    const MX = STX0 + 0.15 + LW;
    steelRail(MX - 0.04, Z0 - 0.2, MX - 0.04, ZL + 0.15, RISE, RISE * N);
    steelRail(MX + 0.04, ZL + 0.15, MX + 0.04, Z0 - 0.2, RISE * (N + 1), FH + 0.3);
    dRod(STX0 + 0.21, 0.9, Z0, STX0 + 0.21, 0.9 + RISE * N, ZL, 0.03, 0x8a5a3b);
    dRod(wx1 - 0.21, 0.9 + RISE * N, ZL, wx1 - 0.21, 0.9 + FH + 0.3, Z0, 0.03, 0x8a5a3b);
    steelRail(STX0 + 0.3, wz0 + 0.35, wx1 - 0.3, wz0 + 0.35, RISE * N);
    floorQ('tileW', STX0 + 0.15, wx1 - 0.15, Z0, wz1 + 0.02, FH + 0.3);
    patQuad('cflat', STX0 + 0.15, wx1 - 0.15, Z0 + 0.01, fz0, FH - 0.012, true);                         // 1층 계단홀 천장(2층 바닥 밑면이 갈색으로 보이던 것)
    sign('계단 · 2층', (STX0 + wx1) / 2, 2.95, fz0 + 0.22, 0, 0.3);
    addBox(wx1 - STX0, 0.3, 0.3, WALL, (STX0 + wx1) / 2, FH, wz0);                                            // 테두리보(1·2층 벽 사이 빈 띠)
    addBox(0.3, 0.3, Z0 - (wz0 + 0.15), WALL, wx1, FH, (Z0 + wz0 + 0.15) / 2);
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
    wallX(wx0 + 0.15, STX0 + 0.15, zc2, INNER, { y0: FH+0.3, h: FH-0.3, gaps: [...B.upper.rooms.map(r => ({ c: doorC(r), w: 1.2 })), ...B.upper.rooms.filter(twoDoor).map(backDoor)] });
    wallZ(wz0, zc2, STX0, INNER, { y0: FH+0.3, h: FH-0.3, face: -1, dado: STAIR_DADO });   // 소담실 동벽(계단홀 쪽 두 톤)
    floorQ('tileW', wx0 + 0.15, STX0 + 0.15, zc2 + 0.15, wz1 - 0.15, FH + 0.3);
    ceil(wx0, wx1, zc2, wz1, FH * 2, 'cflat');
    for (let x9 = wx0 + 2; x9 < wx1 - 1; x9 += 3.6) lamp(0.62, 0.05, 0.3, x9, FH * 2 - 0.21, (zc2 + wz1)/2);
  }
  addBox(wx1-wx0+0.8, 0.3, wz1-wz0+0.8, 0xd9dce1, (wx0+wx1)/2, FH*2, (wz0+wz1)/2);
  addBox(wx1-wx0+0.8, 0.45, 0.3, 0xe8e6de, (wx0+wx1)/2, FH*2+0.3, wz0-0.25, { collide: false });

  // ================= 급식동 =================
  const K = B.kitchen, [kx0, kx1] = K.x, [kz0, kz1] = K.z, KH = K.wallHeight;
  foundation(kx0 - 0.15, kx1, kz0 - 0.15, kz1);
  foundation(kx1, kx1 + 0.15, kz0 - 0.15, LC.z[0] - 0.15);                                                      // 북동 모서리 동면(세로복도 북쪽 밖)
  wallX(kx0 - 0.15, kx1 + 0.15, kz0, WALL, { h: KH, face: -1, sill: 2.4, wh: 1.2, skin: 'panelB', gaps: [{ c: K.backDoorC, w: 1.2 },
    ...[-7.3, -2.3, 2.5, 8.0].map(c => ({ c, w: 2.0, sill: 2.4, dh: 3.6, win: true }))] });   // 조리실 뒷문 + 높은 창(조리실 2·창고 2)
  wallZ(kz0, kz1, kx0, WALL, { h: KH, wins: 4, face: -1, skin: 'panelB' });
  // 동벽(x 10): ①북쪽 밖 ②세로복도 서벽(급식실이 보이는 큰 실내 창 — 영상 c_351~356 · 북끝 짙은 문) ③로비 서벽(붉은 벽돌 — c_350~352). 위(FH~) = 바깥
  wallRun('z', kz0 + 0.15, LC.z[0], kx1, WALL, { h: KH, face: 1, skin: 'panelB' });
  wallRun('z', LC.z[0], CL.z[0] - 1.5, kx1, 0xbcc8ca, { h: FH, inner: true, face: -1, gaps: [{ c: K.cornerDoorZ, w: 1.0, color: 0x4a3a30 }, ...[[-46.1, 3.8], [-41.85, 3.9]].map(([c, w]) => ({ c, w, sill: 0.85, dh: 3.05, win: true }))] });
  [[-46.1, 3.8], [-41.85, 3.9]].forEach(([c, w]) => [-0.125, 0.125].forEach(o => dBox(0.05, 0.06, w - 0.12, 0xe8ecec, kx1 + o, 2.1, c)));   // 창 가로살(아래 미닫이·위 고정창) — 유리 양쪽 두 줄(유리판을 관통하면 깜빡인다)
  wallRun('z', CL.z[0] - 1.5, kz1 - 0.15, kx1, 0x9a8a78, { h: FH, inner: true, innerHex: 0xbcc8ca, face: 1 });
  patWall('brickW', 'z', CL.z[0] - 1.5, kz1 - 0.15, 0, FH, kx1 + 0.162, 1);
  wallRun('z', LC.z[0], kz1 - 0.15, kx1, WALL, { y0: FH, h: KH - FH, face: 1, innerHex: 0xbcc8ca });
  addBox(0.3, FH, 0.45, BRICK, kx1 + 0.3, 0, K.cornerDoorZ - 0.85);                                     // 짙은 문 옆 벽돌 기둥(영상 c_361)
  patQuad('gmat', kx1 + 0.15, kx1 + 1.1, K.cornerDoorZ - 0.5, K.cornerDoorZ + 0.5, 0.02, false, 0x9fd49a);   // 초록 매트
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
  [[K.exitC + 0.95, 0.25, 0.7, 0x2a2c30], [K.exitC + 1.5, 0.2, 0.36, 0x3f7fd6]].forEach(([x9, r9, h9, c9]) => {   // 출구 옆(영상 k_00 오른쪽 아래) dCyl(r9, r9 * 0.88, h9, c9, x9, 0, kz1 - 0.45, { seg: 12 });
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
  addBox(1.0, 0.6, 0.7, 0xc9a877, HX + 5.0, 0, AZ - 1.1, NS);
  // ---- 조리실(서): 국솥 2·가스 레인지·밥 찜기·작업대 2·개수대(3칸)·식기세척기·냉장고 2 · 배식창 뒤 급식 수레 ----
  [[kx0 + 1.4, kz0 + 1.1], [kx0 + 2.8, kz0 + 1.1]].forEach(([x9, z9]) => { dCyl(0.55, 0.5, 0.85, 0xb9bec2, x9, 0, z9, { seg: 14 }); dCyl(0.5, 0.5, 0.05, 0x8a9096, x9, 0.85, z9, { seg: 14 });
    colliders.push(noStand({ x0: x9 - 0.55, x1: x9 + 0.55, y0: 0, y1: 0.9, z0: z9 - 0.55, z1: z9 + 0.55 })); });
  addBox(1.6, 0.85, 0.8, 0xc4c9cd, kx0 + 4.6, 0, kz0 + 0.55, NS); dBox(1.5, 0.03, 0.7, 0x2a2c30, kx0 + 4.6, 0.85, kz0 + 0.55);   // 가스 레인지(검은 상판)
  addBox(1.1, 1.8, 0.8, 0xd3d7da, kx0 + 6.3, 0, kz0 + 0.55, NS);                           // 밥 찜기(문 3단)
  [0.45, 1.05, 1.62].forEach(y9 => dBox(0.9, 0.03, 0.03, 0x8a9096, kx0 + 6.3, y9, kz0 + 0.965));
  [[kx0 + 4.0, kz0 + 4.6], [kx0 + 4.0, kz0 + 7.4]].forEach(([x9, z9]) => addBox(2.4, 0.85, 0.8, 0xc4c9cd, x9, 0, z9, NS));   // 작업대
  addBox(0.75, 0.85, 3.0, 0xc9ced3, kx0 + 0.525, 0, kz0 + 6.0, NS);                         // 개수대 3칸(서벽)
  [-1, 0, 1].forEach(k => dBox(0.5, 0.03, 0.8, 0x8fa3b0, kx0 + 0.52, 0.85, kz0 + 6.0 + k * 0.95));
  addBox(1.3, 1.5, 0.8, 0xc9ced3, kx0 + 0.8, 0, Dm.z[0] - 3.6, NS); dBox(1.4, 0.7, 0.9, 0xb9bec2, kx0 + 0.8, 1.5, Dm.z[0] - 3.6);   // 식기세척기 + 후드
  [kx0 + 1.1, kx0 + 2.5].forEach(x9 => { addBox(1.3, 2.0, 0.8, 0xdfe3e6, x9, 0, Dm.z[0] - 0.55, NS); dBox(0.03, 0.5, 0.05, 0x8a9096, x9 + 0.2, 1.0, Dm.z[0] - 0.14); });   // 냉장고 2(당직실 북벽 앞)
  [SC - 1.2, SC + 1.2].forEach(z9 => { addBox(0.7, 0.9, 1.0, 0xc4c9cd, HX - 0.6, 0, z9, NS); });   // 배식창 뒤 급식 수레
  addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 0.6, NS); addBox(0.45, 1.8, 0.45, 0x7a8a9a, Dm.x[1] + 0.4, 0, kz1 - 1.1, NS);   // 조리원 옷장(조리실 쪽 주복도 문 옆)
  addBox(kx1-kx0+0.8, 0.3, kz1-kz0+0.8, 0x6b4a3a, (kx0+kx1)/2, KH, (kz0+kz1)/2);                        // 갈색 지붕(위성)
  hangSign('급식실', K.doorC, 2.78, fz0, 1); sign('출구', K.exitC, 2.35, fz0 + 0.22, 0, 0.26); sign('조리실', K.staffDoorC, 2.35, fz0 + 0.22, 0, 0.26);
  // 급식동 남벽 윗부분(복도 벽은 FH까지): 식당 쪽 절반은 FH부터, 바깥(본관 지붕 위) 절반은 지붕 윗면(FH+0.3)부터 — 지붕 슬래브와 겹침 금지
  addBox(kx1 - kx0 + 0.3, KH - FH, 0.15, 0xbcc8ca, (kx0 + kx1)/2, FH, fz0 - 0.075);
  addBox(kx1 - kx0 + 0.3, KH - FH - 0.3, 0.15, WALL, (kx0 + kx1)/2, FH + 0.3, fz0 + 0.075);
  {                                                        // 당직실(급식동 남서 모서리)
    const D = K.dutyRoom;
    addBox(0.3, KH, D.z[1] - D.z[0] - 0.3, INNER, D.x[1], 0, (D.z[0] + D.z[1]) / 2);
    addBox(D.x[1] + 0.15 - (D.x[0] + 0.15), KH, 0.3, INNER, (D.x[0] + D.x[1]) / 2 + 0.15, 0, D.z[0]);
    officeDesk(D.doorC - 0.6, 0, D.z[0] + 1.5);
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
    // 로비 동벽 = 마당 쪽 유리 벽(남쪽 끝에 유리 양문 — 사용자 09-24 "지킴이 쉼터 그 오른쪽으로 나가는 곳"), 북쪽(노치) 유리 벽
    wallZ(lz0, lz1, lx1, WALL, { face: 1, gaps: [{ c: lz1 - 1.3, w: 2.0, glass: true, door: true }, { c: (lz0 + lz1 - 2.3) / 2 - 0.05, w: lz1 - 2.3 - lz0 - 0.3 - 0.1, sill: 0.45, dh: 2.9, win: true, frame: 0x6b7278 }] });
    wallX(cx1 - 0.15, lx1 + 0.15, lz0, WALL, { face: -1, gaps: [{ c: (cx1 + lx1) / 2, w: lx1 - cx1 - 0.5, sill: 0.45, dh: 2.9, win: true, frame: 0x6b7278 }] });
    dBox(lx1 - cx1 - 0.4, 0.5, 0.05, 0xe8e2d0, (cx1 + lx1)/2, 2.9, lz0 + 0.18);      // 유리 위 말아 올린 블라인드(영상 c_344)
    floorQ('tileG', lx0 + 0.15, lx1 - 0.15, lz0 + 0.15, lz1 + 0.15);   // 남쪽 = 주복도 검은 띠와 맞댐(트임 문턱 자리까지)
    addPanel(1.6, 1.2, 0x7a5a42, (lx0 + lx1)/2 - 0.8, 0.02, (lz0 + lz1)/2 + 0.2);   // 가운데 갈색 매트
    // 배움터지킴이 책상(북쪽 유리 앞·남쪽을 봄) + 괘종시계(책상 서쪽) + 선풍기
    const dkx = 15.0, dkz = lz0 + 0.95;   // 아치에서 보면 거의 정면 약간 오른쪽(영상 e_338·c_344)
    addBox(2.2, 1.05, 0.75, 0xe8e6de, dkx, 0, dkz, NS);
    dBox(2.24, 0.04, 0.79, 0xcfcac0, dkx, 1.05, dkz);
    dBox(2.1, 0.8, 0.03, 0xb9b5aa, dkx, 0.12, dkz + 0.39);                         // 앞판 두 칸
    chair(dkx + 0.4, 0, dkz - 0.55, -1, 0x3a3d44);
    dCyl(0.12, 0.14, 0.05, 0xf2f2f2, dkx - 0.7, 1.09, dkz); dCyl(0.015, 0.015, 0.3, 0xdcdcdc, dkx - 0.7, 1.14, dkz, { seg: 6 }); dCyl(0.2, 0.2, 0.06, 0xeef2f5, dkx - 0.7, 1.44, dkz + 0.03, { seg: 14, rot: [Math.PI / 2, 0, 0] });
    addBox(0.5, 1.95, 0.4, 0x3a2a22, cx1 - 0.3, 0, lz0 + 0.4, NS);              // 괘종시계(책상 서쪽 — 세로복도 입구 옆)
    dBox(0.34, 0.34, 0.04, 0xf4efe0, cx1 - 0.3, 1.45, lz0 + 0.62);
    dBox(0.08, 0.5, 0.03, 0xd8b35a, cx1 - 0.3, 0.75, lz0 + 0.615);                  // 시계추
    sign('배움터지킴이', dkx, 1.55, dkz + 0.4, 0, 0.18);
    hotspots.push({ kind: 'visit', x: dkx, z: dkz + 1.0, y: 0, r: 1.1, label: '방문록에 이름 쓰기' });
    hotspots.push({ kind: 'clock', x: cx1 - 0.3, z: lz0 + 1.1, y: 0, r: 0.9, label: '괘종시계 보기' });
    // 로비 서벽·세로복도 입구 붉은 벽돌 벽 앞 큰 화분 셋(영상 c_350~352)
    [lz1 - 0.7, lz1 - 1.6, lz0 - 0.6].forEach(z9 => bigPot(cx0 + 0.45, 0, z9));
    zones.push({ x0: lx0, x1: lx1, z0: lz0, z1: lz1, y: 0, label: '가운데 로비' });
    ceil(lx0, lx1, lz0, lz1 + 0.16, FH, 'coffer');
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => lamp(0.55, 0.04, 0.55, (lx0 + lx1)/2 + sx * 1.8, FH - 0.2, (lz0 + lz1)/2 + sz * 0.9));
    // ---- 세로복도(x 10~13.6): 서벽 = 급식실 창 + 주황·연두 소파, 동벽 = 처음 1.5m만 마당 창(노치) 뒤는 2학년 벽, 북끝 = 나무틀 창 ----
    wallRun('z', NOTCH_Z + 0.15, lz0 - 0.15, cx1, WALL, { face: 1, gaps: [{ c: (NOTCH_Z + lz0) / 2, w: lz0 - NOTCH_Z - 0.5, sill: 0.5, dh: 2.6, win: true }] });
    floorQ('tileG', cx0 + 0.15, cx1 - 0.15, cz0 + 0.15, lz0 + 0.15);
    [-44.4, -40.8].forEach(z9 => {                                                 // 주황·연두 줄무늬 소파(창 아래)
      colliders.push({ x0: cx0 + 0.15, x1: cx0 + 0.85, y0: 0, y1: 0.45, z0: z9 - 1.1, z1: z9 + 1.1 });
      for (let k = 0; k < 4; k++) { const c9 = k % 2 ? 0x8cc26a : 0xf0a04b, zz = z9 - 1.1 + 0.275 + k * 0.55;
        dBox(0.6, 0.42, 0.55, c9, cx0 + 0.45, 0.03, zz); dBox(0.18, 0.4, 0.55, c9, cx0 + 0.24, 0.45, zz); }
      dBox(0.66, 0.03, 2.24, 0x9aa0a6, cx0 + 0.48, 0, z9);
    });
    [[cx1 - 0.35, NOTCH_Z + 0.4], [cx1 - 0.35, lz0 - 0.4]].forEach(([x9, z9]) => potPlant(x9, 0, z9, 1.4, true));
    greenBoard('z', -48.2, -46.2, cx1 - 0.15, -1, 1.0, 2.2, 'notice');
    zones.push({ x0: cx0, x1: cx1, z0: cz0, z1: lz0, y: 0, label: '세로복도' });
    ceil(cx0, cx1, B.eastWing.z[0] + B.eastWing.corridorDepth - 0.16, lz0 + 0.16, FH, 'coffer');   // 북끝(동관 복도 줄)은 동관 복도 천장 몫
    [-48.2, -44.4, -40.6].forEach(z9 => lamp(0.55, 0.04, 0.55, (cx0 + cx1)/2, FH - 0.2, z9));
    // 지붕(흰색): 세로복도 · 로비(남단 = 본관 지붕과 맞댐 z-33.98). 동관 초록 지붕과는 x 13.6에서 맞댐
    addBox(cx1 - cx0 - 0.15, 0.3, lz0 - cz0 + 0.4, 0xe6e7e3, (cx0 + 0.15 + cx1)/2, FH, (cz0 - 0.4 + lz0)/2);
    addBox(lx1 - lx0 - 0.15 + 0.4, 0.3, lz1 + 0.02 - lz0, 0xe6e7e3, (lx0 + 0.15 + lx1 + 0.4)/2, FH, (lz0 + lz1 + 0.02)/2);
    // ---- 가운데 마당(영상 v2180_0102~0129): 적벽돌 포장(바닥 -0.05 — 로비 문 턱 없음) + 화분 향나무 줄 + 동관 앞 화단 + 로비 문 밖 청록 고무 바닥 ----
    const MZ0 = NOTCH_Z + 0.15, MZ1 = fz0 - 0.15, MX1 = E.x[1] + 0.15;
    addBox(lx1 + 0.15 - (cx1 + 0.15), COURT - YARD, lz0 - 0.15 - MZ0, 0xb4806a, (cx1 + 0.15 + lx1 + 0.15)/2, YARD, (MZ0 + lz0 - 0.15)/2);   // 노치
    addBox(MX1 - (lx1 + 0.15), COURT - YARD, MZ1 - MZ0, 0xb4806a, (lx1 + 0.15 + MX1)/2, YARD, (MZ0 + MZ1)/2);
    patQuad('brick', cx1 + 0.15, lx1 + 0.15, MZ0, lz0 - 0.15, COURT + 0.012);
    patQuad('brick', lx1 + 0.15, MX1, MZ0, lz1 - 2.8, COURT + 0.012);
    patQuad('brick', lx1 + 3.6, MX1, lz1 - 2.8, MZ1, COURT + 0.012);
    patQuad('teal', lx1 + 0.15, lx1 + 3.6, lz1 - 2.8, MZ1, COURT + 0.012);
    // 로비 마당 문 위 청록 유리 차양 + 가는 기둥 둘(영상 b_129~132)
    dBox(1.8, 0.06, 2.6, 0x6fb3a8, lx1 + 1.05, 2.8, lz1 - 1.35);
    [lz1 - 2.55, lz1 - 0.3].forEach(z9 => { dRod(lx1 + 1.85, COURT, z9, lx1 + 1.85, 2.8, z9, 0.04, 0xc8cdd2); post(lx1 + 1.85, z9, COURT, 2.8, 0.06); });
    slope('brick', 'x', MZ0, MZ1, MX1, MX1 + 1.5, COURT, YARD, 3);                 // 동쪽 끝 완만한 비탈(마당 -0.05 → 뒤뜰 YARD)
    // 노치 노란 꽃 화단(로비 북쪽 유리 밖 — 영상 c_346~349)
    addBox(lx1 - cx1 - 0.3, 0.35, 0.7, 0x8a6a4e, (cx1 + lx1)/2, COURT, lz0 - 0.55, NS);
    for (let x9 = cx1 + 0.35; x9 < lx1 - 0.2; x9 += 0.32) dBlob(0.18, 0.14, 0.18, hash2(x9, 7) > 0.5 ? 0xf2c230 : 0xe8b020, x9, COURT + 0.45, lz0 - 0.55 + (hash2(x9, 8) - 0.5) * 0.3, { chunky: true, jitter: 0.2 });
    // 가운데 줄 화분 향나무
    for (let x9 = lx1 + 4.5; x9 < MX1 - 1.5; x9 += 4.4) {
      const pz9 = (MZ0 + MZ1)/2 + 0.3;                                              // 둥근 갈색 화분(영상 b_114~127)
      dCyl(0.44, 0.32, 0.5, 0x7a4a33, x9, COURT, pz9, { seg: 14 }); dCyl(0.47, 0.47, 0.05, 0x6a3e2a, x9, COURT + 0.5, pz9, { seg: 14 });
      colliders.push(noStand({ x0: x9 - 0.42, x1: x9 + 0.42, y0: COURT, y1: COURT + 0.55, z0: pz9 - 0.42, z1: pz9 + 0.42 }));
      dBlob(0.4, 0.45, 0.4, 0x3f7a3f, x9, COURT + 0.95, (MZ0 + MZ1)/2 + 0.3, { far: true, ry: x9, jitter: 0.1 });
      dBlob(0.28, 0.3, 0.28, 0x4d8b4d, x9, COURT + 1.45, (MZ0 + MZ1)/2 + 0.3, { far: true, ry: x9 + 1, jitter: 0.1 });
    }
    // 동관 남벽 앞 화단(꽃) · 본관 벽 앞 흰 상자(야외 개수대)
    addBox(MX1 - 0.6 - (lx1 + 0.4), 0.35, 0.8, 0x6b4a36, (lx1 + 0.4 + MX1 - 0.6)/2, COURT, MZ0 + 0.4);
    patQuad('grass', lx1 + 0.45, MX1 - 0.65, MZ0 + 0.05, MZ0 + 0.75, COURT + 0.36, false, 0xcfe6b8);
    for (let x9 = lx1 + 0.8; x9 < MX1 - 0.9; x9 += 0.9) dBlob(0.16, 0.14, 0.16, [0xe8627a, 0xf2c230, 0xf08a5d, 0xb37fd6][Math.floor(hash2(x9, 9) * 4)], x9, COURT + 0.52, MZ0 + 0.4, { chunky: true });
    [MX1 - 12, MX1 - 6].forEach(x9 => addBox(1.2, 0.85, 0.5, 0xe9ebe8, x9, COURT, MZ1 - 0.25, NS));
    zones.push({ x0: lx1, x1: MX1, z0: MZ0, z1: MZ1, y: COURT, label: '가운데 마당' });
  }

  // ================= 동관 (2학년·4학년·과학실·과학준비실 + 동끝 창고) =================
  const E = B.eastWing, [ex0, ex1] = E.x, [ez0, ez1] = E.z, zCE = ez0 + E.corridorDepth;
  const endX = E.rooms.find(r => r.external).span[0];                                // 복도 동쪽 끝 = 창고 서벽
  foundation(ex0, ex1 + 0.15, ez0 - 0.15, ez1);
  foundation(ex0, ex1 + 0.15, ez1, ez1 + 0.15);
  wallX(ex0 - 0.15, ex1 + 0.15, ez1, WALL, { face: 1, skin: 'panelB', gaps: E.rooms.filter(r => !r.external).flatMap(r => {
    const n = Math.max(1, Math.round((r.span[1] - r.span[0]) / 4.3)), seg = (r.span[1] - r.span[0] - 0.8) / n;
    return [...Array(n).keys()].map(k => ({ c: r.span[0] + 0.4 + seg * (k + 0.5), w: Math.min(2.4, seg - 0.6), sill: 0.95, dh: 2.6, win: true })); }) });
  wallX(LC.x[0] + 0.15, ex1 + 0.15, ez0, WALL, { wins: 9, face: -1, skin: 'panelB', gaps: [{ c: (LC.x[0] + LC.x[1]) / 2, w: 2.2, sill: 0.9, dh: 2.5, win: true }] });   // 북벽(세로복도 북끝 창 포함)
  // 동벽: 창고 바깥 문(넓은 여닫이 — 영상 b_088)만. ⚠️복도 동쪽 끝엔 문이 없다(사용자 "그쪽 복도에서 바깥으로 나가는 곳은 없음")
  wallZ(ez0, ez1, ex1, WALL, { face: 1, skin: 'panelB', gaps: [{ c: (ez0 + ez1) / 2 + 0.6, w: 2.0, door: true }, { c: ez1 - 1.4, w: 1.2, sill: 1.2, dh: 2.4, win: true }] });
  wallRun('z', zCE + 0.15, ez1 - 0.15, ex0, INNER, {});                                          // 세로복도 동벽 = 2학년 서벽(노치 창은 로비 쪽에서)
  const eGaps = E.rooms.filter(r => !r.innerOnly && !r.external).map(r => ({ c: doorC(r), w: 1.2 }));
  E.rooms.filter(twoDoor).forEach(r => eGaps.push(backDoor(r)));
  wallX(ex0 - 0.15, endX - 0.15, zCE, INNER, { gaps: eGaps, sill: 2.15, wh: 0.6, wins: 8 });      // 복도 남벽: 교실 문 + 높은 창(영상 c_365~373)
  wallZ(ez0, ez1, endX, INNER, {});                                                                // 창고 서벽 = 복도 동쪽 끝 판벽
  { // 복도 바닥: 황갈 장판 + 양쪽 짙은 테두리(영상 c_364~373)
    const x0 = ex0 - 0.15, x1 = endX - 0.15, z0 = ez0 + 0.15, z1 = zCE - 0.15;
    addPanel(x1 - x0, 0.2, 0x4a4d52, (x0 + x1)/2, 0.012, z0 + 0.1); addPanel(x1 - x0, 0.2, 0x4a4d52, (x0 + x1)/2, 0.012, z1 - 0.1);
    floorQ('ecor', x0, x1, z0 + 0.2, z1 - 0.2);
    for (let x9 = ex0 + 1; x9 < endX - 1; x9 += 7) extinguisher(x9, 0, z0 + 0.14);   // 소화기(북벽 밑)
    for (let x9 = ex0 + 2; x9 < endX - 1; x9 += 4) lamp(0.62, 0.05, 0.3, x9, FH - 0.21, (ez0 + zCE)/2);
    ceil(LC.x[0], endX, ez0, zCE + 0.16, FH, 'cflat');
    zones.push({ x0: ex0, x1: endX, z0: ez0, z1: zCE, y: 0, label: '동관 복도' });
  }
  E.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2;
    if (i > 0 && !r.external) {
      if (r.innerOnly) wallZ(zCE, ez1, s0, INNER, { gaps: [{ c: (zCE + ez1) / 2, w: 1.0 }] });   // 과학실 → 준비실 안쪽 문
      else addBox(0.3, FH, ez1 - zCE - 0.3, INNER, s0, 0, (zCE + ez1)/2);
    }
    const z0 = (r.external ? ez0 : zCE) + 0.15, x0 = s0 + 0.15, x1 = s1 - 0.15;
    floorQ(r.external ? 'tileW' : r.type === 'storage' ? 'tileW' : 'wood', x0, x1, z0, ez1 - 0.15, 0, r.external ? 0xb9b6ae : 0xffffff);
    zones.push({ x0: s0, x1: s1, z0: r.external ? ez0 : zCE, z1: ez1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'science') {
      const nx = E.rooms[i + 1], prep = nx && nx.innerOnly ? [(zCE + ez1) / 2 - 0.9, (zCE + ez1) / 2 + 0.9] : null;   // 동벽 = 준비실 안쪽 문(과학실)
      westClass(r.name, s0 + 0.15, s1 - 0.15, zCE + 0.15, ez1 - 0.15, 0, { top: r.type === 'science' ? 0x8fc46a : 0xc9a06a, sill: 0.9, backGap: prep });   // 서향 교실
      [1, 2, 3].forEach(k => [-1, 1].forEach(sd => lamp(1.2, 0.05, 0.22, cx + sd * (s1 - s0) * 0.22, FH - 0.21, zCE + k * 2.3)));
    } else if (r.innerOnly) [ez1 - 0.6, zCE + 0.6].forEach(z9 => addBox(s1 - s0 - 0.6, 1.9, 0.5, 0x9aa0a6, cx, 0, z9));
    else if (r.external) { [ez0 + 0.6, ez0 + 2.0].forEach(z9 => addBox(s1 - s0 - 0.8, 1.6, 0.6, 0x8a9096, cx - 0.2, 0, z9));   // 체육 기구 선반·매트
      addBox(1.6, 0.4, 1.2, 0x3f6fb0, cx - 0.3, 0, ez1 - 1.4); }
    if (!r.innerOnly && !r.external) hangSign(r.name, doorC(r), 2.78, zCE, -1);
    ceil(s0, s1, r.external ? ez0 : zCE, ez1, FH, r.external ? 'cflat' : 'ctile');
  });
  addBox(endX - ex0 + 0.4, 0.3, ez1 - ez0 + 0.8, 0x4f9a6c, (ex0 + endX + 0.4)/2, FH, (ez0 + ez1)/2);            // 초록 지붕
  addBox(ex1 + 0.4 - (endX + 0.4), 0.3, ez1 - ez0 + 0.8, 0xe6e7e3, (endX + 0.4 + ex1 + 0.4)/2, FH, (ez0 + ez1)/2);   // 창고 흰 지붕(위성)
  roofRail(ex0, ez1 + 0.3, ex1 + 0.3, ez1 + 0.3, FH + 0.3); roofRail(LC.x[0] + 0.15, ez0 - 0.3, ex1 + 0.3, ez0 - 0.3, FH + 0.3);   // 옥상 난간(마당 쪽·북쪽 — 북쪽은 세로복도 지붕까지)
  roofRail(ex1 + 0.3, ez0 - 0.3, ex1 + 0.3, ez1 + 0.3, FH + 0.3);
  sign('창고', ex1 + 0.2, 2.5, (ez0 + ez1) / 2 + 0.6, Math.PI / 2, 0.34);

  // ================= 체육관 (위성 31 × 26.7 본실 + 동쪽 부속동 · 바닥 GYF = 대지 + 3단) =================
  const G = SCHOOL.gym, gx = G.center[0], gz = G.center[1], GA = G.annex, GDZ = G.doorZ;
  const gx0 = gx-G.width/2, gx1 = gx+G.width/2, gz0 = gz-G.depth/2, gz1 = gz+G.depth/2;
  const GH = G.wallHeight, GB = 0xa8503a;
  foundation(gx0 - 0.15, gx1 + 0.15, gz0 - 0.15, gz1 + 0.15, GYF);
  foundation(gx1 + 0.15, GA.x[1] + 0.15, GA.z[0] - 0.15, GA.z[1] + 0.15, GYF);
  // 본실 벽: 아래 적벽돌(3.2) + 위 회색 골판·고측창. 동벽은 부속동과 공유(안쪽 문 = 전실 · 창고 문)
  wallX(gx0 - 0.15, gx1 + 0.15, gz0, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickW', face: -1 });
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickW', face: 1 });
  wallZ(gz0, gz1, gx0, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickW', face: -1 });
  wallZ(gz0, gz1, gx1, GB, { y0: GYF, h: 3.2, ext: true, innerHex: 0xc9a77a, skin: 'brickW', face: 1, gaps: [{ c: GDZ, w: 2.2, door: true }, { c: -13, w: 2.2, door: true }] });
  wallX(gx0 - 0.15, gx1 + 0.15, gz0, 0xa8a096, { y0: GYF + 3.2, h: GH - 3.2, wins: 8, sill: 2.2, wh: 1.4, frame: 0x9aa0a6 });
  wallX(gx0 - 0.15, gx1 + 0.15, gz1, 0xa8a096, { y0: GYF + 3.2, h: GH - 3.2, wins: 8, sill: 2.2, wh: 1.4, frame: 0x9aa0a6 });
  wallZ(gz0, gz1, gx0, 0xa8a096, { y0: GYF + 3.2, h: GH - 3.2 });
  wallZ(gz0, gz1, gx1, 0xa8a096, { y0: GYF + 3.2, h: GH - 3.2 });
  floorQ('gymw', gx0 + 0.15, gx1 - 0.15, gz0 + 0.15, gz1 - 0.15, GYF);
  {   // 겉모습·코트(DETAIL-7): 상부 회색 세로 골판·돌 띠·지붕 트림 / 코트 선·가운데 원·농구 링
    const RIB = 0x9a9288, TRIM = 0xdfe3e6, Y3 = GYF + 3.2;
    const ribs = (ax, a0, a1, line, f) => { for (let a = a0 + 0.5; a < a1 - 0.4; a += 0.8) [[Y3 + 0.15, Y3 + 2.05], [Y3 + 3.75, GYF + GH - 0.05]].forEach(([y0, y1]) => {
      if (ax === 'x') dBox(0.1, y1 - y0, 0.04, RIB, a, y0, line + f*0.17); else dBox(0.04, y1 - y0, 0.1, RIB, line + f*0.17, y0, a); }); };
    ribs('x', gx0, gx1, gz0, -1); ribs('x', gx0, gx1, gz1, 1); ribs('z', gz0, gz1, gx0, -1); ribs('z', gz0, GA.z[0] - 0.3, gx1, 1); ribs('z', GA.z[1] + 0.3, gz1, gx1, 1);
    dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz0 - 0.2); dBox(G.width + 0.4, 0.15, 0.1, TRIM, gx, Y3 - 0.1, gz1 + 0.2);
    dBox(0.1, 0.15, G.depth + 0.2, TRIM, gx0 - 0.2, Y3 - 0.1, gz);
    dBox(G.width + 1.04, 0.2, G.depth + 1.04, TRIM, gx, GYF + GH + 0.1, gz, { far: true });
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
  {   // 부속동(전실·화장실·체육 창고) — 현관 = 동벽 북쪽(영상 g_102~109: 캐릭터 유리문·벽돌 기둥·3단)
    const [ax0, ax1] = GA.x, [az0, az1] = GA.z, AH = 4.4, CZ0 = GDZ - 1.4, CZ1 = GDZ + 1.4, TZ = CZ1 + 2.2;
    wallX(gx1 + 0.15, ax1 + 0.15, az0, GB, { y0: GYF, h: AH, ext: true, skin: 'brickW', face: -1, wins: 1, sill: 1.6, wh: 0.8 });
    wallX(gx1 + 0.15, ax1 + 0.15, az1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickW', face: 1, wins: 1, sill: 1.6, wh: 0.8 });
    wallZ(az0, az1, ax1, GB, { y0: GYF, h: AH, ext: true, skin: 'brickW', face: 1, gaps: [{ c: GDZ, w: 2.4, glass: true, door: true }, { c: (TZ + az1)/2, w: 2.4, sill: 1.6, dh: 2.6, win: true }] });
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
    ceil(gx1, ax1, az0, az1, GYF + 3.2 + 0.15, 'ctile');
    zones.push({ x0: gx1, x1: ax1, z0: CZ0, z1: CZ1, y: GYF, label: '체육관 전실' });
    zones.push({ x0: gx1, x1: ax1, z0: TZ, z1: az1, y: GYF, label: '체육 창고' });
    // 현관 밖: 참(GYF) + 동쪽 3단 + 벽돌 기둥 둘 + 크림 차양(노랑 테) · 참 남쪽으로 경사로(크림 낮은 벽 — 영상 g_093~101)
    const LX1 = ax1 + 1.7;
    addBox(LX1 - ax1 - 0.15, GYF - YARD, CZ1 - CZ0 + 1.0, STONE, (ax1 + 0.15 + LX1)/2, YARD, GDZ);
    addBox(0.35, GYF - 0.15 - YARD, CZ1 - CZ0 + 1.0, STONE, LX1 + 0.175, YARD, GDZ);
    addBox(0.35, GYF - 0.3 - YARD, CZ1 - CZ0 + 1.0, STONE, LX1 + 0.525, YARD, GDZ);
    patQuad('gmat', ax1 + 0.2, ax1 + 1.4, GDZ - 1.0, GDZ + 1.0, GYF + 0.012);
    [-1, 1].forEach(sd => addBox(0.45, 2.95, 0.45, GB, LX1 - 0.3, GYF, GDZ + sd * 1.6));
    addBox(LX1 - ax1 + 0.05, 0.2, 4.6, 0xf1ead8, (ax1 + 0.15 + LX1 + 0.2)/2, GYF + 2.95, GDZ);
    dBox(0.08, 0.28, 4.76, YEL, LX1 + 0.24, GYF + 2.91, GDZ, { far: true });
    sign('체육관', LX1 + 0.3, GYF + 3.35, GDZ, Math.PI/2, 0.5);
    const RZ0 = GDZ + (CZ1 - CZ0 + 1.0)/2, RZ1 = RZ0 + 6.8;
    slope('pave', 'z', ax1 + 0.15, ax1 + 1.45, RZ0, RZ1, GYF, YARD, 9);
    addBox(0.15, 0.9 + GYF - YARD, RZ1 - RZ0, 0xefe3b8, ax1 + 1.525, YARD, (RZ0 + RZ1)/2, NS);
    zones.push({ x0: ax1, x1: LX1 + 0.7, z0: CZ0 - 0.5, z1: CZ1 + 0.5, y: GYF, label: '체육관 현관' });
  }
  // 지붕(위성 확대: 본 지붕 = 밝은 회색 금속 · 붉은 띠 = 북쪽 3.6m 무대 띠만 한 단 낮게). 두 판은 z = 띠 경계에서 맞대기만
  { const BZ = gz0 + 3.6, gzc = (BZ + gz1 + 0.5) / 2, gd = gz1 + 0.5 - BZ;
    addBox(G.width+1, 0.4, BZ - gz0 + 0.5, 0xc35233, gx, GYF + GH, (gz0 - 0.5 + BZ) / 2);
    addBox(G.width+1, 0.4, gd, 0xb9bcba, gx, GYF + GH, gzc);
    addBox(G.width+0.4, 0.5, gd*0.72, 0xc3c6c4, gx, GYF + GH+0.4, gzc);
    addBox(G.width-0.2, 0.5, gd*0.36, 0xcdd0ce, gx, GYF + GH+0.9, gzc); }
  zones.push({ x0: gx0, x1: gx1, z0: gz0 + 3.6, z1: gz1, y: GYF, label: '체육관' });
  // 비상구 유도등(바깥으로 나가는 문 위 인방 · 문 높이 2.6 위): 현관 자동문(홀 쪽)·측문·계단홀 뒷문·로비 마당 문·급식실 뒷문·체육관 전실 문·부속동 현관
  exitSign(hc, EZI - 0.15, 2.74, [0, -1]);
  exitSign(wx0 + 0.15, SIDE_Z, 2.74, [1, 0]);
  exitSign(wx1 - 0.15, -37.9, 2.74, [-1, 0]);
  exitSign(CL.x[1] - 0.15, CL.z[1] - 1.3, 2.74, [-1, 0]);
  exitSign(K.backDoorC, kz0 + 0.15, 2.74, [0, 1]);
  exitSign(gx1 - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  exitSign(GA.x[1] - 0.15, GDZ, GYF + 2.74, [-1, 0]);
  ceil(gx0, gx1, gz0, gz1, GYF + GH, 'ctile');

  // ================= 앞뜰 (영상 f_132~186·p_146~163 · 위성): 건물 → 자갈 띠 → 북 화단(둥근 회양목) → 산책로(점자블록) → 남 화단(전정 소나무) → 잔디 둔덕 =================
  const FY = SCHOOL.frontYard, PR = SCHOOL.porch, EP = SCHOOL.eastPath, fzW = fz1 + 0.15;
  const WX0 = -42.5, WX1 = 53.5;                                              // 산책로 동서 끝(서 = 체육관 앞길, 동 = 본관 동쪽 뒤뜰 길)
  {
    const N0 = FY.walkN, S0 = FY.walkS, C = 0.12, TX = (N0 + S0) / 2;
    // 자갈 띠·북 화단(현관 돌출부 자리 비움)
    [[fx0 - 0.15, EN.x[0]], [EN.x[1], fx1 + 0.15]].forEach(([a, b]) => {
      patQuad('gravel', a, b, fzW, FY.strip, YARD + 0.012);
      patQuad('grass', a, b, FY.strip, N0 - C, YARD + 0.012, false, 0xe9f2df);
    });
    patQuad('grass', fx1 + 0.15, WX1 + 3, fz1 - 10, N0 - C, YARD + 0.012, false, 0xe9f2df);   // 본관 동쪽 끝 잔디(뒤뜰 길까지)
    // 산책로: 경계석(북·남) + 보도블록 + 가운데 노란 점자블록. 현관 앞은 북 경계석을 끊는다
    [[WX0, EN.x[0]], [EN.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, N0 - C/2, { far: true }));
    [[WX0, EP.x[0]], [EP.x[1], WX1]].forEach(([a, b]) => dBox(b - a, 0.08, C, 0xa9a59c, (a + b)/2, YARD, S0 + C/2, { far: true }));   // 남 경계석(동쪽 통학로 갈림목은 끊음)
    patQuad('pave', WX0, WX1, N0, TX - 0.15, YARD + 0.02); patQuad('pave', WX0, WX1, TX + 0.15, S0, YARD + 0.02);
    patQuad('tactX', WX0, WX1, TX - 0.15, TX + 0.15, YARD + 0.02);
    // 남 화단(구령대 테라스 자리 비움) — 서쪽은 체육관 앞 대지 끝(-40.5)까지
    [[TR3.westX, PR.x[0]], [PR.x[1], EP.x[0]], [EP.x[1], 60]].forEach(([a, b]) => patQuad('grass', a, b, S0 + C, TERR_Z, YARD + 0.012, false, 0xe2eed6));
    // FRONT-2(영상 g_115~f_183·u_272 대조): 북 화단 = 넓적한 회양목 두 줄(엇갈려 닿게) + 옆으로 퍼진 소나무, 남 화단 = 산책로 가 회양목 한 줄 + 큰 전정 소나무 + 층층 공 향나무
    const MC = [0x6a9444, 0x5f8a3e, 0x74a04c];                                        // 영상 회양목 = 노란 기 도는 연두
    const NP = [-34.5, -16.5, -4.0, 4.6];                                             // 북 화단 퍼진 소나무 자리(영상 g_121·f_141·f_147·f_150)
    for (let x9 = fx0 + 1.0, k = 0; x9 < fx1 - 0.5; x9 += 1.5, k++) {
      if (x9 > EN.x[0] - 1.0 && x9 < EN.x[1] + 1.0) continue;
      const nearP = NP.some(px => Math.abs(px - x9) < 1.6);
      if (!nearP) mound(x9, FY.strip + 0.85, 1.75 + (k % 3) * 0.2, 0.85 + (k % 2) * 0.15, 1.35, MC[k % 3]);                  // 건물 쪽 줄
      mound(x9 + 0.75, N0 - 0.85, 1.55 + ((k + 1) % 3) * 0.2, 0.8 + ((k + 1) % 2) * 0.12, 1.25, MC[(k + 1) % 3]);         // 산책로 쪽 줄
    }
    NP.forEach((x9, k) => spreadPine(x9, FY.strip + 0.9, 1.05 + (k % 2) * 0.15));
    // 남 화단: 산책로 가 회양목 줄(구령대·교훈석·동쪽 통학로 갈림목은 비움)
    const SKIP = [[PR.x[0] - 3.0, PR.x[1] + 3.6], [EP.x[0] - 1.0, EP.x[1] + 1.0]];
    for (let x9 = TR3.westX + 1.2, k = 0; x9 < 52; x9 += 1.6, k++) {
      if (SKIP.some(([a, b]) => x9 > a && x9 < b)) continue;
      mound(x9, S0 + C + 0.75, 1.5 + (k % 3) * 0.15, 0.75 + (k % 2) * 0.12, 1.2, MC[(k + 2) % 3]);
    }
    [-37.5, -27, -13.5, -2.0, 37.0, 44.5].forEach((x9, k) => prunedPine(x9, S0 + 2.55 + (k % 2) * 0.45, 1.3 + (k % 3) * 0.15));   // 큰 전정 소나무(영상 f_132·f_147·f_180·u_272 오른쪽)
    // 구령대 동쪽 줄(영상 u_272 왼→오: 교가비·태양광 등·향나무·탑시계·향나무·정원등·향나무·가로등·소나무) + 교훈석 서쪽 향나무(f_147)
    [[23.3, S0 + 2.5], [28.0, S0 + 2.7], [32.4, S0 + 2.4], [6.3, S0 + 2.6]].forEach(([x9, z9], k) => ballJuniper(x9, z9, 1.0 + (k % 2) * 0.12));
    { const lx9 = 30.2, lz9 = S0 + 1.2;                                               // 검은 정원등(각진 등갓 — u_272·f_174)
      post(lx9, lz9, YARD, YARD + 1.7, 0.08); dCyl(0.04, 0.05, 1.45, 0x22252a, lx9, YARD, lz9, { far: true, seg: 6 });
      dBox(0.24, 0.34, 0.24, 0x22252a, lx9, YARD + 1.45, lz9, { far: true }); lamp(0.17, 0.24, 0.17, lx9, YARD + 1.5, lz9); dBox(0.3, 0.05, 0.3, 0x22252a, lx9, YARD + 1.79, lz9, { far: true }); }
    { const lx9 = 34.6, lz9 = S0 + 1.3;                                               // 가로등(키 5m·LED 머리 — u_272 오른쪽)
      post(lx9, lz9, YARD, YARD + 5.2, 0.1); dCyl(0.05, 0.08, 5.0, 0x9aa0a6, lx9, YARD, lz9, { far: true, seg: 8 });
      dRod(lx9, YARD + 4.9, lz9, lx9 - 0.6, YARD + 5.05, lz9, 0.03, 0x9aa0a6, { far: true }); dBox(0.5, 0.08, 0.2, 0xd9dde0, lx9 - 0.75, YARD + 4.98, lz9, { far: true }); lamp(0.4, 0.03, 0.14, lx9 - 0.75, YARD + 4.95, lz9); }
    zones.push({ x0: WX0, x1: WX1, z0: fz1, z1: FY.walkS, y: YARD, label: '앞뜰 산책로' });
  }
  {   // 구령대(영상 u_272~299): 모자이크 앞면 + 흰 갓돌 + 스테인리스 난간, 양 끝 7단 계단(앞면 따라 가운데로 오름), 위 = 짙은 고무 매트·탁자·의자
      //   차양(짙은 나무 기둥·처마·천창 2)은 현관 돌출부 앞부터 둔덕 아랫선까지 산책로를 덮는다(영상 p_153~157)
    const [px0, px1] = PR.x, pc = (px0 + px1) / 2, pw = px1 - px0, FZ = TR3.fieldZ, BZ = TERR_Z, R = YARD - FIELD;
    addBox(pw, R, FZ - BZ, 0xd7d0c2, pc, FIELD, (BZ + FZ)/2);                    // 구령대 몸체(둔덕 자리)
    patWall('mosaic', 'x', px0, px1, FIELD + 0.12, YARD - 0.1, FZ + 0.012, 1);
    dBox(pw + 0.1, 0.12, 0.3, 0xf2f0ea, pc, YARD - 0.1, FZ - 0.1);                 // 흰 갓돌
    patQuad('gmat', px0, px1, FY.walkS + 0.12, FZ - 0.25, YARD + 0.012);
    steelRail(px0 + 0.1, FZ - 0.12, px1 - 0.1, FZ - 0.12, YARD + 0.02);
    // 양 끝 계단: 서쪽 = 동쪽으로 오름(x px0-1.8~px0), 동쪽 = 서쪽으로 오름. 6단 + 마지막 턱 = 구령대 면(7단 · 1.05)
    for (let i = 0; i < 6; i++) {
      const h = R * (i + 1) / 7;
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px0 - 1.8 + 0.3 * i + 0.15, FIELD, (BZ + FZ)/2);
      addBox(0.3, h, FZ - BZ, 0xe9e6de, px1 + 1.8 - 0.3 * i - 0.15, FIELD, (BZ + FZ)/2);
      patWall('mosaic', 'x', px0 - 1.8 + 0.3 * i, px0 - 1.5 + 0.3 * i, FIELD + 0.05, FIELD + h - 0.03, FZ + 0.012, 1);
      patWall('mosaic', 'x', px1 + 1.5 - 0.3 * i, px1 + 1.8 - 0.3 * i, FIELD + 0.05, FIELD + h - 0.03, FZ + 0.012, 1);
      [px0 - 1.8 + 0.3 * i + 0.15, px1 + 1.8 - 0.3 * i - 0.15].forEach(x9 => dBox(0.3, 0.04, FZ - BZ - 0.1, 0x55585d, x9, FIELD + h, (BZ + FZ)/2 - 0.05));   // 짙은 디딤 띠
    }
    steelRail(px0 - 1.8, FZ - 0.12, px0, FZ - 0.12, FIELD, YARD);
    steelRail(px1 + 1.8, FZ - 0.12, px1, FZ - 0.12, FIELD, YARD);
    hotspots.push({ kind: 'mic', x: pc, z: FZ - 1.0, y: YARD, r: 1.5, label: '구령대 마이크 잡기' });
    [[pc - 1.4, FZ - 2.2], [pc + 1.4, FZ - 2.2]].forEach(([tx9, tz9]) => {        // 탁자·의자(영상 u_296~299)
      colliders.push(noStand({ x0: tx9 - 0.6, x1: tx9 + 0.6, y0: YARD, y1: YARD + 0.72, z0: tz9 - 0.4, z1: tz9 + 0.4 }));
      dBox(1.2, 0.05, 0.8, 0x8a6a45, tx9, YARD + 0.67, tz9);
      [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].forEach(([ox, oz]) => dBox(0.05, 0.67, 0.05, 0x3a3d44, tx9 + ox, YARD, tz9 + oz));
      [-1, 1].forEach(sd => [-0.3, 0.3].forEach(ox => chair(tx9 + ox, YARD, tz9 + sd * 0.62, sd, 0x7a5636)));
    });
    // 차양: 기둥(짙은 나무 0.45) — 남줄(둔덕 앞)·가운데 줄(산책로 남쪽 경계) / 판(짙은 나무 + 파랑 윗선) / 천창 2
    const CY = 2.95, CZ0 = EN.z[1], CZ1 = FZ;
    [[px0 + 0.3, FZ - 0.35], [pc, FZ - 0.35], [px1 - 0.3, FZ - 0.35], [px0 + 0.3, FY.walkS + 0.4], [px1 - 0.3, FY.walkS + 0.4]].forEach(([x9, z9]) => {
      addBox(0.45, CY - YARD, 0.45, DKWOOD, x9, YARD, z9);
    });
    addBox(px1 - px0 + 0.3, 0.35, CZ1 - CZ0 + 0.2, 0x2f2a26, pc + 0.15, CY, (CZ0 + CZ1)/2 + 0.1);
    patQuad('cwood', px0, px1 + 0.3, CZ0 + 0.01, CZ1 + 0.2, CY - 0.012, true);
    [[pc - 1.2, (CZ0 + FY.walkS)/2], [pc + 1.4, FZ - 2.4]].forEach(([x9, z9]) => dBox(1.4, 0.03, 0.9, 0xa9d4ec, x9, CY - 0.03, z9, { flat: true }));   // 천창(하늘빛)
    dBox(px1 - px0 + 0.36, 0.06, 0.1, BLUE, pc + 0.15, CY + 0.35, CZ1 + 0.15);
    sign(SCHOOL.name, pc + 0.15, CY + 0.175, CZ1 + 0.215, 0, 0.3);
    zones.push({ x0: px0, x1: px1, z0: FY.walkS, z1: FZ, y: YARD, label: '구령대' });
  }
  {   // 잔디 둔덕(영상 u_283~287: 앞뜰 끝 = 옹벽이 아니라 잔디 비탈 + 아래 경계석) — 구령대·계단·동쪽 경사로 자리는 비운다
    const BZ = TERR_Z, FZ = TR3.fieldZ;
    const bank = (a, b) => { slope('grass', 'z', a, b, BZ, FZ, YARD, FIELD, 5, 0xf2f6e8); addBox(b - a, 0.15, 0.2, 0xb9b4a8, (a + b)/2, FIELD, FZ + 0.1); };
    bank(TR3.westX, PR.x[0] - 1.8); bank(PR.x[1] + 1.8, EP.x[0]); bank(EP.x[1], 60);
    slopeCap('grass', PR.x[0] - 1.8, 1, BZ, FZ, YARD, FIELD); slopeCap('grass', PR.x[1] + 1.8, -1, BZ, FZ, YARD, FIELD);
    slopeCap('grass', EP.x[0], 1, BZ, FZ, YARD, FIELD); slopeCap('grass', EP.x[1], -1, BZ, FZ, YARD, FIELD);
    // 동쪽 통학로 경사로(영상 f_186~195: 산책로 동끝 → 남쪽 운동장 옆길로 내려감)
    slope('pave', 'z', EP.x[0], EP.x[1], BZ, FZ + 2.6, YARD, FIELD, 8);
    slopeCap('pave', EP.x[0], -1, BZ, FZ + 2.6, YARD, FIELD); slopeCap('pave', EP.x[1], 1, BZ, FZ + 2.6, YARD, FIELD);
    patQuad('pave', EP.x[0], EP.x[1], FY.walkS, BZ, YARD + 0.02);
  }
  {   // 랜드마크(영상 f_146~151·u_284~290): 교훈석(구령대 서쪽 남 화단) · 교가비(동쪽) · 태양광 가로등 · 탑시계 · 게양대
    const [px0, px1] = PR.x, S1 = FY.walkS + 1.9;
    // 교훈석(영상 f_150·u_279: 산책로 남쪽 경계석에 붙은 거친 자연석 — 짙은 회색·둥근 머리 2.3m, 밝은 받침 바위)
    const SX = px0 - 1.9, SZ9 = FY.walkS + 1.0;
    dBlob(0.95, 0.3, 0.55, 0xb9b6ad, SX, YARD + 0.18, SZ9, { chunky: true, ry: 0.3, jitter: 0.12 });
    dBlob(0.5, 1.22, 0.3, 0x5d6062, SX, YARD + 1.35, SZ9, { chunky: true, ry: 0.15, jitter: 0.14 });
    dBlob(0.38, 0.5, 0.26, 0x55585a, SX + 0.08, YARD + 2.1, SZ9 - 0.02, { chunky: true, ry: 0.9, jitter: 0.14 });
    colliders.push({ x0: SX - 0.9, x1: SX + 0.9, y0: YARD, y1: YARD + 3.0, z0: SZ9 - 0.5, z1: SZ9 + 0.5 });
    sign('바르고 슬기롭게', SX, YARD + 1.45, SZ9 + 0.34, 0, 0.16, { bg: '#4f5254', fg: '#e9e4d6' });
    // 교가비(영상 u_288~291: 구령대 동쪽 넓적한 밝은 바위 + 앞면 글판)
    dBlob(1.05, 0.78, 0.48, 0xc2beb6, px1 + 2.8, YARD + 0.62, S1 + 0.3, { chunky: true, ry: 0.2, jitter: 0.12 });
    colliders.push(noStand({ x0: px1 + 1.85, x1: px1 + 3.75, y0: YARD, y1: YARD + 1.4, z0: S1 - 0.15, z1: S1 + 0.75 }));
    dBox(0.9, 0.55, 0.05, 0x6f6a62, px1 + 2.8, YARD + 0.62, S1 + 0.72, { far: true });
    sign('교가', px1 + 2.8, YARD + 0.9, S1 + 0.76, 0, 0.2, { bg: '#6f6a62', fg: '#f2ede2' });
    hotspots.push({ kind: 'song', x: px1 + 2.8, z: S1 + 1.3, y: YARD, r: 1.3, label: '교가 흥얼거리기' });
    const LX = px1 + 4.8, LZ = S1 + 0.5;                                            // 태양광 가로등(DETAIL-6)
    post(LX, LZ, YARD, YARD + 4.2, 0.1);
    dCyl(0.06, 0.1, 4.3, 0x9aa0a6, LX, YARD, LZ, { far: true, seg: 8 });
    dRod(LX, YARD + 4.0, LZ, LX, YARD + 4.0, LZ + 0.75, 0.035, 0x9aa0a6, { far: true });
    dBox(0.34, 0.1, 0.5, 0xdfe3e8, LX, YARD + 3.85, LZ + 0.9, { far: true });
    lamp(0.26, 0.04, 0.4, LX, YARD + 3.81, LZ + 0.9);                                   // 등 불빛면(밤에도 빛나는 조명 재질)
    dGeo(box_, new THREE.Matrix4().compose(new THREE.Vector3(LX, YARD + 4.55, LZ), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), new THREE.Vector3(0.9, 0.05, 0.6)), 0x2b3f6b, { far: true });
    { const tx9 = px1 + 9.0, tz9 = S1 + 0.2;                                        // 탑시계(영상 u_272·u_284: 가는 은색 기둥 둘 + 네모 흰 시계 — 양면)
      [-0.28, 0.28].forEach(o => { dCyl(0.06, 0.07, 4.3, 0xc8cdd2, tx9 + o, YARD, tz9, { far: true, seg: 8 }); post(tx9 + o, tz9, YARD, YARD + 4.3, 0.08); });
      [1.2, 2.4, 3.6].forEach(h9 => dBox(0.5, 0.04, 0.05, 0x3a3d44, tx9, YARD + h9, tz9, { far: true }));   // 기둥 사이 가로살(검은 장식)
      addBox(1.0, 1.0, 0.3, 0xf5f6f8, tx9, YARD + 4.3, tz9, { collide: false });
      [-1, 1].forEach(sd => { dCyl(0.4, 0.4, 0.03, 0xffffff, tx9, YARD + 4.8, tz9 + sd * 0.165, { rot: [Math.PI / 2, 0, 0], seg: 20, far: true });
        dBox(0.04, 0.3, 0.03, 0x22252a, tx9, YARD + 4.8, tz9 + sd * 0.19, { far: true }); dBox(0.22, 0.04, 0.03, 0x22252a, tx9 + 0.1, YARD + 4.78, tz9 + sd * 0.198, { far: true }); }); }   // 시곗바늘(분·시 — 면이 겹치지 않게 시침을 8mm 앞)
    const [fpx, fpz] = SCHOOL.flagPole;                                             // 게양대(구령대 서쪽 — 영상 u_276)
    addBox(0.16, 10, 0.16, 0xc8cdd2, fpx, YARD, fpz);
    { // 태극기(캔버스 = taegukCanvas · 양면)
      const cv = taegukCanvas();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.93, 14, 4), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      fl.position.set(fpx + 0.78, YARD + 9.05, fpz); fl.matrixAutoUpdate = false; fl.updateMatrix(); fl.frustumCulled = false; scene.add(fl);
      flagMesh = fl;                                                                // main.js가 펄럭이게 한다(정점 75개)
    }
  }

  // ================= 운동장·놀이 시설 (FIELD) =================
  const FLD = SCHOOL.field, FCX = (TR3.westX + SCHOOL.eastFenceX) / 2, FCZ = (FLD.z[0] + SCHOOL.southFenceZ) / 2;
  addPanel(0.3, SCHOOL.southFenceZ - FLD.z[0] - 6, 0xf0ede4, FCX, FIELD + 0.01, FCZ);            // 가운데 선(라인기)
  // 골대(DETAIL-4) — 사용자 09-24 "4개: 동서로 큰 골대, 학교 쪽·정문 쪽에 작은(하프) 골대 — 체육관 쪽으로 붙어 있음"
  //   (x,z) = 골문 가운데, back = 그물이 뻗는 쪽 [dx,dz](운동장 바깥), s = 크기. 기둥·가로대·기운 받침틀 + 그물, 그물 충돌은 계단 3칸(골문 안은 들어감)
  function goal(x, z, back, hex, s) {
    const [bx, bz] = back, px = -bz, pz = bx, H = 2*s, D = 1.1*s, W = 2.6*s, F = { far: true }, Y = FIELD;
    const P = (u, v) => [x + px*u + bx*v, z + pz*u + bz*v];
    [-W, W].forEach(u => {
      const [ax9, az9] = P(u, 0), [mx9, mz9] = P(u, D*0.5), [ex9, ez9] = P(u, D);
      dRod(ax9, Y, az9, ax9, Y + H, az9, 0.06, hex, F); post(ax9, az9, Y, Y + H);
      dRod(ax9, Y + H, az9, mx9, Y + H - 0.1, mz9, 0.04, hex, F);
      dRod(mx9, Y + H - 0.1, mz9, ex9, Y, ez9, 0.04, hex, F);
      dRod(ax9, Y, az9, ex9, Y, ez9, 0.035, hex, F);
    });
    { const [a1, b1] = P(-W, 0), [a2, b2] = P(W, 0); dRod(a1, Y + H, b1, a2, Y + H, b2, 0.06, hex, F); }
    { const [a1, b1] = P(-W, D), [a2, b2] = P(W, D); dRod(a1, Y, b1, a2, Y, b2, 0.035, hex, F); }
    for (let i = 0; i < 3; i++) {
      const [c0x, c0z] = P(-W, D*(0.5 + i/6)), [c1x, c1z] = P(W, D*(0.5 + (i+1)/6));
      colliders.push(noStand({ x0: Math.min(c0x, c1x), x1: Math.max(c0x, c1x), y0: Y, y1: Y + (H - 0.1)*(1 - i/3), z0: Math.min(c0z, c1z), z1: Math.max(c0z, c1z) }));
    }
    for (let k = -W + 0.5; k < W; k += 0.5) { const [s0x, s0z] = P(k, D*0.5), [s1x, s1z] = P(k, D); dRod(s0x, Y + H - 0.1, s0z, s1x, Y, s1z, 0.012, 0xd8dcdf); }
    for (let t = 0.25; t < 1; t += 0.25) { const v = D*(0.5 + 0.5*t), yy = Y + (H - 0.1)*(1 - t), [s0x, s0z] = P(-W, v), [s1x, s1z] = P(W, v); dRod(s0x, yy, s0z, s1x, yy, s1z, 0.012, 0xd8dcdf); }
  }
  goal(TR3.westX + 3.5, FCZ, [-1, 0], 0xe0a83a, 1.4);                           // 서쪽 큰 골대
  goal(SCHOOL.eastFenceX - 4.5, FCZ, [1, 0], 0xe0a83a, 1.4);                    // 동쪽 큰 골대
  goal(-24, FLD.z[0] + 3.0, [0, -1], 0xf0f2f4, 0.8);                             // 학교 쪽 작은 골대(체육관 쪽으로 붙음) — 가로대 1.6 > 키 1.5
  goal(-24, SCHOOL.southFenceZ - 3.2, [0, 1], 0xf0f2f4, 0.8);                    // 정문 쪽 작은 골대
  {   // 운동장 동쪽 높은 초록 철망(영상 f_192~219) · 조명탑(북변). 남쪽(쉼터·정문 쪽)은 울타리 없이 트임(사용자 09-24 "정문에서 울타리가 운동장을 가로막지 않아")
    const EF = SCHOOL.eastFenceX, FP = SCHOOL.forestPlay;
    meshFence(EF, TR3.fieldZ + 3.2, EF, FP.z[0] - 0.5, FIELD, 4.2, 0x5e8f5a, 0x4f7a4c);     // 북끝 3.2m = 통학로 → 운동장 드나드는 틈(영상 f_189)
    [-34, 30].forEach(lx => {
      post(lx, FLD.z[0] + 1.2, FIELD, FIELD + 12, 0.25);
      dCyl(0.16, 0.3, 12.6, 0xbfc4c9, lx, FIELD, FLD.z[0] + 1.2, { far: true, seg: 8 });
      dBox(2.6, 0.9, 0.2, 0xdfe3e8, lx, FIELD + 11.4, FLD.z[0] + 1.2, { far: true });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) lamp(0.6, 0.3, 0.12, lx - 0.85 + i*0.85, FIELD + 11.5 + j*0.4, FLD.z[0] + 1.36);   // 조명탑 등(밤에 빛남)
    });
    {   // 야외 농구골대(동쪽 통학로 옆)
      const bx9 = EF - 1.2, bz9 = 22;
      post(bx9, bz9, FIELD, FIELD + 3.4, 0.17);
      dCyl(0.1, 0.13, 3.4, 0x8a9096, bx9, FIELD, bz9, { far: true, seg: 8 });
      dRod(bx9, FIELD + 3.2, bz9, bx9 - 0.28, FIELD + 3.5, bz9, 0.07, 0x8a9096, { far: true });
      dBox(0.06, 1.1, 1.8, 0xf5f6f8, bx9 - 0.31, FIELD + 3.3, bz9, { far: true });
      dBox(0.03, 0.45, 0.6, 0xd94848, bx9 - 0.355, FIELD + 3.45, bz9, { far: true });
      dGeo(new THREE.TorusGeometry(0.23, 0.02, 5, 14).rotateX(Math.PI/2), new THREE.Matrix4().makeTranslation(bx9 - 0.6, FIELD + 3.45, bz9), 0xe8752a, { far: true });
    }
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
    floor4('sand', [[-46.3, 55.6], [-31, 55.6], [-31, 60.5], [-44.9, 60.5]], Y + 0.01);
    patQuad('dirt', -49.5, -31, SCHOOL.field.z[1], 45.8, Y);                                          // 운동장 흙이 난간까지(영상 s_048·s_049.5 — 잔디 없음)
    // 운동장 쪽 낮은 쇠 난간(가로봉 둘) + 검은 고무 경계석(영상 s_048~052)
    for (let x9 = -49.0; x9 <= -34.2 + 1e-6; x9 += 1.85) dRod(x9, Y, 45.8, x9, Y + 0.9, 45.8, 0.03, S9);
    [0.5, 0.9].forEach(h9 => dRod(-49.0, Y + h9, 45.8, -34.2, Y + h9, 45.8, 0.025, S9));
    colliders.push(noStand({ x0: -49.05, x1: -34.15, y0: Y, y1: Y + 0.95, z0: 45.74, z1: 45.86 }));
    dBox(PX + 49.2, 0.1, 0.12, RUB, (PX - 49.2) / 2, Y, 45.8);
    dBox(0.12, 0.1, 55.6 - 45.86, RUB, PX, Y, (45.86 + 55.6) / 2);                                   // 서쪽 끝 혀 둘레
    dBox(-31 - PX, 0.1, 0.12, RUB, (PX - 31) / 2, Y, 55.66);
    {   // 긴 스테인리스 미끄럼틀(영상 s_036·s_039~046.5 — 방위가 다른 프레임 모두 화면 가로: 왼쪽=남 계단·발판, 오른쪽=북 운동장 쪽으로 내려감)
      //   남쪽 오름틀 → 발판 1.2m → 북쪽으로 길고 낮은 판. 파랑 테 안내판(x PX-1.4) 바로 뒤(서쪽 ~2m) — s_043.5·s_045에서 판이 안내판 뒤를 지나 오른쪽(북)으로 나온다
      const mx = PX - 3.5, mz = 52.3, D = 1.2, cz0 = mz - 0.5, cz1 = cz0 - 3.3;
      dBox(1.0, 0.06, 1.0, ST, mx, Y + D - 0.06, mz);
      [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([ox, oz]) => dRod(mx + ox, Y, mz + oz, mx + ox, Y + D + 0.8, mz + oz, 0.045, S9));
      [-0.45, 0.45].forEach(ox => dRod(mx + ox, Y + D + 0.8, mz - 0.45, mx + ox, Y + D + 0.8, mz + 0.45, 0.035, S9));
      colliders.push({ x0: mx - 0.5, x1: mx + 0.5, y0: Y, y1: Y + D, z0: mz - 0.5, z1: mz + 0.5 });
      // 사다리(가파른 쇠 오름틀 — 보이지 않는 3단으로 오른다) · 남쪽(+z)
      const L9 = Math.hypot(1.0, D), a9 = Math.atan2(D, 1.0);
      [-0.3, 0.3].forEach(ox => { _dm.compose(_dv.set(mx + ox, Y + D / 2, mz + 1.0), _dq.setFromEuler(_de.set(a9, 0, 0)), _ds.set(0.05, 0.05, L9)); dGeo(box_, _dm, S9); });
      for (let k = 1; k <= 3; k++) { const t = k / 4; dRod(mx - 0.3, Y + D * t, mz + 1.5 - t, mx + 0.3, Y + D * t, mz + 1.5 - t, 0.02, S9); }
      [0.3, 0.6, 0.9].forEach((h9, k) => colliders.push({ x0: mx - 0.35, x1: mx + 0.35, y0: Y, y1: Y + h9, z0: mz + 1.1 - 0.3 * k, z1: mz + 1.4 - 0.3 * k }));
      // 긴 판(3.3m에 0.9 내려감 · 북쪽 -z) + 옆 턱 + 끝 평판. 판·턱 아래 끝을 0.16 늘려 평판 속에 묻는다(끝면이 평판 위로 나오면 역광 실선이 깜빡인다)
      const Lc = Math.hypot(3.3, 0.9), ac = Math.atan2(0.9, 3.3);
      const base9 = new THREE.Matrix4().compose(new THREE.Vector3(mx, Y + 0.3 + 0.45, (cz0 + cz1) / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-ac, 0, 0)), new THREE.Vector3(1, 1, 1));
      const E9 = 0.16, part9 = (w, h, ox, oy, hex) => dGeo(box_, base9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, -E9 / 2), new THREE.Quaternion(), new THREE.Vector3(w, h, Lc + E9))), hex, { far: true });
      part9(0.9, 0.05, 0, 0, ST); part9(0.05, 0.22, -0.47, 0.09, S9); part9(0.05, 0.22, 0.47, 0.09, S9);
      dBox(0.96, 0.08, 0.6, ST, mx, Y + 0.22, cz1 - 0.3); colliders.push({ x0: mx - 0.45, x1: mx + 0.45, y0: Y, y1: Y + 0.3, z0: cz1 - 0.6, z1: cz1 });
      dRod(mx - 0.4, Y, cz1 + 0.4, mx - 0.4, Y + 0.33, cz1 + 0.4, 0.03, S9); dRod(mx + 0.4, Y, cz1 + 0.4, mx + 0.4, Y + 0.33, cz1 + 0.4, 0.03, S9);
      [0.95, 0.65, 0.35].forEach((h9, k) => colliders.push({ x0: mx - 0.5, x1: mx + 0.5, y0: Y, y1: Y + h9, z0: cz0 - 1.1 * (k + 1), z1: cz0 - 1.1 * k }));
      hotspots.push({ kind: 'slide', x: mx, z: mz, y: Y + D, r: 1.0, label: '미끄럼틀 타기', from: [mx, Y + D, mz - 0.4], to: [mx, Y + 0.3, cz1 - 0.3] });
    }
    {   // 회색 쇠 A형 그네 1대 · 의자 2(영상 s_046.5 왼쪽)
      const x9 = -44.6, z9 = 49.8, G9 = 0x9aa0a6;
      [-1.6, 1.6].forEach(o => { dRod(x9 + o, Y, z9 - 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true }); dRod(x9 + o, Y, z9 + 0.8, x9 + o, Y + 2.3, z9, 0.05, G9, { far: true });
        colliders.push(noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 - 0.84, z1: z9 - 0.38 }), noStand({ x0: x9 + o - 0.08, x1: x9 + o + 0.08, y0: Y, y1: Y + 1.2, z0: z9 + 0.38, z1: z9 + 0.84 })); });
      dRod(x9 - 1.7, Y + 2.3, z9, x9 + 1.7, Y + 2.3, z9, 0.06, G9, { far: true });
      [-0.6, 0.6].forEach(o => { [-0.2, 0.2].forEach(d9 => dRod(x9 + o + d9, Y + 2.28, z9, x9 + o + d9, Y + 0.5, z9, 0.012, 0x8a9096));
        dBox(0.5, 0.05, 0.22, 0x26282c, x9 + o, Y + 0.45, z9);
        colliders.push(noStand({ x0: x9 + o - 0.25, x1: x9 + o + 0.25, y0: Y + 0.45, y1: Y + 2.2, z0: z9 - 0.11, z1: z9 + 0.11 })); });
    }
    {   // 철봉 두 단(영상 s_039~040.5 — 판 서쪽 모래)
      const z9 = 57.0, H9 = [1.2, 1.55];
      [-39.0, -37.8, -36.6].forEach((x9, k) => { dRod(x9, Y, z9, x9, Y + (k === 0 ? H9[0] : H9[1]) + 0.05, z9, 0.045, S9); post(x9, z9, Y, Y + 1.6, 0.07); });
      dRod(-39.0, Y + H9[0], z9, -37.8, Y + H9[0], z9, 0.025, S9); dRod(-37.8, Y + H9[1], z9, -36.6, Y + H9[1], z9, 0.025, S9);
      colliders.push({ x0: -39.0, x1: -37.8, y0: Y + H9[0] - 0.04, y1: Y + H9[0] + 0.04, z0: z9 - 0.04, z1: z9 + 0.04 });
    }
    {   // 파랑 테 안내판(글자 없이 — 영상 s_043.5~045: 두 기둥 · 판 앞면은 동쪽 마당을 봄)
      const x9 = PX - 1.4, z9 = 50.8;
      [-0.8, 0.8].forEach(o => { dRod(x9, Y, z9 + o, x9, Y + 2.1, z9 + o, 0.04, S9); post(x9, z9 + o, Y, Y + 2.1, 0.06); });
      dBox(0.05, 1.12, 1.62, 0x2f6fd0, x9 - 0.025, Y + 0.94, z9);
      dBox(0.03, 1.0, 1.5, 0xf4f4f0, x9 + 0.015, Y + 1.0, z9);
      colliders.push(noStand({ x0: x9 - 0.08, x1: x9 + 0.08, y0: Y + 0.9, y1: Y + 2.1, z0: z9 - 0.82, z1: z9 + 0.82 }));
      [[0.35, 1.8, 0.9, 0.18, 0x3a78c8], [-0.4, 1.3, 0.5, 0.45, 0x9cc3e0], [0.2, 1.3, 0.6, 0.45, 0xe3b39c], [-0.35, 1.1, 0.6, 0.12, 0x8d8d8d], [0.35, 1.1, 0.5, 0.12, 0x8d8d8d]].forEach(([oz, yy, w, h, c]) => dBox(0.03, h, w, c, x9 + 0.045, Y + yy, z9 + oz));
    }
    {   // 남서 구석 나무 덩어리(위성 · 영상 s_042 배경 — 둔덕 위 나무·떨기나무)
      [[-43, 63.2, 0.95], [-39, 65.6, 1.1], [-35, 65.0, 0.9], [-38.2, 62.2, 0.8]].forEach(([x9, z9, s9]) => bgTree(x9, z9, s9));
      [[-41, 61.3], [-36.5, 61.4], [-33.2, 62.8], [-44.2, 60.9]].forEach(([x9, z9], k) => shrub(x9, z9, 0.55 + 0.1 * (k % 2), 0x5a8a45));
    }
    zones.push({ x0: -48.5, x1: PX, z0: 45.8, z1: 60.5, y: Y, label: '놀이터' });
  }
  {   // 유치원 놀이터(네이버 항공 울타리 사각형 · 영상 g_060~085): 모래 + 미끄럼틀·흔들말 + 파랑 그늘막 + 연두 울타리
    const KP = SCHOOL.kinderPlayground, kpx = (KP.x[0] + KP.x[1])/2, kpz = (KP.z[0] + KP.z[1])/2, Y = FIELD, KW = KP.x[1] - KP.x[0], KD = KP.z[1] - KP.z[0];
    addPanel(KW - 0.3, KD - 0.3, 0xe2cf9f, kpx, Y + 0.008, kpz);
    addBox(1.4, 1.0, 1.4, 0x9c7a53, kpx - 1.5, Y, kpz - 2.5);
    addBox(1.0, 0.5, 0.4, 0xa9805a, kpx - 1.5, Y, kpz - 3.5);
    {
      const L9 = Math.hypot(0.95, 2.0), a9 = Math.atan2(0.95, 2.0);
      const M9 = new THREE.Matrix4().compose(new THREE.Vector3(kpx - 1.5, Y + 0.5 - 0.06, kpz - 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(a9, 0, 0)), new THREE.Vector3(1, 1, 1));
      const pt9 = (w, h, d, ox, oy, hex) => dGeo(box_, M9.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, 0), new THREE.Quaternion(), new THREE.Vector3(w, h, d))), hex, { far: true });
      pt9(0.8, 0.1, L9, 0, 0, 0x7fc6e8); pt9(0.06, 0.18, L9, -0.43, 0.08, 0x5aa9d6); pt9(0.06, 0.18, L9, 0.43, 0.08, 0x5aa9d6);
      colliders.push(noStand({ x0: kpx - 1.95, x1: kpx - 1.05, y0: Y, y1: Y + 0.6, z0: kpz - 1.8, z1: kpz + 0.2 }));
      [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]].forEach(([ox, oz]) => dRod(kpx - 1.5 + ox, Y + 1.0, kpz - 2.5 + oz, kpx - 1.5 + ox, Y + 2.2, kpz - 2.5 + oz, 0.04, 0xf2c230, { far: true }));
      dCyl(0, 1.0, 0.55, 0x6fbf73, kpx - 1.5, Y + 2.2, kpz - 2.5, { far: true, seg: 4, rot: [0, Math.PI/4, 0] });
    }
    [[kpx + 1.6, kpz + 1.2, 0xd97a5a], [kpx + 2.4, kpz + 3.4, 0x5a8fd9]].forEach(([rx9, rz9, c9]) => {   // 스프링 흔들 말
      colliders.push(noStand({ x0: rx9 - 0.3, x1: rx9 + 0.3, y0: Y, y1: Y + 0.5, z0: rz9 - 0.3, z1: rz9 + 0.3 }));
      dBox(0.5, 0.04, 0.5, 0x8a9096, rx9, Y, rz9);
      dCyl(0.1, 0.12, 0.3, 0x3a3d44, rx9, Y + 0.04, rz9, { seg: 8 });
      dBlob(0.34, 0.18, 0.18, c9, rx9, Y + 0.5, rz9, { chunky: true });
      dBlob(0.13, 0.15, 0.13, c9, rx9 + 0.3, Y + 0.67, rz9, { chunky: true });
      dRod(rx9 + 0.22, Y + 0.75, rz9 - 0.14, rx9 + 0.22, Y + 0.75, rz9 + 0.14, 0.02, 0xf2c230);
    });
    {   // 파랑 그늘막(영상 g_069~081)
      const sx9 = kpx + 1.2, sz9 = kpz - 3.2;
      [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([ox, oz]) => { dRod(sx9 + ox, Y, sz9 + oz, sx9 + ox, Y + 2.4, sz9 + oz, 0.05, 0xdfe3e8, { far: true }); post(sx9 + ox, sz9 + oz, Y, Y + 2.4, 0.06); });
      dCyl(0, 2.3, 0.7, 0x2f6fd0, sx9, Y + 2.4, sz9, { far: true, seg: 4, rot: [0, Math.PI/4, 0] });
    }
    meshFence(KP.x[0], KP.z[0], KP.x[1], KP.z[0], Y, 1.2, 0x8cc26a, 0x6e9e4f);
    meshFence(KP.x[0], KP.z[1], KP.x[1], KP.z[1], Y, 1.2, 0x8cc26a, 0x6e9e4f);
    meshFence(KP.x[0], KP.z[0], KP.x[0], KP.z[1], Y, 1.2, 0x8cc26a, 0x6e9e4f);
    meshFence(KP.x[1], KP.z[0], KP.x[1], kpz - 0.9, Y, 1.2, 0x8cc26a, 0x6e9e4f);           // 동쪽 가운데 1.8m = 출입구
    meshFence(KP.x[1], kpz + 0.9, KP.x[1], KP.z[1], Y, 1.2, 0x8cc26a, 0x6e9e4f);
    sign('유치원 놀이터', kpx, Y + 1.6, KP.z[0] - 0.2, 0, 0.32);
    zones.push({ x0: KP.x[0], x1: KP.x[1], z0: KP.z[0], z1: KP.z[1], y: Y, label: '유치원 놀이터' });
  }
  {   // 운동장 → 체육관 대지 화강석 계단 7단(영상 g_082~091) — 대지 남면(z westZ)에서 운동장으로 내민 계단 + 양옆 돌벽
    const GS = SCHOOL.gymStairs, Z = TR3.westZ, R = YARD - FIELD;
    for (let i = 0; i < 6; i++) addBox(GS.x[1] - GS.x[0], R * (6 - i) / 7, 0.3, 0xb8b4ac, (GS.x[0] + GS.x[1])/2, FIELD, Z + 0.15 + 0.3 * i);
    [GS.x[0] - 0.15, GS.x[1] + 0.15].forEach(x9 => { addBox(0.3, R + 0.1, 1.8, 0x9d988c, x9, FIELD, Z + 0.9); patWall('stoneW', 'z', Z, Z + 1.8, FIELD, YARD + 0.1, x9 + (x9 < GS.x[0] ? -0.162 : 0.162), x9 < GS.x[0] ? -1 : 1); });
    // 체육관 대지 테두리 연석 + 초록 철망(운동장 쪽 동변·남변)
    dBox(0.3, 0.1, TR3.westZ - TERR_Z, 0xa9a59c, TR3.westX - 0.15, YARD, (TERR_Z + TR3.westZ)/2, { far: true });
    meshFence(TR3.westX - 0.15, TERR_Z, TR3.westX - 0.15, TR3.westZ - 0.15, YARD + 0.1, 1.5, 0x5e8f5a, 0x4f7a4c);
    meshFence(-86, TR3.westZ - 0.15, GS.x[0] - 0.3, TR3.westZ - 0.15, YARD, 1.5, 0x5e8f5a, 0x4f7a4c);
    // 체육관 옆 길(보도블록 — 계단 위 → 체육관 현관 · 영상 g_091~099)
    patQuad('pave', G.annex.x[1] + 1.45, TR3.westX - 0.3, G.annex.z[0], TR3.westZ - 0.3, YARD + 0.012);
    zones.push({ x0: GS.x[0], x1: GS.x[1], z0: Z, z1: Z + 1.8, y: FIELD + 0.5, label: '체육관 계단' });
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
    const SE9 = -3.2, Cz = x => 55.6 + (x + 31) * (54.4 - 55.6) / (SE9 + 31);                          // 모래 띠 북변(검은 고무 경계석): 서끝 55.6 → 동끝(x -3.2) 54.4 — 동끝은 남북 테(폭 약 2m · 영상 s_019.5~021)
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
    floor4('kidHop', [[-30.2, 49.1], [-25.8, 49.1], [-25.8, 53.5], [-30.2, 53.5]], RY, 0xffffff, [[0, 1], [1, 1], [1, 0], [0, 0]]);   // 누운 아이 + 사방치기(영상 s_039~045 — 약 4m)

    zones.push({ x0: sxa, x1: sxb, z0: sz9 - 2.25, z1: sz9 + 2.25, y: Y, label: '무지개 쉼터' });
    zones.push({ x0: PZ.x[0], x1: SE9, z0: sz9 + 2.25, z1: 55.6, y: Y, label: '놀이마당' });
    zones.push({ x0: -31, x1: SE9, z0: 55.6, z1: 62, y: Y, label: '모래 놀이터' });
  }
  {   // 동쪽 통학로(높은 철망 동쪽 — 영상 f_186~240): 보도블록 + 점자블록 + 돌 두른 화단 · 곡선 지붕 작은 쉼터
    const EP2 = SCHOOL.eastPath, Y = FIELD, z0 = TR3.fieldZ + 2.6, z1 = 49.2;   // SOUTH-2: 남동 울타리 안쪽에서 끝남(정문 쪽 베이지 보도와 이어짐)
    patQuad('pave', EP2.x[0], EP2.x[1], z0, z1, Y + 0.02);
    patQuad('tactZ', (EP2.x[0] + EP2.x[1])/2 - 0.15, (EP2.x[0] + EP2.x[1])/2 + 0.15, z0, z1, Y + 0.03);
    for (let z9 = z0 + 2; z9 < z1 - 2; z9 += 1.6) addBox(0.5, 0.35, 0.45, pick([0x9d988c, 0xb7b2a6, 0xa9a498], seeded(Math.floor(z9 * 10))), EP2.x[1] + 0.5, Y, z9, NS);   // 돌 경계
    [[EP2.x[1] + 3.5, 4], [EP2.x[1] + 6, 12], [EP2.x[1] + 4, 21], [EP2.x[1] + 8, 28], [EP2.x[1] + 3, 36]].forEach(([x9, z9], k) => k % 2 ? tree(x9, z9, 1.1) : shrub(x9, z9, 0.8));
    const [shx, shz] = [EP2.x[1] + 1.6, 38];                                     // 곡선 지붕 쉼터(영상 f_222~225)
    [[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]].forEach(([ox, oz]) => { dRod(shx + ox * 0.9, Y, shz + oz, shx + ox * 0.9, Y + 2.3, shz + oz, 0.05, 0x5a4a3e, { far: true }); post(shx + ox * 0.9, shz + oz, Y, Y + 2.3, 0.06); });
    dGeo(new THREE.CylinderGeometry(1.2, 1.2, 2.6, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale(0.9, 0.35, 1), new THREE.Matrix4().makeTranslation(shx, Y + 2.3, shz), 0x7a5a42, { far: true });
    addBox(1.6, 0.42, 0.45, 0x8a6a45, shx, Y, shz);
  }
  {   // 숲놀이터 — 사용자 09-24 "큰나무 바로 아래 저 구석"(올해 생김 · 위성엔 없음): 나무칩 + 나무 데크(난간) + 통나무 + 그루터기
    const FP = SCHOOL.forestPlay, [bx9, bz9] = SCHOOL.bigTree, Y = FIELD, cx = (FP.x[0] + FP.x[1])/2, cz = (FP.z[0] + FP.z[1])/2;
    patQuad('chip', FP.x[0], FP.x[1], FP.z[0], FP.z[1], Y + 0.015);
    tree(bx9, bz9, 2.4);                                                          // 큰 나무(상징물)
    [[FP.x[0] + 1.5, FP.z[1] - 1.2, 1.2], [FP.x[1] - 1.8, FP.z[1] - 1.0, 1.3], [FP.x[0] + 2.5, FP.z[0] + 1.2, 1.1]].forEach(([tx9, tz9, s9]) => tree(tx9, tz9, s9));
    addBox(4.2, 0.5, 3.0, 0x9a7650, cx, Y, cz);                                   // 데크
    [[cx - 2.0, cz - 1.4], [cx + 2.0, cz - 1.4], [cx - 2.0, cz + 1.4], [cx + 2.0, cz + 1.4]].forEach(([px9, pz9]) => addBox(0.2, 1.3, 0.2, 0x6d4e32, px9, Y + 0.5, pz9));
    addBox(4.2, 0.2, 0.2, 0x7a5636, cx, Y + 1.8, cz - 1.4, { collide: false });
    addBox(4.2, 0.2, 0.2, 0x7a5636, cx, Y + 1.8, cz + 1.4, { collide: false });
    addBox(1.2, 0.25, 0.8, 0x8a6a45, cx, Y, cz + 1.9);                            // 데크 오르는 디딤판
    addBox(0.5, 0.35, 3.4, 0x7a5636, FP.x[0] + 1.0, Y, cz);                        // 밟고 건너는 통나무
    addBox(3.2, 0.5, 0.5, 0x7a5636, cx - 0.5, Y, FP.z[0] + 0.8);
    addBox(0.4, 1.9, 0.4, 0x7a5636, FP.x[1] - 3.2, Y, cz + 3.2); addBox(0.4, 1.9, 0.4, 0x7a5636, FP.x[1] - 0.6, Y, cz + 3.2);   // 통나무 매달리기
    addBox(3.0, 0.34, 0.34, 0x8a6a45, FP.x[1] - 1.9, Y + 1.9, cz + 3.2, { collide: false });
    [[FP.x[0] + 2.2, cz - 1.6], [FP.x[0] + 2.0, cz + 1.6], [FP.x[0] + 3.2, cz + 3.4], [FP.x[0] + 5.0, cz + 3.9]].forEach(([sx9, sz9]) => addBox(0.7, 0.45, 0.7, 0x6d4e32, sx9, Y, sz9));
    sign('숲놀이터', cx, Y + 2.3, FP.z[0] - 0.3, 0, 0.4);
    zones.push({ x0: FP.x[0], x1: FP.x[1], z0: FP.z[0], z1: FP.z[1], y: Y, label: '숲놀이터' });
  }
  {   // 개수대 — 사용자 09-23 "D(운동장 동쪽 끝)보다 약간 큰나무쪽": 동쪽 통학로 옆, 서쪽(통학로)을 보고 선다
    const [kx9, kz9] = SCHOOL.sink, Y = FIELD;
    addBox(0.8, 0.75, 4.0, 0x9aa0a4, kx9, Y, kz9, NS);
    addBox(0.9, 0.15, 4.2, 0xc9d1d6, kx9, Y + 0.75, kz9);
    addBox(0.16, 0.55, 4.2, 0x8a9096, kx9 + 0.37, Y + 0.9, kz9);
    for (let i = 0; i < 4; i++) addBox(0.15, 0.15, 0.15, 0xe3e7ea, kx9 + 0.215, Y + 1.2, kz9 - 1.5 + i, { collide: false });
    hotspots.push({ kind: 'wash', x: kx9 - 1.2, z: kz9, y: Y, r: 1.4, label: '손 씻기' });
    zones.push({ x0: kx9 - 1.6, x1: kx9 + 0.6, z0: kz9 - 2.4, z1: kz9 + 2.4, y: Y, label: '개수대' });
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
    zones.push({ x0: -4.5, x1: SCHOOL.plaza.x[1], z0: SCHOOL.shelter.center[1] + 2.25, z1: 56, y: Y, label: '버스 타는 곳' });
  }

  // ================= 뒤뜰 (영상 IMG_2180 0~100s · 위성): 서관 뒤 주차장 · 노란 창고 · 흙길 · 큰 텃밭 · 동관 동쪽 데크 =================
  {
    const PK = SCHOOL.parking, K2 = B.kitchen, Y = YARD;
    // 아스팔트: 체육관|학교 사이 길 + 서관 뒤 + 급식동 북쪽(급식동 자리는 뺀다)
    patQuad('asph', G.annex.x[1] + 0.15, TR3.westX - 0.3, gz0 - 0.15, G.annex.z[0] - 3, Y + 0.012);
    patQuad('asph', gx1 + 0.15, wx0 - 0.15, wz0 - 0.15, gz0 - 0.15, Y + 0.012);
    patQuad('asph', PK.x[0], K2.x[0] - 0.15, PK.z[0] + 20, wz0 - 0.15, Y + 0.012);
    patQuad('asph', PK.x[0], PK.x[1], PK.z[0], PK.z[0] + 20, Y + 0.012);
    patQuad('asph', wx1 + 0.15, K2.x[0] - 0.15, wz0 - 0.15, fz0 - 0.15, Y + 0.012, false, 0xd8d8d8);   // 서관|급식동 뒷길
    const LINE = 0xe8eaea;
    for (let x = PK.x[0] + 2.5; x <= wx1 - 2; x += 2.5) if (x < wx1 - 6.2 || x > wx1 - 0.8) addPanel(0.14, 4.6, LINE, x, Y + 0.022, wz0 - 2.8);
    for (let x = PK.x[0] + 2.5; x <= PK.x[1] - 2; x += 2.5) addPanel(0.14, 4.6, LINE, x, Y + 0.022, PK.z[0] + 3.5);
    addPanel(4.8, 4.6, 0x3f6fb5, wx1 - 3.5, Y + 0.022, wz0 - 2.8);                  // 장애인 주차면(뒷길 나오는 곳 가까이)
    [[PK.x[0] + 7.5, wz0 - 2.8, 0x4d76b3, 0x6f92c4], [PK.x[0] + 15, wz0 - 2.8, 0xe9ecef, 0xd8dde2], [PK.x[0] + 22.5, PK.z[0] + 3.5, 0xcf6b52, 0xe08a72], [PK.x[0] + 30, PK.z[0] + 3.5, 0x3a3d44, 0x5a5f66]].forEach(([cx9, cz9, b9, t9]) => car(cx9, cz9, b9, t9, Y));
    const SH = SCHOOL.shed;                                                       // 노란 벽·파란 지붕 창고(영상 b_027~039)
    addBox(SH.w, 2.6, SH.d, 0xe9b52a, SH.center[0], Y, SH.center[1]);
    addBox(SH.w + 0.5, 0.25, SH.d + 0.5, 0x3f6fb0, SH.center[0], Y + 2.6, SH.center[1]);
    sign('주차장', PK.x[0] + 12, Y + 1.6, wz0 - 5.6, 0, 0.4);
    zones.push({ x0: PK.x[0], x1: wx1, z0: wz0 - 12, z1: wz0, y: Y, label: '주차장' });
    zones.push({ x0: PK.x[0], x1: PK.x[1], z0: PK.z[0], z1: wz0 - 12, y: Y, label: '주차장(북쪽)' });
    zones.push({ x0: wx1, x1: K2.x[0], z0: wz0, z1: fz0, y: Y, label: '뒷길' });
    // 흙길: 급식동·동관 북쪽 따라 텃밭까지(영상 b_036~048)
    patQuad('chip', K2.x[0] + 7, SCHOOL.garden.x[1], K2.z[0] - 2.6, K2.z[0] - 1.2, Y + 0.012, false, 0xc9b28c);
    // 텃밭(위성 x 50~95 · z -58~-33): 검은 멀칭 이랑 + 채소 + 흰 울타리
    const GD = SCHOOL.garden, gcx = (GD.x[0] + GD.x[1])/2, gcz = (GD.z[0] + GD.z[1])/2;
    patQuad('dirt', GD.x[0], GD.x[1], GD.z[0], GD.z[1], Y + 0.012, false, 0xb89a74);
    for (let i = 0; i < 7; i++) {
      const rz = GD.z[0] + 2.2 + i * 3.2;
      addBox(GD.x[1] - GD.x[0] - 4, 0.3, 1.4, 0x2f2b28, gcx, Y, rz, i === 3 ? NS : {});
      if (i === 3) for (let k = 0; k < 16; k++) { const vx = GD.x[0] + 3 + k * 2.4; dRod(vx, Y + 0.3, rz, vx, Y + 1.3, rz, 0.02, 0x9c7a53); dBlob(0.2, 0.3, 0.2, 0x4d8b4d, vx, Y + 0.85, rz, { chunky: true, ry: k });
        dBlob(0.07, 0.07, 0.07, 0xd9463a, vx + 0.12, Y + 0.75, rz + 0.1, { chunky: true }); }
      else for (let k = 0; k < 22; k++) [-0.35, 0.35].forEach(oz => dBlob(0.22, 0.15, 0.22, i % 2 ? 0x8cc26a : 0x5fa34a, GD.x[0] + 3 + k * 1.8, Y + 0.42, rz + oz, { chunky: true, ry: k, jitter: 0.15 }));
    }
    meshFence(GD.x[0], GD.z[0], GD.x[1], GD.z[0], Y, 1.0, 0xf2f4f6, 0xdfe3e6, false);
    meshFence(GD.x[0], GD.z[0], GD.x[0], GD.z[1], Y, 1.0, 0xf2f4f6, 0xdfe3e6, false);
    meshFence(GD.x[1], GD.z[0], GD.x[1], GD.z[1], Y, 1.0, 0xf2f4f6, 0xdfe3e6, false);
    meshFence(GD.x[0], GD.z[1], gcx - 1.2, GD.z[1], Y, 1.0, 0xf2f4f6, 0xdfe3e6, false);
    meshFence(gcx + 1.2, GD.z[1], GD.x[1], GD.z[1], Y, 1.0, 0xf2f4f6, 0xdfe3e6, false);
    [[GD.x[0], GD.z[0], GD.x[1], GD.z[0]], [GD.x[0], GD.z[0], GD.x[0], GD.z[1]], [GD.x[1], GD.z[0], GD.x[1], GD.z[1]], [GD.x[0], GD.z[1], gcx - 1.2, GD.z[1]], [gcx + 1.2, GD.z[1], GD.x[1], GD.z[1]]].forEach(([a0, b0, a1, b1]) =>
      colliders.push(noStand({ x0: Math.min(a0, a1) - 0.08, x1: Math.max(a0, a1) + 0.08, y0: Y, y1: Y + 1.0, z0: Math.min(b0, b1) - 0.08, z1: Math.max(b0, b1) + 0.08 })));
    hotspots.push({ kind: 'garden', x: gcx, z: GD.z[1] - 1.2, y: Y, r: 2.6, label: '텃밭에 물 주기' });
    sign('우리 텃밭', gcx, Y + 1.7, GD.z[1] + 0.4, 0, 0.4);
    zones.push({ x0: GD.x[0], x1: GD.x[1], z0: GD.z[0], z1: GD.z[1], y: Y, label: '텃밭' });
    // 동관 동쪽: 큰 나무 아래 나무 데크 + 피크닉 탁자(영상 b_090~097) · 본관 동끝까지 벽돌 길
    const [dkx, dkz] = SCHOOL.gardenDeck.center;
    addBox(6, 0.3, 6, 0x9a7650, dkx, Y, dkz);
    [[dkx - 1.4, dkz - 1.4], [dkx + 1.4, dkz + 1.4]].forEach(([px9, pz9]) => {
      addBox(1.6, 0.42, 0.8, 0x7a5636, px9, Y + 0.3, pz9, NS);
      addBox(1.6, 0.16, 0.3, 0x6d4e32, px9, Y + 0.3, pz9 - 0.7); addBox(1.6, 0.16, 0.3, 0x6d4e32, px9, Y + 0.3, pz9 + 0.7);
    });
    [[dkx + 4.5, dkz - 2.5], [dkx - 3.5, dkz + 4.5]].forEach(([tx9, tz9]) => tree(tx9, tz9, 1.4));
    patQuad('brick', E.x[1] + 0.8, fx1 + 2.5, E.z[1] + 0.2, fz0 - 0.3, Y + 0.012, false, 0xe8d8d0);
    zones.push({ x0: dkx - 3, x1: dkx + 3, z0: dkz - 3, z1: dkz + 3, y: Y + 0.3, label: '텃밭 쉼터' });
    zones.push({ x0: E.x[1], x1: 60, z0: E.z[0], z1: fz0, y: Y, label: '동관 뒤뜰' });
  }

  // ================= 위성 나무 무리(Esri z19: 체육관 북서쪽 숲·서쪽 울타리 나무 줄·동쪽 가장자리·텃밭 동쪽·정문 옆) =================
  {
    const R9 = seeded(4242), jit = () => (R9() - 0.5) * 2.4;   // ±1.2 m
    patQuad('grass', -86, -53.5, -86, -33.2, YARD + 0.012, false, 0xc4d6ac);   // 숲 바닥(위성: 체육관 북쪽은 나무 그늘 — 베이지 대지 위에 나무만 서 있던 것)
    for (let x = -84; x <= -58; x += 6.5) for (let z = -84; z <= -38.5; z += 6.5) { const sk = R9(), jx = jit() * 2.2, jz = jit() * 2.2, sc = 0.75 + R9() * 0.7;   // 체육관 북서쪽 숲(격자가 보이지 않게 크게 흩고 15%는 비움 — 과수원처럼 줄 서 보이던 것)
      if (sk > 0.15 && !(x > -60 && z > -48)) bgTree(x + jx, z + jz, sc); }
    for (let z = 20; z <= 60; z += 5.5) bgTree(-53.6 + jit() * 0.3, z + jit(), 0.8 + R9() * 0.25);               // 서쪽 울타리 밖 나무 줄(울타리 -50.5와 비닐하우스 -57 사이)
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
      [[0.5, 5.3, 0.45], [1.2, 4.2, 0.35], [0.4, 2.6, 0.4], [1.9, 5.6, 0.3], [2.6, 3.4, 0.38], [0.7, 1.2, 0.3]].forEach(([ox, oz, r]) =>
        dBlob(r * 1.3, r * 0.7, r, 0xbdb9b0, IX + ox, Y + r * 0.3, IZ + oz, { far: true, chunky: true, ry: ox * 3 }));
      [[1.0, 3.2], [1.6, 4.9], [0.6, 4.0], [2.3, 2.2], [1.4, 1.5]].forEach(([ox, oz]) => dBlob(0.45, 0.55, 0.45, 0x7fa35a, IX + ox, Y + 0.4, IZ + oz, { jitter: 0.15 }));
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
    zones.push({ x0: SWA[0], x1: GE + 0.6, z0: gtz - 4.5, z1: gtz - 0.1, y: Y, label: '정문' });
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
      floor4('dirt', [[-27, fenceZ(-27) + 1.3], [SWA[0] - 1.2, fenceZ(SWA[0] - 1.2) + 1.3], [SWA[0] - 1.2, 67.8], [-27, 67.8]], Y + 0.004, 0x9c8a60);
      for (let z = 61.2; z <= 67.2; z += 1.1) { const xa = Math.max(-26.5, (58.513 + 1.8 - z) / 0.25321); if (SWA[0] - 1.6 - xa > 1) rows(xa, SWA[0] - 1.6, z, z, 1); }
      slab(SWA[0] - 0.5, fenceZ(SWA[0] - 0.5) + 0.75, -27, fenceZ(-27) + 0.75, 0.8, 0.04, 0xc9c4b8, Y, { far: true });   // 울타리 따라 콘크리트 농로
      patQuad('dirt', SEA[0] + 18, 64.5, 58, 100, Y + 0.004, false, 0x9c8a60); rows(SEA[0] + 18.4, 64.1, 58.6, 99.4, 1.2);
    }
    { const gx0 = -4.5, gx1 = 14.5, gz0 = 68.5, gz1 = 84, H9 = 4.5;                                      // 큰 회색 골판 지붕 창고(위성 x -4.5~14.5 · z 68~84)
      addBox(gx1 - gx0, H9, gz1 - gz0, 0xe6e4dc, (gx0 + gx1) / 2, Y, (gz0 + gz1) / 2);
      dBox(gx1 - gx0 + 0.6, 0.2, gz1 - gz0 + 0.6, 0xd4d2c4, (gx0 + gx1) / 2, Y + H9, (gz0 + gz1) / 2, { far: true });
      for (let x = gx0 + 0.6; x < gx1; x += 1.2) dBox(0.12, 0.06, gz1 - gz0 + 0.5, 0xbab8aa, x, Y + H9 + 0.2, (gz0 + gz1) / 2, { far: true });
      [2, 8].forEach(ox => dBox(3.2, 3.0, 0.05, 0x8d949a, gx0 + ox + 1.6, Y, gz0 - 0.025, { far: true })); }
    const HOUSE = [[-64, 76, 0xd9c9b0, 0xa9503f], [-44, 81, 0xcfd6dc, 0x50606e], [-24, 86, 0xe0d3ba, 0x6f4a30], [4, 92, 0xe6d9c6, 0xa9503f], [70, 68, 0xdfd2bd, 0x6f4a30]];
    const PRISM = new THREE.CylinderGeometry(1, 1, 1, 3, 1).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2);   // 세모 기둥: 축 = x, 꼭짓점 위(y 1)·밑변 y -0.5·반폭 0.866
    HOUSE.forEach(([hx9, hz, wc, rc], i) => {
      const d9 = i % 2 ? 7.4 : 6.2, h9 = i % 3 ? 5.2 : 6.6, rh = 1.6 + (i % 2) * 0.5, sy = rh / 1.5;
      addBox(9, h9, d9, wc, hx9, Y, hz);
      dGeo(PRISM, new THREE.Matrix4().compose(new THREE.Vector3(hx9, Y + h9 + 0.5 * sy, hz), new THREE.Quaternion(), new THREE.Vector3(9.8, sy, (d9 + 0.9) / 2 / 0.866)), rc, { far: true });   // 박공지붕(처마 45cm)
      addBox(1.1, 2.1, 0.2, 0x6d5340, hx9, Y, hz - d9/2 - 0.11, { collide: false });
      [-2.6, 2.6].forEach(ox => [1.0, 3.5].forEach(wy => {   // 앞 창(학교 쪽 — 짙은 유리 + 흰 틀)
        dBox(1.5, 1.2, 0.05, 0xf2f0ea, hx9 + ox, Y + wy - 0.06, hz - d9/2 - 0.025, { far: true }); dBox(1.3, 1.0, 0.05, 0x5b7590, hx9 + ox, Y + wy + 0.04, hz - d9/2 - 0.05, { far: true }); }));
    });
    { const [jx, jz] = [-52, 75];                                                                        // 정자(짙은 기와 모임지붕 — 영상 s_016.5·s_028.5 울타리 너머 원경)
      addBox(4, 0.45, 4, 0x8a6a45, jx, Y, jz);
      [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].forEach(([ox, oz]) => addBox(0.2, 2.3, 0.2, 0x6d4e32, jx + ox, Y + 0.45, jz + oz));
      dCyl(0, 3.6, 1.4, 0x3a3d40, jx, Y + 2.75, jz, { far: true, seg: 4, rot: [0, Math.PI / 4, 0] }); }
    [[-34, 74, 1.0], [-58, 66, 0.9], [-14, 76, 1.1], [30, 72, 0.95], [40, 56, 0.9]].forEach(([tx9, tz9, s9]) => bgTree(tx9, tz9, s9));   // 울타리 밖 나무
    // 서쪽 비닐하우스(영상 g_060~076 — 높은 철망 너머)
    for (let k = 0; k < 4; k++) dGeo(new THREE.CylinderGeometry(3, 3, 30, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(-60 - k * 7, Y, 25), 0xdfe7ea, { far: true });
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
    bandX(wx0, wx1, wz0, -1, 2.65); bandX(wx0, wx1, wz0, -1, 2.65 + FH);         // 서관 북면(1·2층)
    bandZ(wz0, wz1, wx0, -1, 2.65 + FH, YEL);                                     // 서관 서면 2층(노랑)
    bandX(ex0, ex1, ez1, 1, 2.65);  bandX(LC.x[0], ex1, ez0, -1, 2.65);           // 동관 남·북면
    bandZ(ez0, ez1, ex1, 1, 2.65);                                                // 동관 동면
    bandZ(kz0, kz1, kx0, -1, 3.75);  bandX(kx0, kx1, kz0, -1, 3.75);              // 급식동 서·북면(높은 창 위)
  }
  zones.push({ x0: LOB_X0, x1: fx1, z0: fz0, z1: zCor, y: 0, label: '본관 복도' });
  zones.push({ x0: TR3.westX, x1: SCHOOL.eastFenceX, z0: FLD.z[0], z1: SCHOOL.southFenceZ, y: FIELD, label: '운동장' });
  zones.push({ x0: SCHOOL.eastPath.x[0], x1: SCHOOL.eastPath.x[1] + 3, z0: TR3.fieldZ, z1: SCHOOL.gate[1] - 2, y: FIELD, label: '동쪽 통학로' });

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
  let glassMesh = null;
  if (glassPos.length) {   // 창 유리 — 반투명 한 덩어리(밤엔 main.js가 따뜻하게 빛나게 한다)
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glassPos), 3));
    gg.computeVertexNormals(); gg.computeBoundingSphere();
    const gm = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: 0xa9d4e4, transparent: true, opacity: 0.32, depthWrite: false }));
    gm.matrixAutoUpdate = false; gm.renderOrder = 2; scene.add(gm); glassMesh = gm;
  }
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
  for (const [M, far] of [[DNEAR, false]]) for (const ch of M.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
    if (!far) details.push({ mesh: m, cx: ch.cx, cz: ch.cz, inside: ch.inside });
  }
  // 바닥 높이(검사용): 건물 안 = 그 바닥, 밖 = 지형
  const FLOORS = [[fx0, fx1, fz0, fz1, 0], [EN.x[0], EN.x[1], fz1, EN.z[1], 0], [wx0, wx1, wz0, wz1, 0], [kx0, kx1, kz0, kz1, 0],
    [CL.x[0], CL.x[1], CL.z[0], CL.z[1], 0], [LC.x[0], LC.x[1], LC.z[0], LC.z[1], 0], [ex0, ex1, ez0, ez1, 0],
    [LC.x[1], ex1 + 0.15, ez1, fz0, COURT], [gx0, gx1, gz0, gz1, GYF], [G.annex.x[0], G.annex.x[1], G.annex.z[0], G.annex.z[1], GYF]];
  const baseAt = (x, z) => { for (const [a, b, c, d, y] of FLOORS) if (x >= a && x <= b && z >= c && z <= d) return y; return terrainAt(x, z); };
  const UPPER = [wx0, wx1, wz0, wz1, FH + 0.3];
  return { colliders, grid, zones, doors, allBoxes, hotspots, details, visRods, TERR_Z, terrainAt, baseAt, UPPER, bounds: SCHOOL.boundary, glassMesh, flag: flagMesh };
}
