// 동시 접속(MP-1 · 10-03) — Firebase 실시간 DB(class-rpg) REST + EventSource. SDK 없음 · 홍보판(SM_PROMO)에서는 부르지 않는다.
//   방 = metaverse/rooms/<room>/players/<id> = { n 이름, c 색, k 모양, x, y, z, h, t 서버시각, fx? }
//   보내기: 움직이면 초당 6번 · 가만히 있으면 3초마다 · 받기: 방 한 갈래(rooms/<room>)를 스트림 하나로 — players + ctl(선생님 신호·물총 대기실) · 20초 넘게 소식 없는 사람은 숨기고 2분 넘으면 지움
//   NET-2(10-03): 이모지 인사(players/<id>/m = {q, i} — 정해진 그림만 · 3초 머리 위) · 미니맵 친구 점(peers()) · ctl = 방 신호(o.onCtl) — 연결 하나로 합침(무료 요금제 동시 연결 100)
import { lookCode, parseLook, lookColors } from './look.js?v=1';   // LOOK-1(10-17): 내 모습 옷 코드 = players k('L' + 숫자 다섯 · 8자 이하 — 규칙 그대로) · 기본 모습이면 예전처럼 'kid'
//   NET-OOB(10-17): DB 규칙 범위(x·z ±500 · y −100~200) 밖(마을 대부분)이면 위치를 보내지 않고 3초마다 {h: 99, t}만(= '보이지 않는 곳' 표시 — 받는 화면은 숨김) · 401(쓰기 거절) → onDenied(방 닫힘 확인)는 20초에 한 번만
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app';
// NET-CF2(최종 차례 8 · 사용자 10-24 '함께하기 실시간'): 자리·방향만 Cloudflare 방 서버(웹소켓 · server/cf-rooms)로 — 방 번호·대기실·이름·채팅·선생님 칸은 Firebase 그대로
//   움직일 때만 초당 10번 · 받은 자리는 100ms 늦게 두 자리 사이를 섞어 그림(보간) · 내 몸은 늘 바로(예측) · 서버엔 이름을 보내지 않음 · 끊기면 예전 Firebase 길로 저절로
//   ?cf=off = 끔 · ?cf=http://127.0.0.1:포트 = 로컬 wrangler dev · 홍보판(SM_PROMO)은 끔
const CF_WS = (() => { try { if (window.SM_PROMO) return ''; const q = new URLSearchParams(location.search).get('cf'); if (q === 'off') return ''; if (q && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(q)) return q.replace(/^http/, 'ws'); return 'wss://sm-rooms.sm-rooms.workers.dev'; } catch (e) { return ''; } })();
// NET-CF3(11-14 교사 '클라우드플레어로 가기 + 멀티접속 ㄱ' · 30명이 한꺼번에): 웹소켓 명단만으로도 친구를 그림 — 들어올 때 이름 없이 모양 칸만(k 옷 코드 · c 색 번호 · a 세계 머리표 't:다7.b'·'i:12'·'' 학교) · Firebase 명단이 오면 이름·나머지를 합침(이름 없는 동안은 이름표 X · 목록엔 '친구')
//   보내기 빈도 = 방 사람 수 따라 8명까지 초당 10번 · 16명까지 6번 · 그보다 많으면 4번(방 놀이·대결 중엔 10번 그대로 · 멈추면 마지막 자리 한 번 보내고 끝 · 탭이 가려지면 X) · 섞어 그리는 지연 = 친구마다 받은 간격으로(10번 100 — CLASS-MP 11-14 되돌림 · 6번 250 · 4번 375ms · 천천히 옮김)
//   핑 = 들어와서 1초 간격 세 번 → 그 뒤 5초에 한 번, 방이 조용할 때만({"t":"ping"} = 서버 자동 답 · 방을 안 깨움) · 답 없는 핑 세 번 = 닫고 다시 · 꽉 참(4002 하루 · 4003 40명) = 글 한 번 + 다시 안 붙음 · 4000(같은 id 새 탭) = 다시 안 붙음 → 그 뒤는 예전 Firebase 길
/* CLASS-MP(11-14 · 반 코드로 저절로 함께): o.cls = { r 반 방, tk() 입장표, lab(u) 머리 위 글 '7번', note(k) } 이면 Firebase를 하나도 안 씀(명단·박동·이모트·채팅 X) — 웹소켓 반 방만 · 이름 대신 번호 · 이모트 = {t:'e', m} · 웹소켓 명단에 있는 동안은 안 숨김 · 4004 표가 틀림 · 4005 같은 번호가 다른 기기에서 들어옴 */
const CELL_RX = /^(?:(?:[가-힣]|[A-Z]{1,2})\d{1,2}|\d{1,2}(?:[가-힣]|[A-Z]{1,2}))$/;   /* 서버로 보내는 칸 이름 = 이 꼴만(그 밖은 빈칸 — 자유 글이 실리지 않게) */
let fullSaid = false;   /* '꽉 찼어요' 글은 한 번만 */
function fullNote() { if (fullSaid) return; fullSaid = true; try { const el = document.getElementById('toast'); if (!el) return; const M9 = '오늘은 함께하기가 꽉 찼어요. 혼자서는 그대로 놀 수 있어요', T9 = document.body.classList.contains('title-on'); el.classList.toggle('ttl-keep', T9); el.style.zIndex = T9 ? '45' : ''; el.textContent = M9; el.style.display = ''; let n9 = 0;
  const iv = setInterval(() => { if (el.textContent !== M9) { clearInterval(iv); return; } if (++n9 >= 20) { clearInterval(iv); el.style.display = 'none'; } else el.style.display = ''; }, 250); } catch (e) { /* 알림 틀이 없는 쪽 */ } }   /* 있는 알림 틀(#toast)에 5초 — 그사이 다른 알림이 오면 그쪽에 넘김 */
const wsRoomOf = r => { let h = 5381; for (const ch of String(r)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return ('m' + h.toString(36) + 'xxxx').slice(0, 8); };   // 방 서버 이름 = 영문·숫자 4~8자
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
  const { THREE, scene, room, kind = 'kid', scale = 1 } = o, CLS = o.cls || null;
  const base = DB + '/metaverse/rooms/' + encodeURIComponent(room);
  const born = Date.now(); let offOk = false, selfFx = null;   /* HOST-1: 이 방에 들어온 때(이 기기 시계) · 서버 시각 차(offset)를 알았나 · 내 fx 칸이 서버에 있는 모양(되돌아온 것) */
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
  let ws = null, wsOk = false, wsBack = 1, wsOff = null, wsSendT = 0, wsGone = false, wsN = 0, tkSent = '';   /* NET-CF2 */
  const wsIn = new Set(), wl = { x: 1e9, y: 0, z: 0, h: 0 }; let fbAt = -1e9, mT = 0, mDirty = false, mSent = '', pingT = 1, pingN = 0, pingAt = 0, pingMiss = 0, rtt = null, rxAt = 0;   /* NET-CF3: 웹소켓 명단(나 빼고) · 웹소켓으로 마지막에 보낸 자리 · Firebase 소식 받은 때 · 모양 칸 알림 · 핑 */
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
    if (o.onCombo) o.onCombo({ x: O.x, y: O.y, z: O.z, label: O.n || '친구' }, i, kd);
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
  /* NET-CF3: 친구 하나 만들기(Firebase 명단 · 웹소켓 명단 둘 다 이것으로) — ws 웹소켓 명단에 있음 · fb Firebase 자료를 받음 · has 자리를 한 번이라도 받음(그 전엔 안 그림) · iv 받은 간격 어림 · dl 섞어 그리는 지연 */
  function mk(pid, k9, c9, n9) { const mesh = avatar(k9, c9), tg = tag(n9);
    const O = { pid, a: '', w: 's', cell: '', v: '', lbl: '', rx: 0, ry: 0, rz: 0, rh: 0, vx: 0, vz: 0, rt: 0, vis: false, mrx: 0, mrz: 0, mry: 0, mdy: 0, k: k9, away: false, mo: null, mesh, tag: tg, n: n9, c: c9, x: 0, y: 0, z: 0, h: 0, tx: 0, ty: 0, tz: 0, th: 0, t: 0, seen: performance.now(), fxQ: 0, mQ: 0, em: null, B: new Float64Array(24), Bn: 0, Bh: 0, wsAt: 0, ws: false, fb: false, has: false, wsSeen: 0, lts: 0, iv: 100, dl: 100 };   /* NET-CF2 B = 받은 자리 여섯 [ts,x,y,z] 고리 */
    mesh.visible = tg.visible = false; scene.add(mesh, tg); others.set(pid, O); onChange(); return O; }
  function relook(O, k9, c9) { if (k9 === O.k && c9 === O.c) return; O.k = k9; O.c = c9; const g = avatarGeo(k9, c9); O.mesh.geometry.dispose(); O.mesh.geometry = g; }   // LOOK-1: 친구가 모습을 바꿈(NET-CF3: 색도 같이)
  function upsert(pid, d, full) {   /* full = 그 사람 자료 전체(빠진 칸 = 없음) · 아니면 바뀐 칸만 */
    if (pid === id) { if (d && typeof d.t === 'number') { offset = d.t - Date.now(); offOk = true; } if (d && (full || 'fx' in d)) selfFx = d.fx && typeof d.fx === 'object' && 'q' in d.fx ? d.fx : null; return; }
    if (!d) { const O9 = others.get(pid); if (O9 && O9.ws) { if (O9.t && Date.now() + offset - O9.t > 20000) O9.wsSeen = -1e9; O9.fb = false; } else drop(pid); return; }   /* NET-CF3: 웹소켓 명단에 있는 친구는 Firebase 자료가 지워져도 남김(오래 소식 없던 자료가 지워진 것이면 새 웹소켓 소식이 올 때까지 숨김) */
    let O = others.get(pid);
    if (!O) {
      if (others.size >= 40) return;
      O = mk(pid, d.k || kind, PAL.includes(d.c) ? d.c : PAL[0], d.n || '친구');
      if (wsIn.has(pid)) { O.ws = true; O.wsSeen = performance.now(); }   /* NET-CF3: 웹소켓 명단에 먼저 와 있던 친구(모양 칸 없는 옛 화면) */
    }
    if (!O.fb) { O.fb = true; if (d.fx) O.fxQ = d.fx.q; if (d.m) O.mQ = d.m.q; }   /* 처음 받은 자료의 효과·이모트는 지난 것(다시 틀지 않음 — 예전 그대로) */
    if (typeof d.a === 'string' && d.a !== O.a) { O.a = d.a; const q9 = parseAct(d.a); if (wKey(q9.w) !== wKey(O.w)) { O.Bn = 0; O.lts = 0; } O.w = q9.w; O.cell = q9.cell; O.v = q9.v; O.lbl = q9.label; retarget(O, false); }   // TOGETHER-0: 머리표 = 세계(먼저 읽어 같은 소식의 자리를 바로 풂)
    let pos9 = false; for (const k of ['x', 'y', 'z']) if (typeof d[k] === 'number') { O['r' + k] = d[k]; pos9 = true; }
    if (typeof d.h === 'number') O.rh = d.h;
    if (pos9 || typeof d.h === 'number') retarget(O, pos9);   // NET-OOB(h 99)·마을(h 100+) 풀기는 retarget
    if (pos9 && !O.has) { O.has = true; O.x = O.tx; O.y = O.ty; O.z = O.tz; if (!O.away) O.h = O.th; }   /* 처음 받은 자리 = 바로 그 자리에(멀리서 미끄러져 오지 않게) */
    relook(O, typeof d.k === 'string' ? d.k : O.k, PAL.includes(d.c) ? d.c : O.c);
    if (typeof d.t === 'number') O.t = d.t;
    if (d.n && d.n !== O.n) { O.n = d.n; scene.remove(O.tag); O.tag.material.map.dispose(); O.tag = tag(O.n); scene.add(O.tag); onChange(); }
    if (full || 'fx' in d) { const f9 = d.fx; if (!f9 || (typeof f9 === 'object' && 'q' in f9)) O.fxD = f9 || null; }   /* HOST-1: 마지막 fx 칸 통째(방장 시계 · 아래 fxPeers) — fx 안쪽 조각 소식은 버림(늘 통째로 씀) */
    if (d.fx && d.fx.q !== O.fxQ) { O.fxQ = d.fx.q; if (o.onFx && O.seen) o.onFx(O, d.fx); }
    if (d.m && d.m.q !== O.mQ) { O.mQ = d.m.q; emoIn(O, d.m.i); }   // EMOTE-2 · SAFE-1 🙈
    O.seen = performance.now();
  }
  function emoIn(O, i) { if (MUTE.has(O.pid)) return; const i9 = Math.max(0, Math.min(EMOTES.length - 1, i | 0)); O.em = emoteSprite(O.em, i9); O.mo = { i: i9, t: 0, dur: MO_DUR[i9] || 1.6 }; O.mi = i9; O.mt = performance.now(); if (myE && myE.i === i9 && O.mt - myE.t < 3000) combo(O, i9); }   // EMOTE-2 · SAFE-1 🙈 · CLASS-MP: 웹소켓 {t:'e', m}도 이것으로
  function onEvt(type, e) {
    let msg; try { msg = JSON.parse(e.data); } catch (er) { return; }
    fbAt = performance.now();   /* NET-CF3: Firebase 스트림이 살아 있음(내 5초 박동도 되돌아오므로 15초 넘게 조용하면 죽은 것) */
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
      if (type === 'put') { for (const pid of [...others.keys()]) if (!data || !data[pid]) { const O9 = others.get(pid); if (O9.ws) O9.fb = false; else drop(pid); } }   /* NET-CF3: 웹소켓 명단에 있는 친구는 남김 */
      if (data) for (const pid in data) upsert(pid, data[pid], true);
    } else if (path.length === 1) {
      if (type === 'put' || data === null) { if (data === null) upsert(path[0], null); else { const O = others.get(path[0]); upsert(path[0], data, type === 'put'); if (O && type === 'put') O.seen = performance.now(); } }
      else upsert(path[0], data);
    } else upsert(path[0], { [path[1]]: data });
  }
  function req(path, method, data) { if (CLS) return Promise.resolve(); return fetch(base + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then((r) => { if (r.status === 401 && o.onDenied && !dead && Date.now() - denyT > 20000) { denyT = Date.now(); o.onDenied(); } }).catch(() => {}); }   // 401 = 방이 닫힘·끝남(DB 규칙) · NET-OOB: 확인은 20초에 한 번만(예전 = 거절마다 GET 2번)
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
  // NET-CF2 웹소켓: 들어올 때 이름 없이 id만 · 's'·'w' 자리 묶음 → 그 친구 O · 끊기면 2·4·8…30초 뒤 다시 · NET-CF3: 명단('w'의 L · 'j' · 'm' · 'l')만으로도 친구를 만듦
  const wsTag = () => { const W9 = myW(); if (!W9) return ''; const w9 = String(W9.w), v9 = /^[bokz]$/.test(W9.v || '') ? '.' + W9.v : ''; if (w9[0] === 't') return 't:' + (CELL_RX.test(w9.slice(2)) ? w9.slice(2) : '') + v9; return /^i:\d{1,3}$/.test(w9) ? w9 + v9 : null; };   /* 서버로 가는 세계 머리표(정해진 꼴만 — 활동 글은 싣지 않음 · 모르는 꼴이면 null = Firebase 길로만) */
  const wsIvl = () => { const n9 = wsIn.size + 1; return n9 <= 8 || hidden || (window.SM_MP && window.SM_MP.roomRun && window.SM_MP.roomRun()) ? 0.1 : n9 <= 16 ? 1 / 6 : 0.25; };   /* 보내기 간격: 8명까지 10번 · 16명까지 6번 · 그보다 많으면 4번 · 방 놀이·대결(몸 숨김) 중엔 10번 그대로 */
  const live = (O, now, pn) => ((O.ws && (CLS || !O.fb || pn - fbAt > 15000)) ? CLS || pn - O.wsSeen < 300000 : !(O.t && now - O.t > 20000));   /* CLASS-MP: 반 방은 웹소켓 명단에 있는 동안 늘 살아 있음(가만히 있어도 안 숨김) */   /* 살아 있음: Firebase 자료가 없거나 스트림이 죽었으면 웹소켓 명단(5분 안에 소식) · 그 밖엔 예전 20초 규칙 */
  function wsMem(pid, k9, c9, a9, u9) { if (typeof pid !== 'string' || pid === id) return; wsIn.add(pid); let O = others.get(pid);
    if (!O) { if (typeof a9 !== 'string' || others.size >= 40) return;   /* 모양 칸이 없는 옛 화면·옛 서버 = Firebase 명단이 올 때까지 기다림(예전 그대로) */
      O = mk(pid, typeof k9 === 'string' ? k9 : 'kid', PAL[Number.isInteger(c9) && c9 >= 0 && c9 < PAL.length ? c9 : [...pid].reduce((q, ch) => q + ch.charCodeAt(0), 0) % PAL.length], ''); }
    O.ws = true; O.wsSeen = performance.now();
    if (typeof k9 === 'string') relook(O, k9, O.c);
    if (CLS && Number.isInteger(u9) && u9 >= 1 && u9 <= 40) { const n9 = CLS.lab(u9); if (n9 !== O.n) { O.n = n9; scene.remove(O.tag); O.tag.material.map.dispose(); O.tag.material.dispose(); O.tag = tag(n9); scene.add(O.tag); onChange(); } }   /* CLASS-MP: 머리 위 = 번호(서버가 입장표에서 읽은 u) */
    if (typeof a9 === 'string') { const q9 = parseAct(a9 + ' '); if (q9.w !== O.w || q9.v !== O.v || (q9.cell && q9.cell !== O.cell)) { if (wKey(q9.w) !== wKey(O.w)) { O.Bn = 0; O.lts = 0; } O.w = q9.w; O.v = q9.v; if (q9.cell || !O.fb) O.cell = q9.cell; retarget(O, false); } }
    else if (!O.fb) O.w = 'i:?';   /* 세계를 모르는 친구(Firebase 자료도 없음) = 어느 세계에도 안 그림 */
  }
  function wsLost() { for (const pid of [...wsIn]) { const O = others.get(pid); if (!O) continue; O.ws = false; if (!O.fb) drop(pid); } wsIn.clear(); }   /* 내 웹소켓이 닫힘 = 웹소켓 명단을 믿지 않음(Firebase로 아는 친구만 남김) */
  function wsPos(p, ts) { const O = others.get(p[0]); if (!O || p[0] === id) return; O.rx = p[1]; O.ry = p[2]; O.rz = p[3]; O.rh = p[4]; retarget(O, true); O.vx = O.vz = 0;   /* 속도 0 = 멈춘 뒤 앞으로 미끄러지지 않게(웹소켓 자리는 두 자리 사이를 섞어 그림) */
    if (!O.has) { O.has = true; O.x = O.tx; O.y = O.ty; O.z = O.tz; if (!O.away) O.h = O.th; }
    const g9 = ts - O.lts; if (g9 > 0 && g9 <= 600) O.iv += (g9 - O.iv) * (g9 > O.iv ? 0.5 : 0.25); O.lts = ts;   /* 이 친구가 자리를 보내는 간격 어림(서버 시각 · 길어질 땐 빨리 따라감 = 단계가 바뀔 때 덜 끊김) */
    const k = O.Bh * 4; O.B[k] = ts; O.B[k + 1] = O.tx; O.B[k + 2] = O.ty; O.B[k + 3] = O.tz; O.Bh = (O.Bh + 1) % 6; if (O.Bn < 6) O.Bn++; O.wsAt = O.wsSeen = performance.now(); O.t = Date.now() + offset; }
  function wsOpen() { if (!CF_WS || dead || wsGone || ws) return; let s9; try { s9 = ws = new WebSocket(CF_WS + '/room/' + (CLS ? CLS.r : wsRoomOf(room))); } catch (e) { ws = null; return; }
    s9.onopen = () => { if (ws !== s9) return; const a9 = wsTag(), k9 = myK(), j9 = a9 == null ? { t: 'j', id, n: '', k: k9, c: PAL.indexOf(color) } : { t: 'j', id, n: '', k: k9, c: PAL.indexOf(color), a: a9 }; if (CLS) j9.tk = tkSent = CLS.tk(); try { s9.send(JSON.stringify(j9)); } catch (e) { return; }
      wsOk = true; wsBack = 1; wl.x = 1e9; wsSendT = 0; mSent = k9 + '|' + a9; mDirty = false; mT = 0; pingT = 1; pingN = 0; pingAt = 0; pingMiss = 0; rxAt = performance.now(); };   /* 들어오면 내 자리를 한 번 바로(wl 비움) */
    s9.onmessage = (ev) => { if (ws !== s9) return; let d; try { d = JSON.parse(ev.data); } catch (e) { return; } rxAt = performance.now(); pingMiss = 0;
      if (d.t === 's' || d.t === 'w') { const est = d.ts - Date.now(); wsOff = wsOff == null ? est : wsOff + (est - wsOff) * 0.05;
        if (d.t === 'w' && Array.isArray(d.L)) { for (const pid of [...wsIn]) { const O = others.get(pid); if (O) O.ws = false; } wsIn.clear(); for (const m of d.L) if (Array.isArray(m)) wsMem(m[0], m[2], m[3], m[4], m[5]); for (const [pid, O] of [...others]) if (!O.ws && !O.fb) drop(pid); }   /* 명단 먼저(다시 붙었으면 명단을 새로) → 자리 */
        if (Array.isArray(d.P)) for (const q of d.P) if (Array.isArray(q)) wsPos(q, d.ts); }
      else if (d.t === 'j') wsMem(d.id, d.k, d.c, d.a, d.u);
      else if (d.t === 'e') { if (CLS && Number.isInteger(d.m)) { const O = others.get(d.f); if (O && O.ws) emoIn(O, d.m); } }   /* CLASS-MP 반 방 이모트(번호만) */
      else if (d.t === 'm') { if (wsIn.has(d.id)) wsMem(d.id, d.k, d.c, d.a); }
      else if (d.t === 'l') { if (wsIn.delete(d.id)) { const O = others.get(d.id); if (O) { O.ws = false; if (!O.fb) drop(d.id); } } }
      else if (d.t === 'pong') { if (pingAt) { rtt = Math.round(performance.now() - pingAt); pingAt = 0; } }
      else if (d.t === 'full') { wsGone = true; wsOk = false; fullNote(); } };   /* 닫히는 인사가 늦게 와도(로컬 2초쯤) 글은 바로 · 그 사이 자리도 안 보냄 */
    s9.onclose = (ev) => { if (ws !== s9) return; ws = null; wsOk = false; wsLost(); const c9 = ev && ev.code; if (c9 === 4002 || c9 === 4003) { wsGone = true; fullNote(); } else if (c9 === 4000) wsGone = true; else if (CLS && c9 === 4004) { if (CLS.tk() === tkSent) wsGone = true; } else if (CLS && c9 === 4005) { wsGone = true; if (CLS.note) CLS.note('dev'); }   /* CLASS-MP: 4004 = 표가 틀림(새 표를 받았으면 한 번 더 · 아니면 조용히 혼자) · 4005 = 같은 번호가 다른 기기에서 들어옴(한 줄) */   /* 꽉 참 = 글 한 번 + 다시 안 붙음 · 4000 = 같은 id가 다른 탭에서 들어옴(서로 밀어내지 않게 다시 안 붙음) */
      if (!dead && !wsGone) setTimeout(wsOpen, Math.min(30, (wsBack *= 2)) * 1000); };
    s9.onerror = () => { /* onclose가 다시 엶 */ }; }
  const onLook = () => { if (joined && !dead && kind === 'kid') { req('/players/' + id, 'PATCH', { k: myK() }); mDirty = true; } };   // LOOK-1: 모습을 바꾸면 옷 코드만 한 번(NET-CF3: 웹소켓 명단에도)
  addEventListener('sm-look', onLook);
  const leave = () => { if (dead) return; dead = true; if (ws) { try { ws.close(); } catch (e) { /* */ } ws = null; wsOk = false; } wsIn.clear(); removeEventListener('sm-look', onLook); if (es) es.close(); req('/players/' + id, 'DELETE'); for (const pid of [...others.keys()]) drop(pid); if (selfE) { scene.remove(selfE.s); selfE.s.material.dispose(); } for (const t of ETEX) if (t) t.dispose(); removeEventListener('pagehide', leave); if (selfB) { scene.remove(selfB.s); if (selfB.s.material.map) selfB.s.material.map.dispose(); selfB.s.material.dispose(); selfB = null; } mat.dispose(); };   /* FIX-CX8(코덱스 점검): 방을 나갈 때 pagehide 리스너·내 말풍선·공유 재질도 치움(들고 나기를 되풀이하면 쌓이던 것) */
  addEventListener('pagehide', leave);
  let joined = false;
  return {
    get cf() { let wo = 0; for (const O of others.values()) if (O.ws && !O.fb) wo++; return { on: !!CF_WS, ok: wsOk, gone: wsGone, sent: wsN, off: wsOff == null ? null : Math.round(wsOff), room: CF_WS ? (CLS ? CLS.r : wsRoomOf(room)) : '', cls: !!CLS, n: wsIn.size + 1, hz: Math.round(1 / wsIvl()), rtt, wsOnly: wo, fbDead: performance.now() - fbAt > 15000 }; },   /* NET-CF2 시험 · NET-CF3: n 웹소켓 명단 사람 수(나 포함) · hz 지금 보내기 빈도 · rtt 핑 왕복(ms) · wsOnly 웹소켓 명단만으로 아는 친구 수 */
    cfPeers() { const a = []; for (const O of others.values()) a.push({ id: O.pid, ws: O.ws, fb: O.fb, has: O.has, vis: O.vis, n: O.n, k: O.k, c: O.c, w: O.w, v: O.v, iv: Math.round(O.iv), dl: Math.round(O.dl), tag: O.tag.visible, x: +O.x.toFixed(2), z: +O.z.toFixed(2) }); return a; },   /* NET-CF3 시험(읽기만) */
    get id() { return id; }, get name() { return name; }, get color() { return color; }, get away() { return away; }, get kindCode() { return myK(); },
    get count() { let n = 1; const now = Date.now() + offset, pn = performance.now(); for (const O of others.values()) if (O.ws ? live(O, now, pn) : now - O.t < 20000) n++; return n; },   /* NET-CF3: 웹소켓 명단에 있는 친구도 셈 */
    get names() { const now = Date.now() + offset, pn = performance.now(), a = []; for (const O of others.values()) if (O.ws ? live(O, now, pn) : now - O.t < 20000) a.push(O.n || '친구'); return a; },
    setName(v) { v = String(v || '').replace(/[<>]/g, '').trim().slice(0, 8); if (!v || joined || !checkChat(v).ok) return false; /* SAFE-1: 거르개 · 방에 들어간 뒤(이름표가 친구들에게 보인 뒤)엔 못 바꿈 */ name = v; try { localStorage.setItem('mp.name', v); } catch (e) { /* */ } if (joined) req('/players/' + id, 'PATCH', { n: v }); onChange(); },
    fx(f) { fxQ++; if (joined) req('/players/' + id + '/fx', 'PUT', { q: fxQ, ...f }); },
    tick(dt, P) {
      if (dead || !P) return;
      if (!joined) { joined = true; if (!CLS) join(P); wsOpen(); }   /* CLASS-MP: Firebase에 들어가지 않음 */
      sendT -= dt; beatT -= dt;
      const moved = Math.abs(P.x - last.x) + Math.abs(P.z - last.z) + Math.abs(P.y - last.y) > 0.05 || Math.abs(P.h - last.h) > 0.08;
      { const W9 = myW(), q9 = W9 ? W9.q : -1; if (q9 !== wq) { wq = q9; actPut(); sendT = 0; mDirty = true; wl.x = 1e9; } }   // TOGETHER-0: 세계·탈것이 바뀌면 머리표를 바로 + 자리도 바로(NET-CF3: 웹소켓 명단·자리도)
      const pn = performance.now();
      if (wsOk) {   /* NET-CF3: 모양 칸 알림(세계·탈것·옷이 바뀌면 · 2초에 한 번까지 — 서버 상한 1초에 걸려 버려지지 않게) · 핑(조용할 때만) */
        mT -= dt; if (mDirty && mT <= 0) { const a9 = wsTag(), k9 = myK(), m9 = k9 + '|' + a9; mDirty = false; if (m9 !== mSent) { mSent = m9; mT = 2; wsN++; try { ws.send(JSON.stringify({ t: 'm', k: k9, a: a9 })); } catch (e) { /* 닫히는 중 */ } } }
        pingT -= dt; if (pingT <= 0) { if (pingAt && pn - pingAt > 1900) { pingAt = 0; if (++pingMiss >= 3) { pingMiss = 0; try { ws.close(); } catch (e) { /* 닫히는 중 */ } } }   /* 답 없는 핑 세 번 = 죽은 연결 → 닫고 다시 */
          if (pingN < 3 || pingMiss || pn - rxAt > 5000) { pingAt = pn; pingN++; pingT = pingN < 3 ? 1 : pingMiss ? 2 : 5; try { if (ws) ws.send('{"t":"ping"}'); } catch (e) { /* 닫히는 중 */ } } else pingT = 1; }
      }
      wsSendT -= dt; if (wsOk && wsSendT <= 0 && !document.hidden && (Math.abs(P.x - wl.x) + Math.abs(P.y - wl.y) + Math.abs(P.z - wl.z) > 0.03 || Math.abs(P.h - wl.h) > 0.05)) { const E9 = enc(P); if (inRule(E9)) { wsSendT = wsIvl(); wsN++; wl.x = P.x; wl.y = P.y; wl.z = P.z; wl.h = P.h; try { ws.send('{"t":"p","x":' + E9.x.toFixed(2) + ',"y":' + E9.y.toFixed(2) + ',"z":' + E9.z.toFixed(2) + ',"h":' + E9.h.toFixed(2) + ',"s":0}'); } catch (e) { /* 닫히는 중 */ } } }   /* NET-CF2: 움직일 때만(문자열로 바로 — 새 객체 X) · NET-CF3: 간격 = 사람 수 따라(wsIvl) · 마지막에 보낸 자리(wl)에서 움직였을 때만 → 멈추면 마지막 자리 한 번 보내고 끝 */
      if ((moved && sendT <= 0 && !wsOk && (inRule(enc(P)) || !away)) || beatT <= 0 || (wsOk && moved && away)) { send(P); sendT = Math.max(1 / 6, (others.size + 1) / 60); beatT = 5; }   // TOGETHER-0 예산: 방 전체 초당 60번을 나눔 · 가만히면 5초 · NET-OOB · NET-CF2: 웹소켓이 열려 있으면 Firebase는 5초 박동(늦게 온 친구·끊김 대비)만   // TOGETHER-0 예산: 방 전체 초당 60번을 나눔 · 가만히면 5초 · NET-OOB: 범위 밖이면 움직여도 5초마다(처음 나갈 때 한 번은 바로)
      const now = Date.now() + offset, k = Math.min(1, dt * 12), mw = wKey(myW() ? myW().w : 's');
      meP = P; emoteTick(selfE, dt, P.x, P.y - 0.25, P.z); bubbleTick(selfB, dt, P.x, P.y - 0.25, P.z);
      for (const O of others.values()) {
        O.vis = live(O, now, pn) && !hidden && !O.away && O.has && wKey(O.w) === mw; O.mesh.visible = O.vis && !ext; O.tag.visible = O.mesh.visible && !!O.n;   // TOGETHER-0: 같은 세계만 · 마을(ext)은 마을 그리개가 그림 · NET-CF3: 자리를 받은 친구만 · 이름을 모르면 이름표 X
        if (!O.vis) { if (O.em) O.em.s.visible = false; if (O.sb) O.sb.s.visible = false; } else { emoteTick(O.em, dt, O.x, O.y, O.z); bubbleTick(O.sb, dt, O.x, O.y, O.z); }
        if (O.Bn >= 2 && pn - O.wsAt < 1000 && wsOff != null) { const dl9 = O.iv < 140 ? 100 : O.iv < 225 ? 250 : 375, dd9 = dl9 - O.dl; O.dl += dd9 > 0 ? Math.min(dd9, dt * 400) : Math.max(dd9, dt * -100);   /* NET-CF3: 지연 = 15·10번 100(CLASS-MP 11-14: 10번 단계는 예전 100ms로 되돌림 — 학교 맵 함께하기·대결 그대로) · 6번 250 · 4번 375 · 늘 땐 초당 400ms · 줄 땐 초당 100ms씩만 옮김(단계가 바뀔 때 안 튐) */
          const rt = Date.now() + wsOff - O.dl, B = O.B, n = O.Bn, h0 = (O.Bh - n + 6) % 6; let a = -1;   /* NET-CF2 보간: 서버 시각으로 지연만큼 전 자리 = 앞뒤 두 자리 사이 */
          for (let i = 0; i < n - 1; i++) { const k = ((h0 + i) % 6) * 4, k2 = ((h0 + i + 1) % 6) * 4; if (B[k] <= rt && rt <= B[k2]) { a = k; const u = (rt - B[k]) / Math.max(1, B[k2] - B[k]); O.x = B[k + 1] + (B[k2 + 1] - B[k + 1]) * u; O.y = B[k + 2] + (B[k2 + 2] - B[k + 2]) * u; O.z = B[k + 3] + (B[k2 + 3] - B[k + 3]) * u; break; } }
          if (a < 0) { const kL = ((O.Bh + 5) % 6) * 4, kF = h0 * 4; if (rt < B[kF]) { O.x = B[kF + 1]; O.y = B[kF + 2]; O.z = B[kF + 3]; } else { O.x += (B[kL + 1] - O.x) * k; O.y += (B[kL + 2] - O.y) * k; O.z += (B[kL + 3] - O.z) * k; } } }
        else { const age = Math.min(0.45, (pn - O.rt) / 1000), gx = O.tx + O.vx * age, gz = O.tz + O.vz * age;   // NET-SMOOTH(걷기에도): 받은 두 자리의 속도로 앞질러 · 10m 넘게 어긋나면 바로
          if (Math.abs(gx - O.x) + Math.abs(gz - O.z) > 10 || Math.abs(O.ty - O.y) > 6) { O.x = gx; O.y = O.ty; O.z = gz; } else { O.x += (gx - O.x) * k; O.y += (O.ty - O.y) * k; O.z += (gz - O.z) * k; } }
        let dh = O.th - O.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); O.h += dh * k;
        O.mesh.position.set(O.x, O.y, O.z); O.mesh.rotation.y = O.h; if (O.mo) O.mesh.position.y += moTick(O, dt); O.tag.position.set(O.x, O.y + 2.05 * scale, O.z);   // EMOTE-2 몸짓(도는 동안만)
      }
      if ((cleanT -= dt) <= 0) { cleanT = 30; for (const [pid, O] of others) if (!O.ws && O.t && now - O.t > 120000) { req('/players/' + pid, 'DELETE'); drop(pid); } }   /* NET-CF3: 웹소켓 명단에 있는 친구(탭만 가려 둠)는 지우지 않음 */
    },
    say(tx) { if (!joined) return Promise.resolve(false); const cid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const ids = Object.keys(CHAT).sort((a, b) => ((CHAT[a] || {}).t || 0) - ((CHAT[b] || {}).t || 0)); for (const old of ids.slice(0, Math.max(0, ids.length - 39))) req('/chat/' + old, 'DELETE');   // 40개만 남김
      return fetch(base + '/chat/' + cid + '.json', { method: 'PUT', body: JSON.stringify({ n: name, by: id, tx, t: { '.sv': 'timestamp' } }) }).then((r) => r.ok); },
    clearChat() { return req('/chat', 'DELETE'); },
    get chat() { return Object.values(CHAT).filter((m) => m && typeof m.tx === 'string' && !MUTE.has(m.by)).sort((a, b) => (a.t || 0) - (b.t || 0)); },
    setAct(v) { act = String(v || '').slice(0, 20); actPut(); },   // 지금 하는 것(👥 창에서 선생님이 봄) · TOGETHER-0: 마을·실내면 앞에 머리표
    emote(i) { i = Math.max(0, Math.min(EMOTES.length - 1, i | 0)); myE = { i, t: performance.now() }; if (!joined) return; mQ++; if (CLS && wsOk) { wsN++; try { ws.send('{"t":"e","m":' + i + '}'); } catch (e) { /* 닫히는 중 */ } } req('/players/' + id + '/m', 'PUT', { q: mQ, i }); selfE = emoteSprite(selfE, i);
      for (const O of others.values()) if (O.mi === i && myE.t - (O.mt || -1e9) < 3000) combo(O, i); },   // EMOTE-2: 친구가 먼저 한 같은 이모트와 맞춤
    mute(pid, on) { const O = others.get(pid); if (on) { MUTE.add(pid); if (O) { if (O.em) O.em.t = 0; if (O.sb) O.sb.t = 0; O.mo = null; O.mesh.rotation.x = O.mesh.rotation.z = 0; } } else MUTE.delete(pid); try { sessionStorage.setItem('mp.mute', JSON.stringify([...MUTE])); } catch (e) { /* */ } onChange(); },   // SAFE-1 🙈(이 탭에서 나에게만)
    muted: (pid) => MUTE.has(pid),
    peers() { const now = Date.now() + offset, pn = performance.now(), a = [], mw = wKey(myW() ? myW().w : 's'); if (!hidden) for (const O of others.values()) if (live(O, now, pn) && !O.away && O.has && wKey(O.w) === mw) a.push({ id: O.pid, mu: MUTE.has(O.pid), x: O.x, y: O.y, z: O.z, act: O.a, label: O.n || '친구', color: '#' + O.c.toString(16).padStart(6, '0'), r: 4, floor: O.y > 2.5 ? 2 : 1 }); return a; },
    ctl(path, data) { return req('/ctl/' + path, 'PUT', data); },
    /* HOST-1 방장 시계(마을 town_host.js) — 방 통로 그대로(새 스트림 X · DB 규칙 X: ctl은 match·cmd·chat만 받아서 내 players 칸의 fx에 씀) · 읽기만 · 1초에 한 번 부름 */
    get srvNow() { return Date.now() + offset; }, get srvOk() { return offOk; }, get bornAt() { return born + offset; }, get myFx() { return selfFx; },
    fxPeers(fn) { const now = Date.now() + offset, pn = performance.now(); for (const O of others.values()) if (O.fb && O.fxD && live(O, now, pn)) fn(O.pid, O.fxD, O.w !== 's' && O.w !== 'i:?'); },   /* 살아 있는 친구의 fx 칸 · 셋째 = 마을(밖·실내)에 있나 */
    get ctlData() { return CTL; },
    roster() { const now = Date.now() + offset, a = []; for (const [id, O] of others) if (O.fb && !(O.t && now - O.t > 20000)) a.push({ id, label: O.n || '친구', act: O.w === 's' ? O.a : O.lbl, color: O.c, k: O.k, mu: MUTE.has(id), w: O.w, v: O.v, cell: O.cell }); return a; },   // TOGETHER-0: act = 머리표 뺀 글(방 놀이 비교) · NET-CF3: 방 놀이 명단 = Firebase로 아는 친구만(예전 그대로 — 활동 글은 Firebase에만 있음)
    // TOGETHER-0 👥 목록: 모든 친구(다른 세계는 '📍 마을 다7' · 곁으로 X)
    friends() { const now = Date.now() + offset, pn = performance.now(), a = [], mw = wKey(myW() ? myW().w : 's'); for (const O of others.values()) { if (!live(O, now, pn)) continue; const here = wKey(O.w) === mw && !O.away && O.has; a.push({ id: O.pid, label: O.n || '친구', here, mu: MUTE.has(O.pid), x: O.x, y: O.y, z: O.z, color: '#' + O.c.toString(16).padStart(6, '0'), act: here ? (O.w === 's' ? O.a : O.lbl) : placeText(O) + (O.w === 's' && O.a ? ' · ' + O.a : '') }); } return a; },
    ext(on) { ext = !!on; },   // 마을 그리개가 몸·이름표를 대신 그림(이모지·말풍선은 그대로)
    each(fn) { for (const O of others.values()) if (O.vis) fn(O); },   // 같은 세계에 보이는 친구(읽기만 — 매 프레임 새 객체 X)
    get sendEvery() { return Math.max(1 / 6, (others.size + 1) / 60); },   // ROOM-2: 경기 중(hide)에도 같은 방 친구 명단
    hide(on) { hidden = !!on; for (const O of others.values()) { O.mesh.visible = !hidden && !O.away && O.has; O.tag.visible = O.mesh.visible && !!O.n; } },   // 물총 친구 대결 동안 걷기 몸 숨김(경기 몸이 대신)
    leave,
  };
}
