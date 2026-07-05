import { useState } from "react";
import {
  Pressable,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
} from "react-native";
import { getAvailableSeats } from "../../services/seat.service";

import { searchRides } from "../../services/ride.service";
import { router } from "expo-router";

export default function SearchRideScreen() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [rides, setRides] = useState<any[]>([]);

  const handleSearch = async () => {
    const { data, error } = await searchRides(source, destination);

    if (error) {
      console.log(error);
      return;
    }

    const ridesWithSeats = await Promise.all(
      (data || []).map(async (ride) => {
        const seats = await getAvailableSeats(ride.id);

        return {
          ...ride,
          currentAvailableSeats: seats,
        };
      }),
    );

    setRides(ridesWithSeats);
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          marginBottom: 20,
        }}
      >
        Search Ride
      </Text>

      <TextInput
        placeholder="Source"
        value={source}
        onChangeText={setSource}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
        }}
      />

      <TextInput
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
        }}
      />

      <Button title="Search" onPress={handleSearch} />

      <FlatList
        style={{
          marginTop: 20,
        }}
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/rides/[id]",
                params: { id: item.id },
              })
            }
          >
            <View
              style={{
                borderWidth: 1,
                padding: 15,
                marginBottom: 10,
                borderRadius: 10,
              }}
            >
              <Text>
                {item.source} → {item.destination}
              </Text>

              <Text>Date: {item.ride_date}</Text>

              <Text>Time: {item.ride_time}</Text>

              <Text>Available Seats: {item.currentAvailableSeats}</Text>
              <Text>Price: ₹{item.price}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
