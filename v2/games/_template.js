// 게임 틀(MAP-API-1) — 새 게임은 이 파일을 복사해 시작한다. 정본 문서 = docs/map_api.md
// 규칙: ① import 금지(three 포함 — 필요한 건 map.three·map.* 로) ② 사람 NPC·인물 대사 금지(술래·목표는 장소·물건·공·표지)
//       ③ 문항·안내문은 교사 승인 데이터만 ④ 소품은 월드 면에서 5cm 이상 띄운다 ⑤ 드로우콜은 표식 풀(+2)·many(+1개씩) 합쳐 +15 이하
// map = 이 게임 전용 범위 파사드: 여기서 만든 이벤트·지점·트리거·충돌·표식·HUD·막기·경계·멈춤은 stop 때 자동 정리된다.
export const meta = { id: '_template', title: '게임 틀(개발용)', api: 1 };

export default async function start(map, params = {}) {
  map.player.freeze(true);
  map.hud.banner('지도 준비 중…', 30);
  const nav = await map.nav();                                  // 길격자(크롬북에선 나눠 짓는다)
  map.player.teleport(params.spawn ? 'spawn:' + params.spawn : 'spawn:front-walk');
  map.player.freeze(false);
  map.hud.banner('시작!', 1.2);

  // 예: 가운데 로비 입구점에 표식 하나 + 다가가면 끝(once 트리거)
  const rng = map.rng(params.seed || 1);
  const goal = map.resolve('zone:center-lobby');
  const mark = map.mk.marker(goal.x, goal.y, goal.z, { color: 0x3cc8ff });
  let found = 0;
  map.hud.chip('tmpl', '틀: 가운데 로비로 가 보세요');
  map.trigger.add({ x: goal.x, y: goal.y, z: goal.z, r: 1.2 }, { once: true, enter() { found++; mark.remove(); map.hud.chip('tmpl', '틀: 도착!'); map.hud.toast('✅ 도착했어요'); } });
  // H키: 길 안내 리본
  let trail = null;
  const off = map.on('tick', () => {});                        // 필요한 이벤트만 구독(범위 파사드가 stop 때 떼어 준다)
  const onKey = e => { if (e.code !== 'KeyH') return; const r = nav.path([map.player.get().x, map.player.get().y, map.player.get().z], 'zone:center-lobby'); if (trail) trail.remove(); if (r.ok) trail = map.mk.trail(r.pts); };
  addEventListener('keydown', onKey);
  void rng; void off;
  return {
    tick(dt) { void dt; },
    stop() { removeEventListener('keydown', onKey); },         // DOM 리스너처럼 파사드 밖 자원만 직접 정리
    get found() { return found; },
  };
}
