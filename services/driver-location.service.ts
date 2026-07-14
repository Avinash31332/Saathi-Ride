import * as Location from "expo-location";

import { AdaptiveTrackingMode } from "./adaptive-tracking.service";

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

/*
 * FOREGROUND LOCATION ONLY
 *
 * Development testing:
 * - Journey screen/app must remain active
 *
 * Release APK:
 * - We will add background location
 * - Android foreground service
 * - TaskManager tracking
 */

export async function requestDriverLocationPermission() {
  try {
    const currentPermission = await Location.getForegroundPermissionsAsync();

    if (currentPermission.status === "granted") {
      return {
        granted: true,

        error: null,
      };
    }

    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return {
        granted: false,

        error: new Error(
          "Location permission is required to track the journey",
        ),
      };
    }

    return {
      granted: true,

      error: null,
    };
  } catch (error) {
    console.log("DRIVER LOCATION PERMISSION ERROR:", error);

    return {
      granted: false,

      error,
    };
  }
}

export async function startDriverLocationTracking({
  rideId,

  trackingMode = "normal",
}: {
  rideId: string;

  trackingMode?: AdaptiveTrackingMode;
}) {
  /*
   * SAME RIDE ALREADY TRACKING
   */

  if (locationSubscription && activeRideId === rideId) {
    activeTrackingMode = trackingMode;

    console.log("DRIVER TRACKING ALREADY ACTIVE:", {
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
   * STOP OLD WATCHER
   */

  if (locationSubscription) {
    locationSubscription.remove();

    locationSubscription = null;
  }

  activeRideId = null;

  processingLocation = false;

  /*
   * FOREGROUND PERMISSION
   */

  const permissionResult = await requestDriverLocationPermission();

  if (!permissionResult.granted) {
    return {
      started: false,

      alreadyActive: false,

      error: permissionResult.error,
    };
  }

  /*
   * PREPARE ROUTE CACHE
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

  activeRideId = rideId;

  activeTrackingMode = trackingMode;

  console.log("STARTING DRIVER GPS:", {
    rideId,

    trackingMode,
  });

  try {
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,

        /*
         * GPS can read frequently.
         *
         * Adaptive tracking controls
         * Supabase uploads.
         */

        timeInterval: 5_000,

        distanceInterval: 25,
      },

      async (location) => {
        if (processingLocation) {
          console.log("GPS READING SKIPPED: PROCESSING");

          return;
        }

        const currentRideId = activeRideId;

        if (!currentRideId) {
          return;
        }

        const {
          latitude,

          longitude,

          accuracy,
        } = location.coords;

        /*
         * INVALID GPS
         */

        if (typeof latitude !== "number" || typeof longitude !== "number") {
          console.log("INVALID DRIVER GPS READING");

          return;
        }

        /*
         * BAD GPS ACCURACY
         *
         * 100m+ readings can cause false
         * route deviations.
         */

        if (typeof accuracy === "number" && accuracy > 100) {
          console.log("LOW ACCURACY GPS READING SKIPPED:", accuracy);

          return;
        }

        processingLocation = true;

        try {
          console.log("DRIVER GPS READING:", {
            rideId: currentRideId,

            latitude,

            longitude,

            accuracy,

            trackingMode: activeTrackingMode,
          });

          const result = await processJourneyLocation({
            rideId: currentRideId,

            latitude,

            longitude,

            trackingMode: activeTrackingMode,
          });

          console.log("DRIVER GPS PROCESSED:", {
            progress: result.routeProgress.progressPercentage.toFixed(2),

            distanceFromRouteKm:
              result.routeProgress.distanceFromRouteKm.toFixed(3),

            detectedDeviation: result.routeProgress.routeDeviation,

            confirmedDeviation: result.adaptiveResult.cache.routeDeviation,

            uploaded: result.adaptiveResult.uploaded,

            reason: result.adaptiveResult.reason,

            checkpoint: result.adaptiveResult.checkpoint,
          });
        } catch (error) {
          console.log("DRIVER GPS PROCESS ERROR:", error);
        } finally {
          processingLocation = false;
        }
      },
    );

    console.log("DRIVER GPS STARTED:", rideId);

    return {
      started: true,

      alreadyActive: false,

      error: null,
    };
  } catch (error) {
    activeRideId = null;

    processingLocation = false;

    console.log("START DRIVER GPS ERROR:", error);

    return {
      started: false,

      alreadyActive: false,

      error,
    };
  }
}

export async function stopDriverLocationTracking() {
  if (locationSubscription) {
    locationSubscription.remove();

    locationSubscription = null;
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

export function setDriverTrackingMode(trackingMode: AdaptiveTrackingMode) {
  activeTrackingMode = trackingMode;

  console.log("DRIVER TRACKING MODE UPDATED:", trackingMode);
}

export function getDriverLocationTrackingState(): DriverLocationTrackingState {
  return {
    rideId: activeRideId,

    trackingMode: activeTrackingMode,

    isTracking: locationSubscription !== null,
  };
}

export function isDriverTrackingRide(rideId: string) {
  return locationSubscription !== null && activeRideId === rideId;
}
