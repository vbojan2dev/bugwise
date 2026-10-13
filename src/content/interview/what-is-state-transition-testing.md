---
question: What is state transition testing? Give an example.
short: It models a feature as states and the events that move between them, then tests both valid transitions and invalid ones that should be blocked. Great for orders, accounts, logins and media players.
category: test-design
level: junior
lookingFor: Understanding of states, events and transitions, a realistic example, and remembering to test invalid transitions too.
pitfalls:
  - Only testing the happy path through the states.
  - Not testing transitions that should be impossible.
  - Choosing an example without clear states.
order: 6
---

Some features behave differently depending on **what state they are in**. State transition testing models these states, the **events** that move between them, and checks each transition.

**Example: an online order**

- **States:** Placed, Paid, Shipped, Delivered, Canceled.
- **Valid transitions:** Placed to Paid (payment succeeds), Paid to Shipped, Shipped to Delivered, Placed or Paid to Canceled (user cancels).

**What I test**

1. Each **valid transition** at least once, and that the UI, emails and buttons match the new state.
2. **Invalid transitions:** can a Delivered order be canceled? Can a Canceled order be shipped? Can the user tap Cancel after it shipped? These should be blocked.
3. **Sequences:** full paths like Placed, Paid, Canceled, and refund issued.
4. **Repeated events:** pressing Pay twice, or a cancellation and a shipment happening at the same time.

**Another classic:** login with lockout. States: Active, 1 failed attempt, 2 failed, Locked. Test that a correct password resets the counter and that a Locked account can't log in even with the right password.

Drawing a simple **state diagram** first makes missing transitions easy to spot and is a good discussion tool with developers.

Learn more: [State Transition Testing](/fundamentals/state-transition-testing)
