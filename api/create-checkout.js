import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  'pro-annual': process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email, planId = 'pro' } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const priceId = PRICE_IDS[planId];
  if (!priceId) return res.status(400).json({ error: `Missing price ID for plan: ${planId}. Check STRIPE_${planId.toUpperCase().replace('-','_')}_PRICE_ID env var.` });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId,
      success_url: `${appUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel.html`,
      subscription_data: { metadata: { userId, plan: planId } },
      metadata: { userId, plan: planId },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
  }
}
