// ============================================================
// v2 월드 — "자글거림·렉을 만들 수 있는 재료를 금지"하는 헌법 아래 재건축
//
// v2 헌법 (모든 지오메트리가 따라야 한다 — 위반 코드는 커밋 금지)
//  ① 부재 최소 두께 0.15m. 가는 봉·창틀·몰딩 금지 — 디테일은 '색면'으로 그린다.
//  ② 트림·띠의 명도차는 배경의 25% 이내(고대비 마이크로 디테일 금지).
//  ③ 벽 위에 겹치는 스킨/데칼 평면 금지 — 색이 다르면 벽 지오메트리 자체를 나눈다.
//     (같은 평면 z-fight·그레이징 얼룩의 근원 차단)
//  ④ 모든 상자·면은 addBox/addPanel 헬퍼만 사용 → 16m 청크로 병합(버텍스 컬러).
//  ⑤ 충돌은 AABB 목록(메시 레이캐스트 금지 — v1 렉의 근원).
//  ⑥ 예산: drawCalls ≤ 300 · sim ≤ 1ms. main.js가 매초 계측해 콘솔 경고.
// ============================================================
import * as THREE from 'three';
import { SCHOOL } from '../../js/data.js';   // 배치 단일 출처는 v1과 공유

export function buildWorld(scene) {
  const B = SCHOOL.building, FR = B.front;
  const FH = B.floorHeight;                  // 3.4
  const TERR_Z = -18;                        // 테라스(y0) | 운동장(y-1) 경계
  const colliders = [];                      // {x0,x1,y0,y1,z0,z1}
  const zones = [];

  // ---------- 병합 버퍼 ----------
  const CHUNK = 16;
  const chunks = new Map();                  // key -> {pos:[],col:[],idx:[],n}
  const box_ = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const bpos = box_.attributes.position, bnrm = box_.attributes.normal;
  const _c = new THREE.Color();

  // 낮 채도 관문: 원색을 그대로 쓰지 않고 살짝 눌러 통일감 (v1 shade의 경량판)
  function tone(hex) { _c.set(hex); _c.multiplyScalar(0.97); return _c; }

  const allBoxes = [];   // 감사용 — 장식 포함 전 상자
  function addBox(w, h, d, hex, cx, baseY, cz, opt = {}) {
    if (Math.min(w, h, d) < 0.15 && !opt.thin) throw new Error('헌법① 위반: 부재 <0.15m ' + [w,h,d]);
    allBoxes.push({ x0: cx-w/2, x1: cx+w/2, y0: baseY, y1: baseY+h, z0: cz-d/2, z1: cz+d/2 });
    const key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = chunks.get(key);
    if (!ch) { ch = { pos: [], col: [] }; chunks.set(key, ch); }
    const col = tone(hex);
    const cy = baseY + h / 2;
    for (let i = 0; i < bpos.count; i++) {
      ch.pos.push(bpos.getX(i) * w + cx, bpos.getY(i) * h + cy, bpos.getZ(i) * d + cz);
      // 간단 방향광 AO: 윗면 1.0 · 옆 0.86/0.92 · 아랫면 0.62 (버텍스에 굽기 — 셰이더 비용 0)
      const ny = bnrm.getY(i), nx = bnrm.getX(i);
      const f = ny > 0.5 ? 1.0 : ny < -0.5 ? 0.62 : (nx !== 0 ? 0.88 : 0.94);
      ch.col.push(col.r * f, col.g * f, col.b * f);
    }
    if (opt.collide !== false) colliders.push({ x0: cx - w/2, x1: cx + w/2, y0: baseY, y1: baseY + h, z0: cz - d/2, z1: cz + d/2 });
    return null;
  }
  // 바닥/색면(수평 면). 벽 색분할용 수직 면은 벽 자체를 나눠 addBox로 — 스킨 금지(헌법③)
  function addPanel(w, d, hex, cx, y, cz) {
    const key = Math.floor(cx / CHUNK) + '_' + Math.floor(cz / CHUNK);
    let ch = chunks.get(key);
    if (!ch) { ch = { pos: [], col: [] }; chunks.set(key, ch); }
    const col = tone(hex);
    const x0 = cx - w/2, x1 = cx + w/2, z0 = cz - d/2, z1 = cz + d/2;
    ch.pos.push(x0,y,z0, x0,y,z1, x1,y,z1,  x0,y,z0, x1,y,z1, x1,y,z0);
    for (let i = 0; i < 6; i++) ch.col.push(col.r, col.g, col.b);
  }

  // 벽 한 장(창 포함): 창은 '뚫린 구멍'이 아니라 **어두운 유리 색면 상자**(두께 0.2, 벽에 15cm 파묻힘).
  // 얇은 창틀 없음 — 벽/유리 경계 자체가 프레임. (헌법①③)
  function wallWithWins(x0, x1, z, wallHex, opt = {}) {
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5;
    const len = x1 - x0;
    addBox(len, h, 0.3, wallHex, (x0 + x1) / 2, y0, z);
    const n = opt.wins ?? Math.max(1, Math.floor(len / 4.2));
    const gap = len / n;
    for (let i = 0; i < n; i++) {
      const wc = x0 + gap * (i + 0.5), ww = Math.min(2.2, gap - 1.6);
      if (ww < 1.0) continue;
      addBox(ww, wh, 0.2, 0x51606c, wc, y0 + sill, z + (opt.face ?? 1) * 0.13, { collide: false });   // 면이 벽보다 8cm 돌출(v1 교훈: 얕으면 원거리 얼룩)
    }
  }
  function wallWithWinsZ(z0, z1, x, wallHex, opt = {}) {
    const h = opt.h ?? FH, y0 = opt.y0 ?? 0, sill = opt.sill ?? 1.0, wh = opt.wh ?? 1.5;
    z0 += 0.3; z1 -= 0.3;                        // 코너 인셋 — x벽과 부피 겹침 금지(헌법③ 감사 적발)
    const len = z1 - z0;
    addBox(0.3, h, len, wallHex, x, y0, (z0 + z1) / 2);
    const n = opt.wins ?? Math.max(1, Math.floor(len / 4.2));
    const gap = len / n;
    for (let i = 0; i < n; i++) {
      const wc = z0 + gap * (i + 0.5), ww = Math.min(2.2, gap - 1.6);
      if (ww < 1.0) continue;
      addBox(0.2, wh, ww, 0x51606c, x + (opt.face ?? 1) * 0.13, y0 + sill, wc, { collide: false });
    }
  }

  const terrY9 = z => (z > TERR_Z ? -1 : 0);
  // ---------- 지형 ----------
  const GRASS = 0x7cb85c, SAND = 0xd8c79e, PAVE = 0xcfc8ba;
  addPanel(320, 240, GRASS, 0, -1.001, -10);                       // 기반 잔디(운동장 레벨)
  addBox(164, 1, 52, PAVE, 0, -1, TERR_Z - 26, { collide: true }); // 테라스 단(통상자 — 옹벽=옆면)
  addPanel(96, 64, SAND, SCHOOL.field.center[0], -0.995, SCHOOL.field.center[1]); // 운동장 모래
  // 중앙 계단(테라스↔운동장): 폭 6, 5단 — 두꺼운 단(헌법①)
  for (let i = 0; i < 5; i++)
    addBox(6, 0.2 * (i + 1), 0.4, PAVE, SCHOOL.flagPole[0] + 9, -1, TERR_Z + 0.2 + 0.4 * i);

  // ---------- 앞줄(본관 1층) ----------
  const WALL = 0xd8c39a, BAND = 0xc9b48d;    // 저대비 띠(헌법②)
  const [fx0, fx1] = FR.x, [fz0, fz1] = FR.z;
  wallWithWins(fx0, fx1, fz1, WALL, { wins: 16, sill: 1.0, wh: 1.6, face: 1 });   // 남면(정면)
  wallWithWins(fx0, fx1, fz0, WALL, { wins: 14, face: -1 });                       // 북면
  wallWithWinsZ(fz0, fz1, fx0, WALL, { wins: 2, face: -1 });
  wallWithWinsZ(fz0, fz1, fx1, WALL, { wins: 2, face: 1 });
  addBox(fx1 - fx0 + 0.8, 0.3, fz1 - fz0 + 0.8, 0xd9dce1, (fx0+fx1)/2, FH, (fz0+fz1)/2);       // 지붕 슬래브
  addBox(fx1 - fx0 + 0.8, 0.45, 0.3, 0xe8e6de, (fx0+fx1)/2, FH + 0.3, fz1 + 0.25);            // 파라펫(정면·통벽 0.3)
  addBox(fx1 - fx0 - 0.4, 0.5, 0.6, BAND, (fx0+fx1)/2, 2.75, fz1 + 0.05, { collide: false });   // 상부 띠(끝 0.2 인셋 — 벽 끝면과 동일평면 금지)

  // ---------- 서관(2층) ----------
  const wg = B.wings[0]; const [wx0, wx1] = wg.x, [wz0, wz1] = wg.z;
  wallWithWins(wx0, wx1, wz0, WALL, { h: FH, wins: 6, face: -1 });                 // 1층 벽+창
  wallWithWins(wx0, wx1, wz0, WALL, { y0: FH, h: FH, wins: 6, face: -1 });          // 2층 벽+창 (적층 — 겹침 아님)
  wallWithWinsZ(wz0, wz1, wx0, WALL, { h: FH * 2, wins: 3, face: -1 });
  addBox(wx1 - wx0 + 0.8, 0.3, wz1 - wz0 + 0.8, 0xd9dce1, (wx0+wx1)/2, FH * 2, (wz0+wz1)/2);
  addBox(wx1 - wx0 + 0.8, 0.45, 0.3, 0xe8e6de, (wx0+wx1)/2, FH * 2 + 0.3, wz0 - 0.25);

  // ---------- 급식동 ----------
  const K = B.kitchen; const [kx0, kx1] = K.x, [kz0, kz1] = K.z;
  wallWithWins(kx0, kx1, kz0, WALL, { h: K.wallHeight, wins: 4, face: -1, sill: 2.4, wh: 1.2 });
  wallWithWinsZ(kz0, kz1, kx0, WALL, { h: K.wallHeight, wins: 4, face: -1 });
  addBox(kx1 - kx0 + 0.8, 0.3, kz1 - kz0 + 0.8, 0x46352b, (kx0+kx1)/2, K.wallHeight, (kz0+kz1)/2);

  // ---------- 동관 ----------
  const E = B.eastWing; const [ex0, ex1] = E.x, [ez0, ez1] = E.z;
  wallWithWins(ex0, ex1, ez1, WALL, { wins: 8, face: 1 });
  wallWithWins(ex0, ex1, ez0, WALL, { wins: 8, face: -1 });
  wallWithWinsZ(ez0, ez1, ex1, WALL, { wins: 2, face: 1 });
  addBox(ex1 - ex0 + 0.8, 0.3, ez1 - ez0 + 0.8, 0xd9dce1, (ex0+ex1)/2, FH, (ez0+ez1)/2);

  // ---------- 체육관 (적벽돌 기단 + 회색 상부 — 색분할은 벽을 나눠서, 헌법③) ----------
  const G = SCHOOL.gym; const gx = G.center[0], gz = G.center[1];
  const gx0 = gx - G.width/2, gx1 = gx + G.width/2, gz0 = gz - G.depth/2, gz1 = gz + G.depth/2;
  addBox(G.width, 3.2, 0.3, 0xa8503a, gx, 0, gz0); addBox(G.width, 3.2, 0.3, 0xa8503a, gx, 0, gz1);
  addBox(0.3, 3.2, G.depth - 0.6, 0xa8503a, gx0, 0, gz); addBox(0.3, 3.2, G.depth - 0.6, 0xa8503a, gx1, 0, gz);
  addBox(G.width, G.wallHeight - 3.2, 0.3, 0xa8a096, gx, 3.2, gz0);
  addBox(G.width, G.wallHeight - 3.2, 0.3, 0xa8a096, gx, 3.2, gz1);
  addBox(0.3, G.wallHeight - 3.2, G.depth - 0.6, 0xa8a096, gx0, 3.2, gz);
  addBox(0.3, G.wallHeight - 3.2, G.depth - 0.6, 0xa8a096, gx1, 3.2, gz);
  addBox(G.width + 1, 0.4, G.depth + 1, 0xc35233, gx, G.wallHeight, gz);   // 지붕(낮은 박공 대신 평슬래브 — 셸 단계)

  // ---------- 🏗 공사장 연출 (사용자 제안: '실제 건축처럼' — 준공 때 철거 예정) ----------
  // 전 부재 헌법① 충족(≥0.15). 타워크레인·안전펜스·공사안내판·자재 팔레트.
  {
    const CR = 0xe8b23a, ST = 0x8d9298;
    const cx9 = 44, cz9 = -15.5;                                 // 크레인: 운동장 동측(테라스 단 z-18·펜스 z-13 모두와 이격)
    addBox(3, 1.2, 3, 0xc8ccd0, cx9, terrY9(cz9), cz9);          // 기초
    addBox(0.8, 22, 0.8, CR, cx9, terrY9(cz9) + 1.2, cz9);       // 마스트
    addBox(16, 0.8, 0.8, CR, cx9 - 5, terrY9(cz9) + 23.2, cz9);  // 지브
    addBox(0.8, 0.8, 0.8, ST, cx9 - 12.6, terrY9(cz9) + 22.4, cz9, { collide: false });  // 트롤리
    addBox(0.18, 6, 0.18, ST, cx9 - 12.6, terrY9(cz9) + 16.4, cz9, { collide: false });  // 와이어(0.18 하한)
    addBox(2, 1.2, 2, 0xa8503a, cx9 - 12.6, terrY9(cz9) + 15.2, cz9, { collide: false }); // 자재(벽돌 팔레트)
    addBox(3.4, 0.8, 3.4, 0x6e7a86, cx9 + 4, terrY9(cz9) + 1.2, cz9 + 2, { collide: false }); // 카운터웨이트
    // 안전펜스(운동장 북측 라인 — 학교는 공사중!)
    for (let fx9 = -36; fx9 <= 36; fx9 += 8)
      addBox(7.6, 1.8, 0.16, fx9 % 16 === 0 ? 0xe8632e : 0xf0f2f4, fx9 + 4, -1, -13, { thin: true, collide: false });
    // 공사안내판
    addBox(6, 2.4, 0.3, 0xf0f2f4, 6, 0.2, -10.5);                           // 판 (y 0.2~2.6 — 다리와 부피 안 겹침)
    addBox(0.3, 1.2, 0.3, ST, 3.4, -1, -10.5); addBox(0.3, 1.2, 0.3, ST, 8.6, -1, -10.5);   // 다리 (y -1~0.2 — 판과 부피 안 겹침)
  }
  zones.push({ x0: -82, x1: 82, z0: -70, z1: 46, label: '학교 마당 (공사중)' });

  // ---------- 병합 → 메시 ----------
  const grid = new Map();                    // 8m 셀 → collider index 목록
  colliders.forEach((b, i) => {
    for (let gx2 = Math.floor(b.x0/8); gx2 <= Math.floor(b.x1/8); gx2++)
      for (let gz2 = Math.floor(b.z0/8); gz2 <= Math.floor(b.z1/8); gz2++) {
        const k = gx2 + ':' + gz2;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(i);
      }
  });
  // ---------- 헌법③ 감사: 같은 방향의 면이 같은 평면에서 겹치면 z-fight — 빌드가 직접 적발한다
  //  (같은쪽 면 a0==b0 또는 a1==b1 + 나머지 두 축에서 실면적 겹침. a1==b0(적층 이음)은 무해라 제외)
  {
    const EPS = 0.004, faults = [];
    const ov = (a0,a1,b0,b1) => Math.min(a1,b1) - Math.max(a0,b0) > 0.02;
    for (let i = 0; i < allBoxes.length; i++) for (let j = i+1; j < allBoxes.length; j++) {
      const A = allBoxes[i], B = allBoxes[j];
      const same = (p,q) => Math.abs(p-q) < EPS;
      if ((same(A.z0,B.z0)||same(A.z1,B.z1)) && ov(A.x0,A.x1,B.x0,B.x1) && ov(A.y0,A.y1,B.y0,B.y1)) faults.push([i,j,'z']);
      else if ((same(A.x0,B.x0)||same(A.x1,B.x1)) && ov(A.z0,A.z1,B.z0,B.z1) && ov(A.y0,A.y1,B.y0,B.y1)) faults.push([i,j,'x']);
      else if ((same(A.y0,B.y0)||same(A.y1,B.y1)) && ov(A.x0,A.x1,B.x0,B.x1) && ov(A.z0,A.z1,B.z0,B.z1)) faults.push([i,j,'y']);
    }
    if (faults.length) {
      const fmt = b9 => '[' + [b9.x0,b9.x1,b9.y0,b9.y1,b9.z0,b9.z1].map(v=>+v.toFixed(2)).join(',') + ']';
      faults.slice(0, 24).forEach(([i,j,ax]) => console.error('헌법③ ' + ax + ' A=' + fmt(allBoxes[i]) + ' B=' + fmt(allBoxes[j])));
      console.error('헌법③ 위반 총 ' + faults.length + '쌍 — 반짝임 예정지. 수정 전 커밋 금지.');
    } else console.log('헌법③ 감사: 동일평면 겹침 0');
  }
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  for (const ch of chunks.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ch.pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ch.col), 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.matrixAutoUpdate = false;
    scene.add(m);
  }
  return { colliders, grid, zones, TERR_Z };
}
