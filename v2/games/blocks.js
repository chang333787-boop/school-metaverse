// v2 블록 놀이(BLOCK-1 · 10-03 교사 "우리 학교에 블록 — 지금 퀄리티 그대로" · "가구까지 부숴야 예쁘다")
//  지금 학교는 그대로 두고 그 위에 0.5m 블록을 놓고 부순다. 가구(책상·책장·사물함…)는 통째로 퍽 부서진다(map.world.furn — 게임이 멈추면 처음대로).
//  판 = metaverse/blockList/<판> {t 이름, n 순서, lock 잠금, open 모두 고치기} · 블록 = metaverse/blocks/<판>/b/<x_z_q> {t 종류, b 놓은 사람} · 부순 가구 = metaverse/blocks/<판>/f/<id> {b, t}
//  듣기 = 판 하나에 연결 하나(blocks/<판> — 학교 와이파이 연결 수 아끼기) · 잠금·모두 고치기는 15초마다 확인
//  🏠 나만의 판 = 이 기기에만(map.store — 2초에 한 번 저장). 같은 판 친구 블록은 바로 보인다(EventSource) · 함께하기 방이면 친구 모습도(net.js).
//  시제품 실측(10-03): 블록 5,170개 = 화면 삼각형 +3.4만·그리기 +26·걷기 계산 +0.1ms · 한 칸 다시 짓기 ≤0.6ms → 판마다 4,000개까지 · 64m 밖 블록 칸은 안 그림.
//  블록 좌표: x·z = 0.5m 격자(ix, iz) · 높이 q = 5cm 단위(놓인 땅 높이를 따른다 — 운동장 -1.35 · 바닥 0 · 2층) · 블록은 그림자를 받기만(굽기 없음).
export const meta = { id: 'blocks', title: '블록 놀이', api: 1 };
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const S = 0.5, CK = 8, MAXB = 4000, FAR = 64, REACH = 9;
export const TYPES = [
  { n: '흰 블록', c: '#f2ede2' }, { n: '빨강', c: '#e04a3f' }, { n: '주황', c: '#f39233' }, { n: '노랑', c: '#f5cf3d' },
  { n: '연두', c: '#9ccf4a' }, { n: '나뭇잎', c: '#3f8f45', tex: 'leaf' }, { n: '하늘', c: '#7ec8f2' }, { n: '파랑', c: '#2f6fd6' },
  { n: '보라', c: '#8d5ad8' }, { n: '분홍', c: '#f39cc2' }, { n: '나무판', c: '#b98550', tex: 'plank' }, { n: '벽돌', c: '#b5553f', tex: 'brick' },
  { n: '돌', c: '#9b9b97', tex: 'stone' }, { n: '유리', c: '#cfeefe', glass: true }, { n: '검정', c: '#33363b' }, { n: '빛 블록', c: '#fff1a6', glow: true },
];
const WHY = { full: '이 판은 블록이 가득 찼어요(4,000개) — 몇 개 부수고 놓아요', out: '학교 밖에는 못 놓아요', high: '너무 높아요', ground: '땅속에는 못 놓아요', have: '여기는 이미 블록이 있어요',
  wall: '벽·가구와 겹쳐요 — 한 칸 옆에 놓아요', me: '내 몸 자리예요 — 한 걸음 비켜서 놓아요', far: '너무 멀어요 — 가까이 가서 놓아요', lock: '🔒 선생님이 잠근 판이에요 — 보기만 할 수 있어요' };
const STYLE = `
#bk-bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:4px;padding:5px;background:rgba(20,28,40,.62);border-radius:12px;z-index:30}
#bk-bar .s{width:34px;height:34px;border-radius:7px;border:2px solid rgba(255,255,255,.25);background-size:800% 200%;image-rendering:pixelated;cursor:pointer;position:relative;padding:0}
#bk-bar .s.on{border-color:#ffd43b;box-shadow:0 0 0 2px #ffd43b}
#bk-bar .s i{position:absolute;right:2px;bottom:1px;font:700 10px/1 sans-serif;color:#fff;text-shadow:0 1px 2px #000;font-style:normal}
#bk-tip{position:fixed;left:50%;bottom:62px;transform:translateX(-50%);background:rgba(20,28,40,.72);color:#fff;font:13px/1.4 sans-serif;padding:5px 12px;border-radius:8px;z-index:30;pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
#bk-tb{position:fixed;right:calc(90px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));display:none;z-index:30;gap:6px}
body:has(.bk-panel) #bk-tb,body:has(.bk-panel) #bk-bar{display:none!important}
#bk-tb button{font:600 15px/1 sans-serif;border:0;border-radius:12px;background:rgba(20,28,40,.72);color:#fff;min-width:48px;height:48px;padding:0 10px;cursor:pointer}
#bk-tb button.on{background:#e8590c}
#bk-pal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;grid-template-columns:repeat(4,58px);gap:8px;padding:12px;background:rgba(20,28,40,.88);border-radius:14px;z-index:62}
#bk-pal .s{width:58px;height:58px;border-radius:10px;border:3px solid rgba(255,255,255,.25);background-size:800% 200%;image-rendering:pixelated;padding:0}
#bk-pal .s.on{border-color:#ffd43b}
.bk-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,92vw);max-height:86vh;overflow:auto;background:#fffdf8;color:#1d2b3a;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35);padding:16px 18px;z-index:60;font:15px/1.5 sans-serif}
.bk-panel h3{margin:0 0 6px;font-size:19px}.bk-panel .sm{font-size:13px;color:#5b6675}
.bk-panel .bl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0}
.bk-panel button{font:inherit;border:0;border-radius:10px;padding:8px 10px;background:#e8eef6;color:#1d3557;cursor:pointer;text-align:left}
.bk-panel button.pri{background:#2f6fd6;color:#fff;text-align:center}.bk-panel button.cur{outline:3px solid #ffd43b}
.bk-panel .row{display:flex;gap:6px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}
.bk-panel input{font:inherit;border:2px solid #c9d3df;border-radius:10px;padding:5px 8px}
`;

// ── 블록 그림(아틀라스 8×2 칸 · 칸 64px — 둘레 4px는 가장자리 색을 늘려 밉맵 번짐 막기)
function makeAtlas() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const g = cv.getContext('2d');
  let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  TYPES.forEach((T, i) => {
    const x0 = (i % 8) * 64, y0 = Math.floor(i / 8) * 64, X = x0 + 4, Y = y0 + 4, W = 56;
    g.save(); g.beginPath(); g.rect(x0, y0, 64, 64); g.clip();
    if (T.glass) { g.clearRect(x0, y0, 64, 64); g.fillStyle = 'rgba(207,238,254,0.30)'; g.fillRect(x0, y0, 64, 64); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 6; g.strokeRect(X + 3, Y + 3, W - 6, W - 6);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X + 12, Y + 30); g.lineTo(X + 30, Y + 12); g.moveTo(X + 16, Y + 42); g.lineTo(X + 42, Y + 16); g.stroke(); g.restore(); return; }
    g.fillStyle = T.c; g.fillRect(x0, y0, 64, 64);
    if (T.tex === 'plank') { for (let r = 0; r < 4; r++) { g.fillStyle = shade(T.c, 0.94 + 0.08 * ((r * 37) % 3) / 2); g.fillRect(X, Y + r * 14, W, 14); g.fillStyle = shade(T.c, 0.68); g.fillRect(X, Y + r * 14 + 13, W, 2);
        const cut = X + ((r * 23) % 40) + 8; g.fillRect(cut, Y + r * 14, 2, 13); }
      for (let k = 0; k < 26; k++) { g.fillStyle = shade(T.c, 0.82); g.fillRect(X + rnd() * W, Y + rnd() * W, 6 + rnd() * 10, 1); } }
    else if (T.tex === 'brick') { g.fillStyle = '#d8cfc4'; g.fillRect(X, Y, W, W);
      for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const bx = X + c * 28 + (r % 2 ? 14 : 0), by = Y + r * 14; g.fillStyle = shade(T.c, 0.88 + rnd() * 0.24); g.fillRect(bx + 1, by + 1, 26, 12); } }
    else if (T.tex === 'stone') { for (let k = 0; k < 22; k++) { g.fillStyle = shade(T.c, 0.78 + rnd() * 0.4); const s = 6 + rnd() * 12; g.fillRect(X + rnd() * (W - s), Y + rnd() * (W - s), s, s); } }
    else if (T.tex === 'leaf') { for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { const v = rnd(); if (v < 0.45) continue; g.fillStyle = shade(T.c, v < 0.75 ? 0.78 : 1.22); g.fillRect(X + xx * 7, Y + yy * 7, 7, 7); } }
    else if (T.glow) { const gr = g.createRadialGradient(x0 + 32, y0 + 32, 4, x0 + 32, y0 + 32, 34); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, T.c); g.fillStyle = gr; g.fillRect(x0, y0, 64, 64); }
    else { for (let k = 0; k < 70; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.07)'; g.fillRect(X + rnd() * (W - 4), Y + rnd() * (W - 4), 4, 4); } }
    g.strokeStyle = T.glow ? 'rgba(160,120,20,0.35)' : 'rgba(0,0,0,0.22)'; g.lineWidth = 3; g.strokeRect(X + 1.5, Y + 1.5, W - 3, W - 3);   // 블록 테두리(한 칸씩 보이게)
    g.restore();
  });
  return cv;
}

export default async function start(map, params = {}) {
  const THREE = map.three, cam = map.camera;
  let dead = false, board = null, name = '', teacher = false, cur = 0, mode = 'put', es = null;
  try { name = localStorage.getItem('mp.name') || ''; teacher = sessionStorage.getItem('sm.t') === '1'; cur = +(map.store.get('cur', 0)) || 0; } catch (e) { /* */ }
  const css = document.createElement('style'); css.textContent = STYLE; document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'bk-ui'; document.body.appendChild(ui);
  const el = (tag, id, html, parent = ui) => { const d = document.createElement(tag); if (id) d.id = id; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (s, t = 2.2) => map.hud.toast(s, t);
  const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
  const keyStop = (n) => { for (const t of ['keydown', 'keyup']) n.addEventListener(t, (e) => e.stopPropagation()); };
  map.player.freeMouse(true);
  window.SM_ACT = '🧱 블록 놀이';

  // ── 그림·재질(게임이 멈추면 버림)
  const atlas = makeAtlas(), atlasURL = atlas.toDataURL();
  const tex = new THREE.CanvasTexture(atlas); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  const MAT = { s: new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }), g: new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false }), l: new THREE.MeshBasicMaterial({ map: tex, vertexColors: true }) };
  const root = new THREE.Group(); root.name = 'blocks'; map.add(root);
  const tileUV = (t) => { const c = t % 8, r = Math.floor(t / 8); return [(c * 64 + 4) / 512, (c * 64 + 60) / 512, 1 - (r * 64 + 60) / 128, 1 - (r * 64 + 4) / 128]; };

  // ── 블록 자료
  const B = new Map(), COLQ = new Map(), CHK = new Map(), MESH = new Map(), DIRTY = new Set(), COLP = new Map(); let hudDirty = false;
  const key = (ix, iz, q) => ix + '_' + iz + '_' + q;
  const ckOf = (ix, iz) => Math.floor(ix * S / CK) + ':' + Math.floor(iz * S / CK);
  const ckey = (ix, iz) => (ix + 20000) * 40000 + (iz + 20000);   // 기둥(x·z 칸) 숫자 이름
  const isGlass = (b) => !!(b && TYPES[b.t] && TYPES[b.t].glass);
  const at = (ix, iz, q) => B.get(key(ix, iz, q));
  function markDirty(b) { hudDirty = true; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) DIRTY.add(ckOf(b.ix + dx, b.iz + dz)); }
  function apply(k, v) {   // v = {t, b} | null — 받은 것·내가 한 것 모두 여기로(같으면 아무 일 없음)
    const old = B.get(k);
    if (!v) { if (!old) return false; B.delete(k); const cq = COLQ.get(ckey(old.ix, old.iz)); if (cq) cq.delete(old.q); const ch = CHK.get(old.ck); if (ch) ch.delete(k); markDirty(old); colUpdate(old.ix, old.iz); return true; }
    const p = k.split('_'), ix = +p[0], iz = +p[1], q = +p[2], t = Math.max(0, Math.min(TYPES.length - 1, v.t | 0)), by = String(v.b || '').slice(0, 8);
    if (!Number.isFinite(ix) || !Number.isFinite(iz) || !Number.isFinite(q)) return false;
    if (old && old.t === t && old.b === by) return false;
    const b = { ix, iz, q, t, b: by, ck: ckOf(ix, iz), in: old ? old.in : map.q.indoor((ix + 0.5) * S, q / 20, (iz + 0.5) * S) };
    B.set(k, b); let cq = COLQ.get(ckey(ix, iz)); if (!cq) COLQ.set(ckey(ix, iz), cq = new Set()); cq.add(q);
    let ch = CHK.get(b.ck); if (!ch) CHK.set(b.ck, ch = new Set()); ch.add(k); markDirty(b); if (!old) colUpdate(ix, iz); return true;
  }
  // 충돌: 기둥마다 이어진 블록 묶음(run) = 상자 하나 · 상자는 다시 쓴다(높이만 바꿈 — 월드 충돌 배열이 늘지 않게)
  function colUpdate(ix, iz) {
    const ck = ckey(ix, iz), qs = [...(COLQ.get(ck) || [])].sort((a, b) => a - b), runs = [];
    for (const q of qs) { const r = runs[runs.length - 1]; if (r && q === r[1]) r[1] = q + 10; else runs.push([q, q + 10]); }
    let P = COLP.get(ck); if (!P) { if (!runs.length) return; COLP.set(ck, P = []); }
    while (P.length < runs.length) P.push(map.collider.add({ x0: ix * S, x1: (ix + 1) * S, y0: -1e6, y1: -1e6, z0: iz * S, z1: (iz + 1) * S }));
    P.forEach((h, i) => { const r = runs[i]; h.box.y0 = r ? r[0] / 20 : -1e6; h.box.y1 = r ? r[1] / 20 : -1e6; });
  }
  // ── 칸 짓기(보이는 면만 · 칸 8m · 면마다 블록 그늘(AO) — 블록끼리 맞닿은 모서리를 살짝 어둡게)
  const AOF = [1, 0.84, 0.7, 0.58], SH = [0.9, 0.9, 1, 0.66, 0.84, 0.84];
  function build(ck) {
    const old = MESH.get(ck); if (old) for (const m of old) { root.remove(m); m.geometry.dispose(); } MESH.delete(ck);
    const ks = CHK.get(ck); if (!ks || !ks.size) return;
    const BK = new Map();   // 'kind|in' → {p,n,c,u,i}
    const get9 = (kind, inn) => { const k9 = kind + (inn ? 1 : 0); let L = BK.get(k9); if (!L) BK.set(k9, L = { kind, inn, p: [], n: [], c: [], u: [], i: [] }); return L; };
    const solidAt = (ix, iz, q) => { const n = at(ix, iz, q); return n && !isGlass(n); };
    for (const k of ks) { const b = B.get(k); if (!b) continue; const T = TYPES[b.t], gl = !!T.glass, [u0, u1, v0, v1] = tileUV(b.t), L = get9(gl ? 'g' : T.glow ? 'l' : 's', b.in);
      for (let d = 0; d < 6; d++) {
        const a = d >> 1, s = d & 1 ? -1 : 1, D = [0, 0, 0]; D[a] = s;
        const nb = at(b.ix + D[0], b.iz + D[2], b.q + D[1] * 10); if (nb && (!isGlass(nb) || gl)) continue;
        const ua = (a + 1) % 3, va = (a + 2) % 3, base = L.p.length / 3, cs = s > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]], ao = [];
        for (const [cu, cv] of cs) {
          const o = [0, 0, 0]; o[a] = s > 0 ? 1 : 0; o[ua] = cu; o[va] = cv;
          L.p.push((b.ix + o[0]) * S, b.q / 20 + o[1] * S, (b.iz + o[2]) * S); L.n.push(D[0], D[1], D[2]);
          // 그늘: 바깥 층(D)에서 이 꼭짓점 쪽 옆 둘·모서리
          const U = [0, 0, 0], V = [0, 0, 0]; U[ua] = cu ? 1 : -1; V[va] = cv ? 1 : -1;
          const s1 = solidAt(b.ix + D[0] + U[0], b.iz + D[2] + U[2], b.q + (D[1] + U[1]) * 10), s2 = solidAt(b.ix + D[0] + V[0], b.iz + D[2] + V[2], b.q + (D[1] + V[1]) * 10);
          const cc = solidAt(b.ix + D[0] + U[0] + V[0], b.iz + D[2] + U[2] + V[2], b.q + (D[1] + U[1] + V[1]) * 10), lv = s1 && s2 ? 3 : (s1 ? 1 : 0) + (s2 ? 1 : 0) + (cc ? 1 : 0);
          ao.push(lv); const f = (T.glow ? 1 : SH[d]) * AOF[lv]; L.c.push(f, f, f);
          // 무늬 방향: 옆면은 위가 +y(줄무늬·벽돌이 눕게)
          const hu = a === 2 ? cu : cv, hv = a === 2 ? cv : cu; L.u.push(hu ? u1 : u0, hv ? v1 : v0);
        }
        if (ao[0] + ao[2] > ao[1] + ao[3]) L.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base); else L.i.push(base, base + 1, base + 2, base, base + 2, base + 3);   // 그늘이 대각선으로 고르게
      }
    }
    const ms = [], cx = (+ck.split(':')[0] + 0.5) * CK, cz = (+ck.split(':')[1] + 0.5) * CK;
    for (const L of BK.values()) { if (!L.i.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(L.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(L.u, 2)); g.setIndex(L.i); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, MAT[L.kind]); m.receiveShadow = L.kind !== 'l' && !L.inn; m.castShadow = false; m.matrixAutoUpdate = false; m.userData.c = [cx, cz]; if (L.kind === 'g') m.renderOrder = 3;
      root.add(m); ms.push(m); }
    MESH.set(ck, ms);
  }
  function flushBuild(max = 6) { let n = 0; for (const ck of DIRTY) { DIRTY.delete(ck); build(ck); if (++n >= max) break; } }

  // ── 겨누기: 화면 점 → 맞은 것(블록 · 가구 · 벽 · 땅) + 놓을 칸
  const RC = new THREE.Raycaster(), V2 = new THREE.Vector2(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  function slab(o, d, x0, y0, z0, x1, y1, z1) { let t0 = 0, t1 = 1e9, ax9 = -1; const lo = [x0, y0, z0], hi = [x1, y1, z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
    for (let ax = 0; ax < 3; ax++) { if (Math.abs(dd[ax]) < 1e-9) { if (oo[ax] < lo[ax] || oo[ax] > hi[ax]) return null; continue; } let p = (lo[ax] - oo[ax]) / dd[ax], r = (hi[ax] - oo[ax]) / dd[ax]; if (p > r) { const s9 = p; p = r; r = s9; } if (p > t0) { t0 = p; ax9 = ax; } if (r < t1) t1 = r; if (t0 > t1) return null; }
    if (ax9 < 0) return null; const n = [0, 0, 0]; n[ax9] = -Math.sign(dd[ax9]); return { t: t0, n }; }
  function aimAt(sx, sy) {
    V2.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); RC.setFromCamera(V2, cam); O.copy(RC.ray.origin); Dv.copy(RC.ray.direction);
    const me = map.player.pos(), mx = me.x, my = me.y + 1, mz = me.z, maxT = Math.hypot(O.x - mx, O.y - my, O.z - mz) + REACH;
    let best = null;
    // 1) 블록(4cm 걸음으로 칸을 훑고 맞은 블록은 정확히)
    for (let t = 0; t < maxT; t += 0.04) { const x = O.x + Dv.x * t, y = O.y + Dv.y * t, z = O.z + Dv.z * t, ix = Math.floor(x / S), iz = Math.floor(z / S), cq = COLQ.get(ckey(ix, iz)); if (!cq) continue;
      let hitQ = null; for (const q of cq) if (y >= q / 20 && y < q / 20 + S) { hitQ = q; break; } if (hitQ == null) continue;
      const h = slab(O, Dv, ix * S, hitQ / 20, iz * S, (ix + 1) * S, hitQ / 20 + S, (iz + 1) * S); if (h) best = { kind: 'block', t: h.t, n: h.n, ix, iz, q: hitQ }; break; }
    // 2) 학교 충돌 상자(가구는 보이는 윗면까지 · 블록 상자는 빼고)
    const tEnd = best ? best.t : maxT, w = map.q.rayHit([O.x, O.y, O.z], [O.x + Dv.x * tEnd, O.y + Dv.y * tEnd, O.z + Dv.z * tEnd], { skipDyn: true });
    if (w) { const fid = w.ns && map.world.furn ? map.world.furn.idOf(w.box) : null; best = { kind: fid ? 'furn' : 'wall', t: w.t * tEnd, n: w.n, furn: fid, box: w.box }; }
    // 3) 땅·1층 바닥(충돌 상자가 아닌 높이)
    const tEnd2 = best ? best.t : maxT;
    for (let t = 0.2; t < tEnd2; t += 0.1) { const y = O.y + Dv.y * t, gb = map.q.baseAt(O.x + Dv.x * t, O.z + Dv.z * t); if (y > gb) continue;
      let a = t - 0.1, c = t; for (let k = 0; k < 6; k++) { const m = (a + c) / 2; if (O.y + Dv.y * m > map.q.baseAt(O.x + Dv.x * m, O.z + Dv.z * m)) a = m; else c = m; }
      best = { kind: 'ground', t: c, n: [0, 1, 0] }; break; }
    if (!best) return null;
    const p = [O.x + Dv.x * best.t, O.y + Dv.y * best.t, O.z + Dv.z * best.t]; best.p = p;
    best.far = Math.hypot(p[0] - mx, p[1] - my, p[2] - mz) > REACH;
    // 놓을 칸
    if (best.kind === 'block') best.put = { ix: best.ix + best.n[0], iz: best.iz + best.n[2], q: best.q + best.n[1] * 10 };
    else { const n = best.n, ix = Math.floor((p[0] + n[0] * 0.25) / S), iz = Math.floor((p[2] + n[2] * 0.25) / S); let y;
      if (n[1] > 0) y = best.kind === 'ground' ? map.q.baseAt(p[0], p[2]) : p[1];
      else if (n[1] < 0) y = p[1] - S;
      else { const cx = (ix + 0.5) * S, cz = (iz + 0.5) * S, base = p[1] > 3.2 ? map.q.floorY(cx, cz, 2) : map.q.baseAt(cx, cz); y = base + S * Math.max(0, Math.floor((p[1] - base) / S)); }
      best.put = { ix, iz, q: Math.round(y * 20) }; }
    return best;
  }
  function canPut(ix, iz, q) {
    if (board && board.lock && !teacher) return 'lock';
    if (B.size >= MAXB) return 'full';
    const cx = (ix + 0.5) * S, cz = (iz + 0.5) * S, y = q / 20;
    if (!map.q.inSchool(cx, cz)) return 'out';
    if (y > 28) return 'high';
    if (y < map.q.baseAt(cx, cz) - 0.04) return 'ground';
    const cq = COLQ.get(ckey(ix, iz)); if (cq) for (const q2 of cq) if (Math.abs(q2 - q) < 10) return 'have';
    if (map.q.overlap({ x0: ix * S + 0.02, x1: (ix + 1) * S - 0.02, y0: y + 0.02, y1: y + S - 0.02, z0: iz * S + 0.02, z1: (iz + 1) * S - 0.02 }, { skipDyn: true })) return 'wall';
    const me = map.player.pos(); if (ix * S < me.x + 0.27 && (ix + 1) * S > me.x - 0.27 && iz * S < me.z + 0.27 && (iz + 1) * S > me.z - 0.27 && y < me.y + 1.5 && y + S > me.y + 0.05) return 'me';
    return null;
  }
  const canBreak = (b) => !board || board.local || teacher || board.open || (b.b && b.b === (name || '익명'));

  // ── 손대기(놓기·부수기·되돌리기)
  const UNDO = [];
  const pushUndo = (u) => { UNDO.push(u); if (UNDO.length > 60) UNDO.shift(); };
  function doPut(A) {
    if (!A || !A.put) return; if (A.far) return toast(WHY.far);
    const { ix, iz, q } = A.put, why = canPut(ix, iz, q); if (why) return toast(WHY[why], 2.4);
    const k = key(ix, iz, q), v = { t: cur, b: name || '익명' }; apply(k, v); send(k, v); pushUndo({ k, put: true }); flushBuild(9);
    map.tone(330 + cur * 18, 0, 0.06, 'triangle', 0.14, 240); ghostOff();
  }
  function doBreak(A) {
    if (!A) return; if (A.far) return toast(WHY.far);
    if (board && board.lock && !teacher) return toast(WHY.lock, 2.4);
    if (A.kind === 'block') { const k = key(A.ix, A.iz, A.q), b = B.get(k); if (!b) return;
      if (!canBreak(b)) return toast('친구(' + b.b + ')가 놓은 블록이에요 — 선생님이 「모두 고치기」를 켜면 부술 수 있어요', 3);
      apply(k, null); send(k, null); pushUndo({ k, del: { t: b.t, b: b.b } }); flushBuild(9);
      burst((A.ix + 0.5) * S, A.q / 20 + 0.25, (A.iz + 0.5) * S, TYPES[b.t].c, 10, 0.5); map.tone(200, 0, 0.1, 'square', 0.1, 90); ghostOff(); return; }
    if (A.kind === 'furn' && A.furn) { const r = map.world.furn.hide(A.furn);
      if (!r.ok) return toast('이건 부술 수 없어요', 2);
      if (!r.already) { sendF(A.furn, { b: name || '익명', t: Date.now() }); pushUndo({ furn: A.furn }); const bx = r.box;
        burst((bx.x0 + bx.x1) / 2, (bx.y0 + bx.top) / 2, (bx.z0 + bx.z1) / 2, r.color, 22, Math.max(0.6, Math.min(2.2, Math.max(bx.x1 - bx.x0, bx.z1 - bx.z0) / 2)));
        map.tone(150, 0, 0.22, 'sawtooth', 0.12, 55); map.tone(420, 0.05, 0.12, 'triangle', 0.08, 200); }
      ghostOff(); return; }
    toast('벽·땅은 아직 못 부숴요 — 블록과 가구(책상·책장·사물함…)를 부술 수 있어요', 2.6);
  }
  function undo() {
    const u = UNDO.pop(); if (!u) return toast('되돌릴 것이 없어요', 1.4);
    if (u.put) { const b = B.get(u.k); if (b) { apply(u.k, null); send(u.k, null); } }
    else if (u.del) { if (!B.has(u.k)) { const p = u.k.split('_'), why = canPut(+p[0], +p[1], +p[2]); if (why) { toast(WHY[why], 2); UNDO.push(u); return; } apply(u.k, u.del); send(u.k, u.del); } }
    else if (u.furn) { map.world.furn.show(u.furn); sendF(u.furn, null); }
    flushBuild(9); map.tone(520, 0, 0.05, 'sine', 0.1, 700);
  }

  // ── 부서지는 조각(작은 정육면체 48개 한 메시 · 쉬는 동안 일 0)
  const PN = 48, pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), new THREE.MeshLambertMaterial(), PN), PS = [];
  pMesh.count = 0; pMesh.frustumCulled = false; root.add(pMesh);
  const _m = new THREE.Matrix4(), _c = new THREE.Color(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  function burst(x, y, z, col, n, r) { if (Array.isArray(col)) _c.setRGB(col[0], col[1], col[2]); else _c.set(col);
    for (let i = 0; i < n; i++) { if (PS.length >= PN) PS.shift(); const a = Math.random() * 6.283, sp = 1.4 + Math.random() * 2.2;
      PS.push({ x: x + (Math.random() - 0.5) * r, y: y + (Math.random() - 0.3) * r * 0.6, z: z + (Math.random() - 0.5) * r, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 2.8, vz: Math.sin(a) * sp, t: 0, life: 0.55 + Math.random() * 0.35, rx: Math.random() * 6, c: _c.clone().multiplyScalar(0.8 + Math.random() * 0.35) }); } }
  function pTick(dt) { if (!PS.length) { if (pMesh.count) pMesh.count = 0; return; }
    for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.t += dt; if (p.t >= p.life) { PS.splice(i, 1); continue; } p.vy -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += dt * 8; }
    pMesh.count = PS.length; PS.forEach((p, i) => { const k = 1 - p.t / p.life; _s.setScalar(Math.max(0.05, k)); _q.setFromEuler(_e.set(p.rx, p.rx * 0.7, 0)); _m.compose(_p.set(p.x, p.y, p.z), _q, _s); pMesh.setMatrixAt(i, _m); pMesh.setColorAt(i, p.c); });
    pMesh.instanceMatrix.needsUpdate = true; if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true; }

  // ── 미리 보기 테(놓을 칸 = 흰 테 · 부술 것 = 빨간 테)
  const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
  ghost.visible = false; ghost.renderOrder = 5; root.add(ghost);
  function ghostOff() { ghost.visible = false; }
  function ghostShow(A) {
    if (!A || A.far) return ghostOff();
    if (mode === 'put') { if (!A.put) return ghostOff(); const { ix, iz, q } = A.put, bad = canPut(ix, iz, q);
      ghost.material.color.setHex(bad ? 0xff6b6b : 0xffffff); ghost.scale.set(S + 0.02, S + 0.02, S + 0.02); ghost.position.set((ix + 0.5) * S, q / 20 + S / 2, (iz + 0.5) * S); ghost.visible = true; return; }
    if (A.kind === 'block') { ghost.material.color.setHex(0xff4d4d); ghost.scale.set(S + 0.04, S + 0.04, S + 0.04); ghost.position.set((A.ix + 0.5) * S, A.q / 20 + S / 2, (A.iz + 0.5) * S); ghost.visible = true; return; }
    if (A.kind === 'furn') { const bx = map.world.furn.box(A.furn); if (!bx) return ghostOff(); ghost.material.color.setHex(0xff4d4d);
      ghost.scale.set(bx.x1 - bx.x0 + 0.08, bx.top - bx.y0 + 0.08, bx.z1 - bx.z0 + 0.08); ghost.position.set((bx.x0 + bx.x1) / 2, (bx.y0 + bx.top) / 2, (bx.z0 + bx.z1) / 2); ghost.visible = true; return; }
    ghostOff();
  }

  // ── 같은 판 친구와(Firebase) · 나만의 판(이 기기)
  const pend = new Map(), pendF = new Map(), MINE = new Map(), MINEF = new Map(); let flushT = 0, localT = 0;   // MINE = 내가 막 바꾼 것(서버가 같은 값을 돌려줄 때까지 · 8초)
  const fresh = (M, k) => { const e = M.get(k); if (!e) return false; if (performance.now() - e > 8000) { M.delete(k); return false; } return true; };
  function send(k, v) { if (!board) return; if (board.local) return saveLocal(); pend.set(k, v); MINE.set(k, performance.now()); if (!flushT) flushT = setTimeout(flush, 140); }
  function sendF(id, v) { if (!board) return; if (board.local) return saveLocal(); pendF.set(id, v); MINEF.set(id, performance.now()); if (!flushT) flushT = setTimeout(flush, 140); }
  async function flush() {
    flushT = 0; if (!board || board.local || (!pend.size && !pendF.size)) return;
    const o = {}; for (const [k, v] of pend) o['b/' + k] = v; for (const [k, v] of pendF) o['f/' + k] = v; pend.clear(); pendF.clear();
    try { await req('/blocks/' + board.id, 'PATCH', o); } catch (e) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
  }
  function saveLocal() { clearTimeout(localT); localT = setTimeout(() => { const o = {}; for (const [k, b] of B) o[k] = [b.t]; map.store.set('mine', { b: o, f: map.world.furn.hidden() }); }, 300); }
  function clearAll() { for (const k of [...B.keys()]) apply(k, null); for (const id of map.world.furn.hidden()) map.world.furn.show(id); UNDO.length = 0; flushBuild(999); }
  function norm(v) { return v && typeof v === 'object' ? { t: v.t | 0, b: v.b || '' } : Array.isArray(v) ? { t: v[0] | 0, b: '' } : null; }
  function onBlocks(path, data, patch) {
    const one = (k, v) => { const b = B.get(k), same = v ? !!b && b.t === v.t && b.b === v.b : !b; if (same) { MINE.delete(k); return; } if (fresh(MINE, k)) return; apply(k, v); };   // 내가 막 바꾼 칸은 서버가 같은 값을 줄 때까지 내 것 그대로
    if (path === '/') { if (!patch) { const want = data || {}; for (const k of [...B.keys()]) if (!(k in want)) one(k, null); for (const k in want) one(k, norm(want[k])); }
      else for (const k in (data || {})) one(k, data[k] ? norm(data[k]) : null); }
    else { const seg = path.split('/').filter(Boolean); if (seg.length === 1) one(seg[0], data ? norm(data) : null); }
    hudLine();
  }
  function onFurn(path, data, patch) {
    const F = map.world.furn, setH = (id, on) => { if (!!F.isHidden(id) === on) { MINEF.delete(id); return; } if (fresh(MINEF, id)) return; if (on) F.hide(id); else F.show(id); };
    if (path === '/') { if (!patch) { const want = data || {}; for (const id of F.hidden()) if (!(id in want)) F.show(id); for (const id in want) setH(id, true); }
      else for (const id in (data || {})) setH(id, !!data[id]); }
    else { const seg = path.split('/').filter(Boolean); if (seg.length === 1) setH(seg[0], !!data); }
  }
  function stream(path, fn) { const s = new EventSource(DB + path + '.json'); const h = (ev) => { try { const m = JSON.parse(ev.data); fn(m.path, m.data, ev.type === 'patch'); } catch (e) { /* */ } };
    s.addEventListener('put', h); s.addEventListener('patch', h); return s; }
  // blocks/<판> 한 줄기: '/'(전체 {b, f}) · '/b'·'/f'(통째) · '/b/<k>'·'/f/<id>'(하나) · patch = 열쇠가 'b/<k>'처럼 경로일 수 있음
  function onBoard(path, data, patch) {
    const seg = path.split('/').filter(Boolean);
    if (patch) { for (const k in (data || {})) { const s2 = seg.concat(k.split('/').filter(Boolean)), v = data[k];
        if (s2.length === 1 && (s2[0] === 'b' || s2[0] === 'f')) (s2[0] === 'b' ? onBlocks : onFurn)('/', v, true);
        else if (s2.length === 2) (s2[0] === 'b' ? onBlocks : onFurn)('/' + s2[1], v, false); }
      return; }
    if (!seg.length) { onBlocks('/', data && data.b, false); onFurn('/', data && data.f, false); return; }
    const fn = seg[0] === 'b' ? onBlocks : seg[0] === 'f' ? onFurn : null; if (!fn) return;
    fn(seg.length === 1 ? '/' : '/' + seg[1], data, false);
  }
  let cfgT = 0;
  async function cfgPoll() { clearTimeout(cfgT); if (dead || !board || board.local) return; try { const c = await req('/blockList/' + board.id); if (c && board && !board.local) { const ch = !!c.lock !== !!board.lock || !!c.open !== !!board.open; board.lock = !!c.lock; board.open = !!c.open; if (ch) chips(); } } catch (e) { /* */ } cfgT = setTimeout(cfgPoll, 15000); }
  function enter(b) {
    if (es) { es.close(); es = null; } clearTimeout(cfgT);
    closePanel(); clearAll(); board = b; map.store.set('last', b.id);
    if (b.local) { const m = map.store.get('mine', null); if (m && m.b) for (const k in m.b) apply(k, norm(m.b[k])); if (m && m.f) for (const id of m.f) map.world.furn.hide(id); flushBuild(999); }
    else { es = stream('/blocks/' + b.id, onBoard); cfgT = setTimeout(cfgPoll, 15000); }
    chips(); hudLine(); tip();
  }

  // ── 판 고르기 · 선생님
  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; };
  const hash = async (pin) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mv-memo:' + pin)))].map((x) => x.toString(16).padStart(2, '0')).join('');
  async function teacherLogin() {
    let saved = null; try { saved = await req('/memoPin'); } catch (e) { return toast('인터넷을 확인해 주세요', 2); }
    if (!saved) return toast('먼저 메타버스 메모장에서 선생님 비밀번호를 정해 주세요', 3);
    const a = prompt('선생님 비밀번호 4자리'); if (!a) return; if (await hash(a) !== saved) return toast('비밀번호가 달라요', 2);
    teacher = true; try { sessionStorage.setItem('sm.t', '1'); } catch (e) { /* */ } toast('🔓 선생님 모드', 2); chips(); if (panel) pick();
  }
  async function pick() {
    closePanel(); panel = el('div', 'bk-pick'); panel.className = 'bk-panel'; keyStop(panel);
    panel.innerHTML = '<h3>🧱 블록 놀이' + (teacher ? ' <span class="sm">· 🔓 선생님</span>' : '') + '</h3><div class="sm">우리 학교 곳곳에 블록을 놓고 부숴요. 책상·책장 같은 가구도 🔨로 통째로 부서져요. 같은 판에 들어온 친구들 블록이 바로 보여요.</div>'
      + '<div style="margin:8px 0">내 이름 <input id="bkName" maxlength="8" style="width:140px;margin-left:6px" placeholder="이름"></div><div class="sm">선생님이 알려 준 판에 들어가요.</div><div class="bl">불러오는 중…</div>'
      + '<div class="row">' + (teacher ? '' : '<button id="bkT">🔒 선생님</button>') + '<button id="bkQuit">그만하기</button></div>';
    const nm = panel.querySelector('#bkName'); nm.value = name;
    panel.querySelector('#bkQuit').onclick = () => map.quit && map.quit();
    if (!teacher) panel.querySelector('#bkT').onclick = teacherLogin;
    const P = panel; let list = {};
    try { list = (await req('/blockList')) || {}; } catch (e) { list = {}; P.querySelector('.bl').textContent = '판 목록을 불러오지 못했어요 — 🏠 나만의 판은 쓸 수 있어요'; }
    if (dead || panel !== P) return;
    const ids = Object.keys(list).sort((a, b) => (list[a].n ?? 99) - (list[b].n ?? 99) || a.localeCompare(b)), last = map.store.get('last', null);
    const btn = (id, label, sub) => '<button data-id="' + esc(id) + '"' + (board && board.id === id || (!board && last === id) ? ' class="cur"' : '') + '>' + label + (sub ? '<div class="sm">' + sub + '</div>' : '') + '</button>';
    P.querySelector('.bl').innerHTML = ids.map((id) => btn(id, esc(list[id].t || id), list[id].lock ? '🔒 보기만' : list[id].open ? '🤝 모두 함께 고치기' : '')).join('') + btn('@mine', '🏠 나만의 판', '이 기기에만 저장');
    P.querySelectorAll('.bl button').forEach((x) => x.onclick = () => {
      const nv = nm.value.trim().replace(/[.#$[\]/]/g, '').slice(0, 8), id = x.dataset.id;
      if (id !== '@mine' && !nv) { nm.focus(); return toast('이름을 먼저 적어요', 2); }
      if (nv) { name = nv; try { localStorage.setItem('mp.name', nv); } catch (e) { /* */ } dispatchEvent(new CustomEvent('sm-name', { detail: nv })); }
      closePanel(); enter(id === '@mine' ? { id: '@mine', local: true, t: '🏠 나만의 판' } : { id, t: list[id].t || id, lock: !!list[id].lock, open: !!list[id].open });
    });
  }
  async function admin() {
    if (!board || board.local) return; closePanel(); panel = el('div', 'bk-admin'); panel.className = 'bk-panel'; keyStop(panel);
    const no = (board.t.match(/\d+/) || [''])[0];
    panel.innerHTML = '<h3>🧑‍🏫 ' + esc(board.t) + ' 관리</h3><div class="sm">블록 ' + B.size + '개 · 부순 가구 ' + map.world.furn.hidden().length + '개</div><div class="bl">'
      + '<button data-a="lock">' + (board.lock ? '🔓 잠금 풀기' : '🔒 잠그기(보기만)') + '</button><button data-a="open">' + (board.open ? '🙅 내 블록만 고치기로' : '🤝 모두 함께 고치기') + '</button>'
      + '<button data-a="furn">🏫 가구 모두 되살리기</button><button data-a="wipe">🧹 이 판 비우기</button></div><div class="row"><button class="pri" data-a="x">닫기</button></div>';
    panel.querySelectorAll('button').forEach((x) => x.onclick = async () => {
      const a = x.dataset.a; try {
        if (a === 'x') return closePanel();
        if (a === 'lock') { await req('/blockList/' + board.id + '/lock', 'PUT', !board.lock); board.lock = !board.lock; toast(board.lock ? '🔒 잠갔어요 — 아이들은 보기만 해요' : '🔓 잠금을 풀었어요'); }
        if (a === 'open') { await req('/blockList/' + board.id + '/open', 'PUT', !board.open); board.open = !board.open; toast(board.open ? '🤝 이제 친구 블록도 부술 수 있어요' : '🙅 이제 내 블록만 부술 수 있어요'); }
        if (a === 'furn') { if (!confirm('부순 가구를 모두 되살릴까요?')) return; await req('/blocks/' + board.id + '/f', 'DELETE'); toast('🏫 가구를 모두 되살렸어요'); }
        if (a === 'wipe') { const ans = prompt('「' + board.t + '」의 블록 ' + B.size + '개를 모두 지워요. 지우려면 판 번호' + (no ? '(' + no + ')' : '') + '를 적어 주세요'); if (ans == null) return;
          if (ans.trim() !== (no || board.t)) return toast('번호가 달라요 — 지우지 않았어요', 2.5);
          const o = {}; for (const [k, b] of B) o[k] = { t: b.t, b: b.b }; await req('/trash/bk_' + board.id, 'PUT', { t: Date.now(), d: JSON.stringify(o).slice(0, 400000) });
          await req('/blocks/' + board.id + '/b', 'DELETE'); toast('🧹 비웠어요(지운 것은 휴지통에 한 번 남아요)', 3); }
      } catch (e) { toast('하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
      chips(); if (panel && panel.id === 'bk-admin') admin();
    });
  }

  // ── 화면(칩 · 블록 줄 · 안내)
  const bar = el('div', 'bk-bar'), tipEl = el('div', 'bk-tip'), tb = el('div', 'bk-tb'), pal = el('div', 'bk-pal');
  keyStop(bar);
  const sw = (i) => { const c = i % 8, r = Math.floor(i / 8); return 'background-image:url(' + atlasURL + ');background-position:' + (c / 7 * 100) + '% ' + (r * 100) + '%'; };
  bar.innerHTML = TYPES.map((T, i) => '<button class="s" data-i="' + i + '" title="' + esc(T.n) + '" style="' + sw(i) + '"><i>' + (i < 9 ? i + 1 : i === 9 ? 0 : '') + '</i></button>').join('');
  pal.innerHTML = TYPES.map((T, i) => '<button class="s" data-i="' + i + '" title="' + esc(T.n) + '" style="' + sw(i) + '"></button>').join('');
  tb.innerHTML = '<button id="bkMode">🧱</button><button id="bkCur" style="' + sw(cur) + ';background-size:800% 200%;width:48px"></button><button id="bkUndo">↩</button>';
  const setCur = (i) => { cur = (i + TYPES.length) % TYPES.length; map.store.set('cur', cur); bar.querySelectorAll('.s').forEach((x) => x.classList.toggle('on', +x.dataset.i === cur)); pal.querySelectorAll('.s').forEach((x) => x.classList.toggle('on', +x.dataset.i === cur));
    const cb = tb.querySelector('#bkCur'); cb.style.backgroundPosition = ((cur % 8) / 7 * 100) + '% ' + (Math.floor(cur / 8) * 100) + '%'; if (mode !== 'put') setMode('put'); tip(); };
  bar.onclick = (e) => { const s = e.target.closest('.s'); if (s) setCur(+s.dataset.i); };
  pal.onclick = (e) => { const s = e.target.closest('.s'); if (s) setCur(+s.dataset.i); pal.style.display = 'none'; };
  tb.querySelector('#bkMode').onclick = () => setMode(mode === 'put' ? 'break' : 'put');
  tb.querySelector('#bkCur').onclick = () => { pal.style.display = pal.style.display === 'grid' ? 'none' : 'grid'; };
  tb.querySelector('#bkUndo').onclick = () => undo();
  const touchy = () => document.body.classList.contains('touch');
  function layout() { const t = touchy(); bar.style.display = t ? 'none' : 'flex'; tb.style.display = t ? 'flex' : 'none'; tipEl.style.display = t ? 'none' : ''; }
  function setMode(m) { mode = m; tb.querySelector('#bkMode').textContent = m === 'put' ? '🧱' : '🔨'; tb.querySelector('#bkMode').classList.toggle('on', m === 'break'); chips(); tip(); ghostOff(); }
  function tip() { tipEl.textContent = !board ? '' : mode === 'put' ? '🧱 ' + TYPES[cur].n + ' 놓기 — 화면 누르기 · 오른쪽 누르기 = 부수기 · 1~0·휠 = 블록 · Q = 놓기/부수기 · Z = 되돌리기' : '🔨 부수기 — 블록·가구를 누르기 · Q = 놓기로 · Z = 되돌리기'; }
  function hudLine() { if (!board) return; map.hud.chip('bk-b', '🧱 ' + board.t + ' · ' + B.size + '개' + (board.lock ? ' · 🔒' : ''), { onClick: () => pick() }); }
  function chips() {
    if (!board) return; hudLine();
    map.hud.chip('bk-m', mode === 'put' ? '🧱 놓기 (Q)' : '🔨 부수기 (Q)', { onClick: () => setMode(mode === 'put' ? 'break' : 'put') });
    map.hud.chip('bk-u', '↩ 되돌리기 (Z)', { onClick: () => undo() });
    map.hud.chip('bk-x', '🚪 빠져나오기', { onClick: () => unstuck() });
    map.hud.chip('bk-t', teacher && !board.local ? '🧑‍🏫 판 관리' : null, { onClick: () => admin() });
    layout();
  }
  function unstuck() { const me = map.player.get();   // 블록에 갇혔을 때 — 가까운 빈 땅으로
    for (let r = 1; r <= 14; r++) for (let a = 0; a < 16; a++) { const x = me.x + Math.cos(a / 16 * 6.283) * r, z = me.z + Math.sin(a / 16 * 6.283) * r, y = map.q.baseAt(x, z);
      if (!map.q.inSchool(x, z) || map.q.overlap({ x0: x - 0.3, x1: x + 0.3, y0: y + 0.05, y1: y + 1.6, z0: z - 0.3, z1: z + 0.3 })) continue; map.player.teleport({ x, z }); return toast('🚪 빠져나왔어요', 1.6); }
    toast('빈 자리를 못 찾았어요 — 선생님께 말해요', 2.5); }
  setCur(cur); layout();

  // ── 입력
  let hoverT = 0, mx = -1, my = -1, shift = false;
  const onCanvas = (e) => e.target && e.target.tagName === 'CANVAS';
  function onClick(e) { if (!board || panel || dead) return; const d = e.detail || {}; pal.style.display = 'none'; const A = aimAt(d.x, d.y); if (mode === 'break' || shift) doBreak(A); else doPut(A); }
  function onCtx(e) { if (!board || panel || dead || !onCanvas(e)) return; e.preventDefault(); doBreak(aimAt(e.clientX, e.clientY)); }
  function onMove(e) { if (!onCanvas(e)) { if (ghost.visible) ghostOff(); mx = -1; return; } mx = e.clientX; my = e.clientY; }
  function onWheel(e) { if (!board || panel || !onCanvas(e)) return; setCur(cur + (e.deltaY > 0 ? 1 : -1)); }
  function onKey(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { shift = e.type === 'keydown'; return; }
    if (e.type !== 'keydown' || !board || panel || e.repeat) return; const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyQ') setMode(mode === 'put' ? 'break' : 'put');
    else if (e.code === 'KeyZ') undo();
    else { const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code); if (m) { const n = +m[1]; setCur(n === 0 ? 9 : n - 1); } }
  }
  addEventListener('sm-click', onClick); addEventListener('contextmenu', onCtx); addEventListener('mousemove', onMove); addEventListener('wheel', onWheel, { passive: true });
  addEventListener('keydown', onKey); addEventListener('keyup', onKey); addEventListener('resize', layout);

  // ── 시작: 지난번 판 → 없으면 고르기
  pick();

  let cullT = 0;
  return {
    tick(dt) {
      if (dead) return;
      if (DIRTY.size) flushBuild(4);
      pTick(dt);
      if ((hoverT += dt) >= 0.05) { hoverT = 0; if (mx >= 0 && board && !panel && !touchy()) ghostShow(aimAt(mx, my)); else if (ghost.visible && (touchy() || panel)) ghostOff(); }
      if ((cullT += dt) >= 0.25) { cullT = 0; if (hudDirty) { hudDirty = false; hudLine(); } const cp = cam.position; for (const ms of MESH.values()) for (const m of ms) { const c = m.userData.c, dx = cp.x - c[0], dz = cp.z - c[1]; m.visible = dx * dx + dz * dz < FAR * FAR; } }
    },
    stop() {
      dead = true; window.SM_ACT = null; clearTimeout(localT); if (flushT) { clearTimeout(flushT); flush(); }
      if (es) es.close(); clearTimeout(cfgT);
      removeEventListener('sm-click', onClick); removeEventListener('contextmenu', onCtx); removeEventListener('mousemove', onMove); removeEventListener('wheel', onWheel);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('resize', layout);
      for (const ms of MESH.values()) for (const m of ms) m.geometry.dispose(); MESH.clear();
      pMesh.geometry.dispose(); pMesh.material.dispose(); pMesh.dispose(); ghost.geometry.dispose(); ghost.material.dispose();
      for (const k in MAT) MAT[k].dispose(); tex.dispose(); ui.remove(); css.remove(); closePanel();
    },
    // 시험·디버그(읽기 위주)
    board: () => board && { ...board }, count: () => B.size, blocks: () => [...B.keys()], aim: aimAt, put: (ix, iz, q, t = cur) => { const why = canPut(ix, iz, q); if (why) return why; const k = key(ix, iz, q), v = { t, b: name || '익명' }; apply(k, v); send(k, v); pushUndo({ k, put: true }); flushBuild(99); return 'ok'; },
    brk: (A) => doBreak(A), place: (A) => doPut(A), undo, mode: (m) => { if (m) setMode(m); return mode; }, cur: (i) => { if (i != null) setCur(i); return cur; },
    enter: (id) => enter(id === '@mine' ? { id: '@mine', local: true, t: '🏠 나만의 판' } : { id, t: id }), pick, stats: () => ({ blocks: B.size, chunks: MESH.size, meshes: [...MESH.values()].reduce((s, a) => s + a.length, 0), tris: [...MESH.values()].reduce((s, a) => s + a.reduce((x, m) => x + m.geometry.index.count / 3, 0), 0), cols: [...COLP.values()].reduce((s, a) => s + a.length, 0), furn: map.world.furn.hidden().length }),
  };
}
