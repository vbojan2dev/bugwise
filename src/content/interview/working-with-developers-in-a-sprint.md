---
question: How do you work with developers during a sprint?
short: Get involved early in refinement and planning, share test scenarios before coding, test small pieces as soon as they're ready, report bugs quickly and clearly, and talk directly instead of only through tickets.
category: agile
level: junior
lookingFor: A collaborative, continuous way of working across the sprint rather than "waiting for the build at the end", plus good communication habits.
pitfalls:
  - Describing testing as something that only starts after development is finished.
  - Communicating only through bug tickets.
  - Treating developers as opponents.
order: 5
---

I see developers as teammates with the same goal. Here's how a sprint usually looks for me:

**Before coding**

- In **refinement and planning**, I ask questions about edge cases and acceptance criteria, and help estimate testing effort.
- I write **test scenarios early** and share them with the developer, so they can check the obvious cases while coding.

**During the sprint**

- Test **small pieces as soon as they're ready**, like an API endpoint or one screen, instead of waiting for the whole feature.
- Do quick **pair testing** or a demo with the developer on their branch.
- Join the **daily stand-up** to raise blockers ("I can't test payments, the sandbox is down").

**When I find bugs**

- For small issues during development, a **quick message** or showing them is often faster than a ticket.
- For real bugs, a **clear bug report** with steps, evidence and environment.
- Retest fixes quickly so stories don't get stuck.

**At the end**

- Regression on affected areas, and a short summary of what was tested and any known risks.
- In the **retrospective**, suggest improvements, like "let's add test data setup to the story".

**Example:** sitting with a developer for 15 minutes on day 3 caught a validation issue that would otherwise have been a ticket ping-pong on day 9.

Learn more: [SDLC and STLC](/fundamentals/sdlc-and-stlc)
