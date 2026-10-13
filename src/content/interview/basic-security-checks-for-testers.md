---
question: What basic security checks can a manual tester do?
short: On a test environment and with permission, check access control with two accounts, login and session handling, input handling, sensitive data exposure, HTTPS and rate limiting, and report findings privately.
category: web
level: mid
lookingFor: Practical, ethical checks focused on access control and sessions, awareness of OWASP Top 10, and a responsible attitude (test environments, permission, private reporting).
pitfalls:
  - Suggesting attacks on production or systems you don't have permission to test.
  - Claiming a manual tester can replace a penetration test.
  - Reporting a security bug in a public channel.
order: 8
---

I'm not a penetration tester, but many serious security bugs are easy to spot with simple checks. I only do this **on test environments, with permission**.

**Access control (the most common real problem)**

- With two test accounts, open user A's order URL as user B, or change an ID in the URL or API request. You should get 403 or 404, never someone else's data.
- A normal user can't reach admin pages by typing the URL.

**Authentication and sessions**

- Wrong-login messages don't reveal whether the email exists.
- Lockout or rate limiting after many attempts.
- Logout and password change really end sessions; the Back button doesn't show private data.

**Input handling**

- Special characters, very long input and simple script tags in text fields are shown as text, not executed.
- File uploads reject unexpected types and huge files.

**Data exposure**

- No passwords, tokens or personal data in URLs, logs, error messages or API responses that don't need them.
- HTTPS everywhere; cookies use `Secure` and `HttpOnly`.

**Reporting:** security bugs go to a **restricted ticket** or the security contact, not a public channel. I use the OWASP Top 10 as a map of what to look for.

Learn more: [Security Basics for Testers](/web/security-basics)
