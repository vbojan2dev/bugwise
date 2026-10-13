---
question: How do you mentor a junior tester?
short: Start from where they are, give them real work with a safety net, pair with them often, review their bug reports and test ideas with specific feedback, and gradually give them more ownership. The goal is independent thinking, not copies of my checklists.
category: leadership
level: senior
lookingFor: A structured but personal approach, learning by doing, specific and kind feedback, building judgment (not just rules), psychological safety, and gradually increasing responsibility.
pitfalls:
  - Handing over a pile of documents and leaving them alone.
  - Fixing their work yourself instead of explaining.
  - Only teaching rules and templates, never the reasoning behind them.
  - Giving feedback only when something goes wrong.
order: 1
---

**1. Start with a conversation.** What do they already know, how do they like to learn, what are they nervous about? A career changer from customer support has great user empathy; a CS graduate may know the tech but not how to look for trouble.

**2. Learn by doing, with a safety net**

- **First weeks:** pair testing on real stories. I think out loud: "This field takes a date, so I'm curious about time zones and February 29."
- **Then:** they test a low-risk story alone, and we review it together.
- **Later:** they own a feature area, and I'm available for questions.

**3. Review their work, specifically and kindly**

- **Bug reports:** "Your steps are clear. The title could say *where* and *what*, like 'Cart: total not updated after removing coupon'."
- **Test ideas:** before they start, they spend 10 minutes listing ideas, and I ask "what else could go wrong?" rather than handing them my list.
- Praise good things just as specifically as I point out gaps.

**4. Teach judgment, not only rules**

Why does this bug matter more than that one? Why test this device and not that one? I share the reasoning behind decisions and involve them in triage and planning, so they see how trade-offs are made.

**5. Make it safe to ask and to be wrong.** I tell them about mistakes I've made, like a bug I missed and what I learned. Juniors who are afraid to ask lose days being stuck.

**6. Grow their independence.** Short weekly check-ins, a few learning goals (for example API testing with Postman, or using adb), and visible credit when they find something good, like naming them in the sprint review.

Success for me is when they start asking questions I hadn't thought of.

Learn more: [Exploratory Testing](/tutorials/exploratory-testing)
