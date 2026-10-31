// 서버 흉내(TEACH-1 · 10-31) — 배포·로그인 없이 Worker + Saves(Durable Object)를 node 하나로 돌림
//   cloudflare:workers = 작은 대역(DurableObject 틀) · DO SQLite = node:sqlite 메모리 DB · 웹소켓 방(Room)은 흉내 X
//   가져다 쓰기: import { M, makeEnv, DBS } from './mock.mjs'  (test_teach.mjs)
//   HTTP로 띄우기: node server/cf-rooms/mock.mjs <포트>  → 마을을 ?cf=http://127.0.0.1:<포트> 로 열면 /save·/load·/class·/tclaim이 여기로 (tools/harness/town_teach.cjs)
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
registerHooks({ resolve(spec, ctx, next) { if (spec === 'cloudflare:workers') return { url: 'data:text/javascript,export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }', shortCircuit: true }; return next(spec, ctx); } });
export const M = await import('./src/index.js');
export const DBS = new Map();
const fakeSql = db => ({ exec(q, ...p) { if (/^\s*(SELECT|PRAGMA)/i.test(q)) { const rows = db.prepare(q).all(...p); return { toArray: () => rows }; } if (p.length) db.prepare(q).run(...p); else db.exec(q); return { toArray: () => [] }; } });
export function makeEnv(extra = {}) {
  const inst = new Map(), env = { PEPPER: 'test-pepper', ...extra };
  env.SAVES = { idFromName: n => n, get: id => ({ fetch: async (url, init) => {
    let o = inst.get(id); if (!o) { let db = DBS.get(id); if (!db) { db = new DatabaseSync(':memory:'); DBS.set(id, db); } o = new M.Saves({ storage: { sql: fakeSql(db) } }, env); inst.set(id, o); }
    return o.fetch(new Request(url, init)); } }) };
  env.ROOMS = { idFromName: n => n, get: () => ({ fetch: async () => new Response('흉내에는 방이 없어요', { status: 501 }) }) };
  return env;
}
/* 직접 실행 = HTTP 흉내 서버 */
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const http = await import('node:http'), port = +process.argv[2] || 8790, env = makeEnv();
  http.createServer(async (rq, rs) => {
    const ch = []; for await (const c of rq) ch.push(c); const body = Buffer.concat(ch);
    const req = new Request('http://127.0.0.1:' + port + rq.url, { method: rq.method, headers: rq.headers, body: rq.method === 'GET' || rq.method === 'HEAD' || rq.method === 'OPTIONS' ? undefined : body });
    let r; try { r = await M.default.fetch(req, env); } catch (e) { r = new Response('흉내 오류 ' + e.message, { status: 500 }); }
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); rs.writeHead(r.status, h); rs.end(Buffer.from(await r.arrayBuffer()));
  }).listen(port, '127.0.0.1', () => console.log('흉내 서버 http://127.0.0.1:' + port));
}
