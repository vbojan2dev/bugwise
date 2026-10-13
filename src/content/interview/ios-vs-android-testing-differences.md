---
question: What are the main differences between testing on iOS and Android?
short: Android has far more device and OS fragmentation plus a system Back button, while iOS has fewer devices but stricter platform rules, its own gestures and a different way to install test builds.
category: mobile
level: junior
lookingFor: Concrete differences that change how you test (fragmentation, navigation, permissions, build distribution, design conventions), not a list of phone specs.
pitfalls:
  - Saying "it's the same app, so I only test one platform".
  - Listing hardware facts that don't affect testing.
  - Forgetting the Android Back button and iOS swipe-back gesture.
order: 3
---

The app may share one design, but the two platforms behave differently, so I plan tests for each.

**Android**

- **Fragmentation:** hundreds of manufacturers, screen sizes and OS versions, plus custom skins (Samsung One UI, Xiaomi HyperOS) that change fonts, battery savers and permissions.
- **System Back button / gesture:** every screen needs a sensible Back behavior. Does Back close a modal, or exit the app by accident?
- **Install sources:** APKs, Play Console testing tracks, Firebase App Distribution. Easy to sideload a build with adb.

**iOS**

- **Fewer devices, faster OS adoption:** most users update within months, so I focus on the latest two OS versions and the smallest and largest iPhones.
- **Swipe from the left edge to go back**, and no hardware Back button, so every screen needs a visible way out.
- **Stricter rules:** permissions can only be asked once from the app; after "Don't Allow" the user must go to Settings.
- **Test builds** come through TestFlight or a registered device.

**Both:** design conventions differ (iOS action sheets vs Android bottom sheets, date pickers, toasts are Android-only), so I check that each platform feels native and matches its own design, not the other one's.

Learn more: [iOS vs Android Differences](/mobile/ios-vs-android)
