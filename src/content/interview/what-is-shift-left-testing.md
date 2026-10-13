---
question: What does "shift-left" testing mean?
short: Shift-left means moving testing earlier in development, by reviewing requirements and designs, discussing acceptance criteria before coding and testing small pieces early, because bugs found early are much cheaper to fix.
category: process
level: junior
lookingFor: The idea that quality work starts before code exists, concrete activities a tester can do early, and the cost-of-defects reasoning.
pitfalls:
  - Thinking it only means "write automated tests earlier".
  - Thinking it removes the need for testing at the end.
  - Not giving examples of early activities.
order: 4
---

If you draw the development process as a timeline from left (idea) to right (release), traditional testing happens on the right. **Shift-left** means moving testing activities to the **left**, earlier.

**Why:** a missing requirement found in a planning meeting costs a five-minute conversation. The same problem found after release costs a hotfix, unhappy users and maybe lost money.

**What it looks like for a tester**

- **Review user stories and acceptance criteria** in refinement and ask questions: "What happens if the coupon expires during checkout?"
- **Review designs** for missing states: empty, error, loading, long text, dark mode.
- **Three amigos** sessions (product, developer, tester) before work starts.
- Write test scenarios **before** the feature is ready, and share them with developers so they can check them while coding.
- Test early builds, API endpoints and feature branches instead of waiting for the full feature.
- Encourage unit and API tests by developers.

**Shift-left doesn't replace later testing.** We still do regression and exploratory testing before release, and many teams also "shift right" by monitoring production.

**Example:** in refinement I asked what happens to a scheduled post if the user deletes their account. Nobody had thought about it, and it was solved before a line of code was written.

Learn more: [SDLC and STLC](/fundamentals/sdlc-and-stlc)
