// ═══════════════════════════════════════════════════════════
// EVENTS.JS
// ═══════════════════════════════════════════════════════════

const EVENTS = [

  // ── BABY ─────────────────────────────────––––––––––────────

  // ── PRIMARY SCHOOL ─────────────────────────────────────────

  { id:'first_day_school', category:'SCHOOL', minAge:5, maxAge:5, type:'story',
  icon:'🎒',
  title:'First day of school.',
  traitTags:['social_event'],
  text:"Everything feels enormous. The cloakroom, the noise, all these unknown faces staring at you.",
  choices:[
    { text:'Dive in and introduce yourself',
      effects:{ happy:+8, rel_friends:+5 },
      classmateEffect:{ all: +15 },
      outcome:'You make a few connections on the first day. A good start.',
      log:'Made friends on the first day of school',
      autoFriendCheck: true },
    { text:'Find a quiet corner and observe',
      effects:{ smarts:+3, happy:-2 },
      classmateEffect:{ all: +3 },
      outcome:'You watch everyone carefully. You\'ll figure out who\'s worth talking to.',
      log:'Spent the first day watching from the sidelines' },
    { text:'Cry until your family comes back',
      effects:{ happy:-5, rel_family:+5 },
      outcome:'Not your finest moment. But your parent gave you the longest hug.',
      log:'Had a rough first day of school' },
  ]},

{ id:'bathroom_anxiety', category:'SCHOOL', minAge:5, maxAge:9, type:'story',
  icon:'🏫',
  title:'You need the toilet...',
  traitTags:['social_event'],
  text:"But you don't know the rules yet, it feels like everyone is watching.",
  choices:[
    { text:'Raise your hand and ask to go',
      effects:{ happy:+2 },
      outcome:'The teacher smiles and lets you go. You make it just in time.',
      log:'Asked to use the bathroom on the first day' },
    { text:'Try to hold it',
      effects:{ happy:-10, rep:-5 },
      outcome:'Tried to hold it. Did not go well.',
      log:'Tried to hold it. Did not go well.' },
    { text:'Just get up and go',
      effects:{ happy:-2, rep:-3, gradeScore:-5 },
      outcome:'Your teacher called you back and told you off in front of everyone.',
      log:'Got told off in front of the class for leaving without asking' },
  ]},

   { id:'spelling_bee', category:'SCHOOL', minAge:7, maxAge:10, type:'story',
   icon:'🏫',
  title:"You've been entered into the school spelling bee.",
    traitTags:['academic_event'],
    text:"The whole year group is crammed into the hall. You're starting to sweat.",
    choices:[
      { text:'Study hard and give it everything',
        effects:{ smarts:+8, happy:+5, gradeScore:+5 },
        outcome:'You nail it. Somehow you knew how to spell pterodactyl!',
        log:'Won the school spelling bee' },
      { text:"Wing it, how hard can it be?",
        effects:{ smarts:+2, happy:-5 },
        outcome:'G-I-R-A-F-E. You were out in round two. Giraffe has two F\'s',
        log:'Winged the spelling bee' },
      { text:'Fake being sick to avoid it',
        outcome:'You spend the afternoon watching TV while everyone else suffers. No regrets.',
      log:'Faked sick to get out of the spelling bee' },  
      ]},


  // ── CHILDHOOD ─────────────────────────────────────────
  
    { id:'puppy', category:'ANIMAL', minAge:5, maxAge:9, type:'story',
  icon:'🐕',
  title:'You find a stray puppy on the way home from school!',
    traitTags:['social_event','family_event'],
    text:' It follows you, tail wagging, looking up at you.',
    choices:[
      { text:'Beg your parents to keep it',
        effects:{ happy:+10, rel_family:+5 },
        petAdopt: true,
        petType:'dog', petEmoji:'🐕',
        log:'Adopted a stray puppy' },
      { text:'Leave it, not your problem',
        effects:{ happy:-5 },
        log:'Left the puppy behind' },
      { text:'Take it to a shelter',
        effects:{ happy:+3, smarts:+2 },
        log:'Took a stray dog to the shelter' },
    ]},

     // ── EDUCATION ─────────────────────────────────────────
    { id:'private_school_offer', category:'🏫 School', minAge:11, maxAge:11, type:'story',
  icon:'📬',
  title:'An offer you didn\'t expect.',
  traitTags:['academic_event'],
  text:'Your grades have caught the attention of some of the best schools in the area. You have options.',
  choices:[
  { text:'Apply to a private school',
    beforeChoose: () => {
      if (!shouldWarnPrivateAffordability()) return true;
      const confirmed = window.confirm('It is unlikely that your parents will be able to afford this. Do you still want to apply?');
      return confirmed;
    },
    effects:{ smarts:+3 },
    outcome:'Your application is in. Now you wait.',
    log:'Applied to a private school',
    onChoose: () => { STATE.school._appliedPrivate = true; } },
  { text:'Apply for a scholarship',
    effects:{ smarts:+5 },
    outcome:'You submitted a scholarship application. Results in a year.',
    log:'Applied for a scholarship',
    onChoose: () => { STATE.school._appliedPrivate = true; STATE.school._appliedScholarship = true; } },
  { text:'Stay where you are',
    effects:{ happy:+3 },
    outcome:'You\'re happy where you are. No need to rock the boat.',
    log:'Turned down the private school offer' },
],},

{ id:'private_school_result', category:'🏫 School', minAge:12, maxAge:12, type:'story',
  icon:'📋',
  title:'The letter arrived.',
  traitTags:['academic_event'],
  text:'The envelope has been sitting on the kitchen table all morning. Your parents are watching.',
  choices:[
    { text:'Open it',
      effects:{},
      outcome:'You open the letter.',
      log:'Heard back from the private school application',
      onChoose: () => {
        if (STATE.school._privateAccepted) {
          applyEffects({ smarts:+5, happy:+8, rep:+5 });
          STATE.school.current = pickRandom(SCHOOL_NAMES_UK.private);
        } else {
          applyEffects({ happy:-4, smarts:+2 });
        }
      },
      getOutcome: () => STATE.school._privateAccepted
        ? 'You got in. A new chapter begins.'
        : 'You did not get a place this time. It stings, but nothing stops here.' },
  ]},

{ id:'scholarship_result', category:'🏫 School', minAge:12, maxAge:12, type:'story',
  icon:'🏆',
  title:'The scholarship decision.',
  traitTags:['academic_event'],
  text:'You applied for a scholarship last year. Today you find out if it worked.',
  choices:[
    { text:'Open the letter',
      effects:{},
      outcome:'You open the letter.',
      log:'Heard back from the scholarship application',
      onChoose: () => {
        if (STATE.school._scholarshipWon) {
          applyEffects({ smarts:+8, happy:+10, rep:+8, balance:+500 });
          STATE.school.current = pickRandom(SCHOOL_NAMES_UK.private);
        } else {
          applyEffects({ happy:-5, smarts:+2 });
        }
      },
      getOutcome: () => STATE.school._scholarshipWon
        ? 'You\'ve been awarded a full scholarship. Your family is overjoyed.'
        : 'You did not win the scholarship. Your family is disappointed, but proud you tried.' },
  ]},

  

  

  { id:'lemonade_stand', category:'💰 Money', minAge:8, maxAge:12, type:'story',
    traitTags:['financial_event'],
    text:"Your neighbour's kid sets up a lemonade stand and asks if you want in.",
    choices:[
      { text:'Join and work all week',
        effects:{ balance:+15, happy:+5 },
        log:'Ran a lemonade stand all summer' },
      { text:'Decline — enjoy summer',
        effects:{ happy:+8 },
        log:'Enjoyed the summer holidays' },
      { text:'Start your own rival stand',
        effects:{ balance:+25, smarts:+5, rep:+3 },
        log:'Started a rival lemonade stand' },
    ]},

  { id:'gcse_pressure', category:'📚 School', minAge:14, maxAge:16, type:'story',
    traitTags:['academic_event'],
    text:"GCSEs are looming. Your parents are pushing you to do nothing but study.",
    choices:[
      { text:'Study constantly — top grades only',
        effects:{ smarts:+12, happy:-8, gradeScore:+15 },
        log:'Buckled down hard for GCSEs' },
      { text:'Balance study and social life',
        effects:{ smarts:+6, happy:+4, gradeScore:+5 },
        log:'Balanced studying and socialising for GCSEs' },
      { text:'Party now, worry later',
        effects:{ happy:+10, smarts:-5, gradeScore:-10 },
        log:'Prioritised fun over GCSEs' },
    ]},

  { id:'college_choice', category:'🎓 School', minAge:16, maxAge:16, type:'story',
    traitTags:['academic_event'],
    text:"School's over. Now you decide what comes next.",
    choices:[
      { text:'Stay in education — sixth form / college',
        effects:{ smarts:+5 },
        log:'Chose to continue into sixth form' },
      { text:'Get a part-time job while studying',
        effects:{ balance:+2000, smarts:+3 },
        log:'Started a part-time job alongside sixth form' },
      { text:'Leave school and work full-time',
        effects:{ balance:+8000, smarts:-5, rep:-5 },
        log:'Left school at 16 to work full-time' },
    ]},

  { id:'identity_check_in', category:'🩷 Identity', minAge:16, maxAge:16, type:'story',
    icon:'🩷',
    traitTags:['social_event'],
    text:"People are starting to ask what your type is. You think about who you are actually into.",
    choices:[
      { text:'Boys / men',
        effects:{ happy:+2 },
        log:'You admitted what you were into.',
        outcome:'You admit to yourself that you are into boys / men.',
        onChoose: () => { STATE.sexuality = STATE.gender === 'male' ? 'homosexual' : 'heterosexual'; STATE.sexualityConfirmed = true; } },
      { text:'Girls / women',
        effects:{ happy:+2 },
        log:'You admitted what you were into.',
        outcome:'You admit to yourself that you are into girls / women.',
        onChoose: () => { STATE.sexuality = STATE.gender === 'female' ? 'homosexual' : 'heterosexual'; STATE.sexualityConfirmed = true; } },
      { text:'Both',
        effects:{ happy:+3 },
        log:'You realised you were into more than one type of person.',
        outcome:'You admit to yourself that you are into both.',
        onChoose: () => { STATE.sexuality = 'bisexual'; STATE.sexualityConfirmed = true; } },
    ]},

  
  
  
  // ── RANDOM EVENTS ─────────────────────────────────────
  { id:'rand_windfall', category:'💸 Luck', minAge:18, maxAge:80, type:'random',
    traitTags:['financial_event'],
    text:"You find £50 on the pavement. Nobody around.",
    choices:[
      { text:'Keep it — finders keepers',
        effects:{ balance:+50, happy:+5 },
        log:'Found £50 on the street' },
      { text:'Hand it in to the police',
        effects:{ rep:+8, happy:+3 },
        log:'Handed in found money' },
    ]},



];
