

# Discovery and Alerting Audit -- Search and Notifications

## SECURITY GAPS

### SEC-1: Search Query SQL Injection Risk (Critical)
**File:** `src/components/GlobalSearch.tsx` (lines 117, 135, 154, 159, 191, 209, 230)

Every search query interpolates raw user input directly into Supabase filter strings:
```typescript
.or(`name.ilike.%${searchTerm}%,species.ilike.%${searchTerm}%`)
```

A malicious user can craft a `searchTerm` containing Supabase filter operators (e.g., commas, parentheses, dots) to manipulate the query logic. The `ilike` pattern is injected without escaping special characters like `%`, `_`, `,`, `.`, or `)`.

**Fix:** Sanitize the search term by escaping special PostgREST filter characters before interpolation, or move search logic to a server-side RPC function that uses parameterized queries.

---

### SEC-2: Search Has No Debouncing -- Database Flooding (High)
**File:** `src/components/GlobalSearch.tsx` (line 106)

The search query fires a React Query fetch on every keystroke (as soon as `query.length >= 2`). There is no debouncing. Typing "cat food" triggers 7 separate database round-trips (one per character after the 2nd), each executing 4-7 parallel table queries. A fast typer or automated script could generate hundreds of queries per minute.

The project already has a `useDebounce` hook (`src/hooks/useDebounce.ts`) that is not being used here.

**Fix:** Apply `useDebounce(query, 300)` to the search query before passing it to React Query's `queryKey`.

---

### SEC-3: Client-Side Role Filtering for Search Scope (Medium)
**File:** `src/components/GlobalSearch.tsx` (lines 186, 225)

Admin-only searches (orders, user profiles) and clinic-owner searches (appointments) are gated by client-side `if (isAdmin)` and `if (isClinicOwner)` checks. While RLS on these tables provides backend protection (e.g., only admins can SELECT from `orders` for other users), the queries are still executed client-side. This means:

- A non-admin user's query to `orders` returns zero rows (RLS blocks it) but still consumes a database connection
- The search logic reveals which tables exist and what columns are queryable via browser DevTools inspection

This is not a data leak (RLS protects the data), but it is unnecessary query overhead and information leakage about the schema.

**Fix:** The current RLS policies are strong enough to prevent data exposure. However, for efficiency and defense-in-depth, the role checks should remain to avoid wasteful queries. No urgent action needed, but migrating to a server-side RPC would eliminate this entirely.

---

### SEC-4: Notifications Use `as any` Type Casting (Medium)
**File:** `src/hooks/useNotifications.ts` (lines 17, 73, 88)

Three occurrences of `.from('notifications' as any)` bypass TypeScript's type system. This means column name typos, missing fields, or schema mismatches will not be caught at compile time.

**Fix:** Add the `notifications` table to the generated Supabase types (it likely already exists in the database but may not be in the type definition), then remove all `as any` casts.

---

## MISSING TRIGGERS

### TRG-1: No Toast on New Notification Arrival (Medium)
**File:** `src/hooks/useNotifications.ts` (line 48)

The realtime subscription correctly invalidates the React Query cache when a new notification arrives, but it does NOT trigger a `sonner` toast. Users must manually check the bell icon to see new notifications. On desktop, a new appointment booking or order status change goes completely unnoticed unless the user is already looking at the bell.

**Fix:** In the realtime callback, when `payload.eventType === 'INSERT'`, trigger a `toast()` with the notification title and message. Import `toast` from `sonner`.

---

### TRG-2: No Notification Created When Appointment is Booked (High)
**Architecture Gap**

When a Pet Parent books an appointment via `book_appointment_atomic()`, the function inserts into `appointments` but does NOT insert into `notifications` for the Doctor or Clinic Owner. The only appointment notification trigger is `notify_waitlist_on_cancellation()` which fires on cancellation, not on booking.

This means Doctors and Clinic Owners have no way to know a new appointment was booked until they manually check their dashboard.

**Fix:** Create a database trigger `notify_on_new_appointment()` that fires on INSERT into `appointments`, creating notification records for the clinic owner (and assigned doctor if applicable).

---

### TRG-3: No Notification Created When Order is Placed (High)
**Architecture Gap**

When a Pet Parent places an order via `create_order_with_stock()`, no notification is sent to the Admin. Admins only discover new orders by manually visiting the orders page.

**Fix:** Create a database trigger `notify_admin_on_new_order()` that fires on INSERT into `orders`, creating a notification for all admin-role users.

---

### TRG-4: No Notification on Order Status Change (Medium)
**Architecture Gap**

When an Admin updates an order status (accepted, shipped, delivered, rejected), no notification is sent to the Pet Parent who placed the order. The user must manually check their order history.

**Fix:** Create a database trigger `notify_user_on_order_update()` that fires on UPDATE of `orders.status`, creating a notification for the order's `user_id`.

---

## REFACTOR PLAN

### Phase 1: Search Security and Performance (3 files)

| File | Change |
|---|---|
| `src/components/GlobalSearch.tsx` | 1. Add `useDebounce(query, 300)` for the search query. 2. Sanitize search input by escaping PostgREST special characters (`%`, `_`, `,`, `.`, `(`, `)`) before interpolation. |
| No new files needed | The existing Command component pattern is correct. No architectural change needed. |

### Phase 2: Notification Triggers (1 SQL migration)

| Change | Type |
|---|---|
| `notify_on_new_appointment()` trigger | DB trigger on `appointments` INSERT -- notifies clinic owner and assigned doctor |
| `notify_admin_on_new_order()` trigger | DB trigger on `orders` INSERT -- notifies all admin users |
| `notify_user_on_order_update()` trigger | DB trigger on `orders` UPDATE (status change) -- notifies the order's user |

### Phase 3: Notification UX (1 file)

| File | Change |
|---|---|
| `src/hooks/useNotifications.ts` | 1. Add `toast()` call in the realtime callback for INSERT events. 2. Remove `as any` casts if `notifications` table is in the generated types. |

### Summary

| ID | Severity | Category | Issue |
|---|---|---|---|
| SEC-1 | Critical | Security | Search query injection via unescaped PostgREST filters |
| SEC-2 | High | Performance | No debouncing on search -- database flooding |
| TRG-2 | High | Missing Trigger | No notification when appointment is booked |
| TRG-3 | High | Missing Trigger | No notification when order is placed |
| SEC-3 | Medium | Security | Client-side role filtering (mitigated by RLS) |
| SEC-4 | Medium | Code Quality | Notifications use `as any` type casts |
| TRG-1 | Medium | UX | No toast on new notification arrival |
| TRG-4 | Medium | Missing Trigger | No notification on order status change |

**Total: 1 SQL migration (3 triggers), 2 files modified. No new dependencies.**

