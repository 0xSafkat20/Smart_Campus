# AI Usage

- Tool used: OpenAI Codex / ChatGPT.
- Planning and requirements: used to read the five-page assignment, extract mandatory constraints, divide the work into milestones, and check implementation decisions against the brief.
- Backend implementation: used to help scaffold the ASP.NET Core API, model `classes` and `holds`, create EF Core migrations and constraints, implement the eight required endpoints, and design transaction-safe seat allocation.
- Frontend implementation: used to help build the React identity screen, typed API client, admin class management, student reservation workflow, countdown, application history, confirmation, cancellation, error states, responsive layout, and visual refinements.
- Testing and verification: used to help create and run unit and integration tests, including real-PostgreSQL concurrency tests, browser workflow checks, Docker startup checks, and persistence verification.
- Documentation: used to help maintain the README, assumptions, verification report, milestone plan, and this disclosure.
- Corrections found through human review: early generated UI content used demo-oriented class names, repeated metric cards, and technical labels that did not read like a real school workflow; these were replaced with compact admission tables, realistic class-and-shift examples, and school-facing language.
- Corrections found through the final requirement audit: the first class-list implementation refreshed after user actions but missed the brief's automatic few-second seat-count refresh. The PDF was reread page by page, the gap was identified, and five-second background refresh was added before submission.
- Human review: implementation choices, generated code, commands, UI behavior, and test results were reviewed during each milestone. Framework sample content unrelated to the assignment was removed.
