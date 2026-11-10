# AI Usage

Project: Smart Campus.

- Submission preparation: AI helped add optional, non-destructive demonstration data based on the assignment example and align the Smart Campus branding and README. PostgreSQL runtime verification of this seeding change is still pending.

AI assistance was used for debugging, error handling, writing and revising code, interpreting the assignment, and planning implementation steps to support faster delivery. Its role included substantial implementation and test assistance, not only proofreading. The repository and test results should be used to assess the final work.

- Tool used: OpenAI Codex / ChatGPT.
- Planning and requirements: used to read the five-page assignment, extract mandatory constraints, divide the work into milestones, and check implementation decisions against the brief.
- Backend implementation: used to help scaffold the ASP.NET Core API, model `classes` and `holds`, create EF Core migrations and constraints, implement the eight required endpoints, and design transaction-safe seat allocation.
- Frontend implementation: used to help build the React identity screen, typed API client, admin class management, student reservation workflow, countdown, application history, confirmation, cancellation, error states, responsive layout, and visual refinements.
- Testing and verification: used to help create and run unit and integration tests, including real-PostgreSQL concurrency tests, browser workflow checks, Docker startup checks, and persistence verification.
- Documentation: used to help maintain the README, assumptions, verification report, milestone plan, and this disclosure.
- Corrections found through human review: early generated UI content used demo-oriented class names, repeated metric cards, and technical labels that did not read like a real school workflow; these were replaced with compact admission tables, realistic class-and-shift examples, and school-facing language.
- Corrections found through the final requirement audit: the first class-list implementation refreshed after user actions but missed the brief's automatic few-second seat-count refresh. The PDF was reread page by page, the gap was identified, and five-second background refresh was added before submission.
- Human review: implementation choices, generated code, commands, UI behavior, and test results were reviewed during each milestone. Framework sample content unrelated to the assignment was removed.

- Current review correction (2026-11-10): AI-assisted code review found that expiry timestamps were checked before database lock waits. The checks were moved after lock acquisition, and a real PostgreSQL lock-contention regression test was added. This revision's backend tests have not yet passed in the current environment; see `SUBMISSION_AUDIT.md` for the current verification limits.
