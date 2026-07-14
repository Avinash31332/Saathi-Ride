import { supabase } from "./supabase";

export interface VerifyBoardingPinResult {
  success: boolean;
  bookingId?: string;
  rideId?: string;
  passengerId?: string;
  boardedAt?: string;
  error: any;
}

export async function verifyBoardingPin(
  bookingId: string,
  pin: string,
): Promise<VerifyBoardingPinResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError || new Error("User not authenticated"),
      };
    }

    const cleanPin = pin.trim();

    if (!cleanPin) {
      return {
        success: false,
        error: new Error("Enter the boarding PIN"),
      };
    }

    const { data, error } = await supabase.rpc("verify_boarding_pin", {
      p_booking_id: bookingId,
      p_pin: cleanPin,
    });

    if (error) {
      console.log("VERIFY BOARDING PIN RPC ERROR:", error);

      return {
        success: false,
        error,
      };
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return {
        success: false,
        error: new Error("Unable to verify boarding PIN"),
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: new Error(result.message || "Invalid boarding PIN"),
      };
    }

    return {
      success: true,
      bookingId: result.booking_id,
      rideId: result.ride_id,
      passengerId: result.passenger_id,
      boardedAt: result.boarded_at,
      error: null,
    };
  } catch (error) {
    console.log("VERIFY BOARDING PIN ERROR:", error);

    return {
      success: false,
      error,
    };
  }
}
