---
question: What do you do with a bug you saw once but can't reproduce?
short: Write down everything I remember right away, save any evidence such as logs and recordings, then try to reproduce it by varying one condition at a time. If it still won't reproduce, I report it honestly as intermittent with the frequency and evidence, rather than dropping it.
category: bugs
level: mid
lookingFor: A systematic approach to intermittent bugs, knowledge of typical causes (timing, data, state, network, device), evidence gathering, and honest reporting instead of hiding or exaggerating the bug.
pitfalls:
  - Ignoring it because it only happened once.
  - Reporting it as "always" reproducible to get attention.
  - Changing many conditions at once, so you never learn what matters.
  - Not saving logs right away, before they're overwritten.
order: 5
---

Bugs that happen "sometimes" are often the most serious ones in production, so I don't ignore them.

**1. Capture what I have, immediately**

- Notes: exact time, build, device, account, what I did just before, network.
- **Logs** before they're overwritten: browser console and network tab, `adb logcat` on Android, device logs on iOS.
- A screenshot or, ideally, a screen recording. I often keep recording running during exploratory sessions for exactly this reason.
- Check the **crash reporting tool** or server logs for that time.

**2. Think about what could make it intermittent**

- **Timing:** double taps, slow responses, a race between two requests.
- **State:** first launch vs later, logged in for a long time, app returning from background.
- **Data:** a specific account, item, long text, special characters, an expired token.
- **Environment:** network switch, low memory, another device or OS version, a time zone or date.

**3. Vary one condition at a time**

Repeat the steps with a slow network, then with a different account, then after backgrounding the app. Changing one thing at a time tells me what matters.

**4. Report it honestly**

If I still can't reproduce it reliably, I report it as **intermittent**: "Seen 1 time in about 20 attempts", with all evidence and what I already tried. I ask the developer to look at the logs; sometimes the stack trace alone is enough to find the cause.

**Example:** a cart sometimes showed an empty list. After trying different things, it happened only when I tapped the Cart tab within a second of adding an item. It was a race between two API calls, which the developer fixed once I gave him that detail.

Learn more: [How to Write a Bug Report](/tutorials/writing-bug-reports)
