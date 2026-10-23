// 🏖 해수욕장 놀이(SEA-1 · 사용자 10-17 '바다 상호작용이 별로 없는 거 같긴 한데 기분 탓인가'): 놀이 코드와 떼어 둔 규칙·그림(town_res.js와 같은 결)
//   아이 판의 해수욕장(모래 swim · 안전요원 망루 — 패들렛 지원·인우)이 있을 때만 켜짐 · 없는 바다 놀이를 지어내지 않음
//   누워 뜨기(생존수영) = 헤엄치는 곳 물속에서 E → 누워 떠서 ←→로 살살 균형 잡기 · 모래성 = 알맞은 모래(물 조금) 고르기 → 해변에 남음(밤사이 파도에 씻김)
//   바닷바람 연 날리기 = 낮·밤 바람 방향 고르기(해풍·육풍) → 연이 바람 따라 날아감 · 셋 다 끝에 사실 한 줄 · 셈 X · 도장(도감) · 솜씨
//   그리기 = 모래성 인스턴스 하나(있을 때만) · 연 = 날리는 동안만 둘(그림 + 줄) · 매 프레임 = 하는 동안만 · 새 객체 X · 새 Light X
export const BEACH_V = 1;
const T2 = (ko, en) => [ko, en];
export const BEACH_T = {
  castleQ: T2('어떤 모래로 쌓을까요?', 'Which sand will hold a castle?'),
  sand: [['dry', '☀️', T2('바싹 마른 모래', 'Bone-dry sand'), T2('와르르! 마른 모래알은 서로 붙지 않아서 무너져요', 'It crumbles — dry grains don’t stick together')], ['wet', '💧', T2('물을 조금 섞은 모래', 'Sand with a little water'), null], ['soak', '🌊', T2('물이 흥건한 모래', 'Soaking-wet sand'), T2('주르륵! 물이 너무 많으면 모래가 흘러내려요', 'It slides away — too much water makes it runny')]],
  castleFact: T2('모래에 물을 조금 섞으면 모래알 사이의 물이 알갱이를 서로 붙잡아 줘서 모양이 버텨요', 'A little water between sand grains holds them together, so the shape stays'),
  windQ: [T2('지금은 낮이에요. 바람은 어느 쪽에서 어느 쪽으로 불까요?', 'It’s daytime. Which way does the wind blow?'), T2('지금은 밤이에요. 바람은 어느 쪽에서 어느 쪽으로 불까요?', 'It’s night. Which way does the wind blow?')],
  wind: [['s2l', T2('바다에서 땅 쪽으로', 'From the sea to the land')], ['l2s', T2('땅에서 바다 쪽으로', 'From the land to the sea')]],
  windWhy: [T2('낮에는 땅이 바다보다 빨리 데워져요 — 그럼 바람은?', 'By day the land warms faster than the sea — so the wind…?'), T2('밤에는 땅이 바다보다 빨리 식어요 — 그럼 바람은?', 'At night the land cools faster than the sea — so the wind…?')],
  windFact: [T2('낮에는 땅이 바다보다 빨리 데워져서 바다에서 땅 쪽으로 바닷바람(해풍)이 불어요', 'By day the land warms faster, so a sea breeze blows from sea to land'), T2('밤에는 땅이 바다보다 빨리 식어서 땅에서 바다 쪽으로 육풍이 불어요', 'At night the land cools faster, so a land breeze blows from land to sea')],
  floatFact: [T2('물에 빠지면 누워서 팔다리를 넓게 벌리고 가만히 떠서 구조를 기다려요(생존수영 누워 뜨기)', 'If you fall in, lie back with arms and legs spread and float calmly until help comes'), T2('친구가 물에 빠지면 뛰어들지 말고, 어른과 119에 알리고 물에 뜨는 물건을 던져 줘요', 'If a friend falls in, don’t jump in — tell an adult, call 119 and throw something that floats')],
};
// 모래성 그림(낮은 폴리 · 정점색): 바닥 + 네 귀퉁이 탑 + 가운데 탑 + 뾰족 지붕
function castleGeo(T3) { const P = [], N = [], C = [], part = (g, x, y, z, v) => { const q = g.toNonIndexed(); g.dispose(); q.translate(x, y, z); P.push(...q.attributes.position.array); N.push(...q.attributes.normal.array); for (let i = 0; i < q.attributes.position.count; i++) C.push(v[0], v[1], v[2]); q.dispose(); };
  const s0 = [0.86, 0.74, 0.5], s1 = [0.8, 0.67, 0.44], s2 = [0.92, 0.8, 0.56];
  part(new T3.BoxGeometry(1.1, 0.32, 1.1), 0, 0.16, 0, s0); for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) { part(new T3.CylinderGeometry(0.15, 0.17, 0.5, 7), x, 0.57, z, s1); part(new T3.ConeGeometry(0.17, 0.22, 7), x, 0.93, z, s2); }
  part(new T3.BoxGeometry(0.5, 0.55, 0.5), 0, 0.6, 0, s2); part(new T3.ConeGeometry(0.34, 0.42, 4), 0, 1.08, 0, s1);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return g; }
// 연 그림(캔버스 한 장 · 마름모 + 꼬리)
function kiteTex(T3) { const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d'); g.translate(32, 30); g.fillStyle = '#e0453a'; g.beginPath(); g.moveTo(0, -26); g.lineTo(20, 0); g.lineTo(0, 26); g.lineTo(-20, 0); g.closePath(); g.fill(); g.fillStyle = '#f2c230'; g.beginPath(); g.moveTo(0, -26); g.lineTo(20, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, 26); g.lineTo(-20, 0); g.lineTo(0, 0); g.closePath(); g.fill();
  g.strokeStyle = '#7a4a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 26); g.moveTo(-20, 0); g.lineTo(20, 0); g.stroke(); g.strokeStyle = '#2f6fd0'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 26); g.quadraticCurveTo(8, 40, 0, 52); g.quadraticCurveTo(-8, 60, 0, 64); g.stroke();
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; }

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · swim() → SWIM · swimAt · sdOf · bboxOf · seaSd · gy(x, z) · SEAY() · openP · closeP · esc · lang() · night() · busy() · enth · root() · FOGM · stamp(e) · skUp · tev · alive() · blk(x, z, y)
export function createBeach(A) {
  const T3 = A.T3, M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), UP = new T3.Vector3(0, 1, 0);
  let on = false, HC = null, HK = null, HF = null, CG = null, CM = null, CI = null, CC = [], grow = -1, growT = 0, KT = null, KS = null, KL = null, KLG = null, kite = null, fl = null, fq = 0, FEL = null;
  const en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], S = () => A.GAME.S;
  const sh = () => (A.swim() || {}).sh;
  // 짓기 때: 해수욕장 마른 모래 두 자리(모래성 · 연) + 물속 '누워 뜨기'(물에 들어가면 그 자리로 따라오는 E 하나)
  function init() { clear(); const W = A.swim(); if (!W || !W.sh) return; const s9 = W.sh, [x0, z0, x1, z1] = A.bboxOf(s9), C = [];
    for (let z = z0 + 2; z < z1; z += 3) for (let x = x0 + 2; x < x1; x += 3) { if (A.sdOf(s9, x, z) > -2.5) continue; const y = A.gy(x, z); if (y < A.SEAY() + 0.45 || A.blk(x, z, y + 0.6)) continue; C.push([x, z, y]); }
    if (C.length < 2) return; const cx = C.reduce((a, q) => a + q[0], 0) / C.length, cz = C.reduce((a, q) => a + q[1], 0) / C.length; C.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
    const a = C[0], b = C.find(q => Math.hypot(q[0] - a[0], q[1] - a[1]) > 12) || C[C.length - 1]; on = true;
    HC = A.map.interact.add({ kind: 'game', x: a[0], z: a[1], y: a[2], r: 2.2, label: en() ? '🏰 Build a sandcastle' : '🏰 모래성 쌓기', use: castle }); A.enth.push(HC);
    HK = A.map.interact.add({ kind: 'game', x: b[0], z: b[1], y: b[2], r: 2.2, label: en() ? '🌬️ Fly a kite in the sea breeze' : '🌬️ 바닷바람 연 날리기', use: kiteQ }); A.enth.push(HK);
    HF = A.map.interact.add({ kind: 'game', x: a[0], z: a[1], y: a[2], r: 1.6, label: en() ? '🏊 Float on your back (survival swimming)' : '🏊 누워 뜨기 (생존수영)', use: floatGo }); HF.hot.off = true; A.enth.push(HF); draw(); }
  function clear() { on = false; HC = HK = HF = null; if (CI && CI.parent) CI.parent.remove(CI); for (const h of CC) h.remove(); CC = []; kiteEnd(); }
  // ── 모래성 ──
  function draw() { const L9 = S().castles || []; for (const h of CC) h.remove(); CC = []; if (!L9.length) { if (CI) CI.count = 0; return; }
    if (!CI) { CG = castleGeo(T3); CM = new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true }); CI = new T3.InstancedMesh(CG, CM, 4); CI.userData.fx = 1; CI.matrixAutoUpdate = false; }
    L9.forEach(([x, y, z, ry], i) => { const k = i === grow ? Math.min(1, growT / 0.6) : 1; M4.compose(V4.set(x, y - 0.02, z), Q4.setFromAxisAngle(UP, ry), S4.set(k, Math.max(0.05, k), k)); CI.setMatrixAt(i, M4); if (k >= 1) CC.push(A.map.collider.add({ x0: x - 0.55, x1: x + 0.55, z0: z - 0.55, z1: z + 0.55, y0: y, y1: y + 0.9, nc: true })); });
    CI.count = L9.length; CI.instanceMatrix.needsUpdate = true; CI.computeBoundingSphere(); const root = A.root(); if (CI.parent !== root) root.add(CI); const b = CI.boundingSphere; if (b && !A.FOGM.some(o => o.m === CI)) A.FOGM.push({ m: CI, cx: b.center.x, cz: b.center.z, r: b.radius + 40 }); }
  function castle() { if (A.busy()) return; const e = en(), row = q => '<div class="st"><b class="n">' + q[1] + '</b><span style="flex:1"><b>' + A.esc(L(q[2])) + '</b></span><button class="sub" data-s="' + q[0] + '">' + (e ? 'Use this' : '이걸로') + '</button></div>';
    const P9 = A.openP('<h3>🏰 ' + (e ? 'Sandcastle' : '모래성 쌓기') + '</h3><div class="sm">' + A.esc(L(BEACH_T.castleQ)) + '</div>' + BEACH_T.sand.map(row).join('') + '<div class="sm twn-bmsg"></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'beach');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const q = BEACH_T.sand.find(s9 => s9[0] === b.dataset.s); if (!q) return;
      if (q[3]) { A.map.sfx && A.map.sfx('pop'); P9.querySelector('.twn-bmsg').textContent = L(q[3]); return; } A.closeP(); build(); }; }
  function build() { const me = A.map.player.get(), a = (me.h || 0) * Math.PI / 180, x = me.x + Math.sin(a) * 1.8, z = me.z - Math.cos(a) * 1.8, y = A.gy(x, z), s9 = sh(), e = en();
    if (!s9 || A.sdOf(s9, x, z) > -0.5 || y < A.SEAY() + 0.3 || A.blk(x, z, y + 0.5) || Math.abs(y - me.y) > 0.8) { A.map.hud.toast(e ? '🏰 Not enough room — try open sand' : '🏰 여기는 자리가 좁아요 — 넓은 모래밭에서 해 봐요', 2.6); return; }
    const L9 = S().castles || (S().castles = []); L9.push([+x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +(-a).toFixed(3)]); if (L9.length > 4) L9.shift(); grow = L9.length - 1; growT = 0; A.GAME.mark(); draw(); A.map.sfx && A.map.sfx('ding');
    const first = A.stamp('🏰'); A.skUp('explore', first ? 3 : 1, 'beach:castle'); A.tev('beach'); A.map.hud.banner('🏰 ' + (e ? 'Sandcastle built!' : '모래성 완성!') + (first ? (e ? ' Sandcastle stamp' : ' 모래성 도장') : ''), 2.4);
    setTimeout(() => { if (A.alive()) A.map.hud.toast('💡 ' + L(BEACH_T.castleFact), 5); }, 2500); }
  // 새 날(잠든 사이): 모래성은 파도에 씻겨 감
  function day() { const L9 = S().castles; if (!L9 || !L9.length) return; S().castles = []; A.GAME.mark(); draw(); setTimeout(() => { if (A.alive()) A.map.hud.toast(en() ? '🌊 The waves washed the sandcastles away overnight' : '🌊 밤사이 파도에 모래성이 씻겨 갔어요', 3); }, 3200); }
  // ── 바닷바람 연 날리기 ──
  function kiteQ() { if (A.busy() || kite) return; const e = en(), nt = A.night() >= 1 ? 1 : 0, ans = nt ? 'l2s' : 's2l';
    const P9 = A.openP('<h3>🌬️ ' + (e ? 'Sea-breeze kite' : '바닷바람 연 날리기') + '</h3><div class="sm">' + A.esc(L(BEACH_T.windQ[nt])) + '</div>' + BEACH_T.wind.map(q => '<div class="st"><span style="flex:1"><b>' + A.esc(L(q[1])) + '</b></span><button class="sub" data-w="' + q[0] + '">' + (e ? 'This way' : '이쪽') + '</button></div>').join('') + '<div class="sm twn-bmsg"></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'beach');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (!b.dataset.w) return;
      if (b.dataset.w !== ans) { A.map.sfx && A.map.sfx('pop'); P9.querySelector('.twn-bmsg').textContent = L(BEACH_T.windWhy[nt]); return; } A.closeP(); fly(nt); }; }
  function fly(nt) { const me = A.map.player.pos(), W = A.swim(), sea = W ? W.g.reduce((o, v, i) => { if (v === 1) { o[0] += W.x0 + ((i % W.nx) + 0.5) * 2; o[1] += W.z0 + (((i / W.nx) | 0) + 0.5) * 2; o[2]++; } return o; }, [0, 0, 0]) : [0, 0, 0], gx = sea[2] ? me.x - sea[0] / sea[2] : 1, gz = sea[2] ? me.z - sea[1] / sea[2] : 0, gl = Math.hypot(gx, gz) || 1, s9 = nt ? -1 : 1;   /* 땅 쪽 = 헤엄치는 곳(바다) 가운데에서 내 자리 쪽(모래밭은 물가에서 멀어 바다 거리 기울기가 0일 수 있음) — 연을 띄울 때 한 번만 셈 */   /* 땅 쪽 = 바다에서 멀어지는 쪽 · 낮 = 연이 땅 쪽으로 · 밤 = 바다 쪽으로 */
    if (!KT) { KT = kiteTex(T3); KS = new T3.Sprite(new T3.SpriteMaterial({ map: KT, transparent: true, depthWrite: false })); KS.scale.set(1.6, 2.4, 1); KS.userData.fx = 1; KLG = new T3.BufferGeometry(); KLG.setAttribute('position', new T3.BufferAttribute(new Float32Array(6), 3)); KL = new T3.Line(KLG, new T3.LineBasicMaterial({ color: 0xf6f4ee })); KL.frustumCulled = false; KL.userData.fx = 1; }
    A.map.add(KS); A.map.add(KL); KS.visible = KL.visible = true; kite = { t: 0, dx: gx / gl * s9, dz: gz / gl * s9, nt }; A.map.player.lookAt([me.x + kite.dx * 20, me.z + kite.dz * 20]);   /* 연이 나는 쪽(바람이 불어 가는 쪽)을 보게 */
    A.map.sfx && A.map.sfx('ding'); A.map.hud.banner('🌬️ ' + (en() ? 'Up it goes — the kite flies with the wind!' : '연이 바람을 타고 날아올라요!'), 2.6); const first = A.stamp('🌬️'); A.skUp('look', first ? 3 : 1, 'beach:kite'); A.tev('beach');
    setTimeout(() => { if (A.alive()) A.map.hud.toast('💡 ' + L(BEACH_T.windFact[nt]), 5.5); }, 2800); }
  function kiteEnd() { if (KS && KS.parent) KS.parent.remove(KS); if (KL && KL.parent) KL.parent.remove(KL); kite = null; }
  // ── 누워 뜨기(생존수영) ──
  function floatGo() { if (A.busy() || fl) return; const me = A.map.player.pos(); if (!A.swimAt(me.x, me.z)) return; const e = en(), gnd = A.gy(me.x, me.z), lift = Math.max(0.2, A.SEAY() - gnd - 0.12);
    A.map.player.freeze(true); A.map.player.pose('lie', { y: lift }); fl = { t: 0, x: 0, v: 0, ok: 0, n: 0, T: 10, push: 0, ph: Math.random() * 6 }; A.map.sfx && A.map.sfx('pop');
    FEL = document.createElement('div'); FEL.className = 'twn-play'; FEL.innerHTML = '<div class="pb"><b>🏊 ' + (e ? 'Float on your back' : '누워 뜨기') + '</b><small>' + (e ? 'Relax, spread your arms and legs, breathe slowly' : '몸에 힘을 빼고 팔다리를 넓게 — 숨은 천천히') + '</small><div class="mg"><div class="bar"><i class="zone" style="left:35%;width:30%"></i><i class="mk"></i></div><div class="bar" style="height:8px"><i class="tm" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:#7fd06a;transform-origin:0 50%"></i></div></div><div class="msg">' + (e ? 'Waves tip you — nudge back with ← → to stay in the green' : '물결에 몸이 기울면 ←→로 살살 바로잡아 초록 칸 안에') + '</div><div class="row"><button data-f="-1">◀</button><button data-f="1">▶</button><button class="sub" data-a="x">' + (e ? 'Stop' : '그만') + '</button></div></div>';
    document.body.appendChild(FEL); const hold = (d, v) => { fl.push = v ? d : 0; };
    FEL.addEventListener('pointerdown', ev => { const b = ev.target.closest('button'); if (!b) return; ev.preventDefault(); if (b.dataset.a === 'x') return floatEnd(true); hold(+b.dataset.f, true); }); FEL.addEventListener('pointerup', () => hold(0, false)); FEL.addEventListener('pointerleave', () => hold(0, false));
    fl.kd = ev => { const d = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[ev.code]; if (ev.code === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); return floatEnd(true); } if (!d) return; ev.preventDefault(); ev.stopImmediatePropagation(); fl.push = d; };
    fl.ku = ev => { if ({ ArrowLeft: 1, KeyA: 1, ArrowRight: 1, KeyD: 1 }[ev.code]) fl.push = 0; };
    addEventListener('keydown', fl.kd, true); addEventListener('keyup', fl.ku, true); }
  function floatEnd(stop) { const f = fl; if (!f) return; fl = null; removeEventListener('keydown', f.kd, true); removeEventListener('keyup', f.ku, true); if (FEL) { FEL.remove(); FEL = null; } A.map.player.pose(null); A.map.player.freeze(false); const e = en();
    if (stop) { A.map.hud.toast(e ? 'See you next time!' : '다음에 또 해요!', 2); return; } const good = f.ok / Math.max(1, f.n) >= 0.65;
    if (!good) { A.map.sfx && A.map.sfx('pop'); A.map.hud.toast(e ? '🏊 Almost — relax and try again (E)' : '🏊 아까워요 — 힘을 빼고 다시 해 봐요 (E)', 3); return; }
    const first = A.stamp('🏊'); A.skUp('explore', first ? 3 : 1, 'beach:swim'); A.tev('beach'); A.map.sfx && A.map.sfx('done'); A.map.hud.banner('🏊 ' + (e ? 'You floated calmly!' : '가만히 잘 떴어요!') + (first ? (e ? ' Survival-swimming stamp' : ' 생존수영 도장') : ''), 2.6);
    setTimeout(() => { if (A.alive()) A.map.hud.toast('💡 ' + L(BEACH_T.floatFact[(S().day || 0) % 2]), 6); }, 2800); }
  // 매 프레임(하는 동안만): 모래성 솟기 0.6초 · 연(줄·흔들림) · 누워 뜨기 균형 · 0.5초마다 물속이면 '누워 뜨기' E를 내 자리로
  function tick(dt) { if (!on) return;
    if (grow >= 0) { growT += dt; const q = (S().castles || [])[grow]; if (q && CI) { const k = Math.min(1, growT / 0.6); M4.compose(V4.set(q[0], q[1] - 0.02, q[2]), Q4.setFromAxisAngle(UP, q[3]), S4.set(k, Math.max(0.05, k), k)); CI.setMatrixAt(grow, M4); CI.instanceMatrix.needsUpdate = true; } if (growT >= 0.6) { grow = -1; draw(); } }   /* 솟는 동안 = 그 하나의 행렬만(충돌은 다 솟은 뒤 한 번) */
    if (kite) { kite.t += dt; const me = A.map.player.pos(), k = Math.min(1, kite.t / 2.5), d = 4 + 10 * k, h = 1.3 + 1.4 * k + Math.sin(kite.t * 1.3) * 0.3,   /* 3인칭 카메라 시야 안 — 더 높으면 화면 위 띠(나침반·장소) 뒤로 숨음 */ sx = Math.sin(kite.t * 0.9) * 1.2; KS.position.set(me.x + kite.dx * d - kite.dz * sx, me.y + h, me.z + kite.dz * d + kite.dx * sx); KS.material.rotation = Math.sin(kite.t * 1.7) * 0.25;
      const P = KLG.attributes.position.array; P[0] = me.x; P[1] = me.y + 1.1; P[2] = me.z; P[3] = KS.position.x; P[4] = KS.position.y - 0.7; P[5] = KS.position.z; KLG.attributes.position.needsUpdate = true; if (kite.t > 14 || A.busy()) kiteEnd(); }
    if (fl) { const f = fl; f.t += dt; const wave = 0.55 * Math.sin(f.t * 1.4 + f.ph) + 0.35 * Math.sin(f.t * 2.9 + f.ph * 2); f.v += (wave * 0.9 + f.push * 1.6 - f.v * 1.2) * dt; f.x = Math.max(-1, Math.min(1, f.x + f.v * dt)); f.n++; if (Math.abs(f.x) < 0.3) f.ok++;
      if (FEL) { const mk = FEL.querySelector('.mk'), tm = FEL.querySelector('.tm'); if (mk) mk.style.left = (50 + f.x * 50).toFixed(1) + '%'; if (tm) tm.style.transform = 'scaleX(' + Math.max(0, 1 - f.t / f.T).toFixed(3) + ')'; } if (f.t >= f.T) floatEnd(false); return; }
    if ((fq += dt) > 0.5 && HF) { fq = 0; const me = A.map.player.pos(), inW = A.swimAt(me.x, me.z) && !A.busy(); if (inW) { const h = HF.hot; h.x = me.x; h.z = me.z; h.y = me.y; if (h.off) h.off = false; } else if (!HF.hot.off) HF.hot.off = true; } }
  function dispose() { clear(); if (fl) floatEnd(true); for (const o of [CG, CM, KT, KLG]) if (o) o.dispose(); if (KS) KS.material.dispose(); if (KL) KL.material.dispose(); CI = CG = CM = KT = KS = KL = KLG = null; }
  return { init, tick, day, dispose, get on() { return on; }, castles: () => (S().castles || []).length, get kite() { return !!kite; }, get floating() { return !!fl; }, swimPt: () => { const W = A.swim(); if (!W) return null; const L9 = []; for (let j = 0; j < W.nz; j++) for (let i = 0; i < W.nx; i++) if (W.g[j * W.nx + i] === 1) L9.push([W.x0 + (i + 0.5) * 2, W.z0 + (j + 0.5) * 2]); return L9.length ? L9[(L9.length / 2) | 0] : null; }, spots: () => [HC, HK, HF].map(h => h && { x: +h.hot.x.toFixed(1), z: +h.hot.z.toFixed(1), y: +h.hot.y.toFixed(2), off: !!h.hot.off, label: h.hot.label }) };
}
