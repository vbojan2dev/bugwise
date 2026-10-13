---
question: What is the difference between severity and priority?
short: Severity is how badly a bug hurts the product; priority is how soon it should be fixed. They are independent of each other.
category: bugs
level: junior
lookingFor: That the two are independent, who usually sets each one, and an example for each of the four combinations.
pitfalls:
  - Saying they are the same thing.
  - Giving definitions without an example.
  - Claiming high severity always means high priority.
order: 1
---

- **Severity** = the **impact** of the bug on the system or user. Usually proposed by the tester and confirmed in triage. Levels like blocker/critical, major, minor, trivial.
- **Priority** = the **urgency** of fixing it. Usually set by the product owner or lead, based on business needs. Levels like P1 (highest) to P4 (low).

They are **independent**, which gives four combinations:

| | High priority | Low priority |
| --- | --- | --- |
| **High severity** | Banking app crashes when tapping "Transfer" for all users. Fix now. | App crashes when exporting a statement as CSV on a legacy Android version used by 0.1% of users. Serious, but can wait. |
| **Low severity** | Company name is misspelled on the home screen or app store screenshot. Nothing breaks, but everyone sees it. | A slightly misaligned icon on a rarely used settings screen. |

A good answer also mentions that priority can **change**: a low-priority bug can become high priority before a big marketing launch, or if a key customer complains.

Learn more: [Severity vs Priority](/fundamentals/severity-vs-priority)
