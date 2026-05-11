# ADR

> Module: login | ID: REQ-005

### ADR-001: JWT with Short-Lived Access Tokens and Secure Refresh via HttpOnly Cookie

**Status:** Accepted

**Context:**
The login module must issue session tokens that support idle timeout (30 min), optional "Remember Me" persistence, HTTPS-only transmission, and revocability. Options considered: opaque session tokens (server-side), JWT (stateless), or hybrid.

**Decision:**
Issue short-lived JWTs (15–30 min expiry) as access tokens. Pair with a `HttpOnly`, `Secure`, `SameSite=Strict` refresh token cookie for session persistence. Store refresh token metadata in Redis to enable revocation. "Remember Me" extends refresh token TTL (e.g., 30 days) without changing access token lifetime.

**Consequences:**

| Type | Detail |
|------|--------|
| ✅ Positive | Stateless access token reduces DB round-trips per request |
| ✅ Positive | Short expiry limits blast radius of token compromise |
| ✅ Positive | HttpOnly cookie prevents JS-based token theft (XSS) |
| ✅ Positive | Redis-backed refresh enables immediate revocation on logout/lockout |
| ⚠️ Negative | Requires refresh token rotation logic and Redis dependency |
| ⚠️ Negative | JWT cannot be revoked mid-life without a denylist check |

---
