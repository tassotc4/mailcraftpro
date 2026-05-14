import {
  getUser, requireAuth, logout, updateUser,
  canGenerateEmail, getRemainingEmails, recordEmailGenerated,
  getHistory, saveToHistory, deleteFromHistory,
  upgradeUserWithToken,
} from './auth.js';

// ---- Email type definitions ----
const EMAIL_TYPES = {
  'real-estate': [
    { value: 'listing', label: 'New Listing Announcement' },
    { value: 'follow-up', label: 'Buyer / Seller Follow-up' },
    { value: 'offer', label: 'Offer Submission Cover' },
    { value: 'showing', label: 'Showing Request' },
    { value: 'market-update', label: 'Market Update Newsletter' },
    { value: 'referral-thanks', label: 'Referral Thank You' },
  ],
  'lawyer': [
    { value: 'client-intake', label: 'Client Intake / Welcome' },
    { value: 'case-update', label: 'Case Status Update' },
    { value: 'consultation', label: 'Consultation Invitation' },
    { value: 'billing', label: 'Invoice / Billing Notice' },
    { value: 'follow-up', label: 'General Follow-up' },
    { value: 'settlement', label: 'Settlement Discussion' },
  ],
  'doctor': [
    { value: 'patient-followup', label: 'Patient Follow-up' },
    { value: 'appointment', label: 'Appointment Reminder' },
    { value: 'referral', label: 'Specialist Referral' },
    { value: 'lab-results', label: 'Lab Results Notification' },
    { value: 'welcome', label: 'New Patient Welcome' },
  ],
  'freelancer': [
    { value: 'proposal', label: 'Project Proposal' },
    { value: 'invoice', label: 'Invoice / Payment Request' },
    { value: 'cold-outreach', label: 'Cold Outreach' },
    { value: 'follow-up', label: 'Project Follow-up' },
    { value: 'completion', label: 'Project Completion' },
    { value: 'rate-increase', label: 'Rate Increase Notice' },
  ],
  'coach': [
    { value: 'discovery', label: 'Discovery Call Invitation' },
    { value: 'program-pitch', label: 'Coaching Program Pitch' },
    { value: 'check-in', label: 'Client Check-in' },
    { value: 'testimonial', label: 'Testimonial Request' },
    { value: 'renewal', label: 'Program Renewal' },
  ],
  'consultant': [
    { value: 'proposal', label: 'Consulting Proposal' },
    { value: 'status-update', label: 'Project Status Update' },
    { value: 'discovery', label: 'Discovery Session Invite' },
    { value: 'invoice', label: 'Invoice / Statement of Work' },
    { value: 'referral-ask', label: 'Referral Request' },
    { value: 'cold-outreach', label: 'Cold Outreach' },
  ],
  'sales': [
    { value: 'cold-outreach', label: 'Cold Outreach / Prospecting' },
    { value: 'follow-up', label: 'Post-Meeting Follow-up' },
    { value: 'demo-request', label: 'Demo / Call Request' },
    { value: 'closing', label: 'Closing / Final Pitch' },
    { value: 'check-in', label: 'Check-in / Nurture' },
    { value: 'lost-deal', label: 'Lost Deal Re-engagement' },
  ],
  'recruiter': [
    { value: 'job-offer', label: 'Job Offer Letter' },
    { value: 'interview-invite', label: 'Interview Invitation' },
    { value: 'rejection', label: 'Candidate Rejection' },
    { value: 'onboarding', label: 'Onboarding Welcome' },
    { value: 'reference-check', label: 'Reference Check Request' },
    { value: 'sourcing', label: 'Candidate Sourcing / Outreach' },
  ],
  'property-manager': [
    { value: 'lease-renewal', label: 'Lease Renewal Notice' },
    { value: 'maintenance', label: 'Maintenance Notice / Update' },
    { value: 'late-rent', label: 'Late Rent Reminder' },
    { value: 'move-in', label: 'Move-in Instructions' },
    { value: 'move-out', label: 'Move-out Notice / Deposit' },
  ],
  'financial-advisor': [
    { value: 'portfolio-review', label: 'Portfolio Review Meeting' },
    { value: 'market-update', label: 'Market / Economic Update' },
    { value: 'planning-session', label: 'Financial Planning Session' },
    { value: 'referral-ask', label: 'Referral Request' },
    { value: 'new-client', label: 'New Client Welcome' },
  ],
  'accountant': [
    { value: 'tax-deadline', label: 'Tax Deadline Reminder' },
    { value: 'document-request', label: 'Document Request' },
    { value: 'engagement-letter', label: 'Engagement Letter' },
    { value: 'fee-quote', label: 'Fee Quote / Proposal' },
    { value: 'year-end', label: 'Year-End Checklist' },
  ],
  'personal-trainer': [
    { value: 'intro', label: 'Program Introduction' },
    { value: 'check-in', label: 'Client Check-in' },
    { value: 'package-offer', label: 'Package / Membership Offer' },
    { value: 'cancellation', label: 'Cancellation Follow-up' },
    { value: 'milestone', label: 'Milestone Congratulations' },
  ],
};

const PROFESSION_LABELS = {
  'real-estate': 'Real Estate Agent',
  'lawyer': 'Lawyer',
  'doctor': 'Doctor',
  'freelancer': 'Freelancer',
  'coach': 'Coach',
  'consultant': 'Consultant',
  'sales': 'Sales Representative',
  'recruiter': 'HR Recruiter',
  'property-manager': 'Property Manager',
  'financial-advisor': 'Financial Advisor',
  'accountant': 'Accountant',
  'personal-trainer': 'Personal Trainer',
};

// ---- State ----
let currentUser = null;
let currentView = 'compose';
let selectedTone = 'professional';
let lastGenerated = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  renderSidebar();
  setupNavigation();
  setupCompose();
  setupBrandKit();
  setupReferrals();
  setupHistory();
  setupSettings();
  setupUpgradeModal();

  if (localStorage.getItem('mcp_show_welcome') === '1') {
    localStorage.removeItem('mcp_show_welcome');
    showWelcomeBanner();
  }
  if (localStorage.getItem('mcp_show_upgrade') === '1') {
    localStorage.removeItem('mcp_show_upgrade');
    openUpgradeModal();
  }

  const proToken = localStorage.getItem('mcp_pending_pro_token');
  if (proToken) {
    const plan = localStorage.getItem('mcp_pending_plan') || 'pro';
    localStorage.removeItem('mcp_pending_pro_token');
    localStorage.removeItem('mcp_pending_plan');
    currentUser = await upgradeUserWithToken(proToken, plan);
    renderSidebar();
    const msgs = {
      starter: '🎉 You\'re now on Starter! 100 emails/month unlocked.',
      pro: '🎉 You\'re now on Pro! Unlimited emails unlocked.',
      'pro-annual': '🎉 You\'re now on Pro Annual! Unlimited emails unlocked.',
    };
    showToast(msgs[plan] || '🎉 Plan upgraded!', 'success');
  }
});

// ---- Sidebar ----
function renderSidebar() {
  const plan = currentUser.plan;
  const isUnlimited = (plan === 'pro' || plan === 'pro-annual') && currentUser.proToken;
  const isStarter = plan === 'starter' && currentUser.proToken;
  const remaining = getRemainingEmails(currentUser);

  let label, count;
  if (isUnlimited) {
    label = plan === 'pro-annual' ? 'Pro Annual — Unlimited' : 'Pro — Unlimited';
    count = '∞';
  } else if (isStarter) {
    label = 'Starter Plan';
    count = `${remaining}/100 remaining`;
  } else {
    label = 'Free Trial';
    const limit = currentUser.emailsLimit || 3;
    const used = currentUser.emailsUsed || 0;
    count = `${limit - used}/${limit} remaining`;
  }

  document.getElementById('creditsLabel').textContent = label;
  document.getElementById('creditsCount').textContent = count;

  const fill = document.getElementById('creditsFill');
  if (isUnlimited) {
    fill.style.width = '100%';
    fill.className = 'credits-fill';
  } else if (isStarter) {
    const pct = Math.min((remaining / 100) * 100, 100);
    fill.style.width = pct + '%';
    fill.className = 'credits-fill' + (pct <= 20 ? ' danger' : pct <= 50 ? ' warning' : '');
  } else {
    const limit = currentUser.emailsLimit || 3;
    const used = currentUser.emailsUsed || 0;
    const pct = limit > 0 ? Math.min(((limit - used) / limit) * 100, 100) : 0;
    fill.style.width = pct + '%';
    fill.className = 'credits-fill' + (pct <= 33 ? ' danger' : pct <= 66 ? ' warning' : '');
  }

  const upgradeBtn = document.getElementById('upgradeBtn');
  if (isUnlimited || isStarter) {
    const badges = { pro: '⭐ Pro Plan Active', 'pro-annual': '⭐ Pro Annual Active', starter: '✓ Starter Plan Active' };
    upgradeBtn.outerHTML = `<div class="pro-badge">${badges[plan] || '⭐ Plan Active'}</div>`;
  } else {
    upgradeBtn.onclick = openUpgradeModal;
  }

  const avatar = document.getElementById('userAvatar');
  avatar.textContent = (currentUser.name || currentUser.email || 'U')[0].toUpperCase();
  document.getElementById('userName').childNodes[0].textContent = currentUser.name || 'User';
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('logoutBtn').onclick = () => logout();
}

// ---- Navigation ----
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

  if (view === 'history') renderHistory();
  if (view === 'referrals') renderReferrals();
  if (view === 'settings') renderSettings();
  if (view === 'brandkit') loadBrandKit();
}

// ---- Welcome Banner ----
function showWelcomeBanner() {
  const banner = document.getElementById('welcomeBanner');
  const remaining = getRemainingEmails(currentUser);
  document.getElementById('welcomeCredits').textContent =
    remaining === Infinity ? 'unlimited emails' : `${remaining} free email${remaining !== 1 ? 's' : ''}`;
  banner.style.display = 'flex';
  document.getElementById('closeBanner').onclick = () => { banner.style.display = 'none'; };
  window.history.replaceState({}, '', 'app.html');
}

// ---- Compose ----
function setupCompose() {
  const profSel = document.getElementById('professionSelect');
  const typeSel = document.getElementById('emailTypeSelect');

  profSel.addEventListener('change', () => {
    const prof = profSel.value;
    if (!prof) {
      hide('emailTypeSection'); hide('detailsSection');
      hide('contextSection'); hide('toneSection'); hide('generateSection');
      return;
    }
    // Populate email types
    const types = EMAIL_TYPES[prof] || [];
    typeSel.innerHTML = '<option value="">— Select email type —</option>' +
      types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
    show('emailTypeSection'); hide('detailsSection');
    hide('contextSection'); hide('toneSection'); hide('generateSection');
  });

  typeSel.addEventListener('change', () => {
    if (!typeSel.value) return;
    show('detailsSection'); show('contextSection');
    show('toneSection'); show('generateSection');
    // Load brand kit defaults
    const bk = currentUser.brandKit || {};
    if (bk.tone) setTone(bk.tone);
  });

  // Tone selection
  document.querySelectorAll('.tone-option').forEach(opt => {
    opt.addEventListener('click', () => setTone(opt.dataset.tone));
  });

  document.getElementById('generateBtn').addEventListener('click', generateEmail);

  document.getElementById('copyBtn').addEventListener('click', copyEmail);
  document.getElementById('regenerateBtn').addEventListener('click', generateEmail);
  document.getElementById('saveHistoryBtn').addEventListener('click', saveCurrentEmail);
}

function setTone(tone) {
  selectedTone = tone;
  document.querySelectorAll('.tone-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.tone === tone);
  });
}

async function generateEmail() {
  currentUser = getUser();

  if (!canGenerateEmail(currentUser)) {
    openUpgradeModal();
    return;
  }

  const profession = document.getElementById('professionSelect').value;
  const emailType = document.getElementById('emailTypeSelect').value;
  const recipient = document.getElementById('recipientInput').value.trim();
  const context = document.getElementById('contextInput').value.trim();

  if (!profession || !emailType) { showToast('Please select a profession and email type.', 'error'); return; }
  if (!context) { showToast('Please add some context or details for your email.', 'error'); return; }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  document.getElementById('outputCard').classList.remove('show');
  document.getElementById('outputPlaceholder').style.display = 'flex';

  try {
    const brandKit = currentUser.brandKit || {};
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profession,
        emailType,
        recipient,
        context,
        tone: selectedTone,
        brandKit,
        userPlan: currentUser.plan,
        proToken: currentUser.proToken,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${res.status}`);
    }

    const data = await res.json();
    const { subject, body } = parseEmail(data.email);

    lastGenerated = { profession, emailType, recipient, context, tone: selectedTone, subject, body };

    // Decrement trial counter
    currentUser = await recordEmailGenerated(currentUser);
    renderSidebar();

    renderOutput(subject, body, profession, emailType);
  } catch (err) {
    showToast(err.message || 'Failed to generate email. Please try again.', 'error');
    document.getElementById('outputPlaceholder').style.display = 'flex';
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

function parseEmail(text) {
  const lines = text.trim().split('\n');
  let subject = '';
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('subject:')) {
      subject = line.replace(/^subject:\s*/i, '').trim();
      bodyStart = i + 1;
      // Skip blank line after subject
      while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
      break;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  return { subject, body };
}

function renderOutput(subject, body, profession, emailType) {
  document.getElementById('outputSubject').textContent = subject || '(No subject)';
  document.getElementById('outputBody').textContent = body;
  document.getElementById('outputPlaceholder').style.display = 'none';
  document.getElementById('outputCard').classList.add('show');

  const profLabel = PROFESSION_LABELS[profession] || profession;
  const typeLabel = (EMAIL_TYPES[profession] || []).find(t => t.value === emailType)?.label || emailType;
  document.getElementById('outputMeta').innerHTML =
    `<span class="output-meta-item">📋 ${typeLabel}</span>
     <span class="output-meta-item">👤 ${profLabel}</span>
     <span class="output-meta-item">🎭 ${selectedTone}</span>
     <span class="output-meta-item">📝 ${body.split(' ').length} words</span>`;
}

function copyEmail() {
  if (!lastGenerated) return;
  const text = `Subject: ${lastGenerated.subject}\n\n${lastGenerated.body}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

function saveCurrentEmail() {
  if (!lastGenerated) return;
  saveToHistory(lastGenerated);
  showToast('Email saved to history.', 'success');
}

// ---- History ----
function setupHistory() {
  document.getElementById('historySearch').addEventListener('input', renderHistory);
}

function renderHistory() {
  const query = document.getElementById('historySearch').value.toLowerCase();
  let history = getHistory();

  if (query) {
    history = history.filter(e =>
      (e.subject || '').toLowerCase().includes(query) ||
      (e.body || '').toLowerCase().includes(query) ||
      (e.profession || '').toLowerCase().includes(query)
    );
  }

  const container = document.getElementById('historyList');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">${query ? '🔍' : '📭'}</div>
        <h3>${query ? 'No emails match your search.' : 'No emails saved yet.'}</h3>
        <p>${query ? 'Try a different search term.' : 'Generate emails and click "Save" to keep them here.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const profLabel = PROFESSION_LABELS[item.profession] || item.profession || '';
    const types = EMAIL_TYPES[item.profession] || [];
    const typeLabel = types.find(t => t.value === item.emailType)?.label || item.emailType || '';
    const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const preview = (item.body || '').slice(0, 120) + '…';

    return `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-header">
          <div class="history-item-subject">${escHtml(item.subject || 'No subject')}</div>
          <div class="history-item-date">${date}</div>
        </div>
        <div class="history-item-meta">
          <span class="history-chip">${escHtml(profLabel)}</span>
          <span class="history-chip">${escHtml(typeLabel)}</span>
          <span class="history-chip">🎭 ${escHtml(item.tone || 'professional')}</span>
        </div>
        <div class="history-item-preview">${escHtml(preview)}</div>
        <div class="history-item-actions">
          <button class="action-btn" onclick="copyHistoryItem('${item.id}')">📋 Copy</button>
          <button class="action-btn" onclick="loadHistoryItem('${item.id}')">✍️ Edit in Compose</button>
          <button class="action-btn" style="color:var(--danger)" onclick="deleteHistoryItem('${item.id}')">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');
}

window.copyHistoryItem = (id) => {
  const item = getHistory().find(e => e.id === id);
  if (!item) return;
  navigator.clipboard.writeText(`Subject: ${item.subject}\n\n${item.body}`)
    .then(() => showToast('Copied to clipboard!', 'success'));
};

window.loadHistoryItem = (id) => {
  const item = getHistory().find(e => e.id === id);
  if (!item) return;
  switchView('compose');
  const profSel = document.getElementById('professionSelect');
  profSel.value = item.profession;
  profSel.dispatchEvent(new Event('change'));
  setTimeout(() => {
    document.getElementById('emailTypeSelect').value = item.emailType;
    document.getElementById('emailTypeSelect').dispatchEvent(new Event('change'));
    document.getElementById('recipientInput').value = item.recipient || '';
    document.getElementById('contextInput').value = item.context || '';
    setTone(item.tone || 'professional');
    lastGenerated = item;
    renderOutput(item.subject, item.body, item.profession, item.emailType);
  }, 50);
};

window.deleteHistoryItem = (id) => {
  deleteFromHistory(id);
  renderHistory();
  showToast('Email deleted from history.');
};

// ---- Brand Kit ----
function loadBrandKit() {
  const bk = currentUser.brandKit || {};
  document.getElementById('bkName').value = bk.name || '';
  document.getElementById('bkCompany').value = bk.company || '';
  document.getElementById('bkRole').value = bk.role || '';
  document.getElementById('bkPhone').value = bk.phone || '';
  document.getElementById('bkTone').value = bk.tone || 'professional';
  document.getElementById('bkVoice').value = bk.voice || '';
  document.getElementById('bkSignature').value = bk.signature || '';
}

function setupBrandKit() {
  document.getElementById('saveBrandKit').addEventListener('click', async () => {
    const brandKit = {
      name: document.getElementById('bkName').value.trim(),
      company: document.getElementById('bkCompany').value.trim(),
      role: document.getElementById('bkRole').value.trim(),
      phone: document.getElementById('bkPhone').value.trim(),
      tone: document.getElementById('bkTone').value,
      voice: document.getElementById('bkVoice').value.trim(),
      signature: document.getElementById('bkSignature').value.trim(),
    };
    currentUser = await updateUser({ brandKit });
    const btn = document.getElementById('saveBrandKit');
    btn.textContent = '✓ Saved!';
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = 'Save Brand Kit'; btn.classList.remove('saved'); }, 2000);
  });
}

// ---- Referrals ----
function renderReferrals() {
  const code = currentUser.referralCode || '';
  const url = `${window.location.origin}/signup?ref=${code}`;
  document.getElementById('referralLinkUrl').textContent = url;
  document.getElementById('refCount').textContent = currentUser.referralCount || 0;
  document.getElementById('refBonus').textContent = (currentUser.referralCount || 0) * 5;
  document.getElementById('refRemaining').textContent =
    currentUser.plan === 'pro' ? '∞' : getRemainingEmails(currentUser);

  document.getElementById('copyReferralBtn').onclick = () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyReferralBtn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  };
}

function setupReferrals() {} // rendered on view switch

// ---- Settings ----
function renderSettings() {
  document.getElementById('settingsEmail').textContent = currentUser.email;
  const planDisplay = {
    free: 'Free (3 emails)',
    starter: 'Starter ($9/month · 100 emails)',
    pro: 'Pro ($19/month · Unlimited)',
    'pro-annual': 'Pro Annual ($149/year · Unlimited)',
  };
  document.getElementById('settingsPlan').textContent =
    planDisplay[currentUser.plan] || 'Free (3 emails)';
  document.getElementById('settingsJoined').textContent =
    new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function setupSettings() {
  document.getElementById('settingsUpgradeBtn').addEventListener('click', openUpgradeModal);
  document.getElementById('settingsLogoutBtn').addEventListener('click', () => logout());
  document.getElementById('manageSubBtn').addEventListener('click', () => {
    showToast('Redirecting to Stripe billing portal…');
  });
  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm('Delete all saved emails? This cannot be undone.')) {
      localStorage.removeItem('mcp_history');
      showToast('History cleared.');
    }
  });
}

// ---- Upgrade Modal ----
function setupUpgradeModal() {
  document.getElementById('upgradeModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('upgradeModal')) closeUpgradeModal();
  });
  document.getElementById('modalClose').addEventListener('click', closeUpgradeModal);
  document.querySelectorAll('.modal-checkout-btn[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => startCheckout(btn.dataset.plan));
  });
}

function openUpgradeModal() {
  document.getElementById('upgradeModal').classList.add('show');
}
function closeUpgradeModal() {
  document.getElementById('upgradeModal').classList.remove('show');
}

async function startCheckout(planId = 'pro') {
  const btn = document.querySelector(`.modal-checkout-btn[data-plan="${planId}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Redirecting…'; }

  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, email: currentUser.email, planId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Could not create checkout session.');
    }
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = planId === 'starter' ? 'Get Starter →' : planId === 'pro-annual' ? 'Get Annual →' : 'Get Pro →'; }
  }
}

// ---- Utilities ----
function show(id) { document.getElementById(id).style.display = ''; }
function hide(id) { document.getElementById(id).style.display = 'none'; }

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}
