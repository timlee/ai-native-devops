# Product Requirements

> Module: Auth | ID: REQ-003

1. The Auth module **must** support secure user authentication via username/password credentials.
2. The system **must** issue signed JWT tokens (RS256) upon successful authentication with a configurable expiry.
3. The Auth module **must** enforce refresh token rotation; each refresh token is single-use and invalidated after use.
4. The system **must** lock an account after **5 consecutive failed login attempts** within a 15-minute window.
5. All authentication endpoints **must** communicate over HTTPS only; plain HTTP requests must be rejected (4xx).
6. The Auth module **must** emit structured audit log events for login, logout, token refresh, and account lockout.
7. Password storage **must** use bcrypt with a minimum cost factor of **12**.
8. The Auth module **must** expose a token introspection endpoint for downstream services to validate tokens without shared secrets.

---
