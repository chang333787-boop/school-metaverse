// 입력 — 키는 e.code(한글 입력기 'Process'도 그대로) · 톡 치기 걸쇠(다음 걸음이 보기 전에 뗀 키는 그 걸음 끝까지 눌린 채)
// 둘러보기 = 화면을 한 번 누르면 마우스 잠금(TPS · Esc로 풂) · 잠그지 않으면 끌기(터치패드·터치) · 터치 버튼과 봇은 같은 길 virtual(code, on)로 — 봇도 '입력만' 넣는다
const GAME = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);

/* 행동 → 키 — 장마다 쓰는 키는 여섯 개 안쪽(design.md 조작표가 정본) */
export const ACT = {
  fwd: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  jump: ['Space'], use: ['KeyF'], low: ['KeyC'], run: ['ShiftLeft', 'ShiftRight'],   // 11-01 교사: 메타버스처럼 Shift = 달리기 · C = 살금살금(켜고 끄기)
  t1: ['Digit1', 'Numpad1'], t2: ['Digit2', 'Numpad2'], t3: ['Digit3', 'Numpad3'], t4: ['Digit4', 'Numpad4'],
};

export function createInput(el) {
  const held = new Set(), hits = new Set(), late = new Set();
  const look = { x: 0, y: 0 }, out = { x: 0, y: 0 };
  let drag = false, dragId = -1, px = 0, py = 0, locked = false, zoom = 0;

  function kd(code) { if (!held.has(code)) hits.add(code); held.add(code); late.delete(code); }
  function ku(code) { if (hits.has(code)) late.add(code); else held.delete(code); }
  function clear() { held.clear(); hits.clear(); late.clear(); look.x = look.y = 0; zoom = 0; drag = false; }

  addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (GAME.has(e.code)) e.preventDefault();
    if (!e.repeat) kd(e.code);
  });
  addEventListener('keyup', (e) => ku(e.code));
  addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });

  el.addEventListener('pointerdown', (e) => { drag = true; dragId = e.pointerId; px = e.clientX; py = e.clientY; try { el.setPointerCapture(e.pointerId); } catch (_) { /* 이미 놓인 손가락 */ } });
  el.addEventListener('pointerup', (e) => { if (e.pointerId === dragId) drag = false; });
  el.addEventListener('pointercancel', () => { drag = false; });
  el.addEventListener('pointermove', (e) => {
    if (locked || !drag || e.pointerId !== dragId) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { drag = false; return; }   // 놓는 것을 못 받았으면(오른쪽 메뉴 등) 끌기를 풂
    const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;   // movementX는 크롬북 터치패드에서 튐
    if (Math.abs(dx) > 200 || Math.abs(dy) > 150) return;
    look.x += dx; look.y += dy;
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());   // 크롬북 두 손가락 탭 = 오른쪽 메뉴 → 끌기·키가 눌린 채 남던 것(11-01 점검)
  el.addEventListener('lostpointercapture', () => { drag = false; });
  /* 터치패드 두 손가락 쓸기 = 둘러보기 · 마우스 휠 한 칸(줄 단위 · 또는 가로 0인 큰 정수 한 번) = 카메라 거리(11-01 조작감 — 예전엔 휠 한 칸에 카메라가 14° 툭 꺾임) · 핀치(ctrl) = 거리 */
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const notch = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
    if (notch || e.ctrlKey) { zoom += Math.max(-120, Math.min(120, e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)); return; }
    look.x += e.deltaX * 0.6; look.y += e.deltaY * 0.6;
  }, { passive: false });
  /* TPS 마우스 둘러보기(11-01 교사 'TPS 방식으로') — 화면을 한 번 누르면 마우스 잠금 → 누르지 않고 움직이기만 해도 카메라가 돎 · Esc로 풂 · 터치는 예전처럼 끌기
     잠금 중 감도 = 메타버스와 같게(가로 0.0026 · 세로 0.0022 rad/px — v2 mouseApply · 카메라 쪽 끌기 감도 0.006·0.004에 ×0.433·×0.55) */
  el.addEventListener('click', (e) => {
    if (locked || e.pointerType === 'touch' || !I.lockGate()) return;
    try { const p = el.requestPointerLock(); if (p && p.catch) p.catch(() => { /* 못 잠그는 창 = 끌기 그대로 */ }); } catch (_) { /* 그대로 */ }
  });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === el; drag = false; if (I.onLock) I.onLock(locked); });
  document.addEventListener('mousemove', (e) => {
    if (!locked) return;
    const dx = e.movementX || 0, dy = e.movementY || 0;
    if (Math.abs(dx) > 300 || Math.abs(dy) > 300) return;            // 잠기는 순간 한 번 튀는 값
    look.x += dx * 0.433; look.y += dy * 0.55;
  });

  const I = {
    held: (code) => held.has(code), hit: (code) => hits.has(code),
    on: (a) => { const k = ACT[a]; for (let i = 0; i < k.length; i++) if (held.has(k[i])) return true; return false; },
    tap: (a) => { const k = ACT[a]; for (let i = 0; i < k.length; i++) if (hits.has(k[i])) return true; return false; },
    axis: (neg, pos) => (I.on(pos) ? 1 : 0) - (I.on(neg) ? 1 : 0),
    look: () => { out.x = look.x; out.y = look.y; look.x = look.y = 0; return out; },
    zoom: () => { const z = zoom; zoom = 0; return z; },          // 휠 칸 합(+ = 멀리) — 카메라가 읽음
    virtual: (code, on) => { if (on) kd(code); else ku(code); },
    lookAdd: (dx, dy) => { look.x += dx; look.y += dy; },
    endStep: () => { for (const c of late) held.delete(c); late.clear(); hits.clear(); },
    clear, heldList: () => [...held],
    locked: () => locked, unlock: () => { if (locked) try { document.exitPointerLock(); } catch (_) { /* 그대로 */ } },
    lockGate: () => true,                                           // 게임이 덮어씀(책·작업대가 열려 있으면 잠그지 않음)
  };
  return I;
}
