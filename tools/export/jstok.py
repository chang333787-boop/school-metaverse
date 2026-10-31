# 자바스크립트·CSS 낱말 나누기(내보내기 전용 · 원본 파일은 읽기만)
#   tokens(src) = [(종류, 글)] — 종류: code · ws · comment · str · tpl(템플릿 글 조각) · regex
#   ''.join(글) == src 가 늘 성립한다(빠뜨리는 글자 없음). strip_js()는 주석만 빼고 나머지는 그대로 둔다.
#   정규식/나누기(/) 가르기 = 앞 낱말로 판단(괄호는 if·while·for 뒤인지 기억) · 확신이 없으면 주석을 지우지 않는 쪽으로.
import re

KW_BEFORE_EXPR = {'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
                  'case', 'do', 'else', 'yield', 'await', 'extends'}
KW_PAREN = {'if', 'while', 'for', 'with'}
ID_RE = re.compile(r'[A-Za-z_$\u0080-￿][\w$\u0080-￿]*')
NUM_RE = re.compile(r'(?:0[xXbBoO][0-9a-fA-F_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)')
PUNCT3 = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=']
PUNCT2 = ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=',
          '&=', '|=', '^=', '<<', '>>', '**']


class TokErr(Exception):
    pass


def tokens(src):
    out = []
    i, n = 0, len(src)
    # 앞 낱말 상태: 'expr' = 값 뒤(/ = 나누기) · 'op' = 연산자 뒤(/ = 정규식)
    state = ['op']
    paren = []          # '(' 마다 if/while/for 뒤였는지
    brace = []          # '{' 마다 'code' 또는 'tpl'(템플릿 ${ 안)
    last_id = ['']

    def push(kind, a, b):
        out.append((kind, src[a:b]))

    def read_string(i, q):
        j = i + 1
        while j < n:
            c = src[j]
            if c == '\\':
                j += 2
                continue
            if c == q:
                return j + 1
            if c == '\n':
                raise TokErr('줄바꿈 전에 끝나지 않은 글 %d' % i)
            j += 1
        raise TokErr('끝나지 않은 글 %d' % i)

    def read_tpl_chunk(i):
        # i = 템플릿 글 조각 시작(` 다음 또는 } 다음) → (끝 위치, '`' 또는 '${')
        j = i
        while j < n:
            c = src[j]
            if c == '\\':
                j += 2
                continue
            if c == '`':
                return j + 1, '`'
            if c == '$' and j + 1 < n and src[j + 1] == '{':
                return j + 2, '${'
            j += 1
        raise TokErr('끝나지 않은 템플릿 %d' % i)

    def read_regex(i):
        j = i + 1
        cls = False
        while j < n:
            c = src[j]
            if c == '\n':
                return None
            if c == '\\':
                j += 2
                continue
            if cls:
                if c == ']':
                    cls = False
            elif c == '[':
                cls = True
            elif c == '/':
                j += 1
                while j < n and (src[j].isalpha()):
                    j += 1
                return j
            j += 1
        return None

    while i < n:
        c = src[i]
        if c in ' \t\r\n﻿   ':
            j = i + 1
            while j < n and src[j] in ' \t\r\n﻿   ':
                j += 1
            push('ws', i, j)
            i = j
            continue
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            j = src.find('\n', i)
            j = n if j < 0 else j
            push('comment', i, j)
            i = j
            continue
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            if j < 0:
                raise TokErr('끝나지 않은 주석 %d' % i)
            push('comment', i, j + 2)
            i = j + 2
            continue
        if c in '\'"':
            j = read_string(i, c)
            push('str', i, j)
            state[0] = 'expr'
            i = j
            continue
        if c == '`':
            j, end = read_tpl_chunk(i + 1)
            push('tpl', i, j)
            if end == '${':
                brace.append('tpl')
                state[0] = 'op'
            else:
                state[0] = 'expr'
            i = j
            continue
        if c == '}' and brace and brace[-1] == 'tpl':
            brace.pop()
            j, end = read_tpl_chunk(i + 1)
            push('tpl', i, j)
            if end == '${':
                brace.append('tpl')
                state[0] = 'op'
            else:
                state[0] = 'expr'
            i = j
            continue
        if c == '/':
            if state[0] == 'op':
                j = read_regex(i)
                if j is not None:
                    push('regex', i, j)
                    state[0] = 'expr'
                    i = j
                    continue
            # 나누기
            j = i + 2 if i + 1 < n and src[i + 1] == '=' else i + 1
            push('code', i, j)
            state[0] = 'op'
            i = j
            continue
        m = ID_RE.match(src, i)
        if m:
            w = m.group(0)
            prev = next((t for k, t in reversed(out) if k not in ('ws', 'comment')), '')
            push('code', i, m.end())
            last_id[0] = w
            if prev in ('.', '?.'):
                state[0] = 'expr'   # 속성 이름(obj.in · x.of)은 낱말이 아니라 값
            else:
                state[0] = 'op' if w in KW_BEFORE_EXPR else 'kwp' if w in KW_PAREN else 'expr'
            i = m.end()
            continue
        if c.isdigit() or (c == '.' and i + 1 < n and src[i + 1].isdigit()):
            m = NUM_RE.match(src, i)
            j = m.end() if m and m.end() > i else i + 1
            push('code', i, j)
            state[0] = 'expr'
            i = j
            continue
        if c == '(':
            paren.append(state[0] == 'kwp')
            push('code', i, i + 1)
            state[0] = 'op'
            i += 1
            continue
        if c == ')':
            kw = paren.pop() if paren else False
            push('code', i, i + 1)
            state[0] = 'op' if kw else 'expr'
            i += 1
            continue
        if c == '{':
            brace.append('code')
            push('code', i, i + 1)
            state[0] = 'op'
            i += 1
            continue
        if c == '}':
            if brace:
                brace.pop()
            push('code', i, i + 1)
            state[0] = 'op'
            i += 1
            continue
        if c == ']':
            push('code', i, i + 1)
            state[0] = 'expr'
            i += 1
            continue
        p = None
        for L in (PUNCT3, PUNCT2):
            for q in L:
                if src.startswith(q, i):
                    p = q
                    break
            if p:
                break
        if p:
            push('code', i, i + len(p))
            state[0] = 'expr' if p in ('++', '--') else 'op'
            i += len(p)
            continue
        push('code', i, i + 1)
        state[0] = 'op'
        i += 1
    if ''.join(t for _, t in out) != src:
        raise TokErr('나눈 글을 이으면 원래 글과 다름')
    return out


def strip_js(src):
    """주석을 빼고 빈 줄을 줄인다. 글(문자열·템플릿·정규식)은 손대지 않는다."""
    toks = tokens(src)
    res = []
    for k, t in toks:
        if k == 'comment':
            if t.startswith('/*'):
                res.append('\n' if '\n' in t else ' ')
            continue
        res.append(t)
    s = ''.join(res)
    lines = [ln.rstrip() for ln in s.split('\n')]
    out = []
    for ln in lines:
        if ln == '' and (not out or out[-1] == ''):
            continue
        out.append(ln)
    return '\n'.join(out).strip('\n') + '\n'


def map_strings(src, fn):
    """문자열 글('…' "…")과 템플릿 글 조각의 속 글만 fn으로 바꾼다(따옴표·${}는 그대로)."""
    toks = tokens(src)
    res = []
    for k, t in toks:
        if k == 'str':
            q = t[0]
            res.append(q + fn(t[1:-1]) + q)
        elif k == 'tpl':
            # 앞(` 또는 }) · 속 · 뒤(` 또는 ${)
            a = 1
            b = len(t) - (2 if t.endswith('${') else 1)
            res.append(t[:a] + fn(t[a:b]) + t[b:])
        else:
            res.append(t)
    return ''.join(res)


def strings_of(src):
    return [t for k, t in tokens(src) if k in ('str', 'tpl')]


CSS_COMMENT = re.compile(r'/\*.*?\*/', re.S)


def strip_css(src):
    s = CSS_COMMENT.sub('', src)
    lines = [ln.rstrip() for ln in s.split('\n')]
    out = []
    for ln in lines:
        if ln == '' and (not out or out[-1] == ''):
            continue
        out.append(ln)
    return '\n'.join(out).strip('\n') + '\n'
