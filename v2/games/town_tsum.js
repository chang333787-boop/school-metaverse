// 📋 교사 화면 요약(TEACH-1 · 10-31 '2주 믿게 만들기' 셋째 · 비판 보고서 기준 8 · docs/systems/town_teacher.md)
//   마을 판 하나(GAME.S) → 교사 표 한 줄에 필요한 것만: 지금 장 · 마지막 기록 날 한 일 · 남긴 결과물 · 마지막 저장 시각
//   서버(server/cf-rooms Saves)와 마을(교사 표 · 붙여 넣기 · 이 기기 판)이 같은 함수를 씀 — 가져오는 것 없음(순수 함수)
//   이름·비밀번호·기기 번호는 넣지 않음(판에도 없음) · 아이가 쓴 글은 짧게 자름 · 결과 크기 대략 2KB 아래
export const TSUM_V = 1;
const cut = (v, n) => String(v == null ? '' : v).slice(0, n);
const DAY_RX = /^\d{4}-\d\d-\d\d$/;
const arr = v => (Array.isArray(v) ? v : []);
// 남긴 결과물 한 건(한 줄 · 까닭 · 불편해질 사람 · 잰 값 · 고른 것) — 글이 하나도 없으면 null
function outOf(e, day) {
  if (!e || typeof e !== 'object') return null;
  const o = { d: day === '0000-00-00' ? '' : day.slice(5), c: cut(e.c, 16), s: cut(e.s, 16) };
  if (e.t) o.t = cut(e.t, 60);
  if (e.w) o.w = arr([].concat(e.w)).slice(0, 4).map(x => cut(x, 40));
  if (e.l) o.l = cut(e.l, 40);
  if (e.f != null && e.f !== '') o.f = cut(e.f, 40);
  if (!o.t && !o.w && !o.l && o.f == null) return null;
  if (e.p) o.p = arr([].concat(e.p)).slice(0, 4).map(x => cut(x, 24));
  return o;
}
// 하루 묶음 기록(S.rec.days)만으로 셈 — 붙여 넣은 기록(복사하기)·판 둘 다
export function tsumDays(days) {
  const D = days && typeof days === 'object' && !Array.isArray(days) ? days : {}, keys = Object.keys(D).filter(k => DAY_RX.test(k)).sort();
  const real = keys.filter(k => k !== '0000-00-00'), rd = real[real.length - 1] || '', B = rd && D[rd] && typeof D[rd] === 'object' ? D[rd] : null;
  const n = k => arr(B && B[k]).length;
  let td = null, tcd = [];
  if (B) {
    const st = arr(B.st); td = { st: st.length, h3: st.filter(e => e && (e.h | 0) >= 3).length, tr: st.reduce((a, e) => a + ((e && e.tr) | 0), 0), cd: n('cd'), q: n('q'), qok: arr(B.q).filter(e => e && e.ok).length, help: n('help'), job: n('job'), play: n('play'), show: n('show'), rank: n('rank'), tmap: n('tmap'), road: n('road'), way: n('way') };
    tcd = arr(B.cd).map(e => cut(e && e.c, 16)).filter(Boolean).slice(-6);
  }
  const outs = [];
  for (let i = keys.length - 1; i >= 0; i--) { const L = arr(D[keys[i]] && D[keys[i]].st); for (let j = L.length - 1; j >= 0; j--) { const o = outOf(L[j], keys[i]); if (o) outs.push(o); } }
  return { rd, td, tcd, out: outs.slice(0, 3), no: outs.length, nd0: real.length };
}
// 판 하나 → 표 한 줄 요약
export function tsum(S) {
  if (!S || typeof S !== 'object' || Array.isArray(S)) return null;
  const st = S.story && typeof S.story === 'object' && !Array.isArray(S.story) ? S.story : {}, done = st.done && typeof st.done === 'object' ? Object.keys(st.done) : [];
  const R = tsumDays(S.rec && typeof S.rec === 'object' ? S.rec.days : null);
  return { v: TSUM_V, at: (S.sv && +S.sv.at) || 0, day: S.day | 0,
    cur: st.cur ? [cut(st.cur, 16), Math.max(0, st.i | 0)] : null, pz: st.paused ? cut(st.paused, 16) : null, due: st.due && st.due.c ? cut(st.due.c, 16) : null,
    nd: done.length, done: done.slice(-60).map(x => cut(x, 16)), ...R };
}
