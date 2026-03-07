# Tax Tjommie v3 — Design Identity Document

## Brand Personality
- **Friendly expert** — approachable like a mate ("tjommie"), knowledgeable like an accountant
- **Calm confidence** — dark, premium feel that says "your finances are under control"
- **South African soul** — warm earth tones inspired by the Karoo at dusk

## Design Language: "Midnight Karoo"
A dark, layered interface with warm coral accents that evoke sunset over the South African landscape. Every surface has subtle depth. Nothing screams — everything breathes.

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0B1120` | Deepest background — true dark |
| `--bg2` | `#111827` | Secondary background |
| `--surface` | `#1A2332` | Card surfaces |
| `--surface-elevated` | `#1F2937` | Elevated cards, modals |
| `--coral` | `#E8734A` | Primary accent — warm, confident |
| `--coral-light` | `#F09070` | Hover states, highlights |
| `--coral-dark` | `#C45A32` | Active/pressed states |
| `--text` | `#F1EDE8` | Primary text — warm white |
| `--text2` | `rgba(255,255,255,.58)` | Secondary text |
| `--text3` | `rgba(255,255,255,.32)` | Tertiary/muted text |
| `--border` | `rgba(255,255,255,.07)` | Subtle dividers |
| `--success` | `#34D399` | Positive states |
| `--warning` | `#FBBF24` | Caution states |
| `--danger` | `#F87171` | Error/destructive states |

## Typography
- **Font**: Outfit (400, 500, 600, 700, 800)
- **Scale**: 2.25rem / 1.5rem / 1.25rem / 1.125rem / 1rem / 0.875rem / 0.8125rem / 0.75rem
- **Letter-spacing**: Tighter for headings (-0.03em), normal for body
- **Line-height**: 1.1 for display, 1.25 for headings, 1.6 for body

## Spacing System
- Base unit: 4px
- Content padding: 20px horizontal, 24px top
- Card padding: 20px
- Card gap: 14px
- Section gap: 32px
- Component internal gap: 12px

## Depth System
- Cards float above the background with subtle border-top highlights
- Glass-morphism on navigation bar
- Coral glow on primary CTAs
- Inset shadows on input fields
- No harsh drop shadows — use layered, soft shadows

## Component Signatures
- **Cards**: 18px radius, 1px border, subtle gradient overlay, layered shadow
- **Buttons**: 14px radius for primary, pill shape for chips/tags
- **Inputs**: Recessed (inset shadow), 12px radius, 1.5px border
- **Bottom Nav**: Glass blur with 1px top border, floating log button with glow pulse
- **Progress indicators**: Gradient fills with glow
- **Tags/badges**: Pill shape, translucent backgrounds

## Motion
- Screen transitions: 300ms ease (fade + translate)
- Card stagger: 50ms delay increments
- Button press: scale(0.97) with 150ms
- Hover lifts: translateY(-2px) with shadow increase
- Glow pulse on FAB: 3s infinite ease-in-out
- Respect prefers-reduced-motion

## Accessibility
- All interactive elements: min 44x44px touch target
- Focus-visible: 2px coral outline with 2px offset
- Color contrast: WCAG AA minimum
- Semantic HTML with ARIA labels
- Screen reader announcements for toasts
