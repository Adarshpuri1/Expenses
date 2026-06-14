# Scope Document

## Database Schema

### Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW |

**Indexes**: email (unique)

#### groups
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| created_by | INTEGER | FK → users.id |
| created_at | TIMESTAMP | DEFAULT NOW |

**Indexes**: created_by

#### group_memberships
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| group_id | INTEGER | FK → groups.id |
| user_id | INTEGER | FK → users.id |
| joined_at | TIMESTAMP | NOT NULL |
| left_at | TIMESTAMP | NULLABLE |

**Indexes**: (group_id, user_id) unique where left_at IS NULL, group_id, user_id, joined_at, left_at

**Rule**: left_at = NULL means active member

#### expenses
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| group_id | INTEGER | FK → groups.id |
| paid_by | INTEGER | FK → users.id |
| description | VARCHAR(500) | NOT NULL |
| amount | INTEGER | NOT NULL (paise) |
| currency | VARCHAR(3) | DEFAULT 'INR' |
| amount_inr | INTEGER | NULLABLE (converted amount) |
| exchange_rate | DECIMAL(15,4) | NULLABLE |
| split_type | ENUM | equal/exact/percentage/shares |
| date | DATE | NOT NULL |
| is_settlement | BOOLEAN | DEFAULT FALSE |
| is_duplicate_flag | BOOLEAN | DEFAULT FALSE |
| is_refund | BOOLEAN | DEFAULT FALSE |
| import_row_ref | VARCHAR(100) | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW |

**Indexes**: group_id, paid_by, date, (group_id, date)

#### expense_splits
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| expense_id | INTEGER | FK → expenses.id |
| user_id | INTEGER | FK → users.id |
| owed_amount | INTEGER | NOT NULL (paise) |
| is_settled | BOOLEAN | DEFAULT FALSE |
| settled_at | TIMESTAMP | NULLABLE |

**Indexes**: (expense_id, user_id) unique, user_id, is_settled

#### settlements
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| group_id | INTEGER | FK → groups.id |
| paid_by | INTEGER | FK → users.id |
| paid_to | INTEGER | FK → users.id |
| amount | INTEGER | NOT NULL (paise) |
| currency | VARCHAR(3) | DEFAULT 'INR' |
| date | DATE | NOT NULL |
| expense_refs | JSONB | NULLABLE |
| notes | TEXT | NULLABLE |

**Indexes**: group_id, paid_by, paid_to, date

#### import_sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| group_id | INTEGER | FK → groups.id |
| filename | VARCHAR(255) | NOT NULL |
| imported_by | INTEGER | FK → users.id |
| imported_at | TIMESTAMP | DEFAULT NOW |
| report_json | JSONB | NULLABLE |
| status | ENUM | pending/reviewing/confirmed/completed/failed |
| total_rows | INTEGER | NULLABLE |
| clean_rows | INTEGER | NULLABLE |
| anomaly_count | INTEGER | DEFAULT 0 |

**Indexes**: group_id, imported_by, status

#### anomalies
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| import_session_id | INTEGER | FK → import_sessions.id |
| row_number | INTEGER | NOT NULL |
| anomaly_type | ENUM | See below |
| severity | ENUM | info/warning/error/critical |
| description | TEXT | NOT NULL |
| raw_data | JSONB | NULLABLE |
| suggested_action | VARCHAR(500) | NULLABLE |
| action_taken | ENUM | pending/approved/rejected/auto_resolved/ignored |
| requires_approval | BOOLEAN | DEFAULT TRUE |
| approved_by | INTEGER | FK → users.id, NULLABLE |
| approved_at | TIMESTAMP | NULLABLE |

**Indexes**: import_session_id, anomaly_type, action_taken, severity

#### exchange_rates
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| from_currency | VARCHAR(3) | NOT NULL |
| to_currency | VARCHAR(3) | NOT NULL |
| rate | DECIMAL(15,6) | NOT NULL |
| source | VARCHAR(100) | NULLABLE |
| fetched_at | TIMESTAMP | DEFAULT NOW |
| expires_at | TIMESTAMP | NOT NULL |

**Indexes**: (from_currency, to_currency) unique, expires_at

#### refresh_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | FK → users.id |
| token | VARCHAR(500) | UNIQUE |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW |
| revoked | BOOLEAN | DEFAULT FALSE |
| revoked_at | TIMESTAMP | NULLABLE |
| user_agent | VARCHAR(500) | NULLABLE |
| ip_address | VARCHAR(45) | NULLABLE |

**Indexes**: token (unique), user_id, expires_at, revoked

---

## Anomaly Catalog

| Type | Severity | Auto-resolve | Requires Approval |
|------|----------|--------------|-------------------|
| DUPLICATE_EXACT | error | No | Yes |
| DUPLICATE_SIMILAR | warning | No | Yes |
| CURRENCY_MISMATCH | info | Yes | No |
| SETTLEMENT_AS_EXPENSE | warning | No | Yes |
| NEGATIVE_AMOUNT | warning | Yes | No |
| FUTURE_DATE | warning | No | No |
| INACTIVE_MEMBER | error | No | Yes |
| MISSING_PAYER | critical | No | Yes |
| INVALID_SPLIT | critical | No | Yes |
| MISSING_CURRENCY | warning | Yes | No |
| FORMAT_INCONSISTENCY | info | Yes | No |
| SPLIT_MEMBER_MISMATCH | critical | No | Yes |

---

## API Overview

### Authentication Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/logout-all
- GET /api/auth/me

### Group Endpoints
- POST /api/groups
- GET /api/groups
- GET /api/groups/:id
- PUT /api/groups/:id
- DELETE /api/groups/:id
- GET /api/groups/:id/members
- POST /api/groups/:id/members
- DELETE /api/groups/:id/members/:userId
- GET /api/groups/:id/stats

### Expense Endpoints
- POST /api/groups/:id/expenses
- GET /api/groups/:id/expenses
- GET /api/groups/:id/expenses/:expenseId
- PUT /api/groups/:id/expenses/:expenseId
- DELETE /api/groups/:id/expenses/:expenseId

### Balance Endpoints
- GET /api/groups/:id/balances
- GET /api/groups/:id/settlement-suggestions

### Settlement Endpoints
- POST /api/groups/:id/settlements
- GET /api/groups/:id/settlements
- GET /api/groups/:id/settlements/:settlementId
- DELETE /api/groups/:id/settlements/:settlementId

### Import Endpoints
- POST /api/groups/:id/import
- POST /api/groups/:id/import/:sessionId/confirm
- GET /api/groups/:id/import/:sessionId
- GET /api/groups/:id/import-history
- POST /api/groups/:id/import/:sessionId/anomalies/:anomalyId

---

## Supported Split Types

### Equal
Amount divided equally among all active members at the expense date.

### Exact
User specifies exact amounts for each member. Total must match expense amount.

### Percentage
User specifies percentage for each member. Must sum to 100%.

### Shares
Weighted allocation based on shares. Example: 1:2 share ratio.

---

## Membership Rules

A user is considered an **active member** on date X if:
- `joined_at <= X`
- AND (`left_at IS NULL` OR `left_at > X`)

Only active members can:
- Be assigned as payer
- Be included in splits
- View expenses
