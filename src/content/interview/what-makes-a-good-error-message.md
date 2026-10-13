---
question: What makes a good error message in a form?
short: It's specific and says how to fix the problem, in plain language, next to the field, not shown by color alone, announced to screen readers, and it never clears what the user typed.
category: web
level: junior
lookingFor: Concrete qualities (specific, actionable, placed next to the field, accessible, input kept) and an example of a bad message turned into a good one.
pitfalls:
  - Only talking about wording and forgetting placement, timing and accessibility.
  - Accepting "Something went wrong" or error codes as fine.
  - Forgetting that the user's input must survive the error.
order: 18
---

A good error message helps the user fix the problem in one try. I check these things:

- **Specific and actionable.** "Enter a postcode like SW1A 1AA" instead of "Invalid input". It says what's wrong **and** how to fix it.
- **Plain language.** No codes ("Error 422"), no jargon ("regex mismatch"), no blame ("illegal value").
- **Next to the field.** The message sits under the field, and the field itself is marked. On long forms, an error summary at the top lists all problems as links that move focus to each field.
- **Not color only.** Red border plus text plus an icon, so people who can't see red still notice it (WCAG 1.4.1 Use of Color).
- **Accessible.** The field is marked invalid (`aria-invalid`), the message is linked to it (`aria-describedby`), and after a failed submit focus moves to the summary or the first invalid field.
- **Right timing.** It appears when the user leaves the field or submits, not while they're still typing, and disappears as soon as the value is fixed.
- **Input kept.** Nothing the user typed is cleared because of an error.
- **Safe.** It doesn't reveal more than it should, for example whether an email has an account on a login or reset screen.

Server errors need the same care: "We couldn't save your address right now. Your details are kept, please try again" is far better than "Something went wrong".

Example rewrite: "Invalid date" → "Enter a real date of birth, like 27 3 1995".

Learn more: [Forms and Validation](/features/forms-and-validation)
