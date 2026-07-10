import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { router } from "expo-router";

import { supabase } from "../../services/supabase";
import {
  getMyBookings,
  cancelBooking,
  confirmRideCompletion,
} from "../../services/booking.service";
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from "../../constants/theme";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  confirmed: {
    bg: colors.primaryLight,
    text: colors.primary,
    label: "Confirmed",
  },
  pending: { bg: "#FEF3C7", text: colors.warning, label: "Pending" },
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
  const s = STATUS_STYLES[status] ?? {
    bg: colors.surfaceMuted,
    text: colors.textSecondary,
    label: status,
  };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
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
  }, []);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  const showConfirmButton =
    item.rides.ride_status === "awaiting_confirmation" &&
    item.booking_status === "confirmed" &&
    !item.ride_completion_confirmed;

  const showCancelButton = item.booking_status !== "cancelled";
  const showReviewButton = item.rides.ride_status === "completed";

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }, { scale }] }}
    >
      <Pressable
        onPress={() => router.push(`/rides/${item.ride_id}`)}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.routeRow}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.rides.source} → {item.rides.destination}
              </Text>
            </View>
            <StatusBadge status={item.booking_status} />
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>{item.rides.ride_date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>{item.rides.ride_time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="tag" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>₹{item.rides.price}</Text>
            </View>
          </View>

          {(showConfirmButton || showCancelButton || showReviewButton) && (
            <View style={styles.actionsRow}>
              {showConfirmButton && (
                <Pressable
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => onConfirm(item.id)}
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
                  onPress={() =>
                    router.push({
                      pathname: "/bookings/review",
                      params: {
                        rideId: item.rides.id,
                        driverId: item.rides.driver_id,
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

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getMyBookings(user.id);

    setBookings(data || []);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      {
        text: "No",
      },
      {
        text: "Yes",
        onPress: async () => {
          const { error } = await cancelBooking(bookingId);

          if (error) {
            Alert.alert(error.message);
            return;
          }

          loadBookings();
        },
      },
    ]);
  };

  const handleConfirmRide = async (bookingId: string) => {
    const { error } = await confirmRideCompletion(bookingId);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Ride confirmed");

    loadBookings();
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
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
