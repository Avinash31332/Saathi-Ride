import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";

import { supabase } from "../../services/supabase";
import { addVehicle } from "../../services/vehicle.service";

export default function AddVehicleScreen() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await addVehicle({
      owner_id: user.id,

      vehicle_name: name,
      vehicle_number: number,
      vehicle_color: color,
      total_seats: Number(seats),
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Vehicle Added");
  };

  return (
    <View style={{ marginVertical: 40, marginHorizontal: 10 }}>
      <TextInput
        placeholder="Vehicle Name"
        value={name}
        onChangeText={setName}
        style={{ backgroundColor: "white", marginVertical: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Vehicle Number"
        value={number}
        onChangeText={setNumber}
        style={{ backgroundColor: "white", marginVertical: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Vehicle Color"
        value={color}
        onChangeText={setColor}
        style={{ backgroundColor: "white", marginVertical: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Seats"
        value={seats}
        onChangeText={setSeats}
        style={{ backgroundColor: "white", marginVertical: 10, padding: 10 }}
      />

      <Button title="Save Vehicle" onPress={handleSave} />
    </View>
  );
}
