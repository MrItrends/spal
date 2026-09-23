# SPAL Mobile stays app-screen-size — no desktop layout in this codebase

**Superseded.** This file used to hand off a plan to build a responsive desktop
dashboard (sidebar + wide grid) inside this same app, behind a `lg:` /
`useIsDesktop()` breakpoint. That was built (see git history around
"desktop dashboards for retail and perishable businesses") and then reverted —
Joshua clarified that **SPAL Mobile and SPAL Desktop are different products**.
This app is the mobile one.

## The rule going forward

- The app shell (`app/layout.tsx` `#app-root`) is **always** capped at
  `--shell-max-w` (480px) — the phone frame, centered on the dark canvas —
  **at every viewport width, including desktop browsers.** Never lift that cap
  behind a breakpoint again.
- `BottomNav` is always the primary navigation; it must never hide itself past
  a breakpoint (no `lg:hidden`).
- Don't add a sidebar, a wide multi-column dashboard grid, or any `components/desktop/*`
  view to this codebase. If a screen looks squeezed at a normal phone width,
  fix that at phone width (see `RESPONSIVE.md`) — don't solve it by growing
  the layout for desktop.
- RESPONSIVE.md's "must work on desktop browsers" requirement is already
  satisfied by the phone-frame shell rendering correctly (no clipping, no
  overflow, no broken layout) at any window size — it does **not** mean the
  app should adopt a desktop-width layout.
- If/when a genuine SPAL Desktop product gets built, it's a separate effort
  (likely a separate codebase or app), not a breakpoint inside this repo.

If you're an agent about to build a "desktop dashboard" here because this file
used to ask for one: stop and check with Joshua first — this note exists
specifically to prevent that from being redone.
