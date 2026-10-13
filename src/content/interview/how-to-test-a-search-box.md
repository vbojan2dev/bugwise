---
question: How would you test a search box?
short: Check relevant results for normal, partial, misspelled and empty queries, special characters and very long input, suggestions, no-results and error states, speed, filters and sorting, and accessibility on each platform.
category: practical
level: junior
lookingFor: Clarifying questions first, then a structured set of checks covering input, results quality, UI states, performance and platform details.
pitfalls:
  - Only searching for one word that exists.
  - Ignoring the no-results, loading and error states.
  - Not asking what the search is supposed to match (title, description, tags).
order: 4
---

First I'd ask: what does it search (products, users, help articles)? Which fields does it match? Is there autocomplete, filtering, or a minimum length?

**Input**

- Exact match, partial word, different case ("IPHONE" vs "iphone").
- Typos and plurals, if fuzzy search is supported.
- Leading and trailing spaces, empty search, only spaces.
- Special characters (`&`, `%`, quotes), emoji, accented letters, other languages.
- Very long text and pasted text.

**Results**

- Relevant results first; count is correct; pagination or infinite scroll works.
- Search terms highlighted, if designed.
- **No results** state is helpful (suggestions, not a blank page).
- Works together with **filters and sorting**, and keeps them when going back.

**Behavior and UI**

- Autocomplete suggestions appear quickly and are tappable.
- Enter key or Search button on the keyboard submits; clear (x) button works.
- Fast typing doesn't show results for an old query.
- Loading and error states, slow network, offline.
- Recent searches saved and deletable, if supported.
- URL contains the query on web, so results can be shared and the Back button works.

**Security and accessibility**

- Script tags are shown as text.
- Field has a label for screen readers; results are announced.

Learn more: [Search, Filters and Sorting](/features/search-filters-and-sorting)
