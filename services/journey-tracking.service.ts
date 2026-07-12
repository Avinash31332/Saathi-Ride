import * as Location from "expo-location";

import { supabase } from "./supabase";

export type TrackingMode = "normal" | "safety" | "emergency";

export interface JourneyTrackingState {
  ride_id: string;

  driver_lat: number;

  driver_lng: number;

  progress_percentage: number;

  distance_to_destination_km: number | null;

  tracking_mode: TrackingMode;

  last_checkpoint: number;

  last_location_at: string;

  route_deviation: boolean;

  updated_at: string;
}

const NORMAL_SYNC_INTERVAL_MS = 3 * 60 * 1000;

const SAFETY_SYNC_INTERVAL_MS = 75 * 1000;

const EMERGENCY_SYNC_INTERVAL_MS = 20 * 1000;

const NORMAL_DISTANCE_TRIGGER_KM = 5;

const SAFETY_DISTANCE_TRIGGER_KM = 1;

type ActiveJourney = {
  rideId: string;

  destinationLat: number;

  destinationLng: number;

  totalDistanceKm: number;

  mode: TrackingMode;

  lastSyncAt: number;

  lastSyncedLat: number;

  lastSyncedLng: number;

  subscription: Location.LocationSubscription;
};

let activeJourney: ActiveJourney | null = null;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(lat2 - lat1);

  const longitudeDifference = toRadians(lng2 - lng1);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function getSyncInterval(mode: TrackingMode) {
  if (mode === "emergency") {
    return EMERGENCY_SYNC_INTERVAL_MS;
  }

  if (mode === "safety") {
    return SAFETY_SYNC_INTERVAL_MS;
  }

  return NORMAL_SYNC_INTERVAL_MS;
}

function getDistanceTrigger(mode: TrackingMode) {
  if (mode === "emergency") {
    return 0;
  }

  if (mode === "safety") {
    return SAFETY_DISTANCE_TRIGGER_KM;
  }

  return NORMAL_DISTANCE_TRIGGER_KM;
}

function calculateProgress(
  distanceToDestinationKm: number,
  totalDistanceKm: number,
) {
  if (totalDistanceKm <= 0) {
    return 0;
  }

  const progress =
    ((totalDistanceKm - distanceToDestinationKm) / totalDistanceKm) * 100;

  return Math.min(Math.max(progress, 0), 100);
}

export async function requestJourneyLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  return status === "granted";
}

export async function getCurrentJourneyLocation() {
  return await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}

export async function startRideJourney(
  rideId: string,
  destinationLat: number,
  destinationLng: number,
  totalDistanceKm: number,
) {
  const permissionGranted = await requestJourneyLocationPermission();

  if (!permissionGranted) {
    throw new Error("Location permission is required to start the journey.");
  }

  if (activeJourney) {
    await stopLocalJourneyTracking();
  }

  const location = await getCurrentJourneyLocation();

  const { data: mode, error } = await supabase.rpc("start_ride_journey", {
    p_ride_id: rideId,

    p_lat: location.coords.latitude,

    p_lng: location.coords.longitude,
  });

  if (error) {
    throw error;
  }

  const trackingMode = (mode as TrackingMode) || "normal";

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,

      timeInterval: 30 * 1000,

      distanceInterval: 250,
    },

    async (newLocation) => {
      await processLocationUpdate(
        newLocation.coords.latitude,
        newLocation.coords.longitude,
      );
    },
  );

  activeJourney = {
    rideId,

    destinationLat,

    destinationLng,

    totalDistanceKm,

    mode: trackingMode,

    lastSyncAt: Date.now(),

    lastSyncedLat: location.coords.latitude,

    lastSyncedLng: location.coords.longitude,

    subscription,
  };

  return trackingMode;
}

async function processLocationUpdate(latitude: number, longitude: number) {
  if (!activeJourney) {
    return;
  }

  const now = Date.now();

  const timeSinceLastSync = now - activeJourney.lastSyncAt;

  const movedDistanceKm = calculateDistanceKm(
    activeJourney.lastSyncedLat,
    activeJourney.lastSyncedLng,
    latitude,
    longitude,
  );

  const requiredInterval = getSyncInterval(activeJourney.mode);

  const distanceTrigger = getDistanceTrigger(activeJourney.mode);

  const shouldSyncByTime = timeSinceLastSync >= requiredInterval;

  const shouldSyncByDistance = movedDistanceKm >= distanceTrigger;

  if (!shouldSyncByTime && !shouldSyncByDistance) {
    return;
  }

  const distanceToDestinationKm = calculateDistanceKm(
    latitude,
    longitude,
    activeJourney.destinationLat,
    activeJourney.destinationLng,
  );

  const progress = calculateProgress(
    distanceToDestinationKm,
    activeJourney.totalDistanceKm,
  );

  const { data: mode, error } = await supabase.rpc("update_ride_tracking", {
    p_ride_id: activeJourney.rideId,

    p_lat: latitude,

    p_lng: longitude,

    p_progress_percentage: progress,

    p_distance_to_destination_km: distanceToDestinationKm,
  });

  if (error) {
    console.log("JOURNEY TRACKING UPDATE ERROR:", error);

    return;
  }

  activeJourney.mode = (mode as TrackingMode) || activeJourney.mode;

  activeJourney.lastSyncAt = now;

  activeJourney.lastSyncedLat = latitude;

  activeJourney.lastSyncedLng = longitude;
}

export async function forceJourneySync() {
  if (!activeJourney) {
    return;
  }

  const location = await getCurrentJourneyLocation();

  activeJourney.lastSyncAt = 0;

  await processLocationUpdate(
    location.coords.latitude,
    location.coords.longitude,
  );
}

export async function stopLocalJourneyTracking() {
  if (!activeJourney) {
    return;
  }

  activeJourney.subscription.remove();

  activeJourney = null;
}

export function getActiveJourney() {
  return activeJourney;
}

export async function getRideTracking(rideId: string) {
  return await supabase
    .from("ride_tracking")
    .select("*")
    .eq("ride_id", rideId)
    .maybeSingle();
}

export async function getRideSafetyEvents(rideId: string) {
  return await supabase
    .from("ride_safety_events")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", {
      ascending: true,
    });
}

export function subscribeToRideTracking(
  rideId: string,
  onTrackingUpdate: (tracking: JourneyTrackingState) => void,
) {
  const channel = supabase
    .channel(`journey-tracking-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ride_tracking",
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        console.log("JOURNEY TRACKING REALTIME:", payload.eventType);

        if (payload.new) {
          onTrackingUpdate(payload.new as JourneyTrackingState);
        }
      },
    )
    .subscribe((status) => {
      console.log("Journey Tracking Realtime:", status);
    });

  return channel;
}

export function subscribeToRideSafetyEvents(
  rideId: string,
  onNewEvent: (event: any) => void,
) {
  const channel = supabase
    .channel(`journey-events-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ride_safety_events",
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        console.log("JOURNEY EVENT:", payload.new);

        onNewEvent(payload.new);
      },
    )
    .subscribe((status) => {
      console.log("Journey Events Realtime:", status);
    });

  return channel;
}

export async function removeJourneyChannel(channel: any) {
  if (!channel) {
    return;
  }

  await supabase.removeChannel(channel);
}
