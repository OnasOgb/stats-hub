# Dark Mode Only with No Light Theme

**ID:** ADR-0005
**Status:** Accepted
**Date:** 2025-05-19

## Context

StatsHub is a mobile-first football stat tracker used primarily during or after evening/indoor football sessions. Most modern sports and social apps offer a dark mode, and many users prefer it as their default. Supporting both light and dark themes doubles the CSS surface area — every color token needs two values, every component needs testing in both themes, and edge cases (inconsistent contrast, flash-of-wrong-theme on load) add complexity.

The project is solo-maintained. Every hour spent on theme management is an hour not spent on features.

## Decision

We ship dark mode only. There is no light theme, no theme toggle, and no `prefers-color-scheme` media query. All color tokens are defined once in `:root` in `app/globals.css` using OKLCH values:

```css
:root {
  --background: oklch(0.13 0.02 260);
  --foreground: oklch(0.95 0.01 260);
  --primary: oklch(0.62 0.19 145);
  /* ... all tokens defined for dark mode only */
}
```

Tailwind is configured with `darkMode: "class"` in `tailwind.config.ts`, but the `dark` class is never toggled — it's effectively a no-op. All color references use CSS custom properties (`var(--background)`, etc.) mapped through Tailwind's `theme.extend.colors`.

There is no `.dark` / `.light` class, no `next-themes` provider, no localStorage theme persistence.

## Consequences

### Positive
- **Half the CSS tokens** — one set of color values instead of two
- **No theme flash (FOUC)** — no risk of showing the wrong theme before JavaScript hydrates
- **No testing matrix** — every screenshot, every component, is dark mode. No "forgot to check in light mode" bugs.
- **No theme provider overhead** — no `next-themes`, no `ThemeProvider`, no `useTheme()` hook
- **Consistent brand identity** — the app looks the same for every user

### Negative
- **Accessibility concern** — some users prefer or need light mode (e.g., outdoor use in bright sunlight, certain visual impairments). There is no accommodation.
- **`darkMode: "class"` is misleading** — Tailwind is configured for class-based dark mode but the class is never applied, which could confuse a contributor reading the config.
- **Adding light mode later is expensive** — every color token, every component's visual design, and the entire Tailwind config would need updating.

## Alternatives Considered

### System-Preference Dark Mode (`prefers-color-scheme`)
- **Pros:** Respects user OS settings; no toggle needed; two themes for the cost of a media query
- **Cons:** Still requires defining two complete sets of color tokens; flash-of-wrong-theme on SSR if the server doesn't know the preference; testing matrix doubles
- **Rejected because:** Doubles the CSS maintenance burden for a solo project. The primary audience uses dark mode by default (mobile users, evening usage context).

### Toggle-Based Theme (next-themes)
- **Pros:** User choice; `next-themes` handles SSR flash prevention; familiar pattern
- **Cons:** Adds `next-themes` dependency; requires `ThemeProvider` in root layout; doubles CSS tokens; requires testing in both themes; localStorage adds complexity
- **Rejected because:** The feature/maintenance trade-off is not justified for a solo-maintained app with a consistent dark aesthetic

### Light Mode Only
- **Pros:** Same simplicity benefits as dark-only
- **Cons:** Light themes cause more eye strain in low-light environments (the primary usage context); looks dated for a sports app; goes against the grain of modern mobile app design
- **Rejected because:** The usage context (evening sports, mobile) strongly favors dark mode

## Assumptions

- The target audience (football club members, mobile-first, evening usage) prefers dark mode or is neutral. If user research shows a strong demand for light mode, this decision should be revisited.
- OKLCH color values provide sufficient contrast for readability. The chosen values have not been audited against WCAG AA/AAA contrast ratios — this is a known gap.
- No downstream tooling (shadcn/ui components, Radix UI) requires a light mode to function correctly. Currently, all shadcn components use the CSS custom properties without theme-conditional logic.

## Scope

- **Applies to:** All visual styling — `app/globals.css` (color tokens), `tailwind.config.ts` (theme mapping), and every component that uses color
- **Does not apply to:** Component logic, data fetching, or API interactions — this is purely a visual/CSS decision

## Security Implications

No security implications. Theme choice does not affect authentication, authorization, or data handling.

## Cost Implications

- **Upfront:** Defining one set of OKLCH color tokens in `globals.css`. Minimal.
- **Ongoing:** Zero ongoing cost. No theme provider to maintain, no dual-token CSS, no theme-related bug reports to triage. However, if light mode is requested later, the migration cost is proportional to the number of components (currently ~30+).

## Success Metrics / Validation Criteria

- The app renders with a dark background and light text across all pages and components
- No flash-of-unstyled-content or theme flicker on page load
- No `prefers-color-scheme` media queries exist in the CSS
- Reassess if: user feedback explicitly requests light mode, accessibility audit identifies contrast issues that are easier to fix with a light theme, or the project gains multiple contributors who want theme support

---
**Related ADRs:** (standalone)
