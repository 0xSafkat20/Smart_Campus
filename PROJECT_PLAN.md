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

Status: Complete

- `POST /classes` implemented with validation and a `201` response.
- `GET /classes` implemented with total, held, confirmed, and available seat counts.
- `GET /classes/{classId}` implemented with `404` for an unknown class.
- The exact required response fields are preserved.
- Automated tests cover creation, validation, counts, and missing classes.

## Milestone 3 - Create a seat hold safely

Status: Complete

- The 17-digit `X-Student-Id` header is read and validated.
- `POST /classes/{classId}/holds` returns the required `201` contract.
- `HOLD_DURATION_SECONDS` is configurable and defaults to 600.
- Full classes and duplicate active applications return `409`.
- PostgreSQL transactions and class-row locks prevent overselling across processes.
- Expired holds immediately stop consuming seats without a special expiry endpoint.
- Real-PostgreSQL tests prove expiry behavior and that concurrent requests never exceed capacity.

## Milestone 4 - Hold lifecycle

Status: Complete

- `GET /holds/{holdId}` returns the current status and refreshes expiry.
- `POST /holds/{holdId}/confirm` enforces ownership and is idempotent.
- `DELETE /holds/{holdId}` cancels an owned application and is idempotent.
- `GET /me/holds` returns only the current student's applications with class names.
- Expired unpaid holds release seats and are persisted as `EXPIRED` when observed.
- PostgreSQL-backed tests cover ownership, expiry, cancellation, and repeated confirmation.

## Milestone 5 - Frontend identity and API layer

Status: Complete

- The responsive student access screen validates exactly 17 digits.
- The selected student persists locally across refreshes and can be changed.
- A typed API client covers all eight fixed endpoints and sends `X-Student-Id`.
- Reusable loading and error feedback components are ready for data screens.
- Small React components and centralized CSS variables keep the design easy to change.

## Milestone 6 - Class administration and listing UI

Status: Complete

- `/admin` provides the class-creation form without adding unrequested authentication.
- Admin and student views show total, held, confirmed, and available seats.
- The student portal can create a temporary seat hold with the Apply button.
- Counts refresh immediately after class creation, Apply, or manual refresh.
- Friendly loading, empty, success, full-class, and server-error states are included.
- Docker integration verification proved that Apply changed held seats from 0 to 1 and available seats from 2 to 1.
- A real-PostgreSQL regression test covers the class-list query used by the UI.

## Milestone 7 - Application UI

Status: Complete

- The student portal shows a highlighted current application and the complete application history.
- `HELD`, `CONFIRMED`, `EXPIRED`, and `CANCELLED` states have clear status labels.
- A one-second live countdown shows the remaining hold time.
- Students can confirm the admission fee or cancel an eligible application from the UI.
- Expired holds change to `EXPIRED`, release their seats, and refresh counts without a page reload.
- Confirmation is visibly disabled at `00:00` after expiry.
- Active applications are restored from the backend after a browser reload and duplicate Apply actions are disabled.
- Docker integration verified held, confirmed, cancelled, and expired application states.

## Milestone 8 - Full-system verification

Status: Next

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
