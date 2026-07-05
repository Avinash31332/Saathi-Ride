import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Button } from "react-native";

import { supabase } from "../../services/supabase";
import { getMyRides } from "../../services/ride.service";
import { completeRide } from "../../services/driver.service";

export default function MyRidesScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();

    let channel: any;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`driver-rides-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rides",
            filter: `driver_id=eq.${user.id}`,
          },
          () => {
            console.log("Driver ride updated");

            loadRides();
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadRides = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getMyRides(user.id);

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
          <Text>
            {item.source} → {item.destination}
          </Text>

          <Text>Date: {item.ride_date}</Text>

          <Text>Time: {item.ride_time}</Text>

          <Text>Seats: {item.available_seats}</Text>

          <Text>₹{item.price}</Text>
          <Text>Status: {item.ride_status}</Text>
          {item.ride_status === "active" && (
            <Button
              title="Mark Ride Complete"
              onPress={async () => {
                try {
                  console.log("Completing ride:", item.id);

                  const result = await completeRide(item.id);

                  console.log(result);

                  loadRides();
                } catch (e) {
                  console.log("COMPLETE RIDE ERROR");
                  console.log(e);
                }
              }}
            />
          )}
        </View>
      )}
    />
  );
}
