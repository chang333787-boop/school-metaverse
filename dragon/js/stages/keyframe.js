// 키 프레임 여섯(goal §5 · design §15 색 흐름) — ?scene=key&k=1~6 · 정한 결(시안 A)로 그림처럼 구도 잡은 기준 사진 · 시험의 기준
// 1 습격 밤 마을 · 2 코브 노을 · 3 구름 위 비행 · 4 훈련장 · 5 안개 속 둥지(둥지 섬 전 · 바다 돌기둥 + 둥지 때) · 6 종장 마을
import * as THREE from 'three';
import { createEnv, U } from '../look/kit.js?v=16';
import { createStageHost } from '../core/stage.js?v=16';
import { loadModel } from '../look/models.js?v=16';
import { createDragonRig } from '../look/dragon_rig.js?v=16';
import { createHumanRig } from '../look/human_rig.js?v=16';

const KEYS = {
  1: { p: 'village', time: 'night', at: ['plaza', 'hall_stairs'], cam: [-14, 9, -16], look: [0, 4, 6], dragons: [['nadder', 6, 22, 10, 1.2, 'fly'], ['gronckle', -10, 18, 14, 0.4, 'fly'], ['nightmare', 18, 28, 4, 2.2, 'fly']], people: [['hiccup', 0, 0, 0.6, 'cower'], ['stoick', 2.5, 1.5, 3.4, 'point'], ['gobber', -2.2, 2, 2.6, 'talk']] },
  2: { p: 'cove', time: 'sunset', at: ['sand', 'lake'], cam: [-4.2, 1.7, -4.6], look: [0.4, 1.3, 1.6], dragons: [['nightfury', 1.6, 1.4, -2.3, 0, 'sit']], people: [['hiccup', -1.4, -0.6, 0.9, 'reach']] },
  3: { p: 'sea', time: 'sunset', at: ['spawn_air'], cam: [-8, 3, -14], look: [0, 0, 6], fly: true, dragons: [['nightfury', 0, 0, 0, 0, 'glide']], people: [['hiccup', 0, 0, 0, 'ride']] },
  4: { p: 'arena', time: 'day', at: ['center'], cam: [-10, 5, -12], look: [0, 1.4, 4], dragons: [['gronckle', 2, 6, 3.4, 0, 'puff']], people: [['hiccup', -1, -1, 0.3, 'shield'], ['astrid', -5, 1, 1.0, 'idle'], ['fishlegs', 4, -3, -0.4, 'talk']] },
  5: { p: 'sea', time: 'nest', at: ['spawn_air'], cam: [-10, 2, -16], look: [0, 0, 8], fly: true, dragons: [['nightfury', 0, 0, 0, 0, 'glide'], ['nadder', -14, 6, 26, 0, 'fly'], ['gronckle', 12, -3, 30, 0, 'fly'], ['zippleback', 4, 9, 40, 0, 'fly']], people: [['hiccup', 0, 0, 0, 'ride']] },
  6: { p: 'village', time: 'clear', at: ['plaza'], cam: [-7, 3.2, -8], look: [0, 1.6, 2], dragons: [['nightfury', 2.5, 2, -2.8, 0, 'walk'], ['terror', -3, 4, 1, 0, 'sit'], ['gronckle', 9, 10, -2, 0, 'sit']], people: [['hiccup_leg', 0, 0, 0.5, 'idle'], ['stoick', -3, 3, 2.4, 'cheer'], ['gobber', 4, -2, -1, 'talk']] },
};
const FILE = { nightfury: 'toothless', gronckle: 'gronckle', nadder: 'nadder', zippleback: 'zippleback', nightmare: 'nightmare', terror: 'terror' };

export async function buildKeyframe(scene, camera, rng, opt = {}) {
  const k = +(new URLSearchParams(location.search).get('k') || 1), K = KEYS[k] || KEYS[1];
  const env = createEnv(scene, camera);
  const host = createStageHost({ gfx: opt.gfx, scene, camera });
  const mod = await import(`../places/${K.p}.js?v=16`).catch(() => import('../places/_stub.js?v=16'));
  const place = await host.load(K.p, (ctx) => mod.buildPlace(Object.assign(ctx, { env, rng, opt: { time: K.time, stub: K.p } })));
  const A = place.anchors, a = A[K.at[0]] || Object.values(A)[0] || { x: 0, z: 0, y: 0, yaw: 0 };
  const yaw = a.yaw || 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const W = (x, z) => ({ x: a.x + x * cy + z * sy, z: a.z - x * sy + z * cy });       // 자리 기준(앞 = +z)
  const baseY = K.fly ? (a.y || 40) : 0;
  const H = (x, z) => (K.fly ? baseY : place.height(x, z, a.y ?? 0));
  const rigs = [];
  for (const [kind, x, z, ry, up, pose] of K.dragons) {
    const p = W(x, z);
    loadModel('assets/models/' + FILE[kind] + '.glb?v=16').catch(() => loadModel('assets/models/toothless.glb?v=16')).then(({ root, bones }) => {
      const r = createDragonRig(bones, root, kind); root.position.set(p.x, H(p.x, p.z) + (up || 0) + (pose === 'fly' ? 18 : 0), p.z); root.rotation.y = yaw + ry; place.group.add(root);
      const P = { fly: { flapRate: 1, fold: 0 }, glide: { glide: 1, fold: 0, flapRate: 0.2 }, sit: { fold: 1 }, walk: { walk: 0.6, fold: 1 }, puff: { puff: 1, crouch: 0.6 } }[pose] || {};
      rigs.push({ r, P });
    });
  }
  for (const [who, x, z, ry, pose] of K.people) {
    const p = W(x, z);
    loadModel('assets/models/' + who + '.glb?v=16').catch(() => loadModel('assets/models/hiccup.glb?v=16')).then(({ root, bones }) => {
      const r = createHumanRig(bones, root); root.position.set(p.x, H(p.x, p.z) + (pose === 'ride' ? 1.6 : 0), p.z); root.rotation.y = yaw + ry; place.group.add(root);
      const P = { cower: { cower: 1 }, point: { point: 1 }, talk: { talk: 1 }, reach: { reach: 1, away: 0.8 }, ride: { ride: 1 }, shield: { carry: 0.5 }, cheer: { cheer: 1 } }[pose] || {};
      rigs.push({ r, P });
    });
  }
  const cp = W(K.cam[0], K.cam[2]), lp = W(K.look[0], K.look[2]);
  let t = 0;
  return {
    ready: new Promise((r) => setTimeout(r, 1500)), env,
    step(dt) { t += dt; U.uTime.value = t; place.step && place.step(dt, t); for (const o of rigs) { for (const n in o.P) if (n in o.r) o.r[n] = o.P[n]; o.r.update(dt); } },
    draw() { camera.position.set(cp.x, H(cp.x, cp.z) + K.cam[1], cp.z); camera.lookAt(lp.x, H(lp.x, lp.z) + K.look[1], lp.z); place.draw && place.draw(1); env.follow(); },
    benchPath: (tt) => place.benchPath && place.benchPath(tt),
    snapshot: () => ({ k }),
  };
}
