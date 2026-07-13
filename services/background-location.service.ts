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
  await AsyncStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride));
}

async function clearActiveBackgroundRide() {
  await AsyncStorage.removeItem(ACTIVE_RIDE_KEY);
}

/*
 * IMPORTANT
 *
 * TaskManager.defineTask MUST remain in
 * global scope.
 *
 * Do not move this inside a component,
 * hook or function.
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
     * We only need the latest location.
     *
     * If Android batches several GPS readings,
     * processing every old reading would waste
     * route calculations.
     */

    const latestLocation = locations[locations.length - 1];

    const { latitude, longitude, accuracy } = latestLocation.coords;

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

        deviation: result.adaptiveResult.cache.routeDeviation,

        uploaded: result.adaptiveResult.uploaded,

        reason: result.adaptiveResult.reason,
      });
    } catch (processingError) {
      console.log("BACKGROUND GPS PROCESS ERROR:", processingError);
    }
  },
);

export async function requestBackgroundLocationPermission() {
  const foreground = await Location.requestForegroundPermissionsAsync();

  if (foreground.status !== "granted") {
    return {
      granted: false,

      error: new Error("Foreground location permission is required"),
    };
  }

  const background = await Location.requestBackgroundPermissionsAsync();

  if (background.status !== "granted") {
    return {
      granted: false,

      error: new Error(
        "Background location permission is required for journey tracking",
      ),
    };
  }

  return {
    granted: true,

    error: null,
  };
}

export async function startBackgroundDriverTracking({
  rideId,
  trackingMode = "normal",
}: {
  rideId: string;
  trackingMode?: AdaptiveTrackingMode;
}) {
  const permission = await requestBackgroundLocationPermission();

  if (!permission.granted) {
    return {
      started: false,

      error: permission.error,
    };
  }

  await saveActiveBackgroundRide({
    rideId,

    trackingMode,
  });

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_BACKGROUND_LOCATION_TASK,
  );

  if (alreadyStarted) {
    console.log("BACKGROUND GPS ALREADY ACTIVE");

    return {
      started: true,

      alreadyActive: true,

      error: null,
    };
  }

  try {
    await Location.startLocationUpdatesAsync(
      DRIVER_BACKGROUND_LOCATION_TASK,

      {
        accuracy: Location.Accuracy.High,

        /*
         * Android may provide readings more often.
         *
         * Adaptive tracking decides whether
         * Supabase should actually receive an
         * update.
         */

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

      error: null,
    };
  } catch (error) {
    await clearActiveBackgroundRide();

    console.log("START BACKGROUND GPS ERROR:", error);

    return {
      started: false,

      alreadyActive: false,

      error,
    };
  }
}

export async function stopBackgroundDriverTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_BACKGROUND_LOCATION_TASK,
  );

  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK);
  }

  await clearActiveBackgroundRide();

  console.log("BACKGROUND DRIVER GPS STOPPED");

  return {
    stopped: true,
  };
}

export async function isBackgroundDriverTrackingRide(rideId: string) {
  const started = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_BACKGROUND_LOCATION_TASK,
  );

  if (!started) {
    return false;
  }

  const activeRide = await getActiveBackgroundRide();

  return activeRide?.rideId === rideId;
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
