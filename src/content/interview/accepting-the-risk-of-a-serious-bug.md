---
question: The product manager wants to ship with a bug you think is serious. How do you handle it?
short: Make sure the PM truly understands the impact in user and business terms, propose options that reduce the risk, and if they still decide to ship, get the risk acceptance documented with a mitigation and monitoring plan. Escalate only for truly critical risks.
category: process
level: senior
lookingFor: Respect for who owns the decision, strong translation of a technical bug into business impact, creative alternatives between "ship" and "block", formal risk acceptance, and judgment about when escalation is justified.
pitfalls:
  - Turning it into a power struggle or "QA veto".
  - Giving up silently after the first "we'll ship anyway".
  - Arguing about severity labels instead of user impact.
  - Forgetting to plan monitoring and follow-up after the release.
order: 7
---

First I check that we actually **disagree about the risk**, not about the words. Often "Major" means something different to me and to the PM.

**1. Translate the bug into impact**

Not "the sync has a race condition", but "if a user edits a note on two devices within a few seconds, one edit is lost without warning. Our heaviest users do this every day, and lost data creates support tickets and churn."

I add what I know about **how many users, how often, and whether there's a workaround**, and I'm honest about what I don't know.

**2. Offer options, not just "no"**

- Ship with the feature behind a **feature flag**, off for everyone or on for a small group.
- **Staged rollout** with a clear rule to halt it.
- Ship but **disable the specific path** (for example, turn off multi-device editing for now).
- Delay by one or two days for a targeted fix and a focused retest.

**3. If the PM still decides to ship, make the risk acceptance explicit**

- Record it on the ticket: the risk, who accepted it, and the reason.
- Add it to the **known issues** for the support team and, if needed, the release notes.
- Agree on **monitoring** (crash rate, error logs, support tickets for that flow) and a **trigger**: "If we see more than a handful of reports in 48 hours, we roll back or hotfix."
- Schedule the fix.

**4. Escalate only when it's justified**

For security holes, data loss, legal or payment issues, I escalate to engineering or product leadership, calmly and with evidence, and I tell the PM I'm doing it. For anything less, I accept that the business can take risks I wouldn't have taken.

Learn more: [Severity vs Priority](/fundamentals/severity-vs-priority)
