import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator } from "react-native";

import { supabase } from "../../services/supabase";
import { getRidePassengers } from "../../services/driver.service";

export default function PassengersScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getRidePassengers(user.id);

    setRides(data || []);
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View
          style={{
            borderWidth: 1,
            margin: 10,
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {item.source} → {item.destination}
          </Text>

          <Text>{item.ride_date}</Text>

          <Text>{item.ride_time}</Text>

          <Text
            style={{
              marginTop: 10,
              fontWeight: "bold",
            }}
          >
            Passengers
          </Text>

          {item.bookings?.map((booking: any) => (
            <View
              key={booking.id}
              style={{
                marginTop: 8,
              }}
            >
              <Text>{booking.profiles?.full_name}</Text>

              <Text>{booking.profiles?.phone}</Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}
