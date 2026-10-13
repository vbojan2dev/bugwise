---
question: "What can pairwise testing miss, and how do you compensate?"
short: "Pairwise only guarantees pairs, so bugs that need three or more specific values together can slip through. It also depends on good values and correct constraints, and it doesn't test sequences or define expected results. I add risk-based rows, 3-way coverage for risky areas and other techniques."
category: test-design
level: mid
lookingFor: "Understanding pairwise as a reduction technique with clear limits (higher-order interactions, constraints, value choice, rules and order), and practical ways to compensate."
pitfalls:
  - "Claiming pairwise coverage means everything is tested."
  - "Deleting impossible rows instead of adding constraints, which loses pairs."
  - "Forgetting the most-used real combinations."
order: 17
---

Pairwise testing guarantees that every **pair** of values appears in at least one test. That's powerful, but it leaves gaps:

| Gap | Example | How I compensate |
| --- | --- | --- |
| Three-way interactions | A bug only with German + PayPal + Firefox | Add that row explicitly, or generate 3-way coverage (PICT `/o:3`) for risky features |
| Missing or impossible combinations | Safari on Windows rows, or a forgotten constraint hiding a real pair | Model constraints in the tool instead of deleting rows; only exclude what truly can't exist |
| Poor value choices | Listing desktop browsers but forgetting mobile Safari | Choose values with equivalence partitioning and real usage data |
| Business rules | Fees that depend on specific combinations | Use a decision table for rule-based logic |
| Order and timing | A bug only when payment is retried after a timeout | Use state transition or use case testing |
| Popular combinations | 40% of users on Chrome + Android + English + Card | Add the top real-world combinations as extra rows |

Pairwise also doesn't give expected results: every row still needs a clear "what correct looks like".

So I present it as a smart way to **reduce** a combinatorial set, never as complete coverage.

Learn more: [Pairwise Testing](/fundamentals/pairwise-testing)
