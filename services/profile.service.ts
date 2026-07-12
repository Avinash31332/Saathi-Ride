import { supabase } from "./supabase";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export async function getMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  return await supabase.from("profiles").select("*").eq("id", user.id).single();
}

export async function getUserProfile(userId: string) {
  return await supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function updateMyProfile({
  fullName,
  phone,
  gender,
}: {
  fullName: string;
  phone: string;
  gender: Gender;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  return await supabase
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      phone: phone.trim(),
      gender,
    })
    .eq("id", user.id)
    .select()
    .single();
}
