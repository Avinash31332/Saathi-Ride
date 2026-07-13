import AsyncStorage from "@react-native-async-storage/async-storage";

import { processRideCheckpoint } from "./ride-tracking.service";

const CACHE_PREFIX = "@saathi_tracking_";

const NORMAL_PROGRESS_THRESHOLD = 5;
const NORMAL_DISTANCE_THRESHOLD_KM = 5;
const NORMAL_HEARTBEAT_MS = 10 * 60 * 1000;

const SAFETY_PROGRESS_THRESHOLD = 2;
const SAFETY_DISTANCE_THRESHOLD_KM = 2;
const SAFETY_HEARTBEAT_MS = 5 * 60 * 1000;

const NORMAL_OFF_ROUTE_CONFIRMATION_COUNT = 3;
const SAFETY_OFF_ROUTE_CONFIRMATION_COUNT = 2;

const ROUTE_RECOVERY_CONFIRMATION_COUNT = 2;

const CHECKPOINTS = [25, 50, 75, 100];

export type AdaptiveTrackingMode = "normal" | "safety";

export interface TrackingCache {
  rideId: string;

  lastLatitude: number;
  lastLongitude: number;

  lastProgress: number;
  lastCheckpoint: number;

  lastUploadAt: number;

  routeDeviation: boolean;

  offRouteReadingCount: number;
  onRouteReadingCount: number;

  trackingMode: AdaptiveTrackingMode;
}

export interface AdaptiveCheckpointInput {
  rideId: string;

  latitude: number;
  longitude: number;

  progressPercentage: number;

  detectedRouteDeviation: boolean;

  trackingMode: AdaptiveTrackingMode;
}

export interface AdaptiveCheckpointResult {
  uploaded: boolean;

  reason:
    | "initial"
    | "checkpoint"
    | "progress"
    | "distance"
    | "heartbeat"
    | "deviation_started"
    | "deviation_ended"
    | "cached";

  checkpoint: number;

  cache: TrackingCache;
}

function getCacheKey(rideId: string) {
  return `${CACHE_PREFIX}${rideId}`;
}

function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, progress));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(latitude2 - latitude1);

  const longitudeDifference = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function getReachedCheckpoint(progress: number) {
  let reachedCheckpoint = 0;

  for (const checkpoint of CHECKPOINTS) {
    if (progress >= checkpoint) {
      reachedCheckpoint = checkpoint;
    }
  }

  return reachedCheckpoint;
}

export async function getTrackingCache(
  rideId: string,
): Promise<TrackingCache | null> {
  try {
    const value = await AsyncStorage.getItem(getCacheKey(rideId));

    if (!value) {
      return null;
    }

    return JSON.parse(value) as TrackingCache;
  } catch (error) {
    console.log("TRACKING CACHE READ ERROR:", error);

    return null;
  }
}

export async function saveTrackingCache(cache: TrackingCache) {
  try {
    await AsyncStorage.setItem(
      getCacheKey(cache.rideId),
      JSON.stringify(cache),
    );
  } catch (error) {
    console.log("TRACKING CACHE SAVE ERROR:", error);
  }
}

export async function clearTrackingCache(rideId: string) {
  try {
    await AsyncStorage.removeItem(getCacheKey(rideId));
  } catch (error) {
    console.log("TRACKING CACHE CLEAR ERROR:", error);
  }
}

export async function resetTrackingCache(rideId: string) {
  await clearTrackingCache(rideId);
}

export async function adaptiveProcessCheckpoint({
  rideId,
  latitude,
  longitude,
  progressPercentage,
  detectedRouteDeviation,
  trackingMode,
}: AdaptiveCheckpointInput): Promise<AdaptiveCheckpointResult> {
  const now = Date.now();

  const progress = clampProgress(Number(progressPercentage));

  const currentCheckpoint = getReachedCheckpoint(progress);

  const cached = await getTrackingCache(rideId);

  /*
   * FIRST GPS READING
   */

  if (!cached) {
    const initialCache: TrackingCache = {
      rideId,

      lastLatitude: latitude,
      lastLongitude: longitude,

      lastProgress: progress,
      lastCheckpoint: currentCheckpoint,

      lastUploadAt: now,

      /*
       * Never confirm deviation from one
       * GPS reading.
       */

      routeDeviation: false,

      offRouteReadingCount: detectedRouteDeviation ? 1 : 0,

      onRouteReadingCount: detectedRouteDeviation ? 0 : 1,

      trackingMode,
    };

    const { error } = await processRideCheckpoint(rideId, latitude, longitude);

    if (error) {
      throw error;
    }

    await saveTrackingCache(initialCache);

    console.log("ADAPTIVE TRACKING: INITIAL UPLOAD", {
      progress,
      detectedRouteDeviation,
    });

    return {
      uploaded: true,
      reason: "initial",
      checkpoint: currentCheckpoint,
      cache: initialCache,
    };
  }

  /*
   * UPDATE DEVIATION COUNTERS LOCALLY
   */

  let confirmedRouteDeviation = cached.routeDeviation;

  let deviationStarted = false;
  let deviationEnded = false;

  let offRouteReadingCount = cached.offRouteReadingCount || 0;

  let onRouteReadingCount = cached.onRouteReadingCount || 0;

  if (detectedRouteDeviation) {
    offRouteReadingCount += 1;

    onRouteReadingCount = 0;

    const requiredOffRouteReadings =
      trackingMode === "safety"
        ? SAFETY_OFF_ROUTE_CONFIRMATION_COUNT
        : NORMAL_OFF_ROUTE_CONFIRMATION_COUNT;

    if (
      !confirmedRouteDeviation &&
      offRouteReadingCount >= requiredOffRouteReadings
    ) {
      confirmedRouteDeviation = true;

      deviationStarted = true;
    }
  } else {
    onRouteReadingCount += 1;

    offRouteReadingCount = 0;

    if (
      confirmedRouteDeviation &&
      onRouteReadingCount >= ROUTE_RECOVERY_CONFIRMATION_COUNT
    ) {
      confirmedRouteDeviation = false;

      deviationEnded = true;
    }
  }

  const distanceMovedKm = calculateDistanceKm(
    cached.lastLatitude,
    cached.lastLongitude,
    latitude,
    longitude,
  );

  const progressDifference = Math.abs(progress - cached.lastProgress);

  const timeSinceLastUpload = now - cached.lastUploadAt;

  const checkpointCrossed = currentCheckpoint > cached.lastCheckpoint;

  const isSafetyMode = trackingMode === "safety";

  const progressThreshold = isSafetyMode
    ? SAFETY_PROGRESS_THRESHOLD
    : NORMAL_PROGRESS_THRESHOLD;

  const distanceThreshold = isSafetyMode
    ? SAFETY_DISTANCE_THRESHOLD_KM
    : NORMAL_DISTANCE_THRESHOLD_KM;

  const heartbeatThreshold = isSafetyMode
    ? SAFETY_HEARTBEAT_MS
    : NORMAL_HEARTBEAT_MS;

  let shouldUpload = false;

  let reason: AdaptiveCheckpointResult["reason"] = "cached";

  /*
   * EVENT PRIORITY
   */

  if (deviationStarted) {
    shouldUpload = true;

    reason = "deviation_started";
  } else if (deviationEnded) {
    shouldUpload = true;

    reason = "deviation_ended";
  } else if (checkpointCrossed) {
    shouldUpload = true;

    reason = "checkpoint";
  } else if (progressDifference >= progressThreshold) {
    shouldUpload = true;

    reason = "progress";
  } else if (distanceMovedKm >= distanceThreshold) {
    shouldUpload = true;

    reason = "distance";
  } else if (timeSinceLastUpload >= heartbeatThreshold) {
    shouldUpload = true;

    reason = "heartbeat";
  }

  /*
   * IMPORTANT
   *
   * Counter changes must be saved even when
   * Supabase is not touched.
   *
   * Otherwise:
   *
   * reading 1 → count 1
   * app reads old cache → count 1 again
   *
   * and deviation would never confirm.
   */

  const localCache: TrackingCache = {
    ...cached,

    lastLatitude: latitude,
    lastLongitude: longitude,

    routeDeviation: confirmedRouteDeviation,

    offRouteReadingCount,
    onRouteReadingCount,

    trackingMode,
  };

  if (!shouldUpload) {
    await saveTrackingCache(localCache);

    console.log("ADAPTIVE TRACKING: CACHE ONLY", {
      progress: progress.toFixed(2),

      detectedRouteDeviation,

      confirmedRouteDeviation,

      offRouteReadingCount,

      onRouteReadingCount,

      distanceMovedKm: distanceMovedKm.toFixed(2),
    });

    return {
      uploaded: false,
      reason: "cached",
      checkpoint: cached.lastCheckpoint,
      cache: localCache,
    };
  }

  console.log("ADAPTIVE TRACKING: UPLOAD", {
    reason,

    progress: progress.toFixed(2),

    checkpoint: currentCheckpoint,

    confirmedRouteDeviation,

    distanceMovedKm: distanceMovedKm.toFixed(2),
  });

  const { error } = await processRideCheckpoint(rideId, latitude, longitude);

  if (error) {
    /*
     * Save local counters.
     *
     * But do NOT move last uploaded progress
     * or upload time.
     */

    await saveTrackingCache(localCache);

    throw error;
  }

  const updatedCache: TrackingCache = {
    ...localCache,

    lastProgress: progress,

    lastCheckpoint: currentCheckpoint,

    lastUploadAt: now,
  };

  await saveTrackingCache(updatedCache);

  return {
    uploaded: true,
    reason,
    checkpoint: currentCheckpoint,
    cache: updatedCache,
  };
}
