---
question: What do you use browser DevTools for as a manual tester?
short: To read console errors, inspect network requests and responses, check storage and cookies, simulate devices and slow networks, and inspect elements. All of it makes bug reports much more precise.
category: web
level: junior
lookingFor: Practical use of the main DevTools panels and how they improve bug reports and investigation, not developer-level debugging.
pitfalls:
  - Saying DevTools are only for developers.
  - Only knowing how to open the console.
  - Not connecting DevTools findings to better bug reports.
order: 3
---

DevTools let me see what happens behind the page, so I can tell whether a bug is in the front end or the backend.

- **Console:** JavaScript errors and warnings. A red error when clicking "Save" is great evidence for a bug report.
- **Network:** every request the page makes, its **status code**, request payload, response and timing. If Save shows "Success" but the request returned 500, I've found the real bug. I can also **throttle** the network (for example to 3G or Slow 4G) or go offline.
- **Application / Storage:** cookies, localStorage, sessionStorage. I can clear them to test as a new user or check that a token is removed after logout.
- **Elements:** inspect HTML and CSS, check alt text and labels, temporarily edit text to test very long values.
- **Device mode:** quick responsive checks on phone and tablet sizes.
- **Lighthouse:** basic performance and accessibility audits.

**In bug reports** I attach the console error, the failing request (URL, status, response) or a HAR file, so developers know where to look straight away.

**Example:** a search showed "No results" for every query. The Network tab showed a 401 response, so the real problem was an expired session, not the search itself.

Learn more: [DevTools for Testers](/web/devtools-for-testers)
