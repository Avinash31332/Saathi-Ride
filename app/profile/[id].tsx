import { View, Text, ActivityIndicator, ScrollView } from "react-native";

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  getDriverProfile,
  getDriverVehicles,
} from "../../services/driver.service";

export default function DriverProfile() {
  const { id } = useLocalSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriver();
  }, []);

  const loadDriver = async () => {
    try {
      const { data } = await getDriverProfile(id as string);

      const vehiclesResult = await getDriverVehicles(id as string);

      setProfile(data);

      setVehicles(vehiclesResult.data || []);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Driver not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
          marginBottom: 15,
        }}
      >
        Driver Profile
      </Text>

      <Text>Name: {profile.full_name || "Not Provided"}</Text>

      <Text>Phone: {profile.phone || "Not Provided"}</Text>

      <Text>⭐ Rating: {Number(profile.rating || 0).toFixed(1)}</Text>

      <Text>Reviews: {profile.total_reviews || 0}</Text>

      <Text>Completed Rides: {profile.total_rides || 0}</Text>

      <Text>
        Verification Status: {profile.verification_status || "Not Verified"}
      </Text>

      <Text
        style={{
          marginTop: 25,
          marginBottom: 10,
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        Vehicles
      </Text>

      {vehicles.length === 0 ? (
        <Text>No vehicles added</Text>
      ) : (
        vehicles.map((vehicle) => (
          <View
            key={vehicle.id}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text>{vehicle.vehicle_name}</Text>

            <Text>{vehicle.vehicle_number}</Text>

            <Text>Seats: {vehicle.total_seats}</Text>

            <Text>Color: {vehicle.vehicle_color}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
