// 장 진행기 — 장 = 차례(steps) · 차례 하나 = 생성기 함수 run(G, C)(걸음마다 한 번 next) · 장소가 다르면 무대 그릇으로 바꿔 지음
// 도전 차례 = { id, verb, place, time, at, goal, easy, hints, limit, run, sense } · 이음 차례 = verb 없음(봇 판정 X)
// 실패 = run이 'retry'를 돌려줌 → 5초 안에 같은 자리에서 다시(장소는 그대로) · 끝 = true → 저장 → 다음
// 힌트: 손을 놓고 멈춘 시간 — 쉬움 10초 단계 1 · 20초 단계 2(하는 법 창 다시) · 보통 20초 단계 1 · 어려움 없음(design §8)
import { createCollide } from '../play/collide.js?v=15';

export function createRunner(G) {
  const R = { ch: null, idx: 0, step: null, C: null, it: null, busy: false, idleT: 0, hintLv: 0, stepT: 0, total: 0, log: [], done: false, fails: 0 };
  const HINT_AT = { easy: [10, 20], normal: [20, 999], hard: [999, 999] };

  /* 장 시작 — idx 차례부터(이어하기) */
  R.start = async (chapter, idx = 0) => {
    R.ch = chapter; R.idx = idx; R.done = false; R.total = 0;
    G.hud.veil.show(chapter.title, chapter.sub || '');
    await R.enter(idx);
  };
  /* 차례 들어가기 — 장소가 바뀌면 다시 짓고(덮개 아래), 플레이어를 자리에 */
  R.enter = async (idx) => {
    R.busy = true;
    const st = R.ch.steps[idx];
    R.step = st; R.idx = idx; R.stepT = 0; R.idleT = 0; R.hintLv = 0; R.fails = 0;
    if (G.diff === 'easy' && st.easy === false) {               // 쉬움에서 빼는 도전 = 책 그림 한 쪽으로(design §8)
      R.busy = false; R.it = bookPage(st); R.C = { actors: [] }; return;
    }
    const want = st.place, wantKey = want + '|' + (st.time || '') + '|' + (st.variant || '');
    if (want && (!G.place || G.placeKey !== wantKey)) {
      if (G.hud) G.hud.veil.show(R.ch.title, st.goal ? '' : '');
      await G.loadPlace(want, st.time, st.variant);
      G.placeKey = wantKey;
    }
    G.hud.veil.hide();
    begin();
    R.busy = false;
  };
  function begin() {
    const st = R.step;
    cleanup();
    R.C = { actors: [], t: 0, st };
    if (st.at) G.putPlayer(st.at);
    else if (st.atNew && G.freshPlace) G.putPlayer(st.atNew);      // 이 장소에서 처음 시작할 때만(앞 차례에서 이어지면 그 자리 그대로)
    G.freshPlace = false;
    G.hold ? G.hold(st.item ?? null) : (G.player.item = st.item ?? null); G.player.lock = false; G.player.pose = null; G.player.noReach = false; G.player.aiming = false; G.useSpots = [];
    G.hud.reset();
    if (st.goal) G.hud.goal(st.goal);
    if (st.verb && st.howto !== false) G.hud.howto(G.diff === 'easy' && st.verb === 'fly' ? 'flyEasy' : (st.howtoVerb || st.verb));
    R.it = st.run(G, R.C);
  }
  function cleanup() {
    if (!R.C) return;
    for (const a of R.C.actors) { if (a.root) a.root.removeFromParent(); if (a.dispose) a.dispose(); }
    R.C.actors.length = 0;
    if (R.C.cleanup) R.C.cleanup();
  }
  /* 쉬움에서 빠진 도전: 책 그림 한 쪽 4초(그림 + 한 줄) */
  function* bookPage(st) {
    G.hud.reset(); G.book.flash(st.bookPage || { title: st.goal, line: st.bookLine || '' });
    let t = 0; while (t < 4.5) { t += yield; }
    G.book.flash(null);
    return true;
  }
  R.restart = () => { R.fails++; begin(); };
  /* 걸음마다 */
  R.tick = (dt, I) => {
    if (R.busy || !R.it || R.done) return;
    R.stepT += dt; R.total += dt; if (R.C) R.C.t = R.stepT;
    /* 힌트 단계 — 키를 아무것도 안 누르고 멈춘 시간 */
    const st = R.step;
    if (st.verb && st.hints) {
      const moving = I.heldList().length > 0 || (G.player.W && G.player.W.speed > 0.3);
      R.idleT = moving ? 0 : R.idleT + dt;                       // 무엇이든 누르면 멈춤 시간을 처음부터(톡톡 누르는 동안 힌트가 뜨지 않게 · 팀 B)
      const at = HINT_AT[G.diff] || HINT_AT.normal;
      if (R.hintLv < 1 && R.idleT >= at[0] && st.hints[1]) { R.hintLv = 1; G.hud.hint(st.hints[1]); }
      if (R.hintLv < 2 && R.idleT >= at[1] && st.hints[2]) { R.hintLv = 2; G.hud.hint(st.hints[2]); G.hud.howto(st.howtoVerb || st.verb, 10); }
    }
    let r;
    try { r = R.it.next(dt); } catch (e) { console.error('step', st.id, e); R.done = true; return; }
    if (!r.done) return;
    if (r.value === 'retry') { R.log.push([st.id || '-', 'retry', +R.stepT.toFixed(1)]); R.restart(); return; }
    R.log.push([st.id || '-', 'ok', +R.stepT.toFixed(1), R.fails]);
    G.onStepDone && G.onStepDone(R.ch, R.idx, st);
    if (R.idx + 1 < R.ch.steps.length) { R.it = null; R.enter(R.idx + 1); }
    else { cleanup(); R.done = true; G.onChapterDone && G.onChapterDone(R.ch); }
  };
  R.sense = () => {
    const st = R.step;
    const s = { ch: R.ch ? R.ch.id : 0, idx: R.idx, id: st ? st.id || '' : '', verb: st ? st.verb || '' : '', busy: R.busy, done: R.done, t: +R.stepT.toFixed(2), hintLv: R.hintLv, fails: R.fails };
    if (st && st.sense && R.C && !R.busy) { try { Object.assign(s, st.sense(G, R.C)); } catch (e) { /* 아직 준비 전 */ } }
    return s;
  };
  return R;
}

/* 생성기 도우미 — yield* wait(2) · yield* until(() => 조건, 최대초) · yield* sayAll(G, [[who, text, icons], …]) */
export function* wait(sec) { let t = 0; while (t < sec) t += yield; }
export function* until(fn, max = 1e9) { let t = 0; while (!fn() && t < max) t += yield; return t < max; }
export function* sayAll(G, lines, gap = 0) { for (const l of lines) G.hud.say(l[0], l[1], l[2] || [], l[3] || {}); while (G.hud.busy()) yield; if (gap) yield* wait(gap); }
export { createCollide };
