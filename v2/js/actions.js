// 보이는 행동(ACTION-1 · 09-28 아이 의견 "상호작용이 말만 되고 실제로 보이지 않는 게 대부분") — 정본 docs/map_api.md §19
//   play(이름, o) 하나로: ① 대상(o.at) 쪽으로 돌아서서 알맞은 거리까지 한 발(막히면 그 자리) ② 캐릭터 자세(팔·허리·고개 키프레임 — kid.js 뼈대 그대로)
//   ③ 손에 소품(분무기·마이크·물뿌리개·책·펜·지우개·숟가락) ④ 물줄기(관 한 개)·알갱이(물방울·안개·거품·반짝이 = 인스턴스 1 · 음표 = 인스턴스 1)
//   ⑤ 끝나면 원래 자세 · 알림 글은 동작 뒤에 짧게. 움직이면(키·조이스틱·점프) 바로 멈춘다(앉아 먹기는 일어날 때).
//   비용: 쉬는 동안 0(메시 숨김 · 매 프레임 일 없음) · 도는 동안 드로우콜 ≤ 소품 2~3 + 물줄기 1 + 알갱이 1 + 음표 1 · 새 조명 없음 · 매 프레임 new 없음(스크래치 재사용)
//   버스 접이문(BUS-1)도 여기서 연다(다가가면 열림 — 통행은 막지 않는다, 학교 문과 같은 규칙).
//   TOOL-1(10-19 사용자 '실제로 도구를 사용해서 뭔가를 하는 게 0개네'): hold(이름) = 오른손에 늘 드는 소품(걸을 때도) · 도구 몸짓 dig·cast·peer·sweep · holdUse = 물뿌리개 기울여 붓는 자세
export function createActions(H) {
  const { THREE, scene, camera, KID, pg, P, ACT, blocked, groundAt, toast, tone } = H, C9 = H.CTRL || {};
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
    // TOOL-1 도구 넷(원점 = 쥐는 자리 · 일하는 끝 = −y · userData.tip = 끝) — 부재는 모두 3cm 이상 · 겹치는 판은 두께를 달리해 같은 면이 없게
    shovel: () => { const g = new THREE.Group();   // 삽: 나무 자루(가운데를 쥠) + D 손잡이 + 쇠 고리 + 날(넓은 판 + 뾰족한 끝)
      g.add(part('cyl', 0x9a6b3e, [0, -0.02, 0], [0.017, 0.64, 0.017]), part('box', 0x7a5230, [0, 0.31, 0], [0.11, 0.035, 0.036]), part('cyl', 0x6f7780, [0, -0.36, 0], [0.026, 0.07, 0.026]),
        part('box', 0xa3acb4, [0, -0.47, 0.006], [0.17, 0.17, 0.034]), part('box', 0x98a1aa, [0, -0.555, 0.006], [0.12, 0.12, 0.03], [0, 0, Math.PI / 4]));
      const tip = new THREE.Object3D(); tip.position.set(0, -0.62, 0); g.add(tip); g.userData.tip = tip; return g; },
    rod: () => { const g = new THREE.Group();   // 낚싯대: 코르크 손잡이 + 릴 + 대 둘(끝으로 갈수록 가늘게 보이게 색만 다름) + 찌(빨강·흰 — 걸을 땐 릴 옆에 걸어 둠)
      g.add(part('cyl', 0xc99a5e, [0, -0.02, 0], [0.022, 0.2, 0.022]), part('cyl', 0x2a5ab8, [0, -0.47, 0], [0.016, 0.7, 0.016]), part('cyl', 0x4a7ad8, [0, -1.07, 0], [0.015, 0.5, 0.015]),
        part('cyl', 0x3a3d44, [0.05, -0.06, 0.02], [0.04, 0.032, 0.04], [0, 0, Math.PI / 2]));
      const bob = new THREE.Group(); bob.add(part('sph', 0xe2412f, [0, 0, 0], [0.036, 0.036, 0.036]), part('cyl', 0xf6f6f2, [0, 0.042, 0], [0.016, 0.04, 0.016]));
      bob.position.set(0.03, -0.24, 0.03); g.add(bob); g.userData.bob = bob; g.userData.hook = [0.03, -0.24, 0.03];
      const tip = new THREE.Object3D(); tip.position.set(0, -1.32, 0); g.add(tip); g.userData.tip = tip; return g; },
    lens: () => { const g = new THREE.Group();   // 돋보기: 손잡이 + 둥근 테 + 유리(반투명)
      if (!G.torus) G.torus = new THREE.TorusGeometry(0.065, 0.016, 6, 16);
      const ring = new THREE.Mesh(G.torus, lam(0x3a3d44)); ring.position.set(0, -0.19, 0); g.add(part('cyl', 0x7a4a2a, [0, -0.06, 0], [0.017, 0.13, 0.017]), ring);
      if (!G.glass) G.glass = new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.45, depthWrite: false });
      const gl = new THREE.Mesh(G.cyl, G.glass); gl.position.set(0, -0.19, 0); gl.scale.set(0.058, 0.03, 0.058); gl.rotation.x = Math.PI / 2; g.add(gl);
      const tip = new THREE.Object3D(); tip.position.set(0, -0.19, 0); g.add(tip); g.userData.tip = tip; return g; },
    broom: () => { const g = new THREE.Group();   // 빗자루(수수비 결): 대 + 빨간 묶음 띠 + 솔 판 + 솔 끝(넓게 퍼짐)
      g.add(part('cyl', 0xb08850, [0, -0.08, 0], [0.017, 0.76, 0.017]), part('box', 0xc8443a, [0, -0.48, 0], [0.09, 0.05, 0.045]),
        part('box', 0xe2c46a, [0, -0.6, 0], [0.2, 0.2, 0.04]), part('box', 0xd2b058, [0, -0.72, 0], [0.24, 0.05, 0.035]));
      const tip = new THREE.Object3D(); tip.position.set(0, -0.74, 0); g.add(tip); g.userData.tip = tip; return g; },
  };
  const PCACHE = new Map();
  function propGet(name) { let p = PCACHE.get(name); if (!p) { p = PROPS[name](); PCACHE.set(name, p); } return p; }
  function prop(name, where) { const p = propGet(name);
    const par = where === 'L' ? K.armL : where === 'body' || where === 'rhand' ? K.rig : K.armR;
    if (where === 'body') p.position.set(0, 0.6, 0.27); else if (where === 'rhand') p.position.set(0.2, 0.4, 0.2); else p.position.set(0, -0.26, 0.02);
    p.scale.setScalar(where === 'body' || where === 'rhand' ? 1.25 : name === 'spoon' || name === 'pen' ? 1.2 : 1.45); p.rotation.x = 0; p.rotation.y = p.rotation.z = 0;   // 치비 비율 — 소품은 조금 크게(멀리서도 알아보게) · TOOL-1: 든 자리에서 온 소품은 y·z 돌림도 0
    par.add(p); p.visible = true; return p; }
  // ---------- 늘 드는 소품(TOOL-1): 오른팔 좌표 · p 자리 · r 돌림 · s 크기 · arm = 들고 걸을 때 오른팔 앞으로(흔들기는 30%) · use = holdUse 자세 ----------
  //   숨김은 엔진이 정함(매 프레임 비교 몇 개 · 새 객체 X): 1인칭·몸 숨김(pg가 숨으면 함께) · 탈것(CTRL.ride) · 몸 자세 덮어쓰기(CTRL.pose — 헤엄·스키·의자·눕기·엉덩방아·파기) · 앉기·미끄럼 · 물건 들기(CTRL.hold) · 다른 소품을 쓰는 행동 중
  const HOLD = {
    can: { p: [0, -0.41, 0.04], r: [0.15, 0, 0], s: 1.1, arm: -0.15, use: { p: [0, -0.33, 0.1], r: [1.75, 0, 0], arm: -1.15 } },
    shovel: { p: [0, -0.27, 0.035], r: [0.9, 0, 0.12], s: 0.9, arm: -0.2 },
    rod: { p: [0, -0.26, 0.03], r: [-1.85, 0, 0.06], s: 0.95, arm: -0.4 },
    lens: { p: [0, -0.27, 0.04], r: [-1.2, 0, 0], s: 1.1, arm: -0.3 },
    broom: { p: [0, -0.27, 0.035], r: [0.85, 0, 0.12], s: 0.9, arm: -0.2 },
  };
  let held = null, heldP = null, holdU = false;
  function holdPlace() { const p = heldP, h = HOLD[held]; if (!p || !h) return; const u = holdU && h.use ? h.use : h; K.armR.add(p); p.position.set(u.p[0], u.p[1], u.p[2]); p.rotation.set(u.r[0], u.r[1], u.r[2]); p.scale.setScalar(h.s); p.visible = true; }
  function toolUse(name) { const p = propGet(name), h = HOLD[name]; K.armR.add(p); p.position.set(h.p[0], h.p[1], h.p[2]); p.rotation.set(h.r[0], h.r[1], h.r[2]); p.scale.setScalar(h.s); p.visible = true; return p; }   // 도구 몸짓 = 든 자리에서 시작(자세가 돌림을 바꿈)
  function hold(name) { const n = name && PROPS[name] && HOLD[name] ? name : null; if (n === held) return !!n;
    if (cur && heldP && cur.props.includes(heldP)) stop(true);   // 쓰던 도구를 내려놓으면 그 몸짓도 멈춤
    if (heldP && heldP.parent) heldP.parent.remove(heldP); held = n; heldP = n ? propGet(n) : null; holdU = false; if (heldP) holdPlace(); return !!n; }
  function holdUse(on) { const v = !!on && !!held && !!(HOLD[held] || {}).use; if (v === holdU) return; holdU = v; if (heldP && !(cur && cur.props.includes(heldP))) holdPlace(); }
  function holdTick() { const p = heldP; if (!p) return; const c = cur, v = !C9.ride && !C9.pose && !ACT.sit && !ACT.anim && !C9.hold && (!c || c.props.includes(p)); if (p.visible !== v) p.visible = v; }
  function holdPose() { const h = HOLD[held]; if (holdU && h.use) { K.armR.rotation.x = h.use.arm; K.armR.rotation.z = 0.04; K.armL.rotation.x = -0.35; } else K.armR.rotation.x = K.armR.rotation.x * 0.3 + h.arm; }
  const TIPV = { x: 0, y: 0, z: 0, ok: false };   // toolTip() 돌려줌(같은 객체 — 곧바로 읽기)
  function toolTip() { const p = heldP, t = p && p.userData.tip; TIPV.ok = !!(t && p.visible && pg.visible); if (t) { t.getWorldPosition(_v); TIPV.x = _v.x; TIPV.y = _v.y; TIPV.z = _v.z; } return TIPV; }
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
  // ---------- 낚싯줄(TOOL-1 cast — 선 하나 · 던진 동안만 보임) · 찌는 낚싯대에서 떼어 세상에 띄웠다가 끝나면 릴 옆으로 ----------
  let LINE = null, bobRod = null;
  function lineSet(a, b) { if (!LINE) { LINE = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: 0xf6f6ee })); LINE.frustumCulled = false; scene.add(LINE); }
    const A9 = LINE.geometry.attributes.position; A9.setXYZ(0, a.x, a.y, a.z); A9.setXYZ(1, b.x, b.y, b.z); A9.needsUpdate = true; LINE.visible = true; }
  function bobHome() { if (LINE) LINE.visible = false; const r = bobRod; bobRod = null; if (!r) return; const U = r.userData; r.add(U.bob); U.bob.position.set(U.hook[0], U.hook[1], U.hook[2]); U.bob.scale.setScalar(1); }
  function castTick(c, t) { const rod = c.props[0], a = c.at; if (!rod || !a) return; const U = rod.userData, B = U.bob.position, dt = t - c.last;
    if (c.fly < 0 && t >= 0.5 && c.reelT < 0) { U.tip.getWorldPosition(_v2); c.b0 = [_v2.x, _v2.y, _v2.z]; scene.add(U.bob); U.bob.scale.setScalar(1); bobRod = rod; B.set(_v2.x, _v2.y, _v2.z); c.fly = 0; tone(700, 0, 0.12, 'triangle', 0.05, 1400); }   // 휙
    if (c.fly >= 0 && !c.landed && c.reelT < 0) { c.fly = Math.min(1, c.fly + dt / 0.55); const u = c.fly; B.set(c.b0[0] + (a[0] - c.b0[0]) * u, c.b0[1] + (a[1] - c.b0[1]) * u + 2.8 * u * (1 - u), c.b0[2] + (a[2] - c.b0[2]) * u);
      if (u >= 1) { c.landed = true; emit(10, a[0], a[1] + 0.02, a[2], 0, 1, 0, { speed: 1.2, spread: 0.6, life: 0.5, size: 0.025, color: 0xbfe6ff }); tone(420, 0, 0.1, 'sine', 0.07, 200); } }   // 퐁
    else if (c.landed && c.reelT < 0) { let y = a[1] + Math.sin(t * 2.4) * 0.012; if (c.dipT > 0) { c.dipT -= dt; y -= 0.09 * Math.sin(Math.max(0, c.dipT) / 0.45 * Math.PI); } B.set(a[0], y, a[2]); }   // 둥둥 · 쏙
    if (c.reelT >= 0) { if (c.reelT === 0) c.r0 = [B.x, B.y, B.z]; c.reelT += dt; const u = Math.min(1, c.reelT / 0.4); U.tip.getWorldPosition(_v2);
      if (c.fly >= 0) B.set(c.r0[0] + (_v2.x - c.r0[0]) * u, c.r0[1] + (_v2.y - c.r0[1]) * u + 0.6 * u * (1 - u), c.r0[2] + (_v2.z - c.r0[2]) * u); if (c.reelT > 0.7) c.fin = true; }
    if (c.fly >= 0) { U.tip.getWorldPosition(_v2); lineSet(_v2, B); } }
  const D = {
    drink: { dur: 2.4, reach: 0.6, side: 0.13, msg: '💧 시원하게 물을 마셨어요',
      start(c) { const a = c.at, fx = -c.fwd[0], fz = -c.fwd[1];   // 꼭지에서 위로 솟아 마시는 쪽으로 휘는 포물선(아이 의견 "아래에서 물이 나와야")
        const pts = []; for (let i = 0; i <= 8; i++) { const s = i / 8; pts.push([a[0] + fx * 0.2 * s, a[1] + 4 * 0.2 * s * (1 - s) - 0.04 * s, a[2] + fz * 0.2 * s]); }
        c.pts = pts; streamSet(pts, 0.013); streamOn = false; streamF = 0; },
      tick(c, t) { if (t > 0.35 && t < c.def.dur - 0.4) { if (!streamOn) streamOn = true; if (Math.random() < 0.3) { const e = c.pts[8]; emit(1, e[0], e[1], e[2], 0, 0.6, 0, { speed: 0.6, spread: 0.6, life: 0.3, size: 0.018 }); } } else if (t >= c.def.dur - 0.4) streamOn = false; },
      pose(c, t, k) { hip(0.45 * k); K.head.rotation.x += 0.2 * k; K.head.rotation.z = -0.25 * k; K.armL.rotation.x = 0.35 * k; K.armR.rotation.x = -0.75 * k; K.armR.rotation.z = 0.12 - 0.3 * k; } },
    wash: { dur: 2.8, reach: 0.66, side: 0.1, msg: '🧼 손을 깨끗이 씻었어요',
      start(c) { const a = c.at; if (a.length > 3) streamSet([[a[0], a[1], a[2]], [a[0], (a[1] + a[3]) / 2, a[2]], [a[0], a[3], a[2]]], 0.018); },
      tick(c, t) { const dur = c.def.dur; if (t > 0.2 && t < dur - 0.6) { if (Math.random() < 0.35) { handPos(_v2); emit(1, _v2.x, _v2.y + 0.03, _v2.z, 0, 0.3, 0, { speed: 0.4, spread: 0.8, life: 0.7, size: 0.03, g: -0.3, drag: 3, color: 0xffffff }); } }
        else if (t >= dur - 0.6) { streamOn = false; if (!c.shook) { c.shook = true; handPos(_v2); emit(10, _v2.x, _v2.y, _v2.z, 0, 0.4, 0, { speed: 1.4, spread: 0.9, life: 0.5, size: 0.02 }); } } },
      pose(c, t, k) { const r = t < c.def.dur - 0.6 ? Math.sin(t * 16) : 0, sh = t >= c.def.dur - 0.6 ? Math.sin(t * 34) * 0.35 : 0; hip(0.42 * k);
        armsIn(k, -1.35 * k + r * 0.08); K.armL.rotation.z += r * 0.1 * k - sh; K.armR.rotation.z -= r * 0.1 * k - sh; } },
    sanitize: { dur: 1.8, reach: 0.6, msg: '🧴 손소독제로 손을 비볐어요',
      pose(c, t, k) { const r = t > 0.5 ? Math.sin(t * 16) : 0; if (t < 0.5) { K.armR.rotation.x = -1.4 * k + Math.sin(t * 12) * 0.1; } else { armsIn(k, -1.25 * k + r * 0.08); K.armL.rotation.z += r * 0.1 * k; K.armR.rotation.z -= r * 0.1 * k; } } },
    spray: { dur: 2.6, reach: 0.82, msg: '🌱 칙칙! 화분에 물을 뿌려 줬어요', prop: ['spray'],
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
    // EMOTE-2(10-17): 이모트 몸짓 열(net.js EMOTES 순서 = emo0~emo9 · 제자리 · 말 없음 · 움직이면 멈춤) + 하이파이브(five — 친구 쪽으로 돌아 손 내밀기)
    emo0: { dur: 1.8, reach: 0, msg: null,   // 👋 손 흔들기
      pose(c, t, k) { K.armR.rotation.x = -2.75 * k + Math.sin(t * 7) * 0.12 * k; K.armR.rotation.z = 0.12 + (0.33 + Math.sin(t * 9) * 0.35) * k; K.head.rotation.z = Math.sin(t * 4) * 0.06 * k; } },
    emo1: { dur: 1.6, reach: 0, msg: null,   // 😀 깔깔 — 어깨 들썩
      pose(c, t, k) { K.rig.position.y += Math.abs(Math.sin(t * 12)) * 0.03 * k; K.head.rotation.x -= 0.16 * k; K.rig.rotation.z = Math.sin(t * 10) * 0.05 * k; K.armL.rotation.x = K.armR.rotation.x = 0.25 * k; } },
    emo2: { dur: 1.6, reach: 0, msg: null,   // 👍 최고 — 오른손 앞으로 + 끄덕
      pose(c, t, k) { K.armR.rotation.x = -1.45 * k; K.armR.rotation.z = 0.12 - 0.25 * k; K.head.rotation.x += Math.sin(t * 6) * 0.08 * k; } },
    emo3: { dur: 2.0, reach: 0, msg: null,   // ❤️ 머리 위 하트 — 두 팔 올려 손 모으기
      tick(c, t) { if (t >= 0.6 && c.last < 0.6) { _v2.set(0, 1.75, 0.05); K.rig.localToWorld(_v2); emit(10, _v2.x, _v2.y, _v2.z, 0, 0.7, 0, { speed: 0.5, spread: 0.6, life: 0.9, size: 0.03, g: -0.3, color: 0xff7aa2 }); } },
      pose(c, t, k) { K.armL.rotation.x = K.armR.rotation.x = -2.85 * k; K.armL.rotation.z = -0.12 + 0.55 * k; K.armR.rotation.z = 0.12 - 0.55 * k; K.head.rotation.z = 0.12 * k; K.rig.rotation.z = Math.sin(t * 3) * 0.06 * k; } },
    emo4: { dur: 1.4, reach: 0, msg: null,   // 😮 깜짝 — 뒤로 젖히며 두 손을 얼굴 옆으로
      pose(c, t, k) { const j = Math.max(0, Math.sin(Math.min(1, t / 0.35) * Math.PI)); K.rig.position.y += j * 0.08; K.rig.rotation.x -= 0.16 * k; K.head.rotation.x -= 0.1 * k; armsIn(k * 0.6, -2.0 * k); } },
    emo5: { dur: 1.8, reach: 0, msg: null,   // 🎉 만세 폴짝 + 반짝이
      tick(c, t) { if (t >= 0.2 && c.last < 0.2) { _v2.set(0, 1.9, 0); K.rig.localToWorld(_v2); for (const col of [0xffd23c, 0x4fa3ff, 0xff6b8a, 0x5fcf6a]) emit(6, _v2.x, _v2.y, _v2.z, 0, 1, 0, { speed: 1.5, spread: 1, life: 1, size: 0.028, g: 3, drag: 1, color: col }); } },
      pose(c, t, k) { K.rig.position.y += Math.max(0, Math.sin(t * 7.5)) * 0.22 * k; K.armL.rotation.x = K.armR.rotation.x = -2.9 * k; K.armL.rotation.z = -0.12 - 0.35 * k; K.armR.rotation.z = 0.12 + 0.35 * k; } },
    emo6: { dur: 1.8, reach: 0, msg: null,   // 🙇 꾸벅 인사
      pose(c, t, k) { const f = Math.sin(Math.min(1, t / 1.8) * Math.PI); hip(0.7 * f); K.head.rotation.x += 0.25 * f; K.armL.rotation.x = K.armR.rotation.x = 0.1 * f; } },
    emo7: { dur: 1.8, reach: 0, msg: null,   // 👏 짝짝 박수
      tick(c, t) { const n0 = Math.floor((c.last - 0.25) * 16 / (Math.PI * 2)), n1 = Math.floor((t - 0.25) * 16 / (Math.PI * 2)); if (t > 0.25 && t < 1.6 && n1 > n0) tone(1700, 0, 0.035, 'square', 0.04); },
      pose(c, t, k) { const r = Math.max(0, Math.sin(t * 16)); armsIn(k * (0.75 - 0.25 * r), -1.3 * k); K.head.rotation.x -= 0.05 * k; } },
    emo8: { dur: 1.8, reach: 0, msg: null,   // 🙋 저요! — 오른손 번쩍
      pose(c, t, k) { K.armR.rotation.x = -3.0 * k + Math.sin(t * 8) * 0.05 * k; K.armR.rotation.z = 0.12 - 0.12 * k; K.head.rotation.x -= 0.1 * k; K.rig.position.y += Math.max(0, Math.sin(t * 5)) * 0.03 * k; } },
    emo9: { dur: 2.6, reach: 0, msg: null,   // 💃 춤 — 엉덩이 흔들기·팔 번갈아·음표
      tick(c, t) { if (t > 0.2 && t < 2.4 && Math.random() < 0.07) { _v2.set(0, 1.35, 0.15); K.rig.localToWorld(_v2); note(_v2.x, _v2.y, _v2.z); } },
      pose(c, t, k) { const s9 = Math.sin(t * 6); K.rig.rotation.z = s9 * 0.14 * k; K.rig.rotation.y = Math.sin(t * 3) * 0.35 * k; K.rig.position.y += Math.abs(s9) * 0.05 * k;
        K.armL.rotation.x = (-1.6 + s9 * 0.9) * k; K.armR.rotation.x = (-1.6 - s9 * 0.9) * k; K.armL.rotation.z = -0.12 - 0.3 * k; K.armR.rotation.z = 0.12 + 0.3 * k; K.legL.knee.rotation.x += Math.max(0, s9) * 0.35 * k; K.legR.knee.rotation.x += Math.max(0, -s9) * 0.35 * k; } },
    five: { dur: 1.2, reach: 0, msg: null,   // 🙌 하이파이브(친구 쪽으로 돌아서) — 오른손 높이 앞으로 쭉
      pose(c, t, k) { const push = Math.max(0, Math.sin(Math.min(1, t / 0.7) * Math.PI)); K.armR.rotation.x = (-2.35 + push * 0.25) * k; K.armR.rotation.z = 0.12 - 0.2 * k; K.rig.position.y += push * 0.05; K.head.rotation.x -= 0.08 * k; } },
    // TOOL-1 도구 몸짓(든 도구를 그대로 씀 — def.tool) · 알림 글 없음(게임이 결과를 말함) · o.at = 대상 자리
    dig: { dur: 2.3, reach: 0.95, msg: null, tool: 'shovel',   // 삽질 두 번(흙 알갱이 — o.color 겉흙 · o.color2 속흙 · 눈이면 흰색)
      tick(c, t) { for (const at of [0.7, 1.5]) if (t >= at && c.last < at && c.at) { const a = c.at; emit(14, a[0], a[1] + 0.04, a[2], 0, 1, 0, { speed: 1.7, spread: 0.6, life: 0.75, size: 0.04, color: c.o.color ?? 0x6b4a2e });
          emit(6, a[0], a[1] + 0.04, a[2], 0, 1, 0, { speed: 1.2, spread: 0.8, life: 0.6, size: 0.03, color: c.o.color2 ?? 0x8a6a48 }); tone(140, 0, 0.12, 'triangle', 0.1, 90); } },
      pose(c, t, k) { const u = (t - 0.3) / 0.8, ph = u < 0 ? 0 : u % 1, live = u >= 0 && u < 2, lift = live ? (ph < 0.5 ? sm(0, 0.5, ph) : 1 - sm(0.5, 0.62, ph)) : 0;
        hip((0.3 + 0.1 * (1 - lift)) * k); K.armR.rotation.x = (-0.85 + 0.45 * lift) * k; K.armL.rotation.x = (-1.05 + 0.35 * lift) * k; K.armL.rotation.z = -0.12 + 0.35 * k; K.armR.rotation.z = 0.12 - 0.1 * k;
        const p = c.props[0]; if (p) p.rotation.set(0.15 - 0.5 * lift, 0, 0.1); } },
    cast: { dur: Infinity, reach: 0, msg: null, tool: 'rod',   // 낚싯대 던지기 → 찌가 o.at(물 위)에 떠 있음 → 게임이 dip()(입질 · 찌가 쏙) · reel(잡았나) → 찌가 돌아오면 끝 · 움직이면 거둠
      start(c) { c.fly = -1; c.dipT = 0; c.reelT = -1; c.landed = false; },
      tick(c, t) { castTick(c, t); },
      end() { bobHome(); },
      pose(c, t, k) { let a = t < 0.32 ? -0.4 - 2.3 * sm(0, 0.32, t) : t < 0.6 ? -2.7 + 1.7 * sm(0.32, 0.6, t) : -1.0 + Math.sin(t * 1.3) * 0.03;
        if (c.reelT >= 0) a -= 0.7 * Math.sin(Math.min(1, c.reelT / 0.5) * Math.PI); else if (c.dipT > 0) a -= 0.08;
        K.armR.rotation.x = a; K.armR.rotation.z = 0.06; K.armL.rotation.x = -0.75 * k; K.armL.rotation.z = -0.12 + 0.3 * k; const p = c.props[0]; if (p) p.rotation.set(-1.0, 0, 0.04); },
      ctl: c => ({ get landed() { return !!c.landed; },
        dip() { if (!c.landed || c.reelT >= 0) return false; c.dipT = 0.45; const a = c.at; emit(8, a[0], a[1] + 0.02, a[2], 0, 1, 0, { speed: 0.9, spread: 0.5, life: 0.45, size: 0.022, color: 0xbfe6ff }); tone(980, 0, 0.08, 'sine', 0.08, 620); return true; },
        reel(ok) { if (c.reelT >= 0) return false; c.reelT = 0; if (ok && c.landed) { const a = c.at; emit(16, a[0], a[1] + 0.03, a[2], 0, 1, 0, { speed: 1.6, spread: 0.6, life: 0.6, size: 0.03, color: 0xbfe6ff }); }
          tone(ok ? 660 : 300, 0, 0.12, 'triangle', 0.06, ok ? 1200 : 200); return true; } }) },
    peer: { dur: 2.4, reach: 0.65, msg: null, tool: 'lens',   // 허리 숙여 돋보기로 들여다보기 · 1.25초에 대상 위 반짝
      tick(c, t) { if (t >= 1.25 && c.last < 1.25 && c.at) { const a = c.at; emit(9, a[0], a[1] + 0.12, a[2], 0, 0.7, 0, { speed: 0.5, spread: 0.7, life: 0.9, size: 0.024, g: -0.2, color: 0xfff27a }); tone(1568, 0, 0.1, 'sine', 0.05); tone(2093, 0.1, 0.12, 'sine', 0.04); } },
      pose(c, t, k) { hip(0.55 * k); K.head.rotation.x += 0.32 * k; K.armR.rotation.x = (-1.05 + Math.sin(t * 1.7) * 0.05) * k; K.armR.rotation.z = 0.12 - 0.22 * k; K.armL.rotation.x = -0.3 * k; const p = c.props[0]; if (p) p.rotation.set(-0.9, 0, 0); } },
    sweep: { dur: 2.6, reach: 0.85, msg: null, tool: 'broom',   // 좌우로 쓸기 · 한 번 쓸 때마다 알갱이(o.colors — 낙엽·눈·먼지)
      tick(c, t) { const W = 6.5, n0 = Math.floor(c.last * W / Math.PI), n1 = Math.floor(t * W / Math.PI); if (t > 0.3 && t < 2.3 && n1 > n0) { const tip = c.props[0] && c.props[0].userData.tip; if (tip) { tip.getWorldPosition(_v2); const cols = c.o.colors || [0xb8a888];
          emit(8, _v2.x, _v2.y + 0.03, _v2.z, 0, 0.6, 0, { speed: 1.3, spread: 0.9, life: 0.8, size: 0.035, g: 5, drag: 1.5, color: cols[n1 % cols.length] }); } tone(1500, 0, 0.12, 'sawtooth', 0.012, 700); } },
      pose(c, t, k) { const s9 = Math.sin(t * 6.5); hip(0.22 * k); K.rig.rotation.y = s9 * 0.38 * k; K.armR.rotation.x = -0.7 * k; K.armL.rotation.x = -0.95 * k; K.armL.rotation.z = -0.12 + 0.3 * k; const p = c.props[0]; if (p) p.rotation.set(0.1, 0, s9 * 0.3); } },
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
    for (const p of c.props) if (p.parent && p !== heldP) p.parent.remove(p);   // TOOL-1: 든 도구는 손으로 돌아감(아래 holdPlace)
    streamOn = false; streamKill = true; if (c.def.end) c.def.end(c);
    restore(); if (heldP) holdPlace();
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
    if (def.tool) c.props.push(toolUse(def.tool));   // TOOL-1: 도구 몸짓 = 든 도구 그대로(안 들었어도 그 동안만 손에)
    cur = c; if (def.start) def.start(c);
    const hd = { get done() { return cur !== c; }, stop: () => { if (cur === c) stop(); } };
    if (def.ctl) Object.defineProperties(hd, Object.getOwnPropertyDescriptors(def.ctl(c)));   // TOOL-1 cast: dip()·reel(ok)·landed
    return hd;
  }
  // 매 프레임(main.js step — 물리 뒤 · 캐릭터 위치 전): 한 발 옮기기 · 시간 · 효과
  function tick(dt) {
    busTick(dt); farTick(); fxTick(dt); streamTick(dt); wetTick(dt); holdTick();
    const c = cur; if (!c) return;
    if (c.def.sit && !ACT.sit) { stop(); return; }
    c.last = c.t; c.t += dt;
    if (c.from && c.t < 0.3) { const f = sm(0, 0.28, c.t); P.x = c.from[0] + (c.to[0] - c.from[0]) * f; P.z = c.from[1] + (c.to[1] - c.from[1]) * f; }
    else if (c.from) { P.x = c.to[0]; P.z = c.to[1]; c.from = null; }
    if (c.o.onMid && c.t >= (c.o.midAt ?? c.def.dur * 0.55) && c.last < (c.o.midAt ?? c.def.dur * 0.55)) { try { c.o.onMid(c) } catch (e) { console.error(e); } }
    if (c.def.tick) c.def.tick(c, c.t);
    if (c.t >= c.def.dur || c.fin) stop();
  }
  // kidTick 끝에서: 기본 자세 위에 덮어쓰기
  function pose() { const c = cur; if (!c && heldP && heldP.visible) holdPose(); if (!c || !c.def.pose) return; const dur = c.def.dur, k = dur === Infinity ? sm(0, 0.3, c.t) : sm(0, 0.3, c.t) * (1 - sm(dur - 0.3, dur, c.t)); c.def.pose(c, c.t, k); }
  return { play, stop, tick, pose, emit, note, micStand, busDoor, get cur() { return cur ? cur.name : null; }, get busy() { return !!cur && !cur.def.sit; }, defs: D,
    hold, holdUse, toolTip, get holding() { return held; }, get holdShown() { return !!(heldP && heldP.visible && pg.visible); },   // TOOL-1
    stats: () => ({ cur: cur && cur.name, dots: pAlive, notes: nAlive, stream: !!stream, bus: bus ? +bus.open.toFixed(2) : null, mics: MICS.length, held, holdU, line: !!(LINE && LINE.visible) }) };
}
