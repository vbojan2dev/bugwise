---
question: How do you know which build contains a fix?
short: I check the ticket (a fixed-in build or fix version field, or the linked branch, commits and PR), the release notes or CI page for the build, and the version and build number on my device. Only when they match do I retest. I also check whether the fix is in the app or the backend, and whether it's behind a feature flag.
category: practical
level: junior
lookingFor: A concrete routine using several sources, the habit of matching build numbers before retesting, and awareness of the traps (higher build without the fix, backend vs app, feature flags).
pitfalls:
  - Retesting on whatever build is installed and reopening the bug.
  - Reporting "latest" instead of a build number.
  - Assuming a higher build number contains every fix.
  - Treating Resolved as verified.
order: 15
---

I match three things before I retest.

**1. The ticket.** Many teams fill a "Fixed in build" or "Fix version" field. If Jira is connected to the code host, the ticket's Development panel shows the branch, commits and pull request, sometimes the builds and deployments too.

**2. The build.** The release notes for a build, or its page in the CI tool, list the PRs or tickets it contains. TestFlight's "What to Test" and Firebase App Distribution notes often do the same.

**3. My device.** The app's About screen, TestFlight or App Tester shows version and build, e.g. **2.1.0 (412)**. For a website, the version may be in the footer, a `/version` endpoint or the console.

If the fix is in 412 and I have 411, I don't retest yet: I install 412 or ask when it lands.

Three traps I watch for:

- **A higher number isn't proof.** A hotfix build from an old release branch can be newer and still lack the fix.
- **App or backend?** A server fix may be on staging but not production, or affect old app versions too.
- **Feature flags.** The code can be in the build but switched off for my account.

When I verify, I write it down precisely: *"Verified on 2.1.0 (412), staging, iPhone 15, flag reorder_current_prices ON."*

Learn more: [Git and CI for Testers](/tutorials/git-and-ci-for-testers)
