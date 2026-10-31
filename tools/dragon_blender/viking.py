# 바이킹 사람 공장 — 표 한 줄 = 사람 하나(+ 양) · Blender 4.2 명령줄
#   Blender -b --factory-startup --python tools/dragon_blender/viking.py -- <출력 폴더> [이름,이름…]
# 그림책 덩어리감: 큰 머리 · 굵고 둥근 몸통 · 짧고 굵은 다리(아이) / 산 같은 어른 · 벙어리장갑 손 · 큰 코 · 눈·눈썹 · 머리카락 덩어리 · 털조끼·망토
# 빌리는 것은 알아볼 신호만(reference B) — 마른 히컵 · 금발 땋은 머리 아스트리드 · 붉은 수염 큰 스토이크 · 왼팔 도구·오른다리 막대 고버 …(옷 색은 우리 것)
# 좌표: 앞 = -Y(glTF +Z) · 위 = +Z · +X = 사람의 왼쪽(L) · 뼈 17(손 뼈 handL/R 머리 = 주먹 가운데 → 손에 드는 것을 그대로 붙임)
import bpy, bmesh, math, sys, os, json, random
from mathutils import Vector, Quaternion, noise
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blendkit import (lin, sm, link, activate, reset, metaball, chain_elems, Geo, frame, tube, plate, blob, rot_from_axes,
                      geo_object, Chain, rigid, set_weights, paint, mat, armature, bind, export, finish, tris_of)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUTDIR = argv[0] if argv else '/tmp/vikings'
ONLY = set(argv[1].split(',')) if len(argv) > 1 and argv[1] else None
os.makedirs(OUTDIR, exist_ok=True)

SKIN = 0xf0c4a0
# 몸 틀: h 키(머리 꼭대기) · head 머리 반지름 · sh 어깨 반폭 · chest/belly (옆, 앞뒤) 반지름 · hipW 엉덩이 반폭 · legTop 가랑이 높이(키 비율)
#        arm·fore 위팔·아래팔 · hand 주먹 · leg·shin 넓적다리·정강이 · boot 장화 · foot 발 길이 · armLen 어깨~손목(키 비율)
KID = dict(h=1.5, head=0.165, sh=0.17, chest=(0.17, 0.125), belly=(0.155, 0.13), hipW=0.13, legTop=0.37, arm=0.052, fore=0.048, hand=0.066,
           leg=0.074, shin=0.066, bootR=0.09, foot=0.22, armLen=0.3)
def kid(**k): d = dict(KID); d.update(k); return d
# 옷·머리: top 윗옷 · vest 털조끼(None) · pants · boot · cuff 장화 털 · belt · hair · hairStyle · brow 눈썹 · beard · helmet · 덤(cape skirt pads apron necklace headband peg tool hood)
PEOPLE = {
  'hiccup':     dict(kid(h=1.5, sh=0.155, chest=(0.155, 0.115), belly=(0.14, 0.115), hipW=0.12, arm=0.047, fore=0.044, leg=0.068, shin=0.062),
                     top=0x5f7f42, vest=0x6e4c2e, pants=0x5c4836, boot=0x3e2e22, cuff=0x9a8466, belt=0x3a2a1e, hair=0x8c4a24, hairStyle='messy', helmet=None),
  'astrid':     dict(kid(h=1.56, sh=0.16, chest=(0.155, 0.115), belly=(0.14, 0.115), hipW=0.13),
                     top=0x46677e, vest=None, pants=0x3e3430, boot=0x4a3a2c, cuff=0xb8a07a, belt=0x3a2a1e, hair=0xeccb68, hairStyle='braid', helmet=None,
                     skirt=0x4a3628, pads=0x5a4434, headband=0x3a2e2a, glove=0x5a4434),
  'fishlegs':   dict(kid(h=1.72, head=0.165, sh=0.25, chest=(0.27, 0.22), belly=(0.29, 0.26), hipW=0.22, legTop=0.4, arm=0.075, fore=0.068, hand=0.08, leg=0.1, shin=0.09, bootR=0.1, foot=0.25),
                     top=0x7a6040, vest=0x8a6a40, pants=0x4c3c2c, boot=0x35281c, cuff=0xa08a66, belt=0x3a2a1e, hair=0xdcbc66, hairStyle='short', helmet='small'),
  'snotlout':   dict(kid(h=1.48, sh=0.21, chest=(0.2, 0.15), belly=(0.18, 0.14), hipW=0.15, arm=0.062, fore=0.058, hand=0.068, leg=0.08, shin=0.072, bootR=0.088),
                     top=0x3c3a36, vest=0x5a4630, pants=0x4a3c30, boot=0x2e241c, cuff=0x8a7454, belt=0x2a2018, hair=0x2a2018, hairStyle='short', helmet='ram'),
  'ruffnut':    dict(kid(h=1.6, sh=0.15, chest=(0.145, 0.11), belly=(0.13, 0.11), hipW=0.12, arm=0.044, fore=0.04, leg=0.062, shin=0.056, armLen=0.32),
                     top=0x6a7a8c, vest=0x6a5236, pants=0x4c3c2c, boot=0x35281c, cuff=0xa08a66, belt=0x3a2a1e, hair=0xeed676, hairStyle='twin', helmet='four', necklace=1),
  'tuffnut':    dict(kid(h=1.62, sh=0.155, chest=(0.15, 0.11), belly=(0.135, 0.11), hipW=0.12, arm=0.045, fore=0.041, leg=0.063, shin=0.057, armLen=0.32),
                     top=0x6a6a52, vest=0x6a5236, pants=0x4c3c2c, boot=0x35281c, cuff=0xa08a66, belt=0x3a2a1e, hair=0xeed676, hairStyle='dreads', helmet='four', necklace=1),
  'stoick':     dict(h=2.15, head=0.168, sh=0.44, chest=(0.44, 0.34), belly=(0.42, 0.38), hipW=0.32, legTop=0.4, arm=0.12, fore=0.11, hand=0.125,
                     leg=0.16, shin=0.14, bootR=0.17, foot=0.34, armLen=0.29,
                     top=0x6a3a2a, vest=None, pants=0x4a3a2c, boot=0x30241a, cuff=0x7a6448, belt=0x2a2018, hair=0xb2401c, hairStyle='wild', beard='full', beardC=0xb2401c,
                     helmet='horns', cape=0x5a4430, bracer=0x4a3624),
  'gobber':     dict(h=1.9, head=0.162, sh=0.34, chest=(0.34, 0.27), belly=(0.35, 0.31), hipW=0.26, legTop=0.4, arm=0.1, fore=0.092, hand=0.1,
                     leg=0.13, shin=0.115, bootR=0.13, foot=0.28, armLen=0.3,
                     top=0x6a5038, vest=None, pants=0x4a3a2c, boot=0x30241a, cuff=0x7a6448, belt=0x2a2018, hair=0xe2c272, hairStyle='bald', beard='braids', beardC=0xe2c272,
                     helmet='horns2', apron=0x4a3322, peg='R', tool='L'),
  'villager1':  dict(h=1.95, head=0.16, sh=0.36, chest=(0.36, 0.28), belly=(0.36, 0.32), hipW=0.27, legTop=0.41, arm=0.1, fore=0.092, hand=0.1,
                     leg=0.13, shin=0.115, bootR=0.13, foot=0.28, armLen=0.3,
                     top=0x5a6a48, vest=0x6a5236, pants=0x4a3a2c, boot=0x30241a, cuff=0x8a7454, belt=0x2a2018, hair=0x5a3a22, hairStyle='short', beard='short', beardC=0x5a3a22, helmet='small'),
  'villager2':  dict(h=1.72, head=0.158, sh=0.24, chest=(0.24, 0.19), belly=(0.25, 0.21), hipW=0.22, legTop=0.42, arm=0.07, fore=0.064, hand=0.075,
                     leg=0.09, shin=0.08, bootR=0.09, foot=0.22, armLen=0.31,
                     top=0x8a5a48, vest=None, pants=0x4a3a2c, boot=0x3a2c20, cuff=0x8a7454, belt=0x3a2a1e, hair=0xc89a4e, hairStyle='bun', helmet=None, skirt=0x6a4436, dress=1, apron=0xd8c8a0),
  'villager3':  dict(h=2.0, head=0.16, sh=0.38, chest=(0.38, 0.29), belly=(0.4, 0.34), hipW=0.29, legTop=0.4, arm=0.105, fore=0.096, hand=0.105,
                     leg=0.135, shin=0.12, bootR=0.135, foot=0.29, armLen=0.29,
                     top=0x4a5a6a, vest=0x6a5038, pants=0x4a3a2c, boot=0x30241a, cuff=0x8a7454, belt=0x2a2018, hair=0x8a8278, hairStyle='bald', beard='short', beardC=0x9a9288, helmet=None, hood=0x5a4a3e),
}
PEOPLE['hiccup_hel'] = dict(PEOPLE['hiccup'], helmet='small')
PEOPLE['hiccup_leg'] = dict(PEOPLE['hiccup'], peg='L')

def build(key, P):
    reset()
    h, hd = P['h'], P['head']
    C = lambda k: lin(P[k]) if P.get(k) is not None else None
    skin = lin(SKIN)
    # ── 뼈대 자리 ──
    hc = h - hd * 1.02; chin = hc - hd * 0.9; sZ = chin - hd * 0.18
    cZ = P['legTop'] * h; tH = sZ - cZ
    chestC, chestRZ = sZ - tH * 0.3, tH * 0.36
    bellyC, bellyRZ = sZ - tH * 0.63, tH * 0.3
    pelC, pelRZ = cZ + tH * 0.1, tH * 0.2
    beltZ = cZ + tH * 0.3
    sh, arm, fore, hand = P['sh'], P['arm'], P['fore'], P['hand']
    aL = P['armLen'] * h
    B = {}
    def bone(n, a, b, par=None, roll=None): B[n] = (Vector(a), Vector(b), par, roll)
    bone('hips', (0, 0, pelC), (0, 0, beltZ), None)
    bone('spine', (0, 0, beltZ), (0, 0, chestC), 'hips')
    bone('chest', (0, 0, chestC), (0, 0, sZ), 'spine')
    bone('neck', (0, 0, sZ), (0, 0, chin + hd * 0.25), 'chest')
    bone('head', (0, 0, chin + hd * 0.25), (0, 0, h + 0.05), 'neck')
    J = {}
    for s, n in ((1, 'L'), (-1, 'R')):
        S0 = Vector((s * (sh + arm * 0.25), 0, sZ - arm * 1.05))
        E = S0 + Vector((s * 0.2, 0.05, -1)).normalized() * aL * 0.52
        W = E + Vector((s * 0.1, -0.12, -1)).normalized() * aL * 0.48
        Hc = W + Vector((s * 0.05, -0.08, -1)).normalized() * hand * 0.95
        Hj = Vector((s * P['hipW'] * 0.62, 0, cZ + P['leg'] * 0.35))
        A = Vector((s * P['hipW'] * 0.66, 0, P['bootR'] * 1.15))
        K = Vector((s * P['hipW'] * 0.64, -0.012 * h, (Hj.z + A.z) * 0.5 + 0.01 * h))
        T = A + Vector((0, -P['foot'] * 0.72, -P['bootR'] * 0.75))
        J[n] = dict(S=S0, E=E, W=W, H=Hc, Hj=Hj, K=K, A=A, T=T)
        bone('armU' + n, S0, E, 'chest'); bone('armL' + n, E, W, 'armU' + n)
        bone('hand' + n, Hc, Hc + (Hc - W).normalized() * hand, 'armL' + n, Vector((0, -1, 0)))   # roll: 뼈 Z = 앞 → 손 물건 축
        bone('legU' + n, Hj, K, 'hips'); bone('legL' + n, K, A, 'legU' + n); bone('foot' + n, A, T, 'legL' + n)
    vox = 0.012 * h / 1.5
    parts = []
    def nz(co, f=9.0): return noise.noise(co * f + Vector((1.7, 3.3, 5.1)))
    def cloth(c, co, amt=0.07): return c * (1 - amt + amt * 2 * (0.5 + 0.5 * nz(co, 7.0)))
    # ── 몸통(윗옷 · 허리띠 · 바지 · 목) ──
    cx, cy = P['chest']; bx, by = P['belly']
    el = [(Vector((0, 0.0, chestC)), (cx, cy, chestRZ), None),
          (Vector((0, -by * 0.08, bellyC)), (bx, by, bellyRZ), None),
          (Vector((0, 0, pelC)), (P['hipW'] * 1.15, by * 0.85, pelRZ), None),
          (Vector((0, 0, sZ + hd * 0.05)), (hd * 0.42, hd * 0.4, hd * 0.35), None)]   # 목
    for s in (1, -1): el.append((Vector((s * sh * 0.88, 0, sZ - arm * 0.9)), (arm * 1.5, cy * 0.8, arm * 1.3), None))   # 어깨 둥근 살
    torso = metaball(key + '_torso', el, 580, vox)
    apron = C('apron')
    def torso_col(co, n):
        if co.z > sZ - hd * 0.02 and abs(co.x) < hd * 0.6: return skin * 0.95
        if abs(co.z - beltZ) < tH * 0.055: return C('belt') * (1.0 + 0.25 * (abs(co.x) < hd * 0.35 and co.y < 0))
        c = C('top') if co.z > beltZ else C('pants')
        if apron is not None and co.y < -by * 0.25 and abs(co.x) < bx * 0.62 and co.z < chestC + chestRZ * 0.6 and co.z > cZ - 0.05: c = apron
        return cloth(c, co)
    tW = Chain(['hips', 'spine', 'chest', 'neck'], B, 0.1 * h)
    parts.append((torso, tW, torso_col, True, True, 'vk_body'))
    # ── 털조끼(몸통보다 조금 큰 껍질 · 앞 가운데 트임 · 털 결) ──
    if P.get('vest'):
        el = [(Vector((0, 0.01, chestC + chestRZ * 0.05)), (cx * 1.1, cy * 1.12, chestRZ * 1.05), None),
              (Vector((0, -by * 0.06, bellyC + bellyRZ * 0.3)), (bx * 1.08, by * 1.1, bellyRZ * 0.85), None)]
        for s in (1, -1): el.append((Vector((s * sh * 0.86, 0, sZ - arm * 0.9)), (arm * 1.65, cy * 0.85, arm * 1.25), None))
        vest = metaball(key + '_vest', el, 300, vox * 1.1)
        bm = bmesh.new(); bm.from_mesh(vest.data)
        cut = [f for f in bm.faces if f.calc_center_median().y < -cy * 0.4 and abs(f.calc_center_median().x) < cx * 0.28 or f.calc_center_median().z < beltZ + tH * 0.04]
        bmesh.ops.delete(bm, geom=cut, context='FACES')
        for v in bm.verts:                                                   # 털 결: 바깥으로 조금씩 울퉁불퉁
            v.co += v.normal * (0.012 * h / 1.5) * (0.5 + 0.5 * nz(v.co, 14.0))
        bm.to_mesh(vest.data); bm.free()
        vc = C('vest')
        parts.append((vest, tW, lambda co, n: vc * (0.82 + 0.3 * (0.5 + 0.5 * nz(co, 16.0))), True, True, 'vk_body'))
    # ── 팔(소매) · 장갑 손(벙어리장갑) ──
    el = []; armB = []
    for s, n in ((1, 'L'), (-1, 'R')):
        j = J[n]
        el += chain_elems([j['S'], j['E']], [(arm, arm), (arm * 0.92, arm * 0.92)], 0.5)
        if P.get('tool') == n: el += chain_elems([j['E'], j['W'] + (j['W'] - j['E']) * 0.05], [(fore, fore), (fore * 1.05, fore * 1.05)], 0.5)
        else: el += chain_elems([j['E'], j['W']], [(fore, fore), (fore * 0.95, fore * 0.95)], 0.5)
        armB += ['armU' + n, 'armL' + n]
    arms = metaball(key + '_arms', el, 360, vox * 0.9)
    bracer = C('bracer') or (C('glove') if P.get('glove') else None)
    def arm_col(co, n):
        s = 'L' if co.x > 0 else 'R'; j = J[s]
        t = (co - j['E']).dot((j['W'] - j['E']).normalized()) / (j['W'] - j['E']).length
        if bracer is not None and t > 0.45: return cloth(bracer, co, 0.1)
        if t > 0.86 and P.get('tool') != s: return C('cuff') * (0.85 + 0.2 * (0.5 + 0.5 * nz(co, 18.0)))
        return cloth(C('top'), co)
    parts.append((arms, Chain(armB, B, 0.08 * h), arm_col, True, True, 'vk_body'))
    el = []
    for s, n in ((1, 'L'), (-1, 'R')):
        if P.get('tool') == n: continue
        j = J[n]; d = (j['H'] - j['W']).normalized(); fwd = Vector((0, -1, 0))
        q = Vector((0, 0, 1)).rotation_difference(-d)                       # 손바닥 덩어리의 긴 축 = 손 방향
        el.append((j['H'], (hand * 0.8, hand * 0.95, hand * 1.05), q))                                  # 손바닥 덩어리
        el.append((j['H'] + fwd * hand * 0.62 + d * (-hand * 0.15) + Vector((s * hand * 0.2, 0, 0)), (hand * 0.38, hand * 0.38, hand * 0.5), q))   # 엄지
    if el:
        hands = metaball(key + '_hands', el, 170, vox * 0.7)
        gl = C('glove') or skin
        parts.append((hands, lambda p: [('handL' if p.x > 0 else 'handR', 1.0)], lambda co, n: gl * (0.95 + 0.05 * nz(co)), True, False, 'vk_body'))
    # ── 다리(바지) · 장화 ──
    el = []; legB = []
    for s, n in ((1, 'L'), (-1, 'R')):
        j = J[n]
        if P.get('peg') == n:
            el += chain_elems([j['Hj'], j['K'] + Vector((0, 0, P['shin'] * 0.3))], [(P['leg'], P['leg']), (P['shin'] * 1.05, P['shin'] * 1.05)], 0.5)
        else:
            el += chain_elems([j['Hj'], j['K'], j['A'] + Vector((0, 0, P['bootR'] * 1.2))], [(P['leg'], P['leg']), (P['shin'], P['shin']), (P['shin'] * 0.9, P['shin'] * 0.9)], 0.5)
        legB += ['legU' + n, 'legL' + n]
    legs = metaball(key + '_legs', el, 340, vox * 0.9)
    pc = C('pants')
    parts.append((legs, Chain(legB, B, 0.07 * h), lambda co, n: cloth(pc, co), True, True, 'vk_body'))
    el = []
    for s, n in ((1, 'L'), (-1, 'R')):
        if P.get('peg') == n: continue
        j = J[n]; bt = P['bootR']
        el.append((j['A'] + Vector((0, 0, bt * 0.65)), (bt * 0.95, bt * 1.0, bt * 1.25), None))          # 목
        el.append((j['A'] + Vector((0, -P['foot'] * 0.35, -bt * 0.55)), (bt * 0.95, P['foot'] * 0.55, bt * 0.5), None))   # 발
        el.append((j['A'] + Vector((0, 0, bt * 1.75)), (bt * 1.2, bt * 1.2, bt * 0.42), None))           # 털 접단
    if el:
        boots = metaball(key + '_boots', el, 300, vox * 0.8)
        bc, cc = C('boot'), C('cuff')
        def boot_col(co, n):
            s = 'L' if co.x > 0 else 'R'; a = J[s]['A']
            if co.z > a.z + P['bootR'] * 1.45: return cc * (0.8 + 0.3 * (0.5 + 0.5 * nz(co, 20.0)))
            return bc * (0.92 + 0.12 * nz(co, 6.0)) * (0.8 if co.z < 0.02 * h else 1.0)
        parts.append((boots, lambda p: [(('foot' if p.y < J['L']['A'].y - P['foot'] * 0.12 and p.z < J['L']['A'].z else 'legL') + ('L' if p.x > 0 else 'R'), 1.0)], boot_col, True, True, 'vk_body'))
    # ── 머리(머리통 + 볼) ──
    hx, hy, hz = hd * 0.95, hd * 1.0, hd * 1.05
    el = [(Vector((0, 0, hc)), (hx, hy, hz), None), (Vector((0, -hy * 0.22, hc - hd * 0.42)), (hx * 0.86, hy * 0.75, hd * 0.6), None)]
    head = metaball(key + '_head', el, 380, vox * 0.75)
    def head_col(co, n):
        c = skin
        cheek = sm(0.06 * hd, 0.0, abs(Vector((abs(co.x) - hx * 0.55, co.y + hy * 0.75, co.z - (hc - hd * 0.25))).length - 0.12 * hd))
        return c.lerp(lin(0xe89a86), cheek * 0.5)
    parts.append((head, rigid('head'), head_col, True, True, 'vk_body'))
    # ── 얼굴 부품(눈·눈동자·눈썹·코·입·귀) — bmesh ──
    gF = Geo(key + '_face', 'vk_body')
    dark, white = lin(0x22180f), lin(0xf6f0e4)
    brow = (C('beardC') or C('hair') or lin(0x6a5a4a)) * 0.45
    for s in (1, -1):
        ex, ez = s * hd * 0.37, hc + hd * 0.06
        eyp = -hy * math.sqrt(max(0.05, 1 - (ex / hx) ** 2 - ((ez - hc) / hz) ** 2)) * 0.96
        nn = Vector((ex / hx * 0.55, -1, 0.05)).normalized(); up = Vector((0, 0, 1)); ax = nn.cross(up).normalized(); upp = ax.cross(nn).normalized()
        q = rot_from_axes(ax, nn, upp); ec = Vector((ex, eyp, ez))
        blob(gF, ec, (hd * 0.2, hd * 0.1, hd * 0.25), [('head', 1.0)], white, seg=8, rings=6, rot=q)                      # 흰자
        blob(gF, ec + nn * hd * 0.075 + upp * (-hd * 0.02) - ax * (s * hd * 0.02), (hd * 0.12, hd * 0.06, hd * 0.16), [('head', 1.0)], dark, seg=8, rings=5, rot=q)   # 눈동자(조금 안쪽)
        blob(gF, ec + nn * hd * 0.13 + upp * hd * 0.05 + ax * hd * 0.03, (hd * 0.035, hd * 0.02, hd * 0.035), [('head', 1.0)], white, seg=5, rings=3, rot=q)          # 반짝 점
        bq = Quaternion((0, 1, 0), -s * 0.2) @ q
        blob(gF, ec + nn * hd * 0.02 + upp * hd * 0.34, (hd * 0.23, hd * 0.07, hd * 0.075), [('head', 1.0)], brow, seg=6, rings=4, rot=bq)   # 눈썹
        blob(gF, Vector((s * hx * 0.97, hy * 0.05, hc - hd * 0.05)), (hd * 0.09, hd * 0.15, hd * 0.2), [('head', 1.0)], skin * 0.92, seg=6, rings=4)   # 귀
    blob(gF, Vector((0, -hy * 1.0, hc - hd * 0.16)), (hd * 0.21, hd * 0.21, hd * 0.25), [('head', 1.0)], skin.lerp(lin(0xe0907a), 0.35), seg=8, rings=6)   # 큰 코
    if not P.get('beard'):                                                  # 웃는 입(굽은 관)
        mz, my = hc - hd * 0.52, -hy * 0.84
        tube(gF, [Vector((x * hd, my - 0.02 * hd * (1 - abs(x) / 0.22), mz + (x / 0.22) ** 2 * hd * 0.07)) for x in (-0.22, -0.11, 0, 0.11, 0.22)],
             [hd * 0.025] * 5, rigid('head'), sides=4, col=lin(0x7a3a2e))
    parts.append((geo_object(gF), gF.w, gF.c, False, False, 'vk_body'))
    # ── 머리카락 덩어리 ──
    hcC = C('hair'); st = P.get('hairStyle')
    el = []
    if st in ('messy', 'short', 'wild', 'twin', 'dreads', 'braid', 'bun'):
        el.append((Vector((0, hy * 0.14, hc + hd * 0.26)), (hx * 1.05, hy * 1.02, hd * 0.82), None))
        el.append((Vector((0, hy * 0.62, hc - hd * 0.28)), (hx * 0.86, hd * 0.42, hd * 0.5), None))
    if st == 'messy':
        rnd = random.Random(3)
        for i in range(4): el.append((Vector(((i - 1.5) * hd * 0.28, -hy * 0.72, hc + hd * 0.6)), (hd * 0.24, hd * 0.2, hd * 0.26), Quaternion((1, 0, 0), 0.5)))
        for i in range(6):
            a = i / 6 * 2 * math.pi; el.append((Vector((math.cos(a) * hx * 0.65, hy * 0.1 + math.sin(a) * hy * 0.6, hc + hd * 0.85)), (hd * 0.22, hd * 0.22, hd * 0.2), None))
        for s in (1, -1): el.append((Vector((s * hx * 0.92, -hy * 0.15, hc + hd * 0.15)), (hd * 0.2, hd * 0.3, hd * 0.35), None))
    if st == 'wild':
        for s in (1, -1): el.append((Vector((s * hx * 0.95, hy * 0.2, hc + hd * 0.05)), (hd * 0.35, hd * 0.5, hd * 0.55), None))
        el.append((Vector((0, hy * 0.75, hc - hd * 0.45)), (hx * 1.05, hd * 0.45, hd * 0.65), None))
    if st == 'braid':
        el.append((Vector((hx * 0.35, -hy * 0.75, hc + hd * 0.55)), (hd * 0.42, hd * 0.25, hd * 0.3), Quaternion((0, 1, 0), 0.5)))   # 옆 앞머리
        for s in (1, -1): el.append((Vector((s * hx * 0.9, -hy * 0.1, hc)), (hd * 0.18, hd * 0.35, hd * 0.45), None))
        for i in range(8):                                                  # 굵게 땋은 머리(등 가운데까지)
            t = i / 7; el.append((Vector((math.sin(i * 1.7) * hd * 0.06, hy * (0.95 + 0.1 * t), hc - hd * (0.3 + 2.9 * t))), (hd * (0.24 - 0.08 * t), hd * (0.22 - 0.07 * t), hd * 0.26), None))
    if st == 'twin':
        for s in (1, -1):
            for i in range(7):
                t = i / 6; el.append((Vector((s * hx * (0.85 + 0.15 * t), -hy * (0.0 + 0.35 * t), hc - hd * (0.2 + 2.6 * t))), (hd * (0.19 - 0.06 * t),) * 2 + (hd * 0.22,), None))
    if st == 'dreads':
        for k in range(7):
            a = (k / 6 - 0.5) * 2.6
            for i in range(6):
                t = i / 5; el.append((Vector((math.sin(a) * hx * (0.9 + 0.1 * t), math.cos(a) * hy * (0.8 + 0.25 * t), hc - hd * (0.1 + 2.7 * t))), (hd * 0.12,) * 2 + (hd * 0.2,), None))
    if st == 'bun':
        el.append((Vector((0, hy * 0.7, hc + hd * 0.55)), (hd * 0.45, hd * 0.4, hd * 0.42), None))
        for s in (1, -1): el.append((Vector((s * hx * 0.88, -hy * 0.1, hc + hd * 0.05)), (hd * 0.2, hd * 0.35, hd * 0.4), None))
    if st == 'bald':
        for s in (1, -1): el.append((Vector((s * hx * 0.92, hy * 0.25, hc - hd * 0.05)), (hd * 0.22, hd * 0.55, hd * 0.32), None))
        el.append((Vector((0, hy * 0.82, hc - hd * 0.15)), (hx * 0.75, hd * 0.25, hd * 0.32), None))
    if st == 'short':
        for s in (1, -1): el.append((Vector((s * hx * 0.9, hy * 0.05, hc + hd * 0.05)), (hd * 0.2, hd * 0.4, hd * 0.4), None))
        el.append((Vector((0, -hy * 0.68, hc + hd * 0.62)), (hx * 0.75, hd * 0.25, hd * 0.25), None))
    if el and hcC is not None:
        hair = metaball(key + '_hair', el, 360, vox * 0.75)
        parts.append((hair, rigid('head'), lambda co, n: hcC * (0.82 + 0.3 * (0.5 + 0.5 * nz(co, 22.0))), True, True, 'vk_body'))
    # ── 수염 ──
    bdS = P.get('beard')
    if bdS:
        el = []
        if bdS == 'full':                                                   # 스토이크: 코 아래 콧수염 + 가슴까지 내려오는 큰 수염 + 구레나룻 + 땋은 끝 둘
            el += [(Vector((0, -hy * 0.55, chin - hd * 0.55)), (hx * 1.12, hy * 0.72, hd * 0.95), None),
                   (Vector((0, -hy * 0.7, chin - hd * 1.35)), (hx * 0.95, hy * 0.58, hd * 0.85), None)]
            for s in (1, -1):
                el.append((Vector((s * hd * 0.24, -hy * 0.96, hc - hd * 0.46)), (hd * 0.3, hd * 0.17, hd * 0.13), Quaternion((0, 1, 0), s * 0.35)))   # 콧수염
                el.append((Vector((s * hx * 0.88, -hy * 0.35, hc - hd * 0.45)), (hd * 0.26, hd * 0.38, hd * 0.55), None))                           # 구레나룻
                for i in range(4): el.append((Vector((s * hd * 0.3, -hy * 0.85, chin - hd * (2.15 + 0.3 * i))), (hd * 0.13,) * 3, None))
        elif bdS == 'braids':                                               # 고버: 땋아 늘어뜨린 콧수염
            el.append((Vector((0, -hy * 0.98, hc - hd * 0.36)), (hd * 0.62, hd * 0.2, hd * 0.18), None))
            for s in (1, -1):
                for i in range(7): el.append((Vector((s * hd * (0.45 + 0.04 * i), -hy * (0.95 - 0.02 * i), hc - hd * (0.5 + 0.38 * i))), (hd * (0.15 - 0.008 * i),) * 2 + (hd * 0.2,), None))
        else:
            el += [(Vector((0, -hy * 0.6, chin - hd * 0.15)), (hx * 0.95, hy * 0.6, hd * 0.65), None), (Vector((0, -hy * 0.95, hc - hd * 0.32)), (hd * 0.45, hd * 0.17, hd * 0.14), None)]
            for s in (1, -1): el.append((Vector((s * hx * 0.8, -hy * 0.4, hc - hd * 0.35)), (hd * 0.26, hd * 0.35, hd * 0.5), None))
        bdc = C('beardC')
        beard = metaball(key + '_beard', el, 200, vox * 0.75)
        parts.append((beard, rigid('head'), lambda co, n: bdc * (0.82 + 0.3 * (0.5 + 0.5 * nz(co, 20.0))), True, True, 'vk_body'))
    # ── 투구 · 두건 · 머리띠 ──
    gH = Geo(key + '_hat', 'vk_body')
    hel = P.get('helmet'); metal, horn, band = lin(0x8c8e88), lin(0xe6dac0), lin(0x5a5248)
    if hel:
        hz0 = hc + hd * 0.12
        blob(gH, Vector((0, 0, hz0)), (hx * 1.1, hy * 1.1, hd * 0.86), [('head', 1.0)], metal, seg=16, rings=8, zcut=0.0)
        ring = [Vector((math.cos(a) * hx * 1.12, math.sin(a) * hy * 1.12, hz0)) for a in [i / 16 * 2 * math.pi for i in range(17)]]
        tube(gH, ring, [hd * 0.07] * len(ring), rigid('head'), sides=5, col=band, cap=False)
        tube(gH, [Vector((0, -hy * 1.1, hz0 + hd * 0.05)), Vector((0, -hy * 0.6, hz0 + hd * 0.75)), Vector((0, 0, hz0 + hd * 0.88))], [hd * 0.06] * 3, rigid('head'), sides=4, col=band, cap=False)
        for s in (1, -1):
            b0 = Vector((s * hx * 0.95, 0, hz0 + hd * 0.35))
            if hel == 'horns':                                              # 스토이크: 크게 휜 뿔
                tube(gH, [b0, b0 + Vector((s * hd * 0.6, 0, hd * 0.15)), b0 + Vector((s * hd * 1.05, -hd * 0.05, hd * 0.6)), b0 + Vector((s * hd * 1.1, -hd * 0.12, hd * 1.25))],
                     [hd * 0.2, hd * 0.15, hd * 0.09, 0], rigid('head'), sides=7, col=horn)
            elif hel == 'horns2':                                           # 고버: 위로 솟은 뿔
                tube(gH, [b0, b0 + Vector((s * hd * 0.3, 0, hd * 0.35)), b0 + Vector((s * hd * 0.35, 0.05 * hd, hd * 0.9))], [hd * 0.15, hd * 0.1, 0], rigid('head'), sides=6, col=horn)
            elif hel == 'small':
                tube(gH, [b0, b0 + Vector((s * hd * 0.3, 0, hd * 0.12)), b0 + Vector((s * hd * 0.42, 0, hd * 0.45))], [hd * 0.11, hd * 0.075, 0], rigid('head'), sides=6, col=horn)
            elif hel == 'ram':                                              # 스노트라우트: 말린 양뿔
                pts = [b0 + Vector((s * hd * 0.1, hd * 0.1 * k, 0)) + Vector((s * math.cos(k * 1.1) * hd * 0.32, math.sin(k * 1.1) * hd * 0.34, -k * hd * 0.15)) for k in range(6)]
                tube(gH, pts, [hd * (0.17 - 0.025 * k) for k in range(6)], rigid('head'), sides=6, col=horn)
            elif hel == 'four':                                             # 쌍둥이: 뿔 넷
                tube(gH, [b0, b0 + Vector((s * hd * 0.35, 0, hd * 0.2)), b0 + Vector((s * hd * 0.45, 0, hd * 0.55))], [hd * 0.1, hd * 0.07, 0], rigid('head'), sides=6, col=horn)
                b1 = Vector((s * hx * 0.45, -hy * 0.55, hz0 + hd * 0.7))
                tube(gH, [b1, b1 + Vector((s * hd * 0.1, -hd * 0.1, hd * 0.3)), b1 + Vector((s * hd * 0.2, -hd * 0.05, hd * 0.55))], [hd * 0.08, hd * 0.05, 0], rigid('head'), sides=5, col=horn)
    if P.get('hood'):                                                       # 두건 — 머리와 어깨를 덮는 천
        hc2 = lin(P['hood'])
        blob(gH, Vector((0, hy * 0.12, hc + hd * 0.1)), (hx * 1.18, hy * 1.2, hd * 1.08), [('head', 1.0)], hc2, seg=14, rings=8, zcut=-0.25)
    if P.get('headband'):
        ring = [Vector((math.cos(a) * hx * 1.06, math.sin(a) * hy * 1.06, hc + hd * 0.32)) for a in [i / 16 * 2 * math.pi for i in range(17)]]
        tube(gH, ring, [hd * 0.06] * len(ring), rigid('head'), sides=4, col=lin(P['headband']), cap=False)
    if gH.v: parts.append((geo_object(gH), gH.w, gH.c, False, False, 'vk_body'))
    # ── 덤: 망토 · 털 목도리 · 치마 · 어깨 보호대 · 목걸이 · 허리띠 고리 · 의족 · 도구 팔 ──
    gX = Geo(key + '_extra', 'vk_body')
    def rad(z):                                                             # 그 높이의 몸통 반지름(옆, 앞뒤)
        if z > chestC: return Vector((cx, cy, 0))
        if z > bellyC: t = (chestC - z) / (chestC - bellyC); return Vector((cx + (bx - cx) * t, cy + (by - cy) * t, 0))
        t = min(1, (bellyC - z) / max(0.01, bellyC - pelC)); return Vector((bx + (P['hipW'] * 1.15 - bx) * t, by + (by * 0.85 - by) * t, 0))
    if P.get('cape'):                                                       # 스토이크 털망토: 어깨를 감싸고 무릎까지
        capeC = lin(P['cape']); NA, NZ = 8, 5; top, bot = sZ + 0.06 * h / 2, 0.36 * h
        grid = []
        for iz in range(NZ + 1):
            z = top + (bot - top) * iz / NZ; row = []
            for ia in range(NA + 1):
                a = math.radians(-118 + 236 * ia / NA); r = rad(z)
                rx = (sh + arm * 1.2 if iz == 0 else max(r.x, sh * 0.95 if z > chestC - chestRZ * 0.5 else r.x)) + 0.05 * h / 2 + 0.06 * (iz / NZ) * h / 2
                ry = r.y + 0.06 * h / 2 + 0.08 * (iz / NZ) * h / 2
                p = Vector((math.sin(a) * rx, math.cos(a) * ry, z))
                w = [('chest', 1.0)] if z > chestC else ([('spine', 1.0)] if z > beltZ else [('hips', 1.0)])
                row.append((p, w))
            grid.append(row)
        ids_o = [[gX.add(p, w, capeC * (0.9 + 0.12 * nz(p, 12.0))) for (p, w) in row] for row in grid]
        ids_i = [[gX.add(p - Vector((math.sin(math.atan2(p.x, p.y)), math.cos(math.atan2(p.x, p.y)), 0)) * 0.03, w, capeC * 0.6) for (p, w) in row] for row in grid]
        for iz in range(NZ):
            for ia in range(NA):
                gX.face((ids_o[iz][ia], ids_o[iz + 1][ia], ids_o[iz + 1][ia + 1], ids_o[iz][ia + 1]))
                gX.face((ids_i[iz][ia + 1], ids_i[iz + 1][ia + 1], ids_i[iz + 1][ia], ids_i[iz][ia]))
        el = []                                                             # 털 목도리 — 이어진 털 두루마리(어깨를 감쌈)
        for k in range(16):
            a = math.radians(-160 + 320 * k / 15)
            el.append((Vector((math.sin(a) * (sh * 0.88), math.cos(a) * (cy * 0.98), sZ + 0.015 * h)), (0.085 * h / 2, 0.085 * h / 2, 0.065 * h / 2), None))
        fur = metaball(key + '_fur', el, 150, vox)
        fc = lin(0x8a7458)
        parts.append((fur, rigid('chest'), lambda co, n, fc=fc: fc * (0.75 + 0.35 * (0.5 + 0.5 * nz(co, 18.0))), True, True, 'vk_body'))
    if P.get('skirt'):                                                      # 치마(아스트리드: 징 박은 가죽 · 마을 사람: 긴 치마)
        skc = lin(P['skirt']); long = P.get('dress')
        z0, z1 = beltZ, (0.08 * h if long else J['L']['K'].z + 0.06 * h); NA = 18
        r0 = rad(z0) * 1.06; r1x, r1y = P['hipW'] * (2.0 if long else 1.75), by * (1.5 if long else 1.3)
        rows = []
        for iz, (z, rx, ry) in enumerate([(z0, r0.x, r0.y), ((z0 + z1) / 2, (r0.x + r1x) / 2 * 1.02, (r0.y + r1y) / 2 * 1.02), (z1, r1x, r1y)]):
            row = []
            for ia in range(NA):
                a = 2 * math.pi * ia / NA; wob = 1 + 0.04 * math.sin(ia * 3)
                row.append(Vector((math.sin(a) * rx * wob, math.cos(a) * ry * wob, z)))
            rows.append(row)
        oi = [[gX.add(p, [('hips', 1.0)], skc * (0.9 + 0.1 * nz(p))) for p in row] for row in rows]
        ii = [[gX.add(p * 0.97 + Vector((0, 0, p.z * 0.03)), [('hips', 1.0)], skc * 0.5) for p in row] for row in rows]
        for iz in range(2):
            for ia in range(NA):
                ja = (ia + 1) % NA
                gX.face((oi[iz][ia], oi[iz + 1][ia], oi[iz + 1][ja], oi[iz][ja])); gX.face((ii[iz][ja], ii[iz + 1][ja], ii[iz + 1][ia], ii[iz][ia]))
        if not long:                                                        # 징
            for ia in range(0, NA, 2):
                p = rows[1][ia] * 1.02; blob(gX, Vector((p.x, p.y, p.z)), (0.012 * h,) * 3, [('hips', 1.0)], lin(0xb8b4a8), seg=5, rings=3)
    if P.get('pads'):                                                       # 어깨 보호대(가시 셋)
        pc2 = lin(P['pads'])
        for s, n in ((1, 'L'), (-1, 'R')):
            c0 = J[n]['S'] + Vector((s * arm * 0.3, 0, arm * 0.9))
            blob(gX, c0, (arm * 1.6, arm * 1.7, arm * 0.9), [('armU' + n, 1.0)], pc2, seg=10, rings=5, zcut=-0.2)
            for k in range(3):
                b = c0 + Vector((s * arm * 0.6, (k - 1) * arm * 0.8, arm * 0.6))
                tube(gX, [b, b + Vector((s * arm * 0.4, 0, arm * 0.8))], [arm * 0.22, 0], rigid('armU' + n), sides=5, col=lin(0xc8c4b8))
    if P.get('necklace'):
        for k in range(9):
            a = math.radians(-70 + 140 * k / 8); p = Vector((math.sin(a) * hd * 0.62, -math.cos(a) * hd * 0.55, sZ - 0.01 * h))
            tube(gX, [p, p + Vector((0, -0.01, -0.035 * h / 1.5))], [0.012 * h / 1.5, 0], rigid('chest'), sides=4, col=lin(0xf0e8d6))
    bk = Vector((0, -rad(beltZ).y * 1.02, beltZ))                           # 허리띠 고리
    blob(gX, bk, (0.05 * h / 2, 0.02 * h / 2, 0.04 * h / 2), [('hips', 0.5), ('spine', 0.5)], lin(0xb0a890), seg=8, rings=4)
    if P.get('peg'):                                                        # 의족 — 무릎 아래 나무 막대(+ 쇠고리)
        n = P['peg']; j = J[n]; k0 = j['K'] + Vector((0, 0, P['shin'] * 0.1))
        tube(gX, [k0, k0 + Vector((0, 0, -(k0.z - 0.05) * 0.5)), Vector((k0.x, k0.y, 0.04)), Vector((k0.x, k0.y, 0.0))],
             [P['shin'] * 0.85, P['shin'] * 0.45, P['shin'] * 0.38, P['shin'] * 0.5], rigid('legL' + n), sides=7, col=lin(0x7a5a3a))
        ring = [k0 + Vector((math.cos(a) * P['shin'] * 1.0, math.sin(a) * P['shin'] * 1.0, -0.02 * h)) for a in [i / 10 * 2 * math.pi for i in range(11)]]
        tube(gX, ring, [0.012 * h] * len(ring), rigid('legL' + n), sides=4, col=lin(0x6a6a66), cap=False)
    if P.get('tool'):                                                       # 도구 팔 — 쇠 끼움통 + 망치 머리
        n = P['tool']; j = J[n]; d = (j['W'] - j['E']).normalized()
        tube(gX, [j['W'] - d * 0.02, j['W'] + d * 0.08], [fore * 1.1, fore * 0.8], rigid('hand' + n), sides=8, col=lin(0x6e6e6a))
        tube(gX, [j['W'] + d * 0.08, j['W'] + d * 0.3], [fore * 0.35, fore * 0.35], rigid('hand' + n), sides=6, col=lin(0x7a5a3a))
        hp = j['W'] + d * 0.32                                              # 큰 망치 머리(앞뒤로 길게) + 갈고리
        tube(gX, [hp + Vector((0, 0.12, 0)), hp + Vector((0, -0.16, 0))], [(fore * 0.85, fore * 1.0)] * 2, rigid('hand' + n), sides=6, col=lin(0x5e5e5a))
        tube(gX, [hp + Vector((0, 0.12, 0)), hp + Vector((0.05, 0.2, 0.08)), hp + Vector((0.08, 0.16, 0.16))], [fore * 0.3, fore * 0.22, 0], rigid('hand' + n), sides=5, col=lin(0x6e6e6a))
    if gX.v: parts.append((geo_object(gX), gX.w, gX.c, False, False, 'vk_body'))

    body = finish(parts, 0.3 * h / 1.5, 0.004 * h, None); body.name = key
    rig = armature('vk_rig', B); bind([body], rig)
    tri = tris_of(body)
    print('DRG-VK %s tris=%d bones=%d h=%.2f' % (key, tri, len(B), body.dimensions.z))
    export(os.path.join(OUTDIR, key + '.glb'), [rig, body], dict(who=key, h=round(h, 2), tris=tri, bones=len(B)))

# ═════════ 양 — 털 덩어리 · 까만 얼굴 · 가는 다리 넷(뼈 12) ═════════
def build_sheep(key='sheep'):
    reset()
    B = {}
    def bone(n, a, b, par=None, roll=None): B[n] = (Vector(a), Vector(b), par, roll)
    bone('hips', (0, 0.35, 0.58), (0, 0.0, 0.6)); bone('chest', (0, 0.0, 0.6), (0, -0.35, 0.62), 'hips')
    bone('neck', (0, -0.35, 0.64), (0, -0.52, 0.7), 'chest'); bone('head', (0, -0.52, 0.7), (0, -0.78, 0.6), 'neck')
    legs = {}
    for s, n in ((1, 'L'), (-1, 'R')):
        for fb, y, par in (('F', -0.3, 'chest'), ('B', 0.32, 'hips')):
            a, k, f = Vector((s * 0.17, y, 0.42)), Vector((s * 0.17, y + 0.01, 0.22)), Vector((s * 0.17, y - 0.01, 0.01))
            bone('leg' + fb + n, a, k, par); bone('leg' + fb + n + '2', k, f, 'leg' + fb + n); legs[fb + n] = (a, k, f)
    parts = []; rnd = random.Random(5)
    el = [(Vector((0, 0.02, 0.6)), (0.3, 0.46, 0.26), None)]
    for i in range(30):                                                     # 털 뭉치
        a = rnd.uniform(0, 2 * math.pi); z = rnd.uniform(-0.6, 1.0); r = math.sqrt(max(0, 1 - z * z))
        el.append((Vector((math.cos(a) * r * 0.3, rnd.uniform(-0.44, 0.44), 0.6 + z * 0.24)), (0.12, 0.12, 0.11), None))
    el.append((Vector((0, -0.5, 0.78)), (0.12, 0.1, 0.07), None))           # 머리 위 털
    el.append((Vector((0, 0.5, 0.62)), (0.07, 0.06, 0.07), None))           # 꼬리
    wool = metaball('sheep_wool', el, 900, 0.018)
    cream = lin(0xece4d2)
    parts.append((wool, Chain(['hips', 'chest', 'neck', 'head'], B, 0.2), lambda co, n: cream * (0.82 + 0.25 * (0.5 + 0.5 * noise.noise(co * 18))), True, True, 'vk_body'))
    g = Geo('sheep_bits', 'vk_body'); face = lin(0x3a3430)
    blob(g, Vector((0, -0.62, 0.66)), (0.1, 0.17, 0.11), [('head', 1.0)], face, seg=10, rings=7, rot=Quaternion((1, 0, 0), -0.35))
    for s in (1, -1):
        blob(g, Vector((s * 0.11, -0.55, 0.72)), (0.08, 0.035, 0.03), [('head', 1.0)], face * 1.2, seg=6, rings=4)
        blob(g, Vector((s * 0.06, -0.72, 0.7)), (0.018, 0.012, 0.02), [('head', 1.0)], lin(0xf0e8d0), seg=5, rings=3)
    for fb in ('F', 'B'):
        for n in ('L', 'R'):
            a, k, f = legs[fb + n]
            tube(g, [a, k, f + Vector((0, 0, 0.03)), f], [0.04, 0.032, 0.03, 0.036], lambda p, fb=fb, n=n, kz=k.z: [('leg' + fb + n + ('2' if p.z < kz else ''), 1.0)], sides=6,
                 col=lambda p, i: face * (0.6 if i == 3 else 1.0))
    parts.append((geo_object(g), g.w, g.c, False, False, 'vk_body'))
    body = finish(parts, 0.25, 0.003, None); body.name = key
    rig = armature('vk_rig', B); bind([body], rig)
    print('DRG-VK %s tris=%d bones=%d' % (key, tris_of(body), len(B)))
    export(os.path.join(OUTDIR, key + '.glb'), [rig, body], dict(who=key, tris=tris_of(body), bones=len(B)))

for k, P in PEOPLE.items():
    if ONLY and k not in ONLY: continue
    build(k, P)
if not ONLY or 'sheep' in ONLY: build_sheep()
