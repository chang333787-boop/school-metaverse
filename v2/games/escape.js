// 학교 방탈출(G-ESCAPE · 09-27) — 행동 사전 엔진(§12) 위의 방탈출 + 잠입 판. 정본 문서 = docs/map_api.md §14 · 설계 = docs/tasks/story_engine.md(게임 후보 1·2)
//   흐름: (낮/밤 고르기) → 1번 방 안에서 시작(문 잠김) → 🔍 조사 → 방 물건에서 번호 찾기 → 🔢 번호 자물쇠 → 문 열림 + 🔑 다음 방 열쇠 → 다음 방 문 '열쇠로 열기' →
//         들어서면 문이 다시 잠김 → … → 마지막 방(순찰 로봇 · 밤 = 장난감 유령): 웅크리기(C·Ctrl·⬇)·숨기(E·✋)로 피하며 쪽지 3장 → 자물쇠 → 마무리 → 끝 화면
//   데이터 = v2/games/escape_story.js(아이들이 채우는 이야기 파일 — 동적 import ?t=지금: 상태 없는 글 묶음이라 두 벌이어도 무해 · 고친 뒤 버스터 없이 새로고침만)
//     이 파일이 그 데이터로 장면 목록(scene list)을 지어 map.story.run(엔진 이야기 실행기)에 넘긴다. 게임은 기억 표시(flag)만 올리고, 문 잠금·열쇠·쪽지·장 넘기기는 장면 동작이 한다.
//   규칙(_template.js · §5): import 금지(데이터 파일 동적 읽기 하나만 — tour.js와 같은 방식) · 새 조명 없음(밤 = map.lights(false)·map.flashlight — 있는 빛 세기·MeshBasic) ·
//     사람(NPC)은 술래·목표가 아니다(쫓는 것 = 이름 없는 '순찰' 역할 장난감 로봇 / 장난감 유령) · 잡혀도 벌 없음('딩동' → 방 문 안쪽) ·
//     글: 이야기·쪽지·문제 = 이야기 파일(자리표시) 그대로 · 이 파일의 글자는 화면 안내(UI)와 물건에서 나온 숫자·색뿐 · 매 프레임 새 객체 없음
export const meta = { id: 'escape', title: '학교 방탈출', api: 1 };

const NUMW = ['첫째', '둘째', '셋째', '넷째'], CIRC = ['①', '②', '③', '④', '⑤'];
const COLORS = [{ e: '🟥', n: '빨간', hex: 0xe0453a }, { e: '🟦', n: '파란', hex: 0x2f6fd0 }, { e: '🟨', n: '노란', hex: 0xf2c230 }, { e: '🟩', n: '초록', hex: 0x35a852 }];
const HINT_T = 45, HINT_SHOW = 8;
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const CSS = [
  '.esc-lock{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:30;width:min(400px,90vw);background:#223047;color:#fff;border-radius:14px;padding:14px 18px 14px;',
  'box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.15);font:15px/1.4 sans-serif;text-align:center;user-select:none;-webkit-user-select:none}',
  '.esc-lock h3{margin:0 0 4px;font-size:18px}.esc-lock p{margin:0 0 8px;color:#ffe08a;font-size:14px}',
  '.esc-dials{display:flex;justify-content:center;gap:10px;margin:4px 0 10px}',
  '.esc-dial{display:flex;flex-direction:column;align-items:center;gap:4px}',
  '.esc-dial button{width:52px;height:40px;border:0;border-radius:9px;background:#3b5176;color:#fff;font-size:18px;cursor:pointer;touch-action:manipulation}',
  '.esc-dial span{width:52px;height:50px;border-radius:9px;background:#fffaf0;color:#223047;font:800 30px/50px monospace;box-shadow:inset 0 0 0 2px #9fb3d1}',
  '.esc-dial.cur span{box-shadow:inset 0 0 0 3px #ffc62e}',
  '.esc-row{display:flex;justify-content:center;gap:10px}.esc-row button{min-width:110px;min-height:44px;border:0;border-radius:10px;font-size:16px;cursor:pointer;touch-action:manipulation}',
  '.esc-row .ok{background:#ffc62e;color:#223047;font-weight:800}.esc-row .no{background:#51607a;color:#fff}',
  '.esc-lock.bad{animation:escShake .35s}@keyframes escShake{20%{margin-left:-10px}40%{margin-left:10px}60%{margin-left:-6px}80%{margin-left:6px}}',
  // 터치(태블릿·휴대폰) 자물쇠 창 모양은 v2/phone.css(.esc-lock — 합치기 integ2: 게임 파일에 휴대폰 CSS를 따로 두지 않는다)
].join('\n');

export default async function start(map, params = {}) {
  let dead = false, st = 'prep';
  const THREE = map.three;
  map.player.freeze(true);
  map.hud.banner('방탈출 준비 중…', 30);
  map.sfx('warm');
  // ---------- 이야기 파일(아이들 글) ----------
  let DATA = null;
  try { DATA = (await import(new URL('./escape_story.js?t=' + Date.now(), import.meta.url))).STORY; } catch (e) { console.error('[escape] 이야기 파일을 못 읽음', e); }
  if (dead || map.gone) return {};
  if (!DATA || !Array.isArray(DATA.rooms) || !DATA.rooms.length) { map.hud.toast('이야기 파일(escape_story.js)을 읽지 못했어요'); map.quit(); return {}; }
  const nav = await map.nav();
  if (dead || map.gone) return {};
  const S = map.story, seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now(), rng = map.rng(seed);
  const ri = n => Math.floor(rng() * n);

  // ---------- 낮/밤 ----------
  let night = params.night === '1' || params.night === 1 || params.night === true ? true : params.night === '0' || params.night === 0 || params.night === false ? false : null;
  if (night == null) {
    map.hud.banner(' ', 0.02);
    const k = await map.hud.ask('🏫 학교 방탈출\n☀️ 낮 = 순찰 로봇 · 🌙 밤 = 장난감 유령 + 손전등', ['☀️ 낮에 하기', '🌙 밤에 하기']);
    if (dead || map.gone) return {};
    night = k === 1;
  }

  // ---------- 방·문 자리(월드에서) ----------
  const inZ = (i, z) => { const zz = nav.zoneOf(i); return !!zz && zz.id === z.id; };
  function doorSides(p, z) {   // 문 안쪽·바깥쪽 서는 칸(문 가운데에서 0.9m — 길격자 칸)
    let ins = null, out = null, other = null;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const i = nav.snap(p.x + dx * 0.95, p.y, p.z + dz * 0.95, 0.5); if (i < 0) continue;
      if (inZ(i, z)) { if (!ins) ins = { p: nav.pos(i), dx, dz }; } else if (!out) { out = { p: nav.pos(i), dx, dz }; other = nav.zoneOf(i); }
    }
    return ins && out && ins.dx === -out.dx && ins.dz === -out.dz ? { ins: ins.p, out: out.p, face: Math.round(((Math.atan2(ins.dx, -ins.dz) * 180 / Math.PI) + 360) % 360), other } : null;
  }
  const rooms = [];
  for (const R of DATA.rooms) {
    const z = map.zone(R.zone); if (!z) { console.warn('[escape] 없는 방', R.zone); continue; }
    const doors = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(z.id)).map(p => ({ n: +p.id.slice(5), x: p.x, y: p.y, z: p.z, s: doorSides(p, z) }));   // 문은 전부 잠근다 · 드나드는 문(main)은 양쪽 서는 칸이 있는 문 중에서
    if (!doors.some(d => d.s)) { console.warn('[escape] 문이 없는 방', R.zone); continue; }
    rooms.push({ k: rooms.length, R, z, doors, main: null, puzzle: ['count', 'colors', 'order'].includes(R.puzzle) ? R.puzzle : 'count' });
  }
  if (!rooms.length) { map.hud.toast('방탈출 방을 찾지 못했어요'); map.quit(); return {}; }
  const plen = (a, b) => { const r = nav.path(a, b, { maxExp: 60000 }); return r.ok ? r.len : 1e9; };
  // 문 고르기: 1번 방 = 다음 방 쪽으로 가장 가까운 문 · 그다음 방 = 앞 방 문에서 걸어서 가장 가까운 문(들어가는 문 = 나가는 문 = 자물쇠)
  rooms.forEach((m, i) => {
    const ok = m.doors.filter(d => d.s);
    if (ok.length === 1) { m.main = ok[0]; return; }
    const from = i === 0 ? (rooms[1] ? map.resolve('zone:' + rooms[1].z.id) : null) : rooms[i - 1].main.s.out;
    if (!from) { m.main = ok[0]; return; }
    const f = Array.isArray(from) ? from : [from.x, from.y, from.z];
    m.main = ok.map(d => ({ d, L: plen(d.s.out, f) })).sort((a, b) => a.L - b.L)[0].d;
  });
  const last = rooms.length - 1;
  rooms.forEach((m, i) => { m.stealth = !!m.R.chaser || (i === last && DATA.rooms.every(R => !R.chaser)); m.keyId = 'key' + i; });

  // ---------- 방 물건(번호가 나오는 곳) ----------
  const clear = [];   // 이미 쓴 자리(서로 1.6m 떨어지게)
  const spot = (m, o = {}) => {
    const far = clear.map(c => ({ x: c[0], z: c[2], r: c[3] }));
    far.push({ x: m.main.x, z: m.main.z, r: 2.2 });
    for (let t = 0; t < 3; t++) { const p = nav.random({ zones: [m.z.id], notTags: [], rng, minClear: o.mc ?? (t < 2 ? 2 : 1), farFrom: far }); if (p) { clear.push([p[0], p[1], p[2], o.r ?? 1.6]); return p; } }
    return null;
  };
  // 시작 자리: 1번 방 안 길격자 칸(문에서 떨어진 — 물건보다 먼저 잡는다) · ?room=2·3 = 그 방 문 앞에서(교사 시연·시험용)
  const startRoom = Math.max(0, Math.min(last, (+params.room || 1) - 1));
  const r0 = rooms[startRoom];
  const startAt = startRoom === 0 ? (spot(r0, { r: 2 }) || r0.main.s.ins) : r0.main.s.out;
  const bookGeo = () => new THREE.BoxGeometry(0.26, 0.34, 0.08).translate(0, 0.17, 0);
  for (const m of rooms) {
    m.items = []; m.found = new Set();
    if (m.puzzle === 'count') {
      const n = 3 + ri(4);
      for (let k = 0; k < n; k++) { const p = spot(m); if (p) m.items.push({ p }); }
      m.code = String(m.items.length);
    } else if (m.puzzle === 'colors') {
      const order = [0, 1, 2, 3].sort(() => rng() - 0.5), use = order.slice(0, 3);
      for (let c = 0; c < 4; c++) { const p = spot(m); if (p) m.items.push({ p, c, d: 1 + ri(9) }); }
      m.order = use.filter(c => m.items.some(it => it.c === c));
      m.code = m.order.map(c => m.items.find(it => it.c === c).d).join('');
    } else {
      for (let k = 0; k < 3; k++) { const p = spot(m); if (p) m.items.push({ p, pos: m.items.length, d: ri(10) }); }
      m.code = m.items.map(it => it.d).join('');
    }
    if (!m.code) m.code = '0';
  }

  // ---------- 이야기 파일 → 장면 목록 ----------
  const ops = a => Array.isArray(a) ? a.filter(o => o && typeof o.op === 'string') : [];
  const SC = [];
  const lockAll = [];
  for (const m of rooms) for (const d of m.doors) lockAll.push({ op: 'lockDoor', door: d.n, hot: d !== m.main });   // 들어가는 문엔 '🔒' 대신 게임 지점(🔑·🔢)
  SC.push({ id: 'start', do: [{ op: 'chapter', n: 1 }, ...lockAll, ...ops(night ? (DATA.nightIntro || DATA.intro) : DATA.intro), { op: 'flag', k: 'go' }] });
  rooms.forEach((m, i) => {
    const R = m.R, allDoors = m.doors.map(d => ({ op: 'unlockDoor', door: d.n }));
    if (i > 0) SC.push({ id: 'r' + i + '_unlock', when: { flags: ['r' + i + '_try'], has: [m.keyId] }, do: [{ op: 'unlockDoor', door: m.main.n }, { op: 'take', item: m.keyId }, { op: 'flag', k: 'r' + i + '_unlocked' }] });
    SC.push({ id: 'r' + i + '_in', when: { flags: ['r' + i + '_in'] }, do: [...(i > 0 ? [{ op: 'lockDoor', door: m.main.n, hot: false }, { op: 'sound', sfx: 'tick' }] : []), ...ops(R.enter), { op: 'flag', k: 'r' + i + '_ready' }] });
    const nx = rooms[i + 1], key = R.key || {};
    SC.push({ id: 'r' + i + '_open', when: { flags: ['r' + i + '_open'] }, do: [...allDoors, { op: 'sound', sfx: 'ding' }, ...ops(R.solved),
      ...(nx ? [{ op: 'give', item: nx.keyId, icon: key.icon || '🔑', label: key.label || (nx.z.label + ' 열쇠') }] : []), { op: 'chapter', n: i + 2 }, { op: 'flag', k: 'r' + i + '_done' }] });
  });
  SC.push({ id: 'end', when: { flags: ['r' + last + '_done'] }, do: [...ops(DATA.ending), { op: 'flag', k: 'done' }] });

  // ---------- 그리기(소품) ----------
  const handles = [];
  let bookMesh = null;
  const bookRooms = rooms.filter(m => m.puzzle === 'colors');
  const nBooks = bookRooms.reduce((a, m) => a + m.items.length, 0);
  if (nBooks) {
    bookMesh = new THREE.InstancedMesh(bookGeo(), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x202020 }), nBooks);
    bookMesh.castShadow = bookMesh.receiveShadow = false;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
    let j = 0;
    for (const m of bookRooms) for (const it of m.items) { const h = rng() * Math.PI * 2;
      bookMesh.setMatrixAt(j, m4.compose(v.set(it.p[0], it.p[1] + 0.03, it.p[2]), q.setFromEuler(e.set(0, h, 0.1)), s)); bookMesh.setColorAt(j, c.setHex(COLORS[it.c].hex)); j++; }
    bookMesh.instanceMatrix.needsUpdate = true; if (bookMesh.instanceColor) bookMesh.instanceColor.needsUpdate = true;
    bookMesh.computeBoundingSphere(); map.add(bookMesh);
  }

  // ---------- HUD ----------
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const touch = () => document.body.classList.contains('touch');
  let cur = -1, T = 0, roomT = 0, shownSec = -1, caughtN = 0, hintOn = 0, beam = null, lockUI = null;
  const clueText = m => {
    if (m.puzzle === 'colors') return '📚 ' + (m.items.filter(it => m.found.has(it)).map(it => COLORS[it.c].e + it.d).join(' ') || '책을 찾아요');
    if (m.puzzle === 'order') return '📄 ' + m.items.map(it => m.found.has(it) ? String(it.d) : '?').join('·');
    return null;
  };
  function chips() {
    const m = rooms[cur];
    map.hud.chip('esc-time', '⏱ ' + fmt(T) + (caughtN ? ' · 🔔' + caughtN : ''));
    const ct = m && st === 'room' ? clueText(m) : null; map.hud.chip('esc-clue', ct);
    map.hud.chip('esc-hint', m && st === 'room' && roomT > HINT_T ? (touch() ? '💡 힌트' : '💡 힌트(H)') : null, { onClick: showHint });
  }
  function setMark(p, label) {
    hintOn = 0;   // 리뷰: 힌트(8초) 도중 방을 풀면 힌트가 끝나며 setMarks([])로 다음 문 별표까지 지웠다
    if (beam) { beam.remove(); beam = null; }
    if (p) beam = map.mk.marker(p[0], p[1], p[2], { color: 0x3cc8ff, beam: true });
    map.minimap.setMarks(p ? [{ x: p[0], z: p[2], color: '#2b8fe0', shape: 'star', blink: true, label }] : []);
  }
  function showHint() {
    const m = rooms[cur]; if (!m || st !== 'room') return;
    hintOn = HINT_SHOW; map.sfx('pick');
    map.minimap.show({ big: false });
    map.minimap.setMarks(m.items.filter(it => !m.found.has(it)).map(it => ({ x: it.p[0], z: it.p[2], color: '#ffb000', shape: 'dot', blink: true })));
  }
  const keyH = e => { if (e.code === 'KeyH' && !e.repeat && !lockUI && st === 'room') showHint(); };
  addEventListener('keydown', keyH);

  // ---------- 번호 자물쇠(화면 창 — 키보드 숫자·←→·↑↓·Enter·Esc / 터치 ▲▼·열기·닫기) ----------
  function lockOpen(m) {
    if (lockUI) { lockClose(); return; }
    if (st !== 'room' || S.flag('r' + m.k + '_open')) return;
    document.exitPointerLock?.();
    const n = m.code.length, vals = new Array(n).fill(0), el = document.createElement('div'), t0 = performance.now(); let at = 0;
    el.className = 'esc-lock';
    el.innerHTML = '<h3>🔢 번호 자물쇠</h3><p></p><div class="esc-dials"></div><div class="esc-row"><button class="ok">열기</button><button class="no">닫기</button></div>';
    el.querySelector('p').textContent = m.R.rule || '';
    const box = el.querySelector('.esc-dials'), spans = [];
    for (let k = 0; k < n; k++) { const d = document.createElement('div'); d.className = 'esc-dial'; d.innerHTML = '<button>▲</button><span>0</span><button>▼</button>';
      const [up, dn] = d.querySelectorAll('button'); up.onclick = ev => { ev.stopPropagation(); at = k; bump(1); }; dn.onclick = ev => { ev.stopPropagation(); at = k; bump(-1); };
      d.querySelector('span').onclick = ev => { ev.stopPropagation(); at = k; draw(); }; box.appendChild(d); spans.push(d); }
    const draw = () => spans.forEach((d, k) => { d.querySelector('span').textContent = vals[k]; d.classList.toggle('cur', k === at); });
    const bump = s => { vals[at] = (vals[at] + s + 10) % 10; map.sfx('tick'); draw(); };
    const tryIt = () => {
      if (vals.join('') === m.code) { lockClose(); map.sfx('done'); S.flag('r' + m.k + '_open', true); return; }
      map.sfx('buzz'); map.hud.toast('🔒 번호가 달라요'); el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad');
    };
    el.querySelector('.ok').onclick = ev => { ev.stopPropagation(); tryIt(); };
    el.querySelector('.no').onclick = ev => { ev.stopPropagation(); lockClose(); };
    const kd = e => {
      if (performance.now() - t0 < 200) return;
      let used = true;
      if (/^Digit\d$|^Numpad\d$/.test(e.code)) { vals[at] = +e.code.slice(-1); at = Math.min(n - 1, at + 1); map.sfx('tick'); draw(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') bump(1); else if (e.code === 'ArrowDown' || e.code === 'KeyS') bump(-1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { at = Math.max(0, at - 1); draw(); } else if (e.code === 'ArrowRight' || e.code === 'KeyD') { at = Math.min(n - 1, at + 1); draw(); }
      else if (e.code === 'Enter' || e.code === 'Space') tryIt(); else if (e.code === 'Escape' || e.code === 'KeyE') lockClose();
      else used = false;
      if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
    };
    addEventListener('keydown', kd, true);
    document.body.appendChild(el); draw();
    map.player.freeze(true);
    lockUI = { el, kd, m };
  }
  function lockClose() {
    if (!lockUI) return; removeEventListener('keydown', lockUI.kd, true); lockUI.el.remove(); lockUI = null;
    if (!dead && !map.gone && !map.player.hidden()) map.player.freeze(false);
  }

  // ---------- 동사 연결(지점) ----------
  function roomSetup(m) {
    // 번호 자물쇠 = 들어가는 문 안쪽
    const ins = m.main.s.ins;
    handles.push(map.interact.add({ x: ins[0], y: ins[1], z: ins[2], r: 0.9, label: '🔢 번호 자물쇠', use: () => lockOpen(m) }));
    // 게시판(문제 쪽지 자리) — 방 안 칸 하나(문과 떨어진)
    const R = m.R;
    if (R.board || m.puzzle === 'colors') {
      const bp = spot(m, { mc: 1, r: 1.2 }) || ins;
      m.boardAt = bp;
      const body = () => ((R.board && R.board.body) || '') + (m.puzzle === 'colors' ? '\n\n색 순서: ' + m.order.map(c => COLORS[c].e).join(' → ') : '');
      handles.push(map.investigate.add({ x: bp[0], y: bp[1], z: bp[2], r: 1.2, label: '🔍 게시판 보기', onUse: async () => { await map.note((R.board && R.board.title) || '📋 게시판', body()); } }));
      m.boardProp = map.prop.spawn('note', bp[0], bp[1], bp[2], { h: ri(360), s: 1.6 });
    }
    // 물건
    for (const it of m.items) {
      const [x, y, zz] = it.p;
      if (m.puzzle === 'count') { it.prop = map.prop.spawn('box', x, y, zz, { h: ri(360), s: 0.9 + rng() * 0.3 }); continue; }
      if (m.puzzle === 'order') it.prop = map.prop.spawn('note', x, y, zz, { h: ri(360), s: 1.5 });
      const label = m.puzzle === 'colors' ? '🔍 ' + COLORS[it.c].e + ' ' + COLORS[it.c].n + ' 책' : '🔍 쪽지 보기';
      const line = m.puzzle === 'colors' ? COLORS[it.c].e + ' ' + COLORS[it.c].n + ' 책 — 숫자 ' + it.d : '🔢 ' + NUMW[it.pos] + ' 자리 = ' + it.d;
      handles.push(map.investigate.add({ x, y, z: zz, r: 1.1, label, onUse: async () => {
        const first = !m.found.has(it); m.found.add(it); chips();
        if (R.clue && first) { await map.note(R.clue.title || '', (R.clue.body || '') + '\n\n' + line); if (dead) return; }
        else map.hud.toast(line, 3);
        if (first) map.sfx('pick');
      } }));
    }
  }
  // 다음 방 문 '열쇠로 열기'(바깥쪽)
  function keyDoor(m) {
    const o = m.main.s.out;
    const h = map.investigate.add({ x: o[0], y: o[1], z: o[2], r: 1.2, label: '🔑 열쇠로 열기', onUse: () => { if (!S.has(m.keyId)) { map.sfx('buzz'); map.hud.toast('🔒 ' + m.z.label + ' 열쇠가 있어야 해요'); return; } S.flag('r' + m.k + '_try', true); } });
    m.keyH = h;
  }
  // 잠입(마지막 방): 웅크리기 · 숨는 자리 · 순찰 로봇(밤 = 장난감 유령)
  let bot = null; const hides = [];
  function stealthOn(m) {
    map.player.crouch(true);
    const ki = m.main.s.ins;   // 자물쇠 지점과 겹치지 않게(서는 칸이 자물쇠에서 1.5m 안이면 뺀다 · 자물쇠 지점 r 0.9) · 물건(쪽지) 지점과도 1.2m
    for (const c of map.hide.candidates({ zone: m.z.id, max: 10, near: [m.main.x, m.main.z], r: 20 })) {
      if (hides.length >= 5 || Math.hypot(c.stand.x - ki[0], c.stand.z - ki[2]) < 1.5 || m.items.some(it => Math.hypot(c.stand.x - it.p[0], c.stand.z - it.p[2]) < 1.2)) continue;
      const h = map.hide.add(c); if (h.spot) hides.push(h); }
    const z = m.z, ins = 1.3;
    const cs = [[z.x0 + ins, z.z0 + ins], [z.x1 - ins, z.z0 + ins], [z.x1 - ins, z.z1 - ins], [z.x0 + ins, z.z1 - ins]].map(([x, zz]) => {
      for (const r of [0.8, 1.6, 2.4]) { const i = nav.snap(x, m.main.y, zz, r); if (i >= 0 && inZ(i, z)) return nav.pos(i); } return null; }).filter(Boolean);
    // 순찰은 문에서 가장 먼 귀퉁이부터(들어서자마자 잡히지 않게)
    cs.sort((a, b) => Math.hypot(b[0] - m.main.x, b[2] - m.main.z) - Math.hypot(a[0] - m.main.x, a[2] - m.main.z));
    if (cs.length >= 4 && Math.hypot(cs[3][0] - m.main.x, cs[3][2] - m.main.z) < 3.2) cs.pop();   // 문(잡히면 돌아오는 자리) 바로 옆 귀퉁이는 순찰에서 뺀다 — 돌아오자마자 또 잡히지 않게
    const path = cs.length >= 3 ? [cs[0], ...cs.slice(1).sort((a, b) => Math.atan2(a[2] - z.cz, a[0] - z.cx) - Math.atan2(b[2] - z.cz, b[0] - z.cx))] : cs;
    const home = m.main.s.ins;
    bot = map.chaser.spawn({ kind: night ? 'ghost' : 'patrol', at: path[0] || home, path: path.length >= 2 ? path : null, zone: z.id,
      speed: night ? 0.9 : 1.05, chase: night ? 2.2 : 2.5, fov: night ? 90 : 80, range: night ? 5 : 5.5, hear: 1, home,
      onCatch: () => { caughtN++; lockClose(); map.player.teleport(home, { h: m.main.s.face }); map.hud.toast('🔔 딩동! 문 앞에서 다시 해 봐요', 2.5); chips(); } });
  }
  function stealthOff() {
    if (bot) { bot.remove(); bot = null; } for (const h of hides.splice(0)) h.remove(); map.player.crouch(false);
  }

  // ---------- 진행 ----------
  // 휴대폰(터치)이면 목표 줄을 짧게 — 가로 화면 위쪽이 미니맵·칩과 붙어 있어 긴 줄은 두세 줄로 접혀 화면을 가렸다(사용자 09-27 '핸드폰 모드 UI')
  const goalRoom = m => {
    const num = CIRC[m.k] || '', t = touch();
    const how = t ? (m.puzzle === 'count' ? '🔍 살펴보고 🔢 자물쇠' : m.puzzle === 'colors' ? '📋 게시판·📚 책 → 🔢' : '📄 쪽지 3장 → 🔢')
      : m.puzzle === 'count' ? '🔍 방을 살펴 🔢 번호 자물쇠를 풀어요' : m.puzzle === 'colors' ? '📋 게시판과 📚 책을 찾아 번호 자물쇠를 풀어요' : '📄 쪽지 3장을 모아 번호 자물쇠를 풀어요';
    const sneak = m.stealth ? (t ? ' · ⬇ 웅크려 ✋ 숨기' : ' · C 웅크리기 · E 숨기') : '';
    map.hud.goal(num + ' ' + m.z.label + (t ? ' · ' : ' — ') + how + sneak);
  };
  function enterRoom(i) {
    cur = i; roomT = 0; st = 'room'; const m = rooms[i];
    setMark(null); goalRoom(m); chips();
    if (m.stealth) stealthOn(m);
  }
  function toNext(i) {   // i번 방을 풀었다 → 다음 방 문으로
    const m = rooms[i]; if (m.stealth) stealthOff();
    const nx = rooms[i + 1]; if (!nx) { st = 'ending'; setMark(null); return; }
    st = 'walk'; cur = i + 1; chips();
    map.hud.goal((CIRC[nx.k] || '') + ' ' + (m.R.key && m.R.key.label ? m.R.key.icon + ' ' + m.R.key.label : '🔑 열쇠') + '로 ' + nx.z.label + ' 문을 열어요');
    setMark(nx.main.s.out, nx.z.label);
  }
  const offS = S.on((type, d) => {
    if (dead || type !== 'flag') return;
    const mm = /^r(\d+)_(ready|done|unlocked)$/.exec(d.k);
    if (d.k === 'go') { st = 'play'; T = 0; map.player.freeze(false); map.hud.banner('시작!', 1.0); map.sfx('go');
      if (startRoom === 0) S.flag('r0_in', true); else { st = 'walk'; cur = startRoom; S.give(rooms[startRoom].keyId, { icon: '🔑', label: rooms[startRoom].z.label + ' 열쇠' }); toNext(startRoom - 1); } }
    else if (d.k === 'done') finish();
    else if (mm) { const i = +mm[1];
      if (mm[2] === 'ready') enterRoom(i);
      else if (mm[2] === 'done') toNext(i);
      else if (mm[2] === 'unlocked') { if (rooms[i].keyH) { rooms[i].keyH.remove(); rooms[i].keyH = null; } map.hud.goal((CIRC[i] || '') + ' ' + rooms[i].z.label + '에 들어가요'); } }
  });
  void offS;

  async function finish() {
    if (st === 'end') return; st = 'end'; setMark(null); stealthOff(); lockClose(); chips();
    map.hud.chip('esc-clue', null); map.hud.chip('esc-hint', null);
    const bestKey = night ? 'bestNight' : 'best', best = map.store.get(bestKey, null), nb = best == null || T < best;
    if (nb) map.store.set(bestKey, Math.floor(T));
    map.hud.goal('🎉 방탈출 성공!'); map.sfx('done');
    const k = await map.hud.ask('🎉 학교 방탈출 성공!\n걸린 시간 ' + fmt(T) + (nb ? ' (가장 빠른 기록!)' : ' · 가장 빠른 기록 ' + fmt(best)) + '\n잡힌 횟수 ' + caughtN + (night ? ' · 🌙 밤' : ' · ☀️ 낮'), ['그만하기']);
    if (dead) return; void k; map.quit();
  }

  // ---------- 시작 ----------
  if (night) { map.time('night'); map.lights(false); map.flashlight(true); }
  for (const m of rooms) { roomSetup(m); if (m.k > 0) keyDoor(m); }
  map.player.teleport(startAt, { h: startRoom === 0 ? (r0.main.s.face + 180) % 360 : 0 });
  map.minimap.show();
  map.hud.banner(' ', 0.02);
  const runner = S.run(SC, {});

  // ---------- 틱(가벼움: 초 칩 · 들어섬 확인 5Hz) ----------
  let chk = 0, wasTouch = touch();
  return {
    tick(dt) {
      if (st === 'prep' || st === 'end' || st === 'ending' || dead) return;
      T += dt; roomT += dt;
      if (hintOn > 0 && (hintOn -= dt) <= 0) { hintOn = 0; map.minimap.setMarks([]); }
      const sec = Math.floor(T); if (sec !== shownSec) { shownSec = sec; chips(); }
      if ((chk += dt) < 0.2) return; chk = 0;
      if (touch() !== wasTouch) { wasTouch = !wasTouch; if (st === 'room' && rooms[cur]) goalRoom(rooms[cur]); }   // 처음 화면을 터치해 터치 모드가 켜진 때(또는 꺼진 때) — 목표 줄 안내(⬇·✋ ↔ C·E)를 바꾼다
      // 다음 방 들어섬: 그 방 구역 안 + 문에서 1.8m 넘게(문을 다시 잠가도 몸이 문틀에 걸리지 않게)
      if (st === 'walk' && cur >= 0 && S.flag('r' + cur + '_unlocked') && !S.flag('r' + cur + '_in')) {
        const m = rooms[cur], p = map.player.get();
        if (p.zone === m.z.id && Math.hypot(p.x - m.main.x, p.z - m.main.z) > 1.8) S.flag('r' + cur + '_in', true);
      }
    },
    stop() {
      dead = true; lockClose(); removeEventListener('keydown', keyH); css.remove();
      if (bookMesh) { bookMesh.geometry.dispose(); bookMesh.material.dispose(); if (bookMesh.dispose) bookMesh.dispose(); bookMesh = null; }
    },
    // 시험·교사 시연용(읽기 전용)
    get state() { return st; }, get room() { return cur; }, get night() { return night; }, get caught() { return caughtN; }, get runner() { return runner; }, get bot() { return bot; }, get time() { return T; },
    get rooms() { return rooms.map(m => ({ zone: m.z.id, label: m.z.label, puzzle: m.puzzle, code: m.code, main: { n: m.main.n, ins: m.main.s.ins, out: m.main.s.out, face: m.main.s.face }, doors: m.doors.map(d => d.n), items: m.items.map(it => ({ p: it.p, c: it.c, d: it.d, pos: it.pos })), order: m.order, board: m.boardAt, stealth: m.stealth })); },
    get hides() { return hides.map(h => h.spot && { x: h.spot.x, z: h.spot.z, stand: h.spot.stand, label: h.spot.label }); },
    get lockOpen() { return !!lockUI; }, get start() { return startAt; },
  };
}
