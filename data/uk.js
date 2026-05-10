const NAMES_UK = {
  male: [
    'Adam','Alexander','Alfie','Archie','Arthur','Barnaby','Benjamin','Caleb','Charlie','Daniel',
    'Dylan','Edward','Elliot','Ethan','Felix','Finn','Freddie','George','Harry','Henry',
    'Isaac','Jack','Jacob','James','Joseph','Joshua','Jude','Kit','Leo','Liam',
    'Logan','Louie','Lucas','Luke','Mason','Max','Monty','Nathan','Noah','Oliver',
    'Oscar','Reuben','Rory','Ryan','Samuel','Sebastian','Theodore','Tom','Toby','William',
  ],
  female: [
    'Alex','Alice','Amelia','Amber','Anna','Ava','Beatrice','Charlotte','Chloe','Clara','Daisy',
    'Ella','Ellie','Eliza','Emma','Esme','Eva','Evie','Florence','Freya','Georgia',
    'Grace','Hannah','Harriet','Imogen','Iris','Isabella','Isla','Ivy','Lexi','Lily',
    'Lottie','Lydia','Logan','Matilda','Maya','Millie','Molly','Naomi','Nora','Olivia','Olive','Penelope',
    'Phoebe','Poppy','Rosie','Ruby','Sadie','Scarlett','Sophie','Violet','Viola','Zoe'
  ],
  surnames: [
    'Adams','Bailey','Baker','Barnes','Bennett','Brown','Burns','Butler','Campbell','Carter',
    'Clark','Clarke','Coleman','Collins','Cooper','Davies','Edwards','Ellis','Evans','Fletcher',
    'Fox','Fraser','Green','Griffin','Hall','Harris','Henderson','Hill','Hughes','Jackson',
    'Jenkins','Johnson','Jones','King','Lewis','Long','Marshall','Martin','Mitchell','Moore',
    'Morris','Murray','Owen','Parker','Patterson','Perry','Phillips','Powell','Price','Reid',
    'Roberts','Robinson','Ross','Russell','Scott','Shaw','Simpson','Smith','Taylor','Thomas',
    'Thompson','Turner','Walker','Ward','Watson','Webb','White','Williams','Wilson','Wood'
  ],
  petNames: [
    'Biscuit','Milo','Bella','Buddy','Charlie','Daisy','Poppy','Max','Rosie','Teddy',
    'Luna','Coco','Alfie','Molly','Oscar','Ruby','Leo','Lola','Archie','Honey','Tiny',
    'Pip','Toby','Willow','Baxter','Nala','Bruno','Elsie','Patch','Sable','Chester'
  ]
};

const PLACES_UK = {
  cities: [
    { name:'London', region:'England', vibe:'a fast, global, and brutally expensive city', wealth:3 },
    { name:'Manchester', region:'England', vibe:'a rainy city that thinks it’s bigger than it is', wealth:2 },
    { name:'Birmingham', region:'England', vibe:'a city everyone argues about online', wealth:2 },
    { name:'Bristol', region:'England', vibe:'a creative city on hills and coffee', wealth:2 },
    { name:'Cardiff', region:'Wales', vibe:'a small capital city growing into itself', wealth:2 },
    { name:'Belfast', region:'Ireland', vibe:'a quiet city with a heavy history', wealth:1 },
    { name:'Oxford', region:'England', vibe:'an elite and quietly competitive city', wealth:3 },
    { name:'Cambridge', region:'England', vibe:'a smart, calm, and slightly out of touch city', wealth:3 },
  ]
};

const SCHOOL_TYPES_UK = {
  lower:        { primary:'State Primary',     secondary:'State Secondary', college:'State Sixth Form'   },
  working:      { primary:'State Primary',     secondary:'State Secondary', college:'State Sixth Form'   },
  middle:       { primary:'State Primary',     secondary:'Grammar School',  college:'Grammar Sixth Form' },
  upper_middle: { primary:'Private School',       secondary:'Private School',  college:'Private Sixth Form' },
  elite:        { primary:'Elite Prep School', secondary:'Elite Boarding School', college:'Elite Sixth Form'   },
};

const SCHOOL_NAMES_UK = {
  state_primary:   ['Meadowbrook Primary','Oakwood Primary','Kingsmead Primary'],
  state_secondary: ['Hillcrest Secondary','St. George\'s Academy','Brooksbridge College'],
  grammar:         ['King Edward\'s Grammar','Hillcrest Grammar','St. Catherine\'s'],
  prep:            ['Harlington House','Cavendish House','Westminster House'],
  private:         ['Harlington House','Cavendish House','Westminster House'],
  private_sixth:   ['Harlington Sixth Form','Cavendish Sixth Form','Westminster Sixth Form'],
  boarding:        ['Westminster House','Cavendish House','Ashbury Independent School'],
  sixth_form:      ['Northgate Sixth Form','Westfield Sixth Form','Kingsmead Sixth Form'],
  grammar_sixth:   ['King Edward\'s Sixth Form','Hillcrest Grammar Sixth Form','St. Catherine\'s Sixth Form'],
  elite_prep:      ['Westminster Prep', 'Harlington Prep'],
  elite_sixth:     ['Westminster Upper School','Cavendish Upper School','Harlington Upper School'],
};

function pickUKSchoolName(socialClass, level) {
  const map = {
    lower:        { primary:'state_primary', secondary:'state_secondary', college:'sixth_form' },
    working:      { primary:'state_primary', secondary:'state_secondary', college:'sixth_form' },
    middle:       { primary:'state_primary', secondary:'grammar',         college:'grammar_sixth' },
    upper_middle: { primary:'prep',          secondary:'private',         college:'private_sixth' },
    elite:        { primary:'elite_prep',    secondary:'boarding',        college:'elite_sixth' },
  };
  const poolKey = (map[socialClass] || map.working)[level];
  const pool = SCHOOL_NAMES_UK[poolKey] || ['School'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickUKSchoolNameByType(typeLabel, level) {
  const label = String(typeLabel || '').toLowerCase();
  let poolKey = 'state_primary';
  if (level === 'primary') {
    if (label.includes('elite prep')) poolKey = 'elite_prep';
    else if (label.includes('prep') || label.includes('private')) poolKey = 'prep';
    else poolKey = 'state_primary';
  } else if (level === 'secondary') {
    if (label.includes('boarding')) poolKey = 'boarding';
    else if (label.includes('grammar')) poolKey = 'grammar';
    else if (label.includes('private')) poolKey = 'private';
    else poolKey = 'state_secondary';
  } else if (level === 'college') {
    if (label.includes('elite')) poolKey = 'elite_sixth';
    else if (label.includes('private')) poolKey = 'private_sixth';
    else if (label.includes('grammar')) poolKey = 'grammar_sixth';
    else poolKey = 'sixth_form';
  }
  const pool = SCHOOL_NAMES_UK[poolKey] || ['School'];
  return pool[Math.floor(Math.random() * pool.length)];
}
