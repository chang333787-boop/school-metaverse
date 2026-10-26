// 🎮 일꾼 곁 거들기 놀이(PLAY-2 틀 다섯 → PLAY-3 '그 일의 진짜 동작 + 배울 거리 하나' · 사용자 10-17 '미니게임들 좋은데 너무 다 비슷한 방식 · 창의성 · 교육을 잃어서는 안 된다'): 놀이 코드와 떼어 둔 규칙·화면
//   일마다 손이 하는 일이 다름: 모내기 = 못줄 눈금에 꾹꾹 심기 · 벼 베기 = 콤바인 길 한 붓 그리기 · 소금 = 대파로 밀어 모으기(구름 오기 전) · 꿀 = 깃발 보고 바람 등진 자리 → 벌 피해 밀랍 뚜껑 칸 고르기(JUDGE-1) · 감자 = 줄기 둘레 파기 · 조개 = 작은 숨구멍 둘 밑 파기
//     배추 = 크기대로 상자에 나누기 · 배 = 벌레 오기 전에 봉지 씌우기 · 어린 나무 = 심는 차례 + 깊이 그림 + 흙 보고 물 양(틀리면 다음 날 시듦 · JUDGE-1) · 목장 = 동물마다 알맞은 먹이 · 낚시 = 줄 당기기(물고기 반대쪽으로 끌기 · FISH-2) · 김 = 얇은 곳에 한 숟갈·두꺼운 곳 덜기 + 하늘 보고 말릴 자리(JUDGE-1) · 굴 = 고리 자로 크기 재서 나누기 · 딸기·표고 = 익은 것 고르기 · 요리 = 🍳 바쁜 부엌(주문·끌기·불 세기·뚜껑) · 타이밍 막대는 10-24에 모두 걷어 냄(징검다리는 걸어서 건넘)
//   끝 = 결과 3단계 + '💡 알고 있었나요?' 사실 한 줄(사실만) · 점수 0~3 = 옛 보상 표 그대로 · 실패도 경험치 1(마을 쪽) · 셈 X · 한 판 15~25초
//   솜씨 perk 'zone'(zw 1~1.25) = 쉬워지는 쪽으로(시간 · 초록 폭 · 삽질 수 · 벌레 느리게)
//   화면 = DOM + CSS(놀이 창이 열린 동안만 · 마을 tick이 부르는 tick(dt) 하나 — 따로 rAF X) · 입력 = down()/up()(E·스페이스·큰 단추) + key(코드, 반복)(화살표·WASD·숫자) + 누르기·끌기(마우스·터치)
import { fishAt, fishBest, FISH_FACT } from './town_fish.js?v=2'; import { mkSalt } from './town_salt.js?v=1'; import { ladVal } from './town_lad.js?v=3';   /* LADDER-2 도전 칸마다 조건 값 */   /* SALT-2 염전 꼬임 넷 */   /* FISH-2 줄 낚시 = 물때·자리·미끼로 걸리는 고기 */
export const MG_V = 3;
const KIND = { tuho: 'toss', fisher: 'tug', rod: 'tug', seaweed: 'spread', oyster: 'gauge', strawberry: 'ripe', shiitake: 'ripe', saltpan: 'salt', beehive: 'comb', potato: 'dig', clam: 'dig', cabbage: 'sort', pear: 'cover', lumber: 'order', pasture: 'feed' };
export const mgKind = (k, sea) => (k === 'paddy' ? (sea === 'autumn' ? 'cut' : 'plant') : KIND[k] || 'ripe');   /* 논 = 봄 모내기 · 가을 벼 베기 */
// 놀이 창 첫 줄 = 할 일(아이 눈 2차 '말풍선과 창 첫 줄이 같은 문장' — 말풍선은 일꾼의 말 · 창 첫 줄은 내가 할 일)
const TASK = { plant: ['못줄 눈금에 맞춰 모를 심어요', 'Plant seedlings on the marks of the guide rope'], cut: ['콤바인으로 벼를 남김없이 베요', 'Cut all the rice with the combine'], fisher: ['물고기가 당기는 반대쪽으로 줄을 끌어 올려요', 'Pull the line the opposite way to the fish and bring it up'], rod: ['물고기가 당기는 반대쪽으로 줄을 끌어 올려요', 'Pull the line the opposite way to the fish and bring it up'], seaweed: ['얇은 곳에 반죽을 더해 고르게 펴고, 하늘을 보고 말려요', 'Add mix to thin spots to even it out, then dry it by the weather'], oyster: ['고리 자로 굴 크기를 재서 나눠요', 'Measure the oysters with the ring and sort them'],
  strawberry: ['빨갛게 익은 딸기만 따요', 'Pick only the red, ripe strawberries'], shiitake: ['갓이 알맞게 핀 표고만 따요', 'Pick only shiitake with caps just right'], saltpan: ['바닷물에서 소금을 얻어요', 'Get salt from seawater'], beehive: ['바람을 보고 설 자리를 골라 연기를 피우고, 뚜껑 덮인 칸만 떠요', 'Read the wind, pick where to puff smoke, then take only the capped cells'],
  potato: ['줄기 둘레를 파서 감자를 캐요', 'Dig around the stems for potatoes'], clam: ['작은 구멍 둘 밑을 파서 조개를 캐요', 'Dig under pairs of tiny holes for clams'], cabbage: ['배추를 크기대로 세 상자에 나눠 담아요', 'Sort the cabbages into three boxes by size'], pear: ['벌레가 오기 전에 배마다 봉지를 씌워요', 'Bag every pear before the caterpillars come'],
  lumber: ['흙을 보고 알맞은 깊이와 물로 어린 나무를 심어요', 'Read the soil and plant saplings at the right depth with the right water'], pasture: ['동물마다 알맞은 먹이를 줘요', 'Give each animal the right food'], cook: ['주문 쪽지대로 재료를 넣고, 알맞게 익으면 접시에 담아요', 'Follow the order note: add ingredients, then plate it when it’s just right'], tuho: ['화살을 던져 항아리에 넣어요', 'Toss arrows into the pot'] };
export const taskOf = (kind, k, en) => { const t = TASK[kind === 'plant' || kind === 'cut' ? kind : k]; return t ? (en ? 'To do: ' : '할 일: ') + t[en ? 1 : 0] : ''; };
export const gradeOf = ok => (ok >= 3 ? 2 : ok >= 1 ? 1 : 0);
const GRADE_T = [['아쉬워요! 다음엔 더 잘할 수 있어요', 'So close! You’ll get it next time'], ['잘했어요!', 'Well done!'], ['아주 잘했어요!', 'Excellent!']];
export const gradeText = (ok, en) => GRADE_T[gradeOf(ok)][en ? 1 : 0];
// 💡 알고 있었나요?(놀이가 끝날 때 한 줄 · 사실만) — 일 갈래(또는 논 = 모내기·벼 베기)
const FACT = {
  plant: ['모를 줄 맞춰 고른 간격으로 심으면 바람이 잘 통하고 햇빛을 고르게 받아 잘 자라요', 'Rice planted in straight, even rows gets air and sunlight evenly and grows well'],
  cut: ['콤바인은 벼를 베면서 바로 낟알까지 털어 주는 기계예요', 'A combine cuts the rice and threshes the grain at the same time'],
  saltpan: ['바닷물이 햇볕과 바람에 마르면 소금이 남아요 — 비가 오면 다시 녹아서 서둘러 거둬요', 'Sun and wind dry seawater and leave salt — rain melts it, so it’s gathered quickly'],
  beehive: ['꿀벌은 꿀이 다 익으면 밀랍으로 칸 뚜껑을 덮어요. 연기는 벌이 위험을 알리는 냄새를 가려 벌을 차분하게 해요', 'Bees seal ripe honey with wax caps. Smoke covers the bees’ alarm smell, so they stay calm'],
  potato: ['감자는 땅속줄기가 굵어진 거예요 — 줄기 밑 둘레 땅속에 주렁주렁 달려요', 'A potato is a swollen underground stem — they grow around the base of the plant'],
  clam: ['조개는 펄 속에 숨어서 작은 구멍으로 바닷물을 빨아들이고 내보내요', 'Clams hide in the mud and draw seawater in and out through tiny holes'],
  cabbage: ['배추는 속이 꽉 찰수록 묵직해요 — 크기대로 나눠 담으면 상자마다 고르게 팔 수 있어요', 'A fuller cabbage feels heavier — sorting by size makes even boxes to sell'],
  pear: ['배에 봉지를 씌우면 벌레와 병을 막고 껍질이 곱게 자라요', 'Bagging pears keeps out bugs and disease and keeps the skin smooth'],
  lumber: ['나무는 뿌리 목(뿌리와 줄기가 만나는 곳)이 땅 높이와 같게 심어요. 흙이 젖어 있으면 물을 덜 줘요. 물이 너무 많으면 뿌리가 숨을 못 쉬어요', 'Plant a tree with its root collar level with the ground. If the soil is wet, give less water: too much and the roots cannot breathe'],
  pasture: ['소와 양은 풀을 먹는 초식 동물이에요 — 초콜릿은 개에게 위험해요', 'Cows and sheep are herbivores — and chocolate is dangerous for dogs'],
  fisher: ['물고기는 아가미로 물에 녹은 산소를 마셔요', 'Fish breathe oxygen dissolved in water through their gills'],
  seaweed: ['김은 바다에 김발을 세워 길러요. 옛날에는 뜬 김을 발장에 얇게 펴서 햇볕과 바람에 말렸어요', 'Laver is grown on nets set up in the sea. Long ago, people spread it thin on bamboo mats to dry in the sun and wind'],
  oyster: ['굴은 바위나 양식 줄에 붙어 자라요. 작은 굴은 바다에 두어 더 자라게 해요', 'Oysters grow attached to rocks or farm ropes. Small ones are left in the sea to grow bigger'],
  strawberry: ['딸기 겉의 작은 점 하나하나가 씨앗이에요', 'Each tiny dot on a strawberry is a seed'],
  shiitake: ['표고는 참나무 같은 나무 토막(원목)에서 자라는 버섯이에요', 'Shiitake grow on logs of trees like oak'],
  stream: ['물속에 사는 작은 생물을 보면 물이 얼마나 맑은지 알 수 있어요. 강도래 애벌레와 버들치가 살면 아주 맑은 물이에요', 'Small water creatures tell you how clean water is. Stonefly larvae and minnows mean very clean water'],
  bend: ['강이 굽은 곳 바깥쪽은 물이 빨라 강가를 깎고, 안쪽은 물이 느려 모래와 자갈이 쌓여요', 'On a river bend the fast outer side wears the bank away, and the slow inner side piles up sand and gravel'],
  paddylife: ['논은 물이 고인 습지라서 개구리, 우렁이, 미꾸라지 같은 많은 생물의 집이 돼요', 'A rice paddy is a wetland — home to frogs, snails, loaches and more'],
  terrace: ['다랑이 논은 산비탈을 계단처럼 깎아 만든 논이에요. 위 논의 물꼬를 열면 물이 아래 논으로 차례로 흘러요', 'Terraced paddies are cut into hillsides like steps. Opening the upper gate lets water flow down paddy by paddy'],
};
const RIPE = {
  strawberry: ['s', '🍓', ['빨갛게 다 익은 딸기만 눌러요 — 하얗고 초록인 딸기는 더 기다려요', 'Tap only fully red strawberries — pale green ones need more time'], ['아직 안 익었어요 — 초록빛이 남았어요', 'Not ripe yet — it’s still greenish'], ['조금만 더 — 끝까지 빨개지면 따요', 'Almost — wait till it’s red all over'], ['너무 익어 물렀어요. 빨개지면 바로 따요', 'Too ripe, it went soft. Pick as soon as it turns red']],
  shiitake: ['m', '🍄', ['갓이 넓게 핀 표고만 눌러요 — 작은 봉오리는 더 자라요', 'Tap only shiitake with open caps — tiny buttons need to grow'], ['아직 작아요 — 갓이 더 펴질 때까지', 'Too small — wait till the cap opens'], ['조금만 더 — 갓이 넓게 펴지면 따요', 'Almost — wait till the cap spreads wide'], ['너무 오래 둬서 시들었어요. 갓이 펴지면 바로 따요', 'Left too long, it wilted. Pick as soon as the cap opens']],
};
const CSS = `
.twn-play .mg{display:flex;flex-direction:column;gap:6px;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.twn-play .pb.mg-end .mg{opacity:.55;transition:opacity .2s}
.twn-play .mg .dim{opacity:.35}
.twn-play .dots{display:flex;gap:6px;justify-content:center}
.twn-play .dots i{width:14px;height:14px;border-radius:7px;background:#e7efe3;border:2px solid #c9d6c4}
.twn-play .dots i.g{background:#7fd06a;border-color:#2b5a3a}
.twn-play .dots i.m{background:#f6d3cf;border-color:#e0453a}
.twn-play .pgb{height:10px}
.twn-play .pg{position:absolute;left:0;top:0;bottom:0;width:100%;background:#2b5a3a;transform-origin:0 50%;transform:scaleX(0)}
.twn-play .rg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.twn-play .rg .rt{position:relative;min-height:58px;padding:0;border-radius:12px;background:#eef5ea;color:#1d2b3a;font-size:34px;line-height:1;border:2px solid #d5e2cf}
.twn-play .rg .rt .rf{display:inline-block;transition:transform .35s,filter .35s,opacity .3s}
.twn-play .rg .rt em{position:absolute;left:6px;top:4px;font-size:11px;font-style:normal;font-weight:700;color:#56606b}
.twn-play .rg .rt.sel{border-color:#2b5a3a;box-shadow:inset 0 0 0 2px #2b5a3a}
.twn-play .rg .rt.e .rf{opacity:.14;transform:scale(.35);filter:grayscale(1)}
.twn-play .rg .rt.o .rf{filter:sepia(.7) brightness(.55) saturate(.8);transform:scale(.86)}
.twn-play .pb .mglad{margin:2px 0 4px;font-size:13px;font-weight:800;color:#7a4a12}
.twn-play .pb .mgrec{margin:6px auto 0;max-width:92%;padding:5px 10px;border:2px solid #2b2420;border-radius:10px;background:#fff8ea;box-shadow:0 2px 0 #2b2420;color:#2b2420;font-size:14px;font-weight:800;line-height:1.35;text-align:center}
.twn-play .pb .mgrec div+div{font-size:13px;font-weight:700;color:#7a4a12}
.twn-play .pb .mgrec.neu{border-color:#c98a0b;background:#ffefb0}
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
.twn-play .fpk{display:flex;flex-direction:column;gap:6px}.twn-play .fpk .tide{font-weight:700;font-size:13px;padding:5px 8px;border-radius:8px;background:#e3f1fb;border:2px solid #9cc7e6}.twn-play .fpk .tide.lo{background:#f3ead6;border-color:#cdb68a}
.twn-play .fpk .bx3 button{min-height:54px}.twn-play .fpk .bx3 button small{font-size:11px;color:#56606b}.twn-play .fpk .dpt{display:block;width:70%;background:#6fb3e0;border-radius:3px 3px 0 0;margin:2px auto 0}
.twn-play .tug{position:relative;height:150px;border-radius:12px;background:#7fc3ea;box-shadow:inset 0 24px 0 #cdeefa;overflow:hidden;touch-action:none;cursor:ew-resize}
.twn-play .tug.dim .tf,.twn-play .tug.dim .ta{opacity:0}.twn-play .tug svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.twn-play .tug .tf{position:absolute;left:50%;top:70%;font-size:30px;font-style:normal;line-height:1;transform:translate(-50%,-50%);transition:opacity .2s}
.twn-play .tug .ta{position:absolute;left:50%;top:70%;font-size:15px;font-weight:800;color:#e0453a;transform:translate(-50%,-190%);white-space:nowrap}
.twn-play .tug .fl{position:absolute;left:50%;top:14%;width:12px;height:18px;margin-left:-6px;border-radius:6px;background:linear-gradient(#e0453a 50%,#fffdf6 50%);border:2px solid #1d2b3a;will-change:transform}
.twn-play .tug:not(.dim) .fl{opacity:0}.twn-play .tug .wd{position:absolute;right:8px;top:4px;font-size:12px;font-weight:800;font-style:normal;color:#1d2b3a}
.twn-play .tgb{height:14px}.twn-play .tgb::before{content:'';position:absolute;left:84%;top:0;bottom:0;right:0;background:#f6d3cf}.twn-play .tgb .tgf{position:absolute;left:0;top:0;bottom:0;width:100%;background:#7fd06a;transform-origin:0 50%;transform:scaleX(0)}.twn-play .tgb.hi .tgf{background:#e0453a}.twn-play .tgb.md .tgf{background:#f2c84b}
.twn-play .mg.fpick .tug,.twn-play .mg.fpick .tgb,.twn-play .mg.fpick .tlab,.twn-play .mg.fpick .pgb,.twn-play .mg.fpick .tlr{display:none}
.twn-play .tlab{display:flex;justify-content:space-between;font-size:11px;color:#56606b;margin:-3px 2px 0}
.twn-play .spr{display:flex;gap:12px;align-items:center;justify-content:center}
.twn-play .mat{position:relative;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(5,1fr);width:min(200px,56vw);aspect-ratio:1;border:4px solid #8a6a44;border-radius:4px;background:repeating-linear-gradient(90deg,#d8bf86 0 6px,#bfa064 6px 8px);touch-action:none;cursor:crosshair}
.twn-play .mat i{display:block;transition:background-color .15s}.twn-play .mat i.t{background:rgba(47,62,40,.35)}.twn-play .mat i.g{background:#2f3e28}.twn-play .mat i.k{background:#1f2a1b}.twn-play .mat i.l{background:#10160d;box-shadow:inset 0 0 0 3px #4a5c3e;border-radius:35%}
.twn-play .mat i.x{outline:3px dashed #e0453a;outline-offset:-4px}
.twn-play .mat .scp{position:absolute;left:0;top:0;width:20%;height:20%;box-sizing:border-box;border:3px solid #fffdf6;border-radius:50%;box-shadow:0 0 0 2px #1d2b3a;pointer-events:none;transition:transform .08s}.twn-play .mat.on .scp{background:rgba(47,62,40,.55)}
.twn-play .bowl{flex:none;display:flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:50%;background:#efe6cf;border:4px solid #8a6a44}.twn-play .bowl .bw{width:46px;height:46px;border-radius:50%;background:#2f3e28;transition:transform .2s}
.twn-play .oys{position:relative;height:170px;border-radius:12px;background:#7fc3ea;box-shadow:inset 0 22px 0 #cdeefa;overflow:hidden;touch-action:none}
.twn-play .oys .rp{position:absolute;left:0;right:0;top:20px;height:3px;background:#b08a5e}.twn-play .oys .dl{position:absolute;left:50%;top:22px;width:2px;height:34px;margin-left:-1px;background:#b08a5e;transition:opacity .2s}
.twn-play .oys .zl,.twn-play .oys .zr{position:absolute;top:23px;bottom:0;width:21%;font-style:normal}.twn-play .oys .zl{left:0;background:rgba(36,98,160,.35);border-right:2px dashed #fffdf6}.twn-play .oys .zr{right:0;background:#d9b27a;border-left:3px solid #9c7650}
.twn-play .oys .zl em,.twn-play .oys .zr em{position:absolute;left:0;right:0;bottom:4px;text-align:center;font-size:12px;font-weight:800;font-style:normal;color:#1d2b3a}
.twn-play .oys .bk{position:absolute;left:8%;right:8%;bottom:24px;display:flex;flex-wrap:wrap-reverse;justify-content:center;gap:2px}.twn-play .oys .bk b{width:22px;height:15px;border-radius:58% 42% 55% 45%/50% 60% 40% 50%;background:#b9b2a3;box-shadow:inset 0 -3px 0 #8f887a;opacity:0;transform:scale(.4);transition:opacity .25s,transform .25s}.twn-play .oys .bk b.on{opacity:1;transform:scale(1)}
.twn-play .oys .oy{position:absolute;left:50%;top:44%;width:64px;height:46px;margin:-23px 0 0 -32px;transition:left .45s,top .45s,opacity .45s;cursor:grab;touch-action:none}.twn-play .oys .oy.drag{transition:none}.twn-play .oys .oy.dn{top:12%;opacity:0;transition:none}.twn-play .oys .oy.gl,.twn-play .oys .oy.gr{top:72%;opacity:0}.twn-play .oys .oy.no{animation:twn-mg-shake .35s}
.twn-play .oys .oy.up{z-index:3}.twn-play .oys .sh{display:block;width:100%;height:100%;border-radius:58% 42% 55% 45%/50% 60% 40% 50%;background:repeating-radial-gradient(ellipse at 30% 35%,#cfc8b8 0 4px,#aaa293 4px 7px);box-shadow:inset 0 -6px 0 #857e70,0 0 0 2px #6f685c;transition:transform .3s}
.twn-play .oys .rg2{position:absolute;left:50%;top:84%;width:64px;height:64px;margin:-40px 0 0 -40px;border:8px solid #e3b23c;border-radius:50%;box-shadow:0 0 0 2px #1d2b3a,inset 0 0 0 2px #1d2b3a;transition:left .35s,top .35s,transform .35s;cursor:grab;touch-action:none;z-index:2}
.twn-play .oys .rg2::after{content:'';position:absolute;left:50%;top:100%;width:8px;height:26px;margin:6px 0 0 -4px;border-radius:4px;background:#8a6a44}.twn-play .oys .rg2.drag{transition:none}.twn-play .oys .rg2.stop,.twn-play .oys .rg2.pass{pointer-events:none}.twn-play .oys .rg2.pass{transform:translateY(50px)}.twn-play .oys .rg2.stop{animation:twn-mg-bump .3s}
@keyframes twn-mg-bump{40%{transform:translateY(5px)}}
.twn-play .olr button{flex:1;min-height:46px;font-size:15px;touch-action:none}
.twn-play .tlr button{flex:1;min-height:46px;font-size:15px;touch-action:none}.twn-play .tlr button.on{background:#2b5a3a;color:#fffdf6}
.twn-play .sky b,.twn-play .scn .wxl{position:absolute;left:8px;top:2px;font-size:12px;font-weight:900;color:#2b2420;background:rgba(255,253,246,.85);padding:0 6px;border-radius:6px}.twn-play .scn .wxl{top:6px}
.twn-play .sky{position:relative;height:22px;border-radius:8px;border:2px solid #2b2420;overflow:hidden;background:#bfe3f7}.twn-play .sky i{position:absolute;right:10px;top:2px;width:14px;height:14px;border-radius:50%;background:#f6c544}
.twn-play .sky.cloud{background:#c9d1d8}.twn-play .sky.cloud i{background:#eef1f4;width:44px;border-radius:8px}.twn-play .sky.rain{background:repeating-linear-gradient(105deg,#8796a3 0 3px,#a9b5bf 3px 9px)}.twn-play .sky.snow{background:radial-gradient(#fff 1.5px,transparent 2px) 0 0/10px 10px,#aab6c0}.twn-play .sky.rain i,.twn-play .sky.snow i{display:none}
.twn-play .mat2 i.t{background:rgba(47,62,40,.42)}.twn-play .mat2 i.g{background:#2f3e28}.twn-play .mat2 i.k{background:#121a0e;box-shadow:inset 0 0 0 3px #55683f;border-radius:30%}.twn-play .mat2.sub i.t{background:rgba(47,62,40,.64)}.twn-play .mat2.sub i.k{background:#1d2818;box-shadow:inset 0 0 0 2px #3b4a2f;border-radius:16%}
.twn-play .spn{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:#efe6cf;border:4px solid #8a6a44}.twn-play .spn b{font-size:24px;line-height:1}.twn-play .spn small{font-size:11px}
.twn-play .row.dry3,.twn-play .row.spd{justify-content:center}.twn-play .row.dry3 button{flex:1;min-width:0;padding:8px 6px;font-size:14px}.twn-play .row.dry3 button.sel{outline:3px solid #2b5a3a;outline-offset:1px}
.twn-play .hv{position:relative;height:178px;border-radius:12px;background:#cfe6b4;border:2px solid #2b2420;overflow:hidden;touch-action:none}
.twn-play .hv .hive{position:absolute;left:50%;top:50%;width:46px;height:38px;margin:-19px 0 0 -23px;background:#e9c46a;border:3px solid #7a4a12;border-radius:6px;box-shadow:inset 0 -9px 0 #d4a73f,inset 0 9px 0 #f2d58a}.twn-play .hv .hdoor{position:absolute;background:#3a2a14;border-radius:2px}
.twn-play .hv .pole{position:absolute;left:14%;top:22%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#5a4632;z-index:1}.twn-play .hv .flag{position:absolute;left:14%;top:22%;width:0;height:0;transform-origin:0 0}.twn-play .hv .flag i{position:absolute;left:0;top:-8px;width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-left:28px solid #e0453a}
.twn-play .hv .spot{position:absolute;transform:translate(-50%,-50%);min-height:0;padding:5px 10px;font-size:15px;font-weight:900;color:#2b2420;border-radius:10px;background:#fffdf6;border:2px solid #2b2420;box-shadow:0 2px 0 #2b2420}.twn-play .hv .spot.sel{background:#ffe7a3}
.twn-play .hv .puff{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(240,240,240,.92);box-shadow:10px 4px 0 rgba(225,225,225,.85);opacity:0;transition:left 1.1s ease-out,top 1.1s ease-out,opacity 1.1s ease-in;pointer-events:none}
.twn-play .hv .hive.bz::before,.twn-play .hv .hive.bz::after{content:'• • •';position:absolute;left:-16px;top:-20px;font-size:14px;letter-spacing:4px;color:#2b2420;animation:twn-bz .5s infinite alternate}.twn-play .hv .hive.bz::after{left:22px;top:32px;animation-delay:.25s}
@keyframes twn-bz{to{transform:translate(6px,-5px)}}
.twn-play .gd.comb .gc.bee::after{content:'•••';position:absolute;left:0;right:0;top:28%;width:auto;height:auto;border-radius:0;background:none;font-size:15px;line-height:1;letter-spacing:1px;color:#2b2420;text-align:center;animation:twn-bz .4s infinite alternate}
.twn-play .scn.tr2{height:104px;background:#cfe9f6}.twn-play .scn.tr2.cloud{background:#d6dde3}.twn-play .scn.tr2.rain{background:repeating-linear-gradient(105deg,#93a2ae 0 3px,#b8c3cc 3px 10px)}.twn-play .scn.tr2.snow{background:radial-gradient(#fff 1.5px,transparent 2px) 0 0/10px 10px,#b5c0c9}
.twn-play .scn.tr2 .sun{position:absolute;right:12px;top:8px;width:18px;height:18px;border-radius:50%;background:#f6c544;display:none}.twn-play .scn.tr2.clear .sun{display:block}.twn-play .scn .sap.wl{filter:grayscale(.7) sepia(.6);transform:translateX(-50%) rotate(28deg)}
.twn-play .scn .fh{position:absolute;left:68%;bottom:20%;width:8%;height:13%;border-radius:0 0 40% 40%;box-shadow:inset 0 0 0 2px #3a2a1a;opacity:0}.twn-play .scn.fhon .fh{opacity:1}
.twn-play .bx3.dp button{padding:4px;min-height:0;background:#cfe9f6}.twn-play .bx3.dp svg{display:block;margin:0 auto;width:auto;height:92px}.twn-play .bx3.pick button small{font-weight:800}
.twn-play .bx3.wt .cups{display:flex;gap:3px;justify-content:center;align-items:flex-end;height:24px}.twn-play .bx3.wt .cups i{width:14px;height:20px;border:2px solid #2b2420;border-top:none;border-radius:0 0 4px 4px;background:linear-gradient(transparent 30%,#6fb3e0 30%)}.twn-play .bx3.wt .cups em{font-style:normal;font-size:14px;color:#56606b}
`;
function css() { if (document.getElementById('twn-mg-css')) return; const s = document.createElement('style'); s.id = 'twn-mg-css'; s.textContent = CSS; document.head.appendChild(s); }
const rnd = (a, b) => a + Math.random() * (b - a);
const setCls = (el, c) => { if (el.className !== c) el.className = c; };
const pop = (el, c) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };   // 일이 생길 때만(매 프레임 X)

// ── JUDGE-1 판단 놀이 공용(사용자 10-25 '막대기 놀이 싫어 · 적지 않은 스트레스를 받아 가며 성취') — 꿀·나무·김: 꾹·초록 칸 X · 세상(바람·흙·하늘)을 보고 고름 · 틀리면 시간이 들거나(기다림) 결과가 남음(나무 = 다음 날 시듦)
//   c.x = 마을이 주는 오늘 자료(town.js judgeX): { wind(바람이 가는 쪽 0~7 · 0 = 북), windy, rain, snow, cloudy, rainY(어제 비), day, mem(저장 칸), key(일터), mark() } · 없으면(시험·다른 길) 그 자리에서 정함
const DIR8 = [['북', 'N'], ['북동', 'NE'], ['동', 'E'], ['남동', 'SE'], ['남', 'S'], ['남서', 'SW'], ['서', 'W'], ['북서', 'NW']];
const d8 = (a, b) => { const d = (((a - b) % 8) + 8) % 8; return d > 4 ? 8 - d : d; };   /* 여덟 방위 사이 걸음 수(0~4) */
const jx = c => (c.x && typeof c.x === 'object' ? c.x : {});
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = a[i]; a[i] = a[j]; a[j] = q; } return a; };
const skyOf = x => (x.snow ? 'snow' : x.rain ? 'rain' : x.cloudy ? 'cloud' : 'clear');
const SKYN = { clear: ['오늘 하늘: 맑음', 'Sky: clear'], cloud: ['오늘 하늘: 흐림', 'Sky: cloudy'], rain: ['오늘 하늘: 비', 'Sky: rain'], snow: ['오늘 하늘: 눈', 'Sky: snow'] };

// ① 김 펴기(JUDGE-1 · 10-25 붓기 꾹 → 고르게 펴기 판단): 첫 반죽을 부은 발장(5×5)에 얇은 곳·구멍·두꺼운 곳이 섞여 있음 → 칸을 눌러 한 숟갈씩 더하거나(얇은 곳·구멍) 두꺼운 곳에서 덜어 옴 · 숟갈 수는 한정
//   한 번 누름 = 한 숟갈(누르는 시간은 판정에 안 씀) · 알맞은 칸에 부으면 두꺼워짐(다시 눌러 덜 수 있지만 시간이 듦) · 다 고르면 저절로, 아니면 「다 폈어요」
//   다 편 장은 하늘을 보고 말릴 자리를 고름: 맑음 = 마당 건조대(햇볕·바람) · 비·눈 = 처마 밑(비를 피하고 바람은 통함) · 창고 안 = 바람이 안 통해 잘 안 마름 · 도전 3칸부터 흐린 날 = 비 오기 전에 처마 밑
//   틀린 자리 = 다시 걷어 옮기느라 기다림(시간 비용) · 세 장을 정해진 시간 안에 · 점수 = 고르게 편 장 수 · 사다리 = 두꺼운 칸 수(덜어 써야 함) · 숟갈 여유 2 → 1 → 0 → 0 · 4칸은 두께 차이가 흐리게 보임
//   입력 = 칸 누르기 · 화살표 + E·스페이스(한 숟갈) · Enter(다 폈어요) · 말리기 = 단추 · 1~3 · ← → + E
const DRY3 = [['마당 건조대', 'Yard drying rack'], ['처마 밑', 'Under the eaves'], ['창고 안', 'Inside the shed']];
function mkSpread(c) {
  const C9 = 5, N = 25, X = jx(c), lv = c.lv, TK = c.lp == null ? 0 : c.lp | 0, SLK = [2, 1, 0, 0][lv - 1], BAD = c.zw > 1.1 ? 1 : 0, NS = 3, sky = skyOf(X);
  c.mg.innerHTML = '<div class="sky ' + sky + '"><i></i><b>' + c.T(SKYN[sky][0], SKYN[sky][1]) + '</b></div><div class="spr"><div class="mat mat2' + (lv >= 4 ? ' sub' : '') + '">' + '<i></i>'.repeat(N) + '<b class="scp"></b></div><div class="spn"><b class="bn">0</b><small>' + c.T('숟갈', 'spoons') + '</small></div></div><div class="dots">' + '<i></i>'.repeat(NS) + '</div>'
    + '<div class="row dry3">' + DRY3.map((d, i) => '<button class="sub" data-d="' + i + '">' + (i + 1) + '. ' + c.T(d[0], d[1]) + '</button>').join('') + '</div><div class="row spd"><button class="sub dn">' + c.T('다 폈어요', 'Done') + '</button></div>';
  const TB = timeBar(c, 40 * c.zw);
  const mat = c.mg.querySelector('.mat'), B = mat.querySelectorAll('i'), scp = mat.querySelector('.scp'), bn = c.mg.querySelector('.bn'), dots = c.mg.querySelectorAll('.dots i'), dry = c.mg.querySelector('.dry3'), spd = c.mg.querySelector('.spd');
  const h = new Int8Array(N), CL = ['', 't', 'g', 'k'];   /* 구멍(발장이 보임) · 얇음 · 알맞음 · 두꺼움 */
  let ph = 'spread', cur = 12, bowl = 0, sheet = 0, good = 0, lock = 0, jt = 0, mis = 0, dsel = 0, dErr = 0;
  const paint = () => { for (let i = 0; i < N; i++) { const q = CL[h[i]]; if (B[i].className !== q) B[i].className = q; } bn.textContent = String(bowl); };
  const moveTo = i => { cur = i; scp.style.transform = 'translate(' + (i % C9) * 100 + '%,' + ((i / C9) | 0) * 100 + '%)'; };
  const markD = () => { dry.querySelectorAll('button').forEach((b, i) => b.classList.toggle('sel', i === dsel)); };
  const fresh = () => { ph = 'spread'; h.fill(2); const idx = shuf([...Array(N).keys()]), nh = 2 + (Math.random() < 0.5 ? 1 : 0), nt = 3 + ((Math.random() * 2) | 0); let p = 0, need = 0;
    for (let k = 0; k < nh; k++) { h[idx[p++]] = 0; need += 2; } for (let k = 0; k < nt; k++) { h[idx[p++]] = 1; need += 1; } for (let k = 0; k < TK; k++) h[idx[p++]] = 3;
    bowl = Math.max(0, need - TK + SLK); paint(); moveTo(12); dry.style.display = 'none'; spd.style.display = ''; mat.dataset.ph = 'spread';
    c.say(sheet > 0 ? c.T('새 발장이에요. 두께를 잘 봐요', 'A fresh mat. Look at the thickness') : TK ? c.T('얇은 곳·구멍엔 한 숟갈씩 붓고, 두꺼운 곳은 눌러서 덜어 와요', 'Add a spoon to thin spots and holes. Tap thick spots to scoop some back') : c.T('얇은 곳과 구멍을 눌러 한 숟갈씩 부어요. 구멍은 두 숟갈이에요', 'Tap thin spots and holes to add a spoon. Holes need two')); };
  const even = () => { for (let i = 0; i < N; i++) if (h[i] !== 2) return false; return true; };
  const tap = i => { if (ph !== 'spread' || c.done) return; moveTo(i); if (lock > 0) return;
    if (h[i] >= 3) { h[i]--; bowl++; c.snd('tick'); c.say(c.T('두꺼운 곳에서 한 숟갈 덜었어요', 'Scooped a spoon from a thick spot')); }
    else if (bowl <= 0) { c.snd('pop'); lock = 0.5; c.say(TK ? c.T('숟갈이 비었어요. 두꺼운 곳에서 덜어 와요', 'Your spoon is empty. Scoop from a thick spot') : c.T('반죽이 떨어졌어요. 다 됐으면 「다 폈어요」를 눌러요', 'No mix left. Press Done when you finish')); }
    else { const was = h[i]; h[i]++; bowl--; c.snd('pick'); if (was === 2) { mis++; c.say(c.T('여기는 알맞았는데 두꺼워졌어요. 눌러서 다시 덜 수 있어요', 'That spot was fine and now it is thick. Tap it to scoop back')); } else c.say(h[i] === 2 ? c.T('알맞아졌어요', 'Just right now') : c.T('아직 얇아요', 'Still thin')); }
    paint(); if (even()) { ph = 'judge0'; jt = 0.4; } };
  const judge = () => { let thin = 0, thick = 0; for (let i = 0; i < N; i++) { if (h[i] < 2) { thin++; B[i].classList.add('x'); } else if (h[i] > 2) { thick++; B[i].classList.add('x'); } }
    const ok = thin + thick <= BAD; if (ok) good++; dots[sheet].className = ok ? 'g' : 'm'; c.snd(ok ? 'ding' : 'pop');
    ph = 'dry'; dsel = 0; spd.style.display = 'none'; dry.style.display = ''; markD(); mat.dataset.ph = 'dry';
    c.say((ok ? c.T('고르게 폈어요! ', 'Nice and even! ') : thin ? c.T('얇은 곳이 남았어요. 마르면 구멍이 나요. ', 'Thin spots are left. They tear when dry. ') : c.T('두꺼운 곳이 남았어요. 잘 안 말라요. ', 'Thick spots are left. They dry slowly. ')) + c.T('하늘을 보고 말릴 곳을 골라요', 'Look at the sky and pick where to dry it')); };
  const dryOk = i => (sky === 'rain' || sky === 'snow' ? i === 1 : sky === 'cloud' ? (lv >= 3 ? i === 1 : i <= 1) : i === 0);
  const dryPick = i => { if (ph !== 'dry' || c.done || lock > 0) return; dsel = i; markD();
    if (dryOk(i)) { c.snd('ding'); sheet++; ph = 'next'; jt = 1.1; dry.style.display = 'none';
      c.say(i === 0 ? c.T('햇볕과 바람에 잘 마르겠어요', 'Sun and wind will dry it well') : sky === 'cloud' ? c.T('비 오기 전에 처마 밑에 널었어요. 바람은 통해요', 'Hung under the eaves before the rain. The air still moves') : c.T('비를 피해 처마 밑에 널었어요. 바람은 통해요', 'Out of the rain under the eaves. The air still moves')); return; }
    dErr++; c.snd('pop'); lock = 2.6 / c.zw;
    c.say(i === 2 ? c.T('창고 안은 바람이 안 통해 잘 안 말라요. 다시 꺼내요…', 'No air moves in the shed, so it will not dry. Taking it out again…') : i === 0 ? (sky === 'cloud' ? c.T('구름이 짙어요. 곧 비가 올 것 같아 다시 걷어요…', 'Dark clouds. Rain is coming, so we take it in again…') : c.T('비에 젖어요! 서둘러 걷어요…', 'It is getting wet! Hurry and take it in…')) : c.T('처마 밑은 그늘이라 맑은 날엔 더디게 말라요. 옮겨요…', 'Under the eaves it is shady. On a sunny day it dries slowly. Moving it…')); };
  const submit = () => { if (ph !== 'spread' || lock > 0 || c.done) return; judge(); };
  const cellAt = e => { const r = mat.getBoundingClientRect(), x = Math.max(0, Math.min(C9 - 1, ((e.clientX - r.left) / r.width * C9) | 0)), y = Math.max(0, Math.min(C9 - 1, ((e.clientY - r.top) / r.height * C9) | 0)); return y * C9 + x; };
  const pd = e => { const d = e.target.closest('[data-d]'); if (d) { e.preventDefault(); dryPick(+d.dataset.d); return; } if (e.target.closest('.dn')) { e.preventDefault(); submit(); return; } if (e.target.closest('.mat')) { e.preventDefault(); tap(cellAt(e)); } };
  c.mg.addEventListener('pointerdown', pd);
  fresh();
  return { cnt: () => good,
    down() { if (ph === 'spread') tap(cur); else if (ph === 'dry') dryPick(dsel); },
    key(code, rep) { if (code === 'Enter') { if (!rep) submit(); return true; } const d = /^Digit([1-3])$/.exec(code); if (d) { if (!rep && ph === 'dry') dryPick(+d[1] - 1); return true; }
      const mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -C9, KeyW: -C9, ArrowDown: C9, KeyS: C9 }[code]; if (!mv) return false;
      if (ph === 'dry') { if (Math.abs(mv) === 1) { dsel = (dsel + mv + 3) % 3; markD(); } return true; } if (ph !== 'spread') return true;
      const n = cur + mv; if (n < 0 || n >= N || (Math.abs(mv) === 1 && ((n / C9) | 0) !== ((cur / C9) | 0))) return true; moveTo(n); return true; },
    tick(dt) { if (lock > 0 && (lock -= dt) <= 0) { lock = 0; if (ph === 'dry') c.say(c.T('어디에 말릴까요?', 'Where should it dry?')); }
      if (TB.tick(dt)) { ph = 'end'; c.finish(good); return; }
      if (ph === 'judge0' && (jt -= dt) <= 0) judge();
      else if (ph === 'next' && (jt -= dt) <= 0) { if (sheet >= NS) { ph = 'end'; c.finish(good); } else fresh(); } },
    get dbg() { return { ph, h: Array.from(h), bowl, sheet, good, lock: +lock.toFixed(2), sky, dryOk: [0, 1, 2].filter(dryOk), mis, dErr, TK, lv, left: +TB.left.toFixed(2) }; },
    dispose() { c.mg.removeEventListener('pointerdown', pd); } };
}

// ② 굴 크기 재기(GAUGE-1 · 10-24 옛 막대 정리 · 타이밍 막대 X): 줄에 달린 굴이 하나씩 올라오면 고리 자를 대 봄 — 쏙 지나가면 아직 작은 굴(바다로 돌려보냄 ◀) · 턱 걸리면 다 큰 굴(바구니 ▶)
//   크기가 비슷해 보이는 굴이 섞여 있어 재 봐야 앎 · 잘못 고르면 그 굴이 잠깐 흔들리고 다시 고름(벌 X · 처음에 맞힌 수 = 점수) · 바구니에 큰 굴이 쌓임
//   입력 = 고리를 끌어 굴에 대기 · 굴을 누르면 고리가 날아가 잼 · 굴을 왼쪽·오른쪽으로 끌기 · ◀ ▶ 단추 · E·스페이스·↑↓ = 재기 · ← → A D = 고르기 · 솜씨(zw) = 크기 차이가 커지고 시간이 늘어남
function mkGauge(c) {
  const N = 6, zw = c.zw, T = 26 * zw * (c.lp || 1), OYS = [];
  { const big = [1, 1, 1, 0, 0, 0]; for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = big[i]; big[i] = big[j]; big[j] = q; }
    const g = 0.06 * (zw - 1); for (let i = 0; i < N; i++) { const near = i % 2 === 0; OYS.push({ big: !!big[i], s: big[i] ? (near ? rnd(1.12, 1.18) : rnd(1.24, 1.34)) + g : (near ? rnd(0.8, 0.86) : rnd(0.64, 0.74)) - g }); } }   /* 반은 크기가 비슷해 보임(재 봐야 앎) */
  c.mg.innerHTML = '<div class="oys"><i class="rp"></i><i class="zl"><em>' + c.T('바다', 'Sea') + '</em></i><i class="zr"><span class="bk">' + '<b></b>'.repeat(3) + '</span><em>' + c.T('바구니', 'Basket') + '</em></i><i class="dl"></i>'
    + '<div class="oy"><i class="sh"></i></div><i class="rg2"></i></div><div class="row olr"><button class="sub ol">◀ ' + c.T('바다로', 'To the sea') + '</button><button class="sub or">' + c.T('바구니로', 'To the basket') + ' ▶</button></div>';
  const q = s9 => c.mg.querySelector(s9), box = q('.oys'), oy = q('.oy'), sh = q('.sh'), ring = q('.rg2'), dl = q('.dl'), bL = q('.ol'), bR = q('.or'), BK = box.querySelectorAll('.bk b');
  let i = 0, ok = 0, put = 0, inBk = 0, cur = OYS[0], ph = 'look', tRing = 0, tNext = 0, t = 0, measured = false, dragR = false, dragO = false, x0 = 0, y0 = 0, rect = null;
  const setOy = (lf, cl) => { oy.className = 'oy' + (cl ? ' ' + cl : ''); oy.style.left = lf + '%'; };
  const ringHome = () => { ring.className = 'rg2'; ring.style.left = '50%'; ring.style.top = '84%'; };
  const show = () => { cur = OYS[i]; measured = false; ph = 'look'; box.dataset.ph = 'look'; box.dataset.i = i; delete box.dataset.m; sh.style.transform = 'scale(' + cur.s.toFixed(2) + ')'; setOy(50, 'dn'); void oy.offsetWidth; setOy(50, ''); dl.style.opacity = '1'; ringHome();
    c.say(i === 0 ? c.T('고리를 굴에 대 봐요. 쏙 지나가면 작은 굴, 턱 걸리면 큰 굴이에요 (끌기 · E로 재기)', 'Hold the ring to the oyster. Slips over = small, gets stuck = big (drag · E to measure)') : c.T('다음 굴이 올라왔어요. 고리를 대 봐요', 'Here comes the next oyster. Try the ring')); };
  const measure = () => { if (ph !== 'look' || c.done) return; ph = 'meas'; box.dataset.ph = 'meas'; measured = true; ring.className = 'rg2'; ring.style.left = '50%'; ring.style.top = '44%'; tRing = 0.4; c.snd('tick'); };
  const ringResult = () => { if (cur.big) { ring.className = 'rg2 stop'; oy.classList.add('up'); c.say(c.T('턱 걸려요! 다 큰 굴이에요. 바구니로 ▶', 'It gets stuck! A grown oyster. To the basket ▶')); box.dataset.m = 'big'; }
    else { ring.className = 'rg2 pass'; c.say(c.T('쏙 지나가요! 아직 작은 굴이에요. 바다로 ◀', 'It slips over! Still small. Back to the sea ◀')); box.dataset.m = 'small'; } ph = 'look'; box.dataset.ph = 'look'; c.snd('pick'); tRing = -1; };
  const sort = side => { if (c.done || (ph !== 'look' && ph !== 'meas')) return; if (ph === 'meas') ringResult(); const good = (side === 1) === cur.big;
    if (!good) { cur.tries = (cur.tries | 0) + 1; setOy(50, measured && cur.big ? 'up' : ''); pop(oy, 'no'); c.snd('pop'); c.say(measured ? (cur.big ? c.T('고리에 걸렸던 굴이에요. 다 컸으니 바구니로 ▶', 'The ring got stuck on this one. It is grown, so basket ▶') : c.T('고리가 지나갔던 굴이에요. 작은 굴은 더 자라게 바다로 ◀', 'The ring slipped over this one. Small oysters go back to grow ◀')) : c.T('눈으로는 헷갈려요. 고리를 대 보고 골라요', 'Hard to tell by eye. Try the ring first')); return; }
    if (!cur.tries) ok++; put++; ph = 'out'; box.dataset.ph = 'out'; setOy(side ? 89 : 11, side ? 'gr' : 'gl'); dl.style.opacity = '0'; ringHome(); c.snd(side ? 'pick' : 'tick');
    if (side && inBk < BK.length) BK[inBk++].className = 'on';
    c.say(side ? c.T('큰 굴을 바구니에 담았어요', 'A big oyster in the basket') : c.T('작은 굴은 바다로 퐁! 더 자라렴', 'Plop! Back to the sea to grow')); tNext = 0.7; };
  const score = () => (ok >= 6 ? 3 : ok >= 4 ? 2 : ok >= 2 ? 1 : 0);
  const frac = e => { if (!rect) rect = box.getBoundingClientRect(); return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]; };
  const pdR = e => { if (ph !== 'look') return; e.preventDefault(); e.stopPropagation(); rect = box.getBoundingClientRect(); dragR = true; ring.className = 'rg2 drag'; if (ring.setPointerCapture) try { ring.setPointerCapture(e.pointerId); } catch (er) { /* 옛 브라우저 */ } };
  const pdO = e => { if (ph !== 'look') return; e.preventDefault(); rect = box.getBoundingClientRect(); dragO = true; x0 = e.clientX; y0 = e.clientY; oy.classList.add('drag'); if (measured) ringHome(); if (oy.setPointerCapture) try { oy.setPointerCapture(e.pointerId); } catch (er) { /* 옛 브라우저 */ } };
  const pm = e => { if (dragR) { const [x, y] = frac(e); ring.style.left = (Math.max(0.05, Math.min(0.95, x)) * 100).toFixed(1) + '%'; ring.style.top = (Math.max(0.1, Math.min(0.95, y)) * 100).toFixed(1) + '%'; }
    else if (dragO) { const dx = (e.clientX - x0) / rect.width; oy.style.left = (50 + Math.max(-40, Math.min(40, dx * 100))).toFixed(1) + '%'; } };
  const pu = e => { if (dragR) { dragR = false; const [x, y] = frac(e); rect = null; if (Math.hypot(x - 0.5, (y - 0.44) * 0.6) < 0.16) measure(); else ringHome(); return; }
    if (dragO) { dragO = false; oy.classList.remove('drag'); const px = e.clientX - x0, dx = px / rect.width, dy = e.clientY - y0; rect = null; if (dx < -0.2) sort(0); else if (dx > 0.2) sort(1); else { setOy(50, ''); if (Math.abs(px) < 8 && Math.abs(dy) < 8) measure(); } } };
  const pdL = e => { e.preventDefault(); sort(0); }, pdRt = e => { e.preventDefault(); sort(1); };
  ring.addEventListener('pointerdown', pdR); oy.addEventListener('pointerdown', pdO); addEventListener('pointermove', pm); addEventListener('pointerup', pu); bL.addEventListener('pointerdown', pdL); bR.addEventListener('pointerdown', pdRt);
  show();
  return { go: c.T('고리 대기', 'Use the ring'), cnt: () => ok,
    down() { measure(); },
    key(code, rep) { if (rep) return /^(Arrow|Key[WASD])/.test(code); if (code === 'ArrowLeft' || code === 'KeyA') { sort(0); return true; } if (code === 'ArrowRight' || code === 'KeyD') { sort(1); return true; } if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') { measure(); return true; } return false; },
    tick(dt) { t += dt;
      if (tRing > 0 && (tRing -= dt) <= 0) ringResult();
      if (ph === 'out' && (tNext -= dt) <= 0) { i++; if (i >= N) { ph = 'end'; box.dataset.ph = 'end'; c.finish(score()); return; } show(); }
      if (t > T && ph !== 'end') { ph = 'end'; box.dataset.ph = 'end'; c.say(c.T('배가 돌아갈 시간이에요', 'Time to head back')); c.finish(score()); } },
    dispose() { ring.removeEventListener('pointerdown', pdR); oy.removeEventListener('pointerdown', pdO); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); bL.removeEventListener('pointerdown', pdL); bR.removeEventListener('pointerdown', pdRt); } };
}

// ②-1 줄 당기기 낚시(FISH-2 · 차례표 12줄 · town_jobs2.md 「🎣 줄 낚시」 · 타이밍 막대 X): 고르기(물때·자리·미끼) → 찌를 보며 기다림 → 걸리면 물고기가 당기는 반대쪽으로 끌기(← → · 물 위 끌기 · 단추)
//   줄 칸(장력)은 이어지는 손맛 — 물고기가 세게 당길 때 같이 세게 끌면 빨개지고 오래 빨가면 줄이 풀림(살살) · 때 맞춰 누르기·틈 맞춰 감기 X
//   꼬임(c.x.lv · 안에서만 셈): 1 잔잔한 날 작은 고기(고르기 없음) → 2 큰 고기(방향이 자주 바뀌고 세게 당김 · 미끼 고르기) → 3 물때 맞추기(자리도 고름) → 4 바람(줄이 한쪽으로 밀림)
//   c.x = { lv, low(썰물), dex, seed, n(던지는 수 · 기본 3), fish(정해진 고기 = 도구 낚싯대), wind, after(점수, 기록) → 판 뒤 한 줄 }
function mkTug(c) {
  const X = c.x || {}, lv = Math.max(1, Math.min(4, X.lv | 0 || 1)), N = X.n || 3, low = !!X.low, zw = c.zw, best = fishBest(c.sea, low);
  const pickSp = !X.fish && lv >= 3, pickBt = !X.fish && lv >= 2, wind = lv >= 4 ? (X.wind || (Math.random() < 0.5 ? -0.3 : 0.3)) : 0;
  let spot = best.spot, bait = best.bait;
  const L2 = a => a[c.en ? 1 : 0], tideT = L2(FISH_FACT[low ? 'low' : 'high']);
  c.mg.innerHTML = '<div class="fpk"' + (pickSp || pickBt ? '' : ' style="display:none"') + '><div class="tide' + (low ? ' lo' : '') + '">' + (low ? '🏖 ' : '🌊 ') + tideT + '</div>'
    + (pickSp ? '<div class="bx3 fsp"><button data-sp="near"><i class="dpt" style="height:8px"></i>' + c.T('가까운 얕은 물', 'Shallow water nearby') + '<small>' + c.T('물가 바로 앞', 'right by the shore') + '</small></button><button data-sp="deep"><i class="dpt" style="height:26px"></i>' + c.T('방파제 끝 깊은 물', 'Deep water at the pier end') + '<small>' + c.T('발밑이 깊어요', 'deep below') + '</small></button></div>' : '')
    + (pickBt ? '<div class="bx3 fbt"><button data-bt="worm"><i>〰</i>' + c.T('갯지렁이', 'Lugworm') + '<small>' + c.T('바닥을 기어요', 'crawls on the bottom') + '</small></button><button data-bt="shrimp"><i>🦐</i>' + c.T('새우', 'Shrimp') + '<small>' + c.T('물속을 떠다녀요', 'drifts in the water') + '</small></button></div><div class="sm">' + L2(FISH_FACT.bait) + '</div>' : '') + '</div>'
    + '<div class="tug dim"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><line class="ln" x1="50" y1="0" x2="50" y2="14" stroke="#1d2b3a" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><i class="fl"></i><i class="tf">🐟</i><b class="ta"></b>' + (wind ? '<em class="wd">' + (wind > 0 ? c.T('바람 →', 'wind →') : c.T('← 바람', '← wind')) + '</em>' : '') + '</div>'
    + '<div class="bar tgb dim"><i class="tgf"></i></div><div class="tlab"><span>' + c.T('줄 칸', 'Line') + '</span><span>' + c.T('빨간 칸 = 살살!', 'Red = ease off!') + '</span></div>'
    + '<div class="bar pgb dim"><i class="pg"></i></div><div class="row tlr"><button class="sub tl">◀ ' + c.T('왼쪽으로', 'Left') + '</button><button class="sub tr">' + c.T('오른쪽으로', 'Right') + ' ▶</button></div>'
    + (N > 1 ? '<div class="dots">' + '<i></i>'.repeat(N) + '</div>' : '');
  const q = s9 => c.mg.querySelector(s9), fpk = q('.fpk'), tug = q('.tug'), ln = q('.ln'), fl = q('.fl'), tf = q('.tf'), ta = q('.ta'), tgb = q('.tgb'), tgf = q('.tgf'), pgb = q('.pgb'), pg = q('.pg'), bL = q('.tl'), bR = q('.tr'), dots = c.mg.querySelectorAll('.dots i');
  let ph = pickSp || pickBt ? 'pick' : 'wait', tw = 0, t = 0, tt = 0, cast = 0, cur = null, s = 1, k = 0.3, a = 0, prog = 0, ten = 0, strain = 0, flipT = 0, surgeT = 0, surge = 0, zeroT = 0, gap = 0, pv = 0, pp = 0, tailT = '';
  let drag = false, kl = false, kr = false, hl = false, hr = false, hiSaid = false, lastS = 0, lastT = -1;
  const ST = { caught: [], slips: 0, wrong: 0, empty: 0, lv, spot, bait, low, wind: wind !== 0 };
  const selSync = () => { for (const b9 of c.mg.querySelectorAll('[data-sp]')) b9.classList.toggle('sel', b9.dataset.sp === spot); for (const b9 of c.mg.querySelectorAll('[data-bt]')) b9.classList.toggle('sel', b9.dataset.bt === bait); };
  const goVis = on => { if (c.go) c.go.style.visibility = on ? '' : 'hidden'; };
  const begin = () => { ph = 'wait'; ST.spot = spot; ST.bait = bait; cur = X.fish ? { f: X.fish, fit: true, why: '' } : fishAt(c.sea, low, spot, bait, X.dex, (X.seed | 0) + cast * 3);
    tw = !cur.f ? 2.4 : cur.fit ? rnd(1.2, 2.2) : rnd(3.0, 4.2); setCls(tug, 'tug dim'); setCls(tgb, 'bar tgb dim'); setCls(pgb, 'bar pgb dim'); fpk.style.display = 'none'; c.mg.classList.remove('fpick'); goVis(false); tug.dataset.ph = 'wait';
    c.say(cur.f && !cur.fit ? c.T('찌를 보며 기다려요… 입질이 늦네요', 'Watch the float… the bites are slow') : c.T('찌를 보며 기다려요…', 'Watch the float and wait…')); };
  const hook = () => { ph = 'tug'; const big = cur.f.big != null ? cur.f.big : 0.3; k = lv === 1 ? 0.3 : 0.32 + 0.45 * big; s = Math.random() < 0.5 ? -1 : 1; a = 0; prog = 0.15; ten = 0.2; strain = 0; tt = 0; zeroT = 0; surge = 0; surgeT = rnd(1.5, 3); hiSaid = false; lastS = 0;
    flipT = lv === 1 ? rnd(3.5, 5) : rnd(1.6, 3) * (1.2 - big * 0.4); setCls(tug, 'tug'); setCls(tgb, 'bar tgb'); setCls(pgb, 'bar pgb'); tug.dataset.ph = 'tug'; c.snd('tick');
    c.say(c.T('걸렸어요! 물고기가 당기는 반대쪽으로 끌어요 (← →)', 'Hooked! Pull the opposite way to the fish (← →)')); };
  const done = () => { const sc = N === 1 ? (ST.caught.length ? 3 : 0) : ST.caught.length; ph = 'end'; tug.dataset.ph = 'end'; tailT = X.after ? X.after(sc, ST) || '' : ''; c.finish(sc); };
  const endCast = got => { if (dots[cast]) dots[cast].className = got ? 'g' : 'm'; cast++; c.snd(got ? 'ding' : 'pop'); if (cast >= N) { done(); return; } ph = 'gap'; gap = 1.1; tug.dataset.ph = 'gap'; };
  const pk = e => { const b9 = e.target.closest('button'); if (!b9 || ph !== 'pick') return; if (b9.dataset.sp) spot = b9.dataset.sp; if (b9.dataset.bt) bait = b9.dataset.bt; c.snd('tick'); selSync(); };
  fpk.addEventListener('click', pk);
  const P = e => { const r = tug.getBoundingClientRect(); return Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.3))); };
  const pd = e => { if (ph !== 'tug' && ph !== 'wait') return; e.preventDefault(); drag = true; pp = P(e); if (tug.setPointerCapture) try { tug.setPointerCapture(e.pointerId); } catch (er) { /* 옛 브라우저 */ } };
  const pm = e => { if (drag) pp = P(e); }, pu = () => { drag = false; pp = 0; };
  tug.addEventListener('pointerdown', pd); tug.addEventListener('pointermove', pm); tug.addEventListener('pointerup', pu); tug.addEventListener('pointercancel', pu);
  const hb = (el, f) => { const on = e => { e.preventDefault(); f(true); el.classList.add('on'); }, off = () => { f(false); el.classList.remove('on'); }; el.addEventListener('pointerdown', on); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, off); return [on, off]; };
  const HL = hb(bL, v => { hl = v; }), HR = hb(bR, v => { hr = v; });
  const ku = e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') kl = false; else if (e.code === 'ArrowRight' || e.code === 'KeyD') kr = false; }, kb = () => { kl = kr = hl = hr = drag = false; pp = 0; };
  addEventListener('keyup', ku); addEventListener('blur', kb);
  if (ph === 'pick') { selSync(); c.mg.classList.add('fpick'); tug.dataset.ph = 'pick'; c.say(pickSp ? c.T('물때를 보고 자리와 미끼를 골라 던져요', 'Check the tide, pick a spot and bait, then cast') : c.T('미끼를 골라 던져요', 'Pick a bait, then cast')); } else begin();
  return { go: c.T('🎣 던지기', '🎣 Cast'), extra: () => ST, tail: () => tailT, cnt: () => ST.caught.length,
    down() { if (ph === 'pick') { c.snd('pop'); begin(); } },
    up() { kl = kr = false; },
    key(code) { if (ph === 'pick') { if (code === 'Digit1' || code === 'Digit2') { if (pickSp) spot = code === 'Digit1' ? 'near' : 'deep'; else bait = code === 'Digit1' ? 'worm' : 'shrimp'; selSync(); return true; } if ((code === 'Digit3' || code === 'Digit4') && pickSp) { bait = code === 'Digit3' ? 'worm' : 'shrimp'; selSync(); return true; } return false; }
      if (code === 'ArrowLeft' || code === 'KeyA') { kl = true; return true; } if (code === 'ArrowRight' || code === 'KeyD') { kr = true; return true; } return false; },
    tick(dt) { t += dt;
      if (ph === 'pick' || ph === 'end') return;
      if (ph === 'gap') { if ((gap -= dt) <= 0) begin(); return; }
      if (ph === 'wait') { fl.style.transform = 'translateY(' + (Math.sin(t * 2.6) * 2).toFixed(1) + 'px)';
        if ((tw -= dt) <= 0) { if (cur.f) { fl.style.transform = 'translateY(9px)'; hook(); return; }
          ST.empty++; c.say(L2(FISH_FACT[cur.why]) + (pickSp ? c.T(' — 자리를 바꿔 볼까요?', ' — try another spot?') : '')); c.snd('pop'); if (dots[cast]) dots[cast].className = 'm'; cast++; if (cast >= N) { done(); return; }
          if (pickSp || pickBt) { ph = 'pick'; tug.dataset.ph = 'pick'; fpk.style.display = ''; c.mg.classList.add('fpick'); goVis(true); selSync(); } else { ph = 'gap'; gap = 1.4; } }
        return; }
      tt += dt; const big = cur.f.big != null ? cur.f.big : 0.3;
      if ((flipT -= dt) <= 0) { s = -s; flipT = lv === 1 ? rnd(3.5, 5) : rnd(1.6, 3) * (1.2 - big * 0.4); }
      if (lv >= 2) { if (surge > 0) surge -= dt; else if ((surgeT -= dt) <= 0) { surge = 0.9; surgeT = rnd(2, 4); } }
      const kk = k + (surge > 0 ? 0.35 + 0.3 * big : 0) + 0.05 * Math.sin(t * 3.1), p0 = Math.max(-1, Math.min(1, (kr ? 1 : 0) - (kl ? 1 : 0) + (hr ? 1 : 0) - (hl ? 1 : 0) + (drag ? pp : 0)));
      pv += (p0 - pv) * Math.min(1, dt * 8); const pe = pv + wind, opp = -pe * s, o1 = Math.max(0, Math.min(1, opp));   /* opp > 0 = 물고기 반대쪽으로 끎 */
      prog = Math.min(1, prog + ((opp > 0 ? 0.21 * o1 * (1.15 - 0.55 * kk) * zw : 0) - 0.06 * kk * (1 - o1) - (opp < 0 ? 0.1 * Math.min(1, -opp) : 0)) * dt);
      if (opp < -0.2) ST.wrong += dt;
      ten += (Math.min(1, 0.12 + 0.8 * o1 * (0.3 + kk)) - ten) * Math.min(1, dt * 5);
      if (ten > 0.84) { strain += dt; if (!hiSaid) { hiSaid = true; c.say(c.T('줄이 팽팽해요! 살살 끌어요', 'The line is tight! Ease off')); } if (strain > 1.0) { strain = 0; prog -= 0.2; ST.slips++; c.snd('buzz'); c.say(c.T('줄이 풀렸어요 — 빨간 칸에선 살살 끌어요', 'The line slipped — ease off in the red')); } }
      else { strain = Math.max(0, strain - dt * 1.5); if (ten < 0.7) hiSaid = false; }
      a = Math.max(-1, Math.min(1, a + (s * kk * 0.7 - pe * 0.5) * dt));
      if (s !== lastS) { lastS = s; ta.textContent = s < 0 ? '◀◀' : '▶▶'; tug.dataset.s = s; tf.style.transform = 'translate(-50%,-50%) scaleX(' + (s < 0 ? 1 : -1) + ')';
        if (lv <= 2 && !hiSaid) c.say(s < 0 ? c.T('◀ 물고기가 왼쪽으로 당겨요 — 오른쪽으로 끌어요', '◀ The fish pulls left — pull right') : c.T('▶ 물고기가 오른쪽으로 당겨요 — 왼쪽으로 끌어요', '▶ The fish pulls right — pull left')); }
      const fx = 50 + a * 38, fy = 88 - Math.max(0, prog) * 66; tf.style.left = ta.style.left = fx.toFixed(1) + '%'; tf.style.top = ta.style.top = fy.toFixed(1) + '%';
      ln.setAttribute('x1', (50 + pv * 14).toFixed(1)); ln.setAttribute('x2', fx.toFixed(1)); ln.setAttribute('y2', fy.toFixed(1));
      tgf.style.transform = 'scaleX(' + ten.toFixed(3) + ')'; setCls(tgb, ten > 0.84 ? 'bar tgb hi' : ten > 0.7 ? 'bar tgb md' : 'bar tgb'); pg.style.transform = 'scaleX(' + Math.max(0, prog).toFixed(3) + ')';
      { const t2 = Math.round(ten * 20); if (t2 !== lastT) { lastT = t2; tug.dataset.t = t2 / 20; } }   /* 시험 봇이 읽는 줄 칸(바뀔 때만) */
      if (prog >= 1) { ST.caught.push(cur.f.id); c.say(c.T('낚았어요! ', 'Caught! ') + L2(cur.f.t) + (N > 1 ? ' ' + (cast + 1) + '/' + N : '')); endCast(true); return; }
      if (prog <= 0) { if ((zeroT += dt) > 2.5) { c.say(c.T('물고기가 줄을 풀고 달아났어요 — 물고기 반대쪽으로 끌어요', 'It got away — pull the opposite way to the fish')); endCast(false); return; } } else zeroT = 0;
      if (tt > 18) { c.say(c.T('물고기가 바위 틈으로 숨었어요 — 다음 고기를 기다려요', 'It hid among the rocks — wait for the next one')); endCast(false); } },
    dispose() { removeEventListener('keyup', ku); removeEventListener('blur', kb); fpk.removeEventListener('click', pk); tug.removeEventListener('pointerdown', pd); tug.removeEventListener('pointermove', pm); tug.removeEventListener('pointerup', pu); tug.removeEventListener('pointercancel', pu);
      for (const [el, H] of [[bL, HL], [bR, HR]]) { el.removeEventListener('pointerdown', H[0]); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.removeEventListener(ev, H[1]); } goVis(true); } };
}

// ③ 익은 것만 고르기(딸기·배·표고·배추): 아홉 칸에 익은 것·덜 익은 것이 섞여 나옴(덜 익은 것은 시간이 지나면 익음) → 익은 것만 누르기 · 덜 익은 걸 누르면 '아직 안 익었어요'(관찰) · 딴 수 − 잘못 누른 수로 점수
function mkRipe(c) {
  const R = RIPE[c.k] || RIPE.strawberry, T = 15 * c.zw, N = 9, RT = c.lp || 0;   /* LADDER-2: RT = 익은 뒤 무르기까지 초(1칸 = 무르지 않음) */
  let h = '<div class="rg" data-c="' + R[0] + '">'; for (let i = 0; i < N; i++) h += '<button class="rt u" data-i="' + i + '"><span class="rf">' + R[1] + '</span><em>' + (i + 1) + '</em></button>'; h += '</div><div class="bar tmb"><i class="tm"></i></div>';
  c.mg.innerHTML = h; const rg = c.mg.querySelector('.rg'), B = rg.querySelectorAll('.rt'), tm = c.mg.querySelector('.tm'), st = new Array(N).fill('u'), age = new Array(N).fill(0);
  let sel = 4, left = T, rip = 0, none = 0, P = 0, M = 0;
  const draw = i => setCls(B[i], 'rt ' + st[i] + (i === sel ? ' sel' : ''));
  const grow = (a, b, amin) => { let k = -1, n = 0; for (let i = 0; i < N; i++) if (st[i] === a && age[i] >= amin) { n++; if (Math.random() * n < 1) k = i; } if (k >= 0) { st[k] = b; age[k] = 0; draw(k); } return k; };   // a 단계 가운데 하나를 골라 b로(따로 배열 X)
  { const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8]; for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = idx[i]; idx[i] = idx[j]; idx[j] = q; } for (let i = 0; i < 3; i++) { st[idx[i]] = 'r'; st[idx[i + 3]] = 'h'; } age.fill(1); for (let i = 0; i < N; i++) draw(i); }
  const pick = i => { if (c.done || i < 0 || i >= N) return; if (sel !== i) { const o = sel; sel = i; draw(o); } if (st[i] === 'r') { st[i] = 'e'; age[i] = 0; P++; draw(i); c.snd('pick'); c.say(c.T('똑! ', 'Pick! ') + P + c.T('개 땄어요', ' picked')); }
    else if (st[i] === 'u' || st[i] === 'h') { M++; draw(i); pop(B[i], 'no'); c.snd('pop'); c.say(R[st[i] === 'h' ? 4 : 3][c.en ? 1 : 0]); }
    else if (st[i] === 'o') { draw(i); pop(B[i], 'no'); c.snd('pop'); c.say(R[5][c.en ? 1 : 0]); } };   /* 무른 것 = 틀림 셈 X(한 줄만) */
  const onPd = e => { const b = e.target.closest('.rt'); if (!b) return; e.preventDefault(); pick(+b.dataset.i); }; rg.addEventListener('pointerdown', onPd);
  if (c.go) c.go.style.display = 'none';   /* 칸을 바로 누름(큰 단추 없음) · 키보드 = 숫자 1~9 또는 화살표 + E */
  c.say(R[2][c.en ? 1 : 0]);
  return { go: '', cnt: () => P,
    down() { pick(sel); },
    key(code, rep) { const d = /^(Digit|Numpad)([1-9])$/.exec(code); if (d) { if (!rep) pick(+d[2] - 1); return true; }
      const mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -3, KeyW: -3, ArrowDown: 3, KeyS: 3 }[code]; if (!mv) return false; const n = sel + mv; if (n < 0 || n >= N || (Math.abs(mv) === 1 && ((n / 3) | 0) !== ((sel / 3) | 0))) return true; const o = sel; sel = n; draw(o); draw(n); return true; },
    tick(dt) { left -= dt; tm.style.transform = 'scaleX(' + Math.max(0, left / T).toFixed(3) + ')'; let nr = 0;
      for (let i = 0; i < N; i++) { age[i] += dt; if (st[i] === 'e' && age[i] > 1.4) { st[i] = 'u'; age[i] = 0; draw(i); } else if (st[i] === 'r') { if (RT && age[i] > RT) { st[i] = 'o'; age[i] = 0; draw(i); } else nr++; } else if (st[i] === 'o' && age[i] > 0.9) { st[i] = 'u'; age[i] = 0; draw(i); } }   /* LADDER-2: 익은 채 오래 두면 무름(짙어졌다가 0.9초 뒤 새 열매 자리) */
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
function mkPlant(c) { const C9 = 10, N = 20, MARK = i => (i % C9) % 2 === 1, T = 20 * c.zw * (c.lp || 1); let good = 0, bad = 0;
  c.mg.innerHTML = '<div class="rope">' + '<i></i>'.repeat(C9) + '</div>' + gridHTML(C9, N, 'paddy') + '<div class="rope">' + '<i></i>'.repeat(C9) + '</div>';
  c.mg.querySelectorAll('.rope i').forEach((e, i) => { if (i % 2 === 1) e.className = 'k'; });   /* 못줄 눈금(빨강) = 두 칸마다 */
  const gd = c.mg.querySelector('.gd'), TB = timeBar(c, T), st = new Array(N).fill(0);
  const plant = i => { if (c.done || st[i]) return; if (MARK(i)) { st[i] = 1; good++; G.B[i].className = 'gc on'; G.B[i].textContent = '🌱'; c.snd('pick'); c.say(c.T('꾹! 고른 간격 ', 'Planted evenly ') + good + '/10'); if (good >= 10) c.finish(bad <= 1 ? 3 : bad <= 3 ? 2 : 1); }
    else { st[i] = 2; bad++; G.B[i].className = 'gc off'; G.B[i].textContent = '🌱'; c.snd('pop'); c.say(c.T('삐뚤어요 — 빨간 눈금 바로 밑에 심어요', 'Off the mark — plant right under the red marks')); } G.mark(); }, G = gridCtl(gd, C9, N, plant, { sel: 1 });
  c.say(c.T('못줄의 빨간 눈금 바로 밑에 모를 꾹꾹 (누르거나 화살표와 E)', 'Plant under each red mark on the rope (tap · arrows+E)'));
  return { go: c.T('꾹 심기', 'Plant'), cnt: () => good, down() { plant(G.sel); }, key: code => G.key(code), tick(dt) { if (TB.tick(dt)) { const s = good - bad; c.finish(s >= 9 ? 3 : s >= 6 ? 2 : s >= 3 ? 1 : 0); } }, dispose: () => G.dispose() }; }

// ⑤ 벼 베기(가을 논): 콤바인 길 그리기 — 벤 곳은 다시 못 지나감(한 붓 그리기) · 끌기·누르기(옆 칸)·화살표 · 빈틈없이 다 베면 아주 잘함
function mkCut(c) { const C9 = 6, R9 = 4, N = C9 * R9, T = 22 * c.zw * (c.lp || 1); let cur = 0, cut = 1, stuck = false;
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
  return { go: '', cnt: () => cut, key(code, rep) { const d = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -C9, KeyW: -C9, ArrowDown: C9, KeyS: C9 }[code]; if (d == null) return false; if (rep) return true; const j = cur + d; if (j >= 0 && j < N) go(j); return true; }, down() {},
    tick(dt) { if (TB.tick(dt) && !stuck) c.finish(score()); }, dispose() { gd.removeEventListener('pointerdown', pd); removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); } }; }

// ⑥ 소금 = town_salt.js(SALT-2 꼬임 넷 · 천일염·자염·토판염·꽃소금)

// ⑦ 꿀 뜨기(JUDGE-1 · 10-25 연기 꾹·초록 칸 → 바람과 벌 판단): ① 깃발(오늘 바람 · 깃발이 날리는 쪽 = 바람이 가는 쪽)을 보고 벌통 둘레 어디에 서서 연기를 피울지 고름
//   바람을 등지고 서야(바람이 불어오는 쪽) 연기가 바람을 타고 벌통으로 감 · 벌통 문 앞은 벌이 드나드는 길이라 피함 · 틀린 자리 = 연기가 비껴가고 벌이 흩어져 가라앉을 때까지 기다림(시간 비용 · 쏘임·아픔 X)
//   ② 벌이 차분해지면 밀랍 뚜껑 덮인 칸만 뜸 — 벌이 잔뜩 모인 칸(꿈틀거리는 점)은 피함(벌은 몇 초마다 옆 칸으로 옮겨 감) · 벌 칸·덜 익은 칸·애벌레 방 = 잠깐 손이 멈춤
//   사다리 = 벌 무리 수(2~5) · 2칸부터 벌통 문 · 3칸부터 여덟 자리 + 도중에 바람이 바뀜(다시 서기) · 같은 날도 판마다 바람이 조금 흔들리고 칸·벌 자리가 다름 · 정해진 시간 안에 뚜껑 칸을 다 뜨면 끝
//   입력 = 자리·칸 누르기 · ← → 자리 돌리기(↑ 북 · ↓ 남) + E·스페이스 · 칸 = 화살표 + E(누르는 시간은 판정에 안 씀)
function mkComb(c) { const C9 = 6, N = 24, X = jx(c), lv = c.lv, NB = Math.max(1, c.lp == null ? 2 : c.lp | 0), MV = [3.2, 2.8, 2.4, 2.0][lv - 1] * c.zw, SP = lv >= 3 ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 2, 4, 6];
  const kinds = shuf(Array.from({ length: N }, (_, i) => (i % 3 === 0 ? 'cap' : i % 3 === 1 ? 'open' : 'brood'))), NC = N / 3, got = new Uint8Array(N), bees = [];
  let ph = 'stand', wr = 0, up = 4, door = -1, sel = 0, lock = 0, right = 0, err = 0, mvT = MV, turned = false, G = null, nx = null;
  c.mg.innerHTML = '<div class="cbw"></div>'; const W9 = c.mg.querySelector('.cbw'), TB = timeBar(c, 34 * c.zw);
  const setWind = k => { wr = ((k % 8) + 8) % 8; if (lv < 3) wr = (Math.round(wr / 2) * 2) % 8; up = (wr + 4) % 8; };   /* 1·2칸 = 네 방위로 맞춤(자리가 넷) · 깃발 = 위에서 본 깃대(점) + 바람이 가는 쪽으로 날리는 천 */
  const okSpot = s => s !== door && d8(s, up) <= (lv >= 3 ? 1 : 0);
  const pickDoor = () => { if (lv < 2) { door = -1; return; } if (lv >= 3 && up % 2 === 0 && Math.random() < 0.4) { door = up; return; } const o = [0, 2, 4, 6].filter(q => q !== up); door = o[(Math.random() * o.length) | 0]; };   /* 3칸부터 바람이 오는 쪽에 문이 있으면 비스듬히 서야 함 */
  setWind((X.wind != null ? X.wind | 0 : (Math.random() * 8) | 0) + ((Math.random() * 3) | 0) - 1); pickDoor();   /* 오늘 바람 + 판마다 조금 흔들림 */
  const pos = (k, r) => [50 + Math.sin(k * Math.PI / 4) * r, 50 - Math.cos(k * Math.PI / 4) * r];
  const doorCss = () => (door < 0 ? 'display:none' : door === 0 ? 'left:30%;top:-6px;width:40%;height:6px' : door === 2 ? 'right:-6px;top:30%;width:6px;height:40%' : door === 4 ? 'left:30%;bottom:-6px;width:40%;height:6px' : 'left:-6px;top:30%;width:6px;height:40%');
  const markS = () => { W9.querySelectorAll('.spot').forEach(b => b.classList.toggle('sel', +b.dataset.p === SP[sel])); };
  const stand = () => { ph = 'stand'; if (G) { G.dispose(); G = null; } sel = 0;
    let h9 = '<div class="hv"><i class="hive"><i class="hdoor" style="' + doorCss() + '"></i></i><i class="pole"></i><i class="flag" style="transform:rotate(' + (wr * 45 - 90) + 'deg)"><i></i></i><i class="puff"></i>';
    for (const s of SP) { const [x, y] = pos(s, 40); h9 += '<button class="spot" data-p="' + s + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + DIR8[s][c.en ? 1 : 0] + '</button>'; }
    W9.innerHTML = h9 + '</div>'; markS(); };
  const choose = s => { if (ph !== 'stand' || c.done || lock > 0) return; sel = Math.max(0, SP.indexOf(s)); markS();
    const [x, y] = pos(s, 40), v = wr * Math.PI / 4, pf = W9.querySelector('.puff'), hv = W9.querySelector('.hive');   /* 연기 = 고른 자리에서 바람 따라 흘러감(맞으면 벌통 위로) */
    pf.style.transition = 'none'; pf.style.left = x + '%'; pf.style.top = y + '%'; pf.style.opacity = '1'; void pf.offsetWidth; pf.style.transition = ''; pf.style.left = (x + Math.sin(v) * 44) + '%'; pf.style.top = (y - Math.cos(v) * 44) + '%'; pf.style.opacity = '0';
    if (okSpot(s)) { c.snd('ding'); lock = 1.1; nx = 'comb'; c.say(c.T('바람을 등지고 섰어요. 연기가 바람을 타고 벌통으로 가요. 벌이 차분해져요', 'Your back is to the wind. The smoke rides the wind into the hive. The bees calm down')); return; }
    err++; c.snd('pop'); lock = 3.2 / c.zw; hv.classList.add('bz');
    c.say(s === door ? c.T('벌통 문 앞이에요. 벌이 드나드는 길을 막아 벌이 놀랐어요. 가라앉을 때까지 기다려요…', 'That is the hive door. You blocked the bees’ path and they got upset. Wait for them to settle…')
      : d8(s, wr) <= 1 ? c.T('바람이 벌통 쪽에서 나에게 불어요. 연기가 벌통에서 멀어졌어요. 벌이 가라앉을 때까지 기다려요…', 'The wind blows from the hive to you, so the smoke went away from it. Wait for the bees to settle…')
      : c.T('연기가 바람에 옆으로 비껴갔어요. 벌이 가라앉을 때까지 기다려요…', 'The wind pushed the smoke off to the side. Wait for the bees to settle…')); };
  const free = pref => { const o = []; for (let i = 0; i < N; i++) if (!got[i] && !bees.includes(i) && (!pref || kinds[i] === 'cap')) o.push(i); return o; };
  const spot1 = () => { let o = Math.random() < 0.6 ? free(true) : []; if (!o.length) o = free(false); return o.length ? o[(Math.random() * o.length) | 0] : -1; };   /* 벌은 꿀 칸에 잘 모임 */
  const paintBees = () => { if (G) for (let i = 0; i < N; i++) G.B[i].classList.toggle('bee', bees.includes(i)); };
  const moveBees = () => { for (let b = 0; b < bees.length; b++) { const i = bees[b], x = i % C9, y = (i / C9) | 0, nb = []; if (x > 0) nb.push(i - 1); if (x < C9 - 1) nb.push(i + 1); if (y > 0) nb.push(i - C9); if (y < N / C9 - 1) nb.push(i + C9);
      const o = nb.filter(j => !bees.includes(j) && !got[j]); if (!o.length) continue; const cp = o.filter(j => kinds[j] === 'cap'), L = cp.length && Math.random() < 0.55 ? cp : o; bees[b] = L[(Math.random() * L.length) | 0]; } paintBees(); };
  const toComb = () => { ph = 'comb'; W9.innerHTML = gridHTML(C9, N, 'comb'); G = gridCtl(W9.querySelector('.gd'), C9, N, i => cell(i)); for (let i = 0; i < N; i++) G.B[i].className = 'gc ' + kinds[i] + (got[i] ? ' got' : '');
    if (!bees.length) for (let k = 0; k < NB; k++) { const i = spot1(); if (i >= 0) bees.push(i); } paintBees(); G.mark(); mvT = MV;
    c.say(c.T('밀랍 뚜껑이 덮인 칸만 떠요. 벌이 모인 칸은 피해요', 'Take only the wax-capped cells. Stay away from cells crowded with bees')); };
  const score = () => (right >= NC ? (err <= 1 ? 3 : err <= 4 ? 2 : 1) : right / NC >= 0.6 ? 1 : 0);
  const cell = i => { if (c.done || ph !== 'comb' || got[i]) return; if (lock > 0) { c.say(c.T('벌이 가라앉기를 기다려요…', 'Waiting for the bees to settle…')); return; }
    if (bees.includes(i)) { err++; lock = 2.4 / c.zw; c.snd('pop'); pop(G.B[i], 'no'); const j = spot1(); if (j >= 0) bees[bees.indexOf(i)] = j; paintBees(); c.say(c.T('벌이 잔뜩 모인 칸이에요. 벌이 날아올라 옆으로 옮겨 가요. 잠깐 기다려요…', 'That cell is crowded with bees. They fly up and move over. Wait a moment…')); return; }
    const k = kinds[i];
    if (k !== 'cap') { err++; lock = 0.9; c.snd('pop'); pop(G.B[i], 'no'); c.say(k === 'open' ? c.T('아직 덜 익은 꿀이에요. 뚜껑이 덮일 때까지 기다려요', 'Not ripe yet. Wait until it is capped') : c.T('여기는 애벌레 방이에요. 그대로 둬요', 'That is a baby-bee cell. Leave it')); return; }
    got[i] = 1; right++; G.B[i].className = 'gc cap got'; G.mark(); paintBees(); c.snd('pick'); c.say(c.T('뚜껑 덮인 칸, 다 익은 꿀! ', 'Capped: ripe honey! ') + right + '/' + NC);
    if (right >= NC) { ph = 'end'; c.finish(score()); return; }
    if (lv >= 3 && !turned && right >= Math.ceil(NC / 2)) { turned = true; setWind(wr + (Math.random() < 0.5 ? 1 : -1) * (2 + (Math.random() < 0.5 ? 1 : 0))); lock = 1.4; nx = 'stand'; ph = 'turn';
      c.say(c.T('바람이 바뀌었어요! 연기가 날려 가 벌들이 깨어나요. 깃발을 다시 보고 서요', 'The wind changed! The smoke blew away and the bees wake up. Check the flag and stand again')); } };
  const pd = e => { const b = e.target.closest('.spot'); if (b) { e.preventDefault(); choose(+b.dataset.p); } };
  c.mg.addEventListener('pointerdown', pd);
  stand(); c.say(lv === 1 ? c.T('깃발은 바람이 가는 쪽으로 날려요. 바람을 등지고 서서 연기를 피워요', 'The flag flies the way the wind goes. Stand with your back to the wind and puff smoke') : c.T('깃발을 보고 연기를 피울 자리를 골라요', 'Check the flag and pick where to puff smoke'));
  return { cnt: () => right,
    down() { if (ph === 'stand') choose(SP[sel]); else if (ph === 'comb' && G) cell(G.sel); },
    key(code) { if (ph === 'stand') { const L = SP.length, m = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code]; if (m) { sel = (sel + m + L) % L; markS(); return true; } if (code === 'ArrowUp' || code === 'KeyW') { sel = 0; markS(); return true; } if (code === 'ArrowDown' || code === 'KeyS') { sel = SP.indexOf(4); markS(); return true; } return false; }
      return G ? G.key(code) : false; },
    tick(dt) { if (TB.tick(dt)) { ph = 'end'; c.finish(score()); return; }
      if (lock > 0 && (lock -= dt) <= 0) { lock = 0; const hv = W9.querySelector('.hive.bz'); if (hv) hv.classList.remove('bz');
        if (nx === 'comb') { nx = null; toComb(); } else if (nx === 'stand') { nx = null; stand(); } else if (ph === 'stand') c.say(c.T('벌이 가라앉았어요. 깃발을 보고 다시 골라요', 'The bees settled. Check the flag and pick again')); else if (ph === 'comb') c.say(c.T('다시 골라요', 'Pick again')); }
      if (ph === 'comb' && (mvT -= dt) <= 0) { mvT = MV * (0.8 + Math.random() * 0.4); moveBees(); } },
    get dbg() { return { ph, wind: wr, up, door, spots: SP.slice(), ok: SP.filter(okSpot), kinds: kinds.slice(), bees: bees.slice(), got: Array.from(got), lock: +lock.toFixed(2), right, err, NC, lv, NB, turned, left: +TB.left.toFixed(2) }; },
    dispose() { c.mg.removeEventListener('pointerdown', pd); if (G) G.dispose(); } }; }

// ⑧ 캐기(감자 = 줄기 둘레 · 조개 = 작은 숨구멍 두 개 밑): 단서를 보고 흙 파기 — 삽질 수가 정해져 있음(찾기)
function mkDig(c) { const clam = c.k === 'clam', C9 = 7, N = 28, ND = (clam ? 8 : 10) + (c.zw > 1.1 ? 2 : 0) - (c.lp | 0);   /* LADDER-2: 흙이 단단할수록 삽질 수가 줄어듦(4칸에도 찾을 수보다 많음) */ let digs = ND, found = 0; const hide = new Array(N).fill(0), clue = new Array(N).fill('');
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
  return { go: c.T('여기 파기', 'Dig here'), cnt: () => found, down() { dig(G.sel); }, key: code => G.key(code), tick() {}, dispose: () => G.dispose() }; }

// ⑨ 배추 나누기: 하나씩 나오는 배추를 크기대로 작은·중간·큰 상자에(끌어다 놓기 · 상자 누르기 · ←↓→ · 1·2·3) — 눈으로 견주기(셈 X)
function mkSort(c) { const N = 8, T = 20 * c.zw, SQ = 1 - (c.lp || 0), SZ = [[0.6, 0.76], [0.92, 1.06], [1.26, 1.42]].map(q => q.map(v => 1 + (v - 1) * SQ));   /* LADDER-2: 칸이 오를수록 크기가 가운데로 모임(비슷한 배추) */ let i = 0, ok = 0, cur = 0, sc = 1;
  c.mg.innerHTML = '<div class="cab"><i class="cb">🥬</i><b class="cn"></b></div><div class="bx3 srt">' + [[0.8, 34, 26, 15, c.T('작은 상자', 'Small')], [1, 50, 38, 22, c.T('중간 상자', 'Medium')], [1.3, 68, 52, 31, c.T('큰 상자', 'Large')]].map((q, n) => '<button data-b="' + n + '" style="flex:' + q[0] + '"><span class="crt" style="width:' + q[1] + 'px;height:' + q[2] + 'px"><i style="font-size:' + q[3] + 'px">🥬</i></span>' + q[4] + '</button>').join('') + '</div>';   /* 아이 눈 2차 '상자 셋 크기가 비슷해 보여요': 상자 폭·나무 상자 그림 크기를 다르게(작은 상자 = 큰 상자의 반쯤) */
  const cb = c.mg.querySelector('.cb'), cn = c.mg.querySelector('.cn'), bx = c.mg.querySelector('.bx3'), TB = timeBar(c, T);
  const show = () => { cur = (Math.random() * 3) | 0; const [a, b] = SZ[cur]; sc = a + Math.random() * (b - a); cb.style.transform = 'scale(' + sc.toFixed(2) + ')'; cn.textContent = (i + 1) + '/' + N; };
  const put = b => { if (c.done) return; const good = b === cur; if (good) { ok++; c.snd('tick'); c.say(c.T('맞아요! ', 'Right! ') + ok + '/' + N); } else { c.snd('pop'); c.say(c.T('크기를 다시 견줘 봐요 — 상자 그림과 나란히', 'Compare sizes again — next to the box pictures')); } i++; if (i >= N) c.finish(ok >= N ? 3 : ok >= 6 ? 2 : ok >= 4 ? 1 : 0); else show(); };
  let dragB = false; const pdC = e => { e.preventDefault(); dragB = true; cb.classList.add('dr'); }, pu = e => { if (!dragB) return; dragB = false; cb.classList.remove('dr'); const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('[data-b]'); if (b && bx.contains(b)) put(+b.dataset.b); };
  const pdB = e => { const b = e.target.closest('[data-b]'); if (!b) return; e.preventDefault(); put(+b.dataset.b); };
  cb.addEventListener('pointerdown', pdC); addEventListener('pointerup', pu); bx.addEventListener('pointerdown', pdB); show();
  c.say(c.T('배추를 크기대로 상자에 — 끌어다 놓거나 상자를 눌러요 (←↓→)', 'Sort each cabbage by size — drag it or tap a box (←↓→)'));
  return { go: '', cnt: () => ok, down() {}, key(code, rep) { if (rep) return /^(Arrow|Digit|Key[ASD])/.test(code); const b = { ArrowLeft: 0, Digit1: 0, KeyA: 0, ArrowDown: 1, Digit2: 1, KeyS: 1, ArrowRight: 2, Digit3: 2, KeyD: 2 }[code]; if (b == null) return false; put(b); return true; }, tick(dt) { if (TB.tick(dt)) c.finish(ok >= 7 ? 2 : ok >= 4 ? 1 : 0); }, dispose() { cb.removeEventListener('pointerdown', pdC); removeEventListener('pointerup', pu); bx.removeEventListener('pointerdown', pdB); } }; }

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
  return { go: c.T('봉지 씌우기', 'Bag it'), cnt: () => bag, down() { cover(sel); }, key(code) { const d = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code]; if (!d) return false; sel = Math.max(0, Math.min(N - 1, sel + d)); mark(); return true; },
    tick(dt) { t += dt; const sp = 0.055 / c.zw * (c.lp || 1);   /* LADDER-2 벌레 빠르기 */
      for (const w of W) { if ((w.wait -= dt) > 0) continue; if (w.tg < 0 || P[w.tg].st) { let bd = 9; w.tg = -1; P.forEach((p, i) => { if (p.st) return; const d = Math.hypot(p.x - w.x, p.y - w.y); if (d < bd) { bd = d; w.tg = i; } }); if (w.tg < 0) { w.e.style.opacity = '0'; continue; } }
        const p = P[w.tg], dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy); if (d < 0.03) { p.st = 2; lost++; p.e.classList.add('eat'); c.snd('pop'); c.say(c.T('앗, 벌레가 먼저 왔어요 — 다음 배를 지켜요', 'Oops, a caterpillar got there first — protect the next one')); w.wait = 1.2; w.tg = -1; check(); continue; }
        w.x += dx / d * sp * dt; w.y += dy / d * sp * dt; w.e.style.left = (w.x * 100).toFixed(1) + '%'; w.e.style.top = (w.y * 100).toFixed(1) + '%'; }
      if (t > 25 && !c.done) c.finish(bag >= N ? 3 : bag >= 4 ? 2 : bag >= 2 ? 1 : 0); }, dispose() { tr.removeEventListener('pointerdown', pd); } }; }

// ⑪ 어린 나무 심기(JUDGE-1 · 10-25 물 꾹 → 흙 보고 판단): 심는 차례(구덩이 → 묘목 세우기 → 흙 덮고 밟기 → 물) 안에 판단 둘
//   ① 묘목 세우기 = 깊이 그림 셋 가운데 고름(뿌리 목 = 뿌리와 줄기가 만나는 곳이 땅 높이와 같게 · 얕으면 뿌리가 드러나 마름 · 깊으면 줄기가 흙에 묻혀 썩음)
//   ② 물 = 흙 색을 보고 양을 고름(마른 흙 = 밝음 → 두 컵 · 촉촉 → 한 컵 · 젖은 흙 = 짙음 → 주지 않기 · 비가 오고 있으면 한 컵 덜) · 흙은 그날 날씨(어제·오늘 비 = 젖은 쪽 · 맑고 바람 = 마른 쪽)를 따라 다르게 마름
//   틀리면 그 자리에서 까닭 한 줄 + 그 나무가 다음 날 시듦(c.x.mem[일터]에 남김 · 그날 안엔 안 보임) → 다음 날 이 일터에 오면 시든 나무부터: 흙을 보고 다시 알맞게 물(물 탓) 또는 다시 심기(깊이 탓) = 되살림 · 또 틀리면 시든 채 남음
//   사다리 = 1 기본 · 2 깊이 그림이 비슷해짐 · 3 겉흙과 속흙이 다름(구덩이 속·손가락 구멍 흙을 봐야) · 4 나무 세 그루 · 차례가 틀리면 잠깐 손이 멈춤(시간 비용)
//   입력 = 단추 누르기 · 숫자 1~4(차례 카드) · 1~3 또는 ← → + E(깊이·물 고르기)
const TREE4 = [['⛏️', ['구덩이 파기', 'Dig a hole']], ['🌱', ['묘목 세우기', 'Stand the sapling']], ['👣', ['흙 덮고 꾹꾹 밟기', 'Fill with soil and tread it down']], ['💧', ['물 주기', 'Water it']]];
const WHY4 = [['구덩이가 먼저예요. 묘목이 설 자리가 없어요', 'Dig first. There is nowhere for the sapling'], ['묘목을 먼저 세워야 흙으로 덮을 수 있어요', 'Stand the sapling before filling the soil'], ['흙을 덮고 밟아야 물이 뿌리에 머물러요', 'Fill and tread the soil first so water stays at the roots']];
const SOILC = ['#dcc08f', '#a07a52', '#5d4230'];   /* 마른 흙 = 밝음 · 촉촉한 흙 · 젖은 흙 = 짙음 */
const WAT3 = [['주지 않기', 'No water'], ['한 컵', 'One cup'], ['두 컵', 'Two cups']];
const depthSvg = o => { const g = 34, y = g + o; return '<svg viewBox="0 0 60 64" width="60" height="64" aria-hidden="true"><rect x="0" y="' + g + '" width="60" height="30" fill="#a07a52"/><line x1="0" y1="' + g + '" x2="60" y2="' + g + '" stroke="#4a3322" stroke-width="2"/>'
  + '<path d="M30 ' + y + ' L20 ' + (y + 13) + ' M30 ' + y + ' L30 ' + (y + 16) + ' M30 ' + y + ' L40 ' + (y + 13) + ' M25 ' + (y + 7) + ' L18 ' + (y + 9) + ' M35 ' + (y + 7) + ' L42 ' + (y + 9) + '" stroke="#5a3a1e" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
  + '<line x1="30" y1="' + y + '" x2="30" y2="' + (y - 22) + '" stroke="#4f7a34" stroke-width="3"/><ellipse cx="24" cy="' + (y - 21) + '" rx="6" ry="3.5" fill="#6fae4a"/><ellipse cx="36" cy="' + (y - 24) + '" rx="6" ry="3.5" fill="#6fae4a"/><rect x="25" y="' + (y - 2) + '" width="10" height="4" rx="2" fill="#7a3f1a"/></svg>'; };   /* 단면 그림: 땅 선 · 뿌리 목(갈색 마디) · 뿌리 · 줄기 */
function mkOrder(c) { const X = jx(c), lv = c.lv, M = X.mem && typeof X.mem === 'object' ? X.mem : null, KEY = String(X.key || c.k || 'lumber'), DAY = X.day | 0, D = [10, 7, 6, 5][lv - 1], NT = lv >= 4 ? 3 : 2, rain = !!(X.rain || X.snow);
  const R0 = M && M[KEY] && typeof M[KEY] === 'object' && Array.isArray(M[KEY].w) ? M[KEY] : { d: DAY, w: [] }, old = R0.d < DAY ? R0.w.slice(0, 3) : [], keep = R0.d < DAY ? [] : R0.w.slice();   /* old = 어제까지 잘못 심은 나무(오늘 시들어 보임) · keep = 오늘 잘못 심은 것(내일 보임) */
  const Q = old.map(why => ({ rv: 1, why })); for (let i = 0; i < NT; i++) Q.push({ rv: 0 });
  const wts = X.rain || X.rainY || X.snow ? [0.15, 0.35, 0.5] : X.windy && !X.cloudy ? [0.5, 0.35, 0.15] : [0.34, 0.33, 0.33];
  const pickM = () => { const r = Math.random(); return r < wts[0] ? 0 : r < wts[0] + wts[1] ? 1 : 2; };
  const needOf = m => Math.max(0, 2 - m - (rain ? 1 : 0));
  let qi = 0, cur = null, st = 0, ph = 'order', lock = 0, miss = 0, gt = 0, revived = 0, sel = 0, nxT = 0, newBad = 0; const sick = [];
  c.mg.innerHTML = '<div class="trw"></div><div class="dots">' + '<i></i>'.repeat(Q.length) + '</div>'; const W9 = c.mg.querySelector('.trw'), dots = c.mg.querySelectorAll('.dots i');
  const scn = () => W9.querySelector('.scn');
  const setS = s => { const e = scn(); if (e) e.className = 'scn tr2 ' + skyOf(X) + ' s' + s + (lv >= 3 && s >= 3 ? ' fhon' : ''); };
  const scene = () => '<div class="scn tr2 ' + skyOf(X) + ' s0"><i class="sun"></i><b class="wxl">' + c.T(SKYN[skyOf(X)][0], SKYN[skyOf(X)][1]) + '</b><i class="gr" style="background:' + SOILC[cur.sf] + '"></i><i class="pit" style="background:' + SOILC[cur.m] + '"></i><i class="sap' + (cur.rv ? ' wl' : '') + '">🌱</i><i class="mound" style="background:' + SOILC[cur.sf] + '"></i><i class="fh" style="background:' + SOILC[cur.m] + '"></i><i class="drop">💧</i></div>';
  const markP = () => { const P = W9.querySelectorAll('.pick button'); P.forEach((b, i) => b.classList.toggle('sel', i === sel)); };
  const showDepth = () => { ph = 'depth'; sel = 1; const cr = W9.querySelector('.crd'); if (cr) cr.style.display = 'none';
    W9.insertAdjacentHTML('beforeend', '<div class="bx3 dp pick">' + cur.dOrd.map((o, j) => '<button data-q="' + o + '"><small>' + (j + 1) + '</small>' + depthSvg(o * D) + '</button>').join('') + '</div>'); markP();
    c.say(cur.rv ? c.T('어제 심은 나무가 시들었어요. 깊이가 맞지 않았어요. 다시 알맞게 심어요', 'A tree planted yesterday has wilted. The depth was wrong. Plant it again at the right depth') : lv === 1 ? c.T('얼마나 깊이 세울까요? 뿌리와 줄기가 만나는 곳(뿌리 목)을 땅 높이에 맞춰요', 'How deep? Line up the root collar, where root meets stem, with the ground') : c.T('묘목을 얼마나 깊이 세울까요?', 'How deep should the sapling go?')); };
  const cups = n => '<span class="cups">' + (n ? '<i></i>'.repeat(n) : '<em>—</em>') + '</span>';
  const showWater = () => { ph = 'water'; sel = 1; const cr = W9.querySelector('.crd'); if (cr) cr.style.display = 'none'; setS(3);
    W9.insertAdjacentHTML('beforeend', '<div class="bx3 wt pick">' + [0, 1, 2].map(n => '<button data-w="' + n + '">' + cups(n) + '<small>' + (n + 1) + '. ' + c.T(WAT3[n][0], WAT3[n][1]) + '</small></button>').join('') + '</div>'); markP();
    c.say(cur.rv ? c.T('어제 심은 나무가 시들었어요. 흙을 보고 물을 알맞게 줘요', 'A tree planted yesterday has wilted. Look at the soil and water it just right') : lv >= 3 ? c.T('물을 얼마나 줄까요? 겉흙 말고 속흙(손가락 구멍)을 봐요', 'How much water? Look at the soil inside the finger hole, not the surface') : c.T('물을 얼마나 줄까요? 흙 색을 봐요', 'How much water? Look at the soil colour')); };
  const build = () => { cur = Q[qi]; st = 0; sel = 0; cur.dOrd = shuf([-1, 0, 1]);
    if (cur.rv) { cur.m = cur.why === 'wet' ? 2 : cur.why === 'dry' ? 0 : pickM(); if (rain && cur.m === 0) cur.m = 1; cur.sf = cur.m; W9.innerHTML = scene(); setS(3); if (cur.why === 'wet' || cur.why === 'dry') showWater(); else showDepth(); return; }   /* 시든 나무: 물 탓 = 흙이 아직 그대로(젖음·마름) */
    cur.m = pickM(); cur.sf = lv >= 3 && Math.random() < 0.65 ? (cur.m === 0 ? 2 : cur.m === 2 ? 0 : Math.random() < 0.5 ? 0 : 2) : cur.m;   /* 3칸부터 겉흙과 속흙이 다름(살짝 온 비 = 겉만 젖음 · 볕 = 겉만 마름) */
    const ord = shuf([0, 1, 2, 3]); W9.innerHTML = scene() + '<div class="row crd">' + ord.map((i, j) => '<button class="sub" data-s="' + i + '">' + (j + 1) + '. ' + TREE4[i][0] + ' ' + c.T(TREE4[i][1][0], TREE4[i][1][1]) + '</button>').join('') + '</div>'; ph = 'order';
    c.say(qi === 0 || Q[qi - 1].rv ? c.T('나무 심는 차례대로 눌러요', 'Tap the planting steps in order') : c.T('한 그루 더! 차례대로', 'One more tree! In order')); };
  const treeDone = ok => { dots[qi].className = ok ? 'g' : 'm'; if (cur.rv) { if (ok) { gt++; revived++; } else sick.push(cur.why); } else if (ok) gt++; else { sick.push(cur.bad); newBad++; } ph = 'wait'; nxT = 1.6; };
  const pickDepth = o => { if (ph !== 'depth' || c.done) return; const P = W9.querySelector('.dp'); if (P) P.remove();
    if (o === 0) { c.snd('ding'); c.say(c.T('뿌리 목이 땅 높이와 같아요. 알맞아요', 'The root collar is level with the ground. Just right')); }
    else { c.snd('pop'); cur.bad = cur.bad || (o < 0 ? 'up' : 'down'); c.say((o < 0 ? c.T('너무 얕아요. 뿌리가 드러나 마를 거예요', 'Too shallow. The roots will be exposed and dry out') : c.T('너무 깊어요. 줄기가 흙에 묻혀 썩을 수 있어요', 'Too deep. The buried stem can rot')) + (cur.rv ? c.T('. 아직 시든 채예요', '. It is still wilted') : c.T('. 내일 이 나무를 봐요', '. Check this tree tomorrow'))); }
    if (cur.rv) { if (o === 0) { const s9 = W9.querySelector('.sap'); if (s9) s9.classList.remove('wl'); } treeDone(o === 0); return; }
    st = 2; setS(2); const cr = W9.querySelector('.crd'); if (cr) cr.style.display = ''; ph = 'order'; };
  const pickWater = n => { if (ph !== 'water' || c.done) return; const P = W9.querySelector('.wt'); if (P) P.remove(); const need = needOf(cur.m), ok = n === need; setS(n ? 4 : 3);
    if (ok) { c.snd('ding'); c.say(cur.rv ? c.T('나무가 다시 고개를 들었어요!', 'The tree lifts its head again!') : rain && need < 2 - cur.m ? c.T('비가 오니 한 컵 덜 줬어요. 알맞아요', 'It is raining, so one cup less. Just right') : c.T('흙을 보고 알맞게 줬어요', 'You read the soil and watered just right')); if (cur.rv) { const s9 = W9.querySelector('.sap'); if (s9) s9.classList.remove('wl'); } }
    else { c.snd('pop'); if (!cur.rv) cur.bad = cur.bad || (n > need ? 'wet' : 'dry');
      c.say((n > need ? (cur.m === 2 ? c.T('흙이 이미 젖어 있었어요', 'The soil was already wet') : rain ? c.T('비가 오고 있어서 물이 더 들어가요', 'It is raining, so more water is coming') : c.T('물이 많았어요', 'That was too much water')) + c.T('. 물이 너무 많으면 뿌리가 숨을 못 쉬어요', '. Too much water and the roots cannot breathe') : (cur.m === 0 ? c.T('흙이 말라 있었어요', 'The soil was dry') : c.T('물이 모자랐어요', 'That was not enough water')) + c.T('. 물이 모자라면 뿌리가 말라요', '. Without enough water the roots dry out'))
        + (cur.rv ? c.T('. 아직 시든 채예요', '. It is still wilted') : c.T('. 내일 이 나무를 봐요', '. Check this tree tomorrow'))); }
    treeDone(cur.rv ? ok : ok && !cur.bad); };
  const pick = i => { if (c.done || ph !== 'order' || lock > 0) return; const b = W9.querySelector('[data-s="' + i + '"]'); if (!b || b.disabled) return;
    if (i !== st) { miss++; lock = 1.2; pop(b, 'no'); c.snd('pop'); c.say(c.T(WHY4[Math.min(2, st)][0], WHY4[Math.min(2, st)][1])); return; }
    b.disabled = true; c.snd('tick'); if (i === 1) { showDepth(); return; } if (i === 3) { showWater(); return; }
    st++; setS(st); c.say(st === 1 ? (lv >= 3 ? c.T('구덩이를 팠어요. 속흙 색을 봐 둬요. 겉흙과 다를 수 있어요', 'Hole dug. Note the colour of the soil inside. It can differ from the surface') : c.T('구덩이를 팠어요. 다음은?', 'Hole dug. What is next?')) : c.T('좋아요! 다음은?', 'Good! What is next?')); };
  const pd = e => { const b = e.target.closest('[data-s],[data-q],[data-w]'); if (!b) return; e.preventDefault(); if (b.dataset.s != null) pick(+b.dataset.s); else if (b.dataset.q != null) pickDepth(+b.dataset.q); else pickWater(+b.dataset.w); };
  c.mg.addEventListener('pointerdown', pd);
  const score = () => { const n = Q.length; return gt === n && miss <= 1 ? 3 : gt * 2 >= n ? 2 : gt >= 1 ? 1 : 0; };
  const end = () => { ph = 'end'; if (M) { M[KEY] = { d: DAY, w: keep.concat(sick).slice(-3) }; if (X.mark) X.mark(); } c.finish(score()); };
  build(); if (old.length) c.say(c.T('어제 심은 나무 ' + old.length + '그루가 시들었어요. 먼저 돌봐요', old.length + ' tree(s) planted yesterday have wilted. Care for them first'));
  const pickSel = () => { const b = W9.querySelectorAll('.pick button')[sel]; if (!b) return; if (ph === 'depth') pickDepth(+b.dataset.q); else if (ph === 'water') pickWater(+b.dataset.w); };
  return { cnt: () => gt,
    tail: () => (newBad ? c.T('💡 잘못 심은 나무 ' + newBad + '그루는 내일 시들어 있을 거예요. 다시 와서 돌봐요', '💡 ' + newBad + ' tree(s) planted wrong will look wilted tomorrow. Come back to care for them') : revived ? c.T('💡 시든 나무 ' + revived + '그루를 되살렸어요. 뿌리 목은 땅 높이, 물은 흙을 보고 줘요', '💡 You revived ' + revived + ' wilted tree(s). Root collar at ground level, water by the soil') : ''),
    down() { if (ph === 'depth' || ph === 'water') pickSel(); },
    key(code, rep) { if (ph === 'depth' || ph === 'water') { const d = /^Digit([1-3])$/.exec(code); if (d) { if (!rep) { sel = +d[1] - 1; pickSel(); } return true; } const m = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code]; if (m) { sel = (sel + m + 3) % 3; markP(); return true; } return false; }
      const d = /^Digit([1-4])$/.exec(code); if (!d || ph !== 'order') return false; if (rep) return true; const b = W9.querySelectorAll('.crd button')[+d[1] - 1]; if (b && !b.disabled) pick(+b.dataset.s); return true; },
    tick(dt) { if (lock > 0) lock -= dt; if (ph === 'wait' && (nxT -= dt) <= 0) { qi++; if (qi >= Q.length) end(); else build(); } },
    get dbg() { return { ph, qi, n: Q.length, rv: !!(cur && cur.rv), why: cur && cur.why, m: cur ? cur.m : -1, sf: cur ? cur.sf : -1, need: cur ? needOf(cur.m) : -1, dOrd: cur ? cur.dOrd.slice() : [], st, cards: [...W9.querySelectorAll('.crd button')].map(b => +b.dataset.s), gt, revived, sick: sick.slice(), keep: keep.slice(), old: old.slice(), lock: +Math.max(0, lock).toFixed(2), miss, lv, rain, key: KEY, day: DAY }; },
    dispose() { c.mg.removeEventListener('pointerdown', pd); } }; }

// ⑫ 먹이 나눠 주기(목장): 하나씩 나오는 먹이를 알맞은 동물에게(끌어다 놓기 · 누르기 · 1~4) — 소·양 = 풀·건초(초식) · 개 = 고기 · 초콜릿 = 아무에게도 X(개에게 위험)
const FEED = [['🌾', ['건초', 'Hay'], [0, 1]], ['🍀', ['풀', 'Grass'], [0, 1]], ['🍖', ['고기', 'Meat'], [2]], ['🍫', ['초콜릿', 'Chocolate'], [3]]];
const FEEDWHY = { 0: ['소는 풀을 먹는 초식 동물이에요', 'Cows eat plants — they’re herbivores'], 1: ['양도 풀을 먹는 초식 동물이에요', 'Sheep eat plants too'], 2: ['개는 고기도 먹어요 — 풀은 잘 안 먹어요', 'Dogs eat meat — not hay'], 3: ['초콜릿은 개에게 위험해요 — 아무에게도 주지 않아요', 'Chocolate is dangerous for dogs — give it to no one'] };
function mkFeed(c) { const N = 8, T = 20 * c.zw * (c.lp || 1); let i = 0, ok = 0, cur = 0;
  c.mg.innerHTML = '<div class="cab"><i class="cb fd"></i><b class="cn"></b></div><div class="bx3 an"><button data-b="0"><i>🐄</i>' + c.T('소', 'Cow') + '</button><button data-b="1"><i>🐑</i>' + c.T('양', 'Sheep') + '</button><button data-b="2"><i>🐕</i>' + c.T('개', 'Dog') + '</button><button data-b="3"><i>🚫</i>' + c.T('주지 않기', 'Nobody') + '</button></div>';
  const fd = c.mg.querySelector('.fd'), cn = c.mg.querySelector('.cn'), bx = c.mg.querySelector('.bx3'), TB = timeBar(c, T), seq = [];
  for (let k = 0; k < N; k++) seq.push(k < 2 ? 0 : k < 4 ? 1 : k < 6 ? 2 : 3); seq.sort(() => Math.random() - 0.5);   /* 건초·풀·고기 둘씩 + 초콜릿 둘 */
  const show = () => { cur = seq[i]; fd.textContent = FEED[cur][0]; cn.textContent = c.T(FEED[cur][1][0], FEED[cur][1][1]) + ' (' + (i + 1) + '/' + N + ')'; };
  const give = b => { if (c.done) return; const good = FEED[cur][2].includes(b); if (good) { ok++; c.snd('tick'); c.say(c.T('냠냠! ', 'Munch! ') + ok + '/' + N); } else { c.snd('pop'); const w = FEED[cur][2].includes(3) ? FEEDWHY[3] : FEEDWHY[b === 3 ? FEED[cur][2][0] : b]; c.say(c.T(w[0], w[1])); } i++; if (i >= N) c.finish(ok >= N ? 3 : ok >= 6 ? 2 : ok >= 4 ? 1 : 0); else show(); };
  let dragF = false; const pdF = e => { e.preventDefault(); dragF = true; fd.classList.add('dr'); }, pu = e => { if (!dragF) return; dragF = false; fd.classList.remove('dr'); const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest && el.closest('[data-b]'); if (b && bx.contains(b)) give(+b.dataset.b); };
  const pdB = e => { const b = e.target.closest('[data-b]'); if (!b) return; e.preventDefault(); give(+b.dataset.b); };
  fd.addEventListener('pointerdown', pdF); addEventListener('pointerup', pu); bx.addEventListener('pointerdown', pdB); show();
  c.say(c.T('먹이를 알맞은 동물에게 — 끌어다 주거나 동물을 눌러요 (1~4)', 'Give each food to the right animal — drag or tap (1–4)'));
  return { go: '', cnt: () => ok, down() {}, key(code, rep) { const d = /^Digit([1-4])$/.exec(code); if (!d) return false; if (!rep) give(+d[1] - 1); return true; }, tick(dt) { if (TB.tick(dt)) c.finish(ok >= 7 ? 2 : ok >= 4 ? 1 : 0); }, dispose() { fd.removeEventListener('pointerdown', pdF); removeEventListener('pointerup', pu); bx.removeEventListener('pointerdown', pdB); } }; }

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

// ⑱ 🍳 바쁜 부엌(KITCHEN-1 · 사용자 10-20 '다 빨간 막대잖아요' · '실제 게임 방식으로' · 설계 docs/systems/town_jobs2.md 「다음 다섯 — 🍳 바쁜 부엌」): 주문 쪽지 → 재료를 냄비로 끌기 → 불 세기·뚜껑 → 알맞게 익으면 접시로 끌기
//   익힘 = 넓은 폭(알맞음 4.5초 · 솜씨 = 여유 시간이 늚) · 꺼낸 결과(덜 익음·알맞음·탐)가 접시 그림에 남음 · 때 맞춰 누르기·막대 X
//   꼬임 사다리(안에서만 셈): 1 한 가지 요리 → 2 재료 둘 차례 → 3 냄비 둘(보리차 주전자) → 4 손님 주문 둘 · 위험 고르기 = 냄비 하나 더(재료 한 벌 더 · 한 그릇 더 · 대가는 그 판 안에서 바빠짐)
//   배울 거리(사실만): 물은 100℃에서 끓고 끓은 뒤엔 불을 세게 해도 더 뜨거워지지 않음 · 뚜껑을 덮으면 빨리 끓음 · 단단한 재료부터 · 찜 = 김으로 익힘 · 팝콘 = 알 속 물이 김이 되어 터짐
/* 요리 방법: pan = 팬(기름 먼저) · water = 냄비 물(처음부터 물이 있음 · 끓어야 익음) · steam = 찜(물 먼저 + 뚜껑) · 재료 = [이모지, 이름, 익는 데 걸리는 초(중불), 'hot' = 끓은 물에 넣기] · 0초 = 먼저 넣는 것(기름·물) */
const KM = {
  '🥞': { m: 'pan', one: ['🥣', ['반죽', 'Batter'], 7], steps: [['🧈', ['기름', 'Oil'], 0], ['🥣', ['반죽', 'Batter'], 7]], why: ['팬에 기름을 먼저 둘러야 반죽이 들러붙지 않아요', 'Oil the pan first so the batter doesn’t stick'] },
  '🥘': { m: 'pan', one: ['🍄', ['버섯', 'Mushrooms'], 6], steps: [['🧈', ['버터', 'Butter'], 0], ['🍄', ['버섯', 'Mushrooms'], 6]], why: ['버터를 먼저 녹여야 버섯이 들러붙지 않아요', 'Melt the butter first so the mushrooms don’t stick'] },
  '🍮': { m: 'steam', lid: 1, one: ['🍮', ['푸딩 그릇', 'Pudding cups'], 8], steps: [['💧', ['물', 'Water'], 0], ['🍮', ['푸딩 그릇', 'Pudding cups'], 8]], why: ['찜은 물을 먼저 부어야 해요. 물이 없으면 그릇이 타요', 'Steaming needs water first, or the cups scorch'] },
  '🍲': { m: 'water', salt: 1, one: ['🥔', ['썰어 둔 감자와 배추', 'Chopped potato and cabbage'], 6], steps: [['🥔', ['감자', 'Potato'], 8], ['🥬', ['배추', 'Cabbage'], 3]], why: ['단단한 감자를 먼저 넣고, 금방 익는 배추는 나중에 넣어요', 'Hard potatoes go in first; soft cabbage cooks fast, so it goes in later'] },
  '🍙': { m: 'steam', lid: 1, salt: 1, one: ['🍚', ['밥', 'Rice'], 5], steps: [['💧', ['물', 'Water'], 0], ['🍚', ['밥', 'Rice'], 5]], why: ['찜은 물을 먼저 부어야 해요. 물이 없으면 밥이 눌어붙어요', 'Steaming needs water first, or the rice scorches'] },
  '🍿': { m: 'pan', lid: 1, pop: 1, one: ['🌽', ['옥수수 알', 'Corn kernels'], 6], steps: [['🧈', ['버터', 'Butter'], 0], ['🌽', ['옥수수 알', 'Corn kernels'], 6]], why: ['버터를 먼저 녹여야 옥수수 알이 고루 데워져요', 'Melt the butter first so the kernels heat evenly'] },
  '🥗': { m: 'water', salt: 1, one: ['🍃', ['나물', 'Greens'], 3], steps: [['🍃', ['나물', 'Greens'], 3, 'hot']], why: ['나물은 물이 끓은 다음에 넣어 살짝 데쳐요', 'Put greens in only after the water boils, then blanch them briefly'] },
};
KM['🍓🥞'] = KM['🥞'];
const TEA = { m: 'water', tea: 1, one: ['🌾', ['볶은 보리', 'Roasted barley'], 5], steps: [['🌾', ['볶은 보리', 'Roasted barley'], 5]] };
/* 손님 = 이 마을에 이미 있는 일꾼 역할(이름 없는 역할만 · 새 몸 X) */
const GNM = { pasture: ['목장 일꾼', 'Ranch hand'], fisher: ['부두 어부', 'Pier fisher'], shiitake: ['표고 농부', 'Shiitake farmer'], potato: ['감자밭 농부', 'Potato farmer'], cabbage: ['배추밭 농부', 'Cabbage farmer'], beehive: ['양봉 일꾼', 'Beekeeper'], saltpan: ['염전 일꾼', 'Salt worker'], strawberry: ['딸기 농부', 'Strawberry farmer'], lumber: ['숲 일꾼', 'Forester'], stall: ['장터 상인', 'Market seller'], clam: ['갯벌 일꾼', 'Mudflat worker'], pear: ['과수원 농부', 'Pear grower'], paddy: ['논 농부', 'Rice farmer'], seaweed: ['김 양식 일꾼', 'Laver farmer'], oyster: ['굴 양식 일꾼', 'Oyster farmer'] };
export const kitGuests = ks => { const o = []; for (const k of ks || []) if (GNM[k] && !o.includes(k)) o.push(k); return o.length ? o : ['stall']; };
export const kitGuestName = (k, en) => (GNM[k] || ['이웃', 'Neighbour'])[en ? 1 : 0];
const REQ = { salt1: [['덜 짜게, 소금은 한 꼬집만 넣어 주세요', 'Not too salty, please — just one pinch of salt']], well: [['푹 익혀 주세요', 'Cook it well, please'], ['진하게 우려 주세요', 'Make it strong, please']], light: [['살짝만 익혀 주세요', 'Just lightly cooked, please'], ['연하게 우려 주세요', 'Make it light, please']] };
const reqText = (r, tea, en) => { const q = REQ[r]; if (!q) return ''; const t = q[tea && q[1] ? 1 : 0]; return t[en ? 1 : 0]; };
export const KIT_LV = [null, ['한 가지 요리', 'One dish'], ['재료를 차례대로', 'Ingredients in order'], ['냄비 둘을 함께', 'Two pots at once'], ['손님 주문 둘', 'Two orders']];
const KIT_UP = [null, null, ['이제 재료 둘을 차례대로 넣어 볼게요', 'Next: two ingredients, in the right order'], ['이제 보리차 주전자도 같이 봐 줘요', 'Next: watch the barley-tea kettle too'], ['이제 손님 둘의 주문을 함께 받아요', 'Next: two customers order at once']];
const KFACT = {
  water: ['물은 100℃에서 끓어요. 끓은 뒤에는 불을 세게 해도 더 뜨거워지지 않아요. 그래서 끓으면 중불로 줄여도 돼요', 'Water boils at 100°C. Once boiling, more heat doesn’t make it hotter — so you can turn it down to medium'],
  lid: ['뚜껑을 덮으면 김과 열이 덜 빠져나가서 물이 더 빨리 끓어요', 'A lid keeps steam and heat in, so water boils faster'],
  order: ['단단한 재료는 오래, 연한 재료는 짧게 익어요. 그래서 단단한 것부터 넣어요', 'Hard ingredients take long, soft ones cook fast — so hard ones go in first'],
  steam: ['찜은 끓는 물에서 나온 뜨거운 김으로 재료를 익히는 거예요', 'Steaming cooks food with hot steam from boiling water'],
  pop: ['옥수수 알 속의 물이 뜨거워져 김이 되면 껍질이 터져 팝콘이 돼요', 'Water inside a corn kernel turns to steam and bursts the shell — that’s popcorn'],
  pan: ['팬에 기름을 두르면 재료가 팬에 들러붙지 않아요', 'Oil in the pan stops food from sticking'],
};
/* 판 뒤 사다리(안에서만 셈 · 내려가지 않음): 잘한 판(점수 2 이상) 셋 = 다음 꼬임 · 같은 꼬임에서 0점 둘 = 힌트 · 셋 = 다음 한 판만 한 칸 쉽게 */
export function kitAfter(L, sc, lv) { L.n = (L.n | 0) + 1; L.lv = L.lv || 1; let up = 0, hint = 0;
  if (L.easy) L.easy = 0;
  else if (lv === L.lv) { if (sc >= 2) { L.good = (L.good | 0) + 1; L.fail = 0; if (L.good >= 3 && L.lv < 4) { L.lv++; L.good = 0; up = L.lv; } } else if (sc <= 0) { L.fail = (L.fail | 0) + 1; if (L.fail >= 2) hint = 1; if (L.fail >= 3) { L.easy = 1; L.fail = 0; } } }   /* 한 칸 쉬운 판 = 사다리 셈 X */
  L.best = Math.max(L.best | 0, sc | 0); return { up, hint }; }
export const kitUpText = (lv, en) => (KIT_UP[lv] ? KIT_UP[lv][en ? 1 : 0] : '');
const HP = [0, 0.55, 1, 1.7], HW = [0, 0.85, 1, 1.1], HUP = [0, 7, 13, 22];   /* 팬 익는 빠르기 · 끓는 물 익는 빠르기(끓은 뒤엔 거의 같음 = 100℃) · 물 데워지는 ℃/초 */
const HEATN = [['끔', 'Off'], ['약', 'Low'], ['중', 'Med'], ['강', 'High']];
const KCSS = `
.twn-play .kc{display:flex;flex-direction:column;gap:6px}
.twn-play .kc button{min-height:30px;padding:3px 8px;font-size:13px;border-width:2px;border-radius:9px;box-shadow:0 2px 0 #2b2420}
.twn-play .kc-ord{display:flex;gap:6px}.twn-play .kc-ord .nt{flex:1;background:#fffdf3;border:2px dashed #b49a64;border-radius:8px;padding:4px 7px;font-size:13px;line-height:1.35}.twn-play .kc-ord .nt b{font-size:13px}.twn-play .kc-ord .nt i{font-style:normal;color:#8a5a2b}
.twn-play .kc-tray{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;touch-action:none}.twn-play .kc-tray .ch{background:#f4e6c8;color:#2b2420;text-shadow:none;font-size:14px;cursor:grab;touch-action:none}.twn-play .kc-tray .ch.sel{background:#ffe7a3;outline:3px solid #2b5a3a}
.twn-play .kc-st{display:flex;gap:6px}.twn-play .kc-pot{position:relative;flex:1;min-width:0;background:#e9e3d6;border:3px solid #2b2420;border-radius:12px;padding:12px 4px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;touch-action:none}
.twn-play .kc-pot.sel{box-shadow:inset 0 0 0 3px #2b5a3a}.twn-play .kc-pot .nm{font-size:11px;font-weight:800;color:#56606b}
.twn-play .kc-pot .vs{position:relative;width:86%;height:50px;border-radius:0 0 26px 26px;background:#5d6f86;border:3px solid #2b2420;border-top-width:2px;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:grab;touch-action:none}
.twn-play .kc-pot.pan .vs{height:30px;border-radius:0 0 40px 40px;background:#3a3f46}.twn-play .kc-pot .vs.wt{background:linear-gradient(#5d6f86 30%,#7fb8d9 30%)}
.twn-play .kc-pot .vs .fd{display:inline-block;transition:filter .4s,transform .3s}.twn-play .kc-pot.st-raw .fd{filter:saturate(.4) brightness(1.3)}.twn-play .kc-pot.st-ok .fd{transform:scale(1.12)}.twn-play .kc-pot.st-warn .fd{filter:sepia(.6) brightness(.85)}.twn-play .kc-pot.st-burnt .fd{filter:grayscale(1) brightness(.35)}
.twn-play .kc-pot .ld{position:absolute;left:4%;right:4%;top:-9px;height:7px;border-radius:9px 9px 2px 2px;background:#8a96a8;border:2px solid #2b2420;opacity:0;transition:opacity .15s}.twn-play .kc-pot.lid .ld{opacity:1}
.twn-play .kc-pot .bb{position:absolute;top:-2px;left:0;right:0;text-align:center;font-size:11px;font-style:normal;color:#fff;opacity:0}.twn-play .kc-pot.boil .bb{opacity:1}
.twn-play .kc-pot.spill{animation:twn-mg-shake .35s}
.twn-play .kc-pot .lb{font-size:12px;font-weight:900;font-style:normal;min-height:15px;text-align:center}.twn-play .kc-pot.st-ok .lb{color:#2b7a3a}.twn-play .kc-pot.st-warn .lb{color:#c2560c}.twn-play .kc-pot.st-burnt .lb{color:#b0412e}
.twn-play .kc-pot .tp{font-size:11px;color:#56606b;min-height:13px}
.twn-play .kc-pot .fl{display:flex;gap:3px;height:10px;align-items:flex-end}.twn-play .kc-pot .fl i{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #f08a24;opacity:.15}.twn-play .kc-pot.h1 .fl i:nth-child(1),.twn-play .kc-pot.h2 .fl i:nth-child(-n+2),.twn-play .kc-pot.h3 .fl i{opacity:1}.twn-play .kc-pot.h3 .fl i{border-bottom-color:#e0453a}
.twn-play .kc-pot .ht{display:flex;gap:2px}.twn-play .kc .kc-pot .ht button{padding:2px 5px;min-height:26px;font-size:12px;background:#f4e6c8;color:#2b2420;text-shadow:none}.twn-play .kc .kc-pot .ht button.on{background:#f08a24;color:#fff}
.twn-play .kc-pot .rw{display:flex;gap:3px}.twn-play .kc .kc-pot .rw button{padding:2px 6px;min-height:26px;font-size:12px}.twn-play .kc .kc-pot .rw .lt{background:#f4e6c8;color:#2b2420;text-shadow:none}.twn-play .kc .kc-pot.lid .rw .lt{background:#8a96a8;color:#fff}
.twn-play .kc-pot.done{opacity:.4}.twn-play .kc-pot.drop{box-shadow:inset 0 0 0 3px #f08a24}
.twn-play .kc-pl{display:flex;gap:6px;justify-content:center;min-height:62px}.twn-play .kc-plate{flex:1;max-width:150px;border:3px dashed #b9a98a;border-radius:50%/40%;background:#fffdf7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px}
.twn-play .kc-plate.drop{border-color:#f08a24;background:#fff1dc}.twn-play .kc-plate .pf{font-size:26px;line-height:1.1}.twn-play .kc-plate em{font-size:12px;font-weight:900;font-style:normal;color:#56606b}
.twn-play .kc-plate.r-ok{border:3px solid #2b7a3a}.twn-play .kc-plate.r-ok em{color:#2b7a3a}.twn-play .kc-plate.r-raw .pf{filter:saturate(.35) brightness(1.3)}.twn-play .kc-plate.r-raw em{color:#8a6a2b}.twn-play .kc-plate.r-burnt .pf{filter:grayscale(1) brightness(.35)}.twn-play .kc-plate.r-burnt em{color:#b0412e}
.twn-play .kc-plate .sl{display:flex;gap:3px;margin-top:2px}.twn-play .kc .kc-plate .sl button{padding:1px 6px;min-height:24px;font-size:12px;background:#f4e6c8;color:#2b2420;text-shadow:none}
.twn-play .kc .kc-more{align-self:center;background:#f4e6c8;color:#2b2420;text-shadow:none}
.twn-play .kc-fact{font-size:12px;color:#56606b;line-height:1.35}
.twn-kc-gh{position:fixed;z-index:60;pointer-events:none;font-size:30px;transform:translate(-50%,-60%);font-family:system-ui,sans-serif,SMEmoji}
`;
function mkKitchen(c) {
  if (!document.getElementById('twn-kc-css')) { const s = document.createElement('style'); s.id = 'twn-kc-css'; s.textContent = KCSS; document.head.appendChild(s); }
  const X = c.x || {}, R = X.r || ['🥞', '팬케이크', 'Pancake', {}], M = KM[R[0]] || KM['🥞'], story = !!X.story, L = X.lad || {}, n0 = L.n | 0, WS = 4.5 * c.zw, en = c.en, T = c.T;
  let seed = ((X.seed | 0) * 2654435761 + n0 * 97 + 13) >>> 0; const rnd9 = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
  let lv = story ? 1 : Math.max(1, Math.min(4, (L.lv | 0) || 1)); if (!story && L.easy && lv > 1) lv--;
  const G = kitGuests(X.guests), pickG = not => { const A = G.filter(k => k !== not); return A.length ? A[(rnd9() * A.length) | 0] : G[0]; };
  const guest = X.ord && X.ord.dish === R[0] && X.ord.role ? X.ord.role : pickG(null), reg = ((L.reg || {})[guest]) || null;
  const memReq = reg && reg.n >= 2 ? (reg.last && REQ[reg.last] ? reg.last : reg.res === 'burnt' ? 'light' : reg.res === 'raw' ? 'well' : null) : null;
  let cond = null; if (!story && n0 >= 3) { if (X.wx === 'rain' && lv < 3) cond = 'rain'; else if (X.sea === 'winter') cond = 'winter'; else if (memReq && !(memReq === 'salt1' && !M.salt)) cond = 'guest'; }   /* 조건은 한 판에 하나(날씨 > 계절 > 단골) · 처음 세 판·이야기 판 = 끔 */
  let req = cond === 'winter' ? 'well' : cond === 'guest' ? memReq : null; if (!req && lv >= 4) req = M.salt && rnd9() < 0.6 ? 'salt1' : rnd9() < 0.5 ? 'well' : 'light';
  const side = !story && (lv >= 3 || cond === 'rain'), guest2 = side ? pickG(guest) : null, req2 = side && lv >= 4 ? (rnd9() < 0.5 ? 'well' : 'light') : null;
  /* 냄비 하나 = { kind main|more|side, D(방법), need[재료], water, heat, lid, T(물 온도) ... } */
  const P = [], CH = [];
  const mkPot = (kind, D) => { const st = lv >= 2 ? D.steps : [D.one], need = st.map(s => ({ e: s[0], nm: s[1], t: s[2], hot: s[3] === 'hot', in: false, el: 0 })), prepIn = !need.some(q => q.t === 0);
    return { kind, D, need, water: D.m === 'water' || (D.m === 'steam' && !need.some(q => q.e === '💧')), oil: D.m !== 'pan' || prepIn, heat: 0, lid: false, lidUsed: 0, T: 20, sp: 0, spill: 0, pop: 0, ordBad: 0, done: null, salt: 0, wantSalt: false, st: '', lb: '', tp: '', cls: '', el: null }; };
  P.push(mkPot('main', M)); if (side) P.push(mkPot('side', TEA));
  const chipsOf = () => { CH.length = 0; for (const q of P) for (const s of q.need) if (!CH.some(h => h.e === s.e && h.nm === s.nm)) CH.push({ e: s.e, nm: s.nm }); };
  chipsOf();
  const dishE = q => (q.kind === 'side' ? '🍵' : R[0]), potNm = q => (q.kind === 'side' ? T('보리차 주전자', 'Barley-tea kettle') : q.kind === 'more' ? T('한 냄비 더', 'Extra pot') : M.m === 'pan' ? T('팬', 'Pan') : M.m === 'steam' ? T('찜 냄비', 'Steamer') : T('냄비', 'Pot'));
  const note = (g, dish, r, tea, mem) => '<div class="nt"><b>' + kitGuestName(g, en) + '</b> ' + dish + (r ? '<br>' + reqText(r, tea, en) : '') + (mem ? '<br><i>' + mem + '</i>' : '') + '</div>';
  const memLine = cond === 'guest' && reg ? (reg.res === 'burnt' ? T('지난번엔 조금 탔어요.', 'Last time it was a bit burnt.') : reg.res === 'raw' ? T('지난번엔 덜 익었어요.', 'Last time it was undercooked.') : T('지난번처럼 해 주세요.', 'Same as last time, please.')) : cond === 'winter' ? T('추운 날이라 뜨끈한 게 좋아요.', 'It’s a cold day — something hot, please.') : cond === 'rain' ? T('비가 와서 따뜻한 보리차도 한 주전자요.', 'It’s raining — a kettle of warm barley tea too.') : '';
  c.mg.innerHTML = '<div class="kc"><div class="kc-ord">' + note(guest, R[0] + ' ' + (en ? R[2] : R[1]), req, false, cond === 'rain' ? '' : memLine) + (side ? note(guest2, '🍵 ' + T('보리차', 'Barley tea'), req2, true, cond === 'rain' ? memLine : '') : '') + '</div><div class="kc-tray"></div><div class="kc-st"></div><div class="kc-pl"></div>'
    + (lv >= 2 && !story && X.canMore && X.canMore() ? '<button class="kc-more">' + T('냄비 하나 더 올리기 (재료 한 벌 더)', 'Add one more pot (another set of ingredients)') + '</button>' : '') + '<div class="kc-fact"></div></div>';
  const tray = c.mg.querySelector('.kc-tray'), stv = c.mg.querySelector('.kc-st'), pls = c.mg.querySelector('.kc-pl'), moreB = c.mg.querySelector('.kc-more'), factEl = c.mg.querySelector('.kc-fact');
  let sel = 0, chipSel = -1, t = 0, ph = 'cook', endT = -1, score = 0, res = null, msgT = 0, moreTaken = false;
  const say = (s, hold) => { c.say(s); msgT = hold || 2.2; };
  const foodsIn = q => q.need.filter(s => s.t > 0 && s.in);
  const itemSt = s => (s.el <= 0 ? 'raw' : s.el < s.t ? 'cook' : s.el <= s.t + WS - 1.5 ? 'ok' : s.el <= s.t + WS ? 'warn' : 'burnt');
  const potSt = q => { let any = 0, burnt = 0, notyet = 0, warn = 0, inn = 0; for (const s of q.need) { if (s.t <= 0) continue; if (!s.in) { notyet = 1; continue; } inn = 1; const k = itemSt(s); if (k === 'burnt') burnt = 1; else if (k === 'raw' || k === 'cook') { notyet = 1; if (k === 'cook') any = 1; } else if (k === 'warn') warn = 1; } return !inn ? 'empty' : burnt ? 'burnt' : notyet ? (any ? 'cook' : 'raw') : warn ? 'warn' : 'ok'; };
  const boiling = q => q.D.m !== 'pan' && q.water && q.T >= 99.5;
  const label = (q, st) => { if (q.done) return ''; if (st === 'empty') return T('재료를 끌어 넣어요', 'Drag ingredients in'); if (q.need.some(s => s.t > 0 && !s.in)) return T('재료가 더 있어요', 'More to add');
    if (!q.heat && st === 'raw') return T('불을 켜요', 'Turn on the heat'); if (q.D.m !== 'pan' && q.water && !boiling(q) && (st === 'raw' || st === 'cook')) return T('끓기를 기다려요', 'Waiting to boil');
    return st === 'ok' ? T('알맞아요', 'Just right') : st === 'warn' ? T('곧 타요', 'About to burn') : st === 'burnt' ? (q.kind === 'side' ? T('너무 진해요', 'Too strong') : T('탔어요', 'Burnt')) : T('익는 중', 'Cooking'); };
  function paint(q) { if (!q.el) return; const st = q.done ? 'done' : potSt(q), cls = 'kc-pot ' + (q.D.m === 'pan' ? 'pan ' : '') + 'st-' + st + ' h' + q.heat + (q.lid ? ' lid' : '') + (boiling(q) && !q.done ? ' boil' : '') + (P.indexOf(q) === sel && ph === 'cook' ? ' sel' : '') + (q.done ? ' done' : '');
    if (q.cls !== cls) { q.cls = cls; q.el.root.className = cls; for (let k = 0; k < 4; k++) q.el.ht[k].classList.toggle('on', k === q.heat); q.el.vs.classList.toggle('wt', !!(q.water && q.D.m !== 'pan')); }
    const lb = label(q, st); if (q.lb !== lb) { q.lb = lb; q.el.lb.textContent = lb; }
    const tp = q.D.m === 'pan' ? '' : !q.water ? T('물이 없어요', 'No water') : q.T >= 99.5 ? T('보글보글 100℃', 'Boiling 100°C') : T('물 ', 'Water ') + (q.T | 0) + '℃'; if (q.tp !== tp) { q.tp = tp; q.el.tp.textContent = tp; }
    let fd = ''; for (const s of q.need) if (s.t > 0 && s.in) fd += s.e; if (q.el.fd.textContent !== fd) q.el.fd.textContent = fd; }
  const drawTray = () => { tray.innerHTML = CH.map((h, i) => '<button class="ch" data-c="' + i + '">' + (i + 1) + ' ' + h.e + ' ' + h.nm[en ? 1 : 0] + '</button>').join(''); };
  const potHTML = (q, i) => '<div class="kc-pot" data-p="' + i + '"><span class="nm">' + potNm(q) + '</span><div class="vs"><i class="ld"></i><i class="bb">' + T('보글보글', 'bubbling') + '</i><span class="fd"></span></div><em class="lb"></em><small class="tp"></small><div class="fl"><i></i><i></i><i></i></div><div class="ht">' + HEATN.map((h, k) => '<button data-h="' + k + '">' + h[en ? 1 : 0] + '</button>').join('') + '</div><div class="rw"><button class="lt">' + T('뚜껑', 'Lid') + '</button><button class="pt">' + T('담기', 'Plate') + '</button></div></div>';
  const plateHTML = (q, i) => '<div class="kc-plate" data-p="' + i + '"><span class="pf">' + (q.kind === 'side' ? '🍵' : '🍽') + '</span><em>' + (q.kind === 'side' ? T('찻잔', 'Cup') : T('접시', 'Plate')) + '</em></div>';
  const drawStove = () => { stv.innerHTML = P.map(potHTML).join(''); pls.innerHTML = P.map(plateHTML).join(''); P.forEach((q, i) => { const r9 = stv.children[i]; q.el = { root: r9, vs: r9.querySelector('.vs'), fd: r9.querySelector('.fd'), lb: r9.querySelector('.lb'), tp: r9.querySelector('.tp'), ht: r9.querySelectorAll('.ht button'), pl: pls.children[i] }; q.cls = ''; q.lb = ''; q.tp = ''; paint(q); }); };
  drawTray(); drawStove();
  /* 재료 넣기: 차례가 틀리면 그 냄비에 자국(ordBad · 다음 꼬임 별을 못 받음) · 데칠 것을 끓기 전에 넣어도 자국 */
  const put = (pi, ci) => { const q = P[pi], h = CH[ci]; if (!q || !h || ph !== 'cook' || q.done) return false; const s = q.need.find(z => z.e === h.e && z.nm === h.nm); if (!s) { c.snd('pop'); say(q.kind === 'side' ? T('보리차 주전자에는 볶은 보리만 넣어요', 'Only roasted barley goes in the kettle') : T('그건 이 냄비에 넣는 재료가 아니에요', 'That doesn’t go in this pot')); pop(q.el.root, 'spill'); return false; }
    if (s.in) { say(T('벌써 넣었어요', 'Already in')); return false; }
    const idx = q.need.indexOf(s), before = q.need.slice(0, idx).some(z => !z.in); if (lv >= 2 && before) { q.ordBad = 1; c.snd('pop'); say(q.D.why ? q.D.why[en ? 1 : 0] : T('차례가 바뀌었어요', 'Wrong order'), 3); }
    if (s.hot && !boiling(q)) { q.ordBad = 1; c.snd('pop'); say(T('물이 끓기 전에 넣었어요. 나물은 끓는 물에 넣어요', 'In before the boil — greens go into boiling water'), 3); }
    s.in = true; if (s.t === 0) { if (s.e === '💧') q.water = true; else q.oil = true; } c.snd('tick'); if (!q.heat && !before && !s.hot) say(T('이제 불을 켜요 (약·중·강)', 'Now turn on the heat (Low, Med, High)'));
    if (chipSel >= 0 && tray.children[chipSel]) tray.children[chipSel].classList.remove('sel'); chipSel = -1; paint(q); return true; };
  const setHeat = (pi, h) => { const q = P[pi]; if (!q || q.done || ph !== 'cook') return; q.heat = Math.max(0, Math.min(3, h)); c.snd('tick'); if (q.heat && foodsIn(q).length && !q.heatS) { q.heatS = 1; say(q.D.m !== 'pan' && !boiling(q) ? T('물이 끓으면 재료가 익기 시작해요', 'Food starts cooking once the water boils') : T('익는 중이에요. 「알맞아요」가 뜨면 접시로 끌어요', 'Cooking now. When it says “Just right”, drag it to the plate'), 3); } paint(q); };
  const togLid = pi => { const q = P[pi]; if (!q || q.done || ph !== 'cook') return; q.lid = !q.lid; c.snd('tick'); paint(q); };
  const plateRes = q => { let raw = 0, burnt = 0; for (const s of q.need) { if (s.t <= 0) continue; if (!s.in || s.el < s.t) raw = 1; else if (s.el > s.t + WS) burnt = 1; } return burnt ? 'burnt' : raw ? 'raw' : 'ok'; };
  const reqMet = (q, r) => { if (!r) return true; if (r === 'salt1') return q.salt === 1; for (const s of q.need) { if (s.t <= 0 || !s.in) continue; const mid = s.t + WS / 2; if (r === 'well' ? s.el < mid - 0.25 : s.el > mid + 0.25) return false; } return true; };
  const RESN = { ok: ['알맞음', 'Just right'], raw: ['덜 익음', 'Undercooked'], burnt: ['탐', 'Burnt'] }, TEAN = { ok: ['알맞음', 'Just right'], raw: ['연함', 'Too weak'], burnt: ['너무 진함', 'Too strong'] };
  const showPlate = q => { const pl = q.el.pl; pl.className = 'kc-plate r-' + q.done; pl.querySelector('.pf').textContent = q.done === 'burnt' && q.kind !== 'side' ? '🌑' : dishE(q); pl.querySelector('em').textContent = (q.kind === 'side' ? TEAN : RESN)[q.done][en ? 1 : 0]; };
  const plate = pi => { const q = P[pi]; if (!q || q.done || ph !== 'cook') return false; if (!foodsIn(q).length) { say(T('아직 빈 냄비예요', 'The pot is still empty')); return false; }
    q.done = plateRes(q); q.heat = 0; showPlate(q);
    if (q.kind !== 'side' && q.D.salt && q.done !== 'burnt') { q.wantSalt = true; q.el.pl.insertAdjacentHTML('beforeend', '<span class="sl"><button data-s="1">' + T('소금 한 꼬집', '1 pinch') + '</button><button data-s="2">' + T('두 꼬집', '2 pinches') + '</button></span>'); say(T('간을 맞춰요. 소금은 얼마나 넣을까요? 주문 쪽지를 봐요', 'Season it. How much salt? Check the order note'), 4); }
    else say(q.done === 'ok' ? T('알맞게 담았어요', 'Plated just right') : q.done === 'raw' ? T('조금 덜 익었어요', 'A little undercooked') : T('타 버렸어요', 'It burnt'));
    c.snd(q.done === 'ok' ? 'ding' : 'pop'); if (moreB) moreB.style.display = 'none'; const ns = P.findIndex(z => !z.done); if (ns >= 0) sel = ns; P.forEach(paint); check(); return true; };
  const salt = (pi, n) => { const q = P[pi]; if (!q || !q.wantSalt || q.salt) return; q.salt = n; q.wantSalt = false; const sl = q.el.pl.querySelector('.sl'); if (sl) sl.remove(); c.snd('tick'); say(n === 1 ? T('소금 한 꼬집', 'One pinch') : T('소금 두 꼬집', 'Two pinches')); check(); };
  const addMore = () => { if (moreTaken || ph !== 'cook' || P.some(q => q.done) || !(X.takeMore && X.takeMore())) { if (moreB) moreB.style.display = 'none'; return; } moreTaken = true; P.splice(1, 0, mkPot('more', M)); chipsOf(); drawTray(); drawStove(); if (moreB) moreB.style.display = 'none'; c.snd('tick'); say(T('냄비가 하나 더! 두 냄비 다 알맞게 담으면 한 그릇 더 생겨요', 'One more pot! Plate both just right for an extra serving'), 3); };
  function check() { if (ph !== 'cook' || P.some(q => !q.done || q.wantSalt)) return; end(false); }
  function end(late) { ph = 'end'; for (const q of P) if (!q.done) { q.done = plateRes(q); q.heat = 0; showPlate(q); } P.forEach(paint); tray.style.opacity = '.4';
    const main = P.find(q => q.kind === 'main'), more = P.find(q => q.kind === 'more'), sd = P.find(q => q.kind === 'side'), spill = P.reduce((a, q) => a + q.spill, 0), lidBad = P.some(q => q.D.lid && q.kind !== 'side' && !q.lidUsed), ordBad = P.some(q => q.ordBad), popL = P.some(q => q.pop);
    const r1 = reqMet(main, req), r2 = sd ? reqMet(sd, req2) : true, mainsOk = [main, more].every(q => !q || (q.done === 'ok' && reqMet(q, req)));
    const s1 = late ? 0 : 1, s2 = mainsOk ? 1 : 0, s3 = lv <= 1 ? (!spill && !lidBad && !popL ? 1 : 0) : lv === 2 ? (!ordBad && !spill ? 1 : 0) : lv === 3 ? (sd && sd.done === 'ok' ? 1 : 0) : (r1 && r2 && sd && sd.done === 'ok' ? 1 : 0);
    score = s1 ? 1 + s2 + (s2 ? s3 : 0) : 0;
    const nm = en ? R[2] : R[1], got = main.done === 'ok' ? (r1 ? T(nm + ', 알맞게 익었어요.', nm + ' came out just right.') : T(nm + ', 잘 익었는데 주문과 달라요.', nm + ' is cooked, but not as ordered.')) : main.done === 'raw' ? T(nm + ', 덜 익었어요.', nm + ' was undercooked.') : T(nm + ', 탔어요.', nm + ' burnt.');
    const nx = spill ? T('다음엔 끓으면 중불로 줄여 봐요.', 'Next time, turn it down to medium once it boils.') : ordBad ? T('다음엔 차례를 지켜 봐요. ', 'Next time, mind the order. ') + (M.why ? M.why[en ? 1 : 0] + '.' : '') : main.done === 'raw' ? T('다음엔 「알맞아요」가 뜰 때까지 조금 더 기다려 봐요.', 'Next time, wait for “Just right”.') : main.done === 'burnt' ? T('다음엔 「알맞아요」가 뜨면 바로 접시로 옮겨 봐요.', 'Next time, plate it as soon as it says “Just right”.')
      : lidBad || popL ? T('다음엔 뚜껑을 덮어 봐요.', 'Next time, try the lid.') : !r1 ? T('다음엔 주문 쪽지를 다시 읽어 봐요.', 'Next time, read the order note again.') : sd && sd.done !== 'ok' ? T('다음엔 보리차 주전자도 같이 봐요.', 'Next time, keep an eye on the kettle too.') : lv >= 2 && !moreTaken ? T('다음엔 냄비를 하나 더 올려 볼까요?', 'Next time, try one more pot?') : T('다음엔 다른 요리도 해 봐요.', 'Next time, try another dish.');
    const fk = M.pop ? 'pop' : M.m === 'steam' ? 'steam' : lv >= 2 && M.m === 'water' && M.steps.length > 1 ? 'order' : M.m === 'water' || side ? (P.some(q => q.lidUsed && q.D.m !== 'pan') ? 'lid' : 'water') : 'pan';
    factEl.textContent = (en ? '💡 Did you know? ' : '💡 알고 있었나요? ') + KFACT[fk][en ? 1 : 0];
    res = { lv, cond, story, req, req2, guest, guest2, main: main.done, more: more ? more.done : null, side: sd ? sd.done : null, reqOk: r1, req2Ok: r2, ordBad: !!ordBad, spill, score, moreTaken, line: (late ? T('시간이 다 됐어요. ', 'Time’s up. ') : '') + got + ' ' + nx, fact: fk, t: +t.toFixed(1) };
    c.say(res.line); c.snd(score >= 3 ? 'done' : score ? 'ding' : 'buzz'); endT = 3.4; }
  /* 끌기: 재료 → 냄비 · 냄비(그릇 그림) → 접시 · 누르기만 해도 됨(재료 누르고 냄비 누르기 · 담기 단추) */
  let drag = null, gh = null;
  const under = (x, y, cls) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest(cls) : null; };
  const hi = el => { for (const z of c.mg.querySelectorAll('.drop')) if (z !== el) z.classList.remove('drop'); if (el && c.mg.contains(el)) el.classList.add('drop'); };
  const pm = e => { if (!drag) return; if (!drag.mv && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.mv = 1; if (!gh) { gh = document.createElement('div'); gh.className = 'twn-kc-gh'; document.body.appendChild(gh); } gh.textContent = drag.e; gh.style.display = ''; } if (!drag.mv) return; gh.style.left = e.clientX + 'px'; gh.style.top = e.clientY + 'px'; hi(under(e.clientX, e.clientY, drag.k === 'c' ? '.kc-pot' : '.kc-plate')); };
  const unhook = () => { removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); removeEventListener('pointercancel', pu); };
  const pu = e => { if (!drag) return; const d = drag; drag = null; if (gh) gh.style.display = 'none'; hi(null); unhook(); if (!d.mv || ph !== 'cook') return;
    if (d.k === 'c') { const pt = under(e.clientX, e.clientY, '.kc-pot'); if (pt && stv.contains(pt)) put(+pt.dataset.p, d.i); } else { const pl = under(e.clientX, e.clientY, '.kc-plate'); if (pl && pls.contains(pl)) plate(d.i); } };
  const startDrag = (k, i, em, e) => { drag = { k, i, e: em, x: e.clientX, y: e.clientY, mv: 0 }; unhook(); addEventListener('pointermove', pm); addEventListener('pointerup', pu); addEventListener('pointercancel', pu); };
  const pdTray = e => { const b = e.target.closest('.ch'); if (!b || ph !== 'cook') return; e.preventDefault(); const i = +b.dataset.c; if (chipSel >= 0 && tray.children[chipSel]) tray.children[chipSel].classList.remove('sel'); chipSel = chipSel === i ? -1 : i; if (chipSel >= 0) b.classList.add('sel'); startDrag('c', i, CH[i].e, e); };
  const pdStove = e => { const pt = e.target.closest('.kc-pot'); if (!pt || ph !== 'cook') return; const pi = +pt.dataset.p, q = P[pi]; if (!q) return; e.preventDefault(); sel = pi; const hb = e.target.closest('[data-h]');
    if (hb) setHeat(pi, +hb.dataset.h); else if (e.target.closest('.lt')) togLid(pi); else if (e.target.closest('.pt')) plate(pi); else if (chipSel >= 0) put(pi, chipSel); else if (foodsIn(q).length && e.target.closest('.vs')) { let em = ''; for (const s of foodsIn(q)) em += s.e; startDrag('p', pi, em, e); }
    P.forEach(paint); };
  const pdPl = e => { const b = e.target.closest('[data-s]'); if (!b) return; e.preventDefault(); salt(+b.closest('.kc-plate').dataset.p, +b.dataset.s); };
  const pdMore = e => { e.preventDefault(); addMore(); };
  tray.addEventListener('pointerdown', pdTray); stv.addEventListener('pointerdown', pdStove); pls.addEventListener('pointerdown', pdPl); if (moreB) moreB.addEventListener('pointerdown', pdMore);
  if (c.go) c.go.style.display = 'none';
  say(lv >= 2 ? T('쪽지를 보고 재료를 차례대로 냄비로 끌어 넣어요', 'Read the note, then drag the ingredients into the pot in order') : T('재료를 냄비로 끌어 넣고 불을 켜요', 'Drag the ingredient into the pot, then turn on the heat'), 4);
  /* 시험(봇)용: 상태 읽기 · 손잡이 */
  const dbg = { get cfg() { return { lv, cond, story, req, req2, guest, guest2, side, pots: P.map(q => q.kind), chips: CH.map(h => h.e), ws: WS }; }, get res() { return res; }, get ph() { return ph; },
    state: () => P.map(q => ({ kind: q.kind, st: q.done ? 'done:' + q.done : potSt(q), T: Math.round(q.T), heat: q.heat, lid: q.lid, water: q.water, el: q.need.map(s => +s.el.toFixed(2)), need: q.need.map(s => s.t), lb: q.lb, wantSalt: q.wantSalt })),
    put: (pi, ci) => put(pi, ci), heat: (pi, h) => setHeat(pi, h), lid: pi => togLid(pi), plate: pi => plate(pi), salt: (pi, n) => salt(pi, n), more: () => addMore(),
    ff: (pi, k) => { const q = P[pi]; if (!q || q.done) return; q.water = true; q.T = 100; q.oil = true; q.lidUsed = 1; for (const s of q.need) { s.in = true; if (s.t > 0) s.el = k === 'raw' ? s.t * 0.3 : k === 'burnt' ? s.t + WS + 1 : k === 'well' ? s.t + WS * 0.75 : k === 'light' ? s.t + WS * 0.2 : s.t + WS * 0.45; } paint(q); } };
  return { go: '', extra: () => res, dbg,
    down() { if (ph === 'cook') plate(sel); },
    key(code, rep) { if (ph !== 'cook') return false; const d = /^(Digit|Numpad)([1-6])$/.exec(code); if (d) { if (!rep) { const n = +d[2], ws = P.findIndex(q => q.wantSalt); if (ws >= 0 && n <= 2) salt(ws, n); else put(sel, n - 1); } return true; }
      if (code === 'ArrowLeft' || code === 'KeyA') { if (!rep) setHeat(sel, P[sel].heat - 1); return true; } if (code === 'ArrowRight' || code === 'KeyD') { if (!rep) setHeat(sel, P[sel].heat + 1); return true; }
      if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'KeyW' || code === 'KeyS') { if (!rep) { const dn = code === 'ArrowDown' || code === 'KeyS' ? 1 : -1; let k = sel; for (let i = 0; i < P.length; i++) { k = (k + dn + P.length) % P.length; if (!P[k].done) break; } sel = k; P.forEach(paint); } return true; }
      if (code === 'KeyL') { if (!rep) togLid(sel); return true; } return false; },
    tick(dt) { if (ph === 'end') { if (endT > 0 && (endT -= dt) <= 0) c.finish(score); return; }
      t += dt; if (msgT > 0) msgT -= dt;
      for (const q of P) { if (q.done) continue; const bo = boiling(q);
        if (q.D.m !== 'pan' && q.water) { if (q.heat) q.T = Math.min(100, q.T + HUP[q.heat] * (q.lid ? 1.5 : 1) * dt); else q.T = Math.max(20, q.T - 3 * dt); }   /* 물은 100℃에서 멈춤(끓음) · 뚜껑 = 1.5배 빨리 데워짐 */
        if (q.lid) q.lidUsed = 1;
        let rate = 0; if (q.D.m === 'pan') rate = q.heat ? HP[q.heat] * (q.oil ? 1 : 1.6) : 0; else if (!q.water) rate = q.heat ? 2 * HP[q.heat] : 0; else if (bo) rate = HW[q.heat] * (q.D.m === 'steam' && !q.lid ? 0.5 : 1);
        if (rate) for (const s of q.need) if (s.in && s.t > 0) s.el += rate * dt;
        if (q.heat && !q.warnS && ((q.D.m === 'pan' && !q.oil) || (q.D.m === 'steam' && !q.water)) && foodsIn(q).length) { q.warnS = 1; q.ordBad = 1; say(M.why ? M.why[en ? 1 : 0] : '', 3); }   /* 기름·물 없이 불 = 들러붙어 빨리 탐 */
        if (q.D.m === 'steam' && bo && !q.lid && foodsIn(q).length && !q.lidS) { q.lidS = 1; say(T('뚜껑을 덮어야 김이 갇혀서 잘 익어요', 'Put the lid on to trap the steam'), 3); }
        if (bo && q.heat === 3) { q.sp += dt; if (q.sp > 2.5) { q.sp = 0; q.spill++; c.snd('buzz'); pop(q.el.root, 'spill'); say(T('넘쳤어요! 물은 끓으면 더 뜨거워지지 않아요. 불을 줄여요', 'It boiled over! Boiling water won’t get hotter — turn it down'), 3); } } else if (q.sp > 0) q.sp = Math.max(0, q.sp - dt);
        if (q.D.pop && !q.lid && q.heat && !q.pop) { for (const s of q.need) if (s.in && s.t > 0 && s.el > 2) { q.pop = 1; c.snd('pop'); say(T('팝콘이 튀어 나가요! 뚜껑을 덮어요', 'Popcorn is flying out! Put the lid on'), 3); break; } }
        const st0 = q.st, st = potSt(q); q.st = st; if (st !== st0 && msgT <= 0) { if (st === 'ok') { c.snd('tick'); say(T('알맞아요! 접시로 끌어 담아요', 'Just right! Drag it to the plate')); } else if (st === 'warn') say(T('곧 타요!', 'About to burn!')); }
        paint(q); }
      if (t >= 60) { say(T('시간이 다 됐어요', 'Time’s up')); end(true); } },
    dispose() { tray.removeEventListener('pointerdown', pdTray); stv.removeEventListener('pointerdown', pdStove); pls.removeEventListener('pointerdown', pdPl); if (moreB) moreB.removeEventListener('pointerdown', pdMore); unhook(); if (gh) gh.remove(); gh = null; drag = null; } };
}

const MK = { toss: mkToss, spread: mkSpread, gauge: mkGauge, tug: mkTug, ripe: mkRipe, plant: mkPlant, cut: mkCut, salt: mkSalt, comb: mkComb, dig: mkDig, sort: mkSort, cover: mkCover, order: mkOrder, feed: mkFeed, lens: mkLens, bend: mkBend, still: mkStill, gate: mkGate, kitchen: mkKitchen };
// 놀이 하나 열기: o = { root(.pb — 안에 .mg · .msg · .go가 있어야 함), k(일 갈래), en, zw(솜씨 배수 = 초록 칸·시간 · 부엌은 여유 시간), sea, x(놀이별 자료), sfx(k), tone(...), grade(false = 결과 말 없이 바로 끝 — 부엌·투호), onEnd(점수 0~3),
//   lv(LADDER-2 도전 칸 1~4 · 조건 값 = town_lad.js LADP) · onRec(점수, 모은 수) → { lines: [내 최고 줄 · 다음 판 줄], neu } | null(끝 창에 덧붙임) · onBest(줄 요소) = 새 내 최고 연출 }
export function createMini(kind, o) { css();
  const c = { root: o.root, mg: o.root.querySelector('.mg'), msgEl: o.root.querySelector('.msg'), go: o.root.querySelector('.go'), en: !!o.en, zw: Math.max(1, o.zw || 1), k: o.k, sea: o.sea, x: o.x || null, done: false, lv: Math.max(1, Math.min(4, o.lv | 0 || 1)) }; c.lp = ladVal(kind, c.lv);   /* LADDER-2 lp = 이 칸의 조건 값(없는 놀이 = null → 놀이 틀은 1칸 값으로) */   /* x = 놀이별 자료(부엌: 요리법·사다리·손님·날씨 · KITCHEN-1) */
  c.T = (ko, e2) => (c.en ? e2 : ko); c.say = s => { if (c.msgEl && c.msgEl.textContent !== s) c.msgEl.textContent = s; }; c.snd = k => { if (o.sfx) o.sfx(k); }; c.tone = (...a) => { if (o.tone) o.tone(...a); };
  let endT = -1, score = 0, cntT = -1, recR = null;
  c.finish = ok => { if (c.done) return; c.done = true; score = Math.max(0, Math.min(3, ok | 0)); if (o.grade === false) { endT = 0; return; } c.root.classList.add('mg-end'); const f9 = FACT[kind === 'plant' || kind === 'cut' ? kind : c.k], tl = g.tail ? g.tail() : ''; c.say(gradeText(score, c.en) + (tl ? ' ' + tl : f9 ? (c.en ? ' 💡 Did you know? ' : ' 💡 알고 있었나요? ') + f9[c.en ? 1 : 0] : '')); c.snd(score >= 3 ? 'done' : score ? 'ding' : 'buzz'); endT = f9 || tl ? 3.2 : 0.8;   /* PLAY-3: 끝 = 결과 + 사실 한 줄(3.2초) */
    if (o.onRec) { try { recR = o.onRec(score, cntNow()); } catch (er) { console.warn('[town_minigame] 기록 오류', er); recR = null; }   /* LADDER-2 끝 창 = 내 최고 한 줄(+ 칸이 바뀌면 다음 판 한 줄) · 새 최고 = 작은 연출 */
      if (recR && recR.lines && recR.lines.length) { const el = document.createElement('div'); el.className = 'mgrec' + (recR.neu ? ' neu' : ''); for (const t of recR.lines) { const d = document.createElement('div'); d.textContent = t; el.appendChild(d); } const ms = c.root.querySelector('.msg'); if (ms) ms.after(el); else c.root.appendChild(el); if (recR.neu && o.onBest) o.onBest(el); endT = Math.max(endT, recR.neu ? 3.6 : 3.2); } } };
  const cntNow = () => (cntT >= 0 ? cntT : g && g.cnt ? g.cnt() | 0 : -1);   /* 모은 수(딸기·감자·고르게 편 김…) · 모르는 놀이 = -1 */
  if (!MK[kind]) console.warn('[town_minigame] 모르는 놀이 갈래 → 익은 것 고르기로:', kind, o.k);   /* 옛 기본값 mkBar(타이밍 막대)는 10-24에 지움 */
  const g = (MK[kind] || mkRipe)(c);
  const pd = e => { e.preventDefault(); if (!c.done) g.down(); }, pu = () => { if (g.up) g.up(); };
  if (c.go && !g.go) c.go.style.display = 'none';   /* 손으로 하는 놀이(끌기·나누기) = 큰 단추 없음 */
  if (c.go && g.go) { c.go.textContent = g.go; c.go.addEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.addEventListener(ev, pu); }
  return { kind,
    get ok() { return score; }, get done() { return c.done; }, get extra() { return g.extra ? g.extra() : null; }, get dbg() { return g.dbg || null; }, get lv() { return c.lv; }, get lp() { return c.lp; }, get cnt() { return cntNow(); }, get rec() { return recR; },
    finish(ok, n) { if (c.done) return; if (n != null) cntT = Math.max(0, n | 0); c.finish(ok); },   /* 시험(town_ladder.cjs): 점수·모은 수를 정해 끝내기 — 끝 창·기록 길은 그대로 */
    down() { if (!c.done) g.down(); }, up() { if (!c.done && g.up) g.up(); }, key(code, rep) { return !c.done && g.key ? !!g.key(code, rep) : false; },
    tick(dt) { if (dt > 0.1) dt = 0.1; if (!c.done) { g.tick(dt); return; } if (endT >= 0 && (endT -= dt) <= 0) { endT = -1; o.onEnd(score); } },
    dispose() { c.done = true; endT = -1; if (g.dispose) g.dispose(); if (c.go) { c.go.removeEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.removeEventListener(ev, pu); } } };
}
