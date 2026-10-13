---
question: What would you check when testing a login screen?
short: Valid and invalid credentials, field validation, error messages, password masking, account lockout, forgot password, session handling, security basics, accessibility and platform behavior.
category: practical
level: junior
lookingFor: A structured answer that groups checks into categories (functional, negative, UI, security, accessibility, mobile/web specifics) rather than a random list.
pitfalls:
  - Only testing a valid and an invalid password.
  - Forgetting security checks like lockout and error messages that reveal too much.
  - Not asking clarifying questions about the requirements.
order: 1
---

I would first ask a few questions: what login methods are supported (email, phone, Google/Apple, biometrics)? What are the password rules and lockout policy? Then I would group my checks:

**Functional (positive)**

- Valid email and password logs in and opens the right screen.
- "Remember me" / staying logged in works after closing the app.
- Social and biometric login, if supported.

**Negative and validation**

- Wrong password, unregistered email, empty fields.
- Email with spaces before or after, uppercase letters.
- Very long input, emojis, pasted values.
- No internet or slow network: clear message, no endless spinner.

**Security**

- Password is masked, with a working show/hide toggle.
- Error message does not reveal which field was wrong ("Incorrect email or password").
- Account locks or slows down after several wrong attempts.
- Logout really ends the session; the back button does not show private data.

**UI and usability**

- Correct keyboard type (email keyboard), autofill and password managers work.
- Tab/Next order between fields, Log in button state.
- "Forgot password" link works end to end.

**Accessibility and platform**

- Screen reader labels, large text, dark mode, rotation.
- On web: Enter key submits, works in all supported browsers.

Learn more: [Login and Sign Up](/features/login-and-sign-up)
