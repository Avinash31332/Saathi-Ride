import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

interface Props {
  pin: string | number;
}

export default function BoardingPinCard({ pin }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="keypad-outline" size={23} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>YOUR BOARDING PIN</Text>

        <Text style={styles.pin}>{pin}</Text>

        <Text style={styles.hint}>
          Share this PIN with the driver only after entering the vehicle
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  content: {
    flex: 1,
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
  },

  pin: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 5,
    color: colors.textPrimary,
    marginVertical: 3,
  },

  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});
