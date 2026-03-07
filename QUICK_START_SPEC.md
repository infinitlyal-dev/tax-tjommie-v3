# TAX TJOMMIE v3 — QUICK START ONBOARDING
## Two-Door Welcome + Progressive Profile Building

---

## THE PROBLEM

Real users don't always have 5-7 minutes for guided onboarding. They download the app on the bus, between meetings, or at 11pm. They want to start logging expenses NOW and figure out the tax stuff later.

## THE SOLUTION

Two paths from the Welcome screen. Same destination, different speed.

---

## WELCOME SCREEN (Updated)

```
TAX TJOMMIE
Your pocket tax companion for freelancers
──────────────────────────────────────────

Built for self-employed South Africans.
Track expenses, maximise deductions,
know your tax position — all year round.


┌─────────────────────────────────┐
│   📋 Guide me step by step      │
│   Set up my full tax profile    │
│   ~5 minutes                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   ⚡ Let me just start logging   │
│   3 quick questions, then go    │
│   ~30 seconds                   │
└─────────────────────────────────┘


This app helps you track and organise.
Always confirm with a registered tax
practitioner before filing with SARS.
```

**Door 1: "Guide me step by step"** → Goes to the existing full onboarding (Phases 1-3 from COMPLETE_BUILD.md). Nothing changes here.

**Door 2: "Let me just start logging"** → Goes to Quick Start flow below.

---

## QUICK START FLOW (One screen, 30 seconds)

### Screen: Quick Setup

```
QUICK SETUP
────────────
Let's get the basics so you can start logging.
You can set up your full tax profile anytime.

What's your name?
┌─────────────────────────────────┐
│ e.g. Thabo                      │
└─────────────────────────────────┘

What do you do?
┌─────────────────────────────────┐
│ e.g. Graphic designer           │
└─────────────────────────────────┘

Roughly what do you earn per month?
┌─────────────────────────────────┐
│ R                               │
└─────────────────────────────────┘

Which tax year are you working on?
  ● 2025/26 (current)
  ○ 2024/25 (last year)


        [ Start logging → ]
```

**That's it.** Three fields and a tax year toggle. On submit:

1. Save user profile with just name, occupation, monthlyGross, taxYear
2. Set `setupComplete: false` and `quickStart: true` in the data
3. Calculate basic tax bracket from income (for smart responses)
4. Set all deduction categories to `enabled: false`
5. Go straight to Dashboard

The dashboard works immediately — they can log expenses, see budget tracking (with no budget set yet), and see a basic tax estimate based on income alone (no deductions).

---

## PROGRESSIVE PROFILE BUILDING

This is the clever part. Instead of asking everything upfront, the app learns about the user from their behaviour and asks ONE question at a time, in context, when it's relevant.

### How It Works

Every time the user logs an expense or interacts with a feature, the app checks: "Is there a deduction setup question I should ask based on what they just did?"

These are called **contextual prompts**. They appear as a card AFTER the expense is saved — not blocking the save, never interrupting the logging flow.

### Contextual Prompt Format

```
┌─────────────────────────────────────────┐
│ 💡 Quick question                        │
│                                          │
│ You logged a home office expense.        │
│ Do you work from home?                   │
│                                          │
│ If yes, you can deduct a percentage of   │
│ your rent, electricity, and internet     │
│ from your tax.                           │
│                                          │
│  [Yes, set this up]  [Not now]  [Never] │
└─────────────────────────────────────────┘
```

Three response options:
- **"Yes, set this up"** → Opens a mini setup for just that deduction (1-3 questions). After completion, returns to where they were.
- **"Not now"** → Dismisses. App will ask again after 5 more relevant expenses.
- **"Never"** → Dismisses permanently for this deduction category. Stored in preferences.

### Trigger Rules

Each prompt triggers ONCE based on specific user actions. After the user responds, it doesn't trigger again (unless they chose "Not now", in which case it retriggers after 5 more relevant expenses).

| Trigger | Deduction | Prompt |
|---|---|---|
| Logs first expense in "Home office" category | Home office setup | "Do you work from home? Set up your home office % to track this deduction." |
| Logs first expense in "Vehicle & travel" or "Vehicle maintenance" | Travel setup | "Do you use your car for work? Set up your work-use % to calculate your travel deduction." |
| Logs first expense in "Phone & comms" | Phone setup | "What percentage of your phone do you use for work? This determines how much you can deduct." |
| Logs first expense in "Equipment & tools" and amount ≥ R7,000 | Depreciation info | "Items over R7,000 are depreciated over 3 years. We'll calculate this for you automatically." |
| Logs 5th work expense (any category) and no RA set up | RA prompt | "Do you contribute to a Retirement Annuity? It's one of the biggest tax deductions available." |
| Logs first "Medical" expense | Medical setup | "Do you have medical aid? Setting this up unlocks your medical tax credits." |
| Logs first expense in "Client entertainment" | Entertainment reminder | "Client entertainment is deductible — just remember to note who you met and the business purpose. SARS may ask." |
| Logs first donation expense | Donations setup | "Do you donate to registered charities? With a Section 18A certificate, donations up to 10% of your income are deductible." |
| Opens Tax Calculator for first time (quick start user) | Full profile prompt | "Your tax estimate is based on income only. Want to set up your full deduction profile? It'll be much more accurate." |
| 10th expense logged overall (quick start user) | Full profile nudge | "You're getting the hang of this! Setting up your full tax profile takes 5 minutes and could save you thousands." |
| 30 days since quick start, profile still incomplete | Gentle reminder | "You've been logging for a month — nice work. Your tax profile is only 30% complete. Finish setup to see your full tax savings." |

### Mini Setup Flows (One deduction at a time)

When the user taps "Yes, set this up" on a contextual prompt, they get a focused mini setup for JUST that deduction. These are pulled from the same content as the full onboarding but shown individually.

#### Mini: Home Office
```
HOME OFFICE SETUP
─────────────────
What percentage of your home is your office?

[Slider: 5% ──────●── 50%]
         Currently: 15%

Or calculate it:
Total home size: ___ m²
Office size:     ___ m²
= 12.5%

What's your monthly rent or bond repayment?
R _____

Monthly electricity/water?
R _____

Monthly internet?
R _____

Your estimated home office deduction:
R 2,400/month = R 28,800/year
This could save you ~R 7,488 in tax! ✨

        [Save]    [Cancel]
```

#### Mini: Vehicle / Travel
```
VEHICLE SETUP
─────────────
What percentage of your driving is for work?
(Driving to client sites, meetings, suppliers
 — NOT commuting to a regular office)

[Slider: 10% ──────●── 90%]
         Currently: 40%

Do you keep a logbook?
  ● Yes
  ○ Not yet — I'll start

Monthly fuel cost?
R _____

Monthly car insurance?
R _____

Your estimated travel deduction:
R 1,500/month = R 18,000/year
This could save you ~R 4,680 in tax! ✨

💡 Tip: Repairs and services for your car 
are also deductible at your work-use %.

        [Save]    [Cancel]
```

#### Mini: Phone
```
PHONE SETUP
───────────
What % of your phone is work use?

[Slider: 10% ──────●── 90%]
         Currently: 60%

Monthly phone bill?
R _____

Your deduction: R 600/month = R 7,200/year

        [Save]    [Cancel]
```

#### Mini: Retirement Annuity
```
RETIREMENT ANNUITY
──────────────────
Do you contribute to an RA?
  ● Yes
  ○ No, but tell me more

Monthly contribution?
R _____

Your RA deduction: R 3,000/month = R 36,000/year
This saves you R 9,360 in tax at your bracket!

Max you can contribute: R 8,250/month
(27.5% of your income, capped at R350k/year)

You have room for R 5,250 more per month.

        [Save]    [Cancel]
```

#### Mini: Medical
```
MEDICAL AID SETUP
─────────────────
How many people on your medical aid?

Main members:    [1] [2]
Dependents:      [0] [1] [2] [3] [4+]

Your medical tax credits:
R 728/month = R 8,736/year

Do you have out-of-pocket medical expenses
not covered by your plan?
  ○ Yes — I'll track these in expenses
  ○ No

        [Save]    [Cancel]
```

#### Mini: Donations
```
DONATIONS SETUP
───────────────
Do your charities provide Section 18A
tax certificates?

  ● Yes, they're registered PBOs
  ○ I'm not sure
  ○ No

Estimated annual donations?
R _____

Deductible: up to R [10% of taxable income]
Keep your Section 18A certificates as proof.

        [Save]    [Cancel]
```

---

## PROFILE COMPLETENESS INDICATOR

### On Dashboard (Quick Start users only)
Show a subtle completeness bar:

```
┌─────────────────────────────────────────┐
│ Tax profile: 30% complete               │
│ ███░░░░░░░                              │
│ Set up more deductions to improve your  │
│ tax estimate. [Complete setup →]        │
└─────────────────────────────────────────┘
```

Tapping "Complete setup →" takes them to the full guided onboarding (skipping fields they've already filled in).

### Completeness Calculation
| Field | Weight |
|---|---|
| Name + occupation | 10% |
| Income entered | 15% |
| Home office answered (yes or no) | 10% |
| Travel answered | 10% |
| Phone answered | 10% |
| Equipment acknowledged | 5% |
| RA answered | 15% |
| Medical answered | 15% |
| Donations answered | 10% |

Each deduction counts whether they said YES or NO — the point is they've been asked and answered. An unanswered question means the app doesn't know and the tax estimate is incomplete.

---

## DATA MODEL UPDATES

Add to user object:
```json
{
  "user": {
    "// ... existing fields ...",
    "quickStart": true,
    "setupComplete": false,
    "profileCompleteness": 25
  }
}
```

Add prompt tracking:
```json
{
  "promptHistory": {
    "homeOffice": { "status": "not_asked" },
    "travel": { "status": "not_asked" },
    "phone": { "status": "not_asked" },
    "equipment": { "status": "not_asked" },
    "ra": { "status": "not_asked" },
    "medical": { "status": "not_asked" },
    "donations": { "status": "not_asked" },
    "entertainment": { "status": "not_asked" },
    "fullProfileNudge": { "status": "not_asked" }
  }
}
```

Prompt status values:
- `"not_asked"` — hasn't triggered yet
- `"shown"` — shown but user tapped "Not now" (will retrigger)
- `"completed"` — user set up this deduction
- `"declined"` — user tapped "Never" (won't show again)
- `"not_applicable"` — user said "No" in setup (e.g., no RA)

Track `shownCount` and `lastShownDate` for "Not now" retrigger logic:
```json
{
  "homeOffice": { 
    "status": "shown", 
    "shownCount": 1, 
    "lastShownDate": "2026-03-05",
    "relevantExpensesSince": 3
  }
}
```

Retrigger "Not now" prompts after 5 more relevant expenses (tracked in `relevantExpensesSince`).

---

## INTERACTION WITH EXISTING FEATURES

### Dashboard
- Quick Start users see the profile completeness bar
- Tax summary card shows estimate with caveat: "Based on income only — set up deductions for a better estimate" (if profile incomplete)
- Nudges include profile-building prompts alongside existing nudges

### Tax Calculator
- Works immediately with income-only calculation
- Missing deductions shown as greyed-out rows: "Home office: Not set up [Set up →]"
- Banner at top if profile incomplete: "Your tax estimate could be more accurate. [Complete your profile]"

### Tax Summary
- Shows deductions the user HAS set up
- Lists potential deductions they HAVEN'T: "You might also be able to claim: Home office, Vehicle expenses, Phone costs [Explore →]"

### Log Expense
- Works identically for both Door 1 and Door 2 users
- Smart responses still show tax savings (using whatever marginal rate is calculated from their income, even without deductions)
- Contextual prompts appear AFTER save, not during

### PDF Report
- If profile incomplete, report includes a note: "Tax profile partially complete. Some deductions may not be reflected. Consider completing your profile for a more accurate report."
- Still generates — a partial report is better than no report

### Full Onboarding (Door 1)
- Completely unchanged
- If a Quick Start user later taps "Complete setup" → they enter the full onboarding but fields they've already answered are pre-filled and can be skipped

---

## BUILD INSTRUCTIONS FOR CLAUDE CODE

1. **Update Welcome screen** — add two buttons (guided vs quick start)
2. **Build Quick Setup screen** — name, occupation, income, tax year, one screen
3. **Build contextual prompt component** — reusable card that appears after expense save
4. **Build trigger logic** — check after each expense save whether a prompt should show
5. **Build 6 mini setup flows** — home office, vehicle, phone, RA, medical, donations
6. **Build profile completeness indicator** — calculation + dashboard card
7. **Update Tax Calculator and Tax Summary** — show missing deductions as opportunities
8. **Add prompt tracking to data model** — persist prompt history in localStorage
9. **Update full onboarding** — pre-fill fields that Quick Start users already answered
10. **Test both paths** — full onboarding still works exactly as before, quick start builds profile gradually
