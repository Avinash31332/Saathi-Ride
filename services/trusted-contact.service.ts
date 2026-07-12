import { supabase } from "./supabase";

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
}

export async function getTrustedContacts() {
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
    .from("trusted_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: true,
    });
}

export async function addTrustedContact({
  name,
  phone,
  relationship,
}: {
  name: string;
  phone: string;
  relationship?: string;
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
    .from("trusted_contacts")
    .insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim() || null,
    })
    .select()
    .single();
}

export async function updateTrustedContact(
  contactId: string,
  {
    name,
    phone,
    relationship,
  }: {
    name: string;
    phone: string;
    relationship?: string;
  },
) {
  return await supabase
    .from("trusted_contacts")
    .update({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim() || null,
    })
    .eq("id", contactId)
    .select()
    .single();
}

export async function deleteTrustedContact(contactId: string) {
  return await supabase.from("trusted_contacts").delete().eq("id", contactId);
}
