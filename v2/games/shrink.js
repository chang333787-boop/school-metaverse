// 개미가 된 나(GAME-SHRINK · 09-27 → G3-SHRINK2 스테이지 셋) — 몸이 1/12로 작아져 학교 방 하나를 모험하는 판. 정본 = docs/map_api.md §13 · 설계 docs/tasks/story_engine.md '작아지기'
//   사용자 09-27 "잇 테이크 투 같고, 잇테잌스투 기믹으로 스테이지 2개 정도 더 만들어 봐 · 게임 상호작용하면 실제 변화도 생기게" · "개미 모드 마지막 1개 못 찾았네"
//   스테이지 = 고르기 창(🍪 1 교실 · 🔬 2 과학실 · 🍽 3 급식실 — 기록 · ⭐ 옆에) → 작아지는 연출 → 판 → 끝 = '원래 크기로' 연출(하얗게 → 바닥에서 커짐) + 세상이 바뀜(칠판 글·선생님 만세·풍선) → 결과 창
//   1 교실 과자 모으기(예전 판): 책 더미·연필 다리로 책상·교탁·창턱 → 부스러기 8개 · 반짝임 + 60초 뒤 💡 가까운 부스러기 · 확대 미니맵
//   2 과학실 대모험: 🧪 실험 받침대 엘리베이터(올라서면 올라감) → 🧲 자석 단추 → 📏 1m 자 다리가 떠오름 → 🌀 선풍기 켜기 → 💨 바람 타고 점프 → ✏️ 연필 다리 → 📕 책 밀기 = 비탈 → 🧪 물약
//   3 급식실 대탈출: 🔘 서랍이 계단으로 → 🍽 오가는 식판 → 🥢 젓가락 다리 → 🥛 오르내리는 요구르트 징검다리 → 🍊 귤을 밀면 굴러가 🥄 숟가락 발사대(튀는 판 + 바람) → 🥛 우유
//   체크포인트 🚩(바닥으로 떨어지면 마지막 깃발로 · R · ↩ 칩) · ⭐ 별 5개(선택) · 💡 힌트(60초 넘게 진전이 없으면 H · 칩)
// 규칙(_template.js): import 금지(three = map.three) · 새 조명 없음 · 매 프레임 새 객체 없음(스크래치 재사용) · 게임이 멈추면 몸 크기·충돌·소품·사람·HUD 모두 원래대로(범위 파사드 + 엔진·세상 reset)
//   글(§16.1 · 09-27 사용자 '너가 다 써 줘'): 이야기·안내 글은 Claude가 씀 — 이름 있는 학생에게 대사 없음 · 선생님은 직함만(말 없이 자세·자리만 바꿈) · 실제 학교에 대한 사실 없음(물약·우유는 놀이 속 이야기)
//   그리기: 공용 InstancedMesh 풀(상자·원기둥·공·유리·연필·책·별·부스러기·반짝이·빛줄기 — 쓰는 것만 보임) + 세상 바꾸기 소품(발판·단추·깃발·상자) — 스테이지마다 +8~12콜
// 조작: 걷기 WASD/화살표·조이스틱 · 점프 Space/점프 버튼 · 달리기 Shift/조이스틱 끝 · E/✋ = 단추·밀기 · R/↩ 칩 = 체크포인트 · H/💡 칩 = 힌트 · M = 지도 크게
export const meta = { id: 'shrink', title: '개미가 된 나', api: 1 };

const S = 1 / 12, JUMP = 0.3, N_CRUMB = 8, N_STAR = 5, HINT_T = 60;
const PHYS1 = { jump: JUMP }, PHYS2 = { jump: JUMP, gravity: 0.5 };   // 2·3판: 중력 0.5(작은 몸 기본 √s ≈ 0.29) — 멀리뛰기가 1.3m 안쪽이라 넓은 틈은 기믹으로만 건넘
const BOOK_C = [0xd9534f, 0x4a90d9, 0x5cb85c, 0xf0ad4e, 0x8e6bbf, 0x3bb3a8, 0xe67aa0, 0x7d8a96];
const STAGES = [
  { n: 1, icon: '🍪', title: '교실 과자 모으기', sub: '부스러기 8개' },
  { n: 2, icon: '🔬', title: '과학실 대모험', sub: '물약을 찾아서' },
  { n: 3, icon: '🍽', title: '급식실 대탈출', sub: '우유를 찾아서' },
];
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default async function start(map, params = {}) {
  const THREE = map.three, PL = map.player, W = map.world;
  let dead = false, st = 'menu', stage = 0, T = 0, secShown = -1, anim = null, R = null, hintT = 0, hintOn = 0, hintIdx = -1, firstNote = {};
  const rec = { best: [map.store.get('best', null), map.store.get('best2', null), map.store.get('best3', null)], stars: [null, map.store.get('stars2', null), map.store.get('stars3', null)] };
  map.sfx('warm');

  // ---------- 공용 그리기 풀(게임 한 번에 한 벌 · 스테이지가 바뀌면 비우고 다시 씀) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), GEOS = [], MATS = [], POOLS = [];
  function pool(geo, mat, cap) { const m = new THREE.InstancedMesh(geo, mat, cap); m.frustumCulled = false; m.castShadow = m.receiveShadow = false; m.count = 0; m.visible = false;
    for (let i = 0; i < cap; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, _c.set(0xffffff)); } GEOS.push(geo); MATS.push(mat); map.add(m);
    const P9 = { m, cap, n: 0, dirty: false }; POOLS.push(P9); return P9; }
  const alloc = (P9, color = 0xffffff) => { if (P9.n >= P9.cap) { console.warn('[shrink] 풀이 찼어요', P9.cap); return -1; } const i = P9.n++; P9.m.count = P9.n; P9.m.visible = true; P9.m.setColorAt(i, _c.set(color)); P9.m.instanceColor.needsUpdate = true; return i; };
  const put = (P9, i, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => { if (i < 0) return; P9.m.setMatrixAt(i, _m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz))); P9.dirty = true; };
  const hideI = (P9, i) => { if (i >= 0) { P9.m.setMatrixAt(i, ZERO); P9.dirty = true; } };
  const tint = (P9, i, color) => { if (i >= 0) { P9.m.setColorAt(i, _c.set(color)); P9.m.instanceColor.needsUpdate = true; } };
  const poolsReset = () => { for (const P9 of POOLS) { for (let i = 0; i < P9.n; i++) P9.m.setMatrixAt(i, ZERO); P9.n = 0; P9.m.count = 0; P9.m.visible = false; P9.m.instanceMatrix.needsUpdate = true; } };
  const lam = o => new THREE.MeshLambertMaterial(o);
  const BX = pool(new THREE.BoxGeometry(1, 1, 1), lam({ color: 0xffffff }), 560);                                   // 상자(책 더미·책 벽·자석·받침대·깃발 천·우유갑·바람 줄…)
  const CY = pool(new THREE.CylinderGeometry(1, 1, 1, 10, 1), lam({ color: 0xffffff }), 90);                          // 원기둥(물·요구르트 병·젓가락·선풍기…)
  const SP = pool(new THREE.SphereGeometry(1, 12, 8), lam({ color: 0xffffff, emissive: 0x221100 }), 24);              // 공(귤·물약·단추 머리)
  const GL = pool(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), lam({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }), 48);   // 유리(비커·플라스크)
  const PR = 0.018;   // 연필 반지름
  const pencilGeo = (() => { const pos = [], nor = [], col = [];
    const add = (g, hex, ty, sy) => { const G = g.toNonIndexed(), P9 = G.attributes.position, N9 = G.attributes.normal; _c.set(hex);
      for (let i = 0; i < P9.count; i++) { pos.push(P9.getX(i), P9.getY(i) * sy + ty, P9.getZ(i)); nor.push(N9.getX(i), N9.getY(i), N9.getZ(i)); col.push(_c.r, _c.g, _c.b); } G.dispose(); g.dispose(); };
    add(new THREE.CylinderGeometry(1, 1, 1, 6, 1), 0xf4c430, 0, 0.84); add(new THREE.CylinderGeometry(0.35, 1, 1, 6, 1), 0xe8c79a, 0.47, 0.1);
    add(new THREE.CylinderGeometry(0, 0.35, 1, 6, 1), 0x333333, 0.535, 0.03); add(new THREE.CylinderGeometry(1.02, 1.02, 1, 6, 1), 0xf2a0b0, -0.47, 0.1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; })();
  const PEN = pool(pencilGeo, lam({ vertexColors: true, emissive: 0x1a1408 }), 8);
  const CRUMB = pool(new THREE.IcosahedronGeometry(1, 0), lam({ color: 0xffffff, emissive: 0x4a3010 }), N_CRUMB);
  const starGeo = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.36, bevelEnabled: false }); g.translate(0, 0, -0.18); return g; })();
  const STAR = pool(starGeo, lam({ color: 0xffffff, emissive: 0x6a5000 }), N_STAR + 3 * Math.max(N_CRUMB, N_STAR));   // 별 + 반짝이(수집품마다 작은 별 셋 — 드로우콜을 아끼려고 한 풀)
  const SPK = STAR;
  const BEAM = pool(new THREE.CylinderGeometry(0.004, 0.012, 1, 6, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false }), N_CRUMB + 6);   // 빛줄기(수집품 · 다음 목표 · 힌트)

  // ---------- 스테이지 자원 주머니(스테이지를 바꾸면 한꺼번에 뗀다 — 게임이 멈추면 범위 파사드·엔진·세상 reset이 나머지를) ----------
  const bag = [];
  const own = h => { if (h) bag.push(h); return h; };
  const bagClear = () => { for (const h of bag.splice(0).reverse()) { try { if (typeof h === 'function') h(); else if (h.remove) h.remove(); } catch (e) { console.error('[shrink] 정리', e); } } };
  const col = (b, o) => own(map.collider.add(b, o));
  const spawn = (kind, at, o) => own(W.spawn(kind, at, o));
  const top = (x, z, from = 1.6) => PL.groundAt(x, z, from);
  const free = (x, y, z) => !PL.blockedAt(x, z, y, 1.5 * S);
  const warn = (...a) => console.warn('[shrink]', ...a);
  const headTo = (x0, z0, x1, z1) => (Math.atan2(x1 - x0, -(z1 - z0)) * 180 / Math.PI + 360) % 360;
  const wait = sec => new Promise(res => setTimeout(res, sec * 1000));
  // 체크포인트 깃발(공용 풀: 기둥 = 원기둥 · 천 = 상자 — 닿으면 초록) → 천의 상자 번호
  const flag = (x, y, z) => { put(CY, alloc(CY, 0xdfe3e6), x, y + 0.075, z, 0.004, 0.15, 0.004); const i = alloc(BX, 0xbfc5cc); put(BX, i, x + 0.03, y + 0.125, z, 0.055, 0.04, 0.004); return i; };

  // ---------- 입력(게임 한 벌) ----------
  const onKey = e => { if (e.repeat || e.ctrlKey || e.metaKey) return;
    if (e.code === 'KeyR' && st === 'play') respawn(true); else if (e.code === 'KeyH' && st === 'play') hint(); };
  addEventListener('keydown', onKey);

  // =====================================================================
  // 스테이지 1 — 교실 과자 모으기(돌봄교실 + 앞 복도 · 예전 판 그대로 + 찾기 도움)
  // =====================================================================
  function build1() {
    const ROOM = 'care', room = map.zone(ROOM); if (!room) return null;
    const doors = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(room.id));
    const corrId = doors.length ? doors[0].zones.find(z => z && z !== room.id) : null;
    const inZ = (id, x, z, y = 0.3) => { const zn = map.zoneAt(x, y, z); return !!zn && zn.id === id; };
    const door0 = doors.slice().sort((a, b) => a.x - b.x)[0];
    let startAt = null;
    for (const [dx, dz] of [[0, -1.3], [0, 1.3], [-1.3, 0], [1.3, 0]]) if (!startAt && inZ(corrId, door0.x + dx, door0.z + dz)) startAt = [door0.x + dx, map.q.floorY(door0.x + dx, door0.z + dz), door0.z + dz];
    if (!startAt) startAt = [door0.x, 0, door0.z - 1.3];
    const faceDoor = headTo(startAt[0], startAt[2], door0.x, door0.z);
    PL.teleport(startAt, { h: faceDoor }); PL.scale(S, PHYS1);   // 작은 몸 판을 먼저 켜서 윗면 높이를 잰다
    const seats = map.interact.list({ kind: 'sit', zone: room.id }).map(h => ({ x: h.x, z: h.z }));
    const rowsX = [...new Set(seats.map(s => +s.x.toFixed(2)))].sort((a, b) => a - b);
    const row = k => seats.filter(s => Math.abs(s.x - rowsX[k]) < 0.05).sort((a, b) => a.z - b.z);
    const tdesk = map.hide.candidates({ zone: room.id, kinds: ['desk'], max: 1 })[0] || null;
    const lockers = map.hide.candidates({ zone: room.id, kinds: ['locker'], max: 10 });
    const winS = Math.sign(room.z1 - door0.z) || 1;
    const winL = lockers.filter(c => c.w >= 2).sort((a, b) => winS * (b.z - a.z))[0] || null;
    const corrL = map.hide.candidates({ near: [door0.x, door0.z], r: 7, kinds: ['locker'], max: 12 }).filter(c => inZ(corrId, c.x, c.z, 0.5))
      .sort((a, b) => Math.hypot(a.x - door0.x, a.z - door0.z) - Math.hypot(b.x - door0.x, b.z - door0.z))[0] || null;
    const items = [], books = [], pencils = [];
    const addCrumb = (x, y, z, where) => { items.push({ x, y: y + 0.02, z, where, got: false }); };
    const ramp = (a, b) => pencils.push({ a, b });
    // ① 복도 사물함: 앞에 책 더미 계단 → 사물함 위 · 사물함 옆 좁은 틈(작은 몸만)
    if (corrL) {
      const fz = corrL.face === 180 ? 1 : corrL.face === 0 ? -1 : 0, fx = corrL.face === 90 ? 1 : corrL.face === 270 ? -1 : 0;
      const ltop = top(corrL.x, corrL.z, 1.6);
      let d = 0; while (d < 0.8 && top(corrL.x + fx * d, corrL.z + fz * d, 1.6) > 0.3) d += 0.02;
      const fx0 = corrL.x + fx * d, fz0 = corrL.z + fz * d, ax = Math.abs(fz), az = Math.abs(fx);
      const n = Math.max(1, Math.ceil((ltop - 0.2) / 0.27)), stp = (ltop - 0.2) / n;
      for (let k = 0; k < n; k++) { const o = -0.45 + k * 0.24, x = fx0 + ax * o + fx * 0.115, z = fz0 + az * o + fz * 0.115;
        books.push({ x, z, y0: map.q.floorY(x, z), h: stp * (k + 1), w: ax ? 0.24 : 0.2, d: ax ? 0.2 : 0.24 }); }
      addCrumb(corrL.x + ax * (corrL.w / 2 - 0.2), ltop, corrL.z + az * (corrL.w / 2 - 0.2), '복도 사물함 위');
      let gap = null;
      for (const sgn of [1, -1]) { if (gap) break; const e = corrL.w / 2; let a0 = null;
        for (let o = e + 0.02; o < e + 0.5; o += 0.01) { const x = corrL.x + ax * sgn * o, z = corrL.z + az * sgn * o, y = map.q.floorY(x, z);
          const ok = free(x, y, z) && top(x, z, y + 0.2) < y + 0.03;
          if (ok && a0 == null) a0 = o; if (!ok && a0 != null) { if (o - a0 < 0.35 && o - a0 > 0.08) { const m = (a0 + o) / 2; gap = [corrL.x + ax * sgn * m, y, corrL.z + az * sgn * m]; } break; } } }
      if (gap && map.q.blocked(gap[0], gap[2], gap[1])) addCrumb(gap[0], gap[1], gap[2], '복도 사물함 틈'); else warn('사물함 틈을 못 찾음');
    } else warn('복도 사물함 없음');
    // ② 교실: 의자 옆 책 더미 → 의자 → 책상 · 책상 → 연필 다리 → 교탁 → 연필 다리 → 창가 사물함 → 창턱
    const r1 = row(0), r2 = rowsX.length > 1 ? row(1) : [];
    if (r1.length) {
      const cA = r1[0], chX = cA.x - 0.5, dkX = cA.x - 1.05;
      books.push({ x: chX, z: cA.z - 0.36, y0: map.q.floorY(chX, cA.z - 0.36), h: 0.25, w: 0.2, d: 0.2 });
      addCrumb(dkX + 0.05, top(dkX, cA.z, 1.2), cA.z - 0.12, '책상 위');
      const cB = r1[r1.length - 1], bX = cB.x - 1.05, bTop = top(bX, cB.z, 1.2);
      if (tdesk) {
        const T0 = { x0: tdesk.x - 0.3, x1: tdesk.x + 0.3, z0: tdesk.z - 0.6, z1: tdesk.z + 0.6 }, D0 = { x0: bX - 0.25, x1: bX + 0.25, z0: cB.z - 0.35, z1: cB.z + 0.35 };
        const cl = (v, a, b) => Math.max(a + 0.08, Math.min(b - 0.08, v));
        const pa = [cl(T0.x1, D0.x0, D0.x1), cl((T0.z0 + T0.z1) / 2, D0.z0, D0.z1)], pb = [cl(D0.x0, T0.x0, T0.x1), cl((D0.z0 + D0.z1) / 2, T0.z0, T0.z1)];
        const tTop = top(tdesk.x + 0.2, tdesk.z, 1.2);
        addCrumb(bX, bTop, cB.z + 0.12, '책상 위');
        ramp([pa[0], bTop, pa[1]], [pb[0], tTop, pb[1]]);
        addCrumb(pb[0], tTop, tdesk.z, '교탁 위');
        if (winL) {
          const lz0 = winL.z - winS * 0.225, lTop = top(winL.x, winL.z, 1.2), ez = winS > 0 ? T0.z1 : T0.z0;
          ramp([pb[0], tTop, ez - winS * 0.08], [pb[0], lTop, lz0 + winS * 0.08]);
          addCrumb(winL.x + winL.w / 2 - 0.3, lTop, winL.z, '창가 사물함 위');
          let sill = null;
          for (const dz of [0.02, 0.03, 0.015, 0.035, 0.01, 0.045]) { if (sill) break; const zs = winL.z + winS * (0.225 + dz);
            const isSill = (x, y = top(x, zs, 1.3)) => y > lTop + 0.05 && y < 1.35 && free(x, y, zs);
            for (let x = winL.x + winL.w / 2 - 0.15; x > winL.x - winL.w / 2 + 0.15; x -= 0.05) if (isSill(x)) { const x2 = isSill(x - 0.4) ? x - 0.4 : x; sill = [x2, top(x2, zs, 1.3), zs]; break; } }
          if (sill) addCrumb(sill[0], sill[1], sill[2], '창턱'); else warn('창턱을 못 찾음');
        } else warn('창가 사물함 없음');
      } else warn('교탁 없음');
      const cC = (r2.length ? r2 : r1)[0];
      addCrumb(cC.x - 0.5, map.q.floorY(cC.x - 0.5, cC.z), cC.z, '의자 밑');
    } else warn('교실 자리 없음');
    for (let k = 0; items.length < N_CRUMB && k < 200; k++) { const x = room.x0 + 0.6 + (k * 0.37) % (room.x1 - room.x0 - 1.2), z = room.z0 + 0.6 + (k * 0.73) % (room.z1 - room.z0 - 1.2), y = map.q.floorY(x, z);
      if (free(x, y, z)) addCrumb(x, y, z, '교실 바닥'); }
    items.length = Math.min(items.length, N_CRUMB);
    // ③ 놀이 칸 경계 = 책 벽(복도 양 끝 + 복도 건너편 트인 곳 — 작은 몸으로 재어 트인 구간만)
    const arenaR = [Math.min(room.x0, door0.x) - 1.2, Math.min(room.z0, room.z1, startAt[2]) - 1.2, Math.max(room.x1, door0.x) + 0.6, Math.max(room.z0, room.z1, startAt[2]) + 0.6];
    const corr = corrId ? map.zone(corrId) : null, WALL_H = 0.5, walls = [];
    if (corr) {
      const alongX = Math.abs(door0.z - room.z0) < 0.6 || Math.abs(door0.z - room.z1) < 0.6, XZ = (a, b) => alongX ? [a, b] : [b, a];
      const A0 = alongX ? arenaR[0] : arenaR[1], A1 = alongX ? arenaR[2] : arenaR[3], B0 = alongX ? corr.z0 : corr.x0, B1 = alongX ? corr.z1 : corr.x1;
      const rs = Math.sign((alongX ? (room.z0 + room.z1) / 2 : (room.x0 + room.x1) / 2) - (alongX ? door0.z : door0.x)) || 1, far = rs > 0 ? B0 : B1;
      const open = (a, b) => { const [x, z] = XZ(a, b), y = map.q.floorY(x, z); return free(x, y, z) && top(x, z, y + 0.1) < y + 0.05; };
      const runs = (s0, s1, ok) => { const R9 = []; let r0 = null; for (let s = s0; s <= s1 + 1e-6; s += 0.05) { const o = ok(s); if (o && r0 == null) r0 = s; if (!o && r0 != null) { R9.push([r0, s - 0.05]); r0 = null; } } if (r0 != null) R9.push([r0, s1]); return R9.filter(r => r[1] - r[0] > 0.04); };
      const wall = (a0, a1, b0, b1, alongA) => walls.push({ a0, a1, b0, b1, alongA });
      for (const aE of [A0 + 0.3, A1 - 0.3]) for (const [s0, s1] of runs(B0 + 0.05, B1 - 0.05, b => open(aE, b))) wall(aE - 0.1, aE + 0.1, s0 - 0.06, s1 + 0.06, false);
      for (const [s0, s1] of runs(A0 + 0.4, A1 - 0.4, a => open(a, far - rs * 0.12))) wall(s0 - 0.06, s1 + 0.06, rs > 0 ? far : far - 0.2, rs > 0 ? far + 0.2 : far, true);
      for (const Wl of walls) {
        const L = Wl.alongA ? Wl.a1 - Wl.a0 : Wl.b1 - Wl.b0, n = Math.max(1, Math.round(L / 0.24)), s9 = L / n;
        for (let k = 0; k < n; k++) { const m = (Wl.alongA ? Wl.a0 : Wl.b0) + s9 * (k + 0.5), a = Wl.alongA ? m : (Wl.a0 + Wl.a1) / 2, b = Wl.alongA ? (Wl.b0 + Wl.b1) / 2 : m, [x, z] = XZ(a, b);
          const wa = Wl.alongA ? s9 : Wl.a1 - Wl.a0, wb = Wl.alongA ? Wl.b1 - Wl.b0 : s9, [w, d] = alongX ? [wa, wb] : [wb, wa];
          books.push({ x, z, y0: map.q.floorY(x, z), h: WALL_H, w, d, wall: true }); }
        const [xa, za] = XZ(Wl.a0, Wl.b0), [xb, zb] = XZ(Wl.a1, Wl.b1);
        Wl.box = { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb), y0: map.q.floorY((xa + xb) / 2, (za + zb) / 2) };
      }
    } else warn('복도를 못 찾음 — 책 벽 없음');
    // 그리기 · 충돌
    drawBooks(books, params.seed || 7);
    for (const p of pencils) pencil(p.a, p.b);
    for (const b of books) if (!b.wall) col({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, y0: b.y0, y1: b.y0 + b.h, z0: b.z - b.d / 2, z1: b.z + b.d / 2 });
    for (const Wl of walls) col({ x0: Wl.box.x0, x1: Wl.box.x1, y0: Wl.box.y0, y1: Wl.box.y0 + WALL_H, z0: Wl.box.z0, z1: Wl.box.z1 });
    own(map.interact.enable(() => true, false));   // 앉기·칠판 등 평소 지점 끔(작은 몸으로 앉으면 이상)
    const fin = map.findEntry((room.x0 + room.x1) / 2, (room.z0 + room.z1) / 2, 0, [room.x0, room.z0, room.x1, room.z1], 5);
    return { room, arena: arenaR, arenaMsg: '교실과 그 앞 복도에서만 놀아요', items, kind: 'crumb', books, pencils, need: items.length,
      cps: [{ at: startAt, h: faceDoor, minY: -9, rect: null, name: '처음 자리' }],
      goal: () => '🍪 과자 부스러기 ' + R.got + '/' + R.items.length + ' 모으기',
      finale: { at: fin ? [fin.x, fin.y, fin.z] : [(room.x0 + room.x1) / 2, 0, (room.z0 + room.z1) / 2], look: (b9 => b9 ? [b9.x, b9.z] : null)(map.interact.list({ kind: 'board', zone: room.id })[0]),
        world: () => { const b = W.paint('board:' + room.id, { text: '개미 탐험 대성공!', color: '#1f8a4c' }); if (b) own(b);
          const t = map.npc.get('돌봄선생님'); if (t) { own(() => map.npc.home('돌봄선생님')); walkTo('돌봄선생님', 1.4, 'cheer'); } } } };
  }
  // 책 더미(InstancedMesh BOOK — 권 두께 0.045~0.06 · 조금씩 비뚤게)
  function drawBooks(books, seed) { const rng = map.rng(seed);
    for (const b of books) { let y = b.y0; while (y < b.y0 + b.h - 0.02) { const t = Math.min(0.045 + rng() * 0.015, b.y0 + b.h - y), i = alloc(BX, BOOK_C[(BX.n * 3 + Math.floor(rng() * 3)) % BOOK_C.length]);
      put(BX, i, b.x + (rng() - 0.5) * 0.01, y + t / 2, b.z + (rng() - 0.5) * 0.01, b.w - 0.012, t - 0.002, b.d - 0.012, 0, (rng() - 0.5) * 0.12, 0); y += t; } } }
  // 연필 다리(보이는 연필 + 3cm 간격 경사 상자 줄 — 작은 몸이 걸어 오름)
  function pencil(a, b) { const i = alloc(PEN); if (i < 0) return;
    _a.set(a[0], a[1] + PR, a[2]); _b.set(b[0], b[1] + PR, b[2]); const L = _a.distanceTo(_b) + 0.12;
    _v.subVectors(_b, _a).normalize(); _q.setFromUnitVectors(_up, _v); PEN.m.setMatrixAt(i, _m4.compose(_s.addVectors(_a, _b).multiplyScalar(0.5), _q, _v.set(PR, L, PR))); PEN.dirty = true;
    chain(a, b, 0.03, PR * 2); }
  function chain(a, b, hw, th) { const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(2, Math.ceil(L / 0.03));
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y1 = a[1] + (b[1] - a[1]) * t + th;
      col({ x0: x - hw, x1: x + hw, y0: y1 - Math.max(0.03, th), y1, z0: z - hw, z1: z + hw }); } }
  // 선생님이 내 쪽으로 걸어와 자세(대역 — 게임이 멈추거나 스테이지를 바꾸면 제자리로)
  function walkTo(name, dist, pose) { const t = map.npc.get(name), p = PL.pos(); if (!t) return;
    const d = Math.hypot(t.x - p.x, t.z - p.z) || 1, x = p.x + (t.x - p.x) / d * dist, z = p.z + (t.z - p.z) / d * dist;
    const e = map.findEntry(x, z, p.y, [x - 2, z - 2, x + 2, z + 2], 3) || { x, y: p.y, z };   // 사람 몸이 설 빈 칸(평소 몸 기준)
    map.npc.move(name, { x: e.x, y: e.y, z: e.z }, { walk: true, pose, face: headTo(e.x, e.z, p.x, p.z) }); }

  // =====================================================================
  // 스테이지 2 — 과학실 대모험(실험대 세 줄 · 시연대 · 과학선생님)
  // =====================================================================
  function build2() {
    const room = map.zone('science'); if (!room) return null;
    own(map.interact.enable(h => h.kind !== 'game', false));   // 칠판 낙서·의자 앉기 등 평소 지점 끔(작은 몸) — 스테이지 끝·멈추면 원래대로
    const sits = map.interact.list({ kind: 'sit', zone: room.id });
    const xA = sits.length ? sits[0].x + 1.15 : room.x1 - 0.15 - 2.8, zMid = (room.z0 + room.z1) / 2;
    const czN = sits.length ? sits.filter(s => s.z < zMid).reduce((a, s) => a + s.z, 0) / Math.max(1, sits.filter(s => s.z < zMid).length) : zMid - 1.6;
    const xw = room.x0 + 0.15, xe = room.x1 - 0.15, xB = xw + 0.92, xM = (xA + xB) / 2 + 0.3, TT = 0.81;
    const board = map.interact.list({ kind: 'board', zone: room.id })[0], zb = board ? board.z : zMid + 0.55, xD = xe - 1.35, DT = 0.84;
    const d52 = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(room.id)).sort((a, b) => a.x - b.x);
    const door = d52[0] || { x: xB + 0.25, z: room.z0 };
    // 윗면 확인(작은 몸 판) — 월드가 바뀌면 경고만
    PL.teleport([door.x + 0.15, 0, room.z0 + 0.55]); PL.scale(S, PHYS2);
    for (const [x, z, y, what] of [[xB, czN, TT, '실험대 B'], [xM, czN, TT, '실험대 M'], [xA, czN, TT, '실험대 A'], [xD, zb, DT, '시연대']]) { const g = top(x, z, 1.2); if (Math.abs(g - y) > 0.02) warn(what + ' 윗면이 달라요', +g.toFixed(3), y); }
    const items = [], cps = [], obj = [];
    const star = (x, y, z, where) => items.push({ x, y: y + 0.03, z, where, got: false, r3: true });
    const startAt = [door.x + 0.15, 0, room.z0 + 0.55];
    // 체크포인트(깃발 = 공용 풀 기둥 + 천 · 충돌 없음) — rect = 그 윗면 · minY = 이보다 낮게 떨어지면 되돌림
    const cp = (x, y, z, h, rect, name, minY) => cps.push({ at: [x, y, z], h, rect, y, minY, name, flag: rect ? flag(x + 0.08, y, z + 0.08) : null });
    cp(startAt[0], 0, startAt[2], headTo(startAt[0], startAt[2], xB, czN - 1.06), null, '문 앞', -9);
    // --- 🧪 실험 받침대 엘리베이터(실험대 B 북쪽 끝) — 올라서면 올라가고, 비면 내려온다
    const ex = xB, ez = czN - 0.9 - 0.16, eTop = TT + 0.005;
    const lift = spawn('platform', { x: ex, z: ez, y: 0 }, { size: [0.3, 0.03, 0.3], color: 0x9fd7ff });
    const jb = alloc(BX, 0x5a6270), ja = [alloc(BX, 0x8a939e), alloc(BX, 0x8a939e), alloc(BX, 0x8a939e), alloc(BX, 0x8a939e)];
    const bk = alloc(GL, 0xd8f1ff), bw = alloc(CY, 0x4fb3ff);
    put(BX, jb, ex, 0.006, ez, 0.34, 0.012, 0.34);
    const E9 = { st: 'down', t: 0, on: 0, y: 0 };
    const drawLift = () => { const y = lift ? lift.y : 0, h = Math.max(0.02, y), w = 0.24, L = Math.hypot(w, h), a = Math.atan2(h, w);
      for (let k = 0; k < 4; k++) put(BX, ja[k], ex, h / 2 + 0.006, ez + (k < 2 ? -0.11 : 0.11), L, 0.012, 0.012, 0, 0, k % 2 ? a : -a);
      put(GL, bk, ex + 0.1, y + 0.03 + 0.045, ez + 0.1, 0.035, 0.09, 0.035); put(CY, bw, ex + 0.1, y + 0.03 + 0.025, ez + 0.1, 0.032, 0.05, 0.032); };
    drawLift();
    obj.push({ text: '🧪 받침대 엘리베이터에 올라타요', at: [ex, 0.03, ez] });
    star(ex, 0.42, ez, '엘리베이터 가운데(타고 올라가며)');   // 바닥 별은 두지 않는다 — 깃발을 지나면 바닥 = 떨어짐
    cp(xB, TT, czN - 0.55, 180, [xB - 0.4, czN - 0.9, xB + 0.4, czN + 0.9], '실험대 1', 0.5);
    star(xB - 0.22, TT, czN + 0.7, '실험대 1 구석'); star(xw + 0.25, 0.91, czN - 1.55, '연두 장 위');
    // --- 🧲 자석 단추 → 📏 1m 자 다리(바닥에 누워 있다가 실험대 높이로 떠오름)
    const rz = czN, rx0 = xB + 0.36, rx1 = xM - 0.36, rulerY = TT - 0.02;
    const ruler = spawn('platform', { x: (rx0 + rx1) / 2, z: rz, y: 0 }, { size: [rx1 - rx0, 0.02, 0.1], color: 0xf2c94c });
    const mg = [alloc(BX, 0xd9453b), alloc(BX, 0xd9453b), alloc(BX, 0xd9453b), alloc(BX, 0xdfe3e6), alloc(BX, 0xdfe3e6)], mx = xM - 0.3, mz = rz - 0.2;
    const drawMag = (k = 0) => { const y = TT, s = 1 + k * 0.08; put(BX, mg[0], mx, y + 0.07 * s, mz - 0.05, 0.05, 0.12 * s, 0.03); put(BX, mg[1], mx, y + 0.07 * s, mz + 0.05, 0.05, 0.12 * s, 0.03); put(BX, mg[2], mx, y + 0.12 * s, mz, 0.05, 0.03, 0.13);
      put(BX, mg[3], mx, y + 0.012, mz - 0.05, 0.051, 0.024, 0.031); put(BX, mg[4], mx, y + 0.012, mz + 0.05, 0.051, 0.024, 0.031); };
    drawMag(); col({ x0: mx - 0.03, x1: mx + 0.03, y0: TT, y1: TT + 0.14, z0: mz - 0.07, z1: mz + 0.07 }, { ns: true });
    let magOn = false, magT = 0;
    spawn('button', { x: xB + 0.2, z: czN + 0.35, y: TT }, { size: [0.05, 0.05, 0.05], color: 0xd9453b, r: 0.16, label: '🧲 자석 켜기', onUse: () => {
      if (magOn) { map.hud.toast('자석은 벌써 켜졌어요 — 자 다리를 건너요'); return; }
      magOn = true; magT = 0.01; progress(); if (ruler) ruler.move({ y: rulerY }, { tween: 2.2 }); map.sfx('go'); map.hud.toast('🧲 자석이 켜졌어요! 쇠 자가 떠올라요', 3); advance(2); } });
    obj.push({ text: '🧲 자석 단추를 눌러요 (E / ✋)', at: [xB + 0.2, TT + 0.05, czN + 0.35] });
    obj.push({ text: '📏 떠오른 자 다리를 건너요', at: [(rx0 + rx1) / 2, TT, rz] });
    star((rx0 + rx1) / 2 + 0.3, TT + 0.02, rz, '자 다리 위');
    cp(xM - 0.1, TT, czN - 0.45, 90, [xM - 0.4, czN - 0.9, xM + 0.4, czN + 0.9], '실험대 2', 0.5);
    // --- 🌀 선풍기 단추 → 바람 길(실험대 2 → 실험대 3 · 발이 윗면 +5cm보다 높을 때만 = 점프해야 탐)
    const fx9 = xM - 0.02, fz9 = czN + 0.55, lane = [fz9 - 0.3, fz9 + 0.3];
    const fanI = { base: alloc(CY, 0x5a6270), pole: alloc(CY, 0xdfe3e6), hub: alloc(SP, 0x5a6270), cage: alloc(GL, 0xbfe3ff), bl: [alloc(BX, 0x9fd4ff), alloc(BX, 0x9fd4ff), alloc(BX, 0x9fd4ff)] };
    let fanOn = false, fanA = 0, windH = null;
    const drawFan = () => { const y = TT; put(CY, fanI.base, fx9, y + 0.006, fz9, 0.05, 0.012, 0.05); put(CY, fanI.pole, fx9, y + 0.05, fz9, 0.008, 0.09, 0.008); put(SP, fanI.hub, fx9 + 0.012, y + 0.1, fz9, 0.018, 0.018, 0.018);
      put(GL, fanI.cage, fx9 + 0.02, y + 0.1, fz9, 0.07, 0.012, 0.07, 0, 0, Math.PI / 2);
      for (let k = 0; k < 3; k++) put(BX, fanI.bl[k], fx9 + 0.022, y + 0.1, fz9, 0.004, 0.12, 0.022, fanA + k * Math.PI / 3, 0, 0); };
    drawFan(); col({ x0: fx9 - 0.05, x1: fx9 + 0.05, y0: TT, y1: TT + 0.18, z0: fz9 - 0.07, z1: fz9 + 0.07 }, { ns: true });
    const streak = []; for (let k = 0; k < 10; k++) streak.push(alloc(BX, 0xffffff));
    spawn('button', { x: xM + 0.22, z: czN - 0.05, y: TT }, { size: [0.05, 0.05, 0.05], color: 0x3a8fd9, r: 0.16, label: '🌀 선풍기 켜기', onUse: () => {
      if (fanOn) { map.hud.toast('선풍기는 벌써 돌아요 — 바람 속으로 점프!'); return; }
      fanOn = true; progress(); windH = own(W.wind({ rect: [fx9 + 0.06, lane[0], xA - 0.62, lane[1]], y0: TT + 0.05, y1: TT + 0.7, h: 90, speed: 7 })); map.sfx('go'); map.hud.toast('🌀 바람이 불어요! 바람 속으로 점프하면 날아가요', 3.5); advance(4); } });
    obj.push({ text: '🌀 선풍기 단추를 눌러요', at: [xM + 0.22, TT + 0.05, czN - 0.05] });
    obj.push({ text: '💨 바람 속으로 점프해 건너요!', at: [xA - 0.4, TT, fz9] });
    star((fx9 + xA - 0.62) / 2 + 0.2, TT + 0.22, fz9, '바람 길 한가운데');
    cp(xA + 0.05, TT, czN - 0.4, 90, [xA - 0.4, czN - 0.9, xA + 0.4, czN + 0.9], '실험대 3', 0.5);
    // --- ✏️ 연필 다리(실험대 3 → 시연대 — 비스듬히) · 📕 책 밀기 → 비탈 → 🧪 물약(책 받침대 위 — 점프로는 안 닿는 높이)
    const pa = [xA + 0.33, TT, czN + 0.8], pb = [xD - 0.28, DT, zb - 1.21 + 0.14];
    pencil(pa, pb);
    obj.push({ text: '✏️ 연필 다리로 시연대에 가요', at: [(pa[0] + pb[0]) / 2, TT + 0.05, (pa[2] + pb[2]) / 2] });
    const pedZ = zb + 0.1, pedH = 0.42, PT = DT + pedH, bookL = 0.68, bookT = 0.035;
    const ped = [{ x: xD, z: pedZ, y0: DT, h: pedH, w: 0.26, d: 0.26 }]; drawBooks(ped, 11);
    col({ x0: xD - 0.13, x1: xD + 0.13, y0: DT, y1: PT, z0: pedZ - 0.13, z1: pedZ + 0.13 });
    const pz0 = pedZ - 0.13, rampLow = pz0 - Math.sqrt(bookL * bookL - pedH * pedH);   // 비탈 아래 끝(시연대 윗면) z
    const flatZ = [zb - 1.21 + 0.1, zb - 1.21 + 0.1 + bookL];   // 처음 = 시연대 북쪽 끝에 누운 책
    const bookI = alloc(BX, 0x2f6fd0), bookP = alloc(BX, 0xf7f3e8);
    let bookK = 0, bookA = 0, flatCol = col({ x0: xD - 0.12, x1: xD + 0.12, y0: DT, y1: DT + bookT, z0: flatZ[0], z1: flatZ[1] }), rampMade = false;
    const drawBook = () => { const k = bookK, zc0 = (flatZ[0] + flatZ[1]) / 2, zc1 = (rampLow + pz0) / 2, ang = Math.atan2(pedH, pz0 - rampLow) * k;
      const zc = zc0 + (zc1 - zc0) * k, yc = DT + bookT / 2 + (pedH / 2) * k;
      put(BX, bookI, xD, yc, zc, 0.24, bookT, bookL, -ang, 0, 0); put(BX, bookP, xD, yc + 0.001, zc, 0.225, bookT * 0.7, bookL - 0.02, -ang, 0, 0); };   // x축 −각 = 남쪽(+z) 끝이 올라감
    drawBook();
    const pushH = own(map.interact.add({ x: xD, y: DT, z: flatZ[0] - 0.02, r: 0.2, label: '📕 책 밀기', use: () => {
      if (bookA || rampMade) return; bookA = 0.001; map.sfx('tick'); progress(); } }));
    obj.push({ text: '📕 누운 책을 밀어 비탈을 만들어요', at: [xD, DT + 0.04, flatZ[0]] });
    const potion = { x: xD, y: PT, z: pedZ }, po = [alloc(SP, 0xff6fb5), alloc(GL, 0xffffff), alloc(CY, 0xf2c94c)];
    put(SP, po[0], potion.x, PT + 0.05, potion.z, 0.045, 0.045, 0.045); put(GL, po[1], potion.x, PT + 0.11, potion.z, 0.018, 0.05, 0.018); put(CY, po[2], potion.x, PT + 0.14, potion.z, 0.021, 0.012, 0.021);
    obj.push({ text: '🧪 다시 커지는 물약까지!', at: [potion.x, PT + 0.02, potion.z] });
    // --- 진열대 위 실험 기구(지나갈 수 없음 — 실험대 사이 지름길 막기)
    { const z0 = room.z0 + 0.15, z1 = z0 + 0.45, x0 = d52.length ? d52[0].x + 0.75 : xB + 1, x1 = (d52[1] ? d52[1].x - 0.5 : xA + 0.25) - 0.15;
      col({ x0, x1, y0: 0.93, y1: 1.5, z0, z1 }, { ns: true });
      for (let x = x0 + 0.1, k = 0; x < x1 - 0.05; x += 0.24, k++) { const h = 0.16 + (k % 3) * 0.06, r = 0.045 + (k % 2) * 0.015, zz = z0 + 0.22 + ((k % 2) - 0.5) * 0.1;
        put(GL, alloc(GL, 0xe8f6ff), x, 0.93 + h / 2, zz, r, h, r); put(CY, alloc(CY, [0x7bd389, 0xffb74d, 0x64b5f6, 0xf06292][k % 4]), x, 0.93 + h * 0.3, zz, r * 0.9, h * 0.55, r * 0.9); } }
    // 문(복도 · 준비실) 닫기 — 작은 몸이 복도로 새지 않게(게임이 멈추면 원래대로)
    for (const d of d52) { const h = W.door(+d.id.slice(5)); if (h) { h.close(); own(() => h.free()); } }
    // 한 프레임 일(엘리베이터 · 자석 흔들림 · 선풍기 · 책 넘어짐)
    const tick2 = dt => {
      const p = PL.pos();
      if (lift) { const onL = Math.abs(p.x - ex) < 0.17 && Math.abs(p.z - ez) < 0.17 && Math.abs(p.y - (lift.y + 0.03)) < 0.03;
        E9.t += dt;
        if (E9.st === 'down') { E9.on = onL ? E9.on + dt : 0; if (E9.on > 0.35) { E9.st = 'rise'; E9.t = 0; lift.move({ y: eTop - 0.03 }, { tween: 2.4 }); map.sfx('tick'); if (R.obj === 0) map.hud.toast('🧪 올라가요!'); } }
        else if (E9.st === 'rise') { if (E9.t > 2.45) { E9.st = 'up'; E9.t = 0; } }
        else if (E9.st === 'up') { E9.on = onL ? 0 : E9.on + dt; if (E9.on > 2.5) { E9.st = 'fall'; E9.t = 0; lift.move({ y: 0 }, { tween: 2.0 }); } }
        else if (E9.st === 'fall' && E9.t > 2.05) { E9.st = 'down'; E9.t = 0; E9.on = 0; }
        drawLift(); }
      if (magT > 0) { magT += dt; drawMag(Math.sin(magT * 30) * Math.max(0, 1 - magT / 2.2)); if (magT > 2.3) { magT = 0; drawMag(); } }
      if (fanOn) { fanA += dt * 16; drawFan();
        for (let k = 0; k < streak.length; k++) { const u = ((R.t9 * 0.9 + k * 0.137) % 1), x = fx9 + 0.08 + u * (xA - 0.7 - fx9), zz = lane[0] + 0.05 + ((k * 0.61) % 1) * 0.5, yy = TT + 0.12 + ((k * 0.37) % 1) * 0.4;
          put(BX, streak[k], x, yy, zz, 0.16 * (0.4 + 0.6 * Math.sin(u * Math.PI)), 0.008, 0.008); } }
      if (bookA > 0) { bookA += dt; bookK = Math.min(1, bookA / 0.9); drawBook();
        if (bookK >= 1 && !rampMade) { rampMade = true; bookA = 0; if (flatCol) flatCol.remove(); pushH.remove();
          chain([xD, DT, rampLow + 0.02], [xD, PT, pz0 - 0.005], 0.11, bookT); map.sfx('pick'); map.hud.toast('📕 책이 비탈이 됐어요!', 2.5); advance(7); } }
      // 목표 넘기기(체크포인트·시연대 위)
      if (R.obj === 5 && p.x > xD - 0.41 && p.x < xD + 0.41 && p.z > zb - 1.21 && p.z < zb + 1.21 && p.y > DT - 0.02) advance(6);
      if (Math.hypot(p.x - potion.x, p.z - potion.z) < 0.09 && Math.abs(p.y - PT) < 0.08 && st === 'play') finish();
    };
    const onCp = k => { if (k === 1) advance(1); else if (k === 2) advance(3); else if (k === 3) advance(5); };
    const fin = map.findEntry(xD - 0.9, zb - 0.8, 0, [room.x0, room.z0, room.x1, room.z1], 4);   // 원래 몸이 설 빈 칸(시연대 서쪽 통로)
    return { room, arena: [room.x0 + 0.1, room.z0 + 0.1, room.x1 - 0.1, room.z1 - 0.1], arenaMsg: '과학실 안에서만 놀아요', items, kind: 'star', need: 0, cps, obj, onCp, tick: tick2,
      intro: { title: '🔬 과학실 대모험', body: '과학실 시연대 위에 **다시 커지는 물약**이 있대요!\n\n🧪 받침대 엘리베이터 → 🧲 자석 단추 → 📏 자 다리 → 🌀 선풍기 바람 → ✏️ 연필 다리 → 📕 책 비탈\n\n바닥으로 떨어져도 괜찮아요. 마지막 🚩 깃발에서 다시 시작해요.' },
      goal: () => (R.obj < obj.length ? obj[R.obj].text : '') + '  ⭐' + R.got + '/' + items.length,
      finale: { at: fin ? [fin.x, fin.y, fin.z] : [xD - 0.9, 0, zb - 0.8], look: [xD, zb],
        world: () => { const b = W.paint('board:' + room.id, { text: '작은 과학자 대성공!', color: '#1f8a4c' }); if (b) own(b);
          const t = map.npc.get('과학선생님'); if (t) { own(() => map.npc.home('과학선생님')); map.npc.pose('과학선생님', 'cheer', 270); } } },
      get lift() { return lift; }, get ruler() { return ruler; }, test: { ex, ez, xB, xM, xA, czN, fx9, fz9, xD, zb, pedZ, PT, flatZ, potion, pa, pb, rampLow } };
  }

  // =====================================================================
  // 스테이지 3 — 급식실 대탈출(긴 식탁 3×3 · 긴 의자 · 배식대 · 급식선생님)
  // =====================================================================
  function build3() {
    const room = map.zone('cafeteria'); if (!room) return null;
    own(map.interact.enable(h => h.kind !== 'game', false));
    const TT = 0.72, BT = 0.42, cols = [1.9, 4.3, 6.7], rows = [-45.9, -41.5, -37.1];   // 식탁 가운데(x ±0.4 · z ±1.7 · 윗면 0.72) · 긴 의자 = 식탁 양옆(±0.45~0.79 · 0.42)
    const dx = room.x0 - (-1), dz = room.z0 - (-48.4); for (let i = 0; i < 3; i++) { cols[i] += dx; rows[i] += dz; }
    const dsx = cols[2] + 0.1, doorZ = room.z1;
    PL.teleport([dsx, 0, doorZ - 0.45]); PL.scale(S, PHYS2);
    for (const [x, z, y, what] of [[cols[2], rows[2], TT, '식탁 3-3'], [cols[0], rows[1], TT, '식탁 1-2'], [cols[1] - 0.62, rows[1], BT, '긴 의자'], [room.x0 + 0.5, rows[1] + 1.15, 0.85, '배식대 끝 장']]) { const g = top(x, z, 1.2); if (Math.abs(g - y) > 0.02) warn(what + ' 윗면이 달라요', +g.toFixed(3), y); }
    const items = [], cps = [], obj = [];
    const star = (x, y, z, where) => items.push({ x, y: y + 0.03, z, where, got: false, r3: true });
    const cp = (x, y, z, h, rect, name, minY) => cps.push({ at: [x, y, z], h, rect, y, minY, name, flag: rect ? flag(x + 0.08, y, z + 0.08) : null });
    const startAt = [dsx, 0, doorZ - 0.45];
    cp(startAt[0], 0, startAt[2], 0, null, '급식실 문 앞', -9);
    // --- 🗄 서랍장(단추를 누르면 서랍 셋이 차례로 나와 계단이 됨) → 식탁 3-3
    // 서랍은 아래 칸일수록 더 나온다(0.30 · 0.20 · 0.10 — 위 서랍 밑에 끼지 않게 계단 모양)
    const CD = 0.34, DL = 0.32, cx9 = cols[2], cz9 = rows[2] + 1.7 + 0.005 + CD / 2,   /* 식탁에 붙임(작은 몸이 틈에 빠지지 않게) */ zc0 = cz9 + CD / 2 - 0.01 - DL / 2, PO = [0.3, 0.2, 0.1];
    const cab = spawn('platform', { x: cx9, z: cz9, y: 0 }, { size: [0.4, 0.62, CD], color: 0x8fc6e8 });   // 서랍장 몸통(흰 상자 소품 + 색)
    const drw = [0.08, 0.24, 0.4].map((y0, k) => ({ y0, d: spawn('platform', { x: cx9, z: zc0, y: y0 }, { size: [0.32, 0.1, DL], color: [0xffd166, 0xef8a8a, 0x9bd48f][k] }) }));
    const knob = drw.map(() => alloc(SP, 0x5a6270));
    const drawKnobs = () => drw.forEach((d, k) => { if (d.d) put(SP, knob[k], cx9, d.d.y + 0.05, d.d.z + DL / 2 + 0.008, 0.012, 0.012, 0.012); });
    drawKnobs();
    let drOpen = false;
    spawn('button', { x: cx9 - 0.36, z: cz9 + 0.45, y: 0 }, { size: [0.05, 0.05, 0.05], color: 0xffa94d, r: 0.16, label: '🔘 서랍 열기', onUse: () => {
      if (drOpen) { map.hud.toast('서랍 계단으로 올라가요'); return; } drOpen = true; progress(); map.sfx('go');
      drw.forEach((d, k) => setTimeout(() => { if (!dead && R && R.n === 3 && d.d) d.d.move({ z: zc0 + 0.01 + PO[k] }, { tween: 0.6 }); }, 350 * k));
      map.hud.toast('🗄 서랍이 나와요 — 계단처럼 올라가요!', 3); advance(1); } });
    obj.push({ text: '🔘 단추를 눌러 서랍을 열어요 (E / ✋)', at: [cx9 - 0.36, 0.05, cz9 + 0.45] });
    obj.push({ text: '🗄 서랍 계단으로 식탁 위에 올라가요', at: [cx9, 0.5, cz9 + 0.25] });
    star(cols[2] + 0.62, BT, rows[2] + 1.35, '긴 의자 끝'); star(cx9 + 0.1, 0.62, cz9, '서랍장 위');   // 바닥 별 없음(깃발을 지나면 바닥 = 떨어짐)
    cp(cx9, TT, rows[2] + 1.35, 0, [cx9 - 0.4, rows[2] - 1.7, cx9 + 0.4, rows[2] + 1.7], '식탁 3-3', 0.12);
    // --- 🍽 오가는 식판(식탁 3-3 ↔ 3-2 · 1m 틈)
    const trZ = [rows[2] - 1.7 - 0.15, rows[1] + 1.7 + 0.15], tray = spawn('platform', { x: cx9, z: trZ[0], y: TT - 0.02 }, { size: [0.34, 0.02, 0.4], color: 0x8fd0a8 });
    const trI = [alloc(BX, 0x6fb88a), alloc(BX, 0x6fb88a)];
    const TR = { k: 0, t: 0, moving: false };
    obj.push({ text: '🍽 오가는 식판을 타고 건너요', at: [cx9, TT, (trZ[0] + trZ[1]) / 2] });
    star(cx9, TT + 0.1, (trZ[0] + trZ[1]) / 2, '식판 길 위');
    cp(cx9, TT, rows[1] + 1.35, 0, [cx9 - 0.4, rows[1] - 1.7, cx9 + 0.4, rows[1] + 1.7], '식탁 3-2', 0.12);
    // --- 🥢 젓가락 다리(식탁 3-2 서쪽 긴 의자 ↔ 식탁 2-2 동쪽 긴 의자 · 0.82m 틈)
    const chZ = rows[1], chX0 = cols[1] + 0.79 - 0.04, chX1 = cols[2] - 0.79 + 0.04;
    col({ x0: chX0, x1: chX1, y0: BT, y1: BT + 0.02, z0: chZ - 0.045, z1: chZ + 0.045 });
    for (const o of [-0.022, 0.022]) put(CY, alloc(CY, 0xc48a4a), (chX0 + chX1) / 2, BT + 0.01, chZ + o, 0.011, chX1 - chX0 + 0.04, 0.011, 0, 0, Math.PI / 2);
    obj.push({ text: '🥢 긴 의자로 내려가 젓가락 다리를 건너요', at: [(chX0 + chX1) / 2, BT, chZ] });
    star((chX0 + chX1) / 2, BT + 0.02, chZ, '젓가락 다리 위');
    cp(cols[1], TT, rows[1] + 0.2, 270, [cols[1] - 0.4, rows[1] - 1.7, cols[1] + 0.4, rows[1] + 1.7], '식탁 2-2', 0.12);
    // --- 🥛 요구르트 징검다리(식탁 2-2 서쪽 긴 의자 ↔ 식탁 1-2 동쪽 긴 의자 · 오르내리는 뚜껑 둘 — 번갈아)
    const yx = [cols[1] - 0.79 - 0.19, cols[0] + 0.79 + 0.21], yz = rows[1] - 0.5, YLOW = 0.2, YHI = BT;
    const yog = yx.map((x, k) => ({ x, p: spawn('platform', { x, z: yz, y: (k ? YLOW : YHI) - 0.03 }, { size: [0.24, 0.03, 0.24], color: k ? 0xff8fb1 : 0x7fd1ff }), bottle: alloc(CY, 0xfff4e0), label: alloc(CY, k ? 0xff8fb1 : 0x7fd1ff), up: !k }));
    const drawYog = () => { for (const Y of yog) { if (!Y.p) continue; const h = Y.p.y; put(CY, Y.bottle, Y.x, h / 2, yz, 0.085, Math.max(0.01, h), 0.085); put(CY, Y.label, Y.x, h * 0.55, yz, 0.087, Math.max(0.005, h * 0.3), 0.087); } };
    drawYog(); const YG = { t: 0 };
    obj.push({ text: '🥛 요구르트 징검다리 — 뚜껑이 올라올 때 건너요', at: [(yx[0] + yx[1]) / 2, BT, yz] });
    cp(cols[0] + 0.1, TT, rows[1] - 0.7, 270, [cols[0] - 0.4, rows[1] - 1.7, cols[0] + 0.4, rows[1] + 1.7], '식탁 1-2', 0.12);
    // --- 🍊 귤(식판 미끄럼틀 위) → 굴러가 🥄 숟가락 손잡이를 누르면 머리에 선 나를 튕김(튀는 판 + 바람 = 세상 바꾸기 동사) → 배식대 끝 장
    const sz9 = rows[1] + 1.2, bowlX = cols[0] - 0.28, handX = cols[0] + 0.3, pivX = cols[0] - 0.04;
    const oX = handX - 0.02, oZ0 = rows[1] - 1.45, rampZ1 = oZ0 + 0.6, RH = 0.16, OR = 0.045;   // 귤 길: 비탈(높이 0.16 → 식탁) → 식탁 위 → 손잡이 끝
    const spoonI = { bowl: alloc(SP, 0xd9dde2), stem: alloc(BX, 0xc9ced3), piv: alloc(BX, 0xf2a0b0) }, orange = alloc(SP, 0xff9a1f), leaf = alloc(BX, 0x4caf50);
    const rampI = [alloc(BX, 0xe8eef2), alloc(BX, 0x9fb3c0)];
    const rAng = Math.atan2(RH, rampZ1 - oZ0);
    put(BX, rampI[0], oX, TT + RH / 2 + 0.006, (oZ0 + rampZ1) / 2, 0.14, 0.012, Math.hypot(RH, rampZ1 - oZ0) + 0.02, rAng, 0, 0);
    put(BX, rampI[1], oX, TT + RH / 2, oZ0 - 0.03, 0.14, RH, 0.04);
    chain([oX, TT, rampZ1], [oX, TT + RH, oZ0], 0.07, 0.012); col({ x0: oX - 0.07, x1: oX + 0.07, y0: TT, y1: TT + RH, z0: oZ0 - 0.05, z1: oZ0 - 0.01 });
    const SPN = { a: 0, want: 0, T: 0 };   // 숟가락 기울기(+ = 손잡이 아래 · 머리 위)
    const drawSpoon = () => { const a = -0.14 + SPN.a * 0.5, cx = (bowlX + handX) / 2, L = handX - bowlX, y = TT + 0.035;
      put(BX, spoonI.stem, cx, y + Math.sin(a) * 0, sz9, L, 0.008, 0.02, 0, 0, a);
      const bx = pivX + (bowlX - pivX) * Math.cos(a), by = y + (bowlX - pivX) * Math.sin(a);
      put(SP, spoonI.bowl, bx, by, sz9, 0.075, 0.018, 0.06); put(BX, spoonI.piv, pivX, TT + 0.015, sz9, 0.03, 0.03, 0.05); };
    drawSpoon();
    const bowlCol = col({ x0: bowlX - 0.07, x1: bowlX + 0.07, y0: TT, y1: TT + 0.015, z0: sz9 - 0.06, z1: sz9 + 0.06 });
    const OR9 = { s: 0, v: 0, st: 'wait', t: 0, x: oX, y: TT + RH + OR, z: oZ0 + 0.02, rot: 0 }, pathL = (rampZ1 - oZ0) + (sz9 - 0.05 - rampZ1);
    const drawOrange = () => { put(SP, orange, OR9.x, OR9.y, OR9.z, OR, OR * 0.92, OR, OR9.rot, 0, 0); put(BX, leaf, OR9.x, OR9.y + OR * 0.95, OR9.z, 0.012, 0.004, 0.02, OR9.rot, 0.4, 0); };
    drawOrange();
    const pushO = own(map.interact.add({ x: oX, y: TT + RH, z: oZ0 + 0.02, r: 0.2, label: '🍊 귤 밀기', use: () => {
      if (OR9.st !== 'wait') return; OR9.st = 'roll'; OR9.s = 0; OR9.v = 0.05; map.sfx('tick'); progress(); map.hud.toast('🍊 굴러가요! 얼른 🥄 숟가락 머리에 올라서요', 3); } }));
    obj.push({ text: '🍊 귤을 밀고 🥄 숟가락 머리(동그란 쪽)에 서요', at: [oX, TT + RH, oZ0] });
    let padH = null, launchT = 0;
    const cpBox = [room.x0 + 0.2, rows[1] + 0.8, room.x0 + 0.8, rows[1] + 1.5];   // 배식대 끝 장(x −0.8~−0.2 · z −40.7~−40 · 윗면 0.85)
    cp((cpBox[0] + cpBox[2]) / 2, 0.85, (cpBox[1] + cpBox[3]) / 2, 0, cpBox, '배식대 끝', 0.75);
    const milk = { x: room.x0 + 0.55, y: 0.85, z: rows[1] + 0.54 }, mk = [alloc(BX, 0xffffff), alloc(BX, 0x5aa9e6), alloc(BX, 0xffffff)];
    put(BX, mk[0], milk.x, milk.y + 0.05, milk.z, 0.065, 0.1, 0.065); put(BX, mk[1], milk.x, milk.y + 0.045, milk.z, 0.066, 0.035, 0.066); put(BX, mk[2], milk.x, milk.y + 0.115, milk.z, 0.066, 0.03, 0.03, Math.PI / 4, 0, 0);
    { const nz0 = cpBox[1] - 0.24, nz1 = cpBox[1] + 0.04, nx = milk.x - 0.03; col({ x0: nx - 0.13, x1: nx + 0.13, y0: 0.82, y1: 0.855, z0: nz0, z1: nz1 }); put(BX, alloc(BX, 0xfdfdf7), nx, 0.852, (nz0 + nz1) / 2, 0.26, 0.006, nz1 - nz0);   // 냅킨 다리(배식대 끝 장 ↔ 배식대 — 20cm 틈에 빠지지 않게)
      put(BX, alloc(BX, 0x9fd7ff), nx, 0.8555, (nz0 + nz1) / 2, 0.2, 0.001, 0.04); }
    obj.push({ text: '🥛 우유를 마시면 원래 크기!', at: [milk.x, milk.y + 0.02, milk.z] });
    star(room.x0 + 0.55, 0.85, rows[1] - 1.2, '배식대 유리 밑');
    // 문 닫기(복도 둘 · 조리실 · 창고)
    for (const d of map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(room.id))) { const h = W.door(+d.id.slice(5)); if (h) { h.close(); own(() => h.free()); } }
    const tick3 = dt => {
      const p = PL.pos();
      drawKnobs();
      // 식판: 끝에서 1초 쉬고 1.4초에 건넘
      if (tray) { TR.t += dt; if (!TR.moving && TR.t > 1.0) { TR.moving = true; TR.t = 0; TR.k ^= 1; tray.move({ z: trZ[TR.k] }, { tween: 1.4 }); } else if (TR.moving && TR.t > 1.45) { TR.moving = false; TR.t = 0; }
        put(BX, trI[0], cx9 - 0.16, tray.y + 0.03, tray.z, 0.02, 0.02, 0.4); put(BX, trI[1], cx9 + 0.16, tray.y + 0.03, tray.z, 0.02, 0.02, 0.4); }
      // 요구르트 뚜껑: 2.2초마다 하나는 올라오고 하나는 내려감(0.5초)
      YG.t += dt; if (YG.t > 2.2) { YG.t = 0; for (const Y of yog) { if (!Y.p) continue; Y.up = !Y.up; Y.p.move({ y: (Y.up ? YHI : YLOW) - 0.03 }, { tween: 0.5 }); } }
      drawYog();
      // 귤 굴리기(1차원 — 비탈에선 빨라지고 식탁에선 조금씩 느려짐)
      if (OR9.st === 'roll') { const onR = OR9.s < rampZ1 - oZ0; OR9.v = Math.min(0.9, Math.max(0.28, OR9.v + (onR ? 1.4 : -0.08) * dt)); OR9.s += OR9.v * dt; OR9.rot += OR9.v * dt / OR;
        const s9 = Math.min(OR9.s, pathL); OR9.z = oZ0 + 0.02 + s9; OR9.y = TT + OR + (onR ? RH * (1 - s9 / (rampZ1 - oZ0)) : 0);
        if (OR9.s >= pathL) { OR9.st = 'hit'; OR9.t = 0; SPN.want = 1; map.sfx('pick');
          const onB = Math.abs(p.x - bowlX) < 0.085 && Math.abs(p.z - sz9) < 0.075 && Math.abs(p.y - (TT + 0.015)) < 0.05;
          if (onB) { padH = own(W.pad({ x: bowlX, z: sz9, r: 0.12, y: TT + 0.015, vy: 3.1 })); windH = own(W.wind({ rect: [room.x0, sz9 - 0.45, bowlX + 0.3, sz9 + 0.45], y0: TT + 0.18, y1: 2.2, h: 270, speed: 7.6 })); launchT = 0.01; PL.freeze(true); map.hud.banner('🥄 휘잉~!', 1.2); progress(); }
          else map.hud.toast('🥄 숟가락만 튀었어요 — 귤을 다시 밀고 동그란 머리에 올라서 있어요', 3.5); }
        drawOrange(); }
      else if (OR9.st === 'hit') { OR9.t += dt; OR9.y += dt * 0.4; OR9.x -= dt * 0.1; drawOrange(); if (OR9.t > 0.6) { OR9.st = 'gone'; hideI(SP, orange); hideI(BX, leaf); } }
      else if (OR9.st === 'gone') { OR9.t += dt; if (OR9.t > 1.8) { Object.assign(OR9, { st: 'wait', s: 0, v: 0, x: oX, y: TT + RH + OR, z: oZ0 + 0.02 }); SPN.want = 0; drawOrange(); } }
      if (Math.abs(SPN.a - SPN.want) > 1e-3) { SPN.a += Math.sign(SPN.want - SPN.a) * Math.min(Math.abs(SPN.want - SPN.a), dt * 8); drawSpoon(); }
      if (launchT > 0) { launchT += dt; if (padH && launchT > 0.2) { padH.remove(); padH = null; }
        if (launchT > 0.25 && (PL.get().ground || launchT > 2.2)) { launchT = 0; if (windH) { windH.remove(); windH = null; } PL.freeze(false); } }
      if (Math.hypot(p.x - milk.x, p.z - milk.z) < 0.09 && Math.abs(p.y - milk.y) < 0.06 && st === 'play') finish();
    };
    let windH = null;
    void bowlCol;
    const onCp = k => { if (k === 1) advance(2); else if (k === 2) advance(3); else if (k === 3) advance(4); else if (k === 4) advance(5); else if (k === 5) advance(6); };
    const fin = map.findEntry(room.x0 + 1.58, rows[1] + 1.2, 0, [room.x0, room.z0, room.x1, room.z1], 4);   // 배식대와 식탁 1-2 사이 통로
    return { room, arena: [room.x0 + 0.1, room.z0 + 0.1, room.x1 - 0.1, room.z1 - 0.1], arenaMsg: '급식실 안에서만 놀아요', items, kind: 'star', need: 0, cps, obj, onCp, tick: tick3,
      intro: { title: '🍽 급식실 대탈출', body: '배식대 끝에 **우유 한 팩**이 있어요. 마시면 원래 크기로 돌아온대요!\n\n🔘 서랍 계단 → 🍽 오가는 식판 → 🥢 젓가락 다리 → 🥛 요구르트 징검다리 → 🍊 귤 + 🥄 숟가락 발사대\n\n떨어지면 마지막 🚩 깃발에서 다시 해요.' },
      goal: () => (R.obj < obj.length ? obj[R.obj].text : '') + '  ⭐' + R.got + '/' + items.length,
      finale: { at: fin ? [fin.x, fin.y, fin.z] : [room.x0 + 1.58, 0, rows[1] + 1.2], look: [milk.x, milk.z],
        world: () => {
          const bal = [0xff6b9d, 0x4fc3f7, 0xffd23c, 0x7bed9f, 0xa29bfe]; for (let i = 0; i < 5; i++) { const b = spawn('balloon', { x: cols[0] - 0.6 + i * 0.3, z: rows[1] + 2.3, y: 0.2 }, { color: bal[i] }); if (b) b.move({ y: 1.2 + i * 0.25 }, { tween: 2.2 + i * 0.3 }); }
          spawn('banner', { x: cols[1], z: room.z0 + 1.2, y: 0 }, { text: '급식실 대탈출 성공!', h: 180, fg: '#1f8a4c' });
          if (map.npc.get('급식선생님')) { own(() => map.npc.home('급식선생님')); const k = map.pois({ src: 'door' }).find(d => d.zones && d.zones.includes('kitchen') && d.zones.includes(room.id)); if (k) { const h = W.door(+k.id.slice(5)); if (h) h.open(); } walkTo('급식선생님', 1.3, 'wave'); }
          if (map.npc.get('청소선생님')) { own(() => map.npc.home('청소선생님')); map.npc.pose('청소선생님', 'cheer', 270); } } },
      test: { cx9, cz9, trZ, chX0, chX1, chZ, yx, yz, bowlX, sz9, oX, oZ0, milk, cols, rows, cpBox, get orange() { return OR9.st; }, get trayZ() { return tray ? tray.z : null; }, get yog() { return yog.map(Y => Y.p ? +Y.p.y.toFixed(3) : null); } } };
  }

  // =====================================================================
  // 공용 — 스테이지 시작 · 수집품 · 체크포인트 · 힌트 · 끝 연출 · 결과
  // =====================================================================
  function progress() { hintT = 0; if (hintOn) { hintOn = 0; hintIdx = -1; } map.hud.chip('sh-hint', null); R && (R.hintShown = false); }
  function advance(k) { if (!R || !R.objs.length || k <= R.obj) return; R.obj = Math.min(k, R.objs.length); progress(); goalLine(); marks(); }
  function goalLine() { if (R) map.hud.goal(R.goal()); }
  function marks() { if (!R) return; const M = [];
    for (const c of R.items) if (!c.got) M.push({ x: c.x, z: c.z, color: R.kind === 'crumb' ? '#e0a458' : '#f5c518', shape: 'star', blink: hintOn > 0 && R.items.indexOf(c) === hintIdx });
    if (R.objs.length && R.obj < R.objs.length) { const o = R.objs[R.obj]; M.push({ x: o.at[0], z: o.at[2], color: '#2f9bd6', shape: 'ring', blink: true }); }
    for (let k = 1; k < R.cps.length; k++) M.push({ x: R.cps[k].at[0], z: R.cps[k].at[2], color: k <= R.cpi ? '#2ecc71' : '#9aa3ad', r: 3 });
    map.minimap.setMarks(M); }
  function respawn(manual) { if (!R || st !== 'play') return; const c = R.cps[R.cpi]; PL.teleport(c.at, { h: c.h }); map.hud.toast(manual ? '↩ ' + c.name + '(으)로' : '앗, 떨어졌어요! 🚩 ' + c.name + '에서 다시', 2.2); R.fallT = 0; }
  function hint() { if (!R || st !== 'play') return;
    const p = PL.pos(); let best = -1, bd = 1e9;
    if (R.kind === 'crumb' || !R.objs.length || R.obj >= R.objs.length) { R.items.forEach((c, i) => { if (c.got) return; const d = Math.hypot(c.x - p.x, c.z - p.z) + Math.abs(c.y - p.y) * 2; if (d < bd) { bd = d; best = i; } }); }
    hintOn = 10; hintIdx = best; map.sfx('ding');
    if (best >= 0 && (R.kind === 'crumb' || !R.objs.length || R.obj >= R.objs.length)) { const c = R.items[best], dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz), dy = c.y - p.y;
      const yaw = PL.get().h, rel = ((headTo(p.x, p.z, c.x, c.z) - yaw) % 360 + 540) % 360 - 180, dir = Math.abs(rel) < 35 ? '앞' : Math.abs(rel) > 145 ? '뒤' : rel > 0 ? '오른쪽' : '왼쪽';
      map.hud.toast('💡 가장 가까운 ' + (R.kind === 'crumb' ? '부스러기' : '별') + ': ' + c.where + ' · ' + dir + '으로 ' + d.toFixed(1) + 'm' + (dy > 0.15 ? ' · 위로 ' + dy.toFixed(1) + 'm' : dy < -0.15 ? ' · 아래로' : ''), 6); }
    else if (R.objs.length && R.obj < R.objs.length) map.hud.toast('💡 다음: ' + R.objs[R.obj].text + ' — 파란 빛줄기·지도 동그라미를 따라가요', 6);
    marks(); }
  function drawItems(t) {
    for (let i = 0; i < R.items.length; i++) { const c = R.items[i], I = R.itemI[i];
      if (c.got) { hideI(I.P, I.i); hideI(BEAM, I.b); for (const k of I.s) hideI(SPK, k); continue; }
      if (R.kind === 'crumb') put(CRUMB, I.i, c.x, c.y + 0.012 + Math.sin(t * 2.2 + i) * 0.004, c.z, 0.02, 0.012, 0.018, 0.3, t * 1.4 + i, 0.2);
      else put(STAR, I.i, c.x, c.y + 0.015 + Math.sin(t * 2.2 + i) * 0.006, c.z, 0.028, 0.028, 0.028, 0, t * 2 + i, 0);
      const hb = hintOn > 0 && i === hintIdx; put(BEAM, I.b, c.x, c.y + 0.03, c.z, hb ? 2.2 : 1, hb ? 2.2 + Math.sin(t * 8) * 0.2 : 0.32, hb ? 2.2 : 1);
      for (let k = 0; k < 3; k++) { const a = t * 1.7 + k * 2.094 + i, tw = Math.max(0, Math.sin(t * 5.3 + k * 1.9 + i * 0.7)), r = 0.035 + k * 0.006;
        put(SPK, I.s[k], c.x + Math.cos(a) * r, c.y + 0.02 + k * 0.012 + Math.sin(t * 3 + k) * 0.006, c.z + Math.sin(a) * r, 0.004 + tw * 0.007, 0.004 + tw * 0.007, 0.004 + tw * 0.007); } }
    if (R.objB >= 0) { const o = R.objs.length && R.obj < R.objs.length && st === 'play' ? R.objs[R.obj] : null;
      if (o) { const hb = hintOn > 0 && hintIdx < 0; put(BEAM, R.objB, o.at[0], o.at[1], o.at[2], hb ? 3 : 1.6, hb ? 2.4 + Math.sin(t * 8) * 0.2 : 0.55, hb ? 3 : 1.6); } else hideI(BEAM, R.objB); } }

  async function runStage(n) {
    st = 'prep'; stage = n; PL.freeze(true); map.hud.banner('작아지는 중…', 30);
    const B = [null, build1, build2, build3][n];
    const r = B ? B() : null;
    if (!r) { map.hud.toast('이 스테이지 자리를 찾지 못했어요'); PL.scale(1); PL.freeze(false); return menu(); }
    R = Object.assign(r, { n, got: 0, obj: 0, objs: r.obj || [], cpi: 0, fallT: 0, t9: 0, itemI: [], objB: -1, hintShown: false });
    // 수집품 · 반짝이 · 빛줄기
    for (const c of R.items) { const P9 = R.kind === 'crumb' ? CRUMB : STAR; R.itemI.push({ P: P9, i: alloc(P9, R.kind === 'crumb' ? (R.itemI.length % 2 ? 0xe0a458 : 0xd08c40) : 0xffd23c), b: alloc(BEAM, R.kind === 'crumb' ? 0xffe07a : 0xfff0a0), s: [alloc(SPK, 0xfff3b0), alloc(SPK, 0xfff3b0), alloc(SPK, 0xfff3b0)] }); }
    if (R.objs.length) R.objB = alloc(BEAM, 0x7fd8ff);
    const c0 = R.cps[0]; PL.teleport(c0.at, { h: c0.h });
    own(map.arena.set({ rect: R.arena, msg: R.arenaMsg }));
    map.minimap.show({ zoom: { r: 4.5, rect: [R.room.x0 - 3, R.room.z0 - 3, R.room.x1 + 3, R.room.z1 + 3], y: R.cps[0].at[1] } });
    map.hud.chip('sh-home', R.n === 1 ? '↩ 처음 자리(R)' : '🚩 깃발로(R)', { onClick: () => respawn(true) });
    T = 0; secShown = -1; hintT = 0; hintOn = 0; hintIdx = -1; map.hud.chip('sh-hint', null);
    marks(); goalLine();
    PL.scale(0.95, R.n === 1 ? PHYS1 : PHYS2); anim = { t: 0, dur: 1.2, from: 0.95, to: S, phys: R.n === 1 ? PHYS1 : PHYS2, done: () => {
      st = 'play'; PL.freeze(false); map.hud.banner('개미만큼 작아졌어요!', 1.6);
      if (R.n === 1) map.hud.toast('📚 책 더미·✏️ 연필 다리로 올라가요 · 부스러기는 닿으면 주워요', 4);
      else if (R.intro && !firstNote[R.n]) { firstNote[R.n] = true; map.note(R.intro.title, R.intro.body.replace(/\*\*/g, '')); } } };
    map.sfx('go');
  }
  // 끝: 하얗게 → 바닥 빈 칸으로 옮겨 원래 크기로 커짐 → 세상이 바뀜 → 결과 창
  async function finish() {
    if (st !== 'play') return; st = 'finale'; PL.freeze(true); map.sfx('done'); map.hud.banner(R.n === 1 ? '🍪 다 모았어요!' : R.n === 2 ? '🧪 꿀꺽!' : '🥛 꿀꺽!', 1.4); map.hud.chip('sh-hint', null);
    const n = R.n, Tn = T, stars = R.kind === 'star' ? R.got : null;
    const fd = map.fade(1.3, '#fffbe8'); await wait(0.66); if (dead || map.gone) return;   // 하얗게 된 순간 바닥 빈 칸으로(평소 몸이 끼지 않는 곳)
    { const f = R.finale; PL.teleport(f.at); if (Array.isArray(f.look)) PL.lookAt(f.look); map.minimap.zoom(null); map.minimap.setMarks([]); for (const P9 of [STAR, BEAM, CRUMB]) P9.m.visible = false; }   // 커지면 별·빛줄기는 치움(드로우콜 −2)
    await fd; if (dead || map.gone) return;
    await new Promise(res => { anim = { t: 0, dur: 1.5, from: PL.scaled(), to: 1, phys: {}, done: () => { PL.scale(1); res(); } }; });   // 게임 시간으로 커짐(느린 기기에서도 다 커진 뒤에 다음)
    if (dead || map.gone) return;
    map.hud.banner('원래 크기로 돌아왔어요!', 2.2);
    try { R.finale.world(); } catch (e) { console.error('[shrink] 끝 연출', e); }
    await wait(2.2); if (dead || map.gone) return;
    const k = n - 1, newRec = rec.best[k] == null || Tn < rec.best[k]; if (newRec) { rec.best[k] = +Tn.toFixed(1); map.store.set(n === 1 ? 'best' : 'best' + n, rec.best[k]); }
    if (stars != null && (rec.stars[k] == null || stars > rec.stars[k])) { rec.stars[k] = stars; map.store.set('stars' + n, stars); }
    const S9 = STAGES[k], head = S9.icon + ' ' + S9.title + ' — 성공!\n걸린 시간 ' + fmt(Tn) + (newRec ? ' · 🏆 새 기록!' : ' · 가장 빠른 기록 ' + fmt(rec.best[k])) + (stars != null ? '\n⭐ 별 ' + stars + '/' + N_STAR : '');
    const ch = n < 3 ? ['다음 스테이지 ▶ ' + STAGES[n].icon + ' ' + STAGES[n].title, '다시 하기', '스테이지 고르기', '그만하기'] : ['다시 하기', '스테이지 고르기', '그만하기'];
    st = 'result'; const i = await map.hud.ask(head, ch); if (dead || map.gone) return;
    const pick = n < 3 ? ['next', 'again', 'menu', 'quit'][i] : ['again', 'menu', 'quit'][i];
    endStage();
    if (pick === 'next') runStage(n + 1); else if (pick === 'again') runStage(n); else if (pick === 'menu') menu(); else map.quit();
  }
  function endStage() { bagClear(); poolsReset(); R = null; anim = null; if (PL.scaled() !== 1) PL.scale(1); map.hud.goal(null); map.minimap.setMarks([]); map.hud.chip('sh-time', null); map.hud.chip('sh-hint', null); map.hud.chip('sh-home', null); }
  async function menu() {
    st = 'menu'; PL.freeze(true);
    const lab = (s, k) => s.icon + ' ' + s.title + (rec.best[k] != null ? '  ✅ ' + fmt(rec.best[k]) : '') + (k && rec.stars[k] != null ? ' ⭐' + rec.stars[k] + '/5' : '');
    const i = await map.hud.ask('🐜 개미가 된 나 — 어디로 갈까요?\n몸이 개미만큼 작아져요. 책상은 절벽, 연필은 다리!', [...STAGES.map(lab), '그만하기']);
    if (dead || map.gone) return;
    if (i >= STAGES.length) { map.quit(); return; }
    runStage(i + 1);
  }

  const P1 = +params.stage;
  if (P1 >= 1 && P1 <= 3) runStage(P1); else menu();

  return {
    tick(dt) {
      if (anim) { const A = anim; A.t += dt; const k = Math.min(1, A.t / A.dur), e = 1 - (1 - k) * (1 - k), s = Math.exp(Math.log(A.from) + (Math.log(A.to) - Math.log(A.from)) * e);
        SO.jump = (A.phys.jump || 0.97 * S) * s / S; SO.gravity = A.phys.gravity; PL.scale(s, SO);
        if (k >= 1) { anim = null; if (A.to === S) PL.scale(S, A.phys); A.done(); } }
      if (!R) return;
      R.t9 += dt;
      if (st === 'play') {
        T += dt; const sec = Math.floor(T); if (sec !== secShown) { secShown = sec; map.hud.chip('sh-time', '⏱ ' + fmt(T)); }
        hintT += dt; if (hintT > HINT_T && !R.hintShown) { R.hintShown = true; map.hud.chip('sh-hint', '💡 ' + (R.kind === 'crumb' ? '가까운 부스러기' : '힌트') + '(H)', { onClick: () => hint() }); map.hud.toast('💡 막혔나요? 힌트(H)를 눌러 봐요', 3); }
        if (hintOn > 0 && (hintOn -= dt) <= 0) { hintOn = 0; hintIdx = -1; marks(); }
        const p = PL.pos(), py = p.y + 0.06;
        for (let i = 0; i < R.items.length; i++) { const c = R.items[i]; if (c.got) continue;
          const dx = c.x - p.x, dy = c.y - py, dz = c.z - p.z;
          if (c.r3 ? dx * dx + dz * dz + dy * dy * 0.5 < 0.011 : (dx * dx + dz * dz < 0.0081 && dy * dy < 0.012)) { c.got = true; R.got++; map.sfx('pick'); progress();
            map.hud.toast((R.kind === 'crumb' ? '🍪 ' : '⭐ ') + c.where + ' — ' + R.got + '/' + R.items.length, 2); goalLine(); marks();
            if (R.need && R.got >= R.need) { finish(); return; } } }
        // 체크포인트: 그 윗면에 서면 깃발 초록 · 떨어지면(minY 아래 0.35초) 마지막 깃발로
        for (let k = R.cpi + 1; k < R.cps.length; k++) { const c = R.cps[k]; if (!c.rect) continue;
          if (p.x > c.rect[0] && p.x < c.rect[2] && p.z > c.rect[1] && p.z < c.rect[3] && Math.abs(p.y - c.y) < 0.05) { R.cpi = k; if (c.flag) tint(BX, c.flag, 0x2ecc71); map.sfx('ding'); map.hud.toast('🚩 ' + c.name + ' — 여기서 다시 할 수 있어요', 2); if (R.onCp) R.onCp(k); progress(); marks(); break; } }
        const cmin = R.cps[R.cpi].minY; if (p.y < cmin) { if ((R.fallT += dt) > 0.35) respawn(false); } else R.fallT = 0;
        if (R.tick) R.tick(dt);
      }
      if (R) { drawItems(R.t9); for (const P9 of POOLS) if (P9.dirty) { P9.dirty = false; P9.m.instanceMatrix.needsUpdate = true; } }
    },
    stop() { dead = true; removeEventListener('keydown', onKey);
      // 작은 몸으로 높은 곳(실험대·받침대·날아가는 중)에서 멈추면 평소 몸이 올라서기 금지 상자 윗면(1.6)에 서게 된다 → 먼저 그 옆 바닥 빈 칸으로(엔진 reset이 크기 1)
      if (PL.scaled() < 1) { const p = PL.pos(), fy = map.q.floorY(p.x, p.z); if (p.y > fy + 0.3) { const e = map.findEntry(p.x, p.z, fy, null, 5); if (e) PL.teleport([e.x, e.y, e.z]); } } for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); },   // 메시·충돌·소품·사람은 범위 파사드·엔진·세상 reset이 · 몸 크기는 엔진 reset이 1로
    // 시험·교사 시연용
    get state() { return st; }, get stage() { return stage; }, get got() { return R ? R.got : 0; }, get time() { return T; }, get obj() { return R ? R.obj : -1; }, get cpi() { return R ? R.cpi : -1; },
    get crumbs() { return R ? R.items.map(c => ({ x: c.x, y: c.y, z: c.z, where: c.where, got: c.got })) : []; },
    get books() { return R && R.books ? R.books.map(b => ({ ...b })) : []; }, get pencils() { return R && R.pencils ? R.pencils.map(p => ({ a: p.a, b: p.b })) : []; }, get start() { return R ? R.cps[0].at : null; },
    get cps() { return R ? R.cps.map(c => ({ at: c.at, name: c.name, rect: c.rect, minY: c.minY })) : []; }, get objs() { return R ? R.objs.map(o => o.text) : []; }, get test() { return R && R.test; }, get hintOn() { return hintOn; }, get anim() { return anim ? +anim.t.toFixed(2) : null; },
    collect(i) { const c = R && R.items[i]; if (c) PL.teleport([c.x, c.y - (c.r3 ? 0.03 : 0.02), c.z]); },
    cp(k) { const c = R && R.cps[k]; if (c) PL.teleport(c.at, { h: c.h }); },
    hint: () => hint(), menu: () => { if (R) endStage(); menu(); }, go: n => { if (R) endStage(); runStage(n); },
  };
}
const SO = { jump: JUMP, gravity: undefined };   // 작아지는 연출의 매 프레임 옵션 객체(새 객체 없음)
