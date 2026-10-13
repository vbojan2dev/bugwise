---
question: How would you test a POST endpoint, for example one that creates an order?
short: Start with a valid request and confirm the created data with a GET, then break one thing at a time (missing, extra, wrong-type, empty or null fields, boundaries, invalid enums, malformed JSON, wrong Content-Type), test auth and duplicates, and check every response body.
category: web
level: mid
lookingFor: A structured approach that starts from the docs, covers positive, negative and boundary cases, auth, idempotency and side effects, and checks the database or a follow-up GET.
pitfalls:
  - Only sending the happy path.
  - Changing several fields at once, so you can't tell which one caused the result.
  - Accepting a 500 for bad input.
  - Forgetting duplicate submissions and retries.
order: 14
---

I start from the docs (OpenAPI/Swagger): required fields, types, ranges and the documented status codes. Then:

**Happy path**

- A valid body returns **201**, a `Location` header and the new order. A follow-up `GET /orders/{id}` and, if I can, a database query show the same data. Server-calculated fields like `total` and `status` are right.

**Negative and boundary, one change at a time**

- Remove each required field in turn → 400 naming that field.
- Wrong types: `"quantity": "2"`, `2.5`, an object instead of an array.
- Empty string, `null` and a missing field are three separate tests.
- Boundaries: if quantity is 1–20, try 0, 1, 20, 21 and -1. Huge values and very long text.
- Invalid enum values (`"paymentMethod": "bitcoin"`), unknown ids (`"restaurantId": 999`).
- Malformed JSON → 400; `Content-Type: text/plain` → 415 (or 400).
- Extra fields like `"total": 0` or `"status": "delivered"` must be ignored or rejected, never applied.

**Auth and duplicates**

- No token, expired token → 401. Wrong role → 403. Referencing another user's address → rejected.
- Send the same request twice. With the same `Idempotency-Key` there should be only one order.

Every response gets checked beyond the status: a 4xx with a clear message, no stack traces, and no order created when the request failed.

Learn more: [API Testing in Depth](/web/api-testing-in-depth)
