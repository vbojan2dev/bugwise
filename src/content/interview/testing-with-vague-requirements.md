---
question: How do you test a feature when the requirements are vague or missing?
short: Find other sources of truth, write my assumptions down and get them confirmed, explore the feature to learn how it behaves, and report questions separately from bugs. I also push the team to fix the requirements problem early next time.
category: strategy
level: senior
lookingFor: Initiative instead of waiting, use of test oracles beyond the spec, making assumptions explicit and confirmed, separating bugs from open questions, and improving the process for the future.
pitfalls:
  - Refusing to test until there's a full specification.
  - Testing based on your own assumptions without telling anyone.
  - Logging every unclear behavior as a bug.
  - Fixing the symptom without addressing why requirements keep being vague.
order: 6
---

Vague requirements are normal, especially in fast-moving teams. Waiting for a perfect spec isn't an option, but guessing silently isn't either.

**1. Find other sources of truth (oracles)**

- Designs, the ticket's comments, Slack threads, the API documentation.
- **Comparable products:** how the existing web version, a competitor or the platform convention behaves.
- **Consistency** with the rest of our own app.
- The **people**: a 10-minute call with the product owner and developer clears up more than a day of guessing.

**2. Write my assumptions down and get them confirmed**

I list them in the ticket: "I assume a promo code can't be combined with gift cards. I assume the limit is per account, not per device." Then I ask the product owner to confirm or correct them. This turns hidden assumptions into acceptance criteria.

**3. Explore to learn, in short sessions**

Time-boxed exploratory sessions with a charter, for example "explore the referral flow with new and existing users to discover the rules for rewards". I note what the feature *does*, and that becomes lightweight documentation.

**4. Separate bugs from questions**

Clear failures (crashes, data loss, inconsistencies with confirmed rules) are bugs. "Should it do X or Y?" is a **question** for the product owner, not a bug report. Mixing them creates noise and arguments.

**5. Fix the cause, not only the feature**

As a senior, I raise it in the retro and suggest something concrete: testers joining refinement, acceptance criteria as a "definition of ready" item, or a short "three amigos" talk before work starts.

Learn more: [Testing Without Documentation](/tutorials/testing-without-documentation)
