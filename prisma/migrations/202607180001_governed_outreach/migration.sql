BEGIN;
CREATE TABLE IF NOT EXISTS "GovernedContactSource" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "provider" TEXT NOT NULL,
  "sourceRecordId" TEXT NOT NULL, "emailNormalized" TEXT NOT NULL, "sourceVersion" TEXT NOT NULL,
  "payloadHash" CHAR(64) NOT NULL, "consentStatus" TEXT NOT NULL, "consentRef" TEXT,
  "suppressed" BOOLEAN NOT NULL DEFAULT FALSE, "deletedAtSource" TIMESTAMPTZ,
  "lastSyncedAt" TIMESTAMPTZ NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE ("tenantId", "provider", "sourceRecordId")
);
CREATE TABLE IF NOT EXISTS "GovernedOutreach" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "contactSourceId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "channel" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'draft', "version" INTEGER NOT NULL DEFAULT 1,
  "requestHash" CHAR(64) NOT NULL, "idempotencyKey" TEXT NOT NULL, "decision" JSONB NOT NULL,
  "approvedBy" TEXT, "scheduledAt" TIMESTAMPTZ NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("contactSourceId") REFERENCES "GovernedContactSource"("id") ON DELETE RESTRICT,
  UNIQUE ("tenantId", "idempotencyKey"), UNIQUE ("tenantId", "id")
);
CREATE TABLE IF NOT EXISTS "GovernedOutreachEvent" (
  "seq" BIGSERIAL PRIMARY KEY, "tenantId" TEXT NOT NULL, "outreachId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL, "eventType" TEXT NOT NULL, "details" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("tenantId", "outreachId") REFERENCES "GovernedOutreach"("tenantId", "id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "GovernedOutreachOutbox" (
  "id" BIGSERIAL PRIMARY KEY, "tenantId" TEXT NOT NULL, "outreachId" TEXT NOT NULL,
  "provider" TEXT NOT NULL, "operation" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'queued', "attempts" INTEGER NOT NULL DEFAULT 0,
  "leaseToken" UUID, "leaseExpiresAt" TIMESTAMPTZ, "nextAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "receipt" JSONB, "lastErrorCode" TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("tenantId", "outreachId") REFERENCES "GovernedOutreach"("tenantId", "id") ON DELETE RESTRICT,
  UNIQUE ("tenantId", "provider", "idempotencyKey")
);
CREATE INDEX IF NOT EXISTS "GovernedContactEmail_idx" ON "GovernedContactSource"("tenantId", "emailNormalized");
CREATE INDEX IF NOT EXISTS "GovernedOutreachState_idx" ON "GovernedOutreach"("tenantId", "state", "scheduledAt");
CREATE INDEX IF NOT EXISTS "GovernedOutboxReady_idx" ON "GovernedOutreachOutbox"("status", "nextAttemptAt");
CREATE OR REPLACE FUNCTION outreach_event_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'outreach events are append-only'; END $$;
DROP TRIGGER IF EXISTS "GovernedOutreachEvent_append_only" ON "GovernedOutreachEvent";
CREATE TRIGGER "GovernedOutreachEvent_append_only" BEFORE UPDATE OR DELETE ON "GovernedOutreachEvent" FOR EACH ROW EXECUTE FUNCTION outreach_event_append_only();
COMMIT;
