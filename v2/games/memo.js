// 메타버스 메모장(MEMO-1 · 10-03 교사 '운동장 어디에 깃발을 꽂고 여기에 뭐가 필요해요 — 저장하면 내가 보고 Claude에게 만들라고') — RPG 생각판의 메타버스판.
//   판 1~10번(선생님이 정해 둔 판에 들어감) · Firebase class-rpg metaverse/boards/<판>/flags · 같은 판 친구 것이 바로 보임
//   MEMO-3(10-03 교사 '종류가 많으면 헷갈림 — 사건(장면)을 먼저 적고 거기에 인물·장소·대사·물건을 붙이는 방식 · 깃발은 몇 번 장면과 연결됐는지 보이게'):
//     📖 이야기 판(L) = 장면 카드(1, 2, 3… · 끌어서 순서 · 선생님이 칸 '처음, 가운데, 끝') — 장면마다 '무슨 일이 일어나요?' + 덧붙이기(🧑 인물 · 💬 대사 · 📦 물건 · ❓ 고르기)
//     🚩 깃발 = '몇 번 장면'을 고르고 꽂음(장면이 일어나는 곳 · 인물·물건·대사가 있는 곳) — 깃발 색·번호 = 장면 · ▶ 장면 따라 걷기(N/B) · ❤️ · 💬 댓글 · 📤 정리
//   FREE-MOUSE(교사 '화면이 늘 게임에 잠겨 옆 단추를 누르기 힘들다'): 메모장에선 마우스가 늘 보임 · 끌어서 둘러보기 · 땅을 톡 누르면 '🚩 여기에 꽂기'
//   STORY-2(10-03 밤 · 생각판 '이야기 판' 새 구상 참고): 이야기 줄기 문장(10-04 → 학교 이야기용: 어느 날 아침·쉬는 시간에·점심시간에·방과 후에·그런데 갑자기·그래서 우리는·드디어) · 🏁 결말 표시(장면 end) · 📖 책처럼 읽기 · 🧭 이야기 코치(결말·없는 장면·갈 곳 없는 보기·아무 데서도 안 가는 장면)
//   🛤 이야기 길(PATH-1 · 10-03 교사 '깃발 꽂는 것과 잘 이어져야'): 장면 깃발 → 다음 장면 깃발을 학교 바닥에 걷는 길(길격자)로 — 갈림길은 갈라지는 길(색 = 가는 장면) · 깃발 없는 장면은 카드·코치에서 바로 꽂으러
//   🔐 퀴즈·자물쇠(QUIZ-1 · 10-03 교사 '이야기 만들기는 방탈출이랑도 같이 되는 거지 — 퀴즈를 넣고 싶으면 애들이 넣으면'): 덧붙이기 '🔐' = ✍️ 답 쓰기 · 🔘 보기 고르기 · 📦 물건으로 열기(앞에서 주운 물건) + 💡 힌트 + 맞히면 → 장면 · 정답은 쓴 아이·선생님만 · 해 보기에서 맞혀야 통과(2번 틀리면 힌트 · 3번이면 정답 보고 넘어가기) · 물건 카드에 깃발이 있으면 그 자리까지 찾아가야 주움
//   🏫 현실 방탈출(REAL-1 · 10-03 교사 '태블릿 들고 진짜 도서관에 가면 태블릿에서도 도서관으로'): 학교 안은 GPS가 안 되니 장소마다 번호 카드(4자리 — 판·깃발로 정해짐)를 붙이고, 그곳에서 번호를 넣으면 아바타가 그 자리로 · 그 사이엔 태블릿 속에서도 걸어 다님(아래 띠 — 멈추지 않음)
//     🖨 준비물(선생님) = 장소 번호가 찍힌 학교 지도 · 오려 붙일 장소 카드 · 정답표 · 현실 점검표(메타버스와 실제가 다르면 적어서 Claude에게 → 메타버스를 고침)
//   🎮 이야기로 해 보기(PLAY-1 · 10-03 밤): 판의 장면 순서대로 — 장면 자리(첫 깃발)까지 걸어가면 장면 글 → 💬 대사·🧑 인물·📦 물건(줍기) → ❓ 고르기('→ N번 장면'이면 그 장면으로) → 🏁 끝 · 쓰고 바로 해 보는 수업
//   선생님(🔒 4자리 · 함께하기와 같은 비밀번호): 판 제목·질문·칸 · 잠금 · 🗂 관리(비우기 = 판 번호를 적어야 · 비운 것은 trash에 보관 → ↩️ 되돌리기)
//   🌍 세계 만들기(WORLD-1 · 10-03 교사 '메타버스는 두 갈래 — 이야기 설계 · 마법 세계처럼 새로운 세계 만들기(세계관 상상) — 교사가 관리에서 보고 Claude에게 넣으면 구현'):
//     판 종류 boardList ty:'world'(세계 1~5번 판 w01~w05) · 카드 = 여섯 칸(🌍 어떤 세계? · 📜 규칙 · 👫 누가 살아? · 🏰 어떤 곳? · ✨ 신기한 것 · 🎮 무엇을 해?) + 💡 까닭(why)
//     🏰 장소 카드 = 새 세계 안 📍 어디쯤(WLOC — 10-04 교사 '새 세계인데 왜 학교에 깃발' → 우리 학교와 따로 · 학교 깃발 없음) · 🧭 세계 코치(칸별 목표 · 세계 채우기 % · 할 일이 장소·주민·신기한 것과 이어지나 · 까닭) · 📤 정리 = Claude 구현 부탁 틀까지
//   10-04 마감 점검: 📤 정리의 퀴즈 정답·힌트 = 쓴 친구·선생님만(카드와 같은 규칙) · 장면 자리(sceneSpot) = 장면 → 📍 일어나는 곳 → 인물·대사(📦·🔐 숨긴 자리는 따로) · 덧붙인 것 🚩 꽂기·✏️ 깃발 옮기기(moving)
//     · 보기의 장면 번호 = '→ N번' 꼬리만(TAIL — '1번 사물함'은 글) · 새 장면은 마지막 장면의 칸 끝 · 깃발을 누르면 그 장면 보기 · 해 보기: ⏹ = 창·걷기 타이머까지 정리 · 안 쓴 장면 🚧 · 자물쇠는 같은 장면의 열쇠 뒤로
import { teacherPin } from '../js/lobby.js?v=12';   // 선생님 비밀번호 창(●로 가림 — 함께하기·블록 놀이와 같은 것 · main.js와 같은 ?v=라야 한 벌)
export const meta = { id: 'memo', title: '메타버스 메모장', api: 1 };

const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const ADD = [   // 장면에 덧붙이는 것
  { k: 'who', e: '🧑', n: '인물', q: '누가 나와요? 무엇을 해요?', who: '누구? (예: 사서 선생님 · 길 잃은 고양이)' },
  { k: 'say', e: '💬', n: '대사', q: '무슨 말을 해요?', who: '누가 말해요?' },
  { k: 'item', e: '📦', n: '물건', q: '어떤 물건이 있어요? 무엇에 써요?' },
  { k: 'choice', e: '❓', n: '고르기', q: '어떤 고민을 해요? (보기는 아래에 한 줄씩)' },
  { k: 'quiz', e: '🔐', n: '퀴즈·자물쇠', q: '어떤 문제를 내요? 맞혀야 다음으로 가요(방탈출처럼)' },
];
const QT = [['text', '✍️ 답 쓰기'], ['pick', '🔘 보기 고르기'], ['item', '📦 물건으로 열기']];   // QUIZ-1 퀴즈 종류
const QTN = { text: '🔐 퀴즈', pick: '🔐 고르는 퀴즈', item: '🔒 자물쇠' };
const QTL = { text: '퀴즈', pick: '고르는 퀴즈', item: '자물쇠' };   // 카드 줄용(앞 그림은 줄 머리에 한 번만)
const FLAGK = new Set(['who', 'say', 'item', 'quiz']);   // 덧붙인 것 중 나중에 🚩 깃발을 꽂을 수 있는 것(인물·대사가 있는 곳 · 물건 숨길 곳 · 퀴즈 자리)
// 고르기 보기의 갈 장면 = 줄 끝 꼬리 '→ N번 장면'(겹친 꼬리 '→ ?번 장면 → 2번 장면'도 한 번에 뗌) — '1번 사물함'처럼 글 속 번호는 장면이 아님
const TAIL = /(?:\s*(?:→|->|=>)\s*(?:\d{1,2}|\?)\s*번(?:\s*(?:장면|카드|깃발))?)+\s*$/;
const ARROWN = /(?:→|->|=>)\s*(\d{1,2}|\?)\s*번/g;
const SCENE = { k: 'scene', e: '🎬', n: '장면', q: '이 장면에서 무슨 일이 일어나요?' };
const PLACE = { k: 'place', e: '📍', n: '장소', q: '여기는 어떤 곳이에요? (안 적어도 돼요)' };
const KBY = Object.fromEntries([SCENE, PLACE, ...ADD].map((x) => [x.k, x]));
const OLD = { memo: '📝', event: '⚡', mark: '🏁' };
const STEMS = ['어느 날 아침', '쉬는 시간에', '점심시간에', '방과 후에', '그런데 갑자기', '그래서 우리는', '드디어'];   // 이야기 줄기 문장 — 우리 학교에서 일어나는 이야기(10-04 교사 '학교 이야기인데 웬 옛날 옛적에')
const stemFor = (n) => n === 0 ? '예) 어느 날 아침, 우리 반 사물함에서 이상한 소리가 났어요' : n === 1 ? '예) 그런데 갑자기 도서관 책이 하나도 없어졌어요' : '예) 그래서 우리는 쉬는 시간에 단서를 찾으러 갔어요';   // 새 장면 자리표시(순서대로)
const WC = [   // 세계 만들기 여섯 칸(4~6학년 — 질문 · 예시 · 줄기 문장)
  { k: 'wname', e: '🌍', n: '어떤 세계?', c: 0x339af0, goal: 1, q: '세계 이름과 한 줄 소개 — 어떤 분위기(색·날씨·소리·냄새)예요?', stems: ['이 세계의 이름은', '이곳은', '언제나'], ex: '이 세계의 이름은 「구름섬」이에요. 구름 위에 떠 있는 섬이고 늘 솜사탕 냄새가 나요.' },
  { k: 'wrule', e: '📜', n: '규칙', c: 0x845ef7, goal: 2, q: '이 세계에서만 되는 일·안 되는 일은? 어기면 어떻게 돼요?', stems: ['이 세계에서는', '하지만', '만약'], ex: '이 세계에서는 노래를 부르면 몸이 떠올라요. 하지만 거짓말을 하면 다시 떨어져요.' },
  { k: 'wpeop', e: '👫', n: '누가 살아?', c: 0xf76707, goal: 2, q: '어떤 존재가 살아요? 이름·모습·성격·하는 일은?', stems: ['이 세계에는', '모습은', '성격은'], ex: '이 세계에는 「구름 토끼」가 살아요. 귀가 무지개색이고 부끄러움을 많이 타요.' },
  { k: 'wplace', e: '🏰', n: '어떤 곳?', c: 0x2f9e44, goal: 3, q: '이 세계에는 어떤 장소가 있어요? 어떻게 생겼고, 어디쯤 있어요?', stems: ['이곳의 이름은', '그곳에는', '거기에 가면'], ex: '「떠다니는 책의 숲」은 섬 북쪽에 있어요. 책이 새처럼 날아다녀요.' },
  { k: 'wthing', e: '✨', n: '신기한 것', c: 0xe64980, goal: 3, q: '마법·기술·물건·생물 중 신기한 것은? 이름은? 어떻게 써요?', stems: ['이것의 이름은', '이것을 쓰면', '조심해야 할 점은'], ex: '이것의 이름은 「반짝 연필」이에요. 허공에 그리면 그 물건이 진짜로 생겨요. 하루에 세 번만 돼요.' },
  { k: 'wdo', e: '🎮', n: '무엇을 해?', c: 0xf59f00, goal: 3, q: '놀러 온 친구는 무엇을 해요? 풀어야 할 문제·도전은?', stems: ['처음 온 친구는', '여기서는', '해결하면'], ex: '처음 온 친구는 구름 토끼를 찾아 길을 물어요. 무지개 다리를 고치면 하늘 섬에 갈 수 있어요.' },
];
const WBY = Object.fromEntries(WC.map((x) => [x.k, x]));
const WSTEMS = [...new Set(WC.flatMap((x) => x.stems))].sort((a, b) => b.length - a.length);   // 세계 칸 줄기 문장 모두(긴 것부터 — 칸을 바꿔도 앞 칸 줄기를 떼고 · 코치가 이름으로 세지 않게)
const unstem = (f) => { const t = String(f.tx || '').replace(/\s+/g, ' ').trim(), S = (WBY[f.k] || {}).stems || []; const r = S.length ? t.replace(new RegExp('^(' + S.join('|') + ')\\s*'), '') : t; return r || t; };   // 세계 카드 글에서 앞 줄기 문장('이 세계의 이름은' 등) 떼기 — 보기용
const wnm = (f) => { const m = String(f.tx || '').match(/「([^」]{1,20})」/); return m ? '「' + m[1] + '」' : unstem(f); };   // 「이름」이 있으면 그 이름
const WLOC = ['가운데', '북쪽', '남쪽', '동쪽', '서쪽', '하늘', '땅속', '물속'];   // 🏰 장소 = 새 세계 안 어디쯤(10-04 교사 '새 세계인데 왜 학교에 깃발' — 학교 깃발 없음)
const SC = [0xff6b6b, 0xffa94d, 0xf2c200, 0x51cf66, 0x20c997, 0x339af0, 0x5c7cfa, 0xcc5de8, 0xf06595, 0x868e96];
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const bare = (t) => String(t || '').replace(/^\s*(?:🌍|📖|📌)\s*/u, '');   // 판 이름 앞 그림을 우리가 붙일 때 겹치지 않게('🌍 🌍 견본 세계')
const STYLE = `
#memo-ui{position:fixed;inset:0;pointer-events:none;z-index:41;font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;color:#1d3557}
#memo-ui .mp{pointer-events:auto;position:absolute;background:#fffdf6;border:3px solid #1d3557;border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,.3)}
#memo-ui button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:8px 13px;font-weight:800;background:#1d3557;color:#fff}
#memo-ui button.sub{background:#e8edf3;color:#1d3557}
#memo-ui button.warn{background:#ffe3e3;color:#c92a2a}
#memo-ui input,#memo-ui textarea{font:inherit;font-size:16px;border:2px solid #c9d3df;border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box;background:#fff;color:#1d3557}
#memo-ui textarea{min-height:70px;resize:vertical}
#memo-ui h3{margin:0 0 8px;font-size:19px}
#memo-ui .sm{font-size:13px;color:#5a6b80}
#memo-pick,#memo-form,#memo-sum,#memo-view,#memo-admin,#memo-quiz{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:88vh;overflow:auto;padding:14px 16px;box-sizing:border-box}
#memo-pick .bd{display:grid;gap:8px;margin:10px 0}
#memo-pick .bd button{text-align:left;background:#eef4ff;color:#1d3557;padding:10px 12px;border:2px solid #c9d8f0}
#memo-pick .bd button small{display:block;font-weight:600;color:#5a6b80;margin-top:2px}
#memo-ui .chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
#memo-ui .chips button{background:#f1f3f5;color:#1d3557;padding:7px 10px;border:2px solid transparent;max-width:100%;text-align:left}
#memo-ui .chips button.on{border-color:#1d3557;background:#fff3bf}
#memo-ui .num{display:inline-block;min-width:24px;padding:1px 6px;border-radius:9px;color:#fff;font-weight:900;text-align:center;margin-right:4px;text-shadow:0 1px 0 rgba(0,0,0,.25)}
#memo-ui .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}
#memo-ui .where{font-weight:800;margin:2px 0 6px}
#memo-ui .mlbl{font-weight:800;margin-top:10px}
#memo-sum pre{white-space:pre-wrap;font-size:13px;background:#f8f9fa;border-radius:10px;padding:10px;max-height:52vh;overflow:auto;font-family:inherit}
#memo-x{left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(29,53,87,.7);position:absolute}
#memo-here{pointer-events:auto;position:absolute;transform:translate(-50%,-130%);font-size:15px;padding:8px 12px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.3);white-space:nowrap}
#memo-board{inset:2.5vh 2vw;display:flex;flex-direction:column;padding:12px 14px}
#memo-board .top{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#memo-board .top h3{margin:0;flex:1;min-width:180px}
#memo-board .bar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0}
#memo-board .body{flex:1;overflow:auto;background:#f3efe4;border-radius:12px;padding:12px}
#memo-ui .lanes{display:flex;gap:12px;align-items:flex-start;min-height:100%}
#memo-ui .lane{flex:0 0 280px;background:rgba(255,255,255,.6);border-radius:12px;padding:8px;min-height:160px;box-sizing:border-box}
#memo-ui .lane h4{margin:0 0 8px;font-size:15px}
#memo-ui .lane .cd{margin-bottom:12px}
#memo-ui .lanes.wl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));min-height:0;align-items:start}
#memo-ui .lanes.wl>.lane{min-width:0}
@media (min-width:1700px){#memo-ui .lanes.wl{grid-template-columns:repeat(6,minmax(0,1fr))}}
@media (max-width:900px){#memo-ui .lanes.wl{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){#memo-ui .lanes.wl{grid-template-columns:1fr}}
#memo-ui .coach{font-size:13px;margin-top:12px}
#memo-ui .coach.top{margin:0 0 10px}
#memo-ui .cc{display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:9px;font-size:12px;font-weight:700}
#memo-ui .cc[data-b]{cursor:pointer;text-decoration:underline}
#memo-ui .cc.ok{background:#d3f9d8;color:#2b8a3e}
#memo-ui .cc.no{background:#fff4e6;color:#d9480f}
#memo-ui .strip{display:flex;flex-wrap:wrap;gap:24px 30px;align-items:flex-start;min-height:120px}
#memo-ui .strip .cd{width:270px}
#memo-ui .strip .cd:not(:last-child)::after{content:'➜';position:absolute;right:-24px;top:40px;font-size:18px;color:#8a7b5a}
#memo-ui .strip .cd.end:not(:last-child)::after{content:'🏁';font-size:16px}
#memo-ui .strip .cd.wrap:not(:last-child)::after{content:'↩';right:8px;top:auto;bottom:-24px;font-size:17px}
#memo-ui .strip .cd.end.wrap:not(:last-child)::after{content:'🏁';font-size:15px}
#memo-ui .cd{background:#fff;border-radius:12px;padding:9px 10px;box-shadow:0 2px 6px rgba(0,0,0,.13);border-top:8px solid var(--k);font-size:14px;position:relative;text-align:left;box-sizing:border-box}
#memo-ui .cd .hd{display:flex;gap:6px;align-items:center;font-weight:900;font-size:15px;cursor:grab;touch-action:none}
#memo-ui .cd .by{margin-left:auto;color:#5a6b80;font-weight:600;font-size:12px}
#memo-ui .cd .tx{white-space:pre-wrap;line-height:1.5;margin:5px 0;word-break:break-word;font-size:15px;font-weight:700}
#memo-ui .cd .pl{font-size:12px;color:#5a6b80;margin-bottom:4px}
#memo-ui .cd .pl.none{color:#c2410c}
#memo-ui .cd .pl.none button.nf{padding:2px 8px;font-size:12px;background:#fff4e6;color:#d9480f;border:1px dashed #f08c00}
#memo-ui .cd .it button.nf{color:#d9480f}
#memo-ui .cd .it{display:flex;gap:6px;align-items:flex-start;padding:5px 6px;margin:4px 0;border-radius:8px;background:#f6f7f9;font-size:13px;line-height:1.45}
#memo-ui .cd .it .t{flex:1;min-width:0;white-space:pre-wrap;word-break:break-word}
#memo-ui .cd .it b{font-weight:800}
#memo-ui .cd .it button{padding:1px 6px;font-size:12px;background:transparent;color:#5a6b80}
#memo-ui .cd .add{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
#memo-ui .cd .add button{padding:4px 8px;font-size:12px;background:#eef4ff;color:#1d3557;border:1px dashed #9fb4d0}
#memo-ui .cd .ft{display:flex;gap:4px;align-items:center;margin-top:6px;flex-wrap:wrap;border-top:1px solid #eef0f3;padding-top:6px}
#memo-ui .cd .ft button{padding:4px 8px;font-size:13px;background:#f1f3f5;color:#1d3557}
#memo-ui .cd .ft button.on{background:#ffe3ec;color:#c2255c}
#memo-ui .cd .res{margin-top:6px;border-top:1px dashed #d0d7e2;padding-top:5px;font-size:13px}
#memo-ui .cd .res>div{margin:3px 0;word-break:break-word}
#memo-ui .cd .res .x{padding:0 6px;font-size:12px;background:#f1f3f5;color:#868e96}
#memo-ui .cd .ri{display:flex;gap:4px;margin-top:5px}
#memo-ui .cd .ri input{font-size:14px;padding:5px 8px}
#memo-ui .cd .ri button{padding:5px 10px;font-size:13px;white-space:nowrap}
#memo-ui .lane .cd.dB,#memo-ui .strip .cd.dB{box-shadow:-6px 0 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane .cd.dA,#memo-ui .strip .cd.dA{box-shadow:6px 0 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane .cd.dB{box-shadow:0 -6px 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane .cd.dA{box-shadow:0 6px 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane.dE,#memo-ui .strip.dE{outline:3px dashed #f59f00}
#memo-ui .cd.drag{opacity:.3}
#memo-ui .ghost{position:fixed;pointer-events:none;z-index:60;width:260px;opacity:.92;transform:rotate(2deg)}
#memo-real{left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,94vw);padding:10px 12px;box-sizing:border-box}
#memo-tour{left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,94vw);padding:10px 12px;max-height:48vh;overflow:auto;box-sizing:border-box}
#memo-tour .cd{box-shadow:none;border:1px solid #e8edf3;border-top:8px solid var(--k)}
`;

export default async function start(map, params = {}) {
  const THREE = map.three;
  let dead = false, board = null, es = null, esB = null, name = '', teacher = false;
  const KIND = params.kind === 'world' ? 'world' : 'story', isW = () => !!(board && board.ty === 'world');   // 이 카드로 들어오면 보이는 판 종류(이야기 / 세계)
  try { name = localStorage.getItem('mp.name') || ''; teacher = sessionStorage.getItem('sm.t') === '1'; } catch (e) { /* */ }   // sm.t = 이 탭에서 선생님 비밀번호를 맞힘(함께하기 방 만들기와 같이)
  const css = document.createElement('style'); css.textContent = STYLE; document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'memo-ui'; document.body.appendChild(ui);
  const el = (tag, cls, html, parent = ui) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
  const keyStop = (n) => { for (const t of ['keydown', 'keyup']) n.addEventListener(t, (e) => e.stopPropagation()); };
  const toast = (s, t = 2.5) => map.hud.toast(s, t);
  const short = (s, n = 11) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
  const dedupe = (t) => { t = String(t || '').trim(); for (const st of STEMS.concat(...WC.map((x) => x.stems))) { const re = new RegExp('^(' + st + ')\\s+' + st + '(\\s|$)'); if (re.test(t)) t = t.replace(re, '$1$2'); } return t; };   // '처음 온 친구는 처음 온 친구는' → 한 번(SIM-1)
  const keyOf = (s) => String(s || '').replace(/[.#$[\]/\s]/g, '').slice(0, 12) || '익명';
  const fpath = (id) => '/boards/' + board.id + '/flags/' + id;
  const newId = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const canWrite = () => teacher || !(board && board.lock);
  const lockMsg = () => toast('🔒 선생님이 잠근 판이에요 — 보기만 할 수 있어요', 3);
  map.player.freeMouse(true);
  let panel = null, back = null;
  const close = () => { if (panel) panel.remove(); panel = null; map.player.freeze(false); };
  const open = (id) => { close(); hereOff(); map.player.freeze(true); panel = el('div', 'mp'); panel.id = id; keyStop(panel); return panel; };
  addEventListener('keydown', onEsc, true);
  function onEsc(e) {
    if (e.code !== 'Escape') return;
    if (document.querySelector('.lb-ask')) return;   // 🔒 비밀번호 창이 떠 있으면 Esc = 그 창 취소(밑의 판은 그대로)
    if (placing || moving) { e.stopPropagation(); placing = null; moving = null; chips(); toast('📍 깃발 꽂기를 그만했어요', 1.5); }
    else if (panel && panel._quizStop) { e.stopPropagation(); panel._quizStop(); }
    else if (panel && board) { e.stopPropagation(); if (panel.id === 'memo-form' && back === 'board') { back = null; boardView(); } else { const wb = isW() && panel.id === 'memo-board'; close(); if (wb) worldBackHint(); } }
    else if (tourEl) { e.stopPropagation(); endTour(); }
    else if (hereEl) { e.stopPropagation(); hereOff(); }
  }

  // ───────── 실시간 받기(REST 스트림 → 같은 모양의 JS 객체) ─────────
  function applyEvt(root, type, path, d) {
    const set = (r, p, v) => {
      if (!p.length) return v && typeof v === 'object' ? v : {};
      let o = r; for (let i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== 'object') { if (v === null) return r; o[p[i]] = {}; } o = o[p[i]]; }
      if (v === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v; return r;
    };
    if (type === 'put') return set(root, path, d);
    if (d && typeof d === 'object') for (const k in d) root = set(root, [...path, ...k.split('/').filter(Boolean)], d[k]);
    return root;
  }
  function stream(url, fn) {
    const s = new EventSource(url);
    const on = (type) => (e) => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } if (m) fn(type, (m.path || '/').split('/').filter(Boolean), m.data); };
    s.addEventListener('put', on('put')); s.addEventListener('patch', on('patch')); return s;
  }
  let DATA = {}, BI = {};
  function listen() {
    if (es) es.close(); if (esB) esB.close();
    DATA = {}; BI = { ...board }; delete BI.id; syncNow();
    es = stream(DB + '/boards/' + board.id + '/flags.json', (type, path, d) => { DATA = applyEvt(DATA, type, path, d); sync(); });
    esB = stream(DB + '/boardList/' + board.id + '.json', (type, path, d) => {
      const was = !!(board && board.lock); BI = applyEvt(BI, type, path, d); board = { ...BI, id: board.id };
      if (was !== !!board.lock) { if (!canWrite()) { placing = null; moving = null; hereOff(); } chips(); }   // 선생님이 잠그거나 풀면 🚩 칩도 바로
      sync();
    });
  }

  // ───────── 판 고르기 · 선생님 ─────────
  const setT = () => { teacher = true; try { sessionStorage.setItem('sm.t', '1'); } catch (e) { /* */ } if (board) chips(); };
  // 선생님 모드 끝내기(아이 기기에서 한 번 풀어 준 뒤 — sm.t를 지우면 함께하기 방 만들기도 다시 비밀번호)
  const offT = () => { teacher = false; try { sessionStorage.removeItem('sm.t'); } catch (e) { /* */ } toast('🔒 선생님 모드를 껐어요', 2); if (board) { chips(); boardView(); } else pickBoard(); };
  function onTeacher() {   // 이 탭에서 선생님 비밀번호를 맞힘(여기 🔒 · 👥 함께하기 방 만들기 · 블록 놀이 — lobby.js 'sm-teacher') → 열린 판도 바로 선생님 모드로
    if (teacher || dead) return; setT();
    if (panel && panel.id === 'memo-pick') { const v = panel.querySelector('#mmName').value; pickBoard(); panel.querySelector('#mmName').value = v; }   // 적던 이름은 그대로
    else if (panel && panel.id === 'memo-board') boardView();
  }
  addEventListener('sm-teacher', onTeacher);
  async function teacherLogin() {   // 비밀번호 창 = lobby.js teacherPin(숫자를 ●로 가림 · 처음 정하기는 주소 ?setpin에서만 — 함께하기·블록 놀이와 같은 창)
    const r = await teacherPin((m, t) => toast(m, t || 2)); if (!r || dead) return;
    onTeacher(); toast(r === 'new' ? '🔒 비밀번호를 정했어요 — 선생님 모드' : '🔓 선생님 모드', 2);
  }
  const secPrompt = (cur) => { const s = prompt('이야기 칸 이름(쉼표로 나눠요 · 비우면 칸 없이 한 줄)\n예) 처음, 가운데, 끝', cur || ''); return s == null ? null : s.split(/[,|]/).map((x) => x.trim()).filter(Boolean).slice(0, 6).join(', ').slice(0, 120); };
  async function pickBoard() {
    const P = open('memo-pick');
    P.innerHTML = (KIND === 'world' ? '<h3>🌍 세계 만들기' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">우리가 상상한 <b>새로운 세계</b>를 함께 쌓아요 — 어떤 세계인지, 규칙·사는 존재·장소·신기한 것·할 일을 카드로 쌓아요. 🏰 장소는 그 세계의 「📍 어디쯤」(가운데·북쪽·하늘·물속…)인지 골라요 — 우리 학교와는 따로인 새 세계예요.</div>'
        : '<h3>📝 메타버스 메모장' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">우리 이야기를 <b>장면</b>으로 나눠 적고, 학교 곳곳에 그 장면의 🚩 깃발을 꽂아요. 같은 판에 들어온 친구들 것도 바로 보여요.</div>')
      + '<div class="where">내 이름 <input id="mmName" maxlength="8" style="width:150px;margin-left:6px" placeholder="이름"></div><div class="sm">선생님이 알려 준 판에 들어가요.</div><div class="bd">불러오는 중…</div>'
      + '<div class="row">' + (teacher ? '<button class="sub" id="mmTo">🔓 선생님 모드 끝내기</button>' : '<button class="sub" id="mmT">🔒 선생님</button>') + '<button class="sub" id="mmQuit">그만하기</button></div>';
    const nm = P.querySelector('#mmName'); nm.value = name;
    P.querySelector('#mmQuit').onclick = () => map.quit && map.quit();
    if (teacher) P.querySelector('#mmTo').onclick = offT; else P.querySelector('#mmT').onclick = teacherLogin;
    let list = {};
    try { list = (await req('/boardList')) || {}; } catch (e) { P.querySelector('.bd').textContent = '판 목록을 불러오지 못했어요 — 인터넷을 확인해 주세요'; return; }
    if (dead || panel !== P) return;
    const ids = Object.keys(list).filter((id) => list[id] && ((list[id].ty === 'world') === (KIND === 'world'))).sort((a, b) => (list[a].n || 99) - (list[b].n || 99) || (list[a].c || 0) - (list[b].c || 0)), bd = P.querySelector('.bd'); bd.innerHTML = '';
    if (!ids.length) bd.innerHTML = '<div class="sm">아직 판이 없어요.</div>';
    for (const id of ids) {
      const L = list[id], row = el('div', '', null, bd); row.style.cssText = 'display:flex;gap:6px;align-items:stretch';
      const b = el('button', '', (L.lock ? '🔒 ' + esc(L.t) : (L.ty === 'world' ? '🌍 ' : '📌 ') + esc(bare(L.t))) + (L.p ? '<small>' + esc(L.p) + '</small>' : ''), row); b.style.flex = '1'; b.onclick = () => enter(id, L);
      if (teacher) {
        const ed = el('button', 'sub', '✏️', row); ed.title = '제목·질문·칸 바꾸기'; ed.onclick = async () => {
          const t = prompt('판 제목', L.t); if (t == null) return; const q = prompt('판 질문(아이들에게 보여요)', L.p || ''); if (q == null) return; const s = L.ty === 'world' ? (L.sec || '') : secPrompt(L.sec); if (s == null) return;
          try { await req('/boardList/' + id, 'PATCH', { t: (t.trim() || L.t).slice(0, 40), p: q.trim().slice(0, 120), sec: s || null }); } catch (e) { return toast('바꾸지 못했어요', 2); } pickBoard(); };
        const lk = el('button', 'sub', L.lock ? '🔓' : '🔒', row); lk.title = L.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)'; lk.onclick = async () => { try { await req('/boardList/' + id + '/lock', 'PUT', !L.lock); } catch (e) { return; } pickBoard(); };
      }
    }
    if (teacher) el('div', 'sm', '판을 비우거나 되돌리기·정리 글 보기는 판에 들어가서 🗂 관리에서 해요(실수로 지우지 않게).', P.querySelector('.bd')).style.marginTop = '4px';
    if (params.board && list[params.board]) enter(params.board, list[params.board]);
  }
  function enter(id, info) {
    const P = panel; const nm = P && P.querySelector('#mmName'); const v = nm ? nm.value.trim().replace(/[<>]/g, '').slice(0, 8) : '';
    if (!v) { toast('먼저 내 이름을 적어 주세요', 2.2); if (nm) nm.focus(); return; }
    name = v; try { localStorage.setItem('mp.name', name); } catch (e) { /* */ }
    dispatchEvent(new CustomEvent('sm-name', { detail: name }));   // 동시 접속 이름표도 같은 이름으로(main.js)
    board = { id, ...info }; close(); endTour(); placing = null; moving = null; pathClear(); listen(); chips(); window.SM_ACT = (isW() ? '🌍 ' : '📝 ') + short(bare(info.t), 10);
    if (isW()) { boardView(); return; }   // 세계 판 = 학교와 따로 — 할 일이 모두 판 안이라 바로 연다(운동장에 덩그러니 서 있지 않게)
    toast('📌 「' + board.t + '」 — ' + (isTouch() ? '화면을 누른 채 끌면 둘러보기 · 땅을 톡 누르면 🚩 깃발 · 📖 이야기 판 칩' : '마우스로 끌면 둘러보기 · 땅을 톡 누르면 🚩 깃발 · L = 이야기 판'), 5);
  }
  const isTouch = () => document.body.classList.contains('touch');
  const worldBackHint = () => toast(isTouch() ? '🌍 「🌍 세계 판」 칩을 누르면 다시 열려요' : '🌍 L = 세계 판 다시 열기 · F = 카드 쓰기', 3);

  // ───────── 장면 · 덧붙인 것 ─────────
  const secs = () => (board && board.sec ? String(board.sec).split(/[,|]/).map((s) => s.trim()).filter(Boolean).slice(0, 6) : []);
  const secOf = (f, S) => S.length ? Math.min(S.length - 1, Math.max(0, f.sec | 0)) : 0;
  const placed = (f) => typeof f.x === 'number' && typeof f.z === 'number';
  const valid = (f) => f && typeof f === 'object' && f.k && typeof f.tx === 'string';
  const isScene = (f) => f.k === 'scene' || (!f.p && f.k !== 'place');
  // 🔗 갈래 합침 = 장면의 go가 '바로 다음 장면 번호'(n = 이 장면 번호) — DB 규칙에 있는 칸(go)으로 적음(새 칸은 규칙이 막는다) · 순서가 바뀌면 renumber가 go도 따라 고침 → 더는 바로 다음이 아니면 합침 표시도 풀림
  const joinedAt = (f, n) => !!f && isScene(f) && !f.end && +f.go === n + 1;
  function scenes() { const S = secs(); return Object.entries(DATA).filter(([, f]) => valid(f) && isScene(f)).sort((a, b) => secOf(a[1], S) - secOf(b[1], S) || (a[1].ord || 0) - (b[1].ord || 0) || (a[1].t || 0) - (b[1].t || 0)); }
  const kids = (sid) => Object.entries(DATA).filter(([, f]) => valid(f) && f.p === sid && !isScene(f)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0) || (a[1].t || 0) - (b[1].t || 0));
  const orphans = () => { const ok = new Set(scenes().map(([id]) => id)); return Object.entries(DATA).filter(([, f]) => valid(f) && !isScene(f) && !ok.has(f.p)); };
  const numMap = () => new Map(scenes().map(([id], i) => [id, i + 1]));
  const colOf = (n) => SC[(n - 1) % SC.length];
  const iconOf = (f) => isScene(f) ? (OLD[f.k] || '🎬') : (KBY[f.k] || PLACE).e;
  // 고르기 보기의 '→ N번' = 장면 순서 번호 → 순서가 바뀌거나 장면이 지워지면 새 번호로 고쳐 씀(before = 바뀌기 전 numMap — 새 장면은 그 끝 번호로 넣어 부르면 '새로 쓸 장면' 번호도 따라감)
  function renumber(before, gone) {
    const after = new Map(scenes().map(([sid], i) => [sid, i + 1])), map9 = new Map();
    for (const [sid, n] of before) { if (sid === gone) { map9.set(n, '?'); continue; } const m = after.get(sid); if (m && m !== n) map9.set(n, m); }   // 지운 장면을 가리키던 보기 = '?번'(코치가 짚음)
    if (!map9.size) return;
    for (const [cid, x] of Object.entries(DATA)) {
      if (valid(x) && (x.k === 'quiz' || isScene(x)) && x.go && map9.has(+x.go)) { const v = map9.get(+x.go), go = v === '?' ? null : v; x.go = go; req(fpath(cid), 'PATCH', { go }).catch(() => {}); continue; }
      if (!valid(x) || x.k !== 'choice' || !x.opt) continue;
      const opt = x.opt.split('\n').map((ln) => /→|->|=>/.test(ln) ? ln.replace(/((?:→|->|=>)\s*)(\d{1,2})(\s*번)/g, (m, a, n, b) => map9.has(+n) ? a + map9.get(+n) + b : m)   // 화살표 뒤 번호만(보기 글 속 '1번 사물함'은 그대로)
        : ln.replace(/(\d{1,2})(\s*번\s*장면)/g, (m, n, b) => map9.has(+n) ? map9.get(+n) + b : m)).join('\n');   // 화살표 없는 옛 글 '3번 장면으로'
      if (opt !== x.opt) { x.opt = opt; req(fpath(cid), 'PATCH', { opt }).catch(() => {}); }
    }
  }
  async function moveTo(id, sec, before) {   // 장면 순서: before 앞(없으면 칸 끝)
    if (!canWrite()) return lockMsg();
    const was = numMap();
    const S = secs(), L = scenes().filter(([i, f]) => i !== id && secOf(f, S) === sec), k = before ? L.findIndex(([i]) => i === before) : L.length, at = k < 0 ? L.length : k;
    const p = at > 0 ? L[at - 1][1].ord || 0 : null, n = at < L.length ? L[at][1].ord || 0 : null;
    const ord = p == null && n == null ? Date.now() : p == null ? n - 1000 : n == null ? p + 1000 : (p + n) / 2;
    const patch = { ord }; if (S.length) patch.sec = sec;
    if (DATA[id]) Object.assign(DATA[id], patch); renumber(was); syncNow();
    try { await req(fpath(id), 'PATCH', patch); } catch (e) { toast('순서를 바꾸지 못했어요', 2); }
  }

  // ───────── 깃발(3D) — 장면 색·번호 ─────────
  const FL = new Map();
  const mats = new Map(), lam = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); return mats.get(c); };
  const poleG = new THREE.CylinderGeometry(0.035, 0.035, 2.1, 6), clothG = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 2.05, 0, 0.75, 1.82, 0, 0, 1.55, 0], 3)); g.computeVertexNormals(); return g; })();
  function tag(num, text, col) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
    g.font = '800 38px sans-serif'; const tw = Math.min(380, g.measureText(text).width), w = tw + 110;
    const x0 = (512 - w) / 2;
    g.fillStyle = 'rgba(255,253,246,.96)'; g.beginPath(); g.roundRect(x0, 8, w, 80, 24); g.fill(); g.strokeStyle = '#1d3557'; g.lineWidth = 4; g.stroke();
    g.fillStyle = hex(col); g.beginPath(); g.arc(x0 + 44, 48, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '900 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), x0 + 44, 50);
    g.fillStyle = '#1d3557'; g.font = '800 38px sans-serif'; g.textAlign = 'left'; g.fillText(text, x0 + 86, 50, 380);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(2.6, 0.49, 1); return s;
  }
  function drop3d(id) { const F = FL.get(id); if (!F) return; map.remove(F.g); F.tag.material.map.dispose(); F.tag.material.dispose(); if (F.hot) F.hot.remove(); FL.delete(id); }
  function label3d(f) { if (isScene(f)) return (f.end ? '🏁 ' : '🎬 ') + short(f.tx, 10); if (f.k === 'place') return '📍 ' + (short(f.tx, 10) || short(nearOf(f) || f.zone, 10)); return (KBY[f.k] || PLACE).e + ' ' + short(f.who || f.tx, 10); }
  const sigOf = (f, num) => [num, f.k, f.tx, f.who, f.x, f.y, f.z, f.end].join('|');
  function draw3d(id, f, num) {
    drop3d(id);
    const col = num ? colOf(num) : 0xadb5bd, g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); g.add(new THREE.Mesh(clothG, lam(col)));
    const tg = tag(num || '?', label3d(f), col); tg.position.y = 2.55; g.add(tg);
    g.visible = !play; map.add(g);   // 해 보는 동안 새로 그린 깃발도 숨김
    const hot = map.interact.add({ x: f.x, y: floorOf(f).lv, z: f.z, r: 1.6, label: (num ? num + '번 장면' : '깃발') + ' 보기', use: () => { if (!play) view(isScene(f) ? id : f.p); } });
    if (hot && hot.hot) hot.hot.off = !!play;   // 해 보는 동안 'E n번 장면 보기' 안내도 끔
    FL.set(id, { g, tag: tg, sig: sigOf(f, num), hot });
  }
  const flagsShow = (on) => { for (const F of FL.values()) { F.g.visible = on; if (F.hot && F.hot.hot) F.hot.hot.off = !on; } };
  let syncT = 0;
  function sync() { if (!syncT) syncT = setTimeout(syncNow, 40); }
  function syncNow() {
    clearTimeout(syncT); syncT = 0; if (dead) return;
    if (isW()) {
      const live = new Set(), marks = [];
      // 세계 판 = 학교와 따로인 새 세계 → 학교 안 깃발·미니맵 표식 없음(예전에 꽂힌 자리는 무시)
      for (const id of [...FL.keys()]) if (!live.has(id)) drop3d(id);
      if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '🌍 ') + short(bare(board.t), 14) + ' · 카드 ' + wcards().length + '개');
      map.minimap.setMarks(marks);
      if (panel && (panel.id === 'memo-board' || panel.id === 'memo-view')) rerender();
      return;
    }
    const N = numMap(), live = new Set(), marks = [];
    for (const [id, f] of Object.entries(DATA)) {
      if (!valid(f) || !placed(f)) continue; live.add(id);
      const num = N.get(isScene(f) ? id : f.p) || 0;
      if (!FL.get(id) || FL.get(id).sig !== sigOf(f, num)) draw3d(id, f, num);
      marks.push({ x: f.x, z: f.z, color: hex(num ? colOf(num) : 0xadb5bd), label: String(num || '?'), floor: (f.y || 0) > 2.5 ? 2 : 1 });
    }
    for (const id of [...FL.keys()]) if (!live.has(id)) drop3d(id);
    if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '📌 ') + short(bare(board.t), 14) + ' · 장면 ' + N.size + '개');
    if (!play) map.minimap.setMarks(marks);
    if (panel && (panel.id === 'memo-board' || panel.id === 'memo-view')) rerender();
    if (tourEl) showTour(false);
    pathSoon();
  }

  // ───────── 장면 카드(이야기 판·장면 보기·걸어 보기 공용) ─────────
  const openRe = new Set();
  const linkN = (h) => h.replace(/((?:→|-&gt;|=&gt;)\s*)(\d{1,2})(\s*번(?:\s*장면)?)|(\d{1,2})(\s*번\s*장면)/g, (m, a, n, b, n2) => { const k = a !== undefined ? n : n2;   // '→ 3번 장면'·'3번 장면' → 그 장면 보기('1번 사물함'은 글 그대로)
    return (a || '') + '<a href="#" data-a="jump" data-n="' + k + '" style="color:#1c7ed6;font-weight:800">' + (a !== undefined ? n + b : m) + '</a>'; });
  function placeLine(f) { return '📍 ' + esc(whereOf(f)); }
  function cardHTML(id, f, num, o = {}) {
    const lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name)), can = canWrite(), own = (x) => teacher || x.by === name;
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [];
    const K = kids(id), spot = sceneSpot(id), places = [f, ...K.map(([, x]) => x)].filter(placed).length, hid = K.filter(([, x]) => placed(x) && (x.k === 'item' || x.k === 'quiz')).length, showRe = o.re || openRe.has(id);
    let h = '<div class="cd' + (f.end ? ' end' : '') + '" data-id="' + esc(id) + '" style="--k:' + hex(colOf(num)) + '"><div class="hd" title="끌어서 순서 바꾸기"><span class="num" style="background:' + hex(colOf(num)) + '">' + num + '</span>' + (OLD[f.k] ? OLD[f.k] + ' ' : '') + '장면' + (f.end ? ' <span style="background:#fff3bf;border:1px solid #f59f00;border-radius:8px;padding:0 6px;font-size:12px">🏁 결말</span>' : joinedAt(f, num) ? ' <span title="갈래를 일부러 합쳤어요 — 다음 장면으로 그대로 이어져요" style="background:#e7f5ff;border:1px solid #74c0fc;border-radius:8px;padding:0 6px;font-size:12px">🔗 이어짐</span>' : '') + '<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + '<div class="tx">' + esc(f.tx) + '</div>'
      + (spot ? '<div class="pl">' + placeLine(spot[1]) + (places > 1 ? ' · 🚩 ' + places + '개' : '') + '</div>'   // 장면 자리 = sceneSpot(📦·🔐 숨긴 자리는 장면 자리가 아님)
        : '<div class="pl none">' + (can ? '<button class="nf" data-a="flag">📍 장면이 일어나는 곳 깃발이 아직 없어요 — 🚩 꽂으러 가기</button>' : '📍 아직 깃발이 없어요') + (hid ? ' <span class="sm">· 📦🔐 찾는 자리 깃발 ' + hid + '개는 따로</span>' : '') + '</div>');
    for (const [kid, x] of K) {
      const A = KBY[x.k] || PLACE;
      const where = placed(x) ? ' <span class="sm">📍 ' + esc(nearOf(x) || x.zone) + '</span>' : '';
      h += '<div class="it" data-kid="' + esc(kid) + '"><span>' + (x.k === 'quiz' && x.qt === 'item' ? '🔒' : A.e) + '</span><span class="t">' + (x.k === 'quiz' ? quizLine(x) + where : x.k === 'place' ? '<b>일어나는 곳</b> ' + esc(x.tx) + where
          : (x.who ? '<b>' + esc(x.who) + '</b> ' : '') + (x.k === 'say' ? '“' + esc(x.tx) + '”' : esc(x.tx)) + (x.opt ? '<br><span class="sm">' + linkN(esc(x.opt)).replace(/\n/g, '<br>') + '</span>' : '') + where)
        + '<span class="sm"> · ' + esc(x.by) + '</span></span>'
        + (placed(x) && !o.noGo ? '<button data-a="goi" title="그 자리로">🚶</button>' : '')
        + (can && own(x) && !o.noAdd && !placed(x) && FLAGK.has(x.k) ? '<button class="nf" data-a="flagi" title="학교에 깃발 꽂기(숨기는 자리·있는 자리)">🚩</button>' : '')   // 먼저 쓴 📦 열쇠 등을 나중에 숨기러
        + (can && own(x) ? '<button data-a="editi" title="고치기 · 깃발 옮기기">✏️</button>' : '') + '</div>';
    }
    if (can && !o.noAdd) h += '<div class="add">' + ADD.map((A) => '<button data-a="add" data-k="' + A.k + '">＋ ' + A.e + ' ' + A.n + '</button>').join('') + (spot ? '<button data-a="flag" title="이 장면에 깃발을 하나 더 꽂으러">＋ 🚩 깃발</button>' : '') + '</div>';   // 깃발이 없으면 위의 '꽂으러 가기'가 같은 일
    h += '<div class="ft"><button data-a="like" class="' + (me ? 'on' : '') + '" title="좋아요">' + (me ? '❤️' : '🤍') + ' ' + (lk.length || '') + '</button><button data-a="re" title="댓글">💬 ' + (re.length || '') + '</button><span style="flex:1"></span>'
      + (spot && !o.noGo ? '<button data-a="go" title="이 장면 자리로 가 보기">🚶</button>' : '') + (can && own(f) ? '<button data-a="edit" title="장면 고치기 · 깃발 옮기기">✏️</button>' : '') + '</div>';
    if (showRe) h += '<div class="res">' + (re.map(([rid, r]) => '<div>💬 <b>' + esc(r.by) + '</b> ' + esc(r.tx) + (teacher || r.by === name ? ' <button class="x" data-a="rd" data-r="' + esc(rid) + '" title="댓글 지우기">✕</button>' : '') + '</div>').join('') || '<div class="sm">아직 댓글이 없어요</div>')
      + (can ? '<div class="ri"><input maxlength="120" placeholder="댓글 달기 (Enter)"><button data-a="rs">보내기</button></div>' : '') + '</div>';
    return h + '</div>';
  }
  async function sendRe(card) {
    const id = card.dataset.id, inp = card.querySelector('.ri input'), tx = inp && inp.value.trim(); if (!tx) return;
    if (!canWrite()) return lockMsg();
    inp.value = '';
    try { await req(fpath(id) + '/re/r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), 'PUT', { by: name, tx: tx.slice(0, 120), t: { '.sv': 'timestamp' } }); map.sfx('ding'); } catch (e) { inp.value = tx; toast('댓글을 보내지 못했어요', 2); }
    flush();
  }
  const quizAns = (x) => (x.qt || 'text') === 'pick' ? String(x.opt || '').split('\n')[x.ok | 0] || '' : x.qt === 'item' ? '📦 ' + ((DATA[x.item] || {}).tx || '?') + ' 있으면 열림' : String(x.ans || '');
  function quizLine(x) {
    const see = teacher || x.by === name, go = x.go ? ' · 맞히면 ' + linkN('→ ' + x.go + '번 장면') : '';
    return '<b>' + (QTL[x.qt || 'text'] || '퀴즈') + '</b> ' + esc(x.tx)
      + ((x.qt === 'pick') && x.opt ? '<br><span class="sm">보기: ' + String(x.opt).split('\n').map(esc).join(' / ') + '</span>' : '')
      + '<br><span class="sm">' + (see ? '🔑 ' + esc(quizAns(x)) + (x.hint ? ' · 💡 ' + esc(x.hint) : '') : '🔑 정답은 쓴 친구·선생님만 봐요' + (x.hint ? ' · 💡 힌트 있음' : '')) + go + '</span>';
  }
  // 장면 자리 = 장면 깃발 → 📍 일어나는 곳 → 🧑·💬 → 그 밖(고르기) — 📦 숨긴 물건·🔐 퀴즈 자리는 장면 자리가 아님(따로 찾아가는 곳 · 답이 새지 않게)
  //   걸어 보기·현실 체크인·준비물·이야기 길·코치·카드가 모두 이 하나를 씀 → [id, f] | null
  function sceneSpot(id) {
    const f = DATA[id]; if (f && placed(f)) return [id, f];
    const K = kids(id).filter(([, x]) => placed(x) && x.k !== 'item' && x.k !== 'quiz');
    return K.find(([, x]) => x.k === 'place') || K.find(([, x]) => x.k === 'who' || x.k === 'say') || K[0] || null;
  }
  function firstPlace(id) { const s = sceneSpot(id); return s ? s[1] : null; }
  // 해 보기 차례 = 쓴 순서 · 다만 같은 장면의 📦 열쇠보다 먼저 쓴 🔒 자물쇠는 열쇠 바로 뒤로(앞에 두면 '돌아가 찾기'가 끝없이 돎)
  function playKids(sid) {
    const K = kids(sid);
    for (let a = 0; a < K.length; a++) { const x = K[a][1]; if (x.k === 'quiz' && x.qt === 'item') { const j = K.findIndex(([k]) => k === x.item); if (j > a) { K.splice(j, 0, K.splice(a, 1)[0]); a--; } } }
    return K;
  }
  function wire(P) {
    P.addEventListener('click', async (e) => {
      const j = e.target.closest('a[data-a="jump"]'); if (j && P.contains(j)) { e.preventDefault(); const L = scenes(), t = L[+j.dataset.n - 1]; if (t) { if (tourEl && P === tourEl) { tourI = +j.dataset.n - 1; showTour(true); } else view(t[0]); } else toast(j.dataset.n + '번 장면은 아직 없어요', 2); return; }
      const b = e.target.closest('button'); if (!b || !P.contains(b)) return;
      const cd = b.closest('.cd'), id = cd && cd.dataset.id, f = id && DATA[id], a = b.dataset.a;
      if (!a || !cd || !f) return;
      const it = b.closest('.it'), kid = it && it.dataset.kid;
      if (a === 'like') {
        if (!canWrite()) return lockMsg();
        const k = keyOf(name), on = f.lk && f.lk[k];
        f.lk = { ...(f.lk || {}) }; if (on) delete f.lk[k]; else f.lk[k] = true; syncNow();
        try { await req(fpath(id) + '/lk/' + encodeURIComponent(k), on ? 'DELETE' : 'PUT', on ? undefined : true); } catch (er) { toast('저장하지 못했어요', 2); }
      } else if (a === 're') { if (openRe.has(id)) openRe.delete(id); else openRe.add(id); rerender(true); const inp = P.querySelector('.cd[data-id="' + window.CSS.escape(id) + '"] .ri input'); if (inp) inp.focus(); }
      else if (a === 'rs') sendRe(cd);
      else if (a === 'rd') { if (!confirm('이 댓글을 지울까요?')) return; try { await req(fpath(id) + '/re/' + encodeURIComponent(b.dataset.r), 'DELETE'); } catch (er) { toast('지우지 못했어요', 2); } }
      else if (a === 'go') { const p = firstPlace(id); if (p) { close(); goTo(p); } }
      else if (a === 'goi') { const x = DATA[kid]; if (x && placed(x)) { close(); goTo(x); } }
      else if (a === 'edit') { back = panel && panel.id === 'memo-board' ? 'board' : null; if (tourEl) endTour(); form({ id }); }
      else if (a === 'editi') { back = panel && panel.id === 'memo-board' ? 'board' : null; if (tourEl) endTour(); form({ id: kid }); }
      else if (a === 'add') { if (!canWrite()) return lockMsg(); back = panel && panel.id === 'memo-board' ? 'board' : null; if (tourEl) endTour(); form({ scene: id, kind: b.dataset.k }); }
      else if (a === 'flag') { if (isW()) return; if (!canWrite()) return lockMsg(); close(); endTour(); moving = null; placing = id; chips(); toast('🚩 ' + (numMap().get(id) || '') + '번 장면 — 꽂을 땅을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5); }   // 세계 판 = 학교 깃발 없음
      else if (a === 'flagi') { if (kid) startMove(kid); }   // 덧붙인 것(📦 열쇠 등)에 나중에 깃발
    });
    P.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ri input') && !e.isComposing) { e.preventDefault(); sendRe(e.target.closest('.cd')); } });
    P.addEventListener('focusout', () => setTimeout(flush, 400));
  }
  let pend = false, drag = null;
  const busy = () => { const a = document.activeElement; return !!drag || !!(panel && a && panel.contains(a) && a.matches('input,textarea') && a.value); };
  function rerender(force) { if (!panel) return; if (!force && busy()) { pend = true; return; } pend = false; if (panel.id === 'memo-board') boardView(); else if (panel.id === 'memo-view') view(viewId); }
  function flush() { if (pend && !busy()) rerender(); }

  // ───────── 📖 이야기 판 ─────────
  const coachChips = (C) => C.map((c) => '<span class="cc ' + (c.ok ? 'ok' : 'no') + '"' + (c.b ? ' data-b="' + esc(c.b) + '"' : '') + '>● ' + esc(c.t) + '</span>').join('');   // 코치 칩(🧭 이야기·세계 공용 · data-b = 누르면 그 일로)
  function boardView() {
    if (!board) return;
    if (isW()) return worldView();
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const S = secs(), L = scenes(), N = new Map(L.map(([id], i) => [id, i + 1])), can = canWrite(), O = orphans();
    let h = '<div class="top"><h3>📖 ' + esc(bare(board.t)) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + (teacher ? '<button class="sub" data-b="sec" title="이야기 칸 정하기">⚙️ 칸</button><button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button><button class="sub" data-b="admin" title="판 비우기·되돌리기">🗂 관리</button>' : '<button class="sub" data-b="t" title="선생님만">🔒 선생님</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="bar">' + (can ? '<button data-b="new">＋ 새 장면</button>' : '') + (L.length ? '<button data-b="play" style="background:#2b8a3e">' + (Object.values(DATA).some((x) => valid(x) && x.k === 'quiz') ? '🔐 방탈출로 해 보기' : '🎮 이야기로 해 보기') + '</button><button class="sub" data-b="book">📖 책처럼 읽기</button>' : '') + (L.length ? '<button class="sub" data-b="real" title="태블릿 들고 진짜 학교에서">🏫 현실 방탈출</button>' : '') + '<button class="sub" data-b="tour">▶ 장면 따라 걷기</button><button class="sub" data-b="sum">📤 정리</button>'
      + '<span class="sm" style="margin-left:6px">' + (can ? '장면 번호 줄을 끌면 순서가 바뀌어요' : '선생님이 잠근 판 — 보기만') + '</span></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    if (!L.length) body.innerHTML = '<div class="sm" style="padding:24px;text-align:center;font-size:15px;line-height:1.8">아직 장면이 없어요.<br><b>＋ 새 장면</b>으로 「무슨 일이 일어나는지」부터 적어 봐요.<br>그다음 장면마다 🧑 인물 · 💬 대사 · 📦 물건을 덧붙이고, 학교에 🚩 깃발을 꽂아요.</div>';
    else if (S.length) body.innerHTML = '<div class="lanes">' + S.map((s, si) => '<div class="lane" data-sec="' + si + '"><h4>' + (si + 1) + '. ' + esc(s) + '</h4>' + L.filter(([, f]) => secOf(f, S) === si).map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>').join('') + '</div>';
    else body.innerHTML = '<div class="strip" data-sec="0">' + L.map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>';
    stripWrap(body);
    if (L.length) el('div', 'coach', '<b>🧭 이야기 코치</b> ' + coachChips(coach()), body);
    if (O.length) el('div', 'sm', '📌 장면에 아직 안 붙인 것 ' + O.length + '개 — ' + O.map(([, x]) => (KBY[x.k] || PLACE).e + ' ' + esc(short(x.who || x.tx || x.zone, 14))).join(' · '), body).style.marginTop = '12px';
    body.scrollTop = sc[0]; body.scrollLeft = sc[1];
    P.onclick = async (e) => {
      const b = e.target.closest('[data-b]'); if (!b || b.closest('.cd')) return;
      const a = b.dataset.b;
      if (a === 'close') close();
      else if (a === 'new') { if (!canWrite()) return lockMsg(); back = 'board'; form({ kind: 'scene' }); }
      else if (a === 'tour') startTour(0);
      else if (a === 'play') playStory();
      else if (a === 'book') playStory({ book: true });
      else if (a === 'real') realMenu();
      else if (a === 'noflag') { if (!canWrite()) return lockMsg(); const t = scenes().find(([id]) => !sceneSpot(id)); if (t) { close(); moving = null; placing = t[0]; chips(); toast('🚩 ' + (numMap().get(t[0]) || '') + '번 장면 — 장면이 일어나는 곳을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5); } }
      else if (a.startsWith('ed:')) { const id = a.slice(3); if (DATA[id]) { back = 'board'; form({ id }); } }   // 코치 칩 → 그 장면 고치기(🏁 등)
      else if (a === 'sum') summary();
      else if (a === 't') teacherLogin();
      else if (a === 'admin') admin();
      else if (a === 'sec') {   // 칸을 바꾸면 장면 번호가 바뀔 수 있음 → 보기·퀴즈의 '→ N번'도 새 번호로
        const s = secPrompt(board.sec); if (s == null) return; const was = numMap();
        try { await req('/boardList/' + board.id, 'PATCH', { sec: s || null }); } catch (er) { return toast('바꾸지 못했어요', 2); }
        board.sec = s || null; renumber(was); boardView();
      }
      else if (a === 'lock') { try { await req('/boardList/' + board.id + '/lock', 'PUT', !board.lock); } catch (er) { toast('바꾸지 못했어요', 2); } }
    };
  }
  // 한 줄 흐름(칸 없는 판)에서 줄 끝 카드는 ➜ 대신 아래 ↩(10-04 재시험: 다음 카드가 둘째 줄로 내려가도 ➜가 오른쪽 가장자리 밖을 가리켰다) — 그린 뒤·창 크기가 바뀔 때만
  function stripWrap(root) { const S9 = root && root.querySelector('.strip'); if (!S9) return; const C = [...S9.children].filter((c) => c.classList.contains('cd')); C.forEach((c, i) => { const n = C[i + 1]; c.classList.toggle('wrap', !!n && n.offsetTop > c.offsetTop + 4); }); }
  const onRs = () => { if (panel && panel.id === 'memo-board') stripWrap(panel); };
  addEventListener('resize', onRs);
  // 장면 끌기(번호 줄을 잡고 — 마우스·터치 같음)
  function dragWire(P) {
    P.addEventListener('pointerdown', (e) => {
      const hd = e.target.closest('.cd .hd'), cd = hd && hd.closest('.cd'); if (isW() || !cd || e.button > 0 || !P.querySelector('.body').contains(cd)) return;
      if (!canWrite()) return;
      const id = cd.dataset.id, sx = e.clientX, sy = e.clientY, horiz = !!cd.closest('.strip');
      let ghost = null, tgt = null;
      const clear = () => P.querySelectorAll('.dB,.dA,.dE').forEach((n) => n.classList.remove('dB', 'dA', 'dE'));
      const nextCard = (n) => { while (n && !(n.classList && n.classList.contains('cd'))) n = n.nextElementSibling; return n; };
      const mv = (ev) => {
        if (!ghost) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; drag = id; ghost = cd.cloneNode(true); ghost.classList.add('ghost'); ui.appendChild(ghost); cd.classList.add('drag'); }
        ev.preventDefault(); ghost.style.left = ev.clientX - 30 + 'px'; ghost.style.top = ev.clientY - 14 + 'px';
        clear(); tgt = null;
        const u = document.elementFromPoint(ev.clientX, ev.clientY), c = u && u.closest('.body .cd'), lane = u && u.closest('.lane,.strip');
        if (c && c !== cd) {
          const r = c.getBoundingClientRect(), after = horiz ? ev.clientX > r.left + r.width / 2 : ev.clientY > r.top + r.height / 2;
          c.classList.add(after ? 'dA' : 'dB');
          let nx = after ? nextCard(c.nextElementSibling) : c; if (nx === cd) nx = nextCard(cd.nextElementSibling);
          tgt = { sec: +c.closest('[data-sec]').dataset.sec, before: nx ? nx.dataset.id : null };
        } else if (lane && !c) { lane.classList.add('dE'); tgt = { sec: +lane.dataset.sec, before: null }; }
        const body = P.querySelector('.body'), br = body.getBoundingClientRect();   // 가장자리 가까이 끌면 판이 따라 굴러감
        if (ev.clientY > br.bottom - 40) body.scrollTop += 14; else if (ev.clientY < br.top + 40) body.scrollTop -= 14;
        if (ev.clientX > br.right - 40) body.scrollLeft += 14; else if (ev.clientX < br.left + 40) body.scrollLeft -= 14;
      };
      const up = () => {
        removeEventListener('pointermove', mv, true); removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true);
        if (!ghost) return; ghost.remove(); cd.classList.remove('drag'); clear(); drag = null;
        if (tgt) moveTo(id, tgt.sec, tgt.before); else rerender();
      };
      addEventListener('pointermove', mv, true); addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
    });
  }

  // ───────── 장면 하나 보기(깃발 E) ─────────
  let viewId = null;
  function view(id) {
    if (isW()) return wview(id);
    const L = scenes(), i = L.findIndex(([x]) => x === id); if (i < 0) { if (panel && panel.id === 'memo-view') close(); return; }
    const re = panel && panel.id === 'memo-view' && viewId === id, P = re ? panel : open('memo-view'); viewId = id;
    if (!re) wire(P);
    P.innerHTML = cardHTML(id, L[i][1], i + 1, { re: true, noGo: true }) + '<div class="row"><button class="sub" data-v="board">📖 이야기 판</button><button class="sub" data-v="close">닫기</button></div>';
    P.onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'board') boardView(); else close(); };
  }

  // ───────── 겨눔: 화면 가운데(F) · 마우스로 누른 곳 ─────────
  const _f = new THREE.Vector3(), _o = new THREE.Vector3(), cam = map.camera, RC = new THREE.Raycaster(), _ndc = new THREE.Vector2();
  function aimPoint(sx, sy) {
    let t0;
    if (sx != null) { _ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); RC.setFromCamera(_ndc, cam); _o.copy(RC.ray.origin); _f.copy(RC.ray.direction); t0 = 0.3; }
    else { _f.set(0, 0, -1).applyQuaternion(cam.quaternion); _o.copy(cam.position); const me = map.player.get(); t0 = Math.max(0, (me.x - _o.x) * _f.x + (me.y + 1 - _o.y) * _f.y + (me.z - _o.z) * _f.z) + 0.4; }
    const o = _o, D = 40;
    const a = [o.x + _f.x * t0, o.y + _f.y * t0, o.z + _f.z * t0], b = [o.x + _f.x * D, o.y + _f.y * D, o.z + _f.z * D];
    let r = map.q.ray(a, b);
    if (r === null) for (let k = 1; k <= 80; k++) { const t = k / 80, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t, g = map.q.groundAt(x, z, y + 0.5); if (g != null && y <= g + 0.05) { r = t; break; } }
    if (r === null) { if (sx != null) return null; const me = map.player.get(); return { x: +me.x.toFixed(2), y: +me.y.toFixed(2), z: +me.z.toFixed(2), feet: true }; }
    const x = a[0] + (b[0] - a[0]) * r, y = a[1] + (b[1] - a[1]) * r, z = a[2] + (b[2] - a[2]) * r, g = map.q.groundAt(x, z, y + 0.3);
    return { x: +x.toFixed(2), y: +(g != null && Math.abs(g - y) < 0.6 ? g : y).toFixed(2), z: +z.toFixed(2) };
  }
  // 근처 표지점 = 같은 구역 안의 것만(10-04 재시험: 과학실 안 깃발이 벽 너머 '가운데 마당 향나무 화분 길'로 찍혀 해 보기가 아이를 바깥 마당으로 안내했다)
  //   · 실내 구역 = 그 방 안 표지점만 · 바깥 = 바깥 표지점 중 가려지지 않은 것(표지점 자체의 나무 줄기 등은 r 안이면 봐줌)
  function placeName(x, y, z) {
    const zn = map.zoneAt(x, y + 0.2, z) || map.zoneAt(x, y, z), inn = !!(zn && zn.indoor);
    let near = '', bd = 12;
    for (const p of map.pois({ src: 'landmark' })) {
      const d = Math.hypot(p.x - x, p.z - z); if (d >= bd || Math.abs((p.y || 0) - y) >= 3) continue;
      const pz = p.zone ? map.zone(p.zone) : null;
      if (inn ? !zn || p.zone !== zn.id : pz && pz.indoor) continue;
      if (!inn && d > 0.5) { const a = [x, y + 1.2, z], b = [p.x, (p.y || 0) + 1.2, p.z], L9 = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), t = map.q.ray(a, b); if (t !== null && t * L9 < L9 - Math.max(1.5, p.r || 0)) continue; }
      bd = d; near = p.label;
    }
    if (near && zn && (zn.label.includes(near) || near.includes(zn.label))) near = '';   // '놀이터 · 놀이터 근처'처럼 구역 이름과 겹치면 뺌
    return { zone: zn ? zn.label : '학교 바깥', near };
  }
  // 저장된 near는 예전 규칙(벽 너머 표지점)일 수 있음 → 보일 때마다 지금 규칙으로 다시(자리별 기억 · 누를 때·그릴 때만)
  const nearC = new Map();
  function nearOf(f) {
    if (!placed(f)) return f.near || ''; const k = f.x + ',' + (f.y || 0) + ',' + f.z;
    if (!nearC.has(k)) { if (nearC.size > 400) nearC.clear(); nearC.set(k, placeName(f.x, f.y || 0, f.z).near); } return nearC.get(k);
  }
  const whereOf = (f) => (f.zone || '') + (nearOf(f) ? ' · ' + nearOf(f) + ' 근처' : '');
  // 깃발 밑 바닥 높이 — 서가·책상 윗면(0.3~3m 위)에 꽂힌 깃발이면 그 방 바닥(2층 구역이면 2층 바닥) · 아니면 깃발 높이 그대로
  function floorOf(f) {
    const fy = f.y || 0, zn = map.zoneAt(f.x, fy + 0.2, f.z) || map.zoneAt(f.x, fy, f.z), b = zn && zn.floor === 2 && zn.y != null ? zn.y : map.q.baseAt(f.x, f.z);
    return { zn, lv: fy - b > 0.3 && fy - b < 3 ? b : fy };
  }
  const placeFields = (pt) => { const pn = placeName(pt.x, pt.y, pt.z), c = cam.position; return { x: pt.x, y: pt.y || 0, z: pt.z, zone: String(pn.zone || '').slice(0, 40), near: String(pn.near || '').slice(0, 40), cam: [c.x, c.y, c.z].map((v) => +v.toFixed(2)) }; };
  // 땅을 톡 → 그 자리에 '🚩 여기에 꽂기' 단추(누르면 꽂기 창) · 다른 데를 누르거나 움직이면 사라짐
  let hereEl = null, herePt = null, hereMk = null;
  function hereOff() { if (hereEl) hereEl.remove(); hereEl = null; herePt = null; if (hereMk) { hereMk.remove(); hereMk = null; } }
  // 마우스·손가락으로 깃발(천·이름표)을 누름 → 그 장면 보기(누를 때만 — 매 프레임 비용 없음) · 벽 너머 깃발은 안 됨
  const _hits = [], _pv = new THREE.Vector3();
  function flagAt(px, py) {
    if (!FL.size) return null;
    _ndc.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); RC.setFromCamera(_ndc, cam);   // setFromCamera가 RC.camera도 정함(이름표 Sprite 맞히기)
    const o = RC.ray.origin, dr = RC.ray.direction, w = map.q.ray([o.x + dr.x * 0.3, o.y + dr.y * 0.3, o.z + dr.z * 0.3], [o.x + dr.x * 40, o.y + dr.y * 40, o.z + dr.z * 40]), wall = w === null ? 1e9 : 0.3 + w * 39.7;
    let best = null, bd = wall + 0.2;
    for (const [id, F] of FL) { if (!F.g.visible || !DATA[id]) continue; _hits.length = 0; RC.intersectObject(F.g, true, _hits); if (_hits.length && _hits[0].distance < bd) { bd = _hits[0].distance; best = id; } }
    if (best) return best;
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z; let bp = 1e9;   // 이름표 둘레 너그럽게(손가락) — 화면에 비친 이름표·천 가운데에서 34~110px
    for (const [id, F] of FL) {
      if (!F.g.visible || !DATA[id]) continue;
      for (const dy of [2.55, 1.8]) {
        const wx = F.g.position.x, wy = F.g.position.y + dy, wz = F.g.position.z, L = Math.hypot(wx - cx, wy - cy, wz - cz); if (L > 30) continue;
        _pv.set(wx, wy, wz).project(cam); if (_pv.z > 1 || _pv.z < -1) continue;
        const sx = (_pv.x + 1) / 2 * innerWidth, sy = (1 - _pv.y) / 2 * innerHeight, d = Math.hypot(sx - px, sy - py), tol = Math.max(34, Math.min(110, 420 / Math.max(1, L)));
        if (d > tol || d >= bp) continue;
        const t = map.q.ray([cx, cy, cz], [wx, wy, wz]); if (t !== null && t * L < L - 0.9) continue;
        bp = d; best = id;
      }
    }
    return best;
  }
  let lockT = 0;
  function onWorldClick(e) {
    if (!board || panel || dead || play || isW()) return;   // 세계 판은 학교에 깃발을 꽂지 않는다
    const d = e.detail; hereOff();
    if (!placing && !moving) { const fid = flagAt(d.x, d.y); if (fid) { const f = DATA[fid]; view(isScene(f) ? fid : f.p); return; } }   // 깃발을 누름 = 그 장면 보기(옆에 같은 깃발을 또 꽂지 않게)
    if (!canWrite()) { placing = null; moving = null; const t = performance.now(); if (t - lockT > 4000) { lockT = t; lockMsg(); } return; }   // 잠근 판 = 꽂기 단추 없음
    const pt = aimPoint(d.x, d.y); if (!pt) return;
    if (moving) { moveAt(pt); return; }
    if (placing) { placeAt(pt); return; }
    herePt = pt; hereMk = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b });
    hereEl = el('button', '', '🚩 여기에 꽂기'); hereEl.id = 'memo-here'; hereEl.style.left = d.x + 'px'; hereEl.style.top = d.y + 'px';
    hereEl.onclick = (ev) => { ev.stopPropagation(); const p = herePt; hereOff(); back = null; form({ pt: p }); };
  }
  addEventListener('sm-click', onWorldClick);
  function onCmd(e) { const c = e.detail; if (!c || !board || c.b !== board.id || !c.s || dead) return; if (panel && panel.id !== 'memo-view') return; endTour(); view(c.s); }   // 선생님 발표: 그 장면 카드를 같이 봄
  addEventListener('sm-cmd', onCmd);
  let placing = null, moving = null;   // placing = 장면 id(그 장면에 📍 깃발 새로) · moving = 이미 쓴 카드 id(그 카드의 깃발을 꽂기·옮기기 — 같은 id라 퀴즈의 열쇠 연결·장소 번호가 그대로)
  async function placeAt(pt) {   // 장면 카드의 '＋ 🚩 깃발' → 그 장면의 장소 깃발
    const sid = placing; placing = null; chips(); if (!DATA[sid]) return;
    back = null; form({ pt, scene: sid, kind: 'place' });
  }
  const cardName = (id, f) => (numMap().get(isScene(f) ? id : f.p) || '?') + '번 장면 ' + iconOf(f) + ' 「' + short(f.who || f.tx || f.zone, 10) + '」';
  function startMove(id) {
    const f = DATA[id]; if (!f || isW()) return; if (!canWrite()) return lockMsg();
    if (!teacher && f.by !== name) return toast('✍️ ' + f.by + '의 것이에요 — 내가 쓴 것만 깃발을 옮길 수 있어요', 3);
    close(); back = null; endTour(); hereOff(); placing = null; moving = id; chips();
    toast('🚩 ' + cardName(id, f) + ' — ' + (placed(f) ? '옮길' : '꽂을') + ' 땅을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5);
  }
  async function moveAt(pt) {
    const id = moving; moving = null; chips(); const f = DATA[id]; if (!f || !pt) return;
    if (!canWrite()) return lockMsg(); if (!teacher && f.by !== name) return;
    const was = placed(f), pf = placeFields(pt), pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 2500);
    try { await req(fpath(id), 'PATCH', pf); } catch (e) { return toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); }   // PATCH = ❤️·댓글·순서·퀴즈 칸은 그대로
    if (DATA[id]) Object.assign(DATA[id], pf); syncNow(); map.sfx('ding');
    toast('🚩 ' + cardName(id, f) + ' 깃발을 ' + (was ? '옮겼어요' : '꽂았어요') + ' — 📍 ' + pf.zone, 2.8);
  }

  // ───────── 쓰기 창(장면 · 덧붙이기 · 깃발) ─────────
  //   o.id = 고치기 · o.pt = 이 자리에 깃발 · o.scene = 어느 장면에 · o.kind = 처음 고른 종류
  let lastScene = null;
  function form(o = {}) {
    if (!board) return;
    if (isW()) return wform(o);
    if (!canWrite()) { back = null; return lockMsg(); }   // 열리지 않은 창의 back이 남아 다음 창을 닫을 때 판이 다시 뜨지 않게
    const old = o.id ? DATA[o.id] : null; if (o.id && !old) { back = null; return; }
    if (old && !teacher && old.by !== name) { back = null; return toast('✍️ ' + old.by + '의 것이에요 — 내가 쓴 것만 고칠 수 있어요', 3); }
    const L = scenes(), N = new Map(L.map(([id], i) => [id, i + 1])), S = secs();
    const pt = old ? null : o.pt || null;
    let kind = old ? (isScene(old) ? 'scene' : old.k) : o.kind || (pt ? null : 'scene');
    let sid = old ? (isScene(old) ? null : old.p) : o.scene || (pt ? (lastScene && DATA[lastScene] ? lastScene : null) : null);
    if (pt && !o.scene && !L.length) kind = 'scene';   // 장면이 하나도 없으면 이 자리가 첫 장면
    if (pt && !kind && sid) kind = 'place';   // 지난번 장면이 골라져 있으면 '그 장면이 일어나는 곳'부터
    const pn = pt ? placeName(pt.x, pt.y, pt.z) : old && placed(old) ? { zone: old.zone, near: nearOf(old) } : null;
    if (pt) { const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 3000); }
    const P = open('memo-form');
    // 🔗 갈래 합치기 단추 = 이 장면이 '다른 보기의 갈래'로 흘러 들어갈 때(코치가 짚는 장면)나 이미 켜 둔 장면만 — 다른 장면엔 헷갈리지 않게 안 보임 · joinTo = 이어지는 장면 번호
    const joinTo = old && isScene(old) ? (() => { const G = graph(), i = G.L.findIndex(([k]) => k === o.id); return i >= 0 && i + 1 < G.L.length && (G.fall.has(i) || joinedAt(old, i + 1)) ? i + 2 : 0; })() : 0;
    let endSel = !!(old && old.end), joinSel = !!joinTo && joinedAt(old, joinTo - 1);
    // 새 장면의 칸 = 지금 마지막 장면의 칸(맨 끝에 붙어 앞 번호가 밀리지 않게 — '→ N번(새로 쓸 장면)'도 그대로 맞음) · 빈 판이면 첫 칸
    let secSel = old ? secOf(old, S) : o.sec != null ? o.sec : (L.length ? secOf(L[L.length - 1][1], S) : 0);
    let optRows = old && old.k === 'choice' ? choiceOpts(old).map((x) => ({ t: x.label, n: x.n || '' })) : [];
    let qt = old && old.k === 'quiz' ? old.qt || 'text' : 'text', qAns = old && old.ans || '', qHint = old && old.hint || '', qItem = old && old.item || '', qGo = old && old.go || '';
    let qRows = old && old.k === 'quiz' && old.qt === 'pick' ? String(old.opt || '').split('\n').map((t, i) => ({ t, ok: i === (old.ok | 0) })) : [{ t: '', ok: true }, { t: '', ok: false }];
    const readQuiz = () => { const g = (sel) => P.querySelector(sel); if (g('#mmAns')) qAns = g('#mmAns').value; if (g('#mmHint')) qHint = g('#mmHint').value; if (g('#mmItem')) qItem = g('#mmItem').value; if (g('#mmGo')) qGo = g('#mmGo').value;
      const rs = P.querySelectorAll('.qrows .qr'); if (rs.length) qRows = [...rs].map((inp, i) => ({ t: inp.value, ok: !!(qRows[i] && qRows[i].ok) })); };
    const readOpts = () => { const ts = P.querySelectorAll('.opts .ot'); if (!ts.length) return; optRows = [...ts].map((inp) => ({ t: inp.value, n: (P.querySelector('.opts .on[data-i="' + inp.dataset.i + '"]') || {}).value || '' })); };
    const draw = () => {
      const isS = kind === 'scene', A = KBY[kind] || null, n = sid ? N.get(sid) : null;
      let h = '<h3>' + (old ? '✏️ 고치기' : pt ? '🚩 깃발 꽂기' : isS ? '🎬 새 장면' : '＋ 덧붙이기') + '</h3>'
        + (pn ? '<div class="where">' + '📍 ' + esc(pn.zone) + (pn.near ? ' · ' + esc(pn.near) + ' 근처' : '') + (pt && pt.feet ? ' <span class="sm">(내 발밑)</span>' : '') + '</div>' : '');
      if (!old && (pt || (!o.scene && o.kind !== 'scene'))) {   // 어느 장면?(깃발 · 장면을 정하지 않고 덧붙일 때 — 판의 '＋ 새 장면'은 바로 글)
        h += '<div class="mlbl">' + (pt ? '이 깃발은 몇 번 장면이에요?' : '어느 장면이에요?') + '</div><div class="chips sc">'
          + L.map(([id, f], i) => '<button data-s="' + esc(id) + '" class="' + (!isS && sid === id ? 'on' : '') + '"><span class="num" style="background:' + hex(colOf(i + 1)) + '">' + (i + 1) + '</span>' + esc(short(f.tx, 14)) + '</button>').join('')
          + '<button data-s="@new" class="' + (isS ? 'on' : '') + '">＋ 새 장면</button></div>';
      } else if (!isS && n) h += '<div class="where"><span class="num" style="background:' + hex(colOf(n)) + '">' + n + '</span>번 장면 — ' + esc(short(DATA[sid].tx, 24)) + '</div>';
      if (!isS && (pt || !old)) {
        const opts = (pt ? [PLACE] : []).concat(ADD);
        h += '<div class="mlbl">' + (pt ? '여기에 무엇이 있어요?' : '무엇을 덧붙여요?') + '</div><div class="chips kd">' + opts.map((x) => '<button data-k="' + x.k + '" class="' + (kind === x.k ? 'on' : '') + '">' + x.e + ' ' + (x.k === 'place' ? '장면이 일어나는 곳' : x.n) + '</button>').join('') + '</div>';
      }
      const Q = isS ? SCENE : A;
      if (Q) {
        h += '<div class="mlbl">' + esc(Q.q) + '</div>';
        if (Q.who) h += '<input id="mmWho" maxlength="30" placeholder="' + esc(Q.who) + '" style="margin-bottom:6px">';
        if (isS) h += '<div class="chips stem">' + STEMS.map((t) => '<button data-stem="' + t + '">' + t + '…</button>').join('') + '</div>';
        h += '<textarea id="mmTx" maxlength="300"' + (isS && !old ? ' placeholder="' + stemFor(L.length) + '"' : '') + '></textarea>';
        if (isS) h += '<div class="chips"><button data-endt="1" class="' + (endSel ? 'on' : '') + '">🏁 이 장면에서 이야기가 끝나요(결말)</button>' + (joinTo ? '<button data-joint="1" class="' + (joinSel ? 'on' : '') + '">🔗 ' + joinTo + '번 장면으로 그대로 이어져요(갈래를 일부러 합쳤어요)</button>' : '') + '</div>';
        if (kind === 'choice') {   // SIM-1: 보기마다 '어느 장면으로?' 칸(4·5학년이 '→ N번' 문법을 몰라도) — 저장은 예전처럼 '글 → N번 장면' 줄
          const nn = L.length, rows = optRows.length ? optRows : [{ t: '', n: '' }, { t: '', n: '' }];
          h += '<div class="mlbl">보기 <span class="sm">(고르면 어느 장면으로 가요?)</span></div><div class="opts">' + rows.map((r, i) => '<div style="display:flex;gap:4px;margin:4px 0"><input class="ot" data-i="' + i + '" maxlength="40" placeholder="보기 ' + (i + 1) + ' (예: 급식실로 간다)" value="' + esc(r.t) + '" style="flex:1;min-width:0">'
            + '<select class="on" data-i="' + i + '" style="width:auto;max-width:46%;font:inherit;font-size:14px;border:2px solid #c9d3df;border-radius:10px;padding:6px"><option value="">→ 어느 장면?</option>' + L.map(([, sf], j) => '<option value="' + (j + 1) + '"' + (+r.n === j + 1 ? ' selected' : '') + '>→ ' + (j + 1) + '번 ' + esc(short(sf.tx, 10)) + '</option>').join('') + [1, 2, 3].map((d) => '<option value="' + (nn + d) + '"' + (+r.n === nn + d ? ' selected' : '') + '>→ ' + (nn + d) + '번(새로 쓸 장면)</option>').join('') + '</select></div>').join('') + '</div>'
            + (rows.length < 5 ? '<button class="sub" data-addopt="1" style="padding:4px 10px;font-size:13px">＋ 보기 더</button>' : '');
        }
        if (kind === 'quiz') {
          const items9 = Object.entries(DATA).filter(([, it]) => valid(it) && it.k === 'item'), sel9 = 'style="width:100%;font:inherit;font-size:15px;border:2px solid #c9d3df;border-radius:10px;padding:7px;margin-top:4px"';
          h += '<div class="mlbl">어떻게 풀어요?</div><div class="chips qt">' + QT.map(([k9, t9]) => '<button data-qt="' + k9 + '" class="' + (qt === k9 ? 'on' : '') + '">' + t9 + '</button>').join('') + '</div>';
          if (qt === 'text') h += '<input id="mmAns" maxlength="100" placeholder="🔑 정답 (여러 개면 쉼표로 — 예: 3, 세 칸)" value="' + esc(qAns) + '">';
          else if (qt === 'pick') h += '<div class="qrows">' + qRows.map((r, i) => '<div style="display:flex;gap:4px;margin:4px 0;align-items:center"><button data-qok="' + i + '" title="정답이면 눌러요" style="padding:4px 8px;background:' + (r.ok ? '#d3f9d8' : '#f1f3f5') + ';color:#1d3557">' + (r.ok ? '✅' : '⬜') + '</button><input class="qr" data-i="' + i + '" maxlength="40" placeholder="보기 ' + (i + 1) + '" value="' + esc(r.t) + '" style="flex:1;min-width:0"></div>').join('') + '</div>'
            + (qRows.length < 4 ? '<button class="sub" data-qadd="1" style="padding:4px 10px;font-size:13px">＋ 보기 더</button> ' : '') + '<span class="sm">✅ = 정답 보기</span>';
          else h += items9.length ? '<select id="mmItem" ' + sel9 + '><option value="">— 어떤 물건이 있어야 열려요? —</option>' + items9.map(([iid, it]) => '<option value="' + esc(iid) + '"' + (qItem === iid ? ' selected' : '') + '>📦 ' + esc(short(it.tx, 16)) + ' (' + (N.get(it.p) || '?') + '번 장면)</option>').join('') + '</select>' : '<div class="sm" style="color:#d9480f">먼저 앞 장면에 📦 물건 카드(예: 열쇠)를 만들어요</div>';
          h += '<input id="mmHint" maxlength="100" placeholder="💡 힌트 (안 써도 돼요)" style="margin-top:6px" value="' + esc(qHint) + '">'
            + '<div class="mlbl">맞히면 어디로?</div><select id="mmGo" ' + sel9 + '><option value="">→ 이 장면 다음 차례로</option>' + L.map(([, sf], j) => '<option value="' + (j + 1) + '"' + (+qGo === j + 1 ? ' selected' : '') + '>→ ' + (j + 1) + '번 ' + esc(short(sf.tx, 12)) + '</option>').join('') + [1, 2, 3].map((d) => '<option value="' + (L.length + d) + '"' + (+qGo === L.length + d ? ' selected' : '') + '>→ ' + (L.length + d) + '번(새로 쓸 장면)</option>').join('') + '</select>';
        }
        if (isS && S.length) h += '<div class="mlbl">이야기 칸</div><div class="chips sec">' + S.map((s, i) => '<button data-c="' + i + '" class="' + (secSel === i ? 'on' : '') + '">' + (i + 1) + '. ' + esc(s) + '</button>').join('') + '</div>';
      } else h += '<div class="sm" style="margin-top:8px">위에서 장면과 종류를 골라요.</div>';
      h += '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + (old && (isScene(old) || FLAGK.has(old.k) || placed(old)) ? '<button class="sub" id="mmMv" title="학교에서 이 깃발 자리를 다시 정해요">🚩 깃발 ' + (placed(old) ? '옮기기' : '꽂기') + '</button>' : '')
        + '<button class="sub" id="mmNo">취소</button><button id="mmOk"' + (Q && (isS || sid) ? '' : ' disabled style="opacity:.45"') + '>💾 저장</button></div>';
      readOpts(); readQuiz();
      const keep = { tx: (P.querySelector('#mmTx') || {}).value, who: (P.querySelector('#mmWho') || {}).value };
      P.innerHTML = h;
      const tx = P.querySelector('#mmTx'), wh = P.querySelector('#mmWho');
      if (tx) tx.value = keep.tx != null ? keep.tx : old ? old.tx || '' : '';
      if (tx && kind === 'quiz') tx.placeholder = qt === 'pick' ? '예) 급식실에 들어가는 문은 무슨 색일까요?' : qt === 'item' ? '예) 잠긴 상자가 있어요. 무엇으로 열까요?' : '예) 도서관 책장은 모두 몇 칸일까요?';   // 그 장소를 보고 푸는 문제(사람의 취향·개인 정보 말고)
      if (wh) wh.value = keep.who != null ? keep.who : old ? old.who || '' : '';
      if (tx) setTimeout(() => (wh && !wh.value ? wh : tx).focus(), 30);
    };
    P.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { if (b.dataset.s === '@new') { kind = 'scene'; sid = null; } else { sid = b.dataset.s; if (kind === 'scene' || !kind) kind = pt ? 'place' : 'who'; } draw(); return; }
      if (b.dataset.k) { kind = b.dataset.k; draw(); return; }
      if (b.dataset.stem) { const t = P.querySelector('#mmTx'); if (t) { const v = t.value.replace(new RegExp('^(' + STEMS.join('|') + ')[,\\s]*'), ''); t.value = b.dataset.stem + ' ' + v; t.focus(); } return; }
      if (b.dataset.endt) { endSel = !endSel; if (endSel) joinSel = false; P.querySelectorAll('[data-endt],[data-joint]').forEach((x) => x.classList.toggle('on', x.dataset.endt ? endSel : joinSel)); return; }
      if (b.dataset.joint) { joinSel = !joinSel; if (joinSel) endSel = false; P.querySelectorAll('[data-endt],[data-joint]').forEach((x) => x.classList.toggle('on', x.dataset.endt ? endSel : joinSel)); return; }
      if (b.dataset.addopt) { readOpts(); optRows.push({ t: '', n: '' }); draw(); return; }
      if (b.dataset.qt) { readQuiz(); qt = b.dataset.qt; draw(); return; }
      if (b.dataset.qok != null) { readQuiz(); qRows.forEach((r, i) => { r.ok = i === +b.dataset.qok; }); draw(); return; }
      if (b.dataset.qadd) { readQuiz(); qRows.push({ t: '', ok: false }); draw(); return; }
      if (b.dataset.c != null) { secSel = +b.dataset.c; P.querySelectorAll('.sec button').forEach((x) => x.classList.toggle('on', x === b)); return; }
      if (b.id === 'mmNo') done();
      else if (b.id === 'mmMv') {   // ✏️ 고치기 → 🚩 깃발 꽂기·옮기기(잘못 꽂은 자리 · 나중에 숨길 열쇠)
        const t9 = P.querySelector('#mmTx'); if (t9 && t9.value !== (old.tx || '') && !confirm('고친 글은 저장하지 않고 깃발만 옮길까요?')) return;
        startMove(o.id);
      } else if (b.id === 'mmDel') {
        const kc = isScene(old) ? kids(o.id).length : 0, others = isScene(old) ? kids(o.id).filter(([, x]) => x.by !== name) : [];
        const who9 = [...new Set(others.map(([, x]) => x.by || '친구'))];
        if (others.length && !teacher) return toast('🙋 ' + who9.slice(0, 3).join('·') + '이(가) 덧붙인 것이 있어서 지울 수 없어요 — ✏️ 장면 글을 고치거나 선생님께 부탁해요', 4);   // 친구 글이 같이 지워지지 않게
        if (!confirm(isScene(old) ? '이 장면을 지울까요?' + (kc ? '\n(덧붙인 것 ' + kc + '개도 함께 지워져요' + (others.length ? ' — ' + who9.slice(0, 4).join('·') + '이(가) 쓴 것 ' + others.length + '개 포함' : '') + ')' : '') : '이것을 지울까요?')) return;
        const was = isScene(old) ? numMap() : null, kidIds = isScene(old) ? kids(o.id).map(([k]) => k) : [];
        try { await Promise.all([req(fpath(o.id), 'DELETE'), ...kidIds.map((k) => req(fpath(k), 'DELETE'))]); } catch (er) { return toast('지우지 못했어요', 2); }   // 못 지웠으면 번호도 그대로
        if (was) { delete DATA[o.id]; for (const k of kidIds) delete DATA[k]; renumber(was, o.id); } done();
      } else if (b.id === 'mmOk') save();
    });
    const done = () => { if (back === 'board') { back = null; boardView(); } else close(); };
    async function save() {
      readOpts();
      const isS = kind === 'scene', tx = (P.querySelector('#mmTx') || {}).value || '', who = ((P.querySelector('#mmWho') || {}).value || '').trim(), opt = optRows.filter((r) => r.t.trim()).map((r) => r.t.trim().replace(TAIL, '') + (r.n ? ' → ' + r.n + '번 장면' : '')).join('\n');
      if (kind === 'choice' && !opt) return toast('보기를 하나 이상 적어요', 2);
      let qf = null;
      if (kind === 'quiz') {
        readQuiz();
        qf = { qt, ans: null, ok: null, item: null, opt: null, hint: qHint.trim() ? qHint.trim().slice(0, 100) : null, go: +qGo || null };
        if (qt === 'text') { if (!qAns.trim()) return toast('🔑 정답을 적어요', 2); qf.ans = qAns.trim().slice(0, 100); }
        else if (qt === 'pick') { const rows = qRows.filter((r) => r.t.trim()); if (rows.length < 2) return toast('보기를 두 개 이상 적어요', 2); const k9 = rows.findIndex((r) => r.ok); if (k9 < 0) return toast('✅로 정답 보기를 골라요', 2); qf.opt = rows.map((r) => r.t.trim().slice(0, 40)).join('\n'); qf.ok = k9; }
        else { if (!qItem || !DATA[qItem]) return toast('어떤 물건으로 여는지 골라요', 2); qf.item = qItem; }
      }
      if (!isS && !sid) return toast('몇 번 장면인지 골라 주세요', 2);
      if (!tx.trim() && kind !== 'place') return toast(isS ? '무슨 일이 일어나는지 적어 주세요' : '내용을 적어 주세요', 2);
      const f = { k: kind, tx: dedupe(tx).slice(0, 300), who: who && (kind === 'who' || kind === 'say') ? who.slice(0, 30) : null, opt: kind === 'choice' && opt ? opt.slice(0, 300) : null };
      if (qf) Object.assign(f, qf);
      const was = numMap();   // 장면이 앞 칸에 들어가거나 칸을 옮기면 번호가 밀림 → 저장한 뒤 보기·퀴즈의 '→ N번'을 새 번호로(moveTo와 같은 방식)
      try {
        if (old) {
          let moved = false;
          if (isS && S.length) { f.sec = secSel; if (secSel !== secOf(old, S)) { f.ord = Date.now(); moved = true; } }
          if (isS) { f.end = endSel || null; if (joinTo || old.go) f.go = joinSel && !endSel && joinTo ? joinTo : null; }
          await req(fpath(o.id), 'PATCH', f);
          if (moved && DATA[o.id]) { Object.assign(DATA[o.id], { sec: f.sec, ord: f.ord }); renumber(was); syncNow(); }
        } else {
          for (const k of Object.keys(f)) if (f[k] == null) delete f[k];
          Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }, pt ? placeFields(pt) : {});
          if (isS) { if (S.length) f.sec = secSel; if (endSel) f.end = true; } else f.p = sid;
          const nid = newId(); if (isS) was.set(nid, was.size + 1);   // 새 장면 = '다음에 쓸 장면' 번호 → 앞 칸에 들어가면 그 번호를 가리키던 보기도 따라감
          await req(fpath(nid), 'PUT', f); lastScene = isS ? nid : sid;
          if (isS) { if (!DATA[nid]) DATA[nid] = { ...f, t: Date.now() }; renumber(was); syncNow(); }   // 저장이 된 뒤에만(실패하면 친구 보기를 괜히 고치지 않게)
        }
        map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : pt ? '🚩 ' + (isS ? '새 장면' : (N.get(sid) || '') + '번 장면') + ' 깃발을 꽂았어요!' : isS ? '🎬 새 장면을 만들었어요!' : '＋ 덧붙였어요!', 2.2);
      } catch (e) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
      done();
    }
    draw();
  }

  // ───────── 🌍 세계 판 — 여섯 칸 · 까닭 · 장소(📍 어디쯤 — 학교 깃발 없음) · 코치 · 정리 ─────────
  const wcards = () => Object.entries(DATA).filter(([, f]) => valid(f) && WBY[f.k]);
  const likes = (f) => (f.lk ? Object.keys(f.lk).length : 0);
  function wcard(id, f, o = {}) {
    const C = WBY[f.k] || WC[0], lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name)), can = canWrite(), own = teacher || f.by === name;
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [], showRe = o.re || openRe.has(id);
    let h = '<div class="cd" data-id="' + esc(id) + '" style="--k:' + hex(C.c) + '"><div class="hd" style="cursor:default">' + C.e + ' ' + C.n + '<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + '<div class="tx">' + esc(f.tx) + '</div>'
      + (f.why ? '<div class="sm" style="background:#f8f9fa;border-radius:8px;padding:4px 7px;margin-bottom:4px;white-space:pre-wrap">💡 ' + esc(f.why) + '</div>' : '')
      + (f.k === 'wplace' && f.loc ? '<div class="pl">📍 어디쯤: ' + esc(f.loc) + '</div>' : '');
    h += '<div class="ft"><button data-a="like" class="' + (me ? 'on' : '') + '" title="좋아요(이 생각이 좋아요)">' + (me ? '❤️' : '🤍') + ' ' + (lk.length || '') + '</button><button data-a="re" title="댓글">💬 ' + (re.length || '') + '</button><span style="flex:1"></span>'
      + (can && own ? '<button data-a="edit" title="고치기">✏️</button>' : '') + '</div>';
    if (showRe) h += '<div class="res">' + (re.map(([rid, r]) => '<div>💬 <b>' + esc(r.by) + '</b> ' + esc(r.tx) + (teacher || r.by === name ? ' <button class="x" data-a="rd" data-r="' + esc(rid) + '" title="댓글 지우기">✕</button>' : '') + '</div>').join('') || '<div class="sm">아직 댓글이 없어요</div>')
      + (can ? '<div class="ri"><input maxlength="120" placeholder="댓글 달기 (Enter)"><button data-a="rs">보내기</button></div>' : '') + '</div>';
    return h + '</div>';
  }
  function worldView() {
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const can = canWrite(), A = wcards(), W = wcoach();
    let h = '<div class="top"><h3>🌍 ' + esc(bare(board.t)) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + (teacher ? '<button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button><button class="sub" data-b="admin" title="정리 글·비우기·되돌리기">🗂 관리</button>' : '<button class="sub" data-b="t" title="선생님만">🔒 선생님</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="bar">' + (can ? '<button data-b="wnew">＋ 카드 쓰기</button>' : '') + '<button class="sub" data-b="sum">📤 정리' + (teacher ? '(Claude에게)' : '') + '</button>'
      + '<span title="여섯 칸을 목표 수만큼 채울수록 올라가요 — 🧭 세계 코치를 봐요" style="display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-weight:800;font-size:13px">🌍 세계 채우기 <span style="display:inline-block;width:120px;height:10px;border-radius:6px;background:#e9ecef;overflow:hidden"><span style="display:block;height:100%;width:' + W.pct + '%;background:' + (W.pct >= 80 ? '#2f9e44' : W.pct >= 50 ? '#f59f00' : '#fa5252') + '"></span></span> ' + W.pct + '%</span></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    body.innerHTML = '<div class="lanes wl">' + WC.map((C) => { const L = A.filter(([, f]) => f.k === C.k).sort((a, b) => likes(b[1]) - likes(a[1]) || (a[1].t || 0) - (b[1].t || 0));   // wl = 여섯 칸 격자(가로로 굴리지 않아도 🎮 칸까지 보임)
      return '<div class="lane" style="border-top:6px solid ' + hex(C.c) + '"><h4>' + C.e + ' ' + C.n + ' <span class="sm">' + L.length + '/' + C.goal + (L.length >= C.goal ? ' ✓' : '') + '</span></h4><div class="sm" style="margin:-4px 0 8px">' + esc(C.q) + '</div>'
        + L.map(([id, f]) => wcard(id, f)).join('') + (can ? '<button class="sub" data-b="wcat:' + C.k + '" style="width:100%;border:1px dashed #9fb4d0;background:#fff">＋ ' + C.e + ' 쓰기</button>' : '') + '</div>'; }).join('') + '</div>';
    body.prepend(el('div', 'coach top', '<b>🧭 세계 코치</b> ' + coachChips(W.tips), body));   // 코치는 칸 위(빈 칸 칩·'다 모였어요'가 첫 화면에)
    body.scrollTop = sc[0]; body.scrollLeft = sc[1];
    P.onclick = async (e) => {
      const b = e.target.closest('[data-b]'); if (!b || b.closest('.cd')) return;
      const a = b.dataset.b;
      if (a === 'close') { close(); worldBackHint(); }
      else if (a === 'wnew') { if (!canWrite()) return lockMsg(); back = 'board'; form({}); }
      else if (a === 'sum') summary();
      else if (a === 't') teacherLogin();
      else if (a === 'admin') admin();
      else if (a === 'lock') { try { await req('/boardList/' + board.id + '/lock', 'PUT', !board.lock); } catch (er) { toast('바꾸지 못했어요', 2); } }
      else if (a === 'wloc') {   // 내 장소 카드부터(친구 카드는 쓴 친구가 정함 — 막다른 길 대신 누구 것인지 알려 줌)
        if (!canWrite()) return lockMsg();
        const U = A.filter(([, f]) => f.k === 'wplace' && !f.loc), t = U.find(([, f]) => teacher || f.by === name);
        if (t) { back = 'board'; form({ id: t[0] }); }
        else if (U.length) toast('📍 어디쯤이 아직 없는 장소는 ' + [...new Set(U.map(([, f]) => f.by))].slice(0, 3).join('·') + '의 카드예요 — 쓴 친구가 ✏️로 정해요. 💬 댓글로 알려 줘요', 3.5);
      }
      else if (a && a.startsWith('wcat:')) { if (!canWrite()) return lockMsg(); back = 'board'; form({ cat: a.slice(5) }); }
    };
  }
  let wviewId = null;
  function wview(id) {
    const f = DATA[id]; if (!f || !WBY[f.k]) { if (panel && panel.id === 'memo-view') close(); return; }
    const re = panel && panel.id === 'memo-view' && wviewId === id, P = re ? panel : open('memo-view'); wviewId = id; viewId = id;
    if (!re) wire(P);
    P.innerHTML = wcard(id, f, { re: true, noGo: true }) + '<div class="row"><button class="sub" data-v="board">🌍 세계 판</button><button class="sub" data-v="close">닫기</button></div>';
    P.onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'board') boardView(); else close(); };
  }
  function wform(o = {}) {
    if (!canWrite()) { back = null; return lockMsg(); }
    const old = o.id ? DATA[o.id] : null; if (o.id && !old) { back = null; return; }
    if (old && !teacher && old.by !== name) { back = null; return toast('✍️ ' + old.by + '의 카드예요 — 내가 쓴 것만 고칠 수 있어요', 3); }
    let cat = old ? old.k : o.cat || null, loc = old && old.loc || null;   // 새 세계 = 학교와 따로 — 깃발 없음 · 장소는 '어디쯤'
    const P = open('memo-form');
    const draw = () => {
      const C = WBY[cat];
      let h = '<h3>' + (old ? '✏️ 카드 고치기' : '＋ 세계 카드 쓰기') + '</h3>';
      if (!old) h += '<div class="mlbl">어느 칸이에요?</div><div class="chips wc">' + WC.map((x) => '<button data-k="' + x.k + '" class="' + (cat === x.k ? 'on' : '') + '">' + x.e + ' ' + x.n + '</button>').join('') + '</div>';
      if (C) {
        h += '<div class="mlbl">' + C.e + ' ' + esc(C.q) + '</div><div class="sm" style="margin:2px 0 4px">예) ' + esc(C.ex) + '</div>'
          + '<div class="chips stem">' + C.stems.map((t) => '<button data-stem="' + esc(t) + '">' + esc(t) + '…</button>').join('') + '</div>'
          + '<textarea id="mmTx" maxlength="300" placeholder="' + esc(C.stems[0]) + ' …"></textarea>'
          + '<div class="mlbl">💡 왜 그래요? 어떻게 돼요? <span class="sm">(더 자세히 — 안 써도 돼요)</span></div><textarea id="mmWhy" maxlength="200" style="min-height:50px" placeholder="예) 왜냐하면 … · 그래서 … · 만약 … 하면 …"></textarea>';
        if (cat === 'wplace') h += '<div class="mlbl">📍 이 세계의 어디쯤 있어요? <span class="sm">(하나 골라요 — 세계 지도를 그릴 때 써요)</span></div><div class="chips">' + WLOC.map((x) => '<button data-loc="' + x + '" class="' + (loc === x ? 'on' : '') + '">' + x + '</button>').join('') + '</div>';
      } else h += '<div class="sm" style="margin-top:8px">위에서 칸을 골라요.</div>';
      h += '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + '<button class="sub" id="mmNo">취소</button><button id="mmOk"' + (C ? '' : ' disabled style="opacity:.45"') + '>💾 저장</button></div>';
      const keep = { tx: (P.querySelector('#mmTx') || {}).value, why: (P.querySelector('#mmWhy') || {}).value };
      P.innerHTML = h;
      const tx = P.querySelector('#mmTx'), wy = P.querySelector('#mmWhy');
      if (tx) { tx.value = keep.tx != null ? keep.tx : old ? old.tx || '' : ''; setTimeout(() => tx.focus(), 30); }
      if (wy) wy.value = keep.why != null ? keep.why : old ? old.why || '' : '';
    };
    const done = () => { if (back === 'board') { back = null; boardView(); } else close(); };
    P.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) { cat = b.dataset.k; draw(); return; }
      if (b.dataset.stem) { const t = P.querySelector('#mmTx'); if (t) { t.value = b.dataset.stem + ' ' + t.value.replace(new RegExp('^(' + WSTEMS.join('|') + ')\\s*'), ''); t.focus(); } return; }   // 다른 칸의 줄기 문장도 뗌(칸을 바꾼 뒤 '이곳의 이름은 이 세계의 이름은…'이 되던 것)
      if (b.dataset.loc) { loc = loc === b.dataset.loc ? null : b.dataset.loc; P.querySelectorAll('[data-loc]').forEach((x) => x.classList.toggle('on', x.dataset.loc === loc)); return; }
      if (b.id === 'mmNo') done();
      else if (b.id === 'mmDel') { if (!confirm('이 카드를 지울까요? (댓글도 함께 지워져요)')) return; try { await req(fpath(o.id), 'DELETE'); } catch (er) { toast('지우지 못했어요', 2); } done(); }
      else if (b.id === 'mmOk') {
        const tx = ((P.querySelector('#mmTx') || {}).value || '').trim(), why = ((P.querySelector('#mmWhy') || {}).value || '').trim();
        if (!WBY[cat]) return toast('어느 칸인지 골라요', 2); if (!tx) return toast('내용을 적어 주세요', 2);
        const f = { k: cat, tx: dedupe(tx).slice(0, 300), why: why ? why.slice(0, 200) : null, loc: cat === 'wplace' && loc ? loc : null };
        try {
          if (old) await req(fpath(o.id), 'PATCH', f);
          else { if (!f.why) delete f.why; if (!f.loc) delete f.loc; Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }); await req(fpath(newId()), 'PUT', f); }
          map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : '＋ ' + WBY[cat].e + ' 카드를 붙였어요!', 2.2);
        } catch (er) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
        done();
      }
    });
    draw();
  }
  // 🧭 세계 코치 — 칸별 목표 · 세계 채우기 %(정리 글엔 '구현 준비') · 할 일이 우리 세계의 장소·주민·신기한 것과 이어지나 · 까닭
  const JOSA = /(으로|에서|에게|한테|까지|부터|처럼|이랑|이에요|예요|입니다|이다|은|는|이|가|을|를|에|의|로|와|과|도|만|랑)$/;
  const STOP = new Set(['우리', '세계', '친구', '학교', '그리고', '그래서', '하지만', '이곳', '그곳', '여기', '거기', '이것', '그것', '사람', '모습', '성격', '하면', '해요', '있어요', '없어요', '돼요', '수', '것', '때', '곳', '날', '정말', '아주', '너무', '같이', '함께', '모두', '처음', '이름']);   // '이름은'은 JOSA를 떼면 '이름' — 줄기 문장의 '이름'으로 이어진 것으로 세지 않게
  // 10-04 재시험: 줄기 문장('거기에 가면'·'이것을 쓰면'·'여기서는'…)과 '가면·쓰면·들려요' 같은 풀이말까지 이름처럼 세어, 이름을 하나도 안 쓴 할 일도 '이어져요'가 됐다
  //   → 줄기 문장은 글 어디에 있든 먼저 지우고 · 「이름」 속 낱말은 늘 셈 · 그 밖은 '…요·…면·…해야·…하고·…해서·…지만·…는데·…니까'로 끝나는 풀이말을 뺌
  const VERB = /(요|면|해야|하고|해서|지만|는데|니까)$/;
  const words = (t) => {
    let s9 = String(t || ''); for (const st of WSTEMS) s9 = s9.split(st).join(' ');
    const nm = new Set(); s9.replace(/「([^」]{1,20})」/g, (m, x) => { for (const w of x.split(/\s+/)) nm.add(w.replace(JOSA, '')); return m; });
    return s9.replace(/[「」『』"'“”.,!?~·…()]/g, ' ').split(/\s+/).map((w) => w.replace(JOSA, '')).filter((w) => w.length >= 2 && !STOP.has(w) && /[가-힣a-z]/i.test(w) && (nm.has(w) || !VERB.test(w)));
  };
  function wcoach() {
    const A = wcards(), by = (k) => A.filter(([, f]) => f.k === k), tips = [];
    let sum = 0;
    for (const C of WC) { const n = by(C.k).length; sum += Math.min(1, n / C.goal); tips.push({ ok: n >= C.goal, t: C.e + ' ' + C.n + ' ' + n + '/' + C.goal, b: n < C.goal ? 'wcat:' + C.k : null }); }
    const pct = Math.round(sum / WC.length * 100);
    if (A.length) {
      const nm = by('wname'); if (nm.length && nm.every(([, f]) => String(f.tx).replace(/\s/g, '').length < 10)) tips.push({ ok: false, t: '🌍 이름만 있어요 — 어떤 곳인지 한 줄 소개·분위기(색·날씨·소리)도 써요', b: 'wcat:wname' });
      const tiny = A.filter(([, f]) => f.k !== 'wname' && unstem(f).replace(/[「」\s]/g, '').length < 6 && !f.why); if (tiny.length) tips.push({ ok: false, t: '✏️ 짧은 카드 ' + tiny.length + '개(' + tiny.slice(0, 2).map(([, f]) => '「' + short(unstem(f).replace(/[「」]/g, ''), 6) + '」').join(' ') + ') — 어떤 모습이고 무엇을 하는지 더 써요' });   // 줄기 문장만 있는 '이것의 이름은 용'도 짧은 카드
      const why = A.filter(([, f]) => f.why).length; tips.push({ ok: why * 3 >= A.length, t: '💡 까닭을 쓴 카드 ' + why + '/' + A.length + (why * 3 >= A.length ? '' : ' — 왜·어떻게를 더 써 봐요') });
      const pool = new Set(); for (const k of ['wplace', 'wthing', 'wpeop', 'wname']) for (const [, f] of by(k)) for (const w of words(f.tx)) pool.add(w);
      const D = by('wdo'), linked = D.filter(([, f]) => words(f.tx + ' ' + (f.why || '')).some((w) => pool.has(w))).length;
      if (D.length) tips.push({ ok: linked * 2 >= D.length, t: '🧩 할 일 ' + D.length + '개 중 ' + linked + '개가 우리 세계의 장소·주민·신기한 것과 이어져요' + (linked * 2 >= D.length ? '' : ' — 할 일에 그 이름을 넣어 봐요') });
      const R9 = by('wrule'); if (R9.length && D.length) { const rw = new Set(); for (const [, f] of R9) for (const w of words(f.tx)) rw.add(w); const used = D.some(([, f]) => words(f.tx + ' ' + (f.why || '')).some((w) => rw.has(w))); tips.push({ ok: used, t: used ? '📜 규칙이 할 일에 쓰여요' : '📜 규칙을 할 일(도전)에 써 봐요 — 예) 노래로 떠올라 하늘 섬 가기' }); }
      const P9 = by('wplace'), lc = P9.filter(([, f]) => f.loc).length, mine9 = P9.some(([, f]) => !f.loc && (teacher || f.by === name));   // 누를 수 있는 건 내 장소 카드가 있을 때만(친구 카드는 쓴 친구가 정함)
      if (P9.length) tips.push({ ok: lc === P9.length, t: '📍 어디쯤인지 정한 장소 ' + lc + '/' + P9.length + (lc < P9.length ? (mine9 ? ' — 눌러서 정해요(가운데·북쪽·하늘…)' : ' — 쓴 친구가 ✏️로 정해요') : ''), b: lc < P9.length && mine9 ? 'wloc' : null });
      const top = A.filter(([, f]) => likes(f)).sort((a, b) => likes(b[1]) - likes(a[1])).slice(0, 2); if (top.length) tips.push({ ok: true, t: '❤️ 인기: ' + top.map(([, f]) => (WBY[f.k] || WC[0]).e + short(wnm(f), 12) + '(' + likes(f) + ')').join(' · ') });
    }
    if (pct >= 100 && tips.every((t) => t.ok)) tips.push({ ok: true, t: '🎉 세계가 다 모였어요 — 선생님이 📤 정리를 Claude에게 넘기면 진짜 세계가 돼요!' });
    return { pct, tips };
  }
  function wsummary(full = teacher) {   // full = 선생님(Claude에게 넘길 글 — 구현 부탁 틀까지) · 아이 화면 = 우리가 쓴 것 + 코치만('세계 채우기' — 이야기 판 정리와 같은 규칙)
    const A = wcards(), W = wcoach();
    const out = ['# 🌍 세계 만들기 — ' + bare(board.t), board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 카드 ' + A.length + '개 · ' + (full ? '구현 준비 ' : '세계 채우기 ') + W.pct + '% · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 칸마다 ❤️ 많은 순 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    for (const C of WC) {
      const L = A.filter(([, f]) => f.k === C.k).sort((a, b) => likes(b[1]) - likes(a[1]) || (a[1].t || 0) - (b[1].t || 0));
      out.push('## ' + C.e + ' ' + C.n + (L.length ? '' : '  (아직 없음)'));
      for (const [, f] of L) {
        out.push('- ' + (likes(f) ? '(❤️' + likes(f) + ') ' : '') + String(f.tx).replace(/\n/g, ' ') + '  · ✍️ ' + f.by);
        if (f.why) out.push('  💡 ' + String(f.why).replace(/\n/g, ' '));
        if (f.k === 'wplace' && f.loc) out.push('  📍 어디쯤: ' + f.loc);
        if (f.re) for (const r of Object.values(f.re).filter((r) => r && r.tx).sort((a, b) => (a.t || 0) - (b.t || 0))) out.push('  💬 ' + r.by + ': ' + r.tx);
      }
      out.push('');
    }
    out.push('## 🧭 코치가 본 것', ...W.tips.map((c) => '- ' + (c.ok ? '✓ ' : '! ') + c.t));
    if (full) out.push('',
      '## Claude에게 — 구현 부탁(선생님이 고쳐 써도 돼요)',
      '- 이 세계를 imagine/<영문 이름>/ 에 「마법사 마을」처럼 새 페이지로 만들어 주세요(조작은 메타버스와 같게 · v3 「상상의 세계」 카드로).',
      '- 🌍 = 첫 화면·하늘·색·소리 · 📜 규칙 = 놀이 규칙(되는 일·안 되는 일·어기면) · 👫 = 마을 사람·생물(말 걸기) · 🏰 = 지역(📍 어디쯤 — 가운데·북·남·동·서·하늘·땅속·물속에 맞춰 세계 지도를 짠다 · 우리 학교와는 따로) · ✨ = 상호작용·마법·물건 · 🎮 = 퀘스트·도전(처음 할 일 → 해결 → 보상).',
      '- ❤️ 많은 생각부터 · 서로 부딪히면 ❤️ 많은 쪽 · 💬 댓글의 의견도 살피기 · 빈 칸은 Claude가 채우되 「Claude가 채운 것」 목록을 따로 알려 주기.',
      '- 실제 친구 이름(✍️ 쓴 사람)은 세계의 주민·생물 이름이나 대사에 쓰지 않기 · 선생님은 직함으로 · 우리 학교와는 따로인 세계(학교 사실을 지어 넣지 않기).');
    return out.filter((x, i) => x !== '' || i > 3).join('\n');
  }

  // ───────── 🗂 관리(선생님) — 비우기는 판 번호를 적어야 · 비운 것은 보관 → 되돌리기 ─────────
  async function admin() {
    if (!teacher) return;
    const P = open('memo-admin'); P.innerHTML = '<h3>🗂 「' + esc(board.t) + '」 관리</h3><div class="sm">불러오는 중…</div>';
    let bak = null; try { bak = await req('/trash/' + board.id); } catch (e) { /* */ }
    if (panel !== P) return;
    const n = Object.keys(DATA).length, no = String(board.n || board.id);
    P.innerHTML = '<h3>🗂 「' + esc(board.t) + '」 관리</h3>'
      + '<div class="mlbl">📤 정리 글</div><div class="row" style="justify-content:flex-start"><button class="sub" id="mmSum2">📤 Claude에게 넘길 정리 글 보기</button></div>'
      + '<div class="mlbl">🧹 판 비우기</div><div class="sm">' + (isW() ? '카드 ' : '장면·덧붙인 것·깃발 ') + n + '개를 모두 지워요. 지운 것은 한 번 보관돼서 아래 ↩️로 되돌릴 수 있어요.<br>정말 비우려면 판 번호 <b>' + esc(no) + '</b>을(를) 적어요.</div>'
      + (n ? '<div style="display:flex;gap:6px;margin-top:6px"><input id="mmNo2" maxlength="12" placeholder="판 번호" style="width:120px"><button class="warn" id="mmClr">🧹 비우기</button></div>' : '<div class="sm" style="margin-top:4px">지금은 비울 것이 없어요(보관한 것은 그대로예요).</div>')
      + '<div class="mlbl">↩️ 되돌리기</div><div class="sm">' + (bak && bak.flags ? new Date(bak.t || 0).toLocaleString('ko-KR') + '에 비운 ' + Object.keys(bak.flags).length + '개가 보관돼 있어요.' : '보관된 것이 없어요.') + '</div>'
      + (bak && bak.flags ? '<div class="row" style="justify-content:flex-start"><button class="sub" id="mmUndo">↩️ 보관한 것 되돌리기(지금 판에 더해요)</button></div>' : '')
      + '<div class="row"><button class="sub" id="mmTo" title="이 기기를 아이 화면으로(다시 쓰려면 비밀번호)">🔓 선생님 모드 끝내기</button><span style="flex:1"></span><button class="sub" id="mmBk">◀ ' + (isW() ? '세계 판' : '이야기 판') + '</button></div>';
    P.querySelector('#mmBk').onclick = boardView; P.querySelector('#mmSum2').onclick = summary; P.querySelector('#mmTo').onclick = offT;
    const clr = P.querySelector('#mmClr');
    if (clr) clr.onclick = async () => {
      if (P.querySelector('#mmNo2').value.trim() !== no) return toast('판 번호가 달라요 — 비우지 않았어요', 2.5);
      if (!Object.keys(DATA).length) return toast('판이 이미 비어 있어요 — 보관한 것은 그대로예요', 2.5);   // 빈 판을 비우면 하나뿐인 보관본이 지워지던 것
      try { await req('/trash/' + board.id, 'PUT', { t: { '.sv': 'timestamp' }, flags: DATA }); const ids = Object.keys(DATA); await Promise.all(ids.map((k) => req(fpath(k), 'DELETE'))); toast('🧹 비웠어요 — 🗂 관리에서 되돌릴 수 있어요', 3); } catch (e) { toast('비우지 못했어요', 2); }
      admin();
    };
    const u = P.querySelector('#mmUndo');
    if (u) u.onclick = async () => { try { await req('/boards/' + board.id + '/flags', 'PATCH', bak.flags); toast('↩️ 되돌렸어요', 2); } catch (e) { toast('되돌리지 못했어요', 2); } boardView(); };
  }

  // ───────── 🧭 이야기 코치 — 길(장면 → 다음 장면 · 고르기 → N번)을 따라가 보고 짚어 줌 ─────────
  function graph() {
    const L = scenes(), n = L.length, E = L.map(() => []), auto = L.map(() => false), bad = [], loose = [];
    L.forEach(([id, f], i) => {
      let branched = false;
      for (const [, x] of kids(id)) if (x.k === 'choice') { for (const o of choiceOpts(x)) { if (o.n == null) loose.push((i + 1) + '번 「' + short(o.label, 8) + '」'); else if (o.n < 1 || o.n > n) bad.push(o.n); else { E[i].push(o.n - 1); branched = true; } } }
        else if (x.k === 'quiz' && x.go) { if (x.go < 1 || x.go > n) bad.push(x.go); else { E[i].push(x.go - 1); branched = true; } }
      if (!branched && !f.end && i + 1 < n) { E[i].push(i + 1); auto[i] = true; }   // auto = 고르기·퀴즈 없이 '다음 차례'로 이어짐(해 보기·책 읽기와 같은 규칙)
    });
    const seen = new Set(n ? [0] : []), st = n ? [0] : []; while (st.length) { const v = st.pop(); for (const w of E[v]) if (!seen.has(w)) { seen.add(w); st.push(w); } }   // 장면 0개(비운 판)도 안전
    // 갈래 섞임: 갈림길의 한 갈래가 🏁 없이 '다음 차례'로 흘러 다른 보기의 갈래 시작으로 들어감(도서관 갈래 끝 → 운동장 결말) — 아이들이 갈래를 나눠 쓸 때 가장 흔한 실수
    //   그 장면에 🔗(일부러 합쳤어요 — joinedAt)를 켜면 짚지 않음(방탈출처럼 갈래를 다시 모으는 이야기 · 10-04 재시험: 표시할 길이 없어 '처음부터 끝까지 이어져요!'가 영영 안 나왔다)
    const fall = new Map(); E.forEach((e) => { const S9 = [...new Set(e)]; if (S9.length < 2) return; for (const s9 of S9) { let i = s9; while (auto[i]) { if (S9.includes(i + 1)) { fall.set(i, i + 1); break; } i++; } } });
    return { L, E, auto, bad, loose, seen, fall };
  }
  function coach() {
    const { L, E, bad, loose, seen, fall } = graph(), out = [], ends = L.filter(([, f]) => f.end).length, branch = E.some((e) => e.length > 1);
    out.push({ ok: true, t: '장면 ' + L.length + '개' + (branch ? ' · 갈림길 있음' : '') });
    // 끝맺음 = 글의 첫머리('드디어…')나 끝맺는 말로만 봄 — '쉬는 시간이 끝나고 교실로 돌아왔는데…'처럼 글 속 '끝·돌아왔'은 끝이 아님
    const lastTx = L.length ? String(L[L.length - 1][1].tx).trim() : '', endish = /^(드디어|마침내|그날부터|그날 이후|그 뒤로)/.test(lastTx) || /(행복하게|돌려주었|돌려줬|돌려드렸|친구가 되었|해결했)/.test(lastTx) || /(끝났어요|끝났다|이야기 끝|끝|웃었어요|찾았어요|돌아왔어요|돌아왔다)[.!~\s]*$/.test(lastTx);
    if (!ends) out.push(branch ? { ok: false, t: '갈림길마다 🏁 결말 장면을 정해요' } : endish ? { ok: true, t: '마지막 장면이 끝이에요(🏁로 표시해도 좋아요)' } : { ok: false, t: '마지막 ' + L.length + '번 장면이 이야기의 끝인가요? — 끝이면 ✏️에서 🏁, 아니면 「드디어…」 장면을 더 써요', b: L.length ? 'ed:' + L[L.length - 1][0] : null });
    else out.push({ ok: true, t: '🏁 결말 ' + ends + '개' });
    if (bad.length) out.push({ ok: false, t: [...new Set(bad)].map((x) => x + '번').join('·') + ' 장면은 아직 없어요' });
    if (loose.length) out.push({ ok: false, t: loose.slice(0, 3).join(', ') + ' — 고르면 몇 번 장면으로 가요?' });
    const lost = L.map((_, i) => i).filter((i) => !seen.has(i)); if (lost.length) out.push({ ok: false, t: lost.map((i) => (i + 1) + '번').join('·') + ' 장면은 아무 데서도 안 와요' });
    const dead = L.map((_, i) => i).filter((i) => seen.has(i) && !E[i].length && !L[i][1].end && i < L.length - 1); if (dead.length) out.push({ ok: false, t: dead.map((i) => (i + 1) + '번').join('·') + ' 장면 뒤에 길이 끊겨요' });
    const selfs = L.map((_, i) => i).filter((i) => E[i].length && E[i].every((w) => w === i)); if (selfs.length) out.push({ ok: false, t: selfs.map((i) => (i + 1) + '번').join('·') + ' 장면에서 나갈 길이 없어요 — 고르기·퀴즈가 다시 그 장면으로만 가요' });
    const mix = [...fall].filter(([i]) => !joinedAt(L[i][1], i + 1)), joined = [...fall].filter(([i]) => joinedAt(L[i][1], i + 1));
    mix.slice(0, 2).forEach(([i, j]) => out.push({ ok: false, t: (i + 1) + '번 장면 다음에 ' + (j + 1) + '번(다른 보기로 가는 장면)으로 이어져요 — 눌러서 ' + (i + 1) + '번에 🏁(그 갈래가 끝나요) 또는 🔗(일부러 합쳤어요)', b: 'ed:' + L[i][0] }));
    if (joined.length) out.push({ ok: true, t: '🔗 갈래 합침 ' + joined.slice(0, 3).map(([i, j]) => (i + 1) + '→' + (j + 1) + '번').join(' · ') });
    const Q9 = []; L.forEach(([sid], i) => { for (const [, x] of kids(sid)) if (x.k === 'quiz') Q9.push([i, x]); });
    if (Q9.length) {
      const broken = Q9.filter(([, x]) => (x.qt || 'text') === 'text' ? !x.ans : x.qt === 'pick' ? !x.opt : !DATA[x.item]);
      const late = Q9.filter(([i, x]) => x.qt === 'item' && DATA[x.item] && scenes().findIndex(([sid]) => sid === DATA[x.item].p) > i);
      out.push({ ok: !broken.length && !late.length, t: '🔐 퀴즈·자물쇠 ' + Q9.length + '개' + (broken.length ? ' — ' + broken.map(([i]) => (i + 1) + '번').join('·') + ' 장면 퀴즈에 정답이 없어요' : '') + (late.length ? ' — 📦 「' + short(DATA[late[0][1].item].tx, 8) + '」이(가) 자물쇠보다 뒤 장면에 있어요' : '') });
    }
    const noFlag = L.filter(([id]) => !sceneSpot(id)); if (noFlag.length) out.push({ ok: false, t: '📍 일어나는 곳 깃발이 없는 장면 ' + noFlag.map(([id]) => L.findIndex(([x]) => x === id) + 1).join('·') + '번 — 눌러서 꽂으러 가요', b: 'noflag' });
    const has = (re) => L.some(([, f]) => re.test(String(f.tx))), steps = [['처음', L.length > 0], ['문제가 생겨요', has(/^(그런데|그때)|갑자기|사라졌|없어졌|잃어버|문제|고장|갇혔|싸웠|다쳤|울고|길을 잃/)], ['해결', has(/^(그래서|드디어)|찾았|고쳤|도와|해결|구했|화해|돌려주|돌려줬/)], ['끝', ends > 0 || endish]];
    const miss = steps.filter(([, ok]) => !ok).map(([n9]) => n9);
    out.splice(1, 0, { ok: !miss.length, t: '🧩 이야기 줄기 ' + steps.map(([n9, ok]) => n9 + (ok ? ' ✓' : ' ·')).join(' → ') + (miss.length ? ' — 「' + miss[0] + '」 장면을 더해 봐요' : '') });
    if (out.filter((c) => !c.ok).length === 0 && !bad.length) out.push({ ok: true, t: '처음부터 끝까지 이어져요!' });
    return out;
  }

  // ───────── 🛤 이야기 길(깃발 → 깃발 · 걷는 길) ─────────
  let pathOn = false, pathObjs = [], pathT = 0, pathSig = '';
  function pathClear() { for (const o of pathObjs) o.remove(); pathObjs = []; pathSig = ''; }
  function pathSoon() { if (!pathOn) return; clearTimeout(pathT); pathT = setTimeout(drawPaths, 700); }
  async function drawPaths() {
    if (!pathOn || dead || !board) return;
    const { L, E } = graph(), segs = [];
    L.forEach(([id], i) => { const a = firstPlace(id); if (!a) return; for (const j of E[i]) { const b9 = firstPlace(L[j][0]); if (b9) segs.push([a, b9, j + 1, E[i].length > 1]); } });
    const sig = segs.map(([a, b9, n, br]) => [a.x, a.z, b9.x, b9.z, n, br].join(',')).join(';'); if (sig === pathSig) return;
    pathClear(); pathSig = sig; if (!segs.length) return;
    const nav = await map.nav(); if (!pathOn || dead) return;
    for (const [a, b9, n, br] of segs) {
      let pts = null;
      try { const r = nav.path([a.x, a.y || 0, a.z], [b9.x, b9.y || 0, b9.z], { maxExp: 80000 }); if (r && r.ok && r.pts.length > 1) pts = r.pts.filter((_, k) => k % 2 === 0 || k === r.pts.length - 1); } catch (e) { /* 길이 없으면 곧은 줄 */ }
      if (!pts) pts = [[a.x, a.y || 0, a.z], [b9.x, b9.y || 0, b9.z]];
      pathObjs.push(map.mk.trail(pts, { color: colOf(n), width: br ? 0.55 : 0.75 }));
    }
  }
  function pathToggle() { pathOn = !pathOn; if (pathOn) { pathSig = ''; drawPaths(); toast('🛤 이야기 길 — 깃발에서 다음 장면 깃발까지 바닥에 길이 생겨요(갈림길은 갈라져요)', 4); } else pathClear(); chips(); }

  // ───────── 🎮 이야기로 해 보기 ─────────
  let play = null;
  // 보기 한 줄 → { label, n } · n = 마지막 화살표 뒤 번호('1번 사물함을 연다 → 4번 장면' = 4 · '2번 문제를 푼다' = 없음 · '→ ?번'(지운 장면) = 없음 → 코치가 짚음) · 화살표 없는 옛 글은 'N번 장면'만
  function choiceOpts(x) {
    return String(x.opt || '').split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 6).map((t) => {
      const A9 = [...t.matchAll(ARROWN)].pop(), B9 = A9 ? null : t.match(/(\d{1,2})\s*번\s*장면/), v = A9 ? A9[1] : B9 ? B9[1] : null;
      return { label: t.replace(TAIL, '').trim() || t, n: v && v !== '?' ? +v : null };
    });
  }
  // 해 보기 중 창 = pAsk(어느 창이 떠 있는지 기억 → ⏹이면 닫음 · hud.ask엔 취소가 없어 첫 단추로 닫고, 루프는 play가 바뀐 것을 보고 끝남)
  const pAsk = (t, c) => { const p = map.hud.ask(t, c), B = document.querySelectorAll('.hudAsk'); if (play) play.box = B[B.length - 1] || null; return p; };
  function playStop(msg) {
    if (!play) return; const P0 = play; play = null;
    if (P0.wk) P0.wk(false);   // 걷기 타이머·빛기둥(그 판 것만 — 다음 판·다른 놀이의 목표 줄을 지우지 않게)
    if (P0.rfin) P0.rfin(); if (P0.mk) { P0.mk.remove(); P0.mk = null; }
    const bx = P0.box; if (bx && bx.isConnected) { const b = bx.querySelector('button'); if (b) b.click(); }   // 떠 있던 장면 창
    if (panel && panel._quizStop) panel._quizStop();   // 답 쓰기 창
    map.hud.goal(null); chips(); syncNow(); if (msg) toast(msg, 2.5);
  }
  function walkTo(f, n, tx, goalTx) {   // 장면 자리까지 걸어가기(빛기둥 · 미니맵 별 · ⏩ 바로 가기 칩) — 2.6m 안에 들어오면 끝 · goalTx = 물건 찾기 등
    return new Promise((res) => {
      const P0 = play; if (!P0) return res(false);
      let fin = false, iv = 0;   // 이 걷기만의 타이머(⏹ 뒤 남은 타이머가 다음 판의 걷기·다른 놀이의 목표 줄을 지우던 것)
      const mk = P0.mk = map.mk.marker(f.x, (f.y || 0) + 0.2, f.z, { color: colOf(n), beam: true });
      map.minimap.setMarks([{ x: f.x, z: f.z, color: hex(colOf(n)), shape: 'star', label: goalTx ? '📦' : n + '번 장면', blink: true, floor: (f.y || 0) > 2.5 ? 2 : 1 }]);
      map.hud.goal(goalTx || '🚩 ' + n + '번 장면 자리로 가요 — 📍 ' + whereOf(f));
      const done = (ok) => { if (fin) return; fin = true; clearInterval(iv); if (P0.wk === done) P0.wk = null; P0.go = null; if (P0.mk === mk) P0.mk = null; mk.remove(); if (play === P0) { map.hud.goal(null); chips(); } res(ok); };
      P0.wk = done;
      P0.go = () => { if (play !== P0) return; goTo(f); done(true); };   // ⏩ 바로 가기 = 도착(SIM: 순간 이동 자리가 판정 거리보다 조금 멀면 영영 기다리던 것)
      iv = setInterval(() => { if (play !== P0 || dead) return done(false); const me = map.player.pos(); if (Math.hypot(me.x - f.x, me.z - f.z) < 3.2 && Math.abs(me.y - (f.y || 0)) < 2) done(true); }, 200);
      chips();
    });
  }
  // 🔐 퀴즈 풀기 — 'ok' 통과 · 'stop' 그만 · 숫자 = 그 장면으로 돌아가기(자물쇠에 필요한 물건을 찾으러)
  const qnorm = (t) => String(t || '').toLowerCase().replace(/[\s.,!?~'"“”‘’()·\-]/g, '');
  function quizOk(a, ans) {
    const A = qnorm(a), L9 = String(ans || '').split(/[,，/]/).map(qnorm).filter(Boolean); if (!A) return false;
    if (L9.includes(A)) return true;
    for (const x of L9) { if (A.startsWith(x) && /^(요|이요|예요|이에요|입니다|이다|다|이야|야)$/.test(A.slice(x.length))) return true; if (/^\d+$/.test(x) && A.replace(/\D/g, '') === x && /^\d+[가-힣]{0,3}$/.test(A)) return true; }
    return false;
  }
  function askText(title, sub, canGive) {
    return new Promise((res) => {
      const P = open('memo-quiz');
      P.innerHTML = '<h3 style="white-space:pre-line">' + esc(title) + '</h3><div class="sm">' + esc(sub) + '</div><input id="qIn" maxlength="40" style="margin-top:8px" placeholder="정답을 써요"><div class="row">' + (canGive ? '<button class="sub" data-q="give">🏳 정답 보고 넘어가기</button>' : '') + '<button class="sub" data-q="stop">⏹ 그만</button><button data-q="ok">확인</button></div>';
      const inp = P.querySelector('#qIn'); setTimeout(() => inp.focus(), 30);
      const fin = (v) => { P._quizStop = null; close(); res(v); };
      P._quizStop = () => fin(null);
      P.onclick = (e) => { const b = e.target.closest('[data-q]'); if (!b) return; const q = b.dataset.q; if (q === 'ok') fin(inp.value); else if (q === 'give') fin('@give'); else fin(null); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); fin(inp.value); } });
    });
  }
  async function runQuiz(x, me) {   // me = 이 해 보기(⏹ 뒤 남은 창이 새 해 보기를 건드리지 않게)
    const hint = x.hint ? '\n💡 힌트: ' + x.hint : '';
    if ((x.qt || 'text') === 'item') {
      const it = DATA[x.item];
      if (me.got.has(x.item)) { await pAsk('🔓 ' + x.tx + '\n\n📦 「' + (it ? it.tx : '물건') + '」(으)로 열었어요!', ['▶']); map.sfx('ding'); return 'ok'; }
      const si = it ? scenes().findIndex(([sid]) => sid === it.p) : -1;
      map.sfx('buzz');
      const r = await pAsk('🔒 ' + x.tx + '\n\n잠겨 있어요 — 열려면 필요한 물건이 있어요.' + hint, si >= 0 ? ['🔙 ' + (si + 1) + '번 장면으로 돌아가 찾기', '⏹ 그만'] : ['⏹ 그만']);
      return r === 0 && si >= 0 && play === me ? si : 'stop';
    }
    if (x.qt === 'pick') {
      const O = String(x.opt || '').split('\n').filter(Boolean), ok = x.ok | 0; let wrong = 0;
      for (;;) {
        const r = await pAsk('🔐 ' + x.tx + (wrong ? '\n(땡! 다시 골라요)' : '') + (wrong >= 2 ? hint : ''), wrong >= 3 ? O.concat(['🏳 정답 보고 넘어가기']) : O);
        if (r < 0 || play !== me) return 'stop';
        if (r === ok) { map.sfx('ding'); await pAsk('⭕ 정답!', ['▶']); return 'ok'; }
        if (r >= O.length) { await pAsk('🔑 정답을 알려 줄게요\n「' + (O[ok] || '') + '」', ['▶']); return 'ok'; }   // '「노란색」였어요'처럼 받침에 맞지 않던 말 → 조사 없이
        wrong++; map.sfx('buzz');
      }
    }
    let wrong = 0;
    for (;;) {
      const a = await askText('🔐 ' + x.tx + (wrong >= 2 ? hint : ''), wrong ? '땡! 다시 써 봐요 (' + wrong + '번 틀림)' : '정답을 써요', wrong >= 3);
      if (a === null || play !== me) return 'stop';
      if (a === '@give') { await pAsk('🔑 정답을 알려 줄게요\n「' + String(x.ans || '').split(/[,，/]/)[0].trim() + '」', ['▶']); return 'ok'; }
      if (quizOk(a, x.ans)) { map.sfx('ding'); await pAsk('⭕ 정답!', ['▶']); return 'ok'; }
      wrong++; map.sfx('buzz');
    }
  }
  // ───────── 🏫 현실 방탈출 — 장소 번호(4자리) · 체크인 · 준비물 ─────────
  const scode = (fid) => { let h = 7; for (const ch of board.id + ':' + fid) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return String(1000 + (h % 9000)); };
  let realEl = null;
  function checkIn(fid, f, label) {   // 진짜 그곳에 가서 번호를 넣으면 아바타가 그 자리로(그사이 태블릿 속에서도 걸어 다님 — 아래 띠)
    return new Promise((res) => {
      const P0 = play; if (!P0) return res(false);
      if (realEl) realEl.remove();
      const where = whereOf(f), st = stations().find((t) => t.fid === fid);
      realEl = el('div', 'mp'); realEl.id = 'memo-real';
      realEl.innerHTML = '<div style="font-weight:900;font-size:16px">🏫 진짜 「' + esc(where) + '」(으)로 가요' + (st ? ' <span style="background:#fff3bf;border-radius:8px;padding:0 8px">#' + st.no + ' 카드</span>' : '') + '</div><div class="sm" style="margin:2px 0 6px">' + esc(label) + ' — 그곳에 붙은 <b>장소 번호 4자리</b>를 넣어요</div>'
        + '<div style="display:flex;gap:6px"><input id="rIn" maxlength="4" inputmode="numeric" placeholder="번호" style="width:110px;font-size:20px;text-align:center;letter-spacing:.2em"><button data-r="ok">확인</button><span style="flex:1"></span><button class="sub" data-r="see" title="태블릿 지도에서 어디인지 보기">🗺 어디?</button><button class="sub" data-r="stop">⏹</button></div><div class="sm" id="rWhy" style="min-height:16px;color:#d9480f"></div>';
      for (const t of ['keydown', 'keyup']) realEl.addEventListener(t, (e) => e.stopPropagation());
      const inp = realEl.querySelector('#rIn'), why = realEl.querySelector('#rWhy');
      let mk = null;
      let fin9 = false;
      const fin = (v) => { if (fin9) return; fin9 = true; if (mk) { mk.remove(); mk = null; } if (realEl) realEl.remove(); realEl = null; if (P0.rfin === stopIt) P0.rfin = null; res(v); }, stopIt = () => fin(false);
      P0.rfin = stopIt;
      const tryCode = () => { const v = inp.value.replace(/\D/g, ''); if (v === scode(fid)) { goTo(f); map.sfx('ding'); toast('🏫 「' + where + '」 도착! 태블릿에서도 여기로 왔어요', 2.5); fin(true); } else { why.textContent = v.length < 4 ? '번호 4자리를 넣어요' : '번호가 달라요 — 그곳의 카드를 다시 봐요'; map.sfx('buzz'); inp.select(); } };
      realEl.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (!b) return; const r = b.dataset.r;
        if (r === 'ok') tryCode(); else if (r === 'stop') { fin(false); playStop('⏹ 현실 방탈출을 그만했어요'); }
        else if (r === 'see') { if (mk) mk.remove(); mk = map.mk.marker(f.x, (f.y || 0) + 0.2, f.z, { color: 0xffd43b, beam: true }); map.minimap.setMarks([{ x: f.x, z: f.z, color: '#f59f00', shape: 'star', label: '여기', blink: true, floor: (f.y || 0) > 2.5 ? 2 : 1 }]); map.minimap.show({ big: true }); setTimeout(() => map.minimap.show({ big: false }), 3500); } });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); tryCode(); } });
      setTimeout(() => inp.focus(), 50);
    });
  }
  function stations() {   // 이야기 순서대로 — 장면 자리 · 숨긴 물건 · 퀴즈 자리
    const L = scenes(), out = [];
    L.forEach(([sid, f], i) => {
      const fp = sceneSpot(sid); if (fp) out.push({ fid: fp[0], f: fp[1], what: '🎬 ' + (i + 1) + '번 장면 — ' + f.tx, kind: 'scene', n: i + 1 });
      for (const [kid, x] of playKids(sid)) { if (!placed(x) || (fp && kid === fp[0])) continue;   // 해 보기와 같은 차례·같은 기준(카드 번호 = 체크인 차례 · 한 번씩)
        if (x.k === 'item') out.push({ fid: kid, f: x, what: '📦 숨길 물건 — ' + x.tx, kind: 'item', n: i + 1 });
        else if (x.k === 'quiz') out.push({ fid: kid, f: x, what: (QTN[x.qt || 'text'] || '🔐') + ' — ' + x.tx, kind: 'quiz', n: i + 1, x }); }
    });
    return out.map((t, k) => ({ ...t, no: k + 1, code: scode(t.fid) }));
  }
  function mapShot(marks) {
    let url = null;
    try { const wasBig = map.minimap.big; map.minimap.setMarks(marks); map.minimap.show({ big: true }); const cv = map.minimap.el && map.minimap.el.querySelector('canvas'); if (cv) url = cv.toDataURL('image/png'); map.minimap.show({ big: wasBig }); } catch (e) { url = null; }
    syncNow(); return url;
  }
  function realKitHtml() {
    const T = stations(), e9 = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const shot = mapShot(T.map((t) => ({ x: t.f.x, z: t.f.z, color: t.kind === 'item' ? '#f59f00' : t.kind === 'quiz' ? '#7048e8' : '#e03131', label: '#' + t.no, floor: (t.f.y || 0) > 2.5 ? 2 : 1 })));
    const ans = (t) => t.kind === 'quiz' ? quizAns(t.x) : t.kind === 'item' ? '이 물건 카드를 그곳에 숨겨요' : '';
    const rowsQ = []; scenes().forEach(([sid], i) => { for (const [, x] of kids(sid)) if (x.k === 'quiz') rowsQ.push('<tr><td>' + (i + 1) + '번 장면</td><td>' + e9(x.tx) + '</td><td><b>' + e9(quizAns(x)) + '</b></td><td>' + e9(x.hint || '') + '</td></tr>'); });
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>현실 방탈출 준비물 — ' + e9(board.t) + '</title><style>'
      + 'body{font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#1d3557;margin:24px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:22px 0 8px;border-bottom:2px solid #1d3557;padding-bottom:4px}'
      + 'table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #adb5bd;padding:6px;vertical-align:top;text-align:left}th{background:#f1f3f5}.chk{white-space:nowrap}'
      + '.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{border:3px dashed #1d3557;border-radius:14px;padding:14px;break-inside:avoid;min-height:150px}.no{font-size:40px;font-weight:900}.code{font-size:30px;font-weight:900;letter-spacing:.25em;background:#fff3bf;display:inline-block;padding:2px 10px;border-radius:8px}'
      + '.sm{font-size:12px;color:#5a6b80}.pb{page-break-before:always}img{max-width:100%;border:1px solid #ced4da;border-radius:10px}@media print{button{display:none}}</style></head><body>'
      + '<button onclick="print()" style="float:right;font-size:16px;padding:8px 14px">🖨 인쇄</button><h1>🏫 현실 방탈출 준비물 — ' + e9(board.t) + '</h1><div class="sm">메타버스 메모장에서 아이들이 만든 방탈출을 진짜 학교에서 · 장소 ' + T.length + '곳 · ' + new Date().toLocaleString('ko-KR') + '</div>'
      + '<h2>1. 진행 방법</h2><ol style="font-size:14px;line-height:1.7"><li>아래 <b>장소 카드</b>를 오려서 지도 번호 자리에 붙여요(📦 물건 카드는 그 자리에 숨겨요).</li><li>아이들은 태블릿으로 메타버스 메모장 → 이 판 → 📖 판 → <b>🏫 현실 방탈출 → 시작</b>.</li><li>태블릿이 「진짜 ○○으로 가요」라고 하면 그곳에 가서 카드의 <b>장소 번호 4자리</b>를 넣어요 → 태블릿 속 아바타도 그 자리로 가고, 퀴즈·힌트가 열려요.</li><li>퀴즈 답은 <b>진짜 그 장소</b>를 보고 찾아요. 미리 <b>현실 점검표</b>로 메타버스와 실제가 같은지 확인하고, 다르면 정답을 고치거나 Claude에게 알려 메타버스를 고쳐요.</li></ol>'
      + (shot ? '<h2>2. 장소 지도</h2><img src="' + shot + '" alt="학교 지도"><div class="sm">빨강 = 장면 자리 · 노랑 = 숨길 물건 · 보라 = 퀴즈 자리 · 속 빈 점 = 다른 층</div>' : '')
      + '<h2>3. 장소 목록 · 현실 점검표</h2><table><tr><th>#</th><th>장소(메타버스)</th><th>할 일</th><th>장소 번호</th><th>정답(선생님)</th><th class="chk">현실 점검</th></tr>'
      + T.map((t) => '<tr><td><b>' + t.no + '</b></td><td>' + e9(t.f.zone) + (nearOf(t.f) ? '<br><span class="sm">' + e9(nearOf(t.f)) + ' 근처</span>' : '') + '</td><td>' + e9(t.what) + '</td><td><b>' + t.code + '</b></td><td>' + e9(ans(t)) + '</td><td class="chk">□ 실제와 같아요<br>□ 달라요: ________</td></tr>').join('') + '</table>'
      + (rowsQ.length ? '<h2>4. 퀴즈 정답표(선생님)</h2><table><tr><th>장면</th><th>문제</th><th>정답</th><th>힌트</th></tr>' + rowsQ.join('') + '</table>' : '')
      + '<h2 class="pb">5. 오려 붙일 장소 카드</h2><div class="cards">' + T.map((t) => '<div class="card"><div class="no">#' + t.no + '</div><div style="font-weight:800;margin:4px 0">' + e9(t.f.zone) + (nearOf(t.f) ? ' · ' + e9(nearOf(t.f)) : '') + '</div>'
        + (t.kind === 'quiz' ? '<div style="font-size:15px;margin:6px 0">🔐 ' + e9(t.f.tx) + '</div>' : t.kind === 'item' ? '<div style="font-size:15px;margin:6px 0">📦 ' + e9(t.f.tx) + ' — 찾았다!</div>' : '<div style="font-size:15px;margin:6px 0">🎬 ' + t.n + '번 장면 자리</div>')
        + '<div class="sm">태블릿에 이 번호를 넣어요</div><div class="code">' + t.code + '</div></div>').join('') + '</div></body></html>';
  }
  function realKit() {
    if (!stations().length) return toast('🚩 깃발을 꽂은 장면·물건·퀴즈가 있어야 해요', 3);
    const html = realKitHtml(), w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); return; }
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })), P = open('memo-sum');
    P.innerHTML = '<h3>🖨 현실 방탈출 준비물</h3><div class="sm">새 창이 막혔어요 — 아래를 눌러 열어요.</div><div class="row"><a href="' + url + '" target="_blank" style="font-weight:800">📄 준비물 열기</a><button class="sub" id="mmB">◀ 이야기 판</button></div>';
    P.querySelector('#mmB').onclick = boardView;
  }
  function realMenu() {
    const T = stations(), P = open('memo-sum');
    P.innerHTML = '<h3>🏫 현실 방탈출</h3><div class="sm" style="line-height:1.6">학교 안은 GPS가 안 돼서, 장소마다 <b>번호 카드</b>를 붙여 두고 그곳에 가면 번호를 넣어요. 그러면 태블릿 속 아바타도 그 자리로 가고, 그 장소의 퀴즈·힌트가 열려요. 그 사이엔 태블릿 속에서도 걸어 다닐 수 있어요.</div>'
      + '<div class="where" style="margin-top:8px">장소 ' + T.length + '곳: ' + T.slice(0, 8).map((t) => '#' + t.no + ' ' + esc(short(t.f.zone, 6))).join(' · ') + (T.length > 8 ? ' …' : '') + '</div>'
      + (T.length ? '' : '<div class="sm" style="color:#d9480f">먼저 장면에 🚩 깃발을 꽂아요(📦 물건·🔐 퀴즈는 카드 줄의 🚩)</div>')
      + '<div class="row"><button class="sub" id="rB">◀ 이야기 판</button>' + (teacher ? '<button class="sub" id="rKit">🖨 준비물 뽑기(선생님)</button>' : '') + '<button id="rGo"' + (T.length ? '' : ' disabled style="opacity:.45"') + '>▶ 현실로 시작</button></div>'
      + (teacher ? '' : '<div class="sm" style="margin-top:6px">선생님이 장소마다 번호 카드를 붙였다고 하면 ▶ 현실로 시작해요 · 🖨 준비물(장소 카드·정답표)은 🔒 선생님 모드에서 뽑아요</div>');
    P.querySelector('#rB').onclick = boardView; const k = P.querySelector('#rKit'); if (k) k.onclick = realKit;
    P.querySelector('#rGo').onclick = () => { if (T.length) playStory({ real: true }); };
  }
  async function playStory(o = {}) {
    const L = scenes(); if (!L.length) return toast('먼저 장면을 만들어요', 2);
    close(); endTour(); hereOff(); placing = null; moving = null;
    const me = play = { i: 0, items: [], got: new Set(), steps: 0, mk: null, go: null, wk: null, box: null, book: !!o.book, real: !!o.real, quiz: 0 }; chips();
    const gone = () => play !== me;   // ⏹ 뒤(또는 🔁 다시 해 보기) 남은 창·걷기가 이 판을 이어 가지 않게
    const escape = Object.values(DATA).some((x) => valid(x) && x.k === 'quiz');
    flagsShow(false);   // 해 보는 동안 깃발·'E n번 장면 보기' 숨김(목표 빛기둥만)
    map.hud.toast(me.real ? '🏫 「' + board.t + '」 현실 방탈출 시작! 진짜 장소에 가서 번호를 넣어요' : me.book ? '📖 「' + board.t + '」 — 책처럼 읽어요' : (escape ? '🔐 「' + board.t + '」 방탈출 시작! 빛기둥을 따라가요' : '🎮 「' + board.t + '」 이야기 시작! 빛기둥을 따라가요'), 3);
    // 아직 안 쓴 장면으로 가라는 보기·퀴즈 → '끝'으로 보이지 않게 그 자리에서 알려 줌
    const missAsk = (N, alt) => { map.sfx('buzz'); return pAsk('🚧 ' + N + '번 장면은 아직 안 썼어요\n\n📖 이야기 판에서 ' + N + '번 장면을 써 줘요!', [alt, '📖 이야기 판으로']); };
    const toBoard = (k) => { playStop(); if (k === 1) boardView(); };
    while (!gone() && me.i >= 0 && me.i < L.length && me.steps++ < 60) {
      const [id, f] = L[me.i], n = me.i + 1, fp = sceneSpot(id), pl = fp ? fp[1] : null;
      if (pl && me.real) { const ok = await checkIn(fp[0], pl, '🎬 ' + n + '번 장면'); if (!ok || gone()) return; }
      else if (pl && !me.book) { const ok = await walkTo(pl, n, f.tx); if (!ok || gone()) return; }
      let next = f.end ? -1 : me.i + 1;   // 🏁 결말이면 여기서 끝
      let r = await pAsk('🎬 ' + n + '번 장면\n\n' + f.tx, ['다음 ▶']); if (gone()) return; if (r < 0) return playStop();
      let jump = null;
      for (const [kid, x] of playKids(id)) {
        if (gone()) return;
        const own9 = !fp || kid !== fp[0];   // 장면 자리 카드는 다시 묻지 않음 — stations()와 같은 기준(현실: 붙인 카드마다 한 번씩)
        if (x.k === 'quiz' && placed(x) && !me.book && own9 && (me.real || !pl || Math.hypot(x.x - pl.x, x.z - pl.z) > 3)) { const ok = me.real ? await checkIn(kid, x, '🔐 퀴즈가 있는 곳') : await walkTo(x, n, x.tx, '🔐 퀴즈가 있는 곳으로 가요 — 빛기둥'); if (!ok || gone()) return; }
        if (x.k === 'quiz') {
          const q = await runQuiz(x, me); if (gone()) return; if (q === 'stop') return playStop(); if (typeof q === 'number') { jump = q; break; } me.quiz++;
          if (x.go >= 1 && x.go <= L.length) next = x.go - 1;
          else if (x.go) { const k = await missAsk(x.go, '▶ 다음 장면으로'); if (gone()) return; if (k !== 0) return toBoard(k); }
          continue;
        }
        if (x.k === 'item' && placed(x) && !me.book && own9) { const ok = me.real ? await checkIn(kid, x, '📦 「' + short(x.tx, 10) + '」을(를) 찾아요 — 찾으면 그 카드의 번호') : await walkTo(x, n, x.tx, '📦 「' + short(x.tx, 10) + '」을(를) 찾아요 — 빛기둥으로'); if (!ok || gone()) return; }
        if (x.k === 'say') r = await pAsk('💬 ' + (x.who || '누군가') + '\n“' + x.tx + '”', ['▶']);
        else if (x.k === 'who') r = await pAsk('🧑 ' + (x.who || '등장인물') + (x.tx ? '\n' + x.tx : ''), ['▶']);
        else if (x.k === 'item') { r = await pAsk('📦 ' + x.tx, ['✋ 줍기!']); if (r >= 0 && !gone()) { if (!me.got.has(kid)) me.items.push(short(x.tx, 12)); me.got.add(kid); map.sfx('ding'); } }
        else if (x.k === 'choice') {
          const O = choiceOpts(x); if (!O.length) continue;
          for (;;) {
            r = await pAsk('❓ ' + x.tx, O.map((o9) => o9.label + (o9.n ? '  → ' + o9.n + '번' : '')));
            if (gone() || r < 0) break;
            const t9 = O[r] && O[r].n;
            if (t9 && (t9 < 1 || t9 > L.length)) { const k = await missAsk(t9, '◀ 다른 보기 고르기'); if (gone()) return; if (k === 0) continue; return toBoard(k); }
            if (t9) next = t9 - 1;
            break;
          }
        }
        if (gone()) return; if (r < 0) return playStop();
      }
      me.i = jump != null ? jump : next;
    }
    if (gone()) return;
    const loop = me.i >= 0 && me.i < L.length;   // 60번 넘게 돌아 멈춤(정상 끝은 번호가 판 밖으로 나감)
    const items = me.items.slice(), nq = me.quiz; playStop();
    if (loop) { const k = await map.hud.ask('🔁 「' + board.t + '」 이야기가 같은 곳을 계속 돌아요\n\n고르기·퀴즈의 「→ N번」과 🔒 자물쇠의 📦 열쇠 자리를 확인해요. 🏁 결말 장면도 정해 줘요!', ['📖 이야기 판으로', '닫기']); if (k === 0) boardView(); return; }
    const k = await map.hud.ask((escape ? '🎉 「' + board.t + '」 탈출 성공!' + (nq ? '\n\n푼 퀴즈·자물쇠 ' + nq + '개' : '') : '🏁 「' + board.t + '」 이야기 끝!') + (items.length ? '\n주운 물건: ' + items.join(' · ') : '') + '\n\n우리 반이 쓴 이야기를 해 봤어요. 고칠 곳이 있으면 📖 이야기 판에서 고쳐요!', ['📖 이야기 판으로', '🔁 다시 해 보기', '닫기']);
    if (k === 0) boardView(); else if (k === 1) playStory(o);
  }

  // ───────── ▶ 장면 따라 걷기 ─────────
  let tourI = -1, tourEl = null, lead = false;   // lead = 선생님 발표 — 장면마다 방 친구들을 데려감(SM_MP.gather)
  // 🚶·⏩·체크인·장면 따라 걷기 = 깃발 곁 설 자리로(standSpot) — 10-04 재시험: 깃발이 서가·책상 윗면(y 1)에 꽂히면 그 높이 칸만 찾다가 못 찾고 가구 속으로 순간 이동해 꼼짝 못 했다
  //   · 그 방 바닥(floorOf)부터 · 깃발 둘레 1.0~2.1m(꽂을 때 서 있던 쪽 cam부터) · 같은 구역 · 깃발이 보이는 자리 · 1.3m 안 + 다른 E 지점(의자 등)이 더 가깝지 않은 자리를 먼저('E n번 장면 보기'가 바로 잡히게)
  //   · 못 찾으면 그 구역 입구 칸 → 그래도 없으면 순간 이동하지 않고 알림(가구 속에 넣지 않음)
  function standSpot(f) {
    const fy = f.y || 0, { zn, lv } = floorOf(f), lvs = Math.abs(fy - lv) > 0.05 ? [lv, fy] : [fy];
    let a0 = Math.PI / 4; if (f.cam && f.cam.length === 3) { const dx = f.cam[0] - f.x, dz = f.cam[2] - f.z; if (Math.hypot(dx, dz) > 0.2) a0 = Math.atan2(dz, dx); }
    let own = null; for (const [fid, F] of FL) if (DATA[fid] === f && F.hot) own = F.hot.hot;
    const others = map.interact.list().filter((h) => h !== own && !h.off && !(own && h.label === own.label) && Math.hypot(h.x - f.x, h.z - f.z) < 4.5);
    const eOk = (e, d) => others.every((h) => { const dh = Math.hypot(h.x - e.x, h.z - e.z); return dh >= d || dh >= h.r || Math.abs(e.y - h.y) >= 1.6; });
    const same = (e) => !zn || (map.zoneAt(e.x, e.y + 0.2, e.z) || {}).id === zn.id;
    const sees = (e) => map.q.los([e.x, e.y + 1.3, e.z], [f.x, fy + 0.6, f.z]);
    const OFF = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, 2.0, -2.0, 2.4, -2.4, 2.8, -2.8, Math.PI];
    for (const pass of [0, 1, 2]) for (const y of lvs) for (const r of pass ? [1.0, 1.3, 1.6, 2.1] : [0.9, 1.1, 1.3]) for (const o of OFF) {   // 0 = 가깝고 E가 잡힘 · 1 = E가 잡힘 · 2 = 서기만
      const e = map.findEntry(f.x + Math.cos(a0 + o) * r, f.z + Math.sin(a0 + o) * r, y, null, 0);
      if (e && same(e) && sees(e) && (pass === 2 || eOk(e, r))) return e;
    }
    const e = map.findEntry(f.x, f.z, lv, zn ? [zn.x0, zn.z0, zn.x1, zn.z1] : null, 5); if (e) return e;
    const zp = zn && map.poi('zone:' + zn.id); return zp && zp.stand ? { x: zp.stand[0], y: zp.stand[1], z: zp.stand[2] } : null;
  }
  function goTo(f) {
    const e = standSpot(f);
    if (!e) { toast('🚩 그 깃발 가까이에 설 자리를 못 찾았어요 — 걸어서 가 봐요', 3); return false; }
    map.player.teleport([e.x, e.y, e.z]); map.player.lookAt([f.x, f.z]); arrive(f, e); return true;
  }
  // 도착 자리 E(10-04 재시험: 과학실 실험대·도서관 데스크 둘레는 의자·다른 장면 깃발이 더 가까워 🚶 뒤 E가 '의자에 앉기'였다)
  //   막 도착한 자리에 그 깃발과 같은 'n번 장면 보기' 지점을 잠깐 — 1.2m 벗어나거나 해 보기가 시작되면 뗌(0.4초마다 한 번 봄 · 매 프레임 일 없음)
  let arr = null, arrT = 0;
  function arrOff() { clearInterval(arrT); arrT = 0; if (arr) { arr.remove(); arr = null; } }
  function arrive(f, e) {
    arrOff(); if (play || dead) return;
    let own = null; for (const [fid, F] of FL) if (DATA[fid] === f && F.hot) own = F.hot.hot; if (!own) return;
    arr = map.interact.add({ x: e.x, y: e.y, z: e.z, r: 0.9, label: own.label, use: own.use });
    arrT = setInterval(() => { const me = map.player.pos(); if (dead || play || !arr || Math.hypot(me.x - e.x, me.z - e.z) > 1.2) arrOff(); }, 400);
  }
  function startTour(i) { const L = scenes(); if (!L.length) return toast('아직 장면이 없어요', 2); close(); tourI = Math.max(0, Math.min(L.length - 1, i)); showTour(true); }
  function showTour(move) {
    const L = scenes(), S = secs(); if (tourI >= L.length) tourI = L.length - 1; if (tourI < 0) return endTour();
    const [id, f] = L[tourI]; if (move) { const p = firstPlace(id); if (p) goTo(p); if (lead && window.SM_MP && window.SM_MP.lead()) setTimeout(() => window.SM_MP.gather({ b: board.id, s: id }), 250); }
    if (!tourEl) {
      tourEl = el('div', 'mp'); tourEl.id = 'memo-tour'; wire(tourEl);
      tourEl.addEventListener('keydown', (e) => { if (e.target.matches('input,textarea')) e.stopPropagation(); });
      tourEl.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; if (t === 'end') endTour(); else if (t === 'lead') { lead = !lead; if (lead) window.SM_MP.gather({ b: board.id, s: scenes()[tourI][0] }); showTour(false); map.hud.toast(lead ? '👥 장면마다 방 친구들이 선생님 곁으로 와요' : '👥 다 같이 끔', 2.5); } else step(t === 'next' ? 1 : -1); });
    }
    const a = document.activeElement; if (tourEl.contains(a) && a.matches('input') && a.value) return;
    tourEl.innerHTML = '<div class="sm" style="margin-bottom:6px;font-weight:800">▶ 장면 ' + (tourI + 1) + ' / ' + L.length + (S.length ? ' · ' + esc(S[secOf(f, S)]) : '') + (firstPlace(id) ? '' : ' · 📍 깃발 없는 장면') + '</div>' + cardHTML(id, f, tourI + 1, { noGo: true, noAdd: true })
      + '<div class="row">' + (window.SM_MP && window.SM_MP.lead && window.SM_MP.lead() ? '<button class="' + (lead ? '' : 'sub') + '" data-t="lead" title="선생님 발표 — 장면마다 방 친구들도 같이">👥 다 같이 ' + (lead ? '켬' : '끔') + '</button><span style="flex:1"></span>' : '') + '<button class="sub" data-t="end">✕ 그만</button><button class="sub" data-t="prev"' + (tourI ? '' : ' disabled style="opacity:.4"') + '>◀ 이전 (B)</button><button data-t="next">' + (tourI < L.length - 1 ? '다음 ▶ (N)' : '🏁 끝') + '</button></div>';
  }
  function step(d) { const n = scenes().length; if (tourI + d >= n) { endTour(); toast('🏁 마지막 장면까지 봤어요', 2); return; } tourI = Math.max(0, tourI + d); showTour(true); }
  function endTour() { if (tourEl) tourEl.remove(); tourEl = null; tourI = -1; lead = false; }

  // ───────── 📤 정리 ─────────
  function summaryText(full = teacher) {   // full = 퀴즈 정답·힌트까지(선생님 · Claude에게 넘길 글) — 아이 화면은 카드와 같은 규칙(쓴 친구만)
    if (isW()) return wsummary(full);
    const L = scenes(), S = secs(), out = ['# 메타버스 메모장 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 장면 ' + L.length + '개 · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 번호 = 장면 순서 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    const at = (f) => placed(f) ? '📍 ' + whereOf(f) + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' : '';
    let cur = -1;
    L.forEach(([id, f], i) => {
      const s = secOf(f, S); if (S.length && s !== cur) { cur = s; out.push('## ' + (s + 1) + '. ' + S[s]); }
      const lk = f.lk ? Object.keys(f.lk).length : 0;
      out.push('### 장면 ' + (i + 1) + (f.end ? ' 🏁(결말)' : joinedAt(f, i + 1) ? ' 🔗(갈래를 일부러 합침 — 다음 장면으로)' : '') + ' — ' + String(f.tx).replace(/\n/g, ' ') + '  (✍️ ' + f.by + (lk ? ' · ❤️ ' + lk : '') + ')');
      if (placed(f)) out.push('   ' + at(f));
      for (const [, x] of kids(id)) {
        const A = KBY[x.k] || PLACE;
        if (x.k === 'quiz') { const see = full || x.by === name; out.push('   ' + (QTN[x.qt || 'text'] || '🔐 퀴즈') + ': ' + x.tx + ' · 정답: ' + (see ? quizAns(x) : '(쓴 친구·선생님만 봐요)') + (x.qt === 'pick' && x.opt ? ' (보기: ' + String(x.opt).split('\n').join(' / ') + ')' : '') + (x.hint ? (see ? ' · 💡 ' + x.hint : ' · 💡 힌트 있음') : '') + (x.go ? ' · 맞히면 → ' + x.go + '번 장면' : '') + (placed(x) ? '  ' + at(x) : '') + ' · ✍️ ' + x.by); continue; }
        if (x.k === 'place') { out.push('   📍 일어나는 곳' + (x.tx ? ' — ' + x.tx : '') + ': ' + (placed(x) ? at(x).slice(3) : '(자리 없음)') + ' · ✍️ ' + x.by); continue; }
        out.push('   ' + A.e + ' ' + A.n + (x.who ? ' [' + x.who + ']' : '') + ': ' + (x.k === 'say' ? '“' + x.tx + '”' : x.tx || '') + (placed(x) ? '  ' + at(x) : '') + ' · ✍️ ' + x.by);
        if (x.opt) out.push('      보기: ' + String(x.opt).replace(/\n/g, ' / '));
      }
      if (f.re) for (const r of Object.values(f.re).filter((r) => r && r.tx).sort((a, b) => (a.t || 0) - (b.t || 0))) out.push('   💬 ' + r.by + ': ' + r.tx);
    });
    const O = orphans(); if (O.length) { out.push('', '## 장면에 안 붙인 것'); for (const [, x] of O) out.push('- ' + (KBY[x.k] || PLACE).e + ' ' + (x.who ? '[' + x.who + '] ' : '') + (x.tx || '') + (placed(x) ? '  ' + at(x) : '')); }
    if (full) {   // 세계 판처럼 무엇으로 만들지까지 — 선생님이 붙여 넣으면 Claude가 매번 같은 길로(v3 이야기 카드)
      const hasQ = L.some(([sid]) => kids(sid).some(([, x]) => x.k === 'quiz'));
      out.push('', '## Claude에게 — 구현 부탁(선생님이 고쳐 써도 돼요)',
        '- 판 id ' + board.id + ' — Claude는 REST metaverse/boards/' + board.id + '/flags로 다시 읽어도 돼요.',
        '- 이 판을 v3 「📖 이야기」 카드 하나로 만들어 주세요(docs/tasks/new_episode.md): ✏️ 우리 반이 쓴 그대로 판 + ✨ 빈칸을 채운 판 · 끝 화면 비교 목록(✏️ 우리 반이 정한 것 / ✨ AI가 채운 빈칸).',
        '- 장면 = 위 순서 · 장면 자리 = 위 📍 좌표(깃발 없는 장면은 그 글에 맞는 곳) · ❓ 고르기 = 갈림길(→ N번 장면) · 🏁 = 결말 · 📦 물건 = 줍기 · 💬·🧑 = 말·인물(아이가 쓴 who 그대로).',
        ...(hasQ ? ['- 🔐 퀴즈·자물쇠는 정답·힌트 그대로 풀어야 넘어가는 단계로(방탈출처럼) · 📦로 여는 자물쇠는 그 물건을 먼저 줍게 — 이야기 진행기에 없는 단계는 더할지 선생님께 먼저 여쭤 봐요.'] : []),
        '- 실제 친구 이름: 아이가 쓴 말·행동은 그대로, Claude가 지어 넣는 대사·행동은 이름 없는 역할(반 친구·1학년 동생)이나 「나」로 · 선생님은 직함으로 · 학교에 대한 사실(행사·수상·역사)은 지어내지 않기.',
        '- ❤️·💬 댓글 의견도 살피기 · 빈 칸은 Claude가 채우되 「Claude가 채운 것」 목록을 따로 알려 주기.');
    }
    return out.filter((x, i) => x !== '' || i > 3).join('\n');
  }
  function summary() {
    const P = open('memo-sum'), txt = summaryText();
    P.innerHTML = (teacher ? '<h3>📤 정리 — Claude에게 넘길 글</h3><div class="sm">선생님: 아래 글을 복사해 Claude에게 붙여 넣거나, 판 이름만 알려 줘도 돼요(Claude가 바로 읽어요).</div>'
        : '<h3>📤 ' + (isW() ? '우리 세계' : '우리 이야기') + ' 정리</h3><div class="sm">' + (isW() ? '우리가 쓴 카드를 칸마다 모아 봤어요.' : '우리가 쓴 장면을 순서대로 모아 봤어요. 🔑 퀴즈 정답·힌트는 쓴 친구와 선생님만 봐요.') + '</div>') + '<pre></pre><div class="row"><button class="sub" id="mmB">◀ ' + (isW() ? '세계 판' : '이야기 판') + '</button><button id="mmCp">📋 복사하기</button></div>';
    P.querySelector('pre').textContent = txt;
    P.querySelector('#mmB').onclick = boardView;
    P.querySelector('#mmCp').onclick = async () => { try { await navigator.clipboard.writeText(txt); toast('📋 복사했어요', 2); } catch (e) { toast('복사가 막혔어요 — 글을 직접 골라 복사해 주세요', 3); } };
  }

  // ───────── 입력 · 칩 ─────────
  const cross = el('div', ''); cross.id = 'memo-x';
  // 칩 차례 = 판 이름 → 🚩 → 📖 → 🛤 → 🔁 그대로(10-04 재시험: 해 보기 동안 🚩 칩을 뗐다 붙여 끝나면 📖 뒤로 갔다) — 모드가 바뀌면 넷을 떼고 차례대로 다시
  let chipMode = '';
  function chipOrder(m) { if (chipMode && chipMode !== m) for (const k of ['memo-f', 'memo-l', 'memo-p', 'memo-s']) map.hud.chip(k, null); chipMode = m; }
  function chips() {
    if (isW()) {
      chipOrder('world');
      map.hud.chip('memo-p', null);
      if (!canWrite()) map.hud.chip('memo-f', '🔒 보기만 하는 판', { onClick: lockMsg });
      else map.hud.chip('memo-f', '＋ 세계 카드 쓰기 (F)', { onClick: () => { if (!panel) { back = null; form({}); } } });
      map.hud.chip('memo-l', '🌍 세계 판 (L)', { onClick: () => { if (!panel) boardView(); } });
      map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) pickBoard(); } });
      flagsShow(true); map.minimap.show(); return;
    }
    if (play) {   // 해 보기: 현실 = 안내만 · 걷는 중 = ⏩ 바로 가기 · 책 읽기·장면 창이 떠 있을 땐 칩 없음(눌러도 아무 일 없던 것)
      chipOrder('play');
      map.hud.chip('memo-p', null);
      if (play.real) map.hud.chip('memo-f', '🏫 진짜 장소에서 번호를 넣어요', { onClick: () => toast('🏫 진짜 그 장소에 붙은 번호 카드를 찾아 아래 칸에 넣어요', 2.5) });
      else if (!play.book && play.go) map.hud.chip('memo-f', '⏩ 장면 자리로 바로 가기', { onClick: () => { if (play && play.go) play.go(); } });
      else map.hud.chip('memo-f', null);
      map.hud.chip('memo-l', play.book ? '⏹ 그만 읽기' : '⏹ 이야기 그만', { onClick: () => playStop(play && play.book ? '⏹ 그만 읽었어요' : '⏹ 이야기를 그만했어요') }); map.hud.chip('memo-s', null); return;
    }
    chipOrder('story');
    if (!canWrite()) map.hud.chip('memo-f', '🔒 보기만 하는 판', { onClick: lockMsg });   // 잠근 판 = 꽂기 칩 대신 안내(onClick을 바꿔 옛 꽂기 동작이 남지 않게)
    else map.hud.chip('memo-f', moving ? '🚩 「' + short((DATA[moving] || {}).who || (DATA[moving] || {}).tx, 8) + '」 깃발 — 땅을 톡 · F · Esc 취소' : placing ? '🚩 ' + (numMap().get(placing) || '') + '번 장면 깃발 — 땅을 톡 · F · Esc 취소' : '🚩 깃발 (땅을 톡 · F)', { onClick: () => { if (panel) return; if (moving) moveAt(aimPoint()); else if (placing) placeAt(aimPoint()); else { back = null; form({ pt: aimPoint() }); } } });
    map.hud.chip('memo-l', '📖 이야기 판 (L)', { onClick: () => { if (!panel) boardView(); } });
    map.hud.chip('memo-p', pathOn ? '🛤 이야기 길 끄기' : '🛤 이야기 길 보기', { onClick: () => { if (!panel) pathToggle(); } });
    map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) { endTour(); pickBoard(); } } });
    flagsShow(true);   // 해 보기가 끝나면 깃발·'E 장면 보기'를 다시
    map.minimap.show();
  }
  const onKey = (e) => {
    if (!board || panel || e.repeat || play) return;
    if (e.code === 'KeyF') { e.preventDefault(); hereOff(); back = null; if (isW()) { form({}); return; } if (moving) moveAt(aimPoint()); else if (placing) placeAt(aimPoint()); else form({ pt: aimPoint() }); }
    else if (e.code === 'KeyL') { e.preventDefault(); hereOff(); boardView(); }
    else if (tourEl && e.code === 'KeyN') { e.preventDefault(); step(1); }
    else if (tourEl && e.code === 'KeyB') { e.preventDefault(); step(-1); }
    else if (hereEl && /^(Key[WASD]|Arrow)/.test(e.code)) hereOff();
  };
  addEventListener('keydown', onKey);
  pickBoard();

  return {
    tick() {},
    stop() { dead = true; window.SM_ACT = null; arrOff(); clearTimeout(pathT); pathClear(); if (play) { const P0 = play; play = null; if (P0.wk) P0.wk(false); if (P0.rfin) P0.rfin(); if (P0.mk) P0.mk.remove(); } clearTimeout(syncT); if (es) es.close(); if (esB) esB.close(); hereOff(); removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); removeEventListener('sm-click', onWorldClick); removeEventListener('sm-cmd', onCmd); removeEventListener('sm-teacher', onTeacher); removeEventListener('resize', onRs); for (const id of [...FL.keys()]) drop3d(id); ui.remove(); css.remove(); },
    get board() { return board; }, get scenes() { return scenes().map(([id, f], i) => ({ id, n: i + 1, ...f, kids: kids(id).map(([kid, x]) => ({ id: kid, ...x })) })); }, summary: () => board ? summaryText() : '',
    get coach() { return board ? (isW() ? wcoach() : coach()) : []; }, get stations() { return board && !isW() ? stations().map((t) => ({ no: t.no, code: t.code, zone: t.f.zone, what: t.what, kind: t.kind })) : []; }, realKitHtml: () => realKitHtml(), real: () => playStory({ real: true }), get cards() { return wcards().map(([id, f]) => ({ id, ...f })); }, get kind() { return KIND; }, paths: () => { if (!pathOn) pathToggle(); return new Promise((r) => setTimeout(() => r(pathObjs.length), 6000)); }, book: () => playStory({ book: true }),
    place: (o) => form({ pt: aimPoint(), ...(o || {}) }), view: boardView, tour: startTour, play: () => playStory(), get playing() { return play ? { i: play.i, items: play.items.slice() } : null; }, moveTo: (id, sec, before) => moveTo(id, sec, before),
    enter: (id, info) => { name = name || '시험'; board = { id, ...info }; listen(); chips(); },
  };
}
