// 모델 보기 장면(단계 2 시험) — 시안 A 섬 위에 투슬리스 · 끌어서 둘레 돌기 · 1 접기 · 2 날갯짓 · 3 활공 · 4 귀 · T 때
import * as THREE from 'three';
import { buildLookA } from './look_a.js?v=12';
import { loadModel } from '../look/models.js?v=12';
import { createDragonRig } from '../look/dragon_rig.js?v=12';

export function buildModelView(scene, camera, rng, opt = {}) {
  const base = buildLookA(scene, camera, rng, { time: opt.time || 'sunset' });
  const P = new THREE.Vector3(150, 0, 330); P.y = Math.max(2, base.height(P.x, P.z));
  let rig = null, mode = +(opt.mode || 1), yaw = +(opt.yaw ?? 0.6), pitch = +(opt.pitch ?? 0.18), dist = +(opt.dist || 14);
  loadModel('assets/models/toothless.glb?v=12').then(({ root, bones }) => {
    rig = createDragonRig(bones, root);
    root.position.copy(P); root.rotation.y = -0.6; scene.add(root);
  });
  (opt.people || '').split(',').filter(Boolean).forEach((k, i) => loadModel('assets/models/' + k + '.glb?v=12').then(({ root }) => {
    root.position.set(P.x - 4 - i * 1.6, 0, P.z + 2.5 + i * 0.5); root.position.y = Math.max(2, base.height(root.position.x, root.position.z)); root.rotation.y = 0.9; scene.add(root);
  }));
  const look = new THREE.Vector3();
  return {
    env: base.env, height: base.height,
    step(dt, I) {
      base.step(dt, { look: () => ({ x: 0, y: 0 }), axis: () => 0, on: () => false, hit: (c) => I.hit(c) });
      const lk = I.look(); yaw -= lk.x * 0.005; pitch = Math.max(-0.2, Math.min(1.2, pitch + lk.y * 0.004));
      dist = Math.max(6, Math.min(40, dist + I.axis('fwd', 'back') * 12 * dt));
      for (let k = 1; k <= 4; k++) if (I.hit('Digit' + k)) mode = k;
      if (rig) {
        const tgt = { fold: mode === 1 ? 1 : 0, flapRate: mode === 2 ? 1 : 0, glide: mode === 3 ? 1 : 0, ear: mode === 4 ? Math.sin(rig.t * 2) : 0, pupil: mode === 4 ? (Math.sin(rig.t * 1.3) > 0 ? 1 : 0) : 1 };
        for (const k in tgt) rig[k] += (tgt[k] - rig[k]) * Math.min(1, dt * 3);
        rig.look = Math.sin(rig.t * 0.4) * 0.5;
        rig.update(dt);
      }
    },
    draw(a) {
      base.draw(a);
      look.set(P.x, P.y + 1.6, P.z);
      camera.position.set(P.x + Math.sin(yaw) * Math.cos(pitch) * dist, P.y + 1.6 + Math.sin(pitch) * dist, P.z + Math.cos(yaw) * Math.cos(pitch) * dist);
      camera.lookAt(look); base.env.sky.position.copy(camera.position); base.env.sea.follow(camera);
    },
    snapshot: () => ({ yaw: +yaw.toFixed(4), mode }),
  };
}
