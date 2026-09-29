// ============================================================
// 우리 학교 견학(TOUR-1 · PROMO-1) — 선생님이 직접 쓰는 글 파일 (이 파일 하나만 고치면 됩니다)
// ============================================================
// 여는 곳:  홍보판 = https://chang333787-boop.github.io/school-metaverse/  (▶ 시작하기 → 바로 견학)
//           우리 학교용 = …/school-metaverse/v2/ 의 🎮 놀이 → '우리 학교 견학'  (또는 주소 끝 ?game=tour)
//
// ✏️ 고치는 법
//   · 괄호 '(여기에 …를 써 주세요)' 부분을 지우고 실제 글로 바꿔 쓰세요. 따옴표 ' ' 안에만 쓰면 됩니다.
//   · 한 곳의 말(pages)은 여러 쪽으로 나눌 수 있어요 — 쉼표로 이어서 '…', '…' 처럼. 한 쪽은 2~4문장이 읽기 좋아요.
//   · 글 안에서 줄을 바꾸려면 \n 을 쓰세요.  작은따옴표(')를 글에 쓰려면 \' 로 쓰세요.
//   · 그곳을 견학에서 빼려면 on: false 로 바꾸세요(사람·안내판은 맵에 그대로 있고 도장 칸만 빠져요).
//   · stamp = 도장 칸에 찍히는 그림(이모지 하나) · where = 길 안내 줄에 나오는 위치(짧게)
//   · 이 파일은 견학을 켤 때마다 새로 읽어요 — 고친 뒤 캐시 번호를 올릴 필요가 없어요(새로고침만).
//
// 🎬 유튜브 영상 넣는 법 (videos) — 이야기 창에 [🎬 관련 영상 보기] 버튼이 생기고, 누르면 화면 안에서 바로 재생돼요(링크로 나가지 않음)
//   · url 칸에 유튜브 주소를 그대로 붙여 넣으면 돼요 — 'https://youtu.be/abcdEFGhijk' · 'https://www.youtube.com/watch?v=abcdEFGhijk' · 쇼츠 주소 모두 OK
//   · 영상이 여러 개면 { title: '제목', url: '주소' } 를 쉼표로 더 이어 쓰세요. url이 빈 칸('')이면 버튼이 안 보여요.
//   · 영상은 유튜브에서 '공개' 또는 '일부 공개'여야 하고, '퍼가기 허용'이 켜져 있어야 화면 안에서 재생돼요.
//
// 🖼 사진 넣는 법 (photos) — [🖼 사진 보기] 버튼이 생기고, 누르면 사진을 넘겨 볼 수 있어요
//   · 사진 파일을 저장소의 v2/games/tour_media/ 폴더에 올리고  { src: 'tour_media/파일이름.jpg', caption: '사진 설명' } 처럼 쓰세요.
//   · 인터넷에 이미 있는 사진이면 src에 'https://…' 주소를 써도 돼요.
//   · 사진은 긴 변 1600px 이하 · 1장 500KB 이하로 줄여서 올리면 휴대폰에서도 빨리 열려요.
//
// ⚠️ 공개 저장소·공개 홍보 페이지예요: 학생 이름·얼굴이 나온 사진·연락처는 넣지 마세요(학생은 'N학년 친구'로).
//
// 키(key)는 맵의 사람·안내판 자리와 짝이에요(world.js가 놓는 곳) — 키 이름은 바꾸지 마세요.
//   guide(선생님): vice 교감(스쿨버스 앞 — 도장 대신 '학교 정보 모아 보기') · principal 교장(교장실) · pe 체육(체육관)
//                  ai AI 교육 선생님(컴퓨터실) · class1~class6 각 반 담임선생님(교실) · library 사서(도서관) · nurse 보건(보건실)
//                  sarang 사랑반선생님(사랑반) · care 돌봄(돌봄교실) · kinder 유치원 · science 과학(과학실 — 지금은 꺼 둠)
//   board(안내판): bus 스쿨버스 · playground 놀이터 · forest 숲놀이터 · field 운동장 · bigtree 큰 나무 · garden 텃밭 · cafeteria 급식실(복도 벽)
// ============================================================

export const TOUR = {
  // 견학을 시작할 때 뜨는 첫 인사(스쿨버스 앞)
  welcome: [
    '(여기에 견학 첫 인사말을 써 주세요 — 예: 방문해 주신 분께 드리는 환영 인사)',
  ],
  // 도장을 모두 모았을 때 뜨는 마무리 말
  finish: [
    '(여기에 견학을 마친 분께 드리는 마무리 인사를 써 주세요)',
  ],

  // 추천 순서(길 안내 '다음 추천'이 이 순서를 따릅니다 — 빼거나 순서를 바꿔도 돼요)
  order: ['bus', 'playground', 'forest', 'bigtree', 'field', 'principal', 'ai', 'class1', 'class3', 'cafeteria', 'class2', 'class4', 'garden',
    'kinder', 'sarang', 'care', 'nurse', 'library', 'class6', 'class5', 'pe'],

  spots: {
    // ---------- 교감선생님 = 안내 데스크(도장 없음) — 마지막 쪽에서 [📖 학교 정보 모두 보기]로 모든 곳의 이야기·영상을 한눈에 ----------
    vice: { on: true, hub: true, name: '교감선생님', where: '스쿨버스 앞', pages: [
      '(여기에 교감선생님의 환영 인사를 써 주세요 — 매일 스쿨버스를 마중 나가시는 곳이에요)',
      '학교 곳곳을 다 돌아보지 않아도 괜찮아요.\n아래 [📖 학교 정보 모두 보기]를 누르면 우리 학교 이야기와 영상을 한눈에 볼 수 있어요.',
    ] },

    // ---------- 바깥 ----------
    bus: { on: true, name: '스쿨버스', where: '운동장 남쪽 버스 옆', stamp: '🚌', pages: [
      '우리 학교 스쿨버스예요.',
      '(여기에 통학버스 설명을 써 주세요 — 예: 타는 곳·다니는 길)',
      '(여기에 체험학습 때 버스를 타고 가는 이야기를 써 주세요)',
    ], videos: [
      { title: '통학버스', url: '' },
      { title: '체험학습 가는 날', url: '' },
    ], photos: [] },
    playground: { on: true, name: '놀이터', where: '운동장 남서쪽 놀이터', stamp: '🛝', pages: [
      '우리 학교 놀이터예요.\n(여기에 놀이터 설명을 써 주세요)',
    ], videos: [{ title: '놀이터', url: '' }], photos: [] },
    forest: { on: true, name: '숲놀이터', where: '운동장 남동쪽 숲놀이터', stamp: '🌳', pages: [
      '우리 학교 숲놀이터예요.\n(여기에 숲놀이터 설명을 써 주세요)',
    ], videos: [{ title: '숲놀이터', url: '' }], photos: [] },
    field: { on: true, name: '운동장', where: '구령대 옆 운동장 북쪽', stamp: '🏃', pages: [
      '우리 학교 운동장이에요.\n(여기에 운동장 설명을 써 주세요)',
    ], videos: [{ title: '운동장', url: '' }], photos: [] },
    bigtree: { on: true, name: '큰 나무', where: '운동장 동쪽 큰 나무 아래', stamp: '🌲', pages: [
      '우리 학교 큰 나무예요.\n(여기에 큰 나무 설명을 써 주세요)',
    ], videos: [{ title: '큰 나무', url: '' }], photos: [] },
    garden: { on: true, name: '텃밭', where: '학교 뒤 텃밭 길', stamp: '🌱', pages: [
      '우리 학교 텃밭이에요.\n(여기에 텃밭 설명을 써 주세요)',
    ], videos: [{ title: '텃밭', url: '' }], photos: [] },
    pe: { on: true, name: '체육관', where: '서쪽 체육관 무대 앞', stamp: '⚽', pages: [
      '안녕하세요, 체육선생님이에요. 여기는 우리 학교 체육관이에요.\n(여기에 체육관·체육 수업 소개를 써 주세요)',
    ], videos: [{ title: '체육관', url: '' }], photos: [] },

    // ---------- 본관·서관·동관 ----------
    principal: { on: true, name: '교장실', where: '본관 1층 교장실', stamp: '🏫', pages: [
      '(여기에 교장선생님 인사말을 써 주세요)',
      '(여기에 교장선생님이 소개하는 우리 학교 이야기를 써 주세요)',
    ], videos: [{ title: '교장선생님 인사', url: '' }], photos: [] },
    ai: { on: true, name: '컴퓨터실', where: '본관 1층 컴퓨터실', stamp: '💻', pages: [
      '안녕하세요, AI 교육 선생님이에요. 여기는 컴퓨터실이에요.\n(여기에 컴퓨터실·AI 교육 소개를 써 주세요)',
    ], videos: [{ title: 'AI 교육', url: '' }], photos: [] },
    cafeteria: { on: true, name: '급식실', where: '본관 복도 급식실 입구 옆', stamp: '🍚', pages: [
      '우리 학교 급식실이에요.\n(여기에 급식실 설명을 써 주세요)',
    ], videos: [{ title: '급식실', url: '' }], photos: [] },
    care: { on: true, name: '돌봄교실', where: '본관 1층 돌봄교실', stamp: '🎒', pages: [
      '안녕하세요, 돌봄선생님이에요. 여기는 돌봄교실이에요.\n(여기에 돌봄교실 소개를 써 주세요)',
    ], videos: [{ title: '돌봄교실', url: '' }], photos: [] },
    kinder: { on: true, name: '유치원', where: '본관 1층 서쪽 유치원', stamp: '🧸', pages: [
      '안녕하세요, 유치원선생님이에요. 여기는 우리 학교 병설유치원이에요.\n(여기에 유치원 소개를 써 주세요)',
    ], videos: [{ title: '유치원', url: '' }], photos: [] },
    nurse: { on: true, name: '보건실', where: '서관 1층 보건실', stamp: '🩹', pages: [
      '안녕하세요, 보건선생님이에요. 여기는 보건실이에요.\n(여기에 보건실 소개를 써 주세요)',
    ], videos: [{ title: '보건실', url: '' }], photos: [] },
    library: { on: true, name: '도서관', where: '서관 1층 도서관', stamp: '📚', pages: [
      '안녕하세요, 사서선생님이에요. 여기는 우리 학교 도서관이에요.\n(여기에 도서관 소개를 써 주세요)',
    ], videos: [{ title: '도서관', url: '' }], photos: [] },
    sarang: { on: true, name: '사랑반', where: '본관 1층 사랑반', stamp: '💗', pages: [
      '안녕하세요, 사랑반선생님이에요. 여기는 사랑반이에요.\n(여기에 사랑반 소개를 써 주세요)',
    ], videos: [{ title: '사랑반', url: '' }], photos: [] },
    science: { on: false, name: '과학실', where: '동관 과학실', stamp: '🔬', pages: [
      '(여기에 과학선생님의 과학실 소개를 써 주세요)',
    ] },

    // ---------- 각 반(담임선생님이 반을 소개하고 도장을 찍어 줘요) ----------
    class1: { on: true, name: '1학년 교실', where: '본관 1층 동쪽 1학년', stamp: '1️⃣', pages: [
      '안녕하세요! 여기는 1학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '1학년', url: '' }], photos: [] },
    class2: { on: true, name: '2학년 교실', where: '동관 2학년', stamp: '2️⃣', pages: [
      '안녕하세요! 여기는 2학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '2학년', url: '' }], photos: [] },
    class3: { on: true, name: '3학년 교실', where: '본관 1층 동쪽 끝 3학년', stamp: '3️⃣', pages: [
      '안녕하세요! 여기는 3학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '3학년', url: '' }], photos: [] },
    class4: { on: true, name: '4학년 교실', where: '동관 4학년', stamp: '4️⃣', pages: [
      '안녕하세요! 여기는 4학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '4학년', url: '' }], photos: [] },
    class5: { on: true, name: '5학년 교실', where: '서관 2층 5학년', stamp: '5️⃣', pages: [
      '안녕하세요! 여기는 5학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '5학년', url: '' }], photos: [] },
    class6: { on: true, name: '6학년 교실', where: '서관 2층 6학년', stamp: '6️⃣', pages: [
      '안녕하세요! 여기는 6학년 교실이에요.\n(여기에 반 소개를 써 주세요 — 예: 우리 반은 ○○반입니다~)',
    ], videos: [{ title: '6학년', url: '' }], photos: [] },
  },
};
