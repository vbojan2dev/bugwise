---
question: How would you test a form with many combinations of options?
short: You can't test every combination, so use pairwise testing to cover every pair of values in far fewer tests, then add risk-based combinations and boundary values on top.
category: test-design
level: mid
lookingFor: Recognizing combinatorial explosion, knowing pairwise (all-pairs) testing and why it works, and complementing it with risk-based and boundary tests.
pitfalls:
  - Trying to test every combination.
  - Picking random combinations with no method.
  - Treating pairwise as complete coverage and skipping important specific combinations.
order: 7
---

**The problem:** a flight search form with 4 trip types, 3 cabin classes, 5 passenger counts, 2 currencies and 3 languages has 4 x 3 x 5 x 2 x 3 = **360 combinations**. Testing all of them is not realistic.

**Pairwise (all-pairs) testing:** most bugs are caused by a single value or by the **interaction of two** values. Pairwise testing creates a small set of tests where **every pair of values appears at least once**. For the form above, that is about 20 tests instead of 360.

**How I do it**

1. List the fields and the values for each, using **equivalence partitions** (not every number from 1 to 9, but 1, a typical value and the maximum).
2. Generate the combinations with a tool like **PICT** or an online pairwise generator.
3. Add **constraints** for impossible combinations (an infant can't travel alone).
4. Add **risk-based extras:** combinations that matter to the business or have failed before, like "one-way, business class, 9 passengers, EUR".
5. Test **each field on its own** for validation and boundaries too.

Pairwise is a smart way to reduce tests, not a guarantee. A bug that needs three specific values together can still slip through, so I combine it with the risky combinations I know about.

Learn more: [Equivalence Partitioning](/fundamentals/equivalence-partitioning)
