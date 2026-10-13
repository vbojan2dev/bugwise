---
question: What is the difference between retesting and regression testing?
short: Retesting confirms that a specific bug is fixed by repeating its exact steps; regression testing checks that the fix (or any change) didn't break other features.
category: fundamentals
level: junior
lookingFor: That retesting targets a known defect with the same steps, while regression looks for new, unexpected side effects in areas that used to work.
pitfalls:
  - Using the two terms interchangeably.
  - Saying regression testing is only done on the fixed feature.
order: 6
---

**Retesting** (also called confirmation testing) means running the **same test that failed** again on a new build, to confirm the bug is fixed.

**Regression testing** means re-testing **other existing features** to make sure the change did not break anything that used to work.

**Example:** in a photo app, you reported "App crashes when uploading a HEIC photo."

- **Retesting:** on the new build, you upload the same HEIC photo, on the same device and OS, following the same steps. It works, so you move the bug to Verified/Closed.
- **Regression:** you also upload JPG and PNG photos, try uploading from the camera, check that profile pictures still display and that the gallery still loads. The fix touched the upload code, so anything near it could be affected.

| | Retesting | Regression |
| --- | --- | --- |
| Target | One known bug | Features that already worked |
| Test cases | Same steps as the failed test | Existing regression suite |
| Planned in advance? | No, triggered by a fix | Yes, run regularly |
| Good for automation? | Rarely | Very often |

You usually do **both**: retest first, then run regression around the change.

Learn more: [Types of Testing](/fundamentals/types-of-testing)
