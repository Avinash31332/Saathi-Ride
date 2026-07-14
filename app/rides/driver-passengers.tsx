import { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../../services/supabase";
import { getRidePassengers } from "../../services/driver.service";
import { requestPassengerDrop } from "../../services/booking.service";
import { cancelRide } from "../../services/ride.service";

const colors = {
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };
const radius = { sm: 8, md: 12, lg: 16 };

export default function PassengersScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    let channel: any;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`driver-passengers-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
          },
          () => {
            loadData();
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

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getRidePassengers(user.id);

    setRides(data || []);
    setLoading(false);
  };

  const handleRequestDrop = async (booking: any) => {
    Alert.alert(
      "Request Drop",
      `Ask ${booking.profiles?.full_name} if they want to get off now?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Request",
          onPress: async () => {
            console.log("Booking ID:", booking.id);

            const result = await requestPassengerDrop(booking.id);

            console.log("REQUEST RESULT");
            console.log(result);

            if (result.error) {
              Alert.alert(result.error.message);
              return;
            }

            Alert.alert("Drop request sent.");

            loadData();
          },
        },
      ],
    );
  };

  const handleCancelRide = async (ride: any) => {
    Alert.alert(
      "Cancel Ride",
      `Are you sure you want to cancel the ride from ${ride.source} to ${ride.destination}? This cannot be undone.`,
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel Ride",
          style: "destructive",
          onPress: async () => {
            setCancellingId(ride.id);

            const { error } = await cancelRide(ride.id);

            setCancellingId(null);

            if (error) {
              Alert.alert("Error", error.message);
              return;
            }

            Alert.alert("Ride cancelled.");

            loadData();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      confirmed: { bg: colors.primaryLight, color: colors.primary },
      completed: { bg: colors.successLight, color: colors.success },
      cancelled: { bg: colors.dangerLight, color: colors.danger },
    };
    const style = map[status] || {
      bg: colors.surfaceMuted,
      color: colors.textSecondary,
    };
    return (
      <View style={[styles.badge, { backgroundColor: style.bg }]}>
        <Text style={[styles.badgeText, { color: style.color }]}>{status}</Text>
      </View>
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
            <Ionicons
              name="people-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No rides with passengers yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeaderRow}>
              <View style={styles.rideHeader}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.rideRoute}>
                  {item.source} → {item.destination}
                </Text>
              </View>

              {item.ride_status === "active" && (
                <TouchableOpacity
                  onPress={() => handleCancelRide(item)}
                  disabled={cancellingId === item.id}
                  hitSlop={8}
                  style={styles.cancelIconButton}
                >
                  {cancellingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color={colors.danger}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rideMetaRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.rideMeta}>{item.ride_date}</Text>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textMuted}
                style={{ marginLeft: spacing.md }}
              />
              <Text style={styles.rideMeta}>{item.ride_time}</Text>

              {item.ride_status === "cancelled" && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.dangerLight,
                      marginLeft: spacing.md,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.danger }]}>
                    Ride Cancelled
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionLabel}>Passengers</Text>

            {item.bookings?.map((booking: any) => (
              <View key={booking.id} style={styles.passengerCard}>
                <View style={styles.passengerHeader}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerName}>
                      {booking.profiles?.full_name}
                    </Text>
                    <Text style={styles.passengerPhone}>
                      {booking.profiles?.phone}
                    </Text>
                  </View>
                  {statusBadge(booking.booking_status)}
                </View>

                <Text style={styles.seatsText}>
                  Seats Booked:{" "}
                  <Text style={styles.seatsValue}>{booking.seats_booked}</Text>
                </Text>

                {item.ride_status === "active" &&
                  booking.booking_status === "confirmed" &&
                  !booking.drop_request_pending && (
                    <TouchableOpacity
                      style={styles.dropButton}
                      activeOpacity={0.85}
                      onPress={() => handleRequestDrop(booking)}
                    >
                      <Ionicons
                        name="exit-outline"
                        size={16}
                        color={colors.surface}
                      />
                      <Text style={styles.dropButtonText}>Request Drop</Text>
                    </TouchableOpacity>
                  )}

                {item.ride_status === "active" &&
                  booking.drop_request_pending && (
                    <View style={styles.pendingRow}>
                      <Ionicons
                        name="hourglass-outline"
                        size={14}
                        color={colors.warning}
                      />
                      <Text style={styles.pendingText}>
                        Waiting for passenger confirmation...
                      </Text>
                    </View>
                  )}

                {booking.booking_status === "completed" && (
                  <View style={styles.pendingRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.pendingText, { color: colors.success }]}
                    >
                      Passenger Dropped
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
  rideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cancelIconButton: {
    padding: 2,
  },
  rideRoute: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  rideMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  rideMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  passengerCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  passengerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  passengerPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
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
  seatsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  seatsValue: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dropButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: 6,
  },
  dropButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 13,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: 6,
  },
  pendingText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: "600",
  },
});
