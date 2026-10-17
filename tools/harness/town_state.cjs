// 마을 상태 교차 시험(STATE-X · 10-17 '마트 들어가자 끼임 · 방 안에서 J · 그네 타면 매 프레임 tick 오류'): node tools/harness/town_state.cjs [마을=ourtown] [포트=8002] [--only=상태,상태] [--act=동작,동작]
//   '어떤 상태인데 다른 기능이 그 상태를 모른 채 끼어드는' 버그를 한꺼번에 — 한 페이지에서 상태 만들기 → 동작 → 확인 → 원래대로(Esc · 방 나가기 · 정문 앞으로)
//   상태: 밖(기준) · 가게 안 · 집 안 · 벤치 앉음 · 그네 앉음 · 자전거(가게 문 앞) · 배 · 일터 놀이 창(PLAY) · 가방 창(가게 문 앞) · 누움(집 침대 · 조금만 누워 있기)
//   동작: J(창 → 칸 단추) · 칸 가기(창 없이 SM_TOWN.jumpCell — 교사 확인용 길) · F(창 → 🚌 가기) · M(큰 지도 → 누른 자리 📍 가기) · B · Y(판 모습 ↔ 마을 모습) · 하늘에서 보기(SM_TOWN.top → Esc) · I · E · 이어 하기 저장(lastSave) · 잠(SM_TOWN.sleep) · 날씨(비 → 맑음)
//   확인(창이 남아 있으면 Esc로 닫고): 8방향 0.4초씩 — 하나라도 0.3m 넘게(배처럼 느린 탈것은 W 1.5초 한 번 더) · 밖인데 마을 숨김 X · 안인데 바깥 보임 X · 밖인데 방 남음 X ·
//         J·칸 가기·F·M은 밖(기준)에서 같은 동작으로 도착한 자리와 25m 안(배 위처럼 '왔어요' 하고 제자리로 되돌아가는 것) · indoor.on과 몸 자리(안 = 방 상자 안 · 밖 = 땅에서 8m 안) · 판 모습 그대로 X · 저장한 이어 하기 자리가 방 높이 X · 오류 0 · '[map] 게임 tick 오류' 0(찍히면 게임이 멈춤 → 다시 열고 다음 조합)
//   끝에 하나 더: 가게 안에서 저장 → 다시 열기 → '📍 이어 하기' 단추 → 같은 확인
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3).split(',') : null; };
const STATES = arg('only') || ['out', 'shop', 'home', 'bench', 'swing', 'bike', 'boat', 'play', 'bag', 'lie'];
const ACTS = arg('act') || ['J', 'Jc', 'F', 'M', 'B', 'Y', 'top', 'I', 'E', 'save', 'sleep', 'weather'];
const KO = { out: '밖', shop: '가게 안', home: '집 안', bench: '벤치', swing: '그네', bike: '자전거', boat: '배', play: '놀이 창', bag: '가방 창', lie: '누움', J: 'J 바로 가기', Jc: '칸 가기(창 없이 jumpCell)', F: 'F 찾기→버스', M: 'M 큰 지도→가기', B: 'B 자전거', Y: 'Y 판 모습', top: '하늘에서 보기', I: 'I 가방', E: 'E', save: '이어 하기 저장', sleep: '잠', weather: '날씨 비→맑음' };
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
(async () => { const T0 = Date.now(); const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), pos = () => ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; });
  // 페이지 안 도우미(다시 열 때마다 다시 심음)
  const helpers = () => ev(() => { window.__TS = {
    sl: ms => new Promise(r => setTimeout(r, ms)),
    tp(x, z, y) { const M = SD2.map, g = M.q.groundAt(x, z, (y ?? SM_TOWN.ground(x, z)) + 2); M.player.teleport([x, g + 0.05, z]); },
    hots: re => SD2.map.interact.list().filter(h => !h.off && re.test(h.label)).map(h => ({ label: h.label, x: h.x, y: h.y, z: h.z, r: h.r, kind: h.kind })),
    snap() { const S = SM_TOWN, st = S.indoor.state(), me = SD2.map.player.get(), info = S.indoor.info, sp = S.indoor.spawn(); return { st, me: [me.x, me.y, me.z], ground: S.ground(me.x, me.z), info: info && { W: info.W, D: info.D }, spawn: sp, frozen: !!SD2.CTRL.frozen, pose: SD2.CTRL.pose || null, sit: !!SD2.ACT.sit, anim: !!SD2.ACT.anim, boat: S.boat().on, look: S.dkd().look, panel: !!document.querySelector('.twn-p'), play: !!document.querySelector('.twn-play'), wx: S.wx().WX9, lookBusy: S.cal().busy, hot: SD2.near() || null }; } }; });
  let boots = 0, ctx = null;
  async function boot(res) { boots++; await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.life && SM_TOWN.indoor && SM_TOWN.game, null, { timeout: 180000 }); await W8(1500); await helpers();
    if (res) { const ok = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="res"]'); if (b9) b9.click(); return !!b9; }); await W8(1600); return ok; }
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(300); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); return true; }
  // 시험 재료(한 번만 고름): 가게 · 집 · 침대 있는 집 · 벤치 · 그네 · 가게 문 · 배 타는 곳 · 일꾼들 · J 칸
  async function pick() { const c = await ev(() => { const S = SM_TOWN, L = S.indoor.list(), T = __TS, near0 = (A) => A.sort((a, b) => Math.hypot(a.x - 15, a.z - 74) - Math.hypot(b.x - 15, b.z - 74))[0] || null;
      const shop = L.find(q => q.kind === 'shop' && /마트/.test(q.name)) || L.find(q => q.kind === 'shop'), homes = L.filter(q => q.kind === 'home');
      const door = shop && T.hots(/./).filter(h => h.label.includes(shop.name) && Math.hypot(h.x - shop.at[0], h.z - shop.at[1]) < 3).sort((a, b) => Math.hypot(a.x - shop.at[0], a.z - shop.at[1]) - Math.hypot(b.x - shop.at[0], b.z - shop.at[1]))[0] || null;   /* 문 E(닫힌 시각엔 '🌙 …' 이름) */
      return { shop, homes, door, bench: near0(T.hots(/^💺 벤치에 앉기/)), swing: near0(T.hots(/^🎠 그네 타기/)), boat: T.hots(/^⛵ 배 타기/)[0] || null, work: T.hots(/\(같이 해요\)/).filter(h => !/논 일|장터|조개/.test(h.label)), cell: shop ? S.cell(shop.at[0], shop.at[1]) : '다9' }; });
    c.bed = null; for (const h of c.homes) { const r = await enterRoom(h.id); if (!r.ok) continue; const bd = await ev(() => __TS.hots(/눕기/)[0] || null); await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await __TS.sl(100); }); if (bd) { c.bed = { id: h.id, name: h.name }; break; } }
    c.home = c.homes.find(h => !c.bed || h.id !== c.bed.id) || c.homes[0] || null; return c; }
  async function enterRoom(id) { const ok = await ev(id => SM_TOWN.indoor.enter(id), id); if (!ok) return { ok: false, why: 'enter' }; try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { return { ok: false, why: 'notIn(닫힘?)' }; } await W8(250); return { ok: true }; }
  const tpHot = (h, off = 0) => ev(([h, off]) => { __TS.tp(h.x + off, h.z, h.y); SD2.map.player.lookAt([h.x - 3, h.z]); }, [h, off]).then(() => W8(450));
  let iPlay = 0;
  const SETUP = {
    out: async () => ({ ok: true }),
    shop: () => ctx.shop ? enterRoom(ctx.shop.id) : { skip: '가게 없음' },
    home: () => ctx.home ? enterRoom(ctx.home.id) : { skip: '집 없음' },
    bench: () => sitOn(ctx.bench), swing: () => sitOn(ctx.swing),
    bike: async () => { if (!ctx.door) return { skip: '가게 문 없음' }; await tpHot(ctx.door); await p.keyboard.press('KeyB'); await W8(400); return { ok: await ev(() => SM_TOWN.indoor.state().bike), why: 'B로 안 탐' }; },
    boat: async () => { if (!ctx.boat) return { skip: '배 없음' }; await tpHot(ctx.boat); await p.keyboard.press('KeyE'); await W8(900); return { ok: await ev(() => SM_TOWN.boat().on), why: 'E로 안 탐(가까운 E: ' + (await ev(() => SD2.near())) + ')' }; },
    play: async () => { if (!ctx.work.length) return { skip: '일꾼 없음' }; for (let k = 0; k < ctx.work.length; k++) { const w = ctx.work[iPlay++ % ctx.work.length]; await tpHot(w, 1.0); await p.keyboard.press('KeyE'); await W8(500); if (await ev(() => !!document.querySelector('.twn-play'))) return { ok: true, w: w.label }; await p.keyboard.press('Escape'); await W8(200); } return { ok: false, why: 'E로 놀이 창 안 열림' }; },
    bag: async () => { if (!ctx.door) return { skip: '가게 문 없음' }; await tpHot(ctx.door); await p.keyboard.press('KeyI'); await W8(350); return { ok: await ev(() => !!document.querySelector('.twn-p')), why: 'I로 창 안 열림' }; },
    lie: async () => { if (!ctx.bed) return { skip: '침대 있는 집 없음' }; const r = await enterRoom(ctx.bed.id); if (!r.ok) return r; const bd = await ev(() => __TS.hots(/눕기/)[0] || null); if (!bd) return { ok: false, why: '눕기 E 없음' };
      await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); }, bd); await W8(450); await p.keyboard.press('KeyE'); await W8(600); const rest = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="rest"]'); if (b9) b9.click(); return !!b9; }); await W8(300);
      return { ok: rest && await ev(() => SD2.CTRL.pose === 'lie' && !document.querySelector('.twn-p')), why: rest ? '누운 자세 아님' : '침대 창 안 열림(가까운 E: ' + (await ev(() => SD2.near())) + ')' }; },
  };
  async function sitOn(h) { if (!h) return { skip: '자리 없음' }; await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); }, h); await W8(450); const nr = await ev(() => SD2.near()); await p.keyboard.press('KeyE'); await W8(500); return { ok: await ev(() => !!(SD2.ACT.sit && SD2.ACT.sit.seat)), why: 'E로 안 앉음(가까운 E: ' + nr + ')' }; }
  const openP = () => ev(() => !!document.querySelector('.twn-p'));
  const ACT = {
    J: async (n) => { await p.keyboard.press('KeyJ'); await W8(350); const ok = await ev(c => { const b9 = document.querySelector('.twn-p button[data-cell="' + c + '"]'); if (b9) b9.click(); return !!b9; }, ctx.cell); if (!ok) { n.push('J창X→jumpCell'); await ev(c => SM_TOWN.jumpCell(c), ctx.cell); } await W8(1700); },
    Jc: async () => { await ev(c => SM_TOWN.jumpCell(c), ctx.cell); await W8(1700); },
    F: async (n) => { await p.keyboard.press('KeyF'); await W8(350); const ok = await ev(() => { const b9 = document.querySelector('.twn-p button[data-b]'); if (b9) b9.click(); return !!b9; }); if (!ok) n.push('F창X'); await W8(1800); },
    M: async (n) => { await p.keyboard.press('KeyM'); await W8(450); const r = await ev(() => { const c = document.querySelector('.twn-p canvas.twn-big'); if (!c) return null; const R = c.getBoundingClientRect(); return [R.left + R.width * 0.55, R.top + R.height * 0.45]; }); if (!r) { n.push('M창X'); return; } await p.mouse.click(r[0], r[1]); await W8(200); const g = await ev(() => { const b9 = document.querySelector('.mpop button[data-m="g"]'); if (b9) b9.click(); return !!b9; }); if (!g) n.push('M가기X'); await W8(1700); },
    B: async () => { await p.keyboard.press('KeyB'); await W8(700); },
    Y: async (n) => { for (let k = 0; k < 2; k++) { await p.keyboard.press('KeyY'); await W8(300); try { await p.waitForFunction(() => !SM_TOWN.cal().busy, null, { timeout: 30000 }); } catch (e) { n.push('Y짓기 30초+'); } if (k === 0) n.push('Y→' + await ev(() => SM_TOWN.dkd().look)); } await W8(300); },
    top: async (n) => { await ev(() => SM_TOWN.top(true)); await W8(900); if (!await ev(() => SM_TOWN.indoor.state().top)) n.push('하늘 안 켜짐'); await p.keyboard.press('Escape'); await W8(500); if (await ev(() => SM_TOWN.indoor.state().top)) { n.push('Esc로 하늘 안 나감'); await ev(() => SM_TOWN.top(false)); await W8(300); } },
    I: async () => { await p.keyboard.press('KeyI'); await W8(400); },
    E: async () => { await p.keyboard.press('KeyE'); await W8(1600); },
    save: async (n, r) => { r.saved = await ev(() => { const S = SM_TOWN, G = S.game(); G.S.last = null; S.lastSave(); const o = S.last(); return o ? { x: o.x, y: o.y, z: o.z, gnd: +S.ground(o.x, o.z).toFixed(2) } : null; }); n.push(r.saved ? '저장함' : '저장 안 함'); await W8(200); },
    sleep: async () => { await ev(() => { SM_TOWN.sleep(); }); await W8(2900); },
    weather: async () => { await ev(() => SM_TOWN.weather('rain')); await W8(700); await ev(() => SM_TOWN.weather('clear')); await W8(1700); },
  };
  const DIRS = [['KeyW'], ['KeyS'], ['KeyA'], ['KeyD'], ['KeyW', 'KeyA'], ['KeyW', 'KeyD'], ['KeyS', 'KeyA'], ['KeyS', 'KeyD']];
  async function hold(ks, ms) { const a = await pos(); for (const k of ks) await p.keyboard.down(k); await W8(ms); for (const k of ks) await p.keyboard.up(k); await W8(130); const c = await pos(); return Math.hypot(c[0] - a[0], c[2] - a[2]); }
  // 확인: 덮개·짓기 기다림 → 창 Esc → 상태 맞춤 → 8방향
  async function check(r) { try { await p.waitForFunction(() => !SM_TOWN.indoor.busy && !SM_TOWN.cal().busy, null, { timeout: 6000 }); } catch (e) { r.bad.push('덮개/짓기 6초+'); }
    r.after = await ev(() => __TS.snap()); for (let i = 0; i < 4; i++) { const o = await ev(() => ({ p: !!document.querySelector('.twn-p'), pl: !!document.querySelector('.twn-play'), top: SM_TOWN.indoor.state().top })); if (!o.p && !o.pl && !o.top) break; r.esc = (r.esc || 0) + 1; await p.keyboard.press('Escape'); await W8(300); }
    const s = await ev(() => __TS.snap()); r.snap = s; const st = s.st;
    if (r.esc >= 4) r.bad.push('Esc 4번에도 창 남음');
    if (!st.on && !st.top && !st.rootVis) r.bad.push('밖인데 마을 숨김');
    if (st.on && st.rootVis) r.bad.push('안인데 바깥 보임');
    if (!st.on && st.room) r.bad.push('밖인데 방 남음');
    if (st.on && !st.room) r.bad.push('안인데 방 없음');
    if (st.on && s.spawn && s.info && (Math.abs(s.me[0] - s.spawn[0]) > s.info.W / 2 + 1.5 || Math.abs(s.me[2] - s.spawn[2]) > s.info.D + 1.5 || Math.abs(s.me[1] - s.spawn[1]) > 4)) r.bad.push('안이라는데 몸이 방 밖');
    if (!st.on && !s.boat && s.me[1] - s.ground > 8) r.bad.push('밖인데 몸이 공중(' + (s.me[1] - s.ground).toFixed(1) + 'm)');
    if (s.look !== 'town') r.bad.push('판 모습 그대로');
    if (r.saved && r.saved.y - r.saved.gnd > 6) r.bad.push('이어 하기 자리가 공중(방 높이)');
    const mv = []; let best = 0; for (const ks of DIRS) { const d = await hold(ks, 400); mv.push(+d.toFixed(2)); best = Math.max(best, d); if (d > 0.3) break; }
    if (best <= 0.3) { const d = Math.max(await hold(['KeyW'], 1500), await hold(['KeyS'], 1500)); mv.push('long ' + d.toFixed(2)); best = Math.max(best, d); if (best > 0.3) r.note.push('0.4초엔 못 움직이고 1.5초엔 움직임'); }
    r.mv = mv; r.best = +best.toFixed(2); if (best <= 0.3) r.bad.push('갇힘(8방향 ' + mv.join('/') + ' · frozen=' + (await ev(() => !!SD2.CTRL.frozen)) + ')'); }
  async function restore() { if (!await ev(() => !!window.SM_TOWN)) return false;
    for (let i = 0; i < 4; i++) { const o = await ev(() => ({ p: !!document.querySelector('.twn-p'), pl: !!document.querySelector('.twn-play'), top: SM_TOWN.indoor.state().top })); if (!o.p && !o.pl && !o.top) break; await p.keyboard.press('Escape'); await W8(250); }
    return ev(async () => { const S = SM_TOWN, T = __TS, out = []; for (let i = 0; i < 60 && (S.indoor.busy || S.cal().busy); i++) await T.sl(100);
      if (S.indoor.state().top) S.top(false); if (S.indoor.on) { S.indoor.exit(); for (let i = 0; i < 40 && (S.indoor.on || S.indoor.busy); i++) await T.sl(100); }
      if (S.boat().on) S.boatGo(false); if (S.indoor.state().bike) S.bike(false); if (S.wx().WX9 !== 'clear') S.weather('clear'); if (S.dkd().look !== 'town') await S.setLook('town'); S.pathOff && S.pathOff();
      if (document.querySelector('.twn-p')) { const x9 = document.querySelector('.twn-p [data-a="x"]'); if (x9) x9.click(); if (document.querySelector('.twn-p')) out.push('복구 때 창이 안 닫힘'); } S.game().S.min = 11 * 60; T.tp(15.4, 74); SD2.map.player.lookAt([15.4, 200]); await T.sl(250);
      if (SD2.CTRL.frozen) { out.push('복구 뒤 멈춤 → 풂'); SD2.map.player.freeze(false); } if (SD2.CTRL.pose) { out.push('복구 뒤 자세 ' + SD2.CTRL.pose + ' → 풂'); SD2.map.player.pose(null); } return out.length ? out : true; }); }
  await boot(); ctx = await pick(); await restore();
  const res = [], setupBad = [], BASE = {};   /* BASE = 밖(기준)에서 J·칸 가기·F·M으로 도착한 자리 — 다른 상태에서도 같은 곳에 닿아야(같은 칸·같은 장소·같은 지도 자리) */
  for (const sk of STATES) for (const ak of ACTS) { const r = { s: sk, a: ak, bad: [], note: [] }, e0 = errs.length, t0 = Date.now();
    try { if (!await ev(() => !!window.SM_TOWN)) { await boot(); }
      const su = await SETUP[sk](); if (su.skip) { r.skip = su.skip; res.push(r); continue; } if (!su.ok) { r.skip = '상태 못 만듦: ' + su.why; setupBad.push(KO[sk] + ' — ' + su.why); res.push(r); await restore(); continue; } if (su.w) r.note.push(su.w);
      r.before = await ev(() => __TS.snap()); await ACT[ak](r.note, r); if (!await ev(() => !!window.SM_TOWN)) { r.bad.push('게임 멈춤(SM_TOWN 사라짐)'); } else {
        if (/^(J|Jc|F|M)$/.test(ak)) { await W8(300); r.land = await pos(); if (sk === 'out') BASE[ak] = r.land; else if (BASE[ak]) { const d = Math.hypot(r.land[0] - BASE[ak][0], r.land[1] - BASE[ak][1], r.land[2] - BASE[ak][2]); r.landD = +d.toFixed(1); if (d > 25) r.bad.push('순간 이동이 기준 도착 자리와 ' + d.toFixed(0) + 'm 다름(' + (Math.hypot(r.land[0] - r.before.me[0], r.land[2] - r.before.me[2]) < 5 ? '제자리' : '엉뚱한 곳') + ')'); } }   /* 0.3초 더 — 배처럼 매 프레임 몸을 되돌리는 것까지 */
        await check(r); }
    } catch (e) { r.bad.push('하네스 예외: ' + e.message.split('\n')[0].slice(0, 120)); }
    const E9 = errs.slice(e0); r.errs = E9; if (E9.some(t => /게임 tick 오류/.test(t))) r.bad.push('[map] 게임 tick 오류'); if (E9.length) r.bad.push('오류 ' + E9.length);
    let rs = null; try { rs = await restore(); } catch (e) { rs = false; } if (rs === false) { r.note.push('다시 열기'); await boot(); } else if (rs !== true) r.note.push(...rs);
    r.ms = Date.now() - t0; res.push(r); process.stderr.write((r.bad.length ? '✗ ' : r.skip ? '· ' : '✓ ') + KO[sk] + ' × ' + KO[ak] + (r.bad.length ? ' → ' + r.bad.join(' · ') : r.skip ? ' (' + r.skip + ')' : '') + ' ' + (r.ms / 1000).toFixed(1) + 's\n'); }
  // 끝: 가게 안에서 저장 → 다시 열기 → 📍 이어 하기
  const cont = { s: 'shop', a: 'continue', bad: [], note: [] }; { const e0 = errs.length;
    try { const su = ctx.shop ? await enterRoom(ctx.shop.id) : { ok: false }; if (su.ok) { cont.saved = await ev(async () => { const S = SM_TOWN, G = S.game(); G.S.last = null; S.lastSave(); G.flush && G.flush(); return S.last() || null; }); const ok = await boot(true); if (!ok) cont.bad.push('이어 하기 단추 없음'); else await check(cont); } else cont.skip = '가게 못 들어감'; }
    catch (e) { cont.bad.push('하네스 예외: ' + e.message.split('\n')[0].slice(0, 120)); } const E9 = errs.slice(e0); cont.errs = E9; if (E9.some(t => /게임 tick 오류/.test(t))) cont.bad.push('[map] 게임 tick 오류'); if (E9.length) cont.bad.push('오류 ' + E9.length); res.push(cont); }
  const ran = res.filter(r => !r.skip), bad = ran.filter(r => r.bad.length), skipped = res.filter(r => r.skip);
  const grid = {}; for (const r of res) { (grid[KO[r.s] || r.s] = grid[KO[r.s] || r.s] || {})[KO[r.a] || r.a] = r.skip ? '-' : r.bad.length ? '✗' : '✓'; }
  console.log(JSON.stringify({ town: ID, combos: ran.length, skipped: skipped.length, bad: bad.length, boots, sec: Math.round((Date.now() - T0) / 1000), picked: { shop: ctx.shop && ctx.shop.name, home: ctx.home && ctx.home.name, bed: ctx.bed && ctx.bed.name, bench: !!ctx.bench, swing: !!ctx.swing, boat: !!ctx.boat, workers: ctx.work.length, cell: ctx.cell },
    setupBad: [...new Set(setupBad)], grid, badList: bad.map(r => ({ state: KO[r.s] || r.s, act: KO[r.a] || r.a, bad: r.bad, note: r.note, mv: r.mv, after: r.after && { on: r.after.st.on, rootVis: r.after.st.rootVis, room: r.after.st.room, bike: r.after.st.bike, top: r.after.st.top, boat: r.after.boat, frozen: r.after.frozen, pose: r.after.pose, panel: r.after.panel, play: r.after.play, me: r.after.me.map(v => +v.toFixed(1)), gnd: +r.after.ground.toFixed(1) }, snap: r.snap && { on: r.snap.st.on, rootVis: r.snap.st.rootVis, room: r.snap.st.room, frozen: r.snap.frozen, pose: r.snap.pose, boat: r.snap.boat, me: r.snap.me.map(v => +v.toFixed(1)), gnd: +r.snap.ground.toFixed(1) }, errs: r.errs && r.errs.slice(0, 3) })),
    skips: [...new Set(skipped.map(r => KO[r.s] + ': ' + r.skip))], rows: ran.map(r => [KO[r.s] || r.s, KO[r.a] || r.a, r.bad.length ? '✗' : '✓', r.after ? 'on=' + r.after.st.on + (r.after.panel ? ' 창' : '') + (r.after.play ? ' 놀이' : '') + (r.after.st.bike ? ' 🚲' : '') + (r.after.boat ? ' ⛵' : '') + (r.after.frozen ? ' 멈춤' : '') + (r.after.pose ? ' ' + r.after.pose : '') + (r.after.sit ? ' 앉음' : '') : '-', r.landD != null ? '기준과 ' + r.landD + 'm' : '', r.esc ? 'Esc' + r.esc : ''].join(' | ')), notes: ran.filter(r => r.note.length && !r.bad.length).map(r => KO[r.s] + ' × ' + (KO[r.a] || r.a) + ': ' + r.note.join(' · ')), continue: { bad: cont.bad, saved: cont.saved, mv: cont.mv }, errs: [...new Set(errs)].slice(0, 12) }, null, 1));
  const gate = bad.length === 0 && setupBad.length === 0; console.log(gate ? 'PASS' : 'FAIL'); await b.close(); process.exit(gate ? 0 : 1); })().catch(e => { console.error('하네스 오류', e.message); console.log('FAIL'); process.exit(1); });
