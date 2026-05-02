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

  const SITUATIONS = [
    { id:'happily_married',    weight:35 },
    { id:'married_struggling', weight:15 },
    { id:'recently_divorced',  weight:20 },
    { id:'single_mum',         weight:22 },
    { id:'single_dad',         weight:3  },
    { id:'never_knew',         weight:5  },
  ];
  const situation = weightedRandom(SITUATIONS).id;

  const numSiblings = weightedRandom([
    { v:0, weight:42 }, { v:1, weight:35 }, { v:2, weight:16 }, { v:3, weight:7 },
  ]).v;
  const siblings = Array.from({ length: numSiblings }, () => {
    const sg = Math.random() > 0.5 ? 'male' : 'female';
    return { name: pickRandom(NAMES_UK[sg]), gender: sg };
  });

  const hasPet    = Math.random() < 0.4;
  const petHint   = hasPet ? pickRandom([{ name:'a dog' }, { name:'a cat' }]) : null;

  _birthData = { gender, firstName, surname, city, socialClass:scClass, traits,
    birthday:{ day, month }, sign, mumName, dadName, situation, siblings, petHint };

  const stage = LIFE_STAGES[0];
  document.getElementById('deal-emoji').textContent    = stage.emoji;
  document.getElementById('deal-name').textContent     = `${firstName} ${surname}`;
  document.getElementById('deal-location').textContent = `${city.name}, ${city.region}`;

  const sc = SOCIAL_CLASSES.find(c => c.id === scClass);
  document.getElementById('deal-badges').innerHTML = `
    <span class="badge badge-class">${sc.label}</span>
    <span class="badge badge-sign">${sign.symbol} ${sign.sign}</span>
    <span class="badge badge-age">${MONTHS[month-1].slice(0,3)} ${ordinal(day)}</span>`;

  traits.forEach((tid, i) => {
    const t = PLAYER_TRAITS_POOL.find(x => x.id === tid);
    document.getElementById(`deal-trait-${i+1}`).innerHTML = `
      <div class="trait-reveal-emoji">${t.emoji}</div>
      <div><div class="trait-reveal-label">${t.label}</div><div class="trait-reveal-desc">${t.weights ? traitDesc(t) : ''}</div></div>`;
  });

  const banner = document.getElementById('continue-banner');
  if (banner) banner.style.display = hasSavedGame() ? 'block' : 'none';
}

function traitDesc(t) {
  const tops = Object.entries(t.weights).sort((a,b) => b[1]-a[1]).slice(0,2);
  return tops.map(([tag, w]) => w > 1
    ? `More ${tag.replace(/_/g,' ')} events`
    : `Fewer ${tag.replace(/_/g,' ')} events`
  ).join(' · ');
}

function goBirthStep(step) {
  document.querySelectorAll('.birth-step').forEach(s => s.classList.remove('active'));
  if (step === 'backstory') {
    populateBackstory();
    document.getElementById('step-backstory').classList.add('active');
  }
}

function populateBackstory() {
  const d  = _birthData;
  const sc = SOCIAL_CLASSES.find(c => c.id === d.socialClass);
  const numWords = ['zero','one','two','three','four'];
  const sibText = d.siblings.length === 0
    ? `You have no siblings.`
    : `You have ${numWords[d.siblings.length] ?? d.siblings.length} ${d.siblings.length === 1 ? 'sibling' : 'siblings'}.`;
  const petText   = d.petHint ? ` Your family has ${d.petHint.name}.` : '';
  const backstory = `You were born on the ${ordinal(d.birthday.day)} of ${MONTHS[d.birthday.month-1]} in ${d.city.name}, ${d.city.vibe}. ${SITUATION_TEXT[d.situation]()} ${sibText}${petText}`;
  document.getElementById('bs-name').textContent = `${d.firstName} ${d.surname}`;
  document.getElementById('bs-meta').innerHTML   = `
    <span class="badge badge-class">${sc.label}</span>
    <span class="badge badge-sign">${d.sign.symbol} ${d.sign.sign}</span>
    <span class="badge badge-age">${d.city.name}</span>`;
  document.getElementById('bs-text').textContent = backstory;
}

function startGame() {
  const d = _birthData;
  createNewLife({
    gender:d.gender, firstName:d.firstName, surname:d.surname,
    birthday:d.birthday, city:d.city, socialClass:d.socialClass,
    traits:d.traits, situation:d.situation,
    mumName:d.mumName, dadName:d.dadName, siblings:d.siblings,
  });
  STATE.starSign = d.sign;
  const gText = d.gender === 'male' ? 'baby boy' : 'baby girl';
  logActivity(`You were born in ${d.city.name}, ${d.city.region}. You are a ${gText}.`, null);
  logActivity(`${d.situation === 'single_dad' ? 'Your father' : 'Your mother'} took you home from the hospital.`, null);
  document.getElementById('screen-birth').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  updateAllUI();
}

// ── TAB SWITCHING ─────────────────────────────────────────
let _currentTab = 'life';

function switchTab(tab, el) {
  _currentTab = tab;
  ['life','family','learn','activities'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tab ? 'flex' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = {
    life:'Life Cards', family:'Relationships',
    learn: STATE && STATE.age >= 18 ? 'Work' : 'Learn', activities:'Activities',
  };
  document.getElementById('game-topbar-title').textContent = titles[tab] || tab;
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
  const stage = getStage(STATE.age);
  document.getElementById('profile-avatar').innerHTML   = getAvatarImg(STATE.appearance, 56);
  document.getElementById('profile-name').textContent   = STATE.fullName;
  document.getElementById('badge-age').textContent      = `Age ${STATE.age}`;
  document.getElementById('badge-stage').textContent    = stage.label;
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
}

function renderStatGrid() {
  const grid = document.getElementById('stat-grid'), age = STATE.age, s = STATE.stats;
  const stats = [];
  if (age >= 0) stats.push({ id:'health', emoji:'❤️', label:'Health',     val:s.health, hub:'health' });
  if (age >= 0) stats.push({ id:'happy',  emoji:'😊', label:'Happiness',  val:s.happy,  hub:'happy'  });
  if (age >= 0) stats.push({ id:'smarts', emoji:'🧠', label:'Smarts',     val:s.smarts, hub:'smarts' });
  if (age >= 0) stats.push({ id:'looks',  emoji:'✨', label:'Looks',      val:s.looks,  hub:'looks'  });
  if (age >= 13) stats.push({ id:'rep',   emoji:'⭐', label:'Reputation', val:s.rep,    hub:'rep'    });
  grid.innerHTML = stats.map(st => `
    <div class="stat-card" onclick="openStatSheet('${st.hub}')">
      <div class="stat-card-top"><span class="stat-card-emoji">${st.emoji}</span><span class="stat-card-arrow">›</span></div>
      <div class="stat-card-val">${st.val}</div>
      <div class="stat-card-label">${st.label}</div>
      <div class="stat-card-bar"><div class="stat-card-fill" data-stat="${st.id}" style="width:${clamp(st.val)}%"></div></div>
    </div>`).join('');
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
  let html = '';
  let lastAge = null;
  STATE.activity.slice(0, 20).forEach(a => {
    if (a.age !== lastAge) {
      html += `<div class="life-log-divider">Age ${a.age}</div>`;
      lastAge = a.age;
    }
    const deltaStr = (a.delta != null && a.delta !== 0)
      ? `<div class="life-log-time">${a.delta > 0 ? '+' : ''}${a.delta}</div>` : '';
    html += `
      <div class="life-log-item">
        <div class="life-log-icon">${getActivityIcon(a.text)}</div>
        <div class="life-log-body">
          <div class="life-log-text">${a.text}</div>
          ${deltaStr}
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

// ── STAT SHEET ────────────────────────────────────────────
function openStatSheet(hub) {
  const labels = { smarts:'🧠 Smarts', looks:'✨ Looks', health:'❤️ Health', happy:'😊 Happiness', rep:'⭐ Reputation' };
  const vals   = { smarts:STATE.stats.smarts, looks:STATE.stats.looks, health:STATE.stats.health, happy:STATE.stats.happy, rep:STATE.stats.rep };
  const actionMap = { smarts:ACTIONS.smarts, looks:ACTIONS.looks, health:ACTIONS.health, happy:ACTIONS.happy, rep:ACTIONS.rep };
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
  const r = STATE.relationships;
  const people = [];
  if (!['single_dad'].includes(STATE.family.situation))
    people.push({ person:STATE.family.mum, role:'Mother', rel:r.family, traitPool:PARENT_TRAITS_POOL });
  if (!['single_mum','never_knew'].includes(STATE.family.situation))
    people.push({ person:STATE.family.dad, role:'Father', rel:r.family, traitPool:PARENT_TRAITS_POOL });
  STATE.family.siblings.forEach(s =>
    people.push({ person:s, role:s.gender==='male'?'Brother':'Sister', rel:s.relationship||60, traitPool:[] }));
  STATE.family.pets.filter(p => !p.dead).forEach(p =>
    people.push({ person:{...p, firstName:p.name, traits:[]}, role:'Pet', rel:p.happiness, traitPool:[] }));

  document.getElementById('family-tab-content').innerHTML = `
    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
      <span>Immediate Family</span>
      <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${people.length} contacts</span>
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
    ? `<div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
         <span>Friends</span>
         <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${friends.length} contacts</span>
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

let _expandedCardId = null;

function buildPersonCard(person, role, rel, traitPool) {
  const isExpanded = _expandedCardId === person.id;
  const traits = (person.traits || []).slice(0,2).map(tid => {
    const t = traitPool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.label}</span>`;
  }).join('');

  const avatarContent = person.appearance
    ? `<img src="${getAvatarUrl(person.appearance)}" width="52" height="52" style="width:52px;height:52px;object-fit:cover;display:block"/>`
    : `<span style="font-size:26px">${person.emoji || '👤'}</span>`;

  const INTERACT_ACTIONS = [
    { label:'🙂 Hang Out',       id:'hang_out'   },
    { label:'💬 Ask for Advice', id:'ask_advice' },
    { label:'💰 Ask for Money',  id:'ask_money'  },
    { label:'😂 Have a Laugh',   id:'have_laugh' },
    { label:'😤 Argue',          id:'argue'      },
  ];

  const expandedHTML = isExpanded ? `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-light)">
      ${traits ? `<div class="trait-pills" style="margin-bottom:12px">${traits}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted)">Relationship</span>
        <span style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--text-muted)">${rel}%</span>
      </div>
      <div style="width:100%;height:6px;background:var(--surface-mid);border-radius:99px;overflow:hidden;margin-bottom:14px">
        <div style="width:${rel}%;height:100%;background:#22c55e;border-radius:99px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${INTERACT_ACTIONS.map(a => `
          <button onclick="showToast('${a.label} — coming soon!')" style="width:100%;padding:11px 14px;background:var(--surface-mid);border:1px solid var(--border);border-radius:11px;font-size:13px;font-weight:600;color:var(--text);text-align:left;cursor:pointer">
            ${a.label}
          </button>`).join('')}
      </div>
    </div>` : '';

  const relBarInline = !isExpanded ? `
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
      <div style="flex:1;height:4px;background:var(--surface-mid);border-radius:99px;overflow:hidden">
        <div style="width:${rel}%;height:100%;background:#22c55e;border-radius:99px"></div>
      </div>
      <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${rel}%</span>
    </div>` : '';

  return `
    <div class="person-card" style="flex-direction:column;align-items:stretch;gap:0;cursor:default">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="person-avatar-sq">${avatarContent}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:17px;font-weight:800;letter-spacing:-.02em">${person.firstName}${person.surname ? ' '+person.surname : ''}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px">${role}</div>
          ${relBarInline}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button onclick="togglePersonCard('${person.id}')" style="width:32px;height:32px;border-radius:99px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted);cursor:pointer;transition:transform .2s;transform:rotate(${isExpanded?'90':'0'}deg)">›</button>
          <button onclick="openPersonSheet('${person.id}','${role}')" style="width:32px;height:32px;border-radius:99px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted);cursor:pointer">⋯</button>
        </div>
      </div>
      ${expandedHTML}
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

function openPersonSheet(personId, role) {
  let person = null;
  if (personId === STATE.family.mum.id)
    person = { ...STATE.family.mum, _role:'Mother', _rel:STATE.relationships.family };
  else if (personId === STATE.family.dad.id)
    person = { ...STATE.family.dad, _role:'Father', _rel:STATE.relationships.family };
  else {
    const sib = STATE.family.siblings.find(s => s.id === personId);
    if (sib) person = { ...sib, _role:role, _rel:sib.relationship||60 };
    const cm  = STATE.school.classmates.find(c => c.id === personId);
    if (cm)  person = { ...cm,  _role:role, _rel:cm.relationship };
    const pet = STATE.family.pets.find(p => p.id === personId);
    if (pet) person = { ...pet, _role:'Pet', _rel:pet.happiness, isPet:true };
  }
  if (!person) return;

  const traitsHTML = (person.traits || []).map(tid => {
    const pool = person.isPet ? []
      : role === 'Mother' || role === 'Father' ? PARENT_TRAITS_POOL : CLASSMATE_TRAITS_POOL;
    const t = pool.find(x => x.id === tid);
    if (!t) return '';
    const cls = t.positive === false ? 'negative' : t.positive === true ? 'positive' : '';
    return `<span class="trait-pill ${cls}">${t.emoji||''} ${t.label}</span>`;
  }).join('');

  const avatarHTML = person.appearance
    ? `<img src="${getAvatarUrl(person.appearance)}" width="70" height="70" style="border-radius:50%;display:block"/>`
    : `<span style="font-size:44px">${person.emoji || '👤'}</span>`;

  let actionsHTML = '';
  if (role === 'Mother' || role === 'Father') {
    const actId = role === 'Mother' ? 'talk_mum' : 'talk_dad';
    actionsHTML = `
      <div class="section-title">Actions</div>
      <div class="action-list">
        ${buildActionHTML({ id:actId, icon:role==='Mother'?'👩':'👨', name:`Talk to ${person.firstName}`, desc:'A little goes a long way.', cost:0, effects:{ happy:+4, rel_family:+6 }, cooldown:0 })}
      </div>`;
  } else if (role === 'Friend' || role === 'classmate') {
    const cm = STATE.school.classmates.find(c => c.id === personId);
    if (cm) {
      actionsHTML = `
        <div class="section-title">Actions</div>
        <div class="action-list">
          <div class="action-card" onclick="interactClassmate('${cm.id}','chat')">
            <div class="action-icon">💬</div><div class="action-info"><div class="action-name">Chat with them</div><div class="action-desc">Build the connection.</div></div><div class="action-cost">Free</div>
          </div>
          ${cm.status === 'classmate' ? `<div class="action-card" onclick="interactClassmate('${cm.id}','friend')"><div class="action-icon">🤝</div><div class="action-info"><div class="action-name">Ask to be friends</div><div class="action-desc">Relationship: ${cm.relationship}/100 · needed: ${friendshipThreshold(cm)}</div></div><div class="action-cost">Free</div></div>` : ''}
        </div>`;
    }
  } else if (person.isPet) {
    actionsHTML = `
      <div class="section-title">Actions</div>
      <div class="action-list">${PET_ACTIONS.map(a => buildActionHTML(a)).join('')}</div>`;
  }

  document.getElementById('person-inner').innerHTML = `
    <div class="person-profile-header">
      <div class="person-profile-emoji">${avatarHTML}</div>
      <div style="flex:1">
        <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">${person.firstName}${person.surname ? ' '+person.surname : ''}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${person._role}${person.job ? ' · '+person.job : ''}</div>
        <div class="rel-bar-wrap" style="margin-top:6px">
          <div class="rel-bar"><div class="rel-fill" style="width:${person._rel}%"></div></div>
          <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${person._rel}</span>
        </div>
      </div>
    </div>
    ${person.gradeScore !== undefined ? `<div style="font-size:12px;color:var(--text-muted)">Grade: <strong style="color:${gradeColor(person.grade)}">${person.grade}</strong> · Compatibility: ${person.compatibility}%</div>` : ''}
    ${traitsHTML ? `<div class="trait-pills">${traitsHTML}</div>` : ''}
    ${actionsHTML}`;

  if (person.isPet) {
    wireActions(document.getElementById('person-inner'), PET_ACTIONS, () => {
      updateAllUI();
      renderFamilyTab();
      openPersonSheet(personId, role);
    }, personId);
  }
  if (role === 'Mother' || role === 'Father') {
    const act = {
      id:   role === 'Mother' ? 'talk_mum' : 'talk_dad',
      icon: role === 'Mother' ? '👩' : '👨',
      name: `Talk to ${person.firstName}`,
      desc: '', cost:0,
      effects: { happy:+4, rel_family:+6 },
      cooldown: 0,
    };
    document.getElementById('person-inner').querySelectorAll('.action-card:not(.locked)').forEach(el => {
      el.onclick = () => {
        doAction(act);
        updateAllUI();
        renderFamilyTab();
        showToast(`Talked to ${person.firstName} ✓`);
      };
    });
  }
  document.getElementById('person-overlay').classList.add('open');
}

function closePerson() {
  document.getElementById('person-overlay').classList.remove('open');
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

// ── LEARN / WORK TAB ──────────────────────────────────────
function renderLearnTab() {
  const age = STATE.age, edu = STATE.school, isWork = age >= 18 && edu.level !== 'uni';
  const levelLabels = {
    pre:'Pre-School', primary:'Primary School', secondary:'Secondary School',
    college:'Sixth Form / College', uni:'University', finished_school:'School Complete',
  };
  document.getElementById('learn-hero-label').textContent = isWork ? 'Career' : 'Education';
  document.getElementById('learn-hero-val').textContent   = isWork ? STATE.career.job : (levelLabels[edu.level] || '—');
  document.getElementById('learn-hero-sub').textContent   = isWork ? `${fmtMoney(STATE.finances.income)} / year` : (edu.current || '');
  document.getElementById('learn-hero-val').style.cursor  = 'pointer';
  document.getElementById('learn-hero-val').onclick       = isWork ? null : openSchoolSheet;

  const gradeWrap = document.getElementById('grade-block-wrap');
  if (age >= 5 && age <= 18) {
    const grade = gradeFromScore(edu.gradeScore);
    gradeWrap.innerHTML = `
      <div class="grade-block">
        <div class="card-title" style="margin-bottom:8px">Current Grade</div>
        <div class="grade-value" style="color:${gradeColor(grade)}">${grade}</div>
        <div class="grade-bar-bg"><div class="grade-bar-fill" style="width:${edu.gradeScore}%;background:${gradeColor(grade)}"></div></div>
        <div style="font-size:11px;color:var(--text-faint);margin-top:6px;font-family:var(--mono)">${edu.gradeScore}/100</div>
      </div>`;
  } else {
    gradeWrap.innerHTML = '';
  }

  const rosterWrap = document.getElementById('roster-toggle-wrap');
  if (age >= 5 && age <= 18 && edu.classmates.length) {
    rosterWrap.style.display = 'block';
    renderRoster();
  } else {
    rosterWrap.style.display = 'none';
  }

  if (edu.scholarshipOffered && !edu._scholarshipHandled) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fefce8;border:1px solid #fde047;border-radius:12px;padding:14px 16px;font-size:13px;font-weight:600;color:#854d0e;cursor:pointer';
    banner.textContent = edu.scholarshipType === 'full'
      ? '🏆 You\'ve been offered a scholarship to a top school! Tap to accept.'
      : '⭐ A good school has offered you a place. Tap to find out more.';
    banner.onclick = () => handleScholarshipOffer();
    document.getElementById('learn-hero-sub').after(banner);
  }

  document.getElementById('learn-section-title').textContent = isWork ? 'Career Options' : 'Education Options';
  const acts  = isWork ? CAREER_ACTIONS : EDUCATION_ACTIONS;
  const actEl = document.getElementById('learn-actions');
  actEl.innerHTML = acts.map(a => buildActionHTML(a)).join('');
  wireActions(actEl, acts, () => { updateAllUI(); renderLearnTab(); });
  // Clear any previously appended classmate/teacher sections
  document.querySelectorAll('.cm-section, .tch-section').forEach(el => el.remove());

  if (age >= 5 && age <= 18 && edu.classmates.length) {
    const cmSection = document.createElement('div');
    cmSection.className = 'cm-section';
    cmSection.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    cmSection.innerHTML = `
      <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>Classmates</span>
        <span style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">${edu.classmates.length} students</span>
      </div>
      ${edu.classmates.map(c => `
        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px">
          <div style="font-size:24px;width:44px;height:44px;border-radius:12px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.emoji||'🧑'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700">${c.firstName} ${c.surname}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
              <span style="font-size:11px;color:var(--text-muted)">Grade</span>
              <span style="font-size:12px;font-weight:800;color:${gradeColor(c.grade)}">${c.grade}</span>
              <span style="font-size:11px;color:var(--text-faint)">·</span>
              <span style="font-size:11px;color:var(--text-muted)">${c.status==='friend'?'🤝 Friend':'Classmate'}</span>
            </div>
            ${(c.traits||[]).slice(0,2).map(tid => {
              const t = CLASSMATE_TRAITS_POOL.find(x => x.id === tid);
              if (!t) return '';
              const cls = t.positive===false?'negative':t.positive===true?'positive':'';
              return `<span class="trait-pill ${cls}" style="margin-top:6px;display:inline-block">${t.label}</span>`;
            }).join('')}
          </div>
          <button onclick="showToast('Interact — coming soon!')" style="width:32px;height:32px;border-radius:99px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted);cursor:pointer;flex-shrink:0">›</button>
        </div>`).join('')}`;
    actEl.after(cmSection);

    if (edu.teachers && edu.teachers.length) {
      const tchSection = document.createElement('div');
      tchSection.className = 'tch-section';
      tchSection.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      tchSection.innerHTML = `
        <div class="section-title">Teachers</div>
        ${edu.teachers.map(t => `
          <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="font-size:24px;width:44px;height:44px;border-radius:12px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0">${t.emoji||'👨‍🏫'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:700">${t.firstName} ${t.surname}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${t.subject}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                <span style="font-size:11px;color:var(--text-faint)">Strictness</span>
                <div style="flex:1;height:3px;background:var(--surface-mid);border-radius:99px;overflow:hidden;max-width:80px">
                  <div style="width:${t.strictness}%;height:100%;background:var(--text);border-radius:99px"></div>
                </div>
                <span style="font-size:11px;font-family:var(--mono);color:var(--text-faint)">${t.strictness}%</span>
              </div>
            </div>
            <button onclick="showToast('Talk to teacher — coming soon!')" style="width:32px;height:32px;border-radius:99px;background:var(--surface-mid);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted);cursor:pointer;flex-shrink:0">›</button>
          </div>`).join('')}`;
      cmSection.after(tchSection);
    }
  }
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
      <div class="roster-emoji">${p.emoji||'🧑'}</div>
      <div class="roster-name">${p.firstName} ${p.surname}${p.isPlayer?' (you)':''}</div>
      <div class="roster-grade-bar"><div class="roster-grade-fill" style="width:${p.gradeScore}%;background:${gradeColor(p.grade)}"></div></div>
      <div class="roster-grade" style="color:${gradeColor(p.grade)}">${p.grade}</div>
    </div>`).join('');
}

function handleScholarshipOffer() {
  STATE.school._scholarshipHandled = true;
  showToast('Scholarship feature coming soon!');
}

function openSchoolSheet() {
  const edu = STATE.school;
  const grade = gradeFromScore(edu.gradeScore);
  const typeLabels = { pre:'Pre-School', primary:'Primary School', secondary:'Secondary School', college:'Sixth Form / College', uni:'University' };
  const qualityMap = { lower:2, working:2, middle:3, upper_middle:4, elite:5 };
  const quality  = qualityMap[STATE.socialClass] || 2;
  const stars    = '★'.repeat(quality) + '☆'.repeat(5-quality);
  const isTarget = quality >= 4;
  const avgGrade = gradeFromScore(Math.max(20, edu.gradeScore - 10 + Math.floor(Math.random()*20)));

  const teachers = (edu.teachers||[]).map(t => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
      <div>
        <div style="font-size:13px;font-weight:700">${t.firstName} ${t.surname}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.subject}</div>
      </div>
      <div style="font-size:11px;font-family:var(--mono);color:var(--text-faint)">Strictness ${t.strictness}%</div>
    </div>`).join('');

  document.getElementById('person-inner').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:8px 0">
      <div style="font-size:48px">🏫</div>
      <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">${edu.current||'School'}</div>
      <div style="font-size:12px;color:var(--text-muted)">${typeLabels[edu.level]||''}</div>
      ${isTarget ? `<span class="badge badge-class">🎯 Target School</span>` : ''}
    </div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Your Grade</span><span class="detail-val bold" style="color:${gradeColor(grade)}">${grade}</span></div>
      <div class="detail-row"><span class="detail-label">Class Average</span><span class="detail-val" style="color:${gradeColor(avgGrade)}">${avgGrade}</span></div>
      <div class="detail-row"><span class="detail-label">Teacher Quality</span><span class="detail-val" style="color:var(--text-muted);letter-spacing:2px">${stars}</span></div>
      <div class="detail-row"><span class="detail-label">Target School</span><span class="detail-val">${isTarget?'✅ Yes':'❌ No'}</span></div>
    </div>
    ${teachers ? `<div class="section-title">Teachers</div><div style="background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:0 16px">${teachers}</div>` : ''}
    <div class="section-title">Classmates</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${(edu.classmates||[]).slice(0,5).map(c => `
        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px">
          <div style="font-size:22px">${c.emoji||'🧑'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700">${c.firstName} ${c.surname}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:1px">Grade: <strong style="color:${gradeColor(c.grade)}">${c.grade}</strong></div>
          </div>
          <div style="font-size:11px;font-family:var(--mono);color:var(--text-faint)">${c.relationship}% rel</div>
        </div>`).join('')}
    </div>`;
  document.getElementById('person-overlay').classList.add('open');
}

// ── IDENTITY SHEET ────────────────────────────────────────
function openIdentitySheet() {
  const s = STATE;
  const traits = s.traits.map(tid => {
    const t = PLAYER_TRAITS_POOL.find(x => x.id === tid);
    return t ? `<span class="trait-pill player">${t.emoji} ${t.label}</span>` : '';
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
    { name:'Mathematics',      emoji:'📐' },
    { name:'English Language', emoji:'📖' },
    { name:'English Literature',emoji:'📚' },
    { name:'Biology',          emoji:'🔬' },
    { name:'Chemistry',        emoji:'⚗️' },
    { name:'Physics',          emoji:'🔭' },
    { name:'History',          emoji:'🏛️' },
    STATE.traits.includes('creative')    ? { name:'Art & Design',     emoji:'🎨' } :
    STATE.traits.includes('intelligent') ? { name:'Computer Science', emoji:'💻' } :
    STATE.traits.includes('ambitious')   ? { name:'Business Studies', emoji:'💼' } :
                                           { name:'Geography',        emoji:'🌍' },
  ];
  const grades = subjects.map(s => ({
    ...s, grade: gradeFromScore(clamp(score + Math.floor(Math.random()*20) - 10, 0, 100)),
  }));
  STATE.school.gcsResults = grades;

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
  document.getElementById('event-inner').innerHTML = `
    <div class="outcome-text">${choice.outcome || choice.log}</div>
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
    document.getElementById('age-up-btn').disabled  = true;
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
