// FILM-1(10-04 교사 '교회 오프닝 영상처럼 — 오프닝 보고 우리 학교 다 보고 클로징 · 유튜브 주소를 소스로 · 인포그래픽처럼')
//   3D 학교 위를 나는 카메라(드론 샷·지붕 벗긴 실내 샷) + 화면 위 움직이는 글·숫자·카드(인포그래픽) + 정림초 유튜브 영상 조각(소리 끔·자동 재생) + 합성음 배경.
//   영상 파일을 만들지 않는다 — 그 자리에서 학교를 찍는다(파일 0 · 외부 = 유튜브 영상 창만).
//   play(shots, o) → Promise('end' | 'skip' | 그 끝 화면 단추 k) · shot = { dur, cam:{p:[[x,y,z]…], l:[[x,y,z]…]}, fov, cut:{y, box:[x0,z0,x1,z1]}, time, fade, ui:[…], clip, tags:[…], sfx:[[t,k]…], chord }
//   글·숫자·영상 주소는 v2/games/tour_data.js 'film'(교사) → v2/games/tour_film.js가 장면을 짠다.
export function createFilm(env) {
  const { THREE, camera, renderer, scene, setCam, setView, tone } = env;
  const V = new THREE.Vector3(), Vp = new THREE.Vector3(), Vl = new THREE.Vector3();
  const muted = () => { try { return JSON.parse(localStorage.getItem('sm2.title.mute') || 'false'); } catch (e) { return false; } };
  const setMuted = v => { try { localStorage.setItem('sm2.title.mute', JSON.stringify(!!v)); } catch (e) { /* 비공개 창 */ } };
  const snd = (f, t0, d, ty, v, e) => { if (!muted()) tone(f, t0, d, ty, v, e); };
  const SFX = {
    boom: () => { snd(70, 0, 1.6, 'sine', 0.42, 34); snd(140, 0, 0.5, 'triangle', 0.12, 60); },
    whoosh: () => { snd(180, 0, 0.55, 'sine', 0.13, 1300); snd(2200, 0.18, 0.3, 'sine', 0.03, 900); },
    tick: () => snd(1760, 0, 0.05, 'triangle', 0.05),
    pop: () => { snd(660, 0, 0.12, 'triangle', 0.1, 990); },
    off: () => { snd(880, 0, 0.18, 'square', 0.05, 220); snd(120, 0.12, 0.25, 'sine', 0.12, 60); },
    on: () => [523, 659, 784].forEach((f, i) => snd(f, i * 0.09, 0.5, 'triangle', 0.13)),
    bell: () => { snd(1568, 0, 1.4, 'sine', 0.08); snd(2093, 0.02, 1.2, 'sine', 0.05); },
    rise: () => [392, 494, 587, 784].forEach((f, i) => snd(f, i * 0.16, 0.9, 'triangle', 0.1)),
  };
  // 배경 화음(장면마다 하나 — 길게 사라지는 세 음) · 이름 = 근음
  const CH = { C: [261.6, 329.6, 392.0], Am: [220.0, 261.6, 329.6], F: [174.6, 220.0, 261.6], G: [196.0, 246.9, 293.7], Em: [164.8, 196.0, 246.9], Dm: [146.8, 174.6, 220.0] };
  // 배경 음악(FILM-2): 100bpm — 북(박) · 잔 소리(엇박) · 아르페지오(8분) · 베이스(마디) — 지금 장면의 화음을 따른다(장면마다 chord)
  const BEAT = 0.6;
  function music(c) {
    const s = c.s; if (!s || c.hold) return;
    const k = s.chord || c.lastCh; if (s.chord) c.lastCh = s.chord; const ch = CH[k]; if (!ch || s.black) { c.mb = Math.ceil(c.t / BEAT); return; }
    while (c.mb * BEAT < c.t + 0.25) { const dl = Math.max(0, c.mb * BEAT - c.t), b = c.mb;
      snd(104, dl, 0.34, 'sine', b % 4 === 0 ? 0.26 : 0.17, 44);
      snd(7200, dl + BEAT / 2, 0.025, 'triangle', 0.012);
      const ar = [ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 2]; snd(ar[(b * 2) % 4], dl, 0.24, 'triangle', 0.032); snd(ar[(b * 2 + 1) % 4], dl + BEAT / 2, 0.24, 'triangle', 0.028);
      if (b % 4 === 0) snd(ch[0] / 2, dl, BEAT * 3.6, 'sine', 0.11);
      c.mb++; }
  }
  const chord = (k, dur) => { const c = CH[k]; if (!c) return; c.forEach((f, i) => snd(f, i * 0.03, Math.min(6, dur + 1), 'triangle', 0.055)); snd(c[0] / 2, 0, Math.min(6, dur + 1), 'sine', 0.09); };

  // ---------- 모양(한 번) ----------
  const css = document.createElement('style'); css.textContent = `
#film{--ff:'Pretendard','Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif;position:fixed;inset:0;z-index:9000;pointer-events:auto;font-family:var(--ff);color:#fff;--lb:clamp(28px,calc((100vh - 100vw / 2.25) / 2),13vh);overflow:hidden;-webkit-user-select:none;user-select:none}
#film .fl-bar{position:absolute;left:0;right:0;height:var(--lb);background:#05070d;transition:transform .9s cubic-bezier(.7,0,.2,1);z-index:5}
#film .fl-bar.t{top:0;transform:translateY(-100%)} #film .fl-bar.b{bottom:0;transform:translateY(100%)}
#film.bars .fl-bar{transform:none}
#film .fl-black{position:absolute;inset:0;background:#05070d;opacity:1;transition:opacity .6s ease;z-index:4;pointer-events:none}
#film .fl-black.clear{opacity:0}
#film .fl-stage{position:absolute;left:0;right:0;top:var(--lb);bottom:var(--lb);z-index:6;pointer-events:none;background:radial-gradient(ellipse 80% 90% at 50% 50%,transparent 45%,rgba(5,8,16,.42) 100%)}
#film .kick{text-shadow:0 2px 10px rgba(0,0,0,.75)}
#film .fl-ctl{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(8px,calc((var(--lb) - 36px) / 2));z-index:8;display:flex;gap:8px;pointer-events:auto}
#film .fl-ctl button{font:700 clamp(12px,1.5vw,15px)/1 var(--ff);color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:9px 14px;min-height:36px;cursor:pointer;backdrop-filter:blur(6px)}
#film .fl-ctl button:hover{background:rgba(255,255,255,.24)}
#film .fl-prog{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,#ffd23c,#ff7a59);z-index:8;width:0}
#film .fl-brand{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(8px,calc((var(--lb) - 20px) / 2));z-index:8;font:800 clamp(12px,1.3vw,14px)/1.2 var(--ff);letter-spacing:.14em;color:rgba(255,255,255,.62)}
#film .fl-u{position:absolute;opacity:0;transition:opacity .5s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
#film .fl-u.in{opacity:1} #film .fl-u.out{opacity:0!important;transition:opacity .45s ease}
#film .ln{display:block;overflow:hidden;padding:.06em 0}
#film .ln>span{display:inline-block;transform:translateY(110%);transition:transform .8s cubic-bezier(.2,.9,.2,1)}
#film .fl-u.in .ln>span{transform:none}
#film .kick{font:800 clamp(12px,1.35vw,16px)/1 var(--ff);letter-spacing:.32em;color:#ffd23c;display:flex;align-items:center;gap:12px}
#film .kick:before{content:'';width:34px;height:2px;background:#ffd23c;display:inline-block}
#film .h1{font:900 clamp(30px,6.2vw,88px)/1.04 var(--ff);letter-spacing:-.02em;text-shadow:0 4px 30px rgba(0,0,0,.45)}
#film .h2{font:900 clamp(22px,3.6vw,52px)/1.12 var(--ff);letter-spacing:-.01em;text-shadow:0 3px 22px rgba(0,0,0,.5)}
#film .p{font:600 clamp(14px,1.7vw,21px)/1.5 var(--ff);color:rgba(255,255,255,.92);text-shadow:0 2px 12px rgba(0,0,0,.6)}
#film .glass{background:linear-gradient(135deg,rgba(14,26,52,.78),rgba(14,26,52,.55));border:1px solid rgba(255,255,255,.16);border-radius:18px;backdrop-filter:blur(10px);box-shadow:0 18px 50px rgba(0,0,0,.35)}
/* 첫 장면 — 폰 끄기 → RAS 켜기 */
#film .lock{left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:min(92vw,900px)}
#film .lock .ph{width:clamp(54px,7vw,84px);height:clamp(92px,12vw,144px);margin:0 auto 18px;border:4px solid #fff;border-radius:16px;position:relative;transition:opacity .5s .2s,transform .5s .2s}
#film .lock .ph:after{content:'';position:absolute;inset:8px 6px 16px;border-radius:6px;background:linear-gradient(160deg,#7cc4ff,#4d6bff);transition:transform .35s cubic-bezier(.7,0,.3,1),opacity .2s .3s}
#film .lock .ph:before{content:'';position:absolute;left:50%;bottom:5px;width:14px;height:4px;margin-left:-7px;border-radius:2px;background:#fff}
#film .lock.off .ph:after{transform:scaleY(.02);opacity:0} #film .lock.gone .ph{opacity:0;transform:scale(.6)}
#film .lock .w1{font:900 clamp(36px,7.6vw,108px)/1 var(--ff);letter-spacing:-.02em;opacity:0;transform:translateY(20px);transition:all .7s cubic-bezier(.2,.8,.2,1)}
#film .lock.off .w1{opacity:1;transform:none}
#film .lock .dots{display:flex;justify-content:center;gap:clamp(12px,2.4vw,34px);margin:22px 0 38px}
#film .lock .dot{width:clamp(64px,9vw,120px);height:clamp(64px,9vw,120px);border-radius:50%;display:grid;place-items:center;font:900 clamp(28px,4.6vw,62px)/1 var(--ff);border:3px solid rgba(255,255,255,.25);color:rgba(255,255,255,.25);transition:all .45s cubic-bezier(.2,.9,.3,1.4)}
#film .lock .dot.on{color:#fff;border-color:transparent;transform:scale(1.08);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 0 40px var(--c)}
#film .lock .dot{position:relative;line-height:1}
#film .lock .dot small{position:absolute;left:50%;top:calc(100% + 10px);transform:translateX(-50%);white-space:nowrap;font:800 clamp(10px,1.1vw,13px)/1 var(--ff);letter-spacing:.14em;color:rgba(255,255,255,.4);transition:color .4s}
#film .lock .dot.on small{color:rgba(255,255,255,.9)}
#film .lock .w2{font:900 clamp(30px,6vw,84px)/1 var(--ff);color:#ffd23c;opacity:0;transform:scale(.8);transition:all .6s cubic-bezier(.2,.9,.3,1.5)}
#film .lock.ras .w2{opacity:1;transform:none}
#film .lock .sub{margin-top:16px;font:700 clamp(13px,1.6vw,19px)/1.4 var(--ff);letter-spacing:.08em;color:rgba(255,255,255,.75);opacity:0;transition:opacity .8s .3s}
#film .lock.ras .sub{opacity:1}
/* 3D에 붙은 이름표 */
#film .tag{position:absolute;transform:translate(-50%,-100%);pointer-events:none;opacity:0;transition:opacity .4s}
#film .tag.in{opacity:1}
#film .tag b{display:block;white-space:nowrap;font:800 clamp(12px,1.35vw,16px)/1 var(--ff);background:#fff;color:#10213f;padding:7px 11px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#film .tag i{display:block;width:2px;height:clamp(18px,3.4vh,36px);margin:0 auto;background:linear-gradient(#fff,rgba(255,255,255,.2))}
#film .tag s{display:block;width:10px;height:10px;margin:-2px auto 0;border-radius:50%;background:#ffd23c;box-shadow:0 0 0 4px rgba(255,210,60,.35)}
/* 숫자 카드 */
#film .stats{right:clamp(14px,3vw,48px);top:50%;transform:translate(30px,-50%);width:min(560px,56vw);display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,1.2vw,14px)}
#film .stats.in{transform:translate(0,-50%)}
#film .stats .hd{grid-column:1/-1;margin-bottom:4px}
#film .st{padding:clamp(10px,1.4vw,18px);opacity:0;transform:translateY(16px) scale(.96);transition:all .55s cubic-bezier(.2,.9,.3,1.3)}
#film .st.in{opacity:1;transform:none}
#film .st .n{font:900 clamp(24px,3.6vw,50px)/1 var(--ff);letter-spacing:-.02em;color:#ffd23c;white-space:nowrap}
#film .st .n u{text-decoration:none;font-size:.5em;margin-left:3px;color:#ffd23c;font-weight:800}
#film .st .c{margin-top:6px;font:700 clamp(11px,1.15vw,14.5px)/1.35 var(--ff);color:rgba(255,255,255,.88)}
/* 갈래(R·A·S·AI·생태) */
#film .chap{left:clamp(16px,4vw,64px);top:50%;transform:translate(-30px,-50%);width:min(560px,58vw)}
#film .chap.in{transform:translate(0,-50%)}
#film .chap .big{font:900 clamp(80px,15vw,210px)/.82 var(--ff);letter-spacing:-.04em;color:var(--c);text-shadow:0 10px 40px rgba(0,0,0,.35);display:flex;align-items:flex-end;gap:14px}
#film .chap .big small{font:900 clamp(18px,2.8vw,40px)/1 var(--ff);color:#fff;letter-spacing:.02em;margin-bottom:.5em}
#film .chap ul{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:8px}
#film .chap li{font:700 clamp(13px,1.55vw,19px)/1.35 var(--ff);padding:9px 14px 9px 38px;position:relative;opacity:0;transform:translateX(-14px);transition:all .5s cubic-bezier(.2,.9,.2,1)}
#film .chap li.in{opacity:1;transform:none}
#film .chap li:before{content:'';position:absolute;left:14px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:var(--c)}
/* 영상 조각 */
#film .clip{right:clamp(14px,3vw,48px);bottom:clamp(10px,3vh,34px);width:min(40vw,500px);padding:8px;transform:translateY(18px)}
#film .clip.in{transform:none}
#film .clip .fr{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000 center/cover no-repeat}
#film .clip iframe{position:absolute;left:-12%;top:-12%;width:124%;height:124%;border:0;pointer-events:none}   
#film .clip .cap{display:flex;align-items:center;gap:8px;padding:8px 4px 2px;font:700 clamp(11px,1.15vw,14px)/1.3 var(--ff);color:rgba(255,255,255,.9)}
#film .clip .cap:before{content:'▶';font-size:10px;background:#ff3d3d;border-radius:4px;padding:3px 5px;line-height:1}
/* 아래 글 · 가운데 글 */
#film .lower{left:clamp(16px,4vw,64px);bottom:clamp(14px,4vh,40px);max-width:min(760px,70vw)}
#film .center{left:50%;top:50%;transform:translate(-50%,-46%);text-align:center;width:min(94vw,1100px)}
#film .center.in{transform:translate(-50%,-50%)}
/* 도장 고리 */
#film .stamps{left:50%;top:50%;transform:translate(-50%,-50%);text-align:center}
#film .stamps .ring{position:relative;width:clamp(220px,34vw,400px);height:clamp(220px,34vw,400px);margin:0 auto}
#film .stamps .sp{position:absolute;left:50%;top:50%;width:clamp(36px,5vw,58px);height:clamp(36px,5vw,58px);margin:calc(clamp(36px,5vw,58px) / -2);display:grid;place-items:center;font-size:clamp(18px,2.6vw,30px);background:#fff;border-radius:50%;box-shadow:0 6px 18px rgba(0,0,0,.3);opacity:0;transform:translate(0,0) scale(.2);transition:all .6s cubic-bezier(.2,.9,.3,1.4)}
#film .stamps .mid{position:absolute;inset:0;display:grid;place-items:center;align-content:center}
#film .stamps .mid b{font:900 clamp(40px,7vw,96px)/1 var(--ff);color:#ffd23c}
#film .stamps .mid span{font:800 clamp(13px,1.6vw,19px)/1.3 var(--ff)}
/* 끝 화면 */
#film .endc{left:50%;top:50%;transform:translate(-50%,-46%);width:min(94vw,820px);text-align:center;padding:clamp(18px,3vw,36px)}
#film .endc.in{transform:translate(-50%,-50%)}
#film .endc .row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px;pointer-events:auto}
#film .endc button{font:800 clamp(13px,1.5vw,17px)/1 var(--ff);border:0;border-radius:999px;padding:13px 20px;min-height:44px;cursor:pointer;background:#fff;color:#10213f}
#film .endc button.pri{background:#ffd23c}
#film .endc .ct{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;margin-top:14px;font:700 clamp(13px,1.55vw,18px)/1.4 var(--ff)}
#film .endc .ct b{color:#ffd23c}
@media (max-aspect-ratio:1/1){#film .stats{left:12px;right:12px;width:auto;top:auto;bottom:8px;transform:translateY(20px)}#film .stats.in{transform:none}#film .chap{width:auto;right:12px}#film .clip{width:min(70vw,360px);bottom:8px}}
@media (max-height:520px){#film .lock .ph{width:34px;height:58px;margin-bottom:8px;border-width:3px;border-radius:10px}#film .lock .ph:after{inset:5px 4px 11px}#film .lock .w1{font-size:13vh}#film .lock .dot{width:17vh;height:17vh;font-size:8vh}#film .lock .dots{margin:10px 0 26px}#film .lock .w2{font-size:12vh}#film .lock .sub{margin-top:8px}#film .stats{grid-template-columns:1fr 1fr 1fr;width:min(720px,70vw)}#film .chap .big{font-size:clamp(56px,11vw,120px)}#film .clip{width:min(32vw,300px)}}
body.film-on>:not(#film):not(#scene){visibility:hidden!important}
body.film-on #scene{filter:saturate(1.14) contrast(1.06)}
#scene.fl-punch{animation:flpunch .6s cubic-bezier(.2,.8,.2,1)}
@keyframes flpunch{0%{transform:scale(1.08);filter:blur(3px) saturate(1.14) contrast(1.06)}100%{transform:none;filter:saturate(1.14) contrast(1.06)}}
#film .fl-flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:4;pointer-events:none}
/* 갈래 순서(01/05) */
#film .chn{left:clamp(16px,4vw,64px);top:clamp(10px,2.6vh,24px);display:flex;flex-wrap:wrap;gap:6px;align-items:center;transform:translateY(-8px)}
#film .chn.in{transform:none}
#film .chn .no{font:900 clamp(12px,1.35vw,16px)/1 var(--ff);color:#ffd23c;margin-right:6px;letter-spacing:.12em}
#film .chn span{font:800 clamp(11px,1.1vw,13px)/1 var(--ff);padding:6px 10px;border-radius:999px;background:rgba(10,18,36,.55);color:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.14)}
#film .chn span.on{background:var(--c);color:#fff;border-color:transparent;box-shadow:0 0 18px var(--c)}
#film .chn span.done{color:rgba(255,255,255,.9)}
/* 큰 배경 글자 */
#film .ghost{position:absolute;right:-2vw;bottom:-6vh;font:900 clamp(160px,34vw,520px)/.8 var(--ff);color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.16);letter-spacing:-.05em;pointer-events:none;opacity:0;transform:translateX(40px);transition:opacity 1.2s,transform 6s linear}
#film .ghost.in{opacity:1;transform:translateX(-40px)}
/* 지도 길 */
#film svg.route{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}
#film svg.route path{fill:none;stroke-linecap:round;stroke-linejoin:round}
#film svg.route .bg{stroke:rgba(10,18,36,.55);stroke-width:9}
#film svg.route .fg{stroke:#ffd23c;stroke-width:4.5;filter:drop-shadow(0 0 6px rgba(255,210,60,.8))}
#film .pin{position:absolute;transform:translate(-50%,-100%) scale(.3);opacity:0;transition:transform .45s cubic-bezier(.2,.9,.3,1.6),opacity .3s;pointer-events:none;text-align:center}
#film .pin.in{opacity:1;transform:translate(-50%,-100%) scale(1)}
#film .pin i{display:grid;place-items:center;width:clamp(30px,3.4vw,44px);height:clamp(30px,3.4vw,44px);margin:0 auto;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.35)}
#film .pin i em{transform:rotate(45deg);font-style:normal;font-size:clamp(15px,1.8vw,22px)}
#film .pin b{display:block;margin-top:4px;white-space:nowrap;font:800 clamp(11px,1.15vw,14px)/1 var(--ff);background:rgba(10,18,36,.78);padding:5px 8px;border-radius:999px}
/* 막대그래프 */
#film .bars{right:clamp(14px,3vw,48px);top:50%;transform:translate(30px,-50%);width:min(560px,54vw);padding:clamp(14px,1.8vw,24px)}
#film .bars.in{transform:translate(0,-50%)}
#film .bars .br{display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;align-items:center;gap:10px;margin-top:clamp(5px,.8vh,9px);opacity:0;transform:translateX(12px);transition:all .45s ease}
#film .bars .br.in{opacity:1;transform:none}
#film .bars .br span{font:700 clamp(11px,1.15vw,14px)/1.2 var(--ff);color:rgba(255,255,255,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#film .bars .tr{height:clamp(10px,1.3vh,14px);border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
#film .bars .tr i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--c1),var(--c2));transition:width 1.1s cubic-bezier(.2,.9,.2,1)}
#film .bars .br b{font:900 clamp(12px,1.3vw,16px)/1 var(--ff);color:#ffd23c;min-width:4.6em;text-align:right}
#film .st .ic{float:right;font-size:clamp(18px,2.2vw,28px);line-height:1;opacity:.95}
@media (max-height:520px){#film .bars .br{margin-top:3px}#film .bars{width:min(620px,60vw)}#film .chn{display:none}}
`;
  document.head.appendChild(css);

  // ---------- 지붕 벗기기(로컬 자르기 면 다섯 = y 위 & 상자 안만 잘림 · clipIntersection) ----------
  const PL = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
  const cutSet = c => { if (!c) { PL[0].constant = -1e5; PL[1].constant = 1e5; PL[2].constant = -1e5 - 1; PL[3].constant = 1e5; PL[4].constant = -1e5 - 1; return; }   // 잘 곳 없음(상자를 멀리)
    PL[0].constant = c.y; PL[1].constant = c.box[0]; PL[2].constant = -c.box[2]; PL[3].constant = c.box[1]; PL[4].constant = -c.box[3]; };
  let mats = null;
  function cutOn() {
    if (mats) return; mats = []; const seen = new Set();
    scene.traverse(o => { if (!o.isMesh || !o.material) return; const g = o.geometry; if (g && g.boundingSphere && g.boundingSphere.radius > 400) return;   // 하늘·먼 땅은 두기
      for (const m of [].concat(o.material)) { if (seen.has(m)) continue; seen.add(m); mats.push([m, m.clippingPlanes, m.clipIntersection]); m.clippingPlanes = PL; m.clipIntersection = true; m.needsUpdate = true; } });
    renderer.localClippingEnabled = true; cutSet(null);
    try { renderer.compile(scene, camera); } catch (e) { /* 다음 그림에서 */ }   // 셰이더를 검은 화면 동안 미리(장면마다 자르는 면 수가 같아 다시 짓지 않음)
  }
  let caps = null;
  const capMat = new THREE.MeshBasicMaterial({ color: 0x2c313b });
  function capsSet(c9) {
    if (caps) { scene.remove(caps); caps.geometry.dispose(); caps = null; }
    const B = env.world && env.world.allBoxes; if (!c9 || !B) return;
    const [bx0, bz0, bx1, bz1] = c9.box, y = c9.y, L = [];
    for (const b of B) { if (b.y0 >= y || b.y1 <= y) continue; const x0 = Math.max(b.x0, bx0), x1 = Math.min(b.x1, bx1), z0 = Math.max(b.z0, bz0), z1 = Math.min(b.z1, bz1); if (x1 - x0 > 0.01 && z1 - z0 > 0.01) L.push([x0, x1, z0, z1]); }
    if (!L.length) return;
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m = new THREE.InstancedMesh(g, capMat, L.length), M4 = new THREE.Matrix4();
    L.forEach(([x0, x1, z0, z1], k) => { M4.makeScale(x1 - x0, 1, z1 - z0).setPosition((x0 + x1) / 2, y - 0.004, (z0 + z1) / 2); m.setMatrixAt(k, M4); });
    m.frustumCulled = false; m.renderOrder = 1; scene.add(m); caps = m;   // 같은 색끼리 겹치는 곳(모서리)은 싸워도 보이지 않는다
  }
  function cutOff() { capsSet(null); if (!mats) return; for (const [m, cp, ci] of mats) { m.clippingPlanes = cp; m.clipIntersection = ci; m.needsUpdate = true; } mats = null; renderer.localClippingEnabled = false; }

  // ---------- 재생 ----------
  let cur = null;
  const el = (tag, cls, html, p) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; if (p) p.appendChild(d); return d; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lines = (txt, cls) => String(txt).split('\n').map((l, i) => '<span class="ln"><span style="transition-delay:' + (i * 0.12).toFixed(2) + 's">' + esc(l) + '</span></span>').join('');
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeIO = x => x * x * (3 - 2 * x);

  function play(shots, o = {}) {
    if (cur) stop('replace');
    return new Promise(res => {
      const root = el('div', 'ttl-keep', null, document.body); root.id = 'film';   // ttl-keep = 오프닝 화면(title.css)이 숨기지 않게
      el('div', 'fl-bar t', null, root); el('div', 'fl-bar b', null, root);
      const black = el('div', 'fl-black', null, root), flash = el('div', 'fl-flash', null, root), stage = el('div', 'fl-stage', null, root), prog = el('div', 'fl-prog', null, root);
      el('div', 'fl-brand', esc(o.brand || ''), root);
      const ctl = el('div', 'fl-ctl', null, root);
      const mB = el('button', '', '', ctl); mB.type = 'button'; const paintM = () => { mB.textContent = muted() ? '🔇' : '🔊'; }; paintM();
      mB.addEventListener('click', e => { e.stopPropagation(); setMuted(!muted()); paintM(); });
      const sB = el('button', '', esc(o.skipText || '건너뛰기 ⏭'), ctl); sB.type = 'button';
      sB.addEventListener('click', e => { e.stopPropagation(); finish('skip'); });
      const onKey = e => { if (!cur) return; if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish('skip'); return; }
        if (cur.endc && (e.code === 'Enter' || e.code === 'NumpadEnter')) { e.preventDefault(); e.stopImmediatePropagation(); const b = cur.endc.querySelector('button.pri'); if (b) b.click(); return; }
        e.stopImmediatePropagation(); };   // 영상 동안 게임 키는 막는다
      addEventListener('keydown', onKey, true);
      try { document.exitPointerLock && document.pointerLockElement && document.exitPointerLock(); } catch (e) { /* */ }
      document.body.classList.add('film-on');
      const T = shots.reduce((a, s) => a + (s.dur || 0), 0);
      cur = { shots, i: -1, t: 0, st: 0, mb: 0, lastCh: null, T, res, o, root, black, flash, stage, prog, onKey, tags: [], ui: [], extra: [], clip: null, last: performance.now(), done: false, prevTime: env.getTime ? env.getTime() : null, fov0: camera.fov, near0: camera.near, far0: camera.far };
      if (shots.some(s => s.cut)) cutOn();
      setView && setView({ far: 420 });
      void root.offsetWidth; requestAnimationFrame(() => { if (cur && cur.root === root) root.classList.add('bars'); });
      setCam(camF);
    });
  }
  function enter(i) {
    const c = cur, s = c.shots[i]; c.i = i; c.st = 0; c.s = s;
    for (const u of c.ui) u.el.remove(); c.ui.length = 0; for (const t of c.tags) t.el.remove(); c.tags.length = 0; for (const e of c.extra) e.remove(); c.extra.length = 0;
    if (c.clip) { c.clip.remove(); c.clip = null; }
    if (s.time && env.setTime) env.setTime(s.time);
    if (s.cut !== undefined || mats) { cutSet(s.cut || null); capsSet(s.cut || null); }
    c.black.classList.toggle('clear', !s.black);
    const tr = s.tr || (s.fadeIn ? 'fade' : i > 0 && !s.black ? 'dip' : 'none');   // FILM-2 전환: fade(0.6초) · dip(짧게 어두워짐) · flash(흰 번쩍 + 줌 펀치)
    if (tr === 'fade' || tr === 'dip') { const b = c.black; b.classList.remove('clear'); b.style.transition = 'none'; b.style.opacity = tr === 'dip' ? '0.85' : ''; void b.offsetWidth;
      b.style.transition = tr === 'dip' ? 'opacity .32s ease' : ''; requestAnimationFrame(() => { b.style.opacity = ''; b.classList.add('clear'); }); }
    if (tr === 'flash') { const f = c.flash; f.style.transition = 'none'; f.style.opacity = '0.6'; void f.offsetWidth; f.style.transition = 'opacity .45s ease'; requestAnimationFrame(() => { f.style.opacity = '0'; });
      const cv = document.getElementById('scene'); if (cv) { cv.classList.remove('fl-punch'); void cv.offsetWidth; cv.classList.add('fl-punch'); } }
    if (s.chord) chord(s.chord, s.dur);
    c.sfx = (s.sfx || []).map(([t, k]) => ({ t, k, done: false }));
    c.pending = (s.ui || []).map(u => ({ u, done: false, out: false }));
    c.camP = s.cam && s.cam.p.length > 1 ? new THREE.CatmullRomCurve3(s.cam.p.map(a => new THREE.Vector3(a[0], a[1], a[2])), false, 'centripetal') : null;
    c.camL = s.cam && s.cam.l.length > 1 ? new THREE.CatmullRomCurve3(s.cam.l.map(a => new THREE.Vector3(a[0], a[1], a[2])), false, 'centripetal') : null;
    if (s.cam && s.cam.p.length === 1) { c.p1 = s.cam.p[0]; c.l1 = s.cam.l[0]; } else c.p1 = c.l1 = null;
    for (const t of s.tags || []) { const d = el('div', 'tag', '<b>' + esc(t.t) + '</b><i></i><s></s>', c.stage); c.tags.push({ el: d, p: t.p, at: t.at || 0, on: false }); }
    if (s.clip && s.clip.id) {
      const d = el('div', 'fl-u clip glass', null, c.stage), fr = el('div', 'fr', null, d);
      fr.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + encodeURIComponent(s.clip.id) + '/hqdefault.jpg)';
      const at = (s.clip.at || 0.6) * 1000;
      setTimeout(() => { if (!cur || cur.clip !== d) return; d.classList.add('in');
        const f = document.createElement('iframe'); f.allow = 'autoplay; encrypted-media'; f.setAttribute('allowfullscreen', ''); f.title = s.clip.title || '';
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(s.clip.id) + '?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&cc_load_policy=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin) + '&start=' + (s.clip.start | 0) + (s.clip.end ? '&end=' + (s.clip.end | 0) : '');
        f.addEventListener('load', () => [400, 1200, 2500, 4500].forEach(t => setTimeout(() => { if (f.isConnected) for (const m of ['captions', 'cc']) try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: [m] }), '*'); } catch (e) { /* */ } }, t)));   // 자동 자막 끄기(10-04 교사 — 영상에 자막이 박혀 있음)
        fr.appendChild(f); }, at);
      el('div', 'cap', esc(s.clip.title || '정림초 유튜브'), d); c.clip = d;
    }
  }
  function makeUI(u) {   // 화면 글 한 덩이
    const c = cur; let d;
    if (u.type === 'lock') {   // 폰 끄기 → RAS 켜기
      d = el('div', 'fl-u lock', '<div class="ph"></div><div class="w1">' + esc(u.w1 || 'Phone Off,') + '</div>'
        + '<div class="dots">' + (u.dots || []).map(x => '<div class="dot" style="--c:' + x.c + ';background:transparent">' + esc(x.k) + '<small>' + esc(x.w) + '</small></div>').join('') + '</div>'
        + '<div class="w2">' + esc(u.w2 || 'RAS On!') + '</div><div class="sub">' + esc(u.sub || '') + '</div>', c.stage);
      const L = u.dots || [], D = () => d.querySelectorAll('.dot');
      d._steps = [[0.9, () => { d.classList.add('off'); SFX.off(); }], [1.6, () => d.classList.add('gone')],
        ...L.map((x, k) => [2.0 + k * 0.42, () => { const e = D()[k]; e.classList.add('on'); e.style.background = x.c; snd([523, 659, 784][k % 3], 0, 0.5, 'triangle', 0.13); }]),
        [2.1 + L.length * 0.42, () => { d.classList.add('ras'); SFX.boom(); }]];
    } else if (u.type === 'stats') {
      d = el('div', 'fl-u stats', (u.kick ? '<div class="hd"><div class="kick">' + esc(u.kick) + '</div>' + (u.title ? '<div class="h2" style="margin-top:8px">' + esc(u.title) + '</div>' : '') + '</div>' : ''), c.stage);
      d._n = []; (u.items || []).forEach((it, k) => { const s = el('div', 'st glass', (it.i ? '<span class="ic">' + esc(it.i) + '</span>' : '') + '<div class="n"><span></span><u>' + esc(it.u || '') + '</u></div><div class="c">' + esc(it.c || '') + '</div>', d);
        const num = String(it.n).match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/), sp = s.querySelector('.n span');
        if (num) d._n.push({ sp, pre: num[1], v: +num[2], dec: (num[2].split('.')[1] || '').length, post: num[3], t0: 0.35 + k * 0.32 }); else sp.textContent = it.n;
        setTimeout(() => { s.classList.add('in'); SFX.pop(); }, (0.3 + k * 0.32) * 1000); });
    } else if (u.type === 'chap') {
      d = el('div', 'fl-u chap', '<div class="big" style="--c:' + esc(u.c || '#ffd23c') + '">' + esc(u.big) + (u.word ? '<small>' + esc(u.word) + '</small>' : '') + '</div>'
        + (u.title ? '<div class="h2" style="margin-top:10px">' + lines(u.title) + '</div>' : '') + '<ul style="--c:' + esc(u.c || '#ffd23c') + '">' + (u.items || []).map(x => '<li class="glass">' + esc(x) + '</li>').join('') + '</ul>', c.stage);
      d.style.setProperty('--c', u.c || '#ffd23c');
      if (u.ghost !== false) { const g = el('div', 'ghost', esc(u.ghostText || u.big), c.stage); requestAnimationFrame(() => g.classList.add('in')); c.extra.push(g); }
      d.querySelectorAll('li').forEach((li, k) => setTimeout(() => li.classList.add('in'), (0.55 + k * 0.28) * 1000));
    } else if (u.type === 'chn') {   // 갈래 순서(01/05 · 지금 갈래 강조)
      d = el('div', 'fl-u chn', '<span class="no">' + String(u.i + 1).padStart(2, '0') + ' / ' + String(u.items.length).padStart(2, '0') + '</span>'
        + u.items.map((x, k) => '<span class="' + (k === u.i ? 'on' : k < u.i ? 'done' : '') + '" style="--c:' + esc(x.c || '#ffd23c') + '">' + esc(x.t) + '</span>').join(''), c.stage);
    } else if (u.type === 'route') {   // 지도 위 길 + 장소 핀(3D 자리를 매 프레임 화면에 맞춤)
      d = el('div', 'fl-u', null, c.stage); d.style.inset = '0';
      d.innerHTML = '<svg class="route"><path class="bg"/><path class="fg"/></svg>' + (u.kick || u.title ? '<div class="fl-u lower in" style="position:absolute">' + (u.kick ? '<div class="kick">' + esc(u.kick) + '</div>' : '') + (u.title ? '<div class="h2" style="margin-top:8px">' + lines(u.title) + '</div>' : '') + '</div>' : '');
      d._route = { pts: u.pts || [], dur: u.draw || 4.5, pins: (u.pts || []).map(q => { const e = el('div', 'pin', '<i><em>' + esc(q.i || '📍') + '</em></i><b>' + esc(q.t || '') + '</b>', d); return { e, on: false }; }), bg: d.querySelector('.bg'), fg: d.querySelector('.fg') };
    } else if (u.type === 'bars') {   // 막대그래프(값이 0부터 자람)
      const mx = Math.max(1, ...(u.items || []).map(x => +x.v || 0));
      d = el('div', 'fl-u bars glass', (u.kick ? '<div class="kick">' + esc(u.kick) + '</div>' : '') + (u.title ? '<div class="h2" style="margin-top:8px;margin-bottom:6px">' + esc(u.title) + '</div>' : ''), c.stage);
      d._n = []; (u.items || []).forEach((x, k) => { const r = el('div', 'br', '<span>' + esc(x.t) + '</span><div class="tr"><i style="--c1:' + esc(u.c1 || '#4dabf7') + ';--c2:' + esc(u.c2 || '#9b8cff') + '"></i></div><b></b>', d);
        const t0 = 0.4 + k * 0.17; d._n.push({ sp: r.querySelector('b'), pre: '', v: +x.v || 0, dec: 0, post: u.unit || '', t0 });
        setTimeout(() => { r.classList.add('in'); r.querySelector('i').style.width = ((+x.v || 0) / mx * 100).toFixed(1) + '%'; if (k % 2 === 0) SFX.tick(); }, t0 * 1000); });
    } else if (u.type === 'stamps') {
      const n = (u.icons || []).length;
      d = el('div', 'fl-u stamps', '<div class="ring">' + (u.icons || []).map(x => '<div class="sp">' + esc(x) + '</div>').join('') + '<div class="mid"><b>' + esc(u.big || n) + '</b><span>' + esc(u.cap || '') + '</span></div></div>', c.stage);
      const R = () => d.querySelector('.ring').offsetWidth / 2 * 0.86;
      d.querySelectorAll('.sp').forEach((sp, k) => setTimeout(() => { const a = -Math.PI / 2 + k / Math.max(1, n) * Math.PI * 2, r = R();
        sp.style.opacity = '1'; sp.style.transform = 'translate(' + (Math.cos(a) * r).toFixed(1) + 'px,' + (Math.sin(a) * r).toFixed(1) + 'px) scale(1)'; SFX.tick(); }, (0.25 + k * 0.12) * 1000));
    } else if (u.type === 'end') {
      d = el('div', 'fl-u endc glass', (u.kick ? '<div class="kick" style="justify-content:center">' + esc(u.kick) + '</div>' : '') + '<div class="h1" style="margin-top:10px">' + lines(u.title || '') + '</div>'
        + (u.sub ? '<div class="p" style="margin-top:10px">' + lines(u.sub) + '</div>' : '') + (u.contact ? '<div class="ct">' + u.contact.map(x => '<span>' + (x.b ? '<b>' + esc(x.b) + '</b> ' : '') + esc(x.t) + '</span>').join('') + '</div>' : '')
        + '<div class="row"></div>', c.stage);
      const row = d.querySelector('.row'); (u.buttons || []).forEach((b, k) => { const B = el('button', k === 0 ? 'pri' : '', esc(b.t), row); B.type = 'button'; B.addEventListener('click', e => { e.stopPropagation(); finish(b.k); }); });
      c.endc = d; c.hold = true;
    } else {   // 글: kick / title(h1|h2) / text(p) — 자리 = lower | center | left
      d = el('div', 'fl-u ' + (u.pos || 'lower'), (u.kick ? '<div class="kick"' + (u.pos === 'center' ? ' style="justify-content:center"' : '') + '>' + esc(u.kick) + '</div>' : '')
        + (u.title ? '<div class="' + (u.size === 'h2' ? 'h2' : 'h1') + '" style="margin-top:' + (u.kick ? 10 : 0) + 'px' + (u.color ? ';color:' + esc(u.color) : '') + '">' + lines(u.title) + '</div>' : '')
        + (u.text ? '<div class="p" style="margin-top:10px">' + lines(u.text) + '</div>' : ''), c.stage);
    }
    requestAnimationFrame(() => d.classList.add('in'));
    if (u.sfx && SFX[u.sfx]) SFX[u.sfx]();
    return d;
  }
  function camF(dt) {   // main.js step()이 평소 카메라를 정한 뒤 부른다 — 시계·카메라·글을 한 번에
    const c = cur; if (!c) return;
    const now = performance.now(), d9 = Math.min(0.1, (now - c.last) / 1000); c.last = now;
    if (c.i < 0) enter(0);
    if (!c.hold) { c.t += d9; c.st += d9; }
    let s = c.s;
    if (!c.hold && c.st >= (s.dur || 0)) { if (c.i + 1 < c.shots.length) { enter(c.i + 1); s = c.s; } else { finish('end'); return; } }
    const f = Math.min(1, c.st / Math.max(0.01, s.dur || 1)), e = s.lin ? f : easeIO(f);
    if (c.camP) { c.camP.getPoint(e, Vp); c.camL.getPoint(e, Vl); camera.position.copy(Vp); camera.lookAt(Vl); }
    else if (c.p1) { camera.position.set(c.p1[0], c.p1[1], c.p1[2]); camera.lookAt(c.l1[0], c.l1[1], c.l1[2]); }
    const fv = (s.fov || 50) * (camera.aspect < 1 ? Math.min(1.6, 1 / Math.sqrt(camera.aspect)) : 1); if (Math.abs(camera.fov - fv) > 0.01) { camera.fov = fv; camera.updateProjectionMatrix(); }   // 세로 화면 = 화각을 넓혀 옆이 덜 잘리게
    { const nr = Math.max(0.3, Math.min(4, (camera.position.y + 1.5) * 0.05)), fr = Math.max(c.far0, camera.position.y * 3 + 200);   // 높은 샷 = 근평면을 밀어 깊이 정밀도 ↑(멀리서 바닥 무늬·선이 자글거리던 것)
      if (Math.abs(camera.near - nr) > 0.02 || Math.abs(camera.far - fr) > 5) { camera.near = nr; camera.far = fr; camera.updateProjectionMatrix(); } }
    if (scene.fog) { if (!c.fog) c.fog = [scene.fog.near, scene.fog.far]; const k9 = Math.max(1, camera.position.y / 45); scene.fog.near = 140 * k9; scene.fog.far = 420 * k9; }   // 높은 드론 샷이 안개에 바래지 않게(시간대가 바꾼 값 위에 매 프레임)
    camera.updateMatrixWorld();
    if (c.o.music !== false) music(c);
    for (const x of c.sfx) if (!x.done && c.st >= x.t) { x.done = true; SFX[x.k] && SFX[x.k](); }
    for (const p of c.pending) {
      if (!p.done && c.st >= (p.u.at || 0)) { p.done = true; p.el = makeUI(p.u); c.ui.push(p); }
      if (p.done && !p.out && p.u.out != null && c.st >= p.u.out) { p.out = true; p.el.classList.add('out'); }
      if (p.el && p.el._steps) for (const st of p.el._steps) if (!st.done && c.st - (p.u.at || 0) >= st[0]) { st.done = true; st[1](); }
      if (p.el && p.el._n) for (const n of p.el._n) { const k = Math.max(0, Math.min(1, (c.st - (p.u.at || 0) - n.t0) / 1.3)), v = n.v * (1 - Math.pow(1 - k, 4));
        n.sp.textContent = n.pre + (n.dec ? v.toFixed(n.dec) : Math.round(v).toLocaleString('ko-KR')) + n.post; }
    }
    const W = c.stage.clientWidth, H = c.stage.clientHeight, top = c.stage.getBoundingClientRect().top - c.root.getBoundingClientRect().top;
    for (const p of c.ui) { const R = p.el && p.el._route; if (!R || !R.pts.length) continue;   // 지도 길: 화면 자리 → 그려진 만큼(앞에서부터) · 핀은 길이 닿으면
      const xy = R.pts.map(q => { V.set(q.p[0], q.p[1], q.p[2]).project(camera); return [(V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight - top]; });
      const dd = 'M' + xy.map(a => a[0].toFixed(1) + ' ' + a[1].toFixed(1)).join(' L'); R.bg.setAttribute('d', dd); R.fg.setAttribute('d', dd);
      let L = 0; const seg = [0]; for (let k = 1; k < xy.length; k++) { L += Math.hypot(xy[k][0] - xy[k - 1][0], xy[k][1] - xy[k - 1][1]); seg.push(L); }
      const f = Math.max(0, Math.min(1, (c.st - (p.u.at || 0) - 0.3) / R.dur)), e9 = 1 - Math.pow(1 - f, 2), shown = L * e9;
      for (const q of [R.bg, R.fg]) { q.style.strokeDasharray = L.toFixed(1) + ' ' + (L + 10).toFixed(1); q.style.strokeDashoffset = (L - shown).toFixed(1); }
      R.pins.forEach((pn, k) => { pn.e.style.left = xy[k][0].toFixed(1) + 'px'; pn.e.style.top = xy[k][1].toFixed(1) + 'px'; const on = seg[k] <= shown + 0.5; if (on !== pn.on) { pn.on = on; pn.e.classList.toggle('in', on); if (on) SFX.pop(); } }); }
    for (const t of c.tags) { V.set(t.p[0], t.p[1], t.p[2]).project(camera); const vis = c.st >= t.at && V.z < 1 && V.x > -0.95 && V.x < 0.95 && V.y > -0.9 && V.y < 0.85;
      if (vis) { t.el.style.left = ((V.x + 1) / 2 * innerWidth).toFixed(1) + 'px'; t.el.style.top = ((1 - V.y) / 2 * innerHeight - top).toFixed(1) + 'px'; }
      if (vis !== t.on) { t.on = vis; t.el.classList.toggle('in', vis); if (vis) SFX.tick(); } }
    void W; void H;
    c.prog.style.width = (Math.min(1, c.t / Math.max(1, c.T)) * 100).toFixed(2) + '%';
  }
  function finish(k) {
    const c = cur; if (!c || c.done) return; c.done = true;
    removeEventListener('keydown', c.onKey, true);
    if (c.fog && scene.fog) { scene.fog.near = c.fog[0]; scene.fog.far = c.fog[1]; }
    cutOff(); setView && setView(null); const cv = document.getElementById('scene'); if (cv) cv.classList.remove('fl-punch');
    if (c.prevTime && env.setTime && c.o.keepTime !== true) env.setTime(c.prevTime);
    camera.fov = c.fov0; camera.near = c.near0; camera.far = c.far0; camera.updateProjectionMatrix();
    setCam(null); cur = null;
    document.body.classList.remove('film-on');
    c.root.style.transition = 'opacity .45s'; c.root.style.opacity = '0'; setTimeout(() => c.root.remove(), 480);
    c.res(k);
  }
  function stop(k = 'stop') { if (cur) finish(k); }
  return { play, stop, get on() { return !!cur; }, sfx: SFX };
}
