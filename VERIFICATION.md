# Verification Report

Full-system verification was completed on 2026-11-09 against the Docker Compose stack on the `test` branch. A page-by-page final requirement audit was completed on 2026-11-10. The final audit reran all 24 backend tests, all 8 frontend tests, frontend lint, the production build, Docker Compose validation, and a rendered-browser automatic-refresh check.

## Automated checks

- `dotnet test backend/tests/SchoolAdmission.Api.Tests/SchoolAdmission.Api.Tests.csproj`
  - 24 passed, 0 failed.
  - Includes real-PostgreSQL concurrent hold tests, same-student concurrency, expiry, ownership, confirmation, cancellation, class counts, and persistence-facing API behavior.
- `npm test --prefix frontend`
  - 8 passed, 0 failed.
  - Covers exact 17-digit identity validation, input normalization, countdown formatting, deadline expiry, disabled confirmation, network failure messaging, and API problem-detail messaging.
- `npm run lint --prefix frontend`
  - Passed with 0 warnings and 0 errors in the project Linux container.
- `npm run build --prefix frontend`
  - Production TypeScript and Vite build passed.

The backend suite was also run in the official .NET Linux SDK container during the final audit because Windows Application Control blocked locally generated test assemblies in the OneDrive workspace. The container run passed all 24 tests, including the real-PostgreSQL concurrency tests.

## Final requirement audit - 2026-11-10

- All five assignment pages, including the UI/API tables, examples, mandatory rules, bonus section, deliverables, deadline, and confidentiality instruction, were visually reviewed.
- The required stack is present: .NET 10, PostgreSQL, React 19, TypeScript, Vite, and Docker Compose. These satisfy the brief's minimum .NET 8 and React 18 versions.
- The backend listens on port 8080. Database and frontend API URLs are configurable through environment variables.
- All eight fixed API paths and required response fields are preserved. Student-scoped requests use the exact `X-Student-Id` header and validate exactly 17 digits.
- PostgreSQL transactions, row locks, constraints, and tests cover capacity, simultaneous requests, duplicate active applications, expiry, ownership, and idempotent confirmation.
- The required UI areas are present: class creation, class listing and reservation, active application with countdown/actions, and complete application history.
- A rendered-browser check proved that an external reservation changed the open-seat count after 4.8 seconds and cancellation restored it after 4.8 seconds, without a page reload.
- Docker Compose configuration validates successfully, both Dockerfiles exist, and the documented one-command startup uses only Docker.
- README, assumptions, AI disclosure, verification evidence, and more than three backend automated tests are present. The backend suite includes the required concurrent-hold test.
- The repository URL was reachable publicly with HTTP 200. The meaningful milestone history and the `test` and `main` branches were reviewed.
- `.env`, the confidential assignment PDF, local output, temporary browser artifacts, and editor state are not tracked.

## Final delivery record

- The final requirement-alignment commit `6e6333d` was pushed to `test` on 2026-11-10.
- The verified `test` state was merged without conflicts and pushed to the public `main` delivery branch in merge commit `1944fb2` on 2026-11-10.
- The confidential assignment PDF remained untracked throughout delivery.
- Do not commit or push anything after 11 November 2026 at 11:59:59 PM.

## Browser workflow

The following actions were executed through the rendered UI against the real backend and PostgreSQL database:

1. Opened `/admin`, created classes, and saw them appear with live seat counts.
2. Entered an incomplete birth registration number and received the friendly 17-digit validation message.
3. Entered a valid student identity and opened the student portal.
4. Reserved a seat and saw the active reservation and live countdown.
5. Confirmed the fee payment and verified the application became `CONFIRMED`.
6. Applied for another class, cancelled it, and verified it became `CANCELLED`.
7. Simulated a last-seat race and verified the UI showed: `All seats for this class are currently held or confirmed.`
8. Stopped the backend and verified the UI showed: `The server is unavailable. Please check your connection and try again.`
9. Verified a short test hold changed to `EXPIRED` at `00:00`, released the seat, and displayed disabled confirmation without a page reload.

The normal configured hold duration was restored to 600 seconds after the short expiry test.

## Restart and persistence

Before restart, a confirmed application and its class seat count were recorded. The containers were removed with:

```text
docker compose down
```

No volume deletion flag was used. The complete stack was then started with only:

```text
docker compose up -d
```

After startup:

- Backend health returned `ok`.
- Student route returned HTTP 200.
- Admin route returned HTTP 200.
- The same hold ID still had status `CONFIRMED`.
- The class confirmed-seat count was unchanged.
- PostgreSQL reported healthy.

This proves the documented one-command startup and database-volume persistence behavior.

## Interface review

- Admin and student class information is presented in compact tables rather than repeated metric cards.
- Class-and-shift names, seat capacity, reservations, admitted students, and open seats use school-facing language while the fixed API contract remains unchanged.
- Class seat counts refresh automatically every five seconds without a page reload, as required by the brief.
- The student workflow uses **Reserve seat**, **Confirm fee payment**, **Cancel application**, and **Logout** actions.
- The school mark, desktop layout, and mobile layout were visually checked after the final frontend refinement.
