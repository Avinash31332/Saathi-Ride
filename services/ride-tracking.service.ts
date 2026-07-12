import { supabase } from "./supabase";

export interface RideTrackingSnapshot {
  ride_id: string;

  driver_lat: number;

  driver_lng: number;

  progress_percentage: number;

  distance_to_destination_km: number;

  tracking_mode: string;

  last_checkpoint: number;

  last_location_at: string;

  route_deviation: boolean;

  updated_at: string;
}

export async function processRideCheckpoint(
  rideId: string,
  latitude: number,
  longitude: number,
) {
  return await supabase.rpc("process_ride_checkpoint", {
    p_ride_id: rideId,
    p_lat: latitude,
    p_lng: longitude,
  });
}

export async function getLatestRideTracking(rideId: string) {
  return await supabase
    .from("ride_tracking")
    .select("*")
    .eq("ride_id", rideId)
    .maybeSingle();
}

export async function getRideSafetyEvents(rideId: string, passengerId: string) {
  return await supabase
    .from("ride_safety_events")
    .select("*")
    .eq("ride_id", rideId)
    .eq("passenger_id", passengerId)
    .order("created_at", {
      ascending: true,
    });
}

export function subscribeToRideTracking(
  rideId: string,
  onUpdate: (snapshot: RideTrackingSnapshot) => void,
) {
  const channel = supabase
    .channel(`ride-tracking-${rideId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ride_tracking",
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        console.log("Driver tracking updated:", payload.eventType);

        if (!payload.new) {
          return;
        }

        onUpdate(payload.new as RideTrackingSnapshot);
      },
    )
    .subscribe((status) => {
      console.log("Tracking Realtime:", status);
    });

  return channel;
}

export async function removeRideTrackingSubscription(channel: any) {
  if (!channel) {
    return;
  }

  await supabase.removeChannel(channel);
}
