---
question: How do you tell whether a bug is a duplicate or just related to another bug?
short: A duplicate has the same root behavior, same cause and same fix as an existing bug, even if it was found in a different way. A related bug looks similar or happens in the same area but needs its own fix. Search before reporting, and link related bugs instead of merging them.
category: bugs
level: junior
lookingFor: A clear distinction between duplicate and related bugs, the habit of searching before reporting, and good linking practice in the bug tracker, including what to do when unsure.
pitfalls:
  - Reporting without searching for existing bugs first.
  - Marking two different bugs as duplicates just because they're on the same screen.
  - Closing a duplicate without adding your new information to the original.
  - Creating a new bug when an old, closed one has come back instead of checking it.
order: 4
---

**A duplicate** is the **same problem** reported twice. It might be found through a different path, but it has the same cause and one fix will solve both.

> Bug A: "Checkout: Pay button does nothing with a saved Visa card."
> Bug B: "Can't complete order with saved card on iOS."
> If both fail because the saved-card token isn't sent, B is a duplicate of A.

**A related bug** is in the same area or looks similar, but it's a **separate problem** that needs its own fix.

> Bug C: "Checkout: Pay button does nothing when the promo code is invalid."
> Same button, same symptom, but a different cause. It's related, not a duplicate.

**How I handle it**

1. **Search first:** by screen name, error message, key words, and recent bugs in that area.
2. **If it looks like a duplicate,** I check the conditions. Same steps? Same platform? If my case adds new information, like "also happens on Android", I **add a comment** to the original instead of opening a new bug.
3. **If it's related,** I create a new bug and **link** it ("relates to") so the developer sees both together.
4. **If I'm not sure,** I report it, link it, and write "possibly the same cause as ABC-123". The developer can confirm and mark it as a duplicate later.

Duplicates aren't a disaster, but too many waste triage time. Missing a real second bug because I assumed it was a duplicate is worse.

Learn more: [Working with Jira](/tutorials/working-with-jira)
