import { useEffect, useState } from "react";
import { FlatList, View, Text, Button } from "react-native";

import { router } from "expo-router";

import { supabase } from "../../services/supabase";
import { getMyVehicles, deleteVehicle } from "../../services/vehicle.service";

export default function MyCarsScreen() {
  const [cars, setCars] = useState<any[]>([]);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getMyVehicles(user.id);

    setCars(data || []);
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);

    loadCars();
  };

  return (
    <View style={{ flex: 1, marginVertical: 40, marginHorizontal: 10 }}>
      <Button
        title="Add Vehicle"
        onPress={() => router.push("/profile/add-vehicle")}
      />

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              margin: 10,
              padding: 15,
            }}
          >
            <Text>{item.vehicle_name}</Text>

            <Text>{item.vehicle_number}</Text>

            <Text>Seats: {item.total_seats}</Text>

            <Button title="Delete" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </View>
  );
}
