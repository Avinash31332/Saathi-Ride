import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export async function pickProfileImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled) return null;

  return result.assets[0];
}

export async function uploadProfileImage(asset: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const response = await fetch(asset.uri);

  const blob = await response.blob();

  const reader = new FileReader();

  return new Promise(async (resolve) => {
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      const path = `${user.id}.jpg`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(path, decode(base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        resolve(null);
        return;
      }

      const { data } = supabase.storage.from("documents").getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({
          profile_image: data.publicUrl,
        })
        .eq("id", user.id);

      resolve(data.publicUrl);
    };

    reader.readAsDataURL(blob);
  });
}
