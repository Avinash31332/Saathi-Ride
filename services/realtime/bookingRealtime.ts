import { supabase } from "../supabase";

export function createBookingRealtime(
  userId: string,
  callbacks: {
    onDropRequest: (booking: any) => void;
    onDropResolved?: (booking: any) => void;
  },
) {
  return supabase
    .channel(`booking-events-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        const oldBooking = payload.old as any;
        const booking = payload.new as any;

        if (booking.passenger_id !== userId) return;

        const becamePending =
          booking.drop_request_pending === true &&
          oldBooking?.drop_request_pending !== true;

        if (becamePending) {
          callbacks.onDropRequest(booking);
        }

        const resolved =
          oldBooking?.drop_request_pending === true &&
          booking.drop_request_pending === false;

        if (resolved && callbacks.onDropResolved) {
          callbacks.onDropResolved(booking);
        }
      },
    )
    .subscribe((status) => {
      console.log("Booking Realtime:", status);
    });
}