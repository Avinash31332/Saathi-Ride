import { createContext } from "react";

import {
  GlobalEvent,
  GlobalEventType,
} from "../types/global-events";

interface ContextType {
  currentEvent: GlobalEvent | null;

  publish: (
    type: GlobalEventType,
    payload?: Record<string, any>,
    customId?: string,
  ) => void;

  closeCurrentEvent: () => void;

  clearEvents: () => void;

  queueSize: () => number;
}

export const GlobalEventContext =
  createContext<ContextType>({
    currentEvent: null,

    publish: () => {},

    closeCurrentEvent: () => {},

    clearEvents: () => {},

    queueSize: () => 0,
  });