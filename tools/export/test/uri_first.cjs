// 첫 장 걷기 시험(공개판 uri-maeul): node tools/export/test/uri_first.cjs [포트=8655]
//   원본 첫 장 봇 tools/harness/town_first.cjs를 공개판 주소(루트 · 인트로 끔)로 그대로 돌려요 — 이야기가 바뀌어도 시험이 따로 낡지 않게(10-31)
const { spawnSync } = require('child_process'), path = require('path');
const PORT = process.argv.slice(2).find(a => /^\d+$/.test(a)) || '8655';
const r = spawnSync(process.execPath, [path.join(__dirname, '..', '..', 'harness', 'town_first.cjs'), 'ourtown', PORT, ...process.argv.slice(2).filter(a => a.startsWith('--'))], { stdio: 'inherit', env: { ...process.env, TOWN_URL: 'http://127.0.0.1:' + PORT + '/?intro=0&adapt=0' } });
process.exit(r.status == null ? 1 : r.status);
