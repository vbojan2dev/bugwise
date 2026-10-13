---
question: What is the difference between positive and negative testing?
short: Positive testing uses valid input to confirm the feature works; negative testing uses invalid or unexpected input to check it fails gracefully.
category: test-design
level: junior
lookingFor: Clear definitions, examples of both on the same feature, and the idea that the system should handle bad input with helpful errors and no crashes.
pitfalls:
  - Thinking negative testing means the test "failed".
  - Only giving positive examples.
order: 2
---

- **Positive testing** checks the system does what it should when the user does things **correctly** (the happy path).
- **Negative testing** checks the system behaves sensibly when the user does things **wrong or unexpectedly**. It should show a clear message and never crash, freeze or save bad data.

**Example: a sign-up form with email, password (min 8 characters) and phone number**

**Positive tests:**

- Valid email, 10-character password, valid phone number: account is created.
- Email with a plus sign, like anna+shop@test.com: accepted.

**Negative tests:**

- Email without @ ("anna.test.com"): error "Enter a valid email".
- 7-character password: error about minimum length.
- Letters in the phone number field.
- Email that is already registered.
- Submitting with no internet connection.
- Pasting 5,000 characters into the name field.

A **negative test passes** when the app handles the bad input correctly. "Negative" describes the input, not the result.

Most teams start with positive tests to confirm the basics, then spend a lot of effort on negative tests, because that is where users (and bugs) tend to surprise you.

Learn more: [Types of Testing](/fundamentals/types-of-testing)
