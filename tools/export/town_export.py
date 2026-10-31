#!/usr/bin/env python3
# 마을 게임만 따로 내보내기(EXPORT-1 · 사용자 10-31 '마을 게임만 새 깃허브로 · 외부 배포 준비 · 원본에서 지우지 마')
#   원본 = school-metaverse(읽기만) → 새 저장소 폴더(기본 /Users/dobuk/Projects/uri-maeul)를 통째로 다시 만든다.
#   원본에서 버그를 고친 뒤 이 스크립트를 다시 돌리면 그대로 옮겨진다(새 저장소에서 직접 고친 것은 덮인다).
#
#   하는 일: ① v2 진입(main.js)·마을(town.js·ourtown.js)·registry에서 import를 따라가 필요한 파일만 모음(다른 놀이 X)
#            ② v2/ → 저장소 루트로 평평하게(루트 index.html이 곧 게임 · 주소에 ?town=ourtown을 저절로)
#            ③ 주석(작업 일지) 빼기 · 화면 글 속 작업 흔적('(교사 10-15 ✨)' · '(패들렛 47)') 거르기
#            ④ 실제 학교 이름 → names.json · 학교 안 아이 이름(layout.js PEOPLE) → 흔한 이름으로(결정적) · 우리 반 아이 집(마을 자료)은 그대로
#            ⑤ 쓰지 않는 오프닝(title.js)·영상(film.js)은 빈 껍데기로 · 인트로(overlay/js/intro.js)·README·LICENSE를 더함
#            ⑥ 검사: 모든 모듈 문법 · 금지 낱말 0 · 빠진 import 0
import argparse
import glob
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import jstok  # noqa: E402
import scrub  # noqa: E402

ROOTS = ['v2/js/main.js', 'v2/games/town.js', 'v2/towns/ourtown.js', 'v2/games/registry.js']
# 마을이 부르지 않거나(오프닝 영상·견학 글·맵 검진) 실제 학교 사실이 든 파일 — 가져오지 않음
EXCLUDE = {'v2/games/tour_data.js', 'v2/games/tour_film.js', 'v2/js/health.js'}
# 마을 주소에선 쓰지 않지만 main.js가 정적으로 부르는 것 — 같은 이름의 빈 껍데기로
STUB = {
    'v2/js/title.js': 'export function createTitle() { return null; }\n',
    'v2/js/film.js': "export function createFilm() { return { play: () => Promise.resolve('skip'), stop() {}, get on() { return false; }, sfx: {} }; }\n",
}
ASSETS = ['v2/phone.css', 'v2/title.css', 'v2/img/photos/*.jpg']
# 원본 글에 덧대는 곳(앞 = 찾을 글 · 뒤 = 바꿀 글) — 못 찾으면 멈춤(원본이 바뀐 것을 알아채게)
PATCHES = {
    'v2/js/main.js': [
        (re.compile(r"const ROOMS = \[null, \{ id: 'watergun_vs'[^\n]*?\];"), 'const ROOMS = [null];'),
        ("add('apple-mobile-web-app-title', '정림초 3D')", "add('apple-mobile-web-app-title', '@APP@')"),
        (re.compile(r"g\.fillText\('🏫', 90, 72\)"), "g.fillText('🏘', 90, 72)"),
        (re.compile(r"g\.fillText\('정림초', 90, 157\)"), "g.fillText('@APP@', 90, 157)"),
    ],
}
FORBID = [r'정림', r'(?i)junglim', r'화성시', r'효행', r'망월', r'정남면', r'RAS On', r'수상한정림', r'docs/systems', r'PEPPER',
          r'패들렛 \d', r'교사 (?:0?9|10|11)-\d', r'사용자 (?:0?9|10|11)-\d']
SPEC_RE = re.compile(r"""(?:from\s*|import\s*\(\s*|import\s+|new\s+URL\s*\(\s*)(['"`])([^'"`]+?)\1""")


def log(*a):
    print(*a, flush=True)


def resolve(base, spec):
    spec = spec.split('?')[0]
    if spec == 'three':
        return 'lib/three.module.min.js'
    if not spec.startswith('.'):
        return None
    t = os.path.normpath(os.path.join(os.path.dirname(base), spec))
    return t if '.' in os.path.basename(t) else None


def closure(src):
    seen, stack, missing = set(), list(ROOTS), []
    while stack:
        f = stack.pop()
        if f in seen or f in EXCLUDE:
            continue
        seen.add(f)
        p = os.path.join(src, f)
        if not os.path.exists(p):
            missing.append(f)
            continue
        if not f.endswith('.js') or f in STUB or f.startswith('lib/'):
            continue
        s = open(p, encoding='utf-8').read()
        for m in SPEC_RE.finditer(s):
            t = resolve(f, m.group(2))
            if t and t not in seen:
                stack.append(t)
    return sorted(seen), missing


def out_path(f):
    return f[3:] if f.startswith('v2/') else f


def apply_patches(f, s, app):
    for old, new in PATCHES.get(f, []):
        if isinstance(old, re.Pattern):
            s2, n = old.subn(new.replace('@APP@', app), s)
        else:
            n = s.count(old)
            s2 = s.replace(old, new.replace('@APP@', app))
        if n == 0:
            raise SystemExit('덧댈 곳을 못 찾음: %s · %s' % (f, getattr(old, 'pattern', old)[:80]))
        s = s2
    return s


def school_map(s, pairs):
    n = 0
    for a, b in pairs:
        n += s.count(a)
        s = s.replace(a, b)
    return s, n


def kid_names(layout_src, cfg):
    """layout.js PEOPLE 블록의 ['이름', '성별']만 바꿈 → (새 글, {옛: 새})"""
    m = re.search(r'const PEOPLE = \{.*?\n\};', layout_src, re.S)
    if not m:
        raise SystemExit('layout.js에서 PEOPLE 블록을 못 찾음')
    block = m.group(0)
    pairs = re.findall(r"\['([^']+)', '(남|여)'\]", block)
    keep = set(cfg.get('kid_keep', []))
    orig = {a for a, _ in pairs}
    avoid = orig | set(cfg.get('kid_avoid', []))
    used, table = set(), {}
    for name, sex in pairs:
        if name in keep or name in table:
            continue
        pool = [p for p in cfg['kid_pool'][sex] if p not in avoid]
        h = int(hashlib.sha256((cfg['kid_seed'] + ':' + name).encode()).hexdigest(), 16)
        k = h % len(pool)
        for step in range(len(pool)):
            cand = pool[(k + step) % len(pool)]
            if cand not in used:
                break
        else:
            raise SystemExit('이름 목록이 모자람(%s)' % sex)
        used.add(cand)
        table[name] = cand
    new_block = re.sub(r"\['([^']+)', '(남|여)'\]", lambda q: "['%s', '%s']" % (table.get(q.group(1), q.group(1)), q.group(2)), block)
    return layout_src.replace(block, new_block), table


def build_index(src, app, app_en):
    s = open(os.path.join(src, 'v2/index.html'), encoding='utf-8').read()
    reps = [
        (r'<title>[^<]*</title>', '<title>%s</title>\n<meta name="description" content="자전거·버스·지하철로 마을을 다니며 이웃을 돕고, 양을 몰고, 불을 끄고, 밤 장터와 첫 마을 잔치를 준비하는 3D 마을 놀이">' % app),
        (r'"three": "\.\./lib/three\.module\.min\.js"', '"three": "./lib/three.module.min.js"'),
        (r'<div id="boot">[^<]*<i>', '<div id="boot">%s로 가는 중<i>' % app),
        (r"<div class=\"tb-t\">[^<]*<br>[^<]*</div>", '<div class="tb-t">%s</div>' % app),
        (r'학교를 짓는 중…', '마을로 가는 중…'),
        (r'<div id="loc" class="chip">[^<]*</div>', '<div id="loc" class="chip">📍</div>'),
    ]
    for pat, rep in reps:
        s2, n = re.subn(pat, rep.replace('\\', '\\\\'), s)
        if n == 0:
            raise SystemExit('index.html에서 못 찾음: ' + pat)
        s = s2
    # 첫 줄: 주소에 마을이 없으면 ?town=ourtown을 붙임(다른 주소 글은 그대로) — 다른 어떤 스크립트보다 먼저
    norm = ("<script>(function(){var s=location.search;if(!/[?&]town=/.test(s))history.replaceState(null,'',"
            "location.pathname+'?town=ourtown'+(s?'&'+s.slice(1):'')+location.hash);})();</script>\n")
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + norm, 1)
    # 인트로는 main.js보다 먼저(키를 먼저 받아야 첫 화면이 뒤에서 열리지 않음)
    m = re.search(r'<script type="module" src="\./js/main\.js\?v=\d+"></script>', s)
    if not m:
        raise SystemExit('index.html에서 main.js 줄을 못 찾음')
    s = s.replace(m.group(0), '<script type="module" src="./js/intro.js?v=@INTROV@"></script>\n' + m.group(0))
    # 주석 빼기: HTML 주석 · <script>(importmap 빼고) · <style>
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'(<script>)(.*?)(</script>)', lambda q: q.group(1) + jstok.strip_js(q.group(2)).strip() + q.group(3), s, flags=re.S)
    s = re.sub(r'(<style>)(.*?)(</style>)', lambda q: q.group(1) + '\n' + jstok.strip_css(q.group(2)) + q.group(3), s, flags=re.S)
    s = '\n'.join(ln.rstrip() for ln in s.split('\n') if ln.strip()) + '\n'
    return s


def registry_src(src, app):
    s = open(os.path.join(src, 'v2/games/registry.js'), encoding='utf-8').read()
    m = re.search(r"\n  town: \{ title: '[^']*', v: (\d+),", s)
    if not m:
        raise SystemExit('registry.js에서 town 줄을 못 찾음')
    return ("export const FOLDERS = [];\nexport const GAMES = {\n  town: { title: '%s', v: %s, dev: true, icon: '🏘', desc: '%s' },\n};\n"
            % (app, m.group(1), app))


def check_syntax(out, files):
    bad = []
    for f in files:
        if not f.endswith('.js') or f.startswith('lib/'):
            continue
        p = os.path.join(out, f)
        r = subprocess.run(['node', '--input-type=module', '--check'], stdin=open(p, 'rb'), capture_output=True)
        if r.returncode:
            bad.append((f, r.stderr.decode('utf-8', 'replace')[:400]))
    return bad


def clean_out(out, src):
    out_r, src_r = os.path.realpath(out), os.path.realpath(src)
    if out_r == src_r or out_r.startswith(src_r + os.sep) or src_r.startswith(out_r + os.sep) or out_r in ('/', os.path.expanduser('~')):
        raise SystemExit('내보낼 폴더가 원본과 겹쳐요: ' + out)
    os.makedirs(out, exist_ok=True)
    rest = [n for n in os.listdir(out) if n != '.git']
    if rest and not os.path.exists(os.path.join(out, 'js', 'intro.js')):
        raise SystemExit('내보낸 적 없는 폴더라 비우지 않아요(js/intro.js 없음): ' + out)
    for name in os.listdir(out):
        if name == '.git':
            continue
        p = os.path.join(out, name)
        if os.path.isdir(p) and not os.path.islink(p):
            shutil.rmtree(p)
        else:
            os.remove(p)


def write(out, rel, data):
    p = os.path.join(out, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if isinstance(data, str):
        data = data.encode('utf-8')
    with open(p, 'wb') as fh:
        fh.write(data)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=os.path.realpath(os.path.join(HERE, '..', '..')))
    ap.add_argument('--out', default='/Users/dobuk/Projects/uri-maeul')
    ap.add_argument('--keep-comments', action='store_true', help='주석을 빼지 않음(살펴보기용)')
    ap.add_argument('--commit', default=None, help='새 저장소에 git 커밋(메시지)')
    a = ap.parse_args()
    src, out = os.path.realpath(a.src), a.out
    cfg = json.load(open(os.path.join(HERE, 'names.json'), encoding='utf-8'))
    app, app_en = cfg['app_title'], cfg.get('app_title_en', '')

    files, missing = closure(src)
    if missing:
        raise SystemExit('import가 가리키는데 없는 파일: ' + ', '.join(missing))
    assets = []
    for g in ASSETS:
        hit = sorted(glob.glob(os.path.join(src, g)))
        if not hit:
            raise SystemExit('자산을 못 찾음: ' + g)
        assets += [os.path.relpath(h, src) for h in hit]

    clean_out(out, src)
    rep = {'files': 0, 'bytes': 0, 'school': 0, 'scrubbed': 0, 'kids': {}, 'stubs': sorted(out_path(f) for f in STUB), 'excluded': sorted(EXCLUDE)}
    scrubbed_ex = []
    written = []
    for f in files:
        rel = out_path(f)
        p = os.path.join(src, f)
        if f in STUB:
            write(out, rel, STUB[f])
            written.append(rel)
            continue
        if f.startswith('lib/'):
            write(out, rel, open(p, 'rb').read())
            written.append(rel)
            continue
        if f == 'v2/games/registry.js':
            write(out, rel, registry_src(src, app))
            written.append(rel)
            continue
        s = open(p, encoding='utf-8').read()
        s = apply_patches(f, s, app)
        if not a.keep_comments:
            s = jstok.strip_js(s)
        date_only = f.startswith('v2/towns/')

        def fn(t, _f=f, _d=date_only):
            t0 = t
            if not a.keep_comments:
                t = scrub.strip_inner_comments(t)
            n = scrub.scrub(t, date_only=_d)
            if n != t:
                rep['scrubbed'] += 1
                if len(scrubbed_ex) < 400:
                    scrubbed_ex.append((out_path(_f), t[:140].replace('\n', ' '), n[:140].replace('\n', ' ')))
            return n
        s = jstok.map_strings(s, fn)
        if f == 'v2/js/layout.js':
            s, table = kid_names(s, cfg)
            rep['kids'] = table
        s, n = school_map(s, cfg['school'])
        rep['school'] += n
        write(out, rel, s)
        written.append(rel)
    for f in assets:
        rel = out_path(f)
        if f.endswith('.css'):
            s = open(os.path.join(src, f), encoding='utf-8').read()
            s = jstok.strip_css(s)
            s, n = school_map(s, cfg['school'])
            rep['school'] += n
            write(out, rel, s)
        else:
            write(out, rel, open(os.path.join(src, f), 'rb').read())
        written.append(rel)

    # 새 저장소에만 있는 것: 인트로 · index.html · README · LICENSE · .gitignore
    ov = os.path.join(HERE, 'overlay')
    intro = open(os.path.join(ov, 'js', 'intro.js'), encoding='utf-8').read().replace('@APP@', app)
    introv = hashlib.sha1(intro.encode()).hexdigest()[:8]
    write(out, 'js/intro.js', intro)
    written.append('js/intro.js')
    idx = build_index(src, app, app_en).replace('@INTROV@', introv)
    idx, n = school_map(idx, cfg['school'])
    rep['school'] += n
    write(out, 'index.html', idx)
    written.append('index.html')
    lic = open(os.path.join(src, 'LICENSE'), encoding='utf-8').read()
    write(out, 'LICENSE', lic)
    write(out, 'README.md', open(os.path.join(ov, 'README.md'), encoding='utf-8').read().replace('@APP@', app))
    write(out, '.gitignore', '.DS_Store\nnode_modules/\n*.log\n')
    write(out, 'img/photos/CREDITS.md', open(os.path.join(ov, 'img', 'photos', 'CREDITS.md'), encoding='utf-8').read())
    written += ['LICENSE', 'README.md', '.gitignore', 'img/photos/CREDITS.md']

    # 검사
    bad = check_syntax(out, written)
    if bad:
        for f, e in bad:
            log('문법 오류', f, e)
        raise SystemExit('문법 오류 %d' % len(bad))
    hits = []
    for rel in written:
        if rel.endswith(('.jpg', '.png')) or rel == 'LICENSE':
            continue
        s = open(os.path.join(out, rel), encoding='utf-8').read()
        for pat in FORBID:
            for m in re.finditer(pat, s):
                hits.append((rel, pat, s[max(0, m.start() - 40):m.end() + 40].replace('\n', ' ')))
        if rel == 'js/layout.js':
            for old in rep['kids']:
                if re.search(r"'%s'" % re.escape(old), s):
                    hits.append((rel, 'kid', old))
    if hits:
        for h in hits[:40]:
            log('금지 낱말', *h)
        raise SystemExit('금지 낱말 %d' % len(hits))
    total = 0
    for root, _, fs in os.walk(out):
        if '/.git' in root or root.endswith('.git'):
            continue
        for x in fs:
            total += os.path.getsize(os.path.join(root, x))
            rep['files'] += 1
    rep['bytes'] = total
    with open(os.path.join(HERE, 'last_scrub.tsv'), 'w', encoding='utf-8') as fh:
        for r in scrubbed_ex:
            fh.write('\t'.join(r) + '\n')
    log(json.dumps(rep, ensure_ascii=False, indent=1))

    if a.commit:
        if not os.path.isdir(os.path.join(out, '.git')):
            subprocess.run(['git', 'init', '-q', '-b', 'main'], cwd=out, check=True)
        subprocess.run(['git', 'add', '-A'], cwd=out, check=True)
        st = subprocess.run(['git', 'status', '--porcelain'], cwd=out, capture_output=True, text=True).stdout
        if st.strip():
            subprocess.run(['git', 'commit', '-q', '-m', a.commit], cwd=out, check=True)
            log('커밋함:', subprocess.run(['git', 'log', '--oneline', '-1'], cwd=out, capture_output=True, text=True).stdout.strip())
        else:
            log('바뀐 것 없음 — 커밋 안 함')


if __name__ == '__main__':
    main()
