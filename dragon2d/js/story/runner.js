// 장 진행 — 장 = 차례 목록 · 차례 = 생성기(run*) · 걸음마다 dt를 받음 · 끝 = return true · 실패 = return 'retry'(1초 뒤 같은 자리에서 다시)
// 지금 할 일(목표만) · 하는 법 창(그 장에서 처음 쓰는 동사) · 힌트 단계(쉬움 10·20초 · 보통 20·30초 · 어려움 없음 — 손을 놓고 있을 때만) · 차례마다 저장
// 차례 = { id, place, time, goal, verb, hints:[1단계, 2단계], limit, at(히컵 시작 x), run*(G), sense(G) }
import { makePlace } from '../play/world.js?v=1';
import { clearFx, FX } from '../play/fx.js?v=1';
import { writeSlot, flushSlot } from './save.js?v=1';
import { createBody } from '../play/body.js?v=1';

export const CH_TITLES = ['먼 훗날', '습격의 밤', '숲의 자국', '숨은 호수', '생선과 이름', '꼬리날개', '하늘을 나는 법', '아빠의 투구', '아스트리드와 둥지', '마지막 시험', '대장 드래곤', '함께 사는 버크'];
export const LAST_CH = 11;

/* 차례 안에서 쓰는 도움 생성기 */
export function* wait(s) { let t = 0; while (t < s) t += yield; }
export function* until(fn, max = 1e9) { let t = 0; while (!fn() && t < max) t += yield; return t < max; }

export function createRunner(G) {
  const R = { ch: null, chN: -1, idx: 0, step: null, gen: null, t: 0, idle: 0, hintLv: 0, fails: 0, state: 'idle', wait: 0, seen: new Set(), done: false, n: 0 };
  const V = () => G.V;
  async function loadCh(n) { const m = await import('./ch' + n + '.js?v=1'); return m.chapter; }

  R.start = async (n, idx = 0) => {
    R.state = 'load'; G.hud.reset();
    R.chN = n; R.ch = await loadCh(n); R.idx = Math.min(idx, R.ch.steps.length - 1); R.seen.clear();
    G.hud.veil.show(n === 0 ? '먼 훗날' : n + '장 · ' + CH_TITLES[n], R.ch.sub || '');
    setTimeout(() => { begin(); G.hud.veil.hide(); }, G.turbo ? 50 : 1300);
    if (n + 1 <= LAST_CH) loadCh(n + 1).catch(() => {});      // 다음 장 미리 받기
  };
  function begin() {
    const st = R.ch.steps[R.idx]; R.step = st;
    G.hud.reset(); G.cast.clear(true); clearFx(); G.flags = { retry: R.fails }; G.drawOver = null; G.drawUnder = null; G.flyPose = null; G.boss = null; G.book.close && G.book.open && !G.book.draw && G.book.close();
    document.querySelectorAll('.stepui').forEach((e) => e.remove());
    const pl = st.place || R.ch.place, tm = (G.diff === 'easy' && (st.timeEasy || R.ch.timeEasy)) || st.time || R.ch.time || 'day';
    if (!G.W || G.W.name !== pl || G.W.time !== tm || st.fresh) G.W = makePlace(pl, tm, st.placeOpt || {}); else G.W.dropTmp();
    G.place = G.W;
    const keepHelm = G.P ? G.P.helmet : 0, at = st.at || G.W.A.start || [4, 4];
    G.P = G.player = createBody(at[0], at[1]); G.P.helmet = st.helmet ?? keepHelm; if (st.face) { G.P.fx = st.face[0]; G.P.fy = st.face[1]; G.P.dir = Math.abs(st.face[0]) > Math.abs(st.face[1]) ? 'side' : st.face[1] < 0 ? 'up' : 'down'; G.P.flip = st.face[0] < 0 ? -1 : 1; }
    G.Fl = null; G.mode = 'walk'; G.goal = null; G.fspots.length = 0; G.marks.length = 0; G.camOpt = {}; G.V.setZoom(st.zoom || 1);
    G.V.snap(G.P.x, G.P.y - 0.8, G.W.bounds); G.cam = G.V.cam;
    G.hud.goal(st.goal || '');
    const verb = st.verb && (R.ch.howto?.[st.id] || st.verb);
    if (verb && !R.seen.has(verb)) { R.seen.add(verb); G.hud.howto(verb, 9); }
    R.gen = st.run(G); R.t = 0; R.idle = 0; R.hintLv = 0; G.hud.hint(''); R.state = 'run'; R.n++;
    save();
  }
  function save(force) {
    if (!G.slot) return;
    const best = Math.max(G.best.ch, R.chN), bestIdx = R.chN > G.best.ch ? R.idx : R.chN === G.best.ch ? Math.max(G.best.idx, R.idx) : G.best.idx;
    G.best = { ch: best, idx: bestIdx };
    writeSlot(G.slot, { grade: G.grade, diff: G.diff, ch: R.chN, idx: R.idx, best, bestIdx, book: G.book.state(), inv: G.inv }, force);
  }
  R.tick = (dt) => {
    if (R.state === 'wait') { R.wait -= dt; if (R.wait <= 0) { R.state = 'idle'; R.after(); } return; }
    if (R.state !== 'run') return;
    R.t += dt;
    /* 힌트 — 손을 놓고 있으면(입력 없음) 단계가 오름 */
    const st = R.step, hints = st.hints;
    if (G.I.any() || Math.abs(G.P.vx) > 0.5) R.idle = 0; else R.idle += dt;
    if (hints && G.diff !== 'hard') {
      const t1 = G.diff === 'easy' ? 10 : 20, t2 = t1 + 10;
      const lv = R.idle > t2 || R.t > (st.limit || 90) ? 2 : R.idle > t1 || R.t > (st.limit || 90) * 0.6 ? 1 : 0;
      if (lv > R.hintLv) { R.hintLv = lv; G.hud.hint(hints[lv - 1] || hints[0]); if (lv === 2 && st.verb) G.hud.howto(R.ch.howto?.[st.id] || st.verb, 8); }
    }
    let r;
    try { r = R.gen.next(dt); } catch (e) { console.error(e); G.diag.errs.push(String(e && e.message || e)); r = { done: true, value: true }; }
    if (!r.done) return;
    if (r.value === 'retry') {
      R.fails++; G.hud.banner(G.diff === 'easy' ? '괜찮아요 — 다시 한 번!' : '다시 한 번!', 'heart', 1.6);
      R.state = 'wait'; R.wait = G.turbo ? 0.3 : 1.1; R.after = () => begin();
      return;
    }
    R.fails = 0;
    if (R.idx + 1 < R.ch.steps.length) { R.idx++; R.state = 'wait'; R.wait = st.gap ?? 0.5; R.after = () => begin(); save(); }
    else endCh();
  };
  function endCh() {
    const n = R.chN;
    if (R.ch.end) G.hud.banner(R.ch.end, 'book', 3.2);
    R.state = 'wait'; R.wait = G.turbo ? 0.4 : 3;
    R.after = () => {
      if (n >= LAST_CH || G.Q.get('chain') === '0') { R.done = true; R.state = 'done'; flushSlot(); G.onDone && G.onDone(n); return; }
      R.idx = 0; R.chN = n + 1; save(true); R.start(n + 1, 0);
    };
  }
  R.skip = () => { if (R.state === 'run') { R.gen = (function* () { return true; })(); } };
  R.jump = (n, i) => R.start(n, i);
  return R;
}
