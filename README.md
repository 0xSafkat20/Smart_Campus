# School Admission System

Starter scaffold for the take-home assignment. The repository is intentionally at the setup stage: the required runtime, folders, configuration, and dependency boundaries are present, but the admission workflow is not implemented yet.

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

## Configuration

Copy `.env.example` to `.env` only when overriding the safe local defaults. Important settings:

- `DATABASE_CONNECTION_STRING`: PostgreSQL connection string passed to the backend as `ConnectionStrings__DefaultConnection`.
- `HOLD_DURATION_SECONDS`: hold lifetime; the required default is 600 seconds.
- `VITE_API_BASE_URL`: browser-visible backend URL; defaults to `http://localhost:8080`.
- `FRONTEND_ORIGIN`: allowed frontend origin for CORS.

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
