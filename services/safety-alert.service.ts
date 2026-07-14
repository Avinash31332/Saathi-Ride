import { supabase } from "./supabase";

export type SafetyAlertDeliveryStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed";

export interface SafetyAlertQueueItem {
  id: string;

  safety_event_id: string;

  ride_id: string;

  passenger_id: string;

  trusted_contact_id: string;

  alert_type: string;

  alert_data: Record<string, any>;

  delivery_status: SafetyAlertDeliveryStatus;

  attempt_count: number;

  last_attempt_at: string | null;

  delivered_at: string | null;

  error_message: string | null;

  created_at: string;
}

export interface SafetyAlertQueueItemWithContact extends SafetyAlertQueueItem {
  trusted_contacts: {
    id: string;

    name: string;

    phone: string;

    relationship: string | null;
  } | null;
}

/*
 * LOAD CURRENT USER ALERT QUEUE
 */

export async function getMySafetyAlertQueue({
  rideId,
  limit = 50,
}: {
  rideId?: string;

  limit?: number;
} = {}) {
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

  let query = supabase
    .from("safety_alert_queue")
    .select(
      `
      *,
      trusted_contacts (
        id,
        name,
        phone,
        relationship
      )
      `,
    )
    .eq("passenger_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (rideId) {
    query = query.eq("ride_id", rideId);
  }

  const { data, error } = await query;

  if (error) {
    console.log("GET SAFETY ALERT QUEUE ERROR:", error);

    return {
      data: null,

      error,
    };
  }

  return {
    data: (data as SafetyAlertQueueItemWithContact[]) || [],

    error: null,
  };
}

/*
 * LOAD PENDING ALERT COUNT
 *
 * Useful for:
 * - safety screen
 * - debugging
 * - admin monitoring later
 */

export async function getMyPendingSafetyAlertCount(rideId?: string) {
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

  let query = supabase
    .from("safety_alert_queue")
    .select("*", {
      count: "exact",

      head: true,
    })
    .eq("passenger_id", user.id)
    .eq("delivery_status", "pending");

  if (rideId) {
    query = query.eq("ride_id", rideId);
  }

  const { count, error } = await query;

  if (error) {
    console.log("GET PENDING SAFETY ALERT COUNT ERROR:", error);
  }

  return {
    count: count || 0,

    error,
  };
}

/*
 * LOAD SAFETY EVENTS
 */

export async function getRideSafetyEvents({
  rideId,
  passengerId,
}: {
  rideId: string;

  passengerId?: string;
}) {
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

  let query = supabase
    .from("ride_safety_events")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", {
      ascending: true,
    });

  query = query.eq("passenger_id", passengerId || user.id);

  const { data, error } = await query;

  if (error) {
    console.log("GET RIDE SAFETY EVENTS ERROR:", error);

    return {
      data: null,

      error,
    };
  }

  return {
    data: data || [],

    error: null,
  };
}

/*
 * SUBSCRIBE TO SAFETY EVENTS
 */

export function subscribeToRideSafetyEvents({
  rideId,
  passengerId,
  onEvent,
}: {
  rideId: string;

  passengerId: string;

  onEvent: (event: any) => void;
}) {
  const channel = supabase
    .channel(`ride-safety-events-${rideId}-${passengerId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",

        schema: "public",

        table: "ride_safety_events",

        filter: `ride_id=eq.${rideId}`,
      },

      (payload) => {
        const safetyEvent = payload.new;

        if (safetyEvent.passenger_id !== passengerId) {
          return;
        }

        console.log("SAFETY EVENT RECEIVED:", safetyEvent);

        onEvent(safetyEvent);
      },
    )
    .subscribe((status) => {
      console.log("SAFETY EVENTS REALTIME:", status);
    });

  return channel;
}

/*
 * SUBSCRIBE TO ALERT QUEUE
 *
 * This is mostly useful while developing.
 *
 * The actual alert sender will run
 * server-side.
 */

export function subscribeToSafetyAlertQueue({
  rideId,
  passengerId,
  onChange,
}: {
  rideId: string;

  passengerId: string;

  onChange: (item: any) => void;
}) {
  const channel = supabase
    .channel(`safety-alert-queue-${rideId}-${passengerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",

        schema: "public",

        table: "safety_alert_queue",

        filter: `ride_id=eq.${rideId}`,
      },

      (payload) => {
        const queueItem = (payload.new ||
          payload.old) as SafetyAlertQueueItem | null;

        if (queueItem?.passenger_id !== passengerId) {
          return;
        }

        console.log("SAFETY ALERT QUEUE UPDATED:", queueItem);

        onChange(queueItem);
      },
    )
    .subscribe((status) => {
      console.log("SAFETY ALERT QUEUE REALTIME:", status);
    });

  return channel;
}

/*
 * REMOVE REALTIME SUBSCRIPTION
 */

export async function removeSafetySubscription(channel: any) {
  if (!channel) {
    return;
  }

  await supabase.removeChannel(channel);
}
