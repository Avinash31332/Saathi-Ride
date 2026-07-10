import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import PlaceSearch from "../../components/maps/PlaceSearch";
import RouteMap from "../../components/maps/RouteMap";
import { getRoute } from "../../services/maps/route.service";

export default function RoutePreviewTest() {
  const [pickup, setPickup] = useState<any>();
  const [destination, setDestination] = useState<any>();
  const [route, setRoute] = useState<any>();

  async function loadRoute(start: any, end: any) {
    const result = await getRoute(start, end);
    setRoute(result);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        <PlaceSearch
          placeholder="Pickup"
          onPlaceSelected={(place) => {
            setPickup(place);

            if (destination) {
              loadRoute(place, destination);
            }
          }}
        />

        <View style={{ height: 15 }} />

        <PlaceSearch
          placeholder="Destination"
          onPlaceSelected={(place) => {
            setDestination(place);

            if (pickup) {
              loadRoute(pickup, place);
            }
          }}
        />

        <RouteMap pickup={pickup} destination={destination} route={route} />

        {route && (
          <View style={{ marginTop: 20 }}>
            <Text>Distance: {route.distanceKm.toFixed(1)} km</Text>

            <Text>ETA: {route.durationMinutes.toFixed(0)} mins</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
