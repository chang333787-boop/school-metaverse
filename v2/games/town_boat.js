// ⛵ 배 넓히기(BOAT-2 · 발전 방향 #36 · 교사 10-17): 노 젓기(박자) · 바닷길 부표 · 밤 등대 빛살 — 놀이 코드와 떼어 둔 규칙·그림(town_res.js와 같은 결)
//   노 젓기 = 지금 배 몰기(W 앞으로 · A/D 돌기) 위에 한 겹: 왼쪽(←·A)·오른쪽(→·D)을 번갈아 누르면 노가 한 번씩 · 박자(0.7초)가 맞을수록 빨라짐 · 너무 빨리 연타 = 힘이 안 실림('천천히 크게')
//   바닷길 = 선착장 앞 바다에 부표 4~6(✨ — 아이 판 바다·양식장·해수욕장 피함) · 노란 부표를 차례로 지나면 반짝 · 끝 = 이웃(어부) 한 줄 · 탐험 솜씨
//   밤 등대 = 마을에 등대가 있을 때만(없으면 X) · MeshBasic 빛살(새 Light X · 인스턴스 하나 = 그리기 +1 · 밤에만) · 등대의 쓰임 한 줄(사실)
//   매 프레임 = 배를 탄 동안 노·박자 막대 · 밤엔 빛살 돌리기(등대 수만큼 setMatrixAt) — 새 객체 X
export const BOAT_V = 1;
const BEAT = 0.7, WIN = 0.2, FAST = 0.3;   // 박자: 노 두 번 사이 0.7초가 알맞음 · ±0.2초 = 잘 맞음 · 0.3초보다 빠르면 연타
export const ROW_T = { good: ['좋아요! 영차', 'Nice stroke!'], ok: ['조금 더 박자에 맞춰요', 'Try to keep the beat'], fast: ['천천히 크게 저어요 — 왼쪽·오른쪽을 번갈아', 'Slow, big strokes — left, right, left'], same: ['왼쪽·오른쪽을 번갈아 저어요', 'Alternate left and right'] };

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · boat() → BOAT(x·z·h·on·grp) · harb() → HARB · lhs() → 등대 [x, z, 등 높이, 크기] · seaSd · swimAt · occHit · inWalk · root() · FOGM · lang() · night() → 0·0.5·1 · busy() 창·놀이·대화 · dialog · skUp · tev · alive() · SEAY
export function createBoatX(A) {
  const T3 = A.T3, M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), E4 = new T3.Euler(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), C4 = new T3.Color(), OUT = { v: 0, dh: 0 };
  let rv = 0, dh = 0, last = -9, side = '', streak = 0, hintT = 0, OAR = null, oarT = [9, 9], hud = null, mk = null, lab = null, labT = 0;
  let BEAM = null, BG = null, BM = null, ang = 0, bTold = -1, BUOY = null, BUG = null, BUM = null, CRS = [], next = 0, pulse = -1, pulseT = 0, done9 = -1;
  const en = () => A.lang() === 'en', now = () => performance.now() / 1000, T = k => ROW_T[k][en() ? 1 : 0];
  // ── 노 젓기 ──
  function row(s) { const B = A.boat(); if (!B.on || A.busy()) return; const t = now(), dt = t - last; let k, g;
    if (s === side && dt < 1.2) { k = 'same'; g = 0.3; streak = 0; }
    else if (dt < FAST) { k = 'fast'; g = 0.1; streak = 0; }
    else if (Math.abs(dt - BEAT) <= WIN) { streak = Math.min(4, streak + 1); k = 'good'; g = 1.4 + 0.15 * streak; }
    else { k = 'ok'; g = dt > 1.2 ? 0.9 : 1.1; streak = 0; }
    rv = Math.min(6.5, rv + g); dh += s === 'L' ? -0.035 : 0.035; last = t; side = s; oarT[s === 'L' ? 0 : 1] = 0; A.map.sfx && A.map.sfx(k === 'good' ? 'tick' : 'pop');
    if (lab) { lab.textContent = T(k); lab.className = 'rl ' + k; labT = 1.2; }
    if (k === 'fast' && t > hintT) { hintT = t + 4; A.map.hud.toast('🚣 ' + T('fast'), 2.2); } }
  // 배 몰기 한 프레임(마을 boatTick이 부름): 노 속도(천천히 줄어듦 — 물 위로 미끄러짐) · 노가 돌린 만큼 · 노 그림 · 박자 막대
  function step(dt) { rv *= Math.exp(-0.45 * dt); if (rv < 0.02) rv = 0; OUT.v = rv; OUT.dh = dh; dh = 0;
    if (OAR) { for (let i = 0; i < 2; i++) { oarT[i] += dt; oarM(i); } OAR.instanceMatrix.needsUpdate = true; }
    if (mk) { const t = Math.min(1.4, now() - last); mk.style.transform = 'translateX(' + (t / 1.4 * 100).toFixed(1) + '%)'; }
    if (labT > 0 && (labT -= dt) <= 0 && lab) lab.textContent = '';
    return OUT; }
  function bump() { rv *= 0.3; }
  // 노 하나 놓기: 쉴 때 = 옆으로 뻗고 노깃이 물 쪽으로 · 저을 때(0.6초) = 노깃이 앞에서 뒤로 쓸고 물에 더 잠김 · 왼쪽 노 = 거울(x −1)
  function oarM(i) { const sx = i ? 1 : -1, k = Math.min(1, oarT[i] / 0.6), on = k < 1, sw = on ? Math.sin(k * Math.PI) : 0, yaw = on ? sx * (-0.55 + 1.1 * k) : 0; E4.set(0, yaw, -sx * (0.3 + 0.18 * sw)); V4.set(sx * 1.0, 0.62, -0.6); M4.compose(V4, Q4.setFromEuler(E4), S4.set(sx, 1, 1)); OAR.setMatrixAt(i, M4); }
  // 노(배 무리의 자식 · 인스턴스 둘 = 그리기 +1 · 배를 탄 동안만 보임): 자루 + 노깃
  function oars() { const B = A.boat(); if (OAR || !B.grp) return; const P = [], N = [], C = [], add = (sx, sy, sz, x, y, z, v) => { const g0 = new T3.BoxGeometry(sx, sy, sz), g = g0.toNonIndexed(); g0.dispose(); g.translate(x, y, z); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) C.push(v[0], v[1], v[2]); g.dispose(); };
    add(1.9, 0.06, 0.06, 0.9, 0, 0, [0.55, 0.4, 0.26]); add(0.5, 0.03, 0.2, 1.95, 0, 0, [0.85, 0.66, 0.42]);   /* 자루(배 안쪽 손잡이 → 바깥) · 노깃 */
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere();
    OAR = new T3.InstancedMesh(g, new T3.MeshLambertMaterial({ vertexColors: true }), 2); OAR.userData.fx = 1; OAR.frustumCulled = false; OAR.visible = !!B.on;   /* 탄 동안만(묶어 둔 배엔 노 X — 그리기 0) */
    for (let i = 0; i < 2; i++) oarM(i); B.grp.add(OAR); }
  // 박자 단추 두 개 + 작은 박자 막대(배를 탄 동안 · 터치·마우스도) — 창(openP)이 아니라 화면 아래 작은 줄
  function hudOn(on) { if (!on) { if (hud) { hud.remove(); hud = mk = lab = null; } return; } if (hud) return; const e = en();
    if (!document.getElementById('twn-row-css')) { const s = document.createElement('style'); s.id = 'twn-row-css'; s.textContent = '.twn-row{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:44;display:flex;align-items:center;gap:10px;font-family:system-ui,"Malgun Gothic",sans-serif,SMEmoji;user-select:none;-webkit-user-select:none;touch-action:manipulation}.twn-row button{font:inherit;font-weight:800;font-size:15px;border:0;border-radius:12px;padding:10px 14px;min-height:46px;background:#2b5a3a;color:#fff;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.25)}.twn-row .bt{position:relative;width:110px;height:10px;border-radius:5px;background:#e7efe3;overflow:hidden}.twn-row .bt .ok{position:absolute;top:0;bottom:0;left:' + ((BEAT - WIN) / 1.4 * 100).toFixed(1) + '%;width:' + (2 * WIN / 1.4 * 100).toFixed(1) + '%;background:#7fd06a}.twn-row .bt .mk{position:absolute;top:-2px;bottom:-2px;left:0;width:100%;will-change:transform}.twn-row .bt .mk::before{content:"";position:absolute;left:-2px;top:0;bottom:0;width:4px;border-radius:2px;background:#e0453a}.twn-row .rw{display:flex;flex-direction:column;align-items:center;gap:3px}.twn-row .rl{font-size:13px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);min-height:16px}.twn-row .rl.fast,.twn-row .rl.same{color:#ffd0c8}'; document.head.appendChild(s); }
    hud = document.createElement('div'); hud.className = 'twn-row'; hud.innerHTML = '<button data-r="L">◀ ' + (e ? 'Left oar' : '왼쪽 노') + '</button><div class="rw"><div class="bt"><i class="ok"></i><i class="mk"></i></div><div class="rl"></div></div><button data-r="R">' + (e ? 'Right oar' : '오른쪽 노') + ' ▶</button>';
    hud.addEventListener('pointerdown', ev => { const b = ev.target.closest('button'); if (!b) return; ev.preventDefault(); row(b.dataset.r); }); document.body.appendChild(hud); mk = hud.querySelector('.mk'); lab = hud.querySelector('.rl'); }
  // ── 바닷길 부표 ──
  function buoyGeo() { const P = [], N = [], C = [], part = (g, y, v) => { const q = g.toNonIndexed(); g.dispose(); q.translate(0, y, 0); P.push(...q.attributes.position.array); N.push(...q.attributes.normal.array); for (let i = 0; i < q.attributes.position.count; i++) C.push(v[0], v[1], v[2]); q.dispose(); };
    part(new T3.CylinderGeometry(0.55, 0.7, 0.8, 10), 0.1, [0.95, 0.45, 0.15]); part(new T3.CylinderGeometry(0.42, 0.55, 0.5, 10), 0.75, [0.96, 0.95, 0.9]); part(new T3.ConeGeometry(0.42, 0.7, 10), 1.35, [0.95, 0.45, 0.15]); part(new T3.CylinderGeometry(0.05, 0.05, 1.0, 5), 2.1, [0.3, 0.3, 0.32]); part(new T3.BoxGeometry(0.04, 0.32, 0.5), 2.45, [1, 0.85, 0.2]);   /* 주황·흰 띠 몸 · 뾰족 머리 · 깃대 · 노란 깃발 */
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return g; }
  const okSea = (x, z, m) => A.seaSd(x, z) < -m && !A.swimAt(x, z) && !A.occHit(x - 4, z - 4, x + 4, z + 4) && A.inWalk(x, z);
  function course() { const H = A.harb(); CRS = []; if (!H) return; const fx0 = Math.sin(H.ry), fz0 = Math.cos(H.ry);
    for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]) { const fx = fx0 * Math.cos(da) + fz0 * Math.sin(da), fz = -fx0 * Math.sin(da) + fz0 * Math.cos(da), rx = fz, rz = -fx, P = []; let px = H.x, pz = H.z;   /* 선착장에서 바다 쪽으로 32m마다 하나(좌우로 굽이) · 막히면 그 앞까지 · 넷이 안 되면 다른 쪽으로 */
      for (let i = 1; i <= 6; i++) { const x = H.x + fx * 32 * i + rx * 16 * Math.sin(i * 1.15), z = H.z + fz * 32 * i + rz * 16 * Math.sin(i * 1.15); if (!okSea(x, z, 12)) break; let clear9 = true;
        for (let s = 0.1; s <= 1.001; s += 0.1) { const sx = px + (x - px) * s, sz = pz + (z - pz) * s; if (!(A.seaSd(sx, sz) < -6) || A.swimAt(sx, sz) || A.occHit(sx - 3, sz - 3, sx + 3, sz + 3)) { clear9 = false; break; } } if (!clear9) break; P.push([x, z]); px = x; pz = z; }
      if (P.length >= 4) { CRS = P; return; } } }
  function buoys() { if (!CRS.length) return; if (!BUOY) { BUG = buoyGeo(); BUM = new T3.MeshLambertMaterial({ vertexColors: true }); BUOY = new T3.InstancedMesh(BUG, BUM, 6); BUOY.userData.fx = 1; BUOY.matrixAutoUpdate = false; }
    BUOY.count = CRS.length; const root = A.root(); for (let i = 0; i < CRS.length; i++) { drawBuoy(i, 0); BUOY.setColorAt(i, C4.setHex(0xffffff)); } BUOY.instanceMatrix.needsUpdate = true; if (BUOY.instanceColor) BUOY.instanceColor.needsUpdate = true; root.add(BUOY); BUOY.computeBoundingSphere(); const b = BUOY.boundingSphere; if (b && !A.FOGM.some(o => o.m === BUOY)) A.FOGM.push({ m: BUOY, cx: b.center.x, cz: b.center.z, r: b.radius }); paint(); }
  function drawBuoy(i, t) { const [x, z] = CRS[i], up = i === next ? 0.25 + Math.sin(t * 3) * 0.12 : Math.sin(t * 1.4 + i) * 0.05, sc = i === pulse ? 1 + 0.6 * Math.sin(Math.min(1, pulseT / 0.6) * Math.PI) : 1; M4.compose(V4.set(x, A.SEAY() - 0.25 + up, z), Q4.setFromEuler(E4.set(0, i, 0)), S4.set(sc, sc, sc)); BUOY.setMatrixAt(i, M4); }
  function paint() { if (!BUOY) return; for (let i = 0; i < CRS.length; i++) BUOY.setColorAt(i, C4.setHex(i < next ? 0xb8f0b0 : i === next ? 0xffe066 : 0xffffff)); if (BUOY.instanceColor) BUOY.instanceColor.needsUpdate = true; }   /* 지난 것 = 연두 · 다음 것 = 노랑 · 남은 것 = 흰 */
  async function finish() { const e = en(), day = A.GAME.S.day, first = done9 !== day; done9 = day; A.skUp('explore', first ? 3 : 1); A.tev('seaway'); A.map.sfx && A.map.sfx('done'); A.map.hud.banner('⛵ ' + (e ? 'You sailed the whole sea route!' : '바닷길을 다 돌았어요!'), 2.4);
    if (first && A.alive()) await A.dialog({ who: e ? 'Pier fisher' : '부두 어부', icon: '🎣', text: e ? ['You followed every buoy — well rowed!', 'Buoys float where boats should go and warn about rocks and nets underwater.'] : ['부표를 하나도 안 놓치고 따라왔구나! 노 젓기 솜씨 좋은데?', '부표는 배가 다니는 길을 알려 주고, 물속 바위나 그물 같은 위험한 곳도 알려 줘요.'] }); }
  // ── 밤 등대 빛살 ──
  function beams() { const L9 = A.lhs(); if (!L9.length) return; if (!BEAM) { const P = [], C = [], half = sgn => { const g = new T3.CylinderGeometry(0.25, 5.5, 46, 14, 1, true).toNonIndexed(); g.rotateZ(sgn * Math.PI / 2); g.translate(sgn * 23, 0, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); const f = Math.max(0, 1 - Math.abs(p.getX(i)) / 46), v = 0.42 * f * f; C.push(v, v * 0.94, v * 0.72); } g.dispose(); };
      half(1); half(-1); BG = new T3.BufferGeometry(); BG.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); BG.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); BG.computeBoundingSphere();
      BM = new T3.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }); BM.forceSinglePass = true;   /* 양면 투명 = 두 번 그리던 것 → 한 번(더하기 빛이라 순서 상관없음) */ BEAM = new T3.InstancedMesh(BG, BM, 4); BEAM.userData.fx = 1; BEAM.matrixAutoUpdate = false; BEAM.visible = false; }
    BEAM.count = Math.min(4, L9.length); BEAM.userData.L = L9.slice(0, 4); spin(0); A.root().add(BEAM); BEAM.computeBoundingSphere(); }
  function spin(dt) { ang += dt * 0.9; const L9 = BEAM.userData.L; for (let i = 0; i < L9.length; i++) { const [x, z, y, s] = L9[i], k = s || 1; M4.compose(V4.set(x, y, z), Q4.setFromEuler(E4.set(0, ang + i * 1.3, -0.04)), S4.set(k, k, k)); BEAM.setMatrixAt(i, M4); } BEAM.instanceMatrix.needsUpdate = true; }
  // 짓기 때(setEntries): 부표 길 · 빛살 · 노
  function init() { clear(); course(); buoys(); beams(); oars(); }
  function clear() { if (BUOY && BUOY.parent) BUOY.parent.remove(BUOY); if (BEAM && BEAM.parent) BEAM.parent.remove(BEAM); CRS = []; next = 0; pulse = -1; }
  function onBoat(on) { hudOn(on); if (OAR) OAR.visible = !!on; rv = 0; streak = 0; side = ''; last = -9; next = 0; paint(); if (on && CRS.length) A.map.hud.toast(en() ? '🟡 Follow the yellow buoy — a short sea route! (←→ alternate = row)' : '🟡 노란 부표를 따라 짧은 바닷길을 돌아 봐요! (←→ 번갈아 = 노 젓기)', 3.2); }
  // 매 프레임(마을 tick): 빛살 돌리기(밤 · 보일 때) · 부표(다음 것 까딱 · 지나면 반짝) · 박자 단추 숨기기(창·놀이 동안)
  let sq = 0;
  function tick(dt) { const t = now(), B = A.boat();
    if (BEAM && BEAM.visible) spin(dt);
    if (BUOY && CRS.length && BUOY.parent) { if (B.on && next < CRS.length) { const [x, z] = CRS[next]; if (Math.hypot(B.x - x, B.z - z) < 10) { pulse = next; pulseT = 0; next++; paint(); A.map.sfx && A.map.sfx('ding'); if (next >= CRS.length) finish(); else A.map.hud.toast('✨ ' + next + '/' + CRS.length + (en() ? ' — next yellow buoy!' : ' — 다음 노란 부표로!'), 1.6); } }
      if (pulse >= 0) { pulseT += dt; drawBuoy(pulse, t); if (pulseT > 0.6) { pulse = -1; drawBuoy(next - 1, t); } } if (next < CRS.length) drawBuoy(next, t); BUOY.instanceMatrix.needsUpdate = true; }
    if (hud) { const hid = A.busy(); if (hud.style.visibility !== (hid ? 'hidden' : '')) hud.style.visibility = hid ? 'hidden' : ''; }
    if ((sq += dt) > 1) { sq = 0; sec(); } }
  // 1초마다: 밤이면 빛살 켬 · 등대 가까이(400m) 처음 밤 = 등대의 쓰임 한 줄
  function sec() { if (!BEAM) return; const v = A.night() >= 1 && !A.inb(); if (BEAM.visible !== v) BEAM.visible = v; if (!v) return; const me = A.map.player.pos(), day = A.GAME.S.day;
    if (bTold !== day && BEAM.userData.L.some(([x, z]) => Math.hypot(x - me.x, z - me.z) < 400)) { bTold = day; A.map.hud.toast(en() ? '🗼 The lighthouse beam sweeps the sea — it shows boats where the coast and dangerous rocks are at night' : '🗼 등대 불빛이 빙글빙글 — 밤바다의 배에게 바닷가와 위험한 바위가 어디인지 알려 줘요', 4); } }
  function dispose() { hudOn(false); clear(); for (const o of [BUG, BUM, BG, BM]) if (o) o.dispose(); if (OAR) { OAR.geometry.dispose(); OAR.material.dispose(); if (OAR.parent) OAR.parent.remove(OAR); } BUOY = BEAM = OAR = null; }
  return { init, row, step, bump, onBoat, tick, dispose, get rv() { return rv; }, get course() { return { n: CRS.length, next, pts: CRS.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]) }; }, get beam() { return BEAM ? { n: BEAM.count, vis: BEAM.visible } : null; } };
}
