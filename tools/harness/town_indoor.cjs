// 마을 실내 끼임 시험(FIX-IN1 · 교사 10-17 '마트 들어가니까 바로 껴서 진행 못 하는데'): node tools/harness/town_indoor.cjs [마을=ourtown] [포트=8002] [--all]
//   들어갈 수 있는 곳 = 가게 전부 + 집·그 밖은 꼴마다 셋(--all = 전부) · 낮(가게가 여는 때)에 실제 길(goIn)로 들어감
//   들어가서 덮개가 걷히고 0.2초 뒤 앞·뒤·좌·우 키를 0.45초씩 눌러 각각 1m 넘게 움직이는지(방향마다 들어간 자리로 되돌림) · 몸이 충돌 상자 안이 아닌지
//   방 검사(SM_TOWN.indoor.check — 있으면): 들어간 자리에서 몸이 갈 수 있는 칸으로 나가기·계산대·요리·앉기 E 자리에 닿는지(위층 = 셈 밖)
//   마지막: 문 쪽(뒤)으로 걸어가 E로 나가지는지
//   게이트: 못 움직인 방향 0 · 몸이 상자 안 0 · 닿지 않는 E 자리 0 · 못 나간 방 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002', ALL = process.argv.includes('--all');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.indoor && SM_TOWN.game, null, { timeout: 180000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const L = await p.evaluate((ALL) => { const G = SM_TOWN.game(); G.S.min = 11 * 60; const L = SM_TOWN.indoor.list(), out = [], per = {}; for (const q of L) { const k = q.kind === 'shop' ? 'shop' : q.kind; per[k] = (per[k] || 0) + 1; if (k === 'shop' || ALL || per[k] <= 3) out.push(q); } return out; }, ALL);
  const W8 = ms => p.waitForTimeout(ms), pos = () => p.evaluate(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; });
  const res = [];
  for (const q of L) { const r = { id: q.id, kind: q.kind, name: q.name };
    const ok = await p.evaluate(id => SM_TOWN.indoor.enter(id), q.id); if (!ok) { r.err = 'enter'; res.push(r); continue; }
    try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { r.err = 'notIn'; res.push(r); continue; }   /* 덮개(드나드는 중 · 키 막힘)가 걷힌 뒤 */
    await W8(200); const p0 = await pos(); r.spawn = p0.map(v => +v.toFixed(2)); r.chk = await p.evaluate(() => SM_TOWN.indoor.check ? SM_TOWN.indoor.check() : null);
    r.mv = {}; for (const k of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) { await p.keyboard.down(k); await W8(450); await p.keyboard.up(k); await W8(150); const p1 = await pos(); r.mv[k.slice(3)] = +Math.hypot(p1[0] - p0[0], p1[2] - p0[2]).toFixed(2); await p.evaluate(a => { SD2.map.player.teleport(a); }, p0); await W8(150); }
    /* 문 쪽으로 걸어가 E */ await p.keyboard.down('KeyS'); await W8(1600); await p.keyboard.up('KeyS'); await W8(200); await p.keyboard.press('KeyE'); try { await p.waitForFunction(() => !SM_TOWN.indoor.on, null, { timeout: 4000 }); r.out = true; } catch (e) { r.out = false; await p.evaluate(() => SM_TOWN.indoor.exit()); await W8(800); }
    r.bad = []; for (const [k, v] of Object.entries(r.mv)) if (v < 1) r.bad.push('mv' + k + ' ' + v); if (r.chk) { if (!r.chk.spawnFree) r.bad.push('spawnInBox'); for (const h of r.chk.hots) if (h.ok === false) r.bad.push('hot ' + h.label); } if (!r.out) r.bad.push('noExit');
    res.push(r); await W8(400); }
  const bad = res.filter(r => r.err || r.bad.length);
  console.log(JSON.stringify({ rooms: res.length, shops: res.filter(r => r.kind === 'shop').length, bad: bad.length, badRooms: bad.map(r => ({ name: r.name, kind: r.kind, err: r.err, bad: r.bad, mv: r.mv, spawn: r.spawn })), errs, all: res.map(r => [r.name, r.kind, r.mv, r.chk && r.chk.roomy, r.out]) }, null, 1));
  console.log(bad.length || errs.length ? 'FAIL' : 'PASS'); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();   /* GATE-2(10-31): 실패면 exit 1 */
