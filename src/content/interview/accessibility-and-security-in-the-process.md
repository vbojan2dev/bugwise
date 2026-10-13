---
question: How do you make accessibility and security part of the process instead of an afterthought?
short: Build them into the existing workflow, from acceptance criteria and design reviews to everyday test checklists, definition of done and the release checklist, with specialists for deeper audits. Small, regular checks by everyone beat one big audit before launch.
category: strategy
level: senior
lookingFor: Concrete ways to embed both topics into each stage of development, accurate references (WCAG, OWASP), realistic limits of what a manual tester can cover, and how to win support from the team and management.
pitfalls:
  - Treating accessibility or security as a one-time audit at the end.
  - Claiming automated scanners alone are enough.
  - Presenting yourself as a security expert or penetration tester when you aren't.
  - Getting the standards wrong, for example calling OWASP Top 10 a certification.
order: 9
---

Both topics fail in the same way: they're "important", but nobody owns them until a complaint, an audit or an incident arrives. My approach is to put them into the steps the team **already** follows.

**Accessibility**

- **Target:** WCAG 2.2 level AA is the usual target, and it's what many laws and contracts refer to.
- **Refinement:** add accessibility to acceptance criteria. "All controls have labels for screen readers; error messages are announced."
- **Design reviews:** check contrast (4.5:1 for normal text, 3:1 for large text and UI parts), touch target sizes, focus order and text scaling before code is written.
- **Testing:** a short accessibility checklist on every story: keyboard-only on web, VoiceOver and TalkBack on key flows, 200% text size, plus an automated scanner (such as axe or Lighthouse) to catch the easy issues. Scanners find only part of the problems, so manual checks stay.
- **Definition of done:** a story isn't done if it breaks the checklist.

**Security**

- **Know the common risks:** the OWASP Top 10 is an awareness list of the most critical web application security risks, and OWASP MASVS describes security requirements for mobile apps. I use them to guide test ideas, not as a certification.
- **Everyday checks a tester can do:** access control (can I see another user's order by changing an ID?), session handling after logout, sensitive data in logs, URLs or screenshots, input validation, rate limiting on login and OTP.
- **Threat questions in refinement:** "What if someone calls this API directly? What if they replay this request?"
- **Specialists for depth:** dependency scanning in the pipeline, and penetration tests by security professionals before major launches.

**Making it stick**

Short training for the whole team, a champion in each team, and showing real examples of what we found. One demo of using the app with a screen reader convinces more people than any document.

Learn more: [Accessibility Basics (WCAG)](/web/accessibility-basics) and [Security Basics for Testers](/web/security-basics)
