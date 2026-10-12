import { agencyActor, agencyReportHandlers } from "@/lib/agency-ai-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function guarded(method: "GET" | "POST" | "DELETE") {
  return async (request: Request) => {
    try {
      const actor = await agencyActor();
      if (!actor) return Response.json({ error: "Authentication is required" }, { status: 401 });
      return agencyReportHandlers("gap-advisory:gap-ai-powered-candidate-matching-vector", actor, "AI-powered candidate matching via vector embeddings of CVs vs. job specs advisory report")[method](request);
    } catch {
      return Response.json({ error: "The advisory report service is unavailable. No change was confirmed." }, { status: 503 });
    }
  };
}

export const GET = guarded("GET");
export const POST = guarded("POST");
export const DELETE = guarded("DELETE");
