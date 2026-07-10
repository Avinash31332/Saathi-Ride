import { View, Text } from "react-native";

import { useState } from "react";

import PlaceSearch from "../../components/maps/PlaceSearch";

export default function PlaceSearchTest() {
  const [pickup, setPickup] = useState<any>(null);

  const [destination, setDestination] = useState<any>(null);

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 60,
      }}
    >
      <PlaceSearch placeholder="Pickup" onPlaceSelected={setPickup} />

      <View
        style={{
          height: 20,
        }}
      />

      <PlaceSearch placeholder="Destination" onPlaceSelected={setDestination} />

      <View
        style={{
          marginTop: 30,
        }}
      >
        <Text>Pickup</Text>

        <Text>{pickup?.name}</Text>

        <Text
          style={{
            marginTop: 20,
          }}
        >
          Destination
        </Text>

        <Text>{destination?.name}</Text>
      </View>
    </View>
  );
}
