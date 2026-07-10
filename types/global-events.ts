export type GlobalEventType =
  | "rideCompletion"
  | "rideCompleted"
  | "passengerDropRequest"
  | "passengerDropReason"
  | "rideCancelled"
  | "payment"
  | "verification"
  | "sos";

export interface GlobalEvent {
  id: string;

  type: GlobalEventType;

  payload?: Record<string, any>;

  priority: number;

  dismissible: boolean;

  createdAt: number;
}