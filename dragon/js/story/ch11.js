// 11장 자리표시 — 팀이 채움(design §2 · handoff '장 하나 더하기')
import { sayAll } from './runner.js?v=15';
export const chapter = { id: 11, title: '11장 (준비 중)', sub: '', steps: [{ id: '11-0', place: 'village', time: 'day', at: 'plaza', run: function* (G) { yield* sayAll(G, [['hiccup', '(이 장은 만드는 중이에요)']]); return true; } }] };
