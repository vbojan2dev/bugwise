---
question: You join a company building a new product from scratch. How do you create the test strategy?
short: Start from the product's risks and the team's constraints, not from a template. Agree on quality goals, what each test level covers, the manual/automation split, environments, devices and release criteria, then keep it short and revisit it as the product grows.
category: strategy
level: senior
lookingFor: A risk-driven approach that starts with understanding the business and users, clear decisions about who tests what and at which level, realistic trade-offs for an early-stage product, and a strategy that is agreed with the team rather than written alone.
pitfalls:
  - Copying a 40-page template before understanding the product.
  - Treating the strategy as a QA-only document instead of a team agreement.
  - Planning heavy UI automation for screens that will change every week.
  - Never revisiting it after the first version.
order: 1
---

I don't start by writing. I start by **listening**, because a strategy is only useful if it fits this product, this team and this stage.

**1. Understand the product and its risks (first 1-2 weeks)**

- Who are the users, and what would hurt them most? Losing money, losing data, a broken sign-up, a privacy leak?
- What are the business goals for the first release: speed to market, a pilot with one big customer, an app store launch?
- Is there regulation? Payments, health data, accessibility laws in the target markets.
- Which parts are complex or new for the team, such as a third-party payment provider or offline sync?

**2. Make the key decisions with the team**

- **Quality goals:** what "good enough to release" means here, in plain words.
- **Test levels:** what developers cover with unit and API tests, what I cover with exploratory and end-to-end testing, and where we need contract or integration tests.
- **Manual vs automation:** in an early product the UI changes constantly, so I'd invest early in API checks and a small smoke suite, and keep the rest exploratory until flows stabilize.
- **Environments and test data:** at least one stable test environment, a way to create accounts and orders quickly, and production-like data that is safe to use.
- **Platforms:** an initial device and browser policy based on the target market, to be replaced with real analytics after launch.
- **Bugs and releases:** how bugs are triaged, which severities block a release, who makes the go/no-go call.

**3. Keep it short and alive**

I write it as one or two wiki pages, review it with the developers and product owner, and put a date on it to revisit after the first release, because a pre-launch strategy and a strategy for a product with 100,000 users are different things.

**Example:** on a new fintech app, the biggest risks were the card top-up flow and identity verification. We agreed that every change there needed API tests plus a manual end-to-end pass on real devices, while profile and settings screens only got exploratory testing. That one decision shaped most of our effort.

Learn more: [Writing a Test Plan](/tutorials/writing-a-test-plan)
