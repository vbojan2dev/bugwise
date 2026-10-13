---
question: How do you organize and track test execution for a release?
short: I pick cases from the repository by priority and risk, create one run per build and environment, assign testers, and record a status, actual result and evidence for each case, linking every failure to a bug. I track progress daily, retest fixes in a new run on the new build, and close with a summary report.
category: process
level: mid
lookingFor: A structured workflow from repository to run to report, sensible scoping, correct use of statuses, discipline about builds and evidence, active handling of blockers, and familiarity with tools like TestRail, Xray or Zephyr without depending on one.
pitfalls:
  - Answering only with a tool name.
  - Running everything every time, with no prioritization.
  - Mixing results from different builds in one run.
  - Waiting until the end to report progress or blockers.
order: 5.8
---

I think of it in five steps.

**1. Scope the run.** From the test plan and the release notes, I decide what to run: all P1 cases, plus P2 cases for the areas that changed, plus retests of bugs fixed in this release. Impact analysis and the traceability matrix help me see which requirements and cases are affected.

**2. Create the runs.** In the test management tool (TestRail, Xray, Zephyr, or a disciplined spreadsheet for a small team), I create **one run per build and environment**, for example "2.0.0 regression · build 412 · iPhone 15" and the same for a Pixel. I filter by platform so iOS-only cases don't end up in the Android run, and I assign testers by section or device so every case has one owner.

**3. Execute with discipline.** Each case gets a status as soon as it's run:

- **Passed** when the actual result matches;
- **Failed** with the actual result, evidence and a linked bug;
- **Blocked** with the reason (sandbox down, missing data, another bug);
- **Skipped / N/A** with a reason.

If I find that a case is out of date, I note it on the result and update the repository after the run, rather than silently editing it mid-run.

**4. Track and unblock daily.** I watch executed vs remaining (a burndown) and the failed and blocked P1 cases. A flat burndown usually means a blocker, so I raise it at stand-up the same day. I send a short daily update: progress, important new bugs, blockers, what I need.

**5. Retest, re-run, report.** When fixes arrive in a new build, I create a new run with the failed, blocked and untested cases plus a regression subset around the fixes. The old run stays as the record of the old build. At the end I write a one-page test summary report with what was and wasn't tested, open bugs by severity, risks and a recommendation.

Learn more: [Test Runs and Test Management Tools](/tutorials/test-runs-and-test-management)
