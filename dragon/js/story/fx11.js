// 종장 '또 하기' 넓히기(팀 J · design §2 종장 · §3-4 날씨) — 날씨 날 넷 · 비·눈·우박 줄기(카메라 둘레 고정 버퍼 · 정점 셰이더가 흘림 · CPU 0)
// · 우박 알갱이(땅에 튀는 흰 점 · 한 묶음) · 스콜드런 자리표시 모양(있는 드래곤 모델의 정점색만 바다색으로) · 하는 법 표(런타임 더하기 — 메인이 art.js로 옮길 것)
// 매 걸음 new X · 장소 group에 넣어 장소가 바뀌면 함께 치움
import * as THREE from 'three';
import { HOWTO, ICONS, keyCap } from '../ui/art.js?v=17';

/* 날씨 넷 — time = kit TIMES의 때 · 그날 하나(실제 날짜 · ?wx=로 고름) */
export const WX = {
  clear: { time: 'clear', name: '맑음', icon: 'heart', line: '오늘은 해가 났다! 버크에선 드문 날이야.' },
  rain: { time: 'overcast', name: '비', icon: 'water', line: '비 오는 날 — 물고기가 잘 무는 날이지.' },
  snow: { time: 'sleet', name: '눈', icon: 'cloud', line: '눈 오는 날 — 드래곤들이 대장간 불가에 모였네.' },
  hail: { time: 'overcast', name: '우박', icon: 'cloud', line: '우박 오는 날 — 머리 조심!' },
};
const ORDER = ['clear', 'rain', 'snow', 'hail'];
export function wxDay() {
  let q = null; try { q = new URLSearchParams(location.search).get('wx'); } catch (e) { q = null; }
  if (WX[q]) return q;
  const d = new Date(), k = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);   // 그 고장 날짜로 하루 하나
  return ORDER[((k % 4) + 4) % 4];
}

/* 줄기 — kind 'rain'|'snow'|'hail' · n개 · box m 상자가 카메라를 따라옴 · uN = 보이는 몫(0~1 · 우박 소나기 세기) */
function streaks(group, kind, n, box) {
  const pos = new Float32Array(n * 6), seed = new Float32Array(n * 2);
  let s0 = kind === 'rain' ? 11 : kind === 'snow' ? 23 : 37; const rnd = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  for (let i = 0; i < n; i++) { const x = (rnd() - 0.5) * box, y = rnd() * box, z = (rnd() - 0.5) * box, s = rnd(); for (let k = 0; k < 2; k++) { pos[i * 6 + k * 3] = x; pos[i * 6 + k * 3 + 1] = y; pos[i * 6 + k * 3 + 2] = z; seed[i * 2 + k] = k + s * 0.999; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const P = { rain: [0x9fb0c0, 0.9, 16, 2.5, 0.35], snow: [0xeef2f4, 0.3, 4.5, 2.2, 0.7], hail: [0xf4f8fa, 0.28, 24, 0.8, 0.85] }[kind];
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uBox: { value: box }, uCol: { value: new THREE.Color(P[0]) }, uLen: { value: P[1] }, uSp: { value: P[2] }, uWind: { value: new THREE.Vector2(P[3], 0.9) }, uA: { value: P[4] }, uN: { value: 1 } }]),
    vertexShader: `uniform float uT; uniform vec3 uC; uniform float uBox; uniform float uLen; uniform float uSp; uniform vec2 uWind; uniform float uN; attribute float seed; varying float vFogDepth; varying float vA;
      void main(){ float e = floor(seed); float s = fract(seed); vec3 p = position; float fall = uT * uSp * (0.85 + 0.3 * fract(s * 7.13));
        p.y = mod(p.y - fall - uC.y, uBox); p.x = mod(p.x + uWind.x * (uT + s * 50.0) * 0.35 - uC.x, uBox) - uBox * 0.5; p.z = mod(p.z + uWind.y * (uT + s * 50.0) * 0.35 - uC.z, uBox) - uBox * 0.5;
        p += uC; p.y += -uBox * 0.4; vec3 dir = normalize(vec3(uWind.x * 0.06, -1.0, uWind.y * 0.06));
        p -= dir * e * uLen; p.x += sin(uT * 1.7 + s * 40.0) * 0.25 * (1.0 - step(10.0, uSp));
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vFogDepth = -mv.z;
        vA = (1.0 - smoothstep(uBox * 0.25, uBox * 0.5, length(p.xz - uC.xz))) * step(fract(s * 3.71), uN);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uA; varying float vA;
      #include <fog_pars_fragment>
      void main(){ if (vA < 0.01) discard; gl_FragColor = vec4(uCol, uA * vA);
        #ifdef USE_FOG
          gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        #include <colorspace_fragment>
      }` });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 960; group.add(L);
  return { mesh: L, u: m.uniforms, step(t, cam) { m.uniforms.uT.value = t; m.uniforms.uC.value.copy(cam.position); }, dispose() { L.removeFromParent(); g.dispose(); m.dispose(); } };
}

/* 날씨 걸기 — 그 장소에 한 번(장소 draw에 얹음 · 장소가 바뀌면 장소와 함께 사라짐) · 돌려줌 = { kind, rain, hail(우박 줄기 — 소나기 때 세기만 바꿈) } */
export function weather(G, kind) {
  const pl = G.place; if (!pl) return null;
  if (pl._wx && pl._wx.kind === kind) return pl._wx;
  const W = { kind, fx: [], hail: null };
  if (kind === 'rain') W.fx.push(streaks(pl.group, 'rain', 1500, 44));
  if (kind === 'snow' && pl.time !== 'sleet') W.fx.push(streaks(pl.group, 'snow', 1400, 46));   // 마을은 'sleet' 때 제 눈을 이미 그림
  W.hail = streaks(pl.group, 'hail', 1300, 40); W.hail.u.uN.value = kind === 'hail' ? 0.18 : 0; W.fx.push(W.hail);
  const d0 = pl.draw; pl.draw = function (a) { if (d0) d0.call(pl, a); const t = performance.now() / 1000; for (const f of W.fx) f.step(t, G.camera); };
  pl._wx = W; return W;
}

/* 우박 알갱이 — 땅에 떨어져 튀는 흰 점(InstancedMesh 하나) · 소나기 동안 둘레에 뿌림 */
export function hailBits(group, n = 70) {
  const g = new THREE.SphereGeometry(0.07, 5, 4), m = new THREE.MeshBasicMaterial({ color: 0xf2f6f8, fog: true });
  const M = new THREE.InstancedMesh(g, m, n); M.frustumCulled = false; group.add(M);
  const S = Array.from({ length: n }, () => ({ x: 0, y: -50, z: 0, vy: 0, life: 0 })), _m = new THREE.Matrix4(); let k = 0;
  const hide = () => { for (let i = 0; i < n; i++) { S[i].life = 0; _m.makeTranslation(0, -50, 0); M.setMatrixAt(i, _m); } M.instanceMatrix.needsUpdate = true; };
  hide();
  return {
    drop(x, y, z) { const s = S[k = (k + 1) % n]; s.x = x; s.y = y + 0.4; s.z = z; s.gy = y; s.vy = -6; s.life = 2.4; },
    step(dt) { for (let i = 0; i < n; i++) { const s = S[i]; if (s.life <= 0) continue; s.life -= dt; s.vy -= 14 * dt; s.y += s.vy * dt; if (s.y < s.gy) { s.y = s.gy; s.vy = -s.vy * 0.35; } _m.makeTranslation(s.x, s.life > 0 ? s.y : -50, s.z); M.setMatrixAt(i, _m); } M.instanceMatrix.needsUpdate = true; },
    hide, dispose() { M.removeFromParent(); g.dispose(); m.dispose(); M.dispose(); },
  };
}

/* 하늘 어두워짐(예고) — 해·하늘빛 세기를 k(0~1)만큼 낮춤 · 0이면 원래대로 */
export function dim(G, k) {
  const e = G.env; if (!e) return;
  if (e._b == null) { e._b = e.sun.intensity; e._h = e.hemi.intensity; }
  e.sun.intensity = e._b * (1 - 0.55 * k); e.hemi.intensity = e._h * (1 - 0.3 * k);
  if (k <= 0) { e._b = null; e._h = null; }
}

/* 스콜드런 자리표시 — 드래곤 모델(나이트메어 · 긴 목)의 정점색을 밝기만 남겨 바다색 셋으로 다시 칠함(지오메트리를 이 몸만 복제 · 재질도 복제) */
const SC_DEEP = new THREE.Color(0x2f5f7e), SC_MID = new THREE.Color(0x4f8fae), SC_LIGHT = new THREE.Color(0x9fd0d8);
export function paintScauldron(root) {
  const own = [], c = new THREE.Color();
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone(); own.push(o.geometry);
    if (o.material) { o.material = o.material.clone(); own.push(o.material); }
    const col = o.geometry.attributes.color;
    if (col) { for (let i = 0; i < col.count; i++) { const l = 0.3 * col.getX(i) + 0.55 * col.getY(i) + 0.15 * col.getZ(i), k = Math.min(1, l * 2.2); if (k < 0.5) c.copy(SC_DEEP).lerp(SC_MID, k * 2); else c.copy(SC_MID).lerp(SC_LIGHT, (k - 0.5) * 2); col.setXYZ(i, c.r, c.g, c.b); } col.needsUpdate = true; }
    else if (o.material && o.material.color) o.material.color.copy(SC_MID);
  });
  return () => own.forEach((x) => x.dispose());
}

/* 하는 법 표(종장 또 하기) — 동사 표에 없던 손 */
const ARROWS = `<span class="keys">${keyCap('W')}${keyCap('A')}${keyCap('S')}${keyCap('D')}</span>`;
Object.assign(HOWTO, {
  lead11: [[keyCap('F'), ICONS.nip, '풀 줍기 · 지붕 밑에서 F 꾹'], [keyCap('Shift', true), 'tiptoe', '천천히 이끌기'], [keyCap('F'), ICONS.hand, '가까이서 턱 긁기']],
  heal11: [[keyCap('Shift', true), 'tiptoe', '살금살금'], [keyCap('F 꾹', true), ICONS.hand, '고개 돌려 손 내밀기'], [keyCap('F'), ICONS.cloth, '다친 곳에 맞는 것']],
  shelter11: [['', ICONS.cloud, '하늘이 어두워지면'], [ARROWS, ICONS.fin, '투슬리스 날개 밑으로'], ['', 'wait', '그친 뒤까지 가만히']],
  water11: [[keyCap('F'), ICONS.bucket, '물가에서 물 뜨기'], [keyCap('Shift', true), 'tiptoe', '살금살금'], [keyCap('F'), ICONS.water, '날 볼 때 붓기']],
});
