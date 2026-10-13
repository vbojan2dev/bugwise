---
question: How would you verify in the database that an order was saved correctly?
short: Find the new order by its id or by my test user and time, compare every stored field with what the app showed, check the related rows such as order items and payments, and check that the numbers agree and nothing was duplicated.
category: practical
level: mid
lookingFor: A structured approach that goes beyond "SELECT the row" to related tables, totals, duplicates, timestamps and side effects, done safely with read-only access.
pitfalls:
  - Only checking that a row exists.
  - Forgetting related tables like order items, payments or coupon usage.
  - Not checking for duplicate orders after a double tap or a retry.
  - Changing data to "fix" what you find instead of reporting it.
order: 12
---

I'd treat the database as the second half of the expected result.

1. **Find the record.** Use the order number from the confirmation screen: `SELECT * FROM orders WHERE id = 1007;`. Without it: `WHERE user_id = <my test user> ORDER BY created_at DESC LIMIT 5`.
2. **Compare the fields the app showed.** Total, status, restaurant, delivery address, coupon.
3. **Check the fields it didn't show.** Foreign keys point to the right user and restaurant, `coupon_id` is set when I used a coupon, timestamps are in the expected time zone, nothing important is unexpectedly NULL.
4. **Check related tables.** `SELECT * FROM order_items WHERE order_id = 1007;` Right dishes, quantities and prices. Then payments, coupon usage, stock or loyalty points, whatever the feature touches.
5. **Check that numbers agree.** The order total equals `SUM(quantity * unit_price)` minus discounts, rounded to cents.
6. **Check for duplicates and side effects.** Exactly one order was created, even after a double tap or a network retry, and nothing else changed unexpectedly.

I do all of this read-only. If something is wrong, I put the queries and their results into the bug report so developers can reproduce it, and I say which layer is broken: if the database is right but the screen is wrong, it's a front-end bug; if the stored data is already wrong, it's the back end.

Learn more: [SQL for Testers](/tutorials/sql-for-testers)
