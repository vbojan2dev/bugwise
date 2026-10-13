---
question: What is a decision table, and when would you use one?
short: A decision table lists every combination of conditions and the expected outcome for each, so you don't miss a rule. Use it when a feature has several conditions that together decide the result.
category: test-design
level: junior
lookingFor: A clear explanation with a small example, and knowing when the technique is useful (business rules with combinations).
pitfalls:
  - Describing it without an example.
  - Not knowing how many combinations there are (2 to the power of the number of yes/no conditions).
  - Forgetting that impossible or duplicate combinations can be removed.
order: 5
---

A **decision table** is a test design technique for business rules where **several conditions combine** to decide the result. Each column is a rule: one combination of conditions and its expected action.

**Example:** free shipping rule: "Members get free shipping. Non-members get it on orders over 50 EUR."

| | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- |
| Is member? | Yes | Yes | No | No |
| Order over 50 EUR? | Yes | No | Yes | No |
| **Free shipping** | Yes | Yes | Yes | **No** |

With two yes/no conditions there are 2 x 2 = **4 rules**, so 4 test cases. Three conditions give 8, and so on. Building the table often **reveals gaps in requirements**: "What about a member with a discount code that brings the total under 50?" is a question to ask the product owner before anything is built.

**When I use it:** discounts and pricing, loan or insurance eligibility, permissions by role, form logic that shows or hides fields.

If the table gets too big, I **merge** rules where a condition doesn't matter (R1 and R2 above: members always get free shipping) or combine it with pairwise testing.

Learn more: [Decision Tables](/fundamentals/decision-tables)
