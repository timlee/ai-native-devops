# User Stories

> Module: Auth | ID: REQ-003

- As a **registered user**, I want to log in with my email and password, so that I can access protected resources securely.
- As a **registered user**, I want my session to be refreshed automatically using a refresh token, so that I am not forced to re-authenticate frequently.
- As a **security administrator**, I want accounts to be locked after repeated failed login attempts, so that brute-force attacks are mitigated.
- As a **registered user**, I want to log out and have my tokens invalidated immediately, so that my session cannot be hijacked after logout.
- As a **downstream service**, I want to introspect a JWT to verify its validity, so that I can authorize requests without coupling to the auth secret.
- As a **security auditor**, I want all auth events logged with timestamps and actor identity, so that I can investigate incidents.

---
