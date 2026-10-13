# Content guide

How to add lessons, components, glossary terms and interview questions to Bugwise.
All content is written in **English**, in a friendly, plain voice aimed at someone with **zero** testing experience.

## Where content lives

| Kind | Location | Format | URL |
| --- | --- | --- | --- |
| Lesson | `src/content/lessons/<section>/<slug>.mdx` | MDX | `/<section>/<slug>` |
| UI component | `src/content/components/<slug>.mdx` | MDX | `/components/<slug>` |
| Glossary term | `src/content/glossary.yaml` | YAML list | `/glossary#<id>` |
| Interview question | `src/content/interview/<slug>.md` | Markdown | `/interview#<slug>` |

`<section>` is one of: `fundamentals`, `tutorials`, `features`, `mobile`, `web`.
Files starting with `_` are ignored, so you can keep drafts like `_draft.mdx`.
Copy-paste starters are in [`templates/`](templates/).

## Frontmatter

### Lesson

```yaml
---
title: How to Write Test Cases
description: One sentence shown in cards and search results.
order: 1                     # position inside its section
level: beginner              # beginner | intermediate | advanced
minutes: { short: 5, long: 25 }  # set `long` only if the lesson uses <Short>/<Long>
platform: both               # mobile | web | both
tags: [test design, documentation]
---
```

### UI component

```yaml
---
title: Segmented Control
description: One sentence.
category: navigation         # input | navigation | feedback | content
aka: [Segmented button, Toggle button group]
platforms: [ios, android, web]
minutes: 15
order: 1
---
```

Component pages follow this section order (use `##` headings):
1. What is it? (include an anatomy)
2. Designs & variants (live demos)
3. When to use it, then Good and bad uses (Do/Dont pairs side by side)
4. Common bugs
5. Find the bug (`<BugHunt>`)
6. How to test it (`<Checklist>` + `<TestCases>`)
7. Accessibility
8. Mobile vs web
9. Quiz + Key takeaways

### Feature lesson (`src/content/lessons/features/<slug>.mdx`)

Uses the lesson frontmatter. Feature pages follow this section order:
1. How it works (the flow, step by step)
2. Example requirements (user story + acceptance criteria)
3. What usually goes wrong (common bugs table)
4. Find the bug (`<BugHunt>` with a realistic broken demo)
5. Test scenarios (functional, negative, edge cases, UI/UX, security, accessibility)
6. Example test cases (`<TestCases>`)
7. Mobile vs web (`<Tabs>`)
8. Checklist, quiz, key takeaways

Starter: `templates/feature.mdx`.

### Glossary term (`src/content/glossary.yaml`)

```yaml
- id: regression-testing          # kebab-case, unique, used by <Term id="...">
  term: Regression testing
  short: Re-running tests to check that new changes didn't break things that used to work.
  definition: >-
    Two to four sentences in plain English.
  example: >-
    A real-world example a beginner can picture.
  category: types   # process | types | techniques | bugs | mobile | web | ui | tools | agile
  aka: [Regression]
  related: [retesting, smoke-testing]   # other ids
```

### Interview question (`src/content/interview/<slug>.md`)

```markdown
---
question: What is the difference between severity and priority?
short: Severity is how badly the bug hurts the product; priority is how soon it should be fixed.
category: bugs      # fundamentals | process | bugs | test-design | mobile | web | agile | practical | behavioral
level: junior       # junior | mid
lookingFor: That you understand the two are independent, and can give an example of each combination.
pitfalls:
  - Saying they are the same thing.
  - Giving definitions without an example.
order: 10
---

The model answer in Markdown. Short paragraphs, lists and a table are all fine.
```

## MDX components

These are available in every `.mdx` file **without importing them**.

> MDX tips: put a blank line after an opening tag and before a closing tag when the content is Markdown.
> Escape `{`, `}` and `<` in normal text (`\{`, `&lt;`), or put them in `code`.

### Callout

```mdx
<Callout type="tip" title="Optional title">
Markdown content.
</Callout>
```
`type`: `tip` · `info` · `warning` · `bug` · `example` · `note`

### Short / Long (quick vs detailed version)

If the lesson's frontmatter has `minutes.long`, a **Quick / Detailed** switch appears at the top.
Content inside `<Short>` shows only in Quick mode, content inside `<Long>` shows only in Detailed mode,
and everything else always shows.

```mdx
<Short>

The 5-minute version.

</Short>

<Long>

The in-depth version.

</Long>
```

### Term (glossary tooltip)

```mdx
Run a <Term id="smoke-testing">smoke test</Term> first.
<Term id="regression-testing" />   {/* shows the term's own name */}
```
The `id` must exist in `glossary.yaml`, otherwise the build fails (on purpose, so links never break).

### Compare (do / don't)

```mdx
<Compare>
<Do title="Specific">

Tap **Save** and check the toast says "Profile saved".

</Do>
<Dont title="Vague">

Check that saving works.

</Dont>
</Compare>
```

### Steps

Wrap a normal Markdown numbered list to get big, styled step numbers:

```mdx
<Steps>

1. **Read the requirement.** Explanation…
2. **List the scenarios.** Explanation…

</Steps>
```

### Checklist (interactive)

```mdx
<Checklist
  title="Segmented control checklist"
  items={[
    'Exactly one segment is selected on first load',
    'Tapping a segment updates the content below',
  ]}
/>
```

### TestCases

```mdx
<TestCases
  cases={[
    {
      id: 'TC-001',
      title: 'Login with valid credentials',
      priority: 'high',            // high | medium | low
      type: 'positive',            // positive | negative | edge (optional)
      preconditions: ['User account exists'],   // optional
      steps: ['Open the app', 'Enter email and password', 'Tap Log in'],
      data: 'email: anna@test.com / password: Secret123!',   // optional
      expected: 'User lands on the Home screen.',
    },
  ]}
/>
```

### Quiz

```mdx
<Quiz
  questions={[
    {
      q: 'Which one is a failure?',
      options: ['A typo in the code', 'The app crashes for the user', 'A missing requirement'],
      answer: 1,                   // index of the correct option, starting at 0
      explain: 'A failure is what the user experiences when a defect is executed.',
    },
  ]}
/>
```

### KeyTakeaways

```mdx
<KeyTakeaways>

- First takeaway
- Second takeaway

</KeyTakeaways>
```

### Tabs

```mdx
<Tabs labels={['iOS', 'Android', 'Web']}>
<Tab>

iOS content

</Tab>
<Tab>

Android content

</Tab>
<Tab>

Web content

</Tab>
</Tabs>
```

### Device frame

```mdx
<Device type="iphone">   {/* iphone | android | browser */}
  <MyDemo client:visible />
</Device>
<Device type="browser" url="shop.example.com">…</Device>
```

### BugHunt

The demo goes inside (usually a deliberately broken React component, imported at the top of the MDX file).
Learners explore it, then reveal the bugs one by one.

```mdx
import { BuggyActivityApp } from '@/components/demos/segmented-control/BuggyActivityApp';

<BugHunt
  title="Activity screen"
  bugs={[
    { title: 'Selection resets after going back', hint: 'Navigate away and return.', detail: 'Explanation…' },
  ]}
>
  <BuggyActivityApp client:visible />
</BugHunt>
```

## Interactive demos

Shared mockups: `src/components/demos/shared/PhoneFrame.tsx` and `BrowserFrame.tsx`.
Each component page can add a gallery thumbnail at `src/components/demos/<slug>/Preview.astro`; it is picked up automatically.

Page-specific demos are React components in `src/components/demos/<topic>/`.
Import them at the top of the MDX file with the `@/` alias and add `client:visible`
so they load when scrolled into view.

When you place a static platform demo directly in the text (for example inside `<Do>`/`<Dont>`),
wrap it in `<div class="not-prose demo-screen">…</div>`. This gives it a light "device screen" background,
so iOS-style controls keep their native contrast in the site's dark mode too.

## Bites cards (`src/content/cards/<section>/<slug>.yaml`)

Every page has a matching card file for the **Bites** feed (`/bites`): short review cards, 5–15 seconds each.
The file path must equal the page path (e.g. `cards/components/button.yaml` for `/components/button`).
Glossary terms and interview questions become cards automatically.

```yaml
teaser: "One or two sentences that make a beginner curious about the page."
cards:
  - type: flip
    front: "Short question"
    back: "Short answer"
  - type: quiz
    q: "Question?"
    options: ["A", "B", "C"]
    answer: 1            # 0-based
    explain: "Why B is right."
  - type: truefalse
    statement: "A statement."
    answer: false
    explain: "Why."
  - type: thisorthat
    prompt: "A realistic situation."
    left: "Option A"
    right: "Option B"
    answer: right
    explain: "Why."
  - type: spotbug
    screen: ["Line on the mock screen", "Another line"]
    question: "What's wrong here?"   # optional
    bug: "The bug in a few words."
    explain: "Why it matters."
  - type: tip
    title: "Short title"
    text: "One practical tip."
```

Aim for 8–10 cards per page with mixed types; see `cards/fundamentals/severity-vs-priority.yaml` for tone and length.

## Dev notes

Developer-only details (API and class names, attributes such as `imeOptions` or `enterkeyhint`, framework modifiers) go in `<DevNote>…</DevNote>`, which renders a small collapsed "Dev note" chip. The sentence a tester needs (what the user sees, what to check) stays in the normal text.

```mdx
- **The keyboard opens** with a **Search** key instead of Return.
  <DevNote>On Android that's `imeOptions="actionSearch"`; on the web `enterkeyhint="search"`.</DevNote>
```
