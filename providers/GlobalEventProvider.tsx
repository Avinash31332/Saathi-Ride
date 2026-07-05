import { useState } from "react";

import { GlobalEventContext } from "../contexts/GlobalEventContext";

export default function GlobalEventProvider({ children }: any) {
  const [event, setEvent] = useState<any>(null);

  return (
    <GlobalEventContext.Provider
      value={{
        event,
        setEvent,
      }}
    >
      {children}
    </GlobalEventContext.Provider>
  );
}
