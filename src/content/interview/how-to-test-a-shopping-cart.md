---
question: How would you test a shopping cart?
short: Test adding, updating and removing items, price and total calculations (discounts, tax, shipping), stock limits, cart persistence across sessions and devices, and the handoff to checkout, plus edge cases like price changes and slow networks.
category: practical
level: junior
lookingFor: A structured answer with a strong focus on calculations and data persistence, plus realistic edge cases that cause money-related bugs.
pitfalls:
  - Only testing "add item, item appears in cart".
  - Ignoring calculations, rounding and discounts.
  - Forgetting what happens when stock or price changes while the item is in the cart.
order: 5
---

I'd first clarify: guest cart or only logged-in? Maximum quantities? How do discounts, tax and shipping work?

**Basic actions**

- Add from product page and list, add the same item twice (quantity goes up, no duplicate line).
- Change quantity with buttons and by typing; 0, negative, and above the maximum.
- Remove items, remove the last item (empty cart state), undo if supported.
- Variants: same product in different size or color as separate lines.

**Calculations**

- Line totals, subtotal, discounts, tax, shipping and grand total are correct.
- Rounding with prices like 9.99 x 3.
- Coupon codes: valid, expired, invalid, applied twice, minimum order value.
- Currency and locale formatting.

**Persistence**

- Cart survives refresh, closing the app, logging out and in.
- Guest cart merges correctly after login.
- Same account on phone and web shows the same cart.

**Edge cases**

- Item goes out of stock or changes price while in the cart: clear message.
- Double tapping Add on a slow network.
- Cart badge count matches the cart content.

**Handoff:** proceed to checkout with exactly the items and totals shown.

Learn more: [Shopping Cart and Checkout](/features/shopping-cart-and-checkout)
