---
question: How do you handle a release that has known bugs?
short: Make sure every open bug is clearly documented with its risk and impact, give the product owner the information to decide, agree on workarounds and follow-ups, and monitor after release. The tester informs the decision; the business makes it.
category: behavioral
level: mid
lookingFor: Understanding that releasing with known minor bugs is normal, that the tester's role is to make risk visible rather than to block alone, and a mature, factual communication style.
pitfalls:
  - Saying you would never allow a release with any bugs.
  - Saying it's not your problem once the bugs are reported.
  - Not documenting what was accepted and why.
order: 4
---

Almost every release ships with **some** known bugs. My job is to make sure the decision is made **knowingly**.

**1. Make the risk visible.** I list the open bugs with severity, how many users are affected, platforms, and whether there's a workaround. For example: "On Android 10 only (3% of users), the profile photo upload fails. Workaround: upload from the web."

**2. Give a clear recommendation.** I say what I think, with facts: "I'm comfortable releasing with these four minor bugs. I would not release with the payment rounding bug, because it affects every order."

**3. Let the right person decide.** The product owner or release manager makes the go/no-go call. If they accept a risk I flagged, that's their call, and I make sure it's **documented**.

**4. Reduce the impact.**

- Feature flags to turn off the broken part.
- Release notes or support team informed about known issues and workarounds.
- Fixes planned for the next sprint or a hotfix.

**5. Watch after release.** Check crash reports, store reviews and support tickets, and verify the fixes when they arrive.

If a **critical** bug is open, such as data loss or a security issue, I clearly push back and escalate, calmly and with evidence.

Learn more: [Severity vs Priority](/fundamentals/severity-vs-priority)
