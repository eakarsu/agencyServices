import { Prisma, type AIContent, type AIContentType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { toolPrompts, structuredTools } from "./agency-ai-tools";
import { createFeatureReportHandlers, type FeatureReport, type ProviderReport, type ReportActor, type ReportStore } from "./feature-reports";

const contentTypes: Record<string, AIContentType> = { content: "MARKETING_CONTENT", email: "EMAIL", social: "SOCIAL_POST", seo: "SEO_CONTENT", proposal: "PROPOSAL", interview: "INTERVIEW_QUESTIONS" };
function scope(actor: ReportActor, feature: string): Prisma.AIContentWhereInput {
  return { AND: [{ metadata: { path: ["userId"], equals: actor.id } }, { metadata: { path: ["feature"], equals: feature } }] };
}
function report(row: AIContent): FeatureReport {
  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {};
  return { id: row.id, prompt: row.prompt, content: row.content, model: typeof metadata.model === "string" ? metadata.model : "unknown", createdAt: row.createdAt, receipt: metadata.receipt };
}
function data(actor: ReportActor, feature: string, prompt: string, result: ProviderReport) {
  const tool = feature.replace(/^native-advisory:/, "");
  return { type: contentTypes[tool] || "REPORT" as AIContentType, prompt, content: result.content, metadata: JSON.parse(JSON.stringify({ userId: actor.id, feature, model: result.model, receipt: result.receipt })) as Prisma.InputJsonValue };
}
function versioned(actor: ReportActor, feature: string, previous: FeatureReport): Prisma.AIContentWhereInput {
  return { ...scope(actor, feature), id: previous.id, prompt: previous.prompt, content: previous.content, AND: [...(scope(actor, feature).AND as Prisma.AIContentWhereInput[]), { metadata: { path: ["model"], equals: previous.model } }] };
}
const store: ReportStore = {
  async list(actor, feature) { return (await prisma.aIContent.findMany({ where: scope(actor, feature), orderBy: { createdAt: "desc" }, take: 50 })).map(report); },
  async find(actor, feature, id) { const row = await prisma.aIContent.findFirst({ where: { ...scope(actor, feature), id } }); return row ? report(row) : null; },
  async create(actor, feature, prompt, result) { return report(await prisma.aIContent.create({ data: data(actor, feature, prompt, result) })); },
  async update(actor, feature, previous, prompt, result) {
    return prisma.$transaction(async tx => {
      const changed = await tx.aIContent.updateMany({ where: versioned(actor, feature, previous), data: data(actor, feature, prompt, result) });
      if (changed.count !== 1) return null;
      const row = await tx.aIContent.findFirst({ where: { ...scope(actor, feature), id: previous.id } });
      return row ? report(row) : null;
    });
  },
  async delete(actor, feature, previous) { return (await prisma.aIContent.deleteMany({ where: versioned(actor, feature, previous) })).count === 1; },
};
export async function agencyActor(): Promise<ReportActor | null> {
  const session = await getServerSession(authOptions), id = session?.user && (session.user as { id?: string }).id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  return user ? { id: user.id } : null;
}
export function agencyReportHandlers(tool: string, actor: ReportActor, title = `${tool} tool`) {
  return createFeatureReportHandlers({ feature: `native-advisory:${tool}`, title, instructions: toolPrompts[tool], structured: structuredTools.has(tool), store, authenticate: async () => actor });
}
