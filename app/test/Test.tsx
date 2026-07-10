import { useState } from "react";
import { View, Button, Text, ScrollView } from "react-native";

import { searchPlaces } from "../../services/maps/osm.service";
import { getRoute } from "../../services/maps/route.service";

export default function Test() {
  const [output, setOutput] = useState("");

  async function testPlaces() {
    try {
      const places = await searchPlaces("Hyderabad");

      console.log(places);

      setOutput(JSON.stringify(places, null, 2));
    } catch (e) {
      console.log(e);

      setOutput("Places Error");
    }
  }

  async function testRoute() {
    try {
      const route = await getRoute(
        {
          latitude: 17.385044,
          longitude: 78.486671,
        },
        {
          latitude: 17.4435,
          longitude: 78.3772,
        },
      );

      console.log(route);

      setOutput(JSON.stringify(route, null, 2));
    } catch (e) {
      console.log(e);

      setOutput("Route Error");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 80,
      }}
    >
      <Button title="Test Places" onPress={testPlaces} />

      <View style={{ height: 20 }} />

      <Button title="Test Route" onPress={testRoute} />

      <ScrollView
        style={{
          marginTop: 20,
        }}
      >
        <Text>{output}</Text>
      </ScrollView>
    </View>
  );
}
