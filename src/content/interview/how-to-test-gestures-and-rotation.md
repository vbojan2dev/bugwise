---
question: How do you test gestures and screen rotation in a mobile app?
short: Try every supported gesture (tap, long press, swipe, pinch, drag) and its edge cases, check for conflicts with system gestures, and rotate on every important screen to check layout and that no data is lost.
category: mobile
level: junior
lookingFor: Knowledge of common gestures and their typical bugs, awareness of conflicts with system gestures, and the specific risk of state loss on rotation.
pitfalls:
  - Only tapping buttons and never trying swipes or long presses.
  - Rotating only on an empty screen instead of mid-task.
  - Forgetting accessibility alternatives for gestures.
order: 10
---

**Gestures**

- **Tap, double tap, long press:** does each do the right thing, and does a fast double tap trigger an action twice?
- **Swipe:** swipe-to-delete, carousels, pull-to-refresh. Partial swipes and swiping back the other way.
- **Pinch and zoom** on images and maps: limits, zooming out past the minimum.
- **Drag and drop:** reorder lists, drop outside the target.
- **Conflicts:** a horizontal carousel inside a vertical scroll, a side menu vs the iOS swipe-back or Android back gesture, gestures near the screen edges.
- **Accessibility:** every gesture action is also available another way (a button or a screen reader action).

**Rotation**

- Rotate on each important screen, especially **mid-task**: a half-filled form, a playing video, an open modal, a scrolled list.
- Layout adapts: nothing cut off, no overlapping, keyboard still usable.
- **No data loss:** on Android, rotation recreates the screen, so a classic bug is a form that empties itself.
- Screens that should be locked to portrait stay locked.
- Also check tablets, split screen and foldables if supported.

**Example bug:** rotating during video playback restarts the video from the beginning.

Learn more: [Gestures](/mobile/gestures)
