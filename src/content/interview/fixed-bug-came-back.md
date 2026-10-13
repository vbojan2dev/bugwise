---
question: A bug you verified as fixed has come back in a later build. What do you do?
short: Confirm it's really the same bug on the current build, reopen the original or report a new regression linked to it depending on the team's rules, add evidence and the build where it reappeared, and make sure a regression test exists so it can't silently return again.
category: bugs
level: mid
lookingFor: Understanding of reopening vs a new linked bug, the idea of a regression, checking the build history to narrow down when it came back, and prevention through a regression test.
pitfalls:
  - Assuming it's the same bug without checking the steps and cause.
  - Creating a brand-new bug with no link to the original.
  - Blaming the developer instead of asking how it was reintroduced.
  - Not adding the bug's scenario to the regression suite.
order: 6
---

A fixed bug coming back is a **regression**: something that worked has broken again. It's a useful signal, so I handle it carefully.

**1. Confirm it's really the same bug**

I follow the original steps on the current build. Same symptom, same conditions? Sometimes it's a *similar* bug with a different cause, for example the original fix covered iOS but this happens on Android.

**2. Find when it came back**

I check which builds have it. "Fixed in 3.4.0, still fine in 3.4.2, broken again in 3.5.0" helps the developer find the change that reintroduced it, often a merge, a refactor or a library update.

**3. Reopen or create a new bug, following the team's rules**

- Many teams **reopen** the original if it's the same bug and the original hasn't been released yet.
- If the fix was already released, teams often create a **new bug** marked as a regression and **linked** to the original, so release history stays correct.

Either way, I add the new build number, evidence, and a link to the original fix.

**4. Raise the priority if needed.** A regression of something users already have working is often more urgent than a new bug.

**5. Prevent it next time**

- Make sure the scenario is in the **regression suite**, or ask for an automated test.
- In the retro, ask *how* it came back: missing unit test, a merge conflict, two branches fixing the same code?

Learn more: [Bug Life Cycle](/fundamentals/bug-life-cycle)
