import { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";

import { supabase } from "../../services/supabase";
import { bookRide } from "../../services/booking.service";
import { getAvailableSeats } from "../../services/seat.service";

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [availableSeats, setAvailableSeats] = useState(0);

  const [seatCount, setSeatCount] = useState("1");

  useEffect(() => {
    loadRide();
  }, []);

  const loadRide = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select(
        `
        *,
        profiles (
          full_name,
          phone
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    const seats = await getAvailableSeats(data.id);

    setAvailableSeats(seats);

    setRide(data);

    setLoading(false);
  };

  const handleBookRide = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Please login");
      return;
    }

    const { error } = await bookRide(ride.id, user.id, Number(seatCount));

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Ride booked successfully");

    loadRide();
  };

  if (loading) {
    return <ActivityIndicator />;
  }

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
          marginBottom: 10,
        }}
      >
        {ride.source} → {ride.destination}
      </Text>

      <Text>Date: {ride.ride_date}</Text>

      <Text>Time: {ride.ride_time}</Text>

      <Text>Price: ₹{ride.price}</Text>

      <Text>Available Seats: {availableSeats}</Text>

      <Text
        style={{
          marginTop: 10,
        }}
      >
        Driver: {ride?.profiles?.full_name || "Unknown"}
      </Text>

      <Text>Phone: {ride?.profiles?.phone || "Not Available"}</Text>

      <Text
        style={{
          marginTop: 20,
        }}
      >
        Seats Required
      </Text>

      <Picker
        selectedValue={seatCount}
        onValueChange={(value) => setSeatCount(value)}
      >
        <Picker.Item label="1 Seat" value="1" />

        <Picker.Item label="2 Seats" value="2" />

        <Picker.Item label="3 Seats" value="3" />

        <Picker.Item label="4 Seats" value="4" />
      </Picker>

      <Button title="Book Seats" onPress={handleBookRide} />
    </View>
  );
}
