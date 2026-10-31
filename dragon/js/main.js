// 드래곤 게임 시작점 — 바탕(gfx·input·rng·loop·debug)을 묶고 장면을 붙인다 · goal = docs/dragon/goal_prompt.md
import * as THREE from 'three';
import { createGfx } from './core/gfx.js?v=18';
import { createInput } from './core/input.js?v=18';
import { createRng } from './core/rng.js?v=18';
import { createLoop } from './core/loop.js?v=18';
import { installDebug } from './core/debug.js?v=18';
import { buildBaseTest } from './scenes/base_test.js?v=18';
import { buildLookA } from './scenes/look_a.js?v=18';
import { buildModelView } from './scenes/model_view.js?v=18';
import { buildWalkTest } from './stages/walk_test.js?v=18';
import { buildPlaceView } from './stages/place_view.js?v=18';
import { buildGame } from './stages/game.js?v=18';

const Q = new URLSearchParams(location.search);
const canvas = document.getElementById('scene');
const gfx = createGfx(canvas);
const input = createInput(canvas);
const rng = createRng(+(Q.get('seed') || 1));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 4000);
gfx.onResize = (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); };

/* 팀이 만드는 장면은 파일이 생기면 열림(동적 import) — sil = 64px 실루엣(M) · fly = 비행 시험(F) */
const lazy = (file, fn) => async (...a) => (await import(file))[fn](...a);
const SCENES = { game: buildGame, base: buildBaseTest, a: buildLookA, model: buildModelView, walk: buildWalkTest, place: buildPlaceView,
  sil: lazy('./scenes/silhouette.js?v=18', 'buildSilhouette'), fly: lazy('./stages/flight_test.js?v=18', 'buildFlightTest'), key: lazy('./stages/keyframe.js?v=18', 'buildKeyframe') };
const world = await (SCENES[Q.get('scene') || 'game'] || buildGame)(scene, camera, rng, { gfx, time: Q.get('time'), mode: Q.get('mode2'), yaw: Q.has('yaw') ? +Q.get('yaw') : undefined, dist: Q.get('dist'), pitch: Q.has('pitch') ? +Q.get('pitch') : undefined, people: Q.get('people'), who: Q.get('who'), p: Q.get('p'), variant: Q.get('variant'), at: Q.get('at'), marks: Q.get('marks') === '1', swap: Q.get('swap') === '1', diff: Q.get('diff') || 'normal' });
const ctx = { gfx, input, canvas, scene, camera, world, benchPath: world.benchPath, snapshot: world.snapshot, sense: world.sense };
const dbg = installDebug(ctx);
const loop = createLoop({
  gfx, input, beforeStep: dbg.bot.tick,
  step: (dt, n) => world.step(dt, input, n),
  draw: (a) => { world.draw(a); gfx.renderer.render(scene, camera); dbg.afterDraw(); },
});
ctx.loop = loop;

/* 첫 화면 전에 셰이더를 미리 짓는다(첫 프레임 멈칫 줄이기) · 장소를 짓는 장면은 다 지을 때까지(ready) */
Promise.resolve(world.ready).catch((e) => console.error('ready', e)).then(() => gfx.renderer.compileAsync(scene, camera)).catch(() => {}).finally(() => {
  document.getElementById('load').classList.add('hide');
  loop.start();
  if (Q.get('bench') === '1' && Q.get('scene') && Q.get('scene') !== 'game') setTimeout(() => dbg.DRG.bench(60), 1500);   // 게임 본판은 장소 넷을 도는 관문(game.js benchTour)
});
