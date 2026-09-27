// 개미가 된 나(GAME-SHRINK · 09-27) — 몸이 1/12로 작아져 교실 한 칸 + 복도에서 과자 부스러기 8개를 모으는 판. 설계 = docs/tasks/story_engine.md '작아지기' · 정본 = docs/map_api.md §11.12
//   같은 맵을 새 세계로: 책상 = 절벽 · 의자 좌판 = 발판 · 교탁 = 봉우리 · 창턱 = 벼랑길. 오르는 길 = 게임이 놓는 책 더미(계단)·연필 다리(경사 다리) + 의자 → 책상 점프.
//   부스러기 자리: 복도 사물함 틈(작은 몸만 들어감) · 복도 사물함 위 · 의자 밑 · 책상 위 둘 · 교탁 위 · 창가 사물함 위 · 창턱.
// 규칙(_template.js): import 금지(three = map.three) · 사람 NPC 그대로(옮기지 않음 · 과녁·적 없음) · 화면 글자는 UI 문구뿐(이야기·대사 없음) · 새 조명 없음 ·
//   소품은 InstancedMesh 풀(책 1 · 연필 1 · 부스러기 1 · 빛줄기 1 = 드로우콜 +4) · 매 프레임 새 객체 없음 · 게임이 멈추면 몸 크기·지점·충돌·HUD 모두 원래대로(범위 파사드 + 엔진 reset)
// 조작: 걷기 WASD/화살표·조이스틱 · 점프 Space/점프 버튼(작은 몸 점프 ≈ 키의 2.4배 — 개미 점프) · ↩ 칩(R) = 처음 자리로 · 부스러기는 닿으면 줍는다(행동 버튼 필요 없음)
export const meta = { id: 'shrink', title: '개미가 된 나', api: 1 };

const S = 1 / 12, JUMP = 0.3, ROOM = 'care', N_CRUMB = 8;
const BOOK_C = [0xd9534f, 0x4a90d9, 0x5cb85c, 0xf0ad4e, 0x8e6bbf, 0x3bb3a8, 0xe67aa0, 0x7d8a96];
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default async function start(map, params = {}) {
  const THREE = map.three, PL = map.player;
  let dead = false, st = 'prep', T = 0, got = 0, secShown = -1, shrinkT = 0, best = map.store.get('best', null);
  PL.freeze(true);
  map.hud.banner('작아지는 중…', 30);
  map.sfx('warm');

  // ---------- 자리(월드에서 읽기 — 교실 한 칸 + 그 앞 복도) ----------
  const room = map.zone(ROOM);
  if (!room) { map.hud.toast('교실을 찾지 못했어요'); map.quit(); return {}; }
  const doors = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(room.id));
  const corrId = doors.length ? doors[0].zones.find(z => z && z !== room.id) : null;
  const inZ = (id, x, z, y = 0.3) => { const zn = map.zoneAt(x, y, z); return !!zn && zn.id === id; };
  // 출발 = 앞문(칠판 쪽 — x가 작은 문) 복도 쪽 1.3m
  const door0 = doors.slice().sort((a, b) => a.x - b.x)[0];
  let startAt = null;
  for (const [dx, dz] of [[0, -1.3], [0, 1.3], [-1.3, 0], [1.3, 0]]) if (!startAt && inZ(corrId, door0.x + dx, door0.z + dz)) startAt = [door0.x + dx, map.q.floorY(door0.x + dx, door0.z + dz), door0.z + dz];
  if (!startAt) startAt = [door0.x, 0, door0.z - 1.3];
  const faceDoor = (Math.atan2(door0.x - startAt[0], -(door0.z - startAt[2])) * 180 / Math.PI + 360) % 360;
  PL.teleport(startAt, { h: faceDoor });

  // 작은 몸 판을 먼저 켜서(충돌 = 가구 보이는 윗면) 윗면 높이를 잰다 — 그다음 작아지는 연출은 0.95 → 1/12
  PL.scale(S, { jump: JUMP });
  const top = (x, z, from = 1.6) => PL.groundAt(x, z, from);
  const free = (x, y, z) => !PL.blockedAt(x, z, y, 1.5 * S);
  const seats = map.interact.list({ kind: 'sit', zone: room.id }).map(h => ({ x: h.x, z: h.z }));   // 교실 빈자리 '앉기' = 의자 가운데 +0.5(서향 교실 줄)
  const rowsX = [...new Set(seats.map(s => +s.x.toFixed(2)))].sort((a, b) => a - b);
  const row = k => seats.filter(s => Math.abs(s.x - rowsX[k]) < 0.05).sort((a, b) => a.z - b.z);
  const tdesk = map.hide.candidates({ zone: room.id, kinds: ['desk'], max: 1 })[0] || null;
  const lockers = map.hide.candidates({ zone: room.id, kinds: ['locker'], max: 10 });
  const cz = (room.z0 + room.z1) / 2, winS = Math.sign(room.z1 - door0.z) || 1;   // 창 쪽 = 문 반대쪽(z 부호)
  const winL = lockers.filter(c => c.w >= 2).sort((a, b) => winS * (b.z - a.z))[0] || null;   // 창 아래 낮은 사물함
  const corrL = map.hide.candidates({ near: [door0.x, door0.z], r: 7, kinds: ['locker'], max: 12 }).filter(c => inZ(corrId, c.x, c.z, 0.5))
    .sort((a, b) => Math.hypot(a.x - door0.x, a.z - door0.z) - Math.hypot(b.x - door0.x, b.z - door0.z))[0] || null;
  const warn = (...a) => console.warn('[shrink]', ...a);
  const crumbs = [], books = [], pencils = [];
  const addCrumb = (x, y, z, where) => { crumbs.push({ x, y: y + 0.02, z, where, got: false }); };
  const ramp = (a, b) => pencils.push({ a, b });

  // ① 복도 사물함: 앞에 책 더미 계단 → 사물함 위 부스러기 · 사물함 옆 좁은 틈(작은 몸만) 부스러기
  if (corrL) {
    const fz = corrL.face === 180 ? 1 : corrL.face === 0 ? -1 : 0, fx = corrL.face === 90 ? 1 : corrL.face === 270 ? -1 : 0;   // 앞면 쪽
    const ltop = top(corrL.x, corrL.z, 1.6);
    let d = 0; while (d < 0.8 && top(corrL.x + fx * d, corrL.z + fz * d, 1.6) > 0.3) d += 0.02;   // 앞면까지
    const fx0 = corrL.x + fx * d, fz0 = corrL.z + fz * d, ax = Math.abs(fz), az = Math.abs(fx);   // 사물함 긴 방향 = (ax, az)
    const n = Math.max(1, Math.ceil((ltop - 0.2) / 0.27)), stp = (ltop - 0.2) / n;
    for (let k = 0; k < n; k++) { const o = -0.45 + k * 0.24, x = fx0 + ax * o + fx * 0.115, z = fz0 + az * o + fz * 0.115;
      books.push({ x, z, y0: map.q.floorY(x, z), h: stp * (k + 1), w: ax ? 0.24 : 0.2, d: ax ? 0.2 : 0.24 }); }
    addCrumb(corrL.x + ax * (corrL.w / 2 - 0.2), ltop, corrL.z + az * (corrL.w / 2 - 0.2), '복도 사물함 위');
    // 틈: 사물함 양끝 바깥으로 — 평소 몸은 못 들어가고(막힘) 작은 몸은 서는 곳
    let gap = null;
    for (const sgn of [1, -1]) { if (gap) break; const e = corrL.w / 2;
      let a0 = null;
      for (let o = e + 0.02; o < e + 0.5; o += 0.01) { const x = corrL.x + ax * sgn * o, z = corrL.z + az * sgn * o, y = map.q.floorY(x, z);
        const ok = free(x, y, z) && top(x, z, y + 0.2) < y + 0.03;
        if (ok && a0 == null) a0 = o; if (!ok && a0 != null) { if (o - a0 < 0.35 && o - a0 > 0.08) { const m = (a0 + o) / 2; gap = [corrL.x + ax * sgn * m, y, corrL.z + az * sgn * m]; } break; } } }
    if (gap && map.q.blocked(gap[0], gap[2], gap[1])) addCrumb(gap[0], gap[1], gap[2], '복도 사물함 틈');
    else warn('사물함 틈을 못 찾음');
  } else warn('복도 사물함 없음');

  // ② 교실: 줄1 끝 의자 옆 책 더미 → 의자 좌판 → 책상 위 · 줄1 다른 끝 책상 → 연필 다리 → 교탁 → 연필 다리 → 창가 사물함 → 창턱
  const r1 = row(0), r2 = rowsX.length > 1 ? row(1) : [];
  if (r1.length) {
    const cA = r1[0], chX = cA.x - 0.5, dkX = cA.x - 1.05;   // 줄 끝(z 작은 쪽) 자리
    books.push({ x: chX, z: cA.z - 0.36, y0: map.q.floorY(chX, cA.z - 0.36), h: 0.25, w: 0.2, d: 0.2 });
    addCrumb(dkX + 0.05, top(dkX, cA.z, 1.2), cA.z - 0.12, '책상 위');
    const cB = r1[r1.length - 1], bX = cB.x - 1.05, bTop = top(bX, cB.z, 1.2);
    if (tdesk) {
      // 교탁(서향 교실 = 90° 돌림: x ±0.3 · z ±0.6) — 학생 책상(x ±0.25 · z ±0.35)과 가장 가까운 모서리끼리
      const T0 = { x0: tdesk.x - 0.3, x1: tdesk.x + 0.3, z0: tdesk.z - 0.6, z1: tdesk.z + 0.6 }, D0 = { x0: bX - 0.25, x1: bX + 0.25, z0: cB.z - 0.35, z1: cB.z + 0.35 };
      const cl = (v, a, b) => Math.max(a + 0.08, Math.min(b - 0.08, v));
      const pa = [cl(T0.x1, D0.x0, D0.x1), cl((T0.z0 + T0.z1) / 2, D0.z0, D0.z1)], pb = [cl(D0.x0, T0.x0, T0.x1), cl((D0.z0 + D0.z1) / 2, T0.z0, T0.z1)];
      const tTop = top(tdesk.x + 0.2, tdesk.z, 1.2);
      addCrumb(bX, bTop, cB.z + 0.12, '책상 위');
      ramp([pa[0], bTop, pa[1]], [pb[0], tTop, pb[1]]);
      addCrumb(pb[0], tTop, tdesk.z + (winS > 0 ? 0 : 0), '교탁 위');
      if (winL) {
        const lz0 = winL.z - winS * 0.225, lTop = top(winL.x, winL.z, 1.2);
        const ez = winS > 0 ? T0.z1 : T0.z0;
        ramp([pb[0], tTop, ez - winS * 0.08], [pb[0], lTop, lz0 + winS * 0.08]);
        addCrumb(winL.x + winL.w / 2 - 0.3, lTop, winL.z, '창가 사물함 위');
        // 창턱: 사물함 뒤(벽 안쪽 면) 3.5cm 띠 — 사물함 윗면보다 높은 곳(창 밑 벽 윗면)
        const zs = winL.z + winS * (0.225 + 0.035); let sill = null;
        const isSill = (x, y = top(x, zs, 1.3)) => y > lTop + 0.05 && y < 1.35 && free(x, y, zs);
        for (let x = winL.x + winL.w / 2 - 0.15; x > winL.x - winL.w / 2 + 0.15; x -= 0.05) if (isSill(x)) { const x2 = isSill(x - 0.4) ? x - 0.4 : x; sill = [x2, top(x2, zs, 1.3), zs]; break; }   // 창 동쪽 끝에서 40cm 안
        if (sill) addCrumb(sill[0], sill[1], sill[2], '창턱'); else warn('창턱을 못 찾음');
      } else warn('창가 사물함 없음');
    } else warn('교탁 없음');
    const cC = (r2.length ? r2 : r1)[0];
    addCrumb(cC.x - 0.5, map.q.floorY(cC.x - 0.5, cC.z), cC.z, '의자 밑');
  } else warn('교실 자리 없음');
  // 모자라면 교실 바닥 빈 칸으로 채움(다른 교실 배치에서도 판이 서게)
  for (let k = 0; crumbs.length < N_CRUMB && k < 200; k++) { const x = room.x0 + 0.6 + (k * 0.37) % (room.x1 - room.x0 - 1.2), z = room.z0 + 0.6 + (k * 0.73) % (room.z1 - room.z0 - 1.2), y = map.q.floorY(x, z);
    if (free(x, y, z)) addCrumb(x, y, z, '교실 바닥'); }
  crumbs.length = Math.min(crumbs.length, N_CRUMB);
  void cz;

  // ---------- 그리기(InstancedMesh 풀 — 책 1 · 연필 1 · 부스러기 1 · 빛줄기 1) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), GEOS = [], MATS = [];
  const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = m.receiveShadow = false; GEOS.push(geo); MATS.push(mat);
    for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO); map.add(m); return m; };
  // 책: 더미마다 권 두께 0.045~0.06 · 조금씩 비뚤게(보이는 모양 ≈ 충돌 상자)
  const rng = map.rng(params.seed || 7);
  const BK = []; for (const b of books) { let y = b.y0; while (y < b.y0 + b.h - 0.02) { const t = Math.min(0.045 + rng() * 0.015, b.y0 + b.h - y); BK.push([b, y, t]); y += t; } }
  const bookM = inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, BK.length));
  BK.forEach(([b, y, t], i) => { const j = (rng() - 0.5) * 0.12; bookM.setMatrixAt(i, _m4.compose(_v.set(b.x + (rng() - 0.5) * 0.01, y + t / 2, b.z + (rng() - 0.5) * 0.01), _q.setFromEuler(_e.set(0, j, 0)), _s.set(b.w - 0.012, t - 0.002, b.d - 0.012)));
    bookM.setColorAt(i, _c.set(BOOK_C[(i * 3 + Math.floor(rng() * 3)) % BOOK_C.length])); });
  bookM.instanceMatrix.needsUpdate = true; if (bookM.instanceColor) bookM.instanceColor.needsUpdate = true;
  // 연필: 노란 육각 몸통 + 나무 깎은 끝 + 흑심(정점색 한 지오메트리) — 반지름 0.018
  const PR = 0.018;
  const pencilGeo = (() => { const pos = [], nor = [], col = [];
    const add = (g, hex, ty, sy) => { const G = g.toNonIndexed(), P9 = G.attributes.position, N9 = G.attributes.normal; _c.set(hex);
      for (let i = 0; i < P9.count; i++) { pos.push(P9.getX(i), P9.getY(i) * sy + ty, P9.getZ(i)); nor.push(N9.getX(i), N9.getY(i), N9.getZ(i)); col.push(_c.r, _c.g, _c.b); } G.dispose(); g.dispose(); };
    add(new THREE.CylinderGeometry(1, 1, 1, 6, 1), 0xf4c430, 0, 0.84);                 // 몸통(y −0.42~0.42)
    add(new THREE.CylinderGeometry(0.35, 1, 1, 6, 1), 0xe8c79a, 0.47, 0.1);             // 깎은 나무
    add(new THREE.CylinderGeometry(0, 0.35, 1, 6, 1), 0x333333, 0.535, 0.03);          // 흑심
    add(new THREE.CylinderGeometry(1.02, 1.02, 1, 6, 1), 0xf2a0b0, -0.47, 0.1);       // 지우개
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; })();
  const pencilM = inst(pencilGeo, new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x1a1408 }), Math.max(1, pencils.length));
  pencils.forEach((p, i) => { _a.set(p.a[0], p.a[1] + PR, p.a[2]); _b.set(p.b[0], p.b[1] + PR, p.b[2]); const L = _a.distanceTo(_b) + 0.12;
    _v.subVectors(_b, _a).normalize(); _q.setFromUnitVectors(_up, _v); pencilM.setMatrixAt(i, _m4.compose(_s.addVectors(_a, _b).multiplyScalar(0.5), _q, _v.set(PR, L, PR))); });
  pencilM.instanceMatrix.needsUpdate = true;
  // 부스러기(과자 조각 — 납작한 이십면체 · 밝은 황갈) + 위로 옅은 빛줄기(찾기 쉽게)
  const crumbM = inst(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x4a3010 }), N_CRUMB);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, opacity: 0.35, depthWrite: false });
  const beamM = inst(new THREE.CylinderGeometry(0.004, 0.012, 1, 6, 1, true).translate(0, 0.5, 0), beamMat, N_CRUMB);
  crumbs.forEach((c, i) => { crumbM.setColorAt(i, _c.set(i % 2 ? 0xe0a458 : 0xd08c40)); });
  if (crumbM.instanceColor) crumbM.instanceColor.needsUpdate = true;
  const drawCrumb = (i, t) => { const c = crumbs[i];
    if (c.got) { crumbM.setMatrixAt(i, ZERO); beamM.setMatrixAt(i, ZERO); return; }
    crumbM.setMatrixAt(i, _m4.compose(_v.set(c.x, c.y + 0.012 + Math.sin(t * 2.2 + i) * 0.004, c.z), _q.setFromEuler(_e.set(0.3, t * 1.4 + i, 0.2)), _s.set(0.02, 0.012, 0.018)));
    beamM.setMatrixAt(i, _m4.compose(_v.set(c.x, c.y + 0.03, c.z), _q.identity(), _s.set(1, 0.32, 1))); };

  // ---------- 충돌(책 더미 = 상자 하나 · 연필 = 경사 다리 상자 줄) — 범위 파사드가 stop 때 뗀다 ----------
  for (const b of books) map.collider.add({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, y0: b.y0, y1: b.y0 + b.h, z0: b.z - b.d / 2, z1: b.z + b.d / 2 });
  for (const p of pencils) { const L = Math.hypot(p.b[0] - p.a[0], p.b[2] - p.a[2]), n = Math.max(2, Math.ceil(L / 0.03));
    for (let k = 0; k <= n; k++) { const t = k / n, x = p.a[0] + (p.b[0] - p.a[0]) * t, z = p.a[2] + (p.b[2] - p.a[2]) * t, y1 = p.a[1] + (p.b[1] - p.a[1]) * t + PR * 2;
      map.collider.add({ x0: x - 0.03, x1: x + 0.03, y0: y1 - 0.03, y1, z0: z - 0.03, z1: z + 0.03 }); } }

  // ---------- 판 ----------
  map.interact.enable(() => true, false);   // 앉기·칠판 등 평소 지점 끔(작은 몸으로 앉으면 이상) — 멈추면 원래대로
  const arenaR = [Math.min(room.x0, door0.x) - 1.2, Math.min(room.z0, room.z1, startAt[2]) - 1.2, Math.max(room.x1, door0.x) + 0.6, Math.max(room.z0, room.z1, startAt[2]) + 0.6];
  map.arena.set({ rect: [arenaR[0], arenaR[1], arenaR[2], arenaR[3]] });
  const marks = () => map.minimap.setMarks(crumbs.filter(c => !c.got).map(c => ({ x: c.x, z: c.z, color: '#e0a458', shape: 'star' })));
  const goalLine = () => map.hud.goal('🍪 과자 부스러기 ' + got + '/' + crumbs.length + ' 모으기');
  const home = () => { PL.teleport(startAt, { h: faceDoor }); map.hud.toast('↩ 처음 자리로'); };
  map.hud.chip('sh-home', '↩ 처음 자리(R)', { onClick: () => { if (st === 'play') home(); } });
  const onKey = e => { if (e.code === 'KeyR' && !e.repeat && st === 'play' && !e.ctrlKey && !e.metaKey) home(); };
  addEventListener('keydown', onKey);
  map.minimap.show(); marks(); goalLine();
  for (let i = 0; i < N_CRUMB; i++) if (i < crumbs.length) drawCrumb(i, 0);
  crumbM.instanceMatrix.needsUpdate = beamM.instanceMatrix.needsUpdate = true;
  PL.scale(0.95, { jump: JUMP }); shrinkT = 0; st = 'shrink';
  map.sfx('go');

  async function finish() {
    st = 'end'; PL.freeze(true); map.sfx('done');
    const rec = best == null || T < best; if (rec) { best = T; map.store.set('best', +T.toFixed(1)); }
    const i = await map.hud.ask('개미가 된 나 — 다 모았어요!\n걸린 시간 ' + fmt(T) + (rec ? ' · 새 기록!' : ' · 가장 빠른 기록 ' + fmt(best)), ['다시 하기', '그만하기']);
    if (dead || map.gone) return;
    if (i === 0) { for (const c of crumbs) c.got = false; got = 0; T = 0; secShown = -1; marks(); goalLine(); PL.teleport(startAt, { h: faceDoor }); PL.freeze(false); st = 'play'; map.hud.banner('다시!', 1); }
    else map.quit();
  }

  return {
    tick(dt) {
      if (st === 'shrink') {   // 1.2초에 걸쳐 0.95 → 1/12(지수로 — 처음 빨리, 끝에 천천히)
        shrinkT += dt; const k = Math.min(1, shrinkT / 1.2), s = Math.exp(Math.log(0.95) + (Math.log(S) - Math.log(0.95)) * (1 - (1 - k) * (1 - k)));
        PL.scale(s, { jump: JUMP * s / S });
        if (k >= 1) { PL.scale(S, { jump: JUMP }); st = 'play'; PL.freeze(false); map.hud.banner('개미만큼 작아졌어요!', 1.6); map.hud.toast('📚 책 더미·✏️ 연필 다리로 올라가요', 4); }
      }
      if (!crumbs.length) return;
      if (st === 'play') {
        T += dt; const sec = Math.floor(T); if (sec !== secShown) { secShown = sec; map.hud.chip('sh-time', '⏱ ' + fmt(T)); }
        const p = PL.pos(), py = p.y + 0.06;
        for (let i = 0; i < crumbs.length; i++) { const c = crumbs[i]; if (c.got) continue;
          const dx = c.x - p.x, dy = c.y - py, dz = c.z - p.z;
          if (dx * dx + dz * dz < 0.0081 && dy * dy < 0.012) { c.got = true; got++; map.sfx('pick'); map.hud.toast('🍪 ' + c.where + ' — ' + got + '/' + crumbs.length); goalLine(); marks(); if (got >= crumbs.length) finish(); } }
      }
      const t = T + shrinkT; for (let i = 0; i < crumbs.length; i++) drawCrumb(i, t);
      crumbM.instanceMatrix.needsUpdate = beamM.instanceMatrix.needsUpdate = true;
    },
    stop() { dead = true; removeEventListener('keydown', onKey); for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); },   // 메시는 범위 파사드(map.add)가 장면에서 뗀다 · 몸 크기는 엔진 reset이 1로
    // 시험·교사 시연용
    get state() { return st; }, get got() { return got; }, get time() { return T; },
    get crumbs() { return crumbs.map(c => ({ x: c.x, y: c.y, z: c.z, where: c.where, got: c.got })); },
    get books() { return books.map(b => ({ ...b })); }, get pencils() { return pencils.map(p => ({ a: p.a, b: p.b })); }, get start() { return startAt; },
    collect(i) { const c = crumbs[i]; if (c) PL.teleport([c.x, c.y - 0.02, c.z]); },
  };
}
