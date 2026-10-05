// 경기 순위표(RANK-1 · 10-05 교사 '여러 판에 걸쳐서 하는 것들은 그 판 안에서 순위 비교할 수 있게 — 숨바꼭질이면 잡힌 것·안 잡힌 것·잡혔을 때 몇 초·돌아가면서 하는지')
//   여러 판짜리 친구 대결(🙈 숨바꼭질 · 🤖 로봇인 척 · 🧭 길잡이)이 같이 쓰는 틀 — 무엇을 셀지(줄·점수·칸·차례)는 놀이가 정하고, 여기는 순위 매기기·보여 주기·새로고침 이어 가기만
//   · 기록 = 화면마다 서버 순서 사건으로 같은 값을 셈(DB·규칙 그대로) · 판마다 한 번만(seq)
//   · 📊 칩 = 내 순위(누르기 · B = 순위표 창 · 다시 B·✕·Esc = 닫기) · 판 결과 카드 = 한 줄(strip — ▲▼ = 이번 판에 오르내린 칸) · 끝 = 🥇🥈🥉 카드 + 대기실에 지난 경기 표
//   · 새로고침해도 이어짐: sessionStorage 'sm.rank.<id>' = { k: '방#경기 번호'(m.seq − m.goal — 판이 넘어가도 그대로), rows, seen, … }
//   · 늦게 들어온 화면은 들어온 뒤의 판만 셈 → 표 밑에 'n판부터 본 기록'
//   o = { id, title, rule(한 줄 점수 풀이), init() → 새 줄, pts(줄) → 점수, cols: [{ h, f(줄) → html }] 또는 () => 그 배열, tie(a, b)(같은 점수일 때 · 음수 = a 먼저),
//         me() → 내 줄 id, meTag('나'), turns() → 차례 줄 html, foot(줄 목록, x) → 상 줄 html, unit('점') }
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MED = ['🥇', '🥈', '🥉'];
export const medal = (k) => MED[k - 1] || k + '등';

let cssOn = false;
function addCss() {
  if (cssOn) return; cssOn = true;
  const st = document.createElement('style'); st.textContent = `
.rk-pan{position:fixed;right:12px;top:50%;transform:translateY(-50%);z-index:39;width:min(400px,94vw);max-height:80vh;overflow:auto;box-sizing:border-box;padding:12px 14px;border-radius:16px;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;box-shadow:0 8px 28px rgba(0,0,0,.35);font:600 14px/1.4 system-ui,-apple-system,"Malgun Gothic",sans-serif;pointer-events:auto}
.rk-pan .rk-x{position:absolute;right:8px;top:6px;width:36px;height:36px;border:0;border-radius:10px;background:#e8edf3;color:#1d3557;font:800 18px/1 system-ui,sans-serif;cursor:pointer}
.rk-hd{font-weight:900;font-size:17px;padding-right:40px}
.rk-sub{margin-top:3px;font-size:13px;color:#4a5b70}
.rk-t{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}
.rk-t th{font-size:12px;color:#5a6b80;font-weight:800;text-align:left;padding:3px 4px;border-bottom:2px solid #d5deea;white-space:nowrap}
.rk-t td{padding:5px 4px;border-bottom:1px solid #e8edf3;vertical-align:middle}
.rk-t td.k{white-space:nowrap;font-weight:900;width:2.6em}
.rk-t td.p,.rk-t th.p{text-align:right;font-weight:900;white-space:nowrap}
.rk-t td.c{font-size:13px}
.rk-t tr.me td{background:#fff3bf}
.rk-t tr.top1 td.p{color:#c2410c}
.rk-up{color:#2f9e44;font-size:12px;font-weight:900;white-space:nowrap}
.rk-dn{color:#e03131;font-size:12px;font-weight:900;white-space:nowrap}
.rk-rule{margin-top:7px;padding:6px 8px;border-radius:9px;background:#eef4ff;font-size:12px;color:#1d3557}
.rk-note{margin-top:5px;font-size:12px;color:#5a6b80}
.rk-aw{margin-top:7px;font-size:13px}
.rk-lb{margin-top:8px;padding:7px 9px;border-radius:9px;background:#fff8dc;border:2px solid #f2d27a}
.rk-lb .rk-t{font-size:13px;margin-top:4px}
.rk-strip .rk-up{color:#8ce99a}.rk-strip .rk-dn{color:#ffa8a8}
`; document.head.appendChild(st);
}

export function createStandings(map, o) {
  addCss();
  const KEY = 'sm.rank.' + o.id, unit = o.unit || '점', meTag = o.meTag || '나';
  const blank = (k) => ({ k, rows: {}, seen: [], from: null, prev: {}, x: {}, n: 0, fin: false });
  let S = blank(null), pan = null, live = false, chipT = '', painT = 0;
  const ssGet = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 사생활 창 · 꽉 참 = 이 화면에서만 */ } };
  const cols = () => (typeof o.cols === 'function' ? o.cols() : o.cols) || [];

  // 순위: 점수 → 놀이가 정한 동점 풀기 → 이름(보여 주는 차례만 — 순위는 같음 = 공동)
  function ranked() {
    const me = o.me ? o.me() : null;
    const L = Object.keys(S.rows).map((id) => ({ id, r: S.rows[id], p: o.pts(S.rows[id]) }));
    const tie = (a, b) => (o.tie ? o.tie(a.r, b.r) : 0);
    L.sort((a, b) => b.p - a.p || tie(a, b) || String(a.r.n).localeCompare(String(b.r.n)));
    L.forEach((q, i) => { q.k = i && q.p === L[i - 1].p && !tie(L[i - 1], q) ? L[i - 1].k : i + 1; });
    for (const q of L) { q.co = L.some((z) => z !== q && z.k === q.k); q.me = q.id === me; const pr = S.prev[q.id]; q.up = pr ? pr - q.k : 0; }
    return L;
  }
  const rankMap = () => { const m = {}; for (const q of ranked()) m[q.id] = q.k; return m; };
  const arrow = (q) => (q.up > 0 ? ' <span class="rk-up">▲' + q.up + '</span>' : q.up < 0 ? ' <span class="rk-dn">▼' + -q.up + '</span>' : '');
  const nameOf = (q) => esc(q.r.n) + (q.me ? ' <b>(' + meTag + ')</b>' : '');

  // 새 경기(또는 새로고침 뒤 같은 경기면 이어서)
  function start(k) {
    if (S.k !== k) { const s = ssGet(); S = s && s.k === k && !s.fin ? s : blank(k); }
    live = true; paint();
  }
  // 대기실에서 새로고침했을 때: 같은 경기(k)의 끝난 표가 이 탭에 있으면 그 표(없으면 '')
  function last(k) { const s = ssGet(); if (!s || s.k !== k || !s.fin || !s.n) return ''; if (!live) S = s; return lobby(); }
  function row(id, n) {
    let r = S.rows[id]; if (!r) r = S.rows[id] = Object.assign(o.init(), { n: '', id });
    if (n) r.n = String(n).slice(0, 12); return r;
  }
  // 판 하나 적기 — 같은 판(seq)은 한 번만 · fn(row, x) 안에서 줄을 고친다 · x = 놀이 마음대로 쓰는 덤(같이 저장)
  function round(seq, idx, fn) {
    if (S.seen.includes(seq)) return false;
    S.prev = rankMap(); fn(row, S.x); S.seen.push(seq); S.n++; if (S.from == null) S.from = idx || 0;
    save(); paint(); return true;
  }

  // 판 결과 카드 한 줄(어두운 카드 위) — 앞 max명 + 내가 밖이면 내 자리
  function strip(max = 6) {
    const L = ranked(); if (!L.length) return '';
    const one = (q) => medal(q.k) + ' ' + (q.me ? '<b style="color:#ffd23c">' + esc(q.r.n) + '</b>' : esc(q.r.n)) + ' ' + q.p + arrow(q);
    const mine = L.find((q) => q.me), head = L.slice(0, max);
    return '<div class="rk-strip" style="margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.25);font-size:.84em">📊 ' + (S.n > 1 ? S.n + '판 합계' : '순위') + ' — '
      + head.map(one).join(' · ') + (L.length > max ? ' …' : '') + (mine && !head.includes(mine) ? ' · ' + one(mine) : '') + '</div>';
  }
  // 표(밝은 바탕 — 순위표 창·대기실)
  function table() {
    const L = ranked(), C = cols();
    let h = '<table class="rk-t"><tr><th>순위</th><th>' + (o.nameH || '이름') + '</th>' + C.map((c) => '<th>' + c.h + '</th>').join('') + '<th class="p">' + unit + '</th></tr>';
    for (const q of L) h += '<tr class="' + (q.me ? 'me ' : '') + (q.k === 1 ? 'top1' : '') + '"><td class="k">' + (q.co ? '<span style="font-size:12px">공동</span>' : '') + medal(q.k) + '</td><td>' + nameOf(q) + arrow(q) + '</td>'
      + C.map((c) => '<td class="c">' + c.f(q.r) + '</td>').join('') + '<td class="p">' + q.p + '</td></tr>';
    return h + '</table>';
  }
  const note = () => (S.from ? '<div class="rk-note">📋 ' + (S.from + 1) + '판부터 이 화면에서 본 기록이에요(들어오기 전 판은 빠져요)</div>' : '');
  const foot = () => { const f = o.foot ? o.foot(ranked(), S.x) : ''; return f ? '<div class="rk-aw">' + f + '</div>' : ''; };
  function body() {
    const t = o.turns ? o.turns() : '';
    return '<div class="rk-hd">📊 ' + esc(o.title) + ' 순위' + (o.progress ? ' <span style="font-size:13px;color:#4a5b70">' + o.progress() + '</span>' : '') + '</div>'
      + (t ? '<div class="rk-sub">' + t + '</div>' : '')
      + (Object.keys(S.rows).length ? table() : '<div class="rk-note" style="font-size:14px;margin-top:8px">첫 판이 끝나면 순위가 나와요</div>')
      + foot() + (o.rule ? '<div class="rk-rule">🔢 ' + o.rule + '</div>' : '') + note();
  }

  // 📊 칩(내 순위) · 순위표 창
  function paint() {
    if (live && !S.fin) {
      const me = ranked().find((q) => q.me), n = Object.keys(S.rows).length;
      const kb = document.body.classList.contains('touch') ? '' : ' (B)';   // 터치(키보드 없음)는 키 안내 없이
      const t = (me && S.n ? '📊 ' + (me.co ? '공동 ' : '') + me.k + '등 / ' + n : '📊 순위') + kb;
      if (t !== chipT) { chipT = t; map.hud.chip(o.id + 'Rank', t, { onClick: toggle }); }
    } else if (chipT) { chipT = ''; map.hud.chip(o.id + 'Rank', null); }
    if (pan) { const h = '<button class="rk-x" title="닫기 (B)">✕</button>' + body(); if (pan.dataset.h !== h) { pan.dataset.h = h; pan.innerHTML = h; } }
  }
  function openP() {
    if (pan) return; pan = document.createElement('div'); pan.className = 'rk-pan ttl-keep'; document.body.appendChild(pan);
    pan.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('.rk-x')) closeP(); });
    for (const t of ['pointerdown', 'mousedown', 'touchstart']) pan.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
    paint(); clearInterval(painT); painT = setInterval(paint, 1000);   // 차례 줄(누가 들어옴·나감)만 1초마다 — 매 프레임 아님
  }
  function closeP() { clearInterval(painT); if (pan) { pan.remove(); pan = null; } }
  function toggle() { if (pan) closeP(); else openP(); }
  const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  const kd = (e) => {
    if (e.code === 'Escape' && pan) { e.stopImmediatePropagation(); e.preventDefault(); closeP(); return; }
    if (e.code !== 'KeyB' || e.repeat || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!live || S.fin || document.querySelector('.lb-ask,.hudAsk')) return;   // 경기 중에만(대기실 = 표가 이미 보임) · 고르는 창 위에선 안 엶
    e.preventDefault(); toggle();
  };
  addEventListener('keydown', kd, true);

  // 경기 끝: 시상 카드 줄 · 대기실 표
  function podium() {
    const L = ranked(); if (!L.length) return '';
    const top = L.filter((q) => q.k <= 3), mine = L.find((q) => q.me);
    return top.map((q) => medal(q.k) + ' <b>' + esc(q.r.n) + '</b> ' + q.p + unit).join(' · ') + (mine && mine.k > 3 ? '<br>' + (o.meTag || '나') + ' = ' + mine.k + '등 (' + mine.p + unit + ')' : '');
  }
  function end() { S.fin = true; save(); closeP(); paint(); }
  function lobby() {
    if (!S.n) return '';
    return '<div class="rk-lb"><b>🏁 지난 경기 순위</b> <span style="font-size:12px;color:#5a6b80">' + S.n + '판 · 🔢 ' + (o.rule || '') + '</span>' + table() + foot() + note() + '</div>';
  }
  function hide() { live = false; closeP(); paint(); }
  function stop() { removeEventListener('keydown', kd, true); hide(); }
  const awards = () => (o.foot ? o.foot(ranked(), S.x) : '');
  return { start, last, row, round, ranked, strip, table, podium, awards, end, lobby, hide, stop, toggle, paint, get n() { return S.n; }, get x() { return S.x; }, get rows() { return S.rows; }, get on() { return !!pan; } };
}
