# TraceMind AI Upgrade Plan

This roadmap turns the next set of improvements into clear, portfolio-focused work. The goal is to keep TraceMind AI easy for recruiters to understand while steadily increasing product credibility, technical depth, and demo quality.

## Phase 1: Foundation Hardening

Status: implemented

- Added backend smoke tests for health, generation, and saved analysis history.
- Added frontend data-shape tests for sample outputs and saved-analysis mapping.
- Added GitHub Actions CI for backend tests plus frontend lint, test, and build checks.
- Re-enabled saved run history in the frontend so analyses can be listed and reloaded.
- Updated the README with design decisions, architecture guidance, and a more accurate testing story.

## Phase 2: Portfolio Presentation

Status: next

- Add 2-3 real screenshots to `docs/screenshots/`.
- Record a 45-60 second demo using `DEMO_SCRIPT.md` and `DEMO_CHECKLIST.md`.
- Deploy the frontend and backend to a public preview environment.
- Add live demo and screenshot links near the top of `README.md`.

## Phase 3: Product Depth

Status: planned

- Introduce interchangeable generation providers so mock and live AI modes share one interface.
- Add result comparison views for saved analyses.
- Add reviewer-oriented scoring for coverage, risk, and readiness.
- Expand exports with richer summaries for portfolio walkthroughs.

## Phase 4: Quality Expansion

Status: planned

- Add browser-based interaction tests for the main end-to-end flow.
- Add API contract checks for saved analysis payloads and export endpoints.
- Add more sample requirements to demonstrate multiple workflow scenarios.
- Add structured logging and request tracing for stronger observability.
