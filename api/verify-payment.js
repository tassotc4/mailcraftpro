// Vercel serverless function — verify Stripe session and issue pro token
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function createProToken(userId, plan) {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) throw new Error('TOKEN_SECRET not configured');
  const payload = JSON.stringify({ userId, plan, pro: true, ts: Date.now() });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const userId = session.client_reference_id || session.metadata?.userId;
    if (!userId) return res.status(400).json({ error: 'Could not identify user from session' });

    const plan = session.metadata?.plan || 'pro';
    const proToken = createProToken(userId, plan);

    return res.status(200).json({
      success: true,
      userId,
      proToken,
      plan,
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    return res.status(500).json({ error: 'Failed to verify payment. Please contact support.' });
  }
}
