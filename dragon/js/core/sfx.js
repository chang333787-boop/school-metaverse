// 소리(design §15·§8) — WebAudio로 직접 합성(내려받은 소리 X · 원작 소리·멜로디 X) · 기본은 꺼짐(교실) · 모든 소리에 보이는 짝 신호가 따로 있음
// 울음·폭발은 음량 상한 + 서서히 커짐(깜짝 X) · 켜고 끄기 = 구석 단추(키 X) · 설정은 이 기기에 기억
// 꺼져 있으면 AudioContext도 안 만듦(봇·시험 결과 그대로) · 놀이 난수(G.rng)는 쓰지 않음(소리가 판을 바꾸지 않게)
//
// ── 쓰는 법 ──────────────────────────────────────────────────────────────────────────────────
//   G.sfx.play(name)              한 번(원인이 화면 밖·나 자신일 때)
//   G.sfx.play(name, at, vol)     원인 자리 {x, y, z}에서 — 왼쪽·오른쪽 = 카메라 기준 좌우 · 멀면 작게
//   G.sfx.near(loop, x, y, z, k)  이어지는 소리(불 탁탁) — 부를 때만 울리고 0.45초 안 부르면 저절로 줄어듦 · 여러 번 부르면 큰 것
//   G.sfx.level(loop, k, pan)     이어지는 소리(비행 바람) — 자리 없이 세기만
//   G.music.set(mood)             곡 고정(이 차례 동안만 · 차례가 바뀌면 다시 장소대로) · null = 장소대로
//   getSfx()                      G가 없는 엔진(비행·원소)이 씀 — 소리를 안 만든 장면이면 null
// 이름: flap whoosh splash roar growl purr fire boom bang clang thud pluck pop ok wind whistle inhale
//       cry_gronckle cry_nadder cry_nightmare cry_zippleback cry_terror · 이어지는 소리: wind crackle
// ───────────────────────────────────────────────────────────────────────────────────────────────
import { loadSet, saveSet } from './gfx.js?v=18';
import { createMusic } from './music.js?v=18';

let CUR = null;
export const getSfx = () => CUR;

export function createSfx(G = null) {
  let ac = null, master = null, noiseBuf = null, music = null, timer = 0, offT = 0;
  const S = { on: !!loadSet().sound, G };
  CUR = S;
  const btn = document.createElement('button');
  btn.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:25;font:600 15px "Noto Sans KR",sans-serif;padding:6px 12px;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:12px 16px 10px 18px;cursor:pointer';
  const label = () => { btn.textContent = S.on ? '소리 끄기' : '소리 켜기'; };
  label(); document.body.appendChild(btn);
  btn.onclick = () => { S.on = !S.on; saveSet({ sound: S.on }); label(); apply(); btn.blur(); };

  function init() {
    if (ac) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = S.on ? 0.8 : 0;
    const lim = ac.createDynamicsCompressor(); lim.threshold.value = -14; lim.ratio.value = 8; master.connect(lim); lim.connect(ac.destination);   // 음량 상한
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; }
    music = createMusic(ac, master, noiseBuf); S.musicCore = music;
  }
  /* 켬·끔 — 끄면 곡을 비우고 잠깐 뒤 오디오를 재움(크롬북 CPU) · 켜면 깨우고 박자 짜기 시작 */
  function apply() {
    if (S.on) {
      init(); if (!ac) return;
      clearTimeout(offT); wake();
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0.8, ac.currentTime, 0.05);
      if (!timer) timer = setInterval(tick, 100);
    } else if (ac) {
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0, ac.currentTime, 0.05);
      music.stop(ac.currentTime); for (const k in LOOPS) LOOPS[k].want = 0;
      clearInterval(timer); timer = 0;
      clearTimeout(offT); offT = setTimeout(() => { if (!S.on && ac.state === 'running') ac.suspend().catch(() => {}); }, 600);
    }
  }
  const wake = () => { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); };
  /* 저장된 '켜짐'으로 열면 첫 손짓에 깨움(브라우저는 손짓 전 소리를 막음) */
  const unlock = () => { if (S.on) { if (!ac) apply(); else wake(); } };
  addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
  if (S.on) apply();

  /* 합성 조각 — 소리가 끝나면 노드가 스스로 끊김(쌓이지 않음) */
  const env = (g, t, a, peak, rel) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel); };
  function noise(t, dur, f0, f1, q, peak, a = 0.01, to = master, type = 'bandpass') {
    const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + a + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur); n.connect(f); f.connect(g); g.connect(to); n.start(t, rnd() * 0.5); n.stop(t + dur + a + 0.05);
    n.onended = () => { n.disconnect(); f.disconnect(); g.disconnect(); };
  }
  function tone(t, type, f0, f1, dur, peak, a = 0.01, to = master) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + a + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur); o.connect(g); g.connect(to); o.start(t); o.stop(t + dur + a + 0.05);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  /* 울림(떨리는 소리) — 낮은 사인을 빠른 사인으로 크기 흔듦(가르랑 · 그롱클 꾸르릉) */
  function rumble(t, f, rate, dur, peak, a, to) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), out = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.94, t + dur); lfo.type = 'sine'; lfo.frequency.value = rate;
    g.gain.value = 0.5; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(out); env(out, t, a, peak, dur); out.connect(to);
    o.start(t); lfo.start(t); o.stop(t + a + dur + 0.05); lfo.stop(t + a + dur + 0.05);
    o.onended = () => { o.disconnect(); lfo.disconnect(); lg.disconnect(); g.disconnect(); out.disconnect(); };
  }
  let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // 소리 전용 난수(놀이 난수와 따로)

  /* 이름 → 합성(모두 짧게 · 길어도 2초) · o = 이 소리의 그릇(자리 소리면 좌우·거리 반영) · 울음은 a ≥ 0.12(서서히) */
  const LIB = {
    flap: (t, o) => { noise(t, 0.22, 260, 90, 0.7, 0.45, 0.03, o, 'lowpass'); tone(t, 'sine', 78, 52, 0.18, 0.22, 0.02, o); },   // 날개 한 번 '훅'
    whoosh: (t, o) => noise(t, 0.5, 400, 1600, 1.2, 0.35, 0.08, o),
    splash: (t, o) => { noise(t, 0.6, 1200, 300, 0.7, 0.6, 0.01, o); noise(t + 0.08, 0.5, 2400, 800, 1.5, 0.25, 0.01, o); noise(t + 0.35, 0.25, 3200, 2200, 3, 0.08, 0.01, o); },
    roar: (t, o) => { tone(t, 'sawtooth', 70, 55, 1.6, 0.35, 0.6, o); noise(t, 1.6, 500, 200, 2, 0.25, 0.6, o); },   // 서서히 커짐(0.6초)
    growl: (t, o) => { tone(t, 'sawtooth', 58, 50, 0.9, 0.25, 0.15, o); },
    purr: (t, o) => { rumble(t, 52, 23, 1.3, 0.42, 0.3, o); noise(t, 1.3, 180, 140, 0.8, 0.05, 0.3, o, 'lowpass'); },   // 가르랑(믿음↑) — 낮게 떨림
    fire: (t, o) => { noise(t, 0.7, 900, 300, 0.6, 0.35, 0.05, o); },
    boom: (t, o) => { noise(t, 1.0, 300, 60, 0.6, 0.5, 0.12, o); tone(t, 'sine', 80, 40, 0.8, 0.35, 0.12, o); },
    bang: (t, o) => { tone(t, 'triangle', 180, 120, 0.25, 0.5, 0.01, o); noise(t, 0.12, 2000, 800, 2, 0.3, 0.01, o); },
    clang: (t, o) => {                                                                 // 쇠 소리 — 어긋난 배음 넷(쇠는 배음이 정수배가 아님) + 딱 소리
      tone(t, 'sine', 523, 520, 0.7, 0.13, 0.003, o); tone(t, 'sine', 1347, 1340, 0.5, 0.09, 0.003, o); tone(t, 'sine', 2213, 2205, 0.35, 0.06, 0.003, o); tone(t, 'sine', 3170, 3160, 0.22, 0.04, 0.003, o);
      noise(t, 0.04, 4000, 3000, 1.5, 0.18, 0.002, o);
    },
    thud: (t, o) => { tone(t, 'sine', 110, 50, 0.3, 0.6, 0.01, o); },
    pluck: (t, o) => { tone(t, 'triangle', 330, 300, 0.25, 0.3, 0.01, o); },
    pop: (t, o) => { tone(t, 'sine', 600, 300, 0.12, 0.3, 0.01, o); },
    ok: (t, o) => { tone(t, 'triangle', 392, 392, 0.18, 0.25, 0.01, o); tone(t + 0.16, 'triangle', 523, 523, 0.3, 0.25, 0.01, o); },
    wind: (t, o) => noise(t, 1.6, 300, 500, 0.5, 0.18, 0.5, o),
    /* 나이트 퓨리 휘파람(우리가 새로 만든 소리) — 좁은 띠 바람이 올라갔다 내려옴 + 가는 사인 · 0.35초에 걸쳐 커짐 */
    whistle: (t, o) => {
      const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = 9;
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.75); f.frequency.exponentialRampToValueAtTime(1500, t + 1.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.35); g.gain.setValueAtTime(0.7, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      n.connect(f); f.connect(g); g.connect(o); n.start(t, rnd() * 0.1); n.stop(t + 1.4); n.onended = () => { n.disconnect(); f.disconnect(); g.disconnect(); };
      tone(t + 0.1, 'sine', 1100, 2400, 0.8, 0.045, 0.3, o);
    },
    /* 종마다 다른 울음(예고와 함께 · 보이는 짝 = 볼 부풂·가시·달아오름·초록 김) — 모두 서서히 · 상한 아래 */
    cry_gronckle: (t, o) => { rumble(t, 74, 17, 0.45, 0.4, 0.12, o); rumble(t + 0.55, 66, 15, 0.55, 0.42, 0.12, o); noise(t, 1.0, 320, 220, 1.2, 0.06, 0.15, o); },   // 꾸르릉 두 번(돌 씹는 소리)
    cry_nadder: (t, o) => { for (let k = 0; k < 3; k++) { const s = t + k * 0.17; tone(s, 'triangle', 1050 + k * 90, 1500 + k * 120, 0.12, 0.1, 0.03, o); } noise(t, 0.55, 2600, 3600, 4, 0.05, 0.12, o); },   // 새처럼 짹짹 셋
    cry_nightmare: (t, o) => { noise(t, 1.1, 2400, 5200, 1.5, 0.12, 0.35, o, 'highpass'); tone(t, 'sawtooth', 135, 108, 1.0, 0.13, 0.3, o); },   // 쉭— 달아오르는 소리 + 낮은 으르렁
    cry_zippleback: (t, o) => { noise(t, 0.8, 1700, 1500, 3, 0.09, 0.2, o); noise(t + 0.22, 0.8, 2300, 2000, 3, 0.08, 0.2, o); tone(t, 'sine', 96, 90, 0.9, 0.12, 0.25, o); },   // 머리 둘이 엇갈려 쉭쉭
    inhale: (t, o) => { noise(t, 0.5, 260, 1300, 0.9, 0.2, 0.9, o, 'lowpass'); },   // 숨 들이켬(대장 불 예고) — 0.9초에 걸쳐 커짐
    cry_terror: (t, o) => { tone(t, 'sine', 1800, 2500, 0.08, 0.07, 0.02, o); tone(t + 0.13, 'sine', 1900, 2700, 0.1, 0.07, 0.02, o); },
  };
  LIB.cry_nightfury = LIB.growl; LIB.cry_boss = LIB.roar;

  /* 원인 자리 → 좌우(카메라 오른쪽 축) · 거리(6m 안 = 그대로 · 20m ≈ 반 · 멀면 작게) */
  const SP = { pan: 0, vol: 1 };
  function spot(x, y, z) {
    const cam = S.G && S.G.camera; SP.pan = 0; SP.vol = 1; if (!cam) return SP;
    const e = cam.matrixWorld.elements, dx = x - e[12], dy = (y ?? e[13]) - e[13], dz = z - e[14], d = Math.hypot(dx, dy, dz) || 1e-3;
    SP.pan = Math.max(-1, Math.min(1, (dx * e[0] + dy * e[1] + dz * e[2]) / d)) * 0.85;
    SP.vol = 1 / (1 + Math.max(0, d - 6) / 14);
    return SP;
  }
  const last = {};
  S.play = (name, at, vol = 1) => {
    if (!S.on) return; init(); if (!ac) return; wake();
    const f = LIB[name]; if (!f) return;
    const now = ac.currentTime; if (last[name] && now - last[name] < 0.06) return; last[name] = now;   // 같은 소리가 한 걸음에 겹겹이 X
    const g = ac.createGain(); let p = null, v = vol;
    if (at && at.x != null) { const s = spot(at.x, at.y, at.z); v *= s.vol; if (Math.abs(s.pan) > 0.02 && ac.createStereoPanner) { p = ac.createStereoPanner(); p.pan.value = s.pan; } }
    g.gain.value = Math.max(0, Math.min(1.2, v)); if (p) { g.connect(p); p.connect(master); } else g.connect(master);
    f(now + 0.01, g);
    setTimeout(() => { g.disconnect(); if (p) p.disconnect(); }, 2600);              // 모든 소리는 2초 안에 끝남
  };

  /* 이어지는 소리(한 이름 = 노드 한 벌 · 3초 조용하면 지움 → 다시 부르면 새로) */
  const LOOPS = {};
  function mkLoop(name) {
    if (name !== 'wind' && name !== 'crackle') return null;
    const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const f = ac.createBiquadFilter(), g = ac.createGain(); g.gain.value = 0;
    const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    if (name === 'wind') { f.type = 'bandpass'; f.Q.value = 0.7; f.frequency.value = 400; } else { f.type = 'highpass'; f.Q.value = 0.5; f.frequency.value = 1800; }
    n.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(master); } else g.connect(master); n.start();
    return (LOOPS[name] = { name, n, f, g, p, want: 0, hold: 0, pan: 0, fresh: false, seen: -9, quiet: 0 });
  }
  S.level = (name, k, pan = 0) => {
    if (!S.on || !ac || ac.state !== 'running') return;
    const L = LOOPS[name] || mkLoop(name); if (!L) return;
    if (L.fresh && k <= L.hold) return;
    L.hold = k; L.pan = pan; L.fresh = true; L.seen = ac.currentTime;
  };
  S.near = (name, x, y, z, k) => { if (!S.on || !ac) return; const s = spot(x, y, z); S.level(name, k * s.vol, s.pan); };
  function tickLoops(now) {
    for (const key in LOOPS) {
      const L = LOOPS[key]; L.fresh = false;
      const want = S.on && now - L.seen < 0.45 ? L.hold : 0;
      if (L.name === 'wind') { L.g.gain.setTargetAtTime(want > 0 ? 0.03 + want * 0.32 : 0, now, 0.25); L.f.frequency.setTargetAtTime(320 + want * 1100, now, 0.3); }
      else {
        L.g.gain.setTargetAtTime(want * 0.05, now, 0.2);                                // 타는 쉭 소리(낮게)
        const pops = want * 3.2; for (let i = 0; i < 4; i++) if (rnd() < pops / 4) {   // 탁탁 — 0.1초에 평균 want×3번
          const s = now + 0.02 + rnd() * 0.09, g = L.p || master;
          noise(s, 0.012 + rnd() * 0.03, 1400 + rnd() * 2600, 1200, 1.2, (0.12 + rnd() * 0.22) * want, 0.002, g);
        }
      }
      if (L.p) L.p.pan.setTargetAtTime(L.pan, now, 0.2);
      L.quiet = want > 0.005 ? 0 : L.quiet + 0.1;
      if (L.quiet > 3) { L.n.stop(); L.n.disconnect(); L.f.disconnect(); L.g.disconnect(); if (L.p) L.p.disconnect(); delete LOOPS[key]; }
    }
  }

  /* 곡 고르기 — 장소·차례대로(아래 표) · 차례가 고정했으면 그것 */
  let force = null;
  function autoMood() {
    const g = S.G; if (!g) return 'village';
    const R = g.runner, st = R && R.step;
    if (force && st && force.step === st) return force.mood;
    force = null;
    if (g.ended || !st) return 'village';                                           // 첫 화면·엔딩
    const pl = g.place ? g.place.name : st.place || '', tm = st.time || '', ch = R.ch ? R.ch.id : -1;
    if (pl === 'nest' && st.variant !== 'after') return 'tense';                     // 둥지·대장전
    if ((g.player && g.player.cam === 'fly') || st.verb === 'fly') return 'flight';
    if (ch === 1 && tm === 'night') return 'tense';                                  // 습격의 밤
    if (pl === 'arena' && (st.verb === 'dodge' || st.verb === 'throw' || st.verb === 'hide')) return 'tense';   // 훈련장 피하기·쏘기
    if (pl === 'cove' || pl === 'forest' || pl === 'hall' || tm === 'night' || tm === 'fog') return 'cove';
    return 'village';
  }
  S.music = {
    set: (mood) => { const g = S.G, st = g && g.runner && g.runner.step; force = mood ? { mood, step: st } : null; },
    now: () => (music ? music.mood : ''),
    count: () => (music ? music.count() : 0),
  };
  function tick() {
    if (!S.on || !ac || ac.state !== 'running' || document.hidden) return;          // 숨은 탭 = 쉼(돌아오면 늦은 노트는 건너뜀)
    const now = ac.currentTime;
    music.want(autoMood(), now); music.tick(now);
    tickLoops(now);
  }
  S.loops = () => Object.keys(LOOPS);
  S.hide = (v) => { btn.style.display = v ? 'none' : ''; };
  return S;
}
