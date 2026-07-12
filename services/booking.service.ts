import { supabase } from "./supabase";

export async function bookRide(
  rideId: string,
  passengerId: string,
  seatsBooked: number,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || {
        message: "Not authenticated",
      },
    };
  }

  if (user.id !== passengerId) {
    return {
      data: null,
      error: {
        message: "Invalid passenger",
      },
    };
  }

  return await supabase.rpc("book_ride", {
    p_ride_id: rideId,
    p_seats_booked: seatsBooked,
  });
}

export async function getMyBookings(userId: string) {
  return await supabase
    .from("bookings")
    .select(
      `
    *,
    rides (*)
  `,
    )
    .eq("passenger_id", userId)
    .order("created_at", {
      ascending: false,
    });
}

export async function cancelBooking(bookingId: string) {
  const result = await supabase
    .from("bookings")
    .update({
      booking_status: "cancelled",
    })
    .eq("id", bookingId)
    .select();

  console.log("CANCEL RESULT");
  console.log(result.data);
  console.log(result.error);

  return result;
}

//functions that run after the ride is completed

// export async function confirmRideCompletion(
//   rideId: string,
//   passengerId: string
// ) {
//   const { data: existing } =
//     await supabase
//       .from(
//         "ride_completion_confirmations"
//       )
//       .select("*")
//       .eq("ride_id", rideId)
//       .eq(
//         "passenger_id",
//         passengerId
//       )
//       .single();

//   if (existing) {
//     return {
//       error: {
//         message:
//           "Already confirmed",
//       },
//     };
//   }

//   return await supabase
//     .from(
//       "ride_completion_confirmations"
//     )
//     .insert([
//       {
//         ride_id: rideId,
//         passenger_id: passengerId,
//         confirmed: true,
//       },
//     ]);
// }

// export async function getRideConfirmations(
//   rideId: string
// ) {
//   return await supabase
//     .from(
//       "ride_completion_confirmations"
//     )
//     .select("*")
//     .eq("ride_id", rideId);
// }

// export async function tryCompleteRide(
//   rideId: string
// ) {
//   const { data: bookings } =
//     await supabase
//       .from("bookings")
//       .select("*")
//       .eq("ride_id", rideId)
//       .eq(
//         "booking_status",
//         "confirmed"
//       );

//   const { data: confirmations } =
//     await supabase
//       .from(
//         "ride_completion_confirmations"
//       )
//       .select("*")
//       .eq("ride_id", rideId)
//       .eq("confirmed", true);

//   console.log(
//     "BOOKINGS:",
//     bookings?.length
//   );

//   console.log(
//     "CONFIRMATIONS:",
//     confirmations?.length
//   );

//   if (
//     bookings?.length ===
//     confirmations?.length
//   ) {
//     const result =
//       await supabase
//         .from("rides")
//         .update({
//           ride_status:
//             "completed",
//           completed_at:
//             new Date(),
//         })
//         .eq("id", rideId)
//         .select();

//     console.log(
//       "COMPLETE RESULT"
//     );
//     console.log(
//       result.data
//     );
//     console.log(
//       result.error
//     );

//     return result;
//   }
// }

export async function confirmRideCompletion(bookingId: string) {
  return await supabase.rpc("confirm_ride_completion", {
    booking_id: bookingId,
  });
}

export async function hasPassengerConfirmed(
  rideId: string,
  passengerId: string,
) {
  return await supabase
    .from("ride_completion_confirmations")
    .select("*")
    .eq("ride_id", rideId)
    .eq("passenger_id", passengerId)
    .single();
}

export async function getPendingRideConfirmation(passengerId: string) {
  return await supabase
    .from("bookings")
    .select(
      `
      *,
      rides (
        *,
        profiles (
          full_name
        )
      )
    `,
    )
    .eq("passenger_id", passengerId)
    .eq("booking_status", "confirmed")
    .eq("ride_completion_confirmed", false)
    .eq("rides.ride_status", "awaiting_confirmation");
}

export async function requestPassengerDrop(bookingId: string) {
  return await supabase.rpc("request_passenger_drop", {
    booking_id: bookingId,
  });
}

export async function confirmPassengerDrop(bookingId: string, reason: string) {
  return await supabase.rpc("confirm_passenger_drop", {
    booking_id: bookingId,
    drop_reason_value: reason,
  });
}

export async function declinePassengerDrop(bookingId: string) {
  return await supabase.rpc("decline_passenger_drop", {
    booking_id: bookingId,
  });
}

// export async function finishRideIfNeeded(
//   rideId: string
// ) {
//   const { data: bookings } =
//     await supabase
//       .from("bookings")
//       .select("*")
//       .eq("ride_id", rideId);

//   if (!bookings) return;

//   const remaining =
//     bookings.filter(
//       booking =>
//         booking.booking_status ===
//         "confirmed"
//     );

//   if (remaining.length > 0) {
//     return;
//   }

//   return await supabase
//     .from("rides")
//     .update({
//       ride_status: "completed",

//       completed_at:
//         new Date().toISOString(),
//     })
//     .eq("id", rideId);
// }
