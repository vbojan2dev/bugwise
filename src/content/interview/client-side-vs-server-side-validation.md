---
question: "Client-side vs server-side validation: what's the difference, and why test both?"
short: Client-side validation runs in the app or browser and gives quick feedback; server-side validation runs on the server and is the only check you can trust, because the app's checks can be skipped. Test that both exist and agree.
category: web
level: junior
lookingFor: That you know client-side checks are for user experience and can be bypassed, that the server must enforce every rule, and that you know how to test it (calling the API directly, editing requests).
pitfalls:
  - Saying client-side validation is enough because "users can't type invalid data".
  - Not knowing how to bypass the app to test the server.
  - Forgetting that iOS, Android and web may each have different client rules.
order: 17
---

**Client-side validation** runs in the app or the browser before anything is sent. It gives instant feedback: "Enter an email like name@example.com", "Use at least 8 characters". It's there for the **user's** convenience.

**Server-side validation** runs on the server when the request arrives. It repeats the same rules and adds checks only the server can do: is the email already registered, is the item in stock, is this the fifth sign up from the same IP in a minute? It's there to **protect** the data and the business.

**Why test both?**

- Client-side checks can be skipped: anyone can call the API with Postman or curl, change a request with a proxy tool or DevTools, or use an old app version without the newest rules.
- The iOS app, the Android app and the website often have their **own** client rules, which drift apart. The server is the one place they all meet.
- If only the client checks, bad data gets into the database and breaks other screens, reports or apps later. Sometimes it's a security problem (XSS, SQL injection).

**How I test it**

1. Note each rule the app enforces (lengths, formats, required fields, age).
2. Capture a valid request in DevTools or a proxy tool.
3. Send it again with each rule broken: too long, wrong format, missing field, an underage date of birth.
4. Expect a validation error (often `400` or `422`) with a clear message per field, and no data saved.

I also check the two layers **agree**: if the app accepts `anna+shop@mail.com` but the server rejects it, users get a confusing error after submitting.

Learn more: [Forms and Validation](/features/forms-and-validation)
