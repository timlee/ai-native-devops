# Data Model

> Module: test | ID: tst-001

### Entity: `Item`

| Field | Type | Constraints | Required |
|---|---|---|---|
| `id` | `UUID` | Primary key, immutable | ✅ |
| `name` | `string` | `minLength=1`, `maxLength=255` | ✅ |
| `description` | `string` | `maxLength=1000` | ❌ |
| `status` | `enum` | One of: `active`, `inactive`, `archived` | ✅ |
| `tags` | `string[]` | Max 20 items per array | ❌ |
| `createdAt` | `datetime` | ISO 8601, set on insert | ✅ |
| `updatedAt` | `datetime` | ISO 8601, set on update | ✅ |

---

### Entity: `TestCase` *(test framework internal record)*

| Field | Type | Constraints | Required |
|---|---|---|---|
| `id` | `UUID` | Primary key | ✅ |
| `operationId` | `string` | Maps to OpenAPI `operationId` | ✅ |
| `method` | `enum` | `GET`, `POST`, `PUT`, `DELETE` | ✅ |
| `path` | `string` | OpenAPI path template | ✅ |
| `expectedStatusCode` | `integer` | Declared in OpenAPI responses | ✅ |
| `scenarioType` | `enum` | `happy_path`, `auth`, `boundary`, `negative` | ✅ |
| `schemaValidated` | `boolean` | Response validated against schema | ✅ |
| `passed` | `boolean` | Test execution result | ✅ |
| `runAt` | `datetime` | ISO 8601 | ✅ |

---

### Entity: `CoverageReport`

| Field | Type | Constraints | Required |
|---|---|---|---|
| `id` | `UUID` | Primary key | ✅ |
| `runId` | `string` | CI build / pipeline run identifier | ✅ |
| `coveragePercent` | `float` | `minimum=0.0`, `maximum=100.0` | ✅ |
| `threshold` | `float` | Enforced minimum; default `80.0` | ✅ |
| `passed` | `boolean` | `coveragePercent >= threshold` | ✅ |
| `generatedAt` | `datetime` | ISO 8601 | ✅ |

---

### Cardinality Summary

| Relationship | Cardinality |
|---|---|
| `OpenAPI OperationId` → `TestCase` | 1 : N (at least 1 per operation) |
| `CI Run` → `CoverageReport` | 1 : 1 |
| `CI Run` → `TestCase[]` | 1 : N |
| `Item` → `tags` | 1 : N (embedded array, max 20) |
