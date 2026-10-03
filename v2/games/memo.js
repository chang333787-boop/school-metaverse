// 메타버스 메모장(MEMO-1 · 10-03 교사 '운동장 어디에 깃발을 꽂고 여기에 뭐가 필요해요 — 저장하면 내가 보고 Claude에게 만들라고') — RPG 생각판의 메타버스판.
//   판 1~10번(선생님이 정해 둔 판에 들어감) · Firebase class-rpg metaverse/boards/<판>/flags · 같은 판 친구 것이 바로 보임
//   MEMO-3(10-03 교사 '종류가 많으면 헷갈림 — 사건(장면)을 먼저 적고 거기에 인물·장소·대사·물건을 붙이는 방식 · 깃발은 몇 번 장면과 연결됐는지 보이게'):
//     📖 이야기 판(L) = 장면 카드(1, 2, 3… · 끌어서 순서 · 선생님이 칸 '처음, 가운데, 끝') — 장면마다 '무슨 일이 일어나요?' + 덧붙이기(🧑 인물 · 💬 대사 · 📦 물건 · ❓ 고르기)
//     🚩 깃발 = '몇 번 장면'을 고르고 꽂음(장면이 일어나는 곳 · 인물·물건·대사가 있는 곳) — 깃발 색·번호 = 장면 · ▶ 장면 따라 걷기(N/B) · ❤️ · 💬 댓글 · 📤 정리
//   FREE-MOUSE(교사 '화면이 늘 게임에 잠겨 옆 단추를 누르기 힘들다'): 메모장에선 마우스가 늘 보임 · 끌어서 둘러보기 · 땅을 톡 누르면 '🚩 여기에 꽂기'
//   STORY-2(10-03 밤 · 생각판 '이야기 판' 새 구상 참고): 이야기 줄기 문장(옛날 옛적에·그러던 어느 날·그래서·마침내·그 뒤로) · 🏁 결말 표시(장면 end) · 📖 책처럼 읽기 · 🧭 이야기 코치(결말·없는 장면·갈 곳 없는 보기·아무 데서도 안 가는 장면)
//   🛤 이야기 길(PATH-1 · 10-03 교사 '깃발 꽂는 것과 잘 이어져야'): 장면 깃발 → 다음 장면 깃발을 학교 바닥에 걷는 길(길격자)로 — 갈림길은 갈라지는 길(색 = 가는 장면) · 깃발 없는 장면은 카드·코치에서 바로 꽂으러
//   🎮 이야기로 해 보기(PLAY-1 · 10-03 밤): 판의 장면 순서대로 — 장면 자리(첫 깃발)까지 걸어가면 장면 글 → 💬 대사·🧑 인물·📦 물건(줍기) → ❓ 고르기('→ N번 장면'이면 그 장면으로) → 🏁 끝 · 쓰고 바로 해 보는 수업
//   선생님(🔒 4자리 · 함께하기와 같은 비밀번호): 판 제목·질문·칸 · 잠금 · 🗂 관리(비우기 = 판 번호를 적어야 · 비운 것은 trash에 보관 → ↩️ 되돌리기)
//   🌍 세계 만들기(WORLD-1 · 10-03 교사 '메타버스는 두 갈래 — 이야기 설계 · 마법 세계처럼 새로운 세계 만들기(세계관 상상) — 교사가 관리에서 보고 Claude에게 넣으면 구현'):
//     판 종류 boardList ty:'world'(세계 1~5번 판 w01~w05) · 카드 = 여섯 칸(🌍 어떤 세계? · 📜 규칙 · 👫 누가 살아? · 🏰 어떤 곳? · ✨ 신기한 것 · 🎮 무엇을 해?) + 💡 까닭(why)
//     🏰 장소 카드는 학교에 🚩 깃발로 · 🧭 세계 코치(칸별 목표 · 구현 준비 % · 할 일이 장소·주민·신기한 것과 이어지나 · 까닭) · 📤 정리 = Claude 구현 부탁 틀까지
export const meta = { id: 'memo', title: '메타버스 메모장', api: 1 };

const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const ADD = [   // 장면에 덧붙이는 것
  { k: 'who', e: '🧑', n: '인물', q: '누가 나와요? 무엇을 해요?', who: '누구? (예: 사서 선생님 · 길 잃은 고양이)' },
  { k: 'say', e: '💬', n: '대사', q: '무슨 말을 해요?', who: '누가 말해요?' },
  { k: 'item', e: '📦', n: '물건', q: '어떤 물건이 있어요? 무엇에 써요?' },
  { k: 'choice', e: '❓', n: '고르기', q: '어떤 고민을 해요? (보기는 아래에 한 줄씩)' },
];
const SCENE = { k: 'scene', e: '🎬', n: '장면', q: '이 장면에서 무슨 일이 일어나요?' };
const PLACE = { k: 'place', e: '📍', n: '장소', q: '여기는 어떤 곳이에요? (안 적어도 돼요)' };
const KBY = Object.fromEntries([SCENE, PLACE, ...ADD].map((x) => [x.k, x]));
const OLD = { memo: '📝', event: '⚡', mark: '🏁' };
const STEMS = ['옛날 옛적에', '그러던 어느 날', '그래서', '그런데', '마침내', '그 뒤로'];   // 이야기 줄기 문장(3·4학년)
const stemFor = (n) => n === 0 ? '옛날 옛적에' : n === 1 ? '그러던 어느 날' : '그래서';   // MEMO-1·2 때 만든 카드(장면으로 보임)
const WC = [   // 세계 만들기 여섯 칸(4~6학년 — 질문 · 예시 · 줄기 문장)
  { k: 'wname', e: '🌍', n: '어떤 세계?', c: 0x339af0, goal: 1, q: '세계 이름과 한 줄 소개 — 어떤 분위기(색·날씨·소리·냄새)예요?', stems: ['이 세계의 이름은', '이곳은', '언제나'], ex: '이 세계의 이름은 「구름섬」이에요. 학교가 구름 위에 떠 있고 늘 솜사탕 냄새가 나요.' },
  { k: 'wrule', e: '📜', n: '규칙', c: 0x845ef7, goal: 2, q: '이 세계에서만 되는 일·안 되는 일은? 어기면 어떻게 돼요?', stems: ['이 세계에서는', '하지만', '만약'], ex: '이 세계에서는 노래를 부르면 몸이 떠올라요. 하지만 거짓말을 하면 다시 떨어져요.' },
  { k: 'wpeop', e: '👫', n: '누가 살아?', c: 0xf76707, goal: 2, q: '어떤 존재가 살아요? 모습·성격·하는 일은?', stems: ['이 세계에는', '모습은', '성격은'], ex: '이 세계에는 구름 토끼가 살아요. 귀가 무지개색이고 부끄러움을 많이 타요.' },
  { k: 'wplace', e: '🏰', n: '어떤 곳?', c: 0x2f9e44, goal: 3, q: '어떤 장소가 있어요? 우리 학교의 어디가 무엇으로 바뀌어요? (학교에 🚩 깃발로 꽂아요)', stems: ['우리 학교', '그곳에는', '거기에 가면'], ex: '우리 학교 도서관은 「떠다니는 책의 숲」이 돼요. 책이 새처럼 날아다녀요.' },
  { k: 'wthing', e: '✨', n: '신기한 것', c: 0xe64980, goal: 3, q: '마법·기술·물건·생물 중 신기한 것은? 어떻게 써요?', stems: ['이것을 쓰면', '이것은', '조심해야 할 점은'], ex: '「반짝 연필」로 허공에 그리면 그 물건이 진짜로 생겨요. 하루에 세 번만 돼요.' },
  { k: 'wdo', e: '🎮', n: '무엇을 해?', c: 0xf59f00, goal: 3, q: '놀러 온 친구는 무엇을 해요? 풀어야 할 문제·도전은?', stems: ['처음 온 친구는', '여기서는', '해결하면'], ex: '처음 온 친구는 구름 토끼를 찾아 길을 물어요. 무지개 다리를 고치면 하늘 섬에 갈 수 있어요.' },
];
const WBY = Object.fromEntries(WC.map((x) => [x.k, x]));
const SC = [0xff6b6b, 0xffa94d, 0xf2c200, 0x51cf66, 0x20c997, 0x339af0, 0x5c7cfa, 0xcc5de8, 0xf06595, 0x868e96];
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
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
#memo-pick,#memo-form,#memo-sum,#memo-view,#memo-admin{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:88vh;overflow:auto;padding:14px 16px;box-sizing:border-box}
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
#memo-ui .strip{display:flex;flex-wrap:wrap;gap:24px 30px;align-items:flex-start;min-height:120px}
#memo-ui .strip .cd{width:270px}
#memo-ui .strip .cd:not(:last-child)::after{content:'➜';position:absolute;right:-24px;top:40px;font-size:18px;color:#8a7b5a}
#memo-ui .strip .cd.end:not(:last-child)::after{content:'🏁';font-size:16px}
#memo-ui .cd{background:#fff;border-radius:12px;padding:9px 10px;box-shadow:0 2px 6px rgba(0,0,0,.13);border-top:8px solid var(--k);font-size:14px;position:relative;text-align:left;box-sizing:border-box}
#memo-ui .cd .hd{display:flex;gap:6px;align-items:center;font-weight:900;font-size:15px;cursor:grab;touch-action:none}
#memo-ui .cd .by{margin-left:auto;color:#5a6b80;font-weight:600;font-size:12px}
#memo-ui .cd .tx{white-space:pre-wrap;line-height:1.5;margin:5px 0;word-break:break-word;font-size:15px;font-weight:700}
#memo-ui .cd .pl{font-size:12px;color:#5a6b80;margin-bottom:4px}
#memo-ui .cd .pl.none{color:#c2410c}
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
    if (placing) { e.stopPropagation(); placing = null; chips(); toast('📍 깃발 꽂기를 그만했어요', 1.5); }
    else if (panel && board) { e.stopPropagation(); if (panel.id === 'memo-form' && back === 'board') { back = null; boardView(); } else close(); }
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
    esB = stream(DB + '/boardList/' + board.id + '.json', (type, path, d) => { BI = applyEvt(BI, type, path, d); board = { ...BI, id: board.id }; sync(); });
  }

  // ───────── 판 고르기 · 선생님 ─────────
  const hash = async (pin) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mv-memo:' + pin)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const setT = () => { teacher = true; try { sessionStorage.setItem('sm.t', '1'); } catch (e) { /* */ } };
  async function teacherLogin() {
    let saved = null; try { saved = await req('/memoPin'); } catch (e) { return toast('인터넷을 확인해 주세요', 2); }
    if (!saved) {
      const a = prompt('선생님 비밀번호(숫자 4자리)를 새로 정해 주세요'); if (!a) return; if (!/^\d{4}$/.test(a)) return toast('숫자 4자리로 정해 주세요');
      if (prompt('한 번 더 적어 주세요') !== a) return toast('두 번이 달라요. 다시 해 주세요');
      try { await req('/memoPin', 'PUT', await hash(a)); } catch (e) { return toast('저장하지 못했어요', 2); }
      setT(); toast('🔒 비밀번호를 정했어요 — 선생님 모드'); return board ? boardView() : pickBoard();
    }
    const a = prompt('선생님 비밀번호 4자리'); if (!a) return;
    if (await hash(a) !== saved) return toast('비밀번호가 달라요', 2);
    setT(); toast('🔓 선생님 모드', 2); if (board) boardView(); else pickBoard();
  }
  const secPrompt = (cur) => { const s = prompt('이야기 칸 이름(쉼표로 나눠요 · 비우면 칸 없이 한 줄)\n예) 처음, 가운데, 끝', cur || ''); return s == null ? null : s.split(/[,|]/).map((x) => x.trim()).filter(Boolean).slice(0, 6).join(', ').slice(0, 120); };
  async function pickBoard() {
    const P = open('memo-pick');
    P.innerHTML = (KIND === 'world' ? '<h3>🌍 세계 만들기' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">우리가 상상한 <b>새로운 세계</b>를 함께 쌓아요 — 어떤 세계인지, 규칙·사는 존재·장소·신기한 것·할 일을 카드로. 장소는 학교에 🚩 깃발로 꽂아요.</div>'
        : '<h3>📝 메타버스 메모장' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">우리 이야기를 <b>장면</b>으로 나눠 적고, 학교 곳곳에 그 장면의 🚩 깃발을 꽂아요. 같은 판에 들어온 친구들 것도 바로 보여요.</div>')
      + '<div class="where">내 이름 <input id="mmName" maxlength="8" style="width:150px;margin-left:6px" placeholder="이름"></div><div class="sm">선생님이 알려 준 판에 들어가요.</div><div class="bd">불러오는 중…</div>'
      + '<div class="row">' + (teacher ? '' : '<button class="sub" id="mmT">🔒 선생님</button>') + '<button class="sub" id="mmQuit">그만하기</button></div>';
    const nm = P.querySelector('#mmName'); nm.value = name;
    P.querySelector('#mmQuit').onclick = () => map.quit && map.quit();
    if (!teacher) P.querySelector('#mmT').onclick = teacherLogin;
    let list = {};
    try { list = (await req('/boardList')) || {}; } catch (e) { P.querySelector('.bd').textContent = '판 목록을 불러오지 못했어요 — 인터넷을 확인해 주세요'; return; }
    if (dead || panel !== P) return;
    const ids = Object.keys(list).filter((id) => list[id] && ((list[id].ty === 'world') === (KIND === 'world'))).sort((a, b) => (list[a].n || 99) - (list[b].n || 99) || (list[a].c || 0) - (list[b].c || 0)), bd = P.querySelector('.bd'); bd.innerHTML = '';
    if (!ids.length) bd.innerHTML = '<div class="sm">아직 판이 없어요.</div>';
    for (const id of ids) {
      const L = list[id], row = el('div', '', null, bd); row.style.cssText = 'display:flex;gap:6px;align-items:stretch';
      const b = el('button', '', (L.lock ? '🔒 ' : L.ty === 'world' ? '🌍 ' : '📌 ') + esc(L.t) + (L.p ? '<small>' + esc(L.p) + '</small>' : ''), row); b.style.flex = '1'; b.onclick = () => enter(id, L);
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
    board = { id, ...info }; close(); endTour(); placing = null; pathClear(); listen(); chips(); window.SM_ACT = (isW() ? '🌍 ' : '📝 ') + short(info.t, 10);
    toast(isW() ? '🌍 「' + board.t + '」 — L = 세계 판 · 땅을 톡 누르면 🏰 장소 깃발' : '📌 「' + board.t + '」 — 마우스로 끌면 둘러보기 · 땅을 톡 누르면 🚩 깃발 · L = 이야기 판', 5);
  }

  // ───────── 장면 · 덧붙인 것 ─────────
  const secs = () => (board && board.sec ? String(board.sec).split(/[,|]/).map((s) => s.trim()).filter(Boolean).slice(0, 6) : []);
  const secOf = (f, S) => S.length ? Math.min(S.length - 1, Math.max(0, f.sec | 0)) : 0;
  const placed = (f) => typeof f.x === 'number' && typeof f.z === 'number';
  const valid = (f) => f && typeof f === 'object' && f.k && typeof f.tx === 'string';
  const isScene = (f) => f.k === 'scene' || (!f.p && f.k !== 'place');
  function scenes() { const S = secs(); return Object.entries(DATA).filter(([, f]) => valid(f) && isScene(f)).sort((a, b) => secOf(a[1], S) - secOf(b[1], S) || (a[1].ord || 0) - (b[1].ord || 0) || (a[1].t || 0) - (b[1].t || 0)); }
  const kids = (sid) => Object.entries(DATA).filter(([, f]) => valid(f) && f.p === sid && !isScene(f)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0) || (a[1].t || 0) - (b[1].t || 0));
  const orphans = () => { const ok = new Set(scenes().map(([id]) => id)); return Object.entries(DATA).filter(([, f]) => valid(f) && !isScene(f) && !ok.has(f.p)); };
  const numMap = () => new Map(scenes().map(([id], i) => [id, i + 1]));
  const colOf = (n) => SC[(n - 1) % SC.length];
  const iconOf = (f) => isScene(f) ? (OLD[f.k] || '🎬') : (KBY[f.k] || PLACE).e;
  // 고르기 보기 속 'N번' = 장면 순서 번호 → 순서가 바뀌거나 장면이 지워지면 새 번호로 고쳐 씀
  function renumber(before, gone) {
    const after = new Map(scenes().map(([sid], i) => [sid, i + 1])), map9 = new Map();
    for (const [sid, n] of before) { if (sid === gone) { map9.set(n, '?'); continue; } const m = after.get(sid); if (m && m !== n) map9.set(n, m); }   // 지운 장면을 가리키던 보기 = '?번'(코치가 짚음)
    if (!map9.size) return;
    for (const [cid, x] of Object.entries(DATA)) {
      if (!valid(x) || x.k !== 'choice' || !x.opt) continue;
      const opt = x.opt.replace(/(\d{1,2})(\s*번)/g, (m, n, b) => map9.has(+n) ? map9.get(+n) + b : m);
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
  function label3d(f) { if (isScene(f)) return (f.end ? '🏁 ' : '🎬 ') + short(f.tx, 10); if (f.k === 'place') return '📍 ' + (short(f.tx, 10) || short(f.near || f.zone, 10)); return (KBY[f.k] || PLACE).e + ' ' + short(f.who || f.tx, 10); }
  const sigOf = (f, num) => [num, f.k, f.tx, f.who, f.x, f.y, f.z, f.end].join('|');
  function draw3d(id, f, num) {
    drop3d(id);
    const col = num ? colOf(num) : 0xadb5bd, g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); g.add(new THREE.Mesh(clothG, lam(col)));
    const tg = tag(num || '?', label3d(f), col); tg.position.y = 2.55; g.add(tg);
    map.add(g);
    FL.set(id, { g, tag: tg, sig: sigOf(f, num), hot: map.interact.add({ x: f.x, y: f.y || 0, z: f.z, r: 1.6, label: (num ? num + '번 장면' : '깃발') + ' 보기', use: () => { if (!play) view(isScene(f) ? id : f.p); } }) });
  }
  function drawW(id, f) {   // 세계 카드 깃발(칸 색 · 동그라미 안 = 칸 그림)
    drop3d(id);
    const C = WBY[f.k] || WC[3], g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); g.add(new THREE.Mesh(clothG, lam(C.c)));
    const tg = tag(C.e, short(f.tx, 12), C.c); tg.position.y = 2.55; g.add(tg); map.add(g);
    FL.set(id, { g, tag: tg, sig: sigOf(f, C.k), hot: map.interact.add({ x: f.x, y: f.y || 0, z: f.z, r: 1.6, label: C.e + ' 카드 보기', use: () => view(id) }) });
  }
  let syncT = 0;
  function sync() { if (!syncT) syncT = setTimeout(syncNow, 40); }
  function syncNow() {
    clearTimeout(syncT); syncT = 0; if (dead) return;
    if (isW()) {
      const live = new Set(), marks = [];
      for (const [id, f] of Object.entries(DATA)) { if (!valid(f) || !placed(f)) continue; live.add(id); const C = WBY[f.k] || WC[3];
        if (!FL.get(id) || FL.get(id).sig !== sigOf(f, C.k)) drawW(id, f); marks.push({ x: f.x, z: f.z, color: hex(C.c), label: C.e + ' ' + short(f.tx, 6), floor: (f.y || 0) > 2.5 ? 2 : 1 }); }
      for (const id of [...FL.keys()]) if (!live.has(id)) drop3d(id);
      if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '🌍 ') + short(board.t, 14) + ' · 카드 ' + wcards().length + '개');
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
    if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '📌 ') + short(board.t, 14) + ' · 장면 ' + N.size + '개');
    if (!play) map.minimap.setMarks(marks);
    if (panel && (panel.id === 'memo-board' || panel.id === 'memo-view')) rerender();
    if (tourEl) showTour(false);
    pathSoon();
  }

  // ───────── 장면 카드(이야기 판·장면 보기·걸어 보기 공용) ─────────
  const openRe = new Set();
  const linkN = (h) => h.replace(/(\d{1,2})\s*번(?:\s*장면)?/g, (m, n) => '<a href="#" data-a="jump" data-n="' + n + '" style="color:#1c7ed6;font-weight:800">' + m + '</a>');   // '3번 장면' → 그 장면 보기
  function placeLine(f) { return '📍 ' + esc(f.zone) + (f.near ? ' · ' + esc(f.near) + ' 근처' : ''); }
  function cardHTML(id, f, num, o = {}) {
    const lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name)), can = canWrite(), own = (x) => teacher || x.by === name;
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [];
    const K = kids(id), places = [f, ...K.map(([, x]) => x)].filter(placed).length, showRe = o.re || openRe.has(id);
    let h = '<div class="cd' + (f.end ? ' end' : '') + '" data-id="' + esc(id) + '" style="--k:' + hex(colOf(num)) + '"><div class="hd" title="끌어서 순서 바꾸기"><span class="num" style="background:' + hex(colOf(num)) + '">' + num + '</span>' + (OLD[f.k] ? OLD[f.k] + ' ' : '') + '장면' + (f.end ? ' <span style="background:#fff3bf;border:1px solid #f59f00;border-radius:8px;padding:0 6px;font-size:12px">🏁 결말</span>' : '') + '<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + '<div class="tx">' + esc(f.tx) + '</div>'
      + (() => { const pk = placed(f) ? f : (K.find(([, x]) => x.k === 'place' && placed(x)) || [])[1];
        return pk ? '<div class="pl">' + placeLine(pk) + (places > 1 ? ' · 🚩 ' + places + '개' : '') + '</div>' : (places ? '<div class="pl">🚩 깃발 ' + places + '개</div>' : canWrite() ? '<div class="pl none"><button data-a="flag" style="padding:2px 8px;font-size:12px;background:#fff4e6;color:#d9480f;border:1px dashed #f08c00">📍 아직 깃발이 없어요 — 🚩 꽂으러 가기</button></div>' : '<div class="pl none">📍 아직 깃발이 없어요</div>'); })();
    for (const [kid, x] of K) {
      const A = KBY[x.k] || PLACE;
      const where = placed(x) ? ' <span class="sm">📍 ' + esc(x.near || x.zone) + '</span>' : '';
      h += '<div class="it" data-kid="' + esc(kid) + '"><span>' + A.e + '</span><span class="t">' + (x.k === 'place' ? '<b>일어나는 곳</b> ' + esc(x.tx) + where
          : (x.who ? '<b>' + esc(x.who) + '</b> ' : '') + (x.k === 'say' ? '“' + esc(x.tx) + '”' : esc(x.tx)) + (x.opt ? '<br><span class="sm">' + linkN(esc(x.opt)).replace(/\n/g, '<br>') + '</span>' : '') + where)
        + '<span class="sm"> · ' + esc(x.by) + '</span></span>'
        + (placed(x) && !o.noGo ? '<button data-a="goi" title="그 자리로">🚶</button>' : '') + (can && own(x) ? '<button data-a="editi" title="고치기">✏️</button>' : '') + '</div>';
    }
    if (can && !o.noAdd) h += '<div class="add">' + ADD.map((A) => '<button data-a="add" data-k="' + A.k + '">＋ ' + A.e + ' ' + A.n + '</button>').join('') + '<button data-a="flag" title="이 장면의 깃발을 꽂으러">＋ 🚩 깃발</button></div>';
    h += '<div class="ft"><button data-a="like" class="' + (me ? 'on' : '') + '" title="좋아요">' + (me ? '❤️' : '🤍') + ' ' + (lk.length || '') + '</button><button data-a="re" title="댓글">💬 ' + (re.length || '') + '</button><span style="flex:1"></span>'
      + ((placed(f) || places) && !o.noGo ? '<button data-a="go" title="이 장면 자리로 가 보기">🚶</button>' : '') + (can && own(f) ? '<button data-a="edit" title="장면 고치기">✏️</button>' : '') + '</div>';
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
  function firstPlace(id) { const f = DATA[id]; if (f && placed(f)) return f; const k = kids(id).find(([, x]) => placed(x)); return k ? k[1] : null; }
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
      else if (a === 'flag') { if (!canWrite()) return lockMsg(); close(); endTour(); placing = id; chips(); toast(isW() ? '🚩 「' + short(f.tx, 10) + '」 — 학교에서 이곳을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc' : '🚩 ' + (numMap().get(id) || '') + '번 장면 — 꽂을 땅을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5); }
      else if (a === 'wadd') { if (!canWrite()) return lockMsg(); back = 'board'; form({ cat: b.dataset.k }); }
    });
    P.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ri input') && !e.isComposing) { e.preventDefault(); sendRe(e.target.closest('.cd')); } });
    P.addEventListener('focusout', () => setTimeout(flush, 400));
  }
  let pend = false, drag = null;
  const busy = () => { const a = document.activeElement; return !!drag || !!(panel && a && panel.contains(a) && a.matches('input,textarea') && a.value); };
  function rerender(force) { if (!panel) return; if (!force && busy()) { pend = true; return; } pend = false; if (panel.id === 'memo-board') boardView(); else if (panel.id === 'memo-view') view(viewId); }
  function flush() { if (pend && !busy()) rerender(); }

  // ───────── 📖 이야기 판 ─────────
  function boardView() {
    if (!board) return;
    if (isW()) return worldView();
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const S = secs(), L = scenes(), N = new Map(L.map(([id], i) => [id, i + 1])), can = canWrite(), O = orphans();
    let h = '<div class="top"><h3>📖 ' + esc(board.t) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + (teacher ? '<button class="sub" data-b="sec" title="이야기 칸 정하기">⚙️ 칸</button><button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button><button class="sub" data-b="admin" title="판 비우기·되돌리기">🗂 관리</button>' : '<button class="sub" data-b="t" title="선생님">🔒</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="bar">' + (can ? '<button data-b="new">＋ 새 장면</button>' : '') + (L.length ? '<button data-b="play" style="background:#2b8a3e">🎮 이야기로 해 보기</button><button class="sub" data-b="book">📖 책처럼 읽기</button>' : '') + '<button class="sub" data-b="tour">▶ 장면 따라 걷기</button><button class="sub" data-b="sum">📤 정리</button>'
      + '<span class="sm" style="margin-left:6px">' + (can ? '장면 번호 줄을 끌면 순서가 바뀌어요' : '선생님이 잠근 판 — 보기만') + '</span></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    if (!L.length) body.innerHTML = '<div class="sm" style="padding:24px;text-align:center;font-size:15px;line-height:1.8">아직 장면이 없어요.<br><b>＋ 새 장면</b>으로 「무슨 일이 일어나는지」부터 적어 봐요.<br>그다음 장면마다 🧑 인물 · 💬 대사 · 📦 물건을 덧붙이고, 학교에 🚩 깃발을 꽂아요.</div>';
    else if (S.length) body.innerHTML = '<div class="lanes">' + S.map((s, si) => '<div class="lane" data-sec="' + si + '"><h4>' + (si + 1) + '. ' + esc(s) + '</h4>' + L.filter(([, f]) => secOf(f, S) === si).map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>').join('') + '</div>';
    else body.innerHTML = '<div class="strip" data-sec="0">' + L.map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>';
    if (L.length) { const C = coach(); const cb = el('div', '', '<b>🧭 이야기 코치</b> ' + C.map((c) => '<span' + (c.b ? ' data-b="' + c.b + '"' : '') + ' style="display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:9px;font-size:12px;font-weight:700;' + (c.b ? 'cursor:pointer;text-decoration:underline;' : '') + 'background:' + (c.ok ? '#d3f9d8;color:#2b8a3e' : '#fff4e6;color:#d9480f') + '">' + (c.ok ? '● ' : '● ') + esc(c.t) + '</span>').join(''), body); cb.style.cssText = 'margin-top:12px;font-size:13px'; }
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
      else if (a === 'noflag') { const t = scenes().find(([id]) => !firstPlace(id)); if (t && canWrite()) { close(); placing = t[0]; chips(); toast('🚩 ' + (numMap().get(t[0]) || '') + '번 장면 — 꽂을 땅을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5); } }
      else if (a === 'sum') summary();
      else if (a === 't') teacherLogin();
      else if (a === 'admin') admin();
      else if (a === 'sec') { const s = secPrompt(board.sec); if (s == null) return; board.sec = s; boardView(); try { await req('/boardList/' + board.id, 'PATCH', { sec: s || null }); } catch (er) { toast('바꾸지 못했어요', 2); } }
      else if (a === 'lock') { try { await req('/boardList/' + board.id + '/lock', 'PUT', !board.lock); } catch (er) { toast('바꾸지 못했어요', 2); } }
    };
  }
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
  function placeName(x, y, z) {
    const zn = map.zoneAt(x, y + 0.2, z) || map.zoneAt(x, y, z);
    let near = '', bd = 12;
    for (const p of map.pois({ src: 'landmark' })) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd && Math.abs((p.y || 0) - y) < 3) { bd = d; near = p.label; } }
    return { zone: zn ? zn.label : '학교 바깥', near };
  }
  const placeFields = (pt) => { const pn = placeName(pt.x, pt.y, pt.z), c = cam.position; return { x: pt.x, y: pt.y || 0, z: pt.z, zone: String(pn.zone || '').slice(0, 40), near: String(pn.near || '').slice(0, 40), cam: [c.x, c.y, c.z].map((v) => +v.toFixed(2)) }; };
  // 땅을 톡 → 그 자리에 '🚩 여기에 꽂기' 단추(누르면 꽂기 창) · 다른 데를 누르거나 움직이면 사라짐
  let hereEl = null, herePt = null, hereMk = null;
  function hereOff() { if (hereEl) hereEl.remove(); hereEl = null; herePt = null; if (hereMk) { hereMk.remove(); hereMk = null; } }
  function onWorldClick(e) {
    if (!board || panel || dead || play) return;
    const d = e.detail, pt = aimPoint(d.x, d.y); hereOff(); if (!pt) return;
    if (placing) { placeAt(pt); return; }
    herePt = pt; hereMk = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b });
    hereEl = el('button', '', '🚩 여기에 꽂기'); hereEl.id = 'memo-here'; hereEl.style.left = d.x + 'px'; hereEl.style.top = d.y + 'px';
    hereEl.onclick = (ev) => { ev.stopPropagation(); const p = herePt; hereOff(); form({ pt: p }); };
  }
  addEventListener('sm-click', onWorldClick);
  function onCmd(e) { const c = e.detail; if (!c || !board || c.b !== board.id || !c.s || dead) return; if (panel && panel.id !== 'memo-view') return; endTour(); view(c.s); }   // 선생님 발표: 그 장면 카드를 같이 봄
  addEventListener('sm-cmd', onCmd);
  let placing = null;
  async function placeAt(pt) {   // 장면 카드의 '＋ 🚩 깃발' → 그 장면의 장소 깃발
    const sid = placing; placing = null; chips(); if (!DATA[sid]) return;
    if (isW()) {   // 세계 카드 → 그 카드 자리를 학교에(깃발)
      const pf = placeFields(pt); const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 2500);
      try { await req(fpath(sid), 'PATCH', pf); map.sfx('ding'); toast('🚩 ' + pf.zone + (pf.near ? ' · ' + pf.near : '') + '에 꽂았어요!', 2.5); } catch (e) { toast('저장하지 못했어요', 2); }
      return;
    }
    form({ pt, scene: sid, kind: 'place' });
  }

  // ───────── 쓰기 창(장면 · 덧붙이기 · 깃발) ─────────
  //   o.id = 고치기 · o.pt = 이 자리에 깃발 · o.scene = 어느 장면에 · o.kind = 처음 고른 종류
  let lastScene = null;
  function form(o = {}) {
    if (!board) return;
    if (isW()) return wform(o);
    if (!canWrite()) return lockMsg();
    const old = o.id ? DATA[o.id] : null; if (o.id && !old) return;
    if (old && !teacher && old.by !== name) return toast('✍️ ' + old.by + '의 것이에요 — 내가 쓴 것만 고칠 수 있어요', 3);
    const L = scenes(), N = new Map(L.map(([id], i) => [id, i + 1])), S = secs();
    const pt = old ? null : o.pt || null;
    let kind = old ? (isScene(old) ? 'scene' : old.k) : o.kind || (pt ? null : 'scene');
    let sid = old ? (isScene(old) ? null : old.p) : o.scene || (pt ? (lastScene && DATA[lastScene] ? lastScene : null) : null);
    if (pt && !o.scene && !L.length) kind = 'scene';   // 장면이 하나도 없으면 이 자리가 첫 장면
    if (pt && !kind && sid) kind = 'place';   // 지난번 장면이 골라져 있으면 '그 장면이 일어나는 곳'부터
    const pn = pt ? placeName(pt.x, pt.y, pt.z) : old && placed(old) ? { zone: old.zone, near: old.near } : null;
    if (pt) { const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 3000); }
    const P = open('memo-form');
    let endSel = !!(old && old.end);
    let optRows = old && old.k === 'choice' ? choiceOpts(old).map((x) => ({ t: x.label, n: x.n || '' })) : [];
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
        h += '<textarea id="mmTx" maxlength="300"' + (isS && !old ? ' placeholder="' + stemFor(L.length) + ' …"' : '') + '></textarea>';
        if (isS) h += '<div class="chips"><button data-endt="1" class="' + (endSel ? 'on' : '') + '">🏁 이 장면에서 이야기가 끝나요(결말)</button></div>';
        if (kind === 'choice') {   // SIM-1: 보기마다 '어느 장면으로?' 칸(4·5학년이 '→ N번' 문법을 몰라도) — 저장은 예전처럼 '글 → N번 장면' 줄
          const nn = L.length, rows = optRows.length ? optRows : [{ t: '', n: '' }, { t: '', n: '' }];
          h += '<div class="mlbl">보기 <span class="sm">(고르면 어느 장면으로 가요?)</span></div><div class="opts">' + rows.map((r, i) => '<div style="display:flex;gap:4px;margin:4px 0"><input class="ot" data-i="' + i + '" maxlength="40" placeholder="보기 ' + (i + 1) + ' (예: 급식실로 간다)" value="' + esc(r.t) + '" style="flex:1;min-width:0">'
            + '<select class="on" data-i="' + i + '" style="width:auto;max-width:46%;font:inherit;font-size:14px;border:2px solid #c9d3df;border-radius:10px;padding:6px"><option value="">→ 어느 장면?</option>' + L.map(([, sf], j) => '<option value="' + (j + 1) + '"' + (+r.n === j + 1 ? ' selected' : '') + '>→ ' + (j + 1) + '번 ' + esc(short(sf.tx, 10)) + '</option>').join('') + [1, 2, 3].map((d) => '<option value="' + (nn + d) + '"' + (+r.n === nn + d ? ' selected' : '') + '>→ ' + (nn + d) + '번(새로 쓸 장면)</option>').join('') + '</select></div>').join('') + '</div>'
            + (rows.length < 5 ? '<button class="sub" data-addopt="1" style="padding:4px 10px;font-size:13px">＋ 보기 더</button>' : '');
        }
        if (isS && S.length) h += '<div class="mlbl">이야기 칸</div><div class="chips sec">' + S.map((s, i) => '<button data-c="' + i + '" class="' + ((old ? secOf(old, S) : (o.sec || 0)) === i ? 'on' : '') + '">' + (i + 1) + '. ' + esc(s) + '</button>').join('') + '</div>';
      } else h += '<div class="sm" style="margin-top:8px">위에서 장면과 종류를 골라요.</div>';
      h += '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + '<button class="sub" id="mmNo">취소</button><button id="mmOk"' + (Q && (isS || sid) ? '' : ' disabled style="opacity:.45"') + '>💾 저장</button></div>';
      readOpts();
      const keep = { tx: (P.querySelector('#mmTx') || {}).value, who: (P.querySelector('#mmWho') || {}).value };
      P.innerHTML = h;
      const tx = P.querySelector('#mmTx'), wh = P.querySelector('#mmWho');
      if (tx) tx.value = keep.tx != null ? keep.tx : old ? old.tx || '' : '';
      if (wh) wh.value = keep.who != null ? keep.who : old ? old.who || '' : '';
      if (tx) setTimeout(() => (wh && !wh.value ? wh : tx).focus(), 30);
    };
    let secSel = old ? secOf(old, S) : (o.sec || 0);
    P.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { if (b.dataset.s === '@new') { kind = 'scene'; sid = null; } else { sid = b.dataset.s; if (kind === 'scene' || !kind) kind = pt ? 'place' : 'who'; } draw(); return; }
      if (b.dataset.k) { kind = b.dataset.k; draw(); return; }
      if (b.dataset.stem) { const t = P.querySelector('#mmTx'); if (t) { const v = t.value.replace(/^(옛날 옛적에|그러던 어느 날|그래서|그런데|마침내|그 뒤로)\s*/, ''); t.value = b.dataset.stem + ' ' + v; t.focus(); } return; }
      if (b.dataset.endt) { endSel = !endSel; b.classList.toggle('on', endSel); return; }
      if (b.dataset.addopt) { readOpts(); optRows.push({ t: '', n: '' }); draw(); return; }
      if (b.dataset.c != null) { secSel = +b.dataset.c; P.querySelectorAll('.sec button').forEach((x) => x.classList.toggle('on', x === b)); return; }
      if (b.id === 'mmNo') done();
      else if (b.id === 'mmDel') {
        const kc = isScene(old) ? kids(o.id).length : 0;
        if (!confirm(isScene(old) ? '이 장면을 지울까요?' + (kc ? '\n(덧붙인 것 ' + kc + '개도 함께 지워져요)' : '') : '이것을 지울까요?')) return;
        const was = isScene(old) ? numMap() : null, kidIds = isScene(old) ? kids(o.id).map(([k]) => k) : [];
        try { await Promise.all([req(fpath(o.id), 'DELETE'), ...kidIds.map((k) => req(fpath(k), 'DELETE'))]); } catch (er) { toast('지우지 못했어요', 2); }
        if (was) { delete DATA[o.id]; for (const k of kidIds) delete DATA[k]; renumber(was, o.id); } done();
      } else if (b.id === 'mmOk') save();
    });
    const done = () => { if (back === 'board') { back = null; boardView(); } else close(); };
    async function save() {
      readOpts();
      const isS = kind === 'scene', tx = (P.querySelector('#mmTx') || {}).value || '', who = ((P.querySelector('#mmWho') || {}).value || '').trim(), opt = optRows.filter((r) => r.t.trim()).map((r) => r.t.trim().replace(/\s*(→|->|=>)\s*\d{1,2}\s*번(\s*장면)?\s*$/, '') + (r.n ? ' → ' + r.n + '번 장면' : '')).join('\n');
      if (kind === 'choice' && !opt) return toast('보기를 하나 이상 적어요', 2);
      if (!isS && !sid) return toast('몇 번 장면인지 골라 주세요', 2);
      if (!tx.trim() && kind !== 'place') return toast(isS ? '무슨 일이 일어나는지 적어 주세요' : '내용을 적어 주세요', 2);
      const f = { k: kind, tx: dedupe(tx).slice(0, 300), who: who && (kind === 'who' || kind === 'say') ? who.slice(0, 30) : null, opt: kind === 'choice' && opt ? opt.slice(0, 300) : null };
      try {
        if (old) {
          if (isS && S.length) { f.sec = secSel; if (secSel !== secOf(old, S)) f.ord = Date.now(); }
          if (isS) f.end = endSel || null;
          await req(fpath(o.id), 'PATCH', f);
        } else {
          for (const k of ['who', 'opt']) if (f[k] == null) delete f[k];
          Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }, pt ? placeFields(pt) : {});
          if (isS) { if (S.length) f.sec = secSel; if (endSel) f.end = true; } else f.p = sid;
          const nid = newId(); await req(fpath(nid), 'PUT', f); lastScene = isS ? nid : sid;
        }
        map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : pt ? '🚩 ' + (isS ? '새 장면' : (N.get(sid) || '') + '번 장면') + ' 깃발을 꽂았어요!' : isS ? '🎬 새 장면을 만들었어요!' : '＋ 덧붙였어요!', 2.2);
      } catch (e) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
      done();
    }
    draw();
  }

  // ───────── 🌍 세계 판 — 여섯 칸 · 까닭 · 장소 깃발 · 코치 · 정리 ─────────
  const wcards = () => Object.entries(DATA).filter(([, f]) => valid(f) && WBY[f.k]);
  const likes = (f) => (f.lk ? Object.keys(f.lk).length : 0);
  function wcard(id, f, o = {}) {
    const C = WBY[f.k] || WC[0], lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name)), can = canWrite(), own = teacher || f.by === name;
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [], showRe = o.re || openRe.has(id);
    let h = '<div class="cd" data-id="' + esc(id) + '" style="--k:' + hex(C.c) + '"><div class="hd" style="cursor:default">' + C.e + ' ' + C.n + '<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + '<div class="tx">' + esc(f.tx) + '</div>'
      + (f.why ? '<div class="sm" style="background:#f8f9fa;border-radius:8px;padding:4px 7px;margin-bottom:4px;white-space:pre-wrap">💡 ' + esc(f.why) + '</div>' : '')
      + (placed(f) ? '<div class="pl">🚩 ' + placeLine(f).slice(3) + '</div>' : f.k === 'wplace' && can ? '<div class="pl none"><button data-a="flag" style="padding:2px 8px;font-size:12px;background:#fff4e6;color:#d9480f;border:1px dashed #f08c00">🚩 학교의 이곳에 꽂으러 가기</button></div>' : '');
    h += '<div class="ft"><button data-a="like" class="' + (me ? 'on' : '') + '" title="좋아요(이 생각이 좋아요)">' + (me ? '❤️' : '🤍') + ' ' + (lk.length || '') + '</button><button data-a="re" title="댓글">💬 ' + (re.length || '') + '</button><span style="flex:1"></span>'
      + (placed(f) && !o.noGo ? '<button data-a="go" title="그 자리로 가 보기">🚶</button>' : '') + (can && own ? '<button data-a="edit" title="고치기">✏️</button>' : '') + '</div>';
    if (showRe) h += '<div class="res">' + (re.map(([rid, r]) => '<div>💬 <b>' + esc(r.by) + '</b> ' + esc(r.tx) + (teacher || r.by === name ? ' <button class="x" data-a="rd" data-r="' + esc(rid) + '" title="댓글 지우기">✕</button>' : '') + '</div>').join('') || '<div class="sm">아직 댓글이 없어요</div>')
      + (can ? '<div class="ri"><input maxlength="120" placeholder="댓글 달기 (Enter)"><button data-a="rs">보내기</button></div>' : '') + '</div>';
    return h + '</div>';
  }
  function worldView() {
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const can = canWrite(), A = wcards(), W = wcoach();
    let h = '<div class="top"><h3>🌍 ' + esc(board.t) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + (teacher ? '<button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button><button class="sub" data-b="admin" title="정리 글·비우기·되돌리기">🗂 관리</button>' : '<button class="sub" data-b="t" title="선생님">🔒</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="bar">' + (can ? '<button data-b="wnew">＋ 카드 쓰기</button>' : '') + '<button class="sub" data-b="sum">📤 정리' + (teacher ? '(Claude에게)' : '') + '</button>'
      + '<span style="display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-weight:800;font-size:13px">구현 준비 <span style="display:inline-block;width:120px;height:10px;border-radius:6px;background:#e9ecef;overflow:hidden"><span style="display:block;height:100%;width:' + W.pct + '%;background:' + (W.pct >= 80 ? '#2f9e44' : W.pct >= 50 ? '#f59f00' : '#fa5252') + '"></span></span> ' + W.pct + '%</span></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    body.innerHTML = '<div class="lanes">' + WC.map((C) => { const L = A.filter(([, f]) => f.k === C.k).sort((a, b) => likes(b[1]) - likes(a[1]) || (a[1].t || 0) - (b[1].t || 0));
      return '<div class="lane" style="flex-basis:250px;border-top:6px solid ' + hex(C.c) + '"><h4>' + C.e + ' ' + C.n + ' <span class="sm">' + L.length + '/' + C.goal + (L.length >= C.goal ? ' ✓' : '') + '</span></h4><div class="sm" style="margin:-4px 0 8px">' + esc(C.q) + '</div>'
        + L.map(([id, f]) => wcard(id, f)).join('') + (can ? '<button class="sub" data-b="wcat:' + C.k + '" style="width:100%;border:1px dashed #9fb4d0;background:#fff">＋ ' + C.e + ' 쓰기</button>' : '') + '</div>'; }).join('') + '</div>';
    const cb = el('div', '', '<b>🧭 세계 코치</b> ' + W.tips.map((c) => '<span' + (c.b ? ' data-b="' + c.b + '"' : '') + ' style="display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:9px;font-size:12px;font-weight:700;' + (c.b ? 'cursor:pointer;text-decoration:underline;' : '') + 'background:' + (c.ok ? '#d3f9d8;color:#2b8a3e' : '#fff4e6;color:#d9480f') + '">● ' + esc(c.t) + '</span>').join(''), body); cb.style.cssText = 'margin-top:12px;font-size:13px';
    body.scrollTop = sc[0]; body.scrollLeft = sc[1];
    P.onclick = async (e) => {
      const b = e.target.closest('[data-b]'); if (!b || b.closest('.cd')) return;
      const a = b.dataset.b;
      if (a === 'close') close();
      else if (a === 'wnew') { if (!canWrite()) return lockMsg(); back = 'board'; form({}); }
      else if (a === 'sum') summary();
      else if (a === 't') teacherLogin();
      else if (a === 'admin') admin();
      else if (a === 'lock') { try { await req('/boardList/' + board.id + '/lock', 'PUT', !board.lock); } catch (er) { toast('바꾸지 못했어요', 2); } }
      else if (a === 'wflag') { const t = A.find(([, f]) => f.k === 'wplace' && !placed(f)); if (t && canWrite()) { close(); placing = t[0]; chips(); toast('🚩 「' + short(t[1].tx, 10) + '」 — 학교에서 이곳을 톡 누르거나 F · 취소 Esc', 5); } }
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
    if (!canWrite()) return lockMsg();
    const old = o.id ? DATA[o.id] : null; if (o.id && !old) return;
    if (old && !teacher && old.by !== name) return toast('✍️ ' + old.by + '의 카드예요 — 내가 쓴 것만 고칠 수 있어요', 3);
    const pt = old ? null : o.pt || null;
    let cat = old ? old.k : o.cat || (pt ? 'wplace' : null), goFlag = !pt;
    const pn = pt ? placeName(pt.x, pt.y, pt.z) : old && placed(old) ? { zone: old.zone, near: old.near } : null;
    if (pt) { const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 3000); }
    const P = open('memo-form');
    const draw = () => {
      const C = WBY[cat];
      let h = '<h3>' + (old ? '✏️ 카드 고치기' : pt ? '🚩 이곳은 우리 세계에서…' : '＋ 세계 카드 쓰기') + '</h3>' + (pn ? '<div class="where">📍 ' + esc(pn.zone) + (pn.near ? ' · ' + esc(pn.near) + ' 근처' : '') + '</div>' : '');
      if (!old) h += '<div class="mlbl">어느 칸이에요?</div><div class="chips wc">' + WC.map((x) => '<button data-k="' + x.k + '" class="' + (cat === x.k ? 'on' : '') + '">' + x.e + ' ' + x.n + '</button>').join('') + '</div>';
      if (C) {
        h += '<div class="mlbl">' + C.e + ' ' + esc(C.q) + '</div><div class="sm" style="margin:2px 0 4px">예) ' + esc(C.ex) + '</div>'
          + '<div class="chips stem">' + C.stems.map((t) => '<button data-stem="' + esc(t) + '">' + esc(t) + '…</button>').join('') + '</div>'
          + '<textarea id="mmTx" maxlength="300" placeholder="' + esc(C.stems[0]) + ' …"></textarea>'
          + '<div class="mlbl">💡 왜 그래요? 어떻게 돼요? <span class="sm">(더 자세히 — 안 써도 돼요)</span></div><textarea id="mmWhy" maxlength="200" style="min-height:50px" placeholder="예) 왜냐하면 … · 그래서 … · 만약 … 하면 …"></textarea>';
        if (cat === 'wplace' && !pt && !(old && placed(old))) h += '<div class="chips"><button data-gf="1" class="' + (goFlag ? 'on' : '') + '">🚩 저장하고 학교에 깃발 꽂으러 가기</button></div>';
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
      if (b.dataset.stem) { const t = P.querySelector('#mmTx'); if (t) { t.value = b.dataset.stem + ' ' + t.value.replace(new RegExp('^(' + WBY[cat].stems.join('|') + ')\\s*'), ''); t.focus(); } return; }
      if (b.dataset.gf) { goFlag = !goFlag; b.classList.toggle('on', goFlag); return; }
      if (b.id === 'mmNo') done();
      else if (b.id === 'mmDel') { if (!confirm('이 카드를 지울까요? (댓글도 함께 지워져요)')) return; try { await req(fpath(o.id), 'DELETE'); } catch (er) { toast('지우지 못했어요', 2); } done(); }
      else if (b.id === 'mmOk') {
        const tx = ((P.querySelector('#mmTx') || {}).value || '').trim(), why = ((P.querySelector('#mmWhy') || {}).value || '').trim();
        if (!WBY[cat]) return toast('어느 칸인지 골라요', 2); if (!tx) return toast('내용을 적어 주세요', 2);
        const f = { k: cat, tx: dedupe(tx).slice(0, 300), why: why ? why.slice(0, 200) : null };
        try {
          if (old) await req(fpath(o.id), 'PATCH', f);
          else { if (!f.why) delete f.why; Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }, pt ? placeFields(pt) : {}); const nid = newId(); await req(fpath(nid), 'PUT', f);
            if (cat === 'wplace' && !pt && goFlag) { map.sfx('ding'); close(); back = null; placing = nid; chips(); toast('🚩 「' + short(tx, 10) + '」 — 학교에서 이곳을 톡 누르거나 F · 취소 Esc', 5); return; } }
          map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : pt ? '🚩 우리 세계의 장소를 꽂았어요!' : '＋ ' + WBY[cat].e + ' 카드를 붙였어요!', 2.2);
        } catch (er) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
        done();
      }
    });
    draw();
  }
  // 🧭 세계 코치 — 칸별 목표 · 구현 준비 % · 할 일이 우리 세계의 장소·주민·신기한 것과 이어지나 · 까닭
  const JOSA = /(으로|에서|에게|한테|까지|부터|처럼|이랑|이에요|예요|입니다|이다|은|는|이|가|을|를|에|의|로|와|과|도|만|랑)$/;
  const STOP = new Set(['우리', '세계', '친구', '학교', '그리고', '그래서', '하지만', '이곳', '그곳', '여기', '거기', '이것', '그것', '사람', '모습', '성격', '하면', '해요', '있어요', '없어요', '돼요', '수', '것', '때', '곳', '날', '정말', '아주', '너무', '같이', '함께', '모두', '처음', '이름은']);
  const words = (t) => String(t || '').replace(/[「」『』"'“”.,!?~·…()]/g, ' ').split(/\s+/).map((w) => w.replace(JOSA, '')).filter((w) => w.length >= 2 && !STOP.has(w) && /[가-힣a-z]/i.test(w));
  function wcoach() {
    const A = wcards(), by = (k) => A.filter(([, f]) => f.k === k), tips = [];
    let sum = 0;
    for (const C of WC) { const n = by(C.k).length; sum += Math.min(1, n / C.goal); tips.push({ ok: n >= C.goal, t: C.e + ' ' + C.n + ' ' + n + '/' + C.goal, b: n < C.goal ? 'wcat:' + C.k : null }); }
    const pct = Math.round(sum / WC.length * 100);
    if (A.length) {
      const nm = by('wname'); if (nm.length && nm.every(([, f]) => String(f.tx).replace(/\s/g, '').length < 10)) tips.push({ ok: false, t: '🌍 이름만 있어요 — 어떤 곳인지 한 줄 소개·분위기(색·날씨·소리)도 써요', b: 'wcat:wname' });
      const tiny = A.filter(([, f]) => f.k !== 'wname' && String(f.tx).replace(/\s/g, '').length < 6 && !f.why); if (tiny.length) tips.push({ ok: false, t: '✏️ 짧은 카드 ' + tiny.length + '개(' + tiny.slice(0, 2).map(([, f]) => '「' + short(f.tx, 6) + '」').join(' ') + ') — 어떤 모습이고 무엇을 하는지 더 써요' });
      const why = A.filter(([, f]) => f.why).length; tips.push({ ok: why * 3 >= A.length, t: '💡 까닭을 쓴 카드 ' + why + '/' + A.length + (why * 3 >= A.length ? '' : ' — 왜·어떻게를 더 써 봐요') });
      const pool = new Set(); for (const k of ['wplace', 'wthing', 'wpeop', 'wname']) for (const [, f] of by(k)) for (const w of words(f.tx)) pool.add(w);
      const D = by('wdo'), linked = D.filter(([, f]) => words(f.tx + ' ' + (f.why || '')).some((w) => pool.has(w))).length;
      if (D.length) tips.push({ ok: linked * 2 >= D.length, t: '🧩 할 일 ' + D.length + '개 중 ' + linked + '개가 우리 세계의 장소·주민·신기한 것과 이어져요' + (linked * 2 >= D.length ? '' : ' — 할 일에 그 이름을 넣어 봐요') });
      const R9 = by('wrule'); if (R9.length && D.length) { const rw = new Set(); for (const [, f] of R9) for (const w of words(f.tx)) rw.add(w); const used = D.some(([, f]) => words(f.tx + ' ' + (f.why || '')).some((w) => rw.has(w))); tips.push({ ok: used, t: used ? '📜 규칙이 할 일에 쓰여요' : '📜 규칙을 할 일(도전)에 써 봐요 — 예) 노래로 떠올라 하늘 섬 가기' }); }
      const P9 = by('wplace'), pin = P9.filter(([, f]) => placed(f)).length; if (P9.length) tips.push({ ok: pin === P9.length, t: '🚩 학교에 꽂은 장소 ' + pin + '/' + P9.length + (pin < P9.length ? ' — 눌러서 꽂으러 가요' : ''), b: pin < P9.length ? 'wflag' : null });
      const top = A.filter(([, f]) => likes(f)).sort((a, b) => likes(b[1]) - likes(a[1])).slice(0, 2); if (top.length) tips.push({ ok: true, t: '❤️ 인기: ' + top.map(([, f]) => (WBY[f.k] || WC[0]).e + short(f.tx, 10) + '(' + likes(f) + ')').join(' · ') });
    }
    if (pct >= 100 && tips.every((t) => t.ok)) tips.push({ ok: true, t: '🎉 세계가 다 모였어요 — 선생님이 📤 정리를 Claude에게 넘기면 진짜 세계가 돼요!' });
    return { pct, tips };
  }
  function wsummary() {
    const A = wcards(), W = wcoach(), at = (f) => placed(f) ? '📍 우리 학교 ' + f.zone + (f.near ? ' · ' + f.near + ' 근처' : '') + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' : '';
    const out = ['# 🌍 세계 만들기 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 카드 ' + A.length + '개 · 구현 준비 ' + W.pct + '% · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 칸마다 ❤️ 많은 순 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    for (const C of WC) {
      const L = A.filter(([, f]) => f.k === C.k).sort((a, b) => likes(b[1]) - likes(a[1]) || (a[1].t || 0) - (b[1].t || 0));
      out.push('## ' + C.e + ' ' + C.n + (L.length ? '' : '  (아직 없음)'));
      for (const [, f] of L) {
        out.push('- ' + (likes(f) ? '(❤️' + likes(f) + ') ' : '') + String(f.tx).replace(/\n/g, ' ') + '  · ✍️ ' + f.by);
        if (f.why) out.push('  💡 ' + String(f.why).replace(/\n/g, ' '));
        if (placed(f)) out.push('  ' + at(f));
        if (f.re) for (const r of Object.values(f.re).filter((r) => r && r.tx).sort((a, b) => (a.t || 0) - (b.t || 0))) out.push('  💬 ' + r.by + ': ' + r.tx);
      }
      out.push('');
    }
    out.push('## 🧭 코치가 본 것', ...W.tips.map((c) => '- ' + (c.ok ? '✓ ' : '! ') + c.t), '',
      '## Claude에게 — 구현 부탁(선생님이 고쳐 써도 돼요)',
      '- 이 세계를 imagine/<영문 이름>/ 에 「마법사 마을」처럼 새 페이지로 만들어 주세요(조작은 메타버스와 같게 · v3 「상상의 세계」 카드로).',
      '- 🌍 = 첫 화면·하늘·색·소리 · 📜 규칙 = 놀이 규칙(되는 일·안 되는 일·어기면) · 👫 = 마을 사람·생물(말 걸기) · 🏰 = 지역(📍가 있으면 우리 학교의 그 자리를 바탕으로) · ✨ = 상호작용·마법·물건 · 🎮 = 퀘스트·도전(처음 할 일 → 해결 → 보상).',
      '- ❤️ 많은 생각부터 · 서로 부딪히면 ❤️ 많은 쪽 · 💬 댓글의 의견도 살피기 · 빈 칸은 Claude가 채우되 「Claude가 채운 것」 목록을 따로 알려 주기.');
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
      + '<div class="mlbl">🧹 판 비우기</div><div class="sm">' + (isW() ? '카드·깃발 ' : '장면·덧붙인 것·깃발 ') + n + '개를 모두 지워요. 지운 것은 한 번 보관돼서 아래 ↩️로 되돌릴 수 있어요.<br>정말 비우려면 판 번호 <b>' + esc(no) + '</b>을(를) 적어요.</div>'
      + '<div style="display:flex;gap:6px;margin-top:6px"><input id="mmNo2" maxlength="12" placeholder="판 번호" style="width:120px"><button class="warn" id="mmClr">🧹 비우기</button></div>'
      + '<div class="mlbl">↩️ 되돌리기</div><div class="sm">' + (bak && bak.flags ? new Date(bak.t || 0).toLocaleString('ko-KR') + '에 비운 ' + Object.keys(bak.flags).length + '개가 보관돼 있어요.' : '보관된 것이 없어요.') + '</div>'
      + (bak && bak.flags ? '<div class="row" style="justify-content:flex-start"><button class="sub" id="mmUndo">↩️ 보관한 것 되돌리기(지금 판에 더해요)</button></div>' : '')
      + '<div class="row"><button class="sub" id="mmBk">◀ ' + (isW() ? '세계 판' : '이야기 판') + '</button></div>';
    P.querySelector('#mmBk').onclick = boardView; P.querySelector('#mmSum2').onclick = summary;
    P.querySelector('#mmClr').onclick = async () => {
      if (P.querySelector('#mmNo2').value.trim() !== no) return toast('판 번호가 달라요 — 비우지 않았어요', 2.5);
      try { await req('/trash/' + board.id, 'PUT', { t: { '.sv': 'timestamp' }, flags: DATA }); const ids = Object.keys(DATA); await Promise.all(ids.map((k) => req(fpath(k), 'DELETE'))); toast('🧹 비웠어요 — 🗂 관리에서 되돌릴 수 있어요', 3); } catch (e) { toast('비우지 못했어요', 2); }
      admin();
    };
    const u = P.querySelector('#mmUndo');
    if (u) u.onclick = async () => { try { await req('/boards/' + board.id + '/flags', 'PATCH', bak.flags); toast('↩️ 되돌렸어요', 2); } catch (e) { toast('되돌리지 못했어요', 2); } boardView(); };
  }

  // ───────── 🧭 이야기 코치 — 길(장면 → 다음 장면 · 고르기 → N번)을 따라가 보고 짚어 줌 ─────────
  function graph() {
    const L = scenes(), n = L.length, E = L.map(() => []), bad = [], loose = [];
    L.forEach(([id, f], i) => {
      let branched = false;
      for (const [, x] of kids(id)) if (x.k === 'choice') { for (const o of choiceOpts(x)) { if (o.n == null) loose.push((i + 1) + '번 「' + short(o.label, 8) + '」'); else if (o.n < 1 || o.n > n) bad.push(o.n); else { E[i].push(o.n - 1); branched = true; } } }
      if (!branched && !f.end && i + 1 < n) E[i].push(i + 1);
    });
    const seen = new Set([0]), st = [0]; while (st.length) { const v = st.pop(); for (const w of E[v]) if (!seen.has(w)) { seen.add(w); st.push(w); } }
    return { L, E, bad, loose, seen };
  }
  function coach() {
    const { L, E, bad, loose, seen } = graph(), out = [], ends = L.filter(([, f]) => f.end).length, branch = E.some((e) => e.length > 1);
    out.push({ ok: true, t: '장면 ' + L.length + '개' + (branch ? ' · 갈림길 있음' : '') });
    const lastTx = L.length ? String(L[L.length - 1][1].tx) : '', endish = /(마침내|그 뒤로|끝|행복하게|돌아왔|찾았|해결|친구가 되었|살았답니다|되었어요)/.test(lastTx);
    if (!ends) out.push(branch ? { ok: false, t: '갈림길마다 🏁 결말 장면을 정해요' } : endish ? { ok: true, t: '마지막 장면이 끝이에요(🏁로 표시해도 좋아요)' } : { ok: false, t: '마지막 ' + L.length + '번 장면이 이야기의 끝인가요? — 끝이면 ✏️에서 🏁, 아니면 「마침내…」 장면을 더 써요' });
    else out.push({ ok: true, t: '🏁 결말 ' + ends + '개' });
    if (bad.length) out.push({ ok: false, t: [...new Set(bad)].map((x) => x + '번').join('·') + ' 장면은 아직 없어요' });
    if (loose.length) out.push({ ok: false, t: loose.slice(0, 3).join(', ') + ' — 고르면 몇 번 장면으로 가요?' });
    const lost = L.map((_, i) => i).filter((i) => !seen.has(i)); if (lost.length) out.push({ ok: false, t: lost.map((i) => (i + 1) + '번').join('·') + ' 장면은 아무 데서도 안 와요' });
    const dead = L.map((_, i) => i).filter((i) => seen.has(i) && !E[i].length && !L[i][1].end && i < L.length - 1); if (dead.length) out.push({ ok: false, t: dead.map((i) => (i + 1) + '번').join('·') + ' 장면 뒤에 길이 끊겨요' });
    const noFlag = L.filter(([id]) => !firstPlace(id)); if (noFlag.length) out.push({ ok: false, t: '🚩 깃발 없는 장면 ' + noFlag.map(([id]) => L.findIndex(([x]) => x === id) + 1).join('·') + '번 — 눌러서 꽂으러 가요', b: 'noflag' });
    const has = (re) => L.some(([, f]) => re.test(String(f.tx))), steps = [['처음', L.length > 0], ['문제가 생겨요', has(/^(그러던 어느 날|그런데)|사라졌|없어졌|잃어버|문제|고장|갇혔|싸웠/)], ['해결', has(/^(그래서|마침내)|찾았|고쳤|도와|해결|구했/)], ['끝', ends > 0 || endish]];
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
  function choiceOpts(x) { return String(x.opt || '').split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 6).map((t) => { const m = t.match(/(\d{1,2})\s*번/); return { label: t.replace(/\s*(→|->|=>)\s*\d{1,2}\s*번(\s*장면)?\s*$/, '').trim() || t, n: m ? +m[1] : null }; }); }
  function playStop(msg) { if (!play) return; const P0 = play; play = null; if (P0.mk) P0.mk.remove(); map.hud.goal(null); chips(); syncNow(); if (msg) toast(msg, 2.5); }
  function walkTo(f, n, tx) {   // 장면 자리까지 걸어가기(빛기둥 · 미니맵 별 · ⏩ 바로 가기 칩) — 2.6m 안에 들어오면 끝
    return new Promise((res) => {
      if (!play) return res(false);
      play.mk = map.mk.marker(f.x, (f.y || 0) + 0.2, f.z, { color: colOf(n), beam: true });
      map.minimap.setMarks([{ x: f.x, z: f.z, color: hex(colOf(n)), shape: 'star', label: n + '번 장면', blink: true, floor: (f.y || 0) > 2.5 ? 2 : 1 }]);
      map.hud.goal('🚩 ' + n + '번 장면 자리로 가요 — 📍 ' + (f.near || f.zone || ''));
      const done = (ok) => { clearInterval(play && play.iv); if (play) { play.iv = 0; play.go = null; if (play.mk) { play.mk.remove(); play.mk = null; } } map.hud.goal(null); res(ok); };
      play.go = () => { goTo(f); };   // ⏩ 바로 가기
      play.iv = setInterval(() => { if (!play || dead) return done(false); const me = map.player.pos(); if (Math.hypot(me.x - f.x, me.z - f.z) < 2.6 && Math.abs(me.y - (f.y || 0)) < 2) done(true); }, 200);
      chips();
    });
  }
  async function playStory(o = {}) {
    const L = scenes(); if (!L.length) return toast('먼저 장면을 만들어요', 2);
    close(); endTour(); hereOff(); placing = null;
    play = { i: 0, items: [], steps: 0, mk: null, iv: 0, go: null, book: !!o.book }; chips();
    for (const F of FL.values()) F.g.visible = false;   // 해 보는 동안 깃발 숨김(목표 빛기둥만)
    map.hud.toast(play.book ? '📖 「' + board.t + '」 — 책처럼 읽어요' : '🎮 「' + board.t + '」 이야기 시작! 빛기둥을 따라가요', 3);
    while (play && play.i >= 0 && play.i < L.length && play.steps++ < 60) {
      const [id, f] = L[play.i], n = play.i + 1, pl = firstPlace(id);
      if (pl && !play.book) { const ok = await walkTo(pl, n, f.tx); if (!ok || !play) return; }
      let next = f.end ? -1 : play.i + 1;   // 🏁 결말이면 여기서 끝
      if (!play) return;
      let r = await map.hud.ask('🎬 ' + n + '번 장면\n\n' + f.tx, ['다음 ▶']); if (r < 0 || !play) return playStop();
      for (const [, x] of kids(id)) {
        if (!play) return;
        if (x.k === 'say') r = await map.hud.ask('💬 ' + (x.who || '누군가') + '\n“' + x.tx + '”', ['▶']);
        else if (x.k === 'who') r = await map.hud.ask('🧑 ' + (x.who || '등장인물') + (x.tx ? '\n' + x.tx : ''), ['▶']);
        else if (x.k === 'item') { r = await map.hud.ask('📦 ' + x.tx, ['✋ 줍기!']); if (r >= 0) { play.items.push(short(x.tx, 12)); map.sfx('ding'); } }
        else if (x.k === 'choice') {
          const O = choiceOpts(x); if (!O.length) continue;
          r = await map.hud.ask('❓ ' + x.tx, O.map((o) => o.label + (o.n ? '  → ' + o.n + '번' : '')));
          if (r >= 0 && O[r] && O[r].n) next = O[r].n - 1;
        }
        if (r < 0 || !play) return playStop();
      }
      play.i = next;
    }
    if (!play) return;
    const items = play.items.slice(); playStop();
    const k = await map.hud.ask('🏁 「' + board.t + '」 이야기 끝!' + (items.length ? '\n\n주운 물건: ' + items.join(' · ') : '') + '\n\n우리 반이 쓴 이야기를 해 봤어요. 고칠 곳이 있으면 📖 이야기 판에서 고쳐요!', ['📖 이야기 판으로', '🔁 다시 해 보기', '닫기']);
    if (k === 0) boardView(); else if (k === 1) playStory(o);
  }

  // ───────── ▶ 장면 따라 걷기 ─────────
  let tourI = -1, tourEl = null, lead = false;   // lead = 선생님 발표 — 장면마다 방 친구들을 데려감(SM_MP.gather)
  function goTo(f) {
    let dx = 1.2, dz = 1.2;
    if (f.cam && f.cam.length === 3) { dx = f.cam[0] - f.x; dz = f.cam[2] - f.z; const d = Math.hypot(dx, dz) || 1; dx = dx / d * 2.4; dz = dz / d * 2.4; }
    const e = map.findEntry(f.x + dx, f.z + dz, f.y || 0, null, 3) || map.findEntry(f.x + 1.2, f.z + 1.2, f.y || 0, null, 3);
    map.player.teleport(e ? [e.x, e.y, e.z] : [f.x, f.y || 0, f.z]); map.player.lookAt([f.x, f.z]);
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
  function summaryText() {
    if (isW()) return wsummary();
    const L = scenes(), S = secs(), out = ['# 메타버스 메모장 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 장면 ' + L.length + '개 · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 번호 = 장면 순서 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    const at = (f) => placed(f) ? '📍 ' + f.zone + (f.near ? ' · ' + f.near + ' 근처' : '') + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' : '';
    let cur = -1;
    L.forEach(([id, f], i) => {
      const s = secOf(f, S); if (S.length && s !== cur) { cur = s; out.push('## ' + (s + 1) + '. ' + S[s]); }
      const lk = f.lk ? Object.keys(f.lk).length : 0;
      out.push('### 장면 ' + (i + 1) + (f.end ? ' 🏁(결말)' : '') + ' — ' + String(f.tx).replace(/\n/g, ' ') + '  (✍️ ' + f.by + (lk ? ' · ❤️ ' + lk : '') + ')');
      if (placed(f)) out.push('   ' + at(f));
      for (const [, x] of kids(id)) {
        const A = KBY[x.k] || PLACE;
        if (x.k === 'place') { out.push('   📍 일어나는 곳' + (x.tx ? ' — ' + x.tx : '') + ': ' + (placed(x) ? at(x).slice(3) : '(자리 없음)') + ' · ✍️ ' + x.by); continue; }
        out.push('   ' + A.e + ' ' + A.n + (x.who ? ' [' + x.who + ']' : '') + ': ' + (x.k === 'say' ? '“' + x.tx + '”' : x.tx || '') + (placed(x) ? '  ' + at(x) : '') + ' · ✍️ ' + x.by);
        if (x.opt) out.push('      보기: ' + String(x.opt).replace(/\n/g, ' / '));
      }
      if (f.re) for (const r of Object.values(f.re).filter((r) => r && r.tx).sort((a, b) => (a.t || 0) - (b.t || 0))) out.push('   💬 ' + r.by + ': ' + r.tx);
    });
    const O = orphans(); if (O.length) { out.push('', '## 장면에 안 붙인 것'); for (const [, x] of O) out.push('- ' + (KBY[x.k] || PLACE).e + ' ' + (x.who ? '[' + x.who + '] ' : '') + (x.tx || '') + (placed(x) ? '  ' + at(x) : '')); }
    return out.filter((x, i) => x !== '' || i > 3).join('\n');
  }
  function summary() {
    const P = open('memo-sum'), txt = summaryText();
    P.innerHTML = '<h3>📤 정리 — Claude에게 넘길 글</h3><div class="sm">선생님: 아래 글을 복사해 Claude에게 붙여 넣거나, 판 이름만 알려 줘도 돼요(Claude가 바로 읽어요).</div><pre></pre><div class="row"><button class="sub" id="mmB">◀ ' + (isW() ? '세계 판' : '이야기 판') + '</button><button id="mmCp">📋 복사하기</button></div>';
    P.querySelector('pre').textContent = txt;
    P.querySelector('#mmB').onclick = boardView;
    P.querySelector('#mmCp').onclick = async () => { try { await navigator.clipboard.writeText(txt); toast('📋 복사했어요', 2); } catch (e) { toast('복사가 막혔어요 — 글을 직접 골라 복사해 주세요', 3); } };
  }

  // ───────── 입력 · 칩 ─────────
  const cross = el('div', ''); cross.id = 'memo-x';
  function chips() {
    if (isW()) {
      map.hud.chip('memo-p', null);
      map.hud.chip('memo-f', placing ? '🚩 「' + short((DATA[placing] || {}).tx, 8) + '」 깃발 — 땅을 톡 · F · Esc 취소' : '🏰 장소 깃발 (땅을 톡 · F)', { onClick: () => { if (panel) return; if (placing) placeAt(aimPoint()); else form({ pt: aimPoint() }); } });
      map.hud.chip('memo-l', '🌍 세계 판 (L)', { onClick: () => { if (!panel) boardView(); } });
      map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) pickBoard(); } });
      for (const F of FL.values()) F.g.visible = true; map.minimap.show(); return;
    }
    if (play) { map.hud.chip('memo-p', null); map.hud.chip('memo-f', '⏩ 장면 자리로 바로 가기', { onClick: () => { if (play && play.go) play.go(); } }); map.hud.chip('memo-l', '⏹ 이야기 그만', { onClick: () => playStop('⏹ 이야기를 그만했어요') }); map.hud.chip('memo-s', null); return; }
    map.hud.chip('memo-f', placing ? '🚩 ' + (numMap().get(placing) || '') + '번 장면 깃발 — 땅을 톡 · F · Esc 취소' : '🚩 깃발 (땅을 톡 · F)', { onClick: () => { if (panel) return; if (placing) placeAt(aimPoint()); else form({ pt: aimPoint() }); } });
    map.hud.chip('memo-l', '📖 이야기 판 (L)', { onClick: () => { if (!panel) boardView(); } });
    map.hud.chip('memo-p', pathOn ? '🛤 이야기 길 끄기' : '🛤 이야기 길 보기', { onClick: () => { if (!panel) pathToggle(); } });
    map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) { endTour(); pickBoard(); } } });
    for (const F of FL.values()) F.g.visible = true;
    map.minimap.show();
  }
  const onKey = (e) => {
    if (!board || panel || e.repeat || play) return;
    if (e.code === 'KeyF') { e.preventDefault(); hereOff(); if (placing) placeAt(aimPoint()); else form({ pt: aimPoint() }); }
    else if (e.code === 'KeyL') { e.preventDefault(); hereOff(); boardView(); }
    else if (tourEl && e.code === 'KeyN') { e.preventDefault(); step(1); }
    else if (tourEl && e.code === 'KeyB') { e.preventDefault(); step(-1); }
    else if (hereEl && /^(Key[WASD]|Arrow)/.test(e.code)) hereOff();
  };
  addEventListener('keydown', onKey);
  pickBoard();

  return {
    tick() {},
    stop() { dead = true; window.SM_ACT = null; clearTimeout(pathT); pathClear(); if (play) { clearInterval(play.iv); if (play.mk) play.mk.remove(); play = null; } clearTimeout(syncT); if (es) es.close(); if (esB) esB.close(); hereOff(); removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); removeEventListener('sm-click', onWorldClick); removeEventListener('sm-cmd', onCmd); for (const id of [...FL.keys()]) drop3d(id); ui.remove(); css.remove(); },
    get board() { return board; }, get scenes() { return scenes().map(([id, f], i) => ({ id, n: i + 1, ...f, kids: kids(id).map(([kid, x]) => ({ id: kid, ...x })) })); }, summary: () => board ? summaryText() : '',
    get coach() { return board ? (isW() ? wcoach() : coach()) : []; }, get cards() { return wcards().map(([id, f]) => ({ id, ...f })); }, get kind() { return KIND; }, paths: () => { if (!pathOn) pathToggle(); return new Promise((r) => setTimeout(() => r(pathObjs.length), 6000)); }, book: () => playStory({ book: true }),
    place: (o) => form({ pt: aimPoint(), ...(o || {}) }), view: boardView, tour: startTour, play: () => playStory(), get playing() { return play ? { i: play.i, items: play.items.slice() } : null; }, moveTo: (id, sec, before) => moveTo(id, sec, before),
    enter: (id, info) => { name = name || '시험'; board = { id, ...info }; listen(); chips(); },
  };
}
