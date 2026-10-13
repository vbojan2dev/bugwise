---
question: How is testing a mobile app different from testing a website?
short: Mobile testing adds device fragmentation, OS versions, gestures, interruptions, permissions, network changes, battery and app store releases; web testing focuses more on browsers, screen sizes and URLs.
category: mobile
level: mid
lookingFor: Concrete mobile-specific concerns (interruptions, permissions, gestures, offline, lifecycle, installs and updates) and web-specific ones (browsers, responsive layout, back button, cookies), not just "the screen is smaller".
pitfalls:
  - Saying the only difference is screen size.
  - Forgetting interruptions, backgrounding and app updates.
  - Ignoring that mobile websites are also part of web testing.
order: 1
---

Many basics are the same (functional checks, bug reports, test design), but each platform has its own risks.

**Things you test more on mobile apps:**

- **Device and OS fragmentation:** many models, screen sizes, notches, Android manufacturer skins.
- **Interruptions:** incoming calls, notifications, alarms, low battery popups.
- **App lifecycle:** backgrounding, killing the app, returning after hours. Is state kept?
- **Permissions:** camera, location, notifications. What if the user denies them?
- **Gestures and hardware:** swipe, pinch, long press, rotation, Android back button, biometrics.
- **Network:** switching Wi-Fi to 4G, airplane mode, offline mode.
- **Install, update and uninstall,** plus app store requirements.
- **Battery, memory and storage** use.

**Things you test more on websites:**

- **Cross-browser:** Chrome, Safari, Firefox, Edge, and versions.
- **Responsive layouts** at many widths and zoom levels.
- **URLs and navigation:** browser back/forward, refresh, bookmarks, deep links, opening in a new tab.
- **Cookies, cache and sessions** across tabs.
- **Keyboard navigation** and DevTools evidence (console errors, network calls).

**Example:** the same "edit profile" form may lose your input on mobile when you leave the app to copy a code from email, while on the web it may break when you press the browser's back button and return.

Learn more: [iOS vs Android Differences](/mobile/ios-vs-android)
