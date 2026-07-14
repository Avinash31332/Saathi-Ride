import { supabase } from "./supabase";

export interface ProcessRideCheckpointOptions {
  progressPercentage: number;

  routeDeviation?: boolean;

  trackingMode?: "normal" | "safety";
}

export async function processRideCheckpoint(
  rideId: string,
  latitude: number,
  longitude: number,
  options: ProcessRideCheckpointOptions,
) {
  const {
    progressPercentage,

    routeDeviation = false,

    trackingMode = "normal",
  } = options;

  return await supabase.rpc("process_ride_checkpoint", {
    p_ride_id: rideId,

    p_latitude: latitude,

    p_longitude: longitude,

    p_progress_percentage: progressPercentage,

    p_route_deviation: routeDeviation,

    p_tracking_mode: trackingMode,
  });
}
