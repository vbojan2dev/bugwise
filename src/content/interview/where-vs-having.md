---
question: What is the difference between WHERE and HAVING in SQL?
short: WHERE filters individual rows before grouping. HAVING filters groups after GROUP BY, so it can use aggregates like COUNT(*) or SUM().
category: web
level: mid
lookingFor: The order of evaluation (WHERE, then GROUP BY, then HAVING), a working example that uses both, and a practical tester use such as finding duplicates.
pitfalls:
  - Saying they are interchangeable.
  - Trying to use COUNT or SUM in WHERE.
  - Putting plain row filters in HAVING, which works in some databases but is slower and harder to read.
order: 11
---

They filter at different moments:

1. `FROM` / `JOIN` builds the rows.
2. `WHERE` removes **rows**. Aggregates don't exist yet, so `WHERE COUNT(*) > 1` is an error.
3. `GROUP BY` folds the remaining rows into groups and calculates `COUNT`, `SUM`, `AVG`…
4. `HAVING` removes **groups**, using those aggregates.

```sql
SELECT user_id, COUNT(*) AS orders, SUM(total) AS spent
FROM orders
WHERE status <> 'canceled'      -- ignore canceled orders (rows)
GROUP BY user_id
HAVING COUNT(*) >= 2;           -- users with 2+ real orders (groups)
```

**Tester uses:** `HAVING COUNT(*) > 1` finds duplicates (emails, coupon uses, payment ids), and `HAVING` with `SUM` finds orders whose total doesn't match their items.

Learn more: [SQL for Testers](/tutorials/sql-for-testers)
