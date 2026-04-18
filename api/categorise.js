/**
 * Tax Tjommie v4 — Anthropic categorisation proxy
 *
 * POST /api/categorise
 *   body: { transactions: [{ date, description, amount }, ...] }
 *   returns: { results: [{ date, description, amount, category, confidence, needsReview }] }
 *
 * Holds ANTHROPIC_API_KEY server-side, applies prompt caching to the
 * system prompt, and enforces a simple per-IP rate limit.
 */

const MODEL = 'claude-sonnet-4-6';
const MAX_BATCH = 120;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;

const SYSTEM_PROMPT = `You are a South African tax and budgeting assistant. Your job is to categorise bank statement transactions into the correct category for a South African taxpayer.

Categories — WORK/BUSINESS (deductible for sole props and businesses):
- home_office (rent, bond interest, electricity, water, internet portion, security, home insurance)
- vehicle_travel (fuel, parking, tolls, Uber, car maintenance when work-related)
- phone_internet (cellular, data, fibre)
- equipment (laptops, cameras, tools, office furniture)
- software (Adobe, hosting, apps, subscriptions used for work)
- professional_services (accountant, legal, insurance premiums for business)
- marketing (ads, branding, website costs)
- office_supplies (stationery, printing)
- client_entertainment (meals, coffee with clients — SARS requires purpose + attendee)
- training (courses, books, conferences, professional body fees)
- subcontractors (other freelancers hired)
- bank_charges (business account fees)
- other_business

Categories — PERSONAL:
- housing (rent, bond — personal)
- groceries
- eating_out
- transport_personal
- medical
- insurance_personal
- clothing
- entertainment
- subscriptions_personal (Netflix, Spotify, DStv)
- personal_care
- education_personal
- gifts
- debt_repayment
- other_personal

Rules:
- Every transaction gets ONE category key from the lists above
- Return a confidence score 0.0–1.0 per transaction
- Flag for review (needsReview: true) when: confidence < 0.7 OR amount > 5000 OR merchant is ambiguous
- For South African merchants, use local context: "Woolworths" = groceries (not entertainment), "Takealot" depends on amount (small = personal, large = equipment)
- If a merchant could be business or personal (e.g. Uber, Pick n Pay Checkers), default to personal and flag for review
- Internal transfers, debit orders for identifiable personal accounts, and ATM withdrawals should be categorised as "ignore"

Output format: JSON array only. No preamble, no commentary. Each item must match the input order and look like:
{"date":"...","description":"...","amount":-123.45,"category":"groceries","confidence":0.97,"needsReview":false}

Return only the JSON array. No prose, no markdown fences.`;

// In-memory rate-limit bucket (resets on cold start — good enough for per-IP throttling)
const buckets = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = buckets.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW_MS; }
  entry.count += 1;
  buckets.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// Strip anything outside the allow-list before sending to the model.
// Client-side already sanitises, but we enforce again server-side as a belt-and-braces privacy contract.
function sanitise(row) {
  const description = String(row.description || '')
    .replace(/\b\d{10,}\b/g, '[REF]')
    .replace(/\b[A-Z0-9]{12,}\b/gi, '[REF]')
    .slice(0, 120);
  return {
    date: row.date ? String(row.date).slice(0, 10) : '',
    description,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0,
  };
}

function setCors(res, origin) {
  // Restrict to the Vercel-hosted domain + localhost for dev
  const allowed = [
    'https://tax-tjommie-app.vercel.app',
    'https://tax-tjommie-v3.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  if (origin && allowed.some(a => origin.startsWith(a))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Wait a minute.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'api_key_missing', message: 'Server is not configured yet.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }

  const transactions = Array.isArray(body?.transactions) ? body.transactions : null;
  if (!transactions || !transactions.length) {
    res.status(400).json({ error: 'no_transactions' });
    return;
  }
  if (transactions.length > MAX_BATCH) {
    res.status(400).json({ error: 'batch_too_large', max: MAX_BATCH });
    return;
  }

  const sanitised = transactions.map(sanitise).filter(t => t.description);
  if (!sanitised.length) {
    res.status(400).json({ error: 'no_valid_rows' });
    return;
  }

  const userMessage = `Categorise these ${sanitised.length} transactions. Return a JSON array only.

${JSON.stringify(sanitised)}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      // Never propagate raw upstream errors (they may include request metadata)
      res.status(502).json({
        error: 'upstream_error',
        status: anthropicRes.status,
        message: 'AI categorisation is unavailable. The client will fall back to local rules.',
      });
      return;
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const results = parseJsonArray(text);
    if (!results) {
      res.status(502).json({ error: 'parse_failed', message: 'AI returned malformed output.' });
      return;
    }

    // Fill in any missing rows with uncategorised so client always gets 1:1 mapping
    const byKey = new Map(results.map(r => [
      `${r.date || ''}|${(r.description || '').toLowerCase()}|${Math.round((r.amount || 0) * 100)}`,
      r,
    ]));
    const aligned = sanitised.map(s => {
      const key = `${s.date || ''}|${(s.description || '').toLowerCase()}|${Math.round((s.amount || 0) * 100)}`;
      const match = byKey.get(key);
      if (match) return {
        ...s,
        category: match.category || 'uncategorised',
        confidence: typeof match.confidence === 'number' ? match.confidence : 0.7,
        needsReview: Boolean(match.needsReview) || (typeof match.confidence === 'number' && match.confidence < 0.7),
      };
      return { ...s, category: 'uncategorised', confidence: 0.3, needsReview: true };
    });

    res.status(200).json({
      results: aligned,
      usage: data.usage || null,
      cached: data.usage?.cache_read_input_tokens > 0,
    });
  } catch (err) {
    res.status(502).json({ error: 'proxy_failed', message: err.message });
  }
}

function parseJsonArray(text) {
  if (!text) return null;
  // Sonnet usually returns clean JSON; handle the occasional fence or prose wrapper
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  // Try first/last bracket slice as a fallback
  const first = cleaned.indexOf('[');
  const last = cleaned.lastIndexOf(']');
  if (first === -1 || last === -1) return null;
  cleaned = cleaned.slice(first, last + 1);
  try { return JSON.parse(cleaned); } catch { return null; }
}
