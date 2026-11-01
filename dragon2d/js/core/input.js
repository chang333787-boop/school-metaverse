// 입력(탑뷰 2D · 교사 11-02 '2D 게임에 맞는 키보드 조작으로') — 포켓몬·젤다 결
//   방향키·WASD = 이동(8방향 · 대각선도 같은 빠르기) · Space(Enter·Z·F도) = 쓰기·확인·대화 넘기기(꾹 = 손 내밀기) · Shift = 달리기
//   X(C·K도) = 그 차례에만 쓰는 동작 하나(I.actMode): 'jump' 점프로 피하기 · 'sneak' 누르고 있는 동안 살금살금 · 'tail' 날 때 꼬리 펴기 · null 없음
//   키는 e.code(한글 입력기가 켜져도 같은 자리) · 누르고 있어도 한 번(가장자리만 셈 · 키 반복은 무시) · 터치 화면이면 버튼
// 안쪽 동작 이름: left right up down run use jump sneak (봇도 같은 이름 · 'act' = X 키와 같음 — 차례 동작에 따라 jump/sneak으로 바뀜)
const MAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'use', Enter: 'use', NumpadEnter: 'use', KeyZ: 'use', KeyF: 'use', KeyX: 'act', KeyC: 'act', KeyK: 'act',
};
export const ACTS = ['left', 'right', 'up', 'down', 'run', 'jump', 'use', 'sneak'];
const RAW = ['left', 'right', 'up', 'down', 'run', 'use', 'act'];

export function createInput(el) {
  const raw = {}, bot = {}, touch = {};
  const I = { down: {}, pressed: {}, released: {}, held: {}, botOn: false, last: 0, n: 0, actMode: null };
  for (const a of ACTS) { I.down[a] = false; I.pressed[a] = false; I.released[a] = false; I.held[a] = 0; }
  const prev = {};
  addEventListener('keydown', (e) => {
    const a = MAP[e.code]; if (!a) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' && (a === 'use'))) return;   // 단추에 초점이 있으면 Space·Enter = 그 단추
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault(); raw[e.code] = true; I.last = performance.now();
  }, { passive: false });
  addEventListener('keyup', (e) => { if (MAP[e.code]) { raw[e.code] = false; e.preventDefault(); } });
  addEventListener('blur', () => { for (const k in raw) raw[k] = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) for (const k in raw) raw[k] = false; });

  /* 터치 버튼(터치 화면 크롬북 · 휴대폰) — 왼쪽 ◀ ▶ ▲ ▼ · 오른쪽 Space(쓰기) · X(그 차례 동작 — 글이 바뀜) · 달리기 */
  let actBtn = null;
  if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window && navigator.maxTouchPoints > 0) {
    const wrap = document.createElement('div'); wrap.id = 'touch';
    const B = [['left', '◀', 'l1'], ['right', '▶', 'l2'], ['up', '▲', 'l3'], ['down', '▼', 'l4'], ['run', '달리기', 'r1'], ['act', 'X', 'r2'], ['use', 'Space', 'r3']];
    wrap.innerHTML = B.map(([a, t, c]) => `<button data-a="${a}" class="${c}">${t}</button>`).join('');
    document.body.appendChild(wrap);
    wrap.querySelectorAll('button').forEach((b) => {
      const a = b.dataset.a; if (a === 'act') actBtn = b;
      const on = (e) => { e.preventDefault(); touch[a] = true; b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); touch[a] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
  }
  const ACT_LABEL = { jump: '점프', sneak: '살금', tail: '꼬리', null: 'X' };
  I.setAct = (m) => { I.actMode = m || null; if (actBtn) { actBtn.textContent = ACT_LABEL[I.actMode]; actBtn.style.display = I.actMode ? '' : 'none'; } };

  /* 걸음 시작마다 — 지금 눌린 것 · 가장자리 · 누른 시간 · X는 차례 동작으로 바뀜 */
  const r = {};
  I.poll = (dt) => {
    I.n++;
    for (const a of RAW) {
      let d = false;
      if (I.botOn) d = !!bot[a];
      else { for (const c in MAP) if (MAP[c] === a && raw[c]) { d = true; break; } if (touch[a]) d = true; }
      r[a] = d;
    }
    const m = I.actMode;
    const eff = { left: r.left, right: r.right, up: r.up, down: r.down, run: r.run, use: r.use,
      jump: (m === 'jump' || m === 'tail') && (r.act || (I.botOn && !!bot.jump)),
      sneak: m === 'sneak' && (r.act || (I.botOn && !!bot.sneak)) };
    for (const a of ACTS) {
      const d = !!eff[a];
      I.pressed[a] = d && !prev[a]; I.released[a] = !d && prev[a];
      I.held[a] = d ? I.held[a] + dt : 0; I.down[a] = d; prev[a] = d;
    }
  };
  I.dir = () => (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0);
  I.vdir = () => (I.down.up ? 1 : 0) - (I.down.down ? 1 : 0);
  /* 봇 — 동작 이름으로 누르기·떼기만('act' = X 키 · 'jump'/'sneak'은 그 차례 동작일 때만 먹힘) */
  I.botSet = (a, v) => { bot[a] = !!v; };
  I.botClear = () => { for (const a of RAW.concat(['jump', 'sneak'])) bot[a] = false; };
  I.heldList = () => ACTS.filter((a) => I.down[a]);
  I.any = () => ACTS.some((a) => I.pressed[a]);
  return I;
}
