---
question: What is Agile and Scrum, and what does a tester do during a sprint?
short: Agile is an approach of delivering software in small, frequent increments; Scrum organizes this into sprints. Testers are involved throughout the sprint, from refining stories to testing and regression.
category: agile
level: junior
lookingFor: A basic understanding of Agile values and Scrum events, and that testing happens continuously inside the sprint with the tester collaborating from the start.
pitfalls:
  - Describing testing as a separate phase at the end of the sprint.
  - Not knowing the main Scrum events or roles.
order: 1
---

**Agile** is a way of building software in **small increments**, releasing often and adapting to feedback instead of planning everything up front.

**Scrum** is the most popular Agile framework. Work is done in **sprints** (usually two weeks), with:

- **Roles:** product owner (decides what to build), scrum master (helps the process), developers (everyone who builds, including testers).
- **Events:** sprint planning, daily scrum, sprint review, retrospective, plus backlog refinement.
- **Artifacts:** product backlog, sprint backlog, increment.

**What a tester does in a sprint:**

- **Refinement and planning:** asks questions about user stories, helps write clear **acceptance criteria**, points out risks and edge cases, helps estimate testing effort.
- **Early in the sprint:** prepares test scenarios and test data while developers code; tests stories as soon as they are ready, not all at the end.
- **During the sprint:** reports bugs quickly and talks directly with developers, retests fixes, does exploratory testing.
- **Daily scrum:** shares progress and blockers ("the filter story is blocked by a crash on Android").
- **End of the sprint:** regression testing, helps demo the stories in the review, suggests improvements in the retrospective.

The key idea is that **quality is the whole team's responsibility**, and the tester helps the team build it in from the beginning.

Learn more: [SDLC and STLC](/fundamentals/sdlc-and-stlc)
