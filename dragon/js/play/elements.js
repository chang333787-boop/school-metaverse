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
//   E.draw(camPos)                     // 그리기마다(가까운 타는 칸 여섯만 불꽃 혀 띠 — 모든 칸은 밑 면 겉칠: 그을음·불씨·달아오름·젖음 · 11-01 팀 K)
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
import { glowSprite, tongueGeo, flameTongueMat, FOG_PARS, U, SHARED } from '../look/kit.js?v=18';
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
const CELL8 = 8, MAXC = 256, SLOTS = 6, TPC = 6, MAXV = 12000;   // TPC = 칸마다 불꽃 혀 · MAXV = 겉칠 정점 상한
const upRange = (at, n) => { at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; };
const hash3 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
/* 겉칠 재질(모든 원소 엔진이 함께 · 하나) — 칸 값(그을음 반지름·불 앞줄·불씨·불 세기·달아오름·젖음)을 정점에 싣고 픽셀마다 칸 가운데까지 거리로 칠함(세모 모자이크 X)
   미리 곱한 알파: 어둡게 = 밑 지붕빛을 그만큼 덮음(밤에도 그을음이 지붕보다 밝아지지 않음) · 빛 = 더함 · 불씨는 uTime으로 깜박(CPU 0) · 안개는 지붕과 같은 drgFog 몫만큼 사라짐
   겹치는 차례: 불빛(불 끝 바깥 주황) · 젖음 · 달아오름(어두운 빨강 = 곧 붙음 예고) → 그을린 갈색 띠 → 숯 · 불씨 = 앞줄 띠 + 숯 속 점점이 · 가장자리는 들쭉날쭉(부드러운 결 무늬) */
let SKIN_M = null;
function skinMat() {
  if (SKIN_M) return SKIN_M;
  SKIN_M = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
    transparent: true, depthWrite: false, premultipliedAlpha: true, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: `#include <common>
      #include <fog_pars_vertex>
      attribute vec4 aC; attribute vec4 aS; attribute vec2 aH; varying vec4 vC; varying vec4 vS; varying vec2 vH; varying vec3 vDrgW;
      void main(){ vC = aC; vS = aS; vH = aH; vec4 wp = modelMatrix * vec4(position, 1.0); vDrgW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `#include <common>
      #include <fog_pars_fragment>
      #ifdef USE_FOG
      ${FOG_PARS}
      #endif
      uniform float uTime; varying vec4 vC; varying vec4 vS; varying vec2 vH; varying vec3 vDrgW;
      void main(){
        vec2 p = vDrgW.xz; float sd = vC.w;
        float q = length(p - vC.xy) / vC.z;
        float n = 0.5 + 0.22 * sin(p.x * 1.9 + sd) * sin(p.y * 1.6 - sd * 0.7) + 0.16 * sin((p.x + p.y) * 3.3 + sd * 2.0) + 0.1 * sin((p.x - p.y) * 5.1 + sd);
        float n2 = 0.5 + 0.2 * sin(p.x * 4.7 + sd * 3.0) + 0.17 * sin(p.y * 5.9 - sd + p.x * 1.3) + 0.13 * sin((p.x * 0.6 - p.y) * 7.3 + sd * 2.0);   /* 불씨 점점이(줄 맞춘 점무늬 X) */
        float qq = q * (0.72 + 0.56 * n);
        float soot = vS.x, fr = vS.y, emb = vS.z, fire = vS.w, hk = vH.x, wk = vH.y, k;
        bool burning = fr > 0.0;
        float D = 0.0; vec3 L = vec3(0.0);
        if (burning) { k = 0.3 * fire * (1.0 - smoothstep(fr, 1.1, qq)); L += vec3(0.62, 0.27, 0.08) * k; }
        if (wk > 0.0) { k = 0.26 * wk; D = 1.0 - (1.0 - D) * (1.0 - k); L.b += 0.02 * k; }
        if (hk > 0.0) { k = hk * (1.0 - smoothstep(0.55, 0.95, qq)); D = 1.0 - (1.0 - D) * (1.0 - 0.25 * k); L += vec3(0.2, 0.03, 0.0) * k; }
        float fringe = max(soot + 0.16, fr);
        if (soot > 0.0 || burning) { k = 0.5 * (1.0 - smoothstep(fringe - 0.12, fringe + 0.1, qq)); D = 1.0 - (1.0 - D) * (1.0 - k); L *= vec3(1.0 - k * 0.5, 1.0 - k * 0.6, 1.0 - k); L += vec3(0.035, 0.015, 0.0) * k; }
        if (soot > 0.0) { k = 0.86 * (1.0 - smoothstep(soot - 0.14, soot + 0.04, qq)); D = 1.0 - (1.0 - D) * (1.0 - k); L *= 1.0 - k; }
        float e = 0.0;
        if (burning) e = emb * max(smoothstep(soot - 0.22, soot, qq) * (1.0 - smoothstep(fr - 0.1, fr + 0.04, qq)) * (0.35 + 0.65 * smoothstep(0.3, 0.6, n2)), qq < soot ? 0.5 * smoothstep(0.72, 0.8, n2) : 0.0);
        else if (emb > 0.0 && qq < soot) e = emb * smoothstep(0.72, 0.8, n2);
        else if (hk > 0.4 && qq < 0.7) e = (hk - 0.4) * 0.6 * smoothstep(0.74, 0.82, n2);
        float f = 1.0 - smoothstep(0.95, 1.15, q);
        float fl = 0.7 + 0.3 * sin(uTime * 6.3 + p.x * 3.1 + p.y * 2.3) * sin(uTime * 3.9 + p.y * 4.7 - p.x);
        vec3 em = mix(vec3(0.62, 0.16, 0.06), vec3(1.0, 0.62, 0.22), fl);
        vec4 o = vec4(L * (1.0 - e) + em * e, mix(D, 0.94, e)) * f;
        #ifdef USE_FOG
          float ff = 1.0 - (drgFog(vec3(1.0), vDrgW, vFogDepth).r - drgFog(vec3(0.0), vDrgW, vFogDepth).r);
          o *= 1.0 - ff;
        #endif
        if (o.a < 0.004 && o.r + o.g < 0.004) discard;
        gl_FragColor = o;
      }`,
  });
  Object.assign(SKIN_M.uniforms, U); SHARED.add(SKIN_M);
  return SKIN_M;
}

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
    if (linked) { linkOne(cell); scan([cell]); }
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
  E.link = () => { if (linked) return E; for (const c of E.cells) { c.nb.length = c.nw.length = c.nx.length = c.nz.length = 0; } linked = true; const all = E.cells.slice(); E.cells.length = 0; grid.clear(); for (const c of all) { c.id = E.cells.length; E.cells.push(c); gAdd(c); linkOne(c); } scan(E.cells); return E; };

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
  const slots = [];
  const SMOKE = mkPool(group, 200, 0x3a3532, 2.0, 0.5, false, -0.0, 3.4);
  const STEAM = mkPool(group, 90, 0xeef2f2, 2.4, 0.55, false, 0, 1.8);
  const SPARK = mkPool(group, 140, 0xffa848, 0.32, 1, true, 7, 1.4);
  const GAS = mkPool(group, 90, 0x9ac87a, 2.2, 0.5, false, 0, 1.6);
  /* 11-01 팀 K — 납작한 발광 판(스티커처럼 보임)을 버리고 ① 겉칠: 칸 밑 실제 면(지붕널·수레 윗면)을 한 번 베껴 와 그 위에 그을음·불씨 정점색
     ② 불꽃 혀 띠: 가까운 타는 칸 여섯의 '불 앞줄'(그을음 끝 ~ 불 끝)에 혀 여섯씩 · 둘 다 그리기 한 번씩(예전 13 → 2) · 덧셈 빛 판 X */
  const own = new Set(), skin = { mesh: null, n: 0 }, tongues = { mesh: null };
  if (group) {
    for (let i = 0; i < SLOTS; i++) slots.push({ c: null });
    const tm = new THREE.InstancedMesh(tongueGeo(), flameTongueMat('el'), SLOTS * TPC); tm.count = 0; tm.frustumCulled = false; group.add(tm); tongues.mesh = tm; own.add(tm);
  }
  function makeSkin() {                                          // 겉칠 버퍼(처음 칸을 베낄 때 한 번 · 정점 MAXV까지)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXV * 3), 3));
    g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(MAXV * 4), 4));   // 칸 가운데 x·z · 반지름 · 씨앗(지을 때)
    g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(MAXV * 4), 4));   // 그을음 반지름 · 불 앞줄 · 불씨 · 불 세기(5Hz · 바뀐 칸만)
    g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(MAXV * 2), 2));   // 달아오름 · 젖음
    g.setDrawRange(0, 0);
    const m = new THREE.Mesh(g, skinMat()); m.frustumCulled = false; m.renderOrder = 6; m.matrixAutoUpdate = false;
    group.add(m); own.add(m); skin.mesh = m;
  }
  /* 칸 밑 면 베끼기 — 정적 물건(병합 조각·소품)의 위를 보는 세모 가운데 무게중심이 칸 안(가로 r × 1.15 · 높이 -1.2~+0.9)인 것 · 세모마다 가장 가까운 칸 하나에만 */
  const _sph = new THREE.Sphere(), _cv = new THREE.Vector3();
  function scan(list) {
    if (!group) return;
    const want = list.filter((c) => !(c.tags & TAG.GAS) && c.kind !== 'chimney' && c.sv1 === undefined); if (!want.length) return;
    const t0 = performance.now();
    if (!skin.mesh) makeSkin();
    group.updateMatrixWorld(true);
    const tri = new Map();                                       // 칸 → 세모 아홉 값(지을 때만 · 매 걸음 X)
    group.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || own.has(o) || !o.geometry || !o.geometry.attributes.position) return;
      const mt = o.material; if (!mt || Array.isArray(mt) || mt.transparent || mt.isShaderMaterial) return;
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      _sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
      const cand = want.filter((c) => _cv.set(c.x, c.y, c.z).distanceTo(_sph.center) < _sph.radius + c.r * 1.2 + 1.2); if (!cand.length) return;
      const e = o.matrixWorld.elements, pa = g.attributes.position.array, ix = g.index ? g.index.array : null, n = ix ? ix.length : g.attributes.position.count;
      const det = e[0] * (e[5] * e[10] - e[9] * e[6]) - e[4] * (e[1] * e[10] - e[9] * e[2]) + e[8] * (e[1] * e[6] - e[5] * e[2]), sg = det < 0 ? -1 : 1;
      const P = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let t = 0; t + 2 < n; t += 3) {
        for (let k = 0; k < 3; k++) { const i = (ix ? ix[t + k] : t + k) * 3, x = pa[i], y = pa[i + 1], z = pa[i + 2]; P[k * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; P[k * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; P[k * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
        const gx = (P[0] + P[3] + P[6]) / 3, gy = (P[1] + P[4] + P[7]) / 3, gz = (P[2] + P[5] + P[8]) / 3;
        let best = null, bd = 1e9;
        for (const c of cand) { const dx = gx - c.x, dz = gz - c.z, d2 = dx * dx + dz * dz, R = c.r * 1.15, dy = gy - c.y; if (d2 < R * R && dy < 0.9 && dy > -1.2 && d2 < bd) { bd = d2; best = c; } }
        if (!best) continue;
        const ux = P[3] - P[0], uy = P[4] - P[1], uz = P[5] - P[2], vx = P[6] - P[0], vy = P[7] - P[1], vz = P[8] - P[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) * sg; if (!(Math.abs(L) > 1e-6)) continue;
        nx /= L; ny /= L; nz /= L; if (ny < 0.3) continue;      // 위를 보는 면만(밑면·벽 X)
        let a = tri.get(best); if (!a) tri.set(best, a = []);
        a.push(P[0] + nx * 0.03, P[1] + ny * 0.03, P[2] + nz * 0.03, P[3] + nx * 0.03, P[4] + ny * 0.03, P[5] + nz * 0.03, P[6] + nx * 0.03, P[7] + ny * 0.03, P[8] + nz * 0.03);
      }
    });
    const pos = skin.mesh.geometry.attributes.position.array, ac = skin.mesh.geometry.attributes.aC.array;
    for (const c of want) {
      const a = tri.get(c) || [], nv = Math.min(a.length / 3, MAXV - skin.n) | 0;
      c.sv0 = skin.n; c.sv1 = skin.n + nv - nv % 3; c.vk = -1; c.fuel0 = Math.max(c.fuel, 1e-3);
      for (let v = c.sv0, k = 0; v < c.sv1; v++, k += 3) {
        pos[v * 3] = a[k]; pos[v * 3 + 1] = a[k + 1]; pos[v * 3 + 2] = a[k + 2];
        ac[v * 4] = c.x; ac[v * 4 + 1] = c.z; ac[v * 4 + 2] = c.r; ac[v * 4 + 3] = (c.id * 1.37) % 6.2832;
      }
      skin.n = c.sv1;
      /* 불꽃 혀 자리 열여섯(방향 여덟 × 안·바깥) — 베낀 면의 세모 무게중심 가운데 그 자리에 가장 가까운 것 · 면이 없으면 칸 높이 둥근 판 */
      c.anc = new Float32Array(16 * 4);
      for (let j = 0; j < 16; j++) {
        const ang = (j % 8) / 8 * 6.2832 + (j >= 8 ? 0.39 : 0), rq = j < 8 ? 0.72 : 0.36, wx = c.x + Math.cos(ang) * rq * c.r, wz = c.z + Math.sin(ang) * rq * c.r;
        let bx = wx, by = c.y, bz = wz, bd = 1e9;
        for (let k = 0; k + 8 < a.length; k += 9) { const gx = (a[k] + a[k + 3] + a[k + 6]) / 3, gz = (a[k + 2] + a[k + 5] + a[k + 8]) / 3, d = (gx - wx) ** 2 + (gz - wz) ** 2; if (d < bd) { bd = d; bx = gx; by = (a[k + 1] + a[k + 4] + a[k + 7]) / 3; bz = gz; } }
        c.anc[j * 4] = bx; c.anc[j * 4 + 1] = by; c.anc[j * 4 + 2] = bz; c.anc[j * 4 + 3] = Math.hypot(bx - c.x, bz - c.z) / c.r;
      }
    }
    skin.mesh.geometry.setDrawRange(0, skin.n); skin.mesh.geometry.attributes.position.needsUpdate = true; skin.mesh.geometry.attributes.aC.needsUpdate = true;
    E.scanMs = +((E.scanMs || 0) + performance.now() - t0).toFixed(1);   // 지을 때만(E.stats로 봄)
  }
  /* 칸 상태 → 겉칠 값(5Hz · 바뀐 칸만 정점을 다시 칠함) — 탄 몫 p = 쓴 연료 · 그을음 반지름 = p · 불 앞줄 = 그을음 끝 ~ 불 끝(불 세기·p) · 꺼져도 탄 몫은 남음(결과가 남음) */
  function look(c) {
    const st = c.state, p = st === 2 ? 1 : Math.max(0, Math.min(1, 1 - c.fuel / (c.fuel0 || 1)));
    c.soot = st === 3 ? 0 : st === 2 ? 1.12 : Math.max(0, Math.min(1.05, p * 1.3 - 0.05));
    c.front = st === 1 ? Math.min(1.08, Math.max(c.soot + 0.22, 0.3 + 0.5 * c.fire + 0.5 * p)) : 0;
    c.emb = st === 1 ? 0.55 + 0.45 * c.fire : st === 2 ? Math.max(0, 0.5 - c.smT / 50) : 0;
    c.hk = st === 0 && c.heat > 0.3 ? Math.min(1, (c.heat - 0.3) / 0.7) : 0;
    c.wk = st === 0 || st === 2 ? Math.min(1, Math.max(0, c.wet) / 3) : 0;
    return st * 1e9 + Math.round(c.soot * 40) * 1e7 + Math.round(c.front * 40) * 1e5 + Math.round(c.emb * 20) * 1e3 + Math.round(c.hk * 9) * 100 + Math.round(c.wk * 9) * 10 + (st === 1 ? Math.round(c.fire * 9) : 0);
  }
  function paint(c) {                                            // 칸 값만 그 칸 정점에(칠하기는 셰이더가 픽셀마다)
    const A = skin.mesh.geometry.attributes, S = A.aS.array, H = A.aH.array;
    for (let v = c.sv0; v < c.sv1; v++) { S[v * 4] = c.soot; S[v * 4 + 1] = c.front; S[v * 4 + 2] = c.emb; S[v * 4 + 3] = c.state === 1 ? c.fire : 0; H[v * 2] = c.hk; H[v * 2 + 1] = c.wk; }
  }
  function assignSlots() {                                       // 타는 칸 가운데 카메라에 가까운 여섯 → 불꽃 혀 띠(5Hz) · 겉칠은 바뀐 칸만
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
    if (!skin.mesh) return;
    let dirty = false;
    for (const c of E.cells) {
      if (c.sv1 === undefined || c.sv1 === c.sv0) continue;
      if (c.state === 2) c.smT = (c.smT || 0) + 0.2;
      const k = look(c); if (k === c.vk) continue;
      c.vk = k; paint(c); dirty = true;
    }
    if (dirty) { const A = skin.mesh.geometry.attributes; upRange(A.aS, skin.n * 4); upRange(A.aH, skin.n * 2); }   // 쓰는 몫만 올림
    /* 불꽃 혀 — 칸마다 불 앞줄(그을음 끝 - 0.15 ~ 불 끝 + 0.05)에 든 자리부터, 모자라면 앞줄에 가까운 자리 · 키 = 불꽃 크기 × 불 세기 */
    const tm = tongues.mesh; let n = 0;
    for (const s of slots) {
      const c = s.c; if (!c || c.state !== 1 || !c.anc) continue;
      const lo = c.soot - 0.15, hi = c.front + 0.05, need = Math.min(TPC, Math.ceil(TPC * (0.35 + 0.65 * c.fire))), k0 = c.K.flame * (0.45 + c.fire * 0.85);
      let got = 0;
      for (let pass = 0; pass < 2 && got < need; pass++) for (let j = 0; j < 16 && got < need; j++) {
        const q = c.anc[j * 4 + 3], inB = q >= lo && q <= hi; if (pass === 0 ? !inB : inB) continue;
        if (pass === 1 && Math.abs(q - Math.max(lo, Math.min(hi, q))) > 0.45) continue;
        const h = k0 * (0.65 + 0.5 * hash3(c.id * 3.1 + j, j * 1.7)) * (pass ? 0.7 : 1);
        _m.makeScale(h * 0.58, h, h * 0.58).setPosition(c.anc[j * 4], c.anc[j * 4 + 1] - 0.06, c.anc[j * 4 + 2]); tm.setMatrixAt(n++, _m); got++;
      }
    }
    tm.count = n; if (n) tm.instanceMatrix.needsUpdate = true;
  }
  const _m = new THREE.Matrix4();
  E.draw = (camPos) => {
    if (!group) return;
    if (camPos) VIEW.copy(camPos);
    const l = tongues.mesh.material.uniforms.uLean.value; l.set(E.wind.x * 0.35 * E.wind.speed, E.wind.z * 0.35 * E.wind.speed);   // 바람 쪽으로 기움
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

  E.stats = () => ({ cells: E.cells.length, burning: E.count(1), burnt: E.count(2), gone: E.count(3), ups: ups.length, steams: steamList.length, draws: group ? 2 + 4 : 0, skinV: skin.n, scanMs: E.scanMs || 0 });
  E.dispose = () => {
    if (!group) return;
    if (tongues.mesh) { tongues.mesh.removeFromParent(); tongues.mesh.dispose(); }   // 혀 판·재질은 kit 공유(SHARED)
    if (skin.mesh) { skin.mesh.removeFromParent(); skin.mesh.geometry.dispose(); }
    for (const P of POOLS) if (P.mesh) { P.mesh.removeFromParent(); P.mesh.geometry.dispose(); P.mesh.material.dispose(); }
    L.ignite = L.out = L.burnt = L.boom = L.steam = L.catch = null;
  };
  return E;
}
