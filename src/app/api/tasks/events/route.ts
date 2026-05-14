/**
 * Task real-time SSE endpoint
 *
 * Clients connect with GET /api/tasks/events?projectId=<id>
 * The server holds the connection open and emits task:created / task:updated
 * events whenever mutations occur.
 *
 * To emit an event from any PUT/POST task handler, POST to
 * /api/tasks/events/notify (internal, server-to-server only) with
 * { event, task } — or use the emitTaskEvent() helper exported here.
 *
 * Architecture note: Next.js App Router does not support Socket.IO natively.
 * SSE via ReadableStream is the idiomatic real-time pattern for Next.js 14.
 */

import { NextRequest } from "next/server";
import { checkAuth } from "@/lib/apiUtils";

// In-process subscriber registry (works for single-process deployments / dev).
// For multi-instance production, replace with Redis pub/sub.
type Subscriber = {
  controller: ReadableStreamDefaultController;
  projectId: string | null;
};

const subscribers = new Set<Subscriber>();

export function emitTaskEvent(event: "task:created" | "task:updated", task: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(task)}\n\n`;
  const encoder = new TextEncoder();
  for (const sub of Array.from(subscribers)) {
    const taskProjectId = (task as { projectId?: string }).projectId;
    if (sub.projectId && taskProjectId && sub.projectId !== taskProjectId) continue;
    try {
      sub.controller.enqueue(encoder.encode(payload));
    } catch {
      // Client disconnected; will be cleaned up on abort
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await checkAuth();
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status ?? 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const projectId = request.nextUrl.searchParams.get("projectId") || null;
  const encoder = new TextEncoder();

  let subscriber: Subscriber;

  const stream = new ReadableStream({
    start(controller) {
      subscriber = { controller, projectId };
      subscribers.add(subscriber);

      // Send initial heartbeat
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Heartbeat every 25s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Store interval on subscriber for cleanup
      (subscriber as unknown as { heartbeat: ReturnType<typeof setInterval> }).heartbeat = heartbeat;
    },
    cancel() {
      const hb = (subscriber as unknown as { heartbeat: ReturnType<typeof setInterval> }).heartbeat;
      if (hb) clearInterval(hb);
      subscribers.delete(subscriber);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
