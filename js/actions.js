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

const PARENT_RELATIONSHIP_ACTIONS = [
  {
    id:'cuddle',
    icon:'🤱',
    name:'Cuddle',
    desc:'Comfort, closeness, and a stronger bond.',
    cost:0,
    effects:{ happy:+5, rel_family:+2 },
    cooldown:0,
    minAge:0,
    maxAge:3,
    customType:'parent_cuddle',
  },
  {
    id:'play_together',
    icon:'🧸',
    name:'Play together',
    desc:'Shared playtime builds closeness fast.',
    cost:0,
    effects:{ happy:+5, rel_family:+2 },
    cooldown:0,
    minAge:0,
    maxAge:3,
    customType:'parent_play',
  },
  {
    id:'throw_tantrum',
    icon:'😤',
    name:'Throw tantrum',
    desc:'Big feelings. Messy consequences.',
    cost:0,
    effects:{ happy:-3, rel_family:-3 },
    cooldown:0,
    minAge:0,
    maxAge:3,
    customType:'parent_tantrum',
  },
  {
    id:'learn_from_parent',
    icon:'🧠',
    name:'Learn something',
    desc:'A parent tries to teach you something new.',
    cost:0,
    effects:{ smarts:+1 },
    cooldown:0,
    minAge:0,
    maxAge:3,
    customType:'parent_learn',
  },
  {
    id:'spend_time_together_child',
    icon:'🏡',
    name:'Spend time together',
    desc:'Shared time at home matters.',
    cost:0,
    effects:{ happy:+4, rel_family:+3 },
    cooldown:0,
    minAge:4,
    maxAge:10,
    customType:'generic_parent_action',
  },
  {
    id:'ask_for_advice_child',
    icon:'💬',
    name:'Ask for advice',
    desc:'They might know more than you think.',
    cost:0,
    effects:{ smarts:+1, rel_family:+2 },
    cooldown:0,
    minAge:4,
    maxAge:10,
    customType:'generic_parent_action',
  },
  {
    id:'argue_child',
    icon:'😠',
    name:'Argue',
    desc:'Tension at home leaves a mark.',
    cost:0,
    effects:{ happy:-2, rel_family:-4 },
    cooldown:0,
    minAge:4,
    maxAge:10,
    customType:'generic_parent_action',
  },
  {
    id:'play_together_child',
    icon:'🧸',
    name:'Play together',
    desc:'Some of the best moments are still simple.',
    cost:0,
    effects:{ happy:+4, rel_family:+3 },
    cooldown:0,
    minAge:4,
    maxAge:10,
    customType:'generic_parent_action',
  },
  {
    id:'ask_about_teen',
    icon:'❓',
    name:'Ask about',
    desc:'Start the conversation.',
    cost:0,
    effects:{ smarts:+1, rel_family:+2 },
    cooldown:0,
    minAge:11,
    maxAge:15,
    customType:'generic_parent_action',
  },
  {
    id:'spend_time_together_teen',
    icon:'🏡',
    name:'Spend time together',
    desc:'Time together gets rarer. Make it count.',
    cost:0,
    effects:{ happy:+4, rel_family:+3 },
    cooldown:0,
    minAge:11,
    maxAge:15,
    customType:'generic_parent_action',
  },
  {
    id:'argue_teen',
    icon:'😠',
    name:'Argue',
    desc:'Teenage friction comes with consequences.',
    cost:0,
    effects:{ happy:-3, rel_family:-5 },
    cooldown:0,
    minAge:11,
    maxAge:15,
    customType:'generic_parent_action',
  },
  {
    id:'bond_teen',
    icon:'🤝',
    name:'Bond',
    desc:'A real moment of connection.',
    cost:0,
    effects:{ happy:+5, rel_family:+4 },
    cooldown:0,
    minAge:11,
    maxAge:15,
    customType:'generic_parent_action',
  },
  {
    id:'ask_for_money_young_adult',
    icon:'💷',
    name:'Ask for some money',
    desc:'A risky ask, but sometimes necessary.',
    cost:0,
    effects:{ balance:+50, rel_family:-1 },
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'generic_parent_action',
  },
  {
    id:'contribute_financially_young_adult',
    icon:'🏠',
    name:'Contribute financially',
    desc:'COMING SOON',
    cost:0,
    effects:{},
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'coming_soon_parent_action',
  },
  {
    id:'ask_about_young_adult',
    icon:'❓',
    name:'Ask about',
    desc:'Some conversations matter more now.',
    cost:0,
    effects:{ smarts:+1, rel_family:+2 },
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'generic_parent_action',
  },
  {
    id:'spend_time_together_young_adult',
    icon:'🏡',
    name:'Spend time together',
    desc:'Time with family changes as you get older.',
    cost:0,
    effects:{ happy:+4, rel_family:+3 },
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'generic_parent_action',
  },
  {
    id:'argue_young_adult',
    icon:'😠',
    name:'Argue',
    desc:'Adult arguments can sting more.',
    cost:0,
    effects:{ happy:-3, rel_family:-5 },
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'generic_parent_action',
  },
  {
    id:'bond_young_adult',
    icon:'🤝',
    name:'Bond',
    desc:'Build a stronger adult relationship.',
    cost:0,
    effects:{ happy:+5, rel_family:+4 },
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'generic_parent_action',
  },
  {
    id:'move_out_young_adult',
    icon:'📦',
    name:'Move out / Move back in',
    desc:'COMING SOON',
    cost:0,
    effects:{},
    cooldown:0,
    minAge:16,
    maxAge:22,
    customType:'coming_soon_parent_action',
  },
];

const SIBLING_RELATIONSHIP_ACTIONS = [
  { id:'sib_play_together_early',      icon:'🧸', name:'Play together',         desc:'Simple fun makes a difference.',            cost:0, effects:{ happy:+4, rel_sibling:+3 }, cooldown:0, minAge:0,  maxAge:5,  customType:'generic_sibling_action' },
  { id:'sib_spend_time_early',         icon:'🏡', name:'Spend time together',   desc:'Being around each other still counts.',    cost:0, effects:{ happy:+3, rel_sibling:+2 }, cooldown:0, minAge:0,  maxAge:5,  customType:'generic_sibling_action' },
  { id:'sib_tell_on_them_early',       icon:'🗣️', name:'Tell on them',          desc:'Short-term win, long-term damage.',        cost:0, effects:{ rep:+1, rel_sibling:-4 },   cooldown:0, minAge:0,  maxAge:5,  customType:'generic_sibling_action' },
  { id:'sib_sleep_together_early',     icon:'🌙', name:'Sleep together',        desc:'Shared rooms and shared comfort.',         cost:0, effects:{ happy:+2, rel_sibling:+3 }, cooldown:0, minAge:0,  maxAge:5,  customType:'generic_sibling_action' },
  { id:'sib_fight_toy_early',          icon:'🪀', name:'Fight over toy',        desc:'It was never really about the toy.',       cost:0, effects:{ happy:-2, rel_sibling:-5 }, cooldown:0, minAge:0,  maxAge:5,  customType:'generic_sibling_action' },

  { id:'sib_play_games_child',         icon:'🎮', name:'Play games together',   desc:'A bit of competition, a bit of bonding.',  cost:0, effects:{ happy:+4, rel_sibling:+3 }, cooldown:0, minAge:6,  maxAge:12, customType:'generic_sibling_action' },
  { id:'sib_conversation_child',       icon:'💬', name:'Have a conversation',   desc:'You actually talk for once.',              cost:0, effects:{ happy:+2, rel_sibling:+2 }, cooldown:0, minAge:6,  maxAge:12, customType:'generic_sibling_action' },
  { id:'sib_argue_child',              icon:'😠', name:'Argue',                 desc:'No one backs down.',                        cost:0, effects:{ happy:-2, rel_sibling:-4 }, cooldown:0, minAge:6,  maxAge:12, customType:'generic_sibling_action' },
  { id:'sib_team_up_child',            icon:'🤝', name:'Team Up',               desc:'It helps to have each other.',             cost:0, effects:{ rep:+2, rel_sibling:+4 },   cooldown:0, minAge:6,  maxAge:12, customType:'generic_sibling_action' },
  { id:'sib_steal_stuff_child',        icon:'🕵️', name:'Steal their stuff',    desc:'They will notice eventually.',             cost:0, effects:{ happy:+1, rel_sibling:-5 }, cooldown:0, minAge:6,  maxAge:12, customType:'generic_sibling_action' },

  { id:'sib_ask_advice_teen',          icon:'💡', name:'Ask for Advice',        desc:'They may have seen this before.',          cost:0, effects:{ smarts:+1, rel_sibling:+2 },cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },
  { id:'sib_go_out_teen',              icon:'🌆', name:'Go Out Together',       desc:'Get out of the house together.',           cost:-20,effects:{ happy:+5, rel_sibling:+3 },cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },
  { id:'sib_argue_about_teen',         icon:'😤', name:'Argue About Something', desc:'The issue probably did not matter.',        cost:0, effects:{ happy:-3, rel_sibling:-5 }, cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },
  { id:'sib_cover_for_them_teen',      icon:'🫣', name:'Cover For Them',        desc:'Loyalty has consequences.',                cost:0, effects:{ rep:-1, rel_sibling:+4 },   cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },
  { id:'sib_ignore_them_teen',         icon:'🙄', name:'Ignore Them',           desc:'Distance can harden into habit.',          cost:0, effects:{ happy:-1, rel_sibling:-3 }, cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },
  { id:'sib_insult_them_teen',         icon:'🗯️', name:'Insult them',          desc:'Some words hang around.',                  cost:0, effects:{ happy:-1, rel_sibling:-6 }, cooldown:0, minAge:13, maxAge:21, customType:'generic_sibling_action' },

  { id:'sib_catch_up_adult',           icon:'☕', name:'Catch Up',              desc:'Life moves fast. Stay connected.',         cost:0, effects:{ happy:+3, rel_sibling:+3 }, cooldown:0, minAge:22,             customType:'generic_sibling_action' },
  { id:'sib_ask_money_adult',          icon:'💷', name:'Ask for money',         desc:'A difficult ask between siblings.',        cost:0, effects:{ balance:+100, rel_sibling:-2 },cooldown:0,minAge:22,          customType:'generic_sibling_action' },
  { id:'sib_help_kids_adult',          icon:'🧒', name:'Help With Their Kids',  desc:'Show up when they need you.',              cost:0, effects:{ happy:+3, rel_sibling:+4 }, cooldown:0, minAge:22,             customType:'sibling_help_kids' },
  { id:'sib_ask_life_adult',           icon:'❓', name:'Ask about life',        desc:'Sometimes the real catch-up matters most.',cost:0, effects:{ smarts:+1, rel_sibling:+2 },cooldown:0, minAge:22,             customType:'generic_sibling_action' },
  { id:'sib_stay_with_them_adult',     icon:'🛏️', name:'Stay With Them',       desc:'Close quarters can help or strain things.',cost:0, effects:{ happy:+2, rel_sibling:+3 }, cooldown:0, minAge:22,             customType:'generic_sibling_action' },
  { id:'sib_argue_adult',              icon:'😠', name:'Argue',                 desc:'Adult arguments cut deeper.',              cost:0, effects:{ happy:-3, rel_sibling:-5 }, cooldown:0, minAge:22,             customType:'generic_sibling_action' },
];

const CHILD_RELATIONSHIP_ACTIONS = [
  { id:'child_cuddle', icon:'🤱', name:'Cuddle', desc:'Comfort and warmth matter most right now.', cost:0, effects:{ happy:+4, rel_child:+6 }, cooldown:0, minAge:0, maxAge:3 },
  { id:'child_play_small', icon:'🧸', name:'Play Together', desc:'Little moments build a strong bond.', cost:0, effects:{ happy:+5, rel_child:+5 }, cooldown:0, minAge:0, maxAge:3 },
  { id:'child_spend_time', icon:'🏡', name:'Spend Time Together', desc:'Be present and involved.', cost:0, effects:{ happy:+3, rel_child:+4 }, cooldown:0, minAge:4 },
  { id:'child_homework', icon:'📚', name:'Help With Homework', desc:'Support them as they learn.', cost:0, effects:{ smarts:+1, rel_child:+3 }, cooldown:0, minAge:5 },
  { id:'child_discipline', icon:'🧭', name:'Discipline', desc:'Set boundaries, even if it is hard.', cost:0, effects:{ rel_child:-2, rep:+1 }, cooldown:0, minAge:4 },
  { id:'child_gift', icon:'🎁', name:'Give Gift', desc:'A small gesture can mean a lot.', cost:-30, effects:{ happy:+4, rel_child:+4 }, cooldown:0, minAge:0 },
  { id:'child_heart_to_heart', icon:'💬', name:'Have A Heart-to-Heart', desc:'Listen properly and talk honestly.', cost:0, effects:{ happy:+3, rel_child:+5 }, cooldown:0, minAge:8 },
  { id:'child_hobby', icon:'🎨', name:'Support Their Hobby', desc:'Encourage what lights them up.', cost:-40, effects:{ happy:+4, smarts:+1, rel_child:+4 }, cooldown:0, minAge:6 },
];

const CLASSMATE_RELATIONSHIP_ACTIONS = [
  { id:'cm_play_together_child',   icon:'🧸', name:'Play together',          desc:'Shared play makes school easier.',       cost:0,  effects:{ happy:+4, rel_classmate:+4, popularity:+1 }, cooldown:0, minAge:5,  maxAge:10, customType:'generic_classmate_action' },
  { id:'cm_share_snacks_child',    icon:'🍎', name:'Share snacks',           desc:'Small gestures matter.',                 cost:-2, effects:{ happy:+2, rel_classmate:+3, popularity:+1 }, cooldown:0, minAge:5,  maxAge:10, customType:'generic_classmate_action' },
  { id:'cm_conversation_child',    icon:'💬', name:'Have a conversation',    desc:'It could go well. It could not.',        cost:0,  effects:{}, cooldown:0, minAge:5,  maxAge:10, customType:'classmate_conversation' },
  { id:'cm_friend_child',          icon:'🤝', name:'Ask to be friend',       desc:'Take the chance.',                       cost:0,  effects:{}, cooldown:0, minAge:5,  maxAge:10, customType:'classmate_friend_request' },
  { id:'cm_argue_child',           icon:'😠', name:'Argue',                  desc:'Tension builds fast at this age.',       cost:0,  effects:{ happy:-2, rel_classmate:-4, rep:-1 }, cooldown:0, minAge:5,  maxAge:10, customType:'generic_classmate_action' },
  { id:'cm_insult_child',          icon:'🗯️', name:'Insult',                 desc:'Cruelty sticks.',                        cost:0,  effects:{ rel_classmate:-6, rep:-3 }, cooldown:0, minAge:5,  maxAge:10, customType:'classmate_insult' },

  { id:'cm_joke_teen',             icon:'😂', name:'Joke around',            desc:'Shared humour helps.',                   cost:0,  effects:{ happy:+3, rel_classmate:+3, popularity:+1 }, cooldown:0, minAge:11, maxAge:15, customType:'generic_classmate_action' },
  { id:'cm_hangout_teen',          icon:'🎡', name:'Hang out',               desc:'Time outside class changes things.',     cost:-10, effects:{ happy:+5, rel_classmate:+4 }, cooldown:0, minAge:11, maxAge:15, customType:'generic_classmate_action' },
  { id:'cm_conversation_teen',     icon:'💬', name:'Have a conversation',    desc:'It could go well. It could not.',        cost:0,  effects:{}, cooldown:0, minAge:11, maxAge:15, customType:'classmate_conversation' },
  { id:'cm_friend_teen',           icon:'🤝', name:'Ask to be friend',       desc:'See if they feel the same way.',         cost:0,  effects:{}, cooldown:0, minAge:11, maxAge:15, customType:'classmate_friend_request' },
  { id:'cm_gossip_teen',           icon:'👂', name:'Gossip',                 desc:'Information travels quickly.',           cost:0,  effects:{ popularity:+2, rep:-2, rel_classmate:+1 }, cooldown:0, minAge:11, maxAge:15, customType:'generic_classmate_action' },
  { id:'cm_rumour_teen',           icon:'📣', name:'Spread rumour',          desc:'Messy, tempting, damaging.',             cost:0,  effects:{ popularity:+1, rep:-6, rel_classmate:-8 }, cooldown:0, minAge:11, maxAge:15, customType:'classmate_rumour' },
  { id:'cm_argue_teen',            icon:'😠', name:'Argue',                  desc:'School drama burns hot.',                cost:0,  effects:{ happy:-2, rel_classmate:-5, rep:-1 }, cooldown:0, minAge:11, maxAge:15, customType:'generic_classmate_action' },
  { id:'cm_insult_teen',           icon:'🗯️', name:'Insult',                 desc:'A fast way to poison things.',           cost:0,  effects:{ rel_classmate:-7, rep:-4 }, cooldown:0, minAge:11, maxAge:15, customType:'classmate_insult' },

  { id:'cm_hangout_older',         icon:'🌆', name:'Hang out',               desc:'You spend real time together.',          cost:-15, effects:{ happy:+5, rel_classmate:+4 }, cooldown:0, minAge:16, maxAge:18, customType:'generic_classmate_action' },
  { id:'cm_conversation_older',    icon:'💬', name:'Have a conversation',    desc:'It could go well. It could not.',        cost:0,  effects:{}, cooldown:0, minAge:16, maxAge:18, customType:'classmate_conversation' },
  { id:'cm_study_older',           icon:'📚', name:'Study together',         desc:'You help each other focus.',             cost:0,  effects:{ smarts:+2, rel_classmate:+3 }, cooldown:0, minAge:16, maxAge:18, customType:'generic_classmate_action' },
  { id:'cm_friend_older',          icon:'🤝', name:'Ask to be friend',       desc:'Make it official.',                       cost:0,  effects:{}, cooldown:0, minAge:16, maxAge:18, customType:'classmate_friend_request' },
  { id:'cm_flirt_older',           icon:'💘', name:'Flirt',                  desc:'A little risk, a little thrill.',        cost:0,  effects:{ happy:+4 }, cooldown:0, minAge:16, maxAge:18, customType:'classmate_flirt' },
  { id:'cm_rumour_older',          icon:'📣', name:'Spread rumour',          desc:'It can get ugly fast.',                  cost:0,  effects:{ popularity:+1, rep:-6, rel_classmate:-8 }, cooldown:0, minAge:16, maxAge:18, customType:'classmate_rumour' },
  { id:'cm_argue_older',           icon:'😠', name:'Argue',                  desc:'Teen arguments feel heavier now.',       cost:0,  effects:{ happy:-3, rel_classmate:-5, rep:-1 }, cooldown:0, minAge:16, maxAge:18, customType:'generic_classmate_action' },
  { id:'cm_insult_older',          icon:'🗯️', name:'Insult',                 desc:'A sharp word can define you.',           cost:0,  effects:{ rel_classmate:-7, rep:-4 }, cooldown:0, minAge:16, maxAge:18, customType:'classmate_insult' },
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
  { id:'tutoring_edu', isStudy:true, icon:'👩‍🏫', name:'Get a tutor',           desc:'Targeted help.',            cost:-200, effects:{ smarts:+8, gradeScore:+8 }, cooldown:1, minAge:8,  maxAge:18 },
];

const CAREER_ACTIONS = [];

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
