// 🛂 장소 카드 자료(LIVING-1 · 사용자 10-17 '천연기념물 보호소처럼 이름만 있고 아무 역할 안 하는 곳' · '무엇을 하는 곳인지 · 어떤 도움 · 관련 직업'): 놀이 코드와 떼어 둔 자료표(town_skill.js·town_shore.js와 같은 결)
//   이름(아이 판 그대로) → 갈래 일곱(행정·안전·건강·배움·일터·가게·쉼) · 하는 일 한 줄 · 우리에게 주는 도움 한 줄 · 일하는 사람(직업 2~4 · 하는 일 한 줄) · 사진 자리(비워 둠 — 사진 일감이 채움)
//   사실만 · 이름에 맞는 일반 역할만(아이 판 장소 뜻을 바꾸지 않음) · 셈 X · 직업 그림 = 남녀 고르게(장소마다 번갈아) · 이모지는 갈래 머리에 하나
export const PLACES_V = 1;
const T2 = (ko, en) => [ko, en];

// 갈래: [아이콘, 이름, 영어, 띠 색]
export const PG = {
  admin: ['🏛', '행정·공공', 'Public services', '#3b6fb6'],
  safe: ['🚨', '안전·보호', 'Safety', '#c8433b'],
  health: ['🏥', '건강', 'Health', '#2f9a8a'],
  learn: ['📚', '배움', 'Learning', '#7d5bb8'],
  work: ['🏭', '일터', 'Workplaces', '#b86f2b'],
  shop: ['🛒', '가게', 'Shops', '#d6912a'],
  rest: ['🌳', '쉼·자연', 'Rest and nature', '#3f8f4e'],
};
export const PG_ORDER = ['admin', 'safe', 'health', 'learn', 'work', 'shop', 'rest'];

// 직업: [이름, 하는 일 한 줄, 모자 꼴(helmet 안전모 · cap 모자 · chef 조리모 · hard 작업모 · straw 밀짚모자 · none), 모자 색, 옷 색]
export const JOBS = {
  firefighter: [T2('소방관', 'Firefighter'), T2('불을 끄고 위험에 빠진 사람을 구해요', 'Puts out fires and rescues people'), 'helmet', 0xe0453a, 0xf2a93b],
  paramedic: [T2('구급대원', 'Paramedic'), T2('다치거나 아픈 사람을 돌보며 병원으로 옮겨요', 'Cares for hurt or sick people on the way to hospital'), 'cap', 0xf4f1e8, 0xf2a93b],
  police: [T2('경찰관', 'Police officer'), T2('순찰하며 마을의 안전을 지켜요', 'Patrols and keeps the town safe'), 'cap', 0x2b3a5c, 0x3d5a8a],
  traffic: [T2('교통경찰관', 'Traffic officer'), T2('횡단보도와 길에서 교통 안전을 지켜요', 'Keeps roads and crossings safe'), 'cap', 0x2b3a5c, 0xd9e04a],
  civil: [T2('공무원', 'Public officer'), T2('주민에게 필요한 서류를 확인하고 만들어 줘요', 'Checks and issues the papers people need'), 'none', 0, 0x5a7fb0],
  welfare: [T2('사회복지사', 'Social worker'), T2('도움이 필요한 이웃을 찾아가 상담해요', 'Visits and talks with neighbours who need help'), 'none', 0, 0x6aa86a],
  postman: [T2('집배원', 'Mail carrier'), T2('편지와 소포를 주소대로 배달해요', 'Delivers letters and parcels by address'), 'cap', 0x4f8fe0, 0xe8605a],
  postclerk: [T2('우체국 직원', 'Post office clerk'), T2('창구에서 우편물을 받고 보낼 곳을 확인해요', 'Takes mail at the counter and checks where it goes'), 'none', 0, 0xe8605a],
  banker: [T2('은행원', 'Bank teller'), T2('저금하고 돈을 보내는 일을 도와요', 'Helps people save and send money'), 'none', 0, 0x3d4658],
  villagehead: [T2('이장', 'Village head'), T2('마을 사람들의 뜻을 모아 마을 일을 맡아요', 'Gathers neighbours’ ideas and looks after village matters'), 'none', 0, 0x8a6a4a],
  carer: [T2('생활지원사', 'Care worker'), T2('어르신의 안부와 생활을 살펴요', 'Checks in on elders and helps with daily life'), 'none', 0, 0xf28fb5],
  guide: [T2('관광 안내원', 'Tour guide'), T2('지도를 보며 길과 볼거리를 알려 줘요', 'Shows the way and the sights with a map'), 'cap', 0x2fb5b0, 0x2fb5b0],
  busdriver: [T2('버스 기사', 'Bus driver'), T2('정해진 길을 따라 손님을 안전하게 태워요', 'Drives the route and carries passengers safely'), 'cap', 0x3d4658, 0x5aa6e0],
  doctor: [T2('의사', 'Doctor'), T2('아픈 곳을 살피고 치료 방법을 정해요', 'Examines patients and decides on treatment'), 'none', 0, 0xf4f1e8],
  nurse: [T2('간호사', 'Nurse'), T2('환자를 돌보고 의사의 치료를 도와요', 'Cares for patients and helps with treatment'), 'none', 0, 0x9fd8e8],
  dentist: [T2('치과 의사', 'Dentist'), T2('이와 잇몸을 살피고 치료해요', 'Checks and treats teeth and gums'), 'none', 0, 0xf4f1e8],
  hygienist: [T2('치과위생사', 'Dental hygienist'), T2('이를 깨끗이 닦고 관리하는 법을 알려 줘요', 'Cleans teeth and teaches how to care for them'), 'none', 0, 0x9fd8e8],
  kdoctor: [T2('한의사', 'Korean medicine doctor'), T2('침과 한약 같은 한의학으로 몸을 돌봐요', 'Cares for the body with acupuncture and herbal medicine'), 'none', 0, 0xf4f1e8],
  physio: [T2('물리치료사', 'Physiotherapist'), T2('운동과 기구로 몸이 다시 잘 움직이게 도와요', 'Helps the body move well again with exercise'), 'none', 0, 0x5cbf73],
  pharmacist: [T2('약사', 'Pharmacist'), T2('처방에 맞게 약을 짓고 먹는 법을 알려 줘요', 'Prepares medicine and explains how to take it'), 'none', 0, 0xf4f1e8],
  vet: [T2('수의사', 'Vet'), T2('아픈 동물을 진료하고 치료해요', 'Examines and treats sick animals'), 'none', 0, 0x9fd8e8],
  vettech: [T2('동물보건사', 'Vet nurse'), T2('수의사를 도와 동물을 돌봐요', 'Helps the vet and cares for animals'), 'none', 0, 0x5cbf73],
  animalcare: [T2('동물보호사', 'Animal carer'), T2('보호 중인 동물의 밥과 산책을 챙겨요', 'Feeds and walks animals in care'), 'cap', 0x5cbf73, 0x5cbf73],
  keeper: [T2('사육사', 'Animal keeper'), T2('동물의 먹이와 건강을 돌봐요', 'Looks after animals’ food and health'), 'cap', 0x7a5a3e, 0x7a5a3e],
  docent: [T2('해설사', 'Guide speaker'), T2('전시와 생물 이야기를 쉽게 설명해 줘요', 'Explains exhibits and living things simply'), 'none', 0, 0x9b7be0],
  curator: [T2('학예사', 'Curator'), T2('전시를 계획하고 모은 자료를 연구해요', 'Plans exhibits and studies the collection'), 'none', 0, 0x3d4658],
  ecologist: [T2('생태 조사원', 'Ecologist'), T2('어떤 생물이 사는지 살피고 기록해요', 'Watches and records which living things are there'), 'straw', 0xc9b48a, 0x5cbf73],
  librarian: [T2('사서', 'Librarian'), T2('책을 분류해 정리하고 알맞은 책을 찾아 줘요', 'Sorts books and helps people find the right one'), 'none', 0, 0x5cbf73],
  aquarist: [T2('아쿠아리스트', 'Aquarist'), T2('물고기 먹이와 수조 물을 관리해요', 'Feeds the fish and keeps tank water clean'), 'none', 0, 0x4f8fe0],
  factory: [T2('생산 기술자', 'Factory technician'), T2('기계를 다뤄 물건을 만들어요', 'Runs machines that make things'), 'hard', 0xf2c230, 0x4f8fe0],
  qc: [T2('품질 검사원', 'Quality checker'), T2('물건이 잘 만들어졌는지 살펴요', 'Checks that things are made well'), 'hard', 0xf4f1e8, 0xf4f1e8],
  baker: [T2('제빵사', 'Baker'), T2('반죽하고 빵과 과자를 구워요', 'Mixes dough and bakes bread and treats'), 'chef', 0xf4f1e8, 0xf4f1e8],
  cook: [T2('요리사', 'Cook'), T2('재료를 손질해 음식을 만들어요', 'Prepares ingredients and cooks food'), 'chef', 0xf4f1e8, 0xf4f1e8],
  server: [T2('식당 직원', 'Server'), T2('주문을 받고 음식을 날라요', 'Takes orders and brings the food'), 'none', 0, 0x3d4658],
  barista: [T2('바리스타', 'Barista'), T2('커피와 음료를 만들어요', 'Makes coffee and drinks'), 'none', 0, 0x7a5a3e],
  clerk: [T2('점원', 'Shop assistant'), T2('물건을 정리하고 계산을 도와요', 'Arranges goods and helps at the counter'), 'cap', 0x5cbf73, 0x5cbf73],
  owner: [T2('가게 주인', 'Shop owner'), T2('물건을 들여오고 가게를 꾸려요', 'Buys in goods and runs the shop'), 'none', 0, 0xf2a93b],
  merchant: [T2('상인', 'Market seller'), T2('시장에서 물건을 소개하고 팔아요', 'Shows and sells goods at the market'), 'none', 0, 0x8a8f99],
  fisher: [T2('어부', 'Fisher'), T2('배를 타고 물고기를 잡거나 바다에서 키워요', 'Catches fish by boat or farms the sea'), 'cap', 0xf2c230, 0xf2c230],
  auction: [T2('경매사', 'Auctioneer'), T2('수산물을 사고팔도록 값을 부르며 이어 줘요', 'Calls out prices so seafood can be bought and sold'), 'cap', 0x4f8fe0, 0xf4f1e8],
  captain: [T2('선장', 'Captain'), T2('배를 안전하게 몰아요', 'Steers the boat safely'), 'cap', 0xf4f1e8, 0x3d4658],
  farmer: [T2('농부', 'Farmer'), T2('작물을 심고 가꾸어 거둬요', 'Plants, tends and harvests crops'), 'straw', 0xc9b48a, 0x5cbf73],
  forester: [T2('임업인', 'Forester'), T2('나무를 가꾸고 베고 다시 심어요', 'Tends, cuts and replants trees'), 'hard', 0xe8574f, 0x3f7a4a],
  beekeeper: [T2('양봉가', 'Beekeeper'), T2('꿀벌을 키워 꿀을 얻어요', 'Keeps bees and collects honey'), 'cap', 0xf4f1e8, 0xf4f1e8],
  rancher: [T2('목장 농부', 'Rancher'), T2('소에게 풀과 물을 주며 돌봐요', 'Feeds and looks after cattle'), 'straw', 0xc9b48a, 0x4f7fc0],
  saltmaker: [T2('염부', 'Salt maker'), T2('바닷물을 말려 생긴 소금을 모아요', 'Rakes up salt dried from seawater'), 'straw', 0xc9b48a, 0x8a8f99],
  usher: [T2('영화관 직원', 'Cinema staff'), T2('표를 확인하고 자리를 안내해요', 'Checks tickets and shows people to their seats'), 'none', 0, 0xe8605a],
  host: [T2('숙소 주인', 'Inn keeper'), T2('방을 깨끗이 준비하고 손님을 맞아요', 'Prepares clean rooms and welcomes guests'), 'none', 0, 0xf2a93b],
  ranger: [T2('관리인', 'Ranger'), T2('시설을 안내하고 안전을 살펴요', 'Guides visitors and checks safety'), 'cap', 0x3f7a4a, 0x3f7a4a],
  lifeguard: [T2('안전 요원', 'Lifeguard'), T2('물놀이하는 사람이 다치지 않게 지켜요', 'Keeps swimmers safe'), 'cap', 0xe8574f, 0xe8574f],
  coach: [T2('코치', 'Coach'), T2('운동하는 법을 가르치고 함께 연습해요', 'Teaches and practises sports'), 'cap', 0x4f8fe0, 0x4f8fe0],
  instructor: [T2('스키 강사', 'Ski instructor'), T2('스키 타는 법을 안전하게 가르쳐요', 'Teaches skiing safely'), 'cap', 0xe8574f, 0x9b7be0],
  teacher: [T2('교사', 'Teacher'), T2('학생과 함께 배우고 가르쳐요', 'Teaches and learns with students'), 'none', 0, 0x5aa6e0],
};

// 이름 규칙(앞에서부터 먼저 맞는 것) → [갈래, 하는 일, 도움, 직업들, 체험(fire|post|lib)]
const R = (re, g, does, help, jobs, act) => ({ re, g, does, help, jobs, act: act || null });
const RULES = [
  R(/소방/, 'safe', T2('불을 끄고, 위험에 빠진 사람을 구하고, 아픈 사람을 병원으로 옮겨요.', 'Puts out fires, rescues people in danger and takes sick people to hospital.'), T2('불이나 사고가 나면 119에 전화해요. 소방관과 구급대원이 바로 와요.', 'Call 119 for a fire or an accident. Firefighters and paramedics come right away.'), ['firefighter', 'paramedic'], 'fire'),
  R(/파출소/, 'safe', T2('동네 가까이에서 경찰관이 순찰하며 이웃을 돕는 작은 경찰 기관이에요.', 'A small police post where officers patrol and help nearby.'), T2('위험한 일이 생기면 112에 전화해요.', 'Call 112 when something dangerous happens.'), ['police', 'traffic']),
  R(/경찰/, 'safe', T2('마을을 순찰하고, 사고를 살피고, 잃어버린 물건이나 길 잃은 사람을 도와요.', 'Patrols the town, handles accidents and helps with lost things and lost people.'), T2('위험한 일이 생기면 112에 전화해요. 잃어버린 물건은 경찰서로 가져가요.', 'Call 112 when something dangerous happens. Take found items to the police.'), ['police', 'traffic']),
  R(/천연기념물/, 'safe', T2('나라에서 귀하게 지키기로 정한 동물과 식물(천연기념물)을 보살피고, 다친 동물을 치료해 자연으로 돌려보내요.', 'Cares for natural monuments — specially protected animals and plants — and returns healed animals to the wild.'), T2('사라질 위기의 생물을 지켜 자연이 오래 이어지게 해요.', 'Protects endangered living things so nature carries on.'), ['vet', 'keeper', 'docent']),
  R(/동물보호|보호 ?센터/, 'safe', T2('주인을 잃거나 버려진 동물을 보호하고, 새 가족을 찾아 줘요(입양).', 'Shelters lost or abandoned animals and finds them new families (adoption).'), T2('동물이 안전하게 지내고 새 가족을 만나요.', 'Animals stay safe and meet new families.'), ['animalcare', 'vet']),
  R(/생태 ?통로/, 'safe', T2('도로 때문에 끊긴 숲과 숲을 이어, 동물이 안전하게 건너게 만든 길이에요.', 'A crossing that joins forests cut apart by a road so animals can cross safely.'), T2('동물이 차를 피해 오가며 먹이와 짝을 찾아요.', 'Animals can travel to find food and mates without crossing traffic.'), ['ecologist']),
  R(/방음벽/, 'safe', T2('큰길의 자동차 소리가 집까지 크게 들리지 않게 막아 주는 벽이에요.', 'A wall that keeps traffic noise from reaching homes.'), T2('길 옆에 사는 사람들이 조용히 쉴 수 있어요.', 'People living by the road can rest quietly.'), []),
  R(/행정복지|주민센터/, 'admin', T2('주민등록 같은 서류를 만들어 주고, 이사 온 사람의 전입 신고를 받아요. 복지 상담도 해요.', 'Issues papers like resident records, registers people who move in and gives welfare advice.'), T2('생활에 필요한 서류와 복지 도움을 가까운 곳에서 받을 수 있어요.', 'People get papers and welfare help close to home.'), ['civil', 'welfare']),
  R(/우체국/, 'admin', T2('편지와 소포를 받아 보내고, 집배원이 집집마다 배달해요. 저금 같은 금융 일도 해요.', 'Sends letters and parcels; mail carriers deliver them door to door. It also offers savings services.'), T2('멀리 사는 가족과 친구에게 소식과 물건을 전해 줘요.', 'Carries news and things to family and friends far away.'), ['postman', 'postclerk'], 'post'),
  R(/은행/, 'admin', T2('돈을 안전하게 맡아 주고(저금), 필요한 사람에게 빌려주고, 다른 곳으로 보내 줘요.', 'Keeps money safe (savings), lends it and sends it elsewhere.'), T2('돈을 집에 두지 않고 안전하게 모을 수 있어요.', 'People can save money safely instead of keeping it at home.'), ['banker']),
  R(/마을회관/, 'admin', T2('마을 사람들이 모여 회의를 하고 잔치나 행사를 여는 곳이에요.', 'Where villagers meet, hold meetings and have events.'), T2('마을 일을 이웃이 함께 의논해서 정해요.', 'Neighbours decide village matters together.'), ['villagehead']),
  R(/경로당|노인정/, 'admin', T2('어르신들이 모여 이야기 나누고, 쉬고, 체조나 놀이를 하는 곳이에요.', 'Where elders meet to talk, rest, exercise and play games.'), T2('어르신들이 이웃과 함께 건강하게 지내도록 도와요.', 'Helps elders stay healthy together with neighbours.'), ['carer']),
  R(/관광 ?안내/, 'admin', T2('마을을 찾은 손님에게 가는 길과 볼거리, 먹거리를 알려 줘요.', 'Tells visitors the way and what to see and eat.'), T2('처음 온 사람도 길을 잃지 않고 마을을 즐겨요.', 'First-time visitors can enjoy the town without getting lost.'), ['guide']),
  R(/터미널/, 'admin', T2('여러 곳으로 가는 버스가 모이고 떠나는 곳이에요.', 'Where buses to many places gather and leave.'), T2('차가 없어도 다른 마을과 도시로 갈 수 있어요.', 'People without cars can travel to other towns and cities.'), ['busdriver']),
  R(/소아과/, 'health', T2('어린이와 아기를 진료하는 병원이에요. 예방 접종도 해요.', 'A clinic for children and babies. It also gives vaccinations.'), T2('어린이가 아플 때 알맞게 치료받아요.', 'Children get the right care when they are sick.'), ['doctor', 'nurse']),
  R(/치과/, 'health', T2('이와 잇몸을 살피고 치료해요. 충치를 막는 법도 알려 줘요.', 'Checks and treats teeth and gums, and teaches how to prevent cavities.'), T2('튼튼한 이로 음식을 잘 씹을 수 있어요.', 'Healthy teeth help us chew food well.'), ['dentist', 'hygienist']),
  R(/안과/, 'health', T2('눈을 살피고 치료해요. 시력 검사도 해요.', 'Checks and treats eyes, and tests eyesight.'), T2('잘 보이게 도와 공부와 생활이 편해져요.', 'Helps us see well for study and daily life.'), ['doctor', 'nurse']),
  R(/한의원/, 'health', T2('침, 뜸, 한약 같은 한의학으로 몸을 돌봐요.', 'Cares for the body with Korean medicine such as acupuncture and herbal remedies.'), T2('몸의 균형을 살펴 아픈 곳을 돌봐요.', 'Looks after aches by caring for the whole body.'), ['kdoctor', 'nurse']),
  R(/정형외과/, 'health', T2('뼈, 근육, 관절을 다쳤을 때 치료해요.', 'Treats injured bones, muscles and joints.'), T2('다친 몸이 다시 잘 움직이게 도와요.', 'Helps injured bodies move well again.'), ['doctor', 'physio']),
  R(/동물병원/, 'health', T2('아픈 동물을 진료하고 예방 접종과 수술을 해요.', 'Treats sick animals and gives vaccinations and surgery.'), T2('반려동물이 건강하게 살도록 도와요.', 'Helps pets live healthy lives.'), ['vet', 'vettech']),
  R(/보건진료소/, 'health', T2('병원이 먼 마을에서 간단한 진료와 건강 관리를 해요.', 'Gives simple care and health checks in villages far from hospitals.'), T2('멀리 가지 않아도 가까이에서 건강을 챙겨요.', 'People can look after their health without travelling far.'), ['nurse']),
  R(/보건소/, 'health', T2('예방 접종, 건강 검사, 건강 교육을 하는 공공 보건 기관이에요.', 'A public health centre for vaccinations, check-ups and health lessons.'), T2('마을 사람 모두가 병을 예방하고 건강하게 지내도록 도와요.', 'Helps everyone prevent illness and stay healthy.'), ['nurse', 'doctor']),
  R(/보건실/, 'health', T2('다쳤을 때 간단히 소독하고 응급처치를 받는 곳이에요.', 'Where small injuries are cleaned and first aid is given.'), T2('작은 상처를 빨리 돌봐요.', 'Small cuts and scrapes are cared for quickly.'), ['nurse']),
  R(/약국/, 'health', T2('의사 처방에 맞춰 약을 짓고, 약 먹는 법과 조심할 점을 알려 줘요.', 'Prepares medicine from a prescription and explains how to take it safely.'), T2('약을 바르게 먹어 빨리 낫도록 도와요.', 'Helps people take medicine correctly and get better.'), ['pharmacist']),
  R(/의원|병원/, 'health', T2('아픈 사람을 진료하고 치료해요. 검사도 하고, 필요하면 입원해서 쉬며 나아요.', 'Examines and treats sick people; tests are done and some stay to recover.'), T2('아플 때 빨리 나을 수 있게 도와요.', 'Helps people get well quickly.'), ['doctor', 'nurse']),
  R(/도서관/, 'learn', T2('책을 빌려 읽고, 조용히 공부하고, 책 행사에 참여하는 마을 도서관이에요.', 'A town library to borrow and read books, study quietly and join book events.'), T2('누구나 무료로 책을 읽고 배울 수 있어요.', 'Anyone can read and learn for free.'), ['librarian'], 'lib'),
  R(/곤충/, 'learn', T2('곤충 표본과 살아 있는 곤충을 보며 곤충의 한살이를 배우는 곳이에요.', 'Learn insect life cycles from specimens and live insects.'), T2('작은 생물이 자연에서 하는 일을 알게 돼요.', 'We learn what small creatures do in nature.'), ['curator', 'docent']),
  R(/박물관/, 'learn', T2('옛 물건과 자료를 모아 보관하고 전시해서 보여 줘요.', 'Collects, keeps and displays old objects and records.'), T2('옛날 사람들의 생활과 역사를 눈으로 보며 배워요.', 'We see how people lived long ago and learn history.'), ['curator', 'docent']),
  R(/아쿠아리움|수족관/, 'learn', T2('바다와 강에 사는 생물을 큰 수조에서 보여 주고 돌봐요.', 'Shows and cares for sea and river life in big tanks.'), T2('물속 생물과 물 환경을 가까이에서 배워요.', 'We learn about water life and water environments up close.'), ['aquarist', 'docent']),
  R(/젤리|케이크 ?공장/, 'work', T2('젤리와 케이크를 깨끗하게 만들어 포장해요.', 'Makes and packs jelly and cakes hygienically.'), T2('맛있는 간식을 한꺼번에 많이 만들어 가게로 보내요.', 'Makes lots of treats at once and sends them to shops.'), ['baker', 'qc']),
  R(/공장/, 'work', T2('재료를 가공해 물건을 만들어요. 여러 사람이 차례를 나누어 일해요(분업).', 'Turns materials into products, with people sharing the steps (division of labour).'), T2('우리가 쓰는 물건을 한꺼번에 많이 만들어요.', 'Makes many of the things we use.'), ['factory', 'qc']),
  R(/어항|항구|포구/, 'work', T2('고깃배가 드나들고, 잡은 물고기를 내리고 파는 항구예요.', 'A fishing harbour where boats come and go and the catch is landed and sold.'), T2('바다에서 잡은 수산물이 우리 식탁으로 와요.', 'Seafood from the sea reaches our tables.'), ['fisher', 'auction']),
  R(/선착장/, 'work', T2('배가 사람과 짐을 싣고 내리도록 대는 곳이에요.', 'Where boats tie up to load and unload people and goods.'), T2('물 건너로 사람과 짐이 오갈 수 있어요.', 'People and goods can cross the water.'), ['captain']),
  R(/간척/, 'work', T2('바다를 막아 새로 만든 땅이에요. 논밭이나 공장 땅으로 써요.', 'Land made by walling off the sea, used for fields or factories.'), T2('새 땅이 생기지만 갯벌이 줄어드는 문제도 함께 생각해요.', 'New land appears, but we also think about losing mudflats.'), ['farmer']),
  R(/농수로/, 'work', T2('논과 밭에 물을 대기 위해 만든 물길이에요.', 'A channel built to bring water to rice fields and farms.'), T2('비가 적어도 농작물이 물을 먹고 자라요.', 'Crops get water even in dry weather.'), ['farmer']),
  R(/딸기/, 'work', T2('비닐로 덮은 집 안에서 따뜻하게 딸기를 키워요.', 'Grows strawberries in a warm plastic greenhouse.'), T2('추운 계절에도 딸기를 먹을 수 있어요.', 'We can eat strawberries even in cold seasons.'), ['farmer']),
  R(/과수원/, 'work', T2('과일나무를 심어 열매를 키우고 거둬요.', 'Grows fruit trees and harvests the fruit.'), T2('제철 과일을 우리에게 보내 줘요.', 'Sends us fruit in season.'), ['farmer']),
  R(/표고|재배장/, 'work', T2('참나무 원목에서 표고버섯을 키워요.', 'Grows shiitake mushrooms on oak logs.'), T2('산에서 나는 먹거리를 길러 내요.', 'Grows food from the mountain.'), ['farmer']),
  R(/배추밭|감자밭|밭$/, 'work', T2('채소를 심고 가꾸어 거두는 밭이에요.', 'A field where vegetables are planted, tended and harvested.'), T2('우리가 먹는 채소가 여기서 자라요.', 'Vegetables we eat grow here.'), ['farmer']),
  R(/목재|야적/, 'work', T2('베어 낸 나무를 쌓아 말리고 나르는 곳이에요.', 'Where cut timber is stacked, dried and moved.'), T2('집과 가구에 쓰는 나무를 마련해요.', 'Prepares wood for houses and furniture.'), ['forester']),
  R(/양봉/, 'work', T2('꿀벌을 키워 꿀을 얻어요. 꿀벌은 꽃가루를 옮겨 열매가 열리게 도와요.', 'Keeps bees for honey; bees carry pollen so fruit can grow.'), T2('꿀을 얻고, 과일과 채소가 열매를 맺게 도와요.', 'We get honey and help fruit and vegetables grow.'), ['beekeeper']),
  R(/목장/, 'work', T2('넓은 풀밭에서 소를 키워요.', 'Raises cattle on wide pastures.'), T2('우유와 먹거리를 우리에게 보내 줘요.', 'Provides milk and food.'), ['rancher']),
  R(/염전/, 'work', T2('바닷물을 햇볕과 바람에 말려 소금을 만들어요.', 'Makes salt by drying seawater in sun and wind.'), T2('음식에 꼭 필요한 소금을 만들어요.', 'Makes the salt our food needs.'), ['saltmaker']),
  R(/양식/, 'work', T2('바다에 줄과 그물을 매달아 김이나 굴 같은 수산물을 키워요.', 'Farms seafood like laver or oysters on ropes and nets in the sea.'), T2('바다 먹거리를 꾸준히 길러 내요.', 'Grows sea food steadily.'), ['fisher']),
  R(/수산물|직판장/, 'shop', T2('바다에서 잡거나 기른 수산물을 사고파는 시장이에요.', 'A market for caught and farmed seafood.'), T2('싱싱한 바다 먹거리를 가까이에서 사요.', 'We buy fresh seafood nearby.'), ['merchant', 'fisher']),
  R(/약초/, 'shop', T2('산에서 나는 약초와 나물을 사고파는 시장이에요.', 'A market for mountain herbs and greens.'), T2('산에서 나는 먹거리를 사고팔아요.', 'Mountain foods are bought and sold.'), ['merchant']),
  R(/편의점/, 'shop', T2('간단한 먹을거리와 생활용품을 파는 작은 가게예요. 밤에도 열어요.', 'A small shop for snacks and everyday items, open at night too.'), T2('필요한 것을 가까이에서 바로 살 수 있어요.', 'We can buy what we need right nearby.'), ['clerk', 'owner']),
  R(/마트|상점|슈퍼/, 'shop', T2('먹을거리와 생활용품을 한곳에서 사고파는 가게예요.', 'A shop for food and household goods in one place.'), T2('필요한 물건을 한 번에 살 수 있어요.', 'We can buy what we need in one trip.'), ['clerk', 'owner']),
  R(/빵/, 'shop', T2('빵과 과자를 굽고 팔아요.', 'Bakes and sells bread and treats.'), T2('갓 구운 빵을 가까이에서 사요.', 'We buy fresh bread nearby.'), ['baker', 'clerk']),
  R(/키즈 ?카페/, 'rest', T2('어린이가 안전하게 뛰어놀 수 있는 실내 놀이터예요.', 'An indoor playground where children can play safely.'), T2('날씨와 상관없이 몸을 움직이며 놀아요.', 'Children can play actively in any weather.'), ['clerk']),
  R(/보드게임/, 'rest', T2('여러 보드게임을 빌려 친구와 함께 놀아요.', 'Borrow board games and play with friends.'), T2('함께 규칙을 지키며 놀아요.', 'We play together and follow the rules.'), ['clerk']),
  R(/동물 ?카페/, 'rest', T2('동물을 보며 쉬어 가는 곳이에요. 동물이 싫어하는 행동은 하지 않아요.', 'A café to rest and watch animals. We don’t do things animals dislike.'), T2('동물을 아끼는 마음을 배워요.', 'We learn to care for animals.'), ['animalcare', 'clerk']),
  R(/카페/, 'shop', T2('음료와 간식을 만들어 팔고, 앉아서 쉬어 가는 곳이에요.', 'Makes drinks and snacks and offers a place to sit and rest.'), T2('이웃과 만나 이야기 나누는 쉼터가 돼요.', 'A place to meet neighbours and talk.'), ['barista', 'owner']),
  R(/아이스크림|베라/, 'shop', T2('여러 맛 아이스크림을 골라 사 먹는 가게예요.', 'A shop to choose and buy ice cream in many flavours.'), T2('더운 날 시원한 간식을 먹어요.', 'A cool treat on hot days.'), ['clerk']),
  R(/꼬리|반려|용품/, 'shop', T2('반려동물에게 필요한 먹이와 용품을 팔아요.', 'Sells food and supplies for pets.'), T2('반려동물을 잘 돌보도록 도와요.', 'Helps us look after pets well.'), ['clerk']),
  R(/식당|음식|집$|햄버거|뷔페|샤브|초밥|마라탕|국수/, 'shop', T2('음식을 만들어 손님에게 대접해요.', 'Cooks food and serves customers.'), T2('여러 지역의 음식을 맛볼 수 있어요.', 'We can taste many kinds of food.'), ['cook', 'server']),
  R(/영화관/, 'rest', T2('큰 화면과 큰 소리로 영화를 보는 곳이에요.', 'Watch films on a big screen with big sound.'), T2('이야기를 함께 보며 쉬고 즐겨요.', 'We rest and enjoy stories together.'), ['usher']),
  R(/사우나/, 'rest', T2('따뜻한 물과 증기로 몸을 씻고 쉬는 곳이에요.', 'Wash and relax with warm water and steam.'), T2('피곤한 몸을 쉬게 해요.', 'Helps tired bodies rest.'), ['clerk']),
  R(/펜션|풀빌라|숙소/, 'rest', T2('여행 온 사람들이 묵어 가는 숙소예요.', 'Lodgings where travellers stay.'), T2('멀리서 온 손님이 편히 쉬어 가요.', 'Visitors from far away can rest comfortably.'), ['host']),
  R(/캠핑장 ?관리/, 'rest', T2('캠핑장 이용을 안내하고, 불과 물을 안전하게 쓰는지 살펴요.', 'Guides campers and checks fire and water are used safely.'), T2('캠핑을 안전하게 즐겨요.', 'Camping is safe and fun.'), ['ranger']),
  R(/캠핑/, 'rest', T2('텐트를 치고 자연 속에서 쉬는 곳이에요.', 'Pitch a tent and rest in nature.'), T2('자연을 가까이에서 느껴요. 불은 정해진 곳에서만 피워요.', 'We feel close to nature and light fires only in the right places.'), ['ranger']),
  R(/스키/, 'rest', T2('눈 쌓인 산비탈에서 스키를 타는 곳이에요.', 'Ski on snowy mountain slopes.'), T2('겨울에도 몸을 움직이며 놀아요.', 'We stay active in winter.'), ['instructor', 'lifeguard']),
  R(/축구|운동장|경기장/, 'rest', T2('공을 차며 운동하는 넓은 운동장이에요.', 'A wide field for playing football.'), T2('함께 운동하며 몸과 마음이 튼튼해져요.', 'Playing sports together keeps us strong.'), ['coach']),
  R(/놀이터/, 'rest', T2('미끄럼틀과 그네에서 노는 곳이에요. 차례를 지켜요.', 'A place with slides and swings. We take turns.'), T2('친구와 어울려 놀아요.', 'We play together with friends.'), []),
  R(/전망대|정상/, 'rest', T2('높은 곳에서 마을을 내려다보는 곳이에요. 방위와 땅 모양을 살펴봐요.', 'Look down over the town from up high and check directions and landforms.'), T2('마을이 어떻게 생겼는지 한눈에 알 수 있어요.', 'We see how the town is laid out at a glance.'), []),
  R(/해수욕장|해변/, 'rest', T2('바닷가 모래밭에서 쉬고 물놀이하는 곳이에요. 안전 요원이 지키는 곳에서만 물에 들어가요.', 'A sandy beach to rest and swim — only swim where lifeguards are watching.'), T2('여름에 시원하게 쉬어요.', 'A cool place to rest in summer.'), ['lifeguard']),
  R(/갯벌/, 'rest', T2('밀물과 썰물이 드나드는 바닷가 진흙 땅이에요. 게와 조개가 살고 바닷물을 깨끗하게 해요.', 'Muddy shore covered and uncovered by tides; crabs and clams live there and it cleans seawater.'), T2('바다 생물이 자라는 집이 되고 바다를 깨끗하게 해요.', 'A home for sea life that also cleans the sea.'), ['ecologist']),
  R(/휴식년/, 'rest', T2('숲이 쉬며 되살아나도록 한동안 사람이 들어가지 않게 정한 숲이에요(자연 휴식년제).', 'A forest closed to people for a while so it can recover (nature rest period).'), T2('식물과 동물이 다시 건강해져요.', 'Plants and animals can recover.'), ['ecologist']),
  R(/생태 ?하천/, 'rest', T2('물고기와 새가 살 수 있게 자연스럽게 가꾼 하천이에요.', 'A stream restored so fish and birds can live there.'), T2('도시 가까이에서도 자연을 만나요.', 'We meet nature even near the city.'), ['ecologist']),
  R(/골프장/, 'rest', T2('골프장을 짓기로 정해 둔 땅이에요.', 'Land set aside for a future golf course.'), T2('운동하는 곳이 생기지만, 숲과 물을 지키는 방법도 함께 의논해요.', 'A sports place may come, but we also discuss how to protect forests and water.'), []),
  R(/버섯 ?숲/, 'rest', T2('여러 버섯이 자라는 숲이에요. 독버섯은 만지지 않아요.', 'A forest where many mushrooms grow. We never touch poisonous ones.'), T2('버섯은 낙엽과 나무를 썩혀 흙을 기름지게 해요.', 'Mushrooms break down leaves and wood and enrich the soil.'), ['ecologist']),
  R(/오리배/, 'rest', T2('페달을 밟아 물 위를 다니는 놀이 배예요. 구명조끼를 입어요.', 'A pedal boat for the water — we wear life jackets.'), T2('물 위에서 즐겁게 쉬어요.', 'A fun way to relax on the water.'), ['lifeguard']),
  R(/파라솔|쉼터|정자|벤치/, 'rest', T2('햇볕과 비를 피해 잠시 앉아 쉬어 가는 곳이에요.', 'A place to sit and rest out of the sun and rain.'), T2('걷다가 지칠 때 쉬어 가요.', 'A rest stop when we get tired.'), []),
  R(/산책|둘레길/, 'rest', T2('걸으며 쉬는 길이에요.', 'A path for walking and resting.'), T2('걷기는 몸과 마음을 건강하게 해요.', 'Walking keeps body and mind healthy.'), []),
  R(/공원/, 'rest', T2('나무와 풀이 있어 쉬고 노는 곳이에요.', 'A green place with trees to rest and play.'), T2('이웃 모두가 함께 쓰는 쉼터예요.', 'A space everyone shares.'), []),
  R(/바다/, 'rest', T2('넓은 바닷물이에요. 배가 다니고 물고기가 살아요.', 'The wide sea, with boats and fish.'), T2('먹거리와 일터, 쉼터가 되어 줘요.', 'Gives food, work and rest.'), ['fisher']),
  R(/강|하천|개울|계곡/, 'rest', T2('물이 흐르는 길이에요. 물고기와 새가 살아요.', 'Flowing water where fish and birds live.'), T2('마을에 물을 주고 생물의 집이 돼요.', 'Gives the town water and is a home for living things.'), []),
  R(/호수|연못|저수지/, 'rest', T2('물이 고여 있는 곳이에요. 물가에서는 미끄러지지 않게 조심해요.', 'Still water — be careful not to slip at the edge.'), T2('물을 모아 두고 생물이 살아요.', 'Stores water and is home to living things.'), []),
  R(/숲|산$|뒷산/, 'rest', T2('나무가 우거진 곳이에요. 맑은 공기를 만들고 동물이 살아요.', 'A wooded place that makes clean air and is home to animals.'), T2('쉬고 걸으며 자연을 느껴요.', 'We rest, walk and feel nature.'), []),
];
// 이름으로 못 찾으면 갈래(kind)로
const KINDR = { shop: 'shop', hospital: 'health', police: 'safe', fire: 'safe', post: 'admin', office: 'admin', public: 'admin', factory: 'work', fishmarket: 'shop', cinema: 'rest', play: 'rest', pitch: 'rest', park: 'rest', hill: 'rest', water: 'rest', forest: 'rest', sea: 'rest', sand: 'rest', mudflat: 'rest', canal: 'work', rice: 'work', farm: 'work', orchard: 'work', grass: 'rest' };
const GEN = { shop: [T2('필요한 물건을 사고파는 가게예요.', 'A shop where things are bought and sold.'), T2('마을 사람들이 필요한 것을 가까이에서 구해요.', 'Neighbours get what they need nearby.'), ['clerk', 'owner']], health: [T2('아픈 사람을 돌보는 곳이에요.', 'A place that cares for sick people.'), T2('아플 때 도움을 받아요.', 'We get help when we are sick.'), ['doctor', 'nurse']], safe: [T2('마을의 안전을 지키는 곳이에요.', 'A place that keeps the town safe.'), T2('위험할 때 도움을 받아요.', 'We get help in danger.'), ['police']], admin: [T2('마을 사람 모두를 위한 공공 기관이에요.', 'A public office for everyone in town.'), T2('생활에 필요한 일을 도와줘요.', 'Helps with everyday needs.'), ['civil']], work: [T2('사람들이 일하며 무언가를 만들거나 거두는 곳이에요.', 'A place where people work to make or harvest things.'), T2('우리가 쓰고 먹는 것이 여기서 나와요.', 'Things we use and eat come from here.'), ['farmer']], rest: [T2('쉬고 노는 곳이에요.', 'A place to rest and play.'), T2('몸과 마음이 쉬어요.', 'Body and mind can rest.'), []], learn: [T2('보고 들으며 배우는 곳이에요.', 'A place to learn by seeing and listening.'), T2('새로운 것을 알게 돼요.', 'We learn new things.'), ['docent']] };

// 카드 자료: name(아이 판 이름) · kind(마을 건물 갈래) → { g, does, help, jobs, act } · 학교·집·칸 이름표는 null(카드 없음)
//   칸 이름표(area) = 아이가 칸 하나를 그 이름으로 붙인 곳 → 이름이 시설 규칙에 맞을 때만(쉼·자연 일반 규칙 X — '자연친화 마을' 같은 동네 이름은 카드 없음)
export function placeInfo(name, kind) { const n = String(name || ''); if (!n || kind === 'school' || kind === 'house' || kind === 'apt' || /집$/.test(n) && kind !== 'shop' && !/음식|국수|중국/.test(n)) return null;
  for (const r of RULES) if (r.re.test(n)) return kind === 'area' && r.g === 'rest' ? null : { g: r.g, does: r.does, help: r.help, jobs: r.jobs, act: r.act };
  if (kind === 'area') return null; const g = KINDR[kind]; if (!g) return null; const G9 = GEN[g]; return { g, does: G9[0], help: G9[1], jobs: G9[2], act: null }; }

// 직업 그림(SVG · 64×64): 머리 모양으로 남녀(f = 긴 머리 묶음) · 피부 세 가지 · 모자 꼴·색 · 옷 색 — 장소마다 번갈아 고르게
const SKIN = ['#f7d6b5', '#eec39b', '#d9a273'], HAIR = ['#3a2a1e', '#5b3f2e', '#2a2522'], cs = h => '#' + (h >>> 0).toString(16).padStart(6, '0');
export function jobSvg(key, f, k = 0) { const J = JOBS[key]; if (!J) return ''; const [, , hat, hc, tc] = J, sk = SKIN[k % 3], hr = HAIR[(k + 1) % 3], top = cs(tc), hatC = cs(hc);
  let s = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#fffaf0" stroke="#2b2622" stroke-width="2"/>';
  s += '<path d="M14 62c1-13 8-20 18-20s17 7 18 20z" fill="' + top + '" stroke="#2b2622" stroke-width="2"/>';   // 몸(옷)
  if (f) s += '<path d="M17 30c0-12 7-18 15-18s15 6 15 18v8c-3 2-6 2-8 0" fill="' + hr + '"/>';   // 긴 머리(뒤)
  s += '<circle cx="32" cy="28" r="12" fill="' + sk + '" stroke="#2b2622" stroke-width="2"/><circle cx="28" cy="29" r="1.6" fill="#2b2622"/><circle cx="36" cy="29" r="1.6" fill="#2b2622"/><path d="M28.5 34c2 2 5 2 7 0" stroke="#2b2622" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  if (f) s += '<path d="M20 26c2-8 7-11 12-11s10 3 12 11c-5-3-14-3-24 0z" fill="' + hr + '"/>'; else s += '<path d="M20 27c1-9 6-12 12-12s11 3 12 12c-3-4-7-5-12-5s-9 1-12 5z" fill="' + hr + '"/>';   // 앞머리
  if (hat === 'helmet') s += '<path d="M18 24c1-9 7-13 14-13s13 4 14 13z" fill="' + hatC + '" stroke="#2b2622" stroke-width="2"/><rect x="15" y="22" width="34" height="4" rx="2" fill="' + hatC + '" stroke="#2b2622" stroke-width="1.6"/>';
  else if (hat === 'cap') s += '<path d="M20 22c1-7 6-9 12-9s11 2 12 9z" fill="' + hatC + '" stroke="#2b2622" stroke-width="2"/><path d="M30 22h17c0 3-2 4-5 4H30z" fill="' + hatC + '" stroke="#2b2622" stroke-width="1.6"/>';
  else if (hat === 'chef') s += '<path d="M21 21v-6c-3-4 1-9 6-7 2-4 8-4 10 0 5-2 9 3 6 7v6z" fill="#ffffff" stroke="#2b2622" stroke-width="2"/>';
  else if (hat === 'hard') s += '<path d="M19 23c1-8 6-11 13-11s12 3 13 11z" fill="' + hatC + '" stroke="#2b2622" stroke-width="2"/><rect x="17" y="21" width="30" height="3" rx="1.5" fill="' + hatC + '" stroke="#2b2622" stroke-width="1.4"/>';
  else if (hat === 'straw') s += '<ellipse cx="32" cy="21" rx="19" ry="4" fill="' + hatC + '" stroke="#2b2622" stroke-width="1.6"/><path d="M23 21c1-6 4-8 9-8s8 2 9 8z" fill="' + hatC + '" stroke="#2b2622" stroke-width="1.6"/>';
  return s + '</svg>'; }
// 장소의 직업 줄: 장소 이름마다 시작을 바꿔 남녀·피부를 번갈아(한 카드 안에서도 번갈아)
export const jobRow = (name, keys) => { let h = 7; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return keys.map((k, i) => ({ k, f: (h + i) % 2 === 0, skin: (h + i) % 3 })); };

// 실제 사진(창 안에서만 — 3D 세상에 붙이지 않음 · 실사 금지 규칙): v2/img/photos/ · 출처 = CREDITS.md와 같게 · 사진 밑에 출처 한 줄을 꼭 보임 · 새 사진은 여기 한 줄 + PHOTO_OF 한 줄
export const PHOTOS = {
  gochang: { src: 'mudflat_gochang.jpg', t: T2('고창 갯벌', 'Gochang tidal flat'), by: '문화재청', lic: T2('공공누리 1유형(출처 표시)', 'KOGL Type 1 (attribution)'), url: 'https://commons.wikimedia.org/wiki/File:Gochang_tidal_flat_01.jpg' },
  saemangeum: { src: 'seawall_saemangeum.jpg', t: T2('새만금 방조제 — 바다를 막은 둑', 'Saemangeum seawall — a dike that walls off the sea'), by: 'Kussy', lic: T2('CC BY-SA 2.1 jp', 'CC BY-SA 2.1 jp'), url: 'https://commons.wikimedia.org/wiki/File:Saemangeum_seawall.JPG' },
  suncheon: { src: 'mudflat_suncheon.jpg', t: T2('순천만 갯벌의 게와 구멍', 'Crabs and burrows on the Suncheon Bay mudflat'), by: 'lumoplank', lic: T2('CC0(퍼블릭 도메인)', 'CC0 (public domain)'), url: 'https://commons.wikimedia.org/wiki/File:Suncheon_Bay_Natural_Reserve_-_SuncheonBNG2975.jpg' },
};
export const PHOTO_OF = [[/갯벌/, 'gochang'], [/간척/, 'saemangeum']];   // 장소 이름 → 사진(앞에서부터)
export const photoKey = name => { for (const [re, k] of PHOTO_OF) if (re.test(String(name || ''))) return k; return null; };
const escH = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 사진 한 장(창 안 HTML): 그림 + 무엇 + 출처 한 줄(지은이 · 이용 허락 · 원본 링크)
export function photoHtml(k, en) { const P = PHOTOS[k]; if (!P) return ''; const L = en ? 1 : 0, src = new URL('../img/photos/' + P.src, import.meta.url).href;
  return '<figure class="pc-ph"><img src="' + src + '" alt="' + escH(P.t[L]) + '" loading="lazy" decoding="async"><figcaption><b>' + escH(P.t[L]) + '</b><br>' + (en ? 'Photo: ' : '사진: ') + escH(P.by) + ' · ' + escH(P.lic[L]) + ' · <a href="' + escH(P.url) + '" target="_blank" rel="noopener">' + (en ? 'Wikimedia Commons' : '위키미디어 공용') + '</a></figcaption></figure>'; }
export const PHOTO_CSS = '.twn-p .pc-ph{margin:4px 0 10px;border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:var(--card);box-shadow:0 4px 0 var(--ink)}.twn-p .pc-ph img{display:block;width:100%;max-height:300px;object-fit:cover}.twn-p .pc-ph figcaption{padding:6px 10px;font-size:12.5px;color:var(--mut);line-height:1.4}.twn-p .pc-ph figcaption b{color:var(--ink);font-size:14px}.twn-p .pc-ph a{color:inherit}';

// 사서 체험 자료(한국십진분류법 KDC — 책등 번호 첫 자리로 갈래): [번호, 이름, 영어, 책장 색, 무엇이 있나]
export const LIB_CATS = [
  ['300', '사회과학', 'Social science', '#ef8b33', T2('사회·경제·교육·풍습', 'Society, money, school, customs')],
  ['400', '자연과학', 'Natural science', '#3cc76a', T2('동물·식물·별·공룡', 'Animals, plants, stars, dinosaurs')],
  ['500', '기술과학', 'Technology', '#3d74c9', T2('기계·요리·몸과 건강', 'Machines, cooking, the body')],
  ['600', '예술', 'Arts', '#f08fb2', T2('그림·음악·만들기·운동', 'Art, music, crafts, sports')],
  ['800', '문학', 'Literature', '#e0453a', T2('동화·동시·이야기', 'Stories and poems')],
  ['900', '역사', 'History', '#b86f2b', T2('역사·나라·지리', 'History, countries, geography')],
];
// 돌아온 책(지어낸 일반 제목 · 번호는 실제 분류 결): [제목, 영어, 청구기호]
export const LIB_BOOKS = [
  ['시장과 돈 이야기', 'All about markets and money', '320'], ['우리 동네 공공기관', 'Public offices in our town', '350'], ['세계의 명절', 'Festivals of the world', '380'], ['안전한 학교 생활', 'Staying safe at school', '370'],
  ['공룡 대백과', 'Big book of dinosaurs', '457'], ['곤충의 한살이', 'The life of insects', '495'], ['별자리 이야기', 'Stories of the stars', '443'], ['바다 생물 도감', 'Sea creatures', '491'],
  ['로봇 만들기', 'Build a robot', '559'], ['맛있는 요리 교실', 'Fun cooking class', '594'], ['자동차는 어떻게 달릴까', 'How cars move', '556'], ['튼튼한 몸 이야기', 'Our healthy body', '511'],
  ['종이접기', 'Paper folding', '637'], ['피아노 첫걸음', 'First piano steps', '672'], ['신나는 그림 그리기', 'Happy drawing', '650'], ['축구 규칙', 'Football rules', '695'],
  ['우리 반 동시집', 'Our class poems', '811'], ['모험 동화', 'Adventure stories', '813'], ['그림 동화', 'Picture stories', '813'], ['세계 명작 동화', 'Classic tales of the world', '808'],
  ['한국사 이야기', 'Korean history stories', '911'], ['세계 여러 나라', 'Countries of the world', '980'], ['옛날 사람들의 생활', 'Life long ago', '909'], ['지도 읽기', 'Reading maps', '989'],
];
// 손님 부탁(사서 체험 둘째 단계 · 손님 = 방에 서 있는 사람): [부탁, 영어, 갈래 번호]
export const LIB_ASKS = [['공룡 책이 보고 싶어요.', 'I want a dinosaur book.', '400'], ['종이접기 책은 어디 있어요?', 'Where are the paper-folding books?', '600'], ['옛날 왕 이야기를 읽고 싶어요.', 'I’d like to read about kings long ago.', '900'], ['로봇 만드는 책을 찾아요.', 'I’m looking for a robot-building book.', '500'], ['재미있는 동화책을 읽고 싶어요.', 'I’d like a fun storybook.', '800'], ['시장과 돈에 대한 책이 있어요?', 'Do you have a book about markets and money?', '300']];
