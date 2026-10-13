---
question: What is the difference between an error, a defect and a failure?
short: An error is a human mistake, a defect is the resulting flaw in the code, and a failure is what users see when that faulty code runs.
category: fundamentals
level: junior
lookingFor: The chain error → defect → failure, explained with one consistent example, and awareness that not every defect causes a failure.
pitfalls:
  - Mixing up the order of the chain.
  - Saying every defect always causes a failure.
order: 3
---

These three words describe a **chain of cause and effect**:

1. **Error (mistake):** a person does something wrong. A developer misreads "users must be 18 or older" and writes `age > 18`.
2. **Defect (bug, fault):** the result of that mistake in the product. The line `age > 18` is now in the code.
3. **Failure:** the defect is executed and the system behaves wrongly. An 18-year-old tries to sign up and sees "You are too young".

So: **error → defect → failure**.

Two useful details:

- **Not every defect causes a failure.** If the faulty code is in a screen nobody ever opens, the defect exists but no failure is observed yet.
- **Failures can also come from the environment,** for example a server outage or a full phone storage, not only from defects.

As testers we usually observe **failures**, and then we report them so developers can find and fix the underlying **defect**.

Learn more: [What Is Software Testing?](/fundamentals/what-is-software-testing)
