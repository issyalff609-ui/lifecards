const EYE_COLORS = ['blue', 'brown', 'green'];
const HAIR_COLORS = ['black', 'blonde', 'brown'];
const BG_COLORS = { female: 'purple', male: 'yellow' };
const OUTFIT_COLORS = { female: 'purple', male: 'yellow' };

function normalizeAppearance(appearance = {}) {
  const gender = appearance.gender === 'female' ? 'female' : 'male';
  return {
    gender,
    skinTone: appearance.skinTone === '1' ? appearance.skinTone : '1',
    eyeColor: EYE_COLORS.includes(appearance.eyeColor) ? appearance.eyeColor : 'brown',
    hairColor: HAIR_COLORS.includes(appearance.hairColor) ? appearance.hairColor : 'brown',
    bgColor: appearance.bgColor || BG_COLORS[gender] || 'yellow',
    outfitColor: appearance.outfitColor || OUTFIT_COLORS[gender] || 'yellow',
    hairStyle: appearance.hairStyle || '1',
  };
}

function generateAppearance(gender) {
  return {
    gender,
    skinTone: '1',
    eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)],
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    bgColor: BG_COLORS[gender] || 'yellow',
    outfitColor: OUTFIT_COLORS[gender] || 'yellow',
    hairStyle: '1',
  };
}

function generateFamilyAppearance(gender, parentAppearances = []) {
  const app = generateAppearance(gender);
  if (parentAppearances.length > 0) {
    const donor = parentAppearances[Math.floor(Math.random() * parentAppearances.length)];
    if (donor.eyeColor) app.eyeColor = donor.eyeColor;
    if (Math.random() < 0.7) app.hairColor = donor.hairColor;
    if (Math.random() < 0.15) app.eyeColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
    if (Math.random() < 0.15) app.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
  }
  return app;
}

function getStageKey(age, gender) {
  if (age <= 3)  return 'baby';
  if (age <= 11) return gender === 'female' ? 'child_girl'       : 'child_boy';
  if (age <= 17) return gender === 'female' ? 'teen_girl'        : 'teen_boy';
  if (age <= 24) return gender === 'female' ? 'young_adult_girl' : 'young_adult_male';
  return gender === 'female' ? 'young_adult_girl' : 'young_adult_male';
}

function getCharacterLayers(appearance, age, options = {}) {
  const app = normalizeAppearance(appearance);
  const stage = getStageKey(age, app.gender);
  const isBaby = age <= 3;
  const layers = [];
  const stageFolders = {
    baby: '1. baby',
    child_boy: '2.1 child_boy',
    child_girl: '2.2 child_girl',
    teen_boy: '3.1 teen_boy TO ADD',
    teen_girl: '3.2 teen_girl',
    young_adult_male: '4.1 young_adult_boy',
    young_adult_girl: '4.2 young_adult_girl',
  };
  const stageFolder = stageFolders[stage];

  if (options.showBg !== false) {
    layers.push(`data/characters/bg-${app.bgColor}.png`);
  }

  if (isBaby) {
    layers.push(`data/characters/${stageFolder}/baby_base.png`);
  } else {
    layers.push(`data/characters/${stageFolder}/${stage}_base_${app.skinTone}.png`);
  }

  if (!isBaby && app.hairColor) {
    const adultHairStages = ['teen_boy', 'young_adult_male', 'young_adult_girl'];
    const hairFile = adultHairStages.includes(stage)
      ? `${stage}_hair_${app.hairColor}_${app.hairStyle}.png`
      : `${stage}_hair_${app.hairStyle}_${app.hairColor}.png`;
    layers.push(`data/characters/${stageFolder}/${hairFile}`);
  }

  if (isBaby) {
    layers.push(`data/characters/${stageFolder}/baby_eyes_${app.eyeColor}.png`);
  } else {
    layers.push(`data/characters/all/all_${app.eyeColor}_eyes.png`);
  }

  if (isBaby) {
    const outfitFile = app.outfitColor === 'yellow'
      ? 'baby_outfit_yellow.png.png'
      : `baby_outfit_${app.outfitColor}.png`;
    layers.push(`data/characters/${stageFolder}/${outfitFile}`);
  }

  return layers;
}

function getCharacterHTML(appearance, age, size = 70, options = {}) {
  if (!appearance) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--surface-mid)"></div>`;
  const layers = getCharacterLayers(appearance, age, options);
  return `
    <div class="character-avatar" style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;border-radius:50%;overflow:hidden">
      ${layers.map(src => `<img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.4);transform-origin:center" onerror="this.style.display='none'"/>`).join('')}
    </div>`;
}
