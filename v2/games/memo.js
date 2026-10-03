// 메타버스 메모장(MEMO-1 · 10-03 교사 '운동장 어디에 깃발을 꽂고 여기에 뭐가 필요해요 — 저장하면 내가 보고 Claude에게 만들라고') — RPG 생각판의 메타버스판.
//   판 1~10번(선생님이 정해 둔 판에 들어감) → 학교를 걸으며 화면 가운데가 가리키는 곳에 🚩 깃발(F) → 종류·글 → 저장(Firebase class-rpg · metaverse/boards) · 같은 판 친구 깃발이 바로 보임
//   MEMO-2(10-03 교사 '패들렛 같은 공통 판 · 이야기 순서'): 🧱 판 보기(L) = 담벼락(카드 모아 보기 · ❤️ · 💬 댓글) / 📖 이야기 순서(끌어서 순서 · 선생님이 칸 '처음, 가운데, 끝' 정하면 칸마다)
//     장소 없이 판에만 붙이는 카드(나중에 📍로 꽂기) · ▶ 순서대로 걸어 보기(깃발마다 그 자리로 · N 다음 · B 이전) · 📤 정리 = Claude에게 넘길 글(아이가 쓴 글만)
export const meta = { id: 'memo', title: '메타버스 메모장', api: 1 };

const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const KINDS = [
  { k: 'memo', e: '📝', n: '메모', c: 0xffd43b, q: '여기에 무엇이 필요해요? 무엇을 하면 좋을까요?' },
  { k: 'who', e: '🧑', n: '등장인물', c: 0x4dabf7, q: '누가 여기 있어요? 무엇을 하고 있어요?' },
  { k: 'say', e: '💬', n: '대사', c: 0xf783ac, q: '여기서 누가 무슨 말을 해요?' },
  { k: 'item', e: '📦', n: '물건', c: 0xffa94d, q: '어떤 물건이 있어요? 줍기·열기·파기?' },
  { k: 'event', e: '⚡', n: '사건', c: 0xda77f2, q: '여기에 오면 무슨 일이 일어나요?' },
  { k: 'choice', e: '❓', n: '선택', c: 0x69db7c, q: '어떤 고민을 해요? (보기는 아래에 한 줄씩)' },
  { k: 'mark', e: '🏁', n: '시작·끝', c: 0xff6b6b, q: '여기서 시작해요? 끝나요?' },
];
const KBY = Object.fromEntries(KINDS.map((x) => [x.k, x]));
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const STYLE = `
#memo-ui{position:fixed;inset:0;pointer-events:none;z-index:41;font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;color:#1d3557}
#memo-ui .mp{pointer-events:auto;position:absolute;background:#fffdf6;border:3px solid #1d3557;border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,.3)}
#memo-ui button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:8px 13px;font-weight:800;background:#1d3557;color:#fff}
#memo-ui button.sub{background:#e8edf3;color:#1d3557}
#memo-ui button.warn{background:#ffe3e3;color:#c92a2a}
#memo-ui input,#memo-ui textarea,#memo-ui select{font:inherit;font-size:16px;border:2px solid #c9d3df;border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box;background:#fff;color:#1d3557}
#memo-ui textarea{min-height:76px;resize:vertical}
#memo-ui h3{margin:0 0 8px;font-size:19px}
#memo-ui .sm{font-size:13px;color:#5a6b80}
#memo-pick,#memo-form,#memo-sum,#memo-view{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:88vh;overflow:auto;padding:14px 16px}
#memo-pick .bd{display:grid;gap:8px;margin:10px 0}
#memo-pick .bd button{text-align:left;background:#eef4ff;color:#1d3557;padding:10px 12px;border:2px solid #c9d8f0}
#memo-pick .bd button small{display:block;font-weight:600;color:#5a6b80;margin-top:2px}
#memo-form .kinds{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
#memo-form .kinds button{background:#f1f3f5;color:#1d3557;padding:7px 10px;border:2px solid transparent}
#memo-form .kinds button.on{border-color:#1d3557;background:#fff3bf}
#memo-ui .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}
#memo-ui .where{font-weight:800;margin:4px 0 8px}
#memo-sum pre{white-space:pre-wrap;font-size:13px;background:#f8f9fa;border-radius:10px;padding:10px;max-height:52vh;overflow:auto;font-family:inherit}
#memo-x{left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(29,53,87,.7);position:absolute}
#memo-board{inset:2.5vh 2vw;display:flex;flex-direction:column;padding:12px 14px}
#memo-board .top{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#memo-board .top h3{margin:0;flex:1;min-width:180px}
#memo-board .tabs{display:flex;gap:4px;background:#e8edf3;border-radius:12px;padding:3px}
#memo-board .tabs button{background:transparent;color:#1d3557;padding:6px 12px}
#memo-board .tabs button.on{background:#1d3557;color:#fff}
#memo-board .flt{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin:8px 0}
#memo-board .flt .f{padding:4px 9px;font-size:13px;background:#f1f3f5;color:#1d3557;border:2px solid transparent}
#memo-board .flt .f.on{border-color:#1d3557;background:#fff3bf}
#memo-board .body{flex:1;overflow:auto;background:#f3efe4;border-radius:12px;padding:12px}
#memo-ui .wall{column-width:240px;column-gap:12px}
#memo-ui .wall .cd{break-inside:avoid;margin:0 0 12px}
#memo-ui .cd{background:#fff;border-radius:12px;padding:8px 10px;box-shadow:0 2px 6px rgba(0,0,0,.13);border-top:7px solid var(--k);font-size:14px;position:relative;text-align:left}
#memo-ui .cd .hd{display:flex;gap:6px;align-items:center;font-weight:800;font-size:13px}
#memo-ui .cd .no{background:#1d3557;color:#fff;border-radius:8px;min-width:22px;text-align:center;padding:1px 5px;touch-action:none;cursor:grab}
#memo-ui .cd .by{margin-left:auto;color:#5a6b80;font-weight:600}
#memo-ui .cd .tx{white-space:pre-wrap;line-height:1.5;margin:5px 0;word-break:break-word;font-size:15px}
#memo-ui .cd .who{font-weight:800;margin-top:4px}
#memo-ui .cd .opt{white-space:pre-wrap;background:#ebfbee;border-radius:8px;padding:5px 7px;font-size:13px;margin-bottom:4px}
#memo-ui .cd .pl{font-size:12px;color:#5a6b80}
#memo-ui .cd .pl.none{color:#c2410c}
#memo-ui .cd .ft{display:flex;gap:4px;align-items:center;margin-top:6px;flex-wrap:wrap}
#memo-ui .cd .ft button{padding:4px 8px;font-size:13px;background:#f1f3f5;color:#1d3557}
#memo-ui .cd .ft button.on{background:#ffe3ec;color:#c2255c}
#memo-ui .cd .res{margin-top:6px;border-top:1px dashed #d0d7e2;padding-top:5px;font-size:13px}
#memo-ui .cd .res>div{margin:3px 0;word-break:break-word}
#memo-ui .cd .res .x{padding:0 6px;font-size:12px;background:#f1f3f5;color:#868e96}
#memo-ui .cd .ri{display:flex;gap:4px;margin-top:5px}
#memo-ui .cd .ri input{font-size:14px;padding:5px 8px}
#memo-ui .cd .ri button{padding:5px 10px;font-size:13px;white-space:nowrap}
#memo-ui .order .cd{cursor:grab}
#memo-ui .lanes{display:flex;gap:12px;align-items:flex-start;min-height:100%}
#memo-ui .lane{flex:0 0 260px;background:rgba(255,255,255,.6);border-radius:12px;padding:8px;min-height:160px;box-sizing:border-box}
#memo-ui .lane h4{margin:0 0 8px;font-size:15px}
#memo-ui .lane .cd{margin-bottom:10px}
#memo-ui .lane .cd.dB{box-shadow:0 -5px 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane .cd.dA{box-shadow:0 5px 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .lane.dE{outline:3px dashed #f59f00}
#memo-ui .strip{display:flex;flex-wrap:wrap;gap:24px 30px;align-items:flex-start;min-height:120px}
#memo-ui .strip .cd{width:230px;box-sizing:border-box}
#memo-ui .strip .cd:not(:last-child)::after{content:'➜';position:absolute;right:-24px;top:42%;font-size:17px;color:#8a7b5a}
#memo-ui .strip .cd.dB{box-shadow:-6px 0 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .strip .cd.dA{box-shadow:6px 0 0 #f59f00,0 2px 6px rgba(0,0,0,.13)}
#memo-ui .strip.dE{outline:3px dashed #f59f00}
#memo-ui .cd.drag{opacity:.3}
#memo-ui .ghost{position:fixed;pointer-events:none;z-index:60;width:230px;opacity:.92;transform:rotate(2deg);box-sizing:border-box}
#memo-tour{left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,94vw);padding:10px 12px;max-height:46vh;overflow:auto}
#memo-tour .cd{box-shadow:none;border:1px solid #e8edf3;border-top:7px solid var(--k)}
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
  const canWrite = () => teacher || !(board && board.lock);
  const lockMsg = () => toast('🔒 선생님이 잠근 판이에요 — 보기만 할 수 있어요', 3);
  let panel = null, back = null;
  const close = () => { if (panel) panel.remove(); panel = null; map.player.freeze(false); };
  const open = (id) => { close(); document.exitPointerLock?.(); map.player.freeze(true); panel = el('div', 'mp'); panel.id = id; keyStop(panel); return panel; };
  addEventListener('keydown', onEsc, true);
  function onEsc(e) {
    if (e.code !== 'Escape') return;
    if (placing) { e.stopPropagation(); placing = null; chips(); toast('📍 장소 정하기를 그만했어요', 1.5); }
    else if (panel && board) { e.stopPropagation(); if (panel.id === 'memo-form' && back === 'board') { back = null; boardView(); } else close(); }
    else if (tourEl) { e.stopPropagation(); endTour(); }
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
  async function teacherLogin() {
    let saved = null; try { saved = await req('/memoPin'); } catch (e) { return toast('인터넷을 확인해 주세요', 2); }
    if (!saved) {
      const a = prompt('선생님 비밀번호(숫자 4자리)를 새로 정해 주세요'); if (!a) return; if (!/^\d{4}$/.test(a)) return toast('숫자 4자리로 정해 주세요');
      if (prompt('한 번 더 적어 주세요') !== a) return toast('두 번이 달라요. 다시 해 주세요');
      try { await req('/memoPin', 'PUT', await hash(a)); } catch (e) { return toast('저장하지 못했어요', 2); }
      teacher = true; try { sessionStorage.setItem('sm.t', '1'); } catch (e) { /* */ } toast('🔒 비밀번호를 정했어요 — 선생님 모드'); return board ? boardView() : pickBoard();
    }
    const a = prompt('선생님 비밀번호 4자리'); if (!a) return;
    if (await hash(a) !== saved) return toast('비밀번호가 달라요', 2);
    teacher = true; try { sessionStorage.setItem('sm.t', '1'); } catch (e) { /* */ } toast('🔓 선생님 모드', 2); if (board) boardView(); else pickBoard();
  }
  const secPrompt = (cur) => { const s = prompt('이야기 순서 칸 이름(쉼표로 나눠요 · 비우면 칸 없이 한 줄)\n예) 처음, 가운데, 끝', cur || ''); return s == null ? null : s.split(/[,|]/).map((x) => x.trim()).filter(Boolean).slice(0, 6).join(', ').slice(0, 120); };
  async function pickBoard() {
    const P = open('memo-pick');
    P.innerHTML = '<h3>📝 메타버스 메모장' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">학교를 걸어 다니며 깃발을 꽂고, 그곳에 무엇이 필요한지 적어요. 같은 판에 들어온 친구들의 깃발·카드도 바로 보여요.</div>'
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
        const cl = el('button', 'warn', '🧹', row); cl.title = '깃발 모두 지우기'; cl.onclick = async () => { if (!confirm('「' + L.t + '」의 깃발·카드를 모두 지울까요? 되돌릴 수 없어요.')) return;
          try { const f = (await fetch(DB + '/boards/' + id + '/flags.json?shallow=true').then((r) => r.json())) || {}; await Promise.all(Object.keys(f).map((k) => req('/boards/' + id + '/flags/' + k, 'DELETE'))); toast('🧹 비웠어요', 2); } catch (e) { toast('지우지 못했어요', 2); } };
      }
    }
    if (params.board && list[params.board]) enter(params.board, list[params.board]);
  }
  function enter(id, info) {
    const P = panel; const nm = P && P.querySelector('#mmName'); const v = nm ? nm.value.trim().replace(/[<>]/g, '').slice(0, 8) : '';
    if (!v) { toast('먼저 내 이름을 적어 주세요', 2.2); if (nm) nm.focus(); return; }
    name = v; try { localStorage.setItem('mp.name', name); } catch (e) { /* */ }
    dispatchEvent(new CustomEvent('sm-name', { detail: name }));   // 동시 접속 이름표도 같은 이름으로(main.js)
    board = { id, ...info }; close(); endTour(); placing = null; listen(); chips();
    toast('📌 「' + board.t + '」 — 가리키는 곳을 보고 F(🚩)로 깃발 · L = 판 보기', 4);
  }

  // ───────── 순서 ─────────
  const secs = () => (board && board.sec ? String(board.sec).split(/[,|]/).map((s) => s.trim()).filter(Boolean).slice(0, 6) : []);
  const secOf = (f, S) => S.length ? Math.min(S.length - 1, Math.max(0, f.sec | 0)) : 0;
  const placed = (f) => typeof f.x === 'number' && typeof f.z === 'number';
  const cards = () => Object.entries(DATA).filter(([, f]) => f && typeof f === 'object' && f.k && typeof f.tx === 'string');
  function ordered() { const S = secs(); return cards().sort((a, b) => secOf(a[1], S) - secOf(b[1], S) || (a[1].ord || 0) - (b[1].ord || 0) || (a[1].t || 0) - (b[1].t || 0)); }
  async function moveTo(id, sec, before) {   // before = 이 카드 앞에(없으면 칸 끝)
    if (!canWrite()) return lockMsg();
    const S = secs(), L = ordered().filter(([i, f]) => i !== id && secOf(f, S) === sec), k = before ? L.findIndex(([i]) => i === before) : L.length, at = k < 0 ? L.length : k;
    const p = at > 0 ? L[at - 1][1].ord || 0 : null, n = at < L.length ? L[at][1].ord || 0 : null;
    const ord = p == null && n == null ? Date.now() : p == null ? n - 1000 : n == null ? p + 1000 : (p + n) / 2;
    const patch = { ord }; if (S.length) patch.sec = sec;
    if (DATA[id]) Object.assign(DATA[id], patch); syncNow();
    try { await req(fpath(id), 'PATCH', patch); } catch (e) { toast('순서를 바꾸지 못했어요', 2); }
  }

  // ───────── 깃발(3D) ─────────
  const FL = new Map();
  const mats = new Map(), lam = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); return mats.get(c); };
  const poleG = new THREE.CylinderGeometry(0.035, 0.035, 2.1, 6), clothG = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 2.05, 0, 0.75, 1.82, 0, 0, 1.55, 0], 3)); g.computeVertexNormals(); return g; })();
  function tag(text) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
    g.font = '800 40px sans-serif'; const w = Math.min(500, g.measureText(text).width + 36);
    g.fillStyle = 'rgba(255,253,246,.95)'; g.beginPath(); g.roundRect((512 - w) / 2, 8, w, 80, 24); g.fill(); g.strokeStyle = '#1d3557'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#1d3557'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(2.6, 0.49, 1); return s;
  }
  const sigOf = (f, num) => [num, f.k, f.tx, f.x, f.y, f.z].join('|');
  function drop3d(id) { const F = FL.get(id); if (!F) return; map.remove(F.g); F.tag.material.map.dispose(); F.tag.material.dispose(); if (F.hot) F.hot.remove(); FL.delete(id); }
  function draw3d(id, f, num) {
    drop3d(id);
    const K = KBY[f.k] || KINDS[0], g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); g.add(new THREE.Mesh(clothG, lam(K.c)));
    const tg = tag(num + '. ' + K.e + ' ' + (short(f.tx) || K.n)); tg.position.y = 2.55; g.add(tg);
    map.add(g);
    FL.set(id, { g, tag: tg, sig: sigOf(f, num), hot: map.interact.add({ x: f.x, y: f.y || 0, z: f.z, r: 1.6, label: num + '번 깃발 보기', use: () => view(id) }) });
  }
  let syncT = 0;
  function sync() { if (!syncT) syncT = setTimeout(syncNow, 40); }
  function syncNow() {
    clearTimeout(syncT); syncT = 0; if (dead) return;
    const L = ordered(), live = new Set(L.filter(([, f]) => placed(f)).map(([id]) => id));
    for (const id of [...FL.keys()]) if (!live.has(id)) drop3d(id);
    L.forEach(([id, f], i) => { if (placed(f) && (!FL.get(id) || FL.get(id).sig !== sigOf(f, i + 1))) draw3d(id, f, i + 1); });
    if (board) map.hud.chip('memo-b', (board.lock ? '🔒 ' : '📌 ') + short(board.t, 14) + ' · 카드 ' + L.length + '개');
    map.minimap.setMarks(L.map(([, f], i) => placed(f) ? { x: f.x, z: f.z, color: hex((KBY[f.k] || KINDS[0]).c), label: String(i + 1), floor: (f.y || 0) > 2.5 ? 2 : 1 } : null).filter(Boolean));
    if (panel && (panel.id === 'memo-board' || panel.id === 'memo-view')) rerender();
    if (tourEl) showTour(false);
  }

  // ───────── 카드(판 보기·깃발 보기·걸어 보기 공용) ─────────
  const openRe = new Set();
  function cardHTML(id, f, num, o = {}) {
    const K = KBY[f.k] || KINDS[0], lk = f.lk ? Object.keys(f.lk) : [], me = lk.includes(keyOf(name));
    const re = f.re ? Object.entries(f.re).filter(([, r]) => r && r.tx).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)) : [];
    const own = teacher || f.by === name, can = canWrite(), showRe = o.re || openRe.has(id);
    return '<div class="cd" data-id="' + esc(id) + '" style="--k:' + hex(K.c) + '"><div class="hd"><span class="no">' + num + '</span>' + K.e + ' ' + K.n + '<span class="by">✍️ ' + esc(f.by) + '</span></div>'
      + (f.who ? '<div class="who">🧑 ' + esc(f.who) + '</div>' : '') + '<div class="tx">' + esc(f.tx) + '</div>' + (f.opt ? '<div class="opt">' + esc(f.opt) + '</div>' : '')
      + (placed(f) ? '<div class="pl">📍 ' + esc(f.zone) + (f.near ? ' · ' + esc(f.near) + ' 근처' : '') + '</div>' : '<div class="pl none">📍 아직 장소 없음 — 판에만 붙인 카드</div>')
      + '<div class="ft"><button data-a="like" class="' + (me ? 'on' : '') + '" title="좋아요">' + (me ? '❤️' : '🤍') + ' ' + (lk.length || '') + '</button><button data-a="re" title="댓글">💬 ' + (re.length || '') + '</button><span style="flex:1"></span>'
      + (placed(f) && !o.noGo ? '<button data-a="go" title="그 자리로 가 보기">🚶</button>' : '')
      + (own && can ? '<button data-a="place" title="' + (placed(f) ? '장소 옮기기' : '장소 정하기') + '">📍</button><button data-a="edit" title="고치기">✏️</button>' : '') + '</div>'
      + (showRe ? '<div class="res">' + (re.map(([rid, r]) => '<div>💬 <b>' + esc(r.by) + '</b> ' + esc(r.tx) + (teacher || r.by === name ? ' <button class="x" data-a="rd" data-r="' + esc(rid) + '" title="댓글 지우기">✕</button>' : '') + '</div>').join('') || '<div class="sm">아직 댓글이 없어요</div>')
        + (can ? '<div class="ri"><input maxlength="120" placeholder="댓글 달기 (Enter)"><button data-a="rs">보내기</button></div>' : '') + '</div>' : '')
      + '</div>';
  }
  async function sendRe(card) {
    const id = card.dataset.id, inp = card.querySelector('.ri input'), tx = inp && inp.value.trim(); if (!tx) return;
    if (!canWrite()) return lockMsg();
    inp.value = '';
    try { await req(fpath(id) + '/re/r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), 'PUT', { by: name, tx: tx.slice(0, 120), t: { '.sv': 'timestamp' } }); map.sfx('ding'); } catch (e) { inp.value = tx; toast('댓글을 보내지 못했어요', 2); }
    flush();
  }
  function wire(P) {
    P.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b || !P.contains(b)) return;
      const cd = b.closest('.cd'), id = cd && cd.dataset.id, f = id && DATA[id], a = b.dataset.a;
      if (!a || !cd || !f) return;
      if (a === 'like') {
        if (!canWrite()) return lockMsg();
        const k = keyOf(name), on = f.lk && f.lk[k];
        f.lk = { ...(f.lk || {}) }; if (on) delete f.lk[k]; else f.lk[k] = true; syncNow();
        try { await req(fpath(id) + '/lk/' + encodeURIComponent(k), on ? 'DELETE' : 'PUT', on ? undefined : true); } catch (er) { toast('저장하지 못했어요', 2); }
      } else if (a === 're') { if (openRe.has(id)) openRe.delete(id); else openRe.add(id); rerender(true); const inp = P.querySelector('.cd[data-id="' + window.CSS.escape(id) + '"] .ri input'); if (inp) inp.focus(); }
      else if (a === 'rs') sendRe(cd);
      else if (a === 'rd') { if (!confirm('이 댓글을 지울까요?')) return; try { await req(fpath(id) + '/re/' + encodeURIComponent(b.dataset.r), 'DELETE'); } catch (er) { toast('지우지 못했어요', 2); } }
      else if (a === 'go') { close(); goTo(f); }
      else if (a === 'place') { if (!canWrite()) return lockMsg(); close(); endTour(); placing = id; chips(); toast('📍 깃발을 꽂을 곳을 화면 가운데로 보고 F · 취소 Esc', 4); }
      else if (a === 'edit') { back = panel && panel.id === 'memo-board' ? 'board' : null; if (tourEl) endTour(); form(id); }
    });
    P.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.ri input') && !e.isComposing) { e.preventDefault(); sendRe(e.target.closest('.cd')); } });
    P.addEventListener('focusout', () => setTimeout(flush, 400));
  }
  let pend = false, drag = null;
  const busy = () => { const a = document.activeElement; return !!drag || !!(panel && a && panel.contains(a) && a.matches('input,textarea') && a.value); };
  function rerender(force) { if (!panel) return; if (!force && busy()) { pend = true; return; } pend = false; if (panel.id === 'memo-board') boardView(); else if (panel.id === 'memo-view') view(viewId); }
  function flush() { if (pend && !busy()) rerender(); }

  // ───────── 🧱 판 보기 ─────────
  let mode = 'wall', kf = 'all', mine = false;
  function boardView() {
    if (!board) return;
    const re = panel && panel.id === 'memo-board', P = re ? panel : open('memo-board');
    const old = re && P.querySelector('.body'), sc = old ? [old.scrollTop, old.scrollLeft] : [0, 0];
    if (!re) { wire(P); dragWire(P); }
    const S = secs(), L = ordered(), N = new Map(L.map(([id], i) => [id, i + 1])), can = canWrite();
    let h = '<div class="top"><h3>📌 ' + esc(board.t) + (board.lock ? ' <span class="sm">🔒 보기만</span>' : '') + '</h3>'
      + '<div class="tabs"><button data-m="wall" class="' + (mode === 'wall' ? 'on' : '') + '">🧱 담벼락</button><button data-m="order" class="' + (mode === 'order' ? 'on' : '') + '">📖 이야기 순서</button></div>'
      + (teacher ? '<button class="sub" data-b="sec" title="이야기 순서 칸 정하기">⚙️ 칸</button><button class="sub" data-b="lock" title="' + (board.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)') + '">' + (board.lock ? '🔓' : '🔒') + '</button>' : '<button class="sub" data-b="t" title="선생님">🔒</button>')
      + '<button class="sub" data-b="close">✕ 닫기</button></div>'
      + (board.p ? '<div class="sm" style="margin-top:4px">💡 ' + esc(board.p) + '</div>' : '')
      + '<div class="flt">';
    if (mode === 'wall') h += '<button class="f ' + (kf === 'all' ? 'on' : '') + '" data-k="all">전체</button>' + KINDS.map((K) => '<button class="f ' + (kf === K.k ? 'on' : '') + '" data-k="' + K.k + '">' + K.e + ' ' + K.n + '</button>').join('') + '<button class="f ' + (mine ? 'on' : '') + '" data-b="mine">✍️ 내 카드</button>';
    else h += '<span class="sm">' + (can ? '카드를 끌어서 순서를 바꿔요 (휴대폰은 번호를 잡고 끌어요)' : '선생님이 잠근 판 — 보기만') + '</span>';
    h += '<span style="flex:1"></span>' + (can ? '<button data-b="add">＋ 카드 쓰기</button>' : '') + '<button class="sub" data-b="tour">▶ 순서대로 걸어 보기</button><button class="sub" data-b="sum">📤 정리</button></div><div class="body"></div>';
    P.innerHTML = h;
    const body = P.querySelector('.body');
    if (!L.length) body.innerHTML = '<div class="sm" style="padding:20px;text-align:center;font-size:15px">아직 카드가 없어요.<br>학교를 걸으며 <b>F</b>로 깃발을 꽂거나, <b>＋ 카드 쓰기</b>로 판에 바로 붙여 봐요!</div>';
    else if (mode === 'wall') {
      const W = L.filter(([, f]) => (kf === 'all' || f.k === kf) && (!mine || f.by === name));
      body.innerHTML = W.length ? '<div class="wall">' + W.map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>' : '<div class="sm" style="padding:20px;text-align:center">이 조건의 카드가 없어요</div>';
    } else if (S.length) {
      body.innerHTML = '<div class="order lanes">' + S.map((s, si) => '<div class="lane" data-sec="' + si + '"><h4>' + (si + 1) + '. ' + esc(s) + '</h4>' + L.filter(([, f]) => secOf(f, S) === si).map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>').join('') + '</div>';
    } else body.innerHTML = '<div class="order strip" data-sec="0">' + L.map(([id, f]) => cardHTML(id, f, N.get(id))).join('') + '</div>';
    body.scrollTop = sc[0]; body.scrollLeft = sc[1];
    P.onclick = async (e) => {
      const b = e.target.closest('[data-m],[data-k],[data-b]'); if (!b || b.closest('.cd')) return;
      if (b.dataset.m) { mode = b.dataset.m; boardView(); return; }
      if (b.dataset.k) { kf = b.dataset.k; boardView(); return; }
      const a = b.dataset.b;
      if (a === 'mine') { mine = !mine; boardView(); }
      else if (a === 'close') close();
      else if (a === 'add') { if (!canWrite()) return lockMsg(); back = 'board'; form(null, { noPlace: true }); }
      else if (a === 'tour') startTour(0);
      else if (a === 'sum') summary();
      else if (a === 't') teacherLogin();
      else if (a === 'sec') { const s = secPrompt(board.sec); if (s == null) return; mode = 'order'; board.sec = s; boardView(); try { await req('/boardList/' + board.id, 'PATCH', { sec: s || null }); } catch (er) { toast('바꾸지 못했어요', 2); } }
      else if (a === 'lock') { try { await req('/boardList/' + board.id + '/lock', 'PUT', !board.lock); } catch (er) { toast('바꾸지 못했어요', 2); } }
    };
  }
  // 끌어서 순서 바꾸기(마우스 = 카드 아무 데나 · 터치 = 번호 잡고)
  function dragWire(P) {
    P.addEventListener('pointerdown', (e) => {
      const cd = e.target.closest('.order .cd'); if (!cd || e.button > 0 || e.target.closest('button,input,textarea,select')) return;
      if (e.pointerType !== 'mouse' && !e.target.closest('.no')) return;
      if (!canWrite()) return;
      const id = cd.dataset.id, sx = e.clientX, sy = e.clientY, horiz = !!cd.closest('.strip');
      let ghost = null, tgt = null;
      const clear = () => P.querySelectorAll('.dB,.dA,.dE').forEach((n) => n.classList.remove('dB', 'dA', 'dE'));
      const nextCard = (n) => { while (n && !(n.classList && n.classList.contains('cd'))) n = n.nextElementSibling; return n; };
      const mv = (ev) => {
        if (!ghost) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; drag = id; ghost = cd.cloneNode(true); ghost.classList.add('ghost'); ui.appendChild(ghost); cd.classList.add('drag'); }
        ev.preventDefault(); ghost.style.left = ev.clientX - 30 + 'px'; ghost.style.top = ev.clientY - 14 + 'px';
        clear(); tgt = null;
        const u = document.elementFromPoint(ev.clientX, ev.clientY), c = u && u.closest('.order .cd'), lane = u && u.closest('.lane,.strip');
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

  // ───────── 깃발 하나 보기 ─────────
  let viewId = null;
  function view(id) {
    const L = ordered(), i = L.findIndex(([x]) => x === id); if (i < 0) { if (panel && panel.id === 'memo-view') close(); return; }
    const re = panel && panel.id === 'memo-view' && viewId === id, P = re ? panel : open('memo-view'); viewId = id;
    if (!re) wire(P);
    P.innerHTML = cardHTML(id, L[i][1], i + 1, { re: true, noGo: true }) + '<div class="row"><button class="sub" data-v="board">🧱 판 보기</button><button class="sub" data-v="close">닫기</button></div>';
    P.onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'board') boardView(); else close(); };
  }

  // ───────── 꽂기 · 고치기 ─────────
  const _f = new THREE.Vector3(), cam = map.camera;
  function aimPoint() {
    _f.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const o = cam.position, me = map.player.get(), D = 30;
    const t0 = Math.max(0, (me.x - o.x) * _f.x + (me.y + 1 - o.y) * _f.y + (me.z - o.z) * _f.z) + 0.4;
    const a = [o.x + _f.x * t0, o.y + _f.y * t0, o.z + _f.z * t0], b = [o.x + _f.x * D, o.y + _f.y * D, o.z + _f.z * D];
    let r = map.q.ray(a, b);
    if (r === null) for (let k = 1; k <= 60; k++) { const t = k / 60, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t, g = map.q.groundAt(x, z, y + 0.5); if (g != null && y <= g + 0.05) { r = t; break; } }
    if (r === null) return { x: +me.x.toFixed(2), y: +me.y.toFixed(2), z: +me.z.toFixed(2), feet: true };
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
  let placing = null, lastSec = 0;
  async function placeHere() {
    const id = placing; placing = null; chips(); if (!DATA[id]) return;
    const pt = aimPoint(), pf = placeFields(pt); const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 2500);
    try { await req(fpath(id), 'PATCH', pf); map.sfx('ding'); toast('📍 ' + pf.zone + (pf.near ? ' · ' + pf.near : '') + '에 꽂았어요', 2.5); } catch (e) { toast('저장하지 못했어요', 2); }
  }
  function form(id, o = {}) {
    if (!board) return;
    const aim = id || o.noPlace ? null : aimPoint();
    if (!canWrite()) return lockMsg();
    const old = id ? DATA[id] : null; if (id && !old) return;
    if (old && !teacher && old.by !== name) return toast('✍️ ' + old.by + '의 카드예요 — 내 카드만 고칠 수 있어요', 3);
    const pt = old ? null : aim, S = secs();
    const pn = old ? (placed(old) ? { zone: old.zone, near: old.near } : null) : pt ? placeName(pt.x, pt.y, pt.z) : null;
    if (pt) { const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 2500); }
    const P = open('memo-form'); let kind = old ? old.k : 'memo';
    P.innerHTML = '<h3>' + (old ? '✏️ 카드 고치기' : pt ? '🚩 여기에 깃발 꽂기' : '📌 판에 카드 붙이기') + '</h3><div class="where">' + (pn ? '📍 ' + esc(pn.zone) + (pn.near ? ' · ' + esc(pn.near) + ' 근처' : '') + (pt && pt.feet ? ' <span class="sm">(내 발밑)</span>' : '') : '<span class="sm">📍 장소는 나중에 카드의 📍 단추로 정할 수 있어요</span>') + '</div>'
      + '<div class="kinds"></div><div class="sm" id="mmQ"></div><textarea id="mmTx" maxlength="300"></textarea>'
      + '<div id="mmWho" style="display:none;margin-top:6px"><input id="mmWhoIn" maxlength="30" placeholder="누구? (예: 사서선생님 · 새 역할: 길 잃은 고양이)"></div>'
      + '<div id="mmOpt" style="display:none;margin-top:6px"><textarea id="mmOptIn" maxlength="300" placeholder="보기를 한 줄에 하나씩&#10;예) 책을 찾는다 → 3번 카드&#10;사서 선생님을 찾는다 → 5번 카드"></textarea></div>'
      + (S.length ? '<div style="margin-top:8px" class="sm">이야기 칸 <select id="mmSec" style="width:auto;margin-left:6px">' + S.map((s, i) => '<option value="' + i + '">' + (i + 1) + '. ' + esc(s) + '</option>').join('') + '</select></div>' : '')
      + '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + '<button class="sub" id="mmNo">취소</button><button id="mmOk">💾 저장</button></div>';
    const kb = P.querySelector('.kinds');
    const paint = () => { [...kb.children].forEach((b, i) => b.classList.toggle('on', KINDS[i].k === kind)); P.querySelector('#mmQ').textContent = KBY[kind].q; P.querySelector('#mmWho').style.display = kind === 'who' || kind === 'say' ? '' : 'none'; P.querySelector('#mmOpt').style.display = kind === 'choice' ? '' : 'none'; };
    for (const K of KINDS) { const b = el('button', '', K.e + ' ' + K.n, kb); b.onclick = () => { kind = K.k; paint(); }; }
    if (old) { P.querySelector('#mmTx').value = old.tx || ''; P.querySelector('#mmWhoIn').value = old.who || ''; P.querySelector('#mmOptIn').value = old.opt || ''; }
    const sel = P.querySelector('#mmSec'); if (sel) sel.value = String(old ? secOf(old, S) : Math.min(lastSec, S.length - 1));
    paint(); setTimeout(() => P.querySelector('#mmTx').focus(), 30);
    const done = () => { if (back === 'board') { back = null; boardView(); } else close(); };
    P.querySelector('#mmNo').onclick = done;
    if (old) P.querySelector('#mmDel').onclick = async () => { if (!confirm('이 카드를 지울까요? (댓글도 함께 지워져요)')) return; try { await req(fpath(id), 'DELETE'); } catch (e) { toast('지우지 못했어요', 2); } done(); };
    P.querySelector('#mmOk').onclick = async () => {
      const tx = P.querySelector('#mmTx').value.trim(); if (!tx) return toast('무엇을 적을지 써 주세요', 2);
      const who = P.querySelector('#mmWhoIn').value.trim(), opt = P.querySelector('#mmOptIn').value.trim();
      const f = { k: kind, tx: tx.slice(0, 300), who: (kind === 'who' || kind === 'say') && who ? who.slice(0, 30) : null, opt: kind === 'choice' && opt ? opt.slice(0, 300) : null };
      if (sel) { f.sec = +sel.value; lastSec = f.sec; }
      try {
        if (old) {
          if (sel && f.sec !== secOf(old, S)) f.ord = Date.now();   // 다른 칸으로 옮기면 그 칸 끝에
          await req(fpath(id), 'PATCH', f);
        } else {
          for (const k of ['who', 'opt']) if (f[k] == null) delete f[k];
          Object.assign(f, { by: name, t: { '.sv': 'timestamp' }, ord: Date.now() }, pt ? placeFields(pt) : {});
          await req(fpath('f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)), 'PUT', f);
        }
        map.sfx('ding'); toast(old ? '✏️ 고쳤어요' : pt ? '🚩 깃발을 꽂았어요!' : '📌 판에 붙였어요!', 2);
      } catch (e) { toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
      done();
    };
  }

  // ───────── ▶ 순서대로 걸어 보기 ─────────
  let tourI = -1, tourEl = null;
  function goTo(f) {
    let dx = 1.2, dz = 1.2;
    if (f.cam && f.cam.length === 3) { dx = f.cam[0] - f.x; dz = f.cam[2] - f.z; const d = Math.hypot(dx, dz) || 1; dx = dx / d * 2.4; dz = dz / d * 2.4; }
    const e = map.findEntry(f.x + dx, f.z + dz, f.y || 0, null, 3) || map.findEntry(f.x + 1.2, f.z + 1.2, f.y || 0, null, 3);
    map.player.teleport(e ? [e.x, e.y, e.z] : [f.x, f.y || 0, f.z]); map.player.lookAt([f.x, f.z]);
  }
  function startTour(i) {
    const L = ordered(); if (!L.length) return toast('아직 카드가 없어요', 2);
    close(); document.exitPointerLock?.(); tourI = Math.max(0, Math.min(L.length - 1, i)); showTour(true);
  }
  function showTour(move) {
    const L = ordered(), S = secs(); if (tourI >= L.length) tourI = L.length - 1; if (tourI < 0) return endTour();
    const [id, f] = L[tourI]; if (move && placed(f)) goTo(f);
    if (!tourEl) {
      tourEl = el('div', 'mp'); tourEl.id = 'memo-tour'; wire(tourEl);
      tourEl.addEventListener('keydown', (e) => { if (e.target.matches('input,textarea')) e.stopPropagation(); });
      tourEl.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; if (t === 'end') endTour(); else step(t === 'next' ? 1 : -1); });
    }
    const a = document.activeElement; if (tourEl.contains(a) && a.matches('input') && a.value) return;
    tourEl.innerHTML = '<div class="sm" style="margin-bottom:6px;font-weight:800">▶ 이야기 순서 ' + (tourI + 1) + ' / ' + L.length + (S.length ? ' · ' + esc(S[secOf(f, S)]) : '') + (placed(f) ? '' : ' · 📍 장소 없는 카드') + '</div>' + cardHTML(id, f, tourI + 1, { noGo: true })
      + '<div class="row"><button class="sub" data-t="end">✕ 그만</button><button class="sub" data-t="prev"' + (tourI ? '' : ' disabled style="opacity:.4"') + '>◀ 이전 (B)</button><button data-t="next">' + (tourI < L.length - 1 ? '다음 ▶ (N)' : '🏁 끝') + '</button></div>';
  }
  function step(d) { const n = ordered().length; if (tourI + d >= n) { endTour(); toast('🏁 마지막 카드까지 봤어요', 2); return; } tourI = Math.max(0, tourI + d); showTour(true); }
  function endTour() { if (tourEl) tourEl.remove(); tourEl = null; tourI = -1; }

  // ───────── 📤 정리 ─────────
  function summaryText() {
    const L = ordered(), S = secs(), out = ['# 메타버스 메모장 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 카드 ' + L.length + '개(깃발 ' + L.filter(([, f]) => placed(f)).length + ') · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 · 번호 = 이야기 순서 · 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    let cur = -1;
    L.forEach(([, f], i) => {
      const K = KBY[f.k] || KINDS[0], s = secOf(f, S);
      if (S.length && s !== cur) { cur = s; out.push('## ' + (s + 1) + '. ' + S[s]); }
      const lk = f.lk ? Object.keys(f.lk).length : 0;
      out.push((i + 1) + '. ' + K.e + ' ' + K.n + ' — ' + (placed(f) ? '📍 ' + f.zone + (f.near ? ' · ' + f.near + ' 근처' : '') + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' : '📍 장소 없음') + ' · ✍️ ' + f.by + (lk ? ' · ❤️ ' + lk : ''));
      if (f.who) out.push('   누구: ' + f.who); out.push('   ' + String(f.tx).replace(/\n/g, '\n   ')); if (f.opt) out.push('   보기:\n   ' + String(f.opt).replace(/\n/g, '\n   '));
      if (f.re) for (const r of Object.values(f.re).filter((r) => r && r.tx).sort((a, b) => (a.t || 0) - (b.t || 0))) out.push('   💬 ' + r.by + ': ' + r.tx);
    });
    return out.filter((x, i) => x !== '' || i > 3).join('\n');
  }
  function summary() {
    const P = open('memo-sum'), txt = summaryText();
    P.innerHTML = '<h3>📤 정리 — Claude에게 넘길 글</h3><div class="sm">선생님: 아래 글을 복사해 Claude에게 붙여 넣거나, 판 번호만 알려 줘도 돼요(Claude가 바로 읽어요).</div><pre></pre><div class="row"><button class="sub" id="mmB">◀ 판 보기</button><button id="mmCp">📋 복사하기</button></div>';
    P.querySelector('pre').textContent = txt;
    P.querySelector('#mmB').onclick = boardView;
    P.querySelector('#mmCp').onclick = async () => { try { await navigator.clipboard.writeText(txt); toast('📋 복사했어요', 2); } catch (e) { toast('복사가 막혔어요 — 글을 직접 골라 복사해 주세요', 3); } };
  }

  // ───────── 입력 · 칩 ─────────
  const cross = el('div', ''); cross.id = 'memo-x';
  function chips() {
    map.hud.chip('memo-f', placing ? '📍 여기에 꽂기 (F) · Esc 취소' : '🚩 깃발 꽂기 (F)', { onClick: () => { if (panel) return; if (placing) placeHere(); else form(); } });
    map.hud.chip('memo-l', '🧱 판 보기 (L)', { onClick: () => { if (!panel) boardView(); } });
    map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) { endTour(); pickBoard(); } } });
    map.minimap.show();
  }
  const onKey = (e) => {
    if (!board || panel || e.repeat) return;
    if (e.code === 'KeyF') { e.preventDefault(); if (placing) placeHere(); else form(); }
    else if (e.code === 'KeyL') { e.preventDefault(); boardView(); }
    else if (tourEl && e.code === 'KeyN') { e.preventDefault(); step(1); }
    else if (tourEl && e.code === 'KeyB') { e.preventDefault(); step(-1); }
  };
  addEventListener('keydown', onKey);
  pickBoard();

  return {
    tick() {},
    stop() { dead = true; clearTimeout(syncT); if (es) es.close(); if (esB) esB.close(); removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); for (const id of [...FL.keys()]) drop3d(id); ui.remove(); css.remove(); },
    get board() { return board; }, get flags() { return ordered().map(([id, f]) => ({ id, ...f })); }, summary: () => board ? summaryText() : '',
    place: () => form(), view: boardView, tour: startTour, moveTo: (id, sec, before) => moveTo(id, sec, before),
    enter: (id, info) => { name = name || '시험'; board = { id, ...info }; listen(); chips(); },
  };
}
