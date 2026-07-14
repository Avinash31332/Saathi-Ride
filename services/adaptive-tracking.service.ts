import AsyncStorage from "@react-native-async-storage/async-storage";

import { processRideCheckpoint } from "./ride-tracking.service";

const CACHE_PREFIX = "@saathi_tracking_";

const NORMAL_PROGRESS_THRESHOLD = 5;
const NORMAL_DISTANCE_THRESHOLD_KM = 5;
const NORMAL_HEARTBEAT_MS = 10 * 60 * 1000;

const SAFETY_PROGRESS_THRESHOLD = 2;
const SAFETY_DISTANCE_THRESHOLD_KM = 2;
const SAFETY_HEARTBEAT_MS = 5 * 60 * 1000;

const ROUTE_DEVIATION_CONFIRM_COUNT = 3;
const ROUTE_RECOVERY_CONFIRM_COUNT = 3;

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

  routeDeviation?: boolean;

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
    | "route_deviation"
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
  routeDeviation = false,
  trackingMode,
}: AdaptiveCheckpointInput): Promise<AdaptiveCheckpointResult> {
  const now = Date.now();

  const progress = clampProgress(Number(progressPercentage));

  const currentCheckpoint = getReachedCheckpoint(progress);

  const cached = await getTrackingCache(rideId);

  /*
   * FIRST GPS LOCATION
   */

  if (!cached) {
    const { error } = await processRideCheckpoint(rideId, latitude, longitude, {
      progressPercentage: progress,

      routeDeviation: false,

      trackingMode,
    });

    if (error) {
      throw error;
    }

    const initialCache: TrackingCache = {
      rideId,

      lastLatitude: latitude,
      lastLongitude: longitude,

      lastProgress: progress,
      lastCheckpoint: currentCheckpoint,

      lastUploadAt: now,

      routeDeviation: false,

      offRouteReadingCount: routeDeviation ? 1 : 0,

      onRouteReadingCount: routeDeviation ? 0 : 1,

      trackingMode,
    };

    await saveTrackingCache(initialCache);

    console.log("ADAPTIVE TRACKING: INITIAL UPLOAD", {
      rideId,
      progress,
      checkpoint: currentCheckpoint,
    });

    return {
      uploaded: true,

      reason: "initial",

      checkpoint: currentCheckpoint,

      cache: initialCache,
    };
  }

  /*
   * ROUTE DEVIATION CONFIRMATION
   */

  let offRouteReadingCount = cached.offRouteReadingCount || 0;

  let onRouteReadingCount = cached.onRouteReadingCount || 0;

  let confirmedRouteDeviation = cached.routeDeviation;

  if (routeDeviation) {
    offRouteReadingCount += 1;

    onRouteReadingCount = 0;

    if (
      !confirmedRouteDeviation &&
      offRouteReadingCount >= ROUTE_DEVIATION_CONFIRM_COUNT
    ) {
      confirmedRouteDeviation = true;

      console.log("ROUTE DEVIATION CONFIRMED:", rideId);
    }
  } else {
    onRouteReadingCount += 1;

    offRouteReadingCount = 0;

    if (
      confirmedRouteDeviation &&
      onRouteReadingCount >= ROUTE_RECOVERY_CONFIRM_COUNT
    ) {
      confirmedRouteDeviation = false;

      console.log("ROUTE RECOVERY CONFIRMED:", rideId);
    }
  }

  /*
   * LOCAL COMPARISONS
   */

  const distanceMovedKm = calculateDistanceKm(
    cached.lastLatitude,
    cached.lastLongitude,
    latitude,
    longitude,
  );

  const progressDifference = Math.abs(progress - cached.lastProgress);

  const timeSinceLastUpload = now - cached.lastUploadAt;

  const checkpointCrossed = currentCheckpoint > cached.lastCheckpoint;

  const routeDeviationChanged =
    confirmedRouteDeviation !== cached.routeDeviation;

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
   * UPLOAD PRIORITY
   */

  if (checkpointCrossed) {
    shouldUpload = true;

    reason = "checkpoint";
  } else if (routeDeviationChanged) {
    shouldUpload = true;

    reason = "route_deviation";
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
   * CACHE ONLY
   */

  if (!shouldUpload) {
    const updatedLocalCache: TrackingCache = {
      ...cached,

      offRouteReadingCount,

      onRouteReadingCount,

      trackingMode,
    };

    await saveTrackingCache(updatedLocalCache);

    console.log("ADAPTIVE TRACKING: CACHED", {
      progress,

      progressDifference,

      distanceMovedKm: distanceMovedKm.toFixed(2),

      rawDeviation: routeDeviation,

      confirmedDeviation: confirmedRouteDeviation,

      offRouteReadingCount,

      onRouteReadingCount,
    });

    return {
      uploaded: false,

      reason: "cached",

      checkpoint: cached.lastCheckpoint,

      cache: updatedLocalCache,
    };
  }

  /*
   * SUPABASE UPLOAD
   */

  console.log("ADAPTIVE TRACKING: UPLOAD", {
    rideId,

    reason,

    progress,

    checkpoint: currentCheckpoint,

    confirmedRouteDeviation,

    trackingMode,
  });

  const { error } = await processRideCheckpoint(rideId, latitude, longitude, {
    progressPercentage: progress,

    routeDeviation: confirmedRouteDeviation,

    trackingMode,
  });

  /*
   * IMPORTANT:
   *
   * Do not update last uploaded location,
   * progress or timestamp if Supabase failed.
   *
   * The next GPS reading retries.
   */

  if (error) {
    throw error;
  }

  const updatedCache: TrackingCache = {
    rideId,

    lastLatitude: latitude,
    lastLongitude: longitude,

    lastProgress: progress,
    lastCheckpoint: currentCheckpoint,

    lastUploadAt: now,

    routeDeviation: confirmedRouteDeviation,

    offRouteReadingCount,

    onRouteReadingCount,

    trackingMode,
  };

  await saveTrackingCache(updatedCache);

  return {
    uploaded: true,

    reason,

    checkpoint: currentCheckpoint,

    cache: updatedCache,
  };
}
