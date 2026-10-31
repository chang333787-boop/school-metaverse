// 드래곤 게임 시작점 — 바탕(gfx·input·rng·loop·debug)을 묶고 장면을 붙인다 · goal = docs/dragon/goal_prompt.md
import * as THREE from 'three';
import { createGfx } from './core/gfx.js?v=14';
import { createInput } from './core/input.js?v=14';
import { createRng } from './core/rng.js?v=14';
import { createLoop } from './core/loop.js?v=14';
import { installDebug } from './core/debug.js?v=14';
import { buildBaseTest } from './scenes/base_test.js?v=14';
import { buildLookA } from './scenes/look_a.js?v=14';
import { buildModelView } from './scenes/model_view.js?v=14';
import { buildWalkTest } from './stages/walk_test.js?v=14';

const Q = new URLSearchParams(location.search);
const canvas = document.getElementById('scene');
const gfx = createGfx(canvas);
const input = createInput(canvas);
const rng = createRng(+(Q.get('seed') || 1));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 4000);
gfx.onResize = (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); };

const SCENES = { base: buildBaseTest, a: buildLookA, model: buildModelView, walk: buildWalkTest };
const world = (SCENES[Q.get('scene')] || buildLookA)(scene, camera, rng, { time: Q.get('time'), mode: Q.get('mode2'), yaw: Q.has('yaw') ? +Q.get('yaw') : undefined, dist: Q.get('dist'), pitch: Q.has('pitch') ? +Q.get('pitch') : undefined, people: Q.get('people'), who: Q.get('who') });
const ctx = { gfx, input, canvas, scene, camera, world, benchPath: world.benchPath, snapshot: world.snapshot };
const dbg = installDebug(ctx);
const loop = createLoop({
  gfx, input, beforeStep: dbg.bot.tick,
  step: (dt, n) => world.step(dt, input, n),
  draw: (a) => { world.draw(a); gfx.renderer.render(scene, camera); dbg.afterDraw(); },
});
ctx.loop = loop;

/* 첫 화면 전에 셰이더를 미리 짓는다(첫 프레임 멈칫 줄이기) */
gfx.renderer.compileAsync(scene, camera).catch(() => {}).finally(() => {
  document.getElementById('load').classList.add('hide');
  loop.start();
  if (Q.get('bench') === '1') setTimeout(() => dbg.DRG.bench(60), 1500);
});
