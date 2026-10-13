---
question: QA is seen as the bottleneck in your team. What would you change?
short: Find out where work actually waits, then make quality a team responsibility, involve testing earlier, split work smaller, automate repetitive checks, help developers test, and focus manual effort by risk. A bottleneck is usually a flow problem, not a "testers are slow" problem.
category: leadership
level: senior
lookingFor: A diagnostic, data-based approach, systems thinking (work in progress, batch size, handoffs), team ownership of quality, concrete changes on both the QA and the team side, and no defensiveness.
pitfalls:
  - Getting defensive or blaming developers for late handovers.
  - Proposing only "hire more testers".
  - Lowering quality by quietly testing less.
  - Making many changes at once without measuring anything.
order: 3
---

I take it seriously and don't get defensive. Even if the cause isn't the testers, the experience of waiting is real.

**1. Find where work actually waits**

I look at the board or the ticket history: how long stories wait in "Ready for test", how long they're in testing, how often they bounce back, and when in the sprint they arrive. Usually the pattern is clear: most stories arrive in the last two days, many come back with basic bugs, and environments are unstable.

**2. Changes on the team side**

- **Smaller stories,** handed over continuously instead of in a big batch.
- **Limit work in progress:** developers help finish and test stories before starting new ones.
- **Quality is a team job:** developers run a shared checklist and the smoke tests before handing over; anyone can help test.
- **Stable test environments and test data,** which often waste more time than testing itself.

**3. Changes on the QA side**

- **Earlier involvement:** acceptance criteria and test ideas before coding, so fewer bugs are created.
- **Risk-based depth:** not every story needs the same amount of testing. A copy change gets a quick check; a payment change gets the full treatment.
- **Automation for repetitive regression,** so manual time goes to new and risky work.
- **Less ceremony:** lightweight test notes or checklists instead of detailed scripts nobody reads.

**4. Measure and talk about it**

We pick one or two signals, for example time in "Ready for test" and the number of stories rolling over, and review them in retros.

**Example:** in one team, half of the "QA delay" was stories waiting for a deployment to the test environment. Automating deployments to a preview environment saved more time than any change to how we tested.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
