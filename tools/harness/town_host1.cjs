// ⏰ 방장 시계(HOST-1 · 교사 11-14 '같이하기 할 때는 시간 같은 거는 방장 기준으로') 시험: node tools/harness/town_host1.cjs [마을=ourtown] [포트=9031]
//   진짜 Firebase에 시험 방 하나(이름 'zz …' · 25분 · 끝나면 닫고 사람 칸을 지움) · 브라우저 하나에 창 셋(방장 H · 손님 A = 먼저 들어옴 · 손님 B) — 저장·방 기억은 창마다 따로(newContext) · 자리 서버(Cloudflare)는 끔(cf=off)
//   ① 셋 다 마을 · H = 주인 · A·B = 손님(주인 = H) · 셋의 시각 차이 1분(게임 분) 안 · 손님 시계 칩에 '방장 시계'
//   ② H가 날씨를 비로 → A·B 그날 날씨 비 · H 시계 멈춤 → A도 멈춤 · 다시 흐름
//   ③ 손님 A의 잠 = 「방장만」 한 줄 · 날짜 그대로 · 손님 시계 멈추기도 그대로
//   ④ H가 잠 → A·B 날짜 +1 · 아침 · 「방장이 잠들어서」 · 12초 더 지나도 +1 그대로(보상 두 번 X) · 시각 차이 1분 안
//   ⑤ H 창을 닫음 → 30초 안에 먼저 들어온 A가 주인 · B는 A를 따름 · A 시계는 이어 흐름(튐 X)
//   ⑥ B가 방을 나감 → B 시계가 그 자리에서 이어 흐름(튐 X) · 날씨 그대로
//   ⑦ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '9031';
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const req = async (p, m = 'GET', d) => { const r = await fetch(DB + p + '.json', { method: m, body: d == null ? undefined : JSON.stringify(d) }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + m + ' ' + p); return r.json().catch(() => null); };
const rand = n => Array.from({ length: n }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
const SPM = 0.7;
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const W8 = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let c = null; for (let i = 0; i < 25 && !c; i++) { const t = String(1000 + Math.floor(Math.random() * 9000)); const p = await req('/codes/' + t); if (!p || !(p.e > Date.now())) c = t; }
  const rid = 'zz' + rand(8), key = rand(24), e = Date.now() + 25 * 60e3, name = 'zz 시험방 HOST-1', SV = { '.sv': 'timestamp' };
  await req('/keys/' + rid, 'PUT', key); await req('/lobby/' + rid, 'PUT', { n: name, e, t: SV }); await req('/codes/' + c, 'PUT', { r: rid, e, t: SV });
  console.log('   시험 방 ' + c + ' (' + rid + ')');
  const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
  const errs = [], P = {};
  const URL = q => 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&cf=off' + (q || '');
  async function open(tag, nm, owner) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(([nm9, room9]) => { try { localStorage.setItem('mp.name', nm9); if (room9) localStorage.setItem('mp.room', room9); } catch (e9) { /* */ }
      window.__TL = []; setInterval(() => { for (const id of ['toast', 'hudBan']) { const el = document.getElementById(id), tx = el && el.style.display !== 'none' ? (el.textContent || '').trim() : ''; if (tx && !window.__TL.includes(tx)) window.__TL.push(tx); } }, 100); }, [nm, owner ? JSON.stringify({ c, r: rid, n: name, e, k: key }) : null]);
    const p = await ctx.newPage(); p.tag = tag;
    p.on('pageerror', er => errs.push(tag + ': ' + er.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource|firebase|EventSource/i.test(m.text())) errs.push(tag + ' console: ' + m.text().slice(0, 200)); });
    await p.goto(URL(owner ? '' : '&code=' + c));
    await p.waitForFunction(() => window.SM_MP && SM_MP.room() && SM_MP.net() && SM_MP.net().srvOk, null, { timeout: 90000 });
    P[tag] = p; return p;
  }
  const ev = (p, f, a) => p.evaluate(f, a);
  const st = p => ev(p, () => { const H = window.SM_HOST, G = window.SM_TOWN && SM_TOWN.game(); return { id: SM_MP.net() ? SM_MP.net().id : null, st: H ? H.st() : null, day: G ? G.S.day : -1, m: G ? G.minF() : -1, t: Date.now(), clock: G ? G.S.clock : null, wx: SM_TOWN.wx ? SM_TOWN.wx().WX9 : null, ct: G ? G.clockText(false) : '', ph: G ? G.phase : '', mp: document.body.classList.contains('mp-in') }; });
  const shut = async p => { for (let i = 0; i < 8; i++) { const n = await ev(p, () => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 1; } const d = document.querySelector('.twn-dlg'); if (d) return 2; if (document.querySelector('.twn-p')) return 3; return 0; }); if (!n) return; if (n === 2) await p.keyboard.press('KeyE'); if (n === 3) await p.keyboard.press('Escape'); await p.waitForTimeout(350); } };
  const until = async (fn, ms, step = 500) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return Date.now() - t0; await W8(step); } return -1; };
  const sync = (L) => { const T0 = L[0].t; return L.map(q => q.m + (T0 - q.t) / 1000 / SPM); };   /* 같은 순간으로 맞춘 시각(분) */
  try {
    const H = await open('H', 'zz방장', true), A = await open('A', 'zz손님1', false), B = await open('B', 'zz손님2', false);
    for (const p of [H, A, B]) { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SM_HOST, null, { timeout: 300000 }); }
    await W8(2500); for (const p of [H, A, B]) await shut(p);
    /* ① */
    console.log('① 주인 고르기 · 시각');
    const ids = {}; for (const p of [H, A, B]) ids[p.tag] = (await st(p)).id;
    const tR = await until(async () => { const [h, a, bb] = [await st(H), await st(A), await st(B)]; return h.st.role === 'master' && a.st.role === 'guest' && bb.st.role === 'guest' && a.st.mid === ids.H && bb.st.mid === ids.H; }, 40000);
    { const [h, a, bb] = [await st(H), await st(A), await st(B)]; ok(tR >= 0, 'H = 주인 · A·B = 손님(주인 = H) — ' + tR + 'ms · ' + [h.st.role, a.st.role, bb.st.role].join('/'));
      ok(a.st.joinTs > h.st.joinTs && bb.st.joinTs > a.st.joinTs, '들어온 차례 H < A < B (' + [h.st.joinTs, a.st.joinTs, bb.st.joinTs].map(x => x % 100000).join(' < ') + ')');
      ok(/방장 시계/.test(a.ct) && /방장 시계/.test(h.ct), '시계 글: A「' + a.ct + '」 · H「' + h.ct + '」'); }
    await W8(3000);
    let worst = 0; const LOG = []; for (let k = 0; k < 3; k++) { const L = [await st(H), await st(A), await st(B)], S = sync(L); LOG.push(S.map(x => x.toFixed(2)).join('/') + (L[1].st.host ? ' p' + (L[1].st.host.p ? 1 : 0) : '')); worst = Math.max(worst, Math.abs(S[1] - S[0]), Math.abs(S[2] - S[0])); await W8(2000); }
    if (worst >= 1) console.log('    H/A/B 분: ' + LOG.join(' · ') + ' · H ' + JSON.stringify((await st(H)).st));
    ok(worst < 1, '셋의 시각 차이 ' + worst.toFixed(2) + '분 < 1');
    /* ② */
    console.log('② 날씨');
    await ev(H, () => (SM_TOWN.rules && SM_TOWN.rules.wx ? SM_TOWN.rules.wx('rain') : SM_TOWN.weather('rain')));
    const tW = await until(async () => (await st(A)).wx === 'rain' && (await st(B)).wx === 'rain', 8000);
    ok(tW >= 0, 'H 비 → A·B 비 (' + tW + 'ms)');
    { await ev(H, () => SM_TOWN.game().setClock(false)); await W8(2500); const a0 = await st(A); await W8(2500); const a1 = await st(A); await ev(H, () => SM_TOWN.game().setClock(true)); await W8(2500); const a2 = await st(A);
      ok(Math.abs(a1.m - a0.m) < 0.2 && /⏸/.test(a1.ct) && a2.m > a1.m + 1, 'H 시계 멈춤 → A도 멈춤(' + (a1.m - a0.m).toFixed(2) + '분 · 「' + a1.ct + '」) → 다시 흐름(+' + (a2.m - a1.m).toFixed(2) + '분)'); }
    /* ③ */
    console.log('③ 손님 잠 = 방장만');
    { const a0 = await st(A); await ev(A, () => { window.__TL.length = 0; SM_TOWN.sleep(); SM_TOWN.game().setClock(false); }); await W8(900); const a1 = await st(A); await until(async () => (await ev(A, () => window.__TL.some(x => /방장만/.test(x)))), 10000, 250); const tl = await ev(A, () => window.__TL.filter(x => /방장|⏰/.test(x)));
      ok(a1.day === a0.day, 'A 잠 → 날짜 그대로(' + a0.day + ' → ' + a1.day + ')'); ok(tl.some(x => /방장만/.test(x)), 'A 「방장만」 한 줄: ' + JSON.stringify(tl.slice(0, 2))); ok(a1.clock === true, 'A 시계 멈추기도 그대로'); }
    /* ④ */
    console.log('④ 방장 잠 → 모두 아침');
    for (const p of [A, B]) await shut(p);
    { const h0 = await st(H), a0 = await st(A), b0 = await st(B); await ev(A, () => { window.__TL.length = 0; }); await ev(H, () => SM_TOWN.sleep());
      const tH = await until(async () => (await st(H)).day === h0.day + 1, 15000); ok(tH >= 0, 'H 날짜 +1 (' + tH + 'ms)');
      const tN = await until(async () => (await st(A)).day === a0.day + 1 && (await st(B)).day === b0.day + 1, 55000);
      ok(tN >= 0, 'A·B 날짜 +1 (' + tN + 'ms · 창·놀이가 있으면 끝난 뒤 · 40초 넘으면 바로)');
      await W8(12000); const L = [await st(H), await st(A), await st(B)], S = sync(L), tl = await ev(A, () => window.__TL.slice());
      ok(L[1].day === a0.day + 1 && L[2].day === b0.day + 1, '12초 뒤에도 +1 그대로(한 밤만 · ' + [a0.day, L[1].day, b0.day, L[2].day].join('→') + ')');
      ok(Math.abs(S[1] - S[0]) < 1 && Math.abs(S[2] - S[0]) < 1 && L[1].m < 9 * 60, '아침 시각이 같음(H ' + (S[0] / 60).toFixed(2) + 'h · A ' + (S[1] / 60).toFixed(2) + 'h · B ' + (S[2] / 60).toFixed(2) + 'h)');
      ok(tl.some(x => /방장이 잠들어서/.test(x)), 'A 「방장이 잠들어서 아침」: ' + JSON.stringify(tl.filter(x => /방장|아침/.test(x)).slice(0, 2))); }
    /* ⑤ */
    console.log('⑤ 방장 창을 닫음 → 먼저 들어온 손님이 주인');
    { const a0 = await st(A); await H.close(); const tF = await until(async () => { const a = await st(A), bb = await st(B); return a.st.role === 'master' && bb.st.role === 'guest' && bb.st.mid === ids.A; }, 35000, 1000);
      const a1 = await st(A), bb = await st(B), flow = (a1.m - a0.m) - (a1.t - a0.t) / 1000 / SPM, S = sync([a1, bb]);
      ok(tF >= 0 && tF <= 30000, '30초 안에 A = 주인 · B는 A를 따름 (' + tF + 'ms · ' + a1.st.role + '/' + bb.st.role + ')');
      ok(Math.abs(flow) < 2, 'A 시계 이어 흐름(튐 ' + flow.toFixed(2) + '분)'); ok(Math.abs(S[1] - S[0]) < 1, 'B = A 시각(차이 ' + Math.abs(S[1] - S[0]).toFixed(2) + '분)');
      ok(/방 시계/.test(bb.ct), 'B 시계 글「' + bb.ct + '」(먼저 온 친구 = 방 시계)'); }
    /* ⑥ */
    console.log('⑥ 손님이 방을 나감 → 제 시계로 이어 흐름');
    await shut(B); { const b0 = await st(B); await ev(B, () => SM_MP.open()); await B.waitForTimeout(600); const bL = await st(B); await ev(B, () => { const x = document.querySelector('.lb-pop [data-l="out"]'); if (x) x.click(); return !!x; });
      await until(async () => (await st(B)).st.role === '', 4000, 100); const bR = await st(B); await W8(2500); const b1 = await st(B), flow = (bR.m - bL.m) - (bR.t - bL.t) / 1000 / SPM;   /* 튐 = 나가기 바로 앞 ↔ 따르기가 끝난 바로 뒤(그 뒤 내 시계 빠르기는 내 기기 몫) */
      ok(!b1.mp && b1.st.role === '' && !b1.st.host, 'B 방 밖 · 따르기 끝(' + JSON.stringify({ mp: b1.mp, role: b1.st.role }) + ')');
      ok(Math.abs(flow) < 1 && b1.m >= bR.m, 'B 시계 그 자리에서 이어 흐름(튐 ' + flow.toFixed(2) + '분 · 그 뒤 ' + (b1.m - bR.m).toFixed(2) + '분 흐름)'); ok(b1.wx === b0.wx, 'B 날씨 그대로(' + b0.wx + ' → ' + b1.wx + ')'); ok(!/방장 시계|방 시계/.test(b1.ct), 'B 시계 글에서 꼬리표 빠짐「' + b1.ct + '」'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (er) { fails++; console.log('  ✗ 시험 멈춤: ' + er.message.slice(0, 300)); if (errs.length) console.log('    오류: ' + errs.slice(0, 4).join(' | ')); }
  finally {
    try { await b.close(); } catch (er) { /* 이미 닫힘 */ } await W8(1500);   /* 창을 먼저 닫음(나가며 제 칸을 지움) → 남은 칸 정리 */
    try { await req('/rooms/c' + c + '/ctl', 'DELETE'); await req('/rooms/c' + c + '/chat', 'DELETE'); } catch (er) { /* 없음 */ }
    try { const pl = await req('/rooms/c' + c + '/players'); for (const pid of Object.keys(pl || {})) await req('/rooms/c' + c + '/players/' + pid, 'DELETE').catch(() => {}); } catch (er) { /* */ }
    try { await req('/lobby/' + rid + '/x/' + key, 'PUT', true); console.log('   시험 방 닫음 ' + c); } catch (er) { console.log('   방 닫기 실패: ' + er.message); }
  }
  console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
