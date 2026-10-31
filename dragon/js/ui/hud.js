// 화면 글 — 지금 할 일(목표만) · 하는 법 창(그림 세 줄) · 그림 말풍선(얼굴 + 물건 + 두 줄 30자) · 힌트 단계 · F 키 표시(쉬움) · 배너(보이는 변화) · 덮개(불러오기)
// 공책 결(종이 #f4ead2 · 잉크 #2b2118 · 손으로 자른 듯한 모서리) · 그라데이션·유리·✨ 없음 · :has() 없음 · 놀이를 멈추지 않음(걸으며 들음)
import { FACES, ICONS, HOWTO, PICT } from './art.js?v=16';

const CSS = `
#hud { position:fixed; inset:0; pointer-events:none; z-index:20; font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif; color:#2b2118; }
#hud .paper { background:#f4ead2; border:2px solid #2b2118; border-radius:14px 18px 12px 20px / 18px 12px 20px 14px; box-shadow:3px 4px 0 rgba(43,33,24,.35); }
#goal { position:absolute; top:12px; left:50%; transform:translateX(-50%); padding:7px 16px 7px 12px; font-size:20px; font-weight:700; display:flex; gap:8px; align-items:center; max-width:86vw; white-space:nowrap; }
#goal svg { width:26px; height:26px; flex:none; }
#goal.off { display:none; }
#hint { position:absolute; top:64px; left:50%; transform:translateX(-50%); padding:6px 14px; font-size:17px; display:flex; gap:8px; align-items:center; max-width:80vw; }
#hint svg { width:34px; height:34px; flex:none; }
#howto { position:absolute; left:14px; top:84px; padding:10px 12px; width:270px; transition:opacity .4s; }
#howto .row { display:flex; align-items:center; gap:8px; margin:5px 0; min-height:42px; }
#howto .k { width:92px; display:flex; justify-content:flex-end; gap:2px; flex:none; }
#howto .k svg.key { height:30px; width:auto; }
#howto .k .keys { display:flex; gap:1px; } #howto .k .keys svg.key { height:22px; }
#howto .p svg { width:38px; height:38px; }
#howto .w { font-size:15px; font-weight:700; }
#bubble { position:absolute; left:50%; bottom:22px; transform:translateX(-50%); padding:8px 16px 8px 8px; display:flex; gap:10px; align-items:center; max-width:min(560px,92vw); transition:opacity .25s; }
#bubble .face svg { width:62px; height:62px; display:block; }
#bubble .nm { font-size:13px; color:#6a5a48; font-weight:700; }
#bubble .tx { font-size:21px; line-height:1.35; font-weight:600; }
#bubble .ic { display:flex; gap:2px; } #bubble .ic svg { width:34px; height:34px; }
#banner { position:absolute; top:108px; left:50%; transform:translateX(-50%); padding:8px 18px; font-size:19px; font-weight:700; display:flex; gap:10px; align-items:center; transition:opacity .4s; }
#banner svg { width:34px; height:34px; }
#mood { position:absolute; right:14px; top:14px; padding:4px; width:66px; }
#mood svg { width:56px; height:56px; display:block; }
.fk { position:absolute; width:34px; height:34px; transform:translate(-50%,-100%); }
#veil { position:fixed; inset:0; z-index:40; background:#1d2730; color:#f4ead2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; font-family:inherit; transition:opacity .35s; pointer-events:auto; }
#veil .t { font-size:30px; font-weight:800; } #veil .s { font-size:18px; opacity:.85; }
#hud .hide, #veil.hide { opacity:0; }
#hud .gone { display:none; }
#sketch { position:absolute; right:14px; bottom:96px; width:200px; height:150px; padding:4px; }
#sketch canvas { width:100%; height:100%; display:block; }
@media (max-width:700px) { #howto { width:220px; top:70px; } #goal { font-size:16px; } #bubble .tx { font-size:17px; } }
`;

export function createHud() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'hud';
  root.innerHTML = `<div id="goal" class="paper off"></div><div id="hint" class="paper gone"></div><div id="howto" class="paper gone"></div>
    <div id="banner" class="paper gone"></div><div id="bubble" class="paper gone"></div><div id="mood" class="paper gone"></div><div id="sketch" class="paper gone"><canvas width="400" height="300"></canvas></div><div id="fks"></div>`;
  document.body.appendChild(root);
  const veil = document.createElement('div'); veil.id = 'veil'; veil.className = 'hide'; veil.style.display = 'none'; veil.innerHTML = '<div class="t"></div><div class="s"></div>'; document.body.appendChild(veil);
  const $ = (id) => root.querySelector('#' + id);
  const H = { root, queue: [], cur: null, curT: 0, bannerT: 0, howtoT: 0, log: [] };

  /* 지금 할 일 — 목표만(방법은 힌트 단계에서만) */
  H.goal = (text) => { const g = $('goal'); if (!text) { g.classList.add('off'); H.goalText = ''; return; } g.innerHTML = ICONS.pencil + '<span>' + text + '</span>'; g.classList.remove('off'); H.goalText = text; };
  /* 하는 법 창 — 동사 하나 · secs 뒤 사라짐(다시 = 힌트 단계 2) */
  H.howto = (verb, secs = 8) => {
    const rows = HOWTO[verb]; const el = $('howto'); if (!rows) { el.classList.add('gone'); return; }
    el.innerHTML = rows.map(([k, p, w]) => `<div class="row"><div class="k">${k}</div><div class="p">${(PICT[p] || p || '')}</div><div class="w">${w}</div></div>`).join('');
    el.classList.remove('gone', 'hide'); H.howtoT = secs; H.howtoVerb = verb;
  };
  /* 그림 말풍선 — who(얼굴) · text(두 줄 30자 안) · icons(물건) · 차례로 · 걷는 동안 */
  H.say = (who, text, icons = [], opt = {}) => { H.queue.push({ who, text, icons, secs: opt.secs || Math.min(5.5, 2.2 + text.length * 0.07), name: opt.name }); H.log.push(who + ': ' + text); if (H.log.length > 40) H.log.shift(); };
  H.sayNow = (who, text, icons = [], opt = {}) => { H.queue.length = 0; H.cur = null; H.say(who, text, icons, opt); };
  H.busy = () => !!H.cur || H.queue.length > 0;
  H.clearSay = () => { H.queue.length = 0; H.cur = null; $('bubble').classList.add('gone'); };
  const NAMES = { hiccup: '히컵', toothless: '투슬리스', stoick: '아빠 스토이크', gobber: '대장장이 고버 아저씨', astrid: '아스트리드', fishlegs: '피시레그', snotlout: '스노트라우트', twins: '쌍둥이', villager: '마을 사람' };
  H.met = new Set();
  function showBubble(b) {
    const el = $('bubble'), f = FACES[b.who] ? FACES[b.who](b.faceOpt || {}) : '';
    const first = !H.met.has(b.who); H.met.add(b.who);
    const nm = b.name || (first ? NAMES[b.who] : '');              // 처음 만날 때 관계 + 이름(design §8)
    el.innerHTML = `<div class="face">${f}</div><div><div class="nm">${nm || ''}</div><div class="tx">${b.text}</div></div>${b.icons.length ? '<div class="ic">' + b.icons.map((i) => ICONS[i] || '').join('') + '</div>' : ''}`;
    el.classList.remove('gone', 'hide');
  }
  /* 힌트 — level 1·2 · 히컵 생각 말풍선 */
  H.hint = (text) => { const el = $('hint'); if (!text) { el.classList.add('gone'); H.hintText = ''; return; } el.innerHTML = FACES.hiccup() + '<span>' + text + '</span>'; el.classList.remove('gone'); H.hintText = text; };
  /* 배너 — 장이 끝나거나 세상이 바뀔 때(보이는 변화) */
  H.banner = (text, icon, secs = 3) => { const el = $('banner'); el.innerHTML = (icon && ICONS[icon] ? ICONS[icon] : '') + '<span>' + text + '</span>'; el.classList.remove('gone', 'hide'); H.bannerT = secs; H.bannerText = text; };
  /* 쉬움: 투슬리스 기분 얼굴(드래곤 책 구석) */
  H.mood = (pupil) => { const el = $('mood'); if (pupil == null) { el.classList.add('gone'); return; } const p = Math.round(pupil * 4) / 4; if (p !== H.moodP) { H.moodP = p; el.innerHTML = FACES.toothless({ pupil: p, smile: p > 0.8 }); } el.classList.remove('gone'); };
  /* 쉬움: 쓸 수 있는 물건 위 F 키 그림만(할 일 그림 X) — list = [{x,y}] 화면 좌표 */
  const fks = []; const fkWrap = $('fks');
  H.fkeys = (list) => {
    while (fks.length < list.length) { const d = document.createElement('div'); d.className = 'fk'; d.innerHTML = '<svg viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="32" rx="7" fill="#f4ead2" stroke="#2b2118" stroke-width="2"/><text x="19" y="24" text-anchor="middle" font-size="18" font-weight="700" fill="#2b2118" font-family="sans-serif">F</text></svg>'; fkWrap.appendChild(d); fks.push(d); }
    for (let i = 0; i < fks.length; i++) { const d = fks[i]; if (i < list.length) { d.style.display = ''; d.style.left = list[i].x + 'px'; d.style.top = list[i].y + 'px'; } else d.style.display = 'none'; }
  };
  /* 스케치 공책(3장 관찰) — canvas를 장이 그림 */
  H.sketch = (on) => { $('sketch').classList.toggle('gone', !on); return $('sketch').querySelector('canvas'); };
  /* 덮개 — 장소를 지을 때 */
  H.veil = { show(t, s) { veil.querySelector('.t').textContent = t || ''; veil.querySelector('.s').textContent = s || ''; veil.style.display = ''; veil.classList.remove('hide'); }, hide() { veil.classList.add('hide'); setTimeout(() => { if (veil.classList.contains('hide')) veil.style.display = 'none'; }, 400); } };
  /* 읽어 주기(1~2학년 덤 · goal §2-6) — 이 기기 안 한국어 음성(localService)만 · 온라인 음성은 글이 바깥 서버로 가서 X · 없으면 단추를 숨김 */
  H.voice = null; H.read = false;
  const rb = document.createElement('button'); rb.style.cssText = 'position:fixed;left:120px;bottom:14px;z-index:25;font:600 15px "Noto Sans KR",sans-serif;padding:6px 12px;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:12px 16px 10px 18px;cursor:pointer;display:none';
  rb.textContent = '읽어 주기 켜기'; document.body.appendChild(rb);
  rb.onclick = () => { H.read = !H.read; rb.textContent = H.read ? '읽어 주기 끄기' : '읽어 주기 켜기'; if (!H.read) try { speechSynthesis.cancel(); } catch (e) { /* 없음 */ } rb.blur(); };
  const pickVoice = () => { try { const v = speechSynthesis.getVoices().filter((x) => /^ko/i.test(x.lang) && x.localService === true); H.voice = v[0] || null; rb.style.display = H.voice ? '' : 'none'; } catch (e) { H.voice = null; } };
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  const speak = (text) => { if (!H.read || !H.voice) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[()…]/g, ' ')); u.voice = H.voice; u.lang = H.voice.lang; u.rate = 1; speechSynthesis.speak(u); } catch (e) { /* 그대로 */ } };
  /* 걸음마다(실제 시간) — 말풍선 차례 · 배너·하는 법 시간 */
  H.tick = (dt) => {
    if (!H.cur && H.queue.length) { H.cur = H.queue.shift(); H.curT = H.cur.secs; showBubble(H.cur); speak(H.cur.text); }
    if (H.cur) { H.curT -= dt; if (H.curT <= 0) { H.cur = null; if (!H.queue.length) $('bubble').classList.add('gone'); } }
    if (H.bannerT > 0) { H.bannerT -= dt; if (H.bannerT <= 0) $('banner').classList.add('gone'); }
    if (H.howtoT > 0) { H.howtoT -= dt; if (H.howtoT <= 0) $('howto').classList.add('gone'); }
  };
  H.state = () => ({ goal: H.goalText || '', hint: H.hintText || '', bubble: H.cur ? H.cur.who + ': ' + H.cur.text : '', banner: H.bannerT > 0 ? H.bannerText : '', howto: H.howtoT > 0 ? H.howtoVerb : '' });
  H.reset = () => { H.clearSay(); H.goal(''); H.hint(''); $('howto').classList.add('gone'); $('banner').classList.add('gone'); H.mood(null); H.fkeys([]); H.sketch(false); };
  return H;
}
