---
question: How do you estimate testing effort?
short: I break the work into tasks (understanding, test design, setup and data, execution per device, bug reporting, retest and regression, reporting, a buffer for blockers), give each a best, likely and worst number, and give the total as a range with my assumptions. I cross-check against similar past features and re-estimate when things change.
category: process
level: mid
lookingFor: A structured approach rather than a gut number, awareness of the tasks people forget (retest, regression, devices, test data, waiting), giving a range with assumptions, and the habit of re-estimating and learning from actuals.
pitfalls:
  - Estimating only the time to run the test cases.
  - Giving one precise number with no range or assumptions.
  - Quoting a "standard" test-to-dev ratio as if it were a rule.
  - Treating the estimate as fixed after it's given.
order: 12
---

I combine a **work breakdown** with **three-point estimates**, then sanity-check the result.

**1. List the tasks.** For a feature, that's more than running tests:

- understanding the story and asking questions;
- test design: scenarios, cases, charters, the regression set;
- environment and test data setup;
- execution on each device or browser we test on;
- bug reports and follow-up;
- retesting fixes and regression around them, usually in more than one round;
- status updates and the summary;
- a visible buffer for late builds and blockers.

**2. Three numbers per task.** Optimistic, most likely and pessimistic. The PERT formula **(O + 4M + P) / 6** gives an expected value; the sums of O and P give a range.

**3. Cross-check.** How long did something similar take last time? Some teams also compare with the dev estimate using their own historical ratio, but only as a check: a small change to payments can need far more testing than a big text change.

**4. Say it with assumptions.** *"About five days, three to eight, assuming the build is on staging Monday and we test on four phones."* Rounded, with a range, never "28.17 hours".

**5. Re-estimate** as soon as scope or an assumption changes, and compare estimate with actual afterwards so the next one is better.

In scrum teams the whole team often estimates stories in story points with planning poker. There, my job is to make the testing part visible: devices, data, payment sandboxes, risky integrations.

Learn more: [Estimating Testing Effort](/tutorials/estimating-testing-effort)
