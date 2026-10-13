---
question: It's Friday at 5 pm and a hotfix must ship tonight. How do you test it?
short: Understand exactly what changed and why, retest the fix on the real build, run a focused regression around the changed code plus a smoke test of critical flows, and agree on a rollback and monitoring plan, including who stays reachable over the weekend.
category: process
level: senior
lookingFor: Calm prioritization under time pressure, impact analysis of the change, focused retesting and regression, attention to how the fix is delivered (web deploy vs app store), and a rollback and monitoring plan.
pitfalls:
  - Running the full regression suite or, the opposite, only checking the fix.
  - Not reading the actual code change or asking the developer what else it touches.
  - Testing on a different build from the one being released.
  - Shipping with nobody watching production over the weekend.
order: 8
---

A Friday hotfix is a risk in itself, so the first question I ask is: **does it really have to ship tonight?** If the bug is blocking payments or leaking data, yes. If it's a cosmetic issue, Monday morning is often safer. If it must go, here's my plan.

**1. Understand the change (10 minutes)**

- What was the bug, and what exactly did the developer change? I look at the pull request with them.
- Which other features use that code? This is my **impact analysis**.

**2. Test the right build**

I test the **exact build or deployment** that will go out, not a local or older one. For mobile, that means the release candidate from the same pipeline.

**3. Retest the fix**

The original steps, plus variations: other devices, other user types, the edge case that caused the bug.

**4. Focused regression plus smoke**

- Areas that share the changed code.
- A smoke test of the critical paths: launch, login, browse, checkout or the app's main job.

**5. Plan for things going wrong**

- **Web:** how do we roll back the deployment, and how fast?
- **Mobile:** an app store release can't simply be pulled back from devices, so a feature flag or server-side switch matters even more. On iOS we can request an expedited review if the fix is urgent, but approval time isn't guaranteed. A phased or staged rollout limits the blast radius.
- **Monitoring and people:** who watches crash reports and error logs tonight, and who is on call this weekend?

**6. Communicate**

A short message to the team and support: what was fixed, what was tested, what wasn't, and what to watch. On Monday, I make sure the fix gets a proper regression test and we discuss in the retro why it escaped.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
