// 입력 — 키는 e.code · 동작 이름으로 묶음(방향키·WASD 걷기 · Shift 달리기 · Space 점프 · F 쓰기 · C 살금살금 켜고 끄기) · 터치 화면이면 버튼
// 걸음(1/60초)마다 눌림·뗌 가장자리를 셈 · 봇은 같은 동작 이름으로 키만 넣음(상태 직접 쓰기 X)
const MAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'run', ShiftRight: 'run', Space: 'jump', KeyF: 'use', KeyJ: 'use', Enter: 'use', KeyC: 'sneak',
};
export const ACTS = ['left', 'right', 'up', 'down', 'run', 'jump', 'use', 'sneak'];

export function createInput(el) {
  const raw = {}, bot = {}, touch = {};
  const I = { down: {}, pressed: {}, released: {}, held: {}, botOn: false, last: 0, n: 0 };
  for (const a of ACTS) { I.down[a] = false; I.pressed[a] = false; I.released[a] = false; I.held[a] = 0; }
  const prev = {};
  addEventListener('keydown', (e) => {
    const a = MAP[e.code]; if (!a) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    e.preventDefault(); raw[e.code] = true; I.last = performance.now();
  }, { passive: false });
  addEventListener('keyup', (e) => { if (MAP[e.code]) { raw[e.code] = false; e.preventDefault(); } });
  addEventListener('blur', () => { for (const k in raw) raw[k] = false; });

  /* 터치 버튼(터치 화면 크롬북 · 휴대폰) — 왼쪽 ◀ ▶ ▲ ▼ · 오른쪽 달리기 · 점프 · F */
  if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window && navigator.maxTouchPoints > 0) {
    const wrap = document.createElement('div'); wrap.id = 'touch';
    const B = [['left', '◀', 'l1'], ['right', '▶', 'l2'], ['up', '▲', 'l3'], ['down', '▼', 'l4'], ['run', '달리기', 'r1'], ['jump', '점프', 'r2'], ['use', 'F', 'r3'], ['sneak', '살금', 'r4']];
    wrap.innerHTML = B.map(([a, t, c]) => `<button data-a="${a}" class="${c}">${t}</button>`).join('');
    document.body.appendChild(wrap);
    wrap.querySelectorAll('button').forEach((b) => {
      const a = b.dataset.a;
      const on = (e) => { e.preventDefault(); touch[a] = true; b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); touch[a] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
  }

  /* 걸음 시작마다 — 지금 눌린 것 · 가장자리 · 누른 시간 */
  I.poll = (dt) => {
    I.n++;
    for (const a of ACTS) {
      let d = false;
      if (I.botOn) d = !!bot[a];
      else { for (const c in MAP) if (MAP[c] === a && raw[c]) { d = true; break; } if (touch[a]) d = true; }
      I.pressed[a] = d && !prev[a]; I.released[a] = !d && prev[a];
      I.held[a] = d ? I.held[a] + dt : 0; I.down[a] = d; prev[a] = d;
    }
  };
  I.dir = () => (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0);
  I.vdir = () => (I.down.up ? 1 : 0) - (I.down.down ? 1 : 0);
  /* 봇 — 동작 이름으로 누르기·떼기만 */
  I.botSet = (a, v) => { bot[a] = !!v; };
  I.botClear = () => { for (const a of ACTS) bot[a] = false; };
  I.heldList = () => ACTS.filter((a) => I.down[a]);
  I.any = () => ACTS.some((a) => I.pressed[a]);
  return I;
}
