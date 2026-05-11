# Threat Model

> Module: register | ID: REQ-006

### STRIDE Analysis — Registration Module

| # | Threat Category | Threat Description | Attack Vector | Mitigation |
|---|---|---|---|---|
| T-01 | **Spoofing** | Attacker registers with someone else's email to claim identity | Registration form | Email verification required before account activation |
| T-02 | **Spoofing** | Token forgery to activate account without owning email | Verify-email endpoint | 256-bit random token; SHA-256 hash stored server-side; constant-time comparison |
| T-03 | **Tampering** | SQL injection via email or password fields | API request body | Parameterized queries / ORM; server-side input sanitization |
| T-04 | **Tampering** | XSS payload stored in email field rendered in UI | Email field | Output encoding; Content-Security-Policy header; input sanitization |
| T-05 | **Repudiation** | User denies registering account | Registration flow | Immutable audit log: `created_at`, IP address, user-agent stored at registration |
| T-06 | **Information Disclosure** | Duplicate email error reveals account existence | `POST /auth/register` → 409 | Return generic message: *"If this email is not registered, you will receive a confirmation."* — evaluate per UX policy |
| T-07 | **Information Disclosure** | Password hash exposed via data breach | Database compromise | bcrypt cost ≥ 12; hash never returned in API responses; DB encryption at rest |
| T-08 | **Information Disclosure** | Verification token intercepted in transit | Email link / network | TLS enforced on all endpoints; token single-use and TTL-bound |
| T-09 | **Denial of Service** | Mass registration floods DB and email service | Registration endpoint | Rate limiting (e.g., 5 req/IP/min) at API Gateway; CAPTCHA for repeated failures |
| T-10 | **Denial of Service** | bcrypt cost causes CPU exhaustion under concurrent load | High concurrency | Worker pool / async hashing; load test to validate 3s SLA at P99 |
| T-11 | **Elevation of Privilege** | Inactive account bypasses auth checks to access protected resources | Auth middleware | `is_active` flag checked on every authentication attempt; denied if `false` |
| T-12 | **Elevation of Privilege** | Mass account creation for credential stuffing on other systems | Automated scripts | Rate limiting; disposable email domain blocklist; abuse monitoring alerts |
