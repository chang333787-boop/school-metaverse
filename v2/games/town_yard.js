// 🏡 아이 집 마당 = 우리반RPG 꾸미기 마당 그대로(YARD-1·2 · 교사 10-15 "꾸미기가 잘 되도록도 해야 돼" · "1칸 = 1.4m, RPG 비율")
//   꾸미기 마당 80×44칸 → 1칸 = 1.4m(CS) · RPG 집 자리(열 44~49 · 행 0~2) = 마을 집(폭 8.4m · 앞문 = 행 3 경계 · 남쪽 마당) — town.js가 자리를 정함
//   그리는 범위 = 아이가 쓴 범위(장식 ∪ 바닥 ∪ 집 자리) + 2칸(extentOf) · 장식 크기는 종류마다(SCALE: 전부 ×1.4 / 바닥만 ×1.4 / 그대로)
//   자료 = 같은 RTDB의 classRPG_v3(공개 읽기 · 읽기만 · 쓰기 0 · 새 EventSource 없음): students 목록 → 이름 끝이 집 주인 이름인 학생 → houseDecorations(area 'yard' · 공간 1) · yardFloor
//   이름·학생 열쇠는 이 모듈 안에서만 씀(저장·기록·로그 없음) · 마을 짓기 전에 1번(prefetch — 범위를 알아야 터를 고름) + 그 마당에 들어갈 때 60초 지났으면 다시 · 실패하면 기본 정원(✨)
//   그리기: 마당마다 바닥 1메시 + 장식(정적) 1메시 + 빛 부품 1메시 + 움직이는 것(동물·풍차 날개)만 따로 · 260m 밖이면 숨김
import { DECO3D, FALLBACK, floorOf, FLOWER_COL } from './town_deco.js?v=2';

const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/classRPG_v3';
const YW = 80, YD = 44, HOUSE = [44, 0, 50, 3], CS = 1.4, NORTH = 4.0;   // 마당 칸 수 · RPG 집 자리(열 44~49 · 행 0~2) · 1칸 = 1.4m · 집이 마당 위 경계 밖으로 나가는 깊이
// 장식 크기(또래 SPEC §9): A = 전부 ×1.4 · F = 바닥만 ×1.4(높이 그대로) · 나머지 = 그대로(칸 가운데)
const SCALE = {}; for (const k of 'd_y9 d_y12 d_y19 d_y46 d_y47 d_y48 d_y64 d_y26 d_y38 d_y10 d_y20 d_y11 d_y17 d_y21 d_y27 d_y28 d_y66 d_y33 d_y34 d_y67'.split(' ')) SCALE[k] = 'A';
for (const k of 'd_y1 d_y2 d_y7 d_y15 d_y16 d_y29 d_y41 d_y42 d_y43 d_y44 d_y45 d_y25 d_y35 d_y36 d_y31 d_y59 d_y30 d_y61 d_y65 d_y58 d_y60 d_y62 d_y63 d_y68 d_y49 d_y50 d_y51 d_y52 d_y70 d_y71 d_y72'.split(' ')) SCALE[k] = 'F';
let C9 = null; const HC = new Map(); const hexRGB = h => { let v = HC.get(h); if (v) return v; const n = typeof h === 'number' ? h : parseInt(String(h).replace('#', ''), 16); C9.setHex(n); v = [C9.r, C9.g, C9.b]; HC.set(h, v); return v; };   // 마을과 같은 색 공간(sRGB 글자 → 작업 공간)
const getJSON = async (path, ms = 8000) => { const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms); try { const r = await fetch(DB + path, { signal: ac.signal, cache: 'no-store' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } finally { clearTimeout(t); } };
const sizeOf = id => { const R = DECO3D[id] || FALLBACK; return [R.w || 1, R.h || 1]; };
// 아이가 쓴 범위(칸) = 장식 ∪ 바닥 ∪ 집 자리 + 2칸
export function extentOf(data) { let c0 = HOUSE[0], r0 = HOUSE[1], c1 = HOUSE[2], r1 = HOUSE[3];
  for (const d of (data && data.decos) || []) { const [w, h] = sizeOf(d.id); c0 = Math.min(c0, d.col); r0 = Math.min(r0, d.row); c1 = Math.max(c1, d.col + w); r1 = Math.max(r1, d.row + h); }
  for (const k in (data && data.floor) || {}) { const [r, c] = k.split('_').map(Number); if (!Number.isFinite(r) || !Number.isFinite(c)) continue; c0 = Math.min(c0, c); r0 = Math.min(r0, r); c1 = Math.max(c1, c + 1); r1 = Math.max(r1, r + 1); }
  return [Math.max(0, c0 - 2), Math.max(0, r0 - 2), Math.min(YW, c1 + 2), Math.min(YD, r1 + 2)]; }
// 기본 정원(✨ — 꾸미기를 못 읽었거나 꾸민 게 없을 때 깨져 보이지 않게): 집 앞 돌길 + 꽃밭·나무·벤치·분수
export const DEFAULT_YARD = (() => { const decos = [], floor = {}; for (let r = 3; r < 26; r++) for (let c = 46; c < 48; c++) floor[r + '_' + c] = 'stone';
  for (const [c, r] of [[40, 6], [52, 6], [40, 13], [52, 13]]) decos.push({ id: 'd_y1', col: c, row: r }, { id: 'd_y2', col: c + 1, row: r }, { id: 'd_y1', col: c + 2, row: r });
  for (const [c, r] of [[34, 7], [58, 7], [34, 17], [58, 17]]) decos.push({ id: 'd_y9', col: c, row: r }); decos.push({ id: 'd_y10', col: 46, row: 19 }, { id: 'd_y5', col: 43, row: 21 }, { id: 'd_y5', col: 49, row: 21 }); return { decos, floor, ai: true }; })();

export function createYards({ T3, map, onCollider, removeCollider, en }) {
  if (!C9) C9 = new T3.Color();
  const MAT = new T3.MeshLambertMaterial({ vertexColors: true }), GLOW = new T3.MeshBasicMaterial({ vertexColors: true }), FLOOR = new T3.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const Y = [];   // { home, ox, oz, y, ext, grp, cols, anim, data, at, busy, src }
  let SIDS = null, sidAt = 0, dead = false, hidden = false, vq = 0; const PRE = {};
  const m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), e4 = new T3.Euler(), v3 = new T3.Vector3(), one = new T3.Vector3(1, 1, 1);

  // ── 학생 찾기(이름 끝이 집 주인 이름) — 열쇠·이름은 이 안에서만 ──
  async function findSids(homes) {
    if (SIDS && performance.now() - sidAt < 600000) return SIDS;
    const keys = await getJSON('/students.json?shallow=true'); if (!keys || typeof keys !== 'object') return SIDS || {};
    const out = {}, list = Object.keys(keys).filter(k => /^s\d+$/.test(k));
    await Promise.all(list.map(async k => { const nm = await getJSON('/students/' + k + '/name.json'); if (typeof nm !== 'string') return; const n9 = nm.trim(); for (const h of homes) if (!out[h] && n9.endsWith(h)) out[h] = k; }));
    SIDS = out; sidAt = performance.now(); return out;
  }
  async function fetchYard(sid) {
    const [deco, floor] = await Promise.all([getJSON('/students/' + sid + '/houseDecorations.json'), getJSON('/students/' + sid + '/yardFloor.json')]);
    if (deco == null && floor == null) return null;
    const L = (Array.isArray(deco) ? deco : deco && typeof deco === 'object' ? Object.values(deco) : []).filter(d => d && d.area === 'yard' && (d.sp == null || d.sp === 1) && typeof d.id === 'string' && Number.isFinite(d.col) && Number.isFinite(d.row));
    const F = floor && typeof floor === 'object' ? floor : {}; if (!L.length && !Object.keys(F).length) return null; return { decos: L, floor: F };
  }

  // ── 부품 → 삼각형(로컬 = 장식 가운데 땅 · x 동 · z 남) ──
  const GEO = {}; const geoOf = (p) => { const s = p.s, k = p.k + ':' + s.join(','); let g = GEO[k]; if (g) return g;
    if (p.k === 'box') g = new T3.BoxGeometry(s[0], s[1], s[2]);
    else if (p.k === 'cyl') g = new T3.CylinderGeometry(s[0], s[1], s[2], s[3] || 10);
    else if (p.k === 'cone') g = new T3.ConeGeometry(s[0], s[1], s[2] || 10);
    else { g = new T3.SphereGeometry(1, 9, 6); g.scale(s[0], s[1] ?? s[0], s[2] ?? s[0]); }
    g = g.index ? g.toNonIndexed() : g; return (GEO[k] = g); };
  const partH = p => p.k === 'sph' ? 0 : p.k === 'box' ? p.s[1] : p.k === 'cyl' ? p.s[2] : p.s[1];
  function partMatrix(p, out) {   // 밑면 가운데 p(눕힌 원기둥·공 = 가운데) · 돌림 rz → rx → r(y)
    const lay = p.k === 'sph' || p.rx || p.rz || p.lay, h = partH(p); m4.makeTranslation(0, lay ? 0 : h / 2, 0);
    e4.set(p.rx || 0, p.r || 0, p.rz || 0, 'YXZ'); q4.setFromEuler(e4); out.compose(v3.set(p.p[0], p.p[1], p.p[2]), q4, one).multiply(m4); return out; }
  const MP = new T3.Matrix4(), MW = new T3.Matrix4(), NM = new T3.Matrix3(), pv = new T3.Vector3(), nv = new T3.Vector3();
  function pushPart(A, p, world, col) { const g = geoOf(p), P = g.attributes.position, N = g.attributes.normal; partMatrix(p, MP); MW.multiplyMatrices(world, MP); NM.getNormalMatrix(MW);
    for (let i = 0; i < P.count; i++) { pv.fromBufferAttribute(P, i).applyMatrix4(MW); nv.fromBufferAttribute(N, i).applyMatrix3(NM).normalize(); A.p.push(pv.x, pv.y, pv.z); A.n.push(nv.x, nv.y, nv.z); A.c.push(col[0], col[1], col[2]); } }
  const newA = () => ({ p: [], n: [], c: [] });
  const meshOf = (A, mat) => { if (!A.p.length) return null; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(A.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(A.c, 3)); g.computeBoundingSphere(); const m = new T3.Mesh(g, mat); m.userData.fx = 1; return m; };
  const IDN = new T3.Matrix4();

  // ── 바닥: 칸(1.4m)마다 판 하나(버텍스 색) + 꽃밭 가족 = 꽃 몇 송이 + 테두리 · 쓴 범위 안만 ──
  function buildFloor(Yd, F, A) { const y = Yd.y + 0.03, fam = {}, [c0, r0, c1, r1] = Yd.ext, put = (x0, z0, x1, z1, yy, col) => { A.p.push(x0, yy, z0, x0, yy, z1, x1, yy, z1, x0, yy, z0, x1, yy, z1, x1, yy, z0); for (let i = 0; i < 6; i++) { A.n.push(0, 1, 0); A.c.push(col[0], col[1], col[2]); } };
    const rnd = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) { const inH = c >= HOUSE[0] && c < HOUSE[2] && r >= HOUSE[1] && r < HOUSE[3]; if (inH) continue;   // 집 자리 = 집이 섬
      const v = F[r + '_' + c] || 'grass', fo = floorOf(v), col = hexRGB(fo.base).map(q => q * (0.95 + 0.08 * rnd(r, c))), x0 = Yd.ox + c * CS, z0 = Yd.oz + r * CS;
      put(x0, z0, x0 + CS, z0 + CS, y, col); if (fo.fam) { fam[r + '_' + c] = fo; const fc = hexRGB(fo.flower), n = fo.sparse ? 3 : fo.big ? 4 : 7, hh = fo.tall ? 0.42 : 0.16;
        for (let k = 0; k < n; k++) { const fx = x0 + 0.2 + rnd(r * 3 + k, c) * (CS - 0.4), fz = z0 + 0.2 + rnd(c * 5 + k, r) * (CS - 0.4), fcol = fo.flower === FLOWER_COL.rainbow ? hexRGB(['#e85a8a', '#f2c84b', '#6a9ae0', '#f4f1e8'][k % 4]) : fc, sz = fo.big ? 0.16 : 0.09;
          pushPart(A, { k: 'box', s: [0.025, hh, 0.025], p: [fx, y, fz] }, IDN, [0.29, 0.5, 0.23]); pushPart(A, { k: 'box', s: [sz, sz * 0.8, sz], p: [fx, y + hh, fz] }, IDN, fcol); } } }
    for (const k in fam) { const fo = fam[k]; if (!fo.rim) continue; const [r, c] = k.split('_').map(Number), x0 = Yd.ox + c * CS, z0 = Yd.oz + r * CS, rc = hexRGB(fo.rim), h9 = CS / 2;   // 꽃밭 테두리(이웃이 같은 꽃밭이 아닌 변)
      for (const [dr, dc, a] of [[-1, 0, 'n'], [1, 0, 's'], [0, -1, 'w'], [0, 1, 'e']]) { if (fam[(r + dr) + '_' + (c + dc)]) continue; const p = a === 'n' ? [x0 + h9, y, z0 + 0.06] : a === 's' ? [x0 + h9, y, z0 + CS - 0.06] : a === 'w' ? [x0 + 0.06, y, z0 + h9] : [x0 + CS - 0.06, y, z0 + h9], s = a === 'n' || a === 's' ? [CS, 0.18, 0.12] : [0.12, 0.18, CS]; pushPart(A, { k: 'box', s, p }, IDN, rc); } } }

  // ── 장식(자리 = 칸 ×1.4 · 모양 = SCALE) ──
  function buildDecos(Yd, list, Ast, Agl, grp) { const anim = [], cols = [], seen = new Set(), [c0, r0, c1, r1] = Yd.ext;
    for (const d of list) { const R = DECO3D[d.id] || FALLBACK, w = R.w || 1, h = R.h || 1; if (d.col < c0 || d.row < r0 || d.col + w > c1 || d.row + h > r1) continue; if (d.col < HOUSE[2] && d.col + w > HOUSE[0] && d.row < HOUSE[3]) continue;   // 집 자리 위는 집이 섬
      const key = d.id + '@' + d.col + '_' + d.row; if (seen.has(key)) continue; seen.add(key);
      const md = R === FALLBACK ? '' : SCALE[d.id] || '', sx = md ? CS : 1, sy = md === 'A' ? CS : 1, cx = Yd.ox + (d.col + w / 2) * CS, cz = Yd.oz + (d.row + h / 2) * CS, world = new T3.Matrix4().makeTranslation(cx, Yd.y + 0.03, cz).multiply(new T3.Matrix4().makeScale(sx, sy, sx));
      if (R.anim === 'walk' && anim.length < 16) { const A = newA(); for (const p of R.parts) pushPart(A, p, IDN, hexRGB(p.c)); const m = meshOf(A, MAT); if (m) { m.position.set(cx, Yd.y + 0.03, cz); grp.add(m); anim.push({ m, hx: cx, hz: cz, r: Math.min((R.walkR || 3) * CS, 8), t: Math.random() * 6, tx: cx, tz: cz, wait: Math.random() * 2 }); } continue; }   // 동물 = 실제 크기 · 걷는 반경 ×1.4
      let top = 0; for (const p of R.parts) { if (p.spin) continue; pushPart(p.glow ? Agl : Ast, p, world, hexRGB(p.c)); top = Math.max(top, p.p[1] + (p.k === 'sph' ? (p.s[1] ?? p.s[0]) : partH(p))); } top *= sy;
      const sp = R.parts.filter(p => p.spin); if (sp.length) { const hub = sp[0].p, A = newA(), MS = new T3.Matrix4().makeScale(sx, sy, sx); for (const p of sp) { const a = p.rz || 0, ox = -Math.sin(a) * (p.off || 0), oy = Math.cos(a) * (p.off || 0); pushPart(A, { ...p, p: [ox, oy, 0], rx: 0, rz: a, lay: 1 }, MS, hexRGB(p.c)); }
        const m = meshOf(A, MAT); if (m) { m.position.set(cx + hub[0] * sx, Yd.y + 0.03 + hub[1] * sy, cz + hub[2] * sx); grp.add(m); anim.push({ m, spin: true }); } }
      const fw = md ? w * CS : Math.min(w * CS, 1.2), fh = md ? h * CS : Math.min(h * CS, 1.2);
      if (top > 0.8 && R !== FALLBACK) cols.push({ x0: cx - fw * 0.42, x1: cx + fw * 0.42, z0: cz - fh * 0.42, z1: cz + fh * 0.42, y0: Yd.y - 1, y1: Yd.y + Math.min(top, 7) }); }
    return { anim, cols }; }

  function clearYard(Yd) { if (Yd.grp) { map.remove(Yd.grp); Yd.grp.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); Yd.grp = null; } for (const h of Yd.cols || []) removeCollider(h); Yd.cols = []; Yd.anim = []; }
  function buildYard(Yd, data) { clearYard(Yd); const grp = new T3.Group(); grp.userData.fx = 1; const Af = newA(), As = newA(), Ag = newA();
    buildFloor(Yd, data.floor || {}, Af); const r = buildDecos(Yd, data.decos || [], As, Ag, grp);
    { const hc = hexRGB('#4f8f3e'), hc2 = hexRGB('#5a9a46'), y = Yd.y + 0.03, [c0, r0, c1, r1] = Yd.ext, X0 = Yd.ox + c0 * CS - 0.35, X1 = Yd.ox + c1 * CS + 0.35, Z0 = Yd.oz + r0 * CS, Z1 = Yd.oz + r1 * CS + 0.35, gx0 = Yd.ox + 44 * CS, gx1 = Yd.ox + 50 * CS;   // 생울타리(쓴 범위 테두리 — 서·동·남 · 남쪽 집 앞 대문 · 북쪽은 집 쪽이라 트임)
      for (let z = Z0; z < Z1 - 0.4; z += 2) for (const x of [X0, X1]) pushPart(As, { k: 'box', s: [0.6, 0.75, Math.min(2, Z1 - 0.35 - z)], p: [x, y, z + Math.min(2, Z1 - 0.35 - z) / 2] }, IDN, ((z / 2) | 0) % 2 ? hc : hc2);
      for (let x = X0 + 0.3; x < X1 - 0.3; x += 2) { const x2 = Math.min(x + 2, X1 - 0.3); if (x2 > gx0 && x < gx1) continue; pushPart(As, { k: 'box', s: [x2 - x, 0.75, 0.6], p: [(x + x2) / 2, y, Z1] }, IDN, ((x / 2) | 0) % 2 ? hc : hc2); }
      for (const x of [gx0, gx1]) pushPart(As, { k: 'box', s: [0.3, 1.3, 0.3], p: [x, y, Z1] }, IDN, hexRGB('#f4f1e8'));   // 대문 기둥
      r.cols.push({ x0: X0 - 0.3, x1: X0 + 0.3, z0: Z0, z1: Z1, y0: Yd.y - 1, y1: Yd.y + 0.8, nc: true }, { x0: X1 - 0.3, x1: X1 + 0.3, z0: Z0, z1: Z1, y0: Yd.y - 1, y1: Yd.y + 0.8, nc: true }, { x0: X0, x1: gx0 - 0.5, z0: Z1 - 0.3, z1: Z1 + 0.3, y0: Yd.y - 1, y1: Yd.y + 0.8, nc: true }, { x0: gx1 + 0.5, x1: X1, z0: Z1 - 0.3, z1: Z1 + 0.3, y0: Yd.y - 1, y1: Yd.y + 0.8, nc: true }); }
    for (const [A, mat] of [[Af, FLOOR], [As, MAT], [Ag, GLOW]]) { const m = meshOf(A, mat); if (m) { m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m); } }
    Yd.grp = grp; Yd.anim = r.anim; Yd.cols = r.cols.map(c => onCollider(c)); Yd.src = data.ai ? 'ai' : 'rpg'; Yd.n = (data.decos || []).length; grp.visible = !hidden; map.add(grp); }
  async function load(Yd, force) { if (Yd.busy || dead) return; Yd.busy = true; try {
      let data = null; if (!force && PRE[Yd.home] && !Yd.at) data = PRE[Yd.home]; else { const sids = await findSids(Y.map(q => q.home)), sid = sids[Yd.home]; data = sid ? await fetchYard(sid) : null; } if (dead) return;
      if (!data && Yd.data && !force) data = Yd.data; if (!data) data = DEFAULT_YARD; Yd.data = data; Yd.at = performance.now(); buildYard(Yd, data);
    } finally { Yd.busy = false; } }

  return {
    // 마을 짓기 전에 한 번(범위를 알아야 터·자리를 정함) — 다 못 읽으면 ms 뒤에 기본 정원으로
    async prefetch(homes, ms = 4500) { const t0 = performance.now(); const job = (async () => { const sids = await findSids(homes); await Promise.all(homes.map(async h => { if (PRE[h] !== undefined) return; PRE[h] = sids[h] ? await fetchYard(sids[h]) : null; })); })();
      await Promise.race([job, new Promise(r => setTimeout(r, Math.max(0, ms - (performance.now() - t0))))]); const out = {}; for (const h of homes) out[h] = PRE[h] || DEFAULT_YARD; return out; },
    set(list) { for (const Yd of Y) clearYard(Yd); Y.length = 0; for (const q of list) Y.push({ ...q, grp: null, cols: [], anim: [], data: null, at: 0, busy: false }); Y.forEach((Yd, i) => setTimeout(() => { if (!dead && Y.includes(Yd)) load(Yd); }, 400 + i * 220)); },   // 마을을 다 지은 뒤 한 마당씩(처음 짓기 시간에 안 넣음)
    hide(v) { hidden = !!v; for (const Yd of Y) if (Yd.grp) Yd.grp.visible = !hidden; },
    tick(dt, me, cam) { if (hidden) return;
      if ((vq += dt) > 0.4) { vq = 0; for (const Yd of Y) { if (!Yd.grp) continue; const [c0, r0, c1, r1] = Yd.ext, mx = Yd.ox + (c0 + c1) / 2 * CS, mz = Yd.oz + (r0 + r1) / 2 * CS; Yd.grp.visible = Math.hypot(cam.x - mx, cam.z - mz) < 260;
          if (Yd.at && me.x > Yd.ox + c0 * CS - 6 && me.x < Yd.ox + c1 * CS + 6 && me.z > Yd.oz - NORTH - 8 && me.z < Yd.oz + r1 * CS + 6 && performance.now() - Yd.at > 60000) load(Yd); } }   // 그 마당에 들어올 때 60초 지났으면 다시 읽기(범위 밖에 새로 놓은 것은 다음에 마을을 열 때)
      for (const Yd of Y) { if (!Yd.grp || !Yd.grp.visible) continue; for (const a of Yd.anim) { if (a.spin) { a.m.rotation.z -= dt * 1.2; continue; }
        if (a.wait > 0) { a.wait -= dt; continue; } const dx = a.tx - a.m.position.x, dz = a.tz - a.m.position.z, d = Math.hypot(dx, dz);
        if (d < 0.1) { const an = Math.random() * 6.2832, rr = Math.random() * a.r; a.tx = a.hx + Math.cos(an) * rr; a.tz = a.hz + Math.sin(an) * rr; a.wait = 1 + Math.random() * 3; continue; }
        const st = Math.min(d, dt * 0.55); a.m.position.x += dx / d * st; a.m.position.z += dz / d * st; a.m.rotation.y = Math.atan2(-dx, -dz); a.t += dt; a.m.position.y = Yd.y + 0.03 + Math.abs(Math.sin(a.t * 9)) * 0.03; } } },   // 동물 = 마당 안 천천히(머리 = -z)
    info: () => Y.map(Yd => ({ home: Yd.home, src: Yd.src || null, n: Yd.n || 0, cols: (Yd.cols || []).length, anim: (Yd.anim || []).length, rect: [Yd.ox + Yd.ext[0] * CS, Yd.oz + Yd.ext[1] * CS, Yd.ox + Yd.ext[2] * CS, Yd.oz + Yd.ext[3] * CS].map(v => +v.toFixed(1)), ext: Yd.ext })),
    reload: () => Promise.all(Y.map(Yd => load(Yd, true))),
    dispose() { dead = true; for (const Yd of Y) clearYard(Yd); Y.length = 0; for (const k in GEO) GEO[k].dispose(); MAT.dispose(); GLOW.dispose(); FLOOR.dispose(); },
  };
}
export const YARD_SIZE = [YW, YD], YARD_HOUSE = HOUSE, YARD_CS = CS, YARD_NORTH = NORTH;
