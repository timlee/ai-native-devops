# ADR

> Module: Auth | ID: REQ-003

### ADR-001: RS256 JWT with Refresh Token Rotation and Redis-Backed State

**Status:** Accepted

**Context:**
The Auth module must issue short-lived access tokens, support refresh without re-authentication, prevent brute-force via lockout, and allow downstream services to validate tokens independently. Symmetric (HS256) tokens require secret sharing, which violates the introspection requirement. Stateless tokens alone cannot support immediate revocation on logout.

**Decision:**
- Use **RS256** (asymmetric) JWTs; private key signs tokens, public key exposed via JWKS endpoint.
- Access token TTL: **15 minutes** (configurable via env).
- Refresh tokens are **opaque, single-use**, stored as hashed values in Redis with TTL matching the refresh window (e.g., 7 days).
- Token blocklist (logout/revocation) stored in Redis with expiry equal to remaining token TTL.
- Account lockout counters and lock state stored in Redis for durability across restarts; persist critical lockout state to PostgreSQL asynchronously.
- bcrypt cost factor **minimum 12** enforced at the service layer on write and validated on read.
- All endpoints sit behind an API Gateway that terminates TLS and rejects plain HTTP with `400`.

**Consequences — Positive:**
- Downstream services validate tokens via JWKS without shared secrets.
- Refresh token rotation eliminates replay risk.
- Redis provides sub-millisecond state lookup, supporting the p95 ≤ 300 ms SLA.
- Asymmetric keys support key rotation via JWKS `kid` claim.

**Consequences — Negative:**
- Redis becomes a critical dependency; requires HA cluster (Redis Sentinel or Cluster mode).
- RS256 signing is slightly slower than HS256; must be benchmarked under load.
- Key rotation (new `kid`) requires JWKS cache invalidation coordination with downstream services.

---
