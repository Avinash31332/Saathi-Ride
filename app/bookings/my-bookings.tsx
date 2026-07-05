import { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Button,
  Alert,
} from "react-native";

import { router } from "expo-router";

import { supabase } from "../../services/supabase";
import {
  getMyBookings,
  cancelBooking,
  confirmRideCompletion,
} from "../../services/booking.service";

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getMyBookings(user.id);

    setBookings(data || []);
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      {
        text: "No",
      },
      {
        text: "Yes",
        onPress: async () => {
          const { error } = await cancelBooking(bookingId);

          if (error) {
            Alert.alert(error.message);
            return;
          }

          loadBookings();
        },
      },
    ]);
  };

  const handleConfirmRide = async (bookingId: string) => {
    const { error } = await confirmRideCompletion(bookingId);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Ride confirmed");

    loadBookings();
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/rides/${item.ride_id}`)}>
          <View
            style={{
              borderWidth: 1,
              margin: 10,
              padding: 15,
              borderRadius: 10,
            }}
          >
            <Text>
              {item.rides.source} → {item.rides.destination}
            </Text>
            <Text>Date: {item.rides.ride_date}</Text>
            <Text>Time: {item.rides.ride_time}</Text>
            <Text>₹{item.rides.price}</Text>
            <Text>Status: {item.booking_status}</Text>{" "}
            {item.rides.ride_status === "awaiting_confirmation" &&
              item.booking_status === "confirmed" &&
              !item.ride_completion_confirmed && (
                <Button
                  title="Confirm Ride Completed"
                  onPress={() => handleConfirmRide(item.id)}
                />
              )}
            {item.booking_status !== "cancelled" && (
              <Button
                title="Cancel Booking"
                onPress={() => handleCancelBooking(item.id)}
              />
            )}
            {item.rides.ride_status === "completed" && (
              <Button
                title="Review Driver"
                onPress={() =>
                  router.push({
                    pathname: "/bookings/review",
                    params: {
                      rideId: item.rides.id,
                      driverId: item.rides.driver_id,
                    },
                  })
                }
              />
            )}
          </View>
        </Pressable>
      )}
    />
  );
}
