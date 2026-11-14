// 👥 우리 반 함께(CLASS-MP · 11-14 교사 '반 코드로 들어오면 저절로 같은 반 친구가 보이게'): 반 코드 + 번호 + 핀으로 판을 받은 아이 = 방 고르기 없이 같은 반 Cloudflare 방(웹소켓)에
//   입장표(town_cloud.js mpTicket · /load·/save 답)가 있을 때만 붙음 · Firebase는 하나도 안 씀 · 이름 대신 번호('7번') · 세상 시계·날씨는 각자(다음 걸음 = town_together.md §9-1)
//   예전 함께하기 방에 들어가면(body.mp-in) 이 방은 잠깐 나감 · 이모트 칩(main.js)은 그대로 — 반 방에 있을 때만 그 번호를 웹소켓으로({t:'e', m})
//   끄는 길 = 선생님 칸 「우리 반 함께 보기」(서버 반 칸 · 다음 /load·/save부터) · 주소 ?mp=off(이 기기) · 홍보판·반 코드 없는 칸은 town.js가 아예 안 만듦
import { mpTicket } from './town_cloud.js?v=10';
export function createClassMP({ THREE, scene, map, say, en, quiet }) {
  const OFF = !!window.SM_PROMO || new URLSearchParams(location.search).get('mp') === 'off';
  const P = { x: 0, y: 0, z: 0, h: 0 }; let N = null, M = null, t = 0, said = false, goneTk = '', lx = 0, lz = 0, eT = -1e9;
  if (!OFF) import('../js/net.js?v=21').then(m => { M = m; }).catch(() => { /* 못 받으면 혼자 놀기 그대로 */ });
  const lab = u => (en() ? 'No. ' + u : u + '번');
  const note = k => { if (k === 'dev') say(en() ? '👥 You came in on another device. Here you play on your own' : '👥 다른 기기에서 들어왔어요. 여기서는 혼자 놀아요', 4); };
  const onEmo = e => { const b = e.target.closest && e.target.closest('#mpEmo .emo-bar [data-e]'); if (!b || !N || !N.cf.ok) return; const now = performance.now(); if (now - eT < 1500) return; eT = now; N.emote(+b.dataset.e); };   /* main.js doEmote와 같은 1.5초 상한 */
  document.addEventListener('click', onEmo, true);
  const API = {
    tick(dt) {
      if (N) { const p = map.player.pos(), dx = p.x - lx, dz = p.z - lz; if (dx * dx + dz * dz > 1e-4) { P.h = Math.atan2(dx, dz); lx = p.x; lz = p.z; } P.x = p.x; P.y = p.y; P.z = p.z; N.tick(dt, P); }   /* 몸 방향 = 걸어간 쪽(main.js P.yaw와 같은 셈) · 새 객체 X */
      if ((t -= dt) > 0) return; t = 1;
      const T = OFF ? null : mpTicket(), want = !!(T && M && T.tk !== goneTk && !document.body.classList.contains('mp-in'));
      if (N && N.cf.gone) { goneTk = (mpTicket() || {}).tk || 'x'; N.leave(); N = null; return; }   /* 꽉 참·다른 기기·표가 틀림 = 그 표로는 다시 안 붙음(날이 바뀌어 새 표가 오면 다시) */
      if (want && !N) N = M.createNet({ THREE, scene, room: T.r, kind: 'kid', cls: { r: T.r, tk: () => (mpTicket() || T).tk, lab, note } });
      else if (N && (!want || N.cf.room !== T.r)) { N.leave(); N = null; }
      if (N && !said && N.count > 1 && !quiet()) { said = true; say(en() ? '👥 Your classmates are here' : '👥 우리 반 친구가 보여요', 3); }   /* 처음 한 번 · 첫 이야기 동안은 미룸(quiet9) */
    },
    net: () => N,
    get n() { return N ? N.count : 0; },
    dispose() { document.removeEventListener('click', onEmo, true); if (N) N.leave(); N = null; if (window.SM_CLS === API) delete window.SM_CLS; },
  };
  window.SM_CLS = API;   /* town_friends.js(몸·점)와 시험이 읽음 */
  return API;
}
