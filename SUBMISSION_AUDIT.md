# Submission audit - 10 November 2026

Project: **Smart Campus** (`0xSafkat20/Smart_Campus`).

## Demonstration-data update

Added optional startup seeding after migrations, enabled by default in Docker Compose. Morning Shift starts with 120 total / 15 held / 80 confirmed / 25 available, matching the brief's example. Day Shift is an additional synthetic example with 60 / 2 / 10 / 48. Counts are derived from application records and change when holds expire. Existing matching classes are skipped, and restarts do not reset holds. `SEED_DEMO_DATA=false` disables future seeding. Runtime seeding and PostgreSQL checks remain pending because Docker's engine is unavailable.

## Current decision

Implementation is substantially complete, but the latest revision is **not yet certified submission-ready**. All eight required API methods and paths are implemented with the specified response fields. No wholly absent mandatory functional area was found in source review. Runtime verification is incomplete: Docker's Linux engine is unavailable on this machine and the .NET test host failed to connect.

Source: the newly supplied five-page assignment (version named `Asst_Software_Engineer_Project_Assignment(2).pdf`). Its extracted text was reviewed; pages contain duplicated/overlaid text. Local PDF download/rendering was unsuccessful, so visual verification of the original page layout is not claimed. The confidential PDF is not included in this repository.

Status meanings: **Implemented** means supported by source inspection, not a fresh runtime pass. **Passed** means executed successfully in this review. **Partial** means implementation exists but evidence or delivery remains incomplete. **Pending** means an action remains. Historical results in VERIFICATION.md are not fresh evidence for this revision.

## Stack, setup and documents

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| C# .NET 8+ | Implemented | API and tests target net10.0; both compiled in this review. |
| PostgreSQL; ORM choice allowed | Implemented | Npgsql, EF Core, migrations, PostgreSQL 17 Compose service. |
| React 18+, JS or TS | Passed | React 19 and TypeScript; production build succeeds. |
| Vite recommended; UI library optional | Implemented | Vite, plain React and CSS. |
| Backend at localhost:8080 | Implemented | Compose mapping and ASPNETCORE_URLS; live HTTP check blocked. |
| Database connection from environment | Implemented | ConnectionStrings__DefaultConnection / DATABASE_CONNECTION_STRING. |
| Frontend backend URL from environment | Implemented | VITE_API_BASE_URL consumed by API client and Vite service. |
| Root docker-compose.yml | Passed configuration check | docker compose config --quiet exits 0. |
| Both Dockerfiles; only Docker required to run app | Partial verification | Multi-stage backend build; frontend npm ci in image. Fresh build/start blocked by missing Docker engine. |
| Database initialization without manual DB commands | Implemented | Program.cs automatically runs EF migrations. |
| Persistence after compose down/up | Partial verification | Named postgres_data volume configured; restart test not repeated. Never use down -v for this check. |
| README startup, frontend URL and test commands | Implemented | README.md includes all three. |
| Short assumptions with reasons | Implemented | ASSUMPTIONS.md covers IDs, shifts, identity, payment, timestamps, locking and cancellation. |
| At least three automated backend tests, including concurrency | Implemented; execution pending | Existing suite plus nine added cases. Real PostgreSQL tests send 20 requests for three seats and duplicate student requests. |
| AI tool, uses, mistakes and detection | Implemented | AI_USAGE.md names ChatGPT/Codex, implementation/debugging help, prior corrections and current expiry correction. |
| Public GitHub repository and meaningful history | Partial delivery check | origin is 0xSafkat20/Smart_Campus; local milestone/merge history exists. Remote accessibility not rechecked; current edits are uncommitted and unpushed. |
| Submit by 11 November 2026, 11:59:59 PM; no later commits | Pending user delivery | Finish verification and deliver before the brief's cutoff. No form submission performed. |
| Keep assignment PDF private | Implemented | PDF filename pattern, tmp and output ignored; git-tracked file list contains no assignment PDF. |

## Every required API

All paths and JSON names below match the brief. These are **implemented**, but fresh HTTP execution is blocked. IDs are UUIDs as allowed by the brief and documented in assumptions.

| Method and path | Required input / output | Evidence |
|---|---|---|
| POST /classes | name, totalSeats -> 201: id, name, totalSeats | ClassesController.Create, CreateClassRequest/Response |
| GET /classes | 200 array: id, name, totalSeats, heldSeats, confirmedSeats, availableSeats | ClassesController.GetAll |
| GET /classes/{classId} | 200 same seat summary; unknown ID 404 | ClassesController.GetById |
| POST /classes/{classId}/holds | X-Student-Id; 201: holdId, classId, studentId, status, expiresAt; no seat 409 | HoldsController.Create |
| GET /holds/{holdId} | 200: holdId, classId, status, expiresAt | HoldLifecycleController.GetById; this endpoint has no required identity header in the brief. |
| POST /holds/{holdId}/confirm | X-Student-Id; 200: holdId, status CONFIRMED | HoldLifecycleController.Confirm |
| DELETE /holds/{holdId} | X-Student-Id; successful response 204 | HoldLifecycleController.Cancel |
| GET /me/holds | X-Student-Id; 200 array: holdId, classId, className, status, expiresAt | MyHoldsController.GetAll |

## Mandatory business rules

| Rule | Status | Evidence / scenario |
|---|---|---|
| First-come seat allocation, no lottery | Implemented | Transactional reservation endpoint; no lottery logic. Concurrent acceptance is serialized by database lock acquisition, not guaranteed network arrival order. |
| Treat each shift as a separate class | Implemented | Each named class/shift has its own record and capacity. |
| No login; birth registration identity | Implemented | Identity screen/local storage; no authentication requirement added. |
| Exact 17-digit X-Student-Id | Implemented | StudentIdentity rejects missing, repeated, wrong length and non-ASCII-digit headers. Frontend validation tests pass. |
| held + confirmed never exceeds totalSeats | Partial verification | PostgreSQL class FOR UPDATE lock, transaction and active counts. Concurrency tests exist but could not execute now. |
| HOLD_DURATION_SECONDS, default 600 | Implemented | HoldOptions and Program configuration. Positive value enforced. |
| Expiry releases capacity without calling an expiry API | Implemented | Seat queries exclude HELD rows at/beyond expiresAt; no scheduled/manual expiry call needed for availability. |
| At most one active/confirmed application per student/class | Implemented | Class lock, duplicate query, filtered unique database index. |
| Only owner can confirm an unexpired HELD application | Implemented; corrected | Owner check and 404 for another student; expiry now checked after lock acquisition. |
| Repeated confirmation increments confirmedSeats once | Implemented | Hold lock and return-existing CONFIRMED state; counts derived from records. |
| Valid cancellation releases capacity | Implemented | HELD/CONFIRMED -> CANCELLED; repeated cancellation 204; expired record remains EXPIRED. |
| Invalid inputs return 4xx, not 500 | Partial verification | API validation, 400/404/409 branches; added seven malformed JSON/null/negative/fractional/overflow cases. Arbitrary-input exhaustiveness is not claimed. |
| All statuses HELD/CONFIRMED/EXPIRED/CANCELLED | Implemented | Domain enum, database constraint and API serialization. |

## UI requirements

| Requirement | Status | Evidence / remaining scenario |
|---|---|---|
| Admin creates classes with seat counts | Implemented | /admin, ClassCatalog form, POST /classes. |
| Class list shows total, held, confirmed, available | Implemented | Admin/student table includes all four values. |
| Apply/reserve button | Implemented | POST hold; full, busy or already-applied states disabled. |
| Application status, countdown, fee and cancel actions | Implemented | ApplicationsPanel and applicationState.ts. |
| All own applications and individual statuses | Implemented | /me/holds, application history and per-row actions. |
| Simulated successful payment, no gateway | Implemented | Confirmation button calls required confirmation endpoint. |
| At expiry show EXPIRED and disable payment without reload | Partial verification | One-second clock and effectiveStatus logic; unit tests pass. Rendered end-to-end expiry needs rerun. |
| Seat counts refresh every few seconds without reload | Implemented | Five-second catalog polling plus refresh after actions. Browser behavior not rechecked now. |
| Reload/reopen retains current applications | Implemented | Student ID restored from local storage; applications fetched from server. Browser reopen test pending. |
| Friendly full/expired/invalid/server-off errors | Partial verification | RequestFeedback, ApiError and inline validation. Network/problem-detail unit tests pass; live outage and race UI checks pending. |
| Simple usable visual interface | Partial verification | Existing responsive CSS, labeled controls and four workflow areas inspected. No new rendered-browser pass completed; no unnecessary redesign performed. |

## Optional bonus

| Bonus | Status |
|---|---|
| Two backend processes sharing a database maintain capacity | Architecture supported; not demonstrated by a fresh two-process test. PostgreSQL row locks work across connections; existing concurrency suite uses one application host. |
| Explain multi-process approach in assumptions | Implemented: database is source of truth; no in-memory locking relied upon. |
| Frontend automated tests | Passed: 8/8. |

## Changes in this review

1. Moved the reservation clock read after the class-row lock, so queued requests calculate expiry and available seats using a current timestamp.
2. Moved confirmation/cancellation clock reads after the hold-row lock, so a request waiting past the deadline cannot confirm using a stale pre-wait timestamp.
3. Added a real PostgreSQL lock-wait regression test and a cancellation/expiry reapplication test.
4. Added seven malformed input cases for class creation (null body, missing fields, null name, negative/fractional/overflow seat counts and malformed JSON).
5. Clarified AI assistance and separated historical verification from the latest unverified changes.

## Checks actually run

| Check | Current outcome |
|---|---|
| npm test --prefix frontend | PASS, 8 tests |
| npm run build --prefix frontend | PASS, TypeScript + Vite production build |
| docker compose config --quiet | PASS, exit 0 |
| dotnet restore backend/tests/SchoolAdmission.Api.Tests/SchoolAdmission.Api.Tests.csproj | Succeeded from available packages; NU1900 because vulnerability feed was unreachable |
| Backend and test assembly compilation during dotnet test | Completed, both assemblies produced; no C# compile errors |
| Backend test execution | ABORTED: test host did not connect within 90 seconds; no passed-test count claimed |
| npm run lint --prefix frontend | BLOCKED: Windows Application Control rejected native oxlint binding |
| docker compose up --build -d | BLOCKED: dockerDesktopLinuxEngine named pipe absent; Docker launch attempts did not bring up the engine |
| Live API, clean-download startup, restart persistence, full UI workflow | NOT RUN in this review because backend stack could not start |
| git diff --check | PASS |

## Remaining work before submission

1. Start Docker Desktop and confirm `docker info` shows a working server. Do not disable Windows security protections.
2. Run `docker compose up --build -d`, inspect `docker compose ps` and `docker compose logs backend`, then open http://localhost:5173/admin and http://localhost:5173.
3. Run the backend tests on a working .NET/Docker environment and frontend lint on a supported environment. A previous Linux-container pass does not validate this revision.
4. Through the UI: create a two-seat class, reserve, confirm, cancel, reapply, reload and reopen. Use another student identity to test a full class and verify counts refresh automatically.
5. In a separate disposable Compose project with a short HOLD_DURATION_SECONDS, verify expiry and disabled payment; retain default 600 for delivery. Do not alter or delete existing user data to test this.
6. Check confirmed data survives `docker compose down` followed by `docker compose up -d`, without deleting the volume.
7. Run the verified committed snapshot from a fresh clone/ZIP with only Docker installed. Then commit/push the reviewed changes and submit the repository URL before the deadline.

Publishing was attempted but blocked: local Git could not create a branch under `.git`, and the connected GitHub integration returned 403 `Resource not accessible by integration` when creating the review branch. No remote branch, commit or pull request was created by this update. All changes remain local. The seeding update includes a PostgreSQL test for sample counts and restart/expiry preservation; runtime execution remains pending.
