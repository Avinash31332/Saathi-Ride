import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";

interface Props {
  pickup: any;
  destination: any;
  route?: any;
}

export default function RouteMap({ pickup, destination, route }: Props) {
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pickup && destination) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [pickup, destination]);

  useEffect(() => {
    if (pickup && destination && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        },
      );
    }
  }, [pickup, destination, route]);

  if (!pickup || !destination) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: (pickup.latitude + destination.latitude) / 2,
          longitude: (pickup.longitude + destination.longitude) / 2,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        <Marker
          coordinate={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          }}
          title="Pickup"
        >
          <Ionicons name="ellipse" size={16} color={colors.primary} />
        </Marker>

        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Destination"
        >
          <Ionicons name="location" size={26} color={colors.danger} />
        </Marker>

        {route && (
          <Polyline
            coordinates={route.coordinates}
            strokeWidth={5}
            strokeColor={colors.primary}
          />
        )}
      </MapView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 300,
    borderRadius: radius.lg,
    marginTop: 20,
    overflow: "hidden",
  },
});
