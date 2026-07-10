import { useContext } from "react";

import { GlobalEventContext } from "../contexts/GlobalEventContext";

export default function useGlobalEvents() {
  return useContext(GlobalEventContext);
}