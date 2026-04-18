# TAX TJOMMIE v4 — PRESERVATION LIST

> **Read this before writing a single line of code.**
>
> Tax Tjommie v3 (the currently deployed app at https://tax-tjommie-app.vercel.app/) has earned a handful of genuinely differentiated features through iteration. The v4 rebuild is about **repositioning** — upload-first onboarding, new visual direction, The Tax Shop audience — NOT about re-inventing tax logic.
>
> **The features and content on this list must be preserved verbatim or made better. They are the product's hard-earned competitive moat.** If you rewrite them from scratch you will lose SA tax accuracy and lose features that no other tool in the market gets right.
>
> When in doubt, open the live app at https://tax-tjommie-app.vercel.app/ and copy the content.

---

## 1 — Tax mathematics (non-negotiable)

### 1.1 SARS 2025/26 tax brackets

```
R0         – R237,100:    18%
R237,101   – R370,500:    R42,678  + 26% above R237,100
R370,501   – R512,800:    R77,362  + 31% above R370,500
R512,801   – R673,000:    R121,475 + 36% above R512,800
R673,001   – R857,900:    R179,147 + 39% above R673,000
R857,901   – R1,817,000:  R251,258 + 41% above R857,900
R1,817,001+:              R644,489 + 45% above R1,817,000

Primary rebate:        R17,235
Tax threshold:         R95,750
Interest exemption:    R23,800
Medical credits:       R364 main + R364 first dep + R246 each additional (per month)
Medical OOP relief:    max(0, OOP - 7.5% of taxable income) × 25%
RA deduction cap:      min(annual RA, 27.5% of income, R350,000)
```

**These numbers must match the live app exactly.** Verify a test case: R600,000 gross → R135,632 tax → R11,303/month → 23% effective rate → 36% marginal.

### 1.2 Tax functions to preserve

The v3 app has these functions on a `Tax` namespace. Same interface in v4:
- `Tax.calc(taxableIncome)` — returns tax before rebates
- `Tax.rate(taxableIncome)` — returns marginal rate
- `Tax.raDeduction(monthlyRA, annualIncome)` — capped RA deduction
- `Tax.medCredit(members, dependents)` — monthly credit
- `Tax.medOOP(oopAmount, taxableIncome)` — out-of-pocket relief
- `Tax.estimate(userData)` — full estimate returning `{ total, breakdown, rate }`

## 2 — Expert tax content (crown jewels)

These are the single most valuable pieces of content in the app. They exist in v3. They must exist in v4 with the same wording — or better, but never less accurate.

### 2.1 Capital Gains Tax warning on Home Office

Location in v3: Home Office setup, shown after "Yes I work from home" for homeowners.

**Exact copy to preserve** (tested, legally careful):

> **Important for homeowners:** If you own your home and claim a home office deduction, the business portion of your property may **not qualify** for the primary residence Capital Gains Tax (CGT) exclusion when you sell. This could cost you significantly on sale. Discuss with your accountant before claiming.

This warning is unique in the South African tax app market. Almost no other tool flags it. It must appear in the v4 Home Office setup flow.

### 2.2 Bond interest only (not full bond repayment)

Location in v3: Home Office monthly bond input.

**Exact copy to preserve:**

> If you have a bond, only enter the interest portion. Your bank statement shows this separately. Entering the full bond repayment will overstate your deduction.

Placed below the "Monthly rent or bond interest (interest only, not full bond repayment)" input.

### 2.3 Personal Service Provider check (Section 23(m))

Location in v3: Provisional Tax tab, at the bottom.

**Exact copy to preserve:**

> **Personal Service Provider check:** If you work mainly for one client, operate like an employee (fixed hours, their office, their tools), and don't have other employees, SARS may classify you as a "Personal Service Provider" under Section 23(m). This significantly limits your allowable deductions. If this sounds like your situation, consult a tax practitioner.

### 2.4 Provisional tax under-estimation penalty

Location in v3: Provisional Tax tab.

**Exact copy to preserve:**

> **Under-estimation penalty:** If your second provisional estimate is less than 90% of your actual taxable income (80% if earning over R1M), SARS may impose an additional penalty of up to 20% of the shortfall. It's safer to slightly overestimate.

### 2.5 Late payment penalty

Location in v3: Provisional Tax tab.

**Exact copy to preserve:**

> **Late payment penalty:** Missing IRP6 deadlines results in a 10% penalty on the unpaid tax, plus interest charged daily at the prescribed rate. SARS does not send reminders — it's your responsibility.

### 2.6 How to pay provisional tax

Location in v3: Provisional Tax tab.

**Exact copy to preserve:**

> **How to pay:** Log in to SARS eFiling → Returns → Provisional Tax → IRP6. Enter your estimated taxable income and the system calculates the payment. Pay via EFT to the SARS bank account shown on the return.

### 2.7 Sole proprietor employment note

Location in v3: Dashboard.

**Exact copy to preserve:**

> **Note for sole proprietors:** As a freelancer without employees, you are generally exempt from UIF, SDL, and COIDA contributions. If you hire staff (even part-time), you must register and these become deductible expenses.

### 2.8 Receipt warning on expense capture

Location in v3: Log Expense screen, when receipt box is unchecked.

**Exact copy to preserve:**

> **No receipt** — SARS can disallow this deduction entirely. Keep all receipts for at least 5 years.

Shown in red/warning style when user has not ticked "I have a receipt" box.

## 3 — Compliance-aware expense capture

### 3.1 Client entertainment capture

Location in v3: Log Expense — when "Client entertainment (meals, coffee, events)" category is selected, two REQUIRED fields appear:

- **"Who did you meet? (SARS requires this)"** — text input (e.g., "John Smith, Acme Corp")
- **"Business purpose"** — text input (e.g., "Pitched Q2 design retainer")

On save, these compose into a compliance note: *"Compliance note saved: met with [WHO] for [PURPOSE]."*

Preserve this flow exactly. Extend to any other category where SARS requires audit-trail context (travel entertainment, training, etc.) if you have time — but client entertainment is non-negotiable.

### 3.2 Category-triggered field logic

The v3 app conditionally shows extra fields based on category. In v4, this becomes richer — AI can pre-populate the category, but on user-edit of a categorised AI transaction, the compliance fields should appear.

Categories that trigger additional required fields:
- `client_entertainment` → who + purpose (as above)
- `training` → "Related to current work?" (yes/no)
- `equipment` → "Primary use: work / personal / mixed?"

## 4 — Tax calculator (bracket-by-bracket)

Location in v3: Tax tab → Calculator sub-tab.

This is the **single best thing in the app** and must be preserved. Features:

- Annual gross income input (editable)
- Age input (for rebates — primary + secondary + tertiary)
- Total annual deductions input (editable — feeds from tax profile or user override)
- "Medical aid member" checkbox
- **Step-by-step calculation display showing each bracket used:**
  - Gross income
  - Less: Deductions
  - Taxable income
  - For each applicable bracket: "R237,100 – R370,500 @ 26% = R34,684"
  - Tax before rebates
  - Less: Primary rebate
  - NET TAX PAYABLE (large, teal)
  - Per month
- Effective rate + Marginal rate displayed as two cards below
- **"What-if" callout** after the calculation:
  > What-if: If you add R1,000 more in deductions, you'd save R360 in tax (at your 36% marginal rate).

This level of educational content in a tax calculator is rare. Preserve every line.

## 5 — Provisional tax schedule

Location in v3: Tax tab → Provisional sub-tab.

Preserve the layout:
- Short paragraph: "As a freelancer earning more than R95,750/year, you are a provisional taxpayer. You must make two compulsory payments to SARS during the tax year."
- **Payment schedule card:**
  - 1st Payment (IRP6) · Date · Amount · [Paid checkbox]
  - 2nd Payment (IRP6) · Date · Amount · [Paid checkbox]
  - Voluntary (3rd payment, optional) · Date · Amount · [Paid checkbox]
- Overdue payments shown in red with "OVERDUE" label after the date
- Monthly Set-Aside section: "Set aside R X/month for tax"
- Penalty warnings (see 2.4, 2.5 above)
- How-to-pay (see 2.6 above)
- PSP check (see 2.3 above)
- "Download Tax Summary for Practitioner" button

## 6 — Practitioner PDF export

Location in v3: Tax tab → Summary sub-tab has "Generate PDF Report for 2025/26" button.

Preserve this feature completely. Output includes:
- User name + tax year
- Annual income
- Deductions from profile (itemised)
- Logged work expenses YTD
- Tax position (without vs with deductions, savings)
- Effective and marginal rate
- All compliance notes on entertainment expenses
- Receipt attachment list

**New for v4:** logo placeholder slot at top of PDF — swappable for Tax Shop / franchise branding.

Use `jsPDF` (already in project per prior plan). Lazy-load on first use, not on page load.

## 7 — Deductions profile (11 categories)

All 11 deduction categories from v3's Manage Deductions screen must exist, with the same setup sub-flows:

1. **Home Office** — percentage, rent/bond interest, electricity, water, internet, security, home insurance. With the CGT warning. With the bond-interest-only note.
2. **Vehicle & Travel** — logbook vs actual method, work percentage, fuel, insurance, depreciation, maintenance.
3. **Phone & Internet** — work percentage, monthly bill.
4. **Equipment & Software** — line items with purchase date + cost + work %.
5. **Professional Fees** — indemnity insurance, accountant, legal.
6. **Marketing & Business** — ads, branding, website.
7. **Retirement Annuity & Savings** — monthly RA contribution, with deduction cap calculation.
8. **Medical** — members, dependents, out-of-pocket flag.
9. **Donations** — Section 18A annual amount, capped at 10% of taxable income.
10. **Bad Debts** — annual written-off amount.
11. **Business Loan Interest** — annual interest paid.

**Change for v4:** These are no longer surfaced as an empty list on first load. They appear as prompts during onboarding Screen 6, based on what the AI found in statements, AND remain accessible in Tax tab → Deductions manager.

## 8 — Tax year architecture

Preserve multi-year support:
- Currently tracked: 2025/26 (current), 2024/25 (last year), and any prior years the user has worked with
- SA tax year boundaries: 1 March → 28/29 Feb
- Active year selector (pill) at top of Home and Tax tabs
- Each year has independent `transactions`, `taxProfile`, `provTaxPaid`

**Bug to fix:** v3 silently accepts expenses dated outside the active tax year. Fix by either:
- Warning on save: "This date falls in 2026/27 — switch active year?"
- Auto-routing: use the date to determine the correct year, store there regardless of UI-selected active year

## 9 — Storage transparency

Location in v3: Settings → Data section.

Preserve:
- "Storage Used: 1.6 KB / ~5 MB limit" display
- Export Data button (JSON download)
- Import Data button (JSON upload, for cross-device sync)
- Reset All Data button (red, confirmation required)

Users like seeing this. It's a trust move.

## 10 — Data migration from v3

**Do not wipe v3 user data on upgrade.**

On first v4 load:
1. Check localStorage for key `tax_tjommie_v3`
2. If found, read it and migrate to the v4 schema under key `tax_tjommie_v4`:
   - `expenses` → `transactions` (with `source: "manual"`, `userConfirmed: true`)
   - `taxProfile` → `taxProfile` (unchanged)
   - `backpocket` → `backpocket` (unchanged)
   - `provTaxPaid` → `provTaxPaid` (unchanged)
   - `settings` → `settings` (merged with new defaults)
   - `user` → `user` (add `userType: "sole_prop"` default, `version: "4.0"`)
3. Create a default account entry in the new `accounts[]` array
4. Do NOT delete the `tax_tjommie_v3` key for at least 30 days — let the user roll back if needed
5. Show a one-time toast: "Welcome back. We've kept everything from your last setup."

## 11 — UI details to preserve

Small but right:

- Currency formatting: `toLocaleString('en-ZA')` with "R " prefix
- "R 47,230" not "R47,230.00" (no cents on whole amounts)
- Relative date rendering: "Today", "Yesterday", "14 Mar" (if current year), "14 Mar 2025" (if prior year)
- ZAR-only — never `$` anywhere
- Time-aware greetings on Home: "Good morning / afternoon / evening, [name]"
- Empty state copy that's warm, not cold (e.g., "No expenses yet — tap here to log your first one and start saving on tax" not "No data")

## 12 — Bugs to fix (do not carry forward)

- **v3 tax-year-date mismatch** — see §8 above
- **"1 expenses logged"** plural grammar — use singular for 1
- **PWA manifest 404** — write a real `manifest.json` and `sw.js`
- **$ icon on Budget empty state** — replace with R or wallet icon
- **Currency input showing unformatted** — format on blur with tabular-nums display
- **Dashboard on first load** — density was too high; let the new onboarding deliver the populated state more gracefully

## 13 — Features that DO NOT need preservation

For clarity on scope — these are OK to drop or redesign freely:

- The two-door splash screen from v3 (Quick Start vs Guided) — replaced by single upload-first flow
- Scripted chat-with-Tjommie dialogue screens from the original spec — not building chat as a feature
- The 18-category budget/tax-combined setup from the original spec — budgets now derive from statement upload
- Green-accent visual treatment — full visual rebrand
- "Getting Started" dashboard card — replaced by populated-from-upload dashboard
- Log Expense as a primary feature — still exists (via ⊕ → Add manually), but not the main value flow anymore

## 14 — Verification checklist

Before shipping, verify each of the following works with a test user:

- [ ] Enter R600,000 annual income → shows R135,632 annual tax, 23% effective, 36% marginal
- [ ] Home Office setup shows CGT warning for "I own my home" users
- [ ] Home Office input labeled "rent or bond interest (interest only, not full repayment)" with helper text
- [ ] Provisional tab shows penalty warnings, PSP check, how-to-pay
- [ ] Tax Calculator shows step-by-step bracket breakdown
- [ ] Tax Calculator has what-if callout at bottom
- [ ] Client entertainment category on new transaction triggers who + purpose fields
- [ ] No receipt ticked shows red warning
- [ ] Storage usage visible in Settings
- [ ] Export/Import JSON works round-trip
- [ ] Practitioner PDF generates with all sections
- [ ] Practitioner PDF has logo placeholder at top
- [ ] v3 user data migrates on first v4 load
- [ ] All 11 deduction categories can be set up from Tax → Deductions manager

If any checkbox is unchecked, the rebuild is incomplete.
