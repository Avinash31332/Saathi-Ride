import { supabase } from "./supabase";

export async function getJourneyPassenger(passengerId: string) {
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

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone,
      profile_image
      `,
    )
    .eq("id", passengerId)
    .maybeSingle();

  return {
    data,
    error,
  };
}
