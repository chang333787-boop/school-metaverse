// 이야기 RPG '무지개 편지'(G3-STORY · 09-27 사용자 "이야기 RPG — 4학년 주인공 · 다른 학년과 이어지는 학교 생활") — 정본 docs/map_api.md §17 · 글 = story_data.js
// 흐름(≈10분): 처음(4학년 교실 · 아침 · 역할 고르기) → 1장 1학년 교실(그림을 잃은 1학년 동생 · 크레파스 3개 줍기 · 현관 신발장 쪽지) →
//   2장 도서실(사서선생님 · 6학년 선배의 편지) → 2층 6학년 교실(칠판 수수께끼 · 돌려주는 방법 고르기 · 그림 들기) → 3장 1학년 교실(그림 돌려주기) →
//   4장 체육관(깜깜 → 🔘 불 켜기 · 상자 3개 옮기기 · 역할에 따라 풍선·현수막 / 바닥 화살표·깃발 · 그림 걸 곳 고르기) → 마지막 장(노을 · 모두 모임 · 작은 반전: 편지는 이어진다) → 끝 화면
// 규칙: import 금지(글 파일만 동적 import — tour.js와 같은 방식) · 새 조명 없음 · 이름 있는 실제 학생에게 대사 없음 —
//   이야기 속 학생 역할(반 친구·1학년 동생·6학년 선배)은 그 반 아이 몸을 대역으로 옮기고 **이름표를 가린다**(map.npc.move(…, { sign: false })) · 선생님은 직함 이름표 그대로.
//   대역은 한 번에 6명(반 친구·동생·선배 + 마지막 장 4학년·1학년 선생님·체육선생님) · 사람은 늘리지 않는다.
// 성능: 매 프레임 = 경과 시간·길 리본 시간만(새 객체 없음) · 표식 풀 +2 · 리본 +1 · 소품(상자·쪽지) +2 · 칠판 그림(방마다 1) · 풍선·현수막·깃발 각 +1 · 대역 +6(이름표 1)
// 휴대폰: 이야기 창(#story-talk)·끝 화면(#story-end) 모양은 v2/phone.css(MOBUI-1 안전 구역) — 여기엔 데스크톱 모양만.
export const meta = { id: 'story', title: '이야기: 무지개 편지', api: 1 };

const DATA_V = 1, TRAIL_T = 6;
const CSS = `
#story-ui{position:fixed;inset:0;pointer-events:none;z-index:40;font-family:inherit}
#story-ui .sp{pointer-events:auto;position:absolute;background:rgba(255,251,240,.97);color:#3a2e22;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.28);border:3px solid #9ec5f0}
#story-talk{left:50%;bottom:14px;transform:translateX(-50%);width:min(620px,94vw);padding:14px 16px 12px;display:flex;gap:12px;align-items:flex-start;box-sizing:border-box}
#story-talk .av{flex:0 0 56px;height:56px;border-radius:50%;background:#fff;border:3px solid #9ec5f0;display:flex;align-items:center;justify-content:center;font-size:30px}
#story-talk .bd{flex:1;min-width:0}
#story-talk .nm{font-weight:800;font-size:16px;color:#2d5f9a;margin-bottom:4px}
#story-talk .tx{font-size:17px;line-height:1.5;white-space:pre-line;min-height:48px;max-height:40vh;overflow:auto}
#story-talk .rw{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:flex-end}
#story-talk .ch{display:flex;flex-direction:column;gap:6px;margin-top:8px}
#story-ui button{pointer-events:auto;min-height:44px;min-width:44px;padding:6px 16px;border:0;border-radius:10px;background:#2f6fd0;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;text-align:left}
#story-ui .ch button{background:#fff;color:#2d4a6e;border:2px solid #9ec5f0}
#story-ui .ch button:hover,#story-ui .ch button:focus-visible{background:#eaf3ff}
#story-ui button:focus-visible{outline:3px solid #ffb400}
#story-end{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:90vh;overflow:auto;padding:18px 20px;box-sizing:border-box;text-align:center;border-color:#f0b35a!important;background:linear-gradient(#fff7e8,#ffe9d2)!important}
#story-end h2{margin:0 0 8px;font-size:24px}
#story-end .b{white-space:pre-line;line-height:1.55;font-size:16px;margin-bottom:10px}
#story-end ul{list-style:none;padding:0;margin:0 0 12px;font-size:15px;line-height:1.7}
#story-end .rw{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
#story-end .rw button{text-align:center}
#story-end .rw button.sub{background:#e9e1cf;color:#5a4632}
.story-rb{height:10px;border-radius:5px;margin:0 auto 12px;width:70%;background:linear-gradient(90deg,#e74c3c,#f39c12,#f1c40f,#2ecc71,#3498db,#3f51b5,#9b59b6)}
`;
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

// 1학년 동생의 무지개 그림(모두 손잡은 여섯 학년) — 캔버스에 그린다
function drawRainbow(ctx, W, H) {
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#e8c77a'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, H - 10);
  const C = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#3f51b5', '#9b59b6'], cx = W / 2, cy = H * 0.78;
  ctx.lineWidth = H * 0.045; for (let i = 0; i < 7; i++) { ctx.strokeStyle = C[i]; ctx.beginPath(); ctx.arc(cx, cy, W * 0.42 - i * H * 0.045, Math.PI, 0); ctx.stroke(); }
  ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(W * 0.86, H * 0.2, H * 0.08, 0, Math.PI * 2); ctx.fill();
  const n = 6, y0 = H * 0.9; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = W * (0.2 + i * 0.12), s = 0.75 + i * 0.06, hy = y0 - H * 0.3 * s, col = C[i];
    ctx.strokeStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(x, hy + H * 0.06); ctx.lineTo(x, y0 - H * 0.08); ctx.lineTo(x - 12, y0); ctx.moveTo(x, y0 - H * 0.08); ctx.lineTo(x + 12, y0); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x - W * 0.06, hy + H * 0.12); ctx.lineTo(x + W * 0.06, hy + H * 0.12); ctx.stroke();   // 손잡은 팔
    ctx.fillStyle = '#ffd9b8'; ctx.beginPath(); ctx.arc(x, hy, H * 0.05, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(x - 9, hy + H * 0.06, 18, H * 0.1); }
  ctx.fillStyle = '#2d4a6e'; ctx.font = '900 ' + Math.round(H * 0.09) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('함께 놀이 날', W / 2, H * 0.14);
}
function drawArrow(ctx, W, H) {   // 바닥 화살표(캔버스 위쪽 = 가는 쪽)
  ctx.fillStyle = 'rgba(255,196,40,.92)'; ctx.beginPath(); ctx.moveTo(W / 2, H * 0.06); ctx.lineTo(W * 0.92, H * 0.5); ctx.lineTo(W * 0.64, H * 0.5); ctx.lineTo(W * 0.64, H * 0.94);
  ctx.lineTo(W * 0.36, H * 0.94); ctx.lineTo(W * 0.36, H * 0.5); ctx.lineTo(W * 0.08, H * 0.5); ctx.closePath(); ctx.fill();
}

export default async function start(map, params = {}) {
  let dead = false;
  const gone = () => dead || map.gone;
  map.player.freeze(true);
  map.hud.banner('이야기 준비 중…', 30);
  map.sfx('warm');
  // EP-1(10-03 교사 '지금 것은 연습 게임 — 앞으로 새로 만들 것을 추가할 수 있게'): 에피소드 목록 story_episodes.js → params.ep · 둘 이상이면 시작 때 고르기
  let EPS = [];
  try { EPS = (await import(new URL('./story_episodes.js?t=' + Date.now(), import.meta.url))).EPISODES || []; } catch (e) { console.error('[이야기] story_episodes.js를 읽지 못했어요', e); }
  if (gone()) return {};
  EPS = EPS.filter(e => e && /^[a-z0-9_]+$/.test(e.id || '') && /^[a-z0-9_]+\.js$/.test(e.file || ''));
  if (!EPS.length) EPS = [{ id: 'rainbow', title: '무지개 편지', icon: '🌈', practice: true, file: 'story_data.js', legacy: 'rainbow' }];
  const VIS = params.set ? EPS.filter(e => e.set === params.set) : EPS.filter(e => !e.hidden);   // set = 수업 카드 하나의 판들(AI가 채운 판 · 우리 반 판) · hidden = 목록엔 안 보임(주소 ?ep=로만)
  let EP = EPS.find(e => e.id === params.ep);
  if (!EP && VIS.length > 1) { map.hud.banner(' ', 0.02);
    const k = await map.hud.ask(params.set ? '📖 어떤 이야기로 할까요?' : '📖 어떤 이야기를 할까요?', VIS.map(e => (e.icon || '📖') + ' ' + (e.practice ? '[연습] ' : '') + (e.pick || e.title))); if (gone()) return {}; EP = VIS[k]; }
  EP = EP || VIS[0] || EPS[0];
  let D = null, WHO = {};
  try { const m = await import(new URL('./' + EP.file + (EP.legacy ? '?v=' + DATA_V : '?t=' + Date.now()), import.meta.url)); D = m.STORY; WHO = m.WHO || {}; }
  catch (e) { console.error('[이야기] ' + EP.file + '를 읽지 못했어요', e); }
  if (gone()) return {};
  if (!D) { map.hud.banner('', 0.01); map.hud.toast('이야기 글 파일(' + EP.file + ')을 읽지 못했어요', 6); map.player.freeze(false); return {}; }
  const LEG = EP.legacy === 'rainbow' || !Array.isArray(D.steps);   // 무지개 편지 = 예전 코드 그대로 · 새 이야기 = steps(아래 runSteps)
  if (EP.practice && D.title && !/연습/.test(D.title)) D.title = '[연습] ' + D.title;
  const nav = await map.nav();
  if (gone()) return {};
  map.time('day');

  // ---------- 자리 ----------
  const zr = id => { const z = map.zone(id); return z ? [z.x0, z.z0, z.x1, z.z1] : null; };
  const spot = (x, z, y = 0, zone) => map.findEntry(x, z, y, zone ? zr(zone) : null, 5) || { x, y, z };
  const npcAt = n => { const p = map.npc.get(n); return p ? { x: p.x, y: p.y, z: p.z } : null; };
  const S = {};   // 이야기 상태(끝 화면·시험용)
  S.role = -1; S.gift = -1; S.place = -1; S.crayons = 0; S.quizTries = 0; S.ch = 0; S.done = false;
  // 역할 배우(대역 · 이름표 가림): 반 친구 = 4학년 한 자리 · 1학년 동생 = 1학년 한 자리 · 6학년 선배 = 6학년 한 자리
  const A = { friend: '인우', kid: '빈', senior: '다솜' };
  const P4 = spot(25.0, -42.7, 0, 'grade4'), Pme = spot(27.6, -42.6, 0, 'grade4');
  const P1 = spot(37.4, -30.3, 0, 'grade1'), P6 = spot(-37.0, -37.9, 3.7, 'grade6');
  if (LEG) {
    map.npc.move(A.friend, { x: P4.x, y: P4.y, z: P4.z }, { pose: 'stand', face: 90, sign: false });
    map.npc.move(A.kid, { x: P1.x, y: P1.y, z: P1.z }, { pose: 'stand', face: 180, sign: false });
    map.npc.move(A.senior, { x: P6.x, y: P6.y, z: P6.z }, { pose: 'stand', face: 180, sign: false }); }
  const board4 = LEG ? map.world.paint('board:grade4', { text: D.board4, color: '#1c4096' }) : null;
  const T4 = npcAt('4학년 선생님'), T1 = npcAt('1학년 선생님'), TL = npcAt('사서선생님'), TG = npcAt('체육선생님');

  // ---------- 이야기 창 ----------
  let css = document.getElementById('story-css'); if (!css) { css = document.createElement('style'); css.id = 'story-css'; css.textContent = CSS; document.head.appendChild(css); }
  const ui = document.createElement('div'); ui.id = 'story-ui'; document.body.appendChild(ui);
  const mk = (tag, cls, txt, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (parent || ui).appendChild(e); return e; };
  const VARS = {};
  let ME = null, PARTY = [], partyHold = false, partyT = 0, partyK = 0;   // 새 이야기(steps)의 선택 기억 — 글 안의 {이름}은 고른 보기 글로 바뀐다
  const fill = t => LEG ? String(t).replace('{role}', D.roleName[S.role] || '').replace('{place}', D.placeName[S.place] || '').replace('{gift}', D.giftName[S.gift] || '')
    : String(t).replace(/\{([a-z0-9_]+)\}/g, (m0, k) => (VARS[k] && VARS[k].label != null ? VARS[k].label : m0));
  let talk = null;   // { el, next(i), openedAt, n }
  function panel(who, text, choices) {   // → Promise<보기 번호 | 0(다음)>
    return new Promise(res => {
      if (talk) talk.el.remove();
      document.exitPointerLock?.(); map.player.freeze(true);
      const el = mk('div', 'sp'); el.id = 'story-talk';
      if (!LEG) who = fill(String(who));   // WORLD-FX: '{mate}' = 같이 온 친구
      mk('div', 'av', WHO[who] || '💬', el); const bd = mk('div', 'bd', null, el);
      mk('div', 'nm', who === ME ? '나 (' + who + ')' : who, bd); mk('div', 'tx', fill(text), bd);
      const t = { el, openedAt: performance.now(), n: choices ? choices.length : 0 };
      t.next = i => { if (talk !== t) return; talk = null; el.remove(); map.player.freeze(false); map.sfx('tick'); res(i); };
      let first;
      if (choices) { const ch = mk('div', 'ch', null, bd); choices.forEach((c, i) => { const b = mk('button', '', (i + 1) + '. ' + c, ch); b.addEventListener('click', e => { e.stopPropagation(); t.next(i); }); if (!i) first = b; }); }
      else { const rw = mk('div', 'rw', null, bd); first = mk('button', '', '다음 ▶', rw); first.addEventListener('click', e => { e.stopPropagation(); t.next(0); }); }
      talk = t; setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);
    });
  }
  async function say(lines) { for (const [who, text] of lines) { await panel(who, text); if (gone()) return false; } return true; }
  const choose = (line, opts) => panel(line[0], line[1], opts);
  // 창이 열린 동안: E·Enter·Space = 다음(보기 창이면 1~3) · 화면 클릭 = 포인터 잠금 안 함 · PERF-WIN(09-28): 숫자는 e.code로(한글 입력기면 e.key = 'Process')
  const onKey = e => {
    if (talk) {
      const k = e.code;
      if (!talk.n && ['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(k)) { e.stopPropagation(); e.preventDefault(); if (!e.repeat && performance.now() - talk.openedAt > 200) talk.next(0); return; }
      if (talk.n) { const m9 = /^(?:Digit|Numpad)([1-9])$/.exec(k || ''), n = m9 ? +m9[1] : 0; if (n >= 1 && n <= talk.n) { e.stopPropagation(); talk.next(n - 1); return; } if (k === 'KeyE' || k === 'Space') { e.stopPropagation(); e.preventDefault(); } }
      return;
    }
    if (e.code === 'KeyH' && !e.repeat) guide();
  };
  const onClick = e => { if ((talk || endEl) && e.target && e.target.tagName === 'CANVAS') { e.stopPropagation(); e.preventDefault(); } };
  addEventListener('keydown', onKey, true); addEventListener('click', onClick, true);

  // ---------- 목표 · 지도 표시 · 길 안내 ----------
  let cur = null, beam = null, trail = null, trailT = 0, extra = [];
  function marks() {
    const m = []; if (cur) m.push({ x: cur.x, z: cur.z, color: '#ff7a2c', label: cur.label, blink: true, floor: cur.y > 2 ? 2 : 1 });
    for (const e of extra) m.push(e); map.minimap.setMarks(m);
  }
  function objective(text, t, label) {
    map.hud.goal(text); if (beam) { beam.remove(); beam = null; } clearTrail();
    cur = t ? { x: t.x, y: t.y ?? 0, z: t.z, label: label || '' } : null;
    if (cur) beam = map.mk.marker(cur.x, cur.y + 2.1, cur.z, { color: 0xff9a3c, beam: true });
    marks();
  }
  function clearTrail() { if (trail) { trail.remove(); trail = null; } trailT = 0; }
  function guide() {
    if (!cur || talk || endEl) return;
    const me = map.player.get(), r = nav.path([me.x, me.y, me.z], [cur.x, cur.y, cur.z], { maxExp: 400000 });
    if (!r.ok) { map.hud.toast('여기서는 길을 찾지 못했어요 — 조금 움직여 보세요'); return; }
    clearTrail(); trail = map.mk.trail(r.pts, { color: 0x3cc8ff, width: 0.45 }); trailT = TRAIL_T;
  }
  const chapter = n => { S.ch = n; const C = D.chapters || []; map.hud.chip('st', '📖 ' + (C[n] || D.title)); if (n && C[n]) map.hud.banner(C[n], 2.4); map.sfx('go'); };
  map.hud.chip('st-h', '💡 길 안내 (H)', { onClick: guide });
  // 말 걸기 자리 → Promise(눌렀을 때)
  //   그동안 가까운 원래 지점(칠판 낙서·신발장·앉기…)은 끈다 — 선생님이 칠판 앞에 서 있어 '칠판에 낙서하기'가 먼저 잡히던 것
  const waitUse = (p, label, r = 2.3) => new Promise(res => { const y = p.y ?? 0;
    const off = map.interact.enable(q => q.kind !== 'game' && Math.hypot(q.x - p.x, q.z - p.z) < r + 1.2 && Math.abs((q.y || 0) - y) < 2, false);
    const h = map.interact.add({ x: p.x, y, z: p.z, r, label, use: () => { if (talk) return; h.remove(); off.remove(); res(); } }); });
  const talkTo = (p, name, text) => { objective(text, p, name); return waitUse(p, '💬 ' + name + '에게 말 걸기'); };

  // ---------- 무대 생물·소품(STORY-FX · 10-06 교사 '아이들 이야기 판으로 — 새 인물은 센스 있게 모델링 · 새 기능은 반짝이 말고 실제로 눈에 보이게') ----------
  //   이야기 글의 새 칸(한 칸에 하나씩 · 위에서 아래로):
  //     fx: 종류, id, at(자리 | 'me' | 'head:이름' | 'hand:이름'), fwd·side(앞·옆 m), dy, h(방위°), s(크기), anim  — 만들기(같은 id면 바꿔 그림)
  //     fxMove: id, to, sec, arc(뛰는 높이 m), dy, face(true), wait  · fxAnim: id, anim · fxDel: id | 'all'
  //     morph: id, to(종류), anim — 펑! 하고 다른 모습으로 · powder: id(color) — 위에서 가루가 떨어짐 · glow: 'party'|이름|'me'(color) — 둘레에 빛 알갱이
  //     shrink: 크기(1/12 …) — 나와 친구들(party)이 1.4초 동안 작아짐 · grow: true — 원래대로 · grass: 자리, r, n, hmin, hmax — 큰 풀숲(작아졌을 때 · 한 메시)
  //     chase: id, sec, speed, goal — 그 생물이 나를 쫓아옴(잡히거나 시간이 끝나면 다음) · hold: id, on(이름|'me'|null) — 손에 듦 · act: 이름, pose, faceTo(이름|'me')
  //     emote: 이름|'me', icon, sec — 머리 위 그림 · use: id, label, goal — 그 물건 앞에서 E · circle: 'party', r — 내 앞에 둥글게 · tiny 판에선 친구도 작은 걸음
  //   모양 = 기본 도형 묶음(Group · 색마다 재질 하나 · MeshLambert — 새 조명 없음) · 이야기 동안 몇 개뿐이라 드로우콜 작음 · 멈추면 모두 치움
  const T3 = map.three, FX = new Map(), FXDISP = [], MATC = new Map(), FXROOT = new T3.Group(); map.add(FXROOT);
  const fxMat = (c, o) => { const k = c + '|' + (o ? JSON.stringify(o) : ''); let m = MATC.get(k); if (!m) { m = new T3.MeshLambertMaterial({ color: c, ...(o || {}) }); MATC.set(k, m); FXDISP.push(m); } return m; };
  const FG = { b: new T3.BoxGeometry(1, 1, 1), s: new T3.SphereGeometry(1, 14, 10), c: new T3.CylinderGeometry(1, 1, 1, 10), k: new T3.ConeGeometry(1, 1, 12) }; FXDISP.push(...Object.values(FG));
  const PT = (par, g, c, pos, sc, rot, o) => { const m = new T3.Mesh(FG[g], fxMat(c, o)); m.position.set(pos[0], pos[1], pos[2]); m.scale.set(sc[0], sc[1], sc[2]); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); par.add(m); return m; };
  const pivot = (par, pos) => { const g = new T3.Group(); g.position.set(pos[0], pos[1], pos[2]); par.add(g); return g; };
  const EYE = (par, x, y, z, r, white = 0xffffff) => { PT(par, 's', white, [x, y, z], [r, r, r]); PT(par, 's', 0x161616, [x, y, z - r * 0.62], [r * 0.55, r * 0.55, r * 0.55]); };   // 큰 눈(무섭지 않게 — 동그란 흰자 + 앞쪽 검은자)
  // 모양들(앞 = −z · 바닥 = y 0 · 단위 m · 실제보다 크게 — 아이 눈에 잘 보이게)
  const MODEL = {
    cricket(g, R) {   // 귀뚜라미 ≈ 11cm — 갈색 몸 · 긴 더듬이 · 큰 뒷다리
      PT(g, 's', 0x6b4423, [0, 0.026, 0.008], [0.024, 0.02, 0.048]); PT(g, 's', 0x4a2e16, [0, 0.04, 0.02], [0.02, 0.008, 0.042]);
      const hd = PT(g, 's', 0x5a381c, [0, 0.03, -0.044], [0.019, 0.018, 0.018]); EYE(g, 0.011, 0.038, -0.054, 0.007);
      R.ant = [-1, 1].map(sd => PT(g, 'c', 0x3d2614, [sd * 0.008, 0.06, -0.09], [0.0014, 0.08, 0.0014], [-1.05, 0, sd * 0.3]));
      R.legs = [-1, 1].map(sd => { const p = pivot(g, [sd * 0.024, 0.03, 0.025]); PT(p, 'c', 0x7a4f2a, [0, 0.012, 0.018], [0.007, 0.05, 0.007], [0.95, 0, 0]); PT(p, 'c', 0x7a4f2a, [0, -0.012, 0.045], [0.0035, 0.05, 0.0035], [-0.55, 0, 0]); return p; });
      for (const sd of [-1, 1]) for (const z of [-0.025, -0.004]) PT(g, 'c', 0x5a381c, [sd * 0.02, 0.012, z], [0.0022, 0.028, 0.0022], [0.3, 0, sd * 0.8]);
      R.band = PT(g, 'b', 0xffffff, [0.03, 0.03, 0.04], [0.01, 0.012, 0.016]); R.band.visible = false; void hd;   // 반창고(재판 장면 — 다친 다리)
    },
    mantis(g, R) {   // 사마귀 ≈ 45cm(작아진 우리에겐 거인) — 연두 몸 · 세모 머리 · 큰 눈 · 접힌 앞다리
      PT(g, 's', 0x5cb85c, [0, 0.12, 0.12], [0.05, 0.045, 0.13], [0.25, 0, 0]); PT(g, 's', 0x8fd88f, [0, 0.16, 0.13], [0.04, 0.012, 0.12], [0.25, 0, 0], { transparent: true, opacity: 0.85 });
      PT(g, 'c', 0x6cc06c, [0, 0.22, -0.02], [0.02, 0.2, 0.02], [-0.45, 0, 0]);
      const hd = pivot(g, [0, 0.32, -0.07]); R.head = hd; PT(hd, 'k', 0x7bd07b, [0, 0.0, -0.01], [0.05, 0.06, 0.035], [Math.PI, 0, 0]); EYE(hd, 0.034, 0.018, -0.02, 0.019, 0xe6f58a); EYE(hd, -0.034, 0.018, -0.02, 0.019, 0xe6f58a);
      for (const sd of [-1, 1]) PT(hd, 'c', 0x4f9f4f, [sd * 0.012, 0.06, -0.04], [0.0025, 0.1, 0.0025], [-0.7, 0, sd * 0.35]);
      R.arms = [-1, 1].map(sd => { const p = pivot(g, [sd * 0.03, 0.25, -0.08]); PT(p, 'c', 0x6cc06c, [0, -0.04, -0.03], [0.013, 0.1, 0.013], [0.6, 0, 0]); const lo = pivot(p, [0, -0.08, -0.06]); PT(lo, 'c', 0x5cb85c, [0, 0.03, -0.02], [0.011, 0.09, 0.011], [-0.9, 0, 0]);
        for (let k = 0; k < 3; k++) PT(lo, 'k', 0x3d8b40, [0, 0.01 + k * 0.022, -0.035], [0.004, 0.012, 0.004], [-1.9, 0, 0]); p.userData.lo = lo; return p; });
      R.legs = []; for (const z of [0.03, 0.13]) for (const sd of [-1, 1]) { const p = pivot(g, [sd * 0.035, 0.11, z]); PT(p, 'c', 0x4f9f4f, [sd * 0.04, -0.05, 0], [0.007, 0.14, 0.007], [0, 0, sd * 0.6]); R.legs.push(p); }
    },
    beetle(g, R) {   // 장수풍뎅이 재판관 ≈ 34cm — 반짝이는 고동색 · 큰 뿔 · 재판관 모자 · 나무 망치
      const sc = 2; const b = pivot(g, [0, 0.14, 0]); b.scale.setScalar(sc);
      PT(b, 's', 0x3b2416, [0, 0.05, 0.025], [0.056, 0.042, 0.078]); PT(b, 'b', 0x5a3a22, [0, 0.074, 0.03], [0.004, 0.012, 0.13]);
      PT(b, 's', 0x4a2c18, [0, 0.062, -0.045], [0.047, 0.037, 0.036]); PT(b, 's', 0x3b2416, [0, 0.05, -0.08], [0.026, 0.022, 0.026]);
      EYE(b, 0.018, 0.058, -0.096, 0.008); EYE(b, -0.018, 0.058, -0.096, 0.008);
      PT(b, 'k', 0x2a170c, [0, 0.1, -0.106], [0.012, 0.075, 0.012], [-0.45, 0, 0]); PT(b, 's', 0x2a170c, [0, 0.135, -0.124], [0.012, 0.006, 0.012]);
      PT(b, 'k', 0x2a170c, [0, 0.105, -0.05], [0.009, 0.045, 0.009], [-0.9, 0, 0]);
      PT(b, 'c', 0x111111, [0, 0.105, -0.032], [0.022, 0.012, 0.022]); PT(b, 'b', 0x111111, [0, 0.115, -0.032], [0.056, 0.005, 0.056], [0, 0.785, 0]); PT(b, 'c', 0xf2c230, [0.03, 0.105, -0.032], [0.0025, 0.02, 0.0025]);   // 재판관 모자
      for (const sd of [-1, 1]) for (const z of [-0.035, 0.0, 0.04]) PT(b, 'c', 0x2a170c, [sd * 0.05, 0.022, z], [0.0035, 0.05, 0.0035], [0, 0, sd * 0.75]);
      const arm = pivot(b, [0.04, 0.05, -0.07]); R.arm = arm; PT(arm, 'c', 0x2a170c, [0.012, 0.012, -0.012], [0.004, 0.04, 0.004], [-0.6, 0, -0.4]);
      PT(arm, 'c', 0x8b5a2b, [0.03, 0.03, -0.035], [0.004, 0.05, 0.004]); PT(arm, 'c', 0x6b4423, [0.03, 0.058, -0.035], [0.011, 0.03, 0.011], [0, 0, Math.PI / 2]);   // 망치
      PT(g, 'c', 0x8b6b4a, [0, 0.07, 0.01], [0.17, 0.14, 0.17]); PT(g, 'c', 0xc4a57a, [0, 0.142, 0.01], [0.165, 0.006, 0.165]); for (let k = 0; k < 5; k++) { const a = k * 1.256; PT(g, 'k', 0x6b4f35, [Math.cos(a) * 0.17, 0.03, 0.01 + Math.sin(a) * 0.17], [0.03, 0.06, 0.03], [0, 0, 0]); }   // 그루터기 재판대 + 뿌리
    },
    ant(g, R) {   // 개미 ≈ 6cm(구경꾼)
      for (const [z, r] of [[0.022, 0.014], [0, 0.009], [-0.02, 0.011]]) PT(g, 's', 0x3a1f12, [0, 0.014, z], [r, r * 0.85, r * 1.15]); EYE(g, 0.006, 0.018, -0.028, 0.004);
      R.legs = []; for (const z of [-0.006, 0.0, 0.006]) for (const sd of [-1, 1]) { const p = pivot(g, [sd * 0.006, 0.012, z]); PT(p, 'c', 0x2a170c, [sd * 0.012, -0.004, 0], [0.0018, 0.026, 0.0018], [0, 0, sd * 1.0]); R.legs.push(p); }
      for (const sd of [-1, 1]) PT(g, 'c', 0x2a170c, [sd * 0.005, 0.026, -0.036], [0.0012, 0.022, 0.0012], [-0.9, 0, sd * 0.4]);
    },
    butterfly(g, R) {   // 나비 ≈ 날개 폭 26cm — 주황 날개 · 검은 무늬 · 펄럭임
      PT(g, 'c', 0x2b2b2b, [0, 0.03, 0], [0.006, 0.06, 0.006], [Math.PI / 2, 0, 0]); PT(g, 's', 0x2b2b2b, [0, 0.03, -0.034], [0.008, 0.008, 0.008]);
      for (const sd of [-1, 1]) PT(g, 'c', 0x2b2b2b, [sd * 0.006, 0.045, -0.05], [0.0012, 0.03, 0.0012], [-0.8, 0, sd * 0.4]);
      R.wings = [-1, 1].map(sd => { const w = pivot(g, [sd * 0.004, 0.03, 0]); PT(w, 's', 0xff9f1a, [sd * 0.06, 0, -0.012], [0.06, 0.002, 0.045]); PT(w, 's', 0xffc94d, [sd * 0.045, 0, 0.03], [0.04, 0.002, 0.03]);
        PT(w, 's', 0x2b2b2b, [sd * 0.085, 0.001, -0.025], [0.014, 0.002, 0.012]); PT(w, 's', 0xffffff, [sd * 0.1, 0.002, -0.01], [0.006, 0.002, 0.006]); return w; });
    },
    egg(g) { PT(g, 's', 0xf5efc0, [0, 0.016, 0], [0.012, 0.016, 0.012]); PT(g, 's', 0xfffbe0, [0.004, 0.022, -0.004], [0.004, 0.005, 0.004]); },
    caterpillar(g, R) {   // 애벌레 ≈ 14cm — 초록 마디 · 노랑·검정 띠 · 기어감
      R.seg = []; for (let k = 0; k < 7; k++) { const p = pivot(g, [0, 0.016, 0.06 - k * 0.02]); PT(p, 's', k === 6 ? 0x6abf45 : 0x7cc850, [0, 0, 0], [0.017, 0.016, 0.014]);
        if (k < 6 && k % 2 === 0) PT(p, 'b', 0x222222, [0, 0.013, 0], [0.02, 0.003, 0.004]); if (k < 6 && k % 2) PT(p, 'b', 0xf2c230, [0, 0.013, 0], [0.02, 0.003, 0.004]); R.seg.push(p); }
      const hd = R.seg[6]; EYE(hd, 0.007, 0.005, -0.011, 0.004); for (const sd of [-1, 1]) PT(hd, 'c', 0x333333, [sd * 0.006, 0.018, -0.004], [0.0012, 0.012, 0.0012]);
    },
    pupa(g) {   // 번데기 ≈ 10cm — 나뭇가지에 매달린 연두·금빛 점
      PT(g, 'c', 0x6b4423, [0.03, 0.16, 0], [0.006, 0.12, 0.006], [0, 0, Math.PI / 2]); PT(g, 'c', 0x7a5230, [0.085, 0.085, 0], [0.008, 0.17, 0.008]); PT(g, 's', 0x5aa04a, [0.1, 0.17, 0], [0.02, 0.01, 0.014]); PT(g, 'c', 0x6b4423, [0, 0.13, 0], [0.002, 0.03, 0.002]);
      PT(g, 's', 0x7cbf5a, [0, 0.085, 0], [0.02, 0.042, 0.02]); PT(g, 'k', 0x6aa84a, [0, 0.035, 0], [0.012, 0.03, 0.012], [Math.PI, 0, 0]);
      for (const [x, y] of [[0.012, 0.1], [-0.01, 0.09], [0.004, 0.07]]) PT(g, 's', 0xf2c230, [x, y, -0.016], [0.003, 0.003, 0.003]);
    },
    leaf(g) {   // 큰 잎 ≈ 34cm
      PT(g, 's', 0x4caf50, [0, 0.004, 0], [0.17, 0.005, 0.085]); PT(g, 'b', 0x3d8b40, [0, 0.009, 0], [0.32, 0.003, 0.007]);
      for (const x of [-0.08, 0, 0.08]) for (const sd of [-1, 1]) PT(g, 'b', 0x3d8b40, [x, 0.009, sd * 0.03], [0.004, 0.002, 0.06], [0, sd * 0.6, 0]);
      PT(g, 'c', 0x3d8b40, [0.19, 0.006, 0], [0.004, 0.06, 0.004], [0, 0, Math.PI / 2]);
    },
    stick(g, R) {   // 나뭇가지 ≈ 70cm
      PT(g, 'c', 0x7a5230, [0, 0.35, 0], [0.012, 0.7, 0.012]); PT(g, 'c', 0x7a5230, [0.05, 0.5, 0], [0.006, 0.16, 0.006], [0, 0, -0.7]); PT(g, 's', 0x5aa04a, [0.1, 0.56, 0], [0.025, 0.012, 0.018]); R.swing = g;
    },
    part(g, R) {   // 로봇 부품 ≈ 6cm — 회색 몸 · 톱니 · 파란 하트 스티커(은규가 붙인 것)
      PT(g, 'b', 0x9aa5b1, [0, 0.013, 0], [0.055, 0.026, 0.038]); PT(g, 'c', 0xc0c7cf, [0, 0.032, 0], [0.019, 0.008, 0.019]);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; PT(g, 'b', 0xc0c7cf, [Math.cos(a) * 0.021, 0.032, Math.sin(a) * 0.021], [0.006, 0.008, 0.006], [0, -a, 0]); }
      PT(g, 'b', 0xd4af37, [0.02, 0.008, -0.02], [0.004, 0.006, 0.012]); PT(g, 'b', 0xd4af37, [0.01, 0.008, -0.02], [0.004, 0.006, 0.012]);
      const hp = pivot(g, [0, 0.013, 0.0195]); R.heart = hp; PT(hp, 's', 0x2f7de1, [-0.005, 0.004, 0], [0.006, 0.006, 0.002]); PT(hp, 's', 0x2f7de1, [0.005, 0.004, 0], [0.006, 0.006, 0.002]); PT(hp, 'b', 0x2f7de1, [0, -0.002, 0], [0.009, 0.009, 0.003], [0, 0, Math.PI / 4]);
    },
    partplain(g) { MODEL.part(g, {}); g.children.slice(-1)[0].visible = false; },   // 하트 없는 같은 부품(인우 것)
    robot0(g, R) { robotBase(g, R, 0); }, robot1(g, R) { robotBase(g, R, 1); }, robot2(g, R) { robotBase(g, R, 2); },
  };
  function robotBase(g, R, st) {   // 코딩 로봇 ≈ 22cm — 0 = 바퀴판만 · 1 = 몸통까지(팔 자리 비어 있음) · 2 = 완성(팔·머리·눈 불·안테나)
    PT(g, 'b', 0x3d5a80, [0, 0.03, 0], [0.16, 0.03, 0.12]); for (const x of [-0.085, 0.085]) for (const z of [-0.045, 0.045]) PT(g, 'c', 0x222222, [x, 0.022, z], [0.022, 0.014, 0.022], [0, 0, Math.PI / 2]);
    PT(g, 'b', 0xf2c230, [0, 0.047, 0.055], [0.04, 0.006, 0.006]);
    if (st >= 1) { PT(g, 'b', 0xe8edf3, [0, 0.09, 0], [0.1, 0.08, 0.08]); PT(g, 'b', 0x98c1d9, [0, 0.095, -0.041], [0.06, 0.04, 0.003]); PT(g, 's', 0xee6c4d, [0, 0.095, -0.043], [0.008, 0.008, 0.003]); }
    if (st >= 2) { R.arms = [-1, 1].map(sd => { const p = pivot(g, [sd * 0.058, 0.115, 0]); PT(p, 'b', 0x9aa5b1, [sd * 0.012, -0.02, 0], [0.018, 0.05, 0.02]); PT(p, 's', 0xee6c4d, [sd * 0.012, -0.05, 0], [0.012, 0.012, 0.012]); return p; });
      const hd = pivot(g, [0, 0.16, 0]); R.head = hd; PT(hd, 'b', 0xe8edf3, [0, 0.025, 0], [0.08, 0.05, 0.065]); R.eyes = [-1, 1].map(sd => PT(hd, 's', 0x3ff0ff, [sd * 0.018, 0.03, -0.033], [0.008, 0.008, 0.004], null, { emissive: 0x1aa0c0 }));
      PT(hd, 'c', 0x9aa5b1, [0, 0.06, 0], [0.003, 0.025, 0.003]); PT(hd, 's', 0xee6c4d, [0, 0.075, 0], [0.008, 0.008, 0.008]); }
  }
  let SC = 1, shrinkA = null, glowSet = [], partyScale = 1;
  const actorScaleOf = n => (PARTY.includes(n) ? partyScale : 1);
  function whereOf(t, st = {}) {   // 자리 → {x,y,z,h}
    const me = map.player.get();
    let p = null, h = st.h;
    if (t === 'me' || t == null) p = { x: me.x, y: me.y, z: me.z, h: me.h };
    else if (typeof t === 'string' && /^(head|hand|feet):/.test(t)) { const [k, n] = [t.slice(0, t.indexOf(':')), t.slice(t.indexOf(':') + 1)];
      const isMe = n === 'me' || n === ME, q = isMe ? { x: me.x, y: me.y, z: me.z, h: me.h } : npcAt(n) && { ...npcAt(n), h: (map.npc.get(n) || {}).face ?? 0 }, s9 = isMe ? SC : actorScaleOf(n);
      if (!q) return null; const hr = (q.h || 0) * Math.PI / 180;
      const hh = isMe ? 1.5 : ((map.npc.get(n) || {}).pose === 'sit' ? 1.08 : 1.42); p = k === 'head' ? { x: q.x, y: q.y + hh * s9, z: q.z } : k === 'hand' ? { x: q.x + Math.cos(hr) * 0.26 * s9 + Math.sin(hr) * 0.18 * s9, y: q.y + 0.95 * s9, z: q.z + Math.sin(hr) * 0.26 * s9 - Math.cos(hr) * 0.18 * s9 } : { x: q.x, y: q.y, z: q.z };
      h = h ?? q.h; }
    else p = place(t);
    if (!p) return null;
    if (st.fwd || st.side) { const hr = (me.h || 0) * Math.PI / 180, f = st.fwd || 0, sd = st.side || 0; p = { ...p, x: p.x + Math.sin(hr) * f + Math.cos(hr) * sd, z: p.z - Math.cos(hr) * f + Math.sin(hr) * sd }; }
    if (st.ground) { const gy = map.player.groundAt(p.x, p.z, (p.y ?? 0) + 0.6); if (gy != null && isFinite(gy)) p.y = gy; }
    return { x: p.x, y: (p.y ?? 0) + (st.dy || 0), z: p.z, h: h ?? p.h ?? 0 };
  }
  function fxMake(kind, id, at, st = {}) {
    if (!MODEL[kind]) { console.warn('[이야기] 모르는 모양', kind); return null; }
    const old = FX.get(id); if (old) { FXROOT.remove(old.g); FX.delete(id); }
    const g = new T3.Group(), R = {}; MODEL[kind](g, R, st); const s = st.s || 1; g.scale.setScalar(s);
    const o = { id, kind, g, R, x: at.x, y: at.y, z: at.z, h: at.h || 0, s, anim: st.anim || g.userData.anim || 'idle', t: Math.random() * 6, mv: null, hold: null, pop: 0 };
    FXROOT.add(g); FX.set(id, o); fxPlace(o); if (st.static) mergeStatic(g); return o;
  }
  function fxPlace(o) { o.g.position.set(o.x, o.y, o.z); o.g.rotation.y = -o.h * Math.PI / 180; }
  // 알갱이(펑·가루·빛) — 점 묶음 하나 · 1~1.8초 뒤 치움
  const PUFF = [];
  function particles(x, y, z, o = {}) {
    const n = o.n || 40, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), R0 = o.r || 0.15;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * R0, up = o.fall ? 0.25 + Math.random() * 0.25 : Math.random() * 0.2;
      pos[i * 3] = x + Math.cos(a) * r; pos[i * 3 + 1] = y + up; pos[i * 3 + 2] = z + Math.sin(a) * r;
      const sp = o.fall ? 0 : (o.speed || 0.4); vel[i * 3] = Math.cos(a) * sp * Math.random(); vel[i * 3 + 1] = o.fall ? -(0.12 + Math.random() * 0.2) : sp * (0.3 + Math.random()); vel[i * 3 + 2] = Math.sin(a) * sp * Math.random(); }
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const m = new T3.PointsMaterial({ color: o.color || 0xffe066, size: o.size || 0.03, transparent: true, opacity: 1, depthWrite: false });
    const pt = new T3.Points(geo, m); FXROOT.add(pt); PUFF.push({ pt, vel, t: 0, life: o.life || 1.4, swirl: o.swirl || 0, cx: x, cz: z });
  }
  // 머리 위 그림(💢 ❓ ❤️ …) — 글자 그림판 스프라이트
  const EMO = [];
  function emote(who, icon, sec = 2.5) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c2 = cv.getContext('2d'); c2.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(icon, 48, 54);
    const tex = new T3.CanvasTexture(cv); tex.colorSpace = T3.SRGBColorSpace; const sp = new T3.Sprite(new T3.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.renderOrder = 10; FXROOT.add(sp);
    EMO.push({ sp, who, t: 0, life: sec });
  }
  // 큰 풀숲(작아졌을 때) — 풀잎 = 원뿔 인스턴스 하나(드로우콜 1)
  const GRASS = [];
  function grassAt(c, st) {
    const n = st.n || 60, r = st.r || 1.6, r0 = st.r0 || 0.25, hmin = st.hmin || 0.18, hmax = st.hmax || 0.5;
    const im = new T3.InstancedMesh(FG.k, fxMat(0xffffff), n), M4 = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler(), V = new T3.Vector3(), S9 = new T3.Vector3(), C9 = new T3.Color();
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, rr = r0 + Math.sqrt(Math.random()) * (r - r0), x = c.x + Math.cos(a) * rr, z = c.z + Math.sin(a) * rr, h = hmin + Math.random() * (hmax - hmin);
      const gy = map.player.groundAt(x, z, c.y + 0.6); E.set((Math.random() - 0.5) * 0.35, Math.random() * 6, (Math.random() - 0.5) * 0.35); Q.setFromEuler(E);
      V.set(x, (gy != null && isFinite(gy) ? gy : c.y) + h / 2, z); S9.set(0.012 + Math.random() * 0.012, h, 0.004); M4.compose(V, Q, S9); im.setMatrixAt(i, M4); im.setColorAt(i, C9.setHSL(0.27 + Math.random() * 0.06, 0.55, 0.32 + Math.random() * 0.14)); }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; FXROOT.add(im); GRASS.push(im); im.userData.grow = 0; im.scale.y = 0.01;
  }
  function ringPt(x, z, me) {
    if (SC < 1) { const gy = map.player.groundAt(x, z, me.y + 0.5 * SC); return { x, y: gy != null && isFinite(gy) ? gy : me.y, z }; }
    const zz = map.zoneAt(me.x, me.y, me.z), r = zz ? [zz.x0, zz.z0, zz.x1, zz.z1] : null, z9 = map.zoneAt(x, me.y, z);
    if ((z9 && z9.id) === (zz && zz.id) && !map.player.blockedAt(x, z, me.y)) { const gy = map.player.groundAt(x, z, me.y + 0.3); return { x, y: gy != null && isFinite(gy) && Math.abs(gy - me.y) < 0.6 ? gy : me.y, z }; }   // 같은 방 · 막히지 않음 = 그 자리
    return map.findEntry(x, z, me.y, r, 3) || map.findEntry(me.x, me.z, me.y, r, 3) || { x: me.x, y: me.y, z: me.z };
  }
  function ringAt(a, r, me, used) {   // 둘러서기 한 자리: 같은 방·막히지 않음·친구끼리 겹치지 않음 — 반지름·각도를 조금씩 바꿔 가며 찾음
    const zz = map.zoneAt(me.x, me.y, me.z), id = zz && zz.id;
    const ok = (x, z) => used.every(u => Math.hypot(u.x - x, u.z - z) > 0.55 * SC) && (SC < 1 || ((map.zoneAt(x, me.y, z) || {}).id === id && !map.player.blockedAt(x, z, me.y)));
    for (const k of [1, 0.7, 1.35, 0.5, 1.7]) for (const da of [0, 0.35, -0.35, 0.7, -0.7, 1.2, -1.2]) { const x = me.x + Math.sin(a + da) * r * k, z = me.z - Math.cos(a + da) * r * k; if (!ok(x, z)) continue;
      const gy = map.player.groundAt(x, z, me.y + 0.5 * Math.max(SC, 0.3)), p = { x, y: gy != null && isFinite(gy) && Math.abs(gy - me.y) < 0.6 * Math.max(SC, 0.3) ? gy : me.y, z }; used.push(p); return p; }
    const p = ringPt(me.x + Math.sin(a) * r, me.z - Math.cos(a) * r, me); used.push(p); return p;
  }
  const lerp = (a, b, k) => a + (b - a) * k, ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  let chaseR = null;
  function fxTick(dt) {
    if (BODY) { const me = map.player.get(), o = BODY.o, d = Math.hypot(me.x - BODY.lx, me.z - BODY.lz), gy = map.player.groundAt(me.x, me.z, me.y + 0.05), air = gy != null && isFinite(gy) && me.y - gy > 0.08 * Math.max(SC, 0.2);
      o.x = me.x; o.y = me.y; o.z = me.z; o.h = me.h; o.s = BODY.base * SC; o.anim = air && o.R.wings ? 'fly' : d > 0.0005 ? 'walk' : 'idle'; BODY.lx = me.x; BODY.lz = me.z;
      if (o.R.wingHide) o.R.wings.forEach((w, k) => { w.visible = air; w.rotation.y = (k ? -1 : 1) * (0.35 + Math.sin(o.t * 12) * 0.35); }); }
    for (const o of FX.values()) {
      o.t += dt; const R = o.R, t = o.t; o.moving = false;
      if (o.wd && !o.mv && !o.hold) { const w = o.wd; if (w.wait > 0) w.wait -= dt; else { const dx = w.tx - o.x, dz = w.tz - o.z, d = Math.hypot(dx, dz);
        if (d < 0.05) { w.tx = w.r[0] + Math.random() * (w.r[2] - w.r[0]); w.tz = w.r[1] + Math.random() * (w.r[3] - w.r[1]); w.wait = 0.4 + Math.random() * 2.2; } else { const s9 = Math.min(d, w.sp * dt); o.x += dx / d * s9; o.z += dz / d * s9; o.h = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; o.moving = true; } } }
      if (o.fol && !o.mv && !o.hold) { const me = map.player.get(), hr = me.h * Math.PI / 180, F = o.fol, back = F.d * (1 + 0.5 * (F.k >> 1)), side = (F.k % 2 ? 1 : -1) * F.d * 0.55, tx = me.x - Math.sin(hr) * back + Math.cos(hr) * side, tz = me.z + Math.cos(hr) * back + Math.sin(hr) * side, dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
        if (d > F.d * 4) { o.x = tx; o.z = tz; } else if (d > F.d * 0.25) { const s9 = Math.min(d, F.sp * dt * Math.min(1.6, d / F.d + 0.4)); o.x += dx / d * s9; o.z += dz / d * s9; o.h = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; o.moving = true; }
        const gy = map.player.groundAt(o.x, o.z, me.y + 0.4); o.y += ((gy != null && isFinite(gy) && Math.abs(gy - me.y) < 0.8 ? gy : me.y) - o.y) * Math.min(1, dt * 8); }
      if (o.anim === 'waggle') { if (!o.wb) o.wb = { x: o.x, z: o.z }; const a = t * 2.4, px = o.x; o.x = o.wb.x + Math.sin(a) * 0.9 * o.s; o.z = o.wb.z + Math.sin(2 * a) * 0.45 * o.s; o.h = (Math.atan2(o.x - px, -(Math.cos(2 * a))) * 180 / Math.PI + 360) % 360; } else if (o.wb) { o.x = o.wb.x; o.z = o.wb.z; o.wb = null; }
      if (o.g.userData.spinner) { if (R.ring) R.ring.rotation.y += dt * 1.6; else o.h = (o.h + 50 * dt) % 360; }
      if (R.head && o.kind === 'capy') R.head.rotation.x = o.anim === 'sleep' ? 0.45 : o.anim === 'eat' ? 0.3 + Math.abs(Math.sin(t * 6)) * 0.25 : 0;
      if (o.mv) { const m = o.mv; m.k = Math.min(1, m.k + dt / m.sec); const e = ease(m.k); o.x = lerp(m.a.x, m.b.x, e); o.z = lerp(m.a.z, m.b.z, e); o.y = lerp(m.a.y, m.b.y, e) + (m.arc ? Math.sin(Math.PI * m.k) * m.arc : 0);
        if (m.face) o.h = (Math.atan2(m.b.x - m.a.x, -(m.b.z - m.a.z)) * 180 / Math.PI + 360) % 360; if (m.k >= 1) { o.mv = null; m.done(); } }
      if (o.hold) { const hd = o.holdAt === 'head', p = whereOf((hd ? 'head:' : 'hand:') + o.hold); if (p) { o.x = p.x; o.y = hd ? p.y : p.y - (o.kind === 'stick' ? 0.12 : 0.01) * o.s; o.z = p.z; if (!hd) o.h = p.h; } }
      if (o === (chaseR && chaseR.o)) { const me = map.player.get(), dx = me.x - o.x, dz = me.z - o.z, d = Math.hypot(dx, dz), stp = chaseR.speed * dt;
        if (d > 0.01) { o.x += dx / d * Math.min(stp, d); o.z += dz / d * Math.min(stp, d); o.h = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; }
        const gy = map.player.groundAt(o.x, o.z, o.y + 0.6); if (gy != null && isFinite(gy)) o.y += (gy - o.y) * Math.min(1, dt * 8);
        chaseR.t += dt; if (d < chaseR.catchR || chaseR.t > chaseR.sec) { const r9 = chaseR; chaseR = null; r9.done(d < r9.catchR); } }
      // 움직임(몸짓)
      const walking = !!(o.mv && !o.mv.arc) || o === (chaseR && chaseR.o) || o.anim === 'walk' || o.moving;
      if (R.legs) R.legs.forEach((p, k) => { p.rotation.x = walking ? Math.sin(t * 14 + k * 1.7) * 0.45 : Math.sin(t * 2 + k) * 0.04; });
      if (R.ant) R.ant.forEach((a, k) => { a.rotation.z = (k ? 1 : -1) * 0.3 + Math.sin(t * 3 + k) * 0.12; });
      if (R.wings && !R.wingHide) { const f = o.anim === 'fly' || (o.mv && o.mv.arc) ? Math.sin(t * 16) * 0.9 : o.anim === 'open' ? Math.sin(t * 2.4) * 0.35 - 0.1 : -1.25; R.wings[0].rotation.z = f; R.wings[1].rotation.z = -f; }
      if (R.seg) R.seg.forEach((p, k) => { p.position.y = 0.016 + Math.max(0, Math.sin(t * 5 - k * 0.8)) * 0.008; });
      if (R.arms && o.kind === 'mantis') R.arms.forEach((p, k) => { const strike = o === (chaseR && chaseR.o) || o.anim === 'strike'; p.rotation.x = strike ? -0.5 + Math.sin(t * 7 + k) * 0.35 : -0.1 + Math.sin(t * 1.5) * 0.05; });
      if (R.head && o.kind === 'mantis') R.head.rotation.y = Math.sin(t * 1.3) * 0.35;
      if (R.arm) R.arm.rotation.x = o.anim === 'gavel' ? (Math.sin(t * 9) > 0 ? -0.9 : 0.1) : 0;
      if (R.swing) R.swing.rotation.x = o.anim === 'swat' ? -Math.abs(Math.sin(t * 7)) * 1.6 : -0.25;
      if (o.kind.startsWith('robot') && R.head) { const dance = o.anim === 'dance'; o.g.rotation.y = -o.h * Math.PI / 180 + (dance ? Math.sin(t * 3) * 0.8 : 0); R.head.rotation.y = dance ? Math.sin(t * 6) * 0.4 : 0;
        if (R.arms) R.arms.forEach((p, k) => { p.rotation.x = dance ? Math.sin(t * 6 + k * Math.PI) * 1.1 : 0; }); }
      let bob = 0; if (o.anim === 'idle' && !o.mv) bob = Math.sin(t * 2.2) * 0.003 * o.s / Math.max(0.2, o.s); if (o.anim === 'hop') bob = Math.abs(Math.sin(t * 5)) * 0.03 * o.s; if (o.anim === 'fly') bob = Math.sin(t * 3) * 0.04 * o.s;
      if (o.anim === 'spin') o.h = (o.h + 70 * dt) % 360;
      if (o.anim === 'hurt') { o.g.rotation.z = Math.sin(t * 10) * 0.25; } else o.g.rotation.z = 0;
      if (o.anim === 'dance' && !R.head) bob = Math.abs(Math.sin(t * 6)) * 0.02 * o.s;
      if (o.g.userData.hopper && (o.moving || o.anim === 'dance' || o.anim === 'hop')) bob = Math.abs(Math.sin(t * (o.anim === 'dance' ? 7 : 9))) * 0.14 * o.s;
      if (o.anim === 'sleep') bob = -0.06 * o.s;
      if (o.pop) { o.pop = Math.max(0, o.pop - dt); }
      o.g.position.set(o.x, o.y + bob, o.z); if (!o.kind.startsWith('robot')) o.g.rotation.y = -o.h * Math.PI / 180;
      const tgtS = o.s * (o.grow != null ? o.grow : 1); if (o.grow != null) { o.grow = Math.min(1, o.grow + dt * 3.5); if (o.grow >= 1) o.grow = null; } o.g.scale.setScalar(tgtS);
    }
    for (let i = PUFF.length - 1; i >= 0; i--) { const p = PUFF[i]; p.t += dt; const A = p.pt.geometry.attributes.position, a = A.array, v = p.vel;
      for (let k = 0; k < a.length; k += 3) { if (p.swirl) { const dx = a[k] - p.cx, dz = a[k + 2] - p.cz, an = p.swirl * dt; a[k] = p.cx + dx * Math.cos(an) - dz * Math.sin(an); a[k + 2] = p.cz + dx * Math.sin(an) + dz * Math.cos(an); }
        a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; if (!p.swirl && v[k + 1] > -2) v[k + 1] -= 0.4 * dt; }
      A.needsUpdate = true; p.pt.material.opacity = Math.max(0, 1 - p.t / p.life); if (p.t >= p.life) { FXROOT.remove(p.pt); p.pt.geometry.dispose(); p.pt.material.dispose(); PUFF.splice(i, 1); } }
    for (let i = EMO.length - 1; i >= 0; i--) { const e = EMO[i]; e.t += dt; const F9 = FX.get(e.who), p = F9 ? { x: F9.x, y: F9.y + (F9.R.top || 0.6) * F9.s, z: F9.z } : whereOf('head:' + e.who); if (p) { const s9 = F9 ? SC : e.who === 'me' || e.who === ME ? SC : actorScaleOf(e.who); e.sp.position.set(p.x, p.y + 0.35 * s9 + Math.sin(e.t * 6) * 0.02 * s9, p.z); e.sp.scale.setScalar(0.42 * s9 * Math.min(1, e.t * 6)); }
      if (e.t >= e.life) { FXROOT.remove(e.sp); e.sp.material.map.dispose(); e.sp.material.dispose(); EMO.splice(i, 1); } }
    for (const im of GRASS) if (im.userData.grow < 1) { im.userData.grow = Math.min(1, im.userData.grow + dt * 1.2); im.scale.y = ease(im.userData.grow); }
    if (shrinkA) { const A = shrinkA; A.k = Math.min(1, A.k + dt / A.sec); const s = lerp(A.from, A.to, ease(A.k)); SC = s;
      applyPhys();
      partyScale = s; for (const n of PARTY) map.npc.scale(n, s); if (A.k >= 1) { shrinkA = null; applyPhys(); A.done(); } }
  }
  function fxStop() { for (const o of FX.values()) FXROOT.remove(o.g); FX.clear(); for (const p of PUFF) { FXROOT.remove(p.pt); p.pt.geometry.dispose(); p.pt.material.dispose(); } PUFF.length = 0;
    for (const e of EMO) { FXROOT.remove(e.sp); e.sp.material.map && e.sp.material.map.dispose(); e.sp.material.dispose(); } EMO.length = 0;
    for (const im of GRASS) { FXROOT.remove(im); im.dispose(); } GRASS.length = 0; for (const d of FXDISP) d.dispose && d.dispose(); clearTimeout(physT); if (SC !== 1 || PHYS) map.player.scale(1); removeEventListener('keydown', bookKey, true); removeEventListener('keyup', bookKey, true); if (bookEl) { bookEl.remove(); bookEl = null; } }
  // 이야기 칸 하나 실행(runSteps가 부름) — 기다릴 것이 있으면 Promise
  async function fxStep(st) {
    await worldStep(st);
    if (st.fx) { const at = whereOf(st.at ?? 'me', st); if (at && st.faceMe) { const me = map.player.get(); at.h = (Math.atan2(me.x - at.x, -(me.z - at.z)) * 180 / Math.PI + 360) % 360; } if (at) { const o = fxMake(st.fx, st.id || st.fx, at, st); if (o && st.pop !== false) { o.grow = 0.05; particles(at.x, at.y + 0.02, at.z, { color: 0xffffff, n: 18, r: 0.06 * (st.s || 1), speed: 0.25 * (st.s || 1), size: 0.02, life: 0.7 }); } } }
    if (st.fxAnim) { const o = FX.get(st.fxAnim); if (o) o.anim = st.anim || 'idle'; }
    if (st.fxDel) { for (const [k, o] of [...FX]) if (st.fxDel === 'all' || k === st.fxDel) { particles(o.x, o.y + 0.02, o.z, { color: 0xffffff, n: 14, r: 0.05, speed: 0.2, size: 0.018, life: 0.6 }); FXROOT.remove(o.g); FX.delete(k); } }
    if (st.hold) { const o = FX.get(st.hold); if (o) { o.hold = st.on === 'me' ? ME || 'me' : st.on || null; o.holdAt = st.where || 'hand'; } }   // where: 'hand' | 'head'
    if (st.fxMove) { const o = FX.get(st.fxMove), b = whereOf(st.to, st); if (o && b) { o.hold = null; const p = new Promise(res => { o.mv = { a: { x: o.x, y: o.y, z: o.z }, b, k: 0, sec: st.sec || 1, arc: st.arc || 0, face: st.face !== false, done: res }; });
      if (st.wait !== false) await p; if (st.h != null) o.h = st.h; } }
    if (st.morph) { const o = FX.get(st.morph); if (o) { particles(o.x, o.y + 0.03 * o.s, o.z, { color: st.color || 0xfff4c2, n: 46, r: 0.06 * o.s * 3, speed: 0.35, size: 0.022, life: 1.1 }); map.sfx('ding');
      o.grow = 1; const k0 = performance.now(); await new Promise(r => setTimeout(r, 260)); void k0;
      const n = fxMake(st.to, o.id, { x: o.x, y: o.y + (st.dy || 0), z: o.z, h: o.h }, { s: st.s || o.s, anim: st.anim || 'idle' }); if (n) n.grow = 0.05; } }
    if (st.powder) { const o = FX.get(st.powder), p = o ? { x: o.x, y: o.y + 0.12 * o.s, z: o.z } : whereOf(st.powder); if (p) { particles(p.x, p.y, p.z, { color: st.color || 0xffd54a, n: 70, r: 0.08, fall: true, size: 0.016, life: 1.8 }); map.sfx('tick'); await new Promise(r => setTimeout(r, 900)); } }
    if (st.glow) { for (const n of st.glow === 'party' ? [...PARTY, 'me'] : [].concat(st.glow)) { const p = whereOf(n === 'me' ? 'me' : 'feet:' + n); if (p) { const k9 = n === 'me' ? SC : actorScaleOf(n); particles(p.x, p.y + 0.4 * k9, p.z, { color: st.color || 0x9ef07a, n: 40, r: 0.4 * k9, swirl: 4, speed: 0.2 * k9, size: 0.07 * Math.sqrt(k9), life: 1.6 }); } } }
    if (st.shrink != null || st.grow) { const to = st.grow ? 1 : st.shrink; if (st.grow) { map.tone(330, 0, 1.1, 'sine', 0.12, 990); map.tone(660, 0.15, 1.0, 'triangle', 0.05, 1320); } else { map.tone(990, 0, 1.1, 'sine', 0.12, 260); map.tone(1320, 0.1, 0.9, 'triangle', 0.05, 330); } await new Promise(res => { shrinkA = { k: 0, sec: st.sec || 1.4, from: SC, to, done: res }; }); }
    if (st.grass) { const c = whereOf(st.grass, { ground: true }); if (c) grassAt(c, st); }
    if (st.act) { const n = st.act; if (n !== ME) { let face = st.face; if (st.faceTo) { const q = st.faceTo === 'me' || st.faceTo === ME ? map.player.get() : npcAt(st.faceTo), me9 = npcAt(n); if (q && me9) face = (Math.atan2(q.x - me9.x, -(q.z - me9.z)) * 180 / Math.PI + 360) % 360; }
      if (st.away && face != null) face = (face + 180) % 360; map.npc.pose(n, st.pose || 'stand', face); if (PARTY.includes(n)) map.npc.scale(n, partyScale); } }
    if (st.emote) for (const n of st.emote === 'party' ? [...PARTY, 'me'] : [st.emote]) emote(n === ME ? 'me' : n, st.icon || '❗', st.sec || 2.5);
    if (st.circle) { const L9 = namesOf(st.circle, st.except), me = map.player.get(), hr = me.h * Math.PI / 180, r = (st.r || 1.2) * SC, used = [{ x: me.x, z: me.z }];
      L9.forEach((n, k) => { const a = hr + (k - (L9.length - 1) / 2) * (st.arc || 0.55), p = ringAt(a, r, me, used);
        map.npc.move(n, p, { pose: st.pose || 'stand', face: (Math.atan2(me.x - p.x, -(me.z - p.z)) * 180 / Math.PI + 360) % 360, ghost: true }); map.npc.scale(n, partyScale); });
      partyHold = true; }
    if (st.line) { const L9 = namesOf(st.line), me = map.player.get(), hr = me.h * Math.PI / 180, gap = (st.gap || 0.9) * SC;   // 내 양옆에 한 줄(같은 쪽을 봄 — 재판정 앞)
      L9.forEach((n, k) => { const j = (k >> 1) + 1, sd = k & 1 ? 1 : -1, p = ringPt(me.x + Math.cos(hr) * sd * j * gap + Math.sin(hr) * (st.back || 0) * SC, me.z + Math.sin(hr) * sd * j * gap - Math.cos(hr) * (st.back || 0) * SC, me);
        map.npc.move(n, p, { pose: 'stand', face: me.h, ghost: true }); map.npc.scale(n, partyScale); });
      partyHold = true; }
    if (st.free) partyHold = false;
    if (st.stay) partyHold = true;
    if (st.time) map.time(st.time);
    if (st.fxFace) { const o = FX.get(st.fxFace), me = map.player.get(); if (o) o.h = (Math.atan2(me.x - o.x, -(me.z - o.z)) * 180 / Math.PI + 360) % 360; }   // 그 생물이 나를 봄
    if (st.banner) map.hud.banner(st.banner, st.bannerSec || 2.2);
    if (st.grassOff) { for (const im of GRASS) { FXROOT.remove(im); im.dispose(); } GRASS.length = 0; }
    if (st.dark) { map.fade(st.dark, st.darkColor); await new Promise(r => setTimeout(r, st.dark * 500 + 60)); }   // 어두워진 한가운데까지만 기다림 → 다음 칸(tp 등)이 깜깜할 때 일어남
    if (st.fxShow) { const [id, part, on] = st.fxShow, o = FX.get(id); if (o && o.R[part]) o.R[part].visible = on !== false; }
    if (st.use) { const o = FX.get(st.use); if (o) { objective(st.goal || '살펴봐요', { x: o.x, y: o.y, z: o.z }, st.label || ''); await waitUse({ x: o.x, y: o.y, z: o.z }, st.label || '🔍 살펴보기', st.r || 1.6 * RS()); objective(null); map.sfx('ding'); } }
    if (st.chase) { const o = FX.get(st.chase); if (o) { if (st.goal) map.hud.goal(st.goal); map.player.freeze(false); const caught = await new Promise(res => { chaseR = { o, speed: st.speed || 1.6, sec: st.sec || 12, catchR: st.catchR || 0.22, t: 0, done: res }; });
      map.hud.goal(null); map.sfx(caught ? 'buzz' : 'tick'); VARS.caught = { i: caught ? 1 : 0, label: caught ? '잡힘' : '시간' }; } }
  }
  // ---------- WORLD-FX(10-07 교사 '세계 만들기 3·4·5번 판 — 학교처럼 · 세계관을 탄탄하게 · 아이들 시야가 넓어지게') ----------
  //   새 모양: bee·queen·hive·flower·honey · nyonyo·fairyK·fairyC·cloud·castle·stage·house·shop·bush·tidy·portal · capy·potion·keeper·pen·food
  //   새 칸: body(내 몸 = 그 모양 · null = 원래) · phys({gravity, jump, speed, sec} — 날기·빨리 달리기 · null = 원래) · solid([[x0,y0,z0,x1,y1,z1]…] 딛는 판) · arena([x0,z0,x1,z1] | null)
  //          wander(ids, rect, speed) · follow(ids | off) · book(쪽 번호 — 📖 세계 안내서) · rain({at, r, n, color}) · tone([[f, 시작, 길이, 파형, 크기, 끝f]…])
  FG.t = new T3.TorusGeometry(1, 0.12, 8, 28); FG.h = new T3.CylinderGeometry(1, 1, 1, 6); FG.q = new T3.ConeGeometry(1, 1, 4); FXDISP.push(FG.t, FG.h, FG.q);
  const LEGS = (g, R, xs, zs, y, len, c, r = 0.04) => { R.legs = []; for (const x of xs) for (const z of zs) { const p = pivot(g, [x, y, z]); PT(p, 'c', c, [0, -len / 2, 0], [r, len, r]); R.legs.push(p); } };
  const PERSON = (g, R, o) => {   // 사람 모양(요정·사육사) — 키 ≈1.5 · 다리 둘(걷기) · 팔 둘
    LEGS(g, R, [-0.09, 0.09], [0], 0.72, 0.7, o.leg || 0x34495e, 0.06);
    for (const p of R.legs) PT(p, 'b', o.shoe || 0x3a2a20, [0, -0.7, -0.03], [0.12, 0.07, 0.2]);
    if (o.skirt) PT(g, 'k', o.skirt, [0, 0.82, 0], [0.32, 0.36, 0.32]);
    PT(g, 'b', o.top || 0x4caf50, [0, 1.0, 0], [0.34, 0.42, 0.22]);
    R.arms = [-1, 1].map(sd => { const p = pivot(g, [sd * 0.21, 1.18, 0]); PT(p, 'c', o.top || 0x4caf50, [0, -0.2, 0], [0.05, 0.42, 0.05]); PT(p, 's', 0xf5cfa6, [0, -0.43, 0], [0.055, 0.055, 0.055]); return p; });
    PT(g, 's', 0xf5cfa6, [0, 1.4, 0], [0.19, 0.2, 0.19]); EYE(g, 0.07, 1.42, -0.16, 0.035); EYE(g, -0.07, 1.42, -0.16, 0.035);
    PT(g, 'b', 0xd9534f, [0, 1.33, -0.18], [0.07, 0.015, 0.01]); R.top = 1.75;
  };
  Object.assign(MODEL, {
    bee(g, R, st = {}) {   // 꿀벌 ≈ 1m(아이들 말 '꿀벌도 내가 작아진 만큼 작아진다' — 나와 비슷한 크기) · 노랑·검정 줄 · 날개 펄럭
      const q = st.queen ? 1.6 : 1; const b = pivot(g, [0, 0.55 * q, 0]); b.scale.setScalar(q);
      PT(b, 's', 0xf4c430, [0, 0, 0.12], [0.3, 0.28, 0.42]); for (const z of [0.0, 0.22]) PT(b, 'c', 0x2b2b2b, [0, 0, z], [0.305, 0.07, 0.305], [Math.PI / 2, 0, 0]);
      PT(b, 'k', 0x2b2b2b, [0, -0.02, 0.58], [0.06, 0.14, 0.06], [-Math.PI / 2, 0, 0]);
      PT(b, 's', 0x3b2a14, [0, 0.06, -0.38], [0.22, 0.22, 0.22]); EYE(b, 0.09, 0.1, -0.55, 0.06); EYE(b, -0.09, 0.1, -0.55, 0.06);
      for (const sd of [-1, 1]) { PT(b, 'c', 0x2b2b2b, [sd * 0.07, 0.3, -0.5], [0.012, 0.22, 0.012], [-0.5, 0, sd * 0.35]); PT(b, 's', 0x2b2b2b, [sd * 0.1, 0.4, -0.56], [0.03, 0.03, 0.03]); }
      R.wings = [-1, 1].map(sd => { const w = pivot(b, [sd * 0.08, 0.24, 0.02]); PT(w, 's', 0xe8f6ff, [sd * 0.28, 0, 0.05], [0.28, 0.012, 0.16], null, { transparent: true, opacity: 0.7 }); return w; });
      for (const sd of [-1, 1]) for (const z of [-0.1, 0.08, 0.25]) PT(b, 'c', 0x2b2b2b, [sd * 0.2, -0.25, z], [0.018, 0.25, 0.018], [0, 0, sd * 0.5]);
      if (st.queen) { PT(b, 'c', 0xffd23c, [0, 0.33, -0.38], [0.12, 0.08, 0.12]); for (let k = 0; k < 5; k++) { const a = k * 1.2566; PT(b, 'k', 0xffd23c, [Math.cos(a) * 0.1, 0.42, -0.38 + Math.sin(a) * 0.1], [0.03, 0.08, 0.03]); } PT(b, 's', 0xe74c3c, [0, 0.36, -0.49], [0.025, 0.025, 0.025]); }
      R.top = 1.15 * q; o9(g).anim = 'fly';
    },
    queen(g, R, st) { MODEL.bee(g, R, { ...st, queen: true }); },
    hive(g, R) {   // 벌집 탑 ≈ 3.4m — 육각 기둥 층층이 · 금빛 · 입구
      PT(g, 'c', 0x8b6b4a, [0, 0.3, 0], [1.3, 0.6, 1.3]); PT(g, 'c', 0xc4a57a, [0, 0.605, 0], [1.25, 0.02, 1.25]);
      const C = [0xf2b233, 0xe8a317, 0xf7c548];
      for (let k = 0; k < 5; k++) { const r = 1.05 - Math.abs(k - 1.8) * 0.18; const m = PT(g, 'c', C[k % 3], [0, 0.95 + k * 0.5, 0], [r, 0.5, r]); m.geometry = FG.h; }
      PT(g, 's', 0x3b2a14, [0, 1.35, -0.92], [0.28, 0.24, 0.1]); PT(g, 'k', 0xf2b233, [0, 3.55, 0], [0.5, 0.5, 0.5]);
      for (let k = 0; k < 14; k++) { const a = k * 2.4, y = 0.9 + (k * 0.37) % 2.3; PT(g, 'c', 0xd9901a, [Math.cos(a) * 0.9, y, Math.sin(a) * 0.9], [0.16, 0.03, 0.16], [Math.PI / 2, -a, 0]); }
      R.top = 3.8;
    },
    flower(g, R, st = {}) {   // 꽃 ≈ 1m — 줄기·잎·꽃잎 여섯·노란 가운데
      const c = st.color || 0xff8fb1; PT(g, 'c', 0x4caf50, [0, 0.45, 0], [0.04, 0.9, 0.04]);
      for (const sd of [-1, 1]) PT(g, 's', 0x5cbf60, [sd * 0.13, 0.35 + sd * 0.05, 0], [0.14, 0.02, 0.06], [0, 0, sd * 0.4]);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; PT(g, 's', c, [Math.cos(a) * 0.17, 0.92, Math.sin(a) * 0.17], [0.13, 0.035, 0.08], [0, -a, 0]); }
      PT(g, 's', 0xffd23c, [0, 0.95, 0], [0.09, 0.05, 0.09]); R.top = 1.05;
    },
    honey(g, R) { PT(g, 's', 0xf2a516, [0, 0.12, 0], [0.12, 0.12, 0.12], null, { transparent: true, opacity: 0.9 }); PT(g, 'c', 0xf2a516, [0, 0.23, 0], [0.06, 0.04, 0.06]); PT(g, 'c', 0x8b5a2b, [0, 0.27, 0], [0.07, 0.03, 0.07]); R.top = 0.32; },
    nyonyo(g, R, st = {}) {   // 뇨뇨(아이들 그림 말) ≈ 0.7m — 동그랗고 · 과일 색 · 머리 위 초록 새싹 · 점눈 · 웃음 · 팔다리는 선
      const c = st.color != null ? st.color : 0xfafafa, b = pivot(g, [0, 0, 0]); R.body = b;
      PT(b, 's', c, [0, 0.42, 0], [0.3, 0.29, 0.3]); PT(b, 'c', 0x4caf50, [0, 0.75, 0], [0.02, 0.09, 0.02]);
      for (const sd of [-1, 1]) PT(b, 's', 0x66bb6a, [sd * 0.07, 0.8, 0], [0.08, 0.02, 0.045], [0, 0, sd * 0.4]);
      for (const sd of [-1, 1]) PT(b, 's', 0x161616, [sd * 0.09, 0.48, -0.27], [0.03, 0.035, 0.02]);
      PT(b, 'b', 0x161616, [0, 0.38, -0.285], [0.1, 0.018, 0.01]); for (const sd of [-1, 1]) PT(b, 's', 0xff9aa2, [sd * 0.17, 0.39, -0.23], [0.04, 0.025, 0.01], null, { transparent: true, opacity: 0.7 });
      for (const sd of [-1, 1]) { PT(b, 'c', 0x2b2b2b, [sd * 0.33, 0.4, 0], [0.012, 0.16, 0.012], [0, 0, sd * 1.0]); PT(b, 'c', 0x2b2b2b, [sd * 0.1, 0.08, 0], [0.012, 0.16, 0.012]); }
      if (st.crown) { PT(b, 'c', 0xffd23c, [0, 0.72, 0], [0.13, 0.07, 0.13]); for (let k = 0; k < 5; k++) { const a = k * 1.2566; PT(b, 'k', 0xffd23c, [Math.cos(a) * 0.11, 0.8, Math.sin(a) * 0.11], [0.035, 0.08, 0.035]); } PT(b, 's', 0xe74c3c, [0, 0.74, -0.13], [0.025, 0.025, 0.025]); }
      R.top = 0.95; o9(g).hopper = true;
    },
    fairyK(g, R) {   // 키위(아이들 글) — 초록 옷·바지 · 긴 생머리 · 키위 머리핀 · 어깨에 분홍 만능 가위 · 반달눈 웃음 · 날개 없음
      PERSON(g, R, { top: 0x6ab04c, leg: 0x3e7d2c });
      PT(g, 's', 0x5a3a22, [0, 1.47, 0.03], [0.21, 0.17, 0.21]); PT(g, 'b', 0x5a3a22, [0, 1.15, 0.1], [0.34, 0.6, 0.08]);
      PT(g, 'c', 0x8bc34a, [0.17, 1.52, -0.05], [0.05, 0.015, 0.05], [0, 0, Math.PI / 2]); PT(g, 'c', 0x6d4c2f, [0.18, 1.52, -0.05], [0.055, 0.01, 0.055], [0, 0, Math.PI / 2]);
      const sc = pivot(g, [-0.2, 1.26, 0.02]); R.tool = sc; PT(sc, 'b', 0xff7eb6, [0, 0.12, 0], [0.025, 0.3, 0.025], [0, 0, 0.25]); PT(sc, 'b', 0xff7eb6, [0, 0.12, 0], [0.025, 0.3, 0.025], [0, 0, -0.25]); PT(sc, 't', 0xff7eb6, [0.04, -0.06, 0], [0.04, 0.04, 0.04]); PT(sc, 't', 0xff7eb6, [-0.04, -0.06, 0], [0.04, 0.04, 0.04]);
    },
    fairyC(g, R) {   // 체리(아이들 글) — 분홍 긴 양갈래 · 체리 머리 장식 · 분홍 아이돌 옷 · 마이크 · 작은 가방 · 날 때만 날개
      PERSON(g, R, { top: 0xff7eb6, leg: 0xf5cfa6, skirt: 0xff5fa2, shoe: 0xffffff });
      PT(g, 's', 0xff8fc8, [0, 1.47, 0.03], [0.21, 0.17, 0.21]); for (const sd of [-1, 1]) { PT(g, 'c', 0xff8fc8, [sd * 0.26, 1.15, 0.05], [0.07, 0.6, 0.07], [0, 0, sd * 0.15]); PT(g, 's', 0xd81b3c, [sd * 0.2, 1.55, 0.02], [0.05, 0.05, 0.05]); }
      const mic = pivot(R.arms[1], [0, -0.45, -0.06]); PT(mic, 'c', 0x333333, [0, 0.06, 0], [0.018, 0.14, 0.018]); PT(mic, 's', 0xc0c7cf, [0, 0.15, 0], [0.045, 0.045, 0.045]);
      PT(g, 'b', 0xd81b3c, [-0.22, 0.92, 0.05], [0.1, 0.12, 0.06]); PT(g, 's', 0xd81b3c, [-0.22, 1.0, -0.02], [0.03, 0.03, 0.03]);
      R.wings = [-1, 1].map(sd => { const w = pivot(g, [sd * 0.06, 1.15, 0.13]); PT(w, 's', 0xffc6e5, [sd * 0.3, 0.05, 0.05], [0.3, 0.2, 0.012], null, { transparent: true, opacity: 0.75 }); w.visible = false; return w; }); R.wingHide = true;
    },
    cloud(g, R, st = {}) {   // 초록 구름 판(위가 y 0 — 그 위를 걷는다) — 가장자리 뭉게뭉게
      const w = st.w || 40, d = st.d || 40; PT(g, 'b', 0x9ed86f, [0, -0.6, 0], [w, 1.2, d]);
      const n = Math.round((w + d) / 3); for (let k = 0; k < n * 2; k++) { const side = k % 4, f = ((k * 0.618) % 1), r = 2.2 + ((k * 0.37) % 1) * 1.6;
        const x = side < 2 ? -w / 2 + f * w : (side === 2 ? -w / 2 : w / 2), z = side < 2 ? (side === 0 ? -d / 2 : d / 2) : -d / 2 + f * d; PT(g, 's', k % 3 ? 0xb4e38c : 0xe9f7dd, [x, -1.1 - (k % 2) * 0.6, z], [r, r * 0.7, r]); }
      for (let k = 0; k < 10; k++) PT(g, 's', 0xe9f7dd, [-w / 2 + ((k * 0.73) % 1) * w, -2.4, -d / 2 + ((k * 0.41) % 1) * d], [5, 2, 5]);
    },
    castle(g, R) {   // 뇨뇨 왕의 성 — 크림 벽 · 분홍 뾰족 지붕 탑 넷 · 문 · 깃발
      PT(g, 'b', 0xfff1d6, [0, 2, 0], [8, 4, 6]); PT(g, 'b', 0xffe3b0, [0, 4.25, 0], [8.2, 0.5, 6.2]);
      for (const x of [-4, 4]) for (const z of [-3, 3]) { PT(g, 'c', 0xfff1d6, [x, 3, z], [1.1, 6, 1.1]); PT(g, 'k', 0xff6fa8, [x, 7.2, z], [1.4, 2.4, 1.4]); }
      PT(g, 'c', 0xfff1d6, [0, 4.8, 0], [1.6, 9.6, 1.6]); PT(g, 'k', 0xd81b60, [0, 10.8, 0], [2, 3, 2]); PT(g, 'c', 0x8b5a2b, [0, 12.8, 0], [0.06, 1.5, 0.06]); PT(g, 'b', 0x8fd16a, [0.4, 13.2, 0], [0.8, 0.5, 0.04]);
      PT(g, 'b', 0x8b5a2b, [0, 1.3, -3.02], [2, 2.6, 0.1]); PT(g, 's', 0xffd23c, [0, 3.2, -3.05], [0.6, 0.6, 0.1]);
      for (const x of [-2.6, 2.6]) PT(g, 'b', 0x9ad3ff, [x, 2.6, -3.03], [1, 1, 0.08]); R.top = 14;
    },
    stage(g, R) {   // 가장 큰 아이돌 공연장 — 분홍 무대 · 별 아치 · 조명 · 스피커
      PT(g, 'b', 0xff7eb6, [0, 0.5, 0], [10, 1, 5]); PT(g, 'b', 0xffffff, [0, 1.02, 0], [9.6, 0.04, 4.6]);
      for (const x of [-4.6, 4.6]) { PT(g, 'c', 0xb388ff, [x, 3.5, 2], [0.3, 6, 0.3]); PT(g, 'b', 0x2b2b2b, [x * 1.08, 1.8, -1.6], [1, 1.6, 0.8]); PT(g, 'c', 0x555555, [x * 1.08, 1.9, -2.02], [0.3, 0.05, 0.3], [Math.PI / 2, 0, 0]); }
      PT(g, 'b', 0xb388ff, [0, 6.5, 2], [9.6, 0.5, 0.3]); for (let k = 0; k < 9; k++) PT(g, 's', [0xffd23c, 0xff6fa8, 0x80deea][k % 3], [-4 + k, 6.2, 1.85], [0.18, 0.18, 0.18], null, { emissive: 0x553300 });
      PT(g, 'b', 0xffd23c, [0, 7.4, 2], [1.4, 1.4, 0.2], [0, 0, Math.PI / 4]); R.top = 8;
    },
    house(g, R, st = {}) {   // 집 — 벽·뾰족 지붕·문·창 (색 = st.color · 지붕 = st.roof)
      const c = st.color || 0xfff1d6, r = st.roof || 0x8bc34a, w = st.w || 5; PT(g, 'b', c, [0, 1.5, 0], [w, 3, w * 0.8]);
      const rf = PT(g, 'k', r, [0, 4.2, 0], [w * 0.78, 2.4, w * 0.78]); rf.geometry = FG.q; rf.rotation.y = Math.PI / 4;
      PT(g, 'b', 0x8b5a2b, [0, 0.95, -w * 0.4 - 0.02], [1, 1.9, 0.08]); for (const x of [-w * 0.3, w * 0.3]) PT(g, 'b', 0x9ad3ff, [x, 1.8, -w * 0.4 - 0.02], [0.9, 0.8, 0.06]);
      if (st.sign) PT(g, 's', st.sign, [0, 3.0, -w * 0.4 - 0.08], [0.45, 0.45, 0.08]); R.top = 5.6;
    },
    shop(g, R) {   // 상가 — 줄무늬 차양 가게 셋
      [[0xff6f61, -4], [0x4fc3f7, 0], [0xffd23c, 4]].forEach(([c, x]) => { PT(g, 'b', 0xfff1d6, [x, 0.6, 0], [3.4, 1.2, 1.4]); PT(g, 'b', 0xc79a6b, [x, 1.25, 0], [3.5, 0.1, 1.5]);
        for (const sd of [-1.6, 1.6]) PT(g, 'c', 0x8b5a2b, [x + sd, 1.6, 0.6], [0.06, 3.2, 0.06]); for (let k = 0; k < 4; k++) PT(g, 'b', k % 2 ? 0xffffff : c, [x - 1.3 + k * 0.87, 3.1, 0], [0.87, 0.12, 1.8], [0.35, 0, 0]);
        for (let k = 0; k < 4; k++) PT(g, 's', [0xe53935, 0xffb300, 0x8bc34a, 0xab47bc][k], [x - 1.1 + k * 0.7, 1.42, -0.2], [0.18, 0.18, 0.18]); }); R.top = 3.5;
    },
    bush(g, R) { for (let k = 0; k < 7; k++) { const a = k * 0.9; PT(g, 's', k % 2 ? 0x3f8f3f : 0x56a856, [Math.cos(a) * 0.45 * (k % 3), 0.55 + (k % 3) * 0.25, Math.sin(a) * 0.45 * (k % 2)], [0.55, 0.5, 0.55]); } for (let k = 0; k < 8; k++) PT(g, 'c', 0x2e7d32, [Math.cos(k) * 0.6, 1.3, Math.sin(k) * 0.6], [0.02, 0.7, 0.02], [Math.cos(k) * 0.5, 0, Math.sin(k) * 0.5]); R.top = 1.8; },
    tidy(g, R) { PT(g, 's', 0x5cbf60, [0, 0.45, 0], [0.5, 0.42, 0.5]); for (let k = 0; k < 6; k++) { const a = k * 1.047; PT(g, 's', [0xff8fb1, 0xffd23c, 0xffffff][k % 3], [Math.cos(a) * 0.42, 0.62, Math.sin(a) * 0.42], [0.08, 0.06, 0.08]); } R.top = 0.95; },
    portal(g, R, st = {}) { const c = st.color || 0x7cf0c4; const r = pivot(g, [0, 1.3, 0]); R.ring = r; PT(r, 't', c, [0, 0, 0], [1.1, 1.1, 1.1], null, { emissive: 0x1a6b55 }); PT(r, 'c', c, [0, 0, 0], [1.0, 0.02, 1.0], [Math.PI / 2, 0, 0], { transparent: true, opacity: 0.35, emissive: 0x1a6b55 }); R.top = 2.6; o9(g).spinner = true; },
    capy(g, R, st = {}) {   // 카피바라 ≈ 길이 1m — 통통한 갈색 몸 · 네모난 얼굴 · 작은 귀 · 짧은 다리
      const c = st.color || 0x9c6b3f; LEGS(g, R, [-0.18, 0.18], [-0.25, 0.25], 0.25, 0.22, 0x7a4f2a, 0.06);
      PT(g, 's', c, [0, 0.42, 0.05], [0.32, 0.27, 0.5]); const hd = pivot(g, [0, 0.55, -0.42]); R.head = hd;
      PT(hd, 'b', c, [0, 0, -0.05], [0.3, 0.26, 0.32]); PT(hd, 'b', 0x6d4524, [0, -0.04, -0.23], [0.24, 0.14, 0.04]); for (const sd of [-1, 1]) { PT(hd, 's', 0x161616, [sd * 0.13, 0.06, -0.12], [0.03, 0.03, 0.03]); PT(hd, 's', 0x7a4f2a, [sd * 0.11, 0.15, 0.06], [0.05, 0.04, 0.03]); }
      PT(hd, 's', 0x2b1a10, [0, 0.0, -0.25], [0.05, 0.025, 0.01]); R.top = 0.85;
      if (st.hat) PT(hd, 's', st.hat, [0, 0.19, 0.0], [0.1, 0.06, 0.1]);
    },
    potion(g, R, st = {}) { const c = st.color || 0x7cf0c4; PT(g, 's', c, [0, 0.12, 0], [0.11, 0.11, 0.11], null, { transparent: true, opacity: 0.85, emissive: 0x1a6b55 }); PT(g, 'c', 0xe0f7fa, [0, 0.25, 0], [0.04, 0.08, 0.04], null, { transparent: true, opacity: 0.6 }); PT(g, 'c', 0x8b5a2b, [0, 0.31, 0], [0.045, 0.04, 0.045]); R.top = 0.4; o9(g).spinner = true; },
    keeper(g, R, st = {}) { PERSON(g, R, { top: st.color || 0x8d7b4a, leg: st.leg || 0x5b4a2a }); PT(g, 's', st.cap || 0x2e7d32, [0, 1.52, 0], [0.21, 0.1, 0.21]); PT(g, 'b', st.cap || 0x2e7d32, [0, 1.52, -0.2], [0.24, 0.03, 0.14]); PT(g, 's', 0x3b2a14, [0, 1.45, 0.08], [0.2, 0.16, 0.16]); },
    pen(g, R, st = {}) {   // 카피바라 놀이터(동물원) — 나무 울타리 원 · 연못 · 건초 · 틈 하나(남쪽 — 탈출 장면)
      const r = st.r || 5; PT(g, 'c', 0x7cc4e8, [0.8, 0.03, 0.6], [r * 0.4, 0.05, r * 0.32]); PT(g, 'c', 0xd7b46a, [-r * 0.45, 0.25, -r * 0.3], [0.9, 0.5, 0.9]);
      for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; if (k === 7) continue; PT(g, 'c', 0x8b5a2b, [Math.cos(a) * r, 0.5, Math.sin(a) * r], [0.07, 1.0, 0.07]); const a2 = a + Math.PI / 28;
        if (k !== 6) for (const y of [0.4, 0.8]) PT(g, 'b', 0xa0703f, [Math.cos(a2) * r, y, Math.sin(a2) * r], [0.06, 0.08, r * 0.23], [0, -a2, 0]); }
      R.top = 1.2;
    },
    food(g, R) { PT(g, 'c', 0xd7ccc8, [0, 0.06, 0], [0.28, 0.12, 0.28]); for (let k = 0; k < 6; k++) { const a = k * 1.05; PT(g, 'c', k % 2 ? 0xff8f00 : 0x7cb342, [Math.cos(a) * 0.12, 0.15, Math.sin(a) * 0.12], [0.03, 0.18, 0.03], [0.5 * Math.cos(a), 0, 0.5 * Math.sin(a)]); } R.top = 0.3; },
  });
  Object.assign(MODEL, {
    water(g, R, st = {}) { PT(g, 'b', 0x5ab4f0, [0, 0.03, 0], [st.w || 10, 0.06, st.d || 1.2], null, { transparent: true, opacity: 0.85 }); for (let k = 0; k < 5; k++) PT(g, 'b', 0xd7f0ff, [(k - 2) * (st.w || 10) / 5, 0.065, ((k % 2) - 0.5) * 0.3], [0.8, 0.01, 0.06]); },
    tree(g, R, st = {}) { PT(g, 'c', 0x7a5230, [0, 1, 0], [0.18, 2, 0.18]); PT(g, 's', 0x5cbf60, [0, 2.4, 0], [1.3, 1.1, 1.3]); for (let k = 0; k < 7; k++) { const a = k * 0.9; PT(g, 's', st.fruit || 0xe53935, [Math.cos(a) * 1.05, 2.2 + (k % 3) * 0.3, Math.sin(a) * 1.05], [0.17, 0.17, 0.17]); } R.top = 3.6; },
    puff(g, R, st = {}) { const c = st.color || 0x7ab8ff; for (let k = 0; k < 6; k++) { const a = k * 1.05; PT(g, 's', c, [Math.cos(a) * 3.2, (k % 2) * 0.8, Math.sin(a) * 2.2], [3, 1.8, 3]); } PT(g, 's', c, [0, 0.8, 0], [4, 2.4, 4]); },
  });
  function o9(g) { return g.userData; }   // 모양이 정하는 기본 몸짓(fxMake가 읽음)
  function mergeStatic(g) {   // 움직이지 않는 큰 모양(성·무대·집·구름) = 색마다 메시 하나(그리기 수 줄임)
    g.updateMatrixWorld(true); const inv = new T3.Matrix4().copy(g.matrixWorld).invert(), M9 = new T3.Matrix4(), by = new Map();
    g.traverse(m => { if (!m.isMesh) return; const q = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); q.applyMatrix4(M9.multiplyMatrices(inv, m.matrixWorld)); const L = by.get(m.material) || []; L.push(q); by.set(m.material, L); });
    for (const c of [...g.children]) g.remove(c);
    for (const [mat, L] of by) { let n = 0; for (const q of L) n += q.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
      for (const q of L) { P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3); o += q.attributes.position.count; q.dispose(); }
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(P, 3)); geo.setAttribute('normal', new T3.BufferAttribute(N, 3)); geo.computeBoundingSphere(); FXDISP.push(geo); g.add(new T3.Mesh(geo, mat)); }
  }
  // 내 몸 = 모양(키위·체리·카피바라·뇨뇨) · 날기·달리기
  let BODY = null, PHYS = null, physT = 0;
  function setBody(kind, st = {}) {
    if (BODY) { FXROOT.remove(BODY.o.g); FX.delete('@body'); BODY = null; }
    if (!kind) { map.player.show(true); return; } if (kind === 'none') { map.player.show(false); return; }   // none = 안 보이는 몸(숨기 체리)
    map.player.show(false); const me = map.player.get(), base = st.bodyS || 1;
    const o = fxMake(kind, '@body', { x: me.x, y: me.y, z: me.z, h: me.h }, { s: base * SC, color: st.color }); if (!o) { map.player.show(true); return; }
    BODY = { o, base, lx: me.x, lz: me.z }; particles(me.x, me.y + 0.6 * SC, me.z, { color: st.glow || 0xfff4c2, n: 50, r: 0.5 * SC, swirl: 5, speed: 0.2 * SC, size: 0.07 * Math.sqrt(SC), life: 1.3 }); map.sfx('ding');
  }
  function applyPhys() { const o = PHYS || {}, s = SC;
    if (!PHYS && s >= 0.999) { map.player.scale(1); return; }
    map.player.scale(Math.min(s, 0.999), { speed: o.speed != null ? o.speed * Math.sqrt(s) : undefined, gravity: o.gravity != null ? o.gravity * Math.sqrt(s) : undefined, jump: o.jump != null ? o.jump * s : undefined, far: o.far }); }
  // 📖 세계 안내서(아이들 것 ✏️ · 더한 것 ✨ · 다음 이야기 씨앗 🌱)
  let bookEl = null, bookI = 0, bookDone = null;
  const BCSS = '#story-book{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);font:15px/1.5 "Apple SD Gothic Neo","Malgun Gothic",sans-serif}'
    + '#story-book .bk{width:min(760px,94vw);max-height:calc(100vh - 24px);display:flex;flex-direction:column;background:#fffdf3;border:4px solid #1d3557;border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,.4);overflow:hidden}'
    + '#story-book .hd{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#1d3557;color:#fff}#story-book .hd b{font-size:19px;flex:1}#story-book .hd span{font-size:13px;opacity:.85}'
    + '#story-book .pg{padding:14px 18px;overflow:auto;flex:1}#story-book h3{margin:0 0 8px;font-size:21px;color:#1d3557}#story-book .lg{font-size:13px;color:#5a6b80;margin-bottom:8px}'
    + '#story-book ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}#story-book li{padding:8px 11px;border-radius:12px;line-height:1.45;word-break:keep-all}'
    + '#story-book li.k{background:#e8f1ff;border-left:5px solid #3d7cf0}#story-book li.a{background:#f4ecff;border-left:5px solid #9b59b6}#story-book li.s{background:#eafbe8;border-left:5px solid #2f9e44}'
    + '#story-book li i{font-style:normal;font-weight:800;font-size:12px;margin-right:6px;opacity:.8}'
    + '#story-book .ft{display:flex;align-items:center;gap:8px;padding:10px 14px;border-top:2px solid #e3e8f0}#story-book .ft button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:8px 14px;min-height:44px;cursor:pointer;background:#e3ebf7;color:#1d3557}'
    + '#story-book .ft button.go{background:#1d3557;color:#fff}#story-book .dots{flex:1;text-align:center;font-size:13px;color:#5a6b80}#story-book .tabs{display:flex;flex-wrap:wrap;gap:5px;padding:8px 14px 0}#story-book .tabs button{font:inherit;font-size:13px;border:2px solid #c9d8f0;background:#fff;border-radius:999px;padding:3px 10px;min-height:32px;cursor:pointer}#story-book .tabs button.on{background:#fff3bf;border-color:#1d3557;font-weight:800}'
    + 'body.small #story-book .pg{padding:10px 12px}body.small #story-book h3{font-size:17px}body.small #story-book li{padding:6px 9px;font-size:13px}';
  function openBook(i = 0) { const B = D.book; if (!B || !B.pages || !B.pages.length) return Promise.resolve();
    if (!document.getElementById('story-book-css')) { const s9 = document.createElement('style'); s9.id = 'story-book-css'; s9.textContent = BCSS; document.head.appendChild(s9); }
    document.exitPointerLock?.(); map.player.freeze(true); bookI = Math.max(0, Math.min(B.pages.length - 1, +i || 0));
    if (!bookEl) { bookEl = document.createElement('div'); bookEl.id = 'story-book'; bookEl.className = 'ttl-keep'; document.body.appendChild(bookEl);
      bookEl.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-b]'); if (e.target === bookEl) return closeBook(); if (!b) return; const k = b.dataset.b; if (k === 'x') closeBook(); else if (k === 'p') drawBook(bookI - 1); else if (k === 'n') { if (bookI >= B.pages.length - 1) closeBook(); else drawBook(bookI + 1); } else drawBook(+k); }); }
    drawBook(bookI); map.sfx('tick'); return new Promise(res => { bookDone = res; }); }
  function drawBook(i) { const B = D.book, P = B.pages; bookI = Math.max(0, Math.min(P.length - 1, i)); const p = P[bookI], esc9 = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const TAG = { k: '✏️ 우리 생각', a: '✨ 더한 생각', s: '🌱 이야기 씨앗' };
    bookEl.innerHTML = '<div class="bk"><div class="hd"><b>📖 ' + esc9(B.title || '세계 안내서') + '</b><span>' + (bookI + 1) + ' / ' + P.length + '</span></div>'
      + '<div class="tabs">' + P.map((q, k) => '<button data-b="' + k + '"' + (k === bookI ? ' class="on"' : '') + '>' + esc9(q.icon || '') + ' ' + esc9(q.h) + '</button>').join('') + '</div>'
      + '<div class="pg"><h3>' + esc9(p.icon || '') + ' ' + esc9(p.h) + '</h3>' + (bookI === 0 ? '<div class="lg">✏️ = 우리 모둠이 판에 쓴 생각 · ✨ = 세계가 더 탄탄해지게 더한 생각 · 🌱 = 다음에 이야기로 만들어 볼 씨앗</div>' : '')
      + '<ul>' + (p.items || []).map(([k, t]) => '<li class="' + k + '"><i>' + TAG[k] + '</i>' + esc9(t) + '</li>').join('') + '</ul></div>'
      + '<div class="ft"><button data-b="p"' + (bookI ? '' : ' disabled') + '>◀ 앞</button><span class="dots">' + P.map((q, k) => (k === bookI ? '●' : '○')).join(' ') + '</span><button data-b="n" class="go">' + (bookI >= P.length - 1 ? '닫기 ✓' : '다음 ▶') + '</button><button data-b="x">✕</button></div></div>'; }
  function closeBook() { if (!bookEl) return; bookEl.remove(); bookEl = null; map.player.freeze(false); const d = bookDone; bookDone = null; if (d) d(); }
  const bookKey = e => { if (!bookEl) return; e.stopPropagation(); if (e.type !== 'keydown') return; e.preventDefault(); if (e.code === 'ArrowLeft') drawBook(bookI - 1); else if (e.code === 'ArrowRight') { if (bookI >= D.book.pages.length - 1) closeBook(); else drawBook(bookI + 1); } else if (['Escape', 'KeyE', 'Enter', 'Space'].includes(e.code)) closeBook(); };
  addEventListener('keydown', bookKey, true); addEventListener('keyup', bookKey, true);
  if (D.book && !LEG) map.hud.chip('st-b', '📖 ' + (D.book.chip || '세계 안내서'), { onClick: () => { if (!talk && !bookEl) openBook(0); } });
  async function worldStep(st) {
    if (st.setv) for (const [k, v] of Object.entries(st.setv)) VARS[k] = { i: 0, label: v && typeof v === 'object' ? (v[ME] ?? v._) : v };
    if (st.body !== undefined) setBody(st.body, st);
    if (st.phys !== undefined) { const prev = PHYS; PHYS = st.phys; applyPhys(); clearTimeout(physT); if (st.phys && st.phys.sec) physT = setTimeout(() => { if (!dead) { PHYS = st.phys.after !== undefined ? st.phys.after : prev; applyPhys(); if (st.phys.endMsg) map.hud.toast(st.phys.endMsg, 2.5); } }, st.phys.sec * 1000); }
    if (st.solid) for (const b of st.solid) map.collider.add({ x0: b[0], y0: b[1], z0: b[2], x1: b[3], y1: b[4], z1: b[5] });
    if (st.arena !== undefined) map.arena.set(st.arena === 'school' ? 'school' : st.arena ? { rect: st.arena, msg: st.arenaMsg || '여기서는 더 갈 수 없어요' } : null);   // null = 경계 없음(하늘 위 — 놀이 경계는 높이 12 m 아래만 받음) · 'school' = 원래 학교 경계
    if (st.wander) for (const id of [].concat(st.wander)) { const o = FX.get(id); if (o) o.wd = st.rect ? { r: st.rect, sp: st.speed || 0.6, tx: o.x, tz: o.z, wait: Math.random() * 1.5, y: st.fly ? o.y : null } : null; }
    if (st.follow) [].concat(st.follow).forEach((id, k) => { const o = FX.get(id); if (o) { o.fol = st.off ? null : { d: (st.d || 1.4), sp: st.speed || 3.5, k }; if (o.fol) o.wd = null; } });
    if (st.rain) { const c = whereOf(st.rain.at || 'me', {}); if (c) for (let k = 0; k < (st.rain.puffs || 6); k++) { const a = Math.random() * 6.28, r = Math.random() * (st.rain.r || 4); particles(c.x + Math.cos(a) * r, c.y + (st.rain.h || 3), c.z + Math.sin(a) * r, { color: st.rain.color || 0x6ec6ff, n: st.rain.n || 40, r: 1.2, fall: true, size: st.rain.size || 0.08, life: 2.2 }); } }
    if (st.tone) for (const a of st.tone) map.tone(...a);
    if (st.book != null) await openBook(st.book === true ? 0 : st.book);
  }
  const FXKEYS = ['setv', 'body', 'phys', 'solid', 'arena', 'wander', 'follow', 'rain', 'tone', 'book', 'fx', 'fxAnim', 'fxDel', 'hold', 'fxMove', 'morph', 'powder', 'glow', 'shrink', 'grow', 'grass', 'act', 'emote', 'circle', 'line', 'free', 'stay', 'time', 'fxShow', 'fxFace', 'banner', 'grassOff', 'dark', 'use', 'chase'];

  // ---------- 시작 ----------
  if (LEG) map.player.teleport([Pme.x, Pme.y, Pme.z], { h: 270 });
  else { const st = D.start || {}, at = st.at ? place(st.at) : null; if (at) map.player.teleport([at.x, at.y, at.z], { h: st.h ?? 0 }); }
  map.minimap.show();
  map.hud.banner('', 0.01);
  map.hud.chip('st', '📖 ' + D.title);
  let T = 0;
  (LEG ? run() : runSteps()).catch(e => { if (!gone()) { console.error('[이야기]', e); map.hud.toast('이야기에 문제가 생겼어요', 4); } });

  // ---------- 새 이야기 진행기(EP-1 · steps) — 글 파일만으로 이야기를 더한다(docs/tasks/new_episode.md) ----------
  //   자리(at·go·collect): '구역id'·'zone:구역'·'lm:표지점'·'spawn:…'·'npc:사람 이름'·[x, z]·[x, y, z]
  function place(t) {
    if (t && typeof t === 'object' && !Array.isArray(t)) t = t[ME] ?? t._;   // STORY-FX: 누가 되었는지(ME)에 따라 다른 자리 { 은규: …, 인우: …, _: 그 밖 }
    if (Array.isArray(t)) return t.length >= 3 ? { x: t[0], y: t[1], z: t[2] } : spot(t[0], t[1], 0);
    if (typeof t !== 'string') return null;
    if (t.startsWith('npc:')) return npcAt(t.slice(4));
    const r = map.resolve(/^(zone|lm|spawn|hot|door):/.test(t) ? t : 'zone:' + t); return r ? { x: r.x, y: r.y ?? 0, z: r.z } : null;
  }
  const RS = () => (SC < 1 ? Math.max(0.2, SC * 2.5) : 1);   // WORLD-FX: 작아지면 닿는 거리도 몸만큼
  function arrive(p, r) { r = r || 2.6 * RS(); return new Promise(res => { const h = map.trigger.add({ x: p.x, y: p.y ?? 0, z: p.z, r }, { once: true, enter: () => { h.remove(); res(); } }); }); }
  function world(ops) { return new Promise(res => { let ok = false; const fin = () => { if (!ok) { ok = true; res(); } };
    try { map.story.run([{ id: 'w' + Math.random().toString(36).slice(2, 8), do: ops }], { onDone: fin }); } catch (e) { console.error('[이야기] world', e); fin(); } setTimeout(fin, 8000); }); }
  async function collect(st) {   // 여러 곳 줍기 — 다 주우면 다음
    const pts = (st.collect || []).map(place).filter(Boolean), need = Math.min(st.n || pts.length, pts.length); let got = 0;
    const left = pts.slice(), G9 = () => (st.goal || (st.item || '물건') + ' 모으기') + ' (' + got + '/' + need + ')';
    objective(G9(), left[0], st.item);   // 목표 표시 = 아직 안 주운 곳(하나 주우면 다음 곳으로)
    await new Promise(res => pts.forEach(p => { const mkr = map.mk.marker(p.x, (p.y ?? 0) + 0.9, p.z, { color: 0xffc23c });
      const h = map.interact.add({ x: p.x, y: p.y ?? 0, z: p.z, r: st.r || 1.6 * RS(), label: (st.icon || '✨') + ' ' + (st.item || '줍기'), use: () => { if (talk) return; h.remove(); mkr.remove(); got++; map.sfx('ding');
        left.splice(left.indexOf(p), 1); if (got >= need) res(); else objective(G9(), left[0], st.item); } }); }));
  }
  function partyTick(dt) {
    if (!PARTY.length || partyHold || talk || (partyT -= dt) > 0) return; partyT = 0.2;
    const k = partyK++ % PARTY.length, n = PARTY[k], q = map.npc.get(n), me = map.player.get(); if (!q || q.walking) return;
    const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < 3.2 * SC) return;   // STORY-FX: 작아지면 거리·빠르기도 몸 크기만큼
    const hr = me.h * Math.PI / 180, fx = Math.sin(hr), fz = -Math.cos(hr), side = (k - (PARTY.length - 1) / 2) * 0.9 * SC, back = (1.6 + (k % 2) * 0.7) * SC, X = me.x - fx * back + fz * side, Z = me.z - fz * back - fx * side;
    const p = SC < 1 ? { x: X, y: (g => g != null && isFinite(g) ? g : me.y)(map.player.groundAt(X, Z, me.y + 0.4 * SC)), z: Z } : spot(X, Z, me.y), face = (Math.atan2(me.x - p.x, -(me.z - p.z)) * 180 / Math.PI + 360) % 360;
    map.npc.move(n, { x: p.x, y: p.y, z: p.z }, d > 24 * SC ? { face, ghost: true } : { walk: true, speed: 4.4 * Math.sqrt(SC), pass: true, face, ghost: true, maxExp: 6000, quiet: true, direct: SC < 1 });   // STORY-PERF: 길찾기 한도 6000(예전 60000 — 막힌 곳이면 크롬북에서 수백 ms) · 작으면 곧장
    if (SC < 1) map.npc.scale(n, partyScale);
  }
  function namesOf(w, ex) { if (w && typeof w === 'object' && !Array.isArray(w)) w = w[ME] ?? w._; return (w === 'party' ? PARTY.slice() : [].concat(w || [])).filter(n => n !== ME && !(ex && [].concat(ex).includes(n))); }   // STORY-FX: 내가 된 친구·except는 빼고
  async function runSteps(list = D.steps, top = true) {
    for (let i = 0; i < list.length; i++) {
      const st = list[i];
      if (gone() || S.done) return;
      if (st.goto) { const j = top ? list.findIndex(x => x.label === st.goto) : -1; if (j >= 0) { i = j; continue; } return { goto: st.goto }; }
      if (st.me) { const k = await panel('이야기', st.ask || '누가 될까요?', st.me.map(n => (WHO[n] || '🙂') + ' ' + n)); if (gone()) return;
        ME = st.me[k]; VARS.me = { i: k, label: ME }; map.npc.hide(ME); }
      if (st.party) { PARTY = st.party.filter(n => n !== ME); partyT = 0; }
      if (st.hide) for (const n of namesOf(st.hide)) map.npc.hide(n);
      if (st.tp) { const p = place(st.tp); if (p) map.player.teleport([p.x, p.y, p.z], st.h != null ? { h: st.h } : {}); partyT = 0; }
      if (st.npc && st.npc !== ME) { const p = place(st.to); if (p) { const pr = map.npc.move(st.npc, { x: p.x, y: p.y, z: p.z }, st.walk ? { walk: true, speed: st.speed || 3, pass: true, face: st.face, pose: st.npcPose } : { face: st.face, pose: st.npcPose }); if (st.until) await pr; } }   // STORY-FX: until = 도착까지 기다림 · npcPose = 도착 자세(앉기 등)
      if (st.appear) { const me = map.player.get(), hr = me.h * Math.PI / 180, b = st.behind || 1.8, p = spot(me.x - Math.sin(hr) * b, me.z + Math.cos(hr) * b, me.y);
        map.npc.move(st.appear, { x: p.x, y: p.y, z: p.z }, { face: (Math.atan2(me.x - p.x, -(me.z - p.z)) * 180 / Math.PI + 360) % 360 }); }
      if (st.pose) { const me = map.player.get(), hr = me.h * Math.PI / 180, fx = Math.sin(hr), fz = -Math.cos(hr), L9 = namesOf(st.who);
        L9.forEach((n, k) => { const q = map.npc.get(n);
          if (st.pose !== 'stand' && q && Math.hypot(q.x - me.x, q.z - me.z) > 3.5) { const side = (k - (L9.length - 1) / 2) * 0.85, ahead = 1.4 + (k % 2) * 0.7, p = spot(me.x + fx * ahead + fz * side, me.z + fz * ahead - fx * side, me.y);
            map.npc.move(n, { x: p.x, y: p.y, z: p.z }, { pose: st.pose, face: me.h, ghost: true }); }
          else map.npc.pose(n, st.pose); });
        partyHold = st.pose !== 'stand'; }
      if (FXKEYS.some(k => st[k] !== undefined)) { await fxStep(st); if (gone()) return; }   // null도 칸(body·phys·arena: null = 원래대로)   // STORY-FX: 무대 생물·소품·작아지기
      if (st.fade) await world([{ op: 'fade', sec: st.fade }]);
      if (st.sound) map.sfx(st.sound);
      if (st.chapter != null) chapter(st.chapter);
      if (st.world) await world(st.world);
      if (st.go) { const p = place(st.go); if (p) {
        if (st.secret) {   // 보물찾기: 빛기둥·지도 표시 없이 수수께끼만 — 오래 못 찾으면 그때 힌트와 표시
          objective(st.goal || '단서를 풀어 보세요', null);
          const tm = setTimeout(() => { if (!gone()) { map.hud.toast('💡 ' + (st.hint || '힌트: 조금 더 둘러보세요'), 6); objective(st.goal, p, st.label); } }, (st.hintAfter || 45) * 1000);
          await arrive(p, st.r); clearTimeout(tm); map.sfx('ding');
          if (st.find) {   // 방에 들어오면 구체적인 힌트 → 그 물건 앞에서 E(살펴보기) · 25초 못 찾으면 표시
            const f = place(st.find); if (f) {
              objective(st.findGoal || '🔍 이 근처를 살펴봐요', null); if (st.findSay) { if (!(await say(st.findSay))) return; }
              const tm2 = setTimeout(() => { if (!gone()) objective(st.findGoal, f, st.findLabel); }, (st.findAfter || 25) * 1000);
              await new Promise(res => { const fy = f.y ?? 0, off = map.interact.enable(q => q.kind !== 'game' && Math.hypot(q.x - f.x, q.z - f.z) < 2.9 && Math.abs((q.y || 0) - fy) < 2, false);   // 같은 자리 원래 행동(급식 받기 등)이 E를 먼저 잡지 않게
                const h = map.interact.add({ x: f.x, y: fy, z: f.z, r: 1.7, label: st.findLabel || '🔍 살펴보기', use: () => { if (talk) return; h.remove(); off.remove(); res(); } }); });
              clearTimeout(tm2); map.sfx('ding'); } }
        } else { objective(st.goal || '목표로 가요', p, st.label); await arrive(p, st.r); }
        objective(null); } }   // STORY-FX: 도착하면 목표 표시를 지움(지난 목적지 빛기둥·별이 남아 있던 것)
      if (st.talk) { const p = place('npc:' + st.talk) || place(st.at); if (p) { await talkTo(p, st.talk, st.goal || st.talk + '에게 말 걸기'); objective(null); } }
      if (st.collect) { await collect(st); objective(null); }
      if (gone()) return;
      if (st.say) { if (!(await say(st.say))) return; }
      if (st.note) await panel('쪽지', st.note);
      if (st.ask && !st.me) { const k = await choose(st.ask, st.choices || []); if (gone()) return; if (st.set) VARS[st.set] = { i: k, label: String((st.choices || [])[k] || '').replace(/^\S+\s/, '') };
        if (st.reply && st.reply[k]) { if (!(await say(st.reply[k]))) return; } }
      if (st.if) { const [k, v] = Object.entries(st.if)[0] || []; const hit = VARS[k] && VARS[k].i === v; const r = await runSteps(hit ? st.then || [] : st.else || [], false);
        if (r && r.goto) { const j = top ? list.findIndex(x => x.label === r.goto) : -1; if (j >= 0) { i = j; continue; } return r; } }
      if (st.toast) map.hud.toast(st.toast, 3);
      if (st.wait) await new Promise(r => setTimeout(r, st.wait * 1000));
      if (st.end) { S.done = true; map.hud.goal(null); objective(null); map.sfx('done'); ending(); return; }
    }
  }

  async function run() {
    for (const t of [].concat(D.intro)) { await panel('이야기', t); if (gone()) return; }
    // ---- 처음: 4학년 교실(아침) ----
    await talkTo(T4, '4학년 선생님', '4학년 선생님께 말 걸기 (E / ✋)'); if (gone()) return;
    if (!await say(D.p0)) return;
    S.role = await choose(D.roleAsk, D.roles); if (gone()) return;
    if (!await say(D.roleSay[S.role])) return;
    if (!await say(D.p0b)) return;
    // ---- 1장: 사라진 무지개 그림 ----
    chapter(1);
    await talkTo(T1, '1학년 선생님', '1학년 교실에 가서 1학년 선생님께 말 걸기'); if (gone()) return;
    if (!await say(D.c1)) return;
    await talkTo(P1, '1학년 동생', '1학년 동생에게 말 걸기'); if (gone()) return;
    if (!await say(D.c1kid)) return;
    // 크레파스 3개(본관 복도 → 현관) — 줍기는 자유, 끝에 동생이 알아챈다
    const CR = [[30.5, -33.0], [21.5, -33.2], [13.8, -30.2]], crH = [];
    const crayonMarks = () => { extra = CR.filter((c, i) => crH[i]).map(c => ({ x: c[0], z: c[1], color: '#ffd23c', r: 2 })); marks(); };
    CR.forEach((c, i) => { const n = nav.snap(c[0], 0, c[1], 2); if (n >= 0) { const p = nav.pos(n); c[0] = p[0]; c[1] = p[2]; }
      const mkr = map.mk.marker(c[0], 0.5, c[1], { color: [0xe74c3c, 0x2ecc71, 0x3498db][i] });
      const ih = map.interact.add({ x: c[0], y: 0, z: c[1], r: 1.6, label: '🎨 크레파스 줍기', use: () => { ih.remove(); mkr.remove(); crH[i] = null; S.crayons++; map.sfx('pick'); map.hud.toast(D.crayon + ' (' + S.crayons + '/3)'); map.hud.chip('st-c', '🎨 ' + S.crayons + '/3'); crayonMarks(); } });
      crH[i] = { ih, mkr }; });
    map.hud.chip('st-c', '🎨 0/3');
    const shoe = map.poi('hot:shoes:entrance-porch:1'), SH = shoe ? { x: shoe.x, y: shoe.y, z: shoe.z } : spot(12.5, -21.6);
    objective('현관 신발장 살펴보기 (가는 길에 크레파스 🎨 줍기)', SH, '현관 신발장');
    crayonMarks();
    await waitUse(SH, '🔍 신발장 살펴보기', 1.8); if (gone()) return;
    map.sfx('ding'); await map.note(D.shoeNote[0], D.shoeNote[1]); if (gone()) return;
    for (const h of crH) if (h) { h.ih.remove(); h.mkr.remove(); }   // 못 주운 크레파스는 여기서 치운다(동생이 알아챔 — 끝 화면에 수)
    extra = []; map.hud.chip('st-c', null);
    if (!await say(D.shoeSay)) return;
    // ---- 2장: 6학년 선배의 봉투 ----
    chapter(2);
    await talkTo(TL, '사서선생님', '도서실(서관 1층)에 가서 사서선생님께 말 걸기'); if (gone()) return;
    if (!await say(D.c2)) return;
    map.story.give('letter', { icon: '✉️', label: '6학년 선배의 봉투' });
    await map.note(D.letter[0], D.letter[1]); if (gone()) return;
    if (!await say(D.c2b)) return;
    const b6 = map.world.paint('board:grade6', { text: D.board6, color: '#7a2d9a' });
    const d6 = map.pois({ src: 'door' }).find(p => p.zones && p.zones.includes('grade6'));
    if (d6) map.world.door(d6.id).open();
    await talkTo(P6, '6학년 선배', '2층 6학년 교실에서 6학년 선배에게 말 걸기 (계단은 도서실 옆)'); if (gone()) return;
    if (!await say(D.c2c)) return;
    for (;;) {   // 칠판 수수께끼
      const a = await choose(D.quizAsk, D.quiz); if (gone()) return; S.quizTries++;
      if (a === D.quizOk) break;
      map.sfx('buzz'); if (!await say(D.quizNo)) return;
    }
    map.sfx('ding'); if (b6) b6.redraw({ text: D.board6.replace('( ? )', '초록 ✔'), color: '#1f8a4c' });
    map.npc.pose(A.senior, 'cheer', 180);
    if (!await say(D.quizYes)) return;
    S.gift = await choose(D.giftAsk, D.gifts); if (gone()) return;
    if (!await say(D.giftSay[S.gift])) return;
    if (S.gift === 0) map.story.give('ribbon', { icon: '🎀', label: '무지개 리본' });
    if (S.gift === 1) map.story.give('memo', { icon: '✏️', label: '응원 쪽지' });
    if (!await say(D.c2d)) return;
    map.npc.pose(A.senior, 'wave', 180);
    // 그림 들기(떨어뜨리면 다시 들 수 있음)
    const me = map.player.get(), pic = map.prop.spawn('note', me.x, me.y, me.z, { s: 1.6 });
    map.carry.pickable(pic, { label: '✋ 무지개 그림 들기' }); map.carry.pick(pic); map.hud.toast(D.pickedDrawing, 3);
    map.story.take('letter');
    // ---- 3장: 그림 돌려주기 ----
    chapter(3);
    objective('무지개 그림을 들고 1학년 동생에게 (1층 1학년 교실)', P1, '1학년 동생');
    await new Promise(res => map.carry.target({ x: P1.x, y: P1.y, z: P1.z, r: 1.8, accept: 'note', label: '🎁 그림 돌려주기', onPlace: p => { p.remove(); res(); } })); if (gone()) return;
    map.npc.pose(A.kid, 'cheer', 180);
    if (!await say(D.c3)) return;
    if (!await say(D.c3gift[S.gift])) return;
    if (!await say(D.c3crayon[S.crayons >= 3 ? 1 : 0])) return;
    map.story.take('ribbon'); map.story.take('memo');
    if (!await say(D.c3b)) return;
    map.world.paint('board:grade1', { text: D.board1, color: '#c0392b' });
    // ---- 4장: 체육관 준비 ----
    chapter(4);
    const gy = map.zone('gym'), gyY = gy.y ?? 0.1, stg = map.zone('gym-stage');
    map.world.light('gym', false);
    const dg = map.pois({ src: 'door' }).find(p => p.zones && p.zones.includes('gym') && p.zones.includes('gym-lobby'));
    const DG = dg ? { x: dg.x, z: dg.z } : { x: -51.5, z: -18.8 };
    if (dg) map.world.door(dg.id).open();
    const BT = spot(DG.x - 1.6, DG.z - 1.8, gyY, 'gym');
    objective('체육관으로 가서 불 켜기 단추 누르기', BT, '불 켜기 단추');
    await new Promise(res => { let on = false; map.world.spawn('button', { x: BT.x, y: BT.y, z: BT.z }, { label: '🔘 체육관 불 켜기', onUse: () => { if (on) return; on = true; map.world.light('gym', true); map.hud.toast('불이 켜졌어요!'); res(); } });
      map.trigger.add({ rect: [gy.x0, gy.z0, gy.x1, gy.z1], y0: gyY - 1, y1: gyY + 3 }, { enter: () => { if (!on) map.hud.toast(D.gymDark, 3); }, once: true }); }); if (gone()) return;
    await talkTo(TG, '체육선생님', '체육선생님께 말 걸기'); if (gone()) return;
    if (!await say(D.c4)) return;
    // 상자 3개: 창고 문 앞 → 무대 앞 표시 자리
    const ds = map.pois({ src: 'door' }).find(p => p.zones && p.zones.includes('gym') && p.zones.includes('gym-prep'));   // GYM-3: 창고 문이 없어져 체육관 준비실 문 앞에서
    const SX = ds ? ds.x - 2.2 : -53.7, SZ = ds ? ds.z : -11.8;
    const BX = [spot(SX, SZ - 1.2, gyY, 'gym'), spot(SX - 1.2, SZ, gyY, 'gym'), spot(SX, SZ + 1.2, gyY, 'gym')];
    const TX = [[TG.x - 4.2, TG.z + 2.1], [TG.x, TG.z + 2.6], [TG.x + 4.2, TG.z + 2.1]].map(([x, z]) => spot(x, z, gyY, 'gym'));
    let placed = 0; const tm = [];
    await new Promise(res => {
      BX.forEach(b => { const p = map.prop.spawn('box', b.x, b.y, b.z, { h: 90 }); map.carry.pickable(p, { label: '✋ 상자 들기' }); });
      TX.forEach((t, i) => { tm[i] = map.mk.marker(t.x, t.y + 0.9, t.z, { color: 0x2ecc71 });
        map.carry.target({ x: t.x, y: t.y, z: t.z, r: 1.3, accept: 'box', label: '📦 여기에 놓기', onPlace: () => { tm[i].remove(); placed++; map.hud.chip('st-c', '📦 ' + placed + '/3'); map.hud.goal(D.boxLeft + ' (' + placed + '/3)'); if (placed >= 3) res(); } }); });
      map.hud.chip('st-c', '📦 0/3'); objective(D.boxLeft + ' (0/3)', BX[1], '상자'); extra = TX.map(t => ({ x: t.x, z: t.z, color: '#2ecc71' })); marks();
    }); if (gone()) return;
    map.hud.chip('st-c', null); extra = []; objective(null);
    // 역할에 따라 세상이 바뀐다
    if (S.role === 0) {
      const cols = [0xff6b9d, 0x4fc3f7, 0xffd23c, 0x7bed9f, 0xa29bfe, 0xff9f43];
      TX.forEach((t, i) => { map.world.spawn('balloon', { x: t.x - 0.3, y: t.y + 0.8, z: t.z }, { color: cols[i * 2] }); map.world.spawn('balloon', { x: t.x + 0.3, y: t.y + 0.8, z: t.z }, { color: cols[i * 2 + 1] }); });
      if (stg) map.world.spawn('banner', { x: stg.cx - 4.2, z: stg.cz, y: stg.y ?? 1.1 }, { text: D.banner, h: 0 });
    } else {
      for (let i = 0; i < 4; i++) map.world.paint({ x: DG.x + 2.4 - i * 3.2, y: gyY, z: DG.z, w: 1.3, h: 1.6, floor: true, face: 90 }, { draw: drawArrow });
      const f1 = spot(DG.x - 1.4, DG.z - 2.4, gyY, 'gym'), f2 = spot(DG.x - 1.4, DG.z + 2.4, gyY, 'gym');
      map.world.spawn('flag', { x: f1.x, y: f1.y, z: f1.z }, { color: 0xff9f43 }); map.world.spawn('flag', { x: f2.x, y: f2.y, z: f2.z }, { color: 0x4fc3f7 });
    }
    map.sfx('done');
    if (!await say(D.c4role[S.role])) return;
    S.place = await choose(D.placeAsk, D.places); if (gone()) return;
    if (!await say(D.placeSay[S.place])) return;
    if (S.place === 0 && stg) map.world.paint({ x: stg.cx, y: (stg.y ?? 1.1) + 1.8, z: stg.z0 + 0.3, w: 2.6, h: 1.6, face: 180 }, { draw: drawRainbow });
    else map.world.paint({ x: gy.x1 - 0.2, y: gyY + 1.7, z: (DG.z + (ds ? ds.z : DG.z + 7)) / 2, w: 2.2, h: 1.4, face: 270 }, { draw: drawRainbow });
    // ---- 마지막 장: 함께 놀이 날(노을) ----
    const fd = map.fade(1.8, '#fff3e0');   // 가장 밝을 때(0.9초) 자리를 바꾼다
    await new Promise(r => setTimeout(r, 950)); if (gone()) return;
    {
      map.time('sunset');
      const row = [['4학년 선생님', -4.2], [A.friend, -2.1], [A.kid, 0], [A.senior, 2.1], ['1학년 선생님', 4.2]];
      for (const [n, dx] of row) { const p = spot(TG.x + dx, TG.z + 5.2, gyY, 'gym'); map.npc.move(n, { x: p.x, y: p.y, z: p.z }, { pose: 'stand', face: 180 }); }
      map.npc.pose('체육선생님', 'cheer', 180);
      const pp = spot(TG.x, TG.z + 10, gyY, 'gym'); map.player.teleport([pp.x, pp.y, pp.z], { h: 0 });
    }
    await fd; if (gone()) return;
    chapter(5);
    for (const [who, text] of D.end) {
      const n = who === '반 친구' ? A.friend : who === '1학년 동생' ? A.kid : who === '6학년 선배' ? A.senior : null;
      if (n) map.npc.pose(n, 'wave', 180);
      await panel(who, text); if (gone()) return;
    }
    for (const n of [A.friend, A.kid, A.senior, '4학년 선생님', '1학년 선생님']) map.npc.pose(n, 'cheer', 180);
    S.done = true; map.sfx('done'); ending();
  }

  // ---------- 끝 화면 ----------
  let endEl = null;
  function ending() {
    map.hud.goal(null); document.exitPointerLock?.(); map.player.freeze(true);
    endEl = mk('div', 'sp'); endEl.id = 'story-end';
    const E9 = LEG ? null : (D.steps.find(x => x.end) || {}).end || {};
    mk('div', 'story-rb', null, endEl); mk('h2', '', LEG ? D.endTitle : E9.title || D.title, endEl); mk('div', 'b', fill(LEG ? D.endBody : E9.body || ''), endEl);
    if (!LEG && Array.isArray(E9.list) && E9.list.length) { mk('div', 'b', E9.listTitle || '', endEl).style.cssText = 'font-weight:800;margin-top:10px;text-align:left';
      const ul2 = mk('ul', '', null, endEl); ul2.style.cssText = 'text-align:left;max-height:34vh;overflow:auto;font-size:14px;line-height:1.5'; for (const t of E9.list) mk('li', '', t, ul2); }
    const ul = mk('ul', '', null, endEl);
    for (const t of (LEG ? ['🎭 맡은 일: ' + D.roleName[S.role], '🎨 주운 크레파스: ' + S.crayons + ' / 3', '🎁 그림 돌려준 방법: ' + D.giftName[S.gift], '📌 그림 건 곳: ' + D.placeName[S.place]] : []).concat(['⏱ 걸린 시간: ' + fmt(T)])) mk('li', '', t, ul);
    const rw = mk('div', 'rw', null, endEl);
    const again = mk('button', '', '🔁 처음부터', rw), quit = mk('button', 'sub', '끝내기', rw);
    again.addEventListener('click', e => { e.stopPropagation(); setTimeout(() => window.SD2?.map?.game?.load('story', { ep: EP.id }), 0); });
    quit.addEventListener('click', e => { e.stopPropagation(); map.quit(); });
    setTimeout(() => { try { again.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);
  }

  return {
    tick(dt) {
      if (!S.done) T += dt;
      if (!LEG) { partyTick(dt); fxTick(dt); }
      if (trail && (trailT -= dt) <= 0) clearTrail();
    },
    stop() { dead = true; fxStop(); removeEventListener('keydown', onKey, true); removeEventListener('click', onClick, true); ui.remove(); talk = null; },   // 지점·표식·칩·목표·미니맵·사람·소품·그림·불·문·시간대는 범위 파사드가 정리
    // 시험용 읽기
    get state() { return { ...S, T, talk: talk ? talk.el.querySelector('.nm').textContent : null, choices: talk ? talk.n : 0, goal: cur && cur.label, tgt: cur ? [cur.x, cur.y, cur.z] : null, sc: SC, fx: [...FX.keys()], end: !!endEl }; },
    next(i = 0) { if (talk) talk.next(i); },
    get pos() { return { P4, P1, P6, T4, T1, TL, TG, Pme }; },
  };
}
