# Completeness Review: agencyServices

**Review date:** 2026-07-20

## Assessment basis

Static inspection plus isolated PostgreSQL startup, login, session/API acceptance, maintained tests, and a production build. Live third-party connectors and outbound delivery were not exercised.

## Classification

**Functional but incomplete**

This is a substantive but unfinished sales/customer operations application, not just an empty scaffold. Inspection found 159 source files across `src/`, `prisma/` using Next.js, React, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate CRM, email/calendar, enrichment, consent, and suppression sources with bidirectional, deduplicated sync.
2. Implement explicit lead/account lifecycle, ownership, approvals, attribution, and handoff/retry states.
3. Add deliverability, opt-out, regional privacy, rate-limit, and human-review controls for automated outreach.
4. Measure conversion and data quality with representative end-to-end workflow tests rather than generated sample records.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.

## Evidence inspected

- `src/app/codex/custom-viz/page.tsx:31`
- `prisma/seed.ts:8`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Choose one real sales/customer operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-18)

1. **Completed in the application boundary** — Added tenant-scoped CRM/email/calendar/enrichment/consent/suppression source contracts with stable source identities, payload hashes, versions, freshness, deletion markers, deduplicating upserts, payload-bound idempotency, and a governed provider boundary. Live provider credentials, sending-domain setup, and production connector certification remain external deployment gates.
2. **Completed** — Added explicit outreach ownership and `draft → review_pending → approved → queued → sent/delivered` failure/cancellation states, optimistic versions, independent manager approval, attribution, immutable events, provider receipts, retry/dead-letter handling, and transactionally created delivery commands.
3. **Completed in code; external policy review remains** — Enforced affirmative consent evidence, suppression/opt-out, EU/UK privacy basis, recipient frequency caps, tenant rate limits, versioned templates, future scheduling, accountable ownership, and human review before send. Counsel review and provider deliverability certification are not claimed.
4. **Completed** — Added deterministic conversion and data-quality metrics plus representative tests for duplicate identities, incomplete records, attribution, consent, suppression, regional privacy, frequency/rate limits, lifecycle shortcuts, idempotency, and delivery failures; generated sample records are excluded from the governed boundary.
5. **Completed** — Added 12 unit/contract/integration-boundary controls in CI, an additive append-only migration, migration safety checks, a documented fail-closed environment, and a non-destructive check/migrate/start lifecycle with rollback, reconciliation, incident, and secret-rotation guidance.

## Runtime acceptance (2026-07-20)

- `start.sh start` requires an explicit validated `BACKEND_PORT`, refuses an occupied port, binds only to loopback, and contains no dependency installation, migration, or seed action. Test launches use the original project source while the database remains disposable.
- Demo data now requires `ALLOW_DEMO_SEED=true` and an injected password. The separate acknowledgement-gated administrator provisioner refuses account overwrite and stores a bcrypt cost-12 credential.
- Isolated acceptance used PostgreSQL `127.0.0.1:55615` and one Next.js listener at `127.0.0.1:6044`; reserved UI port `6045` remained unused. The result is `API_VERIFIED / startup_login_session_api` in `_runtime_non_suite_repair_shard2k.tsv`: credentials were checked against Prisma PostgreSQL data and NextAuth's authenticated session endpoint returned the persisted user.
- All 12 maintained governance tests passed. The Next.js 14 production build passed after moving a non-route SSE helper out of an App Router route export and adding missing string types to generated sample-request handlers; its prerender phase reports expected database-unavailable diagnostics when `DATABASE_URL` is intentionally absent but exits successfully. Shell syntax and assigned-listener release checks passed.
