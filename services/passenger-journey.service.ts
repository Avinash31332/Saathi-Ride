import { supabase } from "./supabase";

export async function getPassengerActiveJourney() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("bookings")
    .select(
      `
        *,
        rides!inner(*)
    `,
    )
    .eq("passenger_id", user.id)
    .eq("booking_status", "confirmed")
    .eq("rides.ride_status", "active")
    .maybeSingle();

  return data;
}
