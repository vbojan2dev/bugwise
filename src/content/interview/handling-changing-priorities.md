---
question: How do you handle it when priorities change in the middle of a sprint or your testing is interrupted by urgent work?
short: I clarify the new priority and what it replaces, save the state of my current work so I can come back to it, tell the team what will now be delayed, and make sure nothing half-tested is mistaken for finished.
category: behavioral
level: mid
lookingFor: Flexibility without chaos, clarifying trade-offs with the person who set the priority, good handover and note-taking habits, and transparent communication about what is now at risk.
pitfalls:
  - Silently dropping the old work, so it looks tested when it isn't.
  - Trying to do everything at once and finishing nothing.
  - Complaining instead of clarifying the trade-off.
order: 9
---

Changing priorities are normal, especially around releases and production issues. What matters is that nothing gets lost and everyone knows the impact.

**1. Clarify the change**

"Should I stop the checkout testing completely, or finish the critical part first?" I make sure I know what's more important now and what's being pushed back, and who decided.

**2. Save my state**

Before switching, I take two minutes to note what I tested, what's left, open questions and any suspicious behavior. I update the ticket so it clearly shows **"partly tested"**, not "done".

**3. Communicate what moves**

I tell the team or the product owner: "I'm switching to the production issue. The new filter feature won't be tested today, so it may not make tomorrow's build." That way the delay is a known decision, not a surprise.

**4. Focus on the new task**

I give the urgent work my full attention instead of switching back and forth all day.

**5. Come back and review**

When I return, I re-read my notes and check whether anything changed in the meantime, like a new build or a changed requirement.

**Example:** in the middle of testing a new loyalty program, a payment bug hit production. I noted where I was, moved the ticket back to "In testing" with a comment, and helped reproduce and verify the hotfix. The next morning, my notes let me continue in minutes, and the PM already knew the loyalty feature would be a day late.

Learn more: [Working with Jira](/tutorials/working-with-jira)
