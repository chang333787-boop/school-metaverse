// 게임 본판 — 첫 화면 → 장(2~6 수직 조각) · 장소는 무대 그릇으로 짓고 비움 · 플레이어 = 히컵(걷기 + 뒤따르는 카메라)
// 장 차례 생성기는 story/ch*.js · G(놀이 상태)를 장과 봇 감각(sense)이 함께 봄 · 봇은 DRG.sense()만 읽고 키만 누름
import * as THREE from 'three';
import { createEnv, U } from '../look/kit.js?v=25';
import { createStageHost } from '../core/stage.js?v=25';
import { createCollide } from '../play/collide.js?v=25';
import { createWalker, createFollowCam } from '../play/walker.js?v=25';
import { loadModel } from '../look/models.js?v=25';
import { createHumanRig } from '../look/human_rig.js?v=25';
import { createDragon, createPerson } from '../play/actors.js?v=25';
import { createHud } from '../ui/hud.js?v=25';
import { createBook } from '../ui/book.js?v=25';
import { createMap } from '../ui/map.js?v=25';
import { createBench } from '../ui/bench.js?v=25';
import { createSfx } from '../core/sfx.js?v=25';
import { showTitle, diffOf } from '../ui/title.js?v=25';
import { createRunner } from '../story/runner.js?v=25';
import { writeSlot, flushSlot } from '../story/save.js?v=25';
import { holdItem } from '../story/fx.js?v=25';
import { createRng } from '../core/rng.js?v=25';
import { showEnding } from '../ui/ending.js?v=25';

export const PLAYABLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];   // 0 = 오프닝 · 11 = 종장
const CH_FILE = Object.fromEntries(PLAYABLE.map((n) => [n, 'ch' + n]));
const _v = new THREE.Vector3(), _f = new THREE.Frustum(), _m = new THREE.Matrix4();

export async function buildGame(scene, camera, rng, opt = {}) {
  const Q = new URLSearchParams(location.search);
  const env = createEnv(scene, camera);
  const hud = createHud();
  const host = createStageHost({ gfx: opt.gfx, scene, camera, veil: { show: (t) => hud.veil.show(t || '불러오는 중'), hide: () => {} } });
  const G = { scene, camera, gfx: opt.gfx, env, host, hud, rng, diff: 'normal', grade: 0, slot: 1, place: null, placeKey: '', collide: null, inv: {}, flags: {}, t: 0, records: {}, cast: [], castBy: {} };
  G.book = createBook(G); G.map = createMap(); G.bench = createBench(); G.sfx = createSfx(G); G.music = G.sfx.music;
  /* 플레이어 */
  const P = G.player = { W: null, C: null, root: null, rig: null, item: null, lock: false, fT: 0, fTap: false, fLong: false, reach: false, away: false, cam: 'follow', hidden: false };
  loadModel('assets/models/hiccup.glb?v=25').then(({ root, bones }) => { P.root = root; P.rig = createHumanRig(bones, root); P.bones = bones; if (G.place) G.place.group.add(root); });

  /* 장소 짓기 — places/<이름>.js가 없으면 자리표시(_stub) */
  G.loadPlace = async (name, time, variant) => {
    let mod; try { mod = await import(`../places/${name}.js?v=25`); } catch (e) { mod = await import('../places/_stub.js?v=25'); }
    G.place = null; G.cast.length = 0; G.castBy = {};             // 장 안에서 이어지는 배우(keep)는 장소가 바뀌면 함께 비움
    if (P.root) P.root.removeFromParent();                         // 히컵은 옛 장소 group과 함께 비우지 않음(11-01 점검: 장소마다 기하·뼈 텍스처를 비웠다가 첫 프레임에 다시 올림)
    let hs = 7; for (const ch of name) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0;   // 장소마다 제 씨앗(앞에서 난수를 얼마나 썼든 같은 마을 · 팀 A 지적)
    const prng = createRng(name === 'village' ? 1656844137 : hs);   // 마을 = 팀 A가 골목·지붕·길을 맞춘 배치(fx1 VILLAGE_SEED)
    const place = await host.load(name, (ctx) => mod.buildPlace(Object.assign(ctx, { env, rng: prng, opt: { time, variant, stub: name, burnt: name === 'village' && G.flags ? G.flags.burnt : undefined } })));
    G.place = place; G.freshPlace = true; G.collide = createCollide(place.blockers || [], place.walls || []);
    P.W = createWalker({ height: place.height, collide: G.collide, bound: place.bound, x: 0, z: 0 });
    P.C = createFollowCam(camera, place.height, { collide: G.collide, ceil: place.ceil });
    if (P.root) place.group.add(P.root);
    return place;
  };
  /* 장이 잠깐 벽을 더함(내더 미로 칸막이) → 걷기·카메라 충돌을 다시 지음 */
  G.collideAdd = (segs) => { G.extraWalls = segs; rebuildCollide(); };
  G.collideReset = () => { G.extraWalls = null; rebuildCollide(); };
  function rebuildCollide() {
    const pl = G.place; G.collide = createCollide(pl.blockers || [], (pl.walls || []).concat(G.extraWalls || []));
    const W = P.W; P.W = createWalker({ height: pl.height, collide: G.collide, bound: pl.bound, x: W.x, z: W.z, y: W.y, yaw: W.yaw }); P.W.low = W.low;
    P.C.collide = G.collide;
  }
  G.anchor = (n) => (typeof n === 'string' ? (G.place.anchors[n] || null) : n);
  G.putPlayer = (at, yaw) => {
    const a = G.anchor(at); if (!a || !P.W) return;
    P.W.place(a.x, a.z, yaw ?? a.yaw ?? 0, a.y); P.W.low = false; P.C.yaw = (yaw ?? a.yaw ?? 0) + Math.PI; P.C.init = false; P.C.idle = 9;
  };
  /* 배우 부르기 — 이 차례가 끝나면 runner가 치움 */
  G.dragon = (kind, at, o = {}) => {
    const a = G.anchor(at) || { x: 0, z: 0, yaw: 0 };
    const D = createDragon(Object.assign({ kind, group: G.place.group, place: G.place, collide: o.noCollide ? null : G.collide, bound: G.place.bound, x: a.x, z: a.z, y: a.y, yaw: a.yaw ?? 0 }, o));
    (o.keep ? G.cast : G.runner.C.actors).push(D); if (o.keep) G.castBy[o.keep] = D; return D;
  };
  G.person = (who, at, o = {}) => {
    const a = G.anchor(at) || { x: 0, z: 0, yaw: 0 };
    const H = createPerson(Object.assign({ who, group: G.place.group, place: G.place, collide: o.noCollide ? null : G.collide, x: a.x, z: a.z, y: a.y, yaw: a.yaw ?? 0 }, o));
    (o.keep ? G.cast : G.runner.C.actors).push(H); if (o.keep) G.castBy[o.keep] = H; return H;
  };
  /* 화면에 보이나(봇 감각 · 쉬움 F 표시) — 시야 안 + 안개 끝 80% 안 */
  G.vis = (x, y, z, far) => {
    _m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _f.setFromProjectionMatrix(_m);
    _v.set(x, y, z); if (!_f.containsPoint(_v)) return false;
    return camera.position.distanceTo(_v) < (far || (scene.fog ? scene.fog.far * 0.8 : 500));
  };
  G.toScreen = (x, y, z) => { _v.set(x, y, z).project(camera); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight, front: _v.z < 1 }; };
  G.pl = () => ({ x: P.W.x, z: P.W.z, vx: P.W.vx, vz: P.W.vz, yaw: P.W.yaw, low: P.W.low, weapon: P.item === 'knife' || P.item === 'axe', reach: P.reach, away: P.away });
  G.dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  G.near = (pos, r) => P.W && Math.hypot(P.W.x - pos.x, P.W.z - pos.z) < r;
  G.useSpots = [];                                      // F 표시 자리 [{x,y,z}] — 장이 채움
  G.goalSpot = null;                                    // 지금 갈 곳 {x,(y),z} — 장이 채움(없으면 가장 가까운 F 자리)
  const gm = document.createElement('div');
  gm.style.cssText = 'position:fixed;left:0;top:0;z-index:19;pointer-events:none;display:none;transform:translate(-50%,-100%);text-align:center;font:bold 18px/1.2 sans-serif;color:#2b2118';
  gm.innerHTML = '<div style="background:#efe2c4;border:3px solid #2b2118;border-radius:9px;padding:3px 9px"></div><svg width="30" height="20" viewBox="0 0 22 14" style="display:block;margin:0 auto"><path d="M2 1 L20 1 L11 13 Z" fill="#d9a441" stroke="#2b2118" stroke-width="2"/></svg>';
  const gmT = gm.firstChild, gmA = gm.lastChild; document.body.appendChild(gm);
  G.goalMark = () => {
    let s = G.goalSpot;
    if (!s && G.useSpots.length && P.W) { let bd = 1e9; for (const u of G.useSpots) { const d = Math.hypot(u.x - P.W.x, u.z - P.W.z); if (d < bd) { bd = d; s = u; } } }
    const me = P.W || camera.position, d = s ? Math.hypot(s.x - me.x, s.z - me.z) : 0;
    if (!s || d < 3 || G.book.draw || !G.bench.el.classList.contains('gone')) { if (gm.style.display !== 'none') gm.style.display = 'none'; return; }
    const y = (s.y != null ? s.y : (G.place && G.place.height ? G.place.height(s.x, s.z, me.y || 0) : 0)) + 2.4;
    const p = G.toScreen(s.x, y, s.z), m = 40, W = innerWidth, H = innerHeight;
    gm.style.display = 'block'; gmT.textContent = Math.round(d) + 'm';
    if (p.front && p.x > m && p.x < W - m && p.y > m + 30 && p.y < H - m) { gm.style.left = p.x + 'px'; gm.style.top = p.y + 'px'; gmA.style.transform = ''; }
    else {                                              // 화면 밖·뒤 = 가장자리에 화살표(가야 할 쪽)
      let dx = p.x - W / 2, dy = p.y - H / 2; if (!p.front) { dx = -dx; dy = -dy; }
      const L = Math.hypot(dx, dy) || 1, R2 = Math.min(W, H) / 2 - 50;
      gm.style.left = (W / 2 + dx / L * R2) + 'px'; gm.style.top = (H / 2 + dy / L * R2) + 'px';
      gmA.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI - 90) + 'deg)';
    }
  };
  G.hold = (name) => holdItem(P, name);

  /* TPS 마우스 잠금 알림(11-01) — 마우스가 있는 기기에서 잠그지 않았을 때만 아래 가운데 작은 쪽지 · 잠그면 사라짐 */
  const lockTip = document.createElement('div');
  lockTip.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:20;background:#efe2c4;color:#2b2118;border:2px solid #2b2118;border-radius:9px;padding:5px 12px;font:15px/1.4 sans-serif;pointer-events:none;display:none';
  const LOCK_WALK = '화면을 한 번 누르면 마우스로 둘러봐요 · Esc = 풀기', LOCK_FLY = '화면을 한 번 누르면 마우스로 방향을 틀어요 · Esc = 풀기';
  lockTip.textContent = LOCK_WALK;
  document.body.appendChild(lockTip);
  const fine = (() => { try { return matchMedia('(pointer: fine)').matches; } catch (e) { return false; } })();
  let tipT = 0;

  /* 걸음 */
  G.playerStep = (dt, I) => {
    if (!I.gateSet) { I.gateSet = true; I.lockGate = () => !!P.W && (P.cam === 'follow' || P.cam === 'fly') && !G.book.draw && G.bench.el.classList.contains('gone'); }   // 비행도 같은 손(11-01 팀 B · 잠금 중 마우스 = 방향)
    if ((tipT -= dt) <= 0) { tipT = 0.5; const show = fine && !I.locked() && I.lockGate(); if ((lockTip.style.display !== 'none') !== show) lockTip.style.display = show ? 'block' : 'none'; const tx = P.cam === 'fly' ? LOCK_FLY : LOCK_WALK; if (show && lockTip.textContent !== tx) lockTip.textContent = tx; }
    if (!P.W) return;
    P.fTap = false;
    if (I.tap('use')) { P.taps = (P.taps || []).filter((t) => G.t - t < 1.5); P.taps.push(G.t); }
    P.mash = !!P.taps && P.taps.filter((t) => G.t - t < 1.5).length >= 4;   // 1.5초에 넷 = 연타(드래곤이 놀람 · design §1)
    if (I.on('use')) { P.fT += dt; P.fLong = P.fT >= 0.3; }
    else { if (P.fT > 0 && P.fT < 0.3) P.fTap = true; P.fT = 0; P.fLong = false; }
    P.reach = P.fLong && !P.noReach; P.away = P.reach;
    P.W.lock = P.lock || P.reach;                         // 손 내미는 동안은 멈춤(기다리기)
    if (I.locked() && (G.book.draw || !G.bench.el.classList.contains('gone'))) I.unlock();   // 책·작업대(그리기·박자 판)가 열리면 마우스를 돌려줌
    if (P.cam === 'follow') {                                   // 책·작업대에 그리는 동안 끌기 = 펜
      if (!G.book.draw && !P.aiming && G.bench.el.classList.contains('gone')) { if (P.camOff) { I.look(); P.camOff = false; } P.C.step(dt, I, P.W); }   // 카메라가 쉰 동안(작업대·장소 짓기) 쌓인 끌기는 버림 — 끝나는 순간 카메라가 확 돌던 것(11-01 점검)
      else P.camOff = true;
      P.W.step(dt, I, P.C.moveYaw());
    } else P.camOff = true;                                     // 비행·배 동안 쌓인 끌기(비행 엔진이 안 읽는 장면 포함)는 걷기로 돌아올 때 버림
  };
  G.playerDraw = (a, dt) => {
    if (!P.root || !P.W) return;
    P.root.visible = !P.hidden;
    if (P.cam === 'follow') {
      P.W.draw(a, P.root); if (performance.now() - (G.benchT || -1e9) > 250) P.C.draw(dt, P.root);   // bench 동안 카메라는 benchPath
      if (Math.abs(camera.fov - 60) > 0.05) { camera.fov += (60 - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }   // 비행 엔진이 넓힌 시야각을 걷기에서 되돌림
    }
    if (P.rig && P.cam === 'follow') {
      const to = P.pose || {}, R = P.rig;
      const tg = { speed: Math.min(1, P.W.speed / 4.2), low: P.W.low ? 1 : 0, reach: P.reach ? 1 : 0, away: P.away ? 0.8 : 0, throw: 0, ride: 0, sit: 0 };   // 비행·배에서 내리면 탄 자세·앉은 자세를 풂(골반이 내려간 채 걷던 것 · 11-01 점검) — 앉히려면 P.pose
      for (const k in to) tg[k] = to[k];
      for (const k in tg) if (k in R) R[k] += (tg[k] - R[k]) * Math.min(1, dt * 8);
      R.update(dt);
    }
  };

  /* 장 진행 */
  const R = G.runner = createRunner(G);
  /* 저장 — 칸 0 = 저장 안 함(선생님 장 고르기·?ch= 시험 주소가 아이 칸을 덮지 않게) · best = 가장 멀리 간 장·차례(앞 장을 다시 해도 줄지 않음 · 11-01 점검) */
  G.best = { ch: 0, idx: 0 };
  const save = (ch, idx) => {
    if (!G.slot) return;
    if (ch > G.best.ch || (ch === G.best.ch && idx > G.best.idx)) G.best = { ch, idx };
    writeSlot(G.slot, { grade: G.grade, diff: G.diff, ch, idx, best: G.best.ch, bestIdx: G.best.idx, book: G.book.state(), inv: G.inv, records: G.records, flags: G.flags }, true);
  };
  G.onStepDone = (ch, idx) => save(ch.id, idx + 1);
  G.onChapterDone = (ch) => {
    const nx = PLAYABLE[PLAYABLE.indexOf(ch.id) + 1];
    save(nx ?? ch.id, 0);
    G.chDone = (G.chDone || 0) + 1;
    if (nx && Q.get('chain') !== '0') setTimeout(() => startCh(nx, 0), 1800);
  };
  async function startCh(n, idx) {
    if (G.inv.helmet && n >= 8 && n <= 10) { const fx = await import('../story/fx79.js?v=25'); fx.setHelmet(G, true); }   // 7장에서 받은 투구가 이어하기에도(팀 B)
    const m = await import(`../story/${CH_FILE[n]}.js?v=25`);
    if (!(idx >= 0 && idx < m.chapter.steps.length)) idx = 0;   // 다 깬 장(차례 번호 = 차례 수)을 다시 고르면 처음부터
    await R.start(m.chapter, idx);
  }
  G.startCh = startCh;
  /* 엔딩 — 종장 마지막 차례가 부름 · 다 보면 첫 화면으로 */
  G.ending = () => { G.ended = true; showEnding(G, { feel: G.feel || [] }).then(() => { if (!Q.has('ch')) location.href = location.pathname; }); };

  /* 선생님 크롬북 관문 ?bench=1 — 장소 넷을 15초씩 돌며 그린 프레임 간격을 재고 한 줄로(복사 단추) · 한국어 기기 음성 · Shift+Space 한/영 */
  G.benchTour = async () => {
    const spots = [['village', 'night'], ['arena', 'day'], ['cove', 'sunset'], ['sea', 'clear']], out = [];
    for (const [pn, tm] of spots) {
      await G.loadPlace(pn, tm); P.hidden = true; hud.veil.hide();
      const ivs = []; let last = 0, calls = 0, tris = 0; const t0 = performance.now();
      await new Promise((res) => { const f = (ts) => { const t = (performance.now() - t0) / 1000; G.benchT = performance.now(); if (G.place.benchPath) G.place.benchPath(t * 4); if (last) ivs.push(ts - last); last = ts; const r = G.gfx.renderer.info.render; calls = Math.max(calls, r.calls); tris = Math.max(tris, r.triangles); if (t < 15) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      ivs.sort((a, b) => a - b); out.push(pn + ' p95 ' + (ivs[Math.floor(ivs.length * 0.95)] || 0).toFixed(1) + ' fps ' + (ivs.length / 15).toFixed(0) + ' c' + calls + ' t' + Math.round(tris / 1000) + 'k');
    }
    const st = G.gfx.stats();
    const v = (speechSynthesis.getVoices() || []).filter((x) => /^ko/.test(x.lang));
    const line = ['DRG-BENCH v2', 'CB ' + (st.cb ? 1 : 0), innerWidth + 'x' + innerHeight + '@' + (devicePixelRatio || 1), 'mode ' + st.mode, 'res ' + st.res, out.join(' / '), 'heap ' + st.heapMB, 'koVoice ' + v.length + '(' + v.filter((x) => x.localService).length + ' local)', 'err ' + (window.DRG ? DRG.diag().errs.length : '-')].join(' | ');
    return line;
  };
  G.benchShow = (line) => {
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:90;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:10px;padding:10px 12px;font:14px/1.5 monospace;word-break:break-all';
    const tx = document.createElement('div'); tx.textContent = line; box.appendChild(tx);
    const hint = document.createElement('div'); hint.style.cssText = 'font:600 15px sans-serif;margin-top:6px'; hint.textContent = '끝으로 Shift+Space를 한 번 눌러 보세요(한/영 전환 확인) → 줄 끝에 결과가 붙어요. 그다음 복사해서 보내 주세요.'; box.appendChild(hint);
    const b = document.createElement('button'); b.textContent = '복사'; b.style.cssText = 'margin-top:6px;font:inherit;padding:2px 10px';
    b.onclick = () => { try { navigator.clipboard.writeText(tx.textContent); b.textContent = '복사됨'; } catch (e) { b.textContent = '길게 눌러 복사'; } };
    box.appendChild(b); document.body.appendChild(box);
    addEventListener('keydown', (e) => { if (e.code === 'Space' && e.shiftKey && !/ShiftSpace/.test(tx.textContent)) tx.textContent += ' | ShiftSpace ok key=' + e.key; }, { once: false });
  };

  /* 시작 — ?ch=4&step=2 바로 · 아니면 첫 화면 */
  let ready;
  if (Q.get('bench') === '1') {
    ready = Promise.resolve(); hud.veil.show('성능 재기', '1분쯤 걸려요 · 손대지 말고 기다려 주세요');
    setTimeout(() => G.benchTour().then((l) => { hud.veil.hide(); G.benchShow(l); console.log(l); window.DRG_BENCH = l; }), 600);
  } else if (Q.has('ch')) {
    G.grade = +(Q.get('grade') || 4); G.diff = diffOf(G.grade, Q); G.slot = +(Q.get('slot') || 0);   // 주소로 바로 연 판은 저장 안 함(?slot=1~3을 주면 그 칸)
    ready = startCh(+Q.get('ch'), +(Q.get('step') || 0));
  } else {
    hud.veil.hide();
    ready = Promise.resolve();
    showTitle({ playable: PLAYABLE, Q }).then((r) => {
      G.grade = r.grade; G.diff = diffOf(r.grade, Q); G.slot = r.slot;
      if (r.save) { G.book.load(r.save.book); Object.assign(G.inv, r.save.inv || {}); Object.assign(G.flags, r.save.flags || {}); Object.assign(G.records, r.save.records || {}); G.best = { ch: r.save.best ?? r.save.ch ?? 0, idx: r.save.best == null ? r.save.idx || 0 : r.save.bestIdx || 0 }; }
      startCh(r.ch, r.idx);
    });
  }
  addEventListener('pagehide', flushSlot);

  /* 배우 그리기 — manual = 비행 엔진이 놓고 자세도 갱신 · 비행이 끝나 처음 다시 그릴 때 몸 기울기(앞뒤·옆)를 바로 세움(투슬리스가 기운 채 걷던 것 · 11-01 점검) */
  function drawActor(x, a, dt) {
    if (x.manual) { x.wasManual = true; return; }
    if (x.wasManual) { x.wasManual = false; if (x.root) { x.root.rotation.x = 0; x.root.rotation.z = 0; } }
    if (x.draw) x.draw(a, dt, camera.position);
  }
  let last = performance.now();
  const W = {
    G, env, ready,
    step(dt, I) {
      G.t += dt; U.uTime.value = G.t; G.input = I;
      hud.tick(dt);
      if (host.busy) { P.camOff = true; return; }
      if (!G.place) { R.tick(dt, I); return; }                  // 장소 없이 책 쪽만(쉬움에서 빠진 도전이 장 첫 차례일 때)
      G.place.step && G.place.step(dt, G.t);
      if (!G.book.open || G.book.draw) G.playerStep(dt, I);
      R.tick(dt, I);
      if (R.C) for (const a of R.C.actors) if (a.step && !a.manual) a.step(dt, a.mind ? G.pl() : undefined);
      for (const a of G.cast) if (a.step && !a.manual) a.step(dt, a.mind ? G.pl() : undefined);
      /* 드래곤 몸은 밀어냄(solid) — 사람이 드래곤을 뚫고 지나가지 않게 */
      if (P.W) for (const L of [R.C ? R.C.actors : [], G.cast]) for (const a of L) { if (!a.solid || a.hidden) continue; const dx = P.W.x - a.x, dz = P.W.z - a.z, d = Math.hypot(dx, dz), rr = (a.radius || 1.2) + 0.35; if (d < rr && d > 1e-4) { P.W.x = a.x + dx / d * rr; P.W.z = a.z + dz / d * rr; } }
    },
    draw(a) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!G.place) { env.follow(); return; }
      G.playerDraw(a, dt);
      if (G.camDraw) G.camDraw(a, dt);
      if (R.C) for (const x of R.C.actors) drawActor(x, a, dt);
      for (const x of G.cast) drawActor(x, a, dt);
      G.place.draw && G.place.draw(a);
      env.follow();
      if (G.diff !== 'hard') {                          // 쓸 수 있는 물건 위 F 키 그림만 — 쉬움 6m · 보통 4m(11-01 교사 '대장간 들어가서 뭐 어떻게 하는 거야' — 보통에선 작업대를 못 찾았음)
        const rr = G.diff === 'easy' ? 6 : 4, L = []; for (const s of G.useSpots) { if (!G.near(s, rr)) continue; const p = G.toScreen(s.x, (s.y || 0) + 1.6, s.z); if (p.front) L.push(p); }
        hud.fkeys(L);
      }
      G.goalMark();
      if (R.C && R.C.drawHook) R.C.drawHook(a, dt);
    },
    benchPath: (t) => { G.benchT = performance.now(); if (G.place && G.place.benchPath) G.place.benchPath(t); },
    snapshot: () => (P.W ? { x: +P.W.x.toFixed(3), z: +P.W.z.toFixed(3), ch: R.ch ? R.ch.id : 0, idx: R.idx, id: R.step ? R.step.id || '' : '' } : { loading: true }),
    sense: () => {
      const s = R.sense();
      if (P.W) { s.me = { x: +P.W.x.toFixed(2), z: +P.W.z.toFixed(2), y: +P.W.y.toFixed(2), yaw: +P.W.yaw.toFixed(3), low: P.W.low, item: P.item, roll: P.W.rollT > 0 }; s.camYaw = +P.C.moveYaw().toFixed(3); }
      s.hud = hud.state(); s.diff = G.diff; s.place = G.place ? G.place.name : ''; s.chDone = G.chDone || 0;
      if (P.W && G.collide) {                                   /* 둘레 30m 벽·바위(눈에 보이는 땅 모양) — 길 찾는 봇이 씀(sense는 봇·시험만 부름) */
        const w = [], r = [], x = P.W.x, z = P.W.z;
        for (const q of G.collide.walls) if (Math.min(Math.hypot(q[0] - x, q[1] - z), Math.hypot(q[2] - x, q[3] - z)) < 34) w.push(q);
        for (const q of G.collide.blockers) if (Math.hypot(q[0] - x, q[1] - z) < 30) r.push(q);
        s.obst = { walls: w, rocks: r };
      }
      return s;
    },
  };
  return W;
}
