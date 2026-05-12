// Auth utilities — localStorage-based session management
// In production: replace with JWT + real DB (Supabase, PlanetScale, etc.)

import { validateEmail } from './email-validator.js';

const AUTH_KEY = 'mcp_user';
const HISTORY_KEY = 'mcp_history';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

export function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  return user;
}

export function signup({ name, email, password, referralCode }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const existing = getAllUsers().find(u => u.email === email);
  if (existing) throw new Error('An account with this email already exists.');

  const user = {
    id: generateId(),
    name,
    email,
    password: btoa(password), // obfuscated, not secure — use bcrypt in production
    plan: 'free',
    emailsUsed: 0,
    emailsLimit: 3,
    bonusEmails: 0,
    referralCode: generateReferralCode(),
    referredBy: referralCode || null,
    referralCount: 0,
    proToken: null,
    createdAt: new Date().toISOString(),
    brandKit: {
      name: name,
      company: '',
      role: '',
      tone: 'professional',
      signature: '',
    },
  };

  // Credit referrer
  if (referralCode) {
    const allUsers = getAllUsers();
    const referrer = allUsers.find(u => u.referralCode === referralCode);
    if (referrer) {
      referrer.bonusEmails = (referrer.bonusEmails || 0) + 5;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      referrer.emailsLimit = (referrer.emailsLimit || 3) + 5;
      saveAllUsers(allUsers.map(u => u.id === referrer.id ? referrer : u));
    }
    user.bonusEmails = 5;
    user.emailsLimit = 8;
  }

  const allUsers = getAllUsers();
  allUsers.push(user);
  saveAllUsers(allUsers);
  saveUser(user);
  return user;
}

export function login({ email, password }) {
  const allUsers = getAllUsers();
  const user = allUsers.find(u => u.email === email);
  if (!user) throw new Error('No account found with this email.');
  if (user.password !== btoa(password)) throw new Error('Incorrect password.');
  saveUser(user);
  return user;
}

export function updateUser(updates) {
  const user = getUser();
  if (!user) return;
  const updated = { ...user, ...updates };
  saveUser(updated);
  const allUsers = getAllUsers();
  saveAllUsers(allUsers.map(u => u.id === updated.id ? updated : u));
  return updated;
}

export function canGenerateEmail(user) {
  if (user.plan === 'pro' && user.proToken) return true;
  return (user.emailsUsed || 0) < (user.emailsLimit || 3);
}

export function getRemainingEmails(user) {
  if (user.plan === 'pro' && user.proToken) return Infinity;
  return Math.max(0, (user.emailsLimit || 3) - (user.emailsUsed || 0));
}

export function recordEmailGenerated(user) {
  if (user.plan === 'pro' && user.proToken) return updateUser(user);
  return updateUser({ emailsUsed: (user.emailsUsed || 0) + 1 });
}

// Email history
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry) {
  const history = getHistory();
  history.unshift({ ...entry, id: generateId(), createdAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

export function deleteFromHistory(id) {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Multi-user store (demo: all in localStorage)
function getAllUsers() {
  try {
    return JSON.parse(localStorage.getItem('mcp_users')) || [];
  } catch {
    return [];
  }
}

function saveAllUsers(users) {
  localStorage.setItem('mcp_users', JSON.stringify(users));
}

export function upgradeUserWithToken(proToken) {
  return updateUser({ plan: 'pro', proToken, emailsLimit: Infinity });
}
