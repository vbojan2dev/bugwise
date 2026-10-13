---
question: What is the difference between verification and validation?
short: Verification checks we built the product right (matches the spec); validation checks we built the right product (meets users' real needs).
category: fundamentals
level: mid
lookingFor: The classic "built it right vs built the right thing" distinction, with an example where a product passes one but fails the other.
pitfalls:
  - Reciting the two phrases but swapping them.
  - Not explaining that something can meet the spec and still be useless to users.
order: 4
---

**Verification: "Are we building the product right?"**
It checks whether the product matches its specification and requirements. Reviews, walkthroughs and most test cases are verification.

**Validation: "Are we building the right product?"**
It checks whether the product actually solves the user's problem in real use. User acceptance testing, usability testing and beta programs are validation.

**Example: a banking app login**

- The spec says: "User logs in with a 6-digit PIN." You test that 6 digits are accepted, 5 and 7 are rejected, and the error messages are correct. Everything passes, so the feature is **verified**.
- In a beta, many users forget the PIN and ask for Face ID or fingerprint login. Support tickets grow. The feature is **not validated**, because the requirement itself did not fit users' needs.

| | Verification | Validation |
| --- | --- | --- |
| Compares against | Specification | User needs |
| Typical activities | Reviews, test cases | UAT, usability tests, beta |
| Can be static? | Yes (document reviews) | Mostly dynamic |

Both are needed: verification without validation gives a perfectly built wrong product.

Learn more: [Verification vs Validation](/fundamentals/verification-vs-validation)
