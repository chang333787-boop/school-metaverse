// 오프닝 — 먼 훗날 맛보기(design §0): 영상 대신 투슬리스를 직접 몬다(탑뷰 바다 위) · 떨어지지 않음(쉬움 도움 고정) → '처음엔 히컵도 드래곤이 무서웠어요'
import { say, wait } from './kit.js?v=1';
import { createFlight, addStack, addCloud } from '../play/flight.js?v=1';

export const chapter = {
  id: 0, title: '먼 훗날', sub: '먼 훗날, 버크의 하늘', place: 'sea', time: 'sunset',
  end: '처음엔 히컵도 드래곤이 무서웠어요',
  steps: [{
    id: '0-1', verb: 'fly', free: 1, goal: '투슬리스와 날아 봐요', limit: 60, at: [24, 0],
    hints: ['←→로 옆으로 비켜요', 'X를 누르고 있으면 꼬리를 펴서 휙 꺾여요'],
    *run(G) {
      const F = G.Fl = createFlight(24, 0, { speed: 10, assist: true, fin: 'new', lane: [10, 38] }); G.mode = 'fly'; G.P.cam = 'fly';
      const R = G.rng;
      for (let i = 0; i < 16; i++) addStack(F, 12 + R() * 24, -18 - i * 14 - R() * 5, 1.1 + R() * 0.8);
      for (let i = 0; i < 10; i++) addCloud(F, 12 + R() * 24, -10 - i * 24, 8 + R() * 4, 5);
      say(G, 'hiccup', '바람이 좋다, 투슬리스!');
      let t = 0, said = false;
      while (F.y > -240) {
        const dt = yield; t += dt;
        if (F.splashT > 0) F.splashT = Math.min(F.splashT, 0.3);
        if (t > 6 && !said) { said = true; say(G, 'hiccup', '이렇게 되기까지… 처음부터 이야기해 줄게.'); }
      }
      yield* wait(0.8);
      return true;
    },
  }],
};
