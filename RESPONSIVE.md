# Responsive Design Requirements (Mandatory)

This project is a mobile-first Progressive Web App (PWA).

For every screen, component, feature, and future update, responsiveness is a non-negotiable requirement.

## Core Rules

1. Design and develop mobile-first.

2. Every UI element must adapt gracefully to different screen sizes and aspect ratios.

3. Never use fixed widths, heights, margins, paddings, or positioning unless absolutely necessary.

4. Prefer flexible layouts using:

   * Flexbox
   * CSS Grid
   * Relative units (%, rem, em, vw, vh)
   * Auto-layout principles

5. All screens must work correctly on:

   * Small Android devices (320px–360px width)
   * Standard Android devices (375px–412px width)
   * Large phones (430px+ width)
   * Tablets
   * Desktop browsers

6. No content should:

   * Overflow horizontally
   * Be clipped
   * Be hidden behind other elements
   * Require zooming
   * Break layout alignment

7. Text must scale appropriately:

   * Avoid fixed font sizes where possible
   * Maintain readability on small screens
   * Prevent text truncation

8. Images, avatars, illustrations, cards, and charts must:

   * Scale proportionally
   * Remain fully visible
   * Maintain aspect ratio

9. Bottom navigation, headers, floating buttons, modals, sheets, and dialogs must remain usable on all screen sizes.

10. Respect device safe areas:

    * iPhone notch
    * Dynamic Island
    * Android gesture navigation
    * Bottom home indicators

## Testing Requirements

Before marking any feature complete, test at:

* 320px
* 360px
* 375px
* 390px
* 414px
* 430px
* Tablet width
* Desktop width

Any visual issue found at any breakpoint must be fixed before completion.

## Future Updates

For every future feature, bug fix, redesign, or component update:

* Responsiveness must be evaluated first.
* Existing responsive behavior must never regress.
* New code must not introduce layout shifts or overflow.
* Any UI change must be tested across multiple viewport sizes.

## Bottom navigation & floating elements (standard)

The fixed `BottomNav` is the single source of truth for how much space it takes.
It measures its own real height (icon + label + padding + safe-area inset) and
publishes it live on `<html>` as the CSS variable **`--bottom-nav-h`** (set to
`0px` whenever the bar is hidden or the keyboard is up). `app/globals.css` also
defines a safe-area-aware fallback so the value resolves before hydration.

Rules — never hard-code a pixel offset for the bar:

* Any element that floats above the bar (CTA bars, toasts, FABs) positions with
  `bottom: calc(var(--bottom-nav-h) + <gap>)` — or the `.cta-bottom` utility.
* Any scroll area whose content passes under the bar clears it with `.pb-nav`
  (`padding-bottom: calc(var(--bottom-nav-h) + 1rem)`) — not a fixed `pb-*`.
* The bar itself must stay visible and centred at every width (`fixed bottom-0`,
  `max-w` = shell), carry `env(safe-area-inset-bottom)` padding, keep tap targets
  ≥ 48px (`min-h-[52px]`), and scale/clamp labels so all tabs fit at 320px.
* On very small phones (≤ 374px) headings clamp via the `h1/h2` rules; keep long
  values on `truncate` so they never push the layout wider than the viewport.

This guarantees the app bar is always visible and everything stays interactable
from 320px up to large phones, regardless of system font scale or notch.

Extra rules learned from small-phone testing:

* `.cta-bottom` also covers screens where the bar is hidden (full-screen flows):
  it falls back to the home-indicator inset, so a floating button never touches
  the screen edge. Use `.pb-nav-fab` when a floating button sits over scrolling content.
* The bar hides while a text field is focused (on-screen keyboard) and returns on
  blur; `--bottom-nav-h` drops to `0px` at the same time, so bars and buttons that
  follow it move with it.
* Keep 48px tap targets on small phones by **reflowing**, not shrinking: put a
  stepper on its own row, let chips wrap, or drop a label. Never go below 48px.
* Headers use `min-w-0` + `truncate` or `clamp()` font sizes, never a fixed
  `max-w-[190px]` on the name. Restaurant/bar tab screens share `components/home/AppHeader.tsx`.
* Check these viewports before shipping, including **short** ones: 320×568,
  360×640, 375×667, 390×844, 430×932, 768×1024, desktop. For each screen (and each
  open drawer/sheet) confirm: no horizontal scroll, the bar is fully on screen with
  every label visible, nothing floats over the bar, no content ends underneath it,
  and every button/link is at least 48×48.

## Definition of Done

A task is NOT complete unless:

✓ Works on Android and iPhone sizes

✓ No horizontal scrolling

✓ No overlapping elements

✓ No clipped content

✓ No broken layouts

✓ Consistent spacing and alignment

✓ Responsive across all supported viewports

Responsiveness is a permanent project requirement and must be considered for every implementation without exception.
