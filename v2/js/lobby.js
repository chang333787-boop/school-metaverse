// 함께하기 방(LOBBY-1 · 10-03 교사 '최소 선생님이 방 파고 코드 입력해서 들어오는 것 · 방 목록'): 주소만으로는 아무도 섞이지 않는다.
//   선생님(🔒 4자리 — 메모장과 같은 비밀번호) = 방 만들기 → 방 이름 + 4자리 번호(화면에 크게) · 아이 = 👥 함께하기 → 열린 방 목록에서 고르기 → 번호 넣기
//   Firebase(metaverse): lobby/<rid>{n 이름, e 끝나는 시각, t, x/<열쇠>=닫힘} = 목록(번호 없음) · codes/<번호>{r rid, e, t} = 번호 → 방(목록으로는 못 읽음) · keys/<rid> = 닫기 열쇠(읽기 막힘)
//   위치 방 = rooms/c<번호><suffix>(학교 '' · 마법사 마을 'w') — DB 규칙이 살아 있는 번호의 방만 받는다. 8시간 뒤 저절로 끝 · 20초마다 닫힘 확인 · 새로고침하면 다시 들어감(localStorage mp.room)
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const HOURS = 8;
const CSS = `
.lb-pop{position:fixed;z-index:46;width:min(340px,92vw);max-height:80vh;overflow:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:14px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.3);font:14px/1.5 "Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;box-sizing:border-box}
.lb-pop h4{margin:0 0 6px;font-size:16px}
.lb-pop .sm{color:#5a6b80;font-size:13px}
.lb-pop button{font:inherit;font-weight:800;border:0;border-radius:9px;padding:7px 11px;background:#1d3557;color:#fff;cursor:pointer}
.lb-pop button.sub{background:#e8edf3;color:#1d3557}
.lb-pop button.warn{background:#ffe3e3;color:#c92a2a}
.lb-pop .rooms{display:grid;gap:6px;margin:8px 0}
.lb-pop .rooms button{text-align:left;background:#eef4ff;color:#1d3557;border:2px solid #c9d8f0}
.lb-pop .rooms button.on{border-color:#1d3557;background:#fff3bf}
.lb-pop input{font:inherit;font-size:16px;border:2px solid #c9d3df;border-radius:9px;padding:7px 9px;box-sizing:border-box;width:100%;color:#1d3557;background:#fff}
.lb-pop .row{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}
.lb-pop .box{margin:6px 0;padding:6px 8px;background:#eef4ff;border-radius:8px}
.lb-big{position:fixed;inset:0;z-index:47;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.lb-big>div{background:#fffdf6;color:#1d3557;border:4px solid #1d3557;border-radius:22px;padding:22px 34px;text-align:center;max-width:92vw}
.lb-big .code{font-size:clamp(72px,16vw,150px);font-weight:900;letter-spacing:.12em;line-height:1.1;margin:6px 0}
.lb-big button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:9px 16px;background:#1d3557;color:#fff;cursor:pointer;margin-top:10px}
`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const req = (path, method = 'GET', data) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data) }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
const rand = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
const hash = async (pin) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mv-memo:' + pin)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* */ } } };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* */ } } };

// 선생님 비밀번호(메모장과 같은 memoPin) — 이 탭에서 한 번 맞히면 sessionStorage sm.t
export async function teacherPin(toast) {
  if (ss.get('sm.t') === '1') return true;
  let saved = null; try { saved = await req('/memoPin'); } catch (e) { toast('인터넷을 확인해 주세요'); return false; }
  if (!saved) {
    const a = prompt('선생님 비밀번호(숫자 4자리)를 새로 정해 주세요'); if (!a) return false; if (!/^\d{4}$/.test(a)) { toast('숫자 4자리로 정해 주세요'); return false; }
    if (prompt('한 번 더 적어 주세요') !== a) { toast('두 번이 달라요. 다시 해 주세요'); return false; }
    try { await req('/memoPin', 'PUT', await hash(a)); } catch (e) { toast('저장하지 못했어요'); return false; }
  } else {
    const a = prompt('선생님 비밀번호 4자리'); if (!a) return false;
    if (await hash(a) !== saved) { toast('비밀번호가 달라요'); return false; }
  }
  ss.set('sm.t', '1'); return true;
}

export function createLobby(o) {
  const { chip, suffix = '', label = '', join, leave, net, toast = () => {}, onTeacher = null, onGoTo = null } = o;
  if (!document.getElementById('lb-css')) { const st = document.createElement('style'); st.id = 'lb-css'; st.textContent = CSS; document.head.appendChild(st); }
  let cur = null, pop = null, big = null, pollT = 0;
  const live = (p) => p && typeof p.e === 'number' && p.e > Date.now();
  async function check(c, r) {   // 번호가 살아 있고(8시간 안) 그 방이 닫히지 않았는지
    const p = await req('/codes/' + c); if (!live(p) || (r && p.r !== r)) return null;
    const x = await req('/lobby/' + p.r + '/x'); return x ? null : p;
  }
  function draw() {
    const N = net();
    chip.textContent = cur && N ? '👥 ' + cur.n + ' · ' + N.count + '명 · ' + N.name : '👥 함께하기 (방 들어가기)';
  }
  function enter(info, quiet) {
    cur = info; ls.set('mp.room', JSON.stringify(info)); join('c' + info.c + suffix, info); draw();
    clearInterval(pollT); pollT = setInterval(recheck, 20000);
    if (!quiet) toast('👥 「' + info.n + '」 방에 들어왔어요 — 친구들이 이름표와 함께 보여요', 3);
    dispatchEvent(new CustomEvent('sm-room', { detail: info }));
  }
  async function recheck() { if (!cur) return; try { if (!(await check(cur.c, cur.r))) out(cur.k ? '🚪 방이 끝났어요' : '🚪 선생님이 방을 닫았어요'); } catch (e) { /* 잠깐 끊김은 그대로 */ } }
  function out(msg) { clearInterval(pollT); if (cur) leave(); cur = null; ls.set('mp.room', null); draw(); closePop(); if (msg) toast(msg, 3); dispatchEvent(new CustomEvent('sm-room', { detail: null })); }
  const closePop = () => { if (pop) pop.remove(); pop = null; };
  function place(p) {
    const r = chip.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
    p.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.bottom + 6)) + 'px';
  }
  function popup(html) {
    closePop(); document.exitPointerLock?.();
    pop = document.createElement('div'); pop.className = 'lb-pop ttl-keep'; /* ttl-keep = 오프닝 화면(놀이 카드) 위에서도 보임 */ pop.innerHTML = html;
    for (const t of ['keydown', 'keyup']) pop.addEventListener(t, (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(pop); place(pop); return pop;
  }
  function showBig() {
    if (!cur) return; if (big) big.remove();
    big = document.createElement('div'); big.className = 'lb-big ttl-keep';
    big.innerHTML = '<div><div style="font-size:20px;font-weight:800">🏫 ' + esc(cur.n) + '</div><div class="sm" style="font-size:16px;color:#5a6b80">방 번호</div><div class="code">' + cur.c + '</div>'
      + '<div style="font-size:17px">왼쪽 위 <b>👥 함께하기</b> → 「' + esc(cur.n) + '」 고르기 → 번호 넣기</div><button>닫기</button></div>';
    big.querySelector('button').onclick = () => { big.remove(); big = null; };
    for (const t of ['keydown', 'keyup']) big.addEventListener(t, (e) => { e.stopPropagation(); if (e.key === 'Escape' && big) { big.remove(); big = null; } });
    document.body.appendChild(big); document.exitPointerLock?.();
  }
  async function create() {
    if (!(await teacherPin(toast))) return;
    const n = prompt('방 이름(아이들 목록에 보여요)', '우리 반'); if (n == null) return;
    const name = (n.trim() || '우리 반').replace(/[<>]/g, '').slice(0, 20), rid = rand(10), k = rand(24), e = Date.now() + HOURS * 3600e3;
    try {
      let c = null;
      for (let i = 0; i < 25 && !c; i++) { const t = String(1000 + Math.floor(Math.random() * 9000)); if (!live(await req('/codes/' + t))) c = t; }
      if (!c) return toast('번호를 만들지 못했어요 — 다시 해 주세요');
      await req('/keys/' + rid, 'PUT', k);
      await req('/lobby/' + rid, 'PUT', { n: name, e, t: { '.sv': 'timestamp' } });
      await req('/codes/' + c, 'PUT', { r: rid, e, t: { '.sv': 'timestamp' } });
      closePop(); if (cur) out(); enter({ c, r: rid, n: name, e, k }); const M = net(); if (M) M.setName('선생님'); showBig();
      req('/lobby').then((L) => { for (const id in L || {}) if (!live(L[id])) req('/lobby/' + id, 'DELETE').catch(() => {}); }).catch(() => {});   // 끝난 방 치우기
    } catch (er) { toast('방을 만들지 못했어요 — 인터넷을 확인해 주세요', 3); }
  }
  async function shut() {
    if (!cur || !cur.k || !confirm('「' + cur.n + '」 방을 닫을까요? 들어와 있는 친구들이 모두 나가요.')) return;
    try { await req('/lobby/' + cur.r + '/x/' + cur.k, 'PUT', true); } catch (e) { return toast('닫지 못했어요'); }
    out('🔒 방을 닫았어요');
  }
  async function openList() {
    const N = net();
    if (cur) {
      const others = N && N.peers ? N.peers() : [];
      const P = popup('<h4>👥 ' + esc(cur.n) + ' <span class="sm">· 방 번호 ' + cur.c + '</span></h4>'
        + '<div class="box">나: <b>' + esc(N ? N.name : '') + '</b><br>' + (others.length ? '친구 ' + others.length + '명' + (onGoTo ? ' <span class="sm">(누르면 그 친구 곁으로)</span>' : '') + '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">' + others.map((p, i) => onGoTo ? '<button class="sub" data-go="' + i + '" style="padding:4px 9px"><span style="color:' + p.color + '">●</span> ' + esc(p.label) + (p.act ? ' <span class="sm">' + esc(p.act) + '</span>' : '') + '</button>' : '<span style="padding:2px 6px"><span style="color:' + p.color + '">●</span> ' + esc(p.label) + (p.act ? ' <span class="sm">' + esc(p.act) + '</span>' : '') + '</span>').join('') + '</div>' : '<span class="sm">아직 들어온 친구가 없어요</span>') + '</div>'
        + '<div class="sm">• 걷기·뛰기 · 😀 인사는 서로 보여요<br>• 📝 메모장은 같은 판이면 장면·깃발을 함께 써요<br>• 💦 <b>물총 친구 대결</b>은 같은 방 친구들과 함께<br>• 이야기·방탈출 같은 놀이는 <b>각자 따로</b> 해요</div>'
        + (cur.k ? '<div style="margin-top:8px;font-weight:800">🧑‍🏫 선생님</div><div class="row" style="justify-content:flex-start;margin-top:4px">' + (onTeacher ? '<button data-l="gather" title="방 친구 모두를 내 곁으로">📣 모두 내 곁으로</button><button data-l="hold" title="모두 잠깐 멈추고 선생님 말씀 듣기">✋ 모두 멈춤</button><button class="sub" data-l="release">▶ 다시 움직여요</button><button class="sub" data-l="chatoff">💬 채팅 ' + (N && N.ctlData && N.ctlData.chat && N.ctlData.chat.off ? '켜기' : '끄기') + '</button><button class="sub" data-l="chatclr">🧹 채팅 지우기</button>' : '') + '<button class="sub" data-l="big">📺 번호 크게</button><button class="warn" data-l="shut">🔒 방 닫기</button></div>' : '')
        + '<div class="row"><button class="sub" data-l="name">✏️ 내 이름</button><button class="sub" data-l="out">🚪 방 나가기</button><button class="sub" data-l="x">닫기</button></div>');
      P.onclick = (e) => { e.stopPropagation(); const g = e.target.closest('[data-go]'); if (g && onGoTo) { closePop(); onGoTo(others[+g.dataset.go]); return; } const b = e.target.closest('[data-l]'); if (!b) return; const a = b.dataset.l;
        if (a === 'name') { const v = prompt('내 이름(별명)을 적어 주세요 — 친구들 화면에 보여요', N ? N.name : ''); if (v && N) N.setName(v); draw(); closePop(); }
        else if (a === 'out') out('👋 방에서 나왔어요'); else if (a === 'big') { closePop(); showBig(); } else if (a === 'shut') shut();
        else if ((a === 'gather' || a === 'hold' || a === 'release') && onTeacher) { closePop(); onTeacher(a); }
        else if (a === 'chatoff' && N) { const off = !(N.ctlData && N.ctlData.chat && N.ctlData.chat.off); N.ctl('chat', { off }); toast(off ? '💬 채팅을 껐어요' : '💬 채팅을 켰어요', 2); closePop(); }
        else if (a === 'chatclr' && N) { if (confirm('방 채팅을 모두 지울까요?')) { N.clearChat(); toast('🧹 채팅을 지웠어요', 2); } closePop(); } else closePop(); };
      return;
    }
    const P = popup('<h4>👥 함께하기</h4><div class="sm">선생님이 연 방을 고르고, 화면에 보이는 <b>번호 4자리</b>를 넣어요.</div><div class="rooms"><div class="sm">방을 찾는 중…</div></div>'
      + '<div class="pick" style="display:none"><div style="display:flex;gap:6px;margin-top:4px"><input class="nm" maxlength="8" placeholder="내 이름" style="flex:1"><input class="cd" maxlength="4" inputmode="numeric" placeholder="번호 4자리" style="width:110px"></div><div class="row"><button data-l="go">들어가기</button></div></div>'
      + '<div class="row"><button class="sub" data-l="new" title="선생님 비밀번호가 필요해요">🔒 선생님: 방 만들기</button><button class="sub" data-l="x">닫기</button></div>');
    let sel = null;
    const nm = P.querySelector('.nm'), cd = P.querySelector('.cd'); nm.value = ls.get('mp.name') || '';
    const go = async () => {
      const name = nm.value.trim().replace(/[<>]/g, '').slice(0, 8), c = cd.value.trim();
      if (!name) { toast('내 이름을 적어 주세요'); nm.focus(); return; }
      if (!/^\d{4}$/.test(c)) { toast('번호 4자리를 넣어 주세요'); cd.focus(); return; }
      let p = null; try { p = await check(c, sel.r); } catch (e) { return toast('인터넷을 확인해 주세요'); }
      if (!p) { toast('번호가 달라요 — 선생님 화면의 번호를 다시 봐요', 3); cd.select(); return; }
      ls.set('mp.name', name); closePop(); enter({ c, r: sel.r, n: sel.n, e: p.e });
      const M = net(); if (M) M.setName(name); draw();
    };
    cd.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) go(); });
    P.onclick = (e) => { e.stopPropagation(); const b = e.target.closest('[data-l],[data-r]'); if (!b) return;
      if (b.dataset.r) { sel = { r: b.dataset.r, n: b.dataset.n }; P.querySelectorAll('.rooms button').forEach((x) => x.classList.toggle('on', x === b)); P.querySelector('.pick').style.display = ''; place(P); (nm.value ? cd : nm).focus(); return; }
      const a = b.dataset.l; if (a === 'go') go(); else if (a === 'new') create(); else closePop(); };
    let L = {}; try { L = (await req('/lobby')) || {}; } catch (e) { P.querySelector('.rooms').innerHTML = '<div class="sm">방 목록을 불러오지 못했어요 — 인터넷을 확인해 주세요</div>'; return; }
    if (pop !== P) return;
    const ids = Object.keys(L).filter((id) => live(L[id]) && !L[id].x).sort((a, b) => (L[b].t || 0) - (L[a].t || 0));
    P.querySelector('.rooms').innerHTML = ids.length ? ids.map((id) => '<button data-r="' + esc(id) + '" data-n="' + esc(L[id].n) + '">🏫 ' + esc(L[id].n) + (L[id].t ? ' <span class="sm">· ' + new Date(L[id].t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) + ' 열림</span>' : '') + '</button>').join('')
      : '<div class="sm">아직 열린 방이 없어요 — 선생님이 방을 열면 여기에 보여요.</div>';
    place(P);
  }
  chip.addEventListener('click', (e) => { e.stopPropagation(); if (pop) closePop(); else openList(); });
  addEventListener('click', (e) => { if (pop && !pop.contains(e.target) && e.target !== chip) closePop(); });

  // 시작: ?code=1234 또는 지난번 방(아직 열려 있으면 조용히 다시)
  (async () => {
    const q = new URLSearchParams(location.search).get('code');
    let saved = null; try { saved = JSON.parse(ls.get('mp.room') || 'null'); } catch (e) { /* */ }
    try {
      if (q && /^\d{4}$/.test(q)) {
        const p = await check(q); if (!p) { toast('그 방 번호는 지금 열려 있지 않아요', 3); }
        else { const L = await req('/lobby/' + p.r); enter({ c: q, r: p.r, n: (L && L.n) || '우리 반', e: p.e, k: saved && saved.c === q ? saved.k : undefined }); return; }
      }
      if (saved && live(saved) && (await check(saved.c, saved.r))) enter(saved, true); else if (saved) ls.set('mp.room', null);
    } catch (e) { /* 오프라인 — 혼자 */ }
    draw();
  })();
  draw();
  return { draw, recheck, get room() { return cur; }, open: openList, leave: () => out(), teacher: (k, extra, quiet) => { if (onTeacher && cur && cur.k) onTeacher(k, extra, quiet); } };
}
