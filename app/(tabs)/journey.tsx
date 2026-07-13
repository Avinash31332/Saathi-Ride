import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { useCallback, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
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

import { supabase } from "../../services/supabase";

type JourneyResult = {
  rideId: string;
  role: "driver" | "passenger";
};

async function findCurrentJourney(): Promise<{
  data: JourneyResult | null;
  error: any;
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("User not authenticated"),
    };
  }

  /*
   * PRIORITY 1
   *
   * User is currently driving a ride.
   */

  const { data: driverRide, error: driverRideError } = await supabase
    .from("rides")
    .select("id, ride_status, created_at")
    .eq("driver_id", user.id)
    .eq("ride_status", "in_progress")
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (driverRideError) {
    console.log("CURRENT DRIVER JOURNEY ERROR:", driverRideError);
  }

  if (driverRide) {
    return {
      data: {
        rideId: driverRide.id,
        role: "driver",
      },

      error: null,
    };
  }

  /*
   * PRIORITY 2
   *
   * User is travelling as passenger.
   *
   * Load confirmed bookings and inspect
   * the related ride status.
   */

  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      ride_id,
      booking_status,
      created_at,
      rides (
        id,
        ride_status
      )
    `,
    )
    .eq("passenger_id", user.id)
    .eq("booking_status", "confirmed")
    .order("created_at", {
      ascending: false,
    });

  if (bookingError) {
    return {
      data: null,
      error: bookingError,
    };
  }

  const activeBooking = bookings?.find(
    (booking: any) => booking.rides?.ride_status === "in_progress",
  );

  if (activeBooking) {
    return {
      data: {
        rideId: activeBooking.ride_id,
        role: "passenger",
      },

      error: null,
    };
  }

  return {
    data: null,
    error: null,
  };
}

export default function JourneyTabScreen() {
  const [loading, setLoading] = useState(true);

  const [journey, setJourney] = useState<JourneyResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(14)).current;

  const loadCurrentJourney = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await findCurrentJourney();

    if (error) {
      console.log("FIND CURRENT JOURNEY ERROR:", error);

      setError(error.message || "Unable to find current journey");

      setJourney(null);
      setLoading(false);

      return;
    }

    setJourney(data);
    setLoading(false);

    fade.setValue(0);
    slide.setValue(14);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  useFocusEffect(
    useCallback(() => {
      loadCurrentJourney();
    }, [loadCurrentJourney]),
  );

  const openJourney = () => {
    if (!journey) return;

    router.push({
      pathname: "/rides/journey/[rideId]",

      params: {
        rideId: journey.rideId,
      },
    });
  };

  const openRides = () => {
    router.push("/rides/my-rides" as any);
  };

  const openBookings = () => {
    router.push("/bookings/my-bookings" as any);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Ionicons name="navigate" size={27} color={colors.primary} />
        </View>

        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{
            marginTop: spacing.md,
          }}
        />

        <Text style={styles.loadingText}>Finding your current journey...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="warning-outline" size={30} color={colors.danger} />
        </View>

        <Text style={styles.emptyTitle}>Unable to load journey</Text>

        <Text style={styles.emptySubtitle}>{error}</Text>

        <Pressable
          onPress={loadCurrentJourney}
          style={({ pressed }) => [
            styles.retryButton,

            pressed && {
              transform: [
                {
                  scale: 0.97,
                },
              ],
            },
          ]}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />

          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!journey) {
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
          <Text style={styles.eyebrow}>MY JOURNEY</Text>

          <Text style={styles.title}>Your active ride</Text>

          <Text style={styles.subtitle}>
            Live journey tracking will appear here when your ride starts
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyVisual}>
            <View style={styles.routeLine} />

            <View style={[styles.routeDot, styles.routeDotTop]}>
              <Ionicons name="location" size={17} color="#FFFFFF" />
            </View>

            <View style={[styles.routeDot, styles.routeDotBottom]}>
              <Ionicons name="flag" size={15} color="#FFFFFF" />
            </View>

            <View style={styles.carIcon}>
              <Ionicons name="car-sport" size={31} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>No active journey</Text>

          <Text style={styles.emptySubtitle}>
            When you start driving or join a booked ride, your live journey,
            progress and safety tools will appear here.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={openBookings}
              style={({ pressed }) => [
                styles.secondaryButton,

                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="ticket-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.secondaryButtonText}>My Bookings</Text>
            </Pressable>

            <Pressable
              onPress={openRides}
              style={({ pressed }) => [
                styles.primaryButton,

                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="car-outline" size={18} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>My Rides</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MY JOURNEY</Text>

        <Text style={styles.title}>Journey active</Text>

        <Text style={styles.subtitle}>
          {journey.role === "driver"
            ? "You are driving this journey"
            : "You are travelling on this journey"}
        </Text>
      </View>

      <View style={styles.activeContainer}>
        <View style={styles.activeCard}>
          <View style={styles.activeTop}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>LIVE JOURNEY</Text>
            </View>

            <View style={styles.roleBadge}>
              <Ionicons
                name={
                  journey.role === "driver"
                    ? "car-sport-outline"
                    : "person-outline"
                }
                size={14}
                color={colors.primary}
              />

              <Text style={styles.roleText}>
                {journey.role === "driver" ? "Driver" : "Passenger"}
              </Text>
            </View>
          </View>

          <View style={styles.activeIcon}>
            <Ionicons name="navigate" size={42} color={colors.primary} />
          </View>

          <Text style={styles.activeTitle}>Your journey is in progress</Text>

          <Text style={styles.activeSubtitle}>
            Live progress, ride status and safety information are available now.
          </Text>

          <Pressable
            onPress={openJourney}
            style={({ pressed }) => [
              styles.openButton,

              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="navigate" size={19} color="#FFFFFF" />

            <Text style={styles.openButtonText}>Open My Journey</Text>

            <Ionicons name="chevron-forward" size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.syncText}>
          Journey status updates automatically
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xl,
  },

  loadingIcon: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1.2,
  },

  title: {
    ...typography.title,
    fontSize: 27,
    marginTop: 4,
  },

  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },

  emptyVisual: {
    width: 150,
    height: 155,
    position: "relative",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  routeLine: {
    position: "absolute",
    top: 23,
    bottom: 23,
    width: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
  },

  routeDot: {
    position: "absolute",
    width: 37,
    height: 37,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  routeDotTop: {
    top: 4,
    backgroundColor: colors.primary,
  },

  routeDotBottom: {
    bottom: 4,
    backgroundColor: colors.danger,
  },

  carIcon: {
    position: "absolute",
    top: 60,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 5,
    borderColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 310,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: "100%",
  },

  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },

  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    ...shadow.card,
  },

  primaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  activeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    ...shadow.card,
  },

  activeTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.success,
    letterSpacing: 0.7,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },

  activeIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },

  activeTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.lg,
  },

  activeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 290,
  },

  openButton: {
    width: "100%",
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    ...shadow.card,
  },

  openButtonText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: spacing.sm,
  },

  syncText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.md,
  },

  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  retryButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
