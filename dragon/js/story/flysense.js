// 비행·배 차례가 봇에게 보이는 것 — 팀 F 비행 시험 무대(stages/flight_test.js)의 sense와 같은 모양(봇 bots/flight_bot.js가 그대로 읽음)
export function flySense(F, o = {}) {
  if (!F || !F.state) return {};
  const s = F.state, gs = F.gates ? F.gates() : [], nx = [];
  for (let i = s.gates || 0; i < Math.min(gs.length, (s.gates || 0) + 2); i++) { const g = gs[i]; nx.push({ x: g.x, y: g.y, z: g.z, r: +(F.gateR ? F.gateR(g) : g.r).toFixed(2) }); }
  return {
    mode: 'fly', t: +(s.t || 0).toFixed(3),
    x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), vx: +(s.vx || 0).toFixed(2), vy: +(s.vy || 0).toFixed(2), vz: +(s.vz || 0).toFixed(2),
    speed: +((s.speed || 0) + (s.boost || 0)).toFixed(2), yaw: +s.yaw.toFixed(3), pitch: +(s.pitch || 0).toFixed(3), tail: s.tail,
    gate: s.gates || 0, gateN: gs.length, next: nx, note: o.noteGone ? null : gs.slice(s.gates || 0, (s.gates || 0) + 4).map((g) => g.tail),
    wingsUp: F.wingsUp ? F.wingsUp() : false, fallen: !!s.fallen, grab: s.grab, dragonDist: s.fallen ? +(s.riderDist || 0).toFixed(2) : 0, done: !!s.done,
  };
}
export function boatSense(B) {
  if (!B) return {};
  const s = B.state; let nw = null;
  for (const h of B.hazards || []) if (h.s > s.s - 1) { nw = { ds: +(h.s - s.s).toFixed(2), lat: +h.lat.toFixed(2) }; break; }
  return { mode: 'boat', t: +s.t.toFixed(3), left: +(s.total - s.s).toFixed(2), lat: +s.lat.toFixed(2), speed: +s.speed.toFixed(2), oar: s.phase, ready: B.ready(), wave: nw, arrived: s.arrived };
}
/* 배 카메라 — 뒤에서 조금 위 */
export function boatCam(camera, B, dt, C) {
  const r = B.root, yaw = B.state.yaw, tx = r.position.x - Math.sin(yaw) * 8.5, tz = r.position.z - Math.cos(yaw) * 8.5, ty = 4.2;
  if (!C.init) { C.x = tx; C.y = ty; C.z = tz; C.init = true; }
  const k = 1 - Math.exp(-dt * 3); C.x += (tx - C.x) * k; C.y += (ty - C.y) * k; C.z += (tz - C.z) * k;
  camera.position.set(C.x, C.y, C.z); camera.lookAt(r.position.x + Math.sin(yaw) * 8, 0.8, r.position.z + Math.cos(yaw) * 8);
}
