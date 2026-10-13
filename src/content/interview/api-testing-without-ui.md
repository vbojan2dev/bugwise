---
question: How do you test an API without a UI, for example with Postman?
short: Send requests directly to the endpoints with Postman, check status codes, response body, headers and timing, and test invalid input, missing auth and edge cases just like you would in the UI.
category: web
level: mid
lookingFor: Understanding of requests (method, URL, headers, body), what to verify in responses, negative and auth tests, and practical Postman features like environments and variables.
pitfalls:
  - Only checking that the status is 200.
  - Not testing without authentication or with another user's data.
  - Hardcoding tokens and URLs instead of using environments.
order: 6
---

An API is how the app talks to the server. Testing it directly lets me find bugs before the UI exists and isolate whether a problem is front end or backend.

**A request has:** a method (GET, POST, PUT, PATCH, DELETE), a URL, headers (like `Authorization`), and often a JSON body. I get these from the API docs (Swagger/OpenAPI) or by copying a request from the DevTools Network tab.

**What I check in the response**

- **Status code:** 201 after creating, 400 for bad input, 401 without a token, 404 for a missing item.
- **Body:** correct fields, types and values; no sensitive data like password hashes.
- **Headers** and **response time**.
- **Side effects:** the item really exists afterwards (follow up with a GET).

**Tests I write**

- Valid request (happy path).
- Missing required fields, wrong types, too-long values, empty body.
- No token, expired token, and **another user's ID** (can user A read user B's order?).
- Duplicates, boundary values, pagination limits.

**Postman basics:** collections to group requests, **environments** for dev/staging URLs and tokens, variables, and simple **tests** (`pm.expect`) so a collection can be re-run as a quick regression check.

Learn more: [API Testing with Postman](/web/api-testing-with-postman)
