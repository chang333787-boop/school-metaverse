// v2 오프닝 화면 · 놀이 고르기(TITLE-1 · 09-27 사용자 "이 프로그램 자체의 오프닝 화면 — '정림초에 오신 것을 환영합니다' … 들어가면 각종 게임을 선택 · 애니메이션도 게임처럼")
//   켜지는 때: v2/ 를 ?game= · ?tour=1 · ?shot= · ?check=1 · ?health=1 · ?title=0 없이 열 때만(main.js TITLE_ON — 게이트·시험 주소는 예전과 똑같다).
//   흐름: 로딩 막(index.html #boot — 진짜 빌드 단계로 막대가 찬다) → 제목 화면(살아 있는 3D 학교 위 · 카메라가 내 캐릭터 앞에서 물러나며 학교를 한 바퀴)
//        → ▶ 시작하기(클릭·터치·Enter·Space — 첫 손짓 뒤에만 짧은 소리) → 놀이 고르기 카드(registry.js의 dev 아닌 게임 + '자유 탐험' · 새 게임은 자동으로 보인다)
//        → 카드 고르기 = 동그라미 닦기(wipe) + 카메라가 날아와 내 캐릭터 뒤로 → 게임은 🎮 놀이 칩과 같은 길(game.load)로 시작.
//   돌아가기: 🏠 메뉴 칩(🎮 칩 옆) = 지금 게임을 멈추고 같은 닦기로 놀이 고르기. 🎮 놀이 칩은 그대로 쓴다. 마지막 고른 것 = localStorage 'sm2.title.last'(try/catch).
//   그리기: 카메라는 평소 루프(main.js step 끝의 setCam 고리) — 새 조명·새 물체 없음 · 매 프레임 할당 없음(스크래치 벡터). 화면 움직임은 CSS(transform·opacity)만 — v2/title.css.
//   import 없음 — main.js가 THREE·카메라·플레이어·게임 로더를 준다.
//   PROMO-1(09-29 교사 "그냥 school-metaverse로 끝나는 주소는 홍보 주소"): 홍보판(루트 index.html — window.SM_PROMO)은 놀이 카드 없이 ▶ 견학 시작하기 → 바로 견학(tour) · 🏠 = 처음 화면으로.
export function createTitle(h) {
  const { THREE, camera, P, CTRL, keys, touch, tone, toast, game, picker, setCam } = h;
  const PROMO = !!window.SM_PROMO, PROMO_GAME = { id: 'tour', title: '우리 학교 견학', icon: '🚌' };
  const store = { get(k, d) { try { const v = localStorage.getItem('sm2.title.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sm2.title.' + k, JSON.stringify(v)); } catch (e) { /* 비공개 창 — 이번 판만 */ } } };
  let muted = !!store.get('mute', false), heard = false;   // heard = 첫 손짓(클릭·터치·키)이 있었나 — 그 전엔 소리를 내지 않는다
  const snd = (f, t0, d, ty, v, e) => { if (!muted && heard) tone(f, t0, d, ty, v, e); };
  const jingle = () => { [523, 659, 784, 1047].forEach((f, i) => snd(f, i * 0.1, 0.32, 'triangle', 0.18)); snd(1568, 0.42, 0.5, 'sine', 0.09); snd(2093, 0.52, 0.6, 'sine', 0.06); };
  const blip = () => snd(880, 0, 0.06, 'triangle', 0.05);
  const whoosh = () => { snd(260, 0, 0.42, 'sine', 0.14, 1100); snd(1319, 0.25, 0.25, 'triangle', 0.08); };

  // ---------- 카메라 길(학교 한 바퀴) — 좌표 = layout.js 기준(운동장 남쪽 · 큰 나무 · 동쪽 마당 · 뒤 텃밭 · 서관) ----------
  const Y0 = P.y, KX = P.x, KZ = P.z, TREE = h.SCHOOL && h.SCHOOL.bigTree || [36.8, 28.4];
  const V3 = a => new THREE.Vector3(a[0], a[1], a[2]);
  const ORB_P = [[8, 15, 36], [TREE[0] + 13, 12, TREE[1] - 4], [64, 21, -24], [26, 27, -92], [-60, 22, -56], [-44, 14, 16]];
  const ORB_L = [[6, 1, -30], [TREE[0], 6.5, TREE[1]], [14, 1, -40], [4, 1, -38], [2, 1, -34], [8, -1, -4]];
  const orbP = new THREE.CatmullRomCurve3(ORB_P.map(V3), true, 'centripetal'), orbL = new THREE.CatmullRomCurve3(ORB_L.map(V3), true, 'centripetal');
  // 첫 장면: 내 캐릭터 얼굴 앞(손 흔드는 중)에서 뒤로·위로 물러나며 학교가 드러나고, 한 바퀴 길의 첫 점으로 이어진다
  //   캐릭터는 제목 글자를 피해 왼쪽 아래에(넓은 화면일수록 더 왼쪽 — 세로 휴대폰은 가운데 아래)
  const AS = Math.max(0, Math.min(1, (camera.aspect - 0.6) / 1.17)), CX0 = KX + 0.3 + 0.7 * AS, LX0 = KX + 0.3 + 1.4 * AS;
  const inP = new THREE.CatmullRomCurve3([[CX0, Y0 + 1.3, KZ + 3.8], [CX0 - 0.6, Y0 + 2.8, KZ + 9.5], [KX - 2, Y0 + 8, KZ + 22], ORB_P[0]].map(V3), false, 'centripetal');
  const inL = new THREE.CatmullRomCurve3([[LX0, Y0 + 1.75 + (1 - AS) * 0.9, KZ], [LX0 - 0.8, Y0 + 1.6, KZ - 5], [KX - 3, 1.5, KZ - 16], ORB_L[0]].map(V3), false, 'centripetal');
  const ORB_T = 56;   // 한 바퀴 초
  // 이어지는 곳에서 속도가 튀지 않게: 첫 장면은 (1 − cos) 가속 — 끝 속도(π/2 · 길이/시간)가 한 바퀴 속도와 같아지는 시간
  const IN_T = Math.max(6, Math.min(12, Math.PI / 2 * inP.getLength() * ORB_T / orbP.getLength()));
  const _p = new THREE.Vector3(), _l = new THREE.Vector3(), _fp = new THREE.Vector3(), _fq = new THREE.Quaternion(), _q = new THREE.Quaternion();
  let tf = 0, fly = null, fov0 = 50;
  function flyover(dt, skipIntro) {
    tf += dt;
    if (!skipIntro && tf < IN_T) { const u = 1 - Math.cos(tf / IN_T * Math.PI / 2); inP.getPointAt(u, _p); inL.getPointAt(u, _l); }
    else { const u = (((tf - (skipIntro ? 0 : IN_T)) / ORB_T) % 1 + 1) % 1; orbP.getPointAt(u, _p); orbL.getPointAt(u, _l); }
    camera.position.copy(_p); camera.lookAt(_l);
    if (camera.fov !== 50) { camera.fov = 50; camera.updateProjectionMatrix(); }
  }
  let resumeOrbit = false;
  const camTitle = dt => flyover(dt, resumeOrbit);
  // 날아오기: 평소 카메라(main.js가 방금 정한 자리 = 목표)로 — 위치는 곡선(가운데가 솟는 호) · 방향은 slerp · 화각도 섞는다
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function camFly(dt) {
    const f = fly; f.t = (performance.now() - f.t0) / 1000; const e = ease(Math.min(1, f.t / f.dur));   // 실제 시간(느린 기기에서도 닦기와 맞게)
    const tx = camera.position.x, ty = camera.position.y, tz = camera.position.z, tfov = camera.fov;
    const arc = Math.sin(Math.PI * e) * f.arc;
    camera.position.set(f.p.x + (tx - f.p.x) * e, f.p.y + (ty - f.p.y) * e + arc, f.p.z + (tz - f.p.z) * e);
    _q.copy(camera.quaternion); camera.quaternion.slerpQuaternions(f.q, _q, e);
    const fv = f.fov + (tfov - f.fov) * e; if (Math.abs(camera.fov - fv) > 0.01) { camera.fov = fv; camera.updateProjectionMatrix(); }
    if (f.t >= f.dur) { fly = null; setCam(null); f.done && f.done(); }
  }
  function startFly(dur, done) {
    _fp.copy(camera.position); _fq.copy(camera.quaternion); fov0 = camera.fov;
    const dist = Math.hypot(P.x - _fp.x, P.z - _fp.z);
    fly = { t: 0, t0: performance.now(), dur, p: _fp, q: _fq, fov: fov0, arc: Math.min(14, dist * 0.12), done }; setCam(camFly);
  }

  // ---------- 화면(DOM) — 모양·움직임은 v2/title.css ----------
  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  const cap = (s = 1) => '<svg class="ttl-kid" viewBox="0 0 64 64" width="' + 64 * s + '" height="' + 64 * s + '" aria-hidden="true">'   // 노란 모자 치비(내 캐릭터 얼굴)
    + '<circle cx="32" cy="36" r="21" fill="#f7d6b5" stroke="#1d3557" stroke-width="3"/>'
    + '<path d="M11 33 C11 14 53 14 53 33 Z" fill="#f2c230" stroke="#1d3557" stroke-width="3" stroke-linejoin="round"/>'
    + '<path d="M40 31 C48 30 58 32 60 35 C54 37 46 36 40 35 Z" fill="#e0ac1c" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<circle cx="32" cy="16" r="3" fill="#e0ac1c" stroke="#1d3557" stroke-width="2"/>'
    + '<ellipse cx="25" cy="40" rx="2.4" ry="3.2" fill="#2d2a33"/><ellipse cx="39" cy="40" rx="2.4" ry="3.2" fill="#2d2a33"/>'
    + '<path d="M27 47 Q32 51 37 47" fill="none" stroke="#9a4a42" stroke-width="2.4" stroke-linecap="round"/>'
    + '<circle cx="20" cy="46" r="3" fill="#f6b9a8" opacity=".8"/><circle cx="44" cy="46" r="3" fill="#f6b9a8" opacity=".8"/></svg>';
  // 홍보판 배지(09-29 교사 참고 포스터) — 로딩 막(index.html .tb-prb)도 같은 모양 · 모양은 title.css .prb
  const PRB = '<div class="prb"><div class="prb-sch"><b>2026</b> 폰 프리 스쿨 실천학교</div>'
    + '<div class="prb-slo"><span>Phone <b class="off">Off</b>,</span><span>RAS <b class="on">On</b>!</span></div><small>Reading · Arts · Sports</small></div>';
  const root = el('div', 'ttl-keep'); root.id = 'ttl'; root.dataset.ph = 'title';
  const COLORS = ['#ffd23c', '#ff9f43', '#ff7eb6', '#7cc8ff', '#7ee08a'];
  let ci = 0;
  const letters = s => [...s].map(c => c === ' ' ? '<span class="sp"> </span>' : '<span class="ch" style="--i:' + ci + ';--c:' + COLORS[ci++ % COLORS.length] + '"><span>' + c + '</span></span>').join('');
  const L1 = letters('정림초에 오신 것을'), L2 = letters('환영합니다!');
  const spk = [[6, 12, 0], [93, 18, 0.6], [15, 88, 1.1], [86, 84, 0.3], [48, 4, 1.6], [2, 52, 2.1], [97, 55, 0.9], [30, 96, 1.8], [70, 98, 2.4]]
    .map(([x, y, d], i) => '<i class="spk" style="left:' + x + '%;top:' + y + '%;--d:' + d + 's;--s:' + (0.7 + (i % 3) * 0.3) + '">✦</i>').join('');
  root.innerHTML = '<div class="ttl-vig"></div>'
    + '<button class="ttl-mute" type="button" aria-label="소리 켜고 끄기"></button>'
    + '<section class="ttl-home">'
    +   (PROMO   // 홍보판(09-29 교사): 폰 프리 스쿨 실천학교 표어 'Phone Off, RAS On'(RAS = Reading·Arts·Sports — 경기도교육청 정책)을 환영 글 위에
        ? '<div class="ttl-logo ttl-pr">' + PRB + '</div>'
        : '<div class="ttl-logo">' + cap(1) + '<span>우리 학교 메타버스</span></div>')
    +   '<h1 class="ttl-h" aria-label="정림초에 오신 것을 환영합니다!"><span class="ln">' + L1 + '</span><span class="ln">' + L2 + '</span>' + spk + '</h1>'
    +   (PROMO ? '<div class="ttl-sub ttl-addr"><b>🏫 정림초등학교</b><span>경기도 화성시 효행구 정남면 망월길 69</span></div>' : '<div class="ttl-sub">🏫 정림초등학교 · 3D 학교 놀이터</div>')
    +   '<button class="ttl-start" type="button"><b>▶</b> ' + (PROMO ? '학교 둘러보기' : '시작하기') + '</button>'
    +   '<div class="ttl-keys"><span class="kd">클릭 · Enter · Space</span><span class="kt">화면을 톡 눌러요</span></div>'
    + '</section>'
    + '<section class="ttl-menu" aria-label="놀이 고르기">'
    +   '<header><button class="ttl-back" type="button" aria-label="처음 화면">◀</button><div class="ttl-mlogo">' + cap(0.55) + '</div><h2>어떤 놀이를 할까요?</h2></header>'
    +   '<div class="ttl-grid" role="list"></div>'
    +   '<div class="ttl-foot">← → ↑ ↓ 고르기 · Enter 시작 · 게임 중엔 🏠 메뉴로 돌아와요</div>'
    + '</section>';
  document.body.appendChild(root);
  const wipe = el('div', 'ttl-keep', '<div class="c"></div><div class="ico"></div><div class="tx"></div>'); wipe.id = 'ttl-wipe'; document.body.appendChild(wipe);
  const home = el('div', 'chip', '<span class="ico">🏠</span><span class="lbl"> ' + (PROMO ? '처음으로' : '메뉴') + '</span>'); home.id = 'homeChip'; home.title = PROMO ? '처음 화면으로' : '놀이 고르기 화면으로'; home.style.display = 'none'; document.body.appendChild(home);
  const $ = s => root.querySelector(s), grid = $('.ttl-grid'), muteB = $('.ttl-mute');
  const paintMute = () => { muteB.textContent = muted ? '🔇' : '🔊'; muteB.classList.toggle('off', muted); };
  paintMute();

  // ---------- 놀이 카드(registry.js — dev 아닌 것 + 자유 탐험) ----------
  const GROUPS = { 탐험: { c: '#3aa0e8', e: '🧭' }, 대결: { c: '#f06a4a', e: '⚔️' }, 모험: { c: '#35b36b', e: '🗺️' }, 이야기: { c: '#b36ae0', e: '📖' }, 놀이: { c: '#e8a21a', e: '🎲' } };
  const GORDER = Object.keys(GROUPS);
  const FREE = { id: '', title: '자유 탐험', icon: '🏫', group: '탐험', short: '학교 어디든 마음대로 걸어 다녀요' };
  const mmss = s => { s = Math.max(0, Math.round(+s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function best(id, e) {   // 게임이 map.store로 남긴 기록(sm2.game.<id>.<키>) — registry best: {k, u:'s'(초)|'n'(개수)|단위, lbl}
    for (const b of [].concat(e.best || [])) { let v = null; try { v = JSON.parse(localStorage.getItem('sm2.game.' + id + '.' + b.k)); } catch (x) { v = null; }
      if (v == null || (Array.isArray(v) && !v.length)) continue;
      const pre = b.lbl ? b.lbl + ' ' : '';
      return b.u === 's' ? '🏆 ' + pre + mmss(v) : b.u === 'n' ? '🎫 ' + pre + (Array.isArray(v) ? v.length : v) + '개' : '🏆 ' + pre + v + (b.u || ''); }
    return null;
  }
  let cards = [], list = [], focusI = 0, filled = Promise.resolve();
  async function fill() {
    let G = {};
    try { G = (await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url))).GAMES || {}; } catch (e) { console.error('[오프닝] 놀이 목록을 못 불러옴', e); }
    const ids = Object.keys(G).filter(id => !G[id].dev);
    list = [FREE, ...ids.map(id => ({ id, ...G[id] }))];
    const gi = e => { const k = GORDER.indexOf(e.group); return k < 0 ? GORDER.length : k; };
    list = list.map((e, i) => ({ e, i })).sort((a, b) => gi(a.e) - gi(b.e) || a.i - b.i).map(o => o.e);   // 무리(탐험·대결·모험·이야기·놀이)끼리 — 무리 안은 registry 순서
    const last = store.get('last', null);
    grid.textContent = '';
    cards = list.map((e, i) => {
      const g = GROUPS[e.group] || GROUPS.놀이, b = e.id ? best(e.id, e) : null;
      const c = el('button', 'card', '<span class="cin"><span class="gt"><i>' + g.e + '</i><span> ' + (GROUPS[e.group] ? e.group : '놀이') + '</span></span>'
        + '<span class="ic">' + (e.icon || '🎮') + '</span><b></b><span class="ds"></span>' + (b ? '<span class="bs"></span>' : '') + (last === e.id ? '<span class="lt">지난번</span>' : '') + '</span>');
      c.type = 'button'; c.setAttribute('role', 'listitem'); c.style.setProperty('--i', i); c.style.setProperty('--gc', g.c); c.dataset.game = e.id;
      c.querySelector('b').textContent = e.title || e.id; c.querySelector('.ds').textContent = e.short || e.desc || '';
      if (b) c.querySelector('.bs').textContent = b;
      c.addEventListener('click', ev => { ev.stopPropagation(); choose(i); });
      c.addEventListener('pointerenter', () => { if (phase === 'menu') { focusI = i; c.focus({ preventScroll: true }); blip(); } });
      c.addEventListener('focus', () => { focusI = i; });
      grid.appendChild(c); return c;
    });
    focusI = Math.max(0, list.findIndex(e => e.id === last));
  }

  // ---------- 단계: title → menu → go → off(🏠) → back → menu ----------
  let phase = 'boot', calmT = 0;   // calmT: 이 시각 전엔 시작·고르기 입력을 받지 않는다(로딩 중 눌러 둔 Enter·꾹 누른 키·두 번 탭이 제목→메뉴→게임으로 줄줄이 넘어가지 않게)
  const calm = ms => { calmT = performance.now() + ms; }, calmOK = () => performance.now() >= calmT;
  const onKey = e => {
    if (phase === 'off') return;
    e.stopImmediatePropagation(); if (e.type !== 'keydown') return;   // 제목·메뉴·날아오기 동안 키는 월드로 가지 않는다(WASD로 뒤에서 걷지 않게)
    heard = true;
    if (e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) { e.preventDefault(); return; }
    if (phase === 'title') { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { e.preventDefault(); toMenu(); } return; }
    if (phase !== 'menu') return;
    const n = cards.length; if (!n) return;
    const cols = Math.max(1, cards.filter(c => c.offsetTop === cards[0].offsetTop).length);
    let k = focusI;
    if (e.code === 'ArrowRight') k++; else if (e.code === 'ArrowLeft') k--; else if (e.code === 'ArrowDown') k += cols; else if (e.code === 'ArrowUp') k -= cols;
    else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { e.preventDefault(); choose(focusI); return; }
    else if (e.code === 'Escape') { toTitle(); return; }
    else return;
    e.preventDefault(); k = Math.max(0, Math.min(n - 1, k)); if (k !== focusI) { focusI = k; cards[k].focus(); blip(); }
  };
  addEventListener('keydown', onKey, true); addEventListener('keyup', e => { if (phase !== 'off' && phase !== 'go') e.stopImmediatePropagation(); }, true);
  function lockWorld() { keys.clear(); try { touch.reset(); } catch (e) { /* */ } document.exitPointerLock?.(); picker && picker.close && picker.close(); document.body.classList.add('title-on'); }
  root.addEventListener('pointerdown', () => { heard = true; });
  root.addEventListener('click', e => { if (phase === 'title' && !muteB.contains(e.target)) toMenu(); });
  muteB.addEventListener('click', e => { e.stopPropagation(); heard = true; muted = !muted; store.set('mute', muted); paintMute(); if (!muted) blip(); });
  $('.ttl-back').addEventListener('click', e => { e.stopPropagation(); toTitle(); });

  function show(ph) { phase = ph; root.dataset.ph = ph; root.style.display = ''; }
  function bootDone() {   // main.js: 첫 프레임을 그린 뒤 — 로딩 막을 걷고 제목 글자를 띄운다
    lockWorld(); CTRL.wave = 1e9; tf = 0; resumeOrbit = false; setCam(camTitle); show('title'); calm(1200);
    const b = document.getElementById('boot');
    if (b) { window.bootP && window.bootP(1, 0.25); setTimeout(() => { b.classList.add('out'); root.classList.add('go'); setTimeout(() => b.remove(), 600); }, 260); }
    else root.classList.add('go');
    filled = fill();
  }
  function toMenu() {
    if (phase !== 'title' || !calmOK()) return; heard = true; jingle(); calm(450);
    if (PROMO) { const r = $('.ttl-start').getBoundingClientRect(); launch(PROMO_GAME, r); return; }   // 홍보판: 카드 없이 바로 견학
    show('menu'); filled.then(() => setTimeout(() => { if (phase === 'menu' && cards[focusI]) cards[focusI].focus({ preventScroll: true }); }, 60));
  }
  function toTitle() { if (phase !== 'menu') return; blip(); calm(350); show('title'); }
  // 동그라미 닦기: 고른 자리(x, y)에서 남색 원이 커져 화면을 덮는다 → cb → 화면 가운데(내 캐릭터)로 작아지며 걷힌다
  function wipeIn(x, y, icon, text, cb) {
    const c = wipe.firstChild, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) / 100 + 0.2;   // 원 지름 200px → 배율
    wipe.children[1].textContent = icon || ''; wipe.children[2].textContent = text || '';
    wipe.style.display = 'block'; wipe.className = 'ttl-keep'; c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.setProperty('--s', R);
    void wipe.offsetWidth; wipe.classList.add('in');
    setTimeout(cb, 480);
  }
  function wipeOut() {
    const c = wipe.firstChild; c.style.left = innerWidth / 2 + 'px'; c.style.top = innerHeight / 2 + 'px';
    c.style.setProperty('--s', Math.hypot(innerWidth, innerHeight) / 200 + 0.2);
    void wipe.offsetWidth; wipe.classList.add('out');
    setTimeout(() => { wipe.style.display = 'none'; wipe.className = 'ttl-keep'; }, 620);
  }
  function choose(i) {
    if (phase !== 'menu' || !calmOK()) return; const e = list[i]; if (!e) return;
    cards.forEach((c, k) => c.classList.add(k === i ? 'pick' : 'dim'));
    launch(e, cards[i].getBoundingClientRect());
  }
  function launch(e, r) {   // r = 고른 단추 자리(닦기 원이 여기서 커진다)
    heard = true; if (!PROMO) store.set('last', e.id); whoosh(); phase = 'go';
    setTimeout(() => wipeIn(r.left + r.width / 2, r.top + r.height / 2, e.icon || '🎮', e.title || '', () => {
      root.style.display = 'none'; root.dataset.ph = 'off'; cards.forEach(c => c.classList.remove('pick', 'dim'));
      CTRL.wave = 0; setCam(null);   // 이 프레임은 평소 카메라(목표 자리)가 아니라 멈춘 한 바퀴 자리에서 날아간다 → 아래 startFly 전에 한 프레임 멈춘 자리 기억
      _fp.copy(camera.position); _fq.copy(camera.quaternion);
      const from = { p: _fp.clone(), q: _fq.clone(), fov: camera.fov };
      setCam(() => { camera.position.copy(from.p); camera.quaternion.copy(from.q); });   // 닦기가 덮은 동안 게임이 내 자리를 옮긴다(시작 자리) — 카메라는 그대로
      // 게임 시작(🎮 칩·?game=과 같은 길 game.load) — 게임이 준비될 때까지(start가 끝남 · 내가 시작 자리로 옮겨짐 · 묻는 창이 뜸 · 최대 7초) 덮은 채 기다린다
      const t0 = performance.now(), px = P.x, pz = P.z; let ready = !e.id;
      if (e.id) Promise.resolve(game.load(e.id, {})).then(() => { ready = true; }, () => { ready = true; }); else if (game.current) game.stop('button');
      const go = () => {
        const moved = Math.hypot(P.x - px, P.z - pz) > 1.5, asks = !!document.querySelector('.hudAsk,#story-talk,#tour-talk');   // 게임이 먼저 묻는 창(물총·숨바꼭질·방탈출 메뉴)을 띄웠으면 그걸 보여 준다
        if (!ready && !moved && !asks && performance.now() - t0 < 7000) { setTimeout(go, 80); return; }
        setTimeout(() => {
          camera.position.copy(from.p); camera.quaternion.copy(from.q); camera.fov = from.fov; camera.updateProjectionMatrix();
          // 🏠은 날아오기가 끝나면 바로(게임 start가 묻는 창을 기다리는 동안에도 돌아갈 수 있게 — 시작 도중 멈춘 게임이 await 뒤에 만드는 칩·표식은 mapapi scope가 바로 치운다)
          startFly(1.7, () => { phase = 'off'; CTRL.wave = 1.6; home.style.display = ''; place(); if (!e.id) toast('🏫 자유 탐험 — 학교 어디든 가 보세요!', 2.6); });
          document.body.classList.remove('title-on'); wipeOut();
        }, ready ? 60 : 240);
      };
      go();
    }), 260);
  }
  function backToMenu() {
    if (phase !== 'off') return; heard = true; whoosh();
    const r = home.getBoundingClientRect(); phase = 'back';
    wipeIn(r.left + r.width / 2, r.top + r.height / 2, '🏠', PROMO ? '처음 화면' : '놀이 고르기', () => {
      if (game.current) game.stop('button');
      lockWorld(); home.style.display = 'none'; CTRL.wave = 0; resumeOrbit = true; tf = Math.random() * ORB_T; setCam(camTitle);
      if (PROMO) { CTRL.wave = 1e9; show('title'); root.classList.add('go'); calm(450); wipeOut(); return; }
      show('menu'); root.classList.add('go'); calm(450);
      (filled = fill()).then(() => { if (phase === 'menu' && cards[focusI]) cards[focusI].focus({ preventScroll: true }); });   // 기록·'지난번'을 새로
      wipeOut();
    });
  }
  home.addEventListener('click', e => { e.stopPropagation(); backToMenu(); });
  // 🏠 칩 자리: 🎮 놀이 칩 바로 옆(데스크톱 = 왼쪽 · 터치 = 오른쪽 — 같은 줄). 🎮 칩 글자·크기가 바뀔 때만 다시 잰다(매 프레임 아님)
  const gp = picker && picker.el;
  function place() {
    if (!gp || home.style.display === 'none') return;
    const r = gp.getBoundingClientRect(); if (!r.width) return;
    const T = document.body.classList.contains('touch');
    home.style.top = T ? r.top + 'px' : 'auto'; home.style.bottom = T ? 'auto' : (innerHeight - r.bottom) + 'px';
    if (PROMO) { if (T) { home.style.left = r.left + 'px'; home.style.right = 'auto'; } else { home.style.right = (innerWidth - r.right) + 'px'; home.style.left = 'auto'; } }   // 홍보판: 🎮 칩은 숨김(자리만) — 그 자리에
    else if (T) { home.style.left = (r.right + 6) + 'px'; home.style.right = 'auto'; } else { home.style.right = (innerWidth - r.left + 6) + 'px'; home.style.left = 'auto'; }
    home.style.height = r.height + 'px';
  }
  if (gp && window.ResizeObserver) new ResizeObserver(place).observe(gp);
  addEventListener('resize', place);
  new MutationObserver(place).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  return { bootDone, backToMenu, choose: id => { const i = list.findIndex(e => e.id === (id || '')); if (i >= 0) choose(i); }, toMenu, get phase() { return phase; }, get cards() { return list.map(e => e.id); }, el: root, home };
}
