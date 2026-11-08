# Project Milestones

Work through this file from top to bottom. Complete, verify, and commit one milestone before starting the next one.

## Milestone 0 - Project foundation

Status: Complete

- Backend and frontend projects created.
- PostgreSQL, backend, and frontend defined in Docker Compose.
- Required environment variables documented.
- README, assumptions, AI disclosure, and Git repository created.

## Milestone 1 - Database foundation

Status: Complete

- `classes` and `holds` entities defined.
- Hold statuses defined as `HELD`, `CONFIRMED`, `EXPIRED`, and `CANCELLED` in PostgreSQL.
- Relationships, validation constraints, indexes, and initial migration added.
- Duplicate active or confirmed admission for the same student and class blocked at database level.
- Pending migrations applied automatically when the backend starts.

## Milestone 2 - Class API

Status: Next

- Implement `POST /classes`.
- Implement `GET /classes`.
- Implement `GET /classes/{classId}`.
- Preserve the exact required response fields.
- Add validation and automated tests.

## Milestone 3 - Create a seat hold safely

Status: Not started

- Read and validate the 17-digit `X-Student-Id` header.
- Implement `POST /classes/{classId}/holds`.
- Read `HOLD_DURATION_SECONDS`, defaulting to 600.
- Return `409` when no seat is available.
- Use a PostgreSQL transaction and class-row lock to prevent overselling.
- Add a concurrent-request test.

## Milestone 4 - Hold lifecycle

Status: Not started

- Implement `GET /holds/{holdId}`.
- Implement `POST /holds/{holdId}/confirm` with ownership and idempotency.
- Implement `DELETE /holds/{holdId}`.
- Implement `GET /me/holds`.
- Expire unpaid holds automatically and release their seats.
- Add backend tests for ownership, expiry, cancellation, and repeated confirmation.

## Milestone 5 - Frontend identity and API layer

Status: Not started

- Add the student registration-number input.
- Validate exactly 17 digits.
- Persist the selected student locally across refreshes.
- Create a typed API client that sends `X-Student-Id`.
- Add clear loading and error states.

## Milestone 6 - Class administration and listing UI

Status: Not started

- Add the class-creation form.
- Show total, held, confirmed, and available seats.
- Add the Apply button.
- Refresh counts immediately after an action.

## Milestone 7 - Application UI

Status: Not started

- Show the current application and all of the student's applications.
- Show status and the live remaining-time countdown.
- Add admission-fee confirmation and cancellation actions.
- Change expired holds to `EXPIRED` without a page reload.
- Disable confirmation after expiry.

## Milestone 8 - Full-system verification

Status: Not started

- Verify every action can be completed through the UI.
- Verify data survives backend and Docker restarts.
- Verify `docker compose up` is the only required startup command.
- Verify friendly errors for full classes, expired holds, invalid input, and server failures.
- Run backend, frontend, concurrency, and persistence tests.

## Milestone 9 - Submission preparation

Status: Not started

- Recheck every requirement against the assignment.
- Complete README, `ASSUMPTIONS.md`, and `AI_USAGE.md`.
- Review meaningful commit history.
- Confirm the confidential assignment PDF is not tracked.
- Push the final state to a public repository before the deadline.
- Make no commits or pushes after the deadline.
