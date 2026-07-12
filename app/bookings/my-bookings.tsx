import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  cancelBooking,
  confirmRideCompletion,
  getMyBookings,
} from "../../services/booking.service";

import { supabase } from "../../services/supabase";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

const STATUS_STYLES: Record<
  string,
  {
    bg: string;
    text: string;
    label: string;
  }
> = {
  confirmed: {
    bg: colors.primaryLight,
    text: colors.primary,
    label: "Confirmed",
  },

  pending: {
    bg: "#FEF3C7",
    text: colors.warning,
    label: "Pending",
  },

  cancelled: {
    bg: colors.dangerLight,
    text: colors.danger,
    label: "Cancelled",
  },

  completed: {
    bg: colors.successLight,
    text: colors.success,
    label: "Completed",
  },
};

function StatusBadge({ status }: { status: string }) {
  const statusStyle = STATUS_STYLES[status] ?? {
    bg: colors.surfaceMuted,
    text: colors.textSecondary,
    label: status,
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.bg,
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

  const slide = useRef(new Animated.Value(12)).current;

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
  }, [fade, index, slide]);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const ride = item.rides;

  const showConfirmButton =
    ride?.ride_status === "awaiting_confirmation" &&
    item.booking_status === "confirmed" &&
    !item.ride_completion_confirmed;

  const showCancelButton =
    item.booking_status !== "cancelled" && ride?.ride_status !== "completed";

  const showReviewButton = ride?.ride_status === "completed";

  const showSafetyButton =
    item.booking_status === "confirmed" && ride?.ride_status !== "completed";

  const hasActions = showConfirmButton || showCancelButton || showReviewButton;

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
        onPress={() => {
          router.push(`/rides/${item.ride_id}`);
        }}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.routeRow}>
              <Feather name="map-pin" size={16} color={colors.primary} />

              <Text style={styles.routeText} numberOfLines={1}>
                {ride?.source} → {ride?.destination}
              </Text>
            </View>

            <StatusBadge status={item.booking_status} />
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={colors.textMuted} />

              <Text style={styles.detailText}>{ride?.ride_date}</Text>
            </View>

            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={colors.textMuted} />

              <Text style={styles.detailText}>{ride?.ride_time}</Text>
            </View>

            <View style={styles.detailItem}>
              <Feather name="tag" size={14} color={colors.textMuted} />

              <Text style={styles.detailText}>₹{ride?.price}</Text>
            </View>
          </View>

          {showSafetyButton && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();

                router.push({
                  pathname: "/safety/[bookingId]",
                  params: {
                    bookingId: item.id,
                  },
                });
              }}
              style={({ pressed }) => [
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
              <View style={styles.safetyIcon}>
                <Ionicons name="shield-checkmark" size={19} color="#BE185D" />
              </View>

              <View style={styles.safetyContent}>
                <Text style={styles.safetyButtonText}>Saathi Safety Mode</Text>

                <Text style={styles.safetyButtonSubtitle}>
                  Safety monitoring for this ride
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={19} color="#FFFFFF" />
            </Pressable>
          )}

          {hasActions && (
            <View style={styles.actionsRow}>
              {showConfirmButton && (
                <Pressable
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={(event) => {
                    event.stopPropagation();

                    onConfirm(item.id);
                  }}
                >
                  <Feather
                    name="check-circle"
                    size={15}
                    color={colors.surface}
                  />

                  <Text style={styles.primaryActionText}>
                    Confirm Completed
                  </Text>
                </Pressable>
              )}

              {showReviewButton && (
                <Pressable
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={(event) => {
                    event.stopPropagation();

                    router.push({
                      pathname: "/bookings/review",
                      params: {
                        rideId: ride.id,
                        driverId: ride.driver_id,
                      },
                    });
                  }}
                >
                  <Feather name="star" size={15} color={colors.primary} />

                  <Text style={styles.secondaryActionText}>Review Driver</Text>
                </Pressable>
              )}

              {showCancelButton && (
                <Pressable
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={(event) => {
                    event.stopPropagation();

                    onCancel(item.id);
                  }}
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

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);

      return;
    }

    const { data, error } = await getMyBookings(user.id);

    if (error) {
      console.log("LOAD BOOKINGS ERROR:", error);

      setLoading(false);

      return;
    }

    setBookings(data || []);

    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await loadBookings();

    setRefreshing(false);
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "No",
          style: "cancel",
        },

        {
          text: "Yes",
          style: "destructive",

          onPress: async () => {
            const { error } = await cancelBooking(bookingId);

            if (error) {
              Alert.alert("Unable to cancel booking", error.message);

              return;
            }

            await loadBookings();
          },
        },
      ],
    );
  };

  const handleConfirmRide = async (bookingId: string) => {
    const { error } = await confirmRideCompletion(bookingId);

    if (error) {
      Alert.alert("Unable to confirm ride", error.message);

      return;
    }

    Alert.alert("Ride confirmed", "You confirmed that the ride was completed.");

    await loadBookings();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconBadge}>
          <Feather name="calendar" size={26} color={colors.textMuted} />
        </View>

        <Text style={styles.emptyTitle}>No bookings yet</Text>

        <Text style={styles.emptySubtitle}>
          Your ride bookings will show up here
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
          colors={[colors.primary]}
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
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadow.card,
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
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },

  routeText: {
    ...typography.body,
    fontWeight: "600",
    marginLeft: spacing.xs,
    flexShrink: 1,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  safetyButton: {
    minHeight: 58,
    backgroundColor: "#BE185D",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },

  safetyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  safetyContent: {
    flex: 1,
  },

  safetyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  safetyButtonSubtitle: {
    color: "#FCE7F3",
    fontSize: 11,
    marginTop: 2,
  },

  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },

  primaryAction: {
    backgroundColor: colors.primary,
  },

  primaryActionText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },

  secondaryAction: {
    backgroundColor: colors.primaryLight,
  },

  secondaryActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  dangerAction: {
    backgroundColor: colors.dangerLight,
  },

  dangerActionText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
