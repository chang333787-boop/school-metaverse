// 하네스 공용 브라우저 열기(FAST-1 · 10-24 교사 '진도가 느린데 어쩔 수 없는 거야?') — 논리 하네스는 require('playwright') 대신 require('./pw.cjs')
//   기본 = 그리기 끔(norender): 새 브라우저 창마다 시작 전 window.SM_NORENDER = 1을 넣는다(새로고침·쪽 이동에도 남음) → v2 main.js가 3D 그리기만 건너뜀
//   그리기 켬 = --render · RENDER=1 · 사진(--shots=… · --before) · 성능(--perf · --gpu)을 주면 저절로 켬 · 늘 사진을 찍던 하네스(econ·fish·minis2·salt·nb)는 그리기 끔이면 사진만 건너뜀 — 사진·프레임·그리기 수를 재는 하네스는 이 파일을 쓰지 않는다(docs/systems/town_gates.md 표)
//   --render는 여기서 argv에서 빼 둔다(하네스의 자리 인자 [마을] [포트]가 밀리지 않게)
const pw = require('playwright');
const ri = process.argv.indexOf('--render'); if (ri >= 0) process.argv.splice(ri, 1);
const RENDER = ri >= 0 || process.env.RENDER === '1' || process.argv.some(a => /^--(shots|perf|gpu|before)(=|$)/.test(a));   /* --before = 낚시 시험의 '사진만 찍는 판' */
const NR = 'window.SM_NORENDER = 1;';
const chromium = Object.create(pw.chromium);
chromium.launch = async (o) => { if (!RENDER) o = { ...(o || {}), args: [...((o && o.args) || []), '--sm-norender'] };   /* 크롬이 모르는 이름표(무시됨) — 자리 스크립트가 ps로 '가벼운 시험 브라우저'를 따로 셀 수 있게 */
  const b = await pw.chromium.launch(o); if (RENDER) return b;
  const nc = b.newContext.bind(b); b.newContext = async (opt) => { const c = await nc(opt); await c.addInitScript(NR); return c; };   /* browser.newPage도 안에서 newContext를 부른다(playwright 1.63) */
  return b; };
console.error('[pw] ' + (RENDER ? '그리기 켬(render)' : '그리기 끔(norender) — 사진·프레임을 보려면 --render'));
module.exports = { ...pw, chromium, RENDER };
