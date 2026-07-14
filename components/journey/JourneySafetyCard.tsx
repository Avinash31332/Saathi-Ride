import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  safetyActive: boolean;
  trustedContactCount: number;
  routeDeviation: boolean;
  onPress: () => void;
}

export default function JourneySafetyCard({
  safetyActive,
  trustedContactCount,
  routeDeviation,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color={colors.primary}
          />
        </View>

        <Text style={styles.headerTitle}>Ride safety</Text>
      </View>

      <View
        style={[
          styles.statusContainer,
          safetyActive && styles.statusContainerActive,
          routeDeviation && styles.statusContainerDanger,
        ]}
      >
        <View
          style={[
            styles.statusIcon,
            safetyActive && styles.statusIconActive,
            routeDeviation && styles.statusIconDanger,
          ]}
        >
          <Ionicons
            name={
              routeDeviation
                ? "warning"
                : safetyActive
                  ? "shield-checkmark"
                  : "shield-outline"
            }
            size={24}
            color={
              routeDeviation
                ? colors.danger
                : safetyActive
                  ? colors.success
                  : colors.textMuted
            }
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.statusTitle}>
            {routeDeviation
              ? "Route deviation detected"
              : safetyActive
                ? "Safety tracking active"
                : "Journey monitoring active"}
          </Text>

          <Text style={styles.statusSubtitle}>
            {routeDeviation
              ? "Your journey may have moved away from the planned route."
              : `${trustedContactCount} trusted contact${
                  trustedContactCount !== 1 ? "s" : ""
                } connected`}
          </Text>
        </View>

        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: routeDeviation ? colors.danger : colors.success,
            },
          ]}
        />
      </View>

      <View style={styles.routeStatus}>
        <Ionicons
          name={routeDeviation ? "warning-outline" : "checkmark-circle-outline"}
          size={18}
          color={routeDeviation ? colors.danger : colors.success}
        />

        <Text
          style={[
            styles.routeStatusText,
            routeDeviation && styles.routeStatusDanger,
          ]}
        >
          {routeDeviation
            ? "Possible route deviation detected"
            : "Journey is following the planned route"}
        </Text>
      </View>

      <PressScale onPress={onPress} style={styles.button}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary} />

        <Text style={styles.buttonText}>Open Safety Mode</Text>

        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </PressScale>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  headerTitle: {
    ...typography.subheading,
    fontSize: 15,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  statusContainerActive: {
    backgroundColor: colors.successLight,
  },

  statusContainerDanger: {
    backgroundColor: colors.dangerLight,
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  statusIconActive: {
    backgroundColor: colors.surface,
  },

  statusIconDanger: {
    backgroundColor: colors.surface,
  },

  content: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  statusSubtitle: {
    ...typography.caption,
    marginTop: 3,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },

  routeStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  routeStatusText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },

  routeStatusDanger: {
    color: colors.danger,
  },

  button: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },

  buttonText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
