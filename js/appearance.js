// ═══════════════════════════════════════════════════════════
// JS / APPEARANCE.JS
// ═══════════════════════════════════════════════════════════

function generateAppearance(gender) {
  return { seed: Math.random().toString(36).slice(2, 10), gender };
}

function getAvatarUrl(appearance) {
  const params = new URLSearchParams({
    seed: appearance.seed,
    backgroundColor: 'transparent',
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

function getAvatarImg(appearance, size = 64) {
  const url = getAvatarUrl(appearance);
  return `<img src="${url}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:cover;display:block"/>`;
}