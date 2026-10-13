---
question: "How do you report a usability issue so it gets fixed?"
short: "Like a bug, but with evidence and impact instead of opinion: what you observed, who and how many it affects, the heuristic or guideline it breaks, and a severity. A suggested fix is optional."
category: bugs
level: junior
lookingFor: "Turning a subjective feeling into an actionable report with observations, user impact, a shared reference (heuristic or guideline) and an honest severity."
pitfalls:
  - "Writing \"it's confusing\" or \"I don't like it\"."
  - "Prescribing a redesign instead of describing the problem."
  - "Inflating or downplaying severity because \"it's only UX\"."
order: 18
---

Usability findings get dismissed when they sound like taste. I make them factual:

- **Title** that states the problem and the effect: "Account screen has no way back; users get stuck".
- **What I observed:** the screen, device, steps, and what happened. A screenshot or short recording.
- **Who and how many:** "3 of 5 colleagues in a hallway test", "new users", "on small phones". A think-aloud quote helps.
- **User impact:** time lost, mistakes, abandoned tasks, data or money at risk.
- **Reference:** the heuristic or platform guideline it breaks, for example Nielsen's "Error prevention" for a delete without confirmation.
- **Severity:** Nielsen's 0–4 usability scale (cosmetic, minor, major, catastrophe) based on frequency, impact and persistence, mapped to the team's bug severity.
- **Suggestion (optional):** the designer owns the solution, so I describe the problem first.

If it matches the spec but still confuses people, I say so: "works as specified, but users can't find it". That's a validation finding and still worth fixing.

Learn more: [Usability Testing Basics](/fundamentals/usability-testing)
