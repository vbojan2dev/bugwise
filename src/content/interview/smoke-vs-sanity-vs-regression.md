---
question: What is the difference between smoke, sanity and regression testing?
short: Smoke testing quickly checks a new build's critical features, sanity testing quickly checks one specific fix or change, and regression testing checks that changes didn't break existing features.
category: fundamentals
level: junior
lookingFor: The scope and purpose of each (wide-shallow, narrow-focused, wide-deep) and when each is used, with a concrete example.
pitfalls:
  - Saying smoke and sanity are exactly the same thing.
  - Thinking regression testing only means retesting the fixed bug.
order: 5
---

All three are about checking a new build, but they differ in **scope** and **purpose**.

| | Smoke | Sanity | Regression |
| --- | --- | --- | --- |
| Question | Is this build stable enough to test? | Does this fix/change work? | Did anything that worked before break? |
| Scope | Wide and shallow | Narrow and a bit deeper | Wide and deep |
| When | Every new build | After a small fix or change | Before release, after significant changes |
| Duration | Minutes | Minutes | Hours to days (often automated) |

**Example with a shopping app:**

- **Smoke:** a new build arrives. You check the app opens, login works, search shows products, cart and checkout open. If login crashes, the build is rejected.
- **Sanity:** the developer fixed the coupon field. You apply a few coupons and check the total updates correctly, before spending time on deeper testing.
- **Regression:** before releasing, you run the full checkout, account and search suites to make sure the new coupon logic did not break card payments, shipping costs or order history.

Note that teams use "smoke" and "sanity" a bit differently, so it is fine to say you follow your team's definitions.

Learn more: [Regression and Smoke Suites](/tutorials/regression-and-smoke-suites)
