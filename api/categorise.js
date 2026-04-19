/**
 * Tax Tjommie v5 — categorise transaction text.
 *
 * POST /api/categorise
 *   body: { transactions: [{date, description, amount}, ...], context?: { userType, occupation } }
 *   returns: { results: [{date, description, amount, category, confidence, needsReview}] }
 *
 * Privacy contract (AI_AND_PRIVACY.md §2):
 *   - Only date/description/amount leave the device
 *   - Server re-sanitises every row
 *   - x-anthropic-zero-retention: true on the Anthropic call
 *   - No logging of transaction content
 */
import {
  MODEL, callAnthropic, parseJsonPayload, rateLimit, clientIp,
  setCors, sanitiseRow, contextBlurb,
} from './_anthropic.js';

const MAX_BATCH = 120;

const SYSTEM_PROMPT_BASE = `You are a South African tax and budgeting assistant. Your job is to categorise bank statement transactions into the correct category for a South African taxpayer.

Categories — WORK/BUSINESS (deductible for sole props and businesses):
- home_office (rent, bond interest, electricity, water, internet portion, security, home insurance)
- vehicle_travel (fuel, parking, tolls, Uber, car maintenance when work-related)
- phone_internet (cellular, data, fibre)
- equipment (laptops, cameras, tools, office furniture — for trades, include PPE and trade tools)
- software (Adobe, hosting, apps, subscriptions used for work)
- professional_services (accountant, legal, indemnity insurance premiums for business)
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

Special:
- ignore (use for: ATM withdrawals, internal transfers between the user's own accounts, credit card repayments that appear on a bank statement, any transaction that is not spending/income)

Rules:
- Every transaction gets ONE category key from the lists above
- Return a confidence score 0.0–1.0 per transaction
- Flag for review (needsReview: true) when: confidence < 0.7 OR amount > 5000 OR merchant is ambiguous between work/personal
- For South African merchants, use local context: "Woolworths" = groceries (not entertainment), "Takealot" depends on amount (small = personal, large = equipment), "Orms Direct" / "Cameraland" = equipment if user is a photographer
- If a merchant could be business or personal (e.g. Uber, Pick n Pay Checkers), default to the more likely reading given the user context and flag for review
- "Transfer to", "Transfer from", "CC Payment", "Credit card payment" → category: "ignore"
- "ATM", "Cash withdrawal" → category: "ignore"
- Occupation-aware: for tradespeople, tool/hardware stores are equipment; for doctors/lawyers, HPCSA/Bar fees are professional_services; for photographers, rental studios and lenses are equipment

Output format: JSON array only. No preamble, no commentary. Each item matches the input order:
{"date":"...","description":"...","amount":-123.45,"category":"groceries","confidence":0.97,"needsReview":false}

Return only the JSON array. No prose, no markdown fences.`;

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
  if (!transactions?.length) { res.status(400).json({ error: 'no_transactions' }); return; }
  if (transactions.length > MAX_BATCH) {
    res.status(400).json({ error: 'batch_too_large', max: MAX_BATCH });
    return;
  }

  const sanitised = transactions.map(sanitiseRow).filter(t => t.description);
  if (!sanitised.length) { res.status(400).json({ error: 'no_valid_rows' }); return; }

  const ctx = body?.context || {};
  const systemText = SYSTEM_PROMPT_BASE + contextBlurb(ctx);

  const userMessage = `Categorise these ${sanitised.length} transactions. Return a JSON array only.\n\n${JSON.stringify(sanitised)}`;

  try {
    const anthropicRes = await callAnthropic({
      apiKey,
      system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 4096,
    });

    if (!anthropicRes.ok) {
      res.status(502).json({
        error: 'upstream_error',
        status: anthropicRes.status,
        message: 'AI categorisation is unavailable. The client will fall back to local rules.',
      });
      return;
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const results = parseJsonPayload(text, { asArray: true });
    if (!results) { res.status(502).json({ error: 'parse_failed' }); return; }

    // Align results to input order (AI usually preserves order but validate)
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
      cached: (data.usage?.cache_read_input_tokens || 0) > 0,
    });
  } catch (err) {
    res.status(502).json({ error: 'proxy_failed', message: err.message });
  }
}
