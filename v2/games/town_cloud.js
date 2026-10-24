// ☁️ 이어 하기 저장(SAVE-CF · 최종 차례 8 · 사용자 10-24 '크롬북 ↔ 컴퓨터실 이어 하기'): v4 번호 로그인 + 반 코드(?cls=) → Cloudflare 방 서버(server/cf-rooms)의 /save·/load
//   반 코드는 선생님이 v4 주소 꼬리 ?cls=ABC123 으로 한 번 주면 이 기기에 남음 · 핀(숫자 넷)은 본문으로만 보내고 서버가 해시로 확인 · 이름은 보내지 않음(저장에도 이름 칸 없음)
//   서버가 안 되면(망·꽉 참) 이 기기 저장 그대로 놀이가 이어짐 · ?cf=off = 끔 · Firebase는 쓰지 않음(DB 규칙 그대로)
const CF_HTTP = (() => { try { const q = new URLSearchParams(location.search).get('cf'); if (q === 'off') return ''; if (q && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(q)) return q; return 'https://sm-rooms.sm-rooms.workers.dev'; } catch (e) { return ''; } })();
const CLS_K = 'sm-town-cls';
export function classCode() { try { const q = new URLSearchParams(location.search).get('cls'); if (q != null) { const c = /^[A-Za-z0-9]{4,8}$/.test(q) ? q.toLowerCase() : ''; if (c) localStorage.setItem(CLS_K, c); else localStorage.removeItem(CLS_K); return CF_HTTP ? c : ''; } return CF_HTTP ? (localStorage.getItem(CLS_K) || '') : ''; } catch (e) { return ''; } }
// 한 번 부르기 → { st: 상태 번호(0 = 망 안 됨), j: 답 }
export async function cloudCall(kind, code, num, body, ms = 5000) {
  if (!CF_HTTP || !code) return { st: 0, j: null }; const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), ms) : 0;
  try { const r = await fetch(CF_HTTP + '/' + kind + '/' + code + '/' + num, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined, keepalive: kind === 'save' && body.k9 }); let j = null; try { j = await r.json(); } catch (e) { /* */ } return { st: r.status, j }; }
  catch (e) { return { st: 0, j: null }; } finally { if (t) clearTimeout(t); } }
const metaK = key => 'sm-town-cloud:' + key;
const prog = S => (S && typeof S === 'object' ? (S.day || 0) * 100000 + (S.earned || 0) : -1);
// 들어올 때(짓기 전): 서버 것이 더 새것이면 이 기기 저장을 바꿈 → 바꿨으면 'pulled'
export async function cloudPull(key, code, num, pin) {
  const r = await cloudCall('load', code, num, { pin }); if (r.st !== 200 || !r.j || !r.j.ok) return r.st === 403 ? 'bad' : r.st === 423 ? 'lock' : 'off'; if (r.j.none) return 'none';
  let meta = {}, loc = null; try { meta = JSON.parse(localStorage.getItem(metaK(key)) || '{}') || {}; loc = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { /* */ }
  const pS = prog(r.j.data), pL = prog(loc), newer = meta.at ? r.j.at > meta.at : pS >= pL;   /* 이 기기에서 이어 한 적 없으면 더 많이 한 쪽 */
  if (newer && loc && pL > pS) { try { localStorage.setItem(key + ':cloud-bak', JSON.stringify({ at: r.j.at, data: r.j.data })); } catch (e) { /* */ } return 'more'; }   /* SAVE-2(코덱스 10-24 · 로컬 8일차 → 서버 2일차로 덮던 것): 서버가 새것이어도 이 기기가 더 진행했으면 이 기기 것을 지키고 서버 것은 따로 보관 → 다음 올림 때 서버도 이 기기 것으로 */
  if (newer && r.j.data && r.j.data.v) { try { if (loc) localStorage.setItem(key + ':local-bak', JSON.stringify(loc)); localStorage.setItem(key, JSON.stringify(r.j.data)); localStorage.setItem(metaK(key), JSON.stringify({ at: r.j.at })); } catch (e) { return 'off'; } return 'pulled'; }   /* 덮기 전에 이 기기 것은 :local-bak에 남김(되살리기 길) */
  return 'kept'; }
// 놀이 중: 45초마다 바뀌었으면 올림 · 창을 닫을 때 한 번(작으면) · 결과는 say로 한 번만(실패 알림 남발 X)
export function cloudSync({ key, code, num, pin, alive, onFail, flush, more }) {
  let lastS = '', busy = false, failed = false;
  try { lastS = more ? '' : (localStorage.getItem(key) || ''); } catch (e) { /* */ }   /* more = 이 기기가 더 진행 → 첫 올림에서 바로 서버를 고침 */
  const push = async (k9) => { if (busy || !alive()) return; if (flush) { try { if (flush() === false) return; } catch (e) { /* */ } } let s = '';   /* SAVE-2: 이 기기 저장을 먼저 끝낸 뒤(성공했을 때만) 서버로 — 탭을 닫을 때 마지막 2초 몫이 빠지던 것 */ try { s = localStorage.getItem(key) || ''; } catch (e) { return; } if (!s || s === lastS) return; let data; try { data = JSON.parse(s); } catch (e) { return; }
    busy = true; const r = await cloudCall('save', code, num, { pin, data, k9: !!k9 }); busy = false;
    if (r.st === 200 && r.j && r.j.ok) { lastS = s; failed = false; try { localStorage.setItem(metaK(key), JSON.stringify({ at: r.j.at })); } catch (e) { /* */ } } else if (!failed) { failed = true; if (onFail) onFail(r.j && r.j.m); } };
  const iv = setInterval(() => { if (!alive()) { clearInterval(iv); removeEventListener('pagehide', ph); return; } push(false); }, 45000);
  const ph = () => { let n = 0; try { n = (localStorage.getItem(key) || '').length; } catch (e) { /* */ } if (n < 60000) push(true); };   /* keepalive 본문 64KB 상한 */
  addEventListener('pagehide', ph);
  return { now: () => push(false), stop: () => { clearInterval(iv); removeEventListener('pagehide', ph); } }; }
