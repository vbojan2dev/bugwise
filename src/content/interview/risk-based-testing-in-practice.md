---
question: Walk me through how you actually run risk-based testing when you have a fraction of the time you need.
short: I identify risks together with product and developers, score them by impact and likelihood, map test depth to the score, test in risk order, and report coverage in terms of risk so the team knows exactly what remains uncovered.
category: strategy
level: senior
lookingFor: A repeatable process rather than a slogan, involving other people in judging risk, using change and incident data for likelihood, adjusting depth (not just order), and reporting residual risk clearly.
pitfalls:
  - Rating risk alone, from gut feeling only.
  - Using risk only to order tests, while still trying to run everything at the same depth.
  - Not re-evaluating risk when new information (like a bug cluster) appears.
  - Reporting "80% of tests passed" instead of what risk is left.
order: 2
---

Risk-based testing is easy to say and harder to do well. Here is how I run it.

**1. List the risks with the people who know them (30-60 minutes)**

I run a short session with a developer and the product owner. Developers know where the code is fragile; the product owner knows what would hurt the business. We list risk items as concrete statements, for example "a user is charged but the order is not created", not just "checkout".

**2. Score impact and likelihood**

- **Impact:** money, data loss, legal exposure, number of users affected, reputation.
- **Likelihood:** what changed in this release, code complexity, new integrations, how many bugs this area had before, and production incidents.

A simple 1-3 scale for each is enough. The point is the conversation, not precise numbers.

**3. Map the score to test depth, not just order**

| Risk | What I do |
| --- | --- |
| High | Scripted checks plus exploratory sessions, real devices, negative and edge cases |
| Medium | Main paths and the riskiest edges |
| Low | A quick smoke check, or nothing, stated openly |

**4. Re-evaluate as I go.** If I find three bugs in an area I rated "medium", its likelihood just went up, and I shift time there.

**5. Report in terms of risk.** "All high risks are covered and pass. Two medium risks were only partly tested: currency formatting in Arabic and the iPad layout. Low risks not tested: settings and help pages."

That last step is what makes it risk-based **testing** instead of just running fewer tests. People can only accept a risk they can see.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
