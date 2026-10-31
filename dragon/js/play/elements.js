// 원소 엔진(design §3-2) — 칸 표(지붕·수레·풀·배·가죽·가스 · 꼬리표 비트) + 이웃 표(지을 때 한 번) · 규칙은 5Hz · 이펙트는 규칙의 결과로만
// 1장(습격의 밤 · 지붕 불·물통 줄)에서 처음 씀 · 10장(불난 배 · 가스 + 불꽃 = 펑 · 김 가림막 · 상승 기류)도 같은 엔진을 쓴다
//
// ── 쓰는 법(장 팀이 읽는 문서) ─────────────────────────────────────────────────────────────
//   import { createElements, TAG } from '../play/elements.js?v=18';
//   const E = createElements({ group: G.place.group, wind: { x: 1, z: 0, speed: 1 } });   // group 없으면 그림 없이 규칙만
//   const id = E.add({ kind: 'roof', x, y, z, r: 1.6, house: 2 });   // 칸 하나 — kind = KIND 표의 이름 · house = 같은 집 묶음(덤) · give: 0 = 남에게 안 옮김(길 막는 수레)
//   E.link();                          // 이웃 표(한 번 · 그 뒤에 add 해도 그 칸만 이어 붙음)
//   E.ignite(id) · E.igniteAt(x, y, z, r)   // 불씨(드래곤 불 뿜기가 닿은 자리 = 원인)
//   E.water(x, y, z, r)  → { hit, out, steam }   // 물(물통·물 드래곤) — 꺼짐 + 김 + 젖음 10초(젖은 칸은 안 붙음)
//   E.gas(x, y, z, r, sec) → id        // 가스 구름(지플백 가스 머리) — 불꽃·타는 칸이 닿으면 펑(둘레 마른 칸에 불)
//   E.spark(x, y, z, r)                // 불티(지플백 불꽃 머리 · 쇠 부딪힘) — 가스면 펑 · 마른 칸은 달아오름
//   E.remove(id)                       // 떼어냄(갈고리로 판 끌어내리기 = 불길 끊기 · 그 칸은 더 안 탐)
//   E.move(id, x, y, z)                // 움직이는 칸(날아가는 가죽 꼬리날개 · 떠가는 배 · 흐르는 가스) — 이웃 표는 처음 자리 기준
//   E.step(dt)                         // 걸음마다(규칙은 0.2초마다 · 파티클은 걸음마다)
//   E.draw(camPos)                     // 그리기마다(가까운 타는 칸 여섯만 불꽃·빛 판 — 나머지는 지붕 발광색)
//   E.updrafts()  → [{ x, y, z, r, power }]   // 불 × 공기 = 상승 기류(비행 엔진이 읽음 · 불난 지붕·배·굴뚝)
//   E.steams()    → [{ x, y, z, r, t }]       // 김 구름(10장 김 가림막 · 숨기 판정)
//   E.fireNear(x, z, r) → 0~1          // 둘레 가장 센 불(마음 엔진: 불 = 두려움↑ · 걷기: 뜨거워 못 감)
//   E.on('ignite'|'out'|'burnt'|'boom'|'steam'|'catch', fn)   // 사건(소리·말·기록은 장이 붙임)
//   E.cells                            // 칸 배열(읽기 · state 0 멀쩡 1 탐 2 다 탐 3 떼어냄 · heat 0~1 달아오름 · fire 0~1 · wet 초 · fuel)
//   E.setWind(x, z, speed) · E.setRain(0~1)   // 날씨 → 원소(비 = 덜 번짐 · 바람 = 번짐 방향)
//   E.opt = { spread, reach, fall, bucket, wetSec }  // 손맛 값(만들 때 opt로 · reach·fall은 이웃 표를 짓기 전에)
//   E.dispose()
// ───────────────────────────────────────────────────────────────────────────────────────────────
// 규칙(r2 F-1 + 우리 것): 불 → 바람 아래로 번짐 · 물 → 꺼짐 + 김 + 젖음 · 가스 + 불꽃 = 펑 · 젖은 칸은 안 붙음 · 다 타면 그을음(결과가 남음) · 불 × 공기 = 상승 기류
// 매 걸음 new X(파티클·목록은 처음에 한 번) · 전체 순회는 5Hz 규칙 안에서만(칸 ≤ 수백) · 쏜 물·불은 8m 격자로 찾음 · Light 추가 X
import * as THREE from 'three';
import { flameMesh, glowSprite } from '../look/kit.js?v=18';
import { getSfx } from '../core/sfx.js?v=18';

/* 꼬리표 비트 — 한 칸이 여럿을 가질 수 있음 */
export const TAG = { FUEL: 1, WET: 2, GAS: 4, ROOF: 8, CLOTH: 16, STONE: 32, LOOSE: 64 };   // LOOSE = 갈고리로 떼어낼 수 있음
/* 칸 종류 — fuel 탈 거리(초 · 불 1일 때) · grow 불이 커지는 빠르기(1/초) · catch 옮겨붙기 쉬움 · give 남에게 옮기는 힘 · flame 불꽃 크기 · up 상승 기류 세기 */
export const KIND = {
  roof:  { tags: TAG.FUEL | TAG.ROOF | TAG.LOOSE, fuel: 34, grow: 0.075, catch: 1.0, give: 1.0, flame: 1.5, up: 1.0 },
  cart:  { tags: TAG.FUEL, fuel: 80, grow: 0.16, catch: 0.7, give: 0.5, flame: 1.25, up: 0.6 },
  hay:   { tags: TAG.FUEL, fuel: 14, grow: 0.3, catch: 1.7, give: 1.3, flame: 1.1, up: 0.5 },
  deck:  { tags: TAG.FUEL, fuel: 90, grow: 0.09, catch: 0.8, give: 0.9, flame: 1.9, up: 1.6 },   // 배 갑판(10장)
  cloth: { tags: TAG.FUEL | TAG.CLOTH, fuel: 5, grow: 0.6, catch: 2.2, give: 0.4, flame: 0.6, up: 0.2 },   // 돛·가죽 꼬리날개
  chimney: { tags: 0, fuel: 1e9, grow: 0, catch: 0, give: 0, flame: 0, up: 0.8 },        // 굴뚝 = 늘 따뜻한 공기(타지 않음)
  gas:   { tags: TAG.GAS, life: 7 },
};
const CELL8 = 8, MAXC = 256, SLOTS = 6;

export function createElements(o = {}) {
  const group = o.group || null;
  const E = {
    cells: [], wind: { x: 1, z: 0, speed: 0.8 }, rain: 0, t: 0,
    opt: Object.assign({ spread: 0.3, reach: 18, fall: 5, bucket: 0.75, wetSec: 10, cool: 0.05 }, o.opt || {}),   // fall = 이웃 무게가 반이 되는 거리(m)
  };
  const L = {};
  E.on = (ev, fn) => { (L[ev] = L[ev] || []).push(fn); return E; };
  const emit = (ev, a) => { const f = L[ev]; if (f) for (let i = 0; i < f.length; i++) f[i](a); };
  E.setWind = (x, z, speed = 1) => { const d = Math.hypot(x, z) || 1; E.wind.x = x / d; E.wind.z = z / d; E.wind.speed = speed; };
  if (o.wind) E.setWind(o.wind.x, o.wind.z, o.wind.speed ?? 1);
  E.setRain = (k) => { E.rain = Math.max(0, Math.min(1, k)); };

  /* 8m 격자(쏜 물·불·불티는 둘레 3×3 칸만 봄) */
  const grid = new Map(), gk = (x, z) => (Math.floor(x / CELL8) + 2048) * 4096 + (Math.floor(z / CELL8) + 2048);
  const gAdd = (c) => { const k = gk(c.x, c.z); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(c.id); };
  const _near = [];
  function near(x, z, r) {                                       // 둘레 칸 id(재사용 배열 — 받은 쪽이 바로 씀)
    _near.length = 0; const n = Math.ceil(r / CELL8);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const a = grid.get(gk(x + i * CELL8, z + j * CELL8)); if (a) for (let q = 0; q < a.length; q++) _near.push(a[q]); }
    return _near;
  }

  /* 칸 더하기 · 이웃 표 */
  let linked = false;
  E.add = (c) => {
    if (E.cells.length >= MAXC) return -1;
    const K = KIND[c.kind] || KIND.roof;
    const cell = { id: E.cells.length, kind: c.kind || 'roof', K, x: c.x, y: c.y || 0, z: c.z, r: c.r || 1.5, tags: c.tags ?? K.tags, house: c.house ?? -1, user: c.user || null, give: c.give ?? K.give,
      state: 0, heat: 0, fire: 0, fuel: c.fuel ?? K.fuel, wet: 0, life: c.life ?? K.life ?? 0, nb: [], nw: [], nx: [], nz: [], inHeat: 0, smokeT: 0, burnT: 0, vis: -1 };
    E.cells.push(cell); gAdd(cell);
    if (linked) linkOne(cell);
    return cell.id;
  };
  function linkOne(a) {                                          // a와 다른 칸 모두 → 거리 안이면 서로 이웃(가중치 = 가까울수록 큼)
    if (a.tags & TAG.GAS) return;
    for (const b of E.cells) {
      if (b === a || (b.tags & TAG.GAS)) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 0.01, dy = Math.abs(b.y - a.y);
      if (d > E.opt.reach || dy > 8) continue;
      const f = E.opt.fall, w = 1 / (1 + (d / f) * (d / f)) * (a.house >= 0 && a.house === b.house ? 1.6 : 1);
      a.nb.push(b.id); a.nw.push(w); a.nx.push(dx / d); a.nz.push(dz / d);
      b.nb.push(a.id); b.nw.push(w); b.nx.push(-dx / d); b.nz.push(-dz / d);
    }
  }
  E.link = () => { if (linked) return E; for (const c of E.cells) { c.nb.length = c.nw.length = c.nx.length = c.nz.length = 0; } linked = true; const all = E.cells.slice(); E.cells.length = 0; grid.clear(); for (const c of all) { c.id = E.cells.length; E.cells.push(c); gAdd(c); linkOne(c); } return E; };

  /* 불씨 · 물 · 가스 · 불티 · 떼어냄 */
  E.ignite = (id, f = 0.3) => {
    const c = E.cells[id]; if (!c || c.state !== 0 || !(c.tags & TAG.FUEL)) return false;
    if (c.wet > 0) { c.heat = 0; emit('steam', c); puff(STEAM, c.x, c.y + 0.5, c.z, 4, 1.2); return false; }   // 젖은 칸은 안 붙음 → 김만
    c.state = 1; c.fire = Math.max(c.fire, f); c.heat = 0; emit('ignite', c); return true;
  };
  E.igniteAt = (x, y, z, r = 2) => { const ids = near(x, z, r + 2); let n = 0; for (let q = 0; q < ids.length; q++) { const c = E.cells[ids[q]]; if (Math.hypot(c.x - x, c.z - z) < r + c.r && Math.abs(c.y - y) < 6 && E.ignite(c.id)) n++; } return n; };
  const RES = { hit: 0, out: 0, steam: 0 };
  E.water = (x, y, z, r = 2.2, power = E.opt.bucket) => {
    RES.hit = RES.out = RES.steam = 0;
    const ids = near(x, z, r + 2);
    for (let q = 0; q < ids.length; q++) {
      const c = E.cells[ids[q]]; if (c.tags & TAG.GAS || c.state >= 2) continue;
      if (Math.hypot(c.x - x, c.z - z) > r + c.r * 0.6 || Math.abs(c.y - y) > 7) continue;
      RES.hit++; c.wet = E.opt.wetSec; c.heat = 0;
      if (c.state === 1) {
        RES.steam += c.fire; c.fire -= power; addSteam(c.x, c.y + 0.6, c.z, 1.6 + c.r, 3.5);
        puff(STEAM, c.x, c.y + 0.4, c.z, 10, 1.6);
        if (c.fire <= 0) { c.fire = 0; c.state = 0; RES.out++; emit('out', c); }
      }
    }
    if (RES.steam > 0) emit('steam', RES);
    return RES;
  };
  E.gas = (x, y, z, r = 3, sec = KIND.gas.life) => { const id = E.add({ kind: 'gas', x, y, z, r, life: sec }); return id; };
  function boom(g) {
    g.state = 3; g.life = 0;
    puff(SPARK, g.x, g.y, g.z, 36, 5); puff(SMOKE, g.x, g.y, g.z, 8, 2);
    const ids = near(g.x, g.z, g.r + 3);
    for (let q = 0; q < ids.length; q++) { const c = E.cells[ids[q]]; if (c !== g && Math.hypot(c.x - g.x, c.z - g.z) < g.r + 2.5) { if (c.tags & TAG.GAS && c.state === 0) { c.life = 0.15; c.fuse = 1; } else E.ignite(c.id, 0.55); } }   // 이어진 가스도 연달아 펑
    emit('boom', g);
  }
  E.spark = (x, y, z, r = 1.5) => {
    const ids = near(x, z, r + 4);
    for (let q = 0; q < ids.length; q++) {
      const c = E.cells[ids[q]], d = Math.hypot(c.x - x, c.z - z);
      if (c.tags & TAG.GAS) { if (c.state === 0 && d < c.r + r && Math.abs(c.y - y) < c.r + 2) boom(c); }
      else if (c.state === 0 && c.wet <= 0 && d < r + c.r) c.heat = Math.min(1.2, c.heat + 0.45);
    }
    puff(SPARK, x, y, z, 6, 1.5);
  };
  /* 옮기기(움직이는 칸 — 날아가는 꼬리날개·떠가는 배·바람에 밀리는 가스) · 8m 격자 칸만 바꿈(이웃 표는 그대로 = 처음 자리 기준) */
  E.move = (id, x, y, z) => {
    const c = E.cells[id]; if (!c) return;
    const k0 = gk(c.x, c.z), k1 = gk(x, z); c.x = x; c.y = y; c.z = z;
    if (k0 !== k1) { const a = grid.get(k0); if (a) { const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); } let b = grid.get(k1); if (!b) grid.set(k1, b = []); b.push(id); }
  };
  E.remove = (id) => { const c = E.cells[id]; if (!c || c.state === 3) return false; const was = c.state; c.state = 3; c.fire = 0; c.heat = 0; emit('removed', { c, was }); return true; };

  /* 김 구름(가림막) */
  const steamList = [];
  function addSteam(x, y, z, r, t) { for (const s of steamList) if (Math.hypot(s.x - x, s.z - z) < 2) { s.t = Math.max(s.t, t); s.r = Math.max(s.r, r); return; } if (steamList.length < 24) steamList.push({ x, y, z, r, t }); }
  E.steams = () => steamList;

  /* 상승 기류(5Hz로 다시 채움 · 같은 배열) */
  const ups = [];
  E.updrafts = () => ups;
  E.fireNear = (x, z, r) => { const ids = near(x, z, r + 2); let m = 0; for (let q = 0; q < ids.length; q++) { const c = E.cells[ids[q]]; if (c.state === 1 && Math.hypot(c.x - x, c.z - z) < r + c.r) m = Math.max(m, c.fire); } return m; };
  E.count = (state, fn) => { let n = 0; for (const c of E.cells) if (c.state === state && !(c.tags & TAG.GAS) && (!fn || fn(c))) n++; return n; };

  /* ── 규칙(5Hz) ── */
  let acc = 0;
  function rules(h) {
    const W = E.wind, wsp = W.speed, rain = E.rain, sp = E.opt.spread * (1 - rain * 0.7);
    for (const c of E.cells) c.inHeat = 0;
    ups.length = 0;
    for (const c of E.cells) {
      if (c.wet > 0) c.wet -= h;
      if (c.tags & TAG.GAS) {                                    // 가스: 시간이 지나면 흩어짐 · 타는 칸이 닿으면 펑
        if (c.state !== 0) continue;
        c.life -= h; if (c.life <= 0) { if (c.fuse) boom(c); else c.state = 3; continue; }
        const ids = near(c.x, c.z, c.r + 3);
        for (let q = 0; q < ids.length; q++) { const b = E.cells[ids[q]]; if (b.state === 1 && b.fire > 0.2 && Math.hypot(b.x - c.x, b.z - c.z) < c.r + b.r) { boom(c); break; } }
        continue;
      }
      if (c.state !== 1) continue;
      const K = c.K;
      c.fire = Math.min(1, c.fire + K.grow * h * (1 - rain * 0.6));
      c.fuel -= c.fire * h; c.burnT += h;
      if (c.fuel <= 0) { c.state = 2; c.fire = 0; emit('burnt', c); continue; }
      /* 번짐 — 이웃에 열 · 바람 아래(바람 방향과 같은 쪽)는 세게, 바람 위는 약하게 */
      for (let q = 0; q < c.nb.length; q++) {
        const b = E.cells[c.nb[q]]; if (b.state !== 0 || !(b.tags & TAG.FUEL) || b.wet > 0) continue;
        const down = c.nx[q] * W.x + c.nz[q] * W.z, wk = Math.max(0.06, Math.min(2.4, 0.35 + down * wsp * 1.3));
        b.inHeat += c.fire * c.nw[q] * wk * c.give * b.K.catch * sp * h;
      }
      if (K.up > 0 && c.fire > 0.25) ups.push({ x: c.x, y: c.y + 1.5, z: c.z, r: 3 + c.fire * 3 * K.up, power: c.fire * K.up });
    }
    for (const c of E.cells) {
      if (c.state !== 0 || c.tags & TAG.GAS) continue;
      if (c.wet > 0) { c.heat = 0; continue; }
      c.heat = c.inHeat > 0 ? c.heat + c.inHeat : Math.max(0, c.heat - E.opt.cool * h);
      if (c.heat >= 1) { if (E.ignite(c.id, 0.2)) emit('catch', c); }
    }
    for (let i = steamList.length - 1; i >= 0; i--) { const s = steamList[i]; s.t -= h; s.y += h * 0.6; if (s.t <= 0) steamList.splice(i, 1); }
    emitFx(h);
    if (group) assignSlots();
  }
  E.step = (dt) => {
    E.t += dt; acc += dt;
    while (acc >= 0.2) { acc -= 0.2; rules(0.2); }
    stepParticles(dt);
  };

  /* ── 그림(규칙의 결과만 보여 줌) ── */
  const VIEW = new THREE.Vector3();
  const slots = [], embers = { mesh: null };
  const SMOKE = mkPool(group, 200, 0x3a3532, 2.0, 0.5, false, -0.0, 3.4);
  const STEAM = mkPool(group, 90, 0xeef2f2, 2.4, 0.55, false, 0, 1.8);
  const SPARK = mkPool(group, 140, 0xffa848, 0.32, 1, true, 7, 1.4);
  const GAS = mkPool(group, 90, 0x9ac87a, 2.2, 0.5, false, 0, 1.6);
  if (group) {
    for (let i = 0; i < SLOTS; i++) { const f = flameMesh(1), g = glowSprite(0xff8a3a, 6, 0.42); f.visible = g.visible = false; group.add(f); group.add(g); slots.push({ f, g, c: null }); }
    const geo = new THREE.SphereGeometry(1, 9, 5); geo.scale(1, 0.32, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true });
    const m = new THREE.InstancedMesh(geo, mat, MAXC); m.count = 0; m.frustumCulled = false; m.renderOrder = 5; group.add(m); embers.mesh = m;
  }
  function assignSlots() {                                       // 타는 칸 가운데 카메라에 가까운 여섯 → 불꽃 + 빛 판(5Hz)
    for (const s of slots) { if (s.c) s.c.inSlot = false; s.c = null; }
    for (const c of E.cells) {
      c.inSlot = false;
      if (c.state !== 1 || c.fire < 0.08) continue;
      const d = (c.x - VIEW.x) ** 2 + (c.z - VIEW.z) ** 2; c._d = d;
      let w = -1, wd = -1; for (let i = 0; i < SLOTS; i++) { const s = slots[i]; if (!s.c) { w = i; break; } if (s.c._d > wd) { wd = s.c._d; w = i; } }
      if (!slots[w].c || slots[w].c._d > d) slots[w].c = c;
    }
    for (const s of slots) if (s.c) s.c.inSlot = true;          // 파티클(연기·불티)은 이 여섯 칸만(design §3-2)
    const SX = getSfx(); if (SX && SX.on) for (const s of slots) if (s.c) SX.near('crackle', s.c.x, s.c.y, s.c.z, Math.min(1, 0.35 + s.c.fire * 0.65));   // 불 탁탁 = 타는 칸 자리에서(가까울수록 · 보이는 짝 = 불꽃)
    /* 지붕 발광색(인스턴스 하나) — 탐 = 주황(불 세기) · 달아오름 = 어두운 빨강(곧 붙음 = 보이는 예고) · 다 탐 = 그을음 · 떼어냄·멀쩡 = 안 보임 */
    const m = embers.mesh; if (!m) return;
    let n = 0;
    for (const c of E.cells) {
      if (c.tags & TAG.GAS || c.kind === 'chimney') continue;
      let r = 0, g = 0, b = 0, show = true;
      if (c.state === 1) { const fl = 0.75 + 0.25 * Math.sin(E.t * 9 + c.id * 2.3); r = (0.55 + 0.45 * c.fire) * fl; g = (0.18 + 0.3 * c.fire) * fl; b = 0.04; }
      else if (c.state === 2) { r = 0.09; g = 0.07; b = 0.06; }
      else if (c.state === 0 && c.heat > 0.3) { const k = Math.min(1, (c.heat - 0.3) / 0.7); r = 0.25 + 0.3 * k; g = 0.08 + 0.05 * k; b = 0.05; }
      else if (c.state === 0 && c.wet > 0) { r = 0.32; g = 0.36; b = 0.4; show = c.wet > E.opt.wetSec - 3; }   // 막 젖은 자리만 잠깐 어둡게
      else show = false;
      if (!show) continue;
      const sc = c.r * (c.state === 2 ? 1.05 : 0.95);
      _m.makeScale(sc, sc, sc).setPosition(c.x, c.y + 0.12, c.z); m.setMatrixAt(n, _m); _col.setRGB(r, g, b); m.setColorAt(n, _col); n++;
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  const _m = new THREE.Matrix4(), _col = new THREE.Color();
  E.draw = (camPos) => {
    if (!group) return;
    if (camPos) VIEW.copy(camPos);
    for (const s of slots) {
      const c = s.c; if (!c || c.state !== 1) { s.f.visible = s.g.visible = false; continue; }
      const k = c.K.flame * (0.45 + c.fire * 0.85);
      s.f.visible = s.g.visible = true; s.f.position.set(c.x, c.y - 0.1, c.z); s.f.scale.set(k * 2.6, k * 1.6, k * 2.6);
      s.f.rotation.z = -E.wind.x * 0.25 * E.wind.speed; s.f.rotation.x = E.wind.z * 0.25 * E.wind.speed;   // 바람 쪽으로 기움
      s.g.position.set(c.x, c.y + 0.9 * k, c.z); s.g.scale.setScalar(3 + 5 * c.fire * c.K.flame);
    }
  };

  /* 파티클 풀 — 연기(오름 · 바람에 흐름) · 김(빨리 오르고 금방 사라짐) · 불티(튐 · 무게) */
  function mkPool(grp, max, color, size, opacity, add, grav, life) {
    const pos = new Float32Array(max * 3).fill(-999), vel = new Float32Array(max * 3), age = new Float32Array(max).fill(1e9);
    const P = { pos, vel, age, max, k: 0, grav, life, mesh: null };
    if (!grp) return P;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = glowSprite(0xffffff, 1, 1).material.map;           // 둥근 판(kit 공유 텍스처)
    const mat = new THREE.PointsMaterial({ color, size, map: tex, transparent: true, opacity, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true });
    const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = add ? 960 : 930; grp.add(m); P.mesh = m;
    return P;
  }
  function puff(P, x, y, z, n, sp) {
    for (let i = 0; i < n; i++) {
      const j = P.k++ % P.max, a = (P.k * 2.399) % 6.283, s = sp * (0.35 + ((P.k * 7) % 10) / 14);
      P.pos[j * 3] = x; P.pos[j * 3 + 1] = y; P.pos[j * 3 + 2] = z;
      P.vel[j * 3] = Math.cos(a) * s; P.vel[j * 3 + 1] = (P.grav > 0 ? 2.5 + s : 0.6 + s * 0.4); P.vel[j * 3 + 2] = Math.sin(a) * s; P.age[j] = 0;
    }
  }
  function emitFx(h) {                                           // 원인이 있는 칸에서만(타는 칸 = 연기·불티 · 달아오른 칸 = 가는 연기 · 다 탄 칸 = 잠깐 그을음 연기)
    for (const c of E.cells) {
      if (c.tags & TAG.GAS) { if (c.state === 0) { puffGas(c); puffGas(c); } continue; }
      c.smokeT -= h;
      if (c.smokeT > 0) continue;
      if (c.state === 1) { if (!c.inSlot) continue; puff(SMOKE, c.x, c.y + 0.6 * c.K.flame, c.z, 1, 0.3); if (c.fire > 0.5 && (c.id + (E.t * 5 | 0)) % 3 === 0) emberTo(c); c.smokeT = 0.4 - c.fire * 0.15; }
      else if (c.state === 0 && c.heat > 0.35) { puff(SMOKE, c.x, c.y + 0.3, c.z, 1, 0.15); c.smokeT = 1.1 - c.heat * 0.6; }
      else if (c.state === 2 && c.burnT < 60) { puff(SMOKE, c.x, c.y + 0.3, c.z, 1, 0.1); c.smokeT = 2.2; c.burnT += 2.2; }
    }
  }
  function puffGas(c) { const j = GAS.k++ % GAS.max; GAS.pos[j * 3] = c.x + Math.sin(c.id * 3 + E.t * 4) * c.r * 0.6; GAS.pos[j * 3 + 1] = c.y; GAS.pos[j * 3 + 2] = c.z + Math.cos(c.id * 5 + E.t * 3) * c.r * 0.6; GAS.vel[j * 3] = GAS.vel[j * 3 + 2] = 0; GAS.vel[j * 3 + 1] = 0.3; GAS.age[j] = 0; }   // 초록 김(가스 = 보이는 짝)
  function emberTo(c) {                                          // 불티가 바람 아래 이웃 쪽으로 날아감(번짐의 원인이 보이게)
    const j = SPARK.k++ % SPARK.max, W = E.wind;
    SPARK.pos[j * 3] = c.x; SPARK.pos[j * 3 + 1] = c.y + 1.2; SPARK.pos[j * 3 + 2] = c.z;
    SPARK.vel[j * 3] = W.x * W.speed * 3.5 + Math.sin(c.id + E.t) * 0.6; SPARK.vel[j * 3 + 1] = 3.2; SPARK.vel[j * 3 + 2] = W.z * W.speed * 3.5 + Math.cos(c.id + E.t) * 0.6; SPARK.age[j] = 0;
  }
  const POOLS = [SMOKE, STEAM, SPARK, GAS];
  function stepParticles(dt) {
    const W = E.wind;
    for (const P of POOLS) {
      const { pos, vel, age } = P; let live = false;
      for (let j = 0; j < P.max; j++) {
        if (age[j] > P.life) { if (pos[j * 3 + 1] !== -999) pos[j * 3 + 1] = -999; continue; }
        live = true; age[j] += dt;
        if (P === SPARK) { vel[j * 3 + 1] -= P.grav * dt * 0.5; }
        else { vel[j * 3] += (W.x * W.speed * 1.6 - vel[j * 3]) * dt * 0.8; vel[j * 3 + 2] += (W.z * W.speed * 1.6 - vel[j * 3 + 2]) * dt * 0.8; vel[j * 3 + 1] += ((P === STEAM ? 2.2 : P === GAS ? 0.15 : 1.5) - vel[j * 3 + 1]) * dt; }
        pos[j * 3] += vel[j * 3] * dt; pos[j * 3 + 1] += vel[j * 3 + 1] * dt; pos[j * 3 + 2] += vel[j * 3 + 2] * dt;
      }
      if (P.mesh && (live || P.wasLive)) P.mesh.geometry.attributes.position.needsUpdate = true;
      P.wasLive = live;
    }
  }
  E.puff = (kind, x, y, z, n = 10, sp = 2) => puff(kind === 'steam' ? STEAM : kind === 'spark' ? SPARK : kind === 'gas' ? GAS : SMOKE, x, y, z, n, sp);   // 장이 원인 자리에서 부름(물통이 닿음 등)

  E.stats = () => ({ cells: E.cells.length, burning: E.count(1), burnt: E.count(2), gone: E.count(3), ups: ups.length, steams: steamList.length, draws: group ? SLOTS * 2 + 5 : 0 });
  E.dispose = () => {
    if (!group) return;
    for (const s of slots) { s.f.removeFromParent(); s.g.removeFromParent(); }
    if (embers.mesh) { embers.mesh.removeFromParent(); embers.mesh.geometry.dispose(); embers.mesh.material.dispose(); embers.mesh.dispose && embers.mesh.dispose(); }
    for (const P of POOLS) if (P.mesh) { P.mesh.removeFromParent(); P.mesh.geometry.dispose(); P.mesh.material.dispose(); }
    L.ignite = L.out = L.burnt = L.boom = L.steam = L.catch = null;
  };
  return E;
}
