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

  const mumJob    = pickRandom(PARENT_JOBS[socialClass]);
  const dadJob    = pickRandom(PARENT_JOBS[socialClass]);
  const mumTraits = sampleN(PARENT_TRAITS_POOL, 2).map(t => t.id);
  const dadTraits = sampleN(PARENT_TRAITS_POOL, 2).map(t => t.id);

  const siblingObjects = (siblings||[]).map(s => ({
    id:           uid(),
    firstName:    s.name,
    surname,
    gender:       s.gender,
    age:          Math.floor(Math.random()*10) - 3,
    emoji:        pickRandom(APPEARANCE_EMOJIS),
    relationship: Math.floor(Math.random()*30)+50,
  }));

  STATE = {
    gender, firstName, surname, fullName:`${firstName} ${surname}`,
    birthday, starSign, city, socialClass, socialClassLabel: sc.label,
    traits, appearance: generateAppearance(gender),

    age:      0,
    deathAge: Math.floor(Math.random()*20)+72,

    stats: {
      happy:  Math.floor(Math.random()*20)+55,
      health: Math.floor(Math.random()*20)+60,
      smarts: traits.includes('intelligent') ? Math.floor(Math.random()*30)+70 : Math.floor(Math.random()*20)+40,
      looks:  Math.floor(Math.random()*20)+40,
      rep:    Math.floor(Math.random()*10)+45,
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
      mum: { id:uid(), firstName:mumName, surname, gender:'female', age:Math.floor(Math.random()*10)+28, emoji:pickRandom(APPEARANCE_EMOJIS), job:mumJob, traits:mumTraits, relationship:70, alive:true },
      dad: { id:uid(), firstName:dadName, surname, gender:'male',   age:Math.floor(Math.random()*10)+28, emoji:pickRandom(APPEARANCE_EMOJIS), job:dadJob, traits:dadTraits, relationship:65, alive:true },
      siblings: siblingObjects,
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

    usedEvents:       [],
    shownMilestones:  [],
    actionCooldowns:  {},
    activity:         [],
    lastScore:        null,
    pendingMilestone: null,
    annualGradeGain:  0,
    annualStudyCount: 0,
  };

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
function fmtMoney(v) {
  if (v>=1000000) return `£${(v/1000000).toFixed(1)}m`;
  if (v>=1000)    return `£${(v/1000).toFixed(0)}k`;
  if (v<0)        return `-£${Math.abs(v)}`;
  return `£${v}`;
}
function getStage(age) { return LIFE_STAGES.find(s=>age<=s.maxAge); }
function uid() { return Math.random().toString(36).slice(2,8); }

function applyEffects(effects) {
  if (!effects) return;
  Object.entries(effects).forEach(([k,v]) => {
    if      (k==='balance')     STATE.finances.balance     += v;
    else if (k==='income')      STATE.finances.income      += v;
    else if (k==='expenses')    STATE.finances.expenses    += v;
    else if (k==='rep')         STATE.stats.rep             = clamp(STATE.stats.rep+v);
    else if (k==='gradeScore')  STATE.school.gradeScore     = clamp(STATE.school.gradeScore+v,0,100);
    else if (k==='rel_family')  STATE.relationships.family  = clamp(STATE.relationships.family+v);
    else if (k==='rel_friends') STATE.relationships.friends = clamp(STATE.relationships.friends+v);
    else if (k==='rel_partner') STATE.relationships.partner = clamp(STATE.relationships.partner+v);
    else if (STATE.stats[k]!==undefined) STATE.stats[k]    = clamp(STATE.stats[k]+v);
  });
}

function logActivity(text, delta) {
  STATE.activity.unshift({ text, delta, age: STATE.age });
  if (STATE.activity.length > 50) STATE.activity.pop();
}

// ── CLASSMATE GENERATION ──────────────────────────────────
function generateClassmates(count=9) {
  return Array.from({length:count}, () => {
    const g          = Math.random()>0.5?'male':'female';
    const gradeScore = Math.floor(Math.random()*70)+15;
    const traits     = sampleN(CLASSMATE_TRAITS_POOL, 2).map(t=>t.id);
    return {
      id:            uid(),
      firstName:     pickRandom(NAMES_UK[g]),
      surname:       pickRandom(NAMES_UK.surnames),
      gender:        g,
      emoji:         pickRandom(APPEARANCE_EMOJIS),
      gradeScore,
      grade:         gradeFromScore(gradeScore),
      smarts:        Math.floor(Math.random()*50)+30,
      socialStanding:Math.floor(Math.random()*80)+10,
      traits,
      compatibility: Math.floor(Math.random()*80)+10,
      relationship:  0,
      status:        'classmate',
    };
  });
}

function transitionSchool(newLevel) {
  const prev      = STATE.school.classmates;
  const keepCount = Math.floor(prev.length * 0.7);
  const kept      = [...prev].sort(()=>Math.random()-0.5).slice(0, keepCount);
  const newCount  = 9 - kept.length;
  STATE.school.classmates     = [...kept, ...generateClassmates(newCount)];
  STATE.school.level          = newLevel;
  STATE.school.rosterSnapshot = buildRosterSnapshot();
  STATE.school.teachers       = generateTeachers();
}

function startPrimarySchool() {
  STATE.school.level          = 'primary';
  STATE.school.current        = STATE.school.type.primary;
  STATE.school.classmates     = generateClassmates(9);
  STATE.school.rosterSnapshot = buildRosterSnapshot();
  STATE.school.teachers       = generateTeachers();
}

function buildRosterSnapshot() {
  const all = [
    ...STATE.school.classmates,
    {
      id:         '__player__',
      firstName:  STATE.firstName,
      surname:    STATE.surname,
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
  return sampleN(subjects,2).map(sub => ({
    id:         uid(),
    title:      pickRandom(titles),
    surname:    pickRandom(NAMES_UK.surnames),
    subject:    sub,
    emoji:      pickRandom(APPEARANCE_EMOJIS),
    strictness: Math.floor(Math.random()*80)+10,
  }));
}

// ── FRIENDSHIP SYSTEM ─────────────────────────────────────
function friendshipThreshold(classmate) {
  let base = 30;
  const playerTraits = STATE.traits;
  if (playerTraits.includes('charismatic')) base -= 10;
  if (playerTraits.includes('anxious'))     base += 15;
  if (playerTraits.includes('empathetic'))  base -= 5;
  const negTraits = classmate.traits.filter(t => {
    const tr = CLASSMATE_TRAITS_POOL.find(x=>x.id===t);
    return tr && !tr.positive;
  });
  base += negTraits.length * 8;
  return Math.max(10, Math.min(60, base));
}

function tryMakeFriend(classmate) {
  const threshold = friendshipThreshold(classmate);
  if (classmate.relationship < threshold) return { success:false, reason:`You're not close enough yet. (${classmate.relationship}/${threshold} needed)` };

  const base        = 60;
  const relBonus    = Math.floor((classmate.relationship - threshold) / 2);
  const compatBonus = Math.floor(classmate.compatibility / 5);
  let chance        = base + relBonus + compatBonus;

  classmate.traits.forEach(t => {
    const tr = CLASSMATE_TRAITS_POOL.find(x=>x.id===t);
    if (tr && !tr.positive) chance -= 15;
  });
  chance = clamp(chance, 10, 95);

  if (Math.random()*100 < chance) {
    classmate.status = 'friend';
    STATE.relationships.friends = clamp(STATE.relationships.friends + 10);
    logActivity(`Became friends with ${classmate.firstName}`, 10);
    return { success:true };
  }
  classmate.relationship = Math.max(0, classmate.relationship - 8);
  return { success:false, reason:`${classmate.firstName} wasn't ready for that.` };
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

  checkScholarship();

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
    if (e.id === 'private_school_result' && (!STATE.school._privateAccepted || STATE.school._appliedScholarship)) return false;
    if (e.id === 'scholarship_result' && !STATE.school._scholarshipWon) return false;
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