// 마을 포탈(들어가 볼 수 있는 곳) 자동 시험(INDOOR-1 · 또래 10-15 '드나들 때 규칙 버그 안 생기게'): node tools/harness/town_portal.cjs [마을=ourtown] [포트=8002]
//   곳마다 3번: ① 들어가기(E 연타 + 들어가기 두 번 = 한 번만 · 덮개 중 J·B) → 나오기 ② 자전거 탄 채 들어가기 → 나오기(자전거 그대로) ③ 들어가서 바로 가기(순간이동) → 다시 들어가서 하늘에서 보기
//   끝 상태 = OUT · 방 메시 0 · 바깥 보임 · (나오기) 문 앞 1.5~4.5m · 탈것 원래대로 · 높이 한계 원래대로 + 맨 끝에 방 안에서 모습 바꾸기(Y) · 게이트 = 어긋남 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1');   /* INTUIT-1: B·J를 누르므로 모두 연 화면 */ await p.waitForFunction(() => window.SM_TOWN, null, { timeout: 120000 }); await p.waitForTimeout(800); await p.evaluate(() => { const G = SM_TOWN.game && SM_TOWN.game(); if (G) { G.S.min = 12 * 60; G.setClock(false); } });   // GAME-1·B5: 가게는 여는 시각이 있어 낮 12시로 맞추고 시계 멈춤(문 드나들기만 봄)
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); }); await p.waitForTimeout(4000);
  const W = ms => p.waitForTimeout(ms), st = () => p.evaluate(() => SM_TOWN.indoor.state()), pos = () => p.evaluate(() => { const q = SD2.map.player.get(); return [q.x, q.y, q.z]; });
  const list = await p.evaluate(() => SM_TOWN.indoor.list()), arena0 = (await st()).arena; let n = 0;
  const expectOut = async (tag, o = {}) => { const s = await st(); n++; const why = []; if (s.on) why.push('on=' + s.on); if (s.room) why.push('room'); if (!s.rootVis) why.push('outside hidden'); if (s.busy) why.push('busy'); if (s.arena !== arena0) why.push('arena ' + s.arena); if (o.bike != null && s.bike !== o.bike) why.push('bike ' + s.bike);
    if (o.door) { const q = await pos(), d = Math.hypot(q[0] - o.door[0], q[2] - o.door[1]); if (d < 1.5 || d > 4.5) why.push('door d=' + d.toFixed(1)); } if (why.length) bad.push([tag, ...why]); };
  const expectIn = async (tag, id) => { const s = await st(); n++; if (s.on !== id || !s.room || s.rootVis || s.busy) bad.push([tag, 'in?', JSON.stringify(s)]); };
  const toDoor = a => p.evaluate(a => { SD2.map.player.teleport([a[0], SM_TOWN.ground(a[0], a[1]) + 0.3, a[1]]); }, a);
  for (const it of list) for (let r = 0; r < 3; r++) { const tag = it.id + '#' + r; await toDoor(it.at); await W(500);
    if (r === 1) { await p.evaluate(() => SM_TOWN.bike(true)); await W(200); }
    await p.evaluate(id => { SM_TOWN.indoor.enter(id); SM_TOWN.indoor.enter(id); }, it.id); await p.keyboard.press('KeyE'); await W(150); await p.keyboard.press('KeyE'); await p.keyboard.press('KeyJ'); await p.keyboard.press('KeyB');   // 연타 · 덮개 중 J·B
    await W(2300); await p.keyboard.press('Escape'); await expectIn(tag + ' in', it.id);
    if (r < 2) { await p.evaluate(() => { SM_TOWN.indoor.exit(); SM_TOWN.indoor.exit(); }); await W(1900); await expectOut(tag + ' out', { door: it.at, bike: r === 1 }); if (r === 1) { await p.evaluate(() => SM_TOWN.bike(false)); await W(200); } }
    else { await p.evaluate(() => SM_TOWN.jumpCell('다6')); await W(1600); await expectOut(tag + ' jump');
      await toDoor(it.at); await W(400); await p.evaluate(id => SM_TOWN.indoor.enter(id), it.id); await W(2300); await expectIn(tag + ' in2', it.id);
      await p.evaluate(() => SM_TOWN.top(true)); await W(900); await expectOut(tag + ' top', { door: it.at }); await p.evaluate(() => SM_TOWN.top(false)); await W(600); } }
  { const it = list[0]; await toDoor(it.at); await W(400); await p.evaluate(id => SM_TOWN.indoor.enter(id), it.id); await W(2300); await expectIn('look in', it.id);
    await p.evaluate(() => SM_TOWN.setLook('mat')); await W(9000); await p.evaluate(() => SM_TOWN.setLook('town')); await W(12000); await expectOut('look', { door: it.at }); }
  console.log(JSON.stringify({ places: list.length, checks: n, bad: bad.length, badAt: bad.slice(0, 20), gate: bad.length || errs.length ? 'FAIL' : 'PASS', errs }, null, 1)); await b.close(); process.exit(bad.length || errs.length ? 1 : 0); })();   /* GATE-2(10-31): 실패면 exit 1 */
