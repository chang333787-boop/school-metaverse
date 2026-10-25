// 🎨 마을 빛·물·바람(ART-2 · 사용자 10-17 '실사의 아름다움을 너의 능력으로 최대한' · '크롬북에서 돌아가게'): 사진을 붙이지 않고 로우폴리 결 그대로
//   아름다움은 빛의 방향(낮은 해·역광) · 색 온도(해 = 따뜻 · 그늘 = 푸름) · 대기 원근(멀수록 하늘빛) · 물의 결(하늘 비침·해 길·물가 물결) · 바람(갈대 물결)에서
//   새 Light X · 후처리 X · 매 프레임 새 객체 X(uniform 몇 개만) · 텍스처 = 잡음 한 장(128) · lite(크롬북·저사양·휴대폰) = 갈대 수·거리·물결 세부 줄임
//   글로우·플레어·반짝이 입자 X — 해 원반은 작고 가장자리만 부드럽게 · 물 반짝임은 해 쪽 길 하나
const C = (h) => h;   // 표 읽기 쉽게(16진 = sRGB)
// 하루 빛 표(게임 분 · 0~1440) — H 지평선 · Z 하늘 꼭대기 · G 해 쪽 산란 · D 원반 색 · dk 원반 세기 · el 원반 높이(도 · null = 빛 방향 그대로)
//   hs·hg·hi = 반구광(그늘 색 = 푸른 쪽) · sc·si = 해(달)빛 · ex 노출 · cl 구름 · fo 물가 물결 밝기 · sh 하늘 비침 세기
//   시간대(낮 06~17 · 노을 17~19 · 밤 19~06)의 해 자리와 맞물림 — 해 자리는 학교 시간대가 정하고(그림자 굽기 그대로) 여기서는 색만 이어 바꿈
const KEYS = [
  { m: 0, H: C(0x1f2d47), Z: C(0x08101f), G: C(0x3a4c70), D: C(0xeef2f8), dk: 0.95, el: 10, az: 60, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x33405a), fo: 0.22, sh: 0.5 },
  { m: 300, H: C(0x24324d), Z: C(0x0a1324), G: C(0x3a4c70), D: C(0xeef2f8), dk: 0.85, el: 8, az: 140, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x3a4660), fo: 0.24, sh: 0.5 },
  { m: 330, H: C(0x2c3854), Z: C(0x0d1628), G: C(0x3a4c70), D: C(0xeef2f8), dk: 0.0, el: 12, az: 155, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x3a4660), fo: 0.24, sh: 0.5 },
  { m: 345, H: C(0x7a6f8c), Z: C(0x1f2d50), G: C(0xd9876a), D: C(0xeef2f8), dk: 0.0, el: -4, az: 15, hs: C(0x6a7aa6), hg: C(0x4a4f60), hi: 1.3, sc: C(0xb4bcd6), si: 0.9, ex: 1.15, cl: C(0x8a7f98), fo: 0.35, sh: 0.55 },
  { m: 362, H: C(0xd9a89a), Z: C(0x4f6fa8), G: C(0xf0a070), D: C(0xfff0d6), dk: 0, el: 0, az: 15, hs: C(0x9fb0d6), hg: C(0xb8ac9e), hi: 1.5, sc: C(0xffc898), si: 2.3, ex: 1.1, cl: C(0xe8c4b8), fo: 0.6, sh: 0.55 },
  { m: 375, H: C(0xeec6aa), Z: C(0x6f97cf), G: C(0xffa868), D: C(0xfff0d6), dk: 1, el: 2, az: 15, hs: C(0xb9c6e2), hg: C(0xd2c6b8), hi: 1.6, sc: C(0xffd2a0), si: 2.55, ex: 1.08, cl: C(0xffd9c4), fo: 0.8, sh: 0.5 },
  { m: 450, H: C(0xd9e6ee), Z: C(0x78ace4), G: C(0xf2d4a8), D: C(0xfff4de), dk: 1, el: 8, az: 22, hs: C(0xbfd3ef), hg: C(0xd9d1c4), hi: 1.7, sc: C(0xffeccc), si: 2.95, ex: 1.06, cl: C(0xfff6ee), fo: 0.95, sh: 0.42 },
  { m: 600, H: C(0xd0e7f5), Z: C(0x5a9de0), G: C(0xfff3dc), D: C(0xfffbf0), dk: 1, el: 48, az: 55, hs: C(0xbad4f2), hg: C(0xd9d3c6), hi: 1.75, sc: C(0xfff0cf), si: 3.1, ex: 1.05, cl: C(0xffffff), fo: 1.0, sh: 0.34 },
  { m: 930, H: C(0xd8e6ee), Z: C(0x62a1dc), G: C(0xffecd0), D: C(0xfff8ea), dk: 1, el: 38, az: 125, hs: C(0xbcd3ee), hg: C(0xd9d1c2), hi: 1.72, sc: C(0xffeac4), si: 3.05, ex: 1.05, cl: C(0xfffaf2), fo: 1.0, sh: 0.36 },
  { m: 1020, H: C(0xecd8bc), Z: C(0x6c93d0), G: C(0xffb468), D: C(0xfff1cc), dk: 1, el: 19, az: 160, hs: C(0xd8c8d8), hg: C(0xd2bca4), hi: 1.5, sc: C(0xffc888), si: 2.8, ex: 1.08, cl: C(0xffe6cc), fo: 0.9, sh: 0.48 },
  { m: 1095, H: C(0xe2b0a2), Z: C(0x5870b0), G: C(0xff8a3c), D: C(0xffdc98), dk: 1, el: 5, hs: C(0xe0b8b8), hg: C(0xcca890), hi: 1.48, sc: C(0xffb46e), si: 2.8, ex: 1.12, cl: C(0xf6b4a0), fo: 0.8, sh: 0.6 },
  { m: 1140, H: C(0x535a82), Z: C(0x1b2649), G: C(0xb8665a), D: C(0xeef2f8), dk: 0.0, el: -2, az: 163, hs: C(0x5f76a4), hg: C(0x41495c), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x5a5a78), fo: 0.32, sh: 0.55 },
  { m: 1170, H: C(0x3a4466), Z: C(0x121b38), G: C(0x6a5068), D: C(0xeef2f8), dk: 0.0, el: -6, az: 163, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x3c4662), fo: 0.24, sh: 0.5 },
  { m: 1200, H: C(0x2a3756), Z: C(0x0e1730), G: C(0x3a4c70), D: C(0xeef2f8), dk: 0.0, el: 6, az: 20, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x3c4662), fo: 0.24, sh: 0.5 },
  { m: 1230, H: C(0x22314b), Z: C(0x0a1222), G: C(0x3a4c70), D: C(0xeef2f8), dk: 0.9, el: 6, az: 20, hs: C(0x5a73a0), hg: C(0x3d4658), hi: 1.25, sc: C(0xa8bcda), si: 0.9, ex: 1.15, cl: C(0x33405a), fo: 0.22, sh: 0.5 },
  { m: 1440 },
];
KEYS[KEYS.length - 1] = { ...KEYS[0], m: 1440 };   // 원반 방위 az(도 · 동 = 0 · 남 = 90 · null = 빛 방위) — 해는 동쪽 바다에서 떠 남쪽을 지나 서쪽으로(물 위 해 길·산란이 따라감) · 밤 달은 동쪽 바다 위로 떠서 남쪽으로(달빛 길이 바다에 보이게 · 달빛 세기는 약해 그늘 방향 차이는 눈에 안 띔)
// 비·눈 = 흐린 하늘(해 원반·산란 끔 · 빛을 고르게) — 표 위에 덮어 섞음
const OVC = { rain: { H: 0xb4bcc4, Z: 0x8e98a4, k: 0.85, si: 0.55, hi: 1.12 }, snow: { H: 0xdfe4ea, Z: 0xb9c2cc, k: 0.8, si: 0.6, hi: 1.12 }, storm: { H: 0x7d8792, Z: 0x5f6a78, k: 0.95, si: 0.35, hi: 0.86 } };   /* TYPH-1 태풍 날 = 더 어두운 비 하늘(새 Light X · 있는 빛 세기만) */

// 공용 셰이더 조각: 하늘빛(지평선 → 꼭대기) + 해 쪽 산란 — 물·펄·하늘이 같은 식을 씀
export const SKYF = `
#ifndef SKYF_A
#define SKYF_A
uniform vec3 uSkyH_a; uniform vec3 uSkyZ_a; uniform vec3 uGlow_a; uniform vec3 uSunW_a; uniform vec3 uSunC_a; uniform float uT_a; uniform sampler2D uNz_a;
float p5_a(float x) { float x2 = x * x; return x2 * x2 * x; }
vec3 skyFog_a(vec3 d) { float h = clamp(d.y, 0.0, 1.0); vec3 c = mix(uSkyH_a, uSkyZ_a, (sqrt(h) + h * (1.6 - 0.6 * h)) * 0.5); float s = max(dot(d, uSunW_a), 0.0); return c + uGlow_a * (p5_a(s) * (0.3 + 0.7 * (1.0 - smoothstep(0.0, 0.5, h))) * 0.5); }
vec3 skyCol_a(vec3 d) { float s = max(dot(d, uSunW_a), 0.0), s8 = s * s; s8 *= s8; s8 *= s8; float s32 = s8 * s8; s32 *= s32; return skyFog_a(d) + uGlow_a * s32 * s8 * 0.35; }
vec3 skyFogL_a(vec3 d) { return mix(uSkyH_a, uSkyZ_a, clamp(d.y * 1.4, 0.0, 1.0)); }
vec3 skyRef_a(vec3 d, float s) { return mix(uSkyH_a, uSkyZ_a, smoothstep(0.0, 0.6, d.y)) + uGlow_a * p5_a(s) * 0.45; }
float p256_a(float x) { x *= x; x *= x; x *= x; x *= x; x *= x; x *= x; x *= x; return x * x; }
#endif
`;
// 물 조각(바다·밀물): 물결 기울기(멀수록 0 — 깜빡임 X) → 하늘 비침(프레넬) + 해 길 · 물가 물결 줄(DEP)
const WATERF = `
{ vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist; float fd = 1.0 - smoothstep(30.0, 230.0, dist);
  vec2 q = vWP_a.xz; float t = uT_a;
  vec2 g = vec2(cos(q.x * 0.19 + q.y * 0.11 + t * 0.85), cos(q.y * 0.23 - q.x * 0.08 + t * 1.05)) * 0.085;
#ifndef LITE_A
  g += vec2(cos(q.x * 0.61 - q.y * 0.43 - t * 1.6), cos(q.y * 0.67 + q.x * 0.39 + t * 1.8)) * 0.045 * fd;
#endif
  vec3 N = normalize(vec3(-g.x * fd, 1.0, -g.y * fd)); float ndv = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.04 + 0.96 * p5_a(1.0 - ndv); vec3 R = reflect(-V, N); R.y = abs(R.y); float sd = max(dot(R, uSunW_a), 0.0), s16 = sd * sd; s16 *= s16; s16 *= s16; s16 *= s16;
  outgoingLight = mix(outgoingLight, mix(skyRef_a(R, sd), uSkyZ_a, 0.3), F * uRefl_a);
  outgoingLight += uSunC_a * (p256_a(sd) * 1.6 + s16 * sd * sd * sd * sd * 0.07) * (0.4 + 0.6 * fd);
#ifdef DEP_A
  if (vDep_a < 1.3) { float sh = 1.0 - smoothstep(0.05, 1.3, vDep_a); float nz = texture2D(uNz_a, q / 64.0).r;
    float w = smoothstep(0.86, 0.985, sin(vDep_a * 6.5 + t * 0.75 + nz * 9.0)) * sh; outgoingLight = mix(outgoingLight, uFoam_a, w * 0.5 * fd); }
#endif
}
`;
// 펄 조각(갯벌): 갯골 = 잡음의 같은 높이 선(구불구불) · 고인 물 = 잡음 꼭대기 · 젖은 펄 = 옅은 하늘 비침 + 넓은 해 윤기 · 물 = 하늘 거울 + 좁은 해 빛
const MUDF = `
{ vec2 q = vWP_a.xz; float wt = vWt_a;
#ifndef LITE_A
  vec2 wq = vec2(texture2D(uNz_a, q / 300.0).r, texture2D(uNz_a, q / 300.0 + 0.5).r) - 0.5; float n = texture2D(uNz_a, q / 150.0 + wq * 0.3).r;
  float n2 = texture2D(uNz_a, q / 37.0 + 0.27).r; float m = n + (n2 - 0.5) * 0.16; float aw = fwidth(m);
  float d5 = abs(m - 0.5), cr = 1.0 - smoothstep(0.011, 0.02 + aw * 1.2, d5), bank = (1.0 - smoothstep(0.02, 0.07 + aw * 2.0, d5)) * (1.0 - cr);
  float pool = smoothstep(0.69, 0.705 + aw, n2) * smoothstep(0.38, 0.62, n);
  float wat = max(cr, pool) * wt;
#else
  float n = texture2D(uNz_a, q / 150.0).r, aw = fwidth(n), d5 = abs(n - 0.5), wat = (1.0 - smoothstep(0.011, 0.02 + aw * 1.2, d5)) * wt, bank = 0.0;
#endif
  outgoingLight *= mix(1.0, (0.86 + 0.26 * n) * (1.0 - 0.24 * bank), wt) * (1.0 - 0.2 * wat);
  outgoingLight = mix(outgoingLight, vMSky_a, vMF_a * mix((0.2 + 0.32 * bank) * wt * uWetK_a, 0.9, wat));
  outgoingLight += uSunC_a * vMSh_a * 0.16 * wt * uWetK_a * (0.6 + 0.8 * bank);
  if (wat > 0.01) { vec3 V = normalize(cameraPosition - vWP_a); float sd = max(dot(vec3(-V.x, V.y, -V.z), uSunW_a), 0.0); outgoingLight += uSunC_a * p256_a(sd) * 1.4 * wat; }   /* 좁은 해 빛 = 물(갯골·웅덩이)에서만 */
}
`;
// 펄 바탕: 가장자리는 둘레 땅과 같은 풀 무늬(이음매 X) → 안쪽은 무늬 대신 잔 물결 자국(잡음)
const MUDMAP = `
{ float wm = smoothstep(0.05, 0.5, vWet_a);
#ifdef USE_MAP
  vec4 tx = texture2D(map, vMapUv); diffuseColor *= mix(tx, vec4(1.0), wm);
#endif
#ifndef LITE_A
  float r1 = texture2D(uNz_a, vWP_a.xz / 6.0).r * 0.7 + texture2D(uNz_a, vWP_a.xz * vec2(0.9, 0.35) + 0.3).r * 0.3; diffuseColor.rgb *= 1.0 + (r1 - 0.5) * 0.3 * wm;
#endif
}
`;
// ───────── ART-3 땅 결(10-24 · town_art3.md): 논·밭·강·둔치 — 판은 이미 따로 그려지므로 재질에 조각만 덧붙임(그리기 +0) ─────────
//   계절 무게 uSea_a = (봄, 여름, 가을, 겨울) · 비 uRain_a(0~1 · 천천히 젖고 마름) · vAc_a = 줄 건너는 축(0 = x · 1 = z) · vRUv_a = 원래 uv(줄 자리 · 물 흐름 길이)
//   숫자 출처(일반 공개 사진을 보기만 · 사진은 넣지 않음): 모 줄 간격 30cm 안팎 · 그루터기 포기 30×15cm 격자 · 물 댄 논 = 흙탕 바탕에 하늘이 비침 · 자갈 둔치 = 회백 돌 + 물가 1m 안 젖은 띠
const PADDYF = `
{ vec2 q = vWP_a.xz; vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist; float fd = 1.0 - smoothstep(25.0, 90.0, dist), t = uT_a;
  float ph = fract(vRUv_a.x * 4.0), rd = abs(ph - 0.5) * 2.0, sp = uSea_a.x, su = uSea_a.y, au = uSea_a.z, wi = uSea_a.w;
  vec2 ax = vAc_a > 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0); float sa = dot(uSunW_a.xz, ax) * sign(ph - 0.5);
  float row = 1.0 - smoothstep(0.26, 0.62, rd); outgoingLight *= 1.0 - (su + au) * row * (0.08 + 0.16 * max(0.0, -sa));   /* 벼 줄 곁 그늘(해 반대쪽이 더 어둡게) = 줄 결 */
  float wu = max(uWlv_a, 0.0), wd = max(-uWlv_a, 0.0), pw = clamp(sp + wu * (su * 0.7 + au * 0.3), 0.0, 1.0), lo = 0.2 - 0.12 * wu * sp + 0.24 * wd, wm = 0.0;   /* WATER-1 논물: 비 뒤 = 줄 사이 물이 차오름(여름 논에도 물낯) · 가뭄 = 물이 줄 가운데로 물러남 */
  if (pw > 0.01) { vec2 g = vec2(cos(q.x * 0.9 + q.y * 0.5 + t * 1.3), cos(q.y * 1.1 - q.x * 0.4 + t * 1.6)) * 0.03;
#ifndef LITE_A
    g += vec2(cos(q.x * 2.7 - q.y * 1.9 - t * 2.4), cos(q.y * 2.9 + q.x * 1.7 + t * 2.1)) * 0.015 * fd;
#endif
    vec3 N = normalize(vec3(-g.x * fd, 1.0, -g.y * fd)); float ndv = clamp(dot(N, V), 0.0, 1.0), F = 0.06 + 0.94 * p5_a(1.0 - ndv); vec3 R = reflect(-V, N); R.y = abs(R.y); float sd = max(dot(R, uSunW_a), 0.0);
    vec3 wc = mix(outgoingLight * vec3(0.6, 0.58, 0.48), skyRef_a(R, sd), clamp(F + 0.16, 0.0, 0.72)) + uSunC_a * p256_a(sd) * 1.2;   /* 흙탕 물 바닥 + 하늘 비침 + 좁은 해 빛 */
    wm = pw * (1.0 - 0.45 * wd) * smoothstep(lo, lo + 0.14, rd); outgoingLight = mix(outgoingLight, wc, wm); }
#ifndef LITE_A
  if (wd > 0.01 && fd > 0.01 && wi < 0.99) { vec2 cq = q / 0.32, ci = floor(cq), cf = fract(cq); float d1 = 8.0, d2 = 8.0;   /* 가뭄 = 마른 논바닥 갈라짐(32cm 칸 · 가까이만 · 물 빠진 줄 사이에만) */
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)), h = ci + o, r = o + vec2(fract(sin(dot(h, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(h, vec2(39.35, 11.13))) * 24634.6)) - cf; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    float eg = sqrt(d2) - sqrt(d1), aw = fwidth(cq.x), ck = (1.0 - smoothstep(0.018, 0.04 + aw, eg)) * (1.0 - smoothstep(0.25, 0.5, aw)), k = wd * clamp(sp + su + au, 0.0, 1.0) * (1.0 - row) * (1.0 - wm) * fd, lu = dot(outgoingLight, vec3(0.3, 0.59, 0.11));
    outgoingLight = mix(outgoingLight, lu * vec3(1.18, 1.02, 0.74), 0.45 * k) * (1.0 - 0.32 * ck * k); }   /* 마른 흙빛 + 가는 금 */
#endif
  if (au > 0.01) { float wv = dot(q, vec2(0.11, 0.06)) - t * 1.5, gust = 0.5 + 0.5 * sin(wv) * sin(wv * 0.37 + 1.3), nz = texture2D(uNz_a, q / 3.0).r, lu = dot(outgoingLight, vec3(0.3, 0.59, 0.11));
    outgoingLight = mix(outgoingLight, lu * vec3(1.95, 1.45, 0.42), au * 0.85) * (1.0 + au * ((gust - 0.5) * 0.3 * uWind_a + (nz - 0.5) * 0.1 * fd)); }   /* 줄 사이도 누런 이삭 · 갈대와 같은 바람 물결이 이삭 위로 지나감 */
#ifndef LITE_A
  if (wi > 0.01) { vec2 cl = vec2(ph * 1.6 / 0.4, vRUv_a.y * 8.0 / 0.3), ci = floor(cl), jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6)), f = (fract(cl) - 0.3 - 0.4 * jr) * vec2(0.4, 0.3);
    float aw = fwidth(cl.y), dt9 = (1.0 - smoothstep(0.035, 0.06, length(f))) * (1.0 - smoothstep(0.25, 0.5, aw)) * step(0.22, jr.x * 0.6 + jr.y * 0.4);
    outgoingLight = mix(outgoingLight, outgoingLight * vec3(0.78, 0.66, 0.46), wi * dt9 * 0.7); }   /* 겨울 그루터기 점(포기 줄 40×30cm 언저리 · 조금씩 어긋나고 군데군데 빔 · 멀면 사라짐) */
#endif
}
`;
const FARMF = `
{ float ph = fract(vRUv_a.x * 4.0), s = ph - 0.5, h = 0.5 + 0.5 * cos(6.2832 * s), na = sin(6.2832 * s); vec2 ax = vAc_a > 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0); float sa = dot(uSunW_a.xz, ax);
  float k = 1.0 - smoothstep(0.25, 0.6, fwidth(vRUv_a.x * 4.0)); outgoingLight *= 1.0 + (na * sa * 0.5 - (1.0 - h) * 0.14) * k;   /* 이랑 비탈: 해 쪽 밝게 · 반대쪽·고랑 어둡게(멀면 고르게 — 깜빡임 X) */
  if (uRain_a > 0.01) { float fur = 1.0 - h; outgoingLight *= 1.0 - uRain_a * (0.08 + 0.16 * fur);   /* 젖은 흙(바탕 어둡게는 땅과 같은 젖음 조각 wetChain이 · 여기선 고랑에 고인 물기만 더) */
#ifndef LITE_A
    vec3 V = normalize(cameraPosition - vWP_a); float F = 0.04 + 0.96 * p5_a(1.0 - clamp(V.y, 0.0, 1.0)); outgoingLight = mix(outgoingLight, skyRef_a(vec3(-V.x, V.y, -V.z), 0.0), F * 0.3 * uRain_a * (0.4 + 0.6 * fur));
#endif
  } }
`;
const RIVF = `
{ vec2 uv = vRUv_a; float t = uT_a; vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist; float fd = 1.0 - smoothstep(30.0, 160.0, dist);
  float al = uv.y * 7.0, e = abs(uv.x / 1.2 - 0.5) * 2.0, s1 = texture2D(uNz_a, vec2(uv.x * 0.9, al / 26.0 - t * 0.06)).r;
#ifndef LITE_A
  s1 = s1 * 0.6 + texture2D(uNz_a, vec2(uv.x * 2.1 + 0.3, al / 11.0 - t * 0.13)).r * 0.4;
#endif
  float streak = smoothstep(0.52, 0.7, s1) * (1.0 - 0.6 * e), rz = smoothstep(0.64, 0.74, texture2D(uNz_a, vec2(al / 160.0, 0.71)).r) * (1.0 - 0.5 * e), wf = rz * smoothstep(0.6, 0.78, texture2D(uNz_a, vec2(uv.x * 3.1 + al * 0.013, al / 2.2 - t * 0.5)).r) * (0.5 + 0.5 * fd);
  vec2 g = vec2((s1 - 0.5) * 0.14, cos(al * 0.9 - t * 2.0) * 0.04) * fd; vec3 N = normalize(vec3(g.x, 1.0, g.y)); float ndv = clamp(dot(N, V), 0.0, 1.0), F = 0.04 + 0.96 * p5_a(1.0 - ndv); vec3 R = reflect(-V, N); R.y = abs(R.y); float sd = max(dot(R, uSunW_a), 0.0);
  outgoingLight = mix(outgoingLight, skyRef_a(R, sd), F * uRefl_a * 0.8) * (1.0 + streak * 0.14);   /* 하늘 비침 + 흐름 따라 길게 흘러가는 물살 결 */
  outgoingLight = mix(outgoingLight, uFoam_a, wf * 0.45) + uSunC_a * p256_a(sd) * fd;   /* 여울 흰 물결(강 따라 군데군데 · 자리는 그대로, 물결만 흐름) + 좁은 해 빛 */
}
`;
const BANKF = `
{ vec2 q = vWP_a.xz; float s = vSd_a, nz = texture2D(uNz_a, q / 9.0).r;
  float gz = (1.0 - smoothstep(1.2, 4.2, s + (nz - 0.5) * 3.0)) * (1.0 - 0.75 * uSea_a.w), wb = 1.0 - smoothstep(0.25, 1.1, s + (nz - 0.5) * 0.6);
#ifndef LITE_A
  vec2 cq = q / 0.24, ci = floor(cq); vec2 jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6));
  float d9 = length(fract(cq) - 0.3 - 0.4 * jr), st = 1.0 - smoothstep(0.26, 0.42, d9), p1 = texture2D(uNz_a, q / 7.0 + 0.61).r, pk = 1.0 - smoothstep(0.25, 0.7, fwidth(cq.x)), peb = mix(0.5, mix(0.15, 0.55 + 0.45 * jr.x, st), pk);   /* 잔돌 = 24cm 칸마다 자리·밝기가 다른 돌 하나(되풀이 무늬 X · 멀면 고르게) */
#else
  float p1 = nz, peb = 0.5;
#endif
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.58, 0.53) * (0.82 + 0.22 * p1) * (0.78 + 0.4 * peb), gz) * (1.0 - 0.3 * wb);   /* 자갈 둔치(회백 돌 · 큰 얼룩 + 잔돌 점) · 물가 젖은 띠 */
}
`;
// 염전(ART-3 b): 소금판 칸 = 얕은 물 거울(하늘 비침 · 아주 잔 물결 · 좁은 해 빛 = 맑은 낮에만 반짝) · 소금 꽃 = 18cm 칸마다 흰 결정 하나(흰 소금 칸은 빽빽 · 물 칸은 드문드문) — vColor 밝기로 소금 칸을 가림
const SALTF = `
{ vec2 q = vWP_a.xz; vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist; float fd = 1.0 - smoothstep(20.0, 80.0, dist), t = uT_a, sl = smoothstep(0.78, 0.88, vColor.r), wat = 1.0 - 0.85 * sl;
  vec2 g = vec2(cos(q.x * 1.3 + q.y * 0.4 + t * 0.9), cos(q.y * 1.1 - q.x * 0.3 - t * 1.1)) * 0.012 * fd; vec3 N = normalize(vec3(g.x, 1.0, g.y)); float ndv = clamp(dot(N, V), 0.0, 1.0), F = 0.04 + 0.96 * p5_a(1.0 - ndv); vec3 R = reflect(-V, N); R.y = abs(R.y); float sd = max(dot(R, uSunW_a), 0.0);
  outgoingLight = mix(outgoingLight, skyRef_a(R, sd), clamp(F + 0.22, 0.0, 0.7) * wat) + uSunC_a * p256_a(sd) * 1.3 * wat;
#ifndef LITE_A
  vec2 cq = q / 0.18, ci = floor(cq), jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6));
  float fl = (1.0 - smoothstep(0.1 + 0.12 * jr.y, 0.18 + 0.14 * jr.y, length(fract(cq) - 0.3 - 0.4 * jr))) * step(jr.x, 0.18 + 0.6 * sl) * (1.0 - smoothstep(0.3, 0.7, fwidth(cq.x)));
  outgoingLight = mix(outgoingLight, vec3(0.5 + 0.42 * clamp(uSunC_a.g, 0.0, 1.2)), fl * 0.75);
#endif
}
`;
// 모래사장(ART-3 b): 마른 모래 = 바람 결(구불구불 잔 줄 · 멀면 고르게) · 물가 = 젖은 모래 띠(물때 따라 · 썰물이면 넓게) + 옅은 하늘 윤기 · 파도 거품 줄(밀려왔다 물러남) — 둘레 땅과 같은 재질 위에 vSw_a(모래 무게)만큼만
const SANDF = `
{ vec2 q = vWP_a.xz; float sw = vSw_a, s = vSsd_a, t = uT_a; vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist; float fd = 1.0 - smoothstep(25.0, 110.0, dist), nz = texture2D(uNz_a, q / 23.0).r;
  float tf = clamp((uWetK_a - 0.72) / 0.28, 0.0, 1.0), ww = 1.2 + 3.2 * (1.0 - tf), wb = (1.0 - smoothstep(ww - 0.25, ww + 0.35, s + (nz - 0.5) * 1.6)) * sw;
#ifndef LITE_A
  float ph = dot(q, vec2(0.83, 0.55)) / 0.9 + (texture2D(uNz_a, q / 31.0 + 0.2).r - 0.5) * 9.0, aw = fwidth(ph), rp = sin(ph * 6.2832) * (1.0 - smoothstep(0.25, 0.6, aw));
  outgoingLight *= 1.0 + rp * 0.08 * sw * (1.0 - wb);
#endif
  outgoingLight *= 1.0 - vec3(0.13, 0.15, 0.17) * wb; outgoingLight = mix(outgoingLight, skyRef_a(vec3(-V.x, V.y, -V.z), 0.0), (0.04 + 0.96 * p5_a(1.0 - clamp(V.y, 0.0, 1.0))) * 0.35 * wb);
  float e = 0.5 + 1.1 * (0.5 + 0.5 * sin(t * 0.55 + dot(q, vec2(0.021, 0.013)) + nz * 3.0)), fo = (1.0 - smoothstep(0.05, 0.22 + 0.2 * (1.0 - fd), abs(s - e))) * sw * (0.55 + 0.45 * fd);
  outgoingLight = mix(outgoingLight, uFoam_a, fo * 0.6 * step(0.0, s)); }   /* 거품 줄 = 물가 0.5~1.6m 사이를 오감(자리마다 조금씩 늦게) */
`;
// 모래 바탕: 땅 풀결 그림(초록 획) 대신 모래 알갱이 얼룩 — 모래 무게만큼(둘레 땅과 이음매 X)
const SANDMAP = `
#ifdef USE_MAP
{ vec4 tx = texture2D(map, vMapUv); float g9 = texture2D(uNz_a, vWP_a.xz / 5.3 + 0.17).r * 0.6 + texture2D(uNz_a, vWP_a.xz / 7.7 + 0.43).r * 0.4; diffuseColor *= mix(tx, vec4(vec3(0.93 + 0.12 * g9), 1.0), vSw_a); }
#endif
`;
// ───────── ART-3 c(10-25 · town_art3.md 6·7번): 숲·산 가장자리 · 보도·시내 길 ─────────
//   숲 = 땅 메시 그대로(그리기 +0) · 꼭짓점 속성 fw_a = (숲 무게 0~1, 6 − 흙길 가장자리까지 거리 m · 속성이 없으면 0 = 결 없음) · vNy_a = 땅 기울기(바위 노두)
//   숫자 출처(일반 공개 사진을 보기만 · 사진은 넣지 않음): 낙엽 한 장 10~15cm(23cm 칸에 하나 남짓) · 길섶 풀 띠 1~2m · 바위 노두 = 1m 안팎 면이 꺾인 회색 돌 + 이끼 얼룩 · 우듬지 그늘 = 2~7m 얼룩 사이로 햇빛 조각
//   보도 = 길 판을 묶음 하나로(그리기 +1) · pd_a = (길 방향 x, z, 종류 1 = 보도블록 · 2 = 아스팔트) · 보도블록 40×20cm 엇갈려 쌓기 · 줄눈 1.2cm
const FORB = `
{ vec2 q = vWP_a.xz; float fd = 1.0 - smoothstep(70.0, 170.0, distance(cameraPosition, vWP_a)), fw = vFw_a.x * fd, td = mix(6.0, 6.0 - vFw_a.y, fd), au = uSea_a.z, wi = uSea_a.w;   /* 멀리서는 우듬지가 보이는 숲 초록 그대로(산이 갈색이 되지 않게) */
  float n1 = texture2D(uNz_a, q / 13.0).r, n2 = texture2D(uNz_a, q / 3.7 + 0.29).r, lu = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)), sn = smoothstep(0.42, 0.62, lu);   /* sn = 눈 덮인 땅(밝은 흰빛)은 덜 덮음 */
  float eb = smoothstep(0.03, 0.16, fw) * (1.0 - smoothstep(0.3, 0.6, fw)), vg = max(1.0 - smoothstep(0.4, 2.6, td + (n2 - 0.5) * 1.2), eb * 0.8) * (1.0 - sn);   /* 길섶 풀 = 흙길 가장자리 2m 안 + 숲 가장자리 띠 */
  if (vg > 0.01) { vec3 gc = mix(mix(vec3(0.30, 0.46, 0.10), vec3(0.42, 0.50, 0.12), n1), vec3(0.58, 0.48, 0.22), au * 0.8); gc = mix(gc, vec3(0.50, 0.44, 0.32), wi);
    float bl = texture2D(uNz_a, vec2(q.x * 1.9 + q.y * 0.4, q.y * 0.33 - q.x * 0.21)).r; diffuseColor.rgb = mix(diffuseColor.rgb, gc * (0.8 + 0.42 * bl), vg * 0.75); }   /* 한쪽으로 길게 늘인 잡음 = 키 큰 풀 결 */
  if (fw > 0.01) { float k = smoothstep(0.06, 0.55, fw) * (1.0 - 0.7 * sn), pa = smoothstep(0.3, 0.7, n1 + (fw - 0.5) * 0.6);
    vec3 lt = mix(vec3(0.24, 0.17, 0.08), vec3(0.36, 0.26, 0.12), n2); lt = mix(lt, mix(vec3(0.46, 0.20, 0.05), vec3(0.58, 0.40, 0.08), n2), au); vec3 ms = vec3(0.13, 0.24, 0.06) * (0.8 + 0.4 * n1);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(ms, lt, mix(pa, 0.85, au)), k * (0.58 + 0.32 * pa));   /* 숲 바닥 = 낙엽 무더기 · 이끼 얼룩(가을엔 거의 다 낙엽) */
#ifndef LITE_A
    vec2 cq = q / 0.23, ci = floor(cq), jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6));
    float lf = (1.0 - smoothstep(0.16, 0.24, length((fract(cq) - 0.3 - 0.4 * jr) * vec2(1.0, 1.6)))) * step(jr.x, 0.35 + 0.45 * au) * (1.0 - smoothstep(0.25, 0.6, fwidth(cq.x)));
    vec3 lc = jr.y < 0.5 ? vec3(0.42, 0.28, 0.10) : vec3(0.30, 0.20, 0.09); lc = mix(lc, jr.y < 0.33 ? vec3(0.62, 0.16, 0.05) : jr.y < 0.66 ? vec3(0.78, 0.55, 0.10) : vec3(0.52, 0.30, 0.08), au);
    diffuseColor.rgb = mix(diffuseColor.rgb, lc, lf * k * 0.8);   /* 낙엽 한 장씩(23cm 칸마다 자리·색이 다름 · 가을엔 빨강·노랑 · 멀면 사라짐) */
#endif
    float rn = texture2D(uNz_a, q / 17.0 + 0.61).r + (1.0 - vNy_a) * 0.7 + (n2 - 0.5) * 0.1, aw9 = fwidth(rn), fi = smoothstep(0.35, 0.6, fw), rk = smoothstep(0.8, 0.815 + aw9, rn) * fi;   /* 바위 노두 = 숲 안 군데군데(3~5m 덩이) + 가파른 비탈 */
    diffuseColor.rgb *= 1.0 - 0.38 * smoothstep(0.735, 0.79, rn) * (1.0 - rk) * fi;   /* 바위 둘레 = 이끼 낀 그늘진 흙(바위가 땅에서 솟은 듯) */
    if (rk > 0.01) {
#ifndef LITE_A
      vec2 rc = q / 0.8 + (vec2(n1, texture2D(uNz_a, q / 4.3 + 0.13).r) - 0.5) * 2.2; rc.x += rc.y * 0.5; vec2 ri = floor(rc), rf = fract(rc), id = ri * 2.0 + step(rf.y, rf.x);
      float h9 = fract(sin(dot(id, vec2(27.17, 61.31))) * 43758.5), fe = 1.0 - smoothstep(0.0, 0.04 + fwidth(rf.x) * 1.5, min(min(rf.x, rf.y), abs(rf.x - rf.y))), tone = 0.66 + 0.5 * h9 - 0.3 * fe * (1.0 - smoothstep(0.1, 0.3, fwidth(rc.x)));   /* 비튼 기운 격자 삼각형마다 다른 밝기 = 꺾인 돌 면(바둑판처럼 안 보이게 잡음으로 비틂) · 면 경계 = 금 */
#else
      float tone = 0.85 + 0.2 * n2;
#endif
      vec3 rcol = mix(vec3(0.40, 0.39, 0.35), vec3(0.47, 0.45, 0.40), n1) * tone; rcol = mix(rcol, vec3(0.38, 0.42, 0.22), smoothstep(0.62, 0.7, n2) * 0.45 * (1.0 - wi));
      diffuseColor.rgb = mix(diffuseColor.rgb, rcol, rk * (1.0 - 0.6 * sn)); } } }
`;
const FORL = `
{ float fw = vFw_a.x;
  if (fw > 0.2) { vec2 q = vWP_a.xz; float k = smoothstep(0.2, 0.7, fw) * (1.0 - 0.55 * uSea_a.w);   /* 겨울 = 잎 진 숲이라 그늘 옅게 */
#ifndef LITE_A
    vec2 dr = vec2(uT_a * 0.07, uT_a * 0.045) * uWind_a; float c1 = texture2D(uNz_a, (q + dr) / 7.5).r * 0.65 + texture2D(uNz_a, (q - dr * 1.6) / 2.9 + 0.5).r * 0.35;
    float dk = smoothstep(0.3, 0.8, uSunC_a.g), sh = mix(0.68, mix(0.82, 1.1, dk), smoothstep(0.6, 0.68, c1));   /* 우듬지 그늘 + 잎 사이로 드는 햇빛 조각(바람 따라 천천히 · 밤·흐린 날엔 옅게) */
#else
    float sh = 0.8;
#endif
    outgoingLight *= mix(1.0, sh, k); } }
`;
const PAVEF = `
{ vec2 q = vWP_a.xz; float up = smoothstep(0.55, 0.75, vNy_a), sw = 1.0 - step(1.5, vPd_a.z), t = uT_a; vec3 toC = cameraPosition - vWP_a; float dist = length(toC); vec3 V = toC / dist;
  vec2 ax = vPd_a.xy / max(1e-4, length(vPd_a.xy)), lc = vec2(dot(q, ax), dot(q, vec2(-ax.y, ax.x))) / vec2(0.4, 0.2); lc.x += 0.5 * mod(floor(lc.y), 2.0);   /* 보도블록 40×20cm 엇갈려 쌓기(길 방향을 따라) */
  vec2 bi = floor(lc), bf = fract(lc), fw2 = fwidth(lc); float kf = up * sw * (1.0 - smoothstep(0.1, 0.32, max(fw2.x, fw2.y)));   /* 멀면(블록이 몇 픽셀 안 됨) 줄눈·얼룩이 사라짐 = 깜빡임 X */
  if (kf > 0.01) { vec2 e = min(bf, 1.0 - bf), jw = vec2(0.03, 0.06); float jt = max(1.0 - smoothstep(jw.x - fw2.x, jw.x + fw2.x, e.x), 1.0 - smoothstep(jw.y - fw2.y, jw.y + fw2.y, e.y)), h9 = fract(sin(dot(bi, vec2(12.9898, 78.233))) * 43758.5);
    outgoingLight *= mix(1.0, (0.93 + 0.12 * h9) * (1.0 - 0.3 * jt), kf); }
  if (uRain_a > 0.01 || uPud_a > 0.01) { float wt = uRain_a * up, n = texture2D(uNz_a, q / 9.0).r * 0.7 + texture2D(uNz_a, q / 2.6 + 0.37).r * 0.3, aw = fwidth(n), lp = uPud_a * (1.0 - uRain_a), th = 0.73 - 0.08 * uRain_a - 0.05 * lp, pd = smoothstep(th, th + 0.025 + aw, n) * max(wt, lp * up);   /* WATER-1 어제 비 = 웅덩이가 하루 더(비가 사흘 이어진 뒤 고인 물 · 둘레만 젖은 자국 · 바닥은 말라 있음) */
    outgoingLight *= 1.0 - lp * up * (0.16 * smoothstep(th - 0.07, th, n) + 0.22 * pd);   /* 웅덩이 바닥 = 젖어 짙게(비 그친 뒤엔 둘레 바닥이 말라 있어 하늘 비침만으론 안 보임) */   /* 빗물 웅덩이 = 잡음 꼭대기(조금 낮은 자리) · 비가 이어지면 조금 넓게 */
    outgoingLight *= 1.0 - wt * (0.16 + 0.1 * (1.0 - sw)); float F = 0.04 + 0.96 * p5_a(1.0 - clamp(V.y, 0.0, 1.0)); vec3 N = vec3(0.0, 1.0, 0.0);   /* 젖은 바닥(아스팔트가 더 짙게) */
#ifndef LITE_A
    if (pd > 0.01) { vec2 cq = q / 0.55, ci = floor(cq), jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6)), dv = fract(cq) - 0.3 - 0.4 * jr; float ph = fract(t * 0.8 + jr.x), d = length(dv) * 0.55, r = ph * 0.22;
      float rg = (1.0 - smoothstep(0.0, 0.012 + fwidth(d), abs(d - r))) * (1.0 - ph) * step(0.3, uRain_a) * (1.0 - smoothstep(10.0, 30.0, dist)); N = normalize(vec3(dv.x * rg * 0.6, 1.0, dv.y * rg * 0.6)); }   /* 빗방울 동그라미(웅덩이 안 · 0.55m 칸마다 하나 · 퍼지며 옅어짐 · 가까이만) */
#endif
    vec3 R = reflect(-V, N); R.y = abs(R.y); float sd = max(dot(R, uSunW_a), 0.0);
    outgoingLight = mix(outgoingLight, skyRef_a(R, sd), clamp(F * 0.25 * wt + pd * (F * 0.7 + 0.28), 0.0, 0.85)) + uSunC_a * p256_a(sd) * pd * 0.8; } }   /* 웅덩이 = 하늘 거울 + 좁은 해 빛 */
`;
// ───────── WATER-1(10-25 · 비·가뭄이 물에 보이게 · town_routine.js waterOf): 강·호수·농수로 물낯 높이 + 물빛 + 가뭄 자갈 띠 — 값 하나(uWlv_a)를 아침에 한 번 ─────────
//   꼭짓점 속성 lv_a = (높이 무게 0~1 · 물가 석축 선까지 m) — 하구(바다 쪽)는 무게가 줄어 바다 물낯과 이어짐 · 농수로는 0.3(수로 바닥·벽 높이 안)
//   높이: +1 = 0.14m 위(둔치 덮개 −0.70 · 디딤돌 위 −0.72보다 아래) · −1 = 0.24m 아래(석축 젖은 아랫단이 드러남 · 석축 밑 −1.4보다 위) — 땅·덮개와 같은 높이에 머물지 않음
//   사실(일반 상식): 비가 이어지면 흙이 쓸려 들어 물빛이 흐려지고, 가물면 물이 줄어 강가 자갈밭이 넓게 드러나요
const WLVU = '#ifndef WLVU_A\n#define WLVU_A\nuniform float uWlv_a;\nuniform float uPud_a;\n#endif\n';
export const WLV = { up: 0.14, down: 0.24 };
const WLVB = `
{ float lw = uWlv_a * vLv_a.x, dd = vLv_a.y;
  if (lw > 0.001) { float l9 = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.36, 0.24) * diffuse * (0.6 + 0.6 * l9), lw * 0.58); }   /* 비 뒤 = 흙탕(흙빛 · 밝기는 물빛을 따라감) */
  else if (lw < -0.001) { vec2 q = vWP_a.xz; float n = texture2D(uNz_a, q / 11.0 + 0.37).r, gw = -lw * 2.2 * (0.45 + 1.1 * n), gb = 1.0 - smoothstep(gw - 0.3, gw + 0.08, dd);   /* 가뭄 = 석축 앞 자갈 띠(폭 0~3m · 들쭉날쭉) */
    if (gb > 0.001) {
#ifndef LITE_A
      vec2 cq = q / 0.22, ci = floor(cq); vec2 jr = vec2(fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5), fract(sin(dot(ci, vec2(39.35, 11.13))) * 24634.6));
      float st = 1.0 - smoothstep(0.24, 0.4, length(fract(cq) - 0.3 - 0.4 * jr)), pk = 1.0 - smoothstep(0.25, 0.7, fwidth(cq.x)), peb = mix(0.5, mix(0.2, 0.55 + 0.45 * jr.x, st), pk);   /* 잔돌(22cm 칸 · 멀면 고르게) */
#else
      float peb = 0.5;
#endif
      float wl = 1.0 - smoothstep(0.0, 0.4, gw - dd);   /* 물에 닿는 가장자리 = 젖은 자갈(짙게) */
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.6, 0.55) * diffuse * (0.8 + 0.25 * n) * (0.78 + 0.4 * peb) * (1.0 - 0.3 * wl), gb); diffuseColor.a = mix(diffuseColor.a, 1.0, gb); } } }
`;
// 갈대 바람: 들판을 지나가는 바람 물결(세계 자리 기준 — 포기마다 같은 쪽으로) + 잔 떨림 · 높을수록 크게
const REEDV = `
vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
{ float hb = clamp(transformed.y / 1.9, 0.0, 1.0); hb *= hb; vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
  float wv = dot(ip, vec2(0.11, 0.06)) - uT_a * 1.5; float gust = 0.5 + 0.5 * sin(wv) * sin(wv * 0.37 + 1.3);
  float sw = (gust * 0.85 + 0.15 + sin(uT_a * 2.3 + ip.x * 0.9 + ip.y * 0.5 + transformed.y * 1.7) * 0.12) * hb * uWind_a;
  mvPosition.x += sw * 0.42; mvPosition.z += sw * 0.24; mvPosition.y -= sw * sw * 0.18; }
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;

export function createLook({ T3, map, lite, tideLvl, TEX, MATS, scene, game, phase, wx, inb, season, wet }) {
  const gameMin = () => (game && game() ? game().min : 600);
  const OFF = new Set(((typeof location !== 'undefined' && new URLSearchParams(location.search).get('artoff')) || '').split(','));   // 시험용: ?artoff=sky,gnd,fog,water,mud,reed,gust,paddy,field,river,saltpan,sand — 하나씩 빼고 GPU 몫 재기(ART-3 paddy·field·river·saltpan·sand·forest·pave = 끄면 예전 그대로)
  const LITE = !!lite, CA = new T3.Color(), CB = new T3.Color(), V3 = new T3.Vector3();
  const U = { uSkyH_a: { value: new T3.Color(0xd0e7f5) }, uSkyZ_a: { value: new T3.Color(0x5a9de0) }, uGlow_a: { value: new T3.Color(0x000000) }, uSunW_a: { value: new T3.Vector3(0.4, 0.7, 0.3).normalize() }, uSunC_a: { value: new T3.Color(0xffffff) },
    uT_a: { value: 0 }, uNz_a: { value: null }, uRefl_a: { value: 0.6 }, uFoam_a: { value: new T3.Color(0xffffff) }, uWetK_a: { value: 1 }, uWind_a: { value: 1 }, uDisc_a: { value: new T3.Color(0xffffff) }, uDiscK_a: { value: 1 }, uDiscW_a: { value: new T3.Vector3(0, 1, 0) }, uSea_a: { value: new T3.Vector4(0, 1, 0, 0) }, uRain_a: { value: 0 }, uWlv_a: { value: 0 }, uPud_a: { value: 0 } };   // ART-3 계절 무게 · 비(젖은 흙) · WATER-1 물 높이(−1 가뭄 ~ +1 비 뒤) · 어제 비 웅덩이
  // 잡음 한 장(128 · 이음매 없음 · 부드러운 값 잡음 4겹) — 갯골·물결 어긋냄·땅 얼룩이 같이 씀
  { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N), F = new Float32Array(N * N); let sd = 9127; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (const [P, A] of [[4, 1], [8, 0.5], [16, 0.25], [32, 0.12]]) { const L = new Float32Array(P * P); for (let i = 0; i < L.length; i++) L[i] = rnd(); const sm = t => t * t * (3 - 2 * t);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const fx = x / N * P, fy = y / N * P, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy), a = L[iy % P * P + ix % P], b = L[iy % P * P + (ix + 1) % P], c2 = L[(iy + 1) % P * P + ix % P], d = L[(iy + 1) % P * P + (ix + 1) % P];
        F[y * N + x] += A * (a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty); } }
    let lo = 1e9, hi = -1e9; for (const v of F) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let i = 0; i < N * N; i++) { const v = Math.round((F[i] - lo) / (hi - lo) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.NoColorSpace; TEX.push(t); U.uNz_a.value = t; }
  const defs = (sh, dep) => { const d = (LITE ? '#define LITE_A\n' : '') + (dep ? '#define DEP_A\n' : ''); sh.fragmentShader = d + sh.fragmentShader; };
  const vwp = (sh, extra) => { sh.vertexShader = 'varying vec3 vWP_a;\n' + (extra || '') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP_a = (modelMatrix * vec4(transformed, 1.0)).xyz;'); };
  const chain = (m, f, key) => { const pv = m.onBeforeCompile, k0 = m.customProgramCacheKey ? m.customProgramCacheKey() : ''; m.onBeforeCompile = sh => { if (pv) pv(sh); f(sh); }; m.customProgramCacheKey = () => k0 + ':' + key + (LITE ? 'L' : ''); m.needsUpdate = true; return m; };
  const waterPatch = dep => sh => { Object.assign(sh.uniforms, U);
    vwp(sh, dep ? 'attribute float dep_a;\nvarying float vDep_a;\n' : ''); if (dep) sh.vertexShader = sh.vertexShader.replace('vWP_a = (', 'vDep_a = dep_a; vWP_a = (');
    sh.fragmentShader = 'varying vec3 vWP_a;\nuniform float uRefl_a;\nuniform vec3 uFoam_a;\n' + (dep ? 'varying float vDep_a;\n' : '') + SKYF + sh.fragmentShader.replace('#include <envmap_fragment>', WATERF + '#include <envmap_fragment>'); defs(sh, dep); };
  // 땅 얼룩(들·숲·모래): 세계 자리 잡음 두 겹으로 풀빛을 노랑 ↔ 푸른 초록으로 조금씩(넓은 들판의 바둑판 같은 되풀이 무늬가 덜 보이게)
  function ground(m) { if (OFF.has('gnd') || LITE) return m; return chain(m, sh => { Object.assign(sh.uniforms, U); vwp(sh, '');
    sh.fragmentShader = 'varying vec3 vWP_a;\n' + SKYF + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ float g1 = texture2D(uNz_a, vWP_a.xz / 52.0).r;' + (LITE ? ' float gv = g1;' : ' float gv = g1 * 0.72 + texture2D(uNz_a, vWP_a.xz / 9.0 + 0.43).r * 0.28;') + ' diffuseColor.rgb *= mix(vec3(0.9, 0.95, 1.03), vec3(1.08, 1.04, 0.88), gv); }'); }, 'gnd2'); }
  // ART-3 땅 결 조각 잇기: vWP_a가 이미 있는 재질(땅 얼룩 뒤의 둔치)에도 겹쳐 선언하지 않게 · at = 넣을 자리(빛 계산 뒤 envmap · 바탕색 alphamap)
  const art3 = (key, ck, F, o) => m => { if (OFF.has(key)) return m; return chain(m, sh => { Object.assign(sh.uniforms, U);
    const hv = sh.vertexShader.includes('varying vec3 vWP_a;'), hf = sh.fragmentShader.includes('varying vec3 vWP_a;'), dv = 'varying vec2 vRUv_a;\n' + (o.ac ? 'varying float vAc_a;\n' : '') + (o.sd ? 'varying float vSd_a;\n' : '') + (o.sand ? 'varying float vSw_a;\nvarying float vSsd_a;\n' : '') + (o.fw ? 'varying vec2 vFw_a;\n' : '') + (o.pd ? 'varying vec3 vPd_a;\n' : '') + (o.fw || o.pd ? 'varying float vNy_a;\n' : '');
    sh.vertexShader = dv + (o.ac ? 'attribute float ac_a;\n' : '') + (o.sd ? 'attribute float sd_a;\n' : '') + (o.sand ? 'attribute float sw_a;\nattribute float ssd_a;\n' : '') + (o.fw ? 'attribute vec2 fw_a;\n' : '') + (o.pd ? 'attribute vec3 pd_a;\n' : '') + (hv ? '' : 'varying vec3 vWP_a;\n') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRUv_a = uv;' + (o.ac ? ' vAc_a = ac_a;' : '') + (o.sd ? ' vSd_a = sd_a;' : '') + (o.sand ? ' vSw_a = sw_a; vSsd_a = ssd_a;' : '') + (o.fw ? ' vFw_a = fw_a;' : '') + (o.pd ? ' vPd_a = pd_a;' : '') + (o.fw || o.pd ? ' vNy_a = normal.y;' : '') + (hv ? '' : ' vWP_a = (modelMatrix * vec4(transformed, 1.0)).xyz;'));
    const at = o.base ? '#include <alphamap_fragment>' : '#include <envmap_fragment>';
    if (o.pre) sh.fragmentShader = sh.fragmentShader.replace('#include <alphamap_fragment>', o.pre + '#include <alphamap_fragment>');   /* ART-3 c: 바탕색 조각(빛 계산 전)과 빛 조각(F)을 함께 */
    if (o.map) sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', o.map);
    sh.fragmentShader = dv + (hf ? '' : 'varying vec3 vWP_a;\n') + WLVU + 'uniform vec4 uSea_a;\nuniform float uRain_a;\nuniform float uWind_a;\nuniform vec3 uFoam_a;\nuniform float uRefl_a;\nuniform float uWetK_a;\n' + SKYF + sh.fragmentShader.replace(at, F + at); defs(sh, false); }, ck); };
  const forest = art3('forest', 'forest3', FORL, { fw: true, pre: FORB }), pave = art3('pave', 'pave3', PAVEF, { pd: true });   // ART-3 c: ?artoff=forest(숲 바닥·바위 노두·길섶 풀) · pave(보도블록 줄눈·빗물 웅덩이)
  const salt = art3('saltpan', 'salt3', SALTF, {}), sand = art3('sand', 'sand3', SANDF, { sand: true, map: SANDMAP }), paddy = art3('paddy', 'paddy3', PADDYF, { ac: true }), field = art3('field', 'field3', FARMF, { ac: true }), river = art3('river', 'river3', RIVF, {}), bank = art3('river', 'bank3', BANKF, { sd: true, base: true });   // ?artoff=paddy · field · river(강 물낯 + 둔치 같이)
  // WATER-1 물 높이 조각(?artoff=wlv면 예전 그대로) — 강(art3 강 조각 뒤에 겹침)·연못·농수로 재질
  function wlv(m) { if (OFF.has('wlv')) return m; return chain(m, sh => { Object.assign(sh.uniforms, U); const hv = sh.vertexShader.includes('varying vec3 vWP_a;'), hf = sh.fragmentShader.includes('varying vec3 vWP_a;');
    sh.vertexShader = 'attribute vec2 lv_a;\nvarying vec2 vLv_a;\n' + WLVU + (hv ? '' : 'varying vec3 vWP_a;\n') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLv_a = lv_a; transformed.y += lv_a.x * (uWlv_a > 0.0 ? uWlv_a * ' + WLV.up.toFixed(2) + ' : uWlv_a * ' + WLV.down.toFixed(2) + ');' + (hv ? '' : ' vWP_a = (modelMatrix * vec4(transformed, 1.0)).xyz;'));
    sh.fragmentShader = (LITE ? '#ifndef LITE_A\n#define LITE_A\n#endif\n' : '') + 'varying vec2 vLv_a;\n' + WLVU + (hf ? '' : 'varying vec3 vWP_a;\n') + SKYF + sh.fragmentShader.replace('#include <alphamap_fragment>', WLVB + '#include <alphamap_fragment>'); }, 'wlv1'); }
  function waterSet(lv, pud) { U.uWlv_a.value = Math.max(-1, Math.min(1, +lv || 0)); U.uPud_a.value = pud ? 1 : 0; }
  const SEAW = { spring: [1, 0, 0, 0], summer: [0, 1, 0, 0], autumn: [0, 0, 1, 0], winter: [0, 0, 0, 1] };
  // 바다 재질(물낯 · 깊이 속성 dep_a) — town.js의 MAT.sea(안개 압축 그대로)에 덧붙임
  function water(m) { SEA = m; if (OFF.has('water')) return m; return chain(m, waterPatch(true), 'water2'); }
  // 밀물 물낯(town_shore) = 같은 물 · 깊이 속성 없음(물가 줄 없음)
  function tide(sea, hazeOf) { const m = new T3.MeshLambertMaterial({ vertexColors: true, map: sea.map }); if (hazeOf) hazeOf(m, true); chain(m, waterPatch(false), 'tide2'); MATS.push(m); TIDE = m; return m; }
  let TIDE = null, MUDM = null, SEA = null;
  // 갯벌 재질: 땅 메시와 같은 정점(색·위치 공유 · 같은 평면 겹침 없음 — 그 칸 삼각형만 이 메시로) + 젖음 속성 wet_a
  function mudMat(hazeOf, map9) { if (MUDM) return MUDM; const m = new T3.MeshLambertMaterial({ vertexColors: true, map: map9 || null }); if (hazeOf) hazeOf(m, true);
    chain(m, sh => { Object.assign(sh.uniforms, U); vwp(sh, 'attribute float wet_a;\nvarying float vWet_a;\nvarying float vWt_a;\nvarying vec3 vMSky_a;\nvarying float vMF_a;\nvarying float vMSh_a;\n' + SKYF); sh.vertexShader = sh.vertexShader.replace('vWP_a = (', 'vWet_a = wet_a; vWt_a = smoothstep(0.08, 0.55, wet_a); vWP_a = (').replace('#include <project_vertex>', '#include <project_vertex>\n { vec3 V = normalize(cameraPosition - vWP_a), R = vec3(-V.x, V.y, -V.z); float sd = max(dot(R, uSunW_a), 0.0), s8 = sd * sd; s8 *= s8; s8 *= s8; vMF_a = 0.04 + 0.96 * p5_a(1.0 - clamp(V.y, 0.0, 1.0)); vMSky_a = skyRef_a(R, sd); vMSh_a = s8 * sd; }');
      sh.fragmentShader = 'varying vec3 vWP_a;\nvarying float vWet_a;\nvarying float vWt_a;\nvarying vec3 vMSky_a;\nvarying float vMF_a;\nvarying float vMSh_a;\nuniform float uWetK_a;\n' + SKYF + sh.fragmentShader.replace('#include <map_fragment>', MUDMAP).replace('#include <envmap_fragment>', MUDF + '#include <envmap_fragment>'); defs(sh, false); }, 'mud2');
    MATS.push(m); MUDM = m; return m; }
  function mud(g, group) { const me = new T3.Mesh(g, mudMat()); me.matrixAutoUpdate = false; me.userData.fx = 1; group.add(me); return me; }

  // ───────── 갈대(인스턴스 한 벌 · 그리기 1번) ─────────
  let REED = null, REEDG = null, REEDC = null, REEDM = null;
  function reedGeo() { const P = [], Cc = [], N = [], R = (() => { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const put = (p, n, c) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); Cc.push(c[0], c[1], c[2]); };
    const blade = (a, r, h, w, lean, tip, base) => { const cx = Math.cos(a) * r, cz = Math.sin(a) * r, ox = Math.cos(a) * lean, oz = Math.sin(a) * lean, px = -Math.sin(a) * w, pz = Math.cos(a) * w, n = [Math.cos(a) * 0.4, 0.5, Math.sin(a) * 0.4];
      const m0 = [cx + ox * 0.35, h * 0.55, cz + oz * 0.35], top = [cx + ox, h, cz + oz], mid = base.map((v, i) => v + (tip[i] - v) * 0.55);
      put([cx - px, 0, cz - pz], n, base); put([cx + px, 0, cz + pz], n, base); put([m0[0] + px * 0.6, m0[1], m0[2] + pz * 0.6], n, mid);
      put([cx - px, 0, cz - pz], n, base); put([m0[0] + px * 0.6, m0[1], m0[2] + pz * 0.6], n, mid); put([m0[0] - px * 0.6, m0[1], m0[2] - pz * 0.6], n, mid);
      put([m0[0] - px * 0.6, m0[1], m0[2] - pz * 0.6], n, mid); put([m0[0] + px * 0.6, m0[1], m0[2] + pz * 0.6], n, mid); put(top, n, tip); };
    const plume = (a, r, h, col) => { const cx = Math.cos(a) * r * 1.4, cz = Math.sin(a) * r * 1.4, y0 = h, y1 = h + 0.42, y2 = h + 0.2, n = [0, 0.3, 1];
      for (const [ux, uz] of [[1, 0], [0, 1]]) { const w = 0.07; put([cx, y0, cz], n, col); put([cx + ux * w, y2, cz + uz * w], n, col); put([cx, y1, cz], n, col); put([cx, y0, cz], n, col); put([cx, y1, cz], n, col); put([cx - ux * w, y2, cz - uz * w], n, col); }
      const st = [0.42, 0.4, 0.3]; put([cx - 0.012, h - 0.5, cz], n, st); put([cx + 0.012, h - 0.5, cz], n, st); put([cx, y0, cz], n, st); };
    const nb = LITE ? 6 : 9; for (let i = 0; i < nb; i++) { const a = i / nb * 6.2832 + R() * 0.5, h = 1.15 + R() * 0.7; blade(a, 0.05 + R() * 0.12, h, 0.028, 0.18 + R() * 0.25, [1, 1, 1], [0.55, 0.55, 0.55]); }
    for (let i = 0; i < 3; i++) plume(i * 2.1 + R(), 0.08, 1.55 + R() * 0.3, [1, 1, 1]);
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); const col = new T3.Float32BufferAttribute(Cc, 3); g.setAttribute('color', col);
    g.userData.gray = Float32Array.from(Cc); g.userData.plume = P.length / 3 - 3 * 15; return g; }
  // 계절 색: 잎(여름 초록 → 가을 황금 → 겨울 볏짚) · 이삭(어린 자줏빛 → 은빛 담황)
  const SEAC = { spring: [0x8fb35f, 0xb3a49a], summer: [0x7fa653, 0xbba59a], autumn: [0xc4a065, 0xe8dcc2], winter: [0xc6b597, 0xddd3c1], now: [0x7fa653, 0xbba59a] };
  function reedColor(sz) { if (!REEDG) return; const g = REEDG, src = g.userData.gray, A = g.attributes.color.array, [lc, pc] = SEAC[sz] || SEAC.summer, n = A.length / 3, p0 = g.userData.plume; CA.setHex(lc); CB.setHex(pc);
    for (let i = 0; i < n; i++) { const c = i >= p0 && (i - p0) % 15 < 12 ? CB : CA, v = src[i * 3]; A[i * 3] = c.r * v; A[i * 3 + 1] = c.g * v; A[i * 3 + 2] = c.b * v; } g.attributes.color.needsUpdate = true; REEDC = sz; }
  function reeds(list, group) { if (REED) { REED.parent && REED.parent.remove(REED); REED.dispose(); REED = null; } if (!list.length || OFF.has('reed')) return null;
    if (!REEDG) REEDG = reedGeo();
    if (!REEDM) { REEDM = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }); REEDM.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.vertexShader = 'uniform float uT_a;\nuniform float uWind_a;\n' + sh.vertexShader.replace('#include <project_vertex>', REEDV); }; REEDM.customProgramCacheKey = () => 'reed2'; MATS.push(REEDM); } const mat = REEDM;
    const n = Math.min(list.length, LITE ? 320 : 1300); if (list.length > n) list = list.slice().sort((a, b) => (b[5] || 0) - (a[5] || 0)).slice(0, n);   /* 넘치면 무리 한가운데(잡음 높은 곳)부터 — 고르게 솎으면 듬성듬성 한 포기씩이 됨 */
    const m = new T3.InstancedMesh(REEDG, mat, n), M4 = new T3.Matrix4(), Q = new T3.Quaternion(), S = new T3.Vector3(), Y = new T3.Vector3(0, 1, 0);
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let i = 0; i < n; i++) { const [x, y, z, s, r] = list[i]; Q.setFromAxisAngle(Y, r); S.set(s, s * (0.85 + (i % 5) * 0.06), s); V3.set(x, y - 0.05, z); M4.compose(V3, Q, S); m.setMatrixAt(i, M4); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.matrixAutoUpdate = false; m.castShadow = m.receiveShadow = false; m.userData.fx = 1; m.userData.box = [x0, z0, x1, z1]; group.add(m); REED = m; reedColor(season ? season() : 'summer'); return m; }

  // ───────── 하늘(학교 하늘 돔 대신 · 마을에 있는 동안만) ─────────
  let SKY = null, OLD = null, CLD = null, HEMI = null, SUN = null;
  function findSky() { const sc = scene(); if (!sc) return; for (const o of sc.children) { if (!OLD && o.isMesh && o.renderOrder === -1 && o.geometry && o.geometry.type === 'SphereGeometry' && o.material && o.material.vertexColors && o.material.depthWrite === false) OLD = o; if (!HEMI && o.isHemisphereLight) HEMI = o; if (!SUN && o.isDirectionalLight) SUN = o;
      if (!CLD && o.isMesh && o.material && o.material.vertexColors && o !== OLD && o.geometry) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; if (bb && bb.min.y > 40 && bb.max.x - bb.min.x > 150 && bb.max.y < 200) CLD = o; } } }
  function skyOn() { if (SKY || OFF.has('sky')) return; findSky(); const g = new T3.SphereGeometry(280, 48, 24), mat = new T3.ShaderMaterial({ uniforms: U, side: T3.BackSide, depthWrite: false, fog: false, toneMapped: false,
      vertexShader: SKYF + 'varying vec3 vD_a;\nvarying vec3 vC_a;\nvoid main() { vD_a = position; vC_a = ' + (LITE ? 'skyCol_a' : 'skyFog_a') + '(normalize(position)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: SKYF + 'uniform vec3 uDisc_a; uniform float uDiscK_a; uniform vec3 uDiscW_a;\nvarying vec3 vD_a;\nvarying vec3 vC_a;\nvoid main() { vec3 d = normalize(vD_a); vec3 c = vC_a; float s = dot(d, uDiscW_a);' + (LITE ? '' : ' float s0 = max(dot(d, uSunW_a), 0.0), s8 = s0 * s0; s8 *= s8; s8 *= s8; float s32 = s8 * s8; s32 *= s32; c += uGlow_a * s32 * s8 * 0.35; float sh = max(s, 0.0); sh *= sh; sh *= sh; sh *= sh; sh *= sh; sh *= sh; sh *= sh; sh *= sh; c += uGlow_a * sh * 0.5 * uDiscK_a;') + '\n c = mix(c, uDisc_a, smoothstep(0.99955, 0.99975, s) * uDiscK_a * smoothstep(-0.01, 0.01, d.y)); gl_FragColor = vec4(c, 1.0);\n #include <colorspace_fragment>\n}' });
    SKY = new T3.Mesh(g, mat); SKY.frustumCulled = false; SKY.renderOrder = -1; SKY.matrixAutoUpdate = true; SKY.userData.fx = 1; map.add(SKY); if (OLD) OLD.visible = false; MATS.push(mat); }
  function skyOff() { if (OLD) OLD.visible = true; if (SKY) { map.remove(SKY); SKY.geometry.dispose(); SKY = null; } }

  // ───────── 하루 빛 이어 바꾸기(0.5초마다 · 시간대가 바뀐 그 자리에서도 바로) ─────────
  let lastM = -1, lastW = '', lastP = '', lastI = false, PH = 'day', acc = 0;
  const mixHex = (a, b, t, out) => { CA.setHex(a); CB.setHex(b); return out.copy(CA).lerp(CB, t); };
  function sample(m) { let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].m <= m) i++; const A = KEYS[i], B = KEYS[i + 1], t0 = (m - A.m) / Math.max(1, B.m - A.m), t = t0 * t0 * (3 - 2 * t0); return [A, B, t]; }
  function apply(force) { const sc = scene(); if (!sc) return; const m = gameMin ? gameMin() : 600, w = wx ? wx() : 'clear', ph = phase ? phase() : 'day';
    const inside = !!(inb && inb()); if (!force && Math.abs(m - lastM) < 0.5 && w === lastW && ph === lastP && inside === lastI) return; lastM = m; lastW = w; lastP = ph; lastI = inside; PH = ph;
    { const S9 = game && game(); if (S9 && tideLvl) { const L = tideLvl(S9.day, S9.min); U.uWetK_a.value = 0.72 + 0.28 * Math.min(1, L / 0.35); } } if (!HEMI || !SUN) findSky();
    const [A, B, t] = sample(m), o = OVC[w], ok = o ? o.k : 0;
    mixHex(A.H, B.H, t, U.uSkyH_a.value); mixHex(A.Z, B.Z, t, U.uSkyZ_a.value); mixHex(A.G, B.G, t, U.uGlow_a.value); mixHex(A.D, B.D, t, U.uDisc_a.value);
    if (o) { const lum = U.uSkyH_a.value.r * 0.3 + U.uSkyH_a.value.g * 0.6 + U.uSkyH_a.value.b * 0.1, dim = Math.min(1, lum * 1.6 + 0.08); U.uSkyH_a.value.lerp(CA.setHex(o.H).multiplyScalar(dim), ok); U.uSkyZ_a.value.lerp(CA.setHex(o.Z).multiplyScalar(dim), ok); U.uGlow_a.value.multiplyScalar(1 - ok); }
    U.uDiscK_a.value = (A.dk + (B.dk - A.dk) * t) * (1 - ok);
    // 원반 = 빛 방향의 방위 · 높이는 표(해 뜰 녘·질 녘에 낮게) — 빛 그늘 방향은 시간대 해 자리 그대로
    if (SUN) { V3.copy(SUN.position).normalize(); const azL = Math.atan2(V3.z, V3.x) * 57.3, elL = Math.asin(Math.max(-1, Math.min(1, V3.y))), ea = A.el == null ? elL * 57.3 : A.el, eb = B.el == null ? elL * 57.3 : B.el, el = (ea + (eb - ea) * t) / 57.3, aa = A.az == null ? azL : A.az, ab = B.az == null ? azL : B.az, az = (aa + (ab - aa) * t) / 57.3;
      U.uDiscW_a.value.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)); U.uSunW_a.value.copy(U.uDiscW_a.value); if (U.uSunW_a.value.y < 0.02) { U.uSunW_a.value.y = 0.02; U.uSunW_a.value.normalize(); } }
    const si = (A.si + (B.si - A.si) * t) * (o ? 1 - ok + ok * o.si : 1), hi = (A.hi + (B.hi - A.hi) * t) * (o ? 1 - ok + ok * o.hi : 1);
    mixHex(A.sc, B.sc, t, U.uSunC_a.value); U.uSunC_a.value.multiplyScalar(si * 0.32 * (1 - ok * 0.9));
    U.uRefl_a.value = A.sh + (B.sh - A.sh) * t;
    if (SEA) { const dn = Math.max(0, Math.min(1, ((A.si + (B.si - A.si) * t) - 0.9) / 1.4)); SEA.color.setHex(0x7484a4).lerp(CA.setHex(0xffffff), dn); if (TIDE) TIDE.color.copy(SEA.color); }   /* 물 바탕 = 밤엔 어둡게 · 노을빛은 해 색이 이미 칠하므로 덧칠 X(갈색으로 탁해지던 것) */ U.uFoam_a.value.setScalar((A.fo + (B.fo - A.fo) * t) * (o ? 0.8 : 1)); if (U.uFoam_a.value.r < 0.5) U.uFoam_a.value.multiply(CA.setHex(0xa8bcda));
    if (!inside) {
      if (HEMI) { mixHex(A.hs, B.hs, t, HEMI.color); mixHex(A.hg, B.hg, t, HEMI.groundColor); HEMI.intensity = hi; if (o) HEMI.color.lerp(CA.setHex(0xd4d8dc), ok * 0.7); }
      if (SUN) { mixHex(A.sc, B.sc, t, SUN.color); SUN.intensity = si; if (o) SUN.color.lerp(CA.setHex(0xe8ecf0), ok); }
      if (sc.fog) { sc.fog.color.copy(U.uSkyH_a.value); } if (sc.background && sc.background.isColor) sc.background.copy(U.uSkyH_a.value);
      const R9 = window.SD2 && SD2.renderer; if (R9) R9.toneMappingExposure = A.ex + (B.ex - A.ex) * t;
      if (CLD && CLD.visible) { mixHex(A.cl, B.cl, t, CLD.material.color); if (o) CLD.material.color.lerp(CA.setHex(0xc8ced6), ok); } }
  }
  function tick(dt) { U.uT_a.value += dt; if (U.uT_a.value > 3600) U.uT_a.value -= 3600; if (SKY) { const cp = map.camera.position; SKY.position.copy(cp); }
    if (REED) { const b = REED.userData.box, cp = map.camera.position, dx = Math.max(b[0] - cp.x, 0, cp.x - b[2]), dz = Math.max(b[1] - cp.z, 0, cp.z - b[3]); REED.visible = dx * dx + dz * dz < (LITE ? 150 : 230) ** 2; }
    if ((acc += dt) > 0.5) { acc = 0; apply(false); if (season && REEDG && season() !== REEDC) reedColor(season());
      { const w4 = SEAW[season ? season() : 'summer'] || SEAW.summer; U.uSea_a.value.set(w4[0], w4[1], w4[2], w4[3]); const rt = wet ? Math.min(1, wet()) : wx && wx() === 'rain' ? 1 : 0; U.uRain_a.value += (rt - U.uRain_a.value) * (rt > U.uRain_a.value ? 0.12 : 0.03); } } }   /* ART-3 계절 무게 · 비 오면 몇 초에 걸쳐 젖고 그치면 1분쯤에 걸쳐 마름 */
  function setPhase() { apply(true); }
  function dispose() { skyOff(); if (REED) { REED.parent && REED.parent.remove(REED); REED.dispose(); REED = null; } if (REEDG) { REEDG.dispose(); REEDG = null; } }
  return { U, off: k => OFF.has(k), fogFn: () => (OFF.has('fog') ? 'uSkyH_a' : LITE ? 'skyFogL_a(fd9)' : 'skyFog_a(normalize(fd9))'), ground, water, tide, mudMat, mud, reeds, wlv, waterSet, water9: () => ({ lv: U.uWlv_a.value, pud: U.uPud_a.value, up: WLV.up, down: WLV.down, off: OFF.has('wlv') }), paddy, field, river, bank, salt, sand, forest, pave, skyOn, skyOff, tick, phase: setPhase, apply, dispose, get lite() { return LITE; }, get tideMat() { return TIDE; },
    reedAt: i => { if (!REED || i >= REED.count) return null; const M4 = new T3.Matrix4(); REED.getMatrixAt(i, M4); return [+M4.elements[12].toFixed(1), +M4.elements[14].toFixed(1)]; },
    info: () => ({ sky: !!SKY, old: !!OLD, reeds: REED ? REED.count : 0, reedVis: REED ? REED.visible : false, mud: !!MUDM, ph: PH, m: lastM, sunW: U.uSunW_a.value.toArray().map(v => +v.toFixed(2)), exp: window.SD2 && +SD2.renderer.toneMappingExposure.toFixed(2) }) };
}
