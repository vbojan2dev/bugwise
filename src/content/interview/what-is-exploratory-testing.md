---
question: What is exploratory testing, and when would you use it?
short: Exploratory testing means learning about the product, designing tests and running them at the same time, guided by a goal (charter) and a time box.
category: test-design
level: junior
lookingFor: That exploratory testing is structured (charter, time box, notes), not random, and that it complements scripted testing, especially for new features and finding unexpected bugs.
pitfalls:
  - Describing it as random clicking with no plan.
  - Saying it replaces test cases completely.
order: 4
---

In **exploratory testing**, you do not follow a script. You **learn, design and execute tests at the same time**, using what you discover to decide what to try next.

It is **not random**. Good exploratory testing has structure:

- **A charter (goal):** "Explore the photo editor's undo and redo to find data loss issues."
- **A time box:** often 60-90 minutes, shorter for small charters.
- **Notes:** what you tried, questions, bugs and ideas for follow-up.
- **A short debrief** with the team afterwards.

**Example:** exploring a food delivery app's checkout for 45 minutes, you might change the address after choosing a time slot, put the app in the background during payment, switch to airplane mode, apply two coupons, rotate the phone and use very large text. Scripted tests often miss these combinations.

**When to use it:**

- New features with incomplete documentation.
- When you need fast feedback early in a sprint.
- To complement scripted regression tests and find "unknown unknowns".
- When time is short and you want to focus on risky areas.

It differs from **ad hoc testing**, which has no charter or notes and is hard to repeat or report on.

Learn more: [Exploratory Testing](/tutorials/exploratory-testing)
