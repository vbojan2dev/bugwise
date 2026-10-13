---
question: "How do you derive test cases from a use case?"
short: "I write one test for the main success scenario, at least one for every alternative and exception flow, and I check the postconditions, not just the final screen. Coverage is the share of flows tested."
category: test-design
level: junior
lookingFor: "Knowing the parts of a use case (actor, preconditions, main flow, alternative and exception flows, postconditions), one test per flow, checking postconditions, and raising missing flows as gaps."
pitfalls:
  - "Testing only the happy path."
  - "Treating preconditions as test steps instead of setup."
  - "Inventing expected results for flows the use case doesn't describe."
order: 16
---

A use case describes how an **actor** reaches a goal: **preconditions**, the **main success scenario** (happy path), **alternative flows** (other routes that still reach the goal), **exception flows** (errors that stop the normal path) and **postconditions** (what must be true afterward).

**My steps**

1. **List every flow.** For "Reorder a previous order": the main flow, "some dishes sold out", "prices changed", "restaurant closed", "card declined" and so on.
2. **One test per flow, at least.** For an alternative, I follow the branch and check it rejoins the main flow. For an exception, I check the message, that nothing half-finished is left, and whether the user can recover.
3. **Preconditions become setup.** "Customer has a completed order" is test data, not a step.
4. **Postconditions become expected results.** After a successful reorder: one new order, charged once, the original order unchanged. A nice confirmation screen isn't enough.
5. **Use other techniques inside steps.** Boundary values for a quantity, state transitions for an order status.
6. **Look for missing flows.** "What if every dish is sold out?" If the use case doesn't say, I raise it as a gap rather than guessing.

**Coverage** is flows tested divided by all flows. Ten variations of the happy path still cover one flow.

Learn more: [Use Case Testing](/fundamentals/use-case-testing)
