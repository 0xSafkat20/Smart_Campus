# Assumptions

This file records choices that the assignment leaves open. Update it whenever a new unspecified decision is made.

- TypeScript is used instead of JavaScript so API request and response shapes can be checked during development.
- Entity Framework Core with the Npgsql provider is the selected ORM because it supports PostgreSQL and database transactions cleanly.
- The frontend runs at `http://localhost:5173`; the backend remains at the required `http://localhost:8080`.
- Each class and shift combination will be stored as one class record, matching the assignment's instruction to treat shifts as separate classes.
- Student identity will come only from the required 17-digit `X-Student-Id` header. No login or authentication system will be added.
- Admission fee payment will be simulated as immediately successful. No real payment gateway will be added.
- PostgreSQL IDs will use UUIDs. The example prefixes in the brief are illustrative and the brief allows another ID format.
- PostgreSQL will be the source of truth for capacity and concurrency. In-memory locks will not be relied upon, so a later multi-process backend remains possible.
- Dates and expiration timestamps will be stored as UTC `timestamp with time zone` values in PostgreSQL.
- Seat totals will be calculated from hold records instead of being stored as mutable counters. This avoids duplicated state that could drift out of sync.
- Hold creation locks the selected class row inside a PostgreSQL transaction. This makes the capacity check and insert one serialized operation across backend processes.
- Hold confirmation and cancellation lock the selected hold row so repeated or concurrent actions remain idempotent.
- Requests for another student's hold return `404` so one student cannot discover another student's application.
- Cancellation is allowed for both held and confirmed applications and releases the seat; repeating cancellation still returns `204`.
- The 17-digit student number is stored in browser local storage because the assignment explicitly excludes login and requires the student's applications to remain visible after reopening the browser. The UI's **Logout** action only clears this locally stored identity.
- The frontend uses plain React components and CSS variables instead of a UI library so the interface remains simple to understand and change.
