# Desktop Dashboards — build handoff

Build the **desktop experience** for both dashboards (perishable = restaurant/bar,
non-perishable = retail) in its own chat, without breaking the mobile app. The
guiding rule: **desktop and mobile share one logic layer; only the layout
differs.** Update mobile and desktop updates itself — unless you deliberately
keep a change mobile-only.

## The sync contract (read first)

There is one app, two layouts. Keep it that way:

1. **Data + business logic live in the shared layer** — API routes, the Zustand
   store, `lib/*` helpers, and the per-dashboard data hooks (see below). Both
   mobile and desktop views read from these. Change the logic here → both
   platforms change together.
2. **Views are thin and layout-only.** A view maps shared data (stat cards,
   insights, recent sales, quick actions, setup steps) into a layout. Mobile
   view = single column + bottom nav. Desktop view = sidebar + multi-column grid.
3. **To opt a change OUT of desktop:** put it in the mobile view component (or
   guard it with a breakpoint / `useIsDesktop()`), not in the shared hook.
4. **Prefer responsive CSS over branching.** Where a screen can simply reflow
   (e.g. `grid-cols-1 lg:grid-cols-3`), do that — it stays in sync for free and
   needs no desktop-specific file. Reserve a separate desktop view for screens
   whose structure genuinely differs (the dashboards, records, ask).

### First step: extract the dashboard logic into hooks

Today `components/home/RetailHome.tsx` and `PerishableHome.tsx` mix data +
layout. Before building desktop, extract each one's data/computation into a hook
that returns plain data, and have the existing mobile component consume it
(no visual change):

- `hooks/useRetailDashboard.ts` → `{ loading, period, setPeriod, stats, insights, recentSales, quickActions, hasItem, hasSale, unread, businessName, greeting }`
- `hooks/usePerishableDashboard.ts` → the perishable equivalent (orders, menu count, busiest hour, etc.)

Then the desktop dashboard views consume the **same** hook and lay it out wide.
Adding a new stat/insight to the hook then appears on both platforms
automatically (both map the same arrays).

## Platform switch

- `hooks/useIsDesktop.ts` — SSR-safe `(min-width: 1024px)` check. Use it to pick
  the shell/layout, not for styling (use `lg:` for that).
- The app shell (`app/layout.tsx` `#app-root`) is currently hard-capped at
  `--shell-max-w` (480px) — the mobile phone frame. On desktop, lift the cap and
  render the **DesktopShell** instead: a full-width app with a fixed sidebar +
  content area. Gate this on the breakpoint so mobile is untouched. The bottom
  `BottomNav` already hides itself; on desktop, render the sidebar nav instead
  and keep `--bottom-nav-h` at 0 there.

## Desktop layout spec

- **Sidebar** (fixed, left): background is the **darker brand primary** for
  low-eye-strain contrast — `#0F172A` (Midnight Navy) or a deep green
  (`#0B3D24`), white/tinted labels, the active item in SPAL Green `#22C55E`.
  Same destinations as the mobile tab bar (business-mode aware): retail = Home /
  Sell / Inventory / Wallet / Profile; perishable = Home / Orders / Menu /
  Ingredients / Profile, plus secondary links (Records, Insights, Ask SPAL) that
  are full-screen routes on mobile.
- **Top bar** (in the content area): greeting + business name on the left,
  search + notifications + avatar (tan `#D9C7B8`) on the right — the same
  `AppHeader` data, laid out wide.
- **Content**: real dashboard grid using the extra room — e.g. stat cards in a
  4-up row, a wider chart, insights + recent sales side by side. Max content
  width ~1200px, centered, generous gutters. Keep cards `rounded-2xl`, the same
  tokens, shadows and colors as mobile.
- Everything still respects `RESPONSIVE.md` from 320px up; desktop is additive
  via `lg:`/`xl:` and the shell swap.

## Conventions (unchanged)

Next 16 App Router · TS · Tailwind v4 (`@theme` in `app/globals.css`, no config
file) · Framer Motion (easeOut, no spring) · Satoshi/Inter Tight · hugeicons-react
only (verify names) · no emoji/em-dashes in UI · **verify with a full `next build`**
(stricter than `tsc --noEmit`) · commit + push to `origin/master` as **MrItrends**
after each change, ending commits with the Co-Authored-By line.

## Do / Don't

- **Do** extract shared logic into hooks first; build desktop views on top.
- **Do** reuse mobile primitives (`InsightsCarousel`, `SetupChecklist`, stat
  cards, record rows) — restyle their container, not their data.
- **Don't** fork business logic into a desktop copy (that breaks sync).
- **Don't** change mobile visuals; desktop is behind the breakpoint.
