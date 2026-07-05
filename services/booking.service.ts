import { supabase } from "./supabase";
import { getAvailableSeats } from "./seat.service";

export async function bookRide(
  rideId: string,
  passengerId: string,
  seatsBooked: number
) {
  const { data: ride } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();

  if (!ride) {
    return {
      error: {
        message: "Ride not found",
      },
    };
  }

  const availableSeats =
  await getAvailableSeats(rideId);

if (
  availableSeats < seatsBooked
) {
  return {
    error: {
      message:
        "Not enough seats available",
    },
  };
}

  const { data: existingBooking } =
    await supabase
      .from("bookings")
      .select("*")
      .eq("ride_id", rideId)
      .eq("passenger_id", passengerId)
      .eq("booking_status", "confirmed")
      .single();

  if (existingBooking) {
    return {
      error: {
        message: "Already booked",
      },
    };
  }

  const bookingResult = await supabase
    .from("bookings")
    .insert([
      {
        ride_id: rideId,
        passenger_id: passengerId,
        seats_booked: seatsBooked,
        booking_status: "confirmed",
      },
    ]);

  if (bookingResult.error)
    return bookingResult;


  return bookingResult;
}

export async function getMyBookings(
  userId: string
) {
  return await supabase
  .from("bookings")
  .select(`
    *,
    rides (*)
  `)
  .eq("passenger_id", userId)
  .order("created_at", {
    ascending: false,
  });
}

export async function cancelBooking(
  bookingId: string
) {
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

export async function confirmRideCompletion(
  bookingId: string
) {
  return await supabase.rpc(
    "confirm_ride_completion",
    {
      booking_id: bookingId,
    }
  );
}

// export async function tryCompleteRide(
//   rideId: string
// ) {
//   console.log("Checking if ride can be completed...");

//   const { data: bookings, error } = await supabase
//     .from("bookings")
//     .select("*")
//     .eq("ride_id", rideId)
//     .eq("booking_status", "confirmed");

//   console.log("Bookings:");
//   console.log(bookings);

//   console.log("Booking Error:");
//   console.log(error);

//   if (!bookings?.length) {
//     console.log("No confirmed bookings");
//     return;
//   }

//   const allConfirmed = bookings.every(
//     booking => booking.ride_completion_confirmed
//   );

//   console.log("All confirmed:", allConfirmed);

//   if (!allConfirmed) {
//     console.log("Waiting for other passengers...");
//     return;
//   }

//   console.log("Updating ride...");

//   const result = await supabase
//   .from("rides")
//   .update({
//     ride_status: "completed",
//     completed_at: new Date().toISOString(),
//   })
//   .eq("id", rideId)
//   .select("*");
//   console.log("Rows Updated:", result.data?.length);

//   console.log("Update Result:");
//   console.log(result.data);

//   console.log("Update Error:");
//   console.log(result.error);

//   return result;
// }

export async function hasPassengerConfirmed(
  rideId: string,
  passengerId: string
) {
  return await supabase
    .from(
      "ride_completion_confirmations"
    )
    .select("*")
    .eq("ride_id", rideId)
    .eq(
      "passenger_id",
      passengerId
    )
    .single();
}

export async function getPendingRideConfirmation(
  passengerId: string
) {
  return await supabase
    .from("bookings")
    .select(`
      *,
      rides (
        *,
        profiles (
          full_name
        )
      )
    `)
    .eq("passenger_id", passengerId)
    .eq("booking_status", "confirmed")
    .eq("ride_completion_confirmed", false)
    .eq("rides.ride_status","awaiting_confirmation");
}