// 동시 접속(MP-1 · 10-03) — Firebase 실시간 DB(class-rpg) REST + EventSource. SDK 없음 · 홍보판(SM_PROMO)에서는 부르지 않는다.
//   방 = metaverse/rooms/<room>/players/<id> = { n 이름, c 색, k 모양, x, y, z, h, t 서버시각, fx? }
//   보내기: 움직이면 초당 6번 · 가만히 있으면 3초마다 · 받기: 방 한 갈래(rooms/<room>)를 스트림 하나로 — players + ctl(선생님 신호·물총 대기실) · 20초 넘게 소식 없는 사람은 숨기고 2분 넘으면 지움
//   NET-2(10-03): 이모지 인사(players/<id>/m = {q, i} — 정해진 그림만 · 3초 머리 위) · 미니맵 친구 점(peers()) · ctl = 방 신호(o.onCtl) — 연결 하나로 합침(무료 요금제 동시 연결 100)
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app';
const PAL = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x38d9a9, 0x4dabf7, 0x748ffc, 0xda77f2, 0xf783ac, 0x20c997];
const SKIN = 0xf1c9a0;
export const EMOTES = ['👋', '😀', '👍', '❤️', '😮', '🎉'];

export function createNet(o) {
  const { THREE, scene, room, kind = 'kid', scale = 1 } = o;
  const base = DB + '/metaverse/rooms/' + encodeURIComponent(room);
  let id = null;
  try { id = sessionStorage.getItem('mp.id'); } catch (e) { /* */ }
  if (!id) { id = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mp.id', id); } catch (e) { /* */ } }
  let name = '';
  try { name = localStorage.getItem('mp.name') || ''; } catch (e) { /* */ }
  if (!name) name = '친구' + Math.floor(10 + Math.random() * 90);
  const color = PAL[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PAL.length];
  const others = new Map();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const _m = new THREE.Matrix4(), _c = new THREE.Color();
  let es = null, dead = false, hidden = false, mQ = 0, CTL = {}, selfE = null, act = '', CHAT = {}, chatSeen = new Set(), chatT0 = Date.now(), selfB = null, offset = 0, sendT = 0, beatT = 0, cleanT = 8, fxQ = 0, last = { x: 1e9, y: 0, z: 0, h: 0 }, onChange = o.onChange || (() => {});

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
  function avatar(k, hex) {
    const parts = k === 'wizard' ? [
      [new THREE.ConeGeometry(0.42, 1.15, 8), hex, 0, 0.58, 0], [new THREE.IcosahedronGeometry(0.26, 1), SKIN, 0, 1.32, 0],
      [new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10), 0x2a1d4f, 0, 1.5, 0], [new THREE.ConeGeometry(0.24, 0.62, 8), 0x2a1d4f, 0, 1.82, -0.04],
      [new THREE.SphereGeometry(0.04, 5, 4), 0x1d1530, -0.09, 1.35, 0.23], [new THREE.SphereGeometry(0.04, 5, 4), 0x1d1530, 0.09, 1.35, 0.23],
    ] : [
      [new THREE.BoxGeometry(0.42, 0.5, 0.26), hex, 0, 0.75, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), 0x2b3a55, -0.11, 0.25, 0], [new THREE.BoxGeometry(0.16, 0.5, 0.18), 0x2b3a55, 0.11, 0.25, 0],
      [new THREE.IcosahedronGeometry(0.26, 1), SKIN, 0, 1.24, 0], [new THREE.SphereGeometry(0.28, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), hex, 0, 1.3, 0],
      [new THREE.BoxGeometry(0.3, 0.05, 0.2), hex, 0, 1.31, 0.24], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, -0.09, 1.26, 0.23], [new THREE.SphereGeometry(0.035, 5, 4), 0x1d1530, 0.09, 1.26, 0.23],
    ];
    const m = new THREE.Mesh(merge(parts), mat); m.scale.setScalar(scale); return m;
  }
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
  function upsert(pid, d) {
    if (pid === id) { if (d && typeof d.t === 'number') offset = d.t - Date.now(); return; }
    if (!d) { drop(pid); return; }
    let O = others.get(pid);
    if (!O) {
      if (others.size >= 40) return;
      const mesh = avatar(d.k || kind, PAL.includes(d.c) ? d.c : PAL[0]), tg = tag(d.n || '친구');
      O = { a: '', mesh, tag: tg, n: d.n || '친구', c: PAL.includes(d.c) ? d.c : PAL[0], x: d.x || 0, y: d.y || 0, z: d.z || 0, h: d.h || 0, tx: 0, ty: 0, tz: 0, th: 0, t: 0, seen: performance.now(), fxQ: d.fx ? d.fx.q : 0, mQ: d.m ? d.m.q : 0, em: null };
      scene.add(mesh, tg); others.set(pid, O); onChange();
    }
    for (const k of ['x', 'y', 'z', 'h']) if (typeof d[k] === 'number') O['t' + k] = d[k];
    if (typeof d.t === 'number') O.t = d.t;
    if (d.n && d.n !== O.n) { O.n = d.n; scene.remove(O.tag); O.tag.material.map.dispose(); O.tag = tag(O.n); scene.add(O.tag); onChange(); }
    if (d.fx && d.fx.q !== O.fxQ) { O.fxQ = d.fx.q; if (o.onFx && O.seen) o.onFx(O, d.fx); }
    if (typeof d.a === 'string') O.a = d.a;
    if (d.m && d.m.q !== O.mQ) { O.mQ = d.m.q; O.em = emoteSprite(O.em, d.m.i); }
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
    for (const m of fresh) { if (m.by === id) selfB = bubble(selfB, m.tx); else { const O = others.get(m.by); if (O) O.sb = bubble(O.sb, m.tx); } if (o.onChat) o.onChat(m); }
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
  function req(path, method, data) { return fetch(base + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then((r) => { if (r.status === 401 && o.onDenied && !dead) o.onDenied(); }).catch(() => {}); }   // 401 = 방이 닫힘·끝남(DB 규칙)
  function send(P, extra) {
    const d = { x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), h: +P.h.toFixed(2), t: { '.sv': 'timestamp' }, ...extra };
    req('/players/' + id, 'PATCH', d); last.x = P.x; last.y = P.y; last.z = P.z; last.h = P.h;
  }
  function join(P) {
    req('/players/' + id, 'PUT', { n: name, c: color, k: kind, x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), h: +(P.h || 0).toFixed(2), t: { '.sv': 'timestamp' } });
    es = new EventSource(base + '.json');
    es.addEventListener('put', (e) => onEvt('put', e)); es.addEventListener('patch', (e) => onEvt('patch', e));
  }
  const leave = () => { if (dead) return; dead = true; if (es) es.close(); req('/players/' + id, 'DELETE'); for (const pid of [...others.keys()]) drop(pid); if (selfE) { scene.remove(selfE.s); selfE.s.material.dispose(); } for (const t of ETEX) if (t) t.dispose(); };
  addEventListener('pagehide', leave);
  let joined = false;
  return {
    get id() { return id; }, get name() { return name; }, get color() { return color; },
    get count() { let n = 1; const now = Date.now() + offset; for (const O of others.values()) if (now - O.t < 20000) n++; return n; },
    get names() { const now = Date.now() + offset, a = []; for (const O of others.values()) if (now - O.t < 20000) a.push(O.n); return a; },
    setName(v) { v = String(v || '').replace(/[<>]/g, '').trim().slice(0, 8); if (!v) return; name = v; try { localStorage.setItem('mp.name', v); } catch (e) { /* */ } if (joined) req('/players/' + id, 'PATCH', { n: v }); onChange(); },
    fx(f) { fxQ++; if (joined) req('/players/' + id + '/fx', 'PUT', { q: fxQ, ...f }); },
    tick(dt, P) {
      if (dead || !P) return;
      if (!joined) { joined = true; join(P); }
      sendT -= dt; beatT -= dt;
      const moved = Math.abs(P.x - last.x) + Math.abs(P.z - last.z) + Math.abs(P.y - last.y) > 0.05 || Math.abs(P.h - last.h) > 0.08;
      if ((moved && sendT <= 0) || beatT <= 0) { send(P); sendT = 1 / 6; beatT = 3; }
      const now = Date.now() + offset, k = Math.min(1, dt * 10);
      emoteTick(selfE, dt, P.x, P.y - 0.25, P.z); bubbleTick(selfB, dt, P.x, P.y - 0.25, P.z);
      for (const O of others.values()) {
        const stale = O.t && now - O.t > 20000; O.mesh.visible = O.tag.visible = !stale && !hidden;
        emoteTick(O.em, dt, O.x, O.y, O.z); bubbleTick(O.sb, dt, O.x, O.y, O.z);
        O.x += (O.tx - O.x) * k; O.y += (O.ty - O.y) * k; O.z += (O.tz - O.z) * k;
        let dh = O.th - O.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); O.h += dh * k;
        O.mesh.position.set(O.x, O.y, O.z); O.mesh.rotation.y = O.h; O.tag.position.set(O.x, O.y + 2.05 * scale, O.z);
      }
      if ((cleanT -= dt) <= 0) { cleanT = 30; for (const [pid, O] of others) if (O.t && now - O.t > 120000) { req('/players/' + pid, 'DELETE'); drop(pid); } }
    },
    say(tx) { if (!joined) return Promise.resolve(false); const cid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const ids = Object.keys(CHAT).sort((a, b) => ((CHAT[a] || {}).t || 0) - ((CHAT[b] || {}).t || 0)); for (const old of ids.slice(0, Math.max(0, ids.length - 39))) req('/chat/' + old, 'DELETE');   // 40개만 남김
      return fetch(base + '/chat/' + cid + '.json', { method: 'PUT', body: JSON.stringify({ n: name, by: id, tx, t: { '.sv': 'timestamp' } }) }).then((r) => r.ok); },
    clearChat() { return req('/chat', 'DELETE'); },
    get chat() { return Object.values(CHAT).filter((m) => m && typeof m.tx === 'string').sort((a, b) => (a.t || 0) - (b.t || 0)); },
    setAct(v) { v = String(v || '').slice(0, 20); if (v === act || !joined) return; act = v; req('/players/' + id + '/a', 'PUT', v); },   // 지금 하는 것(👥 창에서 선생님이 봄)
    emote(i) { if (!joined) return; mQ++; req('/players/' + id + '/m', 'PUT', { q: mQ, i }); selfE = emoteSprite(selfE, i); },
    peers() { const now = Date.now() + offset, a = []; if (!hidden) for (const O of others.values()) if (!(O.t && now - O.t > 20000)) a.push({ x: O.x, y: O.y, z: O.z, act: O.a, label: O.n, color: '#' + O.c.toString(16).padStart(6, '0'), r: 4, floor: O.y > 2.5 ? 2 : 1 }); return a; },
    ctl(path, data) { return req('/ctl/' + path, 'PUT', data); },
    get ctlData() { return CTL; },
    roster() { const now = Date.now() + offset, a = []; for (const [id, O] of others) if (!(O.t && now - O.t > 20000)) a.push({ id, label: O.n, act: O.a }); return a; },   // ROOM-2: 경기 중(hide)에도 같은 방 친구 명단
    hide(on) { hidden = !!on; for (const O of others.values()) O.mesh.visible = O.tag.visible = !hidden; },   // 물총 친구 대결 동안 걷기 몸 숨김(경기 몸이 대신)
    leave,
  };
}
