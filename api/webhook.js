// Vercel serverless function — Stripe webhook handler
// IMPORTANT: Set this route to receive raw body (no JSON parsing) in vercel.json
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log('Stripe event received:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      console.log(`Payment completed for user: ${userId}`);
      // In production: update user record in DB to plan='pro'
      // For this demo, the client polls /api/verify-payment after redirect
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      console.log(`Subscription cancelled for user: ${userId}`);
      // In production: downgrade user in DB to plan='free'
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`Payment failed for customer: ${invoice.customer}`);
      // In production: notify user and potentially suspend access
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
