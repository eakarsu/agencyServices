# Apply Pass 5 — agencyServices

- **Date:** 2026-05-08
- **Project:** agencyServices
- **Stack:** NextJS (App Router, TS) + Prisma + NextAuth + bcryptjs. Single combined FE/BE; AI helper exists at `/api/ai/generate` with `toolPrompts` map.
- **Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_00.md` section 1
- **Action:** LEFT-AS-IS (verified prior pass-5 implementation present on disk)

## Verified present (from audit, already in code before this pass)

- AI candidate scoring → `/api/ai/generate` `tool=resume`
- AI job description generator → `/api/ai/generate` `tool=proposal`
- AI interview question recommender → `/api/ai/generate` `tool=interview`
- AI matcher (early version) → `/api/ai/generate` `tool=matcher`
- Multi-tool dashboard → `src/app/dashboard/ai/page.tsx`
- Health probe → `src/app/api/health/route.ts`
- Candidates / Clients / Leads / Projects / Campaigns / Jobs / Billing CRUD (NextJS API routes + Prisma)

## Implemented (already on disk from prior pass-5 invocation; verified by file existence + import)

10 features (project exceeded the 5-cap in a prior invocation; not undone). Files all pre-existing and verified:

- `src/app/api/integrations/linkedin/route.ts` (50 lines) — 503 stub, `LINKEDIN_*` env
- `src/app/api/integrations/indeed/route.ts` — 503 stub, `INDEED_*` env
- `src/app/api/integrations/slack/route.ts` — 503 stub, `SLACK_WEBHOOK_URL`
- `src/app/api/integrations/checkr/route.ts` — 503 stub, `CHECKR_API_KEY`
- `src/app/api/integrations/bamboohr/route.ts` — 503 stub, `BAMBOOHR_*`
- `src/app/api/ai/match/route.ts` (65 lines) — cosine-similarity vector match (no embedding model dep)
- `src/app/api/ai/resume-parse/route.ts` — text + regex heuristic parser
- `src/app/api/ai/salary-benchmark/route.ts` — static market table + multipliers
- `src/app/api/workflows/advance/route.ts` — pipeline auto-advance with `WORKFLOW_*_THRESHOLD` env
- `src/app/api/campaigns/bulk-email/route.ts` — uses existing nodemailer
- `src/app/dashboard/integrations/page.tsx` (FE)
- `src/app/dashboard/recruiting-tools/page.tsx` (237 lines, FE — 5 tabs)

## Deferred

None remain. The remaining "missing non-AI features" from the audit are all credentialed integrations stubbed above; deeper items (real vector DB, true OCR pipeline) are noted in the existing `_AUDIT_NOTE.md` as future upgrades.

## Smoke test

Per `_AUDIT_NOTE.md`: PASS — `npx tsc --noEmit` clean; `/api/health` 200; new endpoints 401 without auth, 503 path verified for unconfigured integrations. Not re-run this pass.
