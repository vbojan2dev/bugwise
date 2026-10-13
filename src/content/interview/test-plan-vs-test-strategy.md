---
question: What is the difference between a test plan and a test strategy?
short: A test strategy is the high-level, long-lived approach to testing for the whole product or company; a test plan applies it to one specific project or release, with scope, schedule, people and environments.
category: process
level: mid
lookingFor: The difference in scope and lifetime, typical contents of each, and how they relate in practice (the plan follows the strategy).
pitfalls:
  - Saying they are the same document.
  - Putting dates and names in the strategy, or general philosophy in the plan.
  - Not knowing that many agile teams keep both very short.
order: 3
---

**Test strategy: the "how we test here" rules**

- Long-lived, for the whole product or organization.
- Covers: test levels and types we use, manual vs automation approach, tools, environments, how we handle defects, risk approach, quality metrics, supported devices and browsers policy.
- Example line: "Every story gets exploratory testing; critical flows are covered by automated regression on each build; we support the latest two iOS versions and Android 10+."

**Test plan: the "what we do for this release" document**

- Short-lived, for one project, release or epic.
- Covers: scope and out of scope, schedule, who tests what, specific devices, test data, risks, entry and exit criteria.
- Example line: "Release 5.2: new checkout. Test on iPhone 12 and 16, Pixel 8, Galaxy A15. Exit when no open critical bugs and all high-priority cases pass."

| | Strategy | Plan |
| --- | --- | --- |
| Scope | Product / company | One release or project |
| Lifetime | Months or years | Weeks |
| Level | General approach | Concrete details |

The plan **follows** the strategy. In agile teams both are often lightweight: a strategy page on the wiki and a one-page plan per release.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
