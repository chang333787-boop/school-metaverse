// v2 세상 바꾸기(WORLD-FX · NPC-MOVE · found2 09-27) — 게임 중 '진짜 변화'(사람 옮기기·물건 놓기·불·문·칠판 그림·바람·물웅덩이). 정본 docs/map_api.md §16
//   사용자 09-27 "게임 상호작용하면 실제 변화도 생기게" · "상황에 따라 애들이나 선생님 위치 바꿔도 돼".
//   import 없음(THREE·월드·물리는 mapapi가 host로 준다). 게임이 부르지 않으면 아무것도 만들지 않는다(메시·DOM·일 0 — 게이트 영향 0).
//   게임이 멈추면(범위 파사드 dispose → reset) 전부 처음대로 — 사람 정점·이름표·충돌, 소품, 불, 문, 그림, 바람. 시험: npc.checksum()이 처음과 같다.
//   사람(NPC) = world.js person()이 청크에 정점째 합친 것 → 숨기기 = 그 사람 정점 범위를 한 점으로 접기(삼각형 넓이 0 — 안 보임) + 이름표 정점 접기 + 충돌 끄기.
//   옮기기 = 같은 person() 부품으로 구운 '대역'(한 메시 + 이름표 한 장 · 한 번에 6명까지)이 길격자를 따라 걷는다(팔다리 흔들기 = 정점 회전 · 새 객체 없음).
//   새 사람을 만들지 않는다(대역은 원래 사람의 모양·색·이름 그대로) · 대사는 여기서 만들지 않는다.
export function createWorldFx(H) {
  const { THREE, scene, camera, world, P, q, ui, emit, colliderAdd, navDone, navGet, resolve, zoneAt, zoneFind, interactAdd, doorHold, doorActors, rebake, ENG, floorY, sfx, hot: HOT } = H;
  const R2D = Math.PI / 180;
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const PEOPLE = world.people || [];
  let GEN = 0, T = 0;
  const pBlocked = (x, z, y, h) => (H.pBlocked ? H.pBlocked(x, z, y, h) : q.blockedAt(x, z, y));

  // =============== 1. 사람(NPC) ===============
  const NST = new Map();   // id → { hidden, saved:[{A, o, arr}], sg:{o, arr}, cols:[[c, y0, y1]], actor }
  const FACEH = [0, 90, 180, 270];
  const outdoor = r => r.parts.some(p => p.mesh.castShadow);
  const find = t => { if (typeof t === 'number') return PEOPLE[t] ? t : -1; if (typeof t !== 'string') return -1;
    const r = PEOPLE.find(p => p.name === t) || PEOPLE.find(p => p.tour === t) || PEOPLE.find(p => p.name && p.name.replace(/\s/g, '') === t.replace(/\s/g, '')); return r ? r.id : -1; };
  function info(r) { const st = NST.get(r.id), a = st && st.actor, x = a ? a.x : r.x, y = a ? a.y : r.y, z = a ? a.z : r.z, zn = zoneAt(x, y + 0.05, z);
    return { id: r.id, name: r.name, adult: r.s > 1.05, guide: r.tour || null, room: zn ? zn.id : null, roomLabel: zn ? zn.label : null, x, y, z,
      pose: a ? a.pose : r.pose, face: a ? a.h : FACEH[r.face & 3], hidden: !!(st && st.hidden && !a), moved: !!a, walking: !!(a && a.path) }; }
  function collapse(A, o, n) { const a = A.array, x = a[o], y = a[o + 1], z = a[o + 2], arr = a.slice(o, o + n); for (let i = o; i < o + n; i += 3) { a[i] = x; a[i + 1] = y; a[i + 2] = z; } A.needsUpdate = true; return arr; }
  // 청크에서 사람 빼기: 그 청크의 숨긴 사람들 삼각형을 건너뛰고 나머지를 앞으로 당겨 그리기 범위를 줄인다(삼각형 수도 준다 — 예산 그대로).
  //   처음 건드릴 때 청크 원본(위치·색·법선)을 떠 두고, 바뀔 때마다 원본에서 다시 짠다 → 모두 보이면 원본 그대로 되돌림(정점 배열 같음 — checksum)
  const MST = new Map();   // mesh → { pos0, col0, nor0, ids:Set }
  function chunkApply(mesh) {
    const st = MST.get(mesh), g = mesh.geometry, A = g.attributes, names = ['position', 'color', 'normal'].filter(k => A[k]);
    if (!st.ids.size) { for (const k of names) { A[k].array.set(st[k]); A[k].needsUpdate = true; } g.setDrawRange(0, Infinity); MST.delete(mesh); return; }
    const R = []; for (const id of st.ids) for (const p of PEOPLE[id].parts) if (p.mesh === mesh) R.push([p.start, p.start + p.count]); R.sort((a, b) => a[0] - b[0]);
    const n = A.position.count; let w = 0, v = 0;
    for (const k of names) A[k].array.set(st[k]);
    const cp = (from, to) => { const len = (to - from) * 3; if (w !== from) for (const k of names) A[k].array.copyWithin(w * 3, from * 3, from * 3 + len); w += to - from; };
    for (const [a, b] of R) { if (a > v) cp(v, a); v = Math.max(v, b); } if (v < n) cp(v, n);
    for (const k of names) A[k].needsUpdate = true; g.setDrawRange(0, w);
  }
  function chunkHide(id, on) {
    const ms = new Set(PEOPLE[id].parts.map(p => p.mesh));
    for (const m of ms) { let st = MST.get(m); if (!st) { if (!on) continue; const A = m.geometry.attributes; st = { ids: new Set() }; for (const k of ['position', 'color', 'normal']) if (A[k]) st[k] = A[k].array.slice(); MST.set(m, st); }
      if (on) st.ids.add(id); else st.ids.delete(id); chunkApply(m); }
  }
  function hideOrig(id) {
    const r = PEOPLE[id]; let st = NST.get(id); if (!st) NST.set(id, st = { hidden: false, actor: null });
    if (st.hidden) return st;
    chunkHide(id, true); st.saved = [];
    if (r.sign >= 0 && world.signMesh) { const A = world.signMesh.geometry.attributes.position; st.sg = { A, o: r.sign * 36, arr: collapse(A, r.sign * 36, 36) }; }
    st.cols = (r.cols || []).map(c => { const s9 = [c, c.y0, c.y1]; c.y0 = c.y1 = -1e6; return s9; });
    st.hidden = true; if (outdoor(r)) rebake(); return st;
  }
  function showOrig(id) {
    const st = NST.get(id); if (!st || !st.hidden) return;
    chunkHide(id, false);
    if (st.sg) { st.sg.A.array.set(st.sg.arr, st.sg.o); st.sg.A.needsUpdate = true; }
    for (const [c, y0, y1] of st.cols) { c.y0 = y0; c.y1 = y1; }
    st.saved = st.sg = st.cols = null; st.hidden = false; if (outdoor(PEOPLE[id])) rebake();
  }
  // 대역: 모양(자세마다 캐시 · 원점 · 남쪽을 봄) → 대역마다 자기 복사본(걷기 = 팔다리 정점 회전)
  const GEO = new Map(), ACTORS = [], MAXA = 8;
  const geoFor = (id, pose, o) => { const k = id + '|' + pose + '|' + (o.seat ?? '') + '|' + (o.desk ?? ''); let g = GEO.get(k);
    if (!g) { g = world.personGeo(id, pose, o); const pa = g.userData.part, L = []; for (let i = 0; i < pa.length; i++) if (pa[i]) L.push(i); g.userData.limb = Int32Array.from(L); GEO.set(k, g); } return g; };
  // 이름표: 월드 팻말 아틀라스(같은 글자판·같은 재질)를 그대로 — 대역 이름표 전부 한 메시(드로우콜 1 · 72정점 · 매 프레임 카메라 쪽으로)
  let SGN = null;
  function signMesh() {
    if (SGN || !world.signMesh) return SGN;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXA * 36), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(MAXA * 24), 2));
    const m = new THREE.Mesh(g, world.signMesh.material); m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m); return (SGN = { m, g, slot: new Array(MAXA).fill(null) });
  }
  function signSlot(a) {   // 원래 이름표의 폭·높이·글자판 uv를 읽어 칸 하나에
    const r = a.r, S = signMesh(); if (!S || r.sign < 0) return; const k = S.slot.indexOf(null); if (k < 0) return; S.slot[k] = a; a.sk = k;
    const P9 = world.signMesh.geometry.attributes.position.array, U = world.signMesh.geometry.attributes.uv.array, st = NST.get(r.id), src = st && st.sg ? st.sg.arr : P9.subarray(r.sign * 36, r.sign * 36 + 36);
    a.sw = Math.hypot(src[3] - src[0], src[5] - src[2]); a.sh = Math.abs(src[7] - src[4]) || 0.22;
    S.g.attributes.uv.array.set(U.subarray(r.sign * 24, r.sign * 24 + 24), k * 24); S.g.attributes.uv.needsUpdate = true;
  }
  function signFree(a) { if (!SGN || a.sk == null) return; const o = a.sk * 36, A = SGN.g.attributes.position.array; for (let i = o; i < o + 36; i++) A[i] = 0; SGN.g.attributes.position.needsUpdate = true; SGN.slot[a.sk] = null; a.sk = null; }
  const SQ = new Float32Array(12);   // 매 프레임 스크래치(새 배열 없음)
  function signTick() {
    const A = SGN.g.attributes.position.array, cx = camera.position.x, cz = camera.position.z;
    for (let k = 0; k < MAXA; k++) { const a = SGN.slot[k]; if (!a) continue;
      const th = Math.atan2(cx - a.x, cz - a.z), rx = Math.cos(th), rz = -Math.sin(th), nx = Math.sin(th), nz = Math.cos(th), y = a.y + a.top + 0.28, w2 = a.sw / 2, h2 = a.sh / 2, vis = a.vis !== false && !a.nosign;
      let o = k * 36;
      for (let f = 0; f < 2; f++) { const zz = f ? -0.008 : 0.008, x0 = f ? w2 : -w2, x1 = -x0;
        const Q = SQ; Q[0] = x0; Q[1] = -h2; Q[2] = x1; Q[3] = -h2; Q[4] = x1; Q[5] = h2; Q[6] = x0; Q[7] = -h2; Q[8] = x1; Q[9] = h2; Q[10] = x0; Q[11] = h2;
        for (let v = 0; v < 6; v++) { const lx = vis ? Q[v * 2] : 0, ly = vis ? Q[v * 2 + 1] : 0; A[o++] = a.x + rx * lx + nx * zz; A[o++] = y + ly; A[o++] = a.z + rz * lx + nz * zz; } } }
    SGN.g.attributes.position.needsUpdate = true;
  }
  function actorFor(id) {
    const s0 = NST.get(id); if (s0 && s0.actor) return s0.actor;
    if (ACTORS.length >= MAXA) { console.warn('[world] npc: 대역은 한 번에 ' + MAXA + '명까지예요'); return null; }   // 리뷰(found2): 거절이면 아무것도 안 바꾼다(먼저 hide()한 사람이 다시 보이던 것)
    const st = hideOrig(id);
    const r = PEOPLE[id], a = { id, r, x: r.x, y: r.y, z: r.z, h: FACEH[r.face & 3], pose: null, seat: null, mesh: null, sign: null, base: null, path: null, pi: 0, spd: 1.3, ph: 0, wait: 0,
      col: null, nb: null, done: null, door: { x: r.x, y: r.y, z: r.z }, top: 1.3 };
    a.mesh = new THREE.Mesh(new THREE.BufferGeometry(), world.detailMat || new THREE.MeshLambertMaterial({ vertexColors: true }));
    a.mesh.castShadow = a.mesh.receiveShadow = false; scene.add(a.mesh); signSlot(a);
    st.actor = a; ACTORS.push(a); return a;
  }
  function setPose(a, pose, o = {}) {
    const g = geoFor(a.id, pose === 'walk' ? 'stand' : pose, o), old = a.mesh.geometry;
    const c = new THREE.BufferGeometry();   // 대역 자기 복사본(걷기가 정점을 바꾼다 — 색은 함께 씀)
    c.setAttribute('position', new THREE.BufferAttribute(g.attributes.position.array.slice(), 3)); c.setAttribute('normal', new THREE.BufferAttribute(g.attributes.normal.array.slice(), 3));
    c.setAttribute('color', g.attributes.color); c.boundingSphere = g.boundingSphere.clone();
    a.mesh.geometry = c; if (old) { old.dispose(); }
    a.base = g; a.pose = pose; a.seat = o.seat ?? null; a.top = g.userData.top; place(a);
  }
  function place(a) { a.mesh.position.set(a.x, a.y, a.z); a.mesh.rotation.y = Math.PI - a.h * R2D; a.mesh.updateMatrix();
    a.door.x = a.x; a.door.y = a.y; a.door.z = a.z; }
  function swing(a, ang) {   // 걷기: 다리(1·2)는 엉덩이, 팔(3·4)은 어깨를 축으로 x축 회전 — 매 프레임 새 객체 없음
    const g = a.base, L = g.userData.limb, pa = g.userData.part, bp = g.attributes.position.array, bn = g.attributes.normal.array;
    const wp = a.mesh.geometry.attributes.position.array, wn = a.mesh.geometry.attributes.normal.array, hy = g.userData.hipY, sy = g.userData.shY;
    const c1 = Math.cos(ang), s1 = Math.sin(ang), c2 = Math.cos(-ang * 0.8), s2 = Math.sin(-ang * 0.8);
    for (let k = 0; k < L.length; k++) { const i = L[k], p = pa[i], j = i * 3, pv = p <= 2 ? hy : sy, sg = p === 1 || p === 4 ? 1 : -1, cc = p <= 2 ? c1 : c2, ss = (p <= 2 ? s1 : s2) * sg;
      const y0 = bp[j + 1] - pv, z0 = bp[j + 2]; wp[j + 1] = pv + y0 * cc - z0 * ss; wp[j + 2] = y0 * ss + z0 * cc;
      const ny = bn[j + 1], nz = bn[j + 2]; wn[j + 1] = ny * cc - nz * ss; wn[j + 2] = ny * ss + nz * cc; }
    a.mesh.geometry.attributes.position.needsUpdate = a.mesh.geometry.attributes.normal.needsUpdate = true;
  }
  function solidOn(a) {   // 선 대역 = 몸 충돌(원래 사람과 같은 크기) + 길격자 막기
    if (a.ghost) { solidOff(a); return; }   // ghost = 몸 충돌 없음(이야기 속 따라오는 친구 — 좁은 문에서 나를 막지 않게 · 10-03)
    solidOff(a); const s = a.r.s, hw = 0.22 * s, sit = a.pose === 'sit';
    const b = { x0: a.x - hw, x1: a.x + hw, y0: a.y + (sit ? 0.85 : 0), y1: a.y + Math.max(1.6, 1.5 * s + 0.1), z0: a.z - hw, z1: a.z + hw };
    if (P.x > b.x0 - 0.3 && P.x < b.x1 + 0.3 && P.z > b.z0 - 0.3 && P.z < b.z1 + 0.3 && P.y < b.y1 && P.y + 1.5 > b.y0) { a.colWait = true; return; }   // 내가 그 자리에 있으면 비킬 때까지 기다림(끼임 방지)
    a.colWait = false; a.col = colliderAdd(b); const N = navDone(); a.nb = N ? N.block([a.x - 0.15, a.z - 0.15, a.x + 0.15, a.z + 0.15]) : null;   // 길격자는 몸 가운데만(좁은 복도를 막지 않게)
  }
  function solidOff(a) { if (a.col) { a.col.remove(); a.col = null; } if (a.nb) { a.nb.remove(); a.nb = null; } a.colWait = false; }
  function stopWalk(a) {   // 리뷰(found2): 걷던 중 pose()로 멈추면 move 약속을 false로 끝내고 문 열림 자리도 뺀다(wait:true 이야기가 멈춰 서던 것)
    a.path = null; const k = doorActors ? doorActors.indexOf(a.door) : -1; if (k >= 0) doorActors.splice(k, 1);
    if (a.done) { const d = a.done; a.done = null; d(false); } }
  function dropActor(a) {
    solidOff(a); scene.remove(a.mesh); a.mesh.geometry.dispose(); signFree(a);
    const k = doorActors ? doorActors.indexOf(a.door) : -1; if (k >= 0) doorActors.splice(k, 1);
    const i = ACTORS.indexOf(a); if (i >= 0) ACTORS.splice(i, 1);
    if (a.done) { const d = a.done; a.done = null; d(false); }
  }
  const tgt = (to, o) => { if (to && typeof to === 'object' && !Array.isArray(to) && to.x != null) return { x: to.x, y: to.y ?? floorY(to.x, to.z, o.floor || 1), z: to.z, h: to.face ?? to.h, pose: to.pose };
    const r = resolve(to); return r ? { x: r.x, y: r.y, z: r.z, h: r.h } : null; };
  const npc = {
    count: () => PEOPLE.length,
    list: (f = {}) => PEOPLE.filter(r => (!f.room || (info(r).room === f.room || info(r).roomLabel === f.room)) && (f.adult == null || (r.s > 1.05) === f.adult) && (!f.name || r.name === f.name)).map(info),
    get: t => { const id = find(t); return id < 0 ? null : info(PEOPLE[id]); },
    find: t => find(t),
    hide(t) { const id = find(t); if (id < 0) return false; const st = NST.get(id); if (st && st.actor) dropActor(st.actor), st.actor = null; hideOrig(id); emit('npc', { id, type: 'hide' }); return true; },
    show(t) { const id = find(t); if (id < 0) return false; const st = NST.get(id); if (st && st.actor) { st.actor.mesh.visible = true; st.actor.vis = true; return true; } showOrig(id); emit('npc', { id, type: 'show' }); return true; },
    // 제자리로(대역을 치우고 원래 사람을 다시 보인다)
    home(t) { const id = find(t); if (id < 0) return false; const st = NST.get(id); if (st && st.actor) { dropActor(st.actor); st.actor = null; } showOrig(id); emit('npc', { id, type: 'home' }); return true; },
    // 옮기기: to = {x,z,y?,face,pose} | [x,z] | [x,y,z] | 'lm:…' 'zone:…' 'spawn:…' · o = { walk(false), speed(1.3 · 어른 1.2), pose('stand' — 도착 자세), face(방위°), seat, desk, floor }
    //   pose = 'stand'|'sit'|'sitFloor'|'work'|'sweep'|'wave'|'cheer'|'explain'|'walk'(걸은 뒤에도 제자리 걷기 아님 — 서 있음) → Promise(도착하면 true)
    move(t, to, o = {}) {
      const id = find(t); if (id < 0) { console.warn('[world] npc.move: 모르는 사람', t); return Promise.resolve(false); }
      const T9 = tgt(to, o); if (!T9) { console.warn('[world] npc.move: 모르는 곳', to); return Promise.resolve(false); }
      const a = actorFor(id); if (!a) return Promise.resolve(false);
      if (o.sign != null) a.nosign = !o.sign;   // g3-story: sign:false = 이름표를 가린 대역(이야기 속 이름 없는 역할 — 실제 아이 이름을 역할에 붙이지 않게)
      if (a.done) { const d = a.done; a.done = null; d(false); }
      const pose = o.pose || (to && to.pose) || 'stand', face = o.face ?? T9.h, g0 = GEN, po = { seat: o.seat, desk: o.desk };
      a.spd = o.speed || (a.r.s > 1.05 ? 1.2 : 1.3); a.pass = !!o.pass; if (o.ghost != null) a.ghost = !!o.ghost;   // GUIDE-1(09-30): pass = 앞에 선 나를 기다리지 않고 지나감(걷는 동안은 몸 충돌이 없다 — 견학 안내가 뒤따르는 나를 기다리다 멈추던 것)
      const arrive = () => { a.path = null; const k = doorActors ? doorActors.indexOf(a.door) : -1; if (k >= 0) doorActors.splice(k, 1);
        a.x = T9.x; a.y = T9.y; a.z = T9.z; if (face != null) a.h = face; setPose(a, pose === 'walk' ? 'stand' : pose, po); solidOn(a); emit('npc', { id, type: 'arrive' }); };
      if (!o.walk) { solidOff(a); a.path = null; arrive(); return Promise.resolve(true); }
      if (!a.pose) setPose(a, 'stand', {});
      return new Promise(res => {
        a.done = res;
        (async () => {
          const N = navDone() || await navGet(); if (g0 !== GEN || a.done !== res) return;
          solidOff(a);   // 제 자리 막기부터 풀고(출발 칸이 막혀 길을 못 찾던 것)
          const pr = N.path([a.x, a.y, a.z], [T9.x, T9.y, T9.z], { maxExp: 60000 });
          if (!pr.ok) { console.warn('[world] npc.move: 길을 못 찾아 바로 옮겨요', pr.reason); arrive(); a.done = null; res(true); return; }
          const pts = pr.pts.slice(); pts.unshift([a.x, a.y, a.z]); pts.push([T9.x, T9.y, T9.z]);
          solidOff(a); if (a.pose !== 'stand') setPose(a, 'stand', {});
          a.path = pts; a.pi = 0; a.ph = 0; a.wait = 0; a.fin = () => { arrive(); const d = a.done; a.done = null; if (d) d(true); };
          if (doorActors && !doorActors.includes(a.door)) doorActors.push(a.door);
        })().catch(e => { console.error('[world] npc.move', e); });
      });
    },
    // 제자리에서 자세·방향만(대역으로)
    pose(t, pose = 'stand', face, o = {}) { const id = find(t); if (id < 0) return false; const a = actorFor(id); if (!a) return false; if (o.sign != null) a.nosign = !o.sign; stopWalk(a); if (face != null) a.h = face; setPose(a, pose, o); solidOn(a); return true; },
    // 시험·검증: 사람 정점(청크)·이름표·사람 충돌을 한 수로 — 게임 전후가 같아야 한다
    checksum() { let h = 2166136261 >>> 0; const mix = v => { h = Math.imul(h ^ (v | 0), 16777619) >>> 0; };
      const seen = new Set(); for (const r of PEOPLE) for (const p of r.parts) seen.add(p.mesh);
      for (const m of seen) { const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) mix(Math.round(a[i] * 1000)); }
      if (world.signMesh) { const a = world.signMesh.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) mix(Math.round(a[i] * 1000)); }
      for (const r of PEOPLE) for (const c of r.cols || []) { mix(c.y0 * 1000); mix(c.y1 * 1000); mix(c.x0 * 1000); mix(c.z0 * 1000); }
      return h; },
    get actors() { return ACTORS.length; },
    // 이야기 파일 op moveNpc{name, to, pose, face, walk, speed, wait} · hideNpc{name} · showNpc{name} · homeNpc{name}
    storyOp(op) {
      if (op.op === 'hideNpc') return npc.hide(op.name); if (op.op === 'showNpc') return npc.show(op.name); if (op.op === 'homeNpc') return npc.home(op.name);
      const p = npc.move(op.name, op.to, { walk: op.walk, pose: op.pose, face: op.face, speed: op.speed, seat: op.seat, sign: op.sign }); return op.wait ? p : null;
    },
  };
  function actorTick(dt) {
    for (let k = 0; k < ACTORS.length; k++) { const a = ACTORS[k];
      if (!a.path) continue;
      const pts = a.path, nx = pts[a.pi + 1]; if (!nx) { a.fin(); continue; }
      const dx = nx[0] - a.x, dz = nx[2] - a.z, d = Math.hypot(dx, dz);
      // 내가 바로 앞(0.8m · 앞쪽)에 있으면 잠깐 멈춰 기다린다(부딪혀 끼지 않게)
      const px = P.x - a.x, pz = P.z - a.z, pd = Math.hypot(px, pz);
      if (!a.pass && pd < 0.8 && Math.abs(P.y - a.y) < 1.4 && d > 0.01 && (px * dx + pz * dz) > 0 && a.wait < 6) { a.wait += dt; swing(a, 0); continue; }
      a.wait = 0;
      const step = a.spd * dt;
      if (d <= step || d < 1e-4) { a.x = nx[0]; a.y = nx[1]; a.z = nx[2]; a.pi++; }
      else { const t = step / d; a.x += dx * t; a.z += dz * t; a.y += (nx[1] - a.y) * Math.min(1, t * 1.5); a.h = ((Math.atan2(dx, -dz) / R2D) + 360) % 360; }
      a.ph += dt * a.spd * 5.2; swing(a, Math.sin(a.ph) * 0.55); place(a);
    }
  }
  function actorTick10() { for (const a of ACTORS) if (a.colWait) solidOn(a); }

  // =============== 2. 소품(장난감 모양 · 종류마다 InstancedMesh = 드로우콜 1) ===============
  let G0 = null;
  const prims = () => G0 || (G0 = { SPH: new THREE.SphereGeometry(1, 12, 8), CYL: new THREE.CylinderGeometry(1, 1, 1, 10, 1), BOX: new THREE.BoxGeometry(1, 1, 1), CONE: new THREE.ConeGeometry(1, 1, 12, 1) });
  function bake(parts) {
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex, r] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, Pa = g.attributes.position, Na = g.attributes.normal;
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(...(r || [0, 0, 0]))), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m4); _c.set(hex);
      for (let i = 0; i < Pa.count; i++) { _v.fromBufferAttribute(Pa, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(Na, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); }
      if (g !== geo) g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    return g;
  }
  // 종류: size = 기본 [폭 x, 높이 y, 깊이 z](m) · solid = 몸이 막힘(보이는 것 = 충돌) · stand = 위에 올라설 수 있음(아니면 NS 1.6) · box = 한 칸 상자(크기 바꾸면 늘어남)
  const KINDS = {
    box: { size: [0.6, 0.5, 0.5], solid: true, stand: true, cap: 24, geo: () => { const { BOX } = prims(); return bake([[BOX, [0, 0.5, 0], [1, 1, 1], 0xd2a86e], [BOX, [0, 0.5, 0], [1.004, 0.16, 1.004], 0xe8d3a8]]); } },
    crate: { size: [0.8, 0.8, 0.8], solid: true, stand: true, cap: 16, geo: () => { const { BOX } = prims(); return bake([[BOX, [0, 0.5, 0], [1, 1, 1], 0xb98a52], [BOX, [0, 0.5, 0], [1.01, 0.1, 1.01], 0x8a6238], [BOX, [0, 0.12, 0], [1.01, 0.1, 1.01], 0x8a6238], [BOX, [0, 0.88, 0], [1.01, 0.1, 1.01], 0x8a6238]]); } },
    bookpile: { size: [0.36, 0.3, 0.26], solid: true, cap: 16, geo: () => { const { BOX } = prims(); const c = [0xd9574a, 0x2f6fd0, 0xf2c230, 0x5fae5a]; return bake(c.map((h, i) => [BOX, [(i % 2 ? 0.03 : -0.02), 0.125 + i * 0.25, 0], [0.92 - i * 0.06, 0.24, 0.9 - i * 0.05], h, [0, i * 0.2, 0]])); } },
    plant: { size: [0.5, 0.9, 0.5], solid: true, cap: 16, geo: () => { const { CYL, SPH } = prims(); return bake([[CYL, [0, 0.18, 0], [0.4, 0.36, 0.4], 0xc9744a], [SPH, [0, 0.62, 0], [0.5, 0.36, 0.5], 0x4f9a48], [SPH, [0.12, 0.8, 0.05], [0.3, 0.24, 0.3], 0x62b25a], [SPH, [-0.1, 0.78, -0.08], [0.3, 0.22, 0.3], 0x3f8a3c]]); } },
    ball: { size: [0.44, 0.44, 0.44], cap: 16, geo: () => { const { SPH } = prims(); return bake([[SPH, [0, 0.5, 0], [0.5, 0.5, 0.5], 0xffffff], [SPH, [0, 0.5, 0], [0.505, 0.12, 0.505], 0xe8752a]]); } },
    cone: { size: [0.36, 0.6, 0.36], solid: true, cap: 24, geo: () => { const { CONE, BOX } = prims(); return bake([[BOX, [0, 0.03, 0], [1, 0.06, 1], 0xe8752a], [CONE, [0, 0.52, 0], [0.4, 0.92, 0.4], 0xf08a3a], [CONE, [0, 0.55, 0], [0.33, 0.18, 0.33], 0xffffff]]); } },
    flag: { size: [0.6, 1.8, 0.06], pole: true, cap: 16, geo: () => { const { CYL, BOX } = prims(); return bake([[CYL, [-0.47, 0.5, 0], [0.05, 1, 0.05], 0xdfe3e6], [BOX, [0.03, 0.8, 0], [1, 0.3, 0.5], 0xffffff]]); } },
    banner: { size: [2.4, 1.9, 0.08], pole: true, poles: 2, cap: 8, geo: () => { const { CYL, BOX } = prims(); return bake([[CYL, [-0.48, 0.5, 0], [0.025, 1, 0.5], 0xb98a52], [CYL, [0.48, 0.5, 0], [0.025, 1, 0.5], 0xb98a52], [BOX, [0, 0.8, 0], [0.93, 0.3, 0.3], 0xffffff]]); } },
    balloon: { size: [0.42, 1.7, 0.42], float: true, cap: 24, geo: () => { const { SPH, CYL } = prims(); return bake([[CYL, [0, 0.38, 0], [0.01, 0.76, 0.01], 0xeeeeee], [SPH, [0, 0.86, 0], [0.5, 0.15, 0.5], 0xffffff], [SPH, [0, 0.77, 0], [0.12, 0.03, 0.12], 0xffffff]]); } },
    container: { size: [6.06, 2.59, 2.44], solid: true, stand: true, cap: 24, geo: () => { const { BOX } = prims(); const P9 = [[BOX, [0, 0.5, 0], [1, 1, 1], 0xffffff]];
      for (let i = 0; i < 11; i++) P9.push([BOX, [-0.45 + i * 0.09, 0.5, 0], [0.02, 0.9, 1.02], 0xd9d9d9]); P9.push([BOX, [0, 0.975, 0], [1.005, 0.05, 1.01], 0xbfbfbf], [BOX, [0, 0.025, 0], [1.005, 0.05, 1.01], 0x8a8a8a]); return bake(P9); } },
    platform: { size: [2, 0.3, 2], solid: true, stand: true, cap: 32, geo: () => { const { BOX } = prims(); return bake([[BOX, [0, 0.5, 0], [1, 1, 1], 0xffffff], [BOX, [0, 0.99, 0], [1.001, 0.04, 1.001], 0xf2f2f2]]); } },
    ramp: { size: [1.6, 0.6, 2.4], solid: true, stand: true, ramp: true, cap: 16, geo: () => { const g = new THREE.BufferGeometry(), p = [   // 쐐기: 뒤(−z)가 높고 앞(+z)이 바닥 — 로컬 앞 +z 쪽으로 내려간다
        [-.5, 0, .5], [.5, 0, .5], [.5, 1, -.5], [-.5, 0, .5], [.5, 1, -.5], [-.5, 1, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5], [-.5, 0, -.5], [.5, 1, -.5], [.5, 0, -.5],
        [-.5, 0, .5], [-.5, 1, -.5], [-.5, 0, -.5], [.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [-.5, 0, .5], [-.5, 0, -.5], [.5, 0, -.5], [-.5, 0, .5], [.5, 0, -.5], [.5, 0, .5]].flat();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(0.95); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; } },
    fan: { size: [0.7, 1.0, 0.5], solid: true, cap: 8, spin: true, geo: () => { const { CYL, BOX, SPH } = prims(); return bake([[CYL, [0, 0.03, 0], [0.4, 0.06, 0.4], 0x5a6270], [CYL, [0, 0.35, 0], [0.04, 0.6, 0.04], 0xdfe3e6], [SPH, [0, 0.7, 0], [0.12, 0.12, 0.1], 0x5a6270],
      [CYL, [0, 0.7, 0.05], [0.48, 0.03, 0.48], 0x9fd4ff, [Math.PI / 2, 0, 0]]]); } },
    blade: { size: [0.9, 0.9, 0.1], cap: 8, geo: () => { const { BOX } = prims(); return bake([0, 1, 2].map(i => [BOX, [0, 0, 0], [0.12, 0.84, 0.02], 0xffffff, [0, 0, i * Math.PI / 3]])); } },
    button: { size: [0.34, 0.9, 0.34], solid: true, cap: 16, geo: () => { const { CYL, BOX } = prims(); return bake([[BOX, [0, 0.4, 0], [0.6, 0.8, 0.6], 0x5a6270], [CYL, [0, 0.87, 0], [0.34, 0.14, 0.34], 0xffffff]]); } },
  };
  const ENGK = new Set(['chest', 'key', 'shovel', 'note']);   // 엔진 소품(§12.6)을 그대로 — 들기·놓기와 함께 쓰려고
  const POOLS = new Map(), PROPS = new Map(), PL = []; let pid = 0;   // PL = 매 프레임 도는 배열(Map 반복자 없이)
  const lamV = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  function pool(kind) { let p = POOLS.get(kind); if (p) return p; const K = KINDS[kind];
    const m = new THREE.InstancedMesh(K.geo(), lamV(), K.cap); m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
    for (let i = 0; i < K.cap; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, _c.set(0xffffff)); } m.count = 0; m.visible = false; scene.add(m);
    p = { m, cap: K.cap, used: new Array(K.cap).fill(null) }; POOLS.set(kind, p); return p; }
  const psync = p => { let n = 0; for (let i = 0; i < p.cap; i++) if (p.used[i]) n = i + 1; p.m.count = n; p.m.visible = n > 0; };
  const rot90 = h => ((Math.round((h || 0) / 90) % 4) + 4) % 4;
  // 발자국(돌린 크기) — 충돌은 축정렬 상자라 방향은 90° 단위
  const foot = pr => { const odd = rot90(pr.h) & 1, w = odd ? pr.size[2] : pr.size[0], d = odd ? pr.size[0] : pr.size[2]; return [w, d]; };
  function boxes(pr) {   // 몸 충돌 상자들(월드 좌표)
    const K = KINDS[pr.kind], [w, d] = foot(pr), x = pr.x, y = pr.y, z = pr.z, H9 = pr.size[1];
    if (K.pole) { const n = K.poles || 1, out = []; for (let i = 0; i < n; i++) { const lx = n === 1 ? -0.47 * pr.size[0] : (i ? 0.48 : -0.48) * pr.size[0], f = rot90(pr.h), c = [1, 0, -1, 0][f], s = [0, 1, 0, -1][f], px = x + lx * c, pz = z + lx * s;
      out.push({ x0: px - 0.06, x1: px + 0.06, y0: y, y1: y + Math.max(1.6, H9), z0: pz - 0.06, z1: pz + 0.06, nc: true }); } return out; }
    if (K.ramp) {   // 비탈 = 보이지 않는 계단(한 단 ≤ 0.12 — 오름 0.55 안 · 작은 몸(오름 0.55·s)은 s ≥ 0.25면 오른다)
      const n = Math.max(2, Math.ceil(H9 / 0.12)), L = pr.size[2], f = rot90(pr.h), out = [];
      for (let i = 0; i < n; i++) { const top = H9 * (i + 1) / n;   // 단 i = 높은 끝(로컬 −L/2)부터 길이 L·(n−i)/n · 높이 H·(i+1)/n — 겹친 계단(한 단 ≤ 12cm · 발은 비탈보다 ≤12cm 위)
        const lz0 = -L / 2, lz1 = -L / 2 + L * (n - i) / n, hw = pr.size[0] / 2;
        const c = [1, 0, -1, 0][f], s = [0, 1, 0, -1][f];   // 로컬 → 월드(메시와 같은 회전 −h): x' = lx·c − lz·s · z' = lx·s + lz·c (높은 쪽 = 로컬 −z = 방위 h 쪽)
        const pts = [[-hw, lz0], [hw, lz0], [-hw, lz1], [hw, lz1]].map(([lx, lz]) => [x + lx * c - lz * s, z + lx * s + lz * c]);
        out.push({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: y, y1: y + top, z0: Math.min(...pts.map(p => p[1])), z1: Math.max(...pts.map(p => p[1])) }); }
      return out; }
    return [{ x0: x - w / 2, x1: x + w / 2, y0: y, y1: y + H9, z0: z - d / 2, z1: z + d / 2 }];
  }
  function pmat(pr) { const K = KINDS[pr.kind]; _m4.compose(_v.set(pr.x, pr.y + (pr.bob || 0), pr.z), _q.setFromEuler(_e.set(0, -pr.h * R2D, 0)), _s.set(pr.size[0] / (K.ramp ? 1 : 1), pr.size[1], pr.size[2])); return _m4; }
  function pdraw(pr) { const p = POOLS.get(pr.kind); p.m.setMatrixAt(pr.i, pr.vis ? pmat(pr) : ZERO); p.m.instanceMatrix.needsUpdate = true;
    if (pr.blade) { const b = POOLS.get('blade'); _m4.compose(_v.set(pr.x + Math.sin(pr.h * R2D) * 0.12, pr.y + 0.7 * pr.size[1], pr.z - Math.cos(pr.h * R2D) * 0.12), _q.setFromEuler(_e.set(0, -pr.h * R2D, pr.spin || 0, 'YXZ')), _s.set(pr.size[0] * 1.2, pr.size[0] * 1.2, 1));
      b.m.setMatrixAt(pr.blade.i, pr.vis ? _m4 : ZERO); b.m.instanceMatrix.needsUpdate = true; } }
  function solidAdd(pr) {   // 충돌 + 길격자 막기(보이는 것 = 충돌)
    const K = KINDS[pr.kind]; pr.cols = []; if (!(K.solid || K.pole) || pr.o.solid === false) return;
    for (const b of boxes(pr)) pr.cols.push(colliderAdd(b, { ns: !K.stand && !K.pole && !K.ramp }));
    const N = navDone(); if (N && pr.o.nav !== false) { const B = boxes(pr); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const b of B) { x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); z0 = Math.min(z0, b.z0); z1 = Math.max(z1, b.z1); } pr.nb = N.block([x0 - 0.25, z0 - 0.25, x1 + 0.25, z1 + 0.25]); }
  }
  function solidRemove(pr) { for (const c of pr.cols || []) c.remove(); pr.cols = []; if (pr.nb) { pr.nb.remove(); pr.nb = null; } }
  const TW = [];   // 움직이는 소품(tween)
  const onTop = pr => { if (!pr.cols || !pr.cols.length) return false; for (let i = 0; i < pr.cols.length; i++) { const b = pr.cols[i].box; if (P.x > b.x0 - 0.2 && P.x < b.x1 + 0.2 && P.z > b.z0 - 0.2 && P.z < b.z1 + 0.2 && Math.abs(P.y - b.y1) < 0.08) return true; } return false; };
  const world_ = {};
  function spawn(kind, pos, o = {}) {
    if (ENGK.has(kind)) { const r = resolve(pos) || { x: 0, y: 0, z: 0 }; const p = ENG.prop.spawn(kind, r.x, pos && pos.y != null ? pos.y : r.y, r.z, { h: o.h, s: o.s }); if (p) { const id = 'e' + p.id; PROPS.set(id, { id, eng: p, kind }); p.fxId = id; } return p; }
    const K = KINDS[kind]; if (!K) { console.warn('[world] spawn: 모르는 종류', kind); return null; }
    const r = Array.isArray(pos) && pos.length === 3 ? { x: pos[0], y: pos[1], z: pos[2] } : pos && typeof pos === 'object' && !Array.isArray(pos) ? { x: pos.x, y: pos.y ?? floorY(pos.x, pos.z, o.floor || 1), z: pos.z } : resolve(pos);
    if (!r) { console.warn('[world] spawn: 모르는 곳', pos); return null; }
    const p = pool(kind), i = p.used.indexOf(null); if (i < 0) { console.warn('[world] spawn: ' + kind + ' ' + p.cap + '개 초과'); return null; }
    const s = o.s || 1, size = (o.size || K.size).map((v, k) => (o.size ? v : v * s));
    if ((K.solid || K.pole) && o.h && o.h % 90) console.warn('[world] spawn: 충돌이 있는 소품은 90° 단위로만 돌아가요(충돌 = 축정렬 상자)', kind, o.h);
    const pr = { id: 'p' + (++pid), kind, i, x: r.x, y: r.y + (o.lift || 0), z: r.z, h: K.solid || K.pole ? rot90(o.h) * 90 : (o.h || 0), size, o, vis: true, cols: [], nb: null, color: o.color ?? null, bob: 0, t0: T };
    p.used[i] = pr; psync(p); if (o.color != null) { p.m.setColorAt(i, _c.set(o.color)); p.m.instanceColor.needsUpdate = true; }
    if (K.spin) { const b = pool('blade'), j = b.used.indexOf(null); if (j >= 0) { b.used[j] = pr; psync(b); pr.blade = { i: j }; pr.spin = 0; } }
    pdraw(pr); solidAdd(pr); PROPS.set(pr.id, pr); PL.push(pr);
    if (kind === 'button' && o.onUse) pr.ih = interactAdd({ x: r.x, y: r.y, z: r.z, r: o.r ?? 1.2, label: o.label || '🔘 누르기', use: () => { sfx('pick'); pr.press = 0.25; try { o.onUse(pr); } catch (e) { console.error(e); } } });
    if (kind === 'fan' && o.wind !== false) pr.wind = wind.add({ from: pr, len: (o.wind && o.wind.len) || 4, speed: (o.wind && o.wind.speed) || 2.2, width: (o.wind && o.wind.width) || Math.max(0.9, size[0] * 1.4) });
    if (kind === 'banner' && o.text) pr.paint = paint({ x: r.x, y: r.y + size[1] * 0.8, z: r.z, w: size[0] * 0.9, h: size[1] * 0.28, ry: -pr.h * R2D, off: size[2] * 0.2 + 0.02, two: true }, { bg: o.bg || '#fff8e6', text: o.text, color: o.fg || '#c0392b' });
    pr.api = { id: pr.id, kind, get x() { return pr.x; }, get y() { return pr.y; }, get z() { return pr.z; }, get top() { return pr.y + pr.size[1]; },
      move: (to, mo) => move(pr.id, to, mo), remove: () => remove(pr.id), color: c => { p.m.setColorAt(pr.i, _c.set(c)); p.m.instanceColor.needsUpdate = true; pr.color = c; },
      show: () => { pr.vis = true; pdraw(pr); if (!pr.cols.length) solidAdd(pr); }, hide: () => { pr.vis = false; pdraw(pr); solidRemove(pr); } };
    emit('world', { type: 'spawn', id: pr.id, kind }); return pr.api;
  }
  // 옮기기: to = {x,y?,z,h?} | [x,z] | [x,y,z] | 문자열 대상 · mo = { tween(초 · 0 = 바로), ease('inOut'|'linear'), onDone } → Promise
  //   움직이는 발판 위에 서 있으면 같이 움직인다(작은 몸도) · 움직이는 동안 충돌은 따라감(격자는 시작~끝을 덮게 한 번 등록)
  function move(id, to, mo = {}) {
    const pr = PROPS.get(id); if (!pr) return Promise.resolve(false);
    if (pr.eng) { const r = resolve(to); if (r) pr.eng.set(r.x, to && to.y != null ? to.y : r.y, r.z, to && to.h); return Promise.resolve(true); }
    const r = to && typeof to === 'object' && !Array.isArray(to) ? { x: to.x ?? pr.x, y: to.y ?? pr.y, z: to.z ?? pr.z } : resolve(to); if (!r) return Promise.resolve(false);
    const k = TW.findIndex(t => t.pr === pr); if (k >= 0) { const t = TW[k]; TW.splice(k, 1); if (t.res) t.res(false); }
    const nh = to && to.h != null ? ((pr.cols.length ? rot90(to.h) * 90 : to.h)) : pr.h;
    const dur = mo.tween || 0;
    if (!dur) { solidRemove(pr); pr.x = r.x; pr.y = r.y; pr.z = r.z; pr.h = nh; pdraw(pr); if (pr.vis) solidAdd(pr); syncAttach(pr); return Promise.resolve(true); }
    return new Promise(res => {
      // 충돌: 지금 상자를 떼고, 시작~끝을 모두 덮는 격자 칸에 한 번 등록한 뒤 상자 값만 매 프레임 옮긴다(새 객체 없음)
      const from = boxes(pr), fx = pr.x, fy = pr.y, fz = pr.z; solidRemove(pr);
      const tmp = { ...pr, x: r.x, y: r.y, z: r.z, h: nh }, to9 = boxes(tmp);
      if (pr.vis && (KINDS[pr.kind].solid || KINDS[pr.kind].pole) && pr.o.solid !== false) pr.cols = from.map((b, i) => { const e = to9[i] || b, U = { x0: Math.min(b.x0, e.x0), x1: Math.max(b.x1, e.x1), y0: Math.min(b.y0, e.y0), y1: Math.max(b.y1, e.y1), z0: Math.min(b.z0, e.z0), z1: Math.max(b.z1, e.z1) };
        const c = colliderAdd(U, { ns: !KINDS[pr.kind].stand && !KINDS[pr.kind].pole && !KINDS[pr.kind].ramp }); Object.assign(c.box, b); if (c.box.vy1 != null) c.box.vy1 = b.y1; if (!KINDS[pr.kind].stand && !KINDS[pr.kind].pole && !KINDS[pr.kind].ramp) c.box.y1 = Math.max(b.y1, b.y0 + 1.6); return c; });
      TW.push({ pr, t: 0, dur, fx, fy, fz, tx: r.x, ty: r.y, tz: r.z, h0: pr.h, h1: nh, from, ease: mo.ease || 'inOut', res: ok => { if (mo.onDone && ok) { try { mo.onDone(); } catch (e) { console.error(e); } } res(ok); } });
    });
  }
  function twTick(dt) {
    for (let k = TW.length - 1; k >= 0; k--) { const w = TW[k], pr = w.pr; w.t = Math.min(w.dur, w.t + dt); let u = w.t / w.dur; if (w.ease === 'inOut') u = u * u * (3 - 2 * u);
      const ride = onTop(pr), ox = pr.x, oy = pr.y, oz = pr.z;
      pr.x = w.fx + (w.tx - w.fx) * u; pr.y = w.fy + (w.ty - w.fy) * u; pr.z = w.fz + (w.tz - w.fz) * u; pr.h = w.h0 + (w.h1 - w.h0) * u;
      const dx = pr.x - ox, dy = pr.y - oy, dz = pr.z - oz;
      for (let i = 0; i < pr.cols.length; i++) { const b = pr.cols[i].box, f = w.from[i]; b.x0 = f.x0 + pr.x - w.fx; b.x1 = f.x1 + pr.x - w.fx; b.z0 = f.z0 + pr.z - w.fz; b.z1 = f.z1 + pr.z - w.fz; b.y0 = f.y0 + pr.y - w.fy; const top = f.y1 + pr.y - w.fy; if (b.vy1 != null) { b.vy1 = top; b.y1 = Math.max(top, b.y0 + 1.6); } else b.y1 = top; }
      if (ride) { if (!pBlocked(P.x + dx, P.z, P.y + dy + 0.02, P.bh)) P.x += dx; if (!pBlocked(P.x, P.z + dz, P.y + dy + 0.02, P.bh)) P.z += dz; P.y += dy; }
      pdraw(pr); if (pr.paint) pr.paint.at(pr.x, pr.y + pr.size[1] * 0.8, pr.z);
      if (w.t >= w.dur) { TW.splice(k, 1); for (const c of pr.cols) c.remove(); pr.cols = []; if (pr.vis) solidAdd(pr); syncAttach(pr); w.res(true); }
    }
  }
  function syncAttach(pr) { if (pr.ih) { pr.ih.hot.x = pr.x; pr.ih.hot.y = pr.y; pr.ih.hot.z = pr.z; } if (pr.paint) pr.paint.at(pr.x, pr.y + pr.size[1] * 0.8, pr.z); }
  function remove(id) {
    const pr = PROPS.get(id); if (!pr) return false; PROPS.delete(id);
    if (pr.eng) { if (ENG.prop.list().includes(pr.eng)) pr.eng.remove(); return true; }   // 엔진이 먼저 정리했으면(reset 순서) 건드리지 않는다 — 풀을 새로 만들지 않게
    const li = PL.indexOf(pr); if (li >= 0) PL.splice(li, 1);
    const k = TW.findIndex(t => t.pr === pr); if (k >= 0) { const t = TW[k]; TW.splice(k, 1); t.res(false); }
    solidRemove(pr); pr.vis = false; pdraw(pr); const p = POOLS.get(pr.kind); p.used[pr.i] = null; psync(p);
    if (pr.blade) { const b = POOLS.get('blade'); b.m.setMatrixAt(pr.blade.i, ZERO); b.m.instanceMatrix.needsUpdate = true; b.used[pr.blade.i] = null; psync(b); }
    if (pr.ih) pr.ih.remove(); if (pr.wind) pr.wind.remove(); if (pr.paint) pr.paint.remove();
    emit('world', { type: 'remove', id }); return true;
  }
  function propTick(dt) {
    for (let k = 0; k < PL.length; k++) { const pr = PL[k], K = KINDS[pr.kind];
      if (K.float) { pr.bob = Math.sin((T - pr.t0) * 1.6 + pr.i) * 0.06; pdraw(pr); }
      if (pr.blade) { pr.spin = (pr.spin + dt * 14) % (Math.PI * 2); pdraw(pr); }
      if (pr.press > 0) { pr.press -= dt; const p = POOLS.get('button'); p.m.setColorAt(pr.i, _c.set(pr.press > 0 ? 0xffe066 : (pr.color ?? 0xffffff))); p.m.instanceColor.needsUpdate = true; }
    }
  }

  // =============== 3. 바람(선풍기) · 튀어 오르는 판 ===============
  const WINDS = [];
  const wind = {
    // { rect:[x0,z0,x1,z1], y0, y1, h(방위° — 바람이 가는 쪽), speed(m/s) } 또는 { from: 선풍기 소품, len, width, speed } → { set(o), remove }
    add(o) { const w = { o }; WINDS.push(w); return { set(n) { Object.assign(w.o, n); }, remove() { const i = WINDS.indexOf(w); if (i >= 0) WINDS.splice(i, 1); } }; },
  };
  function windTick(dt) {
    for (let k = 0; k < WINDS.length; k++) { const o = WINDS[k].o; let hx, hz, inside;
      if (o.from) { const pr = o.from; if (!pr.vis) continue; hx = Math.sin(pr.h * R2D); hz = -Math.cos(pr.h * R2D); const rx = P.x - pr.x, rz = P.z - pr.z, along = rx * hx + rz * hz, side = Math.abs(rx * hz - rz * hx);
        inside = along > 0 && along < o.len && side < o.width / 2 && P.y > pr.y - 0.3 && P.y < pr.y + pr.size[1] + 0.3; }
      else { const R = o.rect; hx = Math.sin((o.h || 0) * R2D); hz = -Math.cos((o.h || 0) * R2D); inside = P.x >= R[0] && P.x <= R[2] && P.z >= R[1] && P.z <= R[3] && P.y >= (o.y0 ?? -1e9) && P.y <= (o.y1 ?? 1e9); }
      if (!inside) continue;
      const sp = (o.speed || 2) * dt * (H.getScale ? Math.max(0.35, Math.sqrt(H.getScale())) : 1), dx = hx * sp, dz = hz * sp;
      if (!pBlocked(P.x + dx, P.z, P.y, P.bh)) P.x += dx; if (!pBlocked(P.x, P.z + dz, P.y, P.bh)) P.z += dz; }
  }
  const PADS = [];
  const pad = { add(o) { const p = { o, cd: 0 }; PADS.push(p); return { remove() { const i = PADS.indexOf(p); if (i >= 0) PADS.splice(i, 1); } }; } };   // { x, z, r(0.6), y?, vy(7 — 위로 튀는 속도) }
  function padTick(dt) { for (let k = 0; k < PADS.length; k++) { const p = PADS[k], o = p.o; if ((p.cd -= dt) > 0) continue; const y = o.y ?? P.y;
    if (P.ground && (P.x - o.x) ** 2 + (P.z - o.z) ** 2 < (o.r || 0.6) ** 2 && Math.abs(P.y - y) < 0.35) { P.vy = o.vy || 7; P.ground = false; p.cd = 0.4; sfx('pick'); emit('world', { type: 'pad' }); } } }

  // =============== 4. 방마다 불 끄기(형광등 정점색 + 그 방에 들어가면 어둡게 — 새 조명 없음) ===============
  const DARKR = new Set(); let lampInit = null, fxDark = false;
  function lampSetup() {
    if (lampInit || !world.lampMesh) return lampInit; const g = world.lampMesh.geometry, n = g.attributes.position.count;
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); world.lampMesh.material.vertexColors = true; world.lampMesh.material.needsUpdate = true;
    return (lampInit = { g, n });
  }
  function lampPaint() { const L = lampSetup(); if (!L) return; const P9 = L.g.attributes.position.array, C = L.g.attributes.color.array; const zs = [...DARKR].map(zoneFind).filter(Boolean);
    for (let i = 0; i < L.n; i++) { const x = P9[i * 3], y = P9[i * 3 + 1], z = P9[i * 3 + 2]; let d = false; for (const zn of zs) if (x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1 && y >= (zn.y ?? 0) && y <= (zn.y ?? 0) + 4.2) { d = true; break; }
      const v = d ? 0.24 : 1; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = v; } L.g.attributes.color.needsUpdate = true; }
  function light(room, on = true) { const zn = zoneFind(room); if (!zn) { console.warn('[world] light: 모르는 방', room); return false; } if (on) DARKR.delete(zn.id); else DARKR.add(zn.id); lampPaint(); darkCheck(); emit('world', { type: 'light', room: zn.id, on: !!on }); return true; }
  function darkCheck() { const zn = zoneAt(P.x, P.y, P.z), want = !!(zn && DARKR.has(zn.id));
    if (want && !fxDark) { fxDark = true; if (!(ENG.stats().dark)) ui.dark(true); }
    else if (!want && fxDark) { fxDark = false; if (!(ENG.stats().dark)) ui.dark(false); } }

  // =============== 5. 문(연 채 · 닫은 채 · 잠금) — 문 61개 · 잠금은 엔진 door.lock ===============
  const HELD = new Set();
  function door(t) { if (typeof t === 'string' && t.startsWith('door:')) t = +t.slice(5); const n = Array.isArray(t) ? ENG.door.find(...t) : -1; const i = typeof t === 'number' ? t : n; if (i == null || i < 0 || !world.doors[i]) { console.warn('[world] door: 문을 못 찾음', t); return null; }
    return { n: i,
      open() { ENG.door.lock(i, false); doorHold(i, 1); HELD.add(i); emit('world', { type: 'door', n: i, state: 'open' }); return this; },
      close() { doorHold(i, null); HELD.delete(i); ENG.door.lock(i, true, { hot: false }); emit('world', { type: 'door', n: i, state: 'closed' }); return this; },   // 닫은 채 = 몸·길 막힘(잠김 안내 없음)
      lock() { doorHold(i, null); HELD.delete(i); ENG.door.lock(i, true); return this; },
      unlock() { ENG.door.lock(i, false); return this; },
      free() { ENG.door.lock(i, false); doorHold(i, null); HELD.delete(i); return this; },   // 원래대로(다가가면 열림)
      get locked() { return ENG.door.locked(i); } }; }

  // =============== 6. 그림(칠판·벽·바닥에 캔버스 판 — 판마다 메시 1) ===============
  const PAINTS = new Set();
  function drawSpec(ctx, W, Hh, sp) {
    ctx.clearRect(0, 0, W, Hh);
    if (sp.bg) { ctx.fillStyle = sp.bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(2, 2, W - 4, Hh - 4, 14) : ctx.rect(0, 0, W, Hh); ctx.fill(); }
    if (sp.draw) { try { sp.draw(ctx, W, Hh); } catch (e) { console.error(e); } }
    if (sp.text) { const lines = String(sp.text).split('\n'); let fs = sp.size || Math.min(Hh / (lines.length + 0.6), 110); ctx.font = '900 ' + fs + 'px sans-serif';
      const mw = Math.max(...lines.map(l => ctx.measureText(l).width)); if (mw > W * 0.92) { fs *= W * 0.92 / mw; ctx.font = '900 ' + fs + 'px sans-serif'; }
      ctx.fillStyle = sp.color || '#1c4096'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((l, i) => ctx.fillText(l, W / 2, Hh / 2 + (i - (lines.length - 1) / 2) * fs * 1.15)); }
  }
  // target = 'board:<구역 id|이름>'(그 방 칠판 — 흰 칠판 면 3cm 앞) | {x,y,z,w,h, ry | face(방위° — 그림이 보는 쪽), floor:true(바닥 +3cm), off} · spec = { bg, text, color, size, draw(ctx, W, H) }
  function paint(target, spec = {}) {
    let x, y, z, w, h, ry = 0, floor = false, two = false;
    if (typeof target === 'string' && target.startsWith('board:')) { const zn = zoneFind(target.slice(6)); const b = zn && HOT.find(hh => hh.kind === 'board' && hh.x >= zn.x0 && hh.x <= zn.x1 && hh.z >= zn.z0 && hh.z <= zn.z1 && Math.abs((hh.y || 0) - (zn.y ?? 0)) < 1.5);
      if (!b) { console.warn('[world] paint: 칠판을 못 찾음', target); return null; }
      ry = b.ry || 0; const nx = Math.sin(ry), nz = Math.cos(ry); x = b.bx + nx * 0.02; y = b.by; z = b.bz + nz * 0.02; w = (b.bw || 1.6) - 0.1; h = (b.bh || 1.2) - 0.1; }
    else if (target && typeof target === 'object') { ({ x, z } = target); y = target.y ?? floorY(x, z); w = target.w || 1; h = target.h || target.d || 1; floor = !!target.floor; two = !!target.two;
      ry = target.ry ?? (target.face != null ? Math.PI - target.face * R2D : 0); if (target.off) { x += Math.sin(ry) * target.off; z += Math.cos(ry) * target.off; } }
    else { console.warn('[world] paint: 모르는 곳', target); return null; }
    const W = 512, Hh = Math.max(64, Math.min(1024, Math.round(512 * h / w))), cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; drawSpec(cv.getContext('2d'), W, Hh, spec);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: two ? THREE.DoubleSide : THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    if (floor) { m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y + 0.03, z); } else { m.rotation.set(0, ry, 0); m.position.set(x, y, z); }
    m.renderOrder = 2; scene.add(m);
    const hnd = { mesh: m, redraw(sp) { drawSpec(cv.getContext('2d'), W, Hh, sp || spec); tex.needsUpdate = true; }, at(nx, ny, nz) { m.position.set(nx, ny, nz); },
      remove() { if (!PAINTS.has(hnd)) return; PAINTS.delete(hnd); scene.remove(m); m.geometry.dispose(); m.material.dispose(); tex.dispose(); } };
    PAINTS.add(hnd); emit('world', { type: 'paint' }); return hnd;
  }
  // 물웅덩이(바닥 +3cm 반투명 판 · 모양만 — 물총 과녁·장식): target = 구역 id|이름 | {x,z,r} | {rect:[x0,z0,x1,z1]} · o = { y, color, opacity }
  function water(target, o = {}) {
    let g, x, z; const zn = typeof target === 'string' ? zoneFind(target) : null;
    if (zn) { g = new THREE.PlaneGeometry(zn.x1 - zn.x0 - 0.4, zn.z1 - zn.z0 - 0.4); x = (zn.x0 + zn.x1) / 2; z = (zn.z0 + zn.z1) / 2; }
    else if (target && target.rect) { const R = target.rect; g = new THREE.PlaneGeometry(R[2] - R[0], R[3] - R[1]); x = (R[0] + R[2]) / 2; z = (R[1] + R[3]) / 2; }
    else if (target && target.r) { g = new THREE.CircleGeometry(target.r, 24); x = target.x; z = target.z; }
    else { console.warn('[world] water: 모르는 곳', target); return null; }
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: o.color ?? 0x5ab4e8, transparent: true, opacity: o.opacity ?? 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, (o.y ?? (zn ? (zn.y ?? floorY(x, z)) : floorY(x, z))) + 0.03, z); m.renderOrder = 2; scene.add(m);
    const hnd = { mesh: m, level(y) { m.position.y = y; }, remove() { if (!PAINTS.has(hnd)) return; PAINTS.delete(hnd); scene.remove(m); g.dispose(); m.material.dispose(); } };
    PAINTS.add(hnd); return hnd;
  }

  // =============== 7. 물건 통째로(OBJ-1 · FURN-1 · 10-03 블록 놀이 '🔨 부수기' — 교사 "부술 수 있는 게 별로 없고 부순 뒤가 지저분") ===============
  //  world.js가 짓는 동안 적은 물건(world.objects — 가구·소품·나무·차 {kind, parts:[{mesh,start,count}], c0~c1 = 그 물건 충돌, box}) 하나를 통째로:
  //  삼각형을 한 점으로 접기(넓이 0) + 충돌 끄기. 위에 얹힌 물건(밑면 = 이 물건 윗면 ±5cm · 가운데가 발자국 안)도 같이(떠 있지 않게).
  //  이름 = 상자 모서리 cm(x0_z0_y0) — 같은 판의 다른 컴퓨터와 같다. 사람을 옮긴 청크(MST)는 건드리지 않음. 놀이가 멈추면 처음대로(reset).
  const OBJL = world.objects || [];
  const FURN = new Map(), FSAVE = new Map(); let FIDX = null, FCOL = null, FGRID = null;
  const objKey = o => Math.round(o.box[0] * 100) + '_' + Math.round(o.box[2] * 100) + '_' + Math.round(o.box[1] * 100);
  function fIndex() {
    if (FIDX) return; FIDX = new Map(); FCOL = new Map(); FGRID = new Map();
    for (const o of OBJL) { const k = objKey(o); if (FIDX.has(k)) continue; o.key = k; FIDX.set(k, o);
      for (let i = o.c0; i < o.c1; i++) FCOL.set(world.colliders[i], o);
      for (let gx = Math.floor(o.box[0] / 8); gx <= Math.floor(o.box[3] / 8); gx++) for (let gz = Math.floor(o.box[2] / 8); gz <= Math.floor(o.box[5] / 8); gz++) {
        const g = gx + ':' + gz; let L = FGRID.get(g); if (!L) FGRID.set(g, L = []); L.push(o); } }
  }
  // 선분 a→b가 처음 맞는 물건(삼각형까지 — 상자로 고르고 삼각형으로 확인) → { t(0~1), n:[x,y,z](광선 쪽 면 법선), id, kind } | null
  const _e1 = [0, 0, 0], _e2 = [0, 0, 0], _pv = [0, 0, 0], _tv = [0, 0, 0], _qv = [0, 0, 0];
  function triHit(o, a, d, tMax) {
    let bt = tMax, bn = null;
    for (const p of o.parts) { const A = p.mesh.geometry.attributes.position.array;
      for (let v = p.start; v < p.start + p.count; v += 3) { const i = v * 3;
        _e1[0] = A[i + 3] - A[i]; _e1[1] = A[i + 4] - A[i + 1]; _e1[2] = A[i + 5] - A[i + 2]; _e2[0] = A[i + 6] - A[i]; _e2[1] = A[i + 7] - A[i + 1]; _e2[2] = A[i + 8] - A[i + 2];
        _pv[0] = d[1] * _e2[2] - d[2] * _e2[1]; _pv[1] = d[2] * _e2[0] - d[0] * _e2[2]; _pv[2] = d[0] * _e2[1] - d[1] * _e2[0];
        const det = _e1[0] * _pv[0] + _e1[1] * _pv[1] + _e1[2] * _pv[2]; if (Math.abs(det) < 1e-12) continue; const inv = 1 / det;
        _tv[0] = a[0] - A[i]; _tv[1] = a[1] - A[i + 1]; _tv[2] = a[2] - A[i + 2];
        const u = (_tv[0] * _pv[0] + _tv[1] * _pv[1] + _tv[2] * _pv[2]) * inv; if (u < 0 || u > 1) continue;
        _qv[0] = _tv[1] * _e1[2] - _tv[2] * _e1[1]; _qv[1] = _tv[2] * _e1[0] - _tv[0] * _e1[2]; _qv[2] = _tv[0] * _e1[1] - _tv[1] * _e1[0];
        const w = (d[0] * _qv[0] + d[1] * _qv[1] + d[2] * _qv[2]) * inv; if (w < 0 || u + w > 1) continue;
        const t = (_e2[0] * _qv[0] + _e2[1] * _qv[1] + _e2[2] * _qv[2]) * inv; if (t <= 1e-6 || t >= bt) continue;
        let nx = _e1[1] * _e2[2] - _e1[2] * _e2[1], ny = _e1[2] * _e2[0] - _e1[0] * _e2[2], nz = _e1[0] * _e2[1] - _e1[1] * _e2[0]; const nl = Math.hypot(nx, ny, nz) || 1;
        if (nx * d[0] + ny * d[1] + nz * d[2] > 0) { nx = -nx; ny = -ny; nz = -nz; } bt = t; bn = [nx / nl, ny / nl, nz / nl]; } }
    return bn ? { t: bt, n: bn } : null;
  }
  function furnPick(a, b) {
    fIndex(); const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], cand = [], seen = new Set();
    for (let gx = Math.floor(Math.min(a[0], b[0]) / 8); gx <= Math.floor(Math.max(a[0], b[0]) / 8); gx++) for (let gz = Math.floor(Math.min(a[2], b[2]) / 8); gz <= Math.floor(Math.max(a[2], b[2]) / 8); gz++) {
      const L = FGRID.get(gx + ':' + gz); if (!L) continue;
      for (const o of L) { if (seen.has(o) || FURN.has(o.key)) continue; seen.add(o);
        let t0 = 0, t1 = 1, ok = true; for (let ax = 0; ax < 3 && ok; ax++) { const lo = o.box[ax] - 0.01, hi = o.box[ax + 3] + 0.01;
          if (Math.abs(d[ax]) < 1e-12) { if (a[ax] < lo || a[ax] > hi) ok = false; } else { let p9 = (lo - a[ax]) / d[ax], r9 = (hi - a[ax]) / d[ax]; if (p9 > r9) { const s9 = p9; p9 = r9; r9 = s9; } if (p9 > t0) t0 = p9; if (r9 < t1) t1 = r9; if (t0 > t1) ok = false; } }
        if (ok) cand.push([t0, o]); } }
    cand.sort((x, y) => x[0] - y[0]); let best = null;
    for (const [t0, o] of cand) { if (best && t0 > best.t) break; const h = triHit(o, a, d, best ? best.t : 1); if (h) best = { t: h.t, n: h.n, id: o.key, kind: o.kind }; }
    return best;
  }
  function furnHide(key, by = null) {
    fIndex(); if (FURN.has(key)) return { ok: true, already: true };
    const o = FIDX.get(key); if (!o) return { ok: false, why: 'none' };
    for (const p of o.parts) if (MST.has(p.mesh)) return { ok: false, why: 'busy' };
    let shadow = false, nC = 0; const rgb = [0, 0, 0];
    for (const p of o.parts) { const g = p.mesh.geometry, P = g.attributes.position, A = P.array, C = g.attributes.color; if (!FSAVE.has(p.mesh)) FSAVE.set(p.mesh, A.slice());
      for (let v = p.start; v < p.start + p.count; v += 3) { const i = v * 3; A[i + 3] = A[i + 6] = A[i]; A[i + 4] = A[i + 7] = A[i + 1]; A[i + 5] = A[i + 8] = A[i + 2];
        if (C && nC < 600) { rgb[0] += C.getX(v); rgb[1] += C.getY(v); rgb[2] += C.getZ(v); nC++; } }
      P.needsUpdate = true; if (p.mesh.castShadow) shadow = true; }
    const cols = []; for (let i = o.c0; i < o.c1; i++) { const c = world.colliders[i]; cols.push([c, c.y0, c.y1]); c.y0 = c.y1 = -1e6; }
    FURN.set(key, { o, cols, by });
    const top = o.box[4], up = [];
    for (const q of OBJL) { if (q === o || !q.key || FURN.has(q.key)) continue; const cx = (q.box[0] + q.box[3]) / 2, cz = (q.box[2] + q.box[5]) / 2;
      if (Math.abs(q.box[1] - top) < 0.05 && cx > o.box[0] && cx < o.box[3] && cz > o.box[2] && cz < o.box[5]) up.push(q.key); }
    for (const k of up) furnHide(k, key);
    if (shadow && rebake) rebake();
    emit('world', { type: 'furn', id: key, hidden: true });
    return { ok: true, kind: o.kind, with: up, color: nC ? [rgb[0] / nC, rgb[1] / nC, rgb[2] / nC] : [0.6, 0.45, 0.3], box: { x0: o.box[0], x1: o.box[3], y0: o.box[1], top: o.box[4], z0: o.box[2], z1: o.box[5] } };
  }
  function furnShow(key) {
    const f = FURN.get(key); if (!f) return false; let shadow = false;
    for (const p of f.o.parts) { const S0 = FSAVE.get(p.mesh); if (!S0) continue; const A = p.mesh.geometry.attributes.position.array;
      for (let i = p.start * 3; i < (p.start + p.count) * 3; i++) A[i] = S0[i]; p.mesh.geometry.attributes.position.needsUpdate = true; if (p.mesh.castShadow) shadow = true; }
    for (const [c, y0, y1] of f.cols) { c.y0 = y0; c.y1 = y1; }
    FURN.delete(key);
    for (const [k, g] of [...FURN]) if (g.by === key) furnShow(k);   // 같이 숨겼던 것(얹혀 있던 물건)
    if (!FURN.size) FSAVE.clear();
    if (shadow && rebake) rebake();
    emit('world', { type: 'furn', id: key, hidden: false });
    return true;
  }
  const furn = {
    pick: furnPick,                                                                  // 화면 광선 → 물건(삼각형까지)
    idOf: box => { fIndex(); const o = FCOL.get(box); return o && o.key ? o.key : null; },   // 충돌 상자(q.rayHit의 box) → 물건 이름(물건 것이 아니면 null)
    hide: id => furnHide(id), show: furnShow, isHidden: id => FURN.has(id), hidden: () => [...FURN].filter(([, f]) => !f.by).map(([k]) => k), count: () => (fIndex(), FIDX.size),
    box: id => { fIndex(); const o = FIDX.get(id); return o ? { x0: o.box[0], x1: o.box[3], y0: o.box[1], top: o.box[4], z0: o.box[2], z1: o.box[5], kind: o.kind } : null; },
  };

  // =============== 틱 · 정리 ===============
  let t10 = 0;
  function tick(dt) {
    T += dt;
    if (ACTORS.length) actorTick(dt);
    if (SGN && ACTORS.length) signTick();
    if (TW.length) twTick(dt);
    if (PL.length) propTick(dt);
    if (WINDS.length) windTick(dt);
    if (PADS.length) padTick(dt);
    if ((t10 += dt) >= 0.1) { t10 = 0; if (ACTORS.length) actorTick10(); if (DARKR.size || fxDark) darkCheck(); }
  }
  function reset() {
    GEN++;
    for (const a of [...ACTORS]) { dropActor(a); } for (const [, st] of NST) st.actor = null;
    for (const id of [...NST.keys()]) showOrig(id); NST.clear();
    for (const [, g] of GEO) g.dispose(); GEO.clear(); if (SGN) { scene.remove(SGN.m); SGN.g.dispose(); SGN = null; }   // 재질은 월드 팻말 것(버리지 않음)
    for (const id of [...PROPS.keys()]) remove(id); TW.length = 0;
    for (const [, p] of POOLS) { scene.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); if (p.m.dispose) p.m.dispose(); } POOLS.clear();
    if (G0) { for (const k in G0) G0[k].dispose(); G0 = null; }
    WINDS.length = 0; PADS.length = 0; PL.length = 0;
    for (const h of [...PAINTS]) h.remove();
    if (DARKR.size || lampInit) { DARKR.clear(); if (lampInit) { lampInit.g.deleteAttribute('color'); world.lampMesh.material.vertexColors = false; world.lampMesh.material.needsUpdate = true; lampInit = null; } }
    if (fxDark) { fxDark = false; if (!(ENG.stats().dark)) ui.dark(false); }
    for (const n of [...HELD]) doorHold(n, null); HELD.clear();
    for (const id of [...FURN.keys()]) furnShow(id); FSAVE.clear();   // FURN-1: 부순 가구 처음대로
  }
  const solidN = () => { let n = 0; for (const [, pr] of PROPS) if (pr.cols && pr.cols.length) n++; for (const a of ACTORS) if (a.col) n++; return n; };
  const stats = () => ({ actors: ACTORS.length, hiddenNpc: [...NST.values()].filter(s => s.hidden).length, props: PROPS.size, furn: FURN.size, pools: POOLS.size, tweens: TW.length, winds: WINDS.length, pads: PADS.length, paints: PAINTS.size, darkRooms: DARKR.size, held: HELD.size, fxDark, doorActors: doorActors ? doorActors.length : 0 });
  Object.assign(world_, { spawn, move, remove, get: id => { const p = PROPS.get(id); return p ? (p.api || p.eng) : null; }, list: () => [...PROPS.values()].map(p => p.api || p.eng), kinds: [...Object.keys(KINDS).filter(k => k !== 'blade'), ...ENGK],
    light, dark: () => [...DARKR], door, paint, water, wind: o => wind.add(o), pad: o => pad.add(o), furn });
  return { npc, world: world_, tick, reset, stats, solidN };
}
