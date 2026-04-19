/**
 * Tax Tjommie v5 — line-item receipt OCR.
 *
 * POST /api/extract-receipt
 *   body: { base64: "...", context?: { userType, occupation } }
 *   returns: { merchant, date, total, suggestedCategory, lineItems: [...], isLikelyClientEntertainment, confidence }
 *
 * This is the "AI earns its keep" endpoint — turns a single receipt photo into
 * structured line items so the Budget tab can answer "where does my money go?"
 * at sub-category granularity.
 */
import {
  callAnthropic, parseJsonPayload, rateLimit, clientIp,
  setCors, sanitiseDescription, contextBlurb,
} from './_anthropic.js';

const MAX_BYTES = 10 * 1024 * 1024;

const SYSTEM_PROMPT_BASE = `You are a South African receipt extraction assistant. Given a photo of a till slip or receipt, return structured data.

Return a JSON OBJECT (not an array) with this shape:
{
  "merchant": "Pick n Pay, Claremont",
  "date": "2026-03-14",
  "total": 1247.50,
  "suggestedCategory": "groceries",
  "lineItems": [
    {"description": "Woolies chicken 1kg", "amount": 129.99, "subCategory": "meat", "quantity": 1}
  ],
  "isLikelyClientEntertainment": false,
  "confidence": 0.96
}

Rules:
- suggestedCategory uses the main SA category keys: groceries, eating_out, client_entertainment, vehicle_travel, equipment, software, office_supplies, medical, home_office, phone_internet, clothing, entertainment, personal_care, other_personal, other_business
- subCategory values — pick what fits the line item:
  * Inside groceries: meat, dairy, produce, bakery, pantry, frozen, toiletries, cleaning, household, beverages, snacks, other
  * Inside eating_out / client_entertainment: food, drinks, tip, other
  * Inside equipment: hardware, accessories, consumables, other
  * Inside medical: consultation, medication, tests, other
  * For unknown categories just use "other"
- isLikelyClientEntertainment: true ONLY if the receipt is from a restaurant/bar/cafe AND the context suggests work use (multiple covers, business hours, typical client-meeting spend). If unclear, false — user will confirm.
- Strip card numbers, account numbers, till numbers, cashier IDs from all text
- If you can't read the receipt, return {"error": "unreadable", "confidence": 0.0}

Output: JSON object only. No preamble, no markdown fences.`;

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

  const { base64, context } = body || {};
  if (!base64) { res.status(400).json({ error: 'missing_image' }); return; }
  const approxBytes = Math.floor(base64.length * 0.75);
  if (approxBytes > MAX_BYTES) { res.status(413).json({ error: 'image_too_large' }); return; }

  const systemText = SYSTEM_PROMPT_BASE + contextBlurb(context || {});

  const mediaType = detectImageType(base64);
  try {
    const anthropicRes = await callAnthropic({
      apiKey,
      system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Extract this receipt into the JSON object shape defined. Return JSON object only.' },
        ],
      }],
      maxTokens: 3072,
    });

    if (!anthropicRes.ok) {
      res.status(502).json({ error: 'upstream_error', status: anthropicRes.status });
      return;
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const parsed = parseJsonPayload(text, { asArray: false });
    if (!parsed) { res.status(502).json({ error: 'parse_failed', raw: text.slice(0, 300) }); return; }

    if (parsed.error === 'unreadable') {
      res.status(200).json({ error: 'unreadable', confidence: 0 });
      return;
    }

    // Sanitise description fields on every line item and the merchant
    const cleaned = {
      merchant: sanitiseDescription(parsed.merchant || 'Unknown merchant'),
      date: String(parsed.date || '').slice(0, 10),
      total: typeof parsed.total === 'number' ? parsed.total : parseFloat(parsed.total) || 0,
      suggestedCategory: parsed.suggestedCategory || 'other_personal',
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.filter(li => li && li.description).map(li => ({
            description: sanitiseDescription(li.description),
            amount: typeof li.amount === 'number' ? li.amount : parseFloat(li.amount) || 0,
            subCategory: li.subCategory || 'other',
            quantity: typeof li.quantity === 'number' ? li.quantity : 1,
          }))
        : [],
      isLikelyClientEntertainment: Boolean(parsed.isLikelyClientEntertainment),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };

    res.status(200).json({ ...cleaned, usage: data.usage || null });
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
