// 🧂 염전 일 놀이(SALT-2 · 단계 4 「28 사다리·소금」 · docs/systems/town_phase4.md · 꼬임 넷 · 단계마다 손동작이 다름 · 타이밍 막대 X) — town_minigame.js가 kind 'salt'로 부름(놀이 틀 c 그대로)
//   c.x = { lv(이번 판 단계 1~4), good(맑고 바람 센 날), soon(비가 올 것 같은 날), rain(지금 비), after(점수, 결과) → 판 뒤 한 줄 }
//   1 천일염 = 대파로 밀어 모으기 + 구름이 오면 '소금물 창고에 들이기' 판단 · 2 자염 = 달걀이 뜨는 통 고르기 → 불 세기 → 하얀 알갱이가 보이면 불 빼기(끝 판단 한 번)
//   3 토판염 = 흙바닥 꾹꾹 다지기 → 살살 긁기(빠르면 흙이 섞임) · 4 꽃소금 = 저어 녹이기(돌리기) → 천에 기울여 붓기(거르기) → 하얀 테가 보이면 걷기
//   배울 거리 = 혼합물의 분리(녹이기·거르기·증발) · 물의 상태 변화(물이 수증기로 날아감) — 사실만 · 셈 X · 판 하나 15~40초
const SCSS = `
.twn-play .s2{position:relative;height:150px;border-radius:12px;background:#dde7ea;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.twn-play .s2 .jr{position:absolute;bottom:10px;width:24%;height:110px;border:3px solid #6b7f88;border-top:0;border-radius:0 0 14px 14px;background:#cfe6ee;cursor:pointer;padding:0;min-height:0}
.twn-play .s2 .jr i{position:absolute;left:50%;width:22px;height:28px;margin-left:-11px;border-radius:50% 50% 46% 46%/58% 58% 42% 42%;background:#f5ecd9;border:2px solid #b49a6c}
.twn-play .s2 .jr.no{background:#e9d6d0}
.twn-play .s2 .pot{position:absolute;left:30%;width:40%;top:18px;height:84px;border:4px solid #3b3f45;border-top:0;border-radius:0 0 40px 40px;background:#eef2f3;overflow:hidden}
.twn-play .s2 .pot .wl{position:absolute;left:0;right:0;bottom:0;background:#8fc3d6}
.twn-play .s2 .pot .cr{position:absolute;left:6%;right:6%;bottom:0;height:10px;border-radius:6px;background:#fff;opacity:0;transition:opacity .4s}
.twn-play .s2 .pot.cry .cr{opacity:1}
.twn-play .s2 .pot.dry .wl{background:#c7b8a0}
.twn-play .s2 .fl3{position:absolute;left:36%;width:28%;top:110px;display:flex;gap:3px;justify-content:center}
.twn-play .s2 .fl3 i{width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:16px solid #f08a24;opacity:.12}
.twn-play .s2 .fl3.f1 i:nth-child(1),.twn-play .s2 .fl3.f2 i:nth-child(-n+2),.twn-play .s2 .fl3.f3 i{opacity:1}
.twn-play .s2r{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.twn-play .s2r button{min-height:34px;padding:4px 10px}
.twn-play .s2r button.on{background:#f08a24;color:#fff}
.twn-play .s2 .md{position:absolute;left:0;top:0;right:0;bottom:0;background:#8a6a4a}
.twn-play .s2 .md.wet{background:#7c8f96}
.twn-play .s2 .bp{position:absolute;width:30px;height:20px;margin:-10px 0 0 -15px;border-radius:50%;background:#6b4f35;box-shadow:0 3px 0 #4f3a27;cursor:pointer}
.twn-play .s2 .bp.h1{background:#7a5c40;box-shadow:0 1px 0 #4f3a27}
.twn-play .s2 .bp.ok{background:#9a7a58;box-shadow:none;width:34px;height:8px;margin:-4px 0 0 -17px}
.twn-play .s2 .sd{position:absolute;width:12px;height:9px;margin:-4px 0 0 -6px;border-radius:5px;background:#fbfbf8}
.twn-play .s2 .sd.in{opacity:0;transition:opacity .3s}
.twn-play .s2 .sd.mu{background:#9c8b78}
.twn-play .s2 .rk{position:absolute;width:9px;height:30%;transform:translate(-50%,-50%);background:#9c7650;border-radius:4px}
.twn-play .s2 .bw{position:absolute;left:8%;top:22px;width:38%;height:100px;border:4px solid #6b7f88;border-top:0;border-radius:0 0 50px 50px;background:#e9eef0;transform-origin:85% 10%;cursor:grab}
.twn-play .s2 .bw .mx{position:absolute;left:0;right:0;bottom:0;height:70%;background:#b8a58f;border-radius:0 0 46px 46px}
.twn-play .s2 .bw .sp9{position:absolute;left:50%;top:50%;width:6px;height:46px;margin:-23px 0 0 -3px;background:#9c7650;border-radius:3px}
.twn-play .s2 .ct{position:absolute;right:8%;top:40px;width:34%;height:12px;background:#f6f1e4;border:2px solid #c9b994;border-radius:6px}
.twn-play .s2 .ct i{position:absolute;left:30%;top:1px;height:8px;width:0;border-radius:4px;background:#7a5c40}
.twn-play .s2 .pn{position:absolute;right:8%;top:70px;width:34%;height:56px;border:4px solid #3b3f45;border-top:0;border-radius:0 0 28px 28px;background:#eef2f3;overflow:hidden}
.twn-play .s2 .pn .wl{position:absolute;left:0;right:0;bottom:0;height:0;background:#bfe0ea}
.twn-play .s2 .pn .cr{position:absolute;left:4%;right:4%;bottom:0;height:9px;border-radius:5px;background:#fff;opacity:0;transition:opacity .4s}
.twn-play .s2 .pn.cry .cr{opacity:1}
.twn-play .s2 .ov{position:absolute;right:6%;top:22px;font-size:12px;font-weight:900;font-style:normal;color:#b0412e;opacity:0}
.twn-play .s2 .ov.on{opacity:1}
`;
const scss = () => { if (document.getElementById('twn-salt-css')) return; const s = document.createElement('style'); s.id = 'twn-salt-css'; s.textContent = SCSS; document.head.appendChild(s); };
export const SALT_FACT = {
  1: ['바닷물이 햇볕과 바람에 마르면 물은 날아가고 소금이 남아요(증발). 맑고 바람 부는 날 더 빨리 말라요', 'Sun and wind dry seawater: the water goes into the air and salt stays (evaporation). Sunny, windy days dry it faster'],
  2: ['달걀은 맹물에선 가라앉고 진한 소금물에선 떠요. 진한 소금물을 끓이면 물은 수증기로 날아가고 소금 알갱이가 남아요', 'An egg sinks in plain water but floats in strong brine. Boiling brine turns the water to steam and leaves salt grains'],
  3: ['토판염은 갯벌 흙을 단단하게 다진 바닥에서 바닷물을 말려 얻는 소금이에요. 흙이 섞이지 않게 살살 긁어 모아요', 'Topan salt is dried from seawater on a floor of packed mudflat clay. It is scraped gently so no mud mixes in'],
  4: ['흙이 섞인 소금을 물에 녹여 천에 거르면 흙은 천에 남고 맑은 소금물만 내려가요. 이 물을 다시 졸이면 하얀 소금이 생겨요(혼합물의 분리)', 'Dissolve muddy salt in water and pour it through cloth: the mud stays on the cloth and clear brine goes through. Boil that again for white salt (separating a mixture)'],
};
export function mkSalt(c) { const X = c.x || {}, lv = Math.max(1, Math.min(4, (X.lv | 0) || 1)); scss(); const g = (lv === 2 ? saltBoil : lv === 3 ? saltMud : lv === 4 ? saltFlower : saltSun)(c, X); c.mg.dataset.lv = lv; c.mg.dataset.hand = g.hand;
  let tl = ''; const fin = c.finish; c.finish = ok => { if (c.done) return; const ex = g.extra ? g.extra() : {}; tl = X.after ? X.after(ok, ex) || '' : ''; if (!tl) { const f = SALT_FACT[lv]; tl = '💡 ' + f[c.en ? 1 : 0]; } fin(ok); };
  g.tail = () => tl; return g; }
const dragXY = (el, e) => { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
// 1 천일염: 대파로 왼쪽 더미까지 밀기 · 구름이 다가오면(반쯤) '소금물 창고에 들이기' 단추 = 더 모을지 들일지 판단 · 맑고 바람 센 날 = 소금이 많고 구름이 늦게 옴
function saltSun(c, X) { const N = X.good ? 18 : 14, T = (X.rain ? 12 : X.soon ? 16 : 22) * c.zw, S = []; let rx = 0.55, ry = 0.5, got = 0, t = 0, stored = false, asked = false, auto = false;
  c.mg.innerHTML = '<div class="sp"><i class="pile">🧂 <b>0</b></i><i class="cl">☁️</i><i class="rk"></i></div><div class="s2r"><button class="sub sst" data-a="store" style="display:none">' + c.T('🏠 소금물 창고에 들이기', '🏠 Bring the brine into the shed') + '</button></div>';
  const sp = c.mg.querySelector('.sp'), rk = sp.querySelector('.rk'), cl = sp.querySelector('.cl'), pb = sp.querySelector('.pile b'), stB = c.mg.querySelector('.sst');
  for (let i = 0; i < N; i++) { const e = document.createElement('i'); e.className = 'sd'; sp.appendChild(e); S.push({ x: 0.3 + Math.random() * 0.66, y: 0.1 + Math.random() * 0.8, e, on: true }); }
  const put = s => { s.e.style.left = (s.x * 100).toFixed(1) + '%'; s.e.style.top = (s.y * 100).toFixed(1) + '%'; }; S.forEach(put);
  const rake = () => { rk.style.left = (rx * 100).toFixed(1) + '%'; rk.style.top = (ry * 100).toFixed(1) + '%'; }; rake();
  const move = (nx, ny) => { if (c.done) return; nx = Math.max(0.05, Math.min(0.98, nx)); ny = Math.max(0.12, Math.min(0.88, ny));
    if (nx < rx) for (const s of S) { if (!s.on || Math.abs(s.y - ry) > 0.16 || s.x > rx + 0.02 || s.x < nx - 0.03) continue; s.x = nx - 0.02; if (s.x < 0.15) { s.on = false; got++; s.e.className = 'sd in'; pb.textContent = got; c.snd('tick'); if (got >= N) { c.say(c.T('소금을 다 모았어요!', 'All the salt is in!')); c.finish(3); } } put(s); }   /* 왼쪽으로 밀 때만 대파 앞 소금이 함께 감 */
    rx = nx; ry = ny; rake(); };
  const store = () => { if (c.done || stored) return; stored = true; c.snd('ding'); const f = got / N; c.say(c.T('소금물을 창고에 들였어요. 비가 와도 묽어지지 않아요', 'The brine is in the shed — rain can’t thin it now')); c.finish(Math.min(3, (f >= 0.6 ? 2 : f >= 0.3 ? 1 : 0) + 1)); };
  let drag = false; const pd = e => { e.preventDefault(); drag = true; const [x, y] = dragXY(sp, e); move(Math.max(x, 0.05), y); }, pm = e => { if (drag) { const [x, y] = dragXY(sp, e); move(x, y); } }, pu = () => { drag = false; }, sb = e => { e.preventDefault(); store(); };
  sp.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu); stB.addEventListener('click', sb);
  c.say(c.T('대파를 잡고 왼쪽으로 쭉 밀어 소금을 더미로 모아요 (끌거나 화살표)', 'Grab the rake and push the salt left into the pile (drag · arrows)'));
  return { go: '', hand: 'push', down() {}, key(code) { if (code === 'KeyE' || code === 'Enter') { if (asked) { store(); return true; } return false; } const d = { ArrowLeft: [-0.035, 0], KeyA: [-0.035, 0], ArrowRight: [0.05, 0], KeyD: [0.05, 0], ArrowUp: [0, -0.06], KeyW: [0, -0.06], ArrowDown: [0, 0.06], KeyS: [0, 0.06] }[code]; if (!d) return false; move(rx + d[0], ry + d[1]); return true; },
    extra: () => ({ lv: 1, stored, got, N }), dbg: { auto: () => { auto = true; }, get st() { return { lv: 1, got, N, stored, asked, t, T }; }, store: () => store() },
    tick(dt) { t += dt; cl.style.left = (88 - (t / T) * 74).toFixed(1) + '%';
      if (!asked && t > T * 0.5) { asked = true; stB.style.display = ''; c.say(c.T('구름이 다가와요. 더 모을까요, 소금물을 창고에 들일까요?', 'A cloud is coming. Keep raking, or bring the brine into the shed?')); }
      if (auto && !c.done) { const s = S.find(q => q.on); if (s) { if (Math.abs(ry - s.y) > 0.05 || rx < s.x + 0.02) move(Math.min(0.98, s.x + 0.04), s.y); else move(rx - 0.05, ry); } if (asked && got / N >= 0.6) store(); }
      if (t >= T && !c.done) { c.say(c.T('후두둑 비가 와요. 남은 소금은 녹고 소금물은 묽어져요', 'Rain! The salt left out melts and the brine gets thin')); const f = got / N; c.finish(f >= 0.9 ? 3 : f >= 0.6 ? 2 : f >= 0.3 ? 1 : 0); } },
    dispose() { sp.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); stB.removeEventListener('click', sb); } }; }
// 2 자염(진한 소금물 졸이기): ① 달걀이 뜨는 통 고르기(진하기) ② 불 세기(약·중·센) ③ 하얀 알갱이가 보이면 불 빼기 — 너무 일찍 빼면 '아직', 다 졸면 바닥에 눌음 · 센 불 = 빨리 졸지만 알갱이가 잘아짐
function saltBoil(c, X) { const ord = [0, 1, 2].sort(() => Math.random() - 0.5), RATE = [0, 0.06, 0.1, 0.18], CRY = 0.35; let ph = 'egg', wrong = 0, eggOK = false, fire = 0, fmax = 0, wl = 1, t = 0, cryS = false, auto = false, at = 0;
  c.mg.innerHTML = '<div class="s2"><div class="jars">' + ord.map((k, i) => '<button class="jr" data-j="' + i + '" style="left:' + (6 + i * 32) + '%"><i style="bottom:' + [4, 38, 74][k] + 'px"></i></button>').join('') + '</div><div class="pot" style="display:none"><i class="wl"></i><i class="cr"></i></div><div class="fl3" style="display:none"><i></i><i></i><i></i></div></div>'
    + '<div class="s2r fr" style="display:none">' + [1, 2, 3].map(f => '<button class="sub" data-f="' + f + '">' + c.T(['', '약불', '중불', '센불'][f], ['', 'Low', 'Medium', 'High'][f]) + '</button>').join('') + '<button data-a="off">' + c.T('불 빼기', 'Fire out') + '</button></div>';
  const R = c.mg.querySelector('.s2'), pot = R.querySelector('.pot'), wv = pot.querySelector('.wl'), fl = R.querySelector('.fl3'), fr = c.mg.querySelector('.fr');
  const draw = () => { wv.style.height = (wl * 100).toFixed(0) + '%'; fl.className = 'fl3 f' + fire; for (const b of fr.querySelectorAll('[data-f]')) b.classList.toggle('on', +b.dataset.f === fire); };
  const pickJar = i => { if (ph !== 'egg' || c.done) return; const k = ord[i], b = R.querySelector('[data-j="' + i + '"]'); if (k === 2) { eggOK = wrong === 0; ph = 'boil'; c.snd('ding'); R.querySelector('.jars').style.display = 'none'; pot.style.display = ''; fl.style.display = ''; fr.style.display = ''; draw(); c.say(c.T('달걀이 떴어요. 진한 소금물이에요. 솥에 붓고 불을 켜요', 'The egg floats — strong brine! Pour it in the pot and light the fire')); }
    else { wrong++; if (b) b.classList.add('no'); c.snd('buzz'); c.say(k === 0 ? c.T('달걀이 바닥에 가라앉아요. 묽은 소금물이에요', 'The egg sinks to the bottom — weak brine') : c.T('달걀이 가운데에 떠 있어요. 조금 더 진해야 해요', 'The egg hangs in the middle — it needs to be stronger')); } };
  const setF = f => { if (ph !== 'boil' || c.done) return; fire = f; fmax = Math.max(fmax, f); c.snd('tick'); draw(); if (f === 3) c.say(c.T('센 불은 빨리 졸지만 알갱이가 잘아져요', 'High heat is fast, but the grains come out tiny')); };
  const off = () => { if (ph !== 'boil' || c.done) return; if (wl >= CRY) { fire = 0; draw(); c.say(c.T('아직 하얀 알갱이가 안 보여요. 물이 더 졸아야 해요', 'No white grains yet — more water has to boil off')); return; } ph = 'end'; fire = 0; draw(); const big = fmax <= 2; c.snd('done'); c.say(big ? c.T('알갱이가 굵은 소금이 남았어요!', 'Big salt grains are left!') : c.T('소금이 남았어요. 알갱이가 잘아요', 'Salt is left — the grains are tiny')); c.finish((eggOK ? 1 : 0) + 1 + (big ? 1 : 0)); };
  const ck = e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); if (b.dataset.j != null) pickJar(+b.dataset.j); else if (b.dataset.f) setF(+b.dataset.f); else if (b.dataset.a === 'off') off(); };
  c.mg.addEventListener('click', ck);
  c.say(c.T('달걀이 뜨는 통을 골라요. 진한 소금물일수록 달걀이 떠요', 'Pick the tub where the egg floats — the stronger the brine, the higher it floats'));
  return { go: '', hand: 'egg-fire', down() {}, key(code) { const d = /^(Digit|Numpad)([1-3])$/.exec(code); if (d) { if (ph === 'egg') pickJar(+d[2] - 1); else setF(+d[2]); return true; } if (code === 'KeyE' || code === 'Enter' || code === 'Space') { off(); return true; } return false; },
    extra: () => ({ lv: 2, eggOK, wrong, fmax, wl }), dbg: { auto: () => { auto = true; }, get st() { return { lv: 2, ph, wl, fire, wrong, eggOK }; }, jar: i => pickJar(i), fire: f => setF(f), off: () => off() },
    tick(dt) { t += dt; if (auto) { at += dt; if (at > 0.5) { at = 0; if (ph === 'egg') pickJar(ord.indexOf(2)); else if (ph === 'boil' && !fire && wl >= CRY) setF(2); else if (ph === 'boil' && wl < CRY - 0.05) off(); } }
      if (ph === 'boil' && fire) { wl = Math.max(0, wl - RATE[fire] * dt / c.zw); draw(); if (!cryS && wl < CRY) { cryS = true; pot.classList.add('cry'); c.snd('pop'); c.say(c.T('하얀 소금 알갱이가 보여요! 알맞을 때 불을 빼요', 'White salt grains! Take the fire out when it looks right')); }
        if (wl <= 0) { ph = 'end'; pot.classList.add('dry'); c.snd('buzz'); c.say(c.T('물이 다 졸아 솥 바닥에 눌었어요. 조금 일찍 빼요', 'All the water boiled off and it stuck to the pot — take the fire out a bit sooner')); c.finish(eggOK ? 1 : 0); } }
      if (t > 45 && !c.done) { c.say(c.T('오늘 졸이기는 여기까지 해요', 'That’s enough boiling for today')); c.finish(eggOK ? 1 : 0); } },
    dispose() { c.mg.removeEventListener('click', ck); } }; }
// 3 토판염: ① 흙바닥 울퉁불퉁한 곳을 꾹꾹 다지기(두 번씩 누르기) ② 바닷물을 대고 마르기를 기다림 ③ 굳은 소금을 살살 긁어 모으기 — 빨리 끌면 흙이 섞여 거뭇해짐
function saltMud(c, X) { const NB = 7, N = 12, B = [], S = []; let ph = 'tamp', flat = 0, got = 0, mud = 0, t = 0, dryT = 0, rx = 0.6, ry = 0.5, lt = 0, lx = 0, ly = 0, warnT = 0, auto = false, at = 0;
  c.mg.innerHTML = '<div class="s2"><i class="md"></i><i class="rk" style="display:none"></i></div>'; const R = c.mg.querySelector('.s2'), md = R.querySelector('.md'), rk = R.querySelector('.rk');
  for (let i = 0; i < NB; i++) { const e = document.createElement('i'); e.className = 'bp'; e.dataset.b = i; const x = 0.12 + ((i * 0.37 + 0.11) % 0.8), y = 0.2 + ((i * 0.53 + 0.17) % 0.62); e.style.left = (x * 100).toFixed(1) + '%'; e.style.top = (y * 100).toFixed(1) + '%'; R.appendChild(e); B.push({ e, n: 0 }); }
  const tamp = i => { const b = B[i]; if (ph !== 'tamp' || !b || b.n >= 2 || c.done) return; b.n++; c.snd(b.n >= 2 ? 'tick' : 'pop'); b.e.className = 'bp ' + (b.n >= 2 ? 'ok' : 'h1'); if (b.n >= 2 && ++flat >= NB) { ph = 'dry'; dryT = X.good ? 2 : 3.2; md.className = 'md wet'; c.say(c.T('바닥이 단단해졌어요. 바닷물을 대고 햇볕과 바람에 말려요', 'The floor is firm. Let seawater in and wait for sun and wind to dry it')); } };
  const grow = () => { for (const b of B) b.e.remove(); md.className = 'md'; for (let i = 0; i < N; i++) { const e = document.createElement('i'); e.className = 'sd'; const s = { x: 0.1 + Math.random() * 0.8, y: 0.15 + Math.random() * 0.7, e, on: true }; e.style.left = (s.x * 100).toFixed(1) + '%'; e.style.top = (s.y * 100).toFixed(1) + '%'; R.appendChild(e); S.push(s); }
    rk.style.display = ''; rake(); ph = 'scrape'; c.snd('ding'); c.say(c.T('소금이 굳었어요. 대파로 살살 긁어 모아요. 빨리 끌면 흙이 섞여요', 'The salt has formed. Scrape it gently with the rake — too fast and mud mixes in')); };
  const rake = () => { rk.style.left = (rx * 100).toFixed(1) + '%'; rk.style.top = (ry * 100).toFixed(1) + '%'; };
  const end = () => { if (c.done) return; ph = 'end'; const f = got / N; c.say(mud <= 2 ? c.T('하얀 토판염을 모았어요!', 'You gathered clean topan salt!') : c.T('소금을 모았는데 흙이 조금 섞였어요', 'You gathered the salt, but some mud got in')); c.finish(1 + (f >= 0.8 ? 1 : 0) + (mud <= 2 && f >= 0.5 ? 1 : 0)); };
  const scr = (nx, ny, v) => { if (ph !== 'scrape' || c.done) return; nx = Math.max(0.04, Math.min(0.96, nx)); ny = Math.max(0.1, Math.min(0.9, ny)); const fast = v > 1.5;
    for (const s of S) { if (!s.on || Math.hypot(s.x - nx, (s.y - ny) * 0.6) > 0.07) continue; s.on = false; got++; if (fast) { mud++; s.e.className = 'sd mu'; c.snd('buzz'); setTimeout(() => s.e.classList.add('in'), 250); } else { s.e.className = 'sd in'; c.snd('tick'); } }
    if (fast && warnT <= 0) { warnT = 1.6; c.say(c.T('너무 빨라요. 흙이 섞여 거뭇해져요. 살살!', 'Too fast — mud mixes in and the salt turns grey. Gently!')); }
    rx = nx; ry = ny; rake(); if (got >= N) end(); };
  let drag = false; const pd = e => { const b = e.target.closest('.bp'); if (b) { e.preventDefault(); tamp(+b.dataset.b); return; } if (ph !== 'scrape') return; e.preventDefault(); drag = true; const [x, y] = dragXY(R, e); lx = x; ly = y; lt = performance.now(); scr(x, y, 0); },
    pm = e => { if (!drag) return; const [x, y] = dragXY(R, e), n = performance.now(), dt9 = Math.max(16, n - lt) / 1000, v = Math.hypot(x - lx, y - ly) / dt9; lx = x; ly = y; lt = n; scr(x, y, v); }, pu = () => { drag = false; };
  R.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu);
  c.say(c.T('울퉁불퉁한 흙을 두 번씩 꾹꾹 눌러 다져요', 'Press each bumpy spot of mud twice to pack it down'));
  return { go: '', hand: 'tamp-scrape', down() {}, key(code) { if (ph === 'tamp' && (code === 'KeyE' || code === 'Space')) { const i = B.findIndex(b => b.n < 2); if (i >= 0) tamp(i); return true; } const d = { ArrowLeft: [-0.03, 0], KeyA: [-0.03, 0], ArrowRight: [0.03, 0], KeyD: [0.03, 0], ArrowUp: [0, -0.05], KeyW: [0, -0.05], ArrowDown: [0, 0.05], KeyS: [0, 0.05] }[code]; if (!d) return false; scr(rx + d[0], ry + d[1], 0.5); return true; },
    extra: () => ({ lv: 3, got, mud, N }), dbg: { auto: () => { auto = true; }, get st() { return { lv: 3, ph, flat, got, mud }; }, tamp: i => tamp(i), scr: (x, y, v) => scr(x, y, v) },
    tick(dt) { t += dt; if (warnT > 0) warnT -= dt; if (ph === 'dry' && (dryT -= dt) <= 0) grow();
      if (auto && !c.done) { at += dt; if (at > 0.12) { at = 0; if (ph === 'tamp') { const i = B.findIndex(b => b.n < 2); if (i >= 0) tamp(i); } else if (ph === 'scrape') { const s = S.find(q => q.on); if (s) { const dx = s.x - rx, dy = s.y - ry, d = Math.hypot(dx, dy), st = Math.min(d, 0.06); scr(rx + dx / (d || 1) * st, ry + dy / (d || 1) * st, 0.5); } } } }
      if (t > 40 && !c.done) end(); },
    dispose() { R.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); } }; }
// 4 꽃소금(다시 만든 소금 · 염전 창고에서 이웃 어른과): ① 흙 섞인 소금을 물에 저어 녹이기(주걱을 빙글빙글 · 두 바퀴) ② 그릇을 기울여 천에 붓기(거르기 · 너무 기울이면 천 위로 넘침) ③ 솥에서 졸이다 하얀 테가 보이면 걷기
function saltFlower(c, X) { const CRY = 0.4; let ph = 'stir', ang = 0, la = null, dis = 0, tilt = 0, pour = 0, over = 0, wl = 0, t = 0, skimOK = false, ovT = 0, auto = false, kT = 0;
  c.mg.innerHTML = '<div class="s2"><div class="bw"><i class="mx"></i><i class="sp9"></i></div><div class="ct"><i></i></div><div class="pn"><i class="wl"></i><i class="cr"></i></div><i class="ov">' + c.T('넘쳐요!', 'Overflowing!') + '</i></div><div class="s2r"><button class="sub sk" data-a="skim" style="display:none">' + c.T('하얀 소금 걷기', 'Skim the white salt') + '</button></div>';
  const R = c.mg.querySelector('.s2'), bw = R.querySelector('.bw'), mx = bw.querySelector('.mx'), spn = bw.querySelector('.sp9'), mudE = R.querySelector('.ct i'), pn = R.querySelector('.pn'), pw = pn.querySelector('.wl'), ov = R.querySelector('.ov'), sk = c.mg.querySelector('.sk');
  const drawStir = () => { spn.style.transform = 'rotate(' + (ang * 57.3).toFixed(0) + 'deg)'; const k = Math.min(1, dis); mx.style.background = k >= 1 ? '#d9e6ea' : k > 0.5 ? '#c9c2b4' : '#b8a58f'; };
  const stir = d => { if (ph !== 'stir' || c.done) return; ang += d; dis += Math.abs(d) / (4 * Math.PI) / c.zw; drawStir(); if (dis >= 1) { ph = 'pour'; c.snd('ding'); c.say(c.T('소금이 다 녹았어요. 그릇을 아래로 끌어 천에 살살 기울여 부어요', 'The salt has dissolved. Drag the bowl down to tip it gently onto the cloth')); } };
  const setTilt = v => { if (ph !== 'pour' || c.done) return; tilt = Math.max(0, Math.min(1, v)); bw.style.transform = 'rotate(' + (-tilt * 55).toFixed(0) + 'deg)'; };
  const skim = () => { if (ph !== 'boil' || c.done) return; if (wl >= CRY) { c.say(c.T('아직 하얀 테가 안 보여요. 조금 더 졸여요', 'No white ring yet — boil a little longer')); return; } skimOK = true; ph = 'end'; c.snd('done'); c.say(c.T('하얀 꽃소금을 걷었어요! 거름천에는 흙이 남았어요', 'You skimmed white salt! The mud stayed on the cloth')); c.finish(1 + (over === 0 ? 1 : 0) + 1); };
  let drag = 0, y0 = 0; const pd = e => { const r = bw.getBoundingClientRect(); if (e.clientX < r.left - 10 || e.clientX > r.right + 10) return; e.preventDefault(); drag = 1; y0 = dragXY(R, e)[1]; la = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); },
    pm = e => { if (!drag) return; if (ph === 'stir') { const r = bw.getBoundingClientRect(), a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); if (la != null) { let d = a - la; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; stir(d); } la = a; } else if (ph === 'pour') setTilt((dragXY(R, e)[1] - y0) * 1.6); },
    pu = () => { drag = 0; la = null; if (ph === 'pour') setTilt(0); }, ck = e => { if (e.target.closest('[data-a="skim"]')) { e.preventDefault(); skim(); } };
  R.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu); c.mg.addEventListener('click', ck);
  c.say(c.T('흙이 섞인 소금을 물에 넣었어요. 주걱을 빙글빙글 돌려 녹여요 (원을 그리며 끌거나 ← →)', 'Muddy salt is in the water. Stir in circles to dissolve it (drag round · ← →)'));
  return { go: '', hand: 'stir-tilt', down() {}, key(code) { if (ph === 'stir' && /Arrow(Left|Right)|Key[AD]/.test(code)) { stir(0.5); return true; } if (ph === 'pour' && /ArrowDown|KeyS/.test(code)) { setTilt(tilt + 0.15); kT = 0.25; return true; } if (ph === 'pour' && /ArrowUp|KeyW/.test(code)) { setTilt(tilt - 0.2); return true; } if (code === 'KeyE' || code === 'Space' || code === 'Enter') { skim(); return true; } return false; },
    extra: () => ({ lv: 4, over, skimOK, pour }), dbg: { auto: () => { auto = true; }, get st() { return { lv: 4, ph, dis, tilt, pour, over, wl }; }, stir: d => stir(d), tilt: v => setTilt(v), skim: () => skim() },
    tick(dt) { t += dt; if (kT > 0 && (kT -= dt) <= 0 && ph === 'pour') setTilt(tilt - 0.15);
      if (auto && !c.done) { if (ph === 'stir') stir(0.12); else if (ph === 'pour') setTilt(0.55); else if (ph === 'boil' && wl < CRY - 0.08) skim(); }
      if (ph === 'pour') { if (tilt > 0.8) { if (ovT <= 0) { over++; ovT = 1.5; c.snd('buzz'); ov.classList.add('on'); c.say(c.T('너무 기울였어요. 천 위로 넘쳐 흙이 같이 내려가요', 'Tipped too far — it spills over the cloth and mud goes through')); } } else ov.classList.remove('on'); if (ovT > 0) ovT -= dt;
        if (tilt > 0.15) { pour = Math.min(1, pour + tilt * dt * 0.35); mudE.style.width = (pour * 40).toFixed(0) + '%'; pw.style.height = (pour * 70).toFixed(0) + '%'; if (pour >= 1) { ph = 'boil'; wl = 0.7; tilt = 0; bw.style.transform = ''; ov.classList.remove('on'); sk.style.display = ''; c.snd('ding'); c.say(c.T('천에 흙이 남고 맑은 소금물이 내려왔어요. 졸이다가 하얀 테가 보이면 걷어요', 'The mud stayed on the cloth and clear brine came through. Boil it, and skim when a white ring shows')); } } }
      if (ph === 'boil') { wl = Math.max(0, wl - 0.1 * dt / c.zw); pw.style.height = (wl * 100).toFixed(0) + '%'; if (wl < CRY) pn.classList.add('cry'); if (wl <= 0) { ph = 'end'; c.snd('buzz'); c.say(c.T('물이 다 졸아 바닥에 눌었어요. 하얀 테가 보이면 바로 걷어요', 'It all boiled off and stuck — skim as soon as the white ring shows')); c.finish(1 + (over === 0 ? 1 : 0)); } }
      if (t > 50 && !c.done) c.finish(dis >= 1 ? 1 : 0); },
    dispose() { R.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); c.mg.removeEventListener('click', ck); } }; }
