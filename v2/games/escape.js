// 학교 방탈출 '사라진 타임캡슐 열쇠'(G-ESCAPE 2판 · 09-27) — 행동 사전 엔진(§12) + 세상 바꾸기(§16) 위의 이야기 방탈출. 정본 = docs/map_api.md §14
//   사용자 09-27 "방탈출 첫판은 그냥 쪽지인가? 너가 다 써줘봐" · "게임 상호작용하면 실제 변화도 생기게" → 방마다 물건을 쓰는 퍼즐 + 방이 눈에 띄게 바뀜 + 방 사이 단서 잇기.
//   방(이야기 파일 순서대로 · 기본 다섯):
//     uv        4학년 교실 — ⭐ 보관함 문이 열림 → 🔦 자외선 손전등 → 칠판에 비추면 불이 꺼지고 보라 글씨가 떠오름 → 🎈 풍선 수 세기 → 서랍장 자물쇠 → 서랍이 스르륵(🔑 + 💠 거울)
//     mix       과학실 — 칠판 실험 과제(색 순서) → 실험대에서 🔴🔵🟡 두 가지 섞기(플라스크 색이 바뀜) ×3 → 약품장 불 셋 → 문이 활짝(💡 전구 · 📒 색 순서 기록)
//     projector 컴퓨터실 — 천장 프로젝터에 💡 전구 → 빛줄기·칠판 화면 → 벽 불 스위치(방이 어두워짐) → 💠 빛줄기 속 고리에 거울 → 빛이 꺾여 벽에 거울 글씨 번호 → 화면 잠금(화면 초록 · 매달린 열쇠가 내려옴)
//     books     도서실 — 무지개 책장(책 순서 바꾸기 = 실제 책 색이 바뀜) → 옆 판이 열리고 사다리가 내려옴 → 올라가 🌍 지구본 돌리기 → 지도 ⭐ = 다음 방 문 앞 화분에 열쇠
//     stealth   교무실 — 순찰 로봇(밤 = 장난감 유령) 피해 캡슐 조각 3 → 📒 과학실 색 순서대로 금고 번호 → 금고 문이 열림 → 마무리(4학년 선생님이 문 앞에서 만세)
//   데이터 = v2/games/escape_story.js(글·방 순서 — 동적 import ?t=지금 · 고친 뒤 버스터 없이 새로고침만). 이야기·쪽지·힌트·선생님 말 = 이야기 파일 · 이 파일의 글자는 화면 안내(UI)뿐.
//   규칙(_template.js · §5 · §16.1): import 금지 · 새 조명 없음(방 불 = map.world.light · 밤 = map.lights(false)·map.flashlight) · 사람은 술래·목표가 아님(술래 = 순찰 로봇/장난감 유령) ·
//     이름 있는 학생에게 말을 시키지 않음(쓰는 방의 학생은 '방과 후'라 잠깐 숨김 · 선생님은 직함으로 힌트만) · 잡혀도 벌 없음 · 매 프레임 새 객체 없음 ·
//     게임 소품 = 인스턴스 풀 셋(상자·공·빛 — 드로우콜 3) + 지구본 1 + 방마다 그림판(칠판·화면·벽 글씨) — 지난 방의 그림판·풍선은 다음 방에 들어서면 치운다.
export const meta = { id: 'escape', title: '학교 방탈출', api: 1 };

const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
const HINT_T = 40, HINT_SHOW = 8, R2D = Math.PI / 180;
const COL = { r: { e: '🔴', n: '빨강', hex: 0xe0453a }, b: { e: '🔵', n: '파랑', hex: 0x2f6fd0 }, y: { e: '🟡', n: '노랑', hex: 0xf2c230 },
  p: { e: '🟣', n: '보라', hex: 0x8e44ad }, g: { e: '🟢', n: '초록', hex: 0x2ea44f }, o: { e: '🟠', n: '주황', hex: 0xf08a24 }, m: { e: '🟤', n: '흙탕', hex: 0x7a5a3a } };
const mixOf = (a, b) => { if (a === b) return a; const k = [a, b].sort().join(''); return k === 'br' ? 'p' : k === 'by' ? 'g' : k === 'ry' ? 'o' : 'm'; };
const RAINBOW = [{ e: '빨', hex: 0xe0453a }, { e: '주', hex: 0xf08a24 }, { e: '노', hex: 0xf2c230 }, { e: '초', hex: 0x2ea44f }, { e: '파', hex: 0x2f6fd0 }];
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fill = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
const CSS = [
  '.esc-lock{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:30;width:min(420px,90vw);background:#223047;color:#fff;border-radius:14px;padding:14px 18px 14px;',
  'box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.15);font:15px/1.4 sans-serif;text-align:center;user-select:none;-webkit-user-select:none}',
  '.esc-lock h3{margin:0 0 4px;font-size:18px}.esc-lock p{margin:0 0 8px;color:#ffe08a;font-size:14px}',
  '.esc-dials{display:flex;justify-content:center;gap:10px;margin:4px 0 10px}',
  '.esc-dial{display:flex;flex-direction:column;align-items:center;gap:4px}',
  '.esc-dial button{width:52px;height:40px;border:0;border-radius:9px;background:#3b5176;color:#fff;font-size:18px;cursor:pointer;touch-action:manipulation}',
  '.esc-dial span{width:52px;height:50px;border-radius:9px;background:#fffaf0;color:#223047;font:800 30px/50px monospace;box-shadow:inset 0 0 0 2px #9fb3d1}',
  '.esc-dial.cur span{box-shadow:inset 0 0 0 3px #ffc62e}',
  '.esc-row{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}.esc-row button{min-width:110px;min-height:44px;border:0;border-radius:10px;font-size:16px;cursor:pointer;touch-action:manipulation}',
  '.esc-row .ok{background:#ffc62e;color:#223047;font-weight:800}.esc-row .no{background:#51607a;color:#fff}',
  '.esc-lock.bad{animation:escShake .35s}@keyframes escShake{20%{margin-left:-10px}40%{margin-left:10px}60%{margin-left:-6px}80%{margin-left:6px}}',
  // 색 섞기 · 책 꽂기 창(같은 .esc-lock 틀 — 휴대폰 모양은 v2/phone.css)
  '.esc-cols{display:flex;justify-content:center;gap:12px;margin:6px 0 10px}',
  '.esc-cols button{width:64px;height:64px;border-radius:50%;border:4px solid rgba(255,255,255,.25);cursor:pointer;touch-action:manipulation;font:800 14px sans-serif;color:#fff;text-shadow:0 1px 2px #000}',
  '.esc-cols button.on{border-color:#ffc62e;transform:scale(1.08)}',
  '.esc-prog{font-size:22px;letter-spacing:4px;margin:0 0 6px}',
  '.esc-books{display:flex;justify-content:center;gap:6px;margin:6px 0 10px}',
  '.esc-books button{width:48px;height:92px;border-radius:6px 6px 3px 3px;border:3px solid rgba(0,0,0,.25);cursor:pointer;touch-action:manipulation;font:800 16px sans-serif;color:#fff;text-shadow:0 1px 2px #000}',
  '.esc-books button.on{border-color:#ffc62e;transform:translateY(-8px)}.esc-books button.cur{outline:3px dashed #fff;outline-offset:2px}',
].join('\n');

export default async function start(map, params = {}) {
  let dead = false, st = 'prep';
  const THREE = map.three, W = map.world;
  map.player.freeze(true);
  map.hud.banner('방탈출 준비 중…', 30);
  map.sfx('warm');
  // ---------- 이야기 파일 ----------
  // EP-1(10-03 교사 '지금 것은 연습 게임 — 새 방탈출을 추가할 수 있게'): 에피소드 목록 escape_episodes.js → params.ep · 둘 이상 보이면 시작 때 고르기
  let EPS = [];
  try { EPS = (await import(new URL('./escape_episodes.js?t=' + Date.now(), import.meta.url))).EPISODES || []; } catch (e) { console.error('[escape] escape_episodes.js를 못 읽음', e); }
  if (dead || map.gone) return {};
  EPS = EPS.filter(e => e && /^[a-z0-9_]+$/.test(e.id || '') && /^[a-z0-9_]+\.js$/.test(e.file || ''));
  if (!EPS.length) EPS = [{ id: 'timecapsule', title: '사라진 타임캡슐 열쇠', icon: '🔑', practice: true, file: 'escape_story.js' }];
  const VIS = EPS.filter(e => !e.hidden);
  let EP = EPS.find(e => e.id === params.ep);
  if (!EP && VIS.length > 1) { map.hud.banner(' ', 0.02);
    const k = await map.hud.ask('🔐 어떤 방탈출을 할까요?', VIS.map(e => (e.icon || '🔐') + ' ' + (e.practice ? '[연습] ' : '') + e.title)); if (dead || map.gone) return {}; EP = VIS[k]; }
  EP = EP || VIS[0] || EPS[0];
  let DATA = null;
  try { DATA = (await import(new URL('./' + EP.file + '?t=' + Date.now(), import.meta.url))).STORY; } catch (e) { console.error('[escape] 이야기 파일을 못 읽음', e); }
  if (dead || map.gone) return {};
  if (!DATA || !Array.isArray(DATA.rooms) || !DATA.rooms.length) { map.hud.toast('이야기 파일(' + EP.file + ')을 읽지 못했어요'); map.quit(); return {}; }
  if (EP.practice && DATA.title && !/연습/.test(DATA.title)) DATA.title = '[연습] ' + DATA.title;
  const BK = EP.id === 'timecapsule' ? '' : EP.id + '.';   // 기록은 에피소드마다(연습 = 예전 키 그대로)
  const nav = await map.nav();
  if (dead || map.gone) return {};
  const S = map.story, seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now(), rng = map.rng(seed);
  const ri = n => Math.floor(rng() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- 낮/밤 ----------
  let night = params.night === '1' || params.night === 1 || params.night === true ? true : params.night === '0' || params.night === 0 || params.night === false ? false : null;
  if (night == null) {
    map.hud.banner(' ', 0.02);
    const k = await map.hud.ask('🏫 학교 방탈출 — ' + (DATA.title || '') + '\n☀️ 낮 = 정리 로봇 · 🌙 밤 = 장난감 유령 + 손전등', ['☀️ 낮에 하기', '🌙 밤에 하기']);
    if (dead || map.gone) return {};
    night = k === 1;
  }

  // ---------- 방·문 자리(월드에서) ----------
  const inZ = (i, z) => { const zz = nav.zoneOf(i); return !!zz && zz.id === z.id; };
  function doorSides(p, z) {   // 문 안쪽·바깥쪽 서는 칸(문 가운데에서 0.95m — 길격자 칸)
    let ins = null, out = null;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const r of [0.95, 1.3, 1.7]) {   // 문 안쪽에 책상이 붙어 있으면 조금 더 들어가서
      const i = nav.snap(p.x + dx * r, p.y, p.z + dz * r, 0.5); if (i < 0) continue;
      const q = nav.pos(i); if (Math.abs((q[0] - p.x) * dz - (q[2] - p.z) * dx) > 0.4 || (q[0] - p.x) * dx + (q[2] - p.z) * dz < 0.5) continue;   // 문을 곧게 지나는 칸만(옆벽 따라 잡힌 칸 빼기)
      if (inZ(i, z)) { if (!ins) ins = { p: q, dx, dz }; } else if (!out) out = { p: q, dx, dz };
      break;
    }
    return ins && out && ins.dx === -out.dx && ins.dz === -out.dz ? { ins: ins.p, out: out.p, face: Math.round(((Math.atan2(ins.dx, -ins.dz) * 180 / Math.PI) + 360) % 360) } : null;
  }
  const PUZ = ['uv', 'mix', 'projector', 'books', 'stealth'];
  const rooms = [];
  for (const R of DATA.rooms) {
    const z = map.zone(R.zone); if (!z) { console.warn('[escape] 없는 방', R.zone); continue; }
    const doors = map.pois({ src: 'door' }).filter(p => p.zones && p.zones.includes(z.id)).map(p => ({ n: +p.id.slice(5), x: p.x, y: p.y, z: p.z, s: doorSides(p, z) }));
    if (!doors.some(d => d.s)) { console.warn('[escape] 문이 없는 방', R.zone); continue; }
    if (!PUZ.includes(R.puzzle)) console.warn('[escape] 모르는 퍼즐 — mix로', R.puzzle);
    rooms.push({ k: rooms.length, R, z, y: z.y ?? 0, doors, main: null, puzzle: PUZ.includes(R.puzzle) ? R.puzzle : 'mix', done: new Set(), steps: [], at: {}, paints: [], props: [], tier: 0, stepT: 0 });
  }
  if (!rooms.length) { map.hud.toast('방탈출 방을 찾지 못했어요'); map.quit(); return {}; }
  const plen = (a, b) => { const r = nav.path(a, b, { maxExp: 60000 }); return r.ok ? r.len : 1e9; };
  rooms.forEach((m, i) => {   // 드나드는 문: 1번 방 = 다음 방 쪽으로 가장 가까운 문 · 그다음 방 = 앞 방 문에서 걸어서 가장 가까운 문
    const ok = m.doors.filter(d => d.s);
    if (ok.length === 1) { m.main = ok[0]; return; }
    const from = i === 0 ? (rooms[1] ? map.resolve('zone:' + rooms[1].z.id) : null) : rooms[i - 1].main.s.out;
    if (!from) { m.main = ok[0]; return; }
    const f = Array.isArray(from) ? from : [from.x, from.y, from.z];
    m.main = ok.map(d => ({ d, L: plen(d.s.out, f) })).sort((a, b) => a.L - b.L)[0].d;
  });
  const last = rooms.length - 1;
  rooms.forEach(m => { m.stealth = m.puzzle === 'stealth'; m.keyId = 'key' + m.k; m.keyHidden = m.puzzle === 'books' && m.k < last; });   // 도서실 = 다음 방 열쇠는 지도 ⭐ 자리에(장면이 주지 않는다)
  const zoneIds = new Set(rooms.map(m => m.z.id));
  // 쓰는 방의 원래 지점(칠판 낙서·앉기·책 읽기)은 판 동안 끈다 — 게임 지점과 겹치지 않게(멈추면 원래대로)
  const offH = new Set(); const boardHot = {};
  for (const m of rooms) for (const h of map.interact.list({ zone: m.z.id })) if (h.kind !== 'game') { offH.add(h); if (h.kind === 'board' && !boardHot[m.z.id]) boardHot[m.z.id] = h; }
  map.interact.enable(h => offH.has(h), false);

  // ---------- 게임 소품: 인스턴스 풀 셋(상자 · 공 · 빛) + 조각 틀 ----------
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _c = new THREE.Color();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function mkPool(geo, mat, cap) { const im = new THREE.InstancedMesh(geo, mat, cap); im.frustumCulled = false; im.castShadow = im.receiveShadow = false;
    for (let i = 0; i < cap; i++) { im.setMatrixAt(i, ZERO); im.setColorAt(i, _c.set(0xffffff)); } im.count = 0; map.add(im); return { m: im, cap, n: 0 }; }
  const BOX = mkPool(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), 260);
  const SPH = mkPool(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshLambertMaterial({ color: 0xffffff }), 24);
  const GLOW = mkPool(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 20);
  GLOW.m.renderOrder = 3;
  const POOLS = [BOX, SPH, GLOW];
  // 틀(frame): 바닥 가운데 x,y,z · 방위 h(°) — 로컬 +z = 앞(h 쪽) · +x = 왼쪽 · +y = 위
  const frame = (x, y, z, h) => ({ x, y, z, h, th: Math.PI - h * R2D, w: (lx, ly, lz) => [x - lx * Math.cos(h * R2D) + lz * Math.sin(h * R2D), y + ly, z - lx * Math.sin(h * R2D) - lz * Math.cos(h * R2D)] });
  function draw(p) { const M = p.P.m;
    if (!p.vis) M.setMatrixAt(p.i, ZERO);
    else { _q.setFromEuler(_e.set(p.tilt, p.th + p.ang, 0, 'YXZ')); _v.set(p.ox, p.oy + p.bob, p.oz).applyQuaternion(_q); _v.x += p.hx; _v.y += p.hy; _v.z += p.hz; M.setMatrixAt(p.i, _m.compose(_v, _q, _s.set(p.sx, p.sy, p.sz))); }
    M.instanceMatrix.needsUpdate = true; }
  // 조각 하나: 틀 로컬 (lx,ly,lz)에 가운데(o.ox/oy/oz = 경첩에서 떨어진 자리 — 문짝) · 크기 sx,sy,sz · 색
  function part(P, fr, lx, ly, lz, sx, sy, sz, color, o = {}) {
    if (P.n >= P.cap) { console.warn('[escape] 소품 칸이 모자라요'); return null; }
    const [hx, hy, hz] = fr.w(lx, ly, lz), p = { P, i: P.n++, hx, hy, hz, ox: o.ox || 0, oy: o.oy || 0, oz: o.oz || 0, th: fr.th + (o.yaw || 0), ang: o.ang || 0, tilt: o.tilt || 0, sx, sy, sz, vis: o.vis !== false, bob: 0, col: color };
    P.m.count = P.n; P.m.setColorAt(p.i, _c.set(color)); P.m.instanceColor.needsUpdate = true; draw(p); return p;
  }
  const recolor = (p, c) => { if (!p) return; p.col = c; p.P.m.setColorAt(p.i, _c.set(c)); p.P.m.instanceColor.needsUpdate = true; };
  const show = (p, on) => { if (!p) return; p.vis = on; draw(p); };
  // 두 점을 잇는 빛줄기(GLOW 조각)
  function beamSet(p, a, b, wdt) { if (!p) return; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 0.01;
    p.hx = (a[0] + b[0]) / 2; p.hy = (a[1] + b[1]) / 2; p.hz = (a[2] + b[2]) / 2; p.th = Math.atan2(dx, dz); p.ang = 0; p.tilt = -Math.asin(dy / L); p.sx = wdt; p.sy = wdt * 0.7; p.sz = L; p.vis = true; draw(p); }
  // 움직임(열리는 문·서랍·사다리) — 시작할 때만 객체를 만든다(매 프레임은 값만)
  const ANIMS = [], LATER = [];
  const later = (sec, fn) => LATER.push({ t: sec, fn });   // 게임 시간으로 잠시 뒤(창이 떠 멈춘 동안은 흐르지 않음 — 쪽지 사이에 끼지 않게)
  function anim(p, to, dur, o = {}) { if (!p) return; const keys = Object.keys(to), from = keys.map(k => p[k]), dst = keys.map(k => to[k]);
    ANIMS.push({ p, keys, from, dst, t: -(o.delay || 0), dur, show: !!o.show, done: o.done || null }); }
  function animTick(dt) {
    for (let k = ANIMS.length - 1; k >= 0; k--) { const a = ANIMS[k]; a.t += dt; if (a.t < 0) continue;
      if (a.show && !a.p.vis) a.p.vis = true;
      let u = Math.min(1, a.t / a.dur); u = u * u * (3 - 2 * u);
      for (let j = 0; j < a.keys.length; j++) a.p[a.keys[j]] = a.from[j] + (a.dst[j] - a.from[j]) * u;
      draw(a.p); if (a.t >= a.dur) { ANIMS.splice(k, 1); if (a.done) a.done(); } }
  }
  // 충돌 + 길격자 막기(보이는 것 = 충돌) · h는 90° 단위 — 폭 w(로컬 x) · 깊이 d(로컬 z)
  function solid(fr, w, d, y0, y1, ns, lx = 0, lz = 0) {
    const odd = Math.round(fr.h / 90) % 2 !== 0, hw = (odd ? d : w) / 2, hd = (odd ? w : d) / 2, [cx, , cz] = fr.w(lx, 0, lz);
    const b = { x0: cx - hw, x1: cx + hw, y0, y1, z0: cz - hd, z1: cz + hd };
    map.collider.add(b, { ns: !!ns }); nav.block([b.x0 - 0.25, b.z0 - 0.25, b.x1 + 0.25, b.z1 + 0.25]); return b;
  }

  // ---------- 자리 찾기 ----------
  const clear = [];   // [x, z, r] 이미 쓴 자리
  const farOK = (x, z, r) => clear.every(c => Math.hypot(x - c[0], z - c[1]) >= r + c[2]);
  const dirH = (dx, dz) => (Math.round((((Math.atan2(dx, -dz) / R2D) + 360) % 360) / 90) * 90) % 360;   // 방향 → 가까운 90° 방위
  // 방 안 트인 칸(길격자) — near가 있으면 여러 번 뽑아 가장 가까운 것
  function openSpot(m, o = {}) {
    const mc = o.mc ?? 1.2, far = clear.map(c => ({ x: c[0], z: c[1], r: c[2] + (o.r ?? 0.8) }));
    for (const d of m.doors) far.push({ x: d.x, z: d.z, r: 2.0 });
    let best = null, bd = 1e9;
    for (let t = 0; t < (o.near ? 40 : 3); t++) {
      const p = nav.random({ zones: [m.z.id], notTags: [], rng, minClear: mc, farFrom: far }); if (!p) continue;
      if (o.minFrom && Math.hypot(p[0] - o.minFrom[0], p[2] - o.minFrom[1]) < o.minFrom[2]) continue;
      const d = o.near ? Math.hypot(p[0] - o.near[0], p[2] - o.near[1]) : t; if (d < bd) { bd = d; best = p; } if (!o.near) break; }
    if (!best && mc > 0.61 && !o.strict) return openSpot(m, { ...o, mc: 0.6 });   // strict = 넓은 칸만(바닥에 서는 소품·사람 — 좁은 통로를 막지 않게)
    if (best) clear.push([best[0], best[2], o.r ?? 0.8]);
    return best;
  }
  // 벽에 등을 댄 자리(폭 w · 깊이 d · 앞으로 front m 트임) → { fr, stand } — 가구·사람·문·다른 소품과 겹치지 않고, 앞은 걸을 수 있게
  function wallSpot(m, w, d, o = {}) {
    const z = m.z, y = m.y, front = o.front ?? 1.0, cands = [];
    const sides = [{ ax: 'x', c: z.z0, n: 1, h: 180 }, { ax: 'x', c: z.z1, n: -1, h: 0 }, { ax: 'z', c: z.x0, n: 1, h: 90 }, { ax: 'z', c: z.x1, n: -1, h: 270 }];
    for (const s of sides) { const a0 = s.ax === 'x' ? z.x0 : z.z0, a1 = s.ax === 'x' ? z.x1 : z.z1, off = 0.19 + d / 2;
      for (let a = a0 + w / 2 + 0.3; a <= a1 - w / 2 - 0.3; a += 0.3) cands.push({ x: s.ax === 'x' ? a : s.c + s.n * off, z: s.ax === 'x' ? s.c + s.n * off : a, h: s.h, r: rng() }); }
    const hots = map.interact.list({ zone: z.id });
    const people = map.npc.list({ room: z.id });
    const why = {};
    const no = k => { why[k] = (why[k] || 0) + 1; return null; };
    const good = c => {
      const fr = frame(c.x, y, c.z, c.h), zz = map.zoneAt(c.x, y + 0.1, c.z); if (!zz || zz.id !== z.id) return no('zone');
      if (!farOK(c.x, c.z, Math.max(w, d) / 2 + 0.3)) return no('used');
      for (const dd of m.doors) if (Math.hypot(dd.x - c.x, dd.z - c.z) < 1.3 + w / 2) return no('door');
      for (const h of hots) if (Math.hypot(h.x - c.x, h.z - c.z) < w / 2 + 0.45) return no('hot');
      for (const p of people) if (Math.hypot(p.x - c.x, p.z - c.z) < w / 2 + 0.6) return no('npc');
      for (let lx = -w / 2 + 0.05; lx <= w / 2 - 0.05 + 1e-6; lx += Math.max(0.15, (w - 0.1) / Math.ceil((w - 0.1) / 0.3))) for (let lz = d / 2 - 0.04; lz >= -d / 2 + 0.3; lz -= 0.25) { const [x9, , z9] = fr.w(lx, 0, lz); if (map.q.blocked(x9, z9, y + 0.05)) return no('body'); }
      for (let lx = -w / 2 - 0.1; lx <= w / 2 + 0.1 + 1e-6; lx += 0.3) for (let lz = d / 2 + 0.3; lz <= d / 2 + front + 1e-6; lz += 0.3) { const [x9, , z9] = fr.w(lx, 0, lz); if (map.q.blocked(x9, z9, y + 0.05)) return no('front'); const zq = map.zoneAt(x9, y + 0.1, z9); if (!zq || zq.id !== z.id) return no('fzone'); }
      const stand = fr.w(0, 0, d / 2 + 0.6); if (nav.snap(stand[0], y, stand[2], 0.4) < 0) return no('stand'); if (!standFree(m, stand)) return no('near');
      return { fr, stand };
    };
    const order = cands.map(c => ({ c, s: o.near ? Math.hypot(c.x - o.near[0], c.z - o.near[1]) + c.r * 0.6 : c.r })).sort((a, b) => a.s - b.s);
    let tries = 0;
    for (const { c } of order) { const g = good(c); if (!g) continue;
      if (tries++ < 10 && !keepsWay(m, g, w, d)) { no('way'); continue; }   // 놓으면 방의 지점(칠판·다른 소품 앞)으로 가는 길이 끊기면 다음 자리
      clear.push([c.x, c.z, Math.max(w, d) / 2 + 0.3]); return g; }
    if (params.dbg) console.log('[escape] 벽 자리를 못 찾음 — 트인 칸에', m.z.id, w, d, JSON.stringify(why));
    // 벽이 가구로 꽉 찬 방(교실 — 사방 사물함): 사방이 트인 칸에 세우고, 앞이 트이고 길을 끊지 않는 방향으로
    const R9 = Math.max(w, d) / 2;
    for (let t = 0; t < 8; t++) {
      const p = openSpot(m, { mc: R9 + 0.8, r: R9 + 0.3, strict: true, near: o.near }); if (!p) break;
      const h0 = dirH(z.cx - p[0], z.cz - p[2]);
      for (const dh of [0, 90, 270, 180]) { const fr = frame(p[0], p[1], p[2], (h0 + dh) % 360), g = { fr, stand: fr.w(0, 0, d / 2 + 0.6) };
        if (nav.snap(g.stand[0], y, g.stand[2], 0.3) >= 0 && standFree(m, g.stand) && keepsWay(m, g, w, d)) return g; }
    }
    const p = openSpot(m, { mc: R9 + 0.5, r: R9 + 0.3 }) || m.main.s.ins, fr = frame(p[0], p[1], p[2], dirH(z.cx - p[0], z.cz - p[2]));
    console.warn('[escape] 소품 자리가 마땅치 않음', m.z.id, w, d);
    return { fr, stand: fr.w(0, 0, d / 2 + 0.6) };
  }
  // 새 소품 앞(지점 자리)이 이미 있는 지점·칠판 앞과 2m 넘게 떨어졌나 — 가까우면 ✋가 엉뚱한 지점을 잡는다
  const standFree = (m, st9) => (m.hs || []).every(h => !h.hot || Math.hypot(h.hot.x - st9[0], h.hot.z - st9[2]) >= 2.0) && (!boardHot[m.z.id] || Math.hypot(boardHot[m.z.id].x - st9[0], boardHot[m.z.id].z - st9[2]) >= 2.0);
  // 이 자리에 놓아도 문 안쪽에서 방의 지점들(이미 만든 지점 · 칠판 앞 · 이 소품 앞)에 걸어서 닿는가 — 길격자에 잠깐 막아 보고 거리장(문 바깥 칸도 막음)
  function keepsWay(m, g, w, d) {
    const odd = Math.round(g.fr.h / 90) % 2 !== 0, hw = (odd ? d : w) / 2 + 0.25, hd = (odd ? w : d) / 2 + 0.25;
    const tmp = [nav.block([g.fr.x - hw, g.fr.z - hd, g.fr.x + hw, g.fr.z + hd]), ...m.doors.map(dd => { const c = dd.s ? dd.s.out : [dd.x, dd.y, dd.z], r = dd.s ? 0.45 : 0.3; return nav.block([c[0] - r, c[2] - r, c[0] + r, c[2] + r]); })];
    const D = nav.distField(m.main.s.ins, 150); for (const b9 of tmp) b9.remove();
    const reach = (x, z, r) => { for (let rr = 0; rr <= r + 1e-6; rr += 0.3) for (let a = 0; a < (rr ? 12 : 1); a++) { const an = a / 12 * Math.PI * 2, i = nav.snap(x + Math.sin(an) * rr, m.y, z - Math.cos(an) * rr, 0.16); if (i >= 0 && D[i] < 1e9) return true; } return false; };
    const pts = (m.hs || []).map(h => h.hot).filter(H => H && H.y < m.y + 0.6).map(H => [H.x, H.z, Math.max(0.3, H.r - 0.25)]);
    const bh = boardHot[m.z.id]; if (bh) pts.push([bh.x, bh.z, 0.9]); pts.push([g.stand[0], g.stand[2], 0.6]);
    return pts.every(p => reach(p[0], p[1], p[2]));
  }
  // 칠판(그림판을 붙일 곳) — 없으면 벽 자리에 판
  function boardOf(m) {
    const h = boardHot[m.z.id], see = (a, b) => { for (const t of [0.35, 0.7, 1]) clear.push([a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t, 0.8]); };   // QA-1(10-10): 서는 자리 → 칠판 사이는 비움(풍선이 칠판 숫자를 가리던 것)
    if (h && h.bx != null) { const n = [Math.sin(h.ry || 0), Math.cos(h.ry || 0)]; clear.push([h.x, h.z, 1.0]); see([h.x, 0, h.z], [h.bx, 0, h.bz]); return { paint: 'board:' + m.z.id, c: [h.bx, h.by, h.bz], n, stand: [h.x, h.y ?? m.y, h.z] }; }
    const s = wallSpot(m, 1.8, 0.1, { front: 1.0 }), c = s.fr.w(0, 1.5, 0); const n = [Math.sin(s.fr.h * R2D), -Math.cos(s.fr.h * R2D)];
    see(s.stand, c);
    return { paint: { x: c[0], y: c[1], z: c[2], w: 1.7, h: 1.1, face: s.fr.h }, c, n, stand: s.stand, bg: '#fdfbf2' };
  }
  const lineDraw = (lines, color, o = {}) => (ctx, Wd, Hd) => {   // 그림판 글(이모지는 캔버스 글꼴에 없을 수 있어 {seq}는 색 동그라미로 그린다)
    const n = lines.length; let fs = Math.min(Hd / (n + 0.6), 96); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (o.mirror) { ctx.save(); ctx.translate(Wd, 0); ctx.scale(-1, 1); }
    lines.forEach((l, i) => { const yy = Hd / 2 + (i - (n - 1) / 2) * fs * 1.15;
      if (l.includes('{seq}') && o.seq) { const r = fs * 0.36, gap = r * 3.2, x0 = Wd / 2 - (o.seq.length - 1) * gap / 2;
        o.seq.forEach((c, k) => { ctx.fillStyle = '#' + COL[c].hex.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.arc(x0 + k * gap, yy, r, 0, Math.PI * 2); ctx.fill();
          if (k < o.seq.length - 1) { ctx.fillStyle = color; ctx.font = '900 ' + (fs * 0.6) + 'px sans-serif'; ctx.fillText('→', x0 + k * gap + gap / 2, yy); } }); return; }
      let f = fs; ctx.font = '900 ' + f + 'px sans-serif'; const mw = ctx.measureText(l).width; if (mw > Wd * 0.92) { f *= Wd * 0.92 / mw; ctx.font = '900 ' + f + 'px sans-serif'; }
      ctx.fillStyle = color; ctx.fillText(l, Wd / 2, yy); });
    if (o.mirror) ctx.restore();
  };
  const T = (m, k, fb) => (m.R[k] != null ? m.R[k] : fb);   // 이야기 파일 글(없으면 화면 안내 대체 글)
  const noteOf = (m, k) => { const n = m.R[k]; return n && typeof n === 'object' ? n : null; };
  const goalsOf = m => m.R.goals || {};

  // ---------- 방마다 짓기 ----------
  const HANDLES = [];
  const look = (m, key, fr, dist, lx = 0) => { (m.look || (m.look = {}))[key] = { eye: fr.w(lx, 0, dist), h: dist < 0 ? fr.h : (fr.h + 180) % 360 }; };   // 시험 사진용(보는 자리)
  const station = (m, key, pos, r, label, use) => { const h = map.interact.add({ x: pos[0], y: pos[1], z: pos[2], r, label, use }); HANDLES.push(h); (m.hs || (m.hs = [])).push(h); m.at[key] = pos; clear.push([pos[0], pos[2], 0.8]); return h; };   // 지점끼리 떨어지게(다음 소품은 이 자리를 피한다)
  const relabel = (h, s) => { if (h && h.hot && h.hot.label !== s) h.hot.label = s; };
  const give = (id, icon, label) => S.give(id, { icon, label });
  const say = async (m, k, extra) => { const n = noteOf(m, k); if (n) await map.note(fill(n.title, extra || {}), fill(n.body, extra || {})); };
  const solveRoom = m => { if (!S.flag('r' + m.k + '_open')) S.flag('r' + m.k + '_open', true); };
  let seqMemo = null;   // 과학실에서 만든 색 순서(교무실 금고 번호 순서)

  const BUILD = {
    // ── 4학년 교실: 보이지 않는 글씨 ──
    uv(m) {
      m.steps = ['board', 'locker', 'uv', 'lock'];
      const B = boardOf(m); m.B = B;
      const a = 1 + ri(9), c = 1 + ri(9), n = 2 + ri(4); m.vals = { a, c, n }; m.code = '' + a + n + c;
      // ⭐ 보관함(문이 열림 → 🔦)
      const cb = wallSpot(m, 0.8, 0.45, { front: 1.0 }), f1 = cb.fr, D = 0.45;
      part(BOX, f1, 0, 0.65, -0.06, 0.8, 1.3, D - 0.12, 0x7fa7c9);
      part(BOX, f1, 0.375, 0.65, D / 2 - 0.06, 0.05, 1.3, 0.12, 0x6d93b5); part(BOX, f1, -0.375, 0.65, D / 2 - 0.06, 0.05, 1.3, 0.12, 0x6d93b5);
      part(BOX, f1, 0, 1.275, D / 2 - 0.06, 0.8, 0.05, 0.12, 0x6d93b5); part(BOX, f1, 0, 0.025, D / 2 - 0.06, 0.8, 0.05, 0.12, 0x6d93b5);
      part(BOX, f1, 0, 0.7, D / 2 - 0.1, 0.7, 0.03, 0.1, 0x557799);
      const torch = part(BOX, f1, 0, 0.78, D / 2 - 0.08, 0.26, 0.07, 0.07, 0x7a3fc2);
      const door = part(BOX, f1, 0.4, 0.65, D / 2 + 0.015, 0.78, 1.26, 0.03, 0x9cc0dc, { ox: -0.39 });
      const star = part(BOX, f1, 0.4, 0.95, D / 2 + 0.034, 0.2, 0.2, 0.012, 0xffd23c, { ox: -0.39 });
      solid(f1, 0.8, D, m.y, m.y + 1.3, true); look(m, 'locker', f1, 2.2);
      station(m, 'locker', f1.w(0, 0, D / 2 + 0.35), 1.0, '⭐ 보관함 열기', async () => {
        if (m.done.has('locker')) { map.hud.toast('보관함은 비었어요'); return; }
        map.sfx('pick'); anim(door, { ang: 1.9 }, 0.8); anim(star, { ang: 1.9 }, 0.8); show(torch, false);
        give('uv', '🔦', '자외선 손전등'); done(m, 'locker'); await say(m, 'locker'); });
      // 서랍장(자물쇠 → 맨 윗서랍이 스르륵)
      const dw = wallSpot(m, 0.7, 0.5, { near: [B.stand[0], B.stand[2]], front: 1.0 }), f2 = dw.fr, D2 = 0.5;
      part(BOX, f2, 0, 0.4, 0, 0.7, 0.8, D2, 0x8a8f99);
      for (const hy of [0.15, 0.4]) { part(BOX, f2, 0, hy, D2 / 2 + 0.012, 0.64, 0.21, 0.025, 0xa7adb6); part(BOX, f2, 0, hy + 0.02, D2 / 2 + 0.035, 0.18, 0.03, 0.03, 0xdadde1); }
      const dr = [part(BOX, f2, 0, 0.65, D2 / 2 + 0.012, 0.64, 0.21, 0.025, 0xc9a34a), part(BOX, f2, 0, 0.67, D2 / 2 + 0.035, 0.18, 0.03, 0.03, 0xfff1b0),
        part(BOX, f2, 0, 0.6, -0.02, 0.6, 0.1, D2 - 0.08, 0x6b6f76), part(BOX, f2, 0.12, 0.67, 0, 0.16, 0.03, 0.06, 0xffd23c), part(BOX, f2, -0.12, 0.68, 0.02, 0.16, 0.14, 0.02, 0xdfe7ee)];
      solid(f2, 0.7, D2, m.y, m.y + 0.8, true); look(m, 'drawer', f2, 1.9);
      const lockAt = f2.w(0, 0, D2 / 2 + 0.4);
      station(m, 'lock', lockAt, 1.0, '🔢 서랍 자물쇠', () => lockOpen({ title: '🔢 서랍 자물쇠', rule: T(m, 'rule', ''), code: m.code, ok: async () => {
        map.sfx('done'); for (const p of dr) anim(p, { oz: 0.38 }, 1.0);
        give('mirror', '💠', '손거울'); done(m, 'lock'); await say(m, 'drawer'); if (dead) return; solveRoom(m); } }));
      // 🎈 풍선(세기)
      const cols = [0xff6b9d, 0x4fc3f7, 0xffd23c, 0x7bed9f, 0xa29bfe, 0xff9f43];
      let nb = 0; for (let k = 0; k < n; k++) { const p = openSpot(m, { mc: 0.7, r: 0.6 }); if (!p) continue; const b = W.spawn('balloon', { x: p[0], y: p[1] + 0.3, z: p[2] }, { color: cols[k % cols.length] }); if (b) { m.props.push(b); nb++; } }
      m.vals.n = nb; m.code = '' + a + nb + c;
      // 칠판(읽기 → 자외선 비추기)
      const bh = station(m, 'board', B.stand, 1.2, '📋 칠판 살펴보기', async () => {
        if (!m.done.has('board')) { done(m, 'board'); await say(m, 'board'); if (dead) return; relabel(bh, S.has('uv') ? '🔦 칠판에 자외선 비추기' : '📋 칠판 살펴보기'); return; }
        if (!m.done.has('uv')) {
          if (!S.has('uv')) { map.hud.toast('🔦 보라색 빛이 필요해요 — ⭐ 보관함!', 3); return; }
          map.sfx('pick'); if (!night) W.light(m.z.id, false); m.relight = 3.2;
          m.paints.push(W.paint(B.paint, { bg: 'rgba(24,8,44,0.86)', draw: lineDraw(fill(T(m, 'uvText', '{a} ★ {c}'), m.vals).split('\n'), '#e8a6ff') }));
          done(m, 'uv'); relabel(bh, '📋 칠판 다시 보기'); chips(); await say(m, 'uv', m.vals); return; }
        await say(m, 'uv', m.vals); });
      m.at.uv = B.stand; m.onInv = () => relabel(bh, m.done.has('uv') ? '📋 칠판 다시 보기' : m.done.has('board') && S.has('uv') ? '🔦 칠판에 자외선 비추기' : '📋 칠판 살펴보기');
      m.clue = () => m.done.has('uv') ? '🟪 ' + m.vals.a + ' ★ ' + m.vals.c : null;
    },
    // ── 과학실: 색깔 물약 ──
    mix(m) {
      m.steps = ['board', 'mix', 'take'];
      const B = boardOf(m); m.B = B;
      m.seq = shuffle(['p', 'g', 'o']); m.mixN = 0; seqMemo = m.seq;
      m.paints.push(W.paint(B.paint, { bg: B.bg || null, draw: lineDraw(T(m, 'boardText', '{seq}').split('\n'), '#1c4096', { seq: m.seq }) }));
      station(m, 'board', B.stand, 1.2, '📋 오늘의 실험 읽기', async () => { done(m, 'board'); await say(m, 'board'); });
      // 약품장(불 셋 → 문 활짝 · 💡)
      const cu = wallSpot(m, 1.1, 0.5, { front: 1.2 }), f = cu.fr, D = 0.5;
      part(BOX, f, 0, 0.9, -0.06, 1.1, 1.8, D - 0.12, 0xe9ecef);
      part(BOX, f, 0.525, 0.9, D / 2 - 0.06, 0.05, 1.8, 0.12, 0xd3d8dd); part(BOX, f, -0.525, 0.9, D / 2 - 0.06, 0.05, 1.8, 0.12, 0xd3d8dd);
      part(BOX, f, 0, 1.775, D / 2 - 0.06, 1.1, 0.05, 0.12, 0xd3d8dd); part(BOX, f, 0, 0.025, D / 2 - 0.06, 1.1, 0.05, 0.12, 0xd3d8dd);
      for (const hy of [0.6, 1.2]) part(BOX, f, 0, hy, D / 2 - 0.1, 1.0, 0.03, 0.12, 0xb8c2cc);
      for (let k = 0; k < 4; k++) part(BOX, f, -0.35 + k * 0.12, 1.3, D / 2 - 0.12, 0.07, 0.17, 0.07, [0x9fd4ff, 0xffb3c7, 0xc8f7c5, 0xfff1a8][k]);
      const bulb = part(SPH, f, 0.2, 0.72, D / 2 - 0.1, 0.16, 0.2, 0.16, 0xfff3a0);
      const dl = part(BOX, f, 0.55, 0.9, D / 2 + 0.015, 0.54, 1.76, 0.03, 0xc5d9e8, { ox: -0.275 }), drr = part(BOX, f, -0.55, 0.9, D / 2 + 0.015, 0.54, 1.76, 0.03, 0xc5d9e8, { ox: 0.275 });
      const lamps = [0, 1, 2].map(k => ({ base: part(SPH, f, -0.25 + k * 0.25, 1.9, D / 2 - 0.08, 0.12, 0.12, 0.12, 0x555a60), glow: part(GLOW, f, -0.25 + k * 0.25, 1.9, D / 2 - 0.08, 0.17, 0.17, 0.17, 0x39ff6a, { vis: false }) }));
      solid(f, 1.1, D, m.y, m.y + 1.95, false); look(m, 'cupboard', f, 2.6);
      station(m, 'take', f.w(0, 0, D / 2 + 0.45), 1.0, '💡 약품장 살펴보기', async () => {
        if (!m.done.has('mix')) { map.hud.toast('약품장 동그라미 불이 다 켜져야 열려요 (' + m.mixN + '/3)', 3); return; }
        if (m.done.has('take')) { map.hud.toast('약품장은 비었어요'); return; }
        show(bulb, false); give('bulb', '💡', '프로젝터 전구'); give('memo', '📒', '실험 기록 ' + m.seq.map(c => COL[c].e).join('→'));
        map.sfx('pick'); done(m, 'take'); await say(m, 'cupboard', { seq: m.seq.map(c => COL[c].e).join(' → ') }); if (dead) return; solveRoom(m); });
      // 실험대(비커 셋 · 플라스크)
      let cp = null; for (let t = 0; t < 6 && !cp; t++) { const q = openSpot(m, { near: [m.z.cx, m.z.cz], mc: 1.4, r: 1.2, strict: true }); if (!q) break; if (standFree(m, q)) cp = q; }   // 사방이 트인 칸(통로를 막지 않게 · 다른 지점과 2m) — 없으면 벽에 붙인다
      const fc = cp ? frame(cp[0], cp[1], cp[2], dirH(B.c[0] - cp[0], B.c[2] - cp[2])) : wallSpot(m, 1.1, 0.6, { front: 1.2 }).fr;
      part(BOX, fc, 0, 0.84, 0, 1.1, 0.05, 0.6, 0xf2f2ee); for (const [lx, lz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) part(BOX, fc, lx, 0.41, lz, 0.05, 0.82, 0.05, 0x8a8f99);
      ['r', 'b', 'y'].forEach((c, k) => { part(BOX, fc, -0.38 + k * 0.17, 0.96, 0.05, 0.12, 0.18, 0.12, COL[c].hex); part(BOX, fc, -0.38 + k * 0.17, 1.06, 0.05, 0.13, 0.02, 0.13, 0xe8eef2); });
      m.flask = part(SPH, fc, 0.3, 1.02, 0, 0.3, 0.3, 0.3, 0xe6eef4); part(BOX, fc, 0.3, 1.22, 0, 0.07, 0.16, 0.07, 0xe6eef4);
      solid(fc, 1.1, 0.6, m.y, m.y + 1.0, true); look(m, 'cart', fc, 2.0);
      m.seenMix = false;
      station(m, 'mix', fc.w(0, 0, 0), 1.35, '🧪 색 섞기', async () => {
        if (m.done.has('mix')) { map.hud.toast('약품장이 열렸어요!'); return; }
        if (!m.seenMix) { m.seenMix = true; await say(m, 'mixNote'); if (dead) return; }
        mixOpen(m, lamps, dl, drr); });
      m.clue = () => '🧪 ' + m.seq.map((c, k) => (k < m.mixN ? '✔' : '') + COL[c].e).join(' ');
      m.teacherNear = fc;
    },
    // ── 컴퓨터실: 어둠 속 프로젝터 ──
    projector(m) {
      m.steps = ['projector', 'switch', 'mirror', 'lock'];
      const B = boardOf(m); m.B = B;
      const d1 = [2 + ri(8)]; while (d1.length < 3) { const d = 2 + ri(8); if (!d1.includes(d)) d1.push(d); } m.code = d1.join('');
      // 천장에 매단 프로젝터·거울 고리(바닥 자리를 차지하지 않는다 — 컴퓨터실은 책상 줄 사이 통로가 한 칸뿐이라 바닥 소품이 길을 막았다) · 지점은 그 밑 걷는 칸
      const zr = m.z, cl = (v, a0, a1) => Math.max(a0 + 0.8, Math.min(a1 - 0.8, v));
      const pp = [cl(B.c[0] + B.n[0] * 4.2, zr.x0, zr.x1), cl(B.c[2] + B.n[1] * 4.2, zr.z0, zr.z1)], CY = 2.5, TOPY = 3.3;
      const hP = ((Math.atan2(B.c[0] - pp[0], -(B.c[2] - pp[1])) / R2D) + 360) % 360, fp = frame(pp[0], m.y, pp[1], hP);
      part(BOX, fp, 0, (CY + 0.08 + TOPY) / 2, 0, 0.05, TOPY - CY - 0.08, 0.05, 0x8a8f99); part(BOX, fp, 0, CY + 0.09, 0, 0.2, 0.03, 0.2, 0x8a8f99);
      part(BOX, fp, 0, CY, 0, 0.36, 0.14, 0.32, 0xe4e7ea); part(SPH, fp, 0.08, CY, 0.16, 0.1, 0.1, 0.05, 0x111418);
      const lens = part(GLOW, fp, 0.08, CY, 0.175, 0.12, 0.12, 0.05, 0xfff3c4, { vis: false });
      const key = part(BOX, fp, -0.08, CY - 0.1, 0, 0.05, 0.16, 0.02, 0xffd23c), str = part(BOX, fp, -0.08, CY - 0.07, 0, 0.008, 0.02, 0.008, 0xeeeeee);
      m.lensP = fp.w(0.08, CY, 0.2);
      const under = (x, z, r) => { const i = nav.snap(x, m.y, z, r); return i >= 0 && inZ(i, zr) ? nav.pos(i) : null; };
      const ps = under(pp[0], pp[1], 1.8) || m.main.s.ins; look(m, 'cart', frame(ps[0], m.y, ps[2], hP), -1.6);
      const beam1 = part(GLOW, fp, 0, 0, 0, 0.1, 0.1, 0.1, 0xfff3c4, { vis: false }), beam2 = part(GLOW, fp, 0, 0, 0, 0.1, 0.1, 0.1, 0xfff3c4, { vis: false }), beam3 = part(GLOW, fp, 0, 0, 0, 0.1, 0.1, 0.1, 0xfff3c4, { vis: false });
      let screen = null, unlocked = false;
      const screenSpec = () => unlocked ? { bg: 'rgba(214,255,222,0.97)', draw: lineDraw(T(m, 'unlockText', 'OK').split('\n'), '#1f8a4c') }
        : { bg: m.dark9 ? 'rgba(255,253,242,0.97)' : 'rgba(255,255,255,0.28)', draw: lineDraw(T(m, 'screenText', '').split('\n'), m.dark9 ? '#1c4096' : 'rgba(120,130,150,0.55)') };
      m.setDark = on => { m.dark9 = on; if (screen) screen.redraw(screenSpec()); };
      // 거울 고리: 빛줄기의 45% 자리(천장에서 내려온 막대 끝)
      const MIR = [m.lensP[0] + (B.c[0] - m.lensP[0]) * 0.45, m.lensP[1] + (B.c[1] - m.lensP[1]) * 0.45 - 0.05, m.lensP[2] + (B.c[2] - m.lensP[2]) * 0.45];
      const fm = frame(MIR[0], m.y, MIR[2], hP);
      part(BOX, fm, 0, (MIR[1] - m.y + 0.2 + TOPY) / 2, 0, 0.03, TOPY - (MIR[1] - m.y + 0.2), 0.03, 0x8a8f99); part(SPH, fm, 0, MIR[1] - m.y + 0.19, 0, 0.07, 0.07, 0.07, 0xc9a34a);
      const mir = part(BOX, fm, 0, MIR[1] - m.y, 0, 0.34, 0.3, 0.025, 0xe8f2fa, { vis: false });
      let ms = null;   // 거울 고리 밑 걷는 칸 — 프로젝터 밑 지점과 1.6m 넘게(✋가 두 지점을 헷갈리지 않게)
      for (let rr = 0; rr <= 2.4 && !ms; rr += 0.3) for (let a = 0; a < (rr ? 12 : 1) && !ms; a++) { const q = under(MIR[0] + Math.sin(a / 12 * Math.PI * 2) * rr, MIR[2] - Math.cos(a / 12 * Math.PI * 2) * rr, 0.16); if (q && Math.hypot(q[0] - ps[0], q[2] - ps[2]) >= 1.6) ms = q; }
      ms = ms || under(MIR[0], MIR[2], 1.8) || ps;
      // 거울에서 꺾인 빛이 닿을 벽(빛줄기에 수직인 두 쪽 중 먼 벽) · 문은 비킨다
      const toWall = (x, z, dx, dz) => { let t = 1e9; if (dx > 1e-6) t = Math.min(t, (zr.x1 - x) / dx); if (dx < -1e-6) t = Math.min(t, (zr.x0 - x) / dx); if (dz > 1e-6) t = Math.min(t, (zr.z1 - z) / dz); if (dz < -1e-6) t = Math.min(t, (zr.z0 - z) / dz); return t; };
      const dIn = [MIR[0] - m.lensP[0], MIR[2] - m.lensP[2]], dl2 = Math.hypot(dIn[0], dIn[1]) || 1, ix = dIn[0] / dl2, iz = dIn[1] / dl2;
      const opts = [[-iz, ix], [iz, -ix]].map(([px, pz]) => ({ px, pz, t: toWall(MIR[0], MIR[2], px, pz) })).sort((a, b) => b.t - a.t), wo = opts[0];
      const WP = [MIR[0] + wo.px * (wo.t - 0.21), MIR[1] + 0.1, MIR[2] + wo.pz * (wo.t - 0.21)];
      { const tx = -wo.pz, tz = wo.px;   // 벽을 따라 문(1.35m 안)을 비킨다 — 거울 글씨 판이 문 위에 걸리지 않게
        for (const d of m.doors) { const dx = d.x - WP[0], dz = d.z - WP[2], a = dx * tx + dz * tz; if (Math.abs(dx * wo.px + dz * wo.pz) > 0.6 || Math.abs(a) >= 1.35) continue;
          const sh = a > 0 ? a - 1.35 : a + 1.35, nx9 = WP[0] + tx * sh, nz9 = WP[2] + tz * sh; const inWall = Math.abs(wo.pz) > 0.5 ? nx9 > zr.x0 + 0.8 && nx9 < zr.x1 - 0.8 : nz9 > zr.z0 + 0.8 && nz9 < zr.z1 - 0.8; if (inWall) { WP[0] = nx9; WP[2] = nz9; } } }
      { const ox = WP[0] - MIR[0], oz = WP[2] - MIR[2], ol = Math.hypot(ox, oz) || 1, nx = -ix + ox / ol, nz = -iz + oz / ol; mir.th = Math.atan2(nx, nz); }   // 거울 방향 = 들어온 빛(반대)과 나가는 빛의 가운데
      // 불 스위치 = 드나드는 문 옆 벽(판 하나 · 바닥 자리 없음) — 밤엔 이미 깜깜
      if (night) { m.done.add('switch'); m.dark9 = true; }
      else { const dx = m.main.s.ins[0] - m.main.x, dz = m.main.s.ins[2] - m.main.z, dl = Math.hypot(dx, dz) || 1, nx = dx / dl, nz = dz / dl, tx = -nz, tz = nx;
        let sp = null; for (const sd of [1.0, -1.0, 1.4, -1.4]) { const st9 = under(m.main.x + tx * sd + nx * 0.7, m.main.z + tz * sd + nz * 0.7, 0.35); if (st9) { sp = { sd, st9 }; break; } }
        const sd = sp ? sp.sd : 1.0, pw = [m.main.x + tx * sd + nx * 0.17, m.main.z + tz * sd + nz * 0.17], fw = frame(pw[0], m.y, pw[1], dirH(nx, nz));
        part(BOX, fw, 0, 1.25, 0.015, 0.14, 0.2, 0.03, 0xf4f4f0); const nub = part(BOX, fw, 0, 1.28, 0.035, 0.05, 0.06, 0.02, 0xffc62e);
        const swAt = sp ? sp.st9 : m.main.s.ins;
        station(m, 'switch', swAt, 1.0, '💡 불 스위치', () => {
          m.dark9 = !m.dark9; W.light(m.z.id, !m.dark9); m.setDark(m.dark9); map.sfx('tick'); nub.oy = m.dark9 ? -0.05 : 0; draw(nub);
          if (m.dark9 && !m.done.has('switch')) { done(m, 'switch'); map.hud.toast(T(m, 'dark', ''), 3); } }); }
      // 프로젝터 밑 = 전구 끼우기 → 화면 잠금 풀기
      const ch = station(m, 'projector', ps, 1.2, '📽️ 프로젝터에 전구 끼우기', async () => {
        if (!m.done.has('projector')) {
          if (!S.has('bulb')) { map.hud.toast(T(m, 'needBulb', '💡'), 3); return; }
          S.take('bulb'); map.sfx('pick'); show(lens, true); beamSet(beam1, m.lensP, B.c, 0.2);
          screen = W.paint(B.paint, screenSpec()); m.paints.push(screen);
          done(m, 'projector'); relabel(ch, '🔢 화면 잠금 풀기'); await say(m, 'projectorOn'); return; }
        if (unlocked) { map.hud.toast('화면 잠금이 풀렸어요!'); return; }
        lockOpen({ title: '🔢 화면 잠금', rule: T(m, 'rule', ''), code: m.code, ok: async () => {
          map.sfx('done'); unlocked = true; if (screen) screen.redraw(screenSpec()); done(m, 'lock');
          anim(key, { hy: m.y + 1.35 }, 1.4); anim(str, { hy: m.y + (CY - 0.07 + 1.43) / 2, sy: CY - 0.07 - 1.43 }, 1.4);   // 프로젝터에 매달린 열쇠가 줄에 달려 내려온다
          if (!night && m.dark9) { m.dark9 = false; W.light(m.z.id, true); }
          await say(m, 'unlock'); if (dead) return; solveRoom(m); } }); });
      m.at.lock = ps;
      station(m, 'mirror', ms, 1.2, '💠 거울 걸기', async () => {
        if (m.done.has('mirror')) { map.hud.toast('벽에 비친 글씨를 봐요!'); return; }
        if (!m.done.has('projector')) { map.hud.toast('프로젝터를 먼저 켜야 빛이 와요', 3); return; }
        if (!S.has('mirror')) { map.hud.toast(T(m, 'needMirror', '💠'), 3); return; }
        S.take('mirror'); map.sfx('pick'); show(mir, true);
        beamSet(beam2, m.lensP, MIR, 0.12); beamSet(beam3, MIR, WP, 0.12);
        m.paints.push(W.paint({ x: WP[0], y: WP[1], z: WP[2], w: 1.3, h: 0.62, face: dirH(-wo.px, -wo.pz) }, { bg: 'rgba(255,248,214,0.95)', draw: lineDraw([m.code], '#b0306a', { mirror: true }) }));
        m.wallAt = WP; (m.look || (m.look = {})).wall = { eye: [WP[0] - wo.px * 3.2, m.y, WP[2] - wo.pz * 3.2], h: dirH(wo.px, wo.pz) }; done(m, 'mirror'); await say(m, 'mirror'); });
      m.teacherNear = fp;
    },
    // ── 도서실: 무지개 책장 · 숨은 사다리 · 지구본 ──
    books(m) {
      m.steps = ['sign', 'books', 'globe'];
      const TOP = 1.7, Wd = 2.4, D = 0.6;
      const sh = wallSpot(m, Wd, D, { front: 1.9 }), f = sh.fr;
      const WOOD = 0xb97a4a, WL = 0xd9a066;
      part(BOX, f, Wd / 2 - 0.03, TOP / 2, 0, 0.06, TOP, D, WOOD); part(BOX, f, -Wd / 2 + 0.03, TOP / 2, 0, 0.06, TOP, D, WOOD); part(BOX, f, 0, TOP / 2, -D / 2 + 0.02, Wd, TOP, 0.04, 0x8f5d36);
      part(BOX, f, 0, TOP - 0.03, 0, Wd, 0.06, D, WOOD); part(BOX, f, 0, 0.04, 0, Wd - 0.12, 0.08, D - 0.04, WL);
      for (const hy of [0.58, 1.12]) part(BOX, f, 0, hy, 0, Wd - 0.12, 0.05, D - 0.04, WL);
      part(BOX, f, 0, 0.84, 0.02, 0.05, 0.5, D - 0.08, WOOD);   // 가운데 칸막이(왼쪽 = 무지개 책 · 오른쪽 = 숨은 칸)
      const deco = [0xf6b8c4, 0xbfe3f2, 0xfbe7a1, 0xc9e7c1, 0xd9c9f0, 0xf7d0a8];
      for (let k = 0; k < 12; k++) part(BOX, f, k < 6 ? 1.05 - k * 0.14 : -0.15 - (k - 6) * 0.15, 0.23, 0.03, 0.11, 0.3, 0.26, deco[k % 6]);   // 아래 칸 책(장식)
      for (let k = 0; k < 5; k++) part(BOX, f, 1.0 - k * 0.2, 1.145 + 0.15, 0.03, 0.12, 0.3, 0.26, deco[(k + 2) % 6]);
      // 무지개 책 5권(왼쪽 가운데 칸 — 창에서 순서를 바꾸면 이 책들의 색이 바뀐다)
      m.order = shuffle([0, 1, 2, 3, 4]); if (m.order.every((v, i) => v === i)) m.order.reverse();
      m.bookP = [0, 1, 2, 3, 4].map(k => part(BOX, f, 1.0 - k * 0.17, 0.605 + 0.19, 0.03, 0.13, 0.38, 0.28, RAINBOW[m.order[k]].hex));
      const paper = part(BOX, f, 0.6, 1.0, D / 2 + 0.005, 0.3, 0.22, 0.01, 0xfffdf2);
      // 숨은 칸 덮개(오른쪽) → 옆으로 비킴 · 사다리(맨 위 앞 모서리에서 내려옴)
      const cover = part(BOX, f, -0.6, 0.86, D / 2 + 0.02, 1.08, 1.02, 0.03, 0x9b6a40);
      const LX = -0.62, HL = Math.hypot(TOP, 1.05), ALPHA = -Math.atan2(1.05, TOP), hinge = [LX, TOP, D / 2 + 0.03];
      const ladder = [];
      for (const s of [-1, 1]) ladder.push(part(BOX, f, hinge[0], hinge[1], hinge[2], 0.05, 0.02, 0.05, 0xd98c3a, { ox: s * 0.23, oy: -0.01, tilt: ALPHA, vis: false }));
      const rungs = []; for (let j = 0; j < 7; j++) rungs.push(part(BOX, f, hinge[0], hinge[1], hinge[2], 0.46, 0.04, 0.05, 0xf2b35a, { oy: -HL * (j + 0.6) / 7.4, tilt: ALPHA, vis: false }));
      solid(f, Wd, D, m.y, m.y + TOP, false); look(m, 'shelf', f, 3.4);
      // 지구본(맨 위 왼쪽 · 전용 메시 하나 — 대륙 정점색)
      const gp = f.w(0.3, TOP + 0.36, -0.02);
      { const g = new THREE.SphereGeometry(0.24, 22, 16), P9 = g.attributes.position, col = new Float32Array(P9.count * 3);
        for (let i = 0; i < P9.count; i++) { const x = P9.getX(i), y = P9.getY(i), z = P9.getZ(i), land = Math.sin(x * 11 + 1.3) * Math.cos(z * 9 - 0.4) + Math.sin(y * 13 + x * 5) * 0.6 > 0.45;
          const c = land ? [0.36, 0.7, 0.33] : [0.2, 0.48, 0.86]; if (Math.abs(y) > 0.2) c[0] = c[1] = c[2] = 0.95; col.set(c, i * 3); }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); globe = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); globe.rotation.z = 0.41; globe.position.set(gp[0], gp[1], gp[2]); map.add(globe); }
      part(BOX, f, 0.3, TOP + 0.03, -0.02, 0.26, 0.04, 0.26, 0x6b4a2e); part(BOX, f, 0.3, TOP + 0.08, -0.02, 0.04, 0.08, 0.04, 0x6b4a2e);
      // 사서선생님(앉은 채) — 말 걸기만
      // 책장 앞 한 자리 = 쪽지 읽기 → 책 꽂기
      const bh = station(m, 'sign', f.w(0.55, 0, D / 2 + 0.55), 1.0, '📜 책장 쪽지 읽기', async () => {
        if (!m.done.has('sign')) { done(m, 'sign'); relabel(bh, '🌈 책 꽂기'); await say(m, 'sign'); return; }
        if (m.done.has('books')) { await say(m, 'sign'); return; }
        booksOpen(m); });
      m.at.books = m.at.sign;
      m.reveal = () => {   // 책을 무지개 순서로 → 덮개가 비키고 사다리가 내려옴 → 오를 수 있게(보이지 않는 계단 — 한 단 ≤ 0.17)
        show(paper, true); anim(cover, { ox: -1.1 }, 0.9);
        for (const p of ladder) anim(p, { sy: HL, oy: -HL / 2 }, 1.3, { delay: 0.8, show: true });
        rungs.forEach((p, j) => anim(p, { sy: 0.04 }, 0.15, { delay: 0.8 + 1.3 * (j + 0.6) / 7.4, show: true }));
        const n = 10; for (let i = 0; i < n; i++) { const top = TOP * (i + 1) / n, lz1 = D / 2 + 1.05 * (n - i) / n; solid(f, 0.56, lz1 - D / 2, m.y, m.y + top, false, LX, D / 2 + (lz1 - D / 2) / 2); }
        m.at.globe = [gp[0], m.y + TOP, gp[2]];
      };
      m.ladderFoot = f.w(LX, 0, D / 2 + 1.4); m.ladderH = (f.h + 180) % 360;
      station(m, 'globe', [gp[0], m.y + TOP, gp[2]], 1.5, '🌍 지구본 돌리기', async () => {
        if (m.done.has('globe')) { await say(m, 'globe'); return; }
        m.spin = 2.2; map.sfx('pick'); done(m, 'globe');
        await new Promise(r => { m.spinDone = r; }); if (dead) return;
        await say(m, 'globe'); if (dead) return; solveRoom(m); });
      m.at.globe = f.w(0.3, 0, D / 2 + 1.2);
      m.teacherStay = true;
    },
    // ── 교무실: 잠입 · 캡슐 조각 · 금고 ──
    stealth(m) {
      m.steps = ['pieces', 'safe'];
      for (const c of map.hide.candidates({ zone: m.z.id, max: 10, near: [m.main.x, m.main.z], r: 20 })) clear.push([c.stand.x, c.stand.z, 0.9]);   // 숨는 자리 앞은 비워 둔다(금고·조각 지점이 '숨기'와 겹치지 않게)
      const sf = wallSpot(m, 0.7, 0.6, { front: 1.0 }), f = sf.fr, D = 0.6;
      part(BOX, f, 0, 0.45, -0.03, 0.7, 0.9, D - 0.06, 0x4a4f57); part(BOX, f, 0, 0.45, D / 2 - 0.05, 0.6, 0.76, 0.02, 0x1e2126);
      const key = part(BOX, f, 0, 0.45, D / 2 - 0.1, 0.16, 0.05, 0.05, 0xffd23c);
      const dparts = [part(BOX, f, 0.32, 0.45, D / 2 - 0.005, 0.62, 0.8, 0.05, 0x5b616b, { ox: -0.31 }), part(SPH, f, 0.32, 0.55, D / 2 + 0.03, 0.14, 0.14, 0.05, 0xc9ccd0, { ox: -0.31 }),
        part(BOX, f, 0.32, 0.35, D / 2 + 0.03, 0.04, 0.16, 0.04, 0xc9ccd0, { ox: -0.52 })];
      solid(f, 0.7, D, m.y, m.y + 0.9, true); look(m, 'safe', f, 1.9);
      m.safeAt = f.w(0, 0, D / 2 + 0.45);
      const order = seqMemo || ['p', 'g', 'o'];
      const digs = [1 + ri(9)]; while (digs.length < 3) { const d = 1 + ri(9); if (!digs.includes(d)) digs.push(d); }
      m.pieces = ['p', 'g', 'o'].map((c, k) => ({ c, d: digs[k], found: false }));
      m.code = order.map(c => m.pieces.find(p => p.c === c).d).join('');
      for (const pc of m.pieces) {
        const p = openSpot(m, { mc: 1.0, r: 1.3 }) || m.main.s.ins; pc.p = p;
        const fr = frame(p[0], p[1], p[2], 0);
        pc.part = part(SPH, fr, 0, 0.55, 0, 0.24, 0.24, 0.24, COL[pc.c].hex); pc.halo = part(GLOW, fr, 0, 0.55, 0, 0.3, 0.3, 0.3, COL[pc.c].hex);
        const h = station(m, 'pieces', p, 1.0, '🧩 ' + COL[pc.c].e + ' 캡슐 조각 줍기', async () => {
          if (pc.found) return; pc.found = true; show(pc.part, false); show(pc.halo, false); h.remove(); map.sfx('pick'); chips();
          const n9 = m.pieces.filter(q => q.found).length; goalRoom(m);
          const line = COL[pc.c].e + ' ' + COL[pc.c].n + ' 조각 — 숫자 ' + pc.d;
          if (n9 === 1) { const nt = noteOf(m, 'piece'); await map.note(nt ? nt.title : '🧩', (nt ? nt.body + '\n\n' : '') + line); } else map.hud.toast(line, 3);
          if (dead) return; if (n9 === 3) done(m, 'pieces'); });
      }
      m.at.pieces = null;
      station(m, 'safe', m.safeAt, 1.0, '🔢 금고 자물쇠', () => lockOpen({ title: '🔢 금고', rule: T(m, 'rule', ''), code: m.code, ok: async () => {
        map.sfx('done'); for (const p of dparts) anim(p, { ang: 1.8 }, 1.0);
        done(m, 'pieces'); done(m, 'safe'); await new Promise(r => later(0.7, r)); if (dead) return; show(key, false); give('capkey', '🗝️', '타임캡슐 열쇠');
        await say(m, 'safe'); if (dead) return; solveRoom(m); } }));
      m.clue = () => '📒 ' + order.map(c => COL[c].e).join('→') + ' · 🧩 ' + m.pieces.map(p => COL[p.c].e + (p.found ? p.d : '?')).join(' ');
    },
  };
  let globe = null;

  // ---------- 이야기 파일 → 장면 목록 ----------
  const ops = a => Array.isArray(a) ? a.filter(o => o && typeof o.op === 'string') : [];
  const noteOp = n => n && typeof n === 'object' && (n.title || n.body) ? [{ op: 'note', title: n.title || '', body: n.body || '' }] : [];
  const SC = [];
  const lockAll = [];
  for (const m of rooms) for (const d of m.doors) lockAll.push({ op: 'lockDoor', door: d.n, hot: d !== m.main });
  SC.push({ id: 'start', do: [{ op: 'chapter', n: 1 }, ...lockAll, ...ops(night ? (DATA.nightIntro || DATA.intro) : DATA.intro), { op: 'flag', k: 'go' }] });
  rooms.forEach((m, i) => {
    const R = m.R, allDoors = m.doors.map(d => ({ op: 'unlockDoor', door: d.n }));
    if (i > 0) SC.push({ id: 'r' + i + '_unlock', when: { flags: ['r' + i + '_try'], has: [m.keyId] }, do: [{ op: 'unlockDoor', door: m.main.n }, { op: 'take', item: m.keyId }, { op: 'flag', k: 'r' + i + '_unlocked' }] });
    SC.push({ id: 'r' + i + '_in', when: { flags: ['r' + i + '_in'] }, do: [...(i > 0 ? [{ op: 'lockDoor', door: m.main.n, hot: false }, { op: 'sound', sfx: 'tick' }] : []), ...noteOp(night && R.enterNoteNight ? R.enterNoteNight : R.enterNote), ...ops(R.enter), { op: 'flag', k: 'r' + i + '_ready' }] });
    const nx = rooms[i + 1], key = R.key || {};
    SC.push({ id: 'r' + i + '_open', when: { flags: ['r' + i + '_open'] }, do: [...allDoors, { op: 'sound', sfx: 'ding' }, ...ops(R.solved),
      ...(nx && !m.keyHidden ? [{ op: 'give', item: nx.keyId, icon: key.icon || '🔑', label: key.label || (nx.z.label + ' 열쇠') }] : []), { op: 'chapter', n: i + 2 }, { op: 'flag', k: 'r' + i + '_done' }] });
  });
  const endOps = ops(night && DATA.nightEnding ? DATA.nightEnding : DATA.ending);
  { const lm = rooms[last], o = lm.main.s.out, tm = { op: 'moveNpc', name: '4학년 선생님', to: { x: o[0], y: o[1], z: o[2] }, pose: 'cheer', face: lm.main.s.face };
    const k = endOps.length && endOps[0].op === 'fade' ? 1 : 0; endOps.splice(k, 0, tm); }
  SC.push({ id: 'end', when: { flags: ['r' + last + '_done'] }, do: [...endOps, { op: 'flag', k: 'done' }] });

  // ---------- HUD ----------
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const touch = () => document.body.classList.contains('touch');
  let cur = -1, TT = 0, shownSec = -1, caughtN = 0, hintOn = 0, beam = null, ui = null, walkMark = null;
  const curStep = m => m.steps.find(k => !m.done.has(k)) || null;
  function chips() {
    const m = rooms[cur];
    map.hud.chip('esc-time', '⏱ ' + fmt(TT) + (caughtN ? ' · 🔔' + caughtN : ''));
    map.hud.chip('esc-clue', m && st === 'room' && m.clue ? m.clue() : null);
    map.hud.chip('esc-hint', m && st === 'room' && m.stepT > HINT_T && curStep(m) ? (touch() ? '💡 힌트' : '💡 힌트(H)') : null, { onClick: showHint });
  }
  function setMark(p, label) {
    hintOn = 0;
    if (beam) { beam.remove(); beam = null; }
    if (p) beam = map.mk.marker(p[0], p[1], p[2], { color: 0x3cc8ff, beam: true });
    walkMark = p ? [{ x: p[0], z: p[2], color: '#2b8fe0', shape: 'star', blink: true, label }] : [];
    map.minimap.setMarks(walkMark);
  }
  function showHint() {
    const m = rooms[cur]; if (!m || st !== 'room') return; const k = curStep(m); if (!k) return;
    const hs = (m.R.hints && m.R.hints[k]) || [], txt = hs.length ? hs[Math.min(m.tier, hs.length - 1)] : '';
    m.tier++; map.sfx('pick'); if (txt) map.hud.toast('💡 ' + txt, 7);
    const pts = k === 'pieces' ? m.pieces.filter(p => !p.found).map(p => p.p) : m.at[k] ? [m.at[k]] : [];
    if (pts.length) { hintOn = HINT_SHOW; map.minimap.show({ big: false }); map.minimap.setMarks(pts.map(p => ({ x: p[0], z: p[2], color: '#ffb000', shape: 'dot', blink: true }))); }
  }
  const keyH = e => { if (e.code === 'KeyH' && !e.repeat && !ui && st === 'room') showHint(); };
  addEventListener('keydown', keyH);
  function done(m, k) { if (m.done.has(k)) return; m.done.add(k); m.stepT = 0; m.tier = 0; if (rooms[cur] === m && st === 'room') { goalRoom(m); chips(); } }
  S.on(type => { if (type === 'inv') for (const m of rooms) if (m.onInv) m.onInv(); });

  // ---------- 창(자물쇠 · 색 섞기 · 책 꽂기 — 여는 동안 멈춤 · 키보드와 터치 둘 다) ----------
  function uiOpen(html, kd) {
    if (ui) uiClose();
    document.exitPointerLock?.();
    const el = document.createElement('div'); el.className = 'esc-lock'; el.innerHTML = html; const t0 = performance.now();
    const k9 = e => { if (performance.now() - t0 < 200) return; if (kd(e) !== false) { e.preventDefault(); e.stopImmediatePropagation(); } };
    addEventListener('keydown', k9, true); document.body.appendChild(el); map.player.freeze(true); ui = { el, kd: k9 }; return el;
  }
  function uiClose() { if (!ui) return; removeEventListener('keydown', ui.kd, true); ui.el.remove(); ui = null; if (!dead && !map.gone && !map.player.hidden()) map.player.freeze(false); }
  const shake = el => { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); };
  const btn = (el, sel, fn) => { const b = el.querySelector(sel); if (b) b.onclick = ev => { ev.stopPropagation(); fn(); }; };
  function lockOpen(o) {
    if (ui) { uiClose(); return; }
    if (st !== 'room') return;
    const n = o.code.length, vals = new Array(n).fill(0); let at = 0;
    const el = uiOpen('<h3></h3><p></p><div class="esc-dials"></div><div class="esc-row"><button class="ok">열기</button><button class="no">닫기</button></div>', e => {
      if (/^Digit\d$|^Numpad\d$/.test(e.code)) { vals[at] = +e.code.slice(-1); at = Math.min(n - 1, at + 1); map.sfx('tick'); drawD(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') bump(1); else if (e.code === 'ArrowDown' || e.code === 'KeyS') bump(-1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { at = Math.max(0, at - 1); drawD(); } else if (e.code === 'ArrowRight' || e.code === 'KeyD') { at = Math.min(n - 1, at + 1); drawD(); }
      else if (e.code === 'Enter' || e.code === 'Space') tryIt(); else if (e.code === 'Escape' || e.code === 'KeyE') uiClose();
      else return false; });
    el.querySelector('h3').textContent = o.title; el.querySelector('p').textContent = o.rule || '';
    const box = el.querySelector('.esc-dials'), spans = [];
    for (let k = 0; k < n; k++) { const d = document.createElement('div'); d.className = 'esc-dial'; d.innerHTML = '<button>▲</button><span>0</span><button>▼</button>';
      const [up, dn] = d.querySelectorAll('button'); up.onclick = ev => { ev.stopPropagation(); at = k; bump(1); }; dn.onclick = ev => { ev.stopPropagation(); at = k; bump(-1); };
      d.querySelector('span').onclick = ev => { ev.stopPropagation(); at = k; drawD(); }; box.appendChild(d); spans.push(d); }
    const drawD = () => spans.forEach((d, k) => { d.querySelector('span').textContent = vals[k]; d.classList.toggle('cur', k === at); });
    const bump = s => { vals[at] = (vals[at] + s + 10) % 10; map.sfx('tick'); drawD(); };
    const tryIt = () => { if (vals.join('') === o.code) { uiClose(); o.ok(); return; } map.sfx('buzz'); map.hud.toast('🔒 번호가 달라요'); shake(el); };
    btn(el, '.ok', tryIt); btn(el, '.no', uiClose); drawD();
  }
  function mixOpen(m, lamps, dl, drr) {
    const pick = [];
    const el = uiOpen('<h3>🧪 색 섞기</h3><div class="esc-prog"></div><p>비커 두 개를 골라 섞어요</p><div class="esc-cols"></div><div class="esc-row"><button class="ok">섞기</button><button class="no">닫기</button></div>', e => {
      const i = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code); if (i >= 0) { tog(['r', 'b', 'y'][i % 3]); return; }
      if (e.code === 'Enter' || e.code === 'Space') doMix(); else if (e.code === 'Escape' || e.code === 'KeyE') uiClose(); else return false; });
    const box = el.querySelector('.esc-cols'), bs = {};
    ['r', 'b', 'y'].forEach((c, k) => { const b = document.createElement('button'); b.style.background = '#' + COL[c].hex.toString(16).padStart(6, '0'); b.textContent = (k + 1) + ' ' + COL[c].n; b.onclick = ev => { ev.stopPropagation(); tog(c); }; box.appendChild(b); bs[c] = b; });
    const prog = () => { el.querySelector('.esc-prog').textContent = m.seq.map((c, k) => (k < m.mixN ? '✅' : k === m.mixN ? COL[c].e : '⬜')).join(' '); for (const c in bs) bs[c].classList.toggle('on', pick.includes(c)); };
    const tog = c => { const i = pick.indexOf(c); if (i >= 0) pick.splice(i, 1); else { if (pick.length >= 2) pick.shift(); pick.push(c); } map.sfx('tick'); prog(); };
    const doMix = () => {
      if (pick.length < 2) { map.hud.toast('비커 두 개를 골라요', 2); shake(el); return; }
      const r = mixOf(pick[0], pick[1]); recolor(m.flask, COL[r].hex); pick.length = 0;
      if (r === m.seq[m.mixN]) { recolor(lamps[m.mixN].base, 0x39ff6a); show(lamps[m.mixN].glow, true); m.mixN++; map.sfx('done'); map.hud.toast(COL[r].e + ' ' + T(m, 'mixOk', ''), 2.5); m.stepT = 0; chips(); goalRoom(m);
        if (m.mixN >= 3) { uiClose(); anim(dl, { ang: 1.9 }, 1.1, { delay: 0.3 }); anim(drr, { ang: -1.9 }, 1.1, { delay: 0.3 }); done(m, 'mix'); map.hud.toast('🧪 약품장 문이 열려요!', 3); return; } }
      else { map.sfx('buzz'); map.hud.toast(COL[r].e + ' ' + (pick[0] === pick[1] ? '' : '') + T(m, 'mixBad', ''), 2.5); shake(el); }
      prog(); };
    btn(el, '.ok', doMix); btn(el, '.no', uiClose); prog();
  }
  function booksOpen(m) {
    let sel = -1, at = 0;
    const el = uiOpen('<h3>🌈 책 꽂기</h3><p>두 권을 차례로 누르면 자리가 바뀌어요</p><div class="esc-books"></div><div class="esc-row"><button class="no">닫기</button></div>', e => {
      const d = /^Digit([1-5])$|^Numpad([1-5])$/.exec(e.code); if (d) { tap(+(d[1] || d[2]) - 1); return; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { at = Math.max(0, at - 1); drawB(); } else if (e.code === 'ArrowRight' || e.code === 'KeyD') { at = Math.min(4, at + 1); drawB(); }
      else if (e.code === 'Enter' || e.code === 'Space') tap(at); else if (e.code === 'Escape' || e.code === 'KeyE') uiClose(); else return false; });
    const box = el.querySelector('.esc-books'), bs = [];
    for (let k = 0; k < 5; k++) { const b = document.createElement('button'); b.onclick = ev => { ev.stopPropagation(); tap(k); }; box.appendChild(b); bs.push(b); }
    const drawB = () => bs.forEach((b, k) => { b.style.background = '#' + RAINBOW[m.order[k]].hex.toString(16).padStart(6, '0'); b.textContent = (k + 1); b.classList.toggle('on', k === sel); b.classList.toggle('cur', k === at && !touch()); });
    const tap = k => { at = k; if (sel < 0) { sel = k; map.sfx('tick'); drawB(); return; }
      if (sel !== k) { const t = m.order[sel]; m.order[sel] = m.order[k]; m.order[k] = t; recolor(m.bookP[sel], RAINBOW[m.order[sel]].hex); recolor(m.bookP[k], RAINBOW[m.order[k]].hex); map.sfx('pick'); }
      sel = -1; drawB();
      if (m.order.every((v, i) => v === i)) { uiClose(); map.sfx('done'); done(m, 'books'); m.reveal(); later(2.3, () => say(m, 'booksOk')); } };
    btn(el, '.no', uiClose); drawB();
  }

  // ---------- 선생님(직함) — 그 방 힌트 말하기 ----------
  function teacherSetup(m) {
    const name = m.R.teacher; if (!name) return;
    const p = map.npc.get(name); if (!p) { console.warn('[escape] 선생님이 없음', name); return; }
    let at = [p.x, p.y, p.z];
    if (!m.teacherStay && m.teacherNear) {   // 실험대·프로젝터 곁으로(자리만 옮김 — 대역)
      const fc = m.teacherNear, sp = openSpot(m, { near: [fc.x + 1.9, fc.z + 0.4], mc: 1.0, r: 0.6, minFrom: [fc.x, fc.z, 1.7], strict: true });   // 트인 칸이 없으면 제자리(좁은 통로에 세우지 않게)
      if (sp) { at = sp; map.npc.move(name, { x: sp[0], y: sp[1], z: sp[2] }, { pose: 'explain', face: dirH(fc.x - sp[0], fc.z - sp[2]) }); }
    }
    station(m, 'talk', at, 1.1, '💬 ' + name + '께 여쭤보기', async () => {
      const k = curStep(m) || 'done', tk = (m.R.talk && (m.R.talk[k] || m.R.talk.done)) || ((m.R.hints && m.R.hints[k]) || [])[0] || '';
      if (tk) await map.note('💬 ' + name, tk); m.stepT = Math.max(m.stepT, HINT_T + 1); chips(); });
  }

  // ---------- 잠입(교무실): 웅크리기 · 숨는 자리 · 순찰 로봇(밤 = 장난감 유령) ----------
  let bot = null; const hides = [];
  function stealthOn(m) {
    map.player.crouch(true);
    const ki = m.main.s.ins, avoid = [m.safeAt, ...m.pieces.map(p => p.p)];
    for (const c of map.hide.candidates({ zone: m.z.id, max: 10, near: [m.main.x, m.main.z], r: 20 })) {
      if (hides.length >= 5 || Math.hypot(c.stand.x - ki[0], c.stand.z - ki[2]) < 1.5 || avoid.some(a => a && Math.hypot(c.stand.x - a[0], c.stand.z - a[2]) < 1.2)) continue;
      const h = map.hide.add(c); if (h.spot) hides.push(h); }
    const z = m.z, ins = 1.3;
    const cs = [[z.x0 + ins, z.z0 + ins], [z.x1 - ins, z.z0 + ins], [z.x1 - ins, z.z1 - ins], [z.x0 + ins, z.z1 - ins]].map(([x, zz]) => {
      for (const r of [0.8, 1.6, 2.4]) { const i = nav.snap(x, m.main.y, zz, r); if (i >= 0 && inZ(i, z)) return nav.pos(i); } return null; }).filter(Boolean);
    cs.sort((a, b) => Math.hypot(b[0] - m.main.x, b[2] - m.main.z) - Math.hypot(a[0] - m.main.x, a[2] - m.main.z));
    if (cs.length >= 4 && Math.hypot(cs[3][0] - m.main.x, cs[3][2] - m.main.z) < 3.2) cs.pop();
    const path = cs.length >= 3 ? [cs[0], ...cs.slice(1).sort((a, b) => Math.atan2(a[2] - z.cz, a[0] - z.cx) - Math.atan2(b[2] - z.cz, b[0] - z.cx))] : cs;
    const home = m.main.s.ins;
    bot = map.chaser.spawn({ kind: night ? 'ghost' : 'patrol', at: path[0] || home, path: path.length >= 2 ? path : null, zone: z.id,
      speed: night ? 0.9 : 1.05, chase: night ? 2.2 : 2.5, fov: night ? 90 : 80, range: night ? 5 : 5.5, hear: 1, home,
      onCatch: () => { caughtN++; uiClose(); map.player.teleport(home, { h: m.main.s.face }); map.hud.toast('🔔 딩동! 문 앞에서 다시 해 봐요', 2.5); chips(); } });
  }
  function stealthOff() { if (bot) { bot.remove(); bot = null; } for (const h of hides.splice(0)) h.remove(); map.player.crouch(false); }

  // ---------- 진행 ----------
  const goalRoom = m => {
    const k = curStep(m), g = goalsOf(m), num = CIRC[m.k] || '';
    const n9 = k === 'mix' ? m.mixN : k === 'pieces' ? m.pieces.filter(p => p.found).length : 0;
    const txt = k ? fill(g[k] || k, { n: n9 }) : '🎉';
    const sneak = m.stealth ? (touch() ? ' · ⬇ ✋숨기' : ' · C 웅크리기 · E 숨기') : '';
    map.hud.goal(num + ' ' + (touch() ? '' : m.z.label + ' — ') + txt + sneak);
  };
  function cleanRoom(m) {   // 지난 방의 그림판·풍선·스위치(그 방에 다시 올 일 없음 — 그리기 양을 줄인다)
    for (const p of m.paints.splice(0)) if (p) p.remove(); for (const p of m.props.splice(0)) if (p) p.remove();
    if (m.puzzle === 'books' && globe) globe.visible = false;
  }
  function enterRoom(i) {
    cur = i; st = 'room'; const m = rooms[i]; m.stepT = 0;
    for (let k = 0; k < i - 1; k++) cleanRoom(rooms[k]);
    setMark(null); goalRoom(m); chips();
    if (m.stealth) stealthOn(m);
  }
  let starH = null;
  function toNext(i) {   // i번 방을 풀었다 → 다음 방 문으로(도서실 = 지도 ⭐ 자리에서 열쇠부터)
    const m = rooms[i]; if (m.stealth) stealthOff();
    const nx = rooms[i + 1]; if (!nx) { st = 'ending'; setMark(null); return; }
    st = 'walk'; cur = i + 1; chips();
    if (m.keyHidden && !S.has(nx.keyId)) {
      const o = nx.main.s.out, fc = nx.main.s.face * R2D, px = Math.cos(fc), pz = Math.sin(fc);
      let sp = null; for (const s of [1.5, -1.5, 2.2, -2.2]) { const x = o[0] + px * s, z = o[2] + pz * s; if (!map.q.blocked(x, z, o[1] + 0.05) && nav.snap(x, o[1], z, 0.3) >= 0) { sp = [x, o[1], z]; break; } }
      sp = sp || o;
      const pl = W.spawn('plant', { x: sp[0], y: sp[1], z: sp[2] }, { solid: false, s: 1.2 }); if (pl) nx.props.push(pl);
      starH = map.investigate.add({ x: sp[0], y: sp[1], z: sp[2], r: 1.2, label: '🔍 화분 살펴보기', onUse: async () => {
        if (S.has(nx.keyId) || S.flag('r' + nx.k + '_unlocked')) return; const kk = m.R.key || {};
        give(nx.keyId, kk.icon || '🔑', kk.label || (nx.z.label + ' 열쇠')); map.sfx('ding'); if (starH) { starH.remove(); starH = null; }
        await say(m, night && m.R.keyFoundNight ? 'keyFoundNight' : 'keyFound'); if (dead) return; keyGoal(m, nx); } });
      map.hud.goal((CIRC[m.k] || '') + ' ' + fill(goalsOf(m).key || '⭐', {})); setMark(sp, '⭐');
      return;
    }
    keyGoal(m, nx);
  }
  function keyGoal(m, nx) {
    map.hud.goal((CIRC[nx.k] || '') + ' ' + (m.R.key && m.R.key.label ? (m.R.key.icon || '🔑') + ' ' + m.R.key.label : '🔑 열쇠') + '로 ' + nx.z.label + ' 문을 열어요');
    setMark(nx.main.s.out, nx.z.label);
  }
  S.on((type, d) => {
    if (dead || type !== 'flag') return;
    const mm = /^r(\d+)_(ready|done|unlocked)$/.exec(d.k);
    if (d.k === 'go') { st = 'play'; TT = 0; map.player.freeze(false); map.hud.banner('시작!', 1.0); map.sfx('go');
      if (startRoom === 0) S.flag('r0_in', true); else { st = 'walk'; cur = startRoom; give(rooms[startRoom].keyId, '🔑', rooms[startRoom].z.label + ' 열쇠'); keyGoal(rooms[startRoom - 1], rooms[startRoom]); } }
    else if (d.k === 'done') finish();
    else if (mm) { const i = +mm[1];
      if (mm[2] === 'ready') enterRoom(i);
      else if (mm[2] === 'done') toNext(i);
      else if (mm[2] === 'unlocked') { if (rooms[i].keyH) { rooms[i].keyH.remove(); rooms[i].keyH = null; } map.hud.goal((CIRC[i] || '') + ' ' + rooms[i].z.label + '에 들어가요'); } }
  });
  // 다음 방 문 '열쇠로 열기'(바깥쪽)
  function keyDoor(m) {
    const o = m.main.s.out;
    m.keyH = map.investigate.add({ x: o[0], y: o[1], z: o[2], r: 1.2, label: '🔑 ' + m.z.label + ' 열쇠로 열기', onUse: () => { if (!S.has(m.keyId)) { map.sfx('buzz'); map.hud.toast('🔒 ' + m.z.label + ' 열쇠가 있어야 해요'); return; } S.flag('r' + m.k + '_try', true); } });
  }
  async function finish() {
    if (st === 'end') return; st = 'end'; setMark(null); stealthOff(); uiClose(); chips();
    for (const h of HANDLES.splice(0)) { try { h.remove(); } catch (e) { /* */ } }   // QA-1(10-10): 성공 창 뒤에 'E 금고 자물쇠'가 남던 것
    map.hud.chip('esc-clue', null); map.hud.chip('esc-hint', null);
    const bestKey = BK + (night ? 'bestNight' : 'best'), best = map.store.get(bestKey, null), nb = best == null || TT < best;
    if (nb) map.store.set(bestKey, Math.floor(TT));
    map.hud.goal('🎉 방탈출 성공!'); map.sfx('done');
    const k = await map.hud.ask('🎉 ' + (DATA.title || '학교 방탈출') + ' 성공!\n걸린 시간 ' + fmt(TT) + (nb ? ' (가장 빠른 기록!)' : ' · 가장 빠른 기록 ' + fmt(best)) + '\n잡힌 횟수 ' + caughtN + (night ? ' · 🌙 밤' : ' · ☀️ 낮'), ['그만하기']);
    if (dead) return; void k; map.quit();
  }

  // ---------- 짓기 · 시작 ----------
  const startRoom = Math.max(0, Math.min(last, (+params.room || 1) - 1));
  const r0 = rooms[startRoom];
  const startAt = startRoom === 0 ? (openSpot(r0, { mc: 1.0, r: 1.6, near: [r0.z.cx, r0.z.cz] }) || r0.main.s.ins) : r0.main.s.out;
  for (const m of rooms) { try { BUILD[m.puzzle](m); } catch (e) { console.error('[escape] 방 짓기 실패', m.z.id, e); m.steps = []; m.buildFail = true; } }
  for (const m of rooms) teacherSetup(m);
  // 방과 후: 쓰는 방의 학생·(말 걸 선생님이 아닌) 선생님은 잠깐 숨김(판이 끝나면 제자리) — 이름 있는 학생에게 말을 시키지 않는다
  for (const m of rooms) for (const p of map.npc.list({ room: m.z.id })) if (p.name !== m.R.teacher && !p.moved) map.npc.hide(p.id);
  { const t4 = map.npc.get('4학년 선생님'); if (t4 && !t4.hidden && !t4.moved) map.npc.hide('4학년 선생님'); }
  // 걸어서 닿는지(방 문 안쪽에서 길격자 — 소품·사람이 통로를 막아 못 가는 지점은 가장 가까운 닿는 칸으로 옮기고 경고)
  function reachFix(m) {
    const bl = m.doors.map(d => { const c = d.s ? d.s.out : [d.x, d.y, d.z], r = d.s ? 0.45 : 0.3; return nav.block([c[0] - r, c[2] - r, c[0] + r, c[2] + r]); });   // 판 동안 문은 잠겨 있다 — 문 바깥 칸만 막아 다른 문으로 돌아 들어오는 길은 치지 않게(문 안쪽 벽을 따라 난 길은 그대로)
    const D = nav.distField(m.main.s.ins, 150); for (const b9 of bl) b9.remove();
    const okAt = (x, z, r) => { for (let rr = 0; rr <= r + 1e-6; rr += 0.3) for (let a = 0; a < (rr ? 12 : 1); a++) { const an = a / 12 * Math.PI * 2, i = nav.snap(x + Math.sin(an) * rr, m.y, z - Math.cos(an) * rr, 0.16); if (i >= 0 && D[i] < 1e9) return nav.pos(i); } return null; };
    for (const h of m.hs || []) { const H = h.hot; if (!H || H.y > m.y + 0.6 || okAt(H.x, H.z, Math.max(0.3, H.r - 0.25))) continue;
      const q = okAt(H.x, H.z, 3.0); console.warn('[escape] 닿지 않는 지점 — 옮김', m.z.id, H.label, q); if (q) { H.x = q[0]; H.z = q[2]; } m.fixN = (m.fixN || 0) + 1; }
  }
  for (const m of rooms) reachFix(m);
  // ?room=n(교사 시연·시험): 앞 방에서 얻었을 물건을 가방에
  for (let k = 0; k < startRoom; k++) { const m = rooms[k];
    if (m.puzzle === 'uv') give('mirror', '💠', '손거울'); if (m.puzzle === 'mix') { give('bulb', '💡', '프로젝터 전구'); give('memo', '📒', '실험 기록 ' + m.seq.map(c => COL[c].e).join('→')); }
    cleanRoom(m); }
  if (night) { map.time('night'); map.lights(false); map.flashlight(true); }
  for (const m of rooms) if (m.k > 0) keyDoor(m);
  map.player.teleport(startAt, { h: startRoom === 0 ? (r0.main.s.face + 180) % 360 : 0 });
  map.minimap.show();
  map.hud.banner(' ', 0.02);
  const runner = S.run(SC, {});

  // ---------- 틱(가벼움: 초 칩 · 움직임 · 들어섬 확인 5Hz) ----------
  let chk = 0, wasTouch = touch(), bobT = 0;
  return {
    tick(dt) {
      if (ANIMS.length) animTick(dt);
      for (let k = LATER.length - 1; k >= 0; k--) if ((LATER[k].t -= dt) <= 0) { const f = LATER[k].fn; LATER.splice(k, 1); if (!dead) f(); }
      for (let k = 0; k < rooms.length; k++) { const m = rooms[k];
        if (m.relight > 0 && (m.relight -= dt) <= 0) { if (!night) W.light(m.z.id, true); }
        if (m.spin > 0) { m.spin -= dt; if (globe) globe.rotation.y += dt * (2 + m.spin * 5); if (m.spin <= 0 && m.spinDone) { const r = m.spinDone; m.spinDone = null; r(); } }
      }
      if (st === 'prep' || st === 'end' || st === 'ending' || dead) return;
      TT += dt; const m = rooms[cur]; if (m && st === 'room') m.stepT += dt;
      if (m && m.pieces && st === 'room') { bobT += dt; for (let k = 0; k < m.pieces.length; k++) { const pc = m.pieces[k]; if (pc.found) continue; pc.part.bob = pc.halo.bob = Math.sin(bobT * 2.4 + pc.d) * 0.06; draw(pc.part); draw(pc.halo); } }
      if (hintOn > 0 && (hintOn -= dt) <= 0) { hintOn = 0; map.minimap.setMarks(st === 'walk' && walkMark ? walkMark : []); }
      const sec = Math.floor(TT); if (sec !== shownSec) { shownSec = sec; chips(); }
      if ((chk += dt) < 0.2) return; chk = 0;
      if (touch() !== wasTouch) { wasTouch = !wasTouch; if (st === 'room' && m) goalRoom(m); }
      // 다음 방 들어섬: 그 방 구역 안 + 문에서 1.8m 넘게(문을 다시 잠가도 몸이 문틀에 걸리지 않게)
      if (st === 'walk' && cur >= 0 && S.flag('r' + cur + '_unlocked') && !S.flag('r' + cur + '_in')) {
        const p = map.player.get();
        if (p.zone === m.z.id && Math.hypot(p.x - m.main.x, p.z - m.main.z) > 1.8) S.flag('r' + cur + '_in', true);
      }
    },
    stop() {
      dead = true; uiClose(); removeEventListener('keydown', keyH); css.remove();
      for (const P of POOLS) { P.m.geometry.dispose(); P.m.material.dispose(); if (P.m.dispose) P.m.dispose(); }
      if (globe) { globe.geometry.dispose(); globe.material.dispose(); globe = null; }
    },
    // 시험·교사 시연용(읽기 전용)
    get state() { return st; }, get room() { return cur; }, get night() { return night; }, get caught() { return caughtN; }, get runner() { return runner; }, get bot() { return bot; }, get time() { return TT; },
    get rooms() { return rooms.map(m => ({ zone: m.z.id, label: m.z.label, puzzle: m.puzzle, code: m.code, seq: m.seq, vals: m.vals, order: m.order && m.order.slice(), steps: m.steps, done: [...m.done], cur: curStep(m),
      at: Object.fromEntries(Object.entries(m.at).filter(([, v]) => v)), main: { n: m.main.n, ins: m.main.s.ins, out: m.main.s.out, face: m.main.s.face }, doors: m.doors.map(d => d.n),
      pieces: m.pieces && m.pieces.map(p => ({ c: p.c, d: p.d, p: p.p, found: p.found })), wall: m.wallAt, ladder: m.ladderFoot && { foot: m.ladderFoot, h: m.ladderH }, stealth: m.stealth, fail: !!m.buildFail, fix: m.fixN || 0 })); },
    get hides() { return hides.map(h => h.spot && { x: h.spot.x, z: h.spot.z, stand: h.spot.stand, label: h.spot.label }); },
    get look() { return rooms.map(m => m.look || {}); }, get lockOpen() { return !!ui; }, get ui() { return ui ? ui.el.querySelector('h3').textContent : null; }, get start() { return startAt; }, get parts() { return POOLS.map(P => P.n); },
  };
}
