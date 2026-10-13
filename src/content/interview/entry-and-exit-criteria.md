---
question: What are entry and exit criteria in testing?
short: Entry criteria are the conditions that must be true before testing starts (for example, a stable build is deployed); exit criteria define when testing is done enough to stop or release (for example, no open critical bugs).
category: process
level: junior
lookingFor: Clear definitions, realistic examples of each, and an understanding that they make "ready to test" and "done" objective rather than a feeling.
pitfalls:
  - Mixing up entry and exit criteria.
  - Saying testing is done when "all bugs are fixed".
  - Giving vague criteria that can't be checked.
order: 5
---

**Entry criteria: can we start testing?**

Examples:

- The build is deployed to the test environment and the **smoke test passes**.
- The user story has acceptance criteria and designs.
- Test data and accounts are ready.
- Release notes list what changed.

Without them, testers waste time on broken builds or guess what to test.

**Exit criteria: can we stop testing and release?**

Examples:

- All planned high-priority test cases were run, with 95%+ passing.
- **No open critical or high-severity bugs**; remaining bugs are reviewed and accepted by the product owner.
- Regression suite run on the agreed devices and browsers.
- Test summary shared.

**Why they matter:** they turn "is it ready?" from a feeling into a checklist everyone agreed on earlier. They also protect the team from pressure: if a critical bug is open, the criteria say we're not done.

Exit criteria never mean "zero bugs"; that's impossible. They mean the **remaining risk is known and accepted**.

In agile teams, entry criteria often look like a **Definition of Ready**, and exit criteria like the **Definition of Done** for a story or a release checklist.

Learn more: [SDLC and STLC](/fundamentals/sdlc-and-stlc)
