---
question: How do you test that a website is responsive?
short: Check the layout at and around each breakpoint, on small and large screens, in both orientations, using DevTools device mode for speed and real phones and tablets for confirmation.
category: web
level: junior
lookingFor: Knowing what breakpoints are, what to look for at each size, and that DevTools device mode is not a full replacement for real devices.
pitfalls:
  - Only checking a couple of preset device sizes.
  - Relying 100% on DevTools device mode.
  - Checking only layout and not touch, zoom or content behavior.
order: 2
---

A responsive site adapts its layout to the screen size. Designs usually define **breakpoints** (for example 375, 768, 1024, 1440 px).

**How I test**

1. **Slowly resize** the browser from very narrow (320 px) to very wide (1920 px+), watching for anything that breaks between breakpoints, not just at them.
2. Use **DevTools device mode** to check common phones and tablets in portrait and landscape.
3. Confirm on **real devices**, because real browsers have toolbars, notches, touch and on-screen keyboards that device mode doesn't fully simulate.

**What I look for**

- No horizontal scrolling, nothing cut off or overlapping.
- Navigation collapses into a working menu on small screens.
- Text is readable, images scale and don't stretch.
- Tables and long words (URLs, emails) don't break the layout.
- Touch targets are big enough to tap.
- Modals and forms fit the screen and stay usable when the keyboard opens.
- Browser zoom to 200% still works (also an accessibility check).
- Long translated text (German) still fits.

**Example bug:** at 800 px, between the tablet and desktop breakpoints, the menu items wrap onto two lines and cover the page title.

Learn more: [Responsive Design Testing](/web/responsive-design-testing)
