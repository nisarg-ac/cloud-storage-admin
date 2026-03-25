# Admin Panel — Earning & Payout API

**Base URL:** `/api/v1/web/earning/`
**Auth:** All endpoints require `Authorization: Bearer <admin-jwt>` with `isAdmin = true`. Returns `401` if token is missing/invalid, `403` if user is not an admin.

All successful responses are wrapped:
```json
{ "status": 200, "message": "Success", "data": <payload> }
```
Error responses use the standard error envelope. HTTP status codes used: 200, 400, 401, 403, 404, 422, 500.

---

## Reward Units

All monetary amounts are stored as **BIGINT micro-units**.
`1 USD = 1,000,000 units`
All `reward_units`, `total_units`, `rewardPerViewUnits`, `rewardPerSignupUnits` fields are in micro-units.
In database query results they are returned as **strings** (PostgreSQL BIGINT → JSON string serialisation). In TypeORM entity responses they are also strings.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Activity Feed](#2-activity-feed)
3. [Revenue Events — List](#3-revenue-events--list)
4. [Revenue Events — Fraud Queue](#4-revenue-events--fraud-queue)
5. [Revenue Events — Bulk Action](#5-revenue-events--bulk-action)
6. [Revenue Events — Get Single](#6-revenue-events--get-single)
7. [Revenue Events — Approve](#7-revenue-events--approve)
8. [Revenue Events — Reject](#8-revenue-events--reject)
9. [Revenue Events — Override Fraud Flag](#9-revenue-events--override-fraud-flag)
10. [Revenue Events — Manual Flag](#10-revenue-events--manual-flag)
11. [Revenue Events — Update Status (Legacy)](#11-revenue-events--update-status-legacy)
12. [Payouts — List](#12-payouts--list)
13. [Payouts — Get Single](#13-payouts--get-single)
14. [Payouts — Approve](#14-payouts--approve)
15. [Payouts — Hold](#15-payouts--hold)
16. [Payouts — Release Hold](#16-payouts--release-hold)
17. [Payouts — Mark Paid](#17-payouts--mark-paid)
18. [Payouts — Mark Failed](#18-payouts--mark-failed)
19. [Payouts — Retry](#19-payouts--retry)
20. [User Earning Profile](#20-user-earning-profile)
21. [User — Suspend Earning](#21-user--suspend-earning)
22. [User — Reinstate Earning](#22-user--reinstate-earning)
23. [User — Override Earning Plan](#23-user--override-earning-plan)
24. [User — Block Payouts](#24-user--block-payouts)
25. [User — Unblock Payouts](#25-user--unblock-payouts)
26. [Config — Get](#26-config--get)
27. [Config — Update](#27-config--update)
28. [Plans — List](#28-plans--list)
29. [Plans — Create](#29-plans--create)
30. [Plans — Update by ID](#30-plans--update-by-id)
31. [Plans — Update (Legacy)](#31-plans--update-legacy)
32. [Audit Log](#32-audit-log)

---

## Status Enumerations

### Revenue Event Status

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting admin review |
| `APPROVED` | Admin approved; eligible for payout batching |
| `REJECTED` | Denied (fraud or policy violation) |
| `PAYABLE` | Batched into a payout (system-managed; not settable from this panel) |
| `PAID` | Paid out (system-managed; not settable from this panel) |

**Allowed admin transitions:**
- `PENDING → APPROVED` — approve
- `PENDING → REJECTED` — reject
- `APPROVED → REJECTED` — reject
- `APPROVED → PENDING` — flag (sends back to review queue)

### Payout Status

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting approval; in holding period |
| `ON_HOLD` | Manually held by admin |
| `PROCESSING` | Approved; being disbursed |
| `PAID` | Disbursed successfully |
| `FAILED` | Disbursement attempt failed |

**Allowed admin transitions:**
- `PENDING → PROCESSING` — approve (only after `holding_release_at` has passed)
- `PENDING → ON_HOLD` — hold
- `PROCESSING → ON_HOLD` — hold
- `ON_HOLD → PENDING` — release
- `PROCESSING → PAID` — mark-paid
- `PROCESSING → FAILED` — mark-failed
- `FAILED → PROCESSING` — retry

---

## Response Shapes: Entity vs SQL

Mutation endpoints (approve, reject, hold, etc.) return the TypeORM entity serialised to JSON — field names are **camelCase**.

Read/list endpoints that use raw SQL return **snake_case** field names.

Both are noted under each endpoint.

---

## 1. Overview

**`GET /api/v1/web/earning/overview`**

Returns platform-wide counts and totals, grouped by status.

### Response

```json
{
  "data": {
    "revenueEventsByStatus": [
      { "status": "PENDING",  "event_count": "142", "total_units": "14200000" },
      { "status": "APPROVED", "event_count": "980", "total_units": "98000000" },
      { "status": "REJECTED", "event_count": "12",  "total_units": "1200000"  },
      { "status": "PAYABLE",  "event_count": "50",  "total_units": "5000000"  },
      { "status": "PAID",     "event_count": "340", "total_units": "34000000" }
    ],
    "payoutsByStatus": [
      { "status": "PENDING",    "payout_count": "5",  "total_units": "5000000"  },
      { "status": "PROCESSING", "payout_count": "2",  "total_units": "2000000"  },
      { "status": "PAID",       "payout_count": "30", "total_units": "30000000" },
      { "status": "FAILED",     "payout_count": "1",  "total_units": "1000000"  }
    ]
  }
}
```

- Only statuses that have at least one record are included.
- All numeric values (`event_count`, `payout_count`, `total_units`) are **strings**.

---

## 2. Activity Feed

**`GET /api/v1/web/earning/activity-feed`**

Chronological feed of revenue events and/or payouts for a given calendar date (UTC).

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | `YYYY-MM-DD` | today (UTC) | Calendar date to fetch |
| `type` | `VIEW` \| `REFERRAL` \| `PAYOUT` | — | Filter by type; omit for all |
| `page` | integer | `1` | Page number |
| `limit` | integer (1–100) | `50` | Items per page |

### Response — `type=VIEW` or `type=REFERRAL`

```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "FILE_VIEW",
      "actor_user_id": "uuid",
      "beneficiary_user_id": "uuid",
      "reward_units": "1000",
      "currency": "USD",
      "status": "PENDING",
      "timestamp": "2026-03-18T09:15:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 50
}
```

### Response — `type=PAYOUT`

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "PAYOUT",
      "user_id": "uuid",
      "total_units": "50000000",
      "currency": "USD",
      "status": "PENDING",
      "timestamp": "2026-03-18T08:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}
```

### Response — no `type` filter (all)

Revenue events and payouts are unioned into a single list. Fields are normalised to a common shape:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "FILE_VIEW",
      "user_id": "uuid",
      "units": "1000",
      "currency": "USD",
      "status": "PENDING",
      "timestamp": "2026-03-18T09:15:00.000Z"
    },
    {
      "id": "uuid",
      "type": "PAYOUT",
      "user_id": "uuid",
      "units": "50000000",
      "currency": "USD",
      "status": "PENDING",
      "timestamp": "2026-03-18T08:00:00.000Z"
    }
  ],
  "total": 147,
  "page": 1,
  "limit": 50
}
```

> When no `type` filter is given, the amount field is `units` (not `reward_units` or `total_units`), and revenue events use `actor_user_id` mapped to `user_id`.

---

## 3. Revenue Events — List

**`GET /api/v1/web/earning/events`**

Paginated, filterable list of all revenue events.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `PAYABLE` \| `PAID` | Filter by status |
| `type` | `FILE_VIEW` \| `SIGNUP_REFERRAL` | Filter by event type |
| `userId` | UUID | Filter by beneficiary user ID |
| `hasFraudFlags` | `true` \| `false` | Filter events that have/lack fraud flags |
| `dateFrom` | `YYYY-MM-DD` or ISO 8601 | Filter `inserted_at >=` value |
| `dateTo` | `YYYY-MM-DD` or ISO 8601 | Filter `inserted_at <=` value |
| `page` | integer | Default: `1` |
| `limit` | integer (1–100) | Default: `50` |
| `sortBy` | `inserted_at` \| `event_timestamp` \| `reward_units` \| `status` | Default: `inserted_at` |
| `sortDir` | `asc` \| `desc` | Default: `desc` |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "FILE_VIEW",
      "actor_user_id": "uuid",
      "beneficiary_user_id": "uuid",
      "reward_units": "1000",
      "currency": "USD",
      "status": "PENDING",
      "inserted_at": "2026-03-18T09:00:00.000Z",
      "fraud_flags": ["HIGH_VELOCITY"],
      "approved_by": null,
      "approved_at": null,
      "rejected_reason": null,
      "admin_note": null,
      "beneficiary_name": "John Doe"
    }
  ],
  "total": 982,
  "page": 1,
  "limit": 50
}
```

---

## 4. Revenue Events — Fraud Queue

**`GET /api/v1/web/earning/events/fraud-queue`**

Returns `PENDING` events that have at least one fraud flag, sorted by `reward_units DESC` (highest value first).

### Query Parameters

| Param | Type | Default |
|-------|------|---------|
| `page` | integer | `1` |
| `limit` | integer (1–100) | `50` |

### Response

Same shape as [List Revenue Events](#3-revenue-events--list) (same fields per row, no status/type filter applied).

---

## 5. Revenue Events — Bulk Action

**`POST /api/v1/web/earning/events/bulk-action`**

Approve or reject up to 100 events in one request. Each event is processed independently — one failure does not stop the rest.

### Request Body

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "action": "APPROVE",
  "reason": "FRAUD_CONFIRMED",
  "note": "Batch reviewed"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | UUID[] (1–100) | Yes | Event IDs to action |
| `action` | `APPROVE` \| `REJECT` | Yes | Action to apply |
| `reason` | string | No | Stored as `rejectedReason` when `action=REJECT` |
| `note` | string | No | Stored as `adminNote` on each event |

**Allowed statuses for `APPROVE`:** `PENDING`, `APPROVED`
**Allowed statuses for `REJECT`:** `PENDING`, `APPROVED` (but not already `REJECTED`)

### Response

```json
{
  "data": {
    "succeeded": 2,
    "failed": 1,
    "errors": [
      { "id": "uuid3", "error": "Cannot approve event in status PAID" }
    ]
  }
}
```

---

## 6. Revenue Events — Get Single

**`GET /api/v1/web/earning/events/:id`**

Returns the full revenue event with actor and beneficiary user names joined.

### Response (snake_case — raw SQL)

```json
{
  "data": {
    "id": "uuid",
    "event_type": "FILE_VIEW",
    "actor_user_id": "uuid",
    "beneficiary_user_id": "uuid",
    "reward_units": "1000",
    "currency": "USD",
    "status": "PENDING",
    "event_timestamp": "2026-03-18T09:00:00.000Z",
    "inserted_at": "2026-03-18T09:00:01.000Z",
    "fraud_flags": [],
    "fraud_flags_overridden": null,
    "approved_by": null,
    "approved_at": null,
    "rejected_reason": null,
    "admin_note": null,
    "notes": null,
    "actor_name": "Jane Smith",
    "beneficiary_name": "John Doe"
  }
}
```

---

## 7. Revenue Events — Approve

**`PATCH /api/v1/web/earning/events/:id/approve`**

Approves a single revenue event. Sets `approvedBy` and `approvedAt`.

**Allowed current status:** `PENDING` or `APPROVED` (re-approving is idempotent).

### Request Body

```json
{ "note": "Verified clean" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string | No |

### Response (camelCase — TypeORM entity)

```json
{
  "data": {
    "id": "uuid",
    "eventType": "FILE_VIEW",
    "actorUserId": "uuid",
    "beneficiaryUserId": "uuid",
    "rewardUnits": "1000",
    "currency": "USD",
    "status": "APPROVED",
    "fraudFlags": [],
    "fraudFlagsOverridden": null,
    "approvedBy": "admin-uuid",
    "approvedAt": "2026-03-18T10:00:00.000Z",
    "rejectedReason": null,
    "adminNote": "Verified clean",
    "insertedAt": "2026-03-18T09:00:01.000Z"
  }
}
```

---

## 8. Revenue Events — Reject

**`PATCH /api/v1/web/earning/events/:id/reject`**

Rejects a revenue event. Sets `rejectedReason`.

**Allowed current status:** `PENDING` or `APPROVED`
**Guard:** Returns `400` if already `REJECTED`.

### Request Body

```json
{
  "reason": "FRAUD_CONFIRMED",
  "note": "IP cluster detected"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `reason` | enum | Yes | `FRAUD_CONFIRMED` \| `DUPLICATE` \| `POLICY_VIOLATION` \| `OTHER` |
| `note` | string | No | Audit note |

### Response

Full updated `RevenueEvent` entity (camelCase) — same shape as [Approve](#7-revenue-events--approve).

---

## 9. Revenue Events — Override Fraud Flag

**`PATCH /api/v1/web/earning/events/:id/override-fraud`**

Clears all fraud flags and immediately approves the event. The cleared flags are saved to `fraudFlagsOverridden` for auditing.

**Guard:** Returns `400` if the event has no fraud flags.

### Request Body

```json
{ "justification": "Manual review confirmed no fraud — single-user spike from viral post" }
```

| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| `justification` | string | Yes | Minimum 20 characters |

### Response

Full updated `RevenueEvent` entity (camelCase). Key field changes:
- `status` → `APPROVED`
- `fraudFlags` → `[]`
- `fraudFlagsOverridden` → array of flags that were cleared
- `approvedBy` / `approvedAt` set
- `adminNote` set to justification text

---

## 10. Revenue Events — Manual Flag

**`PATCH /api/v1/web/earning/events/:id/flag`**

Adds `MANUAL_REVIEW` to the event's fraud flags and reverts status to `PENDING` if it was `APPROVED`.

**Allowed current status:** `PENDING` or `APPROVED`

### Request Body

```json
{
  "reason": "SUSPICIOUS_PATTERN",
  "note": "Unusual geographic spread of viewers"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `reason` | enum | Yes | `SUSPICIOUS_PATTERN` \| `USER_REPORTED` \| `BULK_ACTIVITY` \| `OTHER` |
| `note` | string | No | Audit note |

### Response

Full updated `RevenueEvent` entity (camelCase).

---

## 11. Revenue Events — Update Status (Legacy)

**`PATCH /api/v1/web/earning/events/status`**

> **Deprecated.** Prefer endpoint [7 (approve)](#7-revenue-events--approve) or [8 (reject)](#8-revenue-events--reject).

Updates a single event's status using `eventId` in the request body.

### Request Body

```json
{
  "eventId": "uuid",
  "status": "APPROVED",
  "notes": "Optional free-text note"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `eventId` | UUID | Yes | Event to update |
| `status` | enum | Yes | `APPROVED` \| `REJECTED` |
| `notes` | string | No | Stored in `notes` field |

**Allowed transitions:** `PENDING → APPROVED/REJECTED`, `APPROVED → REJECTED`

### Response

```json
{ "data": { "id": "uuid", "status": "APPROVED" } }
```

---

## 12. Payouts — List

**`GET /api/v1/web/earning/payouts`**

Paginated, filterable list of all payouts.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | `PENDING` \| `ON_HOLD` \| `PROCESSING` \| `PAID` \| `FAILED` | Filter by status |
| `userId` | UUID | Filter by user |
| `amountMin` | string (integer) | Filter `total_units >=` |
| `amountMax` | string (integer) | Filter `total_units <=` |
| `dateFrom` | `YYYY-MM-DD` or ISO 8601 | Filter `created_at >=` |
| `dateTo` | `YYYY-MM-DD` or ISO 8601 | Filter `created_at <=` |
| `page` | integer | Default: `1` |
| `limit` | integer (1–100) | Default: `50` |
| `sortBy` | `created_at` \| `total_units` \| `status` \| `holding_release_at` | Default: `created_at` |
| `sortDir` | `asc` \| `desc` | Default: `desc` |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "total_units": "50000000",
      "currency": "USD",
      "status": "PENDING",
      "event_ids": ["uuid1", "uuid2"],
      "holding_release_at": "2026-03-25T00:00:00.000Z",
      "created_at": "2026-03-18T00:00:00.000Z",
      "paid_at": null,
      "approved_by": null,
      "approved_at": null,
      "held_by": null,
      "held_at": null,
      "held_reason": null,
      "released_by": null,
      "released_at": null,
      "transaction_ref": null,
      "payment_provider": null,
      "failed_reason": null,
      "admin_note": null,
      "user_name": "John Doe"
    }
  ],
  "total": 38,
  "page": 1,
  "limit": 50
}
```

---

## 13. Payouts — Get Single

**`GET /api/v1/web/earning/payouts/:id`**

Returns all payout fields plus the user's email and aggregated event stats.

### Response (snake_case — raw SQL)

All fields from [Payouts List](#12-payouts--list), plus:

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "total_units": "50000000",
    "currency": "USD",
    "status": "PENDING",
    "event_ids": ["uuid1", "uuid2"],
    "holding_release_at": "2026-03-25T00:00:00.000Z",
    "event_count": "2",
    "event_sum_units": "50000000",
    "created_at": "2026-03-18T00:00:00.000Z",
    "paid_at": null,
    "approved_by": null,
    "approved_at": null,
    "held_by": null,
    "held_at": null,
    "held_reason": null,
    "released_by": null,
    "released_at": null,
    "transaction_ref": null,
    "payment_provider": null,
    "failed_reason": null,
    "admin_note": null
  }
}
```

> `event_count` and `event_sum_units` are strings.

---

## 14. Payouts — Approve

**`PATCH /api/v1/web/earning/payouts/:id/approve`**

Moves payout to `PROCESSING`. Sets `approvedBy` and `approvedAt`.

**Required status:** `PENDING`
**Guard:** Returns `400` if `holding_release_at` is still in the future.

### Request Body

```json
{ "note": "Holding period elapsed, approved for disbursement" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string | No |

### Response (camelCase — TypeORM entity)

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "totalUnits": "50000000",
    "currency": "USD",
    "status": "PROCESSING",
    "approvedBy": "admin-uuid",
    "approvedAt": "2026-03-25T10:00:00.000Z",
    "adminNote": "Holding period elapsed, approved for disbursement",
    "holdingReleaseAt": "2026-03-25T00:00:00.000Z",
    "createdAt": "2026-03-18T00:00:00.000Z",
    "paidAt": null
  }
}
```

---

## 15. Payouts — Hold

**`PATCH /api/v1/web/earning/payouts/:id/hold`**

Puts a payout on manual hold. Sets `heldBy`, `heldAt`, `heldReason`.

**Required status:** `PENDING` or `PROCESSING`

### Request Body

```json
{ "reason": "Suspicious activity — awaiting compliance review" }
```

| Field | Type | Required |
|-------|------|----------|
| `reason` | string (non-empty) | Yes |

### Response

Full updated `Payout` entity (camelCase).

---

## 16. Payouts — Release Hold

**`PATCH /api/v1/web/earning/payouts/:id/release`**

Releases a held payout back to `PENDING`. Sets `releasedBy` and `releasedAt`.

**Required status:** `ON_HOLD`

### Request Body

```json
{ "note": "Compliance review concluded — no issues found" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string | No |

### Response

Full updated `Payout` entity (camelCase).

---

## 17. Payouts — Mark Paid

**`PATCH /api/v1/web/earning/payouts/:id/mark-paid`**

Records a completed disbursement. Sets `paidAt`, `paymentProvider`, `transactionRef`, `paymentReference`.

**Required status:** `PROCESSING`

### Request Body

```json
{
  "providerName": "Wise",
  "transactionRef": "WISE-TXN-001234",
  "note": "Manual bank transfer"
}
```

| Field | Type | Required |
|-------|------|----------|
| `providerName` | string (non-empty) | Yes |
| `transactionRef` | string (non-empty) | Yes |
| `note` | string | No |

### Response

Full updated `Payout` entity (camelCase).

---

## 18. Payouts — Mark Failed

**`PATCH /api/v1/web/earning/payouts/:id/mark-failed`**

Records a failed disbursement. Sets `failedReason`.

**Required status:** `PROCESSING`

### Request Body

```json
{
  "reason": "INVALID_BANK_DETAILS",
  "note": "Account number rejected by Wise"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `reason` | enum | Yes | `INVALID_BANK_DETAILS` \| `ACCOUNT_FROZEN` \| `PROVIDER_ERROR` \| `OTHER` |
| `note` | string | No | |

### Response

Full updated `Payout` entity (camelCase).

---

## 19. Payouts — Retry

**`POST /api/v1/web/earning/payouts/:id/retry`**

Re-queues a failed payout back to `PROCESSING`.

**Required status:** `FAILED`

### Request Body

```json
{ "note": "User updated bank details" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string | No |

### Response

Full updated `Payout` entity (camelCase).

---

## 20. User Earning Profile

**`GET /api/v1/web/earning/users/:userId`**

Comprehensive earning profile for a single user.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page for `recentEvents` section |
| `limit` | integer (1–100) | `30` | Items per page for `recentEvents` |
| `payoutsPage` | integer | `1` | Page for `payouts` section (fixed 20 per page) |

### Response

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "earningSuspended": false,
      "earningSuspendedBy": null,
      "earningSuspendedAt": null,
      "earningSuspendedReason": null,
      "payoutBlocked": false,
      "payoutBlockedBy": null,
      "payoutBlockedAt": null,
      "payoutBlockedCategory": null,
      "earningPlanSwitchCount": 1,
      "maxEarningPlanSwitches": 3,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "earningPlan": {
      "id": "uep-uuid",
      "userId": "uuid",
      "earningPlanId": "plan-uuid",
      "selectedAt": "2026-01-05T00:00:00.000Z",
      "earningPlan": {
        "id": "plan-uuid",
        "planName": "Standard View Plan",
        "planType": "VIEW_BASED",
        "rewardPerViewUnits": "1000",
        "rewardPerSignupUnits": "0",
        "isActive": true
      }
    },
    "totalEarned": "50000000",
    "totalPaid": "20000000",
    "recentEvents": [
      {
        "id": "uuid",
        "event_type": "FILE_VIEW",
        "reward_units": "1000",
        "currency": "USD",
        "status": "APPROVED",
        "inserted_at": "2026-03-18T09:00:00.000Z",
        "fraud_flags": []
      }
    ],
    "payouts": [
      {
        "id": "uuid",
        "total_units": "50000000",
        "currency": "USD",
        "status": "PAID",
        "created_at": "2026-03-01T00:00:00.000Z",
        "paid_at": "2026-03-08T00:00:00.000Z",
        "holding_release_at": "2026-03-08T00:00:00.000Z"
      }
    ],
    "fraudSummary": {
      "totalEvents": 120,
      "flaggedEvents": 3,
      "rejectedEvents": 1,
      "rejectionRate": 0.0083
    }
  }
}
```

**Notes:**
- `earningPlan` is `null` if the user has not selected a plan.
- `totalEarned` sums events with status `APPROVED`, `PAYABLE`, or `PAID`.
- `totalEarned` and `totalPaid` are strings (BIGINT).
- `recentEvents` uses `page`/`limit` query params.
- `payouts` uses `payoutsPage` with a fixed page size of 20.
- `fraudSummary.rejectionRate` is a float (e.g. `0.0083` = 0.83%).

---

## 21. User — Suspend Earning

**`PATCH /api/v1/web/earning/users/:userId/suspend`**

Suspends earning for a user. While suspended, new views and referrals will not generate revenue events.

**Guard:** Returns `400` if earning is already suspended.

### Request Body

```json
{ "reason": "Confirmed fraudulent account activity" }
```

| Field | Type | Required |
|-------|------|----------|
| `reason` | string (non-empty) | Yes |

### Response

```json
{ "data": { "userId": "uuid", "earningSuspended": true } }
```

---

## 22. User — Reinstate Earning

**`PATCH /api/v1/web/earning/users/:userId/reinstate`**

Re-enables earning for a suspended user. Clears all suspension fields.

**Guard:** Returns `400` if earning is not currently suspended.

### Request Body

```json
{ "note": "Account cleared after manual review" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string (non-empty) | Yes |

### Response

```json
{ "data": { "userId": "uuid", "earningSuspended": false } }
```

---

## 23. User — Override Earning Plan

**`PATCH /api/v1/web/earning/users/:userId/plan-override`**

Assigns a specific earning plan to a user, bypassing normal user-facing plan switch limits.

**Guards:**
- Plan must exist and be active (`isActive = true`). Returns `400` if plan not found or inactive.
- User must exist.

### Request Body

```json
{
  "planId": "plan-uuid",
  "resetSwitchCount": true,
  "note": "Migrating to new tier plan as part of Q2 initiative"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planId` | UUID | Yes | Target earning plan ID |
| `resetSwitchCount` | boolean | Yes | If `true`, resets `earningPlanSwitchCount` to `0` |
| `note` | string (non-empty) | Yes | Audit reason |

### Response

```json
{
  "data": {
    "userId": "uuid",
    "earningPlanId": "plan-uuid",
    "resetSwitchCount": true
  }
}
```

---

## 24. User — Block Payouts

**`PATCH /api/v1/web/earning/users/:userId/block-payouts`**

Prevents future payout settlements for this user. The settlement worker skips users with `payoutBlocked = true`.

### Request Body

```json
{
  "reason": "Legal hold — fraud investigation in progress",
  "category": "LEGAL_HOLD"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `reason` | string (non-empty) | Yes | Free-text reason |
| `category` | enum | Yes | `ACCOUNT_BAN` \| `LEGAL_HOLD` \| `FRAUD_CONFIRMED` \| `OTHER` |

### Response

```json
{
  "data": {
    "userId": "uuid",
    "payoutBlocked": true,
    "category": "LEGAL_HOLD"
  }
}
```

---

## 25. User — Unblock Payouts

**`PATCH /api/v1/web/earning/users/:userId/unblock-payouts`**

Removes the payout block. Clears `payoutBlockedBy`, `payoutBlockedAt`, `payoutBlockedCategory`.

**Guard:** Returns `400` if payouts are not currently blocked.

### Request Body

```json
{ "note": "Investigation concluded — no fraud found" }
```

| Field | Type | Required |
|-------|------|----------|
| `note` | string (non-empty) | Yes |

### Response

```json
{ "data": { "userId": "uuid", "payoutBlocked": false } }
```

---

## 26. Config — Get

**`GET /api/v1/web/earning/config`**

Returns all system config key-value pairs plus the 20 most recent changes to config from the audit log.

### Response

```json
{
  "data": {
    "config": {
      "HIGH_VELOCITY_THRESHOLD": "50",
      "IP_CLUSTER_THRESHOLD": "10",
      "IP_RATE_LIMIT_PER_MIN": "5",
      "FRAUD_HOLD_DAYS": "3",
      "PAYOUT_HOLD_DAYS": "7"
    },
    "history": [
      {
        "id": "uuid",
        "admin_user_id": "admin-uuid",
        "action": "UPDATE_CONFIG",
        "entity_type": "system_config",
        "entity_id": "FRAUD_HOLD_DAYS",
        "before_value": { "value": "2" },
        "after_value": { "value": "3" },
        "note": null,
        "created_at": "2026-03-18T09:00:00.000Z"
      }
    ]
  }
}
```

### Config Key Reference

| Key | Default | Description |
|-----|---------|-------------|
| `HIGH_VELOCITY_THRESHOLD` | `100` | Max views from one IP within 1 hour before `HIGH_VELOCITY` flag |
| `IP_CLUSTER_THRESHOLD` | `5` | Max unique users per IP within 24 hours before `IP_CLUSTER` flag |
| `IP_RATE_LIMIT_PER_MIN` | `60` | Max view events per IP per minute before rate-limiting |
| `FRAUD_HOLD_DAYS` | `1` | Days a flagged event remains in fraud hold before worker re-processes |
| `PAYOUT_HOLD_DAYS` | `3` | Holding period (days) before a payout can be approved |

---

## 27. Config — Update

**`PATCH /api/v1/web/earning/config`**

Updates one or more system config values. Uses UPSERT — creates the key if it does not exist yet.

### Request Body

All fields are optional. Include only the keys you want to update.

```json
{
  "highVelocityThreshold": 60,
  "ipClusterThreshold": 15,
  "ipRateLimitPerMin": 8,
  "fraudHoldDays": 5,
  "payoutHoldDays": 10
}
```

| Field | DB Key | Type |
|-------|--------|------|
| `highVelocityThreshold` | `HIGH_VELOCITY_THRESHOLD` | positive integer |
| `ipClusterThreshold` | `IP_CLUSTER_THRESHOLD` | positive integer |
| `ipRateLimitPerMin` | `IP_RATE_LIMIT_PER_MIN` | positive integer |
| `fraudHoldDays` | `FRAUD_HOLD_DAYS` | positive integer |
| `payoutHoldDays` | `PAYOUT_HOLD_DAYS` | positive integer |

### Response

```json
{ "data": { "updatedKeys": ["HIGH_VELOCITY_THRESHOLD", "FRAUD_HOLD_DAYS"] } }
```

Only the keys included in the request body are listed in `updatedKeys`.

---

## 28. Plans — List

**`GET /api/v1/web/earning/plans`**

Returns all earning plans including soft-deleted ones. Not paginated.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `isActive` | `true` \| `false` | Filter active/inactive plans. Omit for all (including deleted). |

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "planName": "Standard View Plan",
      "planType": "VIEW_BASED",
      "rewardPerViewUnits": "1000",
      "rewardPerSignupUnits": "0",
      "tierThreshold": null,
      "tierRewardPerViewUnits": "0",
      "tierRewardPerSignupUnits": "0",
      "currency": "USD",
      "description": "Default view-based reward plan",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

> No pagination — response is `{ "data": [...] }` directly (no `total`, `page`, `limit`).

---

## 29. Plans — Create

**`POST /api/v1/web/earning/plans`**

Creates a new earning plan.

### Request Body

```json
{
  "planName": "Premium Referral Plan",
  "planType": "SIGNUP_REFERRAL",
  "rewardPerViewUnits": 0,
  "rewardPerSignupUnits": 5000000,
  "tierThreshold": 10,
  "tierRewardPerViewUnits": 0,
  "tierRewardPerSignupUnits": 7500000,
  "currency": "USD",
  "description": "Higher referral reward for power users",
  "isActive": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planName` | string (non-empty) | Yes | Display name |
| `planType` | `VIEW_BASED` \| `SIGNUP_REFERRAL` | Yes | Plan category |
| `rewardPerViewUnits` | non-negative integer | Yes | Reward per file view (use `0` for referral-only plans) |
| `rewardPerSignupUnits` | non-negative integer | Yes | Reward per signup referral (use `0` for view-only plans) |
| `tierThreshold` | positive integer | No | Referral count to unlock tier reward |
| `tierRewardPerViewUnits` | non-negative integer | No | Tier view reward (default `0`) |
| `tierRewardPerSignupUnits` | non-negative integer | No | Tier referral reward (default `0`) |
| `currency` | 3-char string | Yes | e.g. `"USD"` |
| `description` | string | No | Admin notes |
| `isActive` | boolean | Yes | Whether users can select this plan |

### Response

Full `EarningPlan` entity (camelCase) — same shape as a row in [Plans List](#28-plans--list).

---

## 30. Plans — Update by ID

**`PATCH /api/v1/web/earning/plans/:id`**

Updates fields on an existing earning plan. All body fields are optional.

> **Important:** The plan `id` comes from the URL parameter — do **not** include `id` or `planId` in the request body.

### Request Body

```json
{
  "planName": "Updated Plan Name",
  "rewardPerViewUnits": 1200,
  "rewardPerSignupUnits": 5500000,
  "tierThreshold": 20,
  "tierRewardPerViewUnits": 1500,
  "tierRewardPerSignupUnits": 8000000,
  "isActive": false,
  "description": "Deprecated in favour of v2 plan"
}
```

All fields are optional. Only fields present in the body are updated.

### Response

```json
{
  "data": {
    "id": "uuid",
    "planName": "Updated Plan Name",
    "planType": "VIEW_BASED",
    "rewardPerSignupUnits": "5500000",
    "rewardPerViewUnits": "1200",
    "tierThreshold": "20",
    "tierRewardPerViewUnits": "1500",
    "tierRewardPerSignupUnits": "8000000",
    "isActive": false,
    "description": "Deprecated in favour of v2 plan"
  }
}
```

---

## 31. Plans — Update (Legacy)

**`PATCH /api/v1/web/earning/plans`**

> **Deprecated.** Use [Plans — Update by ID](#30-plans--update-by-id) instead.

Updates an earning plan using `planId` in the request body.

### Request Body

```json
{
  "planId": "uuid",
  "rewardPerSignupUnits": 6000000,
  "rewardPerViewUnits": 1500,
  "isActive": true
}
```

| Field | Type | Required |
|-------|------|----------|
| `planId` | UUID | Yes |
| `rewardPerSignupUnits` | non-negative integer | No |
| `rewardPerViewUnits` | non-negative integer | No |
| `isActive` | boolean | No |

### Response

```json
{
  "data": {
    "id": "uuid",
    "planType": "VIEW_BASED",
    "rewardPerSignupUnits": "6000000",
    "rewardPerViewUnits": "1500",
    "isActive": true
  }
}
```

---

## 32. Audit Log

**`GET /api/v1/web/earning/audit-log`**

Paginated log of all admin actions. Supports CSV export.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `adminUserId` | string | Filter by admin who performed the action |
| `action` | string | Filter by action type (see table below) |
| `entityType` | string | `revenue_event` \| `payout` \| `user` \| `earning_plan` \| `system_config` |
| `entityId` | string | Filter by specific entity ID |
| `dateFrom` | `YYYY-MM-DD` or ISO 8601 | Filter `created_at >=` |
| `dateTo` | `YYYY-MM-DD` or ISO 8601 | Filter `created_at <=` |
| `page` | integer | Default: `1` |
| `limit` | integer (1–200) | Default: `50` |
| `format` | `csv` | Returns CSV file download instead of JSON |

### Action Types

| Action | Entity Type | Triggered by |
|--------|------------|-------------|
| `APPROVE_EVENT` | `revenue_event` | Endpoint 7, Endpoint 5 (bulk) |
| `REJECT_EVENT` | `revenue_event` | Endpoint 8, Endpoint 5 (bulk) |
| `MANUAL_FLAG` | `revenue_event` | Endpoint 10 |
| `OVERRIDE_FRAUD_FLAG` | `revenue_event` | Endpoint 9 |
| `APPROVE_PAYOUT` | `payout` | Endpoint 14 |
| `HOLD_PAYOUT` | `payout` | Endpoint 15 |
| `RELEASE_PAYOUT` | `payout` | Endpoint 16 |
| `MARK_PAYOUT_PAID` | `payout` | Endpoint 17 |
| `MARK_PAYOUT_FAILED` | `payout` | Endpoint 18 |
| `RETRY_PAYOUT` | `payout` | Endpoint 19 |
| `SUSPEND_EARNING` | `user` | Endpoint 21 |
| `REINSTATE_EARNING` | `user` | Endpoint 22 |
| `ADMIN_PLAN_OVERRIDE` | `user` | Endpoint 23 |
| `BLOCK_PAYOUTS` | `user` | Endpoint 24 |
| `UNBLOCK_PAYOUTS` | `user` | Endpoint 25 |
| `UPDATE_CONFIG` | `system_config` | Endpoint 27 |
| `CREATE_PLAN` | `earning_plan` | Endpoint 29 |
| `UPDATE_PLAN` | `earning_plan` | Endpoint 30 |

### Response (JSON)

```json
{
  "data": [
    {
      "id": "uuid",
      "admin_user_id": "admin-uuid",
      "action": "APPROVE_EVENT",
      "entity_type": "revenue_event",
      "entity_id": "event-uuid",
      "before_value": { "status": "PENDING" },
      "after_value": { "status": "APPROVED" },
      "note": "Verified clean",
      "created_at": "2026-03-18T10:00:00.000Z"
    }
  ],
  "total": 1420,
  "page": 1,
  "limit": 50
}
```

### Response (CSV Download)

When `format=csv`:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit_log.csv"
```

Columns: `id, admin_user_id, action, entity_type, entity_id, before_value, after_value, note, created_at`

JSON fields (`before_value`, `after_value`) are serialised as escaped JSON strings within CSV cells.

> Pagination still applies. Use `limit=200` (maximum) for large exports.

---

## Error Reference

| HTTP | When |
|------|------|
| `400` | Business rule violation (wrong status, condition not met, already in target state) |
| `401` | Missing or invalid Bearer token |
| `403` | Valid token but user is not an admin |
| `404` | Entity not found |
| `422` | Request body/query failed Zod validation (wrong type, missing required field, invalid enum value, invalid date format) |
| `500` | Unexpected server error |

### Error Response Shape

```json
{
  "status": 400,
  "message": "Payout holding period has not elapsed yet"
}
```

---

## Integration Notes

1. **Admin JWT:** Obtain via the standard auth flow (`/api/v1/auth/firebase-auth` or OTP). The JWT payload is `{ userId }`. The user record must have `isAdmin = true` in the database.

2. **Reward units are always strings.** Whether from a raw SQL query or TypeORM entity, `reward_units` / `rewardUnits` / `total_units` / `totalUnits` are serialised as strings. To display as USD: `(BigInt(units) / BigInt(1_000_000)).toString()`.

3. **camelCase vs snake_case:** Mutation endpoints return TypeORM entity fields in **camelCase**. List/detail GET endpoints using raw SQL return **snake_case**. This is intentional and consistent across all endpoints.

4. **Pagination shape:** All paginated endpoints return `{ data: [...], total, page, limit }`. The `/plans` list endpoint is the only exception — it returns `{ data: [...] }` with no pagination fields.

5. **Date filter format:** `dateFrom`/`dateTo` accept `YYYY-MM-DD` or full ISO 8601 strings. Any other format returns HTTP `422`.

6. **Status guards are enforced server-side.** Attempting a transition from a disallowed status returns HTTP `400` with a descriptive message. Always check the current status before calling a transition endpoint.

7. **Holding period for payouts:** A payout cannot be approved until `holding_release_at` is in the past. The holding period length is controlled by the `PAYOUT_HOLD_DAYS` system config key.

8. **Auto-approval vs manual approval:** The settlement worker (Stage 4) automatically moves `PENDING → PROCESSING` once `holding_release_at` passes, *unless* the user's `payoutBlocked = true`. The admin approval endpoint (endpoint 14) is for manual intervention on specific payouts before Stage 4 runs, or for payouts where the automatic flow needs to be overridden. In normal operation, most payouts will be auto-approved by Stage 4.

9. **Dead payout statuses:** The `payout_status_enum` type in the database contains legacy values `UNDER_REVIEW` and `APPROVED` from an earlier design. These are never set by any current code path. You may see them if filtering raw DB records; do not rely on them in new UI.
