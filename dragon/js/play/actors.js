// 배우 — 드래곤(모델 + 자세 함수 + 마음 엔진 + 땅 위 걸음) · 사람(모델 + 자세 함수 + 걸어가기·바라보기)
// 위치는 걸음마다(60Hz) · 그리기는 보간 · 30m 밖 뼈는 15Hz(goal §7) · 매 걸음 new 없음
import * as THREE from 'three';
import { loadModel } from '../look/models.js?v=15';
import { createDragonRig } from '../look/dragon_rig.js?v=15';
import { createHumanRig } from '../look/human_rig.js?v=15';
import { createMind } from './mind.js?v=15';

const _p = { x: 0, z: 0 };
const angTo = (a, b) => { let d = b - a; return Math.atan2(Math.sin(d), Math.cos(d)); };
const lerp = (a, b, k) => a + (b - a) * k;
/* 드래곤 종 → 모델 파일(팀 M이 지음 · 없으면 투슬리스 모양을 크기만 바꿔 자리표시) */
export const DRAGON_FILE = { nightfury: 'toothless', gronckle: 'gronckle', nadder: 'nadder', zippleback: 'zippleback', nightmare: 'nightmare', terror: 'terror' };
const STAND_IN = { gronckle: 0.5, nadder: 0.8, zippleback: 1.0, nightmare: 1.15, terror: 0.12 };

function loadOr(url, fallback) { return loadModel(url).catch(() => (fallback ? loadModel(fallback) : Promise.reject(new Error('모델 없음 ' + url)))); }

/* 드래곤 배우 — o = { kind, group, place, collide, x, z, yaw, mind: {fear…}, radius } */
export function createDragon(o) {
  const D = {
    kind: o.kind || 'nightfury', x: o.x || 0, z: o.z || 0, y: 0, yaw: o.yaw || 0, px: 0, pz: 0, py: 0, pyaw: 0,
    vx: 0, vz: 0, speed: 0, root: null, rig: null, ready: false, radius: o.radius ?? 1.4, home: { x: o.x || 0, z: o.z || 0 },
    target: null, face: null, mode: 'mind', hidden: false, t: 0, rigAcc: 0, pose: {}, rigY: 0,
    mind: createMind(o.kind || 'nightfury', o.mind || {}),
  };
  D.y = o.place.height(D.x, D.z, o.y ?? 0); D.px = D.x; D.pz = D.z; D.py = D.y; D.pyaw = D.yaw;
  const file = DRAGON_FILE[D.kind] || 'toothless';
  D.ready = loadOr('assets/models/' + file + '.glb?v=15', 'assets/models/toothless.glb?v=15').then(({ root, bones }) => {
    D.root = root; D.rig = createDragonRig(bones, root, D.kind);
    const sc = (file === 'toothless' && D.kind !== 'nightfury') ? STAND_IN[D.kind] || 1 : 1;
    if (sc !== 1) root.scale.setScalar(sc);
    if (o.scale) root.scale.multiplyScalar(o.scale);
    root.visible = !D.hidden; o.group.add(root); return D;
  });
  /* 장이 정하는 움직임: goTo(x,z,속도) · stay() · faceTo(x,z) · mode 'mind'(마음 엔진이 정함) */
  D.goTo = (x, z, sp = 2, arrive = 0.6) => { D.target = { x, z, sp, arrive }; D.mode = 'script'; };
  D.stay = () => { D.target = null; D.mode = 'script'; };
  D.free = () => { D.target = null; D.mode = 'mind'; };
  D.faceTo = (x, z) => { D.face = { x, z }; };
  D.place = (x, z, yaw) => { D.x = D.px = x; D.z = D.pz = z; if (yaw != null) D.yaw = D.pyaw = yaw; D.y = D.py = o.place.height(x, z, D.y); };
  D.arrived = () => !D.target;
  D.show = (v) => { D.hidden = !v; if (D.root) D.root.visible = v; };
  /* 걸음 — pl = 플레이어 { x, z, vx, vz, low, weapon, reach, yaw } · 마음 엔진에 몸짓을 넣고 행동대로 움직임 */
  const P = { d: 99, close: 0, low: false, weapon: false, facing: false, reach: false, still: true, dragonFacing: 0, blindSpot: false };
  D.step = (dt, pl) => {
    D.t += dt; D.simAcc = (D.simAcc || 0) + dt; D.px = D.x; D.pz = D.z; D.py = D.y; D.pyaw = D.yaw;
    const M = D.mind, sp = M.S;
    if (pl) {
      const dx = D.x - pl.x, dz = D.z - pl.z, d = Math.hypot(dx, dz) || 1e-4;
      P.d = d; P.close = (pl.vx * dx + pl.vz * dz) / d; P.low = !!pl.low; P.weapon = !!pl.weapon; P.reach = !!pl.reach; P.still = Math.hypot(pl.vx, pl.vz) < 0.25;
      P.facing = Math.cos(angTo(pl.yaw, Math.atan2(dx, dz))) > 0.85 && !pl.away;
      P.dragonFacing = Math.cos(angTo(D.yaw, Math.atan2(-dx, -dz)));
      P.blindSpot = sp.blind ? P.dragonFacing > 0.94 && d < 6 : false;      // 내더: 바로 코앞 좁은 띠(우리 해석 · 1편엔 자리 없음)
      M.tick(dt, P);
    }
    /* 어디로 갈지 */
    let tx = null, tz = null, want = 0, faceP = false;
    if (D.mode === 'script') { if (D.target) { tx = D.target.x; tz = D.target.z; want = D.target.sp; } }
    else if (pl) {
      const b = M.beh, ax = D.x - pl.x, az = D.z - pl.z, d = P.d;
      if (b === 'come') { if (d > 1.7) { tx = pl.x + ax / d * 1.5; tz = pl.z + az / d * 1.5; want = pl.low ? 1.0 : 1.6; } faceP = true; }
      else if (b === 'back') { tx = D.x + ax / d * 3; tz = D.z + az / d * 3; want = 1.4; faceP = true; }
      else if (b === 'flee') { tx = D.x + ax / d * 8; tz = D.z + az / d * 8; want = 5; }
      else if (b === 'watch' || b === 'warn' || b === 'windup' || b === 'attack' || b === 'gap') faceP = true;
      else if (b === 'chase' && D.chase) { tx = D.chase.x; tz = D.chase.z; want = 3.5; }
      else if (b === 'idle' && d < 25 && (D.t % 7) > 4.2) faceP = true;   // 가만히 있어도 7초에 한 번쯤 소리 난 쪽을 돌아봄(2.8초)
      else if (b === 'idle' && o.wander) {                     // 집 둘레 어슬렁(씨앗 난수 없이 시간으로 · 같은 판)
        const a = D.t * 0.13 + (o.wanderPh || 0), r = o.wander; tx = D.home.x + Math.cos(a) * r; tz = D.home.z + Math.sin(a * 1.3) * r; want = 0.9;
      }
    }
    if (tx != null) {
      const dx = tx - D.x, dz = tz - D.z, d = Math.hypot(dx, dz);
      if (D.mode === 'script' && D.target && d < D.target.arrive) { D.target = null; want = 0; }
      const k = Math.min(1, dt * 3), vx = d > 0.05 ? dx / d * want : 0, vz = d > 0.05 ? dz / d * want : 0;
      D.vx = lerp(D.vx, vx, k); D.vz = lerp(D.vz, vz, k);
    } else { const k = Math.min(1, dt * 5); D.vx = lerp(D.vx, 0, k); D.vz = lerp(D.vz, 0, k); }
    const bx = D.x, bz = D.z;
    D.x += D.vx * dt; D.z += D.vz * dt;
    if (o.collide) { _p.x = D.x; _p.z = D.z; o.collide.push(_p, D.radius); D.x = _p.x; D.z = _p.z; }
    /* 정해 둔 곳에 벽·바위 때문에 못 닿으면(1.2초 제자리) 닿은 셈 — 대본이 멈추지 않게 */
    if (D.mode === 'script' && D.target) { if (Math.hypot(D.x - bx, D.z - bz) < 0.2 * dt) { D.stuckT = (D.stuckT || 0) + dt; if (D.stuckT > 1.2) { D.target = null; D.stuckT = 0; } } else D.stuckT = 0; }
    if (o.bound) { const bx = D.x - o.bound.x, bz = D.z - o.bound.z, bd = Math.hypot(bx, bz), br = o.bound.r - D.radius; if (bd > br) { D.x = o.bound.x + bx / bd * br; D.z = o.bound.z + bz / bd * br; } }
    D.y = o.place.height(D.x, D.z, D.y);
    D.speed = Math.hypot(D.vx, D.vz);
    /* 바라보기 — 걸으면 걷는 쪽, 아니면 플레이어나 정해 둔 곳 */
    let fy = null;
    if (D.face) fy = Math.atan2(D.face.x - D.x, D.face.z - D.z);
    else if (D.speed > 0.4 && M.beh !== 'back') fy = Math.atan2(D.vx, D.vz);
    else if (faceP && pl) fy = Math.atan2(pl.x - D.x, pl.z - D.z);
    if (fy != null) D.yaw += angTo(D.yaw, fy) * Math.min(1, dt * (M.beh === 'warn' ? 5 : 2.5));
  };
  /* 자세 값 — 마음 신호 + 행동 + 장이 덮어쓴 pose(예: struggle·lie) */
  const T = { walk: 0, crouch: 0, pupil: 1, ear: 0, teeth: 0, tailCurl: 0, jaw: 0, sniff: 0, tilt: 0, headUp: 0, lie: 0, roll: 0, look: 0, fold: 1, struggle: 0, spines: 0, puff: 0, blaze: 0, pounce: 0, flapRate: 0, glide: 0 };
  D.draw = (a, dt, camPos) => {
    if (!D.root) return;
    let dy = angTo(D.pyaw, D.yaw);
    D.root.position.set(lerp(D.px, D.x, a), lerp(D.py, D.y, a) + D.rigY, lerp(D.pz, D.z, a)); D.root.rotation.y = D.pyaw + dy * a;
    const far = camPos && Math.hypot(camPos.x - D.x, camPos.z - D.z) > 30;
    D.rigAcc += D.simAcc || 0; D.simAcc = 0; if (far && D.rigAcc < 1 / 15) return; const h = Math.min(0.5, D.rigAcc); D.rigAcc = 0;   // 놀이 시간(걸음)으로 — ?turbo에서도 신호가 같은 빠르기
    const M = D.mind, g = M.sig, b = M.beh, R = D.rig;
    T.walk = Math.min(1, D.speed / 3); T.crouch = g.crouch; T.pupil = g.pupil; T.ear = g.ear; T.teeth = g.teeth; T.tailCurl = g.tailCurl;
    T.jaw = g.jaw; T.sniff = g.sniff; T.tilt = g.tilt; T.headUp = g.headUp;
    T.lie = b === 'flop' ? 1 : 0; T.roll = b === 'roll' ? 1 : 0;
    const warn = M.warnT > 0 ? 1 : 0, ws = M.S.warn;
    T.spines = ws === 'spines' ? warn : 0; T.puff = ws === 'puff' ? warn : 0; T.blaze = ws === 'blaze' ? warn : 0; T.pounce = ws === 'crouch' ? warn * 0.8 : 0;
    if (b === 'attack') { T.jaw = 0.9; }
    T.struggle = 0; T.fold = 1; T.flapRate = 0; T.glide = 0;
    for (const k in D.pose) T[k] = D.pose[k];                    // 장이 정한 자세가 이김
    const k = Math.min(1, h * 6);
    for (const n in T) if (n in R) R[n] += (T[n] - R[n]) * (n === 'pupil' ? Math.min(1, h * 4) : k);
    R.update(h);
  };
  return D;
}

/* 사람 배우 — o = { who, group, place, x, z, yaw, collide } · walkTo · faceTo · pose(talk·point·hammer…) */
export function createPerson(o) {
  const H = { who: o.who, x: o.x || 0, z: o.z || 0, y: 0, yaw: o.yaw || 0, px: 0, pz: 0, py: 0, pyaw: 0, vx: 0, vz: 0, speed: 0, root: null, rig: null, target: null, face: null, pose: {}, hidden: false, rigAcc: 0 };
  H.y = o.place.height(H.x, H.z, o.y ?? 0); H.px = H.x; H.pz = H.z; H.py = H.y; H.pyaw = H.yaw;
  H.ready = loadOr('assets/models/' + o.who + '.glb?v=15', 'assets/models/hiccup.glb?v=15').then(({ root, bones }) => {
    H.root = root; H.rig = createHumanRig(bones, root); H.bones = bones; root.visible = !H.hidden; o.group.add(root); return H;
  });
  H.walkTo = (x, z, sp = 1.6) => { H.target = { x, z, sp }; };
  H.faceTo = (x, z) => { H.face = x == null ? null : { x, z }; };
  H.place = (x, z, yaw) => { H.x = H.px = x; H.z = H.pz = z; if (yaw != null) H.yaw = H.pyaw = yaw; H.y = H.py = o.place.height(x, z, H.y); };
  H.show = (v) => { H.hidden = !v; if (H.root) H.root.visible = v; };
  H.arrived = () => !H.target;
  H.step = (dt) => {
    H.simAcc = (H.simAcc || 0) + dt; H.px = H.x; H.pz = H.z; H.py = H.y; H.pyaw = H.yaw;
    let vx = 0, vz = 0;
    if (H.target) { const dx = H.target.x - H.x, dz = H.target.z - H.z, d = Math.hypot(dx, dz); if (d < 0.25) H.target = null; else { vx = dx / d * H.target.sp; vz = dz / d * H.target.sp; } }
    const k = Math.min(1, dt * 6); H.vx = lerp(H.vx, vx, k); H.vz = lerp(H.vz, vz, k);
    H.x += H.vx * dt; H.z += H.vz * dt;
    if (o.collide) { _p.x = H.x; _p.z = H.z; o.collide.push(_p, 0.35); H.x = _p.x; H.z = _p.z; }
    H.y = o.place.height(H.x, H.z, H.y); H.speed = Math.hypot(H.vx, H.vz);
    let fy = null;
    if (H.speed > 0.3) fy = Math.atan2(H.vx, H.vz); else if (H.face) fy = Math.atan2(H.face.x - H.x, H.face.z - H.z);
    if (fy != null) H.yaw += angTo(H.yaw, fy) * Math.min(1, dt * 6);
  };
  const T = { speed: 0, low: 0, reach: 0, away: 0, throw: 0, hammer: 0, carry: 0, pet: 0, ride: 0, talk: 0, stumble: 0, rollDodge: 0, sit: 0, point: 0, cheer: 0, cower: 0 };
  H.draw = (a, dt, camPos) => {
    if (!H.root) return;
    H.root.position.set(lerp(H.px, H.x, a), lerp(H.py, H.y, a), lerp(H.pz, H.z, a)); H.root.rotation.y = H.pyaw + angTo(H.pyaw, H.yaw) * a;
    const far = camPos && Math.hypot(camPos.x - H.x, camPos.z - H.z) > 30;
    H.rigAcc += H.simAcc || 0; H.simAcc = 0; if (far && H.rigAcc < 1 / 15) return; const h = Math.min(0.5, H.rigAcc); H.rigAcc = 0;
    for (const n in T) T[n] = 0;
    T.speed = Math.min(1, H.speed / 4.2);
    for (const n in H.pose) T[n] = H.pose[n];
    const k = Math.min(1, h * 8), R = H.rig;
    for (const n in T) if (n in R) R[n] += (T[n] - R[n]) * k;
    R.update(h);
  };
  return H;
}
