// 🎵 마을 배경 음악(WAKE-1a · 사용자 10-19 "이거 완전 수면제 게임이다, 하니까 너무 졸려") — 정본 docs/systems/town_music.md
//   직접 지은 곡 여섯(낮·해 질 녘·밤·비·놀이·잔치)을 WebAudio로 그 자리에서 합성한다 — 음원 파일·네트워크 X · 저작권 X
//   곡 = 부분 A·B(+ 여는 마디·쉬어 가는 마디) + 변주(화음 선율 · 드럼 바꿈 · 채움 · 둘째 바퀴 다른 소리) · 4/4 · 100~120 BPM
//   낮 곡은 동네(regionOf)마다 선율 악기가 다르다(읍내 = 뜯는 소리 · 시내 = 전자 피아노 · 산 = 피리 · 들 = 오카리나 · 강 = 마림바 · 바다 = 스틸 드럼 · 관광 = 글로켄)
//   예약 = AudioContext 시간으로 0.4초마다 다음 1초 분량(매 프레임 일 0) · 소리 수 = 갈래마다 정해진 칸(선율·베이스·화음 둘·드럼 둘 = 6 이하)
//   때·곳은 town.js가 넘겨 주는 state()로만 본다(밤·날씨·실내·놀이·잠·잔치·동네) · 곡이 바뀌면 1초 줄어들고 1초 커짐(≈2초)
//   켜기·끄기 = ☰ 메뉴(이 기기 localStorage — 바뀔 때만 씀) · 첫 사용자 동작 뒤에 시작 · 탭이 숨으면 멈춤 · 홍보판(SM_PROMO)은 기본 꺼짐

const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const midiOf = (s) => { const m = /^([a-g])(#|b)?(\d)$/.exec(s); return m ? 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null; };
const CHQ = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus: [0, 5, 7], sus2: [0, 2, 7], 6: [0, 4, 7, 9] };
const chordOf = (s) => { const m = /^([A-G])(#|b)?(.*)$/.exec(s), iv = m && CHQ[m[3]]; if (!iv) throw new Error('화음 이름 ' + s); return { r: (PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? 11 : 0)) % 12, iv }; };
const into = (pc, lo) => lo + (((pc - lo) % 12) + 12) % 12;   // 음이름(0~11)을 lo 이상 lo+12 미만 높이로

// ───────── 곡 자료 ─────────
//   ch = 마디마다 화음(쉼표 = 반 마디씩 둘) · mel = 마디('|')마다 8분음표 여덟 칸(음 · '-' = 늘임 · '.' = 쉼 · 'c5/d5' = 16분 둘)
//   bass = [칸(16분), 음(r 밑음 · 5 · 8 옥타브 · 3 · a = 다음 마디 밑음으로 이끄는 반음), 길이, 세기] · comp = [칸, 길이, 세기](화음 둘) · arp = [칸, 화음 안 몇째 음, 길이]
//   drums = 줄마다 16칸(x 셈 · o 여림) — k 킥 · s 손뼉 · r 나무 · h 닫힌 심벌 · z 셰이커 · b 북 · g 장구 쿵 · d 장구 덕 · w 꽹과리
//   form = [부분, 늘 바꿀 것, 둘째 바퀴마다 바꿀 것] · harm = 선율 3도 아래 화음 선율(화음은 한 음으로 줄여 소리 수 그대로) · fill = 마지막 마디 드럼 채움
export const SONGS = {
  day: { name: ['햇살 골목', 'Sunny Lane'], bpm: 112, key: 5, swing: 0.16, lead: 'region', bassI: 'bass', compI: 'keys', echo: 0.16,
    sec: {
      I: { ch: 'Fmaj7 Gm7,C7', mel: '', dr: 'i' },
      A: { ch: 'Fmaj7 Dm7 Gm7 C7 Fmaj7 Am7 Bb C',
        mel: 'a4 c5 f5 - e5 - c5 . | d5 - a4 - . f4 a4 c5 | bb4 - d5 - c5 bb4 a4 g4 | a4 - g4 - c5 - . . | a4 c5 f5 - e5 - c5 . | e5 - g5 - e5 c5 a4 . | d5 - f5 - d5 c5 bb4 d5 | c5 - - - . . e4 g4' },
      A2: { ch: 'Fmaj7 Dm7 Gm7 C7 Fmaj7 Am7 Gm7,C7 F',
        mel: 'a4 c5 f5 - e5 - c5 . | d5 - a4 - . f4 a4 c5 | bb4 - d5 - c5 bb4 a4 g4 | a4 - g4 - e4 - . . | a4 c5 f5 - e5 - c5 . | e5 - g5 - a5 g5 e5 c5 | d5 - c5 bb4 a4 - g4 - | f4 - - - . . . .' },
      B: { ch: 'Bb C Am7 Dm7 Gm7 C7 F,D7 Gm7,C7', bs: 'b', cp: 'b',
        mel: 'f5 - - - d5 - f5 - | g5 - - - e5 - c5 - | e5 - - - c5 - e5 - | f5 - e5 - d5 - a4 - | bb4 - d5 - g5 - f5 - | e5 - g5 - bb5 - a5 g5 | a5 - - f5 f#5 - a5 - | g5 - f5 - e5 - c5 -' },
      K: { ch: 'Bbmaj7 Am7 Gm7 Csus,C7', bs: 'k', cp: 'k', dr: 'k', lead: 'bell',
        mel: 'd5 - - - . . f5 - | e5 - - - . . c5 - | d5 - - - bb4 - - - | c5 - - - . . . .' } },
    form: [['I'], ['A', null, { dr: 'b' }], ['A2', null, { harm: 1 }], ['B', { fill: 1 }], ['A', { harm: 1, dr: 'b' }, { harm: 0, lead: 'glock' }], ['B', { harm: 1, dr: 'b', fill: 1 }], ['K']], loopTo: 1,
    bass: { a: [[0, 'r', 3], [6, '5', 2, 0.75], [8, 'r', 3, 0.9], [12, '5', 2, 0.75], [14, 'a', 2, 0.65]], b: [[0, 'r', 3], [4, '5', 2, 0.75], [6, '8', 2, 0.7], [8, 'r', 3, 0.9], [12, '3', 2, 0.75], [14, '5', 2, 0.7]], k: [[0, 'r', 7, 0.8], [8, '5', 6, 0.7]] },
    comp: { a: [[4, 2, 0.8], [10, 1, 0.5], [12, 2, 0.8]], b: [[2, 2, 0.7], [6, 2, 0.7], [10, 2, 0.7], [14, 2, 0.7]], k: [[0, 14, 0.55]] },
    drums: { i: { k: 'x.......x.......', h: '..o...o...o...o.' }, a: { k: 'x.......x.x.....', s: '....x.......x...', h: '..x...x...x...x.' },
      b: { k: 'x.....x.x.......', s: '....x.......x..o', h: '..x.o.x...x.o.x.' }, k: { k: 'x...............', s: '............o...', h: '..o.......o.....' } },
    fill: { s: '........x.x.xxxx' } },

  dusk: { name: ['노을 정자', 'Sunset Pavilion'], bpm: 100, key: 2, swing: 0.1, lead: 'epiano', bassI: 'bass', compI: 'keys', echo: 0.2, lv: 0.9,
    sec: {
      A: { ch: 'Dmaj7 Bm7 Gmaj7 Asus,A7 Dmaj7 F#m7 Gmaj7 Em7,A7',
        mel: 'f#5 - - e5 d5 - a4 - | b4 - - - d5 - f#5 - | e5 - - d5 b4 - - - | a4 - - - . . c#5 e5 | f#5 - - e5 d5 - a4 - | c#5 - - - e5 - a5 - | g5 - f#5 - e5 - d5 - | e5 - - - c#5 - - -' },
      B: { ch: 'Gmaj7 F#m7 Em7 Dmaj7 Gmaj7 F#m7,Bm7 Em7 Asus,A7',
        mel: 'd5 - b4 - d5 - g5 - | f#5 - - - e5 - c#5 - | d5 - - - b4 - g4 - | a4 - - - . . f#4 a4 | b4 - - - d5 - g5 - | a5 - - f#5 d5 - f#5 - | e5 - - - d5 - b4 - | a4 - - - . . . .' } },
    form: [['A', null, { dr: 'b' }], ['B'], ['A', { harm: 1, dr: 'b' }], ['B', { fill: 1, dr: 'b' }, { lead: 'piano', fill: 1, dr: 'b' }]], loopTo: 0,
    bass: { a: [[0, 'r', 6, 0.85], [6, '5', 2, 0.6], [8, 'r', 4, 0.8], [12, '3', 4, 0.6]] },
    comp: { a: [[0, 4, 0.5], [6, 2, 0.42], [8, 4, 0.5], [14, 2, 0.4]] },
    drums: { a: { k: 'x.......x.......', r: '....o.......o...', z: 'o.oo..o.o.oo..o.' }, b: { k: 'x.....x.x.......', r: '....o.......o..o', z: 'o.ooo.o.o.ooo.oo' } },
    fill: { r: '........o.o.oooo' } },

  night: { name: ['별빛 마루', 'Starlit Porch'], bpm: 100, key: 0, swing: 0, lead: 'bell', bassI: 'sub', compI: 'piano', arp: 1, poly: { lead: 2, ch1: 2 }, echo: 0.3, lv: 0.8,
    sec: {
      A: { ch: 'Cmaj7 Am7 Fmaj7 G Cmaj7 Em7 Fmaj7 Gsus,G',
        mel: 'g5 - - - e5 - - - | a5 - - - g5 - e5 - | f5 - - - e5 - c5 - | d5 - - - - - . . | g5 - - - e5 - - - | b5 - - - g5 - e5 - | a5 - - - c6 - a5 - | g5 - - - - - . .' },
      B: { ch: 'Am7 Em7 Fmaj7 Cmaj7 Dm7 Em7 Fmaj7 Gsus,G', cp: 'b', dr: 'b',
        mel: 'e5 - - - a5 - - - | g5 - - - b5 - - - | c6 - - - a5 - f5 - | e5 - - - - - . . | f5 - - - a5 - - - | g5 - - - b5 - - - | a5 - - - g5 - f5 - | f5 - - - d5 - - -' } },
    form: [['A'], ['B'], ['A', { harm: 1 }], ['B', null, { lead: 'glock' }]], loopTo: 0,
    bass: { a: [[0, 'r', 8, 0.75], [8, 'r', 8, 0.6]] },
    comp: { a: [[0, 0, 3], [2, 1, 3], [4, 2, 3], [6, 3, 3], [8, 4, 3], [10, 3, 3], [12, 2, 3], [14, 1, 3]], b: [[0, 0, 4], [3, 2, 3], [6, 3, 4], [8, 1, 4], [11, 4, 3], [14, 2, 2]] },
    drums: { a: {}, b: { z: '....o.......o...' } } },

  rain: { name: ['빗방울 창가', 'Raindrop Window'], bpm: 100, key: 0, swing: 0.08, lead: 'piano', bassI: 'sub', compI: 'pad', echo: 0.24, lv: 0.85,
    sec: {
      A: { ch: 'Am7 Fmaj7 Cmaj7 G Am7 Fmaj7 Dm7 Esus,E',
        mel: 'e5 - - - c5 - d5 e5 | c5 - - - a4 - - - | g4 - - - e5 - d5 c5 | d5 - - - b4 - - - | e5 - - - g5 - e5 - | a5 - - - g5 - e5 - | f5 - - - e5 - d5 - | e5 - - - g#4 - b4 -' },
      B: { ch: 'Fmaj7 G Em7 Am7 Dm7 G Cmaj7 Esus,E',
        mel: 'c5 - - - f5 - - - | d5 - - - g5 - - - | b4 - - - e5 - g5 - | a5 - - - - - . . | a4 - - - d5 - f5 - | g5 - - - f5 - d5 - | e5 - - - c5 - - - | b4 - - - - - . .' } },
    form: [['A'], ['B', null, { dr: 'b' }], ['A', { harm: 1, dr: 'b' }], ['B', { fill: 1 }]], loopTo: 0,
    bass: { a: [[0, 'r', 6, 0.8], [6, '5', 2, 0.5], [8, 'r', 8, 0.7]] },
    comp: { a: [[0, 8, 0.55], [8, 8, 0.5]] },
    drums: { a: { k: 'x...............', r: '........o.......', z: '..o...o...o...o.' }, b: { k: 'x.........x.....', r: '........o.......', z: '..o.o.o...o.o.o.' } },
    fill: { r: '........o...o.oo' } },

  play: { name: ['바쁜 손', 'Busy Hands'], bpm: 120, key: 7, swing: 0, lead: 'marimba', bassI: 'bass', compI: 'keys', echo: 0.1,
    sec: {
      A: { ch: 'G Em C D G Em Am7 D7',
        mel: 'd5 g5 b5 g5 d5 - b4 - | e5 g5 b5 g5 e5 - b4 - | c5 e5 g5 e5 c5 - e5 g5 | f#5 - a5 - f#5 e5 d5 - | d5 g5 b5 g5 d5 - b4 - | e5 g5 b5 g5 e5 - g5 - | a5 - g5 - e5 - c5 - | d5 - f#5 - a5 - c6 -' },
      B: { ch: 'C D Bm7 Em Am7 D G,Em Am7,D7',
        mel: 'e5 - . e5 g5 - e5 - | f#5 - . f#5 a5 - f#5 - | d5 - . d5 f#5 - a5 - | g5 - - - e5 - b4 - | c5 - . c5 e5 - a5 - | a5 - f#5 - d5 - a4 - | b4 - d5 - e5 - g5 - | a5 - - - f#5 - - -' } },
    form: [['A'], ['B', null, { dr: 'b' }], ['A', { harm: 1, dr: 'b' }], ['B', { dr: 'b', fill: 1 }]], loopTo: 0,
    bass: { a: [[0, 'r', 1], [2, '8', 1, 0.7], [4, 'r', 1], [6, '8', 1, 0.7], [8, 'r', 1], [10, '8', 1, 0.7], [12, '5', 1, 0.8], [14, '8', 1, 0.7]] },
    comp: { a: [[2, 1, 0.6], [6, 1, 0.6], [10, 1, 0.6], [14, 1, 0.6]] },
    drums: { a: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, b: { k: 'x.....x.x.......', s: '....x.......x.x.', h: 'xoxoxoxoxoxoxoxo' } },
    fill: { s: '........x.xxx.xx' } },

  fest: { name: ['첫 잔치', 'First Festival'], bpm: 116, key: 7, swing: 0.12, lead: 'flute', bassI: 'bass', compI: 'keys', echo: 0.14, lv: 1.05,
    sec: {
      A: { ch: 'G G C G Em C D G',
        mel: 'd5 - e5 d5 b4 - a4 - | g4 - a4 b4 d5 - - - | e5 - g5 e5 d5 - e5 - | d5 - b4 - g4 - - - | e5 - - g5 e5 - d5 - | e5 - g5 - a5 - g5 - | a5 - - - d5 - e5 - | g4 - - - . . d5 e5' },
      B: { ch: 'C G Em D C G Am7,D G', cp: 'b',
        mel: 'g5 - - - e5 - g5 - | d5 - - - b4 - d5 - | e5 - d5 - b4 - g4 - | a4 - - - . . a4 b4 | e5 - g5 - a5 - g5 - | d5 - b4 - d5 - e5 - | e5 - - - d5 - b4 a4 | g4 - - - . . . .' } },
    form: [['A'], ['B'], ['A', { harm: 1, dr: 'b' }], ['B', { dr: 'b', fill: 1 }]], loopTo: 0,
    bass: { a: [[0, 'r', 3], [4, '5', 2, 0.75], [8, 'r', 3, 0.9], [12, '5', 2, 0.75], [14, '8', 2, 0.6]] },
    comp: { a: [[4, 2, 0.6], [12, 2, 0.6]], b: [[2, 1, 0.55], [6, 1, 0.55], [10, 1, 0.55], [14, 1, 0.55]] },
    drums: { a: { b: 'x.....x.x.......', g: '...o.......o....', d: '....x.o.....x.o.' }, b: { b: 'x.....x.x.....x.', g: '...o.......o....', d: '..o...o...o...o.', w: '....x.......x...' } },
    fill: { d: '........x.x.xxxx' } },
};
for (const k in SONGS) SONGS[k].id = k;
// 때·곳 → 곡(같은 곡에 다른 결도 됨) · 곡마다 크기
export const MOODS = { day: ['day'], dusk: ['dusk'], snow: ['dusk', { lead: 'bell', soft: 1 }], night: ['night'], rain: ['rain'], play: ['play'], fest: ['fest'] };
const MLV = { day: 1, dusk: 0.95, snow: 0.9, night: 0.85, rain: 0.9, play: 1, fest: 0.95 };
export function moodOf(s) { return s.fest ? 'fest' : s.play ? 'play' : s.night >= 1 ? 'night' : s.wx === 'rain' ? 'rain' : s.wx === 'snow' ? 'snow' : s.night > 0 ? 'dusk' : 'day'; }
const REGL = { 읍내: 'pluck', 시내: 'epiano', 산: 'flute', 들: 'ocarina', 강: 'marimba', 바다: 'steel', 관광: 'glock' };
const BASE = 0.32;   // 전체 크기 — 낮 곡 RMS ≈ -29dB(꼭대기 ≈ -14dB) · 효과음 '딩'(꼭대기 -14dB · RMS ≈ -20dB)보다 작게 · 자연 소리(바닷가 ≈ -34dB)와 비슷하게

// ───────── 악기(합성 — 소리 하나 = 발진기 1~2 + 크기 봉투) ─────────
//   w = 파형(배음 표) · a 올라감 · d 줄어듦(시간 상수) · s 남는 크기 · r 놓음 · fm = [비율, 깊이, 줄어듦](전자 피아노·종) · vib = [빠르기, 센트, 늦춤] · bend = 반음(스틸 드럼 첫 출렁)
const WAVES = { soft: [1, 0.42, 0.22, 0.12, 0.07, 0.04, 0.02], flute: [1, 0.22, 0.07, 0.03], ocar: [1, 0.06, 0.1, 0.02], mar: [1, 0, 0, 0.3, 0, 0, 0, 0, 0, 0.06],
  steel: [1, 0.55, 0.12, 0.28, 0.06], round: [1, 0.32, 0.12, 0.05], piano: [1, 0.55, 0.28, 0.18, 0.09, 0.07, 0.03, 0.02], bass: [1, 0.45, 0.16, 0.07, 0.03] };
const INST = {
  pluck: { w: 'soft', a: 0.004, d: 0.18, s: 0.3, r: 0.07, lv: 1 }, epiano: { w: 'sine', fm: [1, 1.4, 0.3], a: 0.003, d: 0.5, s: 0.35, r: 0.15, lv: 1.05 },
  flute: { w: 'flute', a: 0.035, d: 0.6, s: 0.8, r: 0.06, vib: [5.2, 14, 0.12], lv: 0.85 }, ocarina: { w: 'ocar', a: 0.025, d: 0.5, s: 0.75, r: 0.05, vib: [5.8, 10, 0.1], lv: 0.9 },
  marimba: { w: 'mar', a: 0.002, d: 0.11, s: 0, r: 0.05, lv: 1.25 }, steel: { w: 'steel', a: 0.003, d: 0.22, s: 0.12, r: 0.1, bend: 0.15, lv: 0.95 },
  glock: { w: 'sine', fm: [4, 0.9, 0.12], a: 0.002, d: 0.35, s: 0, r: 0.1, lv: 0.75 }, bell: { w: 'sine', fm: [3.5, 2, 0.5], a: 0.002, d: 0.9, s: 0, r: 0.4, lv: 0.85 },
  piano: { w: 'piano', a: 0.003, d: 0.45, s: 0.12, r: 0.2, lv: 0.85 }, bass: { w: 'bass', a: 0.005, d: 0.25, s: 0.55, r: 0.05, lv: 1 },
  sub: { w: 'round', a: 0.02, d: 0.9, s: 0.6, r: 0.15, lv: 0.85 }, keys: { w: 'piano', a: 0.004, d: 0.2, s: 0.25, r: 0.06, lv: 1 },
  pad: { w: 'triangle', a: 0.18, d: 1.4, s: 0.75, r: 0.35, lv: 0.75 } };
const PART = { lead: 0.16, bass: 0.2, ch1: 0.075, ch2: 0.075 };
const DCH = { k: 'dk', s: 'dk', r: 'dk', b: 'dk', g: 'dk', h: 'dh', o: 'dh', z: 'dh', d: 'dh', w: 'dh' };
const DLV = { k: 0.32, s: 0.16, r: 0.1, h: 0.055, o: 0.045, z: 0.05, b: 0.28, g: 0.16, d: 0.12, w: 0.035 };

// ───────── 곡 → 마디별 사건(처음 쓸 때 한 번 · 바퀴 짝·홀 따로) ─────────
function parseMel(str, n) { const bars = str ? str.split('|') : [], out = [], bad = [];
  for (let b = 0; b < n; b++) { const ev = [], tk = (bars[b] || '').trim().split(/\s+/).filter(Boolean); let cur = null;
    if (str && tk.length !== 8) bad.push(b + 1);
    tk.forEach((t, i) => { const sub = t.split('/');
      sub.forEach((u, j) => { const s = i * 2 + j, w = sub.length === 1 ? 2 : 1;
        if (u === '-') { if (cur) cur[2] += w; } else if (u === '.') cur = null; else { const m = midiOf(u); if (m == null) { bad.push(b + 1 + ':' + u); cur = null; return; } cur = [s, m, w]; ev.push(cur); } }); });
    out.push(ev); }
  return { out, bad }; }
function shell(c) { const iv = c.iv, t = [iv[1], iv[iv.length >= 4 ? 3 : 2]].map((x) => into(c.r + x, 57)); return t.sort((a, b) => a - b); }
function bassNote(c, d, nr) { const B = into(c.r, 40); if (d === 'r') return B; if (d === '5') return B + 7 > 52 ? B - 5 : B + 7; if (d === '8') return B + 12; if (d === '3') return B + c.iv[1]; const N = into(nr, 40); return d === 'a' ? (N - 1 >= 39 ? N - 1 : N + 1) : B; }
function arpNote(c, k) { const R = into(c.r, 48), iv = c.iv; return [R, R + iv[2], R + 12, R + 12 + iv[1], R + 12 + (iv[3] || iv[2])][k % 5]; }
function below(m, key) { const sc = [0, 2, 4, 5, 7, 9, 11].map((x) => (key + x) % 12), i = sc.indexOf(m % 12); if (i < 0) return null; return m - (((m % 12) - sc[(i + 5) % 7] + 12) % 12); }
function section(song, fi, odd) {
  const key = fi + ':' + odd, C0 = song._c || (song._c = {}); if (C0[key]) return C0[key];
  const fe = song.form[fi], S = song.sec[fe[0]], v = Object.assign({}, S, fe[1] || {}, odd ? fe[2] || {} : {});
  const chs = S.ch.trim().split(/\s+/).map((tok) => tok.split(',').map(chordOf)), { out: mel, bad } = parseMel(S.mel, chs.length), bars = [];
  for (let b = 0; b < chs.length; b++) {
    const at = new Array(16), put = (s, e) => (at[s] || (at[s] = [])).push(e), C = (s) => chs[b][s < 8 || chs[b].length < 2 ? 0 : 1], nr = chs[(b + 1) % chs.length][0].r;
    for (const [s, m, l] of mel[b]) { put(s, { c: 'lead', m, l, v: s % 4 === 0 ? 1 : 0.86 }); if (v.harm) { const h = below(m, song.key); if (h != null) put(s, { c: 'ch2', m: h, l, v: 0.55, i: 1 }); } }
    for (const [s, d, l, vv = 0.85] of song.bass[v.bs || 'a'] || song.bass.a) put(s, { c: 'bass', m: bassNote(C(s), d, nr), l, v: vv });
    const cp = song.comp[v.cp || 'a'] || song.comp.a;
    if (song.arp) for (const [s, k, l] of cp) put(s, { c: 'ch1', m: arpNote(C(s), k), l, v: s % 4 === 0 ? 0.75 : 0.55 });
    else for (const [s, l, vv] of cp) { const sh = shell(C(s)); put(s, { c: 'ch1', m: sh[1], l, v: vv }); if (!v.harm) put(s, { c: 'ch2', m: sh[0], l, v: vv }); }
    let rows = song.drums[v.dr || 'a'] || song.drums.a || {};
    if (v.fill && song.fill && b === chs.length - 1) { rows = { ...rows }; const fch = new Set(Object.keys(song.fill).map((k) => DCH[k]));
      for (const k in rows) if (fch.has(DCH[k])) rows[k] = rows[k].slice(0, 8) + '........';
      for (const k in song.fill) rows[k] = (rows[k] || '................').slice(0, 8) + song.fill[k].slice(8); }
    for (const k in rows) for (let s = 0; s < 16; s++) { const x = rows[k][s]; if (x === 'x' || x === 'o') put(s, { c: DCH[k], d: k, v: x === 'x' ? 1 : 0.55 }); }
    bars.push({ at }); }
  return (C0[key] = { name: fe[0], bars, v, bad }); }

// 자료 점검(브라우저 없이 node로도): 마디마다 8칸 · 음 이름 · 화음 이름 · 소리 칸 수(6 이하)
export function check() { const out = [];
  for (const id in SONGS) { const S = SONGS[id], slots = (c) => (S.poly && S.poly[c]) || 1;
    for (let fi = 0; fi < S.form.length; fi++) for (const odd of [0, 1]) { let sec; try { sec = section(S, fi, odd); } catch (e) { out.push(id + ' ' + fi + ': ' + e.message); continue; }
      if (sec.bad.length) out.push(id + ' ' + sec.name + ': 칸 수·음 이름 ' + sec.bad.join(','));
      const used = new Set(); for (const B of sec.bars) for (const evs of B.at) if (evs) for (const e of evs) used.add(e.c);
      const n = [...used].reduce((a, c) => a + slots(c), 0); if (n > 6) out.push(id + ' ' + sec.name + ': 소리 칸 ' + n + ' > 6'); } }
  return out; }

// ───────── 합성 엔진(실시간·오프라인 같은 길) ─────────
function engine(ac) {
  const E = { ac, n: 0, vmax: 0, decks: [], f: 15000, pt: 0, pc: 0 }, W = {};
  for (const k in WAVES) { const h = WAVES[k], re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); h.forEach((x, i) => { im[i + 1] = x; }); W[k] = ac.createPeriodicWave(re, im); }
  const NZ = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = NZ.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  E.inp = ac.createGain(); E.lp = ac.createBiquadFilter(); E.lp.type = 'lowpass'; E.lp.frequency.value = E.f; E.lp.Q.value = 0.5; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = 0.5;
  E.inp.connect(E.lp); E.lp.connect(hp); hp.connect(ac.destination);   // 낮은 쪽 = 쿵 울림·치우침(DC) 거름 · 높은 쪽 = 실내·비에서 먹먹하게
  E.dl = ac.createDelay(1.5); const fb = ac.createGain(), dlp = ac.createBiquadFilter(); E.dl.delayTime.value = 0.4; fb.gain.value = 0.3; dlp.type = 'lowpass'; dlp.frequency.value = 2600;
  E.dl.connect(dlp); dlp.connect(fb); fb.connect(E.dl); dlp.connect(E.inp);   // 메아리(선율만 보냄 · 점 8분 뒤 · 갈수록 어둡게)
  const pan = (x, to) => { const p = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain(); if (p.pan) p.pan.value = x; p.connect(to); return p; };
  E.deck = (id, opt, T0, fi) => { const song = SONGS[id], sd = 60 / song.bpm / 4, fade = ac.createGain(), send = ac.createGain(); fade.connect(E.inp); send.gain.value = song.echo; send.connect(E.dl);
    const lead = ac.createGain(); lead.connect(fade); lead.connect(send);
    const D = { song, opt: opt || {}, sd, t: T0, s: 0, bi: 0, fi: fi % song.form.length, loop: 0, last: {}, lead: null, leadNext: null, bus: { lead, bass: fade, ch1: pan(-0.28, fade), ch2: pan(0.28, fade), dk: fade, dh: pan(0.18, fade) }, fade, send };
    D.sec = section(song, D.fi, 0); D.lead = D.sec.v.lead || D.opt.lead || (song.lead === 'region' ? 'pluck' : song.lead); E.dl.delayTime.setValueAtTime(Math.min(1.2, sd * 3), T0); E.decks.push(D); return D; };
  // 끊기: 울리는 소리 = 12ms에 걸쳐 0으로 · 아직 시작 전인 소리(곡을 바꿀 때) = 처음부터 0(기본 크기 1로 '톡' 나지 않게)
  const cut = (vv, t) => { if (!vv || vv.t1 <= t) return; const p = vv.g.gain, pre = vv.t0 >= t;
    try { if (pre) { p.cancelScheduledValues(0); p.setValueAtTime(0, 0); } else { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); p.setTargetAtTime(0, t, 0.012); } } catch (e) { /* 이미 끝 */ }
    for (const s of vv.src) try { s.stop(Math.max(t, vv.t0) + 0.08); } catch (e) { /* 이미 멈춤 */ } vv.t1 = pre ? t : t + 0.08; };
  // 갈래(ch)마다 칸(poly) — 새 소리가 들어오면 가장 오래된 칸을 짧게 끊음 → 동시에 울리는 수가 칸 수를 넘지 않음
  const slot = (D, ch, t) => { const n = (D.song.poly && D.song.poly[ch]) || 1, L = D.last[ch] || (D.last[ch] = []); let k = 0;
    if (L.length >= n) { for (let i = 1; i < L.length; i++) if (L[i].t0 < L[k].t0) k = i; cut(L[k], t); } else k = L.length;
    let c = 1; for (const DD of E.decks) for (const c9 in DD.last) for (const vv of DD.last[c9]) if (vv && vv.t1 > t + 0.06 && !(DD === D && c9 === ch && vv === L[k])) c++;
    if (c > E.vmax) E.vmax = c; E.n++; return (vv) => { L[k] = vv; }; };
  function note(D, ch, iname, m, t, dur, v) {
    const I = INST[iname] || INST.pluck, f = 440 * Math.pow(2, (m - 69) / 12), g = ac.createGain(), o1 = ac.createOscillator(), src = [o1], keep = slot(D, ch, t);
    if (W[I.w]) o1.setPeriodicWave(W[I.w]); else o1.type = I.w;
    o1.frequency.setValueAtTime(I.bend ? f * Math.pow(2, I.bend / 12) : f, t); if (I.bend) o1.frequency.exponentialRampToValueAtTime(f, t + 0.05);
    if (I.fm) { const mo = ac.createOscillator(), mg = ac.createGain(); mo.frequency.value = f * I.fm[0]; mg.gain.setValueAtTime(f * I.fm[1], t); mg.gain.setTargetAtTime(f * I.fm[1] * 0.08, t, I.fm[2]); mo.connect(mg); mg.connect(o1.frequency); src.push(mo); }
    if (I.vib) { const lo = ac.createOscillator(), lg = ac.createGain(); lo.frequency.value = I.vib[0]; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + I.vib[2]); lg.gain.linearRampToValueAtTime(I.vib[1], t + I.vib[2] + 0.2); lo.connect(lg); lg.connect(o1.detune); src.push(lo); }
    const pk = v * I.lv; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + I.a); g.gain.setTargetAtTime(pk * I.s, t + I.a, I.d);
    let t1; if (I.s === 0) t1 = t + I.a + Math.min(4, I.d * 5); else { const rel = t + Math.max(I.a + 0.02, dur * 0.92); g.gain.setTargetAtTime(0, rel, I.r); t1 = rel + I.r * 5; }
    o1.connect(g); g.connect(D.bus[ch]); for (const s of src) { s.start(t); s.stop(t1 + 0.02); } keep({ g, src, t0: t, t1 }); }
  function drum(D, ch, k, t, v) {
    const g = ac.createGain(), src = [], keep = slot(D, ch, t); let t1 = t + 0.3;
    const noise = (type, f, q) => { const n = ac.createBufferSource(), fl = ac.createBiquadFilter(); n.buffer = NZ; fl.type = type; fl.frequency.value = f; fl.Q.value = q; n.connect(fl); fl.connect(g); src.push(n); };
    const tone = (f0, f1, dt, type) => { const o = ac.createOscillator(); if (type) o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dt); o.connect(g); src.push(o); };
    const env = (a, tc) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * DLV[k], t + a); g.gain.setTargetAtTime(0, t + a, tc); t1 = t + a + tc * 6; };
    if (k === 'k') { tone(165, 52, 0.11); env(0.003, 0.075); } else if (k === 's') { noise('bandpass', 1900, 0.9); env(0.002, 0.045); } else if (k === 'r') { tone(830, 0, 0, 'triangle'); env(0.001, 0.025); }
    else if (k === 'h') { noise('highpass', 7600, 0.7); env(0.001, 0.018); } else if (k === 'o') { noise('highpass', 7000, 0.6); env(0.002, 0.11); } else if (k === 'z') { noise('bandpass', 5600, 1.3); env(0.012, 0.03); }
    else if (k === 'b') { tone(96, 58, 0.18); noise('lowpass', 400, 0.7); env(0.004, 0.13); } else if (k === 'g') { tone(185, 128, 0.1); env(0.003, 0.09); } else if (k === 'd') { noise('bandpass', 2700, 1.6); env(0.001, 0.03); }
    else if (k === 'w') { tone(1320, 0, 0); tone(1987, 0, 0); env(0.001, 0.05); }
    g.connect(D.bus[ch]); for (const s of src) { if (s.buffer) s.start(t, Math.random() * 0.5); else s.start(t); s.stop(t1 + 0.02); } keep({ g, src, t0: t, t1 }); }
  // 16분 한 칸 = 그 칸 사건을 예약하고 앞으로(마디 첫 칸 = 선율 악기 정함 · 부분이 끝나면 다음 부분 · 곡 끝 = loopTo로)
  E.step = (D, fire) => {
    if (D.s === 0) D.lead = D.sec.v.lead || D.opt.lead || D.leadNext || (D.song.lead === 'region' ? 'pluck' : D.song.lead);
    const evs = D.sec.bars[D.bi].at[D.s];
    if (fire && evs) { const t = D.t + (D.s % 4 === 2 ? D.song.swing * D.sd : 0);
      for (const e of evs) { if (e.d) { if (!(D.opt.soft && e.c === 'dk')) drum(D, e.c, e.d, t + (Math.random() - 0.5) * 0.004, e.v); continue; }
        const inst = e.c === 'lead' || e.i ? D.lead : e.c === 'bass' ? D.song.bassI : D.song.compI;
        note(D, e.c, inst, e.m, t + (Math.random() - 0.5) * 0.008, e.l * D.sd, e.v * (e.i ? PART.lead : PART[e.c]) * (0.96 + Math.random() * 0.08)); } }
    D.t += D.sd; if (++D.s === 16) { D.s = 0; if (++D.bi >= D.sec.bars.length) { D.bi = 0; if (++D.fi >= D.song.form.length) { D.fi = D.song.loopTo || 0; D.loop++; } D.sec = section(D.song, D.fi, D.loop & 1); } } };
  // 곡 바꾸기: 옛 곡은 지금부터 줄어들고(≈1초 · 끝엔 6%) 새 곡이 시작하기 0.1초 전에 남은 소리를 끊음 → 두 곡이 겹쳐 울리지 않음(동시 소리 6 이하 그대로)
  E.fadeOut = (D, now, T0) => { try { D.fade.gain.setTargetAtTime(0, now, 0.33); D.send.gain.setTargetAtTime(0, now, 0.33); } catch (e) { /* */ } for (const c in D.last) for (const vv of D.last[c]) cut(vv, Math.max(now, T0 - 0.1));
    D.drop = T0 + 0.5; };
  E.sweep = (now) => { for (let i = E.decks.length - 1; i >= 0; i--) { const D = E.decks[i]; if (D.drop && now > D.drop) { E.decks.splice(i, 1); try { D.fade.disconnect(); D.send.disconnect(); for (const k in D.bus) D.bus[k].disconnect(); } catch (e) { /* */ } } } };
  return E; }

// ───────── 마을에서 쓰는 것 ─────────
//   o.state() → { night, wx, ins, play, sleep, fest, reg } (0.4초마다 한 번 · 읽기만) · o.muted() → 설정 '모든 소리 끄기'
export function createMusic(o = {}) {
  const W9 = typeof window !== 'undefined' ? window : {}, promo = !!W9.SM_PROMO, KEY = promo ? 'twn-music-p' : 'twn-music', LOOK = 1.0, TICK = 400;
  let on = !promo; try { const s = localStorage.getItem(KEY); if (s === '0') on = false; else if (s === '1') on = true; } catch (e) { /* 저장 막힘 = 기본값 */ }
  let E = null, D = null, tm = 0, dead = false, mood = '', pend = '', pendN = 0, st = {}, lvl = -1, sw = 0, first = true; const memo = {};
  const muted = () => !!(o.muted && o.muted());
  function init() { if (E || dead || !on || muted() || document.hidden) return;
    try { const AC = W9.AudioContext || W9.webkitAudioContext; if (!AC) return; let ac; try { ac = new AC({ latencyHint: 'playback' }); } catch (e) { ac = new AC(); }   // 'playback' = 버퍼를 크게(크롬북 CPU ↓)
      E = engine(ac); E.inp.gain.value = 0; if (ac.state === 'suspended') ac.resume(); } catch (e) { E = null; return; }
    mood = ''; lvl = -1; first = true; run(); }
  function run() { if (!tm && E) { tm = setInterval(pump, TICK); pump(); } }
  function halt() { if (tm) { clearInterval(tm); tm = 0; } }
  function off(fast) { halt(); if (!E) return; const e = E; E = null; D = null; mood = ''; try { const n = e.ac.currentTime; e.inp.gain.cancelScheduledValues(n); e.inp.gain.setTargetAtTime(0, n, 0.1); } catch (x) { /* */ }
    setTimeout(() => { try { e.ac.close(); } catch (x) { /* 이미 닫힘 */ } }, fast ? 0 : 600); }
  function go(m, now) { const [sid, opt] = MOODS[m]; mood = m; sw++;
    if (D && D.song.id === sid) { D.opt = opt || {}; return; }   // 해 질 녘 ↔ 눈 = 같은 곡, 결만(다음 마디부터)
    const T0 = D ? Math.max(now + LOOK, D.t) : now + 0.12;
    if (D) { memo[D.song.id] = D.fi; E.fadeOut(D, now, T0); }
    D = E.deck(sid, opt, T0, memo[sid] || 0); D.fade.gain.setValueAtTime(0, T0); D.fade.gain.linearRampToValueAtTime(1, T0 + (first ? 2 : 1)); first = false; }
  function mix(now) { const k = (MLV[mood] || 1) * (st.ins ? 0.5 : 1) * (st.sleep ? 0.3 : 1), f = st.ins ? 1500 : mood === 'rain' ? 4200 : 15000;
    if (k !== lvl) { lvl = k; E.inp.gain.setTargetAtTime(BASE * k, now, 0.4); } if (f !== E.f) { E.f = f; E.lp.frequency.setTargetAtTime(f, now, 0.35); } }
  function pump() { if (!E || dead) return; const ac = E.ac; if (ac.state !== 'running') return; const now = ac.currentTime, p0 = performance.now();
    try { st = (o.state && o.state()) || {}; } catch (e) { st = {}; }
    const want = moodOf(st); if (want !== pend) { pend = want; pendN = 0; } if (want !== mood && (++pendN >= 3 || !D)) go(want, now);   // 0.8초 넘게 그대로일 때만 바꿈(문 앞 들락날락에 흔들리지 않게)
    mix(now); E.sweep(now); if (!D) return;
    if (D.song.lead === 'region') D.leadNext = REGL[st.reg] || 'pluck';
    while (D.t < now - 0.05) E.step(D, false);   // 밀린 칸(멈췄다 깨어남)은 소리 없이 건너뜀
    while (D.t < now + LOOK) E.step(D, true); E.pt += performance.now() - p0; E.pc++; }
  const wake = () => { if (!on || dead || muted()) return; if (!E) init(); else if (E.ac.state !== 'running' && E.ac.state !== 'closed' && !document.hidden) { E.ac.resume(); run(); } };   /* 아이폰 = 'interrupted'도 깨움 */
  const vis = () => { if (!E) return; if (document.hidden) { halt(); try { E.ac.suspend(); } catch (e) { /* */ } } else { try { E.ac.resume().then(run, run); } catch (e) { run(); } } };
  const onSet = () => { if (muted()) off(); else wake(); };
  const EVS = ['touchend', 'pointerup', 'click', 'keydown'];
  for (const k of EVS) addEventListener(k, wake, { capture: true, passive: true });
  document.addEventListener('visibilitychange', vis); addEventListener('sm-set', onSet);
  if (W9.navigator && navigator.userActivation && navigator.userActivation.hasBeenActive) init();   // 이미 누른 적이 있으면(마을로 들어오는 단추) 바로
  return {
    on: () => on,
    duck(sec = 1.2) { if (!E || lvl < 0) return; const n = E.ac.currentTime, g = E.inp.gain; try { g.cancelScheduledValues(n); g.setTargetAtTime(BASE * lvl * 0.35, n, 0.05); g.setTargetAtTime(BASE * lvl, n + sec, 0.4); } catch (e) { /* */ } },   /* 팡파르·큰 보상 소리 동안 잠깐 작게(부르는 쪽이 고름) */
    set(v) { v = !!v; if (v !== on) { on = v; try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* 저장 막힘 = 이 탭에서만 */ } } if (v) wake(); else off(); return on; },
    info: () => ({ on, promo, muted: muted(), ctx: E ? E.ac.state : null, mood, song: D ? D.song.id : null, title: D ? D.song.name : null, section: D ? D.sec.name : null, bar: D ? D.bi + 1 : 0, loop: D ? D.loop : 0, lead: D ? D.lead : null,
      indoor: !!st.ins, level: E ? +(BASE * Math.max(0, lvl)).toFixed(3) : 0, filter: E ? E.f : 0, notes: E ? E.n : 0, voicesMax: E ? E.vmax : 0, switches: sw, decks: E ? E.decks.length : 0, pumpMs: E && E.pc ? +(E.pt / E.pc).toFixed(3) : 0 }),
    dispose() { dead = true; for (const k of EVS) removeEventListener(k, wake, { capture: true }); document.removeEventListener('visibilitychange', vis); removeEventListener('sm-set', onSet); off(); } };
}

// ───────── 들어 보기용(오프라인 합성 → WAV) — 마을에선 안 씀 ─────────
export async function renderMood(m = 'day', sec = 30, o = {}) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = o.sr || 44100, ac = new OAC(2, Math.ceil(sr * sec), sr), E = engine(ac), [sid, opt] = MOODS[m];
  E.inp.gain.value = BASE * (MLV[m] || 1); if (o.indoor) { E.inp.gain.value *= 0.5; E.lp.frequency.value = 1500; } else if (m === 'rain') E.lp.frequency.value = 4200;
  let D = E.deck(sid, opt, 0.05, o.fi || 0); D.fade.gain.value = 1; D.leadNext = REGL[o.reg] || null;
  if (o.to && MOODS[o.to]) { const at = o.at || sec / 2; while (D.t < at + 1) E.step(D, true);   /* 곡 바꾸기 흉내 = 마을과 같은 길(at초에 바뀜 → 1초 줄고 1초 커짐) */
    const T0 = Math.max(at + 1, D.t), [s2, o2] = MOODS[o.to]; E.fadeOut(D, at, T0); E.inp.gain.setTargetAtTime(BASE * (MLV[o.to] || 1), at, 0.4); D = E.deck(s2, o2, T0, 0); D.fade.gain.setValueAtTime(0, T0); D.fade.gain.linearRampToValueAtTime(1, T0 + 1); D.leadNext = REGL[o.reg] || null; }
  while (D.t < sec) E.step(D, true);
  const buf = await ac.startRendering(); return { buf, notes: E.n, voicesMax: E.vmax };
}
export function toWav(buf) { const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2)), w = (p, s) => { for (let i = 0; i < s.length; i++) out.setUint8(p + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const C = []; for (let c = 0; c < ch; c++) C.push(buf.getChannelData(c)); let p = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, C[c][i])); out.setInt16(p, x < 0 ? x * 0x8000 : x * 0x7fff, true); p += 2; }
  return out.buffer; }
