# 바이킹 사람 공장 — 표 한 줄 = 사람 하나 · Blender 4.2 명령줄
#   Blender -b --factory-startup --python tools/dragon_blender/viking.py -- <출력 폴더> [이름,이름…]
# 빌리는 것은 알아볼 신호만(reference B) — 마른 히컵 · 금발 땋은 머리 아스트리드 · 붉은 수염 큰 스토이크 · 오른다리 막대 고버 …
# 몸 = skin 수정자 관(살짝 덩어리진 그림책 비례) · 머리·머리카락·수염·투구 = 타원체 · 뼈 17(이름 고정 — 게임 코드가 직접 돌림)
# 앞 = -Y(glTF +Z) · 위 = +Z · 단위 m
import bpy, bmesh, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUTDIR = argv[0] if argv else '/tmp/vikings'
ONLY = set(argv[1].split(',')) if len(argv) > 1 else None
os.makedirs(OUTDIR, exist_ok=True)

def hexc(h): return (((h >> 16) & 255) / 255) ** 2.2, (((h >> 8) & 255) / 255) ** 2.2, ((h & 255) / 255) ** 2.2
SKIN = 0xf0c9a8
# h 키 · g 몸통 굵기 · head 머리 크기 · 색: top 윗옷 · vest 조끼(없으면 None) · pants · boot · hair · beard(없으면 None) · helmet: None/'round'/'horn'/'ram'/'four' · extra
PEOPLE = {
  'hiccup':    dict(h=1.52, g=0.72, head=1.12, top=0x5e7d3c, vest=0x6a4b30, pants=0x5b4a38, boot=0x3e2f22, hair=0x8a4a22, hairStyle='short', beard=None, helmet=None),
  'hiccup_hel':dict(h=1.52, g=0.72, head=1.12, top=0x5e7d3c, vest=0x6a4b30, pants=0x5b4a38, boot=0x3e2f22, hair=0x8a4a22, hairStyle='short', beard=None, helmet='horn'),
  'hiccup_leg':dict(h=1.52, g=0.72, head=1.12, top=0x5e7d3c, vest=0x6a4b30, pants=0x5b4a38, boot=0x3e2f22, hair=0x8a4a22, hairStyle='short', beard=None, helmet=None, peg='L'),
  'astrid':    dict(h=1.58, g=0.86, head=1.08, top=0x3f5f80, vest=None, pants=0x4a3a2c, boot=0x3a2c20, hair=0xe6c464, hairStyle='braid', beard=None, helmet=None, skirt=0x4a3a2a),
  'fishlegs':  dict(h=1.72, g=1.38, head=1.0, top=0x6e5a3c, vest=0x7a5a36, pants=0x4c3c2c, boot=0x35281c, hair=0xd8b864, hairStyle='short', beard=None, helmet='round'),
  'snotlout':  dict(h=1.5, g=1.12, head=1.04, top=0x3a3530, vest=0x2a2622, pants=0x4a3c30, boot=0x2e241c, hair=0x2c2218, hairStyle='short', beard=None, helmet='ram'),
  'ruffnut':   dict(h=1.6, g=0.86, head=1.04, top=0x546a8a, vest=0x5a4a36, pants=0x4c3c2c, boot=0x35281c, hair=0xe8d070, hairStyle='long', beard=None, helmet='four'),
  'tuffnut':   dict(h=1.62, g=0.9, head=1.04, top=0x5a5a48, vest=0x5a4a36, pants=0x4c3c2c, boot=0x35281c, hair=0xe8d070, hairStyle='dread', beard=None, helmet='four'),
  'stoick':    dict(h=2.15, g=1.75, head=0.95, top=0x6a4a30, vest=0x5c4632, pants=0x4a3a2c, boot=0x30241a, hair=0xa83e1e, hairStyle='short', beard=0xa83e1e, helmet='horn', cape=0x7a6248),
  'gobber':    dict(h=1.88, g=1.4, head=0.98, top=0x6a5038, vest=0x4a3a2c, pants=0x4a3a2c, boot=0x30241a, hair=0xe0c070, hairStyle='bald', beard=0xe0c070, beardStyle='mustache', helmet='horn', peg='R', tool='L'),
  'villager1': dict(h=1.9, g=1.5, head=0.98, top=0x5a6a4a, vest=0x5a4632, pants=0x4a3a2c, boot=0x30241a, hair=0x5a3a22, hairStyle='short', beard=0x5a3a22, helmet='round'),
  'villager2': dict(h=1.7, g=1.2, head=1.0, top=0x7a5a48, vest=None, pants=0x4a3a2c, boot=0x30241a, hair=0xc8a050, hairStyle='braid', beard=None, helmet=None, skirt=0x6a4a3a),
  'villager3': dict(h=2.0, g=1.6, head=0.96, top=0x4a5a6a, vest=0x6a5038, pants=0x4a3a2c, boot=0x30241a, hair=0x3a2a1a, hairStyle='bald', beard=0x8a6a4a, helmet='horn'),
}

def mat(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); p.inputs['Base Color'].default_value = (*rgb, 1)
    return m
def activate(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
def paint(o, rgb):
    ca = o.data.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for v in o.data.vertices: ca.data[v.index].color = (*rgb, 1)
def blob(name, co, r, rgb, seg=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=co)
    o = bpy.context.view_layer.objects.active; o.name = name; o.scale = r
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); paint(o, rgb); return o
def tube(name, pts, radii, rgb, sub=1):
    me = bpy.data.meshes.new(name); me.from_pydata(pts, [(i, i + 1) for i in range(len(pts) - 1)], []); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.modifiers.new('SK', 'SKIN'); activate(o)
    for i, r in enumerate(radii): me.skin_vertices[0].data[i].radius = r if isinstance(r, tuple) else (r, r)
    me.skin_vertices[0].data[0].use_root = True
    if sub: s = o.modifiers.new('SUB', 'SUBSURF'); s.levels = sub
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    paint(o, rgb); return o

def build(key, P):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    h, g, hs = P['h'], P['g'], P['head']
    sw, hw = 0.19 * g ** 0.6 * h / 1.6, 0.09 * g ** 0.5 * h / 1.6      # 어깨 반폭 · 엉덩이 반폭
    z = lambda k: h * k
    parts = []
    # 몸통(윗옷) — 가슴이 굵고 배는 g만큼
    parts.append(tube('torso', [(0, 0, z(0.47)), (0, 0, z(0.58)), (0, 0, z(0.7)), (0, 0, z(0.79))],
                      [(0.11 * g, 0.085 * g), (0.12 * g, 0.1 * g), (0.13 * g, 0.1 * g ** 0.8), (0.1 * g, 0.075 * g)], hexc(P['top'])))
    if P.get('vest'): parts.append(tube('vest', [(0, 0.01, z(0.55)), (0, 0.01, z(0.66)), (0, 0.01, z(0.78))],
                                         [(0.135 * g, 0.105 * g), (0.142 * g, 0.108 * g ** 0.8), (0.12 * g, 0.085 * g)], hexc(P['vest'])))
    if P.get('skirt'): parts.append(tube('skirt', [(0, 0, z(0.36)), (0, 0, z(0.5))], [(0.16 * g, 0.13 * g), (0.12 * g, 0.095 * g)], hexc(P['skirt'])))
    if P.get('cape'): parts.append(blob('cape', (0, 0.05, z(0.78)), (0.2 * g, 0.12 * g, 0.07 * h), hexc(P['cape'])))
    # 다리(바지 · 장화) · 막대 다리(peg)
    for s, n in ((1, 'R'), (-1, 'L')):
        x = hw * s
        if P.get('peg') == n:
            parts.append(tube('leg' + n, [(x, 0, z(0.5)), (x, 0, z(0.3))], [0.07 * g ** 0.5, 0.06 * g ** 0.5], hexc(P['pants'])))
            parts.append(tube('peg' + n, [(x, 0, z(0.3)), (x, 0, 0.0)], [0.025, 0.022], hexc(0x6a5a48), sub=0))
        else:
            parts.append(tube('leg' + n, [(x, 0, z(0.5)), (x, -0.01, z(0.27)), (x, 0, z(0.08))], [0.07 * g ** 0.5, 0.06 * g ** 0.5, 0.05 * g ** 0.4], hexc(P['pants'])))
            parts.append(tube('boot' + n, [(x, 0.01, z(0.1)), (x, -0.01, 0.03), (x, -0.11, 0.03)], [0.06 * g ** 0.4, 0.055 * g ** 0.4, (0.045, 0.035)], hexc(P['boot'])))
        # 팔(소매 · 손) · 도구 팔(tool)
        ax = sw * s
        parts.append(tube('arm' + n, [(ax, 0, z(0.78)), (ax * 1.18, 0.02, z(0.6)), (ax * 1.24, -0.04, z(0.46))], [0.05 * g ** 0.6, 0.045 * g ** 0.6, 0.04 * g ** 0.5], hexc(P['top'])))
        if P.get('tool') == n: parts.append(tube('tool' + n, [(ax * 1.24, -0.04, z(0.46)), (ax * 1.26, -0.06, z(0.38))], [0.02, 0.05], hexc(0x8a8a86), sub=0))
        else: parts.append(blob('hand' + n, (ax * 1.25, -0.05, z(0.43)), (0.04, 0.035, 0.05), hexc(SKIN), 8, 6))
    # 머리 · 얼굴 · 머리카락 · 수염 · 투구
    hr = 0.115 * hs * (h / 1.6) ** 0.35; hz = z(0.79) + hr * 1.05
    parts.append(tube('neck', [(0, 0, z(0.78)), (0, 0, hz - hr * 0.6)], [0.045 * g ** 0.5, 0.05 * g ** 0.4], hexc(SKIN), sub=0))
    parts.append(blob('head', (0, 0, hz), (hr * 0.95, hr, hr * 1.05), hexc(SKIN), 16, 10))
    for s in (1, -1): parts.append(blob('eye', (0.042 * s * hs, -hr * 0.9, hz + hr * 0.1), (0.016, 0.01, 0.022), hexc(0x1a1410), 8, 6))
    parts.append(blob('nose', (0, -hr * 1.0, hz - hr * 0.08), (0.022, 0.025, 0.03), hexc(0xe6b896), 8, 6))
    hc, st = hexc(P['hair']), P.get('hairStyle')
    if st != 'bald': parts.append(blob('hair', (0, hr * 0.12, hz + hr * 0.28), (hr * 1.0, hr * 0.98, hr * 0.8), hc, 14, 8))
    if st == 'braid': parts.append(tube('braid', [(0.05, hr * 0.7, hz - hr * 0.2), (0.09, hr * 0.9, hz - hr * 1.5), (0.1, hr * 0.85, hz - hr * 2.6)], [0.035, 0.03, 0.02], hc))
    if st == 'long':
        for s in (1, -1): parts.append(tube('braid', [(0.09 * s, hr * 0.4, hz - hr * 0.3), (0.12 * s, hr * 0.3, hz - hr * 2.2)], [0.03, 0.022], hc))
    if st == 'dread': parts.append(tube('braid', [(0, hr * 0.8, hz), (0, hr * 1.1, hz - hr * 2.0)], [0.035, 0.025], hc))
    if P.get('beard'):
        bc = hexc(P['beard'])
        if P.get('beardStyle') == 'mustache':
            for s in (1, -1): parts.append(tube('stache', [(0.03 * s, -hr * 0.95, hz - hr * 0.3), (0.09 * s, -hr * 0.9, hz - hr * 0.6), (0.1 * s, -hr * 0.85, hz - hr * 1.3)], [0.025, 0.02, 0.012], bc))
        else: parts.append(blob('beard', (0, -hr * 0.55, hz - hr * 0.75), (hr * 0.95, hr * 0.7, hr * 1.0), bc, 14, 8))
    hel = P.get('helmet')
    if hel:
        parts.append(blob('helmet', (0, 0, hz + hr * 0.35), (hr * 1.08, hr * 1.08, hr * 0.78), hexc(0x8a8c86), 14, 8))
        horn = hexc(0xe8dcc0)
        for s in (1, -1):
            if hel == 'horn': parts.append(tube('horn', [(hr * 0.9 * s, 0, hz + hr * 0.5), (hr * 1.5 * s, 0, hz + hr * 0.9), (hr * 1.7 * s, 0, hz + hr * 1.6)], [0.045, 0.03, 0.008], horn))
            elif hel == 'ram': parts.append(tube('horn', [(hr * 0.9 * s, 0, hz + hr * 0.4), (hr * 1.4 * s, hr * 0.4, hz + hr * 0.2), (hr * 1.35 * s, -hr * 0.1, hz - hr * 0.2)], [0.04, 0.035, 0.015], horn))
            elif hel == 'four':
                parts.append(tube('horn', [(hr * 0.7 * s, -hr * 0.3, hz + hr * 0.8), (hr * 0.9 * s, -hr * 0.4, hz + hr * 1.3)], [0.025, 0.006], horn, sub=0))
                parts.append(tube('horn', [(hr * 0.7 * s, hr * 0.3, hz + hr * 0.8), (hr * 0.9 * s, hr * 0.4, hz + hr * 1.3)], [0.025, 0.006], horn, sub=0))
            elif hel == 'round': parts.append(tube('horn', [(hr * 0.85 * s, 0, hz + hr * 0.6), (hr * 1.05 * s, 0, hz + hr * 0.85)], [0.025, 0.008], horn, sub=0))
    # 하나로 합침
    activate(parts[0])
    for o in parts[1:]: o.select_set(True)
    bpy.ops.object.join(); body = bpy.context.view_layer.objects.active; body.name = key
    M = mat('vk_body', (1, 1, 1)); body.data.materials.clear(); body.data.materials.append(M)
    for p in body.data.polygons: p.use_smooth = True
    # 뼈 17
    arm = bpy.data.armatures.new('vk_rig'); rig = bpy.data.objects.new('vk_rig', arm); bpy.context.scene.collection.objects.link(rig)
    activate(rig); bpy.ops.object.mode_set(mode='EDIT'); B = {}
    def bone(n, a, b, par=None, conn=False):
        e = arm.edit_bones.new(n); e.head = a; e.tail = b
        if par: e.parent = B[par]; e.use_connect = conn
        B[n] = e
    bone('hips', (0, 0, z(0.47)), (0, 0, z(0.58)))
    bone('spine', (0, 0, z(0.58)), (0, 0, z(0.7)), 'hips', True)
    bone('chest', (0, 0, z(0.7)), (0, 0, z(0.79)), 'spine', True)
    bone('neck', (0, 0, z(0.79)), (0, 0, hz - hr * 0.5), 'chest', True)
    bone('head', (0, 0, hz - hr * 0.5), (0, 0, hz + hr * 1.6), 'neck', True)
    for s, n in ((1, 'R'), (-1, 'L')):
        ax, x = sw * s, hw * s
        bone('armU' + n, (ax, 0, z(0.78)), (ax * 1.18, 0.02, z(0.6)), 'chest')
        bone('armL' + n, (ax * 1.18, 0.02, z(0.6)), (ax * 1.24, -0.04, z(0.46)), 'armU' + n, True)
        bone('hand' + n, (ax * 1.24, -0.04, z(0.46)), (ax * 1.26, -0.06, z(0.38)), 'armL' + n, True)
        bone('legU' + n, (x, 0, z(0.5)), (x, -0.01, z(0.27)), 'hips')
        bone('legL' + n, (x, -0.01, z(0.27)), (x, 0, z(0.07)), 'legU' + n, True)
        bone('foot' + n, (x, 0, z(0.07)), (x, -0.12, 0.02), 'legL' + n, True)
    bpy.ops.object.mode_set(mode='OBJECT')
    activate(body); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    # 머리 위쪽(머리·머리카락·투구·수염)은 head 하나로 — 자동 무게가 목·어깨로 새지 않게
    VG = body.vertex_groups
    for v in body.data.vertices:
        if v.co.z > hz - hr * 1.6 and abs(v.co.x) < hr * 2.0 and not (v.co.z < z(0.82) and abs(v.co.x) > sw * 0.8):
            for gname in [gr.name for gr in VG]:
                try: VG[gname].remove([v.index])
                except RuntimeError: pass
            VG['head'].add([v.index], 1.0, 'REPLACE')
    tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
    out = os.path.join(OUTDIR, key + '.glb')
    for x in bpy.context.view_layer.objects: x.select_set(False)
    rig.select_set(True); body.select_set(True)
    kw = dict(filepath=out, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_yup=True, export_apply=True)
    try: bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
    except TypeError: bpy.ops.export_scene.gltf(**kw)
    print('DRG-VK %s tris=%d h=%.2f' % (key, tris, h))

for k, P in PEOPLE.items():
    if ONLY and k not in ONLY: continue
    build(k, P)
