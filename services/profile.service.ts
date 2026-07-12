import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
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
export async function uploadProfileImage(imageUrl: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error("Not authenticated"),
    };
  }

  return await supabase
    .from("profiles")
    .update({
      profile_image: imageUrl,
    })
    .eq("id", user.id);
}

export async function updateDriverStats() {
  return;
}

export async function updatePassengerStats() {
  return;
}

export async function pickAndUploadProfileImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return {
      data: null,
      error: new Error("Photo permission is required"),
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) {
    return {
      data: null,
      error: null,
    };
  }

  const asset = result.assets[0];

  if (!asset.base64) {
    return {
      data: null,
      error: new Error("Unable to read image"),
    };
  }

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

  const extension = asset.mimeType === "image/png" ? "png" : "jpg";

  const path = `profile-images/${user.id}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, decode(asset.base64), {
      contentType: asset.mimeType || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return {
      data: null,
      error: uploadError,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("documents")
    .getPublicUrl(path);

  const imageUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      profile_image: imageUrl,
    })
    .eq("id", user.id)
    .select()
    .single();

  return {
    data,
    error,
  };
}

export async function updateMyFullProfile({
  fullName,
  phone,
  gender,
  dateOfBirth,
}: {
  fullName: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
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
      date_of_birth: dateOfBirth,
    })
    .eq("id", user.id)
    .select()
    .single();
}
