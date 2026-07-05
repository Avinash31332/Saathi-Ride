import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../services/supabase";
import useGlobalEvents from "../../hooks/useGlobalEvents";

export default function HomeScreen() {
  const { setEvent } = useGlobalEvents();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace("/login");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Home Screen 🚗</Text>
      <Button
        title="Create Ride"
        onPress={() => router.push("/rides/create")}
      />
      <Button title="My Rides" onPress={() => router.push("/rides/my-rides")} />
      <Button
        title="Search Rides"
        onPress={() => router.push("/rides/search")}
      />
      <Button
        title="My Bookings"
        onPress={() => router.push("/bookings/my-bookings")}
      />
      <Button
        title="My Passengers"
        onPress={() => router.push("/rides/passengers")}
      />
      <Button title="My Cars" onPress={() => router.push("/profile/my-cars")} />
      <Button
        title="add car"
        onPress={() => router.push("/profile/add-vehicle")}
      />
      <Button title="Profile" onPress={() => router.push("/profile")} />
      <Button title="My Reviews" onPress={() => router.push("/rides/review")} />
      <Button
        title="Test Global Event"
        onPress={() => setEvent({ type: "rideCompletion" })}
      />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
