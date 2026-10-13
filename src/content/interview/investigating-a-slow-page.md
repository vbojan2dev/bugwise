---
question: A user says "the page is slow". How do you investigate?
short: Clarify what, where and when it is slow, reproduce it, then use the DevTools Network and Performance panels (and Lighthouse) to find whether the time goes to the server, large files, too many requests or the browser, and report it with numbers.
category: web
level: mid
lookingFor: A structured investigation (clarify, reproduce, measure, isolate, report) and the ability to tell backend slowness from front-end slowness using basic tools.
pitfalls:
  - Reporting "it's slow" without measurements.
  - Testing only on a fast office network and powerful laptop.
  - Jumping to conclusions without isolating the cause.
order: 9
---

**1. Clarify.** Which page or action? Slow to load, or slow to respond to a click? All the time or at peak hours? Which device, browser, network and location? For one user or many?

**2. Reproduce and measure.** I open the page with DevTools, preferably in a fresh profile with cache disabled, and also try with throttling (slow 4G, CPU slowdown) to mimic a real phone.

**3. Find where the time goes.**

- **Network tab:** is one API request taking 6 seconds? That points to the **backend** (check the "waiting for server" time). Are there huge images, many requests, or files blocking the page?
- **Performance tab / Lighthouse:** long JavaScript tasks, layout shifts, Core Web Vitals like LCP.
- Compare **environments** and **accounts**: maybe it's only slow for users with 5,000 orders.

**4. Report with facts.** "Order history takes 7.8 s to load for account X; `GET /orders` takes 7.2 s and returns 4 MB. Other pages load in under 1 s." Attach a HAR file or Lighthouse report.

**5. Follow up.** After the fix, measure again the same way. For load and stress problems, I'd involve someone running performance tests with tools like JMeter or k6.

Learn more: [Performance Basics](/web/performance-basics)
