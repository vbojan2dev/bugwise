---
question: What is the difference between black box, white box and grey box testing?
short: Black box tests behavior without looking at the code, white box tests based on the code's internal structure, and grey box uses some internal knowledge (like the API or database) to design better black box tests.
category: test-design
level: junior
lookingFor: Clear definitions, who usually does each, and practical examples of grey box testing in a manual tester's daily work.
pitfalls:
  - Saying manual testers only ever do black box testing.
  - Confusing white box testing with "testing the UI design".
  - Giving definitions without examples.
order: 8
---

The difference is **how much you know about the inside** of the system.

**Black box testing**

- You test inputs and outputs based on requirements, without seeing the code.
- Techniques: equivalence partitioning, boundary values, decision tables, state transitions.
- Example: enter a 101-character name and check the error message.
- Mostly done by testers and also by users in acceptance testing.

**White box testing**

- You design tests from the **code structure**: branches, conditions, loops.
- Goal: cover paths in the code (for example, both sides of every `if`).
- Example: a unit test for the discount function that covers each branch.
- Mostly done by developers.

**Grey box testing**

- You test from the outside, but **use some inside knowledge** to aim better.
- Examples from my daily work:
  - Checking the **API response** in DevTools to see if a bug is front end or backend.
  - Looking in the **database** to confirm an order was saved with the right status.
  - Knowing from the architecture that two screens use the same endpoint, so a fix in one needs a retest in the other.
  - Reading **logs** to understand a crash.

Most experienced manual testers work in grey box style: user-focused, but technically aware.

Learn more: [Black, White and Grey Box](/fundamentals/black-white-grey-box)
