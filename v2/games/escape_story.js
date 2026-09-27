// 학교 방탈출 — 이야기 파일(아이들이 채우는 곳) · 게임 = v2/games/escape.js · 설명서 = docs/map_api.md §12
//
// ✏️ 고치는 법(교사·아이들)
//   1. 괄호 '( … )' 로 된 자리표시 글을 아이들이 쓴 글로 바꾼다. 따옴표(' ')와 쉼표(,)는 지우지 않는다. 줄을 바꾸려면 \n 을 쓴다.
//   2. 저장하고 새로고침하면 끝 — 캐시 번호(?v=)를 올리지 않아도 된다(게임이 이 파일을 매번 새로 읽는다).
//   3. 방 차례·방 이름(zone)을 바꾸면 그 방에서 판이 열린다. zone = 지도에 있는 실 이름(예: '과학실' '도서실' '교무실' '컴퓨터실' '보건실').
//      문이 있는 실이어야 하고, 마지막 방(chaser: true)에는 순찰 로봇(밤: 장난감 유령)이 나온다.
//   4. enter(방에 들어섰을 때) · solved(자물쇠를 풀었을 때) · intro · nightIntro · ending 은 '장면 동작' 목록이다. 한 줄 = 동작 하나.
//      쓸 수 있는 동작(행동 사전 — docs/map_api.md §11.7):
//        { op: 'note', title: '제목', body: '글' }      쪽지 보여 주기(닫을 때까지 기다림)
//        { op: 'toast', text: '짧은 알림' }              화면 아래 짧은 글
//        { op: 'sound', sfx: 'ding' }                    소리(ding·pick·done·go·tick·buzz)
//        { op: 'time', k: 'sunset' }                     시간대(day·sunset·night) — 게임이 끝나면 원래대로
//        { op: 'fade', sec: 1 }                          어두워졌다 밝아지기
//        { op: 'wait', sec: 1 }                          잠깐 기다리기
//        { op: 'flag', k: '이름' }                       기억 표시(나중에 다른 장면 조건으로)
//   ⚠️ 글은 아이들이 쓴 것만 넣는다(Claude가 지어 넣지 않는다) · 사람(선생님·친구)을 술래·적으로 쓰지 않는다 · 무섭거나 다치는 장면은 쓰지 않는다.
//   rule = 번호 자물쇠 창에 보이는 짧은 규칙 안내(화면 문구 — 바꿔도 된다). 자물쇠 번호는 게임이 방 안 물건에서 정한다:
//     count  = 방에 흩어 놓은 상자 수(한 자리)       · 상자 수는 판마다 다르다(3~6)
//     colors = 게시판에 보이는 색 순서대로 그 색 책의 숫자(세 자리) · 책 4권 중 3권만 순서에 든다
//     order  = 쪽지 3장에 적힌 '몇째 자리 = 숫자'를 모아(세 자리)
export const STORY = {
  intro: [
    { op: 'note', title: '(시작 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 시작 이야기)' },
  ],
  nightIntro: [
    { op: 'note', title: '(밤 시작 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 밤 이야기)' },
  ],
  rooms: [
    {
      zone: '과학실', puzzle: 'count', rule: '힌트: 🟫 이 방 상자 수',
      board: { title: '(과학실 퍼즐 문제 자리)', body: '(여기에 아이들이 낸 문제)' },
      enter: [{ op: 'toast', text: '(과학실에 들어섰을 때 한 줄 자리)' }],
      solved: [{ op: 'note', title: '(과학실을 풀었을 때 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 글)' }],
      key: { icon: '🔑', label: '도서실 열쇠' },
    },
    {
      zone: '도서실', puzzle: 'colors', rule: '힌트: 게시판 색 순서대로 📚 책 숫자',
      board: { title: '(도서실 퍼즐 문제 자리)', body: '(여기에 아이들이 낸 문제)' },
      clue: { title: '(책 속 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 책 속 글)' },
      enter: [{ op: 'note', title: '(도서실에 들어섰을 때 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 글)' }],
      solved: [{ op: 'note', title: '(도서실을 풀었을 때 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 글)' }],
      key: { icon: '🗝️', label: '교무실 열쇠' },
    },
    {
      zone: '교무실', puzzle: 'order', chaser: true, rule: '힌트: 📄 쪽지 3장의 자리 숫자',
      board: null,
      clue: { title: '(교무실 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 쪽지)' },
      enter: [{ op: 'note', title: '(교무실에 들어섰을 때 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 글)' }],
      solved: [{ op: 'sound', sfx: 'done' }],
    },
  ],
  ending: [
    { op: 'fade', sec: 1.2 },
    { op: 'note', title: '(마무리 쪽지 제목 자리)', body: '(여기에 아이들이 쓴 마무리 글)' },
  ],
};
