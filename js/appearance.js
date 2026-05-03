function generateAppearance(gender) {
  return {
    seed: Math.random().toString(36).slice(2, 10),
    gender,
    skinTone: 'light',
    eyeColor: 'darkblue',
    hairColor: 'brown',
    bgColor: gender === 'female' ? 'purple' : 'yellow',
    outfitColor: gender === 'female' ? 'purple' : 'yellow',
  };
}

function getCharacterLayers(appearance, age) {
  const stage = age <= 3 ? 'baby' : age <= 11 ? 'child' : age <= 17 ? 'teen' : age <= 59 ? 'adult' : 'elder';
  const layers = [
    `data/characters/bg-${appearance.bgColor}.png`,
    `data/characters/${stage}-base-${appearance.skinTone}.png`,
    `data/characters/eyes-${appearance.eyeColor}.png`,
    `data/characters/outfit-${appearance.outfitColor}.png`,
  ];
  if (appearance.hairColor && stage !== 'baby') {
    layers.splice(3, 0, `data/characters/hair-${appearance.hairColor}-${stage}.png`);
  }
  return layers;
}

function getCharacterHTML(appearance, age, size = 70) {
  if (!appearance || !appearance.bgColor) {
    const params = new URLSearchParams({ seed: appearance.seed, backgroundColor: 'transparent' });
    return `<img src="https://api.dicebear.com/9.x/avataaars/svg?${params}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;display:block"/>`;
  }
  const layers = getCharacterLayers(appearance, age);
  return `
    <div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;border-radius:50%;overflow:hidden">
      ${layers.map(src => `<img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`).join('')}
    </div>`;
}

function getAvatarUrl(appearance) {
  const params = new URLSearchParams({ seed: appearance.seed, backgroundColor: 'transparent' });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

function getAvatarImg(appearance, size = 64) {
  return getCharacterHTML(appearance, 0, size);
}