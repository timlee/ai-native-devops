# Backlog Items

> Module: Auth | ID: REQ-003

| Priority | Item | Description | Effort |
|----------|------|-------------|--------|
| **P0** | Implement login endpoint | `POST /auth/login` with JWT RS256 issuance and bcrypt verification | **M** |
| **P0** | Implement refresh token rotation | Single-use refresh tokens with secure storage and rotation logic | **M** |
| **P0** | Implement account lockout | Rate-limit failed logins; lock after 5 attempts; persist state | **M** |
| **P0** | Password hashing enforcement | Ensure bcrypt cost ≥ 12 on registration and password change | **S** |
| **P1** | Implement logout endpoint | `POST /auth/logout` with token blocklisting in Redis/DB | **S** |
| **P1** | Implement token introspection endpoint | `POST /auth/introspect` per RFC 7662 | **S** |
| **P1** | Audit logging integration | Structured log events for all auth actions to centralized sink | **M** |
| **P1** | HTTPS enforcement middleware | Reject or redirect plain HTTP at the gateway/service layer | **S** |
| **P2** | Observability — metrics | Expose Prometheus metrics: login rate, failure rate, lockout count | **S** |
| **P2** | Load & performance testing | Validate p95 ≤ 300 ms for login under load; define load profile | **M** |
| **P2** | Key rotation support | Support RS256 key rotation with JWKS endpoint (`GET /auth/.well-known/jwks.json`) | **L** |
