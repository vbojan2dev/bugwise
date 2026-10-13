---
question: Your team only gives QA a build at the end of the sprint. How would you shift testing left in practice?
short: Get involved before code exists through refinement, three amigos and test ideas shared with developers, then test smaller pieces earlier on feature branches and APIs, and agree with the team that stories are smaller and finished one at a time. Start with one or two changes and show the results.
category: agile
level: senior
lookingFor: Concrete, incremental changes rather than theory, an understanding that the root problem is often large stories and work-in-progress, collaboration with developers, and measuring whether the change helped.
pitfalls:
  - Only saying "test earlier" without concrete steps.
  - Trying to change the whole process at once.
  - Thinking shift-left just means writing automated tests earlier.
  - Dropping end-of-sprint regression and exploratory testing entirely.
order: 6
---

A "mini waterfall" inside a sprint is very common: developers code for eight days, QA tests for two, and bugs roll over. Shifting left is less about testers and more about **how the team flows work**.

**1. Get in before the code**

- Join **refinement** and ask testing questions: "What if the card expires mid-checkout? What does the empty state look like?"
- Hold short **three amigos** sessions (product, developer, tester) for risky stories, ending with clear acceptance criteria and examples.
- Share my **test ideas with the developer** before they start coding. Many bugs are prevented because the developer reads the list.

**2. Test smaller things, sooner**

- Test the **API** as soon as the endpoint exists, before the UI is ready.
- Test **feature branch builds** or preview environments instead of waiting for the sprint build.
- Pair with the developer for 20 minutes when a story is "almost done".

**3. Fix the flow, not just the testing**

The real cause is often **big stories** and **too much work in progress**. I suggest splitting stories so they can be finished and tested within a few days, and limiting how many are open at once. "Stop starting, start finishing."

**4. Help developers test more**

Unit and API tests for business rules, a shared checklist for common UI states, and a smoke test they can run before handing over.

**5. Start small and measure**

I'd propose one or two changes for the next sprint, for example three amigos for every story over a certain size and testing on feature branches. After a few sprints we look at simple signals: fewer stories rolling over, bugs found earlier, less end-of-sprint crunch.

End-of-sprint regression and exploratory testing still happen, but they become a final check instead of the first time anyone looks at the work.

Learn more: [User Stories and Acceptance Criteria](/tutorials/user-stories-and-acceptance-criteria)
