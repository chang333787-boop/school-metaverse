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
  let D = null, WHO = {};
  try { const m = await import(new URL('./story_data.js?v=' + DATA_V, import.meta.url)); D = m.STORY; WHO = m.WHO || {}; }
  catch (e) { console.error('[이야기] story_data.js를 읽지 못했어요', e); }
  if (gone()) return {};
  if (!D) { map.hud.banner('', 0.01); map.hud.toast('이야기 글 파일(story_data.js)을 읽지 못했어요', 6); map.player.freeze(false); return {}; }
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
  map.npc.move(A.friend, { x: P4.x, y: P4.y, z: P4.z }, { pose: 'stand', face: 90, sign: false });
  map.npc.move(A.kid, { x: P1.x, y: P1.y, z: P1.z }, { pose: 'stand', face: 180, sign: false });
  map.npc.move(A.senior, { x: P6.x, y: P6.y, z: P6.z }, { pose: 'stand', face: 180, sign: false });
  const board4 = map.world.paint('board:grade4', { text: D.board4, color: '#1c4096' });
  const T4 = npcAt('4학년 선생님'), T1 = npcAt('1학년 선생님'), TL = npcAt('사서선생님'), TG = npcAt('체육선생님');

  // ---------- 이야기 창 ----------
  let css = document.getElementById('story-css'); if (!css) { css = document.createElement('style'); css.id = 'story-css'; css.textContent = CSS; document.head.appendChild(css); }
  const ui = document.createElement('div'); ui.id = 'story-ui'; document.body.appendChild(ui);
  const mk = (tag, cls, txt, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (parent || ui).appendChild(e); return e; };
  const fill = t => String(t).replace('{role}', D.roleName[S.role] || '').replace('{place}', D.placeName[S.place] || '').replace('{gift}', D.giftName[S.gift] || '');
  let talk = null;   // { el, next(i), openedAt, n }
  function panel(who, text, choices) {   // → Promise<보기 번호 | 0(다음)>
    return new Promise(res => {
      if (talk) talk.el.remove();
      document.exitPointerLock?.(); map.player.freeze(true);
      const el = mk('div', 'sp'); el.id = 'story-talk';
      mk('div', 'av', WHO[who] || '💬', el); const bd = mk('div', 'bd', null, el);
      mk('div', 'nm', who, bd); mk('div', 'tx', fill(text), bd);
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
  // 창이 열린 동안: E·Enter·Space = 다음(보기 창이면 1~3) · 화면 클릭 = 포인터 잠금 안 함
  const onKey = e => {
    if (talk) {
      const k = e.code;
      if (!talk.n && ['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(k)) { e.stopPropagation(); e.preventDefault(); if (!e.repeat && performance.now() - talk.openedAt > 200) talk.next(0); return; }
      if (talk.n) { const n = Number(e.key); if (n >= 1 && n <= talk.n) { e.stopPropagation(); talk.next(n - 1); return; } if (k === 'KeyE' || k === 'Space') { e.stopPropagation(); e.preventDefault(); } }
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
  const chapter = n => { S.ch = n; map.hud.chip('st', '📖 ' + (D.chapters[n] || D.title)); if (n) map.hud.banner(D.chapters[n], 2.4); map.sfx('go'); };
  map.hud.chip('st-h', '💡 길 안내 (H)', { onClick: guide });
  // 말 걸기 자리 → Promise(눌렀을 때)
  //   그동안 가까운 원래 지점(칠판 낙서·신발장·앉기…)은 끈다 — 선생님이 칠판 앞에 서 있어 '칠판에 낙서하기'가 먼저 잡히던 것
  const waitUse = (p, label, r = 2.3) => new Promise(res => { const y = p.y ?? 0;
    const off = map.interact.enable(q => q.kind !== 'game' && Math.hypot(q.x - p.x, q.z - p.z) < r + 1.2 && Math.abs((q.y || 0) - y) < 2, false);
    const h = map.interact.add({ x: p.x, y, z: p.z, r, label, use: () => { if (talk) return; h.remove(); off.remove(); res(); } }); });
  const talkTo = (p, name, text) => { objective(text, p, name); return waitUse(p, '💬 ' + name + '에게 말 걸기'); };

  // ---------- 시작 ----------
  map.player.teleport([Pme.x, Pme.y, Pme.z], { h: 270 });
  map.minimap.show();
  map.hud.banner('', 0.01);
  map.hud.chip('st', '📖 ' + D.title);
  let T = 0;
  run().catch(e => { if (!gone()) { console.error('[이야기]', e); map.hud.toast('이야기에 문제가 생겼어요', 4); } });

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
      const ih = map.interact.add({ x: c[0], y: 0, z: c[1], r: 1.6, label: '🖍 크레파스 줍기', use: () => { ih.remove(); mkr.remove(); crH[i] = null; S.crayons++; map.sfx('pick'); map.hud.toast(D.crayon + ' (' + S.crayons + '/3)'); map.hud.chip('st-c', '🖍 ' + S.crayons + '/3'); crayonMarks(); } });
      crH[i] = { ih, mkr }; });
    map.hud.chip('st-c', '🖍 0/3');
    const shoe = map.poi('hot:shoes:entrance-porch:1'), SH = shoe ? { x: shoe.x, y: shoe.y, z: shoe.z } : spot(12.5, -21.6);
    objective('현관 신발장 살펴보기 (가는 길에 크레파스 🖍 줍기)', SH, '현관 신발장');
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
    const ds = map.pois({ src: 'door' }).find(p => p.zones && p.zones.includes('gym') && p.zones.includes('gym-store'));
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
    mk('div', 'story-rb', null, endEl); mk('h2', '', D.endTitle, endEl); mk('div', 'b', fill(D.endBody), endEl);
    const ul = mk('ul', '', null, endEl);
    for (const t of ['🎭 맡은 일: ' + D.roleName[S.role], '🖍 주운 크레파스: ' + S.crayons + ' / 3', '🎁 그림 돌려준 방법: ' + D.giftName[S.gift], '🖼 그림 건 곳: ' + D.placeName[S.place], '⏱ 걸린 시간: ' + fmt(T)]) mk('li', '', t, ul);
    const rw = mk('div', 'rw', null, endEl);
    const again = mk('button', '', '🔁 처음부터', rw), quit = mk('button', 'sub', '끝내기', rw);
    again.addEventListener('click', e => { e.stopPropagation(); setTimeout(() => window.SD2?.map?.game?.load('story'), 0); });
    quit.addEventListener('click', e => { e.stopPropagation(); map.quit(); });
    setTimeout(() => { try { again.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);
  }

  return {
    tick(dt) {
      if (!S.done) T += dt;
      if (trail && (trailT -= dt) <= 0) clearTrail();
    },
    stop() { dead = true; removeEventListener('keydown', onKey, true); removeEventListener('click', onClick, true); ui.remove(); talk = null; },   // 지점·표식·칩·목표·미니맵·사람·소품·그림·불·문·시간대는 범위 파사드가 정리
    // 시험용 읽기
    get state() { return { ...S, T, talk: talk ? talk.el.querySelector('.nm').textContent : null, choices: talk ? talk.n : 0, goal: cur && cur.label, end: !!endEl }; },
    next(i = 0) { if (talk) talk.next(i); },
    get pos() { return { P4, P1, P6, T4, T1, TL, TG, Pme }; },
  };
}
