// 메타버스 메모장(MEMO-1 · 10-03 교사 '운동장 어디에 깃발을 꽂고 여기에 뭐가 필요해요 — 저장하면 내가 보고 Claude에게 만들라고') — RPG 생각판의 메타버스판.
//   판(주제) 고르기 → 학교를 걸으며 화면 가운데가 가리키는 곳에 🚩 깃발(F) → 종류·글 → 저장(Firebase class-rpg · metaverse/boards) · 같은 판 친구들 깃발이 바로 보임
//   📋 목록(L): 순서 바꾸기·가 보기·고치기·지우기 · 📤 정리: Claude에게 넘길 글(장소 이름·좌표·쓴 사람 · 아이가 쓴 글만 — 빈칸은 비워 둠)
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
const CSS = `
#memo-ui{position:fixed;inset:0;pointer-events:none;z-index:41;font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;color:#1d3557}
#memo-ui .mp{pointer-events:auto;position:absolute;background:#fffdf6;border:3px solid #1d3557;border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,.3)}
#memo-ui button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:8px 13px;font-weight:800;background:#1d3557;color:#fff}
#memo-ui button.sub{background:#e8edf3;color:#1d3557}
#memo-ui button.warn{background:#ffe3e3;color:#c92a2a}
#memo-ui input,#memo-ui textarea{font:inherit;font-size:16px;border:2px solid #c9d3df;border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box}
#memo-ui textarea{min-height:76px;resize:vertical}
#memo-ui h3{margin:0 0 8px;font-size:19px}
#memo-ui .sm{font-size:13px;color:#5a6b80}
#memo-pick,#memo-form,#memo-list,#memo-sum,#memo-view{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:88vh;overflow:auto;padding:14px 16px}
#memo-pick .bd{display:grid;gap:8px;margin:10px 0}
#memo-pick .bd button{text-align:left;background:#eef4ff;color:#1d3557;padding:10px 12px;border:2px solid #c9d8f0}
#memo-pick .bd button small{display:block;font-weight:600;color:#5a6b80;margin-top:2px}
#memo-form .kinds{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
#memo-form .kinds button{background:#f1f3f5;color:#1d3557;padding:7px 10px;border:2px solid transparent}
#memo-form .kinds button.on{border-color:#1d3557;background:#fff3bf}
#memo-ui .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}
#memo-ui .where{font-weight:800;margin:4px 0 8px}
#memo-list ol{padding-left:0;list-style:none;margin:8px 0}
#memo-list li{display:flex;gap:6px;align-items:center;padding:7px 6px;border-bottom:1px solid #e8edf3}
#memo-list li .t{flex:1;min-width:0}
#memo-list li .t b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#memo-list li .t small{color:#5a6b80}
#memo-list li button{padding:5px 8px;font-size:13px}
#memo-sum pre{white-space:pre-wrap;font-size:13px;background:#f8f9fa;border-radius:10px;padding:10px;max-height:52vh;overflow:auto;font-family:inherit}
#memo-x{left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(29,53,87,.7);position:absolute}
#memo-x::after{content:'';position:absolute;left:8px;top:8px;width:2px;height:2px;background:#fff;border-radius:50%}
`;

export default async function start(map, params = {}) {
  const THREE = map.three;
  let dead = false, board = null, es = null, name = '';
  try { name = localStorage.getItem('mp.name') || ''; } catch (e) { /* */ }
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'memo-ui'; document.body.appendChild(ui);
  const el = (tag, cls, html, parent = ui) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
  const keyStop = (n) => { for (const t of ['keydown', 'keyup']) n.addEventListener(t, (e) => e.stopPropagation()); };
  let panel = null;
  const close = () => { if (panel) panel.remove(); panel = null; map.player.freeze(false); };
  const open = (id) => { close(); document.exitPointerLock?.(); map.player.freeze(true); panel = el('div', 'mp'); panel.id = id; keyStop(panel); return panel; };
  addEventListener('keydown', onEsc, true);
  function onEsc(e) { if (e.code === 'Escape' && panel && board) { e.stopPropagation(); close(); } }

  // ───────── 판 고르기 ─────────
  let teacher = false;
  const hash = async (pin) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mv-memo:' + pin)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  async function teacherLogin() {
    let saved = null; try { saved = await req('/memoPin'); } catch (e) { return map.hud.toast('인터넷을 확인해 주세요', 2); }
    if (!saved) {
      const a = prompt('선생님 비밀번호(숫자 4자리)를 새로 정해 주세요'); if (!a) return; if (!/^\d{4}$/.test(a)) return map.hud.toast('숫자 4자리로 정해 주세요', 2.5);
      if (prompt('한 번 더 적어 주세요') !== a) return map.hud.toast('두 번이 달라요. 다시 해 주세요', 2.5);
      try { await req('/memoPin', 'PUT', await hash(a)); } catch (e) { return map.hud.toast('저장하지 못했어요', 2); }
      teacher = true; map.hud.toast('🔒 비밀번호를 정했어요 — 선생님 모드', 2.5); return pickBoard();
    }
    const a = prompt('선생님 비밀번호 4자리'); if (!a) return;
    if (await hash(a) !== saved) return map.hud.toast('비밀번호가 달라요', 2);
    teacher = true; map.hud.toast('🔓 선생님 모드', 2); pickBoard();
  }
  async function pickBoard() {
    const P = open('memo-pick');
    P.innerHTML = '<h3>📝 메타버스 메모장' + (teacher ? ' <span class="sm">· 🔓 선생님 모드</span>' : '') + '</h3><div class="sm">학교를 걸어 다니며 깃발을 꽂고, 그곳에 무엇이 필요한지 적어요. 같은 판을 고른 친구들의 깃발도 바로 보여요.</div>'
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
        const ed = el('button', 'sub', '✏️', row); ed.title = '제목·질문 바꾸기'; ed.onclick = async () => { const t = prompt('판 제목', L.t); if (t == null) return; const q = prompt('판 질문(아이들에게 보여요)', L.p || ''); if (q == null) return;
          try { await req('/boardList/' + id, 'PATCH', { t: (t.trim() || L.t).slice(0, 40), p: q.trim().slice(0, 120) }); } catch (e) { return map.hud.toast('바꾸지 못했어요', 2); } pickBoard(); };
        const lk = el('button', 'sub', L.lock ? '🔓' : '🔒', row); lk.title = L.lock ? '잠금 풀기' : '잠그기(아이들은 보기만)'; lk.onclick = async () => { try { await req('/boardList/' + id + '/lock', 'PUT', !L.lock); } catch (e) { return; } pickBoard(); };
        const cl = el('button', 'warn', '🧹', row); cl.title = '깃발 모두 지우기'; cl.onclick = async () => { if (!confirm('「' + L.t + '」의 깃발을 모두 지울까요? 되돌릴 수 없어요.')) return;
          try { const f = (await fetch(DB + '/boards/' + id + '/flags.json?shallow=true').then((r) => r.json())) || {}; await Promise.all(Object.keys(f).map((k) => req('/boards/' + id + '/flags/' + k, 'DELETE'))); map.hud.toast('🧹 비웠어요', 2); } catch (e) { map.hud.toast('지우지 못했어요', 2); } };
      }
    }
    if (params.board && list[params.board]) enter(params.board, list[params.board]);
  }
  function enter(id, info) {
    const P = panel; const nm = P && P.querySelector('#mmName'); const v = nm ? nm.value.trim().replace(/[<>]/g, '').slice(0, 8) : '';
    if (!v) { map.hud.toast('먼저 내 이름을 적어 주세요', 2.2); if (nm) nm.focus(); return; }
    name = v; try { localStorage.setItem('mp.name', name); } catch (e) { /* */ }
    board = { id, ...info }; close(); listen(); chips();
    map.hud.toast('📌 「' + board.t + '」 — 가리키는 곳을 보고 F(🚩)로 깃발을 꽂아요', 4);
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
  const short = (s, n = 11) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
  function draw(id, f) {
    let F = FL.get(id);
    if (F) { map.remove(F.g); F.tag.material.map.dispose(); F.tag.material.dispose(); if (F.hot) F.hot.remove(); }
    if (!f) { FL.delete(id); refresh(); return; }
    const K = KBY[f.k] || KINDS[0], g = new THREE.Group(); g.position.set(f.x, f.y || 0, f.z);
    g.add(new THREE.Mesh(poleG, lam(0xf1f3f5))); const cl = new THREE.Mesh(clothG, lam(K.c)); g.add(cl);
    const tg = tag(K.e + ' ' + (short(f.tx) || K.n)); tg.position.y = 2.55; g.add(tg);
    map.add(g);
    F = { g, cl, tag: tg, f, hot: map.interact.add({ x: f.x, y: f.y || 0, z: f.z, r: 1.6, label: K.e + ' 깃발 보기', use: () => view(id) }) };
    FL.set(id, F); refresh();
  }
  const ordered = () => [...FL.entries()].sort((a, b) => (a[1].f.ord || 0) - (b[1].f.ord || 0) || (a[1].f.t || 0) - (b[1].f.t || 0));
  function refresh() {
    const L = ordered(); L.forEach(([, F], i) => { F.num = i + 1; });
    if (board) map.hud.chip('memo-b', '📌 ' + short(board.t, 14) + ' · 🚩 ' + L.length + '개');
    map.minimap.setMarks(L.map(([, F]) => ({ x: F.f.x, z: F.f.z, color: '#' + (KBY[F.f.k] || KINDS[0]).c.toString(16).padStart(6, '0'), label: String(F.num), floor: (F.f.y || 0) > 2.5 ? 2 : 1 })));
    if (panel && panel.id === 'memo-list') list();
  }

  // ───────── 실시간 받기 ─────────
  function listen() {
    if (es) es.close();
    for (const id of [...FL.keys()]) draw(id, null);
    es = new EventSource(DB + '/boards/' + board.id + '/flags.json');
    const on = (type) => (e) => {
      let m; try { m = JSON.parse(e.data); } catch (er) { return; }
      const path = (m.path || '/').split('/').filter(Boolean), d = m.data;
      if (!path.length) { if (type === 'put') for (const id of [...FL.keys()]) if (!d || !d[id]) draw(id, null); if (d) for (const id in d) if (d[id]) draw(id, type === 'patch' && FL.get(id) ? { ...FL.get(id).f, ...d[id] } : d[id]); }
      else if (path.length === 1) draw(path[0], d === null ? null : type === 'patch' && FL.get(path[0]) ? { ...FL.get(path[0]).f, ...d } : d);
      else { const F = FL.get(path[0]); if (F) draw(path[0], { ...F.f, [path[1]]: d }); }
    };
    es.addEventListener('put', on('put')); es.addEventListener('patch', on('patch'));
  }

  // ───────── 꽂기 ─────────
  const _f = new THREE.Vector3(), cam = map.camera;
  function aimPoint() {
    _f.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const o = cam.position, me = map.player.get(), D = 30;
    const t0 = Math.max(0, (me.x - o.x) * _f.x + (me.y + 1 - o.y) * _f.y + (me.z - o.z) * _f.z) + 0.4;
    const a = [o.x + _f.x * t0, o.y + _f.y * t0, o.z + _f.z * t0], b = [o.x + _f.x * D, o.y + _f.y * D, o.z + _f.z * D];
    let r = map.q.ray(a, b);
    if (r === null) for (let k = 1; k <= 60; k++) { const t = k / 60, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t, g = map.q.groundAt(x, z, y + 0.5); if (g != null && y <= g + 0.05) { r = t; break; } }
    if (r === null) return { x: me.x, y: me.y, z: me.z, feet: true };
    const x = a[0] + (b[0] - a[0]) * r, y = a[1] + (b[1] - a[1]) * r, z = a[2] + (b[2] - a[2]) * r, g = map.q.groundAt(x, z, y + 0.3);
    return { x: +x.toFixed(2), y: +(g != null && Math.abs(g - y) < 0.6 ? g : y).toFixed(2), z: +z.toFixed(2) };
  }
  function placeName(x, y, z) {
    const zn = map.zoneAt(x, y + 0.2, z) || map.zoneAt(x, y, z);
    let near = '', bd = 12;
    for (const p of map.pois({ src: 'landmark' })) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd && Math.abs((p.y || 0) - y) < 3) { bd = d; near = p.label; } }
    return { zone: zn ? zn.label : '학교 바깥', near };
  }
  async function form(id) {
    if (!board) return;
    const aim = id ? null : aimPoint();
    if (!teacher) { try { board.lock = await req('/boardList/' + board.id + '/lock'); } catch (e) { /* */ } if (board.lock) return map.hud.toast('🔒 선생님이 잠근 판이에요 — 보기만 할 수 있어요', 3); }
    if (id && !teacher && FL.get(id).f.by !== name) return map.hud.toast('✍️ ' + FL.get(id).f.by + '의 깃발이에요 — 내 깃발만 고칠 수 있어요', 3);
    const old = id ? FL.get(id).f : null, pt = old ? { x: old.x, y: old.y, z: old.z } : aim, pn = old ? { zone: old.zone, near: old.near } : placeName(pt.x, pt.y, pt.z);
    if (!old) { const pv = map.mk.marker(pt.x, pt.y + 0.3, pt.z, { color: 0xffd43b }); setTimeout(() => pv.remove(), 2500); }
    const P = open('memo-form'); let kind = old ? old.k : 'memo';
    P.innerHTML = '<h3>' + (old ? '✏️ 깃발 고치기' : '🚩 여기에 깃발 꽂기') + '</h3><div class="where">📍 ' + esc(pn.zone) + (pn.near ? ' · ' + esc(pn.near) + ' 근처' : '') + (pt.feet ? ' <span class="sm">(내 발밑)</span>' : '') + '</div>'
      + '<div class="kinds"></div><div class="sm" id="mmQ"></div><textarea id="mmTx" maxlength="300"></textarea>'
      + '<div id="mmWho" style="display:none;margin-top:6px"><input id="mmWhoIn" maxlength="30" placeholder="누구? (예: 사서선생님 · 새 역할: 길 잃은 고양이)"></div>'
      + '<div id="mmOpt" style="display:none;margin-top:6px"><textarea id="mmOptIn" maxlength="300" placeholder="보기를 한 줄에 하나씩&#10;예) 책을 찾는다 → 3번 깃발&#10;사서 선생님을 찾는다 → 5번 깃발"></textarea></div>'
      + '<div class="row">' + (old ? '<button class="warn" id="mmDel">🗑 지우기</button>' : '') + '<button class="sub" id="mmNo">취소</button><button id="mmOk">💾 저장</button></div>';
    const kb = P.querySelector('.kinds');
    const paint = () => { [...kb.children].forEach((b, i) => b.classList.toggle('on', KINDS[i].k === kind)); P.querySelector('#mmQ').textContent = KBY[kind].q; P.querySelector('#mmWho').style.display = kind === 'who' || kind === 'say' ? '' : 'none'; P.querySelector('#mmOpt').style.display = kind === 'choice' ? '' : 'none'; };
    for (const K of KINDS) { const b = el('button', '', K.e + ' ' + K.n, kb); b.onclick = () => { kind = K.k; paint(); }; }
    if (old) { P.querySelector('#mmTx').value = old.tx || ''; P.querySelector('#mmWhoIn').value = old.who || ''; P.querySelector('#mmOptIn').value = old.opt || ''; }
    paint(); setTimeout(() => P.querySelector('#mmTx').focus(), 30);
    P.querySelector('#mmNo').onclick = close;
    if (old) P.querySelector('#mmDel').onclick = async () => { if (!confirm('이 깃발을 지울까요?')) return; try { await req('/boards/' + board.id + '/flags/' + id, 'DELETE'); } catch (e) { map.hud.toast('지우지 못했어요', 2); } close(); };
    P.querySelector('#mmOk').onclick = async () => {
      const tx = P.querySelector('#mmTx').value.trim(); if (!tx) return map.hud.toast('무엇을 적을지 써 주세요', 2);
      const c = cam.position;
      const f = { k: kind, tx: tx.slice(0, 300), by: old ? old.by : name, x: pt.x, y: pt.y || 0, z: pt.z, zone: String(pn.zone || '').slice(0, 40), near: String(pn.near || '').slice(0, 40), t: old ? old.t : { '.sv': 'timestamp' }, ord: old ? (old.ord || 0) : Date.now() };
      if (!old) f.cam = [c.x, c.y, c.z].map((v) => +v.toFixed(2));
      else if (old.cam) f.cam = old.cam;
      const who = P.querySelector('#mmWhoIn').value.trim(), opt = P.querySelector('#mmOptIn').value.trim();
      if ((kind === 'who' || kind === 'say') && who) f.who = who.slice(0, 30);
      if (kind === 'choice' && opt) f.opt = opt.slice(0, 300);
      const fid = id || 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      try { await req('/boards/' + board.id + '/flags/' + fid, 'PUT', f); map.sfx('ding'); map.hud.toast(old ? '✏️ 고쳤어요' : '🚩 깃발을 꽂았어요!', 2); } catch (e) { map.hud.toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 3); return; }
      close();
    };
  }
  function view(id) {
    const F = FL.get(id); if (!F) return; const f = F.f, K = KBY[f.k] || KINDS[0];
    const P = open('memo-view');
    P.innerHTML = '<h3>' + K.e + ' ' + F.num + '번 깃발 · ' + K.n + '</h3><div class="where">📍 ' + esc(f.zone) + (f.near ? ' · ' + esc(f.near) + ' 근처' : '') + '</div>'
      + (f.who ? '<div><b>🧑 ' + esc(f.who) + '</b></div>' : '') + '<div style="font-size:17px;line-height:1.6;white-space:pre-wrap">' + esc(f.tx) + '</div>'
      + (f.opt ? '<div style="margin-top:6px;white-space:pre-wrap;background:#ebfbee;border-radius:10px;padding:8px">' + esc(f.opt) + '</div>' : '')
      + '<div class="sm" style="margin-top:6px">✍️ ' + esc(f.by) + '</div><div class="row"><button class="sub" id="mmC">닫기</button><button id="mmE">✏️ 고치기</button></div>';
    P.querySelector('#mmC').onclick = close; P.querySelector('#mmE').onclick = () => form(id);
  }

  // ───────── 목록 · 정리 ─────────
  function list() {
    const P = panel && panel.id === 'memo-list' ? panel : open('memo-list'), L = ordered();
    P.innerHTML = '<h3>📋 「' + esc(board.t) + '」 깃발 ' + L.length + '개</h3>' + (board.p ? '<div class="sm">' + esc(board.p) + '</div>' : '') + '<ol></ol><div class="row"><button class="sub" id="mmC">닫기</button><button id="mmS">📤 정리 보기</button></div>';
    const ol = P.querySelector('ol');
    if (!L.length) ol.innerHTML = '<li class="sm">아직 깃발이 없어요. 학교를 걸으며 F(🚩)로 꽂아 봐요!</li>';
    L.forEach(([id, F], i) => {
      const f = F.f, K = KBY[f.k] || KINDS[0], li = el('li', '', '<span style="font-weight:900;width:22px">' + (i + 1) + '</span><div class="t"><b>' + K.e + ' ' + esc(short(f.tx, 28)) + '</b><small>📍 ' + esc(f.zone) + (f.near ? ' · ' + esc(f.near) : '') + ' · ✍️ ' + esc(f.by) + '</small></div>', ol);
      const bt = (t, fn, cls) => { const b = el('button', cls || 'sub', t, li); b.onclick = fn; };
      bt('⬆', () => swap(L, i, -1)); bt('⬇', () => swap(L, i, 1)); bt('🚶', () => { close(); const e = map.findEntry(f.x + 1.2, f.z + 1.2, f.y || 0, null, 3); map.player.teleport(e ? [e.x, e.y, e.z] : [f.x, f.y || 0, f.z]); map.player.lookAt([f.x, f.z]); }); bt('✏️', () => form(id));
    });
    P.querySelector('#mmC').onclick = close; P.querySelector('#mmS').onclick = summary;
  }
  async function swap(L, i, d) {
    const j = i + d; if (j < 0 || j >= L.length) return;
    const a = L[i], b = L[j], oa = a[1].f.ord || 0, ob = b[1].f.ord || 0, na = ob === oa ? ob + d : ob, nb = oa;
    try { await Promise.all([req('/boards/' + board.id + '/flags/' + a[0] + '/ord', 'PUT', na), req('/boards/' + board.id + '/flags/' + b[0] + '/ord', 'PUT', nb)]); } catch (e) { map.hud.toast('순서를 바꾸지 못했어요', 2); }
  }
  function summaryText() {
    const L = ordered(), out = ['# 메타버스 메모장 — ' + board.t, board.p ? '질문: ' + board.p : '', '판 id: ' + board.id + ' · 깃발 ' + L.length + '개 · ' + new Date().toLocaleString('ko-KR'), '(아이들이 쓴 글 그대로 — 비어 있는 칸은 아이들이 정하지 않은 것)', ''];
    L.forEach(([, F], i) => { const f = F.f, K = KBY[f.k] || KINDS[0];
      out.push((i + 1) + '. ' + K.e + ' ' + K.n + ' — 📍 ' + f.zone + (f.near ? ' · ' + f.near + ' 근처' : '') + ' (x ' + f.x + ', y ' + (f.y || 0) + ', z ' + f.z + ')' + ' · ✍️ ' + f.by);
      if (f.who) out.push('   누구: ' + f.who); out.push('   ' + String(f.tx).replace(/\n/g, '\n   ')); if (f.opt) out.push('   보기:\n   ' + String(f.opt).replace(/\n/g, '\n   ')); });
    return out.filter((x, i) => x !== '' || i > 3).join('\n');
  }
  function summary() {
    const P = open('memo-sum'), txt = summaryText();
    P.innerHTML = '<h3>📤 정리 — Claude에게 넘길 글</h3><div class="sm">선생님: 아래 글을 복사해 Claude에게 붙여 넣거나, 판 이름만 알려 줘도 돼요(Claude가 저장소에서 바로 읽어요).</div><pre></pre><div class="row"><button class="sub" id="mmB">◀ 목록</button><button id="mmCp">📋 복사하기</button></div>';
    P.querySelector('pre').textContent = txt;
    P.querySelector('#mmB').onclick = list;
    P.querySelector('#mmCp').onclick = async () => { try { await navigator.clipboard.writeText(txt); map.hud.toast('📋 복사했어요', 2); } catch (e) { map.hud.toast('복사가 막혔어요 — 글을 직접 골라 복사해 주세요', 3); } };
  }

  // ───────── 입력 · 칩 ─────────
  const cross = el('div', ''); cross.id = 'memo-x';
  function chips() {
    map.hud.chip('memo-f', '🚩 깃발 꽂기 (F)', { onClick: () => { if (!panel) form(); } });
    map.hud.chip('memo-l', '📋 목록 (L)', { onClick: () => { if (!panel) list(); } });
    map.hud.chip('memo-s', '🔁 판 바꾸기', { onClick: () => { if (!panel) pickBoard(); } });
    map.minimap.show();
  }
  const onKey = (e) => {
    if (!board || panel || e.repeat) return;
    if (e.code === 'KeyF') { e.preventDefault(); form(); }
    else if (e.code === 'KeyL') { e.preventDefault(); list(); }
  };
  addEventListener('keydown', onKey);
  pickBoard();

  return {
    tick() {},
    stop() { dead = true; if (es) es.close(); removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); ui.remove(); css.remove(); for (const id of [...FL.keys()]) { const F = FL.get(id); F.tag.material.map.dispose(); F.tag.material.dispose(); } },
    get board() { return board; }, get flags() { return ordered().map(([id, F]) => ({ id, ...F.f })); }, summary: () => board ? summaryText() : '',
    place: () => form(), enter: (id, info) => { name = name || '시험'; board = { id, ...info }; listen(); chips(); },
  };
}
