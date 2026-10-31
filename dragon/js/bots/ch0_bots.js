// 0장 봇 — 오프닝은 쉬움 고정 비행(이음 · 30초) → 팀 F 비행 봇을 쉬움으로 · s = 반응 늦은 감각 · story_bots.js가 합침
export const BOTS = {};
BOTS['0-0'] = (s, K, M, B) => { if (s.mode === 'fly' && window.DRG_FLYBOT) { if (!M.fb) { K.releaseAll(); M.fb = window.DRG_FLYBOT('easy'); } M.fb(window.DRG.loop.n, B); } };
