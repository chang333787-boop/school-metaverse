// ⌨→✋ 터치 키 글자 거르기(TOUCH-2 · 10-17 #15 '휴대폰인데 (J로 바로 가기)·M·J·F 같은 키 글자'): 한 곳에서 — 화면에 붙는 글(칩·할 일 줄·창·대화창·알림·이야기 힌트)을 MutationObserver로 보고 키 안내만 고침
//   '(J)'·'(I = 가방)'·'(J로 바로 가기)'·'(Esc)' = 지움 · 홀로 선 'E'(E! · E로 · E =) = ✋(행동 단추) · 'W 앞으로 · A/D 돌기'·'A/D로 좌우' = 이동 막대
//   켜는 쪽 = 마을(터치일 때) · 채팅·방 창·입력칸·아이가 쓴 글 칸(메모장)은 건드리지 않음 · 매 프레임 일 0(글이 바뀔 때만 · 바뀐 글자 마디만)
const SKIP = '#mpChat,#mpChatBtn,.lb-pop,.lb-ask,#mpWR,input,textarea,[contenteditable],#memo-ui,.no-keytext';
const RX = [
  [/\s*\((?:[A-Z]|Esc|Tab)(?:\s*(?:=|→|로)[^)]{0,24})?\)/g, ''],
  [/\bW (?:앞으로|go) · A\/D (?:돌기|turn)/g, '이동 막대로 몰기'],
  [/A\/D(?:\(←→\))?로 좌우/g, '이동 막대로 좌우'],
  [/(^|[\s·—(])[A-DF-Z] = /g, '$1'],   // 'B = 내리기 · R = 따르릉' → '내리기 · 따르릉'(칩이 그 자리)
  [/(^|[\s(·—\-'"‘“])E(?=$|[\s!=를로,.)·?'"’”])/g, '$1✋'],
];
export function noKeys(t) { let s = String(t); for (const [r, v] of RX) s = s.replace(r, v); return s; }
function fix(tn) { const v0 = tn.nodeValue; if (!v0 || !/[A-Z]/.test(v0)) return; const p = tn.parentElement; if (!p || p.closest(SKIP)) return; const v = noKeys(v0); if (v !== v0) tn.nodeValue = v; }
function walk(n) { if (n.nodeType === 3) { fix(n); return; } if (n.nodeType !== 1 || (n.closest && n.closest(SKIP))) return; const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) fix(t); }
let MO = null;
export function startKeyText() { if (MO) return; MO = new MutationObserver((recs) => { for (const r of recs) { if (r.type === 'characterData') fix(r.target); else for (const n of r.addedNodes) walk(n); } }); MO.observe(document.body, { subtree: true, childList: true, characterData: true }); walk(document.body); }
export function stopKeyText() { if (MO) { MO.disconnect(); MO = null; } }
export const keyTextOn = () => !!MO;
