---
question: How do you approach cross-browser testing?
short: Pick browsers from user analytics and risk, run the full tests on the main browser, then check key flows and known risk areas on the others, using real browsers or a cloud service for the ones you don't have.
category: web
level: junior
lookingFor: A prioritized, data-driven browser list instead of "test everything everywhere", and knowledge of what typically breaks between browsers.
pitfalls:
  - Testing everything only in Chrome.
  - Trying to run every test on every browser and version.
  - Forgetting mobile browsers like Safari on iPhone.
order: 1
---

**1. Decide which browsers matter.** I look at analytics and the supported browser list. A typical list: Chrome, Safari (macOS and iOS), Firefox, Edge, and Samsung Internet if many Android users use it. Usually the latest one or two versions.

**2. Split the work.**

- Run the **full test suite** on the most-used browser.
- On the others, run **key flows** (sign up, login, search, checkout) and the **risky areas**.

**3. Know what usually breaks:**

- Layout differences: flexbox/grid quirks, fonts, scrollbars.
- **Safari** especially: date inputs, autoplay video, cookies blocked by privacy features, `100vh` on iPhone.
- Form controls and autofill look and behave differently.
- Newer JavaScript or CSS features not supported yet.
- File uploads, downloads, copy and paste, print.

**4. Tools.** Real browsers on my machine, real phones for mobile browsers, and a cloud service like BrowserStack or LambdaTest for combinations I don't have.

**5. Report clearly.** Include browser name, version and OS, because "it doesn't work" means nothing without them.

**Example:** a checkout button worked everywhere except Safari on iPhone, where it was hidden under the bottom toolbar.

Learn more: [Cross-browser Testing](/web/cross-browser-testing)
