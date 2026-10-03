// 메타버스 메모장(MEMO-1 · 10-03 교사 '운동장 어디에 깃발을 꽂고 여기에 뭐가 필요해요 — 저장하면 내가 보고 Claude에게 만들라고') — RPG 생각판의 메타버스판.
//   판 1~10번(선생님이 정해 둔 판에 들어감) · Firebase class-rpg metaverse/boards/<판>/flags · 같은 판 친구 것이 바로 보임
//   MEMO-3(10-03 교사 '종류가 많으면 헷갈림 — 사건(장면)을 먼저 적고 거기에 인물·장소·대사·물건을 붙이는 방식 · 깃발은 몇 번 장면과 연결됐는지 보이게'):
//     📖 이야기 판(L) = 장면 카드(1, 2, 3… · 끌어서 순서 · 선생님이 칸 '처음, 가운데, 끝') — 장면마다 '무슨 일이 일어나요?' + 덧붙이기(🧑 인물 · 💬 대사 · 📦 물건 · ❓ 고르기)
//     🚩 깃발 = '몇 번 장면'을 고르고 꽂음(장면이 일어나는 곳 · 인물·물건·대사가 있는 곳) — 깃발 색·번호 = 장면 · ▶ 장면 따라 걷기(N/B) · ❤️ · 💬 댓글 · 📤 정리
//   FREE-MOUSE(교사 '화면이 늘 게임에 잠겨 옆 단추를 누르기 힘들다'): 메모장에선 마우스가 늘 보임 · 끌어서 둘러보기 · 땅을 톡 누르면 '🚩 여기에 꽂기'
//   선생님(🔒 4자리 · 함께하기와 같은 비밀번호): 판 제목·질문·칸 · 잠금 · 🗂 관리(비우기 = 판 번호를 적어야 · 비운 것은 trash에 보관 → ↩️ 되돌리기)
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
const OLD = { memo: '📝', event: '⚡', mark: '🏁' };   // MEMO-1·2 때 만든 카드(장면으로 보임)
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
  try { name = localStorage.getItem('mp.name') || ''; teacher = sessionStorage.getItem('sm.t') === '1'; } catch (e) { /* */ }   // sm.t = 이 탭에서 선생님 비밀번호를 맞힘(함께하기 방 만들기와 같이)
  const css = document.createElement('style'); css.textContent = STYLE; document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'memo-ui'; document.body.appendChild(ui);
  const el = (tag, cls, html, parent = ui) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
  const keyStop = (n) => { for (const t of ['keydown', 'keyup']) n.addEventListener(t, (e) => e.stopPropagation()); };
  const toast = (s, t = 2.5) => map.hud.toast(s, t);
  const short = (s, n = 11) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
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
    P.innerHTML = '<h3>📝 메타버스 메모장' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">우리 이야기를 <b>장면</b>으로 나눠 적고, 학교 곳곳에 그 장면의 🚩 깃발을 꽂아요. 같은 판에 들어온 친구들 것도 바로 보여요.</div>'
      + '<div class="where">내 이름 <input id="mmName" maxlength="8" style="width:150px;margin-left:6px" placeholder="이름"></div><div class="sm">선생님이 알려 준 판에 들어가요.</div><div class="bd">불러오는 중…</div>'
      + '<div class="row">' + (teacher ? '' : '<button class="sub" id="mmT">🔒 선생님</button>') + '<button class="sub" id="mmQuit">그만하기</button></div>';
    const nm = P.querySelector('#mmName'); nm.value = name;
    P.querySelector('#mmQuit').onclick = () => map.quit && map.quit();
    if (!teacher) P.querySelector('#mmT').onclick = teacherLogin;
    let list = {};
    try { list = (await req('/boardList')) || {}; } catch (e) { P.querySelector('.bd').textContent = '판 목록을 불러오지 못했어요 — 인터넷을 확인해 주세요'; return; }
    if (dead || panel !== P) return;
    const ids = Object.keys(list).sort((a, b) => (list[a].n || 99) - (list[b].n || 99) || (list[a].c || 0) - (list[b].c || 0)), bd = P.querySelector('.bd'); bd.innerHTML = '';
    if (!ids.length) bd.innerHTML = '<div class="sm">아직 판이 없어요.</div>';
    for (const id of ids) {
      const L = list[id], row = el('div', '', null, bd); row.style.cssText = 'display:flex;gap:6px;align-items:stretch';
      const b = el('button', '', (L.lock ? '🔒 ' : '📌 ') + esc(L.t) + (L.p ? '<small>' + esc(L.p) + '</small>' : ''), row); b.style.flex = '1'; b.onclick = () => enter(id, L);
      if (teacher) {
        const ed = el('button', 'sub', '✏️', row); ed.title = '제목·질문·칸 바꾸기'; ed.onclick = async () => {
          const t = prompt('판 제목', L.t); if (t == null) return; const q = prompt('판 질문(아이들에게 보여요)', L.p || ''); if (q == null) return; const s = secPrompt(L.sec); if (s == null) return;
          try { await req('/boardList/' + id, 'PATCH', { t: (t.trim() || L.t).slice(0, 40), p: q.trim().slice(0, 120), sec: s || null }); } catch (e) { return toast('바꾸지 못했어요', 2); } pickBoard(); };
        const lk = el('button', 'sub', L.lock ? '🔓' : '🔒', row); lk.title = L.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)'; lk.onclick = async () => { try { await req('/boardList/' + id + '/lock', 'PUT', !L.lock); } catch (e) { return; } pickBoard(); };
      }
    }
    if (teacher) el('div', 'sm', '판을 비우거나 되돌리기는 판에 들어가서 📖 이야기 판 → 🗂 관리에서 해요(실수로 지우지 않게).', P.querySelector('.bd')).style.marginTop = '4px';
    if (params.board && list[params.board]) enter(params.board, list[params.board]);
  }
  function enter(id, info) {
    const P = panel; const nm = P && P.querySelector('#mmName'); const v = nm ? nm.value.trim().replace(/[<>]/g, '').slice(0, 8) : '';
    if (!v) { toast('먼저 내 이름을 적어 주세요', 2.2); if (nm) nm.focus(); return; }
    name = v; try { localStorage.setItem('mp.name', name); } catch (e) { /* */ }
    dispatchEvent(new CustomEvent('sm-name', { detail: name }));   // 동시 접속 이름표도 같은 이름으로(main.js)
    board = { id, ...info }; close(); endTour(); placing = null; listen(); chips();
    toast('📌 「' + board.t + '」 — 마우스로 끌면 둘러보기 · 땅을 톡 누르면 🚩 깃발 · L = 이야기 판', 5);
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
  async function moveTo(id, sec, before) {   // 장면 순서: before 앞(없으면 칸 끝)
    if (!canWrite()) return lockMsg();
    const S = secs(), L = scenes().filter(([i, f]) => i !== id && secOf(f, S) === sec), k = before ? L.findIndex(([i]) => i === before) : L.length, at = k < 0 ? L.length : k;
    const p = at > 0 ? L[at - 1][1].ord || 0 : null, n = at < L.length ? L[at][1].ord || 0 : null;
    const ord = p == null && n == null ? Date.now() : p == null ? n - 1000 : n == null ? p + 1000 : (p + n) / 2;
    const patch = { ord }; if (S.length) patch.sec = sec;
    if (DATA[id]) Object.assign(DATA[id], patch); syncNow();
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
  function label3d(f) { if (isScene(f)) return '🎬 ' + short(f.tx, 10); if (f.k === 'place') return '📍 ' + (short(f.tx, 10) || short(f.near || f.zone, 10)); return (KBY[f.k] || PLACE).e + ' ' + short(f.who || f.tx, 10); }
  const sigOf = (f, num) => [num, f.k, f.tx, f.who, f.x, f.y, f.z].join('|');
  function draw3d(id, f, num) {
    drop3d(id);
    const col = num ? colOf(num) : 0xadb5bd, g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); g.add(new THREE.Mesh(clothG, lam(col)));
    const tg = tag(num || '?', label3d(f), col); tg.position.y = 2.55; g.add(tg);
    map.add(g);
    FL.set(id, { g, tag: tg, sig: sigOf(f, num), hot: map.interact.add({ x: f.x, y: f.y || 0, z: f.z, r: 1.6, label: (num ? num + '번 장면' : '깃발') + ' 보기', use: () => view(isScene(f) ? id : f.p) }) });
  }
  let syncT = 0;
  function sync() { if (!syncT) syncT = setTimeout(syncNow, 40); }
  function syncNow() {
    clearTimeout(syncT); syncT = 0; if (dead) return;
    const N = numMap(), live = new Set(), marks = [];
    for (const [id, f] of Object.entries(DATA)) {
      if (!valid(f) || !placed(f)) continue; live.add(id);
      const num = N.get(isScene(f) ? id : f.p) || 0;
      if (!FL.get(id) || FL.get(id).sig !== sigOf(f, num)) draw3d(id, f, num);
      marks.push({ x: f.x, z: f.z, color: hex(num ? colOf(num) : 0xadb5bd), label: String(num || '?'), floor: (f.y || 0) > 2.5 ? 2 : 1 });
    }
    for (const id of [...FL.keys()]) if (!live.has(id)) drop3d(id);
    if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '📌 ') + short(board.t, 14) + ' · 장면 ' + N.size + '개');
    map.minimap.setMarks(marks);
    if (panel && (panel.id === 'memo-board' || panel.id === 'memo-view')) rerender();
    if (tourEl) showTour(false);
  }

  // ───────── 장면 카드(이야기 판·장면 보기·걸어 보기 공용) ─────────
  const openRe = new Set();
  function placeLine(f) { return '📍 ' + esc(f.zone) + (f.near ? ' · ' + esc(f.near) + ' 근처' : ''); }
  function cardHTML(id, f, num, o = {}) {
    const lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name)), can = canWrite(), own = (x) => teacher || x.by === name;
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [];
    const K = kids(id), places = [f, ...K.map(([, x]) => x)].filter(placed).length, showRe = o.re || openRe.has(id);
    let h = '<div class="cd" data-id="' + esc(id) + '" style="--k:' + hex(colOf(num)) + '"><div class="hd" title="끌어서 순서 바꾸기"><span class="num" style="background:' + hex(colOf(num)) + '">' + num + '</span>' + (OLD[f.k] ? OLD[f.k] + ' ' : '') + '장면<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + '<div class="tx">' + esc(f.tx) + '</div>'
      + (() => { const pk = placed(f) ? f : (K.find(([, x]) => x.k === 'place' && placed(x)) || [])[1];
        return pk ? '<div class="pl">' + placeLine(pk) + (places > 1 ? ' · 🚩 ' + places + '개' : '') + '</div>' : '<div class="pl' + (places ? '' : ' none') + '">' + (places ? '🚩 깃발 ' + places + '개' : '📍 아직 깃발이 없어요 — ＋ 🚩 깃발') + '</div>'; })();
    for (const [kid, x] of K) {
      const A = KBY[x.k] || PLACE;
      const where = placed(x) ? ' <span class="sm">📍 ' + esc(x.near || x.zone) + '</span>' : '';
      h += '<div class="it" data-kid="' + esc(kid) + '"><span>' + A.e + '</span><span class="t">' + (x.k === 'place' ? '<b>일어나는 곳</b> ' + esc(x.tx) + where
          : (x.who ? '<b>' + esc(x.who) + '</b> ' : '') + (x.k === 'say' ? '“' + esc(x.tx) + '”' : esc(x.tx)) + (x.opt ? '<br><span class="sm">' + esc(x.opt).replace(/\n/g, '<br>') + '</span>' : '') + where)
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
      else if (a === 'flag') { if (!canWrite()) return lockMsg(); close(); endTour(); placing = id; chips(); toast('🚩 ' + (numMap().get(id) || '') + '번 장면 — 꽂을 땅을 톡 누르거나, 화면 가운데로 보고 F · 취소 Esc', 5); }
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
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const S = secs(), L = scenes(), N = new Map(L.map(([id], i) => [id, i + 1])), can = canWrite(), O = orphans();
    let h = '<div class="top"><h3>📖 ' + esc(board.t) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + (teacher ? '<button class="sub" data-b="sec" title="이야기 칸 정하기">⚙️ 칸</button><button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button><button class="sub" data-b="admin" title="판 비우기·되돌리기">🗂 관리</button>' : '<button class="sub" data-b="t" title="선생님">🔒</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="bar">' + (can ? '<button data-b="new">＋ 새 장면</button>' : '') + '<button class="sub" data-b="tour">▶ 장면 따라 걷기</button><button class="sub" data-b="sum">📤 정리</button>'
      + '<span class="sm" style="margin-left:6px">' + (can ? '장면 번호 줄을 끌면 순서가 바뀌어요' : '선생님이 잠근 판 — 보기만') + '</span></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    if (!L.length) body.innerHTML = '<div class="sm" style="padding:24px;text-align:center;font-size:15px;line-height:1.8">아직 장면이 없어요.<br><b>＋ 새 장면</b>으로 「무슨 일이 일어나는지」부터 적어 봐요.<br>그다음 장면마다 🧑 인물 · 💬 대사 · 📦 물건을 덧붙이고, 학교에 🚩 깃발을 꽂아요.</div>';
    else if (S.length) body.innerHTML = '<div class="lanes">' + S.map((s, si) => '<div class="lane" data-sec="' + si + '"><h4>' + (si + 1) + '. ' + esc(s) + '</h4>' + L.filter(([, f]) => secOf(f, S) === si).map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>').join('') + '</div>';
    else body.innerHTML = '<div class="strip" data-sec="0">' + L.map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>';
    if (O.length) el('div', 'sm', '📌 장면에 아직 안 붙인 것 ' + O.length + '개 — ' + O.map(([, x]) => (KBY[x.k] || PLACE).e + ' ' + esc(short(x.who || x.tx || x.zone, 14))).join(' · '), body).style.marginTop = '12px';
    body.scrollTop = sc[0]; body.scrollLeft = sc[1];
    P.onclick = async (e) => {
      const b = e.target.closest('[data-b]'); if (!b || b.closest('.cd')) return;
      const a = b.dataset.b;
      if (a === 'close') close();
      else if (a === 'new') { if (!canWrite()) return lockMsg(); back = 'board'; form({ kind: 'scene' }); }
      else if (a === 'tour') startTour(0);
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
      const hd = e.target.closest('.cd .hd'), cd = hd && hd.closest('.cd'); if (!cd || e.button > 0 || !P.querySelector('.body').contains(cd)) return;
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
    if (!board || panel || dead) return;
    const d = e.detail, pt = aimPoint(d.x, d.y); hereOff(); if (!pt) return;
    if (placing) { placeAt(pt); return; }
    herePt = pt; hereMk = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b });
    hereEl = el('button', '', '🚩 여기에 꽂기'); hereEl.id = 'memo-here'; hereEl.style.left = d.x + 'px'; hereEl.style.top = d.y + 'px';
    hereEl.onclick = (ev) => { ev.stopPropagation(); const p = herePt; hereOff(); form({ pt: p }); };
  }
  addEventListener('sm-click', onWorldClick);
  let placing = null;
  async function placeAt(pt) {   // 장면 카드의 '＋ 🚩 깃발' → 그 장면의 장소 깃발
    const sid = placing; placing = null; chips(); if (!DATA[sid]) return;
    form({ pt, scene: sid, kind: 'place' });
  }

  // ───────── 쓰기 창(장면 · 덧붙이기 · 깃발) ─────────
  //   o.id = 고치기 · o.pt = 이 자리에 깃발 · o.scene = 어느 장면에 · o.kind = 처음 고른 종류
  let lastScene = null;
  function form(o = {}) {
    if (!board) return;
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
        h += '<textarea id="mmTx" maxlength="300"></textarea>';
        if (kind === 'choice') h += '<textarea id="mmOpt" maxlength="300" style="margin-top:6px" placeholder="보기를 한 줄에 하나씩&#10;예) 책을 찾는다 → 3번 장면&#10;선생님께 간다 → 5번 장면"></textarea>';
        if (isS && S.length) h += '<div class="mlbl">이야기 칸</div><div class="chips sec">' + S.map((s, i) => '<button data-c="' + i + '" class="' + ((old ? secOf(old, S) : (o.sec || 0)) === i ? 'on' : '') + '">' + (i + 1) + '. ' + esc(s) + '</button>').join('') + '</div>';
      } else h += '<div class="sm" style="margin-top:8px">위에서 장면과 종류를 골라요.</div>';
      h += '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + '<button class="sub" id="mmNo">취소</button><button id="mmOk"' + (Q && (isS || sid) ? '' : ' disabled style="opacity:.45"') + '>💾 저장</button></div>';
      const keep = { tx: (P.querySelector('#mmTx') || {}).value, who: (P.querySelector('#mmWho') || {}).value, opt: (P.querySelector('#mmOpt') || {}).value };
      P.innerHTML = h;
      const tx = P.querySelector('#mmTx'), wh = P.querySelector('#mmWho'), op = P.querySelector('#mmOpt');
      if (tx) tx.value = keep.tx != null ? keep.tx : old ? old.tx || '' : '';
      if (wh) wh.value = keep.who != null ? keep.who : old ? old.who || '' : '';
      if (op) op.value = keep.opt != null ? keep.opt : old ? old.opt || '' : '';
      if (tx) setTimeout(() => (wh && !wh.value ? wh : tx).focus(), 30);
    };
    let secSel = old ? secOf(old, S) : (o.sec || 0);
    P.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { if (b.dataset.s === '@new') { kind = 'scene'; sid = null; } else { sid = b.dataset.s; if (kind === 'scene' || !kind) kind = pt ? 'place' : 'who'; } draw(); return; }
      if (b.dataset.k) { kind = b.dataset.k; draw(); return; }
      if (b.dataset.c != null) { secSel = +b.dataset.c; P.querySelectorAll('.sec button').forEach((x) => x.classList.toggle('on', x === b)); return; }
      if (b.id === 'mmNo') done();
      else if (b.id === 'mmDel') {
        const kc = isScene(old) ? kids(o.id).length : 0;
        if (!confirm(isScene(old) ? '이 장면을 지울까요?' + (kc ? '\n(덧붙인 것 ' + kc + '개도 함께 지워져요)' : '') : '이것을 지울까요?')) return;
        try { await Promise.all([req(fpath(o.id), 'DELETE'), ...(isScene(old) ? kids(o.id).map(([k]) => req(fpath(k), 'DELETE')) : [])]); } catch (er) { toast('지우지 못했어요', 2); } done();
      } else if (b.id === 'mmOk') save();
    });
    const done = () => { if (back === 'board') { back = null; boardView(); } else close(); };
    async function save() {
      const isS = kind === 'scene', tx = (P.querySelector('#mmTx') || {}).value || '', who = ((P.querySelector('#mmWho') || {}).value || '').trim(), opt = ((P.querySelector('#mmOpt') || {}).value || '').trim();
      if (!isS && !sid) return toast('몇 번 장면인지 골라 주세요', 2);
      if (!tx.trim() && kind !== 'place') return toast(isS ? '무슨 일이 일어나는지 적어 주세요' : '내용을 적어 주세요', 2);
      const f = { k: kind, tx: tx.trim().slice(0, 300), who: who && (kind === 'who' || kind === 'say') ? who.slice(0, 30) : null, opt: kind === 'choice' && opt ? opt.slice(0, 300) : null };
      try {
        if (old) {
          if (isS && S.length) { f.sec = secSel; if (secSel !== secOf(old, S)) f.ord = Date.now(); }
          await req(fpath(o.id), 'PATCH', f);
        } else {
          for (const k of ['who', 'opt']) if (f[k] == null) delete f[k];
          Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }, pt ? placeFields(pt) : {});
          if (isS) { if (S.length) f.sec = secSel; } else f.p = sid;
          const nid = newId(); await req(fpath(nid), 'PUT', f); lastScene = isS ? nid : sid;
        }
        map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : pt ? '🚩 ' + (isS ? '새 장면' : (N.get(sid) || '') + '번 장면') + ' 깃발을 꽂았어요!' : isS ? '🎬 새 장면을 만들었어요!' : '＋ 덧붙였어요!', 2.2);
      } catch (e) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
      done();
    }
    draw();
  }

  // ───────── 🗂 관리(선생님) — 비우기는 판 번호를 적어야 · 비운 것은 보관 → 되돌리기 ─────────
  async function admin() {
    if (!teacher) return;
    const P = open('memo-admin'); P.innerHTML = '<h3>🗂 「' + esc(board.t) + '」 관리</h3><div class="sm">불러오는 중…</div>';
    let bak = null; try { bak = await req('/trash/' + board.id); } catch (e) { /* */ }
    if (panel !== P) return;
    const n = Object.keys(DATA).length, no = String(board.n || board.id);
    P.innerHTML = '<h3>🗂 「' + esc(board.t) + '」 관리</h3>'
      + '<div class="mlbl">🧹 판 비우기</div><div class="sm">장면·덧붙인 것·깃발 ' + n + '개를 모두 지워요. 지운 것은 한 번 보관돼서 아래 ↩️로 되돌릴 수 있어요.<br>정말 비우려면 판 번호 <b>' + esc(no) + '</b>을(를) 적어요.</div>'
      + '<div style="display:flex;gap:6px;margin-top:6px"><input id="mmNo2" maxlength="12" placeholder="판 번호" style="width:120px"><button class="warn" id="mmClr">🧹 비우기</button></div>'
      + '<div class="mlbl">↩️ 되돌리기</div><div class="sm">' + (bak && bak.flags ? new Date(bak.t || 0).toLocaleString('ko-KR') + '에 비운 ' + Object.keys(bak.flags).length + '개가 보관돼 있어요.' : '보관된 것이 없어요.') + '</div>'
      + (bak && bak.flags ? '<div class="row" style="justify-content:flex-start"><button class="sub" id="mmUndo">↩️ 보관한 것 되돌리기(지금 판에 더해요)</button></div>' : '')
      + '<div class="row"><button class="sub" id="mmBk">◀ 이야기 판</button></div>';
    P.querySelector('#mmBk').onclick = boardView;
    P.querySelector('#mmClr').onclick = async () => {
      if (P.querySelector('#mmNo2').value.trim() !== no) return toast('판 번호가 달라요 — 비우지 않았어요', 2.5);
      try { await req('/trash/' + board.id, 'PUT', { t: { '.sv': 'timestamp' }, flags: DATA }); const ids = Object.keys(DATA); await Promise.all(ids.map((k) => req(fpath(k), 'DELETE'))); toast('🧹 비웠어요 — 🗂 관리에서 되돌릴 수 있어요', 3); } catch (e) { toast('비우지 못했어요', 2); }
      admin();
    };
    const u = P.querySelector('#mmUndo');
    if (u) u.onclick = async () => { try { await req('/boards/' + board.id + '/flags', 'PATCH', bak.flags); toast('↩️ 되돌렸어요', 2); } catch (e) { toast('되돌리지 못했어요', 2); } boardView(); };
  }

  // ───────── ▶ 장면 따라 걷기 ─────────
  let tourI = -1, tourEl = null;
  function goTo(f) {
    let dx = 1.2, dz = 1.2;
    if (f.cam && f.cam.length === 3) { dx = f.cam[0] - f.x; dz = f.cam[2] - f.z; const d = Math.hypot(dx, dz) || 1; dx = dx / d * 2.4; dz = dz / d * 2.4; }
    const e = map.findEntry(f.x + dx, f.z + dz, f.y || 0, null, 3) || map.findEntry(f.x + 1.2, f.z + 1.2, f.y || 0, null, 3);
    map.player.teleport(e ? [e.x, e.y, e.z] : [f.x, f.y || 0, f.z]); map.player.lookAt([f.x, f.z]);
  }
  function startTour(i) { const L = scenes(); if (!L.length) return toast('아직 장면이 없어요', 2); close(); tourI = Math.max(0, Math.min(L.length - 1, i)); showTour(true); }
  function showTour(move) {
    const L = scenes(), S = secs(); if (tourI >= L.length) tourI = L.length - 1; if (tourI < 0) return endTour();
    const [id, f] = L[tourI]; if (move) { const p = firstPlace(id); if (p) goTo(p); }
    if (!tourEl) {
      tourEl = el('div', 'mp'); tourEl.id = 'memo-tour'; wire(tourEl);
      tourEl.addEventListener('keydown', (e) => { if (e.target.matches('input,textarea')) e.stopPropagation(); });
      tourEl.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; if (t === 'end') endTour(); else step(t === 'next' ? 1 : -1); });
    }
    const a = document.activeElement; if (tourEl.contains(a) && a.matches('input') && a.value) return;
    tourEl.innerHTML = '<div class="sm" style="margin-bottom:6px;font-weight:800">▶ 장면 ' + (tourI + 1) + ' / ' + L.length + (S.length ? ' · ' + esc(S[secOf(f, S)]) : '') + (firstPlace(id) ? '' : ' · 📍 깃발 없는 장면') + '</div>' + cardHTML(id, f, tourI + 1, { noGo: true, noAdd: true })
      + '<div class="row"><button class="sub" data-t="end">✕ 그만</button><button class="sub" data-t="prev"' + (tourI ? '' : ' disabled style="opacity:.4"') + '>◀ 이전 (B)</button><button data-t="next">' + (tourI < L.length - 1 ? '다음 ▶ (N)' : '🏁 끝') + '</button></div>';
  }
  function step(d) { const n = scenes().length; if (tourI + d >= n) { endTour(); toast('🏁 마지막 장면까지 봤어요', 2); return; } tourI = Math.max(0, tourI + d); showTour(true); }
  function endTour() { if (tourEl) tourEl.remove(); tourEl = null; tourI = -1; }

  // ───────── 📤 정리 ─────────
  function summaryText() {
    const L = scenes(), S = secs(), out = ['# 메타버스 메모장 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 장면 ' + L.length + '개 · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 번호 = 장면 순서 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    const at = (f) => placed(f) ? '📍 ' + f.zone + (f.near ? ' · ' + f.near + ' 근처' : '') + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' : '';
    let cur = -1;
    L.forEach(([id, f], i) => {
      const s = secOf(f, S); if (S.length && s !== cur) { cur = s; out.push('## ' + (s + 1) + '. ' + S[s]); }
      const lk = f.lk ? Object.keys(f.lk).length : 0;
      out.push('### 장면 ' + (i + 1) + ' — ' + String(f.tx).replace(/\n/g, ' ') + '  (✍️ ' + f.by + (lk ? ' · ❤️ ' + lk : '') + ')');
      if (placed(f)) out.push('   ' + at(f));
      for (const [, x] of kids(id)) {
        const A = KBY[x.k] || PLACE;
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
    P.innerHTML = '<h3>📤 정리 — Claude에게 넘길 글</h3><div class="sm">선생님: 아래 글을 복사해 Claude에게 붙여 넣거나, 판 번호만 알려 줘도 돼요(Claude가 바로 읽어요).</div><pre></pre><div class="row"><button class="sub" id="mmB">◀ 이야기 판</button><button id="mmCp">📋 복사하기</button></div>';
    P.querySelector('pre').textContent = txt;
    P.querySelector('#mmB').onclick = boardView;
    P.querySelector('#mmCp').onclick = async () => { try { await navigator.clipboard.writeText(txt); toast('📋 복사했어요', 2); } catch (e) { toast('복사가 막혔어요 — 글을 직접 골라 복사해 주세요', 3); } };
  }

  // ───────── 입력 · 칩 ─────────
  const cross = el('div', ''); cross.id = 'memo-x';
  function chips() {
    map.hud.chip('memo-f', placing ? '🚩 ' + (numMap().get(placing) || '') + '번 장면 깃발 — 땅을 톡 · F · Esc 취소' : '🚩 깃발 (땅을 톡 · F)', { onClick: () => { if (panel) return; if (placing) placeAt(aimPoint()); else form({ pt: aimPoint() }); } });
    map.hud.chip('memo-l', '📖 이야기 판 (L)', { onClick: () => { if (!panel) boardView(); } });
    map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) { endTour(); pickBoard(); } } });
    map.minimap.show();
  }
  const onKey = (e) => {
    if (!board || panel || e.repeat) return;
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
    stop() { dead = true; clearTimeout(syncT); if (es) es.close(); if (esB) esB.close(); hereOff(); removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); removeEventListener('sm-click', onWorldClick); for (const id of [...FL.keys()]) drop3d(id); ui.remove(); css.remove(); },
    get board() { return board; }, get scenes() { return scenes().map(([id, f], i) => ({ id, n: i + 1, ...f, kids: kids(id).map(([kid, x]) => ({ id: kid, ...x })) })); }, summary: () => board ? summaryText() : '',
    place: (o) => form({ pt: aimPoint(), ...(o || {}) }), view: boardView, tour: startTour, moveTo: (id, sec, before) => moveTo(id, sec, before),
    enter: (id, info) => { name = name || '시험'; board = { id, ...info }; listen(); chips(); },
  };
}
