---
question: A developer or product manager keeps rejecting your bugs. How do you handle it?
short: Treat it as a pattern to understand, not a fight. Look at which bugs get rejected and why, improve evidence and clarity on my side, agree on shared definitions of a bug and of severity, and move disagreements about expected behavior to whoever owns the requirements.
category: leadership
level: senior
lookingFor: Self-reflection first, data on which bugs are rejected and why, a private and constructive conversation, agreed triage rules, and maturity about accepting that some reports were indeed not bugs.
pitfalls:
  - Assuming the other person is simply difficult.
  - Escalating to managers before talking one to one.
  - Reopening rejected bugs again and again without new information.
  - Taking rejections personally.
order: 2
---

When it happens once, it's a disagreement. When it keeps happening, it's a **signal** about our process or communication, and I want to understand it.

**1. Look at the data, including my own part**

I go through the last 15-20 rejected bugs and group them:

- **Couldn't reproduce:** my steps, data or environment details may be missing.
- **"Works as designed":** the requirements are unclear, or I'm testing against my own expectations.
- **"Not important":** we disagree on severity or priority.
- **Duplicates:** I need to search better before reporting.

Sometimes I find that a third of them were weak reports. I fix that first, and it builds credibility.

**2. Talk privately, with curiosity**

"I've noticed a lot of my bugs get closed lately. I'd like to understand how you see them, so I report what's useful to you." Often there's context I'm missing: deadline pressure, a tech-debt plan, or a PM who sees cosmetic bugs as noise.

**3. Agree on shared rules**

- What counts as a bug vs an improvement vs a question.
- What each **severity** means, with examples from our product.
- That "works as designed" needs a reference, and **unclear expected behavior goes to the product owner**, not decided between developer and tester.
- A short **triage** meeting for disputed bugs.

**4. Make the impact visible**

For bugs I still believe in, I describe user impact, add evidence such as support tickets or analytics, and suggest a different priority instead of insisting on "must fix now". A rejected bug that later shows up in customer complaints makes the point better than any argument.

**5. Escalate only if the pattern continues** and real risk is being ignored, and then about the process, not the person.

Learn more: [How to Write a Bug Report](/tutorials/writing-bug-reports)
