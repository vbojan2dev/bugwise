---
question: What is the difference between a test case and a test scenario?
short: A test scenario is a high-level idea of what to test; a test case is a detailed set of steps, data and expected result for checking one part of that scenario.
category: test-design
level: junior
lookingFor: That scenarios describe "what" at a high level and test cases describe "how" in detail, and that one scenario usually produces several test cases.
pitfalls:
  - Saying they are the same.
  - Describing a test case without expected results.
order: 1
---

**A test scenario** is a one-line description of a situation worth testing. It answers **what** to test.

**A test case** is a detailed description of **how** to test one specific behavior: preconditions, steps, test data and expected result.

One scenario usually becomes **several test cases**.

**Example: scenario "User logs in to the banking app"**

| Test case | Steps (short) | Expected result |
| --- | --- | --- |
| TC-01 Valid login | Enter valid email and password, tap Log in | Home screen with balance appears |
| TC-02 Wrong password | Valid email, wrong password | Error "Incorrect email or password", stays on login |
| TC-03 Empty fields | Tap Log in with empty fields | Fields are highlighted with required messages |
| TC-04 Locked account | Enter wrong password 3 times | Account locked message and reset option |

| | Test scenario | Test case |
| --- | --- | --- |
| Detail | Low | High |
| Answers | What to test | How to test it |
| Contains | One sentence | Preconditions, steps, data, expected result |
| Good for | Quick coverage overview, agile teams | Repeatable, handover-friendly testing |

Scenarios are quick to write and help you check coverage; test cases are better when tests must be repeated exactly or run by someone else.

Learn more: [Test Scenarios vs Test Cases vs Checklists](/tutorials/scenarios-cases-checklists)
