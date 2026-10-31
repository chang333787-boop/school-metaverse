// 첫 화면(design §0) — 제목 · 비상업 한 줄 · 큰 숫자 단추 1~6(학년 · 1·2 = 쉬움) → 저장 칸 셋(드래곤 얼굴) → 장 그림 줄 · 선생님 장 고르기
// ?grade= 이면 학년을 묻지 않음 · ?ch=&step= 이면 첫 화면 없이 바로(시험·선생님)
import { FACES } from './art.js?v=15';
import { readSlot } from '../story/save.js?v=15';

const CSS = `
#title { position:fixed; inset:0; z-index:35; background:#1d2730; color:#f4ead2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif; pointer-events:auto; }
#title h1 { margin:0; font-size:44px; letter-spacing:.02em; } #title .sub { font-size:15px; opacity:.8; }
#title .row { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
#title button { font:inherit; color:#2b2118; background:#f4ead2; border:3px solid #2b2118; border-radius:14px 18px 12px 20px / 18px 12px 20px 14px; cursor:pointer; box-shadow:3px 4px 0 rgba(0,0,0,.35); }
#title .g { width:76px; height:76px; font-size:36px; font-weight:800; }
#title .slot { width:200px; padding:10px; display:flex; gap:10px; align-items:center; text-align:left; font-size:16px; }
#title .slot svg { width:56px; height:56px; flex:none; }
#title .ch { width:96px; padding:8px 6px; font-size:14px; } #title .ch b { display:block; font-size:22px; } #title .ch[disabled] { opacity:.4; cursor:default; }
#title .small { background:none; color:#f4ead2; border:none; box-shadow:none; text-decoration:underline; font-size:14px; }
#title .q { font-size:22px; font-weight:700; }
`;
export const CHAPTERS = [
  [1, '습격의 밤'], [2, '숲의 자국'], [3, '숨은 호수'], [4, '생선과 이름'], [5, '꼬리날개'], [6, '하늘을 나는 법'], [7, '아빠의 투구'], [8, '아스트리드와 둥지'], [9, '마지막 시험'], [10, '대장 드래곤'], [11, '함께 사는 버크'],
];
export function showTitle({ playable, Q }) {
  return new Promise((done) => {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'title'; document.body.appendChild(el);
    const pick = { grade: +(Q.get('grade') || 0), slot: 0 };
    const DRAGONS = ['toothless', 'toothless', 'toothless'];
    const end = (r) => { el.remove(); done(r); };
    function head(q) { return `<h1>버크의 드래곤 친구</h1><div class="sub">영화 『드래곤 길들이기』를 보고 4학년이 만든 비상업 팬 게임</div><div class="q">${q}</div>`; }
    function grades() {
      el.innerHTML = head('몇 학년이에요?') + `<div class="row">${[1, 2, 3, 4, 5, 6].map((g) => `<button class="g" data-g="${g}">${g}</button>`).join('')}</div>`;
      el.querySelectorAll('.g').forEach((b) => { b.onclick = () => { pick.grade = +b.dataset.g; slots(); }; });
    }
    function slots() {
      el.innerHTML = head('어느 칸에서 할까요?') + `<div class="row">${[1, 2, 3].map((k) => { const s = readSlot(k); return `<button class="slot" data-k="${k}">${FACES[DRAGONS[k - 1]]({ pupil: s ? 1 : 0.3, smile: !!s })}<span>${k}번 칸<br>${s ? s.ch + '장까지 · ' + (s.grade || '') + '학년' : '새로 하기'}</span></button>`; }).join('')}</div><button class="small" data-t="1">선생님: 장 고르기</button>`;
      el.querySelectorAll('.slot').forEach((b) => { b.onclick = () => { pick.slot = +b.dataset.k; const s = readSlot(pick.slot); chapters(s); }; });
      el.querySelector('[data-t]').onclick = () => { pick.slot = pick.slot || 1; chapters(null, true); };
    }
    function chapters(s, teacher) {
      const upTo = teacher ? 11 : Math.max(1, s ? s.ch : 1);
      el.innerHTML = head(s ? '이어서 할까요?' : '어디부터 할까요?') + `<div class="row">${CHAPTERS.map(([n, t]) => `<button class="ch" data-c="${n}" ${playable.includes(n) && n <= upTo ? '' : 'disabled'}><b>${n}</b>${t}</button>`).join('')}</div>`;
      el.querySelectorAll('.ch').forEach((b) => { if (!b.disabled) b.onclick = () => { let ch = +b.dataset.c; if (ch === 1 && !s && !teacher) ch = 0; end({ grade: pick.grade, slot: pick.slot, ch, idx: s && s.ch === ch ? s.idx || 0 : 0, save: s }); }; });   // 새로 시작하면 오프닝(0)부터
    }
    if (pick.grade) slots(); else grades();
  });
}
export function diffOf(grade, Q) { const d = Q.get('diff'); if (d === 'easy' || d === 'normal' || d === 'hard') return d; return grade && grade <= 2 ? 'easy' : 'normal'; }
