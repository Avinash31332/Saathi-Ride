import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

interface Props {
  source: string;
  destination: string;

  progress: number;

  travelledDistance: number;
  remainingDistance: number;

  isDriver: boolean;

  milestones: {
    current: number;
    next: number | null;
    completed: number[];
  };

  // NEW (Passenger only)

  originalSource?: string;
  originalDestination?: string;

  pickupProgress?: number;
  dropProgress?: number;

  boarded?: boolean;
}

export default function JourneyHeroCard({
  source,
  destination,
  progress,
  travelledDistance,
  remainingDistance,
  isDriver,
  milestones,
  pickupProgress,
  dropProgress,
}: Props) {
  const safeProgress = Math.max(0, Math.min(progress, 100));
  const pickupProgressValue = Number(pickupProgress || 0);

  const dropProgressValue = Number(dropProgress || 100);

  const driverRemainingUntilPickup = Math.max(
    pickupProgressValue - safeProgress,
    0,
  );

  const passengerTripLength = Math.max(
    dropProgressValue - pickupProgressValue,
    0,
  );
  const steps = [25, 50, 75, 100];

  return (
    <View style={styles.card}>
      {/* Header */}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isDriver ? "Journey In Progress" : "Tracking Driver"}
          </Text>

          <Text style={styles.headerSubtitle}>
            {Math.round(safeProgress)}% Completed
          </Text>
        </View>

        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>
            {Math.round(safeProgress)}%
          </Text>
        </View>
      </View>

      {/* Route */}

      <View style={styles.routeContainer}>
        <View style={styles.routeIcons}>
          <View style={styles.pickupDot} />

          <View style={styles.routeLine} />

          <Ionicons name="flag" size={16} color={colors.success} />
        </View>

        <View style={styles.routeTexts}>
          <View>
            <Text style={styles.locationLabel}>
              {isDriver ? "START" : "PICKUP"}
            </Text>

            <Text style={styles.locationText}>{source}</Text>
          </View>

          <View style={{ height: 22 }} />

          <View>
            <Text style={styles.locationLabel}>
              {isDriver ? "DESTINATION" : "DROP"}
            </Text>

            <Text style={styles.locationText}>{destination}</Text>
          </View>
        </View>
      </View>

      {/* Timeline */}

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const completed = milestones.completed.includes(step);

          return (
            <React.Fragment key={step}>
              <View style={styles.step}>
                <View
                  style={[styles.circle, completed && styles.circleCompleted]}
                >
                  {completed && (
                    <Ionicons name="checkmark" size={10} color="white" />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepLabel,

                    completed && styles.stepLabelCompleted,
                  ]}
                >
                  {step === 100 ? "Finish" : `${step}%`}
                </Text>
              </View>

              {index !== steps.length - 1 && (
                <View
                  style={[
                    styles.connector,

                    completed && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Next milestone */}

      {milestones.next && (
        <View style={styles.nextCard}>
          <Ionicons name="navigate" size={18} color={colors.primary} />

          <Text style={styles.nextText}>
            Next milestone: {milestones.next}%
          </Text>
        </View>
      )}

      {/* Stats */}

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Ionicons name="car" size={22} color={colors.primary} />

          <Text style={styles.statValue}>
            {travelledDistance.toFixed(1)} km
          </Text>

          <Text style={styles.statLabel}>Travelled</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="location" size={22} color={colors.danger} />

          <Text style={styles.statValue}>
            {remainingDistance.toFixed(1)} km
          </Text>

          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  headerSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
  },

  progressBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },

  progressBadgeText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },

  routeContainer: {
    flexDirection: "row",
  },

  routeIcons: {
    alignItems: "center",
    marginRight: spacing.md,
  },

  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 55,
    backgroundColor: colors.border,
    marginVertical: 6,
  },

  routeTexts: {
    flex: 1,
  },

  locationLabel: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
  },

  locationText: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  timeline: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },

  step: {
    alignItems: "center",
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  circleCompleted: {
    backgroundColor: colors.primary,
  },

  connector: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
  },

  connectorCompleted: {
    backgroundColor: colors.primary,
  },

  stepLabel: {
    marginTop: 7,
    fontWeight: "700",
    fontSize: 11,
    color: colors.textMuted,
  },

  stepLabelCompleted: {
    color: colors.primary,
  },

  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  nextText: {
    marginLeft: 10,
    fontWeight: "700",
    color: colors.primary,
  },

  stats: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },

  statValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  statLabel: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
