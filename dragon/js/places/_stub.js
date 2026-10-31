// 자리표시 장소 — 팀이 진짜 장소를 넘기기 전에 장 흐름을 시험하려고(계약 이름 자리만 맞춤 · 결 시험용 아님)
import * as THREE from 'three';
import { toon, setTime } from '../look/kit.js?v=15';

const NAMES = {
  village: ['plaza', 'hall_stairs', 'hall_door', 'forge_front', 'forge_anvil', 'forge_bellows', 'forge_grind', 'forge_bench', 'forge_wall', 'tower_base', 'tower_top', 'dock_top', 'dock_end', 'dock_ship', 'house_hiccup', 'arena_bridge', 'forest_gate', 'sheep_pen'],
  hall: ['door', 'dais', 'firepit', 'table_main', 'table_book'],
  arena: ['gate', 'center', 'board'],
  forest: ['spawn', 'crash', 'crash_rock', 'fin'],
  cove: ['rim_start', 'gap_out', 'gap_in', 'floor', 'sand', 'lake', 'lake_shore', 'climb_wall', 'nip', 'rest_rock', 'tree_low'],
  sea: ['dock', 'fishing', 'lunch', 'spawn_air'],
};
export async function buildPlace(ctx) {
  const { group, env, opt } = ctx, name = opt.stub || 'village';
  setTime(env, opt.time || 'day'); env.sea.visible = name === 'sea' || name === 'village';
  const R = 60, g = new THREE.CircleGeometry(R, 48).rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(g, toon({ color: name === 'forest' ? 0x55684a : name === 'arena' ? 0x8a8478 : 0x6f8a4e })); ground.position.y = name === 'sea' ? 0.5 : 0; group.add(ground);
  const anchors = {}, lists = {}, ns = NAMES[name] || ['spawn'];
  ns.forEach((n, i) => { const a = i / ns.length * Math.PI * 2, r = i === 0 ? 0 : 12 + (i % 3) * 10; anchors[n] = { x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r, yaw: -a }; });
  const mk = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 6), toon({ color: 0xd8a040 }));
  for (const n in anchors) { const m = mk.clone(); m.position.set(anchors[n].x, 0.6, anchors[n].z); group.add(m); }
  if (name === 'hall') lists.torches = [0, 1, 2, 3, 4, 5].map((i) => ({ id: i, x: -15 + i * 6, y: 2.5, z: i % 2 ? 9 : -9, level: 1, set(l) { this.level = l; } }));
  if (name === 'arena') { lists.cages = [0, 1, 2, 3, 4, 5].map((i) => ({ x: Math.cos(i) * 20, z: Math.sin(i) * 20, yaw: 0, open() {} })); lists.barrels = [{ x: 6, y: 0, z: 6 }, { x: -6, y: 0, z: 6 }, { x: 0, y: 0, z: -8 }]; lists.crowd = []; }
  if (name === 'forest') { lists.clues = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ kind: ['broken', 'furrow', 'scorch'][i % 3], x: i * 4, z: i * 3, yaw: 0 })); lists.landmarks = []; lists.decoys = []; }
  if (name === 'cove') lists.rim_watch = [0, 1, 2].map((i) => ({ x: -20 + i * 10, y: 0, z: -25, yaw: 0 }));
  const place = {
    name, anchors, lists, blockers: [], walls: [], bound: { x: 0, z: 0, r: R - 2 },
    height: () => (name === 'sea' ? 0.5 : 0), step() {}, draw() {}, dispose() {},
    benchPath(t) { ctx.camera.position.set(Math.cos(t * 0.1) * 40, 20, Math.sin(t * 0.1) * 40); ctx.camera.lookAt(0, 0, 0); },
    board: { setLines() {} }, setMaze() {}, mapSketch: () => ({ bounds: { x0: -60, z0: -60, x1: 60, z1: 60 }, path: [], landmarks: [] }),
    lake: { x: anchors.lake ? anchors.lake.x : 0, z: anchors.lake ? anchors.lake.z : 0, r: 8, y: 0 }, ceil: name === 'hall' ? 12 : undefined,
    fly: { ground: () => 0, pillars: [], ceil: 120, bounds: { x: 0, z: 0, r: R } }, stub: true,
  };
  return place;
}
