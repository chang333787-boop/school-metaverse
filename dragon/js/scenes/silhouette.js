// 64px 실루엣 시험(design §15 합격 기준) — ?scene=sil&dpr=1 · 흰 바탕에 회색 그림자만 · 칸마다 64×64 화소에 꽉 차게
// 줄: 사람 앞·옆(히컵·스토이크·고버·아스트리드·피시레그) · 드래곤 옆·비스듬 앞(접음)·위(활공)(투슬리스·그롱클·내더·지플백·나이트메어 + 테러 덤)
// 사진: docs/dragon/shots/silhouette.png — 헷갈리는 짝이 있으면 모양을 고쳐 다시(시험 장면이라 재질은 단색 하나)
import * as THREE from 'three';
import { loadModel } from '../look/models.js?v=16';
import { createDragonRig } from '../look/dragon_rig.js?v=16';
import { createHumanRig } from '../look/human_rig.js?v=16';

const PEOPLE = [['hiccup', '히컵'], ['stoick', '스토이크'], ['gobber', '고버'], ['astrid', '아스트리드'], ['fishlegs', '피시레그']];
const DRAGONS = [['toothless', '투슬리스'], ['gronckle', '그롱클'], ['nadder', '내더'], ['zippleback', '지플백'], ['nightmare', '나이트메어'], ['terror', '테러']];
/* 줄 = [이름표, 목록, 돌림(x,y), 자세] */
const ROWS = [
  ['사람 앞', PEOPLE, [0, 0], {}],
  ['사람 옆', PEOPLE, [0, Math.PI / 2], {}],
  ['드래곤 옆(접음)', DRAGONS, [0, Math.PI / 2], { fold: 1 }],
  ['비스듬 앞', DRAGONS, [0.35, 0.75], { fold: 1 }],
  ['위(활공)', DRAGONS, [Math.PI / 2, Math.PI], { fold: 0, glide: 1 }],
];
const CELL = 64, GAP = 18, LEFT = 120, TOP = 40, WPP = 0.01;      // 화소당 0.01 세계 단위

export async function buildSilhouette(scene, camera, rng, opt = {}) {
  scene.background = new THREE.Color(0xffffff); scene.fog = null;
  const MAT = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });       // 실루엣 시험 전용(게임 재질 X)
  scene.overrideMaterial = MAT;
  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:12px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#333;z-index:5';
  document.body.appendChild(ui);
  const cells = [];
  window.__ready = false;
  const box = new THREE.Box3(), c = new THREE.Vector3(), sz = new THREE.Vector3();
  let W = 0, H = 0;
  function layout() {
    W = innerWidth; H = innerHeight;
    const D = (H * WPP / 2) / Math.tan(THREE.MathUtils.degToRad(0.5));
    camera.fov = 1; camera.aspect = W / H; camera.near = D - 60; camera.far = D + 60; camera.position.set(0, 0, D); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    ui.innerHTML = '<div style="position:absolute;left:12px;top:10px;font-weight:700">64px 실루엣 시험 — 칸 하나 = 64×64 화소</div>';
    ROWS.forEach((row, r) => {
      const y = TOP + r * (CELL + GAP + 12);
      ui.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:12px;top:${y + CELL / 2 - 8}px">${row[0]}</div>`);
      row[1].forEach((m, i) => {
        const x = LEFT + i * (CELL + GAP);
        ui.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${x}px;top:${y}px;width:${CELL}px;height:${CELL}px;outline:1px solid #ddd"></div>`
          + `<div style="position:absolute;left:${x - 8}px;top:${y + CELL + 1}px;width:${CELL + 16}px;text-align:center;font-size:10px;color:#777">${m[1]}</div>`);
      });
    });
    for (const it of cells) {                                          // 칸 가운데에 꽉 차게(긴 쪽 = 칸의 88%)
      const px = LEFT + it.i * (CELL + GAP) + CELL / 2, py = TOP + it.r * (CELL + GAP + 12) + CELL / 2;
      const k = (CELL * 0.88 * WPP) / Math.max(it.w, it.h);
      it.root.scale.setScalar(k);
      it.root.position.set((px - W / 2) * WPP - it.cx * k, (H / 2 - py) * WPP - it.cy * k, 0);
    }
  }
  const jobs = [];
  ROWS.forEach((row, r) => row[1].forEach(([n], i) => jobs.push(loadModel('assets/models/' + n + '.glb?v=16').then(({ root, bones }) => {
    const dragon = !!bones.wing1L;
    const rig = dragon ? createDragonRig(bones, root, n) : createHumanRig(bones, root);
    for (const k in row[3]) rig[k] = row[3][k];
    rig.update(0.001);
    root.rotation.set(row[2][0], row[2][1], 0);
    root.updateMatrixWorld(true);
    box.makeEmpty(); root.traverse((o) => { if (o.isMesh && o.visible) box.expandByObject(o, true); });
    box.getCenter(c); box.getSize(sz);
    cells.push({ root, rig, r, i, w: sz.x, h: sz.y, cx: c.x, cy: c.y });
    scene.add(root);
  }).catch((e) => console.error('실루엣 모델', n, e)))));
  const ready = Promise.all(jobs).then(() => { layout(); window.__ready = true; });
  return {
    ready,
    step() {},
    draw() { if (innerWidth !== W || innerHeight !== H) layout(); },
    snapshot: () => ({ cells: cells.length }),
    dispose() { ui.remove(); scene.overrideMaterial = null; },
  };
}
