// 실제 사진 표 검사(REALPIC-1 · 브라우저 X): node tools/harness/town_photocheck.mjs
//   ① 표(v2/games/town_photos.js)의 사진마다 파일이 있음 · 크기 상한(새 사진 120KB · 예전 갯벌 셋 400KB) · 가로 1280 이하(새 사진 800 이하) · JPEG
//   ② CREDITS.md 두 곳(v2/img/photos · tools/export/overlay/img/photos)에 파일 이름 + 원본 주소 줄이 다 있음 · 폴더의 사진이 모두 표에 있음(남는 파일 X)
//   ③ 이용 허락 = 자유 이용만(CC0 · 퍼블릭 도메인 · 공공누리 1유형 · CC BY · CC BY-SA) · 원본 = 위키미디어 공용
//   ④ 도감 칸(곤충 · 야생동물 · 물고기)마다 사진 한 장(빠진 것은 까닭이 적힌 것만) · SAME·PHOTO_OF가 가리키는 사진이 있음 · 장소 이름 몇 개가 맞는 사진을 찾음
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const G = f => pathToFileURL(path.join(ROOT, 'v2/games', f)).href;
const { PHOTOS, SAME, PHOTO_OF, photoKey, photoOf } = await import(G('town_photos.js'));
const { BUGS } = await import(G('town_bugs.js'));
const { WILD } = await import(G('town_wild.js'));
const { FISH } = await import(G('town_fish.js'));
const { FRESH } = await import(G('town_tools.js'));
const DIR = path.join(ROOT, 'v2/img/photos');
const OLD = new Set(['mudflat_gochang.jpg', 'seawall_saemangeum.jpg', 'mudflat_suncheon.jpg']);   // 갯벌(ART-2 · 1280판)
// 일부러 비워 둔 칸(살아 있는 모습의 자유 이용 사진을 못 찾음 — 시장·표본 사진은 쓰지 않음)
const NO_PHOTO = { 'fish:mineo': '살아 있는 민어 사진 없음 — 공용엔 시장·요리 사진뿐' };
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const jpegSize = b => { if (b[0] !== 0xff || b[1] !== 0xd8) return null; let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1], L = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + L; } return null; };

console.log('① 파일 · 크기');
const keys = Object.keys(PHOTOS), files = new Set(), big = [], miss = [], wide = [], notJ = [];
let total = 0;
for (const k of keys) { const P = PHOTOS[k], f = path.join(DIR, P.src); files.add(P.src); if (!fs.existsSync(f)) { miss.push(P.src); continue; } const b = fs.readFileSync(f), sz = jpegSize(b); total += b.length;
  if (!sz) notJ.push(P.src); else if (sz.w > (OLD.has(P.src) ? 1280 : 800)) wide.push(P.src + ' ' + sz.w);
  if (b.length > (OLD.has(P.src) ? 400 : 120) * 1024) big.push(P.src + ' ' + Math.round(b.length / 1024) + 'KB'); }
const NEW = [...files].filter(f => !OLD.has(f));
const newBytes = NEW.reduce((a, f) => a + (fs.existsSync(path.join(DIR, f)) ? fs.statSync(path.join(DIR, f)).size : 0), 0);
console.log('    사진 ' + files.size + '장(새 ' + NEW.length + ') · 모두 ' + (total / 1048576).toFixed(2) + 'MB · 새 사진 ' + (newBytes / 1048576).toFixed(2) + 'MB(장당 평균 ' + Math.round(newBytes / Math.max(1, NEW.length) / 1024) + 'KB)');
ok(!miss.length, '표의 사진 파일이 다 있음' + (miss.length ? ' ← ' + miss.join(', ') : ''));
ok(!notJ.length, 'JPEG' + (notJ.length ? ' ← ' + notJ.join(', ') : ''));
ok(!big.length, '크기 상한(새 120KB · 갯벌 셋 400KB)' + (big.length ? ' ← ' + big.join(', ') : ''));
ok(!wide.length, '가로(새 800 · 갯벌 셋 1280) 이하' + (wide.length ? ' ← ' + wide.join(', ') : ''));
ok(NEW.every(f => /^[a-z_]+\.jpg$/.test(f)), '파일 이름 = 영문 소문자·밑줄(내보내기 허용 목록과 같게)');
const onDisk = fs.readdirSync(DIR).filter(f => /\.(jpe?g|png|webp)$/i.test(f)), orphan = onDisk.filter(f => !files.has(f));
ok(!orphan.length, '폴더의 사진 ' + onDisk.length + '장이 모두 표에 있음' + (orphan.length ? ' ← 남는 파일 ' + orphan.join(', ') : ''));

console.log('② 출처 줄(CREDITS.md 두 곳)');
for (const cp of ['v2/img/photos/CREDITS.md', 'tools/export/overlay/img/photos/CREDITS.md']) { const md = fs.readFileSync(path.join(ROOT, cp), 'utf8'), rows = md.split('\n').filter(l => l.startsWith('| ') && !/^\| (파일|---)/.test(l));
  const lack = keys.filter(k => !rows.some(r => r.startsWith('| ' + PHOTOS[k].src + ' |') && r.includes(PHOTOS[k].url) && r.includes(PHOTOS[k].by)));
  const extra = rows.map(r => r.split('|')[1].trim()).filter(f => !files.has(f));
  ok(!lack.length, cp + ' — 사진마다 파일 · 지은이 · 원본 주소 줄(' + rows.length + '줄)' + (lack.length ? ' ← 빠짐 ' + lack.map(k => PHOTOS[k].src).join(', ') : ''));
  ok(!extra.length, cp + ' — 표에 없는 줄 X' + (extra.length ? ' ← ' + extra.join(', ') : '')); }

console.log('③ 이용 허락 · 원본');
const LICOK = /^(CC0|PD|KOGL1|CC BY(-SA)? \d(\.\d)?( [a-z]{2})?)$/;
const badL = keys.filter(k => !LICOK.test(PHOTOS[k].lic)), badU = keys.filter(k => !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(PHOTOS[k].url)), noBy = keys.filter(k => !String(PHOTOS[k].by || '').trim());
const kinds = {}; for (const k of keys) { const L = PHOTOS[k].lic.replace(/ \d.*$/, ''); kinds[L] = (kinds[L] || 0) + 1; }
console.log('    허락 갈래: ' + Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(' · '));
ok(!badL.length, '자유 이용 허락만' + (badL.length ? ' ← ' + badL.map(k => k + ' ' + PHOTOS[k].lic).join(', ') : ''));
ok(!badU.length, '원본 주소 = 위키미디어 공용 파일 쪽' + (badU.length ? ' ← ' + badU.join(', ') : ''));
ok(!noBy.length, '지은이 칸이 빈 것 X' + (noBy.length ? ' ← ' + noBy.join(', ') : ''));
ok(keys.every(k => PHOTOS[k].t && PHOTOS[k].t[0] && PHOTOS[k].t[1]), '무엇(한국어 · 영어) 글이 다 있음');

console.log('④ 도감 칸 · 장소 이름');
const want = [...BUGS.map(b => 'bug:' + b.id), ...WILD.map(w => 'wild:' + w.id), ...FISH.map(f => 'fish:' + f.id), ...FRESH.map(f => 'fish:' + f.id)];
const lackD = want.filter(k => !photoOf(k) && !NO_PHOTO[k]);
const grp = p => want.filter(k => k.startsWith(p) && photoOf(k)).length + '/' + want.filter(k => k.startsWith(p)).length;
console.log('    곤충 ' + grp('bug:') + ' · 야생동물 ' + grp('wild:') + ' · 물고기 ' + grp('fish:') + (Object.keys(NO_PHOTO).length ? ' · 비워 둔 칸 ' + Object.entries(NO_PHOTO).map(([k, v]) => k + '(' + v + ')').join(', ') : ''));
ok(!lackD.length, '곤충 · 야생동물 · 물고기 도감 칸마다 사진 한 장' + (lackD.length ? ' ← 빠짐 ' + lackD.join(', ') : ''));
ok(Object.keys(NO_PHOTO).every(k => !photoOf(k)), '비워 둔 칸 표와 실제가 같음');
const badS = Object.entries(SAME).filter(([, v]) => !PHOTOS[v]).map(([k]) => k), badO = PHOTO_OF.filter(([, k]) => !PHOTOS[k] && !SAME[k]).map(([re]) => String(re));
ok(!badS.length && !badO.length, 'SAME · PHOTO_OF가 가리키는 사진이 다 있음' + (badS.length || badO.length ? ' ← ' + [...badS, ...badO].join(', ') : ''));
const used = new Set([...Object.values(SAME), ...PHOTO_OF.map(([, k]) => k), 'suncheon']), DEXK = /^(bug|wild|fish):|^[^\x00-\x7f]/;
const unused = keys.filter(k => !used.has(k) && !DEXK.test(k));
ok(!unused.length, '장소 사진은 PHOTO_OF·SAME로 쓰임(안 쓰는 사진 X)' + (unused.length ? ' ← ' + unused.join(', ') : ''));
const CASES = [['갯벌', 'gochang'], ['간척지', 'saemangeum'], ['뒷산', 'pl:hill'], ['뒷산 정상', 'pl:summit'], ['강', 'pl:river'], ['호수', 'pl:lake'], ['연못', 'pl:pond'], ['바다', 'pl:sea'], ['해수욕장', 'pl:beach'], ['숲속 오솔길', 'pl:forest'], ['자연 휴식년제 숲', 'pl:forest'], ['버섯 숲', 'pl:mushforest'], ['생태 하천', 'pl:ecostream'], ['정자나무 쉼터', 'pl:zelkova'], ['염전', '🧂'], ['배 과수원', '🍐'], ['고랭지 배추밭', '🥬'], ['감자밭', '🥔'], ['딸기 비닐하우스', '🍓'], ['표고 재배장', '🍄'], ['양봉장', '🍯'], ['김 양식장', '🌿'], ['목장', '🥛'], ['산속 모두의 상점', null], ['수산물 시장', null], ['강아지 카페', null], ['마트', null]];
const wrong = CASES.filter(([n, k]) => { const got = photoKey(n); return k === null ? got !== null : photoOf(got) !== photoOf(k) || !photoOf(got); });
ok(!wrong.length, '장소 이름 → 사진 ' + CASES.length + '가지(가게·시장은 사진 X)' + (wrong.length ? ' ← ' + wrong.map(([n, k]) => n + '=' + photoKey(n) + '(기대 ' + k + ')').join(', ') : ''));
console.log(fails ? 'FAIL ' + fails : 'PASS');
process.exit(fails ? 1 : 0);
