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
    if (typeof ensureEducationState === 'function') ensureEducationState();
    if (typeof ensureNpcSystemState === 'function') ensureNpcSystemState();
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
  saveGame();
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
  if (typeof ensureHomeState === 'function') ensureHomeState();
  if (tab !== 'learn') {
    _learnScreen = 'main';
    _learnClassmateId = null;
  }
  if (tab === 'activities') {
    window._playSubTab = null;
    window._homeView = null;
    window._datingView = null;
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
  if (tab === 'activities') renderActivitiesTab();
}

// ── LIFE TAB ──────────────────────────────────────────────
function updateAllUI() {
  if (typeof ensureHomeState === 'function') ensureHomeState();
  if (typeof ensureNpcSystemState === 'function') ensureNpcSystemState();
  ensureRelationshipOrderState();
  updateLifeTab();
  updateNavLearnLabel();
  if (_currentTab === 'family') renderFamilyTab();
  if (_currentTab === 'learn')  renderLearnTab();
  if (_currentTab === 'activities') renderActivitiesTab();
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
  const peopleUpdates = STATE.npc?.annualUpdates || [];
  if (!STATE.activity.length && !peopleUpdates.length) {
    list.innerHTML = '<div class="activity-empty">Nothing yet. Your life is just beginning.</div>';
    return;
  }
  const grouped = new Map();
  STATE.activity.slice(0, 20).forEach(a => {
    if (!grouped.has(a.age)) grouped.set(a.age, []);
    grouped.get(a.age).push(a);
  });
  const showPeopleBlock = peopleUpdates.length && !peopleUpdates.every(text =>
    (STATE.activity || []).some(entry => entry.age === STATE.age && entry.text === text)
  );
  const peopleBlock = showPeopleBlock ? `
    <div class="life-log-divider">People Updates</div>
    ${peopleUpdates.map(text => `
      <div class="life-log-item">
        <div class="life-log-body">
          <div class="life-log-text">${text}</div>
        </div>
      </div>`).join('')}
  ` : '';
  list.innerHTML = `${peopleBlock}${Array.from(grouped.entries()).map(([age, entries]) => `
    <div class="life-log-divider">Age ${age}</div>
    ${entries.map(a => `
      <div class="life-log-item">
        <div class="life-log-body">
          <div class="life-log-text">${a.text}</div>
        </div>
      </div>`).join('')}
  `).join('')}`;
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
  document.getElementById('family-tab-bar').innerHTML = ['Children','Family','Partner','Friends','Quick Contact']
    .map((label, i) => {
      const key = ['children','family','partner','friends','quick'][i];
      return `<button class="family-subtab ${currentSubTab === key ? 'active' : ''}" onclick="switchFamilyTab('${key}')">${label}</button>`;
    }).join('');
  if (currentSubTab === 'children') renderFamilyChildren();
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
  if (!Array.isArray(STATE.relationshipOrder.children)) STATE.relationshipOrder.children = [];
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
function getChildrenEntries() {
  return (STATE.romance?.children || []).map(child => ({
    person:child,
    role:child.gender === 'male' ? 'Son' : 'Daughter',
    rel:child.relationship || 70,
    traitPool:CLASSMATE_TRAITS_POOL,
  }));
}
function getFriendEntries() {
  ensurePersistentFriendState();
  const activePartnerId = STATE.romance?.partner?.id || null;
  const liveFriends = STATE.school.classmates.filter(c => c.status === 'friend' && c.id !== activePartnerId);
  liveFriends.forEach(upsertPersistentFriend);
  const merged = STATE.social.friends
    .filter(savedFriend => savedFriend.id !== activePartnerId)
    .map(savedFriend => {
    const liveFriend = STATE.school.classmates.find(c => c.id === savedFriend.id);
    if (!liveFriend) return savedFriend;
    const stableRelationship = typeof getStableFriendRelationship === 'function'
      ? getStableFriendRelationship(liveFriend, savedFriend.relationship ?? savedFriend.friendshipCloseness ?? 60)
      : (savedFriend.relationship ?? liveFriend.relationship ?? 60);
    return {
      ...savedFriend,
      ...liveFriend,
      relationship: stableRelationship,
      friendshipCloseness: stableRelationship,
    };
  });
  merged.forEach(friend => {
    if (typeof normalizeFriendRelationshipState === 'function') normalizeFriendRelationshipState(friend);
  });
  return merged.map(friend => ({
    person:friend,
    role:'Friend',
    rel:(typeof getStableFriendRelationship === 'function'
      ? getStableFriendRelationship(friend, 60)
      : (friend.relationship ?? 60)),
    traitPool:CLASSMATE_TRAITS_POOL,
  }));
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
function renderFamilyChildren() {
  const children = getChildrenEntries();
  if (!children.length) {
    document.getElementById('family-tab-content').innerHTML = buildEmptyState('🧸', 'No children yet.', 'Children will appear here later.');
    return;
  }
  renderRelationshipList('children', 'Children', children);
}

function openDatingInPlay(view = 'hub') {
  window._playSubTab = 'dating';
  window._datingView = view;
  renderActivitiesTab();
}

function askOutKnownPersonUi(personId) {
  const result = attemptDatePerson(personId);
  if (result?.message) showToast(result.message);
  if (result?.ok !== false) {
    saveGame();
    updateAllUI();
    renderFamilyTab();
    renderActivitiesTab();
  }
}

function runRomanceUiAction(action, arg = null) {
  let result = null;
  if (action === 'spend_time') {
    const partner = getCurrentPartner();
    if (!partner) return;
    partner.relationship = clamp((partner.relationship || 60) + 5);
    partner.friendshipCloseness = partner.relationship;
    partner.happiness = clamp((partner.happiness || 50) + 4);
    markNpcInteraction(partner, `Spent time together with ${partner.firstName}.`);
    logActivity(`Spent quality time with ${partner.firstName}.`, 6);
    syncRomanceLegacyFields();
    result = { ok:true, message:`You spent time with ${partner.firstName}.` };
  } else if (action === 'date') {
    const partner = getCurrentPartner();
    if (!partner) return;
    const delta = Math.random() < ((partner.compatibility || 50) / 100) ? 8 : 3;
    partner.relationship = clamp((partner.relationship || 60) + delta);
    partner.friendshipCloseness = partner.relationship;
    applyEffects({ happy:+6 });
    markNpcInteraction(partner, `Went on a date with ${partner.firstName}.`);
    logActivity(`Went on a date with ${partner.firstName}.`, delta);
    syncRomanceLegacyFields();
    result = { ok:true, message:`You went on a date with ${partner.firstName}.` };
  } else if (action === 'serious_talk') {
    const partner = getCurrentPartner();
    if (!partner) return;
    const success = Math.random() < 0.68;
    const delta = success ? 5 : -4;
    partner.relationship = clamp((partner.relationship || 60) + delta);
    partner.friendshipCloseness = partner.relationship;
    applyEffects({ happy: success ? 3 : -3 });
    logActivity(`${success ? 'Had a good serious conversation with' : 'A serious conversation with'} ${partner.firstName}${success ? '.' : ' went badly.'}`, delta);
    syncRomanceLegacyFields();
    result = { ok:true, message: success ? 'That brought you closer.' : 'That was difficult.' };
  } else if (action === 'gift') {
    const partner = getCurrentPartner();
    if (!partner) return;
    if (STATE.finances.balance < 40) result = { ok:false, message:'You cannot afford a gift right now.' };
    else {
      STATE.finances.balance -= 40;
      partner.relationship = clamp((partner.relationship || 60) + 6);
      partner.friendshipCloseness = partner.relationship;
      applyEffects({ happy:+3 });
      logActivity(`Gave ${partner.firstName} a gift.`, 6);
      syncRomanceLegacyFields();
      result = { ok:true, message:`You gave ${partner.firstName} a gift.` };
    }
  } else if (action === 'move_in') {
    result = moveInWithPartner();
  } else if (action === 'propose') {
    result = proposeToPartner();
  } else if (action === 'marry') {
    result = marryPartner(arg || 'registry');
  } else if (action === 'baby') {
    result = tryForBaby();
  } else if (action === 'breakup') {
    result = breakupWithPartner();
  } else if (action === 'divorce') {
    if (!confirm('Are you sure you want to divorce?')) return;
    result = divorcePartner();
  }
  if (result?.message) showToast(result.message);
  if (result?.ok !== false) {
    saveGame();
    updateAllUI();
    renderFamilyTab();
    renderActivitiesTab();
  }
}

function buildPartnerTraits(partner) {
  return (partner.traits || []).slice(0, 3).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.label}</span>`;
  }).join('');
}

function buildPartnerActionButton(label, action, arg = null) {
  const argText = arg !== null ? `,'${arg}'` : '';
  return `<button onclick="runRomanceUiAction('${action}'${argText})" style="width:100%;padding:12px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:12px;font-size:13px;font-weight:700;color:var(--text);text-align:left;cursor:pointer">${label}</button>`;
}

function buildPartnerStatusPanel(partner) {
  const romance = STATE.romance || {};
  const loyaltyBar = clamp(Math.round(((partner.loyalty || 50) * 0.65) + ((partner.kindness || 50) * 0.35)));
  const actions = [
    buildPartnerActionButton('Spend Time Together', 'spend_time'),
    buildPartnerActionButton('Go On Date', 'date'),
    buildPartnerActionButton('Have Serious Conversation', 'serious_talk'),
    buildPartnerActionButton('Give Gift', 'gift'),
  ];
  if (!partner.livingTogether && (partner.relationship || 0) >= 60) actions.push(buildPartnerActionButton('Move In Together', 'move_in'));
  if (romance.status === 'dating' && STATE.age >= 18 && (partner.relationship || 0) >= 75 && (romance.relationshipYears || 0) >= 1) actions.push(buildPartnerActionButton('Propose', 'propose'));
  if (romance.status === 'engaged' && STATE.age >= 18) {
    actions.push(buildPartnerActionButton('Get Married • Registry Office', 'marry', 'registry'));
    actions.push(buildPartnerActionButton('Get Married • Small Wedding', 'marry', 'small'));
    actions.push(buildPartnerActionButton('Get Married • Big Wedding', 'marry', 'big'));
  }
  if (STATE.age >= 18 && ['dating', 'engaged', 'married'].includes(romance.status)) actions.push(buildPartnerActionButton('Try For Baby', 'baby'));
  if (['dating', 'engaged'].includes(romance.status)) actions.push(buildPartnerActionButton('Break Up', 'breakup'));
  if (romance.status === 'married') actions.push(buildPartnerActionButton('Divorce', 'divorce'));

  return `
    <div class="person-card" style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:14px">
        ${buildPersonCardAvatar({ ...partner, _roleCard:'Partner' })}
        <div style="flex:1;min-width:0">
          <div style="font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--text)">${partner.firstName} ${partner.surname || ''}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">Age ${partner.age} • ${partner.job || 'Student'}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${romanceStatusLabel(STATE.romance.status)} • ${partner.compatibility}% compatible</div>
          ${buildPartnerTraits(partner) ? `<div class="trait-pills" style="margin-top:8px">${buildPartnerTraits(partner)}</div>` : ''}
        </div>
        <button onclick="openPersonSheet('${partner.id}','Partner')" style="width:38px;height:38px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildDotsIcon()}</button>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:var(--text-muted)">Relationship</span><span style="font-family:var(--mono);font-size:12px;font-weight:700;color:#d46f8f">${partner.relationship}%</span></div>
        <div style="height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden"><div style="width:${partner.relationship}%;height:100%;background:#e86e95;border-radius:99px"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:var(--text-muted)">Loyalty & Stability</span><span style="font-family:var(--mono);font-size:12px;font-weight:700;color:#74b551">${loyaltyBar}%</span></div>
        <div style="height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden"><div style="width:${loyaltyBar}%;height:100%;background:#74b551;border-radius:99px"></div></div>
      </div>
      ${STATE.romance.pregnancy ? `<div style="font-size:12px;color:var(--text-muted);line-height:1.5">Pregnancy: ongoing • due around age ${STATE.romance.pregnancy.dueAge}</div>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px">${actions.join('')}</div>
    </div>`;
}

function buildExesPanel() {
  const exes = (STATE.romance?.exes || []);
  if (!exes.length) return '';
  return `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-faint)">Exes</div>
      ${exes.map(ex => `
        <div class="person-card" style="display:flex;align-items:center;gap:14px">
          ${buildPersonCardAvatar({ ...ex, _roleCard:'Partner' })}
          <div style="flex:1;min-width:0">
            <div style="font-size:17px;font-weight:800;color:var(--text)">${ex.firstName} ${ex.surname || ''}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${ex.age ? `Age ${ex.age} • ` : ''}${ex.relationshipStatus || ex.maritalStatus || 'Ex'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${compatibilityFor(ex)}% compatible</div>
          </div>
          <button onclick="openPersonSheet('${ex.id}','Partner')" style="width:38px;height:38px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildDotsIcon()}</button>
        </div>
      `).join('')}
    </div>`;
}

function renderFamilyPartner() {
  ensureRomanceState();
  const partner = getCurrentPartner();
  if (!partner) {
    const canDate = STATE.age >= 16;
    document.getElementById('family-tab-content').innerHTML = canDate
      ? `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${buildEmptyState('💑', 'No partner right now.', 'A relationship can start when you are ready.')}
          <div class="person-card" style="display:flex;flex-direction:column;gap:12px">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-faint)">Partner</div>
            <div onclick="openDatingInPlay('app')" style="font-size:16px;font-weight:800;color:var(--text);cursor:pointer">Download Dating App</div>
            <div onclick="openDatingInPlay('known')" style="font-size:16px;font-weight:800;color:var(--text);cursor:pointer">Ask Out Someone You Know</div>
          </div>
          ${buildExesPanel()}
        </div>`
      : `${buildEmptyState('💑', 'No partner yet.', 'Dating opens later.')}${buildExesPanel()}`;
    return;
  }
  document.getElementById('family-tab-content').innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">${buildPartnerStatusPanel(partner)}${buildExesPanel()}</div>`;
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
  if ((person._roleCard === 'Friend' || person._roleCard === 'classmate') && !canRevealClassmateTraits(person)) {
    return '';
  }
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
  const interactionRole = role === 'Roommate' ? 'Friend' : role;
  const actions = getAvailableActions(interactionRole, STATE.age, person);
  const actionLabel = action => {
    if (action.id === 'move_out_young_adult') {
      const currentHome = typeof getCurrentHome === 'function' ? getCurrentHome() : null;
      return currentHome?.source === 'family' ? 'Move Out' : 'Ask To Move Back In';
    }
    if (action.id === 'contribute_financially_young_adult') return 'Contribute Bills';
    return action.name;
  };
  const actionButtons = actions.map(action => `
    <button onclick="triggerAction('${action.id}', '${person.id}', '${interactionRole}')"
      style="width:100%;padding:11px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:11px;font-size:13px;font-weight:600;color:var(--text);text-align:left;cursor:pointer">
      ${actionLabel(action)}
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
  if (window._playSubTab === 'home') {
    renderActivitiesTab();
    return;
  }
  renderFamilyTab();
}
function buildEmptyState(emoji, title, subtitle) {
  return `<div class="placeholder-tab">
    <div style="font-size:40px">${emoji}</div>
    <div style="font-size:15px;font-weight:700;color:var(--text)">${title}</div>
    <div style="font-size:13px;color:var(--text-faint)">${subtitle}</div>
  </div>`;
}

// ── PLAY / HOME TAB ──────────────────────────────────────
function switchPlayTab(key) {
  window._playSubTab = key;
  if (key !== 'dating') window._datingView = null;
  renderActivitiesTab();
}

function switchHomeView(view) {
  window._homeView = view;
  renderActivitiesTab();
}

function runHomeAction(actionName, ...args) {
  const action = window[actionName];
  if (typeof action !== 'function') {
    showToast('That action is unavailable.');
    return;
  }
  const result = action(...args);
  if (result?.message) showToast(result.message);
  if (result?.ok !== false) {
    saveGame();
    updateAllUI();
    renderActivitiesTab();
  }
}

function clearPlaySelection() {
  window._playSubTab = null;
  window._homeView = null;
  window._datingView = null;
  renderActivitiesTab();
}

function buildPlayHub() {
  const options = [
    { id:'health', label:'Health', icon:'❤️', subtitle:'Appointments, routines, recovery' },
    { id:'shopping', label:'Shopping', icon:'🛍️', subtitle:'Clothes, treats, essentials' },
    { id:'lifestyle', label:'Lifestyle', icon:'🌿', subtitle:'Habits, hobbies, routines' },
    { id:'home', label:'Home', icon:'🏠', subtitle:'Where you live and who you live with' },
    { id:'dating', label:'Dating', icon:'💘', subtitle:'Apps, dates, and relationships' },
    { id:'travel', label:'Travel', icon:'✈️', subtitle:'Trips, holidays, escapes' },
    { id:'social', label:'Social', icon:'🥂', subtitle:'Plans, nights out, connection' },
    { id:'beauty', label:'Beauty', icon:'✨', subtitle:'Hair, style, self-expression' },
    { id:'vehicles', label:'Vehicles', icon:'🚗', subtitle:'Cars and transport later' },
    { id:'pets', label:'Pets', icon:'🐾', subtitle:'Companions and care later' },
    { id:'finance', label:'Finance', icon:'💳', subtitle:'Money tools and admin later' },
  ];
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#938678">Play</div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
        ${options.map(option => `
          <button onclick="${option.id === 'home' ? `switchPlayTab('home')` : option.id === 'dating' ? `switchPlayTab('dating')` : `showToast('${option.label} coming soon.')`}"
            style="background:var(--surface);border:1px solid var(--border-light);border-radius:18px;padding:16px 14px;text-align:left;display:flex;flex-direction:column;gap:8px;cursor:pointer;box-shadow:0 8px 20px rgba(64,42,22,.05)">
            <div style="font-size:28px;line-height:1">${option.icon}</div>
            <div style="font-size:15px;font-weight:800;color:var(--text)">${option.label}</div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.45">${option.subtitle}</div>
          </button>
        `).join('')}
      </div>
    </div>`;
}

function buildHomeMetricChip(label, value, accent = '#7b6b5f') {
  return `
    <div style="background:#fffaf1;border:1px solid rgba(224,210,193,.95);border-radius:14px;padding:10px 11px;display:flex;flex-direction:column;gap:3px;min-width:0">
      <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9d8f82">${label}</div>
      <div style="font-size:15px;font-weight:800;color:${accent};line-height:1.1">${value}</div>
    </div>`;
}

function passDatingMatchUi(personId) {
  passDatingMatch(personId);
  saveGame();
  updateAllUI();
  renderActivitiesTab();
}

function buildDatingCandidateCard(person, includePass = true) {
  const traits = (person.traits || []).slice(0, 2).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.label}</span>`;
  }).join('');
  return `
    <div class="person-card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:14px">
        ${buildPersonCardAvatar({ ...person, _roleCard:'Partner' })}
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:800;color:var(--text)">${person.firstName} ${person.surname || ''}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Age ${person.age} • ${person.job || 'Student'}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${person.compatibility}% compatible</div>
          ${traits ? `<div class="trait-pills" style="margin-top:8px">${traits}</div>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:${includePass ? 'repeat(2,minmax(0,1fr))' : 'minmax(0,1fr)'};gap:8px">
        <button onclick="askOutKnownPersonUi('${person.id}')" style="padding:12px 14px;border:1px solid #d9c5a2;border-radius:12px;background:#fff4dc;font-size:13px;font-weight:800;color:#6f5335;cursor:pointer">Date</button>
        ${includePass ? `<button onclick="passDatingMatchUi('${person.id}')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Pass</button>` : ''}
      </div>
    </div>`;
}

function buildDatingTab() {
  ensureRomanceState();
  const currentView = window._datingView || 'hub';
  if (STATE.age < 16) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="clearPlaySelection()" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer"><span style="font-size:18px;line-height:1">‹</span><span>Play</span></button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Dating</div>
        <div style="width:36px"></div>
      </div>
      ${buildEmptyState('💘', 'Dating unlocks later.', 'You need to be older first.')}`;
  }
  if (getCurrentPartner()) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="clearPlaySelection()" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer"><span style="font-size:18px;line-height:1">‹</span><span>Play</span></button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Dating</div>
        <div style="width:36px"></div>
      </div>
      ${buildPartnerStatusPanel(getCurrentPartner())}`;
  }
  if (currentView === 'app') {
    const matches = getDatingPool();
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="openDatingInPlay('hub')" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer"><span style="font-size:18px;line-height:1">‹</span><span>Dating</span></button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Dating App</div>
        <div style="width:36px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">${matches.map(match => buildDatingCandidateCard(match, true)).join('')}</div>`;
  }
  if (currentView === 'known') {
    const people = getEligibleKnownDatingPeople();
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="openDatingInPlay('hub')" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer"><span style="font-size:18px;line-height:1">‹</span><span>Dating</span></button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Someone You Know</div>
        <div style="width:36px"></div>
      </div>
      ${people.length ? `<div style="display:flex;flex-direction:column;gap:10px">${people.map(person => buildDatingCandidateCard(person, false)).join('')}</div>` : buildEmptyState('💬', 'Nobody obvious right now.', 'Build more connections first.')}`;
  }
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button onclick="clearPlaySelection()" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer"><span style="font-size:18px;line-height:1">‹</span><span>Play</span></button>
      <div style="font-size:16px;font-weight:800;color:var(--text)">Dating</div>
      <div style="width:36px"></div>
    </div>
    <div class="person-card" style="display:flex;flex-direction:column;gap:12px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-faint)">How do you want to meet someone?</div>
      <button onclick="openDatingInPlay('app')" style="padding:14px;border:1px solid var(--border-light);border-radius:14px;background:var(--surface);font-size:15px;font-weight:800;color:var(--text);text-align:left;cursor:pointer">Download Dating App</button>
      <button onclick="openDatingInPlay('known')" style="padding:14px;border:1px solid var(--border-light);border-radius:14px;background:var(--surface);font-size:15px;font-weight:800;color:var(--text);text-align:left;cursor:pointer">Ask Out Someone You Know</button>
    </div>`;
}

function buildHomeResidentRow(resident, homeSource) {
  const traits = (resident.traits || []).slice(0, 2).map(traitId => {
    const trait = getHousemateTrait(traitId) || CLASSMATE_TRAITS_POOL.find(item => item.id === traitId) || PARENT_TRAITS_POOL.find(item => item.id === traitId);
    if (!trait) return '';
    return `<span class="trait-pill" style="font-size:10px;padding:3px 7px">${trait.label}</span>`;
  }).join('');
  const showContribution = resident.refType !== 'roommate';
  const contribution = resident.contributionMonthly ? `${fmtMoney(resident.contributionMonthly)} / month` : 'No contribution';
  const removeButton = ['rental', 'owner', 'guest'].includes(homeSource) && resident.refType !== 'partner'
    ? `<button onclick="runHomeAction('askResidentToLeave','${resident.id}')" style="padding:8px 11px;border:1px solid var(--border);border-radius:10px;background:#fff;font-size:11px;font-weight:800;color:#7a6557;cursor:pointer">Ask To Leave</button>`
    : '';
  return `
    <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:12px 13px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div style="min-width:0;flex:1">
        <div style="font-size:14px;font-weight:800;color:var(--text)">${resident.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${resident.role} • ${resident.relationship || 0}% relationship</div>
        ${traits ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${traits}</div>` : ''}
        ${showContribution ? `<div style="font-size:11px;color:#7d6a5c;margin-top:8px">${contribution}</div>` : ''}
      </div>
      ${removeButton}
    </div>`;
}

function buildHomeMoveOption(option) {
  const isBuy = option.propertyValue !== undefined;
  const primaryCost = isBuy
    ? `Deposit ${fmtMoney(option.deposit)}`
    : option.upfront
      ? `Upfront ${fmtMoney(option.upfront)}`
      : `${fmtMoney(option.monthlyCost || option.playerMonthly || 0)} / month`;
  const monthly = isBuy
    ? `Mortgage ${fmtMoney(option.monthlyMortgage)} / month`
    : `${fmtMoney(option.playerMonthly || option.monthlyCost || 0)} / month`;
  const action = option.action || '';
  const arg = option.arg ? `,'${option.arg}'` : '';
  return `
    <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:14px 15px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div style="min-width:0">
          <div style="font-size:15px;font-weight:800;color:var(--text)">${option.icon || '🏠'} ${option.label}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${option.detail || option.type || ''}</div>
        </div>
        <span style="font-size:11px;font-weight:800;color:${option.enabled ? '#6a8e3f' : '#b46b5e'};text-transform:uppercase;letter-spacing:.08em">${option.enabled ? 'Available' : 'Locked'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        ${buildHomeMetricChip('Upfront', primaryCost, '#7b6b5f')}
        ${buildHomeMetricChip('Ongoing', monthly, '#7b6b5f')}
      </div>
      <button onclick="${option.enabled ? `runHomeAction('${action}'${arg})` : `showToast('${option.lockReason || 'Not available yet.'}')`}"
        style="width:100%;padding:12px 14px;border:1px solid ${option.enabled ? '#d9c5a2' : 'var(--border)'};border-radius:12px;background:${option.enabled ? '#fff4dc' : '#f7f2ea'};font-size:13px;font-weight:800;color:${option.enabled ? '#6f5335' : '#9d8c7d'};cursor:pointer">
        ${option.buttonLabel || (option.enabled ? 'Choose This Home' : 'Unavailable')}
      </button>
    </div>`;
}

function buildHomeChoiceTabs() {
  const current = window._homeView || 'rent';
  const tabs = [
    { id:'rent', label:'Rent a Home' },
    { id:'buy', label:'Purchase a Home' },
  ];
  return `
    <div class="job-tabs" style="margin-top:12px">
      ${tabs.map(tab => `
        <button class="job-tab ${current === tab.id ? 'active' : ''}" onclick="switchHomeView('${tab.id}')">
          <span>${tab.label}</span>
        </button>
      `).join('')}
    </div>`;
}

function buildCurrentHomeTabs() {
  const current = window._homeView || 'current';
  const tabs = [
    { id:'current', label:'Current Home' },
    { id:'rent', label:'Rent a Home' },
    { id:'buy', label:'Purchase a Home' },
  ];
  return `
    <div class="job-tabs" style="margin-top:12px">
      ${tabs.map(tab => `
        <button class="job-tab ${current === tab.id ? 'active' : ''}" onclick="switchHomeView('${tab.id}')">
          <span>${tab.label}</span>
        </button>
      `).join('')}
    </div>`;
}

function buildHomeHouseholdRoute() {
  const home = getCurrentHome();
  const entries = home?.source === 'family'
    ? getFamilyPeopleEntries().filter(entry => entry.role !== 'Pet')
    : getCurrentHomeResidents(home).map(resident => ({
        person: resident.refType === 'partner'
          ? ((typeof getCurrentPartner === 'function' ? getCurrentPartner() : null) || resident.friendProfile || resident)
          : resident.refType === 'friend'
            ? ((typeof getPersistentFriendById === 'function' ? getPersistentFriendById(resident.refId) : null) || resident.friendProfile || resident)
            : resident.refType === 'sibling'
              ? ((typeof getSiblingById === 'function' ? getSiblingById(resident.refId) : null) || resident)
              : (resident.friendProfile || resident),
        role: resident.refType === 'partner'
          ? 'Partner'
          : resident.refType === 'roommate'
            ? 'Roommate'
            : 'Friend',
        rel: resident.relationship || 50,
        traitPool: resident.refType === 'partner' ? CLASSMATE_TRAITS_POOL : HOUSEMATE_TRAITS_POOL,
      }));
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="switchHomeView('${home?.source === 'family' ? 'family_overview' : 'current'}')" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
          <span style="font-size:18px;line-height:1">‹</span><span>Back</span>
        </button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">Household</div>
        <div style="width:36px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${entries.map(({ person, role, rel, traitPool }) => buildPersonCard(person, role, rel, traitPool)).join('')}
      </div>
    </div>`;
}

function buildFamilyHomeOverview(home, summary) {
  const canContribute = STATE.age >= 16 && home.source === 'family';
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button onclick="clearPlaySelection()" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
        <span style="font-size:18px;line-height:1">‹</span><span>Play</span>
      </button>
      <div style="font-size:16px;font-weight:800;color:var(--text)">Home</div>
      <div style="width:36px"></div>
    </div>
    <div style="background:linear-gradient(180deg,#fff8ef 0%,#fffdf8 100%);border:1px solid rgba(225,209,190,.95);border-radius:20px;padding:18px;box-shadow:0 10px 28px rgba(84,55,24,.06);display:flex;flex-direction:column;gap:14px;margin-top:16px">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start">
        <div style="display:flex;gap:12px;align-items:flex-start;min-width:0">
          <div style="width:54px;height:54px;border-radius:16px;background:#fff1d7;border:1px solid #ecd3a8;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${home.icon}</div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9a8d7f">Family Home</div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-.03em;color:#241d17;line-height:1.05">${home.name}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:5px">${home.type}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        ${buildHomeMetricChip('Comfort', `${summary.comfort}%`, '#7e6fb1')}
        <button onclick="switchHomeView('household')" style="background:#fffaf1;border:1px solid rgba(224,210,193,.95);border-radius:14px;padding:10px 11px;text-align:left;cursor:pointer">
          <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9d8f82">Household</div>
          <div style="font-size:15px;font-weight:800;color:#7b6b5f;line-height:1.1;display:flex;align-items:center;justify-content:space-between;gap:8px"><span>${summary.occupantCount}</span><span style="font-size:18px;line-height:1">›</span></div>
        </button>
      </div>
      <div style="font-size:13px;color:#6d6054;line-height:1.5">You live at home with your family.</div>
      ${canContribute ? `
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          <button onclick="switchHomeView('rent')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Move Out</button>
          <button onclick="runHomeAction('contributeBillsAtHome')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Contribute Bills</button>
        </div>` : ''}
    </div>`;
}

function buildAdultHousingChooser(view) {
  const rentals = getRentalOptions().map(option => ({
    icon: option.icon,
    label: option.name,
    detail: option.type,
    enabled: option.enabled,
    lockReason: option.enabled ? '' : 'You need more money or income first.',
    playerMonthly: option.playerMonthly,
    upfront: option.upfront,
    action: 'moveIntoRental',
    arg: option.id,
    buttonLabel: 'Rent This Home',
  }));
  const purchases = getPurchaseOptions().map(option => ({
    icon: option.icon,
    label: option.name,
    detail: option.type,
    enabled: option.enabled,
    lockReason: option.enabled ? '' : 'You need a deposit, income, and approval.',
    propertyValue: option.propertyValue,
    deposit: option.deposit,
    monthlyMortgage: option.monthlyMortgage,
    action: 'buyHome',
    arg: option.id,
    buttonLabel: 'Buy This Home',
  }));
  const title = view === 'buy' ? 'Purchase a Home' : 'Rent a Home';
  const sub = view === 'buy'
    ? 'Deposit, approval, monthly mortgage.'
    : 'Lower upfront cost, easier to move.';
  const options = view === 'buy' ? purchases : rentals;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button onclick="${getCurrentHome()?.source === 'family' ? `switchHomeView('family_overview')` : `switchHomeView('current')`}" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
        <span style="font-size:18px;line-height:1">‹</span><span>Back</span>
      </button>
      <div style="font-size:16px;font-weight:800;color:var(--text)">${title}</div>
      <div style="width:36px"></div>
    </div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">${sub}</div>
    ${buildHomeChoiceTabs()}
    <div class="jobs-list" style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
      ${options.map(buildHomeMoveOption).join('')}
    </div>`;
}

function buildHomeSection(title, subtitle, body) {
  return `
    <section style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
      <div>
        <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#938678">${title}</div>
        ${subtitle ? `<div style="font-size:13px;color:var(--text-muted);margin-top:3px">${subtitle}</div>` : ''}
      </div>
      ${body}
    </section>`;
}

function buildHomeTab() {
  ensureHomeState();
  const home = getCurrentHome();
  const summary = getHomeSummary(home);
  const residents = getCurrentHomeResidents(home);
  const upgrades = getAvailableUpgradesForCurrentHome();
  if (home.source === 'family' && STATE.age < 16) {
    const view = window._homeView || 'family_overview';
    if (view === 'household') return buildHomeHouseholdRoute();
    return buildFamilyHomeOverview(home, summary);
  }
  if (home.source === 'family' && STATE.age >= 16) {
    const view = window._homeView || 'family_overview';
    if (view === 'household') return buildHomeHouseholdRoute();
    if (view === 'buy' || view === 'rent') return buildAdultHousingChooser(view);
    return `${buildFamilyHomeOverview(home, summary)}${buildHomeChoiceTabs()}`;
  }
  const view = window._homeView || 'current';
  if (view === 'household') return `${buildCurrentHomeTabs()}${buildHomeHouseholdRoute()}`;
  if (view === 'rent' || view === 'buy') return `${buildCurrentHomeTabs()}${buildAdultHousingChooser(view)}`;
  const emergency = getEmergencyHousingOptions().map(option => {
    const mapping = {
      move_back_home: { action:'moveBackHome', buttonLabel:'Move Back Home' },
      friend_sofa: { action:'stayWithFriend', buttonLabel:'Stay Here' },
      sibling_spare_room: { action:'stayWithSibling', buttonLabel:'Stay Here' },
      budget_room: { action:'takeTemporaryAccommodation', buttonLabel:'Take Room' },
    };
    const meta = mapping[option.type] || { action:'moveBackHome', buttonLabel:'Choose' };
    return {
      icon: option.type === 'move_back_home' ? '🏡' : option.type === 'friend_sofa' ? '🛏️' : option.type === 'sibling_spare_room' ? '🚪' : '🪟',
      label: option.label,
      detail: option.detail,
      enabled: option.enabled,
      lockReason: 'That option is not available right now.',
      monthlyCost: option.monthlyCost,
      upfront: option.upfront,
      action: meta.action,
      arg: option.refId || option.templateId || '',
      buttonLabel: meta.buttonLabel,
    };
  });

  const statusBadge = home.source === 'owner'
    ? 'Owner'
    : home.source === 'family'
      ? 'Family Home'
      : home.source === 'guest'
        ? 'Staying With Someone'
        : home.source === 'emergency'
          ? 'Temporary'
          : home.source === 'homeless'
            ? 'Homeless'
            : 'Renting';

  const residentCards = residents.length
    ? residents.map(resident => buildHomeResidentRow(resident, home.source)).join('')
    : `<div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:14px 15px;font-size:13px;color:var(--text-muted)">You live alone right now.</div>`;

  const upgradeCards = upgrades.length
    ? upgrades.slice(0, 4).map(upgrade => `
        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:15px;padding:13px 14px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--text)">${upgrade.label}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${fmtMoney(upgrade.cost)} • +${upgrade.comfort} comfort • +${upgrade.prestige} prestige</div>
            </div>
            <button onclick="runHomeAction('applyHomeUpgradeById','${upgrade.id}')" style="padding:9px 11px;border:1px solid #d9c5a2;border-radius:10px;background:#fff4dc;font-size:11px;font-weight:800;color:#6f5335;cursor:pointer">Upgrade</button>
          </div>
        </div>
      `).join('')
    : `<div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:14px 15px;font-size:13px;color:var(--text-muted)">No upgrades available for this home right now.</div>`;

  const currentHomeCard = `
    <div style="background:linear-gradient(180deg,#fff8ef 0%,#fffdf8 100%);border:1px solid rgba(225,209,190,.95);border-radius:20px;padding:18px 18px 16px;box-shadow:0 10px 28px rgba(84,55,24,.06);display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start">
        <div style="display:flex;gap:12px;align-items:flex-start;min-width:0">
          <div style="width:54px;height:54px;border-radius:16px;background:#fff1d7;border:1px solid #ecd3a8;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${home.icon}</div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9a8d7f">${statusBadge}</div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-.03em;color:#241d17;line-height:1.05">${home.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:5px">${home.type} • ${home.location}</div>
        </div>
      </div>
        <div style="padding:7px 10px;border-radius:999px;background:${summary.happinessImpact >= 0 ? '#eef8df' : '#fff0eb'};font-size:11px;font-weight:800;color:${summary.happinessImpact >= 0 ? '#62873a' : '#b05e53'};white-space:nowrap">
          ${summary.happinessImpact >= 0 ? '+' : ''}${summary.happinessImpact} happiness
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        ${buildHomeMetricChip('Monthly Cost', `${fmtMoney(summary.cost.playerMonthly)} / month`, '#6f5335')}
        ${buildHomeMetricChip('Comfort', `${summary.comfort}%`, '#7e6fb1')}
        ${buildHomeMetricChip(home.source === 'rental' ? 'Enjoyment' : 'Prestige', `${home.source === 'rental' ? summary.enjoyment : summary.prestige}%`, '#9c7543')}
        <button onclick="switchHomeView('household')" style="background:#fffaf1;border:1px solid rgba(224,210,193,.95);border-radius:14px;padding:10px 11px;text-align:left;cursor:pointer">
          <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9d8f82">${home.source === 'rental' ? 'Household' : 'People Living Here'}</div>
          <div style="font-size:15px;font-weight:800;color:#7b6b5f;line-height:1.1;display:flex;align-items:center;justify-content:space-between;gap:8px"><span>${summary.occupantCount}</span><span style="font-size:18px;line-height:1">›</span></div>
        </button>
        ${home.source === 'owner' ? buildHomeMetricChip('Condition', `${summary.overallCondition}%`, summary.overallCondition >= 60 ? '#6a8e3f' : '#b46b5e') : ''}
      </div>
      <div style="font-size:12px;color:#6d6054;line-height:1.5">
        ${home.source === 'homeless'
          ? 'Life feels unstable and exhausting right now. Finding safe housing should be a priority.'
          : `You have lived here for ${home.yearsLived} ${home.yearsLived === 1 ? 'year' : 'years'}. Household relationship quality is ${summary.relationAverage}%, and household tension is ${summary.tension}%.`}
      </div>
    </div>`;

  const actionButtons = home.source === 'rental'
    ? `<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:8px">
        <button onclick="switchHomeView('rent')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Move Out</button>
      </div>`
    : `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <button onclick="runHomeAction('cleanCurrentHome')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Clean Home</button>
        <button onclick="runHomeAction('repairCurrentHome')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Repair Home</button>
        <button onclick="runHomeAction('inviteBestFriendToLive')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Invite Someone</button>
        <button onclick="runHomeAction('moveInWithPartner')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Move In With Partner</button>
        <button onclick="runHomeAction('moveBackHome')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Move Back Home</button>
        <button onclick="runHomeAction('sellCurrentHome')" style="padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--surface);font-size:13px;font-weight:800;color:var(--text);cursor:pointer">Sell Property</button>
      </div>`;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button onclick="clearPlaySelection()" style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
        <span style="font-size:18px;line-height:1">‹</span><span>Play</span>
      </button>
      <div style="font-size:16px;font-weight:800;color:var(--text)">Home</div>
      <div style="width:36px"></div>
    </div>
    ${buildCurrentHomeTabs()}
    ${buildHomeSection('Current Home', 'Your living situation right now.', currentHomeCard)}
    ${home.source === 'owner' ? buildHomeSection('Household', 'Who lives here and how the home feels socially.', `<div style="display:flex;flex-direction:column;gap:10px">${residentCards}</div>`) : ''}
    ${home.source === 'owner' ? buildHomeSection('Finances', 'Simple housing costs with no heavy micromanagement.', `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        ${buildHomeMetricChip('Rent / Mortgage', fmtMoney((home.baseMonthlyCost || 0) + (home.mortgageMonthly || 0)), '#6f5335')}
        ${buildHomeMetricChip('Utilities', fmtMoney(home.utilitiesMonthly || 0), '#6f5335')}
        ${buildHomeMetricChip('Upkeep', fmtMoney(summary.cost.upkeepMonthly), '#6f5335')}
        ${buildHomeMetricChip('Household Contributions', fmtMoney(summary.cost.contributionsMonthly), '#6f5335')}
      </div>
    `) : ''}
    ${home.source === 'owner' ? buildHomeSection('Property', 'Comfort, prestige, condition, and customisation.', `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px">
        ${buildHomeMetricChip('Cleanliness', `${summary.cleanliness}%`, '#507f7b')}
        ${buildHomeMetricChip('Maintenance', `${summary.maintenance}%`, '#507f7b')}
        ${buildHomeMetricChip('Overcrowding', `${summary.overcrowding}`, summary.overcrowding ? '#b46b5e' : '#6a8e3f')}
        ${buildHomeMetricChip('Tension', `${summary.tension}%`, summary.tension >= 55 ? '#b46b5e' : '#6a8e3f')}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">${upgradeCards}</div>
    `) : buildHomeSection('Make It Yours', 'Keep the fun personal upgrades.', `<div style="display:flex;flex-direction:column;gap:10px">${upgradeCards}</div>`)}
    ${buildHomeSection('Actions', 'Small actions that keep the home feeling stable and personal.', actionButtons)}
    ${home.source === 'homeless' ? buildHomeSection('Emergency Options', 'Safety nets that help you avoid homelessness.', `<div style="display:flex;flex-direction:column;gap:10px">${emergency.map(buildHomeMoveOption).join('')}</div>`) : ''}
  `;
}

function renderActivitiesTab() {
  const tab = document.getElementById('tab-activities');
  if (!tab) return;
  const current = window._playSubTab || null;
  let body = '';
  if (current === 'home') {
    body = buildHomeTab();
  } else if (current === 'dating') {
    body = buildDatingTab();
  } else {
    body = buildPlayHub();
  }
  tab.innerHTML = body;
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
  if (role === 'Son' || role === 'Daughter') return '#9f7de2';
  if (role === 'Partner') return '#e86e95';
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
  if (person.reputation !== undefined) return { label:'Reputation', value:clamp(person.reputation) };
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
  else if (role === 'Partner' && STATE.romance?.partner)
    person = { ...STATE.romance.partner, _role:'Partner', _rel:STATE.romance.partner.relationship ?? STATE.relationships.partner };
  else {
    const sib = STATE.family.siblings.find(s => s.id === personId);
    if (sib) person = { ...sib, _role:role, _rel:sib.relationship||60 };
    const child = (STATE.romance?.children || []).find(c => c.id === personId);
    if (!person && child) person = { ...child, _role:child.gender === 'male' ? 'Son' : 'Daughter', _rel:child.relationship || 70 };
    const cm  = STATE.school.classmates.find(c => c.id === personId);
    if (cm) {
      const resolvedRole = (role === 'Friend' || cm.status === 'friend') ? 'Friend' : role;
      person = {
        ...cm,
        _role: resolvedRole,
        _rel:(typeof getStableFriendRelationship === 'function' ? getStableFriendRelationship(cm, 60) : (cm.relationship ?? 60)),
      };
    }
    if (!person && STATE.school?.uniProfile?.people?.length) {
      const uniPerson = STATE.school.uniProfile.people.find(p => p.id === personId);
      if (uniPerson) {
        const resolvedRole = uniPerson.label === 'Lecturer'
          ? 'Teacher'
          : ((role === 'Friend' || uniPerson.status === 'friend') ? 'Friend' : 'classmate');
        person = {
          ...uniPerson,
          _role: resolvedRole,
          _rel:(typeof getStableFriendRelationship === 'function' ? getStableFriendRelationship(uniPerson, 60) : (uniPerson.relationship ?? 60)),
        };
      }
    }
    if (!person && role === 'Friend') {
      const savedFriend = getPersistentFriendById(personId);
      if (savedFriend) person = { ...savedFriend, _role:'Friend', _rel:(typeof getStableFriendRelationship === 'function' ? getStableFriendRelationship(savedFriend, 60) : (savedFriend.relationship ?? 60)) };
    }
    if (!person && role === 'Friend') {
      const resident = typeof getHouseholdResidentById === 'function' ? getHouseholdResidentById(personId) : null;
      if (resident?.friendProfile) person = { ...resident.friendProfile, _role:'Friend', _rel:resident.relationship ?? resident.friendProfile.relationship ?? 60 };
    }
    const teacher = STATE.school.teachers.find(t => t.id === personId);
    if (teacher) person = { ...teacher, _role:'Teacher', _rel:teacher.npcStats?.warmth ?? 50 };
    const pet = STATE.family.pets.find(p => p.id === personId);
    if (pet) person = { ...pet, _role:'Pet', _rel:pet.happiness, isPet:true };
  }
  if (!person) return;
  const sheet = document.getElementById('person-sheet');
  const backdrop = document.querySelector('#person-overlay .overlay-backdrop');
  const resolvedRole = person._role || role;
  const traitsHTML = buildPersonSheetTraits(person, resolvedRole);
  const avatarHTML = buildPersonSheetAvatar(person);
  const detailsHTML = buildPersonSheetDetails(person, resolvedRole);
  const statsHTML = buildPersonSheetStats(person, resolvedRole);
  const lifeDetailsHTML = buildPersonSheetLifeDetails(person, resolvedRole);
  const lifeUpdatesHTML = buildPersonSheetLifeUpdates(person);
  const reputationHTML = buildPersonSheetReputation(person, resolvedRole);
  const relLabel = resolvedRole === 'Teacher' ? 'Warmth' : 'Relationship';
  const displayName = (resolvedRole === 'Friend' || resolvedRole === 'classmate') ? classmateDisplayName(person) : `${person.firstName}${person.surname ? ' '+person.surname : ''}`;
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
      ${lifeDetailsHTML ? `<div class="person-sheet-divider"></div>${lifeDetailsHTML}` : ''}
      <div class="person-sheet-divider"></div>
      ${statsHTML}
      ${traitsHTML ? `<div class="person-sheet-divider"></div><div class="sheet-section flat"><div class="sheet-section-title">Traits</div><div class="trait-pills person-sheet-traits">${traitsHTML}</div></div>` : ''}
      <div class="person-sheet-divider"></div>
      ${reputationHTML}
      ${lifeUpdatesHTML ? `<div class="person-sheet-divider"></div>${lifeUpdatesHTML}` : ''}
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
  if ((role === 'Friend' || role === 'classmate') && !canRevealClassmateTraits(person)) {
    return '';
  }
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
      ['Happiness', 'warmth', person.happiness, '#9d87ff'],
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Reputation', 'reputation', person.reputation ?? person.npcStats?.reputation, '#4ecb71'],
    ];
  }
  if (role === 'Partner') {
    return [
      ['Happiness', 'warmth', person.happiness, '#9d87ff'],
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Reputation', 'reputation', person.reputation ?? person.npcStats?.reputation ?? person.loyalty, '#4ecb71'],
    ];
  }
  if (role === 'Son' || role === 'Daughter') {
    return [
      ['Happiness', 'warmth', person.happiness, '#9d87ff'],
      ['Looks', 'looks', person.npcStats?.looks, '#ff89db'],
      ['Smarts', 'smarts', person.npcStats?.smarts, '#8fbffa'],
      ['Reputation', 'reputation', person.reputation ?? person.npcStats?.reputation ?? person.relationship, '#4ecb71'],
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
    rows.push(['Job', buildSheetSymbolIcon('job', '#bc8f68'), person.jobTitle || person.job || 'None']);
    const maritalStatus = STATE.family.maritalStatus || maritalStatusForSituation(STATE.family.situation);
    const maritalIcon = /divorc/i.test(maritalStatus) ? buildSheetSymbolIcon('divorced', '#ef7f88')
      : /married/i.test(maritalStatus) ? buildSheetSymbolIcon('married', '#d16a90')
      : buildSheetSymbolIcon('single', '#ef98a5');
    rows.push(['Marital Status', maritalIcon, maritalStatus]);
  }
  if (role === 'Brother' || role === 'Sister') {
    rows.push(['Education', buildSheetSymbolIcon('job', '#bc8f68'), person.educationLevel || educationLevelForAge(person.age)]);
    rows.push(['Sibling Type', buildSheetSymbolIcon('single', '#ef98a5'), person.siblingType === 'half' ? 'Half sibling' : 'Full sibling']);
    if (person.familyStatus) rows.push(['Family Status', buildSheetSymbolIcon('single', '#ef98a5'), person.familyStatus]);
  }
  if (role === 'Friend' || role === 'classmate') {
    rows.push(['Job', buildSheetSymbolIcon('job', '#bc8f68'), person.jobTitle && person.jobTitle !== 'None' ? person.jobTitle : 'Not working yet']);
    rows.push(['Education', buildSheetSymbolIcon('job', '#bc8f68'), person.educationLevel || 'Unknown']);
    rows.push(['Status', buildSheetSymbolIcon('single', '#ef98a5'), person.relationshipStatus || 'Single']);
  }
  if (role === 'Partner') {
    rows.push(['Job', buildSheetSymbolIcon('job', '#bc8f68'), person.jobTitle && person.jobTitle !== 'None' ? person.jobTitle : (person.job || 'Student')]);
    rows.push(['Status', buildSheetSymbolIcon('single', '#ef98a5'), romanceStatusLabel(STATE.romance?.status || 'dating')]);
    rows.push(['Compatible', buildSheetSymbolIcon('compatibility', '#f0b14f'), `${compatibilityFor(person)}%`]);
    rows.push(['Loyalty', buildSheetSymbolIcon('reputation', '#4ecb71'), `${person.loyalty || 50}%`]);
  }
  if (role === 'Son' || role === 'Daughter') {
    rows.push(['Job', buildSheetSymbolIcon('job', '#bc8f68'), person.jobTitle && person.jobTitle !== 'None' ? person.jobTitle : 'Child']);
    rows.push(['Education', buildSheetSymbolIcon('job', '#bc8f68'), person.educationLevel || educationLevelForAge(person.age)]);
    rows.push(['Status', buildSheetSymbolIcon('single', '#ef98a5'), person.age <= 3 ? 'Little one' : 'Child']);
  }
  if (role === 'Teacher') {
    rows.push(['Subject', buildSheetSymbolIcon('job', '#bc8f68'), person.subject || 'Unknown']);
    rows.push(['Title', buildSheetSymbolIcon('job', '#bc8f68'), person.title || 'Teacher']);
  }
  if (!person.isPet && role !== 'Teacher' && role !== 'Partner' && role !== 'Son' && role !== 'Daughter') rows.push(['Compatible', buildSheetSymbolIcon('compatibility', '#f0b14f'), `${compatibilityFor(person)}%`]);
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

function buildPersonSheetLifeDetails(person, role) {
  if (person.isPet || role === 'Teacher') return '';
  const rows = [];
  if (person.jobTitle || role === 'Mother' || role === 'Father') rows.push(['Job', person.jobTitle || person.job || 'None']);
  if (person.educationLevel) rows.push(['Education', person.currentEducation ? `${person.educationLevel} • ${person.currentEducation}` : person.educationLevel]);
  if (person.relationshipStatus) rows.push(['Relationship', person.relationshipStatus]);
  if (person.housingStatus) rows.push(['Housing', person.housingStatus]);
  if (person.socialGroup && (role === 'Friend' || role === 'classmate')) rows.push(['Social Group', person.socialGroup]);
  if (person.salary && person.salary > 0 && (role === 'Mother' || role === 'Father' || role === 'Friend' || role === 'Brother' || role === 'Sister' || role === 'Partner')) rows.push(['Income', fmtMoney(person.salary)]);
  if (role === 'Partner') {
    rows.push(['Relationship', romanceStatusLabel(STATE.romance?.status || 'dating')]);
    rows.push(['Living Together', person.livingTogether ? 'Yes' : 'Not yet']);
  }
  if (role === 'Son' || role === 'Daughter') rows.push(['Family Role', role]);
  if (person.careerPath && person.jobTitle && person.jobTitle !== 'None') rows.push(['Career Path', person.careerPath]);
  if (!rows.length) return '';
  return `
    <div class="sheet-section flat">
      <div class="sheet-section-title">Life Details</div>
      <div class="detail-card">
        ${rows.slice(0, 6).map(([label, value]) => `
          <div class="detail-row">
            <span class="detail-label">${label}</span>
            <span class="detail-val bold">${value}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildPersonSheetLifeUpdates(person) {
  const updates = person.lifeUpdates || [];
  if (!updates.length) return '';
  return `
    <div class="sheet-section flat">
      <div class="sheet-section-title">Life Updates</div>
      <div class="detail-card">
        ${updates.map(update => `
          <div class="detail-row" style="align-items:flex-start">
            <span class="detail-label">Age ${update.age}</span>
            <span class="detail-val" style="max-width:72%;text-align:right;font-family:inherit">${update.text}</span>
          </div>`).join('')}
      </div>
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
    if (typeof markNpcInteraction === 'function') markNpcInteraction(cm, `Spent time chatting with ${cm.firstName}.`);
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
let _uniParentFundingOffer = null;
let _uniUniversityChoiceSlot = 'primary';
const UNI_PREVIEW_IMAGE = 'data/state_primary.png';

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
  { id:'student_loan', label:'Student Loan', icon:'mdi:bank-outline', blurb:'Tuition covered. You’ll receive £6,500 a year for living costs.', effect:'Debt saved for later', tag:'Most Common', tagBg:'#eee7ff', tagColor:'#6753b3', accent:'#7d67d9' },
  { id:'ask_parents', label:'Ask Parents', icon:'mdi:account-group', blurb:'See if your parents will help pay for university.', effect:'Depends on family', tag:'Family Help', tagBg:'#ffe9e9', tagColor:'#ca5f5d', accent:'#ef7b78' },
  { id:'self_fund', label:'Self Fund', icon:'mdi:briefcase', blurb:'Pay the fees yourself.', effect:'Costs £9,000/year', tag:'Pay Yourself', tagBg:'#e8f5e7', tagColor:'#4f8850', accent:'#5ca55f' },
  { id:'scholarship', label:'Scholarship', icon:'mdi:school-outline', blurb:'Apply for financial support.', effect:'Coming soon', tag:'Placeholder', tagBg:'#fff3d8', tagColor:'#9a6a21', accent:'#d39b36' },
];

const UNI_TYPE_PREVIEW = {
  'Elite Universities': { fee:'£9,000 / year', studentLife:[['Debt', 'High', '#d48b2b', 82], ['Stress', 'High', '#d45b55', 85], ['Social Life', 'Medium', '#e08e2d', 56], ['Career Prospects', 'Very High', '#4f9a57', 92]], blurb:'Elite universities open the strongest doors, but they ask the most from you.' },
  'Top Universities': { fee:'£9,000 / year', studentLife:[['Debt', 'Medium', '#d48b2b', 64], ['Stress', 'High', '#d45b55', 76], ['Social Life', 'Medium', '#e08e2d', 58], ['Career Prospects', 'High', '#4f9a57', 81]], blurb:'Top universities balance strong outcomes with a slightly more reachable path.' },
  'Standard Universities': { fee:'£9,000 / year', studentLife:[['Debt', 'Medium', '#d48b2b', 58], ['Stress', 'Medium', '#e08e2d', 52], ['Social Life', 'Good', '#e08e2d', 64], ['Career Prospects', 'Solid', '#4f9a57', 67]], blurb:'A practical route with good campus life and a less punishing admissions path.' },
  'Local Universities': { fee:'£9,000 / year', studentLife:[['Debt', 'Low', '#d48b2b', 36], ['Stress', 'Low', '#e08e2d', 38], ['Social Life', 'Steady', '#e08e2d', 47], ['Career Prospects', 'Fair', '#4f9a57', 55]], blurb:'Staying local keeps costs lower and family closer while you find your footing.' },
};

function ensurePostSchoolState() {
  if (!STATE.school.postSchool) STATE.school.postSchool = { schoolFinishedShown:false, uniApplication:null };
  if (typeof ensureEducationState === 'function') ensureEducationState();
  if (STATE.school.postSchool.uniApplication && typeof syncUniversityApplicationState === 'function') {
    syncUniversityApplicationState(STATE.school.postSchool.uniApplication);
  }
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
  _learnScreen = 'uniApplyCourse';
  const postSchool = ensurePostSchoolState();
  _uniParentFundingOffer = null;
  _uniApplyDraft = postSchool.uniApplication?.status === 'draft'
    ? createUniversityApplicationState(postSchool.uniApplication)
    : createUniversityApplicationState();
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeUniApplication() {
  _learnScreen = 'main';
  _uniApplyDraft = null;
  _uniParentFundingOffer = null;
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
  const difficultyBase = type === 'full-time'
    ? 33 + Math.max(0, parseSalaryValue(job.salary) - 20000) / 1800
    : 22 + Math.max(0, (job.rate || 10) - 10) * 3.5;
  const categoryDifficulty = { retail:0, office:3, creative:5, emergency:10, sales:6, corporate:12 }[category] || 0;
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
    hiringChance: Math.round(74 - difficulty * 0.38 + (type === 'part-time' ? 10 : 0)),
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
  const matchesPool = pool => pool.some(item => getJobKey(item) === getJobKey(job));
  if (matchesPool(FULL_TIME_GENERAL_JOBS)) return 'general';
  if (matchesPool(FULL_TIME_ANY_DEGREE_JOBS)) return 'any-degree';
  if (matchesPool(FULL_TIME_NO_DEGREE_GROWTH_JOBS)) return 'no-degree-growth';
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
  let score = 53;
  const poolType = getJobPoolType(job);

  if (STATE.school.level === 'graduated') score += 10;
  else if (STATE.school.level === 'finished_school') score += 8;
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
  if (job.type === 'Full-Time' && !degree) {
    score += 4;
    if (poolType === 'general') score += 8;
    if (poolType === 'no-degree-growth') score += 10;
    if (poolType === 'any-degree') score -= 2;
  }
  if (job.type === 'Full-Time' && job.jobCategory === 'corporate' && !degree) score -= 6;

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

  score += Math.floor(Math.random() * 15) - 7;
  score -= job.applicationDifficulty * 0.42;
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
  if (job.salaryMin && job.salaryMax) return getGeneratedSalaryForRange(job.salaryMin, job.salaryMax, 0.5);
  return parseSalaryValue(job.salary);
}

function getCareerLevelForJob(job) {
  const pay = job.salaryMax || getJobAnnualIncome(job);
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
  STATE.career.jobType = null;
  STATE.career.work = null;
  STATE.finances.income = 0;
  STATE.finances.job = 'None';
  STATE.finances.jobType = null;
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
  const legalSalary = job.salaryMin && job.salaryMax
    ? getGeneratedSalaryForRange(
        job.salaryMin,
        job.salaryMax,
        clamp(((_jobFlowState.applicationScore || 55) - 25), 0, 100) / 100
      )
    : job.legalProfile
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
  STATE.career.jobType = job.type || null;
  STATE.career.companyName = job.companyName;
  STATE.career.work = null;
  STATE.finances.income = legalSalary;
  STATE.finances.job = job.title;
  STATE.finances.jobType = job.type || null;
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
  if (_learnScreen === 'uniApplyType') {
    _learnScreen = 'uniApplyFinances';
  } else if (_learnScreen === 'uniApplyFinances') {
    _learnScreen = 'uniApplyCourse';
  } else {
    closeUniApplication();
    return;
  }
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function nextUniApplicationStep() {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (_learnScreen === 'uniApplyCourse') {
    if (!_uniApplyDraft.course) {
      showToast('Choose a course first.');
      return;
    }
    saveUniversityDraft();
    _learnScreen = 'uniApplyFinances';
  } else if (_learnScreen === 'uniApplyFinances') {
    if (!_uniApplyDraft.fundingChoice) {
      showToast('Choose how you will fund university.');
      return;
    }
    const result = prepareUniversityFundingSelection();
    if (!result.ok) return;
    _learnScreen = 'uniApplyType';
  } else if (_learnScreen === 'uniApplyType') {
    if (!_uniApplyDraft.uniType) {
      showToast('Choose a university type.');
      return;
    }
    submitUniApplication();
    return;
  }
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function selectUniApplicationField(field, value) {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (field === 'fundingChoice') {
    _uniApplyDraft.fundingChoice = value;
    _uniApplyDraft.funding = value;
    if (value === 'scholarship') _uniApplyDraft.scholarshipStatus = 'not_available_yet';
    if (value !== 'ask_parents') {
      _uniApplyDraft.parentalFundingAccepted = false;
      _uniApplyDraft.parentalFundingRejected = false;
    }
  } else if (field === 'uniType') {
    _uniApplyDraft.uniType = value;
    _uniApplyDraft.universityType = value;
  } else {
    _uniApplyDraft[field] = value;
  }
  saveUniversityDraft();
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
  _uniApplyDraft = getUniversityApplicationDraft();
  if (!_uniApplyDraft?.course || !_uniApplyDraft?.uniType || !_uniApplyDraft?.fundingChoice) {
    showToast('Finish your university choices first.');
    return;
  }
  const postSchool = ensurePostSchoolState();
  postSchool.uniApplication = createUniversityApplicationState({
    ..._uniApplyDraft,
    submittedAge: STATE.age,
    status: 'pending',
    result: null,
  });
  if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  saveGame();
  _learnScreen = 'main';
  _uniApplyDraft = null;
  _uniParentFundingOffer = null;
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

function getUniversityApplicationDraft(overrides = {}) {
  const existing = _uniApplyDraft || {};
  return createUniversityApplicationState({ ...existing, ...overrides });
}

function saveUniversityDraft() {
  const postSchool = ensurePostSchoolState();
  const draft = getUniversityApplicationDraft();
  _uniApplyDraft = draft;
  if (typeof syncUniversityApplicationState === 'function' && draft.status === 'draft') {
    syncUniversityApplicationState(draft);
  } else {
    postSchool.uniApplication = draft;
  }
  saveGame();
}

function getUniversityFundingParents() {
  return [STATE.family?.mum, STATE.family?.dad].filter(Boolean).filter(parent => parent.alive !== false);
}

function getUniversityFundingWealthBand() {
  const parents = getUniversityFundingParents();
  const highPayingCount = parents.filter(parent => isHighPayingParentJob(parent.job)).length;
  if (STATE.socialClass === 'elite' || highPayingCount >= 2) return 'wealthy';
  if (STATE.socialClass === 'upper_middle' || highPayingCount === 1) return 'comfortable';
  if (STATE.socialClass === 'middle') return 'average';
  return 'low';
}

function getParentFundingAmountRange() {
  return {
    low: [0, 2000],
    average: [1000, 6000],
    comfortable: [5000, 12000],
    wealthy: [10000, 20000],
  }[getUniversityFundingWealthBand()] || [0, 4000];
}

function getParentFundingGradeRequirement() {
  const gradeScore = STATE.school.gradeScore || 0;
  if (gradeScore >= 90) return 'A+';
  if (gradeScore >= 80) return 'A';
  return 'B';
}

function buildParentFundingOffer() {
  if ((_uniApplyDraft?.parentalFundingAmountPerYear || _uniApplyDraft?.parentalFundingAmount) && Array.isArray(_uniApplyDraft?.parentalFundingTerms)) {
    return {
      amount: _uniApplyDraft.parentalFundingAmountPerYear || _uniApplyDraft.parentalFundingAmount,
      terms: _uniApplyDraft.parentalFundingTerms,
    };
  }
  const parents = getUniversityFundingParents();
  const [minAmount, maxAmount] = getParentFundingAmountRange();
  const generosity = parents.length
    ? Math.round(parents.reduce((sum, parent) => sum + (parent.npcStats?.generosity ?? 50), 0) / parents.length)
    : 0;
  const warmth = parents.length
    ? Math.round(parents.reduce((sum, parent) => sum + (parent.npcStats?.warmth ?? 50), 0) / parents.length)
    : 0;
  const traitList = parents.flatMap(parent => parent.traits || []);
  let generosityFactor = ((generosity - 50) / 50) * 0.24 + ((warmth - 50) / 50) * 0.12;
  if (traitList.includes('supportive')) generosityFactor += 0.16;
  if (traitList.includes('kind')) generosityFactor += 0.12;
  if (traitList.includes('ambitious')) generosityFactor += 0.05;
  if (traitList.includes('strict')) generosityFactor -= 0.04;
  if (traitList.includes('overbearing')) generosityFactor -= 0.08;
  if (traitList.includes('distant')) generosityFactor -= 0.14;
  if (traitList.includes('absent')) generosityFactor -= 0.2;
  const amount = Math.round((minAmount + (maxAmount - minAmount) * Math.max(0, Math.min(1, 0.5 + generosityFactor))) / 100) * 100;

  const terms = [];
  const selectedCourse = _uniApplyDraft?.course || 'your course';
  const wantsCreativeRestriction = isCreativeUniversityCourse(selectedCourse) && (traitList.includes('strict') || traitList.includes('ambitious') || traitList.includes('overbearing'));

  if (wantsCreativeRestriction) {
    terms.push({ type:'no_creative_degree', label:'You must not study a creative degree' });
  }
  if (traitList.includes('strict') || traitList.includes('overbearing')) {
    terms.push({ type:'min_grade', value:getParentFundingGradeRequirement(), label:`You must keep your grades at ${getParentFundingGradeRequirement()}` });
  }
  if (traitList.includes('ambitious')) {
    terms.push({ type:'specific_course', value:selectedCourse, label:`You must study ${selectedCourse}` });
  }
  if ((traitList.includes('strict') || traitList.includes('hardworking')) && Math.random() < 0.45) {
    terms.push({ type:'part_time_job', label:'You must get a part-time job' });
  }
  if ((traitList.includes('strict') || traitList.includes('distant') || traitList.includes('overbearing')) && Math.random() < 0.5) {
    terms.push({ type:'pay_back_later', label:'You must pay them back once you start working' });
  }

  const uniqueTerms = terms.filter((term, index, list) => list.findIndex(item => item.type === term.type) === index);
  return { amount:Math.max(0, Math.min(20000, amount)), terms:uniqueTerms };
}

function renderParentFundingOfferPopup() {
  const offer = _uniParentFundingOffer;
  if (!offer) return;
  _pendingAfterMilestone = null;
  const bodyLine = offer.status === 'full'
    ? 'Your parents are willing to cover your full tuition fees.'
    : offer.status === 'housing_only'
      ? `Your parents will not pay tuition, but they will cover ${fmtMoney(offer.housingPerYear || 0)} per year of housing costs.`
      : `Your parents are willing to give you ${fmtMoney(offer.amount)} per year.`;
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">💌</div>
    <div class="milestone-title">Your parents have made an offer</div>
    <div class="milestone-body">
      ${bodyLine}
      <br><br>
      <strong>Conditions</strong>
      <br>
      ${offer.terms.length ? offer.terms.map(term => `• ${term.label}`).join('<br>') : 'No conditions'}
    </div>
    <button class="continue-btn" onclick="acceptParentFundingOffer()">Accept offer</button>
    <button class="birth-btn secondary" onclick="rejectParentFundingOffer()">Reject offer</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}

function acceptParentFundingOffer() {
  if (!_uniParentFundingOffer) return;
  const selected = new Set((getUniversityApplicationDraft().selectedFundingSources || []).filter(Boolean));
  selected.add('parents');
  _uniApplyDraft = getUniversityApplicationDraft({
    selectedFundingSources: [...selected],
    parentalFundingAmount: _uniParentFundingOffer.amount,
    parentalFundingAmountPerYear: _uniParentFundingOffer.amount,
    parentFundingType: _uniParentFundingOffer.status || 'partial',
    parentHousingSupportPerYear: _uniParentFundingOffer.housingPerYear || 0,
    parentalFundingTerms: _uniParentFundingOffer.terms,
    parentalFundingAccepted: true,
    parentalFundingRejected: false,
    parentalFundingStopped: false,
    parentWarningIssued: false,
  });
  _uniParentFundingOffer = null;
  saveUniversityDraft();
  document.getElementById('milestone-overlay').classList.remove('open');
  _learnScreen = 'uniApplyFinances';
  renderLearnTab();
}

function rejectParentFundingOffer() {
  const selected = new Set((getUniversityApplicationDraft().selectedFundingSources || []).filter(Boolean));
  selected.delete('parents');
  _uniApplyDraft = getUniversityApplicationDraft({
    selectedFundingSources: [...selected],
    parentalFundingAccepted: false,
    parentalFundingRejected: true,
    parentFundingType: null,
    parentalFundingAmount: 0,
    parentalFundingAmountPerYear: 0,
    parentHousingSupportPerYear: 0,
    parentalFundingTerms: [],
  });
  _uniParentFundingOffer = null;
  saveUniversityDraft();
  document.getElementById('milestone-overlay').classList.remove('open');
  _learnScreen = 'uniApplyFinances';
  renderLearnTab();
}

function prepareUniversityFundingSelection() {
  const draft = getUniversityApplicationDraft();
  if (draft.fundingChoice === 'student_loan') {
    _uniApplyDraft = getUniversityApplicationDraft({
      yearlyTuitionFundingSource: 'student_loan',
      yearlyMaintenanceFundingSource: 'student_loan',
      tuitionDebtPerYear: UNIVERSITY_TUITION_FEE_PER_YEAR,
      maintenanceDebtPerYear: UNIVERSITY_MAINTENANCE_LOAN_PER_YEAR,
      maintenanceSupportPerYear: UNIVERSITY_MAINTENANCE_LOAN_PER_YEAR,
      parentalFundingAccepted: false,
      parentalFundingRejected: false,
      parentalFundingAmount: 0,
      parentalFundingAmountPerYear: 0,
      parentalFundingTerms: [],
      selfFundingEnabled: false,
      scholarshipStatus: null,
    });
    saveUniversityDraft();
    return { ok:true };
  }
  if (draft.fundingChoice === 'self_fund') {
    if ((STATE.finances?.balance || 0) < UNIVERSITY_TUITION_FEE_PER_YEAR) {
      const confirmed = window.confirm(`You have less than ${fmtMoney(UNIVERSITY_TUITION_FEE_PER_YEAR)} in the bank. Continuing will push you into debt. Are you sure?`);
      if (!confirmed) return { ok:false };
    }
    _uniApplyDraft = getUniversityApplicationDraft({
      yearlyTuitionFundingSource: 'self_fund',
      yearlyMaintenanceFundingSource: 'self_fund',
      selfFundingEnabled: true,
      parentalFundingAccepted: false,
      parentalFundingRejected: false,
      parentalFundingAmount: 0,
      parentalFundingAmountPerYear: 0,
      parentalFundingTerms: [],
      scholarshipStatus: null,
    });
    saveUniversityDraft();
    return { ok:true };
  }
  if (draft.fundingChoice === 'scholarship') {
    _uniApplyDraft = getUniversityApplicationDraft({
      scholarshipStatus: 'not_available_yet',
      parentalFundingAccepted: false,
      parentalFundingRejected: false,
      parentalFundingAmount: 0,
      parentalFundingAmountPerYear: 0,
      parentalFundingTerms: [],
    });
    saveUniversityDraft();
    showToast('Scholarship applications are not available yet.');
    return { ok:false };
  }
  if (draft.fundingChoice === 'ask_parents') {
    _uniParentFundingOffer = buildParentFundingOffer();
    _uniApplyDraft = getUniversityApplicationDraft({
      scholarshipStatus: null,
      parentalFundingAccepted: false,
      parentalFundingRejected: false,
      parentalFundingAmount: _uniParentFundingOffer.amount,
      parentalFundingAmountPerYear: _uniParentFundingOffer.amount,
      parentalFundingTerms: _uniParentFundingOffer.terms,
    });
    saveUniversityDraft();
    renderParentFundingOfferPopup();
    return { ok:false, pending:true };
  }
  return { ok:false };
}

function acceptUniversityOffer(type) {
  const postSchool = ensurePostSchoolState();
  if (!postSchool.uniApplication) return;
  postSchool.uniApplication = createUniversityApplicationState(postSchool.uniApplication);
  postSchool.uniApplication.status = 'accepted_offer';
  postSchool.uniApplication.acceptedType = type;
  postSchool.uniApplication.uniType = type;
  postSchool.uniApplication.universityType = type;
  postSchool.uniApplication.startedAge = STATE.age;
  STATE.school.level = 'uni';
  STATE.school.current = formatUniversityType(type);
  logActivity(`Accepted a place to study ${postSchool.uniApplication.course} at ${formatUniversityType(type)}.`, null);
  if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  if (typeof applyUniversityFundingForCurrentYear === 'function') applyUniversityFundingForCurrentYear();
  if (typeof getCurrentHome === 'function' && getCurrentHome()?.source === 'family' && typeof makeRentalHome === 'function' && typeof addHomeToHistory === 'function' && typeof setCurrentHome === 'function') {
    const studentHome = addHomeToHistory(makeRentalHome('rental_student_house'));
    setCurrentHome(studentHome, 'Moved out for university and into a shared student house.');
    window._playSubTab = 'home';
    window._homeView = 'household';
    showToast('You have moved into shared student housing.');
  }
  saveGame();
  closeMilestone();
  updateAllUI();
}

function rejectUniversityOffer() {
  const postSchool = ensurePostSchoolState();
  if (postSchool.uniApplication) {
    postSchool.uniApplication.status = 'declined';
    if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  }
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
    : (_learnScreen === 'uniApplyCourse' ? 'closeUniApplication()' : 'previousUniApplicationStep()');
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
  const selected = _uniApplyDraft?.fundingChoice;
  return `
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:12px">
      ${UNI_FUNDING.map(item => {
        const active = selected === item.id;
        return `
          <button onclick="selectUniApplicationField('fundingChoice', '${item.id}')"
            style="position:relative;padding:16px 14px 14px;border-radius:22px;border:1.5px solid ${active ? item.accent : 'rgba(220,212,203,.9)'};background:${active ? '#fefcff' : '#fff'};box-shadow:${active ? '0 12px 28px rgba(109,86,201,.12)' : '0 8px 20px rgba(72,48,26,.05)'};text-align:left;cursor:pointer;min-height:176px">
            <div style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;border:1.5px solid ${active ? item.accent : '#b8b0a8'};background:${active ? item.accent : '#fff'};display:flex;align-items:center;justify-content:center;color:${active ? '#fff' : 'transparent'};font-size:15px">✓</div>
            <div style="font-size:31px;color:${item.accent};line-height:1;margin-bottom:10px"><iconify-icon icon="${item.icon}"></iconify-icon></div>
            <div style="font-size:15px;font-weight:800;line-height:1.12;color:#171510;margin-bottom:8px">${item.label}</div>
            <div style="font-size:11px;line-height:1.45;color:#5f564e;min-height:48px">${item.blurb}</div>
            <div style="margin-top:12px;font-size:11px;font-weight:800;color:${item.accent}">Effect: ${item.effect}</div>
            <div style="margin-top:10px;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:${item.tagBg};color:${item.tagColor};font-size:11px;font-weight:700">${item.tag}</div>
          </button>`;
      }).join('')}
    </div>`;
}

function buildUniPreviewCard() {
  const course = getUniCourseConfig(_uniApplyDraft?.course || 'Law');
  const uniType = getUniTypeConfig(_uniApplyDraft?.uniType || 'Top Universities');
  const funding = getUniFundingConfig(_uniApplyDraft?.fundingChoice || _uniApplyDraft?.funding || 'student_loan');
  const preview = UNI_TYPE_PREVIEW[uniType.id] || UNI_TYPE_PREVIEW['Top Universities'];
  const playerGrade = gradeFromScore(STATE.school.gradeScore || 0);
  const eligible = isEligibleForUniType(uniType.id, STATE.school.gradeScore);
  const requirement = getUniRequirementLabel(uniType.id);
  const chance = universityAcceptanceChance({
    course: _uniApplyDraft?.course || course.id,
    uniType: _uniApplyDraft?.uniType || uniType.id,
    funding: _uniApplyDraft?.fundingChoice || _uniApplyDraft?.funding || funding.id,
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
              <div style="font-size:18px;font-weight:800;color:#191611;line-height:1.15;margin-top:8px">${funding.label}</div>
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
  _uniApplyDraft = getUniversityApplicationDraft();
  const courseReady = !!_uniApplyDraft.course;
  const fundingReady = !!_uniApplyDraft.fundingChoice;
  const typeReady = !!_uniApplyDraft.uniType;
  if (_learnScreen === 'uniApplyCourse') {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
        ${buildUniPageHeader('Choose Course', 'Pick the degree you want to study first.')}
        <div>
          ${buildUniSectionTitle(1, 'Choose Course', 'Swipe to explore')}
          ${buildUniCourseCards()}
        </div>
        <button onclick="nextUniApplicationStep()"
          style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${courseReady ? '#6d56c9' : '#d9d0c5'};background:${courseReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${courseReady ? '#fff' : '#a0968c'};box-shadow:${courseReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
          <span style="font-size:15px;font-weight:800">Next: Plan Finances</span>
          <span style="font-size:20px;line-height:1">›</span>
        </button>
      </div>`;
  }
  if (_learnScreen === 'uniApplyFinances') {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
        ${buildUniPageHeader('Plan Finances', 'Choose how you will pay for tuition and living costs.')}
        <div>
          ${buildUniSectionTitle(2, 'Plan Finances')}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div style="padding:14px;border-radius:18px;background:#fff;border:1px solid #ede4d8">
              <div style="font-size:11px;font-weight:800;color:#7b7268;letter-spacing:.04em;text-transform:uppercase">Tuition Fees</div>
              <div style="font-size:23px;font-weight:900;color:#191611;margin-top:6px">£9,000</div>
              <div style="font-size:12px;line-height:1.45;color:#675f57;margin-top:6px">Per year for the degree itself.</div>
            </div>
            <div style="padding:14px;border-radius:18px;background:#fff;border:1px solid #ede4d8">
              <div style="font-size:11px;font-weight:800;color:#7b7268;letter-spacing:.04em;text-transform:uppercase">Maintenance</div>
              <div style="font-size:23px;font-weight:900;color:#191611;margin-top:6px">£6,500</div>
              <div style="font-size:12px;line-height:1.45;color:#675f57;margin-top:6px">Student loan support for rent and living costs.</div>
            </div>
          </div>
          ${buildUniFundingCards()}
        </div>
        <button onclick="nextUniApplicationStep()"
          style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${fundingReady ? '#6d56c9' : '#d9d0c5'};background:${fundingReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${fundingReady ? '#fff' : '#a0968c'};box-shadow:${fundingReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
          <span style="font-size:15px;font-weight:800">Next: University Type</span>
          <span style="font-size:20px;line-height:1">›</span>
        </button>
      </div>`;
  }
  return `
    <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Choose University Type', 'Pick the level you want to apply for.')}
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:#fff;border:1px solid #ece4da;font-size:11px;font-weight:700;color:#4f4741"><iconify-icon icon="mdi:book-open-variant" style="font-size:15px"></iconify-icon>${_uniApplyDraft.course || 'Course'}</div>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:#fff;border:1px solid #ece4da;font-size:11px;font-weight:700;color:#4f4741"><iconify-icon icon="${getUniFundingConfig(_uniApplyDraft.fundingChoice || 'student_loan').icon}" style="font-size:15px"></iconify-icon>${getUniFundingConfig(_uniApplyDraft.fundingChoice || 'student_loan').label}</div>
      </div>
      <div>
        ${buildUniSectionTitle(3, 'Choose University Type')}
        ${buildUniTypeCards()}
      </div>
      <button onclick="nextUniApplicationStep()"
        style="width:100%;padding:18px 18px;border-radius:24px;border:1px solid ${typeReady ? '#6d56c9' : '#d9d0c5'};background:${typeReady ? 'linear-gradient(90deg, #6d56c9, #846be6)' : '#ebe5dd'};color:${typeReady ? '#fff' : '#a0968c'};box-shadow:${typeReady ? '0 18px 36px rgba(109,86,201,.22)' : 'none'};display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer">
        <iconify-icon icon="mdi:email-outline" style="font-size:24px"></iconify-icon>
        <div style="text-align:left">
          <div style="font-size:15px;font-weight:800;line-height:1.05">Submit UCAS Application</div>
          <div style="font-size:12px;font-weight:600;opacity:.86;margin-top:4px">${typeReady ? 'Results will arrive when you age up.' : 'Choose a university type first.'}</div>
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
  _learnScreen = STATE.school?.level === 'uni' ? 'uniPeople' : 'classmates';
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

function getLearnSchoolReputation(type) {
  return {
    'State Primary': 3,
    'State Secondary': 3,
    'State Sixth Form': 3,
    'Grammar School': 4,
    'Grammar Sixth Form': 4,
    'Private School': 4,
    'Private Sixth Form': 4,
    'Elite Prep School': 5,
    'Elite Boarding School': 5,
    'Elite Sixth Form': 5,
  }[type] || 3;
}

function getLearnSchoolYearLabel(level, age) {
  if (level === 'primary') return `Year ${clamp(age - 5, 1, 6)}`;
  if (level === 'secondary') return `Year ${clamp(age - 5, 7, 11)}`;
  if (level === 'college') return `Year ${clamp(age - 4, 12, 13)}`;
  return 'School';
}

function getLearnSchoolGradeTone(grade) {
  if (['A+', 'A', 'B'].includes(grade)) {
    return {
      background: 'linear-gradient(180deg, #e8f7d8 0%, #d8f0c6 100%)',
      color: '#6abf4b',
    };
  }
  if (['C', 'D'].includes(grade)) {
    return {
      background: 'linear-gradient(180deg, #fde7c4 0%, #f9d6a0 100%)',
      color: '#e48c1f',
    };
  }
  return {
    background: 'linear-gradient(180deg, #f9d7d3 0%, #f4c2bc 100%)',
    color: '#de5547',
  };
}

function buildLearnSchoolStars(type) {
  return `<span class="learn-school-stars">${Array.from({ length: getLearnSchoolReputation(type) }, () => '★').join('')}</span>`;
}

function buildLearnHeroSchool(edu, grade) {
  const illustration = 'data/state_primary.png';
  const schoolType = edu.type?.[edu.level] || 'State Primary';
  const gradeTone = getLearnSchoolGradeTone(grade);
  const schoolName = edu.current || 'School';
  const yearLabel = getLearnSchoolYearLabel(edu.level, STATE.age);
  return `
    <div class="learn-school-hero">
      <div class="learn-school-hero-inner">
        <div class="learn-school-hero-copy">
          <div class="learn-school-name">${schoolName}</div>
          <div class="learn-school-meta">
            <span>${schoolType}</span>
            ${buildLearnSchoolStars(schoolType)}
          </div>
          <div class="learn-school-yearline">${yearLabel} • Age ${STATE.age}</div>
        </div>
        <div class="learn-school-hero-side">
          <div class="learn-school-grade" style="background:${gradeTone.background}">
            <div class="learn-school-grade-label">Grade</div>
            <div class="learn-school-grade-value" style="color:${gradeTone.color}">${grade}</div>
          </div>
          <img src="${illustration}" alt="School illustration" class="learn-school-illustration" />
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
  const course = postSchool.uniApplication?.course || 'University';
  const existingPeople = STATE.school.uniProfile?.people || [];
  const existingCoursemates = existingPeople.filter(person => person.label !== 'Lecturer');
  const existingLecturers = existingPeople.filter(person => person.label === 'Lecturer');
  const needsRefresh = !STATE.school.uniProfile
    || existingCoursemates.length !== 10
    || existingLecturers.length !== 2
    || existingCoursemates.some(person => person.degreeCourse !== course)
    || existingLecturers.some(person => person.degreeCourse !== course);

  if (needsRefresh) {
    const baseAge = Math.max(18, STATE.age);
    const coursemates = Array.from({ length: 10 }, (_, index) => {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const classmate = {
        id: `uni-coursemate-${index}-${uid()}`,
        label: 'Coursemate',
        role: 'Friend',
        firstName: pickRandom(NAMES_UK[gender]),
        surname: pickRandom(NAMES_UK.surnames),
        age: clamp(baseAge + Math.floor(Math.random() * 3) - 1, 18, 26),
        appearance: generateAppearance(gender),
        degreeCourse: course,
        status: 'classmate',
        relationship: Math.floor(Math.random() * 31) + 35,
        educationLevel: 'University',
        currentEducation: course,
        relationshipStatus: Math.random() < 0.82 ? 'Single' : 'Talking to someone',
        socialGroup: 'Coursemate',
        traits: typeof sampleN === 'function' ? sampleN(CLASSMATE_TRAITS_POOL, 2).map(trait => trait.id) : [],
      };
      if (typeof ensureNpcCoreFields === 'function') {
        ensureNpcCoreFields(classmate, { role: 'classmate', socialGroup: 'university friend' });
      }
      return classmate;
    });
    const lecturers = Array.from({ length: 2 }, (_, index) => {
      const gender = Math.random() > 0.45 ? 'male' : 'female';
      const lecturer = {
        id: `uni-lecturer-${index}-${uid()}`,
        label: 'Lecturer',
        role: 'Teacher',
        title: Math.random() < 0.75 ? 'Dr' : 'Professor',
        firstName: pickRandom(NAMES_UK[gender]),
        surname: pickRandom(NAMES_UK.surnames),
        age: 35 + Math.floor(Math.random() * 33),
        appearance: generateAppearance(gender),
        degreeCourse: course,
        subject: course,
      };
      if (typeof ensureNpcCoreFields === 'function') {
        ensureNpcCoreFields(lecturer, { role: 'teacher' });
      }
      return lecturer;
    });
    STATE.school.uniProfile = {
      people: [...coursemates, ...lecturers],
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
  const uniType = STATE.school.current || 'University';
  const { course, totalYears, currentYear } = getUniversityYearMeta();
  const grade = gradeFromScore(STATE.school.gradeScore || 0);
  const gradeTone = {
    background: 'linear-gradient(180deg, #f2ebff 0%, #ece3ff 100%)',
    color: '#7458d5',
  };
  return `
    <div class="learn-school-hero" style="background:linear-gradient(180deg, #fffefe 0%, #faf7ff 100%);border:1px solid rgba(224,212,242,0.95)">
      <div class="learn-school-hero-inner">
        <div class="learn-school-hero-copy">
          <div style="display:inline-flex;align-items:center;width:fit-content;background:#ede4ff;border-radius:999px;padding:7px 14px;font-size:11px;font-weight:800;color:#6957c3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px">University</div>
          <div class="learn-school-name" style="color:#172039">${uniType}</div>
          <div class="learn-school-yearline" style="color:#6d6587">${course} • Year ${currentYear} of ${totalYears}</div>
        </div>
        <div class="learn-school-hero-side">
          <div class="learn-school-grade" style="background:${gradeTone.background}">
            <div class="learn-school-grade-label">Grade</div>
            <div class="learn-school-grade-value" style="color:${gradeTone.color}">${grade}</div>
          </div>
          <img src="${UNI_PREVIEW_IMAGE}" alt="University illustration" class="learn-school-illustration" />
        </div>
      </div>
    </div>`;
}

function buildUniversityPerformanceSection() {
  return '';
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
  return '';
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
  return buildUniversityHomeScreen();
}

function ensureUniversityCommitmentState() {
  if (!STATE.education) STATE.education = {};
  if (!STATE.volunteering) STATE.volunteering = { currentRole:null };
  if (!('currentInternship' in STATE.education)) STATE.education.currentInternship = null;
  if (!('currentPlacement' in STATE.education)) STATE.education.currentPlacement = null;
  if (!('isCourseRep' in STATE.education)) STATE.education.isCourseRep = false;
  if (!('courseRepTitle' in STATE.education)) STATE.education.courseRepTitle = null;
  return STATE.education;
}

function getUniversityCoursemates() {
  const uni = ensureUniversityState();
  return (uni.people || []).filter(person => person.label !== 'Lecturer');
}

function getUniversityLecturers() {
  const uni = ensureUniversityState();
  return (uni.people || []).filter(person => person.label === 'Lecturer');
}

function getUniversityPersonById(personId) {
  const uni = ensureUniversityState();
  return (uni.people || []).find(person => person.id === personId) || null;
}

function getUniversityCoursemateById(personId) {
  return getUniversityCoursemates().find(person => person.id === personId) || null;
}

function getUniversityCurrentCommitment() {
  ensureUniversityCommitmentState();
  if (STATE.education.currentInternship) return { type:'internship', title:STATE.education.currentInternship.title, subtitle:STATE.education.currentInternship.subtitle || 'Current internship' };
  if (STATE.education.currentPlacement) return { type:'placement', title:STATE.education.currentPlacement.title, subtitle:STATE.education.currentPlacement.subtitle || 'Current placement' };
  if (STATE.education.isCourseRep) return { type:'course_rep', title:STATE.education.courseRepTitle || 'Course Representative', subtitle:'Represent your course and students' };
  if (STATE.volunteering?.currentRole) return { type:'volunteering', title:STATE.volunteering.currentRole.title, subtitle:STATE.volunteering.currentRole.subtitle || 'Current volunteering role' };
  if (STATE.career?.job && STATE.career.job !== 'None') return { type:'job', title:`Part-Time Job at ${STATE.career.companyName || 'Campus Workplace'}`, subtitle:'Earn money alongside your studies' };
  return null;
}

function isUniversityFinalTwoYears() {
  const { totalYears, currentYear } = getUniversityYearMeta();
  return currentYear >= Math.max(1, totalYears - 1);
}

function buildUniversityMainSectionList() {
  return `
    <div class="learn-school-actions">
      ${buildLearnSchoolNavCard({
        screen: 'uniActions',
        icon: 'action',
        iconColor: '#8d67da',
        tileColor: '#efe5ff',
        title: 'Actions',
        subtitle: 'Attend lectures and manage your course',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'uniSocial',
        icon: 'social',
        iconColor: '#87c469',
        tileColor: '#d9efce',
        title: 'Social',
        subtitle: 'Friends, nights out, societies and clubs',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'uniPeople',
        icon: 'classmates',
        iconColor: '#a887d9',
        tileColor: '#e6daf7',
        title: 'Coursemates and Lecturers',
        subtitle: 'See the people on your degree',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'uniCareers',
        icon: 'careers',
        iconColor: '#6098e4',
        tileColor: '#d8e8fb',
        title: 'Careers',
        subtitle: 'Internships, networking and volunteering',
      })}
    </div>`;
}

function buildUniversityCommitmentCard() {
  const commitment = getUniversityCurrentCommitment();
  if (!commitment) {
    return `
      <button onclick="openJobBoard('part-time')"
        style="width:100%;margin-top:18px;padding:18px 16px;border-radius:24px;background:#fff;border:1px solid rgba(231,221,209,0.95);box-shadow:0 12px 28px rgba(64,42,22,0.05);display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;text-align:left">
        <div style="display:flex;align-items:center;gap:14px;min-width:0">
          <div style="width:54px;height:54px;border-radius:18px;background:#fce9d9;display:flex;align-items:center;justify-content:center;color:#ec9c42;flex-shrink:0">
            <iconify-icon icon="mdi:briefcase-outline" style="font-size:25px"></iconify-icon>
          </div>
          <div style="min-width:0">
            <div style="font-size:11px;font-weight:800;color:#d78e36;letter-spacing:.08em;text-transform:uppercase">Work</div>
            <div style="font-size:15px;font-weight:800;color:#171510;line-height:1.15;margin-top:4px">Apply for a Part-Time Job</div>
            <div style="font-size:12px;color:#6f665f;line-height:1.35;margin-top:5px">Earn money alongside your studies</div>
          </div>
        </div>
        <span style="font-size:24px;line-height:1;color:#9a9087;flex-shrink:0">›</span>
      </button>`;
  }
  return `
    <button onclick="openLearnScreen('uniCommitment')"
      style="width:100%;margin-top:18px;padding:18px 16px;border-radius:24px;background:#fff;border:1px solid rgba(231,221,209,0.95);box-shadow:0 12px 28px rgba(64,42,22,0.05);display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;text-align:left">
      <div style="display:flex;align-items:center;gap:14px;min-width:0">
        <div style="width:54px;height:54px;border-radius:18px;background:#fce9d9;display:flex;align-items:center;justify-content:center;color:#ec9c42;flex-shrink:0">
          <iconify-icon icon="mdi:briefcase-outline" style="font-size:25px"></iconify-icon>
        </div>
        <div style="min-width:0">
          <div style="font-size:11px;font-weight:800;color:#d78e36;letter-spacing:.08em;text-transform:uppercase">Current Commitment</div>
          <div style="font-size:15px;font-weight:800;color:#171510;line-height:1.15;margin-top:4px">${commitment.title}</div>
          <div style="font-size:12px;color:#6f665f;line-height:1.35;margin-top:5px">${commitment.subtitle}</div>
        </div>
      </div>
      <span style="font-size:24px;line-height:1;color:#9a9087;flex-shrink:0">›</span>
    </button>`;
}

function buildUniversityHomeScreen() {
  return `
    <div style="display:flex;flex-direction:column;gap:0">
      ${buildUniversityMainSectionList()}
      ${buildUniversityCommitmentCard()}
    </div>`;
}

const UNIVERSITY_ACTION_ITEMS = [
  ['attend_lecture', 'Attend Lecture', 'Stay on top of your course'],
  ['skip_lecture', 'Skip Lecture', 'Trade discipline for free time'],
  ['study_library', 'Study in Library', 'Quiet revision time'],
  ['revise_exams', 'Revise for Exams', 'Push your grades up'],
  ['pull_all_nighter', 'Pull All-Nighter', 'Short-term gains, rough morning'],
  ['use_ai_assignment_uni', 'Use AI for Assignment', 'Risky shortcut'],
  ['plagiarise_assignment_uni', 'Plagiarise Assignment', 'High risk, high consequence'],
];

const UNIVERSITY_SOCIAL_ITEMS = [
  ['go_clubbing', 'Go Clubbing', 'Blow off steam'],
  ['attend_house_party', 'Attend House Party', 'Meet more students'],
  ['throw_house_party', 'Throw House Party', 'Host the night'],
  ['host_pre_drinks', 'Host Pre-Drinks', 'Warm up before going out'],
  ['make_new_friends_uni', 'Make New Friends', 'Grow your circle'],
  ['ask_someone_out_uni', 'Ask Someone Out', 'See where it goes'],
  ['join_society', 'Join a Society', 'Browse university societies'],
  ['join_club', 'Join a Club', 'Browse university clubs'],
];

const UNIVERSITY_CAREER_ITEMS = [
  ['apply_summer_internship', 'Apply for Summer Internship', 'Build experience early'],
  ['apply_graduate_scheme', 'Apply for Graduate Scheme', 'Only in your final two years', { finalTwoYearsOnly:true }],
  ['go_careers_fair', 'Go to Careers Fair', 'See future options'],
  ['attend_networking_event', 'Attend Networking Event', 'Meet useful people'],
  ['get_career_advice', 'Get Career Advice', 'Ask for guidance'],
  ['become_course_rep', 'Become Course Representative', 'Stand up for your course'],
  ['start_volunteering', 'Volunteer', 'Boost your CV and help out'],
];

const UNIVERSITY_SOCIETIES = ['Law Society', 'Medicine Society', 'Finance Society', 'Dance Society', 'Gaming Society', 'Fashion Society', 'Film Society', 'Psychology Society'];
const UNIVERSITY_CLUBS = ['Chess Club', 'Debate Club', 'Football Club', 'Rugby Club', 'Tennis Club', 'Swimming Club', 'Drama Club', 'Music Club', 'Boxing Club'];

function buildUniversitySubPageHeader(title, subtitle) {
  const backAction = (_learnScreen === 'uniSocietyList' || _learnScreen === 'uniClubList')
    ? `openLearnScreen('uniSocial')`
    : 'closeLearnSubscreen()';
  return `
    <div class="learn-school-page-head">
      <button class="learn-school-back" onclick="${backAction}"><span style="font-size:20px;line-height:1">‹</span></button>
      <div>
        <div class="learn-school-page-title">${title}</div>
        <div class="learn-school-page-sub">${subtitle}</div>
      </div>
    </div>`;
}

function buildUniversityListRow(title, subtitle, onclick, tag = '') {
  return `
    <button class="learn-school-placeholder-card" onclick="${onclick}">
      <div class="learn-school-placeholder-copy">
        <div class="learn-school-placeholder-title">${title}</div>
        <div class="learn-school-placeholder-sub">${subtitle}</div>
      </div>
      <div class="learn-school-pill">${tag || '›'}</div>
    </button>`;
}

function openLearnUniversityCoursemateDetail(personId) {
  openLearnClassmateDetail(personId);
}

function closeLearnUniversityCoursemateDetail() {
  _learnScreen = 'uniPeople';
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function buildUniversityPeopleSummary() {
  const coursemates = getUniversityCoursemates();
  const friendsCount = coursemates.filter(c => c.status === 'friend').length;
  const averageRelationship = coursemates.length
    ? Math.round(coursemates.reduce((sum, person) => sum + (person.relationship || 0), 0) / coursemates.length)
    : 0;
  const lecturerCount = getUniversityLecturers().length;
  return `
    <div class="learn-classmates-summary">
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#68b649">
          ${buildLearnSchoolNavIcon('classmates')}
        </div>
        <div class="learn-classmates-metric-label">Friends</div>
        <div class="learn-classmates-metric-value">${friendsCount}</div>
      </div>
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#8d67da">
          ${buildLearnSchoolNavIcon('classmates')}
        </div>
        <div class="learn-classmates-metric-label">Average Bond</div>
        <div class="learn-classmates-metric-value">${averageRelationship}%</div>
      </div>
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#6098e4">
          ${buildLearnSchoolNavIcon('teachers')}
        </div>
        <div class="learn-classmates-metric-label">Lecturers</div>
        <div class="learn-classmates-metric-value">${lecturerCount}</div>
      </div>
    </div>`;
}

function buildUniversityLecturerCard(person) {
  return `
    <button class="learn-school-teacher-card" onclick="openPersonSheet('${person.id}','Teacher')">
      <div class="learn-school-teacher-avatar">
        ${getCharacterHTML(person.appearance, person.age || 50, 52, { showBg: false })}
      </div>
      <div class="learn-school-teacher-copy">
        <div class="learn-school-teacher-title">${person.title} ${person.firstName} ${person.surname}</div>
        <div class="learn-school-teacher-sub">${person.degreeCourse} lecturer • Age ${person.age}</div>
      </div>
    </button>`;
}

function buildUniversityCoursematesScreen() {
  const coursemates = getUniversityCoursemates();
  return `
    <div class="learn-classmates-page">
      <div class="learn-classmates-header">
        <button class="learn-classmates-back" onclick="closeLearnSubscreen()"><span style="font-size:20px;line-height:1">‹</span><span>Back</span></button>
        <div class="learn-classmates-heading">Coursemates (${coursemates.length})</div>
        <div></div>
      </div>
      ${buildUniversityPeopleSummary()}
      <div class="learn-classmates-list">
        ${coursemates.map(c => {
          return buildLearnClassmateRow(c).replace(
            `openLearnClassmateDetail('${c.id}')`,
            `openLearnUniversityCoursemateDetail('${c.id}')`
          );
        }).join('')}
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8c8175;margin:18px 0 10px">Lecturers</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${getUniversityLecturers().map(person => buildUniversityLecturerCard(person)).join('')}
      </div>
    </div>`;
}

function buildUniversityActionPage() {
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Actions', 'Simple academic choices while you study.')}
      <div style="margin-top:18px">
        ${UNIVERSITY_ACTION_ITEMS.map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, 'Action')).join('')}
      </div>
    </div>`;
}

function buildUniversitySocialPage() {
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Social', 'Nights out, friendships and campus life.')}
      <div style="margin-top:18px">
        ${UNIVERSITY_SOCIAL_ITEMS.map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, id === 'join_society' ? 'Society' : id === 'join_club' ? 'Club' : 'Social')).join('')}
      </div>
    </div>`;
}

function buildUniversitySocietyListPage() {
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Societies', 'Browse student societies.')}
      <div style="margin-top:18px">
        ${UNIVERSITY_SOCIETIES.map(name => buildUniversityListRow(name, 'Join and get involved', `showToast('${name} coming soon.')`, 'Society')).join('')}
      </div>
    </div>`;
}

function buildUniversityClubListPage() {
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Clubs', 'Browse student clubs.')}
      <div style="margin-top:18px">
        ${UNIVERSITY_CLUBS.map(name => buildUniversityListRow(name, 'Join and get involved', `showToast('${name} coming soon.')`, 'Club')).join('')}
      </div>
    </div>`;
}

function buildUniversityPeoplePage() {
  return buildUniversityCoursematesScreen();
}

function buildUniversityCareersPage() {
  const items = UNIVERSITY_CAREER_ITEMS.filter(item => !item[3]?.finalTwoYearsOnly || isUniversityFinalTwoYears());
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Careers', 'Plan your future while you study.')}
      ${items.map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, 'Career')).join('')}
    </div>`;
}

function buildUniversityCommitmentPage() {
  const commitment = getUniversityCurrentCommitment();
  if (!commitment) {
    return `
      <div class="learn-school-page">
        ${buildUniversitySubPageHeader('Current Commitment', 'No current commitment yet.')}
        ${buildUniversityListRow('Apply for a Part-Time Job', 'Earn money alongside your studies', `openJobBoard('part-time')`, 'Work')}
      </div>`;
  }
  const rowsByType = {
    job: [
      ['uni_commitment_work_harder', 'Work Harder', 'Push for a stronger impression'],
      ['uni_commitment_slack_off', 'Slack Off', 'Take it easier for a while'],
      ['uni_commitment_more_shifts', 'Ask for More Shifts', 'Try to earn more'],
      ['uni_commitment_quit', 'Quit Job', 'Walk away from the role'],
    ],
    internship: [
      ['uni_commitment_network', 'Network', 'Meet useful people'],
      ['uni_commitment_work_harder', 'Work Harder', 'Push for a stronger impression'],
      ['uni_commitment_slack_off', 'Slack Off', 'Risk a weaker impression'],
      ['uni_commitment_coffee_chat', 'Have a Coffee Chat', 'Build a connection'],
      ['uni_commitment_impress', 'Impress', 'Try to stand out'],
    ],
    placement: [
      ['uni_commitment_network', 'Network', 'Meet useful people'],
      ['uni_commitment_work_harder', 'Work Harder', 'Push for a stronger impression'],
      ['uni_commitment_slack_off', 'Slack Off', 'Risk a weaker impression'],
    ],
    course_rep: [
      ['uni_commitment_impress', 'Represent Your Course', 'Speak up for students'],
      ['uni_commitment_network', 'Meet Staff', 'Build your contacts'],
    ],
    volunteering: [
      ['uni_commitment_work_harder', 'Show Up Early', 'Be dependable'],
      ['uni_commitment_network', 'Meet People', 'Grow your circle'],
    ],
  };
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Current Commitment', commitment.subtitle)}
      <div class="learn-school-note-card">
        <div class="learn-school-note-label">Current Commitment</div>
        <div class="learn-school-note-copy">${commitment.title}</div>
      </div>
      ${(rowsByType[commitment.type] || rowsByType.job).map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, 'Action')).join('')}
    </div>`;
}

function runUniversityAction(actionId) {
  ensureUniversityCommitmentState();
  const coursemates = getUniversityCoursemates();
  const randomCoursemate = coursemates[Math.floor(Math.random() * coursemates.length)] || null;
  const logAndRefresh = (log, toast) => {
    if (log) logActivity(log, null);
    saveGame();
    renderLearnTab();
    if (toast) showToast(toast);
  };

  if (actionId === 'attend_lecture') {
    applyEffects({ smarts:+3, gradeScore:+4 });
    return logAndRefresh('Attended your lectures and stayed on top of the material.', 'You kept up with the course.');
  }
  if (actionId === 'skip_lecture') {
    applyEffects({ happy:+2, gradeScore:-3 });
    return logAndRefresh('Skipped a lecture and bought yourself some free time.', 'You skipped class.');
  }
  if (actionId === 'study_library') {
    applyEffects({ smarts:+4, gradeScore:+5, happy:-1 });
    return logAndRefresh('Put in a quiet study session in the library.', 'Library session done.');
  }
  if (actionId === 'revise_exams') {
    applyEffects({ gradeScore:+6, smarts:+2, happy:-2 });
    return logAndRefresh('Revised hard for your exams.', 'Revision helped.');
  }
  if (actionId === 'pull_all_nighter') {
    applyEffects({ gradeScore:+4, health:-3, happy:-3 });
    return logAndRefresh('Pulled an all-nighter to get through your workload.', 'You are exhausted.');
  }
  if (actionId === 'use_ai_assignment_uni') {
    applyEffects({ gradeScore:+4 });
    if (Math.random() < 0.32) {
      applyEffects({ rep:-4, gradeScore:-6 });
      return logAndRefresh('You were questioned about using AI on an assignment.', 'You got away with less than you hoped.');
    }
    return logAndRefresh('Used AI to speed up an assignment and it seemed to work.', 'Nobody called it out.');
  }
  if (actionId === 'plagiarise_assignment_uni') {
    if (Math.random() < 0.58) {
      applyEffects({ rep:-8, gradeScore:-10 });
      return logAndRefresh('You were caught plagiarising an assignment.', 'Plagiarism backfired.');
    }
    applyEffects({ gradeScore:+5 });
    return logAndRefresh('You plagiarised an assignment and got away with it.', 'You were not caught.');
  }
  if (actionId === 'go_clubbing' || actionId === 'attend_house_party' || actionId === 'throw_house_party' || actionId === 'host_pre_drinks') {
    applyEffects({ happy:+4, rel_friends:+3 });
    if (randomCoursemate) randomCoursemate.relationship = clamp((randomCoursemate.relationship || 50) + 8);
    return logAndRefresh('You leaned into the social side of university.', 'Your social life picked up.');
  }
  if (actionId === 'join_society') {
    openLearnScreen('uniSocietyList');
    return;
  }
  if (actionId === 'join_club') {
    openLearnScreen('uniClubList');
    return;
  }
  if (actionId === 'make_new_friends_uni') {
    if (randomCoursemate) randomCoursemate.relationship = clamp((randomCoursemate.relationship || 50) + 14);
    applyEffects({ rel_friends:+5, happy:+2 });
    return logAndRefresh(`You made more of an effort with people on your course${randomCoursemate ? `, especially ${randomCoursemate.firstName}` : ''}.`, 'You met more people.');
  }
  if (actionId === 'ask_someone_out_uni') {
    applyEffects({ happy:+2 });
    return logAndRefresh('You asked someone out from your university circle.', 'You put yourself out there.');
  }
  if (actionId === 'apply_summer_internship') {
    if (!STATE.education.currentInternship) {
      STATE.education.currentInternship = { title:'Summer Internship at Green & Co', subtitle:'Current summer internship' };
      return logAndRefresh('You landed a summer internship at Green & Co.', 'Internship secured.');
    }
    return logAndRefresh('You already have an internship lined up.', 'You already have one.');
  }
  if (actionId === 'apply_graduate_scheme') {
    return logAndRefresh('You started applying for graduate schemes.', 'Applications sent.');
  }
  if (actionId === 'go_careers_fair') {
    applyEffects({ rep:+2, rel_friends:+1 });
    return logAndRefresh('You spent time at the careers fair and scoped out future options.', 'You explored your options.');
  }
  if (actionId === 'attend_networking_event') {
    applyEffects({ rep:+3, rel_friends:+2 });
    return logAndRefresh('You attended a networking event and made useful contacts.', 'You met useful people.');
  }
  if (actionId === 'get_career_advice') {
    applyEffects({ smarts:+1, happy:+1 });
    return logAndRefresh('You asked for career advice and got a clearer view of what comes next.', 'You got some useful advice.');
  }
  if (actionId === 'become_course_rep') {
    STATE.education.isCourseRep = true;
    STATE.education.courseRepTitle = 'Course Representative';
    return logAndRefresh('You became the course representative.', 'You are now course rep.');
  }
  if (actionId === 'start_volunteering') {
    STATE.volunteering.currentRole = { title:'Volunteer Role at Community Hub', subtitle:'Current volunteering role' };
    return logAndRefresh('You started volunteering alongside university.', 'You started volunteering.');
  }
  if (actionId === 'uni_commitment_work_harder') {
    if (getUniversityCurrentCommitment()?.type === 'job') return runCareerAction('work_hard');
    applyEffects({ rep:+2, happy:-1 });
    return logAndRefresh('You put more effort into your current commitment.', 'You pushed harder.');
  }
  if (actionId === 'uni_commitment_slack_off') {
    if (getUniversityCurrentCommitment()?.type === 'job') return runCareerAction('slack_off');
    applyEffects({ happy:+1, rep:-2 });
    return logAndRefresh('You coasted a little in your current commitment.', 'You took it easier.');
  }
  if (actionId === 'uni_commitment_more_shifts') {
    STATE.finances.balance += 250;
    return logAndRefresh('You asked for more shifts and earned a bit more money.', 'More shifts picked up.');
  }
  if (actionId === 'uni_commitment_quit') {
    if (getUniversityCurrentCommitment()?.type === 'job') {
      fireFromJob('You quit your part-time role.');
    } else if (STATE.education.currentInternship) {
      STATE.education.currentInternship = null;
    } else if (STATE.education.currentPlacement) {
      STATE.education.currentPlacement = null;
    } else if (STATE.education.isCourseRep) {
      STATE.education.isCourseRep = false;
      STATE.education.courseRepTitle = null;
    } else if (STATE.volunteering?.currentRole) {
      STATE.volunteering.currentRole = null;
    }
    return logAndRefresh('You stepped away from your current commitment.', 'Commitment ended.');
  }
  if (actionId === 'uni_commitment_network') {
    applyEffects({ rep:+3, rel_friends:+2 });
    return logAndRefresh('You used your commitment to meet more people.', 'You built connections.');
  }
  if (actionId === 'uni_commitment_coffee_chat') {
    applyEffects({ happy:+2, rel_friends:+2 });
    return logAndRefresh('You had a coffee chat that could help later.', 'Good conversation.');
  }
  if (actionId === 'uni_commitment_impress') {
    applyEffects({ rep:+4 });
    return logAndRefresh('You made a strong impression in your current commitment.', 'You stood out.');
  }
  showToast('Coming soon.');
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
  const showFurtherEducation = graduated && canAccessFurtherEducation();
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
  const traits = canRevealClassmateTraits(c) ? (c.traits || []).slice(0, 1).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}" style="font-size:10px;padding:3px 8px">${t.label}</span>`;
  }).join('') : '';
  const role = c.status === 'friend' ? 'Friend' : 'Classmate';
  return `
    <button class="learn-classmates-card" onclick="openLearnClassmateDetail('${c.id}')">
      <div class="learn-classmates-avatar">
        ${getCharacterHTML(c.appearance, STATE.age, 58, { showBg: false })}
      </div>
      <div class="learn-classmates-card-copy">
        <div class="learn-classmates-card-name" style="${isClassmateCrush(c) ? 'color:#db2777' : ''}">${classmateDisplayName(c)}</div>
        <div class="learn-classmates-card-role">${role}</div>
        ${traits ? `<div class="learn-classmates-card-traits">${traits}</div>` : ''}
        <div class="learn-classmates-card-barrow">
          <div class="learn-classmates-card-bar">
            <div class="learn-classmates-card-fill" style="width:${clamp(c.relationship)}%"></div>
          </div>
          <span class="learn-classmates-card-value">${c.relationship}%</span>
        </div>
      </div>
      <span class="learn-classmates-card-arrow">›</span>
    </button>`;
}

function buildLearnClassmatesSummary(edu) {
  const friendsCount = (edu.classmates || []).filter(c => c.status === 'friend').length;
  const popularity = clamp(STATE.stats.popularity || 0);
  const enemiesCount = 0;
  return `
    <div class="learn-classmates-summary">
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#68b649">
          ${buildLearnSchoolNavIcon('classmates')}
        </div>
        <div class="learn-classmates-metric-label">Friends</div>
        <div class="learn-classmates-metric-value">${friendsCount}</div>
      </div>
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#ffcc62">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 17.27l6.18 3.73l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/></svg>
        </div>
        <div class="learn-classmates-metric-label">Popularity</div>
        <div class="learn-classmates-metric-value">${popularity}%</div>
      </div>
      <div class="learn-classmates-metric">
        <div class="learn-classmates-metric-icon" style="color:#c65110">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>
        </div>
        <div class="learn-classmates-metric-label">Enemies</div>
        <div class="learn-classmates-metric-value">${enemiesCount}</div>
      </div>
    </div>`;
}

function buildLearnClassmatesScreen(edu) {
  return `
    <div class="learn-classmates-page">
      <div class="learn-classmates-header">
        <button class="learn-classmates-back" onclick="closeLearnClassmatesScreen()"><span style="font-size:20px;line-height:1">‹</span><span>Back</span></button>
        <div class="learn-classmates-heading">Classmates (${edu.classmates.length})</div>
        <div></div>
      </div>
      ${buildLearnClassmatesSummary(edu)}
      <div class="learn-classmates-list">
        ${edu.classmates.map(c => buildLearnClassmateRow(c)).join('')}
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
  const resolvedRole = c.status === 'friend' ? 'Friend' : 'classmate';
  const sectionLabel = c.status === 'friend' ? 'Friend' : 'Classmate';
  const traits = canRevealClassmateTraits(c) ? (c.traits || []).slice(0, 3).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}" style="font-size:10px;padding:3px 8px">${t.label}</span>`;
  }).join('') : '';
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <button onclick="closeLearnClassmateDetail()"
          style="padding:0;background:none;border:none;font-size:13px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:6px;cursor:pointer">
          <span style="font-size:18px;line-height:1">‹</span>
          <span>Back</span>
        </button>
        <div style="font-size:16px;font-weight:800;color:var(--text)">${sectionLabel}</div>
        <button onclick="openPersonSheet('${c.id}','${resolvedRole}')"
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
    <div class="learn-school-teacher-card">
      <div class="learn-school-teacher-avatar">
        ${getCharacterHTML(t.appearance, 35, 52, { showBg: false })}
      </div>
      <div class="learn-school-teacher-copy">
        <div class="learn-school-teacher-title">${t.title} ${t.firstName ? `${t.firstName} ` : ''}${t.surname}</div>
        <div class="learn-school-teacher-sub">${t.subject} ${t.isTutor ? 'tutor' : 'teacher'}</div>
      </div>
    </div>`;
}

function buildLearnSchoolNavIcon(icon) {
  const icons = {
    action: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.425 2.25c.841 0 1.404.798 1.212 1.563l-.049.153L14.49 9.35H17c.985 0 1.532 1.054 1.1 1.854l-.1.156l-7.47 10.047c-.54.725-1.621.224-1.527-.605l.785-6.91H7c-.907 0-1.487-.924-1.155-1.735l.005-.011l3.906-9.128a1.25 1.25 0 0 1 1.151-.768z"/></svg>`,
    clubs: `<svg viewBox="0 0 48 48"><path fill="currentColor" fill-rule="evenodd" d="M5.447 2.501C7.614 2.022 11.65 1.5 19 1.5s11.386.522 13.553 1.001c2.048.453 3.204 2.173 3.414 3.985c.116.997.246 2.308.349 3.85a134 134 0 0 0-4.01-1.138C25.09 7.265 20.825 6.67 18.31 6.558c-3.636-.16-6.212 2.238-7.25 4.857a85 85 0 0 0-3.035 9.188a24.7 24.7 0 0 0-.577 10.053C3.636 26.759 1.5 21.395 1.5 15.8c0-3.938.297-7.28.533-9.314C2.243 4.674 3.4 2.954 5.447 2.5m26.081 9.596c-7.1-1.903-11.133-2.443-13.35-2.54c-2.096-.093-3.657 1.269-4.329 2.964a82 82 0 0 0-2.926 8.859c-2.003 7.476.056 15.583 5.853 20.845c1.788 1.624 3.836 3.181 5.694 3.679s4.41.173 6.77-.34c7.651-1.658 13.488-7.65 15.49-15.125a82 82 0 0 0 1.897-9.135c.266-1.804-.405-3.765-2.267-4.732c-1.968-1.024-5.731-2.573-12.832-4.475m.952 12.62c-.754.4-1.62.614-2.242-.202c-.522-.683-.337-1.665.346-2.15a4 4 0 0 1 .488-.298a5.6 5.6 0 0 1 1.292-.492c1.115-.274 2.633-.282 4.258.656s2.377 2.257 2.696 3.359c.156.538.208 1.016.22 1.366c.01.264-.003.461-.014.57c-.078.835-.836 1.486-1.689 1.376c-1.017-.132-1.265-.988-1.295-1.841a2.6 2.6 0 0 0-.103-.636c-.14-.482-.466-1.106-1.315-1.596c-.85-.49-1.553-.461-2.04-.341a2.6 2.6 0 0 0-.602.228m-5.266-3.254c.348.76.018 1.704-.776 2.035c-.947.395-1.59-.223-2.042-.947a2.7 2.7 0 0 0-.407-.498c-.362-.348-.956-.725-1.937-.725s-1.575.377-1.938.725a2.7 2.7 0 0 0-.406.498a2 2 0 0 0-.09.16a1.5 1.5 0 0 1-1.953.787c-.794-.33-1.124-1.274-.775-2.035q.023-.051.06-.125a5.7 5.7 0 0 1 1.087-1.45c.828-.794 2.139-1.56 4.015-1.56s3.187.766 4.015 1.56c.404.388.687.776.873 1.073c.14.224.228.402.273.502m-7.97 7.139a1.5 1.5 0 0 1 1.703 1.266c.202 1.377.812 2.91 1.642 4.162c.862 1.297 1.784 2.03 2.47 2.214s1.852.01 3.247-.683c1.345-.668 2.64-1.691 3.504-2.783a1.5 1.5 0 0 1 2.352 1.862c-1.164 1.471-2.82 2.763-4.521 3.608c-1.651.82-3.63 1.357-5.358.894s-3.173-1.917-4.193-3.453c-1.05-1.582-1.838-3.529-2.111-5.385a1.5 1.5 0 0 1 1.266-1.702" clip-rule="evenodd"/></svg>`,
    classmates: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42c-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3a3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3a3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13zM0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9c-.59.68-.95 1.62-.95 2.65V20zm24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65c2.56.34 4.45 1.51 4.45 2.9z" stroke="currentColor" stroke-width="0.2"/></svg>`,
    teachers: `<svg viewBox="0 0 48 48"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="m15 36l6-23h6l6 23l-9 8zm6-32h6l3 2l-3 7h-6l-3-7z"/></svg>`,
    social: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13m8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.98 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"/></svg>`,
    careers: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L1 9l11 6l9-4.91V17h2V9z"/><path fill="currentColor" d="M5 12.18V17l7 4l7-4v-4.82l-7 3.82z"/></svg>`,
  };
  return icons[icon] || icons.action;
}

function buildLearnSchoolNavCard({ screen, icon, iconColor, tileColor, title, subtitle }) {
  return `
    <button class="learn-school-nav-card" onclick="openLearnScreen('${screen}')">
      <div class="learn-school-nav-main">
        <div class="learn-school-nav-icon" style="background:${tileColor};color:${iconColor}">
  ${buildLearnSchoolNavIcon(icon)}
</div>
        <div class="learn-school-nav-copy">
          <div class="learn-school-nav-title">${title}</div>
          <div class="learn-school-nav-sub">${subtitle}</div>
        </div>
      </div>
      <span class="learn-school-nav-arrow">›</span>
    </button>`;
}

function buildLearnSchoolMainScreen(edu) {
  const hasTutor = !!(edu.tutors || []).length;
  return `
    <div class="learn-school-actions">
      ${buildLearnSchoolNavCard({
        screen: 'actions',
        icon: 'action',
        iconColor: '#f79e45',
        tileColor: '#fbe1c7',
        title: 'Actions',
        subtitle: 'Choose what to do',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'clubs',
        icon: 'clubs',
        iconColor: '#87c469',
        tileColor: '#d9efce',
        title: 'Clubs',
        subtitle: 'Activities and school clubs',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'classmates',
        icon: 'classmates',
        iconColor: '#a887d9',
        tileColor: '#e6daf7',
        title: `Classmates (${edu.classmates.length})`,
        subtitle: 'See your classmates and relationships',
      })}
      ${buildLearnSchoolNavCard({
        screen: 'teachers',
        icon: 'teachers',
        iconColor: '#6098e4',
        tileColor: '#d8e8fb',
        title: hasTutor ? 'Teachers and Tutors' : 'Teachers',
        subtitle: hasTutor ? 'View your teachers and tutor' : 'View your teachers',
      })}
    </div>`;
}

function buildLearnSchoolPageHeader(title, subtitle) {
  return `
    <div class="learn-school-page-head">
      <button class="learn-school-back" onclick="closeLearnSubscreen()"><span style="font-size:20px;line-height:1">‹</span></button>
      <div>
        <div class="learn-school-page-title">${title}</div>
        <div class="learn-school-page-sub">${subtitle}</div>
      </div>
    </div>`;
}

function buildLearnPlaceholderItems(items) {
  return items.map(item => `
    <div class="learn-school-placeholder-card">
      <div class="learn-school-placeholder-copy">
        <div class="learn-school-placeholder-title">${item.title}</div>
        <div class="learn-school-placeholder-sub">${item.subtitle}</div>
      </div>
      <div class="learn-school-pill">${item.tag || 'Placeholder'}</div>
    </div>`).join('');
}

function ensureSchoolTutorState() {
  if (!Array.isArray(STATE.school.tutors)) STATE.school.tutors = [];
  return STATE.school.tutors;
}

function canRevealClassmateTraits(person) {
  return (person?.relationship || 0) >= 10;
}

function adjustTeacherRelationships(amount, includeTutors = true) {
  (STATE.school.teachers || []).forEach(teacher => {
    if (!teacher.npcStats) teacher.npcStats = {};
    teacher.npcStats.warmth = clamp((teacher.npcStats.warmth ?? 50) + amount);
  });
  if (includeTutors) {
    ensureSchoolTutorState().forEach(tutor => {
      if (!tutor.npcStats) tutor.npcStats = {};
      tutor.npcStats.warmth = clamp((tutor.npcStats.warmth ?? 50) + amount);
    });
  }
}

function shiftSchoolGradeLevel(direction) {
  const currentGrade = gradeFromScore(STATE.school.gradeScore || 0);
  const index = GRADES.indexOf(currentGrade);
  if (index < 0) return currentGrade;
  const nextIndex = clamp(index - direction, 0, GRADES.length - 1);
  const nextGrade = GRADES[nextIndex];
  STATE.school.gradeScore = scoreFromGrade(nextGrade);
  return nextGrade;
}

function createTutorNpc() {
  const titles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'];
  const title = pickRandom(titles);
  const gender = title === 'Mr' ? 'male' : (Math.random() > 0.5 ? 'female' : 'male');
  const subject = pickRandom(['English', 'Maths', 'Science', 'History']);
  const tutor = {
    id: uid(),
    title,
    gender,
    firstName: pickRandom(NAMES_UK[gender]),
    surname: pickRandom(NAMES_UK.surnames),
    subject,
    emoji: pickRandom(APPEARANCE_EMOJIS),
    appearance: generateAppearance(gender),
    isTutor: true,
  };
  tutor.npcStats = buildTeacherNpcStats({ ...tutor, strictness: Math.floor(Math.random() * 50) + 25 });
  tutor.npcStats.warmth = clamp((tutor.npcStats.warmth || 50) + 6);
  return tutor;
}

const LEARN_SCHOOL_ACTIONS = [
  {
    id: 'study_harder',
    title: 'Study harder',
    subtitle: 'Push your revision harder and trade happiness for better results.',
    tag: 'Action',
    minAge: 11,
  },
  {
    id: 'ask_private_tutor',
    title: 'Ask parents for a private tutor',
    subtitle: 'This depends on their money, generosity, and parenting style.',
    tag: 'Action',
    minAge: 11,
  },
  {
    id: 'make_friends_classmates',
    title: 'Make friends with classmates',
    subtitle: 'Build up your social circle around school.',
    tag: 'Action',
    minAge: 11,
  },
  {
    id: 'go_to_party',
    title: 'Go to a party',
    subtitle: 'Boost your social standing with the popular crowd.',
    tag: 'Action',
    minAge: 11,
  },
  {
    id: 'use_ai_assignment',
    title: 'Use AI for an assignment',
    subtitle: 'A risky shortcut that can help or backfire.',
    tag: 'Risk',
    minAge: 11,
  },
  {
    id: 'plagiarise_essay',
    title: 'Plagiarise essay',
    subtitle: 'Higher upside than effort, but much bigger risk.',
    tag: 'Risk',
    minAge: 11,
  },
  {
    id: 'cheat_exam',
    title: 'Cheat in exam',
    subtitle: 'Maximum stakes. Maximum consequences.',
    tag: 'Risk',
    minAge: 11,
  },
  {
    id: 'skip_class',
    title: 'Skip class',
    subtitle: 'A quick thrill that can still come back to bite.',
    tag: 'Risk',
    minAge: 11,
  },
];

function ensureLearnSchoolActionState() {
  if (!STATE.school) return {};
  if (!STATE.school.actions || typeof STATE.school.actions !== 'object') {
    STATE.school.actions = {};
  }
  if (!STATE.school.actions.usedByAge || typeof STATE.school.actions.usedByAge !== 'object' || Array.isArray(STATE.school.actions.usedByAge)) {
    STATE.school.actions.usedByAge = {};
  }
  const ageKey = String(STATE.age);
  if (Array.isArray(STATE.school.actions.usedByAge[ageKey])) {
    STATE.school.actions.usedByAge[ageKey] = Object.fromEntries(
      STATE.school.actions.usedByAge[ageKey].map(actionId => [actionId, 1])
    );
  } else if (!STATE.school.actions.usedByAge[ageKey] || typeof STATE.school.actions.usedByAge[ageKey] !== 'object') {
    STATE.school.actions.usedByAge[ageKey] = {};
  }
  return STATE.school.actions;
}

function getLearnSchoolActionUseCount(actionId) {
  const actionState = ensureLearnSchoolActionState();
  return actionState.usedByAge?.[String(STATE.age)]?.[actionId] || 0;
}

function markLearnSchoolActionUsed(actionId) {
  const actionState = ensureLearnSchoolActionState();
  const ageKey = String(STATE.age);
  const used = actionState.usedByAge[ageKey];
  used[actionId] = (used[actionId] || 0) + 1;
}

function runCappedSchoolDiaryOnly(action) {
  logActivity(`${action.title}: you pushed it again this year, but it did not really change anything.`, 0);
  saveGame();
  renderLearnTab();
  showToast('No real effect this time.');
}

function applyClassmateRelationshipGain(classmate, minGain, maxGain) {
  if (!classmate) return;
  classmate.relationship = clamp((classmate.relationship || 0) + (Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain));
}

function runLearnSchoolActionEffect(action) {
  if (action.id === 'study_harder') {
    const happyLoss = -(Math.floor(Math.random() * 6));
    const gradeGain = Math.floor(Math.random() * 11);
    const smartsGain = Math.floor(Math.random() * 5) + 1;
    applyEffects({ happy: happyLoss, gradeScore: gradeGain, smarts: smartsGain });
    return {
      log: `Studied harder and pushed through the pressure. (${gradeGain} grade points)`,
      toast: 'The extra studying paid off.',
    };
  }

  if (action.id === 'ask_private_tutor') {
    const tutors = ensureSchoolTutorState();
    const existingTutor = tutors[0] || null;
    const parents = [STATE.family?.mum, STATE.family?.dad].filter(Boolean).filter(parent => parent.alive !== false);
    let chance = 0.38;
    if (['upper_middle', 'elite'].includes(STATE.socialClass)) chance += 0.3;
    else if (STATE.socialClass === 'middle') chance += 0.14;
    parents.forEach(parent => {
      const traits = parent.traits || [];
      if (traits.includes('supportive')) chance += 0.14;
      if (traits.includes('strict')) chance += 0.12;
      if (traits.includes('ambitious')) chance += 0.08;
      if (traits.includes('kind')) chance += 0.04;
      if (traits.includes('distant')) chance -= 0.12;
      if (traits.includes('absent')) chance -= 0.18;
      if (traits.includes('overbearing')) chance += 0.03;
      if ((parent.npcStats?.generosity || 0) >= 70) chance += 0.08;
      if (isHighPayingParentJob(parent.job)) chance += 0.08;
    });
    if (existingTutor) chance += 0.16;
    const approved = Math.random() < Math.max(0.08, Math.min(0.92, chance));
    if (approved) {
      if (!existingTutor) tutors.push(createTutorNpc());
      applyEffects({
        smarts: Math.floor(Math.random() * 4) + 2,
        gradeScore: Math.floor(Math.random() * 5) + 4,
      });
      return {
        log: existingTutor ? 'Your parents kept paying for your private tutor.' : 'Your parents agreed to a private tutor.',
        toast: existingTutor ? 'You kept your tutor.' : 'Your parents said yes to a tutor.',
      };
    }
    applyEffects({ happy: -(Math.floor(Math.random() * 3)) });
    return {
      log: 'You asked for a private tutor, but your parents said no.',
      toast: 'They said no.',
    };
  }

  if (action.id === 'make_friends_classmates') {
    const popularityGain = Math.floor(Math.random() * 9);
    const classmates = [...(STATE.school.classmates || [])].sort(() => Math.random() - 0.5);
    const count = Math.min(classmates.length, Math.floor(Math.random() * 11));
    classmates.slice(0, count).forEach(classmate => applyClassmateRelationshipGain(classmate, 10, 20));
    applyEffects({ popularity: popularityGain });
    if (STATE.school.classmates?.length) STATE.school.rosterSnapshot = buildRosterSnapshot();
    return {
      log: `Put yourself out there and built momentum socially with ${count} classmates.`,
      toast: 'Your social circle grew.',
    };
  }

  if (action.id === 'go_to_party') {
    const popularityGain = 10 + Math.floor(Math.random() * 6);
    const popularClassmates = [...(STATE.school.classmates || [])]
      .sort((a, b) => (b.socialStanding || 0) - (a.socialStanding || 0))
      .slice(0, 5);
    popularClassmates.forEach(classmate => applyClassmateRelationshipGain(classmate, 10, 20));
    applyEffects({ popularity: popularityGain, happy: 2 + Math.floor(Math.random() * 4) });
    return {
      log: 'Went to a party and got noticed by the popular crowd.',
      toast: 'That party raised your profile.',
    };
  }

  if (action.id === 'use_ai_assignment') {
    const smartsDelta = Math.random() < 0.5 ? -(Math.floor(Math.random() * 4)) : Math.floor(Math.random() * 4);
    applyEffects({ smarts: smartsDelta });
    const caught = Math.random() < 0.35;
    if (caught) {
      const lostGrade = shiftSchoolGradeLevel(-1);
      const repLoss = -(Math.floor(Math.random() * 6));
      applyEffects({ rep: repLoss });
      adjustTeacherRelationships(-(Math.floor(Math.random() * 6)));
      return {
        log: `You got caught using AI on an assignment and dropped to ${lostGrade}.`,
        toast: 'You got caught.',
      };
    }
    const gradeGain = 5 + Math.floor(Math.random() * 6);
    applyEffects({ gradeScore: gradeGain });
    return {
      log: `You used AI on an assignment and got away with it. (+${gradeGain} grade points)`,
      toast: 'You were not caught.',
    };
  }

  if (action.id === 'plagiarise_essay') {
    const smartsLoss = -(Math.floor(Math.random() * 4));
    if (Math.random() < 0.8) applyEffects({ smarts: smartsLoss });
    const caught = Math.random() < 0.65;
    if (caught) {
      const lostGrade = shiftSchoolGradeLevel(-1);
      const repLoss = -(5 + Math.floor(Math.random() * 6));
      const teacherLoss = -(5 + Math.floor(Math.random() * 6));
      applyEffects({ rep: repLoss });
      adjustTeacherRelationships(teacherLoss);
      return {
        log: `You were caught plagiarising an essay and dropped to ${lostGrade}.`,
        toast: 'Plagiarism backfired.',
      };
    }
    const gradeGain = 5 + Math.floor(Math.random() * 6);
    applyEffects({ gradeScore: gradeGain });
    return {
      log: `You plagiarised an essay and got away with it. (+${gradeGain} grade points)`,
      toast: 'Nobody caught it.',
    };
  }

  if (action.id === 'cheat_exam') {
    const caught = Math.random() < 0.5;
    if (caught) {
      STATE.school.gradeScore = scoreFromGrade('F');
      const repLoss = -(5 + Math.floor(Math.random() * 6));
      const teacherLoss = -(10 + Math.floor(Math.random() * 6));
      applyEffects({ rep: repLoss });
      adjustTeacherRelationships(teacherLoss);
      return {
        log: 'You were caught cheating in an exam and your result collapsed.',
        toast: 'You got caught cheating.',
      };
    }
    const newGrade = shiftSchoolGradeLevel(1);
    return {
      log: `You cheated in an exam and pulled your grade up to ${newGrade}.`,
      toast: 'You got away with it.',
    };
  }

  if (action.id === 'skip_class') {
    const caught = Math.random() < 0.5;
    const smartsLoss = -(Math.floor(Math.random() * 11));
    applyEffects({ smarts: smartsLoss });
    if (caught) {
      adjustTeacherRelationships(-(Math.floor(Math.random() * 16)));
      applyEffects({ rep: -(Math.floor(Math.random() * 6)) });
      return {
        log: 'You skipped class and got caught.',
        toast: 'You got caught skipping.',
      };
    }
    applyEffects({ happy: 10 });
    return {
      log: 'You skipped class and enjoyed the freedom for a bit.',
      toast: 'You got away with skipping.',
    };
  }

  return { log: action.title, toast: `${action.title} ✓` };
}

function runLearnSchoolAction(actionId) {
  const action = LEARN_SCHOOL_ACTIONS.find(item => item.id === actionId);
  if (!action) {
    showToast('That action is unavailable.');
    return;
  }
  if (STATE.age < (action.minAge || 0)) {
    showToast(`Available at age ${action.minAge}.`);
    return;
  }
  if (getLearnSchoolActionUseCount(actionId) >= 2) {
    runCappedSchoolDiaryOnly(action);
    return;
  }
  const result = runLearnSchoolActionEffect(action);
  markLearnSchoolActionUsed(actionId);
  if (STATE.school?.classmates?.length) {
    STATE.school.rosterSnapshot = buildRosterSnapshot();
  }
  logActivity(result.log, null);
  saveGame();
  renderLearnTab();
  showToast(result.toast);
}

function buildLearnSchoolActionItems(items) {
  return items.map(item => {
    const available = STATE.age >= (item.minAge || 0);
    const count = getLearnSchoolActionUseCount(item.id);
    return `
      <button class="learn-school-placeholder-card"
        ${available ? `onclick="runLearnSchoolAction('${item.id}')"` : 'disabled'} 
        style="cursor:${available ? 'pointer' : 'default'};opacity:${available ? '1' : '.58'}">
        <div class="learn-school-placeholder-copy">
          <div class="learn-school-placeholder-title">${item.title}</div>
          <div class="learn-school-placeholder-sub">${item.subtitle}</div>
        </div>
        <div class="learn-school-pill">${available ? `${Math.min(count, 2)}/2` : `${item.minAge}+`}</div>
      </button>`;
  }).join('');
}

function buildLearnActionsPlaceholderPage() {
  return `
    <div class="learn-school-page">
      ${buildLearnSchoolPageHeader('Actions', 'Choose what to do at school this year.')}
      <div class="learn-school-note-card">
        <div class="learn-school-note-label">School Actions</div>
        <div class="learn-school-note-copy">Each action only has real effects the first two times you use it in a year. After that, you can still press it, but it only adds flavour.</div>
      </div>
      ${buildLearnSchoolActionItems(LEARN_SCHOOL_ACTIONS)}
    </div>`;
}

function buildLearnClubsPlaceholderPage() {
  return `
    <div class="learn-school-page">
      ${buildLearnSchoolPageHeader('Clubs', 'Placeholder activities and school clubs.')}
      <div class="learn-school-note-card">
        <div class="learn-school-note-label">Placeholder</div>
        <div class="learn-school-note-copy">This page is temporary, but the layout is ready for a larger clubs and activities system.</div>
      </div>
      ${buildLearnPlaceholderItems([
        { title: 'Join the drama club', subtitle: 'Meet new people and perform on stage.', tag: 'Club' },
        { title: 'Try the football team', subtitle: 'Build teamwork and school spirit.', tag: 'Club' },
        { title: 'Sign up for the chess club', subtitle: 'Develop strategy and focus after class.', tag: 'Club' },
      ])}
    </div>`;
}

function buildLearnTeachersPlaceholderPage(edu) {
  const staff = [...(edu.teachers || []), ...(edu.tutors || [])];
  const hasTutor = !!(edu.tutors || []).length;
  return `
    <div class="learn-school-page">
      ${buildLearnSchoolPageHeader(hasTutor ? 'Teachers and Tutors' : 'Teachers', hasTutor ? 'View your teachers and tutor.' : 'View your teachers.')}
      <div class="learn-school-note-card">
        <div class="learn-school-note-label">${hasTutor ? 'Support Team' : 'Placeholder'}</div>
        <div class="learn-school-note-copy">${hasTutor ? 'Your school staff and private tutor are shown below.' : 'Teacher profiles are staying lightweight for now. The two existing teachers are shown below.'}</div>
      </div>
      ${staff.map(t => buildLearnTeacherRow(t)).join('')}
    </div>`;
}

let _learnScreen = 'main';

function openLearnScreen(screen) {
  _learnScreen = screen;
  if (screen !== 'classmate') _learnClassmateId = null;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function closeLearnSubscreen() {
  _learnScreen = 'main';
  _learnClassmateId = null;
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function openLearnClassmatesScreen() {
  openLearnScreen('classmates');
}

function closeLearnClassmatesScreen() {
  closeLearnSubscreen();
}

function renderLearnTab() {
  const age = STATE.age, edu = STATE.school;
  const notStartedSchool = age < 5;
  const isPostSchoolPlanning = age >= 18 && edu.level === 'finished_school';
  const isGraduatePlanning = age >= 18 && edu.level === 'graduated';
  const isEmployed = age >= 18 && STATE.career?.job && STATE.career.job !== 'None' && edu.level !== 'uni';
  const isSchoolStage = ['primary', 'secondary', 'college'].includes(edu.level);
  if (_learnScreen === 'classmates' && !(age >= 5 && age <= 18 && edu.classmates.length)) {
    _learnScreen = 'main';
  }
  if (_learnScreen === 'classmate' && !(
    edu.classmates.some(c => c.id === _learnClassmateId)
    || (edu.level === 'uni' && !!getUniversityCoursemateById(_learnClassmateId))
  )) {
    _learnScreen = age >= 5 && age <= 18 && edu.classmates.length ? 'classmates' : (edu.level === 'uni' ? 'uniPeople' : 'main');
    _learnClassmateId = null;
  }
  if (!isSchoolStage && ['actions', 'clubs', 'teachers'].includes(_learnScreen)) {
    _learnScreen = 'main';
  }
  if (edu.level !== 'uni' && ['uniActions', 'uniSocial', 'uniSocietyList', 'uniClubList', 'uniPeople', 'uniCareers', 'uniCommitment'].includes(_learnScreen)) {
    _learnScreen = 'main';
  }
  const grade       = (age >= 5 && age <= 18) ? gradeFromScore(edu.gradeScore) : null;

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
  hero.style.padding = '';
  hero.style.borderRadius = '';
  hero.style.boxShadow = '';

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
    hero.style.background = 'transparent';
    hero.style.border = 'none';
    hero.style.padding = '0';
    hero.style.borderRadius = '0';
    hero.style.boxShadow = 'none';
    hero.innerHTML = buildUniversityHeroCard();
  } else if (grade && isSchoolStage) {
    hero.style.background = 'transparent';
    hero.style.border = 'none';
    hero.style.padding = '0';
    hero.style.borderRadius = '0';
    hero.style.boxShadow = 'none';
    hero.innerHTML = buildLearnHeroSchool(edu, grade);
  } else {
    hero.style.padding = '';
    hero.style.borderRadius = '';
    hero.style.boxShadow = '';
    hero.style.background = '';
    hero.style.border     = '';
    hero.innerHTML = buildLearnHeroPreschool(edu);
  }

  gradeBlockWrap.innerHTML = '';
  gradeBlockWrap.style.display = 'none';
  rosterToggleWrap.style.display = 'none';
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

  if (isSchoolStage && _learnScreen === 'main') {
    hero.style.display = '';
    learnActions.style.display = '';
    learnActions.innerHTML = buildLearnSchoolMainScreen(edu);
    return;
  }

  if (_learnScreen === 'classmates' && isSchoolStage) {
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = '';
    const classmatesScreen = document.createElement('div');
    classmatesScreen.id = 'learn-classmates-screen';
    classmatesScreen.innerHTML = buildLearnClassmatesScreen(edu);
    container.appendChild(classmatesScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  if (_learnScreen === 'classmate' && (isSchoolStage || edu.level === 'uni')) {
    const classmate = edu.classmates.find(c => c.id === _learnClassmateId) || (edu.level === 'uni' ? getUniversityCoursemateById(_learnClassmateId) : null);
    if (!classmate) return;
    hero.style.display = 'none';
    gradeBlockWrap.style.display = 'none';
    rosterToggleWrap.style.display = 'none';
    learnActions.style.display = '';
    const classmateDetailScreen = document.createElement('div');
    classmateDetailScreen.id = 'learn-classmate-detail-screen';
    classmateDetailScreen.innerHTML = buildLearnClassmateDetailScreen(classmate);
    container.appendChild(classmateDetailScreen);
    if (tab) tab.scrollTop = 0;
    return;
  }

  if (_learnScreen === 'uniApplyCourse' || _learnScreen === 'uniApplyUniversity' || _learnScreen === 'uniApplyFinances' || _learnScreen === 'uniFundingConfirm' || _learnScreen === 'uniApplyType') {
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

  if (_learnScreen === 'uniActions' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversityActionPage();
    return;
  }

  if (_learnScreen === 'uniSocial' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversitySocialPage();
    return;
  }

  if (_learnScreen === 'uniSocietyList' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversitySocietyListPage();
    return;
  }

  if (_learnScreen === 'uniClubList' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversityClubListPage();
    return;
  }

  if (_learnScreen === 'uniPeople' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversityPeoplePage();
    return;
  }

  if (_learnScreen === 'uniCareers' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversityCareersPage();
    return;
  }

  if (_learnScreen === 'uniCommitment' && edu.level === 'uni') {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildUniversityCommitmentPage();
    return;
  }

  if (_learnScreen === 'actions' && isSchoolStage) {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildLearnActionsPlaceholderPage();
    return;
  }

  if (_learnScreen === 'clubs' && isSchoolStage) {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildLearnClubsPlaceholderPage();
    return;
  }

  if (_learnScreen === 'teachers' && isSchoolStage) {
    hero.style.display = 'none';
    learnActions.style.display = '';
    learnActions.innerHTML = buildLearnTeachersPlaceholderPage(edu);
    return;
  }

  hero.style.display = '';
  gradeBlockWrap.style.display = 'none';
  learnActions.style.display = '';

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
    learnActions.innerHTML = '';
  }
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
  const home = typeof getCurrentHome === 'function' ? getCurrentHome() : null;
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
      <div class="detail-row"><span class="detail-label">Housing${home ? ` (${home.name})` : ''}</span><span class="detail-val neg">-${fmtMoney(f.expenses)}</span></div>
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

function openChildNaming(childId, onNamed) {
  const child = getChildById(childId);
  if (!child) return;
  const suggestedName = child.firstName || pickRandom(NAMES_UK[child.gender || 'female']);
  document.getElementById('pet-inner').innerHTML = `
    <div class="milestone-emoji">🍼</div>
    <div class="milestone-title">What will you name your baby?</div>
    <input class="pet-name-input" id="pet-name-input" type="text" placeholder="${suggestedName}" value="${suggestedName}" maxlength="20"/>
    <button class="birth-btn secondary" onclick="document.getElementById('pet-name-input').value='${pickRandom(NAMES_UK[child.gender || 'female'])}'">↺ Suggest another name</button>
    <button class="birth-btn" onclick="confirmChildName('${childId}')">That's their name →</button>`;
  document.getElementById('pet-overlay').classList.add('open');
  _pendingPetData = { childId, onNamed };
}

function confirmChildName(childId) {
  const child = getChildById(childId);
  const name = document.getElementById('pet-name-input').value.trim() || child?.firstName || pickRandom(NAMES_UK[child?.gender || 'female']);
  document.getElementById('pet-overlay').classList.remove('open');
  if (child) {
    child.firstName = name;
    logActivity(`${name} was born.`, 14);
  }
  if (STATE.romance) STATE.romance.pendingChildNamingId = null;
  if (_pendingPetData?.onNamed) _pendingPetData.onNamed(name);
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
  if (choice.beforeChoose) {
    const allowed = choice.beforeChoose();
    if (allowed === false) return;
  }
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
        ensureNpcCoreFields(best, {
          role: 'friend',
          socialGroup: STATE.school?.level === 'uni' ? 'university friend' : 'school friend',
        });
        best.status = 'friend';
        markNpcInteraction(best, `Became friends with ${STATE.firstName}.`);
        upsertPersistentFriend(best);
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
      saveGame();
    });
    return;
  }
  showOutcome(choice, totalDelta);
  updateAllUI();
  saveGame();
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

function runPostAgeUpFlow() {
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
  if (STATE.romance?.pendingChildNamingId) {
    const childId = STATE.romance.pendingChildNamingId;
    openChildNaming(childId, () => {
      saveGame();
      updateAllUI();
      runPostAgeUpFlow();
    });
    return;
  }
  runPostAgeUpFlow();
});

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── UNIVERSITY REBUILD ───────────────────────────────────
const UNIVERSITY_REBUILD_COURSES = [
  { id:'Law', label:'Law', icon:'mdi:scale-balance', blurb:'Solicitors, barristers, networking and pressure.' },
  { id:'Medicine', label:'Medicine', icon:'mdi:stethoscope', blurb:'Long training, clinical placements and elite hospitals.' },
  { id:'Business', label:'Business', icon:'mdi:briefcase-outline', blurb:'Management, marketing, finance, and executive tracks.' },
  { id:'Economics', label:'Economics', icon:'mdi:chart-line', blurb:'Analysis, markets, internships and investment roles.' },
  { id:'Computer Science', label:'Computer Science', icon:'mdi:laptop', blurb:'Hackathons, internships and technical interviews.' },
  { id:'Education', label:'Education', icon:'mdi:school-outline', blurb:'Placements, volunteering and school-based pathways.' },
  { id:'Art', label:'Art', icon:'mdi:palette', blurb:'Illustration, fashion, animation, tattooing and photography.' },
];

const UNIVERSITY_REBUILD_DIRECTORY = [
  { name:'University of Oxford', tier:'Elite Universities', prestige:100, city:'Oxford', vibe:'ancient colleges, pressure, and old-money networks' },
  { name:'University of Cambridge', tier:'Elite Universities', prestige:99, city:'Cambridge', vibe:'formal traditions, elite recruiters, and intense academics' },
  { name:'King’s College London', tier:'Top Universities', prestige:88, city:'London', vibe:'city life, prestige, and strong employer access' },
  { name:'University of Bristol', tier:'Top Universities', prestige:84, city:'Bristol', vibe:'strong academics with a lively student scene' },
  { name:'University of Manchester', tier:'Top Universities', prestige:82, city:'Manchester', vibe:'big-city nightlife and strong campus societies' },
  { name:'Ashton University', tier:'Standard Universities', prestige:60, city:'Ashton', vibe:'solid outcomes and approachable campus life' },
  { name:'Redbridge University', tier:'Standard Universities', prestige:56, city:'Redbridge', vibe:'good student life and practical career routes' },
  { name:'South Coast College', tier:'Local Universities', prestige:35, city:'South Coast', vibe:'cheap living, familiar faces, and fewer elite doors' },
  { name:'Midland City College', tier:'Local Universities', prestige:30, city:'Midland City', vibe:'close to home, lower pressure, and smaller networks' },
];

const UNIVERSITY_REBUILD_TIER_META = {
  'Elite Universities': { min:90, base:30, standing:1, tag:'Elite' },
  'Top Universities': { min:80, base:54, standing:0.76, tag:'Top' },
  'Standard Universities': { min:60, base:76, standing:0.46, tag:'Standard' },
  'Local Universities': { min:45, base:90, standing:0.22, tag:'Local' },
};

const UNIVERSITY_REBUILD_CAREERS = {
  Law: {
    graduate: [
      { company:'Sterling LLP', title:'Trainee Solicitor', difficulty:58, sponsorEligible:true, elite:true },
      { company:'Chance Crown & Co', title:'Trainee Solicitor', difficulty:55, sponsorEligible:true, elite:true },
      { company:'Fairmount LLP', title:'Trainee Solicitor', difficulty:52, sponsorEligible:true, elite:true },
      { company:'Blackstone Chambers', title:'Pupillage', difficulty:62, sponsorEligible:true, elite:true },
      { company:'St John’s Chambers', title:'Pupillage', difficulty:57, sponsorEligible:true, elite:true },
    ],
    internship: [
      { company:'Carter & Mills Solicitors', title:'Legal Internship', difficulty:28, internshipOnly:true },
      { company:'Greenfield Legal Services', title:'Legal Internship', difficulty:25, internshipOnly:true },
      { company:'Crown Court', title:'Court Internship', difficulty:36, internshipOnly:true },
      { company:'Sterling LLP', title:'Vacation Scheme', difficulty:52, elite:true },
      { company:'Chance Crown & Co', title:'Vacation Scheme', difficulty:48, elite:true },
      { company:'Fairmount LLP', title:'Vacation Scheme', difficulty:45, elite:true },
    ],
  },
  Medicine: {
    graduate: [
      { company:'Royal Westminster Hospital', title:'Foundation Programme', difficulty:56, sponsorEligible:true, elite:true },
      { company:'Sterling Health Group', title:'Graduate Medical Programme', difficulty:51, sponsorEligible:true, elite:true },
    ],
    internship: [
      { company:'Downs Medical Centre', title:'Clinical Internship', difficulty:26, internshipOnly:true },
      { company:'Northside Clinic', title:'Clinical Internship', difficulty:24, internshipOnly:true },
      { company:'Royal Westminster Hospital', title:'Hospital Placement', difficulty:48, elite:true },
    ],
  },
  'Computer Science': {
    graduate: [
      { company:'Terranova', title:'Graduate Software Engineer', difficulty:54, sponsorEligible:true, elite:true },
      { company:'Ascot Tech', title:'Graduate Developer', difficulty:49, sponsorEligible:true, elite:true },
      { company:'Hyperion', title:'Graduate Product Engineer', difficulty:52, sponsorEligible:true, elite:true },
    ],
    internship: [
      { company:'Clearview Digital', title:'Software Internship', difficulty:22, internshipOnly:true },
      { company:'Red Brook Tech', title:'Tech Internship', difficulty:24, internshipOnly:true },
      { company:'Terranova', title:'Engineering Internship', difficulty:45, elite:true },
    ],
  },
  Business: {
    graduate: [
      { company:'Ascot Capital', title:'Graduate Analyst', difficulty:56, sponsorEligible:true, elite:true },
      { company:'Silverstone Financial', title:'Graduate Consultant', difficulty:52, sponsorEligible:true, elite:true },
      { company:'Kingsguard Investments', title:'Investment Graduate Scheme', difficulty:58, sponsorEligible:true, elite:true },
    ],
    internship: [
      { company:'Brown Advisory', title:'Finance Internship', difficulty:24, internshipOnly:true },
      { company:'Bridge Analytics', title:'Analytics Internship', difficulty:22, internshipOnly:true },
      { company:'Ascot Capital', title:'Summer Analyst', difficulty:47, elite:true },
    ],
  },
  Economics: {
    graduate: [
      { company:'Ascot Capital', title:'Junior Analyst', difficulty:56, sponsorEligible:true, elite:true },
      { company:'Silverstone Financial', title:'Junior Analyst', difficulty:52, sponsorEligible:true, elite:true },
      { company:'Kingsguard Investments', title:'Junior Analyst', difficulty:58, sponsorEligible:true, elite:true },
    ],
    internship: [
      { company:'Brown Advisory', title:'Economics Internship', difficulty:24, internshipOnly:true },
      { company:'Bridge Analytics', title:'Analytics Internship', difficulty:22, internshipOnly:true },
      { company:'Ascot Capital', title:'Summer Analyst', difficulty:47, elite:true },
    ],
  },
  Education: {
    graduate: [
      { company:'Northfield Trust', title:'Teacher Training Route', difficulty:34, sponsorEligible:false },
      { company:'Westbrook Academy', title:'Graduate Classroom Route', difficulty:30, sponsorEligible:false },
    ],
    internship: [
      { company:'Local Primary School', title:'School Placement', difficulty:16, internshipOnly:true },
      { company:'Community Secondary School', title:'Teaching Support Placement', difficulty:18, internshipOnly:true },
      { company:'Further Education College', title:'Learning Support Internship', difficulty:20, internshipOnly:true },
    ],
  },
  Art: {
    graduate: [
      { company:'Kindred Studio', title:'Illustrator', difficulty:32 },
      { company:'Paper Moon Press', title:'Photographer', difficulty:30 },
      { company:'Creator Studio', title:'Animator', difficulty:34 },
    ],
    internship: [
      { company:'Kindred Studio', title:'Art Internship', difficulty:18, internshipOnly:true },
      { company:'Paper Moon Press', title:'Creative Internship', difficulty:16, internshipOnly:true },
    ],
  },
};

const UNIVERSITY_REBUILD_SOCIETY_EVENTS = {
  Law: ['Law Fair', 'Networking Night', 'Mooting Competition'],
  Medicine: ['Clinical Skills Evening', 'Research Mixer', 'Hospital Insight Panel'],
  Business: ['Finance Case Competition', 'Trading Floor Night', 'Women in Finance Mixer'],
  'Computer Science': ['Hackathon', 'Founder Demo Night', 'Product Build Sprint'],
  Education: ['Teaching Workshop', 'Classroom Practice Session', 'Schools Outreach Day'],
};

function getUniversityCourseLabel(courseId) {
  return UNIVERSITY_REBUILD_COURSES.find(course => course.id === courseId)?.label || courseId || 'Course';
}

function getUniversityOptionByName(name) {
  return UNIVERSITY_REBUILD_DIRECTORY.find(option => option.name === name) || null;
}

function getUniversityTierMetaByNameOrTier(value) {
  const option = getUniversityOptionByName(value);
  const tier = option?.tier || value;
  return UNIVERSITY_REBUILD_TIER_META[tier] || UNIVERSITY_REBUILD_TIER_META['Standard Universities'];
}

function getUniversityCurrentSelection() {
  const application = _uniApplyDraft || STATE.school?.postSchool?.uniApplication || {};
  return getUniversityOptionByName(application.universityName || application.acceptedUniversityName || STATE.school.current);
}

function getUniversityBackupSelection() {
  const application = _uniApplyDraft || STATE.school?.postSchool?.uniApplication || {};
  return getUniversityOptionByName(application.backupUniversityName);
}

function getUniversityPrestigeStanding() {
  const application = STATE.school.postSchool?.uniApplication || {};
  const option = getUniversityOptionByName(application.acceptedUniversityName || application.universityName || STATE.school.current);
  if (!option) return 0;
  return getUniversityTierMetaByNameOrTier(option.tier).standing;
}

function getUniversityFundingOffers(draft = getUniversityApplicationDraft()) {
  if (draft.fundingOffers) return draft.fundingOffers;
  const gradeScore = STATE.school.gradeScore || 0;
  const tuitionPerYear = UNIVERSITY_TUITION_FEE_PER_YEAR;
  const studentLoanAmount = tuitionPerYear;

  const parentBase = buildParentFundingOffer();
  const parentRoll = Math.random();
  let parents = {
    status: 'partial',
    tuitionPerYear: Math.min(tuitionPerYear, parentBase.amount || 0),
    housingPerYear: 0,
    text: `Your parents are offering ${fmtMoney(Math.min(tuitionPerYear, parentBase.amount || 0))} per year.`,
    terms: parentBase.terms || [],
  };
  if (parentRoll < 0.18) {
    parents = { status:'refuse', tuitionPerYear:0, housingPerYear:0, text:'Your parents refused to contribute.', terms:parentBase.terms || [] };
  } else if (parentRoll < 0.34) {
    const housingSupport = Math.round((1800 + Math.random() * 2600) / 100) * 100;
    parents = {
      status:'housing_only',
      tuitionPerYear:0,
      housingPerYear:housingSupport,
      text:`Your parents will not pay tuition, but they will cover ${fmtMoney(housingSupport)} per year of housing costs.`,
      terms:parentBase.terms || [],
    };
  } else if (parentRoll > 0.82 && parents.tuitionPerYear >= 4000) {
    parents.status = 'full';
    parents.tuitionPerYear = tuitionPerYear;
    parents.text = 'Your parents offered to cover your full tuition fees.';
  } else if (parents.tuitionPerYear > 0) {
    parents.text = `Your parents offered ${fmtMoney(parents.tuitionPerYear)} per year towards tuition.`;
  }

  let scholarship = {
    available: false,
    amount: 0,
    paymentType: null,
    text: 'No scholarship offer.',
  };
  if (gradeScore >= 80) {
    const scholarshipChance = gradeScore >= 90 ? 0.24 : 0.11;
    if (Math.random() < scholarshipChance) {
      const awards = [1000, 3000, 5000, 9000];
      const amount = awards[Math.floor(Math.random() * awards.length)];
      const paymentType = (amount >= 5000 && Math.random() < 0.6) || amount === 9000 ? 'yearly' : 'one_time';
      scholarship = {
        available: true,
        amount,
        paymentType,
        text: `Scholarship awarded: ${fmtMoney(amount)}${paymentType === 'yearly' ? ' per year' : ' one-time'}.`,
      };
    } else {
      scholarship.text = 'You met the grade requirement, but no scholarship offer came through.';
    }
  } else {
    scholarship.text = 'Scholarships require A or A+ grades.';
  }

  draft.fundingOffers = {
    studentLoan: { amountPerYear: studentLoanAmount, text:`Student finance approved ${fmtMoney(studentLoanAmount)} per year for tuition, plus ${fmtMoney(UNIVERSITY_MAINTENANCE_LOAN_PER_YEAR)} maintenance.` },
    parents,
    selfFund: { amountPerYear: tuitionPerYear, text:`You will need to cover up to ${fmtMoney(tuitionPerYear)} per year yourself.` },
    scholarship,
  };
  return draft.fundingOffers;
}

function toggleUniversityFundingSource(sourceId) {
  _uniApplyDraft = getUniversityApplicationDraft();
  const offers = getUniversityFundingOffers(_uniApplyDraft);
  const selected = new Set(_uniApplyDraft.selectedFundingSources || []);
  if (sourceId === 'parents') {
    if (selected.has('parents')) {
      selected.delete('parents');
      _uniApplyDraft = getUniversityApplicationDraft({
        selectedFundingSources: [...selected],
        parentFundingType: null,
        parentalFundingAmount: 0,
        parentalFundingAmountPerYear: 0,
        parentHousingSupportPerYear: 0,
        parentalFundingTerms: [],
        parentalFundingAccepted: false,
      });
      saveUniversityDraft();
      renderLearnTab();
      return;
    }
    if (offers.parents.status === 'refuse') {
      showToast('Your parents refused to contribute.');
      return;
    }
    _uniParentFundingOffer = {
      status: offers.parents.status,
      amount: offers.parents.tuitionPerYear,
      housingPerYear: offers.parents.housingPerYear || 0,
      terms: offers.parents.terms || [],
    };
    renderParentFundingOfferPopup();
    return;
  }
  if (sourceId === 'scholarship' && !offers.scholarship.available) {
    showToast(offers.scholarship.text);
    return;
  }
  if (selected.has(sourceId)) selected.delete(sourceId);
  else selected.add(sourceId);
  _uniApplyDraft.selectedFundingSources = [...selected];
  saveUniversityDraft();
  renderLearnTab();
}

function buildUniversityFundingReview(draft = getUniversityApplicationDraft()) {
  const offers = getUniversityFundingOffers(draft);
  const selected = new Set(draft.selectedFundingSources || []);
  const lines = [];
  let tuitionCovered = 0;
  let housingCovered = 0;
  let selfFundAmount = 0;

  if (selected.has('scholarship') && offers.scholarship.available) {
    lines.push(`Scholarship Awarded: ${fmtMoney(offers.scholarship.amount)}${offers.scholarship.paymentType === 'yearly' ? '/year' : ' one-time'}`);
    tuitionCovered += offers.scholarship.amount;
  }
  if (selected.has('parents')) {
    const parentTuition = draft.parentalFundingAccepted ? (draft.parentalFundingAmountPerYear || 0) : (offers.parents.tuitionPerYear || 0);
    const parentHousing = draft.parentalFundingAccepted ? (draft.parentHousingSupportPerYear || 0) : (offers.parents.housingPerYear || 0);
    if (parentTuition > 0) {
      lines.push(`Parents Offering: ${fmtMoney(parentTuition)}/year`);
      tuitionCovered += parentTuition;
    }
    if (parentHousing > 0) {
      lines.push(`Parents Covering Housing: ${fmtMoney(parentHousing)}/year`);
      housingCovered += parentHousing;
    }
    if (draft.parentalFundingAccepted && (draft.parentalFundingTerms || []).length) {
      lines.push(`Parent Conditions: ${(draft.parentalFundingTerms || []).map(term => term.label).join(', ')}`);
    }
  }
  if (selected.has('student_loan')) {
    lines.push(`Student Loan Approved: ${fmtMoney(offers.studentLoan.amountPerYear)}/year`);
    tuitionCovered += offers.studentLoan.amountPerYear;
    housingCovered += UNIVERSITY_MAINTENANCE_LOAN_PER_YEAR;
  }
  if (selected.has('self_fund')) {
    selfFundAmount = Math.max(0, UNIVERSITY_TUITION_FEE_PER_YEAR - tuitionCovered);
    lines.push(`Self Funding Planned: ${fmtMoney(selfFundAmount)}/year`);
    tuitionCovered += selfFundAmount;
  }

  return {
    lines,
    tuitionCovered,
    housingCovered,
    selfFundAmount,
    remainingTuition: Math.max(0, UNIVERSITY_TUITION_FEE_PER_YEAR - tuitionCovered),
  };
}

function prepareUniversityFundingSelection() {
  _uniApplyDraft = getUniversityApplicationDraft();
  const review = buildUniversityFundingReview(_uniApplyDraft);
  if (!review.lines.length) {
    showToast('Choose at least one funding method.');
    return { ok:false };
  }
  const offers = getUniversityFundingOffers(_uniApplyDraft);
  const selected = _uniApplyDraft.selectedFundingSources || [];
  const primaryFunding = selected.length === 1 ? selected[0] : 'mixed';
  _uniApplyDraft = getUniversityApplicationDraft({
    fundingOffers: offers,
    fundingChoice: primaryFunding,
    funding: primaryFunding,
    studentLoanAmountPerYear: selected.includes('student_loan') ? offers.studentLoan.amountPerYear : 0,
    selfFundingAmountPerYear: selected.includes('self_fund') ? review.selfFundAmount : 0,
    parentFundingType: selected.includes('parents') ? offers.parents.status : null,
    parentalFundingAmountPerYear: selected.includes('parents') ? offers.parents.tuitionPerYear : 0,
    parentalFundingAmount: selected.includes('parents') ? offers.parents.tuitionPerYear : 0,
    parentalFundingTerms: offers.parents.terms || [],
    parentHousingSupportPerYear: selected.includes('parents') ? offers.parents.housingPerYear : 0,
    scholarshipAmount: selected.includes('scholarship') ? offers.scholarship.amount : 0,
    scholarshipPaymentType: selected.includes('scholarship') ? offers.scholarship.paymentType : null,
    remainingTuitionGapPerYear: review.remainingTuition,
  });
  saveUniversityDraft();
  return { ok:true };
}

function previousUniApplicationStep() {
  if (_learnScreen === 'uniApplyUniversity') _learnScreen = 'uniApplyCourse';
  else if (_learnScreen === 'uniApplyFinances') _learnScreen = 'uniApplyUniversity';
  else if (_learnScreen === 'uniFundingConfirm' || _learnScreen === 'uniApplyType') _learnScreen = 'uniApplyFinances';
  else closeUniApplication();
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function nextUniApplicationStep() {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (_learnScreen === 'uniApplyCourse') {
    if (!_uniApplyDraft.course) return showToast('Choose a course first.');
    saveUniversityDraft();
    _learnScreen = 'uniApplyUniversity';
  } else if (_learnScreen === 'uniApplyUniversity') {
    if (!_uniApplyDraft.universityName) return showToast('Choose a university first.');
    saveUniversityDraft();
    _learnScreen = 'uniApplyFinances';
  } else if (_learnScreen === 'uniApplyFinances') {
    const result = prepareUniversityFundingSelection();
    if (!result.ok) return;
    _learnScreen = 'uniFundingConfirm';
  } else if (_learnScreen === 'uniFundingConfirm' || _learnScreen === 'uniApplyType') {
    submitUniApplication();
    return;
  }
  renderLearnTab();
  const tab = document.getElementById('tab-learn');
  if (tab) tab.scrollTop = 0;
}

function selectUniApplicationField(field, value) {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (field === 'course') {
    _uniApplyDraft.course = value;
  } else if (field === 'universityName') {
    const option = getUniversityOptionByName(value);
    if (_uniUniversityChoiceSlot === 'backup') {
      _uniApplyDraft.backupUniversityName = option?.name || value;
      _uniApplyDraft.backupUniversityTier = option?.tier || null;
    } else {
      _uniApplyDraft.universityName = option?.name || value;
      _uniApplyDraft.universityTier = option?.tier || null;
      _uniApplyDraft.uniType = option?.tier || null;
      _uniApplyDraft.universityType = option?.tier || null;
      if (_uniApplyDraft.backupUniversityName === _uniApplyDraft.universityName) {
        _uniApplyDraft.backupUniversityName = null;
        _uniApplyDraft.backupUniversityTier = null;
      }
    }
  } else {
    _uniApplyDraft[field] = value;
  }
  saveUniversityDraft();
  renderLearnTab();
}

function universityAcceptanceChance(application) {
  const grade = STATE.school.gradeScore || 50;
  const option = getUniversityOptionByName(application.universityName);
  const meta = getUniversityTierMetaByNameOrTier(option?.tier || application.universityTier || application.uniType);
  if (grade < meta.min) return 0;
  let chance = meta.base + Math.floor((grade - meta.min) * 1.2);
  if (STATE.traits.includes('intelligent')) chance += 8;
  if (STATE.traits.includes('hardworking')) chance += 6;
  if (STATE.traits.includes('lazy')) chance -= 7;
  if (['Law', 'Medicine'].includes(application.course)) chance -= 4;
  if (option?.tier === 'Elite Universities') chance -= option.name.includes('Cambridge') ? 4 : 2;
  return clamp(chance, 0, 96);
}

function submitUniApplication() {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (!_uniApplyDraft.course || !_uniApplyDraft.universityName || !(_uniApplyDraft.selectedFundingSources || []).length) {
    showToast('Finish your university choices first.');
    return;
  }
  const postSchool = ensurePostSchoolState();
  postSchool.uniApplication = createUniversityApplicationState({
    ..._uniApplyDraft,
    submittedAge: STATE.age,
    status: 'pending',
    result: null,
  });
  if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  saveGame();
  _learnScreen = 'main';
  _uniApplyDraft = null;
  renderLearnTab();
  showToast('Application sent. Results arrive next year.');
}

function resolveUniversityApplication() {
  const application = STATE.school.postSchool?.uniApplication;
  if (!application || application.status !== 'pending') return null;
  if (application.submittedAge >= STATE.age) return null;
  const accepted = Math.random() * 100 < universityAcceptanceChance(application);
  let result;
  if (accepted) {
    application.status = 'accepted';
    result = { outcome:'accepted', universityName:application.universityName, universityTier:application.universityTier, viaBackup:false };
  } else if (application.backupUniversityName) {
    const backupChance = universityAcceptanceChance({
      ...application,
      universityName: application.backupUniversityName,
      universityTier: application.backupUniversityTier,
      uniType: application.backupUniversityTier,
      universityType: application.backupUniversityTier,
    });
    const backupAccepted = Math.random() * 100 < backupChance;
    if (backupAccepted) {
      application.status = 'accepted_backup';
      result = { outcome:'accepted_backup', universityName:application.backupUniversityName, universityTier:application.backupUniversityTier, viaBackup:true };
    } else {
      application.status = 'rejected';
      result = { outcome:'rejected', universityName:application.universityName, universityTier:application.universityTier, viaBackup:false };
    }
  } else {
    application.status = 'rejected';
    result = { outcome:'rejected', universityName:application.universityName, universityTier:application.universityTier, viaBackup:false };
  }
  application.result = result;
  return application.result;
}

function acceptUniversityOffer(universityName = null, universityTier = null) {
  const postSchool = ensurePostSchoolState();
  if (!postSchool.uniApplication) return;
  postSchool.uniApplication = createUniversityApplicationState(postSchool.uniApplication);
  postSchool.uniApplication.status = 'accepted_offer';
  postSchool.uniApplication.acceptedUniversityName = universityName || postSchool.uniApplication.universityName;
  postSchool.uniApplication.acceptedUniversityTier = universityTier || postSchool.uniApplication.universityTier;
  postSchool.uniApplication.acceptedViaBackup = !!(postSchool.uniApplication.backupUniversityName && postSchool.uniApplication.acceptedUniversityName === postSchool.uniApplication.backupUniversityName);
  postSchool.uniApplication.acceptedType = universityTier || postSchool.uniApplication.universityTier;
  postSchool.uniApplication.uniType = universityTier || postSchool.uniApplication.universityTier;
  postSchool.uniApplication.universityType = universityTier || postSchool.uniApplication.universityTier;
  postSchool.uniApplication.startedAge = STATE.age;
  STATE.school.level = 'uni';
  STATE.school.current = postSchool.uniApplication.acceptedUniversityName;
  logActivity(`Accepted a place to study ${getUniversityCourseLabel(postSchool.uniApplication.course)} at ${postSchool.uniApplication.acceptedUniversityName}.`, null);
  if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  if (typeof applyUniversityFundingForCurrentYear === 'function') applyUniversityFundingForCurrentYear();
  if (typeof getCurrentHome === 'function' && getCurrentHome()?.source === 'family' && typeof makeRentalHome === 'function' && typeof addHomeToHistory === 'function' && typeof setCurrentHome === 'function') {
    const studentHome = addHomeToHistory(makeRentalHome('rental_student_house'));
    setCurrentHome(studentHome, 'Moved out for university and into a shared student house.');
    showToast('You moved into shared student housing.');
  }
  saveGame();
  closeMilestone();
  updateAllUI();
}

function rejectUniversityOffer() {
  const postSchool = ensurePostSchoolState();
  if (postSchool.uniApplication) {
    postSchool.uniApplication.status = 'declined';
    if (typeof syncUniversityApplicationState === 'function') syncUniversityApplicationState(postSchool.uniApplication);
  }
  logActivity('Turned down the university offer.', null);
  saveGame();
  closeMilestone();
  updateAllUI();
}

function showUniversityAdmissionResult(result, onClose) {
  const application = STATE.school.postSchool?.uniApplication;
  if (!application || !result) return;
  _pendingAfterMilestone = onClose;
  const body = (result.outcome === 'accepted' || result.outcome === 'accepted_backup')
    ? `You've been offered a place to study ${getUniversityCourseLabel(application.course)} at ${result.universityName}.${result.viaBackup ? ' Your first choice said no, but your backup accepted you.' : ''}`
    : `Unfortunately, your application to ${application.universityName} was unsuccessful.`;
  const actions = (result.outcome === 'accepted' || result.outcome === 'accepted_backup')
    ? `<button class="continue-btn" onclick="acceptUniversityOffer('${result.universityName}','${result.universityTier}')">Accept place →</button>
       <button class="birth-btn secondary" onclick="rejectUniversityOffer()">Reject offer</button>`
    : `<button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">${(result.outcome === 'accepted' || result.outcome === 'accepted_backup') ? '🎉' : '🎓'}</div>
    <div class="milestone-title">${(result.outcome === 'accepted' || result.outcome === 'accepted_backup') ? 'Accepted' : 'Rejected'}</div>
    <div class="milestone-body">${body}</div>
    ${actions}`;
  document.getElementById('milestone-overlay').classList.add('open');
}

function buildUniversityCourseSelectionCards() {
  const selected = _uniApplyDraft?.course;
  return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    ${UNIVERSITY_REBUILD_COURSES.map(course => {
      const active = selected === course.id;
      return `<button onclick="selectUniApplicationField('course','${course.id}')" style="padding:16px;border-radius:20px;border:1.5px solid ${active ? '#6d56c9' : '#e3d8cb'};background:${active ? '#f6f1ff' : '#fff'};text-align:left;cursor:pointer">
        <div style="font-size:28px;color:#6d56c9"><iconify-icon icon="${course.icon}"></iconify-icon></div>
        <div style="font-size:16px;font-weight:800;color:#171510;margin-top:8px">${course.label}</div>
        <div style="font-size:12px;line-height:1.45;color:#655d56;margin-top:6px">${course.blurb}</div>
      </button>`;
    }).join('')}
  </div>`;
}

function buildUniversitySelectionCards() {
  const selected = _uniUniversityChoiceSlot === 'backup' ? _uniApplyDraft?.backupUniversityName : _uniApplyDraft?.universityName;
  const groups = ['Elite Universities', 'Top Universities', 'Standard Universities', 'Local Universities'];
  return groups.map(tier => {
    const entries = UNIVERSITY_REBUILD_DIRECTORY.filter(option => option.tier === tier);
    return `<div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8d8175">${tier}</div>
      ${entries.map(option => {
        const active = selected === option.name;
        return `<button onclick="selectUniApplicationField('universityName','${option.name.replace(/'/g, "\\'")}')" style="padding:15px 16px;border-radius:18px;border:1.5px solid ${active ? '#6d56c9' : '#e7ddd1'};background:${active ? '#f6f1ff' : '#fff'};text-align:left;cursor:pointer">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div>
              <div style="font-size:16px;font-weight:800;color:#171510">${option.name}</div>
              <div style="font-size:12px;color:#6a6159;margin-top:4px">${option.city} • ${option.vibe}</div>
            </div>
            <div style="font-size:11px;font-weight:800;color:${active ? '#6d56c9' : '#8c7b6b'}">${option.prestige} Prestige</div>
          </div>
        </button>`;
      }).join('')}
    </div>`;
  }).join('');
}

function setUniversityChoiceSlot(slot) {
  _uniUniversityChoiceSlot = slot === 'backup' ? 'backup' : 'primary';
  renderLearnTab();
}

function buildUniversityFundingCardsRebuild() {
  const draft = getUniversityApplicationDraft();
  const offers = getUniversityFundingOffers(draft);
  const selected = new Set(draft.selectedFundingSources || []);
  const cards = [
    { id:'student_loan', title:'Student Loan', preview:'Click to see your exact approved amount.', result:offers.studentLoan.text, enabled:true },
    { id:'parents', title:'Parents', preview:'Click to see what your parents are offering.', result:offers.parents.text, enabled:true },
    { id:'self_fund', title:'Self Fund', preview:'Click to see what you would need to cover yourself.', result:offers.selfFund.text, enabled:true },
    { id:'scholarship', title:'Scholarship', preview:'Click to see whether a scholarship came through.', result:offers.scholarship.text, enabled:true },
  ];
  return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    ${cards.map(card => {
      const active = selected.has(card.id);
      const bodyText = active ? card.result : card.preview;
      return `<button onclick="${card.enabled ? `toggleUniversityFundingSource('${card.id}')` : `showToast('${card.result.replace(/'/g, "\\'")}')`}" style="padding:16px;border-radius:20px;border:1.5px solid ${active ? '#6d56c9' : '#e3d8cb'};background:${active ? '#f6f1ff' : '#fff'};text-align:left;cursor:pointer;opacity:${card.enabled ? 1 : 0.72}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="font-size:15px;font-weight:800;color:#171510">${card.title}</div>
          <div style="width:22px;height:22px;border-radius:50%;border:1px solid ${active ? '#6d56c9' : '#b9aea2'};background:${active ? '#6d56c9' : '#fff'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px">${active ? '✓' : ''}</div>
        </div>
        <div style="font-size:12px;line-height:1.45;color:#655d56;margin-top:8px">${bodyText}</div>
      </button>`;
    }).join('')}
  </div>`;
}

function buildFundingReviewScreen() {
  const review = buildUniversityFundingReview(getUniversityApplicationDraft());
  const selectedUni = getUniversityCurrentSelection();
  return `
    <div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Funding Breakdown', 'Review everything before you submit.')}
      <div style="padding:16px;border-radius:20px;background:#fff;border:1px solid #eadfd3">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70">Application</div>
        <div style="font-size:22px;font-weight:900;color:#171510;margin-top:6px">${selectedUni?.name || _uniApplyDraft?.universityName}</div>
        <div style="font-size:13px;color:#6a6159;margin-top:4px">${getUniversityCourseLabel(_uniApplyDraft?.course)} • Tuition ${fmtMoney(UNIVERSITY_TUITION_FEE_PER_YEAR)}/year</div>
      </div>
      <div style="padding:16px;border-radius:20px;background:#fff;border:1px solid #eadfd3">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70;margin-bottom:10px">Funding Breakdown</div>
        ${review.lines.length ? review.lines.map(line => `<div style="font-size:14px;color:#241d17;line-height:1.55">• ${line}</div>`).join('') : '<div style="font-size:14px;color:#6a6159">No funding selected yet.</div>'}
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #eee2d5;font-size:13px;color:${review.remainingTuition > 0 ? '#b45c4d' : '#4b8754'};font-weight:800">
          ${review.remainingTuition > 0 ? `Remaining Tuition Gap: ${fmtMoney(review.remainingTuition)}/year` : 'Tuition fully planned.'}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button onclick="previousUniApplicationStep()" style="padding:15px;border:1px solid #ddd1c4;border-radius:18px;background:#fff;font-size:14px;font-weight:800;color:#6a6159;cursor:pointer">Edit Choices</button>
        <button onclick="nextUniApplicationStep()" style="padding:15px;border:1px solid #6d56c9;border-radius:18px;background:linear-gradient(90deg,#6d56c9,#846be6);font-size:14px;font-weight:800;color:#fff;cursor:pointer">Submit Application</button>
      </div>
    </div>`;
}

function buildUniApplicationScreen() {
  _uniApplyDraft = getUniversityApplicationDraft();
  if (_learnScreen === 'uniApplyCourse') {
    return `<div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Choose Course', 'Pick the degree you want to study first.')}
      ${buildUniversityCourseSelectionCards()}
      <button onclick="nextUniApplicationStep()" style="width:100%;padding:18px;border-radius:22px;border:1px solid ${_uniApplyDraft.course ? '#6d56c9' : '#ddd1c4'};background:${_uniApplyDraft.course ? 'linear-gradient(90deg,#6d56c9,#846be6)' : '#ece4dc'};color:${_uniApplyDraft.course ? '#fff' : '#94877b'};font-size:15px;font-weight:800;cursor:pointer">Next: Choose University</button>
    </div>`;
  }
  if (_learnScreen === 'uniApplyUniversity') {
    const primary = getUniversityCurrentSelection();
    const backup = getUniversityBackupSelection();
    return `<div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Choose University', 'Prestige matters for networking, internships and graduate schemes.')}
      <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:#fff;border:1px solid #ece4da;font-size:11px;font-weight:700;color:#4f4741">${getUniversityCourseLabel(_uniApplyDraft.course)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button onclick="setUniversityChoiceSlot('primary')" style="padding:14px;border-radius:18px;border:1px solid ${_uniUniversityChoiceSlot === 'primary' ? '#6d56c9' : '#e7ddd1'};background:${_uniUniversityChoiceSlot === 'primary' ? '#f6f1ff' : '#fff'};text-align:left;cursor:pointer">
          <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70">First Choice</div>
          <div style="font-size:15px;font-weight:800;color:#171510;margin-top:6px">${primary?.name || 'Choose university'}</div>
        </button>
        <button onclick="setUniversityChoiceSlot('backup')" style="padding:14px;border-radius:18px;border:1px solid ${_uniUniversityChoiceSlot === 'backup' ? '#6d56c9' : '#e7ddd1'};background:${_uniUniversityChoiceSlot === 'backup' ? '#f6f1ff' : '#fff'};text-align:left;cursor:pointer">
          <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70">Backup Choice</div>
          <div style="font-size:15px;font-weight:800;color:#171510;margin-top:6px">${backup?.name || 'Optional backup'}</div>
        </button>
      </div>
      ${buildUniversitySelectionCards()}
      <button onclick="nextUniApplicationStep()" style="width:100%;padding:18px;border-radius:22px;border:1px solid ${_uniApplyDraft.universityName ? '#6d56c9' : '#ddd1c4'};background:${_uniApplyDraft.universityName ? 'linear-gradient(90deg,#6d56c9,#846be6)' : '#ece4dc'};color:${_uniApplyDraft.universityName ? '#fff' : '#94877b'};font-size:15px;font-weight:800;cursor:pointer">Next: Plan Finances</button>
    </div>`;
  }
  if (_learnScreen === 'uniApplyFinances') {
    const selectedUni = getUniversityCurrentSelection();
    const review = buildUniversityFundingReview(_uniApplyDraft);
    return `<div style="display:flex;flex-direction:column;gap:16px;padding-bottom:10px">
      ${buildUniPageHeader('Plan Finances', 'Choose one or more funding methods.')}
      <div style="padding:16px;border-radius:20px;background:#fff;border:1px solid #eadfd3">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70">Selected University</div>
        <div style="font-size:22px;font-weight:900;color:#171510;margin-top:6px">${selectedUni?.name || _uniApplyDraft.universityName || 'University'}</div>
        <div style="font-size:13px;color:#6a6159;margin-top:4px">${selectedUni?.tier || ''} • ${getUniversityCourseLabel(_uniApplyDraft.course)}</div>
      </div>
      ${buildUniversityFundingCardsRebuild()}
      <div style="padding:16px;border-radius:20px;background:#fff;border:1px solid #eadfd3">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7c70;margin-bottom:10px">Funding Result</div>
        ${review.lines.length
          ? `${review.lines.map(line => `<div style="font-size:14px;color:#241d17;line-height:1.55">• ${line}</div>`).join('')}
             <div style="margin-top:12px;padding-top:10px;border-top:1px solid #eee2d5;font-size:13px;font-weight:800;color:${review.remainingTuition > 0 ? '#b45c4d' : '#4b8754'}">
               ${review.remainingTuition > 0 ? `Still Uncovered: ${fmtMoney(review.remainingTuition)}/year` : 'Your tuition plan is fully covered.'}
             </div>`
          : `<div style="font-size:13px;line-height:1.5;color:#6a6159">Click Student Loan, Parents, Self Fund, or Scholarship to reveal each result and build your funding plan.</div>`}
      </div>
      <button onclick="nextUniApplicationStep()" style="width:100%;padding:18px;border-radius:22px;border:1px solid ${(_uniApplyDraft.selectedFundingSources || []).length ? '#6d56c9' : '#ddd1c4'};background:${(_uniApplyDraft.selectedFundingSources || []).length ? 'linear-gradient(90deg,#6d56c9,#846be6)' : '#ece4dc'};color:${(_uniApplyDraft.selectedFundingSources || []).length ? '#fff' : '#94877b'};font-size:15px;font-weight:800;cursor:pointer">Review Funding Breakdown</button>
    </div>`;
  }
  return buildFundingReviewScreen();
}

function buildUniversityHeroCard() {
  const uniName = STATE.school.current || STATE.school.postSchool?.uniApplication?.acceptedUniversityName || 'University';
  const { course, totalYears, currentYear } = getUniversityYearMeta();
  const grade = gradeFromScore(STATE.school.gradeScore || 0);
  return `
    <div class="learn-school-hero" style="background:linear-gradient(180deg, #fffefe 0%, #faf7ff 100%);border:1px solid rgba(224,212,242,0.95)">
      <div class="learn-school-hero-inner">
        <div class="learn-school-hero-copy">
          <div style="display:inline-flex;align-items:center;width:fit-content;background:#ede4ff;border-radius:999px;padding:7px 14px;font-size:11px;font-weight:800;color:#6957c3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px">University</div>
          <div class="learn-school-name" style="color:#172039">${uniName}</div>
          <div class="learn-school-yearline" style="color:#6d6587">${getUniversityCourseLabel(course)} • Year ${currentYear} of ${totalYears}</div>
        </div>
        <div class="learn-school-hero-side">
          <div class="learn-school-grade" style="background:linear-gradient(180deg, #f2ebff 0%, #ece3ff 100%)">
            <div class="learn-school-grade-label">Grade</div>
            <div class="learn-school-grade-value" style="color:#7458d5">${grade}</div>
          </div>
          <img src="${UNI_PREVIEW_IMAGE}" alt="University illustration" class="learn-school-illustration" />
        </div>
      </div>
    </div>`;
}

function getUniversityStanding() {
  return getUniversityPrestigeStanding();
}

function ensureUniversityCommitmentState() {
  if (!STATE.education) STATE.education = {};
  if (!STATE.volunteering) STATE.volunteering = { currentRole:null };
  if (!('currentInternship' in STATE.education)) STATE.education.currentInternship = null;
  if (!('currentPlacement' in STATE.education)) STATE.education.currentPlacement = null;
  if (!('isCourseRep' in STATE.education)) STATE.education.isCourseRep = false;
  if (!('courseRepTitle' in STATE.education)) STATE.education.courseRepTitle = null;
  if (!Array.isArray(STATE.education.internshipHistory)) STATE.education.internshipHistory = [];
  if (!STATE.education.graduateSchemePreparation) STATE.education.graduateSchemePreparation = { active:false, companyName:null, title:null };
  if (!STATE.education.graduateSchemeOffer) STATE.education.graduateSchemeOffer = null;
  if (!Array.isArray(STATE.education.societyMemberships)) STATE.education.societyMemberships = [];
  if (!('societyInvolvement' in STATE.education)) STATE.education.societyInvolvement = 0;
  if (!('networking' in STATE.education)) STATE.education.networking = 0;
  return STATE.education;
}

function getUniversityActiveCommitments() {
  ensureUniversityCommitmentState();
  const commitments = [];
  if (STATE.education.currentInternship) commitments.push({ type:'internship', title:STATE.education.currentInternship.title, subtitle:STATE.education.currentInternship.subtitle || 'Current internship' });
  if (STATE.education.graduateSchemePreparation?.active) commitments.push({ type:'graduate_scheme', title:STATE.education.graduateSchemePreparation.companyName || 'Graduate Scheme Prep', subtitle:'Applications and interviews are ongoing' });
  if (STATE.volunteering?.currentRole) commitments.push({ type:'volunteering', title:STATE.volunteering.currentRole.title, subtitle:STATE.volunteering.currentRole.subtitle || 'Current volunteering role' });
  if (STATE.education.isCourseRep) commitments.push({ type:'course_rep', title:STATE.education.courseRepTitle || 'Course Representative', subtitle:'Representing your cohort' });
  if (STATE.career?.job && STATE.career.job !== 'None') commitments.push({ type:'job', title:`Part-Time Job at ${STATE.career.companyName || 'Campus Workplace'}`, subtitle:'Earning money alongside your degree' });
  return commitments;
}

function getUniversityCurrentCommitment() {
  return getUniversityActiveCommitments()[0] || null;
}

function applyUniversityCommitmentAnnualEffects() {
  if (STATE.school.level !== 'uni') return;
  const commitments = getUniversityActiveCommitments();
  if (commitments.length <= 1) return;
  const overload = commitments.length - 1;
  applyEffects({
    gradeScore: -(4 * overload),
    happy: -(3 * overload),
    rel_friends: -(2 * overload),
  });
  if (commitments.length >= 3) applyEffects({ health:-2 });
  logActivity(`Balancing ${commitments.length} university commitments took a toll on your grades and social life.`, null);
}

function buildUniversityCommitmentCard() {
  const commitments = getUniversityActiveCommitments();
  const chips = commitments.length
    ? commitments.map(item => `<span style="display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#fff7e9;border:1px solid #ead8bb;font-size:11px;font-weight:800;color:#8a6832">${item.title}</span>`).join('')
    : `<span style="font-size:13px;color:#6f665f">No major commitment yet.</span>`;
  return `
    <div style="margin-top:18px;padding:18px 16px;border-radius:24px;background:#fff;border:1px solid rgba(231,221,209,0.95);box-shadow:0 12px 28px rgba(64,42,22,0.05)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px">
        <div>
          <div style="font-size:11px;font-weight:800;color:#d78e36;letter-spacing:.08em;text-transform:uppercase">Commitments</div>
          <div style="font-size:15px;font-weight:800;color:#171510;line-height:1.15;margin-top:4px">Balance matters here</div>
        </div>
        <button onclick="openLearnScreen('uniCommitment')" style="padding:10px 12px;border:1px solid #eadfd3;border-radius:14px;background:#fffaf2;font-size:12px;font-weight:800;color:#7a6343;cursor:pointer">Manage</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">${chips}</div>
      ${STATE.career?.job && STATE.career.job !== 'None' ? '' : `<button onclick="openJobBoard('part-time')" style="margin-top:14px;width:100%;padding:13px 14px;border:1px solid #eadfd3;border-radius:16px;background:#fff;font-size:13px;font-weight:800;color:#171510;cursor:pointer">Apply for a Part-Time Job</button>`}
    </div>`;
}

function buildUniversityHomeScreen() {
  ensureUniversityCommitmentState();
  return `
    <div style="display:flex;flex-direction:column;gap:0">
      ${buildUniversityMainSectionList()}
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px">
        <div style="padding:14px;border-radius:18px;background:#fff;border:1px solid #ece1d4">
          <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8d8175">Networking</div>
          <div style="font-size:24px;font-weight:900;color:#171510;margin-top:6px">${STATE.education.networking || 0}</div>
        </div>
        <div style="padding:14px;border-radius:18px;background:#fff;border:1px solid #ece1d4">
          <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8d8175">Society Involvement</div>
          <div style="font-size:24px;font-weight:900;color:#171510;margin-top:6px">${STATE.education.societyInvolvement || 0}</div>
        </div>
      </div>
      ${buildUniversityCommitmentCard()}
    </div>`;
}

function buildUniversitySocialPage() {
  const flatmates = (typeof getCurrentHomeResidents === 'function' ? getCurrentHomeResidents(getCurrentHome()) : []).filter(resident => resident.refType === 'roommate');
  const hasMessy = flatmates.some(resident => (resident.traits || []).includes('messy'));
  const hasLoud = flatmates.some(resident => (resident.traits || []).includes('loud'));
  const rows = [
    ['society_event', 'Go to a Society Event', 'Attend, network, flirt, or embarrass yourself'],
    ['uni_cm_study', 'Study with a Course Mate', 'Keep grades moving and strengthen a bond'],
    ['uni_cm_coffee', 'Grab Coffee with a Course Mate', 'A quieter social move'],
    ['uni_cm_clubbing', 'Go Clubbing with a Course Mate', 'Fun, chaos, and chemistry'],
    ['uni_cm_friend', 'Ask a Course Mate to Be Friends', 'Turn casual familiarity into a real bond'],
    ['uni_cm_flirt', 'Flirt with a Course Mate', 'See whether the chemistry is mutual'],
    ['uni_cm_hook_up', 'Hook Up with a Course Mate', 'Messy, risky, memorable'],
    ['uni_cm_gossip', 'Gossip with a Course Mate', 'Information spreads fast on campus'],
    ['flatmate_movie', 'Watch Movie Together', 'A low-stakes flat night'],
    ['flatmate_kitchen', 'Chat in Kitchen', 'Build household rapport'],
    ['flatmate_friend', 'Ask Flatmate to Be Friends', 'Turn a flatshare into a bond'],
    ['flatmate_flirt', 'Flirt with a Flatmate', 'Dangerous, tempting, very close to home'],
    ['flatmate_hook_up', 'Hook Up with a Flatmate', 'Fast chemistry, bigger fallout'],
    ['flatmate_ask_out', 'Ask Out a Flatmate', 'Make it official or make it awkward'],
    ['flatmate_night_out', 'Night Out Together', 'Drinks, drama, and blurry decisions'],
    ['flatmate_argue', 'Argue', 'Sometimes flatshares explode'],
  ];
  if (hasMessy) rows.push(['flatmate_mess', 'Complain About Mess', 'Only worth it if the place is getting grim']);
  if (hasLoud) rows.push(['flatmate_noise', 'Argue About Noise', 'A classic student-house fight']);
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Social', 'Course mates, societies, flatmates and chaos.')}
      <div style="margin-top:18px">
        ${rows.map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, 'Social')).join('')}
      </div>
    </div>`;
}

function buildUniversityCareersPage() {
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Careers', 'Event-driven career building while you study.')}
      ${[
        ['apply_summer_internship', 'Apply for Internship', 'Top firms are hard, lower-tier internships are more accessible'],
        ['apply_graduate_scheme', 'Apply for Graduate Scheme', isUniversityFinalTwoYears() ? 'Final-year pressure starts paying off now' : 'You can build prep early, but top offers come later'],
        ['go_careers_fair', 'Go to Careers Fair', 'Meet employers and spot openings'],
        ['attend_networking_event', 'Attend Networking Event', 'Build contacts that move applications'],
        ['get_career_advice', 'Get Career Advice', 'Contextual advice based on your actual profile'],
        ['become_course_rep', 'Become Course Representative', 'Good for reputation and future references'],
        ['start_volunteering', 'Volunteer', 'Especially useful for Education and community-facing paths'],
      ].map(([id, title, subtitle]) => buildUniversityListRow(title, subtitle, `runUniversityAction('${id}')`, 'Career')).join('')}
    </div>`;
}

function buildUniversityCommitmentPage() {
  const commitments = getUniversityActiveCommitments();
  return `
    <div class="learn-school-page">
      ${buildUniversitySubPageHeader('Commitments', 'You can stack commitments, but there is a cost.')}
      <div class="learn-school-note-card">
        <div class="learn-school-note-label">Current Load</div>
        <div class="learn-school-note-copy">${commitments.length ? commitments.map(item => item.title).join(' • ') : 'No major commitment yet.'}</div>
      </div>
      ${STATE.career?.job && STATE.career.job !== 'None' ? '' : buildUniversityListRow('Apply for a Part-Time Job', 'You can still do this even if you already have an internship', `openJobBoard('part-time')`, 'Work')}
      ${buildUniversityListRow('Work Harder', 'Push harder across your commitments', `runUniversityAction('uni_commitment_work_harder')`, 'Action')}
      ${buildUniversityListRow('Slack Off', 'Protect your energy but risk progress', `runUniversityAction('uni_commitment_slack_off')`, 'Action')}
      ${STATE.career?.job && STATE.career.job !== 'None' ? buildUniversityListRow('Ask for More Shifts', 'Earn more, but increase pressure', `runUniversityAction('uni_commitment_more_shifts')`, 'Work') : ''}
      ${buildUniversityListRow('Network Through Commitments', 'Turn your workload into contacts', `runUniversityAction('uni_commitment_network')`, 'Career')}
      ${buildUniversityListRow('Quit a Commitment', 'Walk away from one of your current commitments', `runUniversityAction('uni_commitment_quit')`, 'Exit')}
    </div>`;
}

function getUniversityCareerTrack(courseId = STATE.school.postSchool?.uniApplication?.course) {
  return UNIVERSITY_REBUILD_CAREERS[courseId] || UNIVERSITY_REBUILD_CAREERS.Business;
}

function getUniversityCareerStrength() {
  ensureUniversityCommitmentState();
  const prestige = getUniversityPrestigeStanding() * 28;
  const grades = Math.max(0, (STATE.school.gradeScore || 0) - 50) * 0.42;
  const networking = (STATE.education.networking || 0) * 0.8;
  const internships = (STATE.education.internshipHistory || []).length * 7;
  const societies = (STATE.education.societyInvolvement || 0) * 0.6;
  return prestige + grades + networking + internships + societies;
}

function maybeOfferEmployerSponsorship(company) {
  const application = STATE.school.postSchool?.uniApplication;
  const course = application?.course;
  if (!application || course === 'Education') return false;
  if (!company?.sponsorEligible) return false;
  if (Math.random() >= 0.7) return false;
  const recurringSupport = (application.studentLoanAmountPerYear || 0) + (application.parentalFundingAmountPerYear || 0) + ((application.scholarshipPaymentType === 'yearly') ? (application.scholarshipAmount || 0) : 0);
  const remaining = Math.max(0, UNIVERSITY_TUITION_FEE_PER_YEAR - Math.min(UNIVERSITY_TUITION_FEE_PER_YEAR, recurringSupport));
  if (!remaining) return false;
  application.employerSponsorshipPerYear = remaining;
  application.employerSponsorName = company.company;
  application.selectedFundingSources = Array.from(new Set([...(application.selectedFundingSources || []), 'employer_sponsorship']));
  syncUniversityApplicationState(application);
  logActivity(`${company.company} offered to cover your remaining tuition fees.`, 10);
  return true;
}

function handleUniversityInternshipApplication() {
  ensureUniversityCommitmentState();
  if (STATE.education.currentInternship) return { log:'You already have an internship lined up.', toast:'You already have one.' };
  const track = getUniversityCareerTrack();
  const pool = track.internship || [];
  const company = pickRandom(pool);
  const chance = clamp(42 + getUniversityCareerStrength() - (company.difficulty || 30), 12, 92);
  if (Math.random() * 100 < chance) {
    STATE.education.currentInternship = { title:`${company.title} at ${company.company}`, subtitle:'Current internship', companyName:company.company, internshipOnly:!!company.internshipOnly };
    STATE.education.internshipHistory.push({ companyName:company.company, title:company.title, age:STATE.age, internshipOnly:!!company.internshipOnly });
    return { log:`You landed ${company.title} at ${company.company}.`, toast:'Internship secured.' };
  }
  return { log:`${company.company} turned you down for ${company.title}.`, toast:'Application unsuccessful.' };
}

function handleGraduateSchemeApplication() {
  ensureUniversityCommitmentState();
  const track = getUniversityCareerTrack();
  const pool = track.graduate || [];
  const company = pickRandom(pool);
  const finalYearsBoost = isUniversityFinalTwoYears() ? 8 : -8;
  const chance = clamp(18 + getUniversityCareerStrength() + finalYearsBoost - (company.difficulty || 40), 4, 84);
  if (Math.random() * 100 < chance) {
    STATE.education.graduateSchemePreparation = { active:true, companyName:company.company, title:company.title };
    STATE.education.graduateSchemeOffer = { companyName:company.company, title:company.title, securedAge:STATE.age };
    const sponsorship = maybeOfferEmployerSponsorship(company);
    return {
      log: sponsorship
        ? `${company.company} offered you ${company.title} and agreed to fund the rest of your tuition.`
        : `${company.company} offered you ${company.title} after graduation.`,
      toast:'Graduate scheme secured.',
    };
  }
  STATE.education.graduateSchemePreparation = { active:true, companyName:company.company, title:company.title };
  return { log:`You started preparing and applying for graduate schemes, but ${company.company} passed for now.`, toast:'Applications sent.' };
}

function getContextualCareerAdvice() {
  ensureUniversityCommitmentState();
  const grade = STATE.school.gradeScore || 0;
  const internships = (STATE.education.internshipHistory || []).length;
  const networking = STATE.education.networking || 0;
  const prestige = getUniversityPrestigeStanding();
  const { currentYear, totalYears } = getUniversityYearMeta();
  if (grade < 70) return 'The counsellor said I should improve my grades.';
  if (!internships && currentYear <= 2) return 'The counsellor encouraged me to apply for internships.';
  if ((STATE.volunteering?.currentRole ? 0 : 1) && getUniversityCourseLabel(STATE.school.postSchool?.uniApplication?.course) === 'Education') return 'The counsellor recommended volunteering.';
  if (currentYear >= Math.max(2, totalYears - 1) && prestige >= 0.45 && networking < 8) return 'The counsellor encouraged me to build my network before graduate scheme season.';
  if (currentYear >= Math.max(2, totalYears - 1) && grade >= 80) return 'The counsellor encouraged me to apply for graduate schemes.';
  if (internships > 0 && networking >= 8 && grade >= 78) return 'The counsellor said to keep doing what I’m doing.';
  return 'The counsellor recommended volunteering.';
}

function launchUniversitySocietyEvent() {
  ensureUniversityCommitmentState();
  const course = STATE.school.postSchool?.uniApplication?.course;
  const pool = UNIVERSITY_REBUILD_SOCIETY_EVENTS[course] || UNIVERSITY_REBUILD_SOCIETY_EVENTS.Business;
  const eventName = pickRandom(pool);
  openEvent({
    id: `uni_society_${STATE.age}_${eventName}`,
    category: 'Society',
    title: eventName,
    text: `A course society event is happening tonight. It could help your social life, reputation, and future applications.`,
    choices: [
      { text:'Attend', effects:{ happy:+2, rel_friends:+2, gradeScore:+1 }, log:`You turned up to ${eventName}.`, onChoose:() => { STATE.education.societyInvolvement += 2; } },
      { text:'Skip', effects:{ happy:+1 }, log:`You skipped ${eventName}.` },
      { text:'Network', effects:{ rep:+2, rel_friends:+2 }, log:`You networked hard at ${eventName}.`, onChoose:() => { STATE.education.networking += 3; STATE.education.societyInvolvement += 2; } },
      { text:'Apply for Internship', effects:{ rep:+1 }, log:`You chased opportunities at ${eventName}.`, onChoose:() => {
        STATE.education.networking += 2;
        if (!STATE.education.currentInternship && Math.random() < 0.35) {
          const result = handleUniversityInternshipApplication();
          logActivity(result.log, 6);
        }
      } },
      { text:'Embarrass Yourself', effects:{ happy:-1, rep:-3 }, log:`You embarrassed yourself at ${eventName}.` },
      { text:'Flirt', effects:{ happy:+2, rel_friends:+1 }, log:`You flirted your way through ${eventName}.` },
    ],
  });
}

function getUniversityFlatmates() {
  const home = typeof getCurrentHome === 'function' ? getCurrentHome() : null;
  const residents = typeof getCurrentHomeResidents === 'function' ? getCurrentHomeResidents(home) : [];
  return residents.filter(resident => resident.refType === 'roommate');
}

function handleUniversityCoursemateAction(classmateId, actionId) {
  const classmate = getUniversityCoursemateById(classmateId) || STATE.school.classmates.find(item => item.id === classmateId);
  if (!classmate) return;
  const update = (effects, logText) => {
    applyEffects(effects || {});
    classmate.relationship = clamp((classmate.relationship || 50) + (effects?.rel_friends || 0) + 4);
    if (typeof markNpcInteraction === 'function') markNpcInteraction(classmate, logText);
    logActivity(logText, null);
    saveGame();
    renderLearnTab();
  };
  if (actionId === 'uni_cm_study') return update({ smarts:+2, gradeScore:+3, rel_friends:+3 }, `Studied with ${classmate.firstName}.`);
  if (actionId === 'uni_cm_coffee') return update({ happy:+2, rel_friends:+3 }, `Grabbed coffee with ${classmate.firstName}.`);
  if (actionId === 'uni_cm_clubbing') return update({ happy:+4, rel_friends:+2, gradeScore:-1 }, `Went clubbing with ${classmate.firstName}.`);
  if (actionId === 'uni_cm_friend') {
    if (typeof ensureNpcCoreFields === 'function') {
      ensureNpcCoreFields(classmate, { role:'friend', socialGroup:'university friend' });
    }
    classmate.status = 'friend';
    classmate.socialGroup = 'university friend';
    if (typeof upsertPersistentFriend === 'function') upsertPersistentFriend(classmate);
    if (STATE.relationships?.friends !== undefined) {
      STATE.relationships.friends = clamp((STATE.relationships.friends || 0) + 8);
    }
    return update({ rel_friends:+4, happy:+2 }, `${classmate.firstName} became one of your university friends.`);
  }
  if (actionId === 'uni_cm_flirt') {
    const success = (classmate.relationship || 50) >= 56 || Math.random() < 0.45;
    return update(success ? { happy:+3, rel_friends:+2 } : { happy:-1, rel_friends:-1 }, success ? `You flirted with ${classmate.firstName} and they seemed into it.` : `You flirted with ${classmate.firstName}, but it landed awkwardly.`);
  }
  if (actionId === 'uni_cm_hook_up') {
    const success = (classmate.relationship || 50) >= 66 || Math.random() < 0.32;
    return update(success ? { happy:+5, rel_friends:+1 } : { happy:-2, rel_friends:-3 }, success ? `Things escalated with ${classmate.firstName}.` : `Trying to hook up with ${classmate.firstName} made things awkward.`);
  }
  if (actionId === 'uni_cm_gossip') return update({ rel_friends:+1, rep:-1 }, `You traded gossip with ${classmate.firstName}.`);
}

function handleFlatmateInteraction(actionId) {
  const flatmates = getUniversityFlatmates();
  const resident = pickRandom(flatmates);
  if (!resident) return { log:'You do not currently have any flatmates.', toast:'No flatmates right now.' };
  const person = resident.friendProfile || resident;
  const log = text => `${text} ${person.firstName}.`;
  if (actionId === 'flatmate_movie') return { log:log('Watched a movie with'), toast:'Flat night.' , effects:{ happy:+2, rel_friends:+2 } };
  if (actionId === 'flatmate_kitchen') return { log:log('Chatted in the kitchen with'), toast:'Kitchen chat.', effects:{ happy:+1, rel_friends:+2 } };
  if (actionId === 'flatmate_friend') return { log:log('Asked to be friends with'), toast:'You made the first move.', effects:{ rel_friends:+3, happy:+1 } };
  if (actionId === 'flatmate_flirt') return { log:log('Flirted with'), toast:'Very close-to-home energy.', effects:{ happy:+2, rel_friends:+1 } };
  if (actionId === 'flatmate_hook_up') return { log:log('Hooked up with'), toast:'That will change the flat dynamic.', effects:{ happy:+4, rel_friends:-1 } };
  if (actionId === 'flatmate_ask_out') return { log:log('Asked out'), toast:'Big move.', effects:{ happy:+2, rel_friends:+1 } };
  if (actionId === 'flatmate_night_out') return { log:log('Went on a night out with'), toast:'Big night.', effects:{ happy:+4, rel_friends:+2, gradeScore:-1 } };
  if (actionId === 'flatmate_argue') return { log:log('Argued with'), toast:'The flat feels tense.', effects:{ happy:-2, rel_friends:-3 } };
  if (actionId === 'flatmate_mess') return { log:log('Complained about the mess to'), toast:'The kitchen was grim.', effects:{ happy:-1, rel_friends:-2 } };
  if (actionId === 'flatmate_noise') return { log:log('Argued about noise with'), toast:'The walls are thin.', effects:{ happy:-2, rel_friends:-2 } };
  return null;
}

function runUniversityAction(actionId) {
  ensureUniversityCommitmentState();
  const coursemates = getUniversityCoursemates();
  const randomCoursemate = coursemates[Math.floor(Math.random() * coursemates.length)] || null;
  const logAndRefresh = (log, toast) => {
    if (log) logActivity(log, null);
    saveGame();
    renderLearnTab();
    if (toast) showToast(toast);
  };
  if (actionId === 'society_event') {
    launchUniversitySocietyEvent();
    return;
  }
  if (actionId.startsWith('uni_cm_')) {
    const coursemate = pickRandom(getUniversityCoursemates());
    if (!coursemate) {
      showToast('No course mates available.');
      return;
    }
    handleUniversityCoursemateAction(coursemate.id, actionId);
    return;
  }
  if (actionId.startsWith('flatmate_')) {
    const result = handleFlatmateInteraction(actionId);
    if (!result) return;
    applyEffects(result.effects || {});
    logActivity(result.log, null);
    saveGame();
    renderLearnTab();
    if (result.toast) showToast(result.toast);
    return;
  }
  if (actionId === 'apply_summer_internship') {
    const result = handleUniversityInternshipApplication();
    logActivity(result.log, null);
    saveGame();
    renderLearnTab();
    showToast(result.toast);
    return;
  }
  if (actionId === 'apply_graduate_scheme') {
    const result = handleGraduateSchemeApplication();
    logActivity(result.log, null);
    saveGame();
    renderLearnTab();
    showToast(result.toast);
    return;
  }
  if (actionId === 'go_careers_fair') {
    STATE.education.networking += 2;
    applyEffects({ rep:+2, happy:+1 });
    logActivity('You worked the careers fair and came away with useful leads.', null);
    saveGame();
    renderLearnTab();
    showToast('Useful contacts made.');
    return;
  }
  if (actionId === 'attend_networking_event') {
    STATE.education.networking += 3;
    applyEffects({ rep:+3, rel_friends:+1 });
    logActivity('You attended a networking event and met useful people.', null);
    saveGame();
    renderLearnTab();
    showToast('You met useful people.');
    return;
  }
  if (actionId === 'get_career_advice') {
    const advice = getContextualCareerAdvice();
    applyEffects({ happy:+1 });
    logActivity(advice, null);
    saveGame();
    renderLearnTab();
    showToast('Career advice updated.');
    return;
  }
  if (actionId === 'become_course_rep') {
    STATE.education.isCourseRep = true;
    STATE.education.courseRepTitle = 'Course Representative';
    logActivity('You became the course representative.', null);
    saveGame();
    renderLearnTab();
    showToast('You are now course rep.');
    return;
  }
  if (actionId === 'start_volunteering') {
    if (!STATE.volunteering.currentRole) STATE.volunteering.currentRole = { title:'Volunteer Role at Community Hub', subtitle:'Current volunteering role' };
    logActivity('You started volunteering alongside university.', null);
    saveGame();
    renderLearnTab();
    showToast('You started volunteering.');
    return;
  }
  if (actionId === 'attend_lecture') {
    applyEffects({ smarts:+3, gradeScore:+4 });
    return logAndRefresh('Attended your lectures and stayed on top of the material.', 'You kept up with the course.');
  }
  if (actionId === 'skip_lecture') {
    applyEffects({ happy:+2, gradeScore:-3 });
    return logAndRefresh('Skipped a lecture and bought yourself some free time.', 'You skipped class.');
  }
  if (actionId === 'study_library') {
    applyEffects({ smarts:+4, gradeScore:+5, happy:-1 });
    return logAndRefresh('Put in a quiet study session in the library.', 'Library session done.');
  }
  if (actionId === 'revise_exams') {
    applyEffects({ gradeScore:+6, smarts:+2, happy:-2 });
    return logAndRefresh('Revised hard for your exams.', 'Revision helped.');
  }
  if (actionId === 'pull_all_nighter') {
    applyEffects({ gradeScore:+4, health:-3, happy:-3 });
    return logAndRefresh('Pulled an all-nighter to get through your workload.', 'You are exhausted.');
  }
  if (actionId === 'use_ai_assignment_uni') {
    applyEffects({ gradeScore:+4 });
    if (Math.random() < 0.32) {
      applyEffects({ rep:-4, gradeScore:-6 });
      return logAndRefresh('You were questioned about using AI on an assignment.', 'You got away with less than you hoped.');
    }
    return logAndRefresh('Used AI to speed up an assignment and it seemed to work.', 'Nobody called it out.');
  }
  if (actionId === 'plagiarise_assignment_uni') {
    if (Math.random() < 0.58) {
      applyEffects({ rep:-8, gradeScore:-10 });
      return logAndRefresh('You were caught plagiarising an assignment.', 'Plagiarism backfired.');
    }
    applyEffects({ gradeScore:+5 });
    return logAndRefresh('You plagiarised an assignment and got away with it.', 'You were not caught.');
  }
  if (actionId === 'go_clubbing' || actionId === 'attend_house_party' || actionId === 'throw_house_party' || actionId === 'host_pre_drinks') {
    applyEffects({ happy:+4, rel_friends:+3 });
    if (randomCoursemate) randomCoursemate.relationship = clamp((randomCoursemate.relationship || 50) + 8);
    return logAndRefresh('You leaned into the social side of university.', 'Your social life picked up.');
  }
  if (actionId === 'join_society') {
    openLearnScreen('uniSocietyList');
    return;
  }
  if (actionId === 'join_club') {
    openLearnScreen('uniClubList');
    return;
  }
  if (actionId === 'make_new_friends_uni') {
    if (randomCoursemate) randomCoursemate.relationship = clamp((randomCoursemate.relationship || 50) + 14);
    applyEffects({ rel_friends:+5, happy:+2 });
    return logAndRefresh(`You made more of an effort with people on your course${randomCoursemate ? `, especially ${randomCoursemate.firstName}` : ''}.`, 'You met more people.');
  }
  if (actionId === 'ask_someone_out_uni') {
    applyEffects({ happy:+2 });
    return logAndRefresh('You asked someone out from your university circle.', 'You put yourself out there.');
  }
  if (actionId === 'uni_commitment_work_harder') {
    if (getUniversityCurrentCommitment()?.type === 'job') return runCareerAction('work_hard');
    applyEffects({ rep:+2, happy:-1 });
    return logAndRefresh('You put more effort into your current commitment.', 'You pushed harder.');
  }
  if (actionId === 'uni_commitment_slack_off') {
    if (getUniversityCurrentCommitment()?.type === 'job') return runCareerAction('slack_off');
    applyEffects({ happy:+1, rep:-2 });
    return logAndRefresh('You coasted a little in your current commitment.', 'You took it easier.');
  }
  if (actionId === 'uni_commitment_more_shifts') {
    STATE.finances.balance += 250;
    return logAndRefresh('You asked for more shifts and earned a bit more money.', 'More shifts picked up.');
  }
  if (actionId === 'uni_commitment_quit') {
    if (getUniversityCurrentCommitment()?.type === 'job') {
      fireFromJob('You quit your part-time role.');
    } else if (STATE.education.currentInternship) {
      STATE.education.currentInternship = null;
    } else if (STATE.education.graduateSchemePreparation?.active) {
      STATE.education.graduateSchemePreparation = { active:false, companyName:null, title:null };
    } else if (STATE.education.currentPlacement) {
      STATE.education.currentPlacement = null;
    } else if (STATE.education.isCourseRep) {
      STATE.education.isCourseRep = false;
      STATE.education.courseRepTitle = null;
    } else if (STATE.volunteering?.currentRole) {
      STATE.volunteering.currentRole = null;
    }
    return logAndRefresh('You stepped away from one of your current commitments.', 'Commitment ended.');
  }
  if (actionId === 'uni_commitment_network') {
    applyEffects({ rep:+3, rel_friends:+2 });
    STATE.education.networking += 2;
    return logAndRefresh('You used your commitments to meet more people.', 'You built connections.');
  }
  if (actionId === 'uni_commitment_coffee_chat') {
    applyEffects({ happy:+2, rel_friends:+2 });
    return logAndRefresh('You had a coffee chat that could help later.', 'Good conversation.');
  }
  if (actionId === 'uni_commitment_impress') {
    applyEffects({ rep:+4 });
    return logAndRefresh('You made a strong impression in your current commitment.', 'You stood out.');
  }
  showToast('Coming soon.');
}

function buildLearnClassmateActions(c) {
  const actions = getAvailableActions('classmate', STATE.age, c) || [];
  if (STATE.school?.level === 'uni') {
    actions.push(
      { id:'uni_cm_study', name:'Study Together' },
      { id:'uni_cm_coffee', name:'Grab Coffee' },
      { id:'uni_cm_clubbing', name:'Go Clubbing' },
      { id:'uni_cm_friend', name:'Ask to Be Friends' },
      { id:'uni_cm_flirt', name:'Flirt' },
      { id:'uni_cm_hook_up', name:'Hook Up' },
      { id:'uni_cm_gossip', name:'Gossip' },
    );
  }
  if (!actions.length) return '';
  return `
    <div style="display:flex;flex-direction:column;gap:8px">
      ${actions.map(action => `
        <button onclick="runLearnClassmateAction('${action.id}', '${c.id}')"
          style="width:100%;padding:11px 14px;background:${String(action.id).startsWith('uni_cm_') ? '#fff7ef' : 'var(--surface-mid)'};border:1px solid ${String(action.id).startsWith('uni_cm_') ? '#eadcca' : 'var(--border)'};border-radius:11px;font-size:13px;font-weight:${String(action.id).startsWith('uni_cm_') ? '700' : '600'};color:${String(action.id).startsWith('uni_cm_') ? '#6b5740' : 'var(--text)'};text-align:left;cursor:pointer">
          ${action.name}
        </button>`).join('')}
    </div>`;
}

function runLearnClassmateAction(actionId, classmateId) {
  if (String(actionId).startsWith('uni_cm_')) {
    _learnScreen = 'classmate';
    _learnClassmateId = classmateId;
    handleUniversityCoursemateAction(classmateId, actionId);
    return;
  }
  triggerAction(actionId, classmateId, 'classmate');
  _learnScreen = 'classmate';
  _learnClassmateId = classmateId;
  renderLearnTab();
}

const SIMPLE_CAREER_ROUTES = {
  Law: [
    { title:'Trainee Lawyer', years:2 },
    { title:'Lawyer', years:5 },
    { title:'Senior Lawyer', years:5 },
    { title:'Partner', years:0 },
  ],
  Medicine: [
    { title:'Trainee Doctor', years:2 },
    { title:'Doctor', years:5, branch:['Dentist', 'Physician', 'GP', 'Surgeon'] },
    { title:'Dentist', years:0 },
    { title:'Physician', years:0 },
    { title:'GP', years:0 },
    { title:'Surgeon', years:0 },
  ],
  Business: [
    { title:'Office Worker', years:3 },
    { title:'Manager', years:4 },
    { title:'Senior Manager', years:4 },
    { title:'Executive', years:5 },
    { title:'CEO', years:0 },
  ],
  Economics: [
    { title:'Junior Analyst', years:3 },
    { title:'Analyst', years:4 },
    { title:'Senior Analyst', years:5 },
    { title:'Investment Manager', years:0 },
  ],
  'Computer Science': [
    { title:'Junior Developer', years:3 },
    { title:'Software Engineer', years:5 },
    { title:'Tech Lead', years:0 },
  ],
  Education: [
    { title:'Teaching Assistant', years:3 },
    { title:'Teacher', years:5 },
    { title:'Head of Department', years:5 },
    { title:'Head Teacher', years:5 },
    { title:'Lecturer', years:5 },
    { title:'Professor', years:0 },
  ],
  Art: [
    { title:'Illustrator', years:0 },
    { title:'Fashion Designer', years:0 },
    { title:'Animator', years:0 },
    { title:'Tattoo Artist', years:0 },
    { title:'Photographer', years:0 },
  ],
};

const SIMPLE_LAW_BARRISTER_ROUTE = [
  { title:'Trainee Barrister', years:2 },
  { title:'Barrister', years:10 },
  { title:'Judge', years:0 },
];

const SIMPLE_CAREER_COMPANIES = {
  Law: ['Sterling LLP', 'Chance Crown & Co', 'Fairmount LLP', 'Blackstone Chambers', 'St John’s Chambers'],
  Medicine: ['Royal Westminster Hospital', 'Sterling Health Group'],
  Business: ['Ascot Capital', 'Silverstone Financial', 'Kingsguard Investments', 'Terranova', 'Ascot Tech'],
  Economics: ['Ascot Capital', 'Silverstone Financial', 'Kingsguard Investments'],
  'Computer Science': ['Terranova', 'Ascot Tech', 'Hyperion'],
  Education: ['Local Primary School', 'Community Secondary School', 'Further Education College', 'University of Oxford', 'University of Cambridge'],
  Art: ['Kindred Studio', 'Paper Moon Press', 'Creator Studio'],
};

const SIMPLE_LAW_SALARY_BANDS = {
  'Sterling LLP': {
    'Trainee Lawyer': [56000, 65000],
    Lawyer: [150000, 250000],
    'Senior Lawyer': [250000, 500000],
    Partner: [500000, 2000000],
  },
  'Chance Crown & Co': {
    'Trainee Lawyer': [40000, 52000],
    Lawyer: [120000, 180000],
    'Senior Lawyer': [180000, 300000],
    Partner: [300000, 1500000],
  },
  'Fairmount LLP': {
    'Trainee Lawyer': [30000, 42000],
    Lawyer: [80000, 130000],
    'Senior Lawyer': [150000, 260000],
    Partner: [300000, 500000],
  },
  'Blackstone Chambers': {
    'Trainee Barrister': [50000, 70000],
    Barrister: [180000, 600000],
    Judge: [320000, 900000],
  },
  'St John’s Chambers': {
    'Trainee Barrister': [40000, 55000],
    Barrister: [140000, 420000],
    Judge: [280000, 700000],
  },
};

function normalizeCareerRouteCourse(course) {
  if (course === 'Business') return 'Business';
  if (course === 'Economics') return 'Economics';
  return course;
}

function isLawChambersCompany(companyName) {
  return /chambers/i.test(String(companyName || ''));
}

function isLawBarristerTitle(title) {
  return /barrister|judge/i.test(String(title || ''));
}

function getSimpleCareerRoute(courseOrTitle, companyName = null) {
  if (courseOrTitle === 'Law') {
    return isLawChambersCompany(companyName) ? SIMPLE_LAW_BARRISTER_ROUTE : SIMPLE_CAREER_ROUTES.Law;
  }
  if (SIMPLE_CAREER_ROUTES[courseOrTitle]) return SIMPLE_CAREER_ROUTES[courseOrTitle];
  if (SIMPLE_LAW_BARRISTER_ROUTE.some(step => step.title === courseOrTitle) || isLawBarristerTitle(courseOrTitle)) {
    return SIMPLE_LAW_BARRISTER_ROUTE;
  }
  return Object.values(SIMPLE_CAREER_ROUTES).find(route => route.some(step => step.title === courseOrTitle)) || null;
}

function getCareerCourseFromTitle(title) {
  if (SIMPLE_LAW_BARRISTER_ROUTE.some(step => step.title === title)) return 'Law';
  return Object.entries(SIMPLE_CAREER_ROUTES).find(([, route]) => route.some(step => step.title === title))?.[0] || null;
}

function getGraduateEntryRoleForCourse(course, companyName = null) {
  const route = getSimpleCareerRoute(normalizeCareerRouteCourse(course), companyName);
  return route?.[0]?.title || 'Office Worker';
}

function getCareerCompanyForCourse(course, preferredCompany = null) {
  const companies = SIMPLE_CAREER_COMPANIES[normalizeCareerRouteCourse(course)] || ['Company'];
  if (preferredCompany && companies.includes(preferredCompany)) return preferredCompany;
  return companies[0];
}

function getSimpleCareerSalaryRange(course, title, companyName = null) {
  if (normalizeCareerRouteCourse(course) === 'Law') {
    return SIMPLE_LAW_SALARY_BANDS[companyName]?.[title] || null;
  }
  return null;
}

function getSimpleCareerSalaryForState(course, title, companyName = null, skew = 0.5) {
  const range = getSimpleCareerSalaryRange(course, title, companyName);
  if (!range) return null;
  return getGeneratedSalaryForRange(range[0], range[1], skew);
}

function applyGraduateSchemeOutcomeOnGraduation(application) {
  const offer = STATE.education?.graduateSchemeOffer;
  if (!offer) return;
  const course = normalizeCareerRouteCourse(application.course);
  const title = offer.startTitle || getGraduateEntryRoleForCourse(course, offer.companyName);
  const companyName = offer.companyName || getCareerCompanyForCourse(course);
  const salary = getSimpleCareerSalaryForState(course, title, companyName, 0.55) || Math.max(26000, STATE.finances.income || 28000);
  STATE.career.job = title;
  STATE.career.companyName = companyName;
  STATE.career.startedAge = STATE.age;
  STATE.career.category = ['Law', 'Business', 'Economics'].includes(course) ? 'corporate' : course === 'Medicine' ? 'emergency' : course === 'Computer Science' ? 'creative' : 'office';
  STATE.career.jobType = 'Full-Time';
  STATE.career.work = null;
  STATE.finances.job = title;
  STATE.finances.jobType = 'Full-Time';
  STATE.finances.income = salary;
  STATE.career.salary = salary;
  STATE.career.level = 1;
  ensureCareerState({
    title,
    companyName,
    jobCategory: STATE.career.category,
    icon: course === 'Law'
      ? 'mdi:scale-balance'
      : course === 'Medicine'
        ? 'mdi:stethoscope'
        : course === 'Computer Science'
          ? 'mdi:laptop'
          : course === 'Art'
            ? 'mdi:palette-outline'
            : 'mdi:briefcase-outline',
  });
  STATE.education.graduateSchemePreparation = { active:false, companyName:null, title:null };
  STATE.education.graduateSchemeOffer = null;
  STATE.education.currentInternship = null;
  logActivity(`Your graduate scheme at ${companyName} started as soon as you graduated.`, 10);
}

function applySimpleCareerRouteProgression() {
  const title = STATE.career?.job;
  if (!title || title === 'None') return;
  const course = getCareerCourseFromTitle(title);
  if (!course) return;
  const route = getSimpleCareerRoute(course, STATE.career.companyName || STATE.career.work?.companyName);
  const stepIndex = route.findIndex(step => step.title === title);
  if (stepIndex < 0) return;
  const step = route[stepIndex];
  const years = getCurrentJobYears();
  if (!step.years || years < step.years) return;
  let nextTitle = route[stepIndex + 1]?.title || null;
  if (!nextTitle || nextTitle === title) return;
  STATE.career.job = nextTitle;
  STATE.finances.job = nextTitle;
  STATE.career.startedAge = STATE.age;
  STATE.career.level = Math.max(STATE.career.level || 1, stepIndex + 2);
  STATE.finances.income = getSimpleCareerSalaryForState(course, nextTitle, STATE.career.companyName, 0.62)
    || Math.round(Math.max(STATE.finances.income || 26000, (STATE.finances.income || 26000) * 1.18));
  STATE.career.salary = STATE.finances.income;
  if (STATE.career.work?.progression) STATE.career.work.progression = getCareerPathForJob(nextTitle);
  logActivity(`You progressed to ${nextTitle} at ${STATE.career.companyName || 'your company'}.`, 12);
}

function getCareerPathForJob(jobTitle) {
  const course = getCareerCourseFromTitle(jobTitle);
  if (course) {
    const companyName = STATE.career?.job === jobTitle ? STATE.career.companyName : null;
    return getSimpleCareerRoute(course, companyName || (isLawBarristerTitle(jobTitle) ? 'Blackstone Chambers' : null)).map(step => step.title);
  }
  return ['Entry Role', 'Skilled Role', 'Senior Role', 'Lead Role'];
}

function getLegalJobRequirements() {
  return [];
}

function canAccessFurtherEducation() {
  return false;
}

function getFullTimeJobs() {
  const degree = normalizeCareerRouteCourse(getDegreeCourse());
  const companies = SIMPLE_CAREER_COMPANIES[degree];
  if (!companies) return generateFullTimeJobs().map(job => normalizeJob(job, 'full-time'));
  const currentTitle = STATE.career?.job;
  const jobs = companies.flatMap(company => {
    const route = getSimpleCareerRoute(degree, company);
    const routeIndex = route.findIndex(step => step.title === currentTitle);
    const availableTitles = routeIndex >= 0
      ? [route[Math.min(routeIndex, route.length - 1)].title, route[Math.min(routeIndex + 1, route.length - 1)]?.title].filter(Boolean)
      : [route[0]?.title, route[1]?.title].filter(Boolean);
    return availableTitles.map((title, index) => {
      const salaryRange = getSimpleCareerSalaryRange(degree, title, company);
      return {
        title,
        company,
        salary: salaryRange ? formatSalaryRange(salaryRange[0], salaryRange[1]) : `£${(26000 + (index * 9000)).toLocaleString()}/year`,
        salaryMin: salaryRange?.[0],
        salaryMax: salaryRange?.[1],
        icon: degree === 'Law' ? 'mdi:scale-balance' : degree === 'Medicine' ? 'mdi:stethoscope' : degree === 'Computer Science' ? 'mdi:laptop' : 'mdi:briefcase-outline',
        accent: '#6d56c9',
      };
    });
  });
  return jobs.slice(0, 12).map(job => normalizeJob(job, 'full-time'));
}

function handleGraduateSchemeApplication() {
  ensureUniversityCommitmentState();
  const course = normalizeCareerRouteCourse(STATE.school.postSchool?.uniApplication?.course);
  const track = getUniversityCareerTrack(course);
  const pool = track.graduate || [];
  const company = pickRandom(pool);
  const finalYearsBoost = isUniversityFinalTwoYears() ? 8 : -8;
  const chance = clamp(18 + getUniversityCareerStrength() + finalYearsBoost - (company.difficulty || 40), 4, 84);
  const startTitle = getGraduateEntryRoleForCourse(course, company.company);
  if (Math.random() * 100 < chance) {
    STATE.education.graduateSchemePreparation = { active:true, companyName:company.company, title:company.title };
    STATE.education.graduateSchemeOffer = { companyName:company.company, title:company.title, startTitle, securedAge:STATE.age };
    const sponsorship = maybeOfferEmployerSponsorship(company);
    return {
      log: sponsorship
        ? `${company.company} offered you ${startTitle} after graduation and agreed to fund the rest of your tuition.`
        : `${company.company} offered you ${startTitle} after graduation.`,
      toast:'Graduate scheme secured.',
    };
  }
  STATE.education.graduateSchemePreparation = { active:true, companyName:company.company, title:company.title };
  return { log:`You started preparing and applying for graduate schemes, but ${company.company} passed for now.`, toast:'Applications sent.' };
}

// ── INIT ──────────────────────────────────────────────────
initBirth();
