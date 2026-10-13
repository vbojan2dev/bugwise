---
question: How would you approach testing a big migration or redesign, for example moving to a new backend or rebuilding the app?
short: Treat "it still works like before" as the main requirement. Inventory existing behavior, compare old and new side by side, test data migration and upgrade paths carefully, plan a gradual rollout with a way back, and watch production closely after the switch.
category: strategy
level: senior
lookingFor: Awareness that migrations hide undocumented behavior, a plan for data and upgrade testing, comparison testing against the old system, and a rollout and rollback plan rather than a single big-bang release.
pitfalls:
  - Testing only the new screens and assuming old behavior carries over.
  - Ignoring existing user data, sessions and saved settings.
  - Not asking how to roll back if the switch goes wrong.
  - Treating it as a normal sprint of feature testing.
order: 5
---

The hardest part of a migration is that most of the requirements are **unwritten**: the old system *is* the spec, including behavior nobody remembers adding.

**1. Inventory what exists**

- Map current features and flows, including edge cases: discount rules, rounding, time zones, deep links, emails, push notifications, integrations.
- Use analytics and support tickets to see what users actually do, and talk to support about "weird" behavior customers rely on.
- Decide with the product owner which differences are **intended** (the redesign) and which would be **regressions**.

**2. Compare old and new**

- Run the same scenarios in both systems and compare results: prices, totals, search results, generated documents.
- For backend migrations, compare API responses for the same inputs. Developers can often automate this comparison, and I focus on reviewing the differences.

**3. Test the data and the upgrade path**

- Existing accounts with **real-shaped data**: very old accounts, long names, special characters, users with thousands of orders.
- **Upgrade from the old app version** to the new one: are users still logged in, are settings, drafts and offline data kept?
- What happens to users who **don't update** the app but hit the new backend?

**4. Plan the rollout with a way back**

- Prefer a gradual switch: a feature flag, a percentage of traffic, or one market first.
- Ask early: **how do we roll back**, and what happens to data written in the new system if we do?
- Agree on what to monitor in the first days: error rates, failed payments, support tickets.

**Example:** in a checkout migration, comparing order totals between the old and new system revealed that the new one rounded tax per line instead of per order. It was a few cents per order, but it would have broken invoices for business customers.

Learn more: [Install, Update and Uninstall](/mobile/install-update-uninstall)
