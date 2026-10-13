---
question: How would you test a segmented control or a dropdown?
short: Check default selection, that options are mutually exclusive, that selection updates the content, that state persists, and cover long labels, accessibility, rotation and platform differences.
category: practical
level: junior
lookingFor: Knowledge of what the component is for and typical failure points (selection state, persistence, content sync, truncation, accessibility), organized clearly.
pitfalls:
  - Only checking that tapping an option highlights it.
  - Forgetting state after navigation, rotation or backgrounding.
  - Ignoring accessibility (screen reader announcements of selected state).
order: 3
---

A **segmented control** (like "Day | Week | Month" in a fitness app) and a **dropdown** (like a "Country" selector) both let the user choose **one option from several**. I would check:

**Selection behavior**

- The correct option is selected by default.
- Exactly **one** option is selected at a time (options are mutually exclusive).
- Tapping an option updates the content below (chart, list, price) correctly, and quickly.
- Tapping the already selected option does nothing strange.
- Fast repeated taps do not show data from the wrong option.

**State persistence**

- The selection is kept after going to another screen and back, rotating the device, backgrounding the app and, if required, restarting it.

**Content and layout**

- Long labels and translations (German!) are not cut off.
- Large text sizes, small screens and dark mode.
- Dropdown: long lists scroll, search works if present, the list closes when tapping outside, and the chosen value shows in the field.
- Disabled options cannot be selected.

**Accessibility**

- Screen reader announces the label, role and "selected" state.
- Touch targets are big enough; keyboard navigation works on web (arrow keys, Enter, Esc for dropdowns).

**Platform**

- Native iOS/Android look and behavior, and on web, all supported browsers.

Learn more: [Segmented Control](/components/segmented-control)
