import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";
import SectionTitle from "@/components/ui/SectionTitle";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  driver: any;
  vehicle: any | null;
  onPress: () => void;
}

export default function JourneyDriverCard({ driver, vehicle, onPress }: Props) {
  const isVerified = driver?.driver_verification_status === "approved";

  return (
    <PressScale onPress={onPress} style={styles.card}>
      <SectionTitle icon="person-outline" title="Driver" />

      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {driver?.full_name || "Driver"}
            </Text>

            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={colors.success}
              />
            )}
          </View>

          <Text style={styles.driverStatus}>
            {isVerified ? "Verified driver" : "Driver"}
          </Text>

          {vehicle && (
            <View style={styles.vehicleRow}>
              <Ionicons
                name="car-sport-outline"
                size={14}
                color={colors.textMuted}
              />

              <Text style={styles.vehicleText} numberOfLines={1}>
                {vehicle.vehicle_name || "Vehicle"}
                {vehicle.vehicle_number ? ` · ${vehicle.vehicle_number}` : ""}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
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

  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  name: {
    ...typography.bodyMedium,
    fontWeight: "800",
    flexShrink: 1,
  },

  driverStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  vehicleText: {
    ...typography.caption,
    flex: 1,
  },
});
