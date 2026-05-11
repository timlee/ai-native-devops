# ADR

> Module: register | ID: REQ-006

### ADR-001: Password Hashing Algorithm Selection

**Status:** Accepted

**Context:**
User passwords must be stored securely. The system must resist offline brute-force attacks if the database is compromised. Options considered: bcrypt, Argon2id, PBKDF2.

**Decision:**
Use **bcrypt** with a cost factor of **12**. Bcrypt is battle-tested, widely supported across languages/frameworks, and cost factor 12 provides adequate resistance (~300ms hash time) without violating the 3-second response SLA.

**Consequences:**

| Type | Detail |
|------|--------|
| ✅ Positive | Industry-standard; broad library support; adaptive cost factor |
| ✅ Positive | Cost factor 12 balances security and performance within SLA |
| ✅ Positive | Built-in salting eliminates rainbow table attacks |
| ❌ Negative | Bcrypt truncates passwords at 72 bytes; must document and enforce max length |
| ❌ Negative | Argon2id offers superior memory-hardness; bcrypt may require migration in future |

---

### ADR-002: Email Verification via Signed Token

**Status:** Accepted

**Context:**
Accounts must remain inactive until email ownership is confirmed, preventing enumeration abuse and ensuring deliverability.

**Decision:**
Generate a **cryptographically random 256-bit token** (URL-safe base64), store its SHA-256 hash in Redis with a **24-hour TTL**, and embed the raw token in a verification link. Verification endpoint `GET /api/v1/auth/verify-email?token=<token>` activates the account.

**Consequences:**

| Type | Detail |
|------|--------|
| ✅ Positive | Stateless link; token never stored in plaintext |
| ✅ Positive | TTL enforces expiry automatically |
| ✅ Positive | Resistant to timing attacks via constant-time comparison |
| ❌ Negative | Redis dependency added to critical path |
| ❌ Negative | Token resend flow needed for expired links (future scope) |

---
