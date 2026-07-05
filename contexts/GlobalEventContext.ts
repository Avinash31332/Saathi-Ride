import {
  createContext,
} from "react";

import {
  GlobalEvent,
} from "../types/global-events";

interface ContextType {
  event: GlobalEvent | null;

  setEvent: (
    event: GlobalEvent | null
  ) => void;
}

export const GlobalEventContext =
  createContext<ContextType>({
    event: null,
    setEvent: () => {},
  });