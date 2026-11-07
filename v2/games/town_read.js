// 📖 읽을 틈(READ-1 · 교사 11-02 "너무 순식간에 지나가서 '1050원이구나 다음 거 가야지' 이런 게 눈에 잘 안 읽혀 · 이 퀘스트 말고도")
//   글 길이 → 머무는 시간 함수 하나(readSec) + 한 줄 자리(가운데 띠 · 위 알림)의 차례 줄(createLineQ) — 마을 모든 띠·알림이 이 둘을 거침(town.js가 map.hud.banner·toast를 감쌈)
//   규칙(4학년 읽기 빠르기): 기본 1.5초 + 한글·숫자 5.5자에 1초(영어 글자는 셋을 한 자로) + 숫자가 있으면 1초 더 · 가장 길어도 12초
//   차례: 앞 글이 '다 읽힐 때'(보호 시간)까지는 새 글이 덮지 않고 줄 섬 · 같은 글은 줄에 하나만 · 줄은 넷까지 · 20초(정보 아닌 글은 8초) 넘게 기다린 글은 버림(그때 일이 아닌 글)
//   정보 글 = 부른 쪽이 info로 알림(이야기 띠) 또는 infoOf(수·방위) — 보호 시간은 정보 글만 길게(readSec) · 그 밖은 1.2초(꾸밈 띠가 줄을 막지 않게)
//   cut(알림 칸): 새 글은 바로 뜨고(내가 한 일의 결과가 늦지 않게) 아직 덜 읽힌 정보 글은 줄 맨 앞으로 돌아가 남은 시간만큼 다시 뜸(덮여 사라지지 않게)
//   매 프레임 일 X(글이 올 때와 setTimeout 한 개만) · 새 객체는 글이 올 때만
//   FIX-4A(11-07) 저절로 뜬 안내 띠(info = 'low' — 동네 이름 · 첫 아침 · 잔치까지 ○밤)는 방금 일어난 일의 띠에 자리를 내줌: 그 밖의 띠가 오면 떠 있던 안내 띠는 바로 바뀌고 줄 서 있던 안내 띠는 버림
//     (첫 화면 뒤 안내 띠 셋이 1.2초씩 줄을 막아 아이가 한 일의 띠가 몇 초 늦거나 줄 넘침으로 버려지던 것) · 줄이 넘치면 안내 띠 → 꾸밈 띠 → 정보 띠 차례로 버림(정보 띠를 먼저 버리던 것)
//     창이 떠 있는 동안 온 띠(창 안에서 한 일 — 꾸러미 채움 등)는 창이 닫히자마자 맨 먼저 뜸 · 떠 있던 덜 읽힌 정보 띠는 그 뒤에 남은 시간만큼 다시(알림 칸 cut과 같은 꼴)

const isHan = c => c >= 0xac00 && c <= 0xd7a3, isDig = c => c >= 0x30 && c <= 0x39, isLat = c => (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
export function readN(t) { let n = 0, e = 0; for (const ch of String(t || '')) { const c = ch.codePointAt(0); if (isHan(c) || isDig(c)) n++; else if (isLat(c)) e++; } return n + e / 3; }
export const READ_MAX = 12;
export function readSec(t) { const s = String(t || ''); return Math.min(READ_MAX, 1.5 + readN(s) / 5.5 + (/\d/.test(s) ? 1 : 0)); }
// 다음 판단에 쓰는 정보가 든 글(수 · 방위 · 화살표) — 알림 칸은 이런 글만 다 읽힐 때까지 지킴(그 밖의 알림은 1.5초 — 내가 한 일의 결과가 늦게 뜨지 않게)
export const infoOf = t => /\d|[동서남북]쪽|→|\b(north|south|east|west)\b/i.test(String(t || ''));

// o = { show(t, sec) 진짜로 띄우기, vis() 지금 그 자리에 글이 보이나, hold() 지금은 띄우지 말고 기다릴 때(창이 덮음 등), protect(t, dur, info) 덮지 않는 초, cut, cap 줄 길이, maxAge·maxAge2 기다림 한도(정보·그 밖 ms) } · put(t, sec, info)
export function createLineQ(o) {
  const Q = [], st = { put: 0, now: 0, wait: 0, drop: 0, same: 0, back: 0 }; let cur = null, h = 0;
  const T = () => performance.now(), held = () => !!(o.hold && o.hold());
  const curLeft = n => { if (!cur) return 0; if (!o.vis()) { cur = null; return 0; } return Math.max(0, cur.t0 + cur.min - n); };
  function show(q, n) { cur = { t: q.t, t0: n, min: q.min, end: n + q.dur * 1000, info: q.info, low: !!q.low }; o.show(q.t, q.dur); }
  function trim() { while (Q.length > (o.cap || 4)) { let k = Q.findIndex(q9 => q9.low); if (k < 0) k = Q.findIndex(q9 => !q9.info); if (k < 0) k = 0; Q.splice(k, 1); st.drop++; } }   /* 넘치면 안내 띠 → 꾸밈 띠 → (그래도 넘치면) 가장 오래된 것 */
  function back(n) { const lf = curLeft(n); if (!cur || lf < 500 || !cur.info || Q.some(q => q.t === cur.t)) return; Q.unshift({ t: cur.t, dur: Math.max(lf, cur.end - n) / 1000, min: lf, at: n, info: cur.info }); st.back++; while (Q.length > (o.cap || 4)) { Q.pop(); st.drop++; } }   /* cut: 덜 읽힌 글을 줄 맨 앞에(남은 시간만큼) */
  function arm(ms) { if (h) clearTimeout(h); h = setTimeout(pump, Math.max(60, ms)); }
  function pump() { h = 0; const n = T(); while (Q.length && n - Q[0].at > (Q[0].info ? (o.maxAge || 20000) : (o.maxAge2 || 8000))) { Q.shift(); st.drop++; } if (!Q.length) return; if (held()) { arm(400); return; }
    { const k = Q.findIndex(q9 => q9.hw); if (k >= 0) { const q = Q.splice(k, 1)[0]; for (const q9 of Q) q9.hw = 0; back(n); st.now++; show(q, n); if (Q.length) arm(cur.min + 40); return; } }   /* FIX-4A: 창 안에서 한 일의 띠 = 창이 닫히자마자 맨 먼저(덜 읽힌 정보 띠는 그 뒤 남은 시간만큼 다시 — 꾸러미를 채우고 창을 닫았는데 앞 요리 띠가 10초 넘게 남던 것) */
    const w = cur && cur.low && !Q[0].low ? 0 : curLeft(n); if (w > 0) { arm(w + 40); return; } show(Q.shift(), n); if (Q.length) arm(cur.min + 40); }
  function put(t, sec, info) { if (t == null || t === '') return; t = String(t); const low = info === 'low'; info = !low && (!!info || infoOf(t)); const n = T(), dur = Math.max(+sec || 0, readSec(t)), min = Math.min(dur, o.protect ? o.protect(t, dur, info) : readSec(t)) * 1000; st.put++;
    if (cur && cur.t === t && n < cur.end && o.vis()) { st.same++; show({ t, dur, min, info }, n); return; }   /* 같은 글이 떠 있으면 시계만 새로 */
    if (Q.some(q => q.t === t)) { st.same++; return; }
    const q = { t, dur, min, at: n, info, low, hw: held() ? 1 : 0 };   /* hw = 창이 떠 있는 동안 온 띠(창 안에서 한 일) */
    if (!low) for (let k = Q.length - 1; k >= 0; k--) if (Q[k].low) { Q.splice(k, 1); st.drop++; }   /* FIX-4A: 줄 서 있던 안내 띠는 방금 일의 띠가 오면 버림(그때 일이 지난 안내) */
    if (o.cut && !held()) { back(n); st.now++; show(q, n); if (Q.length) arm(min + 40); return; }
    const ahead = info ? Q.filter(q9 => q9.info).length : Q.length;   /* 정보 글은 꾸밈 글 앞으로(꾸밈 글이 정보 글을 막지 않게) */
    if (!ahead && !held() && (curLeft(n) <= 0 || (info && cur && !cur.info) || (!low && cur && cur.low))) { st.now++; show(q, n); if (Q.length) arm(min + 40); return; }   /* 떠 있는 안내 띠는 방금 일의 띠가 바로 덮음 */
    if (info) { const k = Q.findIndex(q9 => !q9.info); if (k >= 0) Q.splice(k, 0, q); else Q.push(q); } else Q.push(q); st.wait++; trim(); if (!h) arm(held() ? 400 : curLeft(n) + 40); }
  // left = 줄이 다 비고 마지막 글이 다 읽힐 때까지 남은 ms(이야기가 다음 단계·창을 이만큼 미룸)
  const left = () => { const n = T(); return curLeft(n) + Q.reduce((a, q) => a + q.min, 0); };
  return { put, left, busy: () => left() > 0, stat: () => ({ ...st, q: Q.length, cur: cur ? cur.t : '', left: Math.round(left()) }), clear() { Q.length = 0; if (h) clearTimeout(h); h = 0; cur = null; } };
}
