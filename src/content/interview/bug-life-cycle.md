---
question: Can you explain the bug life cycle?
short: A bug moves through statuses like New, Open, Assigned, In Progress, Fixed / Ready for test and Verified / Closed, with side paths such as Reopened, Not a bug, Cannot reproduce, Duplicate and Deferred.
category: bugs
level: junior
lookingFor: The main happy path of statuses, the alternative statuses and what triggers each transition, plus the tester's role in retesting and closing.
pitfalls:
  - Listing statuses without saying who moves the bug between them.
  - Forgetting the Reopened path when a fix does not work.
order: 2
---

The **bug life cycle** (defect life cycle) is the journey of a bug from discovery to closure. Exact names depend on the team and tool (for example Jira), but a typical flow is:

1. **New:** the tester reports the bug.
2. **Triaged / Open:** a lead or product owner confirms it is real and not a duplicate, and sets the priority.
3. **Assigned:** a developer becomes the owner.
4. **In Progress:** the developer reproduces it and works on a fix.
5. **Fixed / Ready for test:** the fix is in a new build the tester can install.
6. **Verified / Closed:** the tester retests on that build, the fix works, and the bug is closed.

**Alternative paths:**

- **Reopened:** the retest fails, so the bug goes back to the developer.
- **Not a bug / Rejected:** the app works as designed.
- **Cannot reproduce:** nobody can make it happen again; the tester adds missing details or it is closed.
- **Duplicate:** the same bug was already reported.
- **Deferred / Won't fix:** valid, but postponed to a later release or accepted as is.

**Example:** you report that a shopping app's cart badge shows the wrong count (New). It is assigned and fixed in build 2.3.1. You retest on 2.3.1, but the badge is still wrong after removing an item, so you **reopen** it with the new details. In 2.3.2 it works, and you close it.

Learn more: [Bug Life Cycle](/fundamentals/bug-life-cycle)
