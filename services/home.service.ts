import { supabase } from "./supabase";

export async function getMyUpcomingRide() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error("No user"),
    };
  }

  /*
   * Driver upcoming
   */

  const { data: driverRide } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", user.id)
    .eq("ride_status", "scheduled")
    .order("ride_date")
    .limit(1)
    .maybeSingle();

  if (driverRide) {
    return {
      data: driverRide,
      error: null,
    };
  }

  /*
   * Passenger upcoming
   */

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      rides(*)
      `,
    )
    .eq("passenger_id", user.id)
    .eq("booking_status", "confirmed")
    .limit(1)
    .maybeSingle();

  return {
    data: booking?.rides ?? null,
    error: null,
  };
}
