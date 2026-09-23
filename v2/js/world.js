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
  const hotspots = [];   // 상호작용 지점 — main.js가 E키/안내 클릭으로 실행
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
    if (opt.collide !== false) colliders.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
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
  function dChunk(far, cx, cz) {
    const M = far ? DFAR : DNEAR, key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = M.get(key);
    if (!ch) { ch = { pos: [], col: [], cx: (Math.floor(cx / CHUNK) + 0.5) * CHUNK, cz: (Math.floor(cz / CHUNK) + 0.5) * CHUNK }; M.set(key, ch); }
    return ch;
  }
  // geo(비인덱스로 변환)를 행렬 m으로 옮겨 붙인다. 면 방향으로 명암(윗면 1·옆면 .9·아랫면 .62 — addBox와 같은 규칙)
  function dGeo(geo, m, hex, opt = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position;
    const ch = dChunk(!!opt.far, _dv.setFromMatrixPosition(m).x, _dv.z);
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
    if ((opt.inner ?? (hex === WALL)) || opt.dado) {
      const f = opt.face ?? 1, d = opt.dado;
      box(0.15, hex, f*0.075, y0, h);
      // 아랫단 띠(DETAIL-3): 바깥벽 1층 바닥 조각에 짙은 띠 0.45 — 벽 면에서 4cm 튀어나옴(맞댐)
      if (hex === WALL && y0 === 0 && (opt.y0 ?? 0) === 0 && len >= 0.15) plinths.push({ ax, a0: cx - len/2, a1: cx + len/2, o: z + f*0.17 });
      const lo = d ? Math.max(0, Math.min(h, (opt.y0 ?? 0) + d.top - y0)) : 0;
      if (d && lo >= 0.15 && h - lo >= 0.15) { box(0.15, d.lo, -f*0.075, y0, lo); box(0.15, d.hi, -f*0.075, y0 + lo, h - lo); }
      else box(0.15, d ? (lo >= h - 0.15 ? d.lo : d.hi) : INNER, -f*0.075, y0, h);
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
        gaps.push({ c: wc, w: ww, sill, dh: sill + wh, win: true });
      }
    }
    gaps.sort((p, q) => (p.c - p.w/2) - (q.c - q.w/2));
    let cur = a0;
    for (const g of gaps) {
      const g0 = g.c - g.w/2, g1 = g.c + g.w/2, dh = g.dh ?? 2.6, sl = g.sill ?? 0;
      if (g0 - cur > 0.1499) wallSeg(ax, g0 - cur, h, (cur + g0)/2, y0, line, hex, opt);
      if (sl > 0.1499) wallSeg(ax, g1 - g0, sl, (g0 + g1)/2, y0, line, hex, opt);                   // 창턱 아래
      if (h - dh > 0.1499) wallSeg(ax, g1 - g0, h - dh, (g0 + g1)/2, y0 + dh, line, hex, opt);     // 인방
      if (g.win) { glassPane(ax, g1 - g0, Math.min(dh, h) - sl, (g0 + g1)/2, y0 + sl, line); winFrame(ax, g0, g1, y0 + sl, y0 + Math.min(dh, h), line, hex === WALL ? (opt.face ?? 1) : 0); }
      else if (dh <= 2.8 && (g.w <= 2.2 || g.door))
        doors.push(ax === 'x' ? { ax, cx: g.c, cz: line, w: g.w, y0, dh, lintel: h - dh > 0.1499, glass: !!g.glass } : { ax, cx: line, cz: g.c, w: g.w, y0, dh, lintel: h - dh > 0.1499, glass: !!g.glass });
      cur = Math.max(cur, g1);
    }
    if (a1 - cur > 0.1499) wallSeg(ax, a1 - cur, h, (cur + a1)/2, y0, line, hex, opt);
  }
  // 유리판 — 충돌은 개구 전체, 그림·감사는 사방 2cm 안쪽(창틀 속에 묻혀 틀 면과 같은 평면이 안 되게). 투명 유리 한 덩어리(드로우콜 1)
  const glassPos = [];
  function glassPane(ax, len, hh, c, y, line) {
    const w = ax === 'x' ? len : 0.16, d = ax === 'x' ? 0.16 : len, cx = ax === 'x' ? c : line, cz = ax === 'x' ? line : c;
    colliders.push({ x0: cx - w/2, x1: cx + w/2, y0: y, y1: y + hh, z0: cz - d/2, z1: cz + d/2 });
    const iw = ax === 'x' ? w - 0.04 : w, id = ax === 'x' ? d : d - 0.04, ih = hh - 0.04;
    allBoxes.push({ x0: cx - iw/2, x1: cx + iw/2, y0: y + 0.02, y1: y + 0.02 + ih, z0: cz - id/2, z1: cz + id/2 });
    for (let i = 0; i < bpos.count; i++) glassPos.push(bpos.getX(i)*iw + cx, bpos.getY(i)*ih + y + hh/2, bpos.getZ(i)*id + cz);
  }
  // 창틀(DETAIL-3): 알루미늄 틀 사방 6cm + 세로 창살(폭 1.3↑ 1개·2.6↑ 2개), 두께 0.2(벽 0.3·유리 0.16 사이 — 어느 면과도 안 겹침).
  // 바깥벽(f≠0)은 바깥쪽에 창턱(5cm 두께·10cm 튀어나옴)을 단다. 작은 부재라 near 층(멀면 숨김)
  function winFrame(ax, g0, g1, yb, yt, line, f) {
    const FR9 = 0xdfe3e6, T = 0.2, len = g1 - g0;
    const bx = (a0, a1, y0, y1, th = T, off = 0, col = FR9) => ax === 'x'
      ? dBox(a1 - a0, y1 - y0, th, col, (a0 + a1)/2, y0, line + off)
      : dBox(th, y1 - y0, a1 - a0, col, line + off, y0, (a0 + a1)/2);
    bx(g0, g0 + 0.06, yb, yt); bx(g1 - 0.06, g1, yb, yt);
    bx(g0 + 0.06, g1 - 0.06, yt - 0.06, yt); bx(g0 + 0.06, g1 - 0.06, yb, yb + 0.06);
    const nm = len > 2.6 ? 2 : len > 1.3 ? 1 : 0;
    for (let k = 1; k <= nm; k++) { const mc = g0 + len * k / (nm + 1); bx(mc - 0.025, mc + 0.025, yb + 0.06, yt - 0.06); }
    if (f) bx(g0 - 0.05, g1 + 0.05, yb - 0.05, yb, 0.1, f * 0.2, 0xcfc8ba);
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
  function sign(text, x, y, z, rotY = 0, h = 0.42) {
    let c = signCanvas.get(text);
    if (!c) {
      c = document.createElement('canvas'); const g2 = c.getContext('2d');
      g2.font = '900 84px sans-serif';
      c.width = Math.ceil(g2.measureText(text).width) + 56; c.height = 128;
      const g3 = c.getContext('2d');
      g3.fillStyle = '#2f6fd0'; g3.beginPath(); g3.roundRect(2,2,c.width-4,c.height-4,20); g3.fill();
      g3.font = '900 84px sans-serif'; g3.fillStyle = '#fff'; g3.textAlign='center'; g3.textBaseline='middle';
      g3.fillText(text, c.width/2, c.height/2 + 4);
      signCanvas.set(text, c);
    }
    const w = h * c.width / c.height;
    const m = new THREE.Object3D();
    m.position.set(x, y, z); m.rotation.y = rotY;
    signList.push({ m, c, w, h });
    return { m, w };
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
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
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
    const y = tY(z), h = hash2(x, z), ry = h * Math.PI * 2, F = { far: true };
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

  // 침엽수(DETAIL-1): 굵은 줄기 + 8각 원뿔 4단(위로 갈수록 밝은 초록·단마다 비틀어 결이 엇갈리게)
  function pine(x, z, s = 1) {
    const y = tY(z), ry = hash2(x, z) * Math.PI * 2;
    colliders.push({ x0: x-0.55*s, x1: x+0.55*s, y0: y, y1: y+12, z0: z-0.55*s, z1: z+0.55*s });
    dCyl(0.28*s, 0.5*s, 3.6*s, 0x6d4e32, x, y, z, { far: true });
    [[2.9, 2.6, 2.8, 0x2f6b46], [4.8, 2.1, 2.5, 0x3a7d52], [6.6, 1.6, 2.2, 0x468c5c], [8.2, 1.0, 1.9, 0x4f9663]]
      .forEach(([yy, r, h, c], i) => dCyl(0, r*s, h*s, c, x, y + yy*s, z, { far: true, seg: 8, rot: [0, ry + i*0.4, 0] }));
  }
  // 가구(DETAIL-1): 충돌·자리 계산은 예전 상자 크기 그대로 두고, 보이는 모양만 부품으로 짓는다.
  const METAL = 0x8a9096;
  function studentDesk(cx, y, cz, top = 0xc9a06a, w = 1.1) {        // w×0.5·높이 0.72 — 나무 상판·쇠다리·책 넣는 칸
    colliders.push({ x0: cx-w/2, x1: cx+w/2, y0: y, y1: y+0.72, z0: cz-0.25, z1: cz+0.25 });
    dBox(w, 0.04, 0.5, top, cx, y+0.68, cz);
    const lx = w/2 - 0.05;
    [[-lx, -0.2], [lx, -0.2], [-lx, 0.2], [lx, 0.2]].forEach(([ox, oz]) => dBox(0.04, 0.68, 0.04, METAL, cx+ox, y, cz+oz));
    dBox(w - 0.14, 0.1, 0.36, 0x9aa0a6, cx, y+0.52, cz - 0.03);
  }
  // 교실 배치(DETAIL-2): 학생 수 + 빈자리 2(플레이어가 앉는 곳)만큼 1인용 책상·의자. 앞줄·가운데 칸부터 채운다.
  // 칸 간격 1.4(책상 0.7 + 통로 0.7)·줄 간격 1.7(의자 등 ~ 뒷줄 책상 통로 0.7). 모두 칠판(zb 쪽 벽)을 본다.
  // 자리 목록은 seatsOf에 남겨 두고, 사람 배치(아래)가 학생을 앉히고 남은 자리에 '앉기'를 붙인다.
  const seatsOf = {};
  function classroom(name, cx, y, zb, row0, cw, top) {
    const n = (SCHOOL.people[name]?.s.length ?? 4) + 2;
    const cols = Math.max(2, Math.min(4, Math.floor((cw - 1.6) / 1.4) + 1)), rows = Math.min(3, Math.ceil(n / cols));
    const order = [...Array(cols).keys()].sort((a, b) => Math.abs(a - (cols-1)/2) - Math.abs(b - (cols-1)/2) || a - b);
    const seats = [];
    for (let r = 0; r < rows; r++) for (const c of order) {
      if (seats.length >= n) break;
      const x = cx + (c - (cols-1)/2) * 1.4, dz = zb + row0 + r*1.7;
      studentDesk(x, y, dz, top, 0.7);
      chair(x, y, dz + 0.55, 1);
      seats.push({ x, z: dz + 0.55 });
    }
    seatsOf[name] = { seats, y, teacher: { x: cx + 1.2, z: zb + 1.9 } };
  }
  function chair(cx, y, cz, back = 1, col = 0x6f8fb0) {             // 0.5×0.85×0.4 — 앉는 판·등받이·쇠다리. back=등받이 쪽(z 부호)
    colliders.push({ x0: cx-0.25, x1: cx+0.25, y0: y, y1: y+0.85, z0: cz-0.2, z1: cz+0.2 });
    dBox(0.42, 0.04, 0.4, col, cx, y+0.42, cz);
    dBox(0.42, 0.26, 0.035, col, cx, y+0.57, cz + back*0.17);
    [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([ox, oz]) => dBox(0.03, 0.42, 0.03, METAL, cx+ox, y, cz+oz));
    [-0.18, 0.18].forEach(ox => dBox(0.03, 0.11, 0.03, METAL, cx+ox, y+0.46, cz + back*0.17));
  }
  function teacherDesk(cx, y, cz) {                                 // 1.2×0.85×0.6 — 상판·서랍장(손잡이 3)·옆판
    colliders.push({ x0: cx-0.6, x1: cx+0.6, y0: y, y1: y+0.85, z0: cz-0.3, z1: cz+0.3 });
    dBox(1.24, 0.05, 0.64, 0x8a5a3b, cx, y+0.8, cz);
    dBox(0.42, 0.8, 0.56, 0x7a4e33, cx-0.36, y, cz);
    dBox(0.06, 0.8, 0.56, 0x7a4e33, cx+0.55, y, cz);
    [0.18, 0.43, 0.66].forEach(hy => dBox(0.16, 0.03, 0.03, 0xd8c9a8, cx-0.36, y+hy, cz+0.295));
  }
  function officeDesk(cx, y, cz) {                                  // 1.3×0.74×0.7 — 상판·옆판·서랍장 + 모니터·키보드
    colliders.push({ x0: cx-0.65, x1: cx+0.65, y0: y, y1: y+0.74, z0: cz-0.35, z1: cz+0.35 });
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
  const ceil = (x0, x1, z0, z1, top) => {
    flatBox(x1-x0-0.32, 0.15, z1-z0-0.32, ceilMat, (x0+x1)/2, top - 0.16, (z0+z1)/2);
    // 카메라가 천장을 뚫고 올라가 천장 속(지붕 밑면)이 보이지 않게 충돌 등록(의자·책상 위에 서면 그랬다). 사람 머리엔 닿지 않는 높이
    colliders.push({ x0: x0 + 0.16, x1: x1 - 0.16, y0: top - 0.16, y1: top - 0.01, z0: z0 + 0.16, z1: z1 - 0.16 });
  };
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
  wallX(fx0, -12, fz0, INNER, { face: -1, dado: HALL_DADO, gaps: [
    { c: (fx0 + LOB_X) / 2, w: LOB_X - fx0, dh: FH },          // 로비로 통째로 트임
    { c: -14.3, w: 2.6 },                                        // 계단홀
    ...[-24.3, -21.4, -18.5].map(c => ({ c, w: 2.4, sill: 1.05, dh: 2.35, win: true })),   // 도서관 복도창(초록 시트지 자리)
  ] });
  wallX(-12, 8.4, fz0, INNER, { face: -1, dado: HALL_DADO, gaps: [
    { c: -11.3, w: 1.2, glass: true },                           // 뒷통로(주차장 가는 길) 유리문
    { c: B.kitchen.dutyRoom.doorC, w: 1.2 },
    { c: B.kitchen.doorC, w: 1.8 },
    { c: 6.9, w: 3.0, dh: FH },                                  // 세로복도
  ] });
  // 마당면 — 학생자치회 게시판 자리(화장실 문 맞은편)는 창이 아니라 벽(사용자 08-01)
  wallX(8.4, fx1, fz0, WALL, { gaps: [{ c: 20, w: 1.8, glass: true }],   // 마당으로 나가는 유리문(문서 v79e)
    wins: 7, face: -1, noWin: [[8.6, 13.4]], dado: HALL_DADO });
  wallZ(fz0, fz1, fx0, WALL, { wins: 1, face: -1 });             // 서벽 — 측문은 서관 서벽(로비)으로
  wallZ(fz0, fz1, fx1, WALL, { gaps: [{ c: FR.corridorExitZ, w: 1.8, glass: true }], wins: 1, face: 1 });   // 주복도 동쪽 끝 유리문(영상 v2179_0480·문서 v79g)
  const cGaps = FR.rooms.map(r => r.type === 'hall' ? { c: (r.span[0]+r.span[1])/2, w: 3.4, dh: 2.7 }   // 로비 북단 아치(인방에 현판)
    : r.name === '원무실' ? { c: doorC(r), w: 1.8, glass: true }          // 유치원 정문(원무실 팻말) — 짙은 유리 양문(v80d)
    : { c: doorC(r), w: 1.2 });
  // 교실은 앞뒤 문 두 개(사용자 07-30 "실제 교실은 앞뒤로 문도 두 개")
  const twoDoor = r => ['classroom', 'computer', 'daycare', 'science'].includes(r.type);
  const backDoor = r => ({ c: r.span[1] - 1.9, w: 1.2 });
  FR.rooms.filter(twoDoor).forEach(r => cGaps.push(backDoor(r)));
  wallX(fx0 + 0.15, fx1 - 0.15, zCor, INNER, { gaps: cGaps, face: 1, dado: HALL_DADO });   // 교실벽 — 복도 쪽(북)만 연두 징두리
  // 복도 바닥: 흰 타일 + 양쪽 가장자리 짙은 띠(영상) — 띠는 바닥과 같은 높이에 '맞대어' 깐다(겹쳐 올리면 반짝임)
  addPanel(fx1-fx0-0.3, zCor-fz0-0.7, FLOOR, 0, 0.012, (fz0+zCor)/2);
  addPanel(fx1-fx0-0.3, 0.2, 0x353a40, 0, 0.012, zCor - 0.25);
  addPanel(LOB_X - fx0 - 0.15, 0.2, FLOOR, (fx0 + 0.15 + LOB_X) / 2, 0.012, fz0 + 0.25);      // 로비 구간은 띠 없음
  addPanel(fx1 - 0.15 - LOB_X, 0.2, 0x353a40, (LOB_X + fx1 - 0.15) / 2, 0.012, fz0 + 0.25);
  {   // 현관 로비 — 영상 v2179_0327~0339: 북단 목재 아치에 '웃음꽃 피는 즐거운 학교', 양쪽 유리 진열장
    const hc = (hall.span[0] + hall.span[1]) / 2;
    addBox(3.4, 0.6, 0.16, 0x8a5a3b, hc, 2.75, zCor + 0.23, { collide: false });   // 폭 = 양쪽 칸막이 사이(넘으면 칸막이와 겹침)
    sign('웃음꽃 피는 즐거운 학교', hc, 3.05, zCor + 0.33, 0, 0.26);
    addBox(0.5, 1.1, 5.0, 0x9fc3cf, hall.span[0] + 0.4, 0, -29.5);
    addBox(0.5, 1.1, 5.0, 0x9fc3cf, hall.span[1] - 0.4, 0, -29.5);
    addBox(0.5, 1.3, 0.45, 0xe8eef2, hall.span[1] - 0.4, 0, -25.3);   // 정수기(사용자 07-31 "유리장 정수기")
    hotspots.push({ kind: 'water', x: hall.span[1] - 1.1, z: -25.3, y: 0, r: 1.3, label: '물 마시기' });
  }
  FR.rooms.forEach((r, i) => {
    const [s0, s1] = r.span, cx = (s0+s1)/2, cw = s1-s0;
    if (i > 0) addBox(0.3, FH, fz1-zCor-0.3, INNER, s0, 0, (zCor+fz1)/2);
    addPanel(cw-0.5, fz1-zCor-0.5, r.type==='hall'?FLOOR:0xead9c0, cx, 0.014, (zCor+fz1)/2);
    zones.push({ x0: s0, x1: s1, z0: zCor, z1: fz1, y: 0, label: r.name });
    if (r.type === 'classroom' || r.type === 'computer' || r.type === 'daycare') {
      // 칠판 폭은 앞·뒷문 사이에 맞춘다(3m 고정이면 두 문 구멍을 35cm씩 가렸다). 0.23 = 벽면(0.15)에 딱 붙임
      addBox(Math.min(3, (s1 - 2.5) - (s0 + 2.5) - 0.2), 1.2, 0.16, 0x2e5d43, cx, 0.9, zCor + 0.23, { collide: false });
      hotspots.push({ kind: 'board', x: cx, z: zCor + 1.3, y: 0, r: 2.0, label: '칠판에 낙서하기', bx: cx, by: 1.5, bz: zCor + 0.33 });
      teacherDesk(cx - 2, 0, zCor + 1.4);
      classroom(r.name, cx, 0, zCor, 3.4, cw);
    } else if (r.type !== 'hall' && r.type !== 'toilet') {
      officeDesk(cx - 1, 0, zCor + 3.5);
      officeDesk(cx + 1, 0, zCor + 2.2);
      addBox(0.9, 1.7, 0.45, 0xc8ccd0, s0 + 0.7, 0, fz1 - 0.6);
    }
    if (r.type === 'toilet') {
      addBox(cw-1.2, 1.2, 0.4, 0xdfe8ee, cx, 0, fz1 - 0.55);                       // 세면대
      addBox(0.3, FH, fz1-zCor-2.2, INNER, cx, 0, (zCor+fz1)/2 - 0.6);             // 남|여 구분벽
      [-3.1, -1.6, 1.6, 3.1].forEach(ox => addBox(0.24, 1.9, 1.5, 0xdfe8ee, cx+ox, 0, zCor + 1.55));  // 칸막이
    }
    hangSign(r.name, doorC(r), 2.78, zCor, -1);
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
    hotspots.push({ kind: 'mic', x: 2.4, z: -21.6, y: 0, r: 1.5, label: '구령대 마이크 잡기' });
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
  wallX(-16.6, wx1, wz0, WALL, { h: FH, face: -1, dado: STAIR_DADO, gaps: [{ c: -14.3, w: 3.2, sill: 2.0, dh: 3.4, win: true }] });   // 계단실 북벽 + 참의 큰 창
  wallX(wx0, -16.6, wz0, WALL, { y0: FH+0.3, h: FH-0.3, wins: 5, face: -1, sill: 0.8,
    noWin: B.upper.rooms.map(r => [(r.span[0] + r.span[1]) / 2 - 1.7, (r.span[0] + r.span[1]) / 2 + 1.7]) });   // 칠판 자리는 벽
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
        hotspots.push({ kind: 'read', x: cx + 0.6, z: -40.0, y: 0, r: 1.6, label: '책 읽기' });
      }
      if (r.type === 'nurse') { addBox(1.05, 0.5, 2, 0xf2f5f7, cx-1, 0, wz0+2.5); addBox(1.05, 0.5, 2, 0xf2f5f7, cx+1, 0, wz0+2.5); }
    });
    hangSign('보건실', nurseDoor, 2.78, LOB_Z, 1);
    hangSign('나래반', naraeDoor, 2.78, LOB_Z, 1);
    sign('문서고', -27.5, 2.35, LOB_Z + 0.22, 0, 0.28);
    sign('슬기샘 도서관', LOB_X - 0.22, 2.55, SIDE_Z, Math.PI / 2, 0.34);
    // 도서관 복도창(짙은 초록 시트지) + 창 아래 자작나무색 사물함 — 복도 북벽 x LOB_X~-16.6
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
      hotspots.push({ kind: 'board', x: cx, z: wz0 + 1.4, y: FH + 0.3, r: 2.0, label: '칠판에 낙서하기', bx: cx, by: FH + 1.8, bz: wz0 + 0.33 });
      // 가구 간격 규칙: 책상 폭 1.1 + 틈 1.1(사람 폭 0.52의 2배) — 좁은 실은 개수를 줄인다.
      // ⚠️1.45 간격은 틈이 0.35라 사람이 못 지나가 방이 통째로 봉쇄됐었다(SD2.reach가 적발).
      const nD = (s1 - s0) > 7 ? 3 : 1;
      if (r.type === 'classroom') classroom(r.name, cx, FH+0.3, wz0, 3.0, s1 - s0);
      else for (let d = 0; d < nD; d++) { studentDesk(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3); chair(cx + (d - (nD-1)/2)*2.2, FH+0.3, wz0+3.65, 1); }
      hangSign(r.name, doorC(r), FH + 0.3 + 2.72, zc2, 1);
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
  wallZ(kz0, kz1, kx1, WALL, { h: K.wallHeight, gaps: [{ c: -56.5, w: 2.4, glass: true, door: true }, { c: B.linkCorridor.yardDoorZ, w: 1.6, glass: true }], face: 1 });   // 동관 복도 유리문(영상 v2179_0444)·마당 유리문
  addPanel(kx1-kx0-0.3, kz1-kz0-0.3, FLOOR, (kx0+kx1)/2, 0.012, (kz0+kz1)/2);
  wallX(kx0 + 0.15, 5.25, K.cookWallZ, INNER, { h: K.wallHeight, gaps: [{ c: K.cookDoorC, w: 1.4 }, { c: -1, w: 4.0, dh: K.wallHeight }] });   // 동단은 세로복도 서벽(x5.4) 앞까지
  addBox(4.0, 1.0, 0.3, INNER, -1, 0, K.cookWallZ);                                   // 배식창 아래(배식대 높이) — 창 = y 1.0~2.0
  addBox(4.0, K.wallHeight - 2.0, 0.3, INNER, -1, 2.0, K.cookWallZ);
  addBox(5.5, 0.95, 1, 0xc4c9cd, -1, 0, K.cookWallZ + 1.3);
  hotspots.push({ kind: 'meal', x: -1, z: K.cookWallZ + 2.4, y: 0, r: 1.8, label: '급식 받기' });
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
    officeDesk(D.doorC - 0.6, 0, -40.5);
    sign('당직실', D.doorC + 1.2, 2.35, fz0 + 0.22, 0, 0.32);
    zones.push({ x0: D.x[0], x1: D.x[1], z0: D.z[0], z1: D.z[1], y: 0, label: '당직실' });
  }
  wallZ(kz0, K.cookWallZ, 0, INNER, { h: K.wallHeight, gaps: [{ c: K.storeDoorZ, w: 1.2 }] });   // 조리실→식품창고(v1 실측 x0~5.4)
  zones.push({ x0: -6.4, x1: 5.25, z0: K.cookWallZ, z1: kz1, y: 0, label: '급식실' });
  zones.push({ x0: kx0, x1: -0.3, z0: kz0, z1: K.cookWallZ, y: 0, label: '조리실' });
  zones.push({ x0: 0.3, x1: 5.25, z0: kz0, z1: K.cookWallZ, y: 0, label: '식품창고' });

  // ================= 세로복도 =================
  const LC = B.linkCorridor;
  wallZ(-58, fz0, LC.x[0], INNER, { gaps: [{ c: K.hallEastDoorZ, w: 1.8 },          // z-58까지(동관 복도 연결부) — 양쪽 다 실내라 실내벽
    ...[-48.0, -40.2].map(c => ({ c, w: 2.2, sill: 1.0, dh: 2.4, win: true }))] });   // 급식실이 보이는 창(사용자 07-31) — 식당홀 문 미끄러지는 자리 밖
  // 세로복도에서 급식실이 보이는 창(사용자 07-31 "2·4학년 가는 복도에 급식실 보이는 창문")
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
      addBox(Math.min(3, (s1 - 2.5) - (s0 + 2.5) - 0.2), 1.2, 0.16, 0x2e5d43, cx, 0.9, zCE + 0.23, { collide: false });   // 앞·뒷문 사이 폭
      hotspots.push({ kind: 'board', x: cx, z: zCE + 1.3, y: 0, r: 2.0, label: '칠판에 낙서하기', bx: cx, by: 1.5, bz: zCE + 0.33 });
      classroom(r.name, cx, 0, zCE, 3.2, s1 - s0, r.type === 'science' ? 0x8fc46a : 0xc9a06a);
    }
    if (!r.innerOnly && !r.external) hangSign(r.name, doorC(r), 2.78, zCE, -1);
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
      hotspots.push({ kind: 'slide', x: px - 4, z: pz - 2.6, y: 0.2, r: 1.0, label: '미끄럼틀 타기', from: [px - 4, 0.2, pz - 3.4], to: [px - 4, -1, pz - 6.8] });
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
    hotspots.push({ kind: 'garden', x: tx, z: tz + 3.6, y: 0, r: 2.6, label: '텃밭에 물 주기' });
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
  {   // 숲놀이터 — 사용자 07-31 "큰나무옆 숲놀이터"·09-23 위성 대조: 운동장 동남쪽 큰 나무 옆 나무숲 속(영상 v2179_0003 소나무숲·나무 데크)
    const [bx9, bz9] = SCHOOL.bigTree;                     // (46,34)
    addPanel(10.5, 12, 0xa8875f, bx9 + 7.25, -0.99, bz9 - 0.5);          // 나무칩 바닥 x48~58.5
    [[55.8, 28.6, 1.3], [58.2, 36.8, 1.4], [50.6, 38.9, 1.2], [60.4, 31.2, 1.3]].forEach(([tx9, tz9, s9]) => tree(tx9, tz9, s9));   // 숲
    // 나무 데크 + 기둥 네 개 + 위 테두리(기둥 위에 얹음 — 맞닿기만)
    addBox(4.2, 0.5, 3.0, 0x9a7650, 53.5, -1, 33.2);
    [[51.5, 31.8], [55.5, 31.8], [51.5, 34.6], [55.5, 34.6]].forEach(([px9, pz9]) => addBox(0.2, 1.3, 0.2, 0x6d4e32, px9, -0.5, pz9));
    addBox(4.2, 0.2, 0.2, 0x7a5636, 53.5, 0.8, 31.8, { collide: false });
    addBox(4.2, 0.2, 0.2, 0x7a5636, 53.5, 0.8, 34.6, { collide: false });
    addBox(1.2, 0.25, 0.8, 0x8a6a45, 53.5, -1, 35.1);                    // 데크 오르는 디딤판
    // 밟고 건너는 통나무(지면에 앉힘)
    addBox(0.5, 0.35, 3.4, 0x7a5636, 49.6, -1, 29.6);
    addBox(3.2, 0.5, 0.5, 0x7a5636, 52.6, -1, 28.9);
    addBox(0.5, 0.35, 3.0, 0x7a5636, 57.0, -1, 33.4);
    // 통나무 매달리기 — 기둥 둘 위에 가로 통나무
    addBox(0.4, 1.9, 0.4, 0x7a5636, 55.2, -1, 38.0); addBox(0.4, 1.9, 0.4, 0x7a5636, 58.8, -1, 38.0);
    addBox(4.0, 0.34, 0.34, 0x8a6a45, 57.0, 0.9, 38.0, { collide: false });
    // 그루터기 의자 — 큰 나무 곁 둥글게
    [[48.6, 32.2], [48.9, 34.9], [49.8, 36.9], [51.6, 37.4]].forEach(([sx9, sz9]) => addBox(0.7, 0.45, 0.7, 0x6d4e32, sx9, -1, sz9));
    sign('숲놀이터', 53.5, 1.1, 30.4, 0, 0.4);
    zones.push({ x0: 48, x1: 58.5, z0: 27.5, z1: 39.5, y: -1, label: '숲놀이터' });
  }
  {   // 개수대 — 사용자 09-23 "D(운동장 동쪽 끝)보다 약간 큰나무쪽": 동쪽 가장자리, 서쪽(운동장)을 보고 선다
    const kx9 = 53.2, kz9 = 22.5;
    addBox(0.8, 0.75, 4.0, 0x9aa0a4, kx9, -1, kz9);                        // 콘크리트 받침
    addBox(0.9, 0.15, 4.2, 0xc9d1d6, kx9, -0.25, kz9);                     // 스테인리스 물받이
    addBox(0.16, 0.55, 4.2, 0x8a9096, kx9 + 0.37, -0.1, kz9);              // 뒤 급수관 벽
    for (let i = 0; i < 4; i++) addBox(0.15, 0.15, 0.15, 0xe3e7ea, kx9 + 0.215, 0.2, kz9 - 1.5 + i, { collide: false });   // 수도꼭지
    hotspots.push({ kind: 'wash', x: kx9 - 1.2, z: kz9, y: -1, r: 1.4, label: '손 씻기' });
    zones.push({ x0: kx9 - 1.6, x1: kx9 + 0.6, z0: kz9 - 2.4, z1: kz9 + 2.4, y: -1, label: '개수대' });
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
      colliders.push({ x0: sx9-0.55, x1: sx9+0.55, y0: 0, y1: 0.9, z0: sz9-0.55, z1: sz9+0.55 });   // 둥근 향나무(DETAIL-3) — 충돌은 예전 상자 그대로
      dBlob(0.62, 0.5, 0.62, 0x3f7a3f, sx9, 0.45, sz9, { far: true, ry: k, jitter: 0.1 });
      dBlob(0.42, 0.36, 0.42, 0x4d8b4d, sx9 + 0.05, 0.95, sz9 - 0.04, { far: true, ry: k + 1, jitter: 0.1 });
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
      // 스테인리스 난간(사용자 07-31 "구령대 계단 난간") — 단 윗면 위에 단마다 한 칸씩, 바깥(남) 면을 계단 면과 맞춤
      addBox(0.35, 0.9, 0.16, 0xc8cdd2, 11.65 + 0.35 * (5 - i) + 0.175, -1 + (i + 1) / 6, -16.08);
      addBox(0.35, 0.9, 0.16, 0xc8cdd2, 0.65 - 0.35 * (5 - i) - 0.175, -1 + (i + 1) / 6, -16.08);
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
    [[62, -8], [67, 6]].forEach(([px9, pz9]) => pine(px9, pz9, 1));          // 거대 침엽수
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
  {   // 가운데 마당(중정) — 영상 v2180_0102~0129: 벽돌 포장 + 화분 향나무 + 동관 앞 화단
    addPanel(31.05, 6.1, 0xb4806a, 24.075, 0.01, -41.2);
    [12, 17, 22.5, 27, 32, 37].forEach(px9 => {
      addBox(0.8, 0.5, 0.8, 0x8a5a3b, px9, 0, -41.2);
      dBox(0.9, 0.06, 0.9, 0x7a4e33, px9, 0.5, -41.2);                                     // 화분 테두리
      dBlob(0.4, 0.45, 0.4, 0x3f7a3f, px9, 0.95, -41.2, { far: true, ry: px9, jitter: 0.1 });   // 향나무 두 덩어리
      dBlob(0.28, 0.3, 0.28, 0x4d8b4d, px9, 1.45, -41.2, { far: true, ry: px9 + 1, jitter: 0.1 });
    });
    addBox(28, 0.35, 0.8, 0x6b4a36, 24, 0, -43.85);                            // 동관 남벽 앞 화단
    addBox(28, 0.2, 0.7, 0x5a9a4a, 24, 0.35, -43.85, { collide: false });
  }
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
    // 사람(DETAIL-1): 신발·다리·몸통·소매·손·목·머리·눈·입·볼·머리숱(여=긴 뒷머리). 옷색은 자리마다 다르게.
    // 크기 s(아이 1·어른 1.1·유치원 0.8). face = 바라보는 쪽(0북·1동·2남·3서). 발밑 y. 전체 키 ≈ 1.5·s
    // ⚠️겹치는 부품끼리 폭은 0.02 이상 다르게(머리 .32·앞머리 .28·짧은뒷머리 .34·정수리 .36·긴뒷머리 .40) — s=0.8에서도 면 차이 ≥8mm(감사 EPS 4mm)
    const TOPS = [0x4d7fd6, 0x3fa37a, 0xe8a33d, 0x8a6ad0, 0xd9574a, 0x5bb5c9, 0xf2d15c, 0xe0708a, 0x7a8a9a, 0xf08a5d, 0x6fbf73, 0xffffff];
    const BOTS = [0x2b3a55, 0x3d4f7a, 0x6b5b4a, 0x2f2f36, 0x5a6f8a, 0x8a8f99];
    const SKIN = [0xf1c9a0, 0xe8b98f, 0xf5d3b0], HAIR = [0x3a2e28, 0x2a2220, 0x4a3426, 0x5a3d2b];
    // sit=true: 의자(앉는 판 0.46)에 앉아 책상에 팔을 올린 자세. 앞 = 책상 쪽
    function person(x, y, z, sex, s = 1, face = 2, sit = false) {
      const P = partAt(x, y, z, face, s), no = { collide: false };
      const h1 = hash2(x, z), h2 = hash2(z, x), pick = (a, h) => a[Math.floor(h * a.length) % a.length];
      const top = pick(TOPS, h1), bot = pick(BOTS, h2), skin = pick(SKIN, h1 * 7 % 1), hair = pick(HAIR, h2 * 5 % 1);
      const girl = sex === '여', SH = 0x3a3d44;
      const dy = sit ? 0.02 : 0, dz = sit ? -0.02 : 0;                 // 윗몸 위치(앉으면 2cm 높고 2cm 뒤)
      if (sit) {
        P(-0.1, 0, 0.36, 0.15, 0.08, 0.24, SH, no); P(0.1, 0, 0.36, 0.15, 0.08, 0.24, SH, no);                  // 신발(책상 밑)
        P(-0.1, 0.08, 0.33, 0.13, 0.38, 0.14, girl ? skin : bot, no); P(0.1, 0.08, 0.33, 0.13, 0.38, 0.14, girl ? skin : bot, no); // 종아리
        if (girl) P(0, 0.46, 0.07, 0.42, 0.15, 0.4, bot, no);                                                   // 치마(무릎까지)
        else { P(-0.1, 0.46, 0.12, 0.16, 0.15, 0.44, bot, no); P(0.1, 0.46, 0.12, 0.16, 0.15, 0.44, bot, no); }  // 허벅지
      } else {
        P(-0.1, 0, 0.03, 0.15, 0.08, 0.24, SH, no); P(0.1, 0, 0.03, 0.15, 0.08, 0.24, SH, no);                  // 신발(앞으로 3cm)
        if (girl) {
          P(-0.09, 0.08, 0, 0.12, 0.3, 0.13, skin, no); P(0.09, 0.08, 0, 0.12, 0.3, 0.13, skin, no);
          P(0, 0.38, 0, 0.44, 0.2, 0.28, bot, no);
        } else {
          P(-0.1, 0.08, 0, 0.16, 0.5, 0.17, bot, no); P(0.1, 0.08, 0, 0.16, 0.5, 0.17, bot, no);
        }
      }
      P(0, 0.58 + dy, dz, 0.4, 0.46, 0.23, top, no);                                                          // 몸통
      P(-0.26, 0.74 + dy, dz, 0.11, 0.3, 0.13, top, no); P(0.26, 0.74 + dy, dz, 0.11, 0.3, 0.13, top, no);    // 소매
      if (sit) {                                                                                             // 책상 위 팔: 소매 + 손(피부색 팔은 나무 책상과 같은 색이라 판자로 보였다)
        [-0.2, 0.2].forEach(ax => { P(ax, 0.725, 0.24, 0.11, 0.08, 0.28, top, no); P(ax, 0.725, 0.435, 0.09, 0.06, 0.11, skin, no); });
      }
      else { P(-0.26, 0.5, 0, 0.09, 0.24, 0.1, skin, no); P(0.26, 0.5, 0, 0.09, 0.24, 0.1, skin, no); }        // 내린 팔·손
      const Y = 1.04 + dy;
      P(0, Y, dz, 0.13, 0.04, 0.12, skin, no);                                                                 // 목
      P(0, Y + 0.04, dz, 0.32, 0.32, 0.29, skin, no);                                                          // 머리
      P(-0.075, Y + 0.16, dz + 0.155, 0.05, 0.06, 0.04, 0x2a2222, no); P(0.075, Y + 0.16, dz + 0.155, 0.05, 0.06, 0.04, 0x2a2222, no); // 눈(1cm 튀어나옴)
      P(0, Y + 0.07, dz + 0.155, 0.08, 0.04, 0.04, 0xc0605a, no);                                             // 입
      P(-0.115, Y + 0.1, dz + 0.155, 0.05, 0.04, 0.04, 0xf2a3a0, no); P(0.115, Y + 0.1, dz + 0.155, 0.05, 0.04, 0.04, 0xf2a3a0, no); // 볼
      P(0, Y + 0.29, dz - 0.005, 0.36, 0.12, 0.32, hair, no);                                                 // 정수리
      P(0, Y + 0.26, dz + 0.16, 0.28, 0.06, 0.04, hair, no);                                                  // 앞머리
      if (girl) P(0, Y - 0.06, dz - 0.17, 0.4, 0.42, 0.06, hair, no);                                         // 긴 뒷머리
      else P(0, Y + 0.14, dz - 0.165, 0.34, 0.2, 0.05, hair, no);                                             // 짧은 뒷머리
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
      // 방 가운데 쪽을 바라본다(90° 단위) — 뒤통수만 보이던 블록 인형이 아니게
      const dx = (zn.x0 + zn.x1) / 2 - p[0], dz = (zn.z0 + zn.z1) / 2 - p[1];
      const face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz > 0 ? 2 : 0);
      person(p[0], zn.y ?? 0, p[1], sex, s, face);
      sign(nm, p[0], (zn.y ?? 0) + 1.62 * s + 0.2, p[1], 0, 0.22);
    };
    // 교실: 선생님은 칠판 앞에 서서 아이들 쪽(남)을, 아이들은 자기 자리에 앉아 칠판 쪽(북)을 본다. 남은 자리 = '앉기'
    const sitSpot = (L, st) => hotspots.push({ kind: 'sit', x: st.x, z: st.z + 0.5, y: L.y, r: 0.75, label: '의자에 앉기' });
    Object.entries(SCHOOL.people).forEach(([cls, info]) => {
      const zn = zoneOf(cls); if (!zn) return;
      const L = seatsOf[cls];
      if (!L) { place(zn, cls + ' 선생님', info.t, 1.1); info.s.forEach(([nm, sx]) => place(zn, nm, sx, 1)); return; }
      person(L.teacher.x, L.y, L.teacher.z, info.t, 1.1, 2);
      sign(cls + ' 선생님', L.teacher.x, L.y + 1.62 * 1.1 + 0.2, L.teacher.z, 0, 0.22);
      info.s.forEach(([nm, sx], i) => {
        const st = L.seats[i]; if (!st) { place(zn, nm, sx, 1); return; }
        person(st.x, L.y, st.z, sx, 1, 0, true);
        sign(nm, st.x, L.y + 1.74, st.z, 0, 0.22);
      });
      L.seats.slice(info.s.length).forEach(st => sitSpot(L, st));
    });
    Object.entries(seatsOf).forEach(([nm, L]) => { if (!SCHOOL.people[nm]) L.seats.forEach(st => sitSpot(L, st)); });
    Object.entries(SCHOOL.staff).forEach(([room, list]) => {
      const zn = zoneOf(room); if (!zn) return;
      list.forEach(([nm, sx, sz]) => place(zn, nm, sx, sz === 'small' ? 0.8 : 1.1));
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
  if (glassPos.length) {   // 창 유리 — 반투명 한 덩어리
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glassPos), 3));
    gg.computeVertexNormals(); gg.computeBoundingSphere();
    const gm = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: 0xa9d4e4, transparent: true, opacity: 0.32, depthWrite: false }));
    gm.matrixAutoUpdate = false; gm.renderOrder = 2; scene.add(gm);
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
  // 디테일 층 병합 — near 청크는 main.js가 거리로 켜고 끈다(DETAIL_FAR)
  const details = [];
  for (const [M, far] of [[DNEAR, false], [DFAR, true]]) for (const ch of M.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
    if (!far) details.push({ mesh: m, cx: ch.cx, cz: ch.cz });
  }
  return { colliders, grid, zones, doors, allBoxes, hotspots, details, TERR_Z };
}
