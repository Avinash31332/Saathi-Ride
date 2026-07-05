import { useEffect, useRef } from "react";
import { supabase } from "../services/supabase";
import { useEventService } from "../services/event.service";

export default function RealtimeListener() {
  const { showRideCompletion, showRideCompleted } = useEventService();

  const handledEvents = useRef(new Set<string>());

  useEffect(() => {
    let channel: any = null;

    const startRealtime = async (userId: string) => {
      if (channel) {
        await supabase.removeChannel(channel);
      }

      console.log("Starting realtime for:", userId);

      channel = supabase
        .channel(`ride-events-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rides",
          },
          async (payload) => {
            console.log("========== UPDATE RECEIVED ==========");

            const ride = payload.new as any;

            console.log("Ride Status:", ride.ride_status);

            //----------------------------------------------------
            // DRIVER?
            //----------------------------------------------------

            const isDriver = ride.driver_id === userId;

            //----------------------------------------------------
            // WAITING FOR PASSENGER CONFIRMATION
            //----------------------------------------------------

            if (ride.ride_status === "awaiting_confirmation") {
              // Driver doesn't need this popup
              if (isDriver) return;

              const { data: booking } = await supabase
                .from("bookings")
                .select("*")
                .eq("ride_id", ride.id)
                .eq("passenger_id", userId)
                .eq("booking_status", "confirmed")
                .single();

              if (!booking) return;

              // Already confirmed
              if (booking.ride_completion_confirmed) return;

              const key = `${ride.id}-${booking.id}-awaiting`;

              if (handledEvents.current.has(key)) return;

              handledEvents.current.add(key);

              showRideCompletion({
                bookingId: booking.id,

                rideId: ride.id,

                driverId: ride.driver_id,

                reviewerId: userId,

                source: ride.source,

                destination: ride.destination,

                rideDate: ride.ride_date,

                rideTime: ride.ride_time,
              });

              return;
            }

            //----------------------------------------------------
            // RIDE COMPLETED
            //----------------------------------------------------

            if (ride.ride_status === "completed") {
              const key = `${ride.id}-completed-${userId}`;

              if (handledEvents.current.has(key)) return;

              handledEvents.current.add(key);

              showRideCompleted(
                {
                  rideId: ride.id,

                  bookingId: null,

                  reviewerId: userId,

                  driverId: ride.driver_id,

                  source: ride.source,

                  destination: ride.destination,

                  rideDate: ride.ride_date,

                  rideTime: ride.ride_time,
                },
                isDriver,
              );

              return;
            }
          },
        )
        .subscribe((status) => {
          console.log("Realtime:", status);
        });
    };

    //----------------------------------------------------
    // Existing Session
    //----------------------------------------------------

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        startRealtime(data.session.user.id);
      }
    });

    //----------------------------------------------------
    // Login / Logout
    //----------------------------------------------------

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handledEvents.current.clear();

      if (session?.user) {
        startRealtime(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return null;
}
