# Verification Report

Verified on 2026-11-09 against the Docker Compose stack on the `test` branch.

## Automated checks

- `dotnet test backend/tests/SchoolAdmission.Api.Tests/SchoolAdmission.Api.Tests.csproj`
  - 24 passed, 0 failed.
  - Includes real-PostgreSQL concurrent hold tests, same-student concurrency, expiry, ownership, confirmation, cancellation, class counts, and persistence-facing API behavior.
- `npm test --prefix frontend`
  - 8 passed, 0 failed.
  - Covers exact 17-digit identity validation, input normalization, countdown formatting, deadline expiry, disabled confirmation, network failure messaging, and API problem-detail messaging.
- `npm run lint --prefix frontend`
  - Passed with no warnings.
- `npm run build --prefix frontend`
  - Production TypeScript and Vite build passed.

## Browser workflow

The following actions were executed through the rendered UI against the real backend and PostgreSQL database:

1. Opened `/admin`, created classes, and saw them appear with live seat counts.
2. Entered an incomplete birth registration number and received the friendly 17-digit validation message.
3. Entered a valid student identity and opened the student portal.
4. Applied for a class and saw the current application and live countdown.
5. Confirmed the admission fee and verified the application became `CONFIRMED`.
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
