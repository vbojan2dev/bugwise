---
question: Explain equivalence partitioning and boundary value analysis using an age field that accepts 18 to 60.
short: Equivalence partitioning splits inputs into groups that behave the same and tests one value per group; boundary value analysis tests the edges of those groups, such as 17, 18, 60 and 61.
category: test-design
level: junior
lookingFor: Correct partitions (below 18, 18-60, above 60, plus invalid types), correct boundary values, and why the techniques reduce the number of tests while catching off-by-one bugs.
pitfalls:
  - Choosing wrong boundary values, like 19 and 59 only.
  - Forgetting invalid partitions such as empty input, letters or decimals.
  - Testing every number from 1 to 100 instead of using the techniques.
order: 3
---

Both are black-box techniques that help you test **smart, not everything**.

**Equivalence partitioning (EP)** divides inputs into groups (partitions) where the software should behave the same way. You test **one value from each partition**.

For an age field that accepts **18 to 60**:

| Partition | Example value | Expected |
| --- | --- | --- |
| Below 18 (invalid) | 10 | Error |
| 18 to 60 (valid) | 35 | Accepted |
| Above 60 (invalid) | 75 | Error |
| Not a whole number (invalid) | "abc", empty, 25.5 | Error |

**Boundary value analysis (BVA)** focuses on the **edges** of partitions, because developers often make off-by-one mistakes, such as writing `age > 18` instead of `age >= 18`.

Boundary values to test: **17, 18, 60, 61** (two-value BVA). Many testers also add **19 and 59** (three-value BVA).

| Value | Expected |
| --- | --- |
| 17 | Rejected |
| 18 | Accepted |
| 60 | Accepted |
| 61 | Rejected |

Together, the techniques give strong coverage with about 8-10 tests instead of hundreds. On a mobile app, also check that the numeric keyboard appears and that pasted values like " 18 " with spaces are handled.

Learn more: [Boundary Value Analysis](/fundamentals/boundary-value-analysis)
