import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";
import SectionTitle from "@/components/ui/SectionTitle";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  passengers: any[];
  progress: number;
  rideSource: string;
  rideDestination: string;

  onVerifyBoarding: (bookingId: string) => void;

  onPassengerPress: (passengerId: string) => void;
}

function clampProgress(value: any) {
  const progress = Number(value || 0);

  return Math.min(100, Math.max(0, progress));
}

export default function JourneyPassengerList({
  passengers,
  progress,
  rideSource,
  rideDestination,
  onVerifyBoarding,
  onPassengerPress,
}: Props) {
  const currentProgress = clampProgress(progress);

  return (
    <View style={styles.card}>
      <SectionTitle
        icon="people-outline"
        title={`Passengers · ${passengers.length}`}
      />

      {passengers.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.emptyTitle}>No passengers yet</Text>

          <Text style={styles.emptySubtitle}>
            Confirmed passengers will appear here
          </Text>
        </View>
      ) : (
        passengers.map((passenger, index) => {
          const boarded = Boolean(passenger.boarding_verified);

          const pickupProgress = clampProgress(passenger.pickup_route_progress);

          const dropProgress = clampProgress(
            passenger.drop_route_progress ?? 100,
          );

          const dropped =
            Boolean(passenger.passenger_dropped_at) ||
            currentProgress >= dropProgress;

          const upcoming = currentProgress < pickupProgress;

          const currentlyAtPickup =
            currentProgress >= pickupProgress && !boarded;

          let status = "Travelling";

          let statusType: "waiting" | "boarding" | "active" | "completed" =
            "active";

          if (dropped) {
            status = "Drop reached";
            statusType = "completed";
          } else if (upcoming) {
            status = "Waiting for pickup";
            statusType = "waiting";
          } else if (currentlyAtPickup) {
            status = "Boarding pending";
            statusType = "boarding";
          }

          const segmentRange = dropProgress - pickupProgress;

          const segmentProgress =
            segmentRange > 0
              ? clampProgress(
                  ((currentProgress - pickupProgress) / segmentRange) * 100,
                )
              : 0;

          const passengerName = passenger.profiles?.full_name || "Passenger";

          const pickupName = passenger.pickup_name || rideSource;

          const dropName = passenger.drop_name || rideDestination;

          const seats = Number(passenger.seats_booked || 1);

          return (
            <PressScale
              key={passenger.id}
              onPress={() => {
                if (!boarded && !dropped) {
                  onVerifyBoarding(passenger.id);

                  return;
                }

                onPassengerPress(passenger.passenger_id);
              }}
              style={[
                styles.passengerCard,

                index > 0 && styles.passengerSpacing,
              ]}
            >
              <View style={styles.passengerHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>

                <View style={styles.passengerContent}>
                  <Text style={styles.passengerName} numberOfLines={1}>
                    {passengerName}
                  </Text>

                  <Text style={styles.seatText}>
                    {seats} seat
                    {seats !== 1 ? "s" : ""}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,

                    statusType === "active" && styles.statusActive,

                    statusType === "boarding" && styles.statusBoarding,

                    statusType === "completed" && styles.statusCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,

                      statusType === "active" && styles.statusTextActive,

                      statusType === "boarding" && styles.statusTextBoarding,

                      statusType === "completed" && styles.statusTextCompleted,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeVisual}>
                  <View style={styles.pickupDot} />

                  <View style={styles.routeLine} />

                  <View style={styles.dropDot} />
                </View>

                <View style={styles.routeContent}>
                  <View>
                    <Text style={styles.routeLabel}>PICKUP</Text>

                    <Text style={styles.routeName} numberOfLines={1}>
                      {pickupName}
                    </Text>
                  </View>

                  <View style={styles.routeGap} />

                  <View>
                    <Text style={styles.routeLabel}>DROP</Text>

                    <Text style={styles.routeName} numberOfLines={1}>
                      {dropName}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Passenger journey</Text>

                <Text style={styles.progressValue}>
                  {Math.round(segmentProgress)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,

                    {
                      width: `${segmentProgress}%`,
                    },
                  ]}
                />
              </View>

              {!boarded && !dropped && (
                <View style={styles.verifyRow}>
                  <View style={styles.verifyIcon}>
                    <Ionicons
                      name="keypad-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.verifyContent}>
                    <Text style={styles.verifyTitle}>Verify boarding PIN</Text>

                    <Text style={styles.verifySubtitle}>
                      Ask the passenger for their PIN
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.primary}
                  />
                </View>
              )}

              {boarded && !dropped && (
                <View style={styles.boardedRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                  />

                  <Text style={styles.boardedText}>Passenger boarded</Text>
                </View>
              )}

              {dropped && (
                <View style={styles.completedRow}>
                  <Ionicons
                    name="flag"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.completedText}>
                    Passenger destination reached
                  </Text>
                </View>
              )}
            </PressScale>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    ...typography.bodyMedium,
    marginTop: spacing.md,
  },

  emptySubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  passengerCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  passengerSpacing: {
    marginTop: spacing.md,
  },

  passengerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  passengerContent: {
    flex: 1,
  },

  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  seatText: {
    ...typography.caption,
    marginTop: 2,
  },

  statusBadge: {
    maxWidth: 120,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginLeft: spacing.sm,
  },

  statusActive: {
    backgroundColor: colors.successLight,
  },

  statusBoarding: {
    backgroundColor: colors.warningLight,
  },

  statusCompleted: {
    backgroundColor: colors.surfaceSecondary,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textSecondary,
  },

  statusTextActive: {
    color: colors.success,
  },

  statusTextBoarding: {
    color: colors.warning,
  },

  statusTextCompleted: {
    color: colors.textSecondary,
  },

  routeContainer: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },

  routeVisual: {
    width: 18,
    alignItems: "center",
    marginRight: spacing.sm,
  },

  pickupDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },

  dropDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },

  routeLine: {
    flex: 1,
    width: 2,
    minHeight: 27,
    backgroundColor: colors.borderStrong,
    marginVertical: 3,
  },

  routeContent: {
    flex: 1,
  },

  routeGap: {
    height: spacing.md,
  },

  routeLabel: {
    ...typography.overline,
    fontSize: 9,
  },

  routeName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 2,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  progressLabel: {
    ...typography.caption,
  },

  progressValue: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },

  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: "hidden",
    backgroundColor: colors.border,
  },

  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },

  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },

  verifyIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  verifyContent: {
    flex: 1,
  },

  verifyTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },

  verifySubtitle: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },

  boardedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },

  boardedText: {
    marginLeft: spacing.sm,
    fontSize: 11,
    fontWeight: "800",
    color: colors.success,
  },

  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },

  completedText: {
    marginLeft: spacing.sm,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
