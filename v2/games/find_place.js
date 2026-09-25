// 장소 찾기(GAME-FIND-1 · 09-26) — 기초 맵이 게임을 받는다는 것을 보여 주는 첫 예제 게임. 정본 문서 = docs/map_api.md §9
// 규칙(_template.js): ① import 금지(three는 map.three) ② 사람 NPC·인물 대사 금지 — 화면 글자는 UI 문구와 **지도에 이미 있는 장소 이름**뿐
//   ③ 문항·안내문 생성 없음 ④ 소품(표식·리본)은 map.mk(월드 면에서 6cm 이상 띄움) ⑤ 드로우콜 = 표식 풀 +2 · 길 리본 +1 (합쳐 +3)
// 흐름: 지도 준비 → 목표 5곳 고르기 → 3·2·1 → ①~⑤ 차례로 찾아가기 → 끝 화면(걸린 시간·가장 빠른 기록 · [다시 하기] [그만하기])
//   화면: 가운데 위 목표 줄 "① 찾아갈 곳: 과학실" · 오른쪽 위 칩 "1/5 · 00:32" · 미니맵 깜빡이는 점(처음부터) · 월드 빛기둥(목표 20m 안에 들면)
//   도착 = map.on('zone')으로 목표 이름의 구역에 들어감(구역 판정 규칙 그대로 — 높이 띠 포함) → 딩 + "도착! 과학실"
//   30초 넘게 못 찾으면 칩 "💡 H: 길 안내" → H(또는 칩 누름) = 지금 자리 → 목표 길 리본 5초
// 목표 고르기(pick): 구역 입구점(map.pois({src:'zone'})) 중
//   학생이 가도 되는 곳 — tags staff·kinder 빼기, kind 창고(storage)·조리/방송(service) 빼기, 차가 다니는 주차장 빼기
//   찾아갈 만한 곳 — 지나가는 길(corridor)·계단(stair)·8㎡ 안 되는 칸·게임용으로 덧붙인 넓은 구역(extra) 빼기 · 같은 이름은 한 곳(가장 넓은 구역)으로
//   지금 자리에서 길격자로 닿는 곳(nav.path ok) · 앞 목표와 20m 이상 · 동·층이 섞이게 · 이름 겹침 없음
//   난이도 = 한 판 안에서 가까운 곳 → 먼 곳(걷는 거리 띠 BANDS), '다시 하기'로 판을 거듭하면 띠를 조금씩 멀리(LIFT)
export const meta = { id: 'find_place', title: '장소 찾기', api: 1 };

const N_GOALS = 5, NUM = ['①', '②', '③', '④', '⑤'];
const BANDS = [[15, 55], [30, 80], [45, 110], [60, 140], [80, 400]];   // k번째 목표까지 걷는 거리(m) — 앞 목표(처음엔 출발 자리)에서
const LIFT = 12, BEAM_R = 20, HINT_T = 30, TRAIL_T = 5;
const NO_TAG = ['staff', 'kinder', 'nometa'], NO_KIND = ['storage', 'service', 'corridor', 'stair'];
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

export default async function start(map, params = {}) {
  let dead = false, st = 'prep', round = 0, targets = [], k = -1, T = 0, tSeek = 0, cd = 0, cdShown = -1, shownSec = -1, beamT = 0, trailT = 0, pendArrive = false, hintOn = false, hints = 0;
  let beam = null, trail = null, banH = null, best = map.store.get('best', null), last = null;
  const seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now();
  const rng = map.rng(seed);
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  map.player.freeze(true);
  map.hud.banner('지도 준비 중…', 30);
  map.sfx('warm');                                               // 소리 장치를 지금 만든다(첫 생성 ≈100ms — 3·2·1 도중 멈칫하지 않게)
  const nav = await map.nav();                                   // 길격자(크롬북에선 6ms씩 나눠 짓는다 · 한 번 지으면 캐시)
  if (dead) return {};
  if (params.spawn) map.player.teleport('spawn:' + params.spawn);
  map.minimap.show();

  // ---------- 후보: 이름마다 한 곳(가장 넓은 구역의 입구점) ----------
  const byLabel = new Map();
  for (const p of map.pois({ src: 'zone' })) {
    const z = map.zone(p.zone); if (!z || p.node == null) continue;
    if (z.extra || z.area < 8 || NO_KIND.includes(z.kind) || z.tags.some(t => NO_TAG.includes(t)) || (z.tags.includes('car') && z.kind === 'yard')) continue;
    const c = byLabel.get(z.label);
    if (!c || z.area > c.area) byLabel.set(z.label, { label: z.label, id: z.id, node: p.node, x: p.stand[0], y: p.stand[1], z: p.stand[2], area: z.area, floor: z.floor, group: (z.bldg || 'out') + z.floor });
  }
  const CANDS = [...byLabel.values()];

  // ---------- 목표 5곳 고르기(한 걸음마다 거리장 1번 — 크롬북에서 프레임을 나눠) ----------
  async function pick() {
    const me = map.player.get(); let from = nav.snap(me.x, me.y, me.z, 3);
    if (from < 0) { map.player.teleport('spawn:default'); const p2 = map.player.get(); from = nav.snap(p2.x, p2.y, p2.z, 3); }
    const here = (map.zone(me.zone) || {}).label, used = new Set([here]), groups = new Map(), out = [];
    let prev = { node: from, x: me.x, z: me.z, group: null };
    const lift = Math.min(3, round) * LIFT;
    for (let i = 0; i < N_GOALS && !dead; i++) {
      await frame(); if (dead) return null;
      const D = nav.distField(prev.node, 450), lo = BANDS[i][0] + lift, hi = BANDS[i][1] + lift;
      const sc = [];
      for (const c of CANDS) {
        if (used.has(c.label) || Math.hypot(c.x - prev.x, c.z - prev.z) < 20) continue;
        const d = D[c.node]; if (!isFinite(d)) continue;
        sc.push([(d < lo ? lo - d : d > hi ? d - hi : 0) + (c.group === prev.group ? 25 : 0) + (groups.get(c.group) || 0) * 14 + rng() * 16, c]);
      }
      sc.sort((a, b) => a[0] - b[0]);
      let got = null;
      for (const [, c] of sc.slice(0, 12)) { const r = nav.path(prev.node, c.node, { maxExp: 400000 }); if (r.ok) { got = { ...c, len: Math.round(r.len) }; break; } }
      if (!got) break;
      out.push(got); used.add(got.label); groups.set(got.group, (groups.get(got.group) || 0) + 1); prev = got;
    }
    return out;
  }

  // ---------- 진행 ----------
  function chip() { map.hud.chip('fp', (k + 1) + '/' + targets.length + ' · ' + fmt(T)); }
  function clearTrail() { if (trail) { trail.remove(); trail = null; } trailT = 0; }
  function activate(i) {
    k = i; tSeek = 0; hintOn = false; beamT = 0; clearTrail(); if (beam) { beam.remove(); beam = null; }
    map.hud.chip('fp-hint', null);
    const t = targets[i];
    map.hud.goal(NUM[i] + ' 찾아갈 곳: ' + t.label + (t.floor === 2 ? ' (2층)' : ''));
    map.minimap.setMarks([{ x: t.x, z: t.z, color: '#e0503c', label: t.label, blink: true, floor: t.floor }]);
    shownSec = -1; chip();
    const zn = map.zone(map.player.get().zone); pendArrive = !!zn && zn.label === t.label;   // 이미 그 안이면 다음 틱에 도착
  }
  function arrive() {
    const t = targets[k]; pendArrive = false;
    map.sfx('ding'); banH = map.hud.banner('도착! ' + t.label, 1.6); t.at = T;
    if (beam) { beam.remove(); beam = null; } clearTrail(); map.hud.chip('fp-hint', null);
    if (k + 1 < targets.length) activate(k + 1); else finish();
  }
  async function finish() {
    st = 'end'; if (banH) banH.remove(); map.hud.goal(null); map.minimap.setMarks([]); map.hud.chip('fp', targets.length + '/' + targets.length + ' · ' + fmt(T));   // 배너를 먼저 치운다(끝 창과 겹침 0)
    const rec = best == null || T < best; if (rec) { best = T; map.store.set('best', T); }
    last = { time: T, best, rec, hints, round };
    map.sfx('done');
    const i = await map.hud.ask('🎉 ' + targets.length + '곳을 모두 찾았어요!\n걸린 시간 ' + fmt(T) + (rec ? '\n🏆 새 기록!' : '\n가장 빠른 기록 ' + fmt(best)), ['다시 하기', '그만하기']);
    if (dead) return;
    if (i === 0) begin(round + 1); else map.quit();
  }
  // 길 안내(H · 30초 뒤부터): 지금 자리 → 목표 길 리본 5초
  function guide() {
    if (st !== 'seek' || !hintOn) return;
    const me = map.player.get(), r = nav.path([me.x, me.y, me.z], targets[k].node, { maxExp: 400000 });
    if (!r.ok) { map.hud.toast('여기서는 길을 찾지 못했어요 — 조금 움직여 보세요'); return; }
    clearTrail(); trail = map.mk.trail(r.pts, { color: 0x3cc8ff, width: 0.45 }); trailT = TRAIL_T; hints++;
  }
  const onKey = e => { if (e.code === 'KeyH' && !e.repeat) guide(); };
  addEventListener('keydown', onKey);
  map.on('zone', ev => { if (st === 'seek' && ev.next && targets[k] && ev.next.label === targets[k].label) arrive(); });

  // 한 판 시작(처음·다시 하기): 목표 고르기 → 3·2·1
  async function begin(r) {
    round = r; st = 'prep'; k = -1; T = 0; targets = []; clearTrail(); if (beam) { beam.remove(); beam = null; }
    map.hud.goal(null); map.hud.chip('fp-hint', null); map.minimap.setMarks([]);
    map.player.freeze(true); map.hud.banner(r ? '새 장소를 고르는 중…' : '지도 준비 중…', 30);
    const list = await pick(); if (dead || !list) return;
    if (list.length < N_GOALS) console.warn('[장소 찾기] 목표를 ' + list.length + '곳만 골랐어요');
    if (!list.length) { map.hud.banner('갈 수 있는 곳을 찾지 못했어요', 3); map.player.freeze(false); st = 'end'; return; }
    targets = list; st = 'count'; cd = 3; cdShown = -1;
    map.hud.chip('fp', '0/' + targets.length + ' · 00:00');
  }
  await begin(0);

  return {
    tick(dt) {
      if (dead) return;
      if (st === 'count') {
        cd -= dt; const n = Math.ceil(cd);
        if (n !== cdShown) { cdShown = n; if (n > 0) { map.hud.banner(String(n), 1.2); map.sfx('tick'); } }
        if (cd <= 0) { st = 'seek'; map.player.freeze(false); map.hud.banner('출발!', 0.9); map.sfx('go'); activate(0); }
        return;
      }
      if (st !== 'seek') return;
      T += dt; tSeek += dt;
      if (Math.floor(T) !== shownSec) { shownSec = Math.floor(T); chip(); }
      if (pendArrive) { arrive(); return; }
      const t = targets[k];
      if (!beam && (beamT += dt) >= 0.25) { beamT = 0; const me = map.player.get();   // 빛기둥은 20m 안에 들어와야(처음부터 보이면 너무 쉽다)
        if (Math.hypot(me.x - t.x, me.z - t.z) < BEAM_R) beam = map.mk.marker(t.x, t.y, t.z, { color: 0xffd23c, beam: true }); }
      if (!hintOn && tSeek > HINT_T) { hintOn = true; map.hud.chip('fp-hint', '💡 H: 길 안내', { onClick: guide }); }
      if (trail && (trailT -= dt) <= 0) clearTrail();
    },
    stop() { dead = true; removeEventListener('keydown', onKey); },   // 표식·리본·칩·목표 줄·미니맵·이벤트는 범위 파사드가 정리
    // 시험·교사용 읽기
    get state() { return st; }, get round() { return round; }, get k() { return k; }, get elapsed() { return T; }, get last() { return last; }, get seed() { return seed; },
    get targets() { return targets.map(t => ({ label: t.label, id: t.id, node: t.node, x: t.x, y: t.y, z: t.z, floor: t.floor, group: t.group, len: t.len, at: t.at })); },
    guide,
  };
}
