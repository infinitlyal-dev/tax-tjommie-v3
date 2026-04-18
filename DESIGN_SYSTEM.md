# TAX TJOMMIE v4 — DESIGN SYSTEM

> **Visual source of truth: `01-review-screen.png` at project root.**
> This document codifies that mockup into tokens. When in doubt, open the image.
>
> **Read `REBUILD_SPEC.md` first** for what to build. This doc covers how it looks.

---

## 1 — The feeling

Trustworthy, precise, quiet confidence. A tool that respects your time.

Reference apps: **Revolut (Metal dark mode), Monzo dark mode, N26, Wise dark mode.** Not Stripe. Not Linear. Not any editorial portfolio site. Not Apple Health.

The emotional target: a financial tool that feels like opening a well-designed wallet, not like opening a government portal.

## 2 — Colour system

### 2.1 Backgrounds

```css
--bg-app:            #0A0A0C;    /* screen background — deep near-black, NOT pure #000 */
--bg-surface:        #14161A;    /* cards, sheets, raised surfaces */
--bg-surface-hover:  #1A1D22;    /* interactive surface on hover/press */
--bg-input:          #14161A;    /* input backgrounds match surface */
--bg-pill:           rgba(20,184,166,0.12);   /* teal-tinted status pill bg */
```

### 2.2 Borders

```css
--border-faint:   rgba(255,255,255,0.06);   /* default card borders */
--border-medium:  rgba(255,255,255,0.10);   /* interactive borders */
--border-strong:  rgba(255,255,255,0.14);   /* focused input */
--border-teal:    rgba(20,184,166,0.30);    /* focused/selected teal border */
```

### 2.3 Accent — teal only

```css
--teal:          #14B8A6;    /* PRIMARY accent. Singular. Used sparingly. */
--teal-hover:    #0D9488;    /* press state, hover */
--teal-dim:      rgba(20,184,166,0.12);     /* teal-tinted backgrounds */
--teal-glow:     rgba(20,184,166,0.20);     /* focus rings */
```

**Use teal for:**
- The single primary button per screen (e.g. "Confirm all")
- The hero number on the current-focus card (e.g. R47,230 on Review)
- Small category indicator dots next to categorised transactions
- Checkmarks on success states
- Active nav icon
- Tappable text links ("Review 1 flagged")
- The tax-deductions-found running total
- Progress bars and rings

**Do NOT use teal for:**
- Body text
- Decorative flourishes
- Multiple things on the same screen at the same weight — teal must always have *the* primary role on any view

### 2.4 Semantic colours

```css
--amber:         #F59E0B;    /* "needs review" — ambiguous, not broken */
--amber-dim:     rgba(245,158,11,0.12);
--red:           #EF4444;    /* over budget, errors, destructive */
--red-dim:       rgba(239,68,68,0.12);
--green:         #22C55E;    /* RESERVED: budget-under-target confirmations only */
```

**Critical:** Do not use green as a general accent. It's retired as the app's primary colour. Green appears ONLY for "you saved R X this month" type confirmations and budget-under-limit states. Never on buttons, never on navigation.

### 2.5 Text

```css
--text-primary:    #F5F5F7;                     /* main content */
--text-secondary:  rgba(245,245,247,0.60);      /* subtitles, supporting */
--text-muted:      rgba(245,245,247,0.35);      /* dates, least-important */
--text-disabled:   rgba(245,245,247,0.20);
--text-on-teal:    #0A0A0C;                     /* text on teal button */
```

## 3 — Typography

### 3.1 Font family

**Primary:** a confident modern sans-serif with **tabular figures**. Locked order of preference (use first one available):

1. **General Sans** (free, via Indian Type Foundry / free Fontshare)
2. **Satoshi** (free, via Fontshare)
3. **Söhne** (paid, Klim Type)
4. **Inter Display** (free, Google Fonts — but AVOID standard Inter)

**Do NOT use:**
- Playfair Display, Fraunces, Georgia, Times, or any other serif — no exceptions
- Space Grotesk (Claude's default, AVOID)
- Standard Inter (use Inter Display only, or another option)
- System font stacks — explicit face only

Include via Fontshare CDN or Google Fonts CDN. Self-host in production if licence allows.

### 3.2 Type scale

All sizes in `rem`, with `font-feature-settings: 'tnum' on;` globally so numbers are tabular.

```css
--text-hero:      3rem;      /* 48px — the ONE big number per screen */
--text-display:   2rem;      /* 32px — page titles */
--text-h1:        1.5rem;    /* 24px — section headers */
--text-h2:        1.125rem;  /* 18px — card headers */
--text-body:      0.9375rem; /* 15px — default body */
--text-small:     0.8125rem; /* 13px — secondary */
--text-micro:     0.75rem;   /* 12px — labels, muted timestamps */
```

### 3.3 Weights

```css
--weight-regular: 400;
--weight-medium:  500;
--weight-semibold: 600;  /* for most emphasis */
--weight-bold:    700;   /* headlines only */
```

### 3.4 Letter-spacing

- Hero numbers (`--text-hero`): `-0.02em` (tighter)
- Display titles: `-0.01em`
- Body: `0`
- Small/micro uppercase labels: `0.04em`
- NEVER use wider than `0.08em`

### 3.5 Numerals

All currency amounts use tabular figures — they MUST align vertically when stacked. If the font doesn't support `font-variant-numeric: tabular-nums`, change font.

Currency format: **always** `R 47,230` with space after R and `en-ZA` locale for `toLocaleString()`. No cents on display amounts unless the number is < R100. No `R47230.00` anywhere.

## 4 — Spacing

4px base grid.

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;   /* default padding */
--space-5:  20px;
--space-6:  24px;   /* card internal padding */
--space-8:  32px;   /* between major sections */
--space-10: 40px;
--space-12: 48px;   /* between major page blocks */
```

**Rule:** if something feels cramped, jump up a step. The mockup is deliberately airy. Do not compress to fit more on screen.

## 5 — Layout primitives

### 5.1 Viewport

Primary: **390×844** (iPhone 14 portrait). Design and test here.

Fallbacks: screen should hold up from 360px to 430px width. Desktop views simulate a phone frame with bg around it.

### 5.2 Screen container

```css
padding: 0 16px;  /* horizontal */
padding-top: env(safe-area-inset-top, 12px);
padding-bottom: env(safe-area-inset-bottom, 16px);
```

Bottom nav is **fixed** (takes 71px). Content must have `padding-bottom: 87px` (71 + 16) to avoid obscured content.

### 5.3 Corner radii

```css
--radius-sm:   8px;    /* pills, small chips */
--radius-md:   12px;   /* inputs, small cards */
--radius-lg:   16px;   /* cards — the default */
--radius-xl:   20px;   /* hero cards */
--radius-full: 9999px; /* pills, avatars, progress rings */
```

The mockup establishes 16px as the card default. Do not use 8px for cards (feels cheap) or 24px+ (feels 2020).

### 5.4 Shadows

Dark mode — shadows are minimal. Prefer subtle borders for separation.

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.30);
--shadow-md: 0 4px 16px rgba(0,0,0,0.40);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.50);
```

Use shadows on bottom sheets (to lift from content), floating action affordances, and nothing else by default.

## 6 — Components

### 6.1 Status pill (top of Review screen)

```
[●✓] Categorised 203 of 203 transactions
```

- Background: `--bg-pill` (teal-tinted)
- Text: `--text-primary`
- Checkmark: `--teal`
- Padding: 8px 14px
- Border-radius: `--radius-full`
- Font: `--text-small`, `--weight-medium`
- Icon: 16px circle with check

Used for: positive status callouts at the top of task-complete screens.

### 6.2 Hero card

The screen's one big card holding the marquee number.

```
┌───────────────────────────────────────┐
│                                       │
│  Tax deductions found                 │
│  R47,230                              │  ← teal, --text-hero
│                                       │
│  Cheque statement · 1–14 Mar 2026     │  ← muted
│                                       │
└───────────────────────────────────────┘
```

- Background: `--bg-surface`
- Border: `1px solid --border-faint`
- Padding: `--space-6` (24px)
- Radius: `--radius-xl` (20px)
- Label above number: `--text-small`, `--text-secondary`, uppercase NOT required
- Number: `--text-hero`, `--teal`, `--weight-semibold`, tabular
- Subline: `--text-small`, `--text-muted`

### 6.3 Transaction row

The most-used pattern in the app. Ref mockup rows.

```
  14 MAR
  Woolworths Cape Town              R 847.50
  ● Groceries
```

- Top line (date): `--text-micro`, `--text-muted`, uppercase, `letter-spacing: 0.04em`
- Middle line (merchant): `--text-body`, `--text-primary`, `--weight-medium`
- Bottom line (category): `--text-small`, `--text-secondary` — preceded by a 6px circle dot in `--teal` (or `--amber` for review)
- Right: amount, `--text-body`, `--weight-semibold`, tabular, right-aligned
- Row padding: 14px vertical, 16px horizontal
- Separators: 1px bottom border `--border-faint`, or no separator if contained in a card
- Tap state: background becomes `--bg-surface-hover`

### 6.4 Buttons

**Primary:**
```css
background: var(--teal);
color: var(--text-on-teal);
height: 56px;
border-radius: var(--radius-lg);
font: var(--weight-semibold) var(--text-body);
padding: 0 24px;
border: none;
width: 100% (default);
```

Press state: `background: var(--teal-hover)`.

Only ONE primary button visible per screen.

**Secondary / text link:**
```css
background: transparent;
color: var(--teal);
font: var(--weight-medium) var(--text-body);
padding: 12px 16px;
border: none;
```

Used for "Review 1 flagged" style soft actions.

**Ghost button (rare):**
```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border-medium);
height: 48px;
```

For "Skip" / "Not now" type actions.

**Destructive (Reset all, Delete):**
```css
background: transparent;
color: var(--red);
border: 1px solid rgba(239,68,68,0.30);
```

### 6.5 Inputs

```css
height: 56px;
background: var(--bg-input);
border: 1px solid var(--border-faint);
border-radius: var(--radius-md);
padding: 0 16px;
font: var(--weight-regular) var(--text-body);
color: var(--text-primary);
```

Focus: `border-color: var(--border-teal); box-shadow: 0 0 0 3px var(--teal-glow);`

Label above: `--text-small`, `--text-secondary`, 8px below label to input.

Currency inputs: 'R' prefix is a separate element, NOT inside the input value. Format numeric value with `toLocaleString('en-ZA')` on blur.

### 6.6 Cards

Base card:
```css
background: var(--bg-surface);
border: 1px solid var(--border-faint);
border-radius: var(--radius-lg);
padding: var(--space-5) var(--space-6);
```

Cards should breathe. If a card has 5 content items packed in, increase padding or split into two cards.

### 6.7 Bottom nav

- Fixed to bottom, full width
- Height: 71px + safe-area
- Background: `var(--bg-surface)` with `border-top: 1px solid var(--border-faint)`
- 5 items, equal width
- Icon above label
- Active item: `--teal` for icon and label
- Inactive: `--text-muted` for icon and label
- Centre item (⊕) is visually different: 52px teal circle, raised 12px above the bar, white icon

### 6.8 Bottom sheet

Used for the + menu, category edit, transaction details.

```css
background: var(--bg-surface);
border-radius: 20px 20px 0 0;
padding: 12px 0 32px;
box-shadow: var(--shadow-lg);
```

Handle bar at top: 4px tall, 36px wide, `--border-medium`, centred, 8px from top.

Content below handle bar starts at 28px from top of sheet.

### 6.9 Category dot

6px solid circle, inline with category name, 8px right margin.

Each category gets ONE assigned colour from this palette (mapping is deterministic — same category always same dot):

```
Work/Business → all use --teal
Personal categories → --text-secondary (muted, since they don't affect tax)
Needs review → --amber
```

Don't try to assign a unique colour per category. Keep it simple — teal = "matters for tax," muted = "just spend."

### 6.10 Progress bar

```css
height: 6px;
background: var(--border-faint);
border-radius: var(--radius-full);
overflow: hidden;

.fill {
  height: 100%;
  background: var(--teal);   /* or amber if > 80%, red if > 100% */
  transition: width 300ms ease-out;
}
```

### 6.11 Progress ring (Backpocket goals)

SVG circle:
- Radius 32, stroke-width 6
- Track: `--border-faint`
- Fill: `--teal`
- Percentage text centred, `--text-body`, `--weight-semibold`

## 7 — Motion

### 7.1 Principles

- **Motion earns its place.** Every animation answers a question ("is it loading?", "what just happened?") — nothing decorative.
- **Restrained, not absent.** Count-up on hero numbers: yes. Confetti on save: no.
- **Easing:** default to `ease-out` for enters, `ease-in` for exits.

### 7.2 Standard durations

```css
--motion-fast:    150ms;  /* hover states, press feedback */
--motion-medium:  240ms;  /* element enter/exit */
--motion-slow:    400ms;  /* larger layout shifts */
--motion-hero:    800ms;  /* count-up animations, progress bar fills */
```

### 7.3 Specific moments

- **Count-up on hero number** when Review / Dashboard / Tax Summary loads. Start at 0, animate to final over 800ms with `ease-out`. Format currency on each tick.
- **Progress bars** animate from 0 to value on first render.
- **Transaction list items** fade-and-rise-in staggered by 30ms each when review screen populates.
- **Processing screen** has a continuous subtle pulse on Tjommie's avatar and a scrolling transaction ticker.
- **Tab switching**: instant content swap, no animation. Don't over-animate navigation.

## 8 — Iconography

### 8.1 Style

Line-weight. Single colour. 1.5px–2px stroke. Rounded caps.

Use **Lucide Icons** (MIT-licensed, free). Do not use filled icons, do not use emoji as icons in UI chrome (they're fine in copy), do not mix icon sets.

### 8.2 Sizing

```css
--icon-sm: 16px;   /* inside rows, chips */
--icon-md: 20px;   /* nav, default */
--icon-lg: 24px;   /* primary actions */
--icon-xl: 32px;   /* empty state heroes */
```

### 8.3 Colour

Match text colour of the context. No teal icons *unless* the icon is the primary affordance (like the + button).

## 9 — Tjommie (the character)

Tjommie is **not** a chatbot. He is present as a small illustration at three moments only:

1. **Upload intro** — small avatar next to the welcome copy on Screen 3
2. **Processing screen** — animated presence while AI works (the "he's doing the work" moment)
3. **Review complete** — celebratory appearance when user hits "Confirm all"

Visual direction for Tjommie:
- Minimal line-drawn character
- Single colour (probably `--text-primary` or `--teal` accent)
- NOT a cartoon, NOT a mascot with big eyes, NOT a full-body figure with hands
- Roughly 80-120px tall on the processing screen, 40-48px on inline appearances
- Could be as simple as a stylised "TT" monogram in a circle, if full illustration is out of scope

**Strong preference:** generate or source a simple, modern, character-but-restrained icon. If in doubt, err toward monogram, not cartoon.

Tjommie's voice lives in copy everywhere — empty-state text, helper microcopy — but his face appears only in those three places.

## 10 — What to avoid — quick reference

Any of these = rework:

- ❌ Serif fonts (Playfair, Fraunces, Georgia, Times, any)
- ❌ Cream or warm off-white backgrounds
- ❌ Gold accents
- ❌ Green as a general accent (reserve for budget-confirmation only)
- ❌ Purple-to-pink or blue-to-violet gradients
- ❌ "Friendly corporate blue" (#2563EB, #3B82F6)
- ❌ Italic word-accents
- ❌ Chatbot avatars with big cartoon eyes
- ❌ "Powered by AI" sparkle emoji or badges
- ❌ Neumorphism, glassmorphism effects
- ❌ Skeuomorphic textures
- ❌ Multiple colourful category dots
- ❌ Filled icons, emoji as UI chrome
- ❌ Over-compressed layouts — when in doubt, add padding
- ❌ Drop shadows on every card (use borders + background separation instead)
- ❌ Uppercase labels wider than 0.08em letter-spacing
- ❌ Monospaced fonts anywhere except code-block contexts (there are none in this app)
- ❌ Pure black #000 backgrounds
- ❌ Mixing R and $ anywhere

## 11 — Dark mode only (for now)

The app ships dark-only. Do not build a light mode for this release. Every token above assumes dark surface. If a user's device is light mode, the app still shows dark.

Light mode is a v5 conversation.

## 12 — When overriding these tokens

Don't, unless you have a specific reason. If a screen needs something new, extend the system (add a new token) rather than inventing locally. Keep the number of values low.

The goal is that every screen in the app feels like it came from the same place. The locked mockup is that place.
