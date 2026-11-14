// 우리 반 함께(CLASS-MP · 11-14) 시험: node tools/harness/town_classmp.cjs [화면 포트=8951] [방 서버=http://127.0.0.1:8953] [--net](net 쪽만) [--town](마을 쪽만)
//   로컬 방 서버(wrangler dev)만 — 시험 반 zz… · 배포 서버에는 쓰지 않음 · 끝나면 시험 판을 지움
//   가. net 쪽(net_cls.html · 화면 둘 넷): ① 반 코드·번호의 두 아이가 서로 보임 · 머리 위 '○번' · Firebase 요청 0(fetch·EventSource) ② 이모트 번호만 웹소켓으로 · 자유 글은 서버가 버림
//      ③ 가만히 6분(시계를 당김)이어도 안 숨음 ④ 표 없음·틀린 표 = 못 들어옴(4004) · 표 없이 예전 꼴로 바로 붙어도 4004 · 보낸 번호(u)는 버리고 표의 번호
//      ⑤ 같은 번호가 다른 기기로 = 먼저 것 4005 + 한 줄 ⑥ 지금 배포된 화면(입장표를 모름 · git 08c21b40 net.js)이 새 서버의 예전 방에서 새 화면과 서로 보임
//   나. 마을 쪽(v2/?town=ourtown&login=1&cls=zz…): ⑦ 두 아이(3번·4번)가 마을에서 저절로 붙음 · 몸·이름표 '4번' · 작은 지도 점 · 메뉴 줄 · /metaverse/rooms Firebase 요청 0
//      ⑧ 선생님 「우리 반 함께 보기」 끔(/tset) = 안 붙음 ⑨ ?mp=off = 안 붙음 ⑩ 반 코드 없는 판 = 아예 안 켬(SM_CLS 없음)
const { chromium } = require('./pw.cjs');
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const AR = process.argv.slice(2), PORT = AR.find((a) => /^\d+$/.test(a)) || '8951', CF = AR.find((a) => /^http/.test(a)) || 'http://127.0.0.1:8953', ONLY = AR.includes('--net') ? 'net' : AR.includes('--town') ? 'town' : '';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d{1,5}$/.test(CF)) { console.log('로컬 방 서버 주소만 받아요(배포 서버 X)'); process.exit(2); }
const ROOT = path.join(__dirname, '..', '..'), OLD = path.join(ROOT, 'v2', 'js', 'net_oldcmp.js'), OLD_REV = '08c21b40', ORIGIN = 'http://127.0.0.1:' + PORT;
const api = async (p, body) => { const r = await fetch(CF + p, { method: 'POST', headers: { Origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { st: r.status, j }; };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [], R = {}, bad = [], r = Math.random().toString(36).slice(2, 6), CLS = 'zzc' + r, saved = [];
  const ok = (name, cond, val) => { R[name] = val === undefined ? !!cond : val; if (!cond) bad.push(name); };
  const pre = async (n, pin) => { const q = await api('/save/' + CLS + '/' + n, { pin, data: { zz: 1 } }); saved.push([n, pin]); return q.j && q.j.mp; };   /* 판 없는 시험 판(v 없음 = 마을이 자기 판을 지킴) — 표만 받음 */
  let oldMade = false;
  try {
    if (ONLY !== 'town') {
      const ctx = await b.newContext(), U = (o) => ORIGIN + '/tools/harness/net_cls.html?' + new URLSearchParams({ cf: CF, ...o });
      const open = async (o, wait = 'ok') => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(o.me + ': ' + e.message)); await p.goto(U(o)); await p.waitForFunction(wait === 'gone' ? () => window.READY && window.N.cf.gone : () => window.READY && window.N.cf.ok, null, { timeout: 20000 }); return p; };
      const st = (p) => p.evaluate(() => ({ cf: window.N.cf, peers: window.N.cfPeers(), count: window.N.count, fbn: window.FBN, es: window.ES.length, notes: window.NOTES.slice() }));
      const T3 = await pre(3, '1111'), T4 = await pre(4, '2222'), T5 = await pre(5, '3333'), T6 = await pre(6, '4444');
      ok('표를 받음(/save 답)', T3 && /^c[0-9a-f]{7}$/.test(T3.r) && T4.r === T3.r && T3.u === 3 && T4.u === 4, { r: T3 && T3.r, u: [T3 && T3.u, T4 && T4.u] });
      /* ① */
      const A = await open({ me: 'ca' + r, cr: T3.r, tk: T3.tk, move: 1 }), B = await open({ me: 'cb' + r, cr: T4.r, tk: T4.tk }); await A.waitForTimeout(3000);
      let sA = await st(A), sB = await st(B); const pa = sB.peers.find((q) => q.id === 'ca' + r) || {}, pb = sA.peers.find((q) => q.id === 'cb' + r) || {};
      ok('①B가 A를 봄 · 머리 위 3번', pa.ws && pa.has && pa.vis && pa.n === '3번', pa);
      ok('①A가 B를 봄 · 머리 위 4번', pb.ws && pb.vis && pb.n === '4번', pb);
      ok('①Firebase 요청 0(fetch · EventSource)', sA.fbn === 0 && sA.es === 0 && sB.fbn === 0 && sB.es === 0, { A: [sA.fbn, sA.es], B: [sB.fbn, sB.es] });
      ok('①사람 수 2 · 반 방 · 10번', sA.count === 2 && sB.count === 2 && sA.cf.cls && sA.cf.room === T3.r && sA.cf.hz === 10, { count: [sA.count, sB.count], room: sA.cf.room, hz: sA.cf.hz });
      /* ② 이모트 */
      await A.evaluate(() => window.N.emote(2)); await B.waitForTimeout(500); const emo = await B.evaluate(() => window.emoSeen());
      ok('②이모트가 웹소켓으로 감(Firebase X)', emo === 1 && (await A.evaluate(() => window.FBN)) === 0, emo);
      const g5 = await B.evaluate(([room, tk]) => window.raw({ room, j: { t: 'j', id: 'g5', n: '이름', k: 'kid', c: 1, a: 't:다7', u: 40, tk }, p: 1 }), [T5.r, T5.tk]);
      const g6 = await B.evaluate(([room, tk]) => window.raw({ room, j: { t: 'j', id: 'g6', n: '', k: 'kid', c: 2, a: 't:다7', tk } }), [T6.r, T6.tk]);
      await B.evaluate((i) => window.rawSend(i, { t: 'e', m: 4, tx: '자유 글', q: 'x' }), g6); await B.waitForTimeout(500);
      const m5 = await B.evaluate((i) => window.rawGet(i), g5), eMsg = m5.msgs.filter((s) => s.includes('"t":"e"')), j5 = (await st(B)).peers.find((q) => q.id === 'g5') || {};
      ok('②자유 글은 서버가 버림(이모트 번호만)', eMsg.length === 1 && !/자유 글|"q"/.test(eMsg[0]) && /"m":4/.test(eMsg[0]), eMsg);
      ok('②보낸 번호(u 40)·이름은 버리고 표의 번호(5번)', j5.n === '5번' && !m5.msgs.some((s) => s.includes('이름')), { n: j5.n });
      /* ④ 표 없음·틀린 표 */
      const C = await open({ me: 'cc' + r, cr: T3.r, tk: T3.tk.replace(/^3\./, '9.') }, 'gone'), D = await open({ me: 'cd' + r, cr: T3.r, tk: '' }, 'gone');
      const gO = await B.evaluate((room) => window.raw({ room, j: { t: 'j', id: 'gold', n: '' } }), T3.r); await B.waitForTimeout(300);
      const oc = await B.evaluate((i) => window.rawGet(i), gO); sB = await st(B);
      ok('④틀린 표·표 없음 = 못 들어옴 · 예전 꼴 손님 4004', (await C.evaluate(() => window.N.cf.ok)) === false && (await D.evaluate(() => window.N.cf.ok)) === false && oc.code === 4004 && sB.count === 4, { old: oc.code, count: sB.count });
      await C.close(); await D.close();
      /* ③ 가만히 6분 */
      await A.evaluate(() => { window.move = false; }); await A.waitForTimeout(800); await B.evaluate(() => { window.SHIFT += 6 * 60 * 1000; }); await B.waitForTimeout(1500);
      sB = await st(B); const pa6 = sB.peers.find((q) => q.id === 'ca' + r) || {};
      ok('③가만히 6분이어도 안 숨음', pa6.vis && sB.count === 4 && sB.cf.ok, { vis: pa6.vis, count: sB.count, ok: sB.cf.ok });
      /* ⑤ 같은 번호 두 기기 */
      const A2 = await open({ me: 'cz' + r, cr: T3.r, tk: T3.tk }); await A.waitForTimeout(1500); sA = await st(A); const sA2 = await st(A2);
      ok('⑤같은 번호가 다른 기기로 = 먼저 것 나감 + 한 줄', sA.cf.gone && !sA.cf.ok && sA.notes.join() === 'dev' && sA2.cf.ok && sA2.peers.some((q) => q.n === '4번'), { gone: sA.cf.gone, notes: sA.notes, A2: sA2.cf.ok });
      { const s3 = await st(B); ok('⑤셋째 화면(B)에서 옛 몸(A)이 사라짐 · 새 3번(A2)은 보임', !s3.peers.some((q) => q.id === 'ca' + r) && s3.peers.some((q) => q.id === 'cz' + r && q.n === '3번'), s3.peers.map((q) => q.id + ':' + q.n)); }   /* CLASS-MP-B */
      for (const p of ctx.pages()) await p.close();
      /* ⑥ 지금 배포된 화면(입장표를 모름)이 예전 방에서 */
      try { fs.writeFileSync(OLD, execSync('git show ' + OLD_REV + ':v2/js/net.js', { cwd: ROOT, encoding: 'utf8' })); oldMade = true; } catch (e) { /* 없으면 건너뜀 */ }
      if (oldMade) { const O = await open({ me: 'oo' + r, r, old: 1, move: 1 }), Nw = await open({ me: 'nn' + r, r }); await O.waitForTimeout(3000);
        const sO = await st(O), sN = await st(Nw), pO = sN.peers.find((q) => q.id === 'oo' + r) || {}, pN = sO.peers.find((q) => q.id === 'nn' + r) || {};
        ok('⑥옛 화면 ↔ 새 화면(새 서버 · 예전 방 m…) 서로 보임', pO.ws && pO.vis && pN.ws && pN.vis && /^m/.test(sO.cf.room) && sO.cf.room === sN.cf.room && sN.cf.hz === 10, { oldSeen: pO.vis, newSeen: pN.vis, room: sO.cf.room, dl: pO.dl, iv: pO.iv });
        const dl = await Nw.evaluate(() => new Promise((res) => setTimeout(() => res(window.N.cfPeers()[0]), 2500))); ok('⑥10번 단계 늦게 그리기 = 100ms(예전으로)', dl && dl.dl <= 110, dl && { dl: dl.dl, iv: dl.iv }); }
      else ok('⑥옛 화면 꺼내기', false, 'git show 실패');
      await ctx.close();
    }
    if (ONLY !== 'net') {
      const TU = (o) => ORIGIN + '/v2/?town=ourtown&login=1&adapt=0&cf=' + encodeURIComponent(CF) + (o.cls === false ? '' : '&cls=' + CLS) + (o.q || '');
      const login = async (p, n, pin) => { await p.waitForSelector('button[data-n="' + n + '"]', { timeout: 120000 }); await p.click('button[data-n="' + n + '"]'); for (let k = 0; k < 2; k++) { for (const d of pin) await p.click('button[data-p="' + d + '"]'); await p.waitForTimeout(1200); if (await p.evaluate(() => !document.querySelector('button[data-p="1"]'))) break; } };
      const town = async (n, pin, o = {}) => { const ctx = await b.newContext(), p = await ctx.newPage(), fb = []; p.on('pageerror', (e) => errs.push('town' + n + ': ' + e.message.slice(0, 160))); p.on('request', (q) => { if (/firebasedatabase/.test(q.url())) fb.push(q.url().replace(/\?.*$/, '').slice(-80)); });
        await p.goto(TU(o)); await login(p, n, pin); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 240000 }); p.fb = fb; return p; };
      if (ONLY === 'town') { await pre(3, '1111'); await pre(4, '2222'); }
      /* ⑦ 두 아이 */
      const A = await town(3, '1111'), B = await town(4, '2222');
      await A.waitForFunction(() => window.SM_CLS && SM_CLS.net() && SM_CLS.net().cf.ok && SM_CLS.n >= 2, null, { timeout: 30000 }).catch(() => {}); await A.waitForTimeout(2500);
      const tw = (p) => p.evaluate(() => { const N = window.SM_CLS && SM_CLS.net(), F = window.SM_FRIENDS; return { on: !!N, ok: !!(N && N.cf.ok), n: window.SM_CLS ? SM_CLS.n : -1, peers: N ? N.cfPeers().map((q) => ({ n: q.n, vis: q.vis, w: q.w })) : [], fr: F ? F.stats : null, dots: F ? F.dots({ beginPath() {}, arc() {}, fill() {}, stroke() {} }, (x, z) => [x, z]) : -1, toast: (document.getElementById('toast') || {}).textContent || '' }; });
      const a = await tw(A), bb = await tw(B);
      ok('⑦마을 두 아이가 저절로 붙음(방 고르기 X)', a.ok && bb.ok && a.n === 2 && bb.n === 2, { a: [a.ok, a.n], b: [bb.ok, bb.n] });
      ok('⑦A 마을에 4번 몸·이름표·점', a.peers.some((q) => q.n === '4번' && q.vis) && a.fr && a.fr.n >= 1 && a.fr.tags >= 1 && a.dots >= 1, { peers: a.peers, fr: a.fr && { n: a.fr.n, tags: a.fr.tags }, dots: a.dots });
      ok('⑦B 마을에 3번', bb.peers.some((q) => q.n === '3번' && q.vis), bb.peers);
      const menu = await A.evaluate(() => { const b9 = document.querySelector('[data-tq="mp"]'); return b9 ? b9.textContent : null; });
      R['⑦메뉴 줄(☰ 열면)'] = menu;
      const fbRooms = [...A.fb, ...B.fb].filter((u) => /metaverse\/rooms/.test(u));
      ok('⑦함께하기 Firebase 요청 0(/metaverse/rooms)', fbRooms.length === 0, { rooms: fbRooms.length, other: [...new Set([...A.fb, ...B.fb])].slice(0, 4) });
      await A.context().close(); await B.context().close();
      /* ⑧ 선생님 끔 */
      await api('/tclaim/' + CLS, { tkey: 'zz-key-' + r }); const ts = await api('/tset/' + CLS, { tkey: 'zz-key-' + r, mp: 0 }); await pre(5, '3333');
      const C = await town(5, '3333'); await C.waitForTimeout(4000); const c = await tw(C);
      ok('⑧선생님이 끄면 안 붙음', ts.j && ts.j.mp === 0 && !!(await C.evaluate(() => window.SM_CLS)) && !c.on, { tset: ts.j && ts.j.mp, on: c.on }); await C.context().close();
      await api('/tset/' + CLS, { tkey: 'zz-key-' + r, mp: 1 }); await pre(6, '4444');
      /* ⑨ ?mp=off */
      const D = await town(6, '4444', { q: '&mp=off' }); await D.waitForTimeout(4000); const d = await tw(D);
      ok('⑨?mp=off = 안 붙음', !d.on && (await D.evaluate(() => (window.SM_CLS ? 1 : 0))) === 1, { on: d.on }); await D.context().close();
      /* ⑩ 반 코드 없는 판 */
      const E = await town(7, '5555', { cls: false }); await E.waitForTimeout(3000);
      ok('⑩반 코드 없는 판 = SM_CLS 없음', !(await E.evaluate(() => window.SM_CLS)), true); await E.context().close();
    }
  } catch (e) { errs.push('시험: ' + e.message.slice(0, 300)); }
  finally { if (oldMade) try { fs.unlinkSync(OLD); } catch (e) { /* */ } for (const [n, pin] of saved) await api('/drop/' + CLS + '/' + n, { pin }).catch(() => {}); }
  console.log(JSON.stringify({ cls: CLS, ...R, errs }, null, 1)); const pass = !bad.length && !errs.length; console.log(pass ? 'PASS' : 'FAIL ' + bad.join(' · ')); await b.close(); process.exit(pass ? 0 : 1); })();
