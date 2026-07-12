import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import * as Location from "expo-location";

import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { processRideCheckpoint } from "@/services/ride-tracking.service";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";
import { supabase } from "@/services/supabase";

const LOCATION_INTERVAL_MS = 10 * 60 * 1000;

const DISTANCE_INTERVAL_METERS = 10000;

export default function DriverTrackingScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [tracking, setTracking] = useState(false);

  const [starting, setStarting] = useState(false);

  const [progress, setProgress] = useState(0);

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  const sendLocation = async (latitude: number, longitude: number) => {
    if (!id) return;

    console.log("========== CHECKPOINT DEBUG ==========");
    console.log("RIDE ID:", id);
    console.log("LAT:", latitude);
    console.log("LNG:", longitude);

    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select(
        `
        id,
        source,
        destination,
        pickup_lat,
        pickup_lng,
        destination_lat,
        destination_lng,
        route_distance_km
      `,
      )
      .eq("id", id)
      .single();

    console.log("TRACKING RIDE:", JSON.stringify(rideData, null, 2));

    if (rideError) {
      console.log("TRACKING RIDE LOAD ERROR:", rideError);

      return;
    }

    const { data, error } = await processRideCheckpoint(
      id,
      latitude,
      longitude,
    );

    if (error) {
      console.log("CHECKPOINT ERROR:", error);

      return;
    }

    console.log("Ride progress:", data);

    setProgress(data || 0);

    setLastUpdated(new Date().toLocaleTimeString());
  };

  const startTracking = async () => {
    try {
      setStarting(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location required",
          "Driver location is required while the journey is active.",
        );

        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await sendLocation(current.coords.latitude, current.coords.longitude);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,

          timeInterval: LOCATION_INTERVAL_MS,

          distanceInterval: DISTANCE_INTERVAL_METERS,
        },

        async (location) => {
          await sendLocation(
            location.coords.latitude,
            location.coords.longitude,
          );
        },
      );

      setTracking(true);
    } catch (error: any) {
      console.log("TRACKING ERROR:", error);

      Alert.alert(
        "Unable to start journey tracking",
        error?.message || "Something went wrong.",
      );
    } finally {
      setStarting(false);
    }
  };

  const stopTracking = () => {
    locationSubscription.current?.remove();

    locationSubscription.current = null;

    setTracking(false);
  };

  return (
    <Animated.View
      style={[
        styles.screen,

        {
          opacity: fade,

          transform: [
            {
              translateY: slide,
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </Pressable>

        <View>
          <Text style={styles.title}>Journey tracking</Text>

          <Text style={styles.subtitle}>Driver safety tracking</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View
          style={[styles.trackingIcon, tracking && styles.trackingIconActive]}
        >
          <MaterialCommunityIcons
            name={
              tracking ? "navigation-variant" : "navigation-variant-outline"
            }
            size={38}
            color={tracking ? colors.primary : colors.textMuted}
          />
        </View>

        <Text style={styles.heroTitle}>
          {tracking ? "Journey tracking active" : "Ready to start journey"}
        </Text>

        <Text style={styles.heroText}>
          {tracking
            ? "Saathi is recording efficient journey checkpoints."
            : "Start tracking when your intercity journey begins."}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Journey progress</Text>

            <Text style={styles.progressValue}>{progress}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,

                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.checkpoints}>
            {[25, 50, 75, 100].map((checkpoint) => (
              <View key={checkpoint} style={styles.checkpoint}>
                <Ionicons
                  name={
                    progress >= checkpoint
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={18}
                  color={
                    progress >= checkpoint ? colors.success : colors.textMuted
                  }
                />

                <Text style={styles.checkpointText}>{checkpoint}%</Text>
              </View>
            ))}
          </View>
        </View>

        {!!lastUpdated && (
          <Text style={styles.updatedText}>
            Last location update: {lastUpdated}
          </Text>
        )}
      </View>

      {!tracking ? (
        <Pressable
          style={({ pressed }) => [
            styles.startButton,

            pressed && styles.pressed,

            starting && {
              opacity: 0.65,
            },
          ]}
          onPress={startTracking}
          disabled={starting}
        >
          {starting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="navigate" size={20} color="#FFFFFF" />

              <Text style={styles.startButtonText}>Start Journey</Text>
            </>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.stopButton,

            pressed && styles.pressed,
          ]}
          onPress={stopTracking}
        >
          <Ionicons
            name="stop-circle-outline"
            size={20}
            color={colors.danger}
          />

          <Text style={styles.stopButtonText}>Stop local tracking</Text>
        </Pressable>
      )}

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.primary}
        />

        <Text style={styles.infoText}>
          Saathi uses periodic location snapshots instead of continuous map
          streaming to reduce battery and tracking costs.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    ...typography.title,
    fontSize: 22,
  },

  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 2,
  },

  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.card,
  },

  trackingIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  trackingIconActive: {
    backgroundColor: colors.primaryLight,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  heroText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  progressContainer: {
    width: "100%",
    marginTop: spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  progressValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },

  progressTrack: {
    height: 9,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.sm,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },

  checkpoints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },

  checkpoint: {
    alignItems: "center",
    gap: 4,
  },

  checkpointText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  updatedText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },

  startButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  stopButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  stopButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800",
  },

  pressed: {
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
