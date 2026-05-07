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

// ── SCHOOL TYPES ──────────────────────────────────────────
const SCHOOL_TYPES = {
  lower:        { primary:'State Primary',     secondary:'State Secondary', college:'State Sixth Form'   },
  working:      { primary:'State Primary',     secondary:'State Secondary', college:'State Sixth Form'   },
  middle:       { primary:'State Primary',     secondary:'Grammar School',  college:'Grammar Sixth Form' },
  upper_middle: { primary:'Prep School',       secondary:'Private School',  college:'Private Sixth Form' },
  elite:        { primary:'Elite Prep School', secondary:'Boarding School', college:'Elite Sixth Form'   },
};

const SCHOOL_NAMES = {
  state_primary:   ['Meadowbrook Primary','St. Anne\'s C of E Primary','Riverside Primary','Oakfield Primary','Greenway Primary','St. Joseph\'s Catholic Primary','Hillside Primary','Elm Tree Primary'],
  state_secondary: ['Northgate Academy','Riverside Community School','Hillcrest Secondary','St. George\'s Academy','Parkview School','Ashford Academy','Westfield School','Brookside Community College'],
  grammar:         ['King Edward\'s Grammar School','The Grammar School at Leeds','Highgate Grammar','Westbourne Grammar','St. Catherine\'s Grammar','Thornton Grammar School'],
  prep:            ['Kingsmead Prep','Ashdown House','St. Michael\'s Prep','Hillgrove Preparatory School','Fairfield Prep','Elmswood Prep'],
  private:         ['Harlington College','St. Bartholomew\'s School','Westbrook Academy','Elmhurst School','Cavendish College','Ashbury Independent School'],
  boarding:        ['Kingsford College','Ashfield House','Marlowe College','St. Edward\'s School','Thornton Hall','Eastbourne College'],
  sixth_form:      ['Northgate Sixth Form','City College','Westfield Sixth Form Centre','Ashford College','Riverside Sixth Form'],
  elite_prep:      ['Whitmore House','St. Crispin\'s Prep','Belmont Hill Prep','Kensington Prep'],
  elite_sixth:     ['Westminster Sixth Form','Harlington Upper School','St. Paul\'s Sixth Form'],
};

function pickSchoolName(socialClass, level) {
  const map = {
    lower:        { primary:'state_primary', secondary:'state_secondary', college:'sixth_form' },
    working:      { primary:'state_primary', secondary:'state_secondary', college:'sixth_form' },
    middle:       { primary:'state_primary', secondary:'grammar',         college:'sixth_form' },
    upper_middle: { primary:'prep',          secondary:'private',         college:'sixth_form' },
    elite:        { primary:'elite_prep',    secondary:'boarding',        college:'elite_sixth' },
  };
  const pool = SCHOOL_NAMES[(map[socialClass]||map['working'])[level]];
  return pickRandom(pool || ['School']);
}

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
  { age:18, title:"You're an adult.",               body:"Legally, at least. The world expects things of you now.", emoji:'🎓', unlocks:['full_finances','move_out'] },
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

// ── STATE ─────────────────────────────────────────────────
let STATE = null;

function createNewLife(opts) {
  const {gender,firstName,surname,birthday,city,socialClass,traits,situation,mumName,dadName,siblings} = opts;
  const sc         = SOCIAL_CLASSES.find(c => c.id === socialClass);
  const starSign   = getStarSign(birthday.day, birthday.month);
  const schoolType = SCHOOL_TYPES[socialClass] || SCHOOL_TYPES['working'];

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
      current:            pickSchoolName(socialClass, 'primary'),
      type:               schoolType,
      level:              'pre',
      gradeScore:         traits.includes('intelligent') ? Math.floor(Math.random()*15)+75 : Math.floor(Math.random()*20)+45,
      classmates:         [],
      rosterSnapshot:     [],
      teachers:           [],
      scholarshipOffered: false,
      scholarshipSchool:  null,
    },

    career: { job:'None', salary:0, level:0 },
    sexuality: opts.sexuality || 'heterosexual',
    sexualityConfirmed: false,
    social: { bullyCount:0, isBully:false },

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
    else if (k==='rel_partner') STATE.relationships.partner = clamp(STATE.relationships.partner+v);
    else if (STATE.stats[k]!==undefined) STATE.stats[k]    = clamp(STATE.stats[k]+v);
  });
}

function logActivity(text, delta) {
  STATE.activity.unshift({ text, delta, age: STATE.age });
  if (STATE.activity.length > 50) STATE.activity.pop();
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

  if (action.id === 'ask_for_money_young_adult') {
    openMoneyRequestOverlay(person.id, role);
    return { ok:true, skipRefresh:true, skipToast:true };
  }

  if (action.customType === 'coming_soon_parent_action') {
    return { ok:true, toast:'COMING SOON' };
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
  logActivity(`${action.name} with ${person.firstName}`, delta);
  return { ok:true, toast:`${action.name} with ${person.firstName} ✓` };
}

function getAvailableActions(role, age = STATE.age, person = null) {
  const actionList = (role === 'Mother' || role === 'Father')
    ? PARENT_RELATIONSHIP_ACTIONS
    : (role === 'Brother' || role === 'Sister')
      ? SIBLING_RELATIONSHIP_ACTIONS
      : (role === 'Friend' || role === 'classmate')
        ? CLASSMATE_RELATIONSHIP_ACTIONS
        : [];
  return actionList.filter(a => {
    const minAge = a.minAge ?? 0;
    const maxAge = a.maxAge ?? Infinity;
    if (!(minAge <= age && age <= maxAge)) return false;
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
      : (role === 'Friend' || role === 'classmate')
        ? STATE.school.classmates.find(c => c.id === personId) || null
        : null;
  const action = getAvailableActions(role, STATE.age, person).find(a => a.id === actionId);
  if (!action) return;

  const minAge = action.minAge ?? 0;
  const maxAge = action.maxAge ?? Infinity;
  if (STATE.age < minAge || STATE.age > maxAge) {
    console.warn(`Action ${actionId} not available at age ${STATE.age}`);
    return;
  }

  const result = (role === 'Mother' || role === 'Father')
    ? runParentRelationshipAction(action, person, role)
    : (role === 'Brother' || role === 'Sister')
      ? runSiblingRelationshipAction(action, person, role)
      : runClassmateRelationshipAction(action, person, role);
  if (!result.ok) return;
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
  STATE.school.current        = pickSchoolName(STATE.socialClass, newLevel === 'college' ? 'college' : 'secondary');
  STATE.school.rosterSnapshot = buildRosterSnapshot();
  STATE.school.teachers       = generateTeachers();
}

function startPrimarySchool() {
  STATE.school.level          = 'primary';
  STATE.school.current        = pickSchoolName(STATE.socialClass, 'primary');
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
  const threshold = friendshipThreshold(classmate);
  if (classmate.relationship < threshold) {
    applyEffects({ rep:-1 });
    logActivity(`Tried to befriend ${classmate.firstName}, but it was too soon.`, -1);
    return { ok:true, success:false, toast:`Not close enough yet. (${classmate.relationship}/${threshold})` };
  }

  let base          = 50;
  const relBonus    = Math.floor((classmate.relationship - threshold) / 2);
  const compatBonus = Math.floor(classmate.compatibility / 5);
  const repBonus    = Math.floor((STATE.stats.rep || 0) / 8);
  let chance        = base + relBonus + compatBonus + repBonus;

  if (STATE.age < 11) chance += 12;
  if (STATE.age > 13) {
    const popularityDiff = (STATE.stats.popularity || 0) - (classmate.npcStats?.popularity || 50);
    chance += Math.floor(popularityDiff / 6);
  }
  if (STATE.social?.isBully) chance -= 18;
  if (STATE.traits.includes('charismatic')) chance += 8;
  if (STATE.traits.includes('empathetic')) chance += 5;
  if (STATE.traits.includes('anxious')) chance -= 8;

  classmate.traits.forEach(t => {
    const tr = CLASSMATE_TRAITS_POOL.find(x=>x.id===t);
    if (tr && !tr.positive) chance -= 10;
    if (tr && tr.positive) chance += 5;
  });
  chance = clamp(chance, 10, 95);

  if (Math.random()*100 < chance) {
    classmate.status = 'friend';
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
  STATE.relationships.friends = clamp(STATE.relationships.friends + 10);
  logActivity(`${classmate.firstName} asked to be your friend. You said yes.`, 10);
}

// ── ANNUAL TICK ───────────────────────────────────────────
function annualTick() {
  STATE.finances.balance += (STATE.finances.income - STATE.finances.expenses);

  if (STATE.age > 40) STATE.stats.looks  = clamp(STATE.stats.looks  - 1);
  if (STATE.age > 60) STATE.stats.health = clamp(STATE.stats.health - 2);

  if (STATE.age === 5  && STATE.school.level==='pre')       startPrimarySchool();
  if (STATE.age === 12 && STATE.school.level==='primary')   transitionSchool('secondary');
  if (STATE.age === 17 && STATE.school.level==='secondary') transitionSchool('college');

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

  STATE.family.siblings.forEach(s => s.age++);
  STATE.family.mum.age++;
  STATE.family.dad.age++;

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

  if (STATE.stats.health<=0 || STATE.age>=STATE.deathAge) return false;
  return true;
}

// ── SCHOLARSHIP / PRIVATE SCHOOL CHECK ───────────────────
function checkScholarship() {
  const grade = gradeFromScore(STATE.school.gradeScore);

  if (STATE.age === 11 && !STATE.school._privateSchoolChecked) {
    STATE.school._privateSchoolChecked = true;
    if ((grade === 'A+' || grade === 'A') && Math.random() < 0.7) {
      STATE.school._privateSchoolEligible = true;
    }
  }

  if (STATE.age === 12 && STATE.school._appliedPrivate && !STATE.school._privateResolved) {
    STATE.school._privateResolved = true;
    if (STATE.school._appliedScholarship) {
      STATE.school._scholarshipWon = Math.random() < 0.3;
    } else {
      STATE.school._privateAccepted = Math.random() < 0.6;
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
    if (e.id === 'private_school_offer' && !STATE.school._privateSchoolEligible) return false;
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
