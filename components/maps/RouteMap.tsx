import { Ionicons } from "@expo/vector-icons";

import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
} from "@maplibre/maplibre-react-native";

import React, { useEffect, useMemo, useRef } from "react";

import { Animated, StyleSheet, View } from "react-native";

import { colors, radius, shadow } from "../../constants/theme";

interface MapPlace {
  latitude: number;
  longitude: number;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface RouteData {
  coordinates?: RouteCoordinate[];
}

interface Props {
  pickup: MapPlace | null;

  destination: MapPlace | null;

  route?: RouteData | null;
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function RouteMap({ pickup, destination, route }: Props) {
  const cameraRef = useRef<CameraRef>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const routeCoordinates = useMemo(
    () => route?.coordinates ?? [],
    // depend on route.coordinates reference to avoid changing every render
    [route?.coordinates],
  );

  /*
   * ROUTE GEOJSON
   */

  const routeShape = useMemo(() => {
    if (routeCoordinates.length < 2) {
      return null;
    }

    return {
      type: "Feature" as const,

      properties: {},

      geometry: {
        type: "LineString" as const,

        coordinates: routeCoordinates.map((coordinate) => [
          coordinate.longitude,
          coordinate.latitude,
        ]),
      },
    };
  }, [routeCoordinates]);

  /*
   * MAP FADE
   */

  useEffect(() => {
    if (!pickup || !destination) {
      fadeAnim.setValue(0);

      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,

      duration: 350,

      useNativeDriver: true,
    }).start();
  }, [pickup, destination, fadeAnim]);

  /*
   * FIT CAMERA TO ROUTE
   */

  useEffect(() => {
    if (!pickup || !destination) {
      return;
    }

    const timer = setTimeout(() => {
      const coordinates =
        routeCoordinates.length >= 2 ? routeCoordinates : [pickup, destination];

      const longitudes = coordinates.map((coordinate) => coordinate.longitude);

      const latitudes = coordinates.map((coordinate) => coordinate.latitude);

      const west = Math.min(...longitudes);

      const east = Math.max(...longitudes);

      const south = Math.min(...latitudes);

      const north = Math.max(...latitudes);

      cameraRef.current?.fitBounds([west, south, east, north], {
        padding: {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        },
        duration: 600,
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [pickup, destination, routeCoordinates]);

  if (!pickup || !destination) {
    return null;
  }

  const centerCoordinate: [number, number] = [
    (pickup.longitude + destination.longitude) / 2,

    (pickup.latitude + destination.latitude) / 2,
  ];

  return (
    <Animated.View
      style={[
        styles.container,

        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Map style={styles.map} mapStyle={MAP_STYLE}>
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: centerCoordinate,
            zoom: 8,
          }}
        />

        {routeShape && (
          <GeoJSONSource id="saathi-route-source" data={routeShape}>
            <Layer
              id="saathi-route-outline"
              type="line"
              paint={{
                "line-color": "rgba(30, 64, 175, 0.20)",

                "line-width": 9,
              }}
              layout={{
                "line-cap": "round",

                "line-join": "round",
              }}
            />

            <Layer
              id="saathi-route-line"
              type="line"
              paint={{
                "line-color": colors.primary,

                "line-width": 5,
              }}
              layout={{
                "line-cap": "round",

                "line-join": "round",
              }}
            />
          </GeoJSONSource>
        )}

        <Marker
          id="saathi-pickup-marker"
          lngLat={[pickup.longitude, pickup.latitude]}
          anchor="center"
        >
          <View collapsable={false} style={styles.pickupMarker}>
            <View style={styles.pickupDot} />
          </View>
        </Marker>

        <Marker
          id="saathi-destination-marker"
          lngLat={[destination.longitude, destination.latitude]}
          anchor="bottom"
        >
          <View collapsable={false} style={styles.destinationMarker}>
            <View style={styles.destinationIcon}>
              <Ionicons name="location" size={30} color={colors.danger} />
            </View>
          </View>
        </Marker>
      </Map>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,

    marginTop: 20,

    borderRadius: radius.lg,

    overflow: "hidden",

    backgroundColor: colors.surfaceMuted,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadow.card,
  },

  map: {
    flex: 1,
  },

  pickupMarker: {
    width: 30,

    height: 30,

    borderRadius: 15,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 3,

    borderColor: colors.primary,
  },

  pickupDot: {
    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor: colors.primary,
  },

  destinationMarker: {
    width: 40,

    height: 42,

    alignItems: "center",

    justifyContent: "flex-end",
  },

  destinationIcon: {
    alignItems: "center",

    justifyContent: "center",
  },
});
