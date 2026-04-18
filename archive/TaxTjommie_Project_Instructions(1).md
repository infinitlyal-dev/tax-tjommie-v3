# TaxTjommie — Project Instructions

## Who you're working with

Al — creative professional at The Trojan Horse Creative Collective (THCC) / Infinity Films. Based in Strand, Western Cape. Not a coder. Uses AI to build prototypes and products. Prefers autonomous building — don't stop to ask permission, just build and show the result.

## What Tax Tjommie is

Tax Tjommie is a South African mobile-first web app (R40/month, tax deductible) that combines tax refund tracking with monthly budgeting. Users interact with "Tjommie" — a conversational AI character who discovers tax deductions through natural dialogue and helps track expenses.

The core concept: most South Africans are owed money by SARS but don't know what they can claim. Tjommie walks them through their life — housing, transport, health, career — setting up both a monthly budget AND capturing tax deductions in one conversation. The payoff is the "13th cheque" — an estimated annual tax refund that grows as users log expenses throughout the year.

## Tech stack (prototype phase)

- Single HTML file with React 18 (Babel standalone for JSX)
- localStorage for all data persistence
- No backend — everything runs on-device
- Mobile-first: 390×844px phone frame wrapper
- Fonts: Playfair Display (display/numbers), Plus Jakarta Sans (body)
- Dark theme (#0A0B12 background) with gold (#D4A017) accents
- Deploy to Vercel when builds are complete

## Key reference documents in this project

- **Tax_Tjommie_Product_Spec_v2.1.docx** — The full product bible. Every screen, every data field, every calculation, every piece of Tjommie dialogue, every tax verification flag. When in doubt, check this.
- **COMPLETE_BUILD.md** — Single-session build instructions with all screens, data architecture, tax engine, and components.
- **Phase_0 through Phase_5 .md files** — Phased build prompts broken down for incremental development.
- **README.md** — Build workflow instructions.

## SARS 2025/26 tax tables

```
Brackets:
0 – 237,100:           18%
237,101 – 370,500:     42,678 + 26% above 237,100
370,501 – 512,800:     77,362 + 31% above 370,500
512,801 – 673,000:     121,475 + 36% above 512,800
673,001 – 857,900:     179,147 + 39% above 673,000
857,901 – 1,817,000:   251,258 + 41% above 857,900
1,817,001+:            644,489 + 45% above 1,817,000

Primary rebate: R17,235
Tax threshold: R95,750
Interest exemption: R23,800
RA cap: min(RA×12, 27.5% of income, R350,000)
Medical credits: R364 (main) + R364 (1st dep) + R246 (each additional) × 12
```

## App flow summary

**Onboarding (shown once):**
Splash → Language → Intro → Name → The Hook (live tax calc on a real expense) → How Tax Works → Occupation → Employment Type → 14 Life Categories (budget + tax combined) → Career-Specific Deductions → Personal Situations → Full Reveal (13th cheque estimate) → Reminder Setup → Dashboard

**Daily use (post-onboarding):**
Dashboard, Log Expense (with receipt capture), Budget Tracker (with smart tax-trigger keywords on custom categories), Chat with Tjommie, 13th Cheque Breakdown (with RA what-if slider), Monthly Report, Tax Year Management, Settings

## Data architecture

localStorage key: `ttj_v3`. Structure includes: user profile, income, 14+ budget categories with tax details, career deductions, personal situations, expenses array, logbook, chat history, and settings. Full schema is in the project knowledge files.

## How to work with Al

1. **Build autonomously.** Don't stop to ask "should I continue?" — keep going until it's done.
2. **Make decisions.** If something isn't specified, make a sensible choice and note it.
3. **Show, don't ask.** Build it, deploy it, then discuss what needs changing.
4. **Be direct.** Al prefers straight talk — no fluff, no unnecessary caveats.
5. **South African context matters.** Currency is Rands (R), tax authority is SARS, terms like "medical aid" (not "health insurance"), "bond" (not "mortgage"), "petrol" (not "gas").
6. **Format currency as "R X,XXX"** using toLocaleString('en-ZA').

## Current status

Refer to the conversation for the latest build state. If starting fresh, the full app needs to be built from the spec documents in this project's knowledge base.

## Things NOT yet built (future phases)

- Multilingual support (Afrikaans, Zulu, Xhosa, Sotho translations)
- Real AI chat (connecting to Claude API)
- Backend/cloud storage (moving off localStorage)
- Push notifications
- Receipt OCR
- Export to accountant / SARS eFiling integration
- Payment integration for R40/month subscription
- App store deployment (PWA or native wrapper)

## Tax verification flags

The spec contains 16 items flagged for verification by a tax consultant before going live. These include questions like "is gap cover deductible?" and "what exactly does SARS require in a logbook?" These need professional sign-off before production.
