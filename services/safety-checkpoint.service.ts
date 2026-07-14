import { supabase } from "./supabase";

const SAFETY_CHECKPOINTS = [25, 50, 75, 100];

function getCheckpointEventType(checkpoint: number) {
  if (checkpoint === 100) {
    return "destination_reached";
  }

  return `checkpoint_${checkpoint}`;
}

async function invokeSafetyAlertProcessor() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "process-safety-alerts",
      {
        body: {},
      },
    );

    if (error) {
      console.log("SAFETY ALERT PROCESSOR INVOKE ERROR:", error);

      return {
        success: false,
        data: null,
        error,
      };
    }

    console.log("SAFETY ALERT PROCESSOR INVOKED:", data);

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.log("SAFETY ALERT PROCESSOR EXCEPTION:", error);

    return {
      success: false,
      data: null,
      error,
    };
  }
}

async function createSafetyAlertQueue({
  safetyEventId,

  rideId,

  passengerId,

  alertType,

  checkpoint,

  latitude,

  longitude,
}: {
  safetyEventId: string;

  rideId: string;

  passengerId: string;

  alertType: string;

  checkpoint: number;

  latitude: number;

  longitude: number;
}) {
  /*
   * LOAD TRUSTED CONTACTS
   */

  const { data: trustedContacts, error: contactsError } = await supabase
    .from("trusted_contacts")
    .select(
      `
      id,
      name,
      phone,
      relationship
      `,
    )
    .eq("user_id", passengerId);

  if (contactsError) {
    throw contactsError;
  }

  if (!trustedContacts || trustedContacts.length === 0) {
    console.log("SAFETY ALERT QUEUE: NO TRUSTED CONTACTS", {
      rideId,
      passengerId,
      alertType,
    });

    return {
      queued: 0,
    };
  }

  /*
   * PREVENT DUPLICATE QUEUE ROWS
   */

  const { data: existingQueueRows, error: existingQueueError } = await supabase
    .from("safety_alert_queue")
    .select(
      `
      trusted_contact_id
      `,
    )
    .eq("safety_event_id", safetyEventId);

  if (existingQueueError) {
    throw existingQueueError;
  }

  const existingContactIds = new Set(
    (existingQueueRows || []).map((row: any) => row.trusted_contact_id),
  );

  const contactsToQueue = trustedContacts.filter(
    (contact: any) => !existingContactIds.has(contact.id),
  );

  if (contactsToQueue.length === 0) {
    console.log("SAFETY ALERT QUEUE ALREADY CREATED:", {
      safetyEventId,
      passengerId,
    });

    return {
      queued: 0,
    };
  }

  /*
   * CREATE QUEUE ROWS
   */

  const queueRows = contactsToQueue.map((contact: any) => ({
    safety_event_id: safetyEventId,

    ride_id: rideId,

    passenger_id: passengerId,

    trusted_contact_id: contact.id,

    alert_type: alertType,

    alert_data: {
      checkpoint,

      progress_percentage: checkpoint,

      latitude,

      longitude,

      trusted_contact_name: contact.name,

      trusted_contact_phone: contact.phone,

      trusted_contact_relationship: contact.relationship,
    },

    delivery_status: "pending",

    attempt_count: 0,
  }));

  const { error: queueError } = await supabase
    .from("safety_alert_queue")
    .insert(queueRows);

  if (queueError) {
    throw queueError;
  }

  console.log("SAFETY ALERT QUEUE CREATED:", {
    rideId,

    passengerId,

    safetyEventId,

    alertType,

    queued: queueRows.length,
  });

  return {
    queued: queueRows.length,
  };
}

export async function processSafetyCheckpoint({
  rideId,

  checkpoint,

  latitude,

  longitude,
}: {
  rideId: string;

  checkpoint: number;

  latitude: number;

  longitude: number;
}) {
  if (!SAFETY_CHECKPOINTS.includes(checkpoint)) {
    return {
      processed: false,

      reason: "invalid_checkpoint",

      error: null,
    };
  }

  try {
    /*
     * LOAD ACTIVE SAFETY SESSIONS
     */

    const { data: sessions, error: sessionError } = await supabase
      .from("safety_sessions")
      .select(
        `
        id,
        passenger_id,
        booking_id,
        last_checkpoint,
        safety_status,
        safety_mode_enabled
        `,
      )
      .eq("ride_id", rideId)
      .eq("safety_status", "active")
      .eq("safety_mode_enabled", true);

    if (sessionError) {
      throw sessionError;
    }

    if (!sessions || sessions.length === 0) {
      console.log("SAFETY CHECKPOINT: NO ACTIVE SESSIONS", {
        rideId,

        checkpoint,
      });

      return {
        processed: false,

        reason: "no_active_sessions",

        error: null,
      };
    }

    let processedSessions = 0;

    let queuedAlerts = 0;

    /*
     * PROCESS PASSENGER SAFETY SESSIONS
     */

    for (const session of sessions) {
      const lastCheckpoint = Number(session.last_checkpoint || 0);

      if (checkpoint <= lastCheckpoint) {
        console.log("SAFETY CHECKPOINT ALREADY PROCESSED:", {
          rideId,

          passengerId: session.passenger_id,

          checkpoint,

          lastCheckpoint,
        });

        continue;
      }

      const eventType = getCheckpointEventType(checkpoint);

      /*
       * FIND EXISTING EVENT
       */

      const { data: existingEvent, error: existingEventError } = await supabase
        .from("ride_safety_events")
        .select("id")
        .eq("ride_id", rideId)
        .eq("passenger_id", session.passenger_id)
        .eq("event_type", eventType)
        .maybeSingle();

      if (existingEventError) {
        throw existingEventError;
      }

      let safetyEventId = existingEvent?.id || null;

      /*
       * CREATE SAFETY EVENT
       */

      if (!safetyEventId) {
        const { data: createdEvent, error: eventError } = await supabase
          .from("ride_safety_events")
          .insert({
            ride_id: rideId,

            passenger_id: session.passenger_id,

            event_type: eventType,

            progress_percentage: checkpoint,

            lat: latitude,

            lng: longitude,
          })
          .select("id")
          .single();

        if (eventError) {
          throw eventError;
        }

        safetyEventId = createdEvent.id;

        console.log("SAFETY CHECKPOINT EVENT CREATED:", {
          rideId,

          passengerId: session.passenger_id,

          checkpoint,

          eventType,

          safetyEventId,
        });
      }

      /*
       * CREATE ALERT QUEUE
       */

      const queueResult = await createSafetyAlertQueue({
        safetyEventId,

        rideId,

        passengerId: session.passenger_id,

        alertType: eventType,

        checkpoint,

        latitude,

        longitude,
      });

      queuedAlerts += queueResult.queued;

      /*
       * UPDATE SAFETY SESSION
       */

      const sessionUpdate: Record<string, any> = {
        last_checkpoint: checkpoint,
      };

      if (checkpoint === 100) {
        sessionUpdate.safety_status = "completed";

        sessionUpdate.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("safety_sessions")
        .update(sessionUpdate)
        .eq("id", session.id);

      if (updateError) {
        throw updateError;
      }

      processedSessions += 1;
    }

    /*
     * PROCESS ALERT QUEUE
     *
     * Only invoke Edge Function if new queue
     * rows were actually created.
     */

    if (queuedAlerts > 0) {
      await invokeSafetyAlertProcessor();
    }

    console.log("SAFETY CHECKPOINT COMPLETE:", {
      rideId,

      checkpoint,

      processedSessions,

      queuedAlerts,
    });

    return {
      processed: processedSessions > 0,

      reason:
        processedSessions > 0 ? "checkpoint_processed" : "already_processed",

      processedSessions,

      queuedAlerts,

      error: null,
    };
  } catch (error) {
    console.log("PROCESS SAFETY CHECKPOINT ERROR:", error);

    return {
      processed: false,

      reason: "error",

      processedSessions: 0,

      queuedAlerts: 0,

      error,
    };
  }
}
