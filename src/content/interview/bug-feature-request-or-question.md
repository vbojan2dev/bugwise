---
question: How do you decide whether something is a bug, a feature request or just a question?
short: It's a bug when the product doesn't behave as specified or as users can reasonably expect. It's a feature request when it works as intended but something new or different is wanted. When the expected behavior is unclear, it's a question for the product owner before it becomes either.
category: bugs
level: junior
lookingFor: Using requirements and reasonable user expectations as the reference, honesty about uncertainty, and routing each type to the right place so the bug list stays useful.
pitfalls:
  - Reporting every personal preference as a bug.
  - Never reporting usability problems because "it's not in the spec".
  - Arguing about the label instead of asking the product owner.
order: 8
---

I compare what I see against a **reference**: the requirements, acceptance criteria, designs, platform conventions, and what a user would reasonably expect.

**Bug:** the product doesn't do what it should.

> The spec says a coupon gives 10% off, but the total doesn't change. Or: the app crashes, loses data, or shows the wrong price. Even without a spec, a crash is never "expected".

**Feature request (or improvement):** it works as intended, but it could be better or different.

> The search works correctly, but users would like to filter by price. Nobody asked for it, so it's a new requirement, not a defect.

**Question:** I can't tell what the expected behavior is.

> Should a discount apply before or after delivery fees? The spec doesn't say, and both are plausible. I ask the product owner first, in the ticket or the team chat.

**Grey areas** are common. A confusing label that matches the design isn't a defect against the spec, but it may cause real user mistakes. I report it as a usability issue or improvement, explain the impact, and let the product owner decide.

Keeping these separate matters: the bug list stays focused on real defects, good ideas go to the backlog, and questions get answered instead of argued about.

Learn more: [User Stories and Acceptance Criteria](/tutorials/user-stories-and-acceptance-criteria)
