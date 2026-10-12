import { agencyActor, agencyReportHandlers } from "@/lib/agency-ai-reports";
import { toolPrompts } from "@/lib/agency-ai-tools";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
function validTool(value: unknown): value is string { return typeof value === "string" && Object.prototype.hasOwnProperty.call(toolPrompts, value); }
async function payload(request: Request) {
  const text = await request.text();
  if (Buffer.byteLength(text) > 85000) throw new Error("Request too large");
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request");
  return value as Record<string, unknown>;
}
async function get(request: Request) {
  const actor = await agencyActor();
  if (!actor) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const url = new URL(request.url), tool = url.searchParams.get("tool");
  if (!validTool(tool)) return Response.json({ error: "Select a supported AI tool" }, { status: 422 });
  const handlers = agencyReportHandlers(tool, actor), prompt = url.searchParams.get("prompt");
  if (!prompt || url.searchParams.has("history")) return handlers.GET(request);
  const response = await handlers.POST(new Request(request.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }), signal: request.signal }));
  if (!response.ok) return response;
  const result = await response.json(), encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: result.result.output })}\n\nevent: done\ndata: ${JSON.stringify({ content: result.result.output, model: result.model, id: result.id })}\n\n`));
    controller.close();
  } });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}
async function post(request: Request) {
  const actor = await agencyActor();
  if (!actor) return Response.json({ error: "Authentication is required" }, { status: 401 });
  let input;
  try { input = await payload(request); } catch { return Response.json({ error: "Invalid report request" }, { status: 400 }); }
  if (Object.keys(input).some(key => !["tool", "prompt", "id", "version"].includes(key))) return Response.json({ error: "Unknown report input" }, { status: 422 });
  const tool = new URL(request.url).searchParams.get("tool") || input.tool;
  if (!validTool(tool)) return Response.json({ error: "Select a supported AI tool" }, { status: 422 });
  const { tool: ignored, ...body } = input;
  const response = await agencyReportHandlers(tool, actor).POST(new Request(request.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: request.signal }));
  if (!response.ok) return response;
  const result = await response.json();
  let structured = null;
  try { structured = JSON.parse(result.result.output); } catch {}
  return Response.json({ ...result, content: result.result.output, structured });
}
async function remove(request: Request) {
  const actor = await agencyActor();
  if (!actor) return Response.json({ error: "Authentication is required" }, { status: 401 });
  let input;
  try { input = await payload(request); } catch { return Response.json({ error: "Invalid deletion request" }, { status: 400 }); }
  if (Object.keys(input).some(key => !["tool", "id", "version"].includes(key))) return Response.json({ error: "Unknown deletion input" }, { status: 422 });
  const tool = new URL(request.url).searchParams.get("tool") || input.tool;
  if (!validTool(tool)) return Response.json({ error: "Select a supported AI tool" }, { status: 422 });
  const { tool: ignored, ...body } = input;
  return agencyReportHandlers(tool, actor).DELETE(new Request(request.url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: request.signal }));
}

function guarded(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try { return await handler(request); }
    catch { return Response.json({ error: "The AI report service is unavailable. No change was confirmed." }, { status: 503 }); }
  };
}
export const GET = guarded(get);
export const POST = guarded(post);
export const DELETE = guarded(remove);
