// Vercel serverless function — email generation via Anthropic Claude
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  'real-estate': `You are an expert email copywriter specializing in real estate. You write warm, professional, and persuasive emails for real estate agents that build trust, drive action, and reflect market expertise. Your emails follow NAR professional standards, include compelling subject lines, and always end with a clear call to action.`,

  'lawyer': `You are an expert email copywriter for legal professionals. You write clear, precise, and professional emails that maintain appropriate legal formality while remaining accessible to clients. Your emails are measured in tone, avoid speculation, include proper disclaimers where appropriate, and maintain attorney-client professionalism throughout.`,

  'doctor': `You are an expert email copywriter for healthcare professionals. You write compassionate, clear, and HIPAA-conscious emails for doctors and medical staff. Your emails are empathetic, use plain language (not excessive jargon), maintain patient confidentiality, and convey care and professionalism.`,

  'freelancer': `You are an expert email copywriter for freelancers and independent contractors. You write confident, clear, and value-focused emails that position the freelancer as a professional expert. Your emails are direct, highlight value, include clear next steps, and maintain a collaborative yet professional tone.`,

  'coach': `You are an expert email copywriter for coaches (life, business, executive). You write energizing, empathetic, and action-oriented emails that inspire clients. Your emails are warm but purposeful, highlight transformation and outcomes, and always invite the reader toward a next step or commitment.`,

  'consultant': `You are an expert email copywriter for management and business consultants. You write authoritative, insight-driven, and results-oriented emails that position the consultant as a trusted advisor. Your emails are concise, data-aware, and clearly communicate value and next steps.`,

  'sales': `You are an expert email copywriter for B2B and B2C sales representatives. You write compelling, benefit-focused, and persuasive emails that open conversations and move deals forward. Your emails follow proven sales frameworks (AIDA, PAS), are personalized in tone, and always include a specific, low-friction call to action.`,

  'recruiter': `You are an expert email copywriter for HR recruiters and talent acquisition professionals. You write professional, engaging, and respectful emails to candidates and hiring managers. Your emails are clear about next steps, maintain employer brand voice, and whether accepting or rejecting candidates, always leave recipients feeling respected.`,

  'property-manager': `You are an expert email copywriter for residential and commercial property managers. You write professional, firm, and clear emails for tenant communications, maintenance notices, and lease matters. Your emails are legally appropriate, factual, and maintain a professional landlord-tenant relationship.`,

  'financial-advisor': `You are an expert email copywriter for financial advisors and wealth managers. You write trustworthy, compliance-aware, and relationship-focused emails. Your emails avoid specific investment promises, use appropriate disclaimers where needed, and position the advisor as a knowledgeable partner in the client's financial journey.`,

  'accountant': `You are an expert email copywriter for accountants, CPAs, and tax professionals. You write clear, organized, and deadline-conscious emails. Your emails are precise with dates and requirements, use accessible language to explain complex topics, and maintain the trust and confidentiality of professional accounting relationships.`,

  'personal-trainer': `You are an expert email copywriter for personal trainers and fitness professionals. You write motivating, supportive, and results-focused emails that energize clients. Your emails celebrate progress, communicate program details clearly, and maintain an enthusiastic yet professional coaching relationship.`,
};

function verifyProToken(token) {
  if (!token) return false;
  try {
    const secret = process.env.TOKEN_SECRET;
    if (!secret) return false;
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { payload, sig } = decoded;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const data = JSON.parse(payload);
    return data.pro === true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    profession, emailType, recipient, context,
    tone, brandKit, userPlan, proToken,
  } = req.body || {};

  if (!profession || !emailType || !context) {
    return res.status(400).json({ error: 'Missing required fields: profession, emailType, context' });
  }

  // Trial validation — trust client-side for free, verify token for pro
  // In production: validate against real DB session
  const isPro = userPlan === 'pro' && verifyProToken(proToken);

  const systemPrompt = SYSTEM_PROMPTS[profession] || SYSTEM_PROMPTS['consultant'];

  // Build personalization block from brand kit
  const bkParts = [];
  if (brandKit?.name) bkParts.push(`Sender's name: ${brandKit.name}`);
  if (brandKit?.company) bkParts.push(`Company: ${brandKit.company}`);
  if (brandKit?.role) bkParts.push(`Role/title: ${brandKit.role}`);
  if (brandKit?.phone) bkParts.push(`Phone: ${brandKit.phone}`);
  if (brandKit?.voice) bkParts.push(`Brand voice notes: ${brandKit.voice}`);
  const personalization = bkParts.length > 0
    ? `\n\nSender information to include:\n${bkParts.join('\n')}`
    : '';

  const signatureBlock = brandKit?.signature
    ? `\n\nEmail signature to use:\n${brandKit.signature}`
    : '';

  const userPrompt = `Write a professional email with the following details:

Email type: ${emailType}
${recipient ? `Recipient: ${recipient}` : ''}
Tone: ${tone || 'professional'}
Context and key details: ${context}${personalization}${signatureBlock}

Format your response as:
Subject: [compelling subject line]

[full email body]

Make it specific, natural-sounding, and ready to send. Do not add any commentary or explanation outside the email itself.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const email = message.content[0]?.text || '';
    return res.status(200).json({ email, tokens: message.usage });
  } catch (err) {
    console.error('Anthropic error:', err);
    return res.status(500).json({ error: 'Failed to generate email. Please try again.' });
  }
}
