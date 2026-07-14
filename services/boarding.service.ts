import { activateSafetyMode } from "./safety.service";
import { supabase } from "./supabase";

export interface VerifyBoardingPinResult {
  success: boolean;
  bookingId?: string;
  rideId?: string;
  passengerId?: string;
  boardedAt?: string;
  safetyActivated?: boolean;
  safetyError?: any;
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

    /*
     * VERIFY BOARDING
     */

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

    const verifiedBookingId = result.booking_id || bookingId;

    /*
     * ACTIVATE PASSENGER SAFETY
     *
     * Boarding must remain successful even if
     * safety activation temporarily fails.
     *
     * The safety session can later be recovered
     * by the journey screen/recovery service.
     */

    let safetyActivated = false;
    let safetyError: any = null;

    try {
      const { error: activationError } =
        await activateSafetyMode(verifiedBookingId);

      if (activationError) {
        safetyError = activationError;

        console.log("SAFETY MODE ACTIVATION ERROR:", activationError);
      } else {
        safetyActivated = true;

        console.log("SAFETY MODE ACTIVATED:", {
          bookingId: verifiedBookingId,
          rideId: result.ride_id,
          passengerId: result.passenger_id,
        });
      }
    } catch (activationError) {
      safetyError = activationError;

      console.log("SAFETY MODE ACTIVATION EXCEPTION:", activationError);
    }

    return {
      success: true,
      bookingId: verifiedBookingId,
      rideId: result.ride_id,
      passengerId: result.passenger_id,
      boardedAt: result.boarded_at,
      safetyActivated,
      safetyError,
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
