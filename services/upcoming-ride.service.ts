import { supabase } from "./supabase";

export async function getUpcomingRide() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  /*
   * Upcoming as Driver
   */

  const { data: driverRide } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", user.id)
    .in("ride_status", ["scheduled", "active"])
    .order("ride_date", {
      ascending: true,
    })
    .order("ride_time", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  /*
   * Upcoming as Passenger
   */

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      rides!inner(*)
    `,
    )
    .eq("passenger_id", user.id)
    .eq("booking_status", "confirmed")
    .in("rides.ride_status", ["scheduled"])
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const driverDate = driverRide
    ? new Date(`${driverRide.ride_date} ${driverRide.ride_time}`)
    : null;

  const passengerDate = booking
    ? new Date(`${booking.rides.ride_date} ${booking.rides.ride_time}`)
    : null;

  if (!driverRide && !booking) {
    return {
      data: null,
      error: null,
    };
  }

  if (
    driverRide &&
    (!passengerDate || (driverDate && driverDate < passengerDate))
  ) {
    return {
      data: {
        role: "driver",
        ride: driverRide,
      },
      error: null,
    };
  }

  return {
    data: {
      role: "passenger",
      ride: booking!.rides,
      booking,
    },
    error: null,
  };
}
