// 마을 지문(OPT-9 · STREAM-1 검증 틀 · 또래 10-17 '보이는 마을 그대로를 숫자로'): node tools/harness/town_meshhash.cjs [마을=ourtown] [포트=8002]
//   배치 지문 = 건물(자리·종류·폭·색) 해시 · 그림 지문 = 마을 묶음 메시마다 [종류·재질·정점 수·경계 상자·인스턴스 수·자리] 정렬 해시
//   움직이는 것(바람개비·그네·신호·배 등)은 1.5초 간격 두 번 재서 바뀐 것을 뺌 → 같은 판은 늘 같은 값 · 짓기를 바꾼 뒤 전·후가 같아야 '보이는 마을 그대로'
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] }); const p = await (await b.newContext({ viewport: { width: 1000, height: 600 } })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&dpr=1'); await p.waitForFunction(() => window.SM_TOWN, null, { timeout: 300000 }); await p.waitForTimeout(800);
  const r = await p.evaluate(async () => { const R = SM_TOWN.root; const snap = () => { const m = new Map(); R.traverse(o => { if (!o.isMesh && !o.isLine && !o.isPoints && !o.isSprite) return; const g = o.geometry; if (!g) return; const n = g.attributes && g.attributes.position ? g.attributes.position.count : 0; if (!g.boundingBox && g.attributes && g.attributes.position && g.attributes.position.array) g.computeBoundingBox(); const bb = g.boundingBox, f = v => Math.round(v * 10); o.updateWorldMatrix(true, false);
      m.set(o.uuid, [o.type, o.material && (o.material.type + ':' + (o.material.color ? o.material.color.getHexString() : '')), n, bb ? [f(bb.min.x), f(bb.min.y), f(bb.min.z), f(bb.max.x), f(bb.max.y), f(bb.max.z)].join(',') : '-', o.isInstancedMesh ? o.count : -1, o.matrixWorld.elements.map(f).join(',')].join('|')); }); return m; };
    const a = snap(); await new Promise(r => setTimeout(r, 1500)); const c = snap(), sig = []; let verts = 0, moved = 0; for (const [k, v] of a) { if (c.get(k) !== v) { moved++; continue; } sig.push(v); verts += +v.split('|')[2]; } sig.sort(); let h = 2166136261; for (const s of sig) for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    const bld = SM_TOWN.bldHash ? SM_TOWN.bldHash() : null; return { bld, mesh: { all: a.size, still: sig.length, moved, verts, h: h >>> 0 } }; });
  console.log(JSON.stringify({ town: ID, ...r, errs })); await b.close(); })();
