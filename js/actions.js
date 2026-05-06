// ═══════════════════════════════════════════════════════════
// ACTIONS.JS
// ═══════════════════════════════════════════════════════════

const ACTIONS = {
  smarts: [
    { id:'library',       icon:'📚', name:'Study at the library',      desc:'A few focused hours with the right books.',      cost:0,     effects:{ smarts:+3 },               cooldown:0, minAge:5  },
    { id:'read_book',     icon:'📖', name:'Buy a book',                desc:'Knowledge compounds.',                           cost:-8,    effects:{ smarts:+2 },               cooldown:0, minAge:5  },
    { id:'ask_parent_h',  icon:'🏠', name:'Ask a parent for help',     desc:'They know more than you think.',                 cost:0,     effects:{ smarts:+2, rel_family:+5 }, cooldown:1, minAge:5, maxAge:17 },
    { id:'study_group',   icon:'👥', name:'Start a study group',       desc:'Learn together, grow together.',                 cost:0,     effects:{ smarts:+4, rel_friends:+5 },cooldown:1, minAge:8  },
    { id:'tutor', isStudy:true, icon:'👩‍🏫', name:'Hire a tutor',              desc:'Targeted, focused improvement.',                 cost:-200,  effects:{ smarts:+8, gradeScore:+8 }, cooldown:1, minAge:8  },
    { id:'online_course', icon:'💻', name:'Take an online course',     desc:'Learn anything, from anywhere.',                 cost:-50,   effects:{ smarts:+6 },               cooldown:1, minAge:16 },
    { id:'masters',       icon:'🎓', name:'Study for a Masters',       desc:'The next level.',                                cost:-12000,effects:{ smarts:+20, rep:+10 },      cooldown:0, minAge:21 },
  ],
  looks: [
    { id:'clothes_kid',   icon:'👕', name:'Ask for new clothes',       desc:'A fresh outfit.',                                cost:-30,   effects:{ looks:+2 },                cooldown:1, minAge:5, maxAge:11 },
    { id:'haircut_teen',  icon:'✂️', name:'Try a new hairstyle',       desc:'First impressions at school.',                  cost:-15,   effects:{ looks:+3, happy:+2 },       cooldown:1, minAge:10, maxAge:17 },
    { id:'gym',           icon:'🏋️', name:'Join a gym',               desc:'Consistency is everything.',                     cost:-40,   effects:{ looks:+3, health:+2 },      cooldown:0, minAge:16 },
    { id:'clothes_adult', icon:'👗', name:'Buy new clothes',           desc:'Dress how you want to feel.',                   cost:-150,  effects:{ looks:+4 },                cooldown:1, minAge:16 },
    { id:'haircut_adult', icon:'✂️', name:'Get a proper haircut',      desc:'Worth every penny.',                             cost:-40,   effects:{ looks:+2 },                cooldown:1, minAge:16 },
    { id:'skincare',      icon:'🧴', name:'Start a skincare routine',  desc:'Long-term investment.',                          cost:-25,   effects:{ looks:+2 },                cooldown:0, minAge:14 },
    { id:'pt',            icon:'💪', name:'Hire a personal trainer',   desc:'Structured, fast results.',                      cost:-800,  effects:{ looks:+8, health:+5 },      cooldown:1, minAge:18 },
    { id:'cosmetic',      icon:'💉', name:'Cosmetic procedure',        desc:'A significant decision.',                        cost:-3000, effects:{ looks:+12 },               cooldown:3, minAge:21 },
  ],
  health: [
    { id:'play_outside',  icon:'🌳', name:'Play outside',              desc:'Fresh air and running around.',                  cost:0,     effects:{ health:+3, happy:+2 },      cooldown:0, minAge:3, maxAge:11 },
    { id:'sport_school',  icon:'⚽', name:'Join a school sports team', desc:'Teamwork and fitness.',                          cost:0,     effects:{ health:+4, rep:+3, rel_friends:+5 }, cooldown:1, minAge:6, maxAge:17 },
    { id:'run',           icon:'🏃', name:'Go for a run',              desc:'Simple, free, effective.',                       cost:0,     effects:{ health:+3, happy:+2 },      cooldown:0, minAge:12 },
    { id:'cook',          icon:'🥗', name:'Cook healthy meals',        desc:'You are what you eat.',                          cost:-30,   effects:{ health:+3 },               cooldown:0, minAge:16 },
    { id:'doctor',        icon:'🩺', name:'See a doctor',              desc:'Stay on top of things.',                         cost:0,     effects:{ health:+3 },               cooldown:1, minAge:18 },
    { id:'therapist',     icon:'🛋️', name:'See a therapist',           desc:'Mental health is health.',                       cost:-150,  effects:{ happy:+6, health:+2 },      cooldown:1, minAge:16 },
    { id:'quit_habit',    icon:'🚭', name:'Quit a bad habit',          desc:'Harder than it sounds. Worth it.',               cost:0,     effects:{ health:+8, happy:+4 },      cooldown:0, minAge:16 },
  ],
  happy: [
    { id:'play_friend_k', icon:'👫', name:'Have a friend over',        desc:'Simple joys.',                                   cost:0,     effects:{ happy:+6, rel_friends:+8 }, cooldown:0, minAge:4, maxAge:11 },
    { id:'hobby',         icon:'🎨', name:'Start a hobby',             desc:'Find what makes you lose track of time.',        cost:-20,   effects:{ happy:+5, smarts:+2 },      cooldown:0, minAge:5  },
    { id:'call_friend',   icon:'📞', name:'Call a friend',             desc:'Connection is everything.',                      cost:0,     effects:{ happy:+5, rel_friends:+5 }, cooldown:0, minAge:12 },
    { id:'date',          icon:'💑', name:'Go on a date',              desc:'Put yourself out there.',                        cost:-80,   effects:{ happy:+8, rel_partner:+10 },cooldown:1, minAge:16 },
    { id:'holiday',       icon:'✈️', name:'Take a holiday',            desc:'You need it more than you think.',               cost:-800,  effects:{ happy:+12, health:+3 },     cooldown:1, minAge:18 },
    { id:'journal',       icon:'📓', name:'Start journalling',         desc:'Clarity costs nothing.',                         cost:0,     effects:{ happy:+3, smarts:+1 },      cooldown:0, minAge:10 },
    { id:'family_time',   icon:'🏡', name:'Spend time with family',    desc:'Easy to take for granted.',                      cost:0,     effects:{ happy:+5, rel_family:+8 },  cooldown:0, minAge:0  },
  ],
  rep: [
    { id:'volunteer',     icon:'🤝', name:'Volunteer',                 desc:'Give something back.',                           cost:0,     effects:{ rep:+6, happy:+3 },         cooldown:1, minAge:14 },
    { id:'community',     icon:'🏘️', name:'Attend a community event', desc:'Show your face around town.',                    cost:0,     effects:{ rep:+4 },                  cooldown:1, minAge:16 },
    { id:'apologise',     icon:'🙏', name:'Apologise to someone',      desc:'Takes guts. Worth it.',                          cost:0,     effects:{ rep:+5, happy:+3 },         cooldown:1, minAge:8  },
    { id:'charity',       icon:'💝', name:'Donate to charity',         desc:'Small acts matter.',                             cost:-100,  effects:{ rep:+5, happy:+4 },         cooldown:0, minAge:18 },
    { id:'public_speak',  icon:'🎤', name:'Give a talk or presentation',desc:'Visibility builds reputation.',                 cost:0,     effects:{ rep:+8, smarts:+3 },        cooldown:1, minAge:16 },
  ],
};

const FAMILY_ACTIONS = [
  { id:'fam_dinner',    icon:'🍽️', name:'Family dinner',              desc:'Simple, but it matters.',                        cost:0,     effects:{ happy:+4, rel_family:+8 },  cooldown:0, minAge:0, maxAge:17 },
  { id:'talk_mum',      icon:'👩', name:'Talk to your mum',           desc:'She worries. Let her in.',                        cost:0,     effects:{ happy:+4, rel_family:+6 },  cooldown:0, minAge:5  },
  { id:'talk_dad',      icon:'👨', name:'Talk to your dad',           desc:'Not always easy. Worth doing.',                  cost:0,     effects:{ happy:+3, rel_family:+5 },  cooldown:0, minAge:5  },
  { id:'call_family',   icon:'📞', name:'Call the family',            desc:'You don\'t do it enough.',                       cost:0,     effects:{ happy:+5, rel_family:+8 },  cooldown:0, minAge:18 },
  { id:'visit_family',  icon:'🏡', name:'Visit home',                 desc:'Some things only exist there.',                  cost:-50,   effects:{ happy:+8, rel_family:+12 }, cooldown:1, minAge:18 },
  { id:'meet_friends',  icon:'👥', name:'Meet up with friends',       desc:'Connection is everything.',                      cost:-40,   effects:{ happy:+8, rel_friends:+10 },cooldown:0, minAge:10 },
  { id:'make_friends',  icon:'👋', name:'Put yourself out there',     desc:'New people, new possibilities.',                 cost:0,     effects:{ rel_friends:+8, happy:+3 }, cooldown:1, minAge:5  },
  { id:'date_action',   icon:'💑', name:'Go on a date',               desc:'See where it goes.',                             cost:-80,   effects:{ happy:+8, rel_partner:+12 },cooldown:1, minAge:16 },
];

const PET_ACTIONS = [
  { id:'walk_pet',      icon:'🦮', name:'Walk the dog',               desc:'They live for this.',                            cost:0,     effects:{ happy:+3, health:+2 },      cooldown:0 },
  { id:'play_pet',      icon:'🎾', name:'Play with your pet',         desc:'Pure joy.',                                      cost:0,     effects:{ happy:+4 },                cooldown:0 },
  { id:'vet',           icon:'🏥', name:'Take to the vet',            desc:'Keep them healthy.',                             cost:-80,   effects:{ happy:+2 },                cooldown:1 },
  { id:'pet_toys',      icon:'🧸', name:'Buy new toys',               desc:'They deserve it.',                               cost:-30,   effects:{ happy:+3 },                cooldown:1 },
];

const EDUCATION_ACTIONS = [
  { id:'extra_study',  isStudy:true, icon:'📚', name:'Study harder',          desc:'Push your grades up.',      cost:0,    effects:{ smarts:+3, gradeScore:+5 }, cooldown:0, minAge:5,  maxAge:18 },
  { id:'school_club',               icon:'🎭', name:'Join a school club',     desc:'Extracurriculars look good.',cost:0,    effects:{ rep:+3, rel_friends:+5 },   cooldown:1, minAge:8,  maxAge:18 },
  { id:'tutoring_edu', isStudy:true, icon:'👩‍🏫', name:'Get a tutor',           desc:'Targeted help.',            cost:-200, effects:{ smarts:+8, gradeScore:+8 }, cooldown:1, minAge:8,  maxAge:21 },
  { id:'pt_job_sch',                icon:'☕', name:'Part-time job',           desc:'Your own money.',            cost:0,    effects:{ income:+4000, happy:+3 },   cooldown:0, minAge:16, maxAge:18 },
  { id:'dropout',                   icon:'🚪', name:'Drop out — work full-time',desc:'Not for everyone. But valid.',cost:0,  effects:{ income:+16000, smarts:-5 }, cooldown:0, minAge:16, maxAge:17 },
  { id:'apply_uni',                 icon:'🎓', name:'Apply to university',     desc:'The next step.',             cost:0,    effects:{ smarts:+3 },               cooldown:0, minAge:17, maxAge:19 },
];

const CAREER_ACTIONS = [
  { id:'apply_jobs',    icon:'📄', name:'Apply for jobs',             desc:'Put yourself out there.',                        cost:0,     effects:{ rep:+2 },                  cooldown:1, minAge:16 },
  { id:'upskill',       icon:'💻', name:'Learn a new skill',          desc:'Stay competitive.',                              cost:-100,  effects:{ smarts:+5, rep:+3 },        cooldown:1, minAge:18 },
  { id:'side_hustle',   icon:'💡', name:'Start a side hustle',        desc:'Build something on the side.',                   cost:-200,  effects:{ income:+3000, smarts:+3 },  cooldown:1, minAge:18 },
  { id:'negotiate_pay', icon:'💬', name:'Negotiate a pay rise',       desc:'The worst they can say is no.',                  cost:0,     effects:{ income:+3000, rep:+3 },     cooldown:2, minAge:20 },
  { id:'networking',    icon:'🤝', name:'Go networking',              desc:'It\'s about who you know.',                      cost:-30,   effects:{ rep:+5, rel_friends:+3 },   cooldown:1, minAge:18 },
  { id:'start_biz',     icon:'🏢', name:'Start a business',           desc:'High risk, high reward.',                        cost:-5000, effects:{ income:+8000, rep:+10 },   cooldown:0, minAge:21 },
];

function isActionAvailable(action) {
  if (action.minAge && STATE.age < action.minAge) return { ok:false, reason:`Available at ${action.minAge}` };
  if (action.maxAge && STATE.age > action.maxAge) return { ok:false, reason:'No longer relevant' };
  if (action.cooldown > 0) {
    const last = STATE.actionCooldowns[action.id];
    if (last !== undefined && (STATE.age - last) < action.cooldown) {
      const wait = action.cooldown - (STATE.age - last);
      return { ok:false, reason: wait===1 ? 'Done this year' : `Available in ${wait} year(s)` };
    }
  }
  if (action.cost < 0 && STATE.finances.balance < Math.abs(action.cost))
    return { ok:false, reason:'Can\'t afford this' };
  return { ok:true };
}

const STUDY_FLAVOUR = [
  "The words are starting to merge together.",
  "You stare at the page but nothing's going in.",
  "Your brain feels full. Maybe that's enough for now.",
  "You're going through the motions at this point.",
  "Diminishing returns. You can feel it.",
];

function rollStudyGain(baseGain) {
  const traits = STATE.traits;
  // Each entry is [multiplier, weight]
  let table;
  const intelligent  = traits.includes('intelligent');
  const hardworking  = traits.includes('hardworking');
  const lazy         = traits.includes('lazy');

  if (intelligent && hardworking) {
    table = [[1.5, 20], [1.25, 50], [1.0, 30]];
  } else if (lazy && intelligent) {
    // ambition and laziness cancel out to roughly baseline
    table = [[1.0, 30], [0.75, 40], [0.5, 30]];
  } else if (intelligent) {
    table = [[1.5, 15], [1.25, 40], [1.0, 35], [0.75, 10]];
  } else if (hardworking) {
    table = [[1.25, 20], [1.0, 55], [0.75, 25]];
  } else if (lazy) {
    table = [[0.75, 15], [0.5, 45], [0.25, 30], [0.0, 10]];
  } else {
    // baseline
    table = [[1.25, 10], [1.0, 50], [0.75, 40]];
  }

  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [mult, w] of table) {
    r -= w;
    if (r <= 0) return Math.round(baseGain * mult);
  }
  return baseGain;
}

function doAction(action, petId) {
  const isStudy = !!action.isStudy;

  // Build modified effects
  const effects = { ...action.effects };

  if (isStudy && effects.gradeScore) {
    // Roll trait-modified grade gain
    const rolled = rollStudyGain(effects.gradeScore);

    // Apply annual cap
    const remaining = 15 - STATE.annualGradeGain;
    if (remaining <= 0) {
      // Cap hit — show flavour, no grade gain
      effects.gradeScore = 0;
      showToast(STUDY_FLAVOUR[Math.floor(Math.random() * STUDY_FLAVOUR.length)]);
    } else {
      effects.gradeScore = Math.min(rolled, remaining);
      STATE.annualGradeGain += effects.gradeScore;
    }

    // Study count — happiness drain after 5 sessions
    STATE.annualStudyCount++;
    if (STATE.annualStudyCount >= 5) {
      effects.happy = (effects.happy || 0) - 2;
    }
  }

  applyEffects(effects);
  if (action.cost !== 0) STATE.finances.balance += action.cost;
  if (action.cooldown > 0) STATE.actionCooldowns[action.id] = STATE.age;
  if (petId) {
    const pet = STATE.family.pets.find(p => p.id === petId);
    if (pet) { pet.happiness = clamp(pet.happiness + 5); pet.fedThisYear = true; }
  }

  const delta = Object.values(effects).reduce((s, v) => s + v, 0);
  logActivity(action.name, delta);
}

function buildActionHTML(action, extraClass='') {
  const check = isActionAvailable(action);
  const locked = !check.ok;
  const costLabel = !action.cost ? 'Free' : action.cost<0 ? fmtMoney(action.cost) : `+${fmtMoney(action.cost)}`;
  const costClass = action.cost<0 ? 'neg' : action.cost>0 ? 'pos' : '';
  return `
    <div class="action-card${locked?' locked':''} ${extraClass}" data-id="${action.id}">
      <div class="action-icon">${action.icon}</div>
      <div class="action-info">
        <div class="action-name">${action.name}</div>
        <div class="action-desc">${locked ? check.reason : action.desc}</div>
      </div>
      <div class="action-cost ${costClass}">${costLabel}</div>
    </div>`;
}

function wireActions(containerEl, actionList, onDone, petId) {
  containerEl.querySelectorAll('.action-card:not(.locked)').forEach(el => {
    const id = el.dataset.id;
    const action = actionList.find(a=>a.id===id);
    if (!action) return;
    el.onclick = () => {
      const check = isActionAvailable(action);
      if (!check.ok) { showToast(check.reason); return; }
      doAction(action, petId);
      showToast(`${action.name} ✓`);
      if (onDone) onDone();
    };
  });
}
