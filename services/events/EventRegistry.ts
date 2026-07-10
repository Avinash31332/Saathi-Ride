import { GlobalEventType } from "../../types/global-events";

export const EventRegistry: Record<
  GlobalEventType,
  {
    priority: number;
    dismissible: boolean;
  }
> = {
  rideCompletion: {
    priority: 60,
    dismissible: false,
  },

  passengerDropRequest: {
    priority: 70,
    dismissible: false,
  },

  passengerDropReason: {
    priority: 65,
    dismissible: false,
  },

  rideCompleted: {
    priority: 40,
    dismissible: true,
  },

  rideCancelled: {
    priority: 90,
    dismissible: false,
  },

  payment: {
    priority: 50,
    dismissible: false,
  },

  verification: {
    priority: 80,
    dismissible: false,
  },

  sos: {
    priority: 100,
    dismissible: false,
  },
};