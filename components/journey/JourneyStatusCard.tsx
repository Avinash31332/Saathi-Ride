import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import SectionTitle from "@/components/ui/SectionTitle";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  rideStatus?: string;
  lastLocationAt?: string | null;
  trackingMode?: string | null;
  lastCheckpoint?: number | null;
  progress: number;
}

function formatStatus(status?: string) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLastUpdate(value?: string | null) {
  if (!value) {
    return "Location unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Location unavailable";
  }

  return `Updated ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function JourneyStatusCard({
  rideStatus,
  lastLocationAt,
  trackingMode,
  lastCheckpoint,
  progress,
}: Props) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress || 0)));

  return (
    <View style={styles.card}>
      <SectionTitle icon="pulse-outline" title="Ride status" />

      <View style={styles.statusRow}>
        <View style={styles.statusIcon}>
          <Ionicons name="radio" size={19} color={colors.success} />
        </View>

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>{formatStatus(rideStatus)}</Text>

          <Text style={styles.statusSubtitle}>
            {formatLastUpdate(lastLocationAt)}
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={19}
              color={colors.primary}
            />
          </View>

          <Text style={styles.metricValue}>{trackingMode || "normal"}</Text>

          <Text style={styles.metricLabel}>Tracking</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons name="flag-outline" size={19} color={colors.primary} />
          </View>

          <Text style={styles.metricValue}>{lastCheckpoint ?? 0}</Text>

          <Text style={styles.metricLabel}>Checkpoint</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Feather name="navigation" size={18} color={colors.primary} />
          </View>

          <Text style={styles.metricValue}>{Math.round(safeProgress)}%</Text>

          <Text style={styles.metricLabel}>Route</Text>
        </View>
      </View>
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

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    ...typography.bodyMedium,
    fontWeight: "800",
  },

  statusSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: colors.success,
  },

  metrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  metric: {
    flex: 1,
    alignItems: "center",
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textTransform: "capitalize",
  },

  metricLabel: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 1,
  },

  metricDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
});
