// 물음숲 체험 수업 — 장소마다 직접 해 보는 2~3분 수업. 반디(AI)는 옆에서 말을 걸어요.
const FONT = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pickR = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ───────── 수업 목록 ─────────
export const LESSONS = [
  { id: 'math', place: 'path', at: [-26.6, 18.6], icon: '🔢', subject: '생각 근육 · 수학', name: '반디 튜터와 문제 풀기',
    mission: '반디가 내 실력에 맞춰 문제를 바꿔요. 레벨 4까지 올라가 보세요.' },
  { id: 'filter', place: 'lab', at: [-23.4, -28.6], icon: '💧', subject: '진짜 실험실 · 과학', name: '개울물 거르기 실험',
    mission: '층을 쌓아 냄새나는 개울물을 맑게! 먼저 예측하고, 진짜로 해 보고, 다른 점을 찾아요.' },
  { id: 'stream', place: 'bigq', at: [-35.8, -4.6], icon: '🌊', subject: '큰 물음 · 사회+과학', name: '우리 동네 개울 고치기',
    mission: '개울 냄새를 30% 아래로 낮춰 보세요. 반디는 냄새 지도를, 손은 우리가!' },
  { id: 'window', place: 'window', at: [7.4, -41.4], icon: '🌏', subject: '세계 창문 · 영어', name: '맨목소리로 말 걸기',
    mission: '바닷가 학교 친구에게 할 말 세 가지를 통역 없이 전해 보세요.' },
  { id: 'farm', place: 'farm', at: [51.6, -12.6], icon: '🌱', subject: '살림 · 실과', name: '빛 농장 상추 키우기',
    mission: '반디보다 에너지는 적게 쓰고, 크기는 반디 상추의 80% 넘게 키워 보세요.' },
  { id: 'music', place: 'sound', at: [23.6, 25.4], icon: '🎵', subject: '함께 소리 · 음악', name: '우리 반 리듬 만들기',
    mission: '악기 세 가지 이상으로 리듬을 만들고 친구들과 합주해요.' },
  { id: 'art', place: 'sound', at: [43.4, 40.4], icon: '🎨', subject: '손자국 · 미술', name: '내 손으로 그리고 걸기',
    mission: '손으로 그림을 그려 손자국 마당에 걸어 보세요. 반디도 그릴 수 있지만…' },
  { id: 'ai', place: 'nest', at: [-10.4, -12.8], icon: '🤖', subject: '반디 길들이기 · 정보', name: '분리수거 AI 가르치기',
    mission: 'AI에게 분리수거를 가르쳐서 시험 점수 90점을 넘겨 보세요.' }
];

// ───────── 소리 ─────────
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d = 0.15, type = 'sine', v = 0.15, when = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02);
}
function kick(v = 0.5) {
  const a = ac(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.3);
}
function snare(v = 0.25) {
  const a = ac(); if (!a) return;
  const t = a.currentTime, n = a.sampleRate * 0.15, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 1200;
  s.buffer = b; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  s.connect(f).connect(g).connect(a.destination); s.start(t);
}
const ding = () => { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.18, 'sine', 0.08, 0.08); };
const buzz = () => tone(200, 0.18, 'triangle', 0.1);

// ───────── DOM 도우미 ─────────
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

export function createLessons(hooks) {
  const root = document.getElementById('lesson');
  let cur = null, curDef = null;
  let stamps = {};
  try { stamps = JSON.parse(localStorage.getItem('q36.stamps') || '{}') || {}; } catch (e) { stamps = {}; }
  const count = () => LESSONS.filter((l) => stamps[l.id]).length;

  function open(id) {
    const def = LESSONS.find((l) => l.id === id);
    if (!def) return;
    close(true);
    ac();
    curDef = def;
    root.innerHTML = '';
    const box = el('div', 'lsIn');
    const head = el('div', 'lsHead', `<div class="lsIc">${def.icon}</div><div class="lsHt"><span class="lsSub">${def.subject}</span><h2>${def.name}</h2><p>${def.mission}</p></div>`);
    const x = el('button', 'x', '✕'); x.onclick = () => close(); head.appendChild(x);
    const body = el('div', 'lsBody'), side = el('div', 'lsSide'), main = el('div', 'lsMain');
    body.append(side, main);
    const foot = el('div', 'lsBanbi', '<div class="orb"></div><div class="bub"><b>반디</b><span></span></div>');
    box.append(head, body, foot);
    root.appendChild(box);
    root.classList.add('on');
    const sayEl = foot.querySelector('span');
    let doneShown = false;
    const api = {
      side, main, def,
      say(t, ask) { sayEl.textContent = t; foot.classList.toggle('ask', !!ask); foot.classList.remove('pop'); void foot.offsetWidth; foot.classList.add('pop'); },
      canvas(h = 400, w = 640) {
        const c = el('canvas', 'lsCv'); c.width = w; c.height = h; main.appendChild(c);
        return { c, g: c.getContext('2d'), W: w, H: h };
      },
      row(cls) { const r = el('div', 'lsRow' + (cls ? ' ' + cls : '')); side.appendChild(r); return r; },
      h(t) { side.appendChild(el('div', 'lsH', t)); },
      p(t, cls) { const e = el('p', 'lsP' + (cls ? ' ' + cls : ''), t); side.appendChild(e); return e; },
      btn(t, fn, cls, parent) { const b = el('button', 'lb' + (cls ? ' ' + cls : ''), t); b.onclick = (e) => { ac(); fn(e, b); }; (parent || side).appendChild(b); return b; },
      seg(opts, val, on, parent) {
        const r = el('div', 'seg'); (parent || side).appendChild(r);
        const bs = opts.map(([v, t]) => { const b = el('button', v === val ? 'on' : '', t); b.onclick = () => { bs.forEach((x) => x.classList.remove('on')); b.classList.add('on'); ac(); on(v); }; r.appendChild(b); return b; });
        return r;
      },
      slider(o) {
        const w = el('label', 'sl'); const top = el('div', 'slT', `<span>${o.label}</span><b></b>`);
        const i = el('input'); i.type = 'range'; i.min = o.min; i.max = o.max; i.step = o.step || 1; i.value = o.value;
        const b = top.querySelector('b'); const upd = () => { b.textContent = o.fmt ? o.fmt(+i.value) : i.value; };
        i.oninput = () => { upd(); o.on(+i.value); }; upd();
        w.append(top, i); side.appendChild(w); return i;
      },
      stats(names) {
        const r = el('div', 'lsStats'); main.appendChild(r);
        const out = {};
        for (const [k, t] of names) { const s = el('div', 'st', `<small>${t}</small><b>-</b>`); r.appendChild(s); out[k] = (v) => { s.querySelector('b').innerHTML = v; }; }
        return out;
      },
      done(msg) {
        if (doneShown) return;
        doneShown = true;
        const first = !stamps[def.id];
        stamps[def.id] = 1;
        try { localStorage.setItem('q36.stamps', JSON.stringify(stamps)); } catch (e) { /* 괜찮아요 */ }
        hooks.onStamp && hooks.onStamp(count());
        tone(523, 0.15, 'triangle', 0.15); tone(659, 0.15, 'triangle', 0.15, 0.12); tone(784, 0.3, 'triangle', 0.15, 0.24);
        const d = el('div', 'lsDone', `<div class="stamp">${def.icon}</div><h3>${first ? '물음 여권 도장!' : '또 해냈어요!'}</h3><p>${msg}</p><p class="cnt">물음 여권 ${count()} / ${LESSONS.length}</p>`);
        const r = el('div', 'ebtns');
        const b1 = el('button', 'big', '조금 더 해 볼래요'); b1.onclick = () => d.remove();
        const b2 = el('button', 'big main', '학교로 돌아가기'); b2.onclick = () => close();
        r.append(b1, b2); d.appendChild(r); box.appendChild(d);
      },
      tone, ding, buzz, kick, snare,
      world: hooks.world
    };
    cur = LESSON_IMPL[id](api) || {};
    hooks.onOpen && hooks.onOpen(def);
  }
  function close(silent) {
    if (cur && cur.stop) cur.stop();
    cur = null;
    if (curDef && !silent) hooks.onClose && hooks.onClose(curDef);
    curDef = null;
    root.classList.remove('on');
    root.innerHTML = '';
  }
  return {
    open, close, isOpen: () => !!curDef, stamps: () => stamps, count,
    tick(dt) { if (cur && cur.tick) cur.tick(dt); },
    key(e) { if (cur && cur.key) cur.key(e); }
  };
}

// ───────── 수업들 ─────────
const LESSON_IMPL = {};

// 1. 반디 튜터 — 실력에 맞춰 바뀌는 문제, 세 번 규칙
LESSON_IMPL.math = (api) => {
  const { g, W, H } = api.canvas(380);
  api.h('답 고르기 (1~4 키)');
  const ans = api.row('ans');
  api.h('지금 상태');
  const info = api.p('');
  api.p('반디 약속 1: 반디는 답을 알려 주기 전에 먼저 "너는 어떻게 생각해?" 하고 물어요.<br>세 번 규칙: 세 번 연속 막히면 반디 대신 친구가 와요.', 'note');
  let lvl = 1, streak = 0, wrongRow = 0, solved = 0, tries = 0, hint = 0, wait = false, prob = null, hist = [], btns = [], t = 0, pulse = 0;
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function gen() {
    if (lvl === 1) { const a = R(2, 9), b = R(2, 9); return { k: 'add', a, b, ans: a + b, q: `${a} + ${b}` }; }
    if (lvl === 2) { let a, b; do { a = R(11, 39); b = R(3, 9); } while ((a % 10) + b < 10); return { k: 'add', a, b, ans: a + b, q: `${a} + ${b}` }; }
    if (lvl === 3) { const a = R(14, 48), b = R(13, 39); return { k: 'add', a, b, ans: a + b, q: `${a} + ${b}` }; }
    if (lvl === 4) { const a = R(2, 5), b = R(2, 6); return { k: 'mul', a, b, ans: a * b, q: `${a} × ${b}` }; }
    if (lvl === 5) { const a = R(3, 9), b = R(3, 8); return { k: 'mul', a, b, ans: a * b, q: `${a} × ${b}` }; }
    const b = R(2, 6), c = R(2, 6); return { k: 'div', a: b * c, b, ans: c, q: `${b * c} ÷ ${b}` };
  }
  function opts(a) {
    const s = new Set([a]);
    for (const d of shuffle([1, -1, 10, -10, 2, -2, 3])) { if (s.size >= 4) break; if (a + d > 0) s.add(a + d); }
    return shuffle([...s]);
  }
  function show() {
    prob = gen(); tries = 0; hint = 0;
    ans.innerHTML = '';
    btns = opts(prob.ans).map((v, i) => api.btn(`<small>${i + 1}</small> ${v}`, (e, b) => answer(v, b), 'big2', ans));
    status();
  }
  function status() { info.innerHTML = `레벨 <b>${lvl}</b> / 6 · 맞힌 문제 <b>${solved}</b> · 연속 정답 <b>${streak}</b> · 연속으로 막힘 <b>${wrongRow}</b>/3`; }
  function answer(v, b) {
    if (wait) return;
    if (v === prob.ans) {
      api.ding(); solved++; streak++; wrongRow = 0; hist.push(1); pulse = 1;
      if (streak >= 2 && lvl < 6) { lvl++; streak = 0; api.say(`정답! 두 번 연속 맞혔으니 조금 더 어려운 걸 내 볼게. (레벨 ${lvl})`); }
      else api.say(pickR(['정답! 어떻게 풀었는지 친구한테도 설명해 줄 수 있겠다.', '맞았어! 머릿속에서 어떻게 했어?', '좋아, 생각 근육이 자라고 있어!']));
      status();
      if (lvl >= 4 && solved >= 4) api.done(`반디는 네가 맞힐 때마다 문제를 조금씩 어렵게, 막힐 때는 쉽게 바꿨어요. 같은 4학년이라도 모두 다른 문제를 푸는 이유예요.`);
      wait = true; setTimeout(() => { wait = false; show(); }, 650);
      return;
    }
    api.buzz(); tries++; streak = 0; hist.push(0); wrongRow++; b.disabled = true; b.classList.add('no');
    status();
    if (wrongRow >= 3) {
      wait = true;
      api.say('세 번 규칙! 이번엔 반디 말고 친구한테 물어보자. 옆방 친구를 불러 올게…');
      const tip = prob.k === 'add' ? '10을 먼저 만들고 나머지를 더해 봐!' : prob.k === 'mul' ? '한 줄에 몇 개인지 세고, 줄 수만큼 더해 봐!' : '똑같이 나눠서 한 묶음에 몇 개인지 봐!';
      api.world.callFriend(tip).then((ok) => {
        api.say(ok ? `친구가 와서 말해 줬어요: "${tip}" 한 단계 쉬운 문제로 다시 해 볼까?` : `친구의 방법: "${tip}" 한 단계 쉬운 문제로 다시 해 볼까?`);
        lvl = Math.max(1, lvl - 1); wrongRow = 0; wait = false; show();
      });
      return;
    }
    if (tries === 1) { hint = 1; api.say('음… 너는 어떻게 생각했어? 그림을 같이 볼까? 묶음을 표시해 줄게.', true); }
    else { hint = 2; const wrong = btns.find((x) => !x.disabled && +x.textContent.replace(/^\d\s*/, '') !== prob.ans); if (wrong) { wrong.disabled = true; wrong.classList.add('no'); } api.say('거의 다 왔어! 아닌 보기 하나를 지워 줄게.'); }
  }
  function blocks(x0, y0, n, col, mark) { // 10 막대 + 낱개
    const tens = Math.floor(n / 10), ones = n % 10, u = 17;
    let x = x0;
    for (let i = 0; i < tens; i++) { for (let j = 0; j < 10; j++) { g.fillStyle = col; g.fillRect(x, y0 + j * (u - 4), u - 4, u - 5); } x += u + 2; }
    for (let j = 0; j < ones; j++) { g.fillStyle = mark && j < mark ? '#ffb703' : col; g.strokeStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + (j % 2) * (u + 3), y0 + Math.floor(j / 2) * (u + 3), u, u); g.strokeRect(x + (j % 2) * (u + 3), y0 + Math.floor(j / 2) * (u + 3), u, u); }
    return x + (ones ? 2 * (u + 3) : 0) + 40;
  }
  function draw() {
    g.fillStyle = '#f7fbff'; g.fillRect(0, 0, W, H);
    // 레벨 계단
    for (let i = 0; i < 6; i++) { g.fillStyle = i < lvl ? '#2bb8e8' : '#dde7ee'; g.fillRect(20 + i * 30, 46 - i * 5, 24, 10 + i * 5); }
    g.fillStyle = '#1d3557'; g.font = `700 15px ${FONT}`; g.fillText('반디가 고른 레벨', 20, 76);
    // 맞힘 기록
    hist.slice(-14).forEach((h, i) => { g.fillStyle = h ? '#06d6a0' : '#ef476f'; g.beginPath(); g.arc(W - 22 - i * 18, 30, 6, 0, TAU); g.fill(); });
    g.fillStyle = '#7a8794'; g.font = `600 13px ${FONT}`; g.textAlign = 'right'; g.fillText('최근 기록', W - 16, 56); g.textAlign = 'left';
    if (!prob) return;
    const s = 1 + pulse * 0.08;
    g.save(); g.translate(W / 2, 128); g.scale(s, s);
    g.fillStyle = '#1d3557'; g.font = `800 52px ${FONT}`; g.textAlign = 'center'; g.fillText(`${prob.q} = ?`, 0, 0); g.restore(); g.textAlign = 'left';
    const y = 170;
    if (prob.k === 'add') {
      const need = 10 - (prob.a % 10), carry = (prob.a % 10) + (prob.b % 10) >= 10;
      let x = blocks(60, y, prob.a, '#4cc9f0');
      g.fillStyle = '#1d3557'; g.font = `800 38px ${FONT}`; g.fillText('+', x - 30, y + 50);
      blocks(x + 6, y, prob.b, '#ff9f1c', hint && carry ? need : 0);
      if (hint) { g.fillStyle = '#e76f51'; g.font = `700 16px ${FONT}`; g.fillText(carry ? `노란 ${need}개를 앞으로 옮기면 10이 하나 더 생겨요 (10 만들기)` : `파란 ${prob.a}개에서 시작해서 노란 것을 하나씩 세어 봐요`, 40, H - 22); }
    } else if (prob.k === 'mul') {
      const { a, b } = prob, cs = Math.min(30, 170 / a);
      for (let r = 0; r < a; r++) for (let c = 0; c < b; c++) { g.fillStyle = hint && r % 2 ? '#ff9f1c' : '#4cc9f0'; g.beginPath(); g.arc(W / 2 - (b * cs) / 2 + c * cs + cs / 2, y + r * cs + cs / 2, cs * 0.36, 0, TAU); g.fill(); }
      if (hint) { g.fillStyle = '#e76f51'; g.font = `700 16px ${FONT}`; g.fillText(`한 줄에 ${b}개씩, ${a}줄이에요`, 40, H - 22); }
    } else {
      const { a, b } = prob, per = a / b, cs = 24;
      for (let i = 0; i < a; i++) { const gi = Math.floor(i / per), k = i % per; const gx = 50 + (gi % 3) * 190, gy = y + Math.floor(gi / 3) * 95; if (hint && k === 0) { g.strokeStyle = '#e76f51'; g.lineWidth = 2; g.strokeRect(gx - 6, gy - 6, per * cs + 4, 34); } g.fillStyle = '#4cc9f0'; g.beginPath(); g.arc(gx + k * cs + 10, gy + 11, 9, 0, TAU); g.fill(); }
      if (hint) { g.fillStyle = '#e76f51'; g.font = `700 16px ${FONT}`; g.fillText(`${b}묶음으로 나누면 한 묶음에 몇 개일까요?`, 40, H - 22); }
    }
  }
  show();
  api.say('안녕! 나는 네 반디야. 쉬운 것부터 낼게. 맞히면 조금씩 어려워지고, 막히면 쉬워져요.');
  return {
    tick(dt) { t += dt; pulse = Math.max(0, pulse - dt * 3); draw(); },
    key(e) { const m = /^(Digit|Numpad)([1-4])$/.exec(e.code); if (m && btns[+m[2] - 1] && !btns[+m[2] - 1].disabled) btns[+m[2] - 1].click(); }
  };
};

// 2. 개울물 거르기 — 예측 · 반디 예측 · 진짜
LESSON_IMPL.filter = (api) => {
  const { g, W, H } = api.canvas(400);
  const ST = api.stats([['me', '내 예측'], ['ai', '반디 예측'], ['real', '진짜 결과']]);
  const MAT = { 자갈: { c: '#9a958c', s: 3 }, 모래: { c: '#e9c46a', s: 2 }, 숯: { c: '#2b2d42', s: 2.5 }, 솜: { c: '#f1f1f1', s: 1 } };
  let layers = [], phase = 'build', myC = 60, myS = 60, aiR = null, realR = null, anim = 0, notes = [];
  api.h('① 거름 통에 층 쌓기 (위 → 아래)');
  const lr = api.row();
  for (const k of Object.keys(MAT)) api.btn(k, () => { if (phase !== 'build' && phase !== 'done') return; if (layers.length < 4) { layers.push(k); reset(); } }, '', lr);
  api.btn('다시 쌓기', () => { layers = []; reset(); }, 'ghost', lr);
  api.h('② 너는 어떻게 생각해?');
  api.p('물이 얼마나 맑아질까요?');
  api.seg([[30, '조금'], [60, '꽤'], [90, '아주']], 60, (v) => { myC = v; showMe(); });
  api.p('냄새는요?');
  api.seg([[100, '그대로'], [60, '조금 줄어요'], [20, '거의 없어요']], 60, (v) => { myS = v; showMe(); });
  api.h('③ 확인하기');
  const r3 = api.row();
  const bAI = api.btn('반디 예측 보기', () => { if (!layers.length) return api.say('먼저 통에 층을 쌓아 주세요!'); aiR = model(layers, true); ST.ai(fmtR(aiR)); api.say(`내 시뮬레이션으로는 맑기 ${aiR.c}%, 냄새 ${aiR.s}%예요. 확률 82%쯤. 그런데 진짜는 어떨까?`); }, '', r3);
  const bRun = api.btn('진짜로 해 보기 ▶', () => { if (!layers.length) return api.say('먼저 통에 층을 쌓아 주세요!'); realR = model(layers, false); phase = 'run'; anim = 0; api.tone(330, 0.3, 'sine', 0.05); }, 'main', r3);
  api.h('다른 점 공책');
  const nb = api.p('아직 비어 있어요.', 'nb');
  function fmtR(r) { return `맑기 <b>${r.c}%</b> · 냄새 <b>${r.s}%</b>`; }
  function showMe() { ST.me(`맑기 <b>${myC}%</b> · 냄새 <b>${myS}%</b>`); }
  function reset() { phase = 'build'; aiR = null; realR = null; ST.ai('-'); ST.real('-'); }
  function model(L, ai) {
    let turb = 1, smell = 1, prev = 3;
    for (const k of L) {
      const ord = ai ? 1 : (MAT[k].s <= prev ? 1 : 0.65);
      if (k === '자갈') turb *= 1 - 0.25 * ord;
      if (k === '모래') turb *= 1 - (ai ? 0.6 : 0.55) * ord;
      if (k === '숯') { smell *= 1 - (ai ? 0.35 : 0.8) * ord; turb *= 1 - 0.15 * ord; }
      if (k === '솜') turb *= 1 - 0.4 * ord;
      prev = MAT[k].s;
    }
    const n = ai ? 0 : (Math.random() - 0.5) * 0.06;
    return { c: Math.round(clamp((1 - turb + n) * 100, 0, 99)), s: Math.round(clamp((smell - n) * 100, 1, 100)) };
  }
  function finish() {
    phase = 'done';
    ST.real(fmtR(realR));
    const diffs = [];
    if (Math.abs(realR.c - myC) >= 20) diffs.push(`맑기: 내 예측 ${myC}% ↔ 진짜 ${realR.c}%`);
    if (Math.abs(realR.s - myS) >= 20) diffs.push(`냄새: 내 예측 ${myS}% ↔ 진짜 ${realR.s}%`);
    if (aiR && Math.abs(realR.s - aiR.s) >= 20) diffs.push(`반디도 틀렸다! 냄새 예측 ${aiR.s}% ↔ 진짜 ${realR.s}%`);
    if (aiR && Math.abs(realR.c - aiR.c) >= 15) diffs.push(`반디 맑기 예측 ${aiR.c}% ↔ 진짜 ${realR.c}% (쌓는 순서 때문일까?)`);
    notes.unshift(`<b>${notes.length + 1}번째</b> [${layers.join(' → ')}] ${diffs.length ? diffs.join(' · ') : '예측과 거의 같았어요'}`);
    nb.innerHTML = notes.slice(0, 5).join('<br>');
    if (realR.s <= 30 && realR.c >= 70) { api.say('냄새도 거의 없고 물도 맑아졌어요! 냄새를 잡은 건 무엇이었을까?'); api.done('반디의 시뮬레이션은 빠르지만, 진짜로 해 보니 달랐어요. 그 "다른 점"을 찾는 것이 진짜 실험이에요. (힌트: 숯은 냄새를, 굵은 것 → 고운 것 순서는 맑기를)'); }
    else if (aiR && Math.abs(realR.s - aiR.s) >= 20) api.say('어? 내 예측이 틀렸네요! 진짜로 해 봐야 알 수 있는 게 있어요. 다른 순서나 재료로 또 해 볼까?');
    else if (layers.includes('숯') && realR.s > 30) api.say('숯을 넣었는데도 냄새가 남았어요. 숯의 자리를 바꿔 보면 어떨까? 물은 위에서 아래로 내려가요 — 굵은 것부터 고운 것 순서로!', true);
    else if (!layers.includes('숯')) api.say('물은 맑아져도 냄새는 그대로네요. 냄새를 잡는 재료는 무엇일까?', true);
    else api.say('결과를 공책에 적었어요. 맑기 70% 넘게, 냄새 30% 아래가 목표예요. 층을 바꿔 다시 해 볼까?');
  }
  function draw(dt) {
    g.fillStyle = '#f4f8f6'; g.fillRect(0, 0, W, H);
    const tx = 200, tw = 120, ty = 70, lh = 52;
    // 주전자
    g.fillStyle = '#7b5236'; g.fillRect(tx - 10, 12, 140, 40); g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('냄새나는 개울물', tx + 6, 37);
    // 통
    g.strokeStyle = '#90a4ae'; g.lineWidth = 3; g.strokeRect(tx, ty, tw, lh * 4 + 10);
    layers.forEach((k, i) => {
      const y = ty + 5 + i * lh; g.fillStyle = MAT[k].c; g.fillRect(tx + 3, y, tw - 6, lh - 4);
      g.fillStyle = k === '숯' ? '#fff' : '#333'; g.font = `700 16px ${FONT}`; g.fillText(k, tx + tw + 10, y + lh / 2 + 5);
      if (k === '자갈') for (let j = 0; j < 9; j++) { g.fillStyle = '#b5b0a6'; g.beginPath(); g.arc(tx + 12 + (j % 5) * 22, y + 12 + Math.floor(j / 5) * 20, 7, 0, TAU); g.fill(); }
    });
    if (!layers.length) { g.fillStyle = '#90a4ae'; g.font = `600 15px ${FONT}`; g.fillText('왼쪽에서 재료를 골라', tx + 6, ty + 90); g.fillText('통에 쌓아요', tx + 26, ty + 112); }
    // 비커
    const bx = tx + 10, by = ty + lh * 4 + 40, bw = 100, bh = 90;
    g.strokeStyle = '#90a4ae'; g.strokeRect(bx, by, bw, bh);
    let fill = 0;
    if (phase === 'run' || phase === 'done') {
      if (phase === 'run') { anim += dt / 4.5; if (anim >= 1) { anim = 1; finish(); } }
      fill = anim;
      // 떨어지는 물방울
      if (phase === 'run') for (let i = 0; i < 6; i++) { const yy = ty + ((anim * 900 + i * 47) % (lh * 4)); g.fillStyle = 'rgba(120,85,50,.8)'; g.beginPath(); g.arc(tx + 20 + i * 16, yy, 3, 0, TAU); g.fill(); }
      const c = realR.c / 100, col = `rgb(${Math.round(lerp(130, 170, c))},${Math.round(lerp(95, 210, c))},${Math.round(lerp(55, 235, c))})`;
      g.fillStyle = col; g.fillRect(bx + 2, by + bh - bh * 0.9 * fill, bw - 4, bh * 0.9 * fill);
      // 냄새 김
      const sm = phase === 'done' ? realR.s / 100 : 0.5;
      g.strokeStyle = 'rgba(110,140,60,.7)'; g.lineWidth = 3;
      for (let i = 0; i < Math.round(sm * 5); i++) { g.beginPath(); const sx = bx + 18 + i * 17; for (let k = 0; k < 18; k++) g.lineTo(sx + Math.sin(k * 0.6 + performance.now() / 300 + i) * 5, by - 8 - k * 2.2); g.stroke(); }
    }
    // 오른쪽 막대
    const gx = 420;
    g.fillStyle = '#1d3557'; g.font = `700 15px ${FONT}`; g.fillText('맑기', gx, 90); g.fillText('냄새', gx, 252);
    const bar = (y, v, col, lab) => { if (v == null) return; g.fillStyle = '#e2e8ec'; g.fillRect(gx, y, 180, 14); g.fillStyle = col; g.fillRect(gx, y, 1.8 * v, 14); g.fillStyle = '#4a5d70'; g.font = `600 12px ${FONT}`; g.fillText(`${lab} ${v}%`, gx + 2, y + 28); };
    bar(102, myC, '#ff9a3c', '나'); bar(146, aiR && aiR.c, '#2bb8e8', '반디'); bar(190 - 0, phase === 'done' ? realR.c : null, '#06d6a0', '진짜');
    bar(262, myS, '#ff9a3c', '나'); bar(306, aiR && aiR.s, '#2bb8e8', '반디'); bar(350, phase === 'done' ? realR.s : null, '#06d6a0', '진짜');
  }
  showMe();
  api.say('개울물이 냄새나고 탁해요. 어떤 재료를 어떤 순서로 쌓으면 좋을까? 먼저 네 생각을 정해 줘.', true);
  return { tick: draw };
};

// 3. 개울 고치기 — 흐름과 냄새 시뮬레이션
LESSON_IMPL.stream = (api) => {
  const GW = 32, GH = 16, CS = 20;
  const { c, g, W, H } = api.canvas(GH * CS, GW * CS);
  const ST = api.stats([['smell', '개울 냄새'], ['flow', '물 흐름'], ['trash', '남은 쓰레기']]);
  const BANK = 0, WATER = 1, DAM = 2;
  const cell = new Uint8Array(GW * GH), trash = new Uint8Array(GW * GH), reed = new Uint8Array(GW * GH);
  const smell = new Float32Array(GW * GH), smellT = new Float32Array(GW * GH), flowing = new Uint8Array(GW * GH);
  const id = (x, y) => y * GW + x, cy = (x) => 8 + Math.round(2.4 * Math.sin(x / 5));
  for (let x = 0; x < GW; x++) for (let d = -1; d <= 1; d++) cell[id(x, cy(x) + d)] = WATER;
  for (let x = 9; x <= 12; x++) for (let y = cy(10) - 4; y <= cy(10) - 2; y++) cell[id(x, y)] = WATER;   // 고인 웅덩이(막힌 곳)
  for (let x = 13; x <= 14; x++) cell[id(x, cy(10) - 4)] = BANK;
  for (const d of [-1, 0]) cell[id(20, cy(20) + d)] = DAM;   // 낡은 둑
  for (const [x, d] of [[4, 0], [7, 1], [11, -3], [15, -1], [18, 1], [24, 0], [27, -1]]) { const yy = d === -3 ? cy(10) - 3 : cy(x) + d; if (cell[id(x, yy)] === WATER) trash[id(x, yy)] = 1; }
  let tool = 'trash', aiMap = false, thr = 0, smellPct = 0, doneOnce = false, t = 0;
  const parts = Array.from({ length: 80 }, () => ({ x: Math.random() * GW, y: 0, off: 0, ok: false }));
  let colInfo = [];
  api.h('도구 고르기 → 개울 칸을 눌러요');
  api.seg([['trash', '쓰레기 줍기'], ['reed', '갈대 심기'], ['dig', '물길 내기'], ['dam', '둑 허물기']], tool, (v) => { tool = v; });
  api.p('쓰레기 줍기: 물속 쓰레기 칸 · 갈대 심기: 물가 풀밭 · 물길 내기: 물 옆 풀밭 · 둑 허물기: 회색 둑', 'note');
  api.h('반디가 하는 일');
  api.btn('반디 냄새 지도 켜기/끄기', (e, b) => { aiMap = !aiMap; b.classList.toggle('on', aiMap); api.say(aiMap ? '냄새 센서 120개의 값을 모아 지도로 그렸어요. 빨갈수록 냄새가 심해요. 왜 거기가 심할까?' : '지도를 껐어요. 이제 눈과 코로!', aiMap); });
  api.p('반디는 센서를 모아 지도를 그리고, 고치는 일은 우리가 손으로 해요.', 'note');
  const nb = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH);
  function solve() {
    // 흐르는 칸 = 시작에서 닿고 끝까지 이어지는 물 칸
    const reach = (starts) => { const v = new Uint8Array(GW * GH), q = []; for (const s of starts) { v[s] = 1; q.push(s); } while (q.length) { const i = q.pop(), x = i % GW, y = (i / GW) | 0; for (const [a, b] of nb(x, y)) { const j = id(a, b); if (!v[j] && cell[j] === WATER) { v[j] = 1; q.push(j); } } } return v; };
    const src = [], snk = [];
    for (let y = 0; y < GH; y++) { if (cell[id(0, y)] === WATER) src.push(id(0, y)); if (cell[id(GW - 1, y)] === WATER) snk.push(id(GW - 1, y)); }
    const A = reach(src), B = reach(snk);
    let minW = 99;
    for (let x = 0; x < GW; x++) { let w = 0; for (let y = 0; y < GH; y++) { const i = id(x, y); flowing[i] = A[i] && B[i] ? 1 : 0; if (flowing[i]) w += trash[i] ? 0.5 : 1; } if (w > 0) minW = Math.min(minW, w); else if (x > 0) minW = 0; }
    thr = clamp(minW / 3, 0, 1);
    colInfo = [];
    for (let x = 0; x < GW; x++) { let lo = 99, hi = -1; for (let y = 0; y < GH; y++) if (flowing[id(x, y)]) { lo = Math.min(lo, y); hi = Math.max(hi, y); } colInfo[x] = hi >= 0 ? { mid: (lo + hi + 1) / 2, half: Math.max(0.2, (hi - lo + 1) / 2 - 0.35) } : null; }
    let sum = 0, n = 0, tr = 0;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = id(x, y); if (cell[i] !== WATER) continue;
      const speed = flowing[i] ? thr : 0.08;
      let s = 0.2 + 0.6 * (1 - speed);
      let ta = trash[i] ? 1 : 0, ra = 0;
      for (const [a, b] of nb(x, y)) { const j = id(a, b); if (trash[j]) ta += 0.5; if (reed[j]) ra++; }
      s += 0.22 * ta - 0.1 * Math.min(ra, 2);
      smellT[i] = clamp(s, 0, 1); sum += smellT[i]; n++; tr += trash[i];
    }
    smellPct = Math.round(sum / n * 100);
    ST.smell(`<b>${smellPct}%</b> (목표 30% 아래)`); ST.flow(`<b>${Math.round(thr * 100)}%</b>`);
    ST.trash(`<b>${trash.reduce((a, b) => a + b, 0)}</b>개`);
    if (smellPct < 30 && !doneOnce) { doneOnce = true; api.world.streamMap && api.world.streamMap(c); api.done('물이 다시 흐르자 냄새가 사라졌어요. 반디의 냄새 지도는 어디가 문제인지 알려 줬고, 직접 고친 건 우리 손이었어요. 큰물음 작업장 지도판에도 그렸어요!'); }
  }
  c.addEventListener('pointerdown', (e) => {
    const r = c.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * GW), y = Math.floor((e.clientY - r.top) / r.height * GH);
    if (x < 0 || y < 0 || x >= GW || y >= GH) return;
    const i = id(x, y), nearW = nb(x, y).some(([a, b]) => cell[id(a, b)] === WATER);
    let ok = false;
    if (tool === 'trash' && trash[i]) { trash[i] = 0; ok = true; api.say(pickR(['쓰레기 하나 건졌다! 물이 조금 더 잘 흐르겠어요.', '좋아! 이건 반디가 못 하는 일이에요.'])); }
    else if (tool === 'reed' && cell[i] === BANK && nearW && !reed[i]) { reed[i] = 1; ok = true; api.say('갈대 뿌리가 물을 깨끗하게 해 줘요.'); }
    else if (tool === 'dig' && cell[i] === BANK && nearW) { cell[i] = WATER; reed[i] = 0; ok = true; }
    else if (tool === 'dam' && cell[i] === DAM) { cell[i] = WATER; ok = true; api.say('둑을 열었더니 물이 콸콸! 흐름이 얼마나 바뀌었는지 봐요.'); }
    if (ok) { api.tone(520 + Math.random() * 200, 0.08, 'triangle', 0.08); solve(); } else api.tone(180, 0.06, 'square', 0.03);
  });
  function draw(dt) {
    t += dt;
    for (let i = 0; i < smell.length; i++) smell[i] += (smellT[i] - smell[i]) * Math.min(1, dt * 3);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const i = id(x, y), px = x * CS, py = y * CS;
      if (cell[i] === BANK) { g.fillStyle = (x + y) % 2 ? '#8fcf7a' : '#86c672'; g.fillRect(px, py, CS, CS); if (reed[i]) { g.strokeStyle = '#3e7f3a'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(px + 5 + k * 5, py + CS); g.lineTo(px + 4 + k * 5 + Math.sin(t * 2 + k) * 2, py + 3); g.stroke(); } } }
      else if (cell[i] === DAM) { g.fillStyle = '#8d8d8d'; g.fillRect(px, py, CS, CS); g.strokeStyle = '#666'; g.strokeRect(px + 2, py + 2, CS - 4, CS - 4); }
      else {
        const s = smell[i];
        g.fillStyle = `rgb(${Math.round(lerp(70, 120, s))},${Math.round(lerp(160, 125, s))},${Math.round(lerp(220, 80, s))})`; g.fillRect(px, py, CS, CS);
        if (trash[i]) { g.fillStyle = '#d9d2c3'; g.fillRect(px + 4, py + 6, 12, 8); g.fillStyle = '#e76f51'; g.fillRect(px + 6, py + 4, 4, 4); }
        if (aiMap) { g.fillStyle = `rgba(239,71,111,${s * 0.75})`; g.fillRect(px, py, CS, CS); }
      }
    }
    // 흐르는 물 알갱이
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (const p of parts) {
      if (!p.ok) { if (!colInfo[0] || thr <= 0) continue; p.x = Math.random() * 3; p.off = Math.random() * 2 - 1; p.y = colInfo[0].mid + p.off * colInfo[0].half; p.ok = true; }
      p.x += dt * (0.6 + thr * 5);
      const ci = colInfo[Math.floor(p.x)];
      if (p.x >= GW || !ci) { p.ok = false; continue; }
      p.y += (ci.mid + p.off * ci.half - p.y) * Math.min(1, dt * 8);
      g.fillRect(p.x * CS, p.y * CS, 3, 3);
    }
    if (aiMap) { g.fillStyle = 'rgba(16,80,120,.85)'; g.fillRect(8, 8, 190, 26); g.fillStyle = '#bff0ff'; g.font = `700 13px ${FONT}`; g.fillText('반디 냄새 지도 · 센서 120개', 16, 26); }
  }
  solve();
  api.say('여름마다 냄새가 나는 우리 동네 개울이에요. 어디가 문제일까? 반디 냄새 지도를 켜 봐도 좋아요.', true);
  return { tick: draw };
};

// 4. 세계 창문 — 맨목소리로 말 걸기
LESSON_IMPL.window = (api) => {
  const { g, W, H } = api.canvas(330);
  const MSG = [
    { ko: '우리 동네 개울은 여름에 냄새가 나.', en: 'Our stream smells in summer.', keys: [['stream', 'sea', '🌊'], ['smells', '👃'], ['summer', '☀️']], need: ['smells', '👃'], rep: 'Oh! Your stream smells in summer? Our sea smells too!' },
    { ko: '물이 안 움직여서 그런 것 같아.', en: 'I think the water is not moving.', keys: [['water', '🌊'], ['not', '✋'], ['moving', '🔄']], need: ['moving', '🔄', 'not'], rep: 'Ah, the water is not moving… That makes sense!' },
    { ko: '우리 같이 고쳐 보자!', en: "Let's fix it together!", keys: [["let's", '🤝'], ['fix', '🔧'], ['together', '🤝']], need: ['fix', '🔧', 'together', '🤝'], rep: 'Yes! Let\'s fix it together! 🤝' }
  ];
  const WORDS = ['hello', 'our', 'stream', 'sea', 'smells', 'summer', 'water', 'not', 'moving', "let's", 'fix', 'together', 'good', 'bad', '👃', '🌊', '☀️', '🔄', '✋', '🤝', '🔧', '😊'];
  let mode = 'mine', built = [], done = [false, false, false], viaAI = [false, false, false], bubble = { t: 'Hello! 👋 Can you hear me?', ko: '안녕! 내 말 들려?' }, talkT = 2, react = '😊', t = 0;
  api.h('말하는 방법');
  api.seg([['ai', '반디 통역'], ['mine', '맨목소리']], mode, (v) => { mode = v; render(); api.say(v === 'ai' ? '통역을 켰어요. 한국말로 고르면 내가 바로 영어로 바꿔 줄게.' : '통역을 껐어요. 아는 단어와 몸짓으로! 틀려도 괜찮아요.', v === 'mine'); });
  const area = el('div', 'lsArea'); api.side.appendChild(area);
  api.h('전할 말');
  const list = api.p('');
  function speak(text) { try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text.replace(/[^\x00-\x7F]/g, '')); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) { /* 소리 없이 */ } }
  function reply(t2, ko, r) { bubble = { t: t2, ko }; talkT = 2.5; react = r; speak(t2); }
  function renderList() { list.innerHTML = MSG.map((m, i) => `${done[i] ? '⭐' : viaAI[i] ? '☑' : '◻'} ${m.ko}`).join('<br>') + '<br><small>⭐ = 맨목소리로 전함 · ☑ = 통역으로 전함</small>'; }
  function render() {
    area.innerHTML = '';
    if (mode === 'ai') {
      MSG.forEach((m, i) => api.btn(m.ko, () => {
        viaAI[i] = true; renderList();
        api.say(`"${m.en}" — 내가 바꿔서 전했어요. 쉽죠? 그런데 친구가 들은 건 내 목소리일까, 네 목소리일까?`);
        reply(m.rep, '(통역) ' + m.ko.replace(/\.$/, '') + '? 우리도 그래!', '😊');
      }, 'wide', area));
    } else {
      const line = el('div', 'tiles line'); area.appendChild(line);
      line.innerHTML = built.length ? built.map((w) => `<span>${w}</span>`).join('') : '<em>단어와 몸짓을 눌러 말을 만들어요</em>';
      const tl = el('div', 'tiles'); area.appendChild(tl);
      WORDS.forEach((w) => { const b = el('button', '', w); b.onclick = () => { if (built.length < 7) { built.push(w); api.tone(600 + built.length * 40, 0.05, 'sine', 0.05); render(); } }; tl.appendChild(b); });
      const r = el('div', 'lsRow'); area.appendChild(r);
      api.btn('말하기 ▶', say, 'main', r);
      api.btn('지우기', () => { built = []; render(); }, 'ghost', r);
      api.btn('반디 힌트', hint, 'ghost', r);
    }
  }
  function say() {
    if (!built.length) return;
    speak(built.join(' '));
    let best = -1, bestScore = 0;
    MSG.forEach((m, i) => { if (done[i]) return; const sc = m.keys.filter((alts) => alts.some((a) => built.includes(a))).length; const nd = m.need.some((a) => built.includes(a)); if (nd && sc > bestScore) { bestScore = sc; best = i; } });
    if (best >= 0 && bestScore >= 2) {
      done[best] = true; renderList(); api.ding();
      setTimeout(() => reply(MSG[best].rep, '알아들었어요!', '😄'), 600);
      api.say(pickR(['통했다! 문법이 완벽하지 않아도 마음은 전해져요.', '와, 친구가 웃었어요! 네 진짜 목소리로 전한 거예요.']));
      if (done.every(Boolean)) setTimeout(() => api.done('통역은 빠르고 정확하지만, 서툰 맨목소리로 통했을 때의 웃음은 사람끼리만 나눌 수 있어요.'), 900);
    } else if (best >= 0 || bestScore === 1) { setTimeout(() => reply('Hmm… ' + built.filter((w) => /^[a-z']+$/.test(w)).slice(0, 2).join('… ') + '…?', '음… 잘 모르겠어. 다시 말해 줄래?', '🤔'), 500); api.say('친구가 고개를 갸웃해요. 단어 하나나 몸짓을 더 넣어 볼까?'); }
    else { setTimeout(() => reply('Sorry? 🙂', '미안, 뭐라고?', '🤔'), 500); api.say('아직 안 통했어요. 전할 말 목록을 보고 중요한 단어를 골라 봐요.'); }
    built = []; render();
  }
  function hint() {
    const i = done.findIndex((d) => !d); if (i < 0) return;
    const w = MSG[i].keys.map((a) => a[0]).find((x) => !built.includes(x));
    api.say(`힌트는 단어 하나만! "${w}" — 나머지는 네가 골라 봐요. (반디 약속 1)`);
  }
  function draw(dt) {
    t += dt; talkT = Math.max(0, talkT - dt);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(0.6, '#e3f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a9df4'; g.fillRect(0, H * 0.58, W, 50); g.fillStyle = '#f3d59c'; g.fillRect(0, H * 0.58 + 50, W, H);
    g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(560, 60, 30, 0, TAU); g.fill();
    // 친구
    const fx = 200, fy = 250, bob = Math.sin(t * 2) * 3;
    g.fillStyle = '#4cc9f0'; g.fillRect(fx - 40, fy - 70 + bob, 80, 90);
    g.fillStyle = '#8d5524'; g.beginPath(); g.arc(fx, fy - 100 + bob, 38, 0, TAU); g.fill();
    g.fillStyle = '#1c1c1c'; g.beginPath(); g.arc(fx, fy - 118 + bob, 38, Math.PI, TAU); g.fill();
    g.fillStyle = '#fff'; g.fillRect(fx - 16, fy - 106 + bob, 8, 9); g.fillRect(fx + 8, fy - 106 + bob, 8, 9);
    const mo = talkT > 0 ? 4 + Math.abs(Math.sin(t * 14)) * 8 : 3;
    g.fillStyle = '#5a1e1e'; g.fillRect(fx - 9, fy - 84 + bob, 18, mo);
    g.font = '34px sans-serif'; g.fillText(react, fx + 44, fy - 120);
    // 말풍선
    g.fillStyle = '#fff'; g.fillRect(300, 70, 320, 110); g.beginPath(); g.moveTo(300, 120); g.lineTo(270, 140); g.lineTo(300, 140); g.fill();
    g.fillStyle = '#1d3557'; g.font = `700 18px ${FONT}`;
    wrap(bubble.t, 316, 100, 290, 22);
    if (mode === 'ai' || bubble.ko) { g.fillStyle = '#2b8fc0'; g.font = `600 14px ${FONT}`; wrap((mode === 'ai' ? '반디 자막: ' : '') + (mode === 'ai' ? bubble.ko : ''), 316, 160, 290, 18); }
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(10, 10, 300, 30); g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(26, 25, 6, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText(`연결 중 · 바닷가 학교 친구 · ${mode === 'ai' ? '통역 켜짐' : '맨목소리'}`, 38, 30);
  }
  function wrap(s, x, y, w, lh) { const words = String(s).split(' '); let line = ''; for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > w && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = tt; } g.fillText(line, x, y); }
  render(); renderList();
  api.world.screenLive && api.world.screenLive(90);
  api.say('지구 반대편 바닷가 학교와 연결됐어요! 통역으로 먼저 해 보고, 맨목소리로도 도전해 봐요.');
  return { tick: draw, stop() { try { speechSynthesis.cancel(); } catch (e) { /* 없음 */ } } };
};

// 5. 빛 농장 — 키우기 시뮬레이션
LESSON_IMPL.farm = (api) => {
  const { g, W, H } = api.canvas(380);
  const ST = api.stats([['size', '상추 크기 (나 / 반디)'], ['en', '에너지 (나 / 반디)'], ['water', '물 (나 / 반디)']]);
  let L = 12, Wt = 150, T = 20, day = 0, run = false, me = null, ai = null, t = 0, doneOnce = false;
  const AI = { L: 16, Wt: 150, T: 21 };
  api.h('하루 환경 정하기');
  api.slider({ label: '빛 (하루에 켜는 시간)', min: 6, max: 20, value: L, fmt: (v) => `${v}시간`, on: (v) => { L = v; reset(); } });
  api.slider({ label: '물 (하루)', min: 0, max: 300, step: 10, value: Wt, fmt: (v) => `${v}mL`, on: (v) => { Wt = v; reset(); } });
  api.slider({ label: '온도', min: 10, max: 35, value: T, fmt: (v) => `${v}℃`, on: (v) => { T = v; reset(); } });
  const r = api.row();
  api.btn('14일 키워 보기 ▶', () => { reset(); run = true; api.tone(440, 0.2, 'sine', 0.06); }, 'main', r);
  api.p('반디는 언제나 "가장 크게"를 목표로 키워요. 목표를 정하는 건 사람이에요.', 'note');
  function rate(o) {
    const f = Math.min(1, o.L / 14) - Math.max(0, o.L - 18) * 0.05;
    const w = Math.exp(-(((o.Wt - 150) / 90) ** 2)), h = Math.exp(-(((o.T - 20) / 7) ** 2));
    return { r: 0.18 * f * w * h, w, h };
  }
  const energy = (o) => o.L * 0.12 + Math.abs(o.T - 15) * 0.05;
  function grow(o, d) { const k = rate(o); return { size: Math.pow(1 + k.r, d), ...k, en: energy(o) * d, water: o.Wt * d / 1000 }; }
  function reset() { day = 0; run = false; me = grow({ L, Wt, T }, 0); ai = grow(AI, 0); show(); }
  function show() {
    me = grow({ L, Wt, T }, day); ai = grow(AI, day);
    ST.size(`<b>${me.size.toFixed(1)}</b> / ${ai.size.toFixed(1)}`);
    ST.en(`<b>${me.en.toFixed(1)}</b> / ${ai.en.toFixed(1)} kWh`);
    ST.water(`<b>${me.water.toFixed(1)}</b> / ${ai.water.toFixed(1)} L`);
  }
  function plant(cx, base, o, label, col) {
    const s = Math.min(o.size, 12), dry = o.w < 0.6 && Wt < 150, wet = o.w < 0.6 && Wt > 150, hot = o.h < 0.6 && T > 20;
    g.fillStyle = '#7b5236'; g.fillRect(cx - 60, base, 120, 30);
    const n = Math.round(2 + s * 1.2), hgt = (8 + s * 9) * (hot ? 1.4 : 1);
    g.strokeStyle = '#4c8c3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, base); g.lineTo(cx, base - hgt); g.stroke();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI - Math.PI / 2 + (i % 2 ? 0.3 : -0.3), len = (10 + s * 5) * (0.6 + 0.4 * (i / n)) * (hot ? 0.7 : 1);
      const yy = base - hgt * (i / n) * 0.9, droop = dry ? 0.9 : 0;
      g.fillStyle = wet ? '#c9c35a' : dry ? '#9bb36a' : i % 2 ? '#5cb85c' : '#7cc46a';
      g.save(); g.translate(cx, yy); g.rotate(Math.sin(a) * 1.2 + (i % 2 ? 1 : -1) * droop + Math.sin(t * 2 + i) * 0.04);
      g.beginPath(); g.ellipse((i % 2 ? 1 : -1) * len / 2, 0, len / 2, len / 4.5, 0, 0, TAU); g.fill(); g.restore();
    }
    g.fillStyle = col; g.font = `700 16px ${FONT}`; g.textAlign = 'center'; g.fillText(label, cx, base + 52); g.textAlign = 'left';
  }
  function draw(dt) {
    t += dt;
    if (run) { day = Math.min(14, day + dt * 2); show(); if (day >= 14) { run = false; judge(); } }
    g.fillStyle = '#eef6ec'; g.fillRect(0, 0, W, H);
    // 빛 농장 선반 느낌
    g.fillStyle = 'rgba(210,123,255,.25)'; g.fillRect(380, 20, 240, 8); g.fillStyle = `rgba(255,236,150,${0.15 + L / 60})`; g.fillRect(40, 20, 240, 8);
    plant(160, 290, me, '내가 정한 상추', '#e76f51');
    plant(500, 290, ai, '반디가 정한 상추 (빛16·물150·21℃)', '#2b8fc0');
    g.fillStyle = '#1d3557'; g.font = `800 22px ${FONT}`; g.fillText(`${Math.floor(day)}일째`, W / 2 - 34, 60);
  }
  function judge() {
    const ratio = me.size / ai.size, less = me.en < ai.en;
    api.world.growFarm && api.world.growFarm(clamp(ratio, 0.3, 1.2));
    if (ratio >= 0.8 && less) api.done(`반디 상추의 ${Math.round(ratio * 100)}% 크기로, 에너지는 ${(ai.en - me.en).toFixed(1)}kWh 덜 썼어요! "가장 크게"와 "알맞게 아끼며" 중 무엇이 좋은 목표인지는 사람이 정해요.`);
    else if (ratio >= 0.8) api.say(`크기는 반디 상추의 ${Math.round(ratio * 100)}%! 그런데 에너지를 반디보다 더 썼어요. 빛 시간을 조금 줄여 볼까?`);
    else if (me.w < 0.6) api.say(Wt > 150 ? '물을 너무 많이 줘서 잎이 누렇게 됐어요. 뿌리도 숨을 쉬어야 해요.' : '물이 모자라 잎이 축 처졌어요.');
    else if (me.h < 0.6) api.say(T > 20 ? '너무 더워서 상추가 길쭉하게 웃자랐어요.' : '너무 추워서 잘 안 자랐어요.');
    else api.say(`반디 상추의 ${Math.round(ratio * 100)}% 크기예요. 빛 시간을 조금 늘려 볼까?`);
  }
  reset();
  api.say('나는 상추를 가장 크게 키우는 법을 계산할 수 있어요. 그런데 꼭 "가장 크게"가 좋은 걸까? 네 방법으로 키워 봐요.', true);
  return { tick: draw };
};

// 6. 함께 소리 — 리듬 만들기 + 반디 반주
LESSON_IMPL.music = (api) => {
  const ROWS = [['큰북', '#e63946'], ['작은북', '#457b9d'], ['실로폰 솔', '#f4a261'], ['실로폰 도', '#2a9d8f']], N = 8;
  const { c, g, W, H } = api.canvas(300);
  const grid = ROWS.map(() => new Array(N).fill(false));
  [0, 4].forEach((i) => { grid[0][i] = true; });
  let play = false, bpm = 104, step = -1, acc = 0, loops = 0, aiOn = false, band = false, flash = new Array(4).fill(0), t = 0;
  api.h('칸을 눌러 리듬 만들기');
  const r = api.row();
  const bPlay = api.btn('▶ 연주', () => { play = !play; bPlay.innerHTML = play ? '■ 멈춤' : '▶ 연주'; step = -1; acc = 0; if (!play) api.world.band && api.world.band(false); else if (band) api.world.band && api.world.band(true, bpm); }, 'main', r);
  api.btn('다 지우기', () => { grid.forEach((row) => row.fill(false)); }, 'ghost', r);
  api.slider({ label: '빠르기', min: 70, max: 150, value: bpm, fmt: (v) => `${v} BPM`, on: (v) => { bpm = v; } });
  api.h('반디와 친구들');
  api.btn('반디 반주 켜기/끄기', (e, b) => { aiOn = !aiOn; b.classList.toggle('on', aiOn); api.say(aiOn ? '네 리듬을 듣고 낮은 소리 반주를 붙였어요. 파란 점 표시! 어때, 더 좋아? 아니면 네 것만이 더 좋아?' : '반주를 껐어요. 이제 너희 소리만!', aiOn); }, '');
  api.btn('친구들과 합주하기', (e, b) => { band = !band; b.classList.toggle('on', band); if (play && api.world.band) api.world.band(band, bpm); api.say(band ? '소리 정자의 친구들이 같이 북을 쳐요! 학교에서도 들려요.' : '합주를 멈췄어요.'); }, '');
  api.p('반디 약속 4: 반디가 도운 곳엔 파란 점. 반주가 켜지면 화면에 파란 점이 떠요.', 'note');
  c.addEventListener('pointerdown', (e) => {
    const rc = c.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H;
    const col = Math.floor((x - 110) / ((W - 130) / N)), row = Math.floor((y - 30) / 60);
    if (col < 0 || col >= N || row < 0 || row >= 4) return;
    grid[row][col] = !grid[row][col]; if (grid[row][col]) hit(row, 0.5);
  });
  function hit(row, v = 1) {
    flash[row] = 1;
    if (row === 0) kick(0.5 * v); else if (row === 1) snare(0.22 * v); else if (row === 2) tone(784, 0.35, 'sine', 0.12 * v); else tone(523, 0.35, 'sine', 0.12 * v);
  }
  function tickStep() {
    step = (step + 1) % N;
    if (step === 0 && play) loops++;
    let any = false;
    grid.forEach((row, i) => { if (row[step]) { hit(i); any = true; } });
    if (aiOn) { const dens = grid.reduce((a, row) => a + row.filter(Boolean).length, 0); if (step % 4 === 0) tone(step === 0 ? 131 : 98, 0.4, 'triangle', 0.1); if (dens > 6 && step % 2 === 1) tone(196, 0.15, 'triangle', 0.05); }
    if (band && any && api.world.beat) api.world.beat(step);
    const notes = grid.reduce((a, row) => a + row.filter(Boolean).length, 0), used = grid.filter((row) => row.some(Boolean)).length;
    if (loops >= 2 && notes >= 6 && used >= 3 && band) api.done('친구들과 같은 박자에 숨을 맞췄어요. 반디는 반주를 만들 수 있지만, 같이 연주하는 기분은 사람끼리 나눠요.');
    else if (loops === 2 && step === 0 && !band) api.say('멋진 리듬! 이제 "친구들과 합주하기"를 눌러 볼까?');
  }
  function draw(dt) {
    t += dt;
    if (play) { acc += dt; const sp = 60 / bpm / 2; while (acc >= sp) { acc -= sp; tickStep(); } }
    g.fillStyle = '#fff8ec'; g.fillRect(0, 0, W, H);
    const cw = (W - 130) / N;
    ROWS.forEach(([name, col], i) => {
      flash[i] = Math.max(0, flash[i] - dt * 4);
      g.fillStyle = '#1d3557'; g.font = `700 15px ${FONT}`; g.fillText(name, 14, 30 + i * 60 + 34);
      for (let s = 0; s < N; s++) {
        const x = 110 + s * cw, y = 30 + i * 60, on = grid[i][s];
        g.fillStyle = on ? col : (s % 4 === 0 ? '#efe4d2' : '#f6eee2'); g.fillRect(x + 3, y + 3, cw - 6, 54);
        if (on && step === s && play) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 3, y + 3, cw - 6, 54); }
      }
      if (flash[i] > 0) { g.fillStyle = `rgba(255,209,102,${flash[i] * 0.6})`; g.fillRect(0, 30 + i * 60, 104, 60); }
    });
    if (play && step >= 0) { g.strokeStyle = '#e76f51'; g.lineWidth = 3; g.strokeRect(110 + step * cw + 1, 28, cw - 2, 244); }
    if (aiOn) { g.fillStyle = '#2b8fc0'; g.beginPath(); g.arc(W - 18, 16, 7, 0, TAU); g.fill(); g.font = `600 12px ${FONT}`; g.fillText('반디 반주', W - 90, 20); }
    g.fillStyle = '#7a8794'; g.font = `600 12px ${FONT}`; g.fillText(`${loops}바퀴`, 14, 18);
  }
  api.say('칸을 눌러서 어떤 박자에 어떤 악기를 칠지 정해요. 한 칸 = 반 박자!');
  return { tick: draw, stop() { api.world.band && api.world.band(false); } };
};

// 7. 손자국 — 그리고 걸기
LESSON_IMPL.art = (api) => {
  const { c, g, W, H } = api.canvas(400);
  g.fillStyle = '#fffdf7'; g.fillRect(0, 0, W, H);
  let col = '#1d3557', size = 8, drawing = false, last = null, strokes = 0, aiArt = null;
  api.h('색');
  const cr = api.row('cols');
  ['#1d3557', '#e63946', '#f4a261', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#fffdf7'].forEach((cc, i) => { const b = api.btn(i === 7 ? '지우개' : '', () => { col = cc; [...cr.children].forEach((x) => x.classList.remove('on')); b.classList.add('on'); }, 'sw' + (i === 0 ? ' on' : ''), cr); if (i < 7) b.style.background = cc; });
  api.h('굵기');
  api.seg([[4, '가늘게'], [8, '보통'], [18, '굵게']], 8, (v) => { size = v; });
  const r = api.row();
  api.btn('실수 버튼', () => { for (let i = 0; i < 6; i++) { g.fillStyle = pickR(['#e63946', '#ffd166', '#06d6a0', '#118ab2', '#8338ec']); g.globalAlpha = 0.6; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 8 + Math.random() * 30, 0, TAU); g.fill(); } g.globalAlpha = 1; strokes += 3; api.say('앗, 물감이 튀었다! 그런데… 이것도 멋진데? 「일부러 아님」 작품이 될 수 있어요.'); }, 'ghost', r);
  api.btn('다 지우기', () => { g.fillStyle = '#fffdf7'; g.fillRect(0, 0, W, H); strokes = 0; }, 'ghost', r);
  api.h('걸기');
  const r2 = api.row();
  api.btn('반디에게 그려 달라고 하기', () => {
    aiArt = document.createElement('canvas'); aiArt.width = W; aiArt.height = H;
    const a = aiArt.getContext('2d'), hue = Math.random() * 360;
    a.fillStyle = `hsl(${hue},40%,95%)`; a.fillRect(0, 0, W, H); a.translate(W / 2, H / 2);
    for (let k = 0; k < 12; k++) { a.rotate(TAU / 12); for (let j = 0; j < 7; j++) { a.fillStyle = `hsla(${(hue + j * 25) % 360},70%,${50 + j * 4}%,.7)`; a.beginPath(); a.ellipse(40 + j * 22, 0, 18 - j * 1.5, 7, j * 0.2, 0, TAU); a.fill(); } }
    a.setTransform(1, 0, 0, 1, 0, 0); a.fillStyle = '#2e7dd6'; a.beginPath(); a.arc(W - 20, 20, 9, 0, TAU); a.fill();
    g.drawImage(aiArt, 0, 0);
    api.say('1초 만에 그렸어요. 아주 반듯하죠? 파란 점을 찍었어요. 그런데 이건 세상에 몇 장이나 있을까요? 똑같이 또 그릴 수 있거든요.', true);
    strokes = 0;
  }, '', r2);
  api.btn('손자국 마당에 걸기 ▶', () => {
    const mine = strokes >= 12;
    if (!mine && !aiArt) return api.say('아직 그림이 거의 비어 있어요. 조금 더 그려 볼까?');
    api.world.hangArt && api.world.hangArt(c, !mine);
    if (mine) api.done('내 손으로 그린 그림이 손자국 마당에 걸렸어요. 삐뚤빼뚤해도 세상에 하나뿐이에요. 학교에 가서 직접 보고 와요!');
    else api.say('반디 그림을 걸었어요. 파란 점과 함께요. 이번엔 네 손으로도 그려 볼래?');
  }, 'main', r2);
  const pos = (e) => { const rc = c.getBoundingClientRect(); return [(e.clientX - rc.left) / rc.width * W, (e.clientY - rc.top) / rc.height * H]; };
  c.style.touchAction = 'none';
  c.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); c.setPointerCapture(e.pointerId); dot(last); });
  c.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); g.strokeStyle = col; g.lineWidth = size; g.lineCap = 'round'; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; strokes += 0.25; });
  c.addEventListener('pointerup', () => { drawing = false; strokes += 1; aiArt = strokes > 3 ? null : aiArt; });
  function dot(p) { g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], size / 2, 0, TAU); g.fill(); }
  api.say('마음대로 그려 봐요. 손이 떨려도, 선이 삐뚤어도 괜찮아요. 그게 네 손자국이니까.');
  return {};
};

// 8. 반디 길들이기 — 분리수거 AI 가르치기 (가장 가까운 이웃)
LESSON_IMPL.ai = (api) => {
  const { g, W, H } = api.canvas(400);
  const CL = { can: ['캔', '#9aa5ad'], plastic: ['플라스틱', '#ff9f1c'], paper: ['종이', '#c9a77c'], glass: ['유리', '#06d6a0'] };
  const R = (a, b) => a + Math.random() * (b - a);
  const mk = (kind) => {
    if (kind === 'can') return { w: R(0.35, 0.55), s: R(0.75, 0.95), lab: 'can', look: 'can' };
    if (kind === 'cbottle') return { w: R(0.12, 0.26), s: R(0.3, 0.48), lab: 'plastic', look: 'cbottle' };
    if (kind === 'cup') return { w: R(0.08, 0.2), s: R(0.7, 0.84), lab: 'plastic', look: 'cup' };
    if (kind === 'paper') return { w: R(0.05, 0.2), s: R(0.05, 0.22), lab: 'paper', look: 'paper' };
    return { w: R(0.7, 0.95), s: R(0.65, 0.88), lab: 'glass', look: 'glass' };
  };
  let train = [], queue = shuffle(['can', 'can', 'cbottle', 'cbottle', 'paper', 'paper', 'glass', 'glass'].map(mk)), test = [], phase = 'teach', acc = null, round = 0;
  const ST = api.stats([['n', '가르친 물건'], ['acc', '시험 점수'], ['phase', '지금 단계']]);
  api.h('이 물건은 어디에 넣을까요?');
  const bins = api.row('bins');
  Object.entries(CL).forEach(([k, [name, col]]) => { const b = api.btn(name, () => label(k), 'bin', bins); b.style.borderColor = col; });
  api.h('시험');
  const r = api.row();
  api.btn('AI 시험 보기 ▶', () => runTest(), 'main', r);
  api.btn('처음부터', () => { train = []; test = []; acc = null; phase = 'teach'; queue = shuffle(['can', 'can', 'cbottle', 'cbottle', 'paper', 'paper', 'glass', 'glass'].map(mk)); upd(); api.say('다 잊었어요. 다시 가르쳐 줘요!'); }, 'ghost', r);
  api.btn('더 가르치기', () => { if (phase !== 'tested') return api.say('먼저 시험을 봐야 무엇이 부족한지 알 수 있어요.'); queue = shuffle(['cup', 'cup', 'cup', 'can'].map(mk)); phase = 'teach'; upd(); api.say('어떤 물건을 더 보여 줄지 골라 왔어요. 이번엔 투명한 컵도 있어요!'); }, 'ghost', r);
  api.p('AI는 그래프에서 가장 가까운 "배운 물건"을 보고 같은 칸이라고 생각해요. 바탕 색 = AI가 생각하는 칸.', 'note');
  function predict(it) { let best = null, bd = 9; for (const t of train) { const d = Math.hypot(t.w - it.w, t.s - it.s); if (d < bd) { bd = d; best = t; } } return best ? best.taught : null; }
  function label(k) {
    if (phase !== 'teach' || !queue.length) return api.say(phase === 'teach' ? '다 가르쳤어요! 이제 시험을 봐요.' : '시험 결과를 보고 "더 가르치기"를 눌러 봐요.');
    const it = queue.shift(); it.taught = k; train.push(it); api.tone(500 + train.length * 30, 0.08, 'triangle', 0.08);
    if (k !== it.lab) api.say(`음, ${CL[k][0]}라고 배웠어요. 진짜 맞아요? AI는 가르쳐 준 대로만 배워요.`);
    else api.say(pickR(['배웠어요! 무게와 반짝임을 기억할게요.', '알겠어요! 그래프에 점을 찍었어요.']));
    if (!queue.length) api.say('다 배웠어요! "AI 시험 보기"를 눌러 처음 보는 물건으로 시험해 봐요.');
    upd();
  }
  function runTest() {
    if (queue.length) return api.say(`아직 가르칠 물건이 ${queue.length}개 남았어요.`);
    round++;
    test = shuffle(['can', 'can', 'can', 'cbottle', 'cbottle', 'cup', 'cup', 'cup', 'paper', 'paper', 'glass', 'glass'].map(mk)).map((it) => ({ ...it, pred: predict(it) }));
    const ok = test.filter((x) => x.pred === x.lab).length; acc = Math.round(ok / test.length * 100); phase = 'tested'; upd();
    const cupWrong = test.filter((x) => x.look === 'cup' && x.pred !== x.lab), mis = train.filter((x) => x.taught !== x.lab).length;
    if (acc >= 90) api.done(`시험 점수 ${acc}점! AI는 우리가 보여 준 만큼만 알아요. 투명한 컵을 못 봤을 땐 틀렸지만, 보여 주니 맞혔어요. 무엇을 보여 줄지는 사람이 정해요.`);
    else if (mis >= 2) api.say(`${acc}점… 가르쳐 준 것 중 ${mis}개가 실제와 달랐어요. 나는 가르쳐 준 대로만 배워요! "처음부터"를 눌러 다시 가르쳐 볼까?`, true);
    else if (cupWrong.length) api.say(`${acc}점… 투명한 컵을 "${CL[cupWrong[0].pred][0]}"(이)라고 했어요! 나는 투명한 플라스틱을 한 번도 못 봤거든요. 어떻게 하면 좋을까?`, true);
    else api.say(`${acc}점이에요. 잘못 배운 게 있을까? 더 가르쳐 볼까?`);
    api.tone(acc >= 90 ? 880 : 300, 0.2, 'sine', 0.1);
  }
  function upd() { ST.n(`<b>${train.length}</b>개`); ST.acc(acc == null ? '-' : `<b>${acc}</b>점`); ST.phase(phase === 'teach' ? (queue.length ? `가르치기 (${queue.length}개 남음)` : '시험 볼 준비') : '시험 끝'); }
  function icon(it, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    if (it.look === 'can') { g.fillStyle = '#b9c2c9'; g.fillRect(-10, -16, 20, 32); g.fillStyle = '#e63946'; g.fillRect(-10, -4, 20, 8); }
    else if (it.look === 'cbottle') { g.fillStyle = '#ff9f1c'; g.fillRect(-8, -10, 16, 26); g.fillRect(-4, -18, 8, 8); }
    else if (it.look === 'cup') { g.strokeStyle = '#4cc9f0'; g.lineWidth = 2.5; g.fillStyle = 'rgba(200,240,255,.6)'; g.beginPath(); g.moveTo(-11, -14); g.lineTo(11, -14); g.lineTo(7, 16); g.lineTo(-7, 16); g.closePath(); g.fill(); g.stroke(); }
    else if (it.look === 'paper') { g.fillStyle = '#f2e8d5'; g.fillRect(-12, -15, 24, 30); g.strokeStyle = '#c9a77c'; g.beginPath(); g.moveTo(-7, -6); g.lineTo(7, -6); g.moveTo(-7, 2); g.lineTo(7, 2); g.stroke(); }
    else { g.fillStyle = 'rgba(6,214,160,.55)'; g.beginPath(); g.ellipse(0, 4, 11, 13, 0, 0, TAU); g.fill(); g.fillRect(-5, -16, 10, 8); }
    g.restore();
  }
  function draw() {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    const px = 50, py = 20, pw = 340, ph = 340;
    // 결정 영역
    if (train.length) for (let i = 0; i < 34; i++) for (let j = 0; j < 34; j++) { const it = { w: (i + 0.5) / 34, s: 1 - (j + 0.5) / 34 }, p = predict(it); g.fillStyle = CL[p][1]; g.globalAlpha = 0.16; g.fillRect(px + i * 10, py + j * 10, 10, 10); }
    g.globalAlpha = 1; g.strokeStyle = '#90a4ae'; g.strokeRect(px, py, pw, ph);
    g.fillStyle = '#4a5d70'; g.font = `600 13px ${FONT}`; g.fillText('가벼움 ← 무게 → 무거움', px + 90, py + ph + 18);
    g.fillText('반짝', px - 40, py + 12); g.fillText('흐림', px - 40, py + ph - 2); g.save(); g.translate(px - 22, py + ph / 2 + 30); g.rotate(-Math.PI / 2); g.fillText('반짝임', 0, 0); g.restore();
    for (const t of train) { icon(t, px + t.w * pw, py + (1 - t.s) * ph, 0.8); g.strokeStyle = CL[t.taught][1]; g.lineWidth = 3; g.beginPath(); g.arc(px + t.w * pw, py + (1 - t.s) * ph, 17, 0, TAU); g.stroke(); }
    for (const t of test) { const x = px + t.w * pw, y = py + (1 - t.s) * ph; g.globalAlpha = 0.85; icon(t, x, y, 0.6); g.globalAlpha = 1; if (t.pred !== t.lab) { g.strokeStyle = '#ef476f'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 9, y - 9); g.lineTo(x + 9, y + 9); g.moveTo(x + 9, y - 9); g.lineTo(x - 9, y + 9); g.stroke(); } }
    // 오른쪽 카드
    g.fillStyle = '#f4f7fa'; g.fillRect(420, 20, 200, 200); g.strokeStyle = '#dde3e8'; g.strokeRect(420, 20, 200, 200);
    if (phase === 'teach' && queue.length) { icon(queue[0], 520, 110, 2.6); g.fillStyle = '#1d3557'; g.font = `700 14px ${FONT}`; g.fillText('이건 어디에?', 476, 200); }
    else { g.fillStyle = '#1d3557'; g.font = `700 15px ${FONT}`; g.fillText(acc == null ? '시험 볼 준비 완료' : `시험 점수 ${acc}점`, 450, 110); if (acc != null) { g.font = `600 13px ${FONT}`; g.fillText('빨간 X = AI가 틀린 것', 452, 140); } }
    g.fillStyle = '#4a5d70'; g.font = `600 12px ${FONT}`;
    g.fillText('바탕 색 = AI가 생각하는 칸', 424, 240);
    Object.entries(CL).forEach(([k, [n, cc]], i) => { const lx = 424 + (i % 2) * 100, ly = 254 + Math.floor(i / 2) * 22; g.fillStyle = cc; g.fillRect(lx, ly, 14, 14); g.fillStyle = '#4a5d70'; g.fillText(n, lx + 20, ly + 12); });
  }
  upd();
  api.say('나는 아직 분리수거를 몰라요. 물건을 보여 주고 어디에 넣는지 알려 줘요. 나는 무게와 반짝임만 볼 수 있어요.');
  return { tick: draw };
};
