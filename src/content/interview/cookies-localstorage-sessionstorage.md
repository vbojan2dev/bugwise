---
question: What is the difference between cookies, localStorage and sessionStorage?
short: Cookies are small and sent to the server with every request (often used for sessions); localStorage stays in the browser until cleared; sessionStorage lives only as long as the tab.
category: web
level: junior
lookingFor: The key differences (lifetime, sent to server or not, scope) and what that means for testing logout, sessions and privacy.
pitfalls:
  - Saying they are all the same thing.
  - Not knowing which one is sent to the server.
  - Not linking the difference to real test cases.
order: 4
---

All three store data in the browser, but they behave differently:

| | Cookies | localStorage | sessionStorage |
| --- | --- | --- | --- |
| Sent to server | Yes, with every request | No | No |
| Lifetime | Until expiry date, or until browser closes | Until cleared | Until the tab closes |
| Size | About 4 KB | About 5-10 MB | About 5-10 MB |
| Shared between tabs | Yes | Yes (same origin) | No, per tab |
| Typical use | Login session, consent | Preferences, cart, theme | One-time form steps |

**Why it matters for testing**

- **Logout:** check that session cookies and tokens in storage are really removed. Then press Back; private data should not appear.
- **New user:** clear storage in DevTools to test first-visit behavior (onboarding, cookie banner).
- **Multiple tabs:** a cart in localStorage appears in a second tab; a wizard in sessionStorage does not.
- **Security:** session cookies should have `HttpOnly`, `Secure` and `SameSite` flags, and sensitive data should not sit in localStorage in plain text.
- **Consent:** if the user rejects non-essential cookies, tracking cookies should not appear.

You can see and edit all three in DevTools under **Application** (Chrome) or **Storage** (Firefox).

Learn more: [Cookies, Sessions and Storage](/web/cookies-sessions-and-storage)
