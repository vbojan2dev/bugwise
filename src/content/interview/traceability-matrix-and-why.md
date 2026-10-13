---
question: What is a traceability matrix and why use it?
short: A requirements traceability matrix (RTM) links each requirement or user story to the test cases that check it, and usually to their latest results and bugs. It shows which requirements are untested, which are failing, and what is affected when a requirement changes.
category: process
level: junior
lookingFor: A correct definition, forward and backward traceability, concrete uses (coverage gaps, impact analysis, reporting), and awareness that "covered" doesn't mean "tested well".
pitfalls:
  - Describing it as a list of test cases only, without the link to requirements.
  - Claiming 100% requirement coverage means the product is well tested.
  - Saying it's built by hand at the end instead of from links kept during the work.
order: 5.4
---

A **requirements traceability matrix (RTM)** is a table of links: each requirement or user story on one side, the test cases that check it on the other. In practice most teams add the **latest run result** and the **bugs** found, because that's what people ask about.

| Requirement | Test cases | Latest result | Bugs |
| --- | --- | --- | --- |
| FD-104 Coupon rules | C202 | Failed | FD-242 |
| FD-105 Tip the courier | none | – | – |
| FD-106 Pay with a saved card | C301 | Blocked | – |

**Why use it**

- **Coverage gaps (forward traceability).** Going from requirement to tests, FD-105 (tip the courier) has no tests at all and FD-106 was blocked, so neither is verified. Without the matrix those gaps hide behind a nice pass rate.
- **Why does this exist? (backward traceability).** Going from a bug or test back to its requirement shows which story a bug hurts, and finds orphan tests linked to nothing, often for removed features.
- **Impact analysis.** When the coupon rule changes, the matrix lists the cases and bugs linked to FD-104, so I know what to update and re-run. I still think about indirect effects; for example, reorder copies old carts together with their coupons, so a new coupon rule affects it too.
- **Reporting and audits.** The summary report can say exactly which requirements were tested, failed or not tested. Regulated projects (finance, health) often require this.

**How I keep one:** I link each test case to its story while writing it, record statuses in the run, and link every failure to a bug. Then the tool (Xray, TestRail, Zephyr) or a spreadsheet can generate the matrix.

**One caution:** a link says a requirement *has* a test, not that it's tested *well*. One happy-path case per story gives "100% coverage" and still misses most bugs. I use the matrix to find gaps and risk to decide depth.

Learn more: [Traceability and Test Summary Reports](/tutorials/traceability-and-test-reports)
