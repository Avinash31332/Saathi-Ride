import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
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

function getStatusStyle(status: string) {
  const styles: Record<
    string,
    {
      label: string;
      background: string;
      text: string;
    }
  > = {
    confirmed: {
      label: "Confirmed",
      background: colors.primaryLight,
      text: colors.primary,
    },

    completed: {
      label: "Completed",
      background: colors.successLight,
      text: colors.success,
    },

    cancelled: {
      label: "Cancelled",
      background: colors.dangerLight,
      text: colors.danger,
    },
  };

  return (
    styles[status] || {
      label: status,
      background: colors.surfaceMuted,
      text: colors.textSecondary,
    }
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyle = getStatusStyle(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.background,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: statusStyle.text,
          },
        ]}
      >
        {statusStyle.label}
      </Text>
    </View>
  );
}

function BookingCard({
  item,
  index,
  onCancel,
  onConfirm,
}: {
  item: any;
  index: number;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(16)).current;

  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),

      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      speed: 40,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 40,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const ride = item.rides;

  const pickupName = item.pickup_name || ride.source;

  const dropName = item.drop_name || ride.destination;

  const isSegmentBooking =
    item.pickup_route_progress != null && item.drop_route_progress != null;

  const segmentDistance =
    item.pickup_route_distance_km != null && item.drop_route_distance_km != null
      ? Number(item.drop_route_distance_km) -
        Number(item.pickup_route_distance_km)
      : Number(ride.route_distance_km || 0);

  const rideDistance = Number(ride.route_distance_km || 0);

  const ridePrice = Number(ride.price || 0);

  const pricePerSeat =
    isSegmentBooking && rideDistance > 0 && segmentDistance > 0
      ? Math.max(1, Math.ceil(ridePrice * (segmentDistance / rideDistance)))
      : ridePrice;

  const totalPrice = pricePerSeat * Number(item.seats_booked || 1);

  const showConfirmButton =
    ride.ride_status === "awaiting_confirmation" &&
    item.booking_status === "confirmed" &&
    !item.ride_completion_confirmed;

  const showCancelButton =
    item.booking_status !== "cancelled" &&
    item.booking_status !== "completed" &&
    ride.ride_status !== "completed" &&
    ride.ride_status !== "in_progress";

  const showReviewButton = ride.ride_status === "completed";

  const showSafetyButton = item.booking_status === "confirmed";

  const openBooking = () => {
    if (isSegmentBooking) {
      router.push({
        pathname: "/rides/[id]",

        params: {
          id: item.ride_id,

          pickupName,
          dropName,

          pickupLat: item.pickup_lat,
          pickupLng: item.pickup_lng,

          dropLat: item.drop_lat,
          dropLng: item.drop_lng,

          pickupProgress: item.pickup_route_progress,

          dropProgress: item.drop_route_progress,

          pickupRouteDistanceKm: item.pickup_route_distance_km,

          dropRouteDistanceKm: item.drop_route_distance_km,

          segmentDistanceKm: segmentDistance,

          segmentPrice: pricePerSeat,
        },
      });

      return;
    }

    router.push(`/rides/${item.ride_id}`);
  };

  return (
    <Animated.View
      style={{
        opacity: fade,

        transform: [
          {
            translateY: slide,
          },

          {
            scale,
          },
        ],
      }}
    >
      <Pressable
        onPress={openBooking}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerBadges}>
              {isSegmentBooking && (
                <View style={styles.segmentBadge}>
                  <Ionicons
                    name="git-branch-outline"
                    size={13}
                    color={colors.primary}
                  />

                  <Text style={styles.segmentBadgeText}>Route Segment</Text>
                </View>
              )}

              {ride.women_only && (
                <View style={styles.womenBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#BE185D" />

                  <Text style={styles.womenBadgeText}>Women Only</Text>
                </View>
              )}
            </View>

            <StatusBadge status={item.booking_status} />
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeVisual}>
              <View style={[styles.routeDot, styles.pickupDot]} />

              <View style={styles.routeLine} />

              <View style={[styles.routeDot, styles.dropDot]} />
            </View>

            <View style={styles.routeContent}>
              <View style={styles.routeStop}>
                <Text style={styles.stopLabel}>PICKUP</Text>

                <Text style={styles.routeText} numberOfLines={2}>
                  {pickupName}
                </Text>
              </View>

              <View style={styles.routeSpacing} />

              <View style={styles.routeStop}>
                <Text style={styles.stopLabel}>DROP</Text>

                <Text style={styles.routeText} numberOfLines={2}>
                  {dropName}
                </Text>
              </View>
            </View>
          </View>

          {isSegmentBooking && (
            <View style={styles.driverRouteHint}>
              <Ionicons name="car-outline" size={14} color={colors.textMuted} />

              <Text style={styles.driverRouteHintText} numberOfLines={1}>
                Driver route: {ride.source} → {ride.destination}
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={colors.textMuted} />

              <Text style={styles.detailText}>{ride.ride_date}</Text>
            </View>

            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={colors.textMuted} />

              <Text style={styles.detailText}>{ride.ride_time}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={colors.textMuted}
              />

              <Text style={styles.detailText}>
                {segmentDistance.toFixed(1)} km
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.textMuted}
              />

              <Text style={styles.detailText}>
                {item.seats_booked} seat
                {Number(item.seats_booked) > 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View style={styles.fareRow}>
            <View>
              <Text style={styles.fareLabel}>Your fare</Text>

              <Text style={styles.fareHint}>
                ₹{pricePerSeat} × {item.seats_booked} seat
                {Number(item.seats_booked) > 1 ? "s" : ""}
              </Text>
            </View>

            <Text style={styles.fareValue}>₹{totalPrice}</Text>
          </View>

          {item.boarding_pin &&
            !item.boarding_verified &&
            item.booking_status === "confirmed" && (
              <View style={styles.pinCard}>
                <View style={styles.pinIcon}>
                  <Ionicons
                    name="keypad-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.pinContent}>
                  <Text style={styles.pinLabel}>BOARDING PIN</Text>

                  <Text style={styles.pinValue}>{item.boarding_pin}</Text>
                </View>

                <Text style={styles.pinHint}>
                  Tell driver only when boarding
                </Text>
              </View>
            )}

          {item.boarding_verified && (
            <View style={styles.boardedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={colors.success}
              />

              <Text style={styles.boardedText}>Boarding verified</Text>
            </View>
          )}

          {(showConfirmButton ||
            showCancelButton ||
            showReviewButton ||
            showSafetyButton) && (
            <View style={styles.actionsRow}>
              {showSafetyButton && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/rides/journey/[rideId]",

                      params: {
                        rideId: item.ride_id,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.safetyButton,

                    pressed && {
                      transform: [
                        {
                          scale: 0.97,
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />

                  <Text style={styles.safetyButtonText}>My Journey</Text>
                </Pressable>
              )}

              {showConfirmButton && (
                <Pressable
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => onConfirm(item.id)}
                >
                  <Feather name="check-circle" size={15} color="#FFFFFF" />

                  <Text style={styles.primaryActionText}>
                    Confirm Completed
                  </Text>
                </Pressable>
              )}

              {showReviewButton && (
                <Pressable
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() =>
                    router.push({
                      pathname: "/bookings/review",

                      params: {
                        rideId: ride.id,

                        driverId: ride.driver_id,
                      },
                    })
                  }
                >
                  <Feather name="star" size={15} color={colors.primary} />

                  <Text style={styles.secondaryActionText}>Review Driver</Text>
                </Pressable>
              )}

              {showCancelButton && (
                <Pressable
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={() => onCancel(item.id)}
                >
                  <Feather name="x-circle" size={15} color={colors.danger} />

                  <Text style={styles.dangerActionText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setBookings([]);
      setLoading(false);
      setRefreshing(false);

      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        rides (
          id,
          driver_id,
          source,
          destination,
          ride_date,
          ride_time,
          price,
          women_only,
          ride_status,
          route_distance_km
        )
      `,
      )
      .eq("passenger_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log("LOAD BOOKINGS ERROR:", error);

      Alert.alert("Unable to load bookings", error.message);
    }

    setBookings(data || []);

    setLoading(false);

    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, []),
  );

  useEffect(() => {
    let channel: any;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      channel = supabase
        .channel(`passenger-bookings-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `passenger_id=eq.${user.id}`,
          },
          () => {
            console.log("Passenger booking updated");

            loadBookings();
          },
        )
        .subscribe((status) => {
          console.log("Passenger Booking Realtime:", status);
        });
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);

    loadBookings();
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel booking?",
      "Your reserved route segment will become available to other passengers.",
      [
        {
          text: "Keep Booking",
          style: "cancel",
        },

        {
          text: "Cancel Booking",
          style: "destructive",

          onPress: async () => {
            const { error } = await supabase
              .from("bookings")
              .update({
                booking_status: "cancelled",
              })
              .eq("id", bookingId);

            if (error) {
              Alert.alert("Unable to cancel", error.message);

              return;
            }

            await loadBookings();
          },
        },
      ],
    );
  };

  const handleConfirmRide = async (bookingId: string) => {
    const { error } = await supabase.rpc("confirm_ride_completion", {
      booking_id: bookingId,
    });

    if (error) {
      Alert.alert("Unable to confirm ride", error.message);

      return;
    }

    await loadBookings();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconBadge}>
          <Ionicons name="ticket-outline" size={29} color={colors.primary} />
        </View>

        <Text style={styles.emptyTitle}>No bookings yet</Text>

        <Text style={styles.emptySubtitle}>
          Your route segment bookings will show up here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item, index }) => (
        <BookingCard
          item={item}
          index={index}
          onCancel={handleCancelBooking}
          onConfirm={handleConfirmRide}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.xl,
  },

  emptyIconBadge: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    marginBottom: spacing.xs,
  },

  emptySubtitle: {
    ...typography.subtitle,
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  headerBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },

  segmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
  },

  segmentBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
  },

  womenBadgeText: {
    color: "#BE185D",
    fontSize: 11,
    fontWeight: "700",
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  routeContainer: {
    flexDirection: "row",
  },

  routeVisual: {
    width: 18,
    alignItems: "center",
    marginRight: spacing.sm,
  },

  routeDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  pickupDot: {
    backgroundColor: colors.primary,
  },

  dropDot: {
    backgroundColor: colors.danger,
  },

  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 37,
    backgroundColor: colors.border,
    marginVertical: 3,
  },

  routeContent: {
    flex: 1,
  },

  routeStop: {
    minHeight: 42,
  },

  routeSpacing: {
    height: 9,
  },

  stopLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  routeText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },

  driverRouteHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginTop: spacing.sm,
  },

  driverRouteHintText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
  },

  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },

  fareLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  fareHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  fareValue: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.primary,
  },

  pinCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  pinIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  pinContent: {
    marginRight: spacing.sm,
  },

  pinLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
  },

  pinValue: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 4,
    marginTop: 1,
  },

  pinHint: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "right",
    lineHeight: 14,
  },

  boardedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.md,
  },

  boardedText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },

  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },

  safetyButton: {
    backgroundColor: colors.primary,
  },

  safetyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  primaryAction: {
    backgroundColor: colors.success,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  secondaryAction: {
    backgroundColor: colors.primaryLight,
  },

  secondaryActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  dangerAction: {
    backgroundColor: colors.dangerLight,
  },

  dangerActionText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
