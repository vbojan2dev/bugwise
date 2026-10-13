---
question: What makes a good bug report?
short: A good bug report lets a developer reproduce the bug without asking questions. It has a clear title, environment, exact steps, expected vs actual result, severity and evidence.
category: bugs
level: junior
lookingFor: The key fields of a bug report and the qualities behind them (clear, specific, reproducible, one bug per report, neutral tone), ideally with an example title.
pitfalls:
  - Vague titles like "Checkout broken".
  - Forgetting environment details such as device, OS, browser and build number.
  - Putting several bugs in one report.
order: 3
---

The goal of a bug report is simple: **a developer can reproduce and understand the bug without asking you anything.**

**Key parts:**

- **Title:** short and specific. "Checkout: app crashes when tapping Pay with an expired card" instead of "Payment broken".
- **Environment:** device, OS version, browser, app build, environment (QA/staging), account used.
- **Preconditions:** for example "logged in, one item in cart".
- **Steps to reproduce:** numbered, exact, starting from a known point.
- **Expected result** and **actual result.**
- **Severity and priority.**
- **Evidence:** screenshot, screen recording, console or crash logs.
- **Frequency:** always, or "3 out of 10 tries".

**Good habits:**

- **One bug per report.**
- **Reproduce it before reporting**, and find the shortest steps.
- **Check for duplicates** first.
- **Stay neutral and factual.** Describe behavior, not people: "the button does nothing", not "someone forgot to code the button".
- **Add useful extras:** does it happen on iOS too? In another browser? Was it working in the previous build?

A small example: "Steps: 1. Open cart. 2. Change quantity to 0. 3. Tap Update. Expected: item is removed. Actual: item stays with quantity 0 and total 0.00."

Learn more: [How to Write a Bug Report](/tutorials/writing-bug-reports)
