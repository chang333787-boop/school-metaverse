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
  const PROMO = !!window.SM_PROMO, PROMO_GAME = { id: 'tour', title: '우리 학교 견학', icon: '🚌' }, LESSON = window.SM_LESSON || null;
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
        : '<div class="ttl-logo">' + cap(1) + '<span>' + (LESSON ? '우리 반 이야기 만들기' : '우리 학교 메타버스') + '</span></div>')
    +   '<h1 class="ttl-h" aria-label="정림초에 오신 것을 환영합니다!"><span class="ln">' + L1 + '</span><span class="ln">' + L2 + '</span>' + spk + '</h1>'
    +   (PROMO ? '<div class="ttl-sub ttl-addr"><b>🏫 정림초등학교</b><span>경기도 화성시 효행구 정남면 망월길 69</span></div>' : '<div class="ttl-sub">' + (LESSON ? '🏫 정림초등학교 · 4학년 이야기 수업' : '🏫 정림초등학교 · 3D 학교 놀이터') + '</div>')
    +   '<button class="ttl-start" type="button"><b>▶</b> ' + (PROMO ? '학교 둘러보기' : '시작하기') + '</button>'
    +   '<div class="ttl-keys"><span class="kd">클릭 · Enter · Space</span><span class="kt">화면을 톡 눌러요</span></div>'
    +   (/iPhone|iPod/.test(navigator.userAgent || '') && !navigator.standalone ? '<div class="ttl-a2hs">⬆️ 공유 → <b>홈 화면에 추가</b>하면 주소창 없이 꽉 찬 화면으로 볼 수 있어요</div>' : '')   // A2HS: 아이폰 사파리엔 전체 화면이 없다
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
  const GROUPS = { 탐험: { c: '#3aa0e8', e: '🧭' }, 대결: { c: '#f06a4a', e: '⚔️' }, 모험: { c: '#35b36b', e: '🗺️' }, 이야기: { c: '#b36ae0', e: '📖' }, 상상: { c: '#2fb39a', e: '🌱' }, 놀이: { c: '#e8a21a', e: '🎲' } };
  const LCATS = [{ id: '@story', cat: 'story', title: '이야기', icon: '📖', group: '이야기', short: '우리 반이 만든 이야기 속으로' }, { id: '@imagine', cat: 'imagine', title: '상상의 세계', icon: '🌈', group: '상상', short: '상상 속 새로운 세계로 떠나요' }];
  let LCAT = null, REG = null;   // 수업판(v3): 갈래(이야기·상상의 세계) → 그 안의 카드
  let FOLD = null, REGF = null;  // FOLDER-1(10-04 교사 '폴더형식으로'): v2 = 폴더(registry FOLDERS) → 그 안의 카드 · ◀/Esc = 폴더로
  const GORDER = Object.keys(GROUPS);
  const FREE = { id: '', folder: 'look', title: '자유 탐험', icon: '🏫', group: '탐험', short: '학교 어디든 걸어 다녀요 · 방에 들어가면 친구들도 보여요' };
  const mmss = s => { s = Math.max(0, Math.round(+s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function best(id, e) {   // 게임이 map.store로 남긴 기록(sm2.game.<id>.<키>) — registry best: {k, u:'s'(초)|'n'(개수)|단위, lbl}
    for (const b of [].concat(e.best || [])) { let v = null; try { v = JSON.parse(localStorage.getItem('sm2.game.' + id + '.' + b.k)); } catch (x) { v = null; }
      if (v == null || (Array.isArray(v) && !v.length)) continue;
      const pre = b.lbl ? b.lbl + ' ' : '';
      return b.u === 's' ? '🏆 ' + pre + mmss(v) : b.u === 'n' ? '🎫 ' + pre + (Array.isArray(v) ? v.length : v) + '개' : '🏆 ' + pre + v + (b.u || ''); }
    return null;
  }
  let cards = [], list = [], focusI = 0, filled = Promise.resolve();
  let mpSeen = false;   // 카드를 지을 때 함께하기(window.SM_MP — main.js가 lobby.js를 읽은 뒤)가 있었는지
  async function fill(reuse) {
    mpSeen = !!window.SM_MP;
    let G = reuse && REG ? REG : {};
    if (!(reuse && REG)) try { const M = await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url)); G = M.GAMES || {}; REGF = M.FOLDERS || null; } catch (e) { console.error('[오프닝] 놀이 목록을 못 불러옴', e); }
    REG = G;
    const ids = Object.keys(G).filter(id => !G[id].dev && !G[id].room && !(G[id].promo && !PROMO) && (LESSON ? G[id].lesson === LESSON : !G[id].lesson));   // ROOM-1: 방 놀이(room) = 메뉴엔 없음 — 👥 방 창에서 선생님이 고름   // 10-03 교사: v2(우리 학교용)엔 홍보 놀이(견학)를 보이지 않는다 — 주소 ?tour=1로는 그대로 열림
    list = LESSON ? (LCAT ? ids.filter(id => (G[id].cat || 'story') === LCAT).map(id => ({ id, ...G[id] })) : LCATS.slice()) : [FREE, ...ids.map(id => ({ id, ...G[id] }))];
    if (!LESSON && !PROMO && REGF && REGF.length) {   // FOLDER-1: 폴더 카드(그 안 놀이 수) → 고르면 그 폴더의 카드
      const all = list, fk = e => e.folder || 'look';
      list = FOLD ? all.filter(e => fk(e) === FOLD) : REGF.map(f => ({ id: '@' + f.k, fold: f.k, title: f.title, icon: f.icon, group: f.group, short: f.short, items: all.filter(e => fk(e) === f.k) })).filter(f => f.items.length);
      if (FOLD && !list.length) { FOLD = null; return fill(true); } }
    const hd = root.querySelector('.ttl-menu h2'); if (hd && LESSON) hd.textContent = LCAT ? (LCATS.find(c => c.cat === LCAT) || {}).title + ' — 무엇을 할까요?' : '어디로 가 볼까요?';
    else if (hd && REGF && !PROMO) hd.textContent = FOLD ? ((REGF.find(f => f.k === FOLD) || {}).icon || '') + ' ' + ((REGF.find(f => f.k === FOLD) || {}).title || '') + ' — 무엇을 할까요?' : '어떤 놀이를 할까요?';
    const gi = e => { const k = GORDER.indexOf(e.group); return k < 0 ? GORDER.length : k; };
    if (!list.some(e => e.fold)) list = list.map((e, i) => ({ e, i })).sort((a, b) => gi(a.e) - gi(b.e) || a.i - b.i).map(o => o.e);   // 폴더 카드는 FOLDERS 순서 그대로   // 무리(탐험·대결·모험·이야기·놀이)끼리 — 무리 안은 registry 순서
    const TOG = list.filter(e => e.mp === 'together'), split = !FOLD && TOG.length > 0 && TOG.length < list.length;   // MP-MENU(10-03 교사 '싱글·멀티가 구분돼 있어?'): 🧍 혼자 하기 / 👥 친구와 함께 두 칸 · 폴더 안은 나누지 않고 카드의 '👥 함께' 표 + 위 한 줄(방 들어가기)
    if (split) list = list.filter(e => e.mp !== 'together').concat(TOG);
    const last = store.get('last', null);
    grid.textContent = '';
    const head = (html, cls) => { const d = el('div', 'ttl-sec' + (cls ? ' ' + cls : ''), html); grid.appendChild(d); return d; };
    if (split) head('<b>🧍 혼자 하기</b><span>나 혼자 학교를 탐험하고 놀아요</span>');
    const RM = FOLD && !LESSON ? Object.keys(G).filter(id => G[id].room && (G[id].folder || 'look') === FOLD) : [];   // ROOM-1: 이 폴더의 방 놀이(숨김) → 방 줄에 이름만
    const togRow = FOLD && (TOG.length > 0 || RM.length > 0);   // 폴더 안에 함께 놀이가 있으면 카드 위에 방 줄 하나
    cards = list.map((e, i) => {
      if ((split && e === TOG[0]) || (togRow && i === 0)) { const R = window.SM_MP && window.SM_MP.info && window.SM_MP.info(), N = window.SM_MP && window.SM_MP.net && window.SM_MP.net();
        const LD = !!(window.SM_MP && window.SM_MP.lead && window.SM_MP.lead()), rmN = RM.map(id => (G[id].icon || '') + ' ' + String(G[id].title || id).replace(/\(친구와\)/, '').trim()).join(' · ');
        const h = RM.length ? head('<b>👥 친구와 대결</b><span>' + (R ? '「' + R.n.replace(/[<>&]/g, '') + '」 방 · ' + (N ? N.count : 1) + '명 — ' + (LD ? '👥 창에서 다 같이 할 놀이를 골라요' : '선생님이 놀이를 고르면 다 같이 들어가요') : window.SM_MP ? '함께하기 방에 들어가면 선생님이 고른 놀이(' + rmN + ')로 다 같이 들어가요' : '이 화면에서는 함께하기가 꺼져 있어요') + '</span>' + (window.SM_MP ? '<button type="button" class="ttl-room">' + (R ? (LD ? '🎮 놀이 고르기' : '👥 방 보기') : '👥 방 들어가기') + '</button>' : ''), 'tog')
          : head('<b>👥 친구와 함께</b><span>' + (R ? '지금 「' + R.n.replace(/[<>&]/g, '') + '」 방 · ' + (N ? N.count : 1) + '명' : window.SM_MP ? '선생님이 연 방에 들어가면 친구들과 같이 해요' : '이 화면에서는 함께하기가 꺼져 있어요') + '</span>' + (window.SM_MP ? '<button type="button" class="ttl-room">' + (R ? '방 바꾸기' : '👥 방 들어가기') + '</button>' : ''), 'tog');
        const rb = h.querySelector('.ttl-room'); if (rb) rb.addEventListener('click', ev => { ev.stopPropagation(); blip(); window.SM_MP.open(); }); }
      const g = GROUPS[e.group] || GROUPS.놀이, b = e.id ? best(e.id, e) : null;
      const c = el('button', 'card', '<span class="cin">' + (e.items ? '' : '<span class="gt"><i>' + g.e + '</i><span> ' + (GROUPS[e.group] ? e.group : '놀이') + '</span></span>')
        + '<span class="ic">' + (e.icon || '🎮') + '</span><b></b><span class="ds"></span>' + (b ? '<span class="bs"></span>' : '') + (last === e.id || (e.items && e.items.some(x => x.id === last)) ? '<span class="lt">지난번</span>' : '') + (e.mp === 'together' ? '<span class="mpb">👥 함께</span>' : '') + (e.items ? '<span class="mpb fn">📁 ' + e.items.length + '개</span>' : '') + '</span>');
      c.type = 'button'; c.setAttribute('role', 'listitem'); c.style.setProperty('--i', i); c.style.setProperty('--gc', g.c); c.dataset.game = e.id;
      c.querySelector('b').textContent = e.title || e.id; c.querySelector('.ds').textContent = e.short || e.desc || '';
      if (b) c.querySelector('.bs').textContent = b;
      c.addEventListener('click', ev => { ev.stopPropagation(); choose(i); });
      c.addEventListener('pointerenter', () => { if (phase === 'menu') { focusI = i; c.focus({ preventScroll: true }); blip(); } });
      c.addEventListener('focus', () => { focusI = i; });
      grid.appendChild(c); return c;
    });
    focusI = Math.max(0, list.findIndex(e => e.id === last || (e.items && e.items.some(x => x.id === last))));
  }

  // ---------- 단계: title → menu → go → off(🏠) → back → menu ----------
  let phase = 'boot', calmT = 0;   // calmT: 이 시각 전엔 시작·고르기 입력을 받지 않는다(로딩 중 눌러 둔 Enter·꾹 누른 키·두 번 탭이 제목→메뉴→게임으로 줄줄이 넘어가지 않게)
  const calm = ms => { calmT = performance.now() + ms; }, calmOK = () => performance.now() >= calmT;
  const onKey = e => {
    if (phase === 'off') return;
    if (e.target && e.target.closest && e.target.closest('.ttl-keep input, .ttl-keep textarea')) return;   // 오프닝 위에 뜬 창(함께하기 번호·이름 · 🔒 비밀번호)의 입력칸 — 글자·Enter·Esc는 그 창 몫(창이 월드로는 막는다)
    if (phase === 'film') { e.stopImmediatePropagation(); if (e.type === 'keydown' && e.code === 'Escape') { e.preventDefault(); h.film.stop('skip'); } return; }   // FILM-1: 오프닝 영상 동안 Esc = 건너뛰기(나머지 키는 막음)
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
    else if (e.code === 'Escape') { if (LESSON && LCAT) { LCAT = null; refill(); } else if (FOLD) { FOLD = null; refill(); } else toTitle(); return; }
    else return;
    e.preventDefault(); k = Math.max(0, Math.min(n - 1, k)); if (k !== focusI) { focusI = k; cards[k].focus(); blip(); }
  };
  let pendRoom = null;   // 방이 있어야 하는 카드를 눌렀다가 방 창이 떴으면 — 들어가자마자 그 놀이로
  addEventListener('sm-room', (ev) => { if (phase !== 'menu') return; const id = pendRoom; pendRoom = null; filled = fill(true); filled.then(() => { if (id && ev.detail && phase === 'menu') { const i = list.findIndex(e => e.id === id); if (i >= 0) { calmT = 0; choose(i); } } else if (cards[focusI]) cards[focusI].focus({ preventScroll: true }); }); });
  addEventListener('keydown', onKey, true); addEventListener('keyup', e => { if (phase !== 'off' && phase !== 'go') e.stopImmediatePropagation(); }, true);
  function lockWorld() { keys.clear(); try { touch.reset(); } catch (e) { /* */ } document.exitPointerLock?.(); picker && picker.close && picker.close(); document.body.classList.add('title-on'); }
  root.addEventListener('pointerdown', () => { heard = true; });
  root.addEventListener('click', e => { if (phase === 'title' && !muteB.contains(e.target)) toMenu(); });
  muteB.addEventListener('click', e => { e.stopPropagation(); heard = true; muted = !muted; store.set('mute', muted); paintMute(); if (!muted) blip(); });
  $('.ttl-back').addEventListener('click', e => { e.stopPropagation(); if (LESSON && LCAT) { LCAT = null; refill(); } else if (FOLD) { FOLD = null; refill(); } else toTitle(); });
  function refill() { blip(); filled = fill(true); filled.then(() => setTimeout(() => { if (phase === 'menu' && cards[focusI]) cards[focusI].focus({ preventScroll: true }); }, 60)); }

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
    if (PROMO) { const r = $('.ttl-start').getBoundingClientRect(); if (h.film && !opSeen()) { opening(r); return; } launch(PROMO_GAME, r); return; }   // 홍보판: 카드 없이 바로 견학(처음 한 번은 🎬 오프닝 영상부터 — FILM-1)
    if (!mpSeen && window.SM_MP) filled = fill(true);   // 오프닝을 지을 때 아직 함께하기를 못 읽었으면(느린 기기) '👥 방 들어가기' 칸이 '꺼져 있어요'로 남지 않게 다시
    show('menu'); filled.then(() => setTimeout(() => { if (phase === 'menu' && cards[focusI]) cards[focusI].focus({ preventScroll: true }); }, 60));
  }
  // 🎬 FILM-1(10-04 교사 '교회 오프닝 영상처럼'): 홍보판 ▶ → 오프닝 영상(약 1분 · ⏭ 건너뛰기) → 그 마지막 자리(스쿨버스 앞)에서 닦기 → 견학. 이 탭에서 한 번만(견학 메뉴 '🎬 오프닝 영상 보기'로 다시)
  const opSeen = () => { try { return sessionStorage.getItem('sm.film.op') === '1'; } catch (e) { return false; } };
  async function opening(r) {
    phase = 'film'; try { sessionStorage.setItem('sm.film.op', '1'); } catch (e) { /* */ }
    let shots = null;
    try { const [M, T] = await Promise.all([import('../games/tour_film.js?v=4'), import('../games/tour_data.js?t=' + Date.now())]); shots = M.buildOpening(T.TOUR || {}, { spots: (h.world && h.world.tour) || [] }); }
    catch (e) { console.warn('[오프닝] 영상 대본을 못 읽었어요', e); }
    if (shots && shots.length) { await h.film.play(shots, { brand: '정림초등학교 · Phone Off, RAS On' }); muted = !!store.get('mute', false); paintMute(); }
    const fp = camera.position.clone(), fq = camera.quaternion.clone(); setCam(() => { camera.position.copy(fp); camera.quaternion.copy(fq); });   // 영상 마지막 자리 그대로 → 닦기 → 날아오기
    launch(PROMO_GAME, r);
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
    if (LESSON && !LCAT && e.cat) { LCAT = e.cat; refill(); return; }   // 갈래 → 그 안의 카드
    if (!LESSON && !FOLD && e.fold) { FOLD = e.fold; refill(); return; }   // FOLDER-1: 폴더 → 그 안의 카드
    if (e.link) { blip(); location.href = new URL(e.link, location.href).href; return; }   // 다른 페이지(상상의 세계 — v2 엔진 밖)
    if (e.needRoom && window.SM_MP && !window.SM_MP.room()) { blip(); pendRoom = e.id; window.SM_MP.open(); const t = grid.querySelector('.ttl-sec.tog span'); if (t) { t.textContent = '먼저 방에 들어가요 — 선생님 화면의 방 번호 4자리'; t.classList.add('warn'); } return; }   // 친구 대결은 방이 있어야
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

  return { bootDone, backToMenu, choose: async id => { id = id || ''; let i = list.findIndex(e => e.id === id);   // 폴더 밖이면 그 폴더를 열고 고른다
      if (i < 0 && !LESSON && REGF) { const g = id ? REG && REG[id] : FREE; if (g) { FOLD = g.folder || 'look'; await (filled = fill(true)); i = list.findIndex(e => e.id === id); } }
      if (i >= 0) choose(i); },
    go: async id => {   // ROOM-1: 방 놀이 — 메뉴에 없는 카드도 제목·메뉴 화면에서 바로 닦기 + 날아오기로 시작(선생님이 고르면 아이 화면이 여기로)
      if (phase !== 'title' && phase !== 'menu') return false; if (!REG) await (filled = fill()); const g = REG && REG[id]; if (!g || (phase !== 'title' && phase !== 'menu')) return false;
      launch({ id, ...g }, { left: innerWidth / 2 - 1, top: innerHeight / 2 - 1, width: 2, height: 2 }); return true; },
    toMenu, get phase() { return phase; }, get cards() { return list.map(e => e.id); }, el: root, home };
}
