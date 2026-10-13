---
question: How do you decide which tests to automate?
short: Automate stable, repetitive, high-value checks such as regression of critical flows, smoke tests and data-heavy cases; keep exploratory, usability, one-off and fast-changing tests manual.
category: agile
level: mid
lookingFor: Clear criteria (repetition, stability, risk, cost of maintenance), an understanding that automation has a cost, and that manual testing keeps its place.
pitfalls:
  - Saying "automate everything".
  - Automating unstable features that change every sprint.
  - Ignoring the maintenance cost of automated tests.
order: 3
---

Automation is an investment: it takes time to build and to **maintain**, so it should pay back.

**Good candidates**

- **Regression of critical flows** that must work on every build: login, sign up, search, checkout, payments.
- **Smoke tests** run after each deployment.
- **Repetitive, data-heavy checks:** the same form with 50 data sets, many locales, many API combinations.
- Tests that are **boring or error-prone** for humans, like comparing long price tables.
- **API tests**, which are fast and stable compared with UI tests.

**Keep manual**

- **Exploratory testing** and new features still changing every sprint.
- **Usability, look and feel**, and accessibility judgment with a screen reader.
- **One-off checks** or things that are very hard to automate reliably (real phone calls, some hardware features).

**Questions I ask for each test:** How often will it run? Is the feature stable? How bad is it if this breaks? How expensive is it to automate and keep green? Can it be tested at a lower level (unit or API) instead of the UI?

As a manual tester, I help by marking candidates in the test suite and writing clear, stable test cases that automation engineers can turn into scripts.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
