---
question: "What is error guessing, and how do you use it?"
short: "Error guessing is choosing tests from experience of where software usually breaks, like empty or whitespace-only input, zero and negative numbers, leap days, denied permissions and slow networks. I use it after the systematic techniques, ideally from a written checklist."
category: test-design
level: junior
lookingFor: "A clear definition as an experience-based technique, concrete examples of typical guesses, and knowing it complements (not replaces) systematic techniques like equivalence partitioning and boundary values."
pitfalls:
  - "Saying it means \"randomly trying things\"."
  - "Giving no concrete examples."
  - "Presenting it as a replacement for systematic test design."
order: 16
---

**Error guessing** is an experience-based technique: I pick tests based on the mistakes developers typically make, not only on what the spec says.

**What I typically try**

- **Text:** empty, spaces only, very long, apostrophes like O'Neil, emoji, `<b>` tags.
- **Numbers:** 0, negative, too many decimals, other number formats (1.250,50 in Germany).
- **Dates and time:** 29 February, another time zone, midnight, daylight saving changes.
- **Actions:** the same thing twice, interrupting an action halfway (lock the phone, take a call).
- **Environment:** permissions denied, slow or lost network.

**How I make it reliable**

1. I cover the spec first with equivalence partitioning, boundaries or decision tables, so coverage is measurable.
2. Then I timebox an error-guessing session, often as part of exploratory testing.
3. I keep a **checklist** fed by real escaped bugs, and pick items by risk for each feature. A planned version of this, where you list likely failures and design a test to provoke each one, is called a **fault attack**.

The weakness is that it depends on experience and its coverage is hard to measure. That's why I combine it with systematic techniques instead of relying on it alone.

Learn more: [Error Guessing and Checklists](/fundamentals/error-guessing)
