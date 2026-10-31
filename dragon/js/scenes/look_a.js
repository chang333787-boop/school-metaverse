// 시안 A 시험 장면 — 섬(높이맵 · 정점색) · 바다 돌기둥 · 거스트너 바다 · 3색 하늘 · 빌보드 구름 · 때 넷(T로 바꿈 · ?time=)
// 섬 모양·배치는 영화 버크를 본뜨지 않은 자리표시(goal §2-2) — 결(셰이딩·안개·색 흐름)과 성능을 보려는 장면
import * as THREE from 'three';
import { toon, makeSky, makeSea, setTime, U, TIMES } from '../look/kit.js?v=16';
import { createNoise } from '../core/noise.js?v=16';

export function buildLookA(scene, camera, rng, opt = {}) {
  const N = createNoise(11);
  scene.fog = new THREE.Fog(0xa9b8ba, 90, 1100);
  const hemi = new THREE.HemisphereLight(0xd7e2e6, 0x4b5a48, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.5); scene.add(sun);
  const sky = makeSky(); scene.add(sky);
  const sea = makeSea(); scene.add(sea);
  const env = { scene, sky, sea, sun, hemi, camera, time: 'day' };

  /* 섬 높이 — 둥근 가림 × fbm, 가장자리는 절벽처럼 가파르게 */
  const IS = 1100, SEG = 180, half = IS / 2;
  const height = (x, z) => {
    const d = Math.hypot(x * 1.1, z) / (half * 0.82), m = Math.max(0, 1 - d * d);
    const n = N.fbm(x * 0.004 + 3, z * 0.004 + 9, 5);
    const cliff = Math.min(1, m * 3.2);
    return (n * 120 + 18) * cliff * (0.55 + 0.45 * m) - 14 * (1 - cliff);
  };
  const g = new THREE.PlaneGeometry(IS, IS, SEG, SEG).rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  const SAND = new THREE.Color(0xc9b48a), GRASS = new THREE.Color(0x6f8a4e), GRASS2 = new THREE.Color(0x4f6b3c), ROCK = new THREE.Color(0x7a7a72), ROCK2 = new THREE.Color(0x5b5c58);
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  const nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), ny = nor.getY(i), x = pos.getX(i), z = pos.getZ(i), w = N.v2(x * 0.03, z * 0.03);
    if (y < 2.2) c.copy(SAND); else c.copy(GRASS).lerp(GRASS2, Math.min(1, w * 0.9 + (y - 30) / 160));
    const steep = 1 - Math.min(1, Math.max(0, (ny - 0.62) / 0.2));
    c.lerp(w > 0.5 ? ROCK : ROCK2, steep);
    c.multiplyScalar(0.92 + w * 0.16);                        // 붓 얼룩처럼 살짝 고르지 않게
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const land = new THREE.Mesh(g, toon({ vc: true })); scene.add(land);

  /* 바다 돌기둥 — 깎은 기둥(Lathe + 노이즈로 울퉁불퉁) · 꼭대기는 이끼색 */
  const stackGeo = (() => {
    /* 굵은 기둥: 밑동이 넓고 위로 갈수록 조금 좁아지다 꼭대기는 평평한 풀밭(가는 원뿔 X) */
    const prof = [[0.01, -6], [17, -6], [16, 6], [14, 22], [13.2, 40], [12.4, 58], [12.8, 70], [12, 78], [10.5, 82], [6, 84.5], [0.01, 85]].map(([r, y]) => new THREE.Vector2(r, y));
    const lg = new THREE.LatheGeometry(prof, 16), p = lg.attributes.position, cc = new Float32Array(p.count * 3), q = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + (N.v2(a * 2.2 + 5, y * 0.07) - 0.5) * 0.45 + (N.v2(a * 6 + 1, y * 0.25) - 0.5) * 0.15;
      p.setXYZ(i, x * k, y, z * k);
      q.copy(ROCK2).lerp(ROCK, N.v2(a * 3, y * 0.2)); if (y > 79) q.lerp(GRASS, Math.min(1, (y - 79) / 4)); else if (y < 4) q.lerp(new THREE.Color(0x3d4542), 0.6);
      cc[i * 3] = q.r; cc[i * 3 + 1] = q.g; cc[i * 3 + 2] = q.b;
    }
    lg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); lg.computeVertexNormals(); return lg;
  })();
  const STACKS = 26, stacks = new THREE.InstancedMesh(stackGeo, toon({ vc: true }), STACKS), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < STACKS; i++) {
    const a = -0.6 + rng() * 1.6, r = half * 0.95 + rng() * 260;
    pp.set(Math.cos(a) * r, 0, Math.sin(a) * r); qq.setFromAxisAngle(up, rng() * 6.28); const k = 0.55 + rng() * 0.7; ss.set(k, k * (0.8 + rng() * 0.9), k);
    stacks.setMatrixAt(i, mm.compose(pp, qq, ss));
  }
  scene.add(stacks);

  /* 구름 — 빌보드 판 하나(InstancedMesh)로 그리기 한 번 · 무늬는 캔버스로 직접 그림(내려받기 X) */
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x2 = cv.getContext('2d');
  for (let k = 0; k < 9; k++) { const gx = 30 + rng() * 68, gy = 44 + rng() * 40, gr = 18 + rng() * 26, gd = x2.createRadialGradient(gx, gy, 0, gx, gy, gr); gd.addColorStop(0, 'rgba(255,255,255,0.85)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = gd; x2.fillRect(0, 0, 128, 128); }
  const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace;
  const CL = 40, cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, tint: { value: new THREE.Color(0xffffff) }, shade: { value: new THREE.Color(0xb8c2c8) } }]),
    vertexShader: `varying vec2 vUv; varying float vFogDepth; varying float vY;
      void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float s = length(instanceMatrix[0].xyz);
        c.xy += position.xy * s; vY = position.y; vFogDepth = -c.z; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 tint; uniform vec3 shade; varying vec2 vUv; varying float vY;
      #include <fog_pars_fragment>
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.02) discard; vec3 c = mix(shade, tint, smoothstep(-0.4, 0.4, vY));
        gl_FragColor = vec4(c, t.a * 0.9);
        #ifdef USE_FOG
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * 0.85);
        #endif
        #include <colorspace_fragment>
      }`,
  });
  cloudMat.uniforms.map.value = ctex;
  const clouds = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.55), cloudMat, CL);
  for (let i = 0; i < CL; i++) { const a = rng() * 6.28, r = 300 + rng() * 900; pp.set(Math.cos(a) * r, 150 + rng() * 170, Math.sin(a) * r); ss.setScalar(120 + rng() * 160); clouds.setMatrixAt(i, mm.compose(pp, qq.identity(), ss)); }
  clouds.frustumCulled = false; clouds.renderOrder = 5; scene.add(clouds);

  const TN = Object.keys(TIMES);
  setTime(env, opt.time && TIMES[opt.time] ? opt.time : 'day');
  setCloudTint();
  function setCloudTint() { const T = TIMES[env.time]; cloudMat.uniforms.tint.value.setHex(T.mid).lerp(new THREE.Color(0xffffff), 0.55); cloudMat.uniforms.shade.value.setHex(T.top).lerp(new THREE.Color(T.mid), 0.5); }

  /* 자유 카메라(비행 엔진 전 임시) */
  const cam = { x: 640, y: 34, z: 260, yaw: -2.2, pitch: -0.02 }, prev = { x: 0, y: 0, z: 0 };
  let t = 0;
  return {
    env, height,
    step(dt, I) {
      t += dt; U.uTime.value = t;
      if (I.hit('KeyT')) { setTime(env, TN[(TN.indexOf(env.time) + 1) % TN.length]); setCloudTint(); }
      prev.x = cam.x; prev.y = cam.y; prev.z = cam.z;
      const lk = I.look(); cam.yaw -= lk.x * 0.004; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch - lk.y * 0.003));
      cam.yaw -= I.axis('left', 'right') * 1.4 * dt;
      const sp = I.axis('back', 'fwd') * (I.on('low') ? 160 : 55) * dt;
      cam.x += Math.sin(cam.yaw) * Math.cos(cam.pitch) * sp; cam.z += Math.cos(cam.yaw) * Math.cos(cam.pitch) * sp;
      cam.y = Math.max(Math.max(2, height(cam.x, cam.z)) + 3, cam.y + Math.sin(cam.pitch) * sp);
    },
    draw(a) {
      camera.position.set(prev.x + (cam.x - prev.x) * a, prev.y + (cam.y - prev.y) * a, prev.z + (cam.z - prev.z) * a);
      camera.rotation.set(cam.pitch, cam.yaw + Math.PI, 0, 'YXZ');
      sky.position.copy(camera.position); sea.follow(camera);
    },
    setTime: (n) => { setTime(env, n); setCloudTint(); },
    snapshot: () => ({ x: +cam.x.toFixed(4), y: +cam.y.toFixed(4), z: +cam.z.toFixed(4), yaw: +cam.yaw.toFixed(5) }),
    benchPath(tt) {                                 // 60초: 바다 스치기 → 돌기둥 사이 → 섬 위로 올라 한 바퀴
      const k = tt / 60, a = 0.3 + k * Math.PI * 2, r = half * (1.05 - 0.45 * Math.sin(k * Math.PI)), h = 8 + Math.sin(k * Math.PI) * 140;
      cam.x = prev.x = Math.cos(a) * r; cam.z = prev.z = Math.sin(a) * r; cam.y = prev.y = Math.max(h, height(cam.x, cam.z) + 12);
      cam.yaw = -a; cam.pitch = -0.08 - Math.sin(k * Math.PI) * 0.12;
    },
  };
}
