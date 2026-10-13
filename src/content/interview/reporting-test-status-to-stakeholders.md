---
question: How do you present testing status to non-technical stakeholders?
short: Lead with the answer they need, such as whether we're on track and what the risks are, in business language. Use a short summary with a clear status, the few issues that matter and their impact, what's not tested, and what I need from them. Keep the detail available, not upfront.
category: leadership
level: senior
lookingFor: Audience awareness, translating technical findings into business impact, honesty about risk and uncertainty, a consistent and simple format, and asking for decisions when needed.
pitfalls:
  - Leading with test case counts and pass percentages.
  - Using jargon like "regression", "P2" or "flaky" without explanation.
  - Hiding bad news or making everything sound green.
  - Giving status without saying what decision or help is needed.
order: 6
---

Non-technical stakeholders don't need to know how many test cases passed. They need to know: **Can we release? What could go wrong? Do you need anything from me?**

**The format I use (fits on one screen)**

1. **Overall status** in one line: "On track for Thursday, with one risk."
2. **What's ready:** the features that are tested and working, in their language. "Customers can now pay with Apple Pay and Google Pay."
3. **Issues that matter,** each with impact and plan: "Some Android users can't save a new address. About 3% of users, a fix is expected tomorrow. If it slips, we can release without the new address screen."
4. **Not tested or limited,** and why: "We couldn't test with the real bank in Germany; we'll monitor it closely after launch."
5. **What I need:** a decision, a resource, or nothing.

**Habits that help**

- **Translate:** not "a race condition in the sync service", but "if you edit on two devices at once, one change can be lost".
- **Use a simple status color** per feature or risk, with one sentence explaining any amber or red.
- **Be honest early.** Bad news on Monday is a planning problem; bad news on release day is a crisis.
- **Keep the details linked** (bug list, test report) for anyone who wants to dig in.
- **Same format every time,** so people learn where to look.

Numbers can help when they tell a story, like "open critical bugs: 3 last week, 0 now", but I always put the meaning next to the number.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
