# 화면 글 속 작업 흔적 걸러 내기(내보내기 전용 · 원본은 그대로)
#   '(교사 10-15 ✨)' · '(패들렛 47)' · '✨ 사용자 승인 10-18 · 교사 확인 — …' · '둘레 판(10-15)도' 같은 작업 일지 조각만 빼고
#   아이가 읽을 뜻(무엇을 · 어디에 · ✨ = AI가 채움)은 남긴다. 나누는 곳 = ' · ' · ' — ' (괄호·「」 안은 나누지 않음)
import re

ROLE = r'(?:교사|사용자|또래|코덱스|아이 눈)'
DATE = r'(?:0?9|10|11)-\d{1,2}'
QUAL = r'(?:승인|확인 전|확인|요청|' + DATE + r'|✨|「[^」]*」|고장 개연성)'
DEVSEG = re.compile(r'(?:🙋\s*)?(?:✨\s*)?' + ROLE + r'(?:\s*' + QUAL + r')+\s*')   # 맨 낱말 '교사'(직업 이름)는 그대로 — 날짜·확인·✨ 같은 꼬리가 붙어야 작업 흔적
PADSEG = re.compile(r'(?:🙋\s*)?패들렛(?:\s*[\d·/]+)?\s*')
DATESEG = re.compile(r'\s*' + DATE + r'\s*')
ROLEPRE = re.compile(r'^(✨\s*)?' + ROLE + r'(?:\s*(?:승인|확인|요청))?\s+' + DATE + r'\s+(?=\S)')
OPEN, CLOSE = '(「『“[', ')」』”]'
SEPS = (' · ', ' — ')


def _split_top(s):
    """괄호 밖의 ' · '·' — '에서 나눔 → [(앞 나눔표, 조각)]"""
    out, depth, cur, sep, i = [], 0, '', '', 0
    while i < len(s):
        c = s[i]
        if c in OPEN:
            depth += 1
        elif c in CLOSE and depth:
            depth -= 1
        if depth == 0:
            hit = next((p for p in SEPS if s.startswith(p, i)), None)
            if hit:
                out.append((sep, cur))
                sep, cur = hit, ''
                i += len(hit)
                continue
        cur += c
        i += 1
    out.append((sep, cur))
    return out


def _inline(seg):
    seg = re.sub(r'🙋\s*패들렛 사진', '🙋 아이 사진', seg)
    seg = re.sub(r'패들렛(?:\s*[\d·/]+)?\s*사진', '아이 사진', seg)
    seg = re.sub(r'([가-힣]{2,3}) 패들렛 [\d·/]+\s+', r'\1의 ', seg)
    seg = re.sub(r'패들렛 [\d·/]+\s*', '', seg)
    seg = ROLEPRE.sub(lambda m: m.group(1) or '', seg)
    return seg


def _filter(text, date_only):
    parts = _split_top(text)
    kept, spark = [], False
    for sep, seg in parts:
        core = seg.strip()
        dev = bool(core) and (DEVSEG.fullmatch(core) or PADSEG.fullmatch(core) or (date_only and DATESEG.fullmatch(core)))
        if dev:
            spark = spark or '✨' in core
            continue
        kept.append([sep, _inline(seg)])
    if not kept or all(not s.strip() for _, s in kept):
        return '✨' if spark else ''
    kept[0][0] = ''
    if spark and not any('✨' in s for _, s in kept):
        kept[0][1] = '✨ ' + kept[0][1].lstrip()
    return ''.join(sep + seg for sep, seg in kept)


CMT = re.compile(r'/\*.*?\*/', re.S)


def strip_inner_comments(text):
    """문자열 속 CSS·GLSL 덩이 주석(/* … */)만 뺌 — 짝이 맞을 때만"""
    if '/*' not in text or text.count('/*') != text.count('*/'):
        return text
    return CMT.sub(' ', text)


def scrub(text, date_only=False):
    if not re.search(ROLE + r'|패들렛|' + DATE, text):
        return text
    # 1) 괄호 묶음 (…) 을 안쪽부터
    def paren(m):
        inner = m.group(1)
        new = _filter(inner, date_only=date_only)
        if new == inner:
            return m.group(0)
        return '(' + new + ')' if new else '\0'
    prev = None
    s = text
    while prev != s:
        prev = s
        s = re.sub(r'\(([^()]*)\)', lambda m: paren(m) if re.search(ROLE + r'|패들렛|' + DATE, m.group(1)) else m.group(0).replace('(', '\1').replace(')', '\2'), s)
    s = s.replace('\1', '(').replace('\2', ')')
    s = re.sub(r'\s?\0', '', s)
    # 2) 괄호 밖 조각
    s = _filter(s, date_only)
    return s


if __name__ == '__main__':
    T = ['보라 종이 칸 + 판 밖 바다(✨) · 물가는 굽은 만으로(또래 10-15)',
         '✨ 사용자 승인 10-18 · 교사 확인 — 판 남동쪽 밖 지층 절벽·폭포·화석 골짜기',
         '✨ AI가 채운 빈칸(교사 확인 전 · 10-24)',
         '아이가 블록·종이를 놓지 않은 자리도 이름표와 둘레에 맞게 완성된 동네로 채웠어요(교사 10-13 — 건물·나무·길가 시설·차·사람)',
         '논에 물이 와야 해서 호수(저수지)에서 길가를 따라 농수로를 냈어요 · 교사 10-15 · 바꾸고 싶으면 말해 주세요',
         '뒷산 산줄기(판 밖 북서쪽 · 주봉 약 330m)·능선·바위·숲, 산자락 등산로와 전망대는 AI가 정했어요(교사 「산지 느낌」)',
         '둘레 판(10-15)도 칸 선 = 길로 어림했어요(옛 판과 새 판이 맞닿은 선 = 큰길) — 바다·모래·갯벌·산 숲 칸은 비켜 감',
         '초록 종이 여섯 칸 = 뒷산 기슭(산자락) — 큰 산줄기는 판 밖 북서쪽(주봉 약 330m)에 세움(교사 10-13 「언덕 말고 산지 — 마을이 산 아래」) · 높이·능선·바위는 AI가 정함',
         '겉모습 ✨: 산속 집이라 낮은 산촌 집(돌 밑단·나무 벽·빨간 박공·굴뚝·장독대)으로 — 자리·색은 그대로 · 교사 10-15',
         '산 특산물 — 숲 그늘에 참나무 원목을 세워 표고버섯을 길러요(교사 10-15 ✨ 고장 개연성)',
         '산 목장 — 풀밭에 한우·양을 길러요(교과서 산 지역 · 교사 10-15 ✨)',
         '놀이용 상황 — 숲을 골프장으로 바꿀까? 찬성·반대 팻말(정답 없음 · 교사 10-15 ✨)',
         '지역 문제 — 쓰레기 무단 투기(바로 옆 분리수거장이 해결 · 교사 10-15 ✨)',
         '교과서 간척 — 바다를 막아(방조제) 새로 만든 땅 · 논과 작은 산업 용지(✨ 빈칸 · 아이 갯벌 마13·바13은 그대로 · 또래 10-16)',
         '유럽 옛 마을(패들렛 47) — 돌길 분수 광장·꽃 화분·옛 가로등 · 골목에 매단 간판 셋',
         '하늘색 판 3장 쌓음 · 패들렛 20 사진 = 회색 세로 루버 + 큰 유리 1층',
         '패들렛 33 — 수조 위 보트 · 수중 터널 · 곤충·작은 동물 체험',
         '패들렛 34 사2 핑크 뷔페 — 분홍 줄무늬 차양 · 분홍 외관',
         '일하는 곳 카드 이름 칸이 빈칸(교사 10-15 확인) — 노랑 = 일하는 곳 → 가게 줄 ✨',
         '슬로프(사이사이 숲 띠 남김 = 산림 보호) + 리프트 + 아래 워터파크 풀·미끄럼틀 · 계절 따라(패들렛 29 여름 워터파크 · 겨울 스키장)',
         '하람이네 집 = 파란 오두막(패들렛 43) — 글에 나2·가4로 적었지만 카드·판 = 나4',
         '(✨ 교사 요청 · 아이 판엔 없음)', '(아이 판 · 패들렛)', '유은 패들렛 16·56·59 버섯 — 가장 많이 자라는 숲',
         '사용자 10-26 랜드마크 전망 타워(AI)', '🙋 패들렛 사진대로 꾸민 겉모습 ', '📋 복사했어요. 메모장이나 패들렛에 붙여 넣어 모아요',
         '배 타는 곳(교사 10-16 ✨ — 마을에 배 띄울 항구가 없어 바다 일터 가까운 물가에 나무 선착장)',
         '칸) 아이가 아무것도 놓지 않은 칸도 둘레에 맞게 동네로 채웠어요(교사 10-13 — 완성된 동네)', '(교사 10-15 ✨)', '농수로(교사 10-15 ✨)',
         '10-15개를 모아요', '점수(10-12)']
    for t in T:
        print(t, '\n   →', scrub(t, date_only=True))
