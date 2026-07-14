import { notifyJourneyStarted } from "./journey-notification.service";
import { supabase } from "./supabase";

export async function canStartJourney(rideId: string) {
  const { data, error } = await supabase
    .from("rides")
    .select("ride_status")
    .eq("id", rideId)
    .single();

  if (error) {
    return {
      canStart: false,
      error,
    };
  }

  return {
    canStart: data.ride_status === "scheduled",
    error: null,
  };
}

export async function startJourney(rideId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: new Error("Not authenticated"),
    };
  }

  try {
    const { error: rideError } = await supabase
      .from("rides")
      .update({
        ride_status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", rideId);

    if (rideError) {
      throw rideError;
    }

    const notificationResult = await notifyJourneyStarted(rideId);

    console.log("JOURNEY START NOTIFICATION RESULT:", notificationResult);
  } catch (error) {
    console.log("JOURNEY START ERROR:", error);

    return {
      success: false,
      error,
    };
  }

  /*
   * Ensure ride_tracking row exists.
   */

  await supabase.from("ride_tracking").upsert(
    {
      ride_id: rideId,
      driver_lat: 0,
      driver_lng: 0,
      progress_percentage: 0,
      tracking_mode: "normal",
      last_checkpoint: 0,
      route_deviation: false,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "ride_id",
    },
  );

  return {
    success: true,
    error: null,
  };
}

export async function finishJourney(rideId: string) {
  return await supabase
    .from("rides")
    .update({
      ride_status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", rideId);
}
