import { supabase } from "./supabase";

interface CreateRideInput {
  driver_id: string;
  vehicle_id: string;

  source: string;
  destination: string;

  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;

  route_polyline?: string;
  route_distance_km?: number;
  route_duration_minutes?: number;

  ride_date: string;
  ride_time: string;

  notes: string;
  luggage_allowed: boolean;

  max_seats: number;
  price: number;

  women_only?: boolean;
}

export async function createRide(rideData: CreateRideInput) {
  return await supabase.from("rides").insert([
    {
      ...rideData,
      available_seats: rideData.max_seats,
      ride_status: "active",

      women_only: rideData.women_only ?? false,

      safety_mode_enabled: rideData.women_only ?? false,
    },
  ]);
}

export async function getAllRides() {
  return await supabase.from("rides").select("*");
}

export async function getMyRides(userId: string) {
  return await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", userId)
    .order("ride_date", {
      ascending: true,
    });
}

export async function searchRides(source: string, destination: string) {
  return await supabase.rpc("search_available_rides", {
    p_source: source.trim(),
    p_destination: destination.trim(),
  });
}

export async function completeRide(rideId: string) {
  return await supabase
    .from("rides")
    .update({
      ride_status: "completed",
    })
    .eq("id", rideId);
}

export async function cancelRide(rideId: string) {
  return await supabase
    .from("rides")
    .update({
      ride_status: "cancelled",
    })
    .eq("id", rideId);
}
