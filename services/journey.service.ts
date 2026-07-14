import { supabase } from "./supabase";

export type JourneyRole = "driver" | "passenger";

export interface JourneyData {
  role: JourneyRole;
  ride: any;
  booking: any | null;
  passengers: any[];
  driver: any | null;
  vehicle: any | null;
  tracking: any | null;
}

export async function getJourneyData(rideId: string): Promise<{
  data: JourneyData | null;
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
   * LOAD RIDE
   */

  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    return {
      data: null,
      error: rideError || new Error("Ride not found"),
    };
  }

  /*
   * DETECT ROLE
   */

  const isDriver = ride.driver_id === user.id;

  let booking: any = null;

  if (!isDriver) {
    const { data: passengerBooking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("ride_id", rideId)
      .eq("passenger_id", user.id)
      .in("booking_status", ["confirmed", "completed"])
      .maybeSingle();

    if (bookingError) {
      return {
        data: null,
        error: bookingError,
      };
    }

    if (!passengerBooking) {
      return {
        data: null,
        error: new Error("You are not part of this journey"),
      };
    }

    booking = passengerBooking;
  }

  /*
   * LOAD DRIVER
   */

  const { data: driver, error: driverError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", ride.driver_id)
    .single();

  if (driverError) {
    console.log("JOURNEY DRIVER ERROR:", driverError);
  }

  /*
   * LOAD VEHICLE
   */

  let vehicle: any = null;

  if (ride.vehicle_id) {
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", ride.vehicle_id)
      .maybeSingle();

    if (vehicleError) {
      console.log("JOURNEY VEHICLE ERROR:", vehicleError);
    }

    vehicle = vehicleData;
  }

  /*
   * LOAD PASSENGER MANIFEST
   */

  let passengers: any[] = [];

  if (isDriver) {
    const { data: passengerData, error: passengerError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        profiles (
          id,
          full_name,
          phone,
          profile_image
        )
      `,
      )
      .eq("ride_id", rideId)
      .eq("booking_status", "confirmed")
      .order("pickup_route_progress", {
        ascending: true,
      });

    if (passengerError) {
      console.log("JOURNEY PASSENGER ERROR:", passengerError);
    }

    passengers = passengerData || [];
  }

  /*
   * LOAD TRACKING
   *
   * ride_tracking currently has one row
   * per ride because ride_id is the
   * journey tracking identity.
   */

  const { data: tracking, error: trackingError } = await supabase
    .from("ride_tracking")
    .select("*")
    .eq("ride_id", rideId)
    .maybeSingle();

  if (trackingError) {
    console.log("JOURNEY TRACKING ERROR:", trackingError);
  }

  return {
    data: {
      role: isDriver ? "driver" : "passenger",

      ride,

      booking,

      passengers,

      driver: driver || null,

      vehicle,

      tracking: tracking || null,
    },

    error: null,
  };
}

export async function getJourneyTracking(rideId: string) {
  return await supabase
    .from("ride_tracking")
    .select("*")
    .eq("ride_id", rideId)
    .maybeSingle();
}

export async function getJourneySafetyEvents(
  rideId: string,
  passengerId: string,
) {
  return await supabase
    .from("ride_safety_events")
    .select("*")
    .eq("ride_id", rideId)
    .eq("passenger_id", passengerId)
    .order("created_at", {
      ascending: true,
    });
}

export async function getTrustedContactCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      count: 0,
      error: new Error("User not authenticated"),
    };
  }

  const { count, error } = await supabase
    .from("trusted_contacts")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id);

  return {
    count: count || 0,
    error,
  };
}

export function subscribeToJourney(rideId: string, onChange: () => void) {
  const channel = supabase
    .channel(`journey-screen-${rideId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ride_tracking",
        filter: `ride_id=eq.${rideId}`,
      },
      () => {
        console.log("Journey tracking updated");

        onChange();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: `ride_id=eq.${rideId}`,
      },
      () => {
        console.log("Journey booking updated");

        onChange();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides",
        filter: `id=eq.${rideId}`,
      },
      (payload) => {
        console.log("Journey ride updated");

        const oldStatus = (payload.old as any)?.ride_status;
        const newStatus = (payload.new as any)?.ride_status;

        if (oldStatus === "scheduled" && newStatus === "active") {
          console.log("Journey Started");

          // Don't show Alert here
          // We'll trigger it from the screen instead.
        }

        onChange();
      },
    )
    .subscribe((status) => {
      console.log("Journey Realtime:", status);
    });

  return channel;
}

export async function removeJourneySubscription(channel: any) {
  if (!channel) return;

  await supabase.removeChannel(channel);
}
