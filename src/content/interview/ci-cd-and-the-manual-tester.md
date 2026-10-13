---
question: What is CI/CD, and where does a manual tester fit in?
short: CI automatically builds and checks every code change; CD keeps every passing build ready to release (delivery) or releases it automatically (deployment). Manual testers test PR and staging builds, track which build contains which fix, read red pipelines at a basic level, flag flaky tests and focus on what automation can't judge.
category: process
level: junior
lookingFor: Correct definitions (including delivery vs deployment), knowledge of typical pipeline stages, and a concrete picture of the tester's role around builds rather than "automation replaces manual testing".
pitfalls:
  - Mixing up continuous delivery and continuous deployment.
  - Thinking CI/CD means there is no need for manual testing.
  - Saying pipelines are only the developers' concern.
order: 14
---

**Continuous integration (CI)** means developers merge small changes often, and every change is automatically built and checked by a CI server such as GitHub Actions, GitLab CI or Jenkins.

**CD** has two meanings:

- **Continuous delivery:** every change that passes is *ready* to release; a person decides when.
- **Continuous deployment:** every passing change goes to production *automatically*.

A typical pipeline: **build → unit tests → lint → deploy to a test environment → automated API/UI tests → manual testing → release.**

Where I fit as a manual tester:

- **Testing early:** if the team makes builds for pull requests, I test the change before it's merged.
- **Knowing the build:** I check which build contains a fix (ticket, release notes, the app's About screen) before retesting, and always report the exact build.
- **Reading a red pipeline:** which stage failed, which test, and is it related to the change? I don't fix it, but I can tell whether there's anything to test yet.
- **Flaky tests:** I make them visible and push for a ticket instead of re-running until green.
- **What automation can't judge:** new features, exploratory testing, real devices, usability and accessibility, and checking features behind feature flags in both states.

Example: *"The PR is red on a map UI test that also fails on main without changes. Looks flaky. I tested the PR build on two phones and the fix works; I'll retest on staging once it's merged."*

Learn more: [Git and CI for Testers](/tutorials/git-and-ci-for-testers)
