// 걷기 시험 무대(단계 3 앞) — 시안 A 섬에서 히컵 걷기 · Shift 살금살금 · Space 구르기 · F 길게 손 내밀기 · 투슬리스가 근처에서 쉼
import * as THREE from 'three';
import { buildLookA } from '../scenes/look_a.js?v=14';
import { loadModel } from '../look/models.js?v=14';
import { createHumanRig } from '../look/human_rig.js?v=14';
import { createDragonRig } from '../look/dragon_rig.js?v=14';
import { createWalker, createFollowCam } from '../play/walker.js?v=14';

export function buildWalkTest(scene, camera, rng, opt = {}) {
  const base = buildLookA(scene, camera, rng, { time: opt.time || 'day' });
  const H = (x, z) => Math.max(1.2, base.height(x, z));
  const W = createWalker({ height: H, x: 150, z: 300, yaw: Math.PI });
  const C = createFollowCam(camera, H);
  let hic = null, hrig = null, tl = null, trig = null, fHold = 0, last = performance.now();
  loadModel('assets/models/' + (opt.who || 'hiccup') + '.glb?v=14').then(({ root, bones }) => { hrig = createHumanRig(bones, root); hic = root; scene.add(root); });
  loadModel('assets/models/toothless.glb?v=14').then(({ root, bones }) => {
    trig = createDragonRig(bones, root); tl = root; root.position.set(158, H(158, 290), 290); root.rotation.y = -2.2; scene.add(root);
  });
  return {
    env: base.env, height: H,
    step(dt, I) {
      base.step(dt, { look: () => ({ x: 0, y: 0 }), axis: () => 0, on: () => false, hit: (c) => I.hit(c), tap: () => false });
      C.step(dt, I, W);
      W.step(dt, I, C.moveYaw());
      fHold = I.on('use') ? fHold + dt : 0;
      if (hrig) {
        const to = { speed: Math.min(1, W.speed / 4.2), low: W.low ? 1 : 0, reach: fHold > 0.25 ? 1 : 0, away: fHold > 0.25 ? 0.8 : 0 };
        for (const k in to) hrig[k] += (to[k] - hrig[k]) * Math.min(1, dt * 8);
        hrig.update(dt);
      }
      if (trig) {
        const d = tl ? Math.hypot(W.x - tl.position.x, W.z - tl.position.z) : 99;
        trig.fold = 1; trig.pupil += ((d < 4 && !W.low ? 0 : 1) - trig.pupil) * Math.min(1, dt * 3);   // 서두르면 동공이 가늘어짐(시험)
        trig.ear += ((d < 8 ? 1 : 0) - trig.ear) * Math.min(1, dt * 2); trig.update(dt);
      }
    },
    draw(a) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      base.draw(a);
      if (hic) { W.draw(a, hic); C.draw(dt, hic); }
      base.env.sky.position.copy(camera.position); base.env.sea.follow(camera);
    },
    snapshot: () => ({ x: +W.x.toFixed(3), z: +W.z.toFixed(3), yaw: +W.yaw.toFixed(4), low: W.low }),
  };
}
