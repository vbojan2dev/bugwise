---
question: Who makes the go/no-go decision for a release, and what do you bring to that meeting?
short: The decision usually belongs to the product owner or release manager, not to QA. I bring a clear, honest picture of quality, covering what was tested, open bugs with their impact, untested areas and remaining risk, plus my recommendation.
category: process
level: senior
lookingFor: Understanding that testers inform the decision rather than own it, a concise and factual quality summary, a clear personal recommendation, and the courage to escalate when a critical risk is being ignored.
pitfalls:
  - Saying QA alone decides whether a release goes out.
  - Arriving with raw numbers (test counts, pass rate) and no interpretation.
  - Having no opinion and leaving the decision entirely to others.
  - Not documenting the decision and the accepted risks.
order: 6
---

In most teams the decision belongs to the **product owner, release manager or engineering lead**, because it's a business decision that weighs quality against deadlines, marketing and customer commitments. My role is to make sure it's an **informed** decision.

**What I bring, on one page**

1. **Scope tested:** which features, platforms and devices, and at what depth.
2. **Open bugs that matter:** each with severity, who is affected, workaround, and whether a fix is in progress. Not the full list, the ones that influence the decision.
3. **What was not tested or only partly tested,** and why.
4. **Exit criteria status:** for example "no open critical bugs, all P1 regression passed on tier 1 devices" and which criteria are met or not.
5. **Risks outside testing:** an unstable third-party API, a store review deadline, a backend migration in the same week.
6. **My recommendation:** go, no-go, or go with conditions such as a feature flag, a staged rollout or a hotfix plan.

**How I say it**

I keep it short and in business language: "I recommend go with a staged rollout. The one open major bug affects saved addresses on Android 10, about 2% of our users, and there's a workaround. I'd recommend no-go if the payment timeout issue reappears in the final build."

**If I disagree with the decision**

I state my concern clearly, once, with evidence. If a critical risk such as data loss or a security hole is accepted, I make sure the decision and its owner are documented, and I escalate if it's serious enough. Then I support the team and help reduce the impact.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
