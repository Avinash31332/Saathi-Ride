import { useEffect, useState } from "react";

import EventBus from "../services/events/EventBus";

import { GlobalEventContext } from "../contexts/GlobalEventContext";

import { GlobalEvent } from "../types/global-events";

export default function GlobalEventProvider({ children }: any) {
  const [currentEvent, setCurrentEvent] = useState<GlobalEvent | null>(null);

  //--------------------------------------------------------
  // Subscribe once
  //--------------------------------------------------------

  useEffect(() => {
    const unsubscribe = EventBus.subscribe((event) => {
      setCurrentEvent(event);
    });

    return unsubscribe;
  }, []);

  //--------------------------------------------------------
  // Context API
  //--------------------------------------------------------

  return (
    <GlobalEventContext.Provider
      value={{
        currentEvent,

        publish: (type, payload, customId) =>
          EventBus.publish(type, payload, customId),

        closeCurrentEvent: () => EventBus.closeCurrent(),

        clearEvents: () => EventBus.clear(),

        queueSize: () => EventBus.size(),
      }}
    >
      {children}
    </GlobalEventContext.Provider>
  );
}
