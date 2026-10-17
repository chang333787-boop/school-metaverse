// 동시 접속(MP-1 · 10-03) — Firebase 실시간 DB(class-rpg) REST + EventSource. SDK 없음 · 홍보판(SM_PROMO)에서는 부르지 않는다.
//   방 = metaverse/rooms/<room>/players/<id> = { n 이름, c 색, k 모양, x, y, z, h, t 서버시각, fx? }
//   보내기: 움직이면 초당 6번 · 가만히 있으면 3초마다 · 받기: 방 한 갈래(rooms/<room>)를 스트림 하나로 — players + ctl(선생님 신호·물총 대기실) · 20초 넘게 소식 없는 사람은 숨기고 2분 넘으면 지움
//   NET-2(10-03): 이모지 인사(players/<id>/m = {q, i} — 정해진 그림만 · 3초 머리 위) · 미니맵 친구 점(peers()) · ctl = 방 신호(o.onCtl) — 연결 하나로 합침(무료 요금제 동시 연결 100)
import { lookCode, parseLook, lookColors } from './look.js?v=1';   // LOOK-1(10-17): 내 모습 옷 코드 = players k('L' + 숫자 다섯 · 8자 이하 — 규칙 그대로) · 기본 모습이면 예전처럼 'kid'
//   NET-OOB(10-17): DB 규칙 범위(x·z ±500 · y −100~200) 밖(마을 대부분)이면 위치를 보내지 않고 3초마다 {h: 99, t}만(= '보이지 않는 곳' 표시 — 받는 화면은 숨김) · 401(쓰기 거절) → onDenied(방 닫힘 확인)는 20초에 한 번만
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app';
const PAL = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x38d9a9, 0x4dabf7, 0x748ffc, 0xda77f2, 0xf783ac, 0x20c997];
const SKIN = 0xf1c9a0;
import { checkChat } from './chatfilter.js?v=1';   // SAFE-1(10-17): 이름도 채팅과 같은 거르개(바꿔 쓰지 않고 못 씀)
// EMOTE-2(10-17): 이모트 열(규칙 m.i < 10 그대로 · 모두 유니코드 6 이하 — 윈도 10에서 안 깨짐) · 뒤에만 더함(옛 화면은 6번부터 🎉로 보임)
export const EMOTES = ['👋', '😀', '👍', '❤️', '😮', '🎉', '🙇', '👏', '🙋', '💃'];
export const EMOTE_T = ['안녕', '좋아요', '최고', '고마워', '깜짝', '축하', '꾸벅', '박수', '저요', '춤'];
//   친구 몸짓 = 몸 변환만(기울기·폴짝·흔들기 — 그리기 0 · 쓰기 0) · 둘이 2m 안에서 3초 안에 같은 이모트 = 맞춤(하이파이브·같이 춤 — 받은 시각으로 각자 화면에서 판정 → o.onCombo)
const MO = ['sway', 'bounce', 'nod', 'sway', 'back', 'hop', 'bow', 'bounce', 'sway', 'dance'], MO_DUR = [1.8, 1.6, 1.6, 2.0, 1.4, 1.8, 1.8, 1.8, 1.8, 2.6];
// TOGETHER-0(10-17 #46 · DB 규칙 그대로): 친구가 마을에서 보이기 — 세계 = window.SM_WORLD({ w: 't:다7'(마을·칸) | 'i:12'(실내·건물), v: 'b' 자전거 · 'o' 배 · 'k' 스키 · 'z' 앉기, q 바뀐 번호 }) · 없으면 학교
//   보내기: 마을·실내면 x·y·z ÷ SCL(4)(마을 −750~+875 → ±220 · 산 330m → 83 = 규칙 안) · h = 100 + 방향(옛 화면은 |h|>50 = '보이지 않는 곳'으로 숨김) · 활동 글 a 앞에 머리표('t:다7.b ' · 'i:12 ') — 학교면 머리표 없이 예전 그대로(방 놀이 글 비교가 옛 화면과 같게)
//   받기: 머리표 없으면 학교 · 같은 세계 친구만 그림(마을 = 칸 상관없이 하나 · 실내 = 같은 건물만) · 다른 세계는 👥 목록에 '📍 마을 다7' · 앞질러 그리기(받은 두 자리로 속도 · 0.45초까지 · 10m 넘게 어긋나면 바로)
//   보내기 예산: 움직이면 방 전체 초당 60번을 사람 수로 나눔(5명 = 1인 6번 · 30명 = 2번) · 가만히면 5초마다
export const SCL = 4;
const TAG_RX = /^(t:[^ .]{0,6}|i:[^ .]{1,8})(?:\.([bokz]))? /;
export function parseAct(a) { const s = String(a || ''), m = TAG_RX.exec(s); if (!m) return { w: 's', cell: '', v: '', label: s }; const t = m[1][0] === 't'; return { w: t ? 't' : m[1], cell: t ? m[1].slice(2) : '', v: m[2] || '', label: s.slice(m[0].length) }; }
const myW = () => { const W9 = typeof window !== 'undefined' && window.SM_WORLD; return W9 && W9.w ? W9 : null; };
const wKey = (w) => (!w || w === 's' ? 's' : w[0] === 't' ? 't' : w);   // 같은 세계 열쇠(마을 = 하나 · 실내 = 건물마다)
export const placeText = (q) => (q.w === 't' ? '📍 마을' + (q.cell ? ' ' + q.cell : '') : q.w && q.w.startsWith('i:') ? '🏠 마을 실내' : '🏫 학교');
const fit20 = (s) => { let o9 = ''; for (const ch of String(s)) { if (o9.length + ch.length > 20) break; o9 += ch; } return o9; };   // 규칙 a ≤ 20(글자를 반으로 자르지 않음)
export const comboKind = (i) => (i === 0 || i === 2 || i === 7 ? 'five' : i === 5 || i === 9 ? 'dance' : 'heart');

export function createNet(o) {
  const { THREE, scene, room, kind = 'kid', scale = 1 } = o;
  const base = DB + '/metaverse/rooms/' + encodeURIComponent(room);
  let id = null;
  try { id = sessionStorage.getItem('mp.id'); } catch (e) { /* */ }
  if (!id) { id = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mp.id', id); } catch (e) { /* */ } }
  let name = '';
  try { name = localStorage.getItem('mp.name') || ''; } catch (e) { /* */ }
  if (!name || !checkChat(name).ok) name = '친구' + Math.floor(10 + Math.random() * 90);   // SAFE-1: 예전에 저장된 이름도 거름
  const MUTE = new Set(); try { for (const q of JSON.parse(sessionStorage.getItem('mp.mute') || '[]')) MUTE.add(String(q)); } catch (e) { /* */ }   // SAFE-1 🙈: 이 탭에서 나에게만 안 보이는 친구(말·이모지 · 친구는 모름)
  let myE = null, meP = null;   // EMOTE-2: 내 마지막 이모트 {i, t} · 내 자리(맞춤 판정)
  const color = PAL[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PAL.length];
  const others = new Map();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const _m = new THREE.Matrix4(), _c = new THREE.Color();
  let es = null, dead = false, hidden = false, mQ = 0, CTL = {}, selfE = null, act = '', CHAT = {}, chatSeen = new Set(), chatT0 = Date.now(), selfB = null, offset = 0, sendT = 0, beatT = 0, cleanT = 8, fxQ = 0, denyT = -1e9, away = false, actSent = '', wq = -1, ext = false, last = { x: 1e9, y: 0, z: 0, h: 0 }, onChange = o.onChange || (() => {});

  function merge(parts) {
    const P = [], N = [], C = [];
    for (const [geo, hex, x, y, z, rx = 0] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo; _m.makeRotationX(rx).setPosition(x, y, z); g.applyMatrix4(_m);
      const p = g.attributes.position.array, n = g.attributes.normal.array; _c.setHex(hex);
      for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
      for (let i = 0; i < p.length / 3; i++) C.push(_c.r, _c.g, _c.b);
      g.dispose(); geo.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    return g;
  }
  function avatarGeo(k, hex) {
    const LK = parseLook(k), lc = LK ? lookColors(LK) : null;   // LOOK-1: 친구 옷 코드 → 윗옷·바지·피부·머리·모자 색
    const parts = k === 'wizard' ? [
      [new THREE.ConeGeometry(0.42, 1.15, 8), hex, 0, 0.58, 0], [new THREE.IcosahedronGeometry(0.26, 1), SKIN, 0, 1.32, 0],
      [new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10), 0x2a1d4f, 0, 1.5, 0], [new THREE.ConeGeometry(0.24, 0.62, 8), 0x2a1d4f, 0, 1.82, -0.04],
      [new THREE.SphereGeometry(0.04, 5, 4), 0x1d1530, -0.09, 1.35, 0.23], [new THREE.SphereGeometry(0.04, 5, 4), 0x1d1530, 0.09, 1.35, 0.23],
    ] : lc ? [
      [new THREE.BoxGeometry(0.42, 0.5, 0.26), lc.top, 0, 0.75, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), lc.bot, -0.11, 0.25, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), lc.bot, 0.11, 0.25, 0],
      [new THREE.IcosahedronGeometry(0.26, 1), lc.skin, 0, 1.24, 0], [new THREE.SphereGeometry(0.255, 8, 5), lc.hair, 0, 1.21, -0.05], [new THREE.SphereGeometry(0.28, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), lc.cap, 0, 1.3, 0],
      [new THREE.BoxGeometry(0.3, 0.05, 0.2), lc.cap2, 0, 1.31, 0.24], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, -0.09, 1.26, 0.23], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, 0.09, 1.26, 0.23],
    ] : [
      [new THREE.BoxGeometry(0.42, 0.5, 0.26), hex, 0, 0.75, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), 0x2b3a55, -0.11, 0.25, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), 0x2b3a55, 0.11, 0.25, 0],
      [new THREE.IcosahedronGeometry(0.26, 1), SKIN, 0, 1.24, 0], [new THREE.SphereGeometry(0.28, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), hex, 0, 1.3, 0],
      [new THREE.BoxGeometry(0.3, 0.05, 0.2), hex, 0, 1.31, 0.24], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, -0.09, 1.26, 0.23], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, 0.09, 1.26, 0.23],
    ];
    return merge(parts);
  }
  function avatar(k, hex) { const m = new THREE.Mesh(avatarGeo(k, hex), mat); m.scale.setScalar(scale); m.rotation.order = 'YXZ'; return m; }   // EMOTE-2: 몸 기준 기울기
  function tag(text) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(4, 6, 248, 52, 22); g.fill();
    g.fillStyle = '#1d3557'; g.font = '800 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(text).slice(0, 8), 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(1.2, 0.3, 1); return s;
  }
  function drop(pid) { const O = others.get(pid); if (!O) return; if (O.sb) { scene.remove(O.sb.s); if (O.sb.s.material.map) O.sb.s.material.map.dispose(); O.sb.s.material.dispose(); } scene.remove(O.mesh); O.mesh.geometry.dispose(); scene.remove(O.tag); O.tag.material.map.dispose(); O.tag.material.dispose(); if (O.em) { scene.remove(O.em.s); O.em.s.material.dispose(); } others.delete(pid); onChange(); }
  // 이모지(그림 6개 — 텍스처는 하나씩만 만들어 같이 씀) · 3초 동안 머리 위에서 살짝 떠오름
  const ETEX = [];
  function combo(O, i) {   // EMOTE-2: 같은 이모트 맞춤 — 2m 안 · 3초 안 · 한 친구와 3초에 한 번
    const now = performance.now(); if (!meP || O.away || MUTE.has(O.pid) || now - (O.comboT || 0) < 3000) return;
    if (Math.hypot(O.x - meP.x, O.z - meP.z) > 2 || Math.abs(O.y - meP.y) > 1.5) return;
    O.comboT = now; const kd = comboKind(i); if (kd === 'dance') O.mo = { i: 9, t: 0, dur: 3.2 };   // 같이 춤 = 친구 춤도 길게
    if (o.onCombo) o.onCombo({ x: O.x, y: O.y, z: O.z, label: O.n }, i, kd);
  }
  function moTick(O, dt) {   // EMOTE-2: 친구 몸짓 — 통짜 몸 변환만(rotation 순서 YXZ = 몸 기준 기울기)
    const M = O.mo; if (!M) return 0; M.t += dt; const t = M.t, d = M.dur;
    if (t >= d) { O.mo = null; O.mesh.rotation.x = O.mesh.rotation.z = 0; O.mrx = O.mrz = O.mry = O.mdy = 0; return 0; }
    const k = Math.min(1, t / 0.25, (d - t) / 0.25), s = Math.sin; let y = 0, rx = 0, rz = 0;
    switch (MO[M.i] || 'bounce') {
      case 'sway': rz = s(t * 7) * 0.1 * k; break;
      case 'bounce': y = Math.abs(s(t * 11)) * 0.06 * k; break;
      case 'nod': rx = s(t * 6) * 0.12 * k; break;
      case 'back': rx = -0.2 * k; y = Math.max(0, s(Math.min(1, t / 0.35) * Math.PI)) * 0.08; break;
      case 'hop': y = Math.max(0, s(t * 7.5)) * 0.22 * k; break;
      case 'bow': rx = 0.55 * s(Math.min(1, t / d) * Math.PI); break;
      case 'dance': rz = s(t * 6) * 0.16 * k; y = Math.abs(s(t * 6)) * 0.06 * k; O.mry = s(t * 3) * 0.35 * k; O.mesh.rotation.y += O.mry; break;
    }
    O.mesh.rotation.x = O.mrx = rx; O.mesh.rotation.z = O.mrz = rz; O.mdy = y * scale; return y * scale;   /* TOGETHER-0: 값도 남김(마을 그리개가 씀) */
  }
  function emoteSprite(old, i) {
    i = Math.max(0, Math.min(EMOTES.length - 1, i | 0));
    if (!ETEX[i]) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = '96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(EMOTES[i], 64, 70); ETEX[i] = new THREE.CanvasTexture(c); ETEX[i].colorSpace = THREE.SRGBColorSpace; }
    let E = old; if (!E) { E = { s: new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })), t: 0 }; E.s.scale.set(0.75, 0.75, 1); scene.add(E.s); }
    E.s.material.map = ETEX[i]; E.s.material.needsUpdate = true; E.t = 3; E.s.visible = true; return E;
  }
  function emoteTick(E, dt, x, y, z) { if (!E || E.t <= 0) return; E.t -= dt; const k = 1 - Math.max(0, E.t) / 3; E.s.position.set(x, y + 2.55 * scale + k * 0.35, z); E.s.material.opacity = Math.min(1, E.t * 2); E.s.visible = E.t > 0 && !hidden; }
  // 방 갈래 하나: players(사람) + ctl(신호)
  function setAt(root, p, v) {
    if (!p.length) return v && typeof v === 'object' ? v : {};
    let q = root; for (let i = 0; i < p.length - 1; i++) { if (!q[p[i]] || typeof q[p[i]] !== 'object') { if (v === null) return root; q[p[i]] = {}; } q = q[p[i]]; }
    if (v === null) delete q[p[p.length - 1]]; else q[p[p.length - 1]] = v; return root;
  }
  // TOGETHER-0: 받은 날 값(r*) → 내 세계 좌표(t*) · 마을·실내 = ×SCL · 방향 = h−100 · 머리표 없는데 |h|>50 = 보이지 않는 곳(NET-OOB) · 자리 소식이면 속도(앞질러 그리기)
  function retarget(O, pos) { const f = O.w === 's' ? 1 : SCL, now = performance.now(), nx = O.rx * f, ny = O.ry * f, nz = O.rz * f;
    if (pos) { const dtR = (now - O.rt) / 1000; if (O.rt && dtR > 0.05 && dtR < 2) { O.vx = Math.max(-12, Math.min(12, (nx - O.tx) / dtR)); O.vz = Math.max(-12, Math.min(12, (nz - O.tz) / dtR)); } else { O.vx = O.vz = 0; } O.rt = now; }
    O.tx = nx; O.ty = ny; O.tz = nz;
    if (O.w !== 's') { if (O.rh > 90 && O.rh < 110) { O.away = false; O.th = O.rh - 100; } else O.away = Math.abs(O.rh) > 50; }
    else if (Math.abs(O.rh) > 50) O.away = true; else { O.away = false; O.th = O.rh; } }
  function upsert(pid, d) {
    if (pid === id) { if (d && typeof d.t === 'number') offset = d.t - Date.now(); return; }
    if (!d) { drop(pid); return; }
    let O = others.get(pid);
    if (!O) {
      if (others.size >= 40) return;
      const mesh = avatar(d.k || kind, PAL.includes(d.c) ? d.c : PAL[0]), tg = tag(d.n || '친구');
      O = { pid, a: '', w: 's', cell: '', v: '', lbl: '', rx: 0, ry: 0, rz: 0, rh: 0, vx: 0, vz: 0, rt: 0, vis: false, mrx: 0, mrz: 0, mry: 0, mdy: 0, k: d.k || kind, away: false, mo: null, mesh, tag: tg, n: d.n || '친구', c: PAL.includes(d.c) ? d.c : PAL[0], x: d.x || 0, y: d.y || 0, z: d.z || 0, h: d.h || 0, tx: 0, ty: 0, tz: 0, th: 0, t: 0, seen: performance.now(), fxQ: d.fx ? d.fx.q : 0, mQ: d.m ? d.m.q : 0, em: null };
      scene.add(mesh, tg); others.set(pid, O); onChange();
    }
    if (typeof d.a === 'string' && d.a !== O.a) { O.a = d.a; const q9 = parseAct(d.a); O.w = q9.w; O.cell = q9.cell; O.v = q9.v; O.lbl = q9.label; retarget(O, false); }   // TOGETHER-0: 머리표 = 세계(먼저 읽어 같은 소식의 자리를 바로 풂)
    let pos9 = false; for (const k of ['x', 'y', 'z']) if (typeof d[k] === 'number') { O['r' + k] = d[k]; pos9 = true; }
    if (typeof d.h === 'number') O.rh = d.h;
    if (pos9 || typeof d.h === 'number') retarget(O, pos9);   // NET-OOB(h 99)·마을(h 100+) 풀기는 retarget
    if (typeof d.k === 'string' && d.k !== O.k) { O.k = d.k; const g = avatarGeo(d.k, O.c); O.mesh.geometry.dispose(); O.mesh.geometry = g; }   // LOOK-1: 친구가 모습을 바꿈
    if (typeof d.t === 'number') O.t = d.t;
    if (d.n && d.n !== O.n) { O.n = d.n; scene.remove(O.tag); O.tag.material.map.dispose(); O.tag = tag(O.n); scene.add(O.tag); onChange(); }
    if (d.fx && d.fx.q !== O.fxQ) { O.fxQ = d.fx.q; if (o.onFx && O.seen) o.onFx(O, d.fx); }
    if (d.m && d.m.q !== O.mQ) { O.mQ = d.m.q; if (!MUTE.has(pid)) { const i9 = Math.max(0, Math.min(EMOTES.length - 1, d.m.i | 0)); O.em = emoteSprite(O.em, i9); O.mo = { i: i9, t: 0, dur: MO_DUR[i9] || 1.6 }; O.mi = i9; O.mt = performance.now(); if (myE && myE.i === i9 && O.mt - myE.t < 3000) combo(O, i9); } }   // EMOTE-2 · SAFE-1 🙈
    O.seen = performance.now();
  }
  function onEvt(type, e) {
    let msg; try { msg = JSON.parse(e.data); } catch (er) { return; }
    const path = (msg.path || '/').split('/').filter(Boolean), data = msg.data;
    if (!path.length) {
      if (type === 'put') { players('put', [], data && data.players || null); ctlEvt('put', [], data && data.ctl || null); }
      else if (data) for (const k in data) route('put', k.split('/').filter(Boolean), data[k]);
    } else route(type, path, data);
  }
  function route(type, path, data) { if (path[0] === 'players') players(type, path.slice(1), data); else if (path[0] === 'ctl') ctlEvt(type, path.slice(1), data); else if (path[0] === 'chat') chatEvt(type, path.slice(1), data); }
  // 채팅(CHAT-1): rooms/<room>/chat/<id> = {n, by, tx, t} · 들어온 뒤의 새 말만 알림(o.onChat) + 말한 사람 머리 위 말풍선 5초
  function chatEvt(type, path, data) {
    if (type === 'put') CHAT = setAt(CHAT, path, data); else if (data) for (const k in data) CHAT = setAt(CHAT, [...path, ...k.split('/').filter(Boolean)], data[k]);
    const fresh = [];
    for (const cid in CHAT) { const m = CHAT[cid]; if (!m || chatSeen.has(cid) || typeof m.tx !== 'string') continue; chatSeen.add(cid); if (typeof m.t === 'number' && m.t < chatT0 + offset - 3000) continue; fresh.push(m); }
    fresh.sort((a, b) => (a.t || 0) - (b.t || 0));
    for (const m of fresh) { if (MUTE.has(m.by)) continue; if (m.by === id) selfB = bubble(selfB, m.tx); else { const O = others.get(m.by); if (O) O.sb = bubble(O.sb, m.tx); } if (o.onChat) o.onChat(m); }   // SAFE-1 🙈: 숨긴 친구 말은 말풍선·대화창 모두 X
    if (!Object.keys(CHAT).length && o.onChat) o.onChat(null);   // 비움(선생님 🧹)
  }
  function bubble(old, tx) {
    let B = old; if (!B) { B = { s: new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })), t: 0, c: document.createElement('canvas') }; B.c.width = 512; B.c.height = 128; B.s.scale.set(2.4, 0.6, 1); scene.add(B.s); }
    const g = B.c.getContext('2d'); g.clearRect(0, 0, 512, 128); g.font = '700 30px sans-serif';
    const words = String(tx), lines = []; let cur = '';
    for (const ch of words) { if (g.measureText(cur + ch).width > 460) { lines.push(cur); cur = ch; if (lines.length === 2) break; } else cur += ch; } if (lines.length < 2 && cur) lines.push(cur);
    const w = Math.min(500, Math.max(...lines.map((l) => g.measureText(l).width)) + 36), h = 26 + lines.length * 38;
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.roundRect((512 - w) / 2, 4, w, h, 18); g.fill(); g.strokeStyle = '#1d3557'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#1d3557'; g.textAlign = 'center'; g.textBaseline = 'top'; lines.forEach((l, i) => g.fillText(l, 256, 16 + i * 38));
    if (B.s.material.map) B.s.material.map.dispose(); B.s.material.map = new THREE.CanvasTexture(B.c); B.s.material.map.colorSpace = THREE.SRGBColorSpace; B.s.material.needsUpdate = true; B.t = 5; B.s.visible = true; return B;
  }
  function bubbleTick(B, dt, x, y, z) { if (!B || B.t <= 0) { if (B) B.s.visible = false; return; } B.t -= dt; B.s.position.set(x, y + 2.75 * scale, z); B.s.material.opacity = Math.min(1, B.t * 2); B.s.visible = B.t > 0 && !hidden; }
  function ctlEvt(type, path, data) {
    if (type === 'put') CTL = setAt(CTL, path, data); else if (data) for (const k in data) CTL = setAt(CTL, [...path, ...k.split('/').filter(Boolean)], data[k]);
    if (o.onCtl) o.onCtl(CTL);
  }
  function players(type, path, data) {
    if (!path.length) {
      if (type === 'put') { for (const pid of [...others.keys()]) if (!data || !data[pid]) drop(pid); }
      if (data) for (const pid in data) upsert(pid, data[pid]);
    } else if (path.length === 1) {
      if (type === 'put' || data === null) { if (data === null) upsert(path[0], null); else { const O = others.get(path[0]); upsert(path[0], data); if (O && type === 'put') O.seen = performance.now(); } }
      else upsert(path[0], data);
    } else upsert(path[0], { [path[1]]: data });
  }
  function req(path, method, data) { return fetch(base + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then((r) => { if (r.status === 401 && o.onDenied && !dead && Date.now() - denyT > 20000) { denyT = Date.now(); o.onDenied(); } }).catch(() => {}); }   // 401 = 방이 닫힘·끝남(DB 규칙) · NET-OOB: 확인은 20초에 한 번만(예전 = 거절마다 GET 2번)
  const inRule = (P) => P.x > -499 && P.x < 499 && P.z > -499 && P.z < 499 && P.y > -99 && P.y < 199;   // NET-OOB: DB 규칙(x·z ±500 · y −100~200) 안
  const cl = (v, a) => +Math.max(-a, Math.min(a, v || 0)).toFixed(2);
  const myK = () => (kind === 'kid' ? lookCode() || 'kid' : kind);   // LOOK-1
  const EP = { x: 0, y: 0, z: 0, h: 0 };   // TOGETHER-0: 보낼 값(마을·실내 = ÷SCL · h = 100 + 방향) — 매번 새 객체 X
  const enc = (P) => { const W9 = myW(), f = W9 ? SCL : 1; EP.x = P.x / f; EP.y = P.y / f; EP.z = P.z / f; EP.h = W9 ? 100 + Math.atan2(Math.sin(P.h), Math.cos(P.h)) : P.h; return EP; };
  const actNow = () => { const W9 = myW(); return fit20((W9 ? W9.w + (W9.v ? '.' + W9.v : '') + ' ' : '') + act); };
  const actPut = () => { const a9 = actNow(); if (a9 === actSent || !joined) return; actSent = a9; req('/players/' + id + '/a', 'PUT', a9); };
  function send(P0, extra) { const P = enc(P0);
    if (!inRule(P)) { req('/players/' + id, 'PATCH', { h: 99, t: { '.sv': 'timestamp' } }); away = true; last.x = P0.x; last.y = P0.y; last.z = P0.z; last.h = P0.h; return; }   // NET-OOB: 위치는 안 보냄 · 살아 있음 + '보이지 않는 곳'만
    away = false; const d = { x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), h: +P.h.toFixed(2), t: { '.sv': 'timestamp' }, ...extra };
    req('/players/' + id, 'PATCH', d); last.x = P0.x; last.y = P0.y; last.z = P0.z; last.h = P0.h;
  }
  function join(P0) { const P = enc(P0); wq = myW() ? myW().q : -1;
    const ok = inRule(P); away = !ok;   // NET-OOB: 범위 밖에서 들어오면 자리는 범위 안으로 자르고 h 99(숨김)
    req('/players/' + id, 'PUT', { n: name, c: color, k: myK(), x: cl(P.x, 498), y: +Math.max(-98, Math.min(198, P.y || 0)).toFixed(2), z: cl(P.z, 498), h: ok ? +(P.h || 0).toFixed(2) : 99, a: actSent = actNow(), t: { '.sv': 'timestamp' } });
    es = new EventSource(base + '.json');
    es.addEventListener('put', (e) => onEvt('put', e)); es.addEventListener('patch', (e) => onEvt('patch', e));
  }
  const onLook = () => { if (joined && !dead && kind === 'kid') req('/players/' + id, 'PATCH', { k: myK() }); };   // LOOK-1: 모습을 바꾸면 옷 코드만 한 번
  addEventListener('sm-look', onLook);
  const leave = () => { if (dead) return; dead = true; removeEventListener('sm-look', onLook); if (es) es.close(); req('/players/' + id, 'DELETE'); for (const pid of [...others.keys()]) drop(pid); if (selfE) { scene.remove(selfE.s); selfE.s.material.dispose(); } for (const t of ETEX) if (t) t.dispose(); removeEventListener('pagehide', leave); if (selfB) { scene.remove(selfB.s); if (selfB.s.material.map) selfB.s.material.map.dispose(); selfB.s.material.dispose(); selfB = null; } mat.dispose(); };   /* FIX-CX8(코덱스 점검): 방을 나갈 때 pagehide 리스너·내 말풍선·공유 재질도 치움(들고 나기를 되풀이하면 쌓이던 것) */
  addEventListener('pagehide', leave);
  let joined = false;
  return {
    get id() { return id; }, get name() { return name; }, get color() { return color; }, get away() { return away; }, get kindCode() { return myK(); },
    get count() { let n = 1; const now = Date.now() + offset; for (const O of others.values()) if (now - O.t < 20000) n++; return n; },
    get names() { const now = Date.now() + offset, a = []; for (const O of others.values()) if (now - O.t < 20000) a.push(O.n); return a; },
    setName(v) { v = String(v || '').replace(/[<>]/g, '').trim().slice(0, 8); if (!v || joined || !checkChat(v).ok) return false; /* SAFE-1: 거르개 · 방에 들어간 뒤(이름표가 친구들에게 보인 뒤)엔 못 바꿈 */ name = v; try { localStorage.setItem('mp.name', v); } catch (e) { /* */ } if (joined) req('/players/' + id, 'PATCH', { n: v }); onChange(); },
    fx(f) { fxQ++; if (joined) req('/players/' + id + '/fx', 'PUT', { q: fxQ, ...f }); },
    tick(dt, P) {
      if (dead || !P) return;
      if (!joined) { joined = true; join(P); }
      sendT -= dt; beatT -= dt;
      const moved = Math.abs(P.x - last.x) + Math.abs(P.z - last.z) + Math.abs(P.y - last.y) > 0.05 || Math.abs(P.h - last.h) > 0.08;
      { const W9 = myW(), q9 = W9 ? W9.q : -1; if (q9 !== wq) { wq = q9; actPut(); sendT = 0; } }   // TOGETHER-0: 세계·탈것이 바뀌면 머리표를 바로 + 자리도 바로
      if ((moved && sendT <= 0 && (inRule(enc(P)) || !away)) || beatT <= 0) { send(P); sendT = Math.max(1 / 6, (others.size + 1) / 60); beatT = 5; }   // TOGETHER-0 예산: 방 전체 초당 60번을 나눔 · 가만히면 5초 · NET-OOB: 범위 밖이면 움직여도 5초마다(처음 나갈 때 한 번은 바로)
      const now = Date.now() + offset, k = Math.min(1, dt * 12), pn = performance.now(), mw = wKey(myW() ? myW().w : 's');
      meP = P; emoteTick(selfE, dt, P.x, P.y - 0.25, P.z); bubbleTick(selfB, dt, P.x, P.y - 0.25, P.z);
      for (const O of others.values()) {
        const stale = O.t && now - O.t > 20000; O.vis = !stale && !hidden && !O.away && wKey(O.w) === mw; O.mesh.visible = O.tag.visible = O.vis && !ext;   // TOGETHER-0: 같은 세계만 · 마을(ext)은 마을 그리개가 그림
        if (!O.vis) { if (O.em) O.em.s.visible = false; if (O.sb) O.sb.s.visible = false; } else { emoteTick(O.em, dt, O.x, O.y, O.z); bubbleTick(O.sb, dt, O.x, O.y, O.z); }
        { const age = Math.min(0.45, (pn - O.rt) / 1000), gx = O.tx + O.vx * age, gz = O.tz + O.vz * age;   // NET-SMOOTH(걷기에도): 받은 두 자리의 속도로 앞질러 · 10m 넘게 어긋나면 바로
          if (Math.abs(gx - O.x) + Math.abs(gz - O.z) > 10 || Math.abs(O.ty - O.y) > 6) { O.x = gx; O.y = O.ty; O.z = gz; } else { O.x += (gx - O.x) * k; O.y += (O.ty - O.y) * k; O.z += (gz - O.z) * k; } }
        let dh = O.th - O.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); O.h += dh * k;
        O.mesh.position.set(O.x, O.y, O.z); O.mesh.rotation.y = O.h; if (O.mo) O.mesh.position.y += moTick(O, dt); O.tag.position.set(O.x, O.y + 2.05 * scale, O.z);   // EMOTE-2 몸짓(도는 동안만)
      }
      if ((cleanT -= dt) <= 0) { cleanT = 30; for (const [pid, O] of others) if (O.t && now - O.t > 120000) { req('/players/' + pid, 'DELETE'); drop(pid); } }
    },
    say(tx) { if (!joined) return Promise.resolve(false); const cid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const ids = Object.keys(CHAT).sort((a, b) => ((CHAT[a] || {}).t || 0) - ((CHAT[b] || {}).t || 0)); for (const old of ids.slice(0, Math.max(0, ids.length - 39))) req('/chat/' + old, 'DELETE');   // 40개만 남김
      return fetch(base + '/chat/' + cid + '.json', { method: 'PUT', body: JSON.stringify({ n: name, by: id, tx, t: { '.sv': 'timestamp' } }) }).then((r) => r.ok); },
    clearChat() { return req('/chat', 'DELETE'); },
    get chat() { return Object.values(CHAT).filter((m) => m && typeof m.tx === 'string' && !MUTE.has(m.by)).sort((a, b) => (a.t || 0) - (b.t || 0)); },
    setAct(v) { act = String(v || '').slice(0, 20); actPut(); },   // 지금 하는 것(👥 창에서 선생님이 봄) · TOGETHER-0: 마을·실내면 앞에 머리표
    emote(i) { i = Math.max(0, Math.min(EMOTES.length - 1, i | 0)); myE = { i, t: performance.now() }; if (!joined) return; mQ++; req('/players/' + id + '/m', 'PUT', { q: mQ, i }); selfE = emoteSprite(selfE, i);
      for (const O of others.values()) if (O.mi === i && myE.t - (O.mt || -1e9) < 3000) combo(O, i); },   // EMOTE-2: 친구가 먼저 한 같은 이모트와 맞춤
    mute(pid, on) { const O = others.get(pid); if (on) { MUTE.add(pid); if (O) { if (O.em) O.em.t = 0; if (O.sb) O.sb.t = 0; O.mo = null; O.mesh.rotation.x = O.mesh.rotation.z = 0; } } else MUTE.delete(pid); try { sessionStorage.setItem('mp.mute', JSON.stringify([...MUTE])); } catch (e) { /* */ } onChange(); },   // SAFE-1 🙈(이 탭에서 나에게만)
    muted: (pid) => MUTE.has(pid),
    peers() { const now = Date.now() + offset, a = [], mw = wKey(myW() ? myW().w : 's'); if (!hidden) for (const O of others.values()) if (!(O.t && now - O.t > 20000) && !O.away && wKey(O.w) === mw) a.push({ id: O.pid, mu: MUTE.has(O.pid), x: O.x, y: O.y, z: O.z, act: O.a, label: O.n, color: '#' + O.c.toString(16).padStart(6, '0'), r: 4, floor: O.y > 2.5 ? 2 : 1 }); return a; },
    ctl(path, data) { return req('/ctl/' + path, 'PUT', data); },
    get ctlData() { return CTL; },
    roster() { const now = Date.now() + offset, a = []; for (const [id, O] of others) if (!(O.t && now - O.t > 20000)) a.push({ id, label: O.n, act: O.w === 's' ? O.a : O.lbl, color: O.c, k: O.k, mu: MUTE.has(id), w: O.w, v: O.v, cell: O.cell }); return a; },   // TOGETHER-0: act = 머리표 뺀 글(방 놀이 비교)
    // TOGETHER-0 👥 목록: 모든 친구(다른 세계는 '📍 마을 다7' · 곁으로 X)
    friends() { const now = Date.now() + offset, a = [], mw = wKey(myW() ? myW().w : 's'); for (const O of others.values()) { if (O.t && now - O.t > 20000) continue; const here = wKey(O.w) === mw && !O.away; a.push({ id: O.pid, label: O.n, here, mu: MUTE.has(O.pid), x: O.x, y: O.y, z: O.z, color: '#' + O.c.toString(16).padStart(6, '0'), act: here ? (O.w === 's' ? O.a : O.lbl) : placeText(O) + (O.w === 's' && O.a ? ' · ' + O.a : '') }); } return a; },
    ext(on) { ext = !!on; },   // 마을 그리개가 몸·이름표를 대신 그림(이모지·말풍선은 그대로)
    each(fn) { for (const O of others.values()) if (O.vis) fn(O); },   // 같은 세계에 보이는 친구(읽기만 — 매 프레임 새 객체 X)
    get sendEvery() { return Math.max(1 / 6, (others.size + 1) / 60); },   // ROOM-2: 경기 중(hide)에도 같은 방 친구 명단
    hide(on) { hidden = !!on; for (const O of others.values()) O.mesh.visible = O.tag.visible = !hidden && !O.away; },   // 물총 친구 대결 동안 걷기 몸 숨김(경기 몸이 대신)
    leave,
  };
}
