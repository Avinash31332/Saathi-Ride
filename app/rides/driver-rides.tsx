import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

import { getMyRides } from "../../services/ride.service";
import { supabase } from "../../services/supabase";

function AnimatedRideCard({ children }: { children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 45,
      bounciness: 2,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 45,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function MyRidesScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            event: "*",
            schema: "public",
            table: "rides",
            filter: `driver_id=eq.${user.id}`,
          },
          () => {
            console.log("Driver ride updated");

            loadRides();
          },
        )
        .subscribe((status) => {
          console.log("Driver Rides Realtime:", status);
        });
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

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await getMyRides(user.id);

    if (error) {
      console.log("LOAD RIDES ERROR:", error);
    }

    setRides(data || []);
    setLoading(false);
  };

  const handleJourneyPress = (ride: any) => {
    /*
     * Ride has not started.
     *
     * Keep using the existing driver
     * tracking screen because this is
     * where Start Journey currently lives.
     */

    if (ride.ride_status === "active") {
      router.push({
        pathname: "/rides/driver-tracking/[id]",

        params: {
          id: ride.id,
        },
      });

      return;
    }

    /*
     * Journey already started.
     *
     * Open the unified My Journey screen.
     */

    if (
      ride.ride_status === "in_progress" ||
      ride.ride_status === "awaiting_confirmation"
    ) {
      router.push({
        pathname: "/journey/[rideId]",

        params: {
          rideId: ride.id,
        },
      });

      return;
    }
  };

  const statusStyle = (status: string) => {
    const map: Record<
      string,
      {
        bg: string;
        color: string;
      }
    > = {
      active: {
        bg: colors.primaryLight,
        color: colors.primary,
      },

      in_progress: {
        bg: colors.successLight,
        color: colors.success,
      },

      awaiting_confirmation: {
        bg: "#FFF7ED",
        color: "#C2410C",
      },

      completed: {
        bg: colors.successLight,
        color: colors.success,
      },

      cancelled: {
        bg: colors.dangerLight,
        color: colors.danger,
      },
    };

    return (
      map[status] || {
        bg: colors.surfaceMuted,
        color: colors.textSecondary,
      }
    );
  };

  const formatStatus = (status: string) => {
    return status
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.title}>My Rides</Text>

          <Text style={styles.subtitle}>Manage your published journeys</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="car-sport-outline" size={23} color={colors.primary} />
        </View>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={38} color={colors.textMuted} />
            </View>

            <Text style={styles.emptyTitle}>No rides yet</Text>

            <Text style={styles.emptyText}>
              Your published intercity rides will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = statusStyle(item.ride_status);

          const canOpenJourney =
            item.ride_status === "active" ||
            item.ride_status === "in_progress" ||
            item.ride_status === "awaiting_confirmation";

          const journeyStarted =
            item.ride_status === "in_progress" ||
            item.ride_status === "awaiting_confirmation";

          return (
            <AnimatedRideCard>
              <View style={styles.headerRow}>
                <View style={styles.routeIcon}>
                  <Ionicons name="navigate" size={17} color={colors.primary} />
                </View>

                <View style={styles.routeContent}>
                  <Text style={styles.route} numberOfLines={2}>
                    {item.source}
                  </Text>

                  <View style={styles.routeArrowRow}>
                    <View style={styles.routeLine} />

                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={colors.textMuted}
                    />

                    <View style={styles.routeLine} />
                  </View>

                  <Text style={styles.route} numberOfLines={2}>
                    {item.destination}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: badge.bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: badge.color,
                      },
                    ]}
                  >
                    {formatStatus(item.ride_status)}
                  </Text>
                </View>
              </View>

              {item.women_only && (
                <View style={styles.womenBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#BE185D" />

                  <Text style={styles.womenBadgeText}>Women Only Ride</Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={styles.metaLabel}>Date</Text>

                    <Text style={styles.metaValue}>{item.ride_date}</Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={styles.metaLabel}>Time</Text>

                    <Text style={styles.metaValue}>{item.ride_time}</Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <Ionicons
                      name="people-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={styles.metaLabel}>Seats</Text>

                    <Text style={styles.metaValue}>{item.available_seats}</Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <Ionicons
                      name="cash-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={styles.metaLabel}>Price</Text>

                    <Text style={styles.metaValue}>₹{item.price}</Text>
                  </View>
                </View>
              </View>

              {canOpenJourney && (
                <Pressable
                  style={({ pressed }) => [
                    journeyStarted ? styles.trackingButton : styles.startButton,

                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleJourneyPress(item)}
                >
                  <Ionicons
                    name={journeyStarted ? "radio" : "navigate"}
                    size={18}
                    color={journeyStarted ? colors.success : "#FFFFFF"}
                  />

                  <Text
                    style={
                      journeyStarted
                        ? styles.trackingButtonText
                        : styles.startButtonText
                    }
                  >
                    {journeyStarted ? "Open My Journey" : "Start Journey"}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={journeyStarted ? colors.success : "#FFFFFF"}
                  />
                </Pressable>
              )}
            </AnimatedRideCard>
          );
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  title: {
    ...typography.title,
    fontSize: 25,
  },

  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  emptyText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  routeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  routeContent: {
    flex: 1,
  },

  route: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  routeArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    width: 70,
    marginVertical: 4,
  },

  routeLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  womenBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },

  womenBadgeText: {
    color: "#BE185D",
    fontSize: 11,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
  },

  metaItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
  },

  metaIcon: {
    width: 31,
    height: 31,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 1,
  },

  startButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },

  trackingButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  trackingButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
