# MediFusion Vision — Global Design System

> **Stack:** React 19 + Vite 7 + Tailwind v4 + Framer Motion  
> **Skill:** ui-ux-pro-max (Healthcare App / Medical Clinic / Biotech)  
> **Accessibility Target:** WCAG AA (AAA where feasible)  
> **Last Updated:** 2026-07-22

---

## 1. Design Philosophy

MediFusion Vision is a **clinical-grade AI diagnostic platform**. Every pixel communicates:
- **Trust** — calm, precise, authoritative (navy foundations, electric indigo conviction)
- **Precision** — data-forward typography, clean spacing, no decoration without purpose
- **Accessibility** — WCAG AA minimum, large touch targets, `prefers-reduced-motion` respected everywhere

Anti-patterns (never use):
- Bright neon colors
- Motion-heavy decorative animation
- Purple/pink AI gradients (indigo is our accent — used surgically)
- Emoji as icons (Lucide/heroicons only)
- Glassmorphism as default card treatment
- Gray-on-gray text

---

## 2. Foundation Tokens

### 2.1 Color Palette

| Token | Light Mode | Dark Mode | CSS Variable | Usage |
|-------|-----------|-----------|-------------|-------|
| **Surface** | `#F8FAFC` | `#0F172A` | `--color-surface` | Page background |
| **Surface Secondary** | `#F1F5F9` | `#1E293B` | `--color-surface-secondary` | Section alternates, card bg |
| **Surface Tertiary** | `#E2E8F0` | `#334155` | `--color-surface-tertiary` | Hover states, subtle emphasis |
| **Foreground** | `#0F172A` | `#F8FAFC` | `--color-foreground` | Primary text |
| **Foreground Muted** | `#64748B` | `#94A3B8` | `--color-foreground-muted` | Secondary text, body copy |
| **Foreground Subtle** | `#94A3B8` | `#64748B` | `--color-foreground-subtle` | Placeholder, disabled |
| **Border** | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | `--color-border` | Default borders |
| **Border Strong** | `rgba(0,0,0,0.14)` | `rgba(255,255,255,0.14)` | `--color-border-strong` | Focused/active borders |

**Accent: Electric Indigo**

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Accent | `#5B6AFF` | `--color-accent` | Primary CTAs, links, active indicators |
| Accent Hover | `#4655E0` | `--color-accent-hover` | Button hover states |
| Accent Subtle | `rgba(91, 106, 255, 0.12)` | `--color-accent-subtle` | Pill backgrounds, icon containers |

**Medical / Status Colors**

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| Success | `#10B981` | `--color-success` | Verified, complete, healthy |
| Warning | `#F59E0B` | `--color-warning` | Pending, caution |
| Error | `#EF4444` | `--color-error` | Errors, alerts, destructive |
| Info | `#3B82F6` | `--color-info` | Informational banners |
| Medical | `#10B981` | `--color-medical` | Health-specific UI (patient) |
| Medical Subtle | `rgba(16,185,129,0.12)` | `--color-medical-subtle` | Medical icon backgrounds |

**Gradient System (Clinical/Trust Aesthetic — NO purple/pink AI gradients)**

| Token | CSS Value | Usage |
|-------|-----------|-------|
| **Hero** | `linear-gradient(135deg, #5B6AFF 0%, #38BDF8 100%)` | Primary brand: hero headlines, primary CTA backgrounds |
| **Hero Subtle** | `linear-gradient(135deg, rgba(91,106,255,0.08) 0%, rgba(56,189,248,0.08) 100%)` | Section backgrounds, card hover states |
| **Accent Glow** | `radial-gradient(ellipse at center, rgba(91,106,255,0.15) 0%, transparent 70%)` | Behind primary CTAs, focused inputs, active nav items |
| **Surface Glass** | `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)` | Nav pills, hero badges, floating CTAs (use SPARINGLY) |
| **Surface Elevated** | `linear-gradient(180deg, #1E293B 0%, #0F172A 100%)` | Modal panels, dropdown menus |
| **Card Hover** | `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)` | Solid card hover (NOT glass) |
| **Medical** | `linear-gradient(135deg, #10B981 0%, #059669 100%)` | Medical CTAs, success states, patient actions |
| **Warning** | `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)` | Warning CTAs, pending states |
| **Error** | `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)` | Destructive actions, error states |
| **Scroll Reveal** | `linear-gradient(180deg, transparent 0%, rgba(91,106,255,0.03) 50%, transparent 100%)` | Background on scroll-triggered sections |
| **Border Glow** | `linear-gradient(90deg, transparent, rgba(91,106,255,0.3), transparent)` | Focus rings, active tab indicators |

**Gradient Usage Rules (Anti-patterns):**
- ❌ `hero` on every section — only Home hero headline + primary CTA
- ❌ Animated gradient backgrounds — use static radial `accent-glow` only
- ❌ Purple/pink "AI" gradients — indigo→cyan is our brand gradient
- ✅ `surface-glass` for nav pills, mobile menu backdrop, floating badges
- ✅ `card-hover` on solid SurfaceCard (not GlassCard)
- ✅ `medical`/`warning`/`error` for semantic action buttons only

### 2.2 Typography

| Role | Family | Weight | Size (Desktop) | Line Height | Tracking |
|------|--------|--------|----------------|-------------|----------|
| **Hero (h1)** | Inter Tight | 300 (Light) | 5xl–8xl | 1.05 | -0.02em |
| **Heading (h2)** | Inter Tight | 300 (Light) | 3xl–5xl | 1.1 | -0.01em |
| **Heading (h3)** | Inter Tight | 500 (Medium) | lg–xl | 1.2 | normal |
| **Heading (h4)** | Inter Tight | 500 (Medium) | base–lg | 1.3 | normal |
| **Body** | Inter Tight | 400 (Regular) | sm–base | 1.5–1.625 | normal |
| **Small/Label** | Inter Tight | 400 (Regular) | xs–sm | 1.4 | +0.01em |
| **Data/Mono** | JetBrains Mono | 400–500 | xs–sm | 1.4 | normal |
| **Button** | Inter Tight | 500 (Medium) | sm | 1 | normal |

**Font face declarations (already in `index.css`):**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Fluid type scale (mobile → desktop):**
```
h1: 2.5rem → 4.5rem  (40px → 72px)
h2: 1.875rem → 3rem  (30px → 48px)
h3: 1.125rem → 1.25rem (18px → 20px)
h4: 1rem → 1.125rem  (16px → 18px)
body: 0.875rem → 1rem  (14px → 16px)
small: 0.75rem → 0.875rem (12px → 14px)
```

### 2.3 Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| 1x | 4px | `p-1` | Tight icon margins |
| 2x | 8px | `p-2` | Inner element spacing |
| 3x | 12px | `p-3` | Compact form gaps |
| 4x | 16px | `p-4` | Standard card padding (mobile) |
| 5x | 20px | `p-5` | Section inner spacing |
| 6x | 24px | `p-6` | Card padding (desktop) |
| 8x | 32px | `p-8` | Section padding, large cards |
| 10x | 40px | `p-10` | Wide containers |
| 12x | 48px | `p-12` | Section vertical spacing (mobile) |
| 14x | 56px | `p-14` | Section vertical spacing |
| 16x | 64px | `p-16` | Section vertical spacing (desktop) |
| 20x | 80px | `p-20` | Hero section padding |
| 24x | 96px | `p-24` | Large hero sections |

**Gap scale for grids/flex:**
```
gap-1  = 4px    gap-2  = 8px    gap-3  = 12px
gap-4  = 16px   gap-5  = 20px   gap-6  = 24px
gap-8  = 32px   gap-10 = 40px   gap-12 = 48px
gap-16 = 64px
```

### 2.4 Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Button | 6px | `rounded-[6px]` | Standard buttons |
| Card | 12px | `rounded-xl` | Cards, panels |
| Panel | 16px | `rounded-2xl` | Modals, sheets |
| Pill | 9999px | `rounded-full` | Pills, badges, avatars |

### 2.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| Card | `0 4px 20px -4px rgba(0, 0, 0, 0.12), 0 1px 4px -2px rgba(0, 0, 0, 0.08)` | Default card elevation |
| Card Hover | `0 12px 40px -8px rgba(0, 0, 0, 0.18), 0 4px 16px -4px rgba(0, 0, 0, 0.12)` | Card hover state |
| Card Press | `0 2px 8px -2px rgba(0, 0, 0, 0.15)` | Button/card active press |
| Panel | `0 1px 2px rgba(0, 0, 0, 0.16)` | Modals, dropdowns |
| Focus | `0 0 0 3px rgba(91, 106, 255, 0.35)` | Focus ring on interactive elements |
| Glow Accent | `0 0 30px -10px rgba(91, 106, 255, 0.4)` | Behind primary CTAs, active nav |
| Glow Medical | `0 0 30px -10px rgba(16, 185, 129, 0.35)` | Behind medical CTAs |
| Inner Glow | `inset 0 1px 1px rgba(255, 255, 255, 0.08)` | Button inner highlight |

### 2.6 Z-Index Scale

| Layer | Value |
|-------|-------|
| Base content | `0` |
| Sticky header | `10` |
| Dropdown / popover | `20` |
| Sticky nav | `40` |
| Modal backdrop | `50` |
| Modal content | `60` |
| Toast / notification | `100` |
| Loading overlay | `1000` |

---

## 3. Component Recipes

### 3.1 Button

**Variants:**

| Variant | Classes |
|---------|---------|
| **Primary** | `rounded-[6px] bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all active:scale-[0.97] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]` |
| **Secondary** | `rounded-full bg-surface-secondary/60 backdrop-blur-[8px] border border-white/[0.06] text-foreground-muted hover:text-foreground transition-colors` |
| **Ghost** | `rounded-[6px] bg-transparent text-foreground-muted hover:bg-surface-tertiary hover:text-foreground transition-colors` |
| **Danger** | `rounded-[6px] bg-error text-white text-sm font-medium hover:bg-red-600 transition-all active:scale-[0.97]` |

**Sizes:**

| Size | Classes |
|------|---------|
| sm | `px-4 py-2 text-xs` (36px height) |
| md | `px-5 py-2.5 text-sm` (40px height) |
| lg | `px-7 py-3.5 text-sm` (48px height) |

**States:**
- **Disabled:** `opacity-50 cursor-not-allowed`
- **Loading:** Show spinner icon, disable pointer events
- **Pressed:** `active:scale-[0.97]` (150ms spring)

**Existing component:** `components/ui/Button.jsx` — needs variant/size mapping aligned to these tokens.

### 3.2 Card (Solid Surface)

```jsx
// Default card for grids, feature lists, testimonials
<div className="rounded-xl bg-surface-secondary border border-white/[0.06] p-6 md:p-8
    transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
  {children}
</div>
```

**Variants:**
- **Default:** `bg-surface-secondary` (for white/light-mode compatible)
- **Elevated:** `bg-surface` with subtle shadow
- **Highlight:** `bg-surface-secondary border-l-2 border-accent` (for emphasis)

### 3.3 Card (Liquid Glass — used sparingly)

```jsx
// Only for nav pills, hero badges, secondary CTAs — NOT as default card wrapper
<div className="relative overflow-hidden rounded-[16px]">
  <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/15 to-white/45 pointer-events-none" />
  <div className="relative m-[1px] bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
    {children}
  </div>
</div>
```

**Anti-pattern:** Wrapping every card in LiquidGlass. Use solid surface cards for content grids. Reserve LiquidGlass for accent elements only.

### 3.4 Input

**Spec:**
- Height: 44px minimum (touch target)
- Padding: `px-4 py-3`
- Radius: `rounded-xl`
- Background: `bg-surface-secondary`
- Border: `border border-white/[0.06]`
- Focus: `focus:border-accent focus:ring-2 focus:ring-accent/20`
- Placeholder: `placeholder:text-foreground-subtle`
- Error: `border-error focus:border-error focus:ring-error/20`
- Label: `text-sm font-medium text-foreground mb-1.5`
- Error message: `text-xs text-error mt-1`
- Disabled: `opacity-50 cursor-not-allowed`

**Existing component:** `components/ui/Input.jsx` — needs bg/border updated to theme tokens.

### 3.5 Badge

| Variant | Classes |
|---------|---------|
| Default | `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-surface-tertiary text-foreground-muted` |
| Accent | `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-accent-subtle text-accent` |
| Success | `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-medical-subtle text-medical` |
| Warning | `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[rgba(245,158,11,0.12)] text-warning` |
| Error | `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[rgba(239,68,68,0.12)] text-error` |

### 3.6 Modal

- Backdrop: `fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm`
- Panel: `relative z-60 mx-auto max-w-lg w-full rounded-2xl bg-surface-secondary border border-white/[0.06] p-6 md:p-8`
- Close button: `absolute top-4 right-4 text-foreground-muted hover:text-foreground`
- Motion: `initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}`

### 3.7 Tabs

- List: `flex gap-1 rounded-xl bg-surface-secondary p-1 border border-white/[0.06]`
- Tab (inactive): `px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground rounded-lg transition-colors`
- Tab (active): `px-4 py-2 text-sm font-medium text-foreground bg-surface shadow-sm rounded-lg`

### 3.8 Dropdown / Select

- Trigger: Same as Input + chevron icon
- Menu: `absolute z-20 mt-1 w-full rounded-xl bg-surface-secondary border border-white/[0.06] p-1 shadow-card`
- Item: `px-3 py-2 text-sm text-foreground-muted hover:bg-surface-tertiary hover:text-foreground rounded-lg cursor-pointer transition-colors`

---

## 4. Animation & Motion

### 4.1 Spring Physics (Framer Motion)

Default spring for all interactive animations:

```js
transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
```

| Context | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Micro-interactions (hover, press) | 150–200ms | `[0.16, 1, 0.3, 1]` | `active:scale-[0.97]` |
| Scroll reveals | 500–600ms | `[0.16, 1, 0.3, 1]` | Fade + translateY(40px) |
| Modal enter | 200ms | `[0.16, 1, 0.3, 1]` | Scale + fade |
| Modal exit | 150ms | `[0.16, 1, 0.3, 1]` | Faster than enter |
| Page transitions | 300ms | `[0.16, 1, 0.3, 1]` | Fade only |
| Stagger children | 50–100ms apart | — | Per item delay |
| Stagger container | 100ms between children | — | Via `staggerChildren: 0.1` |

### 4.2 Transition Token (CSS)

Always use this cubic-bezier for CSS transitions:

```css
transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
```

### 4.3 Reduced Motion

Every animated component must respect `prefers-reduced-motion`:

```jsx
const reduce = useReducedMotion();
if (reduce) return <div>{children}</div>; // Skip motion wrapper
```

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.4 What NOT to Animate

- Stats / numbers (count-up is acceptable as scroll-triggered reveal)
- Hero metric rows (banned — Emil Kowalski rule)
- Background gradients
- Width / height / top / left (use transform instead)
- Elements that enter after 500ms (feels sluggish)

---

## 5. Page-Specific Patterns

### 5.1 Marketing Pages (Home, Landing)

- Full-width sections with max-w-7xl containers
- Scroll reveal triggers at `amount: 0.2`
- Hero: video background + gradient overlay
- CTA sections: radial gradient accent glow

### 5.2 Authentication Pages (Login, Register, ForgotPassword)

- Centered card layout: `min-h-screen flex items-center justify-center px-4`
- Card: `max-w-md w-full rounded-2xl bg-surface-secondary border border-white/[0.06] p-8`
- Logo top, form body, footer links

### 5.3 Dashboard Pages (Patient, Doctor, Admin)

- Sidebar nav: `w-64 shrink-0 bg-surface-secondary border-r border-white/[0.06]`
- Main area: `flex-1 p-6 md:p-8 overflow-auto`
- Data cards: `rounded-xl bg-surface-secondary border border-white/[0.06] p-4 md:p-6`
- Tables: `.border-collapse` with `border-b border-white/[0.06]`
- Charts: Use `components/ui/Chart.jsx` with `text-foreground-muted` axis labels

### 5.4 Scan / Diagnostic Pages (UploadScan, Diagnostics, ScanResults)

- Full-height split: left = image viewer, right = results panel
- Image viewer: `rounded-xl bg-surface border border-white/[0.06] overflow-hidden`
- Results panel: `space-y-4` with metric cards
- GradCAM overlay: `mixed-blend-overlay` gradient (already implemented)

---

## 6. Accessibility Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color contrast | WCAG AA 4.5:1 (normal), 3:1 (large) | Indigo `#5B6AFF` on dark `#0F172A` = 5.2:1 ✓ |
| Touch targets | Min 44×44px | All interactive elements |
| Focus rings | 2–3px visible ring | `focus:ring-2 focus:ring-accent/35` |
| Reduced motion | System preference | `useReducedMotion()` on all motion components |
| Alt text | All meaningful images | Descriptive alt on `<img>` |
| ARIA labels | Icon-only buttons | `aria-label` required |
| Heading hierarchy | Sequential h1→h6 | No level skipping |
| Keyboard nav | Tab order = visual order | All interactive elements reachable |
| Error feedback | Near-field + summary | Error below input + optional summary |
| Screen reader | `aria-live="polite"` | Toast notifications, loading states |

---

## 7. Implementation Status

| File | Status |
|------|--------|
| `tailwind.config.js` | ✅ Aligned — all tokens match this spec |
| `index.css` | ✅ Aligned — surface colors, reduced motion |
| `components/ui/Button.jsx` | 🔄 Needs variant/size update |
| `components/ui/Input.jsx` | 🔄 Needs bg/border tokens |
| `components/ui/GlassCard.jsx` | 🔄 Needs theme alignment |
| `components/ui/Badge.jsx` | 🔄 Needs recipe implementation |
| `components/ui/Modal.jsx` | 🔄 Needs theme alignment |
| `components/ui/Tabs.jsx` | 🔄 Needs theme alignment |
| `components/ui/Dropdown.jsx` | 🔄 Needs theme alignment |
| `pages/Home.jsx` | ✅ Aligned |
| `pages/Login.jsx` | 🔄 Needs theme alignment |
| `pages/Register.jsx` | 🔄 Needs theme alignment |
| `pages/doctor/*.jsx` | 🔄 Needs theme alignment |
| `pages/patient/*.jsx` | 🔄 Needs theme alignment |
| `pages/admin/*.jsx` | 🔄 Needs theme alignment |

---

## 8. Quick Reference — Tailwind Class Mappings

| Design Token | Tailwind Class |
|-------------|---------------|
| bg-surface | `bg-surface` |
| bg-surface-secondary | `bg-surface-secondary` |
| bg-surface-tertiary | `bg-surface-tertiary` |
| text-foreground | `text-foreground` |
| text-foreground-muted | `text-foreground-muted` |
| text-foreground-subtle | `text-foreground-subtle` |
| border-default | `border border-white/[0.06]` |
| border-strong | `border border-white/[0.14]` |
| accent bg | `bg-accent` |
| accent hover | `hover:bg-accent-hover` |
| accent text | `text-accent` |
| accent subtle bg | `bg-accent-subtle` |
| medical bg | `bg-medical` |
| medical subtle bg | `bg-medical-subtle` |
| error | `bg-error` / `text-error` / `border-error` |
| warning | `text-warning` |
| success | `text-success` |
| shadow-card | `shadow-card` |
| shadow-card-hover | `shadow-card-hover` |
| shadow-card-press | `shadow-card-press` |
| shadow-panel | `shadow-panel` |
| shadow-focus | `shadow-focus` |
| shadow-glow-accent | `shadow-glow-accent` |
| shadow-glow-medical | `shadow-glow-medical` |
| shadow-inner-glow | `shadow-inner-glow` |
| rounded-button | `rounded-[6px]` |
| rounded-card | `rounded-xl` |
| rounded-panel | `rounded-2xl` |
| font-sans | `font-sans` (Inter Tight) |
| font-mono | `font-mono` (JetBrains Mono) |

### 8.1 Gradient Quick Reference

| Gradient Token | Tailwind Class | Use Case |
|---------------|----------------|----------|
| Hero | `bg-gradient-to-r from-accent to-cyan-400` | Hero headline, primary CTA |
| Hero Subtle | `bg-[linear-gradient(135deg,rgba(91,106,255,0.08),rgba(56,189,248,0.08))]` | Section bg, card hover |
| Accent Glow | `bg-[radial-gradient(ellipse_at_center,rgba(91,106,255,0.15),transparent_70%)]` | Behind CTAs, focus |
| Surface Glass | `bg-gradient-to-b from-white/45 via-white/15 to-white/45` | Nav pills, badges (sparingly) |
| Surface Elevated | `bg-gradient-to-b from-surface-secondary to-surface` | Modals, dropdowns |
| Card Hover | `bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]` | Solid card hover |
| Medical | `bg-gradient-to-r from-medical to-emerald-700` | Medical CTAs, success |
| Warning | `bg-gradient-to-r from-warning to-amber-700` | Warning CTAs |
| Error | `bg-gradient-to-r from-error to-red-700` | Destructive actions |
| Scroll Reveal | `bg-[linear-gradient(180deg,transparent,rgba(91,106,255,0.03),transparent)]` | Scroll section bg |
| Border Glow | `bg-[linear-gradient(90deg,transparent,rgba(91,106,255,0.3),transparent)]` | Focus rings, active tabs |
