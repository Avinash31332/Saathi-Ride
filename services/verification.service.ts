import * as DocumentPicker from "expo-document-picker";
import { supabase } from "./supabase";

export type VerificationDocumentType = "aadhaar" | "driving-license";

export async function pickVerificationDocument() {
  return await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
    multiple: false,
  });
}

export async function uploadVerificationDocument(
  type: VerificationDocumentType,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError || new Error("Not authenticated");
  }

  const result = await pickVerificationDocument();

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const extension =
    asset.name?.split(".").pop()?.toLowerCase() ||
    (asset.mimeType === "application/pdf" ? "pdf" : "jpg");

  const path = `${user.id}/${type}/document.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(path, arrayBuffer, {
      contentType: asset.mimeType || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const profileColumn =
    type === "aadhaar" ? "aadhaar_url" : "driving_license_url";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      [profileColumn]: path,
      driver_verification_status: "pending",
      verification_status: "pending",
    })
    .eq("id", user.id);

  if (profileError) {
    throw profileError;
  }

  return path;
}

export async function submitDriverVerification() {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("aadhaar_url, driving_license_url")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      data: null,
      error: profileError,
    };
  }

  if (!profile?.aadhaar_url || !profile?.driving_license_url) {
    return {
      data: null,
      error: new Error("Upload Aadhaar and driving license before submitting."),
    };
  }

  return await supabase
    .from("profiles")
    .update({
      driver_verification_status: "pending",
      verification_status: "pending",
    })
    .eq("id", user.id)
    .select()
    .single();
}
