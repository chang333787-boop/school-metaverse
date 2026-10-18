// 🎮 일꾼 곁 거들기 놀이(PLAY-2 틀 다섯 → PLAY-3 '그 일의 진짜 동작 + 배울 거리 하나' · 사용자 10-17 '미니게임들 좋은데 너무 다 비슷한 방식 · 창의성 · 교육을 잃어서는 안 된다'): 놀이 코드와 떼어 둔 규칙·화면
//   일마다 손이 하는 일이 다름: 모내기 = 못줄 눈금에 꾹꾹 심기 · 벼 베기 = 콤바인 길 한 붓 그리기 · 소금 = 대파로 밀어 모으기(구름 오기 전) · 꿀 = 연기 살살 → 밀랍 뚜껑 덮인 칸 고르기 · 감자 = 줄기 둘레 파기 · 조개 = 작은 숨구멍 둘 밑 파기
//     배추 = 크기대로 상자에 나누기 · 배 = 벌레 오기 전에 봉지 씌우기 · 어린 나무 = 심는 차례 + 물 알맞게 · 목장 = 동물마다 알맞은 먹이 · 낚시·김·굴 = 줄 버티기 · 딸기·표고 = 익은 것 고르기 · 요리·징검다리 = 막대(옛 그대로)
//   끝 = 결과 3단계 + '💡 알고 있었나요?' 사실 한 줄(사실만) · 점수 0~3 = 옛 보상 표 그대로 · 실패도 경험치 1(마을 쪽) · 셈 X · 한 판 15~25초
//   솜씨 perk 'zone'(zw 1~1.25) = 쉬워지는 쪽으로(시간 · 초록 폭 · 삽질 수 · 벌레 느리게)
//   화면 = DOM + CSS(놀이 창이 열린 동안만 · 마을 tick이 부르는 tick(dt) 하나 — 따로 rAF X) · 입력 = down()/up()(E·스페이스·큰 단추) + key(코드, 반복)(화살표·WASD·숫자) + 누르기·끌기(마우스·터치)
export const MG_V = 3;
const KIND = { tuho: 'toss', fisher: 'line', seaweed: 'line', oyster: 'line', strawberry: 'ripe', shiitake: 'ripe', saltpan: 'salt', beehive: 'comb', potato: 'dig', clam: 'dig', cabbage: 'sort', pear: 'cover', lumber: 'order', pasture: 'feed' };
export const mgKind = (k, sea) => (k === 'paddy' ? (sea === 'autumn' ? 'cut' : 'plant') : KIND[k] || 'bar');   /* 논 = 봄 모내기 · 가을 벼 베기 */
// 놀이 창 첫 줄 = 할 일(아이 눈 2차 '말풍선과 창 첫 줄이 같은 문장' — 말풍선은 일꾼의 말 · 창 첫 줄은 내가 할 일)
const TASK = { plant: ['못줄 눈금에 맞춰 모를 심어요', 'Plant seedlings on the marks of the guide rope'], cut: ['콤바인으로 벼를 남김없이 베요', 'Cut all the rice with the combine'], fisher: ['물고기가 물면 줄을 버티며 끌어올려요', 'When a fish bites, hold the line and reel it in'], seaweed: ['김이 붙은 줄을 끌어올려요', 'Pull up the ropes with laver'], oyster: ['굴이 달린 줄을 끌어올려요', 'Pull up the ropes with oysters'],
  strawberry: ['빨갛게 익은 딸기만 따요', 'Pick only the red, ripe strawberries'], shiitake: ['갓이 알맞게 핀 표고만 따요', 'Pick only shiitake with caps just right'], saltpan: ['구름이 오기 전에 소금을 모아요', 'Gather the salt before the cloud comes'], beehive: ['연기를 살살 피우고 꿀이 익은 칸만 떠요', 'Smoke gently, then take only the ripe honey cells'],
  potato: ['줄기 둘레를 파서 감자를 캐요', 'Dig around the stems for potatoes'], clam: ['작은 구멍 둘 밑을 파서 조개를 캐요', 'Dig under pairs of tiny holes for clams'], cabbage: ['배추를 크기대로 세 상자에 나눠 담아요', 'Sort the cabbages into three boxes by size'], pear: ['벌레가 오기 전에 배마다 봉지를 씌워요', 'Bag every pear before the caterpillars come'],
  lumber: ['차례대로 어린 나무를 심고 물을 줘요', 'Plant the saplings in order and water them'], pasture: ['동물마다 알맞은 먹이를 줘요', 'Give each animal the right food'], cook: ['불을 알맞게 맞춰 요리해요', 'Keep the heat just right while cooking'], stones: ['돌을 하나씩 콩콩 건너요', 'Hop across the stones one by one'], tuho: ['화살을 던져 항아리에 넣어요', 'Toss arrows into the pot'] };
export const taskOf = (kind, k, en) => { const t = TASK[kind === 'plant' || kind === 'cut' ? kind : k]; return t ? (en ? 'To do: ' : '할 일: ') + t[en ? 1 : 0] : ''; };
export const gradeOf = ok => (ok >= 3 ? 2 : ok >= 1 ? 1 : 0);
const GRADE_T = [['아쉬워요! 다음엔 더 잘할 수 있어요', 'So close! You’ll get it next time'], ['잘했어요!', 'Well done!'], ['아주 잘했어요!', 'Excellent!']];
export const gradeText = (ok, en) => GRADE_T[gradeOf(ok)][en ? 1 : 0];
// 💡 알고 있었나요?(놀이가 끝날 때 한 줄 · 사실만) — 일 갈래(또는 논 = 모내기·벼 베기)
const FACT = {
  plant: ['모를 줄 맞춰 고른 간격으로 심으면 바람이 잘 통하고 햇빛을 고르게 받아 잘 자라요', 'Rice planted in straight, even rows gets air and sunlight evenly and grows well'],
  cut: ['콤바인은 벼를 베면서 바로 낟알까지 털어 주는 기계예요', 'A combine cuts the rice and threshes the grain at the same time'],
  saltpan: ['바닷물이 햇볕과 바람에 마르면 소금이 남아요 — 비가 오면 다시 녹아서 서둘러 거둬요', 'Sun and wind dry seawater and leave salt — rain melts it, so it’s gathered quickly'],
  beehive: ['꿀벌은 꿀이 다 익으면 밀랍으로 칸 뚜껑을 덮어요 — 연기를 살살 피우면 벌들이 차분해져요', 'Bees seal ripe honey with wax caps — gentle smoke keeps them calm'],
  potato: ['감자는 땅속줄기가 굵어진 거예요 — 줄기 밑 둘레 땅속에 주렁주렁 달려요', 'A potato is a swollen underground stem — they grow around the base of the plant'],
  clam: ['조개는 펄 속에 숨어서 작은 구멍으로 바닷물을 빨아들이고 내보내요', 'Clams hide in the mud and draw seawater in and out through tiny holes'],
  cabbage: ['배추는 속이 꽉 찰수록 묵직해요 — 크기대로 나눠 담으면 상자마다 고르게 팔 수 있어요', 'A fuller cabbage feels heavier — sorting by size makes even boxes to sell'],
  pear: ['배에 봉지를 씌우면 벌레와 병을 막고 껍질이 곱게 자라요', 'Bagging pears keeps out bugs and disease and keeps the skin smooth'],
  lumber: ['나무를 심고 흙을 꾹꾹 밟아 주면 뿌리와 흙 사이 빈틈이 없어져 뿌리가 잘 내려요', 'Treading the soil after planting removes air gaps so roots settle well'],
  pasture: ['소와 양은 풀을 먹는 초식 동물이에요 — 초콜릿은 개에게 위험해요', 'Cows and sheep are herbivores — and chocolate is dangerous for dogs'],
  fisher: ['물고기는 아가미로 물에 녹은 산소를 마셔요', 'Fish breathe oxygen dissolved in water through their gills'],
  seaweed: ['김은 차가운 겨울 바다에서 잘 자라요', 'Laver grows best in the cold winter sea'],
  oyster: ['굴은 물을 빨아들여 그 속의 작은 먹이를 걸러 먹어요', 'Oysters filter tiny food out of the water they draw in'],
  strawberry: ['딸기 겉의 작은 점 하나하나가 씨앗이에요', 'Each tiny dot on a strawberry is a seed'],
  shiitake: ['표고는 참나무 같은 나무 토막(원목)에서 자라는 버섯이에요', 'Shiitake grow on logs of trees like oak'],
  stream: ['물속에 사는 작은 생물을 보면 물이 얼마나 맑은지 알 수 있어요. 강도래 애벌레와 버들치가 살면 아주 맑은 물이에요', 'Small water creatures tell you how clean water is. Stonefly larvae and minnows mean very clean water'],
  bend: ['강이 굽은 곳 바깥쪽은 물이 빨라 강가를 깎고, 안쪽은 물이 느려 모래와 자갈이 쌓여요', 'On a river bend the fast outer side wears the bank away, and the slow inner side piles up sand and gravel'],
  paddylife: ['논은 물이 고인 습지라서 개구리, 우렁이, 미꾸라지 같은 많은 생물의 집이 돼요', 'A rice paddy is a wetland — home to frogs, snails, loaches and more'],
  terrace: ['다랑이 논은 산비탈을 계단처럼 깎아 만든 논이에요. 위 논의 물꼬를 열면 물이 아래 논으로 차례로 흘러요', 'Terraced paddies are cut into hillsides like steps. Opening the upper gate lets water flow down paddy by paddy'],
};
const RIPE = {
  strawberry: ['s', '🍓', ['빨갛게 다 익은 딸기만 눌러요 — 하얗고 초록인 딸기는 더 기다려요', 'Tap only fully red strawberries — pale green ones need more time'], ['아직 안 익었어요 — 초록빛이 남았어요', 'Not ripe yet — it’s still greenish'], ['조금만 더 — 끝까지 빨개지면 따요', 'Almost — wait till it’s red all over']],
  shiitake: ['m', '🍄', ['갓이 넓게 핀 표고만 눌러요 — 작은 봉오리는 더 자라요', 'Tap only shiitake with open caps — tiny buttons need to grow'], ['아직 작아요 — 갓이 더 펴질 때까지', 'Too small — wait till the cap opens'], ['조금만 더 — 갓이 넓게 펴지면 따요', 'Almost — wait till the cap spreads wide']],
};
const CSS = `
.twn-play .mg{display:flex;flex-direction:column;gap:6px;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.twn-play .pb.mg-end .mg{opacity:.55;transition:opacity .2s}
.twn-play .mg .dim{opacity:.35}
.twn-play .dots{display:flex;gap:6px;justify-content:center}
.twn-play .dots i{width:14px;height:14px;border-radius:7px;background:#e7efe3;border:2px solid #c9d6c4}
.twn-play .dots i.g{background:#7fd06a;border-color:#2b5a3a}
.twn-play .dots i.m{background:#f6d3cf;border-color:#e0453a}
.twn-play .wt{height:40px;background:linear-gradient(#cdeefa,#8fd4ff)}
.twn-play .wt .fl{position:absolute;left:50%;top:9px;width:16px;height:22px;margin-left:-8px;border-radius:8px;background:linear-gradient(#e0453a 50%,#fffdf6 50%);border:2px solid #1d2b3a;will-change:transform}
.twn-play .wt .cue{position:absolute;left:50%;top:6px;margin-left:16px;font-size:20px;line-height:1;color:#e0453a;opacity:0;transition:opacity .1s}
.twn-play .wt.on .cue{opacity:1}
.twn-play .pgb{height:10px}
.twn-play .pg{position:absolute;left:0;top:0;bottom:0;width:100%;background:#2b5a3a;transform-origin:0 50%;transform:scaleX(0)}
.twn-play .rg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.twn-play .rg .rt{position:relative;min-height:58px;padding:0;border-radius:12px;background:#eef5ea;color:#1d2b3a;font-size:34px;line-height:1;border:2px solid #d5e2cf}
.twn-play .rg .rt .rf{display:inline-block;transition:transform .35s,filter .35s,opacity .3s}
.twn-play .rg .rt em{position:absolute;left:6px;top:4px;font-size:11px;font-style:normal;font-weight:700;color:#56606b}
.twn-play .rg .rt.sel{border-color:#2b5a3a;box-shadow:inset 0 0 0 2px #2b5a3a}
.twn-play .rg .rt.e .rf{opacity:.14;transform:scale(.35);filter:grayscale(1)}
.twn-play .rg .rt.no{animation:twn-mg-shake .35s}
@keyframes twn-mg-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.twn-play .rg[data-c=s] .u .rf{filter:hue-rotate(100deg) saturate(.55) brightness(1.2);transform:scale(.72)}
.twn-play .rg[data-c=s] .h .rf{filter:hue-rotate(28deg) saturate(.75) brightness(1.18);transform:scale(.9)}
.twn-play .rg[data-c=p] .r .rf{filter:saturate(1.35) hue-rotate(-14deg)}
.twn-play .rg[data-c=p] .u .rf{filter:hue-rotate(50deg) saturate(1.3) brightness(.92);transform:scale(.66)}
.twn-play .rg[data-c=p] .h .rf{filter:hue-rotate(24deg) saturate(1.2);transform:scale(.86)}
.twn-play .rg[data-c=m] .rf{filter:sepia(1) saturate(1.5) hue-rotate(-18deg) brightness(.8)}
.twn-play .rg[data-c=m] .r .rf{transform:scale(1.12)}
.twn-play .rg[data-c=m] .u .rf{transform:scale(.45)}
.twn-play .rg[data-c=m] .h .rf{transform:scale(.68);filter:sepia(1) saturate(1.1) hue-rotate(-18deg) brightness(.95)}
.twn-play .rg[data-c=c] .r .rf{transform:scale(1.12)}
.twn-play .rg[data-c=c] .u .rf{filter:saturate(.55) brightness(1.3);transform:scale(.55)}
.twn-play .rg[data-c=c] .h .rf{filter:saturate(.8) brightness(1.12);transform:scale(.82)}
.twn-play .tmb{height:8px}
.twn-play .tm{position:absolute;left:0;top:0;bottom:0;width:100%;background:#7fd06a;transform-origin:0 50%}
.twn-play .gd{display:grid;gap:4px;touch-action:none;user-select:none;-webkit-user-select:none}
.twn-play .gd .gc{position:relative;padding:0;min-height:32px;border-radius:8px;border:2px solid transparent;font-size:20px;line-height:1;background:#e7efe3;color:#1d2b3a;box-shadow:none}
.twn-play .gd .gc.sel{border-color:#2b5a3a}
.twn-play .gd .gc.no{animation:twn-mg-shake .35s}
.twn-play .rope{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;height:9px;border-top:2px solid #b08a5e}
.twn-play .rope i{display:block}.twn-play .rope i.k{background:#e0453a;margin:0 42%;border-radius:2px}
.twn-play .gd.paddy .gc{background:#9fb8b6;min-height:36px}.twn-play .gd.paddy .gc.on{background:#a9c78f}.twn-play .gd.paddy .gc.off{border-color:#e0453a;border-style:dashed;opacity:.8}
.twn-play .gd.rice .gc{min-height:40px}.twn-play .gd.rice .gc.ripe{background:#f2d36b}.twn-play .gd.rice .gc.cutd{background:#cbb88f}.twn-play .gd.rice .gc.cb{background:#e8c24f;font-size:24px}
.twn-play .sp{position:relative;height:150px;border-radius:12px;background:linear-gradient(#e6eef0,#d3e1e5);overflow:hidden;touch-action:none;cursor:grab}
.twn-play .sp .pile{position:absolute;left:0;top:0;bottom:0;width:14%;background:#f4f2ea;display:flex;align-items:center;justify-content:center;gap:2px;font-style:normal;font-size:14px;border-right:2px dashed #b9c3c7}
.twn-play .sp .sd{position:absolute;width:13px;height:9px;margin:-4px 0 0 -6px;border-radius:5px;background:#fff;box-shadow:0 1px 0 #aeb9bd}
.twn-play .sp .sd.in{opacity:0;transition:opacity .3s}
.twn-play .sp .rk{position:absolute;width:9px;height:34%;transform:translate(-50%,-50%);background:#9c7650;border-radius:4px;box-shadow:2px 0 0 #6b5238}
.twn-play .sp .cl{position:absolute;top:2px;left:88%;font-size:28px;font-style:normal}
.twn-play .smk{font-size:30px;text-align:center;opacity:.2}
.twn-play .gd.comb .gc{border-radius:40%;min-height:34px}.twn-play .gd.comb .gc.cap{background:#f4e3a1;box-shadow:inset 0 0 0 4px #e3c35a}.twn-play .gd.comb .gc.open{background:#e9a62a;box-shadow:inset 0 -6px 0 #f6c95c}.twn-play .gd.comb .gc.brood{background:#f6f1e3}.twn-play .gd.comb .gc.brood::after{content:'';position:absolute;left:42%;top:38%;width:16%;height:24%;border-radius:50%;background:#e6dcc4}.twn-play .gd.comb .gc.got{background:#cfe8c4;box-shadow:none}
.twn-play .gd.soil .gc{background:#a8865e}.twn-play .gd.mud .gc{background:#8e7d66}.twn-play .gd .gc.dug{background:#6f553a}.twn-play .gd .gc.hit{background:#c9b089}
.twn-play .gd .gc.hole2::before{content:'••';font-size:13px;color:#3f3224;letter-spacing:2px}.twn-play .gd .gc.crab::before{content:'●';font-size:15px;color:#3f3224}
.twn-play .cab{display:flex;flex-direction:column;align-items:center;justify-content:center;height:96px}.twn-play .cab .cb{font-size:46px;font-style:normal;line-height:1;transition:transform .15s;cursor:grab;touch-action:none}.twn-play .cab .cb.dr{opacity:.55}.twn-play .cab .cn{font-size:13px;color:#56606b}
.twn-play .bx3{display:flex;gap:8px}.twn-play .bx3 button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;min-height:60px;font-size:13px;background:#e7efe3;color:#1d2b3a}.twn-play .bx3 button i{font-style:normal;font-size:24px;line-height:1.1}
.twn-play .tree{position:relative;height:150px;border-radius:12px;background:linear-gradient(#eaf5e2,#d5ebc8);overflow:hidden;touch-action:none}.twn-play .tree .br{position:absolute;left:4%;right:4%;top:26%;height:6px;background:#8a6a44;border-radius:3px}
.twn-play .tree .pr{position:absolute;padding:0;min-height:0;width:44px;height:44px;border-radius:50%;background:transparent;font-size:30px;line-height:44px;box-shadow:none;color:#1d2b3a}.twn-play .tree .pr.sel{outline:3px solid #2b5a3a}.twn-play .tree .pr.bag{background:#efe1c4;border-radius:12px 12px 16px 16px;box-shadow:inset 0 -6px 0 #d9c49a;font-size:0}.twn-play .tree .pr.bag::after{content:'✔';font-size:18px;color:#2b5a3a}.twn-play .tree .pr.eat{opacity:.45;filter:grayscale(1)}
.twn-play .tree .wm{position:absolute;font-size:20px;font-style:normal;transform:translate(-50%,-50%);transition:opacity .3s}
.twn-play .scn{position:relative;height:96px;border-radius:12px;background:#eaf5e2;overflow:hidden}.twn-play .scn .gr{position:absolute;left:0;right:0;bottom:0;height:34%;background:#a8865e}.twn-play .scn .pit{position:absolute;left:43%;width:14%;bottom:20%;height:16%;background:#6f553a;border-radius:0 0 40% 40%;opacity:0}
.twn-play .scn .sap{position:absolute;left:50%;bottom:24%;transform:translateX(-50%);font-size:32px;font-style:normal;opacity:0}.twn-play .scn .mound{position:absolute;left:40%;width:20%;bottom:30%;height:9%;background:#8e6c48;border-radius:50% 50% 0 0;opacity:0}.twn-play .scn .drop{position:absolute;left:62%;top:8%;font-size:22px;font-style:normal;opacity:0}
.twn-play .scn.s1 .pit,.twn-play .scn.s2 .pit{opacity:1}.twn-play .scn.s2 .sap,.twn-play .scn.s3 .sap,.twn-play .scn.s4 .sap{opacity:1}.twn-play .scn.s3 .mound,.twn-play .scn.s4 .mound{opacity:1}.twn-play .scn.s4 .drop{opacity:1}
.twn-play .row.crd{flex-wrap:wrap;justify-content:center}.twn-play .row.crd button.no{animation:twn-mg-shake .35s}
.twn-play .tray{position:relative;height:150px;border-radius:12px;background:#c9d8c0;overflow:hidden;touch-action:none;cursor:crosshair}
.twn-play .tray .ti{position:absolute;transform:translate(-50%,-50%);font-size:22px;font-style:normal;line-height:1;opacity:.07;transition:opacity .12s}
.twn-play .tray .ti.dc{opacity:.85}.twn-play .tray .ti.v,.twn-play .tray .ti.f{opacity:1}.twn-play .tray .ti.no{animation:twn-mg-shake .35s}
.twn-play .tray em,.twn-play .pdy em{position:absolute;left:50%;top:100%;transform:translateX(-50%);font-size:11px;white-space:nowrap;font-style:normal;font-weight:700;color:#1d2b3a;background:#fffdf6;border-radius:6px;padding:0 4px}
.twn-play .tray .lens{position:absolute;width:70px;height:70px;transform:translate(-50%,-50%);border-radius:50%;border:4px solid #1d2b3a;background:rgba(255,255,255,.18);pointer-events:none}
.twn-play svg.bend{width:100%;height:auto;display:block;border-radius:12px;touch-action:none}.twn-play svg.bend .li,.twn-play svg.bend .lo{stroke:none}.twn-play svg.bend .lf{font-size:20px}
.twn-play svg.bend .z{fill:transparent;stroke:transparent;stroke-width:2}.twn-play svg.bend.pick .z{fill:rgba(255,253,246,.35);stroke:#1d2b3a;stroke-dasharray:5 4;cursor:pointer}.twn-play svg.bend.pick .z.sel{stroke:#2b5a3a;stroke-width:3}
.twn-play .pdy{position:relative;height:150px;border-radius:12px;background:repeating-linear-gradient(90deg,#8fb46a 0 3px,#6f9fae 3px 22px);overflow:hidden;touch-action:none}
.twn-play .pdy .cr{position:absolute;transform:translate(-50%,-50%) scale(.4);font-size:28px;font-style:normal;line-height:1;opacity:0;transition:opacity .2s,transform .2s}
.twn-play .pdy .cr.v{opacity:1;transform:translate(-50%,-50%) scale(1)}.twn-play .pdy .cr.f{opacity:.95;transform:translate(-50%,-50%) scale(.8)}.twn-play .pdy.rip{animation:twn-mg-shake .35s}
.twn-play .trc{display:flex;flex-direction:column;gap:5px}.twn-play .trc .pd{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px;background:#d9c9a0;border:2px solid #b49a64}.twn-play .trc .pd b{width:80px;font-size:13px}
.twn-play .trc .lv{position:relative;flex:1;height:16px;border-radius:8px;background:#efe6cf;overflow:hidden}.twn-play .trc .bd{position:absolute;top:0;bottom:0;background:#bfe3a8}
.twn-play .trc .wv{position:absolute;left:0;top:0;bottom:0;width:100%;background:rgba(79,143,224,.75);transform-origin:0 50%;transform:scaleX(0)}.twn-play .trc .pd.ok{border-color:#2b5a3a}.twn-play .trc .pd.hi{border-color:#e0453a}
.twn-play .bx3 button.sel{outline:3px solid #2b5a3a;outline-offset:1px}
.twn-play .bx3.srt{align-items:stretch}.twn-play .bx3.srt button{justify-content:flex-end}.twn-play .crt{display:flex;align-items:flex-end;justify-content:center;box-sizing:border-box;border:3px solid #9c7650;border-top:2px dashed #9c7650;border-radius:2px 2px 6px 6px;background:#ead6ab;margin-bottom:2px}.twn-play .crt i{font-style:normal;line-height:1}
.twn-play .bx3.gt button small{font-size:12px;color:#56606b}.twn-play .bx3.gt button.on{background:#a8dc8e;border-color:#2b5a3a}.twn-play .bx3.gt button.on small{color:#1d4a2a;font-weight:700}
`;
function css() { if (document.getElementById('twn-mg-css')) return; const s = document.createElement('style'); s.id = 'twn-mg-css'; s.textContent = CSS; document.head.appendChild(s); }
const rnd = (a, b) => a + Math.random() * (b - a);
const setCls = (el, c) => { if (el.className !== c) el.className = c; };
const pop = (el, c) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };   // 일이 생길 때만(매 프레임 X)

// ① 막대(옛 그대로): 빨간 막대가 초록 칸에 올 때 누르기 세 번 → 맞힌 수 = 점수
function mkBar(c) {
  c.mg.innerHTML = '<div class="bar"><i class="zone"></i><i class="mk"></i></div>';
  const z9 = c.mg.querySelector('.zone'), mk = c.mg.querySelector('.mk'), zw = c.zw; let zone = rnd(0.35, 0.65), sp = rnd(0.9, 1.4), t = 0, pos = 0.5, round = 0, ok = 0;
  const place = () => { z9.style.width = (18 * zw) + '%'; z9.style.left = (zone * 100 - 9 * zw) + '%'; }; place();
  c.say(c.T('빨간 막대가 초록 칸에 오면 E!', 'Press E when the red bar is in the green!'));
  return { go: c.T('지금!', 'Now!'),
    down() { const good = Math.abs(pos - zone) < 0.09 * zw; round++; if (good) ok++; c.snd(good ? 'tick' : 'pop'); c.say((good ? c.T('좋아요! ', 'Nice! ') : c.T('아깝다! ', 'Almost! ')) + round + '/3'); zone = rnd(0.25, 0.75); sp = rnd(0.9, 1.5); place(); if (round >= 3) c.finish(ok); },
    tick(dt) { t += dt * sp; pos = 0.5 + 0.5 * Math.sin(t * 2.2); mk.style.left = (pos * 100) + '%'; } };
}

// ② 줄 버티기(낚시·김발·굴 줄): 기다렸다 신호에 E(낚시 = 찌가 쏙 · 김발·굴 = 물결이 잔잔해질 때) → E를 꾹 눌렀다 뗐다 빨간 막대(줄 당김)를 초록 칸에 → 다 올리면 하나 · 세 번
function mkLine(c) {
  const fish = c.k === 'fisher', zw = c.zw;
  c.mg.innerHTML = '<div class="bar wt"><i class="fl"></i><b class="cue">!</b></div><div class="bar tn dim"><i class="zone"></i><i class="mk"></i></div><div class="bar pgb dim"><i class="pg"></i></div><div class="dots"><i></i><i></i><i></i></div>';
  const wt = c.mg.querySelector('.wt'), fl = c.mg.querySelector('.fl'), tn = c.mg.querySelector('.tn'), z9 = tn.querySelector('.zone'), mk = tn.querySelector('.mk'), pgb = c.mg.querySelector('.pgb'), pg = c.mg.querySelector('.pg'), dots = c.mg.querySelectorAll('.dots i');
  const HW = 0.14 * zw;   /* 초록 칸 반폭(솜씨가 늘면 넓어짐) */ z9.style.width = (HW * 200) + '%';
  const W_TXT = fish ? c.T('찌를 보다가 쏙 들어가면 E!', 'Watch the float — press E when it dips!') : c.T('물결이 셀 땐 기다리고, 잔잔해지면 E!', 'Wait while the waves are big — press E when it calms!');
  const R_TXT = c.T('E를 꾹 눌렀다 뗐다 — 빨간 막대를 초록 칸에!', 'Hold and release E — keep the red bar in the green!');
  let ph = 'wait', tw = 0, t = 0, tt = 0, hold = false, ten = 0.45, prog = 0, tight = 0, round = 0, ok = 0, gap = 0, ph0 = rnd(0, 6), early = 0;
  const wait = () => { ph = 'wait'; tw = fish ? rnd(1.3, 3.0) : rnd(1.4, 2.6); setCls(wt, 'bar wt'); setCls(tn, 'bar tn dim'); setCls(pgb, 'bar pgb dim'); c.say(W_TXT); };
  const endRound = got => { dots[round].className = got ? 'g' : 'm'; round++; if (got) ok++; c.snd(got ? 'ding' : 'pop'); hold = false; if (round >= 3) { c.finish(ok); return; } ph = 'gap'; gap = 0.8; };
  wait();
  return { go: c.T('당기기 (꾹)', 'Reel (hold)'),
    down() { if (ph === 'wait') { early++; tw = fish ? rnd(1.2, 2.2) : rnd(1.0, 1.8); c.snd('pop'); c.say(fish ? c.T('너무 일찍! 물고기가 놀랐어요 — 찌가 쏙 들어갈 때까지', 'Too early! The fish got startled — wait for the dip') : c.T('물결이 셀 땐 줄이 무거워요 — 잔잔해질 때까지', 'The waves make it heavy — wait till it calms')); return; }
      if (ph === 'bite') { ph = 'reel'; hold = true; ten = 0.45; prog = 0; tight = 0; tt = 0; setCls(wt, 'bar wt dim'); setCls(tn, 'bar tn'); setCls(pgb, 'bar pgb'); c.snd('tick'); c.say(R_TXT); return; }
      if (ph === 'reel') hold = true; },
    up() { hold = false; },
    tick(dt) { t += dt;
      if (ph === 'wait' || ph === 'bite') { const big = !fish && ph === 'wait', y = ph === 'bite' && fish ? 10 : Math.sin(t * (big ? 5.5 : 2.6)) * (big ? 7 : 2); fl.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
        if (ph === 'wait' && (tw -= dt) <= 0) { ph = 'bite'; tw = (fish ? 0.9 : 1.3) * zw; setCls(wt, 'bar wt on'); c.snd('tick'); c.say(fish ? c.T('쏙! 지금 E!', 'A bite! Press E now!') : c.T('잔잔해요! 지금 E!', 'Calm now! Press E!')); }
        else if (ph === 'bite' && (tw -= dt) <= 0) { setCls(wt, 'bar wt'); c.say(fish ? c.T('놓쳤어요! 다음 물고기를 기다려요', 'Missed it! Wait for the next one') : c.T('물결이 다시 세졌어요 — 다음 줄', 'The waves are back — next rope')); endRound(false); }
        return; }
      if (ph === 'gap') { if ((gap -= dt) <= 0) wait(); return; }
      tt += dt; const pull = fish ? 0.4 * Math.sin(1.9 * tt + ph0) + 0.25 * Math.sin(3.7 * tt + ph0 * 2) : -0.12 + 0.12 * Math.sin(1.3 * tt + ph0);   /* 낚시 = 물고기가 이리저리 당김 · 김발·굴 = 무거운 줄이 아래로 */
      ten = Math.min(1, Math.max(0, ten + ((hold ? 0.62 : -0.7) + pull) * dt)); const cen = fish ? 0.55 + 0.12 * Math.sin(0.8 * tt + ph0) : 0.55, inn = Math.abs(ten - cen) < HW;
      prog = Math.min(1, Math.max(0, prog + (inn ? 0.34 : -0.1) * dt));
      if (ten >= 0.985) { if ((tight += dt) > 0.35) { tight = 0; prog = Math.max(0, prog - 0.25); ten = 0.6; c.snd('buzz'); c.say(c.T('줄이 너무 팽팽해요! 살살 — 손을 떼 봐요', 'Too tight! Ease off — let go a little')); } } else tight = 0;
      z9.style.left = ((cen - HW) * 100) + '%'; mk.style.left = (ten * 100) + '%'; pg.style.transform = 'scaleX(' + prog.toFixed(3) + ')';
      if (prog >= 1) { c.say(fish ? c.T('낚았어요! ', 'Caught one! ') + (round + 1) + '/3' : c.T('줄을 다 올렸어요! ', 'Rope lifted! ') + (round + 1) + '/3'); endRound(true); }
      else if (tt > 8) { c.say(fish ? c.T('물고기가 줄을 풀고 갔어요 — 다음엔 초록 칸에 오래', 'It slipped away — stay in the green longer') : c.T('줄이 무거워요 — 다음 줄로', 'Too heavy — on to the next rope')); endRound(false); } } };
}

// ③ 익은 것만 고르기(딸기·배·표고·배추): 아홉 칸에 익은 것·덜 익은 것이 섞여 나옴(덜 익은 것은 시간이 지나면 익음) → 익은 것만 누르기 · 덜 익은 걸 누르면 '아직 안 익었어요'(관찰) · 딴 수 − 잘못 누른 수로 점수
function mkRipe(c) {
  const R = RIPE[c.k] || RIPE.strawberry, T = 15 * c.zw, N = 9;
  let h = '<div class="rg" data-c="' + R[0] + '">'; for (let i = 0; i < N; i++) h += '<button class="rt u" data-i="' + i + '"><span class="rf">' + R[1] + '</span><em>' + (i + 1) + '</em></button>'; h += '</div><div class="bar tmb"><i class="tm"></i></div>';
  c.mg.innerHTML = h; const rg = c.mg.querySelector('.rg'), B = rg.querySelectorAll('.rt'), tm = c.mg.querySelector('.tm'), st = new Array(N).fill('u'), age = new Array(N).fill(0);
  let sel = 4, left = T, rip = 0, none = 0, P = 0, M = 0;
  const draw = i => setCls(B[i], 'rt ' + st[i] + (i === sel ? ' sel' : ''));
  const grow = (a, b, amin) => { let k = -1, n = 0; for (let i = 0; i < N; i++) if (st[i] === a && age[i] >= amin) { n++; if (Math.random() * n < 1) k = i; } if (k >= 0) { st[k] = b; age[k] = 0; draw(k); } return k; };   // a 단계 가운데 하나를 골라 b로(따로 배열 X)
  { const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8]; for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = idx[i]; idx[i] = idx[j]; idx[j] = q; } for (let i = 0; i < 3; i++) { st[idx[i]] = 'r'; st[idx[i + 3]] = 'h'; } age.fill(1); for (let i = 0; i < N; i++) draw(i); }
  const pick = i => { if (c.done || i < 0 || i >= N) return; if (sel !== i) { const o = sel; sel = i; draw(o); } if (st[i] === 'r') { st[i] = 'e'; age[i] = 0; P++; draw(i); c.snd('pick'); c.say(c.T('똑! ', 'Pick! ') + P + c.T('개 땄어요', ' picked')); }
    else if (st[i] === 'u' || st[i] === 'h') { M++; draw(i); pop(B[i], 'no'); c.snd('pop'); c.say(R[st[i] === 'h' ? 4 : 3][c.en ? 1 : 0]); } };
  const onPd = e => { const b = e.target.closest('.rt'); if (!b) return; e.preventDefault(); pick(+b.dataset.i); }; rg.addEventListener('pointerdown', onPd);
  if (c.go) c.go.style.display = 'none';   /* 칸을 바로 누름(큰 단추 없음) · 키보드 = 숫자 1~9 또는 화살표 + E */
  c.say(R[2][c.en ? 1 : 0]);
  return { go: '',
    down() { pick(sel); },
    key(code, rep) { const d = /^(Digit|Numpad)([1-9])$/.exec(code); if (d) { if (!rep) pick(+d[2] - 1); return true; }
      const mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -3, KeyW: -3, ArrowDown: 3, KeyS: 3 }[code]; if (!mv) return false; const n = sel + mv; if (n < 0 || n >= N || (Math.abs(mv) === 1 && ((n / 3) | 0) !== ((sel / 3) | 0))) return true; const o = sel; sel = n; draw(o); draw(n); return true; },
    tick(dt) { left -= dt; tm.style.transform = 'scaleX(' + Math.max(0, left / T).toFixed(3) + ')'; let nr = 0;
      for (let i = 0; i < N; i++) { age[i] += dt; if (st[i] === 'e' && age[i] > 1.4) { st[i] = 'u'; age[i] = 0; draw(i); } else if (st[i] === 'r') nr++; }
      if ((rip += dt) > 1.25) { rip = 0; grow('h', 'r', 0.6); grow('u', 'h', 0.8); } if (nr) none = 0; else if ((none += dt) > 0.4) { none = 0; if (grow('h', 'r', 0) < 0) grow('u', 'r', 0); }
      if (left <= 0) { const s = P - M; c.finish(s >= 8 ? 3 : s >= 5 ? 2 : s >= 2 ? 1 : 0); } },
    dispose() { rg.removeEventListener('pointerdown', onPd); } };
}

// ── 칸 판 도우미(모내기·꿀·감자·조개·배): 단추 칸 + 키보드 칸 고르개(화살표·WASD 옮김 · E/스페이스 = 지금 칸) + 누르기·끌기(끌기 = 손가락이 지나간 칸) ──
function gridHTML(cols, n, cls) { let h = '<div class="gd ' + cls + '" style="grid-template-columns:repeat(' + cols + ',1fr)">'; for (let i = 0; i < n; i++) h += '<button class="gc" data-i="' + i + '"></button>'; return h + '</div>'; }
function gridCtl(gd, cols, n, onPick, o = {}) { const B = gd.querySelectorAll('.gc'); let sel = o.sel || 0, drag = false, last = -1;
  const mark = () => { for (let i = 0; i < n; i++) B[i].classList.toggle('sel', i === sel); }; mark();
  const at = e => { const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('.gc'); return b && gd.contains(b) ? +b.dataset.i : -1; };
  const pd = e => { const b = e.target.closest('.gc'); if (!b) return; const i = +b.dataset.i; e.preventDefault(); drag = !!o.drag; last = i; sel = i; mark(); onPick(i, 'tap'); }, pm = e => { if (!drag) return; const i = at(e); if (i >= 0 && i !== last) { last = i; sel = i; mark(); onPick(i, 'drag'); } }, pu = () => { drag = false; };
  gd.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu);
  return { B, get sel() { return sel; }, set sel(v) { sel = v; mark(); }, mark,
    key(code) { const mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -cols, KeyW: -cols, ArrowDown: cols, KeyS: cols }[code]; if (!mv) return false; const nx = sel + mv; if (nx < 0 || nx >= n || (Math.abs(mv) === 1 && ((nx / cols) | 0) !== ((sel / cols) | 0))) return true; sel = nx; mark(); if (o.moveIsPick) onPick(sel, 'key'); return true; },
    dispose() { gd.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); } }; }
const timeBar = (c, T) => { c.mg.insertAdjacentHTML('beforeend', '<div class="bar tmb"><i class="tm"></i></div>'); const tm = c.mg.querySelector('.tm'); let left = T; return { tick(dt) { left -= dt; tm.style.transform = 'scaleX(' + Math.max(0, left / T).toFixed(3) + ')'; return left <= 0; }, get left() { return left; } }; };

// ④ 모내기(봄 논): 못줄의 빨간 눈금 자리에 모를 꾹꾹 — 눈금 자리 = 고른 간격(잘 자람) · 눈금 밖 = 비뚤(감점) · 두 줄 열 포기
function mkPlant(c) { const C9 = 10, N = 20, MARK = i => (i % C9) % 2 === 1, T = 20 * c.zw; let good = 0, bad = 0;
  c.mg.innerHTML = '<div class="rope">' + '<i></i>'.repeat(C9) + '</div>' + gridHTML(C9, N, 'paddy') + '<div class="rope">' + '<i></i>'.repeat(C9) + '</div>';
  c.mg.querySelectorAll('.rope i').forEach((e, i) => { if (i % 2 === 1) e.className = 'k'; });   /* 못줄 눈금(빨강) = 두 칸마다 */
  const gd = c.mg.querySelector('.gd'), TB = timeBar(c, T), st = new Array(N).fill(0);
  const plant = i => { if (c.done || st[i]) return; if (MARK(i)) { st[i] = 1; good++; G.B[i].className = 'gc on'; G.B[i].textContent = '🌱'; c.snd('pick'); c.say(c.T('꾹! 고른 간격 ', 'Planted evenly ') + good + '/10'); if (good >= 10) c.finish(bad <= 1 ? 3 : bad <= 3 ? 2 : 1); }
    else { st[i] = 2; bad++; G.B[i].className = 'gc off'; G.B[i].textContent = '🌱'; c.snd('pop'); c.say(c.T('삐뚤어요 — 빨간 눈금 바로 밑에 심어요', 'Off the mark — plant right under the red marks')); } G.mark(); }, G = gridCtl(gd, C9, N, plant, { sel: 1 });
  c.say(c.T('못줄의 빨간 눈금 바로 밑에 모를 꾹꾹 (누르거나 화살표와 E)', 'Plant under each red mark on the rope (tap · arrows+E)'));
  return { go: c.T('꾹 심기', 'Plant'), down() { plant(G.sel); }, key: code => G.key(code), tick(dt) { if (TB.tick(dt)) { const s = good - bad; c.finish(s >= 9 ? 3 : s >= 6 ? 2 : s >= 3 ? 1 : 0); } }, dispose: () => G.dispose() }; }

// ⑤ 벼 베기(가을 논): 콤바인 길 그리기 — 벤 곳은 다시 못 지나감(한 붓 그리기) · 끌기·누르기(옆 칸)·화살표 · 빈틈없이 다 베면 아주 잘함
function mkCut(c) { const C9 = 6, R9 = 4, N = C9 * R9, T = 22 * c.zw; let cur = 0, cut = 1, stuck = false;
  c.mg.innerHTML = gridHTML(C9, N, 'rice'); const gd = c.mg.querySelector('.gd'), B = gd.querySelectorAll('.gc'), st = new Array(N).fill(0), TB = timeBar(c, T); st[0] = 1;
  const draw = () => { for (let i = 0; i < N; i++) { const cl = 'gc ' + (i === cur ? 'cb' : st[i] ? 'cutd' : 'ripe'); if (B[i].className !== cl) { B[i].className = cl; B[i].textContent = i === cur ? '🚜' : st[i] ? '' : '🌾'; } } };
  const adj = (a, b) => (Math.abs(a - b) === 1 && ((a / C9) | 0) === ((b / C9) | 0)) || Math.abs(a - b) === C9;
  const free = i => [i - 1, i + 1, i - C9, i + C9].some(j => j >= 0 && j < N && adj(i, j) && !st[j]);
  const go = i => { if (c.done || stuck) return; if (i === cur || !adj(i, cur)) return; if (st[i]) { c.say(c.T('이미 벤 곳은 못 지나가요 — 길을 미리 생각해요', 'You can’t go over cut rows — plan your path')); c.snd('pop'); return; }
    st[i] = 1; cur = i; cut++; c.snd('tick'); draw(); c.say(c.T('싹싹 — ', 'Swish — ') + cut + '/' + N); if (cut >= N) return c.finish(3); if (!free(cur)) { stuck = true; c.say(c.T('길이 막혔어요! 한 줄씩 왕복하면 빈틈이 없어요', 'Boxed in! Going back and forth row by row leaves no gaps')); setTimeout(() => c.finish(score()), 900); } };
  const score = () => (cut >= N ? 3 : cut / N >= 0.75 ? 2 : cut / N >= 0.45 ? 1 : 0);
  let drag = false; const at = e => { const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('.gc'); return b && gd.contains(b) ? +b.dataset.i : -1; };
  const pd = e => { const i = at(e); if (i < 0) return; e.preventDefault(); drag = true; go(i); }, pm = e => { if (drag) { const i = at(e); if (i >= 0) go(i); } }, pu = () => { drag = false; };
  gd.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu); draw();
  c.say(c.T('콤바인을 끌어 벼를 다 베어요 — 벤 곳은 다시 못 지나가요 (끌거나 화살표)', 'Drag the combine to cut every square — no going over cut ground (drag · arrows)'));
  return { go: '', key(code, rep) { const d = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -C9, KeyW: -C9, ArrowDown: C9, KeyS: C9 }[code]; if (d == null) return false; if (rep) return true; const j = cur + d; if (j >= 0 && j < N) go(j); return true; }, down() {},
    tick(dt) { if (TB.tick(dt) && !stuck) c.finish(score()); }, dispose() { gd.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); } }; }

// ⑥ 소금 모으기(염전): 대파(밀대)를 왼쪽으로 밀어 소금을 더미로 — 구름이 오기 전에(비가 오면 녹음) · 끌기·화살표 · 왼쪽으로 밀 때만 소금이 따라옴
function mkSalt(c) { const N = 14, T = 22 * c.zw, S = []; let rx = 0.55, ry = 0.5, got = 0, t = 0;
  c.mg.innerHTML = '<div class="sp"><i class="pile">🧂 <b>0</b></i><i class="cl">☁️</i><i class="rk"></i></div>'; const sp = c.mg.querySelector('.sp'), rk = sp.querySelector('.rk'), cl = sp.querySelector('.cl'), pb = sp.querySelector('.pile b');
  for (let i = 0; i < N; i++) { const e = document.createElement('i'); e.className = 'sd'; sp.appendChild(e); S.push({ x: 0.3 + Math.random() * 0.66, y: 0.1 + Math.random() * 0.8, e, on: true }); }
  const put = s => { s.e.style.left = (s.x * 100).toFixed(1) + '%'; s.e.style.top = (s.y * 100).toFixed(1) + '%'; }; S.forEach(put);
  const rake = () => { rk.style.left = (rx * 100).toFixed(1) + '%'; rk.style.top = (ry * 100).toFixed(1) + '%'; }; rake();
  const move = (nx, ny) => { nx = Math.max(0.05, Math.min(0.98, nx)); ny = Math.max(0.12, Math.min(0.88, ny));
    if (nx < rx) for (const s of S) { if (!s.on || Math.abs(s.y - ry) > 0.16 || s.x > rx + 0.02 || s.x < nx - 0.03) continue; s.x = nx - 0.02; if (s.x < 0.15) { s.on = false; got++; s.e.className = 'sd in'; pb.textContent = got; c.snd('tick'); if (got >= N) { c.say(c.T('소금을 다 모았어요!', 'All the salt is in!')); c.finish(3); } } put(s); }   /* 왼쪽으로 밀 때만 대파 앞 소금이 함께 감 */
    rx = nx; ry = ny; rake(); };
  let drag = false; const xy = e => { const r = sp.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const pd = e => { e.preventDefault(); drag = true; const [x, y] = xy(e); move(Math.max(x, 0.05), y); }, pm = e => { if (drag) { const [x, y] = xy(e); move(x, y); } }, pu = () => { drag = false; };
  sp.addEventListener('pointerdown', pd); addEventListener('pointermove', pm); addEventListener('pointerup', pu);
  c.say(c.T('대파를 잡고 왼쪽으로 쭉 밀어 소금을 더미로 — 구름이 오기 전에! (끌거나 화살표)', 'Grab the rake and push salt left into the pile — before the cloud comes! (drag · arrows)'));
  return { go: '', down() {}, key(code) { const d = { ArrowLeft: [-0.035, 0], KeyA: [-0.035, 0], ArrowRight: [0.05, 0], KeyD: [0.05, 0], ArrowUp: [0, -0.06], KeyW: [0, -0.06], ArrowDown: [0, 0.06], KeyS: [0, 0.06] }[code]; if (!d) return false; move(rx + d[0], ry + d[1]); return true; },
    tick(dt) { t += dt; cl.style.left = (88 - (t / T) * 74).toFixed(1) + '%'; if (t >= T) { c.say(c.T('후두둑 비가 와요 — 남은 소금은 녹아요', 'Rain! The salt left out melts away')); const f = got / N; c.finish(f >= 0.9 ? 3 : f >= 0.6 ? 2 : f >= 0.3 ? 1 : 0); } },
    dispose() { sp.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); } }; }

// ⑦ 꿀 뜨기: ① 훈연기를 꾹 눌러 연기를 살살(초록 칸에서 떼기 — 너무 많으면 '살살') ② 밀랍 뚜껑이 덮인 칸(다 익은 꿀)만 고르기 · 덜 익은 꿀·애벌레 방은 그대로
function mkComb(c) { const C9 = 6, N = 24, T = 16 * c.zw; let ph = 'smoke', sm = 0, smT = 0, hold = false, smOk = 0, right = 0, wrong = 0, G = null, TB = null; const kinds = [];
  for (let i = 0; i < N; i++) kinds.push(i % 3 === 0 ? 'cap' : i % 3 === 1 ? 'open' : 'brood'); for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = kinds[i]; kinds[i] = kinds[j]; kinds[j] = q; }
  const NC = kinds.filter(k => k === 'cap').length;
  c.mg.innerHTML = '<div class="bar sm"><i class="zone"></i><i class="pg"></i></div><div class="smk">💨</div>'; const z9 = c.mg.querySelector('.zone'), pg = c.mg.querySelector('.pg'), smk = c.mg.querySelector('.smk'); z9.style.left = '55%'; z9.style.width = (30 * c.zw) + '%';
  c.say(c.T('훈연기를 꾹 눌러 연기를 살살 — 초록 칸에서 떼요 (E나 단추를 꾹)', 'Hold to puff gentle smoke — let go in the green (hold E or the button)'));
  const toFrame = () => { ph = 'comb'; c.mg.innerHTML = gridHTML(C9, N, 'comb'); const gd = c.mg.querySelector('.gd'); TB = timeBar(c, T);
    G = gridCtl(gd, C9, N, i => cell(i)); G.B.forEach((b, i) => { b.className = 'gc ' + kinds[i]; }); G.mark(); c.go && (c.go.style.display = 'none'); c.say(c.T('연기에 벌들이 차분해졌어요 — 밀랍 뚜껑이 덮인 칸만 골라요', 'The bees are calm — pick only the wax-capped cells')); };
  const cell = i => { if (c.done || !G || G.B[i].classList.contains('got')) return; const k = kinds[i]; if (k === 'cap') { right++; G.B[i].className = 'gc cap got'; c.snd('pick'); c.say(c.T('덮인 칸 — 다 익은 꿀! ', 'Capped — ripe honey! ') + right + '/' + NC); if (right >= NC) c.finish(Math.max(0, (wrong === 0 ? 3 : wrong <= 2 ? 2 : 1) - (smOk ? 0 : 1))); }
      else { wrong++; G.B[i].classList.add('no'); setTimeout(() => G.B[i].classList.remove('no'), 350); c.snd('pop'); c.say(k === 'open' ? c.T('아직 덜 익은 꿀이에요 — 뚜껑이 덮일 때까지 기다려요', 'Not ripe yet — wait until it’s capped') : c.T('여기는 애벌레 방이에요 — 그대로 둬요', 'That’s a baby-bee cell — leave it')); } };
  return { go: c.T('훈연기 꾹', 'Puff (hold)'),
    down() { if (ph === 'smoke') hold = true; else if (G) cell(G.sel); }, up() { if (ph !== 'smoke' || !hold) return; hold = false; if (sm >= 0.55 && sm <= 0.55 + 0.3 * c.zw) { smOk = 1; c.snd('ding'); toFrame(); } else if (sm > 0.05) { c.snd('pop'); c.say(sm < 0.55 ? c.T('조금 더 — 초록 칸까지', 'A bit more — to the green') : c.T('연기가 너무 많아요 — 살살!', 'Too much smoke — gently!')); sm = 0; } },
    key(code) { return G ? G.key(code) : false; },
    tick(dt) { if (ph === 'smoke') { sm = hold ? Math.min(1.1, sm + dt * 0.7) : Math.max(0, sm - dt * 0.25); pg.style.transform = 'scaleX(' + Math.min(1, sm).toFixed(3) + ')'; smk.style.opacity = (0.2 + Math.min(1, sm) * 0.8).toFixed(2); if (sm >= 1.1) { hold = false; sm = 0; c.say(c.T('연기가 너무 많아요 — 살살!', 'Too much smoke — gently!')); c.snd('pop'); } smT += dt; if (smT > 8) toFrame(); return; }
      if (TB && TB.tick(dt)) { const f = right / NC; c.finish(Math.max(0, (f >= 0.99 && wrong <= 2 ? 3 : f >= 0.6 ? 2 : f >= 0.3 ? 1 : 0) - (smOk ? 0 : 1))); } }, dispose() { if (G) G.dispose(); } }; }

// ⑧ 캐기(감자 = 줄기 둘레 · 조개 = 작은 숨구멍 두 개 밑): 단서를 보고 흙 파기 — 삽질 수가 정해져 있음(찾기)
function mkDig(c) { const clam = c.k === 'clam', C9 = 7, N = 28, ND = (clam ? 8 : 10) + (c.zw > 1.1 ? 2 : 0); let digs = ND, found = 0; const hide = new Array(N).fill(0), clue = new Array(N).fill('');
  const nb = i => [-C9 - 1, -C9, -C9 + 1, -1, 1, C9 - 1, C9, C9 + 1].map(d => i + d).filter(j => j >= 0 && j < N && Math.abs((j % C9) - (i % C9)) <= 1);
  const pickFree = (L, n) => { const out = []; const P = L.slice(); while (out.length < n && P.length) out.push(P.splice((Math.random() * P.length) | 0, 1)[0]); return out; };
  let NT; if (clam) { const H = pickFree([...Array(N).keys()], 6); H.slice(0, 4).forEach(i => { clue[i] = 'hole2'; hide[i] = 1; }); H.slice(4).forEach(i => { clue[i] = 'crab'; }); NT = 4; }   /* 조개 = 작은 구멍 둘 · 게 구멍 = 큰 구멍 하나(조개 없음) */
  else { const ST = pickFree([...Array(N).keys()].filter(i => i % C9 > 0 && i % C9 < C9 - 1), 3); NT = 0; for (const s of ST) { clue[s] = 'stem'; for (const j of pickFree(nb(s).concat([s]).filter(j => !hide[j]), 2)) { hide[j] = 1; NT++; } } }
  c.mg.innerHTML = gridHTML(C9, N, clam ? 'mud' : 'soil'); const gd = c.mg.querySelector('.gd'), dug = new Array(N).fill(0);
  const dig = i => { if (c.done || dug[i] || digs <= 0) return; dug[i] = 1; digs--; if (hide[i]) { found++; G.B[i].className = 'gc dug hit'; G.B[i].textContent = clam ? '🐚' : '🥔'; c.snd('pick'); } else { G.B[i].className = 'gc dug'; G.B[i].textContent = ''; c.snd('pop'); }
    c.say((hide[i] ? c.T('찾았다! ', 'Found one! ') : c.T('여긴 없어요 — ', 'Nothing here — ')) + c.T('삽질 ' + digs + '번 남음 · 찾은 것 ' + found + '/' + NT, digs + ' digs left · found ' + found + '/' + NT)); if (found >= NT || digs <= 0) setTimeout(() => c.finish(score()), 500); G.mark(); }, G = gridCtl(gd, C9, N, dig);
  const score = () => (clam ? (found >= 4 ? 3 : found >= 3 ? 2 : found >= 1 ? 1 : 0) : (found >= NT ? 3 : found >= NT - 2 ? 2 : found >= 2 ? 1 : 0));
  G.B.forEach((b, i) => { b.className = 'gc ' + (clue[i] || ''); b.textContent = clue[i] === 'stem' ? '🌿' : ''; }); G.mark();
  c.say(clam ? c.T('작은 숨구멍 두 개 밑에 조개가 숨어요 — 큰 구멍 하나는 게 구멍! 삽질 ' + ND + '번', 'Clams hide under pairs of tiny holes — one big hole is a crab’s! ' + ND + ' digs') : c.T('감자는 줄기 밑 둘레 땅속에 달려요 — 줄기 둘레를 파요. 삽질 ' + ND + '번', 'Potatoes grow underground around the stem — dig around 🌿! ' + ND + ' digs'));
  return { go: c.T('여기 파기', 'Dig here'), down() { dig(G.sel); }, key: code => G.key(code), tick() {}, dispose: () => G.dispose() }; }

// ⑨ 배추 나누기: 하나씩 나오는 배추를 크기대로 작은·중간·큰 상자에(끌어다 놓기 · 상자 누르기 · ←↓→ · 1·2·3) — 눈으로 견주기(셈 X)
function mkSort(c) { const N = 8, T = 20 * c.zw, SZ = [[0.6, 0.76], [0.92, 1.06], [1.26, 1.42]]; let i = 0, ok = 0, cur = 0, sc = 1;
  c.mg.innerHTML = '<div class="cab"><i class="cb">🥬</i><b class="cn"></b></div><div class="bx3 srt">' + [[0.8, 34, 26, 15, c.T('작은 상자', 'Small')], [1, 50, 38, 22, c.T('중간 상자', 'Medium')], [1.3, 68, 52, 31, c.T('큰 상자', 'Large')]].map((q, n) => '<button data-b="' + n + '" style="flex:' + q[0] + '"><span class="crt" style="width:' + q[1] + 'px;height:' + q[2] + 'px"><i style="font-size:' + q[3] + 'px">🥬</i></span>' + q[4] + '</button>').join('') + '</div>';   /* 아이 눈 2차 '상자 셋 크기가 비슷해 보여요': 상자 폭·나무 상자 그림 크기를 다르게(작은 상자 = 큰 상자의 반쯤) */
  const cb = c.mg.querySelector('.cb'), cn = c.mg.querySelector('.cn'), bx = c.mg.querySelector('.bx3'), TB = timeBar(c, T);
  const show = () => { cur = (Math.random() * 3) | 0; const [a, b] = SZ[cur]; sc = a + Math.random() * (b - a); cb.style.transform = 'scale(' + sc.toFixed(2) + ')'; cn.textContent = (i + 1) + '/' + N; };
  const put = b => { if (c.done) return; const good = b === cur; if (good) { ok++; c.snd('tick'); c.say(c.T('맞아요! ', 'Right! ') + ok + '/' + N); } else { c.snd('pop'); c.say(c.T('크기를 다시 견줘 봐요 — 상자 그림과 나란히', 'Compare sizes again — next to the box pictures')); } i++; if (i >= N) c.finish(ok >= N ? 3 : ok >= 6 ? 2 : ok >= 4 ? 1 : 0); else show(); };
  let dragB = false; const pdC = e => { e.preventDefault(); dragB = true; cb.classList.add('dr'); }, pu = e => { if (!dragB) return; dragB = false; cb.classList.remove('dr'); const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('[data-b]'); if (b && bx.contains(b)) put(+b.dataset.b); };
  const pdB = e => { const b = e.target.closest('[data-b]'); if (!b) return; e.preventDefault(); put(+b.dataset.b); };
  cb.addEventListener('pointerdown', pdC); addEventListener('pointerup', pu); bx.addEventListener('pointerdown', pdB); show();
  c.say(c.T('배추를 크기대로 상자에 — 끌어다 놓거나 상자를 눌러요 (←↓→)', 'Sort each cabbage by size — drag it or tap a box (←↓→)'));
  return { go: '', down() {}, key(code, rep) { if (rep) return /^(Arrow|Digit|Key[ASD])/.test(code); const b = { ArrowLeft: 0, Digit1: 0, KeyA: 0, ArrowDown: 1, Digit2: 1, KeyS: 1, ArrowRight: 2, Digit3: 2, KeyD: 2 }[code]; if (b == null) return false; put(b); return true; }, tick(dt) { if (TB.tick(dt)) c.finish(ok >= 7 ? 2 : ok >= 4 ? 1 : 0); }, dispose() { cb.removeEventListener('pointerdown', pdC); removeEventListener('pointerup', pu); bx.removeEventListener('pointerdown', pdB); } }; }

// ⑩ 배 봉지 씌우기: 벌레가 기어 오기 전에 배마다 봉지를 — 봉지 씌운 배는 안전(누르기 · 화살표+E) · 벌레는 천천히(솜씨 = 더 천천히)
function mkCover(c) { const N = 6, P = [], W = []; let bag = 0, lost = 0, t = 0;
  c.mg.innerHTML = '<div class="tree"><i class="br"></i></div>'; const tr = c.mg.querySelector('.tree');
  for (let i = 0; i < N; i++) { const e = document.createElement('button'); e.className = 'pr'; e.textContent = '🍐'; e.dataset.i = i; e.style.left = (8 + i * 15) + '%'; e.style.top = (i % 2 ? 52 : 30) + '%'; tr.appendChild(e); P.push({ e, st: 0, x: 0.08 + i * 0.15 + 0.04, y: (i % 2 ? 0.52 : 0.3) + 0.1 }); }
  for (let k = 0; k < 3; k++) { const e = document.createElement('i'); e.className = 'wm'; e.textContent = '🐛'; tr.appendChild(e); const w = { e, x: k === 1 ? 0.97 : 0.03, y: 0.15 + k * 0.33, tg: -1, wait: 1.5 + k * 2.5 }; e.style.left = (w.x * 100) + '%'; e.style.top = (w.y * 100) + '%'; W.push(w); }
  let sel = 0; const mark = () => P.forEach((p, i) => p.e.classList.toggle('sel', i === sel)); mark();
  const cover = i => { const p = P[i]; if (c.done || p.st) return; p.st = 1; bag++; p.e.classList.add('bag'); c.snd('pick'); c.say(c.T('봉지 쏙! ', 'Bagged! ') + bag + '/' + N); check(); };
  const check = () => { if (bag + lost >= N) c.finish(bag >= N ? 3 : bag >= 4 ? 2 : bag >= 2 ? 1 : 0); };
  const pd = e => { const b = e.target.closest('.pr'); if (!b) return; e.preventDefault(); sel = +b.dataset.i; mark(); cover(sel); }; tr.addEventListener('pointerdown', pd);
  c.say(c.T('벌레가 오기 전에 배마다 봉지를 씌워요 (누르거나 화살표와 E)', 'Bag every pear before the caterpillars get there (tap · ←→+E)'));
  return { go: c.T('봉지 씌우기', 'Bag it'), down() { cover(sel); }, key(code) { const d = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code]; if (!d) return false; sel = Math.max(0, Math.min(N - 1, sel + d)); mark(); return true; },
    tick(dt) { t += dt; const sp = 0.055 / c.zw;
      for (const w of W) { if ((w.wait -= dt) > 0) continue; if (w.tg < 0 || P[w.tg].st) { let bd = 9; w.tg = -1; P.forEach((p, i) => { if (p.st) return; const d = Math.hypot(p.x - w.x, p.y - w.y); if (d < bd) { bd = d; w.tg = i; } }); if (w.tg < 0) { w.e.style.opacity = '0'; continue; } }
        const p = P[w.tg], dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy); if (d < 0.03) { p.st = 2; lost++; p.e.classList.add('eat'); c.snd('pop'); c.say(c.T('앗, 벌레가 먼저 왔어요 — 다음 배를 지켜요', 'Oops, a caterpillar got there first — protect the next one')); w.wait = 1.2; w.tg = -1; check(); continue; }
        w.x += dx / d * sp * dt; w.y += dy / d * sp * dt; w.e.style.left = (w.x * 100).toFixed(1) + '%'; w.e.style.top = (w.y * 100).toFixed(1) + '%'; }
      if (t > 25 && !c.done) c.finish(bag >= N ? 3 : bag >= 4 ? 2 : bag >= 2 ? 1 : 0); }, dispose() { tr.removeEventListener('pointerdown', pd); } }; }

// ⑪ 어린 나무 심기: 차례 맞추기(구덩이 → 묘목 → 흙 덮고 밟기 → 물) + 물을 꾹 눌러 알맞게(넘치지 않게) · 두 그루
const TREE4 = [['⛏️', ['구덩이 파기', 'Dig a hole']], ['🌱', ['묘목 세우기', 'Stand the sapling']], ['👣', ['흙 덮고 꾹꾹 밟기', 'Fill with soil and tread it down']], ['💧', ['물 듬뿍 주기', 'Water well']]];
const WHY4 = [['구덩이가 먼저예요 — 묘목이 설 자리가 없어요', 'Dig first — there’s nowhere for the sapling'], ['묘목을 먼저 세워야 흙으로 덮을 수 있어요', 'Stand the sapling before filling the soil'], ['흙을 덮고 밟아야 물이 뿌리에 머물러요', 'Fill and tread the soil first so water stays at the roots']];
function mkOrder(c) { let tree = 0, st = 0, pts = 0, miss = 0, ph = 'order', wv = 0, hold = false;
  const build = () => { const ord = [0, 1, 2, 3].sort(() => Math.random() - 0.5); c.mg.innerHTML = '<div class="scn s0"><i class="gr"></i><i class="pit"></i><i class="sap">🌱</i><i class="mound"></i><i class="drop">💧</i></div><div class="row crd">' + ord.map(i => '<button class="sub" data-s="' + i + '">' + TREE4[i][0] + ' ' + c.T(TREE4[i][1][0], TREE4[i][1][1]) + '</button>').join('') + '</div>'; ph = 'order'; st = 0; miss = 0; c.go && (c.go.style.display = 'none'); };
  build(); const pick = i => { if (c.done || ph !== 'order') return; const b = c.mg.querySelector('[data-s="' + i + '"]'); if (i === st) { st++; b.disabled = true; c.mg.querySelector('.scn').className = 'scn s' + st; c.snd('tick'); if (st === 3) { ph = 'water'; wv = 0; c.mg.insertAdjacentHTML('beforeend', '<div class="bar wtr"><i class="zone"></i><i class="pg"></i></div>'); const z9 = c.mg.querySelector('.wtr .zone'); z9.style.left = (72 - 6 * c.zw) + '%'; z9.style.width = (16 + 12 * c.zw) + '%'; c.go.style.display = ''; c.say(c.T('이제 물! 꾹 눌러 초록 칸에서 떼요 — 넘치지 않게', 'Now water! Hold and let go in the green — don’t overflow')); } else c.say(c.T('좋아요! 다음은?', 'Good! What’s next?')); }
    else { miss++; b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 350); c.snd('pop'); c.say(c.T(WHY4[Math.min(2, st)][0], WHY4[Math.min(2, st)][1])); } };
  const crd = e => { const b = e.target.closest('[data-s]'); if (!b) return; e.preventDefault(); pick(+b.dataset.s); }; c.mg.addEventListener('pointerdown', crd);
  c.say(c.T('나무 심는 차례대로 눌러요 (누르거나 숫자 1~4)', 'Tap the planting steps in order (tap · keys 1–4)'));
  const water = () => { if (ph !== 'water' || !hold) return; hold = false; const z0 = (72 - 6 * c.zw) / 100, z1 = z0 + (16 + 12 * c.zw) / 100, okW = wv >= z0 && wv <= z1; c.snd(okW ? 'ding' : 'pop'); pts += (miss === 0 ? 1 : 0) + (okW ? 1 : 0); c.mg.querySelector('.scn').className = 'scn s4'; c.say(okW ? c.T('물 듬뿍 — 뿌리가 잘 내리겠어요!', 'Well watered — the roots will settle!') : wv < z0 ? c.T('물이 조금 모자라요', 'A little more water next time') : c.T('물이 넘쳤어요 — 다음엔 조금 일찍', 'It overflowed — let go a bit sooner')); ph = 'done'; tree++; setTimeout(() => { if (c.done) return; if (tree >= 2) c.finish(pts >= 4 ? 3 : pts >= 3 ? 2 : pts >= 1 ? 1 : 0); else { build(); c.say(c.T('한 그루 더! 차례대로', 'One more tree! In order')); } }, 900); };
  return { go: c.T('물 꾹', 'Water (hold)'), down() { if (ph === 'water') hold = true; }, up: water,
    key(code, rep) { const d = /^Digit([1-4])$/.exec(code); if (!d || ph !== 'order') return false; if (rep) return true; const b = c.mg.querySelectorAll('.crd button')[+d[1] - 1]; if (b && !b.disabled) pick(+b.dataset.s); return true; },
    tick(dt) { if (ph !== 'water') return; wv = hold ? Math.min(1.05, wv + dt * 0.5) : wv; const p = c.mg.querySelector('.wtr .pg'); if (p) p.style.transform = 'scaleX(' + Math.min(1, wv).toFixed(3) + ')'; if (wv >= 1.05 && hold) water(); }, dispose() { c.mg.removeEventListener('pointerdown', crd); } }; }

// ⑫ 먹이 나눠 주기(목장): 하나씩 나오는 먹이를 알맞은 동물에게(끌어다 놓기 · 누르기 · 1~4) — 소·양 = 풀·건초(초식) · 개 = 고기 · 초콜릿 = 아무에게도 X(개에게 위험)
const FEED = [['🌾', ['건초', 'Hay'], [0, 1]], ['🍀', ['풀', 'Grass'], [0, 1]], ['🍖', ['고기', 'Meat'], [2]], ['🍫', ['초콜릿', 'Chocolate'], [3]]];
const FEEDWHY = { 0: ['소는 풀을 먹는 초식 동물이에요', 'Cows eat plants — they’re herbivores'], 1: ['양도 풀을 먹는 초식 동물이에요', 'Sheep eat plants too'], 2: ['개는 고기도 먹어요 — 풀은 잘 안 먹어요', 'Dogs eat meat — not hay'], 3: ['초콜릿은 개에게 위험해요 — 아무에게도 주지 않아요', 'Chocolate is dangerous for dogs — give it to no one'] };
function mkFeed(c) { const N = 8, T = 20 * c.zw; let i = 0, ok = 0, cur = 0;
  c.mg.innerHTML = '<div class="cab"><i class="cb fd"></i><b class="cn"></b></div><div class="bx3 an"><button data-b="0"><i>🐄</i>' + c.T('소', 'Cow') + '</button><button data-b="1"><i>🐑</i>' + c.T('양', 'Sheep') + '</button><button data-b="2"><i>🐕</i>' + c.T('개', 'Dog') + '</button><button data-b="3"><i>🚫</i>' + c.T('주지 않기', 'Nobody') + '</button></div>';
  const fd = c.mg.querySelector('.fd'), cn = c.mg.querySelector('.cn'), bx = c.mg.querySelector('.bx3'), TB = timeBar(c, T), seq = [];
  for (let k = 0; k < N; k++) seq.push(k < 2 ? 0 : k < 4 ? 1 : k < 6 ? 2 : 3); seq.sort(() => Math.random() - 0.5);   /* 건초·풀·고기 둘씩 + 초콜릿 둘 */
  const show = () => { cur = seq[i]; fd.textContent = FEED[cur][0]; cn.textContent = c.T(FEED[cur][1][0], FEED[cur][1][1]) + ' (' + (i + 1) + '/' + N + ')'; };
  const give = b => { if (c.done) return; const good = FEED[cur][2].includes(b); if (good) { ok++; c.snd('tick'); c.say(c.T('냠냠! ', 'Munch! ') + ok + '/' + N); } else { c.snd('pop'); const w = FEED[cur][2].includes(3) ? FEEDWHY[3] : FEEDWHY[b === 3 ? FEED[cur][2][0] : b]; c.say(c.T(w[0], w[1])); } i++; if (i >= N) c.finish(ok >= N ? 3 : ok >= 6 ? 2 : ok >= 4 ? 1 : 0); else show(); };
  let dragF = false; const pdF = e => { e.preventDefault(); dragF = true; fd.classList.add('dr'); }, pu = e => { if (!dragF) return; dragF = false; fd.classList.remove('dr'); const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('[data-b]'); if (b && bx.contains(b)) give(+b.dataset.b); };
  const pdB = e => { const b = e.target.closest('[data-b]'); if (!b) return; e.preventDefault(); give(+b.dataset.b); };
  fd.addEventListener('pointerdown', pdF); addEventListener('pointerup', pu); bx.addEventListener('pointerdown', pdB); show();
  c.say(c.T('먹이를 알맞은 동물에게 — 끌어다 주거나 동물을 눌러요 (1~4)', 'Give each food to the right animal — drag or tap (1–4)'));
  return { go: '', down() {}, key(code, rep) { const d = /^Digit([1-4])$/.exec(code); if (!d) return false; if (!rep) give(+d[1] - 1); return true; }, tick(dt) { if (TB.tick(dt)) c.finish(ok >= 7 ? 2 : ok >= 4 ? 1 : 0); }, dispose() { fd.removeEventListener('pointerdown', pdF); removeEventListener('pointerup', pu); bx.removeEventListener('pointerdown', pdB); } }; }

// ── RIVER-1 · FIELD-1(10-17 '강·들에서 할 일 둘씩' · town_rf.js가 엶 · 손놀림이 위 놀이·바다 셋과 겹치지 않게) ──
// ⑬ 물 맑기 살펴보기(생태 하천): 돋보기를 움직여 돌·잎 사이에 숨은 물속 생물 찾기(돋보기 밑에서만 보임) → 찾은 생물로 물 맑기 정하기
const LENS = [['🐛', ['강도래 애벌레', 'Stonefly larva']], ['🦐', ['옆새우', 'Freshwater shrimp']], ['🐟', ['버들치', 'Chinese minnow']], ['🐌', ['다슬기', 'River snail']]];
const LENSD = [['🍂', ['물에 잠긴 잎이에요', 'A sunken leaf']], ['⚪', ['조약돌이에요', 'A pebble']], ['🌿', ['물풀이에요', 'Water weed']]];
const CLEAN = [['아주 맑은 물', 'Very clean water'], ['조금 탁한 물', 'A bit murky'], ['더러운 물', 'Dirty water']];
function mkLens(c) { const T = 20 * c.zw, R = 0.15 + (c.zw - 1) * 0.12; let ph = 'look', found = 0, lx = 0.5, ly = 0.5, tries = 0;
  c.mg.innerHTML = '<div class="tray"><i class="lens"></i></div>'; const tr = c.mg.querySelector('.tray'), ln = tr.querySelector('.lens'), TB = timeBar(c, T), IT = [];
  const slots = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) slots.push([0.09 + i * 0.164 + (Math.random() - 0.5) * 0.05, 0.2 + j * 0.3 + (Math.random() - 0.5) * 0.08]); slots.sort(() => Math.random() - 0.5);
  LENS.forEach((q, n) => IT.push({ q, bug: 1, p: slots[n] })); for (let n = 0; n < 8; n++) IT.push({ q: LENSD[n % 3], bug: 0, p: slots[4 + n] });
  for (const it of IT) { const e = document.createElement('i'); e.className = 'ti' + (it.bug ? '' : ' dc'); e.textContent = it.q[0]; e.style.left = (it.p[0] * 100).toFixed(1) + '%'; e.style.top = (it.p[1] * 100).toFixed(1) + '%'; tr.appendChild(e); it.e = e; }
  const near = it => { const r9 = tr.getBoundingClientRect(), ax = r9.width / Math.max(1, r9.height); return Math.hypot((it.p[0] - lx) * ax, it.p[1] - ly) < R * 1.6; };
  const look = () => { ln.style.left = (lx * 100).toFixed(1) + '%'; ln.style.top = (ly * 100).toFixed(1) + '%'; for (const it of IT) if (it.bug && !it.f) it.e.classList.toggle('v', near(it)); };
  const judgeUI = () => { ph = 'judge'; c.mg.insertAdjacentHTML('beforeend', '<div class="bx3 cl3">' + CLEAN.map((q, i) => '<button data-w="' + i + '">' + c.T(q[0], q[1]) + '</button>').join('') + '</div>'); c.mg.querySelector('.cl3').addEventListener('pointerdown', pdJ);
    c.say(c.T('찾은 생물을 보면 이 물은 어떤가요? (누르기 · 1~3)', 'Judging by what you found, how clean is this water? (tap · 1–3)')); };
  const pick = it => { if (ph !== 'look' || c.done) return; if (!it) return; if (!it.bug) { c.snd('pop'); it.e.classList.remove('no'); void it.e.offsetWidth; it.e.classList.add('no'); c.say(c.T(it.q[1][0], it.q[1][1])); return; } if (it.f || !near(it)) return;
    it.f = 1; found++; it.e.classList.add('f'); it.e.insertAdjacentHTML('beforeend', '<em>' + c.T(it.q[1][0], it.q[1][1]) + '</em>'); c.snd('pick'); c.say(c.T('찾았어요! ', 'Found it! ') + c.T(it.q[1][0], it.q[1][1]) + ' (' + found + '/4)'); if (found >= 4) judgeUI(); };
  const at = e => { const r9 = tr.getBoundingClientRect(); return [(e.clientX - r9.left) / r9.width, (e.clientY - r9.top) / r9.height]; };
  const pm = e => { if (ph !== 'look') return; const [x, y] = at(e); if (x < 0 || x > 1 || y < 0 || y > 1) return; lx = x; ly = y; look(); };
  const pd = e => { if (ph !== 'look') return; e.preventDefault(); pm(e); const t9 = e.target.closest('.ti'); pick(t9 ? IT.find(q => q.e === t9) : null); };
  const judge = w => { if (ph !== 'judge' || c.done) return; tries++; if (w === 0) { c.snd('done'); c.finish(found >= 4 && tries === 1 ? 3 : tries === 1 ? 2 : 1); return; } c.snd('pop'); c.say(c.T('강도래 애벌레와 버들치는 아주 맑은 물에서만 살아요. 더러운 물에는 실지렁이가 많아요', 'Stonefly larvae and minnows live only in very clean water. Dirty water has lots of sludge worms')); };
  const pdJ = e => { const b = e.target.closest('[data-w]'); if (!b) return; e.preventDefault(); judge(+b.dataset.w); };
  tr.addEventListener('pointerdown', pd); tr.addEventListener('pointermove', pm); look();
  c.say(c.T('돋보기를 움직여 돌과 잎 사이에 숨은 물속 생물 넷을 찾아 눌러요 (끌기 · 화살표 + E)', 'Move the magnifier to find four hidden water creatures and tap them (drag · arrows + E)'));
  return { go: '', down() { if (ph === 'look') pick(IT.filter(q => q.bug && !q.f && near(q))[0]); },
    key(code, rep) { if (ph === 'judge') { const d = /^Digit([1-3])$/.exec(code); if (d && !rep) judge(+d[1] - 1); return !!d; } const m = { ArrowLeft: [-0.05, 0], KeyA: [-0.05, 0], ArrowRight: [0.05, 0], KeyD: [0.05, 0], ArrowUp: [0, -0.08], KeyW: [0, -0.08], ArrowDown: [0, 0.08], KeyS: [0, 0.08] }[code]; if (!m) return false; lx = Math.max(0.03, Math.min(0.97, lx + m[0])); ly = Math.max(0.06, Math.min(0.94, ly + m[1])); look(); return true; },
    tick(dt) { if (ph === 'look' && TB.tick(dt)) { c.say(c.T('시간이 다 됐어요. 찾은 것으로 정해 봐요', 'Time’s up — judge with what you found')); judgeUI(); } },
    dispose() { tr.removeEventListener('pointerdown', pd); tr.removeEventListener('pointermove', pm); const j = c.mg.querySelector('.cl3'); if (j) j.removeEventListener('pointerdown', pdJ); } }; }

// ⑭ 굽은 강 나뭇잎 배(실험): 어느 쪽 잎이 먼저 갈지 예상 → 두 잎을 띄워 지켜보기(바깥쪽이 빠름) → 모래·자갈이 쌓이는 곳 누르기(안쪽)
function mkBend(c) { let ph = 'guess', g = -1, t = 0, tries = 0, pts = 0;
  c.mg.innerHTML = '<svg class="bend" viewBox="0 0 300 170"><rect width="300" height="170" fill="#cfe3b8"/><path d="M-10,40 C110,40 100,120 150,120 C200,120 190,40 310,40" stroke="#e6d6a6" stroke-width="86" fill="none"/><path d="M-10,40 C110,40 100,120 150,120 C200,120 190,40 310,40" stroke="#7fc6ec" stroke-width="58" fill="none"/>'
    + '<path class="li" d="M-10,24 C100,24 104,98 150,98 C196,98 200,24 310,24" fill="none"/><path class="lo" d="M-10,56 C120,56 100,142 150,142 C200,142 180,56 310,56" fill="none"/>'
    + '<ellipse class="z" data-z="in" cx="150" cy="62" rx="44" ry="26"/><rect class="z" data-z="out" x="96" y="150" width="108" height="18" rx="8"/><text class="lf" data-l="in">🍃</text><text class="lf" data-l="out">🍃</text></svg>'
    + '<div class="bx3 bg2"><button data-g="out">' + c.T('바깥쪽 잎', 'Outer leaf') + '</button><button data-g="in">' + c.T('안쪽 잎', 'Inner leaf') + '</button></div>';
  const sv = c.mg.querySelector('svg'), P = { in: sv.querySelector('.li'), out: sv.querySelector('.lo') }, LF = { in: sv.querySelector('[data-l=in]'), out: sv.querySelector('[data-l=out]') }, bx = c.mg.querySelector('.bg2'), Lh = { in: P.in.getTotalLength(), out: P.out.getTotalLength() }, DUR = { in: 6.2, out: 3.9 };
  const place = (k, f) => { const p = P[k].getPointAtLength(Math.min(1, f) * Lh[k]); LF[k].setAttribute('x', (p.x - 9).toFixed(1)); LF[k].setAttribute('y', (p.y + 7).toFixed(1)); }; place('in', 0.02); place('out', 0.02);
  const guess = k => { if (ph !== 'guess') return; g = k; ph = 'watch'; bx.style.visibility = 'hidden'; c.snd('tick'); c.say(c.T('두 잎을 함께 띄웠어요. 어느 쪽이 빠른지 지켜봐요', 'Both leaves are afloat — watch which is faster')); };
  const tap = z => { if (ph !== 'sand' || c.done) return; tries++; if (z === 'in') { pts += tries === 1 ? 2 : 1; c.snd('done'); c.finish(pts); return; } c.snd('pop'); c.say(c.T('바깥쪽은 물이 빨라서 오히려 강가를 깎아요. 물이 느린 쪽을 찾아봐요', 'The fast outer side wears the bank away — find where the water is slow')); };
  const pdB = e => { const b = e.target.closest('[data-g]'); if (!b) return; e.preventDefault(); guess(b.dataset.g); }, pdS = e => { const z = e.target.closest('.z'); if (!z) return; e.preventDefault(); tap(z.dataset.z); };
  bx.addEventListener('pointerdown', pdB); sv.addEventListener('pointerdown', pdS); let sel = 'in';
  c.say(c.T('강이 굽은 곳에 나뭇잎 둘을 띄워요. 어느 쪽 잎이 먼저 갈까요? (누르기 · ←→ + E)', 'Two leaves go on the bend. Which one will be faster? (tap · ←→ + E)'));
  return { go: '', down() { if (ph === 'guess') guess(sel === 'in' ? 'in' : 'out'); else if (ph === 'sand') tap(sel); },
    key(code, rep) { if (code === 'ArrowLeft' || code === 'KeyA') { sel = ph === 'sand' ? 'in' : 'out'; mark(); return true; } if (code === 'ArrowRight' || code === 'KeyD') { sel = ph === 'sand' ? 'out' : 'in'; mark(); return true; } return false; },
    tick(dt) { if (ph !== 'watch') return; t += dt; place('in', t / DUR.in); place('out', t / DUR.out); if (t >= DUR.in) { ph = 'sand'; if (g === 'out') pts = 1; sv.classList.add('pick'); c.say((g === 'out' ? c.T('예상이 맞았어요. ', 'You guessed right. ') : c.T('바깥쪽 잎이 먼저 갔어요. ', 'The outer leaf won. ')) + c.T('바깥쪽 물이 더 빨라요. 그럼 모래와 자갈이 쌓이는 곳은 어디일까요? 눌러 봐요', 'The outer side flows faster. So where do sand and gravel pile up? Tap it')); } },
    dispose() { bx.removeEventListener('pointerdown', pdB); sv.removeEventListener('pointerdown', pdS); } };
  function mark() { for (const b of bx.querySelectorAll('button')) b.classList.toggle('sub', b.dataset.g !== sel); sv.querySelectorAll('.z').forEach(z => z.classList.toggle('sel', z.dataset.z === sel)); } }

// ⑮ 논에 사는 생물(들): 가만히 있으면 생물이 얼굴을 내밀고, 움직이면 첨벙 숨어요 → 보일 때 눌러 기록(E = 지금 보이는 것)
const PADLIFE = [['🐸', ['참개구리', 'Frog'], ['벼를 갉아 먹는 벌레를 잡아먹어요', 'It eats bugs that chew the rice']], ['🐌', ['우렁이', 'Pond snail'], ['논의 어린 풀을 먹어요', 'It eats young weeds in the paddy']], ['🐟', ['미꾸라지', 'Loach'], ['진흙 속에 살고 물 위로 올라와 숨도 쉬어요', 'It lives in the mud and gulps air at the surface']], ['🦗', ['벼메뚜기', 'Rice grasshopper'], ['벼 잎을 먹고 가을 논에 많아요', 'It eats rice leaves and is common in autumn']], ['🐦', ['백로', 'Egret'], ['논에서 미꾸라지와 개구리를 잡아먹어요', 'It hunts loaches and frogs in the paddy']]];
function mkStill(c) { const T = 22 * c.zw, N = PADLIFE.length; let still = 0, peek = -1, pT = 0, found = 0, lx = -1, ly = -1, lt = 0, cool = 0;
  c.mg.innerHTML = '<div class="pdy"></div>'; const pd9 = c.mg.querySelector('.pdy'), TB = timeBar(c, T), S = PADLIFE.map((q, i) => ({ q, x: 0.1 + (i % 5) * 0.2 + (Math.random() - 0.5) * 0.06, y: 0.3 + (i % 2) * 0.38 + (Math.random() - 0.5) * 0.1, f: 0 }));
  for (const s of S) { const e = document.createElement('i'); e.className = 'cr'; e.textContent = s.q[0]; e.style.left = (s.x * 100).toFixed(1) + '%'; e.style.top = (s.y * 100).toFixed(1) + '%'; pd9.appendChild(e); s.e = e; }
  const hide = () => { if (peek >= 0) S[peek].e.classList.remove('v'); peek = -1; };
  const scare = () => { still = 0; if (peek >= 0) { hide(); pd9.classList.remove('rip'); void pd9.offsetWidth; pd9.classList.add('rip'); c.say(c.T('첨벙! 너무 빨리 움직였어요. 살금살금 다가가요', 'Splash! Too fast — move slowly')); } };
  const rec = i => { const s = S[i]; if (c.done || !s || s.f || peek !== i) return; s.f = 1; found++; peek = -1; s.e.classList.remove('v'); s.e.classList.add('f'); s.e.insertAdjacentHTML('beforeend', '<em>' + c.T(s.q[1][0], s.q[1][1]) + '</em>'); c.snd('pick'); cool = 0.6;
    c.say(s.q[0] + ' ' + c.T(s.q[1][0] + ' — ' + s.q[2][0], s.q[1][1] + ' — ' + s.q[2][1]) + ' (' + found + '/' + N + ')'); if (found >= N) c.finish(3); };
  const pm = e => { const now = performance.now(), d = lx >= 0 ? Math.hypot(e.clientX - lx, e.clientY - ly) : 0, v = d / Math.max(16, now - lt) * 1000; if (v > 650 * c.zw) scare(); lx = e.clientX; ly = e.clientY; lt = now; };   /* 살금살금(천천히)은 괜찮고 휙 움직이면 숨음 */
  const pdn = e => { const t9 = e.target.closest('.cr'); e.preventDefault(); lx = e.clientX; ly = e.clientY; if (!t9) return; rec(S.findIndex(s => s.e === t9)); };
  pd9.addEventListener('pointermove', pm); pd9.addEventListener('pointerdown', pdn);
  c.say(c.T('가만히 지켜봐요. 생물이 보이면 살금살금 다가가 눌러요. 휙 움직이면 숨어요 (E = 지금 보이는 것)', 'Keep still and watch. When a creature shows, move slowly and tap it — quick moves scare it (E = the one showing)'));
  return { go: '', down() { if (peek >= 0) rec(peek); }, key(code) { if (/^(Arrow|Key[WASD]$)/.test(code)) { scare(); return true; } return false; },
    tick(dt) { if (TB.tick(dt)) { c.finish(found >= 4 ? 2 : found >= 2 ? 1 : 0); return; } still += dt; if (cool > 0) { cool -= dt; return; }
      if (peek >= 0) { if ((pT -= dt) <= 0) { hide(); still = 0.2; } return; } if (still > 0.8 / c.zw) { const L9 = S.map((s, i) => i).filter(i => !S[i].f); if (!L9.length) return; peek = L9[(Math.random() * L9.length) | 0]; pT = 1.7 * c.zw; S[peek].e.classList.add('v'); } },
    dispose() { pd9.removeEventListener('pointermove', pm); pd9.removeEventListener('pointerdown', pdn); } }; }

// ⑯ 다랑이 논 물 대기(들 · 농수로): 물길과 물꼬 둘을 열고 닫아 위 논부터 아래 논까지 차례로 알맞은 깊이(초록 띠)로 · 넘치면 둑이 무너질 뻔
function mkGate(c) { const T = 24 * c.zw, IN = 0.11, FL = 0.12, LO = 0.5, HI = 0.78; let W = [0, 0, 0], G = [false, false, false], over = 0, sel = 0;
  c.mg.innerHTML = '<div class="trc">' + [0, 1, 2].map(i => '<div class="pd" data-p="' + i + '" style="margin-left:' + i * 12 + '%"><b>' + c.T(['위 논', '가운데 논', '아래 논'][i], ['Top paddy', 'Middle paddy', 'Bottom paddy'][i]) + '</b><span class="lv"><i class="bd"></i><i class="wv"></i></span></div>').join('') + '</div>'
    + '<div class="bx3 gt">' + [c.T('물길 (농수로)', 'Canal inlet'), c.T('물꼬 ① 위→가운데', 'Gate 1: top → middle'), c.T('물꼬 ② 가운데→아래', 'Gate 2: middle → bottom')].map((t, i) => '<button data-t="' + i + '">' + t + '<small></small></button>').join('') + '</div>';
  const ST = [c.T('닫힘', 'Closed'), c.T('열림', 'Open')], WV = [...c.mg.querySelectorAll('.wv')], PD = [...c.mg.querySelectorAll('.pd')], BT = [...c.mg.querySelectorAll('[data-t]')], TB = timeBar(c, T);
  c.mg.querySelectorAll('.bd').forEach(b => { b.style.left = (LO * 100) + '%'; b.style.width = ((HI - LO) * 100) + '%'; });
  const draw = () => { W.forEach((w, i) => { WV[i].style.transform = 'scaleX(' + w.toFixed(3) + ')'; PD[i].classList.toggle('ok', w >= LO && w <= HI); PD[i].classList.toggle('hi', w > 0.95); }); BT.forEach((b, i) => { b.classList.toggle('on', G[i]); b.classList.toggle('sel', i === sel); const t9 = b.querySelector('small'); if (t9.textContent !== ST[G[i] ? 1 : 0]) t9.textContent = ST[G[i] ? 1 : 0]; }); };
  const tog = i => { if (c.done) return; G[i] = !G[i]; sel = i; c.snd('tick'); draw(); };
  const pdT = e => { const b = e.target.closest('[data-t]'); if (!b) return; e.preventDefault(); tog(+b.dataset.t); }; c.mg.querySelector('.gt').addEventListener('pointerdown', pdT); draw();
  c.say(c.T('물길을 열어 위 논부터 물을 대요. 다 차면 물꼬를 열어 아래 논으로 보내요. 초록 띠까지만, 넘치지 않게 (누르기 · 1~3)', 'Open the canal to fill the top paddy, then open gates to send water down. Fill to the green band — no overflow (tap · 1–3)'));
  const end = () => { const n = W.filter(w => w >= LO && w <= HI).length; c.finish(Math.max(0, n - (over ? 1 : 0))); };
  return { go: '', down() { tog(sel); }, key(code, rep) { const d = /^Digit([1-3])$/.exec(code); if (d) { if (!rep) tog(+d[1] - 1); return true; } const m = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code]; if (!m) return false; sel = Math.max(0, Math.min(2, sel + m)); draw(); return true; },
    tick(dt) { if (G[0]) W[0] += IN * dt; for (let i = 0; i < 2; i++) if (G[i + 1] && W[i] > 0.02) { const q = Math.min(W[i], FL * dt); W[i] -= q; W[i + 1] += q; }
      for (let i = 0; i < 3; i++) if (W[i] > 1) { W[i] = 1; if (!over) { over = 1; c.snd('pop'); c.say(c.T('넘쳐요! 논둑이 무너질 뻔했어요. 물길이나 물꼬를 바꿔요', 'Overflowing! The bank nearly broke — change the inlet or a gate')); } }
      draw(); if (W.every(w => w >= LO && w <= HI) && !G[0] && !G[1] && !G[2]) { c.say(c.T('세 논에 물이 알맞게 찼어요', 'All three paddies are just right')); c.finish(over ? 2 : 3); return; } if (TB.tick(dt)) end(); },
    dispose() { const g9 = c.mg.querySelector('.gt'); if (g9) g9.removeEventListener('pointerdown', pdT); } }; }

// ⑰ 투호(TOSS-1 · 사용자 10-18 '투호 놀이도 저 막대 방식이야? · 퀘스트·놀이에 특색 좀'): 화살 다섯 개를 던져 항아리에 — 끌어서(또는 ←→ 힘 · ↑↓ 각도) 겨누면 처음 몇 뼘만 점선 · 놓으면(E) 포물선 · 바람(깃발) · 항아리 입에 들면 쏙 · 테두리에 맞으면 튕겨 나옴 · 던질 때마다 항아리 자리·바람이 조금씩 바뀜(뒤로 갈수록 멀고 바람 셈)
function mkToss(c) {
  c.mg.innerHTML = '<canvas width="440" height="220" style="width:100%;max-width:440px;display:block;margin:0 auto;touch-action:none;border-radius:10px;background:#eaf3ff;cursor:crosshair"></canvas>';
  const cv = c.mg.querySelector('canvas'), g = cv.getContext('2d'), W = 440, GY = 196, GR = 520, HX = 52, HY = 150, N = 5;
  let n = 0, hits = 0, ph = 'aim', drag = null, ang = 0.9, pw = 0.55, A = null, pot = null, wind = 0, wait = 0, rim = false, prevY = 0;
  const newPot = () => { pot = { x: 255 + Math.random() * 95 + n * 14, w: 28 * Math.min(1.5, c.zw) }; wind = (Math.random() - 0.5) * (n < 2 ? 30 : 90); };
  newPot(); c.say(c.T('끌어서 겨누고 놓으면 던져요(←→ 힘 · ↑↓ 각도 · E 던지기) — 깃발이 바람 쪽!', 'Drag to aim, release to throw (←→ power · ↑↓ angle · E throw) — the flag shows the wind!'));
  const vel = () => 250 + pw * 330, launch = () => { if (ph !== 'aim') return; const v = vel(); A = { x: HX, y: HY, vx: Math.cos(ang) * v, vy: -Math.sin(ang) * v }; prevY = HY; rim = false; ph = 'fly'; c.snd('pop'); };
  const potTop = GY - 44;
  const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * 220 / r.height]; };
  const pd = e => { if (ph !== 'aim') return; e.preventDefault(); drag = P(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
  const pm = e => { if (!drag || ph !== 'aim') return; const [x, y] = P(e), dx = drag[0] - x, dy = y - drag[1], L = Math.hypot(dx, dy); if (L < 6) return; ang = Math.max(0.25, Math.min(1.35, Math.atan2(dy, Math.max(1, dx)))); pw = Math.max(0.05, Math.min(1, L / 140)); };
  const pu = () => { if (drag && ph === 'aim') { drag = null; launch(); } drag = null; };
  cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);
  function draw() { g.clearRect(0, 0, W, 220); g.fillStyle = '#cfe6b8'; g.fillRect(0, GY, W, 24); g.strokeStyle = '#8fb06f'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, GY); g.lineTo(W, GY); g.stroke();
    g.strokeStyle = '#6b4a2f'; g.lineWidth = 3; g.beginPath(); g.moveTo(W - 24, GY); g.lineTo(W - 24, GY - 70); g.stroke(); const f0 = Math.max(-1, Math.min(1, wind / 45)), fl = Math.abs(f0) < 0.3 ? (f0 < 0 ? -0.3 : 0.3) : f0; g.fillStyle = '#2b2420'; g.font = '700 12px sans-serif'; g.textAlign = 'center'; g.fillText(Math.abs(wind) < 12 ? c.T('바람 약함', 'light wind') : (wind > 0 ? c.T('바람 →', 'wind →') : c.T('← 바람', '← wind')), W - 24, GY - 76); g.fillStyle = '#e0453a'; g.beginPath(); g.moveTo(W - 24, GY - 70); g.lineTo(W - 24 + 26 * fl, GY - 63); g.lineTo(W - 24, GY - 56); g.closePath(); g.fill();   // 바람 깃발
    g.fillStyle = '#2f6fd0'; g.beginPath(); g.arc(HX - 14, HY - 24, 9, 0, 7); g.fill(); g.fillRect(HX - 20, HY - 15, 12, 30); g.strokeStyle = '#2f6fd0'; g.lineWidth = 4; g.beginPath(); g.moveTo(HX - 14, HY - 8); g.lineTo(HX, HY); g.moveTo(HX - 16, HY + 15); g.lineTo(HX - 22, GY); g.moveTo(HX - 12, HY + 15); g.lineTo(HX - 6, GY); g.stroke();   // 던지는 아이(이름 없는 모양)
    const px = pot.x, hw = pot.w / 2; g.fillStyle = '#5d6f86'; g.beginPath(); g.ellipse(px, GY - 18, hw + 14, 20, 0, 0, 7); g.fill(); g.fillRect(px - hw - 3, potTop, pot.w + 6, 16); g.fillStyle = '#2b2420'; g.fillRect(px - hw, potTop, pot.w, 4); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.strokeRect(px - hw - 3, potTop, pot.w + 6, 16);   // 항아리
    if (ph === 'aim') { const v = vel(); let x = HX, y = HY, vx = Math.cos(ang) * v, vy = -Math.sin(ang) * v; g.fillStyle = '#2b2420'; for (let i = 0; i < 9; i++) { for (let k = 0; k < 4; k++) { vy += GR * 0.01; vx += wind * 0.01; x += vx * 0.01; y += vy * 0.01; } g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } }   // 처음 몇 뼘만 점선(끝까지 보여 주지 않음)
    const ax = A ? A.x : HX, ay = A ? A.y : HY, an = A ? Math.atan2(A.vy, A.vx) : -ang; g.save(); g.translate(ax, ay); g.rotate(an); g.strokeStyle = '#7a5232'; g.lineWidth = 3; g.beginPath(); g.moveTo(-22, 0); g.lineTo(10, 0); g.stroke(); g.fillStyle = '#e0453a'; g.beginPath(); g.moveTo(10, -4); g.lineTo(16, 0); g.lineTo(10, 4); g.fill(); g.fillStyle = '#f6efe3'; g.fillRect(-24, -4, 6, 8); g.restore();   // 화살
    g.fillStyle = '#2b2420'; g.font = '800 15px sans-serif'; g.textAlign = 'left'; g.fillText(c.T('화살 ', 'Arrow ') + Math.min(N, n + 1) + '/' + N + '  ·  ' + c.T('쏙 ', 'In ') + hits, 10, 22); }
  const next = () => { n++; if (n >= N) { c.finish(hits >= 4 ? 3 : hits >= 3 ? 2 : hits >= 1 ? 1 : 0); return; } A = null; ph = 'aim'; newPot(); if (n === 2) c.say(c.T('이제 바람이 세져요 — 깃발을 봐요!', 'The wind is picking up — watch the flag!')); };
  draw();
  return { go: c.T('던지기!', 'Throw!'), extra: () => hits,
    down() { launch(); },
    key(code) { if (ph !== 'aim') return false; if (code === 'ArrowUp') ang = Math.min(1.35, ang + 0.04); else if (code === 'ArrowDown') ang = Math.max(0.25, ang - 0.04); else if (code === 'ArrowRight') pw = Math.min(1, pw + 0.04); else if (code === 'ArrowLeft') pw = Math.max(0.05, pw - 0.04); else return false; return true; },
    tick(dt) { if (ph === 'fly' && A) { A.vy += GR * dt; A.vx += wind * dt; A.x += A.vx * dt; A.y += A.vy * dt; const hw = pot.w / 2;
        if (prevY < potTop && A.y >= potTop) { const d = Math.abs(A.x - pot.x); if (d < hw - 2) { hits++; ph = 'wait'; wait = 0.9; A.y = potTop + 6; c.snd('ding'); c.say(c.T('쏙! 들어갔어요', 'Plop! It went in')); } else if (d < hw + 5 && !rim) { rim = true; A.vy = -Math.abs(A.vy) * 0.35; A.vx = -A.vx * 0.3; c.snd('tick'); c.say(c.T('땡! 항아리 입에 맞고 튕겼어요', 'Clink! It bounced off the rim')); } }
        prevY = A.y; if (ph === 'fly' && (A.y >= GY - 2 || A.x > W + 10 || A.x < -10)) { ph = 'wait'; wait = 0.8; if (!rim) c.say(A.x < pot.x ? c.T('조금 짧았어요 — 더 세게?', 'A bit short — more power?') : c.T('조금 멀었어요 — 덜 세게?', 'A bit long — less power?')); } }
      else if (ph === 'wait' && (wait -= dt) <= 0) next(); draw(); },
    dispose() { cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm); cv.removeEventListener('pointerup', pu); cv.removeEventListener('pointercancel', pu); } };
}

const MK = { toss: mkToss, bar: mkBar, line: mkLine, ripe: mkRipe, plant: mkPlant, cut: mkCut, salt: mkSalt, comb: mkComb, dig: mkDig, sort: mkSort, cover: mkCover, order: mkOrder, feed: mkFeed, lens: mkLens, bend: mkBend, still: mkStill, gate: mkGate };
// 놀이 하나 열기: o = { root(.pb — 안에 .mg · .msg · .go가 있어야 함), k(일 갈래), en, zw(솜씨 초록 칸 배수), sea, sfx(k), tone(...), grade(false = 결과 말 없이 바로 끝 — 요리·징검다리), onEnd(점수 0~3) }
export function createMini(kind, o) { css();
  const c = { root: o.root, mg: o.root.querySelector('.mg'), msgEl: o.root.querySelector('.msg'), go: o.root.querySelector('.go'), en: !!o.en, zw: Math.max(1, o.zw || 1), k: o.k, sea: o.sea, done: false };
  c.T = (ko, e2) => (c.en ? e2 : ko); c.say = s => { if (c.msgEl && c.msgEl.textContent !== s) c.msgEl.textContent = s; }; c.snd = k => { if (o.sfx) o.sfx(k); }; c.tone = (...a) => { if (o.tone) o.tone(...a); };
  let endT = -1, score = 0;
  c.finish = ok => { if (c.done) return; c.done = true; score = Math.max(0, Math.min(3, ok | 0)); if (o.grade === false) { endT = 0; return; } c.root.classList.add('mg-end'); const f9 = FACT[kind === 'plant' || kind === 'cut' ? kind : c.k]; c.say(gradeText(score, c.en) + (f9 ? (c.en ? ' 💡 Did you know? ' : ' 💡 알고 있었나요? ') + f9[c.en ? 1 : 0] : '')); c.snd(score >= 3 ? 'done' : score ? 'ding' : 'buzz'); endT = f9 ? 3.2 : 0.8; };   /* PLAY-3: 끝 = 결과 + 사실 한 줄(3.2초) */
  const g = (MK[kind] || mkBar)(c);
  const pd = e => { e.preventDefault(); if (!c.done) g.down(); }, pu = () => { if (g.up) g.up(); };
  if (c.go && !g.go) c.go.style.display = 'none';   /* 손으로 하는 놀이(끌기·나누기) = 큰 단추 없음 */
  if (c.go && g.go) { c.go.textContent = g.go; c.go.addEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.addEventListener(ev, pu); }
  return { kind,
    get ok() { return score; }, get done() { return c.done; }, get extra() { return g.extra ? g.extra() : null; },
    down() { if (!c.done) g.down(); }, up() { if (!c.done && g.up) g.up(); }, key(code, rep) { return !c.done && g.key ? !!g.key(code, rep) : false; },
    tick(dt) { if (dt > 0.1) dt = 0.1; if (!c.done) { g.tick(dt); return; } if (endT >= 0 && (endT -= dt) <= 0) { endT = -1; o.onEnd(score); } },
    dispose() { c.done = true; endT = -1; if (g.dispose) g.dispose(); if (c.go) { c.go.removeEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.removeEventListener(ev, pu); } } };
}
