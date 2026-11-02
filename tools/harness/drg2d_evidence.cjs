// 드래곤 2D판 증거 표(안 본 사람 시험 · goal §9-7): reference A 28장면마다 '게임 안에서 그 장면을 전하는 순간' = 그 대사가 화면(대화창·말풍선·배너)에 뜬 순간의 사진 + 그 줄
//   node tools/harness/drg2d_evidence.cjs [repo=.] --out=docs/dragon/shots2d [--only=1,2] → 표(마크다운)를 찍음 · 사진은 out/sNN.jpg(683×384 · jpeg)
//   차례를 바로 열고(card=0) 보통 봇이 실제 시간으로 놀다가 글이 나타나면 찍음 · 못 찾으면 ✗
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const OUT = path.resolve(root, arg('out', 'docs/dragon/shots2d')), ONLY = arg('only', '').split(',').filter(Boolean).map(Number);
/* [장면 번호, reference A 장면, 차례 id, 찾을 글(일부)] */
const SCENES = [
  [1, '버크 소개', '1-1', '여기는 버크'], [2, '밤 습격 · 나이트 퓨리 휘파람', '1-5', '본 적이 없대'], [3, '볼라로 맞힘 · 아무도 안 믿음', '1-6', '마을을 다 흔들었구나'],
  [4, '숲에서 밧줄을 끊어 줌', '2-3', '날 덮쳤는데'], [5, '훈련 1일 그롱클', '3-1', '여섯 발'], [6, '코브(왼 꼬리날개 없음)', '3-2', '왼쪽 꼬리날개가 없어'],
  [7, "드래곤 책('알 수 없음')", '3-3', '알 수 없음'], [8, '훈련 2일 내더', '4-0', '내더는 빠르고'], [9, '생선 · 이름 · 나눠 먹기', '4-2', '네 이름이야'],
  [10, '모래 그림 · 손 닿기', '4-3', '코를 댔어'], [11, '꼬리날개 첫 시험 · 뱀장어 질겁', '5-2', '뱀장어를 싫어하는구나'], [12, '지플백 · 뱀장어로 몰아넣음', '5-4', '이것도'],
  [13, '안장 · 드래곤 풀 · 턱 긁기 · 빛', '6-1', '드래곤 풀에 뒹굴고'], [14, '스토이크 귀환(들킬 뻔)', '7-1', '다 들었다'], [15, '안장 비행 · 쪽지 날아감 · 돌기둥', '6-2', '쪽지가'],
  [16, "테러 점심 → '책이 다 틀렸다'", '6-3', '다 틀렸어'], [17, '투구 선물', '7-1', '가슴판'], [18, '최종 선발', '7-2', '1등은 히컵'],
  [19, '아스트리드 · 무서운 비행 · 사과 · 구름 위', '8-2', '미안해'], [20, '둥지 · 대장 · 그롱클이 먹힘', '8-4', '나쁜 건 대장뿐'], [21, '마지막 시험 · 무기·투구 · 투슬리스 잡힘', '9-1', '해치지 않아도 된다는 걸'],
  [22, '말실수 · 의절 · 사슬에 묶여 출항', '9-4', '길잡이로 삼겠다'], [23, '친구들에게 드래곤 · 출격', '9-6', '투슬리스를 구하러'], [24, '둥지 공격 · 대장 등장 · 배가 탐', '10-1', '불타고 있어'],
  [25, '역할 나누기', '10-1', '맡을 일을 나누자'], [26, '물속 사슬 · 스토이크의 구조와 사과', '10-2', '내가 틀렸다'], [27, '구름 · 날개 구멍 · 입 안 · 꼬리날개 불 · 감쌈', '10-5', '고맙다'],
  [28, '의족 · 새 꼬리날개 · 함께 사는 마을 · 끝 내레이션', '11-3', '빈 곳을 채워 주는'],
];
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 0.5 })).newPage();   // 사진은 683×384(저장소 크기 줄임)
  fs.mkdirSync(OUT, { recursive: true });
  const rows = [];
  for (const [n, name, id, want] of SCENES) {
    if (ONLY.length && !ONLY.includes(n)) continue;
    const ch = +id.split('-')[0];
    let got = null;
    try {
      await p.goto(`${base}/dragon2d/?ch=${ch}&step=0&chain=0&card=0&seed=1`);
      await p.waitForFunction(() => window.DRG2 && DRG2.sense().id, null, { timeout: 30000 });
      const idx = await p.evaluate(async (ch) => (await import('/dragon2d/js/story/ch' + ch + '.js?v=1')).chapter.steps.map((s) => s.id), ch).then((l) => l.indexOf(id));
      await p.goto(`${base}/dragon2d/?ch=${ch}&step=${Math.max(0, idx)}&chain=0&card=0&seed=1&turbo=2`);
      await p.waitForFunction(() => window.DRG2 && DRG2.sense().id && !DRG2.sense().busy, null, { timeout: 30000 });
      got = await p.evaluate(async (want) => {
        const m = await import('/dragon2d/js/bots/bots.js?v=1'); DRG2.bot.run(m.storyBot('normal'));
        const t0 = performance.now();
        return await new Promise((res) => { const iv = setInterval(() => { const h = DRG2.G.hud.state(), all = [h.dialog, h.bubble, h.banner].filter(Boolean);
          const hit = all.find((t) => t.includes(want));
          if (hit) { clearInterval(iv); DRG2.loop.paused = true; DRG2.bot.stop(); res(hit); }
          else if (performance.now() - t0 > 150000) { clearInterval(iv); DRG2.bot.stop(); res(null); } }, 50); });
      }, want);
      if (got) await p.screenshot({ path: path.join(OUT, 's' + String(n).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 60 });
    } catch (e) { got = null; }
    rows.push(`| ${n} | ${name} | ${id} | ${got ? '「' + got.replace(/\|/g, '/') + '」' : '✗ 못 찾음'} | ${got ? `![${n}](shots2d/s${String(n).padStart(2, '0')}.jpg)` : ''} |`);
    console.log(rows[rows.length - 1]);
  }
  const ok = rows.filter((r) => !r.includes('✗')).length;
  console.log(`\n짚힌 장면 ${ok}/${rows.length} (${Math.round(ok / rows.length * 100)}%)`);
  await b.close(); srv.close();
});
