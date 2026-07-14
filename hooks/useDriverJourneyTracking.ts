import { useCallback, useEffect, useRef } from "react";

import {
    getDriverLocationTrackingState,
    setDriverTrackingMode,
    startDriverLocationTracking,
    stopDriverLocationTracking,
} from "@/services/driver-location.service";

import { AdaptiveTrackingMode } from "@/services/adaptive-tracking.service";

interface Props {
  rideId: string;
  isDriver: boolean;
  rideStatus?: string | null;
  trackingMode?: AdaptiveTrackingMode | null;
}

const ACTIVE_RIDE_STATUSES = ["active", "in_progress"];

export default function useDriverJourneyTracking({
  rideId,
  isDriver,
  rideStatus,
  trackingMode = "normal",
}: Props) {
  const startingRef = useRef(false);

  const startTracking = useCallback(async () => {
    if (!isDriver) {
      return;
    }

    if (!rideId) {
      return;
    }

    if (!rideStatus || !ACTIVE_RIDE_STATUSES.includes(rideStatus)) {
      return;
    }

    if (startingRef.current) {
      return;
    }

    const mode: AdaptiveTrackingMode =
      trackingMode === "safety" ? "safety" : "normal";

    const currentState = getDriverLocationTrackingState();

    /*
     * Same ride already tracking.
     *
     * Only update mode.
     */

    if (currentState.isTracking && currentState.rideId === rideId) {
      setDriverTrackingMode(mode);

      return;
    }

    startingRef.current = true;

    try {
      console.log("AUTO START DRIVER TRACKING:", {
        rideId,
        rideStatus,
        mode,
      });

      const result = await startDriverLocationTracking({
        rideId,
        trackingMode: mode,
      });

      if (result.error) {
        console.log("AUTO DRIVER TRACKING ERROR:", result.error);

        return;
      }

      console.log("AUTO DRIVER TRACKING STARTED:", {
        rideId,
        alreadyActive: result.alreadyActive,
      });
    } catch (error) {
      console.log("AUTO DRIVER TRACKING EXCEPTION:", error);
    } finally {
      startingRef.current = false;
    }
  }, [rideId, isDriver, rideStatus, trackingMode]);

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    if (!isDriver) {
      return;
    }

    if (rideStatus && ACTIVE_RIDE_STATUSES.includes(rideStatus)) {
      return;
    }

    const state = getDriverLocationTrackingState();

    if (state.isTracking && state.rideId === rideId) {
      console.log("RIDE NO LONGER ACTIVE - STOP GPS:", rideId);

      stopDriverLocationTracking();
    }
  }, [rideId, isDriver, rideStatus]);

  return {
    restartTracking: startTracking,
  };
}
