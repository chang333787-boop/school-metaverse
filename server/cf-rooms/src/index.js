// 학교 메타버스 실시간 방 서버 시험판(NET-CF 1단계 · 사용자 10-20 '클라우드플레어 해 보자')
// Worker = 문지기(주소·Origin·방 이름 확인) → Room Durable Object = 방 하나 = 서버 하나(웹소켓).
// 주고받기(JSON · 짧은 키)
//   받기  {t:'j', id, n, k?, c?, a?, u?}  들어오기(id = 영문·숫자·_- 16자 · n = 늘 빈 글 — 이름은 받지 않음(보내도 버림))
//                                     NET-CF3 모양 칸(이름 X · 꼴이 안 맞으면 버림 = null): k 옷 코드(영문·숫자 8자) · c 색 번호 0~9 · a 세계 머리표('' 학교 · 't:다7.b' · 'i:12') · u 번호 1~40
//         {t:'m', k?, a?}           모양 칸이 바뀜(옷·세계) — 한 사람 1초에 한 번(더 잦으면 버림) → 다른 사람에게 {t:'m', id, k, c, a}
//         {t:'p', x, y, z, h, s}    내 위치(h = 바라보는 방향 · s = 상태 번호나 짧은 글)
//         {t:'e', ...}              사건 → 방의 다른 사람에게 그대로(보낸 이 f를 서버가 붙임 · all:1이면 나도 받음)
//         {t:'ping', c}             지연 재기 → {t:'pong', c, ts} · 글이 정확히 {"t":"ping"}이면 방을 깨우지 않고 {"t":"pong"}(자동 답 · 하루 세기에도 안 듦)
//   보내기 {t:'w', id, ts, L:[[id,n,k,c,a,u]...], P:[[id,x,y,z,h,s]...]}  들어온 나에게 방 전체 모습(옛 화면은 P만 읽음)
//         {t:'j', id, n, k, c, a, u} · {t:'l', id}              누가 들어옴 · 나감
//         {t:'s', ts, P:[[id,x,y,z,h,s]...]}                    초당 20번 · 그사이 움직인 사람만
//         {t:'full', m}                                         꽉 참(닫기 직전)
// CLASS-MP(11-14) 반 방 = 'c' + 16진 7자(반 코드의 PEPPER 해시 · 거꾸로 못 앎) · /load·/save 답의 mp = {r 방, tk 입장표, u 번호}(PEPPER 서명 · 그날과 다음 날)
//   반 방은 {t:'j', tk}가 맞을 때만 들임(아니면 4004) · 번호 u = 표에서 읽음(보낸 u는 버림) · 같은 번호가 다른 id로 들어오면 먼저 것을 4005로 내보냄
// 돈 0원 지키기
//   - 휴면 웹소켓(ctx.acceptWebSocket): 아무 일 없으면 DO가 메모리에서 내려가 시간 요금이 안 쌓임.
//   - 박자(50ms)는 DO 안 타이머로 돌림. setAlarm은 한 번마다 '요청 1건'으로 세어
//     30명 한 시간이면 알람만 7만 2천 건(무료 하루 10만 건의 72%)이라 쓰지 않음.
//     움직임이 3초 없으면 박자를 멈춤 → 타이머가 없으니 휴면할 수 있음.
//   - 하루 메시지 수는 메모리에 세고 10초마다 한 번만 저장(무료 하루 쓰기 10만 줄 아끼기).

import { DurableObject } from 'cloudflare:workers';
import { tsum } from '../../../v2/games/town_tsum.js';   /* TEACH-1 교사 표 요약(마을과 같은 함수 · wrangler가 묶어 올림) */

const TICK = 50;              /* 박자 50ms = 초당 20번 */
const IDLE_MS = 3000;         /* 이만큼 아무도 안 움직이면 박자 멈춤 */
const FLUSH_MS = 10000;       /* 하루 메시지 수 저장 간격 */
const ROOM_MAX = 40;          /* 방당 사람 수 */
const RATE_MAX = 30;          /* 한 사람 1초 메시지 상한(넘으면 버림) */
const RATE_KICK = 90;         /* 1초에 이만큼 넘게 보내면 끊음 */
const MSG_BYTES = 1024;       /* 메시지 한 개 크기 상한 */
const LOOK_MS = 1000;         /* NET-CF3 모양 칸 바뀜 알림({t:'m'}) — 한 사람 이 간격에 한 번 */

const ORIGIN_OK = 'https://chang333787-boop.github.io';
const ORIGIN_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const ROOM_NAME = /^[A-Za-z0-9]{4,8}$/;
const CLS_ROOM = /^c[0-9a-f]{7}$/;   /* CLASS-MP 반 방(입장표가 있어야 들어옴) */

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
    const tv = url.pathname.match(/^\/(class|tclaim|treset|tset)\/([^/]+)$/);
    if (tv) return teachRoute(req, env, tv[1], tv[2]);
    const pv = url.pathname.match(/^\/pinclear\/([^/]+)\/(\d{1,2})$/);   /* PIN-1 아이 번호 비밀번호 풀기(교사 열쇠) */
    if (pv) return teachRoute(req, env, 'pinclear', pv[1], +pv[2]);
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
/* NET-CF3 모양 칸 — 자유 글 칸이 아님: 정해진 꼴만 받고 그 밖은 null(= '모름' · 옛 화면이 안 보낸 것과 같음)
   세계 머리표 a = '' 학교 · 't:' + 칸(한글 한 글자나 영문 대문자 1~2자 + 숫자 1~2자 · 차례 바뀐 꼴 · 빈칸) · 'i:' + 건물 번호 · 끝에 탈것 .b .o .k .z — 이름이 실릴 수 없는 꼴 */
const K_RX = /^[A-Za-z0-9]{1,8}$/;
const A_RX = /^(?:t:(?:(?:[가-힣]|[A-Z]{1,2})[0-9]{1,2}|[0-9]{1,2}(?:[가-힣]|[A-Z]{1,2}))?|i:[0-9]{1,3})(?:\.[bokz])?$/;
function okK(v) { return typeof v === 'string' && K_RX.test(v) ? v : null; }
function okA(v) { return typeof v === 'string' && v.length <= 20 && (v === '' || A_RX.test(v)) ? v : null; }
function okInt(v, lo, hi) { return Number.isInteger(v) && v >= lo && v <= hi ? v : null; }
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
    this.info = new Map();   /* ws → {id, n, k, c, a, u, mAt, win, cnt} (메모리 · 휴면에서 깨면 다시 채움) */
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
      this.info.set(ws, { id: a.id, n: a.n, k: a.k ?? null, c: a.c ?? null, a: a.a ?? null, u: a.u ?? null, cr: a.cr || 0, mAt: 0, win: 0, cnt: 0 });
      if (a.p) this.pos.set(a.id, a.p);
    }
    /* NET-CF3 핑 자동 답 — 글이 정확히 같으면 방(DO)을 깨우지 않고 답함(조용한 방은 휴면 그대로 · 하루 세기에도 안 듦) */
    try { this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}')); } catch (e) { /* 없는 곳에서는 아래 'ping' 갈래가 답함 */ }
    this.ctx.blockConcurrencyWhile(async () => {
      const d = await this.ctx.storage.get('day');
      if (d && d.d === this.day) { this.cnt = d.c; this.cntSaved = d.c; }
    });
  }

  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const rn = (new URL(req.url).pathname.split('/')[2] || '').toLowerCase(); if (CLS_ROOM.test(rn)) server.serializeAttachment({ rn });   /* CLASS-MP: 반 방 이름(들어오기 확인용 · 휴면에도 남음) */
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
      i = { id: a.id || null, n: a.n || '', k: a.k ?? null, c: a.c ?? null, a: a.a ?? null, u: a.u ?? null, cr: a.cr || 0, mAt: 0, win: 0, cnt: 0 };
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
        if (i.cr) { const m = okInt(d.m, 0, 9); if (m == null) return; d = d.all === 1 ? { t: 'e', m, all: 1 } : { t: 'e', m }; }   /* CLASS-MP 반 방 = 이모트 번호만(자유 글 X · CLASS-MP-B: all도 1만) */
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
        const rn = (ws.deserializeAttachment() || {}).rn; let tu = null;   /* CLASS-MP: 반 방 = 입장표가 맞아야 · 번호는 표에서 */
        if (rn) { tu = await tkCheck(this.env.PEPPER, rn, d.tk, now); if (!tu) { this.dead.add(ws); shut(ws, 4004, 'ticket'); return; } if (i.id || this.dead.has(ws)) return;
          for (const [w, o] of this.info) if (w !== ws && o.id && o.id !== id && o.u === tu) { const old = o.id; this.pos.delete(old); this.dirty.delete(old); this.others(w, JSON.stringify({ t: 'l', id: old })); o.id = null; this.dead.add(w); shut(w, 4005, 'other device'); } }   /* CLASS-MP-B: 옛 id는 진짜로 나감 → 나감 알림·자리 지움(그러지 않으면 drop이 id 없음에서 돌아가 옛 몸이 남음) · others는 아직 id 없는 새 연결엔 안 보냄 */
        const n = '';   /* NET-CF3: 이름은 받지 않음 — 누가 보내도 버리고 늘 빈 글(이름·자유 글은 이 서버에 두지 않음 · 칸은 옛 화면과 꼴을 맞추려고 남김) */
        /* 같은 id가 이미 있으면(새로고침·다른 탭) 옛 연결을 닫음 */
        for (const [w, o] of this.info) if (w !== ws && o.id === id) {
          o.id = null;
          this.dead.add(w);
          shut(w, 4000, 'replaced');
        }
        i.id = id; i.n = n;
        i.k = okK(d.k); i.c = okInt(d.c, 0, 9); i.a = okA(d.a); i.u = rn ? tu : okInt(d.u, 1, 40); i.cr = rn ? 1 : 0;   /* NET-CF3 모양 칸(안 보냈거나 꼴이 다르면 null) */
        this.tagOf(ws, i, false);
        const L = [], P = [];
        for (const o of this.info.values()) if (o.id) {
          L.push([o.id, o.n, o.k, o.c, o.a, o.u]);
          const p = this.pos.get(o.id);
          if (p) P.push(p);
        }
        send(ws, JSON.stringify({ t: 'w', id, ts: now, L, P }));
        this.others(ws, JSON.stringify({ t: 'j', id, n, k: i.k, c: i.c, a: i.a, u: i.u }));
        return;
      }
      case 'm': {   /* NET-CF3: 옷·세계가 바뀜 — 보낸 칸만 바꿈 · 1초에 한 번 */
        if (!i.id || now - i.mAt < LOOK_MS) return;
        i.mAt = now;
        if ('k' in d) i.k = okK(d.k);
        if ('a' in d) i.a = okA(d.a);
        this.tagOf(ws, i, true);
        this.others(ws, JSON.stringify({ t: 'm', id: i.id, k: i.k, c: i.c, a: i.a }));
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

  /* 소켓 꼬리표(휴면에서 깨어나도 남는 것) = id · 이름(빈 글) · 모양 칸 · 마지막 자리 */
  tagOf(w, i, withPos) {
    try { w.serializeAttachment({ id: i.id, n: i.n, k: i.k, c: i.c, a: i.a, u: i.u, cr: i.cr || 0, p: withPos ? this.pos.get(i.id) || null : null }); } catch (e) { /* 닫히는 중 */ }
  }

  /* 박자를 멈추고 휴면 준비 — 마지막 자리를 소켓 꼬리표에 적어 깨어나도 방 모습이 남게 */
  park() {
    for (const [w, i] of this.info) if (i.id) this.tagOf(w, i, true);
    this.flush();
  }
}

/* ───────── 이어 하기 저장(SAVE-CF · 최종 차례 8 · 사용자 10-24 '크롬북 ↔ 컴퓨터실 이어 하기') ─────────
   POST /save/<반코드>/<번호>  {pin, data}  → {ok, at}        · 핀이 다르면 403 · 5번 틀리면 1분 잠금 423 · 너무 크면 413 · 오늘 꽉 차면 429 · 선생님이 푼 번호면 409 {relog:1}(PIN-1B)
   POST /load/<반코드>/<번호>  {pin}        → {ok, at, data} · 없으면 {ok, none:1} · {pin, chk:1} = 열린 창의 주기 확인(선생님이 푼 번호면 잡지 않고 409 {relog:1})
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
/* ───────── 교사 표(TEACH-1 · 10-31 '2주 믿게 만들기' 셋째 · docs/systems/town_teacher.md) ─────────
   POST /tclaim/<반코드>  {tkey}         → 그 반 교사 열쇠를 처음 정함 {ok, made:1} · 이미 같은 열쇠면 {ok, made:0} · 다른 열쇠가 있으면 409
   POST /class/<반코드>   {tkey}         → {ok, at, L:[{n, at, s}]} · s = 판 요약(town_tsum.js) — 판 전체·핀은 보내지 않음 · 열쇠가 아직 없으면 404 {nokey:1}
   POST /treset/<반코드>  {admin, tkey}  → 관리 열쇠(비밀값 ADMIN)가 맞을 때만 교사 열쇠를 바꿈 · ADMIN을 안 넣었으면 늘 403
   POST /pinclear/<반코드>/<번호>  {tkey} → PIN-1(11-14) 그 번호의 핀만 비움(판·요약·시각은 그대로 · 틀린 횟수·잠금 0) {ok, had:1} · 그 번호 줄이 없으면 {ok, had:0}
     교사 열쇠 확인 = /class와 같은 자리(틀리면 세고 다섯 번이면 10분 잠금 · 열쇠가 없으면 404 {nokey:1})
     핀이 빈 줄 = 들어오는 길에서만 새로 잡음: 다음 /load가 보낸 핀이 새 핀(판은 그대로 돌려줌) · /drop은 받지 않음(403 {nopin:1} — 아무 핀으로나 판을 지우지 못하게)
     PIN-1B(11-14) 열려 있던 창은 다시 못 잡음: 핀이 빈 줄에 /save 또는 주기 확인(/load {chk:1})이 오면 409 {relog:1}(판·핀 그대로 · 틀린 횟수 X) — 그 창은 저장을 멈추고 「새로고침해서 다시 들어와요」
   - 교사 열쇠 = 6~32자(띄어쓰기 X) · 소금(PEPPER + 반 코드) + SHA-256 해시만 둠 · 5번 틀리면 10분 잠금(정하기 다툼 409도 틀림으로 셈)
   - 요약은 저장할 때 한 번 만들어 둠(표를 열 때 판 25개를 다시 읽지 않음) · 예전 판(요약 없음)은 표를 열 때 열 개씩 채움 */
const TKEY_RX = /^\S{6,32}$/, TLOCK_MS = 10 * 60 * 1000, TFILL_MAX = 10;
async function teachRoute(req, env, kind, code, num = 0) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (!originOk(req.headers.get('Origin'))) return text('허락되지 않은 곳이에요', 403);
  if (req.method !== 'POST') return json(req, { ok: false, m: 'POST로 보내요' }, 405);
  if (!CLASS_RX.test(code)) return json(req, { ok: false, m: '반 코드는 영문·숫자 4~8자' }, 400);
  if (kind === 'pinclear' && !(num >= 1 && num <= 40)) return json(req, { ok: false, m: '번호는 1~40' }, 400);
  const body = await req.text(); if (body.length > 1000) return json(req, { ok: false, m: '너무 길어요' }, 413);
  const stub = env.SAVES.get(env.SAVES.idFromName(code.toLowerCase()));
  const r = await stub.fetch('https://saves/t/' + kind + '/' + code.toLowerCase() + (kind === 'pinclear' ? '/' + num : ''), { method: 'POST', body });
  const out = await r.text(); return new Response(out, { status: r.status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors(req) } });
}
async function keyHash(pepper, code, key) { const b = new TextEncoder().encode((pepper || 'sm-town') + '|' + code + '|T|' + key); const h = await crypto.subtle.digest('SHA-256', b); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }
/* CLASS-MP 입장표 — 방 = 'c' + HMAC(PEPPER, 반 코드) 7자 · 표 = '번호.날.서명' (날 = UTC 날 번호 · 그날과 다음 날까지) · 값은 어디에도 찍지 않음 */
let HK = null, HKP = null;
async function hmac(pepper, msg) { const p = pepper || 'sm-town'; if (!HK || HKP !== p) { HKP = p; HK = await crypto.subtle.importKey('raw', new TextEncoder().encode(p), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); } const s = await crypto.subtle.sign('HMAC', HK, new TextEncoder().encode(msg)); return [...new Uint8Array(s)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function mpOf(pepper, code, num, now) { const r = 'c' + (await hmac(pepper, 'room|' + code)).slice(0, 7), d = Math.floor(now / 86400000); return { r, u: num, tk: num + '.' + d + '.' + (await hmac(pepper, 'tk|' + r + '|' + num + '|' + d)).slice(0, 24) }; }
export async function tkCheck(pepper, rn, tk, now) { const m = /^(\d{1,2})\.(\d{5,6})\.([0-9a-f]{24})$/.exec(String(tk || '')); if (!m) return null; const u = +m[1], d = +m[2], g = Math.floor(now / 86400000) - d; if (!(u >= 1 && u <= 40) || g < 0 || g > 1) return null;
  return sameStr(m[3], (await hmac(pepper, 'tk|' + rn + '|' + u + '|' + d)).slice(0, 24)) ? u : null; }
function sameStr(a, b) { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0); return d === 0; }
function sumOf(dataStr) { try { const s = tsum(JSON.parse(dataStr)); return s ? JSON.stringify(s) : null; } catch (e) { return null; } }

async function pinHash(pepper, code, num, pin) { const b = new TextEncoder().encode((pepper || 'sm-town') + '|' + code + '|' + num + '|' + pin); const h = await crypto.subtle.digest('SHA-256', b); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }
const NAME_KEYS = new Set(['name', 'nick', 'realName']);
function noNames(v, d = 0) { if (d > 12 || !v || typeof v !== 'object') return v; if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = noNames(v[i], d + 1); return v; } for (const k of Object.keys(v)) { if (NAME_KEYS.has(k) && typeof v[k] === 'string') delete v[k]; else v[k] = noNames(v[k], d + 1); } return v; }

export class Saves extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.env = env; this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS s (num INTEGER PRIMARY KEY, pin TEXT, data TEXT, at INTEGER, fails INTEGER DEFAULT 0, lock INTEGER DEFAULT 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS d (day TEXT PRIMARY KEY, c INTEGER)');
    /* TEACH-1: 판 요약 칸(예전 표에 한 번 더함 · 이미 있으면 그대로) + 교사 열쇠 표(반 하나 = 한 줄) */
    try { this.sql.exec('ALTER TABLE s ADD COLUMN sum TEXT'); } catch (e) { /* 이미 있음 */ }
    this.sql.exec('CREATE TABLE IF NOT EXISTS t (k INTEGER PRIMARY KEY, h TEXT, fails INTEGER DEFAULT 0, lock INTEGER DEFAULT 0, at INTEGER)');
    try { this.sql.exec('ALTER TABLE t ADD COLUMN mp INTEGER DEFAULT 1'); } catch (e) { /* CLASS-MP 「우리 반 함께 보기」 스위치(처음 = 켬) · 이미 있음 */ }
  }
  async mp(code, num, now) { const t = this.sql.exec('SELECT mp FROM t WHERE k = 1').toArray()[0]; return t && t.mp === 0 ? 0 : mpOf(this.env.PEPPER, code, num, now); }   /* CLASS-MP: 스위치가 꺼졌으면 0 · 반 칸(열쇠)이 없으면 켬 */
  async teach(kind, code, d, now, num = 0) {
    const tk = String((d && d.tkey) || ''); if (!TKEY_RX.test(tk)) return Response.json({ ok: false, m: '교사 열쇠는 띄어쓰기 없이 6~32자예요' }, { status: 400 });
    const h = await keyHash(this.env.PEPPER, code, tk), row = this.sql.exec('SELECT h, fails, lock FROM t WHERE k = 1').toArray()[0];
    if (kind === 'treset') {
      if (!this.env.ADMIN || !sameStr(String((d && d.admin) || ''), this.env.ADMIN)) return Response.json({ ok: false, m: '관리 열쇠가 달라요' }, { status: 403 });
      this.sql.exec('INSERT INTO t (k, h, fails, lock, at) VALUES (1, ?, 0, 0, ?) ON CONFLICT(k) DO UPDATE SET h = excluded.h, fails = 0, lock = 0, at = excluded.at', h, now); return Response.json({ ok: true, reset: 1 });
    }
    if (!row) {
      if (kind === 'tclaim') { this.sql.exec('INSERT INTO t (k, h, fails, lock, at) VALUES (1, ?, 0, 0, ?)', h, now); return Response.json({ ok: true, made: 1 }); }
      return Response.json({ ok: false, nokey: 1, m: '이 반은 아직 교사 열쇠가 없어요' }, { status: 404 });
    }
    if (row.lock > now) return Response.json({ ok: false, lock: 1, m: '잠깐 잠겼어요. 10분 뒤에 다시 해요' }, { status: 423 });
    if (row.h !== h) { const f = (row.fails || 0) + 1; this.sql.exec('UPDATE t SET fails = ?, lock = ? WHERE k = 1', f >= 5 ? 0 : f, f >= 5 ? now + TLOCK_MS : 0); return kind === 'tclaim' ? Response.json({ ok: false, taken: 1, m: '이 반은 이미 다른 교사 열쇠가 있어요' }, { status: 409 }) : Response.json({ ok: false, bad: 1, m: '교사 열쇠가 달라요' }, { status: 403 }); }
    if (row.fails || row.lock) this.sql.exec('UPDATE t SET fails = 0, lock = 0 WHERE k = 1');
    if (kind === 'tclaim') return Response.json({ ok: true, made: 0 });
    if (kind === 'tset') { const v = d && d.mp ? 1 : 0; this.sql.exec('UPDATE t SET mp = ? WHERE k = 1', v); return Response.json({ ok: true, mp: v }); }   /* CLASS-MP 「우리 반 함께 보기」 켬·끔(다음 /load·/save부터) */
    if (kind === 'pinclear') {   /* PIN-1: 그 번호 핀만 비움(판·요약·시각 그대로) — 다음에 들어오는 아이가 새 핀을 정함 */
      const pr = this.sql.exec('SELECT num FROM s WHERE num = ?', num).toArray()[0];
      if (pr) this.sql.exec("UPDATE s SET pin = '', fails = 0, lock = 0 WHERE num = ?", num);
      return Response.json({ ok: true, had: pr ? 1 : 0 });
    }
    if (kind !== 'class') return Response.json({ ok: false, m: '없는 주소예요' }, { status: 404 });
    /* class: 번호 · 마지막 저장 · 요약만(판 전체 X) */
    let fill = 0; const L = [];
    for (const r of this.sql.exec('SELECT num, at, sum, pin FROM s ORDER BY num').toArray()) {
      let s = r.sum;
      if (!s && fill < TFILL_MAX) { fill++; const dr = this.sql.exec('SELECT data FROM s WHERE num = ?', r.num).toArray()[0]; s = dr && dr.data ? sumOf(dr.data) : null; if (s) this.sql.exec('UPDATE s SET sum = ? WHERE num = ?', s, r.num); }
      let o = null; try { o = s ? JSON.parse(s) : null; } catch (e) { o = null; }
      L.push(r.pin ? { n: r.num, at: r.at, s: o } : { n: r.num, at: r.at, s: o, np: 1 });   /* np = 핀이 비어 있음(선생님이 풀었고 아직 새로 안 정함 · 핀 값은 보내지 않음) */
    }
    const m9 = this.sql.exec('SELECT mp FROM t WHERE k = 1').toArray()[0];
    return Response.json({ ok: true, at: now, L, mp: m9 && m9.mp === 0 ? 0 : 1 });
  }
  async fetch(req) {
    const [, kind, code, n] = new URL(req.url).pathname.split('/'), num = +n, now = Date.now();
    let d; try { d = JSON.parse(await req.text()); } catch (e) { return Response.json({ ok: false, m: '읽을 수 없는 저장' }, { status: 400 }); }
    if (kind === 't') { const [, , tk, tcode, tn] = new URL(req.url).pathname.split('/'); return this.teach(tk, tcode, d, now, +tn || 0); }
    const pin = String((d && d.pin) || ''); if (!/^\d{4}$/.test(pin)) return Response.json({ ok: false, m: '비밀번호는 숫자 네 자리' }, { status: 400 });
    const row = this.sql.exec('SELECT pin, data, at, fails, lock FROM s WHERE num = ?', num).toArray()[0];
    const h = await pinHash(this.env.PEPPER, code, num, pin);
    if (row) {
      if (row.lock > now) return Response.json({ ok: false, m: '잠깐 잠겼어요. 1분 뒤에 다시 해요', lock: 1 }, { status: 423 });
      if (!row.pin) {   /* PIN-1: 선생님이 푼 번호 = 들어오는 길(/load)에서 보낸 핀이 새 핀(판은 그대로) · 지우기는 받지 않음 */
        if (kind === 'drop') return Response.json({ ok: false, m: '비밀번호를 먼저 새로 정해요', nopin: 1 }, { status: 403 });
        if (row.data && (kind === 'save' || (d && d.chk))) return Response.json({ ok: false, m: '비밀번호가 풀렸어요. 새로고침해서 다시 들어와요', relog: 1 }, { status: 409 });   /* PIN-1B: 열려 있던 창(주기 저장 /save · 주기 확인 /load {chk:1})은 다시 잡지 못함 — 판·핀 그대로 · 틀린 횟수로 세지 않음 */
        this.sql.exec('UPDATE s SET pin = ?, fails = 0 WHERE num = ?', h, num);
      } else if (row.pin !== h) { const f = (row.fails || 0) + 1; this.sql.exec('UPDATE s SET fails = ?, lock = ? WHERE num = ?', f >= 5 ? 0 : f, f >= 5 ? now + 60000 : 0, num); return Response.json({ ok: false, m: '비밀번호가 달라요', bad: 1 }, { status: 403 }); }
      else if (row.fails) this.sql.exec('UPDATE s SET fails = 0 WHERE num = ?', num);
    }
    if (kind === 'drop') { if (row) this.sql.exec('DELETE FROM s WHERE num = ?', num); return Response.json({ ok: true, dropped: row ? 1 : 0 }); }   /* 내 저장 지우기(핀이 맞을 때 · 시험 판 zz 치우기) */
    if (kind === 'load') return Response.json(row && row.data ? { ok: true, at: row.at, data: JSON.parse(row.data), mp: await this.mp(code, num, now) } : { ok: true, none: 1 });   /* CLASS-MP: 핀이 맞은 판에만 입장표 */
    const day = new Date(now).toISOString().slice(0, 10), c = (this.sql.exec('SELECT c FROM d WHERE day = ?', day).toArray()[0] || { c: 0 }).c;
    if (c >= SAVE_DAY_MAX) return Response.json({ ok: false, m: '오늘은 저장이 꽉 찼어요. 이 기기에는 남아 있어요', full: 1 }, { status: 429 });
    if (!d.data || typeof d.data !== 'object' || Array.isArray(d.data)) return Response.json({ ok: false, m: '저장할 것이 없어요' }, { status: 400 });
    const clean = noNames(d.data), data = JSON.stringify(clean); if (data.length > SAVE_MAX) return Response.json({ ok: false, m: '저장이 너무 커요' }, { status: 413 });
    let sum = null; try { const s9 = tsum(clean); sum = s9 ? JSON.stringify(s9) : null; } catch (e) { sum = null; }   /* TEACH-1 교사 표 요약(저장할 때 한 번) */
    this.sql.exec('INSERT INTO s (num, pin, data, at, fails, lock, sum) VALUES (?, ?, ?, ?, 0, 0, ?) ON CONFLICT(num) DO UPDATE SET data = excluded.data, at = excluded.at, sum = excluded.sum', num, h, data, now, sum);
    this.sql.exec('INSERT INTO d (day, c) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET c = c + 1', day);
    if (Math.random() < 0.02) this.sql.exec('DELETE FROM d WHERE day < ?', new Date(now - 7 * 86400000).toISOString().slice(0, 10));
    return Response.json({ ok: true, at: now, mp: await this.mp(code, num, now) });
  }
}
