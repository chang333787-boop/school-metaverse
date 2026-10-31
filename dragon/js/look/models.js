// 모델 불러오기 — glTF(meshopt 압축) → 재질을 결 도구(toon)로 바꿔 끼움 · 뼈는 이름으로 찾아 게임이 직접 돌림
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { toon } from './kit.js?v=14';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();

/* 재질 이름 → 우리 재질(Blender 재질 이름이 열쇠) */
const MATS = {
  tl_body: () => toon({ vc: true, side: THREE.DoubleSide }),
  tl_eye: () => toon({ color: 0xa6e05a, emissive: 0x2c5a12 }),
  tl_pupil: () => toon({ color: 0x050505 }),
  tl_fin_pro: () => toon({ color: 0x7a4a26, side: THREE.DoubleSide }),
  vk_body: () => toon({ vc: true }),
};

export function loadModel(url) {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
  return cache.get(url).then((g) => {
    const root = g.scene;
    const bones = {};
    root.traverse((o) => {
      if (o.isBone) bones[o.name] = o;
      if (o.isMesh) {
        const n = o.material && o.material.name, f = MATS[n];
        if (f) o.material = f();
        o.frustumCulled = false;                          // 뼈로 움직이면 경계 상자가 안 맞음 — 대신 거리로 숨김
      }
    });
    for (const k in bones) bones[k].userData.rest = bones[k].quaternion.clone();
    return { root, bones, gltf: g };
  });
}
