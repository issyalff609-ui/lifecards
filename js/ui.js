// ═══════════════════════════════════════════════════════════
// UI.JS  —  all rendering, overlays, and game loop wiring
// ═══════════════════════════════════════════════════════════

// ── SAVE / LOAD ───────────────────────────────────────────
const SAVE_KEY = 'lifesim_v1';
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state: STATE, birthData: _birthData }));
  } catch(e) {}
}
function hasSavedGame() {
  return !!localStorage.getItem(SAVE_KEY);
}
function continueGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const { state, birthData } = JSON.parse(raw);
    STATE = state;
    _birthData = birthData;
    document.getElementById('screen-birth').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    updateAllUI();
  } catch(e) {
    showToast('Could not load save.');
  }
}
function newGame() {
  localStorage.removeItem(SAVE_KEY);
  document.getElementById('continue-banner').style.display = 'none';
  initBirth();
}

// ── BIRTH ─────────────────────────────────────────────────
let _birthData = null;
const SITUATION_TEXT = {
  happily_married:   () => `Your parents are happily married.`,
  married_struggling:() => `Your parents are still together.`,
  recently_divorced: () => `Your parents are not together.`,
  single_mum:        () => `Your mother is raising you on her own.`,
  single_dad:        () => `Your father is raising you on his own.`,
  never_knew:        () => `Your mother is raising you alone. You don't know who your father is.`,
};
function initBirth() {
  _birthData = null;
  document.getElementById('deal-name').textContent = '—';
  document.getElementById('deal-location').textContent = '—';
  document.getElementById('deal-trait-1').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('deal-trait-2').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('deal-trait-3').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('birth-start-actions').style.display = 'none';
  document.getElementById('roll-life-btn').style.display = 'block';
  document.getElementById('birth-deal-stack').classList.remove('has-life', 'is-rolling');
  const banner = document.getElementById('continue-banner');
  if (banner) banner.style.display = hasSavedGame() ? 'block' : 'none';
}
function createBirthData() {
  const gender     = Math.random() > 0.5 ? 'male' : 'female';
  const firstName  = pickRandom(NAMES_UK[gender]);
  const surname    = pickRandom(NAMES_UK.surnames);
  const city       = pickRandom(PLACES_UK.cities);
  const scClass    = weightedRandom(SOCIAL_CLASSES).id;
  const traits     = sampleN(PLAYER_TRAITS_POOL, 3).map(t => t.id);
  const month      = Math.floor(Math.random() * 12) + 1;
  const day        = Math.floor(Math.random() * 28) + 1;
  const sign       = getStarSign(day, month);
  const mumName    = pickRandom(NAMES_UK.female);
  const dadName    = pickRandom(NAMES_UK.male);
  const mumJob     = pickRandom(PARENT_JOBS[scClass]);
  const dadJob     = pickRandom(PARENT_JOBS[scClass]);
  const SITUATIONS = [
    { id:'happily_married',    weight:35 },
    { id:'married_struggling', weight:15 },
    { id:'recently_divorced',  weight:20 },
    { id:'single_mum',         weight:22 },
    { id:'single_dad',         weight:3  },
    { id:'never_knew',         weight:5  },
  ];
  const situation = weightedRandom(SITUATIONS).id;
  const sexuality = weightedRandom([
    { id:'heterosexual', weight:78 },
    { id:'bisexual', weight:14 },
    { id:'homosexual', weight:8 },
  ]).id;
  const numSiblings = weightedRandom([
    { v:0, weight:42 }, { v:1, weight:35 }, { v:2, weight:16 }, { v:3, weight:7 },
  ]).v;
  const siblings = Array.from({ length: numSiblings }, () => {
    const sg = Math.random() > 0.5 ? 'male' : 'female';
    const age = Math.floor(Math.random()*10) - 3;
    let siblingType = 'full';
    let familyStatus = null;
    if (age < 0 && ['single_mum','single_dad','never_knew'].includes(situation)) {
      siblingType = 'half';
    }
    if (age < 0 && situation === 'recently_divorced') {
      siblingType = Math.random() < 0.5 ? 'full' : 'half';
      if (siblingType === 'full') familyStatus = "It's complicated";
    }
    return { name: pickRandom(NAMES_UK[sg]), gender: sg, age, siblingType, familyStatus };
  });
  const hasPet    = Math.random() < 0.4;
  const petHint   = hasPet ? pickRandom([{ name:'a dog' }, { name:'a cat' }]) : null;
  return { gender, firstName, surname, city, socialClass:scClass, traits,
    birthday:{ day, month }, sign, mumName, dadName, mumJob, dadJob, situation, siblings, petHint, sexuality };
}
function renderBirthDeal() {
  const d = _birthData;
  document.getElementById('deal-name').textContent     = `${d.firstName} ${d.surname}`;
  document.getElementById('deal-location').textContent = d.city.region;
  const revealedTrait = PLAYER_TRAITS_POOL.find(x => x.id === d.traits[0]);
  document.getElementById('deal-trait-1').innerHTML = `
    <div class="birth-card-kicker">Trait revealed</div>
    <div class="birth-card-value">${revealedTrait.label}</div>`;
  [2, 3].forEach(i => {
    document.getElementById(`deal-trait-${i}`).innerHTML = `
      <div class="birth-card-kicker">Trait locked</div>
      <div class="birth-card-value">???</div>`;
  });
  document.getElementById('birth-deal-stack').classList.add('has-life');
  document.getElementById('birth-start-actions').style.display = 'grid';
  document.getElementById('roll-life-btn').style.display = 'none';
}
function rollLife() {
  const stack = document.getElementById('birth-deal-stack');
  const btn = document.getElementById('roll-life-btn');
  btn.disabled = true;
  stack.classList.remove('has-life');
  stack.classList.add('is-rolling');
  document.getElementById('birth-start-actions').style.display = 'none';
  setTimeout(() => {
    _birthData = createBirthData();
    renderBirthDeal();
    stack.classList.remove('is-rolling');
    btn.disabled = false;
  }, 650);
}
function reshuffleLife() {
  rollLife();
}
function buildBirthNarrative(d) {
  const currentSiblings = d.siblings.filter(s => s.age >= 0);
  const siblingText = currentSiblings.length === 0
    ? 'You have no siblings'
    : currentSiblings.length === 1
      ? `You have one sibling, ${currentSiblings[0].name}`
      : `You have ${currentSiblings.length} siblings: ${currentSiblings.map(s => s.name).join(', ')}`;
  const petText = d.petHint ? `Your family has ${d.petHint.name}.` : 'Your family does not have a pet.';
  let parentText = `Your mother is ${d.mumName}, a ${d.mumJob}, and your father is ${d.dadName}, a ${d.dadJob}.`;
  if (d.situation === 'single_mum' || d.situation === 'never_knew') {
    parentText = `Your mother is ${d.mumName}, a ${d.mumJob}.`;
  } else if (d.situation === 'single_dad') {
    parentText = `Your father is ${d.dadName}, a ${d.dadJob}.`;
  }
  return `You were born on the ${ordinal(d.birthday.day)} of ${MONTHS[d.birthday.month-1]} in ${d.city.name}, ${d.city.region}. ${SITUATION_TEXT[d.situation]()} ${parentText} ${siblingText}. ${petText}`;
}
function startGame() {
  if (!_birthData) {
    rollLife();
    return;
  }
  window._familySubTab = 'family';
  const d = _birthData;
  createNewLife({
    gender:d.gender, firstName:d.firstName, surname:d.surname,
    birthday:d.birthday, city:d.city, socialClass:d.socialClass,
    traits:d.traits, situation:d.situation,
    mumName:d.mumName, dadName:d.dadName, mumJob:d.mumJob, dadJob:d.dadJob, siblings:d.siblings, sexuality:d.sexuality,
  });
  STATE.starSign = d.sign;
  logActivity(buildBirthNarrative(d), null);
  document.getElementById('screen-birth').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  updateAllUI();
}

// ── TAB SWITCHING ─────────────────────────────────────────
let _currentTab = 'life';
let _lastRenderedAvatarAge = null;
let _lastRenderedAvatarStage = null;
const PART_TIME_JOB_LIST = [
  { title:'Cafe Team Member', company:'Maple Street Cafe', rate:11, icon:'mdi:coffee-outline', accent:'#cf7a47' },
  { title:'Retail Assistant', company:'Willow Market', rate:12, icon:'mdi:shopping-outline', accent:'#4f8a74' },
  { title:'Warehouse Picker', company:'ParcelHub Depot', rate:13, icon:'mdi:package-variant-closed', accent:'#7f91a7' },
  { title:'Fast Food Crew', company:'Sunny Bites', rate:11, icon:'mdi:hamburger', accent:'#dd7a54' },
  { title:'Delivery Rider', company:'ZipDrop', rate:14, icon:'mdi:scooter', accent:'#6f7ee8' },
  { title:'Call Centre Agent', company:'BrightLine Support', rate:12, icon:'mdi:headset', accent:'#9b73b5' },
  { title:'Supermarket Cashier', company:'Fresh Basket', rate:11, icon:'mdi:cart-outline', accent:'#5b9f64' },
  { title:'Office Assistant', company:'Oak & Co.', rate:12, icon:'mdi:clipboard-text-outline', accent:'#9a785e' },
];
const FULL_TIME_GENERAL_JOBS = [
  { title:'Receptionist', company:'Cedar House Clinic', salary:'£21,500/year', icon:'mdi:deskphone', accent:'#b37867' },
  { title:'Admin Assistant', company:'Northgate Services', salary:'£22,500/year', icon:'mdi:clipboard-text-outline', accent:'#7b829d' },
  { title:'Customer Service Advisor', company:'ClearCall Support', salary:'£21,000/year', icon:'mdi:headset', accent:'#896fc2' },
  { title:'Warehouse Supervisor', company:'ParcelHub Logistics', salary:'£23,500/year', icon:'mdi:warehouse', accent:'#74859b' },
  { title:'Retail Supervisor', company:'Parklane Home', salary:'£22,400/year', icon:'mdi:shopping-outline', accent:'#5f8b73' },
  { title:'Care Assistant', company:'Bluebird Care', salary:'£23,000/year', icon:'mdi:hand-heart-outline', accent:'#bc6f7f' },
];
const FULL_TIME_ANY_DEGREE_JOBS = [
  { title:'Pilot Trainee', company:'SkyReach Academy', salary:'£24,500/year', icon:'mdi:airplane', accent:'#5f89c9' },
  { title:'Teacher Trainee', company:'Northfield Trust', salary:'£23,200/year', icon:'mdi:school-outline', accent:'#8a74bf' },
  { title:'Civil Service Officer', company:'Cabinet Office', salary:'£27,000/year', icon:'mdi:office-building-outline', accent:'#677c96' },
  { title:'Police Graduate Scheme', company:'Metropolitan Police', salary:'£28,000/year', icon:'mdi:shield-account-outline', accent:'#4d6ea8' },
  { title:'Charity Officer', company:'Bright Futures', salary:'£24,000/year', icon:'mdi:hand-heart-outline', accent:'#c3748e' },
  { title:'Project Coordinator', company:'Westbridge Projects', salary:'£25,500/year', icon:'mdi:clipboard-flow-outline', accent:'#8d7a67' },
];
const FULL_TIME_NO_DEGREE_GROWTH_JOBS = [
  { title:'Police Officer', company:'Greater London Police', salary:'£29,000/year', icon:'mdi:shield-account-outline', accent:'#4d6ea8' },
  { title:'Firefighter', company:'City Fire Service', salary:'£30,000/year', icon:'mdi:fire-truck', accent:'#d26b4b' },
  { title:'Estate Agent', company:'Ashdown Estates', salary:'£24,000/year', icon:'mdi:home-city-outline', accent:'#9f7f58' },
  { title:'Sales Executive', company:'Orbit Telecom', salary:'£23,800/year', icon:'mdi:chart-line', accent:'#5a9e76' },
  { title:'Legal Secretary', company:'Crown Chambers', salary:'£24,000/year', icon:'mdi:typewriter', accent:'#a07a62' },
  { title:'Legal Assistant', company:'Avery & Co.', salary:'£26,000/year', icon:'mdi:file-document-outline', accent:'#897667' },
  { title:'Paralegal', company:'Hawthorne Legal', salary:'£28,000/year', icon:'mdi:scale-balance', accent:'#7c6a91' },
  { title:'Recruitment Consultant', company:'TalentBridge', salary:'£24,500/year', icon:'mdi:account-search-outline', accent:'#8a6fb0' },
  { title:'Content Creator', company:'Creator Studio', salary:'£20,000/year', icon:'mdi:video-outline', accent:'#ca7a63' },
  { title:'Actor', company:'Open Casting', salary:'£19,500/year', icon:'mdi:movie-open-outline', accent:'#b48457' },
  { title:'Musician', company:'Indie Sound', salary:'£19,000/year', icon:'mdi:music-note-outline', accent:'#9167b9' },
  { title:'Personal Trainer', company:'Peakform Gym', salary:'£22,000/year', icon:'mdi:dumbbell', accent:'#5f9b7b' },
  { title:'Electrician Apprentice', company:'BrightSpark Trades', salary:'£19,000/year', icon:'mdi:lightning-bolt-outline', accent:'#d28f3f' },
  { title:'Plumber Apprentice', company:'BluePipe Services', salary:'£19,200/year', icon:'mdi:pipe-wrench', accent:'#5f89b7' },
];
const FULL_TIME_DEGREE_JOB_POOLS = {
  Law: [
    { title:'Compliance Assistant', company:'Westbridge Risk', salary:'£24,500/year', icon:'mdi:shield-check-outline', accent:'#6078a3' },
    { title:'Court Clerk', company:'Central Courts', salary:'£23,200/year', icon:'mdi:gavel', accent:'#906f59' },
    { title:'Claims Handler', company:'Alder Insurance', salary:'£23,700/year', icon:'mdi:file-check-outline', accent:'#7f8aa4' },
  ],
  Business: [
    { title:'Finance Assistant', company:'Northbank Finance', salary:'£24,500/year', icon:'mdi:cash-multiple', accent:'#5e9a77' },
    { title:'Marketing Assistant', company:'Kindred Media', salary:'£23,500/year', icon:'mdi:bullhorn-outline', accent:'#cf7a5f' },
    { title:'Sales Executive', company:'Orbit Telecom', salary:'£23,800/year', icon:'mdi:chart-line', accent:'#5a9e76' },
    { title:'Operations Analyst', company:'Westbridge Projects', salary:'£26,000/year', icon:'mdi:cog-outline', accent:'#687d9a' },
    { title:'HR Assistant', company:'Harbour People', salary:'£23,600/year', icon:'mdi:account-group-outline', accent:'#b9738f' },
    { title:'Recruitment Consultant', company:'TalentBridge', salary:'£24,500/year', icon:'mdi:account-search-outline', accent:'#8a6fb0' },
    { title:'Management Trainee', company:'Northstar Retail', salary:'£25,500/year', icon:'mdi:briefcase-account-outline', accent:'#9a7b5b' },
  ],
  Medicine: [
    { title:'Junior Doctor', company:'St. Rowan Hospital', salary:'£31,500/year', icon:'mdi:stethoscope', accent:'#6a92bc' },
    { title:'Junior Doctor', company:'Northgate NHS Trust', salary:'£34,000/year', icon:'mdi:stethoscope', accent:'#5f89b7' },
    { title:'Junior Doctor', company:'Westbridge Teaching Hospital', salary:'£37,000/year', icon:'mdi:stethoscope', accent:'#4b78ab' },
    { title:'Healthcare Assistant', company:'St. Rowan Hospital', salary:'£22,800/year', icon:'mdi:medical-bag', accent:'#6fa08a' },
    { title:'Lab Assistant', company:'Northgate Labs', salary:'£24,000/year', icon:'mdi:flask-outline', accent:'#7c95bf' },
  ],
  Art: [
    { title:'Graphic Designer', company:'Kindred Studio', salary:'£24,000/year', icon:'mdi:palette-outline', accent:'#c06d82' },
    { title:'Illustrator', company:'Paper Moon Press', salary:'£22,500/year', icon:'mdi:draw', accent:'#b98457' },
    { title:'Content Creator', company:'Creator Studio', salary:'£20,000/year', icon:'mdi:video-outline', accent:'#ca7a63' },
    { title:'Gallery Assistant', company:'Willow Gallery', salary:'£21,500/year', icon:'mdi:image-outline', accent:'#8a73b8' },
  ],
  Education: [
    { title:'Teacher Trainee', company:'Northfield Trust', salary:'£23,200/year', icon:'mdi:school-outline', accent:'#8a74bf' },
    { title:'Classroom Support Officer', company:'Westbrook Academy', salary:'£22,400/year', icon:'mdi:book-open-page-variant-outline', accent:'#8a7d63' },
  ],
  Engineering: [
    { title:'Operations Analyst', company:'Westbridge Projects', salary:'£26,000/year', icon:'mdi:cog-outline', accent:'#687d9a' },
    { title:'Electrical Trainee', company:'BrightSpark Systems', salary:'£24,500/year', icon:'mdi:lightning-bolt-outline', accent:'#d28f3f' },
  ],
  History: [
    { title:'Court Clerk', company:'Central Courts', salary:'£23,200/year', icon:'mdi:gavel', accent:'#906f59' },
    { title:'Civil Service Officer', company:'Cabinet Office', salary:'£27,000/year', icon:'mdi:office-building-outline', accent:'#677c96' },
  ],
  Music: [
    { title:'Content Creator', company:'Creator Studio', salary:'£20,000/year', icon:'mdi:video-outline', accent:'#ca7a63' },
    { title:'Musician', company:'Indie Sound', salary:'£19,000/year', icon:'mdi:music-note-outline', accent:'#9167b9' },
  ],
  'Computer Science': [
    { title:'Project Coordinator', company:'Westbridge Projects', salary:'£25,500/year', icon:'mdi:clipboard-flow-outline', accent:'#8d7a67' },
    { title:'Operations Analyst', company:'Westbridge Projects', salary:'£26,000/year', icon:'mdi:cog-outline', accent:'#687d9a' },
  ],
};
const LEGAL_FURTHER_EDUCATION_OPTIONS = [
  {
    id:'Law Masters',
    icon:'mdi:school-outline',
    accent:'#6c58c7',
    durationYears:1,
    fundingCost: 9250,
    blurb:'A one-year postgraduate legal course that opens the solicitor and barrister qualification routes.',
  },
];
const LEGAL_SUPPORT_ROLE_CONFIG = {
  'Legal Secretary': { salaryMin:24000, salaryMax:38000, prestige:1, stress:38, path:['Legal Secretary', 'Senior Legal Secretary', 'Legal Office Manager'] },
  'Legal Assistant': { salaryMin:26000, salaryMax:42000, prestige:2, stress:44, path:['Legal Assistant', 'Paralegal', 'Senior Paralegal', 'Lead Paralegal'] },
  'Paralegal': { salaryMin:28000, salaryMax:55000, prestige:3, stress:52, path:['Paralegal', 'Senior Paralegal', 'Lead Paralegal', 'Principal Paralegal'] },
  'Senior Legal Secretary': { salaryMin:32000, salaryMax:45000, prestige:2, stress:44, path:['Legal Secretary', 'Senior Legal Secretary', 'Legal Office Manager'] },
  'Legal Office Manager': { salaryMin:38000, salaryMax:52000, prestige:3, stress:48, path:['Legal Secretary', 'Senior Legal Secretary', 'Legal Office Manager'] },
  'Senior Paralegal': { salaryMin:38000, salaryMax:65000, prestige:4, stress:58, path:['Paralegal', 'Senior Paralegal', 'Lead Paralegal', 'Principal Paralegal'] },
  'Lead Paralegal': { salaryMin:50000, salaryMax:82000, prestige:5, stress:61, path:['Paralegal', 'Senior Paralegal', 'Lead Paralegal', 'Principal Paralegal'] },
  'Principal Paralegal': { salaryMin:65000, salaryMax:95000, prestige:6, stress:66, path:['Paralegal', 'Senior Paralegal', 'Lead Paralegal', 'Principal Paralegal'] },
};
const LEGAL_QUALIFIED_ROLE_CONFIG = {
  'Year 1 Trainee Solicitor': { salaryMin:50000, salaryMax:60000, prestige:5, stress:82, pathway:'solicitor', yearsToNext:1, nextRole:'Year 2 Trainee Solicitor' },
  'Year 2 Trainee Solicitor': { salaryMin:55000, salaryMax:70000, prestige:6, stress:85, pathway:'solicitor', yearsToNext:1, nextRole:'Junior Associate', qualificationAward:'solicitor' },
  'Junior Associate': { salaryMin:100000, salaryMax:180000, prestige:7, stress:80, pathway:'solicitor', yearsToNext:3, nextRole:'Associate' },
  'Associate': { salaryMin:140000, salaryMax:260000, prestige:8, stress:84, pathway:'solicitor', yearsToNext:4, nextRole:'Senior Associate' },
  'Senior Associate': { salaryMin:200000, salaryMax:450000, prestige:9, stress:88, pathway:'solicitor', yearsToNext:3, yearsToNextMax:6, nextRole:'Partner' },
  'Partner': { salaryMin:700000, salaryMax:5000000, prestige:10, stress:92, pathway:'solicitor' },
  'Pupil Barrister': { salaryMin:25000, salaryMax:75000, prestige:6, stress:78, pathway:'barrister', yearsToNext:1, nextRole:'Junior Barrister', qualificationAward:'barrister' },
  'Junior Barrister': { salaryMin:50000, salaryMax:250000, prestige:7, stress:79, pathway:'barrister', yearsToNext:5, nextRole:'Barrister' },
  'Barrister': { salaryMin:150000, salaryMax:500000, prestige:8, stress:83, pathway:'barrister', yearsToNext:5, nextRole:'KC / Senior Barrister' },
  'KC / Senior Barrister': { salaryMin:300000, salaryMax:2000000, prestige:10, stress:87, pathway:'barrister', yearsToNext:6, nextRole:'Judge' },
  'Judge': { salaryMin:350000, salaryMax:900000, prestige:10, stress:76, pathway:'judge' },
};
const LEGAL_JOB_LISTINGS = [
  { title:'Year 1 Trainee Solicitor', company:'Marlow Partners', icon:'mdi:briefcase-outline', accent:'#5f74b7' },
  { title:'Year 1 Trainee Solicitor', company:'Blackwell Legal', icon:'mdi:briefcase-outline', accent:'#4c6db5' },
  { title:'Year 1 Trainee Solicitor', company:'Kingsley Stone', icon:'mdi:briefcase-outline', accent:'#395ea8' },
  { title:'Pupil Barrister', company:'Crown Chambers', icon:'mdi:gavel', accent:'#8a5e52' },
  { title:'Pupil Barrister', company:'Temple Row Chambers', icon:'mdi:gavel', accent:'#6c5b94' },
  { title:'Junior Associate', company:'Blackwell Legal', icon:'mdi:scale-balance', accent:'#4969b0' },
  { title:'Associate', company:'Kingsley Stone', icon:'mdi:scale-balance', accent:'#365999' },
  { title:'Senior Associate', company:'Marlow Partners', icon:'mdi:scale-balance', accent:'#274f8f' },
  { title:'Partner', company:'Ashcroft & Vale', icon:'mdi:crown-outline', accent:'#c08b2d' },
  { title:'Junior Barrister', company:'Temple Row Chambers', icon:'mdi:gavel', accent:'#8c654f' },
  { title:'Barrister', company:'Stone Court Chambers', icon:'mdi:gavel', accent:'#73548f' },
  { title:'KC / Senior Barrister', company:'Temple Row Chambers', icon:'mdi:crown-outline', accent:'#b6812c' },
  { title:'Judge', company:'Royal Courts of Justice', icon:'mdi:account-tie-hat', accent:'#394b74' },
];
let _jobBoardCategory = 'full-time';
let _cachedFullTimeJobs = [];
let _cachedFullTimeSignature = '';
let _jobFlowState = null;
const JOB_INTERVIEW_QUESTION_POOLS = {
  retail: [
    { question:'A customer starts shouting at you. What do you do?', answers:[
      { text:'Stay calm and try to help', effects:{ interviewScore:+8, calmness:+2, reliability:+1 } },
      { text:'Ask a manager to step in', effects:{ interviewScore:+4, teamwork:+1, calmness:+1 } },
      { text:'Argue back', effects:{ interviewScore:-8, calmness:-2, judgement:-2 } },
      { text:'Ignore them', effects:{ interviewScore:-6, reliability:-2 } },
    ]},
    { question:'The shift suddenly gets very busy. What do you focus on?', answers:[
      { text:'Keep moving and help the team where needed', effects:{ interviewScore:+7, workEthic:+2, teamwork:+2 } },
      { text:'Focus only on your own task', effects:{ interviewScore:+1, reliability:+1 } },
      { text:'Panic and hope it slows down', effects:{ interviewScore:-5, calmness:-2 } },
      { text:'Take a quick break first', effects:{ interviewScore:-6, workEthic:-2 } },
    ]},
    { question:'Your co-worker is struggling on shift. What do you do?', answers:[
      { text:'Help them if you can', effects:{ interviewScore:+6, teamwork:+2 } },
      { text:'Tell the supervisor early', effects:{ interviewScore:+4, judgement:+1, reliability:+1 } },
      { text:'Leave them to figure it out', effects:{ interviewScore:-4, teamwork:-2 } },
      { text:'Complain that they are slowing you down', effects:{ interviewScore:-7, teamwork:-2, judgement:-1 } },
    ]},
  ],
  office: [
    { question:'You realise you made a mistake on a file. What do you do?', answers:[
      { text:'Own it and fix it quickly', effects:{ interviewScore:+8, reliability:+2, judgement:+2 } },
      { text:'Tell someone once you know the fix', effects:{ interviewScore:+5, reliability:+1 } },
      { text:'Hope nobody notices', effects:{ interviewScore:-7, reliability:-2 } },
      { text:'Blame the system', effects:{ interviewScore:-6, judgement:-2 } },
    ]},
    { question:'How do you handle a tight deadline?', answers:[
      { text:'Prioritise, stay organised, and keep people updated', effects:{ interviewScore:+8, workEthic:+2, reliability:+2 } },
      { text:'Work through it quietly on your own', effects:{ interviewScore:+3, workEthic:+1 } },
      { text:'Leave it until the last minute', effects:{ interviewScore:-7, workEthic:-2 } },
      { text:'Ask for extra time immediately', effects:{ interviewScore:-2, calmness:-1 } },
    ]},
    { question:'What makes you reliable at work?', answers:[
      { text:'I stay organised and follow through', effects:{ interviewScore:+7, reliability:+2 } },
      { text:'I do what I am told and keep it simple', effects:{ interviewScore:+3, reliability:+1 } },
      { text:'I usually figure things out somehow', effects:{ interviewScore:-1, judgement:-1 } },
      { text:'I get bored easily but I try', effects:{ interviewScore:-5, workEthic:-2 } },
    ]},
  ],
  creative: [
    { question:'How do you handle criticism of your work?', answers:[
      { text:'Listen, improve, and keep your style', effects:{ interviewScore:+8, creativity:+2, calmness:+1 } },
      { text:'Take what is useful and move on', effects:{ interviewScore:+5, creativity:+1 } },
      { text:'Defend every decision', effects:{ interviewScore:-5, calmness:-2 } },
      { text:'Lose confidence completely', effects:{ interviewScore:-6, creativity:-1 } },
    ]},
    { question:'What matters most in creative work?', answers:[
      { text:'Originality that still solves the brief', effects:{ interviewScore:+8, creativity:+2, judgement:+1 } },
      { text:'Doing what is popular', effects:{ interviewScore:+1 } },
      { text:'Working fast, whatever the result', effects:{ interviewScore:-3, reliability:-1 } },
      { text:'Only making what you personally like', effects:{ interviewScore:-4, teamwork:-1 } },
    ]},
    { question:'Your first idea is not working. What next?', answers:[
      { text:'Iterate and try a new angle', effects:{ interviewScore:+7, creativity:+2, workEthic:+1 } },
      { text:'Ask for feedback early', effects:{ interviewScore:+5, teamwork:+1 } },
      { text:'Start over from scratch in a panic', effects:{ interviewScore:-3, calmness:-1 } },
      { text:'Submit it anyway', effects:{ interviewScore:-6, judgement:-2 } },
    ]},
  ],
  emergency: [
    { question:'How do you react under pressure?', answers:[
      { text:'Stay focused and follow training', effects:{ interviewScore:+9, calmness:+2, judgement:+2 } },
      { text:'Act fast and trust instinct', effects:{ interviewScore:+4, bravery:+1, judgement:-1 } },
      { text:'Wait for someone else to lead', effects:{ interviewScore:-4, bravery:-1 } },
      { text:'Freeze up', effects:{ interviewScore:-8, calmness:-2 } },
    ]},
    { question:'What matters most in emergency work?', answers:[
      { text:'Teamwork and good judgement', effects:{ interviewScore:+8, teamwork:+2, judgement:+2 } },
      { text:'Being fearless', effects:{ interviewScore:+2, bravery:+2, judgement:-1 } },
      { text:'Doing what you want in the moment', effects:{ interviewScore:-7, judgement:-2 } },
      { text:'Looking impressive', effects:{ interviewScore:-6, reliability:-2 } },
    ]},
    { question:'A colleague makes a risky call. What do you do?', answers:[
      { text:'Challenge it calmly if safety is at risk', effects:{ interviewScore:+8, judgement:+2, calmness:+1 } },
      { text:'Back them publicly, discuss later', effects:{ interviewScore:+3, teamwork:+1 } },
      { text:'Do nothing', effects:{ interviewScore:-5, reliability:-1 } },
      { text:'Call them out aggressively', effects:{ interviewScore:-6, teamwork:-2 } },
    ]},
  ],
  sales: [
    { question:'How do you handle rejection?', answers:[
      { text:'Reset quickly and keep going', effects:{ interviewScore:+8, workEthic:+2, calmness:+1 } },
      { text:'Learn from it and try again later', effects:{ interviewScore:+6, judgement:+1 } },
      { text:'Take it personally', effects:{ interviewScore:-6, calmness:-2 } },
      { text:'Push harder until they give in', effects:{ interviewScore:-3, judgement:-1 } },
    ]},
    { question:'What makes someone good at sales?', answers:[
      { text:'Listening, persistence, and confidence', effects:{ interviewScore:+8, teamwork:+1, reliability:+1 } },
      { text:'Talking fast and sounding impressive', effects:{ interviewScore:+1 } },
      { text:'Only chasing easy wins', effects:{ interviewScore:-4, workEthic:-1 } },
      { text:'Putting pressure on people', effects:{ interviewScore:-5, judgement:-1 } },
    ]},
    { question:'You are behind target. What do you do?', answers:[
      { text:'Review what is working and push smarter', effects:{ interviewScore:+8, judgement:+2, workEthic:+1 } },
      { text:'Work longer and hope it turns', effects:{ interviewScore:+3, workEthic:+1 } },
      { text:'Blame the market', effects:{ interviewScore:-4, reliability:-1 } },
      { text:'Give up on the month', effects:{ interviewScore:-7, workEthic:-2 } },
    ]},
  ],
  corporate: [
    { question:'Tell us about a time you solved a difficult problem.', answers:[
      { text:'Break it down, analyse options, then act', effects:{ interviewScore:+9, judgement:+2, reliability:+1 } },
      { text:'Work hard until something clicks', effects:{ interviewScore:+4, workEthic:+2 } },
      { text:'Ask someone smarter to solve it', effects:{ interviewScore:-2, reliability:-1 } },
      { text:'Go with instinct immediately', effects:{ interviewScore:-5, judgement:-2 } },
    ]},
    { question:'What helps you perform in competitive environments?', answers:[
      { text:'Preparation, consistency, and learning fast', effects:{ interviewScore:+8, workEthic:+2, calmness:+1 } },
      { text:'Networking and confidence', effects:{ interviewScore:+5, reliability:+1 } },
      { text:'Natural talent alone', effects:{ interviewScore:-4, workEthic:-1 } },
      { text:'Pressure usually makes me spiral', effects:{ interviewScore:-7, calmness:-2 } },
    ]},
    { question:'A project starts going off track. What do you do?', answers:[
      { text:'Escalate early with a clear plan', effects:{ interviewScore:+8, judgement:+2, reliability:+2 } },
      { text:'Work privately to fix it first', effects:{ interviewScore:+3, workEthic:+1 } },
      { text:'Hope it sorts itself out', effects:{ interviewScore:-6, reliability:-2 } },
      { text:'Find someone else to take over', effects:{ interviewScore:-5, judgement:-1 } },
    ]},
  ],
};
const JOB_INTERVIEW_EVENTS = [
  { text:'Traffic slowed you down and you arrived slightly late.', score:-5, categories:['retail','office','sales','corporate','creative','emergency'] },
  { text:'The interviewer seems to like your energy straight away.', score:+5, categories:['retail','sales','creative'] },
  { text:'The interviewer is in a bad mood for no clear reason.', score:-4, categories:['office','corporate','sales'] },
  { text:'Another candidate performs badly before you go in.', score:+4, categories:['office','sales','corporate'] },
  { text:'A fire alarm interrupts the interview and throws everyone off.', score:0, categories:['emergency','office','corporate'] },
  { text:'The interviewer recognises your name from somewhere positive.', score:+4, categories:['retail','office','sales','creative'] },
  { text:'You spill coffee just before the interview starts.', score:-3, categories:['office','corporate','sales'] },
];
function switchTab(tab, el) {
  _currentTab = tab;
  if (tab !== 'learn') {
    _learnScreen = 'main';
    _learnClassmateId = null;
  }
  ['life','family','learn','activities'].forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    tabEl.style.display = t === tab ? (t === 'life' ? 'flex' : 'flex') : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('game-topbar-title').textContent = 'Life Cards';

  if (tab === 'family') renderFamilyTab();
  if (tab === 'learn')  renderLearnTab();
}

// ── LIFE TAB ──────────────────────────────────────────────
function updateAllUI() {
  ensureRelationshipOrderState();
  updateLifeTab();
  updateNavLearnLabel();
  if (_currentTab === 'family') renderFamilyTab();
  if (_currentTab === 'learn')  renderLearnTab();
}
function isWorkTabActive() {
  return STATE.age >= 18 && STATE.school.level !== 'uni';
}
function isGraduate() {
  return STATE.school.level === 'graduated' || STATE.school.postSchool?.uniApplication?.status === 'graduated';
}
function getDegreeCourse() {
  const application = STATE.school.postSchool?.uniApplication;
  return isGraduate() ? (application?.degreeAwarded || application?.course || null) : null;
}
function updateNavLearnLabel() {
  const label = document.getElementById('nav-learn-label');
  const icon = document.getElementById('nav-learn').querySelector('.icon');
  if (isWorkTabActive()) {
    label.textContent = 'Work';
    icon.textContent = 'work';
    return;
  }
  label.textContent = 'Learn';
  icon.textContent = 'school';
}
function updateLifeTab() {
  const avatarEl = document.getElementById('profile-avatar');
  const avatarStage = getStageKey(STATE.age, STATE.gender);
  const spriteChanged = _lastRenderedAvatarStage !== null && _lastRenderedAvatarStage !== avatarStage;
  if (spriteChanged) avatarEl.classList.add('is-aging');
  avatarEl.innerHTML = getCharacterHTML(STATE.appearance, STATE.age, 56);
  _lastRenderedAvatarAge = STATE.age;
  _lastRenderedAvatarStage = avatarStage;
  if (spriteChanged) setTimeout(() => avatarEl.classList.remove('is-aging'), 520);
  document.getElementById('profile-name').textContent   = STATE.fullName;
  document.getElementById('badge-age').textContent      = `Age ${STATE.age}`;
  document.getElementById('badge-stage').textContent    = getProfileRoleLabel();
  document.getElementById('badge-sign').textContent     = `${STATE.starSign.symbol} ${STATE.starSign.sign}`;
  document.getElementById('topbar-nw-val').textContent = fmtMoney(STATE.finances.balance);
  const C  = 175.9;
  const si = LIFE_STAGES.findIndex(s => STATE.age <= s.maxAge);
  const lo = si > 0 ? LIFE_STAGES[si-1].maxAge : 0;
  const hi = LIFE_STAGES[si].maxAge === 999 ? 80 : LIFE_STAGES[si].maxAge;
  document.getElementById('avatar-ring').style.strokeDashoffset =
    C - Math.min((STATE.age - lo) / (hi - lo), 1) * C;
  renderStatGrid();
  renderActivityLog();
  renderReputationPanel();
}
function getProfileRoleLabel() {
  const schoolLevels = new Set(['pre', 'primary', 'secondary', 'college', 'uni']);
  if (STATE.age < 5) return 'Child';
  if (schoolLevels.has(STATE.school.level) && STATE.age < 22) return 'Student';
  if (STATE.career.job && STATE.career.job !== 'None') return STATE.career.job;
  return 'Unemployed';
}
function renderStatGrid() {
  const grid = document.getElementById('stat-grid'), age = STATE.age, s = STATE.stats;
  const stats = [];
  if (age >= 0) stats.push({ id:'health', label:'Health',    val:s.health, hub:'health' });
  if (age >= 0) stats.push({ id:'happy',  label:'Happiness', val:s.happy,  hub:'happy'  });
  if (age >= 0) stats.push({ id:'smarts', label:'Smarts',    val:s.smarts, hub:'smarts' });
  if (age >= 0) stats.push({ id:'looks',  label:'Looks',     val:s.looks,  hub:'looks'  });
  const iconMap = {
  health: { icon:'solar:heart-pulse-bold-duotone', bg:'#fee2e2', color:'#ef4444', fill:'#fba9a8' },
  happy:  { icon:'happy', bg:'#fffcd9', color:'#ffd52a', fill:'#ffd52a' },
  smarts: { icon:'smarts', bg:'#dbeafe', color:'#8fbffa', fill:'#8fbffa' },
  looks:  { icon:'looks', bg:'#fce7f3', color:'#ff89db', fill:'#ff89db' },
};
  if (!grid.dataset.ready) {
    grid.innerHTML = stats.map(st => {
      const ic = iconMap[st.id];
      return `
        <div class="stat-card" onclick="openStatSheet('${st.hub}')">
          <div class="stat-card-top">
            <div style="width:36px;height:36px;border-radius:99px;background:${ic.bg};display:flex;align-items:center;justify-content:center">
              ${ic.icon === 'smarts' ? '<span class="brain-icon"></span>'
    : ic.icon === 'happy' ? '<span class="sunny-icon"></span>'
    : ic.icon === 'looks' ? '<span class="looks-icon"></span>'
    : `<iconify-icon icon="${ic.icon}" style="font-size:20px;color:${ic.color}"></iconify-icon>`
  }
            </div>
            <span class="stat-card-arrow">›</span>
          </div>
          <div class="stat-card-val" data-stat-val="${st.id}">${st.val}</div>
          <div class="stat-card-label">${st.label}</div>
          <div class="stat-card-bar"><div class="stat-card-fill" data-stat="${st.id}" style="width:${clamp(st.val)}%;background:${ic.fill}"></div></div>
        </div>`;
    }).join('');
    grid.dataset.ready = 'true';
  }
  stats.forEach(st => {
    const valEl = grid.querySelector(`[data-stat-val="${st.id}"]`);
    const fillEl = grid.querySelector(`.stat-card-fill[data-stat="${st.id}"]`);
    if (valEl) valEl.textContent = st.val;
    if (fillEl) {
      fillEl.style.width = `${clamp(st.val)}%`;
      fillEl.style.background = iconMap[st.id].fill;
    }
  });
}
function repLabel(value) {
  if (value <= -60) return 'Notorious';
  if (value < -15)  return 'Dubious';
  if (value <= 15)  return 'Neutral';
  if (value < 60)   return 'Respected';
  return 'Honourable';
}
function renderReputationPanel() {
  const panel = document.getElementById('reputation-panel');
  if (!panel) return;
  const rep = clamp(STATE.stats.rep || 0, -100, 100);
  const positiveFill = rep > 0 ? rep / 2 : 0;
  const negativeFill = rep < 0 ? Math.abs(rep) / 2 : 0;
  if (!panel.dataset.ready) {
    panel.innerHTML = `
      <img src="data/characters/all/angel.png" style="width:32px;height:32px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'"/>
      <div class="honour-track">
        <div id="honour-positive-fill" style="position:absolute;left:0;right:0;top:0;background:linear-gradient(to top, #facc15 0%, #22c55e 100%);"></div>
        <div id="honour-negative-fill" style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(to bottom, #fb923c 0%, #ef4444 100%);"></div>
        <div id="honour-marker" class="honour-marker"></div>
      </div>
      <img src="data/characters/all/devil.png" style="width:32px;height:32px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'"/>`;
    panel.dataset.ready = 'true';
  }
  const positiveEl = document.getElementById('honour-positive-fill');
  const negativeEl = document.getElementById('honour-negative-fill');
  const marker = document.getElementById('honour-marker');
  if (positiveEl) {
    positiveEl.style.top = `calc(50% - ${positiveFill}%)`;
    positiveEl.style.height = `${positiveFill}%`;
  }
  if (negativeEl) {
    negativeEl.style.bottom = '0';
    negativeEl.style.height = `${negativeFill}%`;
  }
  if (marker) marker.style.bottom = `calc(50% - 4px)`;
}
function getActivityIcon(text) {
  if (/school|class|grade|study|learn|exam|spelling/i.test(text)) return '📚';
  if (/friend|chat|classmate/i.test(text))                        return '👥';
  if (/mum|dad|parent|family|sibling|brother|sister/i.test(text)) return '🏠';
  if (/job|work|career|salary|pay|hustle/i.test(text))            return '💼';
  if (/pet|dog|cat|puppy/i.test(text))                            return '🐾';
  if (/born|birth|hospital/i.test(text))                          return '👶';
  if (/gym|run|health|sport|fit/i.test(text))                     return '🏃';
  if (/money|£|bank|invest/i.test(text))                          return '💰';
  if (/holiday|travel/i.test(text))                               return '✈️';
  if (/book|read|library/i.test(text))                            return '📖';
  return '✦';
}
function renderActivityLog() {
  const list = document.getElementById('activity-list');
  if (!STATE.activity.length) {
    list.innerHTML = '<div class="activity-empty">Nothing yet. Your life is just beginning.</div>';
    return;
  }
  const grouped = new Map();
  STATE.activity.slice(0, 20).forEach(a => {
    if (!grouped.has(a.age)) grouped.set(a.age, []);
    grouped.get(a.age).push(a);
  });
  list.innerHTML = Array.from(grouped.entries()).map(([age, entries]) => `
    <div class="life-log-divider">Age ${age}</div>
    ${entries.map(a => `
      <div class="life-log-item">
        <div class="life-log-body">
          <div class="life-log-text">${a.text}</div>
        </div>
      </div>`).join('')}
  `).join('');
}

// ── STAT SHEET ────────────────────────────────────────────
function openStatSheet(hub) {
  const labels = { popularity:'🔥 Popularity', smarts:'🧠 Smarts', looks:'✨ Looks', health:'❤️ Health', happy:'😊 Happiness', rep:'⭐ Reputation' };
  const vals   = { popularity:STATE.stats.popularity, smarts:STATE.stats.smarts, looks:STATE.stats.looks, health:STATE.stats.health, happy:STATE.stats.happy, rep:STATE.stats.rep };
  const actionMap = { popularity:[], smarts:ACTIONS.smarts, looks:ACTIONS.looks, health:ACTIONS.health, happy:ACTIONS.happy, rep:ACTIONS.rep };
  const acts = actionMap[hub] || [];
  document.getElementById('event-inner').innerHTML = `
    <div class="hub-hero"><div class="hub-hero-label">${labels[hub]}</div><div class="hub-hero-val">${vals[hub]}</div><div class="hub-hero-sub">out of 100</div></div>
    <div class="section-title">Actions</div>
    <div class="action-list">${acts.map(a => buildActionHTML(a)).join('')}</div>`;
  wireActions(document.getElementById('event-inner'), acts, () => {
    updateAllUI();
    openStatSheet(hub);
  });
  document.getElementById('event-overlay').classList.add('open');
}
function closeEventOverlay() {
  document.getElementById('event-overlay').classList.remove('open');
}

// ── FAMILY TAB ────────────────────────────────────────────
function renderFamilyTab() {
  const currentSubTab = window._familySubTab || 'family';
  document.getElementById('family-tab-bar').innerHTML = ['Family','Partner','Friends','Quick Contact']
    .map((label, i) => {
      const key = ['family','partner','friends','quick'][i];
      return `<button class="family-subtab ${currentSubTab === key ? 'active' : ''}" onclick="switchFamilyTab('${key}')">${label}</button>`;
    }).join('');
  if (currentSubTab === 'family')  renderFamilyPeople();
  if (currentSubTab === 'partner') renderFamilyPartner();
  if (currentSubTab === 'friends') renderFamilyFriends();
  if (currentSubTab === 'quick')   renderFamilyQuick();
}
function switchFamilyTab(key) {
  window._familySubTab = key;
  renderFamilyTab();
}
function ensureRelationshipOrderState() {
  if (!STATE.relationshipOrder) STATE.relationshipOrder = {};
  if (!Array.isArray(STATE.relationshipOrder.family)) STATE.relationshipOrder.family = [];
  if (!Array.isArray(STATE.relationshipOrder.friends)) STATE.relationshipOrder.friends = [];
}
function getFamilyPeopleEntries() {
  const people = [];
  if (!['single_dad'].includes(STATE.family.situation))
    people.push({ person:STATE.family.mum, role:'Mother', rel:STATE.family.mum.relationship ?? STATE.relationships.family, traitPool:PARENT_TRAITS_POOL });
  if (!['single_mum','never_knew'].includes(STATE.family.situation))
    people.push({ person:STATE.family.dad, role:'Father', rel:STATE.family.dad.relationship ?? STATE.relationships.family, traitPool:PARENT_TRAITS_POOL });
  STATE.family.siblings.forEach(s =>
    people.push({ person:s, role:s.gender==='male'?'Brother':'Sister', rel:s.relationship||60, traitPool:CLASSMATE_TRAITS_POOL }));
  STATE.family.pets.filter(p => !p.dead).forEach(p =>
    people.push({ person:{...p, firstName:p.name, traits:[]}, role:'Pet', rel:p.happiness, traitPool:[] }));
  return people;
}
function getFriendEntries() {
  ensurePersistentFriendState();
  const liveFriends = STATE.school.classmates.filter(c => c.status === 'friend');
  liveFriends.forEach(upsertPersistentFriend);
  const merged = STATE.social.friends.map(savedFriend =>
    STATE.school.classmates.find(c => c.id === savedFriend.id) || savedFriend
  );
  return merged.map(friend => ({ person:friend, role:'Friend', rel:friend.relationship, traitPool:CLASSMATE_TRAITS_POOL }));
}
function getOrderedRelationshipEntries(listKey, entries) {
  ensureRelationshipOrderState();
  const ids = entries.map(({ person }) => person.id);
  const saved = STATE.relationshipOrder[listKey].filter(id => ids.includes(id));
  const nextOrder = [...saved, ...ids.filter(id => !saved.includes(id))];
  STATE.relationshipOrder[listKey] = nextOrder;
  const byId = new Map(entries.map(entry => [entry.person.id, entry]));
  return nextOrder.map(id => byId.get(id)).filter(Boolean);
}
function renderRelationshipList(listKey, heading, entries) {
  const orderedEntries = getOrderedRelationshipEntries(listKey, entries);
  const listId = `relationship-list-${listKey}`;
  document.getElementById('family-tab-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">${heading}</span>
      </div>
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">${orderedEntries.length} contacts</span>
    </div>
    <div class="relationship-list" id="${listId}" data-reorder-list="${listKey}">
      ${orderedEntries.map(({ person, role, rel, traitPool }) => buildPersonCard(person, role, rel, traitPool, { reorderable:true, listKey })).join('')}
    </div>
    ${listKey === 'family' ? `<div class="family-find-card" onclick="showToast('Coming soon!')">
      <span style="font-size:18px">＋</span>
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Find Extended Family</span>
    </div>` : ''}`;
  wireRelationshipReorder(listId, listKey);
}
function renderFamilyPeople() {
  renderRelationshipList('family', 'Immediate Family', getFamilyPeopleEntries());
}
function renderFamilyPartner() {
  const r = STATE.relationships;
  document.getElementById('family-tab-content').innerHTML = r.partner > 0 && STATE._partnerName
    ? `<div style="display:flex;flex-direction:column;gap:8px">${buildPersonCard({ firstName:STATE._partnerName, emoji:'💑', id:'__partner__', traits:[] }, 'Partner', r.partner, [])}</div>`
    : buildEmptyState('💑', 'No partner yet.', 'Download a dating app. You never know.');
}
function renderFamilyFriends() {
  const friends = getFriendEntries();
  if (!friends.length) {
    document.getElementById('family-tab-content').innerHTML = buildEmptyState('👥', 'No friends yet.', 'Make your first friend at school.');
    return;
  }
  renderRelationshipList('friends', 'Friends', friends);
}
function renderFamilyQuick() {
  document.getElementById('family-tab-content').innerHTML = `
    <div class="section-title">Quick Contact</div>
    <div class="action-list" id="quick-contact-actions">
      ${FAMILY_ACTIONS.map(a => buildActionHTML(a)).join('')}
    </div>`;
  wireActions(document.getElementById('quick-contact-actions'), FAMILY_ACTIONS, () => {
    updateAllUI();
    renderFamilyTab();
  });
}

// ── PERSON CARD BUILDERS ──────────────────────────────────
let _expandedCardId = null;
let _relationshipDrag = null;
let _personSheetDrag = null;

function buildPersonCardAvatar(person) {
  const accent = familyRoleAccent(person._roleCard || person._role || '');
  const content = person.appearance
    ? getCharacterHTML(person.appearance, person.age || STATE.age, 52, { showBg: false })
    : `<span style="font-size:26px">${person.emoji || '👤'}</span>`;
  return `<div class="person-avatar-sq" style="border:2px solid ${accent.outline};box-shadow:0 0 0 3px ${accent.ring}">${content}</div>`;
}

function buildPersonCardRelBar(rel) {
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
      <div style="flex:1;height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden">
        <div style="width:${rel}%;height:100%;background:#74b551;border-radius:99px"></div>
      </div>
      <span style="font-family:var(--mono);font-size:11px;color:#74b551;font-weight:700">${rel}%</span>
    </div>`;
}

function buildPersonCardTraits(person, traitPool) {
  return (person.traits || []).slice(0, 2).map(tid => {
    const t = traitPool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.label}</span>`;
  }).join('');
}

function familyRoleAccent(role) {
  if (role === 'Mother') return { outline:'rgba(233, 136, 154, 0.55)', ring:'rgba(233, 136, 154, 0.1)', icon:'#cc6f82', bg:'#fff4f6' };
  if (role === 'Father') return { outline:'rgba(103, 190, 217, 0.55)', ring:'rgba(103, 190, 217, 0.1)', icon:'#5a86be', bg:'#f3f8fd' };
  if (role === 'Brother' || role === 'Sister') return { outline:'rgba(173, 149, 196, 0.55)', ring:'rgba(173, 149, 196, 0.1)', icon:'#8b70b0', bg:'#f8f4fc' };
  return { outline:'rgba(217, 203, 186, 0.65)', ring:'rgba(217, 203, 186, 0.1)', icon:'#8b7f73', bg:'#fff9ef' };
}

function buildSpeechBubbleIcon(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 26 26" aria-hidden="true">
    <path fill="${color}" d="M13 .188C5.924.188.187 5.252.187 11.5c0 3.177 1.488 6.039 3.876 8.094c-.521 3.009-3.887 4.234-3.657 5.062c3.01 1.245 8.971-1.645 9.875-2.093c.874.166 1.789.25 2.719.25c7.076 0 12.813-5.065 12.813-11.313S20.075.187 13 .187z"></path>
  </svg>`;
}

function buildDotsIcon(color = '#5f5145') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="${color}"></circle>
    <circle cx="8" cy="8" r="1.5" fill="${color}"></circle>
    <circle cx="13" cy="8" r="1.5" fill="${color}"></circle>
  </svg>`;
}
function buildPersonCardExpandedBody(person, role, rel, traitPool) {
  const traits = buildPersonCardTraits(person, traitPool);
  const actions = getAvailableActions(role, STATE.age, person);
  const actionButtons = actions.map(action => `
    <button onclick="triggerAction('${action.id}', '${person.id}', '${role}')"
      style="width:100%;padding:11px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:11px;font-size:13px;font-weight:600;color:var(--text);text-align:left;cursor:pointer">
      ${action.name}
    </button>
  `).join('');
  
  return `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted)">Relationship</span>
        <span style="font-family:var(--mono);font-size:12px;font-weight:700;color:#74b551">${rel}%</span>
      </div>
      <div style="width:100%;height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden;margin-bottom:14px">
        <div style="width:${rel}%;height:100%;background:#74b551;border-radius:99px"></div>
      </div>
      ${actionButtons ? `<div style="display:flex;flex-direction:column;gap:8px">${actionButtons}</div>` : ''}
    </div>`;
}



function buildPersonCard(person, role, rel, traitPool, options = {}) {
  person._roleCard = role;
  const isExpanded = _expandedCardId === person.id;
  const avatar     = buildPersonCardAvatar(person);
  const relBar     = !isExpanded ? buildPersonCardRelBar(rel) : '';
  const expanded   = isExpanded  ? buildPersonCardExpandedBody(person, role, rel, traitPool) : '';
  const traits     = buildPersonCardTraits(person, traitPool);
  const rawName    = `${person.firstName}${person.surname ? ' ' + person.surname : ''}`;
  const fullName   = (role === 'Friend' || role === 'classmate') ? classmateDisplayName(person) : rawName;
  const accent     = familyRoleAccent(role);
  const ageLabel   = person.age !== undefined ? ` <strong style="font-weight:800;color:var(--text)">•</strong> <strong style="font-weight:800;color:var(--text)">Age ${person.age}</strong>` : '';
  return `
    <div class="person-card" data-person-id="${person.id}" data-list-key="${options.listKey || ''}" style="flex-direction:column;align-items:stretch;gap:0;cursor:default">
      <div style="display:flex;align-items:center;gap:14px">
        ${avatar}
        <div style="flex:1;min-width:0">
          <div style="font-size:17px;font-weight:800;letter-spacing:-.02em">${fullName}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px"><strong style="font-weight:800;color:var(--text)">${role}</strong>${ageLabel}</div>
          ${traits ? `<div class="trait-pills" style="margin-top:8px">${traits}</div>` : ''}
          ${relBar}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button onclick="event.stopPropagation();togglePersonCard('${person.id}')"
            style="width:38px;height:38px;border-radius:99px;background:${accent.bg};border:1px solid ${accent.outline};box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildSpeechBubbleIcon(accent.icon)}</button>
          <button onclick="event.stopPropagation();openPersonSheet('${person.id}','${role}')"
            style="width:38px;height:38px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildDotsIcon()}</button>
        </div>
      </div>
      ${expanded}
    </div>`;
}

function getRelationshipDragAfterElement(list, pointerY) {
  const items = [...list.querySelectorAll('.person-card[data-person-id]:not(.is-dragging)')];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    const offset = pointerY - (rect.top + rect.height / 2);
    if (offset < 0 && offset > closest.offset) closest = { offset, element:item };
  });
  return closest.element;
}
function persistRelationshipOrder(listEl, listKey) {
  STATE.relationshipOrder[listKey] = [...listEl.querySelectorAll('.person-card[data-person-id]')].map(el => el.dataset.personId);
  saveGame();
}
function onRelationshipDragMove(event) {
  if (!_relationshipDrag) return;
  if (event.cancelable) event.preventDefault();
  const drag = _relationshipDrag;
  drag.card.style.transform = `translateY(${event.clientY - drag.startY}px) scale(1.01)`;
  const afterElement = getRelationshipDragAfterElement(drag.list, event.clientY);
  if (!afterElement) drag.list.appendChild(drag.card);
  else if (afterElement !== drag.card.nextElementSibling) drag.list.insertBefore(drag.card, afterElement);
}
function beginRelationshipDrag(card, list, listKey, startY) {
  _relationshipDrag = { card, list, listKey, startY };
  card.classList.add('is-dragging');
  card.style.transition = 'none';
  card.style.zIndex = '5';
  document.body.classList.add('is-reordering-people');
  window.addEventListener('pointermove', onRelationshipDragMove, { passive:false });
  window.addEventListener('pointerup', endRelationshipDrag);
  window.addEventListener('pointercancel', endRelationshipDrag);
}
function endRelationshipDrag() {
  const drag = _relationshipDrag;
  if (!drag) return;
  drag.card.classList.remove('is-dragging');
  drag.card.style.transform = '';
  drag.card.style.transition = '';
  drag.card.style.zIndex = '';
  document.body.classList.remove('is-reordering-people');
  persistRelationshipOrder(drag.list, drag.listKey);
  _relationshipDrag = null;
  window.removeEventListener('pointermove', onRelationshipDragMove);
  window.removeEventListener('pointerup', endRelationshipDrag);
  window.removeEventListener('pointercancel', endRelationshipDrag);
}
function wireRelationshipReorder(listId, listKey) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll('.person-card[data-person-id]').forEach(card => {
    card.onpointerdown = event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button')) return;
      const startX = event.clientX;
      const startY = event.clientY;
      const isTouch = event.pointerType === 'touch';
      let cancelled = false;
      let active = false;
      let holdTimer = null;
      const cleanupPending = () => {
        clearTimeout(holdTimer);
        window.removeEventListener('pointermove', trackPending);
        window.removeEventListener('pointerup', cancelPending);
        window.removeEventListener('pointercancel', cancelPending);
      };
      const startDrag = moveEvent => {
        if (cancelled || active || _relationshipDrag) return;
        active = true;
        cleanupPending();
        beginRelationshipDrag(card, list, listKey, startY);
        if (moveEvent && moveEvent !== event) onRelationshipDragMove(moveEvent);
      };
      const trackPending = moveEvent => {
        const moved = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
        if (isTouch && moved > 8) {
          cancelled = true;
          cleanupPending();
          return;
        }
        if (!isTouch && moved > 5) startDrag(moveEvent);
      };
      const cancelPending = () => {
        cancelled = true;
        cleanupPending();
      };
      holdTimer = setTimeout(() => startDrag(event), isTouch ? 260 : 180);
      window.addEventListener('pointermove', trackPending, { passive:true });
      window.addEventListener('pointerup', cancelPending);
      window.addEventListener('pointercancel', cancelPending);
    };
  });
}

function togglePersonCard(personId) {
  _expandedCardId = _expandedCardId === personId ? null : personId;
  renderFamilyTab();
}
function buildEmptyState(emoji, title, subtitle) {
  return `<div class="placeholder-tab">
    <div style="font-size:40px">${emoji}</div>
    <div style="font-size:15px;font-weight:700;color:var(--text)">${title}</div>
    <div style="font-size:13px;color:var(--text-faint)">${subtitle}</div>
  </div>`;
}
function educationLevelForAge(age) {
  if (age < 5)  return 'Pre-school';
  if (age < 12) return 'Primary school';
  if (age < 17) return 'Secondary school';
  if (age < 19) return 'Sixth form / college';
  if (age < 22) return 'University age';
  return 'Finished education';
}
function compatibilityFor(person) {
  if (person.compatibility !== undefined) return person.compatibility;
  const seed = `${person.firstName || ''}${person.surname || ''}${person.age || 0}`.split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return 35 + (seed % 55);
}
function sheetRoleMeta(role) {
  const map = {
    Mother: { icon:'👩', label:'Family' },
    Father: { icon:'👨', label:'Family' },
    Brother: { icon:'🧒', label:'Sibling' },
    Sister: { icon:'🧒', label:'Sibling' },
    Friend: { icon:'✨', label:'Friendship' },
    classmate: { icon:'🏫', label:'School' },
    Teacher: { icon:'📚', label:'Teacher' },
    Pet: { icon:'🐾', label:'Companion' },
    Partner: { icon:'💞', label:'Relationship' },
  };
  return map[role] || { icon:'✨', label:'Connection' };
}
function buildSheetSymbolIcon(type, color = '#8f7362') {
  const common = 'display:block;width:18px;height:18px';
  const icons = {
    job: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="${common}"><path fill="${color}" d="M184 48h144c4.4 0 8 3.6 8 8v40H176V56c0-4.4 3.6-8 8-8m-56 8v40H64c-35.3 0-64 28.7-64 64v96h512v-96c0-35.3-28.7-64-64-64h-64V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56m384 232H320v32c0 17.7-14.3 32-32 32h-64c-17.7 0-32-14.3-32-32v-32H0v128c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64z"/></svg>`,
    age: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="${common}"><path fill="${color}" d="M184 48h144c4.4 0 8 3.6 8 8v40H176V56c0-4.4 3.6-8 8-8m-56 8v40H64c-35.3 0-64 28.7-64 64v96h512v-96c0-35.3-28.7-64-64-64h-64V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56m384 232H320v32c0 17.7-14.3 32-32 32h-64c-17.7 0-32-14.3-32-32v-32H0v128c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64z"/></svg>`,
    divorced: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="${common}"><path fill="${color}" d="M8.106 18.247C5.298 16.083 2 13.542 2 9.137c0-4.6 4.923-7.935 9.264-4.323L9.81 8.204a.75.75 0 0 0 .253.906l2.833 2.024l-2.466 2.878a.75.75 0 0 0 .039 1.018l1.7 1.7l-.91 3.64c-.756-.253-1.516-.843-2.298-1.46q-.417-.326-.856-.663"/><path fill="${color}" d="M12.812 20.345c.732-.265 1.469-.837 2.226-1.434q.417-.328.856-.664C18.702 16.083 22 13.542 22 9.137c0-4.515-4.741-7.81-9.02-4.518l-1.553 3.622l3.009 2.149a.75.75 0 0 1 .133 1.098l-2.548 2.973l1.51 1.509a.75.75 0 0 1 .197.712z"/></svg>`,
    married: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="${common}"><g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><circle cx="25" cy="29" r="15"/><path fill="${color}" d="m18 8l3-4h8.054L32 8l-7 6z"/></g></svg>`,
    single: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="${common}"><path fill="${color}" d="M12 8s0 0 .76-1c.88-1.16 2.18-2 3.74-2c2.49 0 4.5 2.01 4.5 4.5c0 .93-.28 1.79-.76 2.5c-.81 1.21-8.24 9-8.24 9s-7.43-7.79-8.24-9c-.48-.71-.76-1.57-.76-2.5C3 7.01 5.01 5 7.5 5c1.56 0 2.87.84 3.74 2c.76 1 .76 1 .76 1"/></svg>`,
    compatibility: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="${common}"><path fill="${color}" d="M10.92 2.868a1.25 1.25 0 0 1 2.16 0l2.795 4.798l5.428 1.176a1.25 1.25 0 0 1 .667 2.054l-3.7 4.141l.56 5.525a1.25 1.25 0 0 1-1.748 1.27L12 19.592l-5.082 2.24a1.25 1.25 0 0 1-1.748-1.27l.56-5.525l-3.7-4.14a1.25 1.25 0 0 1 .667-2.055l5.428-1.176z"/></svg>`,
    generosity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="${common}"><path fill="${color}" d="M80 416a64 64 0 0 0 64 64h92a4 4 0 0 0 4-4V292a4 4 0 0 0-4-4H88a8 8 0 0 0-8 8Zm160-164V144h32v108a4 4 0 0 0 4 4h140a47.9 47.9 0 0 0 16-2.75A48.09 48.09 0 0 0 464 208v-16a48 48 0 0 0-48-48h-40.54a2 2 0 0 1-1.7-3A72 72 0 0 0 256 58.82A72 72 0 0 0 138.24 141a2 2 0 0 1-1.7 3H96a48 48 0 0 0-48 48v16a48.09 48.09 0 0 0 32 45.25A47.9 47.9 0 0 0 96 256h140a4 4 0 0 0 4-4m32-148a40 40 0 1 1 40 40h-40Zm-74.86-39.9A40 40 0 0 1 240 104v40h-40a40 40 0 0 1-2.86-79.89ZM276 480h92a64 64 0 0 0 64-64V296a8 8 0 0 0-8-8H276a4 4 0 0 0-4 4v184a4 4 0 0 0 4 4"/></svg>`,
    reputation: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="${common}"><path fill="${color}" d="m23.103 20.817l-2.588 5.247a1 1 0 0 1-.753.547l-6.675.97a1 1 0 0 0-.554 1.706l4.83 4.708a1 1 0 0 1 .287.885l-1.14 6.648a1 1 0 0 0 1.452 1.054l5.97-3.138a1 1 0 0 1 .931 0l5.97 3.138a1 1 0 0 0 1.45-1.054l-1.14-6.648a1 1 0 0 1 .288-.885l4.83-4.708a1 1 0 0 0-.554-1.706l-6.675-.97a1 1 0 0 1-.753-.547l-2.985-6.048a1 1 0 0 0-1.794 0M36 4H12v10l12 5l12-5z"/></svg>`,
  };
  return `<span class="person-inline-svg-icon">${icons[type] || ''}</span>`;
}
function buildHomeStatIcon(type) {
  if (type === 'smarts') return '<span class="brain-icon person-home-stat-icon"></span>';
  if (type === 'warmth') return '<span class="sunny-icon person-home-stat-icon"></span>';
  if (type === 'looks') return '<span class="looks-icon person-home-stat-icon"></span>';
  return '';
}
function relationshipBarColor(role) {
  if (role === 'Teacher') return '#ef9f47';
  if (role === 'Friend' || role === 'classmate') return '#ff6f91';
  return '#e85d8f';
}
function reputationTone(value) {
  if (value >= 67) return { tone:'good', color:'#43a85b', soft:'rgba(67,168,91,.18)', label:'Loved by people' };
  if (value >= 34) return { tone:'mixed', color:'#e3a43a', soft:'rgba(227,164,58,.2)', label:'Mixed reputation' };
  return { tone:'bad', color:'#d46152', soft:'rgba(212,97,82,.18)', label:'Needs work' };
}
function reputationValueFor(person, role) {
  if (person.isPet) return { label:'Reputation', value:clamp(person.happiness ?? person._rel ?? 50) };
  if (person.npcStats?.reputation !== undefined) return { label:'Reputation', value:clamp(person.npcStats.reputation) };
  if (role === 'Mother' || role === 'Father')
    return { label:'Reputation', value:clamp(Math.round(((person.npcStats?.warmth ?? 50) + (person.npcStats?.generosity ?? 50)) / 2)) };
  if (role === 'Brother' || role === 'Sister') {
    const warmth = person.npcStats?.warmth ?? 50;
    const trouble = person.npcStats?.trouble ?? 50;
    return { label:'Reputation', value:clamp(Math.round((warmth * 0.62) + ((100 - trouble) * 0.38))) };
  }
  if (role === 'Teacher') {
    const warmth = person.npcStats?.warmth ?? 50;
    const strictness = person.npcStats?.strictness ?? 50;
    return { label:'Reputation', value:clamp(Math.round((warmth * 0.58) + ((100 - strictness) * 0.42))) };
  }
  return { label:'Reputation', value:clamp(person._rel ?? 50) };
}
function openPersonSheet(personId, role) {
  const overlay = document.getElementById('person-overlay');
  if (overlay) overlay.dataset.closing = 'false';
  let person = null;
  if (personId === STATE.family.mum.id)
    person = { ...STATE.family.mum, _role:'Mother', _rel:STATE.family.mum.relationship ?? STATE.relationships.family };
  else if (personId === STATE.family.dad.id)
    person = { ...STATE.family.dad, _role:'Father', _rel:STATE.family.dad.relationship ?? STATE.relationships.family };
  else {
    const sib = STATE.family.siblings.find(s => s.id === personId);
    if (sib) person = { ...sib, _role:role, _rel:sib.relationship||60 };
    const cm  = STATE.school.classmates.find(c => c.id === personId);
    if (cm)  person = { ...cm,  _role:role, _rel:cm.relationship };
    if (!person && role === 'Friend') {
      const savedFriend = getPersistentFriendById(personId);
      if (savedFriend) person = { ...savedFriend, _role:'Friend', _rel:savedFriend.relationship ?? 60 };
    }
    const teacher = STATE.school.teachers.find(t => t.id === personId);
    if (teacher) person = { ...teacher, _role:'Teacher', _rel:teacher.npcStats?.warmth ?? 50 };
    const pet = STATE.family.pets.find(p => p.id === personId);
    if (pet) person = { ...pet, _role:'Pet', _rel:pet.happiness, isPet:true };
  }
  if (!person) return;
  const sheet = document.getElementById('person-sheet');
  const backdrop = document.querySelector('#person-overlay .overlay-backdrop');
  const traitsHTML = buildPersonSheetTraits(person, role);
  const avatarHTML = buildPersonSheetAvatar(person);
  const detailsHTML = buildPersonSheetDetails(person, role);
  const statsHTML = buildPersonSheetStats(person, role);
  const reputationHTML = buildPersonSheetReputation(person, role);
  const relLabel = role === 'Teacher' ? 'Warmth' : 'Relationship';
  const displayName = (role === 'Friend' || role === 'classmate') ? classmateDisplayName(person) : `${person.firstName}${person.surname ? ' '+person.surname : ''}`;
  const relColor = relationshipBarColor(person._role);
  document.getElementById('person-inner').innerHTML = `
    <div class="person-sheet-shell">
      <div class="person-sheet-topbar">
        <div></div>
        <button class="person-sheet-close" type="button" onclick="closePerson()" aria-label="Close profile">✕</button>
      </div>
      <div class="person-sheet-hero">
        <div class="person-profile-emoji person-sheet-avatar">${avatarHTML}</div>
        <div class="person-sheet-hero-copy">
          <div class="person-sheet-name">${displayName}</div>
          <div class="person-sheet-role-inline">${person._role}</div>
          <div class="person-sheet-progress compact">
            <div class="person-sheet-progress-head">
              <span>${relLabel}</span>
              <span>${person._rel}%</span>
            </div>
            <div class="person-sheet-progress-track"><div class="person-sheet-progress-fill" style="width:${person._rel}%;background:${relColor}"></div></div>
          </div>
        </div>
      </div>
      ${detailsHTML}
      <div class="person-sheet-divider"></div>
      ${statsHTML}
      ${traitsHTML ? `<div class="person-sheet-divider"></div><div class="sheet-section flat"><div class="sheet-section-title">Traits</div><div class="trait-pills person-sheet-traits">${traitsHTML}</div></div>` : ''}
      <div class="person-sheet-divider"></div>
      ${reputationHTML}
    </div>`;
  if (sheet) {
    sheet.style.transform = '';
    sheet.style.transition = '';
  }
  if (backdrop) backdrop.style.opacity = '';
  document.getElementById('person-overlay').classList.add('open');
  initPersonSheetDrag();
}

function buildPersonSheetAvatar(person) {
  return person.appearance
    ? getCharacterHTML(person.appearance, person.age || STATE.age, 70, { showBg: false })
    : `<span style="font-size:44px">${person.emoji || '👤'}</span>`;
}

function buildPersonSheetTraits(person, role) {
  return (person.traits || []).map(tid => {
    const pool = person.isPet ? []
      : role === 'Mother' || role === 'Father' ? PARENT_TRAITS_POOL : CLASSMATE_TRAITS_POOL;
    const t = pool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.emoji || ''} ${t.label}</span>`;
  }).join('');
}

function npcStatConfigFor(role, person) {
  if (role === 'Mother' || role === 'Father') {
    return [
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Warmth', 'warmth', person.npcStats?.warmth, '#ffd52a'],
      ['Generosity', 'generosity', person.npcStats?.generosity, '#4ecb71'],
    ];
  }
  if (role === 'Brother' || role === 'Sister') {
    return [
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Warmth', 'warmth', person.npcStats?.warmth, '#ffd52a'],
      ['Trouble', 'generosity', person.npcStats?.trouble, '#ef6b63'],
    ];
  }
  if (role === 'Friend' || role === 'classmate') {
    return [
      ['Popularity', 'warmth', person.npcStats?.popularity, '#9d87ff'],
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Reputation', 'reputation', person.npcStats?.reputation, '#4ecb71'],
    ];
  }
  if (role === 'Teacher') {
    return [
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Warmth', 'warmth', person.npcStats?.warmth, '#ffd52a'],
      ['Strictness', 'generosity', person.npcStats?.strictness, '#ef6b63'],
    ];
  }
  return [];
}

function buildPersonSheetStats(person, role) {
  const stats = npcStatConfigFor(role, person).filter(([, , value]) => value !== undefined);
  if (!stats.length) return '';
  return `
    <div class="sheet-section flat">
      <div class="sheet-section-title">Stats</div>
      <div class="person-stat-list">
      ${stats.map(([label, icon, value, color]) => `
        <div class="person-stat-row">
          <div class="person-stat-label-wrap">
            ${icon === 'generosity' ? buildSheetSymbolIcon('generosity', color) : icon === 'reputation' ? buildSheetSymbolIcon('reputation', color) : buildHomeStatIcon(icon)}
            <span class="detail-label">${label}</span>
          </div>
          <div class="person-stat-track">
            <div class="person-stat-fill" style="width:${value}%;background:${color}"></div>
          </div>
          <span class="person-stat-value">${value}%</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function buildPersonSheetDetails(person, role) {
  const rows = [];
  if (person.age !== undefined) rows.push(['Age', buildSheetSymbolIcon('age', '#f2b48c'), `${person.age}`]);
  if (role === 'Mother' || role === 'Father') {
    rows.push(['Job', buildSheetSymbolIcon('job', '#bc8f68'), person.job || 'None']);
    const maritalStatus = STATE.family.maritalStatus || maritalStatusForSituation(STATE.family.situation);
    const maritalIcon = /divorc/i.test(maritalStatus) ? buildSheetSymbolIcon('divorced', '#ef7f88')
      : /married/i.test(maritalStatus) ? buildSheetSymbolIcon('married', '#d16a90')
      : buildSheetSymbolIcon('single', '#ef98a5');
    rows.push(['Marital Status', maritalIcon, maritalStatus]);
  }
  if (role === 'Brother' || role === 'Sister') {
    rows.push(['Education', buildSheetSymbolIcon('job', '#bc8f68'), educationLevelForAge(person.age)]);
    rows.push(['Sibling Type', buildSheetSymbolIcon('single', '#ef98a5'), person.siblingType === 'half' ? 'Half sibling' : 'Full sibling']);
    if (person.familyStatus) rows.push(['Family Status', buildSheetSymbolIcon('single', '#ef98a5'), person.familyStatus]);
  }
  if (role === 'Teacher') {
    rows.push(['Subject', buildSheetSymbolIcon('job', '#bc8f68'), person.subject || 'Unknown']);
    rows.push(['Title', buildSheetSymbolIcon('job', '#bc8f68'), person.title || 'Teacher']);
  }
  if (!person.isPet && role !== 'Teacher') rows.push(['Compatible', buildSheetSymbolIcon('compatibility', '#f0b14f'), `${compatibilityFor(person)}%`]);
  const compactRows = rows.slice(0, 4);
  while (compactRows.length < 4) compactRows.push(['', '', '']);
  if (!rows.length) return '';
  return `
    <div class="person-sheet-metric-grid">
      ${compactRows.map(([label, icon, value]) => `
        <div class="person-sheet-metric">
          <div class="person-sheet-metric-icon">${icon}</div>
          <div class="person-sheet-metric-value">${value}</div>
          <div class="person-sheet-metric-label">${label}</div>
        </div>`).join('')}
    </div>`;
}
function buildPersonSheetReputation(person, role) {
  const rep = reputationValueFor(person, role);
  const tone = reputationTone(rep.value);
  return `
    <div class="sheet-section flat">
      <div class="sheet-section-title">Reputation</div>
      <div class="person-reputation-inline">
        ${buildSheetSymbolIcon('reputation', tone.color)}
        <span class="person-reputation-label">${rep.label}</span>
        <div class="person-reputation-track">
          <div class="person-reputation-fill" style="width:${rep.value}%;background:${tone.color};box-shadow:0 8px 18px ${tone.soft}"></div>
        </div>
        <div class="person-reputation-score" style="color:${tone.color}">${rep.value} / 100</div>
      </div>
    </div>`;
}

function closePerson() {
  const overlay = document.getElementById('person-overlay');
  if (!overlay || overlay.dataset.closing === 'true' || !overlay.classList.contains('open')) return;
  overlay.dataset.closing = 'true';
  const sheet = document.getElementById('person-sheet');
  const backdrop = overlay.querySelector('.overlay-backdrop');
  if (sheet) {
    sheet.style.transition = 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
    sheet.style.transform = 'translateY(110%)';
  }
  if (backdrop) backdrop.style.opacity = '0';
  setTimeout(() => {
    overlay.classList.remove('open');
    overlay.dataset.closing = 'false';
  }, 220);
}

function initPersonSheetDrag() {
  const handle = document.getElementById('person-sheet-handle');
  if (handle) handle.onpointerdown = null;
}

let _pendingMoneyRequest = null;

function openMoneyRequestOverlay(personId, role) {
  const person = personId === STATE.family.mum.id ? STATE.family.mum
    : personId === STATE.family.dad.id ? STATE.family.dad
    : null;
  if (!person) return;
  _pendingMoneyRequest = { personId, role };
  document.getElementById('money-request-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;flex-direction:column;gap:6px;text-align:center">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint)">Ask For Money</div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">How much do you want from ${person.firstName}?</div>
      </div>
      <div class="detail-card" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="detail-label">Amount</span>
          <span id="money-request-amount" style="font-size:22px;font-weight:800">${fmtMoney(100)}</span>
        </div>
        <input id="money-request-slider" type="range" min="0" max="10000" step="50" value="100" oninput="updateMoneyRequestValue(this.value)" />
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-faint)">
          <span>£0</span>
          <span>£10,000</span>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="closeMoneyRequestOverlay()" style="flex:1;padding:13px 16px;border:1px solid var(--border);border-radius:13px;background:var(--surface);font-size:13px;font-weight:700;color:var(--text)">Cancel</button>
        <button onclick="submitMoneyRequest()" style="flex:1;padding:13px 16px;border:1px solid var(--text);border-radius:13px;background:var(--text);font-size:13px;font-weight:700;color:#fff">Ask</button>
      </div>
    </div>`;
  document.getElementById('money-request-overlay').classList.add('open');
}

function updateMoneyRequestValue(value) {
  document.getElementById('money-request-amount').textContent = fmtMoney(Number(value) || 0);
}

function closeMoneyRequestOverlay() {
  document.getElementById('money-request-overlay').classList.remove('open');
  _pendingMoneyRequest = null;
}

function submitMoneyRequest() {
  if (!_pendingMoneyRequest) return;
  const amount = Number(document.getElementById('money-request-slider').value || 0);
  const { personId, role } = _pendingMoneyRequest;
  const result = requestMoneyFromParent(personId, role, amount);
  closeMoneyRequestOverlay();
  updateAllUI();
  renderFamilyTab();
  openPersonSheet(personId, role);
  if (result?.message) showToast(result.message);
}

function interactClassmate(cmId, action) {
  const cm = STATE.school.classmates.find(c => c.id === cmId);
  if (!cm) return;
  if (action === 'chat') {
    cm.relationship = clamp(cm.relationship + Math.floor(Math.random()*8) + 3);
    logActivity(`Chatted with ${cm.firstName}`, 5);
    showToast(`Chatted with ${cm.firstName} ✓`);
    updateAllUI();
    renderFamilyTab();
    openPersonSheet(cmId, 'Friend');
  } else if (action === 'friend') {
    closePerson();
    const result = tryMakeFriend(cm);
    setTimeout(() => {
      showToast(result.success ? `${cm.firstName} is now your friend! 🎉` : result.reason);
      updateAllUI();
      renderFamilyTab();
    }, 300);
  }
}

// ── LEARN TAB BUILDERS ────────────────────────────────────

let _learnClassmateId = null;
let _uniApplyDraft = null;
const UNI_PREVIEW_IMAGE = 'data/uni_preview.png';

const UNI_COURSES = [
  { id:'Law', icon:'mdi:scale-balance', blurb:'Become a laywer.', perks:[['High salary potential', '#53a35d'], ['High stress', '#d45b55']] },
  { id:'Medicine', icon:'mdi:stethoscope', blurb:'Become a doctor.', perks:[['Very high job security', '#53a35d'], ['Very high stress', '#d45b55']] },
  { id:'Business', icon:'mdi:briefcase', blurb:'Build an empire.', perks:[['High income potential', '#53a35d'], ['Medium stress', '#d39b36']] },
  { id:'Computer Science', icon:'mdi:laptop', blurb:'Build systems.', perks:[['Strong career outlook', '#53a35d'], ['Medium stress', '#d39b36']] },
  { id:'Art', icon:'mdi:palette', blurb:'Express yourself.', perks:[['Creative freedom', '#53a35d'], ['Unclear path', '#d39b36']] },
  { id:'Education', icon:'mdi:brain', blurb:'Become a teacher.', perks:[['People-focused career', '#53a35d'], ['Long training path', '#d39b36']] },
  { id:'Engineering', icon:'mdi:cog', blurb:'Build the future.', perks:[['High demand', '#53a35d'], ['Medium stress', '#d39b36']] },
  { id:'History', icon:'mdi:castle', blurb:'Study the past.', perks:[['Strong writing skills', '#53a35d'], ['Niche career paths', '#d39b36']] },
  { id:'Music', icon:'mdi:music', blurb:'Create and perform.', perks:[['Creative network', '#53a35d'], ['Harder path', '#d45b55']] },
];
const UNI_TYPES = [
  { id:'Elite Universities', icon:'mdi:crown', tag:'Very Competitive', tagBg:'#f8e8bd', tagColor:'#3a2a1a', bullets:['Highest reputation', 'Best career outcomes', 'Hardest to get into'], stress:4, cardBg:'#16233a', cardText:'#fffaf2', accent:'#f0b43f' },
  { id:'Top Universities', icon:'mdi:shield-academic', tag:'Strong Outcomes', tagBg:'#eef2ff', tagColor:'#314784', bullets:['Strong reputation', 'High graduate employability', 'Moderate competition'], stress:3, cardBg:'#9f8a8aff', cardText:'#1a1814', accent:'#355f9c' },
  { id:'Standard Universities', icon:'mdi:bank', tag:'Accessible', tagBg:'#eef7e8', tagColor:'#426d3d', bullets:['Lower entry requirements', 'Good graduate employability', 'Decent competition'], stress:2, cardBg:'#ffffff', cardText:'#1a1814', accent:'#5b9156' },
  { id:'Local Universities', icon:'mdi:home-city', tag:'Close to Home', tagBg:'#fff1e3', tagColor:'#9a5f2c', bullets:['Lowest living costs', 'Less pressure', 'Low competition'], stress:1, cardBg:'#ffffff', cardText:'#1a1814', accent:'#c07b2d' },
];
const UNI_FUNDING = [
  { id:'Student loan', icon:'mdi:bank-outline', blurb:'Take out a loan and repay after graduation.', tag:'Most Common', tagBg:'#eee7ff', tagColor:'#6753b3', accent:'#7d67d9' },
  { id:'Ask parents', icon:'mdi:account-group', blurb:'They might help, or expect something in return.', tag:'If you\'re lucky', tagBg:'#ffe9e9', tagColor:'#ca5f5d', accent:'#ef7b78' },
  { id:'Self fund', icon:'mdi:briefcase', blurb:'Work hard, study hard. No debt, but little rest.', tag:'Harder Path', tagBg:'#e8f5e7', tagColor:'#4f8850', accent:'#5ca55f' },
];

const UNI_TYPE_PREVIEW = {
  'Elite Universities': { fee:'£9,250 / year', studentLife:[['Debt', 'High', '#d48b2b', 82], ['Stress', 'High', '#d45b55', 85], ['Social Life', 'Medium', '#e08e2d', 56], ['Career Prospects', 'Very High', '#4f9a57', 92]], blurb:'Elite universities open the strongest doors, but they ask the most from you.' },
  'Top Universities': { fee:'£9,250 / year', studentLife:[['Debt', 'Medium', '#d48b2b', 64], ['Stress', 'High', '#d45b55', 76], ['Social Life', 'Medium', '#e08e2d', 58], ['Career Prospects', 'High', '#4f9a57', 81]], blurb:'Top universities balance strong outcomes with a slightly more reachable path.' },
  'Standard Universities': { fee:'£9,250 / year', studentLife:[['Debt', 'Medium', '#d48b2b', 58], ['Stress', 'Medium', '#e08e2d', 52], ['Social Life', 'Good', '#e08e2d', 64], ['Career Prospects', 'Solid', '#4f9a57', 67]], blurb:'A practical route with good campus life and a less punishing admissions path.' },
  'Local Universities': { fee:'£9,250 / year', studentLife:[['Debt', 'Low', '#d48b2b', 36], ['Stress', 'Low', '#e08e2d', 38], ['Social Life', 'Steady', '#e08e2d', 47], ['Career Prospects', 'Fair', '#4f9a57', 55]], blurb:'Staying local keeps costs lower and family closer while you find your footing.' },
};

function ensurePostSchoolState() {
  if (!STATE.school.postSchool) STATE.school.postSchool = { schoolFinishedShown:false, uniApplication:null };
  if (!STATE.school.postSchool.furtherEducation) {
    STATE.school.postSchool.furtherEducation = { current:null, completed:[], applications:[] };
  }
  return STATE.school.postSchool;
}

function ensureFurtherEducationState() {
  return ensurePostSchoolState().furtherEducation;
}

function ensureLegalCareerState() {
  if (!STATE.career) STATE.career = { job:'None', salary:0, level:0 };
  if (!STATE.career.legal) {
    STATE.career.legal = {
      qualifications: { solicitor:false, barrister:false },
      supportYears: 0,
      pathwaysTried: [],
      achievementsShown: { solicitor:false, barrister:false },
    };
  }
  return STATE.career.legal;
}

function hasFurtherEducation(qualificationId) {
  return ensureFurtherEducationState().completed.includes(qualificationId);
}

function isLawGraduate() {
  return getDegreeCourse() === 'Law';
}

function hasQualifiedSolicitor() {
  return !!ensureLegalCareerState().qualifications.solicitor;
}

function hasQualifiedBarrister() {
  return !!ensureLegalCareerState().qualifications.barrister;
}

function isLegalSupportRole(jobTitle) {
  return !!LEGAL_SUPPORT_ROLE_CONFIG[jobTitle];
}

function isQualifiedLegalRole(jobTitle) {
  return !!LEGAL_QUALIFIED_ROLE_CONFIG[jobTitle];
}

function isAnyLegalRole(jobTitle) {
  return isLegalSupportRole(jobTitle) || isQualifiedLegalRole(jobTitle);
}

function getCurrentJobYears() {
  if (!STATE.career?.job || STATE.career.job === 'None') return 0;
  return Math.max(0, STATE.age - (STATE.career.startedAge ?? STATE.age));
}

function getGeneratedSalaryForRange(min, max, skew = 0.5) {
  const clampedSkew = Math.max(0, Math.min(1, skew));
  return Math.round(min + (max - min) * clampedSkew);
}

function formatSalaryRange(min, max) {
  return max >= 1000000
    ? `${fmtMoney(min)}–${fmtMoney(max)}+ / year`
    : `${fmtMoney(min)}–${fmtMoney(max)} / year`;
}

function getLegalRoleProfile(jobTitle) {
  return LEGAL_SUPPORT_ROLE_CONFIG[jobTitle] || LEGAL_QUALIFIED_ROLE_CONFIG[jobTitle] || null;
}

function getLegalPathForJob(jobTitle) {
  const profile = getLegalRoleProfile(jobTitle);
  if (profile?.path) return profile.path;
  if (profile?.pathway === 'solicitor') return ['Year 1 Trainee Solicitor', 'Year 2 Trainee Solicitor', 'Junior Associate', 'Associate', 'Senior Associate', 'Partner'];
  if (profile?.pathway === 'barrister' || profile?.pathway === 'judge') return ['Pupil Barrister', 'Junior Barrister', 'Barrister', 'KC / Senior Barrister', 'Judge'];
  return null;
}

function getLegalQualificationStatus() {
  if (hasQualifiedSolicitor()) return 'Qualified Solicitor';
  if (hasQualifiedBarrister()) return 'Qualified Barrister';
  if (hasFurtherEducation('Law Masters')) return 'Law Masters Completed';
  if (isLawGraduate()) return 'Law Graduate';
  return 'Not Qualified';
}

function getLegalJobRequirements(job) {
  const reasons = [];
  const title = job.title;
  const currentYears = getCurrentJobYears();
  const publicRep = STATE.stats.rep || 0;

  if (title.startsWith('Year 1 Trainee Solicitor')) {
    if (!isLawGraduate()) reasons.push('Requires Law degree');
    if (!hasFurtherEducation('Law Masters')) reasons.push('Requires Law Masters');
  } else if (title === 'Pupil Barrister') {
    if (!isLawGraduate()) reasons.push('Requires Law degree');
    if (!hasFurtherEducation('Law Masters')) reasons.push('Requires Law Masters');
  } else if (title === 'Junior Associate') {
    if (!hasQualifiedSolicitor()) reasons.push('Requires Qualification');
  } else if (title === 'Associate') {
    if (!hasQualifiedSolicitor()) reasons.push('Requires Qualification');
    if (STATE.career.job !== 'Junior Associate' || currentYears < 3) reasons.push('Requires 3 Years Experience');
  } else if (title === 'Senior Associate') {
    if (STATE.career.job !== 'Associate' || currentYears < 4) reasons.push('Requires 4 Years Experience');
  } else if (title === 'Partner') {
    if (STATE.career.job !== 'Senior Associate' || currentYears < 3) reasons.push('Requires 3 Years Experience');
    if (publicRep < 45) reasons.push('Requires Strong Reputation');
  } else if (title === 'Junior Barrister') {
    if (!hasQualifiedBarrister()) reasons.push('Requires Qualification');
  } else if (title === 'Barrister') {
    if (STATE.career.job !== 'Junior Barrister' || currentYears < 5) reasons.push('Requires 5 Years Experience');
  } else if (title === 'KC / Senior Barrister') {
    if (STATE.career.job !== 'Barrister' || currentYears < 5) reasons.push('Requires 5 Years Experience');
    if (publicRep < 55) reasons.push('Requires Elite Reputation');
  } else if (title === 'Judge') {
    if (!hasQualifiedBarrister()) reasons.push('Requires Barrister Qualification');
    if (STATE.career.job !== 'KC / Senior Barrister' || currentYears < 6) reasons.push('Requires 6 Years Experience');
    if (publicRep < 70) reasons.push('Requires Exceptional Reputation');
  }

  return reasons;
}

function openUniApplication() {
  _learnScreen = 'uniApplyBasics';
  const postSchool = ensurePostSchoolState();
  _uniApplyDraft = postSchool.uniApplication?.status === 'draft'
    ? { ...postSchool.uniApplication }
    : { course:null, uniType:null, funding:null, status:'draft' };
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeUniApplication() {
  _learnScreen = 'main';
  _uniApplyDraft = null;
  renderLearnTab();
}

function canAccessFurtherEducation() {
  return isGraduate();
}

function openFurtherEducation() {
  if (!canAccessFurtherEducation()) return;
  _learnScreen = 'furtherEducation';
  const furtherEducation = ensureFurtherEducationState();
  _uniApplyDraft = {
    course: 'Law Masters',
    funding: furtherEducation.current?.funding || 'Student loan',
  };
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeFurtherEducation() {
  _learnScreen = 'main';
  _uniApplyDraft = null;
  renderLearnTab();
}

function startFurtherEducationCourse(courseId) {
  const furtherEducation = ensureFurtherEducationState();
  if (!_uniApplyDraft?.funding) {
    showToast('Choose funding first.');
    return;
  }
  furtherEducation.current = {
    id: courseId,
    funding: _uniApplyDraft.funding,
    startedAge: STATE.age,
    durationYears: 1,
    status: 'studying',
  };
  furtherEducation.applications.push({
    id: courseId,
    funding: _uniApplyDraft.funding,
    age: STATE.age,
  });
  logActivity(`Started ${courseId}.`, null);
  saveGame();
  closeFurtherEducation();
  showToast(`${courseId} started.`);
}

function buildFurtherEducationScreen() {
  const furtherEducation = ensureFurtherEducationState();
  const current = furtherEducation.current;
  const completed = hasFurtherEducation('Law Masters');
  const funding = getUniFundingConfig(_uniApplyDraft?.funding || 'Student loan');
  const canStart = !completed && !current;
  return `
    <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Further Education', 'Professional legal routes open after postgraduate study.')}
      <div style="padding:18px;border-radius:24px;border:1px solid #e8ded4;background:linear-gradient(180deg, #fffdfb, #f8f2ec)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div>
            <div style="display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#efe9ff;color:#5f48bc;font-size:11px;font-weight:800">Further Education</div>
            <div style="font-size:25px;font-weight:800;color:#171510;margin-top:10px">Law Masters</div>
            <div style="font-size:13px;line-height:1.5;color:#675d54;margin-top:8px">Required before solicitor or barrister training. One year. Competitive careers unlock after completion.</div>
          </div>
          <div style="width:54px;height:54px;border-radius:18px;background:#f3edff;color:#6b57c6;display:flex;align-items:center;justify-content:center;font-size:28px">
            <iconify-icon icon="mdi:school-outline"></iconify-icon>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px;margin-top:14px">
          <div style="padding:12px;border-radius:16px;background:#fff;border:1px solid #ece3d8"><div style="font-size:10px;font-weight:800;color:#8a7f73;text-transform:uppercase">Duration</div><div style="font-size:14px;font-weight:800;color:#1a1814;margin-top:6px">1 Year</div></div>
          <div style="padding:12px;border-radius:16px;background:#fff;border:1px solid #ece3d8"><div style="font-size:10px;font-weight:800;color:#8a7f73;text-transform:uppercase">Status</div><div style="font-size:14px;font-weight:800;color:#1a1814;margin-top:6px">${completed ? 'Completed' : current ? 'In Progress' : 'Available'}</div></div>
          <div style="padding:12px;border-radius:16px;background:#fff;border:1px solid #ece3d8"><div style="font-size:10px;font-weight:800;color:#8a7f73;text-transform:uppercase">Career Gate</div><div style="font-size:14px;font-weight:800;color:#1a1814;margin-top:6px">Legal Qualification</div></div>
        </div>
      </div>
      ${current ? `
        <div style="padding:14px 16px;border-radius:18px;background:#eef6ff;border:1px solid #d5e4f3;color:#355777;font-size:13px;font-weight:700">
          You are studying ${current.id}. It completes when you age up.
        </div>` : ''}
      ${completed ? `
        <div style="padding:14px 16px;border-radius:18px;background:#edf7ee;border:1px solid #d5e8d7;color:#4d7e52;font-size:13px;font-weight:700">
          Law Masters completed. Solicitor and barrister pathways are now open.
        </div>` : `
        <div>
          ${buildUniSectionTitle('£', 'Confirm Funding')}
          ${buildUniFundingCards()}
        </div>`}
      <button onclick="${canStart ? `startFurtherEducationCourse('Law Masters')` : 'closeFurtherEducation()'}"
        style="width:100%;padding:18px;border-radius:24px;border:1px solid ${canStart ? '#6d56c9' : '#d9d0c5'};background:${canStart ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${canStart ? '#fff' : '#7e7469'};font-size:15px;font-weight:800">
        ${completed ? 'Back' : current ? 'Studying' : `Start with ${funding.id}`}
      </button>
    </div>`;
}

function openJobBoard(category = 'full-time') {
  _jobBoardCategory = category;
  _learnScreen = 'jobsBoard';
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeJobBoard() {
  _learnScreen = 'main';
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function sampleUniqueJobs(pool, count, usedTitles = new Set()) {
  const available = pool.filter(job => !usedTitles.has(getJobKey(job)));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);
  picked.forEach(job => usedTitles.add(getJobKey(job)));
  return picked;
}

function getJobKey(job) {
  return [job.title, job.companyName || job.company, job.salary || job.rate || '', job.type || ''].join('|');
}

function inferJobCategory(job, type = 'full-time') {
  const text = `${job.title} ${job.companyName || job.company}`.toLowerCase();
  if (/police|firefighter|doctor/.test(text)) return 'emergency';
  if (/sales|estate agent|recruitment/.test(text)) return 'sales';
  if (/designer|illustrator|creator|actor|musician|gallery/.test(text)) return 'creative';
  if (/solicitor|paralegal|barrister|judge|compliance|finance|operations analyst|civil service|project coordinator|pilot trainee/.test(text)) return 'corporate';
  if (/assistant|receptionist|admin|customer service|clerk|claims|lab/.test(text)) return 'office';
  if (/cafe|retail|cashier|warehouse|fast food|delivery|supermarket|care assistant|trainer|apprentice/.test(text)) return type === 'part-time' ? 'retail' : 'office';
  return type === 'part-time' ? 'retail' : 'office';
}

function buildJobDescription(job, type, category) {
  const companyName = job.companyName || job.company;
  const lines = {
    retail: `A fast-moving role at ${companyName} where being calm, helpful, and reliable matters.`,
    office: `A steady role at ${companyName} with everyday tasks, routine pressure, and room to prove yourself.`,
    creative: `A creative opening at ${companyName} where ideas, feedback, and consistency all matter.`,
    emergency: `A pressure-heavy role at ${companyName} where judgement and teamwork matter more than talk.`,
    sales: `A target-driven role at ${companyName} where confidence, resilience, and people skills can pay off.`,
    corporate: `A competitive opening at ${companyName} with stronger long-term upside if you can break in.`,
  };
  return job.description || lines[category] || `A role at ${companyName}.`;
}

function normalizeJob(job, type = 'full-time') {
  const companyName = job.companyName || job.company;
  const category = inferJobCategory(job, type);
  const legalProfile = getLegalRoleProfile(job.title);
  const legalRequirements = type === 'full-time' && legalProfile ? getLegalJobRequirements(job) : [];
  const locked = legalRequirements.length > 0;
  const payLabel = type === 'full-time'
    ? (legalProfile ? formatSalaryRange(legalProfile.salaryMin, legalProfile.salaryMax) : job.salary)
    : `£${job.rate} / hr`;
  const difficultyBase = type === 'full-time' ? 44 + Math.max(0, parseSalaryValue(job.salary) - 20000) / 1200 : 22 + Math.max(0, (job.rate || 10) - 10) * 3.5;
  const categoryDifficulty = { retail:0, office:6, creative:8, emergency:14, sales:9, corporate:18 }[category] || 0;
  const difficulty = Math.round(difficultyBase + categoryDifficulty + (legalProfile?.pathway === 'barrister' ? 8 : 0));
  const immediateHire = type === 'part-time' || (/warehouse|fast food|retail assistant|delivery|cashier|cafe/i.test(job.title) && difficulty < 38);
  return {
    ...job,
    id: getJobKey({ ...job, companyName, type }),
    companyName,
    payLabel,
    type: type === 'full-time' ? 'Full-Time' : 'Part-Time',
    jobCategory: category,
    description: buildJobDescription({ ...job, companyName }, type, category),
    requiresInterview: locked ? false : (immediateHire ? false : (job.requiresInterview ?? difficulty >= 34)),
    applicationDifficulty: difficulty,
    hiringChance: Math.round(66 - difficulty * 0.45 + (type === 'part-time' ? 10 : 0)),
    interviewQuestionPool: JOB_INTERVIEW_QUESTION_POOLS[category] || JOB_INTERVIEW_QUESTION_POOLS.office,
    legalProfile,
    locked,
    lockReasons: legalRequirements,
  };
}

function getPartTimeJobs() {
  return PART_TIME_JOB_LIST.map(job => normalizeJob(job, 'part-time'));
}

function parseSalaryValue(salary) {
  return Number(String(salary || '').replace(/[^\d]/g, '')) || 0;
}

function getUniversityStanding() {
  const acceptedType = STATE.school.postSchool?.uniApplication?.acceptedType;
  const scoreMap = {
    'Elite Universities': 1,
    'Top Universities': 0.8,
    'Standard Universities': 0.45,
    'Local Universities': 0.25,
  };
  return scoreMap[acceptedType] || 0;
}

function getYearsSinceGraduation() {
  const graduatedAge = STATE.school.postSchool?.uniApplication?.graduatedAge;
  if (!graduatedAge) return 0;
  return Math.max(0, STATE.age - graduatedAge);
}

function getJobPoolType(job) {
  if (FULL_TIME_GENERAL_JOBS.includes(job)) return 'general';
  if (FULL_TIME_ANY_DEGREE_JOBS.includes(job)) return 'any-degree';
  if (FULL_TIME_NO_DEGREE_GROWTH_JOBS.includes(job)) return 'no-degree-growth';
  return 'degree-linked';
}

function scoreFullTimeJob(job, degree) {
  const salary = parseSalaryValue(job.salary);
  const poolType = getJobPoolType(job);
  const standing = getUniversityStanding();
  const experienceYears = getYearsSinceGraduation();
  let score = 1 + Math.max(0, salary - 18000) / 2500;

  if (degree && (FULL_TIME_DEGREE_JOB_POOLS[degree] || []).includes(job)) score += 3.2;
  if (poolType === 'any-degree') score += degree ? 1.1 : 0.2;
  if (poolType === 'general') score += 0.8;
  if (poolType === 'no-degree-growth') score += degree ? 0.9 : 1.8;

  if (degree) {
    score += standing * Math.max(0, salary - 24000) / 3500;
    score += Math.min(experienceYears, 8) * Math.max(0, salary - 26000) / 12000;
    if (standing < 0.5) score -= Math.max(0, salary - 30000) / 7000;
  }

  return Math.max(0.2, score);
}

function weightedUniqueSample(pool, count, usedTitles, degree) {
  const picked = [];
  while (picked.length < count) {
    const available = pool.filter(job => !usedTitles.has(getJobKey(job)) && !picked.some(p => getJobKey(p) === getJobKey(job)));
    if (!available.length) break;
    const weighted = available.map(job => ({ job, weight: scoreFullTimeJob(job, degree) }));
    const choice = weightedRandom(weighted.map(item => ({ ...item.job, weight:item.weight })));
    picked.push(choice);
    usedTitles.add(getJobKey(choice));
  }
  return picked;
}

function buildFullTimeSignature() {
  return JSON.stringify({
    age: STATE.age,
    level: STATE.school.level,
    degree: getDegreeCourse(),
    standing: getUniversityStanding(),
    gradYears: getYearsSinceGraduation(),
    lawMasters: hasFurtherEducation('Law Masters'),
    solicitor: hasQualifiedSolicitor(),
    barrister: hasQualifiedBarrister(),
    legalJob: STATE.career?.job || 'None',
    legalYears: getCurrentJobYears(),
    rep: STATE.stats.rep || 0,
  });
}

function generateFullTimeJobs() {
  const usedTitles = new Set();
  const degree = getDegreeCourse();
  const degreePool = FULL_TIME_DEGREE_JOB_POOLS[degree] || [];
  const jobs = [];

  if (degreePool.length) {
    jobs.push(...weightedUniqueSample(degreePool, 6, usedTitles, degree));
    jobs.push(...weightedUniqueSample(FULL_TIME_ANY_DEGREE_JOBS, 3, usedTitles, degree));
    jobs.push(...weightedUniqueSample(FULL_TIME_NO_DEGREE_GROWTH_JOBS, 4, usedTitles, degree));
    jobs.push(...weightedUniqueSample(FULL_TIME_GENERAL_JOBS, 3, usedTitles, degree));
  } else {
    jobs.push(...weightedUniqueSample(FULL_TIME_NO_DEGREE_GROWTH_JOBS, 7, usedTitles, degree));
    jobs.push(...weightedUniqueSample(FULL_TIME_GENERAL_JOBS, 5, usedTitles, degree));
    jobs.push(...weightedUniqueSample(FULL_TIME_ANY_DEGREE_JOBS, 4, usedTitles, degree));
  }

  const fallbackPools = [
    ...FULL_TIME_GENERAL_JOBS,
    ...FULL_TIME_NO_DEGREE_GROWTH_JOBS,
    ...FULL_TIME_ANY_DEGREE_JOBS,
    ...degreePool,
  ];
  if (jobs.length < 16) jobs.push(...weightedUniqueSample(fallbackPools, 16 - jobs.length, usedTitles, degree));
  if (degree === 'Law' || isAnyLegalRole(STATE.career?.job || '') || hasFurtherEducation('Law Masters') || hasQualifiedSolicitor() || hasQualifiedBarrister()) {
    const legalListings = LEGAL_JOB_LISTINGS.map(job => {
      const profile = getLegalRoleProfile(job.title);
      return { ...job, salary: `£${profile.salaryMin.toLocaleString()}/year` };
    });
    jobs.push(...weightedUniqueSample(legalListings, 10, usedTitles, degree));
  }
  return jobs
    .sort((a, b) => parseSalaryValue(b.salary) - parseSalaryValue(a.salary))
    .slice(0, 22);
}

function getFullTimeJobs() {
  const signature = buildFullTimeSignature();
  if (_cachedFullTimeSignature !== signature || !_cachedFullTimeJobs.length) {
    _cachedFullTimeSignature = signature;
    _cachedFullTimeJobs = generateFullTimeJobs();
  }
  return _cachedFullTimeJobs.map(job => normalizeJob(job, 'full-time'));
}

function getJobListByCategory(category = 'full-time') {
  return category === 'part-time' ? getPartTimeJobs() : getFullTimeJobs();
}

function getCurrentCareerExperience() {
  const base = STATE.career.experience || 0;
  const currentYears = STATE.career.job && STATE.career.job !== 'None'
    ? Math.max(0, STATE.age - (STATE.career.startedAge ?? STATE.age))
    : 0;
  return base + currentYears;
}

function getPlayerApplicationScore(job) {
  const degree = getDegreeCourse();
  const gradeScore = STATE.school.gradeScore || 50;
  const reputation = clamp(STATE.stats.rep || 0, -100, 100);
  const smarts = clamp(STATE.stats.smarts || 0, 0, 100);
  const experience = getCurrentCareerExperience();
  const work = STATE.career?.work;
  const legalState = ensureLegalCareerState();
  let score = 46;

  if (STATE.school.level === 'graduated') score += 10;
  else if (STATE.school.level === 'finished_school') score += 3;
  score += (smarts - 50) * 0.16;
  score += (gradeScore - 50) * 0.1;
  score += reputation * 0.06;
  score += experience * 3.5;
  score += (STATE.career.level || 0) * 4;
  if (work) {
    score += (work.performance - 50) * 0.14;
    score += (work.reputation - 50) * 0.16;
    score += (work.satisfaction - 50) * 0.05;
    score -= Math.max(0, work.stress - 65) * 0.08;
  }

  if (job.type === 'Full-Time' && degree) score += 6;
  if (job.type === 'Full-Time' && degree && (FULL_TIME_DEGREE_JOB_POOLS[degree] || []).some(item => item.title === job.title)) score += 12;
  if (job.type === 'Full-Time' && job.jobCategory === 'corporate' && !degree) score -= 10;

  if (STATE.traits.includes('hardworking')) score += 8;
  if (STATE.traits.includes('lazy')) score -= 10;
  if (STATE.traits.includes('creative') && job.jobCategory === 'creative') score += 8;
  if (STATE.traits.includes('charismatic') && ['retail','sales'].includes(job.jobCategory)) score += 7;
  if (STATE.traits.includes('empathetic') && ['retail','emergency','office'].includes(job.jobCategory)) score += 6;
  if (STATE.traits.includes('resilient') && ['emergency','sales','corporate'].includes(job.jobCategory)) score += 6;
  if (STATE.traits.includes('cautious') && ['office','corporate','emergency'].includes(job.jobCategory)) score += 4;
  if (STATE.traits.includes('ambitious') && ['sales','corporate'].includes(job.jobCategory)) score += 5;
  if (STATE.traits.includes('intelligent') && ['office','corporate'].includes(job.jobCategory)) score += 5;
  if (STATE.traits.includes('anxious') && ['sales','emergency','corporate'].includes(job.jobCategory)) score -= 5;
  if (STATE.traits.includes('risk_taker')) score += ['creative','sales'].includes(job.jobCategory) ? 4 : -5;

  if (job.legalProfile) {
    score += legalState.supportYears * (job.title === 'Pupil Barrister' ? 4 : 5);
    score += getUniversityStanding() * (job.title === 'Pupil Barrister' ? 24 : 18);
    if (hasFurtherEducation('Law Masters')) score += 14;
    if (job.title === 'Pupil Barrister') {
      score += (STATE.relationships.friends || 0) * 0.08;
      score += reputation * 0.12;
      score += smarts * 0.08;
      score -= 8;
    }
    if (job.title.startsWith('Year 1 Trainee Solicitor')) {
      score += reputation * 0.08;
      score += smarts * 0.06;
      score += (work?.performance || 50) * 0.06;
      score -= 2;
    }
    if (job.title === 'Partner') score -= 18;
    if (job.title === 'Judge') score -= 20;
  }

  score += Math.floor(Math.random() * 19) - 9;
  score -= job.applicationDifficulty * 0.55;
  return Math.round(score);
}

function buildInterviewQuestions(job) {
  const pool = [...(job.interviewQuestionPool || JOB_INTERVIEW_QUESTION_POOLS.office)];
  const count = Math.min(3, job.applicationDifficulty >= 64 || job.jobCategory === 'corporate' ? 3 : (job.applicationDifficulty >= 42 ? 2 : 1));
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

function buildInterviewEvent(job) {
  if (Math.random() > 0.18) return null;
  const category = job.jobCategory;
  const matches = JOB_INTERVIEW_EVENTS.filter(event => event.categories.includes(category));
  if (!matches.length) return null;
  const picked = { ...pickRandom(matches) };
  if (picked.text.includes('recognises your name') && (STATE.stats.rep || 0) < 5) picked.score = 0;
  return picked;
}

function calculateInterviewOutcome(job, applicationScore, metrics, interviewEvent) {
  const metricsScore =
    (metrics.reliability || 0) * 1.2 +
    (metrics.judgement || 0) * 1.15 +
    (metrics.workEthic || 0) +
    (metrics.calmness || 0) * 1.15 +
    (metrics.teamwork || 0) * 0.9 +
    (metrics.creativity || 0) * (job.jobCategory === 'creative' ? 1.4 : 0.5) +
    (metrics.bravery || 0) * (job.jobCategory === 'emergency' ? 1.3 : 0.35);
  const finalScore = applicationScore + metricsScore + (interviewEvent?.score || 0) + (Math.floor(Math.random() * 13) - 6);
  const hireLine = 56 - getUniversityStanding() * 6 - Math.min(getYearsSinceGraduation(), 6) * 1.5;
  const waitlistLine = hireLine - 7;
  if (finalScore >= hireLine) return 'hired';
  if (finalScore >= waitlistLine) return 'waitlisted';
  return 'rejected';
}

function getJobAnnualIncome(job) {
  if (job.type === 'Part-Time') return Math.round((job.rate || 0) * 18 * 52);
  return parseSalaryValue(job.salary);
}

function getCareerLevelForJob(job) {
  const pay = getJobAnnualIncome(job);
  if (pay >= 34000) return 4;
  if (pay >= 28000) return 3;
  if (pay >= 23000) return 2;
  return 1;
}

function buildWorkPerson(role, genderHint) {
  const gender = genderHint || (Math.random() > 0.5 ? 'male' : 'female');
  return {
    id: uid(),
    role,
    firstName: pickRandom(NAMES_UK[gender]),
    surname: pickRandom(NAMES_UK.surnames),
    appearance: generateAppearance(gender),
    relationship: 44 + Math.floor(Math.random() * 28),
  };
}

function getWorkPerson(work, role) {
  return (work.people || []).find(person => person.role === role) || null;
}

function adjustWorkRelationship(work, role, amount) {
  const person = getWorkPerson(work, role);
  if (!person) return;
  person.relationship = clamp((person.relationship || 50) + amount);
}

function maybeTriggerWorkplaceEvent(work, actionId, apply) {
  if (Math.random() > 0.24) return;

  const boss = getWorkPerson(work, 'Boss');
  const coworker = getWorkPerson(work, 'Coworker');
  const mentor = getWorkPerson(work, 'Mentor');
  const rival = getWorkPerson(work, 'Office Rival');
  const eventPools = {
    work_hard: [
      {
        text: `${boss?.firstName || 'Your boss'} noticed how much effort you put in.`,
        toast: 'Your effort got noticed.',
        effects: { performance:+3, reputation:+5, satisfaction:+2, publicRep:+1 },
      },
      {
        text: `${mentor?.firstName || 'Your mentor'} gave you advice that made your work sharper.`,
        toast: 'Your mentor backed you.',
        effects: { performance:+4, stress:-2, satisfaction:+3 },
      },
    ],
    slack_off: [
      {
        text: `${rival?.firstName || 'A coworker'} noticed you coasting and mentioned it to the team.`,
        toast: 'People noticed you checked out.',
        effects: { reputation:-6, satisfaction:-1 },
      },
      {
        text: `${boss?.firstName || 'Your boss'} caught you doing the bare minimum.`,
        toast: 'Your boss is unimpressed.',
        effects: { performance:-4, reputation:-5, stress:+3 },
      },
    ],
    socialise: [
      {
        text: `${coworker?.firstName || 'A coworker'} invited you into the group chat after work.`,
        toast: 'You feel more included at work.',
        effects: { satisfaction:+5, relationships:+6, reputation:+3, happy:+2 },
      },
      {
        text: `${mentor?.firstName || 'Your mentor'} started taking you more seriously.`,
        toast: 'You made a useful connection.',
        effects: { satisfaction:+3, reputation:+4, performance:+1 },
      },
    ],
    ask_raise: [
      {
        text: `${boss?.firstName || 'Your boss'} respected how directly you made your case.`,
        toast: 'You came across confidently.',
        effects: { reputation:+3, satisfaction:+2 },
      },
      {
        text: `${boss?.firstName || 'Your boss'} thought your timing was off.`,
        toast: 'The conversation landed awkwardly.',
        effects: { stress:+4, reputation:-3, satisfaction:-3 },
      },
    ],
    stay_late: [
      {
        text: `${boss?.firstName || 'Your boss'} praised your commitment in front of the team.`,
        toast: 'Staying late paid off.',
        effects: { reputation:+5, performance:+2, satisfaction:+2 },
      },
      {
        text: 'You pushed through, but by the end of the night you were running on fumes.',
        toast: 'You are feeling drained.',
        effects: { health:-2, energy:-6, stress:+4 },
      },
    ],
    call_sick: [
      {
        text: `${coworker?.firstName || 'A coworker'} covered for you and kept things smooth.`,
        toast: 'Someone had your back.',
        effects: { stress:-4, health:+2, satisfaction:+2 },
      },
      {
        text: `${boss?.firstName || 'Your boss'} sounded doubtful when you called in.`,
        toast: 'Your boss seemed suspicious.',
        effects: { reputation:-4, stress:+2 },
      },
    ],
  };

  const pool = eventPools[actionId];
  if (!pool?.length) return;
  const event = pickRandom(pool);
  apply(event.effects || {});
  logActivity(event.text, (event.effects?.reputation || 0) + (event.effects?.satisfaction || 0) > 0 ? 5 : -3);
  if (event.toast) showToast(event.toast);
}

function getCareerPathForJob(jobTitle) {
  const legalPath = getLegalPathForJob(jobTitle);
  if (legalPath) return legalPath;
  const exactPaths = {
    'Junior Doctor': ['Healthcare Assistant', 'Lab Assistant', 'Junior Doctor', 'Senior Doctor'],
    'Finance Assistant': ['Finance Assistant', 'Operations Analyst', 'Management Trainee', 'Finance Manager'],
    'Marketing Assistant': ['Marketing Assistant', 'Project Coordinator', 'Management Trainee', 'Marketing Manager'],
    'Receptionist': ['Receptionist', 'Admin Assistant', 'Office Coordinator', 'Office Manager'],
    'Admin Assistant': ['Admin Assistant', 'Office Coordinator', 'Operations Analyst', 'Office Manager'],
    'Customer Service Advisor': ['Customer Service Advisor', 'Team Lead', 'Office Coordinator', 'Operations Manager'],
    'Sales Executive': ['Sales Executive', 'Senior Sales Executive', 'Sales Manager', 'Regional Manager'],
    'Estate Agent': ['Estate Agent', 'Senior Estate Agent', 'Branch Manager', 'Agency Director'],
    'Recruitment Consultant': ['Recruitment Consultant', 'Senior Consultant', 'Team Lead', 'Branch Manager'],
    'Teacher Trainee': ['Teacher Trainee', 'Classroom Teacher', 'Head of Year', 'Senior Teacher'],
    'Police Officer': ['Police Officer', 'Senior Officer', 'Sergeant', 'Inspector'],
    'Firefighter': ['Firefighter', 'Senior Firefighter', 'Crew Manager', 'Station Manager'],
    'Graphic Designer': ['Graphic Designer', 'Senior Designer', 'Art Lead', 'Creative Director'],
    'Content Creator': ['Content Creator', 'Channel Partner', 'Brand Creator', 'Studio Lead'],
    'Retail Supervisor': ['Retail Supervisor', 'Assistant Manager', 'Store Manager', 'Area Manager'],
    'Warehouse Supervisor': ['Warehouse Supervisor', 'Operations Lead', 'Depot Manager', 'Regional Manager'],
    'Care Assistant': ['Care Assistant', 'Senior Carer', 'Shift Lead', 'Care Manager'],
  };
  if (exactPaths[jobTitle]) return exactPaths[jobTitle];
  if (/doctor/i.test(jobTitle)) return ['Healthcare Assistant', 'Lab Assistant', 'Junior Doctor', 'Senior Doctor'];
  if (/solicitor|legal|paralegal|barrister|judge/i.test(jobTitle)) return ['Legal Assistant', 'Paralegal', 'Senior Paralegal', 'Lead Paralegal'];
  if (/sales|recruitment|estate/i.test(jobTitle)) return ['Sales Executive', 'Senior Sales Executive', 'Sales Manager', 'Regional Manager'];
  if (/office|admin|reception|customer/i.test(jobTitle)) return ['Receptionist', 'Admin Assistant', 'Office Coordinator', 'Office Manager'];
  if (/creator|designer|illustrator|actor|musician/i.test(jobTitle)) return ['Creative Assistant', 'Graphic Designer', 'Senior Designer', 'Creative Director'];
  return ['Entry Role', 'Skilled Role', 'Senior Role', 'Lead Role'];
}

function getCareerPathIndex(path, jobTitle) {
  const exact = path.indexOf(jobTitle);
  if (exact >= 0) return exact;
  return Math.min(path.length - 1, Math.max(0, STATE.career.level - 1));
}

function ensureCareerState(job = null) {
  if (!STATE.career) STATE.career = { job:'None', salary:0, level:0 };
  if (!STATE.career.work) {
    const currentJob = job || { title: STATE.career.job, jobCategory: STATE.career.category || 'office' };
    STATE.career.work = {
      performance: clamp(52 + Math.floor(Math.random() * 18)),
      stress: clamp(28 + Math.floor(Math.random() * 22)),
      reputation: clamp(46 + Math.floor(Math.random() * 18)),
      satisfaction: clamp(48 + Math.floor(Math.random() * 20)),
      energy: clamp(62 + Math.floor(Math.random() * 16)),
      people: [
        buildWorkPerson('Boss', 'female'),
        buildWorkPerson('Coworker'),
        buildWorkPerson('Mentor'),
        buildWorkPerson('Office Rival'),
      ],
      progression: getCareerPathForJob(currentJob.title || STATE.career.job),
      category: currentJob.jobCategory || STATE.career.category || 'office',
      companyName: currentJob.companyName || STATE.career.companyName || 'Company',
      icon: currentJob.icon || 'mdi:briefcase-outline',
    };
  }
  return STATE.career.work;
}

function getCareerStatTone(value, invert = false) {
  const score = invert ? 100 - value : value;
  if (score >= 70) return { fill:'#56a56f', track:'#e4f1e7' };
  if (score >= 45) return { fill:'#d49a44', track:'#f5ead7' };
  return { fill:'#d46d5c', track:'#f3dfdb' };
}

function buildCareerStatCard(label, value, opts = {}) {
  const tone = getCareerStatTone(value, opts.invert);
  return `
    <div class="career-stat-card">
      <div class="career-stat-top">
        <div class="career-stat-label">${label}</div>
        <div class="career-stat-value">${value}</div>
      </div>
      <div class="career-stat-bar">
        <div class="career-stat-fill" style="width:${clamp(value)}%;background:${tone.fill}"></div>
      </div>
    </div>`;
}

function buildCareerPeopleSection(work) {
  return `
    <div class="career-people-grid">
      ${work.people.map(person => `
        <div class="career-person-card">
          <div class="career-person-avatar">${getCharacterHTML(person.appearance, 33, 42, { showBg:false })}</div>
          <div class="career-person-copy">
            <div class="career-person-role">${person.role}</div>
            <div class="career-person-name">${person.firstName} ${person.surname}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function buildCareerActionsSection() {
  const actions = [
    ['work_hard', 'mdi:briefcase-check-outline', 'Work Hard', 'Push for stronger performance'],
    ['slack_off', 'mdi:sofa-outline', 'Slack Off', 'Take it easier for a while'],
    ['socialise', 'mdi:account-group-outline', 'Socialise', 'Build workplace relationships'],
    ['ask_raise', 'mdi:cash-plus', 'Ask for Raise', 'Test your leverage'],
    ['stay_late', 'mdi:weather-night', 'Stay Late', 'Trade energy for momentum'],
    ['call_sick', 'mdi:thermometer', 'Call in Sick', 'Protect your health'],
    ['search_jobs', 'mdi:magnify', 'Search for Jobs', 'Look for a better move'],
    ['quit_job', 'mdi:exit-to-app', 'Quit Job', 'Walk away from the role'],
  ];
  return `
    <div class="career-actions">
      ${actions.map(([id, icon, title, sub]) => `
        <button class="career-action-btn" onclick="runCareerAction('${id}')">
          <div class="career-action-main">
            <div class="career-action-icon"><iconify-icon icon="${icon}" style="font-size:18px"></iconify-icon></div>
            <div class="career-action-text">
              <div class="career-action-title">${title}</div>
              <div class="career-action-sub">${sub}</div>
            </div>
          </div>
          <span class="choice-arrow">›</span>
        </button>
      `).join('')}
    </div>`;
}

function buildCareerProgressionSection(work) {
  if (isAnyLegalRole(STATE.career.job)) return buildLegalCareerProgressionSection(work);
  const path = work.progression || getCareerPathForJob(STATE.career.job);
  const currentIndex = getCareerPathIndex(path, STATE.career.job);
  return `
    <div class="career-path-card">
      ${path.map((role, index) => `
        ${index ? '<div class="career-path-arrow">↓</div>' : ''}
        <div class="career-path-node ${index === currentIndex ? 'current' : index > currentIndex ? 'future' : ''}">${role}</div>
      `).join('')}
    </div>`;
}

function getLegalPromotionChance() {
  const work = ensureCareerState();
  const title = STATE.career.job;
  const years = getCurrentJobYears();
  const rep = STATE.stats.rep || 0;
  let chance = 0;
  if (title === 'Year 1 Trainee Solicitor') chance = years >= 1 ? 100 : 0;
  else if (title === 'Year 2 Trainee Solicitor') chance = years >= 1 ? 100 : 0;
  else if (title === 'Pupil Barrister') chance = years >= 1 ? 100 : 0;
  else if (title === 'Junior Associate' && years >= 1) chance = 28 + (work.performance - 60) * 0.8 + (work.reputation - 55) * 0.6;
  else if (title === 'Associate' && years >= 2) chance = 18 + (work.performance - 62) * 0.7 + (work.reputation - 58) * 0.7;
  else if (title === 'Senior Associate' && years >= 3) chance = 5 + (work.performance - 70) * 0.45 + (work.reputation - 66) * 0.4 + rep * 0.18;
  else if (title === 'Junior Barrister' && years >= 3) chance = 22 + (work.performance - 60) * 0.75 + rep * 0.16;
  else if (title === 'Barrister' && years >= 4) chance = 12 + (work.performance - 65) * 0.55 + rep * 0.18;
  else if (title === 'KC / Senior Barrister' && years >= 5) chance = 6 + (work.performance - 70) * 0.4 + rep * 0.2;
  return clamp(Math.round(chance), 0, 92);
}

function getLegalRoleRequirementText(role) {
  const reasons = getLegalJobRequirements({ title: role });
  if (!reasons.length) return 'Unlocked';
  return reasons[0];
}

function buildLegalCareerProgressionSection(work) {
  const profile = getLegalRoleProfile(STATE.career.job) || {};
  const path = getLegalPathForJob(STATE.career.job) || [];
  const currentIndex = getCareerPathIndex(path, STATE.career.job);
  const years = getCurrentJobYears();
  const nextRole = path[currentIndex + 1] || 'Top of path';
  const yearsRequired = profile.yearsToNextMax
    ? `${profile.yearsToNext}-${profile.yearsToNextMax}`
    : (profile.yearsToNext || '—');
  const promotionChance = getLegalPromotionChance();
  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px">
        <div class="career-stat-card"><div class="career-stat-top"><div class="career-stat-label">Qualification</div><div class="career-stat-value" style="font-size:12px">${getLegalQualificationStatus()}</div></div></div>
        <div class="career-stat-card"><div class="career-stat-top"><div class="career-stat-label">Promotion Chance</div><div class="career-stat-value">${promotionChance}%</div></div></div>
        <div class="career-stat-card"><div class="career-stat-top"><div class="career-stat-label">Prestige</div><div class="career-stat-value">${'★'.repeat(profile.prestige || 1)}</div></div></div>
      </div>
      <div style="padding:14px;border-radius:18px;background:#fff;border:1px solid #e6ddd3">
        <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:10px">
          <div><div style="font-size:10px;font-weight:800;color:#8a8074;text-transform:uppercase">Current Title</div><div style="font-size:13px;font-weight:800;color:#1a1814;margin-top:6px">${STATE.career.job}</div></div>
          <div><div style="font-size:10px;font-weight:800;color:#8a8074;text-transform:uppercase">Years Done</div><div style="font-size:13px;font-weight:800;color:#1a1814;margin-top:6px">${years}</div></div>
          <div><div style="font-size:10px;font-weight:800;color:#8a8074;text-transform:uppercase">Years Needed</div><div style="font-size:13px;font-weight:800;color:#1a1814;margin-top:6px">${yearsRequired}</div></div>
          <div><div style="font-size:10px;font-weight:800;color:#8a8074;text-transform:uppercase">Stress Level</div><div style="font-size:13px;font-weight:800;color:#1a1814;margin-top:6px">${profile.stress || work.stress}/100</div></div>
        </div>
      </div>
      <div class="career-path-card">
        ${path.map((role, index) => `
          ${index ? '<div class="career-path-arrow">↓</div>' : ''}
          <div class="career-path-node ${index === currentIndex ? 'current' : index > currentIndex ? 'future' : ''}">
            <div>${role}</div>
            <div style="font-size:11px;font-weight:700;opacity:.72;margin-top:4px">${index <= currentIndex ? 'Unlocked' : getLegalRoleRequirementText(role)}</div>
          </div>
        `).join('')}
      </div>
      <div style="padding:12px 14px;border-radius:16px;background:#f8f1eb;border:1px solid #eadfd2;font-size:12px;font-weight:700;color:#6c6156">
        Next role: ${nextRole}. Current salary ${fmtMoney(STATE.finances.income)}. Promotions are performance, reputation, networking, and luck driven.
      </div>
    </div>`;
}

function buildEmployedCareerPage() {
  const work = ensureCareerState();
  return `
    <div class="career-page">
      <div class="career-hero">
        <div class="career-kicker">Career</div>
        <div class="career-title">${STATE.career.job}</div>
        <div class="career-company">${work.companyName}</div>
        <div class="career-yearline">Year ${Math.max(1, STATE.age - (STATE.career.startedAge ?? STATE.age) + 1)} • ${fmtMoney(STATE.finances.income)}</div>
        <div class="career-illustration"><iconify-icon icon="${work.icon || 'mdi:briefcase-outline'}"></iconify-icon></div>
      </div>
      <div>
        <div class="career-section-title">Work Stats</div>
        <div class="career-stats-grid" style="margin-top:10px">
          ${buildCareerStatCard('Performance', work.performance)}
          ${buildCareerStatCard('Stress', work.stress, { invert:true })}
          ${buildCareerStatCard('Reputation', work.reputation)}
          ${buildCareerStatCard('Job Satisfaction', work.satisfaction)}
        </div>
      </div>
      <div>
        <div class="career-section-title">Important People</div>
        <div style="margin-top:10px">${buildCareerPeopleSection(work)}</div>
      </div>
      <div>
        <div class="career-section-title">Work Actions</div>
        <div style="margin-top:10px">${buildCareerActionsSection()}</div>
      </div>
      <div>
        <div class="career-section-title">Career Progression</div>
        <div style="margin-top:10px">${buildCareerProgressionSection(work)}</div>
      </div>
    </div>`;
}

function maybePromoteCareer(work) {
  const path = work.progression || [];
  const currentIndex = getCareerPathIndex(path, STATE.career.job);
  if (currentIndex >= path.length - 1) return false;
  if (isQualifiedLegalRole(STATE.career.job)) return false;
  if (work.performance < 76 || work.reputation < 58) return false;
  if (isLegalSupportRole(STATE.career.job)) {
    const chance = 0.22 + (work.performance - 70) * 0.008 + (work.reputation - 55) * 0.008;
    if (Math.random() >= chance) return false;
  }
  const nextRole = path[currentIndex + 1];
  STATE.career.job = nextRole;
  STATE.career.level = Math.max(STATE.career.level || 0, currentIndex + 2);
  if (isLegalSupportRole(nextRole)) {
    const nextProfile = getLegalRoleProfile(nextRole);
    STATE.finances.income = getGeneratedSalaryForRange(nextProfile.salaryMin, nextProfile.salaryMax, clamp((work.performance + work.reputation) / 200));
  } else {
    STATE.finances.income = Math.round(STATE.finances.income * 1.12);
  }
  STATE.finances.job = nextRole;
  STATE.career.salary = STATE.finances.income;
  work.progression = getCareerPathForJob(nextRole);
  work.performance = clamp(work.performance - 12);
  work.stress = clamp(work.stress + 8);
  work.satisfaction = clamp(work.satisfaction + 6);
  logActivity(`You moved up to ${nextRole}.`, 10);
  showToast(`Promoted to ${nextRole}.`);
  return true;
}

function fireFromJob(reason) {
  logActivity(`Lost your job as ${STATE.career.job}. ${reason}`, -12);
  STATE.career.job = 'None';
  STATE.career.salary = 0;
  STATE.career.startedAge = null;
  STATE.career.category = null;
  STATE.career.work = null;
  STATE.finances.income = 0;
  STATE.finances.job = 'None';
  showToast('You lost your job.');
}

function runCareerAction(actionId) {
  const work = ensureCareerState();
  if (actionId === 'search_jobs') {
    openJobBoard('full-time');
    return;
  }
  if (actionId === 'quit_job') {
    fireFromJob('You decided to walk away.');
    saveGame();
    updateAllUI();
    return;
  }
  const apply = effects => {
    work.performance = clamp(work.performance + (effects.performance || 0));
    work.stress = clamp(work.stress + (effects.stress || 0));
    work.reputation = clamp(work.reputation + (effects.reputation || 0));
    work.satisfaction = clamp(work.satisfaction + (effects.satisfaction || 0));
    work.energy = clamp((work.energy || 60) + (effects.energy || 0));
    if (effects.money) STATE.finances.balance += effects.money;
    applyEffects({
      happy: effects.happy || 0,
      health: effects.health || 0,
      rel_friends: effects.relationships || 0,
      rep: effects.publicRep || 0,
    });
  };

  if (actionId === 'work_hard') {
    apply({ performance:+8, stress:+7, satisfaction:-2, energy:-8, happy:-1 });
    adjustWorkRelationship(work, 'Boss', +4);
    adjustWorkRelationship(work, 'Mentor', +3);
    logActivity('Worked especially hard this week.', 5);
    maybePromoteCareer(work);
  } else if (actionId === 'slack_off') {
    apply({ performance:-8, stress:-6, satisfaction:+3, energy:+4, reputation:-4, happy:+1 });
    adjustWorkRelationship(work, 'Boss', -5);
    adjustWorkRelationship(work, 'Office Rival', -2);
    logActivity('Took your foot off the gas at work.', -4);
  } else if (actionId === 'socialise') {
    apply({ reputation:+6, satisfaction:+5, performance:-2, relationships:+4, happy:+3 });
    adjustWorkRelationship(work, 'Coworker', +7);
    adjustWorkRelationship(work, 'Mentor', +2);
    logActivity('Spent time building relationships at work.', 6);
  } else if (actionId === 'ask_raise') {
    const success = work.performance >= 68 && work.reputation >= 58 && Math.random() < 0.45;
    if (success) {
      const raise = Math.max(900, Math.round(STATE.finances.income * 0.08));
      STATE.finances.income += raise;
      STATE.career.salary = STATE.finances.income;
      apply({ satisfaction:+6, stress:+3 });
      adjustWorkRelationship(work, 'Boss', +2);
      logActivity(`Negotiated a raise worth ${fmtMoney(raise)} a year.`, 8);
      showToast('Your raise was approved.');
    } else {
      apply({ stress:+5, satisfaction:-5, reputation:-2 });
      adjustWorkRelationship(work, 'Boss', -4);
      logActivity('Asked for a raise and got turned down.', -4);
      showToast('The raise did not happen.');
    }
  } else if (actionId === 'stay_late') {
    apply({ performance:+6, stress:+8, satisfaction:-1, energy:-10, health:-1 });
    adjustWorkRelationship(work, 'Boss', +3);
    adjustWorkRelationship(work, 'Office Rival', -2);
    logActivity('Stayed late to get extra work done.', 4);
    maybePromoteCareer(work);
  } else if (actionId === 'call_sick') {
    apply({ stress:-10, satisfaction:+2, energy:+10, health:+4, performance:-4, reputation:-3, happy:+1 });
    adjustWorkRelationship(work, 'Coworker', +1);
    adjustWorkRelationship(work, 'Boss', -2);
    logActivity('Took a sick day to recover.', 1);
  }

  maybeTriggerWorkplaceEvent(work, actionId, apply);

  if (work.stress >= 90) {
    applyEffects({ health:-4, happy:-5 });
    work.satisfaction = clamp(work.satisfaction - 6);
    showToast('You feel close to burnout.');
  }
  if (work.performance <= 18 || work.reputation <= 16) {
    fireFromJob('Things fell apart at work.');
  }
  saveGame();
  updateAllUI();
}

function buildLegalAchievementMilestone(pathway) {
  if (pathway === 'solicitor') {
    return {
      emoji:'⚖️',
      title:'Qualified Solicitor',
      body:'You completed your training contract and qualified as a solicitor. Elite legal roles now open to you.',
    };
  }
  return {
    emoji:'🏛️',
    title:'Qualified Barrister',
    body:'You completed pupillage and qualified as a barrister. The Bar is now fully open to you.',
  };
}

function queueLegalAchievement(pathway) {
  STATE.pendingMilestone = buildLegalAchievementMilestone(pathway);
}

function maybeCompleteFurtherEducationYear() {
  const furtherEducation = ensureFurtherEducationState();
  const current = furtherEducation.current;
  if (!current || current.status !== 'studying') return false;
  if (STATE.age - current.startedAge < current.durationYears) return false;
  current.status = 'completed';
  furtherEducation.completed.push(current.id);
  furtherEducation.current = null;
  logActivity(`Completed ${current.id}.`, 8);
  STATE.pendingMilestone = {
    emoji:'🎓',
    title:'Law Masters Complete',
    body:'You completed your Law Masters. Solicitor and barrister qualification routes are now unlocked.',
  };
  return true;
}

function applyAnnualLegalCareerProgression() {
  ensureLegalCareerState();
  const legalState = ensureLegalCareerState();
  const work = STATE.career?.work;
  const title = STATE.career?.job;
  if (!title || title === 'None') return;

  if (isLegalSupportRole(title)) legalState.supportYears += 1;
  if (!isAnyLegalRole(title) || !work) return;

  const profile = getLegalRoleProfile(title);
  const publicRep = STATE.stats.rep || 0;
  const networking = STATE.relationships.friends || 0;
  const currentYears = getCurrentJobYears();
  const raiseBase = isQualifiedLegalRole(title) ? 0.04 : 0.025;
  const raiseBonus = Math.max(0, (work.performance - 55) * 0.0015) + Math.max(0, (work.reputation - 55) * 0.0012);
  const volatility = profile.pathway === 'barrister' ? ((Math.random() * 0.18) - 0.06) : ((Math.random() * 0.08) - 0.02);
  const annualRaise = Math.max(-0.03, raiseBase + raiseBonus + volatility);
  STATE.finances.income = Math.max(0, Math.round(STATE.finances.income * (1 + annualRaise)));
  STATE.career.salary = STATE.finances.income;

  work.stress = clamp(work.stress + Math.round((profile.stress - 50) * 0.12));
  work.satisfaction = clamp(work.satisfaction - Math.round((profile.stress - 45) * 0.05));
  if (work.stress >= 85) {
    STATE.stats.happy = clamp(STATE.stats.happy - 4);
    STATE.stats.health = clamp(STATE.stats.health - 3);
  }

  if (title === 'Year 1 Trainee Solicitor' && currentYears >= 1) {
    STATE.career.job = 'Year 2 Trainee Solicitor';
    STATE.finances.job = 'Year 2 Trainee Solicitor';
    STATE.career.startedAge = STATE.age;
    STATE.finances.income = getGeneratedSalaryForRange(55000, 70000, clamp((work.performance + work.reputation) / 200));
    STATE.career.salary = STATE.finances.income;
    work.progression = getCareerPathForJob('Year 2 Trainee Solicitor');
    logActivity('Moved into your second year as a trainee solicitor.', 8);
    return;
  }

  if (title === 'Year 2 Trainee Solicitor' && currentYears >= 1) {
    legalState.qualifications.solicitor = true;
    STATE.stats.rep = clampRep((STATE.stats.rep || 0) + 18);
    STATE.career.job = 'Junior Associate';
    STATE.finances.job = 'Junior Associate';
    STATE.career.startedAge = STATE.age;
    STATE.finances.income = getGeneratedSalaryForRange(100000, 180000, clamp((work.performance + work.reputation) / 200));
    STATE.career.salary = STATE.finances.income;
    work.progression = getCareerPathForJob('Junior Associate');
    queueLegalAchievement('solicitor');
    return;
  }

  if (title === 'Pupil Barrister' && currentYears >= 1) {
    legalState.qualifications.barrister = true;
    STATE.stats.rep = clampRep((STATE.stats.rep || 0) + 20);
    STATE.career.job = 'Junior Barrister';
    STATE.finances.job = 'Junior Barrister';
    STATE.career.startedAge = STATE.age;
    STATE.finances.income = getGeneratedSalaryForRange(50000, 250000, clamp((work.performance + work.reputation) / 200));
    STATE.career.salary = STATE.finances.income;
    work.progression = getCareerPathForJob('Junior Barrister');
    queueLegalAchievement('barrister');
    return;
  }

  if (title === 'Junior Associate' && currentYears >= 3) {
    const chance = 0.32 + (work.performance - 60) * 0.008 + (work.reputation - 55) * 0.007 + publicRep * 0.002;
    if (Math.random() < chance) {
      STATE.career.job = 'Associate';
      STATE.finances.job = 'Associate';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(140000, 260000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Promoted to Associate.', 12);
    }
  } else if (title === 'Associate' && currentYears >= 4) {
    const chance = 0.22 + (work.performance - 62) * 0.006 + (work.reputation - 58) * 0.006 + publicRep * 0.002;
    if (Math.random() < chance) {
      STATE.career.job = 'Senior Associate';
      STATE.finances.job = 'Senior Associate';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(200000, 450000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Promoted to Senior Associate.', 14);
    }
  } else if (title === 'Senior Associate' && currentYears >= 3) {
    const chance = 0.04 + (work.performance - 70) * 0.003 + (work.reputation - 66) * 0.003 + networking * 0.001 + publicRep * 0.001;
    if (Math.random() < chance) {
      STATE.career.job = 'Partner';
      STATE.finances.job = 'Partner';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(700000, 5000000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Made Partner. Very few reach this level.', 20);
    }
  } else if (title === 'Junior Barrister' && currentYears >= 5) {
    const chance = 0.28 + (work.performance - 60) * 0.007 + publicRep * 0.0025;
    if (Math.random() < chance) {
      STATE.career.job = 'Barrister';
      STATE.finances.job = 'Barrister';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(150000, 500000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Moved up to Barrister.', 14);
    }
  } else if (title === 'Barrister' && currentYears >= 5) {
    const chance = 0.14 + (work.performance - 65) * 0.005 + publicRep * 0.003 + networking * 0.0015;
    if (Math.random() < chance) {
      STATE.career.job = 'KC / Senior Barrister';
      STATE.finances.job = 'KC / Senior Barrister';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(300000, 2000000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Took silk and became KC / Senior Barrister.', 18);
    }
  } else if (title === 'KC / Senior Barrister' && currentYears >= 6) {
    const chance = 0.06 + (work.performance - 70) * 0.003 + publicRep * 0.003 + networking * 0.001;
    if (Math.random() < chance) {
      STATE.career.job = 'Judge';
      STATE.finances.job = 'Judge';
      STATE.career.startedAge = STATE.age;
      STATE.finances.income = getGeneratedSalaryForRange(350000, 900000, clamp((work.performance + work.reputation) / 200));
      STATE.career.salary = STATE.finances.income;
      logActivity('Appointed as a Judge.', 20);
    }
  }

  if (work.stress >= 94 && work.satisfaction <= 24 && Math.random() < 0.22) {
    fireFromJob('Burnout pushed you out of legal work.');
  }
}

function openJobDetail(index, category = 'full-time') {
  const jobs = getJobListByCategory(category);
  const job = jobs[index];
  if (!job) return;
  _jobFlowState = {
    screen: 'detail',
    category,
    index,
    job,
    applicationScore: null,
    questions: [],
    questionIndex: 0,
    metrics: { reliability:0, judgement:0, workEthic:0, calmness:0, teamwork:0, creativity:0, bravery:0, interviewScore:0 },
    interviewEvent: null,
    result: null,
  };
  renderJobFlow();
  document.getElementById('job-overlay').classList.add('open');
}

function closeJobFlow() {
  _jobFlowState = null;
  document.getElementById('job-overlay').classList.remove('open');
}

function renderJobFlow() {
  if (!_jobFlowState) return;
  const { screen } = _jobFlowState;
  if (screen === 'detail') renderJobDetailScreen();
  if (screen === 'interview') renderJobInterviewScreen();
  if (screen === 'result') renderJobResultScreen();
}

function renderJobDetailScreen() {
  const { job } = _jobFlowState;
  const requirementBlock = job.locked
    ? `<div class="job-flow-copy" style="margin-top:12px;padding:12px 14px;border-radius:14px;background:#fff4f1;border:1px solid #efd2ca;color:#a05b4f;font-weight:700">${job.lockReasons.join('<br>')}</div>`
    : '';
  document.getElementById('job-inner').innerHTML = `
    <div class="job-flow-topbar">
      <button onclick="closeJobFlow()">Back</button>
      <div class="job-flow-title">Job Details</div>
      <div class="job-flow-spacer"></div>
    </div>
    <div class="job-flow-card">
      <div class="job-flow-kicker">${job.type}</div>
      <div class="job-flow-headline">${job.title}</div>
      <div class="job-flow-meta">${job.companyName}</div>
      <div class="job-flow-statline">
        <span class="job-flow-stat">${job.payLabel}</span>
        <span class="job-flow-stat">${job.jobCategory.replace(/^\w/, c => c.toUpperCase())}</span>
      </div>
      <div class="job-flow-copy">${job.description}</div>
      ${requirementBlock}
    </div>
    <button class="continue-btn" onclick="${job.locked ? `showToast('Requirements not met.')` : 'applyToSelectedJob()'}">${job.locked ? 'Locked' : 'Apply'}</button>
    <button class="birth-btn secondary" onclick="closeJobFlow()">Back</button>`;
}

function applyToSelectedJob() {
  if (!_jobFlowState?.job) return;
  const job = _jobFlowState.job;
  if (job.locked) {
    showToast('Requirements not met.');
    return;
  }
  const applicationScore = getPlayerApplicationScore(job);
  _jobFlowState.applicationScore = applicationScore;

  if (!job.requiresInterview) {
    if (applicationScore >= 54) {
      _jobFlowState.result = { kind:'immediate_hire' };
      _jobFlowState.screen = 'result';
      renderJobFlow();
      return;
    }
    _jobFlowState.result = { kind: applicationScore >= 42 ? 'no_response' : 'rejected' };
    _jobFlowState.screen = 'result';
    renderJobFlow();
    return;
  }

  if (applicationScore < 28) {
    _jobFlowState.result = { kind:'rejected' };
    _jobFlowState.screen = 'result';
    renderJobFlow();
    return;
  }

  _jobFlowState.questions = buildInterviewQuestions(job);
  _jobFlowState.interviewEvent = buildInterviewEvent(job);
  _jobFlowState.questionIndex = 0;
  _jobFlowState.screen = 'interview';
  renderJobFlow();
}

function renderJobInterviewScreen() {
  const { job, questions, questionIndex } = _jobFlowState;
  const current = questions[questionIndex];
  if (!current) {
    finishJobInterview();
    return;
  }
  document.getElementById('job-inner').innerHTML = `
    <div class="job-flow-topbar">
      <button onclick="closeJobFlow()">Leave</button>
      <div class="job-flow-title">Interview</div>
      <div class="job-flow-sub">${questionIndex + 1} / ${questions.length}</div>
    </div>
    <div class="job-flow-card">
      <div class="job-flow-kicker">Interview</div>
      <div class="job-flow-sub">You’re interviewing for ${job.title} at ${job.companyName}.</div>
      <div class="job-flow-question">${current.question}</div>
    </div>
    <div class="choices">
      ${current.answers.map((answer, idx) => `
        <button class="choice-btn" onclick="answerInterviewQuestion(${idx})">
          <span>${answer.text}</span>
          <span class="choice-arrow">›</span>
        </button>
      `).join('')}
    </div>`;
}

function answerInterviewQuestion(answerIndex) {
  const current = _jobFlowState?.questions?.[_jobFlowState.questionIndex];
  const answer = current?.answers?.[answerIndex];
  if (!answer) return;
  Object.entries(answer.effects || {}).forEach(([key, value]) => {
    _jobFlowState.metrics[key] = (_jobFlowState.metrics[key] || 0) + value;
  });
  _jobFlowState.questionIndex += 1;
  renderJobFlow();
}

function finishJobInterview() {
  const outcome = calculateInterviewOutcome(_jobFlowState.job, _jobFlowState.applicationScore, _jobFlowState.metrics, _jobFlowState.interviewEvent);
  _jobFlowState.result = { kind: outcome };
  _jobFlowState.screen = 'result';
  renderJobFlow();
}

function getJobResultContent() {
  const { job, result, interviewEvent } = _jobFlowState;
  const eventText = interviewEvent ? `<div class="job-flow-event">${interviewEvent.text}</div>` : '';
  if (result.kind === 'hired') {
    return `
      ${eventText}
      <div class="milestone-emoji">🎉</div>
      <div class="milestone-title">You Got the Job!</div>
      <div class="milestone-body">${job.companyName} offered you the role of ${job.title}.</div>
      <button class="continue-btn" onclick="acceptJobOffer()">Accept Job</button>
      <button class="birth-btn secondary" onclick="declineJobOffer()">Decline</button>`;
  }
  if (result.kind === 'immediate_hire') {
    return `
      <div class="milestone-emoji">💼</div>
      <div class="milestone-title">Hired on the Spot!</div>
      <div class="milestone-body">${job.companyName} offered you the job after a quick chat.</div>
      <button class="continue-btn" onclick="acceptJobOffer()">Accept Job</button>
      <button class="birth-btn secondary" onclick="declineJobOffer()">Decline</button>`;
  }
  if (result.kind === 'waitlisted') {
    return `
      ${eventText}
      <div class="milestone-emoji">⏳</div>
      <div class="milestone-title">No Response</div>
      <div class="milestone-body">They said they’ll get back to you, but nothing is certain yet.</div>
      <button class="continue-btn" onclick="closeJobFlow()">Continue</button>`;
  }
  if (result.kind === 'no_response') {
    return `
      <div class="milestone-emoji">📭</div>
      <div class="milestone-title">No Response</div>
      <div class="milestone-body">You never heard back from ${job.companyName}.</div>
      <button class="continue-btn" onclick="closeJobFlow()">Continue</button>`;
  }
  return `
    ${eventText}
    <div class="milestone-emoji">✉️</div>
    <div class="milestone-title">Application Rejected</div>
    <div class="milestone-body">${job.companyName} decided to go with another candidate.</div>
    <button class="continue-btn" onclick="closeJobFlow()">Continue</button>`;
}

function renderJobResultScreen() {
  document.getElementById('job-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;text-align:center">
      ${getJobResultContent()}
    </div>`;
}

function acceptJobOffer() {
  if (!_jobFlowState?.job) return;
  const job = _jobFlowState.job;
  const legalState = ensureLegalCareerState();
  const currentYears = STATE.career.job && STATE.career.job !== 'None'
    ? Math.max(0, STATE.age - (STATE.career.startedAge ?? STATE.age))
    : 0;
  STATE.career.experience = (STATE.career.experience || 0) + currentYears;
  STATE.career.job = job.title;
  const legalSalary = job.legalProfile
    ? getGeneratedSalaryForRange(
        job.legalProfile.salaryMin,
        job.legalProfile.salaryMax,
        clamp(((_jobFlowState.applicationScore || 55) - 25), 0, 100) / 100
      )
    : getJobAnnualIncome(job);
  STATE.career.salary = legalSalary;
  STATE.career.level = Math.max(STATE.career.level || 0, getCareerLevelForJob(job));
  STATE.career.startedAge = STATE.age;
  STATE.career.category = job.jobCategory;
  STATE.career.companyName = job.companyName;
  STATE.career.work = null;
  STATE.finances.income = legalSalary;
  STATE.finances.job = job.title;
  if (job.title.startsWith('Year 1 Trainee Solicitor')) legalState.pathwaysTried.push('solicitor');
  if (job.title === 'Pupil Barrister') legalState.pathwaysTried.push('barrister');
  ensureCareerState(job);
  logActivity(`Accepted a job as ${job.title} at ${job.companyName}.`, null);
  saveGame();
  updateAllUI();
  closeJobFlow();
  showToast(`Started work as ${job.title}.`);
}

function declineJobOffer() {
  const job = _jobFlowState?.job;
  if (job) logActivity(`Turned down an offer from ${job.companyName}.`, null);
  saveGame();
  closeJobFlow();
}

function previousUniApplicationStep() {
  if (_learnScreen === 'uniApplyPreview') {
    _learnScreen = 'uniApplyType';
  } else if (_learnScreen === 'uniApplyType') {
    _learnScreen = 'uniApplyBasics';
  } else {
    closeUniApplication();
    return;
  }
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function nextUniApplicationStep() {
  if (!_uniApplyDraft) _uniApplyDraft = { course:null, uniType:null, funding:null, status:'draft' };
  if (_learnScreen === 'uniApplyBasics') {
    if (!_uniApplyDraft.course || !_uniApplyDraft.funding) {
      showToast('Choose a course and funding.');
      return;
    }
    _learnScreen = 'uniApplyType';
  } else if (_learnScreen === 'uniApplyType') {
    if (!_uniApplyDraft.uniType) {
      showToast('Choose a university type.');
      return;
    }
    _learnScreen = 'uniApplyPreview';
  }
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function selectUniApplicationField(field, value) {
  if (!_uniApplyDraft) _uniApplyDraft = { course:null, uniType:null, funding:null, status:'draft' };
  _uniApplyDraft[field] = value;
  renderLearnTab();
}

function universityAcceptanceChance(application) {
  const grade = STATE.school.gradeScore || 50;
  const minimumRequired = {
    'Elite Universities': 90,
    'Top Universities': 80,
    'Standard Universities': 60,
    'Local Universities': 45,
  }[application.uniType] || 60;
  if (grade < minimumRequired) return 0;
  let chance = {
    'Elite Universities': 68,
    'Top Universities': 74,
    'Standard Universities': 82,
    'Local Universities': 90,
  }[application.uniType] || 70;
  chance += Math.floor((grade - minimumRequired) / 2);
  if (STATE.traits.includes('intelligent')) chance += 6;
  if (STATE.traits.includes('hardworking')) chance += 5;
  if (STATE.traits.includes('lazy')) chance -= 5;
  if (application.course === 'Medicine' || application.course === 'Law') chance -= 5;
  if (application.course === 'Art' || application.course === 'Music') chance += STATE.traits.includes('creative') ? 8 : -2;
  return clamp(chance, 0, 95);
}

function getUniRequirementLabel(uniType) {
  return {
    'Elite Universities': 'A+ only',
    'Top Universities': 'A or above',
    'Standard Universities': 'B-C or above',
    'Local Universities': 'D or above',
  }[uniType] || 'Varies';
}

function isEligibleForUniType(uniType, score) {
  const minimumRequired = {
    'Elite Universities': 90,
    'Top Universities': 80,
    'Standard Universities': 60,
    'Local Universities': 45,
  }[uniType] || 60;
  return (score || 0) >= minimumRequired;
}

function submitUniApplication() {
  if (!_uniApplyDraft?.course || !_uniApplyDraft?.uniType || !_uniApplyDraft?.funding) {
    showToast('Choose a course, university type, and funding.');
    return;
  }
  const postSchool = ensurePostSchoolState();
  postSchool.uniApplication = {
    ..._uniApplyDraft,
    submittedAge: STATE.age,
    status: 'pending',
    result: null,
  };
  saveGame();
  _learnScreen = 'main';
  _uniApplyDraft = null;
  renderLearnTab();
  showToast('Application sent. Age up to get results.');
}

function resolveUniversityApplication() {
  const application = STATE.school.postSchool?.uniApplication;
  if (!application || application.status !== 'pending') return null;
  if (application.submittedAge >= STATE.age) return null;
  const accepted = Math.random() * 100 < universityAcceptanceChance(application);
  if (accepted) {
    application.status = 'accepted';
    application.result = { outcome:'accepted', offeredType:application.uniType };
    return application.result;
  }
  const fallbackAvailable = (application.uniType === 'Elite Universities' || application.uniType === 'Top Universities')
    && isEligibleForUniType('Standard Universities', STATE.school.gradeScore);
  const fallbackAccepted = fallbackAvailable && Math.random() < 0.55;
  application.status = fallbackAccepted ? 'fallback_offer' : 'rejected';
  application.result = fallbackAccepted
    ? { outcome:'fallback_offer', offeredType:'Standard Universities' }
    : { outcome:'rejected', offeredType:null };
  return application.result;
}

function formatUniversityType(type) {
  return String(type || 'University').replace(/ Universities$/, ' University');
}

function getUniCourseConfig(id) {
  return UNI_COURSES.find(item => item.id === id) || UNI_COURSES[0];
}

function getUniTypeConfig(id) {
  return UNI_TYPES.find(item => item.id === id) || UNI_TYPES[0];
}

function getUniFundingConfig(id) {
  return UNI_FUNDING.find(item => item.id === id) || UNI_FUNDING[0];
}

function acceptUniversityOffer(type) {
  const postSchool = ensurePostSchoolState();
  if (!postSchool.uniApplication) return;
  postSchool.uniApplication.status = 'accepted_offer';
  postSchool.uniApplication.acceptedType = type;
  postSchool.uniApplication.startedAge = STATE.age;
  STATE.school.level = 'uni';
  STATE.school.current = formatUniversityType(type);
  logActivity(`Accepted a place to study ${postSchool.uniApplication.course} at ${formatUniversityType(type)}.`, null);
  saveGame();
  closeMilestone();
  updateAllUI();
}

function rejectUniversityOffer() {
  const postSchool = ensurePostSchoolState();
  if (postSchool.uniApplication) postSchool.uniApplication.status = 'declined';
  logActivity('Turned down the university offer.', null);
  saveGame();
  closeMilestone();
  updateAllUI();
}

function buildUniSectionTitle(step, title, sideText='') {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;border-radius:50%;background:#6d56c9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;box-shadow:0 10px 22px rgba(109,86,201,.18)">${step}</div>
        <div style="font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#473f38">${title}</div>
      </div>
      ${sideText ? `<div style="font-size:12px;font-weight:600;color:#978c80;display:flex;align-items:center;gap:4px">${sideText}<span style="font-size:18px;line-height:1">›</span></div>` : '<div></div>'}
    </div>`;
}

function buildUniPageHeader(title, subtitle='') {
  const backAction = _learnScreen === 'furtherEducation'
    ? 'closeFurtherEducation()'
    : (_learnScreen === 'uniApplyBasics' ? 'closeUniApplication()' : 'previousUniApplicationStep()');
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <button onclick="${backAction}"
        style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
        <span style="font-size:18px;line-height:1">‹</span>
        <span>Back</span>
      </button>
      <div style="font-size:16px;font-weight:800;color:var(--text)">${title}</div>
      <button style="width:26px;height:26px;border-radius:50%;border:1px solid #d9d0c5;background:#fff;color:#7d7268;display:flex;align-items:center;justify-content:center;font-size:15px">
        <iconify-icon icon="mdi:information-outline"></iconify-icon>
      </button>
    </div>
    ${subtitle ? `<div style="font-size:13px;line-height:1.45;color:#7d7268;margin-bottom:10px">${subtitle}</div>` : ''}`;
}

function buildUniCourseCards() {
  const selected = _uniApplyDraft?.course;
  return `
    <div style="display:flex;gap:12px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px 2px;scrollbar-width:none">
      ${UNI_COURSES.map(item => {
        const active = selected === item.id;
        return `
          <button onclick="selectUniApplicationField('course', '${item.id}')"
            style="position:relative;min-width:170px;flex:0 0 170px;padding:18px 15px 16px;border-radius:22px;border:1.5px solid ${active ? '#6d56c9' : 'rgba(220,212,203,.9)'};background:${active ? 'linear-gradient(180deg, #fdfbff, #ffffff)' : '#fff'};box-shadow:${active ? '0 16px 34px rgba(109,86,201,.14)' : '0 10px 26px rgba(72,48,26,.06)'};text-align:left;cursor:pointer">
            ${active ? `<div style="position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;background:#6d56c9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 18px rgba(109,86,201,.24)">✓</div>` : ''}
            <div style="font-size:34px;color:${active ? '#6d56c9' : '#7e68cf'};line-height:1;margin-bottom:10px"><iconify-icon icon="${item.icon}"></iconify-icon></div>
            <div style="font-size:17px;font-weight:800;color:#171510;line-height:1.1;margin-bottom:8px">${item.id}</div>
            <div style="font-size:12px;line-height:1.45;color:#5f564e;min-height:52px">${item.blurb}</div>
            <div style="display:flex;flex-direction:column;gap:7px;margin-top:12px">
              ${item.perks.map(([label, color]) => `
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#4f4741">
                  <span style="width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid ${color};color:${color};font-size:11px;flex-shrink:0">${color === '#d45b55' ? '!' : '↑'}</span>
                  <span>${label}</span>
                </div>`).join('')}
            </div>
            <div style="margin-top:16px;padding:10px 14px;border-radius:999px;background:${active ? '#6d56c9' : '#fff'};border:1px solid ${active ? '#6d56c9' : '#d9d0c5'};font-size:12px;font-weight:800;color:${active ? '#fff' : '#5b42b1'};text-align:center">${active ? 'Selected' : 'Select'}</div>
          </button>`;
      }).join('')}
    </div>`;
}

function buildUniTypeCards() {
  const selected = _uniApplyDraft?.uniType;
  return `
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
      ${UNI_TYPES.map(item => {
        const active = selected === item.id;
        return `
          <button onclick="selectUniApplicationField('uniType', '${item.id}')"
            style="position:relative;padding:16px 15px 14px;border-radius:22px;border:1.5px solid ${active ? item.accent : 'rgba(220,212,203,.9)'};background:${active ? item.cardBg : '#fff'};box-shadow:${active ? '0 16px 36px rgba(48,48,72,.16)' : '0 10px 24px rgba(72,48,26,.06)'};text-align:left;cursor:pointer;color:${active ? item.cardText : '#1a1814'};min-height:220px">
            <div style="position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;border:1.5px solid ${active ? '#fff3d8' : '#b8b0a8'};background:${active ? item.accent : '#fff'};display:flex;align-items:center;justify-content:center;color:${active ? '#fff' : 'transparent'};font-size:16px;box-shadow:${active ? '0 8px 20px rgba(0,0,0,.18)' : 'none'}">✓</div>
            <div style="font-size:34px;color:${active ? item.accent : item.accent};line-height:1;margin-bottom:8px"><iconify-icon icon="${item.icon}"></iconify-icon></div>
            <div style="font-size:16px;font-weight:800;line-height:1.12;margin-bottom:8px">${item.id}</div>
            <div style="display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:${item.tagBg};color:${item.tagColor};font-size:11px;font-weight:700;margin-bottom:12px">${item.tag}</div>
            <div style="display:flex;flex-direction:column;gap:7px;font-size:11px;line-height:1.45;color:${active ? 'rgba(255,250,242,.92)' : '#423b35'}">
              ${item.bullets.map(line => `<div>• ${line}</div>`).join('')}
            </div>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid ${active ? 'rgba(255,255,255,.18)' : '#ece4da'};display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <div style="font-size:10px;font-weight:700;color:${active ? 'rgba(255,250,242,.72)' : '#7f756b'};margin-bottom:6px">Stress</div>
                <div style="display:flex;gap:4px">${Array.from({ length:4 }, (_, index) => `<span style="width:10px;height:10px;border-radius:50%;background:${index < item.stress ? (active ? '#a78cf7' : '#8f79d9') : (active ? 'rgba(255,255,255,.2)' : '#ded7cf')};display:block"></span>`).join('')}</div>
              </div>
              <div>
                <div style="font-size:10px;font-weight:700;color:${active ? 'rgba(255,250,242,.72)' : '#7f756b'};margin-bottom:6px">Cost</div>
                <div style="font-size:22px;font-weight:800;color:${active ? '#cdb5ff' : item.accent}">${'£'.repeat(item.cost)}</div>
              </div>
            </div>
          </button>`;
      }).join('')}
    </div>`;
}

function buildUniFundingCards() {
  const selected = _uniApplyDraft?.funding;
  return `
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px">
      ${UNI_FUNDING.map(item => {
        const active = selected === item.id;
        return `
          <button onclick="selectUniApplicationField('funding', '${item.id}')"
            style="position:relative;padding:14px 12px 12px;border-radius:20px;border:1.5px solid ${active ? item.accent : 'rgba(220,212,203,.9)'};background:${active ? '#fefcff' : '#fff'};box-shadow:${active ? '0 12px 28px rgba(109,86,201,.12)' : '0 8px 20px rgba(72,48,26,.05)'};text-align:left;cursor:pointer;min-height:164px">
            <div style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;border:1.5px solid ${active ? item.accent : '#b8b0a8'};background:${active ? item.accent : '#fff'};display:flex;align-items:center;justify-content:center;color:${active ? '#fff' : 'transparent'};font-size:15px">✓</div>
            <div style="font-size:31px;color:${item.accent};line-height:1;margin-bottom:10px"><iconify-icon icon="${item.icon}"></iconify-icon></div>
            <div style="font-size:14px;font-weight:800;line-height:1.12;color:#171510;margin-bottom:8px">${item.id}</div>
            <div style="font-size:11px;line-height:1.45;color:#5f564e;min-height:50px">${item.blurb}</div>
            <div style="margin-top:12px;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:${item.tagBg};color:${item.tagColor};font-size:11px;font-weight:700">${item.tag}</div>
          </button>`;
      }).join('')}
    </div>`;
}

function buildUniPreviewCard() {
  const course = getUniCourseConfig(_uniApplyDraft?.course || 'Law');
  const uniType = getUniTypeConfig(_uniApplyDraft?.uniType || 'Top Universities');
  const funding = getUniFundingConfig(_uniApplyDraft?.funding || 'Student loan');
  const preview = UNI_TYPE_PREVIEW[uniType.id] || UNI_TYPE_PREVIEW['Top Universities'];
  const playerGrade = gradeFromScore(STATE.school.gradeScore || 0);
  const eligible = isEligibleForUniType(uniType.id, STATE.school.gradeScore);
  const requirement = getUniRequirementLabel(uniType.id);
  const chance = universityAcceptanceChance({
    course: _uniApplyDraft?.course || course.id,
    uniType: _uniApplyDraft?.uniType || uniType.id,
    funding: _uniApplyDraft?.funding || funding.id,
  });
  return `
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:2px 0 12px">
      <div style="height:1px;flex:1;background:linear-gradient(90deg, transparent, #dccfc0)"></div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#7d7267">
        <span style="color:#f0b43f">✦</span>
        <span>Your Application Preview</span>
        <span style="color:#f0b43f">✦</span>
      </div>
      <div style="height:1px;flex:1;background:linear-gradient(90deg, #dccfc0, transparent)"></div>
    </div>
    <div style="border-radius:26px;border:1px solid #e7ddd1;background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(249,244,238,.98));box-shadow:0 18px 40px rgba(67,45,26,.08);padding:14px">
      <div style="display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:12px">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#6d56c9;color:#fff;font-size:11px;font-weight:800;width:max-content">Your Application</div>
          <div style="font-family:var(--mono);font-size:28px;font-weight:700;line-height:.98;color:#182038">${formatUniversityType(uniType.id)}</div>
          <div style="display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;color:#5d4aa6">
            <iconify-icon icon="${course.icon}" style="font-size:21px"></iconify-icon>
            <span>${course.id} Applicant</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#fff;border:1px solid #ece4da;font-size:11px;font-weight:700;color:#4f4741"><iconify-icon icon="mdi:currency-gbp" style="font-size:15px"></iconify-icon>${preview.fee}</div>
            <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:${eligible ? '#eef7ea' : '#fff1ec'};border:1px solid ${eligible ? '#d7ebd5' : '#f1d3cb'};font-size:11px;font-weight:700;color:${eligible ? '#4d8450' : '#b15e53'}"><iconify-icon icon="mdi:school-outline" style="font-size:15px"></iconify-icon>Your grade: ${playerGrade}</div>
            <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#fff;border:1px solid #ece4da;font-size:11px;font-weight:700;color:#4f4741"><iconify-icon icon="mdi:star-outline" style="font-size:15px"></iconify-icon>Needs ${requirement}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="padding:12px;border-radius:18px;background:#fff;border:1px solid #ede4d8">
              <div style="font-size:11px;font-weight:700;color:#7b7268;margin-bottom:8px">Reputation</div>
              <div style="display:flex;align-items:center;gap:2px;margin-bottom:6px">${Array.from({ length:5 }, (_, index) => `<span style="color:${index < Math.max(1, Math.round((uniType.stress + 1) / 1.25)) ? '#f4b239' : '#e6ddd2'};font-size:19px">★</span>`).join('')}</div>
              <div style="font-size:11px;font-weight:700;color:#4f4741">${Math.max(1, Math.round((uniType.stress + 1) / 1.25))}/5</div>
            </div>
            <div style="padding:12px;border-radius:18px;background:#fff;border:1px solid #ede4d8">
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#4f4741">
                <iconify-icon icon="${funding.icon}" style="font-size:20px;color:${funding.accent}"></iconify-icon>
                <span>Funding</span>
              </div>
              <div style="font-size:18px;font-weight:800;color:#191611;line-height:1.15;margin-top:8px">${funding.id}</div>
            </div>
          </div>
        </div>
        <div style="position:relative;min-height:290px;border-radius:22px;background:radial-gradient(circle at 22% 18%, rgba(250,232,181,.9), rgba(250,232,181,0) 32%), linear-gradient(180deg, #eef4ff 0%, #f6f0e9 100%);overflow:hidden;padding:16px">
          <img src="${UNI_PREVIEW_IMAGE}" alt="University preview" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block" />
          <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.02))"></div>
          <div style="position:absolute;inset:auto 14px 12px auto;width:108px;padding:12px 12px 10px;border-radius:18px;background:rgba(255,255,255,.95);border:1px solid rgba(201,222,200,.9);box-shadow:0 14px 30px rgba(62,114,66,.12)">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:${eligible ? '#4c8252' : '#be5a52'};margin-bottom:6px"><iconify-icon icon="${eligible ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}" style="font-size:15px"></iconify-icon>${eligible ? 'Acceptance Chance' : 'Not Eligible Yet'}</div>
            <div style="font-size:40px;font-weight:900;line-height:1;color:${eligible ? '#4c9c4f' : '#cf6c5a'}">${eligible ? `${chance}%` : '0%'}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:10px;margin-top:12px">
        ${preview.studentLife.map(([label, value, color, fill]) => `
          <div style="padding:11px 10px;border-radius:18px;background:#fff;border:1px solid #ede4d8">
            <div style="font-size:10px;font-weight:700;color:#7d7268;margin-bottom:6px">${label}</div>
            <div style="font-size:13px;font-weight:800;color:${color};margin-bottom:8px">${value}</div>
            <div style="height:8px;border-radius:999px;background:#f1e7db;overflow:hidden">
              <div style="width:${fill}%;height:100%;border-radius:inherit;background:${color}"></div>
            </div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:minmax(0, 1fr) 152px;gap:12px;margin-top:12px">
        <div style="padding:14px 16px;border-radius:18px;background:#f7f0ff;border:1px solid #eadfff;font-size:14px;line-height:1.5;color:#443c63">${preview.blurb}</div>
        <div style="display:flex;align-items:center;justify-content:center;padding:14px 10px;border-radius:18px;background:#fffaf2;border:1px dashed #e5d5be;font-size:13px;font-weight:700;color:#8c7450">Figure things out later</div>
      </div>
    </div>`;
}

function buildUniApplicationScreen() {
  if (!_uniApplyDraft) _uniApplyDraft = { course:null, uniType:null, funding:null, status:'draft' };
  const basicsReady = _uniApplyDraft.course && _uniApplyDraft.funding;
  const typeReady = !!_uniApplyDraft.uniType;
  const previewReady = basicsReady && typeReady;
  if (_learnScreen === 'uniApplyBasics') {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
        ${buildUniPageHeader('Apply to University', 'Choose your course and how you plan to fund it first.')}
        <div>
          ${buildUniSectionTitle(1, 'Choose Your Course', 'Swipe to explore')}
          ${buildUniCourseCards()}
        </div>
        <div>
          ${buildUniSectionTitle(2, 'How Will You Fund Your Studies?')}
          ${buildUniFundingCards()}
        </div>
        <button onclick="nextUniApplicationStep()"
          style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${basicsReady ? '#6d56c9' : '#d9d0c5'};background:${basicsReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${basicsReady ? '#fff' : '#a0968c'};box-shadow:${basicsReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
          <span style="font-size:15px;font-weight:800">Next: University Type</span>
          <span style="font-size:20px;line-height:1">›</span>
        </button>
      </div>`;
  }
  if (_learnScreen === 'uniApplyType') {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
        ${buildUniPageHeader('Choose University Type', 'Pick the level you want to apply for. Your grade requirement updates on the next page.')}
        <div>
          ${buildUniSectionTitle(3, 'Choose University Type')}
          ${buildUniTypeCards()}
        </div>
        <button onclick="nextUniApplicationStep()"
          style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${typeReady ? '#6d56c9' : '#d9d0c5'};background:${typeReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${typeReady ? '#fff' : '#a0968c'};box-shadow:${typeReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
          <span style="font-size:15px;font-weight:800">Next: Application Preview</span>
          <span style="font-size:20px;line-height:1">›</span>
        </button>
      </div>`;
  }
  return `
    <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Application Preview', 'Review your choices before sending your UCAS application.')}
      ${buildUniPreviewCard()}
      <button onclick="submitUniApplication()"
        style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${previewReady ? '#6d56c9' : '#d9d0c5'};background:${previewReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${previewReady ? '#fff' : '#a0968c'};box-shadow:${previewReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
        <iconify-icon icon="mdi:email-outline" style="font-size:24px"></iconify-icon>
        <div style="text-align:left">
          <div style="font-size:15px;font-weight:800;line-height:1.05">Submit UCAS Application</div>
          <div style="font-size:12px;font-weight:600;opacity:.86;margin-top:4px">${previewReady ? 'Results will arrive when you age up.' : 'Finish your application choices first.'}</div>
        </div>
      </button>
    </div>`;
}

function ensureSchoolVipState() {
  if (!STATE.school) return;
  if (!Array.isArray(STATE.school.vipIds)) STATE.school.vipIds = [];
  STATE.school.vipIds = STATE.school.vipIds.filter(id => STATE.school.classmates.some(c => c.id === id));
}

function isClassmateVip(classmateId) {
  ensureSchoolVipState();
  return STATE.school.vipIds.includes(classmateId);
}

function applyClassmateVipButtonState(classmateId) {
  const button = document.querySelector(`[data-classmate-vip-button="${classmateId}"]`);
  if (!button) return;
  const active = isClassmateVip(classmateId);
  button.textContent = active ? 'VIP added' : 'Add to VIP list';
  button.style.borderColor = active ? '#efb7c9' : '#ddd2c6';
  button.style.background = active ? '#fff1f6' : '#fffaf2';
  button.style.boxShadow = active ? '0 8px 18px rgba(201,95,134,.14)' : 'none';
  button.style.color = active ? '#c95f86' : '#7b6b5f';
  button.style.transform = 'scale(0.98)';
  setTimeout(() => {
    if (button.isConnected) button.style.transform = '';
  }, 120);
}

function toggleClassmateVip(classmateId) {
  ensureSchoolVipState();
  const next = STATE.school.vipIds.filter(id => STATE.school.classmates.some(c => c.id === id));
  const index = next.indexOf(classmateId);
  if (index >= 0) {
    next.splice(index, 1);
    STATE.school.vipIds = next;
    saveGame();
  } else {
    if (next.length >= 3) next.shift();
    next.push(classmateId);
    STATE.school.vipIds = next;
    saveGame();
  }
  if (_learnScreen === 'classmate' && _learnClassmateId === classmateId) {
    applyClassmateVipButtonState(classmateId);
    return;
  }
  renderLearnTab();
}

function openLearnClassmateDetail(classmateId) {
  _learnScreen = 'classmate';
  _learnClassmateId = classmateId;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeLearnClassmateDetail() {
  _learnScreen = 'classmates';
  _learnClassmateId = null;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function runLearnClassmateAction(actionId, classmateId) {
  triggerAction(actionId, classmateId, 'classmate');
  _learnScreen = 'classmate';
  _learnClassmateId = classmateId;
  renderLearnTab();
}

function buildLearnClassmateActions(c) {
  const actions = getAvailableActions('classmate', STATE.age, c);
  if (!actions.length) return '';
  return `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${actions.map(action => `
        <button onclick="runLearnClassmateAction('${action.id}', '${c.id}')"
          style="width:100%;padding:11px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:11px;font-size:13px;font-weight:600;color:var(--text);text-align:left;cursor:pointer">
          ${action.name}
        </button>`).join('')}
    </div>`;
}

function buildLearnHeroSchool(edu, grade, avgGrade, gradeAboveAvg) {
  const primaryIllustration = 'data/primary_school_hero_card.png';
  const schoolType = edu.type?.primary || 'State Primary';
  const reputationByType = {
    'State Primary': 3,
    'Prep School': 4,
    'Elite Prep School': 5,
  };
  const schoolReputation = reputationByType[schoolType] || 3;
  const stageLabels = { pre:'Pre-School', primary:'Primary School', secondary:'Secondary School', college:'Sixth Form / College', uni:'University' };
  const currentYear = Math.min(Math.max((STATE.age - 4), 1), 6);
  const totalYears = 6;
  const schoolName = edu.current || 'School';
  const schoolStage = stageLabels[edu.level] || 'School';
  const starIcons = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < schoolReputation ? '#ffb703' : '#e6ded4'};font-size:20px;letter-spacing:.02em">★</span>`
  ).join('');
  return `
    <div style="display:flex;flex-direction:column;min-height:206px">
      <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:18px">
        <div style="display:flex;flex-direction:column;flex:1;min-width:0;padding-top:2px;position:relative;z-index:2;max-width:52%">
          <div style="display:inline-flex;align-items:center;width:fit-content;background:#ece8e3;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;color:#5f5a54">
            ${schoolStage}
          </div>
          <div style="font-size:26px;font-weight:800;letter-spacing:-.045em;line-height:1.03;color:#121212;margin-top:12px">${schoolName}</div>
          <div style="font-size:13px;font-weight:700;color:#6a6661;margin-top:10px">Year ${currentYear} of ${totalYears}</div>
          <div style="height:38px"></div>
        </div>
        <img src="${primaryIllustration}" alt="Primary school illustration" style="position:absolute;right:-18px;top:-44px;width:280px;height:330px;object-fit:contain;display:block;z-index:1;pointer-events:none" />
      </div>
      <div style="margin-top:auto;padding-top:10px;border-top:1px solid rgba(44,33,23,.12);display:flex;align-items:flex-start">
        <div style="display:flex;align-items:flex-start;gap:10px;flex:1;padding-right:20px">
          <iconify-icon icon="material-symbols:location-city-rounded" style="font-size:20px;color:#b8aea3;flex-shrink:0;margin-top:1px"></iconify-icon>
          <div style="min-width:0">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9a9085">School Type</div>
            <div style="font-size:14px;font-weight:800;color:#1a1814;margin-top:4px;line-height:1.1;white-space:nowrap">${schoolType}</div>
          </div>
        </div>
        <div style="width:1px;align-self:stretch;background:rgba(44,33,23,.12)"></div>
        <div style="display:flex;align-items:flex-start;gap:10px;flex:1;padding-left:20px">
          <iconify-icon icon="material-symbols:kid-star-rounded" style="font-size:20px;color:#ffb703;flex-shrink:0;margin-top:1px"></iconify-icon>
          <div style="min-width:0">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9a9085">School Reputation</div>
            <div style="display:flex;align-items:center;gap:3px;margin-top:5px;line-height:1;white-space:nowrap">${starIcons}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getUniversityCourseDuration(course) {
  return {
    Law: 3,
    Medicine: 5,
    Business: 3,
    'Computer Science': 3,
    Art: 3,
    Psychology: 3,
    Engineering: 4,
    History: 3,
    Music: 3,
  }[course] || 3;
}

function getUniversityReputation(type) {
  return {
    'Elite University': 5,
    'Top University': 4,
    'Standard University': 2,
    'Local University': 1,
  }[type] || 3;
}

function ensureUniversityState() {
  const postSchool = ensurePostSchoolState();
  if (!STATE.school.uniProfile) {
    STATE.school.uniProfile = {
      people: [
        { id:'uni-flatmate', label:'Flatmate', role:'Friend', firstName:'Maya', surname:'Collins', age:18, appearance: generateAppearance('female') },
        { id:'uni-lecturer', label:'Lecturer', role:'Teacher', title:'Dr', firstName:'Harris', surname:'', age:42, appearance: generateAppearance('male') },
        { id:'uni-rival', label:'Course Rival', role:'Friend', firstName:'Oliver', surname:'Reed', age:18, appearance: generateAppearance('male') },
        { id:'uni-friend', label:'Friend', role:'Friend', firstName:'Zara', surname:'Ahmed', age:18, appearance: generateAppearance('female') },
      ],
    };
  }
  if (!postSchool.uniApplication?.startedAge) {
    postSchool.uniApplication.startedAge = Math.max(18, STATE.age);
  }
  return STATE.school.uniProfile;
}

function getUniversityYearMeta() {
  const application = STATE.school.postSchool?.uniApplication || {};
  const course = application.course || 'Course';
  const totalYears = getUniversityCourseDuration(course);
  const startedAge = application.startedAge ?? 18;
  const currentYear = clamp((STATE.age - startedAge) + 1, 1, totalYears);
  return { course, totalYears, currentYear };
}

function buildUniversityHeroCard() {
  const application = STATE.school.postSchool?.uniApplication || {};
  const uniType = STATE.school.current || 'University';
  const { course, totalYears, currentYear } = getUniversityYearMeta();
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < getUniversityReputation(uniType) ? '#f4b239' : '#e6ddd2'};font-size:19px;letter-spacing:.02em">★</span>`
  ).join('');
  return `
    <div style="display:flex;flex-direction:column;min-height:208px">
      <div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;min-height:150px">
        <div style="display:flex;flex-direction:column;flex:1;min-width:0;max-width:55%;position:relative;z-index:2">
          <div style="display:inline-flex;align-items:center;width:fit-content;background:#ece7f6;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:800;color:#6558a8;text-transform:uppercase;letter-spacing:.07em">University</div>
          <div style="font-size:30px;font-weight:800;letter-spacing:-.045em;line-height:1.02;color:#172039;margin-top:12px">${uniType}</div>
          <div style="font-size:13px;font-weight:700;color:#6d6587;margin-top:10px">Year ${currentYear} of ${totalYears}</div>
        </div>
        <img src="${UNI_PREVIEW_IMAGE}" alt="University illustration" style="position:absolute;right:-8px;top:-30px;width:210px;height:210px;object-fit:contain;display:block;pointer-events:none;z-index:1" />
      </div>
      <div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(50,40,86,.12);display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <iconify-icon icon="mdi:school-outline" style="font-size:20px;color:#6d56c9;flex-shrink:0;margin-top:1px"></iconify-icon>
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8e83aa">Course</div>
            <div style="font-size:14px;font-weight:800;color:#1a1814;margin-top:4px;line-height:1.1">${course}</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <iconify-icon icon="mdi:star-outline" style="font-size:20px;color:#f0b43f;flex-shrink:0;margin-top:1px"></iconify-icon>
          <div>
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8e83aa">University Reputation</div>
            <div style="display:flex;align-items:center;gap:2px;margin-top:5px;line-height:1">${stars}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function buildUniversityPerformanceSection() {
  const application = STATE.school.postSchool?.uniApplication || {};
  const grade = gradeFromScore(STATE.school.gradeScore || 0);
  const stress = clamp(Math.round(((100 - (STATE.stats.happy || 0)) * 0.72) + ((100 - (STATE.stats.health || 0)) * 0.28)));
  const social = clamp(Math.round(((STATE.stats.popularity || 0) * 0.7) + ((STATE.relationships.friends || 0) * 0.3)));
  const networking = clamp(Math.round(((STATE.stats.smarts || 0) * 0.35) + ((STATE.stats.popularity || 0) * 0.35) + ((STATE.relationships.friends || 0) * 0.3)));
  const cards = [
    {
      iconHTML: `<iconify-icon icon="material-symbols:assignment-rounded" style="font-size:24px;color:#8f73df"></iconify-icon>`,
      value: grade,
      label: 'Grade',
      percent: clamp(STATE.school.gradeScore || scoreFromGrade(grade)),
      barColor: '#8f73df',
      track: '#efe7fb',
      valueSize: '20px',
    },
    {
      iconHTML: `<iconify-icon icon="material-symbols:neurology-rounded" style="font-size:24px;color:#d47a57"></iconify-icon>`,
      value: stress,
      label: 'Stress',
      percent: stress,
      barColor: '#d47a57',
      track: '#f4e3d8',
    },
    {
      iconHTML: `<iconify-icon icon="material-symbols:groups-rounded" style="font-size:24px;color:#5c8fd8"></iconify-icon>`,
      value: social,
      label: 'Social Life',
      percent: social,
      barColor: '#5c8fd8',
      track: '#e7eefb',
    },
    {
      iconHTML: `<iconify-icon icon="mdi:handshake-outline" style="font-size:24px;color:#56a56f"></iconify-icon>`,
      value: networking,
      label: 'Networking',
      percent: networking,
      barColor: '#56a56f',
      track: '#e4f1e7',
    },
  ];
  return `
    <div style="margin-top:8px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c748d;margin-bottom:10px">Your Student Life</div>
      <div style="display:flex;gap:10px">
        ${cards.map(card => buildLearnPerformanceCard(card)).join('')}
      </div>
    </div>`;
}

function buildUniversityImportantPersonCard(person) {
  const badgeColor = person.label === 'Lecturer' ? '#7f8fcf' : person.label === 'Course Rival' ? '#d77a72' : person.label === 'Flatmate' ? '#8a73d2' : '#72a985';
  const displayName = `${person.title ? `${person.title} ` : ''}${person.firstName} ${person.surname}`.trim();
  return `
    <div style="flex:1;min-width:0;background:var(--surface);border:1px solid rgba(225,214,202,0.9);border-radius:18px;padding:12px 8px 10px;box-shadow:0 10px 22px rgba(64,42,22,0.06);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;min-height:126px">
      <div style="position:relative;width:62px;height:62px;border-radius:50%;background:#fff9f0;border:1px solid rgba(226,212,196,0.9);display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${getCharacterHTML(person.appearance, person.age || 19, 58, { showBg: false })}
        <div style="position:absolute;top:4px;right:4px;min-width:18px;height:18px;border-radius:999px;background:#fff;box-shadow:0 2px 8px rgba(34,26,18,0.12);display:flex;align-items:center;justify-content:center;color:${badgeColor};font-size:11px;font-weight:800;padding:0 4px">${person.label === 'Lecturer' ? 'A' : person.label === 'Course Rival' ? '!' : '•'}</div>
      </div>
      <div style="font-size:11px;font-weight:800;color:${badgeColor};line-height:1;text-transform:uppercase;letter-spacing:.06em;text-align:center">${person.label}</div>
      <div style="font-size:13px;font-weight:700;color:#1b1815;line-height:1.15;text-align:center">${displayName}</div>
    </div>`;
}

function buildUniversityImportantPeopleSection() {
  const uni = ensureUniversityState();
  return `
    <div style="margin-top:18px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c748d;margin-bottom:10px">Important People</div>
      <div style="display:flex;gap:10px">
        ${uni.people.map(person => buildUniversityImportantPersonCard(person)).join('')}
      </div>
    </div>`;
}

function buildUniversityLifeActionRow(icon, title) {
  return `
    <button onclick="showToast('${title} is coming next.')"
      style="width:100%;padding:13px 14px;background:transparent;border:none;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        <div style="width:32px;height:32px;border-radius:12px;background:#f5efff;border:1px solid #e5daf8;display:flex;align-items:center;justify-content:center;color:#6956c6;flex-shrink:0">
          <iconify-icon icon="${icon}" style="font-size:18px"></iconify-icon>
        </div>
        <div style="font-size:14px;font-weight:700;color:#1a1814;text-align:left">${title}</div>
      </div>
      <span style="font-size:20px;line-height:1;color:#948a80">›</span>
    </button>`;
}

function buildUniversityLifeSection() {
  const rows = [
    ['mdi:book-open-page-variant-outline', 'Attend Lecture'],
    ['mdi:library-shelves', 'Study in Library'],
    ['mdi:account-group-outline', 'Join Society'],
    ['mdi:glass-cocktail', 'Go Clubbing'],
    ['mdi:briefcase-outline', 'Apply for Internship'],
    ['mdi:weather-night', 'Pull All-Nighter'],
  ];
  return `
    <div class="actions-section" style="margin-top:18px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c748d;margin-bottom:10px">University Life</div>
      <div style="background:var(--surface);border:1px solid rgba(225,214,202,0.9);border-radius:20px;box-shadow:0 12px 24px rgba(64,42,22,0.06);overflow:hidden">
        ${rows.map((row, index) => `
          <div style="${index ? 'border-top:1px solid rgba(226,216,205,0.9);' : ''}">
            ${buildUniversityLifeActionRow(row[0], row[1])}
          </div>`).join('')}
      </div>
    </div>`;
}

function buildLearnHeroStat(label, value) {
  return `
    <div style="flex:1;text-align:center">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1a1814;opacity:.45">${label}</div>
      <div style="font-size:14px;font-weight:700;color:#1a1814;margin-top:3px">${value}</div>
    </div>`;
}

function buildLearnPerformanceCard({ iconHTML, value, label, percent, barColor, track = '#efe4d9', valueSize = '19px' }) {
  return `
    <div style="flex:1;min-width:0;background:var(--surface);border:1px solid rgba(225, 214, 202, 0.9);border-radius:18px;padding:14px 10px 12px;box-shadow:0 10px 22px rgba(64, 42, 22, 0.06);display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:8px">
      <div style="height:30px;display:flex;align-items:center;justify-content:center">${iconHTML}</div>
      <div style="font-size:${valueSize};font-weight:800;letter-spacing:-.03em;color:#191714;line-height:1">${value}</div>
      <div style="font-size:11px;font-weight:700;color:#312a24;line-height:1.1;text-align:center">${label}</div>
      <div style="width:100%;height:6px;border-radius:999px;background:${track};overflow:hidden;margin-top:2px">
        <div style="width:${clamp(percent)}%;height:100%;border-radius:999px;background:${barColor}"></div>
      </div>
    </div>`;
}

function buildLearnPerformanceSection(edu, grade) {
  const stressValue = clamp(Math.round(((100 - (STATE.stats.happy || 0)) * 0.7) + ((100 - (STATE.stats.health || 0)) * 0.3)));
  const cards = [
    {
      iconHTML: `<iconify-icon icon="material-symbols:assignment-rounded" style="font-size:24px;color:#a874d8"></iconify-icon>`,
      value: grade,
      label: 'Grade',
      fill: gradeColor(grade),
      track: '#efe5d9',
      valueSize: '20px',
      percent: clamp(edu.gradeScore || scoreFromGrade(grade)),
    },
    {
      iconHTML: `<div style="font-size:24px;font-weight:900;color:#111;line-height:1">?</div>`,
      value: '—',
      label: 'Creativity',
      fill: '#f472b6',
      track: '#f8e7ee',
      percent: 45,
      valueSize: '20px',
    },
    {
      iconHTML: `<iconify-icon icon="material-symbols:groups-rounded" style="font-size:24px;color:#fb8c23"></iconify-icon>`,
      value: STATE.stats.popularity ?? 0,
      label: 'Popularity',
      fill: '#fb8c23',
      track: '#f5e6d7',
      percent: clamp(STATE.stats.popularity || 0),
    },
    {
      iconHTML: `<iconify-icon icon="material-symbols:neurology-rounded" style="font-size:24px;color:#a674d9"></iconify-icon>`,
      value: stressValue,
      label: 'Stress',
      fill: '#b084dd',
      track: '#ede2f7',
      percent: stressValue,
    },
  ];

  return `
    <div style="margin-top:8px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8c8175;margin-bottom:10px">Your Performance</div>
      <div style="display:flex;gap:10px">
        ${cards.map(card => buildLearnPerformanceCard({
          iconHTML: card.iconHTML,
          value: card.value,
          label: card.label,
          percent: card.percent,
          barColor: card.fill,
          track: card.track,
          valueSize: card.valueSize,
        })).join('')}
      </div>
    </div>`;
}

function buildLearnImportantPeopleSlots(edu) {
  ensureSchoolVipState();
  const slots = [];
  const usedIds = new Set();
  const teachers = [...(edu.teachers || [])];

  const addPersonSlot = (person, label, role) => {
    if (!person || usedIds.has(person.id) || slots.length >= 4) return;
    usedIds.add(person.id);
    slots.push({ type:'person', person, label, role });
  };
  const addPlaceholderSlot = label => {
    if (slots.length >= 4) return;
    slots.push({ type:'placeholder', label });
  };

  const teacher = [...teachers].sort((a, b) => (b.npcStats?.warmth || 0) - (a.npcStats?.warmth || 0))[0];
  addPersonSlot(teacher, 'Teacher', 'Teacher');
  STATE.school.vipIds
    .map(id => edu.classmates.find(c => c.id === id))
    .filter(Boolean)
    .forEach(person => {
      const label = isClassmateCrush(person) ? 'Crush' : person.status === 'friend' ? 'Friend' : 'Classmate';
      addPersonSlot(person, label, 'classmate');
    });

  while (slots.length < 4) {
    addPlaceholderSlot('Add Here');
  }
  return slots;
}

function buildLearnImportantPersonCard(slot) {
  if (slot.type === 'placeholder') {
    return `
      <div style="flex:1;min-width:0;background:rgba(255,255,255,0.62);border:1px dashed rgba(210,196,181,0.95);border-radius:18px;padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:126px">
        <div style="width:58px;height:58px;border-radius:50%;border:1px dashed rgba(182,167,151,0.85);display:flex;align-items:center;justify-content:center;color:#b2a698;background:rgba(246,240,234,0.7);font-size:20px;font-weight:700">+</div>
        <div style="font-size:11px;font-weight:800;color:#8e8276;line-height:1.1;text-align:center;text-transform:uppercase;letter-spacing:.06em">${slot.label}</div>
        <div style="font-size:12px;color:#b0a396;line-height:1;text-align:center">Add here</div>
      </div>`;
  }

  const { person, role, label } = slot;
  const displayName = role === 'classmate'
    ? `${person.firstName || ''} ${person.surname || ''}`.trim()
    : `${person.title ? `${person.title} ` : ''}${person.firstName || ''} ${person.surname || ''}`.trim();
  const badgeColor = label === 'Crush' ? '#f07ba9' : label === 'Best Friend' ? '#f1ad38' : label === 'Teacher' ? '#8ea0d8' : '#72a985';
  return `
    <button onclick="openPersonSheet('${person.id}','${role}')" style="flex:1;min-width:0;background:var(--surface);border:1px solid rgba(225,214,202,0.9);border-radius:18px;padding:12px 8px 10px;box-shadow:0 10px 22px rgba(64,42,22,0.06);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;min-height:126px;cursor:pointer">
      <div style="position:relative;width:62px;height:62px;border-radius:50%;background:#fff9f0;border:1px solid rgba(226,212,196,0.9);display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${getCharacterHTML(person.appearance, role === 'Teacher' ? 35 : STATE.age, 58, { showBg: false })}
        <div style="position:absolute;top:4px;right:4px;min-width:18px;height:18px;border-radius:999px;background:#fff;box-shadow:0 2px 8px rgba(34,26,18,0.12);display:flex;align-items:center;justify-content:center;color:${badgeColor};font-size:11px;font-weight:800;padding:0 4px">${label === 'Crush' ? '♥' : label === 'Best Friend' ? '★' : label === 'Teacher' ? 'A' : '•'}</div>
      </div>
      <div style="font-size:11px;font-weight:800;color:${badgeColor};line-height:1;text-transform:uppercase;letter-spacing:.06em;text-align:center">${label}</div>
      <div style="font-size:13px;font-weight:700;color:#1b1815;line-height:1.15;text-align:center">${displayName}</div>
    </button>`;
}

function buildLearnImportantPeopleSection(edu) {
  const slots = buildLearnImportantPeopleSlots(edu);
  return `
    <div style="margin-top:18px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8c8175;margin-bottom:10px">Important People</div>
      <div style="display:flex;gap:10px">
        ${slots.map(buildLearnImportantPersonCard).join('')}
      </div>
    </div>`;
}

function buildLearnHeroWork(edu) {
  return `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">Career</div>
    <div style="font-family:var(--mono);font-size:44px;font-weight:500;letter-spacing:-.03em;line-height:1;color:#fff">${STATE.career.job}</div>
    <div style="font-size:12px;opacity:.45;color:#fff;margin-top:2px">${fmtMoney(STATE.finances.income)} / year</div>`;
}

function buildWorkHeader() {
  return `
    <div class="jobs-header">
      <button class="jobs-back" onclick="closeJobBoard()">‹</button>
      <div class="jobs-header-main">
        <div class="jobs-header-icon">
          <iconify-icon icon="mdi:briefcase-outline" style="font-size:26px;color:#fff"></iconify-icon>
        </div>
        <div class="jobs-header-copy">
          <div class="jobs-kicker">Work</div>
          <div class="jobs-title">Apply for Jobs</div>
          <div class="jobs-subtitle">Find work, earn money, and start your adult life.</div>
        </div>
      </div>
    </div>`;
}

function buildWorkHomeHero() {
  const degree = getDegreeCourse();
  if (degree) {
    return `
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">Career</div>
      <div style="font-family:var(--mono);font-size:32px;font-weight:500;letter-spacing:-.03em;line-height:1;color:#fff">${degree} Graduate</div>
      <div style="font-size:12px;opacity:.65;color:#fff;margin-top:8px">Your degree opens some doors, but it does not decide your whole life.</div>`;
  }
  return buildLearnHeroPostSchool();
}

function buildWorkCategoryTabs() {
  const tabs = [
    { label:'Full-Time Jobs', icon:'mdi:office-building-outline', id:'full-time' },
    { label:'Part-Time Jobs', icon:'mdi:coffee-outline', id:'part-time' },
    { label:'Freelance', icon:'mdi:laptop', active:false },
    { label:'Military', icon:'mdi:shield-outline', active:false },
  ];
  return `
    <div class="job-tabs">
      ${tabs.map(tab => `
        <button class="job-tab ${tab.id === _jobBoardCategory ? 'active' : ''}" onclick="${tab.id ? `openJobBoard('${tab.id}')` : `showToast('${tab.label} coming soon.')`}">
          <iconify-icon icon="${tab.icon}"></iconify-icon>
          <span>${tab.label}</span>
        </button>
      `).join('')}
    </div>`;
}

function buildPartTimeJobRow(job, index) {
  return `
    <button class="job-row" onclick="openJobDetail(${index}, 'part-time')">
      <div class="job-row-art">
        <iconify-icon icon="${job.icon}" style="color:${job.accent}"></iconify-icon>
      </div>
      <div class="job-row-copy">
        <div class="job-row-title">${job.title}</div>
        <div class="job-row-company">${job.companyName}</div>
        <div class="job-row-pay">${job.payLabel}</div>
      </div>
      <div class="job-row-cta">›</div>
    </button>`;
}

function buildFullTimeJobRow(job, index) {
  return `
    <button class="job-row" onclick="openJobDetail(${index}, 'full-time')">
      <div class="job-row-art">
        <iconify-icon icon="${job.icon}" style="color:${job.accent}"></iconify-icon>
      </div>
      <div class="job-row-copy">
        <div class="job-row-title">${job.title}</div>
        <div class="job-row-meta">${job.companyName} • ${job.payLabel}</div>
        ${job.locked ? `<div style="font-size:11px;font-weight:700;color:#b05e53;margin-top:4px">${job.lockReasons[0]}</div>` : ''}
      </div>
      <div class="job-row-cta">${job.locked ? '🔒' : '›'}</div>
    </button>`;
}

function buildWorkJobBoard() {
  const isFullTime = _jobBoardCategory === 'full-time';
  const jobs = isFullTime ? getFullTimeJobs() : getPartTimeJobs();
  return `
    <div class="jobs-board">
      ${buildWorkHeader()}
      ${buildWorkCategoryTabs()}
      <div class="jobs-list">
        ${(isFullTime ? jobs.map(buildFullTimeJobRow) : jobs.map(buildPartTimeJobRow)).join('')}
      </div>
      <div class="job-board-footer">${isFullTime ? (getDegreeCourse() ? `${getDegreeCourse()} gives you a slight edge here, but not a guaranteed path.` : 'No degree locks you out of some paths, but plenty of scalable routes are still open.') : 'Quick part-time picks for earning money fast.'}</div>
    </div>`;
}

function buildLearnHeroPostSchool() {
  const application = STATE.school.postSchool?.uniApplication;
  const status = application?.status === 'pending'
    ? `Waiting for ${formatUniversityType(application.uniType)} results`
    : 'Choose your next step';
  return `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">School Finished</div>
    <div style="font-family:var(--mono);font-size:34px;font-weight:500;letter-spacing:-.03em;line-height:1;color:#fff">What next?</div>
    <div style="font-size:12px;opacity:.65;color:#fff;margin-top:8px">${status}</div>`;
}

function buildLearnHeroPreschool(edu) {
  const levelLabels = { pre:'Pre-School', primary:'Primary School', secondary:'Secondary School', college:'Sixth Form / College', uni:'University', finished_school:'School Complete' };
  const notStarted = STATE.age < 5;
  return `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">Education</div>
    <div style="font-family:var(--mono);font-size:${notStarted ? '28px' : '44px'};font-weight:500;letter-spacing:${notStarted ? '-.02em' : '-.03em'};line-height:1;color:#fff">${notStarted ? 'Not yet started' : (levelLabels[edu.level] || '—')}</div>
    <div style="font-size:12px;opacity:.45;color:#fff;margin-top:2px">${notStarted ? 'School begins at age 5 in the UK.' : (edu.current || '')}</div>`;
}

function buildWorkHomeActions() {
  const application = STATE.school.postSchool?.uniApplication;
  const pending = application?.status === 'pending';
  const graduated = isGraduate();
  const showFurtherEducation = graduated;
  const lawMastersDone = hasFurtherEducation('Law Masters');
  const lawMastersCurrent = ensureFurtherEducationState().current?.id === 'Law Masters';
  return `
    <div class="actions-section">
      ${showFurtherEducation ? `
      <button onclick="openFurtherEducation()"
        style="width:100%;padding:14px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:800;color:var(--text);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <span>Further Education</span><span>${lawMastersDone ? 'Completed' : lawMastersCurrent ? 'Studying' : '›'}</span>
      </button>` : ''}
      ${graduated ? '' : `
      <button onclick="${pending ? '' : 'openUniApplication()'}"
        style="width:100%;padding:14px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:800;color:var(--text);display:flex;justify-content:space-between;align-items:center;opacity:${pending ? '.6' : '1'};cursor:${pending ? 'default' : 'pointer'}">
        <span>Apply to University</span><span>${pending ? 'Pending' : '›'}</span>
      </button>`}
      <button onclick="openJobBoard('full-time')"
        style="width:100%;padding:14px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:800;color:var(--text);display:flex;justify-content:space-between;align-items:center;margin-top:10px;cursor:pointer">
        <span>Apply to Jobs</span><span>›</span>
      </button>
    </div>`;
}

function buildLearnClassmateRow(c) {
  const traits = (c.traits || []).slice(0, 2).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}" style="font-size:10px;padding:3px 8px">${t.label}</span>`;
  }).join('');
  return `
    <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:0">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:transparent;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
          ${getCharacterHTML(c.appearance, STATE.age, 40, { showBg: false })}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;${isClassmateCrush(c) ? 'color:#db2777' : ''}">${classmateDisplayName(c)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:1px">${c.status === 'friend' ? 'Friend' : 'Classmate'}</div>
          ${traits ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${traits}</div>` : ''}
          <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
            <div style="flex:1;height:4px;background:var(--surface-mid);border-radius:99px;overflow:hidden">
              <div style="width:${clamp(c.relationship)}%;height:100%;background:#22c55e;border-radius:99px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:10px;color:var(--text-faint)">${c.relationship}%</span>
          </div>
        </div>
        <button onclick="event.stopPropagation();openLearnClassmateDetail('${c.id}')"
          style="width:38px;height:38px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:22px;font-weight:800;color:#5f5145">›</button>
      </div>
    </div>`;
}

function buildClassmateVipButton(c) {
  const active = isClassmateVip(c.id);
  return `
    <button type="button" data-classmate-vip-button="${c.id}" onclick="toggleClassmateVip('${c.id}')"
      style="width:100%;padding:12px 14px;border-radius:14px;border:1px solid ${active ? '#efb7c9' : '#ddd2c6'};background:${active ? '#fff1f6' : '#fffaf2'};box-shadow:${active ? '0 8px 18px rgba(201,95,134,.14)' : 'none'};font-size:13px;font-weight:800;color:${active ? '#c95f86' : '#7b6b5f'};cursor:pointer;transition:background .2s,border-color .2s,color .2s,box-shadow .2s,transform .16s">
      ${active ? 'VIP added' : 'Add to VIP list'}
    </button>`;
}

function buildLearnClassmateDetailScreen(c) {
  const traits = (c.traits || []).slice(0, 3).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}" style="font-size:10px;padding:3px 8px">${t.label}</span>`;
  }).join('');
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="closeLearnClassmateDetail()"
          style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
          <span style="font-size:18px;line-height:1">‹</span>
          <span>Back</span>
        </button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Classmate</div>
        <button onclick="openPersonSheet('${c.id}','classmate')"
          style="width:36px;height:36px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildDotsIcon()}</button>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:18px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:12px">
        <div style="width:64px;height:64px;border-radius:50%;background:transparent;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
          ${getCharacterHTML(c.appearance, STATE.age, 64, { showBg: false })}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:800;color:var(--text);line-height:1.1;${isClassmateCrush(c) ? 'color:#db2777' : ''}">${classmateDisplayName(c)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${c.status === 'friend' ? 'Friend' : 'Classmate'}</div>
          ${traits ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${traits}</div>` : ''}
          <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
            <div style="flex:1;height:6px;background:var(--surface-mid);border-radius:99px;overflow:hidden">
              <div style="width:${clamp(c.relationship)}%;height:100%;background:#22c55e;border-radius:99px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint);font-weight:700">${c.relationship}%</span>
          </div>
        </div>
      </div>
      <div style="margin-bottom:16px">${buildClassmateVipButton(c)}</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8c8175;margin-bottom:10px">Interactions</div>
      ${buildLearnClassmateActions(c)}
    </div>`;
}

function buildLearnTeacherRow(t) {
  return `
    <div onclick="openPersonSheet('${t.id}','Teacher')" style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer">
      <div style="width:40px;height:40px;border-radius:50%;background:transparent;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
        ${getCharacterHTML(t.appearance, 35, 40, { showBg: false })}
      </div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700">${t.title} ${t.surname}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${t.subject}</div>
      </div>
    </div>`;
}

function buildLearnToggleSection(id, label, contentHTML) {
  return `
    <div class="${id}-section">
      <button onclick="toggleLearnSection('${id}-inner')"
        style="width:100%;padding:13px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:700;color:var(--text);display:flex;justify-content:space-between;align-items:center">
        <span>${label}</span><span>›</span>
      </button>
      <div id="${id}-inner" style="display:none;margin-top:8px;flex-direction:column;gap:8px">
        ${contentHTML}
      </div>
    </div>`;
}

let _learnScreen = 'main';

function openLearnClassmatesScreen() {
  _learnScreen = 'classmates';
  _learnClassmateId = null;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeLearnClassmatesScreen() {
  _learnScreen = 'main';
  _learnClassmateId = null;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function renderLearnTab() {
  const age = STATE.age, edu = STATE.school;
  const notStartedSchool = age < 5;
  const isPostSchoolPlanning = age >= 18 && edu.level === 'finished_school';
  const isGraduatePlanning = age >= 18 && edu.level === 'graduated';
  const isEmployed = age >= 18 && STATE.career?.job && STATE.career.job !== 'None' && edu.level !== 'uni';
  if (_learnScreen === 'classmates' && !(age >= 5 && age <= 18 && edu.classmates.length)) {
    _learnScreen = 'main';
  }
  if (_learnScreen === 'classmate' && !edu.classmates.some(c => c.id === _learnClassmateId)) {
    _learnScreen = age >= 5 && age <= 18 && edu.classmates.length ? 'classmates' : 'main';
    _learnClassmateId = null;
  }
  const grade       = (age >= 5 && age <= 18) ? gradeFromScore(edu.gradeScore) : null;
  const avgScore    = edu.classmates.length
    ? Math.round(edu.classmates.reduce((s, c) => s + c.gradeScore, 0) / edu.classmates.length)
    : edu.gradeScore;
  const avgGrade      = gradeFromScore(avgScore);
  const gradeAboveAvg = grade && edu.gradeScore >= avgScore;

  // ── Hero card ─────────────────────────────────────────
  const tab = document.getElementById('tab-learn');
  const hero = document.querySelector('#tab-learn .hub-hero');
  const gradeBlockWrap = document.getElementById('grade-block-wrap');
  const rosterToggleWrap = document.getElementById('roster-toggle-wrap');
  const sectionTitle = document.getElementById('learn-section-title');
  const learnActions = document.getElementById('learn-actions');
  const container = learnActions.parentElement;
  const existingClassmatesScreen = document.getElementById('learn-classmates-screen');
  if (existingClassmatesScreen) existingClassmatesScreen.remove();
  const existingClassmateDetailScreen = document.getElementById('learn-classmate-detail-screen');
  if (existingClassmateDetailScreen) existingClassmateDetailScreen.remove();
  container.querySelectorAll('.uni-apply-screen').forEach(el => el.remove());

  if (isPostSchoolPlanning) {
    hero.style.background = 'linear-gradient(135deg, #485563, #29323c)';
    hero.style.border = '1px solid rgba(255,255,255,.16)';
    hero.innerHTML = buildLearnHeroPostSchool();
  } else if (isGraduatePlanning) {
    hero.style.background = 'linear-gradient(135deg, #485563, #29323c)';
    hero.style.border = '1px solid rgba(255,255,255,.16)';
    hero.innerHTML = buildWorkHomeHero();
  } else if (edu.level === 'uni') {
    ensureUniversityState();
    hero.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(247,243,252,0.99))';
    hero.style.border = '1px solid rgba(221,212,232,0.95)';
    hero.innerHTML = buildUniversityHeroCard();
  } else if (grade) {
    hero.style.background = edu.level === 'primary'
      ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,243,238,0.98))'
      : '#fef9c3';
    hero.style.border     = edu.level === 'primary'
      ? '1px solid rgba(218, 208, 197, 0.9)'
      : '1px solid #fde047';
    hero.innerHTML = buildLearnHeroSchool(edu, grade, avgGrade, gradeAboveAvg);
  } else {
    hero.style.background = '';
    hero.style.border     = '';
    hero.innerHTML = buildLearnHeroPreschool(edu);
  }

  // ── Performance strip ─────────────────────────────────
  gradeBlockWrap.innerHTML = edu.level === 'uni'
    ? `${buildUniversityPerformanceSection()}${buildUniversityImportantPeopleSection()}`
    : (!isPostSchoolPlanning && !isGraduatePlanning && grade ? `${buildLearnPerformanceSection(edu, grade)}${buildLearnImportantPeopleSection(edu)}` : '');

  // ── Roster toggle ─────────────────────────────────────
  rosterToggleWrap.style.display =
    (edu.level !== 'uni' && age >= 5 && age <= 18 && edu.classmates.length) ? 'block' : 'none';

  // ── Dynamic sections: clear and rebuild ───────────────
  container.querySelectorAll('.actions-section, .cm-section, .tch-section').forEach(el => el.remove());
  sectionTitle.style.display = 'none';
  learnActions.innerHTML = '';

  if (isEmployed) {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildEmployedCareerPage();
    return;
  }

  if (_learnScreen === 'jobsBoard') {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildWorkJobBoard();
    return;
  }

  if (_learnScreen === 'classmates') {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = 'none';
    const classmatesScreen = document.createElement('div');
    classmatesScreen.id = 'learn-classmates-screen';
    classmatesScreen.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="closeLearnClassmatesScreen()"
          style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
          <span style="font-size:18px;line-height:1">‹</span>
          <span>Back</span>
        </button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Classmates</div>
        <div style="font-size:12px;font-weight:700;color:var(--text-faint)">${edu.classmates.length}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${edu.classmates.map(c => buildLearnClassmateRow(c)).join('')}
      </div>`;
    container.appendChild(classmatesScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  if (_learnScreen === 'classmate') {
    const classmate = edu.classmates.find(c => c.id === _learnClassmateId);
    if (!classmate) return;
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = 'none';
    const classmateDetailScreen = document.createElement('div');
    classmateDetailScreen.id = 'learn-classmate-detail-screen';
    classmateDetailScreen.innerHTML = buildLearnClassmateDetailScreen(classmate);
    container.appendChild(classmateDetailScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  if (_learnScreen === 'uniApplyBasics' || _learnScreen === 'uniApplyType' || _learnScreen === 'uniApplyPreview') {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = 'none';
    const uniApplyScreen = document.createElement('div');
    uniApplyScreen.className = 'uni-apply-screen';
    uniApplyScreen.innerHTML = buildUniApplicationScreen();
    container.appendChild(uniApplyScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  if (_learnScreen === 'furtherEducation') {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = 'none';
    const furtherEducationScreen = document.createElement('div');
    furtherEducationScreen.className = 'uni-apply-screen';
    furtherEducationScreen.innerHTML = buildFurtherEducationScreen();
    container.appendChild(furtherEducationScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  hero.style.display = '';
  gradeBlockWrap.style.display = '';
  rosterToggleWrap.style.display =
    (edu.level !== 'uni' && age >= 5 && age <= 18 && edu.classmates.length) ? 'block' : 'none';
  learnActions.style.display = '';

  // Actions
  if (isPostSchoolPlanning || isGraduatePlanning) {
    const postSchoolWrapper = document.createElement('div');
    postSchoolWrapper.className = 'actions-section';
    postSchoolWrapper.innerHTML = buildWorkHomeActions();
    container.appendChild(postSchoolWrapper);
    return;
  }

  if (edu.level === 'uni') {
    const uniWrapper = document.createElement('div');
    uniWrapper.className = 'actions-section';
    uniWrapper.innerHTML = buildUniversityLifeSection();
    container.appendChild(uniWrapper);
    return;
  }

  if (!notStartedSchool && edu.level !== 'uni') {
    const acts = EDUCATION_ACTIONS;
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'actions-section';
    actionsWrapper.innerHTML = buildLearnToggleSection(
      'actions',
      '⚡ Actions',
      `<div class="action-list" id="learn-actions-inner">${acts.map(a => buildActionHTML(a)).join('')}</div>`
    );
    container.appendChild(actionsWrapper);
    wireActions(actionsWrapper.querySelector('#learn-actions-inner'), acts, () => { updateAllUI(); renderLearnTab(); });
  }

  // Classmates
  if (age >= 5 && age <= 18 && edu.classmates.length) {
    const cmWrapper = document.createElement('div');
    cmWrapper.className = 'cm-section';
    cmWrapper.innerHTML = `
      <button onclick="openLearnClassmatesScreen()"
        style="width:100%;padding:13px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:700;color:var(--text);display:flex;justify-content:space-between;align-items:center">
        <span>👥 Classmates (${edu.classmates.length})</span><span>›</span>
      </button>`;
    container.appendChild(cmWrapper);
  }

  // Teachers
  if (edu.teachers && edu.teachers.length) {
    const tchWrapper = document.createElement('div');
    tchWrapper.className = 'tch-section';
    tchWrapper.innerHTML = buildLearnToggleSection(
      'tch',
      '👩‍🏫 Teachers',
      edu.teachers.map(t => buildLearnTeacherRow(t)).join('')
    );
    container.appendChild(tchWrapper);
  }
}

function toggleLearnSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none' && el.style.display !== '';
  el.style.display = isOpen ? 'none' : 'flex';
}

let _rosterOpen = false;
function toggleRoster() {
  _rosterOpen = !_rosterOpen;
  document.getElementById('roster-panel').style.display = _rosterOpen ? 'block' : 'none';
  document.getElementById('roster-toggle-arrow').textContent = _rosterOpen ? '∨' : '›';
  if (_rosterOpen) renderRoster();
}
function renderRoster() {
  const snapshot = STATE.school.rosterSnapshot;
  if (!snapshot.length) return;
  document.getElementById('roster-list').innerHTML = snapshot.map((p, i) => `
    <div class="roster-row ${p.isPlayer ? 'is-player' : ''}">
      <div class="roster-rank">${i+1}</div>
      <div class="roster-emoji" style="overflow:hidden;border-radius:50%;background:${p.isPlayer?'var(--surface-mid)':'transparent'}">${getCharacterHTML(p.appearance, STATE.age, 28, { showBg:!!p.isPlayer })}</div>
      <div class="roster-name">${p.firstName} ${p.surname}${p.isPlayer?' (you)':''}</div>
      <div class="roster-grade-bar"><div class="roster-grade-fill" style="width:${p.gradeScore}%;background:${gradeColor(p.grade)}"></div></div>
      <div class="roster-grade" style="color:${gradeColor(p.grade)}">${p.grade}</div>
    </div>`).join('');
}

// ── IDENTITY SHEET ────────────────────────────────────────
function openIdentitySheet() {
  const s = STATE;
  const revealedCount = Math.max(1, Math.min(3, s.revealedTraitCount || 1));
  const traits = s.traits.map((tid, i) => {
    const t = PLAYER_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    return i < revealedCount
      ? `<span class="trait-pill player">${t.emoji} ${t.label}</span>`
      : `<span class="trait-pill">???</span>`;
  }).join('');
  document.getElementById('identity-inner').innerHTML = `
    <div class="identity-section">
      <div style="font-size:40px;text-align:center">${getStage(s.age).emoji}</div>
      <div class="identity-big-name">${s.fullName}</div>
      <div class="backstory-meta">
        <span class="badge badge-age">Age ${s.age}</span>
        <span class="badge badge-stage">${getStage(s.age).label}</span>
        <span class="badge badge-sign">${s.starSign.symbol} ${s.starSign.sign}</span>
        <span class="badge badge-class">${s.socialClassLabel}</span>
      </div>
      <div class="identity-text">${MONTHS[s.birthday.month-1]} ${ordinal(s.birthday.day)} · ${s.city.region}</div>
      <div class="identity-text">${s.sexualityConfirmed ? `Into: ${s.sexuality}` : 'Into: still figuring it out'}</div>
    </div>
    <div class="section-title">Your Traits</div>
    <div class="trait-pills">${traits}</div>
    <div class="section-title">Your Story</div>
    <div class="identity-text" id="identity-backstory-text">Loading...</div>`;
  if (_birthData && _birthData.situation) {
    const parentDesc = SITUATION_TEXT[_birthData.situation]();
    document.getElementById('identity-backstory-text').textContent =
      `Born on the ${ordinal(s.birthday.day)} of ${MONTHS[s.birthday.month-1]} in ${s.city.name}, ${s.city.vibe}. ${parentDesc}`;
  }
  document.getElementById('identity-overlay').classList.add('open');
}
function closeIdentity() {
  document.getElementById('identity-overlay').classList.remove('open');
}

// ── FINANCE SHEET ─────────────────────────────────────────
function openFinanceSheet() {
  const f   = STATE.finances;
  const tax = Math.round(f.income * 0.2);
  const net = f.income - tax - f.expenses;
  document.getElementById('finance-inner').innerHTML = `
    <div class="hub-hero">
      <div class="hub-hero-label">Net Worth</div>
      <div class="hub-hero-val">${fmtMoney(f.balance)}</div>
      <div class="hub-hero-sub">${net >= 0 ? '+' : ''}${fmtMoney(net)} / year net</div>
    </div>
    <div class="section-title">Annual Breakdown</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Income (${f.job||'None'})</span><span class="detail-val pos">+${fmtMoney(f.income)}</span></div>
      <div class="detail-row"><span class="detail-label">Tax (~20%)</span><span class="detail-val neg">-${fmtMoney(tax)}</span></div>
      <div class="detail-row"><span class="detail-label">Housing</span><span class="detail-val neg">-${fmtMoney(f.expenses)}</span></div>
      <div class="detail-row total"><span class="detail-label">Net / year</span><span class="detail-val bold">${net >= 0 ? '+' : ''}${fmtMoney(net)}</span></div>
    </div>`;
  document.getElementById('finance-overlay').classList.add('open');
}
function closeFinanceSheet() {
  document.getElementById('finance-overlay').classList.remove('open');
}

// ── MILESTONE ─────────────────────────────────────────────
let _pendingAfterMilestone = null;
function showMilestone(m, onClose) {
  _pendingAfterMilestone = onClose;
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">${m.emoji}</div>
    <div class="milestone-title">${m.title}</div>
    <div class="milestone-body">${m.body}</div>
    <button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}
function showSchoolFinishedTransition(onClose) {
  const postSchool = ensurePostSchoolState();
  postSchool.schoolFinishedShown = true;
  _pendingAfterMilestone = onClose;
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">🎓</div>
    <div class="milestone-title">School Finished</div>
    <div class="milestone-body">Your final year of school has come to an end.<br><br>What do you want to do next? You can apply to university, apply for jobs or figure things out.</div>
    <button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}
function showUniversityAdmissionResult(result, onClose) {
  const application = STATE.school.postSchool?.uniApplication;
  if (!application || !result) return;
  _pendingAfterMilestone = onClose;
  let body = '';
  let actions = '';
  if (result.outcome === 'accepted') {
    body = `You've been offered a place to study ${application.course} at ${formatUniversityType(application.uniType)}.`;
    actions = `<button class="continue-btn" onclick="acceptUniversityOffer('${application.uniType}')">Accept place →</button>`;
  } else if (result.outcome === 'fallback_offer') {
    body = `Unfortunately, your application to ${formatUniversityType(application.uniType)} was unsuccessful, but ${formatUniversityType(result.offeredType)} has offered you a place.`;
    actions = `
      <button class="continue-btn" onclick="acceptUniversityOffer('${result.offeredType}')">Accept place →</button>
      <button class="birth-btn secondary" onclick="rejectUniversityOffer()">Reject offer</button>`;
  } else {
    body = `Unfortunately, your application to ${formatUniversityType(application.uniType)} was unsuccessful.`;
    actions = `<button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  }
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">${result.outcome === 'accepted' ? '🎉' : '🎓'}</div>
    <div class="milestone-title">${result.outcome === 'accepted' ? 'Accepted' : 'Rejected'}</div>
    <div class="milestone-body">${body}</div>
    ${actions}`;
  document.getElementById('milestone-overlay').classList.add('open');
}
function closeMilestone() {
  document.getElementById('milestone-overlay').classList.remove('open');
  if (_pendingAfterMilestone) {
    _pendingAfterMilestone();
    _pendingAfterMilestone = null;
  }
}
function showResultsDay() {
  const score    = STATE.school.gradeScore;
  const subjects = [
    { name:'Mathematics',       emoji:'📐' },
    { name:'English Language',  emoji:'📖' },
    { name:'English Literature',emoji:'📚' },
    { name:'Biology',           emoji:'🔬' },
    { name:'Chemistry',         emoji:'⚗️' },
    { name:'Physics',           emoji:'🔭' },
    { name:'History',           emoji:'🏛️' },
    STATE.traits.includes('creative')    ? { name:'Art & Design',     emoji:'🎨' } :
    STATE.traits.includes('intelligent') ? { name:'Computer Science', emoji:'💻' } :
    STATE.traits.includes('ambitious')   ? { name:'Business Studies', emoji:'💼' } :
                                           { name:'Geography',        emoji:'🌍' },
  ];
  const grades = subjects.map(s => ({
    ...s, grade: gradeFromScore(clamp(score + Math.floor(Math.random()*20) - 10, 0, 100)),
  }));
  STATE.school.gcsResults = grades;
  _pendingAfterMilestone = () => {
    if (!STATE.sexualityConfirmed) {
      const identityEvent = EVENTS.find(e => e.id === 'identity_check_in');
      if (identityEvent) {
        setTimeout(() => openEvent(identityEvent), 100);
        return;
      }
    }
    const ev = pickEvent();
    if (ev) setTimeout(() => openEvent(ev), 100);
  };
  document.getElementById('milestone-inner').innerHTML = `
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint)">Age 16 · Results Day</div>
    <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1">Your results are in.</div>
    <div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px 20px;text-align:left;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border-light)">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint);margin-bottom:4px">National Examination Board</div>
        <div style="font-size:18px;font-weight:800;letter-spacing:-.02em">${STATE.fullName}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${STATE.school.current}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0">
        ${grades.map((s, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:${i<grades.length-1?'1px solid var(--border-light)':'none'};animation:fadeIn .3s ease ${i*0.08}s both">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:16px">${s.emoji}</span>
              <span style="font-size:13px;font-weight:600;color:var(--text-muted)">${s.name}</span>
            </div>
            <span style="font-size:18px;font-weight:800;color:${gradeColor(s.grade)}">${s.grade}</span>
          </div>`).join('')}
      </div>
    </div>
    <button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}

// ── PET NAMING ────────────────────────────────────────────
let _pendingPetData = null;
function openPetNaming(petType, petEmoji, onNamed) {
  _pendingPetData = { petType, petEmoji, onNamed };
  const suggestedName = pickRandom(NAMES_UK.petNames);
  document.getElementById('pet-inner').innerHTML = `
    <div class="milestone-emoji">${petEmoji}</div>
    <div class="milestone-title">What will you name them?</div>
    <input class="pet-name-input" id="pet-name-input" type="text" placeholder="${suggestedName}" value="${suggestedName}" maxlength="20"/>
    <button class="birth-btn secondary" onclick="document.getElementById('pet-name-input').value='${pickRandom(NAMES_UK.petNames)}'">↺ Suggest another name</button>
    <button class="birth-btn" onclick="confirmPetName()">That's their name →</button>`;
  document.getElementById('pet-overlay').classList.add('open');
}
function confirmPetName() {
  const name = document.getElementById('pet-name-input').value.trim() || pickRandom(NAMES_UK.petNames);
  document.getElementById('pet-overlay').classList.remove('open');
  if (_pendingPetData && _pendingPetData.onNamed) _pendingPetData.onNamed(name);
  _pendingPetData = null;
}

// ── EVENT OVERLAY ─────────────────────────────────────────
function openEvent(ev) {
  document.getElementById('event-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:8px 0 4px">
      <div style="width:72px;height:72px;border-radius:20px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:36px">
        ${ev.icon || '✨'}
      </div>
      <div class="event-cat">${ev.category}</div>
      <div style="font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.15">${ev.title||''}</div>
    </div>
    <div style="font-size:15px;color:var(--text-muted);line-height:1.6;font-weight:500">${ev.text}</div>
    <div class="choices" id="choices-list"></div>`;
  ev.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span>${c.text}</span><span class="choice-arrow">›</span>`;
    btn.onclick   = () => handleChoice(ev, c);
    document.getElementById('choices-list').appendChild(btn);
  });
  document.getElementById('event-overlay').classList.add('open');
}
function handleChoice(ev, choice) {
  const effects    = choice.effects || {};
  const totalDelta = Object.values(effects).reduce((s, v) => s + v, 0);
  applyEffects(effects);
  if (choice.onChoose) choice.onChoose();
  STATE.usedEvents.push(ev.id);
  logActivity(choice.log || choice.text, totalDelta);
  if (choice.classmateEffect) {
    STATE.school.classmates.forEach(cm => {
      cm.relationship = clamp(cm.relationship + (choice.classmateEffect.all||0) + Math.floor(Math.random()*6));
    });
    if (choice.autoFriendCheck) {
      const best = STATE.school.classmates
        .filter(c => c.status === 'classmate')
        .sort((a,b) => b.compatibility - a.compatibility)[0];
      if (best && STATE.traits.includes('charismatic') && best.compatibility >= 70) {
        best.status = 'friend';
        STATE.relationships.friends = clamp(STATE.relationships.friends + 15);
        logActivity(`${best.firstName} became your first friend 🎉`, 10);
      }
    }
  }
  if (choice.petAdopt) {
    closeEventOverlay();
    openPetNaming(choice.petType||'dog', choice.petEmoji||'🐕', name => {
      const deathAges = { dog:13, cat:16, rabbit:9, hamster:3 };
      STATE.family.pets.push({
        id:uid(), name, type:choice.petType||'dog', emoji:choice.petEmoji||'🐕',
        happiness:80, health:90, age:0, deathAge:deathAges[choice.petType]||12, fedThisYear:false,
      });
      logActivity(`Adopted ${name} the ${choice.petType||'dog'} 🐾`, 10);
      showOutcome(choice, totalDelta);
    });
    return;
  }
  showOutcome(choice, totalDelta);
  updateAllUI();
}
function showOutcome(choice, totalDelta) {
  const labels = {
    happy:'Happiness', health:'Health', smarts:'Smarts', looks:'Looks',
    balance:'Wealth', income:'Income', rep:'Reputation',
    rel_family:'Family', rel_friends:'Friends', gradeScore:'Grades',
  };
  const effects = choice.effects || {};
  const outcomeText = choice.getOutcome ? choice.getOutcome() : (choice.outcome || choice.log);
  document.getElementById('event-inner').innerHTML = `
    <div class="outcome-text">${outcomeText}</div>
    <div class="effects-row">${Object.entries(effects)
      .filter(([k]) => !['income','expenses'].includes(k))
      .map(([k,v]) => `<span class="effect-chip ${v>=0?'pos':'neg'}">${labels[k]||k} ${v>0?'+':''}${v}</span>`)
      .join('')}
    </div>
    <button class="continue-btn" onclick="closeEventOverlay();updateAllUI()">Continue →</button>`;
  updateAllUI();
}

// ── GAME LOOP ─────────────────────────────────────────────
document.getElementById('age-up-btn').addEventListener('click', () => {
  STATE.age += 1;
  const alive = annualTick();
  if (!alive) {
    showToast(`${STATE.firstName} lived to ${STATE.age}. ✦`);
    document.getElementById('age-up-btn').disabled   = true;
    document.getElementById('age-up-btn').textContent = '✦ Life Complete';
    updateAllUI();
    return;
  }
  updateAllUI();
  saveGame();
  const postSchool = ensurePostSchoolState();
  const admissionResult = resolveUniversityApplication();
  if (admissionResult) {
    showUniversityAdmissionResult(admissionResult, () => {
      const ev = pickEvent();
      if (ev) setTimeout(() => openEvent(ev), 200);
    });
    saveGame();
    return;
  }
  if (STATE.age === 18 && STATE.school.level === 'finished_school' && !postSchool.schoolFinishedShown) {
    showSchoolFinishedTransition(() => {
      const ev = pickEvent();
      if (ev) setTimeout(() => openEvent(ev), 200);
    });
    saveGame();
    return;
  }
  if (STATE.pendingMilestone) {
    const pending = STATE.pendingMilestone;
    STATE.pendingMilestone = null;
    showMilestone(pending, () => {
      const ev = pickEvent();
      if (ev) setTimeout(() => openEvent(ev), 200);
    });
    saveGame();
    return;
  }
  const milestone = checkMilestone();
  if (milestone) {
    showMilestone(milestone, () => {
      if (STATE.age === 16) {
        setTimeout(() => showResultsDay(), 200);
      } else {
        const ev = pickEvent();
        if (ev) setTimeout(() => openEvent(ev), 200);
      }
    });
  } else {
    const ev = pickEvent();
    if (ev) setTimeout(() => openEvent(ev), 100);
  }
});

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── INIT ──────────────────────────────────────────────────
initBirth();
