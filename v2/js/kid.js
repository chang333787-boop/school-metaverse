// 내 캐릭터(CHAR-2 · 09-26 사용자 "캐릭터 생긴 게 너무 징그럽다") — 장난감 같은 치비(실사 아님 · 사용자 07-30 "사람은 실제처럼 구현하지마")
//   예전(CHAR-1) 징그러운 까닭: 각진 면(플랫 셰이딩) 얼굴 · 흰 반짝임 든 큰 까만 눈 · 튀어나온 코 공 · 두꺼운 빨간 입 · 볼 원판 · 가늘고 긴 목 · 막대 팔다리 = 마네킹.
//   이번: 큰 둥근 머리(키의 ~40%) · 목 없음 · 짧고 통통한 몸·팔다리 · 얼굴 = 작은 세로 타원 눈 둘 + 가는 웃는 입(+ 아주 옅은 볼) · 코·귀·눈썹·입술·반짝임 없음 ·
//   매끈한 음영(부위마다 원래 법선을 돌려 굽는다 — 비인덱스로 합치면 computeVertexNormals가 면 법선이 되어 다시 각져 보인다).
//   인터페이스는 CHAR-1과 같다: { rig, body, head, armL, armR, legL:{g,knee}, legR } + sitY(앉을 때 rig 높이) · tray/milk(들고 있는 물건 자리) — main.js kidTick.
//   style 'b' = 노란 모자(내 캐릭터 — 사람들 사이에서 한눈에 찾게) · 'a' = 바가지 머리. 시안 비교 = 09-26 A·B·C(콩) 중 B.
export function buildKid(THREE, style = 'a') {
  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a2018 });   // 옅은 자체광 = 그늘을 밝혀 얼굴 아래가 탁해 보이지 않게
  const SPH = new THREE.SphereGeometry(1, 22, 14), SPHS = new THREE.SphereGeometry(1, 12, 8);   // 면 수 예산: 캐릭터 한 명 ≈4.5k(예전 5.7k)
  const CAPH = new THREE.SphereGeometry(1, 22, 9, 0, Math.PI * 2, 0, Math.PI * 0.62);    // 머리카락 덮개(위·뒤)
  const DOME = new THREE.SphereGeometry(1, 22, 7, 0, Math.PI * 2, 0, Math.PI * 0.5);      // 모자 돔
  const CAPS = (r, l, seg = 8, cap = 2) => new THREE.CapsuleGeometry(r, l, cap, seg);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 14, 1);
  const ARC = new THREE.TorusGeometry(1, 0.16, 5, 12, Math.PI);                          // 웃는 입(아래로 둥근 호)
  const C = { top: 0x5aa6e0, top2: 0x4a90cc, bot: 0x33456b, skin: 0xf7d6b5, hair: 0x5b3f2e, shoe: 0xf6f6f2, sole: 0xd5d9de,
    bag: 0xe45c46, bag2: 0xc44a37, eye: 0x2d2a33, mouth: 0x9a4a42, blush: 0xf6b9a8, cap: 0xf2c230, cap2: 0xe0ac1c };
  const m4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3(), sv = new THREE.Vector3(), col = new THREE.Color();
  // [도형, [x,y,z], [sx,sy,sz], 색, [rx,ry,rz]?] → 한 메시(정점색) · 법선 = 원래 도형 법선을 역전치로 돌림(늘린 공도 매끈)
  function bake(parts) {
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex, r] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, N = g.attributes.normal;
      m4.compose(v.set(p[0], p[1], p[2]), q.setFromEuler(e.set(...(r || [0, 0, 0]))), sv.set(sc[0], sc[1], sc[2])); nm.getNormalMatrix(m4); col.set(hex);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
        n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(n.x, n.y, n.z); cl.push(col.r, col.g, col.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    const mesh = new THREE.Mesh(g, MAT); mesh.castShadow = true; return mesh;
  }
  const rig = new THREE.Group();
  // ---------------- A·B: 치비 아이 ----------------
  const HIP = 0.34, SHO = 0.72, HC = 0.265, HR = [0.278, 0.265, 0.26];   // 엉덩이·어깨 높이 · 머리 중심(목 축 위) · 머리 반지름
  // 몸: 반바지(둥근 원기둥) · 셔츠(캡슐) · 책가방(둥근 덩어리 + 덮개 + 어깨끈)
  const body = bake([
    [CYL, [0, HIP + 0.05, 0], [0.15, 0.13, 0.125], C.bot], [SPHS, [0, HIP - 0.01, 0], [0.15, 0.06, 0.125], C.bot],
    [CAPS(0.155, 0.12, 14, 3), [0, 0.575, 0], [1, 1, 0.82], C.top], [CYL, [0, 0.43, 0], [0.158, 0.03, 0.132], C.top2],
    [CAPS(0.12, 0.12, 12, 2), [0, 0.575, -0.185], [1.18, 1, 0.52], C.bag], [CAPS(0.1, 0.04), [0, 0.655, -0.222], [1.25, 0.9, 0.36], C.bag2, [0.25, 0, 0]],   // 가방(알약) + 덮개
    [CAPS(0.07, 0.03), [0, 0.51, -0.232], [1.1, 0.8, 0.3], C.bag2],                                                                                      // 앞주머니
    ...[-1, 1].map(sd => [CAPS(0.017, 0.2, 6, 2), [sd * 0.085, 0.59, 0.126], [1, 1, 1], C.bag2]),   // 어깨끈(앞 세로 — 위 끝은 소매 밑으로)
  ]);
  rig.add(body);
  // 머리(몸통 꼭대기 축 — 살짝 끄덕임): 얼굴 = +z
  const head = new THREE.Group(); head.position.y = 0.76; rig.add(head);
  const fz = (x, y) => HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - ((y - HC) / HR[1]) ** 2));   // 머리 겉면 z
  const eyeY = HC - 0.035, mY = HC - 0.1;
  const face = [
    [SPH, [0, HC, 0], HR, C.skin],
    [SPHS, [-0.088, eyeY, fz(0.088, eyeY) - 0.012], [0.03, 0.046, 0.022], C.eye], [SPHS, [0.088, eyeY, fz(0.088, eyeY) - 0.012], [0.03, 0.046, 0.022], C.eye],
    [ARC, [0, mY + 0.02, fz(0, mY) - 0.006], [0.036, 0.03, 0.02], C.mouth, [0, 0, Math.PI]],
    [SPHS, [-0.155, HC - 0.075, fz(0.155, HC - 0.075) - 0.012], [0.04, 0.022, 0.012], C.blush, [0, -0.62, 0]],
    [SPHS, [0.155, HC - 0.075, fz(0.155, HC - 0.075) - 0.012], [0.04, 0.022, 0.012], C.blush, [0, 0.62, 0]],
  ];
  if (style === 'b') {   // 노란 모자(둥근 돔 + 앞 챙) · 머리카락은 모자 밑 옆·뒤만
    face.push(
      [SPHS, [0, HC - 0.02, -0.03], [0.268, 0.2, 0.25], C.hair],                                   // 뒤·옆 머리(모자 밑)
      [DOME, [0, HC + 0.035, -0.005], [0.278, 0.245, 0.27], C.cap, [-0.12, 0, 0]],                 // 모자 돔
      [CYL, [0, HC + 0.075, 0.2], [0.19, 0.018, 0.13], C.cap2, [0.18, 0, 0]],                       // 챙
      [SPHS, [0, HC + 0.28, -0.01], [0.03, 0.022, 0.03], C.cap2],                                  // 꼭지
    );
  } else {               // 바가지 머리: 위 덮개(앞머리 선 = 눈썹 위) + 뒤 반구 껍질(목덜미까지) + 정수리 한 올
    const TOPC = new THREE.SphereGeometry(1, 22, 7, 0, Math.PI * 2, 0, Math.PI * 0.44), BACK = new THREE.SphereGeometry(1, 12, 5, Math.PI, Math.PI, Math.PI * 0.43, Math.PI * 0.33);
    face.push(
      [TOPC, [0, HC + 0.004, 0], [0.288, 0.278, 0.272], C.hair], [BACK, [0, HC, -0.004], [0.286, 0.276, 0.27], C.hair],
      [SPHS, [0.02, HC + 0.285, -0.02], [0.03, 0.045, 0.028], C.hair, [0, 0, -0.5]],
    );
  }
  head.add(bake(face));
  // 팔(어깨 축 — 걸을 때 흔듦): 짧은 소매 + 통통한 팔 + 둥근 손(벙어리장갑처럼)
  const arm = sd => { const g = new THREE.Group(); g.position.set(sd * 0.175, SHO, 0); g.rotation.z = sd * 0.12;
    g.add(bake([[CAPS(0.058, 0.05), [0, -0.04, 0], [1, 1, 1], C.top], [CAPS(0.048, 0.13), [0, -0.15, 0], [1, 1, 1], C.skin], [SPHS, [0, -0.25, 0.005], [0.058, 0.06, 0.058], C.skin]])); rig.add(g); return g; };
  // 다리(엉덩이 축 → 무릎 축): 반바지 끝 + 짧은 다리 + 둥근 실내화
  const leg = sd => { const g = new THREE.Group(); g.position.set(sd * 0.078, HIP, 0);
    g.add(bake([[CAPS(0.068, 0.06), [0, -0.05, 0], [1, 1, 1], C.bot], [CAPS(0.056, 0.05), [0, -0.12, 0], [1, 1, 1], C.skin]]));
    const knee = new THREE.Group(); knee.position.y = -0.16; g.add(knee);
    knee.add(bake([[CAPS(0.054, 0.06), [0, -0.04, 0], [1, 1, 1], C.skin], [CYL, [0, -0.1, 0], [0.058, 0.03, 0.058], 0xffffff],
      [SPHS, [0, -0.14, 0.03], [0.075, 0.055, 0.115], C.shoe], [SPHS, [0, -0.168, 0.03], [0.072, 0.018, 0.11], C.sole]]));
    rig.add(g); return { g, knee }; };
  return { rig, body, head, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), sitY: 0.46 - HIP, tray: [0.62, 0.3], milk: [0.2, 0.55, 0.2], height: HC + 0.76 + HR[1] };

}
