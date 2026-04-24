import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 30);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth("MANAGER");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { action, entity, ids, data } = await request.json();

    if (!action || !entity || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: action, entity, ids" },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 items per bulk operation" },
        { status: 400 }
      );
    }

    const userId = (auth.session!.user as { id: string }).id;

    if (action === "delete") {
      let count = 0;
      switch (entity) {
        case "clients":
          ({ count } = await prisma.client.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "projects":
          ({ count } = await prisma.project.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "campaigns":
          ({ count } = await prisma.campaign.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "candidates":
          ({ count } = await prisma.candidate.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "jobs":
          ({ count } = await prisma.jobPosition.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "leads":
          ({ count } = await prisma.lead.deleteMany({ where: { id: { in: ids } } }));
          break;
        case "invoices":
          ({ count } = await prisma.invoice.deleteMany({ where: { id: { in: ids } } }));
          break;
        default:
          return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
      }

      await prisma.activity.create({
        data: {
          userId,
          action: `bulk deleted ${count} ${entity}`,
          entityType: entity,
          entityId: ids.join(","),
        },
      });

      return NextResponse.json({ message: `Deleted ${count} ${entity}`, count });
    }

    if (action === "update") {
      if (!data || typeof data !== "object") {
        return NextResponse.json({ error: "Data is required for update" }, { status: 400 });
      }

      let count = 0;
      switch (entity) {
        case "clients":
          ({ count } = await prisma.client.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "projects":
          ({ count } = await prisma.project.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "campaigns":
          ({ count } = await prisma.campaign.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "candidates":
          ({ count } = await prisma.candidate.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "jobs":
          ({ count } = await prisma.jobPosition.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "leads":
          ({ count } = await prisma.lead.updateMany({ where: { id: { in: ids } }, data }));
          break;
        case "invoices":
          ({ count } = await prisma.invoice.updateMany({ where: { id: { in: ids } }, data }));
          break;
        default:
          return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
      }

      await prisma.activity.create({
        data: {
          userId,
          action: `bulk updated ${count} ${entity}`,
          entityType: entity,
          entityId: ids.join(","),
        },
      });

      return NextResponse.json({ message: `Updated ${count} ${entity}`, count });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 });
  }
}
