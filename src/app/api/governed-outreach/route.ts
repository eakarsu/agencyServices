import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { digest, canTransition, normalizeEmail, sourceIdentity, evaluateOutreach, retryState } = require("../../../../governance/outreach.cjs");

const PROVIDERS = new Set(["crm", "email", "calendar", "enrichment", "consent", "suppression"]);
const KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const SCOPE = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/;

function identity(request: NextRequest, auth: Awaited<ReturnType<typeof checkAuth>>) {
  const tenantId = request.headers.get("x-tenant-id") || "";
  const user = auth.session?.user as { id?: string; role?: string } | undefined;
  if (!SCOPE.test(tenantId) || !user?.id || !["ADMIN", "MANAGER", "MEMBER"].includes(user.role || "")) return null;
  return { tenantId, actorId: user.id, role: user.role! };
}
function responseError(error: unknown) {
  console.error("governed outreach request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "Governed outreach operation failed" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request); if (limited) return limited;
  const auth = await checkAuth(); if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const ctx = identity(request, auth); if (!ctx) return NextResponse.json({ error: "tenant-scoped signed identity required" }, { status: 403 });
  const key = request.headers.get("Idempotency-Key") || ""; if (!KEY.test(key)) return NextResponse.json({ error: "valid Idempotency-Key required" }, { status: 400 });
  try {
    const body = await request.json();
    if (body.action === "source-sync") {
      if (!PROVIDERS.has(body.provider)) return NextResponse.json({ error: "allow-listed provider required" }, { status: 422 });
      const sourceKey = sourceIdentity(body.provider, body.sourceRecordId); const email = normalizeEmail(body.email);
      if (!/^\S+@\S+\.\S+$/.test(email) || !String(body.sourceVersion || "").trim()) return NextResponse.json({ error: "email and sourceVersion required" }, { status: 422 });
      const payloadHash = digest({ sourceKey, email, sourceVersion: body.sourceVersion, consentStatus: body.consentStatus, consentRef: body.consentRef || null, suppressed: body.suppressed === true });
      const rows = await prisma.$queryRawUnsafe<unknown[]>(`INSERT INTO "GovernedContactSource" ("id","tenantId","provider","sourceRecordId","emailNormalized","sourceVersion","payloadHash","consentStatus","consentRef","suppressed","deletedAtSource","lastSyncedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) ON CONFLICT ("tenantId","provider","sourceRecordId") DO UPDATE SET "emailNormalized"=EXCLUDED."emailNormalized","sourceVersion"=EXCLUDED."sourceVersion","payloadHash"=EXCLUDED."payloadHash","consentStatus"=EXCLUDED."consentStatus","consentRef"=EXCLUDED."consentRef","suppressed"=EXCLUDED."suppressed","deletedAtSource"=EXCLUDED."deletedAtSource","lastSyncedAt"=NOW(),"updatedAt"=NOW() RETURNING "id","provider","sourceRecordId","sourceVersion","lastSyncedAt"`, randomUUID(), ctx.tenantId, body.provider, String(body.sourceRecordId), email, String(body.sourceVersion), payloadHash, String(body.consentStatus || "unknown"), body.consentRef || null, body.suppressed === true, body.deletedAtSource || null);
      return NextResponse.json({ source: rows[0], dedupeKey: sourceKey });
    }
    if (body.action === "create") {
      const evaluated = evaluateOutreach(body.outreach); if (evaluated.errors.length) return NextResponse.json(evaluated, { status: 422 });
      const requestHash = digest({ contactSourceId: body.contactSourceId, outreach: body.outreach }); const id = randomUUID();
      const row = await prisma.$transaction(async tx => {
        const inserted = await tx.$queryRawUnsafe<any[]>(`WITH created AS (INSERT INTO "GovernedOutreach" ("id","tenantId","contactSourceId","campaignId","ownerId","channel","requestHash","idempotencyKey","decision","scheduledAt") SELECT $1,$2,c."id",$4,$5,$6,$7,$8,$9::jsonb,$10::timestamptz FROM "GovernedContactSource" c WHERE c."id"=$3 AND c."tenantId"=$2 AND c."suppressed"=FALSE AND c."deletedAtSource" IS NULL ON CONFLICT ("tenantId","idempotencyKey") DO NOTHING RETURNING *) SELECT *,FALSE AS replay FROM created UNION ALL SELECT *,TRUE AS replay FROM "GovernedOutreach" WHERE "tenantId"=$2 AND "idempotencyKey"=$8 AND "requestHash"=$7 AND NOT EXISTS(SELECT 1 FROM created) LIMIT 1`, id, ctx.tenantId, body.contactSourceId, evaluated.decision.campaignId, evaluated.decision.ownerId, evaluated.decision.channel, requestHash, key, JSON.stringify(evaluated.decision), evaluated.decision.scheduledAt);
        if (!inserted.length) return null;
        if (!inserted[0].replay) await tx.$executeRawUnsafe(`INSERT INTO "GovernedOutreachEvent" ("tenantId","outreachId","actorId","eventType","details") VALUES ($1,$2,$3,'created',$4::jsonb)`, ctx.tenantId, id, ctx.actorId, JSON.stringify({ idempotencyKey: key }));
        return inserted[0];
      });
      if (!row) return NextResponse.json({ error: "contact missing/suppressed or idempotency conflict" }, { status: 409 });
      return NextResponse.json(row, { status: row.replay ? 200 : 201 });
    }
    if (body.action === "transition") {
      const to = String(body.to || ""); const version = Number(body.version); if (!String(body.reason || "").trim()) return NextResponse.json({ error: "reason required" }, { status: 422 });
      const changed = await prisma.$transaction(async tx => {
        const current = await tx.$queryRawUnsafe<any[]>(`SELECT * FROM "GovernedOutreach" WHERE "id"=$1 AND "tenantId"=$2 FOR UPDATE`, body.id, ctx.tenantId);
        const item = current[0]; if (!item || item.version !== version || !canTransition(item.state, to)) return null;
        if (["approved", "rejected"].includes(to) && (ctx.role === "MEMBER" || item.ownerId === ctx.actorId)) throw new Error("independent manager approval required");
        if (["sent", "delivered", "bounced", "failed"].includes(to) && !["ADMIN", "MANAGER"].includes(ctx.role)) throw new Error("provider/operator transition required");
        const rows = await tx.$queryRawUnsafe<any[]>(`UPDATE "GovernedOutreach" SET "state"=$1,"version"="version"+1,"approvedBy"=CASE WHEN $1='approved' THEN $2 ELSE "approvedBy" END,"updatedAt"=NOW() WHERE "id"=$3 AND "tenantId"=$4 AND "version"=$5 RETURNING *`, to, ctx.actorId, body.id, ctx.tenantId, version);
        await tx.$executeRawUnsafe(`INSERT INTO "GovernedOutreachEvent" ("tenantId","outreachId","actorId","eventType","details") VALUES ($1,$2,$3,$4,$5::jsonb)`, ctx.tenantId, body.id, ctx.actorId, to, JSON.stringify({ reason: String(body.reason).slice(0, 500) }));
        if (to === "queued") await tx.$executeRawUnsafe(`INSERT INTO "GovernedOutreachOutbox" ("tenantId","outreachId","provider","operation","payload","idempotencyKey") VALUES ($1,$2,'email','send',$3::jsonb,$4) ON CONFLICT DO NOTHING`, ctx.tenantId, body.id, JSON.stringify({ outreachId: body.id }), `${body.id}:${version}:send`);
        return rows[0];
      });
      if (!changed) return NextResponse.json({ error: "missing, stale, or forbidden transition" }, { status: 409 });
      return NextResponse.json(changed);
    }
    if (body.action === "delivery-result") {
      if (!['ADMIN', 'MANAGER'].includes(ctx.role) || !['delivered', 'failed'].includes(body.status)) return NextResponse.json({ error: "operator and valid status required" }, { status: 403 });
      if (body.status === 'delivered' && (!body.receipt?.receiptRef || !body.receipt?.receivedAt)) return NextResponse.json({ error: "typed provider receipt required" }, { status: 422 });
      const next = body.status === 'delivered' ? 'delivered' : retryState(Number(body.attempts || 0) + 1, body.retryable !== false);
      const rows = await prisma.$queryRawUnsafe<any[]>(`UPDATE "GovernedOutreachOutbox" SET "status"=$1,"attempts"="attempts"+1,"receipt"=$2::jsonb,"lastErrorCode"=$3,"leaseToken"=NULL,"leaseExpiresAt"=NULL,"nextAttemptAt"=NOW()+INTERVAL '1 minute' * LEAST(60,POWER(2,"attempts")) WHERE "id"=$4 AND "tenantId"=$5 RETURNING *`, next, JSON.stringify(body.receipt || null), body.errorCode || null, body.outboxId, ctx.tenantId);
      return rows.length ? NextResponse.json(rows[0]) : NextResponse.json({ error: "outbox item not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "unsupported action" }, { status: 422 });
  } catch (error) { return responseError(error); }
}
