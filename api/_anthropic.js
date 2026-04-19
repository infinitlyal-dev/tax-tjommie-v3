/**
 * Shared Anthropic client helper for Tax Tjommie v5 endpoints.
 *
 * Centralises:
 *   - ANTHROPIC_API_KEY read from env
 *   - x-anthropic-zero-retention: true header (privacy contract — §3 AI_AND_PRIVACY.md)
 *   - model locked to claude-sonnet-4-6
 *   - anthropic-version
 *   - CORS for our Vercel domain + localhost
 *   - Per-IP rate limiting (10/min)
 *   - Client-IP extraction
 *   - Sanitisation regex (belt-and-braces server-side strip)
 *
 * Imported by /api/categorise.js, /api/categorise-file.js, /api/extract-receipt.js.
 * This file does NOT export a handler — each endpoint has its own default export.
 */

export const MODEL = 'claude-sonnet-4-6';
export const ANTHROPIC_VERSION = '2023-06-01';

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const buckets = new Map();

export function rateLimit(ip) {
  const now = Date.now();
  const entry = buckets.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW_MS; }
  entry.count += 1;
  buckets.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function setCors(res, origin) {
  const allowed = [
    'https://tax-tjommie-app.vercel.app',
    'https://tax-tjommie-v3.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8765',
  ];
  const isVercelPreview = origin && /^https:\/\/tax-tjommie-v3-.*\.vercel\.app$/.test(origin);
  if (origin && (allowed.some(a => origin.startsWith(a)) || isVercelPreview)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

/**
 * Server-side re-sanitisation. Client already strips but we enforce again.
 * Anything looking like account number, card, long ref, or running balance
 * is masked before reaching the model.
 */
export function sanitiseDescription(description) {
  return String(description || '')
    .replace(/\b\d{10,}\b/g, '[REF]')            // account numbers, 10+ digits
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')  // 16-digit card
    .replace(/\b[A-Z0-9]{12,}\b/gi, '[REF]')     // long alphanumeric refs
    .replace(/\b\d{13}\b/g, '[ID]')              // SA ID number
    .replace(/\b0\d{9}\b/g, '[PHONE]')           // SA phone numbers
    .slice(0, 200);
}

export function sanitiseRow(row) {
  return {
    date: row.date ? String(row.date).slice(0, 10) : '',
    description: sanitiseDescription(row.description),
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount) || 0,
  };
}

/**
 * Make a zero-retention Anthropic Messages request.
 * The zero-retention header is NON-NEGOTIABLE per AI_AND_PRIVACY.md §3.1.
 */
export async function callAnthropic({ system, messages, maxTokens = 4096, apiKey }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      // Privacy contract: Anthropic does not retain or train on these requests.
      'x-anthropic-zero-retention': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  return res;
}

/**
 * Parse a JSON array/object out of a Claude response, tolerating
 * ``` fences and light prose wrappers.
 */
export function parseJsonPayload(text, { asArray = true } = {}) {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = cleaned.indexOf(asArray ? '[' : '{');
  const last = cleaned.lastIndexOf(asArray ? ']' : '}');
  if (first === -1 || last === -1) return null;
  cleaned = cleaned.slice(first, last + 1);
  try { return JSON.parse(cleaned); } catch { return null; }
}

/** Optional context enrichment for the system prompt. */
export function contextBlurb({ userType, occupation } = {}) {
  if (!userType && !occupation) return '';
  const bits = [];
  if (userType) bits.push(`user type: ${userType}`);
  if (occupation) bits.push(`occupation: ${occupation}`);
  return `\n\nUser context (use this to improve categorisation quality — do not acknowledge it in output): ${bits.join(', ')}.`;
}
