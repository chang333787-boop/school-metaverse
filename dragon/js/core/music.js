// 곡 넷(design §15 · goal §2-5) — WebAudio로 직접 연주 · 가락은 모두 우리가 새로 지음(원작 곡·흔한 민요 그대로 X) · 북·피리·현 셋
// 마을 낮(따뜻) · 코브(조용 · 신비) · 비행(넓게 · 신남) · 긴장(습격·대장전 · 무섭지 않게 = 단조지만 맞부딪히는 음 X · 크기 일정)
// 소리 단추가 켜졌을 때만 sfx.js가 tick을 부름 · 바뀔 때 2초 겹침 · 효과음보다 낮게(버스 0.3) · 노트 노드는 끝나면 스스로 끊김(40분 틀어도 쌓이지 않음)
// 박자 짜기: 미리 0.35초만 앞서 예약(setInterval 0.1초 · 탭이 숨으면 sfx가 멈춤) · 곡마다 줄(track)이 제 길이로 돌고, 가락 줄은 몇 바퀴에 한 번 쉼(덜 지루하게)

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/* 'F#5' → 미디 번호 · 'x'·'o' = 북(세게·여리게) · '-' = 쉼 */
function midi(n) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
/* 'D5:1 B4:.5 -:1 G3+B3+D4:4' → [{ b 시작 박, d 길이 박, m 미디 배열 또는 'x'/'o' }] · 길이 = 박 합 */
function seq(str) {
  const ev = []; let b = 0;
  for (const tok of str.trim().split(/\s+/)) {
    const [n, d0] = tok.split(':'); const d = +d0 || 1;
    if (n !== '-') ev.push({ b, d, m: n === 'x' || n === 'o' ? n : n.split('+').map(midi) });
    b += d;
  }
  return { ev, len: b };
}
/* 화음 표 → 뜯는 현 펼침(박마다 음 하나) — pat = 화음 안 자리(0 뿌리 · 1 셋째 · 2 다섯째 · 3 = 뿌리 한 옥타브 위 · 4 = 셋째 위) */
function arp(chords, pat, step, beatsPer = 4) {
  let s = '';
  for (const c of chords) {
    const ns = c.split('+'); const up = (n) => n.replace(/(\d)$/, (d) => String(+d + 1));
    const pool = [ns[0], ns[1], ns[2] || ns[1], up(ns[0]), up(ns[1])];
    for (let k = 0, b = 0; b < beatsPer - 1e-6; k++, b += step) s += pool[pat[k % pat.length]] + ':' + step + ' ';
  }
  return s;
}
const pad = (chords, beats = 4) => chords.map((c) => c + ':' + beats).join(' ');

/* ── 곡 ────────────────────────────────────────────────────────────────────────────────────── */
/* rest: [n, k] = n바퀴마다 k번째 바퀴는 이 줄이 쉼 · only: [n, k] = n바퀴마다 k번째 바퀴에만 나옴 */
const VILL_CH = ['G3+B3+D4', 'E3+G3+B3', 'C3+E3+G3', 'D3+F#3+A3', 'G3+B3+D4', 'C3+E3+G3', 'A3+C4+E4', 'G3+B3+D4'];
const COVE_CH = ['D3+F3+A3', 'G3+B3+D4', 'F3+A3+C4', 'C3+E3+G3', 'D3+F3+A3', 'G3+B3+D4', 'Bb2+D3+F3', 'C3+E3+G3'];
const FLY_CH = ['A3+C#4+E4', 'E3+G#3+B3', 'F#3+A3+C#4', 'D3+F#3+A3', 'A3+C#4+E4', 'E3+G#3+B3', 'D3+F#3+A3', 'E3+G#3+B3'];
const TENS_CH = ['E3+G3+B3', 'C3+E3+G3', 'D3+F#3+A3', 'B2+D3+F#3', 'E3+G3+B3', 'C3+E3+G3', 'A2+C3+E3', 'B2+D#3+F#3'];
const low = (chs) => chs.map((c) => c.split('+')[0].replace(/(\d)$/, (d) => String(+d - 1)));

export const SONGS = {
  /* 마을 낮 — 사장조 · 92 · 걷는 빠르기 · 피리 가락(우리 것) + 뜯는 현 + 북 한 번 · 셋째 바퀴는 피리가 낮게 길게만 */
  village: { bpm: 92, vol: 1, tracks: [
    { inst: 'bow', vel: 0.55, ...seq(pad(VILL_CH)) },
    { inst: 'pluck', vel: 0.5, ...seq(arp(VILL_CH, [0, 2, 3, 2, 1, 2, 3, 2], 0.5)) },
    { inst: 'flute', vel: 0.8, rest: [3, 2], ...seq('D5:1 B4:.5 D5:.5 E5:1 D5:1  B4:1.5 A4:.5 G4:1 B4:1  C5:1 E5:.5 D5:.5 C5:1 G4:1  A4:2 -:1 D5:.5 E5:.5  G5:1 E5:.5 D5:.5 B4:1 D5:1  E5:1.5 D5:.5 C5:1 E5:1  D5:1 B4:.5 A4:.5 F#4:1 A4:1  G4:3 -:1') },
    { inst: 'flute', vel: 0.5, only: [3, 2], ...seq('B4:4 G4:4 E4:4 F#4:4 G4:4 E4:4 F#4:4 G4:4') },
    { inst: 'drum', vel: 0.6, ...seq('x:1.5 o:.5 o:1 o:1') },
  ] },
  /* 코브 — 라 도리아 · 64 · 북 없음 · 하프처럼 천천히 펼침 + 긴 숨 피리(두 바퀴에 한 번) + 가끔 맑은 종 */
  cove: { bpm: 64, vol: 0.9, tracks: [
    { inst: 'bow', vel: 0.45, ...seq(pad(COVE_CH)) },
    { inst: 'pluck', vel: 0.42, ...seq(arp(COVE_CH, [0, 2, 3, 4], 1)) },
    { inst: 'flute', vel: 0.55, only: [2, 1], ...seq('A4:3 G4:1  F4:2 E4:2  D4:4  -:4  A4:2 C5:2  B4:3 A4:1  G4:2 F4:1 E4:1  D4:4') },
    { inst: 'bell', vel: 0.4, ...seq('-:6 A5:2 -:8 E5:2 -:14') },
  ] },
  /* 비행 — 가장조 · 126 · 말 달리는 북 + 8분 현 + 높이 솟는 피리(넷째 바퀴 중 셋째는 쉼 = 바람만) */
  flight: { bpm: 126, vol: 1, tracks: [
    { inst: 'bow', vel: 0.5, ...seq(pad(FLY_CH)) },
    { inst: 'pluck', vel: 0.48, ...seq(arp(FLY_CH, [0, 3, 2, 3], 0.5)) },
    { inst: 'pluck', vel: 0.4, ...seq(pad(low(FLY_CH), 4)) },
    { inst: 'flute', vel: 0.8, rest: [4, 2], ...seq('E5:1.5 A5:.5 G#5:1 E5:1  F#5:.5 E5:.5 B4:1 E5:1 G#5:1  A5:2 F#5:1 C#6:1  B5:1.5 A5:.5 F#5:1 D5:1  E5:1 A5:1 C#6:1.5 B5:.5  G#5:1 B5:1 E6:2  F#5:1 A5:.5 F#5:.5 D5:1 F#5:1  E5:3 -:1') },
    { inst: 'drum', vel: 0.7, ...seq('x:.75 x:.25 o:1 x:.5 x:.5 o:1') },
  ] },
  /* 긴장 — 마 단조 · 112 · 꾸준한 북 + 낮은 현 되풀이 + 씩씩한 피리(겁주는 소리 X · 마지막 마디는 이끎음으로 다시 처음) */
  tense: { bpm: 112, vol: 0.85, tracks: [
    { inst: 'bow', vel: 0.4, ...seq(pad(TENS_CH)) },
    { inst: 'pluck', vel: 0.5, ...seq(arp(TENS_CH, [0, 0, 2, 0, 0, 0, 3, 2], 0.5)) },
    { inst: 'flute', vel: 0.7, rest: [3, 2], ...seq('E5:.5 F#5:.5 G5:1 B5:1.5 A5:.5  G5:1 E5:1 -:2  D5:.5 E5:.5 F#5:1 A5:1.5 G5:.5  F#5:2 -:2  E5:.5 G5:.5 B5:1 E6:1.5 D6:.5  C6:1 B5:.5 A5:.5 G5:2  A5:1 G5:.5 F#5:.5 E5:1 C5:1  D#5:2 F#5:1 -:1') },
    { inst: 'drum', vel: 0.6, ...seq('x:1 x:.5 o:.5 x:1 o:1') },
  ] },
};

/* ── 연주자 ─────────────────────────────────────────────────────────────────────────────────── */
export function createMusic(ac, out, noiseBuf) {
  const bus = ac.createGain(); bus.gain.value = 0.35; bus.connect(out);           // 효과음보다 낮게
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const live = [];                                                                // 지금 울리는 곡(겹칠 때 둘)
  const M = { mood: '', bus };
  const done = (...ns) => () => { for (const n of ns) n.disconnect(); };          // 소리가 끝나면 노드를 스스로 끊음

  /* 악기 — t 시작 · d 길이(초) · v 세기 · to = 곡 그릇 */
  const INST = {
    flute(t, ms, d, v, to) {                                                       // 피리: 세모파 + 늦게 오는 떨림(cent 자동화 · 노드 X)
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = hz(ms[0]);
      const pk = 0.2 * v, rel = Math.min(0.18, d * 0.4);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.06); g.gain.linearRampToValueAtTime(pk * 0.85, t + Math.max(0.07, d - rel)); g.gain.linearRampToValueAtTime(0, t + d + 0.02);
      o.detune.setValueAtTime(-8, t); o.detune.linearRampToValueAtTime(0, t + 0.07);
      if (d > 0.6) for (let k = 0, s = t + 0.3; s < t + d - 0.1 && k < 48; k++, s += 0.09) o.detune.linearRampToValueAtTime(k % 2 ? -9 : 9, s);
      o.connect(g); g.connect(to); o.start(t); o.stop(t + d + 0.05); o.onended = done(o, g);
    },
    pluck(t, ms, d, v, to) {                                                       // 뜯는 현: 세모파 + 옥타브 사인 · 빨리 줄어듦
      const L = Math.min(1.4, 0.35 + d * 0.6);
      for (const m of ms) {
        const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
        const pk = 0.17 * v / Math.sqrt(ms.length); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
        o.connect(g); o2.connect(g); g.connect(to); o.start(t); o2.start(t); o.stop(t + L + 0.05); o2.stop(t + L + 0.05); o.onended = done(o, o2, g);
      }
    },
    bow(t, ms, d, v, to) {                                                         // 활 현(바닥 화음): 톱니파를 낮은 거름으로 부드럽게 · 천천히 커지고 줄어듦
      const f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 820; f.Q.value = 0.4;
      const pk = 0.05 * v, a = Math.min(0.6, d * 0.3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setValueAtTime(pk, Math.max(t + a + 0.01, t + d - 0.25)); g.gain.linearRampToValueAtTime(0, t + d + 0.35);
      f.connect(g); g.connect(to);
      const os = ms.map((m, i) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = i % 2 ? 5 : -5; o.connect(f); o.start(t); o.stop(t + d + 0.4); return o; });
      os[0].onended = done(...os, f, g);
    },
    bell(t, ms, d, v, to) {                                                        // 맑은 종(코브): 사인 + 어긋난 배음 · 길게 사라짐
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain(); o.type = o2.type = 'sine'; o.frequency.value = hz(ms[0]); o2.frequency.value = hz(ms[0]) * 2.76;
      const pk = 0.09 * v; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      g2.gain.value = 0.3; o2.connect(g2); g2.connect(g); o.connect(g); g.connect(to); o.start(t); o2.start(t); o.stop(t + 2.5); o2.stop(t + 2.5); o.onended = done(o, o2, g, g2);
    },
    drum(t, ms, d, v, to) {                                                        // 북: 'x' = 큰북(사인 음높이 떨어짐 + 가죽 소리) · 'o' = 테두리 톡
      const big = ms === 'x';
      const o = ac.createOscillator(), g = ac.createGain(); o.type = big ? 'sine' : 'triangle';
      o.frequency.setValueAtTime(big ? 120 : 260, t); o.frequency.exponentialRampToValueAtTime(big ? 48 : 180, t + (big ? 0.22 : 0.06));
      const pk = (big ? 0.42 : 0.1) * v; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.42 : 0.1));
      o.connect(g); g.connect(to); o.start(t); o.stop(t + 0.5); o.onended = done(o, g);
      if (noiseBuf) {
        const n = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain(); n.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = big ? 380 : 2200; f.Q.value = 0.9;
        const pn = (big ? 0.12 : 0.07) * v; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(pn, t + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.12 : 0.05));
        n.connect(f); f.connect(gn); gn.connect(to); n.start(t, (t * 7.31) % 1); n.stop(t + 0.15); n.onended = done(n, f, gn);
      }
    },
  };

  /* 곡 하나 틀기 — 줄마다 다음 노트 자리(i) · 바퀴(loop) */
  function start(name, now) {
    const song = SONGS[name]; if (!song) return null;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(song.vol, now + 2); g.connect(bus);
    const A = { name, song, g, t0: now + 0.08, spb: 60 / song.bpm, stopAt: Infinity, st: song.tracks.map(() => ({ i: 0, loop: 0 })) };
    live.push(A); return A;
  }
  function fade(A, now, sec) {
    A.g.gain.cancelScheduledValues(now); A.g.gain.setValueAtTime(Math.max(0.0001, A.g.gain.value), now); A.g.gain.linearRampToValueAtTime(0.0001, now + sec);
    A.stopAt = Math.min(A.stopAt, now + sec);
  }
  const plays = (tr, loop) => (tr.rest ? loop % tr.rest[0] !== tr.rest[1] : true) && (tr.only ? loop % tr.only[0] === tr.only[1] : true);

  /* 고르기 — 같은 곡이면 그대로 · 다르면 2초 겹침 · 겹침이 셋 넘으면 제일 오래된 것을 빨리 끔 */
  M.want = (name, now) => {
    if (name === M.mood) return;
    M.mood = name;
    for (const A of live) if (A.stopAt === Infinity) fade(A, now, 2);
    if (name) start(name, now);
    while (live.length > 3) live.shift().g.disconnect();                          // 빨리 여러 번 바뀌면 제일 오래된 것부터 바로 비움
  };
  /* 박자 짜기 — sfx가 0.1초마다 부름 · now = ac.currentTime */
  M.tick = (now) => {
    const hor = now + 0.35;
    for (let k = live.length - 1; k >= 0; k--) {
      const A = live[k];
      if (now > A.stopAt + 0.6) { A.g.disconnect(); live.splice(k, 1); continue; }
      A.song.tracks.forEach((tr, j) => {
        const s = A.st[j]; if (!tr.ev.length) return;
        for (let guard = 0; guard < 400; guard++) {
          const e = tr.ev[s.i], ts = A.t0 + (s.loop * tr.len + e.b) * A.spb;
          if (ts >= hor) break;
          if (ts >= now - 0.02 && ts < A.stopAt && plays(tr, s.loop)) INST[tr.inst](ts, e.m, e.d * A.spb, tr.vel, A.g);   // 늦은 노트(탭이 숨었다 돌아옴)는 건너뜀
          if (++s.i >= tr.ev.length) { s.i = 0; s.loop++; }
        }
      });
    }
  };
  /* 소리 끔 → 곡을 다 비움(다시 켜면 처음부터) */
  M.stop = (now) => { for (const A of live) fade(A, now, 0.25); M.mood = ''; };
  M.count = () => live.length;
  return M;
}
