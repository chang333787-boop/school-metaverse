// 장소 보기(단계 3 팀 시험용) — ?scene=place&p=<이름>&time=<때>&variant=&at=<anchor>&marks=1 · 히컵으로 걷기 · G = 자유 카메라(WASD·끌기·Shift 빠르게)
// 장소 모듈 계약 = docs/dragon/stage3_plan.md §2 · 무대 그릇(core/stage.js)으로 짓고 비움 · ?swap=1 이면 K로 같은 장소를 다시 지음(힙 시험)
import * as THREE from 'three';
import { createEnv, U } from '../look/kit.js?v=14';
import { createStageHost } from '../core/stage.js?v=14';
import { createCollide } from '../play/collide.js?v=14';
import { createWalker, createFollowCam } from '../play/walker.js?v=14';
import { loadModel } from '../look/models.js?v=14';
import { createHumanRig } from '../look/human_rig.js?v=14';

export function buildPlaceView(scene, camera, rng, opt = {}) {
  const env = createEnv(scene, camera);
  const host = createStageHost({ gfx: opt.gfx, scene, camera });
  const name = opt.p || 'village';
  let place = null, W = null, C = null, coll = null, hic = null, hrig = null, free = false, t = 0, last = performance.now(), fHold = 0;
  const fc = { x: 0, y: 30, z: 0, yaw: 0, pitch: -0.2 }, fp = { x: 0, y: 0, z: 0 };
  async function load() {
    const m = await import(`../places/${name}.js?v=14`);
    place = await host.load(name, (ctx) => m.buildPlace(Object.assign(ctx, { env, rng, opt: { time: opt.time, variant: opt.variant } })));
    coll = createCollide(place.blockers || [], place.walls || []);
    const A = place.anchors || {}, a = A[opt.at] || A.spawn || A.plaza || A.gate || A.floor || A.door || Object.values(A)[0] || { x: 0, z: 0, yaw: 0, y: 0 };
    W = createWalker({ height: place.height, collide: coll, bound: place.bound, x: a.x, z: a.z, y: a.y, yaw: a.yaw || 0 });
    C = createFollowCam(camera, place.height, { collide: coll, ceil: place.ceil });
    C.yaw = (a.yaw || 0) + Math.PI;
    fc.x = a.x; fc.z = a.z; fc.y = (a.y || 0) + 25;
    if (opt.marks) marks();
    if (hic) place.group.add(hic);
  }
  function marks() {                                   // 이름 자리 = 노란 막대 · 목록 = 파란 막대
    const g = new THREE.CylinderGeometry(0.12, 0.12, 4, 6).translate(0, 2, 0), my = new THREE.MeshBasicMaterial({ color: 0xffd23a }), mb = new THREE.MeshBasicMaterial({ color: 0x3a8cff });
    for (const k in place.anchors) { const a = place.anchors[k], m = new THREE.Mesh(g, my); m.position.set(a.x, a.y ?? place.height(a.x, a.z), a.z); place.group.add(m); }
    for (const k in place.lists || {}) for (const a of place.lists[k]) { if (a.x == null) continue; const m = new THREE.Mesh(g, mb); m.position.set(a.x, a.y ?? place.height(a.x, a.z), a.z); m.scale.set(0.6, 0.6, 0.6); place.group.add(m); }
    console.log('anchors', JSON.stringify(Object.keys(place.anchors)), 'lists', JSON.stringify(Object.fromEntries(Object.entries(place.lists || {}).map(([k, v]) => [k, v.length]))));
  }
  loadModel('assets/models/hiccup.glb?v=14').then(({ root, bones }) => { hrig = createHumanRig(bones, root); hic = root; (place ? place.group : scene).add(root); });
  const ready = load();
  return {
    env, ready, get place() { return place; }, host,
    step(dt, I) {
      t += dt; U.uTime.value = t;
      if (!place) return;
      place.step && place.step(dt, t);
      if (I.hit('KeyG')) free = !free;
      if (opt.swap && I.hit('KeyK') && !host.busy) { place = null; host.unload(); load(); return; }
      if (free) {
        fp.x = fc.x; fp.y = fc.y; fp.z = fc.z;
        const lk = I.look(); fc.yaw -= lk.x * 0.004; fc.pitch = Math.max(-1.4, Math.min(1.2, fc.pitch - lk.y * 0.003));
        fc.yaw -= I.axis('left', 'right') * 1.4 * dt; const sp = I.axis('back', 'fwd') * (I.on('low') ? 60 : 14) * dt;
        fc.x += Math.sin(fc.yaw) * Math.cos(fc.pitch) * sp; fc.z += Math.cos(fc.yaw) * Math.cos(fc.pitch) * sp; fc.y += Math.sin(fc.pitch) * sp;
        return;
      }
      C.step(dt, I, W); W.step(dt, I, C.moveYaw());
      fHold = I.on('use') ? fHold + dt : 0;
      if (hrig) { const to = { speed: Math.min(1, W.speed / 4.2), low: W.low ? 1 : 0, reach: fHold > 0.25 ? 1 : 0, away: fHold > 0.25 ? 0.8 : 0 }; for (const k in to) hrig[k] += (to[k] - hrig[k]) * Math.min(1, dt * 8); hrig.update(dt); }
    },
    draw(a) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (place) {
        if (free) { camera.position.set(fp.x + (fc.x - fp.x) * a, fp.y + (fc.y - fp.y) * a, fp.z + (fc.z - fp.z) * a); camera.rotation.set(fc.pitch, fc.yaw + Math.PI, 0, 'YXZ'); }
        else if (hic && W) { W.draw(a, hic); C.draw(dt, hic); }
        place.draw && place.draw(a);
      }
      env.follow();
    },
    benchPath: (tt) => { if (place && place.benchPath) place.benchPath(tt); },
    snapshot: () => (W ? { x: +W.x.toFixed(3), z: +W.z.toFixed(3), y: +W.y.toFixed(3), place: name } : { place: name, loading: true }),
  };
}
