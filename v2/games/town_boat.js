// ⛵ 배 넓히기(BOAT-2 · 발전 방향 #36 · 교사 10-17): 노 젓기(물때·바람 · JUDGE-2) · 바닷길 부표 · 밤 등대 빛살 — 놀이 코드와 떼어 둔 규칙·그림(town_res.js와 같은 결)
//   노 젓기(JUDGE-2 · 10-26 '박자 맞추기 없앰 · 물때·바람 보고 방향·힘 고르기'): 키는 그냥 W 밀기(앞으로)·S 당기기(뒤로) · A/D 돌기 — 누르는 박자·시간은 아무 판정에도 안 씀
//     물살 = 물때(town_shore.js tideLvl과 같은 시계): 밀물·썰물마다 기슭을 따라 반대로 흐름 · 물때 한가운데 가장 셈 · 물이 다 차거나 다 빠질 즈음 = 멈춤
//       기슭에서 멀수록 셈(바닷가 6m 안 = 0.2배 → 46m 밖 = 1배 · 실제로 물살은 기슭 가까이에서 약함) → 거슬러 갈 땐 기슭 가까이로(아이가 고르는 길)
//     바람 = 마을 바람(CHEM wind) · 센 날 더 밀림 · 부표가 물살 쪽으로 기울어 보임(본 것이 단서)
//     힘 = 살살(기본) · 힘껏(Shift 또는 단추를 누르는 동안 · 노 빠르기 +3) — 팔 힘이 줄어 다 쓰면 잠깐 지침(느려짐) → 힘껏은 물살을 거스르는 짧은 곳에만(고르기)
//   바닷길 = 선착장 앞 바다에 부표 4~6(✨ — 아이 판 바다·양식장·해수욕장 피함) · 노란 부표를 차례로 지나면 반짝 · 끝 = 이웃(어부) 한 줄 · 탐험 솜씨
//   밤 등대 = 마을에 등대가 있을 때만(없으면 X) · MeshBasic 빛살(새 Light X · 인스턴스 하나 = 그리기 +1 · 밤에만) · 등대의 쓰임 한 줄(사실)
//   매 프레임 = 배를 탄 동안 노 그림·팔 힘(물살은 0.25초마다) · 밤엔 빛살 돌리기(등대 수만큼 setMatrixAt) — 새 객체 X
//   구조 배(ISLE-1) = 썰물섬에 갇히거나 바닷길이 잠길 때만 한 척(그리기 +1 · 그 동안만) · 헤엄 X — 배가 데리러 와서 바닷가 앞까지
export const BOAT_V = 1;
import { lowAt, TIDE_P } from './town_shore.js?v=5';   /* JUDGE-2 물때(마을·긴급 출동과 같은 모듈 · 같은 ?v) */
const CUR_MAX = 2.6, ARM_MAX = 6, HARD = 3;   // 물살 가장 셀 때 2.6m/초 · 팔 힘 6초 · 힘껏 = 노 빠르기 +3
const DIR8 = [['북', 'north'], ['북동', 'northeast'], ['동', 'east'], ['남동', 'southeast'], ['남', 'south'], ['남서', 'southwest'], ['서', 'west'], ['북서', 'northwest']], dir8 = (dx, dz) => Math.round(((Math.atan2(dx, -dz) * 57.29578 + 360) % 360) / 45) % 8;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · boat() → BOAT(x·z·h·on·grp) · harb() → HARB · lhs() → 등대 [x, z, 등 높이, 크기] · seaSd · swimAt · occHit · inWalk · root() · FOGM · lang() · night() → 0·0.5·1 · busy() 창·놀이·대화 · dialog · skUp · tev · alive() · SEAY
export function createBoatX(A) {
  const T3 = A.T3, M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), E4 = new T3.Euler(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), C4 = new T3.Color(), OUT = { v: 0, dh: 0, cx: 0, cz: 0 };
  let rv = 0, OAR = null, oarT = [9, 9], oarS = 0, hud = null, lab = null, hbtn = null, hardT = false, arm = ARM_MAX, tired = 0, cq = 9, upT = 0, hintD = -1;
  const CUR = { x: 0, z: 0, sp: 0, f: 1, fl: 0, wx: 0, wz: 0 };   /* 지금 물살(x·z = 흐르는 쪽 · sp 빠르기 · f 기슭 배수 · fl 1 밀물 −1 썰물 0 멈춤) · 바람 밀림(wx·wz) — 0.25초마다 한 번 셈(새 객체 X) */
  let BEAM = null, BG = null, BM = null, ang = 0, bTold = -1, BUOY = null, BUG = null, BUM = null, CRS = [], next = 0, pulse = -1, pulseT = 0, done9 = -1;
  const en = () => A.lang() === 'en', now = () => performance.now() / 1000, L2 = t => t[en() ? 1 : 0];
  // ── 물살·바람(0.25초마다) — 밀물 = 기슭을 따라 한쪽 · 썰물 = 반대쪽 · 기슭에서 멀수록 셈 ──
  function current(x, z) { const G = A.GAME.S, m = G.min || 0, ph = 2 * Math.PI * (m - lowAt(G.day)) / TIDE_P, sn = Math.sin(ph);   /* 물 높이(town_shore tideLvl)의 기울기 부호 = 밀물(+)·썰물(−) */
    const s0 = A.seaSd(x, z), gx = A.seaSd(x + 3, z) - A.seaSd(x - 3, z), gz = A.seaSd(x, z + 3) - A.seaSd(x, z - 3), gl = Math.hypot(gx, gz) || 1, tx = -gz / gl, tz = gx / gl;   /* 기슭 따라가는 쪽(먼바다 쪽 기울기에 수직) */
    CUR.f = Math.max(0.2, Math.min(1, (-s0 - 6) / 40)); CUR.fl = Math.abs(sn) < 0.2 ? 0 : sn > 0 ? 1 : -1; CUR.sp = CUR_MAX * Math.abs(sn) * CUR.f; const sg = sn >= 0 ? 1 : -1; CUR.x = tx * sg; CUR.z = tz * sg;
    const W = A.wind ? A.wind() : null, wk = A.windy && A.windy() ? 0.8 : 0.25; if (W && Number.isFinite(W.x)) { CUR.wx = W.x * wk; CUR.wz = W.z * wk; } else CUR.wx = CUR.wz = 0; }
  // 노 젓기 키(←→·A/D) = 그쪽 노 그림만(돌기는 엔진) — 박자 판정 X
  function row(s) { const B = A.boat(); if (!B.on || A.busy()) return; oarT[s === 'L' ? 0 : 1] = 0; }
  // 배 몰기 한 프레임(마을 boatTick이 부름): fw = 밀기(W) 중 · hard = 힘껏(Shift·단추) — 노 빠르기 · 물살·바람 밀림(cx·cz) · 노 그림 · 팔 힘
  function step(dt, fw, hard) { const B = A.boat(); hardT = !!hard; const pull = !!fw && !A.busy(), strong = pull && hardT && !tired && arm > 0;
    if (strong) { arm = Math.max(0, arm - dt); if (arm <= 0) { tired = 4; A.map.hud.toast('💪 ' + L2(['팔이 지쳤어요 — 살살 저으며 숨을 골라요', 'Your arms are tired — row gently and rest']), 2.4); } } else { arm = Math.min(ARM_MAX, arm + dt * 0.5); if (tired > 0 && (tired -= dt) <= 0) tired = 0; }
    rv += ((strong ? HARD : tired > 0 && pull ? -1.5 : 0) - rv) * Math.min(1, dt * 1.6); OUT.v = rv; OUT.dh = 0;
    if ((cq += dt) > 0.25 && B && B.on) { cq = 0; current(B.x, B.z); hudSet(); hint(B); }
    OUT.cx = B && B.on && !A.busy() ? CUR.x * CUR.sp + CUR.wx : 0; OUT.cz = B && B.on && !A.busy() ? CUR.z * CUR.sp + CUR.wz : 0;
    if (pull) { oarS += dt; if (oarS > (strong ? 0.5 : 0.8)) { oarS = 0; oarT[0] = oarT[1] = 0; } }   /* 미는 동안 두 노가 같이(힘껏 = 더 잦게) */
    if (OAR) { for (let i = 0; i < 2; i++) { oarT[i] += dt; oarM(i); } OAR.instanceMatrix.needsUpdate = true; }
    return OUT; }
  // 물살을 거슬러 먼바다 쪽에서 4초 넘게 애쓰면 한 줄(배 탈 때마다 한 번 · 거꾸로 힌트)
  function hint(B) { const hx = Math.sin(B.h), hz = Math.cos(B.h), dot = hx * CUR.x + hz * CUR.z; if (dot < -0.5 && CUR.sp > 1.4 && CUR.f > 0.7) upT += 0.25; else upT = 0;
    if (upT > 4 && hintD !== 1) { hintD = 1; A.map.hud.toast('🌊 ' + L2(['물살을 거슬러 가요 — 기슭 가까이는 물살이 약해요', 'You are rowing against the current — it is weaker close to the shore']), 3.4); } }
  function hudSet() { if (!lab) return; const e = en(), t = CUR.fl === 0 ? L2(['물때: 물이 거의 멈췄어요', 'Tide: the water is nearly still']) : (CUR.fl > 0 ? L2(['물때: 밀물', 'Tide: flooding']) : L2(['물때: 썰물', 'Tide: ebbing'])) + ' — ' + (e ? 'flowing ' + DIR8[dir8(CUR.x, CUR.z)][1] : '물이 ' + DIR8[dir8(CUR.x, CUR.z)][0] + '쪽으로 흘러요');
    const w = Math.hypot(CUR.wx, CUR.wz) > 0.4 ? ' · ' + (e ? 'strong wind toward the ' + DIR8[dir8(CUR.wx, CUR.wz)][1] : '바람이 ' + DIR8[dir8(CUR.wx, CUR.wz)][0] + '쪽으로 세게') : '';
    const a = tired > 0 ? L2(['팔이 지쳤어요', 'Arms tired']) : arm < 2 ? L2(['팔 힘이 거의 없어요', 'Arms nearly tired']) : '';
    const txt = t + w + (a ? ' · ' + a : ''); if (lab.textContent !== txt) lab.textContent = txt; if (hbtn) hbtn.classList.toggle('on', hardT && !tired); }
  function bump() { rv *= 0.3; }   /* 물살 밀림은 마을 쪽이 막힌 칸에서 그대로 멈춤 */
  // 노 하나 놓기: 쉴 때 = 옆으로 뻗고 노깃이 물 쪽으로 · 저을 때(0.6초) = 노깃이 앞에서 뒤로 쓸고 물에 더 잠김 · 왼쪽 노 = 거울(x −1)
  function oarM(i) { const sx = i ? 1 : -1, k = Math.min(1, oarT[i] / 0.6), on = k < 1, sw = on ? Math.sin(k * Math.PI) : 0, yaw = on ? sx * (-0.55 + 1.1 * k) : 0; E4.set(0, yaw, -sx * (0.3 + 0.18 * sw)); V4.set(sx * 1.0, 0.62, -0.6); M4.compose(V4, Q4.setFromEuler(E4), S4.set(sx, 1, 1)); OAR.setMatrixAt(i, M4); }
  // 노(배 무리의 자식 · 인스턴스 둘 = 그리기 +1 · 배를 탄 동안만 보임): 자루 + 노깃
  function oars() { const B = A.boat(); if (OAR || !B.grp) return; const P = [], N = [], C = [], add = (sx, sy, sz, x, y, z, v) => { const g0 = new T3.BoxGeometry(sx, sy, sz), g = g0.toNonIndexed(); g0.dispose(); g.translate(x, y, z); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) C.push(v[0], v[1], v[2]); g.dispose(); };
    add(1.9, 0.06, 0.06, 0.9, 0, 0, [0.55, 0.4, 0.26]); add(0.5, 0.03, 0.2, 1.95, 0, 0, [0.85, 0.66, 0.42]);   /* 자루(배 안쪽 손잡이 → 바깥) · 노깃 */
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere();
    OAR = new T3.InstancedMesh(g, new T3.MeshLambertMaterial({ vertexColors: true }), 2); OAR.userData.fx = 1; OAR.frustumCulled = false; OAR.visible = !!B.on;   /* 탄 동안만(묶어 둔 배엔 노 X — 그리기 0) */
    for (let i = 0; i < 2; i++) oarM(i); B.grp.add(OAR); }
  // 물때 줄 + 힘껏 단추(배를 탄 동안 · 터치·마우스도 · 누르는 동안만 힘껏) — 창(openP)이 아니라 화면 아래 작은 줄
  function hudOn(on) { if (!on) { if (hud) { hud.remove(); hud = lab = hbtn = null; } return; } if (hud) return; const e = en();
    if (!document.getElementById('twn-row-css')) { const s = document.createElement('style'); s.id = 'twn-row-css'; s.textContent = '.twn-row{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:44;display:flex;align-items:center;gap:10px;font-family:system-ui,"Malgun Gothic",sans-serif,SMEmoji;user-select:none;-webkit-user-select:none;touch-action:manipulation;max-width:calc(100vw - 24px)}.twn-row button{font:inherit;font-weight:800;font-size:15px;border:3px solid #2b2622;border-radius:12px;padding:8px 14px;min-height:46px;background:#fff8ea;color:#2b2420;cursor:pointer;box-shadow:0 3px 0 #2b2622;touch-action:none}.twn-row button.on{background:#2b5a3a;color:#fff}.twn-row .rl{font-size:14px;font-weight:800;color:#2b2420;background:#fff8ea;border:3px solid #2b2622;border-radius:12px;padding:6px 10px;line-height:1.3}'; document.head.appendChild(s); }
    hud = document.createElement('div'); hud.className = 'twn-row'; hud.innerHTML = '<div class="rl"></div><button data-r="H">' + (e ? 'Row hard' : '힘껏 젓기') + '</button>';
    lab = hud.querySelector('.rl'); hbtn = hud.querySelector('button'); const dn = ev => { ev.preventDefault(); TBH.on = true; }, up = () => { TBH.on = false; }; hbtn.addEventListener('pointerdown', dn); for (const t of ['pointerup', 'pointercancel', 'pointerleave']) hbtn.addEventListener(t, up); document.body.appendChild(hud); cq = 9; }
  const TBH = { on: false };
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
  function drawBuoy(i, t) { const [x, z] = CRS[i], up = i === next ? 0.25 + Math.sin(t * 3) * 0.12 : Math.sin(t * 1.4 + i) * 0.05, sc = i === pulse ? 1 + 0.6 * Math.sin(Math.min(1, pulseT / 0.6) * Math.PI) : 1; const k9 = Math.min(0.32, CUR.sp * 0.12); M4.compose(V4.set(x, A.SEAY() - 0.25 + up, z), Q4.setFromEuler(E4.set(CUR.z * k9, i, -CUR.x * k9, 'YXZ')), S4.set(sc, sc, sc)); BUOY.setMatrixAt(i, M4); }   /* 물살 쪽으로 기운 부표(본 것이 단서) */
  function paint() { if (!BUOY) return; for (let i = 0; i < CRS.length; i++) BUOY.setColorAt(i, C4.setHex(i < next ? 0xb8f0b0 : i === next ? 0xffe066 : 0xffffff)); if (BUOY.instanceColor) BUOY.instanceColor.needsUpdate = true; }   /* 지난 것 = 연두 · 다음 것 = 노랑 · 남은 것 = 흰 */
  async function finish() { const e = en(), day = A.GAME.S.day, first = done9 !== day; done9 = day; A.skUp('explore', first ? 3 : 1, 'seaway'); A.tev('seaway'); A.map.sfx && A.map.sfx('done'); A.map.hud.banner('⛵ ' + (e ? 'You sailed the whole sea route!' : '바닷길을 다 돌았어요!'), 2.4);
    if (first && A.alive()) await A.dialog({ who: e ? 'Pier fisher' : '부두 어부', icon: '🎣', text: e ? ['You followed every buoy — well rowed!', 'Buoys float where boats should go and warn about rocks and nets underwater.', 'The tide makes the water flow along the shore. Against the current, row close to the shore where it is weaker.'] : ['부표를 하나도 안 놓치고 따라왔구나! 노 젓기 솜씨 좋은데?', '부표는 배가 다니는 길을 알려 주고, 물속 바위나 그물 같은 위험한 곳도 알려 줘요.', '물때에 따라 바닷물이 기슭을 따라 흘러요. 물살을 거슬러 갈 땐 물살이 약한 기슭 가까이로 저어요.'] }); }
  // ── 밤 등대 빛살 ──
  function beams() { const L9 = A.lhs(); if (!L9.length) return; if (!BEAM) { const P = [], C = [], half = sgn => { const g = new T3.CylinderGeometry(0.25, 5.5, 46, 14, 1, true).toNonIndexed(); g.rotateZ(sgn * Math.PI / 2); g.translate(sgn * 23, 0, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); const f = Math.max(0, 1 - Math.abs(p.getX(i)) / 46), v = 0.42 * f * f; C.push(v, v * 0.94, v * 0.72); } g.dispose(); };
      half(1); half(-1); BG = new T3.BufferGeometry(); BG.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); BG.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); BG.computeBoundingSphere();
      BM = new T3.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }); BM.forceSinglePass = true;   /* 양면 투명 = 두 번 그리던 것 → 한 번(더하기 빛이라 순서 상관없음) */ BEAM = new T3.InstancedMesh(BG, BM, 4); BEAM.userData.fx = 1; BEAM.matrixAutoUpdate = false; BEAM.visible = false; }
    BEAM.count = Math.min(4, L9.length); BEAM.userData.L = L9.slice(0, 4); spin(0); A.root().add(BEAM); BEAM.computeBoundingSphere(); }
  function spin(dt) { ang += dt * 0.9; const L9 = BEAM.userData.L; for (let i = 0; i < L9.length; i++) { const [x, z, y, s] = L9[i], k = s || 1; M4.compose(V4.set(x, y, z), Q4.setFromEuler(E4.set(0, ang + i * 1.3, -0.04)), S4.set(k, k, k)); BEAM.setMatrixAt(i, M4); } BEAM.instanceMatrix.needsUpdate = true; }
  // 짓기 때(setEntries): 부표 길 · 빛살 · 노
  function init() { clear(); course(); buoys(); beams(); oars(); }
  function clear() { if (BUOY && BUOY.parent) BUOY.parent.remove(BUOY); if (BEAM && BEAM.parent) BEAM.parent.remove(BEAM); CRS = []; next = 0; pulse = -1; }
  function onBoat(on) { hudOn(on); if (OAR) OAR.visible = !!on; rv = 0; arm = ARM_MAX; tired = 0; upT = 0; hintD = -1; TBH.on = false; next = 0; paint(); if (on && CRS.length) A.map.hud.toast(en() ? '🟡 Follow the yellow buoy — a short sea route! Check which way the tide flows' : '🟡 노란 부표를 따라 짧은 바닷길을 돌아 봐요! 물살이 어느 쪽으로 흐르는지 봐요', 3.2); }
  // 매 프레임(마을 tick): 빛살 돌리기(밤 · 보일 때) · 부표(다음 것 까딱 · 지나면 반짝) · 물때 줄 숨기기(창·놀이 동안)
  let sq = 0;
  function tick(dt) { const t = now(), B = A.boat();
    if (RS) rsStep(dt);
    if (BEAM && BEAM.visible) spin(dt);
    if (BUOY && CRS.length && BUOY.parent) { if (B.on && next < CRS.length) { const [x, z] = CRS[next]; if (Math.hypot(B.x - x, B.z - z) < 10) { pulse = next; pulseT = 0; next++; paint(); A.map.sfx && A.map.sfx('ding'); if (next >= CRS.length) finish(); else A.map.hud.toast('✨ ' + next + '/' + CRS.length + (en() ? ' — next yellow buoy!' : ' — 다음 노란 부표로!'), 1.6); } }
      if (pulse >= 0) { pulseT += dt; drawBuoy(pulse, t); if (pulseT > 0.6) { pulse = -1; drawBuoy(next - 1, t); } } if (next < CRS.length) drawBuoy(next, t); BUOY.instanceMatrix.needsUpdate = true; }
    if (hud) { const hid = A.busy(); if (hud.style.visibility !== (hid ? 'hidden' : '')) hud.style.visibility = hid ? 'hidden' : ''; }
    if ((sq += dt) > 1) { sq = 0; sec(); } }
  // 1초마다: 밤이면 빛살 켬 · 등대 가까이(400m) 처음 밤 = 등대의 쓰임 한 줄
  function sec() { if (!BEAM) return; const v = A.night() >= 1 && !A.inb(); if (BEAM.visible !== v) BEAM.visible = v; if (!v) return; const me = A.map.player.pos(), day = A.GAME.S.day;
    if (bTold !== day && BEAM.userData.L.some(([x, z]) => Math.hypot(x - me.x, z - me.z) < 400)) { bTold = day; A.map.hud.toast(en() ? '🗼 The lighthouse beam sweeps the sea — it shows boats where the coast and dangerous rocks are at night' : '🗼 등대 불빛이 빙글빙글 — 밤바다의 배에게 바닷가와 위험한 바위가 어디인지 알려 줘요', 4); } }
  // ── 구조 배(ISLE-1 · 썰물섬에 갇히거나 바닷길이 잠길 때 · town_xp.js가 부름) ──
  //   o = { path: [[x, z], …](처음 = 먼바다 · board = 태우는 자리 번호 · 끝 = 바닷가 앞 물) · land: [x, y, z](내리는 뭍) · onBoard() · onEnd() }
  //   오는 동안 = 아이는 그 자리에서 기다림(몸 멈춤) · 태우는 자리에서 한 번 배 위로(배 타기와 같음) · 가는 동안 = 고물에 서서 감(매 프레임 배 따라 · 새 객체 X) · 바닷가 앞에서 뭍으로 한 번 내림(선착장 내리기와 같음)
  let RS = null, RSG = null, RSM = null, RSGeo = null;
  function rsMesh() { if (RSG) return RSG; const P = [], N = [], C = [], add = (sx, sy, sz, x, y, z, v) => { const g0 = new T3.BoxGeometry(sx, sy, sz), g = g0.toNonIndexed(); g0.dispose(); g.translate(x, y + sy / 2, z); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) C.push(v[0], v[1], v[2]); g.dispose(); };
    add(2.0, 0.8, 4.2, 0, -0.35, -0.2, [0.96, 0.95, 0.92]); add(2.04, 0.18, 4.24, 0, 0.21, -0.2, [0.93, 0.42, 0.13]); add(1.84, 0.04, 4.0, 0, 0.45, -0.2, [0.69, 0.54, 0.37]);   /* 흰 몸통 · 주황 띠(구조 배) · 갑판 */
    add(1.2, 0.9, 1.0, 0, 0.49, 0.8, [0.94, 0.93, 0.9]); add(1.4, 0.1, 1.2, 0, 1.39, 0.8, [0.93, 0.42, 0.13]); add(0.9, 0.34, 0.04, 0, 0.92, 1.32, [0.5, 0.78, 0.88]); add(0.5, 0.5, 0.06, 0, 0.32, 1.86, [0.93, 0.42, 0.13]);   /* 조타실 · 주황 지붕 · 앞유리 · 뱃머리 주황 판 */
    RSGeo = new T3.BufferGeometry(); RSGeo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); RSGeo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); RSGeo.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); RSGeo.computeBoundingSphere();
    RSM = new T3.MeshLambertMaterial({ vertexColors: true }); RSG = new T3.Mesh(RSGeo, RSM); RSG.userData.fx = 1; RSG.matrixAutoUpdate = false; RSG.visible = false; return RSG; }
  function rsPlace() { const R = RS, ck = Math.sin(R.t * 1.6) * 0.1; RSG.position.set(R.x, A.SEAY() + 0.15 + ck, R.z); RSG.rotation.set(Math.sin(R.t * 1.2) * 0.03, R.h, Math.sin(R.t * 1.05) * 0.04); RSG.updateMatrix(); RSG.updateMatrixWorld(true); return ck; }
  function rescue(o) { if (RS || !o || !o.path || o.path.length < 2) return false; rsMesh(); if (!RSG.parent) A.root().add(RSG); const [x, z] = o.path[0], [x1, z1] = o.path[1]; RS = { o, i: 0, x, z, h: Math.atan2(x1 - x, z1 - z), t: 0, on: false }; RSG.visible = true; rsPlace(); A.map.player.freeze(true); return true; }
  function rsStep(dt) { const R = RS; if (!R) return; R.t += dt; const P = R.o.path, tg = P[R.i + 1], sp = R.on ? 8 : 9, dx = tg[0] - R.x, dz = tg[1] - R.z, d = Math.hypot(dx, dz);
    let dh = Math.atan2(dx, dz) - R.h; while (dh > Math.PI) dh -= 6.2832; while (dh < -Math.PI) dh += 6.2832; R.h += dh * Math.min(1, dt * 2.5);
    if (d <= sp * dt + 0.05) { R.x = tg[0]; R.z = tg[1]; R.i++;
      if (R.i === (R.o.board | 0) && !R.on) { R.on = true; A.map.player.ride(true); if (R.o.onBoard) R.o.onBoard(); }
      if (R.i >= P.length - 1) { const L = R.o.land, on9 = R.on; RS = null; RSG.visible = false; A.map.player.ride(false); A.map.player.aim(null); if (on9 && L) A.map.player.teleport([L[0], L[1], L[2]]); if (!A.busy()) A.map.player.freeze(false); if (R.o.onEnd) R.o.onEnd(on9); return; } }
    else { R.x += dx / d * sp * dt; R.z += dz / d * sp * dt; }
    const ck = rsPlace(); if (R.on) { A.map.player.freeze(true); A.map.player.teleport([R.x - Math.sin(R.h) * 1.4, A.SEAY() + 0.64 + ck, R.z - Math.cos(R.h) * 1.4]); A.map.player.aim(Math.atan2(Math.sin(R.h), -Math.cos(R.h)) * 57.29578); } }
  function dispose() { hudOn(false); clear(); for (const o of [BUG, BUM, BG, BM, RSGeo, RSM]) if (o) o.dispose(); if (RSG && RSG.parent) RSG.parent.remove(RSG); RS = null; RSG = RSGeo = RSM = null; if (OAR) { OAR.geometry.dispose(); OAR.material.dispose(); if (OAR.parent) OAR.parent.remove(OAR); } BUOY = BEAM = OAR = null; }
  return { init, row, step, bump, onBoat, tick, dispose, rescue, get hardBtn() { return TBH.on; }, get cur() { return { ...CUR, arm: +arm.toFixed(2), tired: +tired.toFixed(2), hint: hintD }; }, curAt: (x, z) => { current(x, z); return { ...CUR }; }, get rescuing() { return RS ? { i: RS.i, n: RS.o.path.length, on: RS.on, x: +RS.x.toFixed(1), z: +RS.z.toFixed(1) } : null; }, get rv() { return rv; }, get course() { return { n: CRS.length, next, pts: CRS.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]) }; }, get beam() { return BEAM ? { n: BEAM.count, vis: BEAM.visible } : null; } };
}
