// 🔬 우리 마을 화학 규칙(CHEM-1 · 사용자 10-18 '젤다 야숨식 자유도 · 우와 이것도 되네가 포인트' · 설계 docs/systems/town_chem.md · 조사 town_freedom.md 1위)
//   요소(물·불·바람·추위·햇빛) × 물건(나·웅덩이·논과 연못·모닥불·모닥불 곁 눈·민들레) = 아래 ELEM·OBJS·RULES 표 · 규칙은 창 없이 그 자리에서 몸으로 일어남
//   돌기 = 마을 1초 칸에서 sec() 한 번(매 프레임 JS 0) · 첨벙 = 지도 API 트리거(10Hz · 둘레 40m 웅덩이만) · 얼음 미끄럼 = 얼음 논 안에 있을 때만 0.1초 칸
//   그림 둘(그리기 +2 이하 · 새 Light X): 점 풀(김·물방울·물보라·홀씨 64점 — 셰이더가 시간 WT·내 자리 UPL 유니폼으로 움직임) · 둥근 판 인스턴스(웅덩이·녹은 물·논 얼음 판·불꽃·재·민들레)
//   연못 얼음 = 기존 연못 재질에 얼음 값 하나(그리기 0) · 지어내지 않음 = 논·연못·캠핑장·공원이 없는 마을이면 그 규칙은 꺼짐
//   저장 = GAME.S.chem(알아낸 규칙·웅덩이 물기·얼음·모닥불·녹은 물·민들레 씨) · 몸 젖음은 저장 X(세션)
import { LAWS, PAIRS, AT, ORDER } from './town_laws.js?v=2';   // LAWS-1 실험 표(가방 물건 × 자리)
export const CHEM_V = 1;
// 요소 표: [그림, 한, 영]
export const ELEM = { water: ['💧', '물', 'Water'], fire: ['🔥', '불', 'Fire'], wind: ['🌬', '바람', 'Wind'], cold: ['❄️', '추위', 'Cold'], sun: ['☀️', '햇빛', 'Sunlight'] };
// 물건 표: [한, 영, 상태들]
export const OBJS = { me: ['나(옷)', 'Me (clothes)', ['dry', 'wet']], puddle: ['길 웅덩이', 'Puddle', ['none', 'water']], pond: ['논·연못', 'Paddy · pond', ['water', 'ice']], fire: ['모닥불', 'Campfire', ['lit', 'out']], snow: ['모닥불 곁 눈', 'Snow by the fire', ['snow', 'water', 'ice']], seed: ['민들레 홀씨', 'Dandelion seeds', ['head', 'fly', 'flower']] };
// 규칙 표: id · 요소 · 물건 · 바뀜 · 도감 글(제목·본 것·💡 한 줄·까닭·빈칸 귀띔·4학년 과학 단원 — 단원은 2015 개정 이름 · 2022 개정 성취기준 원문은 확인 필요)
export const RULES = [
  { id: 'dry', ic: '💧', e: ['water', 'sun', 'fire'], o: 'me', ch: ['dry→wet', 'wet→dry'],
    t: ['젖은 옷이 말라요', 'Wet clothes dry'], saw: ['몸에서 김이 오르며 옷이 말랐어요', 'Steam rose from me as my clothes dried'],
    tip: ['젖은 옷의 물은 수증기가 되어 날아가요 — 증발', 'Water in wet clothes turns into water vapour — evaporation'],
    why: ['물은 열을 받으면 눈에 안 보이는 수증기가 되어 공기 속으로 날아가요. 햇볕보다 불 곁이 더 빨라요. 하얀 김은 수증기가 식은 작은 물방울이에요.', 'With heat, water becomes invisible water vapour and drifts into the air. A fire dries faster than sunshine. White steam is vapour that cooled into tiny droplets.'],
    hint: ['🌧 비를 맞은 뒤, 햇볕이나 모닥불 곁', '🌧 After the rain, in sunshine or by a campfire'], unit: ['물의 상태 변화', 'Changes of state of water'] },
  { id: 'puddle', ic: '🌧', e: ['water', 'sun'], o: 'puddle', ch: ['none→water', 'water→none'],
    t: ['웅덩이가 사라져요', 'Puddles disappear'], saw: ['첨벙 뛰었던 웅덩이가 맑은 낮이 지나자 없어졌어요', 'The puddle I splashed in was gone after a sunny day'],
    tip: ['웅덩이 물도 햇볕을 받아 수증기가 되어 날아가요', 'Puddle water also turns into vapour in the sun'],
    why: ['햇볕이 셀수록 물이 빨리 증발해요. 그늘진 웅덩이는 더 오래 남아요.', 'The stronger the sun, the faster water evaporates. Puddles in the shade last longer.'],
    hint: ['🌧 비 온 뒤 인도 웅덩이를 첨벙', '🌧 After rain, splash in a puddle on the pavement'], unit: ['물의 상태 변화 · 물의 여행', 'Changes of state of water · the water cycle'] },
  { id: 'freeze', ic: '❄️', e: ['cold', 'sun'], o: 'pond', ch: ['water→ice', 'ice→water'],
    t: ['물이 얼고 녹아요', 'Water freezes and melts'], saw: ['어제 물이던 논이 꽁꽁 얼어 미끄러웠어요', 'The paddy that was water yesterday froze and was slippery'],
    tip: ['물은 0℃ 아래에서 얼어요', 'Water freezes below 0℃'],
    why: ['기온이 0℃ 아래로 내려가면 물이 얼음이 되고, 0℃ 위로 오르면 다시 녹아요. 흐르는 강물과 짠 바닷물은 잘 얼지 않아요.', 'Below 0℃ water turns into ice, and above 0℃ it melts again. Flowing rivers and salty sea water do not freeze easily.'],
    hint: ['❄️ 겨울 아침의 논과 연못', '❄️ Paddies and ponds on a winter morning'], unit: ['물의 상태 변화', 'Changes of state of water'] },
  { id: 'fire', ic: '🔥', e: ['water', 'fire'], o: 'fire', ch: ['lit→out'],
    t: ['물이 불을 꺼요', 'Water puts out fire'], saw: ['물을 부으니 쉬익 소리와 함께 하얀 김이 오르고 불이 꺼졌어요', 'When water poured on, it hissed, white steam rose and the fire went out'],
    tip: ['물이 불의 열을 빼앗아 불이 꺼져요', 'Water takes the heat away and the fire goes out'],
    why: ['뜨거워진 물은 수증기가 되고, 수증기가 식으면 하얀 김(작은 물방울)으로 보여요. 불은 꼭 어른과 함께 써요.', 'The hot water turns into vapour, and when it cools you see white steam (tiny droplets). Always use fire with a grown-up.'],
    hint: ['🏕 캠핑장 모닥불을 다 쬔 뒤, 또는 비 오는 날', '🏕 The campfire after warming up, or on a rainy day'], unit: ['물의 상태 변화 · 불 안전', 'Changes of state of water · fire safety'] },
  { id: 'melt', ic: '⛄', e: ['fire', 'cold'], o: 'snow', ch: ['snow→water', 'water→ice', 'ice→water'],
    t: ['녹았다 얼었다', 'Melt and freeze again'], saw: ['모닥불 곁 눈이 녹아 웅덩이가 되었어요', 'Snow by the fire melted into a puddle'],
    tip: ['눈과 얼음은 따뜻하면 녹아 물이 돼요', 'Snow and ice melt into water when warm'],
    tip2: ['녹은 물은 0℃ 아래에서 다시 얼어요 — 얼음과 물은 서로 바뀔 수 있어요', 'Melted water freezes again below 0℃ — ice and water can change back and forth'],
    why: ['얼음 → 물 → 얼음처럼 물의 상태는 온도에 따라 되돌아갈 수 있어요.', 'Like ice → water → ice, the state of water can go back and forth with temperature.'],
    hint: ['❄️ 겨울 캠핑장 모닥불 곁 (N = 눈사람)', '❄️ By the campfire in winter (N = snowman)'], unit: ['물의 상태 변화', 'Changes of state of water'] },
  { id: 'seed', ic: '🌼', e: ['wind'], o: 'seed', ch: ['head→fly', 'fly→flower'],
    t: ['씨가 바람을 타요', 'Seeds ride the wind'], saw: ['홀씨를 분 쪽에 사흘 뒤 민들레꽃이 피었어요', 'Three days after I blew the seeds, dandelions bloomed downwind'],
    tip: ['민들레 씨는 바람을 타고 날아가 새 자리에서 자라요', 'Dandelion seeds ride the wind and grow in a new place'],
    why: ['민들레 씨에는 솜털 낙하산이 달려 있어 바람이 부는 쪽으로 멀리 날아가요. 씨가 퍼져야 여러 곳에서 자랄 수 있어요.', 'Each dandelion seed has a fluffy parachute, so it flies far with the wind. Spreading out lets plants grow in many places.'],
    hint: ['🌼 봄과 여름, 공원 풀밭 민들레', '🌼 Dandelions on park grass in spring and summer'], unit: ['식물의 한살이(씨가 퍼지는 방법)', 'Plant life cycle (how seeds spread)'] },
];
const NPT = 64;   // 점 풀 크기(김·물방울·물보라·홀씨 — 넘치면 가장 오래된 점부터 다시 씀)
const SPLASH_R = 0.8;   // 첨벙 트리거 반지름(10Hz · 달리기 7.5m/s = 0.75m 간격)

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · id · WT(시간 유니폼) · UPL(머리 자리 유니폼) · root() · on() · lang() · enth.push(h) · own(재질 → 나갈 때 정리)
//   wx() · sea() · temp0() 땅 높이 기온 · inb() · ride() 버스·지하철 · swim() · bike() · paused() 창·놀이·잠·하늘 보기
//   gy(x, z) 땅 · rty(x, z) 길 땅 · roads() 길 조각 · onBridge · inSchool · blk(x, z, y) · blds() 건물 · camps() 모닥불 자리 · gate() 학교 정문 · rice() 논 모양 · ponds() 연못 모양 · pondMat()
//   grass() 공원·풀밭 모양 · inShape · sdOf · bboxOf · okGround(x, z) · walk(x, z) · snowmen() · snowDraw() · rng(열쇠) · cell(x, z) · openP · closeP · esc · nb(탭)
export function createChem(A) {
  const T3 = A.T3, map = A.map, S = () => A.GAME.S, en = () => A.lang() === 'en', tx = a => a[en() ? 1 : 0];
  const fresh = () => ({ v: CHEM_V, found: {}, w: 0, ice: { f: 0, mode: 1 }, fire: { d: 0, out: {}, dryM: 999 }, ring: {}, sp: [], seeds: [], blown: {}, lf: {}, pr: {}, rack: [], plant: [], dei: [], nudge: {} });   /* lf~nudge = LAWS-1 실험(새 칸은 C()가 저절로 채움) */
  const C = () => { const s = S(); let c = s.chem; if (!c || typeof c !== 'object' || c.v !== CHEM_V) c = s.chem = fresh(); for (const [k, v] of Object.entries(fresh())) if (typeof c[k] !== typeof v || Array.isArray(c[k]) !== Array.isArray(v)) c[k] = v; return c; };
  const M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), E4 = new T3.Euler(), C4 = new T3.Color(), Z4 = new T3.Matrix4().makeScale(0, 0, 0);
  let on = false, PT = null, DM = null, UDIM = { value: 1 }, BG = new Map(), FI = [], BOOK = null, lastE = null;
  let lastT = 0, lastM = -1, lastD = -1, cost = { n: 0, sum: 0, max: 0 }, sec0 = false, pend = false, errN = 0, buildMs = 0;
  const ok = () => on && A.on();
  const now = () => A.WT.value;

  // ───────── 그림 1: 점 풀(김·물방울·물보라·홀씨) — 셰이더가 움직임(매 프레임 JS 0) ─────────
  //   점 하나 = aP(x, y, z, 태어난 때) · aV(vx, vy, vz, 수명) · aK(갈래 0 김 · 1 물방울 · 2 물보라 · 3 홀씨, 크기, 진하기, 내 몸 따라감)
  function mkPoints() { if (PT) return PT; const base = new T3.PlaneGeometry(1, 1), g = new T3.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
    const mk = () => { const a = new T3.InstancedBufferAttribute(new Float32Array(NPT * 4), 4); a.setUsage(T3.DynamicDrawUsage); return a; }, aP = mk(), aV = mk(), aK = mk();
    for (let i = 0; i < NPT; i++) aP.setW(i, -1e6); g.setAttribute('aP', aP); g.setAttribute('aV', aV); g.setAttribute('aK', aK); g.instanceCount = NPT;
    const mat = new T3.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: A.WT, uPL: A.UPL, uDim: UDIM },
      vertexShader: 'uniform float uT;\nuniform vec3 uPL;\nattribute vec4 aP;\nattribute vec4 aV;\nattribute vec4 aK;\nvarying vec2 vUv;\nvarying float vA;\nvarying float vK;\n'
        + 'void main() { float age = uT - aP.w, life = aV.w; vUv = uv; vK = aK.x; vA = 0.0;\n'
        + ' if (age < 0.0 || age > life) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }\n'
        + ' float u = age / life, k = aK.x, s = aK.y; vec3 p = aP.xyz + aV.xyz * age; if (aK.w > 0.5) p += uPL - vec3(0.0, 1.3, 0.0);\n'
        + ' if (k < 0.5) { p.xz += vec2(sin(age * 2.1 + aP.w * 7.0), cos(age * 1.7 + aP.w * 5.0)) * 0.09 * age; s *= 0.55 + u * 1.3; vA = aK.z * smoothstep(0.0, 0.15, u) * (1.0 - u); }\n'
        + ' else if (k < 2.5) { p.y -= 4.9 * age * age; vA = aK.z * (1.0 - u * u); }\n'
        + ' else { p.y += sin(age * 2.3 + aP.w * 11.0) * 0.18; p.xz += vec2(sin(age * 1.6 + aP.w * 13.0), cos(age * 1.9 + aP.w * 17.0)) * 0.35; vA = aK.z * smoothstep(0.0, 0.1, u) * (1.0 - u * u); }\n'
        + ' vec4 mv = modelViewMatrix * vec4(p, 1.0); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uDim;\nvarying vec2 vUv;\nvarying float vA;\nvarying float vK;\n'
        + 'void main() { vec2 d = vUv - 0.5; float r = length(d) * 2.0; if (r > 1.0 || vA < 0.004) discard; vec3 c; float a;\n'
        + ' if (vK < 0.5) { c = vec3(0.96, 0.97, 0.99); a = (1.0 - r * r) * vA; }\n'   /* 김 = 부드러운 흰 덩이 */
        + ' else if (vK < 2.5) { c = r > 0.7 ? vec3(0.22, 0.38, 0.55) : vec3(0.72, 0.85, 0.95); a = vA; }\n'   /* 물방울 = 잉크 테두리 + 연파랑(손그림 결) */
        + ' else { c = r < 0.3 ? vec3(0.45, 0.33, 0.2) : vec3(0.98, 0.98, 0.95); a = (r < 0.3 ? 1.0 : 0.85 * (1.0 - r * r)) * vA; }\n'   /* 홀씨 = 갈색 씨 + 흰 솜털 */
        + ' gl_FragColor = vec4(c * uDim, a);\n#include <colorspace_fragment>\n}' });
    const mesh = new T3.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.matrixAutoUpdate = false; mesh.userData.fx = 1; A.own(mat);
    PT = { mesh, g, base, mat, aP, aV, aK, head: 0, until: 0 }; return PT; }
  // 점 하나 내보내기(t0 = 지금 + 늦춤) — 점 64개라 통째로 올려도 작음
  function emit(k, x, y, z, vx, vy, vz, life, size, alpha, follow, delay) { if (!PT) return; const j = PT.head++ % NPT, t0 = now() + (delay || 0);
    PT.aP.setXYZW(j, x, y, z, t0); PT.aV.setXYZW(j, vx, vy, vz, life); PT.aK.setXYZW(j, k, size, alpha, follow ? 1 : 0); PT.aP.needsUpdate = PT.aV.needsUpdate = PT.aK.needsUpdate = true;
    PT.until = Math.max(PT.until, t0 + life); PT.mesh.visible = true; }
  const steamAt = (x, y, z, n, big, spread) => { for (let i = 0; i < n; i++) emit(0, x + (Math.random() - 0.5) * spread, y + Math.random() * 0.2, z + (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 0.15, big ? 1.3 + Math.random() * 0.6 : 0.55 + Math.random() * 0.3, (Math.random() - 0.5) * 0.15, big ? 2.6 + Math.random() * 0.8 : 1.5, big ? 0.8 : 0.36, big ? 0.66 : 0.4, false, i * (big ? 0.1 : 0.3)); };

  // ───────── 그림 2: 둥근 판 인스턴스(반구 하나를 늘이고 눌러 씀) ─────────
  //   aSq = 1이면 같은 반구를 납작한 네모로 폄(논 얼음 판) · aEm = 1이면 스스로 빛남(불꽃 — 밤에도 보임 · 새 Light X) + 셰이더가 일렁임(WT) · 0~1 = 조금 밝게(얼음)
  function domeGeo() { const g = new T3.SphereGeometry(1, 16, 4, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position, sq = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), m = Math.max(Math.abs(x), Math.abs(z)), k = m > 1e-5 ? r / m : 0; sq[i * 3] = x * k; sq[i * 3 + 2] = z * k; }
    g.setAttribute('pSq', new T3.BufferAttribute(sq, 3)); return g; }
  function mkDome(n) { if (DM && DM.cap >= n) return DM; if (DM) { if (DM.mesh.parent) DM.mesh.parent.remove(DM.mesh); DM.mesh.dispose(); DM.g.dispose(); }
    const g = DM ? DM.g0 : domeGeo(), gg = g.clone(), aSq = new T3.InstancedBufferAttribute(new Float32Array(n), 1), aEm = new T3.InstancedBufferAttribute(new Float32Array(n), 1); gg.setAttribute('aSq', aSq); gg.setAttribute('aEm', aEm);
    let mat = DM && DM.mat; if (!mat) { mat = new T3.MeshLambertMaterial({ flatShading: true }); A.own(mat);
      mat.onBeforeCompile = sh => { sh.uniforms.uT = A.WT;
        sh.vertexShader = 'attribute vec3 pSq;\nattribute float aSq;\nattribute float aEm;\nvarying float vEm9;\nuniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed = mix(transformed, pSq, aSq); vEm9 = aEm; if (aEm > 0.5) { float fl = sin(uT * 9.0 + float(gl_InstanceID) * 1.7) * 0.5 + sin(uT * 13.0 + float(gl_InstanceID)) * 0.5; transformed.y *= 1.0 + 0.16 * fl; transformed.xz *= 1.0 - 0.07 * fl; }');
        sh.fragmentShader = 'varying float vEm9;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, diffuseColor.rgb, vEm9);\n#include <opaque_fragment>'); };
      mat.customProgramCacheKey = () => 'chem1'; }
    const mesh = new T3.InstancedMesh(gg, mat, n); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.userData.fx = 1; mesh.setColorAt(0, C4.setHex(0xffffff)); for (let i = 0; i < n; i++) mesh.setMatrixAt(i, Z4); mesh.count = n;
    DM = { mesh, g: gg, g0: g, mat, aSq, aEm, cap: n, dirty: false, vis: new Uint8Array(n) }; return DM; }
  // 칸 하나 그리기(크기 sx 없음 = 숨김) · ry = 돌림 · sq = 네모로 폄 · em = 스스로 빛남(true = 불꽃 · 수 = 그만큼) · rx = 뒤집기(X축 · 음수 크기 X — 인스턴스는 감김 방향을 못 뒤집음)
  function put(i, x, y, z, sx, sy, sz, hex, ry, sq, em, rx) { if (!DM || i < 0) return; if (!sx) { if (DM.vis[i]) { DM.mesh.setMatrixAt(i, Z4); DM.vis[i] = 0; DM.dirty = true; } return; }
    M4.compose(V4.set(x, y, z), Q4.setFromEuler(E4.set(rx || 0, ry || 0, 0)), S4.set(sx, sy, sz)); DM.mesh.setMatrixAt(i, M4); DM.mesh.setColorAt(i, C4.setHex(hex)); DM.aSq.setX(i, sq ? 1 : 0); DM.aEm.setX(i, em === true ? 1 : +em || 0); DM.vis[i] = 1; DM.dirty = true; }
  function flush() { if (!DM || !DM.dirty) return; DM.dirty = false; const m = DM.mesh; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; DM.aSq.needsUpdate = DM.aEm.needsUpdate = true; let any = false; for (let i = 0; i < DM.cap; i++) if (DM.vis[i]) { any = true; break; } m.visible = any; }

  // ───────── 틀 공용: 처마 · 모닥불 자리 · 알아냄 ─────────
  // 처마: 건물 둘레 1.1m 안(건물 상자 밖) = 비가 안 닿음 · 16m 칸 묶음
  function eavesInit() { BG.clear(); for (const B of A.blds()) { if (!B || !(B.h >= 2.5) || !(B.w > 0) || !(B.d > 0) || /green|pitch|park|lot/.test(B.kind || '')) continue; const R = Math.hypot(B.w, B.d) / 2 + 1.2;
      for (let gx = Math.floor((B.cx - R) / 16); gx <= Math.floor((B.cx + R) / 16); gx++) for (let gz = Math.floor((B.cz - R) / 16); gz <= Math.floor((B.cz + R) / 16); gz++) { const k = gx + ':' + gz; let a = BG.get(k); if (!a) BG.set(k, a = []); a.push(B); } } }
  function eaves(x, z) { const a = BG.get(Math.floor(x / 16) + ':' + Math.floor(z / 16)); if (!a) return false;
    for (const B of a) { const c = Math.cos(B.ry || 0), s = Math.sin(B.ry || 0), dx = x - B.cx, dz = z - B.cz, lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < B.w / 2 + 1.1 && Math.abs(lz) < B.d / 2 + 1.1) return true; } return false; }
  // 모닥불 자리: 캠핑장(CAMPF)만 · 켜짐/꺼짐 상태는 C().fire.out(규칙 4가 바꿈 — 없으면 늘 켜짐)
  function fireInit() { FI.length = 0; for (const [x, z] of A.camps()) FI.push({ x, z, y: A.gy(x, z), n: FI.length, i: -1, warmed: false, hot: null, st: '', ring: '' }); }
  function nearFire(x, z, r) { for (const f of FI) if (!C().fire.out[f.n] && (f.x - x) ** 2 + (f.z - z) ** 2 < r * r) return f; return null; }
  // 알아냄: 처음 일어나면 '💡 알아냈어요' 한 줄(앞 알림을 다 읽게 wait 뒤) · 수첩 규칙 칸이 있으면 탭을 엶
  function discover(id, how, sub, wait) { const c = C(), R9 = RULES.find(r => r.id === id); if (!R9) return false; const k = sub ? id + '2' : id; if (c.found[k]) return false; if (sub && !c.found[id]) return false;
    const me = map.player.pos(), first = !Object.keys(c.found).length; c.found[k] = { d: S().day, at: A.cell(me.x, me.z), how: how || '' }; A.GAME.mark(); if (BOOK) BOOK.tab();
    setTimeout(() => { if (!ok()) return; map.hud.toast('💡 ' + (en() ? 'Found out: ' : '알아냈어요: ') + tx(sub ? R9.tip2 : R9.tip) + (first && BOOK ? (en() ? ' (Notebook → Rules)' : ' (수첩 → 규칙 칸)') : ''), 4.5); map.sfx && map.sfx('ding'); }, wait || 2600); return true; }

  // ───────── 규칙 1: 젖음·마름(비·헤엄 → 젖음 · 처마·실내·버스 = 안 젖음 · 햇볕 60초 · 모닥불 곁 10초 = 김 내며 마름) ─────────
  function mkDry() { let wet = 0, wetPk = 0, dryBy = '', q = 0;
    function sec(E, dm, dt) { if (E.paused) return; if (A.swim()) { wet = 1; wetPk = 1; dryBy = ''; return; }
      if (E.rain && !E.shelter) { const w0 = wet; wet = Math.min(1, wet + 0.5 * dt); wetPk = Math.max(wetPk, wet); dryBy = ''; if (w0 < 0.5 && wet >= 0.5 && C().wt !== S().day && !E.inb) { C().wt = S().day; map.hud.toast(en() ? '💧 You got wet in the rain — eaves and indoors keep you dry' : '💧 비에 젖었어요 — 처마 밑이나 실내에선 안 젖어요', 3); } }
      else if (wet > 0) { const f = E.fire, k = E.sea === 'summer' ? 1.25 : E.sea === 'winter' ? 0.7 : 1, r = f ? 0.1 : E.sun ? k / 60 : 1 / 180; if (f) dryBy = 'fire'; else if (E.sun && dryBy !== 'fire') dryBy = 'sun';
        wet = Math.max(0, wet - r * dt); if (!E.inb && (f || E.sun) && wet > 0.05) { if (f) for (let i = 0; i < 4; i++) emit(0, (Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.45, (Math.random() - 0.5) * 0.4, 0, 0.7 + Math.random() * 0.3, 0, 1.6, 0.4, 0.5, true, i * 0.25); else if ((q++ & 1) === 0) emit(0, (Math.random() - 0.5) * 0.3, 1.1 + Math.random() * 0.3, (Math.random() - 0.5) * 0.3, 0, 0.5, 0, 1.4, 0.32, 0.22, true, 0); }   /* 김: 불 곁 = 짙게 넷 · 햇볕 = 옅게 하나 */
        if (wet <= 0 && wetPk >= 0.5) { if ((dryBy === 'fire' || dryBy === 'sun') && discover('dry', dryBy) === false && dryBy === 'fire') map.hud.toast(en() ? '🔥 All dry by the fire' : '🔥 모닥불 곁에서 옷이 다 말랐어요', 2.2); wetPk = 0; dryBy = ''; } }
      if (wet > 0.12 && !E.inb) { const n = wet > 0.6 ? 4 : 2; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, r = 0.22 + Math.random() * 0.12; emit(1, Math.cos(a) * r, 1.05 + Math.random() * 0.5, Math.sin(a) * r, 0, -0.2, 0, 0.6, 0.095, 0.95, true, i / n); } } }   /* 물방울 = 어깨·모자 둘레에서 떨어짐 */
    return { id: 'dry', sec, info: o => { o.wet = +wet.toFixed(2); }, set: o => { if (o.wet != null) { wet = o.wet; wetPk = Math.max(wetPk, wet); } } }; }

  // ───────── 규칙 2: 웅덩이(비 → 인도 낮은 곳에 웅덩이 · 밟으면 첨벙 · 맑은 낮이 지나면 줄어들다 사라짐 · 그늘·밤은 늦게) ─────────
  //   물기 w 하나(저장) · 웅덩이마다 마르는 문턱 th · 첨벙 = 지도 API 트리거(둘레 40m만) · 멀면(70m) 안 그림
  function mkPuddle() { const PD = [], PTRIG = new Map();
    function init() { PD.length = 0; const R = A.rng('chem-pd:' + A.id), cand = [], G0 = A.gate();   /* 자리 = 인도 가운데 줄(연석 뒤 · 다리·교차로·학교·비탈 X) · 학교 정문 가까울수록 많이 · 서로 14m 넘게 */
      for (const s of A.roads()) { const a = s.a, b = s.b, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L0 < 14) continue; const ux = (b[0] - a[0]) / L0, uz = (b[1] - a[1]) / L0, px = -uz, pz = ux, sw = s.r && s.r.big ? 2.2 : 1.4, o = s.hw - (sw - 0.24) / 2, half = (sw - 0.24) / 2 - 0.1;
        for (let t = s.hw + 5; t < L0 - s.hw - 5; t += 16) for (const sg of [-1, 1]) { const x = a[0] + ux * t + px * o * sg, z = a[1] + uz * t + pz * o * sg;
          if (A.inSchool(x, z) || A.onBridge(x, z, 3) || Math.abs(A.rty(x, z) - A.gy(x, z)) > 0.3) continue;
          const h0 = A.rty(x, z), sl = Math.abs(A.rty(x + ux * 1.5, z + uz * 1.5) - A.rty(x - ux * 1.5, z - uz * 1.5)) + Math.abs(A.rty(x + px, z + pz) - A.rty(x - px, z - pz)); if (sl > 0.12) continue;
          if (A.blk(x, z, h0 + 0.5) || A.blk(x + ux * 1.2, z + uz * 1.2, h0 + 0.5) || A.blk(x - ux * 1.2, z - uz * 1.2, h0 + 0.5)) continue;
          const low = A.rty(x + ux * 4, z + uz * 4) >= h0 - 0.005 && A.rty(x - ux * 4, z - uz * 4) >= h0 - 0.005, dG = G0 ? Math.hypot(x - G0[0], z - G0[1]) : 500;
          const Ls = L0 / Math.max(1, Math.ceil(L0 / 5)), T0 = Math.floor(t / Ls) * Ls; let ym = -1e9; for (const T of [T0, T0 + Ls]) for (const q of [-half - 0.1, half + 0.1]) ym = Math.max(ym, A.rty(a[0] + ux * T + px * (o * sg + q), a[1] + uz * T + pz * (o * sg + q)));   /* 높이 = 인도 판(5m 조각 네 귀) 가장 높은 곳 위 */
          cand.push({ x, z, y: ym + 0.14, ry: Math.atan2(ux, uz), rw: Math.max(0.35, Math.min(0.85, half)), rl: Math.max(0.35, Math.min(0.85, half)) + 0.5 + R() * 0.5, sc: R() * (low ? 1.6 : 1) * (1 + 2.5 * Math.exp(-dG / 260)) }); } }
      cand.sort((p, q) => q.sc - p.sc);
      for (const c of cand) { if (PD.length >= 40) break; if (PD.some(p => Math.abs(p.x - c.x) < 14 && Math.abs(p.z - c.z) < 14)) continue; c.th = R() * 0.55; c.sz = -1; c.dq = -1; c.sp = 0; PD.push(c); } }
    const splashAt = (x, y, z) => { for (let i = 0; i < 14; i++) { const a = Math.random() * 6.283, v = 1.0 + Math.random() * 1.3; emit(2, x + Math.cos(a) * 0.2, y + 0.04, z + Math.sin(a) * 0.2, Math.cos(a) * v, 2.0 + Math.random() * 1.6, Math.sin(a) * v, 0.6 + Math.random() * 0.25, 0.1, 0.95, false, 0); } };
    function splash(p) { if (!ok() || p.sz <= 0 || A.inb()) return; const t = now(); if (t - (p.t9 || 0) < 0.5) return; p.t9 = t; const me = map.player.pos(); splashAt(me.x, p.y, me.z); p.sp = 1;
      if (map.tone) { map.tone(620, 0, 0.12, 'sine', 0.1, 190); map.tone(1300, 0.03, 0.09, 'triangle', 0.05, 420); } if (!C().spl) { C().spl = 1; A.GAME.mark(); map.hud.toast(en() ? '🌧 Splash! Puddles form after rain' : '🌧 첨벙! 비가 온 뒤라 웅덩이가 생겼어요', 2.4); } }
    function sec(E, dm) { const c = C(), me = E.me; if (E.rain) c.w = Math.min(1.2, c.w + dm / 50); else if (!E.snow) { const k = E.sea === 'summer' ? 1.4 : E.sea === 'winter' ? 0.6 : 1; c.w = Math.max(0, c.w - dm * (E.phase === 'day' ? k / 240 : E.phase === 'sunset' ? 1 / 600 : 1 / 1200)); }
      for (const p of PD) { const s = Math.max(0, Math.min(1, (c.w - p.th) / 0.4)), q = s > 0 ? Math.ceil(s * 12) / 12 : 0, near = Math.abs(p.x - me.x) < 70 && Math.abs(p.z - me.z) < 70, dq = near ? q : 0;
        if (dq !== p.dq) { p.dq = dq; if (dq > 0) { const k = 0.35 + 0.65 * dq; put(p.i, p.x, p.y + 0.012, p.z, p.rw * 1.2 * k, 0.004, p.rl * 1.15 * k, 0x8f897d, p.ry + 0.3); put(p.i + 1, p.x, p.y + 0.024, p.z, p.rw * k, 0.004, p.rl * k, 0x7d97ad, p.ry); } else { put(p.i, 0, 0, 0); put(p.i + 1, 0, 0, 0); } }   /* 젖은 테(조금 비틀어 덜 반듯하게) + 물 */
        if (q === p.sz) continue; const was = p.sz; p.sz = q;
        if (q <= 0 && was > 0 && p.sp && E.phase === 'day' && !E.rain && Math.hypot(p.x - me.x, p.z - me.z) < 40) { steamAt(p.x, p.y, p.z, 3, false, 0.8); if (discover('puddle', 'sun')) p.sp = 0; } }
      if (!c.found.puddle && E.phase === 'day' && !E.rain) for (const p of PD) if (p.sp && p.sz === 0 && Math.hypot(p.x - me.x, p.z - me.z) < 25) { discover('puddle', 'sun'); break; }   /* 첨벙했던 웅덩이 자리에 다시 와서 '없어졌다' */
      for (const p of PD) { const near = p.sz > 0 && Math.abs(p.x - me.x) < 40 && Math.abs(p.z - me.z) < 40, h = PTRIG.get(p); if (near && !h) PTRIG.set(p, map.trigger.add({ x: p.x, y: p.y, z: p.z, r: Math.max(SPLASH_R, p.rl * 0.8) }, { enter: () => splash(p) })); else if (!near && h) { h.remove(); PTRIG.delete(p); } } }
    return { id: 'puddle', init, slots: n => { for (const p of PD) { p.i = n; n += 2; } return n; }, reset: () => { for (const p of PD) { p.sz = -1; p.dq = -1; } }, sec, day: E => { if (!E.rain) C().w *= 0.5; }, clear: () => { for (const h of PTRIG.values()) h.remove(); PTRIG.clear(); },
      info: o => { o.w = +C().w.toFixed(3); o.puddles = PD.length; o.wetPuddles = PD.filter(p => p.sz > 0).length; o.splashTrig = PTRIG.size; }, set: o => { if (o.w != null) C().w = o.w; },
      api: { puddleList: () => PD.map(p => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +p.y.toFixed(2), th: +p.th.toFixed(2), sz: p.sz, sp: p.sp })) } }; }

  // ───────── 규칙 3: 논·연못 얼음(겨울 · 0℃ 아래면 가장자리부터 얾 · 아침까지 · 한낮에 가장자리부터 녹음 · 강·바다는 안 얾) ─────────
  //   논 = 8m 얼음 판 조각(둥근 판을 네모로 폄 · 벼 그루터기 줄은 얼음 위로 보임) · 언 논에 올라서면 손을 떼도 미끄러짐 · 연못 = 기존 연못 재질에 얼음 값(그리기 0) · 연못 얼음엔 못 올라감(안전 한 줄)
  function mkIce() { const ICE = [], FLD = [], PONDS = [], FLTRIG = [], UICE = { value: 0 }; let key0 = '', told = -1, slide = null;
    function init() { ICE.length = 0; FLD.length = 0; PONDS.length = 0; const JR = A.rng('chem-ice:' + A.id);
      for (const sh of A.rice()) { const [x0, z0, x1, z1] = A.bboxOf(sh); if (x1 - x0 < 6 || z1 - z0 < 6) continue; const nx = Math.max(1, Math.round((x1 - x0) / 8)), nz = Math.max(1, Math.round((z1 - z0) / 8)), w = (x1 - x0) / nx, d = (z1 - z0) / nz, half = Math.min(x1 - x0, z1 - z0) / 2;
        const F = { x0, z0, x1, z1, tiles: [] }; FLD.push(F);
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = x0 + i * w, b = z0 + j * d, c = [[a, b], [a + w, b], [a + w, b + d], [a, b + d]]; if (!c.every(q => A.inShape(sh, q[0], q[1]))) continue;   /* 네 귀가 다 논 안인 조각만 */
          const cx = a + w / 2, cz = b + d / 2, ys = []; for (let u = 0; u <= 2; u++) for (let v = 0; v <= 2; v++) ys.push(A.gy(a + w * u / 2, b + d * v / 2)); const y = Math.max(...ys); if (y - Math.min(...ys) > 0.45) continue;
          const r = Math.min(1, Math.min(cx - x0, x1 - cx, cz - z0, z1 - cz) / Math.max(1, half)) * 0.85 + JR() * 0.15;   /* r = 가장자리 0 → 가운데 1(얼고 녹는 차례 · 조금 들쭉날쭉) */
          const T = { x: cx, z: cz, y: y + 0.075, hw: w / 2, hd: d / 2, r, i: -1, on: false, alt: (i + j) % 2 }; ICE.push(T); F.tiles.push(T); } }   /* 높이 = 조각 안 가장 높은 땅 + 논 결 그림(+0.05) 위 */
      for (const sh of A.ponds()) PONDS.push({ sh, bb: A.bboxOf(sh) });
      const m = A.pondMat(); if (m && !m.userData.chem9) { m.userData.chem9 = 1; const prev = m.onBeforeCompile;
        m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); sh.uniforms.uIce9 = UICE; sh.fragmentShader = 'uniform float uIce9;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', '{ vec3 ic9 = vec3(0.85, 0.91, 0.96) * diffuse; outgoingLight = mix(outgoingLight, ic9, uIce9 * 0.86); diffuseColor.a = mix(diffuseColor.a, 0.97, uIce9); }\n#include <opaque_fragment>'); };
        const k0 = m.customProgramCacheKey ? m.customProgramCacheKey() : ''; m.customProgramCacheKey = () => k0 + ':ice9'; m.needsUpdate = true; }   /* 연못 얼음빛(밤엔 연못 색과 같이 어두워짐) */
      UICE.value = C().ice.f; }
    function sec(E, dm) { const I = C().ice; if (E.sea !== 'winter') { I.f = 0; I.mode = 1; }
      else if (E.T0 < 0) { if (I.mode !== 1 && I.f < 1) I.mode = 1; I.f = Math.min(1, I.f + dm / 90); }   /* 0℃ 아래 = 한 시간 반이면 다 얾 */
      else if (E.T0 > 0 && E.phase === 'day' && !E.snow) { const r = Math.max(0, Math.min(1, (E.m - 540) / 180)); if (r > 0 && I.f > 0) { I.mode = -1; I.f = Math.max(0, I.f - dm * r / 90); } }   /* 0℃ 위 + 해가 높을수록 빨리(9시부터 · 한낮이면 다 녹음) */
      UICE.value = I.f; const key = I.f <= 0 ? '0' : Math.round(I.f * 40) + ':' + I.mode; if (key !== key0) { key0 = key;
        for (const t of ICE) { const v = I.f > 0 && (I.mode === 1 ? t.r <= I.f + 1e-6 : t.r >= 1 - I.f - 1e-6); if (v === t.on) continue; t.on = v; if (v) put(t.i, t.x, t.y, t.z, t.hw, 1, t.hd, t.alt ? 0xe2eef6 : 0xecf5fa, 0, true, 0.3); else put(t.i, 0, 0, 0); } }   /* 얼음 = 밝은 하늘빛(빛 30% 스스로 — 겨울 논 회색과 또렷이 다르게) */
      if (I.f > 0 && !FLTRIG.length) for (const F of FLD) if (F.tiles.length) FLTRIG.push(map.trigger.add({ rect: [F.x0, F.z0, F.x1, F.z1] }, { enter: () => slideStart(F), exit: () => slideStop() }));   /* 미끄럼 트리거 = 얼음이 있을 때만 */
      if (I.f <= 0 && FLTRIG.length) { for (const h of FLTRIG) h.remove(); FLTRIG.length = 0; slideStop(); }
      if (I.f > 0.5 && told !== S().day) { const me = E.me; for (const P of PONDS) { const b = P.bb; if (me.x < b[0] - 8 || me.x > b[2] + 8 || me.z < b[1] - 8 || me.z > b[3] + 8) continue; if (A.sdOf(P.sh, me.x, me.z) < 7) { told = S().day; map.hud.toast(en() ? '❄️ The pond froze — the ice may be thin, so we stay off it' : '❄️ 연못이 꽁꽁 얼었어요 — 얼음이 얇을 수 있어서 올라가지 않아요', 3.2); discover('freeze', 'pond', false, 3800); break; } } } }
    // 얼음 논 미끄럼(얼음 논 안에 있을 때만 0.1초 칸): 누르는 동안 빠르기를 기억 → 손을 떼면 그 빠르기로 미끄러지다 서서히 섬(약 2m) · 막히면 바로 섬 · 자전거·창·놀이 중엔 X · 순간이동 X(걷기 길 그대로 · steer)
    function slideStart(F) { if (slide) return; slide = { F, lx: NaN, lz: NaN, vx: 0, vz: 0, s: 0, told: false, id: setInterval(slideStep, 100) }; }
    function slideStop() { if (!slide) return; clearInterval(slide.id); if (slide.s > 0) map.player.steer(null); slide = null; }
    function slideStep() { const sl = slide; if (!sl) return; if (!ok()) { slideStop(); return; } const me = map.player.pos(), x = me.x, z = me.z;
      let onIce = false; for (const t of sl.F.tiles) if (t.on && Math.abs(x - t.x) <= t.hw && Math.abs(z - t.z) <= t.hd) { onIce = Math.abs(me.y - (t.y - 0.075)) < 0.6; break; }
      if (Number.isFinite(sl.lx)) { const dx = x - sl.lx, dz = z - sl.lz; if (Math.hypot(dx, dz) < 2) { sl.vx = sl.vx * 0.4 + dx / 0.1 * 0.6; sl.vz = sl.vz * 0.4 + dz / 0.1 * 0.6; } } sl.lx = x; sl.lz = z;
      if (!onIce || A.bike() || A.paused()) { if (sl.s > 0) { map.player.steer(null); sl.s = 0; } return; }
      if (!sl.told) { sl.told = true; map.hud.toast(en() ? '❄️ The paddy water froze solid — slippery!' : '❄️ 논물이 꽁꽁 얼었어요 — 미끄러워요!', 2.4); discover('freeze', 'slip', false, 3000); }
      const v = Math.hypot(sl.vx, sl.vz); if (map.player.input) { if (sl.s > 0) { map.player.steer(null); sl.s = 0; } if (v > 0.5) { sl.kx = sl.vx; sl.kz = sl.vz; } return; }
      const kv = Math.hypot(sl.kx || 0, sl.kz || 0); if (sl.s <= 0) { if (kv > 1.2) { sl.s = Math.min(6, kv * 0.95); sl.dx = sl.kx / kv; sl.dz = sl.kz / kv; sl.kx = sl.kz = 0; sl.n = 0; map.player.steer(sl.dx, sl.dz, sl.s, false); } return; }
      sl.s *= 0.86; sl.n++; if (sl.s < 0.6 || (sl.n > 2 && v < 0.3)) { map.player.steer(null); sl.s = 0; return; } map.player.steer(sl.dx, sl.dz, sl.s, false); }
    return { id: 'freeze', init, slots: n => { for (const t of ICE) t.i = n++; return n; }, reset: () => { key0 = ''; for (const t of ICE) t.on = false; }, sec, day: E => { if (E.sea === 'winter') { C().ice.f = 1; C().ice.mode = 1; } },   /* 겨울 밤은 0℃ 아래 = 아침엔 얼어 있음 */
      clear: () => { for (const h of FLTRIG) h.remove(); FLTRIG.length = 0; slideStop(); },
      info: o => { const I = C().ice; o.ice = +I.f.toFixed(2); o.iceMode = I.mode; o.iceTiles = ICE.length; o.iceOn = ICE.filter(t => t.on).length; o.fields = FLD.length; o.ponds = PONDS.map(P => P.bb.map(v => Math.round(v))); o.slide = slide ? { s: +(slide.s || 0).toFixed(2) } : null; },
      set: o => { if (o.ice != null) { C().ice.f = o.ice; if (o.mode) C().ice.mode = o.mode; } },
      api: { iceList: () => ICE.map(t => ({ x: +t.x.toFixed(1), z: +t.z.toFixed(1), y: +t.y.toFixed(2), r: +t.r.toFixed(2), on: t.on })) } }; }

  // ───────── 규칙 4: 모닥불 + 물 = 김·꺼짐(물 붓기 · 비) · 관리인이 다시 피움(비 그치고 40분 · 밤사이 끄고 아침 9시) ─────────
  //   불 안전: 모닥불은 캠핑장 자리만 · 아이는 불을 붙이지 않음(쬐기 → 물 부어 끄기) · 끌 때 '불은 꼭 어른과 함께' 한 줄 · 불꽃 = 둥근 판 셋(스스로 빛남 · 일렁임 = 셰이더)
  function mkFire() {
    function draw(f) { const out = C().fire.out[f.n], st = out ? 'o' : 'l'; if (st === f.st) return; f.st = st; const y = f.y;
      if (st === 'l') { put(f.i, f.x, y + 0.07, f.z, 0.2, 0.55, 0.2, 0xff8a2a, 0, false, true); put(f.i + 1, f.x + 0.07, y + 0.07, f.z + 0.05, 0.12, 0.38, 0.12, 0xffd04a, 0.5, false, true); put(f.i + 2, f.x - 0.07, y + 0.07, f.z - 0.04, 0.11, 0.32, 0.11, 0xffc23a, 1, false, true); put(f.i + 3, 0, 0, 0); }
      else { for (let k = 0; k < 3; k++) put(f.i + k, 0, 0, 0); put(f.i + 3, f.x, y + 0.03, f.z, 0.32, 0.07, 0.32, 0x4a4642); }   /* 꺼짐 = 재 */
      label(f); }
    function label(f) { const h = f.hot && f.hot.hot; if (!h) return; const out = C().fire.out[f.n]; h.label = out ? (en() ? '🔥 The campfire is out' : '🔥 꺼진 모닥불') : f.warmed ? (en() ? '💧 Pour water to put it out (done camping)' : '💧 물 부어 끄기 (캠핑 마치기)') : (en() ? '🔥 Warm up by the campfire' : '🔥 모닥불 쬐기'); }
    function use(f) { if (!ok()) return; const out = C().fire.out[f.n];
      if (out) { map.hud.toast(out === 'k' ? (en() ? '🔥 Camping is done for today — the keeper lights it again at 9 tomorrow' : '🔥 오늘 캠핑은 마쳤어요 — 내일 아침 9시에 관리인이 다시 피워요') : out === 'r' ? (en() ? '🌧 The rain put it out — the keeper relights it after the rain' : '🌧 비가 불을 껐어요 — 비가 그치면 관리인이 다시 피워요') : (en() ? '🔥 The keeper lights it at 9 in the morning' : '🔥 아침 9시에 관리인이 피워요'), 3); return; }
      if (!f.warmed) { f.warmed = true; label(f); map.hud.toast(en() ? '🔥 So warm! Walk, never run, near a fire. When you are done, press E to put it out' : '🔥 따뜻해요. 불 옆에선 걸어요 — 다 쬐면 E로 물을 부어 꺼요', 3.4); return; }
      try { map.player.act('water', { at: [f.x, f.y + 0.2, f.z], msg: null, midAt: 1.3, onMid: () => douse(f, 'kid') }); } catch (e) { douse(f, 'kid'); } }   /* 물뿌리개로 붓는 몸짓 → 물이 닿는 때에 꺼짐 */
    function douse(f, why) { if (!ok() || C().fire.out[f.n]) return; C().fire.out[f.n] = why === 'rain' ? 'r' : 'k'; A.GAME.mark(); f.warmed = false; draw(f); steamAt(f.x, f.y + 0.35, f.z, why === 'rain' ? 10 : 18, true, 0.5);
      if (map.tone) { map.tone(2300, 0, 0.7, 'sawtooth', 0.025, 700); map.tone(1600, 0.12, 0.6, 'sawtooth', 0.02, 500); }   /* 쉬익 */
      if (why === 'kid') { map.hud.toast(en() ? '💧 Hiss — the fire is out and white steam rises. Always use fire with a grown-up' : '💧 쉬익 — 불이 꺼지고 하얀 김이 올라요. 불은 꼭 어른과 함께 써요', 3.6); discover('fire', 'kid', false, 4200); } }
    function sec(E, dm) { const F = C().fire; if (E.rain) F.dryM = 0; else F.dryM = Math.min(999, F.dryM + dm); let burst = false;
      for (const f of FI) { const st = F.out[f.n], d = Math.hypot(f.x - E.me.x, f.z - E.me.z);
        if (!st && E.rain) { if (d < 40 && !burst) { burst = true; douse(f, 'rain'); if (d < 30) discover('fire', 'rain', false, 3000); } else if (d >= 40) { F.out[f.n] = 'r'; f.warmed = false; } }   /* 가까운 불은 하나씩(초마다) 김을 내며 꺼짐 */
        else if (st === 'n' && !E.rain && E.m >= 540) delete F.out[f.n];
        else if (st === 'r' && !E.rain && F.dryM >= 40 && E.m >= 540 && E.m < 1380) delete F.out[f.n];
        draw(f); } }
    return { id: 'fire', slots: n => { for (const f of FI) { f.i = n; n += 4; } return n; }, reset: () => { for (const f of FI) f.st = ''; }, sec,
      hots: () => { for (const f of FI) { f.hot = A.map.interact.add({ kind: 'game', x: f.x + 1.4, z: f.z, y: f.y, r: 2.2, label: ' ', use: () => use(f) }); A.enth.push(f.hot); label(f); } },
      day: () => { const c = C(); c.fire.out = {}; for (const f of FI) { c.fire.out[f.n] = 'n'; f.warmed = false; } c.fire.d = S().day; },   /* 밤사이 관리인이 끔 → 아침 9시에 다시 피움 */
      set: o => { const c = C(); if (o.fireOut != null) { const f = FI[o.fireOut]; if (f) douse(f, o.why || 'kid'); } if (o.relight) c.fire.out = {}; },
      api: { fireUse: i => { const f = FI[i | 0]; if (f) use(f); return f ? { label: f.hot.hot.label } : null; } } }; }

  // ───────── 규칙 5: 모닥불 곁 눈·얼음이 녹아 웅덩이 → 0℃ 아래면 다시 얼음(겨울만) ─────────
  //   녹은 땅(어두운 흙 둥근 판) + 녹은 물 넷(1.3m 둘레) · 불이 켜져 20분 = 물 · 불이 꺼지고 0℃ 아래 30분 = 얼음 · 밤사이(잠) = 얼음
  //   눈사람(N)이 켜진 불 2.6m 안이면 8초 동안 물방울·김을 내며 녹아 웅덩이 → 0℃ 아래 20분 = 얼음 · 불 곁 15분·한낮 60분 = 다시 물 · 맑은 낮 세 시간이면 마름
  function mkMelt() { const MELTC = { w: 0x7d97ad, i: 0xdde9f2 }; let sp0 = -1; const keyOf = [];
    function ringDraw(f, s) { const key = s || '-'; if (f.ring === key) return; f.ring = key; const i = f.mi; if (!s) { for (let k = 0; k < 5; k++) put(i + k, 0, 0, 0); return; }
      put(i, f.x, f.y + 0.025, f.z, 1.75, 0.004, 1.75, 0x7a6650); for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.6; put(i + 1 + k, f.x + Math.cos(a) * 1.25, f.y + 0.035, f.z + Math.sin(a) * 1.25, 0.42, 0.004, 0.3, MELTC[s], a); } }
    function sec(E, dm, dt) { const c = C(), win = E.sea === 'winter'; if (E.paused) dt = 0;
      for (const f of FI) { const lit = !c.fire.out[f.n], R = c.ring[f.n] || (c.ring[f.n] = { s: '', t: 0 }), d = Math.hypot(f.x - E.me.x, f.z - E.me.z); let ns = R.s;
        if (!win) ns = ''; else if (lit) { R.t = R.s === 'w' ? 0 : R.t + dm; if (R.s !== 'w' && R.t >= 20) ns = 'w'; } else if (E.T0 < 0 && R.s === 'w') { R.t += dm; if (R.t >= 30) ns = 'i'; } else R.t = 0;
        if (ns !== R.s) { const was = R.s; R.s = ns; R.t = 0; A.GAME.mark(); if (d < 22 && ns === 'w') discover('melt', 'ring'); if (d < 22 && was === 'w' && ns === 'i') discover('melt', 'ring', true); }
        if (R.s === 'i' && d < 15 && c.found.melt) discover('melt', 'ring', true, 1200);   /* 녹았던 자리가 얼어 있는 걸 보면(밤사이 얾 포함) */
        ringDraw(f, R.s); }
      const SN = A.snowmen(); if (win && SN && SN.length) for (let k = SN.length - 1; k >= 0; k--) { const s = SN[k], f = nearFire(s[0], s[2], 2.6); if (!f) { s.m9 = 0; continue; } s.m9 = (s.m9 || 0) + dt;
        for (let i = 0; i < 3; i++) emit(1, s[0] + (Math.random() - 0.5) * 0.6, s[1] + 0.4 + Math.random() * 0.6, s[2] + (Math.random() - 0.5) * 0.6, 0, -0.2, 0, 0.5, 0.07, 0.9, false, i * 0.3); steamAt(s[0], s[1] + 1.0, s[2], 1, false, 0.4);
        if (s.m9 >= 8) { SN.splice(k, 1); A.snowDraw(); c.sp.push([+s[0].toFixed(2), +s[1].toFixed(2), +s[2].toFixed(2), 'w', 0]); if (c.sp.length > 6) c.sp.shift(); A.GAME.mark(); map.hud.toast(en() ? '⛄ The snowman melted by the fire — now it is a puddle' : '⛄ 모닥불 곁 눈사람이 녹아 웅덩이가 되었어요', 3); discover('melt', 'snowman', false, 3600); } }
      if (!win && c.sp.length) { c.sp.length = 0; A.GAME.mark(); }
      for (let k = c.sp.length - 1; k >= 0; k--) { const p = c.sp[k], f = nearFire(p[0], p[2], 2.6), d = Math.hypot(p[0] - E.me.x, p[2] - E.me.z); let ns = p[3];
        if (p[3] === 'w') { if (E.T0 < 0 && !nearFire(p[0], p[2], 2.2)) { p[4] += dm; if (p[4] >= 20) ns = 'i'; } else if (E.T0 > 0 && E.sun0) { p[4] += dm; if (p[4] >= 180) { c.sp.splice(k, 1); A.GAME.mark(); continue; } } }
        else if (f || (E.T0 > 0 && E.phase === 'day' && E.m > 600)) { p[4] += dm; if (p[4] >= (f ? 15 : 60)) ns = 'w'; }
        if (ns !== p[3]) { const was = p[3]; p[3] = ns; p[4] = 0; A.GAME.mark(); if (d < 22) discover('melt', 'snowman', was === 'w' && ns === 'i'); }
        if (p[3] === 'i' && d < 15 && c.found.melt) discover('melt', 'snowman', true, 1200); }
      for (let k = 0; k < 6; k++) { const p = c.sp[k], i = sp0 + k; if (!p) { put(i, 0, 0, 0); keyOf[k] = ''; continue; } const key = p[3] + p[0]; if (keyOf[k] === key) continue; keyOf[k] = key; put(i, p[0], p[1] + 0.045, p[2], 0.75, 0.004, 0.62, MELTC[p[3]] || MELTC.w, 0.4); } }   /* 녹은 땅 판(+0.025)·녹은 물(+0.035)보다 위 — 같은 높이 면 X */
    return { id: 'melt', slots: n => { for (const f of FI) { f.mi = n; n += 5; } sp0 = n; return n + 6; }, reset: () => { for (const f of FI) f.ring = ''; keyOf.length = 0; }, sec,
      day: E => { if (E.sea !== 'winter') return; const c = C(); for (const k in c.ring) if (c.ring[k].s === 'w') { c.ring[k].s = 'i'; c.ring[k].t = 0; } for (const p of c.sp) if (p[3] === 'w') { p[3] = 'i'; p[4] = 0; } },   /* 밤사이 0℃ 아래 = 아침엔 얼어 있음 */
      info: o => { o.sp = C().sp.map(p => p[3]); }, set: o => { if (o.ring) { const c = C(); for (const k in c.ring) c.ring[k].t = 999; } } }; }

  // ───────── 규칙 6: 민들레 홀씨 → 바람 쪽 → 사흘 뒤 꽃(봄·여름 · 공원 풀밭) ─────────
  //   하루 바람 하나(WIND-1 전 임시 · 마을 id + 날 씨앗 · 여덟 방위) · E '후~' = 허리 굽힘 → 홀씨 스무 점이 바람 쪽으로 · 씨가 앉을 흙(빈 땅)을 찾아 저장 · 사흘 뒤 아침 한 줄 + 꽃 다섯
  const DIR8 = [['북', 'north'], ['북동', 'north-east'], ['동', 'east'], ['남동', 'south-east'], ['남', 'south'], ['남서', 'south-west'], ['서', 'west'], ['북서', 'north-west']];
  const windOf = day => { const R = A.rng('chem-wind:' + A.id + ':' + day); const k = Math.floor(R() * 8) % 8, a = k * Math.PI / 4 + (R() - 0.5) * 0.3; return { k, a, x: Math.sin(a), z: -Math.cos(a) }; };   /* 방위 0 = 북 = −z */
  function mkSeed() { const SPOT = [], FLW = []; let fl0 = -1, flk = '';
    const inSea = s => s === 'spring' || s === 'summer';
    function init() { SPOT.length = 0; const R = A.rng('chem-dd:' + A.id), cand = [];   /* 자리 = 공원·풀밭 안 빈 땅(나무·길·물 X · 둘레 30m가 마을 안) · 여덟 곳 · 서로 25m 넘게 · 한 곳에 홀씨 셋 */
      for (const sh of A.grass()) { const [x0, z0, x1, z1] = A.bboxOf(sh); for (let z = z0 + 5; z < z1 - 5; z += 11) for (let x = x0 + 5; x < x1 - 5; x += 11) { const px = x + (R() - 0.5) * 6, pz = z + (R() - 0.5) * 6; if (!A.inShape(sh, px, pz) || A.sdOf(sh, px, pz) > -3 || !A.okGround(px, pz) || ![[30, 0], [-30, 0], [0, 30], [0, -30]].every(([u, v]) => A.walk(px + u, pz + v))) continue; cand.push([px, pz, R()]); } }
      cand.sort((a, b) => a[2] - b[2]); for (const [x, z] of cand) { if (SPOT.length >= 8) break; if (SPOT.some(s => Math.hypot(s.x - x, s.z - z) < 25)) continue; const pf = [[0, 0], [0.5, 0.3], [-0.35, 0.45]].map(([dx, dz]) => [x + dx, z + dz, A.gy(x + dx, z + dz)]); SPOT.push({ x, z, y: A.gy(x, z), pf, i: -1, hot: null, st: '' }); } }
    function spotDraw(s, sea) { const b = C().blown[SPOT.indexOf(s)], gone = b != null && S().day < b + 2, st = !inSea(sea) ? '' : gone ? 'b' : 'h'; if (st === s.st) return; s.st = st;   /* 분 민들레는 이틀 뒤 다시 홀씨 */
      s.hot.hot.off = st !== 'h'; s.hot.hot.label = en() ? '🌬 Blow the dandelion seeds' : '🌬 민들레 홀씨 후~ 불기';
      s.pf.forEach(([x, z, y], k) => { const i = s.i + k * 4; if (!st) { for (let q = 0; q < 4; q++) put(i + q, 0, 0, 0); return; }
        put(i, x, y + 0.012, z, 0.17, 0.03, 0.17, 0x5a9a40, k); put(i + 1, x, y + 0.01, z, 0.016, 0.34, 0.016, 0x7fae4a);   /* 잎 방석 + 꽃대 */
        if (st === 'h') { put(i + 2, x, y + 0.42, z, 0.11, 0.11, 0.11, 0xf2f2ea, k); put(i + 3, x, y + 0.42, z, 0.11, 0.11, 0.11, 0xe8e8de, k, false, false, Math.PI); }   /* 홀씨 공 = 반구 둘(아래는 뒤집음) */
        else { put(i + 2, 0, 0, 0); put(i + 3, 0, 0, 0); } }); }
    function blow(s) { if (!ok() || s.st !== 'h') return; const c = C(), day = S().day; c.blown[SPOT.indexOf(s)] = day; A.GAME.mark(); s.hot.hot.off = true;
      try { map.player.act('shoes', { at: [s.x, s.y, s.z] }); } catch (e) { /* 몸짓 없음 */ }
      setTimeout(() => { if (!ok()) return; const W = windOf(day); s.st = '?'; spotDraw(s, A.sea()); flush();
        for (let i = 0; i < 20; i++) { const [px, pz, py] = s.pf[i % 3], v = 2.4 + Math.random() * 1.2, sp = (Math.random() - 0.5) * 0.5, cx = W.x * Math.cos(sp) - W.z * Math.sin(sp), cz = W.x * Math.sin(sp) + W.z * Math.cos(sp); emit(3, px + (Math.random() - 0.5) * 0.2, py + 0.42, pz + (Math.random() - 0.5) * 0.2, cx * v, 0.25 + Math.random() * 0.35, cz * v, 5 + Math.random() * 1.5, 0.13, 0.95, false, i * 0.05); }
        let land = null; for (const sp of [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9]) { for (const R of [22, 16, 28, 12, 34, 8]) { const a = W.a + sp, x = s.x + Math.sin(a) * R, z = s.z - Math.cos(a) * R; if (A.okGround(x, z) && !A.inSchool(x, z) && [[6, 0], [-6, 0], [0, 6], [0, -6]].every(([u, v]) => A.walk(x + u, z + v))) { land = [x, z, R]; break; } } if (land) break; }   /* 바람 쪽 흙(빈 땅 · 마을 안)에 앉음 */
        if (land) { c.seeds.push({ x: +land[0].toFixed(1), z: +land[1].toFixed(1), d: day + 3, k: W.k, r: land[2] }); if (c.seeds.length > 6) c.seeds.shift(); A.GAME.mark(); }
        const dw = tx(DIR8[W.k]); map.hud.toast(land ? (en() ? '🌬 The wind blows ' + dw + ' — the seeds fly that way. Look over there in three days' : '🌬 바람이 ' + dw + '쪽으로 불어 홀씨가 날아가요 — 사흘 뒤에 그쪽을 살펴봐요') : (en() ? '🌬 The wind blows ' + dw + ' — the seeds flew over water or road with no soil to land on. Try again when the wind changes' : '🌬 바람이 ' + dw + '쪽으로 불어 홀씨가 흙이 없는 곳(물·길)으로 날아갔어요 — 바람이 바뀐 날 또 불어 봐요'), 3.6); }, 900); }
    function flowerDraw(sea) { const c = C(), key = c.seeds.map(r => r.x + ':' + r.d).join('|') + ':' + S().day + ':' + (sea === 'winter'); if (flk === key) return; flk = key; FLW.length = 0;   /* 꽃 = 씨가 앉은 둘레 2.5m에 다섯 송이(빈 땅만) · 겨울엔 쉼 */
      for (let n = 0; n < 6; n++) { const r = c.seeds[n], base = fl0 + n * 20, bloom = r && S().day >= r.d && sea !== 'winter', R = A.rng('chem-fl:' + (r ? r.x + ':' + r.z : n));
        for (let k = 0; k < 5; k++) { const i = base + k * 4; let x = 0, z = 0, y = 0, good = false; if (bloom) { x = r.x + (R() - 0.5) * 5; z = r.z + (R() - 0.5) * 5; good = A.okGround(x, z); y = A.gy(x, z); }
          if (!good) { for (let q = 0; q < 4; q++) put(i + q, 0, 0, 0); continue; } FLW.push([x, z]);
          put(i, x, y + 0.012, z, 0.16, 0.03, 0.16, 0x5a9a40, k); put(i + 1, x, y + 0.01, z, 0.014, 0.2, 0.014, 0x7fae4a); put(i + 2, x, y + 0.22, z, 0.1, 0.05, 0.1, 0xf6d23c, k); put(i + 3, x, y + 0.22, z, 0.1, 0.035, 0.1, 0xe8b830, k, false, false, Math.PI); } } }
    function sec(E) { for (const s of SPOT) spotDraw(s, E.sea); flowerDraw(E.sea); const c = C(), me = E.me;
      if (!c.found.seed) for (const r of c.seeds) if (S().day >= r.d && E.sea !== 'winter' && Math.hypot(r.x - me.x, r.z - me.z) < 14) { discover('seed', 'wind'); break; } }
    function day(E) { const d = S().day; for (const r of C().seeds) if (r.d === d && !r.told && E.sea !== 'winter') { r.told = 1; const dw = tx(DIR8[r.k]); setTimeout(() => { if (ok()) map.hud.toast(en() ? '🌼 The dandelion seeds you blew three days ago have bloomed — about ' + r.r + ' m ' + dw + ' of where the dandelions were' : '🌼 사흘 전에 분 민들레 씨가 꽃을 피웠어요 — 민들레가 있던 곳에서 ' + dw + '쪽으로 ' + r.r + 'm쯤', 4.5); }, 3200); } }
    return { id: 'seed', init, slots: n => { for (const s of SPOT) { s.i = n; n += 12; } fl0 = n; return n + 6 * 5 * 4; }, reset: () => { for (const s of SPOT) s.st = ''; flk = ''; }, sec, day,
      hots: () => { for (const s of SPOT) { s.hot = A.map.interact.add({ kind: 'game', x: s.x, z: s.z, y: s.y, r: 1.7, label: ' ', use: () => blow(s) }); s.hot.hot.off = true; A.enth.push(s.hot); } },
      info: o => { const c = C(); o.spots = SPOT.map(s => ({ x: +s.x.toFixed(1), z: +s.z.toFixed(1), st: s.st })); o.seeds = c.seeds.slice(); o.flowers = FLW.length; o.wind = windOf(S().day).k; },
      set: o => { const c = C(); if (o.blown === null) c.blown = {}; if (o.seedsDue) for (const r of c.seeds) r.d = S().day; },
      api: { blow: i => { const s = SPOT[i | 0]; if (s) blow(s); return !!s; }, wind: d => windOf(d ?? S().day) } }; }

  // ───────── LAWS-1 🧪 실험: 가방 물건 × 그 자리(물·바다·불·햇볕·추위·눈·흙·바람) — 표 = town_laws.js · 가방(I) 칸 밑 단추 · 그 자리에서 몸으로 일어남 ─────────
  //   그림 = 그림 글자 판(스프라이트) 다섯까지(하는 중 하나 + 널어 둔 것 넷) · 움직임은 실험하는 몇 초 동안만 rAF · 둥근 판 = 섞인 물빛·제설 자국·싹
  //   뜨고 가라앉기는 처음 넣는 물건마다 '뜰까? 가라앉을까?'를 먼저 고름(예상 → 관찰) · 알아낸 것 = 수첩 🔬 → 🧪 해 본 실험(과학·사회 카드)
  function mkLaws() { const SPR = []; let RUN = null, raf = 0, L0 = -1;
    const E9 = e => [...e][0], nm = e => (A.item ? A.item(e) : e), DOME = { cloud: 0, dei: 1, sprout: 7 }, FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    function spr(i) { let o = SPR[i]; if (!o) { const cv = document.createElement('canvas'); cv.width = cv.height = 96; const tex = new T3.CanvasTexture(cv); tex.colorSpace = T3.SRGBColorSpace; const mat = new T3.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }); A.own(mat); const sp = new T3.Sprite(mat); sp.renderOrder = 7; sp.userData.fx = 1; sp.visible = false; o = SPR[i] = { sp, cv, tex, mat, e: '' }; } if (!o.sp.parent) A.root().add(o.sp); return o; }
    function sprSet(o, e, sc) { if (o.e !== e) { o.e = e; const g = o.cv.getContext('2d'), ch = [...e]; g.clearRect(0, 0, 96, 96); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '70px ' + FONT; g.fillText(ch[0], 48, 52); if (ch.length > 1) { g.font = '34px ' + FONT; g.fillText(ch.slice(1).join(''), 76, 22); } o.tex.needsUpdate = true; }
      o.sp.scale.set(sc || 0.75, sc || 0.75, 1); o.mat.opacity = 1; o.mat.color.setScalar(UDIM.value); o.sp.visible = true; }
    // 지금 선 자리에서 되는 것(가방을 열 때 한 번 · 1초 칸 알림) — 앞 1.4~3.4m 물 · 3.2m 안 켜진 모닥불 · 앞 1.3m 땅(햇볕·눈·추위·흙·바람)
    function ctx() { const out = {}; if (!ok() || A.inb() || A.ride() || A.bike() || A.swim()) return out; const me = map.player.get(), a = (me.h || 0) * Math.PI / 180, sn = Math.sin(a), cs = Math.cos(a);
      for (const d of [1.4, 2.4, 3.4]) { const x = me.x + sn * d, z = me.z - cs * d, w = A.water(x, z); if (w) { let q = { x, z, y: w.y }; for (const d2 of [3.4, 2.8]) { if (d2 <= d) break; const x2 = me.x + sn * d2, z2 = me.z - cs * d2, w2 = A.water(x2, z2); if (w2) { q = { x: x2, z: z2, y: w2.y }; break; } } out[w.sea ? 'sea' : 'water'] = q; if (w.river && A.flow) { let rq = null; for (const d3 of [3.4, 2.8, 2.4]) { const x3 = me.x + sn * d3, z3 = me.z - cs * d3, w3 = A.water(x3, z3); if (w3 && w3.river && w3.deep) { rq = { x: x3, z: z3, y: w3.y }; break; } } const F = rq && A.flow(rq.x, rq.z); if (F) out.river = { ...rq, fx: F.x, fz: F.z, sea: F.sea }; } break; }   /* 나뭇잎 배 = 물가 테두리가 아닌 물 안(0.6m 넘게)에서만 */   /* 강이면 흐르는 쪽도 */ }   /* 놓는 자리 = 물 안에서 될수록 먼 곳(내 몸에 가리지 않게) */
      const f = nearFire(me.x, me.z, 3.2); if (f) out.fire = f;
      const fx = me.x + sn * 2.2, fz = me.z - cs * 2.2, gy = A.gy(fx, fz);   /* 앞 2.2m(내 몸에 가리지 않게) */
      if (!out.water && !out.sea && Math.abs(gy - me.y) < 0.8 && !A.blk(fx, fz, gy + 0.5) && !A.water(fx, fz)) { const P = { x: fx, z: fz, y: gy }, E = lastE, sea = A.sea(), T = A.tempAt ? A.tempAt(fx, gy, fz) : A.temp0();
        if (E && E.sun0 && !eaves(fx, fz)) out.sun = P; if (sea === 'winter' || A.wx() === 'snow') out.snow = P; if (T < 0) out.cold = P; if (A.okGround(fx, fz)) out.soil = P; out.wind = P; }
      return out; }
    const pairOf = (e, at) => PAIRS.find(p => p[0] === at && p[1] === e);
    function btns(e, cx) { if (!cx) return ''; return ORDER.filter(at => cx[at] && pairOf(e, at)).slice(0, 2).map(at => '<br><button class="sub" data-law="' + e + '" data-at="' + at + '" style="min-height:30px;padding:3px 7px;margin-top:3px">' + AT[at][0] + ' ' + (en() ? AT[at][2] : AT[at][1]) + '</button>').join(''); }
    function run(e, at) { const P = pairOf(e, at), cx = ctx()[at]; if (!P || !ok()) return; if (!cx) { map.hud.toast(en() ? 'Not here — face the spot and try again' : '여기선 안 돼요 — 그 자리를 보고 다시 해 봐요', 2.4); return; }
      if ((P[3] === 'float' || P[3] === 'sink') && !C().pr[e]) { const P9 = A.openP('<h3>' + AT[at][0] + ' ' + A.esc(E9(e) + ' ' + nm(e)) + '</h3><div class="sm">' + (en() ? 'Guess first — what will happen in the water?' : '먼저 예상해 봐요 — 물에 넣으면 어떻게 될까요?') + '</div><div class="row"><button data-g="float">⛵ ' + (en() ? 'It will float' : '둥실 뜰 것 같아') + '</button><button data-g="sink">⚓ ' + (en() ? 'It will sink' : '꼬르륵 가라앉을 것 같아') + '</button></div>', false, 'law');
        P9.onclick = ev => { const b = ev.target.closest('button'); if (!b || !b.dataset.g) return; C().pr[e] = b.dataset.g; A.GAME.mark(); A.closeP(); go(e, at, P, cx, b.dataset.g); }; return; }
      go(e, at, P, cx, null); }
    const KEEP = { float: 1, close: 1, heat: 1, keep: 1 }, CLOUD = e => (e === '🥛' ? 0xf4f4ee : e === '🌾' ? 0xece2c8 : 0xc98a3a);
    const DUR = { float: 3.2, close: 3.4, sink: 2.4, dissolve: 2.2, mix: 2.6, swim: 2.6, roast: 6, flare: 1.6, heat: 3.2, melt: 2.2, dry: 0.8, freeze: 0.8, deice: 1.6, sprout: 1.4, compost: 1.4, fly: 4.2, keep: 1.6, drift: 7 };
    function go(e, at, P, cx, guess) { const [, , law, act, out, n] = P; if (RUN) return false; if (!KEEP[act] && !A.bagTake(e)) return false; const me = map.player.get(), o = spr(0);
      let tx9 = cx.x, ty9 = (cx.y ?? A.gy(cx.x, cx.z)) + (at === 'water' || at === 'sea' ? 0.12 : 0.28), tz9 = cx.z;
      if (at === 'fire') { const dx = me.x - cx.x, dz = me.z - cx.z, d = Math.hypot(dx, dz) || 1, r = act === 'flare' ? 0.05 : 0.6; tx9 = cx.x - dz / d * r; tz9 = cx.z + dx / d * r; ty9 = cx.y + 0.3; }   /* 불 옆(나와 불을 잇는 줄의 옆 — 내 몸에 가리지 않게) */
      sprSet(o, e); o.sp.position.set(me.x, me.y + 1.1, me.z);
      RUN = { e, at, law, act, out, n, guess, o, t0: performance.now(), x0: me.x, y0: me.y + 1.1, z0: me.z, x: tx9, y: ty9, z: tz9, W: act === 'fly' ? windOf(S().day) : null, dur: DUR[act] || 2, swap: false, fx: 0, fl: at === 'river' ? cx : null };
      if (act === 'mix') put(L0 + DOME.cloud, tx9, ty9 - 0.1, tz9, 0.2, 0.004, 0.2, CLOUD(e));
      raf = requestAnimationFrame(step); return true; }
    function step() { raf = 0; const R = RUN; if (!R || !ok()) { if (R) R.o.sp.visible = false; RUN = null; return; } const t = (performance.now() - R.t0) / 1000, sp = R.o.sp, p = sp.position, k0 = Math.min(1, t / 0.5), u = Math.max(0, t - 0.5), a = R.act;
      if (t < 0.5) p.set(R.x0 + (R.x - R.x0) * k0, R.y0 + (R.y - R.y0) * k0 + Math.sin(k0 * Math.PI) * 0.6, R.z0 + (R.z - R.z0) * k0);   /* 손에서 그 자리로 포물선 */
      else { p.set(R.x, R.y, R.z);
        if (a === 'float' || a === 'close') { p.y += Math.sin(u * 3.2) * 0.05; if (a === 'close') sp.scale.x = 0.75 * Math.max(0.62, 1 - u * 0.25); }
        else if (a === 'sink') { p.y -= Math.min(1, u / 1.6) * 0.9; R.o.mat.opacity = Math.max(0, 1 - u / 1.8); if (++R.fx % 9 === 0) emit(0, R.x + (Math.random() - 0.5) * 0.2, R.y - 0.05, R.z + (Math.random() - 0.5) * 0.2, 0, 0.6, 0, 0.7, 0.12, 0.5, false, 0); }   /* 물방울 거품 */
        else if (a === 'dissolve' || a === 'melt' || a === 'compost' || a === 'sprout') { const q = Math.max(0, 1 - u / 1.4); sp.scale.set(0.75 * q + 0.01, 0.75 * q + 0.01, 1); if (a === 'compost' || a === 'sprout') p.y -= (1 - q) * 0.25; if (a === 'melt' && ++R.fx % 7 === 0) emit(1, R.x, R.y, R.z, 0, -0.3, 0, 0.5, 0.08, 0.9, false, 0); }
        else if (a === 'mix') { R.o.mat.opacity = Math.max(0, 1 - u / 1.2); const r = 0.2 + Math.min(1, u / 2) * 1.1; put(L0 + DOME.cloud, R.x, R.y - 0.1, R.z, r, 0.004, r, CLOUD(R.e)); flush(); }
        else if (a === 'swim') { const dx = R.x - R.x0, dz = R.z - R.z0, d = Math.hypot(dx, dz) || 1; p.x += dx / d * u * 1.4; p.z += dz / d * u * 1.4; p.y -= u * 0.25; R.o.mat.opacity = Math.max(0, 1 - u / 2); }
        else if (a === 'roast' || a === 'heat') { if (++R.fx % 20 === 0) emit(0, R.x, R.y + 0.2, R.z, 0, 0.5, 0, 1.4, 0.3, 0.35, false, 0); if (a === 'roast' && !R.swap && u > 4) { R.swap = true; sprSet(R.o, R.out); steamAt(R.x, R.y + 0.2, R.z, 3, false, 0.3); } }
        else if (a === 'flare') { if (!R.fx) { R.fx = 1; steamAt(R.x, R.y + 0.4, R.z, 14, true, 0.6); if (map.tone) map.tone(180, 0, 0.5, 'sawtooth', 0.05, 60); } const q = Math.max(0.01, 0.75 - u * 0.7); sp.scale.set(q, q, 1); }
        else if (a === 'drift' && R.fl) { const dt9 = Math.min(0.1, (t - (R.lt || t)) || 0); R.lt = t; if (R.px == null) { R.px = R.x; R.pz = R.z; R.vx = R.fl.fx; R.vz = R.fl.fz; } const F = A.flow(R.px, R.pz); if (F) { R.vx = F.x; R.vz = F.z; } const nx = R.px + R.vx * 0.9 * dt9, nz = R.pz + R.vz * 0.9 * dt9, w9 = A.water(nx, nz); if (w9 && w9.deep) { R.px = nx; R.pz = nz; } p.x = R.px; p.z = R.pz; p.y += Math.sin(u * 3) * 0.04; sp.scale.set(0.6, 0.6, 1); R.o.mat.opacity = Math.max(0, 1 - Math.max(0, u - 5.5) / 1); }   /* 강 줄기를 따라 떠내려감(물 안에서만 · 둔치에 닿으면 그 자리에서 출렁) */
        else if (a === 'fly' && R.W) { const d = u * 3.2; p.x += R.W.x * d; p.z += R.W.z * d; p.y += Math.sin(Math.min(1, u / 3.6) * Math.PI) * 2.2; R.o.mat.opacity = Math.max(0, 1 - Math.max(0, u - 2.8)); } }
      if (t >= R.dur + 0.5) { done(R); return; } raf = requestAnimationFrame(step); }
    function done(R) { RUN = null; const c = C(), a = R.act, en9 = en(); R.o.sp.visible = false; if (a === 'mix') { put(L0 + DOME.cloud, 0, 0, 0); flush(); }
      const it = E9(R.e) + ' ' + nm(R.e); let msg = '';
      if (a === 'float') msg = en9 ? it + ' floated — fished it back out' : it + ' 둥실 떴어요 — 건져 올렸어요';
      else if (a === 'close') msg = en9 ? 'The wet pine cone closed its scales — fished it out' : '젖은 솔방울이 비늘을 오므렸어요 — 건져 올렸어요';
      else if (a === 'sink') msg = R.law === 'release' ? (en9 ? 'The clam sank and burrowed into the sand' : '조개가 가라앉아 모래 속으로 숨었어요') : (en9 ? it + ' sank — glub glub' : it + ' 꼬르륵 가라앉았어요');
      else if (a === 'dissolve') msg = en9 ? 'The salt melted away out of sight' : '소금이 스르르 녹아 안 보여요';
      else if (a === 'mix') msg = R.e === '🌾' ? (en9 ? 'The flour drifted and settled — it did not dissolve' : '밀가루는 녹지 않고 떠다니다 가라앉았어요') : (en9 ? it + ' spread into the water' : it + ' 물에 퍼져 섞였어요');
      else if (a === 'swim') msg = en9 ? 'The fish swam away' : '물고기가 헤엄쳐 갔어요';
      else if (a === 'roast') { A.bagAdd(R.out, 1); msg = en9 ? 'Roasted! ' + E9(R.out) + ' ' + nm(R.out) + ' (bag)' : '구웠어요! ' + E9(R.out) + ' ' + nm(R.out) + ' (가방)'; }
      else if (a === 'flare') msg = en9 ? 'Whoosh — the fire grew bigger' : '화르륵 — 불이 커졌어요';
      else if (a === 'heat') msg = en9 ? 'The pebble got warm — and stays warm a long time' : '조약돌이 따끈해졌어요 — 한참 동안 따뜻해요';
      else if (a === 'melt') msg = en9 ? it + ' melted away' : it + ' 녹아 버렸어요';
      else if (a === 'dry' || a === 'freeze') { if (c.rack.length >= 4) { const old = c.rack.shift(); A.bagAdd(old[0], 1); } c.rack.push([R.e, R.out, a, +R.x.toFixed(2), +R.y.toFixed(2), +R.z.toFixed(2), 0]); A.GAME.mark(); rackDraw(); msg = a === 'dry' ? (en9 ? 'Laid out in the sun — about 30 sunny minutes (game clock) to dry' : '햇볕에 널었어요 — 맑은 낮 30분(놀이 시계)이면 말라요') : (en9 ? 'Left in the cold — about 20 minutes below 0℃ to freeze' : '추운 곳에 두었어요 — 0℃ 아래 20분이면 얼어요'); }
      else if (a === 'deice') { c.dei.push([+R.x.toFixed(2), +R.y.toFixed(2), +R.z.toFixed(2), S().day]); if (c.dei.length > 6) c.dei.shift(); A.GAME.mark(); deiDraw(); flush(); steamAt(R.x, R.y, R.z, 2, false, 0.6); msg = en9 ? 'The snow melted where the salt fell' : '소금을 뿌린 자리 눈이 녹았어요'; }
      else if (a === 'sprout') { c.plant.push([R.e, R.n || 2, +R.x.toFixed(2), +R.y.toFixed(2), +R.z.toFixed(2), S().day + 3]); if (c.plant.length > 6) c.plant.shift(); A.GAME.mark(); plantDraw(); flush(); msg = en9 ? 'Planted — come back in three days' : '심었어요 — 사흘 뒤에 와 봐요'; }
      else if (a === 'drift') msg = R.fl && R.fl.sea ? (en9 ? 'The leaf boat drifted downstream — this river runs to the sea' : '나뭇잎 배가 물결을 따라 떠내려갔어요 — 이 강물은 바다로 가요') : (en9 ? 'The leaf boat drifted downstream' : '나뭇잎 배가 낮은 쪽으로 떠내려갔어요');
      else if (a === 'compost') msg = en9 ? 'Buried in the soil' : '흙에 묻었어요';
      else if (a === 'fly') msg = en9 ? 'The wind carried it ' + tx(DIR8[R.W ? R.W.k : 0]) : '바람이 ' + tx(DIR8[R.W ? R.W.k : 0]) + '쪽으로 데려갔어요';
      else if (a === 'keep') msg = R.law === 'hardy' ? (en9 ? 'The cabbage does not mind the cold at all' : '배추는 추위에도 끄떡없어요') : (en9 ? 'It does not melt in the cold' : '추운 데선 안 녹아요');
      if (R.guess) { const real = a === 'float' || a === 'close' ? 'float' : 'sink'; msg += R.guess === real ? (en9 ? ' · your guess was right ✔' : ' · 예상이 맞았어요 ✔') : (en9 ? ' · not what you guessed — why? (Notebook → Experiments)' : ' · 예상과 달랐어요 — 왜일까요? (수첩 → 실험)'); }
      map.sfx && map.sfx(a === 'sink' || a === 'dissolve' ? 'pop' : 'tick'); map.hud.toast(AT[R.at][0] + ' ' + msg, 3.4); if (a !== 'dry' && a !== 'freeze' && a !== 'sprout') found(R.law, R.e, a); }   /* 널기·얼리기·심기는 다 된 때 알아냄 */
    function found(law, e, act) { const c = C(), L = LAWS[law]; if (!L) return; const me = map.player.pos(), was = c.lf[law]; if (!was) c.lf[law] = { d: S().day, at: A.cell(me.x, me.z), it: {} }; const F = c.lf[law]; if (!F.it[e]) F.it[e] = act; A.GAME.mark(); if (BOOK) BOOK.tab();
      if (!was) setTimeout(() => { if (ok()) { map.hud.toast('💡 ' + (en() ? 'Found out: ' : '알아냈어요: ') + tx(L.tip) + (en() ? ' (Notebook → Rules)' : ' (수첩 → 규칙 칸)'), 4.6); map.sfx && map.sfx('ding'); } }, 3600); }
    // 널어 둔 것(말리기·얼리기) · 제설 자국 · 싹 — 바뀔 때만 그림
    function rackDraw() { const R9 = C().rack; for (let k = 0; k < 4; k++) { const r = R9[k]; if (!r) { if (SPR[1 + k]) SPR[1 + k].sp.visible = false; continue; } const o = spr(1 + k); sprSet(o, r[0], 0.45); o.sp.position.set(r[3], r[4], r[5]); } }
    function deiDraw() { const D9 = C().dei; for (let k = 0; k < 6; k++) { const d = D9[k]; if (!d) { put(L0 + DOME.dei + k, 0, 0, 0); continue; } put(L0 + DOME.dei + k, d[0], d[1] - 0.2, d[2], 1.1, 0.004, 1.1, 0x6b6258, k); } }
    function plantDraw() { const P9 = C().plant, d0 = S().day; for (let k = 0; k < 6; k++) { const p = P9[k]; if (!p) { put(L0 + DOME.sprout + k, 0, 0, 0); continue; } const g = Math.max(0.15, Math.min(1, 1 - (p[5] - d0) / 3)); put(L0 + DOME.sprout + k, p[2], p[3] - 0.25, p[4], 0.12 + 0.22 * g, 0.1 + 0.3 * g, 0.12 + 0.22 * g, 0x5c9a48, k); } }
    const NUDGE = { water: ['물가예요 — 가방(I)을 열면 물건을 물에 넣어 볼 수 있어요', 'By the water — open your bag (I) and try putting things in'], sea: ['바닷가예요 — 가방(I)을 열면 물건을 바닷물에 넣어 볼 수 있어요', 'By the sea — open your bag (I) and try putting things in'], fire: ['모닥불 곁이에요 — 가방(I)에서 굽거나 땔감을 넣어 볼 수 있어요', 'By the fire — open your bag (I) to roast food or add twigs'], sun: ['햇볕이 좋아요 — 가방(I)에서 먹거리를 널어 말려 볼 수 있어요', 'Sunny — open your bag (I) to lay food out to dry'], snow: ['눈 쌓인 땅이에요 — 가방(I)에서 물건을 눈 위에 둬 볼 수 있어요', 'Snowy ground — open your bag (I) and try things on the snow'] };
    function sec(E, dm) { lastE = E; const c = C(), en9 = en(); for (const o of SPR) if (o && o.sp.visible) o.mat.color.setScalar(UDIM.value);
      let ch = false; for (let k = c.rack.length - 1; k >= 0; k--) { const r = c.rack[k], need = r[2] === 'dry' ? 30 : 20;
        if (r[2] === 'dry') { if (E.rain) { if (r[6] > 0) { r[6] = Math.max(0, r[6] - dm * 2); ch = true; if (!c.nudge.wet && Math.hypot(r[3] - E.me.x, r[5] - E.me.z) < 40) { c.nudge.wet = 1; map.hud.toast(en9 ? '🌧 Rain! The things you laid out are getting wet again' : '🌧 비가 와요! 널어 둔 것이 다시 젖어요', 3); } } } else if (E.sun0 && !eaves(r[3], r[5])) { r[6] += dm; ch = ch || dm > 0; } }
        else { const T = A.tempAt ? A.tempAt(r[3], r[4], r[5]) : E.T0; if (T < 0) { r[6] += dm; ch = ch || dm > 0; } else if (r[6] > 0) { r[6] = Math.max(0, r[6] - dm); ch = ch || dm > 0; } }
        if (r[6] >= need) { c.rack.splice(k, 1); A.bagAdd(r[1], 1); map.hud.toast((r[2] === 'dry' ? '☀️ ' : '❄️ ') + (en9 ? E9(r[1]) + ' ' + nm(r[1]) + ' is ready — put in your bag' : E9(r[1]) + ' ' + nm(r[1]) + ' 다 됐어요 — 가방에 넣었어요'), 3.2); found(r[2] === 'dry' ? 'dry' : 'freeze', r[0], r[2]); ch = true; } }
      if (ch) { A.GAME.mark(); rackDraw(); }
      for (let k = c.plant.length - 1; k >= 0; k--) { const p = c.plant[k]; if (S().day >= p[5] && Math.hypot(p[2] - E.me.x, p[4] - E.me.z) < 8) { c.plant.splice(k, 1); A.bagAdd(p[0], p[1]); A.GAME.mark(); plantDraw(); map.hud.toast('🌱 ' + (en9 ? 'It grew! Dug up ' + E9(p[0]) + ' ×' + p[1] : '자랐어요! ' + E9(p[0]) + ' ' + nm(p[0]) + ' ' + p[1] + '개를 캤어요'), 3.4); found('tuber', p[0], 'sprout'); } }
      if (!E.paused && !RUN) { const cx = ctx(); for (const at of ['water', 'sea', 'fire', 'sun', 'snow']) { if (!cx[at] || c.nudge[at] || !PAIRS.some(q => q[0] === at && A.bagHas(q[1]) > 0)) continue; c.nudge[at] = 1; A.GAME.mark(); map.hud.toast('💡 ' + tx(NUDGE[at]), 4); break; } } }   /* 처음 그 자리에 왔고 해 볼 물건이 가방에 있으면 한 번 */
    function day() { const c = C(), d = S().day; c.dei = c.dei.filter(q => q[3] === d); deiDraw(); plantDraw(); }
    return { id: 'laws', slots: n => { L0 = n; return n + 13; }, reset: () => { rackDraw(); deiDraw(); plantDraw(); }, sec, day,
      clear: () => { if (raf) cancelAnimationFrame(raf); raf = 0; RUN = null; for (const o of SPR) if (o) { if (o.sp.parent) o.sp.parent.remove(o.sp); o.tex.dispose(); } SPR.length = 0; },
      info: o => { const c = C(); o.laws = Object.keys(c.lf); o.lawN = Object.keys(LAWS).length; o.rack = c.rack.map(r => [r[0], r[2], r[6]]); o.plant = c.plant.map(p => [p[0], p[5]]); o.running = !!RUN; },
      set: o => { const c = C(); if (o.rackDone) for (const r of c.rack) r[6] = 99; if (o.plantDue) for (const p of c.plant) p[5] = S().day; if (o.laws === null) { c.lf = {}; c.pr = {}; c.nudge = {}; } },
      api: { lawCtx: () => ctx(), lawBtns: (e, cx) => btns(e, cx), lawRun: (e, at) => run(e, at), lawGo: (e, at, guess) => { const P = pairOf(e, at), cx = ctx()[at]; return !!(P && cx && go(e, at, P, cx, guess || null)); }, lawPairs: () => PAIRS.map(p => p.slice(0, 4)), lawFound: (law, e, act) => found(law, e, act) } }; }

  // ───────── 수첩 🔬 규칙 칸(규칙 도감) — 처음 알아낸 뒤에 탭이 생김 · 카드 = 해 본 것 → 본 것 → 까닭 → 4학년 과학 단원 · 빈칸 = ❔ + 때·곳 귀띔 · 점수·순위 X ─────────
  const WORDS = [['증발', '물이 수증기가 되어 공기 속으로 날아가는 것', 'Evaporation', 'water turning into vapour and drifting into the air'], ['수증기', '물이 바뀐 기체 — 눈에 안 보여요', 'Water vapour', 'water as a gas — you cannot see it'], ['용해', '소금처럼 물에 녹아 골고루 섞이는 것', 'Dissolving', 'mixing evenly into water like salt'], ['분해자', '죽은 생물을 잘게 부숴 흙으로 돌려보내는 생물(지렁이·곰팡이)', 'Decomposer', 'living things that break dead plants into soil']];   /* 낱말 상자(새 낱말 둘까지) */
  const HOW = { sun: ['햇볕에 말림', 'dried in the sun'], fire: ['모닥불 곁에서 말림', 'dried by the fire'], slip: ['언 논에 올라섬', 'stepped on the frozen paddy'], pond: ['언 연못을 봄', 'saw the frozen pond'], kid: ['물을 부어 끔', 'poured water on it'], rain: ['비가 불을 끔', 'the rain put it out'], ring: ['모닥불 곁을 지켜봄', 'watched by the fire'], snowman: ['눈사람을 불 곁에 세움', 'built a snowman by the fire'], wind: ['홀씨를 붊', 'blew the seeds'] };
  function bookOpen() { const c = C(), E9 = en(), found = RULES.filter(r => c.found[r.id]).length, D = d => (E9 ? 'Day ' + d : d + '일째');
    let h = '<h3>🔬 ' + (E9 ? 'Rules I found' : '알아낸 규칙') + ' · ' + found + ' / ' + RULES.length + '</h3><div class="sm">' + (E9 ? 'How the world changes — found out with your own body' : '세상이 어떻게 바뀌는지 몸으로 알아낸 것이 모여요') + '</div>';
    for (const r of RULES) { const f = c.found[r.id];
      if (!f) { h += '<div class="grp" style="opacity:.6">❔ ' + (E9 ? 'Not yet' : '아직 몰라요') + '</div><div class="sm">' + (E9 ? 'Where? ' : '어디쯤? ') + A.esc(tx(r.hint)) + '</div>'; continue; }
      const f2 = r.tip2 && c.found[r.id + '2'];
      h += '<div class="grp">' + r.ic + ' ' + A.esc(tx(r.t)) + '</div><div class="sm">'
        + '<b>' + (E9 ? 'Tried' : '해 본 것') + '</b> ' + A.esc(D(f.d) + (f.at ? ' · ' + f.at : '') + (HOW[f.how] ? ' — ' + tx(HOW[f.how]) : '')) + '<br>'
        + '<b>' + (E9 ? 'Saw' : '본 것') + '</b> ' + A.esc(tx(r.saw)) + '<br>'
        + '<b>' + (E9 ? 'Why' : '까닭') + '</b> ' + A.esc(tx(r.why)) + (f2 ? '<br><b>' + (E9 ? 'Also' : '더') + '</b> ' + A.esc(tx(r.tip2)) : '') + '<br>'
        + '📚 ' + A.esc((E9 ? 'Grade 4 science · ' : '4학년 과학 · ') + tx(r.unit)) + '</div>'; }
    { const LK = Object.keys(LAWS), nF = LK.filter(k => c.lf[k]).length, ACT = { float: ['떴어요', 'floated'], close: ['오므렸어요', 'closed'], sink: ['가라앉았어요', 'sank'], dissolve: ['녹았어요', 'dissolved'], mix: ['퍼졌어요', 'spread'], swim: ['헤엄쳐 갔어요', 'swam off'], roast: ['구워졌어요', 'roasted'], flare: ['불을 키웠어요', 'fed the fire'], heat: ['따끈해졌어요', 'got warm'], melt: ['녹았어요', 'melted'], dry: ['말랐어요', 'dried'], freeze: ['얼었어요', 'froze'], deice: ['눈을 녹였어요', 'melted snow'], sprout: ['싹이 났어요', 'sprouted'], compost: ['흙이 됐어요', 'became soil'], fly: ['날아갔어요', 'flew off'], keep: ['그대로예요', 'stayed the same'], drift: ['떠내려갔어요', 'drifted off'], shelter: ['비를 막았어요', 'kept the rain off'], glide: ['천천히 내려왔어요', 'floated down'], flip: ['뒤집혔어요', 'flipped'], safe: ['우산을 접었어요', 'closed it'] };   /* LAWS-1 해 본 실험 */
      h += '<h3 style="margin-top:12px">🧪 ' + (E9 ? 'Experiments' : '해 본 실험') + ' · ' + nF + ' / ' + LK.length + '</h3><div class="sm">' + (E9 ? 'Put things from your bag (I) into water, fire, sun, cold, snow, soil or wind' : '가방(I) 물건을 물·바다·불·햇볕·추위·눈·흙·바람에 놓아 봐요 — 과학과 사회가 같이 보여요') + '</div>';
      for (const k of LK) { const L = LAWS[k], f = c.lf[k]; if (!f) { h += '<div class="grp" style="opacity:.6">❔ ' + (E9 ? 'Not yet' : '아직 몰라요') + '</div><div class="sm">' + (E9 ? 'Try: ' : '해 볼 곳: ') + A.esc(tx(L.hint)) + '</div>'; continue; }
        h += '<div class="grp">' + L.ic + ' ' + A.esc(tx(L.t)) + '</div><div class="sm"><b>' + (E9 ? 'Tried' : '해 본 것') + '</b> ' + A.esc(Object.entries(f.it).map(([e9, a9]) => [...e9][0] + ' ' + (ACT[a9] ? tx(ACT[a9]) : '')).join(' · ')) + '<br><b>' + (E9 ? 'Why' : '까닭') + '</b> ' + A.esc(tx(L.why)) + '<br>📚 ' + A.esc(L.s.map(s9 => E9 ? (s9 === '과학' ? 'Science' : 'Social studies') : s9).join(' · ') + ' — ' + tx(L.u)) + '</div>'; } }
    h += '<div class="grp">📦 ' + (E9 ? 'Word box' : '낱말 상자') + '</div><div class="sm">' + WORDS.map(w => '<b>' + A.esc(E9 ? w[2] : w[0]) + '</b> ' + A.esc(E9 ? w[3] : w[1])).join('<br>') + '</div>'
      + '<div class="sm" style="opacity:.7">' + (E9 ? 'For teachers: unit names follow the 2015 curriculum — check the 2022 achievement standards' : '선생님께: 단원 이름은 2015 개정 기준이에요. 2022 개정 성취기준 원문은 확인이 필요해요.') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (E9 ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(h, false, 'chem'); P9.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; return P9; }
  BOOK = { open: bookOpen, tab: () => A.nb(['chem', '🔬', '규칙', 'Rules', () => bookOpen()]) };

  const RS = [mkDry(), mkPuddle(), mkIce(), mkFire(), mkMelt(), mkSeed(), mkLaws()];   /* 규칙 차례(1초 칸에서 이 차례로 돎) */

  // ───────── 짓기(setEntries마다 · 실제 짓기는 첫 1초 칸) ─────────
  //   setEntries는 표시만(pend) — 첫 짓기는 마을의 아래쪽 선언보다 먼저 돎 → 그때 마을 함수를 부르면 TDZ로 마을이 통째로 멈춤(10-19 실측)
  function clear() { for (const R of RS) if (R.clear) R.clear(); if (PT && PT.mesh.parent) PT.mesh.parent.remove(PT.mesh); if (DM && DM.mesh.parent) DM.mesh.parent.remove(DM.mesh); on = false; }
  function init() { clear(); pend = true; if (window.SM_TOWN) window.SM_TOWN.chem = API; }
  function build() { pend = false; if (!A.on()) return; on = true; C(); const tb = performance.now();
    eavesInit(); fireInit(); for (const R of RS) if (R.init) R.init();
    let n = 0; for (const R of RS) if (R.slots) n = R.slots(n);
    mkPoints(); mkDome(Math.max(1, n)); for (let i = 0; i < DM.cap; i++) { DM.mesh.setMatrixAt(i, Z4); DM.vis[i] = 0; } for (const R of RS) if (R.reset) R.reset();
    const root = A.root(); root.add(PT.mesh); root.add(DM.mesh);
    put(0, 0, -500, 0, 0.001, 0.001, 0.001, 0xffffff); DM.mesh.visible = true; PT.mesh.visible = true; PT.until = now() + 1;   /* 첫 그리기 = 셰이더를 짓는 동안 미리 한 번(첫 비에 멈춤 X) — 다음 1초 칸에서 숨김 */
    for (const R of RS) if (R.hots) R.hots();
    lastT = performance.now(); lastM = S().min; lastD = S().day; sec0 = true;
    if (BOOK && (Object.keys(C().found).length || Object.keys(C().lf).length)) BOOK.tab();
    if (window.SM_TOWN) window.SM_TOWN.chem = API; buildMs = performance.now() - tb; }

  // ───────── 1초 칸(마을이 부름) · 새 날(잠 → 아침 · 날 바뀜을 봄) ─────────
  function sec() { if (pend) { try { build(); } catch (e) { on = false; console.error('[chem] 짓기 실패 — 화학 규칙만 끔', e); } return; } if (!ok()) return; try { sec1(); } catch (e) { console.error('[chem] 1초 칸 오류', e); if (++errN > 3) { on = false; console.error('[chem] 오류가 잦아 화학 규칙을 끔'); } } }
  function sec1() { const t0 = performance.now(), s = S(), me0 = map.player.pos(), me = { x: me0.x, y: me0.y, z: me0.z };
    const dt = Math.min(2, Math.max(0, (t0 - lastT) / 1000)); lastT = t0; const day = s.day, m = s.min; let dm = 0;
    const wx = A.wx(), sea = A.sea(), phase = m >= 360 && m < 1020 ? 'day' : m >= 1020 && m < 1140 ? 'sunset' : 'night', inb = A.inb(), rain = wx === 'rain', snow = wx === 'snow';
    const shelter = inb || A.ride() || (A.umb && A.umb()) || eaves(me.x, me.z) || (map.q.indoor ? map.q.indoor(me.x, me.y, me.z) : false);
    const E = { me, rain, snow, sea, phase, m, inb, shelter, T0: A.temp0(), paused: A.paused(), sun0: !rain && !snow && phase === 'day', sun: !rain && !snow && phase === 'day' && !shelter, fire: inb ? null : nearFire(me.x, me.z, 3) };   /* 요소 값(물·불·추위·햇빛)을 한 번 잼 */
    if (day !== lastD) { if (lastD >= 0 && day > lastD) { for (const R of RS) if (R.day) R.day(E); A.GAME.mark(); } lastD = day; lastM = m; } else if (m !== lastM) { dm = Math.max(0, Math.min(720, m - lastM)); lastM = m; }
    UDIM.value = phase === 'day' ? 1 : phase === 'sunset' ? 0.85 : 0.55;
    if (sec0) { sec0 = false; put(0, 0, 0, 0); for (const R of RS) if (R.reset) R.reset(); }   /* 짓기 때 미리 그린 칸 치움 → 규칙이 다시 그림 */
    for (const R of RS) R.sec(E, dm, dt);
    flush(); if (PT && now() > PT.until) PT.mesh.visible = false;
    const ms = performance.now() - t0; cost.n++; cost.sum += ms; cost.max = Math.max(cost.max, ms); }

  // ───────── 시험·디버그(SM_TOWN.chem) ─────────
  const API = {
    get on() { return ok(); }, get pend() { return pend; }, get book() { return !!BOOK; },
    info: () => { const c = C(), o = { on: ok(), fires: FI.map(f => ({ x: +f.x.toFixed(1), z: +f.z.toFixed(1), out: c.fire.out[f.n] || '', warmed: f.warmed, ring: (c.ring[f.n] || {}).s || '' })), found: Object.keys(c.found), pts: PT ? { vis: PT.mesh.visible, left: +(PT.until - now()).toFixed(2) } : null, dome: DM ? { vis: DM.mesh.visible, cap: DM.cap } : null, buildMs: +buildMs.toFixed(1), cost: { n: cost.n, avg: cost.n ? +(cost.sum / cost.n).toFixed(3) : 0, max: +cost.max.toFixed(3) } }; for (const R of RS) if (R.info) R.info(o); return o; },
    set: o => { const c = C(); if (o.found === null) c.found = {}; for (const R of RS) if (R.set) R.set(o); A.GAME.mark(); sec(); return API.info(); },
    eaves: (x, z) => eaves(x, z), vis: v => { if (PT) PT.mesh.visible = !!v && now() < PT.until; if (DM) { if (v) { DM.dirty = true; flush(); } else DM.mesh.visible = false; } return { pt: !!(PT && PT.mesh.visible), dm: !!(DM && DM.mesh.visible) }; },
    resetCost: () => { cost = { n: 0, sum: 0, max: 0 }; }, sec: () => sec(), open: () => !!(BOOK && BOOK.open()), rules: () => RULES.map(r => r.id),
  };
  for (const R of RS) if (R.api) Object.assign(API, R.api);
  function dispose() { clear(); if (PT) { PT.g.dispose(); PT.base.dispose(); PT = null; } if (DM) { DM.mesh.dispose(); DM.g.dispose(); DM.g0.dispose(); DM = null; } }
  return { init, sec, dispose, open: () => API.open(), discover, api: API, get info() { return API.info(); } };
}
