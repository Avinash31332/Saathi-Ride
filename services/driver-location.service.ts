import * as Location from "expo-location";

import { AdaptiveTrackingMode } from "./adaptive-tracking.service";

import {
  isBackgroundDriverTrackingRide,
  setBackgroundTrackingMode,
  startBackgroundDriverTracking,
  stopBackgroundDriverTracking,
} from "./background-location.service";

import {
  prepareJourneyTracking,
  processJourneyLocation,
} from "./journey-tracking.service";

let locationSubscription: Location.LocationSubscription | null = null;

let activeRideId: string | null = null;

let activeTrackingMode: AdaptiveTrackingMode = "normal";

let processingLocation = false;

export interface DriverLocationTrackingState {
  rideId: string | null;

  trackingMode: AdaptiveTrackingMode;

  isTracking: boolean;
}

export async function requestDriverLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    return {
      granted: false,

      error: new Error("Location permission is required to track the journey"),
    };
  }

  return {
    granted: true,

    error: null,
  };
}

async function startForegroundFallback({
  rideId,
  trackingMode,
}: {
  rideId: string;

  trackingMode: AdaptiveTrackingMode;
}) {
  const permissionResult = await requestDriverLocationPermission();

  if (!permissionResult.granted) {
    return {
      started: false,

      alreadyActive: false,

      error: permissionResult.error,
    };
  }

  if (locationSubscription) {
    locationSubscription.remove();

    locationSubscription = null;
  }

  activeRideId = rideId;

  activeTrackingMode = trackingMode;

  console.log("STARTING FOREGROUND GPS FALLBACK:", {
    rideId,

    trackingMode,
  });

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,

      /*
       * GPS can read more frequently.
       *
       * adaptive-tracking.service decides
       * whether Supabase receives an upload.
       */

      timeInterval: 10_000,

      distanceInterval: 100,
    },

    async (location) => {
      if (processingLocation) {
        console.log("FOREGROUND GPS READING SKIPPED: PROCESSING");

        return;
      }

      if (!activeRideId) {
        return;
      }

      processingLocation = true;

      try {
        const { latitude, longitude, accuracy } = location.coords;

        console.log("FOREGROUND DRIVER GPS:", {
          rideId: activeRideId,

          latitude,

          longitude,

          accuracy,

          trackingMode: activeTrackingMode,
        });

        const result = await processJourneyLocation({
          rideId: activeRideId,

          latitude,

          longitude,

          trackingMode: activeTrackingMode,
        });

        console.log("FOREGROUND GPS PROCESSED:", {
          progress: result.routeProgress.progressPercentage.toFixed(2),

          distanceFromRouteKm:
            result.routeProgress.distanceFromRouteKm.toFixed(3),

          detectedDeviation: result.routeProgress.routeDeviation,

          confirmedDeviation: result.adaptiveResult.cache.routeDeviation,

          uploaded: result.adaptiveResult.uploaded,

          reason: result.adaptiveResult.reason,
        });
      } catch (error) {
        console.log("FOREGROUND GPS PROCESS ERROR:", error);
      } finally {
        processingLocation = false;
      }
    },
  );

  console.log("FOREGROUND GPS FALLBACK STARTED:", rideId);

  return {
    started: true,

    alreadyActive: false,

    error: null,
  };
}

export async function startDriverLocationTracking({
  rideId,

  trackingMode = "normal",
}: {
  rideId: string;

  trackingMode?: AdaptiveTrackingMode;
}) {
  /*
   * Route must be prepared before either
   * foreground or background GPS begins.
   */

  try {
    await prepareJourneyTracking(rideId);
  } catch (error) {
    console.log("PREPARE JOURNEY TRACKING ERROR:", error);

    return {
      started: false,

      alreadyActive: false,

      error,
    };
  }

  /*
   * Background tracking may already be
   * active from a previous screen/app state.
   */

  const backgroundActive = await isBackgroundDriverTrackingRide(rideId);

  if (backgroundActive) {
    activeRideId = rideId;

    activeTrackingMode = trackingMode;

    await setBackgroundTrackingMode(trackingMode);

    console.log("DRIVER BACKGROUND TRACKING ALREADY ACTIVE:", {
      rideId,

      trackingMode,
    });

    return {
      started: true,

      alreadyActive: true,

      error: null,
    };
  }

  /*
   * Already using the foreground fallback
   * for this ride.
   */

  if (locationSubscription && activeRideId === rideId) {
    activeTrackingMode = trackingMode;

    console.log("DRIVER FOREGROUND TRACKING ALREADY ACTIVE:", {
      rideId,

      trackingMode,
    });

    return {
      started: true,

      alreadyActive: true,

      error: null,
    };
  }

  /*
   * Stop an old foreground watcher.
   */

  if (locationSubscription) {
    locationSubscription.remove();

    locationSubscription = null;
  }

  activeRideId = rideId;

  activeTrackingMode = trackingMode;

  /*
   * Try background tracking first.
   */

  const backgroundResult = await startBackgroundDriverTracking({
    rideId,

    trackingMode,
  });

  if (backgroundResult.started) {
    console.log("DRIVER TRACKING MODE: BACKGROUND");

    return backgroundResult;
  }

  /*
   * Background permission/service may not
   * be available during development.
   *
   * Fall back to the foreground watcher.
   */

  console.log(
    "BACKGROUND GPS UNAVAILABLE. USING FOREGROUND FALLBACK:",
    backgroundResult.error,
  );

  try {
    return await startForegroundFallback({
      rideId,

      trackingMode,
    });
  } catch (error) {
    activeRideId = null;

    activeTrackingMode = "normal";

    console.log("START FOREGROUND GPS ERROR:", error);

    return {
      started: false,

      alreadyActive: false,

      error,
    };
  }
}

export async function stopDriverLocationTracking() {
  /*
   * Stop foreground fallback.
   */

  if (locationSubscription) {
    locationSubscription.remove();

    locationSubscription = null;
  }

  /*
   * Stop native background tracking.
   */

  try {
    await stopBackgroundDriverTracking();
  } catch (error) {
    console.log("STOP BACKGROUND GPS ERROR:", error);
  }

  const stoppedRideId = activeRideId;

  activeRideId = null;

  activeTrackingMode = "normal";

  processingLocation = false;

  console.log("DRIVER GPS STOPPED:", stoppedRideId);

  return {
    stopped: true,

    rideId: stoppedRideId,
  };
}

export async function setDriverTrackingMode(
  trackingMode: AdaptiveTrackingMode,
) {
  activeTrackingMode = trackingMode;

  try {
    await setBackgroundTrackingMode(trackingMode);
  } catch (error) {
    console.log("UPDATE BACKGROUND TRACKING MODE ERROR:", error);
  }

  console.log("DRIVER TRACKING MODE UPDATED:", trackingMode);
}

export function getDriverLocationTrackingState(): DriverLocationTrackingState {
  return {
    rideId: activeRideId,

    trackingMode: activeTrackingMode,

    isTracking: locationSubscription !== null || activeRideId !== null,
  };
}

export function isDriverTrackingRide(rideId: string) {
  return activeRideId === rideId;
}
