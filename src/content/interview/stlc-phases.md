---
question: What are the phases of the software testing life cycle (STLC)?
short: Requirement analysis, test planning, test case design, test environment setup, test execution and test closure.
category: process
level: mid
lookingFor: The six phases in order, what happens in each, and that testing starts with requirements, not with a finished build.
pitfalls:
  - Listing phases without saying what each one produces.
  - Saying testing starts only when the code is ready.
order: 2
---

The **STLC** describes the testing activities from start to finish. A common version has six phases:

| Phase | What happens | Output |
| --- | --- | --- |
| **1. Requirement analysis** | Review requirements and user stories, ask questions, find unclear or untestable parts | List of questions, testable requirements |
| **2. Test planning** | Decide scope, approach, devices, effort, risks | Test plan |
| **3. Test case design** | Write test scenarios, test cases and test data | Test cases, test data, traceability matrix |
| **4. Environment setup** | Prepare servers, builds, devices, accounts | Ready test environment, smoke test passed |
| **5. Test execution** | Run tests, report bugs, retest fixes | Test results, bug reports |
| **6. Test closure** | Evaluate exit criteria, summarize, share lessons learned | Test summary report |

**Example:** for a new "Pay with Apple Pay" feature, you first ask what happens if the card is declined (phase 1), decide to test on three iPhones (phase 2), write test cases for success, cancel and decline (phase 3), set up sandbox cards on the devices (phase 4), run the tests and file bugs (phase 5), then write a summary for the release decision (phase 6).

In agile, these phases still happen, just in **small loops inside every sprint** instead of once per project.

Learn more: [SDLC and STLC](/fundamentals/sdlc-and-stlc)
