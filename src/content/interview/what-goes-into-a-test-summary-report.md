---
question: What goes into a test summary report?
short: Scope (release, build, environments, dates), what was tested and what wasn't and why, results (executed, passed, failed, blocked), open bugs by severity with their user impact, risks, and a clear recommendation. The tester recommends; the product owner decides.
category: process
level: junior
lookingFor: The main sections, an emphasis on the not-tested list and on risks, numbers paired with meaning, and an understanding that the report supports a decision rather than making it.
pitfalls:
  - Listing only counts like "120 executed, 92% passed".
  - Leaving out what wasn't tested.
  - Writing "testing is complete, approved for release" as if the tester decides.
  - Pasting the whole bug list instead of summarizing by severity and impact.
order: 5.6
---

A test summary report (also called a test closure or completion report) closes a test cycle. Its job is to help the team decide whether to release, so I keep it to **one page** with six parts:

1. **Scope.** Release and **build number**, environments and devices, dates, and which stories or features were in scope.
2. **What was tested.** Features and requirements covered, plus anything special like a retest of earlier fixes.
3. **What wasn't tested, and why.** Blocked areas, cases not run, requirements without tests, devices we didn't have. This is the part readers can't guess, so it's never optional.
4. **Results.** Executed, passed, failed, blocked, not run. Always with meaning: "3 failures, all in checkout", not just "92% passed".
5. **Open bugs by severity,** with the user impact of the worst ones: "FD-241 (Major): 'Remember me' is ignored, so every user is signed out each time they restart the app."
6. **Risks and recommendation.** What could still go wrong, then a clear call: go, no-go, or go if specific conditions are met.

A short example of the last part:

> **Recommendation:** not ready for Friday as is. Go on Monday if FD-241 and FD-242 are fixed and retested and card payment passes once the payment sandbox is back. FD-243 can ship as a known issue if Product accepts it.

The **product owner** (or whoever owns the release) makes the decision; my job is to make sure they decide with the facts.

During the cycle I also send **short daily or weekly updates** in the same shape (progress, new important bugs, blockers, what I need), so the final report holds no surprises.

Learn more: [Traceability and Test Summary Reports](/tutorials/traceability-and-test-reports)
