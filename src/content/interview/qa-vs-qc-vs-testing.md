---
question: What is the difference between QA, QC and testing?
short: QA improves the process so fewer bugs are made, QC checks the product for bugs, and testing is the main activity inside QC.
category: fundamentals
level: junior
lookingFor: That QA is process-focused and preventive, QC is product-focused and detective, and testing is a part of QC.
pitfalls:
  - Treating all three as synonyms.
  - Not being able to give an example of a QA activity that is not testing.
order: 2
---

The three terms are related but focus on different things:

| | Focus | Goal | Example |
| --- | --- | --- | --- |
| **Quality assurance (QA)** | The process | **Prevent** defects | Agreeing that every user story needs acceptance criteria before development |
| **Quality control (QC)** | The product | **Detect** defects | Checking a finished build before release |
| **Testing** | The product | Find defects and give information | Running checkout test cases on build 4.2 |

A simple way to remember it: **QA asks "Are we working in a way that produces quality?"** and **QC asks "Does this product have quality?"** Testing is the main hands-on activity of QC.

For example, in a shopping app team, QA might mean introducing requirement reviews and a definition of done. QC and testing mean actually installing the new build and trying to add items, apply coupons and pay.

In real life, job titles mix these up. A "QA Engineer" usually spends most of the day testing, but a good one also helps improve the process, which is real QA.

Learn more: [What Is Software Testing?](/fundamentals/what-is-software-testing)
