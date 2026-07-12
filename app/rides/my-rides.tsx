import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { startRideJourney } from "../../services/journey-tracking.service";

import { getMyRides } from "../../services/ride.service";
import { supabase } from "../../services/supabase";

const colors = {
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  success: "#059669",
  successLight: "#ECFDF5",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };
const radius = { sm: 8, md: 12, lg: 16 };

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

  const startJourney = async (ride: any) => {
    if (
      ride.destination_lat == null ||
      ride.destination_lng == null ||
      ride.route_distance_km == null
    ) {
      Alert.alert(
        "Route information missing",
        "This ride does not contain the route data required for journey tracking.",
      );

      return;
    }

    Alert.alert(
      "Start journey?",
      "Journey Tracking will use your location while this ride is active.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Start Journey",
          onPress: async () => {
            try {
              const mode = await startRideJourney(
                ride.id,

                Number(ride.destination_lat),

                Number(ride.destination_lng),

                Number(ride.route_distance_km),
              );

              await loadRides();

              Alert.alert(
                "Journey started",
                mode === "safety"
                  ? "Enhanced Safety Tracking is active because a female passenger is travelling on this ride."
                  : "Journey Progress Tracking is active.",
              );
            } catch (error: any) {
              Alert.alert(
                "Unable to start journey",
                error?.message || "Journey tracking could not be started.",
              );
            }
          },
        },
      ],
    );
  };

  const openActiveJourney = (ride: any) => {
    router.push({
      pathname: "/rides/journey/[rideId]" as any,

      params: {
        rideId: ride.id,
      },
    });
  };

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
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      active: { bg: colors.primaryLight, color: colors.primary },
      completed: { bg: colors.successLight, color: colors.success },
      cancelled: { bg: colors.dangerLight, color: colors.danger },
    };
    return (
      map[status] || { bg: colors.surfaceMuted, color: colors.textSecondary }
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="car-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              You have not created any rides yet
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = statusStyle(item.ride_status);
          return (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.routeRow}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.route}>
                    {item.source} → {item.destination}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {item.ride_status}
                  </Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>{item.ride_date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>{item.ride_time}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {item.available_seats} seats
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="cash-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>₹{item.price}</Text>
                </View>
              </View>

              {item.ride_status === "active" && (
                <TouchableOpacity
                  style={styles.startButton}
                  activeOpacity={0.85}
                  onPress={() => startJourney(item)}
                >
                  <Ionicons name="navigate" size={17} color={colors.surface} />

                  <Text style={styles.startButtonText}>Start Journey</Text>
                </TouchableOpacity>
              )}

              {item.ride_status === "in_progress" && (
                <TouchableOpacity
                  style={styles.trackingButton}
                  activeOpacity={0.85}
                  onPress={() => openActiveJourney(item)}
                >
                  <Ionicons name="radio" size={17} color={colors.success} />

                  <Text style={styles.trackingButtonText}>
                    Journey Tracking Active
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg * 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg * 2,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  route: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  completeButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 13,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    gap: 6,
  },

  startButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },

  trackingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    gap: 6,
  },

  trackingButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700",
  },
});
