import {
  matchPassengerSegment,
  RouteCoordinate,
} from "./maps/route-matching.service";
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
      ride_status: "scheduled",

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
export interface SegmentRideResult {
  id: string;

  driver_id: string;

  source: string;

  destination: string;

  ride_date: string;

  ride_time: string;

  price: number;

  max_seats: number;

  women_only: boolean;

  route_polyline: string;

  route_distance_km: number;

  pickupProgress: number;

  dropProgress: number;

  pickupRouteDistanceKm: number;

  dropRouteDistanceKm: number;

  segmentDistanceKm: number;

  segmentPrice: number;

  availableSegmentSeats: number;
}
export async function searchSegmentRides(
  pickup: RouteCoordinate,
  drop: RouteCoordinate,
  womenOnly = false,
) {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("gender")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      data: null,
      error: profileError,
    };
  }

  if (womenOnly && profile?.gender !== "female") {
    return {
      data: null,
      error: new Error(
        "Women Only rides are available only to women passengers",
      ),
    };
  }

  let query = supabase
    .from("rides")
    .select("*")
    .in("ride_status", ["scheduled", "active"])
    .not("route_polyline", "is", null);

  if (womenOnly) {
    query = query.eq("women_only", true);
  } else if (profile?.gender !== "female") {
    query = query.eq("women_only", false);
  }

  const { data: rides, error } = await query;

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const matchedRides: SegmentRideResult[] = [];

  for (const ride of rides || []) {
    try {
      const segment = matchPassengerSegment(
        pickup,
        drop,
        ride.route_polyline,
        2,
      );

      if (
        !segment.matched ||
        !segment.pickupProjection ||
        !segment.dropProjection ||
        segment.segmentDistanceKm == null
      ) {
        continue;
      }

      const pickupProgress = segment.pickupProjection.progress;

      const dropProgress = segment.dropProjection.progress;

      const { data: availableSeats, error: seatsError } = await supabase.rpc(
        "get_segment_available_seats",
        {
          p_ride_id: ride.id,

          p_pickup_progress: pickupProgress,

          p_drop_progress: dropProgress,
        },
      );

      if (seatsError) {
        console.log("SEGMENT SEAT ERROR:", seatsError);

        continue;
      }

      if (Number(availableSeats) <= 0) {
        continue;
      }

      const fullDistance = Number(ride.route_distance_km) || 0;

      const fullPrice = Number(ride.price) || 0;

      let segmentPrice = fullPrice;

      if (fullDistance > 0 && segment.segmentDistanceKm > 0) {
        segmentPrice = Math.ceil(
          fullPrice * (segment.segmentDistanceKm / fullDistance),
        );
      }

      segmentPrice = Math.max(1, segmentPrice);

      matchedRides.push({
        ...ride,

        pickupProgress,

        dropProgress,

        pickupRouteDistanceKm: segment.pickupProjection.distanceFromStartKm,

        dropRouteDistanceKm: segment.dropProjection.distanceFromStartKm,

        segmentDistanceKm: segment.segmentDistanceKm,

        segmentPrice,

        availableSegmentSeats: Number(availableSeats),
      });
    } catch (segmentError) {
      console.log("SEGMENT MATCH ERROR:", ride.id, segmentError);
    }
  }

  matchedRides.sort((a, b) => a.segmentPrice - b.segmentPrice);

  return {
    data: matchedRides,
    error: null,
  };
}
