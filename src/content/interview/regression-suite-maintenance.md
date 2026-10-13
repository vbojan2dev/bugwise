---
question: How do you keep a regression test suite useful over time?
short: Review it regularly, remove or update outdated tests, add tests for new features and escaped bugs, tag tests by priority and area, and run a risk-based subset when time is short.
category: agile
level: mid
lookingFor: Awareness that suites grow stale and bloated, concrete maintenance habits, and the use of prioritization and tagging to run the right subset.
pitfalls:
  - Only ever adding tests and never removing any.
  - Running the full suite every time regardless of what changed.
  - Not adding a test after a bug escaped to production.
order: 4
---

A regression suite slowly becomes outdated: features change, screens are redesigned, and old tests describe things that no longer exist. A messy suite wastes time and gets ignored.

**Habits that keep it healthy**

- **Update as you go:** when a story changes behavior, update the related test cases in the same sprint.
- **Add tests for escaped bugs:** every production bug gets a regression test so it can't come back unnoticed.
- **Remove or merge** obsolete and duplicate tests. Fewer good tests beat many confusing ones.
- **Tag tests** by area (checkout, profile), priority (P1-P3) and platform (iOS, Android, web).
- **Review regularly**, for example once a quarter, together with developers or the product owner.
- **Move stable, repetitive tests to automation** and note it, so they aren't also run by hand.

**Choosing what to run**

- **Smoke subset** on every build.
- **Risk-based subset** for a normal release: P1 tests plus the areas touched by changes.
- **Full regression** before major releases or big refactors.

**Example:** after a redesign of the profile area, I archived 14 outdated cases, rewrote 6, and added 3 for new edge cases. The profile run went from 2 hours to 50 minutes and became more accurate.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
