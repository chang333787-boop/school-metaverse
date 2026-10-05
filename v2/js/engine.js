// v2 행동 사전 엔진(ENGINE-1 · 09-27) — 이야기·방탈출·잠입·숨바꼭질이 같이 쓰는 '동사'들. 설계 = docs/tasks/story_engine.md · 정본 문서 = docs/map_api.md §12
//   웅크리기 · 숨는 자리 · 소리/시야 · 조사하기(쪽지) · 파기 · 들기/놓기 · 소품 풀 · 이야기 상태(기억·가방·장) + 이야기 파일 실행기 · 문 잠그기 · 쫓는 것(장난감 로봇·유령·순찰 로봇)
//   import 없음(THREE·월드·물리·HUD는 mapapi가 host로 준다). 게임이 부르지 않으면 아무것도 만들지 않는다(메시·DOM·이벤트 0 — 게이트 영향 0).
//   원칙: 매 프레임 새 객체 없음(모듈 스크래치 재사용) · 감지(시야·소리)는 10Hz · 길찾기는 한 프레임에 한 번 · 새 조명 없음 · 사람(NPC)은 쫓는 것이 아니다 ·
//         대사·쪽지·문제 글은 만들지 않는다 — 게임이 준 글만 보여 준다(자리표시 '(여기에 아이들이 쓴 쪽지)'처럼).
//   게임이 멈추면 mapapi 범위 파사드 dispose → reset(): 숨기·웅크리기·들기·쪽지·소품·쫓는 것·문 잠금·기억·가방을 모두 처음대로.
export function createEngine(H) {
  const { THREE, scene, camera, world, P, CTRL, ACT, q, hot: HOT, ui, touch, kid, doorLock, findEntry, floorY, zoneAt, zoneFind, emit, interactAdd, colliderAdd, navDone, teleport, setYaw, sfx } = H;
  const R2D = Math.PI / 180;
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  let T = 0;   // 엔진 시계(초)
  const owned = [];   // 엔진이 만든 정리 항목(상호작용 지점·충돌·DOM) — reset 때 전부
  const own = h => { owned.push(h); return h; };
  const disown = h => { const i = owned.indexOf(h); if (i >= 0) owned.splice(i, 1); };
  const hdg = (fx, fz) => ((Math.atan2(fx, -fz) / R2D) % 360 + 360) % 360;   // 앞 벡터 → 방위°(0 북·90 동)
  const fwd = h => [Math.sin(h * R2D), -Math.cos(h * R2D)];

  // ---------- 모양 굽기(부위마다 정점색 · 한 지오메트리 — kid.js bake와 같은 식) ----------
  let G0 = null;
  const prims = () => G0 || (G0 = { SPH: new THREE.SphereGeometry(1, 16, 10), SPHS: new THREE.SphereGeometry(1, 8, 6), CYL: new THREE.CylinderGeometry(1, 1, 1, 12, 1), BOX: new THREE.BoxGeometry(1, 1, 1),
    CONE: new THREE.CylinderGeometry(0.72, 1, 1, 14, 1), DOME: new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), TOR: new THREE.TorusGeometry(1, 0.28, 6, 14) });
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
  const X = Math.PI / 2;

  // ---------- 풀(InstancedMesh — 종류마다 드로우콜 1 · 처음 쓸 때 만든다 · reset 때 장면에서 떼고 버린다) ----------
  const POOLS = new Map();
  function pool(key, geoFn, matFn, cap) {
    let p = POOLS.get(key); if (p) return p;
    const m = new THREE.InstancedMesh(geoFn(), matFn(), cap); m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
    for (let i = 0; i < cap; i++) m.setMatrixAt(i, ZERO);
    m.setColorAt(0, _c.set(0xffffff)); for (let i = 1; i < cap; i++) m.setColorAt(i, _c);
    m.count = 0; m.visible = false;   // 그리는 수 = 쓰는 칸 끝까지(빈 칸 삼각형·빈 풀 드로우콜 0)
    scene.add(m); p = { m, cap, used: new Array(cap).fill(null) }; POOLS.set(key, p); return p;
  }
  function psync(p) { let n = 0; for (let i = 0; i < p.cap; i++) if (p.used[i]) n = i + 1; p.m.count = n; p.m.visible = n > 0; }
  const lamV = (o = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x1e1e1e, ...o });
  const slot = p => { const i = p.used.indexOf(null); return i; };

  // ---------- 1. 웅크리기 · 소리 · 시야 ----------
  const player = {
    // 게임이 이 판에서 웅크리기를 쓰게 한다(기본 끔 — 게임 없음 = 게이트 영향 0). 키보드 C·Ctrl 누르고 있기 · 터치 ⬇ 버튼(켬/끔)
    crouch(on = true) { CTRL.crouchOK = !!on; touch.setCrouchBtn(!!on); if (!on) CTRL.crouchForce = null; ctrlGuard(!!on); },
    crouched: () => !!CTRL.crouched,
    // SHRINK-1(09-27): 몸 크기 s(0.05~1 · 1 = 원래). 물리(반지름·키·오름·점프·걷기·중력)·카메라(거리·근평면)가 비례하고, 작은 몸은 가구 '보이는 윗면'(책상·의자 좌판·교탁·사물함·창턱)을 딛는다.
    //   o = { speed: 걷기 배율(기본 √s), jump: 점프 정점 m(기본 0.97·s), gravity: 중력 배율(기본 √s), far } · 게임이 멈추면 1로(끼면 unstick). 길격자·도달성·검진은 늘 원래 몸
    scale(s = 1, o = {}) { return H.setScale ? H.setScale(s, o) : 1; },
    scaled: () => (H.getScale ? H.getScale() : 1),
    groundAt: (x, z, fromY) => (H.pGround ? H.pGround(x, z, fromY) : q.groundAt(x, z, fromY)),
    blockedAt: (x, z, y, h) => (H.pBlocked ? H.pBlocked(x, z, y, h ?? P.bh) : q.blockedAt(x, z, y, h)),   // 지금 몸(작아졌으면 작은 몸 판)으로 막히나 · groundAt = 딛는 윗면 — 게임이 소품·과자 자리·틈을 고를 때
    setCrouch(v) { CTRL.crouchForce = v == null ? null : !!v; },   // 시험·연출용 강제(null = 입력대로)
    hidden: () => !!hidden,
    hideSpot: () => hidden,
    // HS-1(10-04 비대칭 숨바꼭질): 투명 — 내 몸이 비치고(38%) 술래 시야(see)가 1.3 m 밖이면 못 봄 · 발소리는 그대로 들림 · 게임이 멈추면 꺼짐
    invisible(on) { if (on === undefined) return invis; return setInvis(on); },
    // 소리 0 가만히 · 1 작음(웅크려 걷기) · 2 보통(걷기) · 3 큼(달리기·점프·뛰어내림) — 숨어 있거나 앉아 있으면 0
    noise() { if (hidden || ACT.sit) return 0; if (CTRL.noiseT > 0 || (!P.ground && !ACT.anim)) return 3; const v = P.spd || 0; if (v < 0.3) return 0; if (CTRL.crouched) return 1; return v > 5.5 ? 3 : 2; },
  };
  // 리뷰(ENGINE-1): Ctrl 웅크리기 안전장치 — Ctrl을 누른 채 W로 걸으면 크롬이 탭을 닫는다(Ctrl+W는 페이지가 막을 수 없다).
  //   웅크리기를 켠 동안만: Ctrl+글자 키의 브라우저 기본 동작(저장·북마크·전체 선택…)을 막고, 페이지를 떠나려 하면 '나가시겠어요?' 확인(beforeunload)을 띄운다. 끄거나 게임이 멈추면 뗀다
  let guard = null;
  function ctrlGuard(on) {
    if (on && !guard) { guard = { kd: e => { if (e.ctrlKey && !e.metaKey && /^(Key[A-Z]|Digit\d)$/.test(e.code) && e.code !== 'KeyC' && e.code !== 'KeyV') e.preventDefault(); }, bu: e => { e.preventDefault(); e.returnValue = ''; } };
      addEventListener('keydown', guard.kd); addEventListener('beforeunload', guard.bu); }
    else if (!on && guard) { removeEventListener('keydown', guard.kd); removeEventListener('beforeunload', guard.bu); guard = null; }
  }
  // 시야선: 충돌 상자를 지나는가 — 올라서기 금지(NS)로 올린 보이지 않는 윗부분은 빼고 '보이는 윗면'(vy1)까지만 가린다(책상·덤불 뒤에 웅크리면 가려짐).
  //   철망·골대 그물 같은 막이(nc)는 가린다(물총 놀이와 같게). 8m 격자 칸만 · 본 상자 표시는 세대 번호(새 Set 없음)
  let seenGen = 1, seenArr = new Uint32Array(8192);
  function sightBlocked(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az; if (++seenGen > 4e9) { seenGen = 1; seenArr.fill(0); }
    if (seenArr.length < world.colliders.length) { const a = new Uint32Array(world.colliders.length * 2); a.set(seenArr); seenArr = a; }
    for (let gx = Math.floor(Math.min(ax, bx) / 8); gx <= Math.floor(Math.max(ax, bx) / 8); gx++)
      for (let gz = Math.floor(Math.min(az, bz) / 8); gz <= Math.floor(Math.max(az, bz) / 8); gz++) {
        const cell = world.cell ? world.cell(gx, gz) : world.grid.get(gx + ':' + gz); if (!cell) continue;   // PERF-WIN: 숫자 칸(main.js world.cell — 문자열 열쇠 없음)
        for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (seenArr[i] === seenGen) continue; seenArr[i] = seenGen; const c = world.colliders[i];
          const top = c.vy1 != null ? c.vy1 : c.y1; if (top <= c.y0) continue;
          let t0 = 0, t1 = 1, ok = true;
          for (let a = 0; a < 3 && ok; a++) { const o = a === 0 ? ax : a === 1 ? ay : az, d = a === 0 ? dx : a === 1 ? dy : dz, lo = a === 0 ? c.x0 : a === 1 ? c.y0 : c.z0, hi = a === 0 ? c.x1 : a === 1 ? top : c.z1;
            if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d, r = (hi - o) / d; if (p > r) { const s = p; p = r; r = s; } if (p > t0) t0 = p; if (r < t1) t1 = r; if (t0 > t1) ok = false; } }
          if (ok) return true; } }
    return false;
  }
  const SEE = { x: 0, y: 0, z: 0 };
  function targetXYZ(to) {
    if (to === 'player' || to == null) { SEE.x = P.x; SEE.y = P.y + (CTRL.crouched ? 0.62 : 1.3); SEE.z = P.z; return SEE; }
    if (Array.isArray(to)) { SEE.x = to[0]; SEE.y = to.length > 2 ? to[1] : floorY(to[0], to[1]) + 1; SEE.z = to.length > 2 ? to[2] : to[1]; return SEE; }
    SEE.x = to.x; SEE.y = to.y ?? floorY(to.x, to.z) + 1; SEE.z = to.z; return SEE;
  }
  // map.see(from, to, fov°, range) — from = {x,y,z,h}(h 방위° · y = 눈 높이) 또는 [x,y,z](+opt.h) · to = 'player'(기본) | [x,z] | [x,y,z] | {x,y,z}
  //   숨은 플레이어는 안 보인다 · 가까이(0.9m 안)면 방향과 무관하게 보인다(부딪힘)
  function see(from, to = 'player', fovDeg = 90, range = 8, o = {}) {
    if ((to === 'player' || to == null) && hidden) return false;
    const fx0 = Array.isArray(from) ? from[0] : from.x, fy0 = Array.isArray(from) ? from[1] : from.y, fz0 = Array.isArray(from) ? from[2] : from.z, h = Array.isArray(from) ? o.h : from.h;
    const t = targetXYZ(to), dx = t.x - fx0, dz = t.z - fz0, d = Math.hypot(dx, dz);
    if (d > range) return false;
    if ((to === 'player' || to == null) && invis && d > 1.3) return false;   // HS-1 투명
    if (d > 0.9 && h != null) { const [ux, uz] = fwd(h); if ((dx * ux + dz * uz) / (d || 1) < Math.cos(fovDeg / 2 * R2D)) return false; }
    return !sightBlocked(fx0, fy0, fz0, t.x, t.y, t.z);
  }

  // ---------- 2. HUD 조각(DOM — 처음 쓸 때 만든다) ----------
  let css = null;
  function ensureCss() {
    if (css) return; css = document.createElement('style'); css.id = 'eng-css';
    css.textContent = [
      '.eng-vig{position:fixed;inset:0;z-index:18;pointer-events:none;background:radial-gradient(ellipse 58% 54% at 50% 50%,rgba(0,0,0,0) 52%,rgba(10,13,22,.72) 80%,rgba(4,6,12,.97) 100%);display:none}',
      '.eng-note{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:30;width:min(480px,86vw);max-height:80vh;overflow:auto;background:#fffaf0;color:#3a3226;border-radius:6px;padding:22px 26px 16px;'
        + 'box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 0 0 1px rgba(160,130,90,.35);font:16px/1.6 sans-serif;background-image:repeating-linear-gradient(transparent 0 27px,rgba(120,150,200,.18) 27px 28px)}',
      '.eng-note h3{margin:0 0 10px;font-size:19px}.eng-note p{margin:0;white-space:pre-line}',
      '.eng-note button{display:block;margin:16px auto 0;min-width:140px;min-height:44px;font-size:16px;border:0;border-radius:10px;background:#1d3557;color:#fff;cursor:pointer}',
      '.eng-inv{position:fixed;left:10px;top:46px;z-index:20;display:none;gap:6px;pointer-events:none}',
      '.eng-inv span{width:34px;height:34px;border-radius:9px;background:rgba(29,53,87,.8);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}',
      'body.touch .eng-inv{top:calc(98px + env(safe-area-inset-top))}',
      '.eng-fade{position:fixed;inset:0;z-index:29;pointer-events:none;background:#000;opacity:0;transition:opacity .5s linear;display:none}',
      '.eng-torch{position:fixed;inset:0;z-index:17;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(2,4,10,0) 0,rgba(2,4,10,0) 12vmax,rgba(2,4,10,.62) 28vmax,rgba(1,2,6,.9) 48vmax)}',
      '.eng-torch i{position:absolute;inset:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 50%,rgba(255,232,180,.2) 0,rgba(255,232,180,.08) 9vmax,rgba(255,232,180,0) 17vmax)}',
      '.eng-bub{position:fixed;left:0;top:0;z-index:19;pointer-events:none;font:800 26px sans-serif;display:none;text-shadow:0 2px 0 rgba(255,255,255,.9),0 0 4px rgba(0,0,0,.4)}',
    ].join('\n');
    document.head.appendChild(css);
  }
  const div = (cls, html = '') => { ensureCss(); const d = document.createElement('div'); d.className = cls; d.innerHTML = html; document.body.appendChild(d); return d; };

  // ---------- 3. 숨는 자리 ----------
  const HIDES = []; let hidden = null, vig = null, hidePrev = null;
  let invis = false, invMats = null;   // HS-1: 투명(내 캐릭터 재질 — 처음 켤 때 원래 값을 적어 둠)
  function setInvis(on) { on = !!on; if (on === invis) return invis; invis = on;
    if (!invMats) { invMats = []; kid.pg.traverse(o => { if (o.isMesh && o.material) for (const m of [].concat(o.material)) if (!invMats.some(r => r.m === m)) invMats.push({ m, t: m.transparent, o: m.opacity, d: m.depthWrite }); }); }
    for (const r of invMats) { r.m.transparent = on ? true : r.t; r.m.opacity = on ? 0.38 : r.o; r.m.depthWrite = on ? false : r.d; r.m.needsUpdate = true; }
    return invis; }
  // 앞면 방위가 없으면(덤불·나무·미끄럼틀) 8방향 중 걸어 설 수 있는 쪽(near가 있으면 그쪽에 가까운 방향 먼저)
  // 서는 칸은 그 자리와 같은 구역이어야 한다(벽 너머 옆 교실 칸을 잡지 않게 — 교탁이 벽 쪽이면 findEntry가 벽 뒤 칸을 찾았다)
  const sameZone = (x, y, z, e) => { const a = zoneAt(x, y + 0.3, z); if (!a) return true; const b = zoneAt(e.x, e.y + 0.05, e.z); return !!b && b.id === a.id; };
  function autoFace(x, z, y, w, near) {
    const order = [0, 45, 90, 135, 180, 225, 270, 315];
    if (near) { const h0 = hdg(near[0] - x, near[1] - z); order.sort((a, b) => Math.abs(((a - h0 + 540) % 360) - 180) - Math.abs(((b - h0 + 540) % 360) - 180)).reverse(); }
    for (const h of order) { const [fx, fz] = fwd(h), e = findEntry(x + fx * (Math.min(w, 1.2) / 2 + 0.7), z + fz * (Math.min(w, 1.2) / 2 + 0.7), y, null, 0.6); if (e && sameZone(x, y, z, e)) return h; }
    return null;
  }
  function standOf(x, z, y, face, w, maxR = 1.2) { const [fx, fz] = fwd(face), e = findEntry(x + fx * (Math.min(w, 1.2) / 2 + 0.55), z + fz * (Math.min(w, 1.2) / 2 + 0.55), y, null, maxR);
    return e && sameZone(x, y, z, e) ? e : null; }
  const hide = {
    // 게임 중에만 켜지는 숨는 자리 — 다가가 행동(E·✋) = '숨기' → 캐릭터 숨김 + 틈새 시점(좁은 화각·가장자리 어둡게)·움직임 멈춤 · 다시 행동 = 옆 빈 칸으로 나옴
    //   o = { x, z, y?, face?(앞면 방위° — 없으면 자동), label, kind, w?(폭), eye?(틈새 눈 높이 0.85), fov?(40), r?(1.1) } → { spot, remove }
    add(o) {
      const y = o.y ?? floorY(o.x, o.z), w = o.w ?? 1, face = o.face ?? autoFace(o.x, o.z, y, w, o.near);
      if (face == null) { console.warn('[engine] hide.add: 설 자리가 없는 숨는 자리', o); return { spot: null, remove() {} }; }
      const st = o.stand ? (Array.isArray(o.stand) ? { x: o.stand[0], y: o.stand[1], z: o.stand[2] } : o.stand) : (standOf(o.x, o.z, y, face, w) || standOf(o.x, o.z, y, face, w, 2.2));
      if (!st) { console.warn('[engine] hide.add: 앞에 설 칸이 없음', o); return { spot: null, remove() {} }; }
      const EYE = { desk: 0.55, bush: 0.7, slide: 0.6, tree: 0.9 };   // 틈새 눈 높이: 웅크려 들어가는 곳은 낮게 · 서서 들어가는 곳(사물함·청소함·커튼)은 1.25(앞 책상 너머로 보이게)
      const s = { x: o.x, y, z: o.z, face, w, label: o.label || '숨는 자리', kind: o.kind || 'spot', eye: o.eye ?? EYE[o.kind] ?? 1.25, fov: o.fov ?? 40, stand: st, seenEnter: false, enterT: 0, id: HIDES.length + 1 };
      const lab = '🙈 숨기' + (o.label ? ' · ' + o.label : '');
      const ih = interactAdd({ x: st.x, y: st.y, z: st.z, r: o.r ?? 1.1, label: lab, use: () => { if (hidden === s) hide.exit(); else if (!hidden) hide.enter(s); } });
      s.hot = ih.hot; s.lab = lab; HIDES.push(s);
      const hnd = own({ spot: s, remove() { if (hidden === s) hide.exit(); ih.remove(); const i = HIDES.indexOf(s); if (i >= 0) HIDES.splice(i, 1); disown(hnd); } });
      return hnd;
    },
    enter(s) {
      if (hidden || !s) return false;
      if (carried) carry.drop();
      hidden = s; s.enterT = T; s.seenEnter = CH.some(c => c.alive && c.sawT > T - 0.6);   // 들어가는 모습을 본 술래가 있으면(최근 0.6초 안에 봤음) — 그 술래가 뒤지면 찾는다
      hidePrev = { frozen: CTRL.frozen, x: P.x, y: P.y, z: P.z };
      const [fx, fz] = fwd(s.face), yaw = -s.face * R2D;
      CTRL.frozen = true; CTRL.crouchForce = null;
      CTRL.peek = { x: s.x + fx * Math.min(0.35, s.w * 0.25), y: s.y + s.eye, z: s.z + fz * Math.min(0.35, s.w * 0.25), yaw, fov: s.fov };
      setYaw(yaw); s.hot.label = '🚪 나오기'; CTRL.hot = s.hot;
      if (!vig) vig = div('eng-vig'); vig.style.display = 'block';   // 안내('나오기')는 가운데 아래 상호작용 칩이 한다
      sfx('pick'); emit('hide', { spot: s, on: true }); return true;
    },
    exit() {
      const s = hidden; if (!s) return false; hidden = null;
      CTRL.peek = null; CTRL.hot = null; CTRL.frozen = hidePrev ? hidePrev.frozen : false; s.hot.label = s.lab; if (vig) vig.style.display = 'none';
      // 리뷰(ENGINE-1): 들어갈 때 선 칸(stand — add 때 빈 칸으로 확인)으로 나온다. 예전엔 그 앞 0.3m에서 빈 칸을 새로 찾아 책상 많은 교실에선 2m 넘게 떨어진 칸(책상 줄 너머)으로 나왔다
      const [fx, fz] = fwd(s.face), e = (!q.blockedAt(s.stand.x, s.stand.z, s.stand.y) && s.stand) || findEntry(s.stand.x + fx * 0.3, s.stand.z + fz * 0.3, s.stand.y, null, 3) || s.stand;
      teleport([e.x, e.y, e.z], { h: s.face });
      emit('hide', { spot: s, on: false }); return true;
    },
    current: () => hidden,
    list: () => HIDES.slice(),
    // 후보 자리(월드 가구·장소 좌표에서) — 교실 청소함·사물함·교탁 밑·급식실 커튼·체육관 무대 커튼·덤불·미끄럼틀 밑·큰 나무 구멍.
    //   o = { kinds:['locker','desk','cabinet','curtain','stage','bush','slide','tree'], near:[x,z], r, zone(id|라벨), max(20), floor } → [{kind,label,x,y,z,face,w,stand:{x,y,z}}] (가까운 순)
    //   좌표만 돌려준다 — 게임이 골라 hide.add(후보)로 켠다
    candidates(o = {}) {
      const out = [], zf = o.zone ? zoneFind(o.zone) : null;
      const push = c => { if (o.kinds && !o.kinds.includes(c.kind)) return; if (o.floor && (c.y >= 3 ? 2 : 1) !== o.floor) return;
        if (o.near && Math.hypot(c.x - o.near[0], c.z - o.near[1]) > (o.r ?? 30)) return;
        if (zf && !(c.x >= zf.x0 && c.x < zf.x1 && c.z >= zf.z0 && c.z < zf.z1 && c.y >= zf.y0 - 0.5 && c.y < zf.y1)) return; out.push(c); };
      for (const c of world.hideSpots || []) push({ ...c });
      for (const h of HOT) if (h.kind === 'slide' && h.from && h.to) push({ kind: 'slide', label: '미끄럼틀 밑', x: (h.from[0] + h.to[0]) / 2, y: floorY((h.from[0] + h.to[0]) / 2, (h.from[2] + h.to[2]) / 2), z: (h.from[2] + h.to[2]) / 2, face: null, w: 1.2 });
      if (H.bigTree) push({ kind: 'tree', label: '큰 나무 구멍', x: H.bigTree[0], y: floorY(H.bigTree[0], H.bigTree[1]), z: H.bigTree[1], face: null, w: 1.4 });
      if (o.near) out.sort((a, b) => Math.hypot(a.x - o.near[0], a.z - o.near[1]) - Math.hypot(b.x - o.near[0], b.z - o.near[1]));
      const res = [];
      for (const c of out) { if (res.length >= (o.max ?? 20)) break;
        if (c.face == null) c.face = autoFace(c.x, c.z, c.y, c.w || 1, o.near); if (c.face == null) continue;
        let st = standOf(c.x, c.z, c.y, c.face, c.w || 1) || standOf(c.x, c.z, c.y, c.face, c.w || 1, 2.2);   // 앞에 책상이 붙어 있으면 조금 더 멀리서
        if (!st) { const f2 = autoFace(c.x, c.z, c.y, c.w || 1, o.near); if (f2 != null) { c.face = f2; st = standOf(c.x, c.z, c.y, f2, c.w || 1); } }   // 앞이 막힌 가구(벽 쪽 교탁) = 트인 쪽으로
        if (!st) continue; c.stand = st; res.push(c); }
      return res;
    },
  };

  // ---------- 4. 쪽지(조사하기) ----------
  let noteEl = null, noteDone = null;
  // map.note(제목, 본문) → Promise(닫으면) — 글은 게임 데이터 그대로(아이들이 쓴 것 · 자리표시). 여는 동안 멈춤 · E·Esc·Enter·버튼·바깥 누름으로 닫힘
  function note(title, body) {
    if (noteDone) noteDone();
    return new Promise(res => {
      document.exitPointerLock?.(); const was = CTRL.frozen; CTRL.frozen = true;
      noteEl = div('eng-note'); const h = document.createElement('h3'), p = document.createElement('p'), b = document.createElement('button');
      h.textContent = title || ''; p.textContent = body || ''; b.textContent = '닫기'; if (title) noteEl.appendChild(h); noteEl.appendChild(p); noteEl.appendChild(b);
      const t0 = performance.now();
      // done(false) = 게임이 멈춰 치움(reset) — 약속을 풀지 않는다(멈춘 게임의 'await map.note' 뒤 코드가 돌아 다음 판에 기억 표시가 새지 않게)
      const done = (fin = true) => { if (!noteEl) return; removeEventListener('keydown', kd, true); noteEl.remove(); noteEl = null; noteDone = null; CTRL.frozen = hidden ? true : was; if (fin) res(true); };
      const kd = e => { if (performance.now() - t0 < 250) return; if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') { e.stopPropagation(); e.preventDefault(); done(); } };
      // 리뷰: 쪽지 어디를 눌러도 닫힘(휴대폰에선 쪽지가 ✋ 버튼을 덮는다 — 예전엔 '닫기' 버튼만 됐다) · 여는 탭이 바로 닫지 않게 250ms
      const tap = e => { e.preventDefault(); e.stopPropagation(); if (performance.now() - t0 >= 250) done(); };
      noteEl.addEventListener('click', tap); noteEl.addEventListener('touchend', tap);
      addEventListener('keydown', kd, true); noteDone = done; emit('note', { title });
    });
  }
  const closeModal = () => { if (!noteDone) return false; noteDone(); return true; };   // ✋·안내 칩 누름 = 쪽지 닫기(main.js)
  const investigate = {
    // 조사하기 지점(칠판·게시판·책장·사물함…) — o = { x, z, y?, r?, label('🔍 조사하기'), note:{title, body}?, onUse(api)?, once? } → { hot, remove }
    add(o) {
      let used = 0;
      const ih = interactAdd({ x: o.x, y: o.y, z: o.z, r: o.r ?? 1.2, label: o.label || '🔍 조사하기', once: !!o.once,
        use: async () => { used++; if (o.note) await note(o.note.title, o.note.body); if (o.onUse) o.onUse({ used }); emit('investigate', { label: o.label, used }); } });
      const hnd = own({ hot: ih.hot, get used() { return used; }, remove() { ih.remove(); disown(hnd); } }); return hnd;
    },
  };

  // ---------- 5. 소품 풀(상자·보물 상자·열쇠·삽·쪽지) ----------
  const PROP_GEO = {
    box: () => { const { BOX } = prims(); return bake([[BOX, [0, 0.22, 0], [0.44, 0.44, 0.44], 0xc28a4e], [BOX, [0, 0.22, 0], [0.46, 0.06, 0.46], 0x8a5a30], [BOX, [0, 0.22, 0], [0.06, 0.46, 0.46], 0x8a5a30]]); },
    chest: () => { const { BOX, CYL } = prims(); return bake([[BOX, [0, 0.17, 0], [0.62, 0.34, 0.4], 0x9a5b2e], [CYL, [0, 0.34, 0], [0.2, 0.62, 0.2], 0xa86532, [0, 0, X]],
      [BOX, [-0.2, 0.2, 0], [0.06, 0.42, 0.42], 0xe0b33c], [BOX, [0.2, 0.2, 0], [0.06, 0.42, 0.42], 0xe0b33c], [BOX, [0, 0.3, 0.205], [0.1, 0.12, 0.04], 0xf2cf52]]); },
    key: () => { const { TOR, CYL, BOX } = prims(); return bake([[TOR, [-0.17, 0.1, 0], [0.09, 0.09, 0.09], 0xf2c230, [X, 0, 0]], [CYL, [0.04, 0.1, 0], [0.025, 0.32, 0.025], 0xf2c230, [0, 0, X]],
      [BOX, [0.16, 0.06, 0], [0.035, 0.07, 0.03], 0xe0ac1c], [BOX, [0.1, 0.065, 0], [0.035, 0.06, 0.03], 0xe0ac1c]]); },
    shovel: () => { const { CYL, BOX } = prims(); return bake([[CYL, [0, 0.04, -0.1], [0.028, 0.9, 0.028], 0x9a6a3c, [X, 0, 0]], [BOX, [0, 0.04, -0.58], [0.16, 0.05, 0.05], 0x6a4a2c],
      [BOX, [0, 0.03, 0.47], [0.22, 0.03, 0.28], 0x9aa3ad], [CYL, [0, 0.04, 0.34], [0.035, 0.08, 0.035], 0x6a6f76, [X, 0, 0]]]); },
    note: () => { const { BOX } = prims(); return bake([[BOX, [0, 0.01, 0], [0.3, 0.018, 0.22], 0xfbf7ea], [BOX, [0, 0.021, 0], [0.3, 0.004, 0.012], 0xd96a5a]]); },
  };
  const PROPS = [];
  let pid = 0;
  function propSet(p) { const P0 = pool('prop:' + p.kind, PROP_GEO[p.kind], lamV, 8);
    P0.m.setMatrixAt(p.i, p.vis ? _m4.compose(_v.set(p.x, p.y + p.dy, p.z), _q.setFromEuler(_e.set(p.tilt || 0, -p.h * R2D + Math.PI, 0)), _s.set(p.s, p.s, p.s)) : ZERO); P0.m.instanceMatrix.needsUpdate = true; }
  const prop = {
    kinds: Object.keys(PROP_GEO),
    // 소품 하나 — kind = box|chest|key|shovel|note · o = { h(방위°), s(크기), rise(초 — 땅에서 올라옴), tilt } → { id, kind, x,y,z, set(x,y,z,h), show(), hide(), remove() }
    spawn(kind, x, y, z, o = {}) {
      if (!PROP_GEO[kind]) { console.warn('[engine] prop: 모르는 종류', kind); return null; }
      const P0 = pool('prop:' + kind, PROP_GEO[kind], lamV, 8), i = slot(P0); if (i < 0) { console.warn('[engine] prop: ' + kind + ' 8개 초과'); return null; }
      const p = { id: ++pid, kind, i, x, y: y ?? floorY(x, z), z, h: o.h || 0, s: o.s || 1, tilt: o.tilt || 0, dy: 0.02, vis: true, rise: o.rise || 0, riseT: 0, held: false, pickHot: null,
        set(nx, ny, nz, nh) { p.x = nx; p.y = ny ?? floorY(nx, nz); p.z = nz; if (nh != null) p.h = nh; propSet(p); if (p.pickHot) { p.pickHot.x = p.x; p.pickHot.y = p.y; p.pickHot.z = p.z; } },
        show() { p.vis = true; propSet(p); if (p.pickHot) p.pickHot.off = !!carried; }, hide() { p.vis = false; propSet(p); if (p.pickHot) p.pickHot.off = true; },
        remove() { if (carried === p) { carried = null; CTRL.hold = false; } p.vis = false; propSet(p); P0.used[p.i] = null; psync(P0); if (p.pickH) p.pickH.remove(); const k = PROPS.indexOf(p); if (k >= 0) PROPS.splice(k, 1); } };
      P0.used[i] = p; psync(P0); if (p.rise) { p.dy = -0.5; p.riseT = p.rise; } PROPS.push(p); propSet(p); return p;
    },
    list: () => PROPS.slice(),
  };

  // ---------- 6. 들기·놓기(내 캐릭터 두 손 앞 = 식판 자리 kid tray) ----------
  let carried = null; const TARGETS = [];
  const accepts = (t, p) => !t.accept || (typeof t.accept === 'function' ? t.accept(p) : [].concat(t.accept).includes(p.kind));
  function carrySync() {
    for (const p of PROPS) if (p.pickHot) p.pickHot.off = !!carried || !p.vis;
    for (const t of TARGETS) t.hot.off = !(carried && !t.placed && accepts(t, carried));
    CTRL.hold = !!carried; emit('carry', { prop: carried });
  }
  const carry = {
    // 들 수 있게: 소품 둘레에 '✋ 들기' 지점 — o = { label, onPick(prop) } → { remove }
    pickable(p, o = {}) {
      if (!p) return { remove() {} };
      const ih = interactAdd({ x: p.x, y: p.y, z: p.z, r: o.r ?? 1.1, label: o.label || '✋ 들기', use: () => { carry.pick(p); if (o.onPick) o.onPick(p); } });
      p.pickHot = ih.hot; p.pickH = { remove() { ih.remove(); p.pickHot = null; p.pickH = null; } }; carrySync();
      const hnd = own({ remove() { if (p.pickH) p.pickH.remove(); disown(hnd); } }); return hnd;
    },
    pick(p) { if (!p || hidden) return false; if (carried) carry.drop(); carried = p; p.held = true; sfx('pick'); carrySync(); return true; },
    held: () => carried,
    // 내려놓기: 앞 0.7m 바닥(또는 가까운 놓는 자리가 받으면 그 자리에). 행동(E·✋)을 할 것이 없는 곳에서 누르면 내려놓는다(main.js idleAct)
    drop() {
      const p = carried; if (!p) return null;
      for (const t of TARGETS) if (!t.placed && accepts(t, p) && Math.hypot(P.x - t.x, P.z - t.z) < t.r + 0.3) { carry.place(t); return p; }
      carried = null; p.held = false; const yaw = pgYaw(), x = P.x + Math.sin(yaw) * 0.7, z = P.z + Math.cos(yaw) * 0.7;
      const e = q.blockedAt(x, z, P.y) ? { x: P.x, z: P.z } : { x, z };
      p.tilt = 0; p.set(e.x, q.groundAt(e.x, e.z, P.y + 0.3), e.z, hdg(Math.sin(yaw), Math.cos(yaw))); carrySync(); return p;
    },
    // 놓는 자리 — o = { x, z, y?, r(1.2), accept: 종류|[종류]|fn, label('📦 놓기'), onPlace(prop, target) } → { remove, placed }
    target(o) {
      const t = { x: o.x, y: o.y ?? floorY(o.x, o.z), z: o.z, r: o.r ?? 1.2, accept: o.accept, onPlace: o.onPlace, placed: null };
      const ih = interactAdd({ x: t.x, y: t.y, z: t.z, r: t.r, label: o.label || '📦 놓기', use: () => { if (carried && accepts(t, carried)) carry.place(t); } });
      t.hot = ih.hot; TARGETS.push(t); carrySync();
      const hnd = own({ get placed() { return t.placed; }, remove() { ih.remove(); const i = TARGETS.indexOf(t); if (i >= 0) TARGETS.splice(i, 1); disown(hnd); } }); return hnd;
    },
    place(t) { const p = carried; if (!p) return false; carried = null; p.held = false; p.tilt = 0; p.set(t.x, t.y, t.z); t.placed = p; carrySync(); sfx('ding'); emit('place', { prop: p });
      if (t.onPlace) { try { t.onPlace(p, t); } catch (e) { console.error(e); } } return true; },
  };
  const pgYaw = () => kid.pg.rotation.y;
  function carryTick() {
    const p = carried; if (!p) return;
    const yaw = pgYaw(), f = kid.KID.tray[1] + 0.05, y = P.y + kid.KID.tray[0] - (CTRL.crouched ? 0.2 : 0) - 0.12;
    p.x = P.x + Math.sin(yaw) * f; p.y = y; p.z = P.z + Math.cos(yaw) * f; p.h = hdg(Math.sin(yaw), Math.cos(yaw)); p.dy = 0; p.vis = !hidden; propSet(p);
  }

  // ---------- 7. 파기(모래·흙·풀 구역) ----------
  const DIG_KINDS = ['field', 'play', 'garden', 'yard'];
  const DIGS = []; let digging = null, dirtN = 0;
  const dirt = { px: new Float32Array(48), py: new Float32Array(48), pz: new Float32Array(48), vx: new Float32Array(48), vy: new Float32Array(48), vz: new Float32Array(48), life: new Float32Array(48), k: 0 };
  function dirtBurst(x, y, z, n) {
    const P0 = pool('dirt', () => new THREE.BoxGeometry(0.07, 0.07, 0.07), () => new THREE.MeshLambertMaterial({ color: 0x8a6a48 }), 48); P0.m.count = 48; P0.m.visible = true;
    for (let j = 0; j < n; j++) { const i = dirt.k++ % 48, a = Math.random() * Math.PI * 2, s = 0.8 + Math.random() * 1.4;
      dirt.px[i] = x; dirt.py[i] = y + 0.05; dirt.pz[i] = z; dirt.vx[i] = Math.cos(a) * s; dirt.vz[i] = Math.sin(a) * s; dirt.vy[i] = 2.2 + Math.random() * 1.6; dirt.life[i] = 0.7; }
    dirtN = 48;
  }
  function dirtTick(dt) {
    if (!dirtN) return; const P0 = POOLS.get('dirt'); if (!P0) { dirtN = 0; return; } let alive = 0;
    for (let i = 0; i < 48; i++) { if (dirt.life[i] <= 0) { P0.m.setMatrixAt(i, ZERO); continue; } dirt.life[i] -= dt; alive++;
      dirt.vy[i] -= 9.8 * dt; dirt.px[i] += dirt.vx[i] * dt; dirt.py[i] += dirt.vy[i] * dt; dirt.pz[i] += dirt.vz[i] * dt;
      P0.m.setMatrixAt(i, dirt.life[i] > 0 ? _m4.compose(_v.set(dirt.px[i], dirt.py[i], dirt.pz[i]), _q.setFromEuler(_e.set(dirt.life[i] * 7, dirt.life[i] * 5, 0)), _s.set(1, 1, 1)) : ZERO); }
    P0.m.instanceMatrix.needsUpdate = true; if (!alive) { dirtN = 0; P0.m.count = 0; P0.m.visible = false; }
  }
  function holeAt(x, y, z, r) { const P0 = pool('hole', () => new THREE.CircleGeometry(1, 16).rotateX(-X), () => new THREE.MeshBasicMaterial({ color: 0x5a4030, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 8);
    const i = slot(P0); if (i < 0) return; P0.used[i] = true; psync(P0); P0.m.setMatrixAt(i, _m4.compose(_v.set(x, y + 0.04, z), _q.identity(), _s.set(r, 1, r))); P0.m.instanceMatrix.needsUpdate = true; P0.m.renderOrder = 1; }
  const story = {};   // 아래 §8에서 채운다(dig need가 가방을 본다)
  const dig = {
    diggable(x, z, y) { const zn = zoneAt(x, y ?? floorY(x, z), z); return !!zn && !zn.indoor && DIG_KINDS.includes(zn.kind); },
    // 파는 자리 — o = { x, z, radius(1.2), reveal: 'chest'|{kind,h,s}|fn(x,y,z) → prop, need(가방 물건 id 또는 들고 있는 소품 종류), needLabel, label('⛏ 파기'), onReveal(prop) } → { remove, dug }
    add(o) {
      const y = floorY(o.x, o.z);
      if (!dig.diggable(o.x, o.z, y)) { console.warn('[engine] dig.add: 모래·흙·풀 구역이 아니에요', o.x, o.z, (zoneAt(o.x, y, o.z) || {}).kind); return { remove() {}, dug: false }; }
      const d = { x: o.x, y, z: o.z, r: o.radius ?? 1.2, o, dug: false };
      const ih = interactAdd({ x: d.x, y: d.y, z: d.z, r: d.r, label: o.label || '⛏ 파기', use: () => {
        if (digging || d.dug) return;
        if (o.need && !story.has(o.need) && !(carried && carried.kind === o.need)) { ui.toast('🔒 ' + (o.needLabel || o.need) + ' 이(가) 있어야 팔 수 있어요'); sfx('buzz'); return; }
        digging = { d, t: 0, was: CTRL.frozen, k: 0 }; CTRL.frozen = true; CTRL.pose = 'dig'; H.face(hdg(d.x - P.x, d.z - P.z)); } });
      d.hot = ih.hot; DIGS.push(d);
      const hnd = own({ get dug() { return d.dug; }, remove() { ih.remove(); const i = DIGS.indexOf(d); if (i >= 0) DIGS.splice(i, 1); disown(hnd); } }); return hnd;
    },
  };
  function digTick(dt) {
    const g = digging; if (!g) return; g.t += dt;
    if (g.t > g.k * 0.22 && g.k < 6) { g.k++; dirtBurst(g.d.x, g.d.y, g.d.z, 5); if (ui.tone) ui.tone(150 + Math.random() * 40, 0, 0.09, 'triangle', 0.12, 90); }
    if (g.t < 1.35) return;
    digging = null; CTRL.pose = null; CTRL.frozen = g.was; const d = g.d; d.dug = true; d.hot.off = true;
    holeAt(d.x, d.y, d.z, 0.55); dirtBurst(d.x, d.y, d.z, 10);
    const rv = d.o.reveal; let p = null;
    if (typeof rv === 'function') p = rv(d.x, d.y, d.z);
    else if (rv) { const r = typeof rv === 'string' ? { kind: rv } : rv; p = prop.spawn(r.kind, d.x, d.y, d.z, { h: r.h ?? hdg(P.x - d.x, P.z - d.z), s: r.s, rise: 0.7 }); }
    sfx('ding'); emit('dig', { x: d.x, z: d.z, prop: p });
    if (d.o.onReveal) { try { d.o.onReveal(p); } catch (e) { console.error(e); } }
  }
  function propTick(dt) { for (const p of PROPS) if (p.riseT > 0) { p.riseT = Math.max(0, p.riseT - dt); p.dy = 0.02 - 0.52 * (p.riseT / p.rise) * (p.riseT / p.rise); propSet(p); } }

  // ---------- 8. 이야기 상태(기억 표시·가방·장) + 이야기 파일 실행기 ----------
  const ST = { flags: new Map(), inv: [], chapter: null, lis: new Set() };
  let invEl = null;
  function invDraw() {
    if (!ST.inv.length) { if (invEl) invEl.style.display = 'none'; return; }
    if (!invEl) invEl = div('eng-inv'); invEl.style.display = 'flex'; invEl.textContent = '';
    for (const it of ST.inv) { const s = document.createElement('span'); s.textContent = it.icon || '🎒'; s.title = it.label || it.id; invEl.appendChild(s); }
  }
  const changed = (type, data) => { emit('story', { type, ...data }); for (const fn of [...ST.lis]) { try { fn(type, data); } catch (e) { console.error(e); } } for (const r of RUNNERS) r.poke(); };
  Object.assign(story, {
    flag(k, v) { if (v === undefined) return ST.flags.get(k) ?? false; if (ST.flags.get(k) === v) return v; ST.flags.set(k, v); changed('flag', { k, v }); return v; },
    flags: () => Object.fromEntries(ST.flags),
    give(id, o = {}) { if (story.has(id)) return false; ST.inv.push({ id, icon: o.icon || '🎒', label: o.label || id }); invDraw(); sfx('pick'); changed('inv', { id, on: true }); return true; },
    take(id) { const i = ST.inv.findIndex(it => it.id === id); if (i < 0) return false; ST.inv.splice(i, 1); invDraw(); changed('inv', { id, on: false }); return true; },
    has: id => ST.inv.some(it => it.id === id),
    inv: () => ST.inv.map(it => ({ ...it })),
    chapter(n) { if (n === undefined) return ST.chapter; if (ST.chapter === n) return n; const prev = ST.chapter; ST.chapter = n; changed('chapter', { n, prev }); emit('chapter', { n, prev }); return n; },
    // 바뀜 알림: fn(type 'flag'|'inv'|'chapter', data) → off
    on(fn) { ST.lis.add(fn); return () => ST.lis.delete(fn); },
    onChapter(fn) { const f = (t, d) => { if (t === 'chapter') fn(d.n, d.prev); }; ST.lis.add(f); return () => ST.lis.delete(f); },
    run: (scenes, o) => runStory(scenes, o),
  });
  // 조건: when = { flags: {k: true|false} | ['k', '!k'], has: ['id'], chapter } — 빈 조건 = 처음부터
  function whenOK(w) {
    if (!w) return true;
    if (w.flags) { if (Array.isArray(w.flags)) { for (const f of w.flags) { const neg = f[0] === '!', k = neg ? f.slice(1) : f; if (!!story.flag(k) === neg) return false; } }
      else for (const k in w.flags) if (!!story.flag(k) !== !!w.flags[k]) return false; }
    if (w.has) for (const id of [].concat(w.has)) if (!story.has(id)) return false;
    if (w.chapter !== undefined && ST.chapter !== w.chapter) return false;
    return true;
  }
  const RUNNERS = [];
  let fadeEl = null, time0 = null, GEN = 0;   // GEN: reset마다 +1 — 멈춘 판의 fade 약속은 풀지 않는다
  // 시간대(낮·노을·밤) — 게임이 바꾸면 멈출 때 원래대로(reset)
  function setTime(k) { if (!ui.setTime) return; if (time0 == null && ui.getTime) time0 = ui.getTime(); ui.setTime(k); }
  function fade(sec = 1, color = '#000', mid) {
    if (!fadeEl) fadeEl = div('eng-fade');
    const g0 = GEN;
    return new Promise(res => { const half = Math.max(0.1, sec / 2); fadeEl.style.background = color; fadeEl.style.transition = 'opacity ' + half + 's linear'; fadeEl.style.display = 'block'; void fadeEl.offsetWidth; fadeEl.style.opacity = '1';
      setTimeout(async () => { if (g0 !== GEN) return; if (mid) { try { await mid(); } catch (e) { console.error(e); } } if (g0 !== GEN || !fadeEl) return; fadeEl.style.opacity = '0'; setTimeout(() => { if (g0 !== GEN) return; if (fadeEl) fadeEl.style.display = 'none'; res(); }, half * 1000); }, half * 1000); });
  }
  // 이야기 파일 실행기: scenes = [{ id, when, do:[{op,…}], once(true) }] — 기억·가방·장이 바뀔 때마다 조건을 보고, 맞는 장면을 차례로(한 번에 하나) 실행
  //   op: note{title,body} · show{id, kind?, at?, h?, pick?} · hide{id} · moveNpc{name,to,pose,face,walk,wait} · hideNpc/showNpc/homeNpc{name} · light{room,on} · door{door,state} · spawn{id,kind,at,…} · paint{target,…}(§16) · time{k} · lockDoor/unlockDoor{door|near:[x,z]} ·
  //       flag{k,v} · give{item,icon,label} · take{item} · fade{sec,color} · sound{sfx|tone} · chapter{n} · wait{sec} · toast{text}
  //   o = { ents: {이름: {show(),hide()}}, onDone(), onOp(op) } → { remove, fired:Set, ent(name,obj), poke(), get busy }
  function runStory(scenes, o = {}) {
    const R = { scenes: scenes || [], fired: new Set(), ents: new Map(Object.entries(o.ents || {})), busy: false, dead: false, pend: false, log: [] };
    const doOp = async op => {
      if (R.dead) return; R.log.push(op.op); if (o.onOp) { try { o.onOp(op); } catch (e) { console.error(e); } }
      switch (op.op) {
        case 'note': await note(op.title, op.body); break;
        case 'show': { let e = R.ents.get(op.id);
          if (!e && op.kind) { const at = op.at || [P.x, P.z], p = prop.spawn(op.kind, at[0], at.length > 2 ? at[1] : undefined, at.length > 2 ? at[2] : at[1], { h: op.h, rise: op.rise }); if (p) { if (op.pick) carry.pickable(p); e = p; R.ents.set(op.id, p); } }
          if (e && e.show) e.show(); else if (!e) console.warn('[story] show: 모르는 것', op.id); break; }
        case 'hide': { const e = R.ents.get(op.id); if (e && e.hide) e.hide(); else console.warn('[story] hide: 모르는 것', op.id); break; }
        case 'moveNpc': case 'hideNpc': case 'showNpc': case 'homeNpc': case 'light': case 'door': case 'spawn': case 'paint': {   // NPC-MOVE·WORLD-FX(found2): worldfx.js(§16)가 한다 — wait:true면 걸어가 도착할 때까지 기다림
          const r = H.fxOp ? H.fxOp(op) : (console.warn('[story] ' + op.op + ': 세상 바꾸기 모듈 없음'), null); if (r && typeof r.then === 'function') await r; break; }
        case 'time': setTime(op.k); break;
        case 'lockDoor': door.lock(op.door ?? op.near, true, op); break;
        case 'unlockDoor': door.lock(op.door ?? op.near, false); break;
        case 'flag': story.flag(op.k, op.v === undefined ? true : op.v); break;
        case 'give': story.give(op.item, { icon: op.icon, label: op.label }); break;
        case 'take': story.take(op.item); break;
        case 'fade': await fade(op.sec ?? 1, op.color); break;
        case 'sound': if (op.sfx) sfx(op.sfx); if (op.tone && ui.tone) for (const t of op.tone) ui.tone(...t); break;
        case 'chapter': story.chapter(op.n); break;
        case 'wait': await new Promise(r => setTimeout(r, (op.sec || 0) * 1000)); break;
        case 'toast': ui.toast(op.text || '', op.sec || 2.2); break;
        default: console.warn('[story] 모르는 동사', op.op);
      }
    };
    async function pump() {
      if (R.busy || R.dead) { R.pend = true; return; } R.busy = true;
      try {
        for (let guard = 0; guard < 64 && !R.dead; guard++) {
          R.pend = false; const sc = R.scenes.find(s => !(s.once !== false && R.fired.has(s.id)) && !(s.once === false && s._run) && whenOK(s.when));
          if (!sc) break; R.fired.add(sc.id); sc._run = true; emit('scene', { id: sc.id });
          for (const op of sc.do || []) { if (R.dead) break; await doOp(op); }
          sc._run = false; if (sc.once === false) break;
        }
      } catch (e) { console.error('[story] 실행 오류', e); }
      R.busy = false;
      if (!R.dead && R.scenes.every(s => s.once === false || R.fired.has(s.id)) && !R.doneCalled) { R.doneCalled = true; if (o.onDone) { try { o.onDone(); } catch (e) { console.error(e); } } }
      else if (R.pend && !R.dead) queueMicrotask(pump);
    }
    const hnd = { fired: R.fired, log: R.log, ent(name, obj) { R.ents.set(name, obj); return obj; }, poke() { if (!R.dead) queueMicrotask(pump); }, get busy() { return R.busy; },
      remove() { R.dead = true; const i = RUNNERS.indexOf(hnd); if (i >= 0) RUNNERS.splice(i, 1); disown(hnd); } };
    RUNNERS.push(hnd); own(hnd); hnd.poke(); return hnd;
  }

  // ---------- 9. 문 잠그기(문 61개 재사용) — 문짝은 닫힌 채 · 몸 막는 충돌 + 길격자 막기 · '🔒 잠겨 있어요' 지점 ----------
  const LOCKS = new Map();
  const doorIndex = t => { if (typeof t === 'number') return t; if (Array.isArray(t)) { let b = -1, bd = 1e9; world.doors.forEach((d, i) => { const dd = Math.hypot(d.cx - t[0], d.cz - t[1]) + (t.length > 2 ? Math.abs(d.y0 - t[2]) : 0); if (dd < bd) { bd = dd; b = i; } }); return bd < 6 ? b : -1; } return -1; };
  const door = {
    find: (x, z, y) => doorIndex(y == null ? [x, z] : [x, z, y]),
    locked: t => LOCKS.has(doorIndex(t)),
    // lock(문 번호 | [x,z] | [x,z,y], on, { hot:false = '🔒 잠긴 문' 지점 없이(게임이 따로 '열쇠로 열기'를 둘 때) })
    lock(t, on = true, o = {}) {
      const n = doorIndex(t), d = world.doors[n]; if (!d) { console.warn('[engine] door: 문을 못 찾음', t); return false; }
      if (!on) { const L = LOCKS.get(n); if (!L) return false; LOCKS.delete(n); L.col.remove(); if (L.nb) L.nb.remove(); for (const h of L.ih) h.remove(); doorLock(n, false); emit('door', { n, locked: false }); sfx('ding'); return true; }
      if (LOCKS.has(n)) return true;
      const hw = d.w / 2, X9 = d.ax === 'x', b = X9 ? { x0: d.cx - hw, x1: d.cx + hw, z0: d.cz - 0.15, z1: d.cz + 0.15 } : { x0: d.cx - 0.15, x1: d.cx + 0.15, z0: d.cz - hw, z1: d.cz + hw };
      const col = colliderAdd({ ...b, y0: d.y0, y1: d.y0 + (d.dh ?? 2.6) });
      const N = navDone(), nb = N ? N.block([b.x0 - 0.3, b.z0 - 0.3, b.x1 + 0.3, b.z1 + 0.3]) : null;
      const off = X9 ? [0, 0.7] : [0.7, 0], ih = [];
      if (o.hot !== false) for (const sd of [-1, 1]) ih.push(interactAdd({ x: d.cx + off[0] * sd, y: d.y0, z: d.cz + off[1] * sd, r: 1.2, label: '🔒 잠긴 문', use: () => { sfx('buzz'); ui.toast('🔒 문이 잠겨 있어요'); } }));   // 문 양쪽
      LOCKS.set(n, { col, nb, ih }); doorLock(n, true); emit('door', { n, locked: true }); return true;
    },
  };

  // ---------- 10. 쫓는 것 — 장난감 로봇 · 장난감 유령(동그란 천) · 순찰 로봇(이름 없는 역할) · 풀 3 ----------
  //   순찰 → (소리) 수상함 → (시야) 쫓기 → 놓치면 마지막 본 곳 뒤지기(숨는 자리 앞 2초 — 들어가는 걸 봤으면 찾음) → 포기 → 순찰
  //   잡으면 = onCatch(chaser)(게임이 정함) · 없으면 '딩동' + 출발점(home)으로 · 벌·체력 없음
  const CH_GEO = {
    robot: () => { const { SPH, SPHS, CYL } = prims(); return bake([
      [SPH, [0, 0.4, 0], [0.3, 0.29, 0.27], 0xf6f8fb], [SPHS, [0, 0.38, 0.17], [0.18, 0.15, 0.11], 0xe3ebf3],
      [SPH, [0, 0.86, 0], [0.31, 0.28, 0.29], 0xf6f8fb], [SPHS, [0, 0.86, 0.13], [0.23, 0.16, 0.17], 0x243249],
      [SPHS, [-0.085, 0.88, 0.285], [0.042, 0.054, 0.02], 0x9ff4ff], [SPHS, [0.085, 0.88, 0.285], [0.042, 0.054, 0.02], 0x9ff4ff],
      [CYL, [0, 1.19, 0], [0.014, 0.14, 0.014], 0x9aa3ad], [SPHS, [0, 1.28, 0], [0.05, 0.05, 0.05], 0xff7b7b],
      [SPHS, [-0.32, 0.42, 0.03], [0.08, 0.1, 0.08], 0xdfe6ee], [SPHS, [0.32, 0.42, 0.03], [0.08, 0.1, 0.08], 0xdfe6ee],
      [SPHS, [-0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270], [SPHS, [0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270]]); },
    patrol: () => { const { SPH, SPHS, CYL, DOME } = prims(); return bake([
      [SPH, [0, 0.4, 0], [0.3, 0.29, 0.27], 0xeef2f6], [SPHS, [0, 0.38, 0.17], [0.18, 0.15, 0.11], 0xffb35c],
      [SPH, [0, 0.86, 0], [0.31, 0.28, 0.29], 0xeef2f6], [SPHS, [0, 0.85, 0.13], [0.23, 0.15, 0.17], 0x243249],
      [SPHS, [-0.085, 0.87, 0.285], [0.045, 0.05, 0.02], 0xffe08a], [SPHS, [0.085, 0.87, 0.285], [0.045, 0.05, 0.02], 0xffe08a],
      [DOME, [0, 0.97, -0.01], [0.32, 0.2, 0.31], 0x2f6fd0, [-0.1, 0, 0]], [CYL, [0, 1.0, 0.22], [0.18, 0.02, 0.12], 0x285fb4, [0.2, 0, 0]], [SPHS, [0, 1.13, 0.2], [0.05, 0.05, 0.02], 0xffd23c],
      [CYL, [-0.32, 0.45, 0.03], [0.09, 0.1, 0.09], 0xff8a3d], [SPHS, [0.32, 0.42, 0.03], [0.08, 0.1, 0.08], 0xdfe6ee], [SPHS, [-0.32, 0.36, 0.05], [0.07, 0.07, 0.07], 0xdfe6ee],
      [SPHS, [-0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x3d4656], [SPHS, [0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x3d4656]]); },
    ghost: () => { const { SPH, SPHS, CONE } = prims(); const parts = [[SPH, [0, 1.0, 0], [0.38, 0.38, 0.36], 0xfbfcff], [CONE, [0, 0.62, 0], [0.4, 0.72, 0.38], 0xf4f6fb],
      [SPHS, [-0.12, 1.02, 0.31], [0.055, 0.075, 0.03], 0x2d2a33], [SPHS, [0.12, 1.02, 0.31], [0.055, 0.075, 0.03], 0x2d2a33], [SPHS, [0, 0.9, 0.34], [0.05, 0.03, 0.02], 0x6a4a5a],
      [SPHS, [-0.2, 0.93, 0.27], [0.05, 0.03, 0.02], 0xf6b9c8], [SPHS, [0.2, 0.93, 0.27], [0.05, 0.03, 0.02], 0xf6b9c8]];
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; parts.push([SPHS, [Math.cos(a) * 0.36, 0.28, Math.sin(a) * 0.34], [0.1, 0.09, 0.1], 0xf4f6fb]); }
      return bake(parts); },
  };
  const CH = [];
  const HEAR = [0, 2.2, 6.5, 13];   // 소리 0~3을 듣는 거리(m) — × hear
  let chId = 0, planned = false;
  const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
  function chIn(c, x, y, z) { if (!c.zone) return true; if (c.zone.rect) return inRect(c.zone.rect, x, z); const zn = zoneAt(x, y, z); return !!zn && c.zone.ids.includes(zn.id); }
  const chaser = {
    // o = { kind:'robot'|'ghost'|'patrol', at:[x,z]|[x,y,z]|'poi', path:[[x,z]…](순찰 경로 — 돌아감) | zone:'id'|['id',…]|{rect:[x0,z0,x1,z1]}(그 안을 돌아다님),
    //       speed(1.5 걷기 m/s), chase(3.3 쫓기), fov(100°), range(8m), hear(1 — 소리 듣는 거리 배수), home(잡혔을 때 돌아갈 자리), onCatch(chaser), showFov(true) }
    spawn(o = {}) {
      if (CH.filter(c => c.alive).length >= 3) { console.warn('[engine] chaser: 한 번에 3개까지'); return null; }
      const kind = CH_GEO[o.kind] ? o.kind : 'robot', P0 = pool('ch:' + kind, CH_GEO[kind], () => kind === 'ghost' ? lamV({ transparent: true, opacity: 0.8, depthWrite: false, emissive: 0x3a3f4a }) : lamV(), 3);
      const i = slot(P0); if (i < 0) return null;
      const at = o.at ? H.resolve(o.at) : o.path ? H.resolve(o.path[0]) : { x: P.x + 5, y: P.y, z: P.z };
      let zone = null;
      if (o.zone) zone = o.zone.rect ? { rect: o.zone.rect } : { ids: [].concat(o.zone).map(k => (zoneFind(k) || {}).id).filter(Boolean) };
      const c = { id: ++chId, kind, i, pool: P0, x: at.x, y: at.y, z: at.z, yaw: 0, st: 'patrol', t: 0, pts: null, pi: 0, think: 0, speed: o.speed ?? 1.5, chaseSp: o.chase ?? 3.3, fov: o.fov ?? 100, range: o.range ?? 8, hear: o.hear ?? 1,
        path: o.path ? o.path.map(p => H.resolve(p)).filter(Boolean) : null, pk: 0, zone, home: o.home ?? [P.x, P.y, P.z], onCatch: o.onCatch, alive: true, sawT: -9, lost: 0, last: { x: 0, y: 0, z: 0 }, goal: null, spot: null, cool: 0, bob: Math.random() * 6,
        look: 0, lookT: 0, fan: null, bub: null, bubShown: '', catches: 0 };
      P0.used[i] = c; psync(P0);
      if (o.showFov !== false) {   // 바닥에 옅은 시야 부채꼴(술래마다 메시 하나 — 모양이 fov·range마다 다르다)
        const seg = 14, a0 = -c.fov / 2 * R2D, pos = [0, 0, 0], idx = [];
        for (let k = 0; k <= seg; k++) { const a = a0 + (c.fov * R2D) * k / seg; pos.push(Math.sin(a) * c.range, 0, Math.cos(a) * c.range); if (k) idx.push(0, k, k + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        c.fan = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
        c.fan.renderOrder = 2; c.fan.frustumCulled = false; scene.add(c.fan);
      }
      c.bub = div('eng-bub'); CH.push(c);
      const hnd = own({ id: c.id, get state() { return c.st; }, get pos() { return { x: c.x, y: c.y, z: c.z, h: hdg(Math.sin(c.yaw), Math.cos(c.yaw)) }; }, get catches() { return c.catches; }, raw: c,
        setPath(p) { c.path = p.map(x => H.resolve(x)).filter(Boolean); c.pk = 0; c.pts = null; }, pause(on) { c.paused = !!on; },
        // 숨바꼭질(GAME-HS): 이 숨는 자리를 지금 뒤지게 한다(그 앞에 가서 2초) — 게임이 고른 자리를 '확인'하는 술래. 거기 숨어 있으면 들어가는 걸 못 봤어도 찾는다
        inspect(s) { if (!s || !s.stand || !c.alive) return false; c.spot = s; setSt(c, 'searchSpot'); c.inspect = s; return true; },
        remove() { chRemove(c); disown(hnd); } });
      return hnd;
    },
    list: () => CH.filter(c => c.alive).map(c => ({ id: c.id, kind: c.kind, st: c.st, x: c.x, y: c.y, z: c.z })),
  };
  function chRemove(c) { if (!c.alive) return; c.alive = false; c.pool.m.setMatrixAt(c.i, ZERO); c.pool.m.instanceMatrix.needsUpdate = true; c.pool.used[c.i] = null; psync(c.pool);
    if (c.fan) { scene.remove(c.fan); c.fan.geometry.dispose(); c.fan.material.dispose(); c.fan = null; } if (c.bub) { c.bub.remove(); c.bub = null; } const k = CH.indexOf(c); if (k >= 0) CH.splice(k, 1); }
  function setSt(c, st, t = 0) { if (c.st === st) return; c.st = st; c.t = t; c.pts = null; c.think = 0; c.inspect = null; emit('chaser', { id: c.id, state: st }); }
  // 길: 한 프레임에 술래 하나만(maxExp 4000 — 물총 로봇과 같은 식). 못 찾으면 가까우면 곧장
  //   돌려줌: 1 길 있음 · 0 못 찾음 · -1 이번 프레임은 다른 술래 차례(다음 프레임에 다시)
  function planTo(c, x, y, z) {
    if (planned) return -1; planned = true;
    const N = navDone(); c.think = 0.6;
    if (N) { const r = N.path([c.x, c.y, c.z], [x, y, z], { maxExp: 4000 }); if (r.ok && r.pts.length > 1) { c.pts = r.pts; c.pi = 1; return 1; } }
    if (Math.hypot(x - c.x, z - c.z) < 3) { c.pts = [[c.x, c.y, c.z], [x, y, z]]; c.pi = 1; return 1; }
    c.pts = null; return 0;
  }
  function wanderGoal(c) {
    const N = navDone(); if (!N) return null;
    for (let k = 0; k < 8; k++) { const a = Math.random() * Math.PI * 2, d = 3 + Math.random() * 8, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d, i = N.snap(x, c.y, z, 1.5);
      if (i < 0) continue; const p = N.pos(i); if (chIn(c, p[0], p[1], p[2])) return p; }
    return null;
  }
  function moveAlong(c, dt, sp) {
    if (!c.pts || c.pi >= c.pts.length) return true;
    const p = c.pts[c.pi], ex = p[0] - c.x, ez = p[2] - c.z, d = Math.hypot(ex, ez), s = sp * dt;
    if (d <= s) { c.x = p[0]; c.z = p[2]; c.y = p[1]; c.pi++; return c.pi >= c.pts.length; }
    c.x += ex / d * s; c.z += ez / d * s; c.y += (p[1] - c.y) * Math.min(1, dt * 6); turn(c, Math.atan2(ex, ez), dt * 7); return false;
  }
  function turn(c, want, k) { let dy = want - c.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; c.yaw += dy * Math.min(1, k); }
  function caught(c) {
    c.catches++; c.cool = 3; setSt(c, 'giveup', 0); sfx('ding'); if (ui.tone) { ui.tone(784, 0, 0.25, 'sine', 0.2); ui.tone(622, 0.22, 0.4, 'sine', 0.2); }   // 딩동
    emit('caught', { id: c.id });
    if (hidden) hide.exit();
    if (c.onCatch) { try { c.onCatch(chaserView(c)); } catch (e) { console.error(e); } }
    else { if (c.home) teleport(c.home); ui.toast('🔔 딩동! 잡혔어요 — 처음 자리에서 다시'); }
  }
  const chaserView = c => ({ id: c.id, kind: c.kind, x: c.x, y: c.y, z: c.z, state: c.st });
  const eyeY = c => c.y + (c.kind === 'ghost' ? 1.1 : 0.9), EYE_O = { x: 0, y: 0, z: 0, h: 0 };   // 감지용 스크래치(새 객체 없음)
  // 10Hz 감지(시야·소리)
  function chSense() {
    const n = player.noise();
    for (const c of CH) {
      if (!c.alive || c.paused) continue;
      if (c.cool > 0) continue;
      const pIn = chIn(c, P.x, P.y, P.z), dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz);
      EYE_O.x = c.x; EYE_O.y = eyeY(c); EYE_O.z = c.z; EYE_O.h = hdg(Math.sin(c.yaw), Math.cos(c.yaw));
      const seen = pIn && see(EYE_O, 'player', c.fov, c.range);
      if (seen) { c.sawT = T; c.last.x = P.x; c.last.y = P.y; c.last.z = P.z; c.lost = 0;
        if (c.st !== 'chase') { setSt(c, 'chase'); if (ui.tone) { ui.tone(880, 0, 0.1, 'square', 0.05); ui.tone(1175, 0.09, 0.16, 'square', 0.05); } }   // '앗!' 삐빅
        if (d < 0.95 && Math.abs(P.y - c.y) < 1.2) { caught(c); continue; } continue; }
      if (c.st === 'chase') {
        if (hidden && hidden.seenEnter && T - hidden.enterT < 6) { c.spot = hidden; setSt(c, 'searchSpot'); continue; }
        if (!pIn) { setSt(c, 'giveup'); continue; }
        if ((c.lost += 0.1) > 1.3) setSt(c, 'search');
        continue; }
      const heard = pIn && n > 0 && d < HEAR[n] * c.hear;
      if (heard && (c.st === 'patrol' || c.st === 'suspicious' || c.st === 'giveup' || c.st === 'search')) { c.last.x = P.x; c.last.y = P.y; c.last.z = P.z; if (c.st !== 'suspicious') { setSt(c, 'suspicious'); sfx('tick'); } else c.pts = null; c.t = 0; }
    }
  }
  function chTick(dt) {
    planned = false;
    for (const c of CH) {
      if (!c.alive) continue; c.bob += dt; if (c.cool > 0) c.cool -= dt;
      if (!c.paused) switch (c.st) {
        case 'patrol': {
          if (!c.pts) { if ((c.think -= dt) > 0) break;
            let g = null; if (c.path && c.path.length) { const p = c.path[c.pk % c.path.length]; g = [p.x, p.y, p.z]; } else g = wanderGoal(c);
            if (!g) { c.think = 1; break; }
            const r = planTo(c, g[0], g[1], g[2]); if (r === 0) { c.think = 0.5; if (c.path) c.pk++; } }
          else if (moveAlong(c, dt, c.speed)) { c.pts = null; c.think = 0.5 + Math.random() * 0.8; if (c.path) c.pk++; }
          break; }
        case 'suspicious': {   // 소리 난 곳으로 걸어가 둘러봄(4초) → 순찰
          c.t += dt; turn(c, Math.atan2(c.last.x - c.x, c.last.z - c.z), dt * 3);
          if (!c.pts && Math.hypot(c.last.x - c.x, c.last.z - c.z) > 1.2 && (c.think -= dt) <= 0) planTo(c, c.last.x, c.last.y, c.last.z);
          else if (c.pts && moveAlong(c, dt, c.speed * 1.2)) c.pts = null;
          if (c.t > 5) setSt(c, 'patrol'); break; }
        case 'chase': {
          if ((c.think -= dt) <= 0 || !c.pts) planTo(c, c.last.x, c.last.y, c.last.z);
          if (c.pts) moveAlong(c, dt, c.chaseSp); break; }
        case 'search': {   // 마지막 본 곳 → 가까운 숨는 자리 하나 뒤지기
          c.t += dt;
          if (!c.pts && Math.hypot(c.last.x - c.x, c.last.z - c.z) > 1.0 && c.t < 8) { if ((c.think -= dt) <= 0) planTo(c, c.last.x, c.last.y, c.last.z); }
          else if (c.pts) { if (moveAlong(c, dt, c.speed * 1.4)) c.pts = null; }
          else { let best = null, bd = 5; for (const s of HIDES) { const dd = Math.hypot(s.stand.x - c.last.x, s.stand.z - c.last.z); if (dd < bd) { bd = dd; best = s; } }
            if (best) { c.spot = best; setSt(c, 'searchSpot'); } else if (c.t > 3) setSt(c, 'giveup'); else c.yaw += dt * 2.2; }
          break; }
        case 'searchSpot': {   // 숨는 자리 앞에 와서 2초 멈춤(조마조마) → 들어가는 걸 봤으면 찾음
          const s = c.spot; if (!s) { setSt(c, 'giveup'); break; }
          const d = Math.hypot(s.stand.x - c.x, s.stand.z - c.z);
          if (d > 0.7 && c.t === 0) { if (!c.pts) { if ((c.think -= dt) <= 0 && planTo(c, s.stand.x, s.stand.y, s.stand.z) === 0) setSt(c, 'giveup'); } else if (moveAlong(c, dt, c.speed * 1.5)) c.pts = null; break; }
          c.t += dt; turn(c, Math.atan2(s.x - c.x, s.z - c.z), dt * 5);
          if (c.t >= 2) { if (hidden === s && (s.seenEnter || c.inspect === s)) caught(c); else setSt(c, 'giveup'); }
          break; }
        case 'giveup': c.t += dt; c.yaw += Math.sin(c.t * 6) * dt * 2; if (c.t > 1.6) setSt(c, 'patrol'); break;
      }
      // 그리기(행렬만)
      const bob = c.kind === 'ghost' ? 0.22 + Math.sin(c.bob * 2.4) * 0.08 : Math.abs(Math.sin(c.bob * 7)) * (c.pts ? 0.04 : 0.01);
      const wig = c.st === 'searchSpot' && c.t > 0 ? Math.sin(c.bob * 18) * 0.05 : 0;
      c.pool.m.setMatrixAt(c.i, _m4.compose(_v.set(c.x, c.y + 0.01 + bob, c.z), _q.setFromEuler(_e.set(0, c.yaw + wig, c.kind === 'ghost' ? Math.sin(c.bob * 1.7) * 0.06 : 0)), _s.set(1, 1, 1)));
      c.pool.m.instanceMatrix.needsUpdate = true;
      if (c.fan) { c.fan.position.set(c.x, c.y + 0.05, c.z); c.fan.rotation.set(0, c.yaw, 0); const col = c.st === 'chase' ? 0xff5a4a : c.st === 'patrol' ? 0xffe066 : 0xffa53c; if (c.fan.material.color.getHex() !== col) c.fan.material.color.setHex(col); }
      if (c.bub) { const ch = c.st === 'chase' ? '❗' : c.st === 'suspicious' || c.st === 'search' || c.st === 'searchSpot' ? '❓' : c.st === 'giveup' ? '💤' : '';
        if (ch !== c.bubShown) { c.bubShown = ch; c.bub.textContent = ch; if (!ch) c.bub.style.display = 'none'; }
        if (ch) { _v.set(c.x, c.y + 1.6, c.z).project(camera); if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) c.bub.style.display = 'none';
          else { c.bub.style.display = 'block'; c.bub.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * innerWidth - 12).toFixed(0) + 'px,' + ((-_v.y * 0.5 + 0.5) * innerHeight - 20).toFixed(0) + 'px)'; } } }
    }
  }

  // ---------- 11. 불 끄기 · 손전등(G-ESCAPE 09-27 — 밤 놀이. 새 조명(Light) 없음) ----------
  //   lights(false) = 형광등(lamp 한 메시) 어둡게 + 있는 빛(하늘빛·해) 세기만 줄임(main.js setDark) — 비상구 유도등(sign 아틀라스)은 조명을 안 받아 그대로 빛남
  //   flashlight(true) = 손에서 화면 가운데 쪽으로 뻗는 빛 원뿔(MeshBasic 더하기 섞기 · 정점 알파 · 드로우콜 1) + 화면 가장자리 어둡게·가운데 밝게(DOM 두 장 — GPU 일 0)
  let darkOn = false, torch = null;
  function lights(on = true) { const d = !on; if (d === darkOn || !ui.dark) return !darkOn; darkOn = d; ui.dark(d); return !darkOn; }
  function flashlight(on = true) {
    if (on && !torch) {
      const L = 7, g = new THREE.ConeGeometry(1.35, L, 20, 1, true); g.translate(0, -L / 2, 0); g.rotateX(-X);   // 꼭짓점 = 원점 · 넓은 끝 = +z(lookAt 방향)
      const Pa = g.attributes.position, col = new Float32Array(Pa.count * 4);
      for (let i = 0; i < Pa.count; i++) { const t = Math.min(1, Math.max(0, Pa.getZ(i) / L)); col[i * 4] = 1; col[i * 4 + 1] = 0.94; col[i * 4 + 2] = 0.78; col[i * 4 + 3] = 0.3 * Math.pow(1 - t, 1.3); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
      ensureCss(); const el = div('eng-torch', '<i></i>');
      torch = { m, el };
    } else if (!on && torch) { scene.remove(torch.m); torch.m.geometry.dispose(); torch.m.material.dispose(); torch.el.remove(); torch = null; }
    return !!torch;
  }
  function torchTick() {
    const m = torch.m, yaw = pgYaw();
    // 1인칭(카메라가 머리 가까이)·숨음(틈새 시점)이면 원뿔은 숨김(화면 가운데 밝기만) — 원뿔이 카메라를 덮지 않게
    _v.set(P.x, P.y + (CTRL.crouched ? 0.8 : 1.3), P.z);
    const first = camera.position.distanceToSquared(_v) < 0.36;
    m.visible = !hidden && !first;
    if (!m.visible) return;
    m.position.set(P.x + Math.sin(yaw) * 0.3 - Math.cos(yaw) * 0.16, P.y + (CTRL.crouched ? 0.5 : 0.92), P.z + Math.cos(yaw) * 0.3 + Math.sin(yaw) * 0.16);
    camera.getWorldDirection(_n); _s.copy(camera.position).addScaledVector(_n, 9); m.lookAt(_s);
  }

  // ---------- 틱 · 정리 ----------
  function tick(dt) {
    T += dt;
    if (digging) digTick(dt);
    if (dirtN) dirtTick(dt);
    if (carried) carryTick();
    if (PROPS.length) propTick(dt);
    if (CH.length) chTick(dt);
    if (torch) torchTick();
  }
  function tick10() { if (CH.length) chSense(); }
  function idleAct() { if (carried) { carry.drop(); return true; } return false; }
  function reset() {
    GEN++; ctrlGuard(false); flashlight(false); if (darkOn) lights(true);
    if (hidden) hide.exit();
    if (noteDone) noteDone(false);
    if (digging) { CTRL.pose = null; CTRL.frozen = digging.was; digging = null; }
    for (const h of [...owned].reverse()) { try { h.remove(); } catch (e) { console.error(e); } } owned.length = 0;
    for (const n of [...LOCKS.keys()]) door.lock(n, false);
    for (const c of [...CH]) chRemove(c);
    carried = null; CTRL.hold = false; CTRL.pose = null; PROPS.length = 0; TARGETS.length = 0; DIGS.length = 0; HIDES.length = 0; RUNNERS.length = 0;
    for (const [, p] of POOLS) { scene.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); if (p.m.dispose) p.m.dispose(); } POOLS.clear();
    if (G0) { for (const k in G0) G0[k].dispose(); G0 = null; }
    ST.flags.clear(); ST.inv.length = 0; ST.chapter = null; ST.lis.clear(); invDraw();
    if (H.getScale && H.getScale() !== 1) { H.setScale(1); if (!CTRL.crouched && q.blockedAt(P.x, P.z, P.y)) H.unstick(); }   // SHRINK-1: 원래 크기로 — 책상 위·밑이면(평소 몸엔 NS 상자 속) 가까운 걷는 칸으로
    if (CTRL.crouchOK || CTRL.crouched) { const was = CTRL.crouched; CTRL.crouchOK = false; CTRL.crouchForce = null; CTRL.crouched = false; P.bh = 1.5; touch.setCrouchBtn(false); if (was && q.blockedAt(P.x, P.z, P.y)) H.unstick(); }
    for (const el of [vig, invEl, fadeEl]) if (el) el.remove(); vig = invEl = fadeEl = null; if (css) { css.remove(); css = null; }
    setInvis(false);   // HS-1
    dirtN = 0;
    if (time0 != null) { const k = time0; time0 = null; if (ui.getTime && ui.getTime() !== k) ui.setTime(k); }
  }
  const stats = () => ({ dark: darkOn, torch: !!torch, hides: HIDES.length, hidden: !!hidden, props: PROPS.length, chasers: CH.length, pools: POOLS.size, locks: LOCKS.size, flags: ST.flags.size, inv: ST.inv.length, runners: RUNNERS.length, owned: owned.length, crouchOK: !!CTRL.crouchOK, scale: H.getScale ? H.getScale() : 1, targets: TARGETS.length, digs: DIGS.length, note: !!noteEl });
  return { player, see, hide, note, closeModal, investigate, prop, carry, dig, story, door, chaser, fade, setTime, lights, flashlight, tick, tick10, idleAct, reset, stats };
}
