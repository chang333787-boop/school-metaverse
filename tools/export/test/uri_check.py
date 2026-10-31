#!/usr/bin/env python3
# 새 저장소(uri-maeul) 글 검사 — python3 tools/export/test/uri_check.py [새 저장소 폴더]
#   ① git ls-files 목록: 사진(아이·위성)·docs·메모·.claude·server·PDF 0 · 들어가도 되는 폴더만
#   ② '정림'·학교 주소·로마자 0  ③ 학교 안 아이 이름(layout.js PEOPLE)이 원본과 하나도 안 겹침
#   ④ 우리 반 아이 집·마당 그대로(마을 자료의 집 이름 · 마당 읽기 · Firebase 주소)  ⑤ 비밀값 0
import json
import os
import re
import subprocess
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else '/Users/dobuk/Projects/uri-maeul'
SRC = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
fails = 0


def ok(c, m):
    global fails
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c:
        fails += 1


files = subprocess.run(['git', 'ls-files'], cwd=OUT, capture_output=True, text=True).stdout.split()
if not files:
    files = [os.path.relpath(os.path.join(r, f), OUT) for r, _, fs in os.walk(OUT) if '/.git' not in r + '/' for f in fs]
    print('  (아직 커밋 전 — 폴더 목록으로 검사)')
print('파일 %d개' % len(files))
ALLOW = re.compile(r'^(index\.html|README\.md|LICENSE|\.gitignore|phone\.css|title\.css|js/[a-z_]+\.js|games/(registry|town[a-z0-9_]*)\.js|towns/ourtown(_ring)?\.js|lib/three\.module\.min\.js|img/photos/(CREDITS\.md|[a-z_]+\.jpg))$')
bad = [f for f in files if not ALLOW.match(f)]
ok(not bad, '들어가도 되는 파일만(' + ', '.join(bad[:8]) + ')')
pics = [f for f in files if re.search(r'\.(png|jpe?g|webp|gif|pdf|heic|mov|mp4)$', f, re.I)]
ok(all(f.startswith('img/photos/') for f in pics) and len(pics) <= 3, '사진 = 장소 카드 공개 사진 셋뿐(' + ', '.join(pics) + ')')
ok(not any(re.search(r'(^|/)(docs|scratchpad|server|memory|\.claude|tour_media|patches?)(/|$)', f) for f in files), 'docs·메모·서버·견학 사진 폴더 0')

text = {f: open(os.path.join(OUT, f), encoding='utf-8', errors='replace').read() for f in files if not re.search(r'\.(jpe?g|png)$', f)}
for pat, what in [(r'정림', "'정림'"), (r'(?i)junglim|jeongnim|jeongrim', '학교 이름 로마자'), (r'화성시|효행구|정남면|망월길', '학교 주소'),
                  (r'RAS On|수상한정림', '학교 표어·채널'), (r'docs/systems|town_lessons|CLAUDE\.md', '내부 문서 이름'),
                  (r'PEPPER|BEGIN (RSA|PRIVATE)|private_key|client_secret', '비밀값'), (r'교사 (?:0?9|10|11)-\d|패들렛 \d|사용자 (?:0?9|10|11)-\d', '작업 일지 조각')]:
    hits = [(f, m.group(0)) for f, s in text.items() if f != 'LICENSE' for m in re.finditer(pat, s)]
    ok(not hits, what + ' 0' + ('' if not hits else ' ← ' + ', '.join('%s:%s' % h for h in hits[:5])))

lay_new = text.get('js/layout.js', '')
lay_old = open(os.path.join(SRC, 'v2/js/layout.js'), encoding='utf-8').read()
pe = lambda s: re.findall(r"\['([^']+)', '(?:남|여)'\]", re.search(r'const PEOPLE = \{.*?\};', s, re.S).group(0))
old_n, new_n = pe(lay_old), pe(lay_new)
same = [a for a, b in zip(old_n, new_n) if a == b]
ok(len(old_n) == len(new_n) and not (set(old_n) & set(new_n)), '학교 안 아이 이름 %d명 모두 바뀜(겹침 %s)' % (len(new_n), same))
ok("'우리초등학교'" in lay_new, '학교 이름 = 우리초등학교')

town = text.get('towns/ourtown.js', '') + text.get('towns/ourtown_ring.js', '')
houses = sorted(set(re.findall(r"[가-힣]{2,3}(?:이)?네 집", town)))
ok(len(houses) >= 4, '우리 반 아이 집 이름 그대로(' + ' · '.join(houses) + ')')
ok("yards: 'rpg'" in town, '아이 집 마당 = 우리반RPG 꾸미기에서 읽음(그대로)')
ok('firebasedatabase.app' in text.get('games/town_yard.js', ''), 'Firebase 주소 그대로(마당 읽기)')
ok('sm-rooms' in text.get('games/town_cloud.js', ''), 'Cloudflare 방 서버 주소 그대로')
ok('?town=ourtown' in text.get('index.html', '') and 'intro.js' in text.get('index.html', ''), '루트 index.html = 마을 + 인트로')
size = sum(os.path.getsize(os.path.join(OUT, f)) for f in files)
print('크기 %.1f MB' % (size / 1e6))
print('FAIL %d' % fails if fails else 'PASS')
sys.exit(1 if fails else 0)
