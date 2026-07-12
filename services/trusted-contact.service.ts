import { supabase } from "./supabase";

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    user,
    error,
  };
}

export async function getTrustedContacts() {
  const { user, error: userError } = await getAuthenticatedUser();

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
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length !== 10) {
    return {
      data: null,
      error: new Error("Enter a valid 10 digit phone number"),
    };
  }

  const { count, error: countError } = await supabase
    .from("trusted_contacts")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id);

  if (countError) {
    return {
      data: null,
      error: countError,
    };
  }

  if ((count ?? 0) >= 3) {
    return {
      data: null,
      error: new Error("Maximum 3 trusted contacts allowed"),
    };
  }

  return await supabase
    .from("trusted_contacts")
    .insert({
      user_id: user.id,
      name: name.trim(),
      phone: cleanPhone,
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
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length !== 10) {
    return {
      data: null,
      error: new Error("Enter a valid 10 digit phone number"),
    };
  }

  return await supabase
    .from("trusted_contacts")
    .update({
      name: name.trim(),
      phone: cleanPhone,
      relationship: relationship?.trim() || null,
    })
    .eq("id", contactId)
    .eq("user_id", user.id)
    .select()
    .single();
}

export async function deleteTrustedContact(contactId: string) {
  const { user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("Not authenticated"),
    };
  }

  return await supabase
    .from("trusted_contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id);
}
