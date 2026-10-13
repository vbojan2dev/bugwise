---
question: How do you test authentication and authorization in an API?
short: With test accounts on a test environment, check that missing, invalid, expired and edited tokens get 401 everywhere, that the wrong role gets 403, and that one user's token can never read or change another user's objects.
category: web
level: mid
lookingFor: A clear split between authentication (who are you, 401) and authorization (what may you do, 403/404), concrete horizontal (IDOR) and vertical tests across all methods, and an ethical approach.
pitfalls:
  - Mixing up 401 and 403.
  - Only testing GET and forgetting PATCH, PUT and DELETE on someone else's object.
  - Trusting that a hidden button means the endpoint is protected.
  - Suggesting these tests on production or without permission.
order: 12
---

I split it into two questions: **who is calling** (authentication) and **what may they do** (authorization). I only do this on a test environment, with test accounts and the team's OK.

**Authentication: expect 401**

- No `Authorization` header, a malformed one (`Bearer abc`), an **expired** token and a token whose payload I edited (for example `role` changed to `admin`, old signature kept).
- I check **every** protected endpoint, not a sample. One endpoint that skips the expiry check is enough to keep a stolen token alive.
- If it's a JWT, I decode it and check `exp` and the claims, remembering that decoding isn't verifying.

**Authorization: expect 403 or 404**

- **Horizontal (IDOR):** two users with the same role, Anna and Ben. With Anna's token I request Ben's order, address and invoice by id, with GET, PATCH and DELETE, and also ids hidden in query parameters or bodies. Expected: 404 or 403 and no data.
- **Vertical:** a customer token on admin endpoints (`GET /admin/users`, `POST /refunds`). Expected: 403 and **no side effect**, which I confirm with a follow-up request.
- **Sneaky fields:** a profile update with `"role": "admin"` must be ignored or rejected.

I like to write a small **role × endpoint matrix** (anonymous, own, other user's, admin) so nothing is skipped, and save the requests in a Postman collection so they run on every release. Findings go to the team's private security channel.

Learn more: [API Testing in Depth](/web/api-testing-in-depth)
