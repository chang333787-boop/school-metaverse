// 드래곤 책 — 손으로 쓴 공책 결 · 종마다 왼쪽 그림·이름·책의 한 줄('매우 위험 · 보이면 처치' + 빨간 X 도장) / 오른쪽 관찰 칸(연필 글이 하나씩 X를 덮음)
// 열기 = 구석 책 그림을 누름(키 X) · 그리기 놀이(3장 나이트 퓨리 칸 · 점 여섯 잇기) · 쉬움에서 빠진 도전은 flash(쪽 하나 4초)
// 피시레그 숫자는 reference 0의 15번(1편) · 책의 반 이름·일곱 반 체계는 쓰지 않음(후속)
import { ICONS } from './art.js?v=17';

const INK = '#2b2118';
export const PAGES = [
  { key: 'joke', name: '버크', line: '버크 달력엔 날씨가 둘 — 눈, 그리고 덜 녹은 눈.', joke: true },
  { key: 'nightfury', name: '나이트 퓨리', line: '알 수 없음. 마주치면 숨어서 기도하라.', unknown: true },
  { key: 'gronckle', name: '그롱클', line: '매우 위험. 보이면 처치.', fl: '턱 힘 8' },
  { key: 'nadder', name: '데들리 내더', line: '매우 위험. 보이면 처치.', fl: '속도 8 · 방어 16' },
  { key: 'zippleback', name: '히디어스 지플백', line: '매우 위험. 보이면 처치.', fl: '은신 11 × 2' },
  { key: 'nightmare', name: '몬스트러스 나이트메어', line: '매우 위험. 보이면 처치.', fl: '화력 15' },
  { key: 'terror', name: '테러블 테러', line: '매우 위험. 보이면 처치.', fl: '공격 8 · 독 12' },
  { key: 'scauldron', name: '스콜드런', line: '끓는 물을 뿜는다. 보이면 처치.', bookOnly: true },
  { key: 'nest', name: '둥지(내가 쓴 쪽)', line: '책에 없는 쪽 — 내가 직접 보고 씀', mine: true },
  { key: 'boss', name: '대장 드래곤(내가 쓴 쪽)', line: '책에 없는 드래곤 — 내가 직접 보고 씀', mine: true },
];
/* 종 그림 — 손그림 실루엣(우리 모양 · 영화 그림 X) */
const DRAW = {
  nightfury: '<path d="M20 120 C50 92 90 86 120 92 L170 60 L150 96 C175 100 205 112 230 140 C200 130 170 128 140 130 C110 134 70 140 20 120 Z" fill="#2a2d33"/><path d="M118 92 L95 40 L150 70 Z" fill="#3a3d44"/><circle cx="196" cy="118" r="4" fill="#a6e05a"/>',
  gronckle: '<ellipse cx="120" cy="115" rx="70" ry="45" fill="#8a7a52"/><path d="M110 75 L95 50 L135 70 Z" fill="#6a5a3a"/><ellipse cx="190" cy="110" rx="26" ry="22" fill="#8a7a52"/><path d="M50 120 C30 120 20 135 28 150" stroke-width="10" stroke="#8a7a52"/>',
  nadder: '<path d="M30 130 C60 100 110 95 150 100 L205 85 L185 110 C170 118 150 125 120 130 C90 136 60 138 30 130 Z" fill="#5f8a9a"/><path d="M150 100 L165 60 L175 92 L190 55 L192 88" fill="#e2c35a"/><path d="M40 128 L20 110 L32 130 L12 125" fill="#e2c35a"/>',
  zippleback: '<ellipse cx="110" cy="130" rx="55" ry="25" fill="#6a8a5a"/><path d="M140 120 C170 100 180 70 210 60" stroke-width="12" stroke="#6a8a5a"/><path d="M140 130 C175 120 195 100 225 98" stroke-width="12" stroke="#6a8a5a"/><path d="M60 135 C40 140 25 150 15 165" stroke-width="8" stroke="#6a8a5a"/>',
  nightmare: '<path d="M20 140 C60 130 90 120 120 110 C150 100 170 80 200 70 L225 60 L210 85 C190 100 170 120 140 135 C100 150 60 152 20 140 Z" fill="#a8543a"/><path d="M110 112 L60 30 L160 95 Z" fill="#8a3a2a"/><path d="M205 66 L215 40 M212 72 L235 55" stroke-width="4"/>',
  terror: '<ellipse cx="120" cy="125" rx="28" ry="18" fill="#7a8a4a"/><circle cx="150" cy="115" r="12" fill="#7a8a4a"/><path d="M95 125 C80 130 70 135 60 145" stroke-width="5" stroke="#7a8a4a"/><path d="M118 112 L105 92 L130 108 Z" fill="#5a6a3a"/>',
  nest: '<path d="M20 170 C60 90 100 60 125 60 C150 60 190 90 230 170 Z" fill="#6a5a58"/><path d="M105 62 C112 40 138 40 145 62" stroke="#a8543a" stroke-width="5"/><path d="M60 120 L70 110 M180 120 L170 110" stroke-width="3"/>',
  boss: '<path d="M10 160 C40 90 90 70 130 72 C170 74 210 100 240 160 Z" fill="#5a4a48"/><circle cx="120" cy="100" r="3" fill="#e8dcc0"/><circle cx="132" cy="98" r="3" fill="#e8dcc0"/><circle cx="144" cy="100" r="3" fill="#e8dcc0"/>',
  scauldron: '<path d="M30 140 C70 120 120 110 170 112 L215 100 L200 122 C170 130 120 140 30 140 Z" fill="#6a8aa8"/><path d="M215 100 C230 96 238 90 240 80" stroke="#7fb0c8" stroke-dasharray="4 4"/>',
  joke: '<path d="M30 150 L80 90 L120 120 L160 70 L220 150 Z" fill="#e8e4dc" stroke-width="2"/><path d="M60 60 L62 66 M90 40 L92 46 M150 35 L152 41 M190 55 L192 61" stroke="#9aa6ae"/>',
};
const CSS = `
#book-btn { position:fixed; right:14px; bottom:14px; z-index:25; width:60px; height:60px; padding:6px; background:#f4ead2; border:2px solid #2b2118; border-radius:12px 16px 10px 18px; cursor:pointer; pointer-events:auto; }
#book-btn svg { width:100%; height:100%; } #book-btn.new::after { content:''; position:absolute; right:-6px; top:-6px; width:14px; height:14px; border-radius:50%; background:#a83e1e; border:2px solid #2b2118; }
#book { position:fixed; inset:0; z-index:30; display:flex; align-items:center; justify-content:center; background:rgba(20,26,32,.55); pointer-events:auto; }
#book .sp { display:flex; width:min(920px,96vw); height:min(560px,86vh); background:#efe2c4; border:3px solid #2b2118; border-radius:10px 18px 12px 16px; position:relative; }
#book .pg { flex:1; padding:22px 26px; position:relative; color:#2b2118; overflow:hidden; }
#book .pg + .pg { border-left:2px dashed #b9a47c; }
#book h2 { margin:0 0 6px; font-size:28px; } #book .ln { font-size:18px; margin:6px 0; }
#book .stamp { position:absolute; left:30px; top:150px; width:220px; height:220px; opacity:.75; pointer-events:none; }
#book .cell { font-size:18px; margin:9px 0; padding:6px 8px; border-bottom:1px solid #c9b894; display:flex; gap:10px; align-items:center; }
#book .cell b { width:70px; flex:none; } #book .cell .pen { font-family:"Nanum Pen Script","Comic Sans MS",cursive; font-size:21px; color:#3a3a6a; }
#book .fl { font-size:16px; color:#6a5a48; margin-top:6px; }
#book .nav { position:absolute; bottom:10px; left:0; right:0; display:flex; justify-content:space-between; padding:0 16px; }
#book button { font:inherit; font-size:18px; padding:4px 14px; background:#f4ead2; border:2px solid #2b2118; border-radius:10px; cursor:pointer; }
#book canvas { position:absolute; left:20px; top:90px; width:calc(100% - 40px); height:calc(100% - 140px); }
#book .gone, #book.gone, #book-btn.gone { display:none; }
`;

export function createBook(G) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const btn = document.createElement('div'); btn.id = 'book-btn'; btn.className = 'gone'; btn.innerHTML = ICONS.book; document.body.appendChild(btn);
  const el = document.createElement('div'); el.id = 'book'; el.className = 'gone'; document.body.appendChild(el);
  const B = {
    open: false, page: 1, have: false,
    notes: {},            // 종 → { likes, hates, sign, weak, other } (연필 글)
    sketch: {},           // 종 → true(내 그림이 X를 덮음)
    seen: new Set(['joke', 'gronckle', 'nadder', 'zippleback', 'nightmare', 'terror', 'scauldron', 'nightfury']),
    draw: null,           // 그리기 놀이 상태
  };
  btn.onclick = () => (B.open ? B.close() : B.show());
  B.give = () => { B.have = true; btn.classList.remove('gone'); };
  /* 연필 글 — 관찰로 칸이 채워짐(배너로 알림) */
  B.note = (sp, cell, text, banner = true) => {
    const n = B.notes[sp] || (B.notes[sp] = {}); if (n[cell] === text) return; n[cell] = text;
    btn.classList.add('new');
    if (banner && G.hud) G.hud.banner('드래곤 책 · ' + (PAGES.find((p) => p.key === sp) || { name: sp }).name + ' — ' + text, 'book', 3.5);
    if (B.open) render();
  };
  B.stars = (sp) => { const n = B.notes[sp] || {}; return Object.keys(n).length + (B.sketch[sp] ? 1 : 0); };
  B.state = () => ({ notes: B.notes, sketch: B.sketch, have: B.have });
  B.load = (s) => { if (!s) return; B.notes = s.notes || {}; B.sketch = s.sketch || {}; if (s.have) B.give(); };
  const CELLS = [['likes', '좋아함'], ['hates', '싫어함'], ['sign', '신호'], ['weak', '약점'], ['other', '알게 된 것']];
  function render() {
    const p = PAGES[B.page], n = B.notes[p.key] || {}, covered = Object.keys(n).length > 0 || B.sketch[p.key];
    const left = `<div class="pg"><h2>${p.name}</h2><div class="ln" style="${covered && !p.joke ? 'text-decoration:line-through;opacity:.6' : ''}">${p.line}</div>${p.fl ? `<div class="fl">피시레그가 외는 숫자: ${p.fl}</div>` : ''}
      <svg viewBox="0 0 250 200" style="width:100%;height:58%;margin-top:6px" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round">${p.unknown && !B.sketch.nightfury ? '<text x="125" y="110" text-anchor="middle" font-size="28" fill="#8a7a62" stroke="none">?</text>' : (DRAW[p.key] || '')}</svg>
      ${!p.joke && !p.mine && !covered ? `<svg class="stamp" viewBox="0 0 32 32">${ICONS.x.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>` : ''}${p.bookOnly ? '<div class="fl">(책에만 나오는 드래곤)</div>' : ''}</div>`;
    const right = p.joke ? `<div class="pg"><div class="ln" style="margin-top:40px;font-size:22px">${p.line}</div><div class="fl">— 히컵의 낙서</div></div>`
      : `<div class="pg"><h2 style="font-size:20px">내가 본 것</h2>${CELLS.map(([k, t]) => `<div class="cell"><b>${t}</b><span class="pen">${n[k] || ''}</span></div>`).join('')}</div>`;
    el.innerHTML = `<div class="sp">${left}${right}<div class="nav"><button data-a="prev">◀</button><button data-a="close">닫기</button><button data-a="next">▶</button></div></div>`;
    el.querySelectorAll('button').forEach((b) => { b.onclick = () => { const a = b.dataset.a; if (a === 'close') B.close(); else { B.page = (B.page + (a === 'next' ? 1 : PAGES.length - 1)) % PAGES.length; render(); } }; });
  }
  B.show = (key) => { if (key) B.page = Math.max(0, PAGES.findIndex((p) => p.key === key)); B.open = true; btn.classList.remove('new'); el.classList.remove('gone'); render(); if (G.player) G.player.lock = true; };
  B.close = () => { B.open = false; el.classList.add('gone'); if (G.player && !B.draw) G.player.lock = false; };
  /* 쉬움에서 빠진 도전 — 그 장면을 책 한 쪽으로 4초 */
  B.flash = (pg) => {
    if (!pg) { el.classList.add('gone'); B.open = false; return; }
    el.innerHTML = `<div class="sp"><div class="pg"><h2>${pg.title || ''}</h2><svg viewBox="0 0 250 200" style="width:100%;height:70%" stroke="${INK}" stroke-width="2" fill="none">${DRAW[pg.draw] || ''}</svg></div><div class="pg"><div class="ln" style="margin-top:60px;font-size:22px">${pg.line || ''}</div></div></div>`;
    el.classList.remove('gone'); B.open = true;
  };
  /* 그리기 놀이(3장 ③) — 점 여섯을 차례로 잇기 · 펜 = 끌기(터치패드·마우스) 또는 방향키 · F 누르는 동안 잉크 · 쉬움 = 다음 점으로 당김 */
  B.startDraw = (easy) => {
    B.show('nightfury');
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 560; el.querySelector('.pg').appendChild(cv);
    const X = cv.getContext('2d');
    const dots = [[90, 360], [230, 300], [330, 180], [430, 300], [600, 270], [720, 380]];     // 꼬리 → 몸 → 날개 끝 → 몸 → 머리
    B.draw = { cv, X, dots, k: 1, pen: { x: dots[0][0], y: dots[0][1] }, ink: [], easy, done: false, t: 0 };
    redraw();
    return B.draw;
  };
  function redraw() {
    const D = B.draw; if (!D) return; const X = D.X;
    X.clearRect(0, 0, 800, 560);
    X.lineWidth = 6; X.lineCap = 'round'; X.strokeStyle = '#2b2118';
    if (D.ink.length > 1) { X.beginPath(); X.moveTo(D.ink[0][0], D.ink[0][1]); for (const q of D.ink) { if (q[2]) X.moveTo(q[0], q[1]); else X.lineTo(q[0], q[1]); } X.stroke(); }
    D.dots.forEach(([x, y], i) => { X.fillStyle = i < D.k ? '#2b2118' : '#f4ead2'; X.beginPath(); X.arc(x, y, 14, 0, 7); X.fill(); X.lineWidth = 3; X.stroke(); if (D.easy || i === D.k) { X.fillStyle = '#a83e1e'; X.font = 'bold 22px sans-serif'; X.fillText(String(i + 1), x + 14, y - 16); } });
    X.fillStyle = '#a83e1e'; X.beginPath(); X.arc(D.pen.x, D.pen.y, 7, 0, 7); X.fill();
  }
  /* 걸음마다 — 펜 움직임(I = 입력) · 끝나면 true */
  B.drawStep = (dt, I) => {
    const D = B.draw; if (!D || D.done) return D ? D.done : false;
    D.t += dt;
    const lk = I.look(); let mx = lk.x * 1.2 + I.axis('left', 'right') * 260 * dt, my = lk.y * 1.2 + I.axis('fwd', 'back') * 260 * dt;
    const nx = D.dots[D.k][0], ny = D.dots[D.k][1];
    if (D.easy && (mx || my)) { const dx = nx - D.pen.x, dy = ny - D.pen.y, d = Math.hypot(dx, dy) || 1, dot = (mx * dx + my * dy) / d; if (dot > 0) { mx += dx / d * dot * 0.6; my += dy / d * dot * 0.6; } }
    const down = I.on('use') || I.on('jump');
    const was = { x: D.pen.x, y: D.pen.y };
    D.pen.x = Math.max(10, Math.min(790, D.pen.x + mx)); D.pen.y = Math.max(10, Math.min(550, D.pen.y + my));
    if (down && (D.pen.x !== was.x || D.pen.y !== was.y)) D.ink.push([D.pen.x, D.pen.y, D.lift ? 1 : 0]), D.lift = false; else if (!down) D.lift = true;
    if (down && Math.hypot(D.pen.x - nx, D.pen.y - ny) < 22) { D.k++; if (D.k >= D.dots.length) { D.done = true; B.sketch.nightfury = true; } }
    if (!down && D.k > 1 && D.offT !== undefined) { /* 펜을 떼도 이은 점은 남음 */ }
    redraw();
    return D.done;
  };
  B.endDraw = () => { B.draw = null; B.close(); };
  B.drawSense = () => { const D = B.draw; if (!D) return null; return { pen: [Math.round(D.pen.x), Math.round(D.pen.y)], next: D.k < D.dots.length ? D.dots[D.k] : null, k: D.k, n: D.dots.length }; };
  return B;
}
