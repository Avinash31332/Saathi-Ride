import {
  GlobalEvent,
  GlobalEventType,
} from "../../types/global-events";

import EventQueue from "./EventQueue";
import { EventRegistry } from "./EventRegistry";

type Listener = (event: GlobalEvent | null) => void;

class EventBus {
  private queue = new EventQueue();

  private current: GlobalEvent | null = null;

  private listeners = new Set<Listener>();

  //-------------------------------------------------------
  // Notify UI
  //-------------------------------------------------------

  private notify() {
    this.listeners.forEach(listener =>
      listener(this.current)
    );
  }

  //-------------------------------------------------------
  // Publish Event
  //-------------------------------------------------------

  publish(
    type: GlobalEventType,
    payload?: Record<string, any>,
    customId?: string
  ) {
    const config = EventRegistry[type];

    const event: GlobalEvent = {
      id:
        customId ??
        `${type}-${Date.now()}`,

      type,

      payload,

      priority: config.priority,

      dismissible: config.dismissible,

      createdAt: Date.now(),
    };

    this.queue.enqueue(event);

    this.process();

    return event;
  }

  //-------------------------------------------------------
  // Process Queue
  //-------------------------------------------------------

  private process() {
    if (this.current) return;

    this.current = this.queue.dequeue();

    this.notify();
  }

  //-------------------------------------------------------
  // Close Current
  //-------------------------------------------------------

  closeCurrent() {
    this.current = null;

    this.process();
  }

  //-------------------------------------------------------
  // Subscribe
  //-------------------------------------------------------

  subscribe(listener: Listener) {
    this.listeners.add(listener);

    listener(this.current);

    return () => {
      this.listeners.delete(listener);
    };
  }

  //-------------------------------------------------------
  // Helpers
  //-------------------------------------------------------

  clear() {
    this.queue.clear();

    this.current = null;

    this.notify();
  }

  size() {
    return this.queue.size();
  }

  getCurrent() {
    return this.current;
  }
}

export default new EventBus();