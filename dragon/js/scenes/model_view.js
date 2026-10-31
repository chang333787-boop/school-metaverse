// 모델 보기 장면 — 시안 A 섬 위에 아무 모델·자세나 · 끌어서 둘레 돌기 · W/S 가까이 · T 때
//   ?scene=model&m=<모델,모델…>&anim=<값[:수][;값…],…>   예) m=toothless&anim=jaw   m=toothless,toothless&anim=lie:1,crouch:1;teeth:1
//   값에 수가 없으면 0↔1로 천천히 오감 · 사람 모델이면 사람 자세 값(hammer·cheer…) · m 생략 = 투슬리스(1 접기 · 2 날갯짓 · 3 활공 · 4 귀)
//   &gap=m(줄 간격) &face=라디안(모델이 보는 쪽) · &faces=0,1.57,…(모델마다 보는 쪽) · &hold=knife,,shield(사람 i 오른손에 손 물건) · &people=hiccup,… 은 예전처럼 드래곤 곁에 세움
import * as THREE from 'three';
import { buildLookA } from './look_a.js?v=15';
import { loadModel } from '../look/models.js?v=15';
import { createDragonRig } from '../look/dragon_rig.js?v=15';
import { createHumanRig } from '../look/human_rig.js?v=15';

const DRAGONS = new Set(['toothless', 'gronckle', 'nadder', 'zippleback', 'nightmare', 'terror']);

export function buildModelView(scene, camera, rng, opt = {}) {
  const Q = new URLSearchParams(location.search);
  const base = buildLookA(scene, camera, rng, { time: opt.time || 'sunset' });
  const P = new THREE.Vector3(+(Q.get('x') || 150), 0, +(Q.get('z') || 330)); P.y = Math.max(2, base.height(P.x, P.z));
  let mode = +(opt.mode || 1), yaw = +(opt.yaw ?? 0.6), pitch = +(opt.pitch ?? 0.18), dist = +(opt.dist || 14);
  const names = (Q.get('m') || 'toothless').split(',').filter(Boolean);
  const anims = (Q.get('anim') || '').split(','), holds = (Q.get('hold') || '').split(','), faces = (Q.get('faces') || '').split(',');
  const face = Q.has('face') ? +Q.get('face') : -0.6, gap = Q.has('gap') ? +Q.get('gap') : null, lookY = +(Q.get('ly') || 1.6);
  const legacy = !Q.has('m');                                   // 예전 쓰임(walk_test·하네스): 투슬리스 하나 + 숫자 키
  const items = [];
  window.__ready = false;
  const parseAnim = (s) => (s || '').split(';').filter(Boolean).map((x) => { const [k, v] = x.split(':'); return { k, v: v == null ? null : +v }; });
  const loads = names.map((n, i) => loadModel('assets/models/' + n + '.glb?v=15').then(({ root, bones, info }) => {
    const dragon = DRAGONS.has(n) || !!bones.wing1L;
    const rig = dragon ? createDragonRig(bones, root, n) : createHumanRig(bones, root);
    let tris = 0; root.traverse((o) => { if (o.isMesh && o.geometry.index) tris += o.geometry.index.count / 3; });
    const hold = holds[i];                                      // &hold=knife,,shield … — 사람 i의 오른손(handR)에 손 물건(props_hand.glb 메시 이름)
    if (hold && bones.handR) loadModel('assets/models/props_hand.glb?v=15').then((p) => { const m = p.root.getObjectByName(hold); if (m) { const c = m.clone(); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); bones.handR.add(c); } });
    const it = { n, root, rig, dragon, anim: parseAnim(anims[i] ?? anims[anims.length - 1]), tris, bones: Object.keys(bones).length, info };
    items[i] = it; scene.add(root); return it;
  }));
  (opt.people || '').split(',').filter(Boolean).forEach((k, i) => loadModel('assets/models/' + k + '.glb?v=15').then(({ root, bones }) => {
    root.position.set(P.x - 4 - i * 1.6, 0, P.z + 2.5 + i * 0.5); root.position.y = Math.max(2, base.height(root.position.x, root.position.z)); root.rotation.y = 0.9; scene.add(root);
    const rig = createHumanRig(bones, root); items.push({ n: k, root, rig, dragon: false, anim: [], extra: true });
  }));
  /* 줄 세우기 — 모델 너비(경계 상자)만큼 띄움 · 모두 실제 크기 */
  const box = new THREE.Box3(), sz = new THREE.Vector3();
  Promise.all(loads).then((list) => {
    const widths = list.map((it) => { box.setFromObject(it.root); box.getSize(sz); return it.dragon ? Math.max(sz.x * 0.55, sz.z * 0.5, 1) : Math.max(sz.x, 0.9); });
    const total = widths.reduce((a, w) => a + w, 0) + (gap ?? 0.6) * (list.length - 1);
    let x = -total / 2;
    list.forEach((it, i) => {
      const w = widths[i]; x += w / 2;
      const px = P.x + Math.cos(face) * 0 + x, pz = P.z;
      it.root.position.set(px, Math.max(2, base.height(px, pz)), pz); it.root.rotation.y = faces[i] ? +faces[i] : face;
      x += w / 2 + (gap ?? 0.6);
    });
    window.__info = list.map((it) => ({ m: it.n, tris: it.tris, bones: it.bones, info: it.info }));
    window.__ready = true;
  }).catch((e) => { console.error('모델', e); window.__ready = true; });
  const look = new THREE.Vector3();
  return {
    env: base.env, height: base.height,
    step(dt, I) {
      base.step(dt, { look: () => ({ x: 0, y: 0 }), axis: () => 0, on: () => false, hit: (c) => I.hit(c) });
      const lk = I.look(); yaw -= lk.x * 0.005; pitch = Math.max(-0.2, Math.min(1.4, pitch + lk.y * 0.004));
      dist = Math.max(1.5, Math.min(80, dist + I.axis('fwd', 'back') * 12 * dt));
      for (let k = 1; k <= 4; k++) if (I.hit('Digit' + k)) mode = k;
      for (const it of items) {
        if (!it) continue; const R = it.rig;
        if (legacy && it.dragon) {
          const tgt = { fold: mode === 1 ? 1 : 0, flapRate: mode === 2 ? 1 : 0, glide: mode === 3 ? 1 : 0, ear: mode === 4 ? Math.sin(R.t * 2) : 0, pupil: mode === 4 ? (Math.sin(R.t * 1.3) > 0 ? 1 : 0) : 1 };
          for (const k in tgt) R[k] += (tgt[k] - R[k]) * Math.min(1, dt * 3);
          R.look = Math.sin(R.t * 0.4) * 0.5;
        } else {
          for (const a of it.anim) {
            const v = a.v == null ? 0.5 - 0.5 * Math.cos(R.t * 1.2) : a.v;
            if (a.k in R) R[a.k] += (v - R[a.k]) * Math.min(1, dt * 4);
          }
        }
        R.update(dt);
      }
    },
    draw(a) {
      base.draw(a);
      look.set(P.x + +(Q.get('tx') || 0), P.y + lookY, P.z + +(Q.get('tz') || 0));
      camera.position.set(look.x + Math.sin(yaw) * Math.cos(pitch) * dist, look.y + Math.sin(pitch) * dist, look.z + Math.cos(yaw) * Math.cos(pitch) * dist);
      camera.lookAt(look); base.env.sky.position.copy(camera.position); base.env.sea.follow(camera);
    },
    snapshot: () => ({ yaw: +yaw.toFixed(4), mode }),
  };
}
