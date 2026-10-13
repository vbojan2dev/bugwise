---
question: How do you test a mobile app under different network conditions?
short: Test on slow, unstable and no connection, and while switching networks, using real-world situations plus tools like network throttling, airplane mode and proxy tools. Look for clear messages, retries and no data loss.
category: mobile
level: mid
lookingFor: Realistic network scenarios, knowledge of tools to simulate them, and clear expectations (feedback, timeouts, retries, offline behavior, no duplicates).
pitfalls:
  - Only testing on fast office Wi-Fi.
  - Only toggling airplane mode, never testing slow or flaky connections.
  - Not checking for duplicate requests after a retry.
order: 12
---

Office Wi-Fi is fast and stable; real users are on trains, in elevators and on cheap data plans.

**Scenarios I test**

- **No connection** at launch and in the middle of a flow.
- **Slow connection** (3G-like): loading indicators, timeouts, images loading progressively.
- **Flaky connection:** requests that fail halfway.
- **Switching** from Wi-Fi to mobile data during an upload or video.
- **Captive portal** (hotel Wi-Fi that needs a login page).
- **Connection returns:** does the app recover by itself or need a restart?

**What I expect**

- A clear, friendly message, not an endless spinner or a raw error.
- A retry option; offline actions are queued or clearly rejected.
- No duplicate actions: tapping Send twice on a slow network doesn't send two messages.
- Cached content shown when offline, if the app supports it.

**Tools**

- Airplane mode and Wi-Fi toggles on a real device.
- iOS **Network Link Conditioner** (Developer settings), Android emulator network settings.
- **Charles or Proxyman** to throttle, block or delay specific requests.
- Browser DevTools throttling for the web version.

Learn more: [Network Conditions](/mobile/network-conditions)
