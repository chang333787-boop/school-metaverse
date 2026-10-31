// 📷 실제 사진 표(REALPIC-1 · 갯벌 사진(LIVING-1)과 같은 길을 곤충·야생동물·물고기·식물·자연 장소로 넓힘 — 한 종류에 한 장): 놀이 코드와 떼어 둔 자료
//   창(도감 카드 · 관찰 창 · 장소 카드) 안에서만 보임 — 3D 세상에는 붙이지 않음(실사 금지 규칙) · 파일 = v2/img/photos/ · 출처 = 같은 폴더 CREDITS.md와 같게 · 사진 밑에 출처 한 줄을 꼭 보임
//   열쇠 = 도감 열쇠 그대로('bug:<id>' · 'wild:<id>' · 'fish:<id>' · 물건 그림 '🍓') · 장소 = 'pl:<갈래>'(PHOTO_OF가 이름으로 찾음) · 한 장을 여러 열쇠가 같이 쓰면 SAME
//   사진은 창을 열 때 <img loading="lazy">로만 부름(처음 짓기에 실리지 않음) · 아직 못 본 칸에는 사진을 붙이지 않음(부르는 쪽이 찾은 칸에만 photoHtml)
//   새 사진: 위키미디어 공용 · 자유 이용(CC0 · 퍼블릭 도메인 · CC BY · CC BY-SA · 공공누리 1유형)만 · 사람 얼굴·아이·남의 집 X · 표본·죽은 동물 X · 가로 800 · 장당 120KB 안 · 이 표 한 줄 + CREDITS.md 두 곳(v2 · tools/export/overlay) 한 줄 · 시험 tools/harness/town_photocheck.mjs
export const PHOTOS_V = 1;
const T2 = (ko, en) => [ko, en];
// 이용 허락 글: 열쇠 셋만 풀어 씀 · 그 밖(CC BY 4.0 · CC BY-SA 3.0 …)은 이름 그대로
const LIC = { CC0: T2('CC0(퍼블릭 도메인)', 'CC0 (public domain)'), PD: T2('퍼블릭 도메인', 'Public domain'), KOGL1: T2('공공누리 1유형(출처 표시)', 'KOGL Type 1 (attribution)') };
const P = (src, ko, en, by, lic, url) => ({ src, t: T2(ko, en), by, lic, url });
export const PHOTOS = {
  gochang: P('mudflat_gochang.jpg', '고창 갯벌', 'Gochang tidal flat', '문화재청', 'KOGL1', 'https://commons.wikimedia.org/wiki/File:Gochang_tidal_flat_01.jpg'),
  saemangeum: P('seawall_saemangeum.jpg', '새만금 방조제 — 바다를 막은 둑', 'Saemangeum seawall — a dike that walls off the sea', 'Kussy', 'CC BY-SA 2.1 jp', 'https://commons.wikimedia.org/wiki/File:Saemangeum_seawall.JPG'),
  suncheon: P('mudflat_suncheon.jpg', '순천만 갯벌의 게와 구멍', 'Crabs and burrows on the Suncheon Bay mudflat', 'lumoplank', 'CC0', 'https://commons.wikimedia.org/wiki/File:Suncheon_Bay_Natural_Reserve_-_SuncheonBNG2975.jpg'),
  /* 곤충 */
  'bug:cabbagewhite': P('bug_cabbagewhite.jpg', '배추흰나비', 'Cabbage white', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Small_white_(Pieris_rapae)_Sweden.jpg'),
  'bug:ladybird': P('bug_ladybird.jpg', '칠성무당벌레', 'Seven-spot ladybird', 'Mkrc85', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Seven-spotted_ladybug.jpg'),
  'bug:honeybee': P('bug_honeybee.jpg', '꿀벌', 'Honeybee', 'Ivar Leidus', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Apis_mellifera_-_Prunus_padus_-_Keila.jpg'),
  'bug:swallowtail': P('bug_swallowtail.jpg', '호랑나비', 'Asian swallowtail', 'Peellden', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Papilio_xuthus_20130804.jpg'),
  'bug:cicada': P('bug_cicada.jpg', '참매미', 'Robust cicada', 'Alpsdake', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Oncotympana_maculaticollis_(Mount_Ibuki_s2).jpg'),
  'bug:rhino': P('bug_rhino.jpg', '장수풍뎅이(수컷)', 'Rhinoceros beetle (male)', 'Joi Ito', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Kabutomushi-20070710.jpg'),
  'bug:strider': P('bug_strider.jpg', '소금쟁이', 'Water strider', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Water_strider_(Gerridae_sp.)_Makiling.jpg'),
  'bug:scarlet': P('bug_scarlet.jpg', '고추잠자리(수컷)', 'Scarlet skimmer (male)', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Ruddy_marsh_skimmer_(Crocothemis_servilia_servilia)_male_Kanha.jpg'),
  'bug:grasshopper': P('bug_grasshopper.jpg', '벼메뚜기', 'Rice grasshopper', 'Charles J. Sharp', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Japanese_rice_grasshopper_(Oxya_japonica).jpg'),
  'bug:cricket': P('bug_cricket.jpg', '왕귀뚜라미', 'Field cricket', 'Phonon.b', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Teleogryllus_emma_female_on_sidewalk.jpg'),
  'bug:mantisegg': P('bug_mantisegg.jpg', '사마귀 알집', 'Mantis egg case', 'Daniel Ballmer', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Tenodera_angustipennis_eggs.jpg'),
  'bug:ladywinter': P('bug_ladywinter.jpg', '틈에 모여 겨울을 나는 무당벌레', 'Ladybirds huddled in a crack for the winter', 'Gilles San Martin', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Harmonia_axyridis_winter_aggregate_(3014117486).jpg'),
  /* 야생동물 */
  'wild:chipmunk': P('wild_chipmunk.jpg', '다람쥐(경주)', 'Siberian chipmunk (Gyeongju, Korea)', 'J. Patrick Fischer', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Asiatisches_Streifenhoernchen_(cropped).jpg'),
  'wild:waterdeer': P('wild_waterdeer.jpg', '고라니(경기도 마차산)', 'Water deer (Gyeonggi-do, Korea)', 'Daniel.j.silvia', 'CC0', 'https://commons.wikimedia.org/wiki/File:Korean_Water_Deer.JPG'),
  'wild:heron': P('wild_heron.jpg', '왜가리(부산 시민공원)', 'Grey heron (Busan, Korea)', 'Basile Morin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Grey_heron_eating_fish_near_a_pond_of_Busan_Citizens_Park_in_South_Korea.jpg'),
  'wild:otter': P('wild_otter.jpg', '수달', 'Eurasian otter', 'Bernard Landgraf', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Fischotter,_Lutra_Lutra.JPG'),
  'wild:mallard': P('wild_mallard.jpg', '청둥오리 수컷과 암컷(대구 신천)', 'Mallard male and female (Daegu, Korea)', 'Visviva', 'PD', 'https://commons.wikimedia.org/wiki/File:Daegu_Sincheon_ducks.jpg'),
  'wild:spotbill': P('wild_spotbill.jpg', '흰뺨검둥오리(탄천)', 'Spot-billed duck (Tancheon, Korea)', 'Hillpigeon', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:%EC%84%9C_%EC%9E%88%EB%8A%94_%ED%9D%B0%EB%BA%A8%EA%B2%80%EB%91%A5%EC%98%A4%EB%A6%AC.jpg'),
  'wild:frog': P('wild_frog.jpg', '참개구리', 'Black-spotted pond frog', 'Alpsdake', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Pelophylax_nigromaculatus_s1.JPG'),
  'wild:egret': P('wild_egret.jpg', '중대백로(서울)', 'Great egret (Seoul, Korea)', 'Clementina', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Ardea_modesta,_Seoul.jpg'),
  'wild:owl': P('wild_owl.jpg', '솔부엉이', 'Northern boobook', 'muangpaisuetrong', 'CC0', 'https://commons.wikimedia.org/wiki/File:Ninox_japonica_362852827.jpg'),
  'wild:sparrow': P('wild_sparrow.jpg', '참새(안동 초가지붕)', 'Tree sparrow (thatched roof, Andong, Korea)', 'Mathew Schwartz', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Sparrow_On_A_Thatch_Roof_(203233485).jpeg'),
  /* 물고기(민어는 빔 — 살아 있는 모습의 자유 이용 사진이 없고 시장·요리 사진뿐) */
  'fish:dodari': P('fish_dodari.jpg', '도다리(문치가자미) — 모래 바닥에 붙어 숨은 모습(수족관)', 'Marbled flounder hiding on sand (aquarium)', 'Totti', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pseudopleuronectes_yokohamae_Kaikyokan.jpg'),
  'fish:bollak': P('fish_bollak.jpg', '볼락', 'Rockfish', 'Daiju Azuma', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Sebastes_Inermis.jpg'),
  'fish:jeongaengi': P('fish_jeongaengi.jpg', '전갱이(수족관)', 'Japanese jack mackerel (aquarium)', 'Totti', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Trachurus_japonicus_Umi-Tamago.jpg'),
  'fish:jeoneo': P('fish_jeoneo.jpg', '전어(수조 속)', 'Gizzard shad (in a tank)', 'Jjw', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Konosirus_punctatus_in_store.jpg'),
  'fish:godeungeo': P('fish_godeungeo.jpg', '고등어 떼(수족관)', 'A school of chub mackerel (aquarium)', 'Dragan Maksimovic', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:MontereyBayAquarium.jpg'),
  'fish:bangeo': P('fish_bangeo.jpg', '방어', 'Japanese amberjack', 'Izuzuki', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Buri.jpg'),
  'fish:daegu': P('fish_daegu.jpg', '대구(수족관)', 'Pacific cod (aquarium)', 'Totti', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Gadus_macrocephalus_Kamo_4.jpg'),
  'fish:mangdung': P('fish_mangdung.jpg', '망둥어(문절망둑 · 수족관)', 'Yellowfin goby (aquarium)', 'Totti', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Acanthogobius_flavimanus_Nakagawa.jpg'),
  'fish:bungeo': P('fish_bungeo.jpg', '붕어(수족관)', 'Crucian carp (aquarium)', 'KENPEI', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Carassius_auratus_grandoculis2.jpg'),
  'fish:pirami': P('fish_pirami.jpg', '피라미 수컷(알 낳을 때의 고운 빛깔)', 'Pale chub male in breeding colours', 'かわむっちゃん', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:%E3%82%AA%E3%82%A4%E3%82%AB%E3%83%AF.JPG'),
  'fish:megi': P('fish_megi.jpg', '메기', 'Amur catfish', '뭘로할까', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:%ED%95%9C%EA%B5%AD%EB%A9%94%EA%B8%B0.jpg'),
  /* 바다 친구 */
  '🐙': P('sea_octopus.jpg', '문어(바닷속 바위 곁)', 'Common octopus by the rocks', 'Diego Delso', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pulpo_com%C3%BAn_(Octopus_vulgaris),_Parque_natural_de_la_Arr%C3%A1bida,_Portugal,_2020-07-21,_DD_33.jpg'),
  /* 식물·작물 */
  '🍓': P('plant_strawberry.jpg', '밭에서 익은 딸기', 'Strawberries ripening in a garden', 'Kora27', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Erdbeeren_im_Garten_2H1A9599WI.jpg'),
  '🥔': P('plant_potato.jpg', '갓 캔 감자', 'Freshly dug potatoes', 'Rasbak', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Aardappel_%27Dor%C3%A9%27_(Solanum_tuberosum_%27Dor%C3%A9%27).jpg'),
  '🍚': P('plant_rice.jpg', '가을 논의 누렇게 익은 벼(경주)', 'Ripe rice paddies in autumn (Gyeongju, Korea)', 'riNux', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Korea-Gyeongju-Rice_paddy_field-01.jpg'),
  '🌱': P('plant_seedling.jpg', '모를 심은 논', 'Paddy field with young rice seedlings', 'Jeevan naidu', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Karthalipalem.jpg'),
  '🍐': P('plant_pear.jpg', '배나무에 열린 배', 'Asian pears on the tree', 'PumpkinSky', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pyrus_pyrifolia_fruit_on_tree_1-PS_LR.jpg'),
  '🥬': P('plant_cabbage.jpg', '밭에서 자라는 배추(서울)', 'Napa cabbage growing in a field (Seoul, Korea)', 'Comedora', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Brassica_rapa_3.jpg'),
  '🍄': P('plant_shiitake.jpg', '참나무 원목에서 자라는 표고버섯', 'Shiitake growing on oak logs', 'Sakurai Midori', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Lentinula_edodes_shiitake.JPG'),
  '🍃': P('plant_greens.jpg', '산나물 고사리의 어린 순(봄)', 'Young bracken shoots, a wild green (spring)', 'Thayne Tuason', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Pteridium_aquilinum_var._pubescens_fiddlehead_unfurling_in_spring.jpg'),
  '🥒': P('plant_cucumber.jpg', '덩굴에 달린 오이', 'A cucumber on the vine', 'Jerzy Opioła', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Cucumis_sativus.jpg'),
  '🥕': P('plant_carrot.jpg', '밭에서 거둔 당근', 'Carrots harvested in a field', 'AnRo0002', 'CC0', 'https://commons.wikimedia.org/wiki/File:20111023Karotten_Reilingen1.jpg'),
  '🍅': P('plant_tomato.jpg', '줄기에 달려 익어 가는 방울토마토', 'Cherry tomatoes ripening on the vine', 'JLPC', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Tomates_cerises_FR_2012.jpg'),
  '🌽': P('plant_corn.jpg', '수염이 난 옥수수 이삭', 'Ears of corn with silk on the plant', 'Dietmar Rabich', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Hausd%C3%BClmen,_Maisfeld_am_Sythener_Hellweg_--_2021_--_1840.jpg'),
  '🍠': P('plant_sweetpotato.jpg', '갓 캔 고구마와 줄기', 'Freshly dug sweet potatoes and vines', 'miya', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Ipomoea_batatasL_ja01.jpg'),
  '🌰': P('plant_pinecone.jpg', '땅에 떨어진 솔방울', 'Pine cones on the ground', 'Snorrringman', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Pine_tree_cones_in_torrent_bed.jpg'),
  /* 돌 */
  '⚫': P('rock_scoria.jpg', '송이(스코리아) — 구멍이 숭숭 난 화산 돌', 'Scoria — a volcanic rock full of holes', 'B. Domangue', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Scoria_-_Igneous_Rock.jpg'),
  /* 자연 장소·일터 */
  '🍯': P('place_apiary.jpg', '양봉장의 벌통', 'Beehives at an apiary', 'Myrabella', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Ruches_Haute-Savoie.jpg'),
  '🧂': P('place_saltpan.jpg', '신안 태평염전 — 바닷물을 말려 모은 소금', 'Taepyeong salt farm, Sinan — salt dried from seawater', 'Korea.net / Korean Culture and Information Service', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:KOCIS_Taepyeong_Salt_Field_(6235897561).jpg'),
  '🌿': P('place_laverfarm.jpg', '바다에 그물을 매단 해조류(파래) 양식장', 'A seaweed (green laver) farm with nets in the sea', 'Asturio Cantabrio', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Gokasyo_Port_Nori_cultivation_ac_(1).jpg'),
  '🥛': P('place_pasture.jpg', '풀밭의 젖소', 'A dairy cow on pasture', 'Keith Weller/USDA', 'PD', 'https://commons.wikimedia.org/wiki/File:Cow_female_black_white.jpg'),
  'pl:forest': P('place_forest.jpg', '한라산 숲길(제주) — 안개 낀 나무 계단', 'A forest trail on Hallasan, Jeju — wooden steps in the mist', 'Basile Morin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Wooden_staircase_steps_in_the_forest_of_Hallasan_Park_Eorimok_Trail_at_dusk_on_Jeju_Island_in_South_Korea.jpg'),
  'pl:hill': P('place_hill.jpg', '가을 산의 숲(설악산)', 'An autumn mountain forest (Seoraksan, Korea)', 'gary4now', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Seoraksan_National_Park,_Korea_-_panoramio_-_gary4now.jpg'),
  'pl:summit': P('place_summit.jpg', '금정산 고당봉 정상(부산) — 내려다본 마을', 'Godangbong summit, Geumjeongsan (Busan) — looking down on the town', 'Rémi Cormier', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Godang-bong.jpg'),
  'pl:river': P('place_river.jpg', '섬진강(하동) — 모래톱이 쌓인 강', 'Seomjin River near Hadong — a river with sandbars', 'Marco Schmidt', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Seomjingang_MS3672.JPG'),
  'pl:lake': P('place_lake.jpg', '가을의 안동호', 'Andong Lake in autumn', 'Robert (Picasa)', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Korea-Andong-Andong_Lake_in_autumn-01.jpg'),
  'pl:pond': P('place_pond.jpg', '경주 불국사 반야연지 연못', 'Banya pond at Bulguksa, Gyeongju', 'Basile Morin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Banya_yeonji_pond_water_reflection_of_bridge_and_trees_under_blue_sky_at_Bulguksa_Gyeongju_South_Korea.jpg'),
  'pl:sea': P('place_sea.jpg', '동해 바다의 해돋이', 'Sunrise over the East Sea, Korea', 'Clementina', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Full-orbed_sunrise_over_East_Sea_in_South_Korea.JPG'),
  'pl:beach': P('place_beach.jpg', '강릉 경포 해수욕장', 'Gyeongpo Beach, Gangneung', 'Christophe95', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Gyeongpo_Beach_1.jpg'),
  'pl:mushforest': P('place_mushforest.jpg', '숲 풀밭에 난 버섯(그물버섯)', 'A mushroom on the forest floor (porcini)', 'Jerzy Strzelecki', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Boletus_edulis_02a(js)_Lodz_(Poland).jpg'),
  'pl:ecostream': P('place_ecostream.jpg', '서울 양재천 — 되살린 하천에 모인 왜가리·백로·오리', 'Yangjaecheon, Seoul — herons, egrets and ducks on a restored stream', 'Jeon Han (Korea.net)', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Yangjaecheon_Stream_2016_06.jpg'),
  'pl:zelkova': P('place_zelkova.jpg', '담양의 큰 느티나무(정자나무)', 'A big zelkova tree in Damyang (a village shade tree)', 'Dalgial', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Zelkova_serrata.JPG'),
  'pl:ecobridge': P('place_ecobridge.jpg', '숲과 숲을 이은 생태 통로(싱가포르)', 'A wildlife bridge joining two forests (Singapore)', 'Benjamin P. Y-H. Lee (University of Kent)', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Wildlife_overpass_in_Singapore.jpeg'),
};
// 한 장을 같이 쓰는 열쇠(왼쪽 → 오른쪽 사진) · 갯벌 친구 게 둘 = 게 살펴보기 창이 이미 보이는 순천만 게 사진(town_shore.js)과 같게
export const SAME = { 'shore:chilge': 'suncheon', 'shore:nongge': 'suncheon' };
// 장소 이름 → 사진(앞에서부터 먼저 맞는 것 · 장소 카드 town_jobs.js openCard) · 자연 장소 + 자연에서 나는 것을 기르는 일터(작물 사진을 같이 씀) · 가게·시장·건물은 사진 X
export const PHOTO_OF = [[/갯벌/, 'gochang'], [/간척/, 'saemangeum'],
  [/버섯 ?숲/, 'pl:mushforest'], [/휴식년|오솔길|^숲$/, 'pl:forest'], [/정상/, 'pl:summit'], [/뒷산|^산$/, 'pl:hill'],
  [/생태 ?하천/, 'pl:ecostream'], [/^강$|강 하구|^하천$|개울/, 'pl:river'], [/호수|저수지/, 'pl:lake'], [/연못/, 'pl:pond'], [/해수욕장|해변/, 'pl:beach'], [/^바다$/, 'pl:sea'],
  [/정자나무/, 'pl:zelkova'], [/생태 ?통로/, 'pl:ecobridge'],
  [/염전/, '🧂'], [/과수원/, '🍐'], [/배추밭/, '🥬'], [/감자밭/, '🥔'], [/딸기/, '🍓'], [/표고/, '🍄'], [/양봉/, '🍯'], [/김 ?양식/, '🌿'], [/목장/, '🥛']];
export const photoKey = name => { for (const [re, k] of PHOTO_OF) if (re.test(String(name || ''))) return k; return null; };
export const photoOf = k => { const q = PHOTOS[k] ? k : SAME[k]; return q && PHOTOS[q] ? q : null; };
export const hasPhoto = k => !!photoOf(k);
const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 사진 한 장(창 안 HTML): 그림 + 무엇 + 출처 한 줄(지은이 · 이용 허락 · 원본 링크) · o.sm = 관찰 창 안 작은 판(키 낮게 · 글 한 줄) · 그림은 자르지 않고 틀 안 가운데(세로 사진도 머리·꼬리가 잘리지 않게)
export function photoHtml(k, en, o) { const q = photoOf(k); if (!q) return ''; if (typeof document !== 'undefined' && !document.getElementById('ph-css')) { const c9 = document.createElement('style'); c9.id = 'ph-css'; c9.textContent = PHOTO_CSS; document.head.appendChild(c9); }   /* 장소 카드 모듈(pc-css)이 없어도 같은 틀 */
  const P9 = PHOTOS[q], L = en ? 1 : 0, sm = !!(o && o.sm), src = new URL('../img/photos/' + P9.src, import.meta.url).href, lic = LIC[P9.lic] ? LIC[P9.lic][L] : P9.lic;
  return '<figure class="pc-ph' + (sm ? ' sm' : '') + '" data-ph="' + escH(q) + '"><img src="' + src + '" alt="' + escH(P9.t[L]) + '" loading="lazy" decoding="async"><figcaption><b>' + escH(P9.t[L]) + '</b>' + (sm ? ' — ' : '<br>') + (en ? 'Photo: ' : '사진: ') + escH(P9.by) + ' · ' + escH(lic) + ' · <a href="' + escH(P9.url) + '" target="_blank" rel="noopener">' + (en ? 'Wikimedia Commons' : '위키미디어 공용') + '</a></figcaption></figure>'; }
export const PHOTO_CSS = '.twn-p .pc-ph{margin:4px 0 10px;border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:var(--card);box-shadow:0 4px 0 var(--ink)}.twn-p .pc-ph img{display:block;width:auto;height:auto;max-width:100%;max-height:min(300px,36vh);margin:0 auto}.twn-p .pc-ph figcaption{padding:6px 10px;font-size:12.5px;color:var(--mut);line-height:1.4}.twn-p .pc-ph figcaption b{color:var(--ink);font-size:14px}.twn-p .pc-ph a{color:inherit}'
  + '.twn-p .pc-ph.sm{margin:10px 0 4px;border-width:2px;box-shadow:0 3px 0 var(--ink)}.twn-p .pc-ph.sm img{max-height:min(200px,26vh)}.twn-p .pc-ph.sm figcaption{font-size:12px;padding:4px 8px}.twn-p .pc-ph.sm figcaption b{font-size:13px}';
