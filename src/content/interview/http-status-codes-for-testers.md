---
question: Which HTTP status codes should a tester know?
short: Know the groups (2xx success, 3xx redirect, 4xx client error, 5xx server error) and the common ones like 200, 201, 204, 301, 302, 400, 401, 403, 404, 409, 429, 500, 502, 503 and 504.
category: web
level: junior
lookingFor: The meaning of the code groups, the common codes, and how they help decide who owns a bug and what the expected behavior is.
pitfalls:
  - Mixing up 401 and 403.
  - Assuming a 200 status means everything worked.
  - Not knowing that 5xx usually points to a server-side problem.
order: 7
---

Every response from the server has a status code. The **first digit** tells you the group:

| Code | Meaning | Tester's note |
| --- | --- | --- |
| **200** OK | Success | Still check the body; a 200 can contain an error message. |
| **201** Created | New item created | Expected after a successful POST. |
| **204** No Content | Success, empty body | Common for DELETE. |
| **301 / 302** | Redirect | Check old URLs redirect correctly. |
| **400** Bad Request | Invalid input | Should come with a clear validation message. |
| **401** Unauthorized | Not logged in / bad token | App should send the user to login. |
| **403** Forbidden | Logged in, but not allowed | Good sign in access-control tests. |
| **404** Not Found | Doesn't exist | Show a friendly page, not a blank screen. |
| **409** Conflict | Duplicate or clash | For example, email already registered. |
| **429** Too Many Requests | Rate limited | Expected after many login attempts. |
| **500** Internal Server Error | Server crashed | Almost always a backend bug. |
| **502 / 503 / 504** | Gateway, unavailable, timeout | Infrastructure or slow services. |

**Why it matters:** in DevTools or Postman, the status code tells me where to look. A 500 goes to the backend developer; a 200 with wrong data displayed may be a front-end bug. And the UI should handle every error code gracefully.

Learn more: [API Testing with Postman](/web/api-testing-with-postman)
