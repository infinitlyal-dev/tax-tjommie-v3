# TAX TJOMMIE v3 — COMPLETE BUILD PLAN
## For Claude Code Execution — MVP by End of Day

---

## ARCHITECTURE

**Single HTML file.** React 18 via CDN. Babel standalone for JSX. localStorage for all data. No backend. No AI. No APIs (except Tesseract.js for OCR, loaded on-demand). Deploy to Vercel free tier.

**localStorage key:** `tax_tjommie_v3`

---

## THE FLOW (THIS IS THE APP)

The app guides the user through a logical journey:

```
1. WHO ARE YOU? → Name, DOB, occupation, tax year
2. WHAT DO YOU EARN? → Monthly gross income → shows tax bracket
3. WHAT CAN YOU DEDUCT? → Guided walkthrough of SARS deductions
4. YOUR TAX POSITION → Shows estimated tax, deductions, refund/owing
5. WHAT'S LEFT? → After tax, here's your take-home → budget from here
6. DAILY USE → Log expenses, track budget, save with Backpocket
```

This is NOT "set up then figure it out". The app TEACHES as it goes.

---

## PHASE 0: SKELETON (Build First)

**Goal:** App shell that renders, navigates, stores data.

### What to build:
- Single HTML file with React 18 + Babel CDN
- App component with state management (useState/useReducer)
- Router (simple hash-based: #welcome, #setup, #dashboard, etc.)
- localStorage read/write helper functions
- Bottom navigation bar (5 items): Home | Budget | + Log | Tax | More
- The "+" Log button is centre, prominent, different colour
- Basic mobile-first CSS (max-width: 480px centred, or full width on mobile)
- Colour scheme: Clean white background, dark text, accent colour for CTAs (use a blue-green like #0D9488 or a warm gold #D97706 — pick one, be consistent)

### Data structure to initialise:
```json
{
  "user": {
    "name": "",
    "dob": "",
    "occupation": "",
    "monthlyGross": 0,
    "taxYear": "2025/26",
    "setupComplete": false,
    "setupStep": 0,
    "version": "3.0"
  },
  "taxProfile": {
    "homeOffice": { "enabled": false, "percentage": 0 },
    "travel": { "enabled": false, "hasLogbook": false },
    "retirement": { "enabled": false, "monthlyRA": 0 },
    "medical": { "enabled": false, "members": 1, "dependents": 0 },
    "donations": { "enabled": false }
  },
  "expenses": [],
  "documents": [],
  "budget": {},
  "backpocket": [],
  "settings": {
    "activeTaxYear": "2025/26",
    "isPremium": false
  }
}
```

---

## PHASE 1: ONBOARDING — WHO ARE YOU (3 screens)

### Screen 1: Welcome
- App name: "Tax Tjommie"
- Tagline: "Your pocket tax companion for freelancers"
- Subtext: "Built for self-employed South Africans. Track expenses, maximise deductions, know your tax position — all year round."
- Single button: "Let's get started"
- Small disclaimer at bottom: "Tax Tjommie helps you track and organise. Always confirm with a registered tax practitioner before filing."

### Screen 2: Your Details
- **Name** (text input, required)
- **Date of birth** (date picker — needed for age-based rebates: under 65, 65-74, 75+)
- **What do you do?** (free text — "Graphic designer", "Plumber", "Content creator", etc.)
- **Tax year** (dropdown, default 2025/26, also show 2024/25 option: "I want to do last year's tax too")
- Button: "Next"

### Screen 3: Your Income
- **How much do you earn per month (before tax)?** (Rand input with R prefix)
- On input, immediately show:
  - Annual income: R[monthly × 12]
  - Your tax bracket: [X]% marginal rate
  - Estimated tax before deductions: R[calculated]
  - "You're a provisional taxpayer" (if income > R95,750/year for under 65)
- Helpful text: "Don't worry if it varies — use your average. You can change this anytime."
- Button: "Next — let's reduce that tax"

---

## PHASE 2: ONBOARDING — GUIDED TAX SETUP (The core differentiator)

### Screen 4: Your Deductions — Guided Walkthrough

This is the TEACHING moment. The app walks through every major deduction category with simple yes/no questions, explanations, and follow-ups.

**The categories, in order (most common → least common for freelancers):**

#### 2a. Home Office
- "Do you work from home?" → Yes/No
- If Yes:
  - "What percentage of your home is your office?" → Slider 5-50% (or "Help me calculate" → enter total m², office m²)
  - Explanation: "As a freelancer, you can deduct [X]% of your rent/bond interest, electricity, water, rates, internet, and security costs. SARS requires the space to be used regularly and exclusively for work."
  - Follow-up: "What's your monthly rent or bond repayment?" → R amount
  - Note if bond: "Only the interest portion is deductible, not the capital repayment. Your bank statement will show the split."
  - "Monthly electricity/water?" → R amount
  - "Monthly internet?" → R amount
  - Auto-calculate: "Your estimated home office deduction: R[X]/month = R[X × 12]/year"

#### 2b. Vehicle / Travel
- "Do you use your car for work?" → Yes/No
- If Yes:
  - Explanation: "You can deduct the work portion of your vehicle costs — fuel, insurance, maintenance, repairs, and depreciation. BUT you need a logbook. SARS requires you to record every business trip: date, where you went, km driven, and purpose."
  - "Do you keep a logbook?" → Yes / Not yet
  - If "Not yet": "No problem — you can start now. We'll remind you. For this year, estimate your work-use percentage."
  - "What % of your driving is for work?" → Slider 10-90%
  - "Monthly fuel cost?" → R amount
  - "Monthly insurance?" → R amount  
  - "Any recent repairs or services?" → R amount (this is where the car repair scenario fits)
  - Note: "Driving from home to a regular office is NOT deductible — that's commuting. But driving to client sites, meetings, suppliers = deductible."
  - Auto-calculate: "Your estimated travel deduction: R[X]/month = R[X × 12]/year"

#### 2c. Phone & Internet (if not already captured in home office)
- "Do you use your phone for work?" → Yes/No
- If Yes:
  - "What % is work use?" → Slider
  - "Monthly phone bill?" → R amount
  - Auto-calculate deduction

#### 2d. Equipment & Software
- "Did you buy any equipment or software for work this year?" → Yes/No
- If Yes:
  - Explanation: "Laptops, phones, cameras, tools, software subscriptions — anything you use for work is deductible. Items under R7,000 can be claimed in full. Items over R7,000 are depreciated over 3 years (33.3% per year)."
  - "Add items:" → repeatable: Description + Amount + Date purchased
  - Note: "Keep your invoices! SARS may ask for proof."

#### 2e. Professional Fees & Services
- "Do you pay for any of these?" → Multi-select checkboxes:
  - [ ] Accountant / tax practitioner
  - [ ] Legal fees (work-related)
  - [ ] Professional body membership
  - [ ] Insurance (professional indemnity / business)
  - [ ] Bank charges (business account)
  - [ ] Subcontractors / freelancers you hire
- For each selected: "Monthly or annual amount?" → R amount

#### 2f. Marketing & Business Costs
- "Do you spend money on marketing or growing your business?" → Yes/No
- If Yes → Multi-select:
  - [ ] Website hosting / domain
  - [ ] Advertising (Google, Facebook, print)
  - [ ] Business cards / printing
  - [ ] Client entertainment (lunches, coffees)
  - [ ] Stationery & office supplies
  - [ ] Courses, training, conferences
- For each: amount + frequency (monthly/annual/once-off)
- Note on client entertainment: "Keep records of who you met, where, and why. SARS wants to see it was genuinely business-related."
- Note on courses: "Must be related to your current work. A graphic designer can claim a design course, but not a cooking class."

#### 2g. Retirement Annuity
- "Do you contribute to a Retirement Annuity (RA)?" → Yes/No
- If Yes:
  - "Monthly contribution?" → R amount
  - Auto-calculate: "You can deduct up to 27.5% of your income (max R350,000/year). Your current contribution of R[X × 12]/year is [within/exceeding] this limit."
  - If No: "💡 An RA is one of the best tax deductions available. Every R1,000 you contribute saves you R[marginal rate × 1000] in tax. Worth considering!"

#### 2h. Medical
- "Do you have medical aid?" → Yes/No
- If Yes:
  - "How many people on your plan?" → Main member + dependents (number inputs)
  - Auto-calculate: "You qualify for medical tax credits of R[calculated]/month"
  - "Do you have additional out-of-pocket medical expenses not covered by your plan?" → Yes/No
  - If Yes: "Track these in your expenses throughout the year. Amounts exceeding 7.5% of your taxable income may qualify for additional credits."

#### 2i. Donations
- "Do you donate to registered charities (PBOs)?" → Yes/No
- If Yes:
  - Explanation: "Donations to SARS-registered Public Benefit Organisations (with Section 18A certificates) are deductible up to 10% of your taxable income."
  - "Estimated annual donations?" → R amount

### Screen 5: YOUR TAX POSITION (The Reveal)

This screen is the payoff. Show everything calculated:

```
YOUR 2025/26 TAX SUMMARY
─────────────────────────
Annual income:                    R 360,000
                                  ─────────
DEDUCTIONS:
  Home office (12%):              R  28,800
  Vehicle (40% work use):         R  18,000
  Phone (60% work use):           R   7,200
  Equipment:                      R  12,500
  Professional fees:              R   8,400
  Marketing & business:           R   6,200
  Retirement annuity:             R  36,000
                                  ─────────
Total deductions:                 R 117,100
                                  ─────────
Taxable income:                   R 242,900
Tax on taxable income:            R  44,186
Less: Primary rebate:            -R  17,235
Less: Medical credits:           -R   8,736
                                  ─────────
ESTIMATED TAX FOR THE YEAR:       R  18,215
Per month:                        R   1,518
                                  ─────────
WITHOUT deductions you'd pay:     R  39,543
YOUR DEDUCTIONS SAVE YOU:         R  21,328 ✨
```

- Big emphasis on the savings number
- "This is an estimate. Your tax practitioner will confirm the final amount."
- Button: "See what's left for your budget →"

### Screen 6: WHAT'S LEFT — Bridge to Budget

```
YOUR MONTHLY PICTURE
─────────────────────
Monthly income:                   R  30,000
Less: Estimated tax:             -R   1,518
Less: Retirement annuity:        -R   3,000
                                  ─────────
AVAILABLE FOR LIVING:             R  25,482
```

- "Now let's plan how to spend this wisely."
- Two options:
  - "Set up my budget now" → goes to budget setup
  - "I'll do this later" → goes to dashboard

---

## PHASE 3: BUDGET SETUP (Quick, optional)

### Budget Setup Screen
- Shows the "Available for living" number at the top
- Pre-filled categories with suggested % allocations (user can adjust):

```
ESSENTIALS:
  Housing (rent/bond):     R _____ 
  Utilities:               R _____
  Groceries:               R _____
  Transport:               R _____
  Medical (co-payments):   R _____
  Insurance:               R _____
  Debt repayments:         R _____

LIFESTYLE:
  Eating out:              R _____
  Entertainment:           R _____
  Clothing:                R _____
  Subscriptions:           R _____
  Personal care:           R _____

SAVINGS:
  Emergency fund:          R _____
  Other savings:           R _____
```

- Running total at bottom: "Total budgeted: R[X] of R[available]"
- If over: "⚠️ You're R[X] over your available income"
- If under: "R[X] unallocated — consider putting this toward savings or your Backpocket"
- Button: "Save budget" → Dashboard

---

## PHASE 4: DASHBOARD (The Daily Home Screen)

### Layout:
**Tax Year Selector** (top) — dropdown: "2025/26" / "2024/25"

**Tax Summary Card:**
- "Estimated deductions this year: R[total]"
- Mini breakdown: Home office R[X] | Travel R[X] | RA R[X] | Other R[X]
- "Saving you approximately R[tax saved] in tax"
- Tap for full tax view

**Budget This Month:**
- Progress bar: "R12,400 of R25,482 spent (49%)"
- Traffic light: Green (<75%) / Amber (75-90%) / Red (>90%)
- Top 3 categories by spend
- Tap for full budget view

**Backpocket Goals** (if any):
- Mini progress bars for each goal
- Tap for Backpocket view

**Recent Expenses:**
- Last 5 expenses with date, amount, category, deductible badge
- "See all" link

**Smart Nudges** (one at a time, contextual):
- No expenses in 7+ days: "Haven't logged anything in a while — even small expenses add up."
- IRP6 due soon: "Provisional tax payment due [date]. Estimated: R[amount]"
- Unfiled past year: "Your 2024/25 year is ready for filing. Generate your report."
- RA room: "You've used R[X] of your R[cap] RA deduction. Room for R[remaining]."
- Backpocket: "R[X] under budget on eating out this month — put it toward [goal name]?"

---

## PHASE 5: LOG EXPENSE (The Core Daily Action — Under 30 Seconds)

### Log Expense Screen (accessible from any screen via "+" button)

**Fields:**
1. **Date** — defaults to today, can change
2. **Amount** — R input, large, prominent
3. **Description** — free text ("Client lunch at Nando's", "Uber to meeting", "New mouse")
4. **Category** — dropdown:

```
WORK EXPENSES (deductible):
├── Home office (rent/bond, utilities, internet, security)
├── Vehicle & travel (fuel, parking, tolls, uber)
├── Vehicle maintenance (repairs, service, tyres, insurance)
├── Phone & communications
├── Equipment & tools (laptop, camera, tools)
├── Software & subscriptions (Adobe, hosting, apps)
├── Professional services (accountant, legal, insurance)
├── Marketing & advertising
├── Office supplies & stationery
├── Client entertainment (meals, coffee, events)
├── Training & education (courses, books, conferences)
├── Subcontractors & freelancers hired
├── Bank charges (business account fees)
├── Other business expense

PERSONAL EXPENSES (not deductible, tracked for budget):
├── Housing (rent/bond payment)
├── Groceries
├── Eating out
├── Transport (personal)
├── Medical
├── Insurance (personal)
├── Clothing
├── Entertainment
├── Subscriptions (Netflix, Spotify, etc.)
├── Personal care
├── Education (personal)
├── Gifts
├── Debt repayment
├── Other personal
```

5. **Receipt** — optional:
   - 📸 Take photo → Tesseract.js OCR reads amount + date → user confirms
   - 📤 Upload image
   - ✏️ No receipt (flags it)

6. **Save** → Confirmation with smart response:
   - Work expense: "✅ R180 logged as client entertainment. Added to your deductions — saving you ~R[amount × marginal rate] in tax."
   - Personal expense: "✅ R450 logged under Groceries. R[remaining] left in your grocery budget this month."
   - Work expense without receipt: "⚠️ Logged, but no receipt attached. SARS may require proof for deductions — try to get one."
   - Car repair (work): "✅ R3,200 logged as vehicle maintenance (work). Since you use your car [X]% for work, R[work portion] is deductible."

### Smart Category Detection:
Based on keywords in description, auto-suggest category:
- "fuel" / "petrol" / "diesel" → Vehicle & travel
- "uber" / "bolt" → Vehicle & travel
- "lunch" / "coffee" / "dinner" + "client" → Client entertainment  
- "adobe" / "hosting" / "subscription" → Software & subscriptions
- "Pick n Pay" / "Woolworths" / "Checkers" → Groceries
- "Netflix" / "Spotify" / "DSTV" → Subscriptions (personal)

---

## PHASE 6: TAX SCREENS

### 6a. Tax Summary (Tab 1 under "Tax" nav)
- Full breakdown of deductions by category
- Year-to-date totals
- Comparison: "Tax with deductions vs without"
- Missing items flagged: "You claimed home office but haven't logged any home office expenses yet"

### 6b. Tax Calculator (Tab 2)
Inputs (pre-filled from profile, all editable):
- Gross annual income
- Age bracket
- Total deductions (auto from tracker)
- Medical credits (auto from profile)
- RA contributions (auto from profile)

Outputs:
- Full bracket calculation shown step by step
- Taxable income → Tax before rebates → Rebates → Medical credits → **Net tax**
- Effective rate, marginal rate
- "If you add R1,000 more in deductions, you save R[marginal rate × 1000]"

### 6c. Provisional Tax (Tab 3)
- Estimated annual tax liability
- Payment schedule: 1st (Aug 31) / 2nd (Feb 28) / Optional 3rd (Sep 30)
- What you've paid vs what you owe
- Monthly set-aside suggestion
- Penalty warning if estimate looks low

### 6d. Documents
- Upload/capture documents by category: Receipts, IRP5, Medical certs, Logbook, Section 18A, Other
- Linked to expenses where applicable
- Search by date, description, amount

### 6e. Year-End Report (THE DELIVERABLE)
- Generate downloadable PDF:
  - Complete deduction summary by SARS category
  - All work expenses listed with dates and amounts
  - Medical summary
  - RA summary
  - Document inventory (what you have proof for)
  - "Prepared by Tax Tjommie — for use with your tax practitioner"

---

## PHASE 7: BUDGET TRACKER

### Budget Overview
- This month: total spent vs total budgeted
- Category breakdown with progress bars (green/amber/red)
- "You've spent R[X] of R[budget]. R[remaining] left with [days] days to go."

### Category Detail
- Tap any category → see all expenses in that category this month
- Trend: "You spent R[X] last month on this category"

### Edit Budget
- Change amounts per category
- Add custom categories

---

## PHASE 8: BACKPOCKET (Savings Goals)

### Goals List
- Each goal: name, progress bar, target amount, target date
- "R3,200 of R10,000 — 32% there"
- Add new goal button

### Create Goal
- Name, target amount, target date (or "no deadline")
- App calculates: R[X]/month needed

### Goal Detail
- Progress chart
- Log savings: "I saved R[amount] this month"
- Savings opportunities: "You're R500 under budget on eating out — put it toward [goal]?"
- Behind/ahead indicator

---

## PHASE 9: MULTI-YEAR TAX SUPPORT

### Tax Year Selector
- Appears at top of Dashboard, Tax screens, Log Expense, Documents
- Dropdown: 2026/27 | 2025/26 | 2024/25 | 2023/24
- Clear indicator: "📅 Viewing: 2024/25"
- Switching filters ALL tax data to that year

### Past Year Setup
- If opening a past year for first time:
  - "Let's set up your 2024/25 tax year"
  - Same guided deduction walkthrough but simplified
  - "What was your approximate income for 2024/25?"
  - Quick deduction questions

### Year Status
- **Active** — current year, logging in progress
- **Ready for filing** — year ended, can still add/edit
- **Filed** — user marks as done (can unlock)

### Tax Brackets Per Year
- Store brackets for each year (2024/25 and 2025/26 are identical)
- Display which year's tables are being used

---

## TAX ENGINE — SARS 2025/26 (and 2024/25 — identical)

### Brackets
| Taxable Income | Rate |
|---|---|
| R0 – R237,100 | 18% |
| R237,101 – R370,500 | R42,678 + 26% above R237,100 |
| R370,501 – R512,800 | R77,362 + 31% above R370,500 |
| R512,801 – R673,000 | R121,475 + 36% above R512,800 |
| R673,001 – R857,900 | R179,147 + 39% above R673,000 |
| R857,901 – R1,817,000 | R251,258 + 41% above R857,900 |
| R1,817,001+ | R644,489 + 45% above R1,817,000 |

### Rebates
- Primary: R17,235 (all)
- Secondary: R9,444 (65+)
- Tertiary: R3,145 (75+)

### Thresholds
- Under 65: R95,750
- 65-74: R148,217
- 75+: R165,689

### Medical Credits
- Main member: R364/month
- First dependent: R364/month
- Each additional: R246/month
- OOP (under 65): amounts exceeding 7.5% of taxable income × 25%
- OOP (65+): 33.3% of qualifying expenses

### RA Cap
- min(contributions, 27.5% of income, R350,000)

### Donations
- Capped at 10% of taxable income
- Requires Section 18A receipt

### Provisional Tax
```
1. Taxable income = Gross - Deductions
2. Tax = Bracket calculation
3. Less rebates (age-based)
4. Less medical credits
5. = Annual tax liability
6. IRP6 Period 1 (Aug 31) = Liability ÷ 2
7. IRP6 Period 2 (Feb 28) = Liability - Period 1
8. Optional Period 3 (Sep 30) = Top-up if needed
```

### Depreciation (Wear & Tear)
- Assets < R7,000: 100% in year of purchase
- Assets ≥ R7,000: 33.3% per year over 3 years
- Only work-use portion is deductible

---

## SMART RESPONSES (Pre-programmed, NOT AI)

### When logging expenses:
| Trigger | Response |
|---|---|
| Work expense logged | "✅ R[X] added to [category]. This saves you ~R[X × marginal rate] in tax." |
| Personal expense logged | "✅ R[X] logged to [category]. R[remaining] left in your [category] budget." |
| Car repair (work) | "✅ Vehicle maintenance logged. [X]% work-use = R[work portion] deductible." |
| No receipt on work expense | "⚠️ Logged, but no receipt. SARS may require proof — try to add one." |
| Large equipment purchase | "Logged. Items over R7,000 are depreciated over 3 years (R[annual] per year)." |
| Client entertainment | "✅ Logged. Remember to note who you met with and the business purpose." |
| Donation | "✅ R[X] donation logged. Make sure you have a Section 18A certificate." |

### Dashboard nudges:
| Condition | Nudge |
|---|---|
| No expenses 7+ days | "Haven't logged anything in a while. Even small expenses count." |
| Tax year ending <60 days | "The 2025/26 tax year ends 28 Feb. Check your records are complete." |
| Filing season approaching | "Filing season opens July. Your year-end report will be ready." |
| RA contribution room | "You've contributed R[X] to RA. Room for R[remaining] more this year." |
| IRP6 due <30 days | "Provisional tax due [date]. Estimated payment: R[X]." |
| Over budget category | "You're over budget on [category] by R[X] this month." |
| Under budget category + Backpocket | "R[X] under budget on [category]. Put it toward [goal name]?" |
| Past year unfiled | "Your [year] tax year is ready. Generate your report for your tax lady." |
| Home office claimed, no expenses | "You claimed home office but haven't logged any home office expenses." |

---

## EXPENSE CATEGORIES — COMPLETE LIST

### Work Expenses (Deductible for self-employed)
These map to ITR12 "Other Deductions" / Local Business Income sections:

| App Category | What it includes | SARS Alignment |
|---|---|---|
| Home office | Rent/bond interest %, utilities %, internet %, security % | Section 23(b) |
| Vehicle & travel | Fuel, parking, tolls, ride-hailing (work trips) | Logbook required |
| Vehicle maintenance | Repairs, services, tyres, car insurance, car wash | Work-use % only |
| Phone & comms | Phone bill, data, airtime (work %) | Apportioned |
| Equipment & tools | Laptop, camera, tools, furniture (work use) | Wear & tear / Section 11(e) |
| Software & subs | Adobe, hosting, cloud storage, apps | Fully deductible if work |
| Professional services | Accountant, tax practitioner, legal, insurance | Section 11(a) |
| Marketing & advertising | Website, ads, business cards, printing | Section 11(a) |
| Office supplies | Stationery, printer ink, paper | Section 11(a) |
| Client entertainment | Meals, coffees, events with clients | Must document who/why |
| Training & education | Courses, books, conferences (related to current work) | Section 11(a) |
| Subcontractors | Payments to freelancers/contractors you hire | Section 11(a) |
| Bank charges | Business account fees, transaction fees | Section 11(a) |
| Other business | Anything else incurred in production of income | Section 11(a) general |

### Personal Expenses (Not deductible — budget tracking only)
| App Category | Examples |
|---|---|
| Housing | Rent/bond (non-deductible portion), body corp |
| Groceries | Food shopping |
| Eating out | Restaurants, takeaway (personal) |
| Transport | Personal uber, fuel (non-work), car payment |
| Medical | Co-payments, pharmacy, doctor visits |
| Insurance | Life, household, car (personal portion) |
| Clothing | Clothes, shoes (not deductible in SA) |
| Entertainment | Movies, events, hobbies |
| Subscriptions | Netflix, Spotify, gym, DSTV |
| Personal care | Haircut, beauty, toiletries |
| Education | Kids school, personal courses |
| Gifts | Birthdays, Christmas (not Section 18A) |
| Debt repayment | Credit card, personal loan |
| Other personal | Everything else |

---

## WHAT WE ARE NOT BUILDING (MVP SCOPE)

- ❌ Receipt OCR (add in v3.1 — Tesseract.js adds complexity for MVP)
- ❌ Year-end PDF report generation (add in v3.1)
- ❌ Ads/premium toggle (add later)
- ❌ Push notifications / reminders
- ❌ Data export
- ❌ Multiple tax year SETUP (can switch viewer, but first year gets full setup)
- ❌ Logbook feature
- ❌ Document storage (receipt photos)

## WHAT WE ARE BUILDING (MVP — Testable Today)

- ✅ Full onboarding flow (6 screens — identity, income, guided deductions, tax reveal, budget bridge, budget setup)
- ✅ Dashboard with tax summary, budget summary, recent expenses, nudges
- ✅ Log expense (all categories, work/personal, smart responses)
- ✅ Budget tracker (monthly view, category breakdown, progress bars)
- ✅ Tax calculator (full SARS bracket calculation)
- ✅ Tax summary (deductions breakdown)
- ✅ Backpocket savings goals (create, log, track)
- ✅ Tax year selector (view different years)
- ✅ Settings (edit profile, tax profile, budget)
- ✅ Mobile-first responsive design
- ✅ localStorage persistence
- ✅ Navigation (bottom nav + floating log button)

---

## BUILD ORDER FOR CLAUDE CODE

### Batch 1: Foundation + Onboarding (Build this FIRST)
1. HTML shell with React + Babel CDN
2. App state management + localStorage helpers
3. Hash router
4. Onboarding screens 1-3 (Welcome, Details, Income)
5. Onboarding screen 4 (Guided deductions — all 9 sub-sections)
6. Onboarding screen 5 (Tax reveal — full calculator)
7. Onboarding screen 6 (What's left + Budget setup)
8. Bottom navigation bar

### Batch 2: Daily Use
9. Dashboard (tax card, budget card, recent expenses, nudges)
10. Log Expense screen (all fields, categories, smart responses)
11. Expense list view (filterable by category, date, work/personal)

### Batch 3: Budget + Tax
12. Budget tracker (monthly view, categories, progress bars)
13. Tax summary view (deductions breakdown)
14. Tax calculator (interactive, all inputs/outputs)
15. Provisional tax calculator

### Batch 4: Backpocket + Polish
16. Backpocket goals (create, list, log savings, progress)
17. Settings screen
18. Tax year selector
19. Smart nudges on dashboard
20. Final CSS polish

---

## CRITICAL IMPLEMENTATION NOTES

1. **The tax calculation function must be EXACT.** Use the bracket table precisely. Test with known values:
   - R300,000 taxable: R42,678 + (R300,000 - R237,100) × 26% = R42,678 + R16,354 = R59,032 before rebates
   - R59,032 - R17,235 (primary rebate) = R41,797 annual tax

2. **All monetary amounts displayed as Rands with "R" prefix and thousands separator.** R1,234 not 1234. No cents.

3. **Mobile-first.** Design for 375px width. Tap targets minimum 44px. Large text on inputs.

4. **The onboarding MUST feel like a conversation**, not a form. One question at a time with explanations. Progress indicator showing how far along they are.

5. **Every work expense logged should show the tax saving.** This is the dopamine hit. "R180 lunch = R50 tax saving" (at 28% marginal rate).

6. **localStorage limit is ~5-10MB.** Sufficient for years of expense data without photos. If we add receipt photos later, we'll need to compress or use IndexedDB.

7. **Date handling:** Tax year runs 1 March to 28/29 February. All expense filtering by tax year must use these boundaries, NOT calendar year.

8. **The app should work fully offline** once loaded. No network requests needed for any feature.
