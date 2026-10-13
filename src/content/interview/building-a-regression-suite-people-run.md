---
question: How do you build a regression suite that people actually run, instead of one that's ignored?
short: Keep it small, prioritized and tied to real risk. Build it from critical flows and escaped bugs, write short checks that anyone can follow, tag tests so the team can pick a subset that fits the time available, automate the stable core, and prune it regularly.
category: leadership
level: senior
lookingFor: Understanding why suites get ignored (too big, outdated, unclear), design choices that make a suite usable, subsets matched to time and change, shared ownership, and continuous pruning.
pitfalls:
  - Converting every test case ever written into the regression suite.
  - Writing steps so detailed that nobody wants to read them, or so vague that nobody can follow them.
  - Having only one "full regression" option that takes days.
  - Owning the suite alone, so it dies when you're on vacation.
order: 5
---

Regression suites usually die for the same reasons: they're **too long**, **out of date**, and **nobody knows which parts matter**. So I design against those problems from the start.

**1. Build it from risk, not from history**

- Critical user journeys first: sign up, login, search, checkout, the app's main job.
- Tests for **escaped bugs** and areas with a history of breaking.
- Business rules where a failure costs money or trust.

Not every test case from every story belongs here.

**2. Make tests easy to run**

- **Short checks** with a clear expected result, more like a good checklist than a 20-step script.
- **Test data ready to use:** accounts, cards, coupons listed in the suite.
- **Tags:** area, priority (P1-P3), platform, and "automated" where applicable.

**3. Offer subsets that fit real time**

| Suite | Time | When |
| --- | --- | --- |
| Smoke | ~15-30 min | Every build |
| Risk-based | A few hours | Normal release: P1 plus areas touched by changes |
| Full | 1-2 days | Major releases, big refactors |

The numbers are an example; what matters is that the team has an option that fits the time they really have.

**4. Share ownership**

Developers and other testers can run it, and anyone can propose changes. I review it with the team every quarter.

**5. Automate the stable core,** then remove those cases from the manual run so nothing is done twice.

**6. Prune constantly.** When a feature changes, its tests change in the same sprint. Tests that never find anything and cover low-risk areas get merged or removed.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
