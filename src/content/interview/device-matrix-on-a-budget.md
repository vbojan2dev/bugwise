---
question: You have a limited budget and need to choose a device and OS matrix for a mobile app. How do you decide?
short: Start from the app's own analytics, fill gaps with public market share data for the target markets, then add devices for specific risks such as the oldest supported OS, small screens and low memory. Tier the devices, combine a few real phones with a cloud device farm, and review the matrix regularly.
category: strategy
level: senior
lookingFor: A data-driven, tiered matrix with clear reasoning, a mix of real devices, emulators and cloud farms, budget awareness, and a habit of reviewing the matrix as usage changes.
pitfalls:
  - Choosing devices based on what the team happens to own.
  - Only buying the latest flagship phones.
  - Treating global market share as more important than your own users' data.
  - Building the matrix once and never updating it.
order: 4
---

You can't buy every phone, so the goal is **maximum risk coverage per dollar**.

**1. Data first**

- **The app's own analytics** (for example Firebase, App Store Connect, Google Play Console): top devices, OS versions, screen sizes, and how that differs by market.
- If the app is new, **public market share** for the target countries (for example StatCounter) as a starting point. A banking app launching in one country should not use a global average.
- **Crash and review data**: devices that already cause trouble.

**2. Add risk-based picks that analytics alone would miss**

- The **oldest supported OS** version on each platform, and the newest (plus the public beta before a major release).
- A **small screen** and a **large screen** or tablet if supported.
- A **low-end Android** with little RAM, because memory pressure and slow CPUs reveal bugs flagships hide.
- Key **manufacturers** with custom Android skins, such as Samsung or Xiaomi, because of battery and background restrictions.
- Hardware the app relies on: NFC for payments, a specific camera setup, biometrics.

**3. Tier it**

| Tier | Devices | Used for |
| --- | --- | --- |
| 1 | 4-6 real devices covering most users | Every release, full regression of critical flows |
| 2 | Wider set, often in a cloud device farm | Smoke and key flows before major releases |
| 3 | Emulators and simulators | Layouts, early checks, many screen sizes |

**4. Spend wisely.** A few mid-range and older real phones are often better value than one new flagship. A cloud farm such as BrowserStack or Firebase Test Lab covers breadth without buying hardware.

**5. Review it** every quarter or after each major OS release, and write the policy down so "why don't we test on X?" has a clear answer.

Learn more: [Device Fragmentation](/mobile/device-fragmentation)
