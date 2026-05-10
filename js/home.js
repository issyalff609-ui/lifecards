// ═══════════════════════════════════════════════════════════
// HOME.JS
// ═══════════════════════════════════════════════════════════

const HOUSEMATE_TRAITS_POOL = [
  { id:'messy',       label:'Messy',       mood:-8, tension:+12 },
  { id:'clean',       label:'Clean',       mood:+4, tension:-8 },
  { id:'supportive',  label:'Supportive',  mood:+8, tension:-10 },
  { id:'quiet',       label:'Quiet',       mood:+4, tension:-4 },
  { id:'lazy',        label:'Lazy',        mood:-4, tension:+8 },
  { id:'loud',        label:'Loud',        mood:-6, tension:+12 },
  { id:'ambitious',   label:'Ambitious',   mood:+2, tension:+3 },
  { id:'unemployed',  label:'Unemployed',  mood:-2, tension:+5 },
  { id:'generous',    label:'Generous',    mood:+7, tension:-6 },
];

const HOME_UPGRADES = [
  { id:'bedroom_refresh', label:'Redecorate Bedroom', cost:450, comfort:+8, prestige:+2, relationship:+2, happiness:+3, minSource:['rental','owner'] },
  { id:'kitchen_upgrade', label:'Upgrade Kitchen', cost:2200, comfort:+10, prestige:+4, relationship:+3, happiness:+4, minSource:['owner'] },
  { id:'bathroom_upgrade', label:'Improve Bathroom', cost:1800, comfort:+8, prestige:+3, relationship:+2, happiness:+3, minSource:['owner'] },
  { id:'gaming_setup', label:'Add Gaming Setup', cost:900, comfort:+7, prestige:+2, relationship:+1, happiness:+5, minSource:['rental','owner'] },
  { id:'garden_glow_up', label:'Improve Garden', cost:1400, comfort:+6, prestige:+4, relationship:+3, happiness:+3, minSource:['owner'] },
  { id:'home_gym', label:'Build Home Gym', cost:2600, comfort:+6, prestige:+4, relationship:+1, happiness:+4, minSource:['owner'] },
  { id:'luxury_renovation', label:'Luxury Renovation', cost:6500, comfort:+14, prestige:+10, relationship:+4, happiness:+6, minSource:['owner'] },
  { id:'nursery', label:'Create Nursery', cost:1200, comfort:+5, prestige:+3, relationship:+4, happiness:+3, minSource:['owner'] },
];

const HOME_TEMPLATES = {
  family: {
    lower: [
      { id:'family_council_flat', icon:'🏢', name:'Childhood Family Home', type:'Council Flat', prestige:12, comfort:34, maintenanceLevel:58, maxOccupants:4, monthlyCost:720, utilities:90, propertyValue:95000, locations:['Old Estate','Outer Estate'] },
      { id:'family_old_terrace', icon:'🏘️', name:'Childhood Family Home', type:'Old Terrace House', prestige:18, comfort:40, maintenanceLevel:56, maxOccupants:5, monthlyCost:780, utilities:95, propertyValue:115000, locations:['Backstreet Row','Red Brick Lane'] },
    ],
    working: [
      { id:'family_small_flat', icon:'🏢', name:'Childhood Family Home', type:'Small Flat', prestige:16, comfort:38, maintenanceLevel:56, maxOccupants:4, monthlyCost:760, utilities:95, propertyValue:110000, locations:['Station Quarter','Riverside Estate'] },
      { id:'family_modest_terrace', icon:'🏘️', name:'Childhood Family Home', type:'Terrace House', prestige:22, comfort:46, maintenanceLevel:52, maxOccupants:5, monthlyCost:860, utilities:105, propertyValue:145000, locations:['Maple Street','Foundry Row'] },
    ],
    middle: [
      { id:'family_semi_detached', icon:'🏡', name:'Childhood Family Home', type:'Semi-Detached House', prestige:36, comfort:58, maintenanceLevel:48, maxOccupants:5, monthlyCost:1120, utilities:130, propertyValue:235000, locations:['Willow Close','Elm Crescent'] },
      { id:'family_modern_home', icon:'🏠', name:'Childhood Family Home', type:'Comfortable Family Home', prestige:42, comfort:64, maintenanceLevel:45, maxOccupants:5, monthlyCost:1280, utilities:145, propertyValue:285000, locations:['Oakfield Rise','Kingfisher Park'] },
    ],
    upper_middle: [
      { id:'family_large_detached', icon:'🏡', name:'Childhood Family Home', type:'Large Detached House', prestige:60, comfort:76, maintenanceLevel:42, maxOccupants:6, monthlyCost:1850, utilities:190, propertyValue:460000, locations:['Rosewood Lane','Brookside Heights'] },
      { id:'family_luxury_apartment', icon:'🌆', name:'Childhood Family Home', type:'Luxury Apartment', prestige:66, comfort:74, maintenanceLevel:38, maxOccupants:5, monthlyCost:2100, utilities:220, propertyValue:520000, locations:['City Skyline','Harbour View'] },
    ],
    elite: [
      { id:'family_country_estate', icon:'🌳', name:'Childhood Family Home', type:'Countryside Mansion', prestige:88, comfort:90, maintenanceLevel:34, maxOccupants:7, monthlyCost:4200, utilities:380, propertyValue:1350000, locations:['Ashbourne Fields','Hawthorn Vale'] },
      { id:'family_gated_property', icon:'🏛️', name:'Childhood Family Home', type:'Gated Property', prestige:82, comfort:86, maintenanceLevel:35, maxOccupants:6, monthlyCost:3600, utilities:340, propertyValue:980000, locations:['Regency Gate','Cedar Park'] },
    ],
  },
  rentals: [
    { id:'rental_tiny_studio', icon:'🛋️', name:'Tiny Studio Flat', type:'Tiny Studio', prestige:18, comfort:40, maintenanceLevel:54, maxOccupants:1, monthlyCost:640, utilities:110, upfrontMonths:2, minAge:16, tier:'low' },
    { id:'rental_shared_flat', icon:'🧺', name:'Cheap Flatshare', type:'Shared Flat', prestige:16, comfort:42, maintenanceLevel:56, maxOccupants:3, monthlyCost:980, utilities:140, upfrontMonths:2, minAge:16, tier:'low', shared:true, roommates:1 },
    { id:'rental_student_house', icon:'🎓', name:'Shared Student House', type:'Student House', prestige:24, comfort:48, maintenanceLevel:52, maxOccupants:4, monthlyCost:1400, utilities:180, upfrontMonths:2, minAge:17, tier:'low', shared:true, roommates:2 },
    { id:'rental_apartment', icon:'🏙️', name:'Modern Apartment', type:'Apartment', prestige:42, comfort:62, maintenanceLevel:44, maxOccupants:2, monthlyCost:1480, utilities:165, upfrontMonths:2, minAge:18, tier:'mid' },
    { id:'rental_terrace_house', icon:'🏘️', name:'Terrace House Rental', type:'Terrace House', prestige:38, comfort:58, maintenanceLevel:46, maxOccupants:3, monthlyCost:1620, utilities:175, upfrontMonths:2, minAge:18, tier:'mid' },
    { id:'rental_semi_detached', icon:'🏠', name:'Semi-Detached Rental', type:'Semi-Detached Rental', prestige:48, comfort:66, maintenanceLevel:42, maxOccupants:4, monthlyCost:1960, utilities:190, upfrontMonths:2, minAge:21, tier:'mid' },
    { id:'rental_luxury_apartment', icon:'✨', name:'Luxury Apartment', type:'Luxury Apartment', prestige:72, comfort:82, maintenanceLevel:34, maxOccupants:2, monthlyCost:2850, utilities:250, upfrontMonths:2, minAge:21, tier:'high' },
    { id:'rental_penthouse', icon:'🌃', name:'Luxury Penthouse', type:'Penthouse', prestige:90, comfort:92, maintenanceLevel:30, maxOccupants:3, monthlyCost:4600, utilities:360, upfrontMonths:2, minAge:24, tier:'high' },
    { id:'rental_townhouse', icon:'🏛️', name:'Townhouse', type:'Townhouse', prestige:80, comfort:86, maintenanceLevel:32, maxOccupants:4, monthlyCost:3950, utilities:310, upfrontMonths:2, minAge:24, tier:'high' },
  ],
  ownership: [
    { id:'buy_starter_flat', icon:'🔑', name:'Starter Flat', type:'Starter Flat', prestige:34, comfort:56, maintenanceLevel:48, maxOccupants:2, propertyValue:145000, utilities:125, minAge:18 },
    { id:'buy_first_house', icon:'🏠', name:'First House', type:'Terrace House', prestige:46, comfort:64, maintenanceLevel:44, maxOccupants:3, propertyValue:255000, utilities:160, minAge:21 },
    { id:'buy_semi_detached', icon:'🏡', name:'Semi-Detached Home', type:'Semi-Detached Home', prestige:58, comfort:72, maintenanceLevel:40, maxOccupants:4, propertyValue:360000, utilities:190, minAge:22 },
    { id:'buy_luxury_townhouse', icon:'🏙️', name:'Luxury Townhouse', type:'Luxury Townhouse', prestige:78, comfort:84, maintenanceLevel:34, maxOccupants:4, propertyValue:690000, utilities:260, minAge:24 },
    { id:'buy_countryside_estate', icon:'🌳', name:'Countryside Estate', type:'Countryside Estate', prestige:90, comfort:92, maintenanceLevel:30, maxOccupants:6, propertyValue:1250000, utilities:360, minAge:28 },
    { id:'buy_modern_mansion', icon:'🏛️', name:'Modern Mansion', type:'Modern Mansion', prestige:95, comfort:95, maintenanceLevel:28, maxOccupants:6, propertyValue:1800000, utilities:420, minAge:30 },
  ],
  emergency: [
    { id:'emergency_friend_sofa', icon:'🛏️', name:'Friend\'s Sofa', type:'Staying With Friends', prestige:10, comfort:24, maintenanceLevel:60, maxOccupants:2, monthlyCost:120, utilities:0, minAge:16 },
    { id:'emergency_family_spare_room', icon:'🚪', name:'Spare Room', type:'Staying With Family', prestige:18, comfort:38, maintenanceLevel:54, maxOccupants:2, monthlyCost:80, utilities:0, minAge:16 },
    { id:'emergency_budget_room', icon:'🪟', name:'Temporary Accommodation', type:'Budget Room', prestige:8, comfort:20, maintenanceLevel:62, maxOccupants:1, monthlyCost:320, utilities:40, upfrontMonths:1, minAge:16 },
  ],
  homeless: {
    id:'homeless',
    icon:'🧳',
    name:'No Fixed Address',
    type:'Homeless',
    prestige:0,
    comfort:0,
    maintenanceLevel:100,
    maxOccupants:1,
    monthlyCost:0,
    utilities:0,
  },
};

function getAllHomeTemplates() {
  return [
    ...Object.values(HOME_TEMPLATES.family).flat(),
    ...HOME_TEMPLATES.rentals,
    ...HOME_TEMPLATES.ownership,
    ...HOME_TEMPLATES.emergency,
    HOME_TEMPLATES.homeless,
  ];
}

function getHomeTemplate(templateId) {
  return getAllHomeTemplates().find(template => template.id === templateId) || null;
}

function getHousemateTrait(traitId) {
  return HOUSEMATE_TRAITS_POOL.find(trait => trait.id === traitId) || null;
}

function getHomeUpgrade(upgradeId) {
  return HOME_UPGRADES.find(upgrade => upgrade.id === upgradeId) || null;
}

function homeMonthlyMortgage(value, deposit) {
  const principal = Math.max(0, value - deposit);
  return Math.round(principal / 300);
}

function pickFamilyHomeTemplate() {
  const familyTemplates = HOME_TEMPLATES.family[STATE.socialClass] || HOME_TEMPLATES.family.working;
  const parents = [STATE.family?.mum, STATE.family?.dad].filter(Boolean);
  const wealthBoost = parents.filter(parent => isHighPayingParentJob(parent.job)).length;
  if (familyTemplates.length === 1) return familyTemplates[0];
  if (wealthBoost >= 1 && Math.random() < 0.7) return familyTemplates[familyTemplates.length - 1];
  return pickRandom(familyTemplates);
}

function createHomeMemory() {}

function buildGeneratedResident(namePrefix = 'Housemate') {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = pickRandom(NAMES_UK[gender]);
  const surname = pickRandom(NAMES_UK.surnames);
  const appearance = generateAppearance(gender);
  const compatibility = randomStat(35, 82);
  const relationship = randomStat(35, 68);
  const socialStanding = randomStat(25, 75);
  const gradeScore = randomStat(35, 82);
  const roommate = {
    id: uid(),
    firstName,
    surname,
    gender,
    age: Math.max(18, STATE.age || 18),
    appearance,
    compatibility,
    socialStanding,
    gradeScore,
    relationship,
    status: 'friend',
    traits: sampleN(HOUSEMATE_TRAITS_POOL, 2).map(trait => trait.id),
  };
  return {
    id: roommate.id,
    refType: 'roommate',
    name: `${firstName} ${surname}`.trim(),
    role: namePrefix,
    relationship,
    contributionMonthly: Math.round(260 + Math.random() * 220),
    traits: roommate.traits,
    friendProfile: {
      ...roommate,
      npcStats: buildClassmateNpcStats(roommate),
    },
  };
}

function buildResidentFromFriend(friend) {
  return {
    id: uid(),
    refType: 'friend',
    refId: friend.id,
    name: `${friend.firstName} ${friend.surname || ''}`.trim(),
    role: 'Friend',
    relationship: friend.relationship ?? STATE.relationships.friends ?? 55,
    contributionMonthly: Math.round(240 + Math.random() * 260),
    traits: (friend.traits || []).slice(0, 2),
  };
}

function buildResidentFromSibling(sibling) {
  return {
    id: uid(),
    refType: 'sibling',
    refId: sibling.id,
    name: `${sibling.firstName} ${sibling.surname || STATE.surname}`.trim(),
    role: sibling.gender === 'male' ? 'Brother' : 'Sister',
    relationship: sibling.relationship ?? 55,
    contributionMonthly: Math.round(120 + Math.random() * 120),
    traits: (sibling.traits || []).slice(0, 2),
  };
}

function buildPartnerResident() {
  const partner = typeof getCurrentPartner === 'function' ? getCurrentPartner() : null;
  return {
    id: uid(),
    refType: 'partner',
    refId: partner?.id || '__partner__',
    name: partner ? `${partner.firstName} ${partner.surname || ''}`.trim() : (STATE._partnerName || 'Partner'),
    role: 'Partner',
    relationship: partner?.relationship ?? STATE.relationships.partner ?? 60,
    contributionMonthly: Math.round(320 + Math.random() * 260),
    traits: (partner?.traits || sampleN(HOUSEMATE_TRAITS_POOL, 2).map(trait => trait.id)).slice(0, 2),
    friendProfile: partner ? { ...partner } : null,
  };
}

function buildRentalHousehold(template) {
  if (!template.shared) return [];
  const count = template.roommates || Math.max(1, template.maxOccupants - 1);
  return Array.from({ length: count }, () => buildGeneratedResident('Roommate'));
}

function buildHomeRecord(template, overrides = {}) {
  return {
    id: overrides.id || uid(),
    templateId: template.id,
    icon: overrides.icon || template.icon,
    name: overrides.name || template.name,
    type: overrides.type || template.type,
    source: overrides.source || 'rental',
    ownershipStatus: overrides.ownershipStatus || 'renting',
    location: overrides.location || `${STATE.city.name} • ${pickRandom(template.locations || ['Town Centre', 'Northside', 'Southside'])}`,
    prestigeBase: overrides.prestigeBase ?? template.prestige,
    comfortBase: overrides.comfortBase ?? template.comfort,
    maintenanceLevel: overrides.maintenanceLevel ?? template.maintenanceLevel,
    maxOccupants: overrides.maxOccupants ?? template.maxOccupants,
    baseMonthlyCost: overrides.baseMonthlyCost ?? template.monthlyCost ?? 0,
    utilitiesMonthly: overrides.utilitiesMonthly ?? template.utilities ?? 0,
    propertyValue: overrides.propertyValue ?? template.propertyValue ?? 0,
    depositPaid: overrides.depositPaid ?? 0,
    remainingMortgage: overrides.remainingMortgage ?? 0,
    mortgageMonthly: overrides.mortgageMonthly ?? 0,
    cleanliness: overrides.cleanliness ?? randomStat(56, 84),
    maintenance: overrides.maintenance ?? randomStat(58, 86),
    overallCondition: overrides.overallCondition ?? randomStat(58, 86),
    movedInAge: overrides.movedInAge ?? STATE.age,
    yearsLived: overrides.yearsLived ?? 0,
    household: overrides.household || [],
    upgrades: overrides.upgrades || [],
    childhoodHome: !!overrides.childhoodHome,
    firstAdultHome: !!overrides.firstAdultHome,
    firstPurchase: !!overrides.firstPurchase,
    futureHooks: overrides.futureHooks || {},
    memories: overrides.memories || [],
  };
}

function buildChildhoodHome() {
  const template = pickFamilyHomeTemplate();
  return buildHomeRecord(template, {
    source: 'family',
    ownershipStatus: 'family',
    childhoodHome: true,
    location: `${STATE.city.name} • ${pickRandom(template.locations || ['Family Street'])}`,
    cleanliness: randomStat(50, 82),
    maintenance: randomStat(52, 80),
    overallCondition: randomStat(54, 82),
    futureHooks: {
      familyConflict: true,
      surpriseGuests: true,
      nostalgia: true,
    },
  });
}

function initializeHomeState() {
  if (!STATE.home) {
    const familyHome = buildChildhoodHome();
    STATE.home = {
      currentHomeId: familyHome.id,
      familyHomeId: familyHome.id,
      properties: [familyHome],
      lastForcedMoveReason: null,
      contributedBillsAge: null,
    };
  }
  ensureHomeState();
  return STATE.home;
}

function ensureHomeState() {
  if (!STATE?.home) return initializeHomeState();
  if (!Array.isArray(STATE.home.properties)) STATE.home.properties = [];
  STATE.home.properties = STATE.home.properties.map(home => ({
    household: [],
    upgrades: [],
    cleanliness: 65,
    maintenance: 65,
    overallCondition: 65,
    movedInAge: STATE.age,
    yearsLived: 0,
    ...home,
  }));
  if (!STATE.home.currentHomeId && STATE.home.properties[0]) STATE.home.currentHomeId = STATE.home.properties[0].id;
  if (!STATE.home.familyHomeId) {
    const familyHome = STATE.home.properties.find(home => home.childhoodHome || home.source === 'family');
    if (familyHome) STATE.home.familyHomeId = familyHome.id;
  }
  if (!STATE.home.properties.find(home => home.id === STATE.home.currentHomeId)) {
    const familyHome = getFamilyHome();
    STATE.home.currentHomeId = familyHome?.id || null;
  }
  if (!STATE.home.currentHomeId) {
    const fallback = buildChildhoodHome();
    STATE.home.properties.push(fallback);
    STATE.home.currentHomeId = fallback.id;
    STATE.home.familyHomeId = fallback.id;
  }
  recalculateHousingCosts();
  return STATE.home;
}

function getHomeById(homeId) {
  return STATE?.home?.properties?.find(home => home.id === homeId) || null;
}

function getCurrentHome() {
  ensureHomeState();
  return STATE.home.properties.find(home => home.id === STATE.home.currentHomeId) || null;
}

function getFamilyHome() {
  ensureHomeState();
  return STATE.home.properties.find(home => home.id === STATE.home.familyHomeId) || STATE.home.properties.find(home => home.childhoodHome || home.source === 'family') || null;
}

function getCurrentHomeResidents(home = getCurrentHome()) {
  if (!home) return [];
  if (home.source === 'family') {
    const residents = [];
    if (!['single_dad'].includes(STATE.family.situation) && STATE.family.mum?.alive !== false) {
      residents.push({
        id: STATE.family.mum.id,
        name: `${STATE.family.mum.firstName} ${STATE.family.mum.surname}`,
        role: 'Mother',
        relationship: STATE.family.mum.relationship ?? 60,
        traits: STATE.family.mum.traits || [],
        contributionMonthly: 0,
      });
    }
    if (!['single_mum', 'never_knew'].includes(STATE.family.situation) && STATE.family.dad?.alive !== false) {
      residents.push({
        id: STATE.family.dad.id,
        name: `${STATE.family.dad.firstName} ${STATE.family.dad.surname}`,
        role: 'Father',
        relationship: STATE.family.dad.relationship ?? 60,
        traits: STATE.family.dad.traits || [],
        contributionMonthly: 0,
      });
    }
    (STATE.family.siblings || []).forEach(sibling => {
      residents.push({
        id: sibling.id,
        name: `${sibling.firstName} ${sibling.surname || STATE.surname}`.trim(),
        role: sibling.gender === 'male' ? 'Brother' : 'Sister',
        relationship: sibling.relationship ?? 55,
        traits: sibling.traits || [],
        contributionMonthly: 0,
      });
    });
    return residents;
  }
  return [...(home.household || [])];
}

function getHouseholdResidentById(residentId, home = getCurrentHome()) {
  if (!home || !Array.isArray(home.household)) return null;
  return home.household.find(resident => resident.id === residentId) || null;
}

function getCurrentHomeOccupantCount(home = getCurrentHome()) {
  if (!home) return 1;
  return 1 + getCurrentHomeResidents(home).length;
}

function getHomeRelationshipAverage(home = getCurrentHome()) {
  const residents = getCurrentHomeResidents(home);
  if (!residents.length) return home.source === 'homeless' ? 0 : 60;
  return Math.round(residents.reduce((sum, resident) => sum + (resident.relationship ?? 55), 0) / residents.length);
}

function getHomeTraitMood(home = getCurrentHome()) {
  return getCurrentHomeResidents(home).reduce((sum, resident) => {
    return sum + (resident.traits || []).reduce((inner, traitId) => inner + (getHousemateTrait(traitId)?.mood || 0), 0);
  }, 0);
}

function getHomeTraitTension(home = getCurrentHome()) {
  return getCurrentHomeResidents(home).reduce((sum, resident) => {
    return sum + (resident.traits || []).reduce((inner, traitId) => inner + (getHousemateTrait(traitId)?.tension || 0), 0);
  }, 0);
}

function getHomeUpgradeEffects(home = getCurrentHome()) {
  return (home?.upgrades || []).reduce((totals, upgradeId) => {
    const upgrade = getHomeUpgrade(upgradeId);
    if (!upgrade) return totals;
    totals.comfort += upgrade.comfort || 0;
    totals.prestige += upgrade.prestige || 0;
    totals.relationship += upgrade.relationship || 0;
    totals.happiness += upgrade.happiness || 0;
    return totals;
  }, { comfort:0, prestige:0, relationship:0, happiness:0 });
}

function getHomeCostBreakdown(home = getCurrentHome()) {
  if (!home) return { grossMonthly:0, contributionsMonthly:0, playerMonthly:0, upkeepMonthly:0 };
  if (home.source === 'family') {
    return { grossMonthly:0, contributionsMonthly:0, playerMonthly:0, upkeepMonthly:0 };
  }
  const upkeepMonthly = home.source === 'owner'
    ? Math.round((home.propertyValue || 0) * 0.0012 / 12) + Math.round((home.maintenanceLevel || 0) * 0.5)
    : Math.round((home.maintenanceLevel || 0) * 0.2);
  const grossMonthly = (home.baseMonthlyCost || 0) + (home.utilitiesMonthly || 0) + (home.mortgageMonthly || 0) + upkeepMonthly;
  const contributionsMonthly = (home.source === 'family' ? 0 : (home.household || []).reduce((sum, resident) => sum + (resident.contributionMonthly || 0), 0));
  const playerMonthly = Math.max(0, grossMonthly - contributionsMonthly);
  return { grossMonthly, contributionsMonthly, playerMonthly, upkeepMonthly };
}

function getHomeSummary(home = getCurrentHome()) {
  if (!home) return null;
  const upgradeEffects = getHomeUpgradeEffects(home);
  const occupantCount = getCurrentHomeOccupantCount(home);
  const overcrowding = Math.max(0, occupantCount - (home.maxOccupants || 1));
  const relationAverage = getHomeRelationshipAverage(home) + upgradeEffects.relationship;
  const traitMood = getHomeTraitMood(home);
  const traitTension = getHomeTraitTension(home);
  const comfort = clamp((home.comfortBase || 0) + upgradeEffects.comfort - overcrowding * 14 + Math.round((home.cleanliness - 55) / 5), 0, 100);
  const prestige = clamp((home.prestigeBase || 0) + upgradeEffects.prestige + (home.source === 'owner' ? 6 : 0) - overcrowding * 5 + Math.round((home.overallCondition - 55) / 10), 0, 100);
  const cleanliness = clamp(home.cleanliness || 0);
  const maintenance = clamp(home.maintenance || 0);
  const overallCondition = clamp(Math.round(((home.overallCondition || 0) + cleanliness + maintenance) / 3));
  const tension = clamp(Math.round(
    overcrowding * 16 +
    Math.max(0, 50 - relationAverage) / 2 +
    Math.max(0, 45 - cleanliness) / 2 +
    Math.max(0, 45 - maintenance) / 2 +
    traitTension / 2
  ), 0, 100);
  const happinessImpact = home.source === 'homeless'
    ? -38
    : clamp(
        Math.round((comfort - 50) / 6 + (relationAverage - 50) / 9 + (prestige - 45) / 16 + traitMood / 6 - tension / 8 + upgradeEffects.happiness),
        -20,
        22
      );
  const stability = home.source === 'homeless'
    ? 0
    : clamp(
        Math.round(
          42 +
          (home.source === 'owner' ? 20 : 0) +
          (home.source === 'family' ? 8 : 0) +
          (home.source === 'emergency' ? -16 : 0) +
          (home.source === 'guest' ? -12 : 0) +
          (comfort - 50) / 4 +
          (overallCondition - 50) / 4 -
          overcrowding * 10
        )
      );
  const cost = getHomeCostBreakdown(home);
  const enjoyment = clamp(50 + (happinessImpact * 2) + Math.round((comfort - 50) / 3), 0, 100);
  return {
    comfort,
    prestige,
    enjoyment,
    relationAverage: clamp(relationAverage),
    cleanliness,
    maintenance,
    overallCondition,
    overcrowding,
    tension,
    happinessImpact,
    stability,
    occupantCount,
    cost,
  };
}

function recalculateHousingCosts() {
  const home = STATE?.home?.properties?.find(item => item.id === STATE.home.currentHomeId) || null;
  const breakdown = getHomeCostBreakdown(home);
  STATE.finances.expenses = breakdown.playerMonthly * 12;
  STATE.finances.housing = home?.name || 'housing';
}

function addHomeToHistory(home) {
  ensureHomeState();
  STATE.home.properties.push(home);
  return home;
}

function setCurrentHome(home, moveText, memoryKind = 'move') {
  ensureHomeState();
  const previousHome = getCurrentHome();
  if (previousHome?.id === home.id) return { ok:true, home };
  if (previousHome) previousHome.lastLeftAge = STATE.age;
  home.movedInAge = STATE.age;
  STATE.home.currentHomeId = home.id;
  recalculateHousingCosts();
  if (moveText) {
    logActivity(moveText, null);
  }
  return { ok:true, home };
}

function canMoveBackHome() {
  if (STATE.age < 16) return false;
  const familyHome = getFamilyHome();
  if (!familyHome) return false;
  const livingParents = [STATE.family?.mum, STATE.family?.dad].filter(Boolean).filter(parent => parent.alive !== false);
  if (!livingParents.length) return false;
  const familyRelationship = Math.round(
    livingParents.reduce((sum, parent) => sum + (parent.relationship ?? 60), 0) / livingParents.length
  );
  if (familyRelationship < 25) return false;
  const familyOccupants = getCurrentHomeResidents(familyHome).length + 1;
  return familyOccupants <= (familyHome.maxOccupants || 1);
}

function getBestFriendCandidate() {
  ensurePersistentFriendState();
  const pool = [
    ...(STATE.school?.classmates || []).filter(friend => friend.status === 'friend'),
    ...(STATE.social?.friends || []),
  ];
  return [...pool]
    .sort((a, b) => (b.relationship || 0) - (a.relationship || 0))
    .find(friend => (friend.relationship || 0) >= 58) || null;
}

function getBestSiblingCandidate() {
  return [...(STATE.family?.siblings || [])]
    .sort((a, b) => (b.relationship || 0) - (a.relationship || 0))
    .find(sibling => (sibling.relationship || 0) >= 55) || null;
}

function getEmergencyHousingOptions() {
  const options = [];
  if (STATE.age >= 16 && canMoveBackHome()) {
    options.push({ type:'move_back_home', label:'Move Back Home', detail:'Live with family again', monthlyCost:0, enabled:true });
  }
  const friend = getBestFriendCandidate();
  if (friend) {
    options.push({ type:'friend_sofa', label:`Stay With ${friend.firstName}`, detail:'Temporary sofa stay', monthlyCost:120, enabled:true, refId:friend.id });
  }
  const sibling = getBestSiblingCandidate();
  if (sibling) {
    options.push({ type:'sibling_spare_room', label:`Stay With ${sibling.firstName}`, detail:'Lean on family for a while', monthlyCost:80, enabled:true, refId:sibling.id });
  }
  const budgetRoom = HOME_TEMPLATES.emergency.find(template => template.id === 'emergency_budget_room');
  if (budgetRoom) {
    const upfront = budgetRoom.monthlyCost * (budgetRoom.upfrontMonths || 1);
    options.push({
      type:'budget_room',
      label:'Take Temporary Accommodation',
      detail:'Barely comfortable, but safe',
      monthlyCost:budgetRoom.monthlyCost,
      enabled:(STATE.finances.balance || 0) >= upfront,
      upfront,
      templateId:budgetRoom.id,
    });
  }
  return options;
}

function getRentalOptions() {
  return HOME_TEMPLATES.rentals.map(template => {
    const upfront = (template.monthlyCost + template.utilities) * (template.upfrontMonths || 2);
    const approval = Math.max(STATE.finances.income, STATE.finances.balance / 3);
    const enabled = STATE.age >= (template.minAge || 16) && approval >= template.monthlyCost * 8 && STATE.finances.balance >= upfront;
    return {
      ...template,
      upfront,
      enabled,
      playerMonthly: Math.max(0, getHomeCostBreakdown(buildHomeRecord(template, { household: buildRentalHousehold(template) })).playerMonthly),
    };
  });
}

function getPurchaseOptions() {
  return HOME_TEMPLATES.ownership.map(template => {
    const deposit = Math.round(template.propertyValue * 0.15);
    const monthlyMortgage = homeMonthlyMortgage(template.propertyValue, deposit);
    const approvalScore = (STATE.finances.income || 0) + (STATE.stats.rep || 0) * 400 + (STATE.finances.balance || 0) * 0.25;
    const enabled = STATE.age >= (template.minAge || 18)
      && STATE.finances.balance >= deposit
      && approvalScore >= template.propertyValue * 0.24;
    return { ...template, deposit, monthlyMortgage, enabled };
  });
}

function makeRentalHome(templateId) {
  const template = getHomeTemplate(templateId);
  if (!template) return null;
  return buildHomeRecord(template, {
    source: 'rental',
    ownershipStatus: 'renting',
    household: buildRentalHousehold(template),
    futureHooks: {
      landlord: true,
      neighbours: true,
      roommateDrama: !!template.shared,
      maintenanceIssues: true,
    },
  });
}

function moveIntoRental(templateId) {
  ensureHomeState();
  const template = getHomeTemplate(templateId);
  if (!template) return { ok:false, message:'Home not found.' };
  const upfront = (template.monthlyCost + template.utilities) * (template.upfrontMonths || 2);
  if (STATE.age < (template.minAge || 16)) return { ok:false, message:'Too young to move out yet.' };
  if (STATE.finances.balance < upfront) return { ok:false, message:'You cannot afford the upfront cost.' };
  const current = getCurrentHome();
  if (current?.source === 'owner') return { ok:false, message:'Sell your owned home before moving into a rental.' };
  STATE.finances.balance -= upfront;
  const newHome = addHomeToHistory(makeRentalHome(templateId));
  const isFirstAdultHome = !STATE.home.properties.some(home => home.id !== newHome.id && (home.source === 'rental' || home.source === 'owner' || home.source === 'guest' || home.source === 'emergency'));
  if (isFirstAdultHome) newHome.firstAdultHome = true;
  const text = isFirstAdultHome
    ? `Moved into your first place: ${newHome.name}.`
    : `Moved into ${newHome.name}.`;
  setCurrentHome(newHome, text, isFirstAdultHome ? 'first_home' : 'move');
  applyEffects({ happy:+5, rep:+2 });
  return { ok:true, message:`You moved into ${newHome.name}.` };
}

function buyHome(templateId) {
  ensureHomeState();
  const template = getHomeTemplate(templateId);
  if (!template) return { ok:false, message:'Home not found.' };
  const current = getCurrentHome();
  if (current?.source === 'owner') return { ok:false, message:'Sell your current owned home before buying another.' };
  const deposit = Math.round(template.propertyValue * 0.15);
  const monthlyMortgage = homeMonthlyMortgage(template.propertyValue, deposit);
  const approvalScore = (STATE.finances.income || 0) + (STATE.stats.rep || 0) * 400 + (STATE.finances.balance || 0) * 0.25;
  if (STATE.age < (template.minAge || 18)) return { ok:false, message:'You are too young for this purchase.' };
  if (STATE.finances.balance < deposit) return { ok:false, message:'You do not have the deposit.' };
  if (approvalScore < template.propertyValue * 0.24) return { ok:false, message:'You were not approved for a mortgage.' };
  STATE.finances.balance -= deposit;
  const newHome = addHomeToHistory(buildHomeRecord(template, {
    source: 'owner',
    ownershipStatus: 'owner',
    propertyValue: template.propertyValue,
    depositPaid: deposit,
    remainingMortgage: template.propertyValue - deposit,
    mortgageMonthly: monthlyMortgage,
    futureHooks: {
      maintenanceIssues: true,
      neighbours: true,
      renovations: true,
      familyGrowth: true,
    },
  }));
  const isFirstPurchase = !STATE.home.properties.some(home => home.id !== newHome.id && home.source === 'owner');
  if (isFirstPurchase) newHome.firstPurchase = true;
  const text = isFirstPurchase
    ? `Bought your first home: ${newHome.name}.`
    : `Bought ${newHome.name}.`;
  setCurrentHome(newHome, text, isFirstPurchase ? 'first_purchase' : 'purchase');
  applyEffects({ happy:+7, rep:+6 });
  return { ok:true, message:`You bought ${newHome.name}.` };
}

function moveBackHome() {
  ensureHomeState();
  const current = getCurrentHome();
  const home = getFamilyHome();
  if (current?.id === home?.id) return { ok:false, message:'You already live at home.' };
  if (current?.source === 'owner') return { ok:false, message:'Sell your owned home before moving back home.' };
  if (!canMoveBackHome()) return { ok:false, message:'Home is not available to you right now.' };
  setCurrentHome(home, 'Moved back home for a while.', 'return_home');
  applyEffects({ happy:+2, rep:-2 });
  return { ok:true, message:'You moved back home.' };
}

function contributeBillsAtHome() {
  ensureHomeState();
  const home = getCurrentHome();
  if (!home || home.source !== 'family') return { ok:false, message:'You are not living at home.' };
  if (STATE.age < 16) return { ok:false, message:'You are too young to contribute.' };
  if (STATE.home.contributedBillsAge === STATE.age) return { ok:false, message:'You already contributed this year.' };
  const amount = Math.min(250, Math.max(80, Math.round((STATE.finances.balance || 0) * 0.2)));
  if (STATE.finances.balance < amount) return { ok:false, message:'You do not have enough money.' };
  STATE.finances.balance -= amount;
  STATE.home.contributedBillsAge = STATE.age;
  if (STATE.family?.mum?.alive) STATE.family.mum.relationship = clamp((STATE.family.mum.relationship || 60) + 4);
  if (STATE.family?.dad?.alive) STATE.family.dad.relationship = clamp((STATE.family.dad.relationship || 60) + 4);
  syncSharedFamilyRelationshipFromParents();
  applyEffects({ rep:+1, happy:+1 });
  logActivity(`Contributed ${fmtMoney(amount)} towards bills at home.`, 4);
  return { ok:true, message:'You helped with the bills.' };
}

function stayWithFriend(friendId) {
  const friend = [...(STATE.school?.classmates || []), ...(STATE.social?.friends || [])].find(person => person.id === friendId);
  if (!friend || (friend.relationship || 0) < 55) return { ok:false, message:'That option is not available.' };
  const current = getCurrentHome();
  if (current?.source === 'owner') return { ok:false, message:'Sell your owned home before leaving it.' };
  const template = getHomeTemplate('emergency_friend_sofa');
  const home = addHomeToHistory(buildHomeRecord(template, {
    source: 'guest',
    ownershipStatus: 'guest',
    name: `${friend.firstName}'s Place`,
    location: `${STATE.city.name} • Friend's place`,
    household: [buildResidentFromFriend(friend)],
    futureHooks: { roommateDrama:true, financialPressure:true, familyConflict:false },
  }));
  setCurrentHome(home, `Started staying with ${friend.firstName}.`, 'temporary');
  applyEffects({ happy:-1 });
  return { ok:true, message:`You are staying with ${friend.firstName}.` };
}

function stayWithSibling(siblingId) {
  const sibling = (STATE.family?.siblings || []).find(person => person.id === siblingId);
  if (!sibling || (sibling.relationship || 0) < 55) return { ok:false, message:'That option is not available.' };
  const current = getCurrentHome();
  if (current?.source === 'owner') return { ok:false, message:'Sell your owned home before leaving it.' };
  const template = getHomeTemplate('emergency_family_spare_room');
  const home = addHomeToHistory(buildHomeRecord(template, {
    source: 'guest',
    ownershipStatus: 'guest',
    name: `${sibling.firstName}'s Spare Room`,
    location: `${STATE.city.name} • Family stay`,
    household: [buildResidentFromSibling(sibling)],
    futureHooks: { familyConflict:true, surpriseGuests:true },
  }));
  setCurrentHome(home, `Started staying with ${sibling.firstName}.`, 'temporary');
  applyEffects({ happy:-1 });
  return { ok:true, message:`You are staying with ${sibling.firstName}.` };
}

function takeTemporaryAccommodation() {
  const template = getHomeTemplate('emergency_budget_room');
  const upfront = (template.monthlyCost + template.utilities) * (template.upfrontMonths || 1);
  if (STATE.finances.balance < upfront) return { ok:false, message:'You cannot afford it.' };
  const current = getCurrentHome();
  if (current?.source === 'owner') return { ok:false, message:'Sell your owned home before leaving it.' };
  STATE.finances.balance -= upfront;
  const home = addHomeToHistory(buildHomeRecord(template, {
    source: 'emergency',
    ownershipStatus: 'temporary',
    futureHooks: { landlord:true, financialPressure:true, maintenanceIssues:true },
  }));
  setCurrentHome(home, 'Took temporary accommodation to stay afloat.', 'temporary');
  applyEffects({ happy:-5, health:-2 });
  return { ok:true, message:'You found temporary accommodation.' };
}

function moveInWithPartner() {
  const partner = typeof getCurrentPartner === 'function' ? getCurrentPartner() : null;
  if (!partner || (STATE.relationships.partner || 0) < 60) {
    return { ok:false, message:'You need a stronger relationship first.' };
  }
  const current = getCurrentHome();
  if (current?.ownershipStatus === 'partner') return { ok:false, message:'You already live with your partner.' };
  if (current?.source === 'owner') {
    const household = current.household || [];
    const alreadyThere = household.some(resident => resident.refType === 'partner');
    if (alreadyThere) return { ok:false, message:'Your partner already lives here.' };
    const capacity = current.maxOccupants || 2;
    if ((household.length + 2) > capacity) return { ok:false, message:'There is not enough room at home right now.' };
    household.push(buildPartnerResident());
    current.household = household;
    partner.livingTogether = true;
    partner.livesWithPlayer = true;
    applyEffects({ happy:+8, rep:+2 });
    return { ok:true, message:`${partner.firstName} moved in with you.` };
  }
  const template = getHomeTemplate('rental_apartment');
  const home = addHomeToHistory(buildHomeRecord(template, {
    source: 'guest',
    ownershipStatus: 'partner',
    name: `${partner.firstName}'s Apartment`,
    household: [buildPartnerResident()],
    baseMonthlyCost: 920,
    utilitiesMonthly: 120,
    futureHooks: { relationshipBreakdown:true, surpriseGuests:true, familyGrowth:true },
  }));
  partner.livingTogether = true;
  partner.livesWithPlayer = true;
  setCurrentHome(home, `Moved in with ${partner.firstName}.`, 'relationship');
  applyEffects({ happy:+8, rep:+2 });
  return { ok:true, message:`You moved in with ${partner.firstName}.` };
}

function cleanCurrentHome() {
  const home = getCurrentHome();
  if (!home || home.source === 'homeless') return { ok:false, message:'There is nothing to clean.' };
  if ((home.cleanliness || 0) >= 92) return { ok:false, message:'The place already feels clean.' };
  home.cleanliness = clamp((home.cleanliness || 0) + 24);
  home.overallCondition = clamp((home.overallCondition || 0) + 8);
  applyEffects({ happy:+2 });
  recalculateHousingCosts();
  return { ok:true, message:'Home cleaned.' };
}

function repairCurrentHome() {
  const home = getCurrentHome();
  if (!home || home.source === 'homeless') return { ok:false, message:'There is nothing to repair.' };
  if ((home.maintenance || 0) >= 90) return { ok:false, message:'Nothing urgent needs repairing.' };
  const cost = Math.max(60, Math.round((100 - (home.maintenance || 0)) * (home.source === 'owner' ? 12 : 6)));
  if (STATE.finances.balance < cost) return { ok:false, message:'You cannot afford the repair cost.' };
  STATE.finances.balance -= cost;
  home.maintenance = clamp((home.maintenance || 0) + 28);
  home.overallCondition = clamp((home.overallCondition || 0) + 16);
  applyEffects({ happy:+1 });
  recalculateHousingCosts();
  return { ok:true, message:'Home repaired.' };
}

function getAvailableUpgradesForCurrentHome() {
  const home = getCurrentHome();
  if (!home) return [];
  return HOME_UPGRADES.filter(upgrade => {
    if ((home.upgrades || []).includes(upgrade.id)) return false;
    if (!upgrade.minSource.includes(home.source === 'owner' ? 'owner' : (home.source === 'rental' ? 'rental' : home.source))) return false;
    return true;
  });
}

function applyHomeUpgradeById(upgradeId) {
  const home = getCurrentHome();
  const upgrade = getHomeUpgrade(upgradeId);
  if (!home || !upgrade) return { ok:false, message:'Upgrade unavailable.' };
  if ((home.upgrades || []).includes(upgrade.id)) return { ok:false, message:'Already upgraded.' };
  if (!upgrade.minSource.includes(home.source === 'owner' ? 'owner' : (home.source === 'rental' ? 'rental' : home.source))) {
    return { ok:false, message:'This home cannot support that upgrade.' };
  }
  if (STATE.finances.balance < upgrade.cost) return { ok:false, message:'You cannot afford that upgrade.' };
  STATE.finances.balance -= upgrade.cost;
  home.upgrades.push(upgrade.id);
  home.cleanliness = clamp((home.cleanliness || 0) + 10);
  home.maintenance = clamp((home.maintenance || 0) + 10);
  home.overallCondition = clamp((home.overallCondition || 0) + 14);
  applyEffects({ happy: upgrade.happiness || 0, rep: Math.round((upgrade.prestige || 0) / 2) });
  recalculateHousingCosts();
  return { ok:true, message:`${upgrade.label} added.` };
}

function inviteBestFriendToLive() {
  const home = getCurrentHome();
  if (!home || !['rental', 'owner'].includes(home.source)) return { ok:false, message:'You need your own place first.' };
  if (getCurrentHomeOccupantCount(home) >= (home.maxOccupants || 1)) return { ok:false, message:'There is no room.' };
  const friend = getBestFriendCandidate();
  if (!friend) return { ok:false, message:'No friend is close enough to ask.' };
  const alreadyThere = (home.household || []).some(resident => resident.refId === friend.id);
  if (alreadyThere) return { ok:false, message:'They already live here.' };
  home.household.push(buildResidentFromFriend(friend));
  recalculateHousingCosts();
  return { ok:true, message:`${friend.firstName} moved in.` };
}

function askResidentToLeave(residentId) {
  const home = getCurrentHome();
  if (!home || !Array.isArray(home.household)) return { ok:false, message:'Nobody to ask.' };
  const resident = home.household.find(person => person.id === residentId);
  if (!resident) return { ok:false, message:'Resident not found.' };
  home.household = home.household.filter(person => person.id !== residentId);
  applyEffects({ happy:-1 });
  recalculateHousingCosts();
  return { ok:true, message:`${resident.name} moved out.` };
}

function sellCurrentHome() {
  const home = getCurrentHome();
  if (!home || home.source !== 'owner') return { ok:false, message:'You do not own this home.' };
  const appreciation = 1 + Math.min(0.24, (home.yearsLived || 0) * 0.03);
  const saleValue = Math.round((home.propertyValue || 0) * appreciation);
  const equity = Math.max(0, saleValue - (home.remainingMortgage || 0));
  STATE.finances.balance += equity;
  home.soldAge = STATE.age;
  logActivity(`Sold ${home.name} and took away ${fmtMoney(equity)} in equity.`, equity);
  const fallback = canMoveBackHome()
    ? moveBackHome()
    : (getBestFriendCandidate() ? stayWithFriend(getBestFriendCandidate().id) : takeTemporaryAccommodation());
  return fallback.ok
    ? { ok:true, message:`Sold ${home.name}.` }
    : { ok:false, message:'Sold the home, but no fallback housing was available.' };
}

function becomeHomeless(reason = 'housing loss') {
  const template = HOME_TEMPLATES.homeless;
  const home = addHomeToHistory(buildHomeRecord(template, {
    source: 'homeless',
    ownershipStatus: 'homeless',
    location: `${STATE.city.name} • No fixed address`,
    cleanliness: 8,
    maintenance: 8,
    overallCondition: 8,
    futureHooks: { financialPressure:true, relationshipBreakdown:true, healthCrisis:true },
  }));
  setCurrentHome(home, 'You had nowhere stable to stay and became homeless.', 'crisis');
  STATE.home.lastForcedMoveReason = reason;
  return home;
}

function ensureHousingSafetyNet(reason = 'unstable housing') {
  if (canMoveBackHome()) return moveBackHome();
  const friend = getBestFriendCandidate();
  if (friend) return stayWithFriend(friend.id);
  const sibling = getBestSiblingCandidate();
  if (sibling) return stayWithSibling(sibling.id);
  const budgetRoom = getEmergencyHousingOptions().find(option => option.type === 'budget_room' && option.enabled);
  if (budgetRoom) return takeTemporaryAccommodation();
  becomeHomeless(reason);
  return { ok:true, message:'You became homeless.' };
}

function runAnnualHomeTick() {
  ensureHomeState();
  const home = getCurrentHome();
  if (!home) return;

  home.yearsLived = (home.yearsLived || 0) + 1;
  if (Array.isArray(home.household)) {
    home.household.forEach(resident => {
      if (resident.friendProfile && typeof ageNpcOneYear === 'function') {
        ageNpcOneYear(resident.friendProfile, { role: 'roommate', socialGroup: 'roommate' });
        resident.relationship = resident.friendProfile.relationship ?? resident.relationship;
      }
      if (resident.refType === 'friend' && resident.refId && typeof getPersistentFriendById === 'function') {
        const friend = getPersistentFriendById(resident.refId) || (STATE.school?.classmates || []).find(person => person.id === resident.refId);
        if (friend) resident.relationship = friend.relationship ?? resident.relationship;
      }
      if (resident.refType === 'sibling' && resident.refId) {
        const sibling = (STATE.family?.siblings || []).find(person => person.id === resident.refId);
        if (sibling) resident.relationship = sibling.relationship ?? resident.relationship;
      }
    });
  }
  if (home.source !== 'family') {
    home.cleanliness = clamp((home.cleanliness || 0) - randomStat(2, 8));
    home.maintenance = clamp((home.maintenance || 0) - randomStat(1, 6));
    home.overallCondition = clamp(Math.round(((home.cleanliness || 0) + (home.maintenance || 0) + (home.overallCondition || 0)) / 3) - randomStat(1, 4));
  }

  if (home.source === 'owner' && home.remainingMortgage > 0) {
    home.remainingMortgage = Math.max(0, home.remainingMortgage - (home.mortgageMonthly * 12));
  }

  const summary = getHomeSummary(home);
  const affordabilityThreshold = Math.max(400, summary.cost.playerMonthly * 2);
  if (!['family', 'homeless'].includes(home.source) && STATE.finances.balance < -affordabilityThreshold) {
    logActivity(`You could not keep up with the costs of ${home.name}.`, -12);
    applyEffects({ happy:-8, rep:-3 });
    ensureHousingSafetyNet('could_not_afford_home');
    recalculateHousingCosts();
    return;
  }

  if (home.source === 'homeless') {
    applyEffects({ happy:-18, health:-12, rep:-6 });
    if (STATE.career?.work) {
      STATE.career.work.performance = clamp((STATE.career.work.performance || 50) - 8);
      STATE.career.work.satisfaction = clamp((STATE.career.work.satisfaction || 50) - 6);
      STATE.career.work.stress = clamp((STATE.career.work.stress || 50) + 14);
    }
  } else {
    applyEffects({
      happy: Math.max(-8, Math.min(8, Math.round(summary.happinessImpact / 3))),
      health: summary.overallCondition < 35 ? -3 : summary.overallCondition > 75 ? 1 : 0,
      rep: summary.prestige >= 80 ? 1 : summary.prestige <= 15 ? -1 : 0,
    });
  }

  const familyHome = getFamilyHome();
  if (home.id === familyHome?.id && STATE.age >= 18 && !canMoveBackHome()) {
    logActivity('Home no longer felt stable, and you had to leave.', -10);
    ensureHousingSafetyNet('forced_out');
  }

  if (summary.overallCondition <= 18 && !['homeless', 'family'].includes(home.source)) {
    logActivity(`${home.name} became difficult to live in.`, -6);
    applyEffects({ happy:-5, health:-3 });
  }

  recalculateHousingCosts();
}
