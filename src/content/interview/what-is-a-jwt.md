---
question: What is a JWT, and what would you test around tokens?
short: A JWT is a signed token with three base64url parts (header, payload, signature). Anyone can decode the payload, but only the server can verify the signature. I test expiry, tampering, claims and that every endpoint rejects bad tokens with 401.
category: web
level: mid
lookingFor: Knowing that a JWT is encoded, not encrypted, that decoding is not verifying, what claims like sub and exp mean, and practical token tests including refresh and logout.
pitfalls:
  - Saying a JWT is encrypted.
  - Thinking that being able to decode a token proves it's valid.
  - Pasting real or production tokens into public online tools.
order: 15
---

A **JWT** (JSON Web Token) is a common format for access tokens. It looks like `xxxxx.yyyyy.zzzzz`:

- **Header**: the signing algorithm, e.g. `{"alg": "HS256", "typ": "JWT"}`.
- **Payload**: the claims, e.g. `sub` (user id), `exp` (expiry, in seconds since 1970), `iat` (issued at), plus custom ones like `role`.
- **Signature**: created by the server with a secret or private key.

The header and payload are only **encoded**, not encrypted, so anyone holding the token can read them. **Decoding is not verifying**: only the server can check the signature.

**What I test (on a test environment):**

- **Claims**: `exp` exists and the lifetime matches the requirement; the role is right; nothing secret is in the payload.
- **Expired token** → 401 on every protected endpoint.
- **Tampered token**: change `role` to `admin` and keep the old signature → 401. An unsigned `"alg": "none"` token must also be rejected.
- **Refresh**: the app gets a new access token quietly when the old one expires; after logout the refresh token no longer works.
- **Handling**: tokens don't appear in URLs, logs or error messages, and I mask them in bug reports.

I decode test tokens with a local tool or the team's approved decoder, never production tokens on a public website.

Learn more: [API Testing in Depth](/web/api-testing-in-depth)
