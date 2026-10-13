---
question: What is the difference between INNER JOIN and LEFT JOIN?
short: INNER JOIN returns only rows that have a match in both tables. LEFT JOIN returns every row from the left table and fills the right side with NULL when there's no match, which is how you find missing data.
category: web
level: junior
lookingFor: A correct definition with a concrete example, and ideally the tester's use of LEFT JOIN with IS NULL to find records that are missing their partner.
pitfalls:
  - Saying they return the same rows "in a different order".
  - Not knowing what appears in the right-hand columns when there is no match (NULL).
  - Filtering the right table in WHERE after a LEFT JOIN and accidentally turning it back into an inner join.
order: 10
---

Both combine rows from two tables using a condition, usually foreign key = primary key, such as `ON oi.order_id = o.id`.

| | INNER JOIN | LEFT JOIN |
| --- | --- | --- |
| Rows kept | Only rows with a match on both sides | Every row from the left table |
| No match on the right | Row is dropped | Right-side columns are NULL |

**Example.** Orders 1001 and 1009 have items, order 1010 has none.

- `orders JOIN order_items` returns the items of 1001 and 1009. Order 1010 silently disappears.
- `orders LEFT JOIN order_items` also returns 1010, with NULL in the item columns.

**Why testers care:** LEFT JOIN plus `IS NULL` finds things that are missing:

```sql
SELECT o.id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE oi.id IS NULL;   -- orders without items
```

The same pattern finds users who never ordered or orphan rows. And it's a warning: a report built on an INNER JOIN hides exactly the broken records you're looking for.

One trap: after a LEFT JOIN, a condition like `WHERE oi.dish = 'Pizza'` removes the NULL rows again. Put conditions on the right table in the `ON` clause if you want to keep unmatched rows.

Learn more: [SQL for Testers](/tutorials/sql-for-testers)
