import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";
import SectionTitle from "@/components/ui/SectionTitle";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  passenger: any;
  onPress?: () => void;
}

export default function NextPassengerCard({ passenger, onPress }: Props) {
  if (!passenger) {
    return null;
  }

  const passengerName = passenger.profiles?.full_name || "Passenger";

  const pickupName = passenger.pickup_name || "Pickup location";

  const seats = Number(passenger.seats_booked || 1);

  const pickupProgress = Math.min(
    100,
    Math.max(0, Number(passenger.pickup_route_progress || 0)),
  );

  return (
    <PressScale onPress={onPress} style={styles.card}>
      <SectionTitle icon="location-outline" title="Next passenger stop" />

      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="person-add-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>PICKUP</Text>

          <Text style={styles.location} numberOfLines={2}>
            {pickupName}
          </Text>

          <View style={styles.passengerRow}>
            <Ionicons
              name="person-outline"
              size={13}
              color={colors.textMuted}
            />

            <Text style={styles.passengerText} numberOfLines={1}>
              {passengerName}
            </Text>

            <View style={styles.separator} />

            <Ionicons
              name="people-outline"
              size={13}
              color={colors.textMuted}
            />

            <Text style={styles.passengerText}>
              {seats} seat{seats !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.progressBadge}>
          <Text style={styles.progressValue}>
            {Math.round(pickupProgress)}%
          </Text>

          <Text style={styles.progressLabel}>ROUTE</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.actionText}>View passenger details</Text>

        <Ionicons name="chevron-forward" size={17} color={colors.primary} />
      </View>
    </PressScale>
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

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    ...typography.overline,
    fontSize: 9,
    color: colors.primary,
  },

  location: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },

  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 4,
  },

  passengerText: {
    ...typography.caption,
    flexShrink: 1,
  },

  separator: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
    marginHorizontal: 2,
  },

  progressBadge: {
    minWidth: 55,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },

  progressValue: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
  },

  progressLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: colors.primary,
    marginTop: 1,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginRight: spacing.xs,
  },
});
