// 🏅 또 하고 싶게(REPLAY-1 · 11-14) — 일 놀이 창 위 한 줄에 내 최고 · 끝 창 첫 줄(이번 수 · 내 최고까지 n / 새 내 최고) · 둘째 줄 = 다음 칸 조건(딸기·표고·감자·조개·배추) · 연습 판 글
//   node tools/harness/town_replay1.cjs [ourtown] [포트] [--shots=폴더(판 사진 · 그리기 켬 · 휴대폰 세로 한 갈래)]
//   0 글 고르는 규칙 전수(node · town_lad.js 순수 함수) — 「내 최고까지 n」·「지난 최고보다 n」·「내 최고와 같아요」는 그 말이 참인 판에만 · 조건 글을 안 넘기는 길(부엌·소방)은 예전 글 그대로
//   ① 처음 줄 약속 글 ② 다시 열면 내 최고 수 ③ 창 위 줄은 보이는 한 줄(넘치면 조각을 안 붙임) ④ 「내 최고까지 n」 셈 ⑤ 점수 1 판 둘째 줄 = 조건 글 · 글에 적힌 수만큼 하면 실제로 칸이 오름
//   ⑥ 끝 창 줄 ≤ 2 · 화면 안 · [닫기] 하나 · 새 글이 예전 글보다 줄을 늘리지 않음 ⑦ 연습 판 시작·끝 알림 · 연습 판 새 최고 저장 ⑧ 진짜 판은 받음 · 연습 판 0 · 다음 날 다시 진짜 판
//   ⑨ 이야기 판 = 줄 없음 · 기록 안 셈 ⑩ 영어 뜻 같음 · 금지어 0 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const path = require('path'), fs = require('fs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const arg = n => { const a = process.argv.find(q => q.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : ''; }, OUT = arg('shots');
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const VW = 1366, VH = 768;
const FIVE = ['strawberry', 'shiitake', 'potato', 'clam', 'cabbage'], KIND = { strawberry: 'ripe', shiitake: 'ripe', potato: 'dig', clam: 'dig', cabbage: 'sort' }, KO = { strawberry: '딸기', shiitake: '표고', potato: '감자', clam: '조개', cabbage: '배추' };
/* 사다리 기록 갈래 18 → 놀이 틀(창 위 한 줄 글을 고르는 데만 씀) */
const KIND18 = { strawberry: 'ripe', shiitake: 'ripe', cabbage: 'sort', potato: 'dig', clam: 'dig', beehive: 'comb', pear: 'cover', lumber: 'order', plant: 'plant', tuho: 'toss', cut: 'cut', seaweed: 'spread', oyster: 'gauge', pasture: 'feed', fisher: 'tug', saltpan: 'salt', cook: 'kitchen', fire: 'fire' };
const OWN = new Set(['fisher', 'saltpan', 'cook']);
/* 판 1 = 다음 칸 문턱보다 하나 모자라게(하네스가 정한 수 · 놀이 코드의 문턱을 읽지 않음): 딸기·표고 주문 상자 3 · 감자 3 · 조개 2 · 배추 장터 바구니 3 */
const TG1 = { strawberry: 3, shiitake: 3, potato: 3, clam: 2, cabbage: 3 };
const NB = { strawberry: 3, shiitake: 3, potato: 3, clam: 2, cabbage: 4 };   /* 창 위 줄·끝 창 사진용 지난 최고 수(점수 1 띠) */
const BAN = /1등|순위|등수|친구보다|반에서|대단해|멋져|훌륭|최고예요|천재|완벽|rank|better than|amazing|awesome|genius|perfect/i;
const rk = r => (r ? r.lv * 1000 + Math.min(3, r.g) * 100 + Math.min(99, r.n) : -1);

/* ── 0 글 고르는 규칙 전수(브라우저 없이) ── */
function pure(L) {
  console.log('0 글 고르는 규칙 전수(18갈래 × 한·영 × 칸 1~4 × 지난 최고 × 이번 판)');
  const bad = {}, miss = (m, d) => { if (!bad[m]) bad[m] = d; }, cnt = { short: 0, same: 0, more: 0, old: 0, neu: 0, first: 0, nx: 0 }; let n = 0;
  const oldLines = (key, kind, k, R, en) => { const b = L.recSay(key, R.best, en), a = [];
    if (R.best) a.push(R.neu ? (en ? '🏅 New personal best! ' : '🏅 새 내 최고! ') + b : R.first ? (en ? '🏅 First record: ' : '🏅 첫 기록: ') + b : (en ? '🏅 My best: ' : '🏅 내 최고: ') + b + (en ? '. This time: ' : '. 이번: ') + L.recSay(key, R.last, en));
    if (R.next && R.down) a.push(en ? 'Next time one step easier (step ' + R.next + ')' : '다음 판은 한 칸 쉽게 해요(도전 ' + R.next + '칸)');
    else if (R.next) a.push((en ? 'Next time: ' : '다음 판은 ') + L.ladText(kind, k, R.next, en)); return a; };   /* REPLAY-1 앞의 글(견줄 것) */
  const cat = (t, en) => (en ? (/more to reach my best$/.test(t) ? 'short' : /^🏅 Same as my best/.test(t) ? 'same' : /more than my old best$/.test(t) ? 'more' : /First record/.test(t) ? 'first' : /New personal best/.test(t) ? 'neu' : /My best: /.test(t) ? 'old' : '')
    : (/남았어요$/.test(t) ? 'short' : /^🏅 내 최고와 같아요/.test(t) ? 'same' : /많아요$/.test(t) ? 'more' : /첫 기록/.test(t) ? 'first' : /새 내 최고/.test(t) ? 'neu' : /내 최고: /.test(t) ? 'old' : ''));
  const PB = [null]; for (let lv = 1; lv <= 4; lv++) for (let g = 1; g <= 3; g++) for (const m of [0, 1, 3, 5, 7]) PB.push({ lv, g, n: m });
  for (const key of Object.keys(KIND18)) { const kind = KIND18[key], own = OWN.has(key), mx = key === 'fire' ? 5 : 4;
    const s5 = L.recSay(key, { lv: 1, g: 1, n: 5 }, false).replace('도전 1칸, ', ''), i5 = s5.lastIndexOf(' 5'), TH = s5.slice(0, i5), U = s5.slice(i5 + 2), EN = L.recSay(key, { lv: 1, g: 1, n: 5 }, true).replace('step 1, 5 ', '');
    for (let lv = 1; lv <= 4; lv++) for (const pb of PB) for (let g = 0; g <= 3; g++) for (const cn of [-1, 0, 1, 2, 3, 5, 7, 12]) { const cats = {};
      for (const en of [false, true]) for (const nx of [undefined, '', 'NX']) { n++;
        const S = { lad: { mg: { [key]: { lv, z: 0, n: pb ? 2 : 0, best: pb ? { ...pb } : null, last: pb ? { ...pb } : null } } } }, R = L.ladAfter(S, key, { lv, g, n: cn, own }), A = L.recLines(key, kind, key, R, en, nx), O = oldLines(key, kind, key, R, en);
        const tag = JSON.stringify({ key, en, lv, pb, g, cn, nx: nx === undefined ? '없음' : nx, A });
        if (A.length > 2) miss('줄 수가 둘을 넘음', tag);
        if (nx === undefined) { if (JSON.stringify(A) !== JSON.stringify(O)) miss('조건 글을 안 넘긴 길(부엌·소방)이 예전 글과 다름', tag); continue; }
        const B = R.best, C = R.last, P = R.prev, f = B ? A[0] || '' : '', s = B ? A[1] || '' : A[0] || '', Of = B ? O[0] || '' : '', Os = B ? O[1] || '' : O[0] || '', c = cat(f, en); cats[(en ? 'e' : 'k') + (nx ? 1 : 0)] = c;
        if (B && !f) miss('기록이 있는데 첫 줄이 없음', tag);
        if (c === 'short') { cnt.short++; const m = en ? f.match(/^🏅 This time: (\d+) (.+)\. (\d+) more to reach my best$/) : f.match(/^🏅 이번 (.+) (\d+)(\D+)\. 내 최고까지 (\d+)(\D+) 남았어요$/), a = m ? +(en ? m[1] : m[2]) : -1, d = m ? +(en ? m[3] : m[4]) : -1;
          if (!m || (en ? m[2] !== EN : m[1] !== TH || m[3] !== U || m[5] !== U)) miss('「내 최고까지」 글 꼴이 다름', tag);
          else if (R.neu || R.first || a !== C.n || d !== B.n - C.n || d <= 0 || a <= 0 || B.lv !== C.lv || rk({ lv: C.lv, g: C.g, n: C.n + d }) !== rk(B)) miss('「내 최고까지 n」이 틀린 셈(그 수만큼 더 하면 내 최고와 같아져야 함)', tag); }
        else if (c === 'same') { cnt.same++; const m = en ? f.match(/^🏅 Same as my best: (\d+) (.+)$/) : f.match(/^🏅 내 최고와 같아요\. (.+) (\d+)(\D+)$/), a = m ? +(en ? m[1] : m[2]) : -1;
          if (!m || (en ? m[2] !== EN : m[1] !== TH || m[3] !== U)) miss('「내 최고와 같아요」 글 꼴이 다름', tag); else if (R.neu || R.first || a !== C.n || a <= 0 || rk(C) !== rk(B)) miss('「내 최고와 같아요」가 틀린 말', tag); }
        else if (c === 'more') { cnt.more++; const m = en ? f.match(/^🏅 New personal best! (\d+) (.+)\. (\d+) more than my old best$/) : f.match(/^🏅 새 내 최고! (.+) (\d+)(\D+)\. 지난 최고보다 (\d+)(\D+) 많아요$/), a = m ? +(en ? m[1] : m[2]) : -1, d = m ? +(en ? m[3] : m[4]) : -1;
          if (!m || (en ? m[2] !== EN : m[1] !== TH || m[3] !== U || m[5] !== U)) miss('「지난 최고보다」 글 꼴이 다름', tag); else if (!R.neu || !P || P.lv !== C.lv || a !== C.n || d !== C.n - P.n || d <= 0 || rk(C) <= rk(P)) miss('「지난 최고보다 n 많아요」가 틀린 셈', tag); }
        else { if (c) cnt[c]++; if (f !== Of) miss('새 글도 예전 글도 아닌 첫 줄', tag); }
        /* 고르는 규칙(문서와 같은 말): 수를 센 판에서 — 새 최고이고 같은 칸에서 수가 늘었으면 「지난 최고보다」 · 새 최고가 아니고 칸·잘한 정도가 같으면 수에 따라 「내 최고까지」/「같아요」 · 그 밖은 예전 글 */
        { let want = B ? cat(Of, en) : ''; if (B && C.n > 0) { if (R.neu) { if (P && P.lv === C.lv && P.n > 0 && C.n > P.n) want = 'more'; } else if (!R.first && B.lv === C.lv && B.g === C.g && B.n > 0) { if (C.n < B.n) want = 'short'; else if (C.n === B.n) want = 'same'; } } if (want !== c) miss('고른 글의 꼴이 규칙과 다름(바라는 꼴 ' + want + ' · 나온 꼴 ' + c + ')', tag); }
        if (B && !R.neu && !R.first && C.n >= B.n && c === 'short') miss('이번 수가 최고 수보다 많거나 같은데 「남았어요」', tag);
        /* 둘째 줄: 칸이 바뀌면 예전 글 · 아니면 점수 1 · 끝 칸 아님 · 조건 글이 있을 때만 조건 글 */
        { const want = R.next ? Os : nx && B && C.g === 1 && lv < mx ? nx : ''; if (s !== want) miss('둘째 줄이 규칙과 다름(바라는 글 「' + want + '」)', tag); if (s === 'NX') cnt.nx++; }
      }
      if (cats.k0 !== cats.e0 || cats.k1 !== cats.e1 || cats.k0 !== cats.k1) miss('한·영 또는 조건 글 있음·없음에 따라 첫 줄 꼴이 달라짐', JSON.stringify({ key, lv, pb, g, cn, cats })); } }
  ok(!Object.keys(bad).length, '0 끝 창 글 ' + n + '판 전수 — 틀린 셈·틀린 말 0 (내 최고까지 ' + cnt.short + ' · 같아요 ' + cnt.same + ' · 지난 최고보다 ' + cnt.more + ' · 예전 글 ' + (cnt.old + cnt.neu + cnt.first) + ' · 조건 글 줄 ' + cnt.nx + ')');
  for (const m of Object.keys(bad).slice(0, 8)) console.log('      ✗ ' + m + ' — ' + bad[m].slice(0, 420));
  ok(cnt.short > 0 && cnt.same > 0 && cnt.more > 0 && cnt.nx > 0, '0 새 글 세 꼴과 조건 글 줄이 모두 나옴');
  /* 창 위 한 줄(ladHead) */
  const hb = [];
  for (const key of Object.keys(KIND18)) { const kind = KIND18[key], s5 = L.recSay(key, { lv: 1, g: 1, n: 5 }, false).replace('도전 1칸, ', ''), U = s5.slice(s5.lastIndexOf(' 5') + 2), EN = L.recSay(key, { lv: 1, g: 1, n: 5 }, true).replace('step 1, 5 ', '');
    for (const en of [false, true]) for (let lv = 1; lv <= 4; lv++) for (const own of [false, true]) { const t = L.ladText(kind, key, lv, en), H = st => L.ladHead(st, key, kind, key, lv, en, own), mk = b9 => ({ lad: { mg: { [key]: { lv, z: 0, n: 1, best: b9, last: b9 } } } }), e = (got, want, why) => { if (got !== want) hb.push(why + ' ' + JSON.stringify({ key, en, lv, own, got, want })); };
      const pro = !own && lv === 1 ? t + (en ? '. Do very well and step 2 opens' : '. 아주 잘 해내면 도전 2칸이 열려요') : t;
      for (const S0 of [null, {}, { lad: 1 }, { lad: {} }, { lad: { mg: [] } }, { lad: { mg: {} } }, mk(null)]) e(H(S0), pro, '기록 없음');
      e(H(mk({ lv, g: 1, n: 5 })), t + (en ? '. My best: 5 ' + EN : '. 내 최고 5' + U), '같은 칸 기록');
      e(H(mk({ lv: lv === 3 ? 2 : 3, g: 2, n: 7 })), t + (en ? '. My best: ' : '. 내 최고 ') + L.recSay(key, { lv: lv === 3 ? 2 : 3, g: 2, n: 7 }, en), '다른 칸 기록');
      e(H(mk({ lv, g: 2, n: 0 })), t, '수를 못 센 기록'); } }
  ok(!hb.length, '0 창 위 한 줄 글(기록 없음 = 1칸에서만 약속 글 · 같은 칸 = 「내 최고 5개」 · 다른 칸 = 칸까지 · 수 없는 기록 = 조각 없음)' + (hb.length ? ' — ' + hb.slice(0, 3).join(' / ') : ''));
}

/* 페이지 안 도우미(1366 화면 · 휴대폰 화면이 같이 씀) */
const SETUP = () => { const G = SM_TOWN.game(); window.__G = G; G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false; SM_TOWN.rules.season('spring');
  window.__sleep = ms => new Promise(r => setTimeout(r, ms));
  window.__low = () => { const sh = SM_TOWN.shore && SM_TOWN.shore(); if (!sh || !sh.low) return true; for (let m = 0; m < 24 * 60; m += 20) { G.S.min = m; if (sh.low()) return true; } return false; };
  window.__play = k => (k === 'clam' ? SM_TOWN.playK(k) : SM_TOWN.play(k));   /* 조개 캐기는 일꾼이 아니라 갯벌 손잡이로 열림 → 시험 손잡이 playK(선 자리에서 그 놀이를 엶 · 사다리·기록 길은 같음) */
  window.__mg = () => { const S = G.S; if (!S.lad || typeof S.lad !== 'object' || Array.isArray(S.lad)) S.lad = {}; if (!S.lad.mg || typeof S.lad.mg !== 'object' || Array.isArray(S.lad.mg)) S.lad.mg = {}; return S.lad.mg; };
  window.__pb = () => { const w = [...document.querySelectorAll('.twn-play')].pop(); return w ? w.querySelector('.pb') : null; };   /* 앞 판 창은 0.25초 뒤에 지워짐 → 마지막 것 */
  window.__panels = () => { for (let k = 0; k < 4; k++) { const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]'); if (b9) b9.click(); else break; } };
  /* 판 닫기 = 아이가 누르는 단추(끝 글이 보이면 [닫기] = 보상·기록 그대로 · 놀이 중이면 [그만] = 기록 안 셈) — 시험 손잡이 playEnd(0)는 아쉬움 한 판으로 세어 사다리를 바꿈 */
  window.__shut = async () => { for (let i = 0; i < 6 && SM_TOWN.rules.play(); i++) { const pb = __pb(), x = pb && pb.querySelector('.row .x'); if (!x) break; x.click(); await __sleep(150); } await __sleep(330); __panels(); return !SM_TOWN.rules.play(); };
  window.__rows = el => { if (!el) return 0; const r = document.createRange(); r.selectNodeContents(el); const A = [...r.getClientRects()].filter(q => q.width >= 1 && q.height >= 1); if (!A.length) return 0; const H = Math.max(...A.map(q => q.height)), T = []; for (const q of A) if (!T.some(t => Math.abs(t - q.top) < H * 0.5)) T.push(q.top); return T.length; };   /* 보이는 줄 수 */
  window.__lab = () => { const pb = __pb(), e = pb && pb.querySelector('.mglad'); if (!e) return { t: '', rows: 0, has: false }; const r = e.getBoundingClientRect(), q = pb.getBoundingClientRect(); return { t: e.textContent, rows: __rows(e), has: true, cw: e.clientWidth, sw: e.scrollWidth, vis: getComputedStyle(e).display !== 'none', fs: getComputedStyle(e).fontSize, bot: Math.round(r.bottom - q.top), pw: Math.round(q.width) }; };
  window.__over = full => { const pb = __pb(), e = pb && pb.querySelector('.mglad'); if (!e) return null; const t = e.textContent, ws = e.style.whiteSpace; e.textContent = full; e.style.whiteSpace = 'nowrap'; const o = { sw: e.scrollWidth, cw: e.clientWidth }; e.style.whiteSpace = ws; e.textContent = full; o.rows = __rows(e); e.textContent = t; return o; };   /* 조각을 붙였다면 넘쳤을까 */
  window.__end = () => { const pb = __pb(); if (!pb) return null; const rec = pb.querySelector('.mgrec'), msg = pb.querySelector('.msg'), res = pb.querySelector('.mgres'), R = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom) }; };
    const btn = [...pb.querySelectorAll('.row button')].filter(b => b.getClientRects().length && getComputedStyle(b).display !== 'none' && getComputedStyle(b).visibility !== 'hidden');
    return { end: pb.classList.contains('mg-end'), res: res ? res.textContent : '', msg: msg ? msg.textContent : '', lines: rec ? [...rec.children].map(d => d.textContent) : [], rows: rec ? [...rec.children].map(d => __rows(d)) : [], neu: !!(rec && rec.classList.contains('neu')), btn: btn.map(b => b.textContent.trim()), pb: R(pb), rec: rec ? R(rec) : null, x: btn[0] ? R(btn[0]) : null, ih: innerHeight, iw: innerWidth }; };
  /* 끝 창 첫 줄 자리에 글을 넣어 보이는 줄 수를 잼(글은 되돌림) */
  window.__probe = L9 => { const pb = __pb(), rec = pb && pb.querySelector('.mgrec'), d = rec && rec.children[0]; if (!d) return null; const t = d.textContent, out = L9.map(s => { d.textContent = s; return __rows(d); }); d.textContent = t; return out; };
  window.__bag = () => ({ n: Object.values(G.S.bag || {}).reduce((a, v) => a + (v || 0), 0), m: G.S.money | 0, j: JSON.stringify(G.S.bag || {}) });
  window.__fresh = k => { const S = G.S; S.uses = {}; S.rw = {}; S.hearts = {}; delete __mg()[k]; };
  /* 판 열기: st = 넣을 사다리 상태(null = 지움 · undefined = 그대로) · keep = 하루 몫(S.uses)을 그대로 둠 */
  window.__open = async (k, st, keep) => { await __shut(); if (k === 'clam') __low(); else G.S.min = 11 * 60; if (!keep) G.S.uses = {}; const M = __mg(); if (st === null) delete M[k]; else if (st) M[k] = JSON.parse(JSON.stringify(st));
    if (!__play(k)) return { none: 1 }; await __sleep(300); const L = SM_TOWN.lad(); if (!L.play) return { none: 2 }; return { lv: L.play.lv, pr: L.play.pr, st: L.play.st, kind: L.play.kind, lab: __lab() }; };
  /* 끝내기(점수 · 모은 수) → 끝 창을 바로 읽음 */
  window.__fin = async (s, n) => { const L = SM_TOWN.lad(); if (!L.play) return null; const k = L.play.k; L.finish(s, n); await __sleep(80); const o = __end() || {}; o.st = SM_TOWN.lad().mg[k]; return o; };
  /* 실제로 놀기: tgt = 주문 상자에 담을 수(딸기·표고) · 찾을 수(감자·조개) · 장터 바구니로 보낼 수(배추 — 그 뒤 주문 상자 넷) → 끝 창 */
  window.__real = async (k, tgt) => { await __shut(); if (k === 'clam') __low(); else G.S.min = 11 * 60; G.S.uses = {};
    if (!__play(k)) return { none: 1 }; await __sleep(300); const L = SM_TOWN.lad(); if (!L.play) return { none: 2 };
    const o = { lv: L.play.lv, lab: __lab(), pr: L.play.pr, kind: L.play.kind }, d0 = SM_TOWN.mgDbg(); if (!d0) return { none: 3 };
    if (o.kind === 'ripe') { let gd = 0; while (gd++ < 500) { const d = SM_TOWN.mgDbg(), q = SM_TOWN.lad().play; if (!d || !q || q.done || d.P >= tgt) break; const i = d.st.indexOf(d.want); if (i >= 0) d.pick(i); await __sleep(120); } }   /* 초록·작은 봉오리는 안 누름 · 다 담으면 시계가 끝날 때까지 기다림 */
    else if (o.kind === 'dig') { const H = [], E = []; d0.hide.forEach((h, i) => (h ? H : E).push(i)); for (const i of H.slice(0, tgt)) { d0.pick(i); await __sleep(60); } let gd = 0; while (gd++ < 40 && E.length) { const d = SM_TOWN.mgDbg(), q = SM_TOWN.lad().play; if (!d || !q || q.done || d.digs <= 0) break; d.pick(E.shift()); await __sleep(40); } }   /* 남은 삽질은 빈 칸에 다 씀 */
    else if (o.kind === 'sort') { const Rt = [], Wr = []; d0.sz.forEach((s, i) => (s === d0.want ? Rt : Wr).push(i)); for (const i of Wr.slice(0, tgt)) { d0.pick(i); await __sleep(60); } for (const i of Rt.slice(0, 4)) { d0.pick(i); await __sleep(60); } }   /* 다른 크기 tgt포기 → 주문 크기 넷(바로 끝) */
    const t0 = performance.now(); while (performance.now() - t0 < 150000) { const q = SM_TOWN.lad().play; if (!q) { o.gone = 1; break; } if (q.done) break; await __sleep(50); }
    const d1 = SM_TOWN.mgDbg(); o.dbg = d1 ? { P: d1.P, M: d1.M, found: d1.found, digs: d1.digs, ok: d1.ok, miss: d1.miss } : null; o.end = __end(); o.st = SM_TOWN.lad().mg[k]; o.cnt = (SM_TOWN.lad().play || {}).cnt; return o; };
  window.__tl = []; setInterval(() => { const t = document.getElementById('toast'), s = t && t.getClientRects().length ? t.textContent : ''; if (s && __tl[__tl.length - 1] !== s) __tl.push(s); }, 100);   /* 알림 글 모으기 */
};

(async () => { const T0 = Date.now(), L = await import(path.resolve(__dirname, '../../v2/games/town_lad.js'));
  pure(L);
  const M = await import(path.resolve(__dirname, '../../v2/games/town_story.js')), ix = (c, id) => M.CHAPTERS.find(q => q.id === c).steps.findIndex(q => q.id === id);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [], SEEN = [], SH = {};
  const watch = p => { p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|기록 오류/.test(t)) errs.push(t.slice(0, 200)); }); };
  const boot = async p => { await p.addInitScript(() => { window.__SURP_OFF = 1; }); await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.lad && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(500); await p.evaluate(SETUP); };
  try { const ctx = await b.newContext({ viewport: { width: VW, height: VH } }), p = await ctx.newPage(); watch(p);
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a); await boot(p);
    const has = await ev(F => F.filter(k => (k === 'clam' ? typeof SM_TOWN.playK === 'function' && !!(SM_TOWN.shore && SM_TOWN.shore()) : SM_TOWN.workers().some(w => w[4] === k))), FIVE); ok(has.length === 5, '이 판에 다섯 갈래가 다 있음(조개 캐기 = 갯벌 손잡이): ' + has.join(', '));
    const see = (...a) => { for (const t of a.flat()) if (t) SEEN.push(t); };
    const clip = async top => { const r = await ev(t9 => { const pb = __pb(); if (!pb) return null; const q = pb.getBoundingClientRect(), e = pb.querySelector('.mglad'), h = t9 && e ? e.getBoundingClientRect().bottom - q.top + 70 : q.height; return { x: q.left, y: q.top, w: q.width, h }; }, !!top); if (!r) return null; const x = Math.max(0, Math.floor(r.x - 6)), y = Math.max(0, Math.floor(r.y - 6)); return { x, y, width: Math.min(VW - x, Math.ceil(r.w + 12)), height: Math.min(VH - y, Math.ceil(r.h + 12)) }; };
    const snap = async (grp, tag, top) => { if (!OUT) return; const c = await clip(top); if (!c) return; (SH[grp] || (SH[grp] = [])).push({ tag, buf: await p.screenshot({ clip: c }) }); };
    const st1 = (lv, g, n) => ({ lv, z: 0, n: 2, best: { lv, g, n }, last: { lv, g, n } }), head = (k, st, lv, en) => L.ladHead({ lad: { mg: { [k]: st } } }, k, KIND18[k], k, lv, !!en, false), base = (k, lv, en) => L.ladText(KIND18[k], k, lv, !!en);
    const endOk = (e, tag) => { const inV = e && e.pb && e.pb.b <= e.ih + 1 && e.pb.y >= -1 && (!e.rec || e.rec.b <= e.ih) && e.x && e.x.b <= e.ih + 1; return !!(e && e.end && e.lines.length <= 2 && e.btn.length === 1 && e.btn[0] === '닫기' && inV) || (console.log('      (' + tag + ') ' + JSON.stringify(e).slice(0, 400)), false); };

    // ── ①②⑤ 실제로 놀기: 판 1 = 문턱보다 하나 모자라게 → 끝 창 조건 글에서 수를 읽음 → 판 2 = 글에 적힌 수만큼 → 칸이 오름 ──
    console.log('①②⑤ 실제로 놀아서: 조건 글에 적힌 수만큼 하면 칸이 오르는가');
    const COND = {}, UNIT = {}, THING = {};
    const real2 = async (k, lv0) => { const T = lv0 === 1 ? '' : '(' + lv0 + '칸에서) '; if (lv0 === 1) await ev(k9 => __fresh(k9), k); else await ev(([k9, s9]) => { __fresh(k9); __mg()[k9] = s9; }, [k, { lv: lv0, z: 0, n: 0, best: null, last: null }]);
      const s5 = L.recSay(k, { lv: 1, g: 1, n: 5 }, false).replace('도전 1칸, ', ''), i5 = s5.lastIndexOf(' 5'), TH = s5.slice(0, i5), U = s5.slice(i5 + 2); UNIT[k] = U; THING[k] = TH;
      const r1 = await ev(([k9, t9]) => __real(k9, t9), [k, TG1[k]]); if (r1.none) { ok(false, KO[k] + ' ' + T + '놀이가 안 열림 ' + JSON.stringify(r1)); return; }
      const e1 = r1.end || {}, n1 = r1.st && r1.st.last ? r1.st.last.n : -1; see(r1.lab.t, e1.lines);
      if (lv0 === 1) ok(r1.lab.t === '도전 1칸. 아주 잘 해내면 도전 2칸이 열려요' && r1.lab.rows === 1, '① ' + KO[k] + ' 처음 여는 판의 창 위 줄 「' + r1.lab.t + '」 (보이는 줄 ' + r1.lab.rows + ')');
      else ok(r1.lab.t === base(k, lv0) && r1.lab.rows === 1, '① ' + KO[k] + ' ' + T + '기록이 없으면 조각 없음 「' + r1.lab.t + '」');
      const did = KIND[k] === 'ripe' ? r1.dbg && r1.dbg.P === TG1[k] && r1.dbg.M === 0 : KIND[k] === 'dig' ? r1.dbg && r1.dbg.found === TG1[k] : r1.dbg && r1.dbg.ok === 4 && r1.dbg.miss === TG1[k];
      ok(did && r1.lv === lv0 && r1.st.last.g === 1 && r1.st.lv === lv0, '⑤ ' + KO[k] + ' ' + T + '판 1(문턱보다 하나 모자람 ' + JSON.stringify(r1.dbg) + ') = 「' + e1.res + '」 · 칸 그대로 ' + (r1.st && r1.st.lv));
      ok(e1.lines && e1.lines[0] === '🏅 첫 기록: 도전 ' + lv0 + '칸, ' + TH + ' ' + n1 + U, '⑤ ' + KO[k] + ' ' + T + '끝 창 첫 줄 「' + (e1.lines && e1.lines[0]) + '」');
      const cond = (e1.lines && e1.lines[1]) || '', m = cond.match(/(\d+)(개|송이|포기)/), N = m ? +m[1] : -1; if (lv0 === 1) COND[k] = cond;
      ok(/다음 칸이에요$/.test(cond) && N > 0 && m[2] === U && (lv0 === 1 || cond === COND[k]), '⑤ ' + KO[k] + ' ' + T + '둘째 줄 = 다음 칸 조건 「' + cond + '」 (보이는 줄 ' + (e1.rows && e1.rows[1]) + ')');
      ok(KIND[k] === 'sort' ? N === TG1[k] - 1 : N === TG1[k] + 1, '⑤ ' + KO[k] + ' ' + T + '조건 글의 수 ' + N + ' = 판 1에서 한 수(' + TG1[k] + ')에서 하나 건너');
      ok(endOk(e1, k + ' 판 1'), '⑥ ' + KO[k] + ' ' + T + '끝 창: 줄 ' + (e1.lines || []).length + ' · [닫기] 하나 · 화면 안(판 아래 ' + (e1.pb && e1.pb.b) + ' ≤ ' + e1.ih + ')');
      await ev(() => __shut()); if (N <= 0) return;
      const r2 = await ev(([k9, t9]) => __real(k9, t9), [k, N]); if (r2.none) { ok(false, KO[k] + ' ' + T + '판 2가 안 열림'); return; }
      const e2 = r2.end || {}, h2 = head(k, { lv: lv0, best: { lv: lv0, g: 1, n: n1 } }, lv0), fit2 = r2.lab.t === h2; see(r2.lab.t, e2.lines);
      if (lv0 === 1) ok(fit2 && r2.lab.rows === 1 && h2 === '도전 1칸. 내 최고 ' + n1 + U, '② ' + KO[k] + ' 다시 열면 창 위 줄에 내 최고 「' + r2.lab.t + '」 (보이는 줄 ' + r2.lab.rows + ')');
      else ok(r2.lab.rows === 1 && (fit2 || r2.lab.t === base(k, lv0)), '② ' + KO[k] + ' ' + T + '다시 열면 「' + r2.lab.t + '」' + (fit2 ? '' : ' (조각은 넘쳐서 안 붙음)'));
      const did2 = KIND[k] === 'ripe' ? r2.dbg && r2.dbg.P === N && r2.dbg.M === 0 : KIND[k] === 'dig' ? r2.dbg && r2.dbg.found === N : r2.dbg && r2.dbg.ok === 4 && r2.dbg.miss === N;
      ok(did2 && r2.st.last.g >= 2 && r2.st.lv === lv0 + 1, '⑤ ' + KO[k] + ' ' + T + '판 2(글에 적힌 수만큼 ' + JSON.stringify(r2.dbg) + ') = 「' + e2.res + '」 · 칸 ' + lv0 + ' → ' + (r2.st && r2.st.lv));
      const n2 = r2.st.last.n, w0 = n2 > n1 ? '🏅 새 내 최고! ' + TH + ' ' + n2 + U + '. 지난 최고보다 ' + (n2 - n1) + U + ' 많아요' : '🏅 새 내 최고! 도전 ' + lv0 + '칸, ' + TH + ' ' + n2 + U;
      ok(e2.lines && e2.lines[0] === w0 && e2.neu, '② ' + KO[k] + ' ' + T + '끝 창 첫 줄 「' + (e2.lines && e2.lines[0]) + '」 (보이는 줄 ' + (e2.rows && e2.rows[0]) + ')');
      ok(e2.lines && e2.lines[1] === '다음 판은 ' + base(k, lv0 + 1) && endOk(e2, k + ' 판 2'), '⑤ ' + KO[k] + ' ' + T + '둘째 줄 「' + (e2.lines && e2.lines[1]) + '」');
      await ev(() => __shut()); };
    for (const k of FIVE) await real2(k, 1);
    for (const k of ['potato', 'clam', 'cabbage', 'strawberry']) await real2(k, 3);   /* 높은 칸에서도 같은 조건 글이 참인가 */

    // ── ③⑥ 창 위 줄·끝 창: 다섯 갈래 × 1~4칸 ──
    console.log('③⑥ 창 위 한 줄(다섯 갈래 × 1~4칸) · 끝 창 모양');
    const ON = [], OFF = [], PW = {};
    const start = async (k, st, lv, grp, tag) => { const full = head(k, st, lv), bs = base(k, lv), o = await ev(([k9, s9]) => __open(k9, s9), [k, st]); if (o.none) { ok(false, KO[k] + ' ' + lv + '칸 놀이가 안 열림'); return null; } see(o.lab.t); PW[k] = o.lab.pw;
      if (o.lab.t === full && full !== bs) { ON.push(KO[k] + ' ' + tag); ok(o.lab.rows === 1 && o.lv === lv, '③ ' + KO[k] + ' ' + tag + ' 「' + o.lab.t + '」 = 한 줄(글 폭 ' + o.lab.sw + ' / 칸 폭 ' + o.lab.cw + ')'); }
      else { const ov = await ev(f => __over(f), full); OFF.push(KO[k] + ' ' + tag); ok(o.lab.t === bs && o.lab.rows === 1 && ov && ov.sw > ov.cw + 1 && o.lv === lv, '③ ' + KO[k] + ' ' + tag + ' 「' + o.lab.t + '」 = 조각을 안 붙임(붙이면 글 폭 ' + (ov && ov.sw) + ' > 칸 폭 ' + (ov && ov.cw) + ' · ' + (ov && ov.rows) + '줄)'); }
      await snap(grp, tag, true); return o; };
    const RW = {};   /* 끝 창 줄마다 보이는 줄 수(보고용) */
    for (const k of FIVE) for (let lv = 1; lv <= 4; lv++) { const st = st1(lv, 1, NB[k]), o = await start(k, st, lv, k + '-start', lv + '칸'); if (!o) continue;
      if (OUT && k === 'strawberry' && lv === 2) await p.screenshot({ path: path.join(OUT, 'full-start.png') });
      const e = await ev(([s, n]) => __fin(s, n), [1, NB[k] - 1]); see(e.lines); await snap(k + '-end', lv + '칸'); if (OUT && k === 'strawberry' && lv === 2) await p.screenshot({ path: path.join(OUT, 'full-end.png') });
      const w0 = '🏅 이번 ' + THING[k] + ' ' + (NB[k] - 1) + UNIT[k] + '. 내 최고까지 1' + UNIT[k] + ' 남았어요', w1 = lv < 4 ? COND[k] : undefined; RW[k + lv] = e.rows;
      ok(e.lines[0] === w0 && e.lines[1] === w1 && endOk(e, k + lv), '⑥ ' + KO[k] + ' ' + lv + '칸 끝 창 「' + e.lines.join('」「') + '」 보이는 줄 ' + JSON.stringify(e.rows) + ' · 판 폭 ' + e.pb.w + ' · 판 아래 ' + e.pb.b);
      ok(e.rows.every(r => r === 1), '⑥ ' + KO[k] + ' ' + lv + '칸 끝 창 두 줄이 저마다 보이는 한 줄(1366×768)');
      await ev(() => __shut()); }
    /* 두 자리 수 · 다른 칸 기록 */
    for (const k of ['strawberry', 'shiitake']) { const o = await start(k, st1(4, 3, 12), 4, k + '-start', '4칸 · 12' + UNIT[k]); if (o) await ev(() => __shut()); }
    for (const k of FIVE) { const st = { lv: 2, z: 0, n: 4, best: { lv: 3, g: 1, n: NB[k] }, last: { lv: 2, g: 0, n: 1 } }, o = await start(k, st, 2, k + '-start', '2칸 · 3칸 기록'); if (o) await ev(() => __shut()); }
    console.log('    기록 조각이 붙은 판: ' + ON.join(' · ')); console.log('    기록 조각이 안 붙은 판(넘침): ' + (OFF.join(' · ') || '없음')); console.log('    판 폭: ' + JSON.stringify(PW));
    ok(ON.length > 0, '③ 기록 조각이 붙는 판이 있음(' + ON.length + '판 · 안 붙은 판 ' + OFF.length + ')');
    { const g9 = await ev(k9 => SM_TOWN.lad().mg[k9], 'cabbage'); ok(!SM_TOWN_NULL(g9) && g9.lv === 2 && g9.last.g === 0 && g9.best.lv === 3, '③ 창 위 줄만 보고 [그만]으로 닫은 판은 기록이 안 바뀜 ' + JSON.stringify(g9)); }

    // ── ④ 글 고르기(상태를 넣고 점수·수로 끝냄 · 딸기) ──
    console.log('④ 끝 창 첫 줄 고르기(딸기)');
    const C1 = COND.strawberry, B13 = st1(1, 1, 3), N2 = '다음 판은 ' + base('strawberry', 2);
    const pick = async (st, s, n, w0, w1, why, neu) => { const o = await ev(([s9]) => __open('strawberry', s9), [st]); if (o.none) { ok(false, '④ 딸기가 안 열림'); return; } const e = await ev(([a, c]) => __fin(a, c), [s, n]); see(e.lines);
      ok(e.lines[0] === w0 && e.lines[1] === w1 && e.neu === !!neu && endOk(e, why), '④ ' + why + ' → 「' + e.lines.join('」「') + '」'); await ev(() => __shut()); return e; };
    await pick({ lv: 1, z: 0, n: 3, best: { lv: 1, g: 2, n: 4 }, last: { lv: 1, g: 0, n: 1 } }, 1, 6, '🏅 내 최고: 도전 1칸, 딸기 4개. 이번: 도전 1칸, 딸기 6개', C1, '이번 수가 더 많아도 최고가 아닌 판(잘한 정도가 낮음) = 「남았어요」 없음');
    await pick(B13, 1, 2, '🏅 이번 딸기 2개. 내 최고까지 1개 남았어요', C1, '같은 칸·같은 잘한 정도에서 하나 모자람');
    await pick(B13, 1, 3, '🏅 내 최고와 같아요. 딸기 3개', C1, '내 최고와 같은 수');
    await pick(B13, 1, 5, '🏅 새 내 최고! 딸기 5개. 지난 최고보다 2개 많아요', C1, '같은 칸에서 수가 늘어 새 최고', true);
    await pick(B13, 2, 2, '🏅 새 내 최고! 도전 1칸, 딸기 2개', N2, '새 최고지만 수는 줄어든 판(잘한 정도가 높음) = 「많아요」 없음', true);
    await pick(B13, 0, 1, '🏅 내 최고: 도전 1칸, 딸기 3개. 이번: 도전 1칸, 딸기 1개', undefined, '아쉬운 판 = 예전 글 · 조건 글 없음');
    await pick({ lv: 2, z: 0, n: 3, best: { lv: 1, g: 2, n: 4 }, last: { lv: 1, g: 2, n: 4 } }, 1, 3, '🏅 새 내 최고! 도전 2칸, 딸기 3개', C1, '칸이 올라 새 최고(수는 적음) = 칸을 말하는 예전 글 + 조건 글', true);
    await pick(st1(4, 1, 3), 1, 2, '🏅 이번 딸기 2개. 내 최고까지 1개 남았어요', undefined, '끝 칸(4칸)에서는 조건 글 없음');
    /* 새 글이 예전 글보다 보이는 줄을 늘리지 않는가(공용 길 16갈래 × 세 꼴 · 딸기 끝 창의 첫 줄 자리에 넣어 잼) */
    { const o = await ev(([s9]) => __open('strawberry', s9), [B13]), e = o.none ? null : await ev(([a, c]) => __fin(a, c), [1, 2]); const keys = Object.keys(KIND18).filter(k => k !== 'cook' && k !== 'fire'), Q = [];
      for (const k of keys) { const kd = KIND18[k], b9 = { lv: 3, g: 1, n: 9 }, lo = { lv: 3, g: 1, n: 6 }, Rs = { neu: false, first: false, best: b9, last: lo, prev: b9, next: 0, down: false, lv: 3, end: false }, Rq = { ...Rs, last: b9 }, Rm = { ...Rs, neu: true, last: b9, prev: lo };
        for (const [nm, R] of [['내 최고까지', Rs], ['같아요', Rq], ['지난 최고보다', Rm]]) Q.push({ k, nm, a: L.recLines(k, kd, k, R, false, '')[0], o: L.recLines(k, kd, k, R, false)[0] }); }
      const rows = e ? await ev(A => __probe(A), Q.flatMap(q => [q.a, q.o])) : null, worse = []; if (rows) Q.forEach((q, i) => { q.ra = rows[i * 2]; q.ro = rows[i * 2 + 1]; if (q.ra > q.ro) worse.push(q.k + ' ' + q.nm + ' ' + q.ro + '→' + q.ra + '줄 「' + q.a + '」'); });
      ok(rows && !worse.length, '⑥ 새 첫 줄이 예전 글보다 보이는 줄을 늘리지 않음(16갈래 × 세 꼴 · 1366×768)' + (worse.length ? ' — ' + worse.join(' / ') : ''));
      if (rows) console.log('    두 줄로 보이는 새 첫 줄: ' + (Q.filter(q => q.ra > 1).map(q => q.k + ' ' + q.nm + '(예전 ' + q.ro + '줄)').join(' · ') || '없음'));
      await ev(() => __shut()); }
    /* 다섯 갈래 밖(꿀 뜨기): 첫 줄은 새 글 · 조건 글은 없음 */
    if (await ev(() => SM_TOWN.workers().some(w => w[4] === 'beehive'))) { const o = await ev(([s9]) => __open('beehive', s9), [B13]); if (o.none) ok(false, '④ 꿀 뜨기가 안 열림'); else { const e = await ev(([a, c]) => __fin(a, c), [1, 2]); see(o.lab.t, e.lines);
      ok(e.lines.length === 1 && e.lines[0] === '🏅 이번 꿀 칸 2칸. 내 최고까지 1칸 남았어요', '④ 다섯 갈래 밖(꿀 뜨기) = 첫 줄만 새 글 · 조건 글 없음 「' + e.lines.join('」「') + '」 · 창 위 「' + o.lab.t + '」'); await ev(() => __shut()); } }

    // ── ⑦⑧ 연습 판 ──
    console.log('⑦⑧ 연습 판(하루 몫을 다 받은 뒤)');
    const toasts = async ms => { await W8(ms); return ev(() => __tl.slice()); }, tclr = () => ev(() => { __tl.length = 0; });
    await ev(() => __fresh('strawberry')); let nReal = 0, pr = null; const gain = [];
    for (let i = 0; i < 8 && !pr; i++) { await tclr(); const o = await ev(() => __open('strawberry', undefined, true)); if (o.none) break; if (o.pr) { pr = o; break; }
      const b0 = await ev(() => __bag()); await ev(([a, c]) => __fin(a, c), [3, 5 + i]); await ev(() => __shut()); await W8(250); const b1 = await ev(() => __bag()); gain.push(b1.n - b0.n + (b1.m - b0.m)); nReal++; }
    ok(!!pr && nReal === 3, '⑧ 진짜 판 ' + nReal + '판 뒤 넷째 판부터 연습 판');
    ok(gain.length > 0 && gain.every(g => g > 0), '⑧ 진짜 판은 받음(가방·돈 늘어난 수 ' + JSON.stringify(gain) + ')');
    if (pr) { const t0 = await toasts(1200), T1 = '😊 오늘 여기서 받을 것은 다 받았어요. 이번 판은 연습이에요. 내 최고 기록은 연습 판에서도 남아요'; see(t0.filter(t => /연습|받는 것은/.test(t)));
      ok(t0.includes(T1), '⑦ 연습 판 시작 알림 「' + (t0.find(t => /이번 판은 연습/.test(t)) || t0.join(' | ')) + '」');
      const b0 = await ev(() => __bag()), m0 = await ev(() => SM_TOWN.lad().mg.strawberry), said = await ev(() => { const R = __G.S.rw; return !!(R && R.r && R.r.said && (R.r.said.bag || R.r.said.money)); });
      const e = await ev(([a, c]) => __fin(a, c), [1, 30]); see(e.lines); ok(e.st.best.n === 30 && e.st.best.lv === m0.lv && e.st.n === m0.n + 1 && /^🏅 새 내 최고!/.test(e.lines[0] || '') && endOk(e, '연습 판'), '⑦ 연습 판에서도 새 내 최고가 저장됨(「' + e.lines.join('」「') + '」 · 판 수 ' + m0.n + ' → ' + e.st.n + ')');
      await tclr(); await ev(() => __shut()); const t1 = await toasts(1200), b1 = await ev(() => __bag()), T2 = '연습 판이라 받은 것은 없어요. ' + (said ? '받는 것은 내일 다시 생겨요' : '받는 것은 내일 아침 6시에 다시 생겨요'); see(t1.filter(t => /연습|받는 것은/.test(t)));
      ok(b1.j === b0.j && b1.m === b0.m, '⑧ 연습 판은 받는 것 0(가방·돈 그대로)'); ok(t1.includes(T2), '⑦ 연습 판 끝 알림 「' + (t1.find(t => /받는 것은/.test(t)) || t1.join(' | ')) + '」');
      /* 같은 일을 여러 곳에서 채운 날 = 「이 일로」 · 놀다가 그만 = 「다음에 또 해요!」 */
      await ev(() => { __G.S.uses = { 'wd:strawberry': 99 }; }); await tclr(); const o2 = await ev(() => __open('strawberry', undefined, true)), t2 = await toasts(1200); see(t2.filter(t => /연습|받는 것은/.test(t)));
      ok(o2.pr && t2.includes('😊 오늘 이 일로 받을 것은 다 받았어요. 이번 판은 연습이에요. 내 최고 기록은 연습 판에서도 남아요'), '⑦ 일 갈래 하루 몫을 다 쓴 날 = 「이 일로」 「' + (t2.find(t => /이번 판은 연습/.test(t)) || t2.join(' | ')) + '」');
      await tclr(); await ev(() => __shut()); const t3 = await toasts(1200); see(t3.filter(t => /연습|받는 것은|다음에/.test(t))); ok(t3.includes('다음에 또 해요! 받는 것은 내일 아침 6시에 다시 생겨요') || (said && t3.includes('다음에 또 해요! 받는 것은 내일 다시 생겨요')), '⑦ 연습 판을 [그만]으로 닫음 「' + (t3.find(t => /다음에/.test(t)) || t3.join(' | ')) + '」');
      /* 실제 날짜 총량에 닿은 날(깃발)은 6시를 말하지 않음 */
      const flag = await ev(() => { const R = __G.S.rw; if (!R || !R.r || !R.r.said) return false; R.r.said.bag = 1; return true; });
      if (!flag) ok(false, '⑦ 총량 깃발 자리(S.rw.r.said)가 없음'); else { await ev(() => __open('strawberry', undefined, true)); await ev(([a, c]) => __fin(a, c), [1, 2]); await tclr(); await ev(() => __shut()); const t4 = await toasts(1200); see(t4.filter(t => /연습|받는 것은/.test(t)));
        ok(t4.includes('연습 판이라 받은 것은 없어요. 받는 것은 내일 다시 생겨요') && !t4.some(t => /받는 것은/.test(t) && /6시/.test(t)), '⑦ 하루 총량에 닿은 날은 「6시」를 말하지 않음 「' + (t4.find(t => /받는 것은/.test(t)) || t4.join(' | ')) + '」'); await ev(() => { delete __G.S.rw.r.said.bag; }); }
      /* 다음 날 = 다시 진짜 판 */
      await ev(() => { __G.S.uses = { ['wd:strawberry']: 99 }; }); const d0 = await ev(() => __G.S.day); await ev(() => { __G.sleep(); __G.S.min = 11 * 60; __panels(); }); await W8(400); await ev(() => __panels());
      const o5 = await ev(() => __open('strawberry', undefined, true)), d1 = await ev(() => ({ d: __G.S.day, u: Object.keys(__G.S.uses || {}).length })); ok(!o5.none && o5.pr === false && d1.d === d0 + 1, '⑧ 다음 날 아침(잠 = 6시)에는 다시 진짜 판(날 ' + d0 + ' → ' + d1.d + ' · 연습 ' + o5.pr + ')'); await ev(() => __shut()); }

    // ── ⑨ 이야기 판 ──
    console.log('⑨ 이야기 「같이 일하기」 판');
    { await ev(i9 => SM_TOWN.storyAt('c4', i9), ix('c4', 'get')); await W8(400); await ev(() => __panels()); await p.keyboard.press('Escape'); await W8(300);
      const P0 = { lv: 2, z: 0, n: 2, best: { lv: 2, g: 1, n: 3 }, last: { lv: 2, g: 1, n: 3 } };
      await ev(s9 => { const B = __G.S.bag; for (const e of ['🥔', '🥬', '🧂']) delete B[e]; __G.S.uses = {}; __G.S.min = 11 * 60; __mg().potato = s9; }, P0); await ev(() => SM_TOWN.rules.work('potato')); await W8(400);
      const s = await ev(() => { const L9 = SM_TOWN.lad(); return L9.play ? { k: L9.play.k, st: L9.play.st, pr: L9.play.pr, lv: L9.play.lv, lab: __lab() } : null; });
      ok(s && s.k === 'potato' && s.st && !s.pr && s.lv === 1 && !s.lab.has, '⑨ 이야기 판 = 1칸 고정 · 창 위 줄 없음 ' + JSON.stringify(s && { st: s.st, lv: s.lv, 줄: s.lab.has }));
      const e = s ? await ev(([a, c]) => __fin(a, c), [1, 3]) : null; await ev(() => __shut()); const g9 = await ev(() => SM_TOWN.lad().mg.potato);
      ok(e && e.lines.length === 0 && JSON.stringify(g9) === JSON.stringify(P0), '⑨ 이야기 판 = 기록 줄 없음 · 기록 안 셈 ' + JSON.stringify(g9)); await ev(() => SM_TOWN.storyOff()); await W8(300); await ev(() => __panels()); }

    // ── ⑩ 영어 ──
    console.log('⑩ 영어 · 금지어 · 오류');
    { await ev(() => SM_TOWN.setLang('en')); await W8(300);
      const o1 = await ev(() => __open('strawberry', null)); await ev(() => __shut());
      const o2 = await ev(([s9]) => __open('strawberry', s9), [B13]), e2 = o2.none ? { lines: [] } : await ev(([a, c]) => __fin(a, c), [1, 2]); await ev(() => __shut()); see(o1.lab && o1.lab.t, o2.lab && o2.lab.t, e2.lines);
      ok(o1.lab && o1.lab.t === 'Challenge step 1. Do very well and step 2 opens' && o1.lab.rows === 1, '⑩ 영어 처음 줄 「' + (o1.lab && o1.lab.t) + '」');
      ok(o2.lab && (o2.lab.t === 'Challenge step 1. My best: 3 strawberries' || o2.lab.t === 'Challenge step 1') && o2.lab.rows === 1, '⑩ 영어 창 위 줄 「' + (o2.lab && o2.lab.t) + '」');
      ok(e2.lines[0] === '🏅 This time: 2 strawberries. 1 more to reach my best' && e2.lines[1] === 'Next step: 4 in the order box, no green berries tapped' && e2.rows.every(r => r === 1), '⑩ 영어 끝 창 「' + e2.lines.join('」「') + '」 (보이는 줄 ' + JSON.stringify(e2.rows) + ')');
      for (const k of FIVE) { const o = await ev(([k9, s9]) => __open(k9, s9), [k, st1(1, 1, NB[k])]), e = o.none ? { lines: [], rows: [] } : await ev(([a, c]) => __fin(a, c), [1, NB[k] - 1]);
        const b9 = { lv: 1, g: 1, n: NB[k] }, old = L.recLines(k, KIND[k], k, { neu: false, first: false, best: b9, last: { lv: 1, g: 1, n: NB[k] - 1 }, prev: b9, next: 0, down: false, lv: 1, end: false }, true)[0], ro = o.none ? [0] : await ev(A => __probe(A), [old]);   /* 영어 첫 줄은 기록 이름이 길면(Cabbages sorted right) 예전 글도 두 줄 → '예전 글보다 안 늘어남'으로 견줌 */
        await ev(() => __shut()); see(o.lab && o.lab.t, e.lines);
        const nk = ((COND[k] || '').match(/(\d+)/) || [])[1], ne = ((e.lines[1] || '').match(/(\d+)/) || [])[1];
        ok(e.lines.length === 2 && /^Next step: /.test(e.lines[1]) && nk && nk === ne && e.rows[1] === 1 && ro && e.rows[0] <= ro[0] && o.lab.rows === 1, '⑩ 영어 ' + k + ' 「' + (o.lab && o.lab.t) + '」 · 끝 창 「' + e.lines.join('」「') + '」 = 조건 글 한 줄 · 첫 줄 ' + e.rows[0] + '줄(예전 글 ' + (ro && ro[0]) + '줄보다 안 늘어남) · 조건 수가 한글 글과 같음(' + nk + ')'); }
      await ev(() => SM_TOWN.setLang('ko')); await W8(300); }
    { const hit = SEEN.filter(t => BAN.test(t)); ok(!hit.length, '⑩ 견주는 말·빈 칭찬 0(본 글 ' + SEEN.length + '줄)' + (hit.length ? ' — ' + hit.slice(0, 3).join(' / ') : '')); }

    // ── 사진(--shots) ──
    if (OUT) { fs.mkdirSync(OUT, { recursive: true }); const sp = await ctx.newPage(); await sp.setViewportSize({ width: 1720, height: 900 });
      for (const g of Object.keys(SH)) { const col = /-start$/.test(g) ? 1 : 2;
        await sp.setContent('<body style="margin:0;padding:8px;background:#6b6b6b;display:grid;grid-template-columns:repeat(' + col + ',max-content);gap:8px;align-items:start;width:max-content">' + SH[g].map(a => '<figure style="margin:0"><figcaption style="font:700 14px sans-serif;color:#fff;padding:2px 0">' + g + ' · ' + a.tag + '</figcaption><img src="data:image/png;base64,' + a.buf.toString('base64') + '"></figure>').join('') + '</body>');
        await sp.waitForTimeout(200); await sp.screenshot({ path: path.join(OUT, g + '.png'), fullPage: true }); }
      await sp.close(); console.log('  사진 ' + Object.keys(SH).length + '장(+ 전체 화면 둘) → ' + OUT);
      /* 휴대폰 세로(375×812) — 딸기 2칸 */
      const c2 = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }), q = await c2.newPage(); watch(q); await boot(q);
      const o = await q.evaluate(([s9]) => __open('strawberry', s9), [st1(2, 1, 3)]); await q.waitForTimeout(400); await q.screenshot({ path: path.join(OUT, 'phone-start.png') });
      const e = o.none ? null : await q.evaluate(([a, c]) => __fin(a, c), [1, 2]); await q.screenshot({ path: path.join(OUT, 'phone-end.png') });
      ok(o.lab && o.lab.rows === 1 && e && e.lines.length === 2 && e.btn.length === 1 && e.pb.b <= e.ih + 1 && e.pb.x >= 0 && e.pb.x + e.pb.w <= e.iw + 1, '휴대폰 세로 375×812 딸기 2칸: 창 위 「' + (o.lab && o.lab.t) + '」(' + (o.lab && o.lab.rows) + '줄) · 끝 창 줄 ' + JSON.stringify(e && e.rows) + ' · 판 ' + JSON.stringify(e && e.pb) + ' / 화면 ' + (e && e.iw) + '×' + (e && e.ih));
      await q.evaluate(() => __shut()); await c2.close(); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
function SM_TOWN_NULL(v) { return v == null; }
