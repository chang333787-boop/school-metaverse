// v2 지도 API(MAP-API-1 · 09-24) — 게임이 믿고 쓰는 '지도 계약'. import 없음(THREE·월드·물리 함수는 main.js가 host로 주입).
//   구역 이름표(id·kind·층·건물·tags) · 출발점 · 표지점 · 상호작용 · 이벤트 · 질의 · 길찾기 · 미니맵 데이터 · 게임 로더(?game=이름).
//   원칙: 매 프레임 새 객체·전체 순회 금지(구역·트리거·경계는 10Hz) · 예외는 잡아서 월드 루프가 멈추지 않게 · 사람 NPC·대사 생성 금지.
//   정본 문서 = docs/map_api.md
//   GAME-FIND-1(09-26): 미니맵(minimap.js)·놀이 고르기 칩(gamepick.js)은 같은 폴더의 HUD 모듈 — 둘 다 import 없음(THREE·월드는 여기서만 host로 받는다).
import { createMinimap } from './minimap.js?v=4';
import { createGamePicker } from './gamepick.js?v=4';
export function createMapApi(host, NAV, META) {
  const { THREE, scene, world, SCHOOL, q, pl, ui } = host;
  const HOT = host.hot, Z = world.zones, P = pl.P, CTRL = pl.CTRL;
  const warn = { zonesNoMeta: [], metaNoZone: [], dupIds: [] };
  const R2D = Math.PI / 180;

  // ---------- 1. 구역 보강(제자리 — world.zones 참조 유지) ----------
  const BRECT = (() => { const B = SCHOOL.building, g = SCHOOL.gym;
    return [['main', B.front], ['main', B.entrance], ['west', B.wings[0]], ['cafe', B.kitchen], ['link', B.centerLobby], ['link', B.linkCorridor], ['east', B.eastWing],
      ['gym', { x: [g.center[0] - g.width / 2, g.center[0] + g.width / 2], z: [g.center[1] - g.depth / 2, g.center[1] + g.depth / 2] }], ['gym', g.annex]]
      .map(([id, r]) => ({ id, x0: r.x[0], x1: r.x[1], z0: r.z[0], z1: r.z[1] })); })();
  const bldgAt = (x, z) => { for (const b of BRECT) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return b.id; return null; };
  const byId = new Map();
  // 같은 라벨 월드 구역이 여럿(계약표 multi): 가장 넓은 구역이 계약 id를 갖고 나머지는 월드 순서대로 id-2·id-3.
  //  push 순서로 매기면 먼저 들어온 작은 조각이 id를 가로챈다(09-26 리뷰: 운동장 서쪽 띠 42㎡ 조각이 'field'가 되어 zone:운동장이 유치원 놀이터 옆으로 갔다)
  const primary = new Map();
  for (const z of Z) { const m = META.ZONE_META[z.label]; if (!m || !m.opts.multi) continue;
    const a = (z.x1 - z.x0) * (z.z1 - z.z0), p = primary.get(z.label); if (!p || a > p.a) primary.set(z.label, { z, a }); }
  function enrich(z, m) {
    if (!m) {   // 병행 작업본이 새 구역을 더했는데 표에 없을 때 — 월드는 뜨게 두고 check()가 알린다
      warn.zonesNoMeta.push(z.label);
      const b = bldgAt((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2);
      m = { id: 'z-' + z.label.replace(/\s+/g, '-'), kind: b ? 'hall' : 'yard', bldg: b, tags: ['nometa'], opts: {} };
    }
    const y = z.y ?? 0, yr = m.opts.yr || [y - 1.2, y + 1.2];
    Object.assign(z, { id: m.id, kind: m.kind, bldg: m.bldg, tags: m.tags.slice(), indoor: m.opts.indoor ?? (m.bldg !== null),
      floor: y >= 3 ? 2 : 1, y0: yr[0], y1: yr[1], area: (z.x1 - z.x0) * (z.z1 - z.z0), cx: (z.x0 + z.x1) / 2, cz: (z.z0 + z.z1) / 2 });
    if (m.opts.multi && primary.has(z.label) && primary.get(z.label).z !== z) { let k = 2; while (byId.has(m.id + '-' + k)) k++; z.id = m.id + '-' + k; }   // multi — 가장 넓은 구역 말고는 id-2·id-3
    if (byId.has(z.id)) warn.dupIds.push(z.id); else byId.set(z.id, z);
  }
  Z.forEach(z => enrich(z, META.ZONE_META[z.label]));
  for (const lab of Object.keys(META.ZONE_META)) if (!Z.some(z => z.label === lab)) warn.metaNoZone.push(lab);
  for (const ez of META.EXTRA_ZONES) { const z = { x0: ez.x0, x1: ez.x1, z0: ez.z0, z1: ez.z1, y: ez.y, label: ez.label, extra: true }; Z.push(z); enrich(z, ez.meta); }
  // 판정 = 반열린 구간(x0 ≤ x < x1 — 경계 줄이 어느 구역에도 안 들던 틈 제거) + 높이 띠, 여럿이면 가장 좁은 구역(겹침 순서에 흔들리지 않음)
  const inZone = (z, x, y, zz) => x >= z.x0 && x < z.x1 && zz >= z.z0 && zz < z.z1 && y >= z.y0 && y < z.y1;
  function zoneIndex(x, y, zz) { let best = -1, ba = 1e18; for (let i = 0; i < Z.length; i++) { const z = Z[i]; if (z.area < ba && inZone(z, x, y, zz)) { best = i; ba = z.area; } } return best; }
  const zoneAt = (x, y, zz) => { const i = zoneIndex(x, y, zz); return i < 0 ? null : Z[i]; };
  // 구역 찾기: id → 계약표 라벨(그 라벨의 계약 id 구역 — multi면 가장 넓은 것) → 덧붙인 구역 라벨(첫 것)
  const zone = key => byId.get(key) || (Object.prototype.hasOwnProperty.call(META.ZONE_META, key) && byId.get(META.ZONE_META[key].id)) || Z.find(z => z.label === key) || null;
  const matchZone = (z, f = {}) => !!z && (!f.kind || z.kind === f.kind) && (!f.kinds || f.kinds.includes(z.kind)) && (!f.zones || f.zones.includes(z.id) || f.zones.includes(z.label))
    && (!f.tags || f.tags.every(t => z.tags.includes(t))) && (!f.notTags || !f.notTags.some(t => z.tags.includes(t)))
    && (f.indoor === undefined || z.indoor === f.indoor) && (!f.floor || z.floor === f.floor) && (f.bldg === undefined || z.bldg === f.bldg);
  const zonesWhere = f => Z.filter(z => matchZone(z, f));

  // ---------- 2. 질의(q) — 물리와 같은 함수를 그대로 ----------
  const poly = SCHOOL.boundary;
  const inSchool = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const U = world.UPPER;
  const floorY = (x, z, floor = 1) => (floor === 2 && x > U[0] && x < U[1] && z > U[2] && z < U[3]) ? q.groundAt(x, z, U[4] + 0.3) : q.groundAt(x, z, world.baseAt(x, z) + 0.3);
  // 선분 a→b가 충돌 상자를 지나는 첫 비율 t(0~1) 또는 null — 8m 격자 칸만 본다. ignoreNc: 보이지 않는 '올라서기 금지' 윗부분·울타리 막이 무시
  function ray(a, b, opt = {}) {
    const ign = opt.ignoreNc !== false, minH = opt.minH || 0, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    let t = 1, hit = false; const seen = new Set();
    for (let gx = Math.floor(Math.min(a[0], b[0]) / 8); gx <= Math.floor(Math.max(a[0], b[0]) / 8); gx++)
      for (let gz = Math.floor(Math.min(a[2], b[2]) / 8); gz <= Math.floor(Math.max(a[2], b[2]) / 8); gz++) {
        const cell = world.grid.get(gx + ':' + gz); if (!cell) continue;
        for (const i of cell) { if (seen.has(i)) continue; seen.add(i); const c = world.colliders[i];
          if ((ign && c.nc) || c.y1 - c.y0 < minH) continue;
          let t0 = 0, t1 = t, ok = true;
          for (let ax = 0; ax < 3 && ok; ax++) { const o = a[ax], d = ax === 0 ? dx : ax === 1 ? dy : dz, lo = ax === 0 ? c.x0 : ax === 1 ? c.y0 : c.z0, hi = ax === 0 ? c.x1 : ax === 1 ? c.y1 : c.z1;
            if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d, r = (hi - o) / d; if (p > r) { const s = p; p = r; r = s; } if (p > t0) t0 = p; if (r < t1) t1 = r; if (t0 > t1) ok = false; } }
          if (ok && t0 < t) { t = t0; hit = true; } }
      }
    return hit ? t : null;
  }
  const Q = {
    groundAt: q.groundAt, blocked: q.blockedAt, ceilAt: q.ceilAt, floorY, ray, los: (a, b, o) => ray(a, b, o) === null, inSchool,
    indoor: (x, y, z) => q.ceilAt(x, z, y + 1.6, y + 5.5) !== null,
    // 사람이 아닌 이동체(공 등)용 — 플레이어와 같은 축 분리 충돌(반지름 0.26)·오름 0.55
    moveBody(p, dx, dz) { if (!q.blockedAt(p.x + dx, p.z, p.y)) p.x += dx; if (!q.blockedAt(p.x, p.z + dz, p.y)) p.z += dz; const g = q.groundAt(p.x, p.z, p.y); if (g <= p.y + 0.55) p.y = g; return p; },
  };

  // ---------- 3. 지점(POI): zone: · lm: · spawn: · hot: · door: · game: ----------
  const POI = new Map();
  const addPoi = p => { POI.set(p.id, p); return p; };
  // 입구점: 중심에서 0.3m씩 넓히며 24방향 — 발밑이 층 높이 ±0.35·그 자리와 상하좌우 0.45가 안 막힌 첫 칸(길격자 없이 수 ms)
  function findEntry(cx, cz, fy, rect, maxR = 14) {
    const ok = (x, z) => { if (rect && (x < rect[0] + 0.4 || x > rect[2] - 0.4 || z < rect[1] + 0.4 || z > rect[3] - 0.4)) return null;
      const g = q.groundAt(x, z, fy + 0.3); if (Math.abs(g - fy) > 0.35 || q.blockedAt(x, z, g)) return null;
      for (const [ox, oz] of [[0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]]) if (q.blockedAt(x + ox, z + oz, g)) return null; return g; };
    for (let r = 0; r <= maxR; r += 0.3) for (let k = 0; k < (r ? 24 : 1); k++) { const a = k * Math.PI / 12, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, g = ok(x, z); if (g !== null) return { x, y: g, z }; }
    return null;
  }
  const entryBad = [];
  for (const z of Z) {
    const e = findEntry(z.cx, z.cz, z.y ?? 0, [z.x0, z.z0, z.x1, z.z1]);
    if (!e) entryBad.push(z.id);
    addPoi({ id: 'zone:' + z.id, label: z.label, x: e ? e.x : z.cx, y: e ? e.y : (z.y ?? 0), z: e ? e.z : z.cz, zone: z.id, tags: z.tags, stand: e ? [e.x, e.y, e.z] : null, src: 'zone', entry: !!e });
  }
  for (const L of META.LANDMARKS) {
    const y = world.terrainAt(L.at[0], L.at[1]), e = findEntry(L.at[0], L.at[1], y, null, 10);
    addPoi({ id: 'lm:' + L.id, label: L.label, x: L.at[0], y, z: L.at[1], r: L.r, rect: L.rect || null, zone: (zoneAt(L.at[0], y, L.at[1]) || {}).id || null, tags: ['landmark'], stand: e ? [e.x, e.y, e.z] : null, src: 'landmark' });
  }
  for (const [id, s] of Object.entries(META.SPAWNS)) {
    const y = floorY(s.x, s.z, s.floor || 1);
    addPoi({ id: 'spawn:' + id, label: s.label, x: s.x, y, z: s.z, h: s.h || 0, floor: s.floor || 1, zone: (zoneAt(s.x, y, s.z) || {}).id || null, tags: ['spawn'], stand: [s.x, y, s.z], src: 'spawn' });
  }
  { const cnt = {}; HOT.forEach(h => { const zn = (zoneAt(h.x, h.y, h.z) || {}).id || 'out', k = h.kind + ':' + zn; cnt[k] = (cnt[k] || 0) + 1;
      h.id = 'hot:' + k + ':' + cnt[k]; addPoi({ id: h.id, label: h.label, x: h.x, y: h.y, z: h.z, r: h.r, zone: zn, tags: ['hot', h.kind], stand: null, src: 'hot', hot: h }); }); }
  world.doors.forEach((d, n) => {
    const nx = d.ax === 'x' ? 0 : 0.9, nz = d.ax === 'x' ? 0.9 : 0, y = d.y0 + 0.05;
    const za = zoneAt(d.cx - nx, y, d.cz - nz), zb = zoneAt(d.cx + nx, y, d.cz + nz);
    d.zones = [za && za.id, zb && zb.id];
    addPoi({ id: 'door:' + n, label: '문', x: d.cx, y: d.y0, z: d.cz, zone: (za || zb || {}).id || null, zones: d.zones, tags: ['door'], stand: null, src: 'door', door: d });
  });
  const poi = id => POI.get(id) || null;
  const pois = (f = {}) => [...POI.values()].filter(p => (!f.src || p.src === f.src) && (!f.zone || p.zone === f.zone) && (!f.tag || p.tags.includes(f.tag)));
  // 대상 → {x,y,z}: 노드 번호 | [x,z] | [x,y,z] | {x,y,z} | 'spawn:id' | 'zone:id(라벨)' | 'lm:id' | 'hot:…' | 'door:n' | 'game:…'
  function resolve(t, floor = 1) {
    if (t == null) return null;
    if (typeof t === 'number') { const N = navCache.get('walk'); return N && N.done ? xyz(N.done.pos(t)) : null; }
    if (Array.isArray(t)) return t.length === 2 ? { x: t[0], y: floorY(t[0], t[1], floor), z: t[1] } : { x: t[0], y: t[1], z: t[2] };
    if (typeof t === 'object') return { x: t.x, y: t.y ?? floorY(t.x, t.z, floor), z: t.z };
    let p = POI.get(t);
    if (!p && t.startsWith('zone:')) { const z = zone(t.slice(5)); p = z && POI.get('zone:' + z.id); }
    if (!p) return null;
    const s = p.stand || [p.x, p.y, p.z]; return { x: s[0], y: s[1], z: s[2], h: p.h, floor: p.floor };
  }
  const xyz = a => ({ x: a[0], y: a[1], z: a[2] });

  // ---------- 4. 이벤트 ----------
  const L = new Map();
  function on(type, fn) { if (!L.has(type)) L.set(type, new Set()); L.get(type).add(fn); return () => L.get(type).delete(fn); }
  function emit(type, ev) { const s = L.get(type); if (!s) return; for (const fn of [...s]) { try { fn(ev); } catch (e) { console.error('[map] 이벤트 처리 중 오류(' + type + ')', e); } } }

  // ---------- 5. 플레이어 ----------
  const setHeading = h => { pl.setYaw(-h * R2D); P.yaw = Math.atan2(Math.sin(h * R2D), -Math.cos(h * R2D)); };
  const player = {
    get: () => { const zn = zoneAt(P.x, P.y, P.z); return { x: P.x, y: P.y, z: P.z, h: ((-pl.getYaw() / R2D) % 360 + 360) % 360, ground: P.ground, zone: zn ? zn.id : null }; },
    teleport(target, o = {}) {
      const r = resolve(target, o.floor || 1); if (!r) { console.warn('[map] teleport: 모르는 대상', target); return false; }
      pl.ACT.anim = null; pl.ACT.sit = null; P.x = r.x; P.z = r.z; P.y = r.y + 0.01; P.vy = 0; P.ground = true;
      const h = o.h ?? r.h; if (h != null) setHeading(h);
      emit('teleport', { x: P.x, y: P.y, z: P.z }); return true;
    },
    face(h) { setHeading(h); },
    lookAt(target) { const r = resolve(target); if (r) setHeading(Math.atan2(r.x - P.x, -(r.z - P.z)) / R2D); },
    unstick: () => unstick(),                                     // 끼였을 때 가장 가까운 걷는 칸으로(3m 안)
    freeze(on2 = true) { CTRL.frozen = !!on2; },
    speed(k = 1) { CTRL.speed = Math.max(0.5, Math.min(2, k)); },
  };

  // ---------- 6. 상호작용·트리거·동적 충돌 ----------
  let gid = 0;
  const interact = {
    // E키 지점 추가 — main.js hotTick·act가 그대로 처리(h.use가 있으면 그걸 부른다)
    add(o) { const h = { kind: o.kind || 'game', x: o.x, y: o.y ?? floorY(o.x, o.z), z: o.z, r: o.r ?? 1.2, label: o.label || '살펴보기', use: o.use, once: !!o.once, id: 'game:' + (o.owner || 'map') + ':' + (++gid) };
      HOT.push(h); addPoi({ id: h.id, label: h.label, x: h.x, y: h.y, z: h.z, r: h.r, zone: (zoneAt(h.x, h.y, h.z) || {}).id || null, tags: ['game'], stand: null, src: 'game', hot: h });
      return { hot: h, remove() { const i = HOT.indexOf(h); if (i >= 0) HOT.splice(i, 1); POI.delete(h.id); } }; },
    // 기존 지점 켜고 끄기: filter = kind 문자열 | (h) => bool
    enable(filter, on2) { const f = typeof filter === 'function' ? filter : h => h.kind === filter; const hit = HOT.filter(f), prev = hit.map(h => !!h.off);
      hit.forEach(h => { h.off = !on2; }); return { remove() { hit.forEach((h, i) => { h.off = prev[i]; }); } }; },   // remove = 원래대로
    list: (f = {}) => HOT.filter(h => (!f.kind || h.kind === f.kind) && (!f.zone || (zoneAt(h.x, h.y, h.z) || {}).id === f.zone)),
  };
  const TRIG = new Set();
  const trigger = {
    // {x,y,z,r} 원(수평 r · |dy| < 1.6) 또는 {rect:[x0,z0,x1,z1], y0, y1} — 10Hz 판정(달리기 7.5m/s = 0.75m 간격 → r ≥ 0.8 권장)
    add(shape, cb = {}) { const t = { shape, cb, inside: false }; TRIG.add(t); return { remove() { TRIG.delete(t); } }; },
  };
  const trigIn = s => s.rect ? (P.x >= s.rect[0] && P.x <= s.rect[2] && P.z >= s.rect[1] && P.z <= s.rect[3] && P.y >= (s.y0 ?? -1e9) && P.y <= (s.y1 ?? 1e9))
    : ((P.x - s.x) ** 2 + (P.z - s.z) ** 2 < s.r * s.r && Math.abs(P.y - (s.y ?? P.y)) < 1.6);
  const collider = {
    // 동적 충돌 상자 — 길격자에는 안 들어간다(같이 nav.block을 걸 것)
    add(b, o = {}) {
      const c = { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, z0: b.z0, z1: b.z1, nc: !!(o.ns || b.nc), dyn: true }; if (o.ns) c.y1 = Math.max(c.y1, c.y0 + 1.6);
      const i = world.colliders.push(c) - 1, cells = [];
      for (let gx = Math.floor(c.x0 / 8); gx <= Math.floor(c.x1 / 8); gx++) for (let gz = Math.floor(c.z0 / 8); gz <= Math.floor(c.z1 / 8); gz++) { const k = gx + ':' + gz; if (!world.grid.has(k)) world.grid.set(k, []); world.grid.get(k).push(i); cells.push(k); }
      return { box: c, remove() { c.y0 = c.y1 = -1e6; for (const k of cells) { const a = world.grid.get(k), j = a ? a.indexOf(i) : -1; if (j >= 0) a.splice(j, 1); } cells.length = 0; } };   // 인덱스는 유지(다른 참조가 안 밀리게)
    },
  };

  // ---------- 7. 놀이 경계(소프트) — 밖에 0.25초 넘게 있으면 마지막 안전 지점으로 ----------
  const arena = { shape: null, out: 0, safe: null, safeT: 0 };
  const inArena = (x, z) => { const s = arena.shape; if (!s) return true; if (s === 'school') return inSchool(x, z); if (s.rect) return x >= s.rect[0] && x <= s.rect[2] && z >= s.rect[1] && z <= s.rect[3];
    if (s.poly) { let c = false; const p = s.poly; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; } return true; };
  const arenaApi = { set(s) { arena.shape = s || null; arena.out = 0; arena.safe = null; return { remove() { if (arena.shape === s) arena.shape = null; } }; }, get: () => arena.shape };

  // ---------- 8. HUD(DOM · .chip 스타일) ----------
  const el = (css, txt = '') => { const d = document.createElement('div'); d.className = 'chip'; d.style.cssText = css; d.textContent = txt; document.body.appendChild(d); return d; };
  const chips = new Map(); let banEl = null, banT = 0, goalEl = null, MM = null;   // MM = 미니맵(§11b에서 만든다)
  // 게임 칩 줄: 오른쪽 위 fps 칩 아래. 미니맵이 보이면(GAME-FIND-1) 작을 땐 그 아래로, 클 땐 그 왼쪽으로 비켜 선다(겹침 0)
  const layoutChips = () => { const r = MM && MM.rect(), top0 = r && !r.big ? r.top + r.h + 8 : 44, right = r && r.big ? r.right + r.w + 8 : 10; let k = 0;
    for (const [, c] of chips) { c.el.style.top = (top0 + k * 34) + 'px'; c.el.style.right = right + 'px'; k++; } };
  const hud = {
    toast: (text, sec = 2.2) => ui.toast(text, sec),
    banner(text, sec = 2.5) { if (!banEl) banEl = el('left:50%;top:38%;transform:translate(-50%,-50%);font-size:30px;font-weight:700;padding:14px 28px;display:none;pointer-events:none'); banEl.textContent = text; banEl.style.display = ''; banT = sec; return { remove() { banEl.style.display = 'none'; banT = 0; } }; },
    // opt.onClick(GAME-FIND-1): 칩을 누르면(터치·커서) — 키 안내 칩을 손가락으로도 쓰게
    chip(key, text, opt) { let c = chips.get(key); if (text == null) { if (c) { c.el.remove(); chips.delete(key); layoutChips(); } return null; }
      if (!c) { c = { el: el('right:10px;font-size:14px') }; chips.set(key, c); layoutChips(); } c.el.textContent = text;
      if (opt && opt.onClick) { c.el.style.cursor = 'pointer'; c.el.onclick = e => { e.stopPropagation(); try { opt.onClick(); } catch (err) { console.error(err); } }; }
      return { remove: () => hud.chip(key, null) }; },
    // 목표 줄(GAME-FIND-1): 가운데 위에 계속 떠 있는 한 줄("① 찾아갈 곳: 과학실") — null이면 숨김. 배너(가운데·잠깐)와 따로
    goal(text) { if (text == null) { if (goalEl) goalEl.style.display = 'none'; return null; }
      if (!goalEl) goalEl = el('left:50%;top:10px;transform:translateX(-50%);font-size:19px;font-weight:700;padding:7px 18px;border-radius:12px;pointer-events:none;white-space:nowrap;display:none');
      goalEl.textContent = text; goalEl.style.display = ''; return { remove: () => hud.goal(null) }; },
    // 보기 고르기(퀴즈 스테이션용) — 문항은 교사 승인 데이터만. 1~4 키도 받는다
    ask(title, choices, onHandle) {
      return new Promise(res => {
        document.exitPointerLock?.(); const was = CTRL.frozen; CTRL.frozen = true;
        const box = el('left:50%;top:50%;transform:translate(-50%,-50%);font-size:18px;padding:16px 20px;max-width:560px;max-height:90vh;overflow:auto;text-align:center');
        const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'font-weight:700;margin-bottom:12px;white-space:pre-line;line-height:1.45'; box.appendChild(h);   // 줄바꿈(\n) 허용(GAME-FIND-1 끝 화면)
        let hh = null;   // 범위 파사드의 정리 항목 — 답하면 같이 뗀다(다시 하기를 여러 번 해도 정리 목록이 쌓이지 않게 · GAME-FIND-1)
        const done = i => { removeEventListener('keydown', kd, true); box.remove(); CTRL.frozen = was; if (hh) hh.remove(); res(i); };
        const kd = e => { const n = Number(e.key); if (n >= 1 && n <= choices.length) { e.stopPropagation(); done(n - 1); } };
        choices.forEach((c, i) => { const b = document.createElement('button'); b.textContent = (i + 1) + '. ' + c; b.style.cssText = 'display:block;width:100%;min-height:44px;margin:6px 0;font-size:16px;border-radius:8px;border:0;cursor:pointer';
          b.addEventListener('click', ev => { ev.stopPropagation(); done(i); }); box.appendChild(b); });
        addEventListener('keydown', kd, true);
        if (onHandle) hh = onHandle({ remove: () => { if (box.isConnected) done(-1); } }) || null;   // 게임이 멈추면 창을 닫고 -1
      });
    },
  };

  // ---------- 9. 소품(mk) — 표식은 InstancedMesh 풀(표식이 몇 개든 드로우콜 +2) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
  let MK = null; const marks = [];
  function mkPool() {
    if (MK) return MK; const cap = 64;
    const dia = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), cap);
    const beam = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 10, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }), cap);
    for (const m of [dia, beam]) { m.count = 0; m.frustumCulled = false; m.visible = false; m.setColorAt(0, _c.set(0xffffff)); scene.add(m); }
    beam.renderOrder = 2; return (MK = { dia, beam, cap });
  }
  let mkT = 0;
  function mkTick(dt) {
    if (!marks.length) return; mkT += dt; const K = mkPool();
    for (let i = 0; i < marks.length; i++) { const m = marks[i];   // 매 프레임 — 새 객체 없이
      _m4.compose(_v.set(m.x, m.y + 1.1 + Math.sin(mkT * 2.4 + i) * 0.12, m.z), _q.setFromEuler(_e.set(0, mkT * 1.8 + i, 0)), _s.set(1, 1.35, 1)); K.dia.setMatrixAt(i, _m4);
      _m4.compose(_v.set(m.x, m.y + 0.06, m.z), _q.identity(), _s.set(1, m.beam ? 7 : 0.001, 1)); K.beam.setMatrixAt(i, _m4);
    }
    K.dia.instanceMatrix.needsUpdate = K.beam.instanceMatrix.needsUpdate = true;
  }
  function mkSync() { const K = mkPool(); K.dia.count = K.beam.count = marks.length; K.dia.visible = K.beam.visible = marks.length > 0;
    marks.forEach((m, i) => { K.dia.setColorAt(i, _c.set(m.color)); K.beam.setColorAt(i, _c.set(m.color)); });
    if (K.dia.instanceColor) K.dia.instanceColor.needsUpdate = true; if (K.beam.instanceColor) K.beam.instanceColor.needsUpdate = true; mkTick(0); }
  const MATS = new Map();
  const lam = (c, glow) => { const k = 'l' + c + (glow ? 'g' : ''); if (!MATS.has(k)) MATS.set(k, new THREE.MeshLambertMaterial(glow ? { color: c, emissive: c, emissiveIntensity: 0.45 } : { color: c })); return MATS.get(k); };
  // 별(GAME-FIND-1): 다섯 뿔 별 판(두께 0.12 · 36삼각형) — 세로로 서서 y축으로 돈다. 예전 'star'는 팔면체(다이아몬드)였다
  const starGeo = () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.4; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06); };
  const mk = {
    // 떠 있는 다이아몬드 + 빛기둥(조명 무시 — 밤에도 보인다). 월드 면에서 6cm 이상 띄운다(같은 평면 = 깜빡임)
    marker(x, y, z, o = {}) { if (marks.length >= mkPool().cap) { console.warn('[map] 표식 64개 초과'); return { remove() {}, set() {} }; }
      const m = { x, y, z, color: o.color ?? 0xffd23c, beam: o.beam !== false }; marks.push(m); mkSync();
      return { set(nx, ny, nz) { m.x = nx; m.y = ny; m.z = nz; }, color(c) { m.color = c; mkSync(); }, remove() { const i = marks.indexOf(m); if (i >= 0) { marks.splice(i, 1); mkSync(); } } }; },
    // 바닥 +6cm 리본(길 안내) — 한 메시
    trail(pts, o = {}) {
      const W = (o.width || 0.35) / 2, pos = [];
      for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * W, nz = dx / l * W, ya = a[1] + 0.06, yb = b[1] + 0.06;
        pos.push(a[0] + nx, ya, a[2] + nz, b[0] + nx, yb, b[2] + nz, b[0] - nx, yb, b[2] - nz, a[0] + nx, ya, a[2] + nz, b[0] - nx, yb, b[2] - nz, a[0] - nx, ya, a[2] - nz); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: o.color ?? 0x3cc8ff, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.renderOrder = 3; scene.add(m); return { obj: m, remove() { scene.remove(m); g.dispose(); m.material.dispose(); } };
    },
    // 같은 모양 여럿(공·고깔·별) — InstancedMesh 한 개 = 드로우콜 1
    many(kind, count, o = {}) {
      const geo = kind === 'cone' ? new THREE.ConeGeometry(0.28, 0.7, 12).translate(0, 0.35, 0) : kind === 'box' ? new THREE.BoxGeometry(0.5, 0.5, 0.5).translate(0, 0.25, 0)
        : kind === 'star' ? starGeo() : new THREE.IcosahedronGeometry(0.35, 1);
      const m = new THREE.InstancedMesh(geo, lam(o.color ?? 0xffffff, o.glow), count); m.frustumCulled = false; scene.add(m);   // o.glow = 스스로 빛남(밤에도 보인다)
      for (let i = 0; i < count; i++) m.setMatrixAt(i, _m4.makeScale(0, 0, 0));
      return { mesh: m, count, set(i, x, y, z, s = 1, ry = 0) { m.setMatrixAt(i, _m4.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s))); m.instanceMatrix.needsUpdate = true; },
        hide(i) { m.setMatrixAt(i, _m4.makeScale(0, 0, 0)); m.instanceMatrix.needsUpdate = true; }, setColor(i, c) { m.setColorAt(i, _c.set(c)); m.instanceColor.needsUpdate = true; },
        remove() { scene.remove(m); geo.dispose(); } };
    },
    add(obj) { scene.add(obj); return { obj, remove() { scene.remove(obj); } }; },
  };

  // ---------- 10. 길격자(nav) — 옵션별 캐시 · 게임은 nav()(나눠 빌드), 게이트·시험은 navSync() ----------
  const navCache = new Map();
  const navKey = o => o.jump ? 'jump:' + o.jump : 'walk';
  function postNav(N) {
    N.finish((x, y, z) => zoneIndex(x, y, z), inSchool);
    if (!N.jump) for (const p of POI.values()) {   // 서는 칸(물체 자체가 충돌인 표지점·상호작용 지점 포함)
      if (p.src === 'zone') { const zi = Z.findIndex(z => 'zone:' + z.id === p.id); let best = -1, bd = 1e18;
        const i0 = N.snap(p.x, p.y, p.z, 1.0); if (i0 >= 0 && N.zone[i0] === zi) best = i0;
        else for (let i = 0; i < N.count; i++) if (N.zone[i] === zi && N.canReturn[i]) { const d = (N.X(i) - Z[zi].cx) ** 2 + (N.Z(i) - Z[zi].cz) ** 2; if (d < bd) { bd = d; best = i; } }
        if (best >= 0) { p.stand = N.pos(best); p.node = best; } }
      else if (!p.stand) { const i = N.snap(p.x, p.y, p.z, Math.max(4, (p.r || 0) + 1), -1.6, 1.6); if (i >= 0) { p.stand = N.pos(i); p.node = i; } }
    }
    return facade(N);
  }
  // 게임이 받는 Nav — 대상 문자열 해석·구역 필터·막기를 얹은 얇은 겉
  function facade(N) {
    const node = (t, r = 1.5) => { if (typeof t === 'number') return t; const p = typeof t === 'string' ? POI.get(t) || (t.startsWith('zone:') && POI.get('zone:' + (zone(t.slice(5)) || {}).id)) : null;
      if (p && p.node != null) return p.node; const x = resolve(t); return x ? N.snap(x.x, x.y, x.z, r) : -1; };
    const zoneF = f => { const tagOK = Z.map(z => matchZone(z, f)); return i => N.zone[i] >= 0 ? tagOK[N.zone[i]] : !(f.kind || f.kinds || f.zones || f.tags || f.indoor || f.floor || f.bldg); };
    return {
      raw: N, count: N.count, traps: N.traps, S: N.S,
      snap: (x, y, z, r) => N.snap(x, y, z, r), node, pos: i => N.pos(i), zoneOf: i => (i >= 0 && N.zone[i] >= 0) ? Z[N.zone[i]] : null, inSchool: i => !!N.inSchool[i],
      // 경로: opt = { maxExp, forbidTags, avoidTags, avoidMul(4), allowOutside(false), smooth(true) }
      path(a, b, o = {}) { const ia = node(a), ib = node(b), bad = o.forbidTags ? i => { const z = N.zone[i]; return z >= 0 && o.forbidTags.some(t => Z[z].tags.includes(t)); } : null;
        const cost = o.avoidTags ? i => { const z = N.zone[i]; return (z >= 0 && o.avoidTags.some(t => Z[z].tags.includes(t))) ? (o.avoidMul || 4) : 1; } : null;
        return N.path(ia, ib, { ...o, bad, cost }); },
      // 무작위 칸: opt = { zones, kinds, tags, notTags(['staff']), indoor, floor, bldg, minClear(2칸), allowOutside, farFrom:[{x,z,r}], rng }
      random(o = {}) { const f = { notTags: ['staff'], ...o }, zf = zoneF(f), i = N.random({ ...o, filter: zf }); return i < 0 ? null : N.pos(i); },
      distField: (a, maxLen) => N.distField(node(a), maxLen),
      block(t) { if (typeof t === 'string') { const zi = Z.indexOf(zone(t)); return N.block(i => N.zone[i] === zi); } return N.block(t); },
      export: () => N.export(),
    };
  }
  function nav(o = {}) { const k = navKey(o); let c = navCache.get(k); if (!c) { const cc = {}; cc.p = NAV.buildSliced(q, o).then(N => (cc.done = postNav(N))); navCache.set(k, (c = cc)); } return c.done ? Promise.resolve(c.done) : c.p; }
  // fresh: 새로 짓고 캐시를 바꾼다(도달성 게이트 reach()가 매번 이렇게 — 월드가 바뀌었으면 게임도 새 격자를 받는다)
  function navSync(o = {}) { const k = navKey(o); let c = navCache.get(k); if (c && c.done && !o.fresh) return c.done; const N = NAV.buildSync(q, o); c = { done: postNav(N) }; c.p = Promise.resolve(c.done); navCache.set(k, c); return c.done; }

  // ---------- 11. 미니맵 데이터(벡터) + 그리기 도우미 ----------
  function mapData(floor = 1) {
    return { bounds: [NAV.RECT[0], NAV.RECT[1], NAV.RECT[2], NAV.RECT[3]], boundary: poly.map(p => p.slice()), buildings: BRECT.map(b => ({ ...b })),
      zones: Z.filter(z => z.floor === floor || (floor === 2 && z.floor === 1 && !z.indoor)).map(z => ({ id: z.id, label: z.label, kind: z.kind, floor: z.floor, indoor: z.indoor, x0: z.x0, x1: z.x1, z0: z.z0, z1: z.z1, area: z.area })),
      landmarks: pois({ src: 'landmark' }).map(p => ({ id: p.id, label: p.label, x: p.x, z: p.z })), spawns: pois({ src: 'spawn' }).map(p => ({ id: p.id, label: p.label, x: p.x, z: p.z, floor: p.floor })) };
  }
  const KCOL = { field: '#e6d6ab', path: '#dcd3c2', yard: '#c6d8ae', play: '#ecd08f', garden: '#c29a64', stair: '#e4d8bf', corridor: '#e4d8bf', hall: '#e4d8bf', stage: '#e9dcc0' };
  // ctx = 2D 캔버스 · o = { floor, scale(px/m), x0, z0(왼쪽 위 월드 좌표), labels, player, marks:[{x,z,color}] }
  function drawMap(ctx, o = {}) {
    const D = mapData(o.floor || 1), s = o.scale || 4, ox = o.x0 ?? D.bounds[0], oz = o.z0 ?? D.bounds[1], X = x => (x - ox) * s, Y = z => (z - oz) * s;
    ctx.save(); ctx.fillStyle = '#d5dccb'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath(); D.boundary.forEach(([x, z], k) => k ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))); ctx.closePath(); ctx.fillStyle = '#a9cd8c'; ctx.fill(); ctx.strokeStyle = '#5d7a4a'; ctx.lineWidth = 1.5; ctx.stroke();
    const zs = D.zones.slice().sort((a, b) => b.area - a.area);
    for (const z of zs) if (!z.indoor) { ctx.fillStyle = KCOL[z.kind] || '#c6d8ae'; ctx.fillRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); }
    ctx.fillStyle = '#efe6d2'; ctx.strokeStyle = '#7d6c55'; ctx.lineWidth = 1;
    for (const b of D.buildings) { ctx.fillRect(X(b.x0), Y(b.z0), (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); ctx.strokeRect(X(b.x0), Y(b.z0), (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); }
    for (const z of zs) if (z.indoor) { ctx.fillStyle = ['corridor', 'hall', 'stair'].includes(z.kind) ? '#e4d8bf' : '#f4ecda'; ctx.fillRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); ctx.strokeRect(X(z.x0), Y(z.z0), (z.x1 - z.x0) * s, (z.z1 - z.z0) * s); }
    if (o.labels !== false) { ctx.fillStyle = '#3a3226'; ctx.font = Math.max(9, Math.min(14, s * 2.6)) + 'px sans-serif'; ctx.textAlign = 'center'; const used = [];
      for (const z of zs.slice().reverse()) { const cx = X((z.x0 + z.x1) / 2), cy = Y((z.z0 + z.z1) / 2), w = ctx.measureText(z.label).width;
        if ((z.x1 - z.x0) * s < w * 0.6 || used.some(u => Math.abs(u[0] - cx) < (u[2] + w) / 2 && Math.abs(u[1] - cy) < 12)) continue; used.push([cx, cy, w]); ctx.fillText(z.label, cx, cy + 4); } }
    for (const m of o.marks || []) { ctx.fillStyle = m.color || '#e0503c'; ctx.beginPath(); ctx.arc(X(m.x), Y(m.z), m.r || 5, 0, 7); ctx.fill(); }
    if (o.player !== false) { const h = -pl.getYaw(); ctx.translate(X(P.x), Y(P.z)); ctx.rotate(h); ctx.fillStyle = '#2f6fd0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore(); return D;
  }
  // 디버그: 3m 칸 ASCII — '#' 학교 안인데 구역 없음 · '.' 구역 있음 · 'o' 학교 밖 · ' ' 걸을 칸 없음
  function coverage(cell = 3) {
    const N = navSync().raw, W = Math.ceil((NAV.RECT[2] - NAV.RECT[0]) / cell), H = Math.ceil((NAV.RECT[3] - NAV.RECT[1]) / cell), g = new Uint8Array(W * H);
    for (let i = 0; i < N.count; i++) { const cx = Math.floor((N.X(i) - NAV.RECT[0]) / cell), cz = Math.floor((N.Z(i) - NAV.RECT[1]) / cell), k = cz * W + cx, v = !N.inSchool[i] ? 1 : N.zone[i] < 0 ? 3 : 2; if (v > g[k]) g[k] = v; }
    const rows = []; for (let r = 0; r < H; r++) { let s = ''; for (let c = 0; c < W; c++) s += ' o.#'[g[r * W + c]]; rows.push(s); }
    return rows.join('\n');
  }

  // ---------- 11b. 미니맵(GAME-FIND-1 · 09-26) — 모든 게임 공용. 정적 층은 한 번만 굽고 화살표·표식만 덧그린다(minimap.js) ----------
  //   map.minimap.show({big, marks}) → {remove} · hide() · setMarks([{x,z,color,shape:'dot'|'ring'|'star',label,blink,floor,r}]) · toggle(big?) · visible · big · ms(한 프레임 평균)
  //   게임 범위 파사드에서 쓰면 stop 때 자동으로 숨고 표식도 비운다. M키·지도 클릭 = 크게(학교 전체)/작게(반경 40m).
  MM = createMinimap({ mapData, drawMap, P, getYaw: pl.getYaw, onLayout: () => layoutChips() });
  const minimap = { show: o => MM.show(o), hide: () => MM.hide(), setMarks: m => MM.setMarks(m), toggle: v => MM.toggle(v),
    get visible() { return MM.visible; }, get big() { return MM.big; }, get marks() { return MM.marks; }, get ms() { return MM.ms; }, get el() { return MM.el; } };
  // 효과음(GAME-FIND-1): main.js 합성음 도우미 tone(주파수, 시작초, 길이, 파형, 크기, 끝주파수)을 host.ui.tone으로 받아 쓴다(없으면 조용히). 파일 없음·짧게
  const SFX = { ding: [[988, 0, 0.16, 'sine', 0.2], [1319, 0.1, 0.32, 'sine', 0.18]], tick: [[660, 0, 0.09, 'triangle', 0.14]], go: [[523, 0, 0.12, 'triangle', 0.2], [784, 0.11, 0.28, 'triangle', 0.2]],
    done: [[523, 0, 0.14, 'triangle', 0.2], [659, 0.13, 0.14, 'triangle', 0.2], [784, 0.26, 0.14, 'triangle', 0.2], [1047, 0.39, 0.45, 'triangle', 0.22]],
    pick: [[1175, 0, 0.09, 'sine', 0.16], [1568, 0.06, 0.18, 'sine', 0.15]], buzz: [[196, 0, 0.3, 'square', 0.05, 150]],
    warm: [[440, 0, 0.02, 'sine', 0.0001]] };   // warm = 들리지 않는 소리 — 소리 장치(AudioContext) 만들기(첫 생성 ≈100ms)를 게임 준비 중에 미리(3·2·1 도중 멈칫 방지)
  const sfx = k => { const T = ui.tone, s = SFX[k]; if (!T || !s) return; for (const a of s) T(...a); };

  // ---------- 12. 도구 ----------
  const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = typeof seed === 'number' ? seed >>> 0 : fnv(String(seed)); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pend = new Map(); let storeT = 0;
  const store = ns => ({
    get(k, d = null) { try { const v = pend.has(ns + k) ? pend.get(ns + k) : localStorage.getItem(ns + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { pend.set(ns + k, JSON.stringify(v)); },   // 쓰기는 2초에 한 번 몰아서(CLAUDE.md 성능 예산)
  });
  const flushStore = () => { if (!pend.size) return; try { for (const [k, v] of pend) localStorage.setItem(k, v); } catch (e) { /* 비공개 창 등 — 무시 */ } pend.clear(); };

  // ---------- 13. 게임 로더 · 범위 파사드(scope) ----------
  // 게임 모듈: export const meta = { id, title, api: 1 } · export default async function start(map, params) → { tick(dt), stop() }
  //   map = scope(id) — 게임이 만든 자원(이벤트·지점·트리거·충돌·표식·HUD·막기·경계·멈춤)을 기록했다가 stop 때 한꺼번에 정리
  const game = { current: null, ms: 0, msN: 0, msT: 0 };
  async function loadGame(id, params = {}) {
    if (!/^[a-z_][a-z0-9_-]{0,31}$/.test(id || '')) { hud.toast('게임 이름이 올바르지 않아요'); return null; }   // GAME-FIND-1: 가운데 밑줄 허용(find_place) — 점·빗금은 여전히 막힘
    if (game.current) stopGame('replace');
    try {
      const reg = await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url));
      const ent = reg.GAMES && reg.GAMES[id]; if (!ent) { hud.toast('없는 게임이에요: ' + id); return null; }
      const mod = await import(new URL('../games/' + id + '.js?v=' + (ent.v || 1), import.meta.url));
      if (!mod.meta || mod.meta.api !== MAP.version) { hud.toast('게임 버전이 지도와 맞지 않아요'); return null; }
      const sc = scope(id); sc.arena.set('school');   // 게임 중에는 학교 경계 밖으로 못 나감(기본)
      const cur = { id, meta: mod.meta, scope: sc, handle: null }; game.current = cur;
      cur.handle = (await mod.default(sc, params)) || {};
      if (game.current !== cur) return null;
      emit('gamestart', { id }); return cur;
    } catch (e) { console.error('[map] 게임 시작 실패', e); stopGame('error'); hud.toast('게임에 문제가 생겨 멈췄어요'); return null; }
  }
  function stopGame(reason = 'stop') {
    const cur = game.current; if (!cur) return; game.current = null;
    try { cur.handle && cur.handle.stop && cur.handle.stop(reason); } catch (e) { console.error('[map] 게임 stop 오류', e); }
    cur.scope.dispose(); emit('gamestop', { id: cur.id, reason });
  }
  function scope(owner) {
    // GAME-FIND-1: 게임이 스스로 뗀 항목(도착한 표식·끈 리본·답한 창)은 정리 목록에서도 빠진다 — '다시 하기'를 몇 번 해도 목록이 쌓이지 않게
    const res = new Set(), track = h => { if (h && h.remove) { const r0 = h.remove; h.remove = function () { res.delete(h); return r0.apply(this, arguments); }; res.add(h); } return h; };
    const S = facadeApi(track, owner);
    S.dispose = () => { for (const h of [...res].reverse()) { try { h.remove(); } catch (e) { console.error(e); } } res.clear(); CTRL.frozen = false; CTRL.speed = 1; if (arena.shape) arena.shape = null; };
    S.quit = () => { const c = game.current; if (c && c.scope === S) stopGame('quit'); };   // 게임이 스스로 끝낼 때(끝 화면 [그만하기])
    Object.defineProperty(S, 'tracked', { get: () => res.size });
    return S;
  }
  // 놀이 고르기 칩(GAME-FIND-1) — 오른쪽 아래 '🎮 놀이' → 목록 → load · 게임 중엔 '⏹ 그만하기'(gamepick.js)
  const PICK = createGamePicker({ load: id => loadGame(id, {}), stop: () => stopGame('button'), current: () => game.current });

  // ---------- 14. 틱(main 루프 · SD2.step) ----------
  const zs = { cur: null, pend: null, n: 0 }; let slowT = 0, tSec = 0;
  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], stuck = { from: null, t: 0, last: -9 }, stuckLog = [];
  // 끼였을 때 가장 가까운 걷는 칸(3m 안)으로 — 게임의 'R: 처음 자리로' 대신 쓸 수도 있다
  function unstick() { const N = navSync().raw, i = N.snap(P.x, P.y, P.z, 3, -1.6, 1.6); if (i < 0) return false; return player.teleport([N.X(i), N.y[i], N.Z(i)]); }
  function tick(dt) {
    tSec += dt; mkTick(dt); MM.tick(dt);
    if (banT > 0 && (banT -= dt) <= 0 && banEl) banEl.style.display = 'none';
    if ((slowT += dt) >= 0.1) { slowT = 0; tick10(); }
    if ((storeT += dt) >= 2) { storeT = 0; flushStore(); }
    const cur = game.current;
    if (cur && cur.handle && cur.handle.tick) {
      const t0 = performance.now();
      try { cur.handle.tick(dt); } catch (e) { console.error('[map] 게임 tick 오류', e); stopGame('error'); hud.toast('게임에 문제가 생겨 멈췄어요'); }
      game.ms += performance.now() - t0; game.msN++;
      if ((game.msT += dt) >= 2) { const avg = game.ms / Math.max(1, game.msN); if (avg > 1) console.warn('게임 예산 초과: tick 평균 ' + avg.toFixed(2) + 'ms'); game.last = avg; game.ms = game.msN = game.msT = 0; }
    }
    emitTick(dt);
  }
  const tickEv = { dt: 0 };
  const emitTick = dt => { const s = L.get('tick'); if (!s || !s.size) return; tickEv.dt = dt;   // 매 프레임 — 배열 복사 없이
    for (const fn of s) { try { fn(tickEv); } catch (e) { console.error('[map] 이벤트 처리 중 오류(tick)', e); } } };
  function tick10() {
    PICK.sync();   // 놀이 칩 글자(게임 중 ⏹ 그만하기)
    // 구역 들어감/나감: 새 후보가 2샘플 연속이면 확정 · 지금 구역 경계 0.25m 안이고 후보가 더 넓으면 머문다(문턱 깜빡임 방지)
    let cand = zoneAt(P.x, P.y, P.z); const cur = zs.cur;
    if (cand !== cur && cur && (!cand || cand.area > cur.area) && P.x > cur.x0 - 0.25 && P.x < cur.x1 + 0.25 && P.z > cur.z0 - 0.25 && P.z < cur.z1 + 0.25 && P.y >= cur.y0 && P.y < cur.y1) cand = cur;
    if (cand === cur) zs.n = 0;
    else if (cand === zs.pend) { if (++zs.n >= 2) { zs.cur = cand; zs.n = 0; zs.pend = null; emit('zone', { prev: cur, next: cand }); } }
    else { zs.pend = cand; zs.n = 1; }
    for (const t of TRIG) { const inn = trigIn(t.shape);
      if (inn && !t.inside) { t.inside = true; if (t.cb.enter) { try { t.cb.enter(t.shape); } catch (e) { console.error(e); } } if (t.cb.once) TRIG.delete(t); }
      else if (!inn && t.inside) { t.inside = false; if (t.cb.exit) { try { t.cb.exit(t.shape); } catch (e) { console.error(e); } } } }
    // 끼임 기록(게임·수업 크래시 대응): 이동키를 누른 채 1.5초 동안 0.05m도 못 움직이고 몸이 충돌 상자 속이면 남긴다(최대 50·2초 간격)
    if (pl.keys) { let mv = false; for (const k of MOVE_KEYS) if (pl.keys.has(k)) { mv = true; break; }
      if (mv && !pl.ACT.anim && !pl.ACT.sit) { if (!stuck.from) { stuck.from = [P.x, P.z]; stuck.t = 0; } stuck.t += 0.1;
        if (Math.hypot(P.x - stuck.from[0], P.z - stuck.from[1]) > 0.05) { stuck.from = [P.x, P.z]; stuck.t = 0; }
        else if (stuck.t >= 1.5 && tSec - stuck.last > 2 && q.blockedAt(P.x, P.z, P.y)) { stuck.last = tSec; stuck.t = 0; if (stuckLog.length < 50) stuckLog.push([+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2), +tSec.toFixed(1)]); emit('stuck', { x: P.x, y: P.y, z: P.z }); } }
      else stuck.from = null; }
    if (arena.shape) {
      const ok = inArena(P.x, P.z) && P.y > -4 && P.y < 12;
      if (ok) { arena.out = 0; if (P.ground && (arena.safeT += 0.1) >= 0.5) { arena.safeT = 0; arena.safe = [P.x, P.y, P.z]; } }
      else if ((arena.out += 0.1) > 0.25) { arena.out = 0; player.teleport(arena.safe || 'spawn:default'); hud.toast('학교 밖으로는 나갈 수 없어요'); }
    }
  }

  // ---------- 15. 지도 계약 검사(게이트) ----------
  function check(o = {}) {
    const NV = navSync(), N = NV.raw, S = N.S, out = { zonesNoMeta: warn.zonesNoMeta.slice(), metaNoZone: warn.metaNoZone.slice(), dupIds: warn.dupIds.slice(), extraBad: [], spawnsBad: [], poisBad: [], hotUnreachable: [], traps: N.traps };
    const zcnt = new Int32Array(Z.length); let ins = 0, noz = 0, outN = 0;
    for (let i = 0; i < N.count; i++) { if (N.zone[i] >= 0) zcnt[N.zone[i]]++; if (N.inSchool[i]) { ins++; if (N.zone[i] < 0) noz++; } else outN++; }
    Z.forEach((z, i) => { if (z.extra && !zcnt[i]) out.extraBad.push(z.id); if (!zcnt[i]) out.poisBad.push('zone:' + z.id + '(칸 0)'); });
    for (const p of pois({ src: 'spawn' })) { const i = N.snap(p.x, p.y, p.z, 0.5); if (i < 0 || !N.inSchool[i] || q.blockedAt(p.x, p.z, p.y)) out.spawnsBad.push(p.id); }
    for (const p of pois({ src: 'landmark' })) if (!p.stand) out.poisBad.push(p.id + '(설 칸 없음)');
    // 라벨로 부르면 계약 id 구역 · 같은 라벨 월드 구역 중 가장 넓은 것(게임이 '운동장'을 부르면 본 운동장 — 09-26 리뷰)
    out.labelBad = []; for (const [lab, m] of Object.entries(META.ZONE_META)) { const W = Z.filter(o => o.label === lab && !o.extra); if (!W.length) continue;   // 월드에 없는 표 줄은 metaNoZone이 알린다
      const z = zone(lab); if (!z || z.id !== m.id || W.some(o => o.area > z.area)) out.labelBad.push(lab + '→' + (z ? z.id : null)); }
    for (const h of HOT) { if (h.off || h.kind === 'game') continue; const i = N.snap(h.x, h.y, h.z, h.r + S / 2, -1.6, 1.6); if (i < 0) out.hotUnreachable.push([h.id, h.label, +h.x.toFixed(2), +h.z.toFixed(2)]); }
    // 운동장 놀이판: 트랙 타원(폭 ±half)·출발선이 전부 걷는 칸인가(골대·놀이기구가 들어오면 알린다)
    out.playBad = []; { const T9 = META.PLAY.track, y9 = META.PLAY.y, bad9 = (x, z) => { const i = N.snap(x, y9, z, S * 0.8, -0.3, 0.3); if (i < 0) out.playBad.push([+x.toFixed(1), +z.toFixed(1)]); };
      const n9 = Math.ceil(2 * Math.PI * Math.max(T9.a, T9.b) / 1.0); for (let k = 0; k < n9; k++) { const t9 = k / n9 * Math.PI * 2; for (const o9 of [-T9.half, 0, T9.half]) bad9(T9.c[0] + Math.cos(t9) * (T9.a + o9), T9.c[1] + Math.sin(t9) * (T9.b + o9)); }
      for (let x9 = META.PLAY.field.x[0] + 4; x9 < META.PLAY.field.x[1] - 4; x9 += 1) bad9(x9, META.PLAY.redlight.startZ); }
    out.outsidePct = +(100 * outN / N.count).toFixed(1); out.noZoneInSchoolPct = +(100 * noz / Math.max(1, ins)).toFixed(1); out.cells = N.count;
    out.ok = !out.dupIds.length && !out.labelBad.length && !out.extraBad.length && !out.spawnsBad.length && !out.poisBad.length && !out.hotUnreachable.length && !out.playBad.length && !out.traps && out.noZoneInSchoolPct <= 5;
    if (o.log !== false) {
      const bad = ['dupIds', 'labelBad', 'extraBad', 'spawnsBad', 'poisBad', 'hotUnreachable', 'playBad'].filter(k => out[k].length).map(k => k + ' ' + JSON.stringify(out[k].slice(0, 4)));
      if (out.traps) bad.push('갇힘 칸 ' + out.traps); if (out.noZoneInSchoolPct > 5) bad.push('구역 없는 칸 ' + out.noZoneInSchoolPct + '%');
      if (bad.length) console.error('🚫 지도 계약 ' + bad.length + '건: ' + bad.join(' · '));
      else console.log('✅ 지도 계약 0 (구역 ' + Z.length + ' · 지점 ' + POI.size + ' · 구역 없는 칸 ' + out.noZoneInSchoolPct + '% · 학교 밖 칸 ' + out.outsidePct + '%)');
      if (out.zonesNoMeta.length || out.metaNoZone.length) console.warn('⚠️ 지도 계약표(mapmeta.js) 손볼 것 — 표에 없는 구역: ' + JSON.stringify(out.zonesNoMeta) + ' · 월드에 없는 표 항목: ' + JSON.stringify(out.metaNoZone));
    }
    return out;
  }

  // ---------- 조립(무추적 MAP + scope마다 추적판) ----------
  function facadeApi(track, owner) {
    const t = track || (h => h), hudKeys = new Set();
    return {
      version: 1, owner: owner || null,
      zones: Z, zone, zoneAt, zonesWhere, inZone, q: Q, poi, pois, resolve, findEntry,
      on: (type, fn) => { const h = t({ remove: on(type, fn) }); return () => h.remove(); },   // 돌려준 off를 부르면 정리 목록에서도 빠진다(GAME-FIND-1)
      once(type, fn) { let h = null; const off = on(type, ev => { h.remove(); fn(ev); }); h = t({ remove: off }); return () => h.remove(); },
      player,
      interact: { add: o => t(interact.add({ ...o, owner: owner || o.owner })), enable: (f, v) => t(interact.enable(f, v)), list: interact.list },
      trigger: { add: (s, cb) => t(trigger.add(s, cb)) },
      collider: { add: (b, o) => t(collider.add(b, o)) },
      arena: { set: s => t(arenaApi.set(s)), get: arenaApi.get },
      // HUD는 같은 키를 여러 번 갱신해도 정리 항목이 한 번만 쌓이게(매 프레임 chip 갱신 → 메모리 증가 방지)
      hud: { toast: hud.toast, banner: (x, s) => { const h = hud.banner(x, s); if (track && !hudKeys.has('!banner')) { hudKeys.add('!banner'); t({ remove: () => { if (banEl) banEl.style.display = 'none'; banT = 0; } }); } return h; },
        chip: (k, x, o) => { const h = hud.chip(k, x, o); if (track && x != null && !hudKeys.has(k)) { hudKeys.add(k); t({ remove: () => { hud.chip(k, null); hudKeys.delete(k); } }); } return h; },
        goal: x => { const h = hud.goal(x); if (track && x != null && !hudKeys.has('!goal')) { hudKeys.add('!goal'); t({ remove: () => { hud.goal(null); hudKeys.delete('!goal'); } }); } return h; },
        ask: (ti, ch) => hud.ask(ti, ch, h => t(h)) },
      // 미니맵(GAME-FIND-1): 범위 파사드에선 stop 때 자동으로 숨고 표식을 비운다(보이기·표식 정리 항목은 한 번만 쌓임)
      minimap: { show: o => { const h = minimap.show(o); if (track && !hudKeys.has('!mm')) { hudKeys.add('!mm'); t({ remove: () => { minimap.setMarks([]); minimap.hide(); hudKeys.delete('!mm'); } }); } return h; },
        hide: () => minimap.hide(), setMarks: m => { minimap.setMarks(m); if (track && !hudKeys.has('!mm')) { hudKeys.add('!mm'); t({ remove: () => { minimap.setMarks([]); minimap.hide(); hudKeys.delete('!mm'); } }); } },
        toggle: v => minimap.toggle(v), get visible() { return minimap.visible; }, get big() { return minimap.big; }, get ms() { return minimap.ms; }, get marks() { return minimap.marks; }, get el() { return minimap.el; } },
      sfx: k => sfx(k),   // 짧은 합성 효과음: 'ding'(도착) · 'tick'(3·2·1) · 'go'(출발) · 'done'(끝) · 'pick'(줍기) · 'buzz'(시간 끝) · 'warm'(준비 — 소리 장치만 미리 만듦)
      mk: { marker: (x, y, z, o) => t(mk.marker(x, y, z, o)), trail: (p, o) => t(mk.trail(p, o)), many: (k, n, o) => t(mk.many(k, n, o)), add: obj => t(mk.add(obj)) },
      add: obj => t(mk.add(obj)), remove: obj => scene.remove(obj),
      nav: o => nav(o).then(NV => track ? { ...NV, block: x => t(NV.block(x)) } : NV), navSync,
      mapData, drawMap, coverage, rng, store: store('sm2.game.' + (owner || 'map') + '.'), play: META.PLAY, spawns: META.SPAWNS,
      three: THREE,
    };
  }
  const MAP = facadeApi(null, null);
  Object.assign(MAP, { emit, tick, check, scope, stuckLog, unstick, game: { load: loadGame, stop: stopGame, get current() { return game.current; }, get lastMs() { return game.last || 0; } }, warn, entryBad, BRECT, inSchool, zoneIndex });
  // 시험용 세기(GAME-FIND-1 수용 시험): 게임을 켰다 끄거나 '다시 하기' 뒤 이벤트·트리거·표식·칩·지점·장면 물체 수가 처음과 같은가
  MAP.stats = () => { let lis = 0; for (const [, s] of L) lis += s.size; const cur = game.current;
    return { listeners: lis, trig: TRIG.size, marks: marks.length, chips: chips.size, hot: HOT.length, pois: POI.size, colliders: world.colliders.length, scene: scene.children.length,
      minimap: MM.visible, mmMarks: MM.marks.length, goal: !!(goalEl && goalEl.style.display !== 'none'), arena: !!arena.shape, frozen: CTRL.frozen, speed: CTRL.speed,
      game: cur ? cur.id : null, tracked: cur ? cur.scope.tracked : 0, pick: PICK.el.textContent }; };
  MAP.picker = PICK;
  return MAP;
}
