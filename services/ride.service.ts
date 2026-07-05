import { supabase } from "./supabase";

export async function createRide(rideData: {
  driver_id: string;

  vehicle_id: string;

  source: string;
  destination: string;

  ride_date: string;
  ride_time: string;

  notes: string;

  max_seats: number;

  price: number;
}) {
  return await supabase
    .from("rides")
    .insert([
      {
        ...rideData,

        available_seats:
        rideData.max_seats,
        ride_status: "active"
      },
    ]);
}

export async function getAllRides() {
  return await supabase
    .from("rides")
    .select("*");
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

export async function searchRides(
  source: string,
  destination: string
) {
  return await supabase
    .from("rides")
    .select("*")
    .ilike("source", `%${source}%`)
    .ilike("destination", `%${destination}%`)
    .eq("ride_status", "active")
    .gt("available_seats", 0)
    .order("ride_date");
}

export async function completeRide(
  rideId: string
) {
  return await supabase
    .from("rides")
    .update({
      ride_status: "completed",
    })
    .eq("id", rideId);
}

export async function cancelRide(
  rideId: string
) {
  return await supabase
    .from("rides")
    .update({
      ride_status: "cancelled",
    })
    .eq("id", rideId);
}

