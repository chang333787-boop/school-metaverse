// 👥 마을 친구 그리개(TOGETHER-0 · 10-17 #46): 같은 방 친구를 마을에서 — net.js가 받고(세계·좌표 ×4·앞질러 그리기) 이 틀이 그림
//   몸 = 인스턴스 여덟(다리 둘 · 몸 · 팔 둘 · 머리(눈 = 정점 색) · 머리카락 · 모자) + 탈것 둘(🚲 자전거 · ⛵ 배) + 이름표 하나(글자 지도 한 장 + 인스턴스 · 카메라를 봄)
//   = 친구가 몇 명이든 그리기 ≤ 11번(없으면 0 — 수가 0이면 숨김) · 색 = 옷 코드(LOOK-1 k) → instanceColor · 기본 모습이면 친구 색(net PAL) 모자·윗옷
//   200m 밖 = 안 그림(작은 지도 점만 — dots()) · 이름표 = 40m 안 · 걷기 = 받은 자리의 빠르기로 팔다리 · 이모트 몸짓 = net 값(기울기·폴짝·흔들기)
//   매 프레임 새 객체 X(행렬·색 스크래치) · 친구마다 상태 하나(처음 볼 때만)
import { parseLook, lookColors } from '../js/look.js?v=1';
const MAXN = 40, TAGW = 256, TAGH = 64, TCOLS = 4, TROWS = 10, AW = TAGW * TCOLS, AH = TAGH * TROWS;
const SKIN = 0xf1c9a0, BOT = 0x2b3a55, HAIR = 0x5b3f2e;
export function createFriends({ T3, map }) {
  const FBA = (a, n) => new T3.Float32BufferAttribute(a, n), _m = new T3.Matrix4(), _c = new T3.Color();
  // 모양 굽기(정점 색 · 한 지오메트리): parts = [[geo, hex, tx, ty, tz, rx?]]
  const bake = (parts) => { const P = [], N = [], C = []; for (const [geo, hex, x, y, z, rx = 0] of parts) { const g = geo.index ? geo.toNonIndexed() : geo; _m.makeRotationX(rx).setPosition(x, y, z); g.applyMatrix4(_m); const p = g.attributes.position.array, n = g.attributes.normal.array; _c.setHex(hex);
      for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); } for (let i = 0; i < p.length / 3; i++) C.push(_c.r, _c.g, _c.b); if (g !== geo) g.dispose(); geo.dispose(); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', FBA(P, 3)); g.setAttribute('normal', FBA(N, 3)); g.setAttribute('color', FBA(C, 3)); return g; };
  const cap = (r, l) => new T3.CapsuleGeometry(r, l, 2, 8), W = 0xffffff;
  const MAT = new T3.MeshLambertMaterial({ vertexColors: true }), MV = new T3.MeshLambertMaterial({ vertexColors: true });
  const M = [], mk = (geo, mat = MAT) => { const m = new T3.InstancedMesh(geo, mat, MAXN); m.instanceMatrix.setUsage(T3.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; m.visible = false; m.userData.fx = 1; map.add(m); M.push(m); return m; };
  // 치비 아이(키 ≈1.35m · 발 = 0 · 얼굴 = +z)
  const legL = mk(bake([[cap(0.07, 0.28), W, 0, -0.2, 0]])), legR = mk(bake([[cap(0.07, 0.28), W, 0, -0.2, 0]]));
  const body = mk(bake([[cap(0.165, 0.2), W, 0, 0.66, 0]]));
  const armL = mk(bake([[cap(0.052, 0.26), W, 0, -0.18, 0]])), armR = mk(bake([[cap(0.052, 0.26), W, 0, -0.18, 0]]));
  const head = mk(bake([[new T3.SphereGeometry(0.245, 14, 10), W, 0, 1.1, 0], [new T3.SphereGeometry(0.032, 6, 4), 0x2d2a33, -0.085, 1.08, 0.225], [new T3.SphereGeometry(0.032, 6, 4), 0x2d2a33, 0.085, 1.08, 0.225]]));
  const hair = mk(bake([[new T3.SphereGeometry(0.25, 12, 8), W, 0, 1.08, -0.05]]));
  const hat = mk(bake([[new T3.SphereGeometry(0.262, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), W, 0, 1.16, -0.01], [new T3.BoxGeometry(0.3, 0.035, 0.17), 0xdbdbdb, 0, 1.18, 0.22]]));
  const PARTS = [legL, legR, body, armL, armR, head, hair, hat];
  // 탈것(정점 색 그대로 — instanceColor X)
  const bike = mk(bake([[new T3.TorusGeometry(0.26, 0.035, 6, 18).rotateY(Math.PI / 2), 0x2b2d31, 0, 0.27, 0.45], [new T3.TorusGeometry(0.26, 0.035, 6, 18).rotateY(Math.PI / 2), 0x2b2d31, 0, 0.27, -0.45], [new T3.BoxGeometry(0.05, 0.05, 0.92), 0x2f8fd0, 0, 0.55, 0], [new T3.BoxGeometry(0.05, 0.42, 0.05), 0x2f8fd0, 0, 0.42, -0.12], [new T3.BoxGeometry(0.05, 0.4, 0.05), 0x9aa0a6, 0, 0.55, 0.42], [new T3.BoxGeometry(0.46, 0.04, 0.04), 0x9aa0a6, 0, 0.76, 0.4], [new T3.BoxGeometry(0.14, 0.05, 0.24), 0x2b2d31, 0, 0.64, -0.14]]), MV);
  const boat = mk(bake([[new T3.BoxGeometry(1.3, 0.34, 2.6), 0xf4f1e8, 0, 0.17, 0], [new T3.BoxGeometry(1.42, 0.12, 2.72), 0x3b6fb6, 0, 0.34, 0], [new T3.CylinderGeometry(0.66, 0.2, 0.34, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 1.1), 0xf4f1e8, 0, 0.17, 1.55], [new T3.BoxGeometry(1.2, 0.08, 0.36), 0xb98a62, 0, 0.42, -0.5]]), MV);
  // 이름표: 글자 지도(1024×640 · 칸 40) + 판 인스턴스 · 카메라를 보는 판(정점 셰이더) · 글자 색 그대로(NoColorSpace)
  const atlas = document.createElement('canvas'); atlas.width = AW; atlas.height = AH; const ag = atlas.getContext('2d');
  const tex = new T3.CanvasTexture(atlas); tex.colorSpace = T3.NoColorSpace; tex.anisotropy = 2;
  const tagMat = new T3.ShaderMaterial({ uniforms: { map: { value: tex }, slot: { value: new T3.Vector2(TAGW / AW, TAGH / AH) }, size: { value: new T3.Vector2(1.2, 0.3) } }, transparent: true, depthWrite: false,
    vertexShader: 'attribute vec2 uvOff; uniform vec2 slot; uniform vec2 size; varying vec2 vUv; void main(){ vUv = uvOff + uv * slot; vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vec3 u = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); gl_Position = projectionMatrix * viewMatrix * vec4(c.xyz + r * position.x * size.x + u * position.y * size.y, 1.0); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.04) discard; gl_FragColor = t; }' });
  const tagGeo = new T3.PlaneGeometry(1, 1), uvOff = new T3.InstancedBufferAttribute(new Float32Array(MAXN * 2), 2); uvOff.setUsage(T3.DynamicDrawUsage); tagGeo.setAttribute('uvOff', uvOff);
  const tags = new T3.InstancedMesh(tagGeo, tagMat, MAXN); tags.frustumCulled = false; tags.count = 0; tags.visible = false; tags.renderOrder = 3; tags.userData.fx = 1; map.add(tags);
  const SLOT = new Map(), FREE = []; for (let i = TCOLS * TROWS - 1; i >= 0; i--) FREE.push(i);
  const drawSlot = (s, name) => { const x = (s % TCOLS) * TAGW, y = Math.floor(s / TCOLS) * TAGH; ag.clearRect(x, y, TAGW, TAGH); ag.fillStyle = 'rgba(255,255,255,.92)'; ag.beginPath(); ag.roundRect(x + 4, y + 6, TAGW - 8, TAGH - 12, 22); ag.fill();
    ag.fillStyle = '#1d3557'; ag.font = '800 34px sans-serif'; ag.textAlign = 'center'; ag.textBaseline = 'middle'; ag.fillText(String(name).slice(0, 8), x + TAGW / 2, y + TAGH / 2 + 2); tex.needsUpdate = true; };
  // 친구마다 상태(처음 볼 때 하나): 걷기 위상·빠르기·색(옷 코드가 바뀌면 다시)
  const ST = new Map(); let FR = 0;
  const colorsOf = (S, O) => { const L = parseLook(O.k), lc = L ? lookColors(L) : null; S.cTop.setHex(lc ? lc.top : O.c); S.cBot.setHex(lc ? lc.bot : BOT); S.cSkin.setHex(lc ? lc.skin : SKIN); S.cHair.setHex(lc ? lc.hair : HAIR); S.cCap.setHex(lc ? lc.cap : O.c); S.sig = O.k + ':' + O.c; };
  const st = (O) => { let S = ST.get(O.pid); if (!S) { S = { ph: Math.random() * 6, lx: O.x, lz: O.z, sp: 0, sig: '', cTop: new T3.Color(), cBot: new T3.Color(), cSkin: new T3.Color(), cHair: new T3.Color(), cCap: new T3.Color(), seen: 0, slot: -1, name: '' }; ST.set(O.pid, S); } if (S.sig !== O.k + ':' + O.c) colorsOf(S, O); return S; };
  const B = new T3.Matrix4(), L9 = new T3.Matrix4(), R9 = new T3.Matrix4(), T9 = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler(0, 0, 0, 'YXZ'), V = new T3.Vector3(), ONE = new T3.Vector3(1, 1, 1);
  const limb = (m, i, px, py, ax) => { L9.makeRotationX(ax); L9.setPosition(px, py, 0); R9.multiplyMatrices(B, L9); m.setMatrixAt(i, R9); };
  let n = 0, nb = 0, no = 0, nt = 0, dtNow = 0, CP = null, last = { n: 0, tags: 0, bike: 0, boat: 0 };
  const one = (O) => { if (n >= MAXN) return; const dx = O.x - CP.x, dz = O.z - CP.z, d2 = dx * dx + dz * dz; if (d2 > 40000) return;   // 200m 밖 = 작은 지도 점만
    const S = st(O); S.seen = FR; const mv = Math.hypot(O.x - S.lx, O.z - S.lz); S.lx = O.x; S.lz = O.z; S.sp += (Math.min(8, mv / Math.max(dtNow, 1e-3)) - S.sp) * Math.min(1, dtNow * 8); S.ph += dtNow * (4 + S.sp * 1.6);
    const v = O.v, i = n++; let lift = 0, lean = 0, aL, aR, lL, lR;
    const sw = Math.sin(S.ph) * Math.min(0.75, S.sp * 0.28);
    if (v === 'b') { lift = 0.34; lean = 0.25; aL = aR = -1.15; lL = -1.05 + Math.sin(S.ph * 1.4) * 0.45; lR = -1.05 - Math.sin(S.ph * 1.4) * 0.45; }
    else if (v === 'o') { lift = 0.2; aL = aR = -0.4 + Math.sin(S.ph) * 0.05; lL = lR = -1.45; }
    else if (v === 'z') { lift = 0.05; aL = aR = -0.5; lL = lR = -1.5; }
    else if (v === 'k') { lean = 0.3; aL = aR = -0.7; lL = lR = -0.45; }
    else { aL = -sw * 0.9; aR = sw * 0.9; lL = sw; lR = -sw; }
    E.set((O.mrx || 0) + lean, O.h + (O.mry || 0), O.mrz || 0); Q.setFromEuler(E); V.set(O.x, O.y + lift + (O.mdy || 0), O.z); B.compose(V, Q, ONE);
    limb(legL, i, -0.075, 0.42, lL); limb(legR, i, 0.075, 0.42, lR); body.setMatrixAt(i, B); head.setMatrixAt(i, B); hair.setMatrixAt(i, B); hat.setMatrixAt(i, B); limb(armL, i, -0.2, 0.84, aL); limb(armR, i, 0.2, 0.84, aR);
    legL.setColorAt(i, S.cBot); legR.setColorAt(i, S.cBot); body.setColorAt(i, S.cTop); armL.setColorAt(i, S.cTop); armR.setColorAt(i, S.cTop); head.setColorAt(i, S.cSkin); hair.setColorAt(i, S.cHair); hat.setColorAt(i, S.cCap);
    if (v === 'b' || v === 'o') { E.set(0, O.h, 0); Q.setFromEuler(E); V.set(O.x, O.y - (v === 'o' ? 0.25 : 0), O.z); T9.compose(V, Q, ONE); if (v === 'b') bike.setMatrixAt(nb++, T9); else boat.setMatrixAt(no++, T9); }
    if (d2 < 1600 && nt < MAXN) { if (S.slot < 0 || S.name !== O.n) { if (S.slot < 0) { if (!FREE.length) { let old = null, ot = 1e9; for (const [p9, S9] of ST) if (S9.slot >= 0 && S9.seen < ot && S9 !== S) { ot = S9.seen; old = S9; } if (old) { FREE.push(old.slot); old.slot = -1; } } S.slot = FREE.length ? FREE.pop() : 0; } S.name = O.n; drawSlot(S.slot, O.n); }
      const s9 = S.slot; uvOff.setXY(nt, (s9 % TCOLS) * TAGW / AW, 1 - (Math.floor(s9 / TCOLS) + 1) * TAGH / AH); T9.makeTranslation(O.x, O.y + lift + 1.62, O.z); tags.setMatrixAt(nt++, T9); } };
  const fin = (m, c) => { m.count = c; m.visible = c > 0; if (c) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } };
  const API = {
    update(dt) { const MP = window.SM_MP, N = MP && MP.net && MP.net(); if (!N || !N.each) { if (last.n || last.tags) { for (const m of PARTS) fin(m, 0); fin(bike, 0); fin(boat, 0); fin(tags, 0); last.n = last.tags = 0; } return; }
      N.ext(true); FR++; dtNow = dt; CP = map.camera.position; n = nb = no = nt = 0; N.each(one);
      for (const m of PARTS) fin(m, n); fin(bike, nb); fin(boat, no); fin(tags, nt); if (nt) uvOff.needsUpdate = true; last.n = n; last.tags = nt; last.bike = nb; last.boat = no;
      if ((FR & 255) === 0) for (const [p9, S9] of ST) if (FR - S9.seen > 600) { if (S9.slot >= 0) FREE.push(S9.slot); ST.delete(p9); } },   // 오래 안 보인 친구 상태 치움
    dots(g, toXY) { const MP = window.SM_MP, N = MP && MP.net && MP.net(); if (!N || !N.each) return 0; let k = 0; N.each(O => { const [a, b] = toXY(O.x, O.z); g.fillStyle = '#' + (O.c >>> 0).toString(16).padStart(6, '0'); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(a, b, 3.5, 0, 7); g.fill(); g.stroke(); k++; }); return k; },
    get stats() { return { ...last, calls: (last.n ? PARTS.length : 0) + (last.bike ? 1 : 0) + (last.boat ? 1 : 0) + (last.tags ? 1 : 0), states: ST.size }; },
    dispose() { const MP = window.SM_MP, N = MP && MP.net && MP.net(); if (N && N.ext) N.ext(false); for (const m of [...M, tags]) { map.remove(m); m.geometry.dispose(); m.dispose && m.dispose(); } MAT.dispose(); MV.dispose(); tagMat.dispose(); tex.dispose(); ST.clear(); if (window.SM_FRIENDS === API) delete window.SM_FRIENDS; },
  };
  window.SM_FRIENDS = API;   // 시험·디버그(stats)
  return API;
}
