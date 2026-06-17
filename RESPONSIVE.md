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
