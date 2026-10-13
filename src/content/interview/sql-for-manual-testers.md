---
question: How do you use SQL as a manual tester?
short: Mostly read-only. I use SELECT queries to check that the app saved the right data, find or confirm test data and preconditions, and investigate bugs so I can say which layer is broken.
category: practical
level: junior
lookingFor: Concrete, everyday uses of SQL in testing, an understanding that testers read rather than change shared data, and a sense of how database checks improve bug reports.
pitfalls:
  - Saying SQL is only for developers or automation engineers.
  - Describing UPDATE or DELETE on shared or production databases as normal tester work.
  - Listing SQL keywords without saying what you would actually check.
order: 10
---

I use SQL to look behind the screen. The UI shows a view of the data; the database shows what was really stored.

**What I use it for**

- **Verifying results.** After placing an order in the app, I run `SELECT * FROM orders WHERE id = 1007` and check the total, status and coupon, then the related rows in `order_items`. The screen can say "Success" while the saved data is wrong.
- **Finding test data.** "A user with a canceled order and no city saved" is one query instead of an hour of clicking.
- **Checking preconditions.** Before a test, I confirm the data it needs really exists.
- **Investigating bugs.** If the stored price is right but the screen shows the wrong one, it's a front-end bug. If the stored price is already wrong, it's a back-end bug. That makes my bug report much more precise, and I paste the query and result into it.
- **Data-quality checks.** Duplicates (`GROUP BY email HAVING COUNT(*) > 1`), orphan rows (a LEFT JOIN with `IS NULL`) and totals that don't match their items.

**Safety**

I work read-only on shared databases and never run `UPDATE` or `DELETE` on staging or production without the team's approval. If I need to create test data, I do it on my own test database, write the `SELECT` with the same `WHERE` first, and use a transaction where possible.

Learn more: [SQL for Testers](/tutorials/sql-for-testers)
