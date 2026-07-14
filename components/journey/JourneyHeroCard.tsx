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
}

export default function JourneyHeroCard({
  source,
  destination,
  progress,
  travelledDistance,
  remainingDistance,
  isDriver,
}: Props) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress || 0)));

  return (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <View style={styles.routeVisual}>
          <View style={styles.pickupDot} />

          <View style={styles.routeLine} />

          <View style={styles.dropDot} />
        </View>

        <View style={styles.routeContent}>
          <View>
            <Text style={styles.routeLabel}>
              {isDriver ? "START" : "YOUR PICKUP"}
            </Text>

            <Text style={styles.routeName} numberOfLines={2}>
              {source}
            </Text>
          </View>

          <View style={styles.routeGap} />

          <View>
            <Text style={styles.routeLabel}>
              {isDriver ? "DESTINATION" : "YOUR DROP"}
            </Text>

            <Text style={styles.routeName} numberOfLines={2}>
              {destination}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Journey progress</Text>

        <Text style={styles.progressValue}>{Math.round(safeProgress)}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${safeProgress}%`,
            },
          ]}
        />
      </View>

      <View style={styles.distanceRow}>
        <View style={styles.distanceItem}>
          <Text style={styles.distanceValue}>
            {travelledDistance.toFixed(1)}
          </Text>

          <Text style={styles.distanceLabel}>km travelled</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.distanceItem}>
          <Text style={styles.distanceValue}>
            {remainingDistance.toFixed(1)}
          </Text>

          <Text style={styles.distanceLabel}>km remaining</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  routeRow: {
    flexDirection: "row",
  },

  routeVisual: {
    width: 22,
    alignItems: "center",
    marginRight: spacing.md,
  },

  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
  },

  routeLine: {
    flex: 1,
    width: 2,
    minHeight: 45,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  routeContent: {
    flex: 1,
  },

  routeGap: {
    height: spacing.lg,
  },

  routeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.textMuted,
  },

  routeName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 3,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  progressValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.border,
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  distanceRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },

  distanceItem: {
    flex: 1,
    alignItems: "center",
  },

  divider: {
    width: 1,
    backgroundColor: colors.border,
  },

  distanceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  distanceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
