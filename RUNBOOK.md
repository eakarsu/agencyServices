# Governed outreach operations

The `/api/governed-outreach` boundary is authoritative for connector identity, consent/suppression state, outreach approval, delivery receipts, and retries. Generated gap pages and sample seed records are not production workflow evidence. Provider credentials remain outside request payloads.

Install dependencies explicitly, copy `.env.example`, run `./start.sh check`, back up PostgreSQL, and apply migrations with `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Startup is read-only with respect to schema/data and never creates databases, installs packages, seeds, resets, edits environment files, or kills unrelated processes. Roll back application code while retaining additive tables; restore a backup only after reconciling accepted outreach.

CRM, email, calendar, enrichment, consent, and suppression connectors must supply stable source IDs, versions, freshness timestamps, and replay-safe keys. Operations stop on suppression, opt-out, missing consent, privacy-basis, recipient-frequency, or tenant-rate-limit violations. A different manager approves outreach; provider workers store non-secret receipts and dead-letter permanent or exhausted failures.

External connector credentials, sending-domain authentication/reputation, privacy counsel review, and provider certification are deployment gates, not asserted by this repository. Rotate any historical `.env` values after checking Git history. Preserve append-only events during incidents and reconcile bounces, complaints, conversions, and deletion propagation before replay.
