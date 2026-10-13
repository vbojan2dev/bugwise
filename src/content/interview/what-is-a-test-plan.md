---
question: What is a test plan and what does it contain?
short: A test plan describes what will be tested, how, by whom, when, with which environments, and what counts as done.
category: process
level: mid
lookingFor: The main sections of a test plan (scope, approach, environments, schedule, risks, entry/exit criteria) and the understanding that it is a communication tool, often lightweight in agile teams.
pitfalls:
  - Confusing a test plan with a list of test cases.
  - Forgetting to list what is out of scope, or leaving out exit criteria.
  - Describing only a heavy 40-page document and ignoring agile reality.
order: 1
---

A **test plan** is a document that describes the scope, approach, resources and schedule of testing for a specific project or release. Its real purpose is **alignment**: everyone knows what will be tested, what will not, and when testing is "done".

**Typical contents:**

- **Scope:** features in scope and, just as important, **out of scope**.
- **Approach:** types of testing (functional, regression, accessibility...), manual vs automated.
- **Environments and devices:** for example iOS 17-18 on iPhone SE and 15, Android 13-15 on Samsung and Pixel, Chrome/Safari/Firefox for web.
- **Test data and accounts** needed.
- **Roles and responsibilities.**
- **Schedule and milestones.**
- **Risks and mitigations:** "payment sandbox may be unstable, so we will book extra time".
- **Entry criteria:** when testing can start (build deployed, smoke test passed).
- **Exit criteria:** when testing stops (all high-priority tests run, no open critical bugs).
- **Deliverables:** test cases, bug reports, summary report.

In agile teams, a test plan is often a **one-page wiki** per release or epic rather than a large formal document. A test plan is different from a **test strategy**, which describes the company-wide approach, and from **test cases**, which describe individual checks.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
