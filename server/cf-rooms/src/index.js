// 학교 메타버스 실시간 방 서버 시험판(NET-CF 1단계 · 사용자 10-20 '클라우드플레어 해 보자')
// Worker = 문지기(주소·Origin·방 이름 확인) → Room Durable Object = 방 하나 = 서버 하나(웹소켓).
// 주고받기(JSON · 짧은 키)
//   받기  {t:'j', id, n}            들어오기(id = 영문·숫자·_- 16자 · n = 이름 12자)
//         {t:'p', x, y, z, h, s}    내 위치(h = 바라보는 방향 · s = 상태 번호나 짧은 글)
//         {t:'e', ...}              사건 → 방의 다른 사람에게 그대로(보낸 이 f를 서버가 붙임 · all:1이면 나도 받음)
//         {t:'ping', c}             지연 재기 → {t:'pong', c, ts}
//   보내기 {t:'w', id, ts, L:[[id,n]...], P:[[id,x,y,z,h,s]...]}  들어온 나에게 방 전체 모습
//         {t:'j', id, n} · {t:'l', id}                          누가 들어옴 · 나감
//         {t:'s', ts, P:[[id,x,y,z,h,s]...]}                    초당 20번 · 그사이 움직인 사람만
//         {t:'full', m}                                         꽉 참(닫기 직전)
// 돈 0원 지키기
//   - 휴면 웹소켓(ctx.acceptWebSocket): 아무 일 없으면 DO가 메모리에서 내려가 시간 요금이 안 쌓임.
//   - 박자(50ms)는 DO 안 타이머로 돌림. setAlarm은 한 번마다 '요청 1건'으로 세어
//     30명 한 시간이면 알람만 7만 2천 건(무료 하루 10만 건의 72%)이라 쓰지 않음.
//     움직임이 3초 없으면 박자를 멈춤 → 타이머가 없으니 휴면할 수 있음.
//   - 하루 메시지 수는 메모리에 세고 10초마다 한 번만 저장(무료 하루 쓰기 10만 줄 아끼기).

import { DurableObject } from 'cloudflare:workers';

const TICK = 50;              /* 박자 50ms = 초당 20번 */
const IDLE_MS = 3000;         /* 이만큼 아무도 안 움직이면 박자 멈춤 */
const FLUSH_MS = 10000;       /* 하루 메시지 수 저장 간격 */
const ROOM_MAX = 40;          /* 방당 사람 수 */
const RATE_MAX = 30;          /* 한 사람 1초 메시지 상한(넘으면 버림) */
const RATE_KICK = 90;         /* 1초에 이만큼 넘게 보내면 끊음 */
const MSG_BYTES = 1024;       /* 메시지 한 개 크기 상한 */

const ORIGIN_OK = 'https://chang333787-boop.github.io';
const ORIGIN_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const ROOM_NAME = /^[A-Za-z0-9]{4,8}$/;

/* 동시 방 수를 '대략' 막기 — 이 isolate가 최근 10분에 본 방 이름 수. 전 세계 합계는 아님(완벽할 필요 X). */
const seenRooms = new Map();
const SEEN_MS = 10 * 60 * 1000;

function originOk(o) { return !!o && (o === ORIGIN_OK || ORIGIN_LOCAL.test(o)); }

function text(body, status) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/health') return text('sm-rooms 살아 있어요', 200);
    const sv = url.pathname.match(/^\/(save|load|drop)\/([^/]+)\/(\d{1,2})$/);
    if (sv) return saveRoute(req, env, sv[1], sv[2], +sv[3]);
    const m = url.pathname.match(/^\/room\/([^/]+)$/);
    if (!m) return text('없는 주소예요', 404);
    if (!originOk(req.headers.get('Origin'))) return text('허락되지 않은 곳이에요', 403);
    const name = m[1];
    if (!ROOM_NAME.test(name)) return text('방 이름은 영문·숫자 4~8자예요', 400);
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return text('웹소켓으로 들어와요', 426);

    const key = name.toLowerCase();
    const now = Date.now();
    const roomsMax = Number(env.ROOMS_MAX) || 50;
    if (!seenRooms.has(key)) {
      for (const [k, t] of seenRooms) if (now - t > SEEN_MS) seenRooms.delete(k);
      if (seenRooms.size >= roomsMax) return text('지금은 방이 너무 많아요', 503);
    }
    seenRooms.set(key, now);

    const stub = env.ROOMS.get(env.ROOMS.idFromName(key));
    return stub.fetch(req);
  },
};

/* 숫자 다듬기 — 0.01 단위로 줄여 보내는 글자 수를 아낌 */
function num(v) {
  v = Number(v);
  if (!Number.isFinite(v)) return 0;
  if (v > 1e5) v = 1e5; else if (v < -1e5) v = -1e5;
  return Math.round(v * 100) / 100;
}
function st(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v | 0;
  if (typeof v === 'string') return v.slice(0, 8);
  return 0;
}
/* 무료 한도도 UTC 0시(한국 아침 9시)에 새로 시작하니 하루도 UTC로 셈 */
/* 닫힌 소켓에 보내면 런타임 오류가 남 → 보내기는 늘 이것으로 */
function send(ws, s) { try { ws.send(s); } catch (e) { /* 이미 닫힘 */ } }
function shut(ws, code, why) { try { ws.close(code, why); } catch (e) { /* 이미 닫힘 */ } }

function utcDay(t) { return new Date(t).toISOString().slice(0, 10); }
function dayEndOf(t) { return (Math.floor(t / 86400000) + 1) * 86400000; }

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.dayMax = Number(env.DAY_MSG_MAX) || 1500000;
    this.info = new Map();   /* ws → {id, n, win, cnt} (메모리 · 휴면에서 깨면 다시 채움) */
    this.dead = new WeakSet(); /* 서버가 닫은 소켓(닫힌 뒤 늦게 온 메시지는 버림) */
    this.pos = new Map();    /* id → [id,x,y,z,h,s] */
    this.dirty = new Set();  /* 이번 박자에 움직인 id */
    this.beat = null;
    this.nextAt = 0;
    this.lastMove = 0;
    this.day = utcDay(Date.now());
    this.dayEnd = dayEndOf(Date.now());
    this.cnt = 0;
    this.cntSaved = 0;
    this.lastFlush = Date.now();
    /* 휴면에서 깨어나면 붙어 있는 소켓의 꼬리표(이름·마지막 자리)로 방 모습을 되살림 */
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a || !a.id) continue;
      this.info.set(ws, { id: a.id, n: a.n, win: 0, cnt: 0 });
      if (a.p) this.pos.set(a.id, a.p);
    }
    this.ctx.blockConcurrencyWhile(async () => {
      const d = await this.ctx.storage.get('day');
      if (d && d.d === this.day) { this.cnt = d.c; this.cntSaved = d.c; }
    });
  }

  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    if (this.dayFull()) { this.bye(server, '오늘은 꽉 찼어요. 내일 다시 만나요', 4002); }
    else if (this.ctx.getWebSockets().length > ROOM_MAX) { this.bye(server, `방이 꽉 찼어요(${ROOM_MAX}명)`, 4003); }
    return new Response(null, { status: 101, webSocket: client });
  }

  bye(ws, m, code) {
    this.dead.add(ws);
    send(ws, JSON.stringify({ t: 'full', m }));
    shut(ws, code, 'full');
  }

  dayFull() {
    const now = Date.now();
    if (now >= this.dayEnd) { this.day = utcDay(now); this.dayEnd = dayEndOf(now); this.cnt = 0; this.cntSaved = 0; }
    return this.cnt >= this.dayMax;
  }

  flush() {
    this.lastFlush = Date.now();
    if (this.cnt === this.cntSaved) return;
    this.cntSaved = this.cnt;
    this.ctx.storage.put('day', { d: this.day, c: this.cnt });
  }

  meta(ws) {
    let i = this.info.get(ws);
    if (!i) {
      const a = ws.deserializeAttachment() || {};
      i = { id: a.id || null, n: a.n || '', win: 0, cnt: 0 };
      this.info.set(ws, i);
    }
    return i;
  }

  others(ws, str) {
    for (const [w, i] of this.info) if (w !== ws && i.id) send(w, str);
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MSG_BYTES || this.dead.has(ws)) return;
    const i = this.meta(ws);
    const now = Date.now();
    /* 1초 창으로 한 사람 메시지 수 세기 */
    if (now - i.win >= 1000) { i.win = now; i.cnt = 0; }
    if (++i.cnt > RATE_MAX) {
      if (i.cnt > RATE_KICK) { this.dead.add(ws); shut(ws, 1008, 'too fast'); }
      return;
    }
    this.cnt++;
    if (this.dayFull()) {
      this.flush();
      for (const w of this.ctx.getWebSockets()) this.bye(w, '오늘은 꽉 찼어요. 내일 다시 만나요', 4002);
      return;
    }
    let d;
    try { d = JSON.parse(msg); } catch (e) { return; }
    if (!d || typeof d !== 'object') return;

    switch (d.t) {
      case 'p': {
        if (!i.id) return;
        const p = [i.id, num(d.x), num(d.y), num(d.z), num(d.h), st(d.s)];
        this.pos.set(i.id, p);
        this.dirty.add(i.id);
        this.lastMove = now;
        this.startBeat();
        return;
      }
      case 'ping':
        send(ws, JSON.stringify({ t: 'pong', c: d.c, ts: now }));
        return;
      case 'e': {
        if (!i.id) return;
        d.f = i.id;
        const all = d.all === 1;
        const s = JSON.stringify(d);
        if (all) send(ws, s);
        this.others(ws, s);
        return;
      }
      case 'j': {
        const id = String(d.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16);
        if (!id || i.id) return;
        const n = String(d.n || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 12);
        /* 같은 id가 이미 있으면(새로고침·다른 탭) 옛 연결을 닫음 */
        for (const [w, o] of this.info) if (w !== ws && o.id === id) {
          o.id = null;
          this.dead.add(w);
          shut(w, 4000, 'replaced');
        }
        i.id = id; i.n = n;
        ws.serializeAttachment({ id, n });
        const L = [], P = [];
        for (const o of this.info.values()) if (o.id) {
          L.push([o.id, o.n]);
          const p = this.pos.get(o.id);
          if (p) P.push(p);
        }
        send(ws, JSON.stringify({ t: 'w', id, ts: now, L, P }));
        this.others(ws, JSON.stringify({ t: 'j', id, n }));
        return;
      }
    }
  }

  async webSocketClose(ws) {
    this.drop(ws);
    shut(ws, 1000, 'bye');
  }

  async webSocketError(ws) { this.drop(ws); }

  drop(ws) {
    const i = this.info.get(ws) || this.meta(ws);
    this.info.delete(ws);
    if (!i || !i.id) return;
    /* 같은 id로 다시 들어온 새 연결이 있으면 그 사람은 남아 있는 것 */
    for (const o of this.info.values()) if (o.id === i.id) return;
    this.pos.delete(i.id);
    this.dirty.delete(i.id);
    this.others(ws, JSON.stringify({ t: 'l', id: i.id }));
    if (this.info.size === 0) this.flush();
  }

  startBeat() {
    if (this.beat) return;
    this.nextAt = Date.now() + TICK;
    this.beat = setTimeout(() => this.tick(), TICK);
  }

  tick() {
    this.beat = null;
    const now = Date.now();
    if (this.dirty.size) {
      const P = [];
      for (const id of this.dirty) { const p = this.pos.get(id); if (p) P.push(p); }
      this.dirty.clear();
      if (P.length) {
        const s = JSON.stringify({ t: 's', ts: now, P });
        for (const [w, i] of this.info) if (i.id) send(w, s);
      }
    }
    if (now - this.lastFlush >= FLUSH_MS) this.flush();
    if (this.info.size === 0 || now - this.lastMove > IDLE_MS) { this.park(); return; }
    this.nextAt += TICK;
    if (this.nextAt <= now) this.nextAt = now + TICK; /* 밀렸으면 따라잡지 말고 다음 박자부터 */
    this.beat = setTimeout(() => this.tick(), this.nextAt - now);
  }

  /* 박자를 멈추고 휴면 준비 — 마지막 자리를 소켓 꼬리표에 적어 깨어나도 방 모습이 남게 */
  park() {
    for (const [w, i] of this.info) if (i.id) {
      try { w.serializeAttachment({ id: i.id, n: i.n, p: this.pos.get(i.id) || null }); } catch (e) { /* 닫히는 중 */ }
    }
    this.flush();
  }
}

/* ───────── 이어 하기 저장(SAVE-CF · 최종 차례 8 · 사용자 10-24 '크롬북 ↔ 컴퓨터실 이어 하기') ─────────
   POST /save/<반코드>/<번호>  {pin, data}  → {ok, at}        · 핀이 다르면 403 · 5번 틀리면 1분 잠금 423 · 너무 크면 413 · 오늘 꽉 차면 429
   POST /load/<반코드>/<번호>  {pin}        → {ok, at, data} · 없으면 {ok, none:1}
   POST /drop/<반코드>/<번호>  {pin}        → 내 저장 지우기(핀이 맞을 때)
   - 반 코드 하나 = Durable Object 하나(SQLite 표 한 개) · 번호 1~40 · 핀은 소금(반 코드·번호·PEPPER) + SHA-256 해시만 둠
   - 이름은 받지도 두지도 않음(저장 JSON에서 이름 칸을 빼고 받음 · 아래 NAME_KEYS) · 핀은 주소에 넣지 않음(본문)
   - 무료 한도: 반 하나 하루 저장 2만 번 · 저장 하나 256KB */
const SAVE_MAX = 256 * 1024, SAVE_DAY_MAX = 20000, CLASS_RX = /^[A-Za-z0-9]{4,8}$/;
function cors(req) { const o = req.headers.get('Origin') || ''; return { 'access-control-allow-origin': originOk(o) ? o : ORIGIN_OK, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'Origin' }; }
function json(req, obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors(req) } }); }
async function saveRoute(req, env, kind, code, num) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (!originOk(req.headers.get('Origin'))) return text('허락되지 않은 곳이에요', 403);
  if (req.method !== 'POST') return json(req, { ok: false, m: 'POST로 보내요' }, 405);
  if (!CLASS_RX.test(code) || !(num >= 1 && num <= 40)) return json(req, { ok: false, m: '반 코드는 영문·숫자 4~8자 · 번호는 1~40' }, 400);
  const body = await req.text(); if (body.length > SAVE_MAX + 200) return json(req, { ok: false, m: '저장이 너무 커요' }, 413);
  const stub = env.SAVES.get(env.SAVES.idFromName(code.toLowerCase()));
  const r = await stub.fetch('https://saves/' + kind + '/' + code.toLowerCase() + '/' + num, { method: 'POST', body });
  const out = await r.text(); return new Response(out, { status: r.status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors(req) } });
}
async function pinHash(pepper, code, num, pin) { const b = new TextEncoder().encode((pepper || 'sm-town') + '|' + code + '|' + num + '|' + pin); const h = await crypto.subtle.digest('SHA-256', b); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const NAME_KEYS = new Set(['name', 'nick', 'realName']);
function noNames(v, d = 0) { if (d > 12 || !v || typeof v !== 'object') return v; if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = noNames(v[i], d + 1); return v; } for (const k of Object.keys(v)) { if (NAME_KEYS.has(k) && typeof v[k] === 'string') delete v[k]; else v[k] = noNames(v[k], d + 1); } return v; }

export class Saves extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.env = env; this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS s (num INTEGER PRIMARY KEY, pin TEXT, data TEXT, at INTEGER, fails INTEGER DEFAULT 0, lock INTEGER DEFAULT 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS d (day TEXT PRIMARY KEY, c INTEGER)');
  }
  async fetch(req) {
    const [, kind, code, n] = new URL(req.url).pathname.split('/'), num = +n, now = Date.now();
    let d; try { d = JSON.parse(await req.text()); } catch (e) { return Response.json({ ok: false, m: '읽을 수 없는 저장' }, { status: 400 }); }
    const pin = String((d && d.pin) || ''); if (!/^\d{4}$/.test(pin)) return Response.json({ ok: false, m: '비밀번호는 숫자 네 자리' }, { status: 400 });
    const row = this.sql.exec('SELECT pin, data, at, fails, lock FROM s WHERE num = ?', num).toArray()[0];
    const h = await pinHash(this.env.PEPPER, code, num, pin);
    if (row) {
      if (row.lock > now) return Response.json({ ok: false, m: '잠깐 잠겼어요. 1분 뒤에 다시 해요', lock: 1 }, { status: 423 });
      if (row.pin !== h) { const f = (row.fails || 0) + 1; this.sql.exec('UPDATE s SET fails = ?, lock = ? WHERE num = ?', f >= 5 ? 0 : f, f >= 5 ? now + 60000 : 0, num); return Response.json({ ok: false, m: '비밀번호가 달라요', bad: 1 }, { status: 403 }); }
      if (row.fails) this.sql.exec('UPDATE s SET fails = 0 WHERE num = ?', num);
    }
    if (kind === 'drop') { if (row) this.sql.exec('DELETE FROM s WHERE num = ?', num); return Response.json({ ok: true, dropped: row ? 1 : 0 }); }   /* 내 저장 지우기(핀이 맞을 때 · 시험 판 zz 치우기) */
    if (kind === 'load') return Response.json(row && row.data ? { ok: true, at: row.at, data: JSON.parse(row.data) } : { ok: true, none: 1 });
    const day = new Date(now).toISOString().slice(0, 10), c = (this.sql.exec('SELECT c FROM d WHERE day = ?', day).toArray()[0] || { c: 0 }).c;
    if (c >= SAVE_DAY_MAX) return Response.json({ ok: false, m: '오늘은 저장이 꽉 찼어요. 이 기기에는 남아 있어요', full: 1 }, { status: 429 });
    if (!d.data || typeof d.data !== 'object' || Array.isArray(d.data)) return Response.json({ ok: false, m: '저장할 것이 없어요' }, { status: 400 });
    const data = JSON.stringify(noNames(d.data)); if (data.length > SAVE_MAX) return Response.json({ ok: false, m: '저장이 너무 커요' }, { status: 413 });
    this.sql.exec('INSERT INTO s (num, pin, data, at, fails, lock) VALUES (?, ?, ?, ?, 0, 0) ON CONFLICT(num) DO UPDATE SET data = excluded.data, at = excluded.at', num, h, data, now);
    this.sql.exec('INSERT INTO d (day, c) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET c = c + 1', day);
    if (Math.random() < 0.02) this.sql.exec('DELETE FROM d WHERE day < ?', new Date(now - 7 * 86400000).toISOString().slice(0, 10));
    return Response.json({ ok: true, at: now });
  }
}
