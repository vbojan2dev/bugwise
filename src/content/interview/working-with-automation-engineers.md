---
question: When does test automation pay off, and how do you as a manual tester work with automation engineers?
short: Automation pays off for stable, frequently run, high-risk checks, especially at the API level. I help choose what to automate first, write clear scenarios to turn into scripts, treat flaky tests as bugs, and make sure automation frees time for exploratory testing instead of replacing it.
category: strategy
level: senior
lookingFor: A cost-benefit view of automation (build plus maintenance vs runs saved), sensible first candidates, a clear position on flaky tests, and a collaborative relationship in which manual testing keeps its value.
pitfalls:
  - Seeing automation as a threat, or as a replacement for all manual testing.
  - Starting with long, fragile end-to-end UI tests.
  - Ignoring flaky tests until nobody trusts the suite.
  - Automating a test case without first questioning whether it's still valuable.
order: 8
---

Automation is an **investment**: it pays off when the time saved by running a check many times is larger than the cost of building it and keeping it working.

**What I'd automate first**

1. **A small smoke suite** of the critical paths (login, search, checkout), run on every build.
2. **API checks** for business rules: they're faster and far more stable than UI tests.
3. **Data-heavy, repetitive checks:** many locales, price combinations, validation rules.
4. **Regression for escaped bugs** that would be expensive to see again.

New features that change every sprint, visual and usability judgment, and one-off checks stay manual.

**How I work with automation engineers**

- **I bring the "what" and "why":** prioritized scenarios with clear steps, data and expected results, plus the risk behind each one.
- **They bring the "how":** the right level (unit, API, UI), framework design, stable selectors. I ask developers to add accessibility labels or test IDs where needed.
- **We review together** which manual cases can be retired once automated, so nothing is run twice.
- **I review failures** with them: is it a product bug, a test bug or an environment issue?

**Flaky tests**

A flaky test is a test that passes and fails without any change in the code. It's worse than no test, because people learn to ignore red builds. Our rule was: quarantine it right away, open a ticket, and fix or delete it within the sprint. Sometimes the "flakiness" is a real race condition in the app, so I investigate before we blame the test.

**Keeping exploratory testing**

The best outcome of automation is that I spend **less time on repetitive checks** and **more time exploring** the risky, new and weird parts. I make that explicit in planning, so the saved time doesn't silently disappear.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
