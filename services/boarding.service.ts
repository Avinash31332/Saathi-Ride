import { supabase } from "./supabase";

export interface BoardingVerificationResult {
  success: boolean;

  already_verified: boolean;

  booking_id: string;

  passenger_id: string;

  ride_id?: string;

  boarded_at?: string;
}

export async function verifyPassengerBoarding({
  bookingId,
  pin,
}: {
  bookingId: string;

  pin: string;
}) {
  const cleanPin = pin.trim();

  if (!/^\d{4}$/.test(cleanPin)) {
    return {
      data: null,

      error: new Error("Enter the 4-digit boarding PIN"),
    };
  }

  const { data, error } = await supabase.rpc(
    "verify_passenger_boarding",

    {
      p_booking_id: bookingId,

      p_pin: cleanPin,
    },
  );

  if (error) {
    console.log("VERIFY BOARDING ERROR:", error);

    return {
      data: null,

      error,
    };
  }

  console.log("PASSENGER BOARDING VERIFIED:", data);

  return {
    data: data as BoardingVerificationResult,

    error: null,
  };
}

export async function getPassengerBoardingPin(bookingId: string) {
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

  return await supabase
    .from("bookings")
    .select(
      `
      id,
      ride_id,
      passenger_id,
      boarding_pin,
      boarding_verified,
      boarded_at,
      booking_status,
      pickup_name,
      drop_name
      `,
    )
    .eq("id", bookingId)
    .eq("passenger_id", user.id)
    .single();
}
