// 🎓 학원 수업(ACAD-1 · 교사 11-07 '학원에서 공부 요소만 더 추가하고 이번 주는 마무리' · 설계 docs/systems/town_acad.md) — 창 · 학원 수첩 · 칠판 별 · 수료 도장 · 보상
//   문제 은행 = town_acad_bank.js(순수 함수 · 노드 시험 acad_bank.mjs) · 이 파일 = 화면과 상태만
//   한 판 = 다섯 문제(수업 · 오후 2~7시 마을 시계) 또는 셋(자습 · 그 밖) · 틀리면 그 보기 ✗ 잠김 + 힌트 1 → 힌트 2 → 까닭(정답 단추를 칠하지 않음) · 맞히면 '오늘 배운 것' 한 줄
//   잘한 판(다섯 가운데 넷 이상을 까닭 보기 전에) = 단계 +1(과목마다 하루 한 번) → 칠판 별 · 가방 🏅 수료 도장 · 솜씨 = 수업 한 판마다 꼬리표 acad:<과목>(rwCheck · RW_XP.acad = 1)
//   마을 쪽이 넘기는 것(A): GAME · lang() · esc(t) · openP(h, wide, kind) · closeP() · say(t, s) · sfx(k) · tone(f, t0, dur, type, vol) · skUp(k, n, src) · skXp(k) · rec(k, o) · add(e, n, src) · bagShow() · mute()
//   지키는 선: 순위·견주기 X · 빈 칭찬 X(무엇을 했는지 한 줄) · 판타지 X · 실명 X · 매 프레임 일 0(창 안 타이머만 · 창이 닫히면 멈춤) · 새 Light X
import { lesson, SUBJ, SUBJ_ORDER, goodRun, hashS, RHY_KEYS, MOVES, shapeSvg, BLK } from './town_acad_bank.js?v=4';
export const ACAD_V = 1;
export const ACAD_HOURS = [14, 19];
export const ACAD_SK = { math: 'explore', english: 'explore', science: 'look', study: 'explore', art: 'look', piano: 'explore', taekwondo: 'explore' };   /* 예전 학원 갈래 솜씨 그대로(town_enter.js CATS sk) */
// POLISH-1(11-07 '학원 로봇 문제 휴대폰 가로 = 보기 둘 남짓만 보이고 나머지는 내려야 해요'): 낮은 가로 화면(휴대폰 가로 · 사파리 주소창 빼고 300~390px)
//   그림 있는 문제 = 왼쪽 칸 [문제 번호 · 그림] · 오른쪽 칸 [할 일 · 물음 · 블록 뜻 · 보기 두 칸 격자] · 힌트 칸은 아래 단추 줄 왼쪽(한 줄 띠) · 창 높이 96% · 그림 문제는 .ac-body.side 꼬리표(has 선택자 X)
const CSS = `
.twn-p[data-k=acadq] .bx,.twn-p[data-k=acad] .bx{width:min(880px,96vw)!important}
.twn-p[data-k=acadq] .row button,.twn-p[data-k=acad] .row button,.twn-p .ac-tools button{min-height:48px;font-size:17px}
.twn-p .ac-subs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px}.twn-p .ac-subs button{min-height:48px;font-size:17px}
.twn-p .ac-top{display:flex;align-items:center;gap:10px;margin:0 0 6px;font-size:17px;font-weight:800}.twn-p .ac-dots{letter-spacing:4px;font-size:20px}.twn-p .ac-dots i{font-style:normal}.twn-p .ac-dots .now{color:var(--g)}
.twn-p .ac-star{background:#fff1c9;border:2px solid var(--ink);border-radius:10px;padding:1px 8px;font-size:15px}
.twn-p .ac-task{font-size:16px;color:var(--mut);font-weight:700;margin:2px 0 6px}
.twn-p .ac-q{font-size:21px;font-weight:800;line-height:1.5;margin:4px 0 10px}
.twn-p .ac-text{font-size:18px;line-height:1.7;background:var(--card);border:2px solid var(--line);border-radius:12px;padding:10px 14px;margin:0 0 10px}
.twn-p .ac-pic{display:flex;justify-content:center;align-items:center;gap:10px;margin:4px 0 10px;flex-wrap:wrap}.twn-p .ac-pic svg{max-width:100%;height:auto;background:#fffdf7;border:2px solid var(--line);border-radius:12px}
.twn-p .ac-emo{font-size:76px;line-height:1.1}.twn-p .ac-bigd{font-size:76px;font-weight:900;line-height:1.1;color:var(--ink)}
.twn-p .ac-sw{display:inline-block;width:30px;height:30px;border-radius:50%;border:3px solid var(--ink);vertical-align:middle;flex:none}.twn-p .ac-pic .ac-sw{width:64px;height:64px}.twn-p .ac-op{font-size:30px;font-weight:900}
.twn-p .ac-pat{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;background:#fffdf7;border:2px solid var(--line);border-radius:12px;padding:8px}.twn-p .ac-pat .hole{width:34px;height:34px;border:3px dashed var(--ink);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900}
.twn-p .ac-ch{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 4px}.twn-p .ac-ch.long{grid-template-columns:1fr}
.twn-p .ac-ch button{min-height:58px;font-size:19px;display:flex;align-items:center;justify-content:center;gap:10px;text-align:left;line-height:1.35;background:var(--sub);color:var(--ink);text-shadow:none;position:relative}.twn-p .ac-ch.long button{justify-content:flex-start;font-size:17px;font-weight:700}
.twn-p .ac-ch button:hover{background:var(--subh)}.twn-p .ac-ch button .k{position:absolute;left:8px;top:4px;font-size:11px;color:var(--mut);font-weight:700}
.twn-p .ac-ch button.no{background:#eee7dc;color:#9a8f82;border-color:#b9ad9f;box-shadow:0 2px 0 #b9ad9f;text-decoration:line-through}.twn-p .ac-ch button.no::after{content:'✗';margin-left:6px;color:#c8553d;text-decoration:none}
.twn-p .ac-ch button.ok{background:#dff1d8;border-color:var(--g);color:var(--ink)}.twn-p .ac-ch button.ok::after{content:'✓';margin-left:6px;color:var(--g);font-weight:900}
.twn-p .ac-ch .emo{font-size:44px;line-height:1}.twn-p .ac-blk{display:inline-flex;flex:none;align-items:center;justify-content:center;min-width:34px;height:34px;border-radius:8px;background:#fff;border:2px solid var(--ink);font-style:normal;font-size:20px;padding:0 4px;white-space:nowrap}.twn-p .ac-blk.rep{background:#fff1c9;gap:3px;font-size:16px;font-weight:900;padding:0 6px;line-height:1}.twn-p .ac-blk.rep i{font-style:normal;font-size:20px;line-height:1}.twn-p .ac-ch button.prog{flex-wrap:wrap;gap:6px;padding:8px 10px}
.twn-p .ac-legend{font-size:14px;color:var(--mut);display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:-4px 0 8px}
.twn-p .ac-fr{display:inline-flex;align-items:center;gap:3px;vertical-align:middle;margin:0 2px}.twn-p .ac-fq{display:inline-flex;flex-direction:column;align-items:center;line-height:1.05;font-size:.82em}.twn-p .ac-fq i{font-style:normal;padding:0 3px}.twn-p .ac-fq i:first-child{border-bottom:2px solid currentColor}
.twn-p .ac-main.side{display:grid;grid-template-columns:minmax(0,auto) minmax(0,1fr);gap:16px;align-items:center}.twn-p .ac-main.side .ac-pic{margin:0 0 4px}.twn-p .ac-main.side .ac-pic svg{max-height:min(48vh,320px);width:auto}.twn-p .ac-main.side .ac-ch{grid-template-columns:1fr;margin:0}.twn-p .ac-main.side .ac-legend{margin:0 0 4px}
.twn-p .ac-foot{position:sticky;bottom:-16px;z-index:3;margin:8px -18px -16px;padding:2px 18px 10px;background:var(--pap);border-top:2px solid var(--line)}.twn-p .ac-foot .row{margin-top:8px}.twn-p .ac-foot .ac-msg:empty{display:none}
.twn-p .ac-msg{min-height:30px;font-size:17px;line-height:1.5;margin:8px 0 0;padding:8px 12px;border-radius:12px;background:#fff8e1;border:2px solid #ecd27a}.twn-p .ac-msg:empty{visibility:hidden}.twn-p .ac-msg.ok{background:#e8f5e2;border-color:#9ccf8f}.twn-p .ac-msg.why{background:#eef3fb;border-color:#9bb6dd}
.twn-p .ac-msg details{margin-top:4px;font-size:15px}.twn-p .ac-msg summary{cursor:pointer;font-weight:800;color:var(--g)}
.twn-p .ac-play{font-size:16px;min-height:44px}.twn-p .ac-tools{display:flex;gap:8px;justify-content:center;margin:0 0 8px;flex-wrap:wrap}
.twn-p .ac-cells{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0 10px}.twn-p .ac-cells b{min-width:64px;height:56px;border:3px solid var(--line);border-radius:12px;background:#fffdf7;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;color:var(--ink);padding:0 4px}
.twn-p .ac-cells b.hint{color:#b9ad9f}.twn-p .ac-cells b.lit{background:#fff1c9;border-color:var(--ink);transform:translateY(-3px)}.twn-p .ac-cells b.in{border-color:var(--ink);background:#e6f0fb}
.twn-p .ac-keys{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.twn-p .ac-keys button{min-width:110px;min-height:62px;font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}.twn-p .ac-keys button small{font-size:12px;font-weight:700;opacity:.85}
.twn-p .ac-ord .ac-items{display:grid;grid-template-columns:1fr;gap:8px}.twn-p .ac-ord .ac-items button{min-height:52px;font-size:17px;justify-content:flex-start;text-align:left;background:var(--sub);color:var(--ink);text-shadow:none;display:flex;flex-direction:column;align-items:flex-start}.twn-p .ac-ord .ac-items button small{font-size:13px;color:var(--mut)}.twn-p .ac-ord .ac-items button[disabled]{opacity:.45}
.twn-p .ac-ord ol{margin:4px 0 10px;padding-left:28px;font-size:17px;line-height:1.6;min-height:28px}.twn-p .ac-ord ol li{background:#e6f0fb;border-radius:8px;padding:2px 8px;margin:3px 0}
.twn-p .ac-intro .ac-big,.twn-p .ac-end .ac-big{font-size:20px;font-weight:800;line-height:1.5;margin:6px 0}.twn-p .ac-intro p,.twn-p .ac-end p{font-size:17px;line-height:1.55;margin:6px 0}.twn-p .ac-note{background:#fff8e1;border:2px solid #ecd27a;border-radius:12px;padding:8px 12px}
.twn-p .ac-steps{display:flex;gap:6px;margin:4px 0 8px}.twn-p .ac-steps b{width:44px;height:44px;border-radius:12px;border:3px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:18px;background:#fffdf7}.twn-p .ac-steps b.done{background:#fff1c9;border-color:var(--ink)}.twn-p .ac-steps b.now{border-color:var(--g);background:#e8f5e2}
.twn-p .ac-marks{display:flex;gap:8px;font-size:26px;margin:4px 0}.twn-p .ac-learn ul{margin:4px 0 0;padding-left:22px;font-size:17px;line-height:1.6}
.twn-p .ac-nb{display:grid;gap:8px;margin-top:6px}.twn-p .ac-nr{display:flex;gap:12px;align-items:center;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:8px 12px;font-size:16px}.twn-p .ac-nr>b.ic{font-size:30px;flex:none;width:40px;text-align:center}.twn-p .ac-nr>div{flex:1;min-width:0}.twn-p .ac-nr small{color:var(--mut);font-size:14px}.twn-p .ac-nr .ac-steps b{width:28px;height:28px;font-size:13px;border-width:2px;border-radius:8px}.twn-p .ac-nr .side{flex:none;text-align:right;font-size:14px;color:var(--mut);line-height:1.5}
@media (max-height:500px){.twn-p .ac-top{margin:0 0 2px;font-size:15px}.twn-p .ac-task{font-size:14px;margin:0 0 2px}.twn-p .ac-q{font-size:18px;margin:2px 0 6px;line-height:1.4}.twn-p .ac-ch{gap:6px;margin:4px 0 2px}.twn-p .ac-ch button{min-height:46px;font-size:17px;padding-top:4px;padding-bottom:4px}.twn-p .ac-pic{margin:2px 0 6px}.twn-p .ac-pic svg{max-height:42vh;width:auto}.twn-p .ac-main.side .ac-pic svg{max-height:38vh}.twn-p .ac-main.side{gap:10px;align-items:start}.twn-p .ac-legend{font-size:12px;gap:6px}.twn-p .ac-blk{height:30px;min-width:30px;font-size:18px}.twn-p .ac-blk.rep{font-size:15px}.twn-p .ac-ch button.prog{gap:5px;padding:5px 8px}.twn-p .ac-emo,.twn-p .ac-bigd{font-size:48px}.twn-p .ac-msg{font-size:15px;padding:5px 10px;margin-top:4px}.twn-p .ac-foot .row{margin-top:4px}.twn-p .ac-intro .ac-big,.twn-p .ac-end .ac-big{font-size:17px;margin:2px 0}.twn-p .ac-intro p,.twn-p .ac-end p{font-size:15px;margin:3px 0}.twn-p .ac-steps b{width:36px;height:36px}.twn-p .ac-cells b{height:46px}.twn-p .ac-keys button{min-height:48px}}
@media (max-height:500px) and (min-width:621px){.twn-p[data-k=acadq] .bx{max-height:96vh}.twn-p[data-k=acadq] .bx>h3:first-child{margin-bottom:2px}
.twn-p .ac-body.side{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto auto auto auto auto 1fr auto;column-gap:12px;align-items:start}.twn-p .ac-body.side .ac-main,.twn-p .ac-body.side .ac-l,.twn-p .ac-body.side .ac-r{display:contents}
.twn-p .ac-body.side>.ac-top{grid-column:1;grid-row:1;flex-wrap:wrap;gap:2px 8px;margin:0 0 4px}.twn-p .ac-body.side .ac-pic{grid-column:1;grid-row:2/8;margin:0;justify-content:flex-start}.twn-p .ac-body.side .ac-pic svg{max-height:calc(96vh - 190px);max-width:42vw;width:auto}
.twn-p .ac-body.side>.ac-task{grid-column:2;grid-row:1;margin:0}.twn-p .ac-body.side>.ac-q{grid-column:2;grid-row:2;margin:0 0 2px;line-height:1.35}.twn-p .ac-body.side>.ac-text{grid-column:2;grid-row:3}.twn-p .ac-body.side .ac-legend{grid-column:2;grid-row:4;justify-content:flex-start;margin:0 0 2px}.twn-p .ac-body.side .ac-tools{grid-column:2;grid-row:5;justify-content:flex-start;margin:0 0 4px}
.twn-p .ac-body.side .ac-ch{grid-column:2;grid-row:6;grid-template-columns:1fr 1fr;gap:5px;margin:0}.twn-p .ac-body.side .ac-ch button{min-height:44px}.twn-p .ac-body.side .ac-ch button.prog{gap:3px;padding:4px 14px}.twn-p .ac-body.side .ac-blk{box-sizing:border-box;height:26px;min-width:26px;font-size:15px;padding:0 2px;border-radius:7px}.twn-p .ac-body.side .ac-blk.rep{font-size:11px;gap:1px;padding:0 2px}.twn-p .ac-body.side .ac-blk.rep i{font-size:15px}.twn-p .ac-body.side .ac-ch button.no::after,.twn-p .ac-body.side .ac-ch button.ok::after{position:absolute;right:4px;top:3px;margin:0;font-size:14px;line-height:1}.twn-p .ac-body.side>.ac-foot{grid-column:1/-1;grid-row:8}
.twn-p .ac-foot{display:flex;align-items:center;gap:10px;margin-top:4px;padding:2px 18px 8px}.twn-p .ac-foot .ac-msg{flex:1;min-width:0;margin:4px 0 0;font-size:14px;line-height:1.3;padding:4px 10px}.twn-p .ac-foot .ac-msg details{display:inline-block;margin:0 0 0 6px;font-size:13px}.twn-p .ac-foot .row{flex:none;margin:2px 0 0 auto}}
@media (max-width:620px){.twn-p .ac-main.side{display:block}.twn-p .ac-main.side .ac-pic{margin:4px 0 8px}.twn-p .ac-ch{grid-template-columns:1fr}.twn-p .ac-q{font-size:19px}.twn-p .ac-emo,.twn-p .ac-bigd{font-size:60px}.twn-p .ac-keys button{min-width:88px}.twn-p .ac-cells b{min-width:50px}.twn-p .ac-nr{flex-wrap:wrap}.twn-p .ac-nr .side{text-align:left;width:100%}}
`;
const NUMK = ['', '하나', '둘', '셋', '넷', '다섯'];
const WHERE = { math: '수학 학원', english: '영어 학원', science: '공부방(과학·코딩 반)', study: '공부방', art: '미술 학원', piano: '피아노 학원', taekwondo: '태권도장' };   /* 수첩 '어디서 시작' — 이 마을 과학·코딩은 공부방 선생님 반 */
export function createAcad(A) {
  const en = () => A.lang() === 'en', esc = t => A.esc(t), G = () => A.GAME.S, day = () => G().day | 0, hour = () => Math.floor((G().min | 0) / 60);
  const S = () => { const g = G(); let s = g.acad; if (!s || typeof s !== 'object' || s.v !== ACAD_V) s = g.acad = { v: ACAD_V, s: {} }; return s; };
  const sub = k => { const s = S(); let r = s.s[k]; if (!r) r = s.s[k] = { st: 1, clr: 0, up: -1, rd: -1, n: 0, self: 0, learn: [], rec: [] }; return r; };
  const inClass = () => { const h = hour(); return h >= ACAD_HOURS[0] && h < ACAD_HOURS[1]; };
  let RUN = null, P = null, styleEl = null; const DBG = [], log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const tm = [], later = (f, ms) => { const id = setTimeout(() => { const i = tm.indexOf(id); if (i >= 0) tm.splice(i, 1); if (P && P.isConnected) f(); }, ms); tm.push(id); }, stopT = () => { while (tm.length) clearTimeout(tm.pop()); if (RUN) RUN.demo = false; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* 없음 */ } };
  const css = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'acad-css'; styleEl.textContent = CSS; document.head.appendChild(styleEl); } };
  const fr = t => esc(t).replace(/⟦(?:(\d+) )?(\d+)\/(\d+)⟧/g, (m, w, a, b) => '<span class="ac-fr">' + (w ? '<b>' + w + '</b>' : '') + '<span class="ac-fq" aria-label="' + b + '분의 ' + a + '"><i>' + a + '</i><i>' + b + '</i></span></span>');
  const tone = (f, t0, d, ty, v) => { if (A.tone) A.tone(f, t0, d, ty || 'triangle', v == null ? 0.22 : v); };
  const canSay = () => { try { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance) && !(A.mute && A.mute()); } catch (e) { return false; } };
  const speak = t => { if (!canSay()) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) { /* 소리 막힘 */ } };
  const hm = () => { const m = G().min | 0, h = Math.floor(m / 60); return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + '시 ' + String(m % 60).padStart(2, '0') + '분'; };
  const subName = k => (SUBJ[k] ? SUBJ[k].t : k);
  function hourLine() { const h = hour(); return h < ACAD_HOURS[0] ? '수업은 오후 2시부터예요. 지금은 자습만 할 수 있어요.' : h >= ACAD_HOURS[1] ? '오늘 수업은 끝났어요(오후 7시까지). 지금은 자습만 할 수 있어요.' : ''; }
  const steps = (sb, now) => '<div class="ac-steps" aria-label="단계">' + [1, 2, 3, 4, 5].map(i => '<b class="' + (i <= sb.clr ? 'done' : i === sb.st && now ? 'now' : '') + '">' + (i <= sb.clr ? '⭐' : i) + '</b>').join('') + '</div>';
  // ───────── 창 열기 ─────────
  function shell(title, kind) { css(); stopT(); P = A.openP('<h3><span class="ac-ttl">' + esc(title) + '</span></h3><div class="ac-body"></div>', false, kind || 'acadq'); if (!P) return null; P.onclick = onClick; P.addEventListener('keydown', onKey); return P; }
  const body = () => (P ? P.querySelector('.ac-body') : null), setTitle = t => { const e = P && P.querySelector('.ac-ttl'); if (e) e.textContent = t; };
  // 학원 E(town_enter.js): ctx = { say(t) 선생님 말풍선 · stars(n) 칠판 별 · sk 솜씨 갈래 · done() 들른 수 }
  function open(k, ctx) { if (ctx && ctx.subs && RUN && ctx.subs.includes(RUN.k)) k = RUN.k; if (!SUBJ[k]) return false; const d = day();
    if (RUN && RUN.k === k && RUN.day === d && RUN.phase !== 'end' && RUN.phase !== 'intro') { RUN.ctx = ctx || RUN.ctx; if (!shell(titleOf(RUN), 'acadq')) return false; RUN.shown = false; RUN.input = []; drawQ(); log('resume ' + k); return true; }
    RUN = { k, ctx: ctx || {}, day: d, phase: 'intro', mode: inClass() ? 'class' : 'self' };
    if (!shell(titleOf(RUN), 'acadq')) return false; drawIntro(); log('open ' + k + ' ' + RUN.mode); return true; }
  const titleOf = R => SUBJ[R.k].ic + ' ' + subName(R.k) + ' 학원 · ' + sub(R.k).st + '단계 ' + (R.mode === 'class' ? '수업' : '자습');
  function drawIntro() { const R = RUN, sb = sub(R.k), S9 = SUBJ[R.k], cls = R.mode === 'class', b = body(); if (!b) return; setTitle(titleOf(R));
    const first = !sb.n && !sb.self, today = sb.up === day();
    const subs = R.ctx.subs && R.ctx.subs.length > 1 ? '<div class="ac-subs" role="group" aria-label="과목 고르기">' + R.ctx.subs.map(k9 => '<button class="' + (k9 === R.k ? 'on' : 'sub') + '" data-sub="' + k9 + '">' + SUBJ[k9].ic + ' ' + esc(subName(k9)) + ' · ' + (sub(k9).clr >= 5 ? '수료' : sub(k9).st + '단계') + '</button>').join('') + '</div>' : '';
    b.classList.remove('side'); b.innerHTML = subs + '<div class="ac-intro">' + steps(sb, true) + '<p class="ac-big">오늘 배울 것: ' + esc(S9.top[sb.st - 1]) + '</p>'
      + (cls ? '<p>' + (first ? '처음 오셨네요. ' : '') + '문제는 다섯 개예요. 틀리면 힌트가 하나씩 나오고, 마지막엔 까닭을 알려 줘요. 넷 이상을 까닭 보기 전에 맞히면 다음 단계로 올라가요.</p>' : '<p class="ac-note">' + esc(hourLine()) + ' 자습은 세 문제이고, 단계와 도장은 수업에서만 올라요.</p>')
      + (cls && today && sb.clr < 5 ? '<p class="ac-note">오늘은 ' + esc(subName(R.k)) + ' 단계를 벌써 올렸어요. 이번 판은 복습이고, 다음 단계는 내일 수업에서 해요.</p>' : '')
      + (cls && sb.clr >= 5 ? '<p class="ac-note">다섯 단계를 모두 마친 과목이에요. 이번 판은 복습이에요.</p>' : '') + '</div>'
      + '<div class="ac-foot"><div class="row"><button class="sub" data-a="x">닫기</button><button class="sub" data-a="note">📒 학원 수첩</button><button data-a="start" data-def>' + (cls ? '수업 시작' : '자습 시작') + '</button></div></div>';
    if (R.ctx.say && cls) R.ctx.say(first ? subName(R.k) + ' 수업에 온 걸 반가워요. 모르면 힌트를 보면서 천천히 해요.' : sb.st + '단계 수업을 할게요. 천천히 생각해 봐요.'); }
  function start() { const R = RUN, sb = sub(R.k), n = R.mode === 'class' ? 5 : 3, seed = hashS(R.k + ':' + day() + ':' + (sb.n + sb.self) + ':' + (G().id || '') + ':' + Math.round(performance.now() % 997));
    R.L = lesson(R.k, sb.st, seed, { n, recent: sb.rec }); R.i = 0; R.marks = []; R.learned = []; R.phase = 'q'; R.st0 = sb.st; newQ(); sfx('pick'); log('start ' + R.k + ' st' + sb.st + ' n' + R.L.length); drawQ(); }
  function newQ() { const R = RUN; R.demo = false; R.tries = 0; R.no = []; R.solved = false; R.sawWhy = false; R.msg = ''; R.mcls = ''; R.pick = []; R.input = []; R.demoDone = false; R.reveal = false; }
  const cur = () => RUN && RUN.L ? RUN.L[RUN.i] : null;
  const sfx = k => { if (A.sfx) A.sfx(k); };
  function taskOf(p) { return p.kind === 'order' ? '할 일: 맞는 차례대로 하나씩 눌러요.' : p.kind === 'seq' ? (p.demo.tk ? '할 일: 사범님 동작을 본 뒤 같은 차례로 눌러요.' : '할 일: 선생님 리듬을 듣고 같은 차례로 눌러요.') : p.t.endsWith('robot') ? '할 일: 로봇을 ⭐까지 보내는 블록 차례를 골라요.' : '할 일: 알맞은 답을 골라요.'; }
  function visH(p) { const v = p.vis; let h = ''; if (p.pic) h += p.pic;
    if (v) { if (v.emo) h += '<div class="ac-emo" aria-hidden="true">' + esc(v.emo) + '</div>'; if (v.big) h += '<div class="ac-bigd">' + esc(v.big) + '</div>';
      if (v.sw) h += [].concat(v.sw).map(c => '<i class="ac-sw" style="background:' + esc(c) + '"></i>').join(v.plus ? '<b class="ac-op">+</b>' : '') + (v.plus ? '<b class="ac-op">= ?</b>' : '');
      if (v.pat) h += '<div class="ac-pat">' + v.pat.map(x => (x ? shapeSvg(x[0], colOf(x[1])) : '<span class="hole">?</span>')).join('') + (v.pat.every(Boolean) ? '<span class="hole">?</span>' : '') + '</div>'; }
    return h ? '<div class="ac-pic">' + h + '</div>' : ''; }
  const COLN = { 빨강: '#d8262e', 파랑: '#2f6fd0', 노랑: '#f2c230', 초록: '#3f9f4e' }, colOf = n => COLN[n] || '#888';
  function chH(c) { let h = ''; if (c.sw) h += '<i class="ac-sw" style="background:' + esc(c.sw) + '"></i>'; if (c.sw2) h += c.sw2.map(x => '<i class="ac-sw" style="background:' + esc(x) + '"></i>').join('+'); if (c.emo) h += '<span class="emo" aria-hidden="true">' + esc(c.emo) + '</span>'; if (c.shp) h += shapeSvg(c.shp[0], colOf(c.shp[1]), 30);
    if (c.prog) return h + c.prog.map(b => (typeof b === 'object' ? '<i class="ac-blk rep">🔁' + b.n + '<i>' + b.b.map(x => BLK[x][0]).join('') + '</i></i>' : '<i class="ac-blk">' + BLK[b][0] + '</i>')).join('');
    return h + '<span>' + fr(c.t) + '</span>'; }
  function drawQ() { const R = RUN, p = cur(), b = body(); if (!b || !p) return; setTitle(titleOf(R));
    const n = R.L.length, dots = R.L.map((q, i) => '<i class="' + (i === R.i ? 'now' : '') + '">' + (i < R.marks.length ? ['●', '◐', '○'][R.marks[i]] : i === R.i ? '◆' : '·') + '</i>').join('');
    let h = '<div class="ac-top"><span class="ac-dots" aria-label="문제 ' + (R.i + 1) + ' / ' + n + '">' + dots + '</span><span>' + (R.i + 1) + '/' + n + '</span>' + (p.star ? '<b class="ac-star">★ 도전</b>' : '') + '</div>'
      + '<div class="ac-task">' + esc(taskOf(p)) + '</div><div class="ac-q">' + fr(p.q) + '</div>' + (p.text ? '<div class="ac-text">' + esc(p.text) + '</div>' : '');
    const side = !!p.pic && p.kind === 'pick'; h += '<div class="ac-main' + (side ? ' side' : '') + '"><div class="ac-l">' + visH(p);
    const tools = []; if (p.play) tools.push('<button class="sub ac-play" data-a="play">🔊 다시 듣기</button>'); if (p.say && canSay()) tools.push('<button class="sub ac-play" data-a="say">🔊 영어로 듣기</button>');
    if (p.t.endsWith('robot')) h += '<div class="ac-legend"><span>⬆ 한 칸 앞으로</span><span>↺ 왼쪽으로 돌기</span><span>↻ 오른쪽으로 돌기</span>' + (p.ch.some(c => c.prog.some(x => typeof x === 'object')) ? '<span>🔁3 ⬆ = ⬆ 세 번</span>' : '') + '</div>';
    if (tools.length) h += '<div class="ac-tools">' + tools.join('') + '</div>';
    h += '</div><div class="ac-r">';
    if (p.kind === 'pick') h += '<div class="ac-ch' + (p.long ? ' long' : '') + '" role="group">' + p.ch.map((c, i) => '<button class="' + (c.prog ? 'prog ' : '') + (R.no.includes(i) ? 'no' : R.solved && i === p.ans ? 'ok' : '') + '" data-c="' + i + '"' + (R.no.includes(i) || R.solved ? ' disabled' : '') + ' aria-label="' + esc((i + 1) + '번 ' + (c.prog ? progWords(c.prog) : c.t)) + '"><span class="k">' + (i + 1) + '</span>' + chH(c) + '</button>').join('') + '</div>';
    else if (p.kind === 'order') h += ordH(p); else if (p.kind === 'seq') h += seqH(p);
    h += '</div></div>';
    h += '<div class="ac-foot"><div class="ac-msg ' + (R.mcls || '') + '" data-m>' + (R.msg || '') + '</div><div class="row"><button class="sub" data-a="x">닫기</button>' + (R.solved ? '<button data-a="next" data-def>' + (R.i + 1 < n ? '다음 문제' : '끝 보기') + '</button>' : '') + '</div></div>';
    b.innerHTML = h; b.classList.toggle('side', side); if (!R.solved && !R.shown) { R.shown = true; autoPlay(p); } }   /* POLISH-1 낮은 가로 화면 두 칸 꼬리표 */
  const progWords = pr => pr.map(b => (typeof b === 'object' ? b.n + '번 되풀이 ' + b.b.map(x => BLK[x][1]).join(' ') : BLK[b][1])).join(', ');
  function autoPlay(p) { if (p.play) later(() => playNotes(p), 250); if (p.say) later(() => speak(p.say), 300); if (p.kind === 'seq') later(() => demo(p, false), 450); }
  function playNotes(p) { (p.play || []).forEach(([f, t0, d]) => tone(f, t0, d)); }
  // 차례 문제
  function ordH(p) { const R = RUN; return '<div class="ac-ord"><ol>' + R.pick.map(i => '<li>' + esc(p.items[i].t) + '</li>').join('') + '</ol><div class="ac-items">' + p.perm.map((ix, j) => '<button data-o="' + ix + '"' + (R.pick.includes(ix) || R.solved ? ' disabled' : '') + '><span>' + (j + 1) + '. ' + esc(p.items[ix].t) + '</span>' + (p.items[ix].sub ? '<small>' + esc(p.items[ix].sub) + '</small>' : '') + '</button>').join('') + '</div>' + (R.pick.length && !R.solved ? '<div class="ac-tools" style="margin-top:8px"><button class="sub" data-a="undo">⌫ 하나 지우기</button></div>' : '') + '</div>'; }
  // 리듬·동작 차례(seq)
  const keyLab = (p, k) => (p.demo.tk ? MOVES[k].ic + ' ' + MOVES[k].t : RHY_KEYS[k].t), keySub = (p, k) => (p.demo.tk ? '' : RHY_KEYS[k].d);
  function seqH(p) { const R = RUN, showT = p.demo.mode === 'show' || R.reveal; return '<div class="ac-seq"><div class="ac-cells">' + p.seq.map((k, i) => { const v = R.input[i]; return '<b class="' + (v ? 'in' : showT ? 'hint' : '') + '" data-cell="' + i + '">' + esc(v ? keyLab(p, v) : showT ? keyLab(p, k) : '') + '</b>'; }).join('') + '</div>'
    + '<div class="ac-tools"><button class="sub ac-play" data-a="demo"' + (R.demo ? ' disabled' : '') + '>' + (p.demo.tk ? '▶ 다시 보기' : '▶ 다시 듣기') + '</button>' + (R.input.length && !R.solved ? '<button class="sub" data-a="undo">⌫ 하나 지우기</button>' : '') + '</div>'
    + '<div class="ac-keys">' + p.keys.map((k, i) => '<button data-k="' + k + '"' + (R.demo || R.solved || !(R.demoDone || R.reveal) ? ' disabled' : '') + '><span>' + (i + 1) + '. ' + esc(keyLab(p, k)) + '</span>' + (keySub(p, k) ? '<small>' + esc(keySub(p, k)) + '</small>' : '') + '</button>').join('') + '</div></div>'; }
  function keySnd(p, k, t0) { if (p.demo.tk) { tone(MOVES[k].f, t0, 0.28, 'triangle', 0.2); return; } const bt = p.demo.beat; tone(196, t0, 0.06, 'sine', 0.05); if (k === 'q') tone(523.25, t0, 0.32, 'triangle', 0.22); else if (k === 'e') { tone(523.25, t0, 0.16, 'triangle', 0.22); tone(523.25, t0 + bt / 2, 0.16, 'triangle', 0.22); } }
  function demo(p, reveal) { const R = RUN; if (!R || R.demo || R.solved || cur() !== p) return; R.demo = true; R.input = []; if (reveal) R.reveal = true; drawQ(); const bt = p.demo.beat * 1000;
    p.seq.forEach((k, i) => later(() => { if (cur() !== p) return; keySnd(p, k, 0); const cells = P.querySelectorAll('.ac-cells b'); cells.forEach((c, j) => { c.classList.toggle('lit', j === i); if (j === i && (p.demo.mode === 'flash' && !R.reveal)) c.textContent = keyLab(p, k); }); }, 300 + i * bt));
    later(() => { if (cur() !== p) return; R.demo = false; R.demoDone = true; drawQ(); }, 300 + p.seq.length * bt + 350); log('demo'); }
  // ───────── 누르기 ─────────
  function onKey(e) { if (!RUN || RUN.phase !== 'q') return; const p = cur(); if (!p || RUN.solved) return; const d = +e.key; if (d >= 1 && d <= 9) { const sel = p.kind === 'pick' ? '[data-c="' + (d - 1) + '"]' : p.kind === 'seq' ? '.ac-keys button:nth-child(' + d + ')' : '.ac-items button:nth-child(' + d + ')'; const bt = P.querySelector(sel); if (bt && !bt.disabled) { e.preventDefault(); bt.click(); } } else if (e.key === 'Backspace') { const u = P.querySelector('[data-a="undo"]'); if (u) { e.preventDefault(); u.click(); } } }
  function onClick(ev) { const bt = ev.target.closest('button'); if (!bt || bt.disabled || !RUN) return; const a = bt.dataset.a, p = cur();
    if (bt.dataset.sub && RUN.phase === 'intro') { RUN.k = bt.dataset.sub; if (RUN.ctx.pick) RUN.ctx.pick(RUN.k); drawIntro(); return; }
    if (a === 'x') { stopT(); A.closeP(); return; } if (a === 'note') { note(); return; } if (a === 'start') { start(); return; } if (a === 'again') { RUN = { k: RUN.k, ctx: RUN.ctx, day: day(), phase: 'intro', mode: inClass() ? 'class' : 'self' }; drawIntro(); return; }
    if (a === 'next') { stopT(); RUN.i++; if (RUN.i >= RUN.L.length) return finish(); newQ(); RUN.shown = false; drawQ(); return; }
    if (!p) return; if (a === 'play') { playNotes(p); return; } if (a === 'say') { speak(p.say); return; } if (a === 'demo') { demo(p, false); return; }
    if (a === 'undo') { if (p.kind === 'order') RUN.pick.pop(); else RUN.input.pop(); drawQ(); return; }
    if (bt.dataset.c != null) return pickC(p, +bt.dataset.c); if (bt.dataset.o != null) return pickO(p, +bt.dataset.o); if (bt.dataset.k != null) return pickK(p, bt.dataset.k); }
  const hintMsg = (p, extra) => { const R = RUN; if (R.tries === 1) { R.msg = '<b>힌트 1</b> ' + esc((extra ? extra + ' ' : '') + p.h[0]); R.mcls = ''; } else if (R.tries === 2) { R.msg = '<b>힌트 2</b> ' + esc((extra ? extra + ' ' : '') + p.h[1]); R.mcls = ''; } else { R.msg = '<b>까닭</b> ' + fr(p.why); R.mcls = 'why'; R.sawWhy = true; } };
  function pickC(p, i) { const R = RUN; if (R.solved || R.no.includes(i)) return; if (i === p.ans) return solved(p);
    R.no.push(i); R.tries++; sfx('tick'); const left = p.ch.length - 1 - R.no.length; if (left <= 0) R.tries = Math.max(R.tries, 3); hintMsg(p); drawQ(); log('miss ' + i); }
  function pickO(p, ix) { const R = RUN; if (R.solved || R.pick.includes(ix)) return; R.pick.push(ix); sfx('pick');
    if (R.pick.length < p.items.length) { drawQ(); return; }
    if (R.pick.every((v, j) => v === j)) return solved(p); let m = 0; while (R.pick[m] === m) m++; R.tries++; sfx('tick'); R.pick = []; hintMsg(p, '앞에서 ' + (m ? NUMK[m] + '째까지 맞아요.' : '첫째부터 다시 생각해 봐요.')); drawQ(); log('order miss'); }
  function pickK(p, k) { const R = RUN; if (R.solved || R.demo || !(R.demoDone || R.reveal)) return; R.input.push(k); keySnd(p, k, 0);
    if (R.input.length < p.seq.length) { drawQ(); return; }
    if (R.input.every((v, j) => v === p.seq[j])) return solved(p); let m = 0; while (R.input[m] === p.seq[m]) m++; R.tries++; sfx('tick'); R.input = [];
    hintMsg(p, '앞에서 ' + m + '칸까지 맞아요.'); if (R.tries >= 3) R.reveal = true; drawQ(); if (R.tries === 2) later(() => demo(p, true), 900); log('seq miss'); }
  function solved(p) { const R = RUN; R.solved = true; sfx('ding'); const mk = R.sawWhy ? 2 : R.tries ? 1 : 0; R.marks.push(mk); if (!R.learned.includes(p.learn)) R.learned.push(p.learn);
    const sb = sub(R.k); sb.rec = sb.rec.concat(p.key).slice(-14);
    R.msg = '<b>' + (mk === 0 ? '한 번에 맞혔어요.' : mk === 1 ? '힌트를 보고 맞혔어요.' : '까닭을 보고 맞혔어요.') + '</b> 오늘 배운 것: ' + fr(p.learn) + (R.sawWhy ? '' : '<details><summary>왜 그런지 보기</summary>' + fr(p.why) + '</details>'); R.mcls = 'ok';
    drawQ(); const nx = P && P.querySelector('[data-a="next"]'); if (nx) try { nx.focus({ preventScroll: true }); } catch (e) { /* */ } log('ok ' + p.t + ' m' + mk); }
  // ───────── 끝 · 단계 · 도장 · 보상 ─────────
  function finish() { const R = RUN, k = R.k, sb = sub(k), d = day(), cls = R.mode === 'class', good = cls && goodRun(R.marks), before = R.marks.filter(m => m < 2).length; R.phase = 'end'; stopT();
    sb.learn = R.learned.concat(sb.learn.filter(t => !R.learned.includes(t))).slice(0, 3); let res = '', rw = '', up = false;
    if (cls) { sb.n++;
      if (good && sb.clr < 5 && sb.up !== d) { sb.clr++; sb.st = Math.min(5, sb.clr + 1); sb.up = d; up = true; const st = SUBJ[k].stamp; if (A.add) { A.add(st, 1, 'acad:' + k); if (A.bagShow) A.bagShow(); } if (R.ctx.stars) R.ctx.stars(sb.clr, k);
        res = sb.clr >= 5 ? '다섯 단계를 모두 마쳤어요. ' + subName(k) + ' 수료 도장을 다섯 개 모았어요(가방 🏅 모은 것).' : R.st0 + '단계를 마쳤어요. 다음 수업은 ' + sb.st + '단계예요. 칠판에 별이 붙고, 가방 🏅에 ' + subName(k) + ' 수료 도장이 하나 늘었어요(모두 ' + sb.clr + '개).'; }
      else if (good && sb.clr >= 5) res = '수료한 과목이라 복습 판이었어요.';
      else if (good) res = '넷 이상을 까닭 보기 전에 풀었어요. 단계는 과목마다 하루 한 번 올라서, 다음 단계는 내일 수업에서 해요.';
      else res = '까닭 보기 전에 푼 문제가 넷이 되면 단계가 올라요. 까닭을 본 문제를 떠올리며 한 판 더 해 봐요.';
      const skk = (R.ctx && R.ctx.sk) || ACAD_SK[k] || 'explore';
      if (sb.rd !== d) { const x0 = A.skXp ? A.skXp(skk) : 0; A.skUp(skk, 2, 'acad:' + k); const got = (A.skXp ? A.skXp(skk) : 2) - x0; if (got > 0) { sb.rd = d; rw = '솜씨가 ' + got + ' 늘었어요(오늘 ' + subName(k) + ' 수업 몫).'; } else rw = '오늘은 솜씨를 충분히 모았어요. 배운 것은 수첩에 남아요.'; }
      else rw = '오늘 ' + subName(k) + ' 수업 몫은 이미 받았어요. 이번 판은 연습이에요.';
      if (R.ctx.say) R.ctx.say(up ? R.st0 + '단계를 마쳤어요. 칠판에 별을 붙일게요.' : good ? '잘 풀었어요. 다음 단계는 내일 해요.' : '까닭을 본 문제를 다시 떠올려 봐요.'); }
    else { sb.self++; res = '자습은 연습이라 단계와 도장은 수업(오후 2시~7시)에서 올라요.'; }
    if (R.ctx.done) R.ctx.done(); if (A.rec) A.rec('acad', { k, st: R.st0, mode: R.mode, marks: R.marks.slice(), good: !!good, up }); A.GAME.mark();
    const b = body(); if (!b) return; setTitle(SUBJ[k].ic + ' ' + subName(k) + ' 학원 · ' + (cls ? '수업' : '자습') + ' 끝');
    b.classList.remove('side'); b.innerHTML = '<div class="ac-end"><div class="ac-marks" aria-label="문제마다 결과">' + R.marks.map(m => ['●', '◐', '○'][m]).join(' ') + '</div><p style="font-size:14px;color:var(--mut);margin:0">● 한 번에 · ◐ 힌트 뒤 · ○ 까닭 뒤</p>'
      + '<p class="ac-big">' + R.marks.length + '문제 가운데 ' + before + '문제를 까닭 보기 전에 풀었어요.</p>' + steps(sb, false)
      + '<div class="ac-learn"><b>오늘 배운 것</b><ul>' + R.learned.slice(0, 3).map(t => '<li>' + fr(t) + '</li>').join('') + '</ul></div>' + '<p>' + esc(res) + '</p>' + (rw ? '<p>' + esc(rw) + '</p>' : '') + '</div>'
      + '<div class="ac-foot"><div class="row"><button class="sub" data-a="x">닫기</button><button class="sub" data-a="note">📒 학원 수첩</button><button data-a="again" data-def>한 판 더</button></div></div>';
    sfx(up ? 'done' : 'pick'); log('end ' + k + ' good' + (good ? 1 : 0) + ' up' + (up ? 1 : 0)); }
  // ───────── 학원 수첩 ─────────
  function note() { css(); stopT(); const s = S(), d = day();
    const rows = SUBJ_ORDER.map(k => { const S9 = SUBJ[k], sb = s.s[k]; if (!sb) return '<div class="ac-nr"><b class="ic">' + S9.ic + '</b><div><b>' + esc(S9.t) + '</b> <small>아직 안 들었어요</small><div><small>' + esc('1단계: ' + S9.top[0]) + '</small></div></div><div class="side">' + esc(WHERE[k] || S9.t + ' 학원') + '에서 시작</div></div>';
      return '<div class="ac-nr" data-acn="' + k + '"><b class="ic">' + S9.ic + '</b><div><b>' + esc(S9.t) + '</b> <small>' + (sb.clr >= 5 ? '수료' : sb.st + '단계') + '</small>' + steps(sb, true) + '<small>' + (sb.learn.length ? '최근 배운 것: ' + fr(sb.learn[0]) : esc('다음: ' + S9.top[sb.st - 1])) + '</small></div>'
        + '<div class="side">' + S9.stamp + ' 도장 ' + sb.clr + '<br>수업 ' + sb.n + ' · 자습 ' + sb.self + '<br>' + (sb.rd === d ? '오늘 수업 했어요' : '오늘 수업 전') + '</div></div>'; }).join('');
    P = A.openP('<h3>📒 학원 수첩</h3><div class="ac-note" style="margin:0 0 8px;font-size:16px">수업 시간: 오후 2시~7시(마을 시계) · 지금 ' + esc(hm()) + (inClass() ? ' · 수업 중' : ' · 자습만') + '</div><div class="ac-nb">' + rows + '</div><p style="font-size:14px;color:var(--mut)">단계를 마칠 때마다 칠판에 별이 붙고 가방 🏅 모은 것에 수료 도장이 쌓여요. 단계는 과목마다 하루 한 번 올라요.</p><div class="row"><button class="sub" data-a="x">닫기</button>' + (RUN && RUN.phase !== 'end' && RUN.L ? '<button data-a="back" data-def>하던 수업으로</button>' : '') + '</div>', false, 'acad');
    if (P) { P.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.a === 'x') { A.closeP(); return; } if (bt.dataset.a === 'back' && RUN) { open(RUN.k, RUN.ctx); } }; } log('note'); }
  // 시험용: 과목·단계마다 n판을 모두 그려 봄(풀기 전 · 틀린 뒤 · 맞힌 뒤) → 오류 목록(상태는 그대로 되돌림)
  function probe(k, st, n) { const errs = []; let cnt = 0; if (!SUBJ[k] || !shell('probe', 'acadq')) return { errs: ['창 없음'], cnt }; const keep = RUN;
    for (let sd = 1; sd <= n; sd++) { const L = lesson(k, st, 9973 * sd + st * 31); RUN = { k, ctx: {}, day: day(), phase: 'q', mode: 'self', L, i: 0, marks: [], learned: [] };
      for (let i = 0; i < L.length; i++) { const p = L[i]; RUN.i = i; newQ(); RUN.shown = true;
        try { drawQ(); const h = body().innerHTML; if (!/ac-q/.test(h) || /undefined|NaN|\[object/.test(body().textContent)) errs.push(p.t + ' 글 이상'); if (p.kind === 'pick' && body().querySelectorAll('[data-c]').length !== p.ch.length) errs.push(p.t + ' 보기 수'); if (p.t.endsWith('robot')) { const B = [...body().querySelectorAll('.ac-blk')], hs = B.map(e => e.getBoundingClientRect().height), h0 = Math.min(...hs); if (hs.some(x => x > h0 + 2) || B.some(e => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)) errs.push(p.t + ' 블록이 두 줄로 꺾임'); if ([...body().querySelectorAll('.ac-ch button')].some(e => e.scrollWidth > e.clientWidth + 1)) errs.push(p.t + ' 블록이 보기 칸을 넘음'); }
          RUN.no = p.kind === 'pick' ? [0, 1, 2, 3].filter(j => j !== p.ans && j < p.ch.length).slice(0, 1) : []; RUN.tries = 3; RUN.msg = '<b>까닭</b> ' + fr(p.why); drawQ(); RUN.solved = true; RUN.pick = p.items ? p.items.map((x, j) => j) : []; RUN.input = p.seq ? p.seq.slice() : []; drawQ(); cnt++; }
        catch (e) { errs.push(p.t + ' ' + e.message); } } }
    RUN = keep; stopT(); A.closeP(); return { errs, cnt }; }
  const has = () => { const s = G().acad; return !!(s && s.s && Object.values(s.s).some(r => r && (r.n || r.self))); };
  const stars = k => { const s = G().acad; return s && s.s && s.s[k] ? s.s[k].clr | 0 : 0; };
  return { open, note, has, stars, probe, inClass, hourLine, state: () => S(), run: () => (RUN ? { k: RUN.k, mode: RUN.mode, phase: RUN.phase, i: RUN.i, n: RUN.L ? RUN.L.length : 0, marks: (RUN.marks || []).slice(), cur: cur() ? { kind: cur().kind, t: cur().t, ans: cur().ans, seq: cur().seq || null, n: cur().items ? cur().items.length : 0, nch: cur().ch ? cur().ch.length : 0 } : null, tries: RUN.tries, solved: !!RUN.solved, demo: !!RUN.demo, demoDone: !!RUN.demoDone, msg: RUN.msg || '' } : null), dbg: () => DBG.slice() };
}
