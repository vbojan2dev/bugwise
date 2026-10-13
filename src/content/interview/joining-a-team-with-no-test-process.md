---
question: You join a team that has no documentation and no test process. What do you do in your first 30 to 90 days?
short: Learn first, then fix the biggest risks, then build a lightweight process with the team. Map the product and its risks, start testing and reporting bugs right away, create a smoke checklist and simple bug workflow, and grow it based on what actually hurts.
category: leadership
level: senior
lookingFor: A phased plan, delivering value early instead of writing documents for weeks, building relationships, introducing the minimum useful process with the team's buy-in, and prioritizing by risk.
pitfalls:
  - Arriving with a heavy process from a previous company and imposing it.
  - Spending the first month only writing documentation.
  - Criticizing how things were done before.
  - Trying to document and test everything at once.
order: 4
---

I'd split it into three phases. The exact timing depends on the team, but the order matters.

**Days 1-30: learn and be useful**

- **Talk to people:** developers, product, support, sales. Ask: "What breaks most? What are you afraid of before a release? What do customers complain about?"
- **Use the product** like a customer and build a **feature map**: main flows, integrations, platforms.
- **Look at data:** support tickets, crash reports, app store reviews, the bug backlog if one exists.
- **Start testing immediately** on current work and report bugs clearly. Good bug reports in week one earn trust faster than any plan.

**Days 30-60: cover the biggest risks**

- A **smoke checklist** for the critical flows, run before every release.
- A simple **bug workflow** agreed with the team: where bugs go, which fields matter, what each severity means.
- **Test notes** for the riskiest areas, written as I explore. Lightweight docs that grow with use.
- A basic **device and browser list** based on analytics.

**Days 60-90: build the process with the team**

- Join refinement and add **acceptance criteria** to stories.
- Turn the smoke checklist into a prioritized **regression suite**, and identify the first candidates for automation.
- Agree on **release criteria** and who makes the go/no-go call.
- Write a one-page **test strategy** and review it with the team.

**How I introduce change:** one improvement at a time, always tied to a problem the team already feels ("we had two broken releases last month; a 20-minute smoke check would have caught both"), and I ask for their input instead of announcing rules.

Learn more: [Testing Without Documentation](/tutorials/testing-without-documentation)
