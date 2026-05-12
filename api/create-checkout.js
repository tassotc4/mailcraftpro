// Vercel serverless function — create Stripe checkout session
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      client_reference_id: userId,
      success_url: `${appUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel.html`,
      subscription_data: {
        metadata: { userId },
      },
      metadata: { userId },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}
