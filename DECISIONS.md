# Architecture Decisions

## 1. PostgreSQL as Database

**Decision**: Use PostgreSQL as the primary database.

**Rationale**:
- Excellent JSONB support for flexible data (expense_refs, report_json)
- Strong referential integrity with foreign keys
- Complex query capabilities for balance calculations
- Mature ecosystem with Sequelize ORM
- Supports indexing for performance

**Alternatives Considered**:
- MongoDB: Less suitable for complex relational queries
- SQLite: Not suitable for production multi-user apps
- MySQL: PostgreSQL offers better JSONB and indexing

---

## 2. Paise Storage (Integer Money)

**Decision**: Store all money as integer paise (smallest currency unit).

**Rationale**:
- Eliminates floating-point precision errors
- JavaScript Number type cannot safely represent all decimal values
- Database DECIMAL is safer but application code still risks errors
- 100 paise = 1 rupee, integer-safe
- Easy to format for display

**Example**:
```javascript
// Wrong: float arithmetic
let total = 0.1 + 0.2; // 0.30000000000000004

// Correct: paise arithmetic
let totalPaise = 10 + 20; // 30 paise = ₹0.30
```

**Conversion**:
```javascript
// Rupees to Paise
const paise = Math.round(parseFloat(rupees) * 100);

// Paise to Rupees
const rupees = paise / 100;
```

---

## 3. Debt Simplification Algorithm

**Decision**: Use greedy matching algorithm to minimize settlement transactions.

**Algorithm**:
1. Calculate net balance for each member
2. Separate into debtors (negative balance) and creditors (positive balance)
3. Sort both lists by absolute amount (descending)
4. Match highest debtor with highest creditor
5. Transfer maximum possible amount
6. Repeat until all debts settled

**Example**:
```
Before: A owes B ₹100, B owes C ₹100, C owes A ₹50
After: A pays C ₹50 (simplified to 1 transaction)
```

**Alternative Considered**: 
- Graph-based optimization (T-matrix): More complex, minimal additional benefit for typical group sizes

---

## 4. Membership Date Boundaries

**Decision**: Use precise date-based membership with joined_at and left_at timestamps.

**Rationale**:
- Flatmates join and leave groups over time
- Expenses must be split among active members at that specific date
- Historical accuracy requires knowing exact membership periods

**Query Logic**:
```sql
-- Get active members at date X
SELECT * FROM group_memberships
WHERE group_id = ?
  AND joined_at <= X
  AND (left_at IS NULL OR left_at > X)
```

**UI Implication**:
- Member timeline visualization
- "As of date" filter on balances
- Historical import validation

---

## 5. Duplicate Detection Approach

**Decision**: Two-tier detection with exact and similar matching.

**Exact Duplicate**:
- Same amount (in paise)
- Same date
- Same description (case-insensitive)

**Similar Duplicate**:
- Similar amount (within ₹1 tolerance)
- Text similarity using Jaccard coefficient > 0.7

**Rationale**:
- Exact matching catches copy-paste errors
- Similar matching catches slight variations
- Both require human approval to prevent false positives

---

## 6. CSV Import Pipeline

**Decision**: Multi-stage import with anomaly review.

**Pipeline**:
1. Upload → Parse CSV
2. Detect Anomalies (12 types)
3. Present for Review
4. Auto-resolve safe anomalies
5. Require approval for critical issues
6. Transactional import

**Rationale**:
- Bank statements and expense exports vary widely in format
- Anomalies catch issues before corrupting data
- User approval prevents unwanted imports

---

## 7. JWT Authentication with Refresh Tokens

**Decision**: Access/Refresh token pair with HttpOnly cookies.

**Access Token**: 15 minutes validity
**Refresh Token**: 7 days validity, stored in HttpOnly cookie

**Rationale**:
- Short-lived access tokens limit exposure if leaked
- Refresh tokens enable seamless session continuation
- HttpOnly cookies prevent XSS token theft
- Database-tracked refresh tokens enable revocation

---

## 8. Currency Conversion Strategy

**Decision**: Cache exchange rates for 24 hours.

**Rationale**:
- Exchange API rate limits
- Sub-second conversion not needed for expense tracking
- Historical rate would be ideal but adds complexity
- Mid-market rate acceptable for group tracking

**Display Format**: `₹2,340 (was $28 @ 83.57)`

---

## 9. API Error Standard

**Decision**: All errors return consistent JSON structure.

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": null | object
}
```

**Rationale**:
- Predictable error handling in frontend
- `code` enables programmatic handling
- `details` provides additional context when needed
- Never expose stack traces or internal details

---

## 10. Single Page Application Architecture

**Decision**: React SPA with Vite build tooling.

**Rationale**:
- Rich interactivity (modals, animations, instant updates)
- Zustand for simple client state management
- No server-side rendering needed for auth-gated app
- Vite provides fast development experience

**State Management**:
- authStore: User session
- groupStore: Current group data
- expenseStore: Expenses and balances
- importStore: CSV import wizard state
