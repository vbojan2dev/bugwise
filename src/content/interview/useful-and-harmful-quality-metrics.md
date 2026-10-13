---
question: Which quality metrics do you find useful, and which can do more harm than good?
short: Metrics are useful when they inform decisions and track trends, like escaped defects, defect removal efficiency (DRE), crash-free users and lead time. They become harmful when they turn into targets for individuals, like bug counts per tester or test pass rate, because people then optimize the number instead of quality (Goodhart's law).
category: strategy
level: senior
lookingFor: A nuanced view, accurate definitions, awareness of Goodhart's law and of how metrics get gamed, a preference for trends and outcome metrics over activity counts, and always pairing numbers with context.
pitfalls:
  - Listing metrics without saying what decision each one supports.
  - Using bug counts to compare testers or developers.
  - Presenting pass rate as a measure of quality.
  - Getting definitions wrong, for example for DRE.
order: 7
---

I like metrics that help the team **make a decision or spot a trend**, and I'm careful with any metric that becomes a **target for people**.

**Goodhart's law** is the key idea, often phrased as "when a measure becomes a target, it ceases to be a good measure." If testers are rewarded for bug counts, you get many tiny duplicate bugs. If the team is judged on pass rate, failing tests get skipped or rewritten until they pass.

**Metrics I find useful (as trends, with context)**

- **Escaped defects:** bugs found in production, ideally grouped by severity and by *why* they escaped. This is the closest to what users experience.
- **DRE** (defect removal efficiency; ISTQB uses a similar measure called defect detection percentage): bugs found before release ÷ (bugs found before release + bugs found after release), for a defined period. Useful as a trend, but it depends on how you count, and it can look great simply because production bugs aren't reported.
- **Crash-free users or sessions** and app store ratings for mobile apps.
- **Lead time** and the four **DORA metrics** (deployment frequency, lead time for changes, change failure rate, and time to restore service). They measure the delivery system as a whole, not testers.
- **Time from bug report to fix** for high-severity bugs.

**Metrics that are risky on their own**

- **Number of bugs found** per tester: rewards quantity, punishes testers on stable areas.
- **Test pass rate:** 98% passing says nothing if the 2% failing are all in checkout, or if the tests don't cover the risky parts.
- **Number of test cases** or "test coverage %" without saying coverage of what.
- **Bugs per developer:** destroys trust and makes people argue about bug reports.

**How I use them:** few metrics, shown as trends, discussed by the team, and always with a story: "Escaped bugs went up this quarter; four of six came from the new payment provider, which we can't test in staging. Here's what I propose."

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
