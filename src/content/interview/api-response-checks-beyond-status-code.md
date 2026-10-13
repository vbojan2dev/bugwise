---
question: What do you check in an API response besides the status code?
short: Headers, the schema (fields, types, required values), the values and business rules, consistency with the database and the UI, the quality of error messages, and that nothing sensitive leaks.
category: web
level: junior
lookingFor: Awareness that a 200 can still be wrong, a structured list of checks, and at least one concrete example of a leak or a schema problem.
pitfalls:
  - Stopping at "the status is 200".
  - Not reading error responses as carefully as success responses.
  - Not confirming a change with a follow-up GET.
order: 13
---

A 200 only means the server didn't complain. I check the response in layers:

1. **Status and headers.** 201 plus a `Location` header after a create, 204 after a delete, `Content-Type: application/json`, and `Cache-Control: no-store` on personal data.
2. **Schema.** All documented fields are there, spelled the same on every endpoint, with the right types: a price is a number, not `"12.50"`. Required fields are never `null`. In Postman I can automate this with `pm.response.to.have.jsonSchema(...)`.
3. **Values.** The total equals the items plus the delivery fee, dates have the right format and time zone, and enum values are only the documented ones.
4. **Consistency.** The data matches the database (a quick SQL query) and what the app shows. After an update or delete, I send a GET to prove the change was really saved.
5. **Error quality.** Errors have one consistent shape, name the field and the rule, and are readable.
6. **Leaks.** No password hashes, tokens, internal flags, other users' data, stack traces, SQL or server paths.

**Example:** a profile update returned 200 with the new phone number, which looked fine, but the body also contained `passwordHash` and an internal role field. A status-only test would never catch that.

Learn more: [API Testing in Depth](/web/api-testing-in-depth)
