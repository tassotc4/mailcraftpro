import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) return res.status(401).json({ error: 'No account found with this email.' });
    if (user.password !== btoa(password)) return res.status(401).json({ error: 'Incorrect password.' });

    return res.status(200).json({ user: toClient(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
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
