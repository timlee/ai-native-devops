# Data Model

> Module: Auth | ID: REQ-003

### Entity: `users`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, NOT NULL | Stable user identifier |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login credential |
| `password_hash` | `TEXT` | NOT NULL | bcrypt, cost ≥ 12 |
| `is_locked` | `BOOLEAN` | NOT NULL, DEFAULT false | Lockout flag |
| `locked_until` | `TIMESTAMPTZ` | NULLABLE | Lockout expiry |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | ISO 8601 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Auto-updated |

---

### Entity: `refresh_tokens` (Redis — Hash)

| Field | Type | Notes |
|---|---|---|
| `key` | `STRING` | `rt:{sha256(token)}` |
| `user_id` | `UUID` | Owner |
| `jti` | `UUID` | Linked access token ID |
| `used` | `BOOLEAN` | Rotation guard |
| `expires_at` | `UNIX_TS` | Redis TTL aligned |

---

### Entity: `token_blocklist` (Redis — Set)

| Field | Type | Notes |
|---|---|---|
| `key` | `STRING` | `bl:{jti}` |
| TTL | `INTEGER` | Set to remaining token lifetime (seconds) |

---

### Entity: `lockout_counters` (Redis — Hash)

| Field | Type | Notes |
|---|---|---|
| `key` | `STRING` | `lk:{user_id}` |
| `attempts` | `INTEGER` | Failed attempt count |
| TTL | `INTEGER` | 900 seconds (15-minute window) |

---

### Entity: `audit_logs`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | |
| `event_type` | `VARCHAR(50)` | NOT NULL | `LOGIN`, `LOGOUT`, `REFRESH`, `LOCKOUT` |
| `user_id` | `UUID` | FK → users.id, NULLABLE | Null if user unknown |
| `ip_address` | `INET` | NOT NULL | |
| `outcome` | `VARCHAR(20)` | NOT NULL | `SUCCESS`, `FAILURE`, `BLOCKED` |
| `metadata` | `JSONB` | NULLABLE | Non-PII context only |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | ISO 8601, indexed |

---

### Cardinality Summary

| Relationship | Type |
|---|---|
| `users` → `refresh_tokens` | 1 : N |
| `users` → `audit_logs` | 1 : N |
| `refresh_tokens` → `token_blocklist` | 1 : 0..1 (on logout) |

---
