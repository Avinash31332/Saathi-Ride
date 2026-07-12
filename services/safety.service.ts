import { supabase } from "./supabase";

export type SafetyStatus = "waiting" | "active" | "completed" | "sos";

export interface SafetySession {
  id: string;
  ride_id: string;
  booking_id: string;
  passenger_id: string;
  safety_mode_enabled: boolean;
  safety_status: SafetyStatus;
  vehicle_entered_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_checkpoint: number;
  route_deviation_detected: boolean;
  sos_triggered: boolean;
  sos_triggered_at: string | null;
  created_at: string;
}

export async function getSafetySession(bookingId: string) {
  return await supabase
    .from("safety_sessions")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();
}

export async function activateSafetyMode(bookingId: string) {
  return await supabase.rpc("activate_passenger_safety", {
    p_booking_id: bookingId,
  });
}

export async function triggerSafetySOS(
  bookingId: string,
  latitude: number,
  longitude: number,
) {
  return await supabase.rpc("trigger_safety_sos", {
    p_booking_id: bookingId,
    p_lat: latitude,
    p_lng: longitude,
  });
}

export async function getSafetyAlertDetails(bookingId: string) {
  return await supabase
    .from("bookings")
    .select(
      `
      id,
      ride_id,
      rides (
        id,
        source,
        destination,
        driver_id,
        vehicles (
          vehicle_name,
          vehicle_number,
          vehicle_color
        )
      )
    `,
    )
    .eq("id", bookingId)
    .single();
}

export async function subscribeToSafetySession(
  bookingId: string,
  onUpdate: (session: SafetySession) => void,
) {
  const channel = supabase
    .channel(`safety-session-${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "safety_sessions",
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        console.log("Safety session updated:", payload.eventType);

        if (payload.new) {
          onUpdate(payload.new as SafetySession);
        }
      },
    )
    .subscribe((status) => {
      console.log("Safety Realtime:", status);
    });

  return channel;
}

export async function removeSafetySubscription(channel: any) {
  if (!channel) return;

  await supabase.removeChannel(channel);
}
