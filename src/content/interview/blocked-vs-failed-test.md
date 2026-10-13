---
question: "Blocked vs Failed: what's the difference?"
short: A test is Failed when you ran it and the product did the wrong thing, so you link a bug. It's Blocked when you couldn't run it to the end because something outside the test stopped you, like a down environment, missing test data or an earlier bug, so you write the reason and re-run it later.
category: process
level: junior
lookingFor: A clear distinction based on whether the case was actually executed and the product misbehaved, realistic examples of each, and knowing what to record for each status (a bug link vs a reason).
pitfalls:
  - Marking everything that doesn't work as Failed, including environment outages.
  - Marking a real product defect as Blocked, which hides it from the bug count.
  - Setting Blocked without saying what blocks it.
order: 5.2
---

The question I ask myself is: **did I get to check what this case checks?**

**Failed:** yes, I ran the steps, and the actual result is different from the expected result because of a defect in the product. For example, in a food delivery app the expired coupon SPRING5 is still accepted and the discount applies. I mark it Failed, write the actual result, attach a screenshot and link a bug.

**Blocked:** no, something outside this case stopped me before I could find out. Typical causes:

- the test environment or a third-party sandbox is down (the payment provider returns 503 errors);
- test data or an account I need doesn't exist;
- another bug is in the way: sign-in is broken, so I can't reach checkout at all.

I mark it Blocked, write the reason and link the blocking issue if there is one, then re-run it when it's cleared. If it fails then, it becomes Failed.

| | Failed | Blocked |
| --- | --- | --- |
| Was the case executed? | Yes | Not to the end |
| What's wrong? | The product | Something the case depends on |
| What I record | Actual result, evidence, bug key | Reason, blocking issue, when to re-run |

**Why it matters:** a wrong Failed sends a developer hunting for a bug that isn't in their code. A wrong Blocked hides a real defect. And in the summary report, blocked cases count as **not verified**, not as tested.

One nuance: when a bug blocks other cases, the case that hit the bug is **Failed**, and the cases behind it are **Blocked by** that bug. When the bug is fixed, they're all run again.

Learn more: [Test Runs and Test Management Tools](/tutorials/test-runs-and-test-management)
