import { supabase } from "./supabase";

export type JourneyNotificationType =
  | "journey_started"
  | "approaching_pickup"
  | "pickup_reached"
  | "passenger_boarded"
  | "approaching_drop"
  | "drop_reached"
  | "journey_completed";

interface JourneyNotificationInput {
  userId: string;

  rideId: string;

  bookingId: string | null;

  type: JourneyNotificationType;

  title: string;

  message: string;

  data?: Record<string, any>;
}

export async function createJourneyNotification({
  userId,

  rideId,

  bookingId,

  type,

  title,

  message,

  data = {},
}: JourneyNotificationInput) {
  try {
    const { data: notification, error } = await supabase
      .from("user_notifications")
      .insert({
        user_id: userId,

        ride_id: rideId,

        booking_id: bookingId,

        notification_type: type,

        title,

        message,

        notification_data: data,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("CREATE JOURNEY NOTIFICATION ERROR:", {
        rideId,

        bookingId,

        type,

        error,
      });

      return {
        created: false,

        notification: null,

        error,
      };
    }

    console.log("JOURNEY NOTIFICATION CREATED:", {
      rideId,

      bookingId,

      type,
    });

    return {
      created: Boolean(notification),

      notification,

      error: null,
    };
  } catch (error) {
    console.log("CREATE JOURNEY NOTIFICATION EXCEPTION:", error);

    return {
      created: false,

      notification: null,

      error,
    };
  }
}

export async function notifyJourneyStarted(rideId: string) {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
          id,
          passenger_id,
          pickup_name,
          drop_name,
          pickup_route_progress,
          drop_route_progress
          `,
      )
      .eq("ride_id", rideId)
      .eq("booking_status", "confirmed");

    if (error) {
      throw error;
    }

    let notifiedPassengers = 0;

    for (const booking of bookings || []) {
      const result = await createJourneyNotification({
        userId: booking.passenger_id,

        rideId,

        bookingId: booking.id,

        type: "journey_started",

        title: "Journey started",

        message:
          "Your driver has started the journey. You can now track ride progress.",

        data: {
          pickup_name: booking.pickup_name,

          drop_name: booking.drop_name,

          pickup_progress: booking.pickup_route_progress,

          drop_progress: booking.drop_route_progress,
        },
      });

      if (result.created) {
        notifiedPassengers += 1;
      }
    }

    console.log("JOURNEY START NOTIFICATIONS COMPLETE:", {
      rideId,

      notifiedPassengers,
    });

    return {
      success: true,

      notifiedPassengers,

      error: null,
    };
  } catch (error) {
    console.log("NOTIFY JOURNEY STARTED ERROR:", error);

    return {
      success: false,

      notifiedPassengers: 0,

      error,
    };
  }
}

export async function processPassengerJourneyNotifications({
  rideId,

  progress,
}: {
  rideId: string;

  progress: number;
}) {
  try {
    const safeProgress = Math.min(
      100,

      Math.max(0, Number(progress || 0)),
    );

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
          id,
          passenger_id,
          booking_status,
          boarding_verified,
          pickup_name,
          drop_name,
          pickup_route_progress,
          drop_route_progress,
          passenger_dropped_at
          `,
      )
      .eq("ride_id", rideId)
      .in("booking_status", ["confirmed", "completed"]);

    if (error) {
      throw error;
    }

    let processedEvents = 0;

    for (const booking of bookings || []) {
      const pickupProgress = Number(booking.pickup_route_progress || 0);

      const dropProgress = Number(booking.drop_route_progress || 100);

      /*
       * APPROACHING PICKUP
       *
       * Notify approximately 5% of total
       * route progress before passenger pickup.
       */

      const approachingPickupProgress = Math.max(0, pickupProgress - 5);

      if (
        !booking.boarding_verified &&
        safeProgress >= approachingPickupProgress &&
        safeProgress < pickupProgress
      ) {
        const result = await createJourneyNotification({
          userId: booking.passenger_id,

          rideId,

          bookingId: booking.id,

          type: "approaching_pickup",

          title: "Driver approaching",

          message: booking.pickup_name
            ? `Your driver is approaching ${booking.pickup_name}. Please be ready.`
            : "Your driver is approaching your pickup point. Please be ready.",

          data: {
            progress: safeProgress,

            pickup_progress: pickupProgress,

            pickup_name: booking.pickup_name,
          },
        });

        if (result.created) {
          processedEvents += 1;
        }
      }

      /*
       * PICKUP REACHED
       */

      if (!booking.boarding_verified && safeProgress >= pickupProgress) {
        const result = await createJourneyNotification({
          userId: booking.passenger_id,

          rideId,

          bookingId: booking.id,

          type: "pickup_reached",

          title: "Driver reached pickup",

          message:
            "Your driver has reached your pickup point. Share your boarding PIN after entering the vehicle.",

          data: {
            progress: safeProgress,

            pickup_progress: pickupProgress,

            pickup_name: booking.pickup_name,
          },
        });

        if (result.created) {
          processedEvents += 1;
        }
      }

      /*
       * APPROACHING DROP
       */

      const approachingDropProgress = Math.max(
        pickupProgress,

        dropProgress - 5,
      );

      if (
        booking.boarding_verified &&
        !booking.passenger_dropped_at &&
        safeProgress >= approachingDropProgress &&
        safeProgress < dropProgress
      ) {
        const result = await createJourneyNotification({
          userId: booking.passenger_id,

          rideId,

          bookingId: booking.id,

          type: "approaching_drop",

          title: "Approaching your drop",

          message: booking.drop_name
            ? `You are approaching ${booking.drop_name}.`
            : "You are approaching your drop point.",

          data: {
            progress: safeProgress,

            drop_progress: dropProgress,

            drop_name: booking.drop_name,
          },
        });

        if (result.created) {
          processedEvents += 1;
        }
      }

      /*
       * DROP REACHED
       */

      if (
        booking.boarding_verified &&
        !booking.passenger_dropped_at &&
        safeProgress >= dropProgress
      ) {
        const result = await createJourneyNotification({
          userId: booking.passenger_id,

          rideId,

          bookingId: booking.id,

          type: "drop_reached",

          title: "Drop point reached",

          message: "You have reached your selected drop point.",

          data: {
            progress: safeProgress,

            drop_progress: dropProgress,

            drop_name: booking.drop_name,
          },
        });

        if (result.created) {
          processedEvents += 1;
        }
      }
    }

    console.log("PASSENGER JOURNEY NOTIFICATIONS PROCESSED:", {
      rideId,

      progress: safeProgress,

      processedEvents,
    });

    return {
      success: true,

      processedEvents,

      error: null,
    };
  } catch (error) {
    console.log("PROCESS PASSENGER JOURNEY NOTIFICATIONS ERROR:", error);

    return {
      success: false,

      processedEvents: 0,

      error,
    };
  }
}

export async function getMyNotifications() {
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
    .from("user_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });
}

export async function getUnreadNotificationCount() {
  const {
    data: { user },

    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      count: 0,

      error: userError || new Error("User not authenticated"),
    };
  }

  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", {
      count: "exact",

      head: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return {
    count: count || 0,

    error,
  };
}

export async function markNotificationRead(notificationId: string) {
  return await supabase
    .from("user_notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead() {
  const {
    data: { user },

    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: userError || new Error("User not authenticated"),
    };
  }

  return await supabase
    .from("user_notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);
}

export function subscribeToMyNotifications(
  userId: string,

  onNotification: (notification: any) => void,
) {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      "postgres_changes",

      {
        event: "INSERT",

        schema: "public",

        table: "user_notifications",

        filter: `user_id=eq.${userId}`,
      },

      (payload) => {
        console.log("NEW JOURNEY NOTIFICATION:", payload.new);

        onNotification(payload.new);
      },
    )
    .subscribe((status) => {
      console.log("NOTIFICATION REALTIME:", status);
    });

  return channel;
}

export async function removeNotificationSubscription(channel: any) {
  if (!channel) {
    return;
  }

  await supabase.removeChannel(channel);
}
