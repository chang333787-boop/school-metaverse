// 모델 불러오기 — glTF(meshopt 압축) → 재질을 결 도구(toon)로 바꿔 끼움 · 뼈는 이름으로 찾아 게임이 직접 돌림
// 같은 파일을 여러 번 부르면 뼈째 복제(SkeletonUtils) — 마을 사람 셋·드래곤 둘이 한 몸을 나눠 쓰지 않게(지오메트리·재질은 공유)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { toon } from './kit.js?v=17';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();

/* 재질 이름 → 우리 재질(Blender 재질 이름이 열쇠) — 몸은 정점색(색·그늘 구움) · 눈은 종마다 색 + 약한 발광 */
const MATS = {
  drg_body: () => toon({ vc: true }),
  nm_body: () => toon({ vc: true, emissive: 0x000001 }),          // 나이트메어 — 몸 불(blaze) 때 자세 함수가 발광을 올림(이 재질만 따로)
  drg_eye_tl: () => toon({ color: 0xa6e05a, emissive: 0x2c5a12 }),  // 투슬리스 큰 초록 눈(알아볼 신호)
  drg_eye_gr: () => toon({ color: 0xe8a848, emissive: 0x4a2a08 }),
  drg_eye_nd: () => toon({ color: 0xf0dc58, emissive: 0x4a420e }),
  drg_eye_zb: () => toon({ color: 0xd8e468, emissive: 0x3e4410 }),
  drg_eye_nm: () => toon({ color: 0xf4b434, emissive: 0x5a3008 }),
  drg_eye_tt: () => toon({ color: 0xf2c848, emissive: 0x5a3e08 }),
  vk_body: () => toon({ vc: true }),                                 // 사람·양·손 물건
};

function prep(g) {
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.material && o.material.name, f = MATS[n];
    if (f) o.material = f();
    o.userData.mat = n;
    o.frustumCulled = false;                          // 뼈로 움직이면 경계 상자가 안 맞음 — 대신 거리로 숨김
  });
  return g;
}

export function loadModel(url) {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url).then(prep));
  return cache.get(url).then((g) => {
    const root = skClone(g.scene);
    const bones = {};
    root.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    for (const k in bones) bones[k].userData.rest = bones[k].quaternion.clone();
    let info = null; root.traverse((o) => { if (!info && o.userData.drg) { try { info = JSON.parse(o.userData.drg); } catch (e) { info = null; } } });   // 뼈대 노드 extras
    root.userData.info = info;                        // { species, tris, bones, length, height, span } 또는 사람 { who, h, grip }
    return { root, bones, gltf: g, info };
  });
}
