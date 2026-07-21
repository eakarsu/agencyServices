/**
 * Task real-time SSE endpoint
 *
 * Clients connect with GET /api/tasks/events?projectId=<id>
 * The server holds the connection open and emits task:created / task:updated
 * events whenever mutations occur.
 *
 * To emit an event from any PUT/POST task handler, POST to
 * /api/tasks/events/notify (internal, server-to-server only) with
 * { event, task }. The shared subscriber helper lives outside this route module
 * because Next.js route files may export only HTTP handlers and route metadata.
 *
 * Architecture note: Next.js App Router does not support Socket.IO natively.
 * SSE via ReadableStream is the idiomatic real-time pattern for Next.js 14.
 */

import { NextRequest } from "next/server";
import { checkAuth } from "@/lib/apiUtils";
import { setTaskEventHeartbeat, subscribeToTaskEvents, unsubscribeFromTaskEvents } from "@/lib/taskEvents";

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

  let subscriber: ReturnType<typeof subscribeToTaskEvents>;

  const stream = new ReadableStream({
    start(controller) {
      subscriber = subscribeToTaskEvents(controller, projectId);

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
      setTaskEventHeartbeat(subscriber, heartbeat);
    },
    cancel() {
      unsubscribeFromTaskEvents(subscriber);
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
