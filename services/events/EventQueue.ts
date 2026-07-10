import { GlobalEvent } from "../../types/global-events";

export default class EventQueue {
  private queue: GlobalEvent[] = [];

  enqueue(event: GlobalEvent) {
    const exists = this.queue.some((e) => e.id === event.id);

    if (exists) return;

    this.queue.push(event);

    this.queue.sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  dequeue() {
    return this.queue.shift() ?? null;
  }

  peek() {
    return this.queue[0] ?? null;
  }

  clear() {
    this.queue = [];
  }

  size() {
    return this.queue.length;
  }

  remove(id: string) {
    this.queue = this.queue.filter(
      (e) => e.id !== id
    );
  }
}