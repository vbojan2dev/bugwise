---
question: A serious bug reached production. What do you do afterwards, and how do you run a useful root cause analysis?
short: First help contain and fix it, then run a blameless review that asks why it happened and why it wasn't caught, using techniques like the "5 whys". The output should be a few concrete, owned improvements, such as a new regression test, a better environment or a process change, not finger-pointing.
category: process
level: senior
lookingFor: Clear priorities (users first, analysis later), a blameless mindset, looking at both "why did it happen" and "why did we miss it", honest ownership of testing gaps, and concrete follow-up actions that actually get done.
pitfalls:
  - Blaming a person, or getting defensive about "QA missed it".
  - Stopping at "human error" as the root cause.
  - Producing a long list of actions that nobody owns.
  - Only adding a test for that exact bug and not the class of bugs.
order: 10
---

**During the incident: users first**

I help reproduce it, narrow down who is affected (platform, version, region), verify the fix, and do a focused regression before it ships. Analysis waits until the fire is out.

**After the incident: a blameless review**

"Blameless" doesn't mean nobody is responsible. It means we assume people acted reasonably with the information they had, and we look for the **conditions** that made the mistake easy. People only share honestly if they don't fear punishment.

**Two questions, not one**

1. **Why did the defect happen?** Unclear requirement, missing validation, a risky change merged late?
2. **Why didn't we catch it?** Wrong test data, an environment that differs from production, a device we don't cover, a scenario nobody thought of, or testing that was cut due to time?

**Going deeper with "5 whys"**

> The order total was wrong for some users. *Why?* The discount was applied twice. *Why?* The app retried the request after a timeout. *Why wasn't it caught?* Our test environment never times out. *Why?* We have no way to simulate slow responses. *Why?* Nobody owned network testing tools.

The 5 whys is a heuristic, not a rule; sometimes there are several causes and it's fine to stop at three or go to seven.

**Output: a few owned actions**

- A regression test for this bug **and** for its category (for example, all retryable payment requests).
- A tool or environment improvement, like a proxy to simulate timeouts.
- A process change if needed, such as a review checklist for retry logic.
- Each action has an **owner and a date**, and we check them in the next retro.

As a tester, I own my part openly: "I didn't test slow networks on checkout. From now on it's in our checklist."

Learn more: [Bug Life Cycle](/fundamentals/bug-life-cycle)
