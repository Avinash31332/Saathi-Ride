import { useEffect } from "react";
import { useRef } from "react";

import { supabase } from "../services/supabase";

import { useEventService } from "../services/event.service";

import { createRideRealtime } from "../services/realtime/rideRealtime";
import { createBookingRealtime } from "../services/realtime/bookingRealtime";

export default function RealtimeListener() {
  const handledDropRequests = useRef(new Set<string>());
  const {
    showRideCompletion,
    showRideCompleted,
    showPassengerDropRequest,
    showPassengerDropReason,
  } = useEventService();

  useEffect(() => {
    let rideChannel: any = null;
    let bookingChannel: any = null;

    const startRealtime = async (userId: string) => {
      //---------------------------------------------
      // Remove previous channels
      //---------------------------------------------

      if (rideChannel) {
        await supabase.removeChannel(rideChannel);
      }

      if (bookingChannel) {
        await supabase.removeChannel(bookingChannel);
      }

      console.log("Starting realtime for:", userId);

      //---------------------------------------------
      // Ride realtime
      //---------------------------------------------

      rideChannel = createRideRealtime(userId, {
        onRideAwaitingConfirmation: async (ride) => {
          // Driver shouldn't receive passenger confirmation popup
          if (ride.driver_id === userId) return;

          const { data: booking } = await supabase
            .from("bookings")
            .select("*")
            .eq("ride_id", ride.id)
            .eq("passenger_id", userId)
            .eq("booking_status", "confirmed")
            .single();

          if (!booking) return;

          if (booking.ride_completion_confirmed) return;
          if (booking.drop_request_pending) return;
          showRideCompletion({
            bookingId: booking.id,

            rideId: ride.id,

            reviewerId: userId,

            driverId: ride.driver_id,

            source: ride.source,

            destination: ride.destination,

            rideDate: ride.ride_date,

            rideTime: ride.ride_time,
          });
        },

        onRideCompleted: (ride) => {
          const isDriver = ride.driver_id === userId;

          if (!isDriver) {
            showRideCompleted(
              {
                rideId: ride.id,
                reviewerId: userId,
                driverId: ride.driver_id,
                source: ride.source,
                destination: ride.destination,
                rideDate: ride.ride_date,
                rideTime: ride.ride_time,
              },
              false,
            );
          }
        },
      });

      //---------------------------------------------
      // Booking realtime
      //---------------------------------------------

      bookingChannel = createBookingRealtime(userId, {
        onDropRequest: async (booking) => {
          const key = booking.id;

          if (handledDropRequests.current.has(key)) {
            return;
          }

          handledDropRequests.current.add(key);

          const { data: ride } = await supabase
            .from("rides")
            .select("*")
            .eq("id", booking.ride_id)
            .single();

          if (!ride) return;

          showPassengerDropRequest({
            bookingId: booking.id,
            rideId: ride.id,
            reviewerId: userId,
            driverId: ride.driver_id,
            source: ride.source,
            destination: ride.destination,
            rideDate: ride.ride_date,
            rideTime: ride.ride_time,
          });
        },
        onDropResolved: (booking) => {
          handledDropRequests.current.delete(booking.id);
        },
      });
    };

    //---------------------------------------------
    // Existing session
    //---------------------------------------------

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        startRealtime(data.session.user.id);
      }
    });

    //---------------------------------------------
    // Auth changes
    //---------------------------------------------

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        startRealtime(session.user.id);
      }
    });

    //---------------------------------------------
    // Cleanup
    //---------------------------------------------

    return () => {
      subscription.unsubscribe();

      if (rideChannel) {
        supabase.removeChannel(rideChannel);
      }

      if (bookingChannel) {
        supabase.removeChannel(bookingChannel);
      }
    };
  }, []);

  return null;
}
