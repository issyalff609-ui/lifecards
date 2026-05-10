// ═══════════════════════════════════════════════════════════
// ENGINE.JS
// ═══════════════════════════════════════════════════════════

// ── LIFE STAGES ───────────────────────────────────────────
const LIFE_STAGES = [
  { maxAge:4,   label:'Baby',        emoji:'👶' },
  { maxAge:11,  label:'Child',       emoji:'🧒' },
  { maxAge:16,  label:'Teenager',    emoji:'🧑' },
  { maxAge:18,  label:'Sixth Form',  emoji:'🧑' },
  { maxAge:24,  label:'Young Adult', emoji:'🧍' },
  { maxAge:39,  label:'Adult',       emoji:'👔' },
  { maxAge:59,  label:'Middle-aged', emoji:'🧓' },
  { maxAge:999, label:'Elder',       emoji:'👴' },
];

// ── SOCIAL CLASS ──────────────────────────────────────────
const SOCIAL_CLASSES = [
  { id:'lower',        label:'Lower Class',       startBalance:0,     parentIncome:15000,  weight:35 },
  { id:'working',      label:'Working Class',      startBalance:0,     parentIncome:18000,  weight:35 },
  { id:'middle',       label:'Middle Class',       startBalance:0,     parentIncome:42000,  weight:40 },
  { id:'upper_middle', label:'Upper-Middle Class', startBalance:0,     parentIncome:85000,  weight:20 },
  { id:'elite',        label:'Elite',              startBalance:50000, parentIncome:250000, weight:5  },
];

// ── PARENT JOBS ───────────────────────────────────────────
const PARENT_JOBS = {
  lower:        ['Assistant','Cleaner','Waiter','Babysitter'],
  working:      ['Factory Worker','Bus Driver','Shop Assistant','Cleaner','Warehouse Operative','Carer','Postman'],
  middle:       ['Teacher','Nurse','Accountant','Office Manager','Engineer','Police Officer','Social Worker'],
  upper_middle: ['Doctor','Solicitor','Architect','Senior Manager','University Lecturer','Financial Advisor'],
  elite:        ['CEO','Barrister','Surgeon','Investment Banker','Entrepreneur','Politician'],
};

// ── PARENT TRAITS ─────────────────────────────────────────
const PARENT_TRAITS_POOL = [
  { id:'supportive',  label:'Supportive',  positive:true,  effect:'Encourages your choices. Relationship grows easily.' },
  { id:'overbearing', label:'Overbearing', positive:false, effect:'Nags about grades, uni, and your choices. Hard to please.' },
  { id:'distant',     label:'Distant',     positive:false, effect:'Rarely engages. Hard to build relationship with.' },
  { id:'risk_taker',  label:'Risk-Taker',  positive:null,  effect:'Could become very wealthy — or lose everything.' },
  { id:'hardworking', label:'Hardworking', positive:true,  effect:'Models discipline. Slightly boosts your work ethic events.' },
  { id:'funny',       label:'Funny',       positive:true,  effect:'Home is warm and easy. Happiness gets a small boost.' },
  { id:'strict',      label:'Strict',      positive:false, effect:'High expectations. Grades matter a lot to them.' },
  { id:'absent',      label:'Absent',      positive:false, effect:'Rarely there. Relationship decays unless you make effort.' },
  { id:'ambitious',   label:'Ambitious',   positive:true,  effect:'Pushes you toward success. More career opportunities.' },
  { id:'kind',        label:'Kind',        positive:true,  effect:'Nurturing. Gives relationship boosts on interactions.' },
];

// ── CLASSMATE TRAITS ──────────────────────────────────────
const CLASSMATE_TRAITS_POOL = [
  { id:'loyal',        label:'Loyal',        positive:true,  effect:'Sticks by you. Friendship is stable.' },
  { id:'generous',     label:'Generous',     positive:true,  effect:'Always there for you. Boosts happiness when together.' },
  { id:'funny',        label:'Funny',        positive:true,  effect:'Makes school more bearable.' },
  { id:'supportive',   label:'Supportive',   positive:true,  effect:'Boosts you when you\'re down.' },
  { id:'ambitious',    label:'Ambitious',    positive:true,  effect:'Good influence. Slight smarts boost.' },
  { id:'creative',     label:'Creative',     positive:true,  effect:'Fun to be around. Broadens your perspective.' },
  { id:'two_faced',    label:'Two-Faced',    positive:false, effect:'Says one thing, does another. Trust carefully.' },
  { id:'manipulative', label:'Manipulative', positive:false, effect:'Uses the friendship for their benefit.' },
  { id:'jealous',      label:'Jealous',      positive:false, effect:'Gets bitter when you do well.' },
  { id:'flaky',        label:'Flaky',        positive:false, effect:'Unreliable. Plans fall through.' },
  { id:'dramatic',     label:'Dramatic',     positive:false, effect:'Creates chaos. Drama follows them.' },
  { id:'toxic',        label:'Toxic',        positive:false, effect:'Bad for your happiness long-term.' },
];

// ── PLAYER TRAITS ─────────────────────────────────────────
const PLAYER_TRAITS_POOL = [
  { id:'intelligent', label:'Intelligent', emoji:'🧠', weights:{ academic_event:2.0, career_opportunity:1.5, social_event:0.8 } },
  { id:'charismatic', label:'Charismatic', emoji:'✨', weights:{ social_event:2.0, friendship_event:1.8, romance_event:1.5, career_opportunity:1.3 } },
  { id:'lazy',        label:'Lazy',        emoji:'😴', weights:{ academic_event:0.4, work_problem:1.8, missed_opportunity:1.5, social_event:1.2 } },
  { id:'hardworking', label:'Hardworking', emoji:'💪', weights:{ academic_event:1.8, career_opportunity:1.8, social_event:0.7 } },
  { id:'risk_taker',  label:'Risk-Taker',  emoji:'🎲', weights:{ risk_event:2.5, financial_event:1.8, adventure_event:2.0, career_opportunity:1.3 } },
  { id:'empathetic',  label:'Empathetic',  emoji:'❤️', weights:{ social_event:1.8, friendship_event:2.0, romance_event:1.5, family_event:1.5 } },
  { id:'ambitious',   label:'Ambitious',   emoji:'🚀', weights:{ career_opportunity:2.2, academic_event:1.5, financial_event:1.5, social_event:0.8 } },
  { id:'cautious',    label:'Cautious',    emoji:'🛡️', weights:{ risk_event:0.3, missed_opportunity:1.3, career_opportunity:0.8 } },
  { id:'creative',    label:'Creative',    emoji:'🎨', weights:{ adventure_event:1.8, social_event:1.5, career_opportunity:1.2, academic_event:0.9 } },
  { id:'resilient',   label:'Resilient',   emoji:'🪨', weights:{ recovery_event:2.5, missed_opportunity:0.7 } },
  { id:'curious',     label:'Curious',     emoji:'🔍', weights:{ academic_event:1.8, adventure_event:1.5, career_opportunity:1.2 } },
  { id:'anxious',     label:'Anxious',     emoji:'😰', weights:{ social_event:0.6, missed_opportunity:1.5, health_event:1.5 } },
];

// ── MILESTONES ────────────────────────────────────────────
const MILESTONES = [
  { age:5,  title:"First day of school.",          body:"Everything feels enormous, the building, the noise, the other kids. Your life outside of home begins today.", emoji:'🎒', unlocks:['school'] },
  { age:10, title:"Double digits.",                 body:"You've reached double digits! Things are starting to feel significant.", emoji:'🎂' },
  { age:13, title:"Secondary school.",              body:"New school, new people, new versions of yourself. Who you are here is yours to decide.", emoji:'🏫', unlocks:['secondary'] },
  { age:16, title:"GCSEs done.",                    body:"Whatever the results, that chapter is closed. Now you decide what comes next.", emoji:'📋', unlocks:['college_choice'] },
  { age:21, title:"Your early twenties.",           body:"Have you figured out who you are? It feels like everyone else has. Keep going.", emoji:'🥂' },
  { age:30, title:"Thirty, Flirty, and Thriving.",  body:"The decade that changes everything. You can feel it already.", emoji:'3️⃣0️⃣' },
  { age:40, title:"Forty.",                         body:"You know yourself better now. Do you like who you've become?", emoji:'4️⃣0️⃣', unlocks:['aging_drift'] },
  { age:50, title:"Fifty.",                         body:"Half a century...", emoji:'5️⃣0️⃣' },
  { age:60, title:"Sixty.",                         body:"The word retirement starts to excite you.", emoji:'6️⃣0️⃣', unlocks:['retirement_options'] },
  { age:65, title:"State pension age.",             body:"You've paid in your whole life. Now it starts paying back.", emoji:'🌅' },
];

// ── APPEARANCE EMOJIS ─────────────────────────────────────
const APPEARANCE_EMOJIS = ['😊','🙂','😄','😎','🥰','😏','🤓','😇','🥳','😌','🧐','😃'];

// ── GRADE SYSTEM ──────────────────────────────────────────
const GRADES = ['A+','A','B','C','D','E','F'];

function gradeFromScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  if (score >= 25) return 'E';
  return 'F';
}

function scoreFromGrade(g) {
  const map = {'A+':93,'A':83,'B':72,'C':60,'D':45,'E':30,'F':15};
  return map[g] || 50;
}

function gradeColor(g) {
  const map = {'A+':'#16a34a','A':'#22c55e','B':'#84cc16','C':'#f59e0b','D':'#f97316','E':'#ef4444','F':'#dc2626'};
  return map[g] || '#6b7280';
}

function getSchoolTypeLabels() {
  const type = STATE?.school?.type || {};
  return [type.primary, type.secondary, type.college].filter(Boolean).map(value => String(value).toLowerCase());
}

function isAlreadyPrivateTrack() {
  const labels = getSchoolTypeLabels();
  return labels.some(label =>
    label.includes('prep school') ||
    label.includes('private school') ||
    label.includes('boarding school') ||
    label.includes('private sixth') ||
    label.includes('elite sixth')
  );
}

function getParentPrivateSupportScore() {
  const parents = [STATE.family?.mum, STATE.family?.dad].filter(Boolean).filter(parent => parent.alive !== false);
  let score = 0;
  parents.forEach(parent => {
    if (isHighPayingParentJob(parent.job)) score += 12;
    const traits = parent.traits || [];
    if (traits.includes('supportive')) score += 10;
    if (traits.includes('kind')) score += 8;
    if (traits.includes('ambitious')) score += 6;
    if (traits.includes('hardworking')) score += 4;
    if (traits.includes('strict')) score += 3;
    if (traits.includes('distant')) score -= 6;
    if (traits.includes('absent')) score -= 10;
    if (traits.includes('overbearing')) score -= 4;
  });
  return score;
}

function getPrivateSchoolOfferChance() {
  const grade = gradeFromScore(STATE.school.gradeScore);
  let chance = grade === 'A+' ? 0.72 : grade === 'A' ? 0.58 : 0;
  const classModifier = {
    lower: -0.12,
    working: -0.08,
    middle: 0.04,
    upper_middle: 0.02,
    elite: 0,
  }[STATE.socialClass] || 0;
  chance += classModifier;
  chance += getParentPrivateSupportScore() / 500;
  return Math.max(0, Math.min(0.92, chance));
}

function getPrivateSchoolAcceptanceChance() {
  let chance = 0.18;
  chance += {
    lower: -0.08,
    working: -0.02,
    middle: 0.08,
    upper_middle: 0.28,
    elite: 0.4,
  }[STATE.socialClass] || 0;
  chance += (STATE.school.gradeScore >= 90 ? 0.1 : STATE.school.gradeScore >= 80 ? 0.05 : 0);
  chance += getParentPrivateSupportScore() / 250;
  return Math.max(0.03, Math.min(0.96, chance));
}

function getScholarshipChance() {
  let chance = 0.16;
  chance += STATE.school.gradeScore >= 92 ? 0.18 : STATE.school.gradeScore >= 85 ? 0.1 : 0.04;
  chance += {
    lower: 0.16,
    working: 0.12,
    middle: 0.04,
    upper_middle: -0.03,
    elite: -0.08,
  }[STATE.socialClass] || 0;
  chance += Math.max(0, -getParentPrivateSupportScore()) / 500;
  return Math.max(0.05, Math.min(0.7, chance));
}

function shouldWarnPrivateAffordability() {
  return ['lower', 'working'].includes(STATE.socialClass);
}

// ── STATE ─────────────────────────────────────────────────
let STATE = null;

function createNewLife(opts) {
  const {gender,firstName,surname,birthday,city,socialClass,traits,situation,mumName,dadName,siblings} = opts;
  const sc         = SOCIAL_CLASSES.find(c => c.id === socialClass);
  const starSign   = getStarSign(birthday.day, birthday.month);
  const schoolType = SCHOOL_TYPES_UK[socialClass] || SCHOOL_TYPES_UK['working'];

  const mumJob    = opts.mumJob || pickRandom(PARENT_JOBS[socialClass]);
  const dadJob    = opts.dadJob || pickRandom(PARENT_JOBS[socialClass]);
  const mumTraits = sampleN(PARENT_TRAITS_POOL, 2).map(t => t.id);
  const dadTraits = sampleN(PARENT_TRAITS_POOL, 2).map(t => t.id);
  const mumAppearance = generateAppearance('female');
  const dadAppearance = generateAppearance('male');
  const playerApp     = generateFamilyAppearance(gender, [mumAppearance, dadAppearance]);


  const siblingObjects = [];
  const pendingSiblings = [];
  (siblings||[]).forEach(s => {
    const age = s.age !== undefined ? s.age : Math.floor(Math.random()*10) - 3;
    if (age < 0) {
      pendingSiblings.push({ ...s, dueAge: Math.abs(age), siblingType: s.siblingType || 'full', familyStatus: s.familyStatus || null });
    } else {
      siblingObjects.push(buildSiblingObject(s, surname, mumAppearance, dadAppearance, age));
    }
  });

  const mum = { id:uid(), firstName:mumName, surname, gender:'female', age:Math.floor(Math.random()*10)+28, emoji:pickRandom(APPEARANCE_EMOJIS), job:mumJob, traits:mumTraits, compatibility:Math.floor(Math.random()*35)+50, relationship:70, alive:true, appearance:mumAppearance };
  mum.npcStats = buildParentNpcStats(mum);
  const dad = { id:uid(), firstName:dadName, surname, gender:'male',   age:Math.floor(Math.random()*10)+28, emoji:pickRandom(APPEARANCE_EMOJIS), job:dadJob, traits:dadTraits, compatibility:Math.floor(Math.random()*35)+45, relationship:65, alive:true, appearance:dadAppearance };
  dad.npcStats = buildParentNpcStats(dad);

  STATE = {
    gender, firstName, surname, fullName:`${firstName} ${surname}`,
    birthday, starSign, city, socialClass, socialClassLabel: sc.label,
    traits, appearance: playerApp,

    age:      0,
    deathAge: Math.floor(Math.random()*20)+72,

    stats: {
      happy:  Math.floor(Math.random()*20)+55,
      health: Math.floor(Math.random()*20)+60,
      smarts: Math.floor(Math.random()*101),
      looks:  Math.floor(Math.random()*101),
      popularity: Math.floor(Math.random()*45)+25,
      rep:    0,
    },

    finances: {
      balance:  sc.startBalance,
      income:   0,
      expenses: 0,
      job:      'None',
      housing:  'family home',
    },

    relationships: {
      family:  Math.floor(Math.random()*20)+60,
      friends: 0,
      partner: 0,
    },

    family: {
      situation,
      maritalStatus: maritalStatusForSituation(situation),
      mum,
      dad,
      moneyRequests: { total:0, byParent:{} },
      siblings: siblingObjects,
      pendingSiblings,
      pets: [],
    },

    school: {
      current:            pickUKSchoolName(socialClass, 'primary'),
      type:               schoolType,
      level:              'pre',
      gradeScore:         traits.includes('intelligent') ? Math.floor(Math.random()*15)+75 : Math.floor(Math.random()*20)+45,
      classmates:         [],
      vipIds:             [],
      rosterSnapshot:     [],
      teachers:           [],
      scholarshipOffered: false,
      scholarshipSchool:  null,
      postSchool:         { schoolFinishedShown:false, uniApplication:null },
    },

    career: { job:'None', salary:0, level:0 },
    sexuality: opts.sexuality || 'heterosexual',
    sexualityConfirmed: false,
    social: { bullyCount:0, isBully:false, friends:[] },
    romance: {
      status: 'single',
      partner: null,
      exes: [],
      children: [],
      pregnancy: null,
      pendingChildNamingId: null,
      marriageYears: 0,
      relationshipYears: 0,
      datingPool: [],
    },
    _partnerName: null,

    usedEvents:       [],
    shownMilestones:  [],
    actionCooldowns:  {},
    activity:         [],
    lastScore:        null,
    pendingMilestone: null,
    annualGradeGain:  0,
    annualStudyCount: 0,
    revealedTraitCount: 1,
  };

  STATE.relationships.family = Math.round((STATE.family.mum.relationship + STATE.family.dad.relationship) / 2);
  if (typeof initializeHomeState === 'function') initializeHomeState();
  ensureNpcSystemState();
  return STATE;
}

// ── HELPERS ───────────────────────────────────────────────
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function sampleN(arr, n) { return [...arr].sort(()=>Math.random()-0.5).slice(0,n); }
function weightedRandom(items) {
  const key = items[0].weight !== undefined ? 'weight' : 'w';
  const total = items.reduce((s,i)=>s+(i[key]||1),0);
  let r = Math.random()*total;
  for (const item of items) { r -= (item[key]||1); if (r<=0) return item; }
  return items[items.length-1];
}
function clamp(v,lo=0,hi=100) { return Math.max(lo,Math.min(hi,v)); }
function clampRep(v) { return Math.max(-100, Math.min(100, v)); }
function fmtMoney(v) {
  if (v>=1000000) return `£${(v/1000000).toFixed(1)}m`;
  if (v>=1000)    return `£${(v/1000).toFixed(0)}k`;
  if (v<0)        return `-£${Math.abs(v)}`;
  return `£${v}`;
}
function getStage(age) { return LIFE_STAGES.find(s=>age<=s.maxAge); }
function uid() { return Math.random().toString(36).slice(2,8); }

function maritalStatusForSituation(situation) {
  const map = {
    happily_married: 'Married',
    married_struggling: 'Married, struggling',
    recently_divorced: 'Divorced / separated',
    single_mum: 'Single parent',
    single_dad: 'Single parent',
    never_knew: 'Father unknown',
  };
  return map[situation] || 'Unknown';
}

function traitIsPositive(traitId, pool) {
  const trait = pool.find(t => t.id === traitId);
  return trait?.positive === true;
}

function traitIsNegative(traitId, pool) {
  const trait = pool.find(t => t.id === traitId);
  return trait?.positive === false;
}

function randomStat(min = 20, max = 85) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildParentNpcStats(parent) {
  const traits = parent.traits || [];
  let looks = randomStat(30, 80);
  let smarts = randomStat(35, 80);
  let warmth = randomStat(25, 80);
  let generosity = randomStat(20, 75);

  if (isHighPayingParentJob(parent.job)) generosity += 10;
  if (['Teacher','University Lecturer','Doctor','Engineer','Architect','Accountant','Financial Advisor'].includes(parent.job)) smarts += 12;
  if (traits.includes('supportive')) { warmth += 18; generosity += 12; }
  if (traits.includes('kind')) { warmth += 16; generosity += 10; }
  if (traits.includes('hardworking')) smarts += 8;
  if (traits.includes('ambitious')) smarts += 10;
  if (traits.includes('funny')) warmth += 8;
  if (traits.includes('distant')) warmth -= 16;
  if (traits.includes('absent')) warmth -= 24;
  if (traits.includes('overbearing')) warmth -= 10;
  if (traits.includes('strict')) warmth -= 8;

  return {
    looks: clamp(looks),
    smarts: clamp(smarts),
    warmth: clamp(warmth),
    generosity: clamp(generosity),
  };
}

function buildSiblingNpcStats(sibling) {
  const traits = sibling.traits || [];
  let looks = randomStat(25, 80);
  let smarts = randomStat(25, 80);
  let warmth = randomStat(20, 80);
  let trouble = randomStat(10, 70);

  if (traits.includes('creative')) looks += 6;
  if (traits.includes('ambitious')) smarts += 8;
  if (traits.includes('supportive')) warmth += 14;
  if (traits.includes('loyal')) warmth += 12;
  if (traits.includes('funny')) warmth += 6;
  if (traits.includes('dramatic')) trouble += 14;
  if (traits.includes('manipulative')) trouble += 18;
  if (traits.includes('jealous')) trouble += 12;
  if (traits.includes('toxic')) trouble += 20;
  if (traits.includes('flaky')) trouble += 8;
  if (traits.includes('two_faced')) trouble += 16;

  return {
    looks: clamp(looks),
    smarts: clamp(smarts),
    warmth: clamp(warmth),
    trouble: clamp(trouble),
  };
}

function buildClassmateNpcStats(classmate) {
  const traits = classmate.traits || [];
  let popularity = clamp((classmate.socialStanding ?? randomStat(20, 80)) + Math.floor(Math.random() * 11) - 5);
  let looks = randomStat(25, 85);
  let smarts = clamp((classmate.gradeScore ?? 50) + Math.floor(Math.random() * 25) - 12);
  let reputation = randomStat(20, 75);

  if (traits.includes('charismatic')) popularity += 0;
  if (traits.includes('creative')) looks += 6;
  if (traits.includes('ambitious')) smarts += 8;
  if (traits.includes('supportive')) reputation += 10;
  if (traits.includes('loyal')) reputation += 10;
  if (traits.includes('funny')) popularity += 8;
  if (traits.includes('jealous')) reputation -= 10;
  if (traits.includes('manipulative')) reputation -= 14;
  if (traits.includes('dramatic')) reputation -= 8;
  if (traits.includes('two_faced')) reputation -= 16;
  if (traits.includes('toxic')) reputation -= 18;
  if (traits.includes('flaky')) popularity -= 8;

  return {
    popularity: clamp(popularity),
    looks: clamp(looks),
    smarts: clamp(smarts),
    reputation: clamp(reputation),
  };
}

function buildTeacherNpcStats(teacher) {
  let looks = randomStat(25, 75);
  let smarts = randomStat(65, 95);
  let warmth = randomStat(25, 80);
  let strictness = clamp(teacher.strictness ?? randomStat(20, 85));

  if (teacher.subject === 'Art' || teacher.subject === 'Music') warmth += 4;
  if (teacher.subject === 'Maths' || teacher.subject === 'Science') smarts += 4;
  if (strictness >= 70) warmth -= 10;

  return {
    looks: clamp(looks),
    smarts: clamp(smarts),
    warmth: clamp(warmth),
    strictness: clamp(strictness),
  };
}

const NPC_RELATIONSHIP_STATUSES = ['Single', 'Talking to someone', 'In a relationship', 'Complicated', 'Married', 'Separated', 'Widowed'];
const NPC_HOUSING_STATUSES = ['Living with family', 'Student housing', 'Shared flat', 'Own flat', 'Partner household', 'Moved back home', 'Retired at home'];
const NPC_EDUCATION_STATUSES = ['In school', 'In college', 'At university', 'Graduated', 'Dropped out', 'No higher education'];

function npcSeed(npc, salt = '') {
  const raw = `${npc?.id || ''}|${npc?.firstName || ''}|${npc?.surname || ''}|${salt}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = ((hash * 31) + raw.charCodeAt(i)) >>> 0;
  return hash;
}

function npcSeedBetween(npc, salt, min, max) {
  const span = Math.max(1, (max - min) + 1);
  return min + (npcSeed(npc, salt) % span);
}

function hasNpcTrait(npc, traitId) {
  return Array.isArray(npc?.traits) && npc.traits.includes(traitId);
}

function getNpcDisplayName(npc) {
  return `${npc?.firstName || 'Someone'}${npc?.surname ? ` ${npc.surname}` : ''}`.trim();
}

function getNpcSmarts(npc) {
  return clamp(npc?.npcStats?.smarts ?? npcSeedBetween(npc, 'smarts', 38, 74));
}

function getNpcWarmth(npc) {
  return clamp(npc?.npcStats?.warmth ?? npc?.npcStats?.reputation ?? npcSeedBetween(npc, 'warmth', 35, 72));
}

function getNpcReputationBase(npc) {
  if (npc?.reputation !== undefined) return clamp(npc.reputation);
  if (npc?.npcStats?.reputation !== undefined) return clamp(npc.npcStats.reputation);
  const warmth = npc?.npcStats?.warmth;
  const generosity = npc?.npcStats?.generosity;
  if (warmth !== undefined || generosity !== undefined) {
    return clamp(Math.round(((warmth ?? 50) + (generosity ?? 50)) / 2));
  }
  return clamp(npcSeedBetween(npc, 'reputation', 36, 74));
}

function getPlayerDegreeBias() {
  if (typeof getDegreeCourse === 'function') return getDegreeCourse();
  return STATE?.school?.postSchool?.uniApplication?.course || null;
}

function getNpcCourseCatalog() {
  if (typeof UNI_COURSES !== 'undefined' && Array.isArray(UNI_COURSES) && UNI_COURSES.length) {
    return UNI_COURSES.map(course => course.id);
  }
  return ['Law', 'Medicine', 'Business', 'Computer Science', 'Art', 'Education', 'Engineering', 'History', 'Music'];
}

function relatedDegreeCourses(course) {
  const map = {
    Law: ['History', 'Business'],
    Medicine: ['Biology', 'Chemistry', 'Psychology'],
    Business: ['Economics', 'Law'],
    'Computer Science': ['Engineering', 'Business'],
    Education: ['History', 'English'],
    Engineering: ['Computer Science', 'Mathematics'],
    Art: ['Music', 'History'],
    History: ['Law', 'Education'],
    Music: ['Art'],
  };
  return map[course] || [];
}

function chooseNpcDegreeCourse(npc, context = {}) {
  const current = npc.degreeCourse;
  if (current) return current;
  const playerCourse = getPlayerDegreeBias();
  const metAtUniversity = context.socialGroup === 'university friend' || context.metAtUniversity;
  const catalog = getNpcCourseCatalog();
  if (!catalog.length) return null;

  if (metAtUniversity && playerCourse) {
    const roll = npcSeedBetween(npc, 'degree-course', 1, 100);
    if (roll <= 58) return playerCourse;
    const related = relatedDegreeCourses(playerCourse).filter(course => catalog.includes(course));
    if (related.length && roll <= 82) return related[npcSeedBetween(npc, 'related-degree', 0, related.length - 1)];
  }
  return catalog[npcSeedBetween(npc, 'fallback-degree', 0, catalog.length - 1)];
}

function inferCareerPathFromJobOrCourse(jobTitle, degreeCourse) {
  const title = String(jobTitle || '').toLowerCase();
  if (/doctor|nurse|health|lab|medical/.test(title) || degreeCourse === 'Medicine') return 'Healthcare';
  if (/legal|law|court|solicitor|barrister|paralegal|judge/.test(title) || degreeCourse === 'Law') return 'Legal';
  if (/teacher|education|school/.test(title) || degreeCourse === 'Education') return 'Education';
  if (/engineer|electrical|plumber|operations/.test(title) || degreeCourse === 'Engineering') return 'Engineering';
  if (/design|music|creator|actor|illustrator|artist/.test(title) || ['Art', 'Music'].includes(degreeCourse)) return 'Creative';
  if (/finance|business|sales|project|management|recruitment/.test(title) || degreeCourse === 'Business') return 'Business';
  if (/software|computer|tech/.test(title) || degreeCourse === 'Computer Science') return 'Technology';
  if (/police|firefighter|civil service/.test(title)) return 'Public Service';
  return 'General';
}

function estimateNpcSalary(jobTitle, context = {}, npc = null) {
  if (!jobTitle || jobTitle === 'None') return 0;
  const parentIncome = SOCIAL_CLASSES.find(item => item.id === STATE.socialClass)?.parentIncome || 22000;
  if (context.role === 'parent') {
    const multiplier = {
      lower: 0.85,
      working: 1,
      middle: 1.15,
      upper_middle: 1.5,
      elite: 2.6,
    }[STATE.socialClass] || 1;
    const seedBump = npc ? npcSeedBetween(npc, 'parent-salary', -3500, 8500) : 0;
    return Math.max(12000, Math.round((parentIncome * multiplier) + seedBump));
  }
  const title = String(jobTitle).toLowerCase();
  if (/partner|judge/.test(title)) return npc ? npcSeedBetween(npc, 'salary', 180000, 550000) : 220000;
  if (/doctor|barrister|senior associate|principal/.test(title)) return npc ? npcSeedBetween(npc, 'salary', 70000, 180000) : 90000;
  if (/associate|manager|engineer|teacher|police|solicitor|analyst/.test(title)) return npc ? npcSeedBetween(npc, 'salary', 30000, 78000) : 42000;
  if (/assistant|secretary|retail|care|creator|musician|actor|cashier/.test(title)) return npc ? npcSeedBetween(npc, 'salary', 18000, 32000) : 24000;
  return npc ? npcSeedBetween(npc, 'salary', 22000, 45000) : 28000;
}

function inferNpcEducationStatus(npc, context = {}) {
  if (npc.educationLevel) return npc.educationLevel;
  const age = npc.age ?? 0;
  const playerCourse = getPlayerDegreeBias();
  const smart = getNpcSmarts(npc);
  const ambitious = clamp(npc.ambition ?? npcSeedBetween(npc, 'ambition', 35, 80));
  const universityBias = smart + ambitious + (playerCourse && context.socialGroup === 'university friend' ? 12 : 0);
  if (age < 16) return 'In school';
  if (age < 18) return universityBias >= 118 ? 'In college' : 'In school';
  if (age <= 22) {
    if (universityBias >= 126) return 'At university';
    if (universityBias >= 102) return 'In college';
  }
  if (age >= 22 && universityBias >= 126) return 'Graduated';
  return 'No higher education';
}

function inferNpcCurrentEducation(npc) {
  const level = npc.educationLevel;
  if (level === 'At university') return npc.degreeCourse || chooseNpcDegreeCourse(npc, { socialGroup: npc.socialGroup });
  if (level === 'In college') return 'College';
  if (level === 'In school') return 'School';
  return null;
}

function inferNpcHousingStatus(npc, context = {}) {
  if (npc.housingStatus) return npc.housingStatus;
  const age = npc.age ?? 0;
  if (context.role === 'parent') return age >= 65 ? 'Retired at home' : 'Living with family';
  if (age < 18) return 'Living with family';
  if (npc.educationLevel === 'At university') return 'Student housing';
  if ((npc.employmentStatus === 'Employed' || npc.jobTitle) && age >= 22) return 'Shared flat';
  return 'Living with family';
}

function inferNpcLivesWith(npc, context = {}) {
  if (Array.isArray(npc.livesWith) && npc.livesWith.length) return npc.livesWith;
  if (context.role === 'parent') return ['Family household'];
  if (npc.housingStatus === 'Student housing') return ['Roommates'];
  if (npc.housingStatus === 'Partner household') return ['Partner'];
  if (npc.housingStatus === 'Own flat') return ['Alone'];
  if (npc.housingStatus === 'Shared flat') return ['Roommates'];
  return ['Family'];
}

function inferNpcRelationshipStatus(npc, context = {}) {
  if (npc.relationshipStatus) return npc.relationshipStatus;
  if (context.role === 'parent') {
    const status = STATE.family?.maritalStatus || maritalStatusForSituation(STATE.family?.situation);
    if (/married/i.test(status)) return 'Married';
    if (/divorc|separat/i.test(status)) return 'Separated';
    return 'Single';
  }
  if ((npc.age ?? 0) < 16) return 'Single';
  const roll = npcSeedBetween(npc, 'relationship-status', 1, 100);
  if ((npc.age ?? 0) >= 28 && roll >= 88) return 'Married';
  if ((npc.age ?? 0) >= 20 && roll >= 62) return 'In a relationship';
  if ((npc.age ?? 0) >= 18 && roll >= 45) return 'Talking to someone';
  return 'Single';
}

function inferNpcSocialGroup(npc, context = {}) {
  if (npc.socialGroup) return npc.socialGroup;
  if (context.role === 'parent') return 'family';
  if (context.role === 'sibling') return 'family';
  if (context.role === 'friend') return context.socialGroup || (STATE.school?.level === 'uni' ? 'university friend' : 'school friend');
  if (context.role === 'classmate') return 'classmate';
  if (context.role === 'roommate') return 'roommate';
  return 'recurring';
}

function inferNpcAge(npc, context = {}) {
  if (npc?.age !== undefined && npc?.age !== null) return npc.age;
  if (context.role === 'roommate') return Math.max(18, STATE.age || 18);
  if (context.role === 'friend' || context.role === 'classmate') return Math.max(0, STATE.age || 0);
  if (context.role === 'teacher') return 35;
  return Math.max(0, STATE.age || 0);
}

function ensureNpcCoreFields(npc, context = {}) {
  if (!npc) return npc;
  npc.age = inferNpcAge(npc, context);
  if (!Array.isArray(npc.lifeUpdates)) npc.lifeUpdates = [];
  if (!Array.isArray(npc.memoriesWithPlayer)) npc.memoriesWithPlayer = [];
  npc.socialGroup = inferNpcSocialGroup(npc, context);
  npc.ambition = clamp(npc.ambition ?? npcSeedBetween(npc, 'ambition', 30, 82) + (hasNpcTrait(npc, 'ambitious') ? 12 : 0) - (hasNpcTrait(npc, 'lazy') ? 14 : 0));
  npc.happiness = clamp(npc.happiness ?? npcSeedBetween(npc, 'happiness', 44, 72) + (hasNpcTrait(npc, 'funny') ? 5 : 0) + (hasNpcTrait(npc, 'supportive') ? 4 : 0) - (hasNpcTrait(npc, 'toxic') ? 10 : 0));
  npc.stress = clamp(npc.stress ?? npcSeedBetween(npc, 'stress', 26, 58) + (hasNpcTrait(npc, 'ambitious') ? 7 : 0) + (hasNpcTrait(npc, 'flaky') ? 2 : 0));
  npc.reputation = clamp(npc.reputation ?? getNpcReputationBase(npc));
  npc.educationLevel = inferNpcEducationStatus(npc, context);
  npc.degreeCourse = npc.degreeCourse ?? (npc.educationLevel === 'At university' || npc.educationLevel === 'Graduated' ? chooseNpcDegreeCourse(npc, context) : null);
  npc.currentEducation = npc.currentEducation ?? inferNpcCurrentEducation(npc);
  npc.jobTitle = npc.jobTitle ?? npc.job ?? ((npc.age >= 18 && npc.educationLevel !== 'At university' && context.role === 'parent') ? npc.job : 'None');
  npc.employer = npc.employer ?? (npc.jobTitle && npc.jobTitle !== 'None' ? `${npc.surname || 'Local'} ${inferCareerPathFromJobOrCourse(npc.jobTitle, npc.degreeCourse)}` : null);
  npc.careerPath = npc.careerPath ?? inferCareerPathFromJobOrCourse(npc.jobTitle, npc.degreeCourse);
  npc.salary = npc.salary ?? estimateNpcSalary(npc.jobTitle, context, npc);
  npc.careerStage = npc.careerStage ?? ((npc.jobTitle && npc.jobTitle !== 'None')
    ? ((npc.age ?? 0) >= 45 ? 'Established' : (npc.age ?? 0) >= 27 ? 'Mid-career' : 'Early career')
    : ((npc.age ?? 0) >= 65 ? 'Retired' : 'Exploring'));
  npc.yearsInRole = npc.yearsInRole ?? ((npc.jobTitle && npc.jobTitle !== 'None') ? Math.max(0, Math.min((npc.age ?? 0) - 18, npcSeedBetween(npc, 'years-in-role', 0, 6))) : 0);
  npc.employmentStatus = npc.employmentStatus ?? (
    (npc.age ?? 0) >= 65 ? 'Retired'
      : npc.educationLevel === 'At university' ? 'Student'
      : npc.jobTitle && npc.jobTitle !== 'None' ? 'Employed'
      : (npc.age ?? 0) >= 18 ? 'Unemployed' : 'Student'
  );
  npc.relationshipStatus = inferNpcRelationshipStatus(npc, context);
  npc.housingStatus = inferNpcHousingStatus(npc, context);
  npc.livesWith = inferNpcLivesWith(npc, context);
  npc.friendshipCloseness = clamp(npc.friendshipCloseness ?? npc.relationship ?? 60);
  npc.lastInteractionAge = npc.lastInteractionAge ?? STATE.age;
  npc.attractionToPlayer = clamp(npc.attractionToPlayer ?? npcSeedBetween(npc, 'attraction', 20, 78));
  npc.romanticCompatibility = clamp(npc.romanticCompatibility ?? npc.compatibility ?? npcSeedBetween(npc, 'romantic-compat', 35, 82));
  npc.canBecomePartner = npc.canBecomePartner ?? (context.role !== 'parent' && context.role !== 'sibling' && !npc.isPet);
  npc.livesWithPlayer = npc.livesWithPlayer ?? false;
  npc.sharedHouseholdId = npc.sharedHouseholdId ?? null;
  if (context.role === 'parent') npc.job = npc.jobTitle;
  if (context.role === 'friend' || npc.status === 'friend') normalizeFriendRelationshipState(npc);
  return npc;
}

function sanitizeParentNpcState(parent) {
  if (!parent) return;
  ensureNpcCoreFields(parent, { role: 'parent' });
  parent.housingStatus = (parent.age ?? 0) >= 65 && parent.employmentStatus === 'Retired'
    ? 'Retired at home'
    : 'Living with family';
  parent.livesWith = ['Family household'];
  if (Array.isArray(parent.lifeUpdates) && parent.lifeUpdates.length) {
    parent.lifeUpdates = parent.lifeUpdates.filter(update => {
      const text = String(update?.text || '').toLowerCase();
      return !(
        text.includes('shared flat') ||
        text.includes('own place') ||
        text.includes('student housing') ||
        text.includes('moved back home')
      );
    });
  }
}

function buildNpcMemory(npc, text) {
  if (!text) return;
  if (!Array.isArray(npc.memoriesWithPlayer)) npc.memoriesWithPlayer = [];
  npc.memoriesWithPlayer.unshift({ text, age: STATE.age });
  if (npc.memoriesWithPlayer.length > 6) npc.memoriesWithPlayer.length = 6;
}

function markNpcInteraction(npc, memoryText = null) {
  if (!npc) return;
  ensureNpcCoreFields(npc);
  npc.lastInteractionAge = STATE.age;
  if (memoryText) buildNpcMemory(npc, memoryText);
}

function ageNpcOneYear(npc, context = {}) {
  if (!npc) return npc;
  const previousAge = Number.isFinite(Number(npc.age))
    ? Number(npc.age)
    : Math.max(0, (STATE.age || 0) - 1);
  npc.age = previousAge + 1;
  ensureNpcCoreFields(npc, context);
  return npc;
}

function recordNpcLifeUpdate(npc, text, bucket, priority = 1) {
  ensureNpcCoreFields(npc);
  const entry = { text, age: STATE.age, priority };
  npc.lifeUpdates.unshift(entry);
  bucket.push({ npcId: npc.id, text, priority });
}

function ensureNpcSystemState() {
  if (!STATE) return;
  if (!STATE.npc) STATE.npc = { annualUpdates: [], archive: [] };
  if (!Array.isArray(STATE.npc.annualUpdates)) STATE.npc.annualUpdates = [];
  if (!Array.isArray(STATE.npc.archive)) STATE.npc.archive = [];
  ensurePersistentFriendState();
  ensureRomanceState();
  ensureNpcCoreFields(STATE.family?.mum, { role: 'parent' });
  ensureNpcCoreFields(STATE.family?.dad, { role: 'parent' });
  sanitizeParentNpcState(STATE.family?.mum);
  sanitizeParentNpcState(STATE.family?.dad);
  (STATE.family?.siblings || []).forEach(sibling => ensureNpcCoreFields(sibling, { role: 'sibling' }));
  (STATE.school?.classmates || []).forEach(classmate => ensureNpcCoreFields(classmate, {
    role: classmate.status === 'friend' ? 'friend' : 'classmate',
    socialGroup: classmate.status === 'friend'
      ? (STATE.school?.level === 'uni' ? 'university friend' : 'school friend')
      : 'classmate',
  }));
  (STATE.social?.friends || []).forEach(friend => ensureNpcCoreFields(friend, { role: 'friend', socialGroup: friend.socialGroup || 'school friend' }));
  return STATE.npc;
}

function ageRelationshipNetworkOneYear() {
  ensurePersistentFriendState();
  const liveFriendIds = new Set();
  (STATE.school?.classmates || []).forEach(classmate => {
    ageNpcOneYear(classmate, {
      role: classmate.status === 'friend' ? 'friend' : 'classmate',
      socialGroup: classmate.status === 'friend'
        ? (STATE.school?.level === 'uni' ? 'university friend' : 'school friend')
        : 'classmate',
    });
    if (classmate.status === 'friend') {
      liveFriendIds.add(classmate.id);
      syncFriendSnapshot(classmate);
    }
  });
  (STATE.social?.friends || []).forEach(friend => {
    if (liveFriendIds.has(friend.id)) return;
    ageNpcOneYear(friend, {
      role: 'friend',
      socialGroup: friend.socialGroup || 'school friend',
    });
  });
}

function getImportantNpcEntries() {
  ensureNpcSystemState();
  const entries = [];
  if (STATE.family?.mum?.alive !== false && !['single_dad'].includes(STATE.family?.situation)) entries.push({ npc: STATE.family.mum, role: 'parent', label: 'mother' });
  if (STATE.family?.dad?.alive !== false && !['single_mum', 'never_knew'].includes(STATE.family?.situation)) entries.push({ npc: STATE.family.dad, role: 'parent', label: 'father' });
  (STATE.family?.siblings || []).forEach(sibling => entries.push({ npc: sibling, role: 'sibling', label: sibling.gender === 'male' ? 'brother' : 'sister' }));

  const friendMap = new Map();
  (STATE.school?.classmates || []).filter(classmate => classmate.status === 'friend').forEach(friend => friendMap.set(friend.id, friend));
  (STATE.social?.friends || []).forEach(friend => {
    if (!friendMap.has(friend.id)) friendMap.set(friend.id, friend);
  });
  friendMap.forEach(friend => {
    ensureNpcCoreFields(friend, { role: 'friend', socialGroup: friend.socialGroup || 'school friend' });
    entries.push({ npc: friend, role: 'friend', label: 'friend' });
  });
  return entries;
}

function getNpcPromotionTitle(npc) {
  const path = npc.careerPath || inferCareerPathFromJobOrCourse(npc.jobTitle, npc.degreeCourse);
  const stages = {
    Healthcare: ['Healthcare Assistant', 'Staff Nurse', 'Senior Clinician', 'Department Lead'],
    Legal: ['Legal Assistant', 'Paralegal', 'Senior Paralegal', 'Lead Paralegal'],
    Education: ['Teaching Assistant', 'Teacher', 'Head of Department', 'Senior Leader'],
    Engineering: ['Junior Engineer', 'Engineer', 'Senior Engineer', 'Lead Engineer'],
    Technology: ['Support Analyst', 'Developer', 'Senior Developer', 'Tech Lead'],
    Business: ['Coordinator', 'Executive', 'Manager', 'Senior Manager'],
    Creative: ['Creative Assistant', 'Designer', 'Senior Designer', 'Creative Lead'],
    'Public Service': ['Officer', 'Senior Officer', 'Team Lead', 'Regional Lead'],
    General: ['Assistant', 'Coordinator', 'Manager', 'Senior Manager'],
  }[path] || ['Assistant', 'Coordinator', 'Manager', 'Senior Manager'];
  const currentIndex = Math.max(0, stages.indexOf(npc.jobTitle));
  return stages[Math.min(stages.length - 1, currentIndex + 1)] || npc.jobTitle;
}

function getNpcEntryPrefix(entry) {
  if (entry.role === 'parent') return `Your ${entry.label} ${entry.npc.firstName}`;
  if (entry.role === 'sibling') return `Your ${entry.label} ${entry.npc.firstName}`;
  return `Your friend ${entry.npc.firstName}`;
}

function syncFriendSnapshot(friend) {
  if (!friend) return;
  normalizeFriendRelationshipState(friend);
  const liveFriend = STATE.school?.classmates?.find(classmate => classmate.id === friend.id);
  if (liveFriend && liveFriend !== friend) Object.assign(liveFriend, friend);
  upsertPersistentFriend(friend);
}

function maybeUpdateNpcEducation(entry, updates) {
  const npc = entry.npc;
  const prefix = getNpcEntryPrefix(entry);
  if ((npc.age ?? 0) < 16) {
    npc.educationLevel = 'In school';
    npc.currentEducation = 'School';
    return;
  }
  if ((npc.age ?? 0) < 18) {
    const shouldStayAcademic = getNpcSmarts(npc) + npc.ambition >= 108;
    npc.educationLevel = shouldStayAcademic ? 'In college' : 'In school';
    npc.currentEducation = shouldStayAcademic ? 'College' : 'School';
    if ((npc.age ?? 0) === 16 && shouldStayAcademic) {
      recordNpcLifeUpdate(npc, `${prefix} started college.`, updates, 2);
    }
    return;
  }

  if (npc.educationLevel === 'In college' && getNpcSmarts(npc) + npc.ambition >= 122) {
    npc.educationLevel = 'At university';
    npc.degreeCourse = npc.degreeCourse || chooseNpcDegreeCourse(npc, { socialGroup: npc.socialGroup });
    npc.currentEducation = npc.degreeCourse;
    npc.employmentStatus = 'Student';
    npc.jobTitle = 'None';
    npc.salary = 0;
    npc.careerStage = 'Student';
    if (npc.housingStatus === 'Living with family' || npc.housingStatus === 'Moved back home') {
      npc.housingStatus = 'Student housing';
      npc.livesWith = ['Roommates'];
    }
    recordNpcLifeUpdate(npc, `${prefix} started university${npc.degreeCourse ? ` to study ${npc.degreeCourse}` : ''}.`, updates, 4);
    return;
  }

  if (npc.educationLevel === 'At university') {
    const universityYears = (npc.universityYears ?? 0) + 1;
    npc.universityYears = universityYears;
    const neededYears = npc.degreeCourse === 'Medicine' ? 5 : 3;
    const dropoutChance = Math.max(0.02, 0.12 - ((getNpcSmarts(npc) - 50) * 0.001) + (npc.stress > 72 ? 0.05 : 0));
    if (Math.random() < dropoutChance) {
      npc.educationLevel = 'Dropped out';
      npc.currentEducation = null;
      npc.employmentStatus = 'Unemployed';
      recordNpcLifeUpdate(npc, `${prefix} dropped out of university.`, updates, 4);
      return;
    }
    if (universityYears >= neededYears) {
      npc.educationLevel = 'Graduated';
      npc.currentEducation = null;
      npc.degreeCourse = npc.degreeCourse || chooseNpcDegreeCourse(npc, { socialGroup: npc.socialGroup });
      recordNpcLifeUpdate(npc, `${prefix} graduated${npc.degreeCourse ? ` in ${npc.degreeCourse}` : ''}.`, updates, 5);
    }
    return;
  }

  if (!['Graduated', 'Dropped out'].includes(npc.educationLevel) && (npc.age ?? 0) >= 22) {
    npc.educationLevel = 'No higher education';
    npc.currentEducation = null;
  }
}

function maybeUpdateNpcCareer(entry, updates) {
  const npc = entry.npc;
  const prefix = getNpcEntryPrefix(entry);
  const adult = (npc.age ?? 0) >= 18;
  if (!adult) return;
  if ((npc.age ?? 0) >= 65 && npc.employmentStatus !== 'Retired' && Math.random() < 0.35) {
    npc.employmentStatus = 'Retired';
    npc.jobTitle = 'Retired';
    npc.job = 'Retired';
    npc.salary = 0;
    npc.careerStage = 'Retired';
    npc.yearsInRole = 0;
    recordNpcLifeUpdate(npc, `${prefix} retired.`, updates, 5);
    return;
  }
  if (npc.educationLevel === 'At university') return;

  const smart = getNpcSmarts(npc);
  const rep = npc.reputation ?? getNpcReputationBase(npc);
  const ambitious = npc.ambition ?? 50;
  const employed = npc.employmentStatus === 'Employed' && npc.jobTitle && !['None', 'Retired'].includes(npc.jobTitle);

  if (!employed) {
    const wantsWork = npc.educationLevel !== 'At university' && npc.employmentStatus !== 'Retired';
    if (!wantsWork) return;
    const readyChance = 0.42 + ((smart - 50) * 0.003) + ((ambitious - 50) * 0.004) + ((rep - 50) * 0.002);
    if (Math.random() < readyChance) {
      const path = npc.careerPath || inferCareerPathFromJobOrCourse(npc.jobTitle, npc.degreeCourse);
      const catalog = {
        Legal: ['Legal Assistant', 'Paralegal', 'Court Clerk'],
        Healthcare: ['Healthcare Assistant', 'Lab Assistant', 'Junior Doctor'],
        Education: ['Teaching Assistant', 'Classroom Support Officer', 'Teacher Trainee'],
        Engineering: ['Electrical Trainee', 'Operations Analyst', 'Junior Engineer'],
        Technology: ['Operations Analyst', 'Project Coordinator', 'Support Analyst'],
        Business: ['Finance Assistant', 'Sales Executive', 'Project Coordinator'],
        Creative: ['Content Creator', 'Graphic Designer', 'Illustrator'],
        'Public Service': ['Police Officer', 'Firefighter', 'Civil Service Officer'],
        General: ['Receptionist', 'Admin Assistant', 'Customer Service Advisor'],
      }[path] || ['Receptionist', 'Admin Assistant', 'Sales Executive'];
      npc.jobTitle = catalog[npcSeedBetween(npc, `new-job-${STATE.age}`, 0, catalog.length - 1)];
      npc.job = npc.jobTitle;
      npc.employmentStatus = 'Employed';
      npc.salary = estimateNpcSalary(npc.jobTitle, { role: entry.role }, npc);
      npc.careerStage = 'Early career';
      npc.yearsInRole = 0;
      npc.employer = `${npc.surname || 'Northbridge'} ${path}`;
      recordNpcLifeUpdate(npc, `${prefix} started working as ${npc.jobTitle}.`, updates, 4);
    }
    return;
  }

  npc.yearsInRole = (npc.yearsInRole || 0) + 1;
  npc.salary = Math.max(0, Math.round((npc.salary || estimateNpcSalary(npc.jobTitle, { role: entry.role }, npc)) * (1 + ((Math.random() * 0.08) - 0.01))));
  const promotionChance = 0.08
    + Math.max(0, ambitious - 55) * 0.0025
    + Math.max(0, smart - 55) * 0.0018
    + Math.max(0, rep - 50) * 0.0016
    + (hasNpcTrait(npc, 'hardworking') ? 0.04 : 0)
    - (hasNpcTrait(npc, 'flaky') ? 0.05 : 0)
    - (hasNpcTrait(npc, 'toxic') ? 0.03 : 0);
  const jobLossChance = 0.04
    + (npc.stress > 76 ? 0.05 : 0)
    + (hasNpcTrait(npc, 'flaky') ? 0.06 : 0)
    + (hasNpcTrait(npc, 'toxic') ? 0.04 : 0)
    - Math.max(0, rep - 55) * 0.0013;
  let careerChangeChance = 0.05 + (ambitious > 72 && npc.yearsInRole >= 3 ? 0.08 : 0) + (npc.happiness < 42 ? 0.04 : 0);
  if (entry.role === 'parent') {
    careerChangeChance *= 0.22;
  }

  if (Math.random() < jobLossChance) {
    npc.employmentStatus = 'Unemployed';
    npc.jobTitle = 'None';
    npc.job = 'None';
    npc.salary = 0;
    npc.careerStage = 'Between roles';
    npc.yearsInRole = 0;
    recordNpcLifeUpdate(npc, `${prefix} lost ${entry.role === 'parent' ? 'their' : 'their'} job.`, updates, 5);
    return;
  }
  if (Math.random() < promotionChance && npc.yearsInRole >= 2) {
    npc.jobTitle = getNpcPromotionTitle(npc);
    npc.job = npc.jobTitle;
    npc.salary = Math.round((npc.salary || estimateNpcSalary(npc.jobTitle, { role: entry.role }, npc)) * 1.12);
    npc.careerStage = (npc.careerStage === 'Early career') ? 'Mid-career' : 'Established';
    npc.yearsInRole = 0;
    npc.reputation = clamp((npc.reputation || rep) + 6);
    recordNpcLifeUpdate(npc, `${prefix} got promoted to ${npc.jobTitle}.`, updates, 5);
    return;
  }
  if (Math.random() < careerChangeChance && (npc.age ?? 0) <= 58 && (entry.role !== 'parent' || npc.yearsInRole >= 5)) {
    const oldPath = npc.careerPath;
    const possible = ['Business', 'Education', 'Creative', 'Public Service', 'General', 'Technology', 'Engineering']
      .filter(path => path !== oldPath);
    npc.careerPath = possible[npcSeedBetween(npc, `career-shift-${STATE.age}`, 0, possible.length - 1)];
    npc.jobTitle = getNpcPromotionTitle({ ...npc, jobTitle: 'Assistant', careerPath: npc.careerPath });
    npc.job = npc.jobTitle;
    npc.salary = estimateNpcSalary(npc.jobTitle, { role: entry.role }, npc);
    npc.yearsInRole = 0;
    npc.careerStage = 'Fresh start';
    recordNpcLifeUpdate(npc, `${prefix} changed careers and became ${npc.jobTitle}.`, updates, 4);
  }
}

function maybeUpdateNpcHousing(entry, updates) {
  const npc = entry.npc;
  const prefix = getNpcEntryPrefix(entry);
  if (entry.role === 'parent') {
    npc.housingStatus = npc.employmentStatus === 'Retired' && (npc.age ?? 0) >= 65
      ? 'Retired at home'
      : 'Living with family';
    npc.livesWith = ['Family household'];
    return;
  }
  if ((npc.age ?? 0) < 18) return;
  const employed = npc.employmentStatus === 'Employed';
  if (npc.educationLevel === 'At university' && npc.housingStatus !== 'Student housing') {
    npc.housingStatus = 'Student housing';
    npc.livesWith = ['Roommates'];
    recordNpcLifeUpdate(npc, `${prefix} moved into student housing.`, updates, 3);
    return;
  }
  if (employed && (npc.age ?? 0) >= 22 && ['Living with family', 'Moved back home'].includes(npc.housingStatus) && Math.random() < 0.34) {
    npc.housingStatus = Math.random() < 0.28 ? 'Own flat' : 'Shared flat';
    npc.livesWith = npc.housingStatus === 'Own flat' ? ['Alone'] : ['Roommates'];
    recordNpcLifeUpdate(npc, `${prefix} moved ${npc.housingStatus === 'Own flat' ? 'into their own place' : 'into a shared flat'}.`, updates, 4);
    return;
  }
  if (!employed && ['Shared flat', 'Own flat'].includes(npc.housingStatus) && Math.random() < 0.18) {
    npc.housingStatus = 'Moved back home';
    npc.livesWith = ['Family'];
    recordNpcLifeUpdate(npc, `${prefix} moved back home.`, updates, 4);
  }
}

function maybeUpdateNpcRelationships(entry, updates) {
  const npc = entry.npc;
  const prefix = getNpcEntryPrefix(entry);
  if ((npc.age ?? 0) < 18 || entry.role === 'parent') return;
  const roll = Math.random();
  if (npc.relationshipStatus === 'Single' && roll < 0.18) {
    npc.relationshipStatus = 'In a relationship';
    if (npc.housingStatus === 'Own flat' && Math.random() < 0.22) {
      npc.housingStatus = 'Partner household';
      npc.livesWith = ['Partner'];
    }
    recordNpcLifeUpdate(npc, `${prefix} started a relationship.`, updates, 3);
    return;
  }
  if (npc.relationshipStatus === 'In a relationship' && (npc.age ?? 0) >= 28 && roll < 0.08) {
    npc.relationshipStatus = 'Married';
    npc.housingStatus = 'Partner household';
    npc.livesWith = ['Partner'];
    recordNpcLifeUpdate(npc, `${prefix} got married.`, updates, 5);
    return;
  }
  if (['In a relationship', 'Talking to someone'].includes(npc.relationshipStatus) && roll > 0.94) {
    npc.relationshipStatus = 'Single';
    recordNpcLifeUpdate(npc, `${prefix} is single again.`, updates, 2);
  }
}

function applyNpcRelationshipDrift(entry) {
  const npc = entry.npc;
  const traits = npc.traits || [];
  let drift = entry.role === 'parent' ? 0 : entry.role === 'sibling' ? -1 : -4;
  if (traits.includes('loyal')) drift += 2;
  if (traits.includes('supportive')) drift += 1;
  if (traits.includes('kind')) drift += 1;
  if (traits.includes('flaky')) drift -= 3;
  if (traits.includes('toxic')) drift -= 3;
  if (traits.includes('ambitious') && (npc.age ?? 0) >= 18) drift -= 1;
  const yearsIgnored = Math.max(0, STATE.age - (npc.lastInteractionAge ?? STATE.age));
  if (entry.role === 'friend') drift -= Math.min(6, yearsIgnored);
  if (entry.role === 'sibling') drift -= Math.min(3, Math.max(0, yearsIgnored - 1));
  npc.relationship = clamp((npc.relationship ?? npc.friendshipCloseness ?? 60) + drift);
  npc.friendshipCloseness = clamp(npc.relationship ?? npc.friendshipCloseness ?? 60);
}

function getStableFriendRelationship(friend, fallback = 60) {
  const relationship = friend?.relationship;
  const closeness = friend?.friendshipCloseness;
  const numericRelationship = relationship !== undefined && relationship !== null && !Number.isNaN(Number(relationship))
    ? Number(relationship)
    : null;
  const numericCloseness = closeness !== undefined && closeness !== null && !Number.isNaN(Number(closeness))
    ? Number(closeness)
    : null;
  if (numericRelationship !== null && numericCloseness !== null && numericRelationship === 0 && numericCloseness === 0) {
    return clamp(fallback);
  }
  if (numericRelationship !== null) return clamp(numericRelationship);
  if (numericCloseness !== null) return clamp(numericCloseness);
  return clamp(fallback);
}

function normalizeFriendRelationshipState(friend, fallback = null) {
  if (!friend || friend.status !== 'friend') return friend;
  const chosenFallback = fallback ?? STATE.relationships?.friends ?? 60;
  const rawValues = [friend?.friendshipCloseness, friend?.relationship]
    .filter(value => value !== undefined && value !== null && !Number.isNaN(Number(value)))
    .map(value => Number(value));
  const hasOnlyZeroData = rawValues.length > 0 && rawValues.every(value => value === 0);
  const stable = hasOnlyZeroData
    ? clamp(Math.max(chosenFallback, 55))
    : getStableFriendRelationship(friend, chosenFallback);
  friend.relationship = stable;
  friend.friendshipCloseness = stable;
  return friend;
}

function runAnnualNpcLifeProgression() {
  const state = ensureNpcSystemState();
  const updates = [];
  getImportantNpcEntries().forEach(entry => {
    const npc = ensureNpcCoreFields(entry.npc, { role: entry.role, socialGroup: entry.npc.socialGroup });
    maybeUpdateNpcEducation(entry, updates);
    maybeUpdateNpcCareer(entry, updates);
    maybeUpdateNpcHousing(entry, updates);
    maybeUpdateNpcRelationships(entry, updates);
    npc.happiness = clamp((npc.happiness ?? 50) + Math.floor(Math.random() * 9) - 4 - (npc.stress > 70 ? 2 : 0));
    npc.stress = clamp((npc.stress ?? 40) + Math.floor(Math.random() * 9) - 4 + (npc.employmentStatus === 'Employed' ? 1 : 0));
    applyNpcRelationshipDrift(entry);
    if (entry.role === 'friend') syncFriendSnapshot(npc);
  });
  const selected = updates
    .sort((a, b) => (b.priority - a.priority) || (a.text > b.text ? 1 : -1))
    .slice(0, 5)
    .map(item => item.text);
  state.annualUpdates = selected;
  if (selected.length) {
    selected.forEach(logPeopleUpdate);
    state.archive.unshift({ age: STATE.age, updates: selected });
    if (state.archive.length > 12) state.archive.length = 12;
  }
  return selected;
}

function ensurePersistentFriendState() {
  if (!STATE.social) STATE.social = { bullyCount:0, isBully:false, friends:[] };
  if (!Array.isArray(STATE.social.friends)) STATE.social.friends = [];
}

function ensureRomanceState() {
  if (!STATE.romance) {
    STATE.romance = {
      status: 'single',
      partner: null,
      exes: [],
      children: [],
      pregnancy: null,
      pendingChildNamingId: null,
      marriageYears: 0,
      relationshipYears: 0,
      datingPool: [],
    };
  }
  STATE.romance.status = STATE.romance.status || 'single';
  if (!Array.isArray(STATE.romance.exes)) STATE.romance.exes = [];
  if (!Array.isArray(STATE.romance.children)) STATE.romance.children = [];
  if (!Array.isArray(STATE.romance.datingPool)) STATE.romance.datingPool = [];
  STATE.romance.pendingChildNamingId = STATE.romance.pendingChildNamingId || null;
  if (!STATE.romance.partner && STATE._partnerName && (STATE.relationships?.partner || 0) > 0) {
    const parts = String(STATE._partnerName).trim().split(/\s+/);
    const firstName = parts.shift() || STATE._partnerName;
    const surname = parts.join(' ') || STATE.surname;
    STATE.romance.partner = buildRomanceNpc({
      firstName,
      surname,
      age: Math.max(16, STATE.age),
      relationship: STATE.relationships.partner,
      startedDatingAge: Math.max(16, STATE.age - 1),
      metAge: Math.max(16, STATE.age - 1),
    });
    STATE.romance.status = STATE.relationships.partner >= 80 ? 'engaged' : 'dating';
  }
  STATE.romance.partner = STATE.romance.partner || null;
  STATE.romance.pregnancy = STATE.romance.pregnancy || null;
  STATE.romance.marriageYears = STATE.romance.marriageYears || 0;
  STATE.romance.relationshipYears = STATE.romance.relationshipYears || 0;
  if (STATE.romance.partner) ensureNpcCoreFields(STATE.romance.partner, { role: 'partner', socialGroup: 'partner' });
  STATE.romance.children.forEach(child => ensureNpcCoreFields(child, { role: 'child', socialGroup: 'family' }));
  syncRomanceLegacyFields();
  return STATE.romance;
}

function syncRomanceLegacyFields() {
  const romance = STATE.romance || {};
  const partner = romance.partner || null;
  STATE._partnerName = partner ? `${partner.firstName}${partner.surname ? ` ${partner.surname}` : ''}` : null;
  STATE.relationships.partner = partner ? clamp(partner.relationship ?? STATE.relationships.partner ?? 0) : 0;
}

function getCurrentPartner() {
  ensureRomanceState();
  return STATE.romance.partner || null;
}

function getChildById(personId) {
  ensureRomanceState();
  return STATE.romance.children.find(child => child.id === personId) || null;
}

function getRomancePersonById(personId) {
  const partner = getCurrentPartner();
  if (partner?.id === personId) return partner;
  return (STATE.romance?.exes || []).find(ex => ex.id === personId) || null;
}

function partnerTraitPool() {
  return CLASSMATE_TRAITS_POOL;
}

function buildRomanceNpc(base = {}) {
  const gender = base.gender || (Math.random() > 0.5 ? 'male' : 'female');
  const partner = {
    id: base.id || uid(),
    firstName: base.firstName || pickRandom(NAMES_UK[gender]),
    surname: base.surname || pickRandom(NAMES_UK.surnames),
    gender,
    age: base.age ?? Math.max(16, STATE.age),
    appearance: base.appearance || generateAppearance(gender),
    traits: (base.traits || sampleN(CLASSMATE_TRAITS_POOL, 2).map(trait => trait.id)).slice(0, 3),
    compatibility: clamp(base.compatibility ?? randomStat(35, 92)),
    relationship: clamp(base.relationship ?? base.friendshipCloseness ?? 58),
    attraction: clamp(base.attraction ?? randomStat(35, 90)),
    loyalty: clamp(base.loyalty ?? randomStat(35, 92)),
    ambition: clamp(base.ambition ?? randomStat(30, 88)),
    kindness: clamp(base.kindness ?? randomStat(30, 88)),
    conflict: clamp(base.conflict ?? randomStat(10, 70)),
    job: base.job || base.jobTitle || (((base.age ?? STATE.age) >= 18) ? pickRandom(['Admin Assistant', 'Retail Assistant', 'Customer Service Advisor', 'Barista', 'Teaching Assistant']) : 'Student'),
    salary: base.salary ?? (((base.age ?? STATE.age) >= 18 && base.job !== 'Student') ? randomStat(16000, 32000) : 0),
    educationLevel: base.educationLevel || (((base.age ?? STATE.age) >= 18) ? pickRandom(['No higher education', 'In college', 'At university', 'Graduated']) : 'In school'),
    relationshipStatus: base.relationshipStatus || 'Single',
    maritalStatus: base.maritalStatus || 'Single',
    livingTogether: base.livingTogether ?? false,
    metAge: base.metAge ?? STATE.age,
    startedDatingAge: base.startedDatingAge ?? null,
    engagedAge: base.engagedAge ?? null,
    marriedAge: base.marriedAge ?? null,
  };
  ensureNpcCoreFields(partner, { role: 'partner', socialGroup: 'partner' });
  partner.relationship = clamp(base.relationship ?? partner.relationship);
  partner.friendshipCloseness = partner.relationship;
  partner.jobTitle = partner.job;
  partner.relationshipStatus = romanceStatusLabel(STATE.romance?.status || 'single');
  partner.maritalStatus = ['married', 'widowed'].includes(STATE.romance?.status) ? 'Married' : (STATE.romance?.status === 'divorced' ? 'Divorced' : 'Single');
  return partner;
}

function romanceStatusLabel(status) {
  return {
    single: 'Single',
    dating: 'Dating',
    engaged: 'Engaged',
    married: 'Married',
    separated: 'Separated',
    divorced: 'Divorced',
    widowed: 'Widowed',
  }[status] || 'Single';
}

function getEligibleKnownDatingPeople() {
  ensureNpcSystemState();
  const sources = [
    ...(STATE.school?.classmates || []),
    ...(STATE.social?.friends || []),
  ];
  const seen = new Set();
  return sources.filter(person => {
    if (!person || seen.has(person.id)) return false;
    seen.add(person.id);
    ensureNpcCoreFields(person, {
      role: person.status === 'friend' ? 'friend' : 'classmate',
      socialGroup: person.status === 'friend' ? (person.socialGroup || 'friend') : 'classmate',
    });
    return (person.age ?? STATE.age) >= 16
      && person.canBecomePartner !== false
      && playerLikesGender(person.gender)
      && person.id !== getCurrentPartner()?.id;
  });
}

function getPreferredDatingGenders() {
  if (STATE.sexuality === 'bisexual') return ['male', 'female'];
  if (STATE.sexuality === 'heterosexual') return [STATE.gender === 'male' ? 'female' : 'male'];
  if (STATE.sexuality === 'homosexual') return [STATE.gender];
  return ['male', 'female'];
}

function generateDatingCandidate(knownPerson = null) {
  const known = knownPerson ? ensureNpcCoreFields({ ...knownPerson }, { role: 'friend', socialGroup: knownPerson.socialGroup || 'friend' }) : null;
  const baseAge = Math.max(16, STATE.age + npcSeedBetween({ id: uid() }, 'dating-age', -2, 3));
  const preferredGenders = getPreferredDatingGenders();
  const gender = known?.gender || pickRandom(preferredGenders);
  const partner = buildRomanceNpc(known || {
    gender,
    age: baseAge,
    relationship: randomStat(42, 72),
    compatibility: known ? clamp((known.compatibility ?? 60) + randomStat(-8, 12)) : randomStat(40, 92),
    attraction: randomStat(35, 92),
  });
  partner.relationshipStatus = 'Single';
  partner.maritalStatus = 'Single';
  return partner;
}

function generateDatingPool(count = 10) {
  ensureRomanceState();
  const known = getEligibleKnownDatingPeople().sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0)).slice(0, 3);
  const pool = [];
  known.forEach(person => pool.push(generateDatingCandidate(person)));
  while (pool.length < count) pool.push(generateDatingCandidate());
  STATE.romance.datingPool = pool.slice(0, count);
  return STATE.romance.datingPool;
}

function getDatingPool() {
  ensureRomanceState();
  if (!STATE.romance.datingPool.length) generateDatingPool(10);
  return STATE.romance.datingPool;
}

function beginRelationshipWithPartner(partner, sourceLabel = 'Started dating') {
  ensureRomanceState();
  const romance = STATE.romance;
  romance.partner = buildRomanceNpc({
    ...partner,
    relationship: clamp(partner.relationship ?? STATE.relationships.partner ?? 62),
    startedDatingAge: STATE.age,
    metAge: partner.metAge ?? STATE.age,
  });
  romance.partner.relationshipStatus = 'Dating';
  romance.partner.maritalStatus = 'Single';
  romance.status = 'dating';
  romance.relationshipYears = 0;
  romance.marriageYears = 0;
  romance.pregnancy = null;
  STATE.relationships.partner = clamp(romance.partner.relationship ?? 60);
  syncRomanceLegacyFields();
  logActivity(`${sourceLabel} ${romance.partner.firstName} ${romance.partner.surname}.`, 10);
  return romance.partner;
}

function attemptDatePerson(personId) {
  ensureRomanceState();
  if (STATE.age < 16) return { ok:false, message:'You are too young to date right now.' };
  if (STATE.romance.partner) return { ok:false, message:'You are already with someone.' };
  const candidate = getDatingPool().find(person => person.id === personId) || getEligibleKnownDatingPeople().find(person => person.id === personId);
  if (!candidate) return { ok:false, message:'That person is no longer available.' };
  const compatibility = candidate.compatibility ?? 50;
  let chance = 28
    + (STATE.stats.looks || 0) * 0.18
    + (STATE.stats.happy || 0) * 0.08
    + clampRep(STATE.stats.rep || 0) * 0.05
    + compatibility * 0.24
    + (candidate.attraction || 50) * 0.16;
  if ((candidate.traits || []).includes('kind')) chance += 6;
  if ((candidate.traits || []).includes('supportive')) chance += 5;
  if ((candidate.traits || []).includes('loyal')) chance += 4;
  if ((candidate.traits || []).includes('flaky')) chance -= 6;
  if ((candidate.traits || []).includes('toxic')) chance -= 10;
  if ((candidate.relationshipStatus || 'Single') !== 'Single') chance -= 12;
  chance = Math.max(8, Math.min(94, chance));
  if (Math.random() * 100 <= chance) {
    const partner = beginRelationshipWithPartner(candidate, 'Started dating');
    STATE.romance.datingPool = STATE.romance.datingPool.filter(person => person.id !== personId);
    return { ok:true, success:true, message:`You started dating ${partner.firstName}.` };
  }
  applyEffects({ happy:-2 });
  logActivity(`Things did not go anywhere with ${candidate.firstName}.`, -2);
  return { ok:true, success:false, message:`The date with ${candidate.firstName} did not lead anywhere.` };
}

function passDatingMatch(personId) {
  ensureRomanceState();
  STATE.romance.datingPool = getDatingPool().filter(person => person.id !== personId);
  while (STATE.romance.datingPool.length < 10) STATE.romance.datingPool.push(generateDatingCandidate());
}

function movePartnerToExes(reason = 'Relationship ended') {
  const partner = getCurrentPartner();
  if (!partner) return;
  ensureRomanceState();
  partner.livingTogether = false;
  partner.livesWithPlayer = false;
  const snapshot = { ...partner, relationshipStatus: reason, maritalStatus: reason === 'Divorced' ? 'Divorced' : partner.maritalStatus };
  STATE.romance.exes.unshift(snapshot);
  if (STATE.romance.exes.length > 12) STATE.romance.exes.length = 12;
}

function clearCurrentPartner(status = 'single') {
  ensureRomanceState();
  STATE.romance.partner = null;
  STATE.romance.status = status;
  STATE.romance.relationshipYears = 0;
  STATE.romance.marriageYears = 0;
  syncRomanceLegacyFields();
}

function breakupWithPartner() {
  const partner = getCurrentPartner();
  if (!partner) return { ok:false, message:'You are not with anyone right now.' };
  const pain = Math.max(4, Math.round((partner.relationship || 55) / 10));
  movePartnerToExes('Ex');
  clearCurrentPartner('single');
  applyEffects({ happy:-pain });
  logActivity(`You broke up with ${partner.firstName}.`, -pain);
  return { ok:true, message:`You broke up with ${partner.firstName}.` };
}

function divorcePartner() {
  const partner = getCurrentPartner();
  if (!partner || STATE.romance.status !== 'married') return { ok:false, message:'You are not married right now.' };
  const hasChildren = (STATE.romance.children || []).length > 0;
  const wealthPenalty = STATE.finances.balance > 100000 ? Math.round(STATE.finances.balance * 0.05) : 0;
  const cost = 1500 + (hasChildren ? 1000 : 0) + wealthPenalty;
  STATE.finances.balance -= cost;
  movePartnerToExes('Divorced');
  clearCurrentPartner('divorced');
  applyEffects({ happy:-12, rep:-3 });
  logActivity(`You divorced ${partner.firstName}.`, -12);
  return { ok:true, message:`You finalised the divorce. It cost ${fmtMoney(cost)}.` };
}

function proposeToPartner() {
  const partner = getCurrentPartner();
  ensureRomanceState();
  if (!partner || STATE.romance.status !== 'dating') return { ok:false, message:'You need to be dating first.' };
  if (STATE.age < 18) return { ok:false, message:'You are too young to propose.' };
  if ((partner.relationship || 0) < 75 || (STATE.romance.relationshipYears || 0) < 1) return { ok:false, message:'The relationship is not ready for that yet.' };
  let chance = 34 + (partner.relationship || 0) * 0.38 + (partner.compatibility || 0) * 0.22 + (partner.loyalty || 0) * 0.16 - (partner.conflict || 0) * 0.18;
  chance = Math.max(10, Math.min(96, chance));
  if (Math.random() * 100 <= chance) {
    STATE.romance.status = 'engaged';
    partner.engagedAge = STATE.age;
    partner.relationshipStatus = 'Engaged';
    logActivity(`You got engaged to ${partner.firstName}.`, 12);
    applyEffects({ happy:+8, rep:+3 });
    syncRomanceLegacyFields();
    return { ok:true, success:true, message:`${partner.firstName} said yes.` };
  }
  partner.relationship = clamp((partner.relationship || 70) - 12);
  STATE.relationships.partner = partner.relationship;
  applyEffects({ happy:-6 });
  logActivity(`${partner.firstName} was not ready to get engaged.`, -6);
  syncRomanceLegacyFields();
  return { ok:true, success:false, message:`${partner.firstName} said no.` };
}

function marryPartner(style = 'registry') {
  const partner = getCurrentPartner();
  ensureRomanceState();
  if (!partner || STATE.romance.status !== 'engaged') return { ok:false, message:'You need to be engaged first.' };
  if (STATE.age < 18) return { ok:false, message:'You are too young to get married.' };
  const costMap = { registry:500, small:5000, big:20000 };
  const repMap = { registry:2, small:4, big:7 };
  const happyMap = { registry:8, small:12, big:16 };
  const cost = costMap[style] ?? 500;
  if (STATE.finances.balance < cost) return { ok:false, message:'You cannot afford that wedding yet.' };
  STATE.finances.balance -= cost;
  STATE.romance.status = 'married';
  partner.marriedAge = STATE.age;
  partner.relationshipStatus = 'Married';
  partner.maritalStatus = 'Married';
  applyEffects({ happy:happyMap[style] ?? 8, rep:repMap[style] ?? 2 });
  logActivity(`You married ${partner.firstName}.`, happyMap[style] ?? 8);
  syncRomanceLegacyFields();
  return { ok:true, message:`You got married. Wedding cost ${fmtMoney(cost)}.` };
}

function getPregnancyChanceForAge(age = STATE.age) {
  if (age < 18 || age > 45) return 0;
  if (age <= 30) return 0.34;
  if (age <= 38) return 0.2;
  return 0.08;
}

function tryForBaby() {
  const partner = getCurrentPartner();
  ensureRomanceState();
  if (!partner) return { ok:false, message:'You need a partner first.' };
  if (STATE.age < 18) return { ok:false, message:'You are too young for that right now.' };
  if (STATE.romance.pregnancy) return { ok:false, message:'A pregnancy is already ongoing.' };
  const baseChance = getPregnancyChanceForAge(STATE.age);
  if (!baseChance) return { ok:false, message:'Pregnancy is very unlikely at this age.' };
  let chance = baseChance;
  if (['engaged', 'married'].includes(STATE.romance.status)) chance += 0.08;
  if (STATE.romance.status === 'dating') chance -= 0.03;
  if ((partner.relationship || 0) >= 78) chance += 0.03;
  chance = Math.max(0.02, Math.min(0.72, chance));
  if (Math.random() < chance) {
    STATE.romance.pregnancy = {
      id: uid(),
      partnerId: partner.id,
      conceivedAge: STATE.age,
      dueAge: STATE.age + 1,
      planned: true,
      outcome: 'ongoing',
    };
    logActivity(`You and ${partner.firstName} are expecting a baby.`, 12);
    applyEffects({ happy:+6 });
    return { ok:true, success:true, message:'You are expecting a baby.' };
  }
  logActivity('You tried for a baby, but nothing happened yet.', null);
  return { ok:true, success:false, message:'Nothing happened yet.' };
}

function createRomanceChild(parentPartner = null) {
  const partner = parentPartner || getCurrentPartner();
  if (!partner) return null;
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const child = {
    id: uid(),
    firstName: pickRandom(NAMES_UK[gender]),
    surname: STATE.surname,
    gender,
    age: 0,
    appearance: generateFamilyAppearance(gender, [STATE.appearance, partner.appearance]),
    traits: sampleN(CLASSMATE_TRAITS_POOL, 2).map(trait => trait.id),
    relationship: 72,
    otherParentId: partner.id,
    bornAge: STATE.age,
  };
  ensureNpcCoreFields(child, { role: 'child', socialGroup: 'family' });
  child.educationLevel = 'Pre-school';
  child.currentEducation = null;
  child.jobTitle = 'None';
  child.salary = 0;
  return child;
}

function resolvePregnancyBirth() {
  ensureRomanceState();
  const pregnancy = STATE.romance.pregnancy;
  if (!pregnancy || pregnancy.dueAge > STATE.age) return null;
  const child = createRomanceChild(getRomancePersonById(pregnancy.partnerId));
  if (!child) return null;
  STATE.romance.children.push(child);
  STATE.romance.pregnancy = null;
  STATE.romance.pendingChildNamingId = child.id;
  applyEffects({ happy:+10, rep:+2 });
  logActivity('Your baby was born.', 14);
  return child;
}

function runAnnualRomanceProgression() {
  ensureRomanceState();
  const romance = STATE.romance;
  romance.children.forEach(child => ageNpcOneYear(child, { role: 'child', socialGroup: 'family' }));
  const partner = romance.partner;
  if (!partner) {
    resolvePregnancyBirth();
    return;
  }
  ageNpcOneYear(partner, { role: 'partner', socialGroup: 'partner' });
  romance.relationshipYears += 1;
  if (romance.status === 'married') romance.marriageYears += 1;
  resolvePregnancyBirth();
  let drift = 0;
  drift += ((partner.compatibility || 50) - 50) * 0.08;
  drift += ((partner.kindness || 50) - 50) * 0.05;
  drift += ((partner.loyalty || 50) - 50) * 0.05;
  drift -= ((partner.conflict || 50) - 40) * 0.07;
  const traits = partner.traits || [];
  if (traits.includes('kind')) drift += 2;
  if (traits.includes('supportive')) drift += 2;
  if (traits.includes('loyal')) drift += 2;
  if (traits.includes('toxic')) drift -= 4;
  if (traits.includes('flaky')) drift -= 2;
  if (traits.includes('jealous')) drift -= 2;
  if (traits.includes('manipulative')) drift -= 3;
  if (partner.livingTogether) drift += (partner.conflict || 50) > 62 ? -2 : 1;
  if ((STATE.finances.balance || 0) < 0) drift -= 2;
  if (romance.children.length) {
    drift -= 1;
    applyEffects({ happy:+1 });
  }
  partner.relationship = clamp(Math.round((partner.relationship || 60) + drift + (Math.random() * 5 - 2)));
  partner.friendshipCloseness = partner.relationship;
  STATE.relationships.partner = partner.relationship;
  partner.relationshipStatus = romanceStatusLabel(romance.status);
  partner.maritalStatus = ['married', 'widowed'].includes(romance.status) ? 'Married' : (romance.status === 'divorced' ? 'Divorced' : 'Single');
  syncRomanceLegacyFields();
}

function runChildRelationshipAction(action, child) {
  if (!child) return { ok:false };
  const effects = action.effects || {};
  let delta = 0;
  Object.entries(effects).forEach(([key, value]) => {
    if (key === 'rel_child') {
      child.relationship = clamp((child.relationship || 60) + value);
      delta += value;
    } else {
      applyEffects({ [key]: value });
      delta += value;
    }
  });
  markNpcInteraction(child, `${action.name} with ${child.firstName}.`);
  logActivity(`${action.name} with ${child.firstName}`, delta);
  return { ok:true, toast:`${action.name} with ${child.firstName} ✓` };
}

// TODO: cheating suspicion
// TODO: partner loses job
// TODO: fertility struggles
// TODO: surprise pregnancy
// TODO: miscarriage / pregnancy complications
// TODO: wedding planning drama
// TODO: in-law tension
// TODO: custody dispute
// TODO: child illness
// TODO: child school milestones
// TODO: partner career promotion
// TODO: partner wants to move city
// TODO: blended families / stepchildren

function upsertPersistentFriend(friend) {
  if (!friend) return;
  ensurePersistentFriendState();
  ensureNpcCoreFields(friend, {
    role: 'friend',
    socialGroup: friend.socialGroup || (STATE.school?.level === 'uni' ? 'university friend' : 'school friend'),
  });
  const existing = STATE.social.friends.find(current => current.id === friend.id) || null;
  const stableRelationship = getStableFriendRelationship(friend, getStableFriendRelationship(existing, STATE.relationships?.friends ?? 60));
  const snapshot = {
    ...friend,
    status: 'friend',
    relationship: stableRelationship,
    friendshipCloseness: stableRelationship,
  };
  const index = STATE.social.friends.findIndex(existing => existing.id === snapshot.id);
  if (index >= 0) STATE.social.friends[index] = { ...STATE.social.friends[index], ...snapshot };
  else STATE.social.friends.push(snapshot);
}

function getPersistentFriendById(personId) {
  ensurePersistentFriendState();
  return STATE.social.friends.find(friend => friend.id === personId) || null;
}

function playerLikesGender(gender) {
  if (STATE.sexuality === 'bisexual') return true;
  if (STATE.sexuality === 'heterosexual') return STATE.gender !== gender;
  if (STATE.sexuality === 'homosexual') return STATE.gender === gender;
  return true;
}

function isClassmateCrush(classmate) {
  if (!classmate?.npcStats) return false;
  return playerLikesGender(classmate.gender)
    && classmate.npcStats.looks >= 70
    && classmate.compatibility >= 70;
}

function classmateDisplayName(classmate) {
  const fullName = `${classmate.firstName} ${classmate.surname}`;
  return isClassmateCrush(classmate) ? `💗 ${fullName} (crush) 💗` : fullName;
}

function buildSiblingObject(s, surname, mumAppearance, dadAppearance, age) {
  const sibling = {
    id:           uid(),
    firstName:    s.name,
    surname,
    gender:       s.gender,
    age,
    emoji:        pickRandom(APPEARANCE_EMOJIS),
    appearance:   generateFamilyAppearance(s.gender, [mumAppearance, dadAppearance]),
    traits:       sampleN(CLASSMATE_TRAITS_POOL, 2).map(t => t.id),
    compatibility:Math.floor(Math.random()*45)+35,
    siblingType:  s.siblingType || 'full',
    familyStatus: s.familyStatus || null,
    hasKids:      s.hasKids ?? (age >= 22 ? Math.random() < 0.35 : false),
    relationship: Math.floor(Math.random()*30)+50,
  };
  sibling.npcStats = buildSiblingNpcStats(sibling);
  return sibling;
}

function applyEffects(effects) {
  if (!effects) return;
  Object.entries(effects).forEach(([k,v]) => {
    if      (k==='balance')     STATE.finances.balance     += v;
    else if (k==='income')      STATE.finances.income      += v;
    else if (k==='expenses')    STATE.finances.expenses    += v;
    else if (k==='rep')         STATE.stats.rep             = clampRep((STATE.stats.rep||0)+v);
    else if (k==='gradeScore')  STATE.school.gradeScore     = clamp(STATE.school.gradeScore+v,0,100);
    else if (k==='rel_family') {
      if (STATE.family?.mum?.alive) STATE.family.mum.relationship = clamp((STATE.family.mum.relationship ?? 60) + v);
      if (STATE.family?.dad?.alive) STATE.family.dad.relationship = clamp((STATE.family.dad.relationship ?? 60) + v);
      syncSharedFamilyRelationshipFromParents();
    }
    else if (k==='rel_friends') STATE.relationships.friends = clamp(STATE.relationships.friends+v);
    else if (k==='rel_partner') {
      STATE.relationships.partner = clamp(STATE.relationships.partner+v);
      if (STATE.romance?.partner) {
        STATE.romance.partner.relationship = clamp((STATE.romance.partner.relationship || STATE.relationships.partner) + v);
        STATE.romance.partner.friendshipCloseness = STATE.romance.partner.relationship;
        syncRomanceLegacyFields();
      }
    }
    else if (STATE.stats[k]!==undefined) STATE.stats[k]    = clamp(STATE.stats[k]+v);
  });
}

function logActivity(text, delta) {
  STATE.activity.unshift({ text, delta, age: STATE.age });
  if (STATE.activity.length > 50) STATE.activity.pop();
}

function logPeopleUpdate(text) {
  if (!text) return;
  const alreadyLogged = (STATE.activity || []).some(entry => entry.age === STATE.age && entry.text === text);
  if (alreadyLogged) return;
  STATE.activity.unshift({ text, delta: null, age: STATE.age, type: 'people_update' });
  if (STATE.activity.length > 80) STATE.activity.pop();
}

// ── FAMILY ACTIONS ──────────────────────────────────

function getParentById(personId) {
  if (personId === STATE.family.mum?.id) return STATE.family.mum;
  if (personId === STATE.family.dad?.id) return STATE.family.dad;
  return null;
}

function getSiblingById(personId) {
  return STATE.family.siblings.find(s => s.id === personId) || null;
}

function syncSharedFamilyRelationshipFromParents() {
  const parents = [STATE.family?.mum, STATE.family?.dad].filter(Boolean).filter(p => p.alive !== false);
  if (!parents.length) return;
  STATE.relationships.family = clamp(Math.round(
    parents.reduce((sum, p) => sum + (p.relationship ?? 60), 0) / parents.length
  ));
}

function applyTargetedParentEffects(effects, person) {
  if (!effects) return 0;
  markNpcInteraction(person);
  const passthrough = {};
  let delta = 0;
  Object.entries(effects).forEach(([k, v]) => {
    if (k === 'rel_family') {
      person.relationship = clamp((person.relationship ?? 60) + v);
      delta += v;
    } else {
      passthrough[k] = v;
      delta += v;
    }
  });
  applyEffects(passthrough);
  syncSharedFamilyRelationshipFromParents();
  return delta;
}

function applyTargetedSiblingEffects(effects, person) {
  if (!effects) return 0;
  markNpcInteraction(person);
  const passthrough = {};
  let delta = 0;
  Object.entries(effects).forEach(([k, v]) => {
    if (k === 'rel_sibling') {
      person.relationship = clamp((person.relationship ?? 60) + v);
      delta += v;
    } else {
      passthrough[k] = v;
      delta += v;
    }
  });
  applyEffects(passthrough);
  return delta;
}

function parentNoun(role) {
  return role === 'Mother' ? 'mother' : 'father';
}

function isHighPayingParentJob(job) {
  return PARENT_JOBS.upper_middle.includes(job) || PARENT_JOBS.elite.includes(job);
}

function diaryPlaceholderFor(actionId, role, variant='success') {
  const parent = parentNoun(role);
  const placeholders = {
    cuddle: {
      success: [
        `PLACEHOLDER: I cuddled with my ${parent} for x minutes.`,
        `PLACEHOLDER: My ${parent} would not let go of me.`,
        `PLACEHOLDER: I snuggled with my ${parent}.`,
      ],
    },
    play_together: {
      success: [
        `PLACEHOLDER: I played with my ${parent} today.`,
        `PLACEHOLDER: My ${parent} made time to play with me.`,
        `PLACEHOLDER: I laughed and played with my ${parent}.`,
      ],
    },
    throw_tantrum: {
      success: [
        `PLACEHOLDER: I threw a tantrum at my ${parent}.`,
        `PLACEHOLDER: My ${parent} had to deal with one of my meltdowns.`,
        `PLACEHOLDER: I made life hard for my ${parent} today.`,
      ],
    },
    learn_from_parent: {
      success: [
        `PLACEHOLDER: My ${parent} taught me something new today.`,
        `PLACEHOLDER: I learned something from my ${parent}.`,
        `PLACEHOLDER: My ${parent} showed me how something worked.`,
      ],
      busy: [
        `PLACEHOLDER: My ${parent} was too busy to teach me anything today.`,
      ],
      distant: [
        `PLACEHOLDER: My ${parent} felt too distant to teach me anything today.`,
      ],
      absent: [
        `PLACEHOLDER: My ${parent} was not around to teach me anything today.`,
      ],
    },
    ask_for_money_young_adult: {
      success_easy: [
        `My ${parent} did not ask any questions and gave me the money.`,
      ],
      success: [
        `My ${parent} gave me the money after I asked.`,
      ],
      deny_too_much: [
        `My ${parent} said that was way too much money and called me irresponsible.`,
      ],
      deny_repeat: [
        `My ${parent} said no and demanded to know what I wanted the money for.`,
      ],
      deny_generic: [
        `My ${parent} said no when I asked for money.`,
      ],
    },
  };
  const pool = placeholders[actionId]?.[variant] || [`PLACEHOLDER: Something happened with my ${parent}.`];
  return pickRandom(pool);
}

function runParentRelationshipAction(action, person, role) {
  if (!person) return { ok:false };

  if (action.id === 'move_out_young_adult') {
    window._playSubTab = 'home';
    const currentHome = typeof getCurrentHome === 'function' ? getCurrentHome() : null;
    window._homeView = currentHome?.source === 'family' ? 'rent' : 'family_overview';
    if (typeof switchTab === 'function') {
      switchTab('activities', document.getElementById('nav-activities'));
    }
    return { ok:true, skipRefresh:true, skipToast:true };
  }

  if (action.id === 'contribute_financially_young_adult') {
    if (typeof contributeBillsAtHome !== 'function') return { ok:false };
    const result = contributeBillsAtHome();
    return { ok:result.ok, toast:result.message };
  }

  if (action.id === 'ask_for_money_young_adult') {
    openMoneyRequestOverlay(person.id, role);
    return { ok:true, skipRefresh:true, skipToast:true };
  }

  if (action.customType === 'parent_learn') {
    const traits = person.traits || [];
    if (traits.includes('absent') && Math.random() < 0.85) {
      logActivity(diaryPlaceholderFor(action.id, role, 'absent'), 0);
      return { ok:true, toast:`${person.firstName} was not around.` };
    }
    if (traits.includes('distant') && Math.random() < 0.65) {
      logActivity(diaryPlaceholderFor(action.id, role, 'distant'), 0);
      return { ok:true, toast:`${person.firstName} kept their distance.` };
    }

    let busyChance = isHighPayingParentJob(person.job) ? 0.45 : 0.1;
    if (traits.includes('hardworking')) busyChance += 0.15;
    if (traits.includes('supportive'))  busyChance -= 0.1;
    if (traits.includes('kind'))        busyChance -= 0.05;
    busyChance = Math.max(0, Math.min(0.9, busyChance));

    if (Math.random() < busyChance) {
      logActivity(diaryPlaceholderFor(action.id, role, 'busy'), 0);
      return { ok:true, toast:`${person.firstName} was too busy.` };
    }

    let smartsGain = 1 + Math.floor(Math.random() * 3);
    if (traits.includes('supportive'))  smartsGain += 1;
    if (traits.includes('kind'))        smartsGain += 1;
    if (traits.includes('ambitious'))   smartsGain += 1;
    if (traits.includes('strict'))      smartsGain += 1;
    if (traits.includes('hardworking')) smartsGain += 1;

    const teachingJobs = new Set([
      'Teacher',
      'University Lecturer',
      'Doctor',
      'Nurse',
      'Engineer',
      'Architect',
      'Accountant',
      'Financial Advisor',
      'Social Worker',
      'Police Officer',
    ]);
    if (teachingJobs.has(person.job)) smartsGain += 1;

    smartsGain = clamp(smartsGain, 1, 5);
    const effects = { smarts: smartsGain };
    applyEffects(effects);
    logActivity(diaryPlaceholderFor(action.id, role, 'success'), smartsGain);
    return { ok:true, toast:`Learned something with ${person.firstName} ✓` };
  }

  const delta = applyTargetedParentEffects(action.effects || {}, person);
  logActivity(diaryPlaceholderFor(action.id, role, 'success'), delta);
  return { ok:true, toast:`${action.name} with ${person.firstName} ✓` };
}

function runSiblingRelationshipAction(action, person, role) {
  if (!person) return { ok:false };
  if (action.customType === 'sibling_help_kids' && !person.hasKids) {
    return { ok:false };
  }
  const delta = applyTargetedSiblingEffects(action.effects || {}, person);
  logActivity(`${action.name} with ${person.firstName}`, delta);
  return { ok:true, toast:`${action.name} with ${person.firstName} ✓` };
}

function applyTargetedClassmateEffects(effects, person) {
  if (!effects) return 0;
  const passthrough = {};
  let delta = 0;
  Object.entries(effects).forEach(([k, v]) => {
    if (k === 'rel_classmate') {
      person.relationship = clamp((person.relationship ?? 0) + v);
      if (person.status === 'friend') person.friendshipCloseness = person.relationship;
      delta += v;
    } else {
      passthrough[k] = v;
      delta += v;
    }
  });
  applyEffects(passthrough);
  return delta;
}

function markPlayerAsBully(reason, person) {
  STATE.social.bullyCount = (STATE.social.bullyCount || 0) + 1;
  if (!STATE.social.isBully && STATE.social.bullyCount >= 2) {
    STATE.social.isBully = true;
    applyEffects({ rep:-10 });
    logActivity(`You became known as a bully after ${reason} ${person.firstName}.`, -10);
  }
}

function runClassmateConversation(person) {
  const goodChance = 0.45 + (person.compatibility / 200) + ((STATE.stats.popularity || 0) / 300);
  if (Math.random() < goodChance) {
    const delta = applyTargetedClassmateEffects({ happy:+2, rel_classmate:+4, popularity:+1 }, person);
    logActivity(`Had a good conversation with ${person.firstName}.`, delta);
    return { ok:true, toast:`Good conversation with ${person.firstName} ✓` };
  }
  const delta = applyTargetedClassmateEffects({ happy:-1, rel_classmate:-2 }, person);
  logActivity(`A conversation with ${person.firstName} went badly.`, delta);
  return { ok:true, toast:`That went badly with ${person.firstName}.` };
}

function runClassmateFlirt(person) {
  const crushBonus = isClassmateCrush(person) ? 15 : 0;
  const chance = clamp(35 + Math.floor(person.compatibility / 3) + Math.floor((STATE.stats.looks || 0) / 6) + crushBonus, 5, 95);
  if (Math.random() * 100 < chance) {
    const delta = applyTargetedClassmateEffects({ happy:+5, rel_classmate:+5, popularity:+1 }, person);
    logActivity(`Flirted with ${person.firstName} and it landed well.`, delta);
    return { ok:true, toast:`Flirted with ${person.firstName} ✓` };
  }
  const delta = applyTargetedClassmateEffects({ happy:-2, rel_classmate:-3, rep:-1 }, person);
  logActivity(`Flirted with ${person.firstName} and it got awkward.`, delta);
  return { ok:true, toast:`That got awkward with ${person.firstName}.` };
}

function runClassmateRelationshipAction(action, person, role) {
  if (!person) return { ok:false };
  if (action.customType === 'classmate_friend_request') {
    return tryMakeFriend(person);
  }
  if (action.customType === 'classmate_conversation') {
    return runClassmateConversation(person);
  }
  if (action.customType === 'classmate_flirt') {
    return runClassmateFlirt(person);
  }
  const delta = applyTargetedClassmateEffects(action.effects || {}, person);
  if (action.customType === 'classmate_insult') {
    markPlayerAsBully('insulting', person);
  }
  if (action.customType === 'classmate_rumour') {
    markPlayerAsBully('spreading rumours about', person);
  }
  if (person.status === 'friend') normalizeFriendRelationshipState(person);
  logActivity(`${action.name} with ${person.firstName}`, delta);
  return { ok:true, toast:`${action.name} with ${person.firstName} ✓` };
}

function getAvailableActions(role, age = STATE.age, person = null) {
  const actionList = (role === 'Mother' || role === 'Father')
    ? PARENT_RELATIONSHIP_ACTIONS
    : (role === 'Brother' || role === 'Sister')
      ? SIBLING_RELATIONSHIP_ACTIONS
      : (role === 'Son' || role === 'Daughter')
        ? CHILD_RELATIONSHIP_ACTIONS
      : (role === 'Friend' || role === 'classmate')
        ? CLASSMATE_RELATIONSHIP_ACTIONS
        : [];
  return actionList.filter(a => {
    const minAge = a.minAge ?? 0;
    const maxAge = a.maxAge ?? Infinity;
    const isAdultFriendCarryOver = role === 'Friend'
      && age >= 18
      && a.id.endsWith('_older');
    if (!(minAge <= age && (isAdultFriendCarryOver || age <= maxAge))) return false;
    if (a.id === 'contribute_financially_young_adult') {
      const currentHome = typeof getCurrentHome === 'function' ? getCurrentHome() : null;
      if (currentHome?.source !== 'family') return false;
    }
    if (a.customType === 'sibling_help_kids' && !(person?.hasKids)) return false;
    if (a.customType === 'classmate_friend_request' && person?.status === 'friend') return false;
    return true;
  });
}

function triggerAction(actionId, personId, role) {
  const person = (role === 'Mother' || role === 'Father')
    ? getParentById(personId)
    : (role === 'Brother' || role === 'Sister')
      ? getSiblingById(personId)
      : (role === 'Son' || role === 'Daughter')
        ? getChildById(personId)
      : (role === 'Friend')
        ? STATE.school.classmates.find(c => c.id === personId) || getPersistentFriendById(personId)
      : (role === 'classmate')
        ? STATE.school.classmates.find(c => c.id === personId) || null
        : null;
  const action = getAvailableActions(role, STATE.age, person).find(a => a.id === actionId);
  if (!action) return;

  const minAge = action.minAge ?? 0;
  const maxAge = action.maxAge ?? Infinity;
  const isAdultFriendCarryOver = role === 'Friend'
    && STATE.age >= 18
    && action.id.endsWith('_older');
  if (STATE.age < minAge || (!isAdultFriendCarryOver && STATE.age > maxAge)) {
    console.warn(`Action ${actionId} not available at age ${STATE.age}`);
    return;
  }

  const result = (role === 'Mother' || role === 'Father')
    ? runParentRelationshipAction(action, person, role)
    : (role === 'Brother' || role === 'Sister')
      ? runSiblingRelationshipAction(action, person, role)
      : (role === 'Son' || role === 'Daughter')
        ? runChildRelationshipAction(action, person, role)
      : runClassmateRelationshipAction(action, person, role);
  if (!result.ok) return;
  if (person) markNpcInteraction(person);
  if (person?.status === 'friend') syncFriendSnapshot(person);
  if (!result.skipRefresh) {
    updateAllUI();
    renderFamilyTab();
  }
  if (!result.skipToast) {
    showToast(result.toast || `${action.name} ✓`);
  }
}

function requestMoneyFromParent(personId, role, amount) {
  const person = getParentById(personId);
  if (!person) return { ok:false, message:'Parent not found.' };
  markNpcInteraction(person, `Asked ${person.firstName} for money.`);

  const roundedAmount = Math.max(0, Math.min(10000, Math.round(Number(amount) || 0)));
  const moneyRequests = STATE.family.moneyRequests || (STATE.family.moneyRequests = { total:0, byParent:{} });
  moneyRequests.total += 1;
  moneyRequests.byParent[person.id] = (moneyRequests.byParent[person.id] || 0) + 1;

  if (moneyRequests.total > 3) {
    person.relationship = clamp((person.relationship ?? 60) - 15);
    syncSharedFamilyRelationshipFromParents();
    logActivity(diaryPlaceholderFor('ask_for_money_young_adult', role, 'deny_repeat'), -15);
    return { ok:true, approved:false, message:`${person.firstName} said no.` };
  }

  const traits = person.traits || [];
  const positiveTraitCount = traits.filter(tid => {
    const trait = PARENT_TRAITS_POOL.find(t => t.id === tid);
    return trait?.positive === true;
  }).length;

  let chance = roundedAmount <= 100 ? 0.9
    : roundedAmount <= 500 ? 0.72
    : roundedAmount <= 1000 ? 0.58
    : roundedAmount <= 3000 ? 0.4
    : roundedAmount <= 5000 ? 0.24
    : 0.1;

  const wealthBonus = {
    lower: -0.12,
    working: -0.08,
    middle: 0.02,
    upper_middle: 0.15,
    elite: 0.25,
  }[STATE.socialClass] || 0;
  chance += wealthBonus;
  if (isHighPayingParentJob(person.job)) chance += 0.12;
  if (traits.includes('supportive')) chance += 0.16;
  if (traits.includes('kind')) chance += 0.1;
  if (traits.includes('funny')) chance += 0.04;
  if (positiveTraitCount >= 2) chance += 0.08;
  if (traits.includes('distant')) chance -= 0.12;
  if (traits.includes('absent')) chance -= 0.2;
  if (traits.includes('strict')) chance -= 0.08;
  if (traits.includes('overbearing')) chance -= 0.08;
  if (roundedAmount > 5000) chance -= 0.15;
  chance = Math.max(0.02, Math.min(0.98, chance));

  if (roundedAmount > 3000 && Math.random() > chance) {
    person.relationship = clamp((person.relationship ?? 60) - 15);
    syncSharedFamilyRelationshipFromParents();
    logActivity(diaryPlaceholderFor('ask_for_money_young_adult', role, 'deny_too_much'), -15);
    return { ok:true, approved:false, message:`${person.firstName} said it was too much.` };
  }

  if (Math.random() <= chance) {
    applyEffects({ balance: roundedAmount });
    const successVariant = (roundedAmount <= 100 || traits.includes('supportive') || positiveTraitCount >= 2)
      ? 'success_easy'
      : 'success';
    logActivity(`${diaryPlaceholderFor('ask_for_money_young_adult', role, successVariant)} (£${roundedAmount})`, roundedAmount);
    return { ok:true, approved:true, message:`${person.firstName} gave you £${roundedAmount}.` };
  }

  person.relationship = clamp((person.relationship ?? 60) - 6);
  syncSharedFamilyRelationshipFromParents();
  logActivity(diaryPlaceholderFor('ask_for_money_young_adult', role, 'deny_generic'), -6);
  return { ok:true, approved:false, message:`${person.firstName} said no.` };
}


// ── CLASSMATE GENERATION ──────────────────────────────────
function generateClassmates(count=9) {
  const avgTarget = schoolAverageTarget();
  return Array.from({length:count}, () => {
    const g          = Math.random()>0.5?'male':'female';
    const gradeScore = clamp(Math.round(avgTarget + Math.floor(Math.random()*31) - 15), 10, 98);
    const traits     = sampleN(CLASSMATE_TRAITS_POOL, 2).map(t=>t.id);
    const classmate = {
      id:            uid(),
      firstName:     pickRandom(NAMES_UK[g]),
      surname:       pickRandom(NAMES_UK.surnames),
      gender:        g,
      emoji:         pickRandom(APPEARANCE_EMOJIS),
      appearance:    generateAppearance(g),
      gradeScore,
      grade:         gradeFromScore(gradeScore),
      smarts:        Math.floor(Math.random()*50)+30,
      socialStanding:Math.floor(Math.random()*80)+10,
      traits,
      compatibility: Math.floor(Math.random()*80)+10,
      relationship:  0,
      status:        'classmate',
    };
    classmate.npcStats = buildClassmateNpcStats(classmate);
    return classmate;
  });
}

function transitionSchool(newLevel) {
  const prev = STATE.school.classmates;
  const friends = prev.filter(c => c.status === 'friend');
  const others = prev.filter(c => c.status !== 'friend');
  const keepCount = Math.floor(prev.length * 0.7);
  const remainingSlots = Math.max(0, keepCount - friends.length);
  const keptOthers = [...others].sort(()=>Math.random()-0.5).slice(0, remainingSlots);
  const kept = [...friends, ...keptOthers];
  const newCount = Math.max(0, 9 - kept.length);
  STATE.school.classmates     = [...kept, ...generateClassmates(newCount)];
  STATE.school.level          = newLevel;
  STATE.school.current        = pickUKSchoolName(STATE.socialClass, newLevel === 'college' ? 'college' : 'secondary');
  STATE.school.rosterSnapshot = buildRosterSnapshot();
  STATE.school.teachers       = generateTeachers();
}

function finishSchool() {
  ensurePersistentFriendState();
  STATE.school.classmates
    .filter(classmate => classmate.status === 'friend')
    .forEach(upsertPersistentFriend);
  STATE.school.level = 'finished_school';
  STATE.school.current = 'School finished';
  STATE.school.classmates = [];
  STATE.school.vipIds = [];
  STATE.school.rosterSnapshot = [];
  STATE.school.teachers = [];
  STATE.school.postSchool = STATE.school.postSchool || { schoolFinishedShown:false, uniApplication:null };
  STATE.finances.income = 0;
  STATE.career = { job:'None', salary:0, level:0 };
}

function getUniversityCourseYears(course) {
  return {
    Law: 3,
    Medicine: 5,
    Business: 3,
    'Computer Science': 3,
    Art: 3,
    Education: 3,
    Engineering: 4,
    History: 3,
    Music: 3,
  }[course] || 3;
}

function maybeGraduateUniversity() {
  if (STATE.school.level !== 'uni') return false;
  const application = STATE.school.postSchool?.uniApplication;
  if (!application?.startedAge || !application?.course) return false;
  const graduationAge = application.startedAge + getUniversityCourseYears(application.course);
  if (STATE.age < graduationAge) return false;
  application.status = 'graduated';
  application.graduatedAge = STATE.age;
  application.degreeAwarded = application.course;
  STATE.school.level = 'graduated';
  STATE.school.current = `${application.course} graduate`;
  STATE.school.classmates = [];
  STATE.school.vipIds = [];
  STATE.school.rosterSnapshot = [];
  STATE.school.teachers = [];
  logActivity(`Graduated with a degree in ${application.course}.`, null);
  return true;
}

function startPrimarySchool() {
  STATE.school.level          = 'primary';
  STATE.school.current        = pickUKSchoolName(STATE.socialClass, 'primary');
  STATE.school.classmates     = generateClassmates(9);
  STATE.school.rosterSnapshot = buildRosterSnapshot();
  STATE.school.teachers       = generateTeachers();
}

function schoolAverageTarget() {
  const qualityMap = { lower:42, working:48, middle:58, upper_middle:70, elite:78 };
  const base = qualityMap[STATE.socialClass] || 50;
  const levelBoost = STATE.school.level === 'secondary' ? 3 : STATE.school.level === 'college' ? 6 : 0;
  return clamp(base + levelBoost, 25, 90);
}

function buildRosterSnapshot() {
  const all = [
    ...STATE.school.classmates,
    {
      id:         '__player__',
      firstName:  STATE.firstName,
      surname:    STATE.surname,
      appearance:  STATE.appearance,
      gradeScore: STATE.school.gradeScore,
      grade:      gradeFromScore(STATE.school.gradeScore),
      isPlayer:   true,
    }
  ];
  return all.sort((a,b)=>b.gradeScore-a.gradeScore);
}

function generateTeachers() {
  const subjects = ['English','Maths','Science','History','PE','Art','Music','Geography'];
  const titles = ['Mr','Mrs','Miss'];
  return sampleN(subjects,2).map(sub => {
    const title = pickRandom(titles);
    const gender = title === 'Mr' ? 'male' : 'female';
    const teacher = {
      id:         uid(),
      title,
      gender,
      firstName:  pickRandom(NAMES_UK[gender]),
      surname:    pickRandom(NAMES_UK.surnames),
      subject:    sub,
      emoji:      pickRandom(APPEARANCE_EMOJIS),
      strictness: Math.floor(Math.random()*80)+10,
      appearance: generateAppearance(gender),
    };
    teacher.npcStats = buildTeacherNpcStats(teacher);
    return teacher;
  });
}

// ── FRIENDSHIP SYSTEM ─────────────────────────────────────
function friendshipThreshold(classmate) {
  let base = 30;
  const playerTraits = STATE.traits;
  if (playerTraits.includes('charismatic')) base -= 10;
  if (playerTraits.includes('anxious'))     base += 15;
  if (playerTraits.includes('empathetic'))  base -= 5;
  if (STATE.age < 11) base -= 8;
  const negTraits = classmate.traits.filter(t => {
    const tr = CLASSMATE_TRAITS_POOL.find(x=>x.id===t);
    return tr && !tr.positive;
  });
  base += negTraits.length * 8;
  return Math.max(10, Math.min(60, base));
}

function tryMakeFriend(classmate) {
  ensureNpcCoreFields(classmate, { role: 'friend', socialGroup: STATE.school?.level === 'uni' ? 'university friend' : 'school friend' });
  const threshold   = friendshipThreshold(classmate);
  const relDelta    = classmate.relationship - threshold;
  let chance        = 80;
  const relBonus    = Math.floor(relDelta / 8);
  const compatBonus = Math.floor((classmate.compatibility - 50) / 10);
  const repBonus    = Math.floor((STATE.stats.rep || 0) / 20);
  chance += relBonus + compatBonus + repBonus;

  if (STATE.age < 11) chance += 12;
  if (STATE.age > 13) {
    const popularityDiff = (STATE.stats.popularity || 0) - (classmate.npcStats?.popularity || 50);
    chance += Math.floor(popularityDiff / 12);
  }
  if (STATE.social?.isBully) chance -= 12;
  if (STATE.traits.includes('charismatic')) chance += 5;
  if (STATE.traits.includes('empathetic')) chance += 4;
  if (STATE.traits.includes('anxious')) chance -= 6;

  classmate.traits.forEach(t => {
    const tr = CLASSMATE_TRAITS_POOL.find(x=>x.id===t);
    if (tr && !tr.positive) chance -= 4;
    if (tr && tr.positive) chance += 2;
  });
  chance = clamp(chance, 45, 95);

  if (Math.random()*100 < chance) {
    classmate.status = 'friend';
    markNpcInteraction(classmate, `Became friends with ${STATE.firstName}.`);
    upsertPersistentFriend(classmate);
    STATE.relationships.friends = clamp(STATE.relationships.friends + 10);
    logActivity(`Became friends with ${classmate.firstName}`, 10);
    return { ok:true, success:true, toast:`${classmate.firstName} said yes ✓` };
  }
  classmate.relationship = Math.max(0, classmate.relationship - 8);
  applyEffects({ rep:-2 });
  logActivity(`${classmate.firstName} turned down your friendship.`, -2);
  return { ok:true, success:false, toast:`${classmate.firstName} said no.` };
}

function maybeReceiveClassmateFriendRequest() {
  const candidates = STATE.school.classmates.filter(c => c.status === 'classmate' && c.relationship >= 70);
  if (!candidates.length) return;
  if (Math.random() > 0.25) return;
  const classmate = pickRandom(candidates);
  classmate.status = 'friend';
  ensureNpcCoreFields(classmate, { role: 'friend', socialGroup: STATE.school?.level === 'uni' ? 'university friend' : 'school friend' });
  markNpcInteraction(classmate, `${classmate.firstName} reached out to you.`);
  upsertPersistentFriend(classmate);
  STATE.relationships.friends = clamp(STATE.relationships.friends + 10);
  logActivity(`${classmate.firstName} asked to be your friend. You said yes.`, 10);
}

// ── ANNUAL TICK ───────────────────────────────────────────
function annualTick() {
  ensureNpcSystemState();
  STATE.finances.balance += (STATE.finances.income - STATE.finances.expenses);

  if (typeof runAnnualHomeTick === 'function') runAnnualHomeTick();

  if (STATE.age > 40) STATE.stats.looks  = clamp(STATE.stats.looks  - 1);
  if (STATE.age > 60) STATE.stats.health = clamp(STATE.stats.health - 2);

  if (STATE.age === 5  && STATE.school.level==='pre')       startPrimarySchool();
  if (STATE.age === 12 && STATE.school.level==='primary')   transitionSchool('secondary');
  if (STATE.age === 17 && STATE.school.level==='secondary') transitionSchool('college');
  if (STATE.age === 18 && STATE.school.level==='college')   finishSchool();
  if (STATE.age >= 18 && !STATE.school.postSchool) STATE.school.postSchool = { schoolFinishedShown:false, uniApplication:null };
  maybeGraduateUniversity();
  if (typeof maybeCompleteFurtherEducationYear === 'function') maybeCompleteFurtherEducationYear();

  if (STATE.career?.job && STATE.career.job !== 'None' && STATE.career.work) {
    const work = STATE.career.work;
    work.performance = clamp(work.performance + Math.floor(Math.random() * 5) - 2);
    work.stress = clamp(work.stress + Math.floor(Math.random() * 7) - 3);
    work.reputation = clamp(work.reputation + Math.floor(Math.random() * 5) - 2);
    work.satisfaction = clamp(work.satisfaction + Math.floor(Math.random() * 7) - 3);
    work.energy = clamp((work.energy || 60) - 8 + Math.floor(Math.random() * 7));

    if (work.stress >= 82) {
      STATE.stats.health = clamp(STATE.stats.health - 2);
      STATE.stats.happy = clamp(STATE.stats.happy - 3);
    }
    if (work.satisfaction <= 28) {
      STATE.stats.happy = clamp(STATE.stats.happy - 2);
    }
    if (work.performance >= 78) {
      STATE.stats.rep = clampRep((STATE.stats.rep || 0) + 2);
    }
    if (work.energy <= 20) {
      STATE.stats.health = clamp(STATE.stats.health - 1);
      STATE.stats.happy = clamp(STATE.stats.happy - 2);
    }
  }
  if (typeof applyAnnualLegalCareerProgression === 'function') applyAnnualLegalCareerProgression();

  STATE.annualGradeGain  = 0;
  STATE.annualStudyCount = 0;

  STATE.family.pets.forEach(pet => {
    pet.age++;
    if (!pet.fedThisYear) pet.happiness = clamp(pet.happiness - 5);
    pet.fedThisYear = false;
    if (pet.age >= pet.deathAge && !pet.dead) {
      pet.dead = true;
      logActivity(`${pet.name} passed away 🌈`, -10);
      applyEffects({ happy: -10 });
    }
  });

  STATE.family.siblings.forEach(sibling => ageNpcOneYear(sibling, { role: 'sibling' }));
  ageNpcOneYear(STATE.family.mum, { role: 'parent' });
  ageNpcOneYear(STATE.family.dad, { role: 'parent' });
  ageRelationshipNetworkOneYear();
  ensureNpcSystemState();

  const bornNow = [];
  STATE.family.pendingSiblings = (STATE.family.pendingSiblings || []).filter(s => {
    if (s.dueAge !== STATE.age) return true;
    const sibling = buildSiblingObject(
      s,
      STATE.surname,
      STATE.family.mum.appearance,
      STATE.family.dad.appearance,
      0
    );
    STATE.family.siblings.push(sibling);
    if (s.familyStatus) STATE.family.maritalStatus = s.familyStatus;
    bornNow.push(sibling);
    return false;
  });
  bornNow.forEach(s => {
    const type = s.siblingType === 'half' ? 'half-sibling' : 'sibling';
    logActivity(`${s.firstName} was born. You have a new ${type}.`, null);
  });

  if (STATE.age === 8 && (STATE.revealedTraitCount || 1) < 2) {
    STATE.revealedTraitCount = 2;
    logActivity('You understood another part of yourself.', null);
  }
  if (STATE.age === 16 && (STATE.revealedTraitCount || 1) < 3) {
    STATE.revealedTraitCount = 3;
    logActivity('Your final hidden trait became clear.', null);
  }

  checkScholarship();
  maybeReceiveClassmateFriendRequest();

  if (STATE.school.classmates.length) {
    STATE.school.rosterSnapshot = buildRosterSnapshot();
  }

  runAnnualNpcLifeProgression();
  runAnnualRomanceProgression();

  if (STATE.stats.health<=0 || STATE.age>=STATE.deathAge) return false;
  return true;
}

// ── SCHOLARSHIP / PRIVATE SCHOOL CHECK ───────────────────
function checkScholarship() {
  const grade = gradeFromScore(STATE.school.gradeScore);

  if (STATE.age === 11 && !STATE.school._privateSchoolChecked) {
    STATE.school._privateSchoolChecked = true;
    if (!isAlreadyPrivateTrack() && (grade === 'A+' || grade === 'A') && Math.random() < getPrivateSchoolOfferChance()) {
      STATE.school._privateSchoolEligible = true;
    }
  }

  if (STATE.age === 12 && STATE.school._appliedPrivate && !STATE.school._privateResolved) {
    STATE.school._privateResolved = true;
    if (STATE.school._appliedScholarship) {
      STATE.school._scholarshipWon = Math.random() < getScholarshipChance();
    } else {
      STATE.school._privateAccepted = Math.random() < getPrivateSchoolAcceptanceChance();
      STATE.school._privateRejected = !STATE.school._privateAccepted;
    }
  }
}

// ── EVENT WEIGHT SYSTEM ───────────────────────────────────
function getEventWeight(event) {
  let weight = 1;
  if (!event.traitTags) return weight;
  STATE.traits.forEach(traitId => {
    const trait = PLAYER_TRAITS_POOL.find(t=>t.id===traitId);
    if (!trait) return;
    event.traitTags.forEach(tag => {
      if (trait.weights[tag]) weight *= trait.weights[tag];
    });
  });
  return weight;
}

// ── EVENT PICKER ──────────────────────────────────────────
function pickEvent() {
  const priority = ['private_school_offer','private_school_result','scholarship_result'];

  const story = EVENTS.filter(e => {
    if (e.type !== 'story') return false;
    if (STATE.age < e.minAge || STATE.age > e.maxAge) return false;
    if (STATE.usedEvents.includes(e.id)) return false;
    if (e.id === 'private_school_offer' && (!STATE.school._privateSchoolEligible || isAlreadyPrivateTrack())) return false;
    if (e.id === 'private_school_result' && (!STATE.school._appliedPrivate || STATE.school._appliedScholarship || !STATE.school._privateResolved)) return false;
    if (e.id === 'scholarship_result' && (!STATE.school._appliedScholarship || !STATE.school._privateResolved)) return false;
    return true;
  });

  // Priority events always fire first
  const priorityEvent = story.find(e => priority.includes(e.id));
  if (priorityEvent) return priorityEvent;

  const random = EVENTS.filter(e => e.type==='random' && STATE.age>=e.minAge && STATE.age<=e.maxAge && !STATE.usedEvents.includes(e.id));

  if (story.length) {
    const weights = story.map(e => getEventWeight(e));
    return weightedRandom(story.map((e,i) => ({...e, weight:weights[i]})));
  }
  if (random.length && Math.random()<0.35) {
    const weights = random.map(e => getEventWeight(e));
    return weightedRandom(random.map((e,i) => ({...e, weight:weights[i]})));
  }
  return null;
}

// ── MILESTONE CHECK ───────────────────────────────────────
function checkMilestone() {
  const m = MILESTONES.find(m => m.age===STATE.age && !STATE.shownMilestones.includes(m.age));
  if (m) { STATE.shownMilestones.push(m.age); return m; }
  return null;
}
