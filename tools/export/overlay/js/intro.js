// 처음 영상(인트로 · 예고편) — 마을이 다 지어지고 첫 화면이 뜨기 직전에 한 번
//   이 마을에서 무엇을 할 수 있는지 크게 보여 주고 기대하게 함(야경 · 지하철 포함)
//   장면 여덟(장면마다 큰 글 한 줄 = 할 수 있는 일): 자전거 → 지하철 → 양 몰기 → 소방차 → 해수욕장 → 배추밭 → 밤 마을 → 야시장 → 끝 장(우리 마을 · 무엇을 할까요? · 시작하기)
//   언제든 건너뛰기(Space·Enter·Esc·클릭·터치) · 처음 한 번 보면 다음부터는 짧게(끝 장만 · 저절로 닫힘) · ?intro=0 = 안 봄 · ?intro=1 = 처음부터 다시
//   새 3D 물체·빛을 만들지 않음 — 이미 지은 마을 위에서 카메라 자리(SD2.camOvr)와 게임 시각만 바꿈(낮 10시 · 밤 8시 반 = 원래 밤 조명·야시장 그대로)
//   시각은 영상 동안만: 저장(GAME.flush)은 늘 원래 시각으로 쓰고, 끝나거나 건너뛰면 원래 시각·시간대·카메라로 되돌림 · 날씨는 바꾸지 않음(그날 날씨 기록에 남아서)
const NAME = '@APP@';
const KEY = 'uri.intro.v2';
const Q = new URLSearchParams(location.search);
const FORCE = Q.get('intro') === '1', OFF = Q.get('intro') === '0';
const store = { get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* 막힌 저장소 */ } } };
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const FONT = 'system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';

const CSS = `
body.iv-on > *:not(#scene):not(#iv){visibility:hidden!important}
#iv{position:fixed;inset:0;z-index:9500;cursor:pointer;-webkit-user-select:none;user-select:none;color:#2b2420;font-family:${FONT},SMEmoji;word-break:keep-all;overflow-wrap:anywhere}
#iv .pap{position:absolute;inset:0;background:#f6efe2;opacity:1;transition:opacity .7s ease;display:flex;align-items:center;justify-content:center;pointer-events:none}
#iv .pap.clear{opacity:0}
#iv .ttl{text-align:center;transition:opacity .5s ease}
#iv .ttl b{display:block;font-size:clamp(44px,10vw,92px);font-weight:900;letter-spacing:.02em;line-height:1.1}
#iv .ttl i{display:block;width:min(240px,48vw);height:6px;margin:18px auto 0;background:#3f8f4e;border-radius:3px}
#iv .cap{position:absolute;left:max(16px,3vw,env(safe-area-inset-left));bottom:max(20px,5vh,env(safe-area-inset-bottom));max-width:calc(100vw - 32px);box-sizing:border-box;
  background:#f6efe2;border-left:10px solid #3f8f4e;padding:10px 20px 12px 16px;font-size:clamp(26px,5.2vw,50px);font-weight:900;line-height:1.22;
  opacity:0;transform:translateY(10px);transition:opacity .35s ease,transform .35s ease;pointer-events:none}
#iv .cap.in{opacity:1;transform:none}
#iv .end{position:absolute;left:50%;top:50%;width:min(520px,calc(100vw - 32px));box-sizing:border-box;transform:translate(-50%,-50%);text-align:center;
  background:#f6efe2;border:3px solid #2b2420;border-radius:14px;box-shadow:0 5px 0 #2b2420;padding:28px 22px 24px;opacity:0;transition:opacity .5s ease;pointer-events:none}
#iv .end.in{opacity:1;pointer-events:auto}
#iv .end b{display:block;font-size:clamp(46px,11vw,88px);font-weight:900;line-height:1.05;letter-spacing:.02em}
#iv .end i{display:block;width:min(200px,44vw);height:6px;margin:14px auto 0;background:#3f8f4e;border-radius:3px}
#iv .end span{display:block;margin-top:18px;font-size:clamp(20px,4.8vw,27px);font-weight:800;color:#3d342d}
#iv .end button{display:inline-flex;align-items:center;gap:8px;margin-top:22px;min-height:54px;padding:12px 30px;cursor:pointer;
  font:900 clamp(19px,4.6vw,23px)/1 ${FONT};color:#fff;background:#3f8f4e;border:3px solid #2b2420;border-radius:12px;box-shadow:0 4px 0 #2b2420}
#iv .end button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}
#iv .skip{position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));font:800 15px/1 ${FONT};
  color:#2b2420;background:#fff8ea;border:3px solid #2b2420;border-radius:11px;box-shadow:0 3px 0 #2b2420;padding:9px 13px;min-height:44px;cursor:pointer;display:flex;align-items:center;gap:8px}
#iv .skip:active{transform:translateY(2px);box-shadow:0 1px 0 #2b2420}
#iv .skip kbd{font:800 12px/1 system-ui,sans-serif;background:#2b2420;color:#fff8ea;border-radius:6px;padding:4px 6px}
#iv.fin .skip{display:none}
body.touch #iv .skip kbd{display:none}
.twn-ld .bx button.iv-again{display:block!important;width:auto!important;min-height:0!important;margin:8px 2px 0!important;padding:4px 0!important;background:none!important;border:0!important;box-shadow:none!important;color:#5b4d42!important;font:700 13px/1.2 system-ui,sans-serif!important;text-decoration:underline;cursor:pointer;transform:none!important}
@media (prefers-reduced-motion:reduce){#iv .pap,#iv .cap,#iv .end{transition:none}#iv .cap{transform:none}}
`;

// 게임 시각(분): 낮 장면 = 10시(가게·일꾼이 일하는 때) · 밤 장면 = 20시 반(가로등·창 불빛·야시장·별) · null = 원래 시각
const DAY = 600, NIGHT = 1230;
const phaseOf = m => (m < 360 || m >= 1140) ? 'night' : m >= 1020 ? 'sunset' : 'day';   /* town_game.js phaseOf와 같은 셈 */

// 장면: 글(t) · 띠 색(c = 지도 색: 자전거길·지하철 노선·풀밭·소방·바다·밭흙·밤·초롱) · 시각(tm) · 카메라(자리 p · 보는 곳 l — 앞 0 → 끝 1) — 기준 자리가 없으면 그 장면은 빠짐
const SCENES = [
  { id: 'bike', dur: 5.4, tm: DAY, t: '자전거로 큰길을 달려요', c: '#2f8f6a',
    cam: A => A.road && { lin: 1, minH: 1.2, p0: A.lane(-77, A.road.lo, 1.6), l0: A.lane(-47, A.road.lo - 1.2, 1.2), p1: A.lane(-35, A.road.lo, 1.6), l1: A.lane(-5, A.road.lo - 1.2, 1.2) } },
  { id: 'metro', dur: 5, tm: DAY, t: '지하철을 타고 멀리 가요', c: '#2f6fd0',
    cam: A => A.st && { minH: 1.5, p0: A.stn(17, 5.7, 3.2), l0: A.stn(1, 0, 0.6), p1: A.stn(8.5, 2, 2.5), l1: A.stn(0.3, 0, 0.2) } },
  { id: 'sheep', dur: 5, tm: DAY, t: '목장에서 양을 몰아요', c: '#3f8f4e',
    cam: A => A.past && { p0: A.off(A.past, 20, 9, 8), l0: A.off(A.past, -3, 0, -6), p1: A.off(A.past, 7, 6.5, 19), l1: A.off(A.past, -5, 0, -3) } },
  { id: 'fire', dur: 5, tm: DAY, t: '불이 나면 소방차로 출동해요', c: '#d32f2a',
    cam: A => A.fire && { minH: 1.5, p0: A.door(A.fire, 28, 8, 9), l0: A.door(A.fire, 3, 3, 1.5), p1: A.door(A.fire, 14, 1, 3.2), l1: A.door(A.fire, 3, 3, 1.6) } },
  { id: 'beach', dur: 5.4, tm: DAY, t: '해수욕장에서 헤엄쳐요', c: '#2a8fb8',
    cam: A => A.beach && { minH: 4, p0: A.sea(-50, 55, 17), l0: A.sea(70, -15, 0), p1: A.sea(-28, 20, 10), l1: A.sea(72, -42, 0) } },
  { id: 'farm', dur: 5, tm: DAY, t: '밭에서 배추를 거둬요', c: '#9a6b3a',
    cam: A => A.farm && { p0: A.off(A.farm, 26, 13, 18), l0: A.off(A.farm, -8, 0, -2), p1: A.off(A.farm, 12, 10, 30), l1: A.off(A.farm, -6, 0, -4) } },
  { id: 'night', dur: 5.4, tm: NIGHT, t: '밤이 되면 마을에 불이 켜져요', c: '#2b3a5c',
    cam: A => A.mkt && { p0: A.off(A.mkt, -275, 46, -180), l0: A.off(A.mkt, -175, 0, -100), p1: A.off(A.mkt, -238, 36, -150), l1: A.off(A.mkt, -150, 0, -82) } },
  { id: 'nmkt', dur: 5.6, tm: NIGHT, t: '밤에는 야시장이 열려요', c: '#e0a91c',
    cam: A => A.mkt && !A.wet && { p0: A.off(A.mkt, 9, 9, 27), l0: A.off(A.mkt, -4, 1.5, -2), p1: A.off(A.mkt, -5, 7, 23), l1: A.off(A.mkt, -8, 1.5, -1) } },
  { id: 'end', end: 1, tm: null, cam: A => A.orbit },
];
const SHORT = [{ id: 'end', end: 1, auto: 1, dur: 4.6, tm: null, cam: A => A.orbit }];

let css = null;
const addCss = () => { if (css) return; css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css); };
const el = (tag, cls, html, p) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; if (p) p.appendChild(d); return d; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ease = x => x * x * (3 - 2 * x);
const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };

// 기준 자리: 학교 앞 역 · 그 역 곁 큰길(자전거길) · 목장 · 소방서 문 · 해수욕장 → 바다 쪽 · 배추밭 · 야시장 · 끝 장(학교 둘레를 높이서 천천히 돎)
function anchors() {
  const T = window.SM_TOWN, gnd = (x, z) => { try { const y = T.ground(x, z); return Number.isFinite(y) ? y : 0; } catch (e) { return 0; } };
  const pt = (x, z, h) => [x, gnd(x, z) + h, z];
  const P = safe(() => T.places(), []), find = (re, kind) => P.find(q => re.test(q.name || '') && (!kind || q.kind === kind)) || null;
  const gate = [15.4, 50], dG = q => Math.hypot(q.x - gate[0], q.z - gate[1]);
  const A = { pt, gnd, wet: /rain|snow/.test(safe(() => T.wx().WX9, '')) };
  A.off = (q, dx, h, dz) => pt(q.x + dx, q.z + dz, h);
  // 지하철: 학교에서 가장 가까운 역 · 열린 쪽(o) = 나오는 자리 쪽
  const subs = safe(() => T.subway(), []) || [];
  const st = subs.length ? subs.reduce((a, b) => (dG(b) < dG(a) ? b : a)) : null;
  if (st) { let ox = st.ex - st.x, oz = st.ez - st.z; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol; A.st = st; A.so = [ox, oz]; }
  // 큰길: 역에서 가장 가까운 큰길 토막 · 역 쪽 자전거길(차로 끝 + 0.5m) · 달리는 쪽 = 오른쪽 통행(역 쪽이 오른편)
  if (st) {
    let best = null, bd = 60;
    for (const s of safe(() => T.rsegs(), [])) {
      if (!s.big) continue; const vx = s.b[0] - s.a[0], vz = s.b[1] - s.a[1], L = Math.hypot(vx, vz); if (L < 120) continue;
      const tt = Math.max(0, Math.min(L, ((st.x - s.a[0]) * vx + (st.z - s.a[1]) * vz) / L)), px = s.a[0] + vx / L * tt, pz = s.a[1] + vz / L * tt, d = Math.hypot(st.x - px, st.z - pz);
      if (d < bd) { bd = d; best = { s, L, t0: tt, tx: vx / L, tz: vz / L }; }
    }
    if (best) { const { s, tx, tz } = best, nx = -tz, nz = tx, ax = s.a[0] + tx * best.t0, az = s.a[1] + tz * best.t0, sg = ((st.x - ax) * nx + (st.z - az) * nz) >= 0 ? 1 : -1;
      A.road = { ...best, nx, nz, sg, lo: (Number.isFinite(s.cw) ? s.cw : s.hw - 2.2) + 0.5 };
      A.lane = (k, off, h) => { const R = A.road, t = Math.max(6, Math.min(R.L - 6, R.t0 + R.sg * k)); return pt(R.s.a[0] + R.tx * t + R.nx * R.sg * off, R.s.a[1] + R.tz * t + R.nz * R.sg * off, h); };
      if (best.L < 140 || best.t0 + best.sg * -77 < 6 || best.t0 + best.sg * -77 > best.L - 6) A.road = null; }
  }
  if (A.st) { const [ox, oz] = A.so, R = A.road, rx = R ? -R.sg * R.nx : -oz, rz = R ? -R.sg * R.nz : ox;   /* 길 쪽(카메라가 자전거길에서 다가감) */
    A.stn = (f, side, h) => pt(A.st.x + ox * f + rx * side, A.st.z + oz * f + rz * side, h); }
  A.past = find(/^목장$/) || find(/목장/);
  // 소방서: 문 앞 방향(f) · 옆(r)
  const fs = P.find(q => q.kind === 'fire' && Array.isArray(q.door));
  if (fs) { let fx = fs.door[0] - fs.x, fz = fs.door[1] - fs.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl; A.fire = fs;
    A.door = (q, f, r, h) => { const x = q.door[0] + fx * f - fz * r, z = q.door[1] + fz * f + fx * r; return [x, gnd(q.door[0], q.door[1]) + h, z]; }; }
  // 해수욕장: 바다 쪽(sd) · 바닷가를 따라(side)
  const bc = find(/해수욕장/), sea = P.find(q => q.kind === 'sea');
  if (bc && sea) { let sx = sea.x - bc.x, sz = sea.z - bc.z; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl; A.beach = bc;
    A.sea = (f, side, h) => pt(bc.x + sx * f - sz * side, bc.z + sz * f + sx * side, h); }
  A.farm = find(/배추밭/);
  { const m = safe(() => T.night().info().site.mkt, null); if (Array.isArray(m)) A.mkt = { x: m[0], z: m[1] }; }
  // 끝 장: 학교·우리 동네를 높이서(지름 약 256m 둘레를 천천히)
  { const cx = gate[0] - 35, cz = gate[1] + 40; A.orbit = { orbit: 1, cx, cz, cy: gnd(cx, cz), r: 128, h: 55, a0: Math.atan2(80, 100), w: 0.022 }; }
  return A;
}

// 시각 바꾸기(영상 동안만): 저장은 늘 원래 값으로 · 끝나면 원래 시각·시간대로
//   시각이 바뀌며 게임이 함께 적는 칸: S.min(시계) · S.home.dk(그날 해 질 녘 알림을 했나 — 밤으로 바꾸면 적혀서 첫날 저녁 알림이 빠짐)
const ENV = { on: false };
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const keep = () => { const S = ENV.G.S, H = S.home; return { min: S.min, dk: own(H, 'dk'), dkv: H ? H.dk : undefined }; };
const put = v => { const S = ENV.G.S, H = S.home; S.min = v.min; if (H && typeof H === 'object') { if (v.dk) H.dk = v.dkv; else delete H.dk; } };
function envBegin() {
  if (ENV.on) return; let G = null; try { G = window.SM_TOWN.game(); } catch (e) { G = null; }
  const M = window.SD2 && SD2.map; if (!G || !G.S || !Number.isFinite(G.S.min) || !M || typeof M.time !== 'function' || typeof G.flush !== 'function') return;
  ENV.G = G; ENV.v0 = keep(); ENV.min0 = G.S.min; ENV.ph0 = M.time(); ENV.f0 = G.flush; ENV.own = own(G, 'flush');
  G.flush = function (force) { const now = keep(); put(ENV.v0); try { return ENV.f0.call(G, force); } finally { put(now); } };   /* 영상 동안 저장(2초 · 창 숨김·닫기 · 학급 저장소)도 원래 값 */
  ENV.on = true;
}
function envTime(min) {
  if (!ENV.on) return; const G = ENV.G, M = SD2.map, m = min == null ? ENV.min0 : min, ph = min == null ? ENV.ph0 : phaseOf(min);
  if (G.S.min === m && M.time() === ph) return;
  G.S.min = m;   /* 시각 먼저 → 시간대를 바꿔도 게임이 시계를 그 때의 첫 시각으로 옮기지 않음(syncPhase) */
  try { if (M.time() !== ph) M.time(ph); else window.SM_TOWN.heal.lightNow(); } catch (e) { /* */ }
  try { const N = window.SM_TOWN.night(); if (N && N.dbg && N.dbg.sec) N.dbg.sec(); } catch (e) { /* */ }   /* 야시장·별·늦게 여는 곳을 그 프레임에(1초 칸을 기다리지 않음) */
}
function envEnd() { if (!ENV.on) return; try { envTime(null); put(ENV.v0); } finally { const G = ENV.G; if (ENV.own) G.flush = ENV.f0; else delete G.flush; ENV.on = false; ENV.G = null; } }

let RUN = null, swallowUp = null;
// 키는 엔진·마을보다 먼저 받음(이 모듈이 먼저 읽힘) — 영상 동안 게임 키 X · 건너뛴 키의 keyup도 삼킴(뒤에 뜬 첫 화면 단추가 눌리지 않게)
addEventListener('keydown', e => {
  if (!RUN) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.repeat) return;
  if (/^(Space|Enter|NumpadEnter|Escape)$/.test(e.code)) { swallowUp = e.code; finish(RUN.end ? 'end' : 'skip'); }
}, true);
addEventListener('keyup', e => {
  if (RUN || (swallowUp && e.code === swallowUp)) { e.preventDefault(); e.stopImmediatePropagation(); if (!RUN) swallowUp = null; }
}, true);

function play(list, why) {
  if (RUN || !window.SD2 || !SD2.camOvr || !SD2.camera || !window.SM_TOWN) return false;
  const A = anchors(), shots = [];
  for (const s of list) { const c = safe(() => s.cam(A), null); if (c) shots.push({ ...s, cm: c }); }
  if (!shots.length || !shots[shots.length - 1].end) return false;
  addCss();
  const C = SD2.camera, root = el('div', null, null, document.body); root.id = 'iv';
  const pap = el('div', 'pap', '<div class="ttl"><b>' + esc(NAME) + '</b><i></i></div>', root);
  const cap = el('div', 'cap', null, root);
  const end = el('div', 'end', '<b>' + esc(NAME) + '</b><i></i><span>' + esc(NAME) + '에서 무엇을 할까요?</span>', root);
  const auto = !!shots[shots.length - 1].auto;
  if (!auto) { const go = el('button', null, '▶ 시작하기', end); go.type = 'button'; go.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); finish('end'); }); }
  const skip = el('button', 'skip', '건너뛰기 ▶▶ <kbd>Space</kbd>', root); skip.type = 'button';
  const lead = shots.length > 1 ? 1.8 : 1.0;
  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { /* */ }
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { /* */ }
  document.body.classList.add('iv-on');
  envBegin();
  RUN = { root, pap, cap, endEl: end, why, i: -1, capI: -1, capO: -1, done: false, end: false, T0: performance.now(), lead, shots, endAt: 0 };
  const P = [0, 0, 0], L = [0, 0, 0];
  const lerp3 = (o, a, b, t) => { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; };
  const enter = (R, i, now) => {
    const s = shots[i]; if (R.i >= 0) dip(); R.i = i;
    envTime(s.tm);
    if (s.end) { R.end = true; R.endAt = now; R.root.classList.add('fin'); cap.classList.remove('in'); setTimeout(() => { if (RUN === R) end.classList.add('in'); }, Math.max(0, (R.lead - now) * 1000) + 250); return; }
    cap.textContent = s.t; cap.style.borderLeftColor = s.c; cap.classList.remove('in');
  };
  SD2.camOvr(() => {
    const R = RUN; if (!R || R.done) return;
    try {
      const now = (performance.now() - R.T0) / 1000;
      if (now > R.lead - 0.7 && R.i <= 0 && !R.pap.classList.contains('clear')) R.pap.classList.add('clear');
      let t = Math.max(0, now - R.lead), i = 0; while (i < shots.length - 1 && t >= shots[i].dur) { t -= shots[i].dur; i++; }
      const s = shots[i];
      if (i !== R.i) enter(R, i, now);
      if (s.auto && t >= s.dur) { finish('end'); return; }
      if (!s.end) {
        if (R.capI !== i && t >= 0.3 && now >= R.lead) { R.capI = i; cap.classList.add('in'); }
        if (R.capO !== i && t >= s.dur - 0.45) { R.capO = i; cap.classList.remove('in'); }
      }
      if (s.cm.orbit) { const o = s.cm, a = o.a0 + (REDUCE ? 0 : t * o.w); P[0] = o.cx + Math.sin(a) * o.r; P[1] = o.cy + o.h; P[2] = o.cz + Math.cos(a) * o.r; L[0] = o.cx; L[1] = o.cy; L[2] = o.cz; }
      else { const u = REDUCE ? 1 : Math.min(1, t / s.dur), e = s.cm.lin ? u : ease(u); lerp3(P, s.cm.p0, s.cm.p1, e); lerp3(L, s.cm.l0, s.cm.l1, e);
        let g = -1e9; try { g = window.SM_TOWN.ground(P[0], P[2]) + (s.cm.minH ?? 3); } catch (e2) { g = -1e9; } if (P[1] < g) P[1] = g; }   /* 땅 밑으로 X(매 프레임 새 객체 X) */
      C.position.set(P[0], P[1], P[2]); C.lookAt(L[0], L[1], L[2]);
    } catch (err) { console.error('[인트로]', err); finish('err'); }
  });
  root.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); finish(RUN && RUN.end ? 'end' : 'skip'); });
  return true;
}
// 장면 사이: 종이색으로 잠깐(카메라가 휙 바뀌는 것 · 시간대가 바뀌는 프레임을 가림)
function dip() { const R = RUN; if (!R) return; const p = R.pap; p.querySelector('.ttl').style.opacity = '0'; p.style.transition = 'none'; p.classList.remove('clear'); void p.offsetWidth; p.style.transition = 'opacity .45s ease'; requestAnimationFrame(() => p.classList.add('clear')); }

function finish(k) {
  const R = RUN; if (!R || R.done) return; R.done = true;
  store.set('1');
  R.pap.querySelector('.ttl').style.opacity = '0'; R.pap.style.transition = 'opacity .35s ease'; R.pap.classList.remove('clear'); R.cap.classList.remove('in'); R.endEl.classList.remove('in');
  setTimeout(() => {
    try { envEnd(); } catch (e) { console.error('[인트로] 시각 되돌리기', e); }   /* 종이가 덮은 동안 원래 시각·시간대로 */
    try { SD2.camOvr(null); } catch (e) { /* */ }
    document.body.classList.remove('iv-on');
    R.pap.style.transition = 'opacity .5s ease'; requestAnimationFrame(() => R.pap.classList.add('clear'));
    setTimeout(() => { R.root.remove(); if (RUN === R) RUN = null; again(); }, 520);
  }, 360);
  window.SM_INTRO = { done: k, at: Date.now() };
}

// 첫 화면에 '처음 영상 다시 보기' 한 줄
function again() {
  const T = window.SM_TOWN; if (!T || !T.title || !T.title()) return;
  const bx = document.querySelector('.twn-ld.ttl9 .bx'); if (!bx || bx.querySelector('.iv-again')) return;
  const b = el('button', 'iv-again', '▶ 처음 영상 다시 보기', bx); b.type = 'button';
  b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); play(SCENES, 'again'); });
}

// 마을이 다 지어지고 첫 화면이 뜨면 시작
(function wait() {
  if (OFF) return;
  if (window.SM_NORENDER && !FORCE) return;
  const seen = store.get() === '1', list = FORCE || !seen ? SCENES : SHORT, t0 = performance.now();
  let gone = 0;
  const tick = () => {
    const T = window.SM_TOWN;
    if (T && T.title) {
      if (T.title()) {
        // 우리 집은 다 지은 뒤 몇 프레임 지나 정해짐 — 집 자리가 잡힐 때까지(4초까지) 기다림
        let hm = null; try { const H = T.home(); hm = H && Array.isArray(H.e) ? H.e : null; } catch (e) { hm = null; }
        if (!hm && (tick.w = (tick.w || 0) + 1) < 16) { setTimeout(tick, 250); return; }
        if (!play(list, FORCE ? 'force' : seen ? 'short' : 'first')) setTimeout(tick, 300); return; }
      if (++gone > 12) return;   // 첫 화면 없이 바로 시작하는 판(칸을 골라 다시 지음 등) = 영상 X
    }
    if (performance.now() - t0 < 300000) setTimeout(tick, 250);
  };
  tick();
})();

window.SM_INTRO_API = { play: () => play(SCENES, 'api'), playShort: () => play(SHORT, 'api'), stop: () => finish('stop'), get on() { return !!RUN; },
  get scene() { return RUN && RUN.i >= 0 ? RUN.shots[RUN.i].id : null; }, get plan() { return RUN ? { lead: RUN.lead, shots: RUN.shots.map(s => ({ id: s.id, dur: s.dur || 0, t: s.t || '', end: !!s.end })) } : null; },
  env: () => ({ on: ENV.on, min0: ENV.on ? ENV.min0 : null, ph0: ENV.on ? ENV.ph0 : null }), scenes: SCENES.map(s => ({ id: s.id, dur: s.dur || 0, t: s.t || '' })) };
