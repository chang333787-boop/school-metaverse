# SMFix 글꼴(EMOJI-FIX · 엔진 팀 10-17): 윈도 10(이모지 11까지)에서 네모로 깨지는 이모지 12.0+ 글자만 직접 그린 작은 컬러 글꼴(COLRv0)
#   python3 tools/fonts/smfix.py  → v2/index.html·v3/index.html의 `/*SMFIX*/@font-face{…}` 줄을 새로 씀(글꼴 = data URL · 1~3KB)
#   같은 이름 SMEmoji에 unicode-range만 좁혀 덧붙임 → CSS 규칙상 뒤에 쓴 면이 먼저 = 이 글자들만 모든 기기에서 이 그림(맥·아이폰·크롬북·윈도 똑같이) · 나머지 이모지는 기기 글꼴 그대로
#   새 글자가 필요하면 아래 G에 그림을 더하고 다시 돌림(tools/harness/textlint.cjs는 이 글꼴에 든 글자를 '고침'으로 셈)
import base64, math, re, os, io
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.colorLib.builder import buildCOLR, buildCPAL

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EM, CX, CY = 1000, 500, 380   # 글자 상자: 아래 -120 ~ 위 880 · 가운데 (500, 380)

def circ(cx, cy, r, n=48, rx=None): rx = rx or r; return [(cx + rx * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
def rect(x0, y0, x1, y1): return [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
def rrect(x0, y0, x1, y1, r, n=6):   # 둥근 네모(모서리마다 제 사분면 · 반시계)
  P = []
  for (cx, cy, a0) in [(x0 + r, y0 + r, 180), (x1 - r, y0 + r, 270), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90)]:
    for k in range(n + 1): a = math.radians(a0 + 90 * k / n); P.append((cx + r * math.cos(a), cy + r * math.sin(a)))
  return P
def rot(P, a, cx=CX, cy=CY): c, s = math.cos(a), math.sin(a); return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in P]
def heart(cx, cy, s, n=64): return [(cx + s * 16 * math.sin(t) ** 3 / 17, cy + s * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 17) for t in [2 * math.pi * k / n for k in range(n)]]
def hexc(h): h = h.lstrip('#'); return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, 1.0)

# 글자 = [(색, [다각형…]), …] — 아래 층부터
C9 = {0x1F7E0: '#F4900C', 0x1F7E1: '#FDCB58', 0x1F7E2: '#78B159', 0x1F7E3: '#AA8ED6', 0x1F7E4: '#C1694F'}   # 🟠🟡🟢🟣🟤
S9 = {0x1F7E5: '#DD2E44', 0x1F7E6: '#55ACEE', 0x1F7E7: '#F4900C', 0x1F7E8: '#FDCB58', 0x1F7E9: '#78B159', 0x1F7EA: '#AA8ED6', 0x1F7EB: '#C1694F'}   # 🟥🟦🟧🟨🟩🟪🟫
G = {}
for cp, c in C9.items(): G[cp] = [(c, [circ(CX, CY, 470)])]
for cp, c in S9.items(): G[cp] = [(c, [rrect(40, -90, 960, 850, 90)])]
G[0x1F90D] = [('#B8B8B8', [heart(CX, CY + 40, 540)]), ('#FAFAFA', [heart(CX, CY + 44, 470)])]   # 🤍 흰 하트(밝은 창에서도 보이게 회색 테)
G[0x1F9C8] = [   # 🧈 버터 = 접시 위 노란 덩이(앞·옆·윗면 + 빛)
  ('#C9D3DF', [circ(CX, 30, 175, rx=490)]), ('#EEF2F7', [circ(CX, 45, 140, rx=440)]),
  ('#F2C230', [[(110, 70), (110, 430), (650, 430), (650, 70)]]),
  ('#D49A16', [[(650, 70), (650, 430), (890, 590), (890, 230)]]),
  ('#FFE58A', [[(110, 430), (350, 590), (890, 590), (650, 430)]]),
  ('#FFF6CF', [[(230, 470), (330, 540), (600, 540), (500, 470)]])]
G[0x1F9CA] = [   # 🧊 얼음 = 하늘빛 정육면체 + 빛
  ('#8FD0F2', [[(80, -90), (80, 560), (660, 560), (660, -90)]]),
  ('#5AAEE0', [[(660, -90), (660, 560), (920, 760), (920, 110)]]),
  ('#D8F3FF', [[(80, 560), (340, 760), (920, 760), (660, 560)]]),
  ('#FFFFFF', [rrect(150, 330, 260, 490, 30), [(330, 600), (400, 655), (620, 655), (550, 600)]])]
G[0x1F9CD] = [   # 🧍 서 있는 사람
  ('#3B4A6B', [rrect(345, -110, 485, 260, 60), rrect(515, -110, 655, 260, 60)]),
  ('#4A90D9', [rrect(320, 200, 680, 560, 100)]),
  ('#FFCC4D', [circ(CX, 705, 170), rrect(215, 250, 315, 540, 50), rrect(685, 250, 785, 540, 50)])]
G[0x1FA79] = [   # 🩹 반창고(비스듬히)
  ('#E3A46A', [rot(rrect(20, 230, 980, 530, 150), math.radians(40))]),
  ('#F8D9B0', [rot(rrect(360, 255, 640, 505, 45), math.radians(40))]),
  ('#C98552', [rot(circ(x, y, 22, 12), math.radians(40)) for x in (150, 235, 765, 850) for y in (330, 430)])]

def band(cx, cy, r0, r1, a0, a1, n=24):   # 굵은 호(고리 조각)
  A = [math.radians(a0 + (a1 - a0) * k / n) for k in range(n + 1)]
  return [(cx + r1 * math.cos(a), cy + r1 * math.sin(a)) for a in A] + [(cx + r0 * math.cos(a), cy + r0 * math.sin(a)) for a in A[::-1]]
G[0x1FA7A] = [   # 🩺 청진기 = U자 관 + 귀꽂이 + 아래 판
  ('#5B6B7D', [rrect(250, 430, 320, 800, 30), rrect(680, 430, 750, 800, 30), band(500, 430, 180, 250, 180, 360), rrect(465, 120, 535, 260, 30), band(640, 120, 105, 175, 180, 270)]),
  ('#2F3A46', [circ(285, 815, 45), circ(715, 815, 45)]),
  ('#9AA5B1', [circ(700, -5, 150)]),
  ('#DCE2E8', [circ(700, -5, 100)])]

def build():
  names = ['.notdef']; cmap = {}; layers = {}; glyphs = {}; pal = []
  def pidx(c):
    v = hexc(c)
    if v not in pal: pal.append(v)
    return pal.index(v)
  def draw(polys):
    pen = TTGlyphPen(None)
    for P in polys:
      P = [(round(x), round(y)) for x, y in P]
      if sum(P[i][0] * P[(i + 1) % len(P)][1] - P[(i + 1) % len(P)][0] * P[i][1] for i in range(len(P))) > 0: P = P[::-1]   # 시계 방향(트루타입 채움)
      pen.moveTo(P[0]); [pen.lineTo(p) for p in P[1:]]; pen.closePath()
    return pen.glyph()
  glyphs['.notdef'] = TTGlyphPen(None).glyph()
  for cp, L in sorted(G.items()):
    base = 'u%X' % cp; names.append(base); cmap[cp] = base; lay = []
    glyphs[base] = draw([P for _, polys in L for P in polys])   # 색 없는 곳(옛 브라우저) = 모양 전체
    for i, (c, polys) in enumerate(L): ln = '%s.l%d' % (base, i); names.append(ln); glyphs[ln] = draw(polys); lay.append((ln, pidx(c)))
    layers[base] = lay
  fb = FontBuilder(EM, isTTF=True); fb.setupGlyphOrder(names); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs)
  fb.setupHorizontalMetrics({n: (EM if n != '.notdef' else 500, 0) for n in names}); fb.setupHorizontalHeader(ascent=880, descent=-120)
  fb.setupNameTable({'familyName': 'SMFix', 'styleName': 'Regular'}); fb.setupOS2(sTypoAscender=880, sTypoDescender=-120, usWinAscent=880, usWinDescent=120); fb.setupPost()
  f = fb.font; f['COLR'] = buildCOLR(layers, version=0); f['CPAL'] = buildCPAL([pal])
  b = io.BytesIO(); f.save(b); return b.getvalue(), sorted(G)

def rng(cps):   # 이어진 코드 포인트는 범위로
  out = []; s = p = None
  for c in cps:
    if s is None: s = p = c
    elif c == p + 1: p = c
    else: out.append((s, p)); s = p = c
  out.append((s, p)); return ','.join('U+%X' % a if a == b else 'U+%X-%X' % (a, b) for a, b in out)

if __name__ == '__main__':
  data, cps = build(); rule = "/*SMFIX*/@font-face{font-family:SMEmoji;src:url(data:font/ttf;base64,%s) format('truetype');unicode-range:%s}" % (base64.b64encode(data).decode(), rng(cps))
  for page in ['v2/index.html', 'v3/index.html']:
    p = os.path.join(ROOT, page)
    if not os.path.exists(p): continue
    s = open(p, encoding='utf-8').read()
    if '/*SMFIX*/' in s: s = re.sub(r"/\*SMFIX\*/@font-face\{[^}]*\}", lambda m: rule, s)
    else:
      m = re.search(r"@font-face\{font-family:SMEmoji;[^}]*\}", s)
      if not m: print('SMEmoji 규칙 없음', page); continue
      s = s[:m.end()] + '\n  ' + rule + s[m.end():]   # 기존 SMEmoji 뒤(= 먼저 쓰임)
    open(p, 'w', encoding='utf-8').write(s); print(page, len(data), 'bytes', rng(cps))
