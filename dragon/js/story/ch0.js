// 0장 오프닝(design §0 '오프닝 30초') — 노을 바다 위에서 투슬리스를 직접 몬다(쉬움 고정 · 앞으로 저절로 · 방향키 · Space 꾹 = 꼬리 펴서 휙 · 떨어지지 않음)
// → 그림 한 장 '처음엔 히컵도 드래곤이 무서웠어요' → 1장(runner가 이어서 엶) · 도전이 아니라 맛보기(이음 · 30초가 지나면 끝 · 봇 판정 X)
// 갈매기 떼가 도는 돌기둥 사이(바다 장소 course 앞 넷)를 길잡이로 둠 · 대사는 우리 말로 새로
import { wait, until, sayAll } from './runner.js?v=18';
import { awaitP, seedVillage } from './fx1.js?v=18';
import { flySense } from './flysense.js?v=18';

const SEC = 30;
function* opening(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, fly = pl.fly || {};
  const T = G.dragon('nightfury', A.lunch || A.spawn_air || { x: 0, z: 0 }, { mind: { fear: 0.05, trust: 0.95 }, noCollide: true }); C.T = T;
  yield* until(() => T.root && P.root, 8);
  const mod = yield* awaitP(import('../play/flight.js?v=18').catch(() => null));
  if (!mod || !mod.createFlight || !T.root) { yield* wait(1); return true; }
  const F = mod.createFlight({ world: fly, mode: 'easy', dragon: { root: T.root, rig: T.rig }, rider: P.root ? { root: P.root, rig: P.rig } : null, rng: G.rng });
  const gates = (pl.lists.course || []).slice(0, 4);
  F.setOpts({ assist: true, ceil: fly.ceil }); F.setGates(gates);
  const cam = mod.createFlightCam ? mod.createFlightCam(G.camera) : null;
  const sa = A.spawn_air || { x: 0, y: 40, z: 0, yaw: 0 };
  F.place(sa.x, sa.y || 40, sa.z, sa.yaw || 0);
  /* 비행 화면 글(팀 F) — 지나간 돌기둥 수만(쪽지는 숨김) */
  const ftm = yield* awaitP(import('../stages/flight_test.js?v=18').catch(() => null));
  const ui = ftm && ftm.makeUI ? ftm.makeUI('easy', false) : null;
  if (ui) { const nb = document.querySelectorAll('.fl-note'); nb.forEach((n) => { n.style.display = 'none'; }); ui.gates(0, gates.length); }
  T.manual = true; P.cam = 'fly'; C.F = F;
  let t = 0, idle = 0, hinted = 0;
  G.camDraw = (a, dt) => { F.draw(a, dt); if (cam) { if (cam.update) cam.update(dt, F); else cam.draw(a, dt, F); } if (ui && ui.tick) ui.tick(F, t); };
  C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; ui && ui.dispose(); };   // 그림 한 쪽은 1장 첫 차례가 닫음(장 사이 1.8초 동안 덮어 둠)
  G.hud.goal('투슬리스와 노을 하늘 날기'); G.hud.howto('flyEasy', 12);
  G.hud.say('hiccup', '가자, 친구! 바람을 타 보자!', ['finNew']);
  let shown = 0;
  while (t < SEC && !(F.state.gates >= gates.length && t > 18)) {
    const dt = yield; t += dt; F.step(dt, G.input);
    if (pl.gateMark && F.state) pl.gateMark(F.state.gates);
    if (ui && F.state.gates !== shown) { shown = F.state.gates; ui.gates(shown, gates.length); if (shown) G.sfx.play('whoosh'); }
    /* 손을 놓으면 힌트(오프닝은 도전이 아니라 runner 힌트 대신 여기서) */
    idle = G.input.heldList().length ? 0 : idle + dt;
    if (idle > 8 && hinted < 1) { hinted = 1; G.hud.hint('방향키로 갈매기 떼 쪽으로 몸을 돌려 보자.'); }
    if (idle > 16 && hinted < 2) { hinted = 2; G.hud.hint('Space를 꾹 누르면 꼬리가 펴져서 휙 돌아.'); G.hud.howto('flyEasy', 8); }
    if (!idle && hinted) { hinted = 0; G.hud.hint(''); }
  }
  G.hud.hint(''); G.hud.goal('');
  G.records['0-0'] = { gates: F.state.gates, t: +t.toFixed(1) };
  /* 그림 한 장 — 처음 이야기로 */
  G.hud.reset();
  G.book.flash({ title: '처음엔…', draw: 'nightfury', line: '처음엔 히컵도 드래곤이 무서웠어요.' });
  yield* wait(4.5);
  seedVillage(G);                                            // 1장 마을을 설계한 배치로(씨앗 상태)
  return true;
}

export const chapter = {
  id: 0, title: '버크의 드래곤 친구', sub: '노을 바다 위에서',
  steps: [
    { id: '0-0', place: 'sea', time: 'sunset', run: opening, sense: (G, C) => (C.F ? flySense(C.F) : {}) },
  ],
};
