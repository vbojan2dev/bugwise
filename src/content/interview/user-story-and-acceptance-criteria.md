---
question: What is a user story, and what are acceptance criteria?
short: A user story describes a feature from the user's point of view ("As a..., I want..., so that..."); acceptance criteria are the testable conditions that must be met for the story to be done.
category: agile
level: junior
lookingFor: The user story format, good testable acceptance criteria (often Given/When/Then), and how a tester uses them to design tests and spot gaps.
pitfalls:
  - Writing vague acceptance criteria like "it should work well".
  - Not mentioning that testers help write and review acceptance criteria.
order: 2
---

**A user story** is a short description of a feature from the user's perspective:

> As a **shopper**, I want to **save products to a wishlist** so that **I can buy them later**.

It describes **who**, **what** and **why**, and is a starting point for a conversation, not a full specification.

**Acceptance criteria (AC)** are specific, testable conditions the story must meet to be accepted. They are often written as **Given / When / Then**:

- **Given** I am logged in, **when** I tap the heart icon on a product, **then** it is added to my wishlist and the heart turns red.
- **Given** a product is in my wishlist, **when** I tap the red heart, **then** it is removed.
- **Given** I am logged out, **when** I tap the heart, **then** I am asked to log in.
- The wishlist is kept after logging out and back in, and is the same on app and website.

**How testers use them:**

- Each criterion becomes **one or more test cases**.
- While reviewing them, testers spot **gaps**: What happens when an out-of-stock product is in the wishlist? Is there a maximum number of items? Does it work offline?
- Good AC are **clear, testable and measurable**. "The wishlist loads fast" is vague; "the wishlist loads in under 2 seconds on 4G" is testable.

Learn more: [User Stories and Acceptance Criteria](/tutorials/user-stories-and-acceptance-criteria)
