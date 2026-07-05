import { supabase } from "./supabase";

export async function getAvailableSeats(
  rideId: string
) {
  const { data: ride } =
    await supabase
      .from("rides")
      .select("max_seats")
      .eq("id", rideId)
      .single();

  if (!ride) return 0;

  const { data: bookings } =
    await supabase
      .from("bookings")
      .select("seats_booked")
      .eq("ride_id", rideId)
      .eq(
        "booking_status",
        "confirmed"
      );

  const bookedSeats =
    bookings?.reduce(
      (sum, booking) =>
        sum + booking.seats_booked,
      0
    ) || 0;

  return (
    ride.max_seats - bookedSeats
  );
}