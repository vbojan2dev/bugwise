---
question: Your testing estimate doesn't fit the deadline. What do you do?
short: I don't quietly squeeze it. I show the gap and what the estimate is made of, prioritize by risk, offer options (reduce scope, test lower-risk areas lightly, move the date, add help, release behind a flag), write down what won't be tested, and let the product owner decide.
category: process
level: mid
lookingFor: Calm, transparent negotiation before testing starts, risk-based prioritization, concrete options rather than a refusal, and an understanding that the release decision and the risk acceptance belong to the product owner.
pitfalls:
  - Agreeing to the shorter time and silently testing less.
  - Promising the date and planning to work nights.
  - Refusing to start until the date moves.
  - Not writing down what was left untested.
order: 13
---

This is a negotiation, not a failure. The estimate's job is to turn "there isn't enough time" into a clear choice.

**1. Show the gap and the breakdown.** *"My estimate is five days; Thursday gives three. Here's what the five days are made of."* A task list makes it concrete instead of sounding like a complaint.

**2. Prioritize by risk.** Score areas by likelihood and impact. Money, personal data and the main flow come first and get tested deepest.

**3. Offer options**, each with its risk:

| Option | Trade-off |
| --- | --- |
| Test high-risk areas deeply, the rest lightly | Lower-risk bugs may slip through |
| Reduce scope (e.g. ship "later today", not "tomorrow") | Less value in this release |
| Move the date | Business cost of waiting |
| Add a tester or developer help | Onboarding time |
| Release behind a feature flag to a small group | Needs flag and monitoring in place |

**4. Write down what won't be tested** by the deadline, in the plan or ticket: "Not tested: large text, Samsung A-series, custom tips above €50."

**5. The product owner decides.** I make the risk visible; they decide whether to accept it. Then I re-estimate if anything changes during testing, and say so early.

The difference from the classic "no time to test everything" question is timing: here I raise it when the estimate is made, so the team can still change scope or date instead of discovering the gap on release day.

Learn more: [Estimating Testing Effort](/tutorials/estimating-testing-effort)
