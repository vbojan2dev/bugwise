---
question: How do staged rollouts and feature flags change your work as a tester?
short: They let a team release to a small group first and switch features on or off without a new build. As a tester I have to test both flag states and the switch between them, plan what to watch during the rollout, and agree on clear criteria to pause, roll back or expand.
category: process
level: senior
lookingFor: Accurate understanding of how rollouts work on the App Store, Google Play and the web, the extra combinations flags create, testing in production as a complement (not a replacement), and defining pause and rollback criteria.
pitfalls:
  - Thinking a feature flag means the feature doesn't need testing.
  - Testing only the "flag on" state.
  - Believing a staged rollout can be rolled back from users' phones.
  - Not cleaning up old flags, which multiplies combinations over time.
order: 9
---

Both tools reduce the **blast radius** of a release, but they don't reduce the need for testing. They change **what** I test and add a phase **after** release.

**How they work**

- **Staged rollout:** a release reaches a percentage of users first. Google Play supports staged rollouts by percentage that you can increase or halt. The App Store offers a **phased release** for automatic updates over seven days, which can be paused, although users can still update manually. On the web, teams use canary releases or traffic percentages.
- **Feature flag:** code ships to everyone, but a feature is turned on remotely for chosen users, markets or percentages, without a new build.

**What changes in my testing**

- **Both states:** every flagged feature is tested with the flag **on** and **off**, and the "off" path must still be the old, working behavior.
- **Switching:** what happens if the flag changes while the user is in the middle of the flow, or between sessions? Is cached data from the new feature handled when it's turned off?
- **Combinations:** several flags at once can interact. I agree with the team which combinations are realistic, and push for removing old flags.
- **Targeting:** is the feature really shown only to the right users, countries or app versions?
- **Test environments:** I need a way to set flags for my test accounts.

**During the rollout**

- Agree beforehand on **what we watch**: crash-free users, error rates, conversion, support tickets.
- Agree on **pause and rollback criteria**, so nobody debates it under pressure.
- For mobile, remember: halting a rollout stops *new* installs of that version, but users who already have it keep it. A **server-side flag** is often the real emergency brake.

**Example:** we rolled out a new checkout to 5% of Android users behind a flag. Payment errors were slightly higher on one bank's 3-D Secure page, so we turned the flag off within minutes, fixed it, and resumed the next day.

Learn more: [TestFlight and Firebase App Distribution](/mobile/beta-distribution)
