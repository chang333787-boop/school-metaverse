// 세상 바꾸기 예시(WORLD-FX · NPC-MOVE · found2 09-27 · 개발용) — map.npc · map.world 동사를 한 번씩 써 보는 판. 정본 = docs/map_api.md §16
//   체육관: 사람 둘이 걸어서 모임(4학년 선생님 · 체육선생님 자리 바꿈) · 컨테이너·발판·비탈로 만든 작은 놀이 칸 · 단추를 누르면 다리(발판)가 올라옴 ·
//   선풍기 바람 · 튀어 오르는 판 · 현수막 글 · 4학년 칠판 그림 · 4학년 교실 불 끄기 · 체육관 문 연 채.
//   게임이 멈추면 전부 처음대로(사람 정점·이름표·충돌·소품·불·문·그림) — 수용 시험 found2/t6.cjs.
// 규칙(_template.js): import 금지 · 새 조명 없음 · 이름 있는 학생에게 대사를 주지 않는다(여기엔 대사 없음 — 화면 안내 줄만)
export const meta = { id: 'fx_demo', title: '세상 바꾸기 예시(개발용)', api: 1 };

export default async function start(map) {
  map.player.freeze(true);
  map.hud.banner('예시 준비 중…', 30);
  await map.nav();
  if (map.gone) return {};
  const g = map.zone('gym'), y = g.y ?? 0, cx = g.cx, cz = g.cz, W = map.world;
  // 놀이 칸(리뷰 found2: 예전엔 다리가 허공에서 끝나고 파란 발판은 점프로도 올라가 단추가 쓸모없었다 → 길이 하나인 작은 코스):
  //   노란 비탈 → 파란 발판(1.2m) → [단추로 올린] 주황 다리 → 가운데 초록 컨테이너 위(2.59m — 바닥·발판에선 점프로 안 닿고 다리 끝에서만 닿음) → 깃발 = 도착
  W.spawn('container', { x: cx - 9, z: cz - 4, y }, { h: 90, color: 0x3a7bd5 });
  W.spawn('container', { x: cx + 9, z: cz - 4, y }, { h: 90, color: 0xd9534f });
  const goalC = W.spawn('container', { x: cx + 1.3, z: cz - 0.2, y }, { h: 90, color: 0x2e9e5b });
  W.spawn('ramp', { x: cx - 5.4, z: cz + 3, y }, { size: [1.6, 1.2, 3.2], h: 0, color: 0xf2c230 });
  W.spawn('platform', { x: cx - 5.4, z: cz - 0.2, y }, { size: [1.6, 1.2, 3.2], color: 0x7ec8e3 });
  const bridge = W.spawn('platform', { x: cx - 2.6, z: cz - 0.2, y: y - 0.02 }, { size: [3.9, 0.12, 1.4], color: 0xff9f43 });
  const flag = W.spawn('flag', { x: cx + 1.3, z: cz - 0.2, y: goalC.top }, { color: 0xffd23c });
  let up = false, done = false;
  W.spawn('button', { x: cx - 2.6, z: cz + 3.2, y }, { label: '🔘 다리 올리기', onUse: () => {
    if (up) { map.hud.toast('다리는 벌써 올라왔어요 — 비탈로 올라가 건너 봐요'); return; }
    up = true; bridge.move({ x: cx - 2.6, y: y + 1.08, z: cz - 0.2 }, { tween: 1.6 }); map.hud.toast('다리가 올라와요!'); map.hud.goal('비탈 → 파란 발판 → 다리 → 초록 컨테이너 깃발!'); } });
  W.spawn('fan', { x: cx + 5.2, z: cz + 6, y }, { h: 270, wind: { len: 5, speed: 2.4 } });
  W.pad({ x: cx + 5.5, z: cz + 2, r: 0.6, vy: 7.5 }); W.spawn('box', { x: cx + 5.5, z: cz + 2, y: y - 0.44 }, { size: [1.1, 0.46, 1.1], color: 0x2ecc71, solid: false });
  const banner = W.spawn('banner', { x: cx, z: cz - 8.5, y }, { text: '세상 바꾸기 예시', h: 0 });
  const balloons = []; for (let i = 0; i < 5; i++) balloons.push(W.spawn('balloon', { x: cx - 2 + i, z: cz - 8.2, y: y + 0.2 }, { color: [0xff6b9d, 0x4fc3f7, 0xffd23c, 0x7bed9f, 0xa29bfe][i] }));
  const board = W.paint('board:grade4', { text: '체육관으로 모여요!', color: '#1c4096' });
  W.light('grade4', false);
  const gd = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(g.id)).map(p => +p.id.slice(5));
  if (gd.length) W.door(gd[0]).open();
  // 사람: 4학년 선생님이 교실에서 체육관으로 걸어오고, 체육선생님은 무대 앞에서 한 걸음 나와 반긴다(대사 없음)
  map.npc.move('체육선생님', { x: cx - 0.7, z: cz - 6, y }, { walk: true, pose: 'wave', face: 180 });
  map.npc.move('4학년 선생님', { x: cx + 0.7, z: cz - 6, y }, { walk: true, speed: 2.4, pose: 'stand', face: 180 });
  map.player.teleport([cx - 2.6, y, cz + 6.5], { h: 0 });
  map.player.freeze(false);
  map.hud.banner('세상 바꾸기 예시', 1.5);
  map.hud.goal('🔘 단추를 눌러 다리를 올려요(E / ✋)');
  map.hud.chip('fx', '🧪 사람 ' + map.npc.list().filter(p => p.moved).length + '명 옮김');
  const goalX = cx + 1.3, goalZ = cz - 0.2, goalY = goalC.top;
  function win() {   // 도착 = 세상이 바뀐다: 풍선이 떠오르고 · 현수막·칠판 글이 바뀌고 · 선생님 둘이 만세 · 깃발 색
    done = true; map.sfx('done'); map.hud.banner('🎉 도착!', 2.5); map.hud.goal('도착! 튀는 판·선풍기도 해 봐요 · ⏹ 끝');
    balloons.forEach((b, i) => b && b.move({ x: b.x, y: b.y + 3 + i * 0.4, z: b.z }, { tween: 2.5 + i * 0.3 }));
    if (banner) banner.remove(); W.spawn('banner', { x: cx, z: cz - 8.5, y }, { text: '다리 건너기 성공!', h: 0, fg: '#1f8a4c' });
    if (board) board.redraw({ text: '다리 건너기 성공!', color: '#1f8a4c' });
    if (flag) flag.color(0x2ecc71);
    for (const n of ['체육선생님', '4학년 선생님']) { const q = map.npc.get(n); if (q && !q.walking) map.npc.pose(n, 'cheer', 180); }   // 아직 걸어오는 중이면 그대로(길 한가운데서 멈춰 세우지 않게)
  }
  let t = 0;
  return {
    tick(dt) {
      if (!done) { const p = map.player.pos(); if (Math.abs(p.x - goalX) < 1.3 && Math.abs(p.z - goalZ) < 3.1 && p.y > goalY - 0.1) win(); }
      if ((t += dt) > 1) { t = 0; map.hud.chip('fx', '🧪 사람 ' + map.npc.list().filter(p => p.moved).length + '명 옮김'); } },
    stop() {},
  };
}
