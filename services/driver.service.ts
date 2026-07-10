import { supabase } from "./supabase";

export async function getRidePassengers(
  driverId: string
) {
  return await supabase
    .from("rides")
    .select(`
          *,
          bookings!inner(
          *,
          profiles (
          full_name,
          phone
        )
      )
    `)
    .eq("driver_id", driverId)
    .eq("bookings.booking_status","confirmed")
    .order("ride_date");
}

export async function getDriverStats(
  driverId: string
) {
  const { count } = await supabase
    .from("rides")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("driver_id", driverId);

  const { data: reviews } =
    await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewed_user_id", driverId);

  let averageRating = 0;

  if (reviews?.length) {
    averageRating =
      reviews.reduce(
        (sum, r) => sum + r.rating,
        0
      ) / reviews.length;
  }

  return {
    totalRides: count || 0,
    averageRating,
  };
}

export async function completeRide(
  rideId: string
) {
  const { data: ride } =
    await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

  const result =
    await supabase
.from("rides")
.update({
    ride_status: "awaiting_confirmation",
    completion_mode: "ride"
})
.eq("id", rideId);

  return result;
}

export async function getDriverProfile(
  driverId: string
) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", driverId)
    .single();
}

export async function getDriverVehicles(
  driverId: string
) {
  return await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", driverId);
}