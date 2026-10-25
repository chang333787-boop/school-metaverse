// 👆 손맛(FEEL-1 · 사용자 10-19 '수면제 게임 · 도파민이 안 나와' · 코덱스 표 '첫 30분 핵심 동작 다섯에 소리·작은 연출')
//   처음 30분에 자주 하는데 하고 나서 달라지는 것이 잘 안 보이고 안 들리던 동작 다섯(그 밖은 이미 손맛이 있음 — 줍기 = 손에 든 모습 + 음계 · 대화 = 재잘 소리 · 일꾼 거들기 = 판 소리 + 가방):
//     step  📜 이야기 단계 넘어감(도착·맞힘·쓰기 끝) = 옛 'ding' 그대로 + 할 일 줄이 한 번 밝아짐(새 할 일로 바뀐 것이 보이게)
//     stamp 🛂 여권 도장 = 낮은 '쿵' + 빨간 도장이 꾹 찍혔다 사라짐(장소 이름) — 예전엔 알림 글만
//     money 💰 돈 받기 = 동전 '짤랑'(같은 순간 다른 소리 — 팔기 ding·단계 ding — 가 나면 그 소리만) + 지갑 줄 숫자가 올라감(얼마에서 얼마로)
//     plant 🌱 텃밭 심기 = 흙 '톡톡' + 흙 부스러기 몇 개 — 예전엔 거의 안 들리는 tick
//     water 💧 텃밭 손 물 주기(E) = 물 '똑' + 물방울 몇 개 — 예전엔 없는 소리 이름('pop')이라 조용했음
//     best  🏅 일 놀이 새 내 최고(LADDER-2 · town_lad.js) = 오르는 세 음(작게) + 그 줄이 한 번 밝아지고 살짝 커졌다 제자리(0.7초)
//   규칙(town_lessons E '소리는 배경' · G 'AI 슬롭 X'): 소리 0.2초 안팎 · 작게 · 낮게 · 빨리 되풀이하면 작아지다 건너뜀(1.2초 안 · 다섯 번째부터 X) · 설정 '소리 끄기'면 아예 안 부름
//     연출 = 그 자리 0.3~0.9초 · DOM은 transform·opacity만(Web Animations) · 3D는 작은 상자 열 개 한 메시(살아 있을 때만 보임 · 그리기 +1) · 새 Light X · 매 프레임 new X(살아 있는 조각이 없으면 바로 돌아감)
//   map.sfx·map.tone을 감싸서 셈(시험 town_feel.cjs) — 'pop'은 학교 효과음 표에 없어 조용하던 것(틀린 답·물 주기) → 여기서 작고 낮은 소리로 채움
// 👆 FEEL-2(사용자 10-24 '모든 동작 반응 넓히기'): 마을 E 182곳을 눌러 보니 15곳은 아무 반응이 없고 76곳은 창·글만 바뀌고 조용했음(town_feel.cjs 9.)
//   E를 누른 뒤(map 'interact' 알림) 그 동작이 스스로 소리를 냈으면 아무것도 안 함 · 0.09초 안에 소리가 없으면 결과에 맞춰 작은 소리 하나만 채움:
//     open 창·놀이·탈것이 새로 열림 = 종이 '사락'(낮은 두 음 올라감) · note 알림 글만 = '통'(낮게 한 번 · 아직 안 되는 일 · 이미 한 일) · tap 아무것도 안 바뀜 = '톡' + 그 E 자리에 흙먼지 몇 알(눌린 것이 보이게)
//     몸 동작(앉기·마시기 같은 보이는 행동)이 시작됐으면 그 동작이 반응이라 채우지 않음 · door 🚪 들어가기 = 문 '딸깍'(town.js goIn이 부름 — 덮개가 1초라 처음 0.1초가 조용했음)
//   셈 = 소리 부름 수 · 알림(map.hud.toast·banner) 수 · 창 열림 · 몸 동작을 매 프레임 숫자로만 적어 둠(매 프레임 DOM·new X) · 소리 끄기·움직임 줄이기·되풀이 작아짐(gate)은 위와 같음
const CSS = '.twn-feel-hi{position:fixed;z-index:46;pointer-events:none;border:3px solid #f2c230;border-radius:12px;background:rgba(255,236,150,.42);opacity:0}'
  + '.twn-feel-st{position:fixed;left:50%;top:27%;z-index:48;pointer-events:none;margin-left:-62px;width:124px;height:124px;box-sizing:border-box;border:5px solid #c8443a;border-radius:50%;color:#c8443a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font:900 15px/1.2 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:rgba(255,248,234,.9);opacity:0}'
  + '.twn-feel-st b{font-size:30px;line-height:1.1}.twn-feel-st span{max-width:104px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  + '.twn-feel-wl{position:fixed;left:50%;top:calc(44% + 50px);z-index:47;pointer-events:none;transform:translateX(-50%);padding:4px 14px;border:2px solid #2b2420;border-radius:10px;background:#fff8ea;box-shadow:0 3px 0 #2b2420;color:#2b2420;font:900 18px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;white-space:nowrap;opacity:0}';
const KINDS = ['step', 'stamp', 'money', 'plant', 'water', 'open', 'note', 'tap', 'door', 'best'];
const GAP = 1200, VOLS = [1, 0.6, 0.4, 0.3];   /* 1.2초 안에 또 = 작게(0.6 · 0.4 · 0.3) · 다섯 번째부터 건너뜀 */
const PN = 10;   /* 흙·물 조각 수(한 메시) */

export function createFeel(A) {
  const { map, T3 } = A, now = () => performance.now();
  // ── 소리 길 감싸기(셈 · 남의 소리 때) ──
  const sfx0 = map.sfx, tone0 = map.tone, SND = { sfx: 0, tone: 0, own: 0, pop: 0, muted: 0 }; let other = -1e9, own = false;
  map.sfx = k => { SND.sfx++; if (!own) other = now(); if (k === 'pop') { SND.pop++; map.tone(330, 0, 0.07, 'sine', 0.06, 230); map.tone(220, 0.05, 0.09, 'sine', 0.05, 170); return; } if (sfx0) sfx0(k); };   /* 'pop' = 학교 표에 없음 → 낮고 둥근 '뽁'(벌 느낌 X) */
  map.tone = (...a) => { SND.tone++; if (!own) other = now(); if (tone0) tone0(...a); };
  const hud = map.hud || null, toast0 = hud && hud.toast, ban0 = hud && hud.banner; let NT = 0;   /* FEEL-2 알림 수(글이 바뀌었나) */
  if (toast0) hud.toast = (...a) => { NT++; return toast0(...a); }; if (ban0) hud.banner = (...a) => { NT++; return ban0(...a); };
  const G = {}; for (const k of KINDS) G[k] = { t: -1e9, n: 0, play: 0, quiet: 0, skip: 0, vol: 0, fx: 0 };
  function gate(k) { const g = G[k], t = now(); g.n = t - g.t < GAP ? g.n + 1 : 0; g.t = t; if (g.n >= VOLS.length) { g.skip++; g.vol = 0; return 0; } const v = VOLS[g.n]; if (v < 1) g.quiet++; g.play++; g.vol = v; return v; }
  function play(list, v, k) { if (k !== 'money') other = now(); if (A.mute && A.mute()) { SND.muted++; return; } own = true; SND.own++; try { for (const a of list) { const q = a.slice(); q[4] *= v; if (k9(q)) map.tone(...q); } } finally { own = false; } }
  const k9 = q => q[4] > 0.004;
  const SOUND = {
    step: [[988, 0, 0.16, 'sine', 0.2], [1319, 0.1, 0.32, 'sine', 0.18]],   /* 옛 map.sfx('ding')과 같은 두 음 — 크기만 되풀이에 따라 */
    stamp: [[150, 0, 0.13, 'sine', 0.2, 70], [620, 0, 0.035, 'square', 0.018]],   /* 쿵(낮게 떨어짐) + 종이에 닿는 작은 딱 */
    money: [[1976, 0, 0.06, 'sine', 0.06], [2637, 0.05, 0.12, 'sine', 0.05]],   /* 짤랑(높지만 아주 작게 · 짧게) */
    plant: [[196, 0, 0.08, 'triangle', 0.08, 150], [262, 0.08, 0.08, 'triangle', 0.06, 200]],   /* 톡톡(흙 두드림) */
    water: [[880, 0, 0.07, 'sine', 0.05, 560], [1175, 0.08, 0.09, 'sine', 0.04, 700]],   /* 똑 똑(물방울) */
    best: [[784, 0, 0.1, 'triangle', 0.08], [988, 0.09, 0.1, 'triangle', 0.08], [1319, 0.18, 0.22, 'sine', 0.09]],   /* 솔·시·미(오르는 세 음 · 팡파르보다 작게) */
    open: [[392, 0, 0.05, 'triangle', 0.04, 470], [587, 0.04, 0.07, 'sine', 0.03]],   /* 사락(창 펼침 · 낮게 올라감 · 아주 작게) */
    note: [[440, 0, 0.07, 'sine', 0.04, 392]],   /* 통(알림 글 하나 · 한 음 · 살짝 내려감) */
    tap: [[247, 0, 0.05, 'triangle', 0.06, 196]],   /* 톡(눌렀어요 · 발소리보다 둔하고 짧게) */
    door: [[196, 0, 0.05, 'triangle', 0.07, 150], [294, 0.06, 0.05, 'triangle', 0.045, 247]],   /* 딸깍(나무 문 손잡이) */
  };
  // ── DOM(한 번 만들어 돌려 씀) ──
  let css = null, HI = null, ST = null, WL = null, wlTm = 0, alive = true;
  function ui() { if (css) return; css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
    HI = document.createElement('div'); HI.className = 'twn-feel-hi ttl-keep'; ST = document.createElement('div'); ST.className = 'twn-feel-st ttl-keep'; WL = document.createElement('div'); WL.className = 'twn-feel-wl ttl-keep';
    document.body.append(HI, ST, WL); }
  const ani = (el, kf, ms) => { if (!el.animate) { el.style.opacity = '0'; return null; } if (A.calm && A.calm()) kf = kf.map(f => { const g = { ...f }; delete g.transform; return g; });   /* 설정 '움직임 줄이기' = 옅어졌다 사라지기만 */ for (const a of el.getAnimations ? el.getAnimations() : []) a.cancel(); return el.animate(kf, { duration: ms, easing: 'ease-out', fill: 'forwards' }); };
  // 📜 단계: 할 일 줄 자리를 덮고 한 번 밝아짐(글이 새 할 일로 바뀌는 때에 맞춰 0.12초 뒤)
  function step() { const v = gate('step'); if (v) play(SOUND.step, v, 'step'); ui(); setTimeout(() => { if (!alive) return; const el = A.taskEl && A.taskEl(); if (!el || el.style.display === 'none') return; const r = el.getBoundingClientRect(); if (r.width < 4) return;
    HI.style.left = (r.left - 3) + 'px'; HI.style.top = (r.top - 3) + 'px'; HI.style.width = (r.width + 6) + 'px'; HI.style.height = (r.height + 6) + 'px'; G.step.fx++;
    ani(HI, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], 750); }, 120); }
  // 🛂 도장: 조금 크게 떠 있다가 제자리로 꾹(넘침 X) → 잠깐 → 옅어짐
  function stamp(name) { const v = gate('stamp'); if (v) play(SOUND.stamp, v, 'stamp'); ui(); ST.innerHTML = '<b>🛂</b><span></span>'; ST.lastChild.textContent = String(name || ''); G.stamp.fx++;
    ani(ST, [{ opacity: 0, transform: 'scale(1.3) rotate(-8deg)' }, { opacity: 0.95, transform: 'scale(1) rotate(-8deg)', offset: 0.14 }, { opacity: 0.95, transform: 'scale(1) rotate(-8deg)', offset: 0.7 }, { opacity: 0, transform: 'scale(1) rotate(-8deg)' }], 900); }
  // 💰 돈: 같은 순간에 다른 소리(팔기 ding·할 일 끝 ding)가 나면 그 소리만 · 지갑 줄 = 예전 → 지금(0.5초에 걸쳐 올라감)
  function money(n) { if (!(n > 0)) return; const t0 = now(); setTimeout(() => { if (!alive) return; if (other >= t0 - 30) { G.money.skip++; return; } const v = gate('money'); if (v) play(SOUND.money, v, 'money'); }, 0);
    if (!A.total || !A.won) return; ui(); const to = A.total(), from = Math.max(0, to - n); let i = 0; clearInterval(wlTm); WL.textContent = '💰 ' + A.won(from); G.money.fx++;
    wlTm = setInterval(() => { i++; const k = Math.min(1, i / 12); WL.textContent = '💰 ' + A.won(Math.round((from + (to - from) * k) / 10) * 10); if (k >= 1) { clearInterval(wlTm); wlTm = 0; WL.textContent = '💰 ' + A.won(to); } }, 40);
    ani(WL, [{ opacity: 0, transform: 'translate(-50%,6px)' }, { opacity: 1, transform: 'translate(-50%,0)', offset: 0.12 }, { opacity: 1, transform: 'translate(-50%,0)', offset: 0.78 }, { opacity: 0, transform: 'translate(-50%,0)' }], 1500); }
  // 🌱💧 텃밭: 작은 상자 열 개(흙 = 갈색 · 물 = 하늘색) — 위로 튀었다 떨어지며 작아짐(0.6초)
  const PX = new Float32Array(PN * 3), PV = new Float32Array(PN * 3), PL = new Float32Array(PN); let PM = null, pAlive = 0;
  const _m = new T3.Matrix4(), _p = new T3.Vector3(), _q = new T3.Quaternion(), _s = new T3.Vector3(), _c = new T3.Color();
  function puffMesh() { if (PM) return PM; const g = new T3.BoxGeometry(1, 1, 1), m = new T3.MeshLambertMaterial({ color: 0xffffff }); PM = new T3.InstancedMesh(g, m, PN); PM.count = 0; PM.visible = false; PM.frustumCulled = false; PM.userData.fx = 1; PM.setColorAt(0, _c.setHex(0xffffff)); map.add(PM); return PM; }
  function puff(x, y, z, col, up) { const M = puffMesh(); for (let i = 0; i < PN; i++) { const a = i / PN * 6.2832 + Math.random() * 0.5, s = 0.5 + Math.random() * 0.7; PX[i * 3] = x + Math.cos(a) * 0.12; PX[i * 3 + 1] = y + 0.04; PX[i * 3 + 2] = z + Math.sin(a) * 0.12; PV[i * 3] = Math.cos(a) * s; PV[i * 3 + 1] = up * (0.7 + Math.random() * 0.6); PV[i * 3 + 2] = Math.sin(a) * s; PL[i] = 0.45 + Math.random() * 0.2; M.setColorAt(i, _c.setHex(col[i % col.length])); }
    pAlive = PN; M.count = PN; M.visible = true; M.instanceColor.needsUpdate = true; draw(0); }
  function draw(dt) { const M = PM; let n = 0; for (let i = 0; i < PN; i++) { if (PL[i] <= 0) continue; PL[i] -= dt; if (PL[i] <= 0) { pAlive--; continue; } const j = i * 3; PV[j + 1] -= 6 * dt; PX[j] += PV[j] * dt; PX[j + 1] += PV[j + 1] * dt; PX[j + 2] += PV[j + 2] * dt;
      const s = 0.07 * Math.min(1, PL[i] / 0.3); M.setMatrixAt(i, _m.compose(_p.set(PX[j], PX[j + 1], PX[j + 2]), _q, _s.set(s, s, s))); n++; } for (let i = 0; i < PN; i++) if (PL[i] <= 0) M.setMatrixAt(i, _m.makeScale(0, 0, 0));
    M.instanceMatrix.needsUpdate = true; if (!n) { M.visible = false; pAlive = 0; } }
  // 🏅 새 내 최고: 끝 창의 기록 줄(el)을 덮고 한 번 밝아짐 + 그 줄이 살짝 커졌다 제자리(넘침 X)
  function best(el) { const v = gate('best'); if (v) play(SOUND.best, v, 'best'); if (!el || !el.getBoundingClientRect) return; ui(); setTimeout(() => { if (!alive || !el.isConnected) return; const r = el.getBoundingClientRect(); if (r.width < 4) return;
    HI.style.left = (r.left - 4) + 'px'; HI.style.top = (r.top - 4) + 'px'; HI.style.width = (r.width + 8) + 'px'; HI.style.height = (r.height + 8) + 'px'; G.best.fx++;
    ani(HI, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], 800); ani(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.3 }, { transform: 'scale(1)' }], 700); }, 60); }
  // 👆 FEEL-2 E 손맛 채우기: PRE = 지난 프레임 끝 숫자(소리·알림·창·몸 동작) → E 알림 때 견줌
  const PRE = { s: 0, t: 0, p: 0, a: '' }, EN = { lk: '', n: 0, open: 0, note: 0, tap: 0, door: 0, own: 0, act: 0 }, sndN = () => SND.sfx + SND.tone + SND.muted, pan = () => (A.panel ? A.panel() | 0 : 0), acting = () => (map.player && map.player.acting) || '';
  function pre() { PRE.s = sndN(); PRE.t = NT; PRE.p = pan(); PRE.a = acting(); }
  function cue(k, x, y, z) { const v = gate(k); if (v) play(SOUND[k], v, k); EN[k]++; EN.n++; EN.lk = k; if (k === 'tap' && x != null && !(A.calm && A.calm())) { G.tap.fx++; puff(x, y, z, [0xc9b48a, 0xb39a70, 0xe0d2b0], 0.5); } }
  function onE(h) { if (!alive || !h || h.kind !== 'game' || typeof h.use !== 'function') return; if (sndN() > PRE.s) { EN.own++; return; } const s0 = PRE.s, t0 = PRE.t, p0 = PRE.p, a0 = PRE.a, hx = h.x, hy = h.y, hz = h.z;
    setTimeout(() => { if (!alive || sndN() > s0) { EN.own++; return; } const a9 = acting(); if (a9 && a9 !== a0) { EN.act++; return; } if (pan() & ~p0) cue('open');   /* 새로 켜진 칸이 있음(이미 켜져 있던 것은 X) */ else if (NT > t0) cue('note'); else cue('tap', hx, hy, hz); }, 90); }
  const offE = map.on ? map.on('interact', onE) : null;
  function farm(k, x, y, z) { const v = gate(k); if (v) play(SOUND[k], v, k); if (x == null) return; G[k].fx++; puff(x, y, z, k === 'water' ? [0x8fd8ff, 0xcfeeff, 0x6cc0f0] : [0x6b4a2e, 0x8a6440, 0x5a3c24], k === 'water' ? 0.8 : 1); }
  return {
    step, stamp, money, farm, puff, best, cue, sfx: k => map.sfx(k), toast: (t, s) => map.hud.toast(t, s),   /* cue('door') = 🚪 들어가기(town.js goIn) */   /* puff = SURP-1 놀람(게 웅덩이 물·소금꽃)이 같은 알갱이를 다시 씀 */   /* sfx·toast = 시험이 마을 소리·알림 길(감싼 것)을 부를 때 */
    tick(dt) { pre(); if (!pAlive || !PM) return; draw(Math.min(dt, 0.1)); },   /* pre = 숫자 넷만 적음 */
    info: () => ({ e: { ...EN, pre: PRE.p }, snd: { ...SND }, g: JSON.parse(JSON.stringify(G)), puff: { alive: pAlive, vis: !!(PM && PM.visible) }, dom: { hi: HI ? +getComputedStyle(HI).opacity : -1, st: ST ? +getComputedStyle(ST).opacity : -1, wl: WL ? +getComputedStyle(WL).opacity : -1, wlT: WL ? WL.textContent : '' } }),
    dispose() { alive = false; clearInterval(wlTm); map.sfx = sfx0; map.tone = tone0; if (toast0) hud.toast = toast0; if (ban0) hud.banner = ban0; if (typeof offE === 'function') offE(); for (const e of [css, HI, ST, WL]) if (e) e.remove(); if (PM) { map.remove(PM); PM.geometry.dispose(); PM.material.dispose(); PM.dispose(); PM = null; } },
  };
}
