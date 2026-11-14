// 함께하기 30명이 한꺼번에(NET-CF3 · 11-14) 시험: node tools/harness/net_cf3.cjs [포트=8911] [방서버=http://127.0.0.1:8913]
//   로컬 방 서버(wrangler dev)만 — 손님 40명을 붙여 방을 꽉 채워 보므로 배포 서버에는 쓰지 않는다 · Firebase는 가짜(명단을 비워 둠)
//   ① 가짜 Firebase 명단이 비어 있어도 두 화면이 서로 보임(이름표 X · 목록엔 '친구') → 명단이 오면 이름을 합침 · 스트림이 죽어도(20초 넘게 조용) 그대로 보임
//   ② 사람 수 단계마다 보내기 빈도(8명까지 10 · 16명까지 6 · 그보다 많으면 4 · 방 놀이·대결 중엔 10) + 4번일 때 실제로 보낸 수 · 받는 쪽 지연 단계 · 단계가 바뀔 때 튐
//   ③ 마을에서 친구 14명 = 몸 10 · 작은 지도 점 14 · 경계에서 안 바뀜(가까이 온 친구가 그리던 친구의 0.8배 안으로 들어와야 바뀜) · 다른 세계 친구는 안 그림
//   ④ 옛 꼴 손님(모양 칸 없이 들어옴) = 오류 0 · Firebase 명단이 올 때까지 안 그림 → 오면 그림
//   ⑤ 방이 꽉 참(40명) = 글 한 번 · 다시 안 붙음
//   ⑥ 옛 화면(NET-CF3 앞 net.js)과 새 화면이 같은 방(새 서버)에서 서로 보임 — git에서 옛 파일을 잠깐 꺼내 씀(없으면 건너뜀)
const { chromium } = require('./pw.cjs');
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const PORT = process.argv[2] || '8911', CF = process.argv[3] || 'http://127.0.0.1:8913', ROOT = path.join(__dirname, '..', '..'), OLD = path.join(ROOT, 'v2', 'js', 'net_old9.js'), OLD_REV = '426026b3';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d{1,5}$/.test(CF)) { console.log('로컬 방 서버 주소만 받아요(배포 서버 X)'); process.exit(2); }
const FULL = '오늘은 함께하기가 꽉 찼어요. 혼자서는 그대로 놀 수 있어요';
const fit = (L, T0, maxLag) => { const good = L.filter((q) => q[1] === q[1]); let best = { lag: -1, e: 99 };
  for (let lag = 0; lag <= maxLag; lag += 10) { let e = 0; for (const [now, x, z] of good) { const tA = (now - T0 - lag) / 1000; e += Math.hypot(Math.sin(tA * 0.8) * 20 - x, Math.cos(tA * 0.8) * 20 - z); } e /= Math.max(1, good.length); if (e < best.e) best = { lag, e: +e.toFixed(3) }; }
  let jump = 0, big = 0; for (let i = 1; i < good.length; i++) { const d = Math.hypot(good[i][1] - good[i - 1][1], good[i][2] - good[i - 1][2]), dt = (good[i][0] - good[i - 1][0]) / 1000; if (d > Math.max(1.2, 32 * dt)) jump++; if (d > big) big = d; }   /* 튐 = 한 프레임에 1.2m 넘게(프레임이 길었으면 실제 빠르기 16m/s의 두 배 넘게) */
  return { seen: good.length + '/' + L.length, lagMs: best.lag, errM: best.e, jumps: jump, maxStepM: +big.toFixed(2) }; };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), ctx = await b.newContext(), r = Math.random().toString(36).slice(2, 5), errs = [], R = {}, bad = [];
  const ok = (name, cond, val) => { R[name] = val === undefined ? !!cond : val; if (!cond) bad.push(name); };
  const U = (o) => 'http://127.0.0.1:' + PORT + '/tools/harness/net_cf3.html?' + new URLSearchParams({ cf: CF, ...o });
  const open = async (o, gone) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(o.me + ': ' + e.message)); await p.goto(U(o)); await p.waitForFunction(gone ? () => window.READY && window.N.cf.gone : () => window.READY && window.N.cf.ok, null, { timeout: 20000 }); return p; };
  const st = (p) => p.evaluate(() => ({ cf: window.N.cf, peers: window.N.cfPeers ? window.N.cfPeers() : [], count: window.N.count, names: window.N.names, roster: window.N.roster().length, hidden: document.hidden }));
  const peer = (s, id) => s.peers.find((q) => q.id === id) || {};
  const FB = (extra) => ({ n: '시험', c: 0xff6b6b, k: 'kid', x: 0, y: 0, z: 0, h: 0, a: '', t: Date.now(), ...extra });
  let oldMade = false;
  try {
    /* ① 명단 없이 서로 보임 */
    const aId = 'aa' + r, bId = 'bb' + r, A = await open({ me: aId, r: r + '1', move: 1 }), B = await open({ me: bId, r: r + '1', move: 0 }); await A.waitForTimeout(4500);
    let sA = await st(A), sB = await st(B); const pa = peer(sB, aId), pb = peer(sA, bId);
    ok('①탭이 가려지지 않음', !sA.hidden && !sB.hidden, [sA.hidden, sB.hidden]);
    ok('①B가 A를 봄(Firebase 명단 없음)', pa.ws && !pa.fb && pa.has && pa.vis && !pa.tag && pa.n === '', pa);
    ok('①A가 B를 봄(Firebase 명단 없음)', pb.ws && !pb.fb && pb.has && pb.vis && !pb.tag, pb);
    ok('①사람 수 2 · 목록 이름 친구 · 방 놀이 명단 0', sB.count === 2 && sB.names.join() === '친구' && sB.roster === 0 && sB.cf.wsOnly === 1, { count: sB.count, names: sB.names, roster: sB.roster, wsOnly: sB.cf.wsOnly });
    const m1 = fit(await B.evaluate(() => window.LOG.slice(-200)), await A.evaluate(() => window.T0), 600);
    ok('①움직임(10번 · 지연 150)', m1.lagMs >= 0 && m1.lagMs <= 300 && m1.errM < 0.6 && m1.jumps === 0, { ...m1, hz: sA.cf.hz, dl: pa.dl, iv: pa.iv, rtt: sA.cf.rtt });
    ok('①핑 답이 옴', typeof sA.cf.rtt === 'number' && sA.cf.rtt < 1000, sA.cf.rtt);
    /* Firebase 명단이 옴 → 이름 합침 */
    await B.evaluate(([id, d]) => window.fbPut('/players/' + id, d), [aId, FB()]); await A.evaluate(([id, d]) => window.fbPut('/players/' + id, d), [bId, FB()]); const fbT = Date.now(); await B.waitForTimeout(400);
    sB = await st(B); const pa2 = peer(sB, aId); ok('①명단이 오면 이름표', pa2.ws && pa2.fb && pa2.n === '시험' && pa2.tag && pa2.vis && sB.roster === 1 && sB.names.join() === '시험', { ...pa2, roster: sB.roster });
    /* ④ 옛 꼴 손님 */
    const og = (await B.evaluate(() => window.addGuests(1, { old: true, pre: 'og', x0: 3 })))[0]; await B.waitForTimeout(500); sB = await st(B);
    ok('④옛 꼴 손님 = 명단엔 셈 · 안 그림', sB.cf.n === 3 && !sB.peers.some((q) => q.id === og), { n: sB.cf.n, peers: sB.peers.length });
    await B.evaluate(([id, d]) => window.fbPut('/players/' + id, d), [og, FB({ x: 3 })]); await B.waitForTimeout(400); sB = await st(B); const po = peer(sB, og);
    ok('④Firebase 명단이 오면 그림', po.ws && po.fb && po.has && po.vis && po.tag, po);

    /* ② 빈도 단계 */
    const cId = 'cc' + r, C = await open({ me: cId, r: r + '2', move: 0 }), hz = {}, H = async (k) => { await C.waitForTimeout(350); const c = await C.evaluate(() => window.N.cf); hz[k] = c.n + '명=' + c.hz; return c.hz; };
    const h1 = await H('혼자'); await C.evaluate(() => window.addGuests(7)); const h8 = await H('8'); await C.evaluate(() => window.addGuests(1)); const h9 = await H('9'); await C.evaluate(() => window.addGuests(7)); const h16 = await H('16'); await C.evaluate(() => window.addGuests(1)); const h17 = await H('17');
    await C.evaluate(() => { window.RUN = true; }); const hRun = await H('방놀이'); await C.evaluate(() => { window.RUN = false; window.N.hide(true); }); const hHide = await H('대결'); await C.evaluate(() => window.N.hide(false)); const hBack = await H('다시');
    ok('②빈도 단계 10·10·6·6·4 · 방 놀이 10 · 대결 10', h1 === 10 && h8 === 10 && h9 === 6 && h16 === 6 && h17 === 4 && hRun === 10 && hHide === 10 && hBack === 4, hz);
    const s0 = (await C.evaluate(() => window.N.cf)).sent; await C.waitForTimeout(2000); const s1 = (await C.evaluate(() => window.N.cf)).sent;
    ok('②멈춰 있으면 안 보냄', s1 - s0 === 0, s1 - s0);
    const dId = 'dd' + r, D = await open({ me: dId, r: r + '2', move: 0, watch: cId }); await C.evaluate(() => { window.move = true; }); await C.waitForTimeout(1500);
    const s2 = (await C.evaluate(() => window.N.cf)).sent; await C.waitForTimeout(4000); const s3 = (await C.evaluate(() => window.N.cf)).sent, rate4 = (s3 - s2) / 4;
    ok('②18명 · 움직임 = 초당 4번 안팎', rate4 >= 3 && rate4 <= 4.3, rate4);
    let sD = await st(D); const pc = peer(sD, cId), m4 = fit(await D.evaluate(() => window.LOG.slice(-180)), await C.evaluate(() => window.T0), 900);
    ok('②받는 쪽(4번) 지연 375 · 안 튐', pc.dl > 330 && pc.iv > 225 && m4.jumps === 0 && m4.errM < 1 && m4.lagMs <= 600, { ...m4, dl: pc.dl, iv: pc.iv });
    await C.evaluate(() => window.dropGuests(8)); await C.waitForTimeout(3500); sD = await st(D); const pc6 = peer(sD, cId), m6 = fit(await D.evaluate(() => window.LOG.slice(-200)), await C.evaluate(() => window.T0), 900);
    ok('②4번 → 6번으로 바뀔 때 안 튐 · 지연 250', sD.cf.hz === 6 && Math.abs(pc6.dl - 250) < 40 && m6.jumps === 0, { ...m6, n: sD.cf.n, dl: pc6.dl, iv: pc6.iv });
    await C.evaluate(() => window.addGuests(8)); await C.waitForTimeout(3500); sD = await st(D); const pc4 = peer(sD, cId), m64 = fit(await D.evaluate(() => window.LOG.slice(-200)), await C.evaluate(() => window.T0), 900);
    ok('②6번 → 4번으로 바뀔 때 안 튐 · 지연 375', sD.cf.hz === 4 && pc4.dl > 330 && m64.jumps === 0, { ...m64, n: sD.cf.n, dl: pc4.dl, iv: pc4.iv });
    await C.evaluate(() => window.closeGuests()); await C.close(); await D.close();

    /* ③ 마을 = 가까운 열 명만 몸 */
    const eId = 'ee' + r, E = await open({ me: eId, r: r + '3', move: 0, town: 1 });
    const g = await E.evaluate(() => window.addGuests(14, { a: 't:다7', x0: 2, dx: 2, h: 100 })); await E.evaluate(async () => { await window.addGuests(1, { a: '', x0: 1 }); await window.addGuests(1, { a: 'i:12', x0: 1, h: 100 }); await window.addGuests(1, { old: true, x0: 1 }); }); await E.waitForTimeout(1600);
    const T = () => E.evaluate(() => ({ s: window.SM_FRIENDS.stats, dots: window.dots(), vis: window.N.cfPeers().filter((q) => q.vis).length, n: window.N.cf.n, hz: window.N.cf.hz }));
    let t3 = await T(); ok('③친구 14명 = 몸 10 · 점 14 · 이름표 0', t3.s.n === 10 && t3.s.all === 14 && t3.dots === 14 && t3.s.tags === 0 && t3.vis === 14 && t3.n === 18, { n: t3.s.n, all: t3.s.all, dots: t3.dots, tags: t3.s.tags, vis: t3.vis, room: t3.n, calls: t3.s.calls });
    ok('③가까운 차례 열 명', g.slice(0, 10).every((q) => t3.s.near.includes(q)), t3.s.near.length);
    await E.evaluate((id) => window.guestSend(id, { t: 'p', x: 19, y: 0, z: 0, h: 100, s: 0 }), g[10]); await E.waitForTimeout(1700); t3 = await T();
    ok('③경계(76m 대 80m) = 안 바뀜', t3.s.near.includes(g[9]) && !t3.s.near.includes(g[10]) && t3.s.n === 10, { g9: t3.s.near.includes(g[9]), g10: t3.s.near.includes(g[10]) });
    await E.evaluate((id) => window.guestSend(id, { t: 'p', x: 15, y: 0, z: 0, h: 100, s: 0 }), g[10]); await E.waitForTimeout(1700); t3 = await T();
    ok('③확실히 가까워지면(60m) 바뀜', !t3.s.near.includes(g[9]) && t3.s.near.includes(g[10]) && t3.s.n === 10, { g9: t3.s.near.includes(g[9]), g10: t3.s.near.includes(g[10]) });
    await E.evaluate(([id, d]) => window.fbPut('/players/' + id, d), [g[0], FB({ x: 2, h: 100, a: 't:다7 ' })]); await E.waitForTimeout(500); t3 = await T(); ok('③이름을 알면 이름표 1', t3.s.tags === 1, t3.s.tags);
    await E.evaluate((id) => window.guestSend(id, { t: 'm', a: '' }), g[1]); await E.waitForTimeout(1300); t3 = await T(); ok('③친구가 학교로 가면 빠짐(13명)', t3.s.all === 13 && t3.s.n === 10 && t3.dots === 13, { all: t3.s.all, n: t3.s.n, dots: t3.dots });
    await E.evaluate(() => window.closeGuests()); await E.close();

    /* ⑤ 방이 꽉 참 */
    const fId = 'ff' + r, F = await open({ me: fId, r: r + '5', move: 0 }); await F.evaluate(() => window.addGuests(39)); await F.waitForTimeout(600);
    const over = await F.evaluate(async () => { await window.addGuests(1, { pre: 'x' }); const x = window.G[window.G.length - 1]; for (let k = 0; k < 50 && !x.code; k++) await new Promise((q) => setTimeout(q, 100));   /* 닫는 인사는 로컬에서 2초쯤 늦게 옴 */ return { code: x.code, full: x.full, n: window.N.cf.n }; });
    ok('⑤41번째 손님 = 4003', over.code === 4003 && over.full && over.n === 40, over);
    const hId = 'hh' + r, Hp = await open({ me: hId, r: r + '5', move: 0 }, true), toast = () => Hp.evaluate(() => { const el = document.getElementById('toast'); return { tx: el.textContent, shown: el.style.display !== 'none', ws: window.WSN, gone: window.N.cf.gone, ok: window.N.cf.ok }; });
    const t5 = await toast(); await Hp.waitForTimeout(6000); const t5b = await toast(), fOk = (await F.evaluate(() => window.N.cf)).ok;
    ok('⑤꽉 찼어요 글 한 번', t5.tx === FULL && t5.shown && t5.gone && !t5.ok, t5);
    ok('⑤다시 붙지 않음 · 글은 5초 뒤 내림 · 먼저 온 사람은 그대로', t5b.ws === 1 && !t5b.shown && t5b.gone && fOk, { ...t5b, firstOk: fOk });
    await F.evaluate(() => window.closeGuests()); await F.close(); await Hp.close();

    /* ⑥ 옛 화면 + 새 화면 */
    try { fs.writeFileSync(OLD, execSync('git show ' + OLD_REV + ':v2/js/net.js', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 })); oldMade = true; } catch (e) { R['⑥옛 화면'] = '건너뜀(git에 옛 판 없음)'; }
    if (oldMade) { const oId = 'oo' + r, nId = 'nn' + r, O = await open({ me: oId, r: r + '6', move: 0, old: 1, peer: nId }), Nw = await open({ me: nId, r: r + '6', move: 1, peer: oId }); await O.waitForTimeout(4500);
      const mo = fit(await O.evaluate(() => window.LOG.slice(-200)), await Nw.evaluate(() => window.T0), 600), sN = await st(Nw), pO = peer(sN, oId);
      ok('⑥옛 화면이 새 화면을 봄(새 서버)', mo.lagMs >= 0 && mo.lagMs <= 300 && mo.errM < 0.6 && mo.jumps === 0 && +mo.seen.split('/')[0] > 180, mo);
      ok('⑥새 화면이 옛 화면을 봄', pO.ws && pO.fb && pO.vis && pO.tag, pO); await O.close(); await Nw.close(); }

    /* ① 끝: Firebase 스트림이 죽은 채 20초가 넘어도 가만히 선 친구가 보임 */
    const left = 22500 - (Date.now() - fbT); if (left > 0) await A.waitForTimeout(left); sA = await st(A); const pb3 = peer(sA, bId);
    ok('①스트림이 죽어도 보임(' + Math.round((Date.now() - fbT) / 1000) + '초)', sA.cf.fbDead && pb3.ws && pb3.fb && pb3.vis && sA.count >= 2, { fbDead: sA.cf.fbDead, vis: pb3.vis, count: sA.count });
    ok('쪽 오류 0', !errs.length, errs);
  } catch (e) { bad.push('시험이 멈춤: ' + (e && e.message)); }
  finally { if (oldMade) { try { fs.unlinkSync(OLD); } catch (e) { /* */ } } }
  console.log(JSON.stringify(R, null, 1)); if (bad.length) console.log('실패: ' + bad.join(' | ')); console.log(bad.length ? 'FAIL' : 'PASS'); await b.close(); process.exit(bad.length ? 1 : 0); })();
