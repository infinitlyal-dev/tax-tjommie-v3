# TAX TJOMMIE v4 — REBUILD SPEC

> **This document supersedes `COMPLETE_BUILD.md` and all `Phase_*.md` files.**
> Those earlier specs describe an older product. They are retained for historical reference only. **Build from this document.**
>
> **Companion documents, read them all before coding:**
> - `DESIGN_SYSTEM.md` — visual tokens, components, motion, what to avoid
> - `PRESERVATION_LIST.md` — content and features from the existing app that MUST NOT be lost
> - `01-review-screen.png` — locked visual target at project root. Every screen's look and feel derives from this mockup.

---

## 1 — The thesis

Tax Tjommie is **"one app to run your money — tax, budget, savings — for individuals, sole props, and small businesses."**

The core insight driving the rebuild: **people won't do data entry for their taxes.** Previous onboarding asked users to type rent, utilities, transport, medical, etc. Friends testing the app abandoned at >4 minutes. The new flow is **upload-first**: the user drops in a bank statement, AI sorts everything, and the rest of the app configures itself from what the AI found.

The product's emotional target is **"a gift being unwrapped."** The app does the work; the user reviews and confirms.

## 2 — Audience

Three user tiers, one app, progressive sophistication.

**Tier 1 — Individuals (salaried, pensioners, high-net-worth).** Upload statements, see deductions, track spend, save toward goals.

**Tier 2 — Sole proprietors / freelancers.** Everything above plus business/personal separation, deduction profile, practitioner-ready PDF export.

**Tier 3 — Small businesses.** Everything above plus multi-account support (business + personal), VAT-ready categorisation, simple P&L, payroll awareness. **Tier 3 is scaffolded in the data model but NOT built in this release.** Do not surface SME UI in this build.

Primary demo audience is **The Tax Shop franchise** (largest accounting franchise in Southern Africa, 100+ offices). The app is positioned for their franchisees to roll out to their clients.

## 3 — Tech stack

- **Single-file HTML app** with React 18 via Babel standalone (unchanged from v3)
- **localStorage** for all user data (unchanged from v3)
- **No user-visible backend** — user data never leaves the device
- **One exception:** AI categorisation calls route through a **Vercel serverless function** that proxies to the Anthropic API. Sanitised transaction rows only — no account numbers, no balances, no personal details.
- **Hosting:** Vercel, auto-deploy from `infinitlyal-dev/tax-tjommie-v3` GitHub repo (unchanged)
- **Mobile-first:** 390×844 viewport is the primary target
- **PWA:** valid manifest.json + service worker (BROKEN in v3 — fix this)

## 4 — AI pipeline

### 4.1 Model

**Claude Sonnet 4.6** — `claude-sonnet-4-6`.

Do NOT use Haiku. Do NOT use Opus. Sonnet 4.6 is the locked choice for categorisation accuracy vs cost balance. Expected cost per active user per month: R12–R15 with caching + batching.

### 4.2 Serverless proxy

Create `/api/categorise.js` as a Vercel serverless function.

Responsibilities:
1. Accept POST from client with sanitised transaction array
2. Hold the ANTHROPIC_API_KEY server-side (env var in Vercel)
3. Call Anthropic Messages API with Sonnet 4.6
4. Apply prompt caching to the system prompt (5-minute cache, covers category list and SA tax rules)
5. Return categorised results to client
6. Return structured errors on failure, never a 500 — the UI needs to degrade gracefully

Security rules:
- Never log user data
- Rate-limit per IP (e.g. 10 req/min)
- CORS restricted to the Vercel domain

### 4.3 Client-side sanitisation

Before sending to the proxy, strip:
- Account numbers, card numbers, any reference number longer than 10 digits
- Running balances
- Any field not on the allow-list: `{date, description, amount}`

This is a privacy promise. The user's bank account number never leaves their device. Enforce in code.

### 4.4 File format handling

**Accept:**
- CSV from any SA bank (FNB, Standard Bank, Absa, Nedbank, Capitec, Discovery, Investec, TymeBank)
- PDF statements from any SA bank
- Photos/images of receipts

**Do NOT write bank-specific parsers.** Claude reads the file directly.

For CSVs: parse locally with PapaParse to confirm structure, then let Sonnet identify which columns are date/description/amount regardless of column order or naming.

For PDFs: use Claude's native PDF support (send as document content). Slower and more expensive but handles any bank without custom parsing.

For images: use Claude's vision on the image.

### 4.5 System prompt (starting point — refine during build)

```
You are a South African tax and budgeting assistant. Your job is to categorise bank statement transactions into the correct category for a South African taxpayer.

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
- Every transaction gets ONE category
- Return a confidence score 0.0–1.0 per transaction
- Flag for review: confidence < 0.7, OR amount > R5,000, OR merchant name is ambiguous
- For South African merchants, use local context: "Woolworths" = groceries (not entertainment), "Takealot" depends on amount (small = personal, large = equipment)
- If a merchant could be business or personal (e.g. Uber, Pick n Pay Checkers), default to personal and flag for review
- Do NOT categorise internal transfers, debit orders for identifiable personal accounts, ATM withdrawals as anything — return category: "ignore"

Output format: JSON array only. No preamble, no commentary.
```

Claude Code will iterate on this prompt during build based on real statement testing.

## 5 — Data schema

Stored in `localStorage` under key `tax_tjommie_v4`. Migration path from v3 key `tax_tjommie_v3` required — detect v3 data on first load and upgrade it.

```javascript
{
  user: {
    name: "",
    email: "",                  // optional, for PDF export recipient
    taxYear: "2025/26",         // currently active
    userType: "individual",     // "individual" | "sole_prop" | "sme"
    monthlyGross: 0,
    onboardingComplete: false,
    version: "4.0"
  },

  taxProfile: {
    // (Same structure as v3 — see PRESERVATION_LIST.md for why)
    homeOffice: { enabled, percentage, officeSqm, totalSqm, monthlyRent,
                  monthlyElectricity, monthlyInternet, monthlyWater,
                  monthlySecurity, monthlyHomeInsurance },
    travel: { enabled, hasLogbook, workPercentage, monthlyFuel,
              monthlyInsurance, recentRepairs, method, vehicleValue,
              annualKm, businessKm },
    phone: { enabled, workPercentage, monthlyBill },
    equipment: { enabled, items: [] },
    professionalFees: { enabled, items: [] },
    marketing: { enabled, items: [] },
    retirement: { enabled, monthlyRA },
    medical: { enabled, members, dependents, hasOOP },
    donations: { enabled, annualAmount },
    badDebts: { enabled, annualAmount },
    businessLoanInterest: { enabled, annualAmount }
  },

  accounts: [                   // NEW in v4 — supports multi-account for future SME
    {
      id: "acc_xxx",
      label: "Main account",
      type: "personal",         // "personal" | "business"
      lastImport: null,
      transactionCount: 0
    }
  ],

  transactions: [               // REPLACES v3 expenses[] — union of AI-categorised + manual
    {
      id: "txn_xxx",
      accountId: "acc_xxx",
      date: "2026-03-14",
      description: "WOOLWORTHS CAPE TOWN",
      amount: -847.50,          // negative = spend, positive = income
      category: "groceries",
      source: "ai",             // "ai" | "manual" | "receipt_scan"
      confidence: 0.98,
      needsReview: false,
      userConfirmed: true,
      isDeductible: false,
      complianceNote: null,     // populated for client_entertainment
      taxYear: "2025/26",       // auto-derived from date using SA tax year boundaries
      receiptAttached: false,
      createdAt: "ISO timestamp"
    }
  ],

  budget: {
    categories: {
      // Derived from statement upload. User can override monthly budgets.
      // Example:
      groceries: { monthlyBudget: 8500, rollingAverage: 8234 },
      eating_out: { monthlyBudget: 2000, rollingAverage: 2456 },
      // ...
    },
    month: "2026-03"            // current month being tracked
  },

  backpocket: [
    {
      id: "bp_xxx",
      label: "Provisional tax — August",
      targetAmount: 67816,
      currentAmount: 0,
      targetDate: "2026-08-31",
      source: "tax_suggestion", // "tax_suggestion" | "user_created"
      deposits: [
        { date: "ISO", amount: 5000, note: "" }
      ]
    }
  ],

  provTaxPaid: {
    "2025/26": { firstPayment: 0, secondPayment: 0, voluntaryThirdPayment: 0 }
  },

  documents: [],                // base64 or blob references, receipts & statements

  settings: {
    activeTaxYear: "2025/26",
    reminderDay: "sunday",
    reminderTime: "19:00",
    isPremium: false,
    hasSeenOnboarding: false,
    lastExport: null,
    lastImport: null
  }
}
```

## 6 — Onboarding flow

Eight screens, ~2 minutes for the full journey (including a real statement upload).

### Screen 1 — Splash

- Tax Shop logo (placeholder IMG slot — swap-in-ready for franchise branding)
- Tagline: "Know your money. Sort your tax. All in one place."
- One button: **"Let's go"**
- No two-door choice. The app knows what it is.

### Screen 2 — Welcome + basic info (single form)

Three inputs, one screen:
- "What should we call you?" → `user.name`
- "Roughly what do you earn per month, before tax?" → `user.monthlyGross` (currency input, optional — user can skip)
- "Which tax year are you working on?" → pills: `2025/26 (current)` / `2024/25` → `user.taxYear`

Button: **"Continue"**

Do NOT ask for occupation, employment type, or anything else here. The AI will figure most of it out from the statements.

### Screen 3 — Upload hero

Full-screen moment. Copy:

> **"Let's get you sorted."**
>
> *Upload one to three months of your bank statements. I'll sort every transaction — find your tax deductions, show you where your money goes, flag anything you need to double-check. Takes about 30 seconds.*

- Drop zone (large, teal-accented, generous padding) — accepts CSV, PDF, multiple files
- Below the drop zone: **"Don't have a statement ready? Skip for now"** (small link, not a button)
- Under the dropzone, reassurance: *"🔒 Your account numbers never leave your device. We sanitise the file before AI reads it."*

### Screen 4 — Processing

User just dropped a file. Show them work happening.

- Tjommie's small avatar/illustration with a subtle animation
- Progress: "Reading your statements…" → "Sorting transactions…" → "Finding your deductions…"
- Live counter: "47 of 203 transactions categorised"
- Small list of just-processed items scrolling: "Woolworths Cape Town → Groceries" etc., auto-scrolling at a readable pace
- Do NOT show a generic spinner. This screen is part of the magic — the user watches work get done.

Minimum 4-second display even if processing is faster. Maximum 20 seconds — if real processing takes longer, keep the animation looping with gentler copy.

### Screen 5 — Review

**This is the hero screen.** The locked visual target is `01-review-screen.png`. Match it.

Elements (top to bottom):
- Back arrow · "Review" title · overflow menu
- Status pill with checkmark: "Categorised 203 of 203 transactions"
- **Hero card** — big teal number: total tax deductions found (e.g. R47,230). Subline: "Cheque statement · 1–14 Mar 2026"
- **Transactions list header:** "Transactions" with count "5 of 203" right-aligned, tappable to expand
- Transaction rows — date (small muted), merchant (primary), category with coloured dot (secondary), amount right-aligned. One row flagged amber "Needs review" with ⚠ icon.
- Tapping a row opens a bottom sheet for editing category
- Tapping "Needs review" jumps to just the flagged rows
- Primary button bottom: **"Confirm all"** (full-width, teal)
- Secondary text link beneath: **"Review 1 flagged"** (teal, no chrome)

On "Confirm all": all transactions become `userConfirmed: true`, proceed to Screen 6.

### Screen 6 — Deduction prompts (smart)

Based on what the AI found, offer 1–3 deduction profile setups. Do NOT show all 11 deduction categories as empty rows (v3 mistake).

Logic:
- AI found rent/bond + electricity + internet → prompt "Do you work from home?" → if yes, Home Office setup
- AI found fuel/tolls/parking → prompt "Do you use your vehicle for work?" → if yes, Vehicle setup
- AI found cell bill → prompt "Is your phone partially for work?" → if yes, Phone setup
- Always at end: "Anything else?" → "Set up more deductions" (links to full deductions manager)

Each prompt is a small card with Yes / No / Skip. "Yes" opens the same deduction setup flows that exist in v3 (preserve them — see `PRESERVATION_LIST.md`).

### Screen 7 — Budget confirmation

"Based on what you actually spent, here's your monthly budget. Adjust anything that looks off."

Show a list of categories with derived monthly spend:
- Groceries: R8,234/mo
- Eating out: R2,456/mo
- Transport: R3,100/mo
- …

Each row has an inline editable amount field. User taps a value, types a new one, moves on. Above the list: "Keep these as my budget" primary button.

This is the feature that makes budgeting painless — no blank canvas. The AI derived realistic numbers from reality.

### Screen 8 — Backpocket suggestions

Auto-suggest two goals with teal-accented cards:
1. **"Provisional tax set-aside"** — calculated from their monthly tax liability. Show the target, the monthly deposit needed, first deadline.
2. **"Emergency fund"** — default 3 months of monthly spend.

Each has a checkbox "Add this goal" and an amount field the user can adjust.

Plus: "+ Add your own goal" tappable row.

Button: **"Finish setup"** → sets `onboardingComplete: true` → Dashboard.

## 7 — Main app (post-onboarding)

### 7.1 Navigation

Bottom nav, left to right, 5 slots:

**🏠 Home · 📊 Tax · ⊕ · 💰 Budget · 🎯 Backpocket**

The centre ⊕ button opens a **bottom sheet** with three options:
1. **📷 Scan receipt** — opens device camera, captures image, sends to Claude for OCR + categorisation
2. **📄 Upload document** — file picker for CSV/PDF statement or receipt image
3. **✏️ Add manually** — form for typed transaction

Icons should be line-weight, single colour. No filled icons, no decorative glyphs.

Settings moves to a gear icon in the Home header (top-right), not in the nav.

### 7.2 Home (Dashboard)

Top-down:
- Greeting: "Good morning, Al" (time-aware, name from profile)
- Current tax year pill (active year, tappable to switch)
- Settings gear icon (top-right)

**Hero card:**
- "Tax deductions YTD"
- Large teal number (e.g. R47,230)
- Subline: "Saving you ~R17,002 in tax at your 36% rate"
- Small progress bar: tax year completion (e.g. 2/12 months done)

**This month card** (secondary):
- Spent: R23,450 / R28,000 budget
- Progress bar (teal if under, amber if 80%+, red if over)
- Top 3 categories spent

**Provisional tax card** (if sole prop / self-employed):
- Next payment: "1st Payment (IRP6) — 31 August 2025"
- Amount: R67,816
- Days remaining or OVERDUE state
- Tap to view the Tax Hub > Provisional tab

**Backpocket card:**
- Top 1–2 goals with progress rings
- "Add deposit" small action

Do NOT stack the dashboard with every feature on first load. If the user has no Backpocket goals, show a single "Set up your first goal" prompt instead of absence.

### 7.3 Tax tab

Three sub-tabs, inherited from v3 (preserve all content — see `PRESERVATION_LIST.md`):
1. **Summary** — deductions from profile, tax with/without, tax position, PDF export
2. **Calculator** — bracket-by-bracket breakdown with what-if slider (this is a crown jewel)
3. **Provisional** — schedule, payment markers, penalty warnings, PSP check, how-to-pay guide

Secondary tab: **Deductions manager** (from settings in v3, promoted here). 11 categories, each tappable to set up or edit. Same sub-flows as v3 (Home Office with CGT warning, etc.).

### 7.4 Budget tab

Top controls: month selector, category filter.

Main view: list of categories with:
- Category name + icon
- Spent / budgeted with progress bar (teal / amber / red)
- Tap to expand — shows transactions in that category for the selected month

Secondary view (tab toggle at top): **History** — 3-month rolling comparison, trend sparklines.

Category row actions:
- Tap → drill into transactions
- Long-press or ⋯ → edit monthly budget

### 7.5 Backpocket tab

List of goals, each a card:
- Label, target amount, current amount
- Progress ring (teal)
- Days to target date
- Tap → detail view with deposit history, edit, deposit button

Top of screen:
- Total saved across all goals (hero number)
- "+ New goal" button

### 7.6 Settings (via gear icon)

Sections:
- **Profile** — name, email, income, tax year, user type
- **Tax profile** — deductions manager (same as Tax tab's deductions)
- **Accounts** — list of bank accounts uploaded, re-upload/refresh actions
- **Data** — export (JSON), import (JSON), storage used, reset all
- **Reminders** — day + time
- **About** — version, Tax Shop branding, practitioner PDF generator link

## 8 — Feature preservation

Everything in `PRESERVATION_LIST.md` must survive the rebuild. Read it now if you haven't. Highlights:

- CGT warning on Home Office setup
- Personal Service Provider check on Provisional
- Bracket-by-bracket calculator with what-if slider
- Client entertainment compliance capture (who, purpose)
- Receipt warning copy
- Practitioner PDF export
- SARS 2025/26 tax brackets and rebates
- Multi-year tax support

## 9 — Feature flags OFF for this release

Build the structure, do not surface the UI:
- Standalone "Chat with Tjommie" tab (his voice lives in empty-state copy and moments, not in a chat interface)
- Multi-account / business account UI (data model supports it, no UI yet)
- VAT categorisation (data model supports it, no UI yet)
- Payroll (Tier 3 only)

## 10 — What NOT to do

Explicit preservation of lessons learned:

- **DO NOT** default to Claude's "editorial" design aesthetic. No Playfair, no Fraunces, no Georgia, no serif anywhere. No cream backgrounds. No italic word-accents. No terracotta. See `DESIGN_SYSTEM.md`.
- **DO NOT** use green as the primary accent. v3's green is retired. Teal #14B8A6 only.
- **DO NOT** ask the user to type in rent, utilities, groceries, etc. during onboarding. The AI derives these from statement upload.
- **DO NOT** show all 11 deduction categories as empty "Not set up" rows on first load. Surface the 1–3 that match what the AI found.
- **DO NOT** hide the value unlock in Settings. Deductions setup is part of onboarding, not a hidden menu item.
- **DO NOT** write bank-specific CSV parsers. Let Claude read any format.
- **DO NOT** send account numbers, balances, or reference numbers to the AI. Sanitise client-side.
- **DO NOT** use `$` anywhere — this is a ZAR-only app. Always "R" prefix.
- **DO NOT** forget tax-year date boundaries. SA tax year = 1 March → end Feb. Auto-route transactions to the correct year based on date. Warn the user when they log something outside the active year.
- **DO NOT** break the single-file HTML architecture unless absolutely necessary. Serverless function is a separate `/api/categorise.js` file, not bundled.
- **DO NOT** default to localStorage on every keystroke — batch writes.
- **DO NOT** forget the PWA manifest and service worker. v3 had them 404'ing. Fix.
- **DO NOT** ship a character-heavy Tjommie chatbot. Tjommie is present as a small illustration at 3 moments only: Upload intro, Processing screen, Review complete. He is a voice in copy, not a feature.

## 11 — Deployment

- Push to `infinitlyal-dev/tax-tjommie-v3` repo (keep existing, rename branch if cleaner)
- Vercel auto-deploy
- ANTHROPIC_API_KEY set as env var in Vercel dashboard
- Preview URL shared for demo

## 12 — Definition of done

Claude Code should consider the build complete when:

- [ ] A first-time user can go splash → upload statement → review → dashboard with populated data in under 2 minutes
- [ ] Statement upload works for at least one real SA bank CSV (test with FNB as baseline)
- [ ] All 8 onboarding screens match `DESIGN_SYSTEM.md` and derive from `01-review-screen.png`'s aesthetic
- [ ] All items in `PRESERVATION_LIST.md` are verified still present
- [ ] Tax calculations produce identical numbers to v3 for the same inputs
- [ ] The + button opens a quick-add sheet with camera/upload/manual options
- [ ] The PWA manifest loads without 404
- [ ] No green accents remain
- [ ] No serif fonts remain
- [ ] Data from v3 localStorage migrates on first v4 load, user keeps their stuff
- [ ] Practitioner PDF export still works
- [ ] Tax Shop logo placeholder present and swappable

Ship when checklist is complete. Do not stop early for approval — build through, test, report at the end with a changelog of what was built vs what this spec asked for.
