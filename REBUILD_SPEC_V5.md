# TAX TJOMMIE v5 — REBUILD SPEC

> **This document supersedes `REBUILD_SPEC.md` (v4).** That spec and the earlier `COMPLETE_BUILD.md` are historical reference only. Build from this document.
>
> **Companion documents — all required reading before coding:**
> - `DESIGN_SYSTEM.md` — visual tokens (unchanged from v4, still applies)
> - `PRESERVATION_LIST.md` — content and features that must survive (unchanged from v4, still applies)
> - `AI_AND_PRIVACY.md` — the AI pipeline, privacy contract, cloud backup (NEW)
> - `01-review-screen.png` — locked visual target at project root (unchanged)

---

## 0 — Why v5

v4 shipped and was better than v3 but hit four fundamental issues on real-user walkthrough:

1. **Single-file upload.** The app asks for "one to three months of statements" but the file input has `multiple={false}`. Users can only upload one file at a time, which means the AI sees a tiny slice of a user's money.
2. **Blank-field questions the AI should have answered.** v4 asks "what's your monthly phone cost?" — yet the AI just processed a bank statement showing a R899 Cell C debit every month. The AI should infer, then confirm.
3. **No user-type configuration.** v4 treats a salaried employee, a freelancer, a sole prop, and a small business owner identically. Their tax situations, deductions, compliance needs, and budget concerns are all different.
4. **No occupation question.** Without occupation context, the AI can't suggest trade-specific deductions (photographer's equipment, plumber's tools, doctor's HPCSA fees, etc.). A huge value unlock is invisible.

Plus two product-philosophy insights from user testing:

5. **One-shot onboarding makes the app disposable.** If the user uploads statements once and done, they never open it again until next tax year. The real product is **continuous capture** — daily slips, weekly uploads, credit card imports — building an ever-richer picture over time. The app's daily loop is the product.

6. **Line-item OCR is where AI earns its keep.** A R1,200 grocery slip categorised as "groceries" is nearly useless. The same slip broken out into R340 meat / R180 cleaning / R95 coffee / R120 toiletries is a real insight. Extend to client lunches with the full compliance trail: who, why, receipt image stored.

## 1 — The thesis (unchanged, sharpened)

Tax Tjommie is **"one app to run your money — tax, budget, savings — for individuals, sole props, and small businesses, with AI that does the heavy lifting every day, not just at tax time."**

The emotional target remains **"a gift being unwrapped"**: the app does the work; the user reviews and confirms. But now extended: **"a gift that keeps giving"** — every slip scanned, every statement dropped, the AI gets smarter about the user's money, categorises faster, flags more, saves more.

## 2 — Audience (sharpened)

Five user types, one app, user chooses on first setup:

| Type | Tax concerns | Budget concerns | Key features they need |
|---|---|---|---|
| **Salaried employee** | Annual refund, medical credits, RA, donations | Monthly paycheck budgeting, savings goals | Simple flow, refund tracker, deduction maximiser |
| **Salaried + side income** | Provisional tax, mixed deductions | Income volatility, tax set-aside | Everything above + provisional + side-income tracking |
| **Freelancer / sole prop** | Provisional, home office, vehicle, business expenses | Variable income, cash flow, tax provisioning | Business/personal separation, full deduction profile, Practitioner PDF |
| **Small business (Pty Ltd)** | Company tax, VAT (if registered), payroll, dividends | Business cash flow, operating expenses | Multi-account support, VAT-aware categorisation, simple P&L |
| **Retired / pensioner** | Secondary rebate, interest exemption, tax-free investments | Fixed income budgeting | Simplified flow, different rebate structure |

Primary demo audience remains **The Tax Shop franchise** — their client base spans all five types, so one-size-fits-all breaks the pitch.

**Not building for this release but scaffold the data model:** multi-user business accounts, VAT, payroll.

## 3 — Tech stack

Unchanged from v4:
- Single-file HTML app with React 18 via Babel standalone
- localStorage as primary storage (+ cloud backup — see `AI_AND_PRIVACY.md`)
- Vercel serverless functions for AI proxy
- Hosted on Vercel, auto-deploy from `infinitlyal-dev/tax-tjommie-v3`
- Mobile-first 390×844
- PWA with valid manifest + service worker

Claude Sonnet 4.6 remains the AI model. `claude-sonnet-4-6`. Zero-retention header set on every call (see `AI_AND_PRIVACY.md` §3).

## 4 — New onboarding flow

10 screens now, up from v4's 8. The added screens capture the user-type and occupation context the AI needs to work properly.

### Screen 1 — Splash (UNCHANGED)

Same as v4. "Let's go" button.

### Screen 2 — User type selection (NEW)

Replaces v4's "Quick Intro" screen. Two-line header: *"Tell us about you."* / *"We'll tailor the app to your tax situation."*

5 pill-cards, large touch targets, icons:
- 💼 **Salaried employee** — "I get a payslip every month"
- 🔄 **Salaried + side income** — "Main salary, plus freelance work"
- ⚡ **Freelancer / sole prop** — "I work for myself"
- 🏢 **Small business** — "I own a company with employees"
- 🌴 **Retired / pensioner** — "I receive a pension"

Each pill is tappable as single-select. Saves `user.userType`. Single button: **Continue**.

### Screen 3 — Basic details (MODIFIED)

- "What should we call you?" → `user.name` (required)
- "What do you do?" → `user.occupation` (text input with autocomplete hints based on common SA occupations). This is NEW — v4 missed it.
- "What tax year are you working on?" → pills `2025/26 (current)` / `2024/25`

**Removed:** the "Roughly what do you earn per month, before tax?" field. Income is now either (a) inferred from statement deposits after upload, or (b) asked as a range later if the user skips upload.

Button: **Continue**

### Screen 4 — Occupation follow-up (NEW, CONDITIONAL)

If `user.occupation` matches a known career profile (via keyword matching — see v3 career profile logic in `PRESERVATION_LIST.md`), show a friendly acknowledgement + preview of deductions we'll look for:

Example for a photographer:
> *"Nice — a photographer. Common deductions I'll look for as we go:*
> *· Camera equipment, lenses, lighting*
> *· Editing software (Photoshop, Lightroom)*
> *· Memory cards, hard drives, cloud storage*
> *· Website hosting, portfolio platforms*
> *· Props, model releases"*

Button: **Got it, continue**

If occupation doesn't match a known profile, skip this screen entirely. Do not show a generic placeholder — skip is better than bland.

Career profiles to preserve from v3 (may extend):
- **Creative** — photographer, designer, videographer, artist, writer, musician
- **Teacher** — teacher, tutor, lecturer, trainer, educator
- **Medical** — doctor, dentist, nurse, therapist, psychologist, pharmacist
- **Sales** — sales, agent, broker, commission, rep
- **IT** — developer, programmer, engineer, DevOps, data, tech
- **Legal/Finance** — lawyer, attorney, accountant, auditor, financial advisor
- **Trades** — electrician, plumber, mechanic, technician, builder, carpenter
- **Property** — landlord, property investor, real estate (NEW)
- **Consulting** — consultant, strategist, coach (NEW)
- **General** — fallback

### Screen 5 — Upload hero (MODIFIED)

**Core fix:** multi-file upload. `<input type="file" multiple accept="...">`. Can select 3-10 files in one dialog, or drag-drop multiple.

Copy (refined from v4):
> **"Let's get you sorted."**
>
> *Drop in everything you've got: the last 2-3 months of bank statements, credit card statements, even receipt photos. The more I see, the better I understand your money.*

Drop zone accepts CSV, PDF, PNG, JPG, JPEG, WebP, HEIC. Multiple files at once.

Below the dropzone, **selected files list** appears as user adds them:
```
✓ FNB Cheque - March 2026.pdf  (452 KB)    [×]
✓ FNB Cheque - February 2026.pdf  (438 KB) [×]
✓ Nedbank Credit Card - March.csv  (12 KB) [×]

   + Add more files
   
   [Process 3 files]
```

User can remove files before processing. Button text updates to reflect count.

"Don't have statements ready? Skip for now" link still present.

Privacy reassurance below: *"🔒 Your account numbers never leave your device. We sanitise every file before our AI reads it. [Learn more]"* — link opens privacy modal (see `AI_AND_PRIVACY.md` §2).

### Screen 6 — Processing (MODIFIED)

Same design as v4 but now shows:
- Filename of current file being processed ("Reading FNB Cheque - March 2026.pdf...")
- "12 of 203 transactions categorised across 3 files"
- Deduplication detection visible: "Matched credit card payment to statement transfer — won't count twice"

Minimum 4s display per file. If processing is fast, pad with animation.

### Screen 7 — Review (MODIFIED)

Visual target unchanged (`01-review-screen.png`), but data comes from the merged + deduplicated transaction pool across all uploaded files.

New elements:
- **File tabs** near the top: "All (203)" · "Cheque (142)" · "Credit card (61)" — filter view by source file/account
- **Two hero stats**, side by side on the hero card:
  - Left: "R47,230" / "Tax deductions found"
  - Right: "R38,500" / "Avg monthly spend"
- Transaction count updates to reflect the full merged pool
- Account indicator on each row (small pill: `●CHEQUE` or `●CC` in muted style) so user knows which file a transaction came from

Existing functionality preserved:
- Confirm all / Review N flagged actions
- Amber "Needs review" state
- Tap row → edit category in bottom sheet

### Screen 8 — Smart deduction prompts (MODIFIED — much smarter)

v4's approach: show deduction prompts based on *what AI found*. v5 goes further: **the AI pre-fills inputs from statement data before asking.**

Logic:
- AI saw rent/bond debits + electricity + internet → prompt **"I see you might work from home. Is this right?"** If yes → **Home Office setup flow with pre-filled amounts** (rent R15,000, electricity R1,800, internet R1,200 — all pulled from statements, user just confirms or edits). Still shows CGT warning for homeowners.
- AI saw regular fuel/petrol purchases → **"I see you spend about R4,200/month on fuel. Do you use your car for work?"** If yes → Vehicle setup with pre-filled amount.
- AI saw Cell C / MTN / Vodacom debit → **"I see you pay Cell C R899/month. Is this partly for work?"** If yes → Phone setup with work-percentage slider.
- AI saw Adobe / Microsoft 365 / Dropbox / hosting → Software deductions pre-filled.
- AI saw medical aid debit → **"I see a Discovery Health debit. Let me know your member details."**
- AI saw RA contribution → Pre-fill retirement setup.
- AI saw indemnity insurance → **"I see a professional indemnity payment — for work?"**

After AI-inferred prompts, show occupation-specific prompts:
- For the photographer: "Did you buy any camera equipment or software in this period?"
- For the plumber: "Did you buy any tools or PPE?"
- Etc.

Finally: **"Set up more deductions →"** link to full 11-category deductions manager.

This is where the "AI is doing the work" feeling lands hardest. User barely types anything — mostly taps Yes.

### Screen 9 — Budget confirmation (UNCHANGED)

"Based on what you actually spent, here's your monthly budget. Adjust anything that looks off."

Categories pre-populated from merged transaction analysis. Inline-editable amounts. "Keep these as my budget" button.

### Screen 10 — Backpocket suggestions (UNCHANGED)

Auto-suggested goals (provisional tax set-aside, emergency fund), plus option to add custom. "Finish setup" → Dashboard.

## 5 — Main app daily loop

**This is where v5 differs most from v4's one-shot framing.** The app's primary job after onboarding is to support **continuous capture** as the user's daily/weekly/monthly rhythm.

### 5.1 The four capture moments

Every day the user can do one or more of these, quickly:

1. **Scan a till slip** (cash or card purchase, proof for deductions)
2. **Photograph a detailed bill** (line-item grocery slip, client lunch bill — AI extracts line items)
3. **Upload a new statement** (weekly, fortnightly, monthly — any cadence)
4. **Snap a business receipt** (Uber, parking, office supplies — quick capture)

All four feed the same transaction pool. The AI handles categorisation identically regardless of source. User doesn't think about the plumbing.

### 5.2 The + button (redesigned)

Centre + button opens a bottom sheet:

```
┌─────────────────────────────────────┐
│                                     │
│  📷  Scan a slip                    │
│      Till slips, receipts, invoices │
│                                     │
│  📄  Upload documents               │
│      Bank statements, PDFs, CSVs    │
│                                     │
│  ✏️   Add manually                   │
│      For cash without a slip        │
│                                     │
└─────────────────────────────────────┘
```

All three options route through `/api/categorise.js` or its new siblings (see `AI_AND_PRIVACY.md` §5).

### 5.3 Line-item receipt OCR (NEW, critical value feature)

When user scans/uploads a receipt, the AI is prompted to:
1. Identify the merchant, total amount, date
2. **If the receipt shows itemisation** (most grocery slips, detailed restaurant bills): extract each line item with quantity, description, price
3. Suggest a primary category for the whole transaction
4. Suggest sub-categories for line items (within groceries: meat, dairy, produce, toiletries, etc.)

Review screen for a scanned grocery slip shows:
```
Pick n Pay, Claremont · 14 Mar 2026
Total: R 1,247.50

Line items (17):
  ✓ Meat & fish            R 340.20
  ✓ Dairy & eggs           R 185.50
  ✓ Produce                R 180.00
  ✓ Bakery                 R 95.00
  ✓ Toiletries             R 120.80
  ✓ Cleaning               R 95.00
  ✓ Other                  R 231.00

  [ Show individual items ]
```

User can edit any category. The sub-category breakdown feeds the **Budget tab's "Inside groceries" drill-down** — a new view showing monthly spend by line-item category within a parent category. This is where "where does my money actually go?" gets answered.

### 5.4 Client entertainment capture (EXTENDED)

When scanning a restaurant/bar/coffee receipt, the AI asks:
- "Was this a client meeting?" (if Yes → Client Entertainment category, else → Eating Out)
- If Client Entertainment: "Who did you meet?" (required — SARS compliance)
- "What was the business purpose?" (required)

Receipt image is stored alongside the transaction in localStorage as base64 (or IndexedDB if size is too large — see `AI_AND_PRIVACY.md` §4 on storage).

Compliance note generated automatically from responses. Practitioner PDF includes the image attachment references.

### 5.5 Ongoing statement imports

Bank statements uploaded after onboarding are merged into the existing transaction pool with automatic deduplication:

- Transactions with matching `{date, amount, merchant}` within ±2 days are flagged as potential duplicates
- User gets a single review card: "I found 3 transactions that look like they're already logged. Keep existing / Replace with new / Review each"
- Internal transfers (credit card payment on bank statement, matching credit to card account) are detected and marked as non-spending events — they don't double-count toward budget or deductions

## 6 — User-type-driven behaviour

The `user.userType` setting configures substantial app behaviour. Do not hide this behind a setting — it meaningfully changes the UI.

### 6.1 Salaried employee

- No provisional tax tab (they don't pay provisional)
- Tax tab focuses on annual refund estimate, medical credits, RA deduction, donations (s18A)
- Budget tab is primary daily loop
- Deduction manager shows relevant categories only (medical, RA, donations — hides business-only like client entertainment)
- Dashboard hero: "Your estimated refund: R X,XXX"
- Practitioner PDF is a simpler "submit to your accountant" format

### 6.2 Salaried + side income

- Shows Provisional tab (they become provisional taxpayers if side income > R30k/year — auto-detected from deposits)
- Both salary and side-income deductions available
- Budget tab differentiates salary vs side-income flows
- Dashboard shows tax from salary + tax owed on side income separately

### 6.3 Freelancer / sole prop

- Full Provisional tab with IRP6 deadlines
- All 11 deduction categories available
- Business/personal separation on every transaction
- Practitioner PDF is the full detailed version with compliance notes
- This is closest to the v3/v4 default

### 6.4 Small business (Pty Ltd)

- **Scaffolded only — no dedicated UI in v5.** Data model supports multiple accounts, VAT flags per transaction, payroll category — but the UI for these stays hidden behind a flag (`settings.enableSMEUI = false` by default).
- User who selects this type sees the same UI as Freelancer for now, plus a "Your business features are coming soon" note.
- Used to paint the roadmap in the Tax Shop pitch ("and for your SME clients, we scaffold here").

### 6.5 Retired / pensioner

- Secondary rebate and tertiary rebate (age 65+, 75+) applied automatically
- Interest exemption limit higher (R34,500 for 65+)
- Tax tab simplifies — no provisional unless rental income triggers it
- Budget is primary use case
- Medical out-of-pocket threshold different (full OOP deductible for 65+, not 25% of excess)

## 7 — Main app post-onboarding structure

### 7.1 Navigation (UNCHANGED from v4)

Bottom nav: **🏠 Home · 📊 Tax · ⊕ · 💰 Budget · 🎯 Backpocket**

Settings is a gear icon in the Home header (top-right).

### 7.2 Home dashboard

Composition adapts to user type. Sample for freelancer:

- Greeting + current tax year pill
- **Tax hero card** — "Tax deductions YTD: R47,230 · Saving ~R17,002 at 36%"
- **This month card** — "R23,450 / R28,000 budget" with progress, top 3 categories
- **Provisional tax card** — next payment, amount, days remaining
- **Backpocket card** — top goals with progress rings
- **Recent captures** — small horizontal scroll of last 5 things the user added (till slip, statement upload, manual) so the daily-loop activity feels alive

For salaried: Replace provisional card with "Estimated refund" card. Etc.

### 7.3 Tax tab

All v3/v4 content preserved (see `PRESERVATION_LIST.md`). Sub-tabs:
- Summary (deductions from profile, tax with/without, practitioner PDF)
- Calculator (bracket-by-bracket with what-if)
- Provisional (only visible if user type is freelancer, sole prop, or salaried+side)
- Deductions (11-category manager)

### 7.4 Budget tab

Primary view: list of categories with spend / budget / progress.

**New for v5:**
- Tap a category → drill-down showing sub-categories (when line-item data exists)
- "Inside Groceries" view: meat, produce, dairy, etc. with spend per sub-category
- "Unusual spending" flags: "Your coffee spend jumped 40% this month"
- Comparison toggle: This month / Last month / 3-month average / YTD

### 7.5 Backpocket tab

Unchanged from v4 design. Progress rings, goals, deposits, deposit history.

### 7.6 Settings

Sections:
- **Profile** — name, occupation, tax year, user type (changeable — reconfigures UI)
- **Tax profile** — deductions manager
- **Accounts** — uploaded bank accounts, reconnect/refresh
- **Capture preferences** — toggle line-item OCR, toggle AI categorisation fallback-to-manual
- **Cloud backup** — Google Drive / iCloud auth (see `AI_AND_PRIVACY.md` §6)
- **Privacy** — "Skip AI processing" toggle, data retention controls
- **Data** — export, import, storage used, reset
- **Reminders** — day + time for capture nudges
- **About** — version, Tax Shop branding slot, practitioner PDF, legal

## 8 — Explicit critical bug fixes from v4 walkthrough

Non-negotiable — verify each is fixed:

1. **Multi-file upload.** `<input type="file" multiple>` on upload dropzone. Drag-drop accepts multiple files. Selected-files list UI pre-processing.
2. **Upload screen copy consistency.** "Drop statements here" (plural) everywhere. No more singular/plural mismatch.
3. **Demo data volume.** Skip-for-now demo mode generates 150-200 realistic SA transactions across 3 months — Woolworths, Checkers, Engen, Cell C, Netflix, Discovery Health, rent, etc. — not 12.
4. **Income question removed.** Either inferred from statements or asked as a range later.
5. **Occupation question added** to onboarding.
6. **User type question added** as first substantive onboarding step.
7. **Tax-year-date mismatch bug.** When logging anything dated outside the active tax year, warn the user and offer to switch active year or route automatically. (Carried over from v3/v4.)
8. **Plural grammar.** "1 expense logged" not "1 expenses logged."

## 9 — What NOT to do (updated)

All v4 "do nots" carry forward. Additional for v5:

- **DO NOT** ship with `multiple={false}` on the file input. Non-negotiable fix.
- **DO NOT** ask the user for information the AI could have inferred from their statements. If a Cell C debit is in the data, don't ask what their phone costs — confirm what the AI found.
- **DO NOT** hide user-type behind a "preferences" setting. Ask up front, configure from there.
- **DO NOT** treat onboarding as the whole product. The daily capture loop is where retention lives.
- **DO NOT** drop receipt images after OCR — preserve them as base64/IndexedDB for the compliance trail.
- **DO NOT** double-count credit card repayments from bank statements. Detect transfers, flag as non-spending.
- **DO NOT** send transaction data to AI without the zero-retention header set (see `AI_AND_PRIVACY.md`).
- **DO NOT** ship without a privacy modal and "Learn more" link on the upload screen. Users need the specific promise, not the vague one.

## 10 — Migration from v4

On first v5 load, detect `tax_tjommie_v4` in localStorage and upgrade to `tax_tjommie_v5`:

- `user` → add `userType: 'freelancer'` as default (v4 users were implicitly this) unless we can infer otherwise
- `user` → add `occupation: ''` — prompt on next app open
- `transactions` → unchanged schema, add `sourceFile: null` and `receiptImage: null` defaults
- `taxProfile` → unchanged
- `budget` → unchanged, but new `subcategorySpend: {}` object per category for line-item data
- `accounts` → unchanged, but now populated properly from uploads

Keep `tax_tjommie_v3` and `tax_tjommie_v4` keys for 30 days minimum. One-time migration toast: "Welcome back, Al. We've kept everything from your last setup."

## 11 — Definition of done

A first-time user with these exact actions should reach a working, populated dashboard:

- [ ] Open app → Splash → Let's go
- [ ] Tap "Freelancer / sole prop"
- [ ] Type name "Al", occupation "Photographer", tax year 2025/26
- [ ] See photographer-specific deductions preview
- [ ] On upload screen, drag in 3 files (2 bank PDFs + 1 credit card CSV)
- [ ] Watch processing: ~200 transactions, deduplicated, Cell C / Shell / Woolworths recognised
- [ ] Review screen shows R47k+ in deductions, R38k/mo avg spend, file tabs to filter
- [ ] Confirm all
- [ ] See prompts: "I see Cell C — for work?" (pre-filled R899); "I see rent payments — home office?" (pre-filled); "I see camera equipment (Orms Direct) — deduct?" (occupation-aware)
- [ ] Budget confirmation with pre-populated categories
- [ ] Backpocket suggestions with provisional tax goal pre-calculated
- [ ] Finish → Dashboard populated

Second verification (daily loop):
- [ ] Tap + button
- [ ] Choose "Scan a slip"
- [ ] Upload a grocery receipt image
- [ ] See line-item breakdown (meat, dairy, etc.)
- [ ] Accept categorisation
- [ ] Transaction appears in today's view on Home, and in Budget → Groceries → sub-categories

Third verification (compliance):
- [ ] + button → Scan a slip → restaurant receipt
- [ ] AI asks "Client meeting?"
- [ ] User says yes, enters "John Smith, Acme Corp" + "Pitched Q2 retainer"
- [ ] Transaction saved as Client Entertainment with compliance note and receipt image
- [ ] Generate Practitioner PDF → includes the compliance note

Fourth verification (preservation):
- [ ] R600,000 annual income → R135,632 annual tax, 23% effective, 36% marginal (tax math preserved)
- [ ] Home Office setup shows CGT warning for homeowners
- [ ] Provisional tab has PSP check, penalty warnings, how-to-pay
- [ ] Tax Calculator has bracket-by-bracket + what-if
- [ ] All 11 deduction categories accessible
- [ ] All v3 and v4 data migrates intact

Fifth verification (privacy):
- [ ] Upload a statement → DevTools network tab shows no account numbers in the /api/categorise request payload
- [ ] "Skip AI processing" toggle in Settings works — falls back to keyword categorisation
- [ ] Privacy modal accessible from upload screen and Settings

Ship when all five verifications pass.
