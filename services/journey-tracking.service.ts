import {
  AdaptiveCheckpointResult,
  adaptiveProcessCheckpoint,
  AdaptiveTrackingMode,
  clearTrackingCache,
} from "./adaptive-tracking.service";

import {
  calculateLocalRouteProgress,
  LocalRouteProgressResult,
} from "./maps/local-route-progress.service";

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

export interface JourneyLocationResult {
  routeProgress: LocalRouteProgressResult;

  adaptiveResult: AdaptiveCheckpointResult;
}

/*
 * In-memory route cache.
 *
 * The route polyline is static for the whole
 * journey.
 *
 * There is absolutely no reason to query the
 * rides table on every GPS reading.
 */

const journeyRouteCache = new Map<
  string,
  {
    routePolyline: string;

    rideStatus: string;

    loadedAt: number;
  }
>();

const ROUTE_CACHE_LIFETIME_MS = 30 * 60 * 1000;

async function getJourneyRoute(rideId: string) {
  const cached = journeyRouteCache.get(rideId);

  if (cached && Date.now() - cached.loadedAt < ROUTE_CACHE_LIFETIME_MS) {
    return {
      data: cached,
      error: null,
      source: "cache" as const,
    };
  }

  const { data, error } = await supabase
    .from("rides")
    .select(
      `
      id,
      route_polyline,
      ride_status
      `,
    )
    .eq("id", rideId)
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error || new Error("Ride not found"),
      source: "database" as const,
    };
  }

  if (!data.route_polyline) {
    return {
      data: null,
      error: new Error("Ride route polyline is missing"),
      source: "database" as const,
    };
  }

  const routeData = {
    routePolyline: data.route_polyline,

    rideStatus: data.ride_status,

    loadedAt: Date.now(),
  };

  journeyRouteCache.set(rideId, routeData);

  return {
    data: routeData,
    error: null,
    source: "database" as const,
  };
}

/*
 * MAIN GPS ENTRY POINT
 *
 * Every driver GPS reading should eventually
 * come through this function.
 */

export async function processJourneyLocation({
  rideId,

  latitude,

  longitude,

  trackingMode,
}: {
  rideId: string;

  latitude: number;

  longitude: number;

  trackingMode: AdaptiveTrackingMode;
}): Promise<JourneyLocationResult> {
  /*
   * STEP 1
   *
   * Get route.
   *
   * Usually this comes from memory cache.
   */

  const routeResult = await getJourneyRoute(rideId);

  if (routeResult.error || !routeResult.data) {
    throw routeResult.error || new Error("Unable to load journey route");
  }

  console.log("JOURNEY ROUTE SOURCE:", routeResult.source);

  /*
   * Only active journeys should process GPS.
   */

  if (routeResult.data.rideStatus !== "in_progress") {
    throw new Error("Journey is not currently in progress");
  }

  /*
   * STEP 2
   *
   * Calculate everything locally.
   *
   * ZERO Supabase requests here.
   */

  const routeProgress = calculateLocalRouteProgress(
    routeResult.data.routePolyline,

    latitude,

    longitude,
  );

  console.log("LOCAL ROUTE ANALYSIS:", {
    progress: routeProgress.progressPercentage.toFixed(2),

    distanceFromRouteKm: routeProgress.distanceFromRouteKm.toFixed(3),

    detectedDeviation: routeProgress.routeDeviation,

    nearestRouteIndex: routeProgress.nearestRouteIndex,
  });

  /*
   * STEP 3
   *
   * Adaptive cache decides whether this GPS
   * reading deserves a database upload.
   */

  const adaptiveResult = await adaptiveProcessCheckpoint({
    rideId,

    latitude,

    longitude,

    progressPercentage: routeProgress.progressPercentage,

    detectedRouteDeviation: routeProgress.routeDeviation,

    trackingMode,
  });

  console.log("JOURNEY ADAPTIVE RESULT:", {
    uploaded: adaptiveResult.uploaded,

    reason: adaptiveResult.reason,

    checkpoint: adaptiveResult.checkpoint,

    confirmedDeviation: adaptiveResult.cache.routeDeviation,
  });

  return {
    routeProgress,

    adaptiveResult,
  };
}

/*
 * Call this when a journey starts.
 *
 * The route is fetched once and placed into
 * memory before GPS readings begin.
 */

export async function prepareJourneyTracking(rideId: string) {
  journeyRouteCache.delete(rideId);

  const result = await getJourneyRoute(rideId);

  if (result.error) {
    throw result.error;
  }

  console.log("JOURNEY TRACKING PREPARED:", rideId);

  return result.data;
}

/*
 * Call when ride is completed / cancelled.
 */

export async function stopJourneyTracking(rideId: string) {
  journeyRouteCache.delete(rideId);

  await clearTrackingCache(rideId);

  console.log("JOURNEY TRACKING CACHE CLEARED:", rideId);
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

  const {
    data: ride,

    error: rideError,
  } = await supabase.from("rides").select("*").eq("id", rideId).single();

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
    const {
      data: passengerBooking,

      error: bookingError,
    } = await supabase
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

  const {
    data: driver,

    error: driverError,
  } = await supabase
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
    const {
      data: vehicleData,

      error: vehicleError,
    } = await supabase
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
   * PASSENGER MANIFEST
   */

  let passengers: any[] = [];

  if (isDriver) {
    const {
      data: passengerData,

      error: passengerError,
    } = await supabase
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
   * TRACKING STATE
   */

  const {
    data: tracking,

    error: trackingError,
  } = await supabase
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

  const {
    count,

    error,
  } = await supabase
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

export function subscribeToJourney(
  rideId: string,

  onChange: () => void,
) {
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
        event: "*",

        schema: "public",

        table: "rides",

        filter: `id=eq.${rideId}`,
      },

      () => {
        /*
         * Ride status may have changed.
         *
         * Remove cached route metadata so the
         * next tracking action reloads status.
         */

        journeyRouteCache.delete(rideId);

        console.log("Journey ride updated");

        onChange();
      },
    )
    .subscribe((status) => {
      console.log("Journey Realtime:", status);
    });

  return channel;
}

export async function removeJourneySubscription(channel: any) {
  if (!channel) {
    return;
  }

  await supabase.removeChannel(channel);
}
