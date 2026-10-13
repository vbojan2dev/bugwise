---
question: How do you decide what NOT to test, and how do you get the team to agree with it?
short: I make the out-of-scope list explicit, explain the reasoning in terms of risk and cost, and get the product owner to confirm it in writing. Skipping something openly is a decision; skipping it silently is a gamble.
category: strategy
level: senior
lookingFor: Comfort with deliberately leaving things untested, clear criteria for it, and the communication skill to make it a shared, documented decision that can be revisited.
pitfalls:
  - Claiming you test everything.
  - Quietly skipping areas without telling anyone.
  - Asking for approval with no reasoning, so stakeholders say "test everything".
  - Never revisiting the list when the situation changes.
order: 3
---

Every test plan leaves things out. The skill is doing it **on purpose** and **out loud**.

**What I usually consider leaving out**

- Areas that **didn't change** and have no shared code with what did change, and have a clean history.
- Things already covered well at another level, such as validation rules covered by API or unit tests.
- **Low-impact, low-usage** features: if analytics show 0.5% of users open a screen and a failure would be cosmetic, it gets a smoke check at most.
- **Platform combinations** outside the agreed device and browser matrix.
- Third-party systems we don't own, beyond checking our integration with them.

**How I get agreement**

1. **Write it down** in the test plan under "Out of scope", with one line of reasoning per item.
2. **Frame it as a trade-off,** not a request: "If we test the old export screen, we lose half a day on the new checkout. I recommend skipping export because it hasn't changed since March."
3. **Ask the product owner to confirm.** A quick "agreed" on the ticket or in the planning meeting is enough. It becomes the team's decision, not mine.
4. **Name the trigger to revisit:** "If the export code is touched, it moves back into scope."

**Example:** for a redesign of an e-commerce home page, I proposed not testing the legacy gift card flow on old Android versions, which had a tiny share of users and no code changes. The PM agreed, and we spent the time on the new product carousel, where we found a crash on small screens.

If something I chose not to test breaks later, the written decision makes the retro about improving our risk judgment, not about blame.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
