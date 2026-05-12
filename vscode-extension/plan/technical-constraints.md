# Technical Constraints

> Module:  | ID: 1

- **Platform**: Must support ROS 2 (Humble or later) as the middleware layer
- **Language**: Core logic in Python 3.10+ and/or C++17; no mixed ABI boundaries
- **Real-time**: Emergency stop must meet hard deadline ≤ 200ms; consider RT kernel or dedicated priority thread
- **Communication**: All inter-module messaging via typed ROS 2 topics/services; no raw sockets internally
- **Security**: Command interface must authenticate callers; unauthenticated commands must be dropped at ingress
- **Logging**: Structured JSON logs only; forwarded to centralized observability stack (e.g., OpenTelemetry)
- **State Machine**: Robot states must be governed by a formal FSM with explicit transition guards
- **Hardware Abstraction**: Actuator and sensor interfaces must be abstracted via HAL layer for testability
- **Testing**: Unit tests required for all state transitions; hardware-in-loop (HIL) tests for movement and E-stop
- **Containerization**: Deployable as Docker/OCI image; must support both x86_64 and ARM64 (e.g., Jetson)
- **CI/CD**: All artifacts must pass static analysis (e.g., `clang-tidy`, `mypy`) before merge

---
