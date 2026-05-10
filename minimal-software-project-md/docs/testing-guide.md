# Testing Guide

## Test Strategy

The project should use a layered testing strategy.

| Test Type | Purpose | When to Run |
|---|---|---|
| Unit tests | Validate isolated logic | Every change |
| Integration tests | Validate component interaction | Pull requests |
| End-to-end tests | Validate critical workflows | Before release |
| Performance tests | Validate latency and capacity | Before major release |
| Security tests | Validate security controls | Pull requests and release |

## Running Tests

```bash
# Run all tests
<test-command>

# Run unit tests
<unit-test-command>

# Run integration tests
<integration-test-command>

# Generate coverage report
<coverage-command>
```

## Coverage Expectations

Define the expected coverage level.

Example:

```text
Minimum line coverage: 80%
Critical modules: 90%+
```

## Test Data

- Use synthetic test data
- Do not use production data unless approved and anonymized
- Avoid committing secrets or private user data

## Regression Testing

Every bug fix should include a regression test when practical.

## AI-Assisted Testing

AI tools may help generate test cases, identify edge cases, and analyze failed test logs. All generated tests must be reviewed for meaningful assertions.
