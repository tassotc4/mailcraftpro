// Auth utilities — Supabase-backed session management
// Session stored in localStorage, user data in Supabase

import { validateEmail } from './email-validator.js';

const AUTH_KEY = 'mcp_user';
const HISTORY_KEY = 'mcp_history';

// ---- Session ----
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

// ---- Signup ----
export async function signup({ name, email, password, referralCode }) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, referralCode }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed.');

  saveUser(data.user);
  return data.user;
}

// ---- Login ----
export async function login({ email, password }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed.');

  saveUser(data.user);
  return data.user;
}

// ---- Update User ----
export async function updateUser(updates) {
  const user = getUser();
  if (!user) return null;

  const updated = { ...user, ...updates };
  saveUser(updated);

  // Sync to Supabase in background
  try {
    const res = await fetch('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, updates }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      saveUser(data.user);
      return data.user;
    }
  } catch (err) {
    console.error('Sync error:', err);
  }

  return updated;
}

// ---- Plan Logic ----
function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function monthlyUsed(user) {
  if (user.emailsMonth !== getMonthKey()) return 0;
  return user.monthlyEmailsUsed || 0;
}

export function canGenerateEmail(user) {
  if ((user.plan === 'pro' || user.plan === 'pro-annual') && user.proToken) return true;
  if (user.plan === 'starter' && user.proToken) return monthlyUsed(user) < 100;
  return (user.emailsUsed || 0) < (user.emailsLimit || 3);
}

export function getRemainingEmails(user) {
  if ((user.plan === 'pro' || user.plan === 'pro-annual') && user.proToken) return Infinity;
  if (user.plan === 'starter' && user.proToken) return Math.max(0, 100 - monthlyUsed(user));
  return Math.max(0, (user.emailsLimit || 3) - (user.emailsUsed || 0));
}

export async function recordEmailGenerated(user) {
  if ((user.plan === 'pro' || user.plan === 'pro-annual') && user.proToken) return user;
  if (user.plan === 'starter' && user.proToken) {
    const month = getMonthKey();
    const used = monthlyUsed(user);
    return await updateUser({ monthlyEmailsUsed: used + 1, emailsMonth: month });
  }
  return await updateUser({ emailsUsed: (user.emailsUsed || 0) + 1 });
}

export async function upgradeUserWithToken(proToken, plan = 'pro') {
  return await updateUser({ plan, proToken, emailsLimit: Infinity });
}

// ---- Email History (localStorage) ----
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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
