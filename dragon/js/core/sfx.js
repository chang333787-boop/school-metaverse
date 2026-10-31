// 소리(design §15·§8) — WebAudio로 직접 합성(내려받은 소리 X · 원작 소리·멜로디 X) · 기본은 꺼짐(교실) · 모든 소리에 보이는 짝 신호가 따로 있음
// 울음·폭발은 음량 상한 + 서서히 커짐(깜짝 X) · 켜고 끄기 = 구석 단추(키 X) · 설정은 이 기기에 기억
import { loadSet, saveSet } from './gfx.js?v=16';

export function createSfx() {
  let ac = null, master = null, noiseBuf = null;
  const S = { on: !!loadSet().sound };
  const btn = document.createElement('button');
  btn.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:25;font:600 15px "Noto Sans KR",sans-serif;padding:6px 12px;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:12px 16px 10px 18px;cursor:pointer';
  const label = () => { btn.textContent = S.on ? '소리 끄기' : '소리 켜기'; };
  label(); document.body.appendChild(btn);
  btn.onclick = () => { S.on = !S.on; saveSet({ sound: S.on }); label(); if (S.on) init(); if (master) master.gain.value = S.on ? 0.8 : 0; btn.blur(); };
  function init() {
    if (ac) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = S.on ? 0.8 : 0;
    const lim = ac.createDynamicsCompressor(); lim.threshold.value = -14; lim.ratio.value = 8; master.connect(lim); lim.connect(ac.destination);   // 음량 상한
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; }
  }
  const env = (g, t, a, peak, rel) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel); };
  function noise(t, dur, f0, f1, q, peak, a = 0.01) {
    const n = ac.createBufferSource(); n.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur); n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + dur + a + 0.05);
  }
  function tone(t, type, f0, f1, dur, peak, a = 0.01) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + a + 0.05);
  }
  /* 이름 → 합성(모두 짧게 · 길어도 2초) */
  const LIB = {
    flap: (t) => noise(t, 0.18, 300, 120, 0.8, 0.5),
    whoosh: (t) => noise(t, 0.5, 400, 1600, 1.2, 0.35, 0.08),
    splash: (t) => { noise(t, 0.6, 1200, 300, 0.7, 0.6, 0.01); noise(t + 0.08, 0.5, 2400, 800, 1.5, 0.25); },
    roar: (t) => { tone(t, 'sawtooth', 70, 55, 1.6, 0.35, 0.6); noise(t, 1.6, 500, 200, 2, 0.25, 0.6); },   // 서서히 커짐(0.6초)
    growl: (t) => { tone(t, 'sawtooth', 58, 50, 0.9, 0.25, 0.15); },
    purr: (t) => { tone(t, 'sine', 48, 46, 1.2, 0.3, 0.2); },
    fire: (t) => { noise(t, 0.7, 900, 300, 0.6, 0.35, 0.05); },
    boom: (t) => { noise(t, 1.0, 300, 60, 0.6, 0.5, 0.12); tone(t, 'sine', 80, 40, 0.8, 0.35, 0.12); },
    bang: (t) => { tone(t, 'triangle', 180, 120, 0.25, 0.5); noise(t, 0.12, 2000, 800, 2, 0.3); },
    clang: (t) => { tone(t, 'square', 880, 860, 0.35, 0.18); tone(t, 'sine', 1320, 1300, 0.5, 0.12); },
    thud: (t) => { tone(t, 'sine', 110, 50, 0.3, 0.6); },
    pluck: (t) => { tone(t, 'triangle', 330, 300, 0.25, 0.3); },
    pop: (t) => { tone(t, 'sine', 600, 300, 0.12, 0.3); },
    ok: (t) => { tone(t, 'triangle', 392, 392, 0.18, 0.25); tone(t + 0.16, 'triangle', 523, 523, 0.3, 0.25); },
    wind: (t) => noise(t, 1.6, 300, 500, 0.5, 0.18, 0.5),
  };
  S.play = (name) => { if (!S.on) return; init(); if (!ac) return; if (ac.state === 'suspended') ac.resume(); const f = LIB[name]; if (f) f(ac.currentTime + 0.01); };
  S.hide = (v) => { btn.style.display = v ? 'none' : ''; };
  return S;
}
