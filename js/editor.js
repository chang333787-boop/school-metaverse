// 배치 에디터 — data.js의 SCHOOL을 불러와 탑다운으로 편집, JSON 복사/불러오기
// AI 없음: 편집 결과를 복사해 Claude 채팅에 붙여넣으면 반영됨
import { SCHOOL } from './data.js';

let S = JSON.parse(JSON.stringify(SCHOOL));
let floor = 1;
let sel = null;          // {kind:'fac', id} | {kind:'room', row, idx}
let drag = null;         // {mode:'move'|'resize'|'edge', ...}

const cv = document.getElementById('map');
const ctx = cv.getContext('2d');
const K = 5.3, OX = 92, OZ = 75;
const sx = x => (x + OX) * K;
const sz = z => (z + OZ) * K;
const wx = px => px / K - OX;
const wz = py => py / K - OZ;
const snap = (v, s = 0.5) => Math.round(v / s) * s;

// ---------- 행(방 줄) 정의 ----------
const ROWS = {
  front: {
    label: '앞줄', floor: 1,
    rooms: () => S.building.front.rooms,
    band: () => [S.building.front.z[0] + S.building.front.corridorDepth, S.building.front.z[1]],
    corridor: () => [S.building.front.z[0], S.building.front.z[0] + S.building.front.corridorDepth],
    bounds: () => S.building.front.x,
  },
  west: {
    label: '서관', floor: 1,
    rooms: () => S.building.wings[0].rooms,
    band: () => S.building.wings[0].z,
    corridor: () => null,
    bounds: () => S.building.wings[0].x,
  },
  east: {
    label: '동관', floor: 1,
    rooms: () => S.building.eastWing.rooms,
    band: () => [S.building.eastWing.z[0] + S.building.eastWing.corridorDepth, S.building.eastWing.z[1]],
    corridor: () => [S.building.eastWing.z[0], S.building.eastWing.z[0] + S.building.eastWing.corridorDepth],
    bounds: () => S.building.eastWing.x,
  },
  upper: {
    label: '2층', floor: 2,
    rooms: () => S.building.upper.rooms,
    band: () => [S.building.wings[0].z[0], S.building.wings[0].z[1] - S.building.upper.corridorDepth],
    corridor: () => [S.building.wings[0].z[1] - S.building.upper.corridorDepth, S.building.wings[0].z[1]],
    bounds: () => S.building.wings[0].x,
  },
};

// ---------- 시설 정의 ----------
const FACS = [
  { id: 'field', label: '운동장', color: 'rgba(228,207,157,.9)', kind: 'cwd', obj: () => S.field },
  { id: 'gym', label: '체육관', color: 'rgba(195,82,51,.85)', kind: 'cwd', obj: () => S.gym },
  { id: 'garden', label: '텃밭', color: 'rgba(138,90,48,.85)', kind: 'cwd', obj: () => S.garden },
  { id: 'playground', label: '놀이터', color: 'rgba(232,182,79,.85)', kind: 'c', w: 17, d: 14, obj: () => S.playground },
  { id: 'shelter', label: '무지개 쉼터', color: 'rgba(103,178,111,.85)', kind: 'shelter', obj: () => S.shelter },
  { id: 'bigTree', label: '큰 나무', color: 'rgba(61,110,55,.9)', kind: 'pt', r: 4, pt: () => S.bigTree },
  { id: 'gate', label: '교문', color: 'rgba(122,82,48,.9)', kind: 'pt', r: 3, pt: () => S.gate },
  { id: 'flagPole', label: '게양대', color: 'rgba(150,160,170,.9)', kind: 'pt', r: 1.6, pt: () => S.flagPole },
];
function facRect(f) {
  if (f.kind === 'cwd') {
    const o = f.obj();
    return { x0: o.center[0] - o.width / 2, x1: o.center[0] + o.width / 2, z0: o.center[1] - o.depth / 2, z1: o.center[1] + o.depth / 2 };
  }
  if (f.kind === 'c') {
    const o = f.obj();
    return { x0: o.center[0] - f.w / 2, x1: o.center[0] + f.w / 2, z0: o.center[1] - f.d / 2, z1: o.center[1] + f.d / 2 };
  }
  if (f.kind === 'shelter') {
    const o = f.obj();
    return { x0: o.center[0] - o.length / 2, x1: o.center[0] + o.length / 2, z0: o.center[1] - 2.2, z1: o.center[1] + 2.2 };
  }
  const p = f.pt();
  return { x0: p[0] - f.r, x1: p[0] + f.r, z0: p[1] - f.r, z1: p[1] + f.r };
}
function facCenter(f) {
  if (f.kind === 'pt') return f.pt();
  return f.obj().center;
}

const TYPE_COLOR = {
  classroom: '#fdf3d8', office: '#e3ecf5', science: '#e8def0', computer: '#dcebe2',
  library: '#f5e6cf', nurse: '#fde8ec', daycare: '#fdeacd', toilet: '#e4eef2',
  storage: '#e0ddd6', stair: '#d4cec2', hall: '#f2f2ee',
};

// ---------- 그리기 ----------
function draw() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#cfe6c2';
  ctx.fillRect(0, 0, cv.width, cv.height);
  const bd = S.bounds;
  ctx.strokeStyle = '#7a9b6d';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx(-bd.x), sz(bd.zMin), (bd.x * 2) * K, (bd.zMax - bd.zMin) * K);

  const dim = floor === 2;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.28;

  // 시설
  FACS.forEach(f => {
    const r = facRect(f);
    ctx.fillStyle = f.color;
    ctx.fillRect(sx(r.x0), sz(r.z0), (r.x1 - r.x0) * K, (r.z1 - r.z0) * K);
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.label, sx((r.x0 + r.x1) / 2), sz((r.z0 + r.z1) / 2) + 4);
  });

  // 건물 고정부: 급식동·세로복도
  const B = S.building, KT = B.kitchen, LC = B.linkCorridor;
  ctx.fillStyle = '#8a8f96';
  ctx.fillRect(sx(KT.x[0]), sz(KT.z[0]), (KT.x[1] - KT.x[0]) * K, (KT.z[1] - KT.z[0]) * K);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('급식동(고정)', sx((KT.x[0] + KT.x[1]) / 2), sz((KT.z[0] + KT.z[1]) / 2));
  ctx.fillStyle = '#d8d2c6';
  ctx.fillRect(sx(LC.x[0]), sz(B.eastWing.z[0]), (LC.x[1] - LC.x[0]) * K, (KT.z[1] - B.eastWing.z[0]) * K);

  // 방 줄
  Object.entries(ROWS).forEach(([rowId, R]) => {
    if (R.floor !== 1) return;
    drawRow(rowId, R);
  });
  ctx.restore();

  if (floor === 2) drawRow('upper', ROWS.upper);

  // 선택 표시
  if (sel) {
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 3;
    let r = null;
    if (sel.kind === 'fac') {
      const f = FACS.find(x => x.id === sel.id);
      r = facRect(f);
      if (f.kind === 'cwd' || f.kind === 'shelter') {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(sx(r.x1) - 5, sz(r.z1) - 5, 10, 10);
      }
    } else {
      const R = ROWS[sel.row];
      const rm = R.rooms()[sel.idx];
      if (rm) {
        const [b0, b1] = R.band();
        r = { x0: rm.span[0], x1: rm.span[1], z0: b0, z1: b1 };
      }
    }
    if (r) ctx.strokeRect(sx(r.x0), sz(r.z0), (r.x1 - r.x0) * K, (r.z1 - r.z0) * K);
  }
}
function drawRow(rowId, R) {
  const [b0, b1] = R.band();
  const cor = R.corridor();
  if (cor) {
    ctx.fillStyle = '#d8d2c6';
    const [x0, x1] = R.bounds();
    ctx.fillRect(sx(x0), sz(cor[0]), (x1 - x0) * K, (cor[1] - cor[0]) * K);
  }
  R.rooms().forEach(rm => {
    const [s0, s1] = rm.span;
    ctx.fillStyle = TYPE_COLOR[rm.type] || '#f5f5f0';
    ctx.fillRect(sx(s0), sz(b0), (s1 - s0) * K, (b1 - b0) * K);
    ctx.strokeStyle = '#8d99ae';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(s0), sz(b0), (s1 - s0) * K, (b1 - b0) * K);
    ctx.fillStyle = '#1d3557';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const label = rm.name.length > 5 ? rm.name.slice(0, 5) : rm.name;
    ctx.fillText(label, sx((s0 + s1) / 2), sz((b0 + b1) / 2) + 3);
  });
}

// ---------- 히트 테스트 ----------
function pick(px, py) {
  const x = wx(px), z = wz(py);
  // 1) 선택된 시설의 리사이즈 핸들
  if (sel && sel.kind === 'fac') {
    const f = FACS.find(v => v.id === sel.id);
    if (f.kind === 'cwd' || f.kind === 'shelter') {
      const r = facRect(f);
      if (Math.abs(px - sx(r.x1)) < 7 && Math.abs(py - sz(r.z1)) < 7) return { mode: 'resize', f };
    }
  }
  // 2) 방 경계선 (현재 층)
  for (const [rowId, R] of Object.entries(ROWS)) {
    if (R.floor !== floor) continue;
    const [b0, b1] = R.band();
    if (z < b0 - 0.5 || z > b1 + 0.5) continue;
    const rooms = R.rooms();
    for (let i = 0; i < rooms.length - 1; i++) {
      if (Math.abs(x - rooms[i].span[1]) < 0.7) return { mode: 'edge', row: rowId, idx: i };
    }
    // 방 몸체
    for (let i = 0; i < rooms.length; i++) {
      if (x >= rooms[i].span[0] && x <= rooms[i].span[1]) return { mode: 'room', row: rowId, idx: i };
    }
  }
  // 3) 시설 (1층 화면에서만)
  if (floor === 1) {
    for (const f of FACS) {
      const r = facRect(f);
      if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return { mode: 'fac', f };
    }
  }
  return null;
}

// ---------- 마우스 ----------
cv.addEventListener('mousedown', e => {
  const p = pick(e.offsetX, e.offsetY);
  if (!p) { sel = null; updateSide(); draw(); return; }
  if (p.mode === 'resize') {
    drag = { mode: 'resize', f: p.f };
  } else if (p.mode === 'edge') {
    drag = { mode: 'edge', row: p.row, idx: p.idx };
  } else if (p.mode === 'room') {
    sel = { kind: 'room', row: p.row, idx: p.idx };
    drag = null;
  } else if (p.mode === 'fac') {
    sel = { kind: 'fac', id: p.f.id };
    const c = facCenter(p.f);
    drag = { mode: 'move', f: p.f, ox: wx(e.offsetX) - c[0], oz: wz(e.offsetY) - c[1] };
  }
  updateSide();
  draw();
});
window.addEventListener('mousemove', e => {
  if (!drag) {
    if (e.target === cv) {
      const p = pick(e.offsetX, e.offsetY);
      cv.style.cursor = !p ? 'default'
        : p.mode === 'edge' ? 'col-resize'
        : p.mode === 'resize' ? 'nwse-resize'
        : p.mode === 'fac' ? 'move' : 'pointer';
    }
    return;
  }
  if (e.target !== cv && drag.mode !== 'move') return;
  const x = wx(e.offsetX), z = wz(e.offsetY);
  if (drag.mode === 'move') {
    const c = facCenter(drag.f);
    c[0] = snap(x - drag.ox);
    c[1] = snap(z - drag.oz);
  } else if (drag.mode === 'resize') {
    const f = drag.f;
    const c = facCenter(f);
    if (f.kind === 'shelter') {
      f.obj().length = Math.max(6, snap((x - c[0]) * 2, 1));
    } else {
      const o = f.obj();
      o.width = Math.max(6, snap((x - c[0]) * 2, 1));
      o.depth = Math.max(6, snap((z - c[1]) * 2, 1));
    }
  } else if (drag.mode === 'edge') {
    const rooms = ROWS[drag.row].rooms();
    const a = rooms[drag.idx], b = rooms[drag.idx + 1];
    const nx = Math.min(b.span[1] - 2, Math.max(a.span[0] + 2, snap(x)));
    a.span[1] = nx;
    b.span[0] = nx;
  }
  updateSide();
  draw();
});
window.addEventListener('mouseup', () => { drag = null; });
cv.addEventListener('dblclick', e => {
  const p = pick(e.offsetX, e.offsetY);
  if (p && p.mode === 'room') {
    const rm = ROWS[p.row].rooms()[p.idx];
    const nm = prompt('방 이름', rm.name);
    if (nm && nm.trim()) rm.name = nm.trim();
    draw();
  }
});

// ---------- 사이드바 ----------
const selInfo = document.getElementById('selInfo');
const roomOps = document.getElementById('roomOps');
const typeSel = document.getElementById('typeSel');
function updateSide() {
  if (!sel) { selInfo.textContent = '선택: 없음'; roomOps.style.display = 'none'; return; }
  if (sel.kind === 'fac') {
    const f = FACS.find(v => v.id === sel.id);
    const r = facRect(f);
    selInfo.textContent = `선택: ${f.label} — ${(r.x1 - r.x0).toFixed(1)} × ${(r.z1 - r.z0).toFixed(1)}m`;
    roomOps.style.display = 'none';
  } else {
    const rm = ROWS[sel.row].rooms()[sel.idx];
    if (!rm) { sel = null; return updateSide(); }
    selInfo.textContent = `선택: ${rm.name} (${ROWS[sel.row].label}) — 폭 ${(rm.span[1] - rm.span[0]).toFixed(1)}m`;
    roomOps.style.display = 'flex';
    typeSel.value = rm.type;
  }
}
typeSel.addEventListener('change', () => {
  if (sel && sel.kind === 'room') {
    ROWS[sel.row].rooms()[sel.idx].type = typeSel.value;
    draw();
  }
});
document.getElementById('splitBtn').addEventListener('click', () => {
  if (!sel || sel.kind !== 'room') return;
  const rooms = ROWS[sel.row].rooms();
  const rm = rooms[sel.idx];
  const mid = snap((rm.span[0] + rm.span[1]) / 2);
  if (mid - rm.span[0] < 2 || rm.span[1] - mid < 2) return alert('방이 너무 좁아 나눌 수 없어요');
  rooms.splice(sel.idx + 1, 0, { name: '새 방', type: 'classroom', span: [mid, rm.span[1]] });
  rm.span = [rm.span[0], mid];
  updateSide();
  draw();
});
document.getElementById('delBtn').addEventListener('click', () => {
  if (!sel || sel.kind !== 'room') return;
  const rooms = ROWS[sel.row].rooms();
  if (rooms.length <= 1) return alert('마지막 방은 지울 수 없어요');
  const rm = rooms[sel.idx];
  if (sel.idx > 0) rooms[sel.idx - 1].span[1] = rm.span[1];
  else rooms[1].span[0] = rm.span[0];
  rooms.splice(sel.idx, 1);
  sel = null;
  updateSide();
  draw();
});
document.getElementById('f1').addEventListener('click', () => setFloor(1));
document.getElementById('f2').addEventListener('click', () => setFloor(2));
function setFloor(f) {
  floor = f;
  sel = null;
  document.getElementById('f1').classList.toggle('on', f === 1);
  document.getElementById('f2').classList.toggle('on', f === 2);
  updateSide();
  draw();
}

// ---------- 복사 / 불러오기 ----------
const io = document.getElementById('io');
document.getElementById('copyBtn').addEventListener('click', async () => {
  const json = JSON.stringify(S, null, 1);
  io.value = json;
  try {
    await navigator.clipboard.writeText('[배치 에디터 결과]\n' + json);
    alert('복사됐어요! Claude 채팅에 붙여넣으면 반영해 드립니다.');
  } catch (e) {
    io.select();
    alert('자동 복사가 막혀서 아래 칸에 넣어뒀어요 — 전체 선택해서 복사해 주세요.');
  }
});
document.getElementById('loadBtn').addEventListener('click', () => {
  try {
    const t = io.value.replace(/^\[배치 에디터 결과\]\s*/, '');
    const parsed = JSON.parse(t);
    if (!parsed.building || !parsed.building.front) throw new Error('형식이 달라요');
    S = parsed;
    sel = null;
    updateSide();
    draw();
    alert('불러왔어요!');
  } catch (e) {
    alert('불러오기 실패: ' + e.message);
  }
});

updateSide();
draw();
