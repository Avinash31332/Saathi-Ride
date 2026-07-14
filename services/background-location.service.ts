import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { AdaptiveTrackingMode } from "./adaptive-tracking.service";
import { processJourneyLocation } from "./journey-tracking.service";

export const DRIVER_BACKGROUND_LOCATION_TASK =
  "saathi-driver-background-location";

const ACTIVE_RIDE_KEY = "@saathi_active_tracking_ride";

export interface ActiveBackgroundRide {
  rideId: string;

  trackingMode: AdaptiveTrackingMode;
}

async function getActiveBackgroundRide(): Promise<ActiveBackgroundRide | null> {
  try {
    const value = await AsyncStorage.getItem(ACTIVE_RIDE_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as ActiveBackgroundRide;
  } catch (error) {
    console.log("BACKGROUND ACTIVE RIDE READ ERROR:", error);

    return null;
  }
}

async function saveActiveBackgroundRide(ride: ActiveBackgroundRide) {
  try {
    await AsyncStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride));
  } catch (error) {
    console.log("BACKGROUND ACTIVE RIDE SAVE ERROR:", error);

    throw error;
  }
}

async function clearActiveBackgroundRide() {
  try {
    await AsyncStorage.removeItem(ACTIVE_RIDE_KEY);
  } catch (error) {
    console.log("BACKGROUND ACTIVE RIDE CLEAR ERROR:", error);
  }
}

/*
 * IMPORTANT
 *
 * TaskManager.defineTask MUST remain
 * in global module scope.
 */

TaskManager.defineTask(
  DRIVER_BACKGROUND_LOCATION_TASK,

  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{
    locations: Location.LocationObject[];
  }>) => {
    if (error) {
      console.log("BACKGROUND LOCATION TASK ERROR:", error);

      return;
    }

    const locations = data?.locations;

    if (!locations || locations.length === 0) {
      return;
    }

    const activeRide = await getActiveBackgroundRide();

    if (!activeRide) {
      console.log("BACKGROUND GPS: NO ACTIVE RIDE");

      return;
    }

    /*
     * Android may batch locations.
     *
     * Only process the newest reading.
     */

    const latestLocation = locations[locations.length - 1];

    const { latitude, longitude, accuracy } = latestLocation.coords;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      console.log("BACKGROUND GPS INVALID LOCATION");

      return;
    }

    /*
     * Ignore highly inaccurate readings.
     */

    if (typeof accuracy === "number" && accuracy > 100) {
      console.log("BACKGROUND GPS LOW ACCURACY SKIPPED:", accuracy);

      return;
    }

    console.log("BACKGROUND DRIVER GPS:", {
      rideId: activeRide.rideId,

      latitude,

      longitude,

      accuracy,

      trackingMode: activeRide.trackingMode,
    });

    try {
      const result = await processJourneyLocation({
        rideId: activeRide.rideId,

        latitude,

        longitude,

        trackingMode: activeRide.trackingMode,
      });

      console.log("BACKGROUND GPS PROCESSED:", {
        progress: result.routeProgress.progressPercentage,

        distanceFromRouteKm: result.routeProgress.distanceFromRouteKm,

        detectedDeviation: result.routeProgress.routeDeviation,

        confirmedDeviation: result.adaptiveResult.cache.routeDeviation,

        uploaded: result.adaptiveResult.uploaded,

        reason: result.adaptiveResult.reason,

        checkpoint: result.adaptiveResult.checkpoint,
      });
    } catch (processingError) {
      console.log("BACKGROUND GPS PROCESS ERROR:", processingError);
    }
  },
);

/*
 * BACKGROUND PERMISSION
 *
 * IMPORTANT:
 *
 * Some development builds may not contain
 * ACCESS_BACKGROUND_LOCATION.
 *
 * We catch native permission failures and
 * allow foreground GPS to continue.
 */

export async function requestBackgroundLocationPermission() {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();

    let foregroundStatus = foreground.status;

    if (foregroundStatus !== "granted") {
      const foregroundRequest =
        await Location.requestForegroundPermissionsAsync();

      foregroundStatus = foregroundRequest.status;
    }

    if (foregroundStatus !== "granted") {
      return {
        granted: false,

        unavailable: false,

        error: new Error("Foreground location permission is required"),
      };
    }

    try {
      const background = await Location.requestBackgroundPermissionsAsync();

      if (background.status !== "granted") {
        return {
          granted: false,

          unavailable: false,

          error: new Error("Background location permission was not granted"),
        };
      }

      return {
        granted: true,

        unavailable: false,

        error: null,
      };
    } catch (error: any) {
      console.log(
        "BACKGROUND LOCATION NOT AVAILABLE IN BUILD:",
        error?.message || error,
      );

      return {
        granted: false,

        unavailable: true,

        error: null,
      };
    }
  } catch (error) {
    console.log("BACKGROUND LOCATION PERMISSION ERROR:", error);

    return {
      granted: false,

      unavailable: false,

      error,
    };
  }
}

export async function startBackgroundDriverTracking({
  rideId,

  trackingMode = "normal",
}: {
  rideId: string;

  trackingMode?: AdaptiveTrackingMode;
}) {
  const permission = await requestBackgroundLocationPermission();

  /*
   * Current development build does not
   * support background location.
   *
   * Foreground GPS continues normally.
   */

  if (permission.unavailable) {
    console.log(
      "BACKGROUND GPS UNAVAILABLE - USING FOREGROUND TRACKING:",
      rideId,
    );

    return {
      started: false,

      alreadyActive: false,

      unavailable: true,

      error: null,
    };
  }

  if (!permission.granted) {
    return {
      started: false,

      alreadyActive: false,

      unavailable: false,

      error: permission.error,
    };
  }

  try {
    await saveActiveBackgroundRide({
      rideId,

      trackingMode,
    });

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
      DRIVER_BACKGROUND_LOCATION_TASK,
    );

    if (alreadyStarted) {
      console.log("BACKGROUND GPS ALREADY ACTIVE:", rideId);

      /*
       * Active ride information was already
       * updated above.
       */

      return {
        started: true,

        alreadyActive: true,

        unavailable: false,

        error: null,
      };
    }

    await Location.startLocationUpdatesAsync(
      DRIVER_BACKGROUND_LOCATION_TASK,

      {
        accuracy: Location.Accuracy.High,

        distanceInterval: 100,

        timeInterval: 10_000,

        pausesUpdatesAutomatically: false,

        showsBackgroundLocationIndicator: true,

        foregroundService: {
          notificationTitle: "Saathi journey active",

          notificationBody: "Ride progress and safety tracking are active.",

          notificationColor: "#2563EB",

          killServiceOnDestroy: false,
        },
      },
    );

    console.log("BACKGROUND DRIVER GPS STARTED:", rideId);

    return {
      started: true,

      alreadyActive: false,

      unavailable: false,

      error: null,
    };
  } catch (error) {
    await clearActiveBackgroundRide();

    console.log("START BACKGROUND GPS ERROR:", error);

    return {
      started: false,

      alreadyActive: false,

      unavailable: false,

      error,
    };
  }
}

export async function stopBackgroundDriverTracking() {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(
      DRIVER_BACKGROUND_LOCATION_TASK,
    );

    if (started) {
      await Location.stopLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.log("STOP BACKGROUND GPS ERROR:", error);
  }

  await clearActiveBackgroundRide();

  console.log("BACKGROUND DRIVER GPS STOPPED");

  return {
    stopped: true,
  };
}

export async function isBackgroundDriverTrackingRide(rideId: string) {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(
      DRIVER_BACKGROUND_LOCATION_TASK,
    );

    if (!started) {
      return false;
    }

    const activeRide = await getActiveBackgroundRide();

    return activeRide?.rideId === rideId;
  } catch (error) {
    console.log("CHECK BACKGROUND GPS ERROR:", error);

    return false;
  }
}

export async function setBackgroundTrackingMode(
  trackingMode: AdaptiveTrackingMode,
) {
  const activeRide = await getActiveBackgroundRide();

  if (!activeRide) {
    return;
  }

  await saveActiveBackgroundRide({
    ...activeRide,

    trackingMode,
  });

  console.log("BACKGROUND TRACKING MODE UPDATED:", trackingMode);
}

export async function getActiveBackgroundTrackingRide() {
  return await getActiveBackgroundRide();
}
