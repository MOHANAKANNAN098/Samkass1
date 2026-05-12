# KaasFlow Design System – Pro Edition

**Tone:** Premium fintech for emerging markets. Sophisticated dark gold/warm amber palette unifies light and dark modes. Refined cards with measured elevation, zero gratuitous glow. Mobile-first 430px. Persistent bottom navigation.

**Aesthetic:** Anti-generic. Light mode: warm cream (#f7f4ef) canvas with white cards, deep navy text. Dark mode: near-black (#0a0d1a) with 10% lighter cards (#0d1117), warm amber accents (OKLCH 0.68 0.21 60). Every card lifts 2px on hover. Micro-interactions choreographed.

## Color Palette (OKLCH)

**Light Mode**

| Role | Token | L | C | H | Hex | Usage |
|------|-------|---|---|---|-----|-------|
| Background | `--background` | 0.96 | 0.008 | 75 | #f7f4ef | page canvas |
| Card/Surface | `--card` | 1.0 | 0 | 0 | #ffffff | cards, inputs, modals |
| Text Primary | `--foreground` | 0.12 | 0.008 | 260 | #1a1b27 | headings, body |
| Accent | `--accent` | 0.65 | 0.20 | 65 | #d4a347 | buttons, active states, glow |
| Success | `--chart-2` | 0.60 | 0.15 | 155 | #4aa583 | collect badges, positive states |
| Danger | `--destructive` | 0.62 | 0.24 | 25 | #d94949 | missed, overdue, errors |
| Border | `--border` | 0.88 | 0.02 | 70 | #e5e2d9 | card borders, dividers |

**Dark Mode**

| Role | Token | L | C | H | Hex | Usage |
|------|-------|---|---|---|-----|-------|
| Background | `--background` | 0.06 | 0.004 | 260 | #0a0d1a | page canvas |
| Card/Surface | `--card` | 0.10 | 0.004 | 260 | #0d1117 | cards, modals, elevated surfaces |
| Text Primary | `--foreground` | 0.96 | 0 | 0 | #f5f5f5 | headings, body |
| Accent | `--accent` | 0.68 | 0.21 | 60 | #d8a956 | buttons, glow, active indicators |
| Success | `--chart-2` | 0.60 | 0.15 | 155 | #5cb896 | badges, positive states |
| Danger | `--destructive` | 0.62 | 0.24 | 25 | #d94949 | errors, overdue, destructive actions |
| Border | `--border` | 0.15 | 0.005 | 260 | #1a1d2e | subtle separators |

## Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | Space Grotesk | 700/800 | page titles, stat values, hero text (8px letter-spacing) |
| Body | DM Sans | 400/600 | labels, buttons, content (1.5 line-height) |
| Mono | Geist Mono | 500 | loan IDs, receipt numbers, technical values |
| Tamil | Noto Sans Tamil | 400/600 | full UI bilingual support (0.9em font-size override) |

**Scale:** `text-3xl` (28px) page title, `text-lg` (18px) section header, `text-base` (16px) body, `text-sm` (14px) labels.

## Elevation & Depth

| Level | Shadow (Light) | Shadow (Dark) | Use |
|-------|--------|---------|-----|
| Flat | none | none | text, badges, flat backgrounds |
| Card | `0 2px 8px rgba(0,0,0,0.08)` | `0 2px 8px rgba(0,0,0,0.3)` | standard cards, list rows |
| Elevated | `0 4px 12px rgba(0,0,0,0.15)` | `0 4px 12px rgba(0,0,0,0.4)` | modals, sticky headers, bottom nav |
| Hover | `0 8px 16px rgba(0,0,0,0.12)` | `0 8px 16px rgba(0,0,0,0.35)` | card hover state |
| Glow Accent | `0 0 8–16px oklch(--accent/0.15–0.25)` | `0 0 8–16px oklch(--accent/0.25–0.35)` | interactive focus, active buttons |

## Structural Zones

| Zone | BG (Light) | BG (Dark) | Border | Shadow | Use |
|------|-----|-----|--------|--------|-----|
| Header | white | #0d1117 | accent/20 | elevated | sticky top, mode toggle |
| Main | #f7f4ef | #0a0d1a | none | none | page container |
| Card/Row | white | #0d1117 | border/50 | card + hover glow | loans, stats, clients |
| Bottom Nav | white | #0d1117 | t border/50 | elevated | 5 fixed tabs (44px min) |
| Modal | white | #0d1117 | border | elevated | payments, confirmations |
| Muted | #f3f1ea | #0f1419 | none | none | secondary content, alt rows |

## Component Tokens

- **Button Primary:** `bg-accent text-accent-foreground h-11 rounded-[10px]` + hover glow effect
- **Button Secondary:** `bg-muted text-foreground h-11` + opacity-90 on hover
- **Card:** `bg-card border border-border/50 rounded-lg p-4 shadow-card` + lift 2px + glow on hover
- **Input:** `bg-input border border-border rounded-[10px] p-3` + focus ring 2px accent/50
- **Badge:** `bg-accent/15 text-accent` (amber), `bg-chart-2/15 text-chart-2` (green), `bg-destructive/15 text-destructive` (red)
- **Tab (Bottom Nav):** `min-h-[44px] flex-1 flex items-center justify-center gap-1` + active = text-accent

## Animation & Motion

| Animation | Keyframe | Duration | Use |
|-----------|----------|----------|-----|
| fade-in | opacity 0→1 | 0.4s | page/modal entry |
| slide-up | translate(0,8px) opacity 0→1 | 0.4s | card/item entry |
| slide-down | translate(0,-8px) opacity 0→1 | 0.3s | notification/dropdown |
| scale-in | scale(0.95) opacity 0→1 | 0.2s | quick responses |
| pulse-soft | opacity 1→0.7→1 | 2s infinite | notifications, badges |
| shimmer | background-position -200%→200% | 1.5s infinite | skeleton loaders |

**Choreography:** 0.15s transition-fast for button press, 0.3s transition-smooth for color/size changes, staggered 40ms for card lists.

## Dark/Light Mode

- **Toggle:** Header floating button (top-right), moon/sun icon, `class="dark"` on `<html>`
- **Persistence:** localStorage key `kf_theme` (`"light"` | `"dark"`)
- **Default:** Light mode on first launch
- **Transition:** 0.3s smooth on all colors when switching

## Mobile & Accessibility

- **Constraint:** Max-width 430px (safe zone for Indian devices)
- **Touch Targets:** Minimum 48px height (buttons, tabs, list rows)
- **Responsive:** Bottom nav fixed, no horizontal scroll
- **Motion:** `@media (prefers-reduced-motion: reduce)` disables animations
- **Contrast:** AA+ in both light and dark modes

## Signature Details

1. **Warm Accent Glow:** Every interactive element uses gold/amber accent (OKLCH 0.65–0.68 0.20–0.21 60–65). On hover, subtle glow (8–16px spread, 15–35% opacity) without harshness.

2. **Measured Elevation:** Cards use a 3-tier system — base shadow for depth, enhanced on hover, glow on active. No neon or excessive effects.

3. **Pro Typography:** Space Grotesk for bold stats (7–8px tracking), DM Sans for clean UI. Consistent x-height, generous line-height (1.4–1.6).

4. **Micro-interactions:** Smooth theme switch, skeleton shimmer, soft pulse on notifications, 2px lift on card hover. Every state is choreographed, never jarring.

5. **Bilingual Refinement:** Full English/Tamil support. Tamil text uses Noto Sans Tamil family override (0.9em). Settings toggle switches instantly.

## Constraints

- No raw hex colors (#fff, #123) — all colors use OKLCH CSS variables
- No arbitrary Tailwind colors (`bg-[#123]`) — use semantic tokens only
- No default Tailwind shadows — use custom shadow hierarchy from config
- No generic animations — all motion is intentional and choreographed
- Staff vs Admin roles visible via access indicators (icons, disabled buttons, read-only states)
- All data stored in localStorage; Motoko backend for authentication only
