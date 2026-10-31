// 기술 바탕 시험 장면(단계 2 전 임시) — 하늘 돔 · 안개 · 바다 · 돌기둥 몇 개 · 자유 카메라(W·S 앞뒤 · A·D 돌기 · 끌어서 둘러보기)
// 그래픽 결은 단계 2 시안에서 정한다 — 여기 색·모양은 성능 측정용 자리표시
import * as THREE from 'three';

export function buildBaseTest(scene, camera, rng) {
  const FOG = new THREE.Color(0x9fb3bf);
  scene.background = FOG; scene.fog = new THREE.Fog(FOG, 80, 900);
  scene.add(new THREE.HemisphereLight(0xdfe8ee, 0x3d4a3a, 1.6));
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.4); sun.position.set(-300, 400, 200); scene.add(sun);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x5d7f9e) }, bot: { value: FOG } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(0.0, 0.5, h)), 1.0); }',
  }));
  sky.renderOrder = -1; scene.add(sky);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3f6577 }));
  scene.add(sea);

  const rockGeo = new THREE.LatheGeometry([[0, 0], [14, 0], [12, 30], [9, 70], [6, 95], [0, 100]].map(([x, y]) => new THREE.Vector2(x, y)), 9);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x6b6a62, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 40), m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, r = 120 + rng() * 600;
    p.set(Math.cos(a) * r, -2, Math.sin(a) * r); q.setFromAxisAngle(up, rng() * 6.28); const k = 0.6 + rng() * 1.2; s.set(k, k * (0.7 + rng() * 0.8), k);
    rocks.setMatrixAt(i, m.compose(p, q, s));
  }
  scene.add(rocks);

  /* 자유 카메라 — 단계 2의 비행 엔진이 대신함 */
  const cam = { x: 0, y: 40, z: 300, yaw: Math.PI, pitch: -0.08 };
  const prev = { x: 0, y: 0, z: 0 };
  return {
    step(dt, I) {
      prev.x = cam.x; prev.y = cam.y; prev.z = cam.z;
      const lk = I.look(); cam.yaw -= lk.x * 0.004; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch - lk.y * 0.003));
      cam.yaw -= I.axis('left', 'right') * 1.6 * dt;
      const sp = I.axis('back', 'fwd') * 45 * dt;
      cam.x += Math.sin(cam.yaw) * Math.cos(cam.pitch) * sp; cam.z += Math.cos(cam.yaw) * Math.cos(cam.pitch) * sp; cam.y = Math.max(3, cam.y + Math.sin(cam.pitch) * sp);
    },
    draw(a) {
      camera.position.set(prev.x + (cam.x - prev.x) * a, prev.y + (cam.y - prev.y) * a, prev.z + (cam.z - prev.z) * a);
      camera.rotation.set(cam.pitch, cam.yaw + Math.PI, 0, 'YXZ');
    },
    snapshot: () => ({ x: +cam.x.toFixed(4), y: +cam.y.toFixed(4), z: +cam.z.toFixed(4), yaw: +cam.yaw.toFixed(5) }),
    benchPath(t) {                                  // 60초: 바다 위 낮게 한 바퀴 → 높이 올라 돌기둥 사이
      const a = t / 60 * Math.PI * 2, r = 380 + Math.sin(a * 3) * 160, h = 12 + (1 - Math.cos(a)) * 60;
      cam.x = prev.x = Math.cos(a) * r; cam.z = prev.z = Math.sin(a) * r; cam.y = prev.y = h;
      cam.yaw = -a; cam.pitch = -0.1;
    },
  };
}
