// 우리 학교 견학(TOUR-1 · 09-27 사용자 "학교홍보로 써도될거같아 메타버스 견학 느낌으로 npc누르면 npc가 우리학교 설명해주고 도장도 찍어주고") — 정본 문서 = docs/map_api.md §11
// 흐름: 스쿨버스 앞 교감선생님 곁에서 시작 → 환영 창(tour_data.js welcome + 조작 안내) → 선생님(guide)·안내판(board)을 찾아가
//   E / ✋ / 클릭(사람·안내판을 직접 눌러도 됨)으로 이야기 듣기(여러 쪽 · [다음]) → 마지막 쪽 [도장 받기] → 도장 카드(🎫 칩 · C키) 칸이 찬다 → 모두 모으면 '견학 완주! 🎉'
// 규칙(_template.js 예외 두 가지 — 사용자 09-27 결정):
//   ① 사람 NPC가 말한다: 견학 안내 선생님만(world.js가 놓은 자리 = map.tour) · **말하는 글은 전부 교사가 쓴 tour_data.js**(여기엔 UI 문구만 — 학교에 대한 사실·자랑을 지어 넣지 않는다)
//   ② 데이터 파일 하나는 동적 import(tour_data.js?t=지금 — 상태 없는 글 묶음이라 두 벌이어도 무해 · 교사가 고친 뒤 버스터 없이 새로고침만)
// 저장: 도장 = localStorage 'sm2.game.tour.stamps'(map.store와 같은 이름 칸 — 읽기는 map.store.get · 쓰기는 도장이 바뀔 때만 곧바로 · try/catch) · 다른 저장 없음
// 성능: 매 프레임 일 없음(길 리본 시간만) · 표식 = 다이아몬드 풀(+2콜) · 길 리본(H) +1 · DOM은 창을 열 때만 · 새 조명 없음
export const meta = { id: 'tour', title: '우리 학교 견학', api: 1 };

const GUIDE_R = 2.3, BOARD_R = 1.8, HIDE_R = 1.9, TRAIL_T = 6, PICK_M = 22;
const CSS = `
#tour-ui{position:fixed;inset:0;pointer-events:none;z-index:40;font-family:inherit}
#tour-ui .tp{pointer-events:auto;position:absolute;background:rgba(255,251,240,.97);color:#3a2e22;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.28);border:3px solid #e8c77a}
#tour-talk{left:50%;bottom:14px;transform:translateX(-50%);width:min(600px,94vw);padding:14px 16px 12px;display:flex;gap:12px;align-items:flex-start}
#tour-talk .av{flex:0 0 58px;height:58px;border-radius:50%;background:#fff;border:3px solid #e8c77a;display:flex;align-items:center;justify-content:center;font-size:30px}
#tour-talk .bd{flex:1;min-width:0}
#tour-talk .nm{font-weight:800;font-size:16px;color:#8a5a1e;margin-bottom:4px}
#tour-talk .tx{font-size:17px;line-height:1.5;white-space:pre-line;min-height:52px;max-height:38vh;overflow:auto}
#tour-talk .rw{display:flex;align-items:center;gap:8px;margin-top:8px}
#tour-talk .pg{font-size:12px;color:#8a7a66;margin-right:auto}
#tour-ui button{pointer-events:auto;min-height:44px;min-width:44px;padding:6px 16px;border:0;border-radius:10px;background:#2f6fd0;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}
#tour-ui button.sub{background:#e9e1cf;color:#5a4632}
#tour-ui button:focus-visible{outline:3px solid #ffb400}
#tour-card{left:50%;top:50%;transform:translate(-50%,-50%);width:min(620px,94vw);max-height:88vh;overflow:auto;padding:14px 16px}
#tour-card .hd{display:flex;align-items:center;gap:8px}
#tour-card h3{margin:0 0 2px;font-size:19px;flex:1}
#tour-ui #tour-card button.x{padding:4px 12px;font-size:18px}
#tour-card .ct{font-size:14px;color:#6a5a46;margin-bottom:10px}
#tour-card .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px 6px}
#tour-card .sl{text-align:center;font-size:12px;line-height:1.25;color:#5a4a36}
#tour-card .ci{width:62px;height:62px;margin:0 auto 4px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px dashed #cdbf9f;background:#fffdf7;filter:grayscale(1);opacity:.45}
#tour-card .on .ci{border:3px solid #d9463a;background:#fff0ec;filter:none;opacity:1;transform:rotate(-12deg);box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 5px #d9463a}
#tour-card .rw{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
.tour-stamp{position:absolute;right:12px;top:-78px;width:86px;height:86px;border-radius:50%;border:4px solid #d9463a;background:#fff0ec;display:flex;align-items:center;justify-content:center;font-size:40px;box-shadow:inset 0 0 0 4px #fff,inset 0 0 0 7px #d9463a;animation:tourStamp .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes tourStamp{0%{transform:scale(2.6) rotate(20deg);opacity:0}100%{transform:scale(1) rotate(-12deg);opacity:1}}
.tour-cf{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;animation:tourFall 3.2s linear forwards}
@keyframes tourFall{to{transform:translateY(110vh) rotate(720deg)}}
body.touch #tour-talk{bottom:8px}
@media (max-height:520px){#tour-card{padding:8px 12px}#tour-card .ct{margin-bottom:6px}#tour-card .gr{grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px 4px}#tour-card .ci{width:44px;height:44px;font-size:21px;margin-bottom:2px}#tour-card .sl{font-size:11px}#tour-card .rw{margin-top:8px}}
`;

export default async function start(map, params = {}) {
  let dead = false;
  map.player.freeze(true);
  map.hud.banner('견학 준비 중…', 30);
  map.sfx('warm');
  // ---------- 글(교사 작성) ----------
  let DATA = {};
  try { DATA = (await import(new URL('./tour_data.js?t=' + Date.now(), import.meta.url))).TOUR || {}; }
  catch (e) { console.error('[견학] tour_data.js를 읽지 못했어요', e); map.hud.toast('견학 글 파일(tour_data.js)을 읽지 못했어요 — 따옴표·쉼표를 확인해 주세요', 6); }
  if (dead || map.gone) return {};
  const nav = await map.nav();
  if (dead || map.gone) return {};
  map.hud.banner('', 0.01);

  // ---------- 견학 지점: world.js 자리(map.tour) × tour_data.js 글 ----------
  const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const SP = DATA.spots || {}, ALL = [];
  for (const a of map.tour) {
    const d = SP[a.key] || {}; if (d.on === false) continue;
    const [fx, fz] = DIR[a.face & 3], fd = a.kind === 'board' ? (a.wall ? 0.9 : 1.0) : 0.9;
    const hx = a.x + fx * fd, hz = a.z + fz * fd;
    const pages = Array.isArray(d.pages) && d.pages.length ? d.pages.map(String) : ['(tour_data.js에 이곳 설명을 써 주세요 — 키: ' + a.key + ')'];
    const mx = a.wall ? a.x + (fz ? 0.95 : 0) + fx * 0.35 : a.x, mz = a.wall ? a.z + (fx ? 0.95 : 0) + fz * 0.35 : a.z;   // 표식 자리(벽 게시판은 제목 팻말 옆·벽 앞 — 판을 가리지 않게)
    ALL.push({ key: a.key, kind: a.kind, x: a.x, y: a.y, z: a.z, top: a.top, hx, hz, mx, mz, my: a.kind === 'board' ? a.y + (a.wall ? 1.2 : 1.45) : a.y + 1.2, label: a.label, face: a.face, name: d.name || a.label, where: d.where || '', stamp: d.stamp || (a.kind === 'board' ? '📋' : '⭐'), pages, node: -1 });
  }
  // 표식 자리(리뷰 09-27): 선생님 위 ◆가 이름 팻말(머리 위 +0.28)을 가렸다 — 천장(실내 ≈3m) 때문에 더 올릴 수 없어 팻말 옆으로 비킨다(벽·가구가 없는 쪽).
  //   안내판은 지붕(+1.9) 위로(◆ 아래 끝 = 가운데 - 0.53 · 흔들림 포함).
  { const g = document.createElement('canvas').getContext('2d'); g.font = '900 84px sans-serif';
    for (const s of ALL) { if (s.kind !== 'guide') continue;
      const [fx, fz] = DIR[s.face & 3], half = 0.22 * (g.measureText(s.label).width + 56) / 128 / 2, a = half + 0.42, Y = s.my + 1.1;
      let best = null, bt = -1;
      for (const sd of [1, -1]) { const px = -fz * sd, pz = fx * sd, t = map.q.ray([s.x, Y, s.z], [s.x + px * (a + 0.35), Y, s.z + pz * (a + 0.35)]);
        const tt = t === null ? 2 : t; if (tt > bt) { bt = tt; best = [px, pz]; } }
      s.mx = s.x + best[0] * a; s.mz = s.z + best[1] * a; } }
  for (const k of Object.keys(SP)) if (!map.tour.some(a => a.key === k)) console.warn('[견학] tour_data.js의 "' + k + '"는 맵에 자리가 없어 빠졌어요(키 이름 확인)');
  const ORD = Array.isArray(DATA.order) ? DATA.order : [];
  ALL.sort((a, b) => { const i = ORD.indexOf(a.key), j = ORD.indexOf(b.key); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j); });
  const N = ALL.length, BY = new Map(ALL.map(s => [s.key, s]));
  for (const s of ALL) {   // 말 거는 자리 = 앞 0.9~1m에서 가장 가까운 걷는 칸(책상·실험대 너머 선생님도 — 지점 가운데가 가구 속이면 그 자리에 설 수 없다) · 길 안내 도착 칸도 같은 칸
    s.node = nav.snap(s.hx, s.y, s.hz, 2.6);
    if (s.node >= 0) { const p = nav.pos(s.node); s.hx = p[0]; s.hz = p[2]; }
  }

  // ---------- 도장(저장) ----------
  const stamps = new Set((map.store.get('stamps', []) || []).filter(k => BY.has(k)));
  // 바뀔 때만 곧바로 쓴다(도장은 이야기 창을 다 넘겨야 하나씩 — 2초에 한 번보다 드묾 · store의 2초 몰아쓰기를 기다리면 도장 직후 창을 닫을 때 잃는다) · 막힌 환경(비공개 창)은 조용히 이번 판만
  const save = () => { try { localStorage.setItem('sm2.game.tour.stamps', JSON.stringify([...stamps])); } catch (e) { /* 저장 막힘 — 무시 */ } };

  // ---------- DOM ----------
  let css = document.getElementById('tour-css'); if (!css) { css = document.createElement('style'); css.id = 'tour-css'; css.textContent = CSS; document.head.appendChild(css); }
  const ui = document.createElement('div'); ui.id = 'tour-ui'; document.body.appendChild(ui);
  const mk = (tag, cls, txt, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (parent || ui).appendChild(e); return e; };
  const btn = (txt, cls, fn, parent) => { const b = mk('button', cls, txt, parent); b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };

  // ---------- 이야기 창 ----------
  let talk = null;   // { el, spot, pages, i, openedAt, onDone }
  function closeTalk() { if (!talk) return; const t = talk; talk = null; t.el.remove(); closedAt = performance.now(); map.player.freeze(false); refresh(); if (t.allDone) celebrate(); }   // 마지막 도장 창을 닫으면(버튼·Esc 어느 쪽이든) 완주 창
  let closedAt = -1e9;
  function openTalk(o) {   // o = { spot?, name, icon, pages, stampable, onDone }
    if (talk) talk.el.remove();
    document.exitPointerLock?.(); map.player.freeze(true);
    const el = mk('div', 'tp'); el.id = 'tour-talk';
    const av = mk('div', 'av', o.icon, el), bd = mk('div', 'bd', null, el);
    mk('div', 'nm', o.name, bd); const tx = mk('div', 'tx', '', bd); const rw = mk('div', 'rw', null, bd); const pg = mk('div', 'pg', '', rw);
    const b2 = btn('닫기', 'sub', () => closeTalk(), rw), b1 = btn('다음 ▶', '', () => next(), rw);
    talk = { el, o, i: 0, openedAt: performance.now(), tx, pg, b1, b2, av, stamped: false };
    show(); map.sfx('pick'); setTimeout(() => { try { b1.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);
  }
  function show() {
    const t = talk, P = t.o.pages, last = t.i >= P.length - 1;
    t.tx.textContent = P[t.i]; t.pg.textContent = P.length > 1 ? (t.i + 1) + ' / ' + P.length : '';
    const s = t.o.spot, can = s && !stamps.has(s.key);
    t.b1.textContent = !last ? '다음 ▶' : can ? '도장 받기 🖍️' : '닫기';
    t.b2.style.display = last && !can ? 'none' : '';
    if (last && s && stamps.has(s.key) && !t.stamped) t.pg.textContent = (t.pg.textContent ? t.pg.textContent + ' · ' : '') + '✔ 도장 받은 곳';
  }
  function next() {
    const t = talk; if (!t) return;
    if (t.i < t.o.pages.length - 1) { t.i++; show(); map.sfx('tick'); return; }
    const s = t.o.spot;
    if (s && !stamps.has(s.key)) {   // 도장!
      stamps.add(s.key); save(); t.stamped = true; map.sfx('ding');
      mk('div', 'tour-stamp', s.stamp, t.el); t.pg.textContent = '도장 받았어요! (' + stamps.size + '/' + N + ')';
      t.b1.textContent = '닫기'; t.b2.style.display = 'none'; refresh();
      if (stamps.size === N) t.allDone = true;
      return;
    }
    closeTalk();
  }
  function talkTo(s) {
    if (card) closeCard();
    openTalk({ spot: s, name: s.name, icon: s.kind === 'board' ? '📋' : '🙋', pages: s.pages });
  }

  // ---------- 도장 카드 ----------
  let card = null, resetArm = 0;
  function openCard() {
    if (talk) return; if (card) { closeCard(); return; }
    document.exitPointerLock?.(); map.player.freeze(true);
    card = mk('div', 'tp'); card.id = 'tour-card'; resetArm = 0; drawCard();
  }
  function drawCard() {
    card.textContent = '';
    const hd = mk('div', 'hd', null, card); mk('h3', '', '🎫 견학 도장 카드', hd); btn('✕', 'sub x', () => closeCard(), hd).setAttribute('aria-label', '닫기');   // 휴대폰 가로(높이 ≈390)에선 아래 [닫기]가 화면 밖 — 위에도 닫기(리뷰 09-27)
    mk('div', 'ct', '도장 ' + stamps.size + ' / ' + N + (stamps.size === N ? ' — 견학 완주! 🎉' : ' · 별(⭐)이 뜬 곳을 찾아가 보세요'), card);
    const gr = mk('div', 'gr', null, card);
    for (const s of ALL) { const sl = mk('div', 'sl' + (stamps.has(s.key) ? ' on' : ''), null, gr); mk('div', 'ci', s.stamp, sl); mk('div', '', s.name, sl); sl.title = s.where; }
    const rw = mk('div', 'rw', null, card);
    btn(resetArm ? '정말 지울까요? 한 번 더 누르세요' : '도장 모두 지우기', 'sub', () => {
      if (!resetArm) { resetArm = 1; drawCard(); return; }
      stamps.clear(); save(); resetArm = 0; map.hud.toast('🧽 도장을 모두 지웠어요 — 처음부터 견학해요'); drawCard(); refresh(); }, rw);
    btn('닫기', '', () => closeCard(), rw);
  }
  function closeCard() { if (!card) return; card.remove(); card = null; map.player.freeze(false); }

  // ---------- 완주 ----------
  function celebrate() {
    map.sfx('done');
    const fin = Array.isArray(DATA.finish) && DATA.finish.length ? DATA.finish.map(String) : [];
    openTalk({ name: '견학 완주! 🎉', icon: '🏆', pages: ['도장 ' + N + '개를 모두 모았어요! 🎉', ...fin] });
    const cols = ['#ff6b6b', '#ffd23c', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d'];
    for (let i = 0; i < 44; i++) { const c = mk('div', 'tour-cf'); c.style.left = (Math.random() * 100) + 'vw'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (Math.random() * 0.9) + 's'; setTimeout(() => c.remove(), 4300); }
  }

  // ---------- 지점(E · ✋ · 힌트 누름) + 가까운 다른 지점 끄기(견학 중에만 — 끝나면 원래대로) ----------
  const hotOf = new Map();
  for (const s of ALL) {
    const r = s.kind === 'board' ? BOARD_R : GUIDE_R, ypt = s.y;
    const h = map.interact.add({ x: s.hx, y: ypt, z: s.hz, r, label: '', use: () => {
      if (talk) { if (performance.now() - talk.openedAt > 250) next(); return; }   // ✋ 버튼이 창을 넘김(E는 아래 keydown이 먼저 받는다)
      if (performance.now() - closedAt < 350) return;
      talkTo(s); } });
    hotOf.set(s.key, h);
  }
  map.interact.enable(h => h.kind !== 'game' && ALL.some(s => (h.x - s.hx) ** 2 + (h.z - s.hz) ** 2 < HIDE_R * HIDE_R && Math.abs(h.y - s.y) < 1.6), false);
  function labelHots() { for (const s of ALL) { const h = hotOf.get(s.key).hot; h.label = (s.kind === 'board' ? '📋 ' + s.name + ' 읽기' : '💬 ' + s.name + '과 이야기하기') + (stamps.has(s.key) ? ' ✔' : ''); } }

  // ---------- 사람·안내판을 직접 누르기(클릭·탭) — 화면에 비친 머리/판 가까이를 누르면(포인터 잠금 중이면 화면 가운데) ----------
  const cam = map.camera, V = new map.three.Vector3();
  let downX = 0, downY = 0, downT = 0, swallow = false;
  function pickAt(px, py) {
    let best = null, bd = 1e9; const W = innerWidth, H = innerHeight, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (const s of ALL) {
      const ty = s.kind === 'board' ? s.top - 0.6 : s.top - 0.3, L = Math.hypot(s.x - cx, ty - cy, s.z - cz); if (L > PICK_M) continue;
      V.set(s.x, ty, s.z).project(cam); if (V.z > 1 || V.z < -1) continue;
      const sx = (V.x + 1) / 2 * W, sy = (1 - V.y) / 2 * H, tol = Math.max(34, Math.min(110, 420 / Math.max(1, L))), d = Math.hypot(sx - px, sy - py);
      if (d > tol || d >= bd) continue;
      const t = map.q.ray([cx, cy, cz], [s.x, ty, s.z]); if (t !== null && t * L < L - 0.9) continue;   // 벽 너머는 안 됨(자기 몸·판 충돌 0.9m 안은 괜찮음)
      best = s; bd = d;
    }
    return best;
  }
  const onDown = e => { swallow = false; if (e.target && e.target.tagName === 'CANVAS') { downX = e.clientX; downY = e.clientY; downT = performance.now(); } else downT = 0; };
  const onUp = e => {
    if (!downT || talk || card || !e.target || e.target.tagName !== 'CANVAS') return;
    if (performance.now() - downT > 450 || Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return;
    const locked = !!document.pointerLockElement, s = locked ? pickAt(innerWidth / 2, innerHeight / 2) : pickAt(e.clientX, e.clientY);
    if (!s) return;
    swallow = !locked && e.pointerType === 'mouse'; talkTo(s);   // 잠기지 않은 마우스 클릭이면 뒤따르는 click(= 포인터 잠금 요청)을 삼킨다(터치는 click이 안 온다 — 삼키면 다음 버튼 탭을 먹었다)
  };
  const onClick = e => { if (swallow || ((talk || card) && e.target && e.target.tagName === 'CANVAS')) { swallow = false; e.stopPropagation(); e.preventDefault(); } };   // 창이 열린 동안 화면 클릭 = 포인터 잠금 안 함(잠기면 창 버튼을 못 누른다)
  // 창이 열린 동안 E·Enter·Space = 다음, Esc = 닫기(창 밖 E가 주변 지점을 또 부르지 않게 여기서 멈춘다) · C = 도장 카드 · H = 길 안내
  const onKey = e => {
    if (talk) {
      if (['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(e.code)) { e.stopPropagation(); e.preventDefault(); if (!e.repeat && performance.now() - talk.openedAt > 200) next(); return; }
      if (e.code === 'Escape') { e.stopPropagation(); closeTalk(); return; }
      return;
    }
    if (card) { if (e.code === 'Escape' || e.code === 'KeyC') { e.stopPropagation(); closeCard(); } return; }
    if (e.repeat) return;
    if (e.code === 'KeyC') openCard(); else if (e.code === 'KeyH') guide();
  };
  addEventListener('pointerdown', onDown, true); addEventListener('pointerup', onUp, true); addEventListener('click', onClick, true); addEventListener('keydown', onKey, true);

  // ---------- 다음 추천 · 표식 · 미니맵 · 길 안내 ----------
  let nextS = null, trail = null, trailT = 0;
  const marks = new Map();   // key → 표식(아직 도장 없는 곳 위 다이아몬드 · 추천 = 주황)
  function pickNext() { for (const s of ALL) if (!stamps.has(s.key)) return s; return null; }
  function refresh() {
    labelHots();
    nextS = pickNext();
    map.hud.chip('tour', '🎫 도장 ' + stamps.size + '/' + N, { onClick: openCard });
    const wh = nextS && nextS.where ? (nextS.where.length > 12 ? nextS.where.slice(0, 11) + '…' : nextS.where) : '';   // 목표 줄은 한 줄(휴대폰에서 미니맵과 안 겹치게 짧게)
    map.hud.goal(nextS ? '다음: ' + nextS.name + (wh ? ' · ' + wh : '') : '🎉 견학 완주! (C: 도장 카드)');
    for (const s of ALL) {
      const want = !stamps.has(s.key), m = marks.get(s.key);
      if (want && !m) marks.set(s.key, map.mk.marker(s.mx, s.my, s.mz, { color: s === nextS ? 0xff8a3c : 0xffd23c, beam: false }));
      else if (!want && m) { m.remove(); marks.delete(s.key); }
      else if (m) m.color(s === nextS ? 0xff8a3c : 0xffd23c);
    }
    map.minimap.setMarks(ALL.map(s => stamps.has(s.key) ? { x: s.x, z: s.z, color: '#3cb46e', shape: 'dot', r: 3.2 } : { x: s.x, z: s.z, color: s === nextS ? '#ff7a2c' : '#f5b400', shape: 'star', blink: s === nextS }));
  }
  function clearTrail() { if (trail) { trail.remove(); trail = null; } trailT = 0; }
  function guide() {
    const s = nextS; if (!s) { map.hud.toast('🎉 모든 곳을 다 가 봤어요!'); return; }
    const me = map.player.get(), r = nav.path([me.x, me.y, me.z], s.node >= 0 ? s.node : [s.hx, s.y, s.hz], { maxExp: 400000 });
    if (!r.ok) { map.hud.toast('여기서는 길을 찾지 못했어요 — 조금 움직여 보세요'); return; }
    clearTrail(); trail = map.mk.trail(r.pts, { color: 0xff9a3c, width: 0.45 }); trailT = TRAIL_T;
    map.hud.toast('🧭 ' + s.name + '까지 ' + Math.round(r.len) + 'm');
  }
  map.hud.chip('tour-h', '💡 길 안내 (H)', { onClick: guide });
  map.minimap.show();

  // ---------- 시작: 스쿨버스 앞 교감선생님 곁(앞 2.6m · 선생님 오른손 쪽 0.8m — 선생님이 내 캐릭터에 가리지 않게 살짝 비껴 본다) ----------
  const va = map.tour.find(a => a.key === 'vice');
  if (va && params.spawn == null) {
    const [fx, fz] = DIR[va.face & 3], e = map.findEntry(va.x + fx * 2.6 + fz * 0.8, va.z + fz * 2.6 - fx * 0.8, va.y, null, 3);
    if (e) { map.player.teleport([e.x, e.y, e.z]); map.player.face((Math.atan2(va.x - e.x, -(va.z - e.z)) * 180 / Math.PI + 12 + 360) % 360); }
  } else if (params.spawn) map.player.teleport('spawn:' + params.spawn);
  refresh();
  map.player.freeze(false);
  if (params.intro !== '0') openTalk({ name: '우리 학교 견학', icon: '🏫', pages: [
    ...(Array.isArray(DATA.welcome) ? DATA.welcome.map(String) : []),
    '선생님(🙋)과 안내판(📋)을 찾아가 이야기를 듣고 도장을 모아요.\n· 가까이 가서 E(터치 ✋) 또는 사람·안내판을 눌러요\n· 떠 있는 ◆ · 미니맵 ⭐ = 아직 못 간 곳(주황 = 다음 추천)\n· H = 다음 곳 길 안내 · C = 도장 카드(' + N + '칸)'] });

  return {
    tick(dt) {
      if (trail && (trailT -= dt) <= 0) clearTrail();   // 매 프레임 할 일은 이것뿐(표식·미니맵·목표 줄은 도장이 바뀔 때만 refresh)
    },
    stop() {
      dead = true;
      removeEventListener('pointerdown', onDown, true); removeEventListener('pointerup', onUp, true); removeEventListener('click', onClick, true); removeEventListener('keydown', onKey, true);
      ui.remove(); if (css.isConnected) css.remove(); talk = null; card = null;   // 지점·표식·리본·칩·목표 줄·미니맵·멈춤은 범위 파사드가 정리
    },
    // 시험·교사용 읽기
    get spots() { return ALL.map(s => ({ key: s.key, kind: s.kind, name: s.name, x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), hot: [+s.hx.toFixed(2), +s.hz.toFixed(2)], node: s.node })); },
    get stamps() { return [...stamps]; }, get total() { return N; }, get open() { return talk ? 'talk' : card ? 'card' : null; }, get talking() { return talk && talk.o.spot ? talk.o.spot.key : null; }, get nextKey() { return nextS && nextS.key; },
    talkTo: key => { const s = BY.get(key); if (s) talkTo(s); }, next, closeTalk, openCard, closeCard, guide, pickAt: (x, y) => { const s = pickAt(x, y); return s && s.key; },
  };
}
