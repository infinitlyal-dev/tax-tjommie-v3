# TAX TJOMMIE v5 — AI & PRIVACY

> Read alongside `REBUILD_SPEC_V5.md`. This doc covers everything AI and privacy-related: what data leaves the device, what doesn't, how backup works, and the exact user-facing privacy contract.
>
> **Privacy matters here not just because users deserve it but because the demo audience (Tax Shop accountants) will ask hard questions. Their clients' data is sacred. A loose privacy story kills the franchise deal.**

---

## 1 — The privacy promise, in plain language

This is the user-facing statement — shown in the privacy modal and on the upload screen's "Learn more" link:

> **Your personal data stays on your device.**
>
> Your name, income, tax profile, compliance notes, receipt images, budget, and savings goals all live in your browser's local storage — never on our servers.
>
> **When our AI categorises transactions, only the transaction description, date, and amount are sent.** Account numbers, card numbers, reference codes, and running balances are stripped from every file before it leaves your device.
>
> **Our AI provider, Anthropic, does not retain or train on the data we send.** We use their zero-retention mode on every request.
>
> **You can turn AI off.** In Settings → Privacy, toggle "Skip AI processing." The app falls back to keyword-based categorisation — less accurate, fully offline.
>
> **You can back up to your own cloud.** In Settings → Cloud backup, connect your Google Drive or iCloud. Your encrypted data is stored in an app-only folder that you control. We never see it.

## 2 — What leaves the device, precisely

### 2.1 Sent to our server (Vercel serverless function at `/api/categorise`)

Only this payload shape:

```json
{
  "transactions": [
    { "date": "2026-03-14", "description": "WOOLWORTHS CAPE TOWN", "amount": -847.50 },
    { "date": "2026-03-13", "description": "SHELL SEA POINT", "amount": -650.00 }
  ],
  "context": {
    "userType": "freelancer",
    "occupation": "photographer"
  }
}
```

Note: `userType` and `occupation` are sent because they materially improve categorisation quality. They are **not** personally identifying.

### 2.2 Never sent (stripped client-side before network)

Strip in `sanitiseRow()` before the request is built:

- Account numbers (any digit sequence of length ≥ 10)
- Card numbers (13-19 digit sequences, Luhn-valid or not)
- Reference codes (alphanumeric of length ≥ 12)
- Running balances (any "balance" or "closing" field in parsed CSV)
- Phone numbers in transaction descriptions
- ID numbers (13-digit SA ID format)

Sanitisation is **both** client-side and server-side. Server-side re-runs the regex on the received payload. Belt and braces. If sanitisation finds anything suspicious server-side, reject the request with a 400 and log (metadata only, not content).

### 2.3 What the server does

The Vercel function:
1. Validates the payload shape
2. Re-sanitises every transaction description
3. Forwards to Anthropic Messages API with `claude-sonnet-4-6` and the zero-retention header
4. Returns categorised results to the client
5. Does not log transaction content ever
6. Logs only: timestamp, IP (for rate-limiting), request count, response time

### 2.4 Anthropic's side of the promise

Zero-retention mode is set per-request via HTTP header. Anthropic's commitment when this header is set: no caching, no training, immediate discard after response. This applies to all business-tier API customers using the flag.

Reference: https://docs.claude.com/en/api/privacy (include this URL in the privacy modal's "Technical details" section).

## 3 — Serverless function specification

### 3.1 Endpoint: `/api/categorise.js`

```javascript
// Vercel serverless function — runtime: Node.js 20
// Handles CSV-extracted transaction arrays
```

**Headers required on every Anthropic call:**
```
x-anthropic-zero-retention: true
anthropic-version: 2023-06-01
content-type: application/json
```

**Caching strategy:**
- System prompt (category definitions + SA tax context) is cached with `cache_control: { type: "ephemeral" }` at a 5-minute TTL
- Reduces costs by ~70% on repeat requests within 5 minutes

**Rate limiting:**
- 10 requests per IP per minute (existing in v4)
- Reject with 429 and a clear error message

**Graceful fallback:**
- On any API error (timeout, 5xx, network), the client falls back to keyword categorisation
- The user sees a toast: "AI is unavailable — using quick categorisation. Transactions can be reviewed and adjusted."
- The app keeps functioning — the demo never breaks silently

### 3.2 Endpoint: `/api/categorise-file.js` (NEW for v5)

For PDF and image uploads. Accepts base64 file content directly.

```javascript
{
  "fileType": "pdf" | "image",
  "base64": "...",
  "filename": "FNB-March-2026.pdf",
  "context": { "userType": "freelancer", "occupation": "photographer" }
}
```

Uses Claude's native PDF and vision capabilities. Same zero-retention header. Same rate-limiting.

Returns the same categorised transaction array shape as `/api/categorise`. Client doesn't care about file type after this point.

### 3.3 Endpoint: `/api/extract-receipt.js` (NEW for v5)

Specialised endpoint for receipt OCR with line-item extraction.

```javascript
{
  "base64": "...",
  "context": { "userType": "freelancer", "occupation": "photographer" }
}
```

System prompt instructs Claude to return:
```json
{
  "merchant": "Pick n Pay, Claremont",
  "date": "2026-03-14",
  "total": 1247.50,
  "suggestedCategory": "groceries",
  "lineItems": [
    { "description": "Woolies boneless skinless chicken breasts 1kg", "amount": 129.99, "subCategory": "meat" },
    { "description": "Fairfield milk 2L", "amount": 39.99, "subCategory": "dairy" }
  ],
  "isLikelyClientEntertainment": false,
  "confidence": 0.96
}
```

For restaurant receipts, `isLikelyClientEntertainment: true` triggers the who/why prompts in the UI.

### 3.4 Model and cost projections

Model: `claude-sonnet-4-6` on all three endpoints.

Expected monthly cost per active user (projections, verify against real usage after 30 days):

| Action | Frequency per user/month | Tokens per call | Cost (ZAR) |
|---|---|---|---|
| CSV categorisation | 1 (monthly statement) | ~8k in + 6k out | R 2.10 |
| PDF categorisation | 1 (monthly statement) | ~15k in + 6k out | R 2.80 |
| Receipt scan (line-item) | ~30 (daily capture) | ~1.5k in + 1.5k out | R 0.70 × 30 = R 21.00 |
| Till-slip scan (simple) | ~20 | ~1k in + 200 out | R 0.15 × 20 = R 3.00 |

**With prompt caching on system prompts:** input costs drop ~70% on repeat calls within 5-min cache window. Real-world cost closer to **R 15–20/user/month** for active daily users.

**Subscription pricing implication:** R40/month subscription gives ~50% gross margin after AI costs. Healthy. Franchise licensing to Tax Shop can be tiered above that for a better margin.

## 4 — Client-side storage and sensitive data

### 4.1 What lives in localStorage

Same as v4 schema with v5 extensions. Key: `tax_tjommie_v5`.

```javascript
{
  user: { name, email, userType, occupation, taxYear, onboardingComplete, version: "5.0" },
  taxProfile: { /* 11 deduction categories, unchanged */ },
  accounts: [ /* user's bank accounts */ ],
  transactions: [ /* merged pool, with receipt refs */ ],
  budget: { categories: {}, subcategorySpend: {}, month: "2026-03" },
  backpocket: [ /* goals */ ],
  provTaxPaid: { /* by tax year */ },
  documents: [],                        // MOVED to IndexedDB for size
  settings: {
    activeTaxYear, reminderDay, reminderTime,
    isPremium: false,
    skipAiProcessing: false,           // NEW: privacy toggle
    cloudBackupProvider: null,         // NEW: "google_drive" | "icloud" | null
    cloudBackupEnabled: false,
    lastBackup: null,
    hasSeenOnboarding: false
  }
}
```

### 4.2 Receipt images — IndexedDB, not localStorage

Receipt images as base64 can easily exceed localStorage's ~5MB limit per origin. Use IndexedDB.

- Database: `tax_tjommie_media`
- Object store: `receipts`
- Key: transaction ID
- Value: `{ base64, mimeType, uploadedAt, fileSize }`

When a transaction is deleted, delete the corresponding receipt. When storage is close to quota, warn the user and offer to archive oldest receipts.

### 4.3 Storage usage display

Settings → Data shows:
- localStorage used / quota
- IndexedDB used / quota
- "Backed up to [provider]" with last-backup timestamp
- Export, Import, Reset buttons

### 4.4 What never touches storage in the sanitised form

Never store original PDF statement files. After processing, store only the extracted, sanitised transaction array. If the user wants the original file, they keep it in their email / downloads folder. This is critical — storing raw statements means the sanitised-data-only promise breaks at rest.

## 5 — Cloud backup architecture

### 5.1 What we're building (v5 release)

**Option A from the planning discussion: user-owned cloud backup.** The user connects their Google Drive (first) or iCloud Drive (next). The app writes an encrypted JSON backup to a hidden app-only folder on their cloud storage.

Key principle: **the user owns their backup. We never touch it. If Tax Tjommie shut down tomorrow, they'd still have their data.**

### 5.2 Google Drive integration

Use the Google Drive "App Data" folder (`drive.appdata` scope). This folder:
- Is invisible to the user in their normal Drive UI
- Is accessible only by the app that created it
- Doesn't clutter their main Drive
- Survives if user switches phones / devices
- Can be wiped by the user via Google's app-connection settings

OAuth flow:
1. User taps "Connect Google Drive" in Settings
2. Standard Google OAuth consent screen
3. App gets access token + refresh token
4. Tokens stored in localStorage (encrypted with a user-device-specific key derived from... TBD, simplest secure option at build time)
5. App writes `tax_tjommie_backup.json` to app-data folder
6. Subsequent writes: on every significant data change, debounced to max 1 write per 30 seconds

### 5.3 iCloud Drive integration

For iOS users, iCloud Drive via PWA doesn't work as seamlessly as native apps. Fallback plan: direct the iOS user to export manually, or use iCloud Keychain for the auth token.

**For v5 ship, Google Drive is the required implementation. iCloud can be marked "coming soon" in the UI.**

### 5.4 Encryption

Backup JSON is encrypted client-side before upload:
- Algorithm: AES-GCM with a key derived from user's chosen backup passphrase
- First time user enables backup, prompt for passphrase: "Set a backup password. You'll need this to restore on another device. If you lose this, we cannot recover your data — not even Tax Shop can."
- Passphrase is stored in localStorage (encrypted with a device-specific key) for convenience on the current device
- On restore (new device), user re-enters passphrase

### 5.5 Restore flow

On fresh install or new device:
1. Onboarding splash → "Restore from backup" secondary option
2. Connect Google Drive
3. Find most recent `tax_tjommie_backup.json`
4. Enter passphrase
5. Decrypt → load into localStorage + IndexedDB
6. Land on Dashboard, fully restored

### 5.6 Franchise backup (for Tax Shop — scaffolded, not built in v5)

Future capability, but scaffold the data model now:
- Tax Shop franchise can optionally host backups for their clients (with consent)
- An accountant can view a client's transaction data (read-only) with client permission
- The accountant console is a separate web surface — not in this build

Mention this in the pitch as roadmap. Don't build it yet.

## 6 — The "Skip AI" toggle

In Settings → Privacy, toggle: **"Skip AI processing"**

When enabled:
- No transactions are sent to `/api/categorise`, `/api/categorise-file`, or `/api/extract-receipt`
- All categorisation uses local keyword matching (same fallback used when API fails)
- Receipt scanning is disabled (without AI, image is stored but no line-item extraction)
- Upload still works but categorisation is lower-quality
- User sees a persistent banner: "AI is off. Categorisation is reduced. [Re-enable]"

This toggle matters for:
- Privacy-first users (rare but real)
- Users on limited data plans
- Tax Shop demo mode (turn AI off to show fallback behaviour)

## 7 — The privacy UI surfaces

### 7.1 Upload screen link

Under the drop zone: *"🔒 Your account numbers never leave your device. We sanitise every file before our AI reads it. **[Learn more]**"*

Link opens a modal with the full privacy promise (§1 above).

### 7.2 Settings → Privacy section

Four toggles / actions:
- "Skip AI processing" toggle (default: off — AI is on)
- "Delete all data" button (red, confirmation required) — wipes localStorage, IndexedDB, and requests Google Drive backup deletion
- "Export my data" button — downloads full JSON backup
- "Privacy policy" link — opens full policy page

### 7.3 Privacy modal triggers

Modal appears on:
- First-time upload (before first file sent to AI) — required dismissal with "I understand" button
- Tap on "Learn more" link anywhere
- Settings → Privacy → "Privacy details"

### 7.4 Zero-retention proof

In the privacy modal, technical-minded users can see:
> **Proof we're not retaining:**
> - Open your browser's DevTools (F12)
> - Go to Network tab
> - Upload a statement
> - Inspect the request to `/api/categorise`
> - You'll see only date, description, amount — no account numbers
>
> **Anthropic's zero-retention commitment:** every API call we make includes the `x-anthropic-zero-retention: true` header. Read their policy at https://docs.claude.com/en/api/privacy.

This level of transparency is unusual. It's a trust move that matters for the accountant pitch.

## 8 — The Anthropic API key setup (for developer handoff)

**Claude Code developer needs to:**

1. Ensure the repo has `/api/categorise.js`, `/api/categorise-file.js`, `/api/extract-receipt.js` scaffolded
2. Every endpoint reads `process.env.ANTHROPIC_API_KEY`
3. Every call includes `x-anthropic-zero-retention: true` header
4. Every call uses model `claude-sonnet-4-6`
5. System prompts are cached with `cache_control: { type: "ephemeral" }`
6. Rate limiting (10/min per IP) on all three endpoints
7. CORS locked to `*.vercel.app` domains + localhost

**User (you) needs to:**

1. Go to `console.anthropic.com` → sign in with your existing Anthropic account
2. Settings → API Keys → Create Key
3. Name: `tax-tjommie-production`
4. Copy the key (you only see it once)
5. Add $20 initial credit via the Console's billing section
6. Go to Vercel dashboard → `tax-tjommie-v3` project → Settings → Environment Variables
7. Add `ANTHROPIC_API_KEY` with the copied value
8. Apply to Production, Preview, and Development environments
9. Trigger a redeploy (Vercel does this automatically, or commit any change)

**Verify the key is working:**

After deploy, open the live app, upload any CSV, watch the network tab. The request to `/api/categorise` should return a 200 with real categorised transactions (not the local-fallback keyword match). Compare categorisation quality before/after to confirm.

## 9 — What we tell Tax Shop in the pitch

The privacy architecture is a feature, not a footnote. Talking points:

1. **Client data never hits our database.** The app runs on the client's device. Our servers proxy AI calls only — we don't store your clients' transactions, ever.
2. **Clients own their backup.** Their data is encrypted and stored on their own Google Drive. If Tax Tjommie shuts down, their data survives. Continuity for your clients, not a lock-in risk.
3. **Zero-retention with Anthropic.** We use the zero-retention header — Anthropic doesn't cache or train on Tax Shop clients' data.
4. **Future franchise feature:** when Tax Shop licenses the franchise version, we can host an optional backup layer — clients can share their categorised data with their accountant with one tap. The accountant sees pre-organised, compliance-ready data instead of a pile of bank statements. Closes a Friday-afternoon of manual work into a Monday-morning 5-minute review.

That fourth point is the commercial story. Don't lead with it in the first meeting — establish trust with points 1-3 first.

## 10 — Pre-ship privacy checklist

Verify before deploying:

- [ ] `sanitiseRow()` strips account numbers, cards, refs, balances — test with real FNB/Standard/Absa/Nedbank/Capitec CSVs
- [ ] Server re-sanitises — test by sending a payload with an account number and confirming it's rejected or stripped
- [ ] `x-anthropic-zero-retention: true` header present on every Anthropic call
- [ ] Upload screen shows privacy link
- [ ] First-upload modal appears and blocks until dismissed
- [ ] Settings → Privacy section exists and toggles work
- [ ] "Skip AI" mode falls back to keyword matching and shows persistent banner
- [ ] Google Drive OAuth flow completes
- [ ] Backup writes encrypted JSON to app-data folder
- [ ] Restore flow on new device works end-to-end with passphrase
- [ ] "Delete all data" button wipes localStorage, IndexedDB, and deletes Drive backup
- [ ] DevTools Network tab shows clean sanitised payloads — no sensitive data visible
- [ ] Storage usage display in Settings shows accurate numbers

If any item is unchecked, the privacy promise is broken. Ship only when all are verified.
