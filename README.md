# School Admission System

Incremental implementation of the take-home assignment. The runtime scaffold, database foundation, all eight required backend endpoints, and the editable React identity foundation are complete. Class and application workflows are the next implementation phase.

Development progress and the required implementation order are tracked in [`PROJECT_PLAN.md`](PROJECT_PLAN.md).

## Required stack

- Backend: C# / ASP.NET Core on .NET 10
- Database: PostgreSQL with Entity Framework Core and Npgsql
- Frontend: React 19, TypeScript, and Vite
- Tests: xUnit and ASP.NET Core integration testing support
- Runtime: Docker Compose

.NET 10 and React 19 satisfy the assignment's ".NET 8 or newer" and "React 18 or newer" constraints.

## Run with Docker

Docker is the only prerequisite.

```text
docker compose up
```

Then open:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:8080/health
- Backend OpenAPI document in development: http://localhost:8080/openapi/v1.json

To stop the services while preserving PostgreSQL data:

```text
docker compose down
```

Do not add `-v` if you want to keep the database volume.

## Local development

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

The remaining required endpoints are tracked in `PROJECT_PLAN.md` and will be implemented milestone by milestone.

## Frontend customization

The interface intentionally uses plain React and CSS so it is easy to change:

- Edit colors, borders, radii, and shadows in `frontend/src/index.css`.
- Edit page layouts and responsive breakpoints in `frontend/src/App.css`.
- Edit individual sections in `frontend/src/components`.
- Edit API response shapes in `frontend/src/api/types.ts`.
- Edit endpoint calls in `frontend/src/api/schoolAdmissionApi.ts`.

The student registration number is stored only in browser local storage. Use the **Change student** button to clear it and return to the identity screen.

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
