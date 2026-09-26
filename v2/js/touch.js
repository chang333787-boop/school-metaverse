// v2 터치 조작(TOUCH-1 · 09-26 사용자 "스마트폰으론 못 보네") — 휴대폰·태블릿에서 걷고·보고·뛰고·문 열기/앉기.
//   켜지는 때: 터치가 주 입력(matchMedia '(pointer: coarse)')이거나 화면을 처음 터치한 순간. 키보드·마우스(크롬북·PC) 동작은 그대로 — 터치 UI는 그때까지 DOM에 숨어 있다.
//   ① 왼쪽(화면 폭 45%) — 엄지가 닿은 자리에 가상 조이스틱. 아날로그 입력 T.mx(오른쪽 +)·T.my(앞 +)·T.m(0~1) → main.js physics가 키 이동과 같은 식으로 쓴다(가장자리까지 밀면 달리기)
//   ② 나머지 캔버스 드래그 = 카메라(ctx.look(dx, dy) — 마우스와 같은 부호). 손가락은 identifier로 따로 쫓는다(조이스틱 + 시점 동시에)
//   ③ 오른쪽 아래 버튼: 점프(누르는 동안 = Space) · 행동(= E, 가까이 할 것이 있으면 노랗게) · 시점(= V)
//   ④ 세로 화면이면 '가로로 돌려 주세요' 안내(글자만 — 그림은 계속 그린다)
//   매 프레임 하는 일 없음(이벤트 때만) · 새 객체는 이벤트 때 문자열 정도. import 없음.
export function touchPrimary() {
  try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches; } catch (e) { return false; }
}
export function createTouch(ctx) {
  const { canvas, look, act, view } = ctx;
  const T = { on: false, mx: 0, my: 0, m: 0, jump: false, jumpT: 0, joyId: -1, lookId: -1, near: false, taps: 0 };
  const JR = 62;   // 조이스틱 반지름(CSS px) — 이만큼 밀면 m = 1
  if (!document.getElementById('touch-css')) {
    const css = document.createElement('style'); css.id = 'touch-css';
    css.textContent = [
      '#scene{touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}',
      'html,body{overscroll-behavior:none}',
      'body.touch{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
      '.tch{display:none}',
      'body.touch .tch{display:flex}',
      // 버튼 — HUD 칩과 같은 남색 반투명 · 둥근 장난감 버튼
      '.tbtn{position:fixed;z-index:22;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;background:rgba(29,53,87,.55);color:#fff;border:3px solid rgba(255,255,255,.55);'
        + 'font-family:sans-serif;font-weight:700;touch-action:none;box-shadow:0 3px 0 rgba(0,0,0,.18);transition:transform .08s}',
      '.tbtn i{font-style:normal;line-height:1}.tbtn span{font-size:12px;margin-top:2px}',
      '.tbtn.dn{transform:scale(.92);background:rgba(29,53,87,.8)}',
      '#tJump{right:calc(18px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));width:78px;height:78px;font-size:28px}',
      '#tAct{right:calc(106px + env(safe-area-inset-right));bottom:calc(30px + env(safe-area-inset-bottom));width:66px;height:66px;font-size:24px}',
      '#tAct.hot{background:#ffc828;color:#1d3557;border-color:#fff;box-shadow:0 0 0 4px rgba(255,200,40,.45),0 3px 0 rgba(0,0,0,.18);animation:tPulse 1s ease-in-out infinite}',
      '@keyframes tPulse{50%{transform:scale(1.07)}}',
      '#tView{right:calc(186px + env(safe-area-inset-right));bottom:calc(34px + env(safe-area-inset-bottom));width:56px;height:56px;font-size:20px}',   // 아래 한 줄(위쪽 오른편은 미니맵 자리)
      // 조이스틱(엄지 자리에 뜬다)
      '#tJoy{position:fixed;left:0;top:0;z-index:21;width:' + JR * 2 + 'px;height:' + JR * 2 + 'px;margin:-' + JR + 'px 0 0 -' + JR + 'px;border-radius:50%;background:rgba(29,53,87,.28);border:3px solid rgba(255,255,255,.5);pointer-events:none;visibility:hidden;align-items:center;justify-content:center}',
      '#tJoy b{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 2px 0 rgba(0,0,0,.2)}',
      '#tJoy.run{border-color:#ffd23c}',
      // 조이스틱 자리 안내(손대기 전 · 반투명 동그라미)
      '#tJoyHint{position:fixed;left:calc(34px + env(safe-area-inset-left));bottom:calc(34px + env(safe-area-inset-bottom));z-index:19;width:' + JR * 2 + 'px;height:' + JR * 2 + 'px;border-radius:50%;border:3px dashed rgba(255,255,255,.55);'
        + 'pointer-events:none;align-items:center;justify-content:center;color:rgba(255,255,255,.9);font:700 13px sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.5)}',
      // 세로 안내
      '#tRot{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;pointer-events:none;background:rgba(29,53,87,.85);color:#fff;padding:14px 22px;border-radius:14px;font:700 18px sans-serif;text-align:center;line-height:1.5;flex-direction:column;align-items:center;white-space:nowrap}',
      '@media (orientation: landscape){body.touch #tRot{display:none}}',
      // 기존 HUD를 손가락 크기로 · 자리 옮김(오른쪽 아래는 버튼 자리 → 시간·놀이 칩은 왼쪽 위 📍 아래 줄)
      'body.touch #help,body.touch #fps{display:none}',   // fps 칩(개발용)은 좁은 화면에서 목표 줄·미니맵과 겹친다
      'body.touch #timeChip,body.touch #gpick{top:calc(50px + env(safe-area-inset-top));bottom:auto!important;min-height:40px;box-sizing:border-box;display:flex;align-items:center;font-size:15px!important;padding:6px 14px!important}',
      'body.touch #timeChip{left:calc(10px + env(safe-area-inset-left));right:auto!important}',
      'body.touch #gpick{left:calc(104px + env(safe-area-inset-left));right:auto!important}',
      'body.touch #gpick-panel{left:10px!important;right:auto!important;top:98px!important;bottom:auto!important;max-height:calc(100vh - 110px);overflow:auto}',
      'body.touch #toast{top:calc(98px + env(safe-area-inset-top))!important}',   // 리뷰: 가운데 위 알림이 왼쪽 위 칩 줄(시간·놀이)과 겹쳤다(iPhone SE)
      'body.touch #hint{bottom:calc(112px + env(safe-area-inset-bottom))!important;font-size:16px!important;padding:10px 18px!important}',
    ].join('\n');
    document.head.appendChild(css);
  }
  const mk = (id, cls, html) => { const d = document.createElement('div'); d.id = id; d.className = 'tch ' + cls; d.innerHTML = html; document.body.appendChild(d); return d; };
  const joy = mk('tJoy', '', '<b></b>'), knob = joy.firstChild;
  const joyHint = mk('tJoyHint', '', '이동');
  const bJump = mk('tJump', 'tbtn', '<i>⤴</i><span>점프</span>');
  const bAct = mk('tAct', 'tbtn', '<i>✋</i><span>행동</span>');
  const bView = mk('tView', 'tbtn', '<i>👁</i>');
  mk('tRot', '', '<div>📱↻ 가로로 돌려 주세요</div><span style="font-size:14px;font-weight:400">가로 화면이 더 넓게 보여요</span>');

  let gOnce = false;
  function enable() {
    if (T.on) return; T.on = true; document.body.classList.add('touch');
    // 캔버스 밖(HUD 칩 사이 빈틈)을 두 번 눌러 확대·당겨서 새로고침 막기 — iOS Safari는 user-scalable=no를 무시한다
    if (!gOnce) { gOnce = true; document.addEventListener('gesturestart', e => { if (T.on) e.preventDefault(); }, { passive: false });
      document.addEventListener('dblclick', e => { if (T.on) e.preventDefault(); }, { passive: false }); }
    ctx.onMode && ctx.onMode(true);
  }
  // 리뷰(09-26): 손가락 상태를 모두 푼다 — 창이 포커스를 잃거나 숨으면 touchend가 안 올 수 있다(알림·앱 전환 → 끝없이 걷던 문제)
  function reset() {
    joyEnd(); T.lookId = -1; T.jump = false; T.jumpT = 0;
    bJump.classList.remove('dn'); bAct.classList.remove('dn'); bView.classList.remove('dn');
  }
  // 리뷰(09-26): 터치 화면 크롬북 — 한 번 터치한 뒤 다시 마우스·키보드를 쓰면 데스크톱 화면으로 돌아간다(포인터 잠금도 다시 된다).
  //   터치가 주 입력인 기기(휴대폰·태블릿)는 블루투스 키보드를 써도 그대로 터치 화면.
  function disable() {
    if (!T.on || touchPrimary()) return; reset(); T.on = false; document.body.classList.remove('touch'); joyHint.style.display = '';
    ctx.onMode && ctx.onMode(false);
  }
  // ---------- 캔버스 손가락(조이스틱·시점) ----------
  let jx0 = 0, jy0 = 0, lx = 0, ly = 0;
  function joyAt(x, y) {   // 조이스틱 판 가운데 = 엄지 자리
    jx0 = x; jy0 = y;   // 리뷰(09-26): 화면 안으로 당기지 않는다 — 아래 가장자리를 누르면 당긴 만큼 이미 '밀린' 것이 되어 손대자마자 뒤로 달렸다(판은 조금 잘려 보여도 된다)
    joy.style.transform = 'translate(' + jx0 + 'px,' + jy0 + 'px)'; knob.style.transform = ''; joy.style.visibility = 'visible'; joyHint.style.display = 'none';
  }
  function joyMove(x, y) {
    let dx = x - jx0, dy = y - jy0; const d = Math.hypot(dx, dy);
    if (d > JR) { dx *= JR / d; dy *= JR / d; }
    const m = Math.min(1, d / JR);
    T.m = m < 0.15 ? 0 : m; T.mx = T.m ? dx / JR : 0; T.my = T.m ? -dy / JR : 0;   // 화면 위 = 앞
    knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    joy.classList.toggle('run', m >= 0.92);
  }
  function joyEnd() { T.joyId = -1; T.m = T.mx = T.my = 0; joy.style.visibility = 'hidden'; joy.classList.remove('run'); }
  function onStart(e) {
    enable(); if (e.cancelable) e.preventDefault();
    // 리뷰(09-26): 끝 이벤트를 잃은 손가락(화면에 더는 없는 id)은 버린다 — 안 그러면 조이스틱이 영영 '누른 채'
    if (T.joyId >= 0 || T.lookId >= 0) { let jOk = false, lOk = false;
      for (let i = 0; i < e.touches.length; i++) { const id = e.touches[i].identifier; if (id === T.joyId) jOk = true; if (id === T.lookId) lOk = true; }
      if (T.joyId >= 0 && !jOk) joyEnd(); if (!lOk) T.lookId = -1; }
    for (const t of e.changedTouches) {
      if (T.joyId < 0 && t.clientX < innerWidth * 0.45 && t.clientY > innerHeight * 0.3) { T.joyId = t.identifier; joyAt(t.clientX, t.clientY); joyMove(t.clientX, t.clientY); }
      else if (T.lookId < 0) { T.lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }
  }
  function onMove(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === T.joyId) joyMove(t.clientX, t.clientY);
      else if (t.identifier === T.lookId) { look(t.clientX - lx, t.clientY - ly); lx = t.clientX; ly = t.clientY; }
    }
  }
  function onEnd(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) { if (t.identifier === T.joyId) joyEnd(); else if (t.identifier === T.lookId) T.lookId = -1; }
  }
  const PF = { passive: false };
  canvas.addEventListener('touchstart', onStart, PF); canvas.addEventListener('touchmove', onMove, PF);
  canvas.addEventListener('touchend', onEnd, PF); canvas.addEventListener('touchcancel', onEnd, PF);
  canvas.addEventListener('contextmenu', e => { if (T.on) e.preventDefault(); });
  // 캔버스 밖을 처음 터치해도(HUD 칩) 켠다 — 버블링만 보고 막지는 않는다(칩 누르기 그대로)
  addEventListener('touchstart', enable, { passive: true, capture: true });
  addEventListener('blur', () => reset());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') reset(); });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') disable(); }, true);   // 터치의 pointerType은 'touch' — 진짜 마우스만
  addEventListener('keydown', e => { if (!e.repeat) disable(); }, true);
  if (touchPrimary()) setTimeout(enable);   // 다음 차례에(부르는 쪽 main.js가 아직 HUD를 다 짓기 전이다)

  // ---------- 버튼 ----------
  function btn(el, down, up) {
    el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('dn'); down(); }, PF);
    const u = e => { e.preventDefault(); el.classList.remove('dn'); up && up(); };
    el.addEventListener('touchend', u, PF); el.addEventListener('touchcancel', u, PF);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  btn(bJump, () => { T.jump = true; T.jumpT = 0.25; }, () => { T.jump = false; });   // jumpT: 한 프레임보다 짧게 톡 쳐도 뛴다
  btn(bAct, () => { T.taps++; act(); });
  btn(bView, () => view());

  return Object.assign(T, {
    enable, disable, reset,
    setNear(h) { const on = !!h; if (on === T.near) return; T.near = on; bAct.classList.toggle('hot', on); },   // 무엇인지는 가운데 아래 안내 칩(#hint — 눌러도 된다)이 말한다
    els: { joy, bJump, bAct, bView },
  });
}
