# Smart Campus

School admission management for students, guardians and school administrators.

Repository: https://github.com/0xSafkat20/Smart_Campus

School admission application with eight required API endpoints, a React admin/student workflow, and PostgreSQL persistence. See [`SUBMISSION_AUDIT.md`](SUBMISSION_AUDIT.md) for the current requirement checklist and verification limits. Historical test results do not certify the latest changes.

Development progress and the required implementation order are tracked in [`PROJECT_PLAN.md`](PROJECT_PLAN.md).

## Required stack

- Backend: C# / ASP.NET Core on .NET 10
- Database: PostgreSQL with Entity Framework Core and Npgsql
- Frontend: React 19, TypeScript, and Vite
- Tests: xUnit and ASP.NET Core integration testing support
- Runtime: Docker Compose

.NET 10 and React 19 satisfy the assignment's ".NET 8 or newer" and "React 18 or newer" constraints.

## Run with Docker

Docker is the only prerequisite. The repository uses root-scoped build contexts so a fresh clone or ZIP download works with Docker Compose's standard builder or Bake mode without extra filesystem-permission flags.

```text
docker compose up --build -d
```

Then open:

- Student portal: http://localhost:5173
- Class administration: http://localhost:5173/admin
- Backend health check: http://localhost:8080/health
- Backend OpenAPI document in development: http://localhost:8080/openapi/v1.json

To stop the services while preserving PostgreSQL data:

```text
docker compose down
```

Do not add `-v` if you want to keep the database volume.

## Demonstration data

Docker Compose enables `SEED_DEMO_DATA=true`. After migrations, the backend adds the following sample classes and synthetic application records if those classes do not already exist:

| Class | Total seats | Held seats | Confirmed seats | Available seats |
|---|---:|---:|---:|---:|
| Class 6 - Morning Shift | 120 | 15 | 80 | 25 |
| Class 6 - Day Shift | 60 | 2 | 10 | 48 |

The Morning Shift values reproduce the assignment's example. Day Shift values are additional demonstration data, not figures specified in the brief. Counts are calculated from actual application records, not hard-coded display values.

These are the **initial** counts: held seats expire after `HOLD_DURATION_SECONDS` (600 seconds by default), so availability increases normally. Restarting never renews sample holds, duplicates applications, or overwrites existing classes. Classes with the same ID or name are left unchanged. Set `SEED_DEMO_DATA=false` before the first startup for an empty database; disabling it later does not delete existing data.

For a quick demo, use synthetic student ID `90000000000000000` to see a held application before expiry, or `90000000000000015` to see a confirmed Morning Shift application. These IDs are fictional. Open `/admin` to view all counts, then use the student portal to reserve, confirm or cancel an application.

The current machine's Docker engine was unavailable during this update, so the seeding implementation has not yet been exercised against PostgreSQL. It will run on the next successful Compose startup.

## Local development commands

Local tools are optional because Docker is the supported project entry point.

Backend:

```text
dotnet tool restore
dotnet restore backend/SchoolAdmission.slnx
dotnet run --project backend/src/SchoolAdmission.Api
```

Frontend:

```text
npm install --prefix frontend
npm run dev --prefix frontend
```

Tests:

```text
dotnet test backend/SchoolAdmission.slnx
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

Docker must be running for backend tests because the required concurrency test starts a temporary real PostgreSQL container.

## Configuration

Copy `.env.example` to `.env` only when overriding the safe local defaults. Important settings:

- `DATABASE_CONNECTION_STRING`: PostgreSQL connection string passed to the backend as `ConnectionStrings__DefaultConnection`.
- `HOLD_DURATION_SECONDS`: hold lifetime; the required default is 600 seconds.
- `VITE_API_BASE_URL`: browser-visible backend URL; defaults to `http://localhost:8080`.
- `FRONTEND_ORIGIN`: allowed frontend origin for CORS.

Entity Framework migrations are stored in `backend/src/SchoolAdmission.Api/Data/Migrations`. The backend applies pending migrations automatically when it starts outside the test environment.

## Implemented API

- `POST /classes` creates a class and returns `id`, `name`, and `totalSeats`.
- `GET /classes` lists classes with `totalSeats`, `heldSeats`, `confirmedSeats`, and `availableSeats`.
- `GET /classes/{classId}` returns the same seat summary for one class.
- `POST /classes/{classId}/holds` creates a temporary seat hold using the `X-Student-Id` header.
- `GET /holds/{holdId}` returns the current hold status.
- `POST /holds/{holdId}/confirm` confirms an owned, unexpired hold idempotently.
- `DELETE /holds/{holdId}` cancels an owned application idempotently.
- `GET /me/holds` lists the current student's applications and class names.

Seat creation is serialized by a PostgreSQL class-row lock. Concurrent requests therefore cannot make `heldSeats + confirmedSeats` exceed `totalSeats`, even when multiple backend processes share the database.

## Implemented frontend workflow

- `/admin` creates class-and-shift records and shows live capacity, reserved, admitted, and open-seat counts.
- The student portal validates and remembers the 17-digit registration number.
- Students can view admission classes and use **Reserve seat** to create a ten-minute hold.
- Seat counts refresh immediately after relevant actions and automatically every five seconds without reloading the page.
- **Application status** shows the active reservation and complete application history.
- Active reservations have a live one-second countdown and fee-confirmation action.
- Eligible held or confirmed applications can be cancelled from the UI.
- At `00:00`, the UI changes the hold to `EXPIRED`, refreshes seat counts, and disables confirmation without a page reload.
- Loading, empty, success, full-class, validation, and server-error states are shown with friendly messages.

The latest automated, browser, error-state, startup, persistence, and final requirement-audit results are recorded in [`VERIFICATION.md`](VERIFICATION.md). Completed milestone evidence is tracked in [`PROJECT_PLAN.md`](PROJECT_PLAN.md).

## Frontend customization

The interface intentionally uses plain React and CSS so it is easy to change:

- Edit colors, borders, radii, and shadows in `frontend/src/index.css`.
- Edit page layouts and responsive breakpoints in `frontend/src/App.css`.
- Edit individual sections in `frontend/src/components`.
- Edit API response shapes in `frontend/src/api/types.ts`.
- Edit endpoint calls in `frontend/src/api/schoolAdmissionApi.ts`.

The student registration number is stored only in browser local storage. Use **Logout** to clear it and return to the identity screen. This is an identity reset, not an authentication system; the assignment does not request login or admin authentication.

To create a later migration after changing the model:

```text
dotnet tool run dotnet-ef migrations add MigrationName --project backend/src/SchoolAdmission.Api --startup-project backend/src/SchoolAdmission.Api --output-dir Data/Migrations
```

Never commit `.env` or the confidential assignment PDF.

## Project structure

```text
backend/
  src/SchoolAdmission.Api/          ASP.NET Core API and persistence setup
  tests/SchoolAdmission.Api.Tests/  Backend test project
frontend/
  src/                              React application
docker-compose.yml                  PostgreSQL, backend, and frontend
ASSUMPTIONS.md                      Decisions where the brief leaves room
AI_USAGE.md                         Required AI-use disclosure
```

## First implementation sequence

1. Model `Class` and `Hold`, including status and expiry timestamps.
2. Add database constraints and migrations before writing endpoints.
3. Implement the eight fixed endpoints without renaming or removing response fields.
4. Make seat holding and confirmation transaction-safe and idempotent.
5. Add at least three backend tests, including concurrent hold requests.
6. Build the four required UI areas around the fixed API contract.
7. Add live expiry, immediate seat-count refresh, persistence after reload, and clear errors.
8. Verify the complete flow using only the UI and `docker compose up`.

Work in small commits after each verified step; the assignment explicitly requires meaningful commit history rather than one final bulk commit.
