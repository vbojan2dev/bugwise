---
question: How would you test a pen (or a lift / elevator)?
short: Clarify the requirements first, then cover functional, usability, performance, compatibility, safety and edge cases in a structured way.
category: practical
level: junior
lookingFor: Structured thinking, starting with questions about requirements and users, then organizing ideas into categories instead of listing random checks.
pitfalls:
  - Jumping straight into a random list of ideas without asking questions.
  - Only covering the happy path ("it writes").
  - Forgetting safety and non-functional aspects.
order: 2
---

The interviewer is not interested in pens. They want to see **how you think**. So start with **questions**, then work through **categories**.

**1. Clarify requirements.** Who is it for (kids, office, astronauts)? Ballpoint or fountain? What surfaces should it write on? Any price or lifetime targets?

**2. Then structure the tests (example: a lift):**

- **Functional:** pressing a floor button takes you to that floor; doors open and close; the display shows the correct floor; up/down call buttons on each floor work; emergency button and phone connect to help.
- **Usability:** buttons reachable from a wheelchair, Braille on buttons, audio floor announcements, clear labels.
- **Performance:** time to arrive after a call; behavior at rush hour with calls from many floors; maximum load.
- **Safety:** overload alarm and refusal to move; doors reopen when something blocks them; behavior during a power cut or fire alarm; it never moves with doors open.
- **Edge and negative cases:** pressing all buttons at once; pressing the current floor; pressing a button many times; pressing "close door" while someone enters.
- **Compatibility / environment:** works in heat, cold and humidity.

For a pen, the same structure applies: does it write (functional), is it comfortable (usability), how many pages until the ink runs out (performance), is the cap safe if swallowed by a child (safety), does it write upside down or on wet paper (edge cases).

Finish by saying how you would **prioritize**: safety first, then core functions.

Learn more: [Types of Testing](/fundamentals/types-of-testing)
