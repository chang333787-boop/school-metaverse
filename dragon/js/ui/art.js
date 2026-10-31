// 손그림 그림 — 얼굴(말풍선) · 물건 아이콘 · 키 그림 · 하는 법 그림(SVG 글) · 영화 그림을 따라 그리지 않고 알아볼 신호만(goal §2-2)
// 잉크 #2b2118 · 종이 #f4ead2 · 그라데이션·빛 번짐 없음(AI 슬롭 X)
const INK = '#2b2118';
const svg = (vb, body, cls = '') => `<svg class="${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const eyes = (y = 33, dx = 9, r = 2.2) => `<circle cx="${32 - dx}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/><circle cx="${32 + dx}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>`;
const head = (rx = 17, ry = 19, skin = '#f0c9a8') => `<ellipse cx="32" cy="35" rx="${rx}" ry="${ry}" fill="${skin}"/>`;
const horns = `<path d="M14 24 C6 20 6 10 10 6 C12 14 15 18 20 20" fill="#e8dcc0"/><path d="M50 24 C58 20 58 10 54 6 C52 14 49 18 44 20" fill="#e8dcc0"/>`;
const helm = (c = '#8d8a82') => `<path d="M14 27 C14 12 50 12 50 27 Z" fill="${c}"/><path d="M14 27 L50 27"/>`;

/* 얼굴 — 사람은 머리 모양·머리카락·수염·투구로, 투슬리스는 귀 판·초록 눈으로 */
export const FACES = {
  hiccup: () => svg('0 0 64 64', `${head(15, 18)}<path d="M15 30 C12 14 22 9 30 12 C34 6 46 8 48 16 C52 18 51 26 49 30 C44 22 38 20 32 22 C26 18 20 22 15 30 Z" fill="#8a4a22"/>${eyes(35, 7, 2)}<path d="M30 42 Q32 44 34 42"/><path d="M28 47 Q32 50 36 47"/><circle cx="22" cy="40" r="0.8" fill="#a0603a" stroke="none"/><circle cx="42" cy="40" r="0.8" fill="#a0603a" stroke="none"/>`),
  toothless: (o = {}) => { const p = o.pupil ?? 1, w = 1 + p * 3.2; return svg('0 0 64 64', `<path d="M10 30 C6 18 14 14 18 22 M54 30 C58 18 50 14 46 22" fill="#2a2d33"/><path d="M8 26 C2 22 4 14 9 15 M56 26 C62 22 60 14 55 15" fill="#2a2d33"/><ellipse cx="32" cy="36" rx="22" ry="18" fill="#2a2d33"/><ellipse cx="22" cy="33" rx="7" ry="6" fill="#a6e05a"/><ellipse cx="42" cy="33" rx="7" ry="6" fill="#a6e05a"/><ellipse cx="22" cy="33" rx="${w * 0.5}" ry="5" fill="${INK}" stroke="none"/><ellipse cx="42" cy="33" rx="${w * 0.5}" ry="5" fill="${INK}" stroke="none"/><circle cx="28" cy="46" r="1" fill="#11131a" stroke="none"/><circle cx="36" cy="46" r="1" fill="#11131a" stroke="none"/>${o.smile ? '<path d="M22 50 Q32 56 42 50" stroke="#c97a8a"/>' : ''}`); },
  stoick: () => svg('0 0 64 64', `${head(18, 18)}${horns}${helm()}${eyes(33, 8)}<path d="M18 29 L26 31 M46 29 L38 31" stroke-width="3"/><path d="M13 36 C12 58 24 62 32 62 C40 62 52 58 51 36 C46 42 40 40 32 44 C24 40 18 42 13 36 Z" fill="#a83e1e"/><path d="M27 40 C29 38 35 38 37 40" fill="#a83e1e"/>`),
  gobber: () => svg('0 0 64 64', `${head(17, 18)}${horns}${helm('#7a776e')}${eyes(33, 8)}<ellipse cx="32" cy="40" rx="5" ry="4" fill="#e8b494"/><path d="M26 45 C20 46 18 54 20 60 M38 45 C44 46 46 54 44 60" stroke="#d9b45a" stroke-width="4"/><path d="M28 49 L36 49"/><rect x="31" y="49" width="3" height="3" fill="#f4ead2"/>`),
  astrid: () => svg('0 0 64 64', `${head(15, 18)}<path d="M15 32 C12 12 52 10 49 32 C46 22 40 18 32 20 C24 18 18 24 15 32 Z" fill="#e6c464"/><path d="M15 24 C24 20 40 20 49 24" stroke="#3f2f28" stroke-width="3"/><path d="M48 30 C56 38 54 50 50 58" stroke="#e6c464" stroke-width="5"/>${eyes(35, 7, 2)}<path d="M23 30 L29 31 M41 30 L35 31"/><path d="M28 46 L36 46"/>`),
  fishlegs: () => svg('0 0 64 64', `${head(20, 18)}${helm('#9a8f78')}<path d="M22 14 L22 9 M42 14 L42 9"/>${eyes(35, 9, 2)}<path d="M26 45 Q32 49 38 45"/><path d="M14 34 C12 40 14 44 18 46 M50 34 C52 40 50 44 46 46" stroke="#d8b864" stroke-width="3"/>`),
  snotlout: () => svg('0 0 64 64', `${head(17, 18)}${helm('#5a5650')}<path d="M14 24 C4 24 4 34 12 34 C16 34 16 28 12 28" stroke-width="3" fill="#cfc4a8"/><path d="M50 24 C60 24 60 34 52 34 C48 34 48 28 52 28" stroke-width="3" fill="#cfc4a8"/>${eyes(35, 8)}<path d="M24 31 L29 30 M40 31 L35 30"/><path d="M26 45 Q34 48 39 43"/>`),
  twins: () => svg('0 0 64 64', `${head(16, 18)}<path d="M15 30 C8 40 10 56 14 60 M49 30 C56 40 54 56 50 60" stroke="#e8d070" stroke-width="5"/>${helm('#8a8270')}<path d="M18 18 L12 6 M26 15 L24 4 M38 15 L40 4 M46 18 L52 6" stroke-width="3"/>${eyes(35, 7)}<path d="M26 46 Q32 44 38 47"/>`),
  villager: () => svg('0 0 64 64', `${head(17, 18)}${helm('#8d8a82')}${eyes(34, 8)}<path d="M14 38 C14 56 24 60 32 60 C40 60 50 56 50 38 C44 44 38 42 32 46 C26 42 20 44 14 38 Z" fill="#6a4a2e"/>`),
};

/* 물건 아이콘 32×32 */
export const ICONS = {
  cod: svg('0 0 32 32', `<path d="M4 16 C10 8 20 8 26 16 C20 24 10 24 4 16 Z" fill="#b7c2bf"/><path d="M26 16 L31 11 L31 21 Z" fill="#b7c2bf"/><circle cx="9" cy="15" r="1.2" fill="${INK}" stroke="none"/>`),
  salmon: svg('0 0 32 32', `<path d="M4 16 C10 8 20 8 26 16 C20 24 10 24 4 16 Z" fill="#e8a08a"/><path d="M26 16 L31 11 L31 21 Z" fill="#e8a08a"/><circle cx="9" cy="15" r="1.2" fill="${INK}" stroke="none"/>`),
  eel: svg('0 0 32 32', `<path d="M3 20 C8 10 12 26 17 16 C21 8 25 22 29 12" stroke="#5a6a3a" stroke-width="4"/><circle cx="29" cy="12" r="1" fill="${INK}" stroke="none"/>`),
  knife: svg('0 0 32 32', `<path d="M6 26 L20 12 L26 6 L24 14 L10 28 Z" fill="#cfd4d6"/><path d="M5 27 L9 23" stroke-width="4" stroke="#6a4a2e"/>`),
  shield: svg('0 0 32 32', `<circle cx="16" cy="16" r="12" fill="#a2763e"/><circle cx="16" cy="16" r="3.5" fill="#9a9a96"/><path d="M16 4 L16 28 M4 16 L28 16" stroke="#6a4a2e"/>`),
  torch: svg('0 0 32 32', `<path d="M15 30 L17 14" stroke="#6a4a2e" stroke-width="3"/><path d="M16 14 C10 10 14 4 16 2 C18 6 22 9 16 14 Z" fill="#f2a63a"/>`),
  oil: svg('0 0 32 32', `<path d="M10 12 C6 14 6 28 16 28 C26 28 26 14 22 12 Z" fill="#9a6a3a"/><path d="M12 12 L12 7 L20 7 L20 12"/><path d="M20 9 L26 7"/>`),
  book: svg('0 0 32 32', `<path d="M4 7 L16 9 L28 7 L28 26 L16 28 L4 26 Z" fill="#8a5a32"/><path d="M16 9 L16 28"/><path d="M8 13 L13 14 M19 14 L24 13"/>`),
  rope: svg('0 0 32 32', `<path d="M4 20 C10 10 14 26 20 16 C24 10 28 14 28 18" stroke="#b08a5a" stroke-width="3"/>`),
  fin: svg('0 0 32 32', `<path d="M6 8 C16 6 26 12 28 22 C20 20 18 26 10 26 C14 20 8 14 6 8 Z" fill="#2a2d33"/><path d="M12 14 L22 20" stroke="#55585e"/>`),
  finNew: svg('0 0 32 32', `<path d="M6 8 C16 6 26 12 28 22 C20 20 18 26 10 26 C14 20 8 14 6 8 Z" fill="#8a5a32"/><path d="M8 10 L24 22 M10 16 L20 24" stroke="#5a3a20"/>`),
  hammer: svg('0 0 32 32', `<path d="M8 28 L20 14" stroke="#6a4a2e" stroke-width="3"/><path d="M16 8 L26 18 L30 14 L20 4 Z" fill="#8d8a82"/>`),
  bucket: svg('0 0 32 32', `<path d="M7 10 L10 28 L22 28 L25 10 Z" fill="#9a6a3a"/><path d="M7 10 C10 2 22 2 25 10"/><path d="M8 14 C14 16 18 12 24 14" stroke="#5f9ab0" stroke-width="3"/>`),
  nip: svg('0 0 32 32', `<path d="M16 28 C14 18 8 14 6 10 M16 28 C16 18 16 10 16 4 M16 28 C18 18 24 14 26 10" stroke="#3f9a86" stroke-width="3"/>`),
  map: svg('0 0 32 32', `<path d="M4 8 L12 5 L20 8 L28 5 L28 25 L20 28 L12 25 L4 28 Z" fill="#e8dcc0"/><path d="M12 5 L12 25 M20 8 L20 28"/><path d="M22 14 L26 18 M26 14 L22 18" stroke="#a83e1e"/>`),
  saddle: svg('0 0 32 32', `<path d="M4 18 C8 10 24 10 28 18 C24 22 8 22 4 18 Z" fill="#7a4a26"/><path d="M10 20 L10 28 M22 20 L22 28"/>`),
  hand: svg('0 0 32 32', `<path d="M8 26 C4 18 6 12 9 12 L10 18 L10 8 C10 5 14 5 14 8 L14 16 L15 6 C15 3 19 3 19 6 L19 16 L20 8 C20 5 24 5 24 8 L24 20 C24 26 18 29 13 29 Z" fill="#f0c9a8"/>`),
  eye: svg('0 0 32 32', `<path d="M3 16 C10 6 22 6 29 16 C22 26 10 26 3 16 Z" fill="#f4ead2"/><circle cx="16" cy="16" r="5" fill="${INK}" stroke="none"/>`),
  pencil: svg('0 0 32 32', `<path d="M6 26 L8 20 L22 6 L26 10 L12 24 Z" fill="#e6c464"/><path d="M6 26 L10 25 L7 22 Z" fill="${INK}"/>`),
  wind: svg('0 0 32 32', `<path d="M4 12 L20 12 C26 12 26 5 21 6 M4 18 L24 18 C30 18 30 26 24 25 M4 24 L14 24"/>`),
  ship: svg('0 0 32 32', `<path d="M3 20 L29 20 L25 27 L7 27 Z" fill="#8a5a32"/><path d="M16 20 L16 4"/><path d="M16 5 L26 16 L16 16 Z" fill="#e8dcc0"/>`),
  x: svg('0 0 32 32', `<path d="M7 7 L25 25 M25 7 L7 25" stroke="#a83e1e" stroke-width="4"/>`),
  heart: svg('0 0 32 32', `<path d="M16 27 C4 18 4 8 10 7 C13 6 15 8 16 11 C17 8 19 6 22 7 C28 8 28 18 16 27 Z" fill="#c97a6a"/>`),
  helmet: svg('0 0 32 32', `<path d="M5 22 C5 8 27 8 27 22 Z" fill="#8d8a82"/><path d="M5 22 L27 22"/><path d="M6 16 C1 13 2 6 5 4 C6 9 8 12 10 13 M26 16 C31 13 30 6 27 4 C26 9 24 12 22 13" fill="#e8dcc0"/>`),
  cloth: svg('0 0 32 32', `<path d="M5 8 L27 6 L25 26 L7 25 Z" fill="#d8c8a0"/><path d="M9 12 L23 11 M9 17 L22 16 M9 21 L21 21" stroke="#a89470"/>`),
  axe: svg('0 0 32 32', `<path d="M8 28 L22 8" stroke="#6a4a2e" stroke-width="3"/><path d="M18 6 C26 4 30 10 28 16 C24 14 21 12 18 6 Z" fill="#cfd4d6"/>`),
  bola: svg('0 0 32 32', `<circle cx="8" cy="24" r="4" fill="#8d8a82"/><circle cx="24" cy="24" r="4" fill="#8d8a82"/><path d="M8 24 C12 10 20 10 24 24" stroke="#b08a5a"/>`),
  sheep: svg('0 0 32 32', `<ellipse cx="17" cy="17" rx="11" ry="8" fill="#f4f0e6"/><circle cx="7" cy="15" r="4" fill="#3a3430"/><path d="M11 24 L11 28 M22 24 L22 28" stroke-width="3"/>`),
  water: svg('0 0 32 32', `<path d="M16 4 C10 14 8 18 8 21 C8 26 12 29 16 29 C20 29 24 26 24 21 C24 18 22 14 16 4 Z" fill="#7fb0c8"/>`),
};

/* 키 그림 — 글자 하나(또는 짧은 낱말)를 키캡에 */
export function keyCap(label, wide = false) {
  const w = wide ? 74 : 34;
  return `<svg viewBox="0 0 ${w + 4} 38" class="key${wide ? ' wide' : ''}" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="${w}" height="32" rx="7" fill="#f4ead2" stroke="${INK}" stroke-width="2"/><path d="M6 31 L${w - 2} 31" stroke="#c9b894" stroke-width="2"/><text x="${2 + w / 2}" y="23" text-anchor="middle" font-size="${label.length > 2 ? 13 : 17}" font-weight="700" fill="${INK}" font-family="sans-serif">${label}</text></svg>`;
}
const ARROWS = `<span class="keys">${keyCap('W')}${keyCap('A')}${keyCap('S')}${keyCap('D')}</span>`;
/* 하는 법 창 — 동사마다 그림 세 줄(design §1 · 동사마다 한 번만 만듦) · 글은 두세 낱말 */
export const HOWTO = {
  listen:   [[ARROWS, 'walkers', '걸으며 듣기'], [keyCap('F'), ICONS.torch, '가까이서 쓰기'], ['', FACES.stoick(), '말은 걸어도 들려요']],
  track:    [[ARROWS, ICONS.map, '지도와 땅 맞대기'], ['', ICONS.eye, '부러진 나무·파인 땅'], [keyCap('F'), ICONS.fin, '줍기']],
  approach: [[keyCap('Shift', true), 'tiptoe', '살금살금 켜기'], [keyCap('F'), ICONS.cod, '짧게 = 내밀기'], [keyCap('F 꾹', true), ICONS.hand, '길게 = 손 내밀기']],
  hide:     [[keyCap('Shift', true), 'tiptoe', '살금살금'], ['', ICONS.eye, '눈길 밖에 있기'], [ARROWS, 'rock', '바위 뒤로']],
  dodge:    [['', ICONS.eye, '예고를 보고'], [keyCap('Space', true), 'roll', '구르기'], ['', 'wait', '구른 뒤 잠깐 빈틈']],
  throw:    [[keyCap('F 꾹', true), 'aim', '누르는 동안 겨누기'], [ARROWS, 'aim', '방향'], ['', ICONS.bucket, '놓으면 던지기']],
  rhythm:   [['', 'beat', '박자를 보고'], [keyCap('Space', true), ICONS.hammer, '맞춰 누르기'], ['', 'wait', '마구 누르면 엉켜요']],
  fly:      [[ARROWS, ICONS.wind, '몸 기울이기'], [keyCap('Space', true), 'wing', '날갯짓 박자'], [keyCap('1~4', true), ICONS.finNew, '꼬리 자리']],
  flyEasy:  [[ARROWS, ICONS.wind, '방향'], [keyCap('Space 꾹', true), ICONS.finNew, '꼬리 펴서 휙 돌기'], ['', 'wing', '앞으로는 저절로']],
  draw:     [['', 'drag', '끌어서 펜 옮기기'], [keyCap('F 꾹', true), ICONS.pencil, '누르는 동안 그리기'], ['', 'dots', '점을 차례로 잇기']],
};
/* 하는 법 그림에 쓰는 작은 그림(낱말 대신) */
export const PICT = {
  walkers: svg('0 0 32 32', `<circle cx="11" cy="7" r="3"/><path d="M11 10 L11 19 L7 27 M11 19 L15 27 M7 14 L15 14"/><path d="M20 16 L28 16 M24 12 L28 16 L24 20"/>`),
  tiptoe: svg('0 0 32 32', `<circle cx="14" cy="8" r="3"/><path d="M14 11 C12 16 13 18 16 20 L13 28 M16 20 L21 26 M10 15 L19 14"/>`),
  rock: svg('0 0 32 32', `<path d="M3 27 C4 16 10 10 17 11 C24 12 29 18 29 27 Z" fill="#9a958a"/>`),
  roll: svg('0 0 32 32', `<circle cx="16" cy="16" r="9"/><path d="M8 8 C12 3 22 3 26 9 M26 9 L27 4 M26 9 L21 9"/>`),
  wait: svg('0 0 32 32', `<circle cx="16" cy="17" r="11"/><path d="M16 17 L16 10 M16 17 L21 20"/>`),
  aim: svg('0 0 32 32', `<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 2 L16 8 M16 24 L16 30 M2 16 L8 16 M24 16 L30 16"/>`),
  beat: svg('0 0 32 32', `<path d="M3 20 L8 20 L11 8 L15 26 L18 14 L21 20 L29 20"/>`),
  wing: svg('0 0 32 32', `<path d="M4 20 C8 8 18 4 28 6 C22 10 20 14 24 16 C18 16 16 20 18 24 C12 22 8 22 4 20 Z" fill="#2a2d33"/>`),
  drag: svg('0 0 32 32', `<rect x="4" y="8" width="24" height="16" rx="3"/><path d="M12 16 L22 16 M19 13 L22 16 L19 19"/>`),
  dots: svg('0 0 32 32', `<circle cx="5" cy="24" r="2" fill="${INK}"/><circle cx="12" cy="10" r="2" fill="${INK}"/><circle cx="21" cy="18" r="2" fill="${INK}"/><circle cx="28" cy="6" r="2" fill="${INK}"/><path d="M5 24 L12 10 L21 18" stroke-dasharray="2 3"/>`),
};
