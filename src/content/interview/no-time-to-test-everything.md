---
question: What do you do if there isn't enough time to test everything before a release?
short: Use risk-based testing. Prioritize by business impact and likelihood of failure, test critical flows and recent changes first, and clearly communicate what was not tested.
category: behavioral
level: mid
lookingFor: A risk-based prioritization approach, concrete criteria for deciding what to test first, and transparent communication of remaining risk to stakeholders.
pitfalls:
  - Trying to rush through everything superficially.
  - Silently skipping tests without telling anyone.
  - Saying "I would just work overtime" as the only plan.
order: 2
---

This happens all the time, so I use **risk-based testing**: focus effort where a failure would hurt most and is most likely.

**1. Assess risk** for each area using two questions:

- **Impact:** how bad is it if this breaks? (money, data, legal, many users)
- **Likelihood:** how likely is it to break? (new or changed code, complex logic, history of bugs, many integrations)

**2. Prioritize:**

| | High likelihood | Low likelihood |
| --- | --- | --- |
| **High impact** | Test first, in depth | Test the main paths |
| **Low impact** | Quick check | Skip or test last |

In a shopping app, that usually means: login, search, cart, **checkout and payment** first, especially if checkout was changed in this release. A rarely used "edit avatar" screen can wait.

**3. Use efficient techniques:** a smoke test, then exploratory sessions on risky areas, then the most important regression tests (and automated ones, if available).

**4. Communicate clearly.** I tell the team and product owner what **was** tested, what **was not**, and what risk remains. The release decision belongs to the team or product owner, but they should make it with full information.

**5. Afterwards,** suggest improvements: earlier involvement, more automation for regression, or a feature flag so risky features can be turned off quickly.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
