import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";

interface Props {
  isDriver: boolean;
}

export default function JourneyHeader({ isDriver }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          {isDriver ? "DRIVER JOURNEY" : "MY JOURNEY"}
        </Text>

        <Text style={styles.title}>Journey in progress</Text>
      </View>

      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />

        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  content: {
    flex: 1,
    paddingRight: spacing.md,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.2,
  },

  title: {
    ...typography.title,
    fontSize: 25,
    marginTop: 3,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: colors.success,
  },
});
