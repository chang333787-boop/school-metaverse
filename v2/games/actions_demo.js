// 행동 사전 빈 예시 장면(ENGINE-1 · 09-27 · 개발용) — 엔진 동사를 한 번씩 다 써 보는 판. 설계 = docs/tasks/story_engine.md '순서 1' · 정본 = docs/map_api.md §12
//   삽 찾기(들기) → 큰 나무 밑 파기 → 상자 → 쪽지(자리표시) → 기억 표시 → 열쇠(가방) → 잠긴 3학년 교실 문 열기 → 웅크리기 + 숨는 자리로 순찰 로봇 피하기 → 퍼즐 자리(자리표시) → 노을
//   ⚠️ 글은 전부 자리표시 — 이야기·쪽지·문제 글은 아이들이 쓴 것으로 바꿔 넣는다(임의 생성 금지). 화면 안내 줄(목표·칩)은 UI 문구.
//   사람(NPC)은 쫓는 것이 아니다 — 술래 = 이름 없는 '순찰' 역할 장난감 로봇. 잡혀도 벌 없음('딩동' → 교실 문 안쪽으로).
// 규칙(_template.js): import 금지 · 새 조명 없음 · 게임이 만든 것은 stop 때 범위 파사드·엔진 reset이 정리
export const meta = { id: 'actions_demo', title: '행동 사전 예시(개발용)', api: 1 };

const NOTE_CHEST = { title: '(쪽지 제목 자리)', body: '(여기에 아이들이 쓴 쪽지)' };
const NOTE_PUZZLE = { title: '(퍼즐 문제 자리)', body: '(여기에 아이들이 낸 문제)\n\n(칠판 옆 사물함 칸 수 = 퍼즐 숫자 자리)' };
const NOTE_END = { title: '(마무리 쪽지 자리)', body: '(여기에 아이들이 쓴 마무리 글)' };
const ROOM = 'grade3';                       // 잠입 칸 — 3학년 교실(문 둘: 주복도 쪽)
const GOALS = ['① 삽을 찾아 들어요', '② 큰 나무 밑을 파요', '③ 상자를 조사해요', '④ 열쇠로 3학년 교실 문을 열어요', '⑤ 순찰 로봇을 피해 퍼즐 자리까지(웅크리기 C · 숨기)', '끝!'];

export default async function start(map, params = {}) {
  let dead = false, st = 'prep';
  map.player.freeze(true);
  map.hud.banner('예시 장면 준비 중…', 30);
  map.sfx('warm');
  const nav = await map.nav();
  if (dead || map.gone) return {};
  const S = map.story, rng = map.rng(params.seed || 1);
  void rng;

  // ---------- 자리(월드에서) ----------
  const tree = map.poi('lm:big-tree'), ts = tree.stand;                       // 큰 나무 서는 칸 = 파는 자리
  const snapAt = (x, z, r = 3) => { const i = nav.snap(x, map.q.floorY(x, z), z, r); return i < 0 ? null : nav.pos(i); };
  // 큰 나무와 같은 구역(농구 모래 — 철망 안) 칸 중 나무에서 r0~r1m · 서쪽(운동장 쪽)부터
  const tz = map.zoneAt(ts[0], ts[1], ts[2]);
  const ring = (r0, r1, a0) => { for (let r = r0; r <= r1; r += 0.5) for (let k = 0; k < 16; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8, x = tree.x + Math.cos(a) * r, z = tree.z + Math.sin(a) * r;
    const i = nav.snap(x, ts[1], z, 0.6); if (i >= 0 && nav.zoneOf(i) === tz) return nav.pos(i); } return null; };
  const shovelAt = ring(3.5, 7, Math.PI * 0.8) || [ts[0] - 3, ts[1], ts[2]];
  const startAt = ring(8, 11, Math.PI * 0.9) || shovelAt;
  const room = map.zone(ROOM);
  const doors = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(room.id)).map(p => +p.id.slice(5));
  const dMain = doors.map(n => map.resolve('door:' + n)).sort((a, b) => a.x - b.x)[0];
  const mainDoor = doors.find(n => { const r = map.resolve('door:' + n); return r.x === dMain.x; });
  const outside = snapAt(dMain.x, dMain.z - 1.1, 1.5), inside = snapAt(dMain.x, dMain.z + 1.4, 1.5);
  // 교실 안 순찰 경로(네 귀퉁이 안쪽 1.6m — 길격자 칸) · 숨는 자리 후보(사물함·교탁 밑)
  const rin = [[room.x0 + 1.6, room.z0 + 2.2], [room.x1 - 1.6, room.z0 + 2.2], [room.x1 - 1.6, room.z1 - 1.6], [room.x0 + 1.6, room.z1 - 1.6]].map(([x, z]) => snapAt(x, z, 2)).filter(Boolean);
  const cands = map.hide.candidates({ zone: ROOM, kinds: ['locker', 'desk', 'cabinet'], near: [dMain.x, dMain.z], max: 6 });
  const goalAt = snapAt(room.x1 - 1.3, room.z1 - 1.2, 2) || rin[2];

  // ---------- 이야기 파일(표 모양 — 글은 자리표시) ----------
  const SCENES = [
    { id: 'start', do: [{ op: 'chapter', n: 1 }, { op: 'show', id: 'shovel', kind: 'shovel', at: shovelAt, h: 30, pick: true }, ...doors.map(n => ({ op: 'lockDoor', door: n, hot: n !== mainDoor }))] },   // 열쇠로 여는 문엔 '🔒' 지점 대신 '🔑 열쇠로 열기'
    { id: 'shovel_back', when: { flags: ['shovel_back'] }, do: [{ op: 'sound', sfx: 'pick' }] },
    { id: 'chest_open', when: { flags: { chest_open: true } }, do: [{ op: 'note', ...NOTE_CHEST }, { op: 'hide', id: 'chest' }, { op: 'give', item: 'key', icon: '🔑', label: '열쇠' },
      { op: 'moveNpc', name: '(인물 자리)', to: 'lm:podium', pose: 'stand', face: 180 }, { op: 'chapter', n: 2 }, { op: 'sound', sfx: 'ding' }] },
    { id: 'door_open', when: { flags: ['door_try'], has: ['key'] }, do: [{ op: 'unlockDoor', door: mainDoor }, { op: 'take', item: 'key' }, { op: 'flag', k: 'door_open' }, { op: 'chapter', n: 3 }] },
    { id: 'end', when: { flags: ['puzzle_seen'] }, do: [{ op: 'fade', sec: 1.2 }, { op: 'time', k: 'sunset' }, { op: 'note', ...NOTE_END }, { op: 'flag', k: 'done' }, { op: 'chapter', n: 4 }] },
  ];

  // ---------- 동사 연결 ----------
  let chest = null, chestInv = null, bot = null, digH = null, hides = [], placed = null, doorInv = null, puzzle = null, caughtN = 0;
  const marks = { shovel: null, next: null };
  const setMark = p => { if (marks.next) marks.next.remove(); marks.next = p ? map.mk.marker(p[0], p[1], p[2], { color: 0x3cc8ff, beam: true }) : null; map.minimap.setMarks(p ? [{ x: p[0], z: p[2], color: '#2b8fe0', shape: 'star', blink: true }] : []); };
  const goal = n => { map.hud.goal(GOALS[n]); };
  // ① 삽: 들기(손에 든 채 큰 나무로) · 삽 자리 = 놓는 자리(나중에 돌려놓으면 기억 'shovel_back')
  const shovelHome = map.carry.target({ x: shovelAt[0], y: shovelAt[1], z: shovelAt[2], accept: 'shovel', label: '📦 삽 제자리에 놓기', onPlace: () => S.flag('shovel_back', true) });
  // ② 파기: 큰 나무 서는 칸(농구 모래 구역) — 삽을 들고 있거나 가방에 있어야
  digH = map.dig.add({ x: ts[0], z: ts[2], radius: 1.3, need: 'shovel', needLabel: '삽', reveal: 'chest', onReveal: p => { chest = p; onChest(); } });
  function onChest() {
    runner.ent('chest', chest); goal(2); setMark([chest.x, chest.y, chest.z]);
    // ③ 조사하기: 상자 → 기억 chest_open → 이야기 파일이 쪽지·열쇠·장 넘기기
    chestInv = map.investigate.add({ x: chest.x, y: chest.y, z: chest.z, r: 1.4, label: '🔍 상자 열어 보기', once: true, onUse: () => { S.flag('chest_open', true); } });
  }
  // ④ 잠긴 문 앞: 열쇠로 열기(가방에 열쇠가 있어야 이야기 파일 door_open이 돈다)
  doorInv = map.investigate.add({ x: outside[0], y: outside[1], z: outside[2], r: 1.2, label: '🔑 열쇠로 열기', onUse: () => { if (!S.has('key')) { map.hud.toast('🔑 열쇠가 없어요'); return; } S.flag('door_try', true); } });
  // ⑤ 교실 안: 웅크리기 켜기 · 숨는 자리 · 순찰 로봇 · 퍼즐 자리
  function openRoom() {
    goal(4); setMark(goalAt); if (doorInv) { doorInv.remove(); doorInv = null; }
    map.player.crouch(true);
    for (const c of cands.slice(0, 3)) { const h = map.hide.add(c); if (h.spot) hides.push(h); }
    // 리뷰(ENGINE-1): 순찰은 문에서 먼 귀퉁이부터(예전엔 문 바로 안 귀퉁이에서 시작 → 들어서자마자 잡힘) · 잡히면 문 밖 복도로(문 안 1m 옆이 순찰 귀퉁이라 다시 잡히던 자리)
    const path = rin.length === 4 ? [rin[2], rin[3], rin[0], rin[1]] : rin;
    bot = map.chaser.spawn({ kind: 'patrol', at: path[0] || inside, path, zone: ROOM, speed: 1.1, chase: 2.6, fov: 80, range: 6, home: outside, onCatch: () => { caughtN++; map.player.teleport(outside, { h: 180 }); map.hud.toast('🔔 딩동! 교실 문 밖에서 다시'); } });
    puzzle = map.investigate.add({ x: goalAt[0], y: goalAt[1], z: goalAt[2], r: 1.2, label: '🔍 퍼즐 자리 조사하기', onUse: async () => { await map.note(NOTE_PUZZLE.title, NOTE_PUZZLE.body); S.flag('puzzle_seen', true); } });
  }
  const runner = S.run(SCENES, { onDone: () => {} });
  const offS = S.on((type, d) => {
    if (type === 'chapter' && d.n === 2) { goal(3); setMark(outside); }
    if (type === 'flag' && d.k === 'door_open') openRoom();
    if (type === 'flag' && d.k === 'done') finish();
  });
  void offS;
  // 삽 표식(들면 끔) · 들면 목표 ②
  const offC = map.on('carry', ev => { if (ev.prop && ev.prop.kind === 'shovel' && st === 'play' && !digH.dug) { goal(1); setMark(ts); } });
  void offC;

  async function finish() {
    st = 'end'; setMark(null); map.hud.goal(GOALS[5]); map.player.crouch(false);
    const i = await map.hud.ask('행동 사전 예시 끝!\n잡힌 횟수 ' + caughtN, ['그만하기']);
    if (dead) return; void i; map.quit();
  }

  // ---------- 시작 ----------
  map.player.teleport(startAt, { h: 90 });
  map.minimap.show();
  goal(0); setMark(shovelAt);
  map.player.freeze(false); map.hud.banner('시작!', 1.0); map.sfx('go');
  st = 'play';

  return {
    tick() {},
    stop() { dead = true; },
    // 시험·교사 시연용(자리·상태 읽기)
    get state() { return st; }, get caught() { return caughtN; }, get runner() { return runner; },
    get spots() { return { tree: ts, shovel: shovelAt, start: startAt, outside, inside, goal: goalAt, doors, mainDoor, rin, hides: hides.map(h => h.spot && { x: h.spot.x, z: h.spot.z, stand: h.spot.stand, label: h.spot.label, face: h.spot.face }) }; },
    get chest() { return chest; }, get bot() { return bot; }, get placed() { return shovelHome.placed; },
  };
}
