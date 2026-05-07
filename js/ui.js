// ═══════════════════════════════════════════════════════════
// UI.JS  —  all rendering, overlays, and game loop wiring
// ═══════════════════════════════════════════════════════════

// ── SAVE / LOAD ───────────────────────────────────────────
const SAVE_KEY = 'lifesim_v1';
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state: STATE, birthData: _birthData }));
  } catch(e) {}
}
function hasSavedGame() {
  return !!localStorage.getItem(SAVE_KEY);
}
function continueGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const { state, birthData } = JSON.parse(raw);
    STATE = state;
    _birthData = birthData;
    document.getElementById('screen-birth').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    updateAllUI();
  } catch(e) {
    showToast('Could not load save.');
  }
}
function newGame() {
  localStorage.removeItem(SAVE_KEY);
  document.getElementById('continue-banner').style.display = 'none';
  initBirth();
}

// ── BIRTH ─────────────────────────────────────────────────
let _birthData = null;
const SITUATION_TEXT = {
  happily_married:   () => `Your parents are happily married.`,
  married_struggling:() => `Your parents are still together.`,
  recently_divorced: () => `Your parents are not together.`,
  single_mum:        () => `Your mother is raising you on her own.`,
  single_dad:        () => `Your father is raising you on his own.`,
  never_knew:        () => `Your mother is raising you alone. You don't know who your father is.`,
};
function initBirth() {
  _birthData = null;
  document.getElementById('deal-name').textContent = '—';
  document.getElementById('deal-location').textContent = '—';
  document.getElementById('deal-trait-1').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('deal-trait-2').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('deal-trait-3').innerHTML = '<div class="birth-card-kicker">Trait</div><div class="birth-card-value">???</div>';
  document.getElementById('birth-start-actions').style.display = 'none';
  document.getElementById('roll-life-btn').style.display = 'block';
  document.getElementById('birth-deal-stack').classList.remove('has-life', 'is-rolling');
  const banner = document.getElementById('continue-banner');
  if (banner) banner.style.display = hasSavedGame() ? 'block' : 'none';
}
function createBirthData() {
  const gender     = Math.random() > 0.5 ? 'male' : 'female';
  const firstName  = pickRandom(NAMES_UK[gender]);
  const surname    = pickRandom(NAMES_UK.surnames);
  const city       = pickRandom(PLACES_UK.cities);
  const scClass    = weightedRandom(SOCIAL_CLASSES).id;
  const traits     = sampleN(PLAYER_TRAITS_POOL, 3).map(t => t.id);
  const month      = Math.floor(Math.random() * 12) + 1;
  const day        = Math.floor(Math.random() * 28) + 1;
  const sign       = getStarSign(day, month);
  const mumName    = pickRandom(NAMES_UK.female);
  const dadName    = pickRandom(NAMES_UK.male);
  const mumJob     = pickRandom(PARENT_JOBS[scClass]);
  const dadJob     = pickRandom(PARENT_JOBS[scClass]);
  const SITUATIONS = [
    { id:'happily_married',    weight:35 },
    { id:'married_struggling', weight:15 },
    { id:'recently_divorced',  weight:20 },
    { id:'single_mum',         weight:22 },
    { id:'single_dad',         weight:3  },
    { id:'never_knew',         weight:5  },
  ];
  const situation = weightedRandom(SITUATIONS).id;
  const sexuality = weightedRandom([
    { id:'heterosexual', weight:78 },
    { id:'bisexual', weight:14 },
    { id:'homosexual', weight:8 },
  ]).id;
  const numSiblings = weightedRandom([
    { v:0, weight:42 }, { v:1, weight:35 }, { v:2, weight:16 }, { v:3, weight:7 },
  ]).v;
  const siblings = Array.from({ length: numSiblings }, () => {
    const sg = Math.random() > 0.5 ? 'male' : 'female';
    const age = Math.floor(Math.random()*10) - 3;
    let siblingType = 'full';
    let familyStatus = null;
    if (age < 0 && ['single_mum','single_dad','never_knew'].includes(situation)) {
      siblingType = 'half';
    }
    if (age < 0 && situation === 'recently_divorced') {
      siblingType = Math.random() < 0.5 ? 'full' : 'half';
      if (siblingType === 'full') familyStatus = "It's complicated";
    }
    return { name: pickRandom(NAMES_UK[sg]), gender: sg, age, siblingType, familyStatus };
  });
  const hasPet    = Math.random() < 0.4;
  const petHint   = hasPet ? pickRandom([{ name:'a dog' }, { name:'a cat' }]) : null;
  return { gender, firstName, surname, city, socialClass:scClass, traits,
    birthday:{ day, month }, sign, mumName, dadName, mumJob, dadJob, situation, siblings, petHint, sexuality };
}
function renderBirthDeal() {
  const d = _birthData;
  document.getElementById('deal-name').textContent     = `${d.firstName} ${d.surname}`;
  document.getElementById('deal-location').textContent = d.city.region;
  const revealedTrait = PLAYER_TRAITS_POOL.find(x => x.id === d.traits[0]);
  document.getElementById('deal-trait-1').innerHTML = `
    <div class="birth-card-kicker">Trait revealed</div>
    <div class="birth-card-value">${revealedTrait.label}</div>`;
  [2, 3].forEach(i => {
    document.getElementById(`deal-trait-${i}`).innerHTML = `
      <div class="birth-card-kicker">Trait locked</div>
      <div class="birth-card-value">???</div>`;
  });
  document.getElementById('birth-deal-stack').classList.add('has-life');
  document.getElementById('birth-start-actions').style.display = 'grid';
  document.getElementById('roll-life-btn').style.display = 'none';
}
function rollLife() {
  const stack = document.getElementById('birth-deal-stack');
  const btn = document.getElementById('roll-life-btn');
  btn.disabled = true;
  stack.classList.remove('has-life');
  stack.classList.add('is-rolling');
  document.getElementById('birth-start-actions').style.display = 'none';
  setTimeout(() => {
    _birthData = createBirthData();
    renderBirthDeal();
    stack.classList.remove('is-rolling');
    btn.disabled = false;
  }, 650);
}
function reshuffleLife() {
  rollLife();
}
function buildBirthNarrative(d) {
  const currentSiblings = d.siblings.filter(s => s.age >= 0);
  const siblingText = currentSiblings.length === 0
    ? 'You have no siblings'
    : currentSiblings.length === 1
      ? `You have one sibling, ${currentSiblings[0].name}`
      : `You have ${currentSiblings.length} siblings: ${currentSiblings.map(s => s.name).join(', ')}`;
  const petText = d.petHint ? `Your family has ${d.petHint.name}.` : 'Your family does not have a pet.';
  let parentText = `Your mother is ${d.mumName}, a ${d.mumJob}, and your father is ${d.dadName}, a ${d.dadJob}.`;
  if (d.situation === 'single_mum' || d.situation === 'never_knew') {
    parentText = `Your mother is ${d.mumName}, a ${d.mumJob}.`;
  } else if (d.situation === 'single_dad') {
    parentText = `Your father is ${d.dadName}, a ${d.dadJob}.`;
  }
  return `You were born on the ${ordinal(d.birthday.day)} of ${MONTHS[d.birthday.month-1]} in ${d.city.name}, ${d.city.region}. ${SITUATION_TEXT[d.situation]()} ${parentText} ${siblingText}. ${petText}`;
}
function startGame() {
  if (!_birthData) {
    rollLife();
    return;
  }
  window._familySubTab = 'family';
  const d = _birthData;
  createNewLife({
    gender:d.gender, firstName:d.firstName, surname:d.surname,
    birthday:d.birthday, city:d.city, socialClass:d.socialClass,
    traits:d.traits, situation:d.situation,
    mumName:d.mumName, dadName:d.dadName, mumJob:d.mumJob, dadJob:d.dadJob, siblings:d.siblings, sexuality:d.sexuality,
  });
  STATE.starSign = d.sign;
  logActivity(buildBirthNarrative(d), null);
  document.getElementById('screen-birth').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  updateAllUI();
}

// ── TAB SWITCHING ─────────────────────────────────────────
let _currentTab = 'life';
let _lastRenderedAvatarAge = null;
let _lastRenderedAvatarStage = null;
function switchTab(tab, el) {
  _currentTab = tab;
  ['life','family','learn','activities'].forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    tabEl.style.display = t === tab ? (t === 'life' ? 'flex' : 'flex') : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('game-topbar-title').textContent = 'Life Cards';

  if (tab === 'family') renderFamilyTab();
  if (tab === 'learn')  renderLearnTab();
}

// ── LIFE TAB ──────────────────────────────────────────────
function updateAllUI() {
  updateLifeTab();
  updateNavLearnLabel();
  if (_currentTab === 'family') renderFamilyTab();
  if (_currentTab === 'learn')  renderLearnTab();
}
function updateNavLearnLabel() {
  const isWork = STATE.age >= 18;
  document.getElementById('nav-learn-label').textContent = isWork ? 'Work' : 'Learn';
  document.getElementById('nav-learn').querySelector('.icon').textContent = isWork ? 'work' : 'school';
}
function updateLifeTab() {
  const avatarEl = document.getElementById('profile-avatar');
  const avatarStage = getStageKey(STATE.age, STATE.gender);
  const spriteChanged = _lastRenderedAvatarStage !== null && _lastRenderedAvatarStage !== avatarStage;
  if (spriteChanged) avatarEl.classList.add('is-aging');
  avatarEl.innerHTML = getCharacterHTML(STATE.appearance, STATE.age, 56);
  _lastRenderedAvatarAge = STATE.age;
  _lastRenderedAvatarStage = avatarStage;
  if (spriteChanged) setTimeout(() => avatarEl.classList.remove('is-aging'), 520);
  document.getElementById('profile-name').textContent   = STATE.fullName;
  document.getElementById('badge-age').textContent      = `Age ${STATE.age}`;
  document.getElementById('badge-stage').textContent    = getProfileRoleLabel();
  document.getElementById('badge-sign').textContent     = `${STATE.starSign.symbol} ${STATE.starSign.sign}`;
  document.getElementById('topbar-nw-val').textContent = fmtMoney(STATE.finances.balance);
  const C  = 175.9;
  const si = LIFE_STAGES.findIndex(s => STATE.age <= s.maxAge);
  const lo = si > 0 ? LIFE_STAGES[si-1].maxAge : 0;
  const hi = LIFE_STAGES[si].maxAge === 999 ? 80 : LIFE_STAGES[si].maxAge;
  document.getElementById('avatar-ring').style.strokeDashoffset =
    C - Math.min((STATE.age - lo) / (hi - lo), 1) * C;
  renderStatGrid();
  renderActivityLog();
  renderReputationPanel();
}
function getProfileRoleLabel() {
  const schoolLevels = new Set(['pre', 'primary', 'secondary', 'college', 'uni']);
  if (STATE.age < 5) return 'Child';
  if (schoolLevels.has(STATE.school.level) && STATE.age < 22) return 'Student';
  if (STATE.career.job && STATE.career.job !== 'None') return STATE.career.job;
  return 'Unemployed';
}
function renderStatGrid() {
  const grid = document.getElementById('stat-grid'), age = STATE.age, s = STATE.stats;
  const stats = [];
  if (age >= 0) stats.push({ id:'health', label:'Health',    val:s.health, hub:'health' });
  if (age >= 0) stats.push({ id:'happy',  label:'Happiness', val:s.happy,  hub:'happy'  });
  if (age >= 0) stats.push({ id:'smarts', label:'Smarts',    val:s.smarts, hub:'smarts' });
  if (age >= 0) stats.push({ id:'looks',  label:'Looks',     val:s.looks,  hub:'looks'  });
  const iconMap = {
  health: { icon:'solar:heart-pulse-bold-duotone', bg:'#fee2e2', color:'#ef4444', fill:'#fba9a8' },
  happy:  { icon:'happy', bg:'#fffcd9', color:'#ffd52a', fill:'#ffd52a' },
  smarts: { icon:'smarts', bg:'#dbeafe', color:'#8fbffa', fill:'#8fbffa' },
  looks:  { icon:'looks', bg:'#fce7f3', color:'#ff89db', fill:'#ff89db' },
};
  if (!grid.dataset.ready) {
    grid.innerHTML = stats.map(st => {
      const ic = iconMap[st.id];
      return `
        <div class="stat-card" onclick="openStatSheet('${st.hub}')">
          <div class="stat-card-top">
            <div style="width:36px;height:36px;border-radius:99px;background:${ic.bg};display:flex;align-items:center;justify-content:center">
              ${ic.icon === 'smarts' ? '<span class="brain-icon"></span>'
    : ic.icon === 'happy' ? '<span class="sunny-icon"></span>'
    : ic.icon === 'looks' ? '<span class="looks-icon"></span>'
    : `<iconify-icon icon="${ic.icon}" style="font-size:20px;color:${ic.color}"></iconify-icon>`
  }
            </div>
            <span class="stat-card-arrow">›</span>
          </div>
          <div class="stat-card-val" data-stat-val="${st.id}">${st.val}</div>
          <div class="stat-card-label">${st.label}</div>
          <div class="stat-card-bar"><div class="stat-card-fill" data-stat="${st.id}" style="width:${clamp(st.val)}%;background:${ic.fill}"></div></div>
        </div>`;
    }).join('');
    grid.dataset.ready = 'true';
  }
  stats.forEach(st => {
    const valEl = grid.querySelector(`[data-stat-val="${st.id}"]`);
    const fillEl = grid.querySelector(`.stat-card-fill[data-stat="${st.id}"]`);
    if (valEl) valEl.textContent = st.val;
    if (fillEl) {
      fillEl.style.width = `${clamp(st.val)}%`;
      fillEl.style.background = iconMap[st.id].fill;
    }
  });
}
function repLabel(value) {
  if (value <= -60) return 'Notorious';
  if (value < -15)  return 'Dubious';
  if (value <= 15)  return 'Neutral';
  if (value < 60)   return 'Respected';
  return 'Honourable';
}
function renderReputationPanel() {
  const panel = document.getElementById('reputation-panel');
  if (!panel) return;
  const rep = clamp(STATE.stats.rep || 0, -100, 100);
  const positiveFill = rep > 0 ? rep / 2 : 0;
  const negativeFill = rep < 0 ? Math.abs(rep) / 2 : 0;
  if (!panel.dataset.ready) {
    panel.innerHTML = `
      <img src="data/characters/all/angel.png" style="width:32px;height:32px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'"/>
      <div class="honour-track">
        <div id="honour-positive-fill" style="position:absolute;left:0;right:0;top:0;background:linear-gradient(to top, #facc15 0%, #22c55e 100%);"></div>
        <div id="honour-negative-fill" style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(to bottom, #fb923c 0%, #ef4444 100%);"></div>
        <div id="honour-marker" class="honour-marker"></div>
      </div>
      <img src="data/characters/all/devil.png" style="width:32px;height:32px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'"/>`;
    panel.dataset.ready = 'true';
  }
  const positiveEl = document.getElementById('honour-positive-fill');
  const negativeEl = document.getElementById('honour-negative-fill');
  const marker = document.getElementById('honour-marker');
  if (positiveEl) {
    positiveEl.style.top = `calc(50% - ${positiveFill}%)`;
    positiveEl.style.height = `${positiveFill}%`;
  }
  if (negativeEl) {
    negativeEl.style.bottom = '0';
    negativeEl.style.height = `${negativeFill}%`;
  }
  if (marker) marker.style.bottom = `calc(50% - 4px)`;
}
function getActivityIcon(text) {
  if (/school|class|grade|study|learn|exam|spelling/i.test(text)) return '📚';
  if (/friend|chat|classmate/i.test(text))                        return '👥';
  if (/mum|dad|parent|family|sibling|brother|sister/i.test(text)) return '🏠';
  if (/job|work|career|salary|pay|hustle/i.test(text))            return '💼';
  if (/pet|dog|cat|puppy/i.test(text))                            return '🐾';
  if (/born|birth|hospital/i.test(text))                          return '👶';
  if (/gym|run|health|sport|fit/i.test(text))                     return '🏃';
  if (/money|£|bank|invest/i.test(text))                          return '💰';
  if (/holiday|travel/i.test(text))                               return '✈️';
  if (/book|read|library/i.test(text))                            return '📖';
  return '✦';
}
function renderActivityLog() {
  const list = document.getElementById('activity-list');
  if (!STATE.activity.length) {
    list.innerHTML = '<div class="activity-empty">Nothing yet. Your life is just beginning.</div>';
    return;
  }
  const grouped = new Map();
  STATE.activity.slice(0, 20).forEach(a => {
    if (!grouped.has(a.age)) grouped.set(a.age, []);
    grouped.get(a.age).push(a);
  });
  list.innerHTML = Array.from(grouped.entries()).map(([age, entries]) => `
    <div class="life-log-divider">Age ${age}</div>
    ${entries.map(a => `
      <div class="life-log-item">
        <div class="life-log-body">
          <div class="life-log-text">${a.text}</div>
        </div>
      </div>`).join('')}
  `).join('');
}

// ── STAT SHEET ────────────────────────────────────────────
function openStatSheet(hub) {
  const labels = { popularity:'🔥 Popularity', smarts:'🧠 Smarts', looks:'✨ Looks', health:'❤️ Health', happy:'😊 Happiness', rep:'⭐ Reputation' };
  const vals   = { popularity:STATE.stats.popularity, smarts:STATE.stats.smarts, looks:STATE.stats.looks, health:STATE.stats.health, happy:STATE.stats.happy, rep:STATE.stats.rep };
  const actionMap = { popularity:[], smarts:ACTIONS.smarts, looks:ACTIONS.looks, health:ACTIONS.health, happy:ACTIONS.happy, rep:ACTIONS.rep };
  const acts = actionMap[hub] || [];
  document.getElementById('event-inner').innerHTML = `
    <div class="hub-hero"><div class="hub-hero-label">${labels[hub]}</div><div class="hub-hero-val">${vals[hub]}</div><div class="hub-hero-sub">out of 100</div></div>
    <div class="section-title">Actions</div>
    <div class="action-list">${acts.map(a => buildActionHTML(a)).join('')}</div>`;
  wireActions(document.getElementById('event-inner'), acts, () => {
    updateAllUI();
    openStatSheet(hub);
  });
  document.getElementById('event-overlay').classList.add('open');
}
function closeEventOverlay() {
  document.getElementById('event-overlay').classList.remove('open');
}

// ── FAMILY TAB ────────────────────────────────────────────
function renderFamilyTab() {
  const currentSubTab = window._familySubTab || 'family';
  document.getElementById('family-tab-bar').innerHTML = ['Family','Partner','Friends','Quick Contact']
    .map((label, i) => {
      const key = ['family','partner','friends','quick'][i];
      return `<button class="family-subtab ${currentSubTab === key ? 'active' : ''}" onclick="switchFamilyTab('${key}')">${label}</button>`;
    }).join('');
  if (currentSubTab === 'family')  renderFamilyPeople();
  if (currentSubTab === 'partner') renderFamilyPartner();
  if (currentSubTab === 'friends') renderFamilyFriends();
  if (currentSubTab === 'quick')   renderFamilyQuick();
}
function switchFamilyTab(key) {
  window._familySubTab = key;
  renderFamilyTab();
}
function renderFamilyPeople() {
  const people = [];
  if (!['single_dad'].includes(STATE.family.situation))
    people.push({ person:STATE.family.mum, role:'Mother', rel:STATE.family.mum.relationship ?? STATE.relationships.family, traitPool:PARENT_TRAITS_POOL });
  if (!['single_mum','never_knew'].includes(STATE.family.situation))
    people.push({ person:STATE.family.dad, role:'Father', rel:STATE.family.dad.relationship ?? STATE.relationships.family, traitPool:PARENT_TRAITS_POOL });
  STATE.family.siblings.forEach(s =>
    people.push({ person:s, role:s.gender==='male'?'Brother':'Sister', rel:s.relationship||60, traitPool:CLASSMATE_TRAITS_POOL }));
  STATE.family.pets.filter(p => !p.dead).forEach(p =>
    people.push({ person:{...p, firstName:p.name, traits:[]}, role:'Pet', rel:p.happiness, traitPool:[] }));
  document.getElementById('family-tab-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">Immediate Family</span>
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">${people.length} contacts</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${people.map(({ person, role, rel, traitPool }) => buildPersonCard(person, role, rel, traitPool)).join('')}
    </div>
    <div class="family-find-card" onclick="showToast('Coming soon!')">
      <span style="font-size:18px">＋</span>
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Find Extended Family</span>
    </div>`;
}
function renderFamilyPartner() {
  const r = STATE.relationships;
  document.getElementById('family-tab-content').innerHTML = r.partner > 0 && STATE._partnerName
    ? `<div style="display:flex;flex-direction:column;gap:8px">${buildPersonCard({ firstName:STATE._partnerName, emoji:'💑', id:'__partner__', traits:[] }, 'Partner', r.partner, [])}</div>`
    : buildEmptyState('💑', 'No partner yet.', 'Download a dating app. You never know.');
}
function renderFamilyFriends() {
  const friends = STATE.school.classmates.filter(c => c.status === 'friend');
  document.getElementById('family-tab-content').innerHTML = friends.length
    ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
         <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">Friends</span>
         <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">${friends.length} contacts</span>
       </div>
       <div style="display:flex;flex-direction:column;gap:8px">
         ${friends.map(c => buildPersonCard(c, 'Friend', c.relationship, CLASSMATE_TRAITS_POOL)).join('')}
       </div>`
    : buildEmptyState('👥', 'No friends yet.', 'Make your first friend at school.');
}
function renderFamilyQuick() {
  document.getElementById('family-tab-content').innerHTML = `
    <div class="section-title">Quick Contact</div>
    <div class="action-list" id="quick-contact-actions">
      ${FAMILY_ACTIONS.map(a => buildActionHTML(a)).join('')}
    </div>`;
  wireActions(document.getElementById('quick-contact-actions'), FAMILY_ACTIONS, () => {
    updateAllUI();
    renderFamilyTab();
  });
}

// ── PERSON CARD BUILDERS ──────────────────────────────────
let _expandedCardId = null;

function buildPersonCardAvatar(person) {
  const accent = familyRoleAccent(person._roleCard || person._role || '');
  const content = person.appearance
    ? getCharacterHTML(person.appearance, person.age || STATE.age, 52, { showBg: false })
    : `<span style="font-size:26px">${person.emoji || '👤'}</span>`;
  return `<div class="person-avatar-sq" style="border:2px solid ${accent.outline};box-shadow:0 0 0 3px ${accent.ring}">${content}</div>`;
}

function buildPersonCardRelBar(rel) {
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
      <div style="flex:1;height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden">
        <div style="width:${rel}%;height:100%;background:#74b551;border-radius:99px"></div>
      </div>
      <span style="font-family:var(--mono);font-size:11px;color:#74b551;font-weight:700">${rel}%</span>
    </div>`;
}

function buildPersonCardTraits(person, traitPool) {
  return (person.traits || []).slice(0, 2).map(tid => {
    const t = traitPool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.label}</span>`;
  }).join('');
}

function familyRoleAccent(role) {
  if (role === 'Mother') return { outline:'rgba(233, 136, 154, 0.55)', ring:'rgba(233, 136, 154, 0.1)', icon:'#cc6f82', bg:'#fff4f6' };
  if (role === 'Father') return { outline:'rgba(103, 190, 217, 0.55)', ring:'rgba(103, 190, 217, 0.1)', icon:'#5a86be', bg:'#f3f8fd' };
  if (role === 'Brother' || role === 'Sister') return { outline:'rgba(173, 149, 196, 0.55)', ring:'rgba(173, 149, 196, 0.1)', icon:'#8b70b0', bg:'#f8f4fc' };
  return { outline:'rgba(217, 203, 186, 0.65)', ring:'rgba(217, 203, 186, 0.1)', icon:'#8b7f73', bg:'#fff9ef' };
}

function buildSpeechBubbleIcon(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 26 26" aria-hidden="true">
    <path fill="${color}" d="M13 .188C5.924.188.187 5.252.187 11.5c0 3.177 1.488 6.039 3.876 8.094c-.521 3.009-3.887 4.234-3.657 5.062c3.01 1.245 8.971-1.645 9.875-2.093c.874.166 1.789.25 2.719.25c7.076 0 12.813-5.065 12.813-11.313S20.075.187 13 .187z"></path>
  </svg>`;
}

function buildDotsIcon(color = '#5f5145') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="${color}"></circle>
    <circle cx="8" cy="8" r="1.5" fill="${color}"></circle>
    <circle cx="13" cy="8" r="1.5" fill="${color}"></circle>
  </svg>`;
}

function buildPersonCardExpandedBody(person, role, rel, traitPool) {
  const traits = buildPersonCardTraits(person, traitPool);
  const actions = getAvailableActions(role, STATE.age, person);
  const actionButtons = actions.map(action => `
    <button onclick="triggerAction('${action.id}', '${person.id}', '${role}')"
      style="width:100%;padding:11px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:11px;font-size:13px;font-weight:600;color:var(--text);text-align:left;cursor:pointer">
      ${action.name}
    </button>
  `).join('');
  
  return `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted)">Relationship</span>
        <span style="font-family:var(--mono);font-size:12px;font-weight:700;color:#74b551">${rel}%</span>
      </div>
      <div style="width:100%;height:8px;background:#e8e2d8;border-radius:99px;overflow:hidden;margin-bottom:14px">
        <div style="width:${rel}%;height:100%;background:#74b551;border-radius:99px"></div>
      </div>
      ${actionButtons ? `<div style="display:flex;flex-direction:column;gap:8px">${actionButtons}</div>` : ''}
    </div>`;
}



function buildPersonCard(person, role, rel, traitPool) {
  person._roleCard = role;
  const isExpanded = _expandedCardId === person.id;
  const avatar     = buildPersonCardAvatar(person);
  const relBar     = !isExpanded ? buildPersonCardRelBar(rel) : '';
  const expanded   = isExpanded  ? buildPersonCardExpandedBody(person, role, rel, traitPool) : '';
  const traits     = buildPersonCardTraits(person, traitPool);
  const rawName    = `${person.firstName}${person.surname ? ' ' + person.surname : ''}`;
  const fullName   = (role === 'Friend' || role === 'classmate') ? classmateDisplayName(person) : rawName;
  const accent     = familyRoleAccent(role);
  const ageLabel   = person.age !== undefined ? ` <strong style="font-weight:800;color:var(--text)">•</strong> <strong style="font-weight:800;color:var(--text)">Age ${person.age}</strong>` : '';
  return `
    <div class="person-card" style="flex-direction:column;align-items:stretch;gap:0;cursor:default">
      <div style="display:flex;align-items:center;gap:14px">
        ${avatar}
        <div style="flex:1;min-width:0">
          <div style="font-size:17px;font-weight:800;letter-spacing:-.02em">${fullName}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px"><strong style="font-weight:800;color:var(--text)">${role}</strong>${ageLabel}</div>
          ${traits ? `<div class="trait-pills" style="margin-top:8px">${traits}</div>` : ''}
          ${relBar}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button onclick="togglePersonCard('${person.id}')"
            style="width:38px;height:38px;border-radius:99px;background:${accent.bg};border:1px solid ${accent.outline};box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildSpeechBubbleIcon(accent.icon)}</button>
          <button onclick="openPersonSheet('${person.id}','${role}')"
            style="width:38px;height:38px;border-radius:99px;background:#fff8ea;border:1px solid #e7d7bf;box-shadow:0 3px 10px rgba(26,24,20,.08);display:flex;align-items:center;justify-content:center;cursor:pointer">${buildDotsIcon()}</button>
        </div>
      </div>
      ${expanded}
    </div>`;
}

function togglePersonCard(personId) {
  _expandedCardId = _expandedCardId === personId ? null : personId;
  renderFamilyTab();
}
function buildEmptyState(emoji, title, subtitle) {
  return `<div class="placeholder-tab">
    <div style="font-size:40px">${emoji}</div>
    <div style="font-size:15px;font-weight:700;color:var(--text)">${title}</div>
    <div style="font-size:13px;color:var(--text-faint)">${subtitle}</div>
  </div>`;
}
function educationLevelForAge(age) {
  if (age < 5)  return 'Pre-school';
  if (age < 12) return 'Primary school';
  if (age < 17) return 'Secondary school';
  if (age < 19) return 'Sixth form / college';
  if (age < 22) return 'University age';
  return 'Finished education';
}
function compatibilityFor(person) {
  if (person.compatibility !== undefined) return person.compatibility;
  const seed = `${person.firstName || ''}${person.surname || ''}${person.age || 0}`.split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return 35 + (seed % 55);
}
function openPersonSheet(personId, role) {
  let person = null;
  if (personId === STATE.family.mum.id)
    person = { ...STATE.family.mum, _role:'Mother', _rel:STATE.family.mum.relationship ?? STATE.relationships.family };
  else if (personId === STATE.family.dad.id)
    person = { ...STATE.family.dad, _role:'Father', _rel:STATE.family.dad.relationship ?? STATE.relationships.family };
  else {
    const sib = STATE.family.siblings.find(s => s.id === personId);
    if (sib) person = { ...sib, _role:role, _rel:sib.relationship||60 };
    const cm  = STATE.school.classmates.find(c => c.id === personId);
    if (cm)  person = { ...cm,  _role:role, _rel:cm.relationship };
    const teacher = STATE.school.teachers.find(t => t.id === personId);
    if (teacher) person = { ...teacher, _role:'Teacher', _rel:teacher.npcStats?.warmth ?? 50 };
    const pet = STATE.family.pets.find(p => p.id === personId);
    if (pet) person = { ...pet, _role:'Pet', _rel:pet.happiness, isPet:true };
  }
  if (!person) return;
  const traitsHTML = buildPersonSheetTraits(person, role);
  const avatarHTML = buildPersonSheetAvatar(person);
  const detailsHTML = buildPersonSheetDetails(person, role);
  const statsHTML = buildPersonSheetStats(person, role);
  const actionsHTML = buildPersonSheetActions(person, role, personId);
  const relLabel = role === 'Teacher' ? 'Warmth' : 'Relationship';
  const displayName = (role === 'Friend' || role === 'classmate') ? classmateDisplayName(person) : `${person.firstName}${person.surname ? ' '+person.surname : ''}`;
  document.getElementById('person-inner').innerHTML = `
    <div class="person-profile-header">
      <div class="person-profile-emoji">${avatarHTML}</div>
      <div style="flex:1">
        <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">${displayName}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${person._role}${person.job ? ' · '+person.job : ''}</div>
        <div class="rel-bar-wrap" style="margin-top:6px">
          <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px">${relLabel}</div>
          <div class="rel-bar"><div class="rel-fill" style="width:${person._rel}%"></div></div>
          <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${person._rel}</span>
        </div>
      </div>
    </div>
    ${person.gradeScore !== undefined ? `<div style="font-size:12px;color:var(--text-muted)">Grade: <strong style="color:${gradeColor(person.grade)}">${person.grade}</strong> · Compatibility: ${person.compatibility}%</div>` : ''}
    ${detailsHTML}
    ${statsHTML}
    ${traitsHTML ? `<div class="trait-pills">${traitsHTML}</div>` : ''}
    ${actionsHTML}`;
  if (person.isPet) {
    wireActions(document.getElementById('person-inner'), PET_ACTIONS, () => {
      updateAllUI();
      renderFamilyTab();
      openPersonSheet(personId, role);
    }, personId);
  }
  if (role === 'Mother' || role === 'Father' || role === 'Brother' || role === 'Sister' || role === 'Friend' || role === 'classmate') {
    document.getElementById('person-inner').querySelectorAll('.action-card:not(.locked)').forEach(el => {
      const actionId = el.dataset.id;
      el.onclick = () => {
        triggerAction(actionId, personId, role);
        openPersonSheet(personId, role);
      };
    });
  }
  document.getElementById('person-overlay').classList.add('open');
}

function buildPersonSheetAvatar(person) {
  return person.appearance
    ? getCharacterHTML(person.appearance, person.age || STATE.age, 70, { showBg: false })
    : `<span style="font-size:44px">${person.emoji || '👤'}</span>`;
}

function buildPersonSheetTraits(person, role) {
  return (person.traits || []).map(tid => {
    const pool = person.isPet ? []
      : role === 'Mother' || role === 'Father' ? PARENT_TRAITS_POOL : CLASSMATE_TRAITS_POOL;
    const t = pool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.emoji || ''} ${t.label}</span>`;
  }).join('');
}

function npcStatConfigFor(role, person) {
  if (role === 'Mother' || role === 'Father') {
    return [
      ['Looks', person.npcStats?.looks, '#ec4899'],
      ['Smarts', person.npcStats?.smarts, '#3b82f6'],
      ['Warmth', person.npcStats?.warmth, '#f59e0b'],
      ['Generosity', person.npcStats?.generosity, '#22c55e'],
    ];
  }
  if (role === 'Brother' || role === 'Sister') {
    return [
      ['Looks', person.npcStats?.looks, '#ec4899'],
      ['Smarts', person.npcStats?.smarts, '#3b82f6'],
      ['Warmth', person.npcStats?.warmth, '#f59e0b'],
      ['Trouble', person.npcStats?.trouble, '#dc2626'],
    ];
  }
  if (role === 'Friend' || role === 'classmate') {
    return [
      ['Popularity', person.npcStats?.popularity, '#8b5cf6'],
      ['Looks', person.npcStats?.looks, '#ec4899'],
      ['Smarts', person.npcStats?.smarts, '#3b82f6'],
      ['Reputation', person.npcStats?.reputation, '#22c55e'],
    ];
  }
  if (role === 'Teacher') {
    return [
      ['Looks', person.npcStats?.looks, '#ec4899'],
      ['Smarts', person.npcStats?.smarts, '#3b82f6'],
      ['Warmth', person.npcStats?.warmth, '#f59e0b'],
      ['Strictness', person.npcStats?.strictness, '#dc2626'],
    ];
  }
  return [];
}

function buildPersonSheetStats(person, role) {
  const stats = npcStatConfigFor(role, person).filter(([, value]) => value !== undefined);
  if (!stats.length) return '';
  return `
    <div class="detail-card">
      ${stats.map(([label, value, color]) => `
        <div style="display:flex;flex-direction:column;gap:6px;padding:6px 0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="detail-label">${label}</span>
            <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${value}%</span>
          </div>
          <div style="height:7px;background:var(--surface-mid);border-radius:99px;overflow:hidden">
            <div style="width:${value}%;height:100%;background:${color};border-radius:99px"></div>
          </div>
        </div>`).join('')}
    </div>`;
}

function buildPersonSheetDetails(person, role) {
  const rows = [];
  if (person.age !== undefined) rows.push(['Age', person.age]);
  if (role === 'Mother' || role === 'Father') {
    rows.push(['Job', person.job || 'None']);
    rows.push(['Marital status', STATE.family.maritalStatus || maritalStatusForSituation(STATE.family.situation)]);
  }
  if (role === 'Brother' || role === 'Sister') {
    rows.push(['Education', educationLevelForAge(person.age)]);
    rows.push(['Sibling type', person.siblingType === 'half' ? 'Half sibling' : 'Full sibling']);
    if (person.familyStatus) rows.push(['Family status', person.familyStatus]);
  }
  if (role === 'Teacher') {
    rows.push(['Subject', person.subject || 'Unknown']);
    rows.push(['Title', person.title || 'Teacher']);
  }
  if (!person.isPet && role !== 'Teacher') rows.push(['Compatibility', `${compatibilityFor(person)}%`]);
  if (!rows.length) return '';
  return `
    <div class="detail-card">
      ${rows.map(([label, value]) => `
        <div class="detail-row">
          <span class="detail-label">${label}</span>
          <span class="detail-val">${value}</span>
        </div>`).join('')}
    </div>`;
}

function buildPersonSheetActions(person, role, personId) {
  if (role === 'Mother' || role === 'Father') {
    const actions = getAvailableActions(role, STATE.age, person);
    return `
      <div class="section-title">Actions</div>
      <div class="action-list">${actions.map(a => buildActionHTML(a)).join('')}</div>`;
  }
  if (role === 'Brother' || role === 'Sister') {
    const actions = getAvailableActions(role, STATE.age, person);
    return `
      <div class="section-title">Actions</div>
      <div class="action-list">${actions.map(a => buildActionHTML(a)).join('')}</div>`;
  }
  if (role === 'Friend' || role === 'classmate') {
    const actions = getAvailableActions(role, STATE.age, person);
    return `
      <div class="section-title">Actions</div>
      <div class="action-list">${actions.map(a => buildActionHTML(a)).join('')}</div>`;
  }
  if (person.isPet) {
    return `
      <div class="section-title">Actions</div>
      <div class="action-list">${PET_ACTIONS.map(a => buildActionHTML(a)).join('')}</div>`;
  }
  return '';
}

function closePerson() {
  document.getElementById('person-overlay').classList.remove('open');
}

let _pendingMoneyRequest = null;

function openMoneyRequestOverlay(personId, role) {
  const person = personId === STATE.family.mum.id ? STATE.family.mum
    : personId === STATE.family.dad.id ? STATE.family.dad
    : null;
  if (!person) return;
  _pendingMoneyRequest = { personId, role };
  document.getElementById('money-request-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;flex-direction:column;gap:6px;text-align:center">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint)">Ask For Money</div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">How much do you want from ${person.firstName}?</div>
      </div>
      <div class="detail-card" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="detail-label">Amount</span>
          <span id="money-request-amount" style="font-size:22px;font-weight:800">${fmtMoney(100)}</span>
        </div>
        <input id="money-request-slider" type="range" min="0" max="10000" step="50" value="100" oninput="updateMoneyRequestValue(this.value)" />
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-faint)">
          <span>£0</span>
          <span>£10,000</span>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="closeMoneyRequestOverlay()" style="flex:1;padding:13px 16px;border:1px solid var(--border);border-radius:13px;background:var(--surface);font-size:13px;font-weight:700;color:var(--text)">Cancel</button>
        <button onclick="submitMoneyRequest()" style="flex:1;padding:13px 16px;border:1px solid var(--text);border-radius:13px;background:var(--text);font-size:13px;font-weight:700;color:#fff">Ask</button>
      </div>
    </div>`;
  document.getElementById('money-request-overlay').classList.add('open');
}

function updateMoneyRequestValue(value) {
  document.getElementById('money-request-amount').textContent = fmtMoney(Number(value) || 0);
}

function closeMoneyRequestOverlay() {
  document.getElementById('money-request-overlay').classList.remove('open');
  _pendingMoneyRequest = null;
}

function submitMoneyRequest() {
  if (!_pendingMoneyRequest) return;
  const amount = Number(document.getElementById('money-request-slider').value || 0);
  const { personId, role } = _pendingMoneyRequest;
  const result = requestMoneyFromParent(personId, role, amount);
  closeMoneyRequestOverlay();
  updateAllUI();
  renderFamilyTab();
  openPersonSheet(personId, role);
  if (result?.message) showToast(result.message);
}

function interactClassmate(cmId, action) {
  const cm = STATE.school.classmates.find(c => c.id === cmId);
  if (!cm) return;
  if (action === 'chat') {
    cm.relationship = clamp(cm.relationship + Math.floor(Math.random()*8) + 3);
    logActivity(`Chatted with ${cm.firstName}`, 5);
    showToast(`Chatted with ${cm.firstName} ✓`);
    updateAllUI();
    renderFamilyTab();
    openPersonSheet(cmId, 'Friend');
  } else if (action === 'friend') {
    closePerson();
    const result = tryMakeFriend(cm);
    setTimeout(() => {
      showToast(result.success ? `${cm.firstName} is now your friend! 🎉` : result.reason);
      updateAllUI();
      renderFamilyTab();
    }, 300);
  }
}

// ── LEARN TAB BUILDERS ────────────────────────────────────

function buildLearnHeroSchool(edu, grade, avgGrade, gradeAboveAvg) {
  const qualityMap   = { lower:2, working:2, middle:3, upper_middle:4, elite:5 };
  const quality      = qualityMap[STATE.socialClass] || 2;
  const isTarget     = quality >= 4;
  const qualityLabel = quality >= 4 ? 'High' : quality === 3 ? 'Average' : 'Low';
  const stageLabels  = { pre:'Pre-School', primary:'Primary School', secondary:'Secondary School', college:'Sixth Form / College', uni:'University' };
  const stageLabel   = stageLabels[edu.level] || 'School';
  const gradeBubbleBg = gradeAboveAvg ? '#16a34a' : '#dc2626';
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:22px;color:#ca8a04">🎒</span>
          <span style="display:inline-block;background:rgba(0,0,0,0.08);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;color:#1a1814;opacity:.7">${edu.current || stageLabel}</span>
        </div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:#1a1814">${edu.current || '—'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;margin-left:12px">
        <div style="width:52px;height:52px;border-radius:50%;background:${gradeBubbleBg};display:flex;align-items:center;justify-content:center">
          <span style="font-family:var(--mono);font-size:22px;font-weight:800;color:#fff">${grade}</span>
        </div>
        <span style="font-size:10px;font-weight:600;color:#1a1814;opacity:.5">Your grade</span>
      </div>
    </div>
    <div style="display:flex;gap:0;margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08)">
      ${buildLearnHeroStat('Target School', isTarget ? '✅ Yes' : '❌ No')}
      <div style="width:1px;background:rgba(0,0,0,0.08)"></div>
      ${buildLearnHeroStat('Teacher Quality', qualityLabel)}
      <div style="width:1px;background:rgba(0,0,0,0.08)"></div>
      ${buildLearnHeroStat('Class Average', avgGrade)}
    </div>`;
}

function buildLearnHeroStat(label, value) {
  return `
    <div style="flex:1;text-align:center">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1a1814;opacity:.45">${label}</div>
      <div style="font-size:14px;font-weight:700;color:#1a1814;margin-top:3px">${value}</div>
    </div>`;
}

function buildLearnHeroWork(edu) {
  return `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">Career</div>
    <div style="font-family:var(--mono);font-size:44px;font-weight:500;letter-spacing:-.03em;line-height:1;color:#fff">${STATE.career.job}</div>
    <div style="font-size:12px;opacity:.45;color:#fff;margin-top:2px">${fmtMoney(STATE.finances.income)} / year</div>`;
}

function buildLearnHeroPreschool(edu) {
  const levelLabels = { pre:'Pre-School', primary:'Primary School', secondary:'Secondary School', college:'Sixth Form / College', uni:'University', finished_school:'School Complete' };
  return `
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.45;color:#fff">Education</div>
    <div style="font-family:var(--mono);font-size:44px;font-weight:500;letter-spacing:-.03em;line-height:1;color:#fff">${levelLabels[edu.level] || '—'}</div>
    <div style="font-size:12px;opacity:.45;color:#fff;margin-top:2px">${edu.current || ''}</div>`;
}

function buildLearnClassmateRow(c) {
  const traits = (c.traits || []).slice(0, 2).map(tid => {
    const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}" style="font-size:10px;padding:3px 8px">${t.label}</span>`;
  }).join('');
  return `
    <div onclick="openPersonSheet('${c.id}','classmate')" style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer">
      <div style="width:40px;height:40px;border-radius:50%;background:transparent;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
        ${getCharacterHTML(c.appearance, STATE.age, 40, { showBg: false })}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700;${isClassmateCrush(c) ? 'color:#db2777' : ''}">${classmateDisplayName(c)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:1px">${c.status === 'friend' ? '🤝 Friend' : 'Classmate'}</div>
        ${traits ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${traits}</div>` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
          <div style="flex:1;height:4px;background:var(--surface-mid);border-radius:99px;overflow:hidden">
            <div style="width:${clamp(c.relationship)}%;height:100%;background:#22c55e;border-radius:99px"></div>
          </div>
          <span style="font-family:var(--mono);font-size:10px;color:var(--text-faint)">${c.relationship}%</span>
        </div>
      </div>
    </div>`;
}

function buildLearnTeacherRow(t) {
  return `
    <div onclick="openPersonSheet('${t.id}','Teacher')" style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer">
      <div style="width:40px;height:40px;border-radius:50%;background:transparent;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
        ${getCharacterHTML(t.appearance, 35, 40, { showBg: false })}
      </div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700">${t.title} ${t.surname}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${t.subject}</div>
      </div>
    </div>`;
}

function buildLearnToggleSection(id, label, contentHTML) {
  return `
    <div class="${id}-section">
      <button onclick="toggleLearnSection('${id}-inner')"
        style="width:100%;padding:13px 16px;background:var(--surface);border:1px solid var(--border-light);border-radius:14px;font-size:13px;font-weight:700;color:var(--text);display:flex;justify-content:space-between;align-items:center">
        <span>${label}</span><span>›</span>
      </button>
      <div id="${id}-inner" style="display:none;margin-top:8px;flex-direction:column;gap:8px">
        ${contentHTML}
      </div>
    </div>`;
}

function renderLearnTab() {
  const age = STATE.age, edu = STATE.school, isWork = age >= 18 && edu.level !== 'uni';
  const grade       = (age >= 5 && age <= 18) ? gradeFromScore(edu.gradeScore) : null;
  const avgScore    = edu.classmates.length
    ? Math.round(edu.classmates.reduce((s, c) => s + c.gradeScore, 0) / edu.classmates.length)
    : edu.gradeScore;
  const avgGrade      = gradeFromScore(avgScore);
  const gradeAboveAvg = grade && edu.gradeScore >= avgScore;

  // ── Hero card ─────────────────────────────────────────
  const hero = document.querySelector('#tab-learn .hub-hero');
  if (!isWork && grade) {
    hero.style.background = '#fef9c3';
    hero.style.border     = '1px solid #fde047';
    hero.innerHTML = buildLearnHeroSchool(edu, grade, avgGrade, gradeAboveAvg);
  } else {
    hero.style.background = '';
    hero.style.border     = '';
    hero.innerHTML = isWork ? buildLearnHeroWork(edu) : buildLearnHeroPreschool(edu);
  }

  // ── Grade block (unused but kept for future) ──────────
  document.getElementById('grade-block-wrap').innerHTML = '';

  // ── Roster toggle ─────────────────────────────────────
  document.getElementById('roster-toggle-wrap').style.display =
    (age >= 5 && age <= 18 && edu.classmates.length) ? 'block' : 'none';

  // ── Dynamic sections: clear and rebuild ───────────────
  const container = document.getElementById('learn-actions').parentElement;
  container.querySelectorAll('.actions-section, .cm-section, .tch-section').forEach(el => el.remove());
  document.getElementById('learn-section-title').style.display = 'none';
  document.getElementById('learn-actions').innerHTML = '';

  // Actions
  const acts = isWork ? CAREER_ACTIONS : EDUCATION_ACTIONS;
  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'actions-section';
  actionsWrapper.innerHTML = buildLearnToggleSection(
    'actions',
    '⚡ Actions',
    `<div class="action-list" id="learn-actions-inner">${acts.map(a => buildActionHTML(a)).join('')}</div>`
  );
  container.appendChild(actionsWrapper);
  wireActions(actionsWrapper.querySelector('#learn-actions-inner'), acts, () => { updateAllUI(); renderLearnTab(); });

  // Classmates
  if (age >= 5 && age <= 18 && edu.classmates.length) {
    const cmWrapper = document.createElement('div');
    cmWrapper.className = 'cm-section';
    cmWrapper.innerHTML = buildLearnToggleSection(
      'cm',
      `👥 Classmates (${edu.classmates.length})`,
      edu.classmates.map(c => buildLearnClassmateRow(c)).join('')
    );
    container.appendChild(cmWrapper);
  }

  // Teachers
  if (edu.teachers && edu.teachers.length) {
    const tchWrapper = document.createElement('div');
    tchWrapper.className = 'tch-section';
    tchWrapper.innerHTML = buildLearnToggleSection(
      'tch',
      '👩‍🏫 Teachers',
      edu.teachers.map(t => buildLearnTeacherRow(t)).join('')
    );
    container.appendChild(tchWrapper);
  }
}

function toggleLearnSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none' && el.style.display !== '';
  el.style.display = isOpen ? 'none' : 'flex';
}

let _rosterOpen = false;
function toggleRoster() {
  _rosterOpen = !_rosterOpen;
  document.getElementById('roster-panel').style.display = _rosterOpen ? 'block' : 'none';
  document.getElementById('roster-toggle-arrow').textContent = _rosterOpen ? '∨' : '›';
  if (_rosterOpen) renderRoster();
}
function renderRoster() {
  const snapshot = STATE.school.rosterSnapshot;
  if (!snapshot.length) return;
  document.getElementById('roster-list').innerHTML = snapshot.map((p, i) => `
    <div class="roster-row ${p.isPlayer ? 'is-player' : ''}">
      <div class="roster-rank">${i+1}</div>
      <div class="roster-emoji" style="overflow:hidden;border-radius:50%;background:${p.isPlayer?'var(--surface-mid)':'transparent'}">${getCharacterHTML(p.appearance, STATE.age, 28, { showBg:!!p.isPlayer })}</div>
      <div class="roster-name">${p.firstName} ${p.surname}${p.isPlayer?' (you)':''}</div>
      <div class="roster-grade-bar"><div class="roster-grade-fill" style="width:${p.gradeScore}%;background:${gradeColor(p.grade)}"></div></div>
      <div class="roster-grade" style="color:${gradeColor(p.grade)}">${p.grade}</div>
    </div>`).join('');
}

// ── IDENTITY SHEET ────────────────────────────────────────
function openIdentitySheet() {
  const s = STATE;
  const revealedCount = Math.max(1, Math.min(3, s.revealedTraitCount || 1));
  const traits = s.traits.map((tid, i) => {
    const t = PLAYER_TRAITS_POOL.find(x => x.id === tid);
    if (!t) return '';
    return i < revealedCount
      ? `<span class="trait-pill player">${t.emoji} ${t.label}</span>`
      : `<span class="trait-pill">???</span>`;
  }).join('');
  document.getElementById('identity-inner').innerHTML = `
    <div class="identity-section">
      <div style="font-size:40px;text-align:center">${getStage(s.age).emoji}</div>
      <div class="identity-big-name">${s.fullName}</div>
      <div class="backstory-meta">
        <span class="badge badge-age">Age ${s.age}</span>
        <span class="badge badge-stage">${getStage(s.age).label}</span>
        <span class="badge badge-sign">${s.starSign.symbol} ${s.starSign.sign}</span>
        <span class="badge badge-class">${s.socialClassLabel}</span>
      </div>
      <div class="identity-text">${MONTHS[s.birthday.month-1]} ${ordinal(s.birthday.day)} · ${s.city.region}</div>
      <div class="identity-text">${s.sexualityConfirmed ? `Into: ${s.sexuality}` : 'Into: still figuring it out'}</div>
    </div>
    <div class="section-title">Your Traits</div>
    <div class="trait-pills">${traits}</div>
    <div class="section-title">Your Story</div>
    <div class="identity-text" id="identity-backstory-text">Loading...</div>`;
  if (_birthData && _birthData.situation) {
    const parentDesc = SITUATION_TEXT[_birthData.situation]();
    document.getElementById('identity-backstory-text').textContent =
      `Born on the ${ordinal(s.birthday.day)} of ${MONTHS[s.birthday.month-1]} in ${s.city.name}, ${s.city.vibe}. ${parentDesc}`;
  }
  document.getElementById('identity-overlay').classList.add('open');
}
function closeIdentity() {
  document.getElementById('identity-overlay').classList.remove('open');
}

// ── FINANCE SHEET ─────────────────────────────────────────
function openFinanceSheet() {
  const f   = STATE.finances;
  const tax = Math.round(f.income * 0.2);
  const net = f.income - tax - f.expenses;
  document.getElementById('finance-inner').innerHTML = `
    <div class="hub-hero">
      <div class="hub-hero-label">Net Worth</div>
      <div class="hub-hero-val">${fmtMoney(f.balance)}</div>
      <div class="hub-hero-sub">${net >= 0 ? '+' : ''}${fmtMoney(net)} / year net</div>
    </div>
    <div class="section-title">Annual Breakdown</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Income (${f.job||'None'})</span><span class="detail-val pos">+${fmtMoney(f.income)}</span></div>
      <div class="detail-row"><span class="detail-label">Tax (~20%)</span><span class="detail-val neg">-${fmtMoney(tax)}</span></div>
      <div class="detail-row"><span class="detail-label">Housing</span><span class="detail-val neg">-${fmtMoney(f.expenses)}</span></div>
      <div class="detail-row total"><span class="detail-label">Net / year</span><span class="detail-val bold">${net >= 0 ? '+' : ''}${fmtMoney(net)}</span></div>
    </div>`;
  document.getElementById('finance-overlay').classList.add('open');
}
function closeFinanceSheet() {
  document.getElementById('finance-overlay').classList.remove('open');
}

// ── MILESTONE ─────────────────────────────────────────────
let _pendingAfterMilestone = null;
function showMilestone(m, onClose) {
  _pendingAfterMilestone = onClose;
  document.getElementById('milestone-inner').innerHTML = `
    <div class="milestone-emoji">${m.emoji}</div>
    <div class="milestone-title">${m.title}</div>
    <div class="milestone-body">${m.body}</div>
    <button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}
function closeMilestone() {
  document.getElementById('milestone-overlay').classList.remove('open');
  if (_pendingAfterMilestone) {
    _pendingAfterMilestone();
    _pendingAfterMilestone = null;
  }
}
function showResultsDay() {
  const score    = STATE.school.gradeScore;
  const subjects = [
    { name:'Mathematics',       emoji:'📐' },
    { name:'English Language',  emoji:'📖' },
    { name:'English Literature',emoji:'📚' },
    { name:'Biology',           emoji:'🔬' },
    { name:'Chemistry',         emoji:'⚗️' },
    { name:'Physics',           emoji:'🔭' },
    { name:'History',           emoji:'🏛️' },
    STATE.traits.includes('creative')    ? { name:'Art & Design',     emoji:'🎨' } :
    STATE.traits.includes('intelligent') ? { name:'Computer Science', emoji:'💻' } :
    STATE.traits.includes('ambitious')   ? { name:'Business Studies', emoji:'💼' } :
                                           { name:'Geography',        emoji:'🌍' },
  ];
  const grades = subjects.map(s => ({
    ...s, grade: gradeFromScore(clamp(score + Math.floor(Math.random()*20) - 10, 0, 100)),
  }));
  STATE.school.gcsResults = grades;
  _pendingAfterMilestone = () => {
    if (!STATE.sexualityConfirmed) {
      const identityEvent = EVENTS.find(e => e.id === 'identity_check_in');
      if (identityEvent) {
        setTimeout(() => openEvent(identityEvent), 100);
        return;
      }
    }
    const ev = pickEvent();
    if (ev) setTimeout(() => openEvent(ev), 100);
  };
  document.getElementById('milestone-inner').innerHTML = `
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint)">Age 16 · Results Day</div>
    <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1">Your results are in.</div>
    <div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px 20px;text-align:left;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border-light)">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-faint);margin-bottom:4px">National Examination Board</div>
        <div style="font-size:18px;font-weight:800;letter-spacing:-.02em">${STATE.fullName}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${STATE.school.current}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0">
        ${grades.map((s, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:${i<grades.length-1?'1px solid var(--border-light)':'none'};animation:fadeIn .3s ease ${i*0.08}s both">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:16px">${s.emoji}</span>
              <span style="font-size:13px;font-weight:600;color:var(--text-muted)">${s.name}</span>
            </div>
            <span style="font-size:18px;font-weight:800;color:${gradeColor(s.grade)}">${s.grade}</span>
          </div>`).join('')}
      </div>
    </div>
    <button class="continue-btn" onclick="closeMilestone()">Continue →</button>`;
  document.getElementById('milestone-overlay').classList.add('open');
}

// ── PET NAMING ────────────────────────────────────────────
let _pendingPetData = null;
function openPetNaming(petType, petEmoji, onNamed) {
  _pendingPetData = { petType, petEmoji, onNamed };
  const suggestedName = pickRandom(NAMES_UK.petNames);
  document.getElementById('pet-inner').innerHTML = `
    <div class="milestone-emoji">${petEmoji}</div>
    <div class="milestone-title">What will you name them?</div>
    <input class="pet-name-input" id="pet-name-input" type="text" placeholder="${suggestedName}" value="${suggestedName}" maxlength="20"/>
    <button class="birth-btn secondary" onclick="document.getElementById('pet-name-input').value='${pickRandom(NAMES_UK.petNames)}'">↺ Suggest another name</button>
    <button class="birth-btn" onclick="confirmPetName()">That's their name →</button>`;
  document.getElementById('pet-overlay').classList.add('open');
}
function confirmPetName() {
  const name = document.getElementById('pet-name-input').value.trim() || pickRandom(NAMES_UK.petNames);
  document.getElementById('pet-overlay').classList.remove('open');
  if (_pendingPetData && _pendingPetData.onNamed) _pendingPetData.onNamed(name);
  _pendingPetData = null;
}

// ── EVENT OVERLAY ─────────────────────────────────────────
function openEvent(ev) {
  document.getElementById('event-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:8px 0 4px">
      <div style="width:72px;height:72px;border-radius:20px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:36px">
        ${ev.icon || '✨'}
      </div>
      <div class="event-cat">${ev.category}</div>
      <div style="font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.15">${ev.title||''}</div>
    </div>
    <div style="font-size:15px;color:var(--text-muted);line-height:1.6;font-weight:500">${ev.text}</div>
    <div class="choices" id="choices-list"></div>`;
  ev.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span>${c.text}</span><span class="choice-arrow">›</span>`;
    btn.onclick   = () => handleChoice(ev, c);
    document.getElementById('choices-list').appendChild(btn);
  });
  document.getElementById('event-overlay').classList.add('open');
}
function handleChoice(ev, choice) {
  const effects    = choice.effects || {};
  const totalDelta = Object.values(effects).reduce((s, v) => s + v, 0);
  applyEffects(effects);
  if (choice.onChoose) choice.onChoose();
  STATE.usedEvents.push(ev.id);
  logActivity(choice.log || choice.text, totalDelta);
  if (choice.classmateEffect) {
    STATE.school.classmates.forEach(cm => {
      cm.relationship = clamp(cm.relationship + (choice.classmateEffect.all||0) + Math.floor(Math.random()*6));
    });
    if (choice.autoFriendCheck) {
      const best = STATE.school.classmates
        .filter(c => c.status === 'classmate')
        .sort((a,b) => b.compatibility - a.compatibility)[0];
      if (best && STATE.traits.includes('charismatic') && best.compatibility >= 70) {
        best.status = 'friend';
        STATE.relationships.friends = clamp(STATE.relationships.friends + 15);
        logActivity(`${best.firstName} became your first friend 🎉`, 10);
      }
    }
  }
  if (choice.petAdopt) {
    closeEventOverlay();
    openPetNaming(choice.petType||'dog', choice.petEmoji||'🐕', name => {
      const deathAges = { dog:13, cat:16, rabbit:9, hamster:3 };
      STATE.family.pets.push({
        id:uid(), name, type:choice.petType||'dog', emoji:choice.petEmoji||'🐕',
        happiness:80, health:90, age:0, deathAge:deathAges[choice.petType]||12, fedThisYear:false,
      });
      logActivity(`Adopted ${name} the ${choice.petType||'dog'} 🐾`, 10);
      showOutcome(choice, totalDelta);
    });
    return;
  }
  showOutcome(choice, totalDelta);
  updateAllUI();
}
function showOutcome(choice, totalDelta) {
  const labels = {
    happy:'Happiness', health:'Health', smarts:'Smarts', looks:'Looks',
    balance:'Wealth', income:'Income', rep:'Reputation',
    rel_family:'Family', rel_friends:'Friends', gradeScore:'Grades',
  };
  const effects = choice.effects || {};
  const outcomeText = choice.getOutcome ? choice.getOutcome() : (choice.outcome || choice.log);
  document.getElementById('event-inner').innerHTML = `
    <div class="outcome-text">${outcomeText}</div>
    <div class="effects-row">${Object.entries(effects)
      .filter(([k]) => !['income','expenses'].includes(k))
      .map(([k,v]) => `<span class="effect-chip ${v>=0?'pos':'neg'}">${labels[k]||k} ${v>0?'+':''}${v}</span>`)
      .join('')}
    </div>
    <button class="continue-btn" onclick="closeEventOverlay();updateAllUI()">Continue →</button>`;
  updateAllUI();
}

// ── GAME LOOP ─────────────────────────────────────────────
document.getElementById('age-up-btn').addEventListener('click', () => {
  STATE.age += 1;
  const alive = annualTick();
  if (!alive) {
    showToast(`${STATE.firstName} lived to ${STATE.age}. ✦`);
    document.getElementById('age-up-btn').disabled   = true;
    document.getElementById('age-up-btn').textContent = '✦ Life Complete';
    updateAllUI();
    return;
  }
  updateAllUI();
  saveGame();
  const milestone = checkMilestone();
  if (milestone) {
    showMilestone(milestone, () => {
      if (STATE.age === 16) {
        setTimeout(() => showResultsDay(), 200);
      } else {
        const ev = pickEvent();
        if (ev) setTimeout(() => openEvent(ev), 200);
      }
    });
  } else {
    const ev = pickEvent();
    if (ev) setTimeout(() => openEvent(ev), 100);
  }
});

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── INIT ──────────────────────────────────────────────────
initBirth();
