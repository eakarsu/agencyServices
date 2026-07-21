type Subscriber = {
  controller: ReadableStreamDefaultController;
  projectId: string | null;
  heartbeat?: ReturnType<typeof setInterval>;
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
      if (sub.heartbeat) clearInterval(sub.heartbeat);
      subscribers.delete(sub);
    }
  }
}

export function subscribeToTaskEvents(controller: ReadableStreamDefaultController, projectId: string | null) {
  const subscriber: Subscriber = { controller, projectId };
  subscribers.add(subscriber);
  return subscriber;
}

export function unsubscribeFromTaskEvents(subscriber: Subscriber) {
  if (subscriber.heartbeat) clearInterval(subscriber.heartbeat);
  subscribers.delete(subscriber);
}

export function setTaskEventHeartbeat(subscriber: Subscriber, heartbeat: ReturnType<typeof setInterval>) {
  subscriber.heartbeat = heartbeat;
}
