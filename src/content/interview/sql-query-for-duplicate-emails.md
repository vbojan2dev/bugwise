---
question: Write a query that finds duplicate email addresses in a users table.
short: "SELECT LOWER(email), COUNT(*) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1. Group by the value that should be unique and keep the groups with more than one row."
category: practical
level: junior
lookingFor: Correct use of GROUP BY with HAVING COUNT(*) > 1, awareness that duplicates can hide behind capitalization or spaces, and a next step to see the actual accounts.
pitfalls:
  - Putting COUNT(*) in WHERE instead of HAVING.
  - Using DISTINCT, which hides duplicates instead of finding them.
  - Ignoring case and whitespace differences, so Mia.Novak@mail.test and mia.novak@mail.test aren't caught.
order: 11
---

Group by the value that should be unique, count each group, and keep only groups with more than one row:

```sql
SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS accounts
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
```

- `GROUP BY` makes one row per email.
- `HAVING` filters the groups **after** counting. `WHERE COUNT(*) > 1` would fail, because WHERE runs before anything is counted.
- `LOWER` and `TRIM` catch duplicates that differ only in capitals or spaces. Email providers treat the address part before the @ as case-insensitive in practice, so the app should too.

To see the actual accounts behind each duplicate:

```sql
SELECT id, email, signed_up
FROM users
WHERE LOWER(TRIM(email)) IN (
  SELECT LOWER(TRIM(email)) FROM users
  GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1
)
ORDER BY LOWER(email), signed_up;
```

As a tester I'd report it as a sign-up bug (uniqueness is checked case-sensitively), include the query and the ids, and mention the impact, for example the same person getting two welcome coupons.

Learn more: [SQL for Testers](/tutorials/sql-for-testers)
