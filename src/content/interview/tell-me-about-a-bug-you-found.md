---
question: Tell me about a bug you're proud of finding.
short: Use the STAR structure (Situation, Task, Action, Result) to tell a short story about a real bug, focusing on how you found and investigated it and the impact of fixing it.
category: behavioral
level: junior
lookingFor: A specific, real example told in a clear structure, showing curiosity, investigation skills, clear communication and impact, not just luck.
pitfalls:
  - Choosing a trivial bug like a typo with no story behind it.
  - Talking only about the bug and not about what you did.
  - Inventing a story you can't answer follow-up questions about.
order: 3
---

Use **STAR** to keep the answer short and clear (about 1-2 minutes):

- **Situation:** the project and context.
- **Task:** what you were responsible for.
- **Action:** what you did to find and investigate the bug. This is the most important part.
- **Result:** the impact, and what you or the team learned.

**Example answer:**

> **Situation:** I was testing a food delivery app before a big release with a new checkout.
>
> **Task:** I had to test the payment flow on iOS and Android.
>
> **Action:** All the scripted tests passed, so I did some exploratory testing around interruptions. I started a payment, and while the spinner was showing, I switched to my banking app to approve it and then came back. On Android the app showed an error, so I tapped Pay again. The order was charged twice. I reproduced it three times, captured logcat and the network requests, and saw that the app sent the payment request again when returning to the foreground.
>
> **Result:** The developer fixed it the same day and added a check against duplicate payments. It would have hit many users, since most of them approve payments in their banking app. Since then, I always include interruption tests in payment flows.

If you're a beginner, a bug from a course project, a personal app or crowdtesting is perfectly fine. Just make it real.

Learn more: [How to Write a Bug Report](/tutorials/writing-bug-reports)
