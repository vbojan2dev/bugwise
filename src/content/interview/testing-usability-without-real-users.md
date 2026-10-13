---
question: "How would you test usability without access to real users?"
short: "Do a heuristic evaluation against Nielsen's 10 heuristics, compare with platform guidelines, run quick hallway tests with colleagues new to the feature, and use real-world signals like support tickets, reviews and analytics. Report findings with evidence and impact."
category: practical
level: mid
lookingFor: "Practical, low-cost methods (heuristics, guidelines, hallway tests, data), awareness that these predict rather than prove problems, and evidence-based reporting."
pitfalls:
  - "Saying usability can't be tested without a UX lab."
  - "Reporting personal taste as usability problems."
  - "Not knowing any heuristics or guidelines by name."
order: 16
---

Formal studies are great, but most of the time I can still find a lot:

1. **Heuristic evaluation.** I walk through realistic tasks and check each screen against Nielsen's 10 usability heuristics: is there feedback after actions (visibility of system status)? Is there a way back or undo (user control and freedom)? Are destructive actions confirmed (error prevention)? Do error messages say how to fix the problem?
2. **Platform guidelines.** Apple's Human Interface Guidelines and Google's Material Design describe expected patterns. Breaking them hurts consistency.
3. **Hallway tests.** I ask a colleague who hasn't seen the feature to try one task while I watch quietly, ideally thinking aloud. Five minutes, often eye-opening.
4. **Real-world signals.** Support tickets, app store reviews and analytics (where people drop out of a flow) show where real users struggle.
5. **My own first impression.** I note what confused me the first time, before I get used to the feature.

These methods **predict** problems; they don't prove them. So in reports I'm clear about the evidence: "2 of 3 colleagues couldn't find X" or "breaks heuristic 5, one tap deletes the account". When possible, I recommend a small test with about five real users per round for the riskiest flows.

Learn more: [Usability Testing Basics](/fundamentals/usability-testing)
