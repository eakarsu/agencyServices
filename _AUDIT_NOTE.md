# Audit Apply Note — agencyServices

## Audit recommendations (from batch_00.md)

### Missing AI counterparts
- AI candidate scoring/suitability analysis
- AI job description generator
- AI interview question recommendation
- AI salary benchmark advisor

### Missing non-AI features
- Workflow automation (auto-advance candidates through pipeline)
- Job board integrations (LinkedIn, Indeed, ZipRecruiter)
- Email campaign templates / bulk outreach
- Background check automation

### Custom feature suggestions
- AI-powered candidate matching (vector embeddings)
- Agentic interview coordinator
- Multi-format resume parsing (OCR + NLP)
- Predictive placement success
- ATS webhooks (BambooHR, Lever), job board syncing, Slack notifications

## Implemented in this pass

NextJS app with single existing AI endpoint (`/api/ai/generate`) and otherwise CRUD-only. Most of the audit recommendations require either:
- domain-specific LLM tool definitions in the existing `toolPrompts` map (low risk but still product/wording decisions);
- third-party integrations.

Mechanical change applied:
- Added `GET /api/health` returning `{status, timestamp, service}` for monitoring/probes.

Files touched:
- `src/app/api/health/route.ts` (new)

Syntax check: PASS (no new errors via `npx tsc --noEmit`).

## Backlog (not implemented)

| Item | Category | Reason |
|---|---|---|
| AI candidate scoring endpoint | TOO-RISKY | Needs schema for candidate profile + scoring response, plus DB write |
| AI job description generator | NEEDS-PRODUCT-DECISION | Output format / brand voice |
| AI interview question recommender | NEEDS-PRODUCT-DECISION | Question framework choice |
| AI salary benchmark advisor | NEEDS-CREDS | Salary data source |
| Workflow automation | TOO-RISKY | Pipeline state machine design |
| Job board integrations | NEEDS-CREDS | LinkedIn/Indeed/ZipRecruiter APIs |
| Bulk email templates | NEEDS-CREDS | Email provider |
| Background check automation | NEEDS-CREDS | Checkr / Sterling APIs |
| Vector candidate matching | TOO-RISKY | Vector DB + embedding pipeline |
| Resume parsing (OCR + NLP) | TOO-RISKY | OCR pipeline / file upload |
| ATS webhooks | NEEDS-CREDS | Bamboo / Lever creds |
| Slack notifications | NEEDS-CREDS | Slack webhook |

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. The single `/api/ai/generate` route already covers every mechanical AI counterpart (`resume` for candidate scoring, `proposal` for JD generation, `interview` for question generation, `matcher`, `email`, `campaign`, `analysis`, etc.) plus a streaming variant. The remaining backlog items are all NEEDS-CREDS (LinkedIn / Indeed / ZipRecruiter, Checkr, BambooHR, Lever, Slack, salary data) or NEEDS-PRODUCT-DECISION (workflow automation pipeline, vector matching, OCR resume parsing). No additional mechanical endpoints needed this pass.

## Apply pass 3 (frontend)

FE already wired. `src/app/dashboard/ai/page.tsx` is a multi-tool dashboard that calls `POST /api/ai/generate` with 12 different `tool` keys (content, email, social, seo, resume, lead, report, matcher, interview, proposal, campaign, analysis). It handles both demo-mode and real responses, including the structured-JSON tools. No changes made; file left as-is per the idempotence rule.

## Apply pass 5 (all backlog)

10 features added across MECHANICAL / NEEDS-CREDS / NEEDS-PRODUCT-DECISION categories.

### NEEDS-CREDS (503 stubs)
- LinkedIn job posting — `POST /api/integrations/linkedin`. Env vars: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`.
- Indeed job posting — `POST /api/integrations/indeed`. Env vars: `INDEED_PUBLISHER_ID`, `INDEED_API_KEY`.
- Slack notifications — `POST /api/integrations/slack`. Env: `SLACK_WEBHOOK_URL`.
- Checkr background checks — `POST /api/integrations/checkr`. Env: `CHECKR_API_KEY`.
- BambooHR ATS sync — `POST /api/integrations/bamboohr`. Env: `BAMBOOHR_API_KEY`, `BAMBOOHR_SUBDOMAIN`.

### MECHANICAL
- Vector candidate matching — `POST /api/ai/match` (cosine similarity over bag-of-words; documented to upgrade to real vector DB later).
- Bulk email campaign — `POST /api/campaigns/bulk-email` (uses existing nodemailer; throttle env `BULK_EMAIL_BATCH_SIZE=50`).

### NEEDS-PRODUCT-DECISION
- Workflow auto-advance — `POST /api/workflows/advance`. Pipeline: `applied → screening → interview → offer → hired`. Thresholds: 0.75 to screening, 0.85 + recruiterApproval to interview. Override via `WORKFLOW_SCREEN_THRESHOLD`, `WORKFLOW_INTERVIEW_THRESHOLD`.
- Resume parser — `POST /api/ai/resume-parse`. Plain-text + regex heuristics. Real PDF/OCR via env `RESUME_OCR_PROVIDER` in future.
- Salary benchmark — `POST /api/ai/salary-benchmark`. Static market table + level/city multipliers. Env `SALARY_DATA_URL` reserved for real provider.

### Frontend pages
- `/dashboard/integrations` — multi-integration tester with explicit "Configure <service>" 503 messages.
- `/dashboard/recruiting-tools` — 5 tabs (matcher, advance, resume, salary, bulk-email).

### Files
- `src/app/api/integrations/{linkedin,indeed,slack,checkr,bamboohr}/route.ts`
- `src/app/api/ai/{match,resume-parse,salary-benchmark}/route.ts`
- `src/app/api/workflows/advance/route.ts`
- `src/app/api/campaigns/bulk-email/route.ts`
- `src/app/dashboard/integrations/page.tsx`
- `src/app/dashboard/recruiting-tools/page.tsx`

### Smoke test
PASS — `npx tsc --noEmit` clean; backend booted; `/api/health` returns 200; new endpoints return 401 without auth (correct), 503 path verified for unconfigured integrations.

### Notes
`start.sh` has a pre-existing SIGPIPE / pipefail bug that causes "Could not create database automatically" even when the DB exists. Worked around by launching `npx next dev` directly with `DATABASE_URL` env.
