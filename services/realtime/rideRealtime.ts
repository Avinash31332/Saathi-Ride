import { supabase } from "../supabase";

export function createRideRealtime(
  userId: string,
  callbacks: {
    onRideAwaitingConfirmation: (ride: any) => void;
    onRideCompleted: (ride: any) => void;
  }
) {
  return supabase
    .channel(`ride-events-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rides",
      },
      (payload) => {
  const oldRide = payload.old as any;
  const ride = payload.new as any;

  // active -> awaiting_confirmation
  if (
    oldRide.ride_status !== "awaiting_confirmation" &&
    ride.ride_status === "awaiting_confirmation"
  ) {
    callbacks.onRideAwaitingConfirmation(ride);
  }

  // awaiting_confirmation -> completed
  if (
    oldRide.ride_status !== "completed" &&
    ride.ride_status === "completed"
  ) {
    callbacks.onRideCompleted(ride);
  }
}
    )
    .subscribe((status) => {
      console.log("Ride Realtime:", status);
    });
}