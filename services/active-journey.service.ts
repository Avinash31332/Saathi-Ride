import { supabase } from "./supabase";

export type ActiveJourneyRole = "driver" | "passenger";

export interface ActiveJourney {
  role: ActiveJourneyRole;
  rideId: string;
}

export async function getMyActiveJourney(): Promise<{
  data: ActiveJourney | null;
  error: any;
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("User not authenticated"),
    };
  }

  /*
   * DRIVER ACTIVE JOURNEY
   */

  const { data: driverRides, error: driverError } = await supabase
    .from("rides")
    .select("id, ride_status")
    .eq("driver_id", user.id)
    .in("ride_status", ["active", "in_progress"])
    .limit(1);

  if (driverError) {
    return {
      data: null,
      error: driverError,
    };
  }

  const driverRide = driverRides?.[0];

  if (driverRide) {
    return {
      data: {
        role: "driver",
        rideId: driverRide.id,
      },
      error: null,
    };
  }

  /*
   * PASSENGER ACTIVE JOURNEY
   */

  const { data: passengerBookings, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      ride_id,
      boarding_verified,
      rides!inner(
        id,
        ride_status
      )
      `,
    )
    .eq("passenger_id", user.id)
    .eq("boarding_verified", true)
    .eq("booking_status", "confirmed")
    .in("rides.ride_status", ["active", "in_progress"])
    .limit(1);

  if (bookingError) {
    return {
      data: null,
      error: bookingError,
    };
  }

  const passengerBooking = passengerBookings?.[0];

  if (passengerBooking) {
    return {
      data: {
        role: "passenger",
        rideId: passengerBooking.ride_id,
      },
      error: null,
    };
  }

  return {
    data: null,
    error: null,
  };
}
