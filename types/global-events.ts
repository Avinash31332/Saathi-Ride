export type GlobalEventType =
  | "rideCompletion"
  | "rideCompleted"
  | "rideCancelled"
  | "payment"
  | "verification"
  | "sos";

export interface GlobalEvent {
    type: GlobalEventType;

    payload?: Record<string, any>;

    priority?: "low" | "normal" | "high";

    dismissible?: boolean;
}