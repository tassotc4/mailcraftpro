import { supabase } from '../_supabase.js';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, referralCode } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    // Set up new user
    const user = {
      id: generateId(),
      name,
      email: email.toLowerCase(),
      password: btoa(password),
      plan: 'free',
      emails_used: 0,
      emails_limit: 3,
      bonus_emails: 0,
      monthly_emails_used: 0,
      emails_month: '',
      referral_code: generateReferralCode(),
      referred_by: referralCode || '',
      referral_count: 0,
      pro_token: '',
      brand_kit: { name, company: '', role: '', tone: 'professional', signature: '' },
    };

    // Credit referrer if valid referral code
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrer) {
        await supabase
          .from('users')
          .update({
            bonus_emails: (referrer.bonus_emails || 0) + 5,
            referral_count: (referrer.referral_count || 0) + 1,
            emails_limit: (referrer.emails_limit || 3) + 5,
          })
          .eq('id', referrer.id);

        user.bonus_emails = 5;
        user.emails_limit = 8;
      }
    }

    // Insert new user
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) throw error;

    // Return user in camelCase format for client
    return res.status(200).json({ user: toClient(data) });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: err.message || 'Signup failed.' });
  }
}

function toClient(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    plan: u.plan,
    emailsUsed: u.emails_used,
    emailsLimit: u.emails_limit,
    bonusEmails: u.bonus_emails,
    monthlyEmailsUsed: u.monthly_emails_used,
    emailsMonth: u.emails_month,
    referralCode: u.referral_code,
    referredBy: u.referred_by,
    referralCount: u.referral_count,
    proToken: u.pro_token,
    brandKit: u.brand_kit,
    createdAt: u.created_at,
  };
}
