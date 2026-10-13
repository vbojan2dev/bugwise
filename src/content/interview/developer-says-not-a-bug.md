---
question: What do you do when a developer says "it's not a bug" or "it works on my machine"?
short: Stay calm and factual, re-check and gather evidence, compare environments, refer to requirements, and involve the product owner if you still disagree.
category: behavioral
level: junior
lookingFor: Professional, collaborative behavior, evidence-based communication, and a clear path for resolving disagreements without ego.
pitfalls:
  - Getting defensive or turning it into a personal argument.
  - Immediately closing the bug without investigating.
  - Escalating to a manager before talking to the developer.
order: 1
---

First, I remember that we are on the **same team** with the same goal: a good product. So I stay calm and treat it as a puzzle, not a fight.

**If they say "it works on my machine":**

1. **Re-check it myself** on a fresh build to make sure it is still reproducible.
2. **Compare environments:** device, OS, browser, app build, environment (QA vs local), account, test data, network, language settings. Often the difference is right there.
3. **Add evidence:** screen recording, exact steps, logs, console errors, the API response.
4. **Offer to show them** on my device, or reproduce it together. Five minutes side by side often solves it.

**If they say "it's not a bug, it's expected":**

1. **Check the source of truth:** requirements, acceptance criteria, designs.
2. If the spec supports me, I point to it politely. If the spec is silent or unclear, it is a question for the **product owner**, not something the developer and I should decide alone.
3. If it is truly expected but confusing for users, I may suggest it as an **improvement** instead.

**Example:** a developer could not reproduce a crash on the checkout screen. We compared and found I was using an account with an expired saved card, while he used a fresh account. Once I shared the test account, he fixed it in an hour.

And if I was wrong, I simply say so and update the ticket.

Learn more: [Bug Life Cycle](/fundamentals/bug-life-cycle)
