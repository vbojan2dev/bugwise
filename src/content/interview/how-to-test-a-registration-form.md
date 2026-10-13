---
question: How would you test a registration form?
short: Clarify the rules first, then group tests into happy path, field validation, real-world data, validation behavior, whole-form behavior (double submit, server errors, Back), server-side checks, security and accessibility.
category: practical
level: junior
lookingFor: A structured answer that starts with questions about the requirements and groups checks into clear categories, including server-side validation, real-world data and what happens when submitting fails.
pitfalls:
  - Only testing one valid and one invalid email.
  - Forgetting that the server must validate too, not only the app.
  - Never checking that the entered data was actually saved correctly.
  - Ignoring double submit, server errors and data loss.
order: 8
---

I'd start with questions: which fields are required, what are the rules for each one (length, format, allowed characters), which countries and languages are supported, and what happens after sign up (confirmation email, automatic login, an existing email)?

Then I'd group my tests:

**Happy path**

- Sign up with valid data, open the confirmation email, log in with the new account.
- Check every value was saved exactly as entered: on the profile, in emails, in the admin panel or database.

**Each field**

- Empty, spaces only, valid and invalid classes, and the boundaries: minimum, maximum and one beyond.
- Required vs optional matches the spec.

**Real-world data**

- Names like `O'Brien`, `Đorđe`, `Anne-Marie` or a single name.
- Emails with `+` and subdomains, phone numbers with spaces and a country code, postcodes from every supported country.
- Age rules on the exact birthday, spaces before and after, pasted text, emoji.

**Validation behavior**

- Errors appear on blur or submit (not while typing), say how to fix the problem, sit next to the field, and clear once fixed.
- After a failed submit, focus goes to an error summary or the first invalid field, and nothing typed is lost.

**Whole form**

- Double tap or double Enter on submit: one account. Email already registered. Server error, no connection, session timeout: clear message, input kept. Back and refresh after submitting.

**Server-side**

- Send invalid data straight to the API with Postman or DevTools. The server must reject it, not only the app.

**Security, accessibility and platforms**

- No personal data in the URL, password masked, rate limiting on sign up, marketing consent unticked by default.
- Screen reader labels and error announcements, keyboard only, large text, contrast.
- The right keyboards and AutoFill on iOS and Android, password managers in browsers.

Learn more: [Forms and Validation](/features/forms-and-validation)
