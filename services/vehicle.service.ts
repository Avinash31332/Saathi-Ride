import { supabase } from "./supabase";

export async function getMyVehicles(
  userId: string
) {
  return await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId);
}

export async function getVehicleById(
  vehicleId: string
) {
  return await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single();
}

export async function addVehicle(
  vehicleData: any
) {
  return await supabase
    .from("vehicles")
    .insert([vehicleData]);
}

export async function deleteVehicle(
  vehicleId: string
) {
  return await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId);
}