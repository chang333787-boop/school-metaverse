// 🔍 가까이 보기 모양(CLOSE-1 · 사용자 10-27 "개미는 잘한 거야?" — 보통 카메라에서 개미가 아예 안 보이던 것)
//   작은 생물을 가까이(0.4~1.2m)에서 봐도 어색하지 않은 low-poly 모양 — 머리·가슴·배 · 다리 여섯(게 = 여덟) · 더듬이 · 날개
//   모양 하나 = 몸 메시 하나(부품을 한 지오메트리로 합침 · 정점색) + 움직이는 부품(날개 둘 · 집게 둘)만 따로
//   크기는 마을의 다른 작은 것(칸 키트 개미 4.5cm · 곤충 그림 0.42m)과 어울리게 — 실제보다 조금 큼(아이 눈에 보이게)
//   만들 때 한 번만(가까이 보기를 처음 쓸 때) · 매 프레임 새 객체 X · 빛(Light) X — 재질은 Lambert 둘(몸 · 날개)
export const CLOSE_V = 1;

export function createCloseKit(T3) {
  const C9 = new T3.Color(), M9 = new T3.Matrix4(), N9 = new T3.Matrix3(), Q9 = new T3.Quaternion(), E9 = new T3.Euler(), V9 = new T3.Vector3(), S9 = new T3.Vector3(), UP = new T3.Vector3(0, 1, 0), D9 = new T3.Vector3();
  const tmpl = g => { const q = g.index ? g.toNonIndexed() : g; return { p: q.attributes.position.array, n: q.attributes.normal.array }; };
  const SPH = tmpl(new T3.SphereGeometry(1, 8, 6)), CYL = tmpl(new T3.CylinderGeometry(1, 1, 1, 6, 1)), CONE = tmpl(new T3.ConeGeometry(1, 1, 8, 1));
  const MAT = { body: new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true }), wing: new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }), clear: new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide, transparent: true, opacity: 0.5, depthWrite: false }) };
  // 지오메트리 모으기(부품마다 행렬 + 한 색)
  function GB() { const P = [], N = [], C = [];
    const put = (T, m, hex) => { N9.getNormalMatrix(m); C9.setHex(hex); const p = T.p, n = T.n; for (let i = 0; i < p.length; i += 3) { V9.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m); P.push(V9.x, V9.y, V9.z); V9.set(n[i], n[i + 1], n[i + 2]).applyMatrix3(N9).normalize(); N.push(V9.x, V9.y, V9.z); C.push(C9.r, C9.g, C9.b); } };
    const ell = (x, y, z, rx, ry, rz, hex, ax = 0, ay = 0, az = 0) => { M9.compose(V9.set(x, y, z), Q9.setFromEuler(E9.set(ax, ay, az)), S9.set(rx, ry, rz)); put(SPH, M9.clone(), hex); };
    const seg = (a, b, r, hex) => { D9.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = D9.length() || 1e-4; D9.multiplyScalar(1 / L); Q9.setFromUnitVectors(UP, D9); M9.compose(V9.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), Q9, S9.set(r, L, r)); put(CYL, M9.clone(), hex); };
    const leg = (pts, r, hex) => { for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], r * (1 - i * 0.25), hex); };
    const cone = (x, y, z, r, h, hex, ax = 0, ay = 0, az = 0) => { M9.compose(V9.set(x, y, z), Q9.setFromEuler(E9.set(ax, ay, az)), S9.set(r, h, r)); put(CONE, M9.clone(), hex); };
    // 납작한 판(날개·지느러미): 바깥 점 [x, z, 색?] 둘레 + 가운데 한 점(c) · 평면 XZ(y = y0) · 양면 재질로 그림
    const fan = (pts, cx, cz, y0, base, ring) => { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length];
        for (const [x, z, h] of [[cx, cz, base], [a[0], a[1], a[2] ?? ring ?? base], [b[0], b[1], b[2] ?? ring ?? base]]) { P.push(x, y0, z); N.push(0, 1, 0); C9.setHex(h); C.push(C9.r, C9.g, C9.b); } } };
    const spot = (x, z, r, y0, hex) => { const L = []; for (let k = 0; k < 6; k++) L.push([x + Math.cos(k * 1.047) * r, z + Math.sin(k * 1.047) * r]); fan(L, x, z, y0 + 0.0005, hex, hex); fan(L, x, z, y0 - 0.0005, hex, hex); };
    const geo = () => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return g; };
    return { ell, seg, leg, cone, fan, spot, geo }; }
  const hx = s => typeof s === 'number' ? s : parseInt(String(s || '#888888').replace('#', ''), 16);
  // 다리 여섯(가슴 세 자리에서 무릎 → 발 · 발끝은 y = 0)
  function legs6(g, o) { const { y, x0, zs, kx, ky, fx, fz, r, hex } = o; zs.forEach((z, i) => { for (const sg of [1, -1]) g.leg([[sg * x0, y, z], [sg * kx, ky, z + fz[i] * 0.4], [sg * fx, 0.0006, z + fz[i]]], r, hex); }); }

  // ── 개미(머리·가슴·허리 마디·배 · 다리 여섯 · 꺾인 더듬이 · 큰턱) — 길이 약 5.5cm(칸 키트 개미 4.5cm와 어울림) ──
  function antGeo(hex) { const g = GB(), B = hx(hex || 0x3b2618), D = 0x2a1a10, K = 0x120c08;
    g.ell(0, 0.011, -0.017, 0.0085, 0.0075, 0.0115, B, 0.15); g.ell(0, 0.0095, -0.0035, 0.0024, 0.0032, 0.0026, B); g.ell(0, 0.0105, 0.007, 0.0046, 0.0042, 0.0088, B, -0.12); g.ell(0, 0.0115, 0.0215, 0.0063, 0.0056, 0.0066, D);
    for (const sg of [1, -1]) { g.ell(sg * 0.0055, 0.0128, 0.0228, 0.0017, 0.0019, 0.0019, K); g.seg([sg * 0.002, 0.0092, 0.0268], [sg * 0.0006, 0.0086, 0.0312], 0.0009, D);
      g.leg([[sg * 0.003, 0.0145, 0.025], [sg * 0.0085, 0.0195, 0.0275], [sg * 0.0105, 0.0165, 0.041]], 0.00085, D); }
    legs6(g, { y: 0.0085, x0: 0.003, zs: [0.011, 0.0072, 0.0034], kx: 0.0115, ky: 0.0135, fx: 0.0195, fz: [0.013, 0.001, -0.015], r: 0.0011, hex: D });
    return g.geo(); }
  // ── 나비(가는 몸 · 곤봉 더듬이 · 대롱 입 · 앞뒤 날개) — 날개 편 폭 약 18cm ──
  function bflyParts(base, mark) { const g = GB(), b = 0x2b2622;
    g.ell(0, 0.012, -0.021, 0.0042, 0.0042, 0.023, b); g.ell(0, 0.013, 0.006, 0.0062, 0.0062, 0.0098, 0x3a332c); g.ell(0, 0.0132, 0.0195, 0.0048, 0.0048, 0.0048, b);
    for (const sg of [1, -1]) { g.ell(sg * 0.0036, 0.0142, 0.0215, 0.0021, 0.0024, 0.0024, 0x141210); g.seg([sg * 0.0016, 0.0168, 0.0225], [sg * 0.012, 0.031, 0.049], 0.0007, b); g.ell(sg * 0.012, 0.031, 0.049, 0.0021, 0.0021, 0.0032, b); }
    g.leg([[0, 0.0105, 0.0235], [0, 0.0055, 0.0275], [0, 0.0012, 0.0285]], 0.0006, 0x4a4038);   /* 대롱 입(꿀 빠는 입 — 꽃에 닿음) */
    legs6(g, { y: 0.0095, x0: 0.0035, zs: [0.011, 0.0065, 0.002], kx: 0.0115, ky: 0.0115, fx: 0.0155, fz: [0.011, 0.002, -0.009], r: 0.0008, hex: b });
    const w = GB(), B = hx(base), Mk = hx(mark), y0 = 0, edge = B === 0xf2d24a ? Mk : B;   /* 오른쪽 날개(경첩 = 원점 · x = 바깥) · 왼쪽은 거울 */
    const fore = [[0, 0.013], [0.03, 0.05], [0.075, 0.063, Mk], [0.093, 0.046, Mk], [0.086, 0.02], [0.05, -0.002], [0.01, -0.004]], hind = [[0, -0.004], [0.05, -0.006], [0.071, -0.03, edge], [0.061, -0.056, Mk], [0.035, -0.062, edge], [0.012, -0.041], [0, -0.02]];
    w.fan(fore, 0.035, 0.022, y0, B); w.fan(hind, 0.03, -0.028, y0 - 0.0003, B); w.spot(0.056, 0.03, 0.0065, y0, Mk); w.spot(0.045, -0.03, 0.005, y0 - 0.0003, B === 0xf2d24a ? 0x3d74c9 : Mk);
    if (B === 0xf2d24a) { for (const [x, z] of [[0.02, 0.03], [0.04, 0.04], [0.065, 0.047]]) w.spot(x, z, 0.0055, y0, Mk); }   /* 호랑나비 = 검은 줄무늬 · 뒷날개 파란 점 */
    return { body: g.geo(), wing: w.geo(), hinge: [0.0035, 0.0165, 0.006], clear: false }; }
  // ── 벌(꿀벌: 털 많은 가슴 · 줄무늬 배 · 투명한 날개 둘씩) — 길이 약 8cm ──
  function beeParts() { const g = GB(), Y = 0xe9b23a, K = 0x3a2a1a;
    g.ell(0, 0.012, 0.03, 0.0072, 0.0075, 0.0062, K); g.ell(0, 0.0135, 0.016, 0.0105, 0.0098, 0.0112, 0xb98a3a); g.ell(0, 0.0125, -0.006, 0.0098, 0.009, 0.0098, Y); g.ell(0, 0.0122, -0.0165, 0.0092, 0.0084, 0.0075, K); g.ell(0, 0.0118, -0.0245, 0.0074, 0.0068, 0.0068, Y); g.ell(0, 0.0115, -0.0315, 0.0045, 0.0042, 0.0048, K);
    for (const sg of [1, -1]) { g.ell(sg * 0.0055, 0.0135, 0.031, 0.0025, 0.0042, 0.0032, 0x1a1410); g.leg([[sg * 0.0022, 0.016, 0.035], [sg * 0.0045, 0.022, 0.037], [sg * 0.0085, 0.024, 0.047]], 0.0008, K); }
    legs6(g, { y: 0.0085, x0: 0.004, zs: [0.02, 0.0155, 0.011], kx: 0.012, ky: 0.012, fx: 0.016, fz: [0.01, 0.0, -0.012], r: 0.0012, hex: K });
    g.ell(0.0135, 0.004, 0.006, 0.0032, 0.0032, 0.0045, 0xe8a828); g.ell(-0.0135, 0.004, 0.006, 0.0032, 0.0032, 0.0045, 0xe8a828);   /* 뒷다리 꽃가루 덩이 */
    const w = GB(); w.fan([[0, 0.005], [0.022, 0.011], [0.044, 0.004], [0.04, -0.004], [0.018, -0.005], [0, -0.002]], 0.02, 0.002, 0, 0xe6f2f6, 0xbcd0da); w.fan([[0.004, -0.004], [0.022, -0.006], [0.03, -0.013], [0.014, -0.014]], 0.017, -0.009, -0.0004, 0xe6f2f6, 0xbcd0da);
    return { body: g.geo(), wing: w.geo(), hinge: [0.005, 0.021, 0.017], clear: true }; }
  // ── 매미(넓은 머리 · 양옆 큰 눈 · 지붕처럼 접은 투명 날개) — 길이 약 12cm ──
  function cicadaParts(c0) { const g = GB(), B = hx(c0 || 0x4b5a3a), D = 0x2f3a24;
    g.ell(0, 0.016, 0.034, 0.016, 0.0095, 0.0085, D); for (const sg of [1, -1]) g.ell(sg * 0.0155, 0.018, 0.034, 0.0055, 0.006, 0.006, 0x7a5a3a); g.ell(0, 0.019, 0.017, 0.0175, 0.0135, 0.0155, B); g.ell(0, 0.016, -0.016, 0.0145, 0.0122, 0.028, D);
    legs6(g, { y: 0.009, x0: 0.006, zs: [0.026, 0.017, 0.008], kx: 0.016, ky: 0.012, fx: 0.022, fz: [0.012, 0.001, -0.012], r: 0.0018, hex: 0x3a2e22 });
    const w = GB(); w.fan([[0, 0.012], [0.012, 0.006], [0.024, -0.03], [0.022, -0.075], [0.012, -0.098], [0.003, -0.09], [0, -0.02]], 0.011, -0.035, 0, 0xdbeef2, 0x7a8a6a);
    return { body: g.geo(), wing: w.geo(), hinge: [0.006, 0.03, 0.022], clear: true, roof: true }; }
  // ── 딱정벌레(장수풍뎅이: 둥근 겉날개 · 머리 뿔) — 길이 약 14cm ──
  function beetleGeo(c0, c1) { const g = GB(), B = hx(c0 || 0x5a3420), D = hx(c1 || 0x2a160c);
    g.ell(0, 0.026, -0.012, 0.031, 0.022, 0.044, B); g.ell(0, 0.024, 0.03, 0.025, 0.018, 0.017, D); g.ell(0, 0.016, 0.049, 0.012, 0.0095, 0.012, D); g.leg([[0, 0.019, 0.057], [0, 0.034, 0.073], [0, 0.05, 0.078], [0, 0.056, 0.07]], 0.004, D);
    g.seg([0, 0.0485, -0.012], [0, 0.0475, -0.05], 0.0012, 0x2a160c);   /* 겉날개 가운데 금 */
    legs6(g, { y: 0.012, x0: 0.012, zs: [0.034, 0.012, -0.008], kx: 0.03, ky: 0.022, fx: 0.042, fz: [0.022, 0.0, -0.024], r: 0.0032, hex: D }); return g.geo(); }
  // ── 무당벌레(빨간 둥근 등 · 검은 점 일곱) — 길이 약 6cm ──
  function ladyGeo(g, ox, oz, ry, c0) { const B = hx(c0 || 0xe2382b), K = 0x1d1d1d, c = Math.cos(ry), s = Math.sin(ry), at = (x, z) => [ox + x * c + z * s, oz - x * s + z * c];
    { const [x, z] = at(0, 0); g.ell(x, 0.012, z, 0.0245, 0.017, 0.029, B, 0, ry); } { const [x, z] = at(0, 0.027); g.ell(x, 0.009, z, 0.0125, 0.0085, 0.0095, K, 0, ry); }
    for (const [u, v, r] of [[0, 0.012, 0.0055], [0.011, 0.006, 0.005], [-0.011, 0.006, 0.005], [0.014, -0.008, 0.0048], [-0.014, -0.008, 0.0048], [0.007, -0.019, 0.0042], [-0.007, -0.019, 0.0042]]) { const yy = 0.012 + 0.017 * Math.sqrt(Math.max(0, 1 - (u / 0.0245) ** 2 - (v / 0.029) ** 2)); const [x, z] = at(u, v); g.ell(x, yy - 0.0012, z, r, 0.0022, r, K, 0, ry); }
    { const [a, b] = at(0, 0.012), [a2, b2] = at(0, -0.026); g.seg([a, 0.0292, b], [a2, 0.0235, b2], 0.0007, K); }
    for (const zz of [0.012, 0.0, -0.012]) for (const sg of [1, -1]) { const [a, b] = at(sg * 0.012, zz), [a2, b2] = at(sg * 0.024, zz + 0.004); g.leg([[a, 0.006, b], [a2, 0.0005, b2]], 0.0012, K); } }
  // ── 잠자리(큰 겹눈 · 긴 배 · 투명 날개 넷 펼침) — 날개 편 폭 약 20cm ──
  function dflyParts(c0) { const g = GB(), B = hx(c0 || 0xe0402e);
    for (const sg of [1, -1]) g.ell(sg * 0.0055, 0.016, 0.07, 0.0068, 0.0075, 0.0075, 0x8a2a20); g.ell(0, 0.016, 0.054, 0.0085, 0.0095, 0.012, B); g.leg([[0, 0.016, 0.044], [0, 0.0155, 0.0], [0, 0.014, -0.05], [0, 0.0125, -0.088]], 0.0042, B);
    legs6(g, { y: 0.01, x0: 0.003, zs: [0.06, 0.055, 0.05], kx: 0.009, ky: 0.007, fx: 0.012, fz: [0.008, 0.0, -0.006], r: 0.0008, hex: 0x3a2a22 });
    const w = GB(); w.fan([[0, 0.006], [0.04, 0.011], [0.094, 0.008], [0.1, 0.002], [0.05, -0.005], [0, -0.003]], 0.05, 0.003, 0, 0xe8f4f8, 0xb8c8d0); w.fan([[0, -0.009], [0.04, -0.008], [0.09, -0.012], [0.094, -0.019], [0.05, -0.026], [0, -0.016]], 0.048, -0.016, -0.0004, 0xe8f4f8, 0xb8c8d0);
    return { body: g.geo(), wing: w.geo(), hinge: [0.004, 0.019, 0.055], clear: true, flat: true }; }
  // ── 메뚜기·귀뚜라미(긴 몸 · 접은 날개 · 큰 뒷다리) ──
  function hopperGeo(c0, c1, cricket) { const g = GB(), B = hx(c0 || 0x7fae3a), D = hx(c1 || 0x4d7a22), L = cricket ? 0.75 : 1;
    g.ell(0, 0.016 * L, 0, 0.0105 * L, 0.012 * L, 0.044 * L, B); g.ell(0, 0.021 * L, 0.046 * L, 0.0095 * L, 0.0115 * L, 0.011 * L, B, -0.3); g.ell(0, 0.027 * L, -0.012 * L, 0.0085 * L, 0.0045 * L, 0.04 * L, D);
    for (const sg of [1, -1]) { g.ell(sg * 0.0072 * L, 0.025 * L, 0.05 * L, 0.0035 * L, 0.0042 * L, 0.0042 * L, 0x2a2a1a);
      if (cricket) { g.leg([[sg * 0.003, 0.025 * L, 0.055 * L], [sg * 0.03, 0.03, 0.09], [sg * 0.05, 0.02, 0.13]], 0.0007, D); g.seg([sg * 0.003, 0.016, -0.03], [sg * 0.012, 0.018, -0.05], 0.0012, D); }
      else g.leg([[sg * 0.003, 0.027, 0.053], [sg * 0.009, 0.034, 0.068], [sg * 0.013, 0.036, 0.08]], 0.0009, D);
      g.leg([[sg * 0.008 * L, 0.016 * L, -0.004 * L], [sg * 0.016 * L, 0.041 * L, -0.038 * L], [sg * 0.017 * L, 0.004, -0.014 * L], [sg * 0.019 * L, 0.0005, -0.03 * L]], 0.0048 * L, D); }   /* 큰 뒷다리(넓적다리 위로 · 종아리 아래로 접힘) */
    legs6(g, { y: 0.012 * L, x0: 0.006 * L, zs: [0.034 * L, 0.024 * L], kx: 0.016 * L, ky: 0.012 * L, fx: 0.021 * L, fz: [0.014 * L, 0.002], r: 0.0016, hex: D }); return g.geo(); }
  // ── 소금쟁이(가는 몸 · 아주 긴 가운데·뒷다리로 물 위에 섬) ──
  function striderGeo(c0) { const g = GB(), B = hx(c0 || 0x3a3028);
    g.seg([0, 0.012, 0.022], [0, 0.0125, -0.03], 0.0042, B); g.ell(0, 0.012, 0.027, 0.0045, 0.004, 0.006, B);
    for (const sg of [1, -1]) { g.ell(sg * 0.0038, 0.0135, 0.029, 0.0018, 0.0018, 0.0018, 0x111111); g.leg([[sg * 0.003, 0.011, 0.02], [sg * 0.012, 0.015, 0.03], [sg * 0.016, 0.0005, 0.036]], 0.0012, B);
      g.leg([[sg * 0.003, 0.011, 0.006], [sg * 0.045, 0.024, 0.02], [sg * 0.105, 0.0005, 0.052]], 0.0012, B); g.leg([[sg * 0.003, 0.011, -0.004], [sg * 0.04, 0.02, -0.03], [sg * 0.092, 0.0005, -0.092]], 0.0011, B);
      g.leg([[sg * 0.002, 0.012, 0.03], [sg * 0.007, 0.017, 0.042]], 0.0006, B); }
    return g.geo(); }
  // ── 사마귀 알집(가지에 붙은 거품 덩이) · 겨울나는 무당벌레 떼 ──
  function oothecaGeo(c0) { const g = GB(), B = hx(c0 || 0xd8c49a); g.seg([-0.06, 0.004, 0], [0.07, 0.004, 0.01], 0.006, 0x6b4a2f); for (const [x, y, s] of [[0, 0.02, 1], [0.014, 0.016, 0.8], [-0.013, 0.017, 0.82], [0.004, 0.03, 0.62]]) g.ell(x, y, 0, 0.017 * s, 0.014 * s, 0.014 * s, B); return g.geo(); }
  function clusterGeo(c0) { const g = GB(); for (const [x, z, r] of [[0, 0, 0], [0.04, 0.012, 1.2], [-0.038, 0.015, -1], [0.016, -0.036, 2.4], [-0.02, -0.032, 3.6]]) ladyGeo(g, x, z, r, c0); return g.geo(); }
  // ── 게(등딱지 · 눈자루 · 집게 둘(따로 움직임) · 걷는 다리 여덟) — 등딱지 폭 약 6~8cm ──
  function crabParts(c0, c1, o = {}) { const g = GB(), B = hx(c0 || 0xd9c8a0), D = hx(c1 || 0x8a7a5a), W = o.w || 1, LL = o.long ? 1.35 : 1;
    g.ell(0, 0.02 * W, 0, 0.038 * W, 0.0135 * W, 0.03 * W, B); g.ell(0, 0.012 * W, -0.002, 0.03 * W, 0.008 * W, 0.022 * W, D);
    for (const sg of [1, -1]) { const st = (o.stalk || 1) * W; g.seg([sg * 0.011 * W, 0.026 * W, 0.024 * W], [sg * 0.015 * W, 0.026 * W + 0.02 * st, 0.03 * W], 0.0018 * W, D); g.ell(sg * 0.015 * W, 0.027 * W + 0.021 * st, 0.03 * W, 0.0045 * W, 0.0045 * W, 0.0045 * W, 0x141210);
      for (let i = 0; i < 4; i++) { const z = (0.012 - i * 0.009) * W, kz = z + (0.006 - i * 0.006) * W; g.leg([[sg * 0.032 * W, 0.016 * W, z], [sg * 0.06 * W * LL, 0.03 * W * LL, kz], [sg * 0.082 * W * LL, 0.0006, kz + (0.004 - i * 0.007) * W]], 0.0032 * W, D); } }
    const claw = big => { const c = GB(), s = big ? 2.6 : 1, col = big ? hx(o.red || 0xe0453a) : B; c.seg([0, 0, 0], [0.018 * W, 0.002, 0.012 * W], 0.0035 * W, D); c.ell(0.024 * W * (big ? 1.4 : 1), 0.004, 0.02 * W * (big ? 1.5 : 1), 0.008 * W * s, 0.0055 * W * s * 0.8, 0.012 * W * s, col, 0, 0.5); c.seg([0.03 * W * (big ? 1.6 : 1), 0.004, 0.03 * W * (big ? 1.8 : 1)], [0.034 * W * (big ? 1.7 : 1), 0.004, 0.04 * W * (big ? 2.1 : 1)], 0.0022 * W * (big ? 2 : 1), col); return c.geo(); };
    return { body: g.geo(), clawR: claw(!!o.fiddler), clawL: claw(false), pivot: [0.026 * W, 0.016 * W, 0.022 * W] }; }
  // ── 갯고둥(나선 껍데기 · 발 · 더듬이) · 갯지렁이(마디) · 말뚝망둥어(머리 위 큰 눈 · 지느러미) ──
  function snailGeo(c0, c1) { const g = GB(), B = hx(c0 || 0x6d5f50), L = hx(c1 || 0xb3a58f); g.ell(0, 0.004, 0.004, 0.011, 0.0045, 0.03, 0x9a8a74);
    [[0.016, 0.026, B, 0.012], [0.012, 0.022, L, 0.03], [0.0085, 0.018, B, 0.045], [0.005, 0.013, L, 0.057]].forEach(([r, h, c, y]) => g.cone(0, y * 0.55 + 0.006, -0.006 - y * 0.25, r, h, c, -0.5));
    for (const sg of [1, -1]) g.seg([sg * 0.004, 0.006, 0.03], [sg * 0.009, 0.014, 0.042], 0.0011, 0x9a8a74); return g.geo(); }
  function wormGeo(c0, c1) { const g = GB(), A = hx(c0 || 0xcf7a66), B = hx(c1 || 0x8a3a2e); for (let i = 0; i < 11; i++) { const t = i / 10, x = Math.sin(t * 5.5) * 0.02, z = -0.06 + t * 0.12; g.ell(x, 0.0065, z, 0.0068, 0.0062, 0.0075, i % 2 ? A : B); } g.ell(Math.sin(5.5) * 0.02, 0.006, 0.066, 0.005, 0.005, 0.005, 0x5e2a20); return g.geo(); }
  function skipperGeo(c0, c1) { const g = GB(), B = hx(c0 || 0x7d6d55), S = hx(c1 || 0x4a7ad8);
    g.ell(0, 0.014, 0, 0.012, 0.013, 0.048, B); g.ell(0, 0.017, 0.042, 0.011, 0.012, 0.014, B); for (const sg of [1, -1]) { g.ell(sg * 0.0055, 0.031, 0.044, 0.0048, 0.0048, 0.0048, 0xf4f0e6); g.ell(sg * 0.0062, 0.033, 0.046, 0.0024, 0.0024, 0.0024, 0x1d1d1d);
      g.ell(sg * 0.013, 0.006, 0.018, 0.011, 0.0025, 0.0085, 0xa89070, 0, sg * 0.5); }   /* 가슴지느러미(펄을 짚음) */
    for (const [z, y] of [[0.0, 0.02], [-0.015, 0.018], [0.014, 0.019], [-0.028, 0.016]]) for (const sg of [1, -1]) g.ell(sg * 0.0105, y, z, 0.0018, 0.0022, 0.0022, S);
    g.ell(0, 0.029, 0.004, 0.0018, 0.011, 0.02, 0xa89070); g.ell(0, 0.015, -0.055, 0.0018, 0.013, 0.012, 0xa89070); return g.geo(); }
  // ── 새(박새만 한 작은 새 · 날개 둘(따로)) — 길이 약 14cm ──
  function birdParts(c0) { const g = GB(), B = hx(c0 || 0x6b4f3a); g.ell(0, 0.05, 0, 0.026, 0.028, 0.045, B, -0.15); g.ell(0, 0.044, 0.008, 0.02, 0.02, 0.03, 0xe8dcc0, -0.15); g.ell(0, 0.078, 0.04, 0.019, 0.019, 0.02, 0x2b2420);
    for (const sg of [1, -1]) { g.ell(sg * 0.012, 0.076, 0.046, 0.007, 0.0065, 0.006, 0xf4f0e6); g.ell(sg * 0.0165, 0.08, 0.05, 0.0022, 0.0024, 0.0024, 0x111111); g.leg([[sg * 0.008, 0.03, 0.004], [sg * 0.009, 0.012, 0.008], [sg * 0.009, 0.0006, 0.018]], 0.0018, 0x8a7a6a); }
    g.cone(0, 0.075, 0.064, 0.0045, 0.014, 0x3a3028, Math.PI / 2); g.ell(0, 0.054, -0.06, 0.016, 0.004, 0.03, 0x4a3a2e, 0.25);
    const w = GB(); w.fan([[0, 0.02], [0.03, 0.016], [0.07, -0.01, 0x2b2420], [0.05, -0.035], [0.01, -0.03], [0, -0.01]], 0.028, -0.005, 0, B, 0x4a3a2e); return { body: g.geo(), wing: w.geo(), hinge: [0.022, 0.064, 0.004], clear: false, bird: true }; }

  // 모양 만들기(Group · userData.wl/wr = 날개 경첩 · cl/cr = 집게) — kind = 그림 갈래(곤충 draw · 바다 친구 draw · 'ant' · 'bee' · 'bfly' · 'bird' · 'sand' · 'ghost')
  const CACHE = new Map();
  function parts(kind, c) { const k = kind + ':' + (c ? c.join(',') : ''); let P = CACHE.get(k); if (P) return P; const c0 = c && hx(c[0]), c1 = c && hx(c[1]);
    switch (kind) {
      case 'ant': P = { body: antGeo(c0) }; break;
      case 'butterfly': case 'bfly': P = bflyParts(c0 ?? 0xf6f4ea, c1 ?? 0x3a3a3a); break;
      case 'bee': P = beeParts(); break;
      case 'cicada': P = cicadaParts(c0); break;
      case 'beetle': P = { body: beetleGeo(c0, c1) }; break;
      case 'ladybird': { const g = GB(); ladyGeo(g, 0, 0, 0, c0); P = { body: g.geo() }; break; }
      case 'dragonfly': P = dflyParts(c0); break;
      case 'hopper': P = { body: hopperGeo(c0, c1, false) }; break;
      case 'cricket': P = { body: hopperGeo(c0 ?? 0x3a2a1e, c1 ?? 0x1e140c, true) }; break;
      case 'strider': P = { body: striderGeo(c0) }; break;
      case 'ootheca': P = { body: oothecaGeo(c0) }; break;
      case 'cluster': P = { body: clusterGeo(c0) }; break;
      case 'crab': P = crabParts(c0 ?? 0x8f8068, c1 ?? 0x5a4c3a, { w: 1.45, stalk: 1.6 }); break;
      case 'fiddler': P = crabParts(c0 ?? 0x5e5040, 0x3a2e24, { w: 1.35, fiddler: true, red: c1 ?? 0xe0453a }); break;
      case 'sand': P = crabParts(0xd9c8a0, 0xb8a47e, { w: 1.3 }); break;   /* 엽낭게(작고 모래빛) */
      case 'ghost': P = crabParts(0xf2ead8, 0xd8cdb4, { w: 1.3, long: true, stalk: 1.3 }); break;   /* 달랑게(하얗고 다리가 긺) */
      case 'snail': P = { body: snailGeo(c0, c1) }; break;
      case 'worm': P = { body: wormGeo(c0, c1) }; break;
      case 'skipper': P = { body: skipperGeo(c0, c1) }; break;
      case 'bird': P = birdParts(c0); break;
      case 'pellet': { const g = GB(); g.ell(0, 0.0055, 0, 0.0068, 0.0058, 0.0068, c0 ?? 0xd9c8a0); P = { body: g.geo() }; break; }   /* 엽낭게가 뱉은 모래 경단 */
      default: P = { body: hopperGeo(c0, c1, false) }; }
    CACHE.set(k, P); return P; }
  function make(kind, c) { const P = parts(kind, c), G = new T3.Group(), body = new T3.Mesh(P.body, MAT.body); G.add(body); G.userData.kind = kind;
    if (P.wing) { const mt = P.clear ? MAT.clear : MAT.wing; for (const sg of [1, -1]) { const pv = new T3.Group(); pv.position.set(P.hinge[0] * sg, P.hinge[1], P.hinge[2]); const m = new T3.Mesh(P.wing, mt); if (sg < 0) m.scale.x = -1; pv.add(m); G.add(pv); G.userData[sg > 0 ? 'wr' : 'wl'] = pv; } G.userData.roof = !!P.roof; G.userData.flat = !!P.flat; G.userData.bird = !!P.bird; }
    if (P.clawR) for (const sg of [1, -1]) { const pv = new T3.Group(); pv.position.set(P.pivot[0] * sg, P.pivot[1], P.pivot[2]); const m = new T3.Mesh(sg > 0 ? P.clawR : P.clawL, MAT.body); if (sg < 0) m.scale.x = -1; pv.add(m); G.add(pv); G.userData[sg > 0 ? 'cr' : 'cl'] = pv; }
    if (kind === 'butterfly' || kind === 'bfly') G.scale.setScalar(1.15); G.traverse(o => { o.userData.fx = 1; o.frustumCulled = false; }); return G; }
  // 날갯짓: a = 0(펼쳐 수평) ~ 1.3(위로 접음) · roof(매미) = 등 위로 접힌 채 · flat(잠자리) = 늘 펼침 + 떨림
  function wings(G, a) { const L = G.userData.wl, R = G.userData.wr; if (!L || !R) return; if (G.userData.bird && a < -0.05) { R.rotation.set(0, 1.42, -0.35); L.rotation.set(0, -1.42, 0.35); return; }   /* 새가 앉음 = 날개를 등 옆에 접음 */ if (G.userData.roof) { const o = Math.max(0, a - 0.2); R.rotation.set(0, -o * 0.9, -0.55 + o * 0.6); L.rotation.set(0, o * 0.9, 0.55 - o * 0.6); return; } R.rotation.set(0, 0, a); L.rotation.set(0, 0, -a); }
  // 개미 인스턴스(줄 하나 · 그리기 한 번)
  function antMesh(n) { const m = new T3.InstancedMesh(parts('ant').body, MAT.body, n); m.instanceMatrix.setUsage(T3.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; m.userData.fx = 1; m.visible = false; return m; }
  // 둥근 덩이 여럿을 한 메시로(게 구멍 · 모래 경단 — 마을 [x, y, z] 그대로 · 만들 때 한 번 · 치울 때 지오메트리도 버림)
  function blobs(L) { const g = GB(); for (const q of L) g.ell(q[0], q[1], q[2], q[3], q[4] ?? q[3], q[5] ?? q[3], q[6] ?? 0xd9c8a0); const m = new T3.Mesh(g.geo(), MAT.body); m.userData.fx = 1; m.userData.own = 1; m.frustumCulled = false; return m; }
  function dispose() { for (const P of CACHE.values()) for (const k of ['body', 'wing', 'clawR', 'clawL']) if (P[k]) P[k].dispose(); CACHE.clear(); for (const m of Object.values(MAT)) m.dispose(); }
  return { make, wings, antMesh, blobs, dispose, MAT };
}
