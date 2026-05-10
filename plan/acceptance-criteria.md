# Acceptance Criteria

> Module: Auth | ID: REQ-003

- [ ] **Login**
  - [ ] Returns `200 OK` with `access_token` (JWT RS256) and `refresh_token` on valid credentials.
  - [ ] Returns `401 Unauthorized` with no token on invalid credentials.
  - [ ] Response time is ≤ 300 ms at p95 under nominal load.

- [ ] **Token Expiry & Refresh**
  - [ ] Access token expires within the configured TTL (default: 15 minutes).
  - [ ] Refresh token is invalidated after first use; reuse returns `401`.
  - [ ] New access token and rotated refresh token are issued on valid refresh request.

- [ ] **Account Lockout**
  - [ ] Account is locked after exactly 5 failed attempts within 15 minutes.
  - [ ] Locked account returns `423 Locked` with a `Retry-After` header.
  - [ ] Lockout state persists across service restarts (stored in durable cache/DB).

- [ ] **Logout**
  - [ ] Returns `204 No Content` and blocklists the access token and refresh token immediately.
  - [ ] Introspection of blocklisted token returns `{ "active": false }`.

- [ ] **Token Introspection**
  - [ ] Returns `{ "active": true, ... claims }` for a valid, non-expired token.
  - [ ] Returns `{ "active": false }` for expired, revoked, or malformed tokens.

- [ ] **Audit Logging**
  - [ ] Every auth event includes: `event_type`, `user_id`, `ip_address`, `timestamp` (ISO 8601), `outcome`.
  - [ ] Logs are written to the centralized logging sink within 1 second of the event.

- [ ] **Security**
  - [ ] All endpoints reject plain HTTP with `301` redirect or `400`.
  - [ ] Passwords verified against bcrypt hash with cost ≥ 12.
  - [ ] No secrets or PII appear in logs or error response bodies.

---
