---
question: What basic accessibility checks can you do manually?
short: Use the page with only the keyboard, try a screen reader, zoom to 200%, check color contrast and text alternatives, and make sure forms have labels and clear errors.
category: web
level: junior
lookingFor: A handful of concrete, quick checks a tester can do without special training, plus awareness of WCAG and automated tools as a complement.
pitfalls:
  - Saying accessibility is only about blind users.
  - Relying only on an automated scanner.
  - Not mentioning keyboard navigation.
order: 5
---

Accessibility means people with disabilities can use the product. Many issues can be found in minutes:

1. **Keyboard only:** put the mouse away. Can I reach every link, button and field with Tab, in a logical order? Is the **focus visible**? Can I close a modal with Esc, and am I not trapped?
2. **Screen reader:** VoiceOver (Mac/iPhone), TalkBack (Android) or NVDA (Windows). Do buttons have meaningful names ("Add to cart", not "button")? Do images have alt text?
3. **Zoom and text size:** browser zoom to 200%, large system font on mobile. Nothing should be cut off or overlap.
4. **Color and contrast:** text is readable, and color is not the only signal (an error isn't just a red border, it has a message too).
5. **Forms:** every field has a visible label, errors are announced and explain how to fix them.
6. **Media:** videos have captions, nothing autoplays loudly or flashes.
7. **Touch targets** on mobile are large enough.

Then I run an automated check like **Lighthouse or axe** to catch things like missing labels and low contrast. Automated tools find only part of the problems, so the manual checks stay important. The standard to reference is **WCAG**, usually level AA.

Learn more: [Accessibility Basics (WCAG)](/web/accessibility-basics)
