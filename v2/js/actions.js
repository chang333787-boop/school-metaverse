// 보이는 행동(ACTION-1 · 09-28 아이 의견 "상호작용이 말만 되고 실제로 보이지 않는 게 대부분") — 정본 docs/map_api.md §19
//   play(이름, o) 하나로: ① 대상(o.at) 쪽으로 돌아서서 알맞은 거리까지 한 발(막히면 그 자리) ② 캐릭터 자세(팔·허리·고개 키프레임 — kid.js 뼈대 그대로)
//   ③ 손에 소품(분무기·마이크·물뿌리개·책·펜·지우개·숟가락) ④ 물줄기(관 한 개)·알갱이(물방울·안개·거품·반짝이 = 인스턴스 1 · 음표 = 인스턴스 1)
//   ⑤ 끝나면 원래 자세 · 알림 글은 동작 뒤에 짧게. 움직이면(키·조이스틱·점프) 바로 멈춘다(앉아 먹기는 일어날 때).
//   비용: 쉬는 동안 0(메시 숨김 · 매 프레임 일 없음) · 도는 동안 드로우콜 ≤ 소품 2~3 + 물줄기 1 + 알갱이 1 + 음표 1 · 새 조명 없음 · 매 프레임 new 없음(스크래치 재사용)
//   버스 접이문(BUS-1)도 여기서 연다(다가가면 열림 — 통행은 막지 않는다, 학교 문과 같은 규칙).
export function createActions(H) {
  const { THREE, scene, camera, KID, pg, P, ACT, blocked, groundAt, toast, tone } = H;
  const K = KID, R2 = Math.PI * 2;
  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
  const sm = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
  // ---------- 재질(색마다 한 번) ----------
  const MATS = new Map();
  const lam = hex => { let m = MATS.get(hex); if (!m) { m = new THREE.MeshLambertMaterial({ color: hex }); MATS.set(hex, m); } return m; };
  const WATER = new THREE.MeshBasicMaterial({ color: 0x8fd6ff, transparent: true, opacity: 0.85, depthWrite: false });
  // ---------- 소품(처음 쓸 때 만든다 · 손 = 팔 끝 (0,-0.26,0.02) · 팔을 앞으로 들면 팔 좌표 -y = 앞, +z = 위) ----------
  const G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 8), sph: new THREE.SphereGeometry(1, 8, 6) };
  const part = (g, hex, p, s, r) => { const m = new THREE.Mesh(G[g], lam(hex)); m.position.set(p[0], p[1], p[2]); m.scale.set(s[0], s[1], s[2]); if (r) m.rotation.set(r[0], r[1], r[2]); return m; };
  const PROPS = {
    spray: () => { const g = new THREE.Group();   // 분무기: 흰 몸통(위로) + 파란 머리·방아쇠 + 앞 꼭지
      g.add(part('cyl', 0xf4f6f8, [0, -0.02, 0.06], [0.035, 0.13, 0.035], [Math.PI / 2, 0, 0]), part('box', 0x3a7bd5, [0, -0.035, 0.145], [0.05, 0.1, 0.05]),
        part('box', 0x2f66b8, [0, -0.07, 0.11], [0.02, 0.03, 0.05]), part('cyl', 0x2a2d33, [0, -0.095, 0.155], [0.01, 0.03, 0.01]));
      const tip = new THREE.Object3D(); tip.position.set(0, -0.11, 0.155); g.add(tip); g.userData.tip = tip; return g; },
    mic: () => { const g = new THREE.Group();     // 마이크: 손잡이 + 둥근 망 머리를 한 회전체(메시 1 = 드로우콜 1)
      if (!G.mic) { const pr = [[0.001, -0.005], [0.014, 0], [0.019, 0.13], [0.03, 0.135], [0.037, 0.16], [0.03, 0.185], [0.001, 0.195]].map(([r, y]) => new THREE.Vector2(r, y)); G.mic = new THREE.LatheGeometry(pr, 8).rotateX(Math.PI / 2); }
      g.add(new THREE.Mesh(G.mic, lam(0x2a2d33))); return g; },
    can: () => { const g = new THREE.Group();     // 물뿌리개(몸 좌표 — 오른손 자리): 초록 통 + 위 손잡이 + 앞으로 비스듬히 솟은 주둥이 + 노란 꼭지
      g.add(part('box', 0x3fae5a, [0, 0, 0], [0.13, 0.13, 0.17]), part('box', 0x2f8a46, [0, 0.1, -0.02], [0.025, 0.07, 0.12]),
        part('cyl', 0x359a4e, [0, 0.06, 0.16], [0.013, 0.2, 0.013], [1.0, 0, 0]), part('cyl', 0xe9c23a, [0, 0.13, 0.245], [0.03, 0.025, 0.03], [1.0, 0, 0]));
      const tip = new THREE.Object3D(); tip.position.set(0, 0.14, 0.26); g.add(tip); g.userData.tip = tip; return g; },
    book: () => { const g = new THREE.Group();    // 펼친 책(두 손 앞 — 몸 좌표): 빨간 표지 V + 흰 쪽
      const L = new THREE.Group(), Rr = new THREE.Group(); L.rotation.y = 0.35; Rr.rotation.y = -0.35;
      L.add(part('box', 0xd8503a, [-0.075, 0, 0], [0.15, 0.2, 0.012]), part('box', 0xfbf8ee, [-0.072, 0, 0.012], [0.14, 0.19, 0.012]));
      Rr.add(part('box', 0xd8503a, [0.075, 0, 0], [0.15, 0.2, 0.012]), part('box', 0xfbf8ee, [0.072, 0, 0.012], [0.14, 0.19, 0.012]));
      g.add(L, Rr); g.rotation.x = -0.75; g.userData.pages = [L, Rr]; return g; },
    pen: () => { const g = new THREE.Group(); g.add(part('cyl', 0x2a5ab8, [0, -0.03, 0.02], [0.01, 0.12, 0.01], [0.4, 0, 0])); return g; },
    eraser: () => { const g = new THREE.Group(); g.add(part('box', 0x6a4a32, [0, -0.02, 0.02], [0.1, 0.04, 0.05]), part('box', 0x3a3d44, [0, -0.045, 0.02], [0.1, 0.02, 0.05])); return g; },
    spoon: () => { const g = new THREE.Group(); g.add(part('cyl', 0xcfd4d8, [0, -0.06, 0.02], [0.007, 0.12, 0.007]), part('sph', 0xcfd4d8, [0, -0.125, 0.02], [0.02, 0.008, 0.028])); return g; },
  };
  const PCACHE = new Map();
  function prop(name, where) { let p = PCACHE.get(name); if (!p) { p = PROPS[name](); PCACHE.set(name, p); }
    const par = where === 'L' ? K.armL : where === 'body' || where === 'rhand' ? K.rig : K.armR;
    if (where === 'body') p.position.set(0, 0.6, 0.27); else if (where === 'rhand') p.position.set(0.2, 0.4, 0.2); else p.position.set(0, -0.26, 0.02);
    p.scale.setScalar(where === 'body' || where === 'rhand' ? 1.25 : name === 'spoon' || name === 'pen' ? 1.2 : 1.45); p.rotation.x = 0;   // 치비 비율 — 소품은 조금 크게(멀리서도 알아보게)
    par.add(p); p.visible = true; return p; }
  // ---------- 알갱이(물방울·안개·거품·반짝이 — 인스턴스 하나) · 음표(인스턴스 하나 · 카메라를 봄) ----------
  const CAP = 160, DOT = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }), CAP);
  DOT.frustumCulled = false; DOT.count = 0; DOT.visible = false; DOT.renderOrder = 2; scene.add(DOT);
  DOT.setColorAt(0, _c.set(0xffffff)); DOT.instanceColor.needsUpdate = true;
  const PT = []; for (let i = 0; i < CAP; i++) PT.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.01, grow: 0, g: 9.8, drag: 0, c: 0xffffff });
  const NCAP = 24, NT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(40,40,60,.55)'; g.lineWidth = 4; g.font = '900 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('♪', 32, 34); g.fillText('♪', 32, 34);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const NOTE = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: NT, transparent: true, depthWrite: false, alphaTest: 0.05 }), NCAP);
  NOTE.frustumCulled = false; NOTE.count = 0; NOTE.visible = false; NOTE.renderOrder = 3; scene.add(NOTE);
  NOTE.setColorAt(0, _c.set(0xffffff)); NOTE.instanceColor.needsUpdate = true;
  const NP = []; for (let i = 0; i < NCAP; i++) NP.push({ on: false, x: 0, y: 0, z: 0, t: 0, life: 1.6, ph: 0, c: 0xffffff });
  const NCOL = [0xff6b8a, 0x4fa3ff, 0xffc233, 0x5fcf6a, 0xb07cff];
  let nAlive = 0, pAlive = 0;
  // o = { spread, speed, life, size, grow, g, drag, color }
  function emit(n, x, y, z, dx, dy, dz, o = {}) {
    const sp = o.spread ?? 0.3, spd = o.speed ?? 1;
    for (let k = 0; k < n; k++) { let q = null; for (const p of PT) if (!p.on) { q = p; break; } if (!q) return;
      const rx = (Math.random() - 0.5) * 2 * sp, ry = (Math.random() - 0.5) * 2 * sp, rz = (Math.random() - 0.5) * 2 * sp, v = spd * (0.75 + Math.random() * 0.5);
      q.on = true; q.x = x; q.y = y; q.z = z; q.vx = (dx + rx) * v; q.vy = (dy + ry) * v; q.vz = (dz + rz) * v; q.t = 0; q.life = (o.life ?? 0.6) * (0.8 + Math.random() * 0.4);
      q.s = o.size ?? 0.012; q.grow = o.grow ?? 0; q.g = o.g ?? 9.8; q.drag = o.drag ?? 0; q.c = o.color ?? 0x7cc8ff; pAlive++; }
    DOT.visible = true;
  }
  function note(x, y, z) { for (const p of NP) if (!p.on) { p.on = true; p.x = x + (Math.random() - 0.5) * 0.3; p.y = y; p.z = z + (Math.random() - 0.5) * 0.3; p.t = 0; p.ph = Math.random() * R2; p.c = NCOL[(Math.random() * NCOL.length) | 0]; nAlive++; NOTE.visible = true; return; } }
  function fxTick(dt) {
    if (pAlive > 0) { let n = 0;
      for (const p of PT) { if (!p.on) continue; p.t += dt; if (p.t >= p.life) { p.on = false; pAlive--; continue; }
        const dk = Math.max(0, 1 - p.drag * dt); p.vx *= dk; p.vz *= dk; p.vy = p.vy * dk - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const s = (p.s + p.grow * p.t) * (1 - 0.6 * (p.t / p.life));
        DOT.setMatrixAt(n, _m.compose(_v.set(p.x, p.y, p.z), _q.identity(), _s.set(s, s, s))); DOT.setColorAt(n, _c.set(p.c)); n++; }
      DOT.count = n; DOT.instanceMatrix.needsUpdate = true; if (DOT.instanceColor) DOT.instanceColor.needsUpdate = true; if (!n) DOT.visible = false; }
    if (nAlive > 0) { let n = 0;
      for (const p of NP) { if (!p.on) continue; p.t += dt; if (p.t >= p.life) { p.on = false; nAlive--; continue; }
        const k = p.t / p.life, s = 0.24 * (k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.7) / 0.3));
        NOTE.setMatrixAt(n, _m.compose(_v.set(p.x + Math.sin(p.t * 5 + p.ph) * 0.08, p.y + p.t * 0.55, p.z), camera.quaternion, _s.set(s, s, s))); NOTE.setColorAt(n, _c.set(p.c)); n++; }
      NOTE.count = n; NOTE.instanceMatrix.needsUpdate = true; if (NOTE.instanceColor) NOTE.instanceColor.needsUpdate = true; if (!n) NOTE.visible = false; }
  }
  // ---------- 물줄기(관 하나 — 행동마다 모양을 다시 짓는다: 행동 시작 때 한 번) ----------
  let stream = null, streamF = 0, streamOn = false, streamKill = false;   // streamKill = 다 거두면 치운다(행동이 끝날 때만)
  function streamSet(pts, r = 0.009) {
    if (stream) { scene.remove(stream); stream.geometry.dispose(); stream = null; }
    if (!pts) return;
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    stream = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, r, 6, false), WATER); stream.renderOrder = 2; stream.frustumCulled = false;
    stream.geometry.setDrawRange(0, 0); scene.add(stream); streamF = 0; streamOn = true; streamKill = false;
  }
  function streamTick(dt) { if (!stream) return; streamF = Math.max(0, Math.min(1, streamF + (streamOn ? dt : -dt) * 5));
    const n = stream.geometry.index.count, k = Math.floor(n * streamF / 36) * 36;
    if (streamOn) stream.geometry.setDrawRange(0, k); else stream.geometry.setDrawRange(n - k, k);
    if (!streamOn && streamF <= 0 && streamKill) streamSet(null); }
  // ---------- 젖은 흙(텃밭 — 원 하나 · 25초에 걸쳐 마름) ----------
  let wet = null, wetA = 0;
  function wetAt(x, y, z) { if (!wet) { wet = new THREE.Mesh(new THREE.CircleGeometry(0.45, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2a1c12, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); wet.renderOrder = 1; scene.add(wet); }
    wet.position.set(x, y + 0.006, z); wet.visible = true; }
  function wetTick(dt) { if (!wet || !wet.visible) return; if (wetA > 0) wetA = Math.max(0, wetA - dt / 25); wet.material.opacity = Math.min(0.5, wetA * 0.5); if (wetA <= 0) wet.visible = false; }
  // ---------- 월드 붙박이(마이크 스탠드 위 마이크 · 버스 접이문) ----------
  const MICS = [];   // { mesh, h }
  function micStand(h) { const m = PROPS.mic(); m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2 + 0.35; m.position.set(h.mic[0], h.mic[1], h.mic[2]); m.rotation.y = h.mic[3] || 0; scene.add(m); MICS.push({ mesh: m, h }); }
  let bus = null;
  function busDoor(b) {   // b = { x, z, y0, w, h, dir(-1 북쪽 면) } — 두 짝이 바깥 경첩을 축으로 밖으로 접힌다
    const geo = new THREE.BoxGeometry(1, 1, 1), mat = lam(0x34414d), gl = new THREE.MeshBasicMaterial({ color: 0x9fc6d8, transparent: true, opacity: 0.55, depthWrite: false });
    const leaves = [-1, 1].map(sd => { const piv = new THREE.Group(); piv.position.set(b.x + sd * b.w / 2, b.y0, b.z); scene.add(piv);
      const fr = new THREE.Mesh(geo, mat); fr.scale.set(b.w / 2 - 0.01, b.h, 0.04); fr.position.set(-sd * (b.w / 4), b.h / 2, 0); piv.add(fr);
      const g9 = new THREE.Mesh(geo, gl); g9.scale.set(b.w / 2 - 0.1, b.h * 0.62, 0.05); g9.position.set(-sd * (b.w / 4), b.h * 0.62, 0); piv.add(g9);
      return { piv, sd }; });
    bus = { ...b, leaves, open: 0, vis: true };
  }
  const FAR2 = 38 * 38;   // 붙박이(버스 문짝·스탠드 마이크)는 카메라 38m 밖이면 숨긴다(작은 메시 = 드로우콜 — 멀리선 안 보임)
  function farTick() { const c = camera.position;
    if (bus) { const v = (c.x - bus.x) ** 2 + (c.z - bus.z) ** 2 < FAR2; if (v !== bus.vis) { bus.vis = v; for (const L of bus.leaves) L.piv.visible = v; } }
    for (const m of MICS) { const v = (c.x - m.mesh.position.x) ** 2 + (c.z - m.mesh.position.z) ** 2 < 196 && !m.held; if (v !== m.mesh.visible) m.mesh.visible = v; } }   // 마이크는 14m
  function busTick(dt) { if (!bus) return; const d = Math.hypot(P.x - bus.x, P.z - bus.z), want = d < 3.4 && Math.abs(P.y - bus.y0) < 3 ? 1 : 0;
    if (want === bus.open) return; bus.open = want ? Math.min(1, bus.open + dt * 2.2) : Math.max(0, bus.open - dt * 1.6);
    if (bus.open > 0 && bus.open < 0.05 && want) tone(220, 0, 0.18, 'sine', 0.08, 180);   // 칙 — 문 열리는 소리
    for (const L of bus.leaves) L.piv.rotation.y = L.sd * bus.dir * bus.open * 1.45; }
  // ---------- 행동 정의 ----------
  // pose(c, t, k) — kidTick 기본 자세 뒤에 덮어쓴다(k = 들어가고 나오는 세기 0~1)
  const hip = a => {   // 허리 굽히기: 몸 전체를 발끝 축으로 a만큼 앞으로 + 다리는 반대로(세로 유지) + 엉덩이를 뒤로(발이 제자리)
    K.rig.rotation.x += a; K.legL.g.rotation.x -= a; K.legR.g.rotation.x -= a;
    K.rig.position.z -= 0.34 * Math.sin(a); K.rig.position.y -= 0.34 * (1 - Math.cos(a)); };
  const armsIn = (k, x) => { K.armL.rotation.x = K.armR.rotation.x = x; K.armL.rotation.z = -0.12 + 0.62 * k; K.armR.rotation.z = 0.12 - 0.62 * k; };
  const D = {
    drink: { dur: 2.4, reach: 0.6, side: 0.13, msg: '💧 시원하게 물을 마셨어요',
      start(c) { const a = c.at, fx = -c.fwd[0], fz = -c.fwd[1];   // 꼭지에서 위로 솟아 마시는 쪽으로 휘는 포물선(아이 의견 "아래에서 물이 나와야")
        const pts = []; for (let i = 0; i <= 8; i++) { const s = i / 8; pts.push([a[0] + fx * 0.2 * s, a[1] + 4 * 0.2 * s * (1 - s) - 0.04 * s, a[2] + fz * 0.2 * s]); }
        c.pts = pts; streamSet(pts, 0.013); streamOn = false; streamF = 0; },
      tick(c, t) { if (t > 0.35 && t < c.def.dur - 0.4) { if (!streamOn) streamOn = true; if (Math.random() < 0.3) { const e = c.pts[8]; emit(1, e[0], e[1], e[2], 0, 0.6, 0, { speed: 0.6, spread: 0.6, life: 0.3, size: 0.018 }); } } else if (t >= c.def.dur - 0.4) streamOn = false; },
      pose(c, t, k) { hip(0.45 * k); K.head.rotation.x += 0.2 * k; K.head.rotation.z = -0.25 * k; K.armL.rotation.x = 0.35 * k; K.armR.rotation.x = -0.75 * k; K.armR.rotation.z = 0.12 - 0.3 * k; } },
    wash: { dur: 2.8, reach: 0.66, side: 0.1, msg: '🫧 손을 깨끗이 씻었어요',
      start(c) { const a = c.at; if (a.length > 3) streamSet([[a[0], a[1], a[2]], [a[0], (a[1] + a[3]) / 2, a[2]], [a[0], a[3], a[2]]], 0.018); },
      tick(c, t) { const dur = c.def.dur; if (t > 0.2 && t < dur - 0.6) { if (Math.random() < 0.35) { handPos(_v2); emit(1, _v2.x, _v2.y + 0.03, _v2.z, 0, 0.3, 0, { speed: 0.4, spread: 0.8, life: 0.7, size: 0.03, g: -0.3, drag: 3, color: 0xffffff }); } }
        else if (t >= dur - 0.6) { streamOn = false; if (!c.shook) { c.shook = true; handPos(_v2); emit(10, _v2.x, _v2.y, _v2.z, 0, 0.4, 0, { speed: 1.4, spread: 0.9, life: 0.5, size: 0.02 }); } } },
      pose(c, t, k) { const r = t < c.def.dur - 0.6 ? Math.sin(t * 16) : 0, sh = t >= c.def.dur - 0.6 ? Math.sin(t * 34) * 0.35 : 0; hip(0.42 * k);
        armsIn(k, -1.35 * k + r * 0.08); K.armL.rotation.z += r * 0.1 * k - sh; K.armR.rotation.z -= r * 0.1 * k - sh; } },
    sanitize: { dur: 1.8, reach: 0.6, msg: '🧴 손소독제로 손을 비볐어요',
      pose(c, t, k) { const r = t > 0.5 ? Math.sin(t * 16) : 0; if (t < 0.5) { K.armR.rotation.x = -1.4 * k + Math.sin(t * 12) * 0.1; } else { armsIn(k, -1.25 * k + r * 0.08); K.armL.rotation.z += r * 0.1 * k; K.armR.rotation.z -= r * 0.1 * k; } } },
    spray: { dur: 2.6, reach: 0.82, msg: '🪴 칙칙! 화분에 물을 뿌려 줬어요', prop: ['spray'],
      tick(c, t) { for (const at of [0.6, 1.15, 1.7]) if (t >= at && c.last < at) { const tip = c.props[0].userData.tip; tip.getWorldPosition(_v2); const a = c.at, dx = a[0] - _v2.x, dy = a[1] - _v2.y, dz = a[2] - _v2.z, L = Math.hypot(dx, dy, dz) || 1;
          emit(22, _v2.x, _v2.y, _v2.z, dx / L, dy / L, dz / L, { speed: 1.8, spread: 0.22, life: 0.8, size: 0.025, grow: 0.14, g: 0.3, drag: 2.5, color: 0xf4fbff }); tone(2400, 0, 0.06, 'square', 0.02); }
        if (t >= 2.0 && c.last < 2.0) { const a = c.at; emit(8, a[0], a[1], a[2], 0, 0.8, 0, { speed: 0.6, spread: 0.7, life: 0.9, size: 0.03, g: -0.2, color: 0xfff27a }); } },
      pose(c, t, k) { const sq = Math.max(0, Math.sin((t - 0.5) * 11)) * (t > 0.5 && t < 1.9 ? 1 : 0); K.armR.rotation.x = -1.4 * k - sq * 0.06; K.armL.rotation.x = -0.25 * k; } },
    water: { dur: 3.0, reach: 0.95, msg: '🌱 텃밭에 물을 줬어요', prop: ['can@rhand'],
      tick(c, t) { if (t > 0.7 && t < 2.5) { const tip = c.props[0].userData.tip; tip.getWorldPosition(_v2); const f = c.fwd;
          if (!c.tube) { c.tube = true; const gy = groundAt(_v2.x + f[0] * 0.35, _v2.z + f[1] * 0.35, _v2.y) + 0.02; c.gy = gy;
            streamSet([[_v2.x, _v2.y, _v2.z], [_v2.x + f[0] * 0.18, (_v2.y + gy) * 0.5 + 0.05, _v2.z + f[1] * 0.18], [_v2.x + f[0] * 0.3, gy, _v2.z + f[1] * 0.3]], 0.016); }
          if (Math.random() < 0.5) emit(2, _v2.x + f[0] * 0.3, c.gy + 0.02, _v2.z + f[1] * 0.3, 0, 1, 0, { speed: 0.9, spread: 0.7, life: 0.35, size: 0.02, color: 0x7cc8ff });
          if (!c.wet) { c.wet = true; wetAt(_v2.x + f[0] * 0.3, c.gy - 0.02, _v2.z + f[1] * 0.3); } wetA = Math.min(1, wetA + (t - c.last) * 0.9); } },
      pose(c, t, k) { const tilt = sm(0.4, 0.8, t) * (1 - sm(2.4, 2.8, t)); K.armR.rotation.x = -(0.55 + 0.25 * tilt) * k; K.armR.rotation.z = 0.12 - 0.1 * k; K.armL.rotation.x = -0.2 * k;
        if (c.props[0]) { c.props[0].rotation.x = 0.85 * tilt; c.props[0].position.y = 0.4 + 0.06 * tilt; } if (t > 2.5 && c.tube) streamOn = false; } },
    mic: { dur: 3.2, reach: 0.5, msg: '🎤 아아~ 마이크 시험 중! 잘 들리나요?',
      start(c) { c.mic = MICS.find(m => m.h === c.h) || null; },
      tick(c, t) { if (t >= 0.35 && !c.got) { c.got = true; if (c.mic) { c.mic.held = true; c.mic.mesh.visible = false; } c.props.push(prop('mic')); [523, 659].forEach((f, i) => tone(f, i * 0.16, 0.14, 'triangle', 0.12)); }
        if (t > 0.6 && t < 2.9 && Math.random() < 0.06) { _v2.set(0, 1.25, 0.25); K.rig.localToWorld(_v2); note(_v2.x, _v2.y, _v2.z); } },
      end(c) { if (c.mic) c.mic.held = false; },
      pose(c, t, k) { const up = sm(0.2, 0.6, t) * (1 - sm(2.8, 3.2, t)); K.armR.rotation.x = -1.95 * up; K.armR.rotation.z = 0.12 - 0.45 * up;
        K.armL.rotation.x = -2.6 * up + Math.sin(t * 7) * 0.12 * up; K.armL.rotation.z = -0.12 - (0.45 + Math.sin(t * 9) * 0.35) * up; K.head.rotation.x -= 0.08 * up; } },
    drum: { dur: 2.0, reach: 0.7, msg: null,
      tick(c, t) { if (t > 0.2 && t < 1.8 && Math.random() < 0.1) { _v2.set(0, 1.1, 0.4); K.rig.localToWorld(_v2); note(_v2.x, _v2.y, _v2.z); } },
      pose(c, t, k) { const b = Math.sin(t * 17); K.armL.rotation.x = (-1.3 + b * 0.45) * k; K.armR.rotation.x = (-1.3 - b * 0.45) * k; K.head.rotation.x += Math.abs(b) * 0.05; } },
    sing: { dur: 2.6, reach: 0, msg: null,
      tick(c, t) { if (t > 0.1 && t < 2.4 && Math.random() < 0.08) { _v2.set(0, 1.3, 0.2); K.rig.localToWorld(_v2); note(_v2.x, _v2.y, _v2.z); } },
      pose(c, t, k) { K.rig.rotation.z = Math.sin(t * 4) * 0.1 * k; K.head.rotation.z = Math.sin(t * 4 + 0.6) * 0.14 * k; K.armL.rotation.x = K.armR.rotation.x = 0.3 * k; } },
    write: { dur: 1.2, reach: 0.72, msg: null, prop: ['pen'],
      pose(c, t, k) { K.armR.rotation.x = (-2.15 + Math.sin(t * 9) * 0.12) * k; K.armR.rotation.z = 0.12 + Math.cos(t * 9) * 0.12 * k; K.armL.rotation.x = -0.2 * k; } },
    erase: { dur: 1.2, reach: 0.72, msg: null, prop: ['eraser'],
      pose(c, t, k) { K.armR.rotation.x = -2.1 * k; K.armR.rotation.z = 0.12 + Math.sin(t * 8) * 0.5 * k; } },
    point: { dur: 1.5, reach: 0, msg: null,
      pose(c, t, k) { K.armR.rotation.x = -1.75 * k; K.armR.rotation.z = 0.05; K.head.rotation.x -= 0.08 * k; } },
    look: { dur: 1.8, reach: 0, msg: null,
      pose(c, t, k) { const a = c.at, up = a ? Math.max(-0.2, Math.min(0.75, Math.atan2(a[1] - (P.y + 1.1), Math.hypot(a[0] - P.x, a[2] - P.z) || 1))) : 0;
        K.head.rotation.x -= up * k; K.armL.rotation.x = K.armR.rotation.x = 0.35 * k; } },
    salute: { dur: 2.2, reach: 0, msg: null,   // 국기에 대한 경례: 오른손을 왼쪽 가슴에 · 고개를 들어 깃발
      pose(c, t, k) { const a = c.at, up = a ? Math.max(0, Math.min(0.75, Math.atan2(a[1] - (P.y + 1.1), Math.hypot(a[0] - P.x, a[2] - P.z) || 1))) : 0.4;
        K.head.rotation.x -= up * k; K.armR.rotation.x = -1.35 * k; K.armR.rotation.z = 0.12 - 0.95 * k; K.armL.rotation.x = 0.05 * k; } },
    read: { dur: 3.0, reach: 0, msg: '📖 조용히 책을 읽었어요', prop: ['book@body'],
      tick(c, t) { const pg9 = c.props[0] && c.props[0].userData.pages; if (pg9) { const f = sm(1.3, 1.7, t); pg9[1].rotation.y = -0.35 + f * 0.0; pg9[0].rotation.y = 0.35 - Math.sin(f * Math.PI) * 0.9; } },
      pose(c, t, k) { armsIn(k * 0.55, -1.25 * k); K.head.rotation.x += 0.22 * k; } },
    scribble: { dur: 2.0, reach: 0.62, msg: null, prop: ['pen'],
      pose(c, t, k) { hip(0.3 * k); K.armR.rotation.x = -1.25 * k + Math.sin(t * 14) * 0.05; K.armR.rotation.z = 0.12 - 0.35 * k + Math.cos(t * 11) * 0.06; K.armL.rotation.x = -1.0 * k; K.head.rotation.x += 0.2 * k; } },
    press: { dur: 1.1, reach: 0.55, msg: null,
      pose(c, t, k) { K.armR.rotation.x = (-1.5 + Math.max(0, Math.sin(t * 17)) * 0.12) * k; K.armR.rotation.z = 0.12 - 0.25 * k; } },
    shoes: { dur: 1.7, reach: 0, msg: null,
      pose(c, t, k) { hip(0.75 * k); K.legL.knee.rotation.x += 0.4 * k; K.legR.knee.rotation.x += 0.4 * k; armsIn(k * 0.3, -0.9 * k + Math.sin(t * 10) * 0.1); K.head.rotation.x += 0.3 * k; } },
    reach: { dur: 1.0, reach: 0, msg: null,   // 배식대·반납대: 두 손을 앞으로 뻗었다가 거둠
      pose(c, t, k) { const f = Math.sin(Math.min(1, t / c.def.dur) * Math.PI); K.armL.rotation.x = K.armR.rotation.x = -1.1 - 0.45 * f; } },
    eat: { dur: Infinity, reach: 0, msg: null, sit: true, prop: ['spoon'],
      tick(c, t) { if (c.o.onEat) c.o.onEat(t); },
      pose(c, t, k) { const ph = (t % 1.6) / 1.6, up = ph < 0.5 ? sm(0.05, 0.45, ph) : 1 - sm(0.55, 0.95, ph);
        K.armR.rotation.x = -0.95 - 1.15 * up; K.armR.rotation.z = 0.12 - 0.5 * up; K.armL.rotation.x = -0.85; K.head.rotation.x += 0.12 - 0.1 * up; } },
  };
  // ---------- 진행 ----------
  let cur = null;
  function handPos(out) { K.armL.updateWorldMatrix(true, false); K.armR.updateWorldMatrix(false, false); _v.set(0, -0.26, 0.04); K.armL.localToWorld(_v); out.set(0, -0.26, 0.04); K.armR.localToWorld(out); out.add(_v).multiplyScalar(0.5); return out; }
  function stop(silent) {
    const c = cur; if (!c) return; cur = null;
    for (const p of c.props) if (p.parent) p.parent.remove(p);
    streamOn = false; streamKill = true; if (c.def.end) c.def.end(c);
    restore();
    const msg = c.o.msg !== undefined ? c.o.msg : c.def.msg; if (!silent && msg && c.t > c.def.dur * 0.55) toast(msg);
    if (c.o.onEnd) try { c.o.onEnd(c.t >= c.def.dur) } catch (e) { console.error(e); }
  }
  function restore() { K.armL.rotation.z = -0.12; K.armR.rotation.z = 0.12; K.armL.rotation.y = K.armR.rotation.y = 0; K.head.rotation.y = K.head.rotation.z = 0; K.rig.rotation.z = 0; K.rig.rotation.y = 0; }
  // o = { at:[x,y,z(,y2)] | ats:[[..],..], h(지점), msg, onMid(t), midAt, onEnd(done), onEat, face(true) }
  function play(name, o = {}) {
    const def = D[name]; if (!def) { console.warn('[act] 모르는 행동', name); return null; }
    if (cur) stop(true);
    let at = o.at || null;
    if (!at && o.ats) { let bd = 1e9; for (const a of o.ats) { const d = (a[0] - P.x) ** 2 + (a[2] - P.z) ** 2; if (d < bd) { bd = d; at = a; } } }
    const c = { name, def, o, at, h: o.h || null, t: 0, last: 0, props: [], from: null, to: null, fwd: [Math.sin(P.yaw), Math.cos(P.yaw)], k: 0 };
    if (at && o.face !== false) {   // 대상 쪽으로 돌아서기 + 알맞은 거리로 한 발(막히면 조금씩 물러서 · 그래도 막히면 제자리)
      const dx = P.x - at[0], dz = P.z - at[2], L = Math.hypot(dx, dz);
      if (L > 0.01) { const fx = dx / L, fz = dz / L; P.yaw = Math.atan2(-fx, -fz); c.fwd = [-fx, -fz];
        const re = o.reach ?? def.reach;
        const sd = def.side || 0;   // side = 대상에서 옆으로 비켜 서기(물줄기가 머리에 가리지 않게)
        if (re > 0 && Math.abs(L - re) < 1.6) for (let e = 0; e <= 0.45; e += 0.09) { const tx = at[0] + fx * (re + e) - fz * sd, tz = at[2] + fz * (re + e) + fx * sd;
          if (Math.hypot(tx - P.x, tz - P.z) < 0.05) break;
          if (!blocked(tx, tz, P.y)) { c.from = [P.x, P.z]; c.to = [tx, tz]; const gx = at[0] - tx, gz = at[2] - tz; P.yaw = Math.atan2(gx, gz); const g9 = Math.hypot(gx, gz) || 1; c.fwd = [gx / g9, gz / g9]; break; } } } }
    for (const p of def.prop || []) { const [n9, w9] = p.split('@'); c.props.push(prop(n9, w9)); }
    cur = c; if (def.start) def.start(c);
    return { get done() { return cur !== c; }, stop: () => { if (cur === c) stop(); } };
  }
  // 매 프레임(main.js step — 물리 뒤 · 캐릭터 위치 전): 한 발 옮기기 · 시간 · 효과
  function tick(dt) {
    busTick(dt); farTick(); fxTick(dt); streamTick(dt); wetTick(dt);
    const c = cur; if (!c) return;
    if (c.def.sit && !ACT.sit) { stop(); return; }
    c.last = c.t; c.t += dt;
    if (c.from && c.t < 0.3) { const f = sm(0, 0.28, c.t); P.x = c.from[0] + (c.to[0] - c.from[0]) * f; P.z = c.from[1] + (c.to[1] - c.from[1]) * f; }
    else if (c.from) { P.x = c.to[0]; P.z = c.to[1]; c.from = null; }
    if (c.o.onMid && c.t >= (c.o.midAt ?? c.def.dur * 0.55) && c.last < (c.o.midAt ?? c.def.dur * 0.55)) { try { c.o.onMid(c) } catch (e) { console.error(e); } }
    if (c.def.tick) c.def.tick(c, c.t);
    if (c.t >= c.def.dur) stop();
  }
  // kidTick 끝에서: 기본 자세 위에 덮어쓰기
  function pose() { const c = cur; if (!c || !c.def.pose) return; const dur = c.def.dur, k = dur === Infinity ? sm(0, 0.3, c.t) : sm(0, 0.3, c.t) * (1 - sm(dur - 0.3, dur, c.t)); c.def.pose(c, c.t, k); }
  return { play, stop, tick, pose, emit, note, micStand, busDoor, get cur() { return cur ? cur.name : null; }, get busy() { return !!cur && !cur.def.sit; }, defs: D,
    stats: () => ({ cur: cur && cur.name, dots: pAlive, notes: nAlive, stream: !!stream, bus: bus ? +bus.open.toFixed(2) : null, mics: MICS.length }) };
}
