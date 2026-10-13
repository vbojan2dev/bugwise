---
question: Testing can be repetitive. How do you handle repetitive work and stay focused?
short: I accept that some repetition is part of the job, but I keep it effective by varying my approach, using checklists, taking short breaks, and looking for patterns. I also suggest automating truly repetitive checks so my time goes to exploring.
category: behavioral
level: junior
lookingFor: Honest acceptance that repetition exists, practical habits to avoid missing things when tired or bored, curiosity even in routine work, and a proactive attitude toward improving or automating it.
pitfalls:
  - Saying you never find anything boring.
  - Admitting you rush through repetitive tests.
  - Implying repetitive work is beneath you.
order: 6
---

Some repetition is part of testing, like regression runs before every release or checking the same flow on several devices. The risk isn't boredom itself, it's **missing things because you're on autopilot**.

**How I stay sharp**

- **Use checklists.** They keep me from skipping steps when I've done something ten times.
- **Vary the details:** different accounts, data, devices or order of steps each run. The goal stays the same, but I see the product from new angles, and that's how I often find new bugs.
- **Stay curious:** I ask "what changed since last time?" and look at those areas more closely.
- **Short breaks** between long runs, and I don't run a big regression late in the day if I can avoid it.
- **Batch similar work,** for example all the iPad checks together, to reduce switching.

**Make it better for the team**

- If I run the same checks every sprint, I suggest them for **automation** and help write the scenarios.
- I **remove or merge** outdated test cases, so the suite is shorter.
- I keep **test data** ready to save setup time.

**Example:** our release smoke test took me about two hours on three devices. I listed the most stable steps and worked with a developer to automate them. Now I spend that time on exploratory testing of new features, which is where most bugs are found anyway.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
