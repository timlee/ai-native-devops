# Threat Model

> Module: Auth | ID: REQ-003

| # | Component | STRIDE Category | Threat | Mitigation |
|---|---|---|---|---|
| T-01 | `/login` | **Spoofing** | Attacker submits stolen credentials | bcrypt cost ≥ 12 slows offline attacks; account lockout after 5 failures/15 min |
| T-02 | `/login` | **Spoofing** | Credential stuffing at scale | Rate limiting per IP + per account at API Gateway; CAPTCHA for high-risk signals |
| T-03 | JWT (access token) | **Tampering** | Attacker forges or modifies JWT payload | RS256 signature verification; reject tokens with invalid `kid` or missing `alg` |
| T-04 | Refresh token | **Tampering** | Attacker replays a used refresh token | Single-use enforcement via Redis `used` flag; reuse triggers immediate session revocation |
| T-05 | Transport layer | **Interception** | Token theft over plain HTTP | TLS enforced at gateway; plain HTTP rejected with `400`; HSTS header set |
| T-06 | Redis | **Tampering** | Attacker modifies blocklist or lockout state | Redis AUTH + TLS in transit; Redis network isolated to internal VPC; no public exposure |
| T-07 | `/introspect` | **Information Disclosure** | Leaking user PII or internal claims | Introspection requires `basicAuth`; response excludes sensitive fields; no PII in errors |
| T-08 | Audit logs | **Repudiation** | Actor denies performing an auth action | Immutable append-only audit log; includes `user_id`, `ip_address`, `timestamp`, `outcome` |
| T-09 | Password store | **Information Disclosure** | DB breach exposes plaintext passwords | Only bcrypt hashes stored; cost ≥ 12; no reversible encryption |
| T-10 | RS256 private key | **Information Disclosure** | Private key exfiltrated from service | Key stored in secrets manager (Vault / AWS Secrets Manager); never logged or embedded in code |
| T-11 | `/login` endpoint | **Denial of Service** | Flood of auth requests exhausts bcrypt CPU | Global rate limit at gateway; async bcrypt worker pool with queue depth limit; Prometheus alert on saturation |
| T-12 | Account lockout | **Denial of Service** | Adversary deliberately locks legitimate accounts | Lockout triggers alert; unlock via admin endpoint with MFA; Retry-After communicated to user |
| T-13 | JWKS endpoint | **Elevation of Privilege** | Attacker publishes rogue public key | JWKS served from authenticated, immutable path; downstream services pin `kid`; key rotation requires explicit approval |
| T-14 | Token claims | **Elevation of Privilege** | Inflated roles/scopes in JWT | Scopes and roles sourced exclusively from DB at token issuance; not accepted from client input |
| T-15 | Audit log sink | **Repudiation** | Log events dropped under load | Async log pipeline with at-least-once delivery guarantee; dead-letter queue for failed log writes; SLA: within 1 second |
