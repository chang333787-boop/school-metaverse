// 게임 본판 — 첫 화면 → 장(2~6 수직 조각) · 장소는 무대 그릇으로 짓고 비움 · 플레이어 = 히컵(걷기 + 뒤따르는 카메라)
// 장 차례 생성기는 story/ch*.js · G(놀이 상태)를 장과 봇 감각(sense)이 함께 봄 · 봇은 DRG.sense()만 읽고 키만 누름
import * as THREE from 'three';
import { createEnv, U } from '../look/kit.js?v=15';
import { createStageHost } from '../core/stage.js?v=15';
import { createCollide } from '../play/collide.js?v=15';
import { createWalker, createFollowCam } from '../play/walker.js?v=15';
import { loadModel } from '../look/models.js?v=15';
import { createHumanRig } from '../look/human_rig.js?v=15';
import { createDragon, createPerson } from '../play/actors.js?v=15';
import { createHud } from '../ui/hud.js?v=15';
import { createBook } from '../ui/book.js?v=15';
import { createMap } from '../ui/map.js?v=15';
import { createBench } from '../ui/bench.js?v=15';
import { createSfx } from '../core/sfx.js?v=15';
import { showTitle, diffOf } from '../ui/title.js?v=15';
import { createRunner } from '../story/runner.js?v=15';
import { writeSlot, flushSlot } from '../story/save.js?v=15';
import { holdItem } from '../story/fx.js?v=15';
import { createRng } from '../core/rng.js?v=15';
import { showEnding } from '../ui/ending.js?v=15';

export const PLAYABLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];   // 0 = 오프닝 · 11 = 종장
const CH_FILE = Object.fromEntries(PLAYABLE.map((n) => [n, 'ch' + n]));
const _v = new THREE.Vector3(), _f = new THREE.Frustum(), _m = new THREE.Matrix4();

export async function buildGame(scene, camera, rng, opt = {}) {
  const Q = new URLSearchParams(location.search);
  const env = createEnv(scene, camera);
  const hud = createHud();
  const host = createStageHost({ gfx: opt.gfx, scene, camera, veil: { show: (t) => hud.veil.show(t || '불러오는 중'), hide: () => {} } });
  const G = { scene, camera, gfx: opt.gfx, env, host, hud, rng, diff: 'normal', grade: 0, slot: 1, place: null, placeKey: '', collide: null, inv: {}, flags: {}, t: 0, records: {}, cast: [], castBy: {} };
  G.book = createBook(G); G.map = createMap(); G.bench = createBench(); G.sfx = createSfx();
  /* 플레이어 */
  const P = G.player = { W: null, C: null, root: null, rig: null, item: null, lock: false, fT: 0, fTap: false, fLong: false, reach: false, away: false, cam: 'follow', hidden: false };
  loadModel('assets/models/hiccup.glb?v=15').then(({ root, bones }) => { P.root = root; P.rig = createHumanRig(bones, root); P.bones = bones; if (G.place) G.place.group.add(root); });

  /* 장소 짓기 — places/<이름>.js가 없으면 자리표시(_stub) */
  G.loadPlace = async (name, time, variant) => {
    let mod; try { mod = await import(`../places/${name}.js?v=15`); } catch (e) { mod = await import('../places/_stub.js?v=15'); }
    G.place = null; G.cast.length = 0; G.castBy = {};             // 장 안에서 이어지는 배우(keep)는 장소가 바뀌면 함께 비움
    let hs = 7; for (const ch of name) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0;   // 장소마다 제 씨앗(앞에서 난수를 얼마나 썼든 같은 마을 · 팀 A 지적)
    const prng = createRng(name === 'village' ? 1656844137 : hs);   // 마을 = 팀 A가 골목·지붕·길을 맞춘 배치(fx1 VILLAGE_SEED)
    const place = await host.load(name, (ctx) => mod.buildPlace(Object.assign(ctx, { env, rng: prng, opt: { time, variant, stub: name } })));
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
  G.useSpots = [];                                      // 쉬움 F 표시 자리 [{x,y,z}] — 장이 채움
  G.hold = (name) => holdItem(P, name);

  /* 걸음 */
  G.playerStep = (dt, I) => {
    if (!P.W) return;
    P.fTap = false;
    if (I.tap('use')) { P.taps = (P.taps || []).filter((t) => G.t - t < 1.5); P.taps.push(G.t); }
    P.mash = !!P.taps && P.taps.filter((t) => G.t - t < 1.5).length >= 4;   // 1.5초에 넷 = 연타(드래곤이 놀람 · design §1)
    if (I.on('use')) { P.fT += dt; P.fLong = P.fT >= 0.3; }
    else { if (P.fT > 0 && P.fT < 0.3) P.fTap = true; P.fT = 0; P.fLong = false; }
    P.reach = P.fLong && !P.noReach; P.away = P.reach;
    P.W.lock = P.lock || P.reach;                         // 손 내미는 동안은 멈춤(기다리기)
    if (P.cam === 'follow') { if (!G.book.draw && !P.aiming && G.bench.el.classList.contains('gone')) P.C.step(dt, I, P.W); P.W.step(dt, I, P.C.moveYaw()); }   // 책·작업대에 그리는 동안 끌기 = 펜
  };
  G.playerDraw = (a, dt) => {
    if (!P.root || !P.W) return;
    P.root.visible = !P.hidden;
    if (P.cam === 'follow') { P.W.draw(a, P.root); if (performance.now() - (G.benchT || -1e9) > 250) P.C.draw(dt, P.root); }   // bench 동안 카메라는 benchPath
    if (P.rig && P.cam === 'follow') {
      const to = P.pose || {}, R = P.rig;
      const tg = { speed: Math.min(1, P.W.speed / 4.2), low: P.W.low ? 1 : 0, reach: P.reach ? 1 : 0, away: P.away ? 0.8 : 0, throw: 0 };
      for (const k in to) tg[k] = to[k];
      for (const k in tg) if (k in R) R[k] += (tg[k] - R[k]) * Math.min(1, dt * 8);
      R.update(dt);
    }
  };

  /* 장 진행 */
  const R = G.runner = createRunner(G);
  G.onStepDone = (ch, idx) => { writeSlot(G.slot, { grade: G.grade, diff: G.diff, ch: ch.id, idx: idx + 1, book: G.book.state(), inv: G.inv, records: G.records, flags: G.flags }, true); };
  G.onChapterDone = (ch) => {
    const nx = PLAYABLE[PLAYABLE.indexOf(ch.id) + 1];
    writeSlot(G.slot, { grade: G.grade, diff: G.diff, ch: nx ?? ch.id, idx: 0, book: G.book.state(), inv: G.inv, records: G.records, flags: G.flags }, true);
    G.chDone = (G.chDone || 0) + 1;
    if (nx && Q.get('chain') !== '0') setTimeout(() => startCh(nx, 0), 1800);
  };
  async function startCh(n, idx) {
    const m = await import(`../story/${CH_FILE[n]}.js?v=15`);
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
    G.grade = +(Q.get('grade') || 4); G.diff = diffOf(G.grade, Q); G.slot = +(Q.get('slot') || 3);
    ready = startCh(+Q.get('ch'), +(Q.get('step') || 0));
  } else {
    hud.veil.hide();
    ready = Promise.resolve();
    showTitle({ playable: PLAYABLE, Q }).then((r) => {
      G.grade = r.grade; G.diff = diffOf(r.grade, Q); G.slot = r.slot;
      if (r.save) { G.book.load(r.save.book); Object.assign(G.inv, r.save.inv || {}); Object.assign(G.flags, r.save.flags || {}); Object.assign(G.records, r.save.records || {}); }
      startCh(r.ch, r.idx);
    });
  }
  addEventListener('pagehide', flushSlot);

  let last = performance.now();
  const W = {
    G, env, ready,
    step(dt, I) {
      G.t += dt; U.uTime.value = G.t; G.input = I;
      hud.tick(dt);
      if (host.busy) return;
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
      if (R.C) for (const x of R.C.actors) if (!x.manual) x.draw && x.draw(a, dt, camera.position);   // manual = 비행 엔진이 놓고 자세도 갱신
      for (const x of G.cast) if (!x.manual) x.draw && x.draw(a, dt, camera.position);
      G.place.draw && G.place.draw(a);
      env.follow();
      if (G.diff === 'easy') {                          // 쉬움: 쓸 수 있는 물건 위 F 키 그림만(6m 안)
        const L = []; for (const s of G.useSpots) { if (!G.near(s, 6)) continue; const p = G.toScreen(s.x, (s.y || 0) + 1.6, s.z); if (p.front) L.push(p); }
        hud.fkeys(L);
      }
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
