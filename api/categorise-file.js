/**
 * Tax Tjommie v5 — categorise PDF/image uploads with Claude's native support.
 *
 * POST /api/categorise-file
 *   body: { fileType: "pdf" | "image", base64: "...", filename?: "...", context?: { userType, occupation } }
 *   returns: { results: [{date, description, amount, category, confidence, needsReview}] }
 *
 * Uses Sonnet 4.6's native PDF and vision capabilities. Same zero-retention promise.
 *
 * Privacy note:
 *   Bank PDFs often contain account numbers in the header. We rely on:
 *   (a) the zero-retention header for Anthropic,
 *   (b) the model being instructed to return transaction data only (no account numbers),
 *   (c) post-processing sanitisation on every returned row.
 *   The raw base64 never touches disk server-side.
 */
import {
  callAnthropic, parseJsonPayload, rateLimit, clientIp,
  setCors, sanitiseDescription, contextBlurb,
} from './_anthropic.js';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const SYSTEM_PROMPT_BASE = `You are a South African tax assistant extracting transactions from a bank statement (PDF) or transaction image.

Task:
1. Read every line-item transaction from the document.
2. For each transaction, extract: date (YYYY-MM-DD), description (merchant or narration, short), amount (negative for spend, positive for income).
3. Categorise each transaction using the South African category list below.
4. Return JSON array only — no preamble, no markdown fences.

DO NOT include:
- Account numbers, card numbers, running balances, reference codes
- Header information (bank name, account holder, address)
- Internal transfers between the user's own accounts → category "ignore"
- ATM withdrawals → category "ignore"
- Credit card repayments on a bank statement → category "ignore"

Category keys (choose exactly one per transaction):

WORK/BUSINESS:
home_office, vehicle_travel, phone_internet, equipment, software, professional_services,
marketing, office_supplies, client_entertainment, training, subcontractors, bank_charges, other_business

PERSONAL:
housing, groceries, eating_out, transport_personal, medical, insurance_personal, clothing,
entertainment, subscriptions_personal, personal_care, education_personal, gifts, debt_repayment, other_personal

SPECIAL:
ignore (transfers, ATM, CC repayments, non-spending events)

Each row must look like:
{"date":"2026-03-14","description":"WOOLWORTHS CAPE TOWN","amount":-847.50,"category":"groceries","confidence":0.97,"needsReview":false}

Rules:
- confidence 0.0–1.0
- needsReview: true if confidence < 0.7, or amount > 5000, or merchant is ambiguous between work and personal
- For SA merchants use local context (Woolworths → groceries, Takealot amount-dependent, Orms/Cameraland → equipment for photographers, Cashbuild/Builders → equipment for tradespeople)

Return only the JSON array.`;

export default async function handler(req, res) {
  setCors(res, req.headers.origin);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const ip = clientIp(req);
  if (!rateLimit(ip)) { res.status(429).json({ error: 'rate_limited' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'api_key_missing' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }

  const { fileType, base64, filename, context } = body || {};
  if (!fileType || !base64) { res.status(400).json({ error: 'missing_file' }); return; }
  if (!['pdf', 'image'].includes(fileType)) { res.status(400).json({ error: 'bad_file_type' }); return; }

  // Rough size check — base64 is ~1.37× raw bytes.
  const approxBytes = Math.floor(base64.length * 0.75);
  if (approxBytes > MAX_BYTES) { res.status(413).json({ error: 'file_too_large', maxBytes: MAX_BYTES }); return; }

  const systemText = SYSTEM_PROMPT_BASE + contextBlurb(context || {});

  // Build the content block — Claude supports documents and images directly.
  let contentBlock;
  if (fileType === 'pdf') {
    contentBlock = {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    };
  } else {
    // Image. Detect common types from base64 magic bytes fallback to png.
    const mediaType = detectImageType(base64);
    contentBlock = {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    };
  }

  try {
    const anthropicRes = await callAnthropic({
      apiKey,
      system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: `Extract and categorise every transaction from this ${fileType}. Return a JSON array only.` },
        ],
      }],
      maxTokens: 8192,
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => '');
      res.status(502).json({
        error: 'upstream_error',
        status: anthropicRes.status,
        message: 'Could not process that file. Try a CSV export instead.',
        hint: filename ? `File: ${filename}` : undefined,
        upstream: errText.slice(0, 200),
      });
      return;
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const results = parseJsonPayload(text, { asArray: true });
    if (!results || !Array.isArray(results)) { res.status(502).json({ error: 'parse_failed' }); return; }

    // Re-sanitise every description from the AI response (belt-and-braces)
    const cleaned = results.filter(r => r && r.description && typeof r.amount === 'number').map(r => ({
      date: String(r.date || '').slice(0, 10),
      description: sanitiseDescription(r.description),
      amount: r.amount,
      category: r.category || 'uncategorised',
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.7,
      needsReview: Boolean(r.needsReview) || (typeof r.confidence === 'number' && r.confidence < 0.7),
    }));

    res.status(200).json({
      results: cleaned,
      count: cleaned.length,
      usage: data.usage || null,
    });
  } catch (err) {
    res.status(502).json({ error: 'proxy_failed', message: err.message });
  }
}

function detectImageType(base64) {
  const head = (base64 || '').slice(0, 30);
  if (head.startsWith('/9j/')) return 'image/jpeg';
  if (head.startsWith('iVBOR')) return 'image/png';
  if (head.startsWith('R0lGOD')) return 'image/gif';
  if (head.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}
