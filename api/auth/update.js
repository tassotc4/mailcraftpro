import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, updates } = req.body || {};
  if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates' });

  try {
    const dbUpdates = {};
    if (updates.emailsUsed !== undefined) dbUpdates.emails_used = updates.emailsUsed;
    if (updates.emailsLimit !== undefined) dbUpdates.emails_limit = updates.emailsLimit;
    if (updates.bonusEmails !== undefined) dbUpdates.bonus_emails = updates.bonusEmails;
    if (updates.monthlyEmailsUsed !== undefined) dbUpdates.monthly_emails_used = updates.monthlyEmailsUsed;
    if (updates.emailsMonth !== undefined) dbUpdates.emails_month = updates.emailsMonth;
    if (updates.referralCount !== undefined) dbUpdates.referral_count = updates.referralCount;
    if (updates.proToken !== undefined) dbUpdates.pro_token = updates.proToken;
    if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
    if (updates.brandKit !== undefined) dbUpdates.brand_kit = updates.brandKit;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ user: toClient(data) });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ error: 'Update failed.' });
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
